/**
 * maskTrack.test.ts — Test mask bám motion track, bản TS (Phase 9 đợt 87 O1).
 * Chạy: node --experimental-strip-types src/lib/maskTrack.test.ts
 * (chạy từ apps/web; import trực tiếp file mask.ts/tracking.ts, không qua
 * alias @repo-1/video-spec — cùng mẫu với maskKeyframes.test.ts).
 *
 * Fixture GIỐNG HỆT self-test §11 của server/render/src/mask.js và probe
 * nhóm mask-track của packages/video-spec/scripts/check-video-spec-mirror.mjs
 * để 3 implementation (TS canonical, JS mirror ESM, CJS render) cho cùng
 * kết quả số: track tuyến tính 2 điểm (0, 0.2, 0.3) → (2, 0.8, 0.7); mask
 * có keyframes w/h đổi theo t nhưng x/y keyframe (0.1,0.9)→(0.3,0.7) KHÁC
 * hẳn tâm track để phân biệt quy tắc: track thắng x/y, keyframes thắng w/h.
 */
import {
  maskGeometryAt,
  maskGeometryAtTrack,
  type ClipMask,
} from "../../../../packages/video-spec/src/mask.ts";
import {
  interpolateTrack,
  type TrackAttachment,
} from "../../../../packages/video-spec/src/tracking.ts";
import { maskGeometryAtTrack as maskGeometryAtTrackJs } from "../../../../packages/video-spec/src/mask.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const renderMask = require("../../../../server/render/src/mask.js") as {
  maskGeometryAtTrack: (m: ClipMask, track: TrackAttachment | undefined | null, t: number) => ClipMask;
};

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
const approx = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

const trTrack: TrackAttachment = {
  points: [
    { t: 0, x: 0.2, y: 0.3 },
    { t: 2, x: 0.8, y: 0.7 },
  ],
};
const trMask: ClipMask = {
  shape: "rect",
  x: 0.5,
  y: 0.5,
  w: 1,
  h: 1,
  feather: 0.1,
  keyframes: [
    { t: 0, x: 0.1, y: 0.9, w: 0.4, h: 0.4 },
    { t: 2, x: 0.3, y: 0.7, w: 0.6, h: 0.8 },
  ],
};

// 1. t=1 (giữa đoạn): track (0.5,0.5) thắng x/y keyframe (0.2,0.8);
//    w/h keyframe (0.5,0.6); shape/feather giữ nguyên; keyframes bị bỏ.
const g1 = maskGeometryAtTrack(trMask, trTrack, 1);
ok(approx(g1.x, 0.5) && approx(g1.y, 0.5), `t=1 track thắng x/y → (0.5,0.5), nhận (${g1.x},${g1.y})`);
ok(approx(g1.w, 0.5) && approx(g1.h, 0.6), `t=1 keyframes thắng w/h → (0.5,0.6), nhận (${g1.w},${g1.h})`);
ok(g1.shape === "rect" && g1.feather === 0.1, "giữ shape + feather");
ok(g1.keyframes === undefined, "geometryAtTrack bỏ keyframes");

// 2. Tại điểm mẫu t=0 và t=2: tâm đúng điểm track, w/h đúng keyframe.
const gT0 = maskGeometryAtTrack(trMask, trTrack, 0);
ok(approx(gT0.x, 0.2) && approx(gT0.y, 0.3) && approx(gT0.w, 0.4) && approx(gT0.h, 0.4), `t=0 → (0.2,0.3,0.4,0.4), nhận (${gT0.x},${gT0.y},${gT0.w},${gT0.h})`);
const gT2 = maskGeometryAtTrack(trMask, trTrack, 2);
ok(approx(gT2.x, 0.8) && approx(gT2.y, 0.7) && approx(gT2.w, 0.6) && approx(gT2.h, 0.8), `t=2 → (0.8,0.7,0.6,0.8), nhận (${gT2.x},${gT2.y},${gT2.w},${gT2.h})`);

// 3. t ngoài khoảng track → kẹp điểm đầu/cuối, hold keyframe w/h.
const gBefore = maskGeometryAtTrack(trMask, trTrack, -1);
ok(approx(gBefore.x, 0.2) && approx(gBefore.y, 0.3) && approx(gBefore.w, 0.4) && approx(gBefore.h, 0.4), `kẹp trước → (0.2,0.3,0.4,0.4), nhận (${gBefore.x},${gBefore.y},${gBefore.w},${gBefore.h})`);
const gAfter = maskGeometryAtTrack(trMask, trTrack, 5);
ok(approx(gAfter.x, 0.8) && approx(gAfter.y, 0.7) && approx(gAfter.w, 0.6) && approx(gAfter.h, 0.8), `kẹp sau → (0.8,0.7,0.6,0.8), nhận (${gAfter.x},${gAfter.y},${gAfter.w},${gAfter.h})`);

// 4. Không track / track rỗng / null → đồng nhất maskGeometryAt.
ok(JSON.stringify(maskGeometryAtTrack(trMask, undefined, 1)) === JSON.stringify(maskGeometryAt(trMask, 1)), "không track = maskGeometryAt");
ok(JSON.stringify(maskGeometryAtTrack(trMask, { points: [] }, 1)) === JSON.stringify(maskGeometryAt(trMask, 1)), "track rỗng = maskGeometryAt");
ok(JSON.stringify(maskGeometryAtTrack(trMask, null, 1)) === JSON.stringify(maskGeometryAt(trMask, 1)), "track null = maskGeometryAt");

// 5. Track 1 điểm → tâm hằng mọi t; w/h vẫn theo keyframes.
const gOne = maskGeometryAtTrack(trMask, { points: [{ t: 0, x: 0.25, y: 0.75 }] }, 1);
ok(approx(gOne.x, 0.25) && approx(gOne.y, 0.75) && approx(gOne.w, 0.5) && approx(gOne.h, 0.6), `track 1 điểm → (0.25,0.75,0.5,0.6), nhận (${gOne.x},${gOne.y},${gOne.w},${gOne.h})`);

// 6. Mask tĩnh ellipse (không keyframes) + track → tâm track, w/h tĩnh.
const gStatic = maskGeometryAtTrack(
  { shape: "ellipse", x: 0.5, y: 0.5, w: 0.8, h: 0.6, feather: 0.2 },
  trTrack,
  1,
);
ok(approx(gStatic.x, 0.5) && approx(gStatic.y, 0.5) && approx(gStatic.w, 0.8) && approx(gStatic.h, 0.6) && gStatic.shape === "ellipse", `mask tĩnh + track → (0.5,0.5,0.8,0.6) ellipse, nhận (${gStatic.x},${gStatic.y},${gStatic.w},${gStatic.h})`);

// 7. interpolateTrack trực tiếp: rỗng → (0.5,0.5); chưa sort → vẫn đúng.
const pEmpty = interpolateTrack([], 1);
ok(pEmpty.x === 0.5 && pEmpty.y === 0.5, "track rỗng → (0.5,0.5)");
const pUnsorted = interpolateTrack([trTrack.points[1], trTrack.points[0]], 1);
ok(approx(pUnsorted.x, 0.5) && approx(pUnsorted.y, 0.5), "chưa sort → (0.5,0.5)");

// 8. Test chéo 3 mirror trên cùng fixture: TS (.ts) vs JS mirror ESM
//    (video-spec mask.js) vs CJS render (server/render/src/mask.js) —
//    JSON phải giống hệt nhau (keyframes: undefined bị JSON bỏ qua ở cả 3).
for (const t of [-1, 0, 1, 2, 5]) {
  const a = JSON.stringify(maskGeometryAtTrack(trMask, trTrack, t));
  const b = JSON.stringify(maskGeometryAtTrackJs(trMask, trTrack, t));
  const c = JSON.stringify(renderMask.maskGeometryAtTrack(trMask, trTrack, t));
  ok(a === b && b === c, `chéo 3 mirror tại t=${t} khớp: ${a}`);
}
for (const t of [0, 1]) {
  const a = JSON.stringify(maskGeometryAtTrack(trMask, undefined, t));
  const b = JSON.stringify(maskGeometryAtTrackJs(trMask, undefined, t));
  const c = JSON.stringify(renderMask.maskGeometryAtTrack(trMask, undefined, t));
  ok(a === b && b === c, `chéo 3 mirror (không track) tại t=${t} khớp`);
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (fail > 0) process.exit(1);
