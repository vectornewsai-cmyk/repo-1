/**
 * motion.js — Phase 9 đợt 8 S2: slow-mo mượt / nội suy frame / motion blur.
 *
 * CHỈ dùng filter FFmpeg có sẵn (minterpolate, tmix) — KHÔNG model đóng,
 * KHÔNG RIFE, KHÔNG cloud, KHÔNG gọi API ngoài.
 *
 * SHAPE CHUẨN (theo packages/video-spec/src/motion.ts của S1 — parent đợt 8
 * đã khớp: S3 import trực tiếp builder/validator này, S4/S5 đọc shape S1):
 *   clip.motion = {
 *     interpolation?: 'none' | 'minterpolate',  // mặc định 'none'
 *     targetFps?: number,     // fps đích của minterpolate (1..120);
 *                              // bỏ qua = project fps (slow-mo về đúng nhịp timeline)
 *     miMode?: 'mci' | 'blend', // mặc định 'mci'
 *     motionBlur?: { frames: number, weights?: number[] }, // frames 2..8,
 *                              // weights dài đúng bằng frames; bỏ qua = cân bằng
 *   }
 *
 * VỊ TRÍ CHAIN TRONG render.js (nhánh clip thường — KHÔNG đụng nhánh
 * speed-ramp, nhánh ramp thuộc luồng S3):
 *   ... scale, pad, setsar=1, [fps|MINTERPOLATE,fps], [TMIX], format, color, ...
 * - interpolation THAY THẾ filter fps=<projectFps> bằng cặp
 *   `minterpolate=fps=<targetFps>:...,fps=<targetFps>`. Lý do có fps thứ
 *   hai (đo thật trên FFmpeg 8.1.2): minterpolate bidir cần frame lookahead
 *   nên RỚT ~1 khoảng frame input ở đuôi (testsrc2 15fps + speed 0.5:
 *   113 frame thay vì 120, thiếu 0.23s) — đuôi unit sẽ ngắn hơn slot
 *   timeline và để lộ nền đen. fps=<targetFps> sau minterpolate chỉ việc
 *   lấp đầy lưới CFR bằng cách giữ lại frame cuối (không hủy nội suy ở
 *   giữa chuỗi vì các frame đã nằm đúng lưới 1/targetFps) — kết quả đo
 *   lại: đúng 120 frame / 4s. Tác dụng phụ: ~0.23s cuối clip bị "đóng
 *   băng" frame cuối thay vì đen — xem MOTION_LIMITS.md.
 * - motionBlur (tmix) đi NGAY SAU bước fps/minterpolate, TRƯỚC format:
 *   blur là xử lý theo trục thời gian nên áp trên chuỗi frame thô, trước
 *   các xử lý pixel từng frame (color/LUT/effects) để grading không bị
 *   nhòe theo và effect (vd sharpen) vẫn tác dụng được lên ảnh đã blur.
 * - Khi chỉ có motionBlur không interpolation: giữ fps=<projectFps> rồi
 *   thêm tmix ngay sau — thứ tự y hệt, không có trường hợp đặc biệt.
 * - Alpha: minterpolate/tmix chạy được trên yuva420p (clip chromaKey /
 *   nguồn có alpha) — đã test case alpha, xem test_motion_render.js (d).
 *   Lưu ý: minterpolate có thể tự convert pix_fmt nội bộ nhưng vẫn giữ
 *   kênh alpha đi qua; format=yuva420p cuối chain giữ nguyên.
 *
 * Phase 9 đợt 9 M1 — VÁ ĐUÔI ĐÓNG BĂNG (đo thật, xem MOTION_LIMITS.md
 * mục M1): fps=<targetFps> sau minterpolate lấp đủ frame nhưng đóng
 * băng ~0.23s cuối ở frame nội suy áp chót (cách frame nguồn cuối thật
 * tới 5.1 đơn vị diff trung bình) vì minterpolate rớt các output cần
 * frame lookahead chưa tồn tại. Cách vá mới, thay cho việc chỉ trông
 * cậy vào fps lấp đuôi: chèn `tpad=stop_mode=clone:stop=4` TRƯỚC
 * minterpolate (cho nó frame lookahead thật — bản sao của frame nguồn
 * cuối, không bịa nội dung ngoài biên clip) rồi `trim=end_frame=
 * duration*targetFps,setpts=PTS-STARTPTS` SAU tmix (cắt đúng slot,
 * bỏ phần pad thừa). fps sau minterpolate được GIỮ LẠI làm lưới an
 * toàn (trường hợp trim không khớp do làm tròn). Kết quả đo ở
 * testsrc2 15fps + speed 0.5 → 30fps: đúng 120 frame, 0 frame đuôi có
 * diff < 0.05 (trước vá: 6 frame), frame cuối cách frame nguồn cuối
 * thật chỉ 1.3 (trước vá: 5.1), giữa chuỗi không đổi (mid mean 1.344
 * cả hai bản). Hai mảnh vá đi CÙNG NHAU (pre + tail) và chỉ bật khi
 * caller truyền duration hợp lệ; thiếu duration thì giữ hành vi đợt 8
 * (fps lấp đuôi) để không vỡ caller cũ. Phần còn lại trung thực: các
 * output nằm sau timestamp frame nguồn cuối (tối đa ~1 khoảng frame
 * input) vốn không có thông tin chuyển động tương lai nên vẫn hội tụ
 * về frame cuối — ở speed 0.25 còn ~4 frame diff < 0.05 ở đúng vùng
 * này, nhưng đó là frame cuối thật (cách frame nguồn cuối 1.1), không
 * còn là frame áp chót đóng băng sớm 0.4s như trước vá.
 *
 * TƯƠNG TÁC (fail-fast ở validateMotion, không lặng lẽ bỏ qua):
 * - motion + speedKeyframes (ramp): KHÔNG chặn ở đây — nhánh ramp do luồng
 *   S3 phụ trách (buildMotionPostChain trong speedramp.js); validator này
 *   chỉ kiểm tra giá trị field, không cấm kết hợp ramp+motion.
 * - interpolation targetFps != project fps + transition (xfade): LỖI —
 *   xfade bắt buộc 2 input cùng fps/format/kích thước.
 * - targetFps != project fps mà KHÔNG transition: cho phép, nhưng output
 *   cuối vẫn bị `-r <projectFps>` chuẩn hóa (xem MOTION_LIMITS.md):
 *   lợi ích mượt chỉ còn một phần sau khi downsample.
 * - motion + enhance.stabilize: CHO PHÉP — vidstabtransform chạy ở
 *   enhPre (trước speed), minterpolate/tmix chạy sau scale/pad, hai tầng
 *   không chia sẻ state; chất lượng kết hợp chưa được đo (xem LIMITS).
 */
"use strict";

const MOTION_TARGET_FPS_MIN = 1;
const MOTION_TARGET_FPS_MAX = 120;
const MOTION_BLUR_FRAMES_MIN = 2;
const MOTION_BLUR_FRAMES_MAX = 8;
// Phase 9 đợt 9 M1: số frame clone pad trước minterpolate. Thí nghiệm đo
// stop=1, 2, 4, 8 cho kết quả đuôi Y HỆT nhau ở speed 0.5 (bidir chỉ cần
// ≤2 frame lookahead); chọn 4 làm biên an toàn, chi phí không đáng kể
// (4 frame input thừa bị trim bỏ sau đó).
const MOTION_TAIL_PAD_FRAMES = 4;

function isNum(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function num(x) {
  if (!isNum(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

/** Chuẩn hóa motion về dạng đầy đủ; trả null khi không có motion hiệu lực. */
function normalizeMotion(motion) {
  if (motion === undefined || motion === null) return null;
  if (typeof motion !== "object" || Array.isArray(motion)) {
    throw new Error(`motion phải là object, nhận được: ${JSON.stringify(motion)}`);
  }
  const interpolation = motion.interpolation === undefined ? "none" : motion.interpolation;
  const hasInterp = interpolation === "minterpolate";
  const hasBlur = motion.motionBlur !== undefined && motion.motionBlur !== null;
  if (!hasInterp && !hasBlur) return null;
  return { interpolation, hasInterp, hasBlur, raw: motion };
}

/**
 * Dựng filter thay thế cho bước fps trong chain clip thường.
 * @param {object} motion clip.motion (shape tạm, xem header)
 * @param {number} projectFps meta.fps của project
 * @returns {string} `minterpolate=...,fps=<targetFps>` nếu bật interpolation,
 *   ngược lại `fps=<projectFps>` (giữ nguyên hành vi cũ).
 */
function buildMotionFpsFilter(motion, projectFps) {
  const n = normalizeMotion(motion);
  if (!n || !n.hasInterp) {
    if (!isNum(projectFps) || projectFps <= 0)
      throw new Error(`projectFps phải là số dương, nhận được: ${projectFps}`);
    return `fps=${num(projectFps)}`;
  }
  const targetFps = n.raw.targetFps === undefined ? projectFps : n.raw.targetFps;
  const miMode = n.raw.miMode === undefined ? "mci" : n.raw.miMode;
  // fps=<targetFps> sau minterpolate: lấp đuôi CFR (xem header) — đo thật
  // 113 → 120 frame. Áp cho cả blend (blend cũng rớt đuôi như mci).
  if (miMode === "blend") {
    // mi_mode=blend: nội suy bằng hòa trộn frame, không dùng motion
    // estimation nên không cần mc_mode/me_mode/vsbmc.
    return `minterpolate=fps=${num(targetFps)}:mi_mode=blend,fps=${num(targetFps)}`;
  }
  return `minterpolate=fps=${num(targetFps)}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,fps=${num(targetFps)}`;
}

/**
 * Dựng chuỗi motion blur (tmix) để chèn ngay sau bước fps/minterpolate.
 * Áp normalizeLegacyMotion trước để filter khớp với dạng đã validate ở
 * validate.js (project cũ weights 0 → tmix weights đều, không phải
 * tmix weights 0 0 0 vô nghĩa).
 * @returns {string} "" nếu không bật blur, ngược lại `,tmix=frames=n:weights=...`
 */
function buildMotionBlurChain(motion) {
  const n = normalizeLegacyMotion(motion);
  const effective = n.motion;
  const norm = normalizeMotion(effective);
  if (!norm || !norm.hasBlur) return "";
  const blur = norm.raw.motionBlur;
  const frames = blur.frames;
  const weights = blur.weights === undefined
    ? Array(frames).fill(1)
    : blur.weights;
  return `,tmix=frames=${frames}:weights=${weights.map((w) => num(w)).join(" ")}`;
}

/**
 * normalizeLegacyMotion — Phase 9 đợt 11 P6: mirror JS của
 * migrateMotion trong packages/video-spec/src/motion.ts (hai hàm giữ
 * cùng rule set; sửa một bên thì sửa cả hai).
 *
 * Cứu project cũ mang motionBlur weights 0 / thiếu frames mà hiện FAIL
 * validate render S2 — xem docstring migrateMotion để đọc đủ nguyên tắc.
 * Tóm tắt: CHỈ biến đổi input mà hiện FAIL ít nhất một tầng (spec hoặc
 * render); project mới hợp lệ trả về nguyên vẹn (cùng tham chiếu,
 * migrated=false). Chỉ cứu 4 trường hợp: weights chứa số <= 0 → đều;
 * frames vắng mà weights có mặt → frames = weights.length; frames lệch
 * weights.length → frames = weights.length; blur rỗng {} → frames = 3.
 * Ngoài ra (frames ngoài [2, 8], weights không hữu hạn/dài ngoài [2, 8],
 * key lạ, motion không phải object) trả nguyên để validate vẫn bắt.
 * KHÔNG mutate input.
 * @returns {{ motion: unknown, migrated: boolean, notes: string[] }}
 */
function normalizeLegacyMotion(motion) {
  const noChange = { motion, migrated: false, notes: [] };
  if (motion === undefined || motion === null) return noChange;
  if (typeof motion !== "object" || Array.isArray(motion)) return noChange;
  const blur = motion.motionBlur;
  if (blur === undefined || blur === null) return noChange;
  if (typeof blur !== "object" || Array.isArray(blur)) return noChange;
  for (const k of Object.keys(blur)) {
    if (k !== "frames" && k !== "weights") return noChange;
  }
  const frames = blur.frames;
  const weights = blur.weights;
  const notes = [];
  let newFrames = frames;
  let newWeights = weights;
  if (weights === undefined) {
    if (frames === undefined) {
      newFrames = 3; // MOTION_BLUR_DEFAULT_FRAMES (mirror motion.ts)
      notes.push(
        "motion.motionBlur rỗng (thiếu cả frames lẫn weights) → frames = 3 (mặc định resolveMotionBlur)"
      );
    } else {
      return noChange;
    }
  } else {
    if (!Array.isArray(weights)) return noChange;
    if (
      weights.length < MOTION_BLUR_FRAMES_MIN ||
      weights.length > MOTION_BLUR_FRAMES_MAX ||
      !weights.every((w) => isNum(w))
    ) {
      return noChange;
    }
    if (
      frames !== undefined &&
      (!Number.isInteger(frames) ||
        frames < MOTION_BLUR_FRAMES_MIN ||
        frames > MOTION_BLUR_FRAMES_MAX)
    ) {
      return noChange;
    }
    if (frames === undefined || frames !== weights.length) {
      notes.push(
        `motion.motionBlur.frames (${JSON.stringify(frames)}) lệch/thiếu so với weights.length (${weights.length}) → frames = ${weights.length} (giữ nguyên weights)`
      );
      newFrames = weights.length;
    }
    if (weights.some((w) => w <= 0)) {
      notes.push(
        `motion.motionBlur.weights chứa số <= 0 (${JSON.stringify(weights)}) → weights đều (${newFrames} frame, render S2 yêu cầu số dương)`
      );
      newWeights = Array.from({ length: newFrames }, () => 1);
    }
  }
  if (notes.length === 0) return noChange;
  const out = { ...motion };
  out.motionBlur = { ...blur, frames: newFrames, weights: newWeights };
  return { motion: out, migrated: true, notes };
}

/**
 * Phase 9 đợt 9 M1 — cặp vá đuôi (pre + tail, đi cùng nhau hoặc cùng vắng).
 * @returns {{ preFilter: string, tailFilter: string }}
 *   preFilter: `tpad=stop_mode=clone:stop=4` khi bật interpolation và có
 *     duration hợp lệ, ngược lại "".
 *   tailFilter: `,trim=end_frame=<duration*targetFps>,setpts=PTS-STARTPTS`
 *     (cắt đúng slot sau tmix) khi cùng điều kiện, ngược lại "".
 *   Thiếu duration hợp lệ → cả hai "" (giữ hành vi đợt 8: chỉ fps lấp
 *   đuôi) để caller cũ không vỡ; caller mới (render.js, speedramp.js)
 *   luôn truyền duration nên luôn nhận đủ cặp.
 */
function buildMotionTailFix(motion, projectFps, duration) {
  const n = normalizeMotion(motion);
  if (!n || !n.hasInterp) return { preFilter: "", tailFilter: "" };
  if (!isNum(duration) || duration <= 0) return { preFilter: "", tailFilter: "" };
  const targetFps = n.raw.targetFps === undefined ? projectFps : n.raw.targetFps;
  if (!isNum(targetFps) || targetFps <= 0) return { preFilter: "", tailFilter: "" };
  const frames = Math.round(duration * targetFps);
  if (frames <= 0) return { preFilter: "", tailFilter: "" };
  return {
    preFilter: `tpad=stop_mode=clone:stop=${MOTION_TAIL_PAD_FRAMES}`,
    tailFilter: `,trim=end_frame=${frames},setpts=PTS-STARTPTS`,
  };
}

/**
 * API gộp theo yêu cầu đợt S2: một lần gọi trả cả các mảnh chain.
 * @param {number} [duration] độ dài slot clip (giây) — có thì bật cặp
 *   vá đuôi M1 (preFilter + tailFilter), vắng thì giữ hành vi đợt 8.
 * @returns {{ preFilter: string, fpsFilter: string, blurChain: string, tailFilter: string }}
 *   preFilter: tpad clone-pad trước minterpolate ("" khi không vá);
 *   fpsFilter: minterpolate... hoặc fps=<projectFps>;
 *   blurChain: ",tmix=..." hoặc "";
 *   tailFilter: ",trim=.../setpts=..." sau tmix ("" khi không vá).
 *   (Không có motion hiệu lực → fpsFilter = fps=<projectFps>, còn lại "".)
 *   Thứ tự chèn ở caller: preFilter, fpsFilter, blurChain, tailFilter.
 */
function buildMotionChain(motion, projectFps, duration) {
  const tailFix = buildMotionTailFix(motion, projectFps, duration);
  return {
    preFilter: tailFix.preFilter,
    fpsFilter: buildMotionFpsFilter(motion, projectFps),
    blurChain: buildMotionBlurChain(motion),
    tailFilter: tailFix.tailFilter,
  };
}

/**
 * Validate motion — trả về danh sách lỗi (rỗng = hợp lệ), khớp quy ước
 * gom lỗi của validate.js (không throw trừ lỗi hệ thống).
 * @param {unknown} motion clip.motion
 * @param {{ projectFps?: number, hasTransition?: boolean }} ctx
 */
function validateMotion(motion, ctx = {}) {
  const errs = [];
  if (motion === undefined || motion === null) return errs;
  if (typeof motion !== "object" || Array.isArray(motion)) {
    errs.push(`motion phải là object, nhận được: ${JSON.stringify(motion)}`);
    return errs;
  }
  const { projectFps, hasTransition = false } = ctx;
  const interp = motion.interpolation;
  if (interp !== undefined && interp !== "none" && interp !== "minterpolate") {
    errs.push(`motion.interpolation phải là "none" | "minterpolate", nhận được: ${JSON.stringify(interp)}`);
  }
  // Parent đợt 8 khớp với spec S1: interpolation "none" (kể cả vắng) thì
  // không được kèm targetFps/miMode — hai field này chỉ có nghĩa khi
  // interpolation = "minterpolate" (UI S5 đã strip khi tắt nội suy).
  if ((interp === undefined || interp === "none") &&
      (motion.targetFps !== undefined || motion.miMode !== undefined)) {
    errs.push(`motion.interpolation là "none" (hoặc vắng) nhưng kèm targetFps/miMode — ` +
      `hai field này chỉ có nghĩa khi interpolation = "minterpolate" (xem motion.ts của S1)`);
  }
  if (motion.targetFps !== undefined) {
    if (!isNum(motion.targetFps) ||
        motion.targetFps < MOTION_TARGET_FPS_MIN || motion.targetFps > MOTION_TARGET_FPS_MAX) {
      errs.push(`motion.targetFps phải trong khoảng ${MOTION_TARGET_FPS_MIN}..${MOTION_TARGET_FPS_MAX}, ` +
        `nhận được: ${motion.targetFps}`);
    }
  }
  if (motion.miMode !== undefined && motion.miMode !== "mci" && motion.miMode !== "blend") {
    errs.push(`motion.miMode phải là "mci" | "blend", nhận được: ${JSON.stringify(motion.miMode)}`);
  }
  if (motion.targetFps === undefined && interp === "minterpolate" && !isNum(projectFps)) {
    errs.push("motion.interpolation cần targetFps hoặc project fps hợp lệ để làm fps đích");
  }
  // xfade bắt buộc cùng fps: interpolation đổi fps unit mà clip lại dính
  // transition thì graph sẽ vỡ/mất đồng bộ — chặn sớm.
  if (interp === "minterpolate" && hasTransition && isNum(motion.targetFps) &&
      isNum(projectFps) && motion.targetFps !== projectFps) {
    errs.push(`motion.targetFps (${motion.targetFps}) khác project fps (${projectFps}) ` +
      `nhưng clip dính transition — xfade yêu cầu 2 input cùng fps ` +
      `(xem MOTION_LIMITS.md)`);
  }
  const blur = motion.motionBlur;
  if (blur !== undefined && blur !== null) {
    if (typeof blur !== "object" || Array.isArray(blur)) {
      errs.push(`motion.motionBlur phải là object { frames, weights? }, nhận được: ${JSON.stringify(blur)}`);
    } else {
      if (!Number.isInteger(blur.frames) ||
          blur.frames < MOTION_BLUR_FRAMES_MIN || blur.frames > MOTION_BLUR_FRAMES_MAX) {
        errs.push(`motion.motionBlur.frames phải là số nguyên ${MOTION_BLUR_FRAMES_MIN}..${MOTION_BLUR_FRAMES_MAX}, ` +
          `nhận được: ${blur.frames}`);
      }
      if (blur.weights !== undefined) {
        if (!Array.isArray(blur.weights)) {
          errs.push(`motion.motionBlur.weights phải là mảng số, nhận được: ${JSON.stringify(blur.weights)}`);
        } else {
          if (Number.isInteger(blur.frames) && blur.weights.length !== blur.frames) {
            errs.push(`motion.motionBlur.weights dài ${blur.weights.length} nhưng frames=${blur.frames} ` +
              `— hai độ dài phải khớp nhau`);
          }
          for (const w of blur.weights) {
            if (!isNum(w) || w <= 0) {
              errs.push(`motion.motionBlur.weights chỉ chứa số dương hữu hạn, nhận được: ${JSON.stringify(w)}`);
              break;
            }
          }
        }
      }
    }
  }
  return errs;
}

module.exports = {
  MOTION_TARGET_FPS_MIN,
  MOTION_TARGET_FPS_MAX,
  MOTION_BLUR_FRAMES_MIN,
  MOTION_BLUR_FRAMES_MAX,
  MOTION_TAIL_PAD_FRAMES,
  buildMotionChain,
  buildMotionTailFix,
  buildMotionFpsFilter,
  buildMotionBlurChain,
  normalizeLegacyMotion,
  validateMotion,
};

// Self-test nhanh: node src/motion.js
if (require.main === module) {
  const assert = require("assert");
  assert.deepStrictEqual(buildMotionChain(undefined, 30),
    { preFilter: "", fpsFilter: "fps=30", blurChain: "", tailFilter: "" });
  assert.deepStrictEqual(buildMotionChain({}, 30),
    { preFilter: "", fpsFilter: "fps=30", blurChain: "", tailFilter: "" });
  assert.deepStrictEqual(buildMotionChain({ interpolation: "none" }, 30),
    { preFilter: "", fpsFilter: "fps=30", blurChain: "", tailFilter: "" });
  assert.deepStrictEqual(
    buildMotionChain({ interpolation: "minterpolate", targetFps: 60 }, 30),
    { preFilter: "", fpsFilter: "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,fps=60", blurChain: "", tailFilter: "" });
  assert.deepStrictEqual(
    buildMotionChain({ interpolation: "minterpolate", miMode: "blend" }, 30),
    { preFilter: "", fpsFilter: "minterpolate=fps=30:mi_mode=blend,fps=30", blurChain: "", tailFilter: "" });
  assert.deepStrictEqual(
    buildMotionChain({ motionBlur: { frames: 3 } }, 30),
    { preFilter: "", fpsFilter: "fps=30", blurChain: ",tmix=frames=3:weights=1 1 1", tailFilter: "" });
  assert.deepStrictEqual(
    buildMotionChain({ interpolation: "minterpolate", targetFps: 60, motionBlur: { frames: 2, weights: [3, 1] } }, 30),
    { preFilter: "", fpsFilter: "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,fps=60", blurChain: ",tmix=frames=2:weights=3 1", tailFilter: "" });
  // M1: có duration hợp lệ → đủ cặp pre + tail; thiếu duration → giữ hành vi đợt 8.
  assert.deepStrictEqual(
    buildMotionChain({ interpolation: "minterpolate", targetFps: 30 }, 30, 4),
    { preFilter: "tpad=stop_mode=clone:stop=4", fpsFilter: "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,fps=30", blurChain: "", tailFilter: ",trim=end_frame=120,setpts=PTS-STARTPTS" });
  assert.deepStrictEqual(buildMotionTailFix({ interpolation: "minterpolate" }, 30, 2),
    { preFilter: "tpad=stop_mode=clone:stop=4", tailFilter: ",trim=end_frame=60,setpts=PTS-STARTPTS" });
  assert.deepStrictEqual(buildMotionTailFix({ interpolation: "minterpolate" }, 30, undefined),
    { preFilter: "", tailFilter: "" });
  assert.deepStrictEqual(buildMotionTailFix({ motionBlur: { frames: 3 } }, 30, 2),
    { preFilter: "", tailFilter: "" });
  assert.deepStrictEqual(validateMotion(undefined), []);
  assert.deepStrictEqual(validateMotion({}), []);
  assert.ok(validateMotion({ interpolation: "none", targetFps: 30 }).length > 0);
  assert.ok(validateMotion({ targetFps: 0 }).length > 0);
  assert.ok(validateMotion({ targetFps: 121 }).length > 0);
  assert.ok(validateMotion({ interpolation: "rife" }).length > 0);
  assert.ok(validateMotion({ motionBlur: { frames: 1 } }).length > 0);
  assert.ok(validateMotion({ motionBlur: { frames: 9 } }).length > 0);
  assert.ok(validateMotion({ motionBlur: { frames: 3, weights: [1, 1] } }).length > 0);
  assert.ok(validateMotion({ motionBlur: { frames: 2, weights: [1, -1] } }).length > 0);
  assert.ok(validateMotion({ interpolation: "minterpolate", targetFps: 60 },
    { projectFps: 30, hasTransition: true }).length > 0);
  assert.deepStrictEqual(validateMotion({ interpolation: "minterpolate", targetFps: 30 },
    { projectFps: 30, hasTransition: true }), []);
  assert.deepStrictEqual(validateMotion({ interpolation: "minterpolate", targetFps: 30 },
    { projectFps: 30 }), []);
  // P6: normalizeLegacyMotion — project mới hợp lệ giữ nguyên tham chiếu;
  // project cũ weights 0 / thiếu frames được cứu về dạng validate được.
  const fresh = { motionBlur: { frames: 3, weights: [1, 2, 3] } };
  assert.strictEqual(normalizeLegacyMotion(fresh).motion, fresh);
  assert.strictEqual(normalizeLegacyMotion(fresh).migrated, false);
  assert.strictEqual(normalizeLegacyMotion(undefined).migrated, false);
  assert.strictEqual(normalizeLegacyMotion(null).migrated, false);
  const allZero = { motionBlur: { frames: 3, weights: [0, 0, 0] } };
  const mz = normalizeLegacyMotion(allZero);
  assert.strictEqual(mz.migrated, true);
  assert.deepStrictEqual(mz.motion, { motionBlur: { frames: 3, weights: [1, 1, 1] } });
  assert.deepStrictEqual(allZero, { motionBlur: { frames: 3, weights: [0, 0, 0] } }); // không mutate
  assert.deepStrictEqual(validateMotion(mz.motion), []);
  assert.ok(validateMotion(allZero).length > 0); // raw vẫn fail strict
  const noFrames = { motionBlur: { weights: [1, 2, 3, 4] } };
  const mn = normalizeLegacyMotion(noFrames);
  assert.strictEqual(mn.migrated, true);
  assert.deepStrictEqual(mn.motion, { motionBlur: { frames: 4, weights: [1, 2, 3, 4] } });
  assert.deepStrictEqual(validateMotion(mn.motion), []);
  const emptyBlur = { motionBlur: {} };
  const me = normalizeLegacyMotion(emptyBlur);
  assert.strictEqual(me.migrated, true);
  assert.deepStrictEqual(me.motion, { motionBlur: { frames: 3, weights: undefined } });
  assert.deepStrictEqual(validateMotion(me.motion), []);
  const mixedZero = { motionBlur: { frames: 3, weights: [1, 0, 1] } };
  const mm = normalizeLegacyMotion(mixedZero);
  assert.strictEqual(mm.migrated, true);
  assert.deepStrictEqual(mm.motion.motionBlur.weights, [1, 1, 1]);
  // Không cứu: frames ngoài [2, 8], weights không hữu hạn, key lạ.
  assert.strictEqual(normalizeLegacyMotion({ motionBlur: { frames: 9, weights: [1, 1, 1] } }).migrated, false);
  assert.strictEqual(normalizeLegacyMotion({ motionBlur: { frames: 3, weights: [1, NaN, 1] } }).migrated, false);
  assert.strictEqual(normalizeLegacyMotion({ motionBlur: { frames: 3, strength: 1 } }).migrated, false);
  assert.strictEqual(normalizeLegacyMotion({ motionBlur: { frames: 3, weights: [0, 0, 0] }, interpolation: "minterpolate", targetFps: 30 }).motion.interpolation, "minterpolate");
  // buildMotionBlurChain dùng dạng đã migrate (speedramp hưởng ké qua import).
  assert.strictEqual(buildMotionBlurChain({ motionBlur: { frames: 3, weights: [0, 0, 0] } }), ",tmix=frames=3:weights=1 1 1");
  assert.strictEqual(buildMotionBlurChain({ motionBlur: { weights: [1, 2, 3] } }), ",tmix=frames=3:weights=1 2 3");
  console.log("motion.js self-test: OK");
}
