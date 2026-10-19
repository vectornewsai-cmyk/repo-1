/**
 * SceneModal — tự động tách cảnh video (R1-085).
 *
 * Luồng:
 *   1. config: chọn ngưỡng nhạy (0.1–0.9, mặc định 0.4)
 *   2. running: POST /api/scene (upload file gốc của clip), đọc NDJSON stream
 *   3. review: xem danh sách điểm cắt (timecode timeline), bỏ điểm không muốn
 *   4. Áp dụng: tách clip thành N clip con trong 1 bước undo
 *      (store.splitClipAtTimes)
 *
 * Không có browser test — logic thuần nằm ở lib/scene.ts (đã có test Node).
 */
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import {
  cutsToTimelineTimes,
  formatCutTime,
  type SceneDetectResult,
} from "../lib/scene";

const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

type Step = "config" | "running" | "review";

interface Props {
  trackId: string;
  clipId: string;
  onClose: () => void;
}

interface NdjsonEvent {
  type: "phase" | "done" | "error";
  phase?: string;
  message?: string;
  cuts?: unknown;
  duration?: number | null;
  threshold?: number;
  count?: number;
  error?: string;
}

function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function SceneModal({ trackId, clipId, onClose }: Props) {
  const [step, setStep] = useState<Step>("config");
  const [threshold, setThreshold] = useState(0.4);
  const [phase, setPhase] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<SceneDetectResult | null>(null);
  const [times, setTimes] = useState<number[]>([]);
  const [dropped, setDropped] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  const st = useStore.getState();
  const track = st.spec.tracks.find((t) => t.id === trackId);
  const clip = track?.clips.find((c) => c.id === clipId);
  const mediaItem = st.media.find(
    (m) => m.kind === "video" && m.file && clip && "src" in clip && m.name === (clip as { src: string }).src
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  if (!clip || clip.kind !== "video") {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="panel-head">Tách cảnh</div>
          <p>Không tìm thấy clip video đã chọn.</p>
          <button onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }

  const startDetect = async () => {
    if (!mediaItem?.file) {
      setError("Không có file gốc của clip (media đã bị xóa hoặc relink).");
      return;
    }
    setError(null);
    setStep("running");
    setPhase("Đang gửi file…");
    const started = Date.now();
    timerRef.current = window.setInterval(() => setElapsed(Date.now() - started), 500);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const fd = new FormData();
      fd.append("media", mediaItem.file, mediaItem.name);
      fd.append("threshold", String(threshold));
      // Chỉ quét trong khoảng nguồn của clip (tiết kiệm thời gian).
      fd.append("start", String(clip.in));
      fd.append("end", String(clip.out));
      const res = await fetch(`${BRIDGE_URL}/api/scene`, {
        method: "POST",
        body: fd,
        signal: ac.signal,
      });
      if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Bridge trả mã ${res.status}.`);
      }
      if (!res.body) throw new Error("Bridge không trả về stream.");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        buf += dec.decode(value ?? new Uint8Array(), { stream: !d });
        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as NdjsonEvent;
          if (ev.type === "phase") {
            setPhase(ev.message || ev.phase || "");
          } else if (ev.type === "done") {
            const cuts = Array.isArray(ev.cuts)
              ? ev.cuts.filter((c): c is number => typeof c === "number" && Number.isFinite(c))
              : [];
            const r: SceneDetectResult = {
              cuts,
              duration: ev.duration ?? null,
              threshold: ev.threshold ?? threshold,
              count: ev.count ?? cuts.length,
            };
            setResult(r);
            setTimes(cutsToTimelineTimes(clip, cuts));
            setDropped(new Set());
            setStep("review");
            done = true;
            break;
          } else if (ev.type === "error") {
            throw new Error(ev.error || "Tách cảnh thất bại.");
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(
        e instanceof Error ? e.message :
        `Không kết nối được bridge (${BRIDGE_URL}). Hãy chạy: cd server/bridge && npm start`
      );
      setStep("config");
    } finally {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const apply = () => {
    const kept = times.filter((t) => !dropped.has(t));
    if (kept.length === 0) {
      setError("Chưa chọn điểm cắt nào để tách.");
      return;
    }
    const n = useStore.getState().splitClipAtTimes(trackId, clipId, kept);
    if (n === 0) {
      setError("Không tách được — các điểm cắt quá sát mép clip.");
      return;
    }
    onClose();
  };

  const toggleDrop = (t: number) => {
    setDropped((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card scene-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">Tách cảnh tự động</div>

        {step === "config" && (
          <>
            <p className="muted">
              Quét chuyển cảnh trong clip bằng FFmpeg (chạy local, không gửi đi đâu).
              Mỗi cảnh phát hiện được sẽ thành 1 clip riêng trên timeline.
            </p>
            <label className="field">
              <span>Độ nhạy: {threshold.toFixed(2)} {threshold < 0.3 ? "(thấp — ít điểm cắt)" : threshold > 0.6 ? "(cao — có thể cắt nhầm)" : "(trung bình)"}</span>
              <input
                type="range" min={0.1} max={0.9} step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
            </label>
            <p className="muted small">
              Clip dài {clip.duration.toFixed(1)}s (nguồn {clip.in.toFixed(1)}s → {clip.out.toFixed(1)}s).
              {clip.speed && clip.speed !== 1 ? ` Tốc độ ${clip.speed}x.` : ""}
              {clip.reverse ? " Phát ngược." : ""}
            </p>
            {error && <p className="error">{error}</p>}
            <div className="row">
              <button className="primary" onClick={startDetect}>Quét chuyển cảnh</button>
              <button onClick={onClose}>Hủy</button>
            </div>
          </>
        )}

        {step === "running" && (
          <>
            <div className="spinner" />
            <p>{phase}</p>
            <p className="muted">Đã chạy {fmtElapsed(elapsed)}</p>
            <button onClick={() => { abortRef.current?.abort(); setStep("config"); }}>Hủy</button>
          </>
        )}

        {step === "review" && result && (
          <>
            <p>
              Phát hiện <b>{result.cuts.length}</b> điểm chuyển cảnh
              (ngưỡng {result.threshold}) → <b>{times.length}</b> điểm tách hợp lệ.
            </p>
            {times.length === 0 ? (
              <p className="muted">Không có điểm cắt nào nằm hẳn trong clip.</p>
            ) : (
              <ul className="scene-cut-list">
                {times.map((t) => (
                  <li key={t} className={dropped.has(t) ? "dropped" : ""}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!dropped.has(t)}
                        onChange={() => toggleDrop(t)}
                      />
                      <span className="mono">{formatCutTime(t)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <p className="muted small">
              Bỏ tick để giữ nguyên đoạn đó. Áp dụng sẽ tách clip thành {times.filter((t) => !dropped.has(t)).length + 1} đoạn
              trong 1 bước hoàn tác.
            </p>
            {error && <p className="error">{error}</p>}
            <div className="row">
              <button className="primary" onClick={apply} disabled={times.length === 0}>
                Tách thành {times.filter((t) => !dropped.has(t)).length + 1} cảnh
              </button>
              <button onClick={() => setStep("config")}>Quét lại</button>
              <button onClick={onClose}>Đóng</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
