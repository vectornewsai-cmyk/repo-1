/**
 * maskKeyframes.test.ts — Test nội suy mask keyframes bản TS (Phase 9 D4).
 * Chạy: node --experimental-strip-types src/lib/maskKeyframes.test.ts
 * (import trực tiếp file mask.ts, không qua alias @repo-1/video-spec).
 * Fixture GIỐNG HỆT mask.js self-test §9 và test_mask_anim.py để 3 mirror
 * không lệch nhau: t=2 x=0.8, t=0 x=0.2, t=2 x=0.9 → sort+dedupe: 0→0.2, 2→0.9.
 */
import {
  interpolateMaskAt,
  maskGeometryAt,
  normalizeMask,
  sortMaskKeyframes,
  hasMaskKeyframes,
  validateMask,
  type ClipMask,
} from "../../../../packages/video-spec/src/mask.ts";

let pass = 0;
let fail = 0;
function ok(cond: boolean, msg: string): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${msg}`);
  } else {
    fail++;
    console.error(`  ✗ ${msg}`);
  }
}

const kfMask: ClipMask = {
  shape: "rect",
  x: 0.5,
  y: 0.5,
  w: 0.5,
  h: 0.5,
  feather: 0,
  keyframes: [
    { t: 2, x: 0.8, y: 0.5, w: 0.5, h: 0.5 },
    { t: 0, x: 0.2, y: 0.5, w: 0.5, h: 0.5 },
    { t: 2, x: 0.9, y: 0.5, w: 0.5, h: 0.5 },
  ],
};

ok(validateMask(kfMask).length === 0, "keyframes hợp lệ pass validate");
ok(validateMask({ ...kfMask, keyframes: [{ t: -1, x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] }).length > 0, "t âm lỗi");
ok(validateMask({ ...kfMask, keyframes: [{ t: 0, x: 0.5, y: 0.5, w: 0, h: 0.5 }] }).length > 0, "w=0 lỗi");
ok(hasMaskKeyframes(kfMask), "hasMaskKeyframes true khi có keyframe");
ok(!hasMaskKeyframes({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }), "hasMaskKeyframes false khi không có");

const norm = normalizeMask(kfMask);
ok(JSON.stringify(norm.keyframes!.map((k) => k.t)) === "[0,2]", "normalize sắp + dedupe → [0,2]");
ok(norm.keyframes![1].x === 0.9, "trùng t thì sau thắng (x=0.9)");

ok(interpolateMaskAt(kfMask, -1).x === 0.2, "hold trước → 0.2");
ok(interpolateMaskAt(kfMask, 1).x === 0.55, "giữa t=1 → 0.55");
ok(interpolateMaskAt(kfMask, 5).x === 0.9, "hold sau → 0.9");
ok(interpolateMaskAt({ shape: "rect", x: 0.3, y: 0.5, w: 0.5, h: 0.5, feather: 0 }, 1).x === 0.3, "không keyframe → tĩnh");
ok(sortMaskKeyframes(kfMask.keyframes!).length === 2, "sortMaskKeyframes dedupe còn 2");

const g0 = maskGeometryAt(kfMask, 0);
ok(g0.x === 0.2 && g0.shape === "rect", "geometryAt(0) giữ shape, x=0.2");
ok(g0.keyframes === undefined, "geometryAt bỏ keyframes");

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (fail > 0) process.exit(1);
