// safeAreaOverlay73A9.render.test.ts — render THẬT SafeAreaOverlay bằng
// react-dom/server (Phase 9 đợt 73 A9, hướng S4).
// Chạy bằng esbuild bundle (mẫu L1, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/safeAreaOverlay73A9.render.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round73-a9/overlay.test.cjs \
//     && node /tmp/round73-a9/overlay.test.cjs
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SafeAreaOverlay } from "../components/SafeAreaOverlay";

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

console.log("== SafeAreaOverlay render thật (đợt 73 A9) ==");

ok("tiktok 9:16: render đủ 3 zone + title-safe + select 7 option", () => {
  const html = renderToStaticMarkup(
    React.createElement(SafeAreaOverlay, {
      enabled: true,
      platformId: "tiktok",
      videoRect: { x: 100, y: 0, w: 540, h: 960 },
      videoW: 1080,
      videoH: 1920,
      onPlatformChange: () => undefined,
    }),
  );
  // Nhãn zone (vi mặc định) + title-safe có mặt.
  assert.ok(html.includes("Thanh trên"), html.slice(0, 200));
  assert.ok(html.includes("Ray nút phải"));
  assert.ok(html.includes("Caption + thanh dưới"));
  assert.ok(html.includes("Vùng title-safe"));
  // 3 zone + 1 title-safe + 1 select.
  assert.equal((html.match(/safe-area-zone"/g) || []).length, 3);
  assert.ok(html.includes("safe-area-title-safe"));
  assert.equal((html.match(/<option/g) || []).length, 7); // auto + 6 nền tảng (đợt 80 H10: +reels, +shorts)
  // Select liệt kê đủ 6 nền tảng (label mới qua i18n, vi mặc định).
  assert.ok(html.includes("Instagram Reels 9:16"));
  assert.ok(html.includes("YouTube Shorts 9:16"));
  assert.ok(html.includes("TikTok 9:16"));
  // Caption dưới: top = 0.73×960 = 700.8, height = 0.27×960 = 259.2
  // (đợt 74 B5 hiệu chỉnh từ 0.76/0.24 theo số đo tay 09/2026).
  assert.ok(html.includes("top:700.8px"), html);
  assert.ok(html.includes("height:259.2px"), html);
});

ok("reels 9:16 (đợt 80 H10): caption dưới top=720px (0.75×960), khác tiktok 700.8px", () => {
  const html = renderToStaticMarkup(
    React.createElement(SafeAreaOverlay, {
      enabled: true,
      platformId: "reels",
      videoRect: { x: 100, y: 0, w: 540, h: 960 },
      videoW: 1080,
      videoH: 1920,
      onPlatformChange: () => undefined,
    }),
  );
  assert.equal((html.match(/safe-area-zone"/g) || []).length, 3);
  assert.ok(html.includes("top:720px"), html);
  assert.ok(html.includes("height:240px"), html); // 0.25 × 960
  assert.ok(!html.includes("top:700.8px"), "không dùng số TikTok");
});

ok("shorts 9:16 (đợt 80 H10): caption dưới top=768px (0.80×960), height=192px", () => {
  const html = renderToStaticMarkup(
    React.createElement(SafeAreaOverlay, {
      enabled: true,
      platformId: "shorts",
      videoRect: { x: 100, y: 0, w: 540, h: 960 },
      videoW: 1080,
      videoH: 1920,
      onPlatformChange: () => undefined,
    }),
  );
  assert.equal((html.match(/safe-area-zone"/g) || []).length, 3);
  assert.ok(html.includes("top:768px"), html);
  assert.ok(html.includes("height:192px"), html); // 0.20 × 960
});

ok("enabled=false: không render gì", () => {
  const html = renderToStaticMarkup(
    React.createElement(SafeAreaOverlay, {
      enabled: false,
      platformId: "tiktok",
      videoRect: { x: 0, y: 0, w: 540, h: 960 },
      videoW: 1080,
      videoH: 1920,
      onPlatformChange: () => undefined,
    }),
  );
  assert.equal(html, "");
});

ok("platformId=auto + khung 16:9: đoán youtube, chỉ có endScreen", () => {
  const html = renderToStaticMarkup(
    React.createElement(SafeAreaOverlay, {
      enabled: true,
      platformId: "auto",
      videoRect: { x: 0, y: 0, w: 960, h: 540 },
      videoW: 1920,
      videoH: 1080,
      onPlatformChange: () => undefined,
    }),
  );
  assert.ok(html.includes("End-screen"));
  assert.ok(!html.includes("Ray nút phải"));
  assert.equal((html.match(/safe-area-zone"/g) || []).length, 1);
});

ok("platformId=auto + tỉ lệ lạ 4:3: không đoán mò, render rỗng", () => {
  const html = renderToStaticMarkup(
    React.createElement(SafeAreaOverlay, {
      enabled: true,
      platformId: "auto",
      videoRect: { x: 0, y: 0, w: 800, h: 600 },
      videoW: 800,
      videoH: 600,
      onPlatformChange: () => undefined,
    }),
  );
  assert.equal(html, "");
});

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
