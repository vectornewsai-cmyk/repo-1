#!/usr/bin/env node
/**
 * measure_r32_p1_dip_strict.js — Phase 9 đợt 32, luồng P1 (kiểm chứng
 * độc lập, không dùng lại file đo của O1; chuỗi tham chiếu FFmpeg
 * 8.1.2 chạy lại từ đầu trong script này).
 *
 * TRẠNG THÁI ĐẦU LƯỢT (quan trọng — brief P1 viết lúc code còn là N6,
 * nhưng khi P1 chạy thì code sản phẩm đã là nút O1, xem
 * docs/PHASE9_ROUND32_O1_DIP_STRICT_LIMITS.md):
 *   - CUR  = smoothstep trước N6 (aStart=-0,01/aEnd=0,196,
 *     bStart=0,122/bEnd=1,076) — baseline của bar nghiêm ngặt.
 *   - N6   = nút đợt 31 + kẹp bB=0 tới p=0,12.
 *   - HIỆN TẠI = code sản phẩm (nút O1: 10 nút B đổi so với N6).
 * Bar nghiêm ngặt trong luồng này: "không tăng MAD ở bất kỳ ô nào
 * so với CUR, không tụt tier so với CUR" — và ứng cử mới chỉ được
 * giữ nếu GIẢM số ô tăng so với HIỆN TẠI mà KHÔNG tụt tier so với
 * HIỆN TẠI ở bất kỳ ô nào (tiêu chí giữ của brief P1).
 *
 * Lưới exact-p 120fps, 162 ô:
 *   - phẳng gốc red->green->magenta, 5 combo x 3 localT = 15 ô
 *   - phẳng màu mới blue->yellow->cyan, 5 combo x 3 localT = 15 ô
 *   - xfade đơn màu mới blue->yellow, 3 type x 21 p = 63 ô
 *   - footage K->L->J, 2 combo x 3 localT = 6 ô
 *   - xfade đơn gốc red->green, 3 type x 21 p = 63 ô (dữ liệu fit N6)
 * Lưới 99 ô của O1 = 162 trừ 63 ô single gốc. Thang V6 như M6/N6/O1.
 *
 * Phương pháp đo: chuỗi tham chiếu thu thập 1 lần; ô phẳng/đơn là
 * khung đồng màu nên so bằng pixel trung bình là CHÍNH XÁC (mọi
 * pixel giống nhau, composite tuyến tính + làm tròn giống nhau);
 * footage so full-frame. Kiểm chứng bằng CHÍNH code sản phẩm
 * (transpile describeTransition + compositeFadePixel) trên toàn bộ
 * 162 ô full-frame, đối chiếu với cột tham số HIỆN TẠI.
 *
 * Ứng cử thử (mỗi ứng cử đều đo lại toàn bộ lưới, không chỉ ô đích):
 *   (a) nội suy cubic đơn điệu (Fritsch–Carlson) qua các nút O1 thay
 *       vì nội suy tuyến tính — "nút nội suy mịn hơn" của brief;
 *   (b) coordinate descent trên các nút B đứng sau 7 ô tăng còn lại
 *       của HIỆN TẠI trên single gốc (0,2 / 0,3 / 0,45 / 0,65 / 0,7 /
 *       0,85), nhận ứng cử chỉ khi: số ô tăng so với CUR giảm,
 *       0 tier tụt so với CUR, 0 tier tụt so với HIỆN TẠI, và lưới
 *       99 ô vẫn 0 ô tăng so với CUR; sau đó kiểm chứng footage
 *       full-frame, hỏng 1 điều kiện là LOẠI (giữ nguyên code).
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-p1-r32-"));
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
function classifyMadLe8(mad, le8) {
  if (mad <= 2 && le8 >= 0.99) return "KHỚP";
  if (mad <= 20 && le8 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}
function classify(m) { return classifyMadLe8(m.mad, m.le8); }
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
function weightsCUR(p) {
  return {
    aAlpha: p <= 0 ? 1 : 1 - smooth((p + 0.01) / 0.206),
    bAlpha: p >= 1 ? 1 : smooth((p - 0.122) / 0.954),
  };
}
const KNOTS_A = [[0, 1], [0.05, 0.8012], [0.1, 0.4497], [0.15, 0.1329], [0.2, 0], [0.25, 0], [0.3, 0], [0.35, 0], [0.4, 0], [0.45, 0], [0.5, 0], [0.55, 0], [0.6, 0], [0.65, 0], [0.7, 0], [0.75, 0], [0.8, 0], [0.85, 0], [0.9, 0], [0.95, 0], [1, 0]];
const KNOTS_B_N6 = [[0, 0], [0.05, 0], [0.1, 0], [0.12, 0], [0.15, 0.0128], [0.2, 0.0288], [0.25, 0.0562], [0.3, 0.0955], [0.35, 0.1427], [0.4, 0.2004], [0.45, 0.2659], [0.5, 0.3435], [0.55, 0.4191], [0.6, 0.5059], [0.65, 0.5884], [0.7, 0.6697], [0.75, 0.7419], [0.8, 0.8007], [0.85, 0.8479], [0.9, 0.8989], [0.95, 0.9476], [1, 1]];
// Nút B HIỆN TẠI trong code sản phẩm (O1, đã đối chiếu với file).
const KNOTS_B_CUR = [[0, 0], [0.05, 0], [0.1, 0], [0.12, 0], [0.15, 0.0128], [0.2, 0.0313], [0.25, 0.0562], [0.3, 0.0955], [0.35, 0.1441], [0.4, 0.2016], [0.45, 0.2659], [0.5, 0.345], [0.55, 0.4216], [0.6, 0.5016], [0.65, 0.5934], [0.7, 0.6697], [0.75, 0.7419], [0.8, 0.7982], [0.85, 0.8479], [0.9, 0.9039], [0.95, 0.9523], [1, 1]];
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
// Nội suy cubic đơn điệu Fritsch–Carlson qua các nút (ứng cử (a)).
function interpMonotoneCubic(knots) {
  const n = knots.length;
  const m = new Array(n).fill(0);
  const d = [];
  for (let i = 0; i < n - 1; i++) {
    const h = knots[i + 1][0] - knots[i][0];
    d.push(h === 0 ? 0 : (knots[i + 1][1] - knots[i][1]) / h);
  }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * (knots[i + 1][0] - knots[i][0]) + (knots[i][0] - knots[i - 1][0]);
      const w2 = (knots[i + 1][0] - knots[i][0]) + 2 * (knots[i][0] - knots[i - 1][0]);
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  return (p) => {
    if (p <= 0) return knots[0][1];
    if (p >= 1) return knots[n - 1][1];
    for (let i = 1; i < n; i++) {
      if (p <= knots[i][0]) {
        const h = knots[i][0] - knots[i - 1][0];
        const t = (p - knots[i - 1][0]) / h;
        const t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * knots[i - 1][1]
          + (t3 - 2 * t2 + t) * h * m[i - 1]
          + (-2 * t3 + 3 * t2) * knots[i][1]
          + (t3 - t2) * h * m[i];
      }
    }
    return knots[n - 1][1];
  };
}
function weightsFromKnots(bKnots, interpB) {
  const fB = interpB || ((p) => interpLinear(bKnots, p));
  return (p) => ({
    aAlpha: interpLinear(KNOTS_A, p),
    // Kẹp bB=0 tới p=0,12 như code sản phẩm (cả tuyến tính lẫn cubic).
    bAlpha: p <= 0.12 ? 0 : fB(p),
  });
}
function weightsN6(p) { return weightsFromKnots(KNOTS_B_N6)(p); }
function weightsCurrent(p) { return weightsFromKnots(KNOTS_B_CUR)(p); }
function weightsCubic(p) {
  const fA = interpMonotoneCubic(KNOTS_A);
  const fB = interpMonotoneCubic(KNOTS_B_CUR);
  return { aAlpha: fA(p), bAlpha: p <= 0.12 ? 0 : fB(p) };
}
function grayOf(px) { return (px[0] + px[1] + px[2]) / 3; }
// Composite 1 pixel (đường rgb, không offset YUV — như N6/O1).
function compPixel(A, B, type, p, wf) {
  const { aAlpha, bAlpha } = wf(p);
  const mode = type === "fadeblack" ? "black" : type === "fadewhite" ? "white" : "gray";
  const dipA = 1 - p - aAlpha, dipB = p - bAlpha;
  const midA = mode === "black" ? 0 : mode === "white" ? 255 : grayOf(A);
  const midB = mode === "black" ? 0 : mode === "white" ? 255 : grayOf(B);
  return [
    Math.round(aAlpha * A[0] + bAlpha * B[0] + dipA * midA + dipB * midB),
    Math.round(aAlpha * A[1] + bAlpha * B[1] + dipA * midA + dipB * midB),
    Math.round(aAlpha * A[2] + bAlpha * B[2] + dipA * midA + dipB * midB),
  ];
}
function compPixels(A, B, type, p, wf) {
  const npix = A.length / 3;
  const out = Buffer.alloc(A.length);
  for (let i = 0; i < npix; i++) {
    const o = i * 3;
    const px = compPixel([A[o], A[o + 1], A[o + 2]], [B[o], B[o + 1], B[o + 2]], type, p, wf);
    out[o] = px[0]; out[o + 1] = px[1]; out[o + 2] = px[2];
  }
  return out;
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
console.log("== P1: thu thập chuỗi tham chiếu 120fps ==");
const meanCells = []; // ô phẳng/đơn: so bằng pixel trung bình (chính xác)
const footCells = []; // footage: full-frame
{
  const W = 320, H = 180, fps = 120;
  for (const s of [
    { kind: "flat-orig", cols: ["red", "green", "magenta"] },
    { kind: "flat-new", cols: ["blue", "yellow", "cyan"] },
  ]) {
    const A = meanPixel(flatFrame(s.cols[0], W, H, fps, tag("p1-A")));
    const B = meanPixel(flatFrame(s.cols[1], W, H, fps, tag("p1-B")));
    const C = meanPixel(flatFrame(s.cols[2], W, H, fps, tag("p1-C")));
    for (const { inType, outType } of COMBOS) {
      for (const localT of LOCALTS) {
        const ref = meanPixel(chainedFlatFrame(inType, outType, s.cols[0], s.cols[1], s.cols[2], localT, W, H, fps, tag("p1-chain")));
        meanCells.push({ id: `${s.kind}|${inType}/${outType}@${localT}`, kind: s.kind, inType, outType, localT, A, B, C, ref });
      }
    }
  }
  for (const s of [
    { kind: "single-new", cols: ["blue", "yellow"] },
    { kind: "single-orig", cols: ["red", "green"] },
  ]) {
    const A = meanPixel(flatFrame(s.cols[0], W, H, fps, tag("p1-sA")));
    const B = meanPixel(flatFrame(s.cols[1], W, H, fps, tag("p1-sB")));
    for (const type of ["fadeblack", "fadewhite", "fadegrays"]) {
      for (let k = 0; k <= 20; k++) {
        const p = +(k * 0.05).toFixed(2);
        const ref = meanPixel(singleChainFrame(type, s.cols[0], s.cols[1], p, W, H, fps, tag("p1-single")));
        meanCells.push({ id: `${s.kind}|${type}@${p}`, kind: s.kind, inType: type, outType: null, p, A, B, C: null, ref });
      }
    }
  }
}
{
  const W = 360, H = 640, fps = 120;
  for (const { inType, outType } of FOOT_COMBOS) {
    for (const localT of LOCALTS) {
      const n = Math.round((3 + localT) * fps);
      const A = normFrame(FILE_K, 28, n, W, H, fps, tag("p1-fA"));
      const B = normFrame(FILE_L, 24, Math.round(localT * fps), W, H, fps, tag("p1-fB"));
      const C = normFrame(FILE_J, 28, Math.round((localT - 0.5) * fps), W, H, fps, tag("p1-fC"));
      const chain = chainedFootFrame(inType, outType, localT, W, H, fps, tag("p1-fchain"));
      footCells.push({ id: `footage|${inType}/${outType}@${localT}`, kind: "footage", inType, outType, localT, A, B, C, ref: chain });
    }
  }
}
console.log(`thu thập xong: ${meanCells.length} ô mean-pixel + ${footCells.length} ô footage`);

/* ---------- đánh giá ---------- */
function evalMeanCell(c, wf) {
  let px;
  if (c.C === null) px = compPixel(c.A, c.B, c.inType, c.p, wf);
  else {
    const first = compPixel(c.A, c.B, c.inType, c.localT, wf);
    px = compPixel(first, c.C, c.outType, c.localT - 0.5, wf);
  }
  const diffs = [0, 1, 2].map((i) => Math.abs(px[i] - c.ref[i]));
  const mad = (diffs[0] + diffs[1] + diffs[2]) / 3;
  const le8 = diffs.every((d) => d <= 8) ? 1 : 0;
  return { mad, le8, maxDiff: Math.max(...diffs) };
}
function evalMean(wf) { return meanCells.map((c) => ({ id: c.id, kind: c.kind, m: evalMeanCell(c, wf) })); }
function evalFoot(wf) {
  return footCells.map((c) => {
    const first = compPixels(c.A, c.B, c.inType, c.localT, wf);
    const model = compPixels(first, c.C, c.outType, c.localT - 0.5, wf);
    return { id: c.id, kind: "footage", m: compareFrames(c.ref, model) };
  });
}
const tier = (v) => (v === "KHỚP" ? 0 : v === "XẤP XỈ" ? 1 : 2);
function summarize(rowsCur, rowsNew) {
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
function tierDropVs(rowsBase, rowsNew) {
  // Số ô tụt tier so với baseline (dùng cho tiêu chí giữ của brief).
  let n = 0; const cells = [];
  for (let i = 0; i < rowsBase.length; i++) {
    if (tier(classify(rowsNew[i].m)) > tier(classify(rowsBase[i].m))) { n++; cells.push(rowsBase[i].id); }
  }
  return { n, cells };
}
const is99 = (r) => r.kind !== "single-orig";
function summarize99(rowsCur, rowsNew) {
  const idx = rowsCur.map((r, i) => i).filter((i) => is99(rowsCur[i]));
  return summarize(idx.map((i) => rowsCur[i]), idx.map((i) => rowsNew[i]));
}

const rowsCUR = evalMean(weightsCUR);
const rowsN6 = evalMean(weightsN6);
const rowsCur = evalMean(weightsCurrent);
const sumN6 = summarize(rowsCUR, rowsN6);
const sumCur = summarize(rowsCUR, rowsCur);
const sumCur99 = summarize99(rowsCUR, rowsCur);
const sumN6vsCur = summarize(rowsCUR, rowsN6); // giữ để đối chiếu
console.log("== P1: HIỆN TẠI (nút O1) vs CUR trên 156 ô mean-pixel ==");
console.log(`tổng MAD CUR=${sumCur.totCur} HIỆN TẠI=${sumCur.totNew} | ô tăng=${sumCur.nInc} | tier tụt vs CUR=${sumCur.nTierDrop}`);
for (const r of sumCur.inc) console.log(`  TĂNG ${r.id}: ${r.cur} -> ${r.nw} (+${r.d}) ${r.curV}->${r.nwV}`);
console.log(`lưới 99 (trừ single gốc): tổng CUR=${sumCur99.totCur} HIỆN TẠI=${sumCur99.totNew} | ô tăng=${sumCur99.nInc} | tier tụt=${sumCur99.nTierDrop}`);
console.log(`đối chiếu N6 vs CUR (156 ô): tổng N6=${sumN6.totNew} | ô tăng=${sumN6.nInc} | tier tụt=${sumN6.nTierDrop}`);
const tgt = rowsCur.find((r) => r.id === "flat-orig|fadewhite/fadegrays@0.75");
console.log(`ô đích FW/FG phẳng gốc 0,75 (HIỆN TẠI): ${fmt(tgt.m)}`);
// HIỆN TẠI so với N6 (brief P1 viết lúc N6 là hiện tại — báo thêm chiều này).
const vsN6 = summarize(rowsN6, rowsCur);
const dropVsN6 = tierDropVs(rowsN6, rowsCur);
console.log(`HIỆN TẠI vs N6 (156 ô): tổng N6=${vsN6.totCur} HIỆN TẠI=${vsN6.totNew} | ô tăng vs N6=${vsN6.nInc} | tier tụt vs N6=${dropVsN6.n} ${JSON.stringify(dropVsN6.cells)}`);

/* ---------- ứng cử (a): cubic đơn điệu qua nút O1 ---------- */
const rowsCubic = evalMean(weightsCubic);
const sumCubic = summarize(rowsCUR, rowsCubic);
const sumCubic99 = summarize99(rowsCUR, rowsCubic);
const dropCubicVsCur = tierDropVs(rowsCur, rowsCubic);
console.log("== P1 ứng cử (a): cubic đơn điệu qua nút O1 ==");
console.log(`156 ô: tổng=${sumCubic.totNew} | ô tăng vs CUR=${sumCubic.nInc} | tier tụt vs CUR=${sumCubic.nTierDrop} | tier tụt vs HIỆN TẠI=${dropCubicVsCur.n}`);
console.log(`99 ô: tổng=${sumCubic99.totNew} | ô tăng vs CUR=${sumCubic99.nInc} | tier tụt vs CUR=${sumCubic99.nTierDrop}`);
for (const r of sumCubic.inc.slice(0, 20)) console.log(`  TĂNG-cubic ${r.id}: ${r.cur} -> ${r.nw} (+${r.d}) ${r.curV}->${r.nwV}`);

/* ---------- ứng cử (b): coordinate descent trên nút B ---------- */
const VAR_PS = [0.2, 0.3, 0.45, 0.65, 0.7, 0.85];
let bKnots = KNOTS_B_CUR.map(([p, v]) => [p, v]);
const setB = (p, v) => { const row = bKnots.find((r) => r[0] === p); if (row) row[1] = v; };
const scoreOf = (bk) => {
  const rows = evalMean(weightsFromKnots(bk));
  const s = summarize(rowsCUR, rows);
  const s99 = summarize99(rowsCUR, rows);
  const drop = tierDropVs(rowsCur, rows);
  const tgtRow = rows.find((r) => r.id === "flat-orig|fadewhite/fadegrays@0.75");
  const tgtOk = tgtRow.m.mad <= 2 && tgtRow.m.le8 >= 0.99;
  return { ...s, s99, dropVsCurrent: drop.n, tgtOk, rows };
};
let best = scoreOf(bKnots);
console.log(`-- ứng cử (b) khởi điểm (= HIỆN TẠI): tăng vs CUR=${best.nInc} (99 ô: ${best.s99.nInc}) tierTụt vs CUR=${best.nTierDrop} tierTụt vs HIỆN TẠI=${best.dropVsCurrent} tổng=${best.totNew} đíchKHỚP=${best.tgtOk}`);
const accept = (s) => s.nInc < best.nInc && s.nTierDrop === 0 && s.s99.nInc === 0 && s.dropVsCurrent === 0 && s.tgtOk;
// Tiêu chí giữ của brief: giảm số ô tăng mà không tụt tier nào.
// Descent chỉ nhận ứng cử tốt hơn theo đúng tiêu chí đó (so với
// best hiện hành, khởi điểm là HIỆN TẠI) — không nhận trade-off.
for (let pass = 0; pass < 3; pass++) {
  let improved = false;
  for (const p of VAR_PS) {
    const base = KNOTS_B_CUR.find((r) => r[0] === p)[1];
    const cur = bKnots.find((r) => r[0] === p)[1];
    const cands = new Set([cur, base, weightsCUR(p).bAlpha, +((cur + weightsCUR(p).bAlpha) / 2).toFixed(4)]);
    for (const d of [-0.02, -0.01, -0.005, -0.0025, 0.0025, 0.005, 0.01, 0.02]) {
      const v = +(cur + d).toFixed(4);
      if (v >= 0 && v <= 1) cands.add(v);
    }
    let bestV = null, bestS = best;
    for (const v of cands) {
      const trial = bKnots.map(([pp, vv]) => [pp, pp === p ? v : vv]);
      const s = scoreOf(trial);
      // Chấp nhận chỉ khi tốt hơn best theo tiêu chí giữ (giảm tăng,
      // không tụt tier) — so sánh trực tiếp, không qua accept() dùng
      // best cũ sau khi best đã đổi trong vòng lặp.
      const better = (s.nInc < bestS.nInc || (s.nInc === bestS.nInc && s.totNew < bestS.totNew - 1e-9))
        && s.nTierDrop === 0 && s.s99.nInc === 0 && s.dropVsCurrent === 0 && s.tgtOk;
      if (better) { bestS = s; bestV = v; }
    }
    if (bestV !== null) { setB(p, bestV); best = bestS; improved = true; console.log(`  pass ${pass + 1}: nút B@${p} -> ${bestV} (tăng vs CUR=${best.nInc}, 99 ô tăng=${best.s99.nInc}, tổng=${best.totNew})`); }
  }
  if (!improved) { console.log(`-- descent (b) hội tụ ở pass ${pass + 1} (không ứng cử nào thỏa tiêu chí giữ)`); break; }
}
const candAccepted = best.nInc < sumCur.nInc && best.nTierDrop === 0 && best.s99.nInc === 0 && best.dropVsCurrent === 0;
console.log(`== P1 ứng cử (b) kết quả: tăng vs CUR=${best.nInc} (HIỆN TẠI: ${sumCur.nInc}) | 99 ô tăng=${best.s99.nInc} | tier tụt vs CUR=${best.nTierDrop} | tier tụt vs HIỆN TẠI=${best.dropVsCurrent} | CHẤP NHẬN=${candAccepted}`);
console.log(`nút B ứng cử (b): ${JSON.stringify(bKnots)}`);

/* ---------- kiểm chứng footage + code sản phẩm ---------- */
const footCUR = evalFoot(weightsCUR);
const footCur = evalFoot(weightsCurrent);
const sumFoot = summarize(footCUR, footCur);
console.log("== P1 footage full-frame (6 ô): HIỆN TẠI vs CUR ==");
console.log(`tổng MAD CUR=${sumFoot.totCur} HIỆN TẠI=${sumFoot.totNew} | ô tăng=${sumFoot.nInc} | tier tụt=${sumFoot.nTierDrop}`);
for (const r of sumFoot.inc) console.log(`  TĂNG-foot ${r.id}: ${r.cur} -> ${r.nw} (+${r.d}) ${r.curV}->${r.nwV}`);
if (candAccepted) {
  const footCand = evalFoot(weightsFromKnots(bKnots));
  const sumFootCand = summarize(footCUR, footCand);
  const dropFoot = tierDropVs(footCur, footCand);
  console.log(`footage ứng cử (b): tổng=${sumFootCand.totNew} | ô tăng vs CUR=${sumFootCand.nInc} | tier tụt vs HIỆN TẠI=${dropFoot.n} — nếu khác 0/0 thì LOẠI ứng cử`);
}
const tp = transpileTs("apps/web/src/lib/transitionPreview.ts", "p1");
function evalMeanCellProduct(c) {
  const W = 320, H = 180;
  const comp = (X, Y, vis) => {
    const out = Buffer.alloc(3);
    const px = tp.compositeFadePixel(X, Y, vis, "rgb");
    out[0] = Math.round(px[0]); out[1] = Math.round(px[1]); out[2] = Math.round(px[2]);
    return [out[0], out[1], out[2]];
  };
  let px;
  if (c.C === null) px = comp(c.A, c.B, tp.describeTransition(c.inType, c.p, W, H));
  else {
    const first = comp(c.A, c.B, tp.describeTransition(c.inType, c.localT, W, H));
    px = comp(first, c.C, tp.describeTransition(c.outType, c.localT - 0.5, W, H));
  }
  const diffs = [0, 1, 2].map((i) => Math.abs(px[i] - c.ref[i]));
  const mad = (diffs[0] + diffs[1] + diffs[2]) / 3;
  const le8 = diffs.every((d) => d <= 8) ? 1 : 0;
  return { mad, le8, maxDiff: Math.max(...diffs) };
}
const rowsProduct = meanCells.map((c) => ({ id: c.id, kind: c.kind, m: evalMeanCellProduct(c) }));
let maxProdDiff = 0; const prodMismatch = [];
for (let i = 0; i < rowsProduct.length; i++) {
  const d = Math.abs(rowsProduct[i].m.mad - rowsCur[i].m.mad);
  if (d > maxProdDiff) maxProdDiff = d;
  if (d > 1e-9 || rowsProduct[i].m.le8 !== rowsCur[i].m.le8) prodMismatch.push({ id: rowsProduct[i].id, param: +rowsCur[i].m.mad.toFixed(4), product: +rowsProduct[i].m.mad.toFixed(4) });
}
console.log(`== P1 kiểm chứng code sản phẩm (156 ô mean-pixel): lệch MAD lớn nhất tham số-vs-product=${maxProdDiff.toFixed(6)}, số ô lệch=${prodMismatch.length}`);
if (prodMismatch.length) console.log(JSON.stringify(prodMismatch.slice(0, 10)));
const sumProd = summarize(rowsCUR, rowsProduct);
console.log(`product vs CUR (156 ô): tổng=${sumProd.totNew} | ô tăng=${sumProd.nInc} | tier tụt=${sumProd.nTierDrop}`);

const out = {
  grid: "120fps exact-p, 156 mean-pixel cells + 6 footage cells",
  cur: rowsCUR.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
  n6: rowsN6.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
  currentParam: rowsCur.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
  currentSummary: sumCur,
  currentSummary99: sumCur99,
  currentVsN6: { summary: vsN6, tierDropVsN6: dropVsN6 },
  cubic: rowsCubic.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
  cubicSummary: sumCubic,
  cubicSummary99: sumCubic99,
  cubicTierDropVsCurrent: dropCubicVsCur.n,
  candidateB: { bKnots, rows: best.rows.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
    summary: { nInc: best.nInc, nTierDrop: best.nTierDrop, totNew: best.totNew, s99nInc: best.s99.nInc, dropVsCurrent: best.dropVsCurrent }, accepted: candAccepted },
  footage: { cur: footCUR.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })),
    current: footCur.map((r) => ({ id: r.id, mad: +r.m.mad.toFixed(4), verdict: classify(r.m) })), summary: sumFoot },
  productCheck: { maxMadDiff: +maxProdDiff.toFixed(6), mismatchCount: prodMismatch.length, summary: sumProd },
};
if (JSON_OUT) {
  const p = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  writeFileEpermRetry(p, JSON.stringify(out, null, 2));
  console.log(`JSON: ${p}`);
}
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* kệ */ }
