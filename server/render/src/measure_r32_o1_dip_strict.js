#!/usr/bin/env node
/**
 * measure_r32_o1_dip_strict.js — Phase 9 đợt 32, luồng O1.
 *
 * Áp bar nghiêm ngặt "không tăng MAD ở bất kỳ ô nào" lên bộ trọng số
 * dip N6 (đợt 31: fadeDipWeights nội suy nút p cách 0,05 + kẹp bB=0
 * tới p=0,12), so sánh ô-by-ô với trọng số cũ CUR (smoothstep trước
 * N6) trên CÙNG chuỗi tham chiếu FFmpeg 8.1.2 (không dùng lại JSON
 * cũ làm chứng duy nhất — chạy lại toàn bộ lưới):
 *   - phẳng gốc red->green->magenta, 5 combo x 3 localT = 15 ô
 *   - phẳng màu mới blue->yellow->cyan, 5 combo x 3 localT = 15 ô
 *   - xfade đơn màu mới blue->yellow, 3 type x 21 p = 63 ô
 *   - footage K->L->J, 2 combo x 3 localT = 6 ô
 * Tổng 99 ô, exact-p 120fps. Thang V6 như M6/N6: KHỚP = MAD<=2 và
 * >=99% <=8; XẤP XỈ = MAD<=20 và >=90% <=8; còn lại LỆCH.
 *
 * Sau đó tìm ứng cử trong CHÍNH fadeDipWeights (chỉ vặn nút B, KHÔNG
 * đổi mô hình đơn clip, KHÔNG đụng nút B tại p=0,25 và p=0,75 để giữ
 * ô đích FW/FG 0,75 KHỚP) bằng coordinate descent trên cùng lưới,
 * mục tiêu theo thứ tự: (1) ít ô tăng MAD nhất so với CUR,
 * (2) ít tier tụt nhất, (3) tổng MAD thấp nhất.
 * Ứng cử tốt nhất được in ra (không tự áp vào code sản phẩm — việc
 * áp/revert do LIMITS quyết định sau khi có số; cờ --apply-candidate
 * chỉ dùng khi đã quyết định, và khi đó vẫn phải kiểm chứng lại
 * bằng --product).
 *
 * Cờ --product: đánh giá bằng CHÍNH code sản phẩm hiện tại
 * (describeTransition + compositeFadePixel transpile) thay vì mô
 * hình tham số — dùng để kiểm chứng sau khi áp ứng cử (nếu có).
 * Raw chỉ nằm trong /tmp, xoá sau mỗi phép đo.
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
const USE_PRODUCT = args.includes("--product");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-o1-r32-"));
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

/* ---------- trọng số ---------- */
function smooth(t) { const c = t < 0 ? 0 : t > 1 ? 1 : t; return 3 * c * c - 2 * c * c * c; }
// CUR = smoothstep trước N6 (aStart=-0.01, aEnd=0.196, bStart=0.122, bEnd=1.076).
function weightsCUR(p) {
  return {
    aAlpha: p <= 0 ? 1 : 1 - smooth((p + 0.01) / 0.206),
    bAlpha: p >= 1 ? 1 : smooth((p - 0.122) / 0.954),
  };
}
// N6 = nút hiệu chuẩn đợt 31 + kẹp bB=0 tới p=0.12 (khớp code sản phẩm).
const KNOTS_A = [[0, 1], [0.05, 0.8012], [0.1, 0.4497], [0.15, 0.1329], [0.2, 0], [0.25, 0], [0.3, 0], [0.35, 0], [0.4, 0], [0.45, 0], [0.5, 0], [0.55, 0], [0.6, 0], [0.65, 0], [0.7, 0], [0.75, 0], [0.8, 0], [0.85, 0], [0.9, 0], [0.95, 0], [1, 0]];
const KNOTS_B = [[0, 0], [0.05, 0], [0.1, 0], [0.12, 0], [0.15, 0.0128], [0.2, 0.0288], [0.25, 0.0562], [0.3, 0.0955], [0.35, 0.1427], [0.4, 0.2004], [0.45, 0.2659], [0.5, 0.3435], [0.55, 0.4191], [0.6, 0.5059], [0.65, 0.5884], [0.7, 0.6697], [0.75, 0.7419], [0.8, 0.8007], [0.85, 0.8479], [0.9, 0.8989], [0.95, 0.9476], [1, 1]];
function interpKnots(knots, p) {
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
function weightsN6(p) { return { aAlpha: interpKnots(KNOTS_A, p), bAlpha: interpKnots(KNOTS_B, p) }; }
// Ứng cử: bảng B tuỳ biến (A giữ nguyên N6).
function weightsFromBKnots(bKnots) {
  return (p) => ({ aAlpha: interpKnots(KNOTS_A, p), bAlpha: interpKnots(bKnots, p) });
}
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
function modelM2(A, B, C, inType, outType, p1, p2, wf) {
  return compPixels(compPixels(A, B, inType, p1, wf), C, outType, p2, wf);
}

/* ---------- FFmpeg ---------- */
function flatFrame(color, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  ffmpeg(["-f", "lavfi", "-i", `color=${color}:s=${W}x${H}:d=1:r=${fps}`,
    "-vf", `scale=${W}:${H},format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function singleChainFrame(type, colA, colB, p, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  const n = Math.round((3 + p) * fps);
  ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W}x${H}:d=4:r=${fps}`,
    "-f", "lavfi", "-i", `color=${colB}:s=${W}x${H}:d=4:r=${fps}`,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=3,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
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
function meanPixel(buf) {
  const n = buf.length / 3;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < buf.length; i += 3) { r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; }
  return [r / n, g / n, b / n];
}

const COMBOS = [
  { inType: "fadewhite", outType: "fadewhite" },
  { inType: "fadegrays", outType: "fadewhite" },
  { inType: "fadewhite", outType: "fadegrays" },
  { inType: "fadeblack", outType: "fadeblack" },
  { inType: "fadeblack", outType: "fadewhite" },
];
const LOCALTS = [0.6, 0.75, 0.9];
const FOOT_COMBOS = [
  { inType: "fadewhite", outType: "fadewhite" },
  { inType: "fadeblack", outType: "fadewhite" },
];

/* ---------- thu thập chuỗi tham chiếu (1 lần) ---------- */
console.log("== O1: thu thập chuỗi tham chiếu 120fps ==");
const cells = []; // {id, kind, inType, outType, localT|p, A, B, C?, ref}
{
  const W = 320, H = 180, fps = 120;
  const sets = [
    { kind: "flat-orig", cols: ["red", "green", "magenta"] },
    { kind: "flat-new", cols: ["blue", "yellow", "cyan"] },
  ];
  for (const s of sets) {
    const A = flatFrame(s.cols[0], W, H, fps, tag("o1-A"));
    const B = flatFrame(s.cols[1], W, H, fps, tag("o1-B"));
    const C = flatFrame(s.cols[2], W, H, fps, tag("o1-C"));
    for (const { inType, outType } of COMBOS) {
      for (const localT of LOCALTS) {
        const chain = chainedFlatFrame(inType, outType, s.cols[0], s.cols[1], s.cols[2], localT, W, H, fps, tag("o1-chain"));
        cells.push({ id: `${s.kind}|${inType}/${outType}@${localT}`, kind: s.kind, inType, outType, localT, A, B, C, ref: chain });
      }
    }
  }
  // Xfade đơn màu mới blue->yellow.
  const A = flatFrame("blue", W, H, fps, tag("o1-sA"));
  const B = flatFrame("yellow", W, H, fps, tag("o1-sB"));
  for (const type of ["fadeblack", "fadewhite", "fadegrays"]) {
    for (let k = 0; k <= 20; k++) {
      const p = +(k * 0.05).toFixed(2);
      const chain = singleChainFrame(type, "blue", "yellow", p, W, H, fps, tag("o1-single"));
      cells.push({ id: `single-new|${type}@${p}`, kind: "single-new", inType: type, outType: null, p, A, B, C: null, ref: chain });
    }
  }
  // Xfade đơn GỐC red->green: dữ liệu fit của N6, báo riêng (không
  // nằm trong 99 ô của bar nghiêm ngặt theo brief, nhưng ứng cử
  // không được hồi quy nặng trên chính dữ liệu fit).
  const A0 = flatFrame("red", W, H, fps, tag("o1-sA0"));
  const B0 = flatFrame("green", W, H, fps, tag("o1-sB0"));
  for (const type of ["fadeblack", "fadewhite", "fadegrays"]) {
    for (let k = 0; k <= 20; k++) {
      const p = +(k * 0.05).toFixed(2);
      const chain = singleChainFrame(type, "red", "green", p, W, H, fps, tag("o1-single0"));
      cells.push({ id: `single-orig|${type}@${p}`, kind: "single-orig", inType: type, outType: null, p, A: A0, B: B0, C: null, ref: chain });
    }
  }
}
{
  const W = 360, H = 640, fps = 120;
  for (const { inType, outType } of FOOT_COMBOS) {
    for (const localT of LOCALTS) {
      const n = Math.round((3 + localT) * fps);
      const A = normFrame(FILE_K, 28, n, W, H, fps, tag("o1-fA"));
      const B = normFrame(FILE_L, 24, Math.round(localT * fps), W, H, fps, tag("o1-fB"));
      const C = normFrame(FILE_J, 28, Math.round((localT - 0.5) * fps), W, H, fps, tag("o1-fC"));
      const chain = chainedFootFrame(inType, outType, localT, W, H, fps, tag("o1-fchain"));
      cells.push({ id: `footage|${inType}/${outType}@${localT}`, kind: "footage", inType, outType, localT, A, B, C, ref: chain });
    }
  }
}
console.log(`thu thập xong: ${cells.length} ô`);

/* ---------- đánh giá 1 bộ trọng số ---------- */
let tp = null;
if (USE_PRODUCT) tp = transpileTs("apps/web/src/lib/transitionPreview.ts", "o1");
function evalCellProduct(c) {
  const W = c.kind === "footage" ? 360 : 320, H = c.kind === "footage" ? 640 : 180;
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
  if (c.kind === "single-new" || c.kind === "single-orig") {
    const vis = tp.describeTransition(c.inType, c.p, W, H);
    return compareFrames(c.ref, comp(c.A, c.B, vis));
  }
  const first = comp(c.A, c.B, tp.describeTransition(c.inType, c.localT, W, H));
  return compareFrames(c.ref, comp(first, c.C, tp.describeTransition(c.outType, c.localT - 0.5, W, H)));
}
function evalCellParam(c, wf) {
  if (c.kind === "single-new" || c.kind === "single-orig") return compareFrames(c.ref, compPixels(c.A, c.B, c.inType, c.p, wf));
  return compareFrames(c.ref, modelM2(c.A, c.B, c.C, c.inType, c.outType, c.localT, c.localT - 0.5, wf));
}
function evaluate(wfOrProduct) {
  // Luôn đánh giá tham số; chế độ --product dùng evaluateProduct()
  // riêng cho cột product để baseline CUR không bị tính nhầm bằng
  // code sản phẩm (bug O1: evaluate() cũ lấy product cho cả 2 cột).
  return cells.map((c) => ({ id: c.id, kind: c.kind, m: evalCellParam(c, wfOrProduct) }));
}
function evaluateProduct() {
  return cells.map((c) => ({ id: c.id, kind: c.kind, m: evalCellProduct(c) }));
}
// Tóm tắt trên lưới chính 99 ô (loại single-orig ra).
function summarizeMain(rowsCur, rowsNew) {
  const idx = rowsCur.map((r, i) => i).filter((i) => rowsCur[i].kind !== "single-orig");
  return summarize(idx.map((i) => rowsCur[i]), idx.map((i) => rowsNew[i]));
}
function summarizeOrig(rowsCur, rowsNew) {
  const idx = rowsCur.map((r, i) => i).filter((i) => rowsCur[i].kind === "single-orig");
  return summarize(idx.map((i) => rowsCur[i]), idx.map((i) => rowsNew[i]));
}
function summarize(rowsCur, rowsNew) {
  const tier = (v) => (v === "KHỚP" ? 0 : v === "XẤP XỈ" ? 1 : 2);
  let nInc = 0, nTierDrop = 0, totCur = 0, totNew = 0;
  const inc = [];
  for (let i = 0; i < rowsCur.length; i++) {
    const a = rowsCur[i].m, b = rowsNew[i].m;
    totCur += a.mad; totNew += b.mad;
    if (b.mad > a.mad + 1e-9) { nInc++; inc.push({ id: rowsCur[i].id, cur: +a.mad.toFixed(4), nw: +b.mad.toFixed(4), d: +(b.mad - a.mad).toFixed(4), curV: classify(a), nwV: classify(b) }); }
    if (tier(classify(b)) > tier(classify(a))) nTierDrop++;
  }
  return { nInc, nTierDrop, totCur: +totCur.toFixed(4), totNew: +totNew.toFixed(4), inc };
}

const rowsCUR = evaluate(weightsCUR);
let rowsN6, sumN6;
if (USE_PRODUCT) {
  rowsN6 = evaluateProduct();
  sumN6 = summarizeMain(rowsCUR, rowsN6);
  const sumOrigP = summarizeOrig(rowsCUR, rowsN6);
  console.log(`single-orig (dữ liệu fit N6, báo riêng): tổng CUR=${sumOrigP.totCur} product=${sumOrigP.totNew} | ô tăng=${sumOrigP.nInc} | tier tụt=${sumOrigP.nTierDrop}`);
  for (const r of sumOrigP.inc) console.log(`  TĂNG-orig ${r.id}: ${r.cur} -> ${r.nw} (+${r.d}) ${r.curV}->${r.nwV}`);
  console.log("== O1 --product: code sản phẩm hiện tại vs CUR ==");
  console.log(`tổng MAD CUR=${sumN6.totCur} product=${sumN6.totNew} | ô tăng=${sumN6.nInc} | tier tụt=${sumN6.nTierDrop}`);
  for (const r of sumN6.inc) console.log(`  TĂNG ${r.id}: ${r.cur} -> ${r.nw} (+${r.d}) ${r.curV}->${r.nwV}`);
  const tgt = rowsN6.find((r) => r.id === "flat-orig|fadewhite/fadegrays@0.75");
  console.log(`ô đích FW/FG phẳng gốc 0,75 (product): ${fmt(tgt.m)}`);
} else {
  rowsN6 = evaluate(weightsN6);
  sumN6 = summarizeMain(rowsCUR, rowsN6);
  const sumOrigN6 = summarizeOrig(rowsCUR, rowsN6);
  console.log(`single-orig (dữ liệu fit N6, báo riêng): tổng CUR=${sumOrigN6.totCur} N6=${sumOrigN6.totNew} | ô tăng=${sumOrigN6.nInc} | tier tụt=${sumOrigN6.nTierDrop}`);
  for (const r of sumOrigN6.inc) console.log(`  TĂNG-orig ${r.id}: ${r.cur} -> ${r.nw} (+${r.d}) ${r.curV}->${r.nwV}`);
  console.log("== O1: N6 vs CUR (cùng chuỗi tham chiếu, 99 ô) ==");
  console.log(`tổng MAD CUR=${sumN6.totCur} N6=${sumN6.totNew} | ô tăng=${sumN6.nInc} | tier tụt=${sumN6.nTierDrop}`);
  for (const r of sumN6.inc) console.log(`  TĂNG ${r.id}: ${r.cur} -> ${r.nw} (+${r.d}) ${r.curV}->${r.nwV}`);
  const tgt = rowsN6.find((r) => r.id === "flat-orig|fadewhite/fadegrays@0.75");
  console.log(`ô đích FW/FG phẳng gốc 0,75 (N6): ${fmt(tgt.m)}`);

  /* ---------- coordinate descent trên nút B ---------- */
  // Nút B được vặn (đóng băng 0,25 và 0,75 để giữ ô đích; đóng băng
  // các nút không liên quan tới ô tăng nào).
  const VAR_PS = [0.2, 0.35, 0.4, 0.5, 0.55, 0.6, 0.65, 0.8, 0.9, 0.95];
  const curBVal = (p) => interpKnots(KNOTS_B, p);
  const curValOf = (p) => weightsCUR(p).bAlpha;
  let bKnots = KNOTS_B.map(([p, v]) => [p, v]);
  const setB = (p, v) => { const row = bKnots.find((r) => r[0] === p); if (row) row[1] = v; };
  const scoreOf = (bk) => {
    const rows = evaluate(weightsFromBKnots(bk));
    const s = summarizeMain(rowsCUR, rows);
    const tgtRow = rows.find((r) => r.id === "flat-orig|fadewhite/fadegrays@0.75");
    const tgtOk = tgtRow.m.mad <= 2 && tgtRow.m.le8 >= 0.99;
    return { ...s, tgtOk, rows };
  };
  let best = scoreOf(bKnots);
  console.log(`-- ứng cử khởi điểm (= N6): tăng=${best.nInc} tierTụt=${best.nTierDrop} tổng=${best.totNew} đíchKHỚP=${best.tgtOk}`);
  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (const p of VAR_PS) {
      const base = curBVal(p);
      const cands = new Set([base, curValOf(p)]);
      for (const d of [-0.02, -0.015, -0.01, -0.0075, -0.005, -0.0025, 0.0025, 0.005, 0.0075, 0.01, 0.015, 0.02]) {
        const v = +(base + d).toFixed(4);
        if (v >= 0 && v <= 1) cands.add(v);
      }
      // Thử giá trị trung bình N6-CUR nữa (điểm giữa 2 đường cong).
      cands.add(+((base + curValOf(p)) / 2).toFixed(4));
      let bestV = null, bestS = best;
      for (const v of cands) {
        const trial = bKnots.map(([pp, vv]) => [pp, pp === p ? v : vv]);
        const s = scoreOf(trial);
        if (!s.tgtOk) continue;
        const key = (x) => [x.nInc, x.nTierDrop, x.totNew];
        const better = (x, y) => {
          const kx = key(x), ky = key(y);
          for (let i = 0; i < 3; i++) if (kx[i] !== ky[i]) return kx[i] < ky[i];
          return false;
        };
        if (better(s, bestS)) { bestS = s; bestV = v; }
      }
      if (bestV !== null) { setB(p, bestV); best = bestS; improved = true; console.log(`  pass ${pass + 1}: nút B@${p} ${base} -> ${bestV} (tăng=${best.nInc} tierTụt=${best.nTierDrop} tổng=${best.totNew})`); }
    }
    if (!improved) { console.log(`-- coordinate descent hội tụ ở pass ${pass + 1}`); break; }
  }
  // Polish: giữ nInc=0, chỉ nhận giá trị làm tổng MAD giảm (khôi
  // phục phần tổng bị đội lên ở pass descent tham lam).
  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (const p of VAR_PS) {
      const cur = bKnots.find((r) => r[0] === p)[1];
      const cands = new Set([cur, curBVal(p), curValOf(p), +((cur + curBVal(p)) / 2).toFixed(4)]);
      for (const d of [-0.01, -0.005, -0.0025, 0.0025, 0.005, 0.01]) {
        const v = +(cur + d).toFixed(4);
        if (v >= 0 && v <= 1) cands.add(v);
      }
      let bestV = null, bestS = best;
      for (const v of cands) {
        const trial = bKnots.map(([pp, vv]) => [pp, pp === p ? v : vv]);
        const s = scoreOf(trial);
        if (!s.tgtOk || s.nInc !== 0) continue;
        if (s.totNew < bestS.totNew - 1e-9) { bestS = s; bestV = v; }
      }
      if (bestV !== null) { setB(p, bestV); best = bestS; improved = true; console.log(`  polish pass ${pass + 1}: nút B@${p} -> ${bestV} (tăng=0 tổng=${best.totNew})`); }
    }
    if (!improved) { console.log(`-- polish hội tụ ở pass ${pass + 1}`); break; }
  }
  const sumOrigCand = summarizeOrig(rowsCUR, best.rows);
  console.log(`single-orig ứng cử (báo riêng): tổng=${sumOrigCand.totNew} | ô tăng=${sumOrigCand.nInc} | tier tụt=${sumOrigCand.nTierDrop}`);
  for (const r of sumOrigCand.inc) console.log(`  TĂNG-orig ứng cử ${r.id}: ${r.cur} -> ${r.nw} (+${r.d}) ${r.curV}->${r.nwV}`);
  console.log("== O1: ứng cử tốt nhất ==");
  console.log(`tăng=${best.nInc} tierTụt=${best.nTierDrop} tổngMAD=${best.totNew} (N6: tăng=${sumN6.nInc} tierTụt=${sumN6.nTierDrop} tổng=${sumN6.totNew}; CUR tổng=${sumN6.totCur})`);
  console.log(`nút B ứng cử: ${JSON.stringify(bKnots)}`);
  for (const r of best.inc) console.log(`  TĂNG còn lại ${r.id}: ${r.cur} -> ${r.nw} (+${r.d}) ${r.curV}->${r.nwV}`);
  const out = {
    grid: "120fps exact-p, 99 cells",
    cur: rowsCUR.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
    n6: rowsN6.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
    n6Summary: sumN6,
    n6OrigSummary: sumOrigN6,
    candidateBKnots: bKnots,
    candidate: best.rows.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
    candidateSummary: { nInc: best.nInc, nTierDrop: best.nTierDrop, totNew: best.totNew, inc: best.inc },
    candidateOrigSummary: sumOrigCand,
  };
  if (JSON_OUT) {
    const p = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    writeFileEpermRetry(p, JSON.stringify(out, null, 2));
    console.log(`JSON: ${p}`);
  }
  if (!JSON_OUT) {
    // Vẫn in tóm tắt ứng cử để LIMITS trích được dù quên --json.
    console.log(`CANDIDATE_BKNOTS=${JSON.stringify(bKnots)}`);
  }
}
if (JSON_OUT && USE_PRODUCT) {
  const p = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  writeFileEpermRetry(p, JSON.stringify({
    grid: "120fps exact-p, 99 cells, product code",
    cur: rowsCUR.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
    product: rowsN6.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
    summary: sumN6,
  }, null, 2));
  console.log(`JSON: ${p}`);
}
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* kệ */ }
