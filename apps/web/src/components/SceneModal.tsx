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
import { t as i18nT, useLang } from "../i18n";

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
  useLang();
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

  // R1-107: Esc đóng modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!clip || clip.kind !== "video") {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-card"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={i18nT("scene.aria")}
        >
          <div className="panel-head">{i18nT("scene.aria")}</div>
          <p>{i18nT("scene.notFound")}</p>
          <button onClick={onClose}>{i18nT("common.close")}</button>
        </div>
      </div>
    );
  }

  const startDetect = async () => {
    if (!mediaItem?.file) {
      setError(i18nT("scene.noFile"));
      return;
    }
    setError(null);
    setStep("running");
    setPhase(i18nT("scene.sending"));
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
        throw new Error(j.error || i18nT("scene.bridgeErr", { status: String(res.status) }));
      }
      if (!res.body) throw new Error(i18nT("scene.noStream"));
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
            throw new Error(ev.error || i18nT("scene.failed"));
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(
        e instanceof Error ? e.message :
        i18nT("common.bridgeConn", { url: BRIDGE_URL })
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
      setError(i18nT("scene.noCutsSelected"));
      return;
    }
    const n = useStore.getState().splitClipAtTimes(trackId, clipId, kept);
    if (n === 0) {
      setError(i18nT("scene.splitFail"));
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
      <div
        className="modal-card scene-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={i18nT("scene.ariaAuto")}
      >
        <div className="panel-head">{i18nT("scene.head")}</div>

        {step === "config" && (
          <>
            <p className="muted">
              {i18nT("scene.desc")}
            </p>
            <label className="field">
              <span>{i18nT("scene.sensLabel")}: {threshold.toFixed(2)} {threshold < 0.3 ? i18nT("scene.sensLow") : threshold > 0.6 ? i18nT("scene.sensHigh") : i18nT("scene.sensMid")}</span>
              <input
                type="range" min={0.1} max={0.9} step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
            </label>
            <p className="muted small">
              {i18nT("scene.clipInfo", { dur: clip.duration.toFixed(1), from: clip.in.toFixed(1), to: clip.out.toFixed(1) })}
              {clip.speed && clip.speed !== 1 ? i18nT("scene.speedNote", { s: String(clip.speed) }) : ""}
              {clip.reverse ? i18nT("scene.reverseNote") : ""}
            </p>
            {error && <p className="error">{error}</p>}
            <div className="row">
              <button className="primary" onClick={startDetect}>{i18nT("scene.scan")}</button>
              <button onClick={onClose}>{i18nT("common.cancel")}</button>
            </div>
          </>
        )}

        {step === "running" && (
          <>
            <div className="spinner" />
            <p>{phase}</p>
            <p className="muted">{i18nT("scene.elapsed", { t: fmtElapsed(elapsed) })}</p>
            <button onClick={() => { abortRef.current?.abort(); setStep("config"); }}>{i18nT("common.cancel")}</button>
          </>
        )}

        {step === "review" && result && (
          <>
            <p>
              {i18nT("scene.found", { cuts: String(result.cuts.length), th: String(result.threshold), valid: String(times.length) })}
            </p>
            {times.length === 0 ? (
              <p className="muted">{i18nT("scene.noValidCuts")}</p>
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
              {i18nT("scene.keepNote", { n: String(times.filter((t) => !dropped.has(t)).length + 1) })}
            </p>
            {error && <p className="error">{error}</p>}
            <div className="row">
              <button className="primary" onClick={apply} disabled={times.length === 0}>
                {i18nT("scene.applyBtn", { n: String(times.filter((t) => !dropped.has(t)).length + 1) })}
              </button>
              <button onClick={() => setStep("config")}>{i18nT("scene.rescan")}</button>
              <button onClick={onClose}>{i18nT("common.close")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
