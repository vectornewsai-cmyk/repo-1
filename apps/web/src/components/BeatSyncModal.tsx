/**
 * BeatSyncModal — tự động cắt clip nhạc theo beat (Phase 8 Q5).
 *
 * Luồng (giống SceneModal):
 *   1. config: chọn khoảng BPM (mặc định 40–240)
 *   2. running: POST /api/beats/analyze (upload file gốc của clip),
 *      nhận JSON { bpm, beats, duration }
 *   3. review: xem BPM + danh sách điểm cắt (timecode timeline),
 *      bỏ điểm không muốn
 *   4. Áp dụng: tách clip thành N clip con trong 1 bước undo
 *      (store.splitClipAtTimes)
 *
 * Beat chỉ là xấp xỉ trên nhạc thật (xem Q5_LIMITS.md) — modal cho review
 * và bỏ điểm cắt trước khi áp dụng, không cắt mù.
 *
 * Đợt 58 O4: sửa nợ LIMITS đợt 57 §6.3 — modal dùng class `modal-backdrop`
 * + `modal` đã định nghĩa trong styles.css thay cho `modal-card` chưa từng
 * được định nghĩa (theo đúng mẫu N1 SilenceModal); footer `.modal-actions`
 * nằm ngoài `.modal-body` (nút luôn thấy, body cuộn nội bộ khi dài).
 * Đo headed thật: xem docs/PHASE9_ROUND58_O4_MODAL_CARD_LIMITS.md.
 */
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import {
  beatsToTimelineTimes,
  formatBeatTime,
} from "../lib/beatSync";
import { BRIDGE_URL } from "../lib/bridgeUrl";
import { t, useLang } from "../i18n";
import { resolveBridgeApiError } from "../lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web


type Step = "config" | "running" | "review";

interface Props {
  trackId: string;
  clipId: string;
  onClose: () => void;
}

interface StructureSection {
  start: number;
  end: number;
  label: string;
  repeats?: number;
  highest_energy?: boolean;
}

interface StructureResult {
  meter?: number | null;
  meter_confidence?: number;
  downbeats?: number[];
  sections?: StructureSection[];
  error?: string;
}

interface BeatResult {
  bpm: number;
  beats: number[];
  duration: number;
  structure?: StructureResult | null;
}

export function BeatSyncModal({ trackId, clipId, onClose }: Props) {
  useLang(); // re-render khi đổi ngôn ngữ
  const [step, setStep] = useState<Step>("config");
  const [minBpm, setMinBpm] = useState(40);
  const [maxBpm, setMaxBpm] = useState(240);
  const [result, setResult] = useState<BeatResult | null>(null);
  const [times, setTimes] = useState<number[]>([]);
  const [downbeatOnly, setDownbeatOnly] = useState(false);
  const [dropped, setDropped] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const st = useStore.getState();
  const track = st.spec.tracks.find((t) => t.id === trackId);
  const clip = track?.clips.find((c) => c.id === clipId);
  const mediaItem = st.media.find(
    (m) =>
      (m.kind === "audio" || m.kind === "video") &&
      m.file &&
      clip &&
      "src" in clip &&
      m.name === (clip as { src: string }).src,
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!clip || (clip.kind !== "audio" && clip.kind !== "video")) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={t("beatsync.title")}
        >
          <div className="panel-head">{t("beatsync.title")}</div>
          <div className="modal-body">
            <p>{t("beatsync.noClip")}</p>
          </div>
          <div className="modal-actions">
            <button onClick={onClose}>{t("common.close")}</button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 9 D5: downbeat + cấu trúc — chỉ THÊM hiển thị, không đổi luồng cắt.
  const downbeatTimes =
    result?.structure?.downbeats && result.structure.downbeats.length > 0
      ? beatsToTimelineTimes(result.structure.downbeats, clip)
      : [];
  const visibleTimes =
    downbeatOnly && downbeatTimes.length > 0
      ? times.filter((t) => downbeatTimes.some((d) => Math.abs(d - t) <= 0.06))
      : times;
  const toTimeline = (mediaT: number) =>
    clip.start + (mediaT - ((clip as { in?: number }).in ?? 0));

  const startDetect = async () => {
    if (!mediaItem?.file) {
      setError(t("beatsync.noSource"));
      return;
    }
    setError(null);
    setStep("running");
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const form = new FormData();
      form.append("media", mediaItem.file);
      form.append("minBpm", String(minBpm));
      form.append("maxBpm", String(maxBpm));
      const res = await fetch(`${BRIDGE_URL}/api/beats/analyze`, {
        method: "POST",
        body: form,
        signal: ctl.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(resolveBridgeApiError(data, t, t("beatsync.bridgeError", { status: String(res.status) })));
      const beats = Array.isArray(data.beats) ? data.beats : [];
      setResult({ bpm: data.bpm, beats, duration: data.duration, structure: data.structure ?? null });
      setTimes(beatsToTimelineTimes(beats, clip));
      setDropped(new Set());
      setDownbeatOnly(false);
      setStep("review");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message || t("beatsync.analyzeFailed"));
      setStep("config");
    }
  };

  const apply = () => {
    const keep = visibleTimes.filter((t) => !dropped.has(t));
    if (keep.length === 0) {
      setError(t("beatsync.noCutPoints"));
      return;
    }
    const n = useStore.getState().splitClipAtTimes(trackId, clipId, keep);
    if (n === 0) {
      setError(t("beatsync.applyFailed"));
      return;
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("beatsync.title")}
      >
        <div className="panel-head">{t("beatsync.cutTitle")}</div>

        {step === "config" && (
          <>
            <div className="modal-body">
              {error && <p className="error">{error}</p>}
              <p className="tips">{t("beatsync.intro")}</p>
              <div className="field-row">
                <label className="field">
                  <span>{t("beatsync.minBpm")}</span>
                  <input
                    type="number"
                    min={30}
                    max={240}
                    value={minBpm}
                    onChange={(e) => setMinBpm(Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>{t("beatsync.maxBpm")}</span>
                  <input
                    type="number"
                    min={30}
                    max={300}
                    value={maxBpm}
                    onChange={(e) => setMaxBpm(Number(e.target.value))}
                  />
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={startDetect}>{t("beatsync.analyze")}</button>
              <button onClick={onClose}>{t("bgremove.cancel")}</button>
            </div>
          </>
        )}

        {step === "running" && (
          <div className="modal-body">
            {error && <p className="error">{error}</p>}
            <p>{t("beatsync.analyzing")}</p>
          </div>
        )}

        {step === "review" && result && (
          <>
            <div className="modal-body">
              {error && <p className="error">{error}</p>}
              <p>
                {t("beatsync.found", {
                  bpm: result.bpm.toFixed(1),
                  beats: String(result.beats.length),
                  duration: result.duration.toFixed(1),
                  points: String(visibleTimes.length),
                })}
              </p>
              {result.structure && !result.structure.error && (
                <div>
                  <p>
                    {t("beatsync.structure")}{" "}
                    {result.structure.meter
                      ? t("beatsync.meter", {
                          meter: String(result.structure.meter),
                          confidence: (result.structure.meter_confidence ?? 0).toFixed(2),
                        })
                      : t("beatsync.meterUnknown")}
                    {downbeatTimes.length > 0 && ` — ${downbeatTimes.length} downbeat trong clip`}
                  </p>
                  {result.structure.sections && result.structure.sections.length > 1 && (
                    <div style={{ maxHeight: 120, overflowY: "auto" }}>
                      {result.structure.sections.map((s, i) => (
                        <p key={i} style={{ margin: "2px 0" }}>
                          {t("beatsync.section", {
                            label: s.label,
                            start: formatBeatTime(toTimeline(s.start)),
                            end: formatBeatTime(toTimeline(s.end)),
                          })}
                          {(s.repeats ?? 1) > 1
                            ? t("beatsync.sectionRepeat", { n: String(s.repeats) })
                            : ""}
                          {s.highest_energy ? t("beatsync.sectionPeak") : ""}
                        </p>
                      ))}
                    </div>
                  )}
                  {downbeatTimes.length > 0 && (
                    <label className="field" style={{ display: "block" }}>
                      <input
                        type="checkbox"
                        checked={downbeatOnly}
                        onChange={(e) => setDownbeatOnly(e.target.checked)}
                      />{" "}
                      {t("beatsync.downbeatOnly")}
                    </label>
                  )}
                  <p className="tips">{t("beatsync.sectionNote")}</p>
                </div>
              )}
              {result.structure?.error && (
                <p className="tips">
                  {t("beatsync.structureError", { error: result.structure.error })}
                </p>
              )}
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {visibleTimes.map((t) => (
                  <label key={t} className="field" style={{ display: "block" }}>
                    <input
                      type="checkbox"
                      checked={!dropped.has(t)}
                      onChange={() => {
                        const next = new Set(dropped);
                        if (next.has(t)) next.delete(t);
                        else next.add(t);
                        setDropped(next);
                      }}
                    />{" "}
                    {formatBeatTime(t)}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={apply}>{t("beatsync.apply")}</button>
              <button onClick={onClose}>{t("bgremove.cancel")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
