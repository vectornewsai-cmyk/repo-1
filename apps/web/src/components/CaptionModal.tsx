/**
 * CaptionModal — tạo phụ đề tự động bằng faster-whisper chạy LOCAL (R1-072).
 *
 * Luồng:
 *   1. config: chọn file video/audio + ngôn ngữ
 *   2. running: POST /api/caption, đọc NDJSON stream → hiện phase + thời gian
 *   3. review: xem trước danh sách câu (bỏ câu sai nếu muốn) → áp dụng
 *   4. Áp dụng: tạo track "Phụ đề" với 1 text clip / câu (1 bước undo)
 *
 * Không có browser test — logic thuần nằm ở lib/captions.ts (đã có test Node).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import type { MediaItem } from "../media";
import {
  CAPTION_LANGS,
  TRANSLATE_TARGET_LANGS,
  translatedTrackLabel,
  validateCaptionSegments,
  validateCaptionWords,
  type CaptionLangCode,
  type CaptionSegment,
  type CaptionWord,
  type TranslateTargetCode,
} from "../lib/captions";
import { formatTimecode } from "@repo-1/video-spec";
import {
  collectProjectCaptions,
  formatSrt,
  formatVtt,
  parseSubtitleFile,
} from "../lib/subtitles";

const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

type Step = "config" | "running" | "review";

interface Props {
  onClose: () => void;
}

interface NdjsonEvent {
  type: "phase" | "done" | "error";
  phase?: string;
  message?: string;
  language?: string;
  audioDurationSec?: number;
  transcribeTimeSec?: number;
  count?: number;
  segments?: unknown;
  words?: unknown;
  error?: string;
}

function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function CaptionModal({ onClose }: Props) {
  const media = useStore((s) => s.media);
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);

  // Chỉ video/audio có file gốc mới caption được.
  const candidates: MediaItem[] = useMemo(
    () => media.filter((m) => (m.kind === "video" || m.kind === "audio") && m.file),
    [media]
  );

  // Mặc định: media của clip đang chọn (nếu là video/audio), ngược lại file đầu.
  const defaultMediaId = useMemo(() => {
    const sel = selection[0];
    if (sel) {
      const track = spec.tracks.find((t) => t.id === sel.trackId);
      const clip = track?.clips.find((c) => c.id === sel.clipId) as
        | { src?: string }
        | undefined;
      const src = clip?.src;
      if (src) {
        const hit = candidates.find((m) => m.name === src);
        if (hit) return hit.id;
      }
    }
    return candidates[0]?.id ?? "";
  }, [selection, spec.tracks, candidates]);

  const [mediaId, setMediaId] = useState(defaultMediaId);
  const [lang, setLang] = useState<CaptionLangCode>("vi");
  // R1-080: "" = không dịch; chọn đích → sau caption sẽ dịch và tạo track thứ 2.
  const [targetLang, setTargetLang] = useState<"" | TranslateTargetCode>("");
  const [step, setStep] = useState<Step>("config");
  const [phaseMsg, setPhaseMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [segments, setSegments] = useState<CaptionSegment[]>([]);
  const [dropped, setDropped] = useState<Set<number>>(new Set());
  // Phase 9 R4: word timestamps từ lần caption (để gắn karaoke). Track
  // dịch không có words nên không karaoke.
  const [words, setWords] = useState<CaptionWord[]>([]);
  const [karaokeEnabled, setKaraokeEnabled] = useState(true);
  const [highlightColor, setHighlightColor] = useState("#ffff00");
  // Phase 9 R4: ghi chú sau khi nhập SRT/VTT (vd: "bỏ 2 cue hỏng").
  const [importNote, setImportNote] = useState<string | null>(null);
  // R1-080: bản dịch (null = không dịch)
  const [segmentsEn, setSegmentsEn] = useState<CaptionSegment[] | null>(null);
  const [droppedEn, setDroppedEn] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  const kept = segments.filter((_, i) => !dropped.has(i));
  const keptEn = (segmentsEn ?? []).filter((_, i) => !droppedEn.has(i));

  // Phase 9 D6: toàn bộ phụ đề của project (mọi track phụ đề) để xuất ở
  // cấp project — khác với nút xuất ở bước review (chỉ segment đang giữ).
  const projectCaptions = useMemo(
    () => collectProjectCaptions(spec.tracks),
    [spec.tracks]
  );

  // Dọn timer/abort khi đóng modal giữa chừng.
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  /**
   * POST 1 job caption/translate lên bridge, đọc NDJSON stream → segments.
   * Dùng chung cho /api/caption và /api/caption/translate (R1-080).
   */
  const runJob = async (
    endpoint: string,
    item: MediaItem,
    fields: Record<string, string>,
    ctrl: AbortController
  ): Promise<CaptionSegment[]> => {
    const form = new FormData();
    if (!item.file) throw new Error("File media không còn tồn tại.");
    form.append("media", item.file, item.file.name);
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    const res = await fetch(`${BRIDGE_URL}${endpoint}`, {
      method: "POST",
      body: form,
      signal: ctrl.signal,
    });
    // Lỗi validate (4xx/503): bridge trả JSON thường, chưa stream.
    const ct = res.headers.get("content-type") || "";
    if (!res.ok && ct.includes("application/json")) {
      const j = (await res.json()) as { error?: string };
      throw new Error(j.error || `Bridge lỗi HTTP ${res.status}.`);
    }
    if (!res.ok || !res.body) {
      throw new Error(
        `Không kết nối được bridge (${BRIDGE_URL}). Hãy chạy: cd server/bridge && npm start`
      );
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let got: CaptionSegment[] | null = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        let evt: NdjsonEvent;
        try {
          evt = JSON.parse(line) as NdjsonEvent;
        } catch {
          continue; // dòng rác — bỏ qua, không fail cả luồng
        }
        if (evt.type === "phase") {
          setPhaseMsg(evt.message || evt.phase || "Đang xử lý…");
        } else if (evt.type === "done") {
          got = validateCaptionSegments(evt.segments);
          // R4: chỉ job caption gốc mới có words (job dịch thì không).
          if (endpoint === "/api/caption") {
            setWords(validateCaptionWords(evt.words));
          }
        } else if (evt.type === "error") {
          throw new Error(evt.error || "Caption thất bại.");
        }
      }
    }
    if (!got) throw new Error("Bridge ngắt kết nối giữa chừng — thử lại.");
    return got;
  };

  const start = async () => {
    const item = candidates.find((m) => m.id === mediaId);
    if (!item?.file) {
      setError("Chưa chọn file video/audio để tạo phụ đề.");
      return;
    }
    setError(null);
    setStep("running");
    setSegments([]);
    setDropped(new Set());
    setWords([]);
    setSegmentsEn(null);
    setDroppedEn(new Set());
    setPhaseMsg("Đang gửi file lên bridge…");
    const t0 = Date.now();
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed(Date.now() - t0), 500);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const got = await runJob("/api/caption", item, { lang }, ctrl);
      setSegments(got);
      // R1-080: dịch sang ngôn ngữ đích trên cùng file → track thứ 2.
      if (targetLang) {
        setPhaseMsg("Xong phụ đề gốc — bắt đầu dịch…");
        const gotEn = await runJob(
          "/api/caption/translate",
          item,
          { lang, target: targetLang },
          ctrl
        );
        setSegmentsEn(gotEn);
      }
      setStep("review");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setError("Đã hủy tạo phụ đề.");
      } else {
        setError((e as Error).message || "Caption thất bại.");
      }
      setStep("config");
    } finally {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  /** Phase 9 R4: tải 1 file text xuống máy user (xuất SRT/VTT). */
  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /** Phase 9 D6: xuất toàn bộ phụ đề project (không chỉ segment review). */
  const exportProject = (fmt: "srt" | "vtt") => {
    if (projectCaptions.cues.length === 0) return;
    const base =
      (spec.meta.name || "phu-de").trim().replace(/[\\/\\?%*:|"<>]/g, "") ||
      "phu-de";
    downloadText(
      `${base}.${fmt}`,
      fmt === "srt"
        ? formatSrt(projectCaptions.cues)
        : formatVtt(projectCaptions.cues)
    );
  };

  /** Phase 9 R4: nhập file .srt/.vtt → danh sách câu để review/áp dụng. */
  const importSubtitleFile = async (file: File) => {
    setError(null);
    setImportNote(null);
    try {
      const text = await file.text();
      const { cues, errors } = parseSubtitleFile(text);
      if (cues.length === 0) {
        setError(
          errors.length > 0
            ? `Không đọc được cue nào: ${errors
                .map((e) => `khối ${e.block}: ${e.reason}`)
                .join("; ")}`
            : "File không có cue phụ đề nào."
        );
        return;
      }
      setSegments(
        cues.map((c) => ({ start: c.start, end: c.end, text: c.text }))
      );
      setDropped(new Set());
      setWords([]); // SRT/VTT không chứa word timestamps → không karaoke.
      setSegmentsEn(null);
      setDroppedEn(new Set());
      setImportNote(
        errors.length > 0
          ? `Đã nhập ${cues.length} câu, bỏ ${errors.length} cue hỏng: ${errors
              .map((e) => `khối ${e.block}: ${e.reason}`)
              .join("; ")}`
          : `Đã nhập ${cues.length} câu từ ${file.name}.`
      );
      setStep("review");
    } catch (e) {
      setError(`Không đọc được file: ${(e as Error).message}`);
    }
  };

  const apply = () => {
    if (kept.length === 0 || applying) return;
    setApplying(true);
    try {
      // Phase 7 P6 (caption follow): tìm clip timeline cùng file nguồn để
      // phụ đề bám theo clip (trim/move/split tự kéo phụ đề). Ưu tiên clip
      // đang chọn; nếu không có thì clip cùng file đầu tiên. Không có clip
      // nào (caption file chưa lên timeline) thì giữ hành vi cũ: chữ tự do.
      const st = useStore.getState();
      const item = candidates.find((m) => m.id === mediaId);
      let source: { trackId: string; clipId: string } | undefined;
      if (item) {
        const sel = st.selection[0];
        const selTrack = sel
          ? st.spec.tracks.find((t) => t.id === sel.trackId)
          : undefined;
        const selClip = selTrack?.clips.find((c) => c.id === sel?.clipId) as
          | { kind?: string; src?: string }
          | undefined;
        if (selClip && (selClip.kind === "video" || selClip.kind === "audio") && selClip.src === item.name && sel) {
          source = { trackId: sel.trackId, clipId: sel.clipId };
        } else {
          outer: for (const t of st.spec.tracks) {
            for (const c of t.clips) {
              if ((c.kind === "video" || c.kind === "audio") && (c as { src?: string }).src === item.name) {
                source = { trackId: t.id, clipId: c.id };
                break outer;
              }
            }
          }
        }
      }
      // Phase 9 R4: gắn karaoke khi bật + có word timestamps (mapping theo
      // thời gian nên câu bị bỏ sẽ tự không nhận từ của nó).
      const karaokeWords = karaokeEnabled && words.length > 0 ? words : undefined;
      const styleOverride =
        karaokeWords && highlightColor !== "#ffff00"
          ? { highlightColor }
          : undefined;
      useStore.getState().addCaptionTrack(kept, {
        ...(source ? { source } : {}),
        ...(karaokeWords ? { words: karaokeWords } : {}),
        ...(styleOverride ? { style: styleOverride } : {}),
      });
      // R1-080: track phụ đề dịch (nếu có) — undo riêng từng track.
      if (targetLang && keptEn.length > 0) {
        useStore.getState().addCaptionTrack(keptEn, {
          label: translatedTrackLabel(targetLang),
          historyLabel: `Dịch phụ đề sang ${targetLang.toUpperCase()}`,
          ...(source ? { source } : {}),
        });
      }
      onClose();
    } finally {
      setApplying(false);
    }
  };

  const fps = spec.meta.fps || 30;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal caption-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tạo phụ đề tự động"
      >
        <div className="modal-head">
          <span>💬 Tạo phụ đề tự động</span>
          <button className="icon-btn" onClick={onClose} title="Đóng" aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {step === "config" && (
            <>
              <p className="muted">
                Nhận diện giọng nói bằng <b>faster-whisper</b> chạy 100% trên máy
                của bạn — không gửi audio lên cloud.
              </p>
              <label className="field">
                <span>File video / audio</span>
                <select
                  value={mediaId}
                  onChange={(e) => setMediaId(e.target.value)}
                  disabled={candidates.length === 0}
                >
                  {candidates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.kind === "video" ? "🎬" : "🎵"} {m.name}
                    </option>
                  ))}
                </select>
              </label>
              {candidates.length === 0 && (
                <p className="warn">
                  Chưa có file video/audio nào trong kho media. Hãy import file
                  trước.
                </p>
              )}
              <label className="field">
                <span>Ngôn ngữ nói trong video</span>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as CaptionLangCode)}
                >
                  {CAPTION_LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>🌐 Dịch sang</span>
                <select
                  value={targetLang}
                  onChange={(e) =>
                    setTargetLang(e.target.value as "" | TranslateTargetCode)
                  }
                >
                  <option value="">Không dịch</option>
                  {TRANSLATE_TARGET_LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              {targetLang && (
                <p className="muted small">
                  Dịch bằng <b>faster-whisper</b> chạy local (không cloud) —
                  hiện chỉ hỗ trợ sang tiếng Anh. Bản dịch được tạo thành
                  track phụ đề thứ 2, giữ nguyên track gốc.
                </p>
              )}
              <p className="muted small">
                Phụ đề được căn theo thời gian gốc của file (giây 0 = đầu file).
                Nếu clip đã bị cắt/dời trên timeline, bạn có thể chọn các câu phụ
                đề rồi kéo cho khớp.
              </p>
              {/* Phase 9 R4: nhập SRT/VTT có sẵn, không cần chạy caption. */}
              <p>
                <span className="muted">Hoặc nhập file phụ đề có sẵn: </span>
                <input
                  type="file"
                  accept=".srt,.vtt,text/plain"
                  aria-label="Nhập file SRT hoặc VTT"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importSubtitleFile(f);
                    e.target.value = "";
                  }}
                />
              </p>
              {importNote && <p className="muted">{importNote}</p>}
              {/* Phase 9 D6: xuất phụ đề cấp project — toàn bộ câu trên mọi
                  track phụ đề (kể cả câu đã lên timeline từ trước), khác
                  với nút xuất ở bước review (chỉ segment đang giữ). */}
              <p>
                <span className="muted">Xuất phụ đề của project: </span>
                <button
                  className="tbtn"
                  onClick={() => exportProject("srt")}
                  disabled={projectCaptions.cues.length === 0}
                >
                  ⬇ SRT project
                </button>{" "}
                <button
                  className="tbtn"
                  onClick={() => exportProject("vtt")}
                  disabled={projectCaptions.cues.length === 0}
                >
                  ⬇ VTT project
                </button>
              </p>
              {projectCaptions.cues.length > 0 ? (
                <p className="muted small">
                  Gồm {projectCaptions.cues.length} câu từ track:{" "}
                  {projectCaptions.trackLabels.join(", ")}. Title/chữ tự do
                  trên track khác không được xuất.
                </p>
              ) : (
                <p className="muted small">
                  Project chưa có phụ đề nào (tạo phụ đề hoặc nhập SRT/VTT
                  trước).
                </p>
              )}
              {error && <p className="error">{error}</p>}
            </>
          )}

          {step === "running" && (
            <div className="caption-running">
              <div className="spinner" aria-hidden />
              <p>
                <b>{phaseMsg}</b>
              </p>
              <p className="muted">Đã chạy {fmtElapsed(elapsed)} — cứ để cửa sổ mở.</p>
              <button className="tbtn" onClick={cancel}>
                Hủy
              </button>
            </div>
          )}

          {step === "review" && (
            <>
              <p>
                Tìm được <b>{segments.length}</b> câu phụ đề
                {dropped.size > 0 && (
                  <span className="muted"> (bỏ {dropped.size} câu)</span>
                )}
                . Kiểm tra lại rồi bấm Áp dụng:
              </p>
              {/* Phase 9 R4: karaoke — chỉ có khi bridge trả word timestamps. */}
              {words.length > 0 ? (
                <p>
                  <label>
                    <input
                      type="checkbox"
                      checked={karaokeEnabled}
                      onChange={(e) => setKaraokeEnabled(e.target.checked)}
                    />{" "}
                    🎤 Tô sáng từng từ theo giọng nói (karaoke, {words.length}{" "}
                    từ)
                  </label>{" "}
                  <label>
                    Màu tô sáng:{" "}
                    <input
                      type="color"
                      value={highlightColor}
                      disabled={!karaokeEnabled}
                      onChange={(e) => setHighlightColor(e.target.value)}
                    />
                  </label>
                </p>
              ) : (
                <p className="muted">
                  Lần caption này không có word timestamps nên không gắn được
                  karaoke (chữ vẫn tạo bình thường).
                </p>
              )}
              <div className="caption-list">
                {segments.map((s, i) => (
                  <div
                    key={i}
                    className={"caption-row" + (dropped.has(i) ? " dropped" : "")}
                  >
                    <span className="caption-tc">
                      {formatTimecode(s.start, fps)} → {formatTimecode(s.end, fps)}
                    </span>
                    <span className="caption-text">{s.text}</span>
                    <button
                      className="icon-btn sm"
                      title={dropped.has(i) ? "Giữ lại câu này" : "Bỏ câu này"}
                      onClick={() =>
                        setDropped((prev) => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          return next;
                        })
                      }
                    >
                      {dropped.has(i) ? "↩" : "✕"}
                    </button>
                  </div>
                ))}
              </div>
              {/* Phase 9 R4: xuất các câu đang giữ ra SRT/VTT chuẩn. */}
              <p>
                <button
                  className="tbtn"
                  onClick={() => downloadText("phu-de.srt", formatSrt(kept))}
                  disabled={kept.length === 0}
                >
                  ⬇ Xuất SRT
                </button>{" "}
                <button
                  className="tbtn"
                  onClick={() => downloadText("phu-de.vtt", formatVtt(kept))}
                  disabled={kept.length === 0}
                >
                  ⬇ Xuất VTT
                </button>
              </p>
              {importNote && <p className="muted">{importNote}</p>}
              {segmentsEn && (
                <>
                  <p style={{ marginTop: 12 }}>
                    🌐 <b>{segmentsEn.length}</b> câu dịch
                    ({targetLang.toUpperCase()})
                    {droppedEn.size > 0 && (
                      <span className="muted"> (bỏ {droppedEn.size} câu)</span>
                    )}
                    — sẽ tạo track {translatedTrackLabel(targetLang)}:
                  </p>
                  <div className="caption-list">
                    {segmentsEn.map((s, i) => (
                      <div
                        key={i}
                        className={
                          "caption-row" + (droppedEn.has(i) ? " dropped" : "")
                        }
                      >
                        <span className="caption-tc">
                          {formatTimecode(s.start, fps)} →{" "}
                          {formatTimecode(s.end, fps)}
                        </span>
                        <span className="caption-text">{s.text}</span>
                        <button
                          className="icon-btn sm"
                          title={
                            droppedEn.has(i) ? "Giữ lại câu này" : "Bỏ câu này"
                          }
                          onClick={() =>
                            setDroppedEn((prev) => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            })
                          }
                        >
                          {droppedEn.has(i) ? "↩" : "✕"}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="modal-actions">
          {step === "config" && (
            <>
              <button className="tbtn" onClick={onClose}>
                Đóng
              </button>
              <button
                className="tbtn primary"
                onClick={start}
                disabled={candidates.length === 0}
              >
                🎙 Bắt đầu tạo phụ đề
              </button>
            </>
          )}
          {step === "review" && (
            <>
              <button className="tbtn" onClick={() => setStep("config")}>
                ← Làm lại
              </button>
              <button
                className="tbtn primary"
                onClick={apply}
                disabled={kept.length === 0 || applying}
              >
                ✓ Áp dụng {kept.length} câu phụ đề
                {targetLang && keptEn.length > 0 &&
                  ` + ${keptEn.length} câu ${targetLang.toUpperCase()}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
