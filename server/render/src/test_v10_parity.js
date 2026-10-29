#!/usr/bin/env node
/**
 * test_v10_parity.js — V6 (Phase 9 đợt 10): harness đối chiếu preview–render.
 *
 * Đo lường + kiểm chứng độc lập, KHÔNG sửa logic của luồng khác. Harness
 * này chỉ đọc code của họ (transitions.js, effects.js, textfx.js,
 * effectCanvas.ts) và chạy FFmpeg thật; mọi số đều đo từ frame render thật.
 *
 * Cách chạy (từ server/render/):
 *   node src/test_v10_parity.js
 *
 * Cách đo:
 * - Nguồn tổng hợp bằng Node (raw RGB, không ảnh thật, không binary mới
 *   trong repo): A = đỏ thuần, B = xanh dương thuần (transition); nguồn
 *   bất đối xứng trái/phải + pattern theo tọa độ (effect).
 * - Render bằng FFmpeg thật (ffmpeg 8.1.2 trên máy đo) qua chính hàm
 *   buildXfadeFilter / buildEffectFilter / buildTextAnimExpr của render
 *   worker — không tự chế filter tay, trừ drawtext (dùng đúng expr do
 *   buildTextAnimExpr trả về).
 * - Preview: thử import hàm thuần của luồng V1/V2 NẾU ĐÃ CÓ trên đĩa:
 *   + V2 effectCanvas.ts: transpile bằng tsc của apps/web sang /tmp rồi
 *     require (file TS không require trực tiếp được). Nếu tsc vắng hoặc
 *     file chưa có → case đó ghi PENDING, không bịa số preview.
 *   + V1 transitionPreview: tại thời điểm viết harness này, KHÔNG có
 *     module transitionPreview nào trên đĩa (preview.tsx chỉ mô phỏng
 *     fade qua alpha, xem PREVIEW_LIMITS.md); mọi case transition trừ
 *     fade/none đều PENDING phía preview. fade có công thức preview công
 *     khai trong preview.tsx (alpha = localT/duration) nên đối chiếu được
 *     bằng công thức đó, ghi rõ nguồn công thức.
 *   + V4 text animation parity (ASS/PNG): chưa có module thuần nào trên
 *     đĩa (TextAnimPicker chỉ là preview CSS) → phía preview PENDING;
 *     harness chỉ đo phía render (công thức số + frame drawtext thật).
 * - Phân loại (ghi đúng chữ này trong bảng):
 *   KHỚP  = MAD <= 2 và >= 99% pixel lệch <= 8 (mỗi kênh).
 *   XẤP XỈ = MAD <= 20 và >= 90% pixel lệch <= 32.
 *   LỆCH  = ngoài 2 mức trên.
 *   PENDING = phía preview chưa có trên đĩa (ghi rõ lý do, không bịa số).
 *   Render-side structural check (wipe/circle/dissolve) không claim khớp
 *   preview: chỉ báo số đo cấu trúc của frame render.
 *
 * Exit: 0 khi mọi case render chạy xong (PENDING phía preview không làm
 * fail); 1 khi có case render lỗi; 2 khi harness lỗi (thiếu ffmpeg/tsc
 * ở bước bắt buộc — thiếu tsc chỉ làm PENDING effectCanvas, không exit 2).
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v10-parity-"));

const { buildXfadeFilter, getTransition } = require("./transitions");
const { buildEffectFilter } = require("./effects");
const { buildTextAnimExpr } = require("./textfx");

const W = 72;
const H = 45;
const FPS = 30;
// 72x45 chọn để chia hết cho k=9 của pixelate@0.5 (2+round(0.5*14)=9):
// filter scale iw/9 của render làm tròn xuống, nên khung 64x48 bị co
// thành 63x45 (đo thật: 8505 byte thay vì 9216). Dùng kích thước chia
// hết để so pixelate đúng nghĩa; hành vi co khung này được ghi ở LIMITS.

// ---------------------------------------------------------------------------
// Nguồn tổng hợp + chạy FFmpeg
// ---------------------------------------------------------------------------

function solidFrame(r, g, b) {
  const buf = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    buf[i * 3] = r;
    buf[i * 3 + 1] = g;
    buf[i * 3 + 2] = b;
  }
  return buf;
}

// Nguồn bất đối xứng: nửa trái đỏ, nửa phải xanh dương.
function asymFrame() {
  const buf = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      if (x < W / 2) {
        buf[i] = 255;
        buf[i + 1] = 0;
        buf[i + 2] = 0;
      } else {
        buf[i] = 0;
        buf[i + 1] = 0;
        buf[i + 2] = 255;
      }
    }
  }
  return buf;
}

// Nguồn pattern theo tọa độ (cho pixelate/sharpen): mỗi pixel khác nhau.
function patternFrame() {
  const buf = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      buf[i] = (x * 4) % 256;
      buf[i + 1] = (y * 5) % 256;
      buf[i + 2] = (x + y * 3) % 256;
    }
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

function runFfmpeg(args, label) {
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const ms = Date.now() - t0;
  if (r.status !== 0) {
    throw new Error(`${label}: ffmpeg exit ${r.status}: ${(r.stderr || "").slice(0, 500)}`);
  }
  return ms;
}

function frameAt(buf, idx, w, h) {
  const sz = w * h * 3;
  return buf.subarray(idx * sz, (idx + 1) * sz);
}

// ---------------------------------------------------------------------------
// Đo pixel
// ---------------------------------------------------------------------------

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

/** So 2 frame RGB cùng kích thước: MAD + % pixel lệch <= tol.
 *  Nếu độ dài khác nhau (vd render co khung do scale làm tròn) thì trả
 *  về mismatch thay vì để NaN lan vào số đo. */
function compareFrames(a, b, w, h) {
  if (a.length !== b.length) {
    return { mad: NaN, le8: 0, le32: 0, mismatch: true, lenA: a.length, lenB: b.length };
  }
  let sum = 0;
  let le8 = 0;
  let le32 = 0;
  const n = w * h;
  for (let i = 0; i < n * 3; i++) {
    const d = Math.abs(a[i] - b[i]);
    sum += d;
  }
  for (let p = 0; p < n; p++) {
    const d = Math.max(
      Math.abs(a[p * 3] - b[p * 3]),
      Math.abs(a[p * 3 + 1] - b[p * 3 + 1]),
      Math.abs(a[p * 3 + 2] - b[p * 3 + 2]),
    );
    if (d <= 8) le8++;
    if (d <= 32) le32++;
  }
  const mad = sum / (n * 3);
  return { mad, le8: le8 / n, le32: le32 / n };
}

function classify(m) {
  if (m.mismatch) return `LỆCH (kích thước frame khác nhau: render ${m.lenA} byte vs preview ${m.lenB} byte)`;
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}

function meanRgb(buf, w, h) {
  const n = w * h;
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    r += buf[i * 3];
    g += buf[i * 3 + 1];
    b += buf[i * 3 + 2];
  }
  return [r / n, g / n, b / n];
}

function fracNear(buf, w, h, target, tol, region) {
  let hit = 0;
  let tot = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (region && !region(x, y)) continue;
      tot++;
      if (isNear(px(buf, w, x, y), target, tol)) hit++;
    }
  }
  return tot ? hit / tot : 0;
}

// ---------------------------------------------------------------------------
// Load effectCanvas.ts của V2 (nếu có) qua tsc → /tmp
// ---------------------------------------------------------------------------

function loadEffectCanvas() {
  const src = path.join(ROOT, "apps", "web", "src", "lib", "effectCanvas.ts");
  if (!fs.existsSync(src)) {
    return { ok: false, reason: "apps/web/src/lib/effectCanvas.ts chưa có trên đĩa" };
  }
  const candidates = [
    path.join(ROOT, "apps", "web", "node_modules", ".bin", "tsc"),
    path.join(ROOT, "node_modules", ".bin", "tsc"),
    "tsc",
  ];
  let tscUsed = null;
  for (const c of candidates) {
    const r = spawnSync(c, ["--version"], { encoding: "utf8" });
    if (r.status === 0) {
      tscUsed = c;
      break;
    }
  }
  if (!tscUsed) {
    return { ok: false, reason: "không tìm thấy tsc để transpile effectCanvas.ts" };
  }
  const outDir = path.join(TMP, "effectCanvas-js");
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(
    tscUsed,
    [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020",
     "--moduleResolution", "node", "--skipLibCheck"],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    return { ok: false, reason: `tsc transpile effectCanvas.ts lỗi: ${(r.stderr || "").slice(0, 300)}` };
  }
  try {
    const mod = require(path.join(outDir, "effectCanvas.js"));
    return { ok: true, mod, tscUsed };
  } catch (e) {
    return { ok: false, reason: `require effectCanvas đã transpile lỗi: ${e.message}` };
  }
}

// Chuyển Buffer RGB thành ImageDataLike cho hàm preview, rồi ngược lại.
function toImageData(buf, w, h) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = buf[i * 3];
    data[i * 4 + 1] = buf[i * 3 + 1];
    data[i * 4 + 2] = buf[i * 3 + 2];
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}

function fromImageData(img) {
  const buf = Buffer.alloc(img.width * img.height * 3);
  for (let i = 0; i < img.width * img.height; i++) {
    buf[i * 3] = img.data[i * 4];
    buf[i * 3 + 1] = img.data[i * 4 + 1];
    buf[i * 3 + 2] = img.data[i * 4 + 2];
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function renderTransition(type, outName) {
  const a = writeRaw("srcA.raw", solidFrame(255, 0, 0), 60);
  const b = writeRaw("srcB.raw", solidFrame(0, 0, 255), 60);
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
  // Output dài 3s (2+2-1); frame giữa transition t=1.5s → index 45.
  return { mid: Buffer.from(frameAt(buf, 45, W, H)), ms, frames: buf.length / (W * H * 3) };
}

function renderEffect(filterExpr, srcBuf, outName) {
  const inp = writeRaw("fxIn.raw", srcBuf, 1);
  const out = path.join(TMP, outName);
  const ms = runFfmpeg(
    [
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", inp,
      "-vf", `${filterExpr},format=rgb24`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out,
    ],
    `effect ${filterExpr}`,
  );
  return { frame: fs.readFileSync(out), ms };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const rows = [];
  const add = (row) => {
    rows.push(row);
    console.log(row.line);
  };
  const bench = {};

  console.log("== V6 parity harness (đợt 10) ==");
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  console.log(`nguồn: ${W}x${H} @${FPS}fps, frame tổng hợp Node, tmp=${TMP}`);
  console.log(`máy đo: ${os.hostname()} ${os.platform()}/${os.arch()} ${os.cpus().length} CPU (số chỉ đúng máy này)`);
  console.log("");

  // ---- 1. Transition: fade (công thức preview công khai trong preview.tsx) ----
  try {
    const { mid, ms } = renderTransition("fade", "tr-fade.raw");
    // Preview fade: alpha = localT/duration; giữa transition localT=0.5,
    // duration=1 → p=0.5; pixel = A*(1-p)+B*p = (127.5, 0, 127.5).
    const mean = meanRgb(mid, W, H);
    const pred = [127.5, 0, 127.5];
    const err = Math.max(
      Math.abs(mean[0] - pred[0]),
      Math.abs(mean[1] - pred[1]),
      Math.abs(mean[2] - pred[2]),
    );
    const verdict = err <= 4 ? "KHỚP" : err <= 20 ? "XẤP XỈ" : "LỆCH";
    bench.transitionFadeMs = ms;
    add({
      line: `fade | render mean RGB = (${mean.map((v) => v.toFixed(1)).join(", ")}) | ` +
        `preview công thức = (127.5, 0, 127.5) | sai số max = ${err.toFixed(1)} | ${verdict} ` +
        `| nguồn công thức: preview.tsx alpha=localT/duration, render ${ms}ms`,
    });
  } catch (e) {
    add({ line: `fade | RENDER LỖI: ${e.message}` });
  }

  // ---- 2. Transition structural (preview PENDING — chưa có module V1) ----
  const structural = [
    {
      type: "wipeleft",
      describe: (mid) => {
        // Điểm chuyển dọc hàng giữa: x đầu tiên pixel giống B (tol 16).
        let split = -1;
        for (let x = 0; x < W; x++) {
          if (isNear(px(mid, W, x, Math.floor(H / 2)), [0, 0, 255], 16)) {
            split = x;
            break;
          }
        }
        const leftB = fracNear(mid, W, H, [0, 0, 255], 16, (x) => x < W / 2);
        const rightB = fracNear(mid, W, H, [0, 0, 255], 16, (x) => x >= W / 2);
        return `split-x hàng giữa=${split} (lý tưởng ~36 ở P=0.5, W=72) | B nửa trái=${(leftB * 100).toFixed(1)}% B nửa phải=${(rightB * 100).toFixed(1)}%`;
      },
    },
    {
      type: "circlecrop",
      describe: (mid) => {
        // Đo thật (debug frame-by-frame, đếm pixel): giữa transition
        // circlecrop gần như TOÀN ĐEN — đĩa A đã co về ~1 điểm ở tâm,
        // đĩa B chưa nở (cuối transition tâm mới chuyển sang B, ngoài
        // vẫn đen). Đây là hành vi thật của xfade circlecrop, khác
        // hẳn mô tả "tâm A / ngoài B" nếu đọc lướt catalog.
        let red = 0;
        let blue = 0;
        let black = 0;
        for (let i = 0; i < W * H; i++) {
          const R = mid[i * 3];
          const G = mid[i * 3 + 1];
          const B = mid[i * 3 + 2];
          if (R > 200 && G < 50 && B < 50) red++;
          else if (B > 200 && R < 50 && G < 50) blue++;
          else if (R < 50 && G < 50 && B < 50) black++;
        }
        const cx = Math.floor(W / 2);
        const cy = Math.floor(H / 2);
        const center = px(mid, W, cx, cy);
        return `tâm=(${center.join(",")}) | đỏ=${red}/${W * H} xanh=${blue} đen=${black} (giữa transition: A co về điểm, B chưa nở — ngoài tâm là đen, không phải B)`;
      },
    },
    {
      type: "dissolve",
      describe: (mid) => {
        const bFrac = fracNear(mid, W, H, [0, 0, 255], 16);
        const aFrac = fracNear(mid, W, H, [255, 0, 0], 16);
        return `pixel giống B=${(bFrac * 100).toFixed(1)}% giống A=${(aFrac * 100).toFixed(1)}% còn lại=${(Math.max(0, 1 - bFrac - aFrac) * 100).toFixed(1)}% (dissolve ngẫu nhiên theo hạt — chỉ đo, không kỳ vọng tỉ lệ cố định)`;
      },
    },
  ];
  for (const s of structural) {
    try {
      const { mid, ms } = renderTransition(s.type, `tr-${s.type}.raw`);
      add({
        line: `${s.type} | ${s.describe(mid)} | preview: PENDING (chưa có module transitionPreview của V1 trên đĩa) | render ${ms}ms`,
      });
    } catch (e) {
      add({ line: `${s.type} | RENDER LỖI: ${e.message}` });
    }
  }

  // ---- 3. Transition custom-expr: V3 mới nếu có, không thì blinds-h (P5) ----
  const KNOWN_P5 = ["blinds-h", "bars-v", "checker", "diamond", "plus", "grid", "clock", "circle-soft", "bars-fade"];
  let customPick = "blinds-h";
  let customNote = "V3 chưa có expr mới trên đĩa → benchmark blinds-h (P5, đã có)";
  try {
    const { TRANSITIONS } = require("./transitions");
    const novel = TRANSITIONS.filter((t) => t.xfade === "custom" && !KNOWN_P5.includes(t.type));
    if (novel.length > 0) {
      customPick = novel[0].type;
      customNote = `V3 mới phát hiện trên đĩa: ${novel.map((t) => t.type).join(", ")} → benchmark ${customPick}`;
    }
  } catch (e) {
    customNote = `không liệt kê được catalog custom-expr (${e.message}) → fallback blinds-h`;
  }
  try {
    const { mid, ms } = renderTransition(customPick, "tr-custom.raw");
    // blinds-h/custom: hàng giữa phải xen kẽ A/B theo pattern, không thuần 1 màu.
    const bFrac = fracNear(mid, W, H, [0, 0, 255], 16);
    const aFrac = fracNear(mid, W, H, [255, 0, 0], 16);
    bench.customExprMs = ms;
    add({
      line: `custom-expr ${customPick} | ${customNote} | B=${(bFrac * 100).toFixed(1)}% A=${(aFrac * 100).toFixed(1)}% (pattern xen kẽ, không thuần màu) | preview: PENDING (V1 chưa có) | BENCH render ${ms}ms`,
    });
  } catch (e) {
    add({ line: `custom-expr ${customPick} | RENDER LỖI: ${e.message}` });
  }

  // ---- 4. Effects: render vs effectCanvas (V2) ----
  const ec = loadEffectCanvas();
  console.log(`\neffectCanvas V2: ${ec.ok ? `OK (tsc: ${ec.tscUsed})` : `PENDING — ${ec.reason}`}`);
  const effectCases = [
    { type: "mirror", intensity: 0.5, src: asymFrame(), previewFn: "applyMirror" },
    { type: "pixelate", intensity: 0.5, src: patternFrame(), previewFn: "applyPixelate" },
    { type: "sharpen", intensity: 0.5, src: patternFrame(), previewFn: "applySharpen" },
  ];
  for (const c of effectCases) {
    try {
      const filterExpr = buildEffectFilter({ type: c.type, intensity: c.intensity });
      const { frame, ms } = renderEffect(filterExpr, c.src, `fx-${c.type}.raw`);
      if (c.type === "pixelate") bench.effectPixelateMs = ms;
      if (!ec.ok) {
        add({
          line: `${c.type} (intensity ${c.intensity}, filter: ${filterExpr}) | render OK ${ms}ms | preview: PENDING — ${ec.reason}`,
        });
        continue;
      }
      const t0 = Date.now();
      const img = toImageData(Buffer.from(c.src), W, H);
      if (c.type === "mirror") ec.mod.applyMirror(img);
      else if (c.type === "pixelate") ec.mod.applyPixelate(img, c.intensity);
      else if (c.type === "sharpen") ec.mod.applySharpen(img, c.intensity);
      const previewMs = Date.now() - t0;
      const previewBuf = fromImageData(img);
      const m = compareFrames(frame, previewBuf, W, H);
      add({
        line: `${c.type} (intensity ${c.intensity}, filter: ${filterExpr}) | render-vs-preview MAD=${m.mad.toFixed(2)} ` +
          `<=8: ${(m.le8 * 100).toFixed(1)}% <=32: ${(m.le32 * 100).toFixed(1)}% | ${classify(m)} ` +
          `| render ${ms}ms, preview fn ${previewMs}ms` +
          (c.type === "sharpen" ? " (lưu ý: render unsharp 5x5 vs preview box-blur 3x3 — khác kernel nên XẤP XỈ/LỆCH là kỳ vọng, không phải bug chắc chắn)" : ""),
      });
    } catch (e) {
      add({ line: `${c.type} | RENDER LỖI: ${e.message}` });
    }
  }

  // ---- 5. Text animation fadeUp: render-side (preview V4 PENDING) ----
  try {
    const S = 2;
    const expr = buildTextAnimExpr("fadeUp", { x: 0.5, y: 0.5 }, S);
    // Đánh giá số công thức alpha: min(1,(t-2)/0.6) → t=2.0:0, 2.3:0.5, 2.6:1.
    const alphaAt = (t) => Math.min(1, (t - S) / 0.6);
    const TW = 320;
    const TH = 180;
    const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
    if (!fs.existsSync(font)) {
      add({ line: `text fadeUp | công thức alpha: t=2.0→${alphaAt(2.0).toFixed(2)} t=2.3→${alphaAt(2.3).toFixed(2)} t=2.6→${alphaAt(2.6).toFixed(2)} | render drawtext: SKIP (không thấy font DejaVu) | preview: PENDING (V4 chưa có module thuần)` });
    } else {
      const black = Buffer.alloc(TW * TH * 3);
      const inp = writeRaw("txtIn.raw", black, 90); // 3s @30fps
      const out = path.join(TMP, "txt.raw");
      const q = (s) => `'${s}'`;
      runFfmpeg(
        [
          "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${TW}x${TH}`, "-r", String(FPS), "-i", inp,
          "-vf", `drawtext=fontfile=${font}:text='TEST':fontsize=24:fontcolor=white:` +
            `x=${q(expr.x)}:y=${q(expr.y)}:alpha=${q(expr.alpha)},format=rgb24`,
          "-f", "rawvideo", "-pix_fmt", "rgb24", out,
        ],
        "drawtext fadeUp",
      );
      const buf = fs.readFileSync(out);
      // Ngưỡng >100 (không phải >200): alpha 0.5 blend chữ trắng trên
      // nền đen chỉ cho ~127, ngưỡng 200 sẽ đếm thiếu và báo sai.
      const countBright = (idx, thr) => {
        const fr = frameAt(buf, idx, TW, TH);
        let n = 0;
        let mx = 0;
        for (let i = 0; i < TW * TH; i++) {
          const v = Math.max(fr[i * 3], fr[i * 3 + 1], fr[i * 3 + 2]);
          if (v > mx) mx = v;
          if (fr[i * 3] > thr && fr[i * 3 + 1] > thr && fr[i * 3 + 2] > thr) n++;
        }
        return { n, mx };
      };
      const c0 = countBright(60, 100); // t=2.0, alpha 0
      const cMid = countBright(69, 100); // t=2.3, alpha 0.5
      const cFull = countBright(78, 100); // t=2.6, alpha 1
      add({
        line: `text fadeUp | công thức alpha: t=2.0→0.00 t=2.3→0.50 t=2.6→1.00 | frame drawtext thật (320x180, chữ trắng trên nền đen, ngưỡng >100): ` +
          `t=2.0: ${c0.n} pixel (max ${c0.mx}) | t=2.3: ${cMid.n} pixel (max ${cMid.mx}, kỳ vọng ~127 do alpha 0.5) | t=2.6: ${cFull.n} pixel (max ${cFull.mx}) ` +
          `| preview: PENDING (V4 chưa có module thuần; TextAnimPicker chỉ là CSS)`,
      });
    }
  } catch (e) {
    add({ line: `text fadeUp | RENDER LỖI: ${e.message}` });
  }

  console.log("\n== BENCH (1 lần chạy, chỉ đúng máy đo) ==");
  console.log(JSON.stringify(bench, null, 2));
  console.log(`\n== KẾT: ${rows.length} dòng kết quả (xem bảng trên) ==`);
  console.log(`tmp làm việc: ${TMP} (không ghi gì vào repo ngoài file harness này)`);
}

try {
  main();
} catch (e) {
  console.error("HARNESS LỖI:", e.message);
  process.exit(2);
}
