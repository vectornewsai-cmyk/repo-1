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
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { BRIDGE_URL } from "../lib/bridgeUrl";
import { t, getLang, useLang } from "../i18n";
import { resolveBridgeApiError, type BridgeApiErrorBody } from "../lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web
import { resolveCaptionPhaseLabel } from "../lib/captionPhase63R1"; // Đợt 63 R1: localize phase caption theo locale (nợ R10 §10.4)
import type { StructuredErrorDetail } from "../lib/errorDetailSummary"; // Đợt 62 R5: errorDetail trong SSE error


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
  errorCode?: string;
  errorParams?: Record<string, string>;
  errorDetail?: StructuredErrorDetail | null;
}

function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Phase 9 R56 M2 — giữ <b>faster-whisper</b> khi câu đã qua key i18n:
 * key chứa {engine} = "faster-whisper", tách ra để bọc lại bằng <b>.
 */
function boldEngine(text: string): ReactNode {
  const [a, b] = text.split("faster-whisper");
  if (b === undefined) return text;
  return (
    <>
      {a}
      <b>faster-whisper</b>
      {b}
    </>
  );
}

export function CaptionModal({ onClose }: Props) {
  const uiLang = useLang(); // re-render khi đổi ngôn ngữ
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
    () => collectProjectCaptions(spec.tracks, t),
    [spec.tracks, uiLang]
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
    if (!item.file) throw new Error(t("caption.mediaGone"));
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
      const j = (await res.json()) as BridgeApiErrorBody;
      throw new Error(resolveBridgeApiError(j, t, t("bgremove.bridgeHttp", { status: String(res.status) })));
    }
    if (!res.ok || !res.body) {
      throw new Error(
        t("common.bridgeConn", { url: BRIDGE_URL })
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
          // Đợt 63 R1: localize phase theo locale qua phase KEY (bridge gửi
          // kèm message vi — hiển thị message nguyên vẹn làm locale en vẫn
          // thấy tiếng Việt, nợ R10 §10.4). Fallback message bridge →
          // processing khi phase lạ; không bao giờ hiện key thô.
          setPhaseMsg(resolveCaptionPhaseLabel(evt.phase, evt.message, getLang(), t("caption.processing")));
        } else if (evt.type === "done") {
          got = validateCaptionSegments(evt.segments);
          // R4: chỉ job caption gốc mới có words (job dịch thì không).
          if (endpoint === "/api/caption") {
            setWords(validateCaptionWords(evt.words));
          }
        } else if (evt.type === "error") {
          throw new Error(resolveBridgeApiError(evt, t, t("caption.failed")));
        }
      }
    }
    if (!got) throw new Error(t("caption.bridgeDropped"));
    return got;
  };

  const start = async () => {
    const item = candidates.find((m) => m.id === mediaId);
    if (!item?.file) {
      setError(t("caption.noMedia"));
      return;
    }
    setError(null);
    setStep("running");
    setSegments([]);
    setDropped(new Set());
    setWords([]);
    setSegmentsEn(null);
    setDroppedEn(new Set());
    setPhaseMsg(t("caption.uploading"));
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
        setPhaseMsg(t("caption.translating"));
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
        setError(t("caption.cancelled"));
      } else {
        setError((e as Error).message || t("caption.failed"));
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
    // Đợt 59 P5: gắn anchor vào body trước khi click — như mọi helper tải
    // file khác trong app (ExportPanel/projectRepo/archive/sharePage/
    // HistoryPanel). Probe đã chứng minh gắn/không gắn KHÔNG quyết định
    // tên file (V3 rời DOM vẫn giữ tên ASCII); tên file được giữ nhờ
    // exportProject chuẩn hoá base về ASCII (xem dưới).
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /** Phase 9 D6: xuất toàn bộ phụ đề project (không chỉ segment review). */
  const exportProject = (fmt: "srt" | "vtt") => {
    if (projectCaptions.cues.length === 0) return;
    // Đợt 59 P5: tên file phải ASCII-safe — Chrome trên VM này bỏ qua
    // a.download khi tên chứa dấu tiếng Việt nên "Dự án mẫu.srt" tải về
    // thành tên chung "download" (headed P5 lần chạy 1–3: 6 file
    // "download*" liên tiếp, nội dung đúng). Probe /tmp/round59-p5/
    // probe-download.mjs đã phân biệt: chỉ tên không-ASCII mất tên
    // (V1), tên ASCII giữ đúng dù anchor rời DOM (V3). NFD + bỏ dấu kết
    // hợp + đ→d để "Dự án mẫu" → "Du an mau" (giữ khoảng trắng như các
    // helper tải file khác trong app).
    const base =
      (spec.meta.name || "phu-de")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[\\/\\?%*:|"<>]/g, "")
        .trim() || "phu-de";
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
      const { cues, errors } = parseSubtitleFile(text, t);
      if (cues.length === 0) {
        setError(
          errors.length > 0
            ? t("caption.noCues", {
                details: errors
                  .map((e) =>
                    t("caption.cueError", { block: String(e.block), reason: e.reason }),
                  )
                  .join("; "),
              })
            : t("caption.noCuesInFile")
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
          ? t("caption.importedWithErrors", {
              n: String(cues.length),
              bad: String(errors.length),
              details: errors
                .map((e) =>
                  t("caption.cueError", { block: String(e.block), reason: e.reason }),
                )
                .join("; "),
            })
          : t("caption.imported", { n: String(cues.length), file: file.name })
      );
      setStep("review");
    } catch (e) {
      setError(t("caption.readFileFailed", { error: (e as Error).message }));
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
          historyLabel: t("caption.translateTo", { lang: targetLang.toUpperCase() }),
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
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("caption.title")}
      >
        <div className="modal-head">
          <span>{t("caption.titleIcon")}</span>
          <button className="icon-btn" onClick={onClose} title={t("common.close")} aria-label={t("common.close")}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {step === "config" && (
            <>
              <p className="muted">
                {boldEngine(t("caption.recognizeWith", { engine: "faster-whisper" }))}
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
                <p className="warn">{t("caption.noMediaInLibrary")}</p>
              )}
              <label className="field">
                <span>{t("caption.spokenLang")}</span>
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
                <span>{t("caption.translateToLabel")}</span>
                <select
                  value={targetLang}
                  onChange={(e) =>
                    setTargetLang(e.target.value as "" | TranslateTargetCode)
                  }
                >
                  <option value="">{t("caption.noTranslate")}</option>
                  {TRANSLATE_TARGET_LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              {targetLang && (
                <p className="muted small">
                  {boldEngine(t("caption.translateWith", { engine: "faster-whisper" }))}
                </p>
              )}
              <p className="muted small">{t("caption.alignNote")}</p>
              {/* Phase 9 R4: nhập SRT/VTT có sẵn, không cần chạy caption. */}
              <p>
                <span className="muted">{t("caption.orImport")}{" "}</span>
                <input
                  type="file"
                  accept=".srt,.vtt,text/plain"
                  aria-label={t("caption.importFile")}
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
                <span className="muted">{t("caption.exportProject")}{" "}</span>
                <button
                  onClick={() => exportProject("srt")}
                  disabled={projectCaptions.cues.length === 0}
                >
                  ⬇ SRT project
                </button>{" "}
                <button
                  onClick={() => exportProject("vtt")}
                  disabled={projectCaptions.cues.length === 0}
                >
                  ⬇ VTT project
                </button>
              </p>
              {projectCaptions.cues.length > 0 ? (
                <p className="muted small">
                  {t("caption.exportIncludes", {
                    n: String(projectCaptions.cues.length),
                    tracks: projectCaptions.trackLabels.join(", "),
                  })}
                </p>
              ) : (
                <p className="muted small">{t("caption.exportEmpty")}</p>
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
              <p className="muted">{t("caption.running", { elapsed: fmtElapsed(elapsed) })}</p>
              <button onClick={cancel}>
                {t("bgremove.cancel")}
              </button>
            </div>
          )}

          {step === "review" && (
            <>
              <p>
                {dropped.size > 0
                  ? t("caption.found", {
                      n: String(segments.length),
                      dropped: String(dropped.size),
                    })
                  : t("caption.foundPlain", { n: String(segments.length) })}
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
                    {t("caption.karaokeHint", { words: String(words.length) })}
                  </label>{" "}
                  <label>
                    {t("caption.highlightColor")}{" "}
                    <input
                      type="color"
                      value={highlightColor}
                      disabled={!karaokeEnabled}
                      onChange={(e) => setHighlightColor(e.target.value)}
                    />
                  </label>
                </p>
              ) : (
                <p className="muted">{t("caption.noWordTimestamps")}</p>
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
                      title={dropped.has(i) ? t("caption.keepSentence") : t("caption.dropSentence")}
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
                  onClick={() => downloadText("phu-de.srt", formatSrt(kept))}
                  disabled={kept.length === 0}
                >
                  {t("caption.exportSrt")}
                </button>{" "}
                <button
                  onClick={() => downloadText("phu-de.vtt", formatVtt(kept))}
                  disabled={kept.length === 0}
                >
                  {t("caption.exportVtt")}
                </button>
              </p>
              {importNote && <p className="muted">{importNote}</p>}
              {segmentsEn && (
                <>
                  <p style={{ marginTop: 12 }}>
                    {droppedEn.size > 0
                      ? t("caption.translated", {
                          n: String(segmentsEn.length),
                          lang: targetLang.toUpperCase(),
                          dropped: String(droppedEn.size),
                          track: translatedTrackLabel(targetLang),
                        })
                      : t("caption.translatedPlain", {
                          n: String(segmentsEn.length),
                          lang: targetLang.toUpperCase(),
                          track: translatedTrackLabel(targetLang),
                        })}
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
                            droppedEn.has(i) ? t("caption.keepSentence") : t("caption.dropSentence")
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

        {/* Phase 9 R60 Q3: nút text trong modal này dùng <button> trần +
            className="primary" (mẫu footer SilenceModal/BeatSyncModal).
            KHÔNG dùng .tbtn — đó là nút tròn icon 36×36 (padding 0), chữ
            dài tràn ra ngoài, chồng lên nhau và bị .modal cắt ở mép phải
            (nợ đợt 59 P4 §6 / P5 §4.5). */}
        <div className="modal-actions">
          {step === "config" && (
            <>
              <button onClick={onClose}>
                {t("common.close")}
              </button>
              <button
                className="primary"
                onClick={start}
                disabled={candidates.length === 0}
              >
                {t("caption.start")}
              </button>
            </>
          )}
          {step === "review" && (
            <>
              <button onClick={() => setStep("config")}>
                {t("caption.redo")}
              </button>
              <button
                className="primary"
                onClick={apply}
                disabled={kept.length === 0 || applying}
              >
                {t("caption.apply", { n: String(kept.length) })}
                {targetLang && keptEn.length > 0 &&
                  t("caption.applyExtra", {
                    m: String(keptEn.length),
                    lang: targetLang.toUpperCase(),
                  })}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
