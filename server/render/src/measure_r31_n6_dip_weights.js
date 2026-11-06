#!/usr/bin/env node
/**
 * measure_r31_n6_dip_weights.js — Phase 9 đợt 31, luồng N6.
 *
 * Hiệu chuẩn trọng số dip cho mô hình cặp (follow-up điều kiện (a)
 * của quyết định đợt 30 M6). KHÔNG sửa code sản phẩm trong script này
 * (chỉ đo + tìm kiếm tham số); việc đổi/không đổi code do LIMITS
 * quyết định sau khi có số.
 *
 * Nội dung:
 *  (1) --single: probe xfade ĐƠN của FFmpeg 8.1.2 ở 120fps (p chính
 *      xác tới 0,05, không lượng tử hoá 1/30 như chuỗi 30fps của M6),
 *      đảo ngược (aAlpha,bAlpha) suy ra dưới mô hình sản phẩm cho
 *      fadeblack/fadewhite/fadegrays, so với đường cong sản phẩm.
 *  (2) --pair120: mô hình cặp M2 (code sản phẩm thật) so với chuỗi
 *      xfade kép ở 120fps tại đúng p (p1=localT, p2=localT-0,5) —
 *      kiểm tra giả thuyết "ô FW/FG 0,75 lệch do frame 30fps n=113
 *      ứng với p thật 0,7667/0,2667 chứ không phải 0,75/0,25".
 *  (3) --search: lưới tham số (aStart,aEnd,bStart,bEnd,grayDef) trên
 *      lưới phẳng exact-p + lưới xfade đơn; top combo được đánh giá
 *      thêm trên footage exact-p và trên lưới 30fps gốc của M6.
 *  (4) --pair30: tái lập lưới M6 gốc (30fps, phẳng + footage) để có
 *      baseline so sánh cùng một script.
 *
 * Thang V6 (như M6): KHỚP = MAD ≤ 2 VÀ ≥ 99% ≤ 8;
 * XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8; còn lại LỆCH.
 * Raw chỉ nằm trong /tmp, xoá sau mỗi phép đo. Footage + frame trung
 * gian KHÔNG nằm trong repo (footdir mặc định là footage đợt 28).
 */
"use strict";
const fs = require("fs");
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-n6-r31-"));
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
  fs.writeFileSync(path.join(stubDir, "package.json"), JSON.stringify({ name: "@repo-1/video-spec", version: "0.0.0", main: "index.js" }));
  fs.writeFileSync(path.join(stubDir, "index.js"), "module.exports = { CHROMA_DEFAULTS:{}, EFFECT_TYPES:[], LUT_IDS:[], STICKER_DEFAULTS:{}, interpolateKeyframes:()=>null, sourceTimeAt:()=>0, speedAt:()=>1 };\n");
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

/* ---------- đường cong trọng số (tham số hoá fadeDipWeights) ---------- */
const CUR = { aStart: -0.01, aEnd: 0.196, bStart: 0.122, bEnd: 1.076 };
function smooth(t) { const c = t < 0 ? 0 : t > 1 ? 1 : t; return 3 * c * c - 2 * c * c * c; }
function weightsAt(p, prm) {
  return {
    aAlpha: p <= 0 ? 1 : 1 - smooth((p - prm.aStart) / (prm.aEnd - prm.aStart)),
    bAlpha: p >= 1 ? 1 : smooth((p - prm.bStart) / (prm.bEnd - prm.bStart)),
  };
}
function grayOf(px, def) {
  return def === "luma" ? 0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2] : (px[0] + px[1] + px[2]) / 3;
}
// Composite cặp đầy đủ với tham số tự chọn (đường rgb, không offset YUV).
function compPixels(A, B, vis) {
  const npix = A.length / 3;
  const out = Buffer.alloc(A.length);
  for (let i = 0; i < npix; i++) {
    const o = i * 3;
    const midA = vis.mode === "black" ? 0 : vis.mode === "white" ? 255 : grayOf([A[o], A[o + 1], A[o + 2]], vis.grayDef);
    const midB = vis.mode === "black" ? 0 : vis.mode === "white" ? 255 : grayOf([B[o], B[o + 1], B[o + 2]], vis.grayDef);
    out[o] = Math.round(vis.aAlpha * A[o] + vis.bAlpha * B[o] + vis.dipA * midA + vis.dipB * midB);
    out[o + 1] = Math.round(vis.aAlpha * A[o + 1] + vis.bAlpha * B[o + 1] + vis.dipA * midA + vis.dipB * midB);
    out[o + 2] = Math.round(vis.aAlpha * A[o + 2] + vis.bAlpha * B[o + 2] + vis.dipA * midA + vis.dipB * midB);
  }
  return out;
}
function visOf(type, p, prm, grayDef) {
  const { aAlpha, bAlpha } = weightsAt(p, prm);
  const mode = type === "fadeblack" ? "black" : type === "fadewhite" ? "white" : "gray";
  return { aAlpha, bAlpha, dipA: 1 - p - aAlpha, dipB: p - bAlpha, mode, grayDef };
}
function modelM2(A, B, C, inType, outType, p1, p2, prm, grayDef) {
  const first = compPixels(A, B, visOf(inType, p1, prm, grayDef));
  return compPixels(first, C, visOf(outType, p2, prm, grayDef));
}
// M2 bằng CHÍNH code sản phẩm (describeTransition + compositeFadePixel).
function modelM2Product(tp, A, B, C, inType, outType, p1, p2, W, H) {
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

/* ---------- FFmpeg: frame phẳng / chuỗi ---------- */
function flatFrame(color, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  ffmpeg(["-f", "lavfi", "-i", `color=${color}:s=${W}x${H}:d=1:r=${fps}`,
    "-vf", `scale=${W}:${H},format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
// Chuỗi xfade ĐƠN: A 4s -> B 4s, offset 3, duration 1; frame tại đúng p.
function singleChainFrame(type, colA, colB, p, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  const n = Math.round((3 + p) * fps);
  ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W}x${H}:d=4:r=${fps}`,
    "-f", "lavfi", "-i", `color=${colB}:s=${W}x${H}:d=4:r=${fps}`,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=3,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
// Chuỗi xfade KÉP phẳng: A 4s -> B 1,5s -> C 4s, offset 3 / 3,5.
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
// Đảo ngược (aAlpha,bAlpha) dưới mô hình sản phẩm từ 1 pixel đo được.
function invertWeights(A, B, out, p, mode, grayDef) {
  const midA = mode === "black" ? 0 : mode === "white" ? 255 : grayOf(A, grayDef);
  const midB = mode === "black" ? 0 : mode === "white" ? 255 : grayOf(B, grayDef);
  // out_c = aA*(A_c-midA) + bB*(B_c-midB) + (1-p)*midA + p*midB
  let sxx = 0, sxy = 0, syy = 0, sxr = 0, syr = 0;
  for (let c = 0; c < 3; c++) {
    const x = A[c] - midA, y = B[c] - midB;
    const r = out[c] - ((1 - p) * midA + p * midB);
    sxx += x * x; sxy += x * y; syy += y * y; sxr += x * r; syr += y * r;
  }
  const det = sxx * syy - sxy * sxy;
  if (Math.abs(det) < 1e-9) return null;
  const aA = (sxr * syy - syr * sxy) / det;
  const bB = (sxx * syr - sxy * sxr) / det;
  // Dư số LSQ theo từng kênh (kiểm tra dạng mô hình có đúng không).
  let sq = 0;
  for (let c = 0; c < 3; c++) {
    const pred = aA * (A[c] - midA) + bB * (B[c] - midB) + (1 - p) * midA + p * midB;
    sq += (pred - out[c]) ** 2;
  }
  return { aAlpha: aA, bAlpha: bB, rmse: Math.sqrt(sq / 3) };
}

const COMBOS = [
  { inType: "fadewhite", outType: "fadewhite" },
  { inType: "fadegrays", outType: "fadewhite" },
  { inType: "fadewhite", outType: "fadegrays" },
  { inType: "fadeblack", outType: "fadeblack" },
  { inType: "fadeblack", outType: "fadewhite" },
];
const LOCALTS = [0.6, 0.75, 0.9];

function runSingle(tp) {
  console.log("== N6 --single: probe xfade đơn 120fps, đảo ngược trọng số ==");
  const W = 320, H = 180, fps = 120;
  const A = meanPixel(flatFrame("red", W, H, fps, tag("n6-A")));
  const B = meanPixel(flatFrame("green", W, H, fps, tag("n6-B")));
  console.log(`pure A(red)=[${A.map(v => v.toFixed(1)).join(",")}] B(green)=[${B.map(v => v.toFixed(1)).join(",")}]`);
  const rows = [];
  const ps = [];
  for (let k = 0; k <= 20; k++) ps.push(+(k * 0.05).toFixed(2));
  for (const type of ["fadeblack", "fadewhite", "fadegrays"]) {
    const mode = type === "fadeblack" ? "black" : type === "fadewhite" ? "white" : "gray";
    for (const p of ps) {
      const frame = singleChainFrame(type, "red", "green", p, W, H, fps, tag("n6-single"));
      const out = meanPixel(frame);
      const prod = weightsAt(p, CUR);
      const pred = compPixels(Buffer.from([A[0], A[1], A[2]]), Buffer.from([B[0], B[1], B[2]]),
        { ...visOf(type, p, CUR, "mean"), aAlpha: prod.aAlpha, bAlpha: prod.bAlpha });
      const predPx = [pred[0], pred[1], pred[2]];
      const madProd = (Math.abs(predPx[0] - out[0]) + Math.abs(predPx[1] - out[1]) + Math.abs(predPx[2] - out[2])) / 3;
      const invMean = invertWeights(A, B, out, p, mode, "mean");
      const invLuma = mode === "gray" ? invertWeights(A, B, out, p, mode, "luma") : null;
      console.log(`single | ${type} p=${p.toFixed(2)} out=[${out.map(v => v.toFixed(1)).join(",")}] prod(aA=${prod.aAlpha.toFixed(4)},bB=${prod.bAlpha.toFixed(4)}) MADprod=${madProd.toFixed(2)} | invMean(aA=${invMean.aAlpha.toFixed(4)},bB=${invMean.bAlpha.toFixed(4)},rmse=${invMean.rmse.toFixed(2)})${invLuma ? ` invLuma(aA=${invLuma.aAlpha.toFixed(4)},bB=${invLuma.bAlpha.toFixed(4)},rmse=${invLuma.rmse.toFixed(2)})` : ""}`);
      rows.push({ type, mode, p, out: out.map(v => +v.toFixed(2)), prodA: +prod.aAlpha.toFixed(4), prodB: +prod.bAlpha.toFixed(4), madProd: +madProd.toFixed(3),
        invMean: { a: +invMean.aAlpha.toFixed(4), b: +invMean.bAlpha.toFixed(4), rmse: +invMean.rmse.toFixed(3) },
        invLuma: invLuma ? { a: +invLuma.aAlpha.toFixed(4), b: +invLuma.bAlpha.toFixed(4), rmse: +invLuma.rmse.toFixed(3) } : null });
    }
  }
  return { pureA: A, pureB: B, rows };
}

function runPair(tp, fps, label) {
  console.log(`== N6 --pair${fps}: M2 code sản phẩm vs chuỗi xfade kép ${fps}fps (${label}) ==`);
  const rows = [];
  // Phẳng 320x180.
  {
    const W = 320, H = 180;
    const A = flatFrame("red", W, H, fps, tag("n6-flat-A"));
    const B = flatFrame("green", W, H, fps, tag("n6-flat-B"));
    const C = flatFrame("magenta", W, H, fps, tag("n6-flat-C"));
    for (const { inType, outType } of COMBOS) {
      for (const localT of LOCALTS) {
        const chain = chainedFlatFrame(inType, outType, "red", "green", "magenta", localT, W, H, fps, tag("n6-flat-chain"));
        const m2p = modelM2Product(tp, A, B, C, inType, outType, localT, localT - 0.5, W, H);
        const g = compareFrames(chain, m2p);
        const m2c = modelM2(A, B, C, inType, outType, localT, localT - 0.5, CUR, "mean");
        const gc = compareFrames(chain, m2c);
        console.log(`flat | ${inType}/${outType} localT=${localT} | M2-product ${fmt(g)} | M2-paramCUR ${fmt(gc)}`);
        rows.push({ kind: "flat", W, H, inType, outType, localT, p1: localT, p2: localT - 0.5,
          m2product: { mad: +g.mad.toFixed(4), le8: +g.le8.toFixed(4), verdict: classify(g) },
          m2paramCUR: { mad: +gc.mad.toFixed(4), le8: +gc.le8.toFixed(4), verdict: classify(gc) } });
      }
    }
  }
  // Footage K->L->J 360x640.
  {
    const W = 360, H = 640;
    for (const { inType, outType } of [
      { inType: "fadewhite", outType: "fadewhite" },
      { inType: "fadeblack", outType: "fadewhite" },
    ]) {
      for (const localT of LOCALTS) {
        const n = Math.round((3 + localT) * fps);
        const A = normFrame(FILE_K, 28, n, W, H, fps, tag("n6-foot-A"));
        const B = normFrame(FILE_L, 24, Math.round(localT * fps), W, H, fps, tag("n6-foot-B"));
        const C = normFrame(FILE_J, 28, Math.round((localT - 0.5) * fps), W, H, fps, tag("n6-foot-C"));
        const chain = chainedFootFrame(inType, outType, localT, W, H, fps, tag("n6-foot-chain"));
        const m2p = modelM2Product(tp, A, B, C, inType, outType, localT, localT - 0.5, W, H);
        const g = compareFrames(chain, m2p);
        console.log(`foot | K->L->J ${inType}/${outType} localT=${localT} | M2-product ${fmt(g)}`);
        rows.push({ kind: "footage", W, H, inType, outType, localT, p1: localT, p2: localT - 0.5,
          m2product: { mad: +g.mad.toFixed(4), le8: +g.le8.toFixed(4), verdict: classify(g) } });
      }
    }
  }
  return { fps, label, rows };
}

function runSearch() {
  console.log("== N6 --search: lưới tham số trên phẳng exact-p (120fps) + xfade đơn ==");
  // Chuỗi tham chiếu phẳng exact-p (120fps) — lấy 1 pixel đại diện/ô.
  const W = 320, H = 180, fps = 120;
  const A = flatFrame("red", W, H, fps, tag("n6-s-A"));
  const B = flatFrame("green", W, H, fps, tag("n6-s-B"));
  const C = flatFrame("magenta", W, H, fps, tag("n6-s-C"));
  const ref = {}; // key -> [r,g,b]
  for (const { inType, outType } of COMBOS) {
    for (const localT of LOCALTS) {
      const chain = chainedFlatFrame(inType, outType, "red", "green", "magenta", localT, W, H, fps, tag("n6-s-chain"));
      ref[`${inType}/${outType}@${localT}`] = meanPixel(chain);
    }
  }
  // Xfade đơn tham chiếu (đã có thể lấy lại nhanh: 3 type x 21 p).
  const singleRef = {};
  for (const type of ["fadeblack", "fadewhite", "fadegrays"]) {
    singleRef[type] = {};
    for (let k = 0; k <= 20; k++) {
      const p = +(k * 0.05).toFixed(2);
      singleRef[type][p] = meanPixel(singleChainFrame(type, "red", "green", p, W, H, fps, tag("n6-s-single")));
    }
  }
  const aPx = [A[0], A[1], A[2]], bPx = [B[0], B[1], B[2]], cPx = [C[0], C[1], C[2]];
  const evalParams = (prm, grayDef) => {
    let pairWorst = 0, pairSum = 0, nPair = 0;
    const pairCells = {};
    let regress = 0, offCell = null;
    for (const { inType, outType } of COMBOS) {
      for (const localT of LOCALTS) {
        const m = modelM2(Buffer.from(aPx), Buffer.from(bPx), Buffer.from(cPx), inType, outType, localT, localT - 0.5, prm, grayDef);
        const r = ref[`${inType}/${outType}@${localT}`];
        const mad = (Math.abs(m[0] - r[0]) + Math.abs(m[1] - r[1]) + Math.abs(m[2] - r[2])) / 3;
        const le8 = [0, 1, 2].every(c => Math.abs(m[c] - r[c]) <= 8) ? 1 : 0;
        pairCells[`${inType}/${outType}@${localT}`] = { mad: +mad.toFixed(3), le8, verdict: classify({ mad, le8 }) };
        pairWorst = Math.max(pairWorst, mad); pairSum += mad; nPair++;
        if (`${inType}/${outType}@${localT}` === "fadewhite/fadegrays@0.75") offCell = pairCells[`${inType}/${outType}@${localT}`];
      }
    }
    let singleSum = 0, singleN = 0, singleWorst = 0;
    for (const type of ["fadeblack", "fadewhite", "fadegrays"]) {
      for (let k = 0; k <= 20; k++) {
        const p = +(k * 0.05).toFixed(2);
        const m = compPixels(Buffer.from(aPx), Buffer.from(bPx), visOf(type, p, prm, grayDef));
        const r = singleRef[type][p];
        const mad = (Math.abs(m[0] - r[0]) + Math.abs(m[1] - r[1]) + Math.abs(m[2] - r[2])) / 3;
        singleSum += mad; singleN++; singleWorst = Math.max(singleWorst, mad);
      }
    }
    return { pairMean: pairSum / nPair, pairWorst, pairCells, offCell, singleMean: singleSum / singleN, singleWorst, regress };
  };
  const base = evalParams(CUR, "mean");
  console.log(`baseline CUR/mean: pairMean=${base.pairMean.toFixed(3)} pairWorst=${base.pairWorst.toFixed(3)} offCell=${JSON.stringify(base.offCell)} singleMean=${base.singleMean.toFixed(3)} singleWorst=${base.singleWorst.toFixed(3)}`);
  const results = [];
  const FINE = process.env.FINE === "1";
  const aStarts = FINE ? [-0.01] : [-0.04, -0.01, 0.02];
  const aEnds = FINE ? [0.196] : [0.17, 0.196, 0.23];
  const bStarts = FINE ? [0.1, 0.11, 0.122, 0.135, 0.145] : [0.09, 0.122, 0.155];
  const bEnds = FINE ? [1.03, 1.05, 1.076, 1.1] : [1.02, 1.076, 1.13];
  const grayDefs = FINE ? ["mean"] : ["mean", "luma"];
  for (const aStart of aStarts)
    for (const aEnd of aEnds)
      for (const bStart of bStarts)
        for (const bEnd of bEnds)
          for (const grayDef of grayDefs) {
            const prm = { aStart, aEnd, bStart, bEnd };
            const e = evalParams(prm, grayDef);
            // Hồi quy = ô phẳng nào MAD tăng > 0,5 so với baseline hoặc tụt verdict.
            let nRegress = 0;
            for (const k of Object.keys(e.pairCells)) {
              const bCell = base.pairCells[k], cCell = e.pairCells[k];
              const order = v => v === "KHỚP" ? 0 : v === "XẤP XỈ" ? 1 : 2;
              if (cCell.mad > bCell.mad + 0.5 || order(cCell.verdict) > order(bCell.verdict)) nRegress++;
            }
            results.push({ prm, grayDef, pairMean: +e.pairMean.toFixed(3), pairWorst: +e.pairWorst.toFixed(3),
              offMad: e.offCell.mad, offVerdict: e.offCell.verdict,
              singleMean: +e.singleMean.toFixed(3), singleWorst: +e.singleWorst.toFixed(3), nRegress });
          }
  results.sort((x, y) => (x.nRegress - y.nRegress) || (x.offMad - y.offMad) || (x.pairMean - y.pairMean));
  const shown = FINE ? results : results.slice(0, 15);
  for (const r of shown) console.log(`cand | ${JSON.stringify(r.prm)} gray=${r.grayDef} pairMean=${r.pairMean} pairWorst=${r.pairWorst} off=${r.offMad} ${r.offVerdict} singleMean=${r.singleMean} singleWorst=${r.singleWorst} nRegress=${r.nRegress}`);
  return { baseline: { pairMean: +base.pairMean.toFixed(3), pairWorst: +base.pairWorst.toFixed(3), offCell: base.offCell, singleMean: +base.singleMean.toFixed(3), singleWorst: +base.singleWorst.toFixed(3), pairCells: base.pairCells }, top: shown, allCount: results.length };
}

const tp = transpileTs("apps/web/src/lib/transitionPreview.ts", "n6");
const out = {};
if (args.includes("--single")) out.single = runSingle(tp);
if (args.includes("--pair120")) out.pair120 = runPair(tp, 120, "exact-p");
if (args.includes("--pair30")) out.pair30 = runPair(tp, 30, "M6-goc");
if (args.includes("--search")) out.search = runSearch();
if (JSON_OUT) {
  const p = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(out, null, 2));
  console.log(`JSON: ${p}`);
}
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* kệ */ }
