/**
 * EnhancePanel — panel tăng cường cho clip video (Phase 9 R2).
 *
 * Nối clip.enhance (đã có sẵn ở server/render từ Phase 7 P2) ra giao diện:
 * khử răng cưa (yadif), chống rung (vidstab 2-pass), khử nhiễu (hqdn3d).
 * Chỉ video clip (validate.js chặn enhance trên track khác).
 *
 * Lưu ý trung thực (đợt 60 Q1 — preview nay ÁP enhance ở mức xấp xỉ,
 * xem lib/enhancePreview.ts + docs/PHASE9_ROUND60_Q1_PREVIEW_ENHANCE_LIMITS.md):
 * denoise → blur nhẹ, stabilize → zoom crop gợi ý, deinterlace KHÔNG có
 * xấp xỉ trực quan (yadif chỉ ở render). Toggle "xem trước enhance" trong
 * panel này bật/tắt phần xấp xỉ đó; bản render luôn áp enhance thật.
 * - Chống rung KHÔNG dùng chung được với speedKeyframes (validator chặn,
 *   vì pass vidstabdetect phân tích theo trim gốc, không khớp đoạn ramp).
 * - Cảnh báo mask + enhance nặng lấy từ số đo thật trong test_r2.js
 *   (xem server/render/src/R2_LIMITS.md): 720p mask + khử nhiễu ~17.6 fps
 *   trên VM 2 vCPU không GPU.
 * - Đợt 64 R2: cảnh báo ghosting khi denoise ≥0,7 trên clip chuyển động
 *   nhanh — đo chuyển động THẬT bằng frame-diff trên <video> offscreen
 *   (xem ./fastMotion.ts); không đo được thì cảnh báo chung.
 * - Đợt 65 S2: cảnh báo ở ≥0,7 với MỌI mức chuyển động đo được (kể cả
 *   chậm/vừa, câu riêng kèm score) — footage thật cho thấy clip chậm vẫn
 *   ghost như clip nhanh (xem ./fastMotion.ts + docs/PHASE9_ROUND65_S2_LIMITS.md).
 */
import { useEffect, useState } from "react";
import { useStore } from "../../store";
import { clamp } from "../../lib";
import { getLang, t, useLang } from "../../i18n";
import {
  DENOISE_WARN_STRENGTH,
  fastMotionCacheKey,
  fastMotionStrings,
  formatFastMotionWarning,
  measureClipMotionCached,
  shouldWarnDenoiseGhosting,
  type MotionResult,
} from "./fastMotion";
import {
  DENOISE_DEFAULT_STRENGTH,
  STABILIZE_DEFAULTS,
  type ClipEnhance,
} from "@repo-1/video-spec";
import {
  applyEnhancePreset,
  enhanceActiveLabels,
  enhanceT,
  isEnhancePresetSpeedBlocked,
  isStabilizeToggleDisabled,
  matchEnhancePreset,
  type EnhancePresetId,
} from "./presets";

/** Ngưỡng cảnh báo mask + enhance nặng (giây, theo số đo R2). */
const HEAVY_WARN_SECONDS = 30;

type MotionUiState =
  | { status: "idle" }
  | { status: "measuring" }
  | { status: "done"; score: number; level: "slow" | "medium" | "fast"; nPairs: number; costMs: number }
  | { status: "unknown" };

/**
 * Đợt 64 R2: cảnh báo ghosting denoise ≥0,7 theo chuyển động ĐO ĐƯỢC.
 * Đợt 65 S2: cảnh báo ở ≥0,7 với MỌI mức đo được (slow/medium/fast) —
 * R4 + S2 đo trên footage thật: bước nhảy ghost 0,5→0,7 không đổi theo
 * tốc độ, cổng cũ chỉ-fast bỏ sót 4/6 clip thật ghost-positive.
 * Component con riêng để hooks (useState/useEffect) không vướng các
 * early-return của EnhancePanel (chọn clip / không phải video).
 *
 * Hành vi: denoise <0,7 → không đo, không cảnh báo. denoise ≥0,7 →
 * đo chuyển động trên đoạn nguồn [inSec, outSec] (cache theo clip+trim):
 * fast → cảnh báo cụ thể kèm score; slow/medium → cảnh báo riêng (câu
 * slow, kèm score + level — không gọi clip là "chuyển động nhanh");
 * không đo được (thiếu media / decode lỗi) → cảnh báo chung.
 */
function DenoiseMotionWarning({
  clipId,
  clipSrc,
  inSec,
  outSec,
  denoiseOn,
  strength,
}: {
  clipId: string;
  clipSrc: string;
  inSec: number;
  outSec: number;
  denoiseOn: boolean;
  strength: number;
}) {
  const mediaItem = useStore((s) => s.media.find((m) => m.name === clipSrc));
  const [motion, setMotion] = useState<MotionUiState>({ status: "idle" });
  const mediaUrl = mediaItem?.url;
  const proxyUrl = mediaItem?.proxyUrl;
  useEffect(() => {
    if (!denoiseOn || strength < DENOISE_WARN_STRENGTH) {
      setMotion({ status: "idle" });
      return;
    }
    if (!mediaItem) {
      setMotion({ status: "unknown" });
      return;
    }
    const key = fastMotionCacheKey(clipId, clipSrc, inSec, outSec);
    let cancelled = false;
    setMotion({ status: "measuring" });
    measureClipMotionCached(key, mediaItem.url, { inSec, outSec, proxyUrl: mediaItem.proxyUrl })
      .then((r: MotionResult) => {
        if (!cancelled) {
          setMotion({ status: "done", score: r.score, level: r.level, nPairs: r.nPairs, costMs: r.costMs });
        }
      })
      .catch(() => {
        if (!cancelled) setMotion({ status: "unknown" });
      });
    return () => {
      cancelled = true;
    };
    // mediaUrl/proxyUrl là string ổn định — đổi file thì cache key cũng đổi theo clip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [denoiseOn, strength, mediaUrl, proxyUrl, clipId, clipSrc, inSec, outSec]);

  if (motion.status === "idle") return null;
  const strings = fastMotionStrings(getLang());
  if (motion.status === "measuring") {
    return (
      <p className="tips" data-testid="enhance-motion-measuring">
        {strings.measuring}
      </p>
    );
  }
  if (motion.status === "unknown") {
    return (
      <p className="tips" data-testid="enhance-denoise-motion-unknown-warning">
        {formatFastMotionWarning(strings.unknown, { score: 0, pct: strength * 100 })}
      </p>
    );
  }
  if (shouldWarnDenoiseGhosting(strength, motion.level)) {
    if (motion.level === "fast") {
      return (
        <p className="tips" data-testid="enhance-denoise-fast-motion-warning">
          {formatFastMotionWarning(strings.warning, {
            score: motion.score,
            pct: strength * 100,
            level: strings.levelFast,
          })}
        </p>
      );
    }
    // slow/medium (đợt 65 S2): vẫn cảnh báo — câu riêng, kèm score + level.
    return (
      <p className="tips" data-testid="enhance-denoise-slow-motion-warning">
        {formatFastMotionWarning(strings.warningSlow, {
          score: motion.score,
          pct: strength * 100,
          level: motion.level === "medium" ? strings.levelMedium : strings.levelSlow,
        })}
      </p>
    );
  }
  return null;
}

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
  useLang(); // re-render khi đổi ngôn ngữ
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const st = useStore.getState();
  // Đợt 60 Q1: toggle xem trước enhance (xấp xỉ) — cờ UI trong store, mặc định bật.
  const enhancePreviewEnabled = useStore((s) => s.enhancePreviewEnabled);

  const primary = selection[0] ?? null;
  if (!primary) {
    return (
      <div className="mask-panel">
        <p className="tips">{t("enhance.selectClip")}</p>
      </div>
    );
  }
  const track = spec.tracks.find((t) => t.id === primary.trackId);
  const clip = track?.clips.find((c) => c.id === primary.clipId);
  if (!track || !clip) {
    return (
      <div className="mask-panel">
        <p className="tips">{t("keyframe.tipGone")}</p>
      </div>
    );
  }
  if (clip.kind !== "video") {
    return (
      <div className="mask-panel">
        <p className="tips">
          {t("enhance.videoOnly", { doc: "server/render/src/ENHANCE_LIMITS.md" })}
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

  // Phase 9 R59 P8: preset một chạm + dòng tóm tắt trạng thái đang bật.
  const preset = matchEnhancePreset(enh);
  const activeLabels = enhanceActiveLabels(enh);

  return (
    <div className="mask-panel">
      <p className="tips">
        {enhanceT(
          "enhance.previewApprox",
          "Bản xem trước chỉ là xấp xỉ — khử nhiễu là mờ nhẹ, chống rung là crop/scale gợi ý, khử răng cưa không hiện; bản render mới chính xác.",
        )}
      </p>

      <label className="field">
        <span>{enhanceT("enhance.presetLabel", "Preset tăng cường")}</span>
        <select
          data-testid="enhance-preset"
          value={preset}
          title={
            hasSpeedRamp
              ? enhanceT(
                  "enhance.presetSpeedTitle",
                  "Preset Cân bằng/Mạnh bị tắt vì clip có speed curve — chống rung không dùng chung được với speedKeyframes",
                )
              : undefined
          }
          onChange={(e) =>
            patchEnh(applyEnhancePreset(enh, e.target.value as EnhancePresetId | "custom"))
          }
        >
          <option value="off">{enhanceT("enhance.presetOff", "Tắt")}</option>
          <option value="light">{enhanceT("enhance.presetLight", "Nhẹ — khử nhiễu nhẹ")}</option>
          <option value="balanced" disabled={isEnhancePresetSpeedBlocked("balanced", hasSpeedRamp)}>{enhanceT("enhance.presetBalanced", "Cân bằng — chống rung + khử nhiễu")}</option>
          <option value="strong" disabled={isEnhancePresetSpeedBlocked("strong", hasSpeedRamp)}>{enhanceT("enhance.presetStrong", "Mạnh — chống rung mạnh + khử nhiễu mạnh")}</option>
          {preset === "custom" && (
            <option value="custom" disabled>{enhanceT("enhance.presetCustom", "Tùy chỉnh")}</option>
          )}
        </select>
      </label>
      {/* Đợt 61 R2: chặn preset stabilize ở UI khi clip có speed curve —
          render chặn hẳn (exit 1) nên không để user bật rồi mới báo lỗi. */}
      {hasSpeedRamp && (
        <p className="tips" data-testid="enhance-preset-speed-blocked">
          {enhanceT(
            "enhance.presetSpeedBlocked",
            "⚠️ Clip có speed curve nên preset Cân bằng/Mạnh bị tắt — chống rung không dùng chung được với speedKeyframes. Dùng preset Nhẹ (chỉ khử nhiễu) hoặc bỏ speed curve rồi bật lại.",
          )}
        </p>
      )}
      {activeLabels.length > 0 && (
        <p className="tips" data-testid="enhance-summary">
          {enhanceT("enhance.activeSummary", "Đang bật: {list}", { list: activeLabels.join(", ") })}
        </p>
      )}

      {enh && (
        <>
          <label className="field mask-check">
            <input
              type="checkbox"
              data-testid="enhance-preview-toggle"
              checked={enhancePreviewEnabled}
              onChange={(e) => st.setEnhancePreviewEnabled(e.target.checked)}
            />
            <span>{enhanceT("enhance.previewToggle", "Xem trước enhance (xấp xỉ)")}</span>
          </label>
          {!enhancePreviewEnabled && (
            <p className="tips">
              {enhanceT(
                "enhance.previewOffNote",
                "Đã tắt xem trước enhance — bản xem trước hiện khung gốc, bản render vẫn áp enhance.",
              )}
            </p>
          )}
        </>
      )}

      <label className="field mask-check">
        <input
          type="checkbox"
          data-testid="enhance-deinterlace-toggle"
          checked={deintOn}
          onChange={(e) => {
            if (e.target.checked) patchEnh({ ...base, deinterlace: true });
            else dropKey("deinterlace");
          }}
        />
        <span>{t("enhance.deinterlace")}</span>
      </label>
      {deintOn && (
        <label className="field">
          <span>{t("enhance.yadifMode")}</span>
          <select
            value={deintMode}
            onChange={(e) => patchEnh({ ...base, deinterlace: { mode: Number(e.target.value) as 0 | 1 } })}
          >
            <option value={0}>{t("enhance.yadif0")}</option>
            <option value={1}>{t("enhance.yadif1")}</option>
          </select>
        </label>
      )}

      <label className="field mask-check">
        <input
          type="checkbox"
          data-testid="enhance-stabilize-toggle"
          checked={stabOn}
          // Đợt 61 R2: clip có speed curve thì không bật mới được; nếu đang
          // bật (trạng thái lỗi cũ) vẫn mở để user tắt đi sửa lỗi.
          disabled={isStabilizeToggleDisabled(stabOn, hasSpeedRamp)}
          title={
            hasSpeedRamp && !stabOn
              ? enhanceT(
                  "enhance.stabilizeSpeedTitle",
                  "Chống rung không dùng chung được với speed curve của clip này",
                )
              : undefined
          }
          onChange={(e) => {
            if (e.target.checked) patchEnh({ ...base, stabilize: { smoothing: STABILIZE_DEFAULTS.smoothing } });
            else dropKey("stabilize");
          }}
        />
        <span>{t("enhance.stabilize")}</span>
      </label>
      {stabOn && (
        <>
          <SliderField
            label={t("enhance.smoothing", { n: String(smoothing) })}
            value={smoothing}
            min={1}
            max={100}
            step={1}
            onChange={(v) => patchEnh({ ...base, stabilize: { ...base.stabilize, smoothing: v } })}
          />
          <p className="tips">
            {t("enhance.stabTwoPass")}
          </p>
        </>
      )}
      {stabOn && hasSpeedRamp && (
        <p className="tips">
          {t("enhance.stabSpeedConflict")}
        </p>
      )}

      <label className="field mask-check">
        <input
          type="checkbox"
          data-testid="enhance-denoise-toggle"
          checked={denoiseOn}
          onChange={(e) => {
            if (e.target.checked) patchEnh({ ...base, denoise: true });
            else dropKey("denoise");
          }}
        />
        <span>{t("enhance.denoise")}</span>
      </label>
      {denoiseOn && (
        <SliderField
          label={t("enhance.denoiseStrength", { pct: String(Math.round(strength * 100)) })}
          value={Math.round(strength * 100)}
          min={0}
          max={100}
          step={1}
          onChange={(v) => patchEnh({ ...base, denoise: { strength: clamp(v / 100, 0, 1) } })}
        />
      )}
      {denoiseOn && (
        <DenoiseMotionWarning
          clipId={clip.id}
          clipSrc={clip.src}
          inSec={(clip as { in?: number }).in ?? 0}
          outSec={(clip as { out?: number }).out ?? clip.duration}
          denoiseOn={denoiseOn}
          strength={strength}
        />
      )}

      {showHeavyWarning && (
        <p className="tips">
          {t("enhance.heavyWarning", { duration: String(clip.duration) })}
        </p>
      )}

      {!enh && (
        <div className="btn-row">
          <button
            className="primary"
            onClick={() => patchEnh({ denoise: true })}
          >
            {t("enhance.quickDenoise")}
          </button>
        </div>
      )}
      {enh && (
        <div className="btn-row">
          <button onClick={() => patchEnh(undefined)}>{t("enhance.disableAll")}</button>
        </div>
      )}
    </div>
  );
}
