#!/usr/bin/env node
/**
 * measure_r32_p1_third_colors.js — Phase 9 đợt 32, luồng P1 (thực chất
 * đợt 33 theo chuyển hướng của parent).
 *
 * Đóng một phần nợ phạm vi của O1 (docs/PHASE9_ROUND32_O1_DIP_STRICT_LIMITS.md
 * §6: "chưa đo trên cặp màu thứ ba"): lưới cặp phẳng exact-p 120fps
 * với cặp màu thứ ba CHƯA từng dùng để fit hay chọn nút —
 * cyan (0,255,255) -> magenta (255,0,255) -> yellow (255,255,0),
 * 5 combo x 3 localT = 15 ô, đánh giá bằng CHÍNH code sản phẩm hiện
 * tại (transpile describeTransition + compositeFadePixel) so với
 * baseline CUR (smoothstep trước N6) và N6 (tham số).
 * Thang V6 như M6/N6/O1. Raw chỉ nằm trong /tmp, xoá sau mỗi phép đo.
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-p1-r32tc-"));

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

function smooth(t) { const c = t < 0 ? 0 : t > 1 ? 1 : t; return 3 * c * c - 2 * c * c * c; }
function weightsCUR(p) {
  return {
    aAlpha: p <= 0 ? 1 : 1 - smooth((p + 0.01) / 0.206),
    bAlpha: p >= 1 ? 1 : smooth((p - 0.122) / 0.954),
  };
}
const KNOTS_A = [[0, 1], [0.05, 0.8012], [0.1, 0.4497], [0.15, 0.1329], [0.2, 0], [0.25, 0], [0.3, 0], [0.35, 0], [0.4, 0], [0.45, 0], [0.5, 0], [0.55, 0], [0.6, 0], [0.65, 0], [0.7, 0], [0.75, 0], [0.8, 0], [0.85, 0], [0.9, 0], [0.95, 0], [1, 0]];
const KNOTS_B_N6 = [[0, 0], [0.05, 0], [0.1, 0], [0.12, 0], [0.15, 0.0128], [0.2, 0.0288], [0.25, 0.0562], [0.3, 0.0955], [0.35, 0.1427], [0.4, 0.2004], [0.45, 0.2659], [0.5, 0.3435], [0.55, 0.4191], [0.6, 0.5059], [0.65, 0.5884], [0.7, 0.6697], [0.75, 0.7419], [0.8, 0.8007], [0.85, 0.8479], [0.9, 0.8989], [0.95, 0.9476], [1, 1]];
function interpLinear(knots, p) {
  if (p <= 0) return knots[0][1];
  if (p >= 1) return knots[knots.length - 1][1];
  for (let i = 1; i < knots.length; i++) {
    if (p <= knots[i][0]) {
      const t = (p - knots[i - 1][0]) / (knots[i][0] - knots[i - 1][0]);
      return knots[i - 1][1] + t * (knots[i][1] - knots[i - 1][1]);
    }
  }
  return knots[knots.length - 1][1];
}
function weightsN6(p) { return { aAlpha: interpLinear(KNOTS_A, p), bAlpha: p <= 0.12 ? 0 : interpLinear(KNOTS_B_N6, p) }; }
function grayOf(px) { return (px[0] + px[1] + px[2]) / 3; }
function compPixels(A, B, type, p, wf) {
  const { aAlpha, bAlpha } = wf(p);
  const mode = type === "fadeblack" ? "black" : type === "fadewhite" ? "white" : "gray";
  const dipA = 1 - p - aAlpha, dipB = p - bAlpha;
  const npix = A.length / 3;
  const out = Buffer.alloc(A.length);
  for (let i = 0; i < npix; i++) {
    const o = i * 3;
    const midA = mode === "black" ? 0 : mode === "white" ? 255 : grayOf([A[o], A[o + 1], A[o + 2]]);
    const midB = mode === "black" ? 0 : mode === "white" ? 255 : grayOf([B[o], B[o + 1], B[o + 2]]);
    out[o] = Math.round(aAlpha * A[o] + bAlpha * B[o] + dipA * midA + dipB * midB);
    out[o + 1] = Math.round(aAlpha * A[o + 1] + bAlpha * B[o + 1] + dipA * midA + dipB * midB);
    out[o + 2] = Math.round(aAlpha * A[o + 2] + bAlpha * B[o + 2] + dipA * midA + dipB * midB);
  }
  return out;
}
function modelParam(A, B, C, inType, outType, p1, p2, wf) {
  return compPixels(compPixels(A, B, inType, p1, wf), C, outType, p2, wf);
}
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

const tp = transpileTs("apps/web/src/lib/transitionPreview.ts", "p1tc");
const W = 320, H = 180, fps = 120;
const COMBOS = [
  { inType: "fadewhite", outType: "fadewhite" },
  { inType: "fadegrays", outType: "fadewhite" },
  { inType: "fadewhite", outType: "fadegrays" },
  { inType: "fadeblack", outType: "fadeblack" },
  { inType: "fadeblack", outType: "fadewhite" },
];
const LOCALTS = [0.6, 0.75, 0.9];
function modelProduct(A, B, C, inType, outType, p1, p2) {
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
console.log("== P1 third-colors: cyan->magenta->yellow, exact-p 120fps, code sản phẩm hiện tại ==");
const A = flatFrame("cyan", W, H, fps, tag("tc-A"));
const B = flatFrame("magenta", W, H, fps, tag("tc-B"));
const C = flatFrame("yellow", W, H, fps, tag("tc-C"));
console.log(`pure A(cyan)=[${A[0]},${A[1]},${A[2]}] B(magenta)=[${B[0]},${B[1]},${B[2]}] C(yellow)=[${C[0]},${C[1]},${C[2]}]`);
const rows = [];
let totCur = 0, totN6 = 0, totProd = 0, nIncProd = 0, nTierDropProd = 0, nIncN6 = 0;
const tier = (v) => (v === "KHỚP" ? 0 : v === "XẤP XỈ" ? 1 : 2);
for (const { inType, outType } of COMBOS) {
  for (const localT of LOCALTS) {
    const chain = chainedFlatFrame(inType, outType, "cyan", "magenta", "yellow", localT, W, H, fps, tag("tc-chain"));
    const gCur = compareFrames(chain, modelParam(A, B, C, inType, outType, localT, localT - 0.5, weightsCUR));
    const gN6 = compareFrames(chain, modelParam(A, B, C, inType, outType, localT, localT - 0.5, weightsN6));
    const gProd = compareFrames(chain, modelProduct(A, B, C, inType, outType, localT, localT - 0.5));
    totCur += gCur.mad; totN6 += gN6.mad; totProd += gProd.mad;
    if (gProd.mad > gCur.mad + 1e-9) nIncProd++;
    if (tier(classify(gProd)) > tier(classify(gCur))) nTierDropProd++;
    if (gN6.mad > gCur.mad + 1e-9) nIncN6++;
    console.log(`${inType}/${outType}@${localT} | CUR ${fmt(gCur)} | N6 ${fmt(gN6)} | PRODUCT ${fmt(gProd)}`);
    rows.push({ inType, outType, localT,
      cur: { mad: +gCur.mad.toFixed(4), verdict: classify(gCur) },
      n6: { mad: +gN6.mad.toFixed(4), verdict: classify(gN6) },
      product: { mad: +gProd.mad.toFixed(4), verdict: classify(gProd) } });
  }
}
console.log(`tổng MAD: CUR=${totCur.toFixed(4)} N6=${totN6.toFixed(4)} PRODUCT=${totProd.toFixed(4)} | product ô tăng vs CUR=${nIncProd} | tier tụt vs CUR=${nTierDropProd} | N6 ô tăng vs CUR=${nIncN6}`);
if (JSON_OUT) {
  const p = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  writeFileEpermRetry(p, JSON.stringify({ colors: ["cyan", "magenta", "yellow"], rows,
    summary: { totCur: +totCur.toFixed(4), totN6: +totN6.toFixed(4), totProd: +totProd.toFixed(4), nIncProd, nTierDropProd, nIncN6 } }, null, 2));
  console.log(`JSON: ${p}`);
}
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* kệ */ }
