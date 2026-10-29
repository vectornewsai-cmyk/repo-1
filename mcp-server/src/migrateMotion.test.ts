/**
 * migrateMotion.test.ts — Test thật cho migrate motion ở cổng MCP
 * (Phase 9 đợt 13 C4).
 *
 * Nợ đợt 12: MCP server không thấy call migrate/validate — thực ra còn tệ
 * hơn: validateVideoClip không đọc v["motion"] nên mọi spec qua MCP
 * (load/save/render/export) đều LẶNG LẼ LÀM MẤT motion, cổng render cũng
 * không còn motion để cứu. Đợt này validateVideoClip migrate rồi mới
 * validate, nên loadProject (đi qua validateVideoSpec) trả về spec đã
 * migrate, cùng rule set với cổng render đợt 11 P6 + cổng web đợt 12 T4.
 *
 * Chạy: npx tsc -p tsconfig.json && node dist/mcp-server/src/migrateMotion.test.js
 * (từ thư mục mcp-server; theo mẫu roundtrip.test.ts nhưng chạy qua dist —
 * route strip-types ghi trong header roundtrip không resolve được "./validate.js"
 * trên Node 24.22 ở đây, xem LIMITS).
 */
import { validateVideoSpec, ValidationError } from "./validate.js";
import { SPEC_VERSION } from "../../packages/video-spec/src/index.js";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.log(`  ❌ ${msg}`); }
}

function assertThrowsValidation(fn: () => unknown, msg: string): void {
  try {
    fn();
    failed++;
    console.log(`  ❌ ${msg} (không ném lỗi như kỳ vọng)`);
  } catch (e) {
    if (e instanceof ValidationError) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.log(`  ❌ ${msg} (ném lỗi sai loại: ${e})`); }
  }
}

function specWithMotion(motion: unknown): Record<string, unknown> {
  return {
    version: SPEC_VERSION,
    meta: { name: "migrate-mcp", width: 320, height: 180, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: [{
        kind: "video", id: "c1", src: "src.mp4", start: 0, duration: 2,
        in: 0, out: 2, motion,
      }],
    }],
  };
}

function blurOf(spec: ReturnType<typeof validateVideoSpec>): Record<string, unknown> {
  const clip = spec.tracks[0].clips[0] as unknown as Record<string, unknown>;
  return (clip.motion as Record<string, unknown>).motionBlur as Record<string, unknown>;
}

// --- 3 dạng project cũ (đợt 11 P6) qua MCP validate đều được migrate ---
console.log("\n[MCP migrate] project cũ → spec đã chuẩn hoá");
{
  const out = validateVideoSpec(specWithMotion({ motionBlur: { weights: [0, 0, 0] } }));
  const b = blurOf(out);
  assert(b.frames === 3 && JSON.stringify(b.weights) === "[1,1,1]",
    `weights toàn 0 → frames=3, weights=[1,1,1] (nhận ${JSON.stringify(b)})`);
}
{
  const out = validateVideoSpec(specWithMotion({ motionBlur: { weights: [1, 2] } }));
  const b = blurOf(out);
  assert(b.frames === 2 && JSON.stringify(b.weights) === "[1,2]",
    `chỉ có weights [1,2] (thiếu frames) → frames=2, giữ weights (nhận ${JSON.stringify(b)})`);
}
{
  const out = validateVideoSpec(specWithMotion({ motionBlur: {} }));
  const b = blurOf(out);
  assert(b.frames === 3, `motionBlur rỗng {} → frames=3 (nhận ${JSON.stringify(b)})`);
}

// --- Project mới hợp lệ không đổi; không motion → không thêm motion ---
console.log("\n[MCP migrate] hồi quy project mới");
{
  const out = validateVideoSpec(specWithMotion({ motionBlur: { frames: 3, weights: [1, 2, 1] } }));
  const b = blurOf(out);
  assert(b.frames === 3 && JSON.stringify(b.weights) === "[1,2,1]",
    `motion mới hợp lệ giữ nguyên (nhận ${JSON.stringify(b)})`);
}
{
  const out = validateVideoSpec({
    version: SPEC_VERSION,
    meta: { name: "nomotion", width: 320, height: 180, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: [{ kind: "video", id: "c1", src: "src.mp4", start: 0, duration: 2, in: 0, out: 2 }],
    }],
  });
  const clip = out.tracks[0].clips[0] as unknown as Record<string, unknown>;
  assert(clip.motion === undefined, "clip không motion → validate không tự thêm motion");
}

// --- Ngoài phạm vi migrate: fail nhanh, rõ ràng (không lặng lẽ rơi mất) ---
console.log("\n[MCP migrate] lỗi ngoài phạm vi migrate → ValidationError");
assertThrowsValidation(
  () => validateVideoSpec(specWithMotion({ motionBlur: { weights: [0] } })),
  "weights dài 1 (ngoài [2,8]) → ValidationError, không lặng lẽ bỏ motion",
);
assertThrowsValidation(
  () => validateVideoSpec(specWithMotion({ motionBlur: { frames: 9, weights: [1, 1, 1, 1, 1, 1, 1, 1, 1] } })),
  "frames 9 (ngoài [2,8]) → ValidationError",
);
assertThrowsValidation(
  () => validateVideoSpec(specWithMotion({ interpolation: "none", targetFps: 30 })),
  "shape cũ interpolation none + targetFps → ValidationError (nhất quán cổng render)",
);

console.log(`\nKết quả: ${passed} pass, ${failed} fail`);
if (failed > 0) { console.log("❌ CÓ TEST FAIL"); process.exit(1); }
else { console.log("🎉 TẤT CẢ PASS"); }
