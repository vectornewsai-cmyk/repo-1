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
 */
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import {
  beatsToTimelineTimes,
  formatBeatTime,
} from "../lib/beatSync";

const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

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
          className="modal-card"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Cắt theo beat"
        >
          <div className="panel-head">Cắt theo beat</div>
          <p>Không tìm thấy clip audio/video đã chọn.</p>
          <button onClick={onClose}>Đóng</button>
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
      setError("Không có file gốc của clip (media đã bị xóa hoặc relink).");
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
      if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
      const beats = Array.isArray(data.beats) ? data.beats : [];
      setResult({ bpm: data.bpm, beats, duration: data.duration, structure: data.structure ?? null });
      setTimes(beatsToTimelineTimes(beats, clip));
      setDropped(new Set());
      setDownbeatOnly(false);
      setStep("review");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message || "Phân tích beat thất bại.");
      setStep("config");
    }
  };

  const apply = () => {
    const keep = visibleTimes.filter((t) => !dropped.has(t));
    if (keep.length === 0) {
      setError("Không còn điểm cắt nào — chọn lại ít nhất 1 điểm.");
      return;
    }
    const n = useStore.getState().splitClipAtTimes(trackId, clipId, keep);
    if (n === 0) {
      setError("Không tách được điểm nào (clip có thể đã bị khóa hoặc điểm nằm ngoài clip).");
      return;
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Cắt theo beat"
      >
        <div className="panel-head">🎵 Cắt clip theo beat</div>
        {error && <p className="error">{error}</p>}

        {step === "config" && (
          <>
            <p className="tips">
              Phát hiện beat bằng thuật toán local (spectral flux + DP, không API).
              Hiệu quả nhất với nhạc có beat rõ; nhạc rubato/phức tạp có thể lệch —
              hãy xem lại danh sách điểm cắt trước khi áp dụng.
            </p>
            <div className="field-row">
              <label className="field">
                <span>BPM tối thiểu</span>
                <input
                  type="number"
                  min={30}
                  max={240}
                  value={minBpm}
                  onChange={(e) => setMinBpm(Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span>BPM tối đa</span>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={maxBpm}
                  onChange={(e) => setMaxBpm(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="field-row">
              <button onClick={startDetect}>Phân tích beat</button>
              <button onClick={onClose}>Hủy</button>
            </div>
          </>
        )}

        {step === "running" && (
          <p>Đang phân tích beat… (nhạc dài có thể mất vài chục giây)</p>
        )}

        {step === "review" && result && (
          <>
            <p>
              Phát hiện <strong>{result.bpm.toFixed(1)} BPM</strong> — {result.beats.length} beat
              trong {result.duration.toFixed(1)}s → {visibleTimes.length} điểm cắt trong clip.
              Bỏ tick điểm nào không muốn cắt:
            </p>
            {result.structure && !result.structure.error && (
              <div>
                <p>
                  🎼 Cấu trúc (ước lượng heuristic, không phải hiểu nhạc thật):{" "}
                  {result.structure.meter
                    ? `nhịp ${result.structure.meter}/4 (tin cậy ${(result.structure.meter_confidence ?? 0).toFixed(2)})`
                    : "không xác định được nhịp"}
                  {downbeatTimes.length > 0 && ` — ${downbeatTimes.length} downbeat trong clip`}
                </p>
                {result.structure.sections && result.structure.sections.length > 1 && (
                  <div style={{ maxHeight: 120, overflowY: "auto" }}>
                    {result.structure.sections.map((s, i) => (
                      <p key={i} style={{ margin: "2px 0" }}>
                        Đoạn {s.label}: {formatBeatTime(toTimeline(s.start))} →{" "}
                        {formatBeatTime(toTimeline(s.end))}
                        {(s.repeats ?? 1) > 1 ? ` (lặp ×${s.repeats})` : ""}
                        {s.highest_energy ? " (năng lượng cao nhất)" : ""}
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
                    Chỉ giữ điểm cắt ở downbeat (cắt theo ô nhịp, ít điểm hơn)
                  </label>
                )}
                <p className="tips">
                  Nhãn đoạn (A/B/C, “lặp lại”, “năng lượng cao”) chỉ là gợi ý từ độ giống
                  hòa âm và năng lượng — nhạc không theo cấu trúc pop có thể phân đoạn sai.
                </p>
              </div>
            )}
            {result.structure?.error && (
              <p className="tips">
                Không phân tích được cấu trúc ({result.structure.error}) — vẫn cắt theo beat
                bình thường.
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
            <div className="field-row">
              <button onClick={apply}>Cắt clip theo beat đã chọn</button>
              <button onClick={onClose}>Hủy</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
