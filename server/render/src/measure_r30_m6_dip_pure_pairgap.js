#!/usr/bin/env node
/**
 * measure_r30_m6_dip_pure_pairgap.js — Phase 9 đợt 30, luồng M6.
 *
 * Hai phép đo, KHÔNG sửa code sản phẩm:
 *
 * (1) --pure: thời gian THUẦN vòng lặp dip của preview (tách khỏi
 *     seek/decode/rAF/getImageData/putImageData/drawImage). Vòng lặp
 *     sao đúng hình dạng drawVideoClipWithDip (preview.tsx): duyệt
 *     từng pixel, bỏ qua alpha=0, gọi CHÍNH singleClipDipPixel của
 *     transitionPreview.ts (transpile bằng tsc như script L6 đợt 29,
 *     không cài lại công thức). So sánh với longtask cận trên đợt 29
 *     (1080p 260–450ms, 4K 712–1176ms — gồm seek/decode/rAF).
 *     Biến thể inline chỉ là chẩn đoán headroom tối ưu, không phải
 *     code sản phẩm, không đề xuất đổi code trong luồng này.
 *
 * (2) --pairgap: mô hình cặp ứng cử cho gap clip ngắn (A) đợt 29 L6.
 *     Chuỗi render tham chiếu = xfade kép FFmpeg (rgb, như L6 --short:
 *     A 4s -> B 1.5s -> C 4s, xfade 1s, offset 3 / 3.5). Các mô hình
 *     đều dùng CHÍNH code sản phẩm (transitionClipVisual,
 *     singleClipDipPixel, describeTransition, compositeFadePixel):
 *       current = mô hình đơn clip hiện tại (alpha tích, dip theo
 *         cửa sổ vào — shortModel của L6).
 *       M1 = composite cặp B+C theo cửa sổ RA (xfade thứ hai) —
 *         bỏ qua xfade thứ nhất (coi phía A của xfade2 ≈ B).
 *       M2 = composite đủ 3 clip: xfade1(A,B) rồi xfade2(kết quả,C).
 *     M2 phải ≈ 0 trên phẳng rgb nếu cách dựng đúng (kiểm chứng nội
 *     bộ); M1 đạt KHỚP hay không mới quyết định "sửa nửa" có đáng
 *     hay không. Thang V6: KHỚP = MAD ≤ 2 VÀ ≥ 99% ≤ 8;
 *     XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8; còn lại LỆCH.
 *
 * Cách chạy (từ gốc repo):
 *   node server/render/src/measure_r30_m6_dip_pure_pairgap.js --pure [--json OUT]
 *   node server/render/src/measure_r30_m6_dip_pure_pairgap.js --pairgap [--json OUT]
 * Raw XOÁ ngay sau mỗi phép đo. Footage + frame trung gian KHÔNG nằm
 * trong repo (footdir mặc định là footage đợt 28 đã verify SHA).
 */
"use strict";
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync, performance } = require("child_process");
const { performance: perf } = require("perf_hooks");

const ROOT = path.join(__dirname, "..", "..", "..");
const args = process.argv.slice(2);
const getOpt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const MODE_PURE = args.includes("--pure");
const MODE_PAIR = args.includes("--pairgap");
if (!MODE_PURE && !MODE_PAIR) throw new Error("Chọn ít nhất một chế độ: --pure | --pairgap");
const JSON_OUT = getOpt("--json", null);
const FOOTDIR = getOpt("--footdir", path.join(os.homedir(), "workspace", "tmp-round28-l6", "footage"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-m6-r30-"));
fs.mkdirSync(TMP, { recursive: true });
const FILE_K = path.join(FOOTDIR, "clip-k-dod-iwo.mp4");
const FILE_J = path.join(FOOTDIR, "clip-j-dod-pistol.mp4");
const FILE_L = path.join(FOOTDIR, "clip-l-nasa-avatar-vertical.mp4");

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(" ")} exit ${r.status}: ${(r.stderr || "").slice(0, 500)}`);
  return r;
}
function ffmpeg(cmdArgs) { return run("ffmpeg", ["-v", "error", ...cmdArgs]); }
function rm(f) { try { fs.unlinkSync(f); } catch { /* bỏ qua */ } }
let tagSeq = 0;
function tag(p) { return `${p}-${tagSeq++}`; }

function transpileTs(srcRel, outName) {
  const src = path.join(ROOT, srcRel);
  const outDir = path.join(TMP, `ts-${outName}`);
  fs.mkdirSync(outDir, { recursive: true });
  const stubDir = path.join(TMP, "node_modules", "@repo-1", "video-spec");
  fs.mkdirSync(stubDir, { recursive: true });
  writeFileEpermRetry(path.join(stubDir, "package.json"), JSON.stringify({ name: "@repo-1/video-spec", version: "0.0.0", main: "index.js" }));
  writeFileEpermRetry(path.join(stubDir, "index.js"), "module.exports = { CHROMA_DEFAULTS:{}, EFFECT_TYPES:[], LUT_IDS:[], STICKER_DEFAULTS:{}, interpolateKeyframes:()=>null, sourceTimeAt:()=>0, speedAt:()=>1 };\n");
  const tsc = path.join(ROOT, "node_modules", ".bin", "tsc");
  const r = spawnSync(tsc, [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`tsc thất bại: ${(r.stdout || "") + (r.stderr || "")}`.slice(0, 500));
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}`);
  // require từ TMP: module.paths của file con không thấy stub ở TMP/node_modules
  // nên đặt NODE_PATH trỏ tới TMP/node_modules qua require trực tiếp bằng đường dẫn.
  const mod = require(jsFile);
  return mod;
}

function classify(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le8 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}
function compareFrames(a, b) {
  let sum = 0, le8 = 0, maxD = 0;
  const n = a.length;
  for (let k = 0; k < n; k++) {
    const d = Math.abs(a[k] - b[k]);
    sum += d; if (d <= 8) le8++; if (d > maxD) maxD = d;
  }
  return { mad: sum / n, le8: le8 / n, maxDiff: maxD };
}
function fmt(m) { return `MAD=${m.mad.toFixed(4)} le8=${(m.le8 * 100).toFixed(2)}% max=${m.maxDiff} ${classify(m)}`; }
function stats(times) {
  const s = [...times].sort((a, b) => a - b);
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  return { n: s.length, min: +s[0].toFixed(2), median: +s[Math.floor(s.length / 2)].toFixed(2), max: +s[s.length - 1].toFixed(2), mean: +mean.toFixed(2) };
}

/* ---------------- (1) --pure ---------------- */
function runPure(tp) {
  console.log("== M6 --pure: thời gian thuần vòng lặp dip (hàm sản phẩm thật) ==");
  const sizes = [
    { name: "720p", W: 720, H: 1280 },
    { name: "1080p", W: 1080, H: 1920 },
    { name: "4K", W: 2160, H: 3840 },
  ];
  const modes = ["white", "gray"];
  const rows = [];
  for (const { name, W, H } of sizes) {
    const npix = W * H;
    const base = new Uint8ClampedArray(npix * 4);
    for (let i = 0; i < npix; i++) {
      const o = i * 4;
      base[o] = (i * 37 + 11) % 256;
      base[o + 1] = (i * 91 + 53) % 256;
      base[o + 2] = (i * 53 + 97) % 256;
      base[o + 3] = (i % 10 === 0) ? 0 : 255; // 10% pixel alpha=0 -> nhánh skip
    }
    for (const mode of modes) {
      const alpha = 0.5; // p=0.5: alpha nhạy, không rơi vào nhánh fallback alpha>=1
      // Vòng lặp đúng hình dạng preview.tsx drawVideoClipWithDip.
      const loopProduct = (data) => {
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;
          const [r, g, b] = tp.singleClipDipPixel([data[i], data[i + 1], data[i + 2]], alpha, mode);
          data[i] = Math.round(r); data[i + 1] = Math.round(g); data[i + 2] = Math.round(b);
        }
      };
      // Chẩn đoán inline (cùng công thức, không gọi hàm, không cấp phát mảng).
      const loopInline = (data) => {
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;
          const dip = mode === "white" ? 255 : (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = Math.round(alpha * data[i] + (1 - alpha) * dip);
          data[i + 1] = Math.round(alpha * data[i + 1] + (1 - alpha) * dip);
          data[i + 2] = Math.round(alpha * data[i + 2] + (1 - alpha) * dip);
        }
      };
      // Kiểm tra tương đương: product vs inline phải giống từng mức (trừ làm tròn).
      const d1 = Uint8ClampedArray.from(base); loopProduct(d1);
      const d2 = Uint8ClampedArray.from(base); loopInline(d2);
      const eq = compareFrames(Buffer.from(d1.buffer), Buffer.from(d2.buffer));
      for (let w = 0; w < 3; w++) { loopProduct(Uint8ClampedArray.from(base)); loopInline(Uint8ClampedArray.from(base)); }
      const timesP = [], timesI = [];
      for (let r = 0; r < 21; r++) {
        const d = Uint8ClampedArray.from(base);
        const t0 = perf.now(); loopProduct(d); timesP.push(perf.now() - t0);
      }
      for (let r = 0; r < 21; r++) {
        const d = Uint8ClampedArray.from(base);
        const t0 = perf.now(); loopInline(d); timesI.push(perf.now() - t0);
      }
      const sp = stats(timesP), si = stats(timesI);
      console.log(`pure | ${name} ${W}x${H} (${npix} px) mode=${mode} alpha=0.5 | product(médian) ${sp.median}ms [${sp.min}..${sp.max}] mean ${sp.mean} | inline ${si.median}ms | product-vs-inline MAD=${eq.mad.toFixed(4)} | ${(sp.median / (npix / 1e6)).toFixed(1)} ms/Mpx`);
      rows.push({ size: name, W, H, npix, mode, alpha, productMs: sp, inlineMs: si, productVsInlineMad: +eq.mad.toFixed(4), msPerMpx: +(sp.median / (npix / 1e6)).toFixed(2) });
    }
  }
  return { mode: "pure", node: process.version, rows };
}

/* ---------------- (2) --pairgap ---------------- */
function flatFrame(color, W, H, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  ffmpeg(["-f", "lavfi", "-i", `color=${color}:s=${W}x${H}:d=1:r=30`,
    "-vf", `scale=${W}:${H},format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function chainedFlatFrame(typeIn, typeOut, colA, colB, colC, localT, W, H, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  const n = Math.round((3 + localT) * 30);
  ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W}x${H}:d=4:r=30`,
    "-f", "lavfi", "-i", `color=${colB}:s=${W}x${H}:d=1.5:r=30`,
    "-f", "lavfi", "-i", `color=${colC}:s=${W}x${H}:d=4:r=30`,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[2:v]format=rgb24[c];[a][b]xfade=transition=${typeIn}:duration=1:offset=3[ab];[ab][c]xfade=transition=${typeOut}:duration=1:offset=3.5,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
// Frame thứ idx (sau norm fps=30/scale/rgb) của nguồn bắt đầu ở ss giây.
function normFrame(file, ss, idx, W, H, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  ffmpeg(["-ss", String(ss), "-i", file,
    "-vf", `fps=30,scale=${W}:${H},format=rgb24,settb=AVTB,select='eq(n,${idx})'`,
    "-vsync", "0", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function chainedFootFrame(typeIn, typeOut, localT, W, H, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  const n = Math.round((3 + localT) * 30);
  const norm = `fps=30,scale=${W}:${H},format=rgb24,settb=AVTB`;
  ffmpeg(["-vsync", "0", "-ss", "28", "-t", "4", "-i", FILE_K,
    "-ss", "24", "-t", "1.5", "-i", FILE_L,
    "-ss", "28", "-t", "4", "-i", FILE_J,
    "-filter_complex", `[0:v]${norm}[a];[1:v]${norm}[b];[2:v]${norm}[c];[a][b]xfade=transition=${typeIn}:duration=1:offset=3[ab];[ab][c]xfade=transition=${typeOut}:duration=1:offset=3.5,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function modelFrame(tp, kind, A, B, C, inType, outType, localT, W, H) {
  const npix = W * H;
  const tv = tp.transitionClipVisual(
    { duration: 1.5, transitionIn: { type: inType, duration: 1 }, transitionOut: { type: outType, duration: 1 } },
    localT, W, H);
  if (tv.window !== "in") throw new Error(`modelFrame: window=${tv.window} ở localT=${localT}`);
  const alpha = tv.alpha, mode = tv.dipMode;
  const current = Buffer.alloc(npix * 3);
  for (let i = 0; i < npix; i++) {
    const o = i * 3;
    if (mode === "white" || mode === "gray") {
      const out = tp.singleClipDipPixel([B[o], B[o + 1], B[o + 2]], alpha, mode);
      current[o] = Math.round(out[0]); current[o + 1] = Math.round(out[1]); current[o + 2] = Math.round(out[2]);
    } else {
      current[o] = Math.round(alpha * B[o]); current[o + 1] = Math.round(alpha * B[o + 1]); current[o + 2] = Math.round(alpha * B[o + 2]);
    }
  }
  const p1 = localT, p2 = localT - 0.5;
  const vis1 = tp.describeTransition(inType, p1, W, H);
  const vis2 = tp.describeTransition(outType, p2, W, H);
  const comp = (X, Y, vis) => {
    const out = Buffer.alloc(npix * 3);
    for (let i = 0; i < npix; i++) {
      const o = i * 3;
      const px = tp.compositeFadePixel([X[o], X[o + 1], X[o + 2]], [Y[o], Y[o + 1], Y[o + 2]], vis, "rgb");
      out[o] = Math.round(px[0]); out[o + 1] = Math.round(px[1]); out[o + 2] = Math.round(px[2]);
    }
    return out;
  };
  const m1 = comp(B, C, vis2);
  const first = comp(A, B, vis1);
  const m2 = comp(first, C, vis2);
  return { current, m1, m2, alpha, dipMode: mode ?? null, p1, p2 };
}
function runPair(tp) {
  console.log("== M6 --pairgap: current vs M1 (cặp B+C theo cửa sổ ra) vs M2 (đủ 3 clip) so với chuỗi xfade kép ==");
  const rows = [];
  const localTs = [0.6, 0.75, 0.9];
  const combos = [
    { inType: "fadewhite", outType: "fadewhite" },
    { inType: "fadegrays", outType: "fadewhite" },
    { inType: "fadewhite", outType: "fadegrays" },
    { inType: "fadeblack", outType: "fadeblack" },
    { inType: "fadeblack", outType: "fadewhite" },
  ];
  // Phẳng 320x180 (màu đồng nhất nên MAD không phụ thuộc kích thước).
  {
    const W = 320, H = 180;
    const A = flatFrame("red", W, H, tag("m6-flat-A"));
    const B = flatFrame("green", W, H, tag("m6-flat-B"));
    const C = flatFrame("magenta", W, H, tag("m6-flat-C"));
    for (const { inType, outType } of combos) {
      for (const localT of localTs) {
        const { current, m1, m2, alpha, dipMode } = modelFrame(tp, "flat", A, B, C, inType, outType, localT, W, H);
        const chain = chainedFlatFrame(inType, outType, "red", "green", "magenta", localT, W, H, tag("m6-flat-chain"));
        const g0 = compareFrames(chain, current), g1 = compareFrames(chain, m1), g2 = compareFrames(chain, m2);
        console.log(`flat | ${inType}/${outType} localT=${localT} alpha=${alpha.toFixed(4)} dip=${dipMode} | current ${fmt(g0)} | M1 ${fmt(g1)} | M2 ${fmt(g2)}`);
        rows.push({ kind: "flat", W, H, inType, outType, localT, p1: localT, p2: localT - 0.5, alpha: +alpha.toFixed(6), dipMode,
          current: { mad: +g0.mad.toFixed(4), le8: +g0.le8.toFixed(4), verdict: classify(g0) },
          m1: { mad: +g1.mad.toFixed(4), le8: +g1.le8.toFixed(4), verdict: classify(g1) },
          m2: { mad: +g2.mad.toFixed(4), le8: +g2.le8.toFixed(4), verdict: classify(g2) } });
      }
    }
  }
  // Footage K->L->J ở 360x640 (như L6 nhưng nhỏ hơn để chạy nhanh; chỉ 2 combo:
  // FW/FW tốt nhất của L6 và FB/FW tệ nhất của L6).
  {
    const W = 360, H = 640;
    for (const { inType, outType } of [
      { inType: "fadewhite", outType: "fadewhite" },
      { inType: "fadeblack", outType: "fadewhite" },
    ]) {
      for (const localT of localTs) {
        const n = Math.round((3 + localT) * 30);
        const A = normFrame(FILE_K, 28, n, W, H, tag("m6-foot-A"));
        const B = normFrame(FILE_L, 24, Math.round(localT * 30), W, H, tag("m6-foot-B"));
        const C = normFrame(FILE_J, 28, Math.round((localT - 0.5) * 30), W, H, tag("m6-foot-C"));
        const { current, m1, m2, alpha, dipMode } = modelFrame(tp, "footage", A, B, C, inType, outType, localT, W, H);
        const chain = chainedFootFrame(inType, outType, localT, W, H, tag("m6-foot-chain"));
        const g0 = compareFrames(chain, current), g1 = compareFrames(chain, m1), g2 = compareFrames(chain, m2);
        console.log(`foot | K->L->J ${inType}/${outType} localT=${localT} alpha=${alpha.toFixed(4)} dip=${dipMode} | current ${fmt(g0)} | M1 ${fmt(g1)} | M2 ${fmt(g2)}`);
        rows.push({ kind: "footage", W, H, inType, outType, localT, p1: localT, p2: localT - 0.5, alpha: +alpha.toFixed(6), dipMode,
          current: { mad: +g0.mad.toFixed(4), le8: +g0.le8.toFixed(4), verdict: classify(g0) },
          m1: { mad: +g1.mad.toFixed(4), le8: +g1.le8.toFixed(4), verdict: classify(g1) },
          m2: { mad: +g2.mad.toFixed(4), le8: +g2.le8.toFixed(4), verdict: classify(g2) } });
      }
    }
  }
  return { mode: "pairgap", chain: "xfade kép FFmpeg 8.1.2, đường rgb (format=rgb24), A=red/K@28s, B=green/L@24s, C=magenta/J@28s", rows };
}

const tp = transpileTs("apps/web/src/lib/transitionPreview.ts", "m6");
const out = {};
if (MODE_PURE) out.pure = runPure(tp);
if (MODE_PAIR) out.pairgap = runPair(tp);
if (JSON_OUT) {
  const p = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  writeFileEpermRetry(p, JSON.stringify(out, null, 2));
  console.log(`JSON: ${p}`);
}
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* kệ */ }
