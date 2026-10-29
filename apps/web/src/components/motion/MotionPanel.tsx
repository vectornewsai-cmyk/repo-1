/**
 * MotionPanel — panel slow-mo mượt / nội suy frame / motion blur cho clip
 * video (Phase 9 đợt 8, luồng S5-UI).
 *
 * Theo mẫu EnhancePanel: lấy clip đang chọn từ store, mọi thay đổi qua
 * `patchClip` sẵn có để undo/redo hoạt động (không sửa store.ts).
 * Ghi vào `clip.motion` theo shape S1 (packages/video-spec/src/motion.ts):
 * mọi patch đều sinh motion hợp lệ với validateMotion — đặc biệt khi tắt
 * nội suy thì gỡ luôn targetFps/miMode (S1 cấm kèm hai key này khi
 * interpolation là "none"). Xem motion.ts + MOTION_UI_LIMITS.md.
 *
 * Lưu ý trung thực:
 * - Slow-mo / nội suy / motion blur CHỈ có tác dụng khi render — preview
 *   chỉ xấp xỉ (theo S4), không phải kết quả render thật.
 * - Nội suy + chống rung DÙNG CHUNG ĐƯỢC ở nhánh thường (vidstab chạy
 *   trước minterpolate — đợt 9 M4 đã render thật chứng minh); tổ hợp bị
 *   validator chặn thật là chống rung + speed curve, panel chỉ cảnh báo
 *   đúng tổ hợp đó.
 * - Không ghi số fps benchmark nào ở đây (S5 không đo render đợt này):
 *   cảnh báo hiệu năng chỉ viết định tính — clip dài + nội suy render
 *   chậm, nên thử đoạn ngắn trước.
 */
import { useStore } from "../../store";
import { t as i18nT } from "../../i18n";
import {
  MOTION_BLUR_DEFAULT_FRAMES,
  MOTION_BLUR_FRAMES_MAX,
  MOTION_BLUR_FRAMES_MIN,
  MOTION_MI_MODES,
  MOTION_TARGET_FPS_OPTIONS,
  estimateInterpCost,
  hasClipTransition,
  isFpsMismatch,
  isTargetFpsDisabled,
  isTransitionFpsBlocked,
  resolveMotion,
  withBlurFrames,
  withBlurWeight,
  withInterpolation,
  withMiMode,
  withMotionBlur,
  withTargetFps,
  type ClipMotion,
  type MotionInterpolation,
  type MotionMiMode,
  type MotionTargetFps,
} from "./motion";

export function MotionPanel() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const st = useStore.getState();

  const primary = selection[0] ?? null;
  if (!primary) {
    return (
      <div className="mask-panel">
        <p className="tips">{i18nT("motion.tipSelect")}</p>
      </div>
    );
  }
  const track = spec.tracks.find((t) => t.id === primary.trackId);
  const clip = track?.clips.find((c) => c.id === primary.clipId);
  if (!track || !clip) {
    return (
      <div className="mask-panel">
        <p className="tips">{i18nT("motion.tipGone")}</p>
      </div>
    );
  }
  if (clip.kind !== "video") {
    const kindKey =
      clip.kind === "text"
        ? "motion.kindText"
        : clip.kind === "audio"
          ? "motion.kindAudio"
          : clip.kind === "image"
            ? "motion.kindImage"
            : "motion.kindSticker";
    return (
      <div className="mask-panel">
        <p className="tips">{i18nT("motion.tipUnsupported", { kind: i18nT(kindKey) })}</p>
      </div>
    );
  }

  const motion = resolveMotion(
    (clip as { motion?: ClipMotion }).motion,
  );
  const patchMotion = (next: ClipMotion | undefined) => {
    st.patchClip(track.id, clip.id, { motion: next } as Partial<typeof clip>);
  };

  const interpOn = motion?.interpolation === "minterpolate";
  const fpsDisabled = isTargetFpsDisabled(motion);
  const blurOn = motion?.motionBlur !== undefined;
  const blurFrames = motion?.motionBlur?.frames ?? MOTION_BLUR_DEFAULT_FRAMES;
  const blurWeights = motion?.motionBlur?.weights ?? [];
  const hasStabilize =
    (clip as { enhance?: { stabilize?: unknown } }).enhance?.stabilize !== undefined;
  // Đợt 9 tích hợp (sửa cảnh báo sai của đợt 8/M3): stabilize + interpolation
  // ĐƯỢC PHÉP ở nhánh thường (M4 render thật). Tổ hợp bị validator chặn thật
  // là stabilize + speedKeyframes — chỉ cảnh báo đúng tổ hợp đó.
  const hasSpeedRamp =
    (clip as { speedKeyframes?: unknown }).speedKeyframes !== undefined;
  // Cảnh báo đợt 9 M3 (logic thuần trong motion.ts, đúng rule fail-fast
  // của server/render/src/motion.js validateMotion).
  const projectFps = (spec as { meta?: { fps?: number } }).meta?.fps;
  const clipTrans = clip as {
    transitionIn?: { type?: string };
    transitionOut?: { type?: string };
  };
  const hasTransition = hasClipTransition(clipTrans.transitionIn, clipTrans.transitionOut);
  const fpsMismatch = isFpsMismatch(motion, projectFps);
  const transitionBlocked = isTransitionFpsBlocked(motion, hasTransition, projectFps);
  const interpCost = interpOn
    ? estimateInterpCost(motion, clip.duration, projectFps)
    : null;

  return (
    <div className="mask-panel">
      <p className="tips">{i18nT("motion.intro")}</p>
      <p className="tips">{i18nT("motion.warnRenderOnly")}</p>

      <label className="field">
        <span>{i18nT("motion.interpLabel")}</span>
        <select
          value={interpOn ? "minterpolate" : "none"}
          onChange={(e) =>
            patchMotion(
              withInterpolation(motion, e.target.value as MotionInterpolation),
            )
          }
        >
          <option value="none">{i18nT("motion.interpNone")}</option>
          <option value="minterpolate">{i18nT("motion.interpMinterpolate")}</option>
        </select>
      </label>

      <label className="field">
        <span>{i18nT("motion.targetFps")}</span>
        <select
          disabled={fpsDisabled}
          value={motion?.targetFps ?? 30}
          onChange={(e) =>
            patchMotion(
              withTargetFps(motion, Number(e.target.value) as MotionTargetFps),
            )
          }
        >
          {MOTION_TARGET_FPS_OPTIONS.map((fps) => (
            <option key={fps} value={fps}>
              {fps} fps
            </option>
          ))}
        </select>
      </label>
      {fpsDisabled && (
        <p className="tips">{i18nT("motion.targetFpsNote")}</p>
      )}

      <label className="field">
        <span>{i18nT("motion.miModeLabel")}</span>
        <select
          disabled={fpsDisabled}
          value={motion?.miMode ?? "mci"}
          onChange={(e) =>
            patchMotion(withMiMode(motion, e.target.value as MotionMiMode))
          }
        >
          {MOTION_MI_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode === "mci" ? i18nT("motion.miModeMci") : i18nT("motion.miModeBlend")}
            </option>
          ))}
        </select>
      </label>
      {fpsDisabled && (
        <p className="tips">{i18nT("motion.miModeNote")}</p>
      )}

      {interpOn && transitionBlocked && (
        <p className="tips">{i18nT("motion.warnTransitionFps", {
          target: String(motion?.targetFps ?? ""),
          project: String(projectFps ?? ""),
        })}</p>
      )}
      {interpOn && fpsMismatch && !transitionBlocked && (
        <p className="tips">{i18nT("motion.warnFpsMismatch", {
          target: String(motion?.targetFps ?? ""),
          project: String(projectFps ?? ""),
        })}</p>
      )}
      {hasStabilize && hasSpeedRamp && (
        <p className="tips">{i18nT("motion.warnStabilize")}</p>
      )}
      {interpOn && interpCost && (
        <p className="tips">{i18nT("motion.costEstimate", {
          dur: String(Math.round(clip.duration * 10) / 10),
          fps: String(motion?.targetFps ?? ""),
          frames: String(interpCost.outputFrames),
          ratio: interpCost.ratioToProjectFps !== null
            ? String(Math.round(interpCost.ratioToProjectFps * 10) / 10)
            : "?",
        })}</p>
      )}
      {interpOn && (
        <p className="tips">{i18nT("motion.warnLong")}</p>
      )}

      <label className="field mask-check">
        <input
          type="checkbox"
          checked={blurOn}
          onChange={(e) =>
            patchMotion(withMotionBlur(motion, e.target.checked, blurFrames))
          }
        />
        <span>{i18nT("motion.blurEnable")}</span>
      </label>
      {blurOn && (
        <label className="field">
          <span>{i18nT("motion.blurFrames", { n: String(blurFrames) })}</span>
          <input
            type="range"
            min={MOTION_BLUR_FRAMES_MIN}
            max={MOTION_BLUR_FRAMES_MAX}
            step={1}
            value={blurFrames}
            onChange={(e) =>
              patchMotion(withBlurFrames(motion, Number(e.target.value)))
            }
          />
        </label>
      )}
      {blurOn && (
        <>
          <p className="tips">{i18nT("motion.blurWeightsLabel")}</p>
          {blurWeights.slice(0, blurFrames).map((w, i) => (
            <label className="field" key={i}>
              <span>{i18nT("motion.blurWeight", {
                i: String(i + 1),
                pct: String(Math.round(w * 100)),
              })}</span>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={Math.min(100, Math.max(1, Math.round(w * 100)))}
                onChange={(e) =>
                  patchMotion(withBlurWeight(motion, i, Number(e.target.value) / 100))
                }
              />
            </label>
          ))}
          <p className="tips">{i18nT("motion.blurWeightsNote")}</p>
          <div className="btn-row">
            <button onClick={() => patchMotion(withBlurFrames(motion, blurFrames))}>
              {i18nT("motion.blurWeightsReset")}
            </button>
          </div>
        </>
      )}

      {motion && (
        <div className="btn-row">
          <button onClick={() => patchMotion(undefined)}>
            {i18nT("motion.disableAll")}
          </button>
        </div>
      )}
    </div>
  );
}
