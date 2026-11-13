// safeArea73A9.test.ts — test safeArea (Phase 9 đợt 73 A9, hướng S4).
// Chạy: node --experimental-strip-types apps/web/src/lib/safeArea73A9.test.ts
import assert from "node:assert/strict";
import {
  SAFE_AREA_PLATFORMS,
  getSafeAreaPlatform,
  safeAreaPlatformForPreset,
  platformForAspect,
  zoneStyle,
  titleSafeStyle,
  letterboxRect,
  validateSafeAreaPlatform,
} from "./safeArea.ts";

let pass = 0;
let fail = 0;
function ok(name: string, fn: () => void) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

console.log("== safeArea (đợt 73 A9 + đợt 80 H10) ==");

ok("có đủ 6 nền tảng: tiktok, reels, shorts, youtube, instagram-square, instagram-portrait", () => {
  assert.deepEqual(
    SAFE_AREA_PLATFORMS.map((p) => p.id),
    ["tiktok", "reels", "shorts", "youtube", "instagram-square", "instagram-portrait"],
  );
});

ok("mọi platform validate sạch: zone trong [0,1], title-safe không giao zone", () => {
  for (const p of SAFE_AREA_PLATFORMS) {
    assert.deepEqual(validateSafeAreaPlatform(p), [], p.id);
  }
});

ok("tiktok có đủ 3 zone: topBar + rightRail + bottomCaption", () => {
  const p = getSafeAreaPlatform("tiktok")!;
  assert.deepEqual(p.zones.map((z) => z.id), ["topBar", "rightRail", "bottomCaption"]);
  // Ray phải ~13% rộng, thanh trên ~11%, caption dưới ~27% cao
  // (đợt 74 B5 hiệu chỉnh theo số đo tay 09/2026: trước đây 7,5%/24%).
  const rail = p.zones.find((z) => z.id === "rightRail")!;
  assert.equal(rail.width, 0.13);
  assert.equal(rail.left, 0.87);
  const top = p.zones.find((z) => z.id === "topBar")!;
  assert.equal(top.height, 0.11);
  const cap = p.zones.find((z) => z.id === "bottomCaption")!;
  assert.equal(cap.height, 0.27);
  assert.equal(cap.top, 0.73);
});

ok("reels 9:16 (đợt 80 H10): 3 zone, caption dưới 25% < tiktok 27%", () => {
  const p = getSafeAreaPlatform("reels")!;
  assert.deepEqual(p.zones.map((z) => z.id), ["topBar", "rightRail", "bottomCaption"]);
  const top = p.zones.find((z) => z.id === "topBar")!;
  assert.equal(top.height, 0.09);
  const cap = p.zones.find((z) => z.id === "bottomCaption")!;
  assert.equal(cap.height, 0.25);
  assert.equal(cap.top, 0.75);
  const rail = p.zones.find((z) => z.id === "rightRail")!;
  assert.equal(rail.width, 0.13);
  assert.deepEqual(p.titleSafe, { x: 0.05, y: 0.11, w: 0.79, h: 0.61 });
});

ok("shorts 9:16 (đợt 80 H10): 3 zone, caption dưới 20% — ngắn nhất nhóm 9:16", () => {
  const p = getSafeAreaPlatform("shorts")!;
  assert.deepEqual(p.zones.map((z) => z.id), ["topBar", "rightRail", "bottomCaption"]);
  const top = p.zones.find((z) => z.id === "topBar")!;
  assert.equal(top.height, 0.08);
  const cap = p.zones.find((z) => z.id === "bottomCaption")!;
  assert.equal(cap.height, 0.2);
  assert.equal(cap.top, 0.8);
  const rail = p.zones.find((z) => z.id === "rightRail")!;
  assert.equal(rail.width, 0.12);
  assert.equal(rail.left, 0.88);
  assert.deepEqual(p.titleSafe, { x: 0.05, y: 0.1, w: 0.8, h: 0.67 });
});

ok("3 nền tảng 9:16 khác nhau thật: caption dưới tiktok 27% ≠ reels 25% ≠ shorts 20%", () => {
  const h = (id: string) =>
    getSafeAreaPlatform(id)!.zones.find((z) => z.id === "bottomCaption")!.height;
  assert.equal(h("tiktok"), 0.27);
  assert.equal(h("reels"), 0.25);
  assert.equal(h("shorts"), 0.2);
});

ok("instagram-portrait: caption dưới ~18% (≈250px/1350, đợt 74 B5)", () => {
  const p = getSafeAreaPlatform("instagram-portrait")!;
  const cap = p.zones.find((z) => z.id === "bottomCaption")!;
  assert.equal(cap.height, 0.18);
  assert.equal(cap.top, 0.82);
  assert.deepEqual(p.titleSafe, { x: 0.05, y: 0.08, w: 0.9, h: 0.74 });
});

ok("youtube chỉ có endScreen + title-safe 5% (dưới chừa end-screen)", () => {
  const p = getSafeAreaPlatform("youtube")!;
  assert.equal(p.zones.length, 1);
  assert.equal(p.zones[0].id, "endScreen");
  assert.deepEqual(p.titleSafe, { x: 0.05, y: 0.05, w: 0.9, h: 0.71 });
});

ok("map preset xuất → nền tảng: tiktok/reels/shorts/ig-square/ig-portrait/16:9/custom", () => {
  assert.equal(safeAreaPlatformForPreset("tiktok")!.id, "tiktok");
  assert.equal(safeAreaPlatformForPreset("reels")!.id, "reels");
  assert.equal(safeAreaPlatformForPreset("shorts")!.id, "shorts");
  assert.equal(safeAreaPlatformForPreset("ig-square")!.id, "instagram-square");
  assert.equal(safeAreaPlatformForPreset("ig-portrait")!.id, "instagram-portrait");
  for (const id of ["720p", "1080p", "4k", "youtube"]) {
    assert.equal(safeAreaPlatformForPreset(id)!.id, "youtube", id);
  }
  assert.equal(safeAreaPlatformForPreset("custom"), null);
  assert.equal(safeAreaPlatformForPreset("không-có"), null);
});

ok("đoán nền tảng theo tỉ lệ khung: 9:16/1:1/4:5/16:9 khớp, tỉ lệ lạ → null", () => {
  // Đợt 80 H10: 3 nền tảng cùng 9:16 (tiktok/reels/shorts) — hòa tỉ lệ
  // thì trả nền tảng 9:16 đầu tiên (tiktok); preset xuất map chính xác
  // từng nền tảng, user đổi tay qua select trong overlay.
  assert.equal(platformForAspect(1080, 1920)!.id, "tiktok");
  assert.equal(platformForAspect(720, 1280)!.id, "tiktok");
  assert.equal(platformForAspect(1080, 1080)!.id, "instagram-square");
  assert.equal(platformForAspect(1080, 1350)!.id, "instagram-portrait");
  assert.equal(platformForAspect(1920, 1080)!.id, "youtube");
  assert.equal(platformForAspect(1000, 1000)!.id, "instagram-square");
  assert.equal(platformForAspect(800, 600), null); // 4:3 không có nền tảng
  assert.equal(platformForAspect(0, 1080), null);
  assert.equal(platformForAspect(NaN, 1080), null);
});

ok("letterboxRect: khung 9:16 trong chứa 16:9 → cột dọc căn giữa", () => {
  const r = letterboxRect(1600, 900, 1080, 1920);
  // scale = min(1600/1080, 900/1920) = 0.46875 → w=506.25, h=900.
  assert.equal(r.h, 900);
  assert.ok(Math.abs(r.w - 506.25) < 0.01);
  assert.ok(Math.abs(r.x - (1600 - 506.25) / 2) < 0.01);
  assert.equal(r.y, 0);
});

ok("letterboxRect: khung 16:9 trong chứa 9:16 → hàng ngang căn giữa", () => {
  const r = letterboxRect(500, 900, 1920, 1080);
  assert.ok(Math.abs(r.w - 500) < 0.01);
  assert.ok(Math.abs(r.h - 281.25) < 0.01);
  assert.ok(Math.abs(r.x) < 0.01);
  assert.ok(Math.abs(r.y - (900 - 281.25) / 2) < 0.01);
});

ok("letterboxRect: đầu vào không hợp lệ → rect 0", () => {
  assert.deepEqual(letterboxRect(0, 900, 1080, 1920), { x: 0, y: 0, w: 0, h: 0 });
  assert.deepEqual(letterboxRect(500, 900, 0, 1080), { x: 0, y: 0, w: 0, h: 0 });
});

ok("zoneStyle: caption dưới TikTok trên khung 1080×1920 → px đúng", () => {
  const p = getSafeAreaPlatform("tiktok")!;
  const cap = p.zones.find((z) => z.id === "bottomCaption")!;
  const s = zoneStyle(cap, { x: 100, y: 0, w: 540, h: 960 });
  assert.deepEqual(s, { left: 100, top: 700.8, width: 540, height: 259.2 });
});

ok("titleSafeStyle: khung title-safe TikTok nằm trong khung video", () => {
  const p = getSafeAreaPlatform("tiktok")!;
  const s = titleSafeStyle(p, { x: 0, y: 0, w: 540, h: 960 });
  assert.ok(s.left >= 0 && s.top >= 0);
  assert.ok(s.left + s.width <= 540 && s.top + s.height <= 960);
  assert.equal(s.width, 426.6); // 0.79 × 540
});

ok("validate bắt zone tràn khung và title-safe giao zone", () => {
  const bad = {
    id: "x",
    labelKey: "k",
    aspectW: 1,
    aspectH: 1,
    zones: [{ id: "a", labelKey: "k", top: 0.9, left: 0, width: 1, height: 0.2 }],
    titleSafe: { x: 0, y: 0, w: 1, h: 1 },
  };
  const errs = validateSafeAreaPlatform(bad as never);
  assert.ok(errs.some((e) => e.includes("tràn khỏi khung hình")));
  assert.ok(errs.some((e) => e.includes("giao với zone")));
});

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
