/**
 * mobile.test.cjs — test Q6 (Phase 8) mobile-web foundation, không cần DOM.
 * Chạy qua test-mobile.sh: pinch.ts được biên dịch thật sang CommonJS bằng tsc
 * trong /tmp rồi require; còn lại là kiểm tra tĩnh file thật (manifest, SW,
 * index.html, mobile.css, icon PNG, marker trong App/Timeline).
 */
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const OUT = "/tmp/vcut-test-mobile/out";
const REPO = process.env.REPO_DIR || path.resolve(__dirname, "../../..");
const WEB = path.join(REPO, "apps/web");

let pass = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  pass++;
}
function eq(a, b, msg) {
  assert.strictEqual(a, b, `${msg} (nhận ${a}, muốn ${b})`);
  pass++;
}

// --- 1. Toán pinch-zoom (module thật, đã biên dịch) ---
const pinch = require(`${OUT}/apps/web/src/lib/pinch.js`);
eq(pinch.PINCH_ZOOM_MIN, 8, "pinch min = 8 (khớp store.setZoom)");
eq(pinch.PINCH_ZOOM_MAX, 240, "pinch max = 240 (khớp store.setZoom)");
eq(pinch.pinchDistance(0, 0, 3, 4), 5, "pinchDistance 3-4-5");
eq(pinch.pinchZoom(100, 200, 60), 120, "mở gấp đôi -> zoom gấp đôi");
eq(pinch.pinchZoom(200, 100, 60), 30, "chụm một nửa -> zoom một nửa");
eq(pinch.pinchZoom(100, 10000, 60), 240, "zoom kẹp trần 240");
eq(pinch.pinchZoom(100, 1, 60), 8, "zoom kẹp sàn 8");
eq(pinch.pinchZoom(0, 100, 60), 60, "startDist 0 -> giữ nguyên (không NaN)");
eq(pinch.pinchZoom(100, 0, 60), 60, "currentDist 0 -> giữ nguyên");
ok(Number.isFinite(pinch.pinchZoom(100, 150, 60)), "pinchZoom hữu hạn");

// --- 2. Manifest PWA ---
const manifest = JSON.parse(fs.readFileSync(path.join(WEB, "public/manifest.webmanifest"), "utf8"));
eq(manifest.name, "VCut Studio", "manifest name");
eq(manifest.short_name, "VCut", "manifest short_name");
eq(manifest.display, "standalone", "manifest display standalone");
ok(manifest.start_url, "manifest có start_url");
ok(manifest.theme_color, "manifest có theme_color");
const sizes = manifest.icons.map((i) => i.sizes);
ok(sizes.includes("192x192"), "manifest có icon 192");
ok(sizes.includes("512x512"), "manifest có icon 512");
ok(manifest.icons.some((i) => i.purpose === "maskable"), "manifest có icon maskable");
for (const icon of manifest.icons) {
  const p = path.join(WEB, "public", icon.src.replace(/^\//, ""));
  ok(fs.existsSync(p), `icon trong manifest tồn tại: ${icon.src}`);
}

// --- 3. Icon PNG: đúng magic + đúng kích thước (đọc IHDR) ---
function pngSize(p) {
  const buf = fs.readFileSync(p);
  ok(buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), `${p} là PNG thật`);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
eq(pngSize(path.join(WEB, "public/icons/icon-192.png")).w, 192, "icon-192 đúng 192px");
eq(pngSize(path.join(WEB, "public/icons/icon-512.png")).w, 512, "icon-512 đúng 512px");
eq(pngSize(path.join(WEB, "public/icons/icon-maskable-512.png")).w, 512, "icon maskable đúng 512px");
eq(pngSize(path.join(WEB, "public/icons/apple-touch-icon.png")).w, 180, "apple-touch-icon đúng 180px");

// --- 4. Service worker: đúng phạm vi, không cache bridge/blob ---
const sw = fs.readFileSync(path.join(WEB, "public/sw.js"), "utf8");
ok(sw.includes("vcut-shell-v1"), "SW có cache name versioned");
ok(sw.includes("install") && sw.includes("activate") && sw.includes("fetch"), "SW đủ 3 handler");
ok(sw.includes("sameOrigin") || sw.includes("location.origin"), "SW chỉ xử lý cùng origin");
ok(sw.includes("navigate"), "SW xử lý navigation fallback");
// Bỏ comment trước khi check: sw.js nhắc tới 8787 trong comment giải thích,
// nhưng code fetch không được chứa URL bridge — bridge khác origin nên guard
// isSameOrigin đã loại nó, không cần (và không được) hardcode ngoại lệ.
const swCode = sw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
ok(!swCode.includes("8787") && !swCode.includes("localhost"), "SW code không hardcode bridge");
ok(sw.includes("SKIP_WAITING"), "SW hỗ trợ skipWaiting");

// --- 5. index.html: PWA wiring ---
const html = fs.readFileSync(path.join(WEB, "index.html"), "utf8");
ok(html.includes('rel="manifest"'), "index.html link manifest");
ok(html.includes('name="theme-color"'), "index.html có theme-color");
ok(html.includes("apple-touch-icon"), "index.html có apple-touch-icon");
ok(html.includes("viewport-fit=cover"), "viewport dùng viewport-fit=cover");
ok(html.includes("apple-mobile-web-app-capable"), "index.html khai báo iOS capable");

// --- 6. mobile.css: rule thật, không chỉ file rỗng ---
const css = fs.readFileSync(path.join(WEB, "src/mobile.css"), "utf8");
ok(css.includes("@media (max-width: 768px)"), "mobile.css có breakpoint 768px");
ok(css.includes(".tl-clip") && css.includes("touch-action: none"), "clip có touch-action none");
ok(css.includes(".tl-lanes") && css.includes("touch-action: pan-x"), "lanes cuộn ngang pan-x");
ok(css.includes(".m-sheet"), "có style bottom sheet");
ok(css.includes(".m-fabbar"), "có style nút nổi mobile");
ok(css.includes("100dvh"), "dùng dvh cho chiều cao app mobile");
ok(css.includes("min-height: 44px"), "nút mobile tối thiểu 44px");
ok(css.includes(".clip-handle") && css.includes("width: 22px"), "tay cầm trim 22px trên mobile");

// --- 7. App.tsx: sheet chỉ render khi mobile, desktop không đổi ---
const app = fs.readFileSync(path.join(WEB, "src/App.tsx"), "utf8");
ok(app.includes("useIsMobile"), "App dùng useIsMobile");
ok(app.includes("!isMobile && <MediaBin />"), "desktop vẫn render MediaBin inline");
ok(app.includes("!isMobile && <Inspector />"), "desktop vẫn render Inspector inline");
ok(app.includes("m-sheet-backdrop") && app.includes("m-fabbar"), "mobile có sheet + fabbar");

// --- 8. Timeline.tsx: pinch-zoom nối vào store, không chỉ UI ---
const tl = fs.readFileSync(path.join(WEB, "src/Timeline.tsx"), "utf8");
ok(tl.includes("pinchZoom") && tl.includes("pinchDistance"), "Timeline dùng pinch helper");
ok(tl.includes("setZoom(pinchZoom"), "pinch gọi setZoom thật");
ok(tl.includes("pointercancel"), "xử lý pointercancel (ngón tay bị hệ thống giành)");

// --- 9. main.tsx: chỉ đăng ký SW ở production ---
const main = fs.readFileSync(path.join(WEB, "src/main.tsx"), "utf8");
ok(main.includes("mobile.css"), "main import mobile.css");
ok(main.includes("import.meta.env.PROD"), "SW chỉ đăng ký ở production");
ok(main.includes('register("/sw.js")'), "đăng ký /sw.js");

console.log(`\n✅ mobile: ${pass} assertions pass`);
