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
 * Phase 9 đợt 12 (luồng T5) — SPEED-CURVE EDITOR (đóng nợ đợt 11 P5):
 * trước đây không có UI nào tạo được speedKeyframes nên nhánh dương của
 * cảnh báo stabilize+ramp (MotionPanel/EnhancePanel) không click-test
 * được. Panel nay có thêm khối "Đường cong tốc độ": bật → tạo
 * speedKeyframes thật qua patchClip (lưu vào project, undo/redo hoạt
 * động, preview đi theo ramp qua rampSourceTimeAt, render chia đoạn qua
 * planSpeedSegments), preset 2 điểm, sửa từng điểm (t/v/easing), thêm/
 * xoá điểm. Khi có curve, tốc độ hằng ở trên bị curve ghi đè (đúng
 * ngữ nghĩa speedcurve.ts) — panel ghi rõ điều này, không giấu.
 * Cảnh báo thật (không chặn cứng, giống MotionPanel/EnhancePanel):
 * curve + reverse và curve + stabilize đều bị validator/render chặn.
 *
 * Phase 9 đợt 13 (luồng C5) — BEZIER 4 SỐ + TRIM CẮT KEYFRAME THỪA:
 * - Điểm có easing bezier hiện 4 ô nhập x1/y1/x2/y2 (x trong [0, 1],
 *   y tự do theo chuẩn cubic-bezier); số hợp lệ ghi thẳng vào keyframe
 *   qua patchClip nên preview (rampSourceTimeAt) và render
 *   (planSpeedSegments) đều dùng chung mảng đó, không chỉ lưu cho đẹp.
 * - store.ts trimClip nay tự cắt/dịch speedKeyframes theo trim (hàm
 *   trimSpeedKeyframes trong speedcurve.ts) và báo bằng toast khi có
 *   điểm bị cắt. Xem docs/PHASE9_ROUND13_C5_SPEEDCURVE_LIMITS.md.
 *
 * TÍCH HỢP ĐÃ XONG (đợt 14 R5, xem docs/PHASE9_ROUND14_R5_NESTED_SPEEDCURVE_LIMITS.md):
 * - splitAtPlayhead nay tách speedKeyframes theo điểm cắt (splitSpeedKeyframes
 *   trong speedcurve.ts) và tính điểm cắt nguồn bằng tích phân ramp.
 * - trimClip nay tính in/out bằng tích phân ramp (rampTrimLeftIn/
 *   rampTrimRightOut) cho clip có curve phát xuôi, thay cho tốc độ hằng.
 * Phase 9 đợt 15 T4 + đợt 16 H3 — PATCHCLIP NAY ĐÃ CẮT CURVE VÀ BÁO RƠI
 * KEYFRAME: đổi duration qua patchClip trực tiếp (không qua trimClip)
 * nay cắt curve về [0, newDur) kèm điểm biên (T4) và báo bằng toast số
 * keyframe bị cắt kèm gợi ý Undo, đồng thời trả về số đó cho caller (H3).
 * Lưu ý: applySpeed (tốc độ hằng) trên clip có curve nay cũng cắt curve
 * theo duration mới qua patchClip — panel vẫn cho thao tác này và toast
 * sẽ báo, chưa chặn cứng (quyết định UX để sau).
 * CÒN LẠI: reverse + curve vẫn bị validator cấm. Nested sâu hơn 1 cấp
 * đã nối vào store cho split/trim thật trên timeline (đợt 16 H2:
 * splitNestedClip/trimNestedClip trong nestUtils.ts, cửa sổ lá sâu suy
 * ra bằng composeNestedLeafWindow) — câu "chưa nối vào store" cũ nay
 * lỗi thời, đã sửa ở bước gộp đợt 16.
 */
import { useState } from "react";
import { useStore } from "../../store";
import { t as i18nT, useLang } from "../../i18n";
import "./speed.css";
import {
  DEFAULT_SPEED_BEZIER,
  SPEED_MAX,
  SPEED_MIN,
  SPEED_PRESETS,
  clampSpeed,
  clipReversed,
  clipSpeed,
  durationForSpeed,
  isSpeedable,
  normalizeSpeedKeyframes,
  type SpeedCurve,
  type SpeedEasing,
  type SpeedKeyframe,
} from "@repo-1/video-spec";
import { fmtTime } from "../../lib";

const MIN_CLIP_DURATION = 0.2; // quy ước chung của editor

export function SpeedPanel() {
  useLang();
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const [warn, setWarn] = useState<string | null>(null);

  const primary = selection[0] ?? null;
  if (!primary) return null;
  const track = spec.tracks.find((t) => t.id === primary.trackId);
  const clip = track?.clips.find((c) => c.id === primary.clipId);
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
        i18nT("speed.warnTooShort", { s: String(s), min: String(MIN_CLIP_DURATION) }),
      );
      return;
    }
    if (wouldOverlap(newDur)) {
      setWarn(i18nT("speed.warnOverlap", { dur: fmtTime(newDur) }));
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
      setWarn(i18nT("speed.warnResetOverlap"));
      return;
    }
    st.patchClip(track.id, clip.id, { speed: 1, reverse: false } as Partial<typeof clip>);
  };

  // --- Speed curve (đợt 12 T5): speedKeyframes thật qua patchClip. ---
  const curve = (clip as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  const hasCurve = !!curve && curve.keyframes.length > 0;
  const kfs = hasCurve ? normalizeSpeedKeyframes(curve.keyframes) : [];
  const curveEnd = Math.round(clip.duration * 10) / 10;
  const hasStabilize =
    (clip as { enhance?: { stabilize?: unknown } }).enhance?.stabilize !== undefined;
  const clampCurveV = (v: number) => Math.min(4, Math.max(0.25, Math.round(v * 20) / 20));
  const patchCurve = (next: SpeedCurve | undefined) => {
    setWarn(null);
    st.patchClip(track.id, clip.id, { speedKeyframes: next } as Partial<typeof clip>);
  };
  const enableCurve = () =>
    patchCurve({
      keyframes: [
        { t: 0, v: 1, easing: "linear" },
        { t: curveEnd, v: 1, easing: "linear" },
      ],
    });
  const applyCurvePreset = (v0: number, v1: number) =>
    patchCurve({
      keyframes: [
        { t: 0, v: v0, easing: "linear" },
        { t: curveEnd, v: v1, easing: "linear" },
      ],
    });
  const updateKf = (i: number, patch: Partial<SpeedKeyframe>) => {
    const lo = i > 0 ? kfs[i - 1].t : 0;
    const hi = i < kfs.length - 1 ? kfs[i + 1].t : curveEnd;
    const next = kfs.map((k, j) => {
      if (j !== i) return k;
      const merged = { ...k, ...patch };
      if (patch.t !== undefined) {
        merged.t = Math.min(hi, Math.max(lo, Math.round(patch.t * 10) / 10));
      }
      if (patch.v !== undefined) merged.v = clampCurveV(patch.v);
      // Phase 9 đợt 13 C5: chuyển sang bezier mà chưa có mảng số thì ghi
      // luôn mảng mặc định (trùng fallback của engine) để số hiển thị và
      // số render khớp nhau; chuyển đi rồi quay lại vẫn giữ mảng cũ vì
      // updateKf không xoá field bezier khi đổi easing khác.
      if (patch.easing === "bezier" && !k.bezier) {
        merged.bezier = [...DEFAULT_SPEED_BEZIER];
      }
      return merged;
    });
    patchCurve({ keyframes: normalizeSpeedKeyframes(next) });
  };
  // Phase 9 đợt 13 C5: sửa 1 trong 4 số bezier của 1 điểm.
  // Chuẩn cubic-bezier: x1, x2 phải trong [0, 1]; y1, y2 tự do (số hữu hạn).
  // Số không hợp lệ thì báo warn và GIỮ giá trị cũ (không ghi đè bằng NaN
  // hay số ngoài miền rồi để validator/render chặn sau).
  const updateBezier = (i: number, bi: number, raw: string) => {
    if (raw.trim() === "") {
      setWarn(i18nT("speed.bezierInvalid"));
      return;
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      setWarn(i18nT("speed.bezierInvalid"));
      return;
    }
    const isX = bi === 0 || bi === 2;
    if (isX && (num < 0 || num > 1)) {
      setWarn(i18nT("speed.bezierXRange"));
      return;
    }
    const kf = kfs[i];
    const bez = (kf.bezier ?? DEFAULT_SPEED_BEZIER) as [number, number, number, number];
    const next: [number, number, number, number] = [...bez];
    next[bi] = Math.round(num * 100) / 100;
    updateKf(i, { bezier: next });
  };
  const addKf = () => {
    // Điểm mới ở giữa khoảng trống lớn nhất (không trùng điểm cũ).
    const bounds = [0, ...kfs.map((k) => k.t), curveEnd];
    let bestT = curveEnd / 2;
    let bestGap = 0;
    for (let i = 0; i < bounds.length - 1; i++) {
      const gap = bounds[i + 1] - bounds[i];
      if (gap > bestGap) {
        bestGap = gap;
        bestT = Math.round(((bounds[i] + bounds[i + 1]) / 2) * 10) / 10;
      }
    }
    if (bestGap < 0.2) {
      setWarn(i18nT("speed.warnNoGap"));
      return;
    }
    patchCurve({
      keyframes: normalizeSpeedKeyframes([
        ...kfs,
        { t: bestT, v: 1, easing: "linear" },
      ]),
    });
  };
  const removeKf = (i: number) => {
    if (kfs.length <= 1) return;
    patchCurve({ keyframes: kfs.filter((_, j) => j !== i) });
  };
  const fmtV = (v: number) => String(Math.round(v * 100) / 100);
  const fmtT = (t: number) => String(Math.round(t * 10) / 10);

  return (
    <div className="speed-panel">
      <div className="panel-head" style={{ marginTop: 12 }}>{i18nT("speed.head")}</div>

      <label className="field">
        <span>
          {i18nT("speed.speedLabel")}: <b>{speed}×</b>
          {reversed && <b className="reverse-badge"> {i18nT("speed.reverseBadge")}</b>}
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
              title={disabled ? i18nT("speed.presetTooShort", { p: String(p) }) : i18nT("speed.presetSet", { p: String(p) })}
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
          title={i18nT("speed.reverseTitle")}
        >
          {reversed ? i18nT("speed.reversing") : i18nT("speed.forward")}
        </button>
        {(speed !== 1 || reversed) && (
          <button className="toggle" onClick={reset} title={i18nT("speed.resetTitle")}>
            {i18nT("speed.reset")}
          </button>
        )}
      </div>

      <div className="info-rows">
        <div>
          <span>{i18nT("speed.srcLabel")}</span>
          <b>{fmtTime(srcLen)} <span className="muted">[{clip.in.toFixed(1)}s – {clip.out.toFixed(1)}s]</span></b>
        </div>
        <div>
          <span>{i18nT("speed.effLabel")}</span>
          <b>{fmtTime(clip.duration)}</b>
        </div>
      </div>

      {/* Speed curve — tạo speedKeyframes thật (đợt 12 T5). */}
      <div className="speed-curve">
        <div className="panel-head" style={{ marginTop: 12 }}>{i18nT("speed.curveHead")}</div>
        {!hasCurve && (
          <>
            <div className="btn-row">
              <button className="toggle curve-enable-btn" onClick={enableCurve}>
                {i18nT("speed.curveEnable")}
              </button>
            </div>
            <p className="tips">{i18nT("speed.curveTip")}</p>
          </>
        )}
        {hasCurve && (
          <>
            <p className="tips">{i18nT("speed.curveNote")}</p>
            <div className="btn-row speed-presets">
              <button className="toggle curve-preset" data-preset="flat" onClick={() => applyCurvePreset(1, 1)}>
                {i18nT("speed.presetFlat")}
              </button>
              <button className="toggle curve-preset" data-preset="slow-fast" onClick={() => applyCurvePreset(0.5, 2)}>
                {i18nT("speed.presetSlowFast")}
              </button>
              <button className="toggle curve-preset" data-preset="fast-slow" onClick={() => applyCurvePreset(2, 0.5)}>
                {i18nT("speed.presetFastSlow")}
              </button>
            </div>
            {kfs.map((kf, i) => {
              const tMin = i > 0 ? kfs[i - 1].t : 0;
              const tMax = i < kfs.length - 1 ? kfs[i + 1].t : curveEnd;
              return (
                <div className="curve-kf" data-index={i} key={i}>
                  <div className="curve-kf-label">
                    <span>
                      {i18nT("speed.kfLabel", { i: String(i + 1), v: fmtV(kf.v), t: fmtT(kf.t) })}
                    </span>
                    {kfs.length > 1 && (
                      <button className="toggle curve-kf-remove" onClick={() => removeKf(i)}>
                        {i18nT("speed.removeKf")}
                      </button>
                    )}
                  </div>
                  <label className="field">
                    <span>{i18nT("speed.kfTime", { t: fmtT(kf.t) })}</span>
                    <input
                      className="curve-kf-t"
                      type="range"
                      min={tMin}
                      max={tMax}
                      step={0.1}
                      value={kf.t}
                      disabled={tMax <= tMin}
                      onChange={(e) => updateKf(i, { t: Number(e.target.value) })}
                    />
                  </label>
                  <label className="field">
                    <span>{i18nT("speed.kfSpeed", { v: fmtV(kf.v) })}</span>
                    <input
                      className="curve-kf-v"
                      type="range"
                      min={0.25}
                      max={4}
                      step={0.05}
                      value={kf.v}
                      onChange={(e) => updateKf(i, { v: Number(e.target.value) })}
                    />
                  </label>
                  {i < kfs.length - 1 && (
                    <label className="field">
                      <span>{i18nT("speed.kfEasing")}</span>
                      <select
                        className="curve-kf-easing"
                        value={kf.easing}
                        onChange={(e) => updateKf(i, { easing: e.target.value as SpeedEasing })}
                      >
                        <option value="linear">linear</option>
                        <option value="ease-in">ease-in</option>
                        <option value="ease-out">ease-out</option>
                        <option value="bezier">bezier</option>
                      </select>
                    </label>
                  )}
                  {i < kfs.length - 1 && kf.easing === "bezier" && (
                    <div className="curve-bezier">
                      <span>{i18nT("speed.bezierHead")}</span>
                      <div className="bezier-row">
                        {(["x1", "y1", "x2", "y2"] as const).map((name, bi) => (
                          <label className="bezier-field" key={name}>
                            <span>{name}</span>
                            <input
                              className="curve-bezier-input"
                              data-bezier={name}
                              type="number"
                              step={0.01}
                              value={(kf.bezier ?? DEFAULT_SPEED_BEZIER)[bi]}
                              onChange={(e) => updateBezier(i, bi, e.target.value)}
                            />
                          </label>
                        ))}
                      </div>
                      <p className="tips">{i18nT("speed.bezierHint")}</p>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="btn-row">
              <button className="toggle curve-add-btn" onClick={addKf}>
                {i18nT("speed.addKf")}
              </button>
              <button className="toggle curve-disable-btn" onClick={() => patchCurve(undefined)}>
                {i18nT("speed.curveDisable")}
              </button>
            </div>
            {reversed && <p className="warn">{i18nT("speed.warnReverseRamp")}</p>}
            {hasStabilize && <p className="warn">{i18nT("speed.warnStabilizeRamp")}</p>}
          </>
        )}
      </div>

      {warn && <p className="warn">{warn}</p>}
      {!warn && (
        <p className="tips">
          {i18nT("speed.tip")}
        </p>
      )}
    </div>
  );
}
