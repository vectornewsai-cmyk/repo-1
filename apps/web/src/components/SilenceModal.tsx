/**
 * SilenceModal — cắt khoảng lặng tự động (R1-084, Batch H).
 *
 * Luồng:
 *   1. config: chọn clip video/audio trên timeline + ngưỡng dB + độ dài tối thiểu
 *   2. running: POST /api/silence (FFmpeg silencedetect, chạy trên máy bạn)
 *   3. review: xem trước danh sách khoảng lặng (bỏ chọn nếu muốn giữ) → áp dụng
 *   4. Áp dụng: split + xóa các đoạn im + dồn gap (1 bước undo duy nhất)
 *
 * Không có browser test — logic thuần nằm ở lib/silence.ts (đã có test Node).
 * Đợt 57 N1: sửa tràn viewport (LIMITS đợt 56 §4.1) — modal dùng class
 * `modal-backdrop` + `modal` đã định nghĩa trong styles.css (fixed, căn
 * giữa, max-height calc(100vh - 60px)) thay cho `modal-overlay` /
 * `modal-card` chưa từng được định nghĩa; footer `.modal-actions` nằm
 * ngoài `.modal-body` (nút luôn thấy, body cuộn nội bộ khi dài).
 * Đo headed thật: xem docs/PHASE9_ROUND57_N1_SILENCE_MODAL_LIMITS.md.
 */
import { useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import type { Clip, Track } from "@repo-1/video-spec";
import { formatTimecode } from "@repo-1/video-spec";
import { sourceSilenceToLocal, type LocalSilence } from "../lib/silence";
import { BRIDGE_URL } from "../lib/bridgeUrl";
import { t, useLang } from "../i18n";
import { resolveBridgeApiError } from "../lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web


type Step = "config" | "running" | "review" | "done";

interface Props {
  onClose: () => void;
}

interface SilenceInterval {
  start: number;
  end: number;
  duration: number;
}

interface SilenceResponse {
  audioDurationSec?: number;
  count?: number;
  silences?: unknown;
  keep?: unknown;
  error?: string;
}

interface ClipOption {
  trackId: string;
  clipId: string;
  label: string;
}

function fmtSec(s: number): string {
  return `${s.toFixed(2)}s`;
}

export function SilenceModal({ onClose }: Props) {
  useLang(); // re-render khi đổi ngôn ngữ
  const spec = useStore((s) => s.spec);
  const media = useStore((s) => s.media);
  const selection = useStore((s) => s.selection);

  // Mọi clip video/audio trên timeline đều là ứng viên.
  const clipOptions: ClipOption[] = useMemo(() => {
    const out: ClipOption[] = [];
    for (const t of spec.tracks as Track[]) {
      for (const c of t.clips as Clip[]) {
        if (c.kind !== "video" && c.kind !== "audio") continue;
        out.push({
          trackId: t.id,
          clipId: c.id,
          label: `${t.label || t.id} · ${fmtSec(c.start)}–${fmtSec(c.start + c.duration)}`,
        });
      }
    }
    return out;
  }, [spec.tracks]);

  // Mặc định: clip đang chọn (nếu là video/audio), ngược lại clip đầu.
  const defaultKey = useMemo(() => {
    const sel = selection[0];
    if (sel) {
      const hit = clipOptions.find(
        (o) => o.trackId === sel.trackId && o.clipId === sel.clipId
      );
      if (hit) return `${hit.trackId}:${hit.clipId}`;
    }
    const first = clipOptions[0];
    return first ? `${first.trackId}:${first.clipId}` : "";
  }, [selection, clipOptions]);

  const [clipKey, setClipKey] = useState(defaultKey);
  const [noiseDb, setNoiseDb] = useState(-35);
  const [minDur, setMinDur] = useState(0.5);
  const [step, setStep] = useState<Step>("config");
  const [silences, setSilences] = useState<SilenceInterval[]>([]);
  const [dropped, setDropped] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const kept = silences.filter((_, i) => !dropped.has(i));
  const totalSilence = kept.reduce((a, s) => a + s.duration, 0);

  const selectedClip = useMemo(() => {
    const [trackId, clipId] = clipKey.split(":");
    const track = (spec.tracks as Track[]).find((t) => t.id === trackId);
    const clip = (track?.clips as Clip[] | undefined)?.find((c) => c.id === clipId);
    return track && clip ? { track, clip } : null;
  }, [clipKey, spec.tracks]);

  const start = async () => {
    if (!selectedClip) {
      setError(t("silence.noClip"));
      return;
    }
    const src = (selectedClip.clip as { src?: string }).src;
    const item = media.find((m) => m.name === src);
    if (!item?.file) {
      setError(t("silence.noSource"));
      return;
    }
    setError(null);
    setResultMsg(null);
    setStep("running");
    setSilences([]);
    setDropped(new Set());

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const form = new FormData();
      form.append("media", item.file, item.file.name);
      form.append("noiseDb", String(noiseDb));
      form.append("minDur", String(minDur));
      const res = await fetch(`${BRIDGE_URL}/api/silence`, {
        method: "POST",
        body: form,
        signal: ctrl.signal,
      });
      const j = (await res.json()) as SilenceResponse;
      if (!res.ok) throw new Error(resolveBridgeApiError(j, t, t("bgremove.bridgeHttp", { status: String(res.status) })));
      const arr = Array.isArray(j.silences) ? (j.silences as SilenceInterval[]) : [];
      setSilences(
        arr
          .filter((s) => s.end > s.start && s.start >= 0)
          .sort((a, b) => a.start - b.start)
      );
      setStep("review");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setError(t("silence.cancelled"));
      } else {
        setError(
          (e as Error).message ||
            t("common.bridgeConn", { url: BRIDGE_URL })
        );
      }
      setStep("config");
    } finally {
      abortRef.current = null;
    }
  };

  const apply = () => {
    if (!selectedClip) return;
    const { track, clip } = selectedClip;
    // Đổi khoảng lặng (theo file nguồn) → local time của clip, bỏ khoảng không giao.
    const locals: LocalSilence[] = [];
    for (let i = 0; i < silences.length; i++) {
      if (dropped.has(i)) continue;
      const l = sourceSilenceToLocal(clip, silences[i].start, silences[i].end);
      if (l) locals.push(l);
    }
    if (locals.length === 0) {
      setError(t("silence.noSilenceInRange"));
      return;
    }
    const res = useStore
      .getState()
      .removeSilence(track.id, clip.id, locals);
    if (!res) {
      setError(t("silence.applyFailed"));
      return;
    }
    setResultMsg(
      t("silence.cutDone", {
        n: String(res.cutCount),
        seconds: res.removedTotal.toFixed(2),
      }),
    );
    setStep("done");
  };

  const toggleDrop = (i: number) => {
    setDropped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("silence.title")}
      >
        <div className="modal-head">
          <h3>{t("silence.titleIcon")}</h3>
          <button className="icon-btn" onClick={onClose} title={t("common.close")} aria-label={t("common.close")}>✕</button>
        </div>

        {step === "config" && (
          <>
            <div className="modal-body">
              <p className="muted">{t("silence.intro")}</p>
              <label className="field">
                {t("silence.clipLabel")}
                <select
                  value={clipKey}
                  onChange={(e) => setClipKey(e.target.value)}
                  disabled={clipOptions.length === 0}
                >
                  {clipOptions.map((o) => (
                    <option key={`${o.trackId}:${o.clipId}`} value={`${o.trackId}:${o.clipId}`}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {clipOptions.length === 0 && (
                <p className="error">{t("silence.noClipInTimeline")}</p>
              )}
              <label className="field">
                {t("silence.threshold")} <b>{noiseDb} dB</b> {t("silence.thresholdHint")}
                <input
                  type="range" min={-50} max={-20} step={1}
                  value={noiseDb} onChange={(e) => setNoiseDb(Number(e.target.value))}
                />
              </label>
              <label className="field">
                {t("silence.minDuration")} <b>{minDur.toFixed(1)}s</b>
                <input
                  type="range" min={0.3} max={2} step={0.1}
                  value={minDur} onChange={(e) => setMinDur(Number(e.target.value))}
                />
              </label>
              {error && <p className="error">{error}</p>}
            </div>
            <div className="modal-actions">
              <button onClick={onClose}>{t("bgremove.cancel")}</button>
              <button
                className="primary"
                onClick={start}
                disabled={clipOptions.length === 0}
              >
                {t("silence.analyze")}
              </button>
            </div>
          </>
        )}

        {step === "running" && (
          <>
            <div className="modal-body">
              <p>{t("silence.analyzing")}</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => abortRef.current?.abort()}>{t("bgremove.cancel")}</button>
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <div className="modal-body">
              <p className="muted">
                {kept.length < silences.length
                  ? t("silence.foundPartial", {
                      n: String(silences.length),
                      kept: String(kept.length),
                      skipped: String(silences.length - kept.length),
                      total: totalSilence.toFixed(1),
                    })
                  : t("silence.foundAll", {
                      n: String(silences.length),
                      total: totalSilence.toFixed(1),
                    })}
              </p>
              {silences.length === 0 ? (
                <p className="muted">{t("silence.noSilenceFound")}</p>
              ) : (
                <ul className="silence-list">
                  {silences.map((s, i) => (
                    <li key={i} className={dropped.has(i) ? "dropped" : ""}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!dropped.has(i)}
                          onChange={() => toggleDrop(i)}
                        />
                        <span className="mono">
                          {formatTimecode(s.start, 30)} → {formatTimecode(s.end, 30)}
                        </span>
                        <span className="dim">({s.duration.toFixed(1)}s)</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              {error && <p className="error">{error}</p>}
            </div>
            <div className="modal-actions">
              <button onClick={() => setStep("config")}>{t("silence.backToParams")}</button>
              <button
                className="primary"
                onClick={apply}
                disabled={kept.length === 0}
              >
                {t("silence.cut", { n: String(kept.length) })}
              </button>
            </div>
          </>
        )}

        {resultMsg && <p className="modal-ok">{resultMsg}</p>}

        {step === "done" && (
          <>
            <div className="modal-body">
              <p className="modal-ok">✅ {resultMsg}</p>
            </div>
            <div className="modal-actions">
              <button className="primary" onClick={onClose}>{t("common.close")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
