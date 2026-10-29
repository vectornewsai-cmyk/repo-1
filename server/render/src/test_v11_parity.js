#!/usr/bin/env node
/**
 * test_v11_parity.js — Phase 9 đợt 11, luồng P1: mở rộng harness V6
 * (test_v10_parity.js) thành đối chiếu frame preview-vs-render TỰ ĐỘNG
 * cho transition + text, bỏ nhãn PENDING hardcode của V6.
 *
 * V6 PENDING vì lúc viết harness chưa có module preview trên đĩa. Đợt 10
 * đã có: apps/web/src/lib/transitionPreview.ts (V1, hình học transition)
 * và textClipVisual trong apps/web/src/lib/previewEngine.ts (V4, mirror
 * text parity) + cách vẽ thật trong apps/web/src/preview.tsx. Harness này
 * ĐỌC các module đó (transpile bằng tsc sang /tmp, không sửa code sản
 * phẩm) và đối chiếu frame thật, không hardcode kết quả.
 *
 * Cách chạy (từ server/render/):
 *   node src/test_v11_parity.js
 *
 * PHẦN TRANSITION (khung 72x45, A = đỏ thuần, B = xanh dương thuần):
 * - Render: FFmpeg thật qua chính buildXfadeFilter của render worker
 *   (giống V6: duration 1, offset 1, frame giữa transition = index 45).
 * - Preview: raster hoá "composite preview" từ describeTransition(type,
 *   0.5, W, H) — tức vẽ CẢ 2 lớp A và B của cặp transition lên cùng 1
 *   frame. LƯU Ý TRUNG THỰC: preview thật (preview.tsx) chỉ vẽ 1 clip
 *   tại 1 thời điểm (lớp của clip đó, phần còn lại là nền đen) nên KHÔNG
 *   bao giờ thấy cả 2 clip cùng lúc như xfade render (xem LIMITS đợt 10
 *   §3). Composite ở đây kiểm tra HÌNH HỌC của describeTransition có
 *   khớp hình học render không — không claim preview canvas vẽ ra đúng
 *   frame này. Nếu composite đã lệch thì hình học preview sai; nếu
 *   composite khớp thì hình học đúng, còn khác biệt "1 clip vs 2 clip"
 *   vẫn tồn tại ở preview thật và đã ghi trong LIMITS.
 * - Raster hoá lớp: region test trên toạ độ output (pixel tâm), rồi
 *   kiểm tra nguồn còn trong khung sau offset/scale (dx/dy/scaleX/
 *   scaleY của layer). Vẽ A trước, B sau (sequential over). Ngoại lệ
 *   duy nhất: họ fade (geometric=false) có alpha phân số cộng lại = 1
 *   nên composite = A*a.alpha + B*b.alpha (crossfade), vì vẽ tuần tự
 *   qua nền đen sẽ cho A*(1-p)^2 + B*p (sai công thức crossfade).
 *
 * PHẦN TEXT (khung 320x180, chữ "TEST" trắng trên nền đen):
 * - Render: FFmpeg thật + filter subtitles với file ASS do chính
 *   buildParityAss của render worker dựng (tiltIn/skewIn/slideReveal/
 *   curtainIn), lấy frame giữa animation.
 * - Preview: lấy số mirror THẬT từ textClipVisual (transpile
 *   previewEngine.ts) tại cùng thời điểm, rồi raster hoá lại từ frame
 *   nền drawtext (chữ chưa transform, đo bbox thật để căn tâm):
 *     thứ tự transform đúng preview.tsx: clip theo clipRect → translate
 *     (cx,cy) → rotate → shear (canvas transform (1,0,tan,1,0,0) nghĩa
 *     là shear TRƯỚC rotate trong tích ma trận T·R·S) → alpha nhân.
 *     Harness đảo ngược đúng thứ tự đó bằng nội suy song tuyến
 *     (bilinear); khác biệt raster giữa libass và drawtext+bilinear là
 *     có thật và nằm trong số MAD (không giấu). Từ đợt 11 P4, clip của
 *     slideReveal/curtainIn quét theo HỘP CHỮ (đo bằng canvas/drawtext),
 *     không quét khung hình như đợt 10: harness truyền hộp đã đo từ
 *     frame nền sang cả 2 phía (preview qua m.textW/textH, render qua
 *     boxById của buildParityAss — render nhân thêm LIBASS_SCALE 0.84
 *     theo thiết kế của P4). Không truyền hộp thì render fallback quét
 *     khung hình (đợt 10) trong khi preview vẫn quét hộp — so sánh
 *     lệch mô hình đó không còn dùng nữa.
 * - previewEngine.ts chỉ import @repo-1/video-spec (kiểu + hằng số);
 *   nhánh parity của textClipVisual không gọi hàm nào trong số đó nên
 *   harness cấp stub throw-on-call cho import này: nếu nhánh parity
 *   vô tình gọi stub thì harness lỗi to thay vì cho số sai lặng lẽ.
 *
 * PHÂN LOẠI (giữ đúng thang V6 để so sánh được với đợt 10):
 *   KHỚP  = MAD <= 2 và >= 99% pixel lệch <= 8 (mỗi kênh).
 *   XẤP XỈ = MAD <= 20 và >= 90% pixel lệch <= 32.
 *   LỆCH  = ngoài 2 mức trên. LỆCH là FAIL của case đó, không phải lỗi
 *   harness — nó đo khoảng cách thật giữa hình học preview và render.
 *   PENDING chỉ còn khi module preview không load được (ghi rõ lý do).
 *
 * Exit: 0 khi mọi case render chạy xong (kể cả case LỆCH — LỆCH là kết
 * quả đo, xem bảng); 1 khi có case render lỗi; 2 khi harness lỗi
 * (thiếu ffmpeg, module preview load lỗi ở bước bắt buộc).
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v11-parity-"));

const { buildXfadeFilter } = require("./transitions");

// Đợt 16 H6: logic raster transition dùng chung (radial smoothstep +
// tâm cắt nguyên, dissolve frand float32) đã tách sang harnessShared.js.
// pointInPolygon/regionCovers/radialWeight/layerPixelAlpha/layerCovers/
// barsFadeIsBar/rasterizeTransitionPreview nay import từ đó (đợt 17
// N1 dời nốt 2 bản sao cuối về module chung, ngữ nghĩa không đổi).
const { regionCovers, layerPixelAlpha, layerCovers, setRadialWeight, setDissolveFrand, setBarsFadeIsBar, rasterizeTransitionPreview, rasterizeTextPreview, ffmpegYuvCompare, formatYuvMad } = require("./harnessShared");

// Đợt 19 G6: cờ đo miền YUV qua FFmpeg (mặc định TẮT — chạy mặc định
// cho log giống hệt baseline). Bật bằng `node src/test_v11_parity.js
// --yuv`: mỗi case transition in thêm 1 dòng [YUV-FFmpeg] (cả 2 phía
// qua cùng bộ chuyển FFmpeg, xem harnessShared.ffmpegYuvCompare; khung
// 72x45 được pad về 72x46). Dòng YUV không tính vào FAIL/KẾT, chỉ để
// đối chiếu kết luận RGB vs YUV trên cùng case.
const YUV_MODE = process.argv.includes("--yuv");
const { buildParityAss } = require("./textAnimParity");

const W = 72;
const H = 45;
const FPS = 30;
const TW = 320;
const TH = 180;
const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";

// ---------------------------------------------------------------------------
// Chạy FFmpeg + đo pixel (dùng chung cho cả 2 phần)
// ---------------------------------------------------------------------------

function runFfmpeg(args, label) {
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  const ms = Date.now() - t0;
  if (r.status !== 0) {
    throw new Error(`${label}: ffmpeg exit ${r.status}: ${(r.stderr || "").slice(0, 500)}`);
  }
  return ms;
}

function px(buf, w, x, y) {
  const i = (y * w + x) * 3;
  return [buf[i], buf[i + 1], buf[i + 2]];
}

function isNear(c, target, tol) {
  return (
    Math.abs(c[0] - target[0]) <= tol &&
    Math.abs(c[1] - target[1]) <= tol &&
    Math.abs(c[2] - target[2]) <= tol
  );
}

function compareFrames(a, b, w, h) {
  if (a.length !== b.length) {
    return { mad: NaN, le8: 0, le32: 0, mismatch: true, lenA: a.length, lenB: b.length };
  }
  let sum = 0;
  let le8 = 0;
  let le32 = 0;
  const n = w * h;
  for (let i = 0; i < n * 3; i++) sum += Math.abs(a[i] - b[i]);
  for (let p = 0; p < n; p++) {
    const d = Math.max(
      Math.abs(a[p * 3] - b[p * 3]),
      Math.abs(a[p * 3 + 1] - b[p * 3 + 1]),
      Math.abs(a[p * 3 + 2] - b[p * 3 + 2]),
    );
    if (d <= 8) le8++;
    if (d <= 32) le32++;
  }
  return { mad: sum / (n * 3), le8: le8 / n, le32: le32 / n };
}

function classify(m) {
  if (m.mismatch) return "LỆCH (FAIL — kích thước frame khác nhau)";
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP (PASS)";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ (PARTIAL)";
  return "LỆCH (FAIL)";
}

function fracNear(buf, w, h, target, tol) {
  let hit = 0;
  for (let i = 0; i < w * h; i++) {
    if (isNear([buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]], target, tol)) hit++;
  }
  return hit / (w * h);
}

function brightCount(buf, w, h, thr) {
  let n = 0;
  for (let i = 0; i < w * h; i++) {
    if (Math.max(buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]) > thr) n++;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Load module TS của web qua tsc → /tmp (giống kỹ thuật của V6)
// ---------------------------------------------------------------------------

function findTsc() {
  const candidates = [
    path.join(ROOT, "apps", "web", "node_modules", ".bin", "tsc"),
    path.join(ROOT, "node_modules", ".bin", "tsc"),
    "tsc",
  ];
  for (const c of candidates) {
    const r = spawnSync(c, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return c;
  }
  return null;
}

function transpileTs(srcRel, outName) {
  const src = path.join(ROOT, srcRel);
  if (!fs.existsSync(src)) {
    return { ok: false, reason: `${srcRel} chưa có trên đĩa` };
  }
  const tsc = findTsc();
  if (!tsc) return { ok: false, reason: "không tìm thấy tsc" };
  const outDir = path.join(TMP, outName);
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(
    tsc,
    [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020",
     "--moduleResolution", "node", "--skipLibCheck"],
    { encoding: "utf8" },
  );
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) {
    return { ok: false, reason: `tsc không sinh ra ${jsFile}: ${(r.stderr || "").slice(0, 300)}` };
  }
  // previewEngine import @repo-1/video-spec (chỉ type-check; tsc có thể
  // báo lỗi resolve type nhưng vẫn emit JS — chấp nhận nếu file đã có).
  if (r.status !== 0) {
    console.log(`  (tsc ${srcRel} exit ${r.status} nhưng vẫn emit JS — tiếp tục, stderr: ${(r.stderr || "").slice(0, 200)})`);
  }
  try {
    return { ok: true, mod: require(jsFile), outDir, jsFile };
  } catch (e) {
    return { ok: false, reason: `require module đã transpile lỗi: ${e.message}` };
  }
}

function loadTransitionPreview() {
  return transpileTs(
    path.join("apps", "web", "src", "lib", "transitionPreview.ts"),
    "transitionPreview-js",
  );
}

function loadPreviewEngine() {
  // Stub @repo-1/video-spec: nhánh parity của textClipVisual không gọi
  // hàm nào của package này; stub throw nếu bị gọi để không cho số sai
  // lặng lẽ. Đặt stub vào TMP/node_modules để require từ TMP resolve được.
  const stubDir = path.join(TMP, "node_modules", "@repo-1", "video-spec");
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(
    path.join(stubDir, "package.json"),
    JSON.stringify({ name: "@repo-1/video-spec-stub", main: "index.js" }),
  );
  const names = ["CHROMA_DEFAULTS", "EFFECT_TYPES", "LUT_IDS", "STICKER_DEFAULTS",
    "interpolateKeyframes", "sourceTimeAt", "speedAt"];
  const lines = names.map((n) =>
    `exports.${n} = (() => { throw new Error("stub @repo-1/video-spec: ${n} bị gọi — nhánh text này không được dùng stub"); });`);
  // Hằng số dạng object: cho giá trị rỗng thay vì hàm (code chỉ đọc, không gọi).
  fs.writeFileSync(
    path.join(stubDir, "index.js"),
    `// Stub chỉ phục vụ load previewEngine.ts trong harness V11.\n` +
    `// textClipVisual nhánh parity không dùng các export này.\n` +
    `exports.CHROMA_DEFAULTS = {};\n` +
    `exports.EFFECT_TYPES = [];\n` +
    `exports.LUT_IDS = [];\n` +
    `exports.STICKER_DEFAULTS = {};\n` +
    lines.slice(4).join("\n") + "\n",
  );
  const r = transpileTs(
    path.join("apps", "web", "src", "lib", "previewEngine.ts"),
    "previewEngine-js",
  );
  if (!r.ok) return r;
  if (typeof r.mod.textClipVisual !== "function") {
    return { ok: false, reason: "previewEngine đã transpile nhưng thiếu textClipVisual" };
  }
  return r;
}

// ---------------------------------------------------------------------------
// PHẦN TRANSITION — raster hoá composite preview từ describeTransition
// (logic radial/dissolve dùng chung nay ở harnessShared.js — đợt 16 H6)
// ---------------------------------------------------------------------------

// Đợt 17 N1: barsFadeIsBar + rasterizeTransitionPreview nay ở harnessShared.js (bản duy nhất).
function solidFrame(r, g, b, w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    buf[i * 3] = r;
    buf[i * 3 + 1] = g;
    buf[i * 3 + 2] = b;
  }
  return buf;
}

function writeRaw(name, frame, count) {
  const p = path.join(TMP, name);
  const chunks = [];
  for (let i = 0; i < count; i++) chunks.push(frame);
  fs.writeFileSync(p, Buffer.concat(chunks));
  return p;
}

function renderTransition(type, outName) {
  const a = writeRaw("srcA.raw", solidFrame(255, 0, 0, W, H), 60);
  const b = writeRaw("srcB.raw", solidFrame(0, 0, 255, W, H), 60);
  const out = path.join(TMP, outName);
  const filter = buildXfadeFilter(type, 1, 1);
  const ms = runFfmpeg(
    [
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", a,
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", b,
      "-filter_complex", `[0:v][1:v]${filter},format=rgb24[v]`,
      "-map", "[v]", "-f", "rawvideo", "-pix_fmt", "rgb24", out,
    ],
    `transition ${type}`,
  );
  const buf = fs.readFileSync(out);
  const sz = W * H * 3;
  return { mid: Buffer.from(buf.subarray(45 * sz, 46 * sz)), ms };
}

// ---------------------------------------------------------------------------
// PHẦN TEXT — base drawtext, render ASS, raster preview từ textClipVisual
// ---------------------------------------------------------------------------

function renderDrawtextFrame(x, y, outName) {
  const black = Buffer.alloc(TW * TH * 3);
  const inp = writeRaw("txtBlack.raw", black, 1);
  const out = path.join(TMP, outName);
  runFfmpeg(
    [
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${TW}x${TH}`, "-r", String(FPS), "-i", inp,
      "-vf", `drawtext=fontfile=${FONT}:text='TEST':fontsize=24:fontcolor=white:x=${x}:y=${y},format=rgb24`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out,
    ],
    "drawtext base",
  );
  return fs.readFileSync(out);
}

function measureBbox(buf, w, h, thr) {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      if (Math.max(buf[i], buf[i + 1], buf[i + 2]) > thr) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

/** Frame nền drawtext đã căn tâm bbox về đúng (TW/2, TH/2). */
function centeredBaseFrame() {
  const first = renderDrawtextFrame(100, 70, "txtBase1.raw");
  const bb1 = measureBbox(first, TW, TH, 100);
  if (!bb1) throw new Error("drawtext base không có pixel sáng — font drawtext lỗi");
  const x2 = Math.round(TW / 2 - bb1.w / 2 - (bb1.x0 - 100));
  const y2 = Math.round(TH / 2 - bb1.h / 2 - (bb1.y0 - 70));
  const base = renderDrawtextFrame(x2, y2, "txtBase2.raw");
  const bb2 = measureBbox(base, TW, TH, 100);
  return { base, bbox: bb2 };
}

function renderAssFrame(anim, t, box) {
  const ass = buildParityAss(
    [{ id: "p1", start: 0, duration: 4, text: "TEST",
       style: { animation: anim, fontFamily: "DejaVu Sans", fontSize: 24, color: "#ffffff", x: 0.5, y: 0.5 } }],
    { width: TW, height: TH },
    // Đợt 11 P4: render ASS quét theo HỘP CHỮ khi có box (không box thì
    // fallback quét khung hình như đợt 10). Harness truyền đúng hộp đã
    // đo từ frame nền drawtext để cả 2 phía cùng dùng hộp đó: phía
    // preview dùng hộp nguyên qua m.textW/textH, phía render nhân thêm
    // LIBASS_SCALE 0.84 của P4 (hiệu chỉnh libass vẽ hẹp hơn đo lường).
    box ? { p1: box } : undefined,
  );
  const out = path.join(TMP, `txtAss-${anim}.raw`);
  runFfmpeg(
    [
      "-f", "lavfi", "-i", `color=c=0x000000:s=${TW}x${TH}:d=4:r=${FPS}`,
      "-vf", `subtitles='${ass}',format=rgb24`,
      "-f", "rawvideo", "-pix_fmt", "rgb24", out,
    ],
    `ASS ${anim}`,
  );
  const buf = fs.readFileSync(out);
  const sz = TW * TH * 3;
  const idx = Math.round(t * FPS);
  return Buffer.from(buf.subarray(idx * sz, (idx + 1) * sz));
}

// Đợt 19 G6: sampleBilinear + rasterizeTextPreview nay ở harnessShared.js (bản duy nhất,
// dời nguyên văn từ đây — 2 bản V11/V12 đã giống hệt nhau trước khi dời).

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** Dọn TMP làm việc (raw 20MB/case text — /tmp VM chỉ 512MB, không dọn
 *  thì vài lần chạy là đầy ổ và render sau lỗi "No space left"). */
function cleanupTmp() {
  try {
    fs.rmSync(TMP, { recursive: true, force: true });
  } catch (e) {
    console.log(`(không dọn được tmp ${TMP}: ${e.message})`);
  }
}

function main() {
  let renderErrors = 0;
  const failCases = [];
  const row = (s) => console.log(s);

  console.log("== V11 parity harness (đợt 11, luồng P1) — preview-vs-render tự động ==");
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  console.log(`transition: ${W}x${H} @${FPS}fps, A đỏ / B xanh, frame giữa p=0.5`);
  console.log(`text: ${TW}x${TH}, "TEST" trắng trên nền đen, frame giữa animation`);
  console.log(`máy đo: ${os.hostname()} ${os.platform()}/${os.arch()} ${os.cpus().length} CPU (số chỉ đúng máy này)`);
  console.log(`tmp: ${TMP}`);
  console.log("");

  // ---- A. Transitions ----
  console.log("--- A. TRANSITION: composite preview (describeTransition) vs render xfade ---");
  if (YUV_MODE) console.log("  [YUV-FFmpeg] mode đo miền YUV BẬT: mỗi case in thêm dòng YUV (không tính vào FAIL/KẾT)");
  const tp = loadTransitionPreview();
  if (!tp.ok) {
    console.log(`transitionPreview: PENDING — ${tp.reason} (toàn bộ phần A bỏ qua, exit 2)`);
    cleanupTmp();
    process.exit(2);
  }
  console.log(`transitionPreview: OK (transpile từ apps/web/src/lib/transitionPreview.ts)`);
  if (typeof tp.mod.radialGradientWeight === "function") {
    setRadialWeight(tp.mod.radialGradientWeight);
    console.log(`radialGradientWeight: dùng hàm thật từ module (đợt 13)`);
  }
  // Đợt 16 H1: nối bars-fade vào V11 (trước đây kind lạ → frame đen).
  if (typeof tp.mod.barsFadePixelIsBar === "function") {
    setBarsFadeIsBar(tp.mod.barsFadePixelIsBar);
    console.log(`barsFadePixelIsBar: dùng hàm thật từ module (đợt 16 H1)`);
  } else {
    console.log(`barsFadePixelIsBar: dùng fallback nội bộ (module chưa có hàm thật)`);
  }
  // Đợt 15 T1: nối dissolve-noise vào V11 (trước đây V11 chưa hỗ trợ
  // nên dissolve luôn FAIL trong khi V12 đã PASS với MAD 0,00).
  const df = transpileTs(
    path.join("apps", "web", "src", "lib", "dissolveFrand.ts"),
    "dissolveFrand-js",
  );
  if (df.ok && typeof df.mod.ffmpegDissolveFrand === "function") {
    setDissolveFrand(df.mod.ffmpegDissolveFrand);
    console.log(`dissolveFrand: OK (transpile từ apps/web/src/lib/dissolveFrand.ts)`);
  } else {
    console.log(`dissolveFrand: PENDING — ${df.reason || "thiếu ffmpegDissolveFrand"} (case dissolve sẽ LỆCH do region không raster được)`);
  }
  const transitionCases = [
    { type: "fade", note: "họ fade, crossfade tuyến tính" },
    { type: "wipeleft", note: "wipe-left: B quét từ phải sang" },
    { type: "slideright", note: "slide-right: cả 2 cùng trượt" },
    { type: "circleopen", note: "gradient smoothstep xuyên tâm, tâm/rMax cắt nguyên (đợt 14 R4)" },
    { type: "circleclose", note: "gradient smoothstep, ảnh gương thời gian của circleopen (đợt 14 R4)" },
    { type: "dissolve", note: "đợt 15 T1: dissolve-noise từng pixel theo vf_xfade.c (frand float32, đợt 14 R2) nối vào V11" },
    { type: "diamondclose", note: "V3 mới: A co thành hình thoi, B lộ ngoài" },
    { type: "squareopen", note: "V3 mới: B nở từ hình vuông giữa" },
    // Đợt 12 T2: 12 type V3 còn lại đã có hình học trong transitionPreview.
    { type: "squareclose", note: "V3 mới: A co thành hình vuông giữa" },
    { type: "checker-alt", note: "V3 mới: ô chẵn trước (p>0.25), ô lẻ sau (p>0.75)" },
    { type: "blinds-diag", note: "V3 mới: dải mành chéo (quét hàng)" },
    { type: "split-h", note: "V3 mới: nửa trên quét từ trái, nửa dưới từ phải" },
    { type: "split-v", note: "V3 mới: nửa trái quét từ trên, nửa phải từ dưới" },
    { type: "barn-h", note: "V3 mới: B khép vào từ 2 mép trái-phải" },
    { type: "barn-v", note: "V3 mới: B khép vào từ 2 mép trên-dưới" },
    { type: "rings", note: "V3 mới: 4 vòng đồng tâm (quét hàng giải tích)" },
    { type: "corners", note: "V3 mới: B nở từ 4 góc (quét hàng)" },
    { type: "star", note: "V3 mới: B nở theo sao 5 cánh (96 đỉnh)" },
    { type: "clock-ccw", note: "V3 mới: B quét ngược chiều kim đồng hồ" },
    { type: "spiral", note: "V3 mới: B quét xoắn ốc (polygon dải xoắn)" },
    // Đợt 16 H1: 5 kind đợt 15 (rects đã có sẵn trong rasterizer,
    // bars-fade nối nhánh mới ở trên) — đo để quyết badge.
    { type: "bars-fade", note: "đợt 16 H1: dải B thuần trên nền crossfade (kind bars-fade)" },
    { type: "blinds-h", note: "đợt 16 H1: 8 dải ngang, lưới dịch +0,5 (đợt 15 T6)" },
    { type: "plus", note: "đợt 16 H1: dấu cộng, biên lte ceil/floor+1 (đợt 15 T6)" },
    { type: "checker", note: "đợt 16 H1: ô bàn cờ, lưới dịch +0,5 (đợt 15 T6)" },
    { type: "grid", note: "đợt 16 H1: mỗi ô vuông B ở góc trên-trái ô (đợt 15 T2)" },
  ];
  for (const c of transitionCases) {
    try {
      const visual = tp.mod.describeTransition(c.type, 0.5, W, H);
      const previewBuf = rasterizeTransitionPreview(visual, W, H);
      const { mid, ms } = renderTransition(c.type, `tr11-${c.type}.raw`);
      const m = compareFrames(mid, previewBuf, W, H);
      const tier = classify(m);
      if (tier.startsWith("LỆCH")) failCases.push(`transition ${c.type}`);
      const bRender = fracNear(mid, W, H, [0, 0, 255], 16);
      const bPreview = fracNear(previewBuf, W, H, [0, 0, 255], 16);
      row(`${c.type} | ${c.note} | preview geometric=${visual.geometric} (${visual.note}) | ` +
        `MAD=${m.mad.toFixed(2)} <=8: ${(m.le8 * 100).toFixed(1)}% <=32: ${(m.le32 * 100).toFixed(1)}% | ${tier} | ` +
        `tỉ lệ pixel B: render ${(bRender * 100).toFixed(1)}% vs preview ${(bPreview * 100).toFixed(1)}% | render ${ms}ms`);
      if (YUV_MODE) {
        try {
          const ym = ffmpegYuvCompare(previewBuf, mid, W, H, TMP, `yuv-tr11-${c.type}`);
          row(`  [YUV-FFmpeg] ${c.type} | ${formatYuvMad(ym)}`);
        } catch (e) {
          row(`  [YUV-FFmpeg] ${c.type} | LỖI: ${e.message}`);
        }
      }
    } catch (e) {
      renderErrors++;
      row(`${c.type} | RENDER LỖI: ${e.message}`);
    }
  }

  // ---- B. Text animations ----
  console.log("\n--- B. TEXT: raster preview (textClipVisual) vs render ASS ---");
  // Đợt 20 R6: nối mode --yuv sang phần B (như phần A đợt 19 G6) —
  // dòng YUV chỉ thêm, không tính vào FAIL/KẾT, không đổi dòng RGB.
  if (YUV_MODE) console.log("  [YUV-FFmpeg] mode đo miền YUV BẬT: mỗi case text in thêm dòng YUV (không tính vào FAIL/KẾT)");
  const pe = loadPreviewEngine();
  if (!pe.ok) {
    console.log(`previewEngine: PENDING — ${pe.reason} (phần B bỏ qua, exit 2)`);
    cleanupTmp();
    process.exit(2);
  }
  console.log(`previewEngine: OK (transpile từ apps/web/src/lib/previewEngine.ts, stub @repo-1/video-spec throw-on-call)`);
  let baseInfo = null;
  try {
    baseInfo = centeredBaseFrame();
    console.log(`base drawtext: bbox tâm đo được = (${baseInfo.bbox.cx.toFixed(1)}, ${baseInfo.bbox.cy.toFixed(1)}) ` +
      `(mục tiêu (${TW / 2}, ${TH / 2})), kích thước ${baseInfo.bbox.w}x${baseInfo.bbox.h}`);
  } catch (e) {
    console.log(`base drawtext: LỖI — ${e.message} (phần B bỏ qua, exit 1)`);
    cleanupTmp();
    process.exit(1);
  }
  const textCases = [
    { anim: "tiltIn", t: 0.35, note: "giữa 0.7s: xoay -6°, trồi +10px, alpha 0.5" },
    { anim: "skewIn", t: 0.30, note: "giữa 0.6s: fax ~0.039 (skew ~2.3°), trượt -5px, alpha 0.5" },
    { anim: "slideReveal", t: 0.50, note: "giữa 1.0s: clipRect nửa hộp chữ, không mờ" },
    { anim: "curtainIn", t: 0.40, note: "giữa 0.8s: clipRect giữa hộp chữ, alpha 0.5" },
  ];
  for (const c of textCases) {
    try {
      const clip = {
        kind: "text", id: "t1", text: "TEST", start: 0, duration: 4,
        style: { fontFamily: "DejaVu Sans", fontSize: 24, color: "#ffffff", x: 0.5, y: 0.5, animation: c.anim },
      };
      const vis = pe.mod.textClipVisual(clip, c.t, TW, TH, { textW: baseInfo.bbox.w, textH: baseInfo.bbox.h });
      const previewBuf = rasterizeTextPreview(vis, baseInfo.base, baseInfo.bbox.cx, baseInfo.bbox.cy, TW, TH);
      // Truyền cùng hộp đo được sang render (xem renderAssFrame): cả 2
      // phía đều quét theo hộp chữ (đợt 11 P4), không phải khung hình.
      const renderBuf = renderAssFrame(c.anim, c.t, { w: baseInfo.bbox.w, h: baseInfo.bbox.h });
      const m = compareFrames(renderBuf, previewBuf, TW, TH);
      const tier = classify(m);
      if (tier.startsWith("LỆCH")) failCases.push(`text ${c.anim}`);
      const br = brightCount(renderBuf, TW, TH, 100);
      const bp = brightCount(previewBuf, TW, TH, 100);
      const visDesc = `cx=${vis.cx.toFixed(1)} cy=${vis.cy.toFixed(1)} rot=${vis.rotationDeg} ` +
        `skew=${vis.skewXDeg === undefined ? "-" : vis.skewXDeg.toFixed(2)} alpha=${vis.alpha.toFixed(2)} ` +
        `clip=${vis.clipRect ? `${vis.clipRect.x.toFixed(0)},${vis.clipRect.y.toFixed(0)},${vis.clipRect.w.toFixed(0)}x${vis.clipRect.h.toFixed(0)}` : "-"}`;
      row(`${c.anim} @t=${c.t}s | ${c.note} | mirror: ${visDesc} | ` +
        `MAD=${m.mad.toFixed(2)} <=8: ${(m.le8 * 100).toFixed(1)}% <=32: ${(m.le32 * 100).toFixed(1)}% | ${tier} | ` +
        `pixel sáng>100: render ${br} vs preview ${bp}`);
      if (YUV_MODE) {
        try {
          const ym = ffmpegYuvCompare(previewBuf, renderBuf, TW, TH, TMP, `yuv-v11-text-${c.anim}`);
          row(`  [YUV-FFmpeg] ${c.anim} | ${formatYuvMad(ym)}`);
        } catch (e) {
          row(`  [YUV-FFmpeg] ${c.anim} | LỖI: ${e.message}`);
        }
      }
    } catch (e) {
      renderErrors++;
      row(`${c.anim} | RENDER LỖI: ${e.message}`);
    }
  }

  console.log("");
  console.log(`== KẾT: ${transitionCases.length + textCases.length} case, ` +
    `FAIL (LỆCH): ${failCases.length ? failCases.join(", ") : "không có"}; ` +
    `lỗi render: ${renderErrors} ==`);
  console.log(`tmp làm việc: ${TMP} (đã dọn sau khi chạy xong)`);
  cleanupTmp();
  if (renderErrors > 0) process.exit(1);
}

try {
  main();
} catch (e) {
  console.error("HARNESS LỖI:", e.message);
  cleanupTmp();
  process.exit(2);
}
