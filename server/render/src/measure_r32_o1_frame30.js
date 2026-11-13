#!/usr/bin/env node
/**
 * measure_r32_o1_frame30.js — Phase 9 đợt 32, luồng O1.
 *
 * Sửa harness lưới 30fps cũ của M6 (đợt 30): lưới cũ chọn frame
 * n = round((3 + localT) * 30) rồi so model ở p danh nghĩa (localT /
 * localT-0,5) với frame đó — nhưng ở 30fps KHÔNG có frame tại đúng
 * thời gian 3+localT khi localT không phải bội số 1/30 (0,75 ->
 * n=113 -> t=3,7667s -> p thật 0,7667/0,2667, lệch Δp=+0,0167).
 * Lỗi này làm ô FW/FG 0,75 đo 3,33 XẤP XỈ dù trọng số N6 đã đúng ở
 * p=0,75/0,25 trên lưới exact-p.
 *
 * Cách sửa trong harness này (không vặn trọng số, không đổi code
 * sản phẩm): với mỗi ô, báo rõ n, t, p1_thật, p2_thật đã đo, và đánh
 * giá model bằng CHÍNH code sản phẩm ở p_thật đó thay vì p danh
 * nghĩa. Ở 30fps không tồn tại frame tại đúng p danh nghĩa nên
 * "chọn frame theo p exact" chỉ có thể nghĩa là: hoặc đo ở fps cao
 * hơn (lưới exact-p 120fps đã làm ở đợt 31), hoặc đánh giá model ở
 * p thật của frame đã chọn — script này làm vế thứ hai và giữ cột
 * danh nghĩa để đối chiếu.
 *
 * Lưới: phẳng gốc red->green->magenta (5 combo x 3 localT) +
 * footage K->L->J (2 combo x 3 localT), 30fps, model = code sản phẩm
 * hiện tại (describeTransition + compositeFadePixel transpile).
 * Thang V6 như M6/N6. Raw chỉ nằm trong /tmp, xoá sau mỗi phép đo.
 */
"use strict";
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..", "..");
const args = process.argv.slice(2);
const getOpt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const JSON_OUT = getOpt("--json", null);
const FOOTDIR = getOpt("--footdir", path.join(os.homedir(), "workspace", "tmp-round28-l6", "footage"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-o1-r32f30-"));
const FILE_K = path.join(FOOTDIR, "clip-k-dod-iwo.mp4");
const FILE_J = path.join(FOOTDIR, "clip-j-dod-pistol.mp4");
const FILE_L = path.join(FOOTDIR, "clip-l-nasa-avatar-vertical.mp4");

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(" ")} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r;
}
function ffmpeg(a) { return run("ffmpeg", ["-v", "error", ...a]); }
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
  return require(jsFile);
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

function flatFrame(color, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  ffmpeg(["-f", "lavfi", "-i", `color=${color}:s=${W}x${H}:d=1:r=${fps}`,
    "-vf", `scale=${W}:${H},format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function chainedFlatFrame(inType, outType, colA, colB, colC, localT, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  const n = Math.round((3 + localT) * fps);
  ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W}x${H}:d=4:r=${fps}`,
    "-f", "lavfi", "-i", `color=${colB}:s=${W}x${H}:d=1.5:r=${fps}`,
    "-f", "lavfi", "-i", `color=${colC}:s=${W}x${H}:d=4:r=${fps}`,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[2:v]format=rgb24[c];[a][b]xfade=transition=${inType}:duration=1:offset=3[ab];[ab][c]xfade=transition=${outType}:duration=1:offset=3.5,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function normFrame(file, ss, idx, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  ffmpeg(["-ss", String(ss), "-i", file,
    "-vf", `fps=${fps},scale=${W}:${H},format=rgb24,settb=AVTB,select='eq(n,${idx})'`,
    "-vsync", "0", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function chainedFootFrame(inType, outType, localT, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  const n = Math.round((3 + localT) * fps);
  const norm = `fps=${fps},scale=${W}:${H},format=rgb24,settb=AVTB`;
  ffmpeg(["-vsync", "0", "-ss", "28", "-t", "4", "-i", FILE_K,
    "-ss", "24", "-t", "1.5", "-i", FILE_L,
    "-ss", "28", "-t", "4", "-i", FILE_J,
    "-filter_complex", `[0:v]${norm}[a];[1:v]${norm}[b];[2:v]${norm}[c];[a][b]xfade=transition=${inType}:duration=1:offset=3[ab];[ab][c]xfade=transition=${outType}:duration=1:offset=3.5,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}

const tp = transpileTs("apps/web/src/lib/transitionPreview.ts", "o1f30");
const FPS = 30;
const COMBOS = [
  { inType: "fadewhite", outType: "fadewhite" },
  { inType: "fadegrays", outType: "fadewhite" },
  { inType: "fadewhite", outType: "fadegrays" },
  { inType: "fadeblack", outType: "fadeblack" },
  { inType: "fadeblack", outType: "fadewhite" },
];
const LOCALTS = [0.6, 0.75, 0.9];
const rows = [];

function modelProduct(A, B, C, inType, outType, p1, p2, W, H) {
  const npix = W * H;
  const comp = (X, Y, vis) => {
    const out = Buffer.alloc(npix * 3);
    for (let i = 0; i < npix; i++) {
      const o = i * 3;
      const px = tp.compositeFadePixel([X[o], X[o + 1], X[o + 2]], [Y[o], Y[o + 1], Y[o + 2]], vis, "rgb");
      out[o] = Math.round(px[0]); out[o + 1] = Math.round(px[1]); out[o + 2] = Math.round(px[2]);
    }
    return out;
  };
  const first = comp(A, B, tp.describeTransition(inType, p1, W, H));
  return comp(first, C, tp.describeTransition(outType, p2, W, H));
}

console.log("== O1 frame30: phẳng gốc 30fps, model danh nghĩa vs model p-thật ==");
{
  const W = 320, H = 180;
  const A = flatFrame("red", W, H, FPS, tag("f30-A"));
  const B = flatFrame("green", W, H, FPS, tag("f30-B"));
  const C = flatFrame("magenta", W, H, FPS, tag("f30-C"));
  for (const { inType, outType } of COMBOS) {
    for (const localT of LOCALTS) {
      const n = Math.round((3 + localT) * FPS);
      const t = n / FPS;
      const p1True = t - 3, p2True = t - 3.5;
      const chain = chainedFlatFrame(inType, outType, "red", "green", "magenta", localT, W, H, FPS, tag("f30-chain"));
      const gNom = compareFrames(chain, modelProduct(A, B, C, inType, outType, localT, localT - 0.5, W, H));
      const gTrue = compareFrames(chain, modelProduct(A, B, C, inType, outType, p1True, p2True, W, H));
      console.log(`flat | ${inType}/${outType} localT=${localT} n=${n} t=${t.toFixed(4)} pTrue=${p1True.toFixed(4)}/${p2True.toFixed(4)} | danh-nghĩa ${fmt(gNom)} | p-thật ${fmt(gTrue)}`);
      rows.push({ kind: "flat", inType, outType, localT, n, t: +t.toFixed(4), p1True: +p1True.toFixed(4), p2True: +p2True.toFixed(4),
        nominal: { mad: +gNom.mad.toFixed(4), verdict: classify(gNom) },
        trueP: { mad: +gTrue.mad.toFixed(4), verdict: classify(gTrue) } });
    }
  }
}
console.log("== O1 frame30: footage 30fps, model danh nghĩa vs model p-thật ==");
{
  const W = 360, H = 640;
  for (const { inType, outType } of [
    { inType: "fadewhite", outType: "fadewhite" },
    { inType: "fadeblack", outType: "fadewhite" },
  ]) {
    for (const localT of LOCALTS) {
      const n = Math.round((3 + localT) * FPS);
      const t = n / FPS;
      const p1True = t - 3, p2True = t - 3.5;
      const A = normFrame(FILE_K, 28, n, W, H, FPS, tag("f30-fA"));
      const B = normFrame(FILE_L, 24, Math.round(localT * FPS), W, H, FPS, tag("f30-fB"));
      const C = normFrame(FILE_J, 28, Math.round((localT - 0.5) * FPS), W, H, FPS, tag("f30-fC"));
      const chain = chainedFootFrame(inType, outType, localT, W, H, FPS, tag("f30-fchain"));
      const gNom = compareFrames(chain, modelProduct(A, B, C, inType, outType, localT, localT - 0.5, W, H));
      const gTrue = compareFrames(chain, modelProduct(A, B, C, inType, outType, p1True, p2True, W, H));
      console.log(`foot | ${inType}/${outType} localT=${localT} n=${n} t=${t.toFixed(4)} pTrue=${p1True.toFixed(4)}/${p2True.toFixed(4)} | danh-nghĩa ${fmt(gNom)} | p-thật ${fmt(gTrue)}`);
      rows.push({ kind: "footage", inType, outType, localT, n, t: +t.toFixed(4), p1True: +p1True.toFixed(4), p2True: +p2True.toFixed(4),
        nominal: { mad: +gNom.mad.toFixed(4), verdict: classify(gNom) },
        trueP: { mad: +gTrue.mad.toFixed(4), verdict: classify(gTrue) } });
    }
  }
}
if (JSON_OUT) {
  const p = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  writeFileEpermRetry(p, JSON.stringify({ fps: FPS, rows }, null, 2));
  console.log(`JSON: ${p}`);
}
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* kệ */ }
