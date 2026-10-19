/**
 * SpeedPanel — Panel điều chỉnh TỐC ĐỘ + ĐẢO NGƯỢC cho clip đang chọn.
 *
 * Tự đọc selection từ store nên tích hợp chỉ cần 1 dòng, ví dụ trong Inspector:
 *   {clip.kind !== "text" && <SpeedPanel />}
 * (đặt trong phần thuộc tính của clip video/audio).
 *
 * Hành vi (khớp ngữ nghĩa trong packages/video-spec/src/speed.ts):
 * - Đổi speed → giữ nguyên đoạn nguồn [in, out), cập nhật
 *   duration = (out - in) / speed. Timeline tự co/giãn theo duration.
 * - Đổi speed bị từ chối (kèm cảnh báo) nếu duration mới đè lên clip khác
 *   trên cùng track, hoặc làm duration < 0.2s.
 * - Toggle reverse: chỉ đảo chiều phát, không đổi duration.
 *
 * TÍCH HỢP CÒN THIẾU (cần chủ sở hữu store.ts):
 * - trimClip/splitAtPlayhead trong store.ts chưa tính speed
 *   (công thức đúng: out = in + duration * speed). Tạm thời panel không
 *   can thiệp vào 2 thao tác đó — xem SPEED_LIMITS.md.
 */
import { useState } from "react";
import { useStore } from "../../store";
import "./speed.css";
import {
  SPEED_MAX,
  SPEED_MIN,
  SPEED_PRESETS,
  clampSpeed,
  clipReversed,
  clipSpeed,
  durationForSpeed,
  isSpeedable,
} from "@repo-1/video-spec";
import { fmtTime } from "../../lib";

const MIN_CLIP_DURATION = 0.2; // quy ước chung của editor

export function SpeedPanel() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const [warn, setWarn] = useState<string | null>(null);

  if (!selection) return null;
  const track = spec.tracks.find((t) => t.id === selection.trackId);
  const clip = track?.clips.find((c) => c.id === selection.clipId);
  if (!track || !clip || !isSpeedable(clip)) return null;

  const speed = clipSpeed(clip);
  const reversed = clipReversed(clip);
  const srcLen = clip.out - clip.in;
  // tốc độ tối đa để duration không dưới mức tối thiểu
  const maxSpeedForMinDur = srcLen / MIN_CLIP_DURATION;
  const sliderMax = Math.min(SPEED_MAX, Math.max(SPEED_MIN, maxSpeedForMinDur));

  const st = useStore.getState();

  /** Kiểm tra duration mới có đè clip khác không. */
  const wouldOverlap = (newDur: number): boolean =>
    track.clips.some(
      (c) =>
        c.id !== clip.id &&
        clip.start < c.start + c.duration &&
        clip.start + newDur > c.start,
    );

  const applySpeed = (raw: number) => {
    const s = clampSpeed(Math.min(raw, sliderMax));
    const newDur = durationForSpeed(clip, s);
    if (newDur < MIN_CLIP_DURATION - 1e-9) {
      setWarn(
        `Không thể đặt ${s}× — clip sẽ ngắn hơn ${MIN_CLIP_DURATION}s. ` +
          `Cắt đoạn nguồn dài hơn trước.`,
      );
      return;
    }
    if (wouldOverlap(newDur)) {
      setWarn(
        `Không đủ chỗ trên timeline — clip sẽ dài ${fmtTime(newDur)} và đè lên clip bên cạnh. ` +
          `Hãy dịch clip khác ra trước.`,
      );
      return;
    }
    setWarn(null);
    st.patchClip(track.id, clip.id, { speed: s, duration: newDur } as Partial<typeof clip>);
  };

  const toggleReverse = () => {
    setWarn(null);
    st.patchClip(track.id, clip.id, { reverse: !reversed } as Partial<typeof clip>);
  };

  const reset = () => {
    setWarn(null);
    const newDur = durationForSpeed(clip, 1);
    if (wouldOverlap(newDur)) {
      setWarn("Không đủ chỗ để trả về 1× — hãy dịch clip khác ra trước.");
      return;
    }
    st.patchClip(track.id, clip.id, { speed: 1, reverse: false } as Partial<typeof clip>);
  };

  return (
    <div className="speed-panel">
      <div className="panel-head" style={{ marginTop: 12 }}>⏩ Tốc độ</div>

      <label className="field">
        <span>
          Tốc độ phát: <b>{speed}×</b>
          {reversed && <b className="reverse-badge"> ◀ NGƯỢC</b>}
        </span>
        <input
          type="range"
          min={SPEED_MIN}
          max={Math.round(sliderMax * 100) / 100}
          step={0.05}
          value={Math.min(speed, sliderMax)}
          onChange={(e) => applySpeed(Number(e.target.value))}
        />
      </label>

      <div className="btn-row speed-presets">
        {SPEED_PRESETS.map((p) => {
          const disabled = p > sliderMax + 1e-9;
          const active = Math.abs(speed - p) < 0.001;
          return (
            <button
              key={p}
              className={active ? "toggle on" : "toggle"}
              disabled={disabled}
              title={disabled ? `Đoạn nguồn quá ngắn cho ${p}×` : `Đặt tốc độ ${p}×`}
              onClick={() => applySpeed(p)}
            >
              {p}×
            </button>
          );
        })}
      </div>

      <div className="btn-row">
        <button
          className={reversed ? "toggle on" : "toggle"}
          onClick={toggleReverse}
          title="Đảo ngược hướng phát của clip"
        >
          {reversed ? "◀ Đang đảo ngược" : "▶ Phát xuôi"}
        </button>
        {(speed !== 1 || reversed) && (
          <button className="toggle" onClick={reset} title="Trả về tốc độ 1×, phát xuôi">
            ↺ Đặt lại
          </button>
        )}
      </div>

      <div className="info-rows">
        <div>
          <span>Đoạn nguồn</span>
          <b>{fmtTime(srcLen)} <span className="muted">[{clip.in.toFixed(1)}s – {clip.out.toFixed(1)}s]</span></b>
        </div>
        <div>
          <span>Thời lượng hiệu dụng</span>
          <b>{fmtTime(clip.duration)}</b>
        </div>
      </div>

      {warn && <p className="warn">{warn}</p>}
      {!warn && (
        <p className="tips">
          💡 Tốc độ đổi tempo nhưng giữ nguyên cao độ giọng. Đảo ngược phát từ cuối đoạn nguồn về đầu.
        </p>
      )}
    </div>
  );
}
