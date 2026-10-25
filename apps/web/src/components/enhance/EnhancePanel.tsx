/**
 * EnhancePanel — panel tăng cường cho clip video (Phase 9 R2).
 *
 * Nối clip.enhance (đã có sẵn ở server/render từ Phase 7 P2) ra giao diện:
 * khử răng cưa (yadif), chống rung (vidstab 2-pass), khử nhiễu (hqdn3d).
 * Chỉ video clip (validate.js chặn enhance trên track khác).
 *
 * Lưu ý trung thực:
 * - Tăng cường CHỈ có tác dụng khi render — preview canvas không áp
 *   enhance (giống mask trước Phase 8, nhưng mask nay đã có preview).
 * - Chống rung KHÔNG dùng chung được với speedKeyframes (validator chặn,
 *   vì pass vidstabdetect phân tích theo trim gốc, không khớp đoạn ramp).
 * - Cảnh báo mask + enhance nặng lấy từ số đo thật trong test_r2.js
 *   (xem server/render/src/R2_LIMITS.md): 720p mask + khử nhiễu ~17.6 fps
 *   trên VM 2 vCPU không GPU.
 */
import { useStore } from "../../store";
import { clamp } from "../../lib";
import {
  DENOISE_DEFAULT_STRENGTH,
  STABILIZE_DEFAULTS,
  type ClipEnhance,
} from "@repo-1/video-spec";

/** Ngưỡng cảnh báo mask + enhance nặng (giây, theo số đo R2). */
const HEAVY_WARN_SECONDS = 30;

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function EnhancePanel() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const st = useStore.getState();

  const primary = selection[0] ?? null;
  if (!primary) {
    return (
      <div className="mask-panel">
        <p className="tips">Chọn một clip <b>video</b> trên timeline để tăng cường hình ảnh.</p>
      </div>
    );
  }
  const track = spec.tracks.find((t) => t.id === primary.trackId);
  const clip = track?.clips.find((c) => c.id === primary.clipId);
  if (!track || !clip) {
    return (
      <div className="mask-panel">
        <p className="tips">Clip không còn tồn tại.</p>
      </div>
    );
  }
  if (clip.kind !== "video") {
    return (
      <div className="mask-panel">
        <p className="tips">
          Tăng cường chỉ dùng cho clip video (ảnh, chữ, sticker, âm thanh chưa
          hỗ trợ) — xem <code>server/render/src/ENHANCE_LIMITS.md</code>.
        </p>
      </div>
    );
  }

  const enh = (clip as { enhance?: ClipEnhance }).enhance;
  const patchEnh = (next: ClipEnhance | undefined) => {
    st.patchClip(track.id, clip.id, { enhance: next } as Partial<typeof clip>);
  };
  const dropKey = (key: keyof ClipEnhance) => {
    if (!enh) return;
    const next = { ...enh };
    delete next[key];
    patchEnh(Object.keys(next).length > 0 ? next : undefined);
  };
  const base = enh ?? {};

  const deintOn = base.deinterlace !== undefined;
  const deintMode = typeof base.deinterlace === "object" ? (base.deinterlace.mode ?? 0) : 0;
  const stabOn = base.stabilize !== undefined;
  const smoothing = base.stabilize?.smoothing ?? STABILIZE_DEFAULTS.smoothing;
  const denoiseOn = base.denoise !== undefined;
  const strength = typeof base.denoise === "object" ? (base.denoise.strength ?? DENOISE_DEFAULT_STRENGTH) : DENOISE_DEFAULT_STRENGTH;

  const hasSpeedRamp = (clip as { speedKeyframes?: unknown }).speedKeyframes !== undefined;
  const hasMask = (clip as { mask?: unknown }).mask !== undefined;
  const hasHeavyEnhance = stabOn || denoiseOn;
  const showHeavyWarning = hasMask && hasHeavyEnhance && clip.duration >= HEAVY_WARN_SECONDS;

  return (
    <div className="mask-panel">
      <p className="tips">
        Tăng cường chỉ có tác dụng khi <b>render</b> (preview chưa áp) — xem
        trước bằng cách render thử đoạn ngắn.
      </p>

      <label className="field mask-check">
        <input
          type="checkbox"
          checked={deintOn}
          onChange={(e) => {
            if (e.target.checked) patchEnh({ ...base, deinterlace: true });
            else dropKey("deinterlace");
          }}
        />
        <span>Khử răng cưa (yadif) — video interlaced về progressive</span>
      </label>
      {deintOn && (
        <label className="field">
          <span>Chế độ yadif</span>
          <select
            value={deintMode}
            onChange={(e) => patchEnh({ ...base, deinterlace: { mode: Number(e.target.value) as 0 | 1 } })}
          >
            <option value={0}>0 — giữ fps (an toàn)</option>
            <option value={1}>1 — mỗi field 1 frame (tăng gấp đôi fps)</option>
          </select>
        </label>
      )}

      <label className="field mask-check">
        <input
          type="checkbox"
          checked={stabOn}
          onChange={(e) => {
            if (e.target.checked) patchEnh({ ...base, stabilize: { smoothing: STABILIZE_DEFAULTS.smoothing } });
            else dropKey("stabilize");
          }}
        />
        <span>Chống rung (vidstab 2-pass) — làm mượt rung tay</span>
      </label>
      {stabOn && (
        <>
          <SliderField
            label={`Làm mượt (smoothing): ${smoothing} frame`}
            value={smoothing}
            min={1}
            max={100}
            step={1}
            onChange={(v) => patchEnh({ ...base, stabilize: { ...base.stabilize, smoothing: v } })}
          />
          <p className="tips">
            Chống rung chạy 2 pass: render sẽ phân tích toàn clip trước rồi mới
            render chính, nên chậm hơn bình thường.
          </p>
        </>
      )}
      {stabOn && hasSpeedRamp && (
        <p className="tips">
          ⚠️ Clip này có speed curve — chống rung KHÔNG dùng chung được với
          speedKeyframes, render sẽ bị chặn. Tắt một trong hai.
        </p>
      )}

      <label className="field mask-check">
        <input
          type="checkbox"
          checked={denoiseOn}
          onChange={(e) => {
            if (e.target.checked) patchEnh({ ...base, denoise: true });
            else dropKey("denoise");
          }}
        />
        <span>Khử nhiễu (hqdn3d) — giảm nhiễu hạt</span>
      </label>
      {denoiseOn && (
        <SliderField
          label={`Cường độ khử nhiễu: ${Math.round(strength * 100)}%`}
          value={Math.round(strength * 100)}
          min={0}
          max={100}
          step={1}
          onChange={(v) => patchEnh({ ...base, denoise: { strength: clamp(v / 100, 0, 1) } })}
        />
      )}

      {showHeavyWarning && (
        <p className="tips">
          ⚠️ Clip này vừa có <b>mask</b> vừa có <b>tăng cường nặng</b> (chống
          rung / khử nhiễu) và dài {clip.duration}s — render sẽ chậm trên máy
          yếu. Số đo thật trên VM 2 vCPU (không GPU): 720p mask + khử nhiễu
          đạt ~17.6 fps, tức clip 60s mất ~100s chỉ riêng bước render; 1080p
          chậm thêm ~3×. Chống rung còn cộng thêm 1 pass phân tích toàn clip.
          Gợi ý: render thử đoạn ngắn trước, hoặc tắt bớt một trong hai.
        </p>
      )}

      {!enh && (
        <div className="btn-row">
          <button
            className="primary"
            onClick={() => patchEnh({ denoise: true })}
          >
            ✨ Bật khử nhiễu nhanh
          </button>
        </div>
      )}
      {enh && (
        <div className="btn-row">
          <button onClick={() => patchEnh(undefined)}>Tắt tất cả tăng cường</button>
        </div>
      )}
    </div>
  );
}
