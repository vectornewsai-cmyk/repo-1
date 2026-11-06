/**
 * keyframeSanitize.js — Sanitize keyframe array ở cổng render (đợt 50 F1).
 *
 * Mirror bằng JavaScript thuần của `sanitizeKeyframeArrays` trong
 * `apps/web/src/lib/projectRepo.ts` (đợt 49 E4) — NGỮ NGHĨA PHẢI GIỐNG
 * HỆT BÊN TYPESCRIPT. Nếu đổi quy tắc ở một bên, PHẢI đổi cả bên kia.
 *
 * Vấn đề (nợ E4 §7.4): project có audio clip mang
 * `volumeKeyframes.keyframes: [null]` qua được cổng load web là nhờ
 * sanitize E4, nhưng đường render CLI đọc file thô thì `validateSpec`
 * từ chối cả job — cùng một project, web mở được mà render thì không
 * (lệch parity web/render). Ngoài ra `buildVolumeInterpExpr` ném
 * TypeError khó hiểu với `[null]`.
 *
 * Quy tắc (khớp E4, xem projectRepo.ts):
 * - Entry bị loại: null / không phải object / t hoặc v không phải số
 *   hữu hạn. KHÔNG loại theo t ngoài [0, duration] (nội suy clamp
 *   được, không đổi ngữ nghĩa thời gian) và KHÔNG đụng thứ tự/số lượng
 *   entry hợp lệ.
 * - Easing lạ → chuẩn hóa về "linear". speedKeyframes giữ thêm
 *   "bezier" (speed curve hỗ trợ). Bezier array sai KHÔNG được sửa ở
 *   đây — validateSpeedKeyframes sau đó vẫn bắt (không che lỗi giá trị).
 * - KeyframedValue không phải object, keyframes không phải mảng, hoặc
 *   mảng rỗng sau lọc → XÓA LUÔN FIELD để caller rơi về giá trị tĩnh.
 * - Giá trị ngoài khoảng (vd volume v=5) KHÔNG bị loại ở đây — vẫn là
 *   số hữu hạn nên giữ lại, validate sau đó chặn (xem test C5).
 * - Đệ quy cả nested subSpec (chống vòng lặp theo nhánh như web).
 * - Project lành không đổi gì.
 *
 * Mutate spec tại chỗ — chỉ dùng cho object vừa JSON.parse ở cổng
 * render (render.js main(): sau khi đọc file, TRƯỚC flatten + validate,
 * vì flatten validateNestedRamp sẽ fail khi gặp null trong speedKeyframes
 * của clip lá).
 *
 * Chạy self-test qua test_round50_f1_keyframe_null.js (không có --self-test
 * riêng trong file này).
 */
"use strict";

const ANIMATION_PROPS = ["x", "y", "opacity", "scale", "rotation"];
const KEYFRAME_EASINGS = ["linear", "ease-in", "ease-out"];

function isRecord(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNum(x) {
  return typeof x === "number" && Number.isFinite(x);
}

/**
 * Sanitize MỘT KeyframedValue ({ keyframes: [...] }) tại chỗ.
 * Trả về true nếu field còn dùng được (giữ lại), false nếu phải xóa field.
 * Ghi chú sửa vào `fixes` khi có thay đổi (kèm đường dẫn đầy đủ).
 */
function sanitizeOneKeyframedValue(kv, where, allowBezier, fixes) {
  if (!isRecord(kv)) {
    fixes.push(`${where}: keyframes không phải object { keyframes: [...] } — đã xóa field.`);
    return false;
  }
  const arr = kv.keyframes;
  if (!Array.isArray(arr)) {
    fixes.push(`${where}.keyframes không phải mảng — đã xóa field.`);
    return false;
  }
  const validEasings = allowBezier
    ? [...KEYFRAME_EASINGS, "bezier"]
    : KEYFRAME_EASINGS;
  let dropped = 0;
  let coercedEasing = 0;
  const kept = [];
  for (const kf of arr) {
    if (!isRecord(kf) || !isFiniteNum(kf.t) || !isFiniteNum(kf.v)) {
      dropped++;
      continue;
    }
    const easing = kf.easing;
    if (typeof easing !== "string" || !validEasings.includes(easing)) {
      kept.push({ ...kf, easing: "linear" });
      coercedEasing++;
    } else {
      kept.push(kf);
    }
  }
  if (kept.length === 0) {
    fixes.push(`${where}.keyframes rỗng sau khi loại ${dropped} entry lỗi — đã xóa field.`);
    return false;
  }
  if (dropped > 0 || coercedEasing > 0) {
    const parts = [];
    if (dropped > 0) parts.push(`đã loại ${dropped} entry lỗi (null/không hợp lệ)`);
    if (coercedEasing > 0) parts.push(`đã chuẩn hóa ${coercedEasing} easing lạ về linear`);
    fixes.push(`${where}.keyframes: ${parts.join(", ")} — giữ ${kept.length}/${arr.length} entry.`);
  }
  kv.keyframes = kept;
  return true;
}

/**
 * Sanitize MỌI keyframe array trong spec: volumeKeyframes, speedKeyframes
 * và animations.* của từng clip, kể cả trong subSpec của nested clip
 * (đệ quy, chống vòng lặp theo nhánh như validateSpecDeep).
 * Mutate spec tại chỗ — chỉ dùng cho object vừa JSON.parse ở cổng render.
 * Trả về đường dẫn các field đã sửa (dạng tracks[i].clips[j].<field>,
 * kèm tiền tố `.subSpec.` khi qua nested).
 */
function sanitizeKeyframeArrays(spec) {
  const fixed = [];
  const walk = (s, prefix, seen) => {
    if (!s || typeof s !== "object" || seen.has(s)) return;
    const chain = new Set(seen);
    chain.add(s);
    if (!Array.isArray(s.tracks)) return;
    s.tracks.forEach((t, ti) => {
      if (!t || typeof t !== "object" || !Array.isArray(t.clips)) return;
      t.clips.forEach((c, ci) => {
        if (!isRecord(c)) return;
        const path = `${prefix}tracks[${ti}].clips[${ci}]`;
        const clipId = typeof c.id === "string" ? c.id : "?";
        const where = (field) => `${path} (clip "${clipId}").${field}`;
        // volumeKeyframes: audio clip (check mọi kind cho an toàn — field
        // lạ trên kind khác cũng không được phép mang entry null).
        if (c.volumeKeyframes !== undefined) {
          if (!sanitizeOneKeyframedValue(c.volumeKeyframes, where("volumeKeyframes"), false, fixed)) {
            delete c.volumeKeyframes;
          }
        }
        // speedKeyframes: cho phép easing bezier (speed curve hỗ trợ).
        if (c.speedKeyframes !== undefined) {
          if (!sanitizeOneKeyframedValue(c.speedKeyframes, where("speedKeyframes"), true, fixed)) {
            delete c.speedKeyframes;
          }
        }
        // animations.*: từng prop một.
        if (isRecord(c.animations)) {
          for (const prop of ANIMATION_PROPS) {
            if (c.animations[prop] !== undefined) {
              if (!sanitizeOneKeyframedValue(c.animations[prop], where(`animations.${prop}`), false, fixed)) {
                delete c.animations[prop];
              }
            }
          }
        }
        if (c.kind === "nested" && isRecord(c.subSpec)) {
          walk(c.subSpec, `${path}.subSpec.`, chain);
        }
      });
    });
  };
  walk(spec, "", new Set());
  return fixed;
}

module.exports = {
  ANIMATION_PROPS,
  KEYFRAME_EASINGS,
  sanitizeOneKeyframedValue,
  sanitizeKeyframeArrays,
};
