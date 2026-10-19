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
  validateCaptionSegments,
  type CaptionLangCode,
  type CaptionSegment,
} from "../lib/captions";
import { formatTimecode } from "@repo-1/video-spec";

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
  const [step, setStep] = useState<Step>("config");
  const [phaseMsg, setPhaseMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [segments, setSegments] = useState<CaptionSegment[]>([]);
  const [dropped, setDropped] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  const kept = segments.filter((_, i) => !dropped.has(i));

  // Dọn timer/abort khi đóng modal giữa chừng.
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

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
    setPhaseMsg("Đang gửi file lên bridge…");
    const t0 = Date.now();
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed(Date.now() - t0), 500);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const form = new FormData();
      form.append("media", item.file, item.file.name);
      form.append("lang", lang);
      const res = await fetch(`${BRIDGE_URL}/api/caption`, {
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
          } else if (evt.type === "error") {
            throw new Error(evt.error || "Caption thất bại.");
          }
        }
      }
      if (!got) throw new Error("Bridge ngắt kết nối giữa chừng — thử lại.");
      setSegments(got);
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

  const apply = () => {
    if (kept.length === 0 || applying) return;
    setApplying(true);
    try {
      useStore.getState().addCaptionTrack(kept);
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
        aria-label="Tạo phụ đề tự động"
      >
        <div className="modal-head">
          <span>💬 Tạo phụ đề tự động</span>
          <button className="icon-btn" onClick={onClose} title="Đóng">
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
              <p className="muted small">
                Phụ đề được căn theo thời gian gốc của file (giây 0 = đầu file).
                Nếu clip đã bị cắt/dời trên timeline, bạn có thể chọn các câu phụ
                đề rồi kéo cho khớp.
              </p>
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
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
