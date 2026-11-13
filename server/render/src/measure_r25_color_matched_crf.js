"use strict";
/**
 * measure_r25_color_matched_crf.js — Phase 9 đợt 25 (luồng I1): đo lại
 * bảng crf YUV cũ bằng phương pháp KHỚP MÀU (nợ phương pháp đợt 24
 * H4). Chỉ script đo, KHÔNG sửa code sản phẩm, KHÔNG sửa harness
 * ngoài harnessShared (đã sửa ở cùng đợt, xem test_r25).
 *
 * Phương pháp (khác phương pháp mismatched đợt 20–23 ở đúng 1 điểm):
 *  - Chuỗi render GIỮ NGUYÊN như sản phẩm: xfade trên rgb24 rồi
 *    format=yuv420p MẶC ĐỊNH (FFmpeg dùng metadata nguồn — bt709
 *    với J/K/L/R1/R2). Không ép matrix ở chuỗi mặc định.
 *  - Phía preview chuyển sang yuv420p bằng ĐÚNG matrix của nguồn,
 *    đọc từ ffprobe qua harnessShared.probeColorMetadata +
 *    matrixForMetadata (không đoán).
 *  - So sánh bằng yuv420Mad + thang V6-tham-chiếu (KHỚP = MAD ≤ 2
 *    VÀ ≥99% mẫu lệch ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ ≥90% ≤ 8).
 *
 * Chế độ matrix (--matrix):
 *  - auto (mặc định): cả 2 nguồn phải cho cùng 1 matrix qua metadata;
 *    khác nhau hoặc unknown thì throw (không đoán).
 *  - bt709 | bt601: ép preview dùng matrix đó, ghi rõ là giả định
 *    tường minh trong output (dùng cho đối chứng, không phải auto).
 *  - probe: dành cho nguồn metadata unknown (vd N1/N2 đợt 24 H5):
 *    đo sàn crf0 của chuỗi MẶC ĐỊNH so với preview-bt601 và
 *    preview-bt709, chọn matrix cho sàn nhỏ hơn; nếu sàn nhỏ hơn
 *    vẫn > 2 (không KHỚP) thì throw — không gán matrix theo cảm
 *    tính. Kết hợp --probe-only để chỉ in 2 sàn rồi thoát.
 *
 * Chế độ chuỗi (--chain, chỉ dùng cho đối chứng):
 *  - default (mặc định): chuỗi sản phẩm thật (format=yuv420p).
 *  - forced601 / forced709: ép chuỗi bằng
 *    scale(out_color_matrix=...),format=yuv420p — dùng để tái lập
 *    số matched-forced-601 của đợt 24 H4 (K→L crf14 ≈ 2,2843)
 *    trước khi tin số matched mới. Không dùng cho bảng chính.
 *
 * Lặp lại (--repeat, mặc định 2): mỗi ô crf encode 2 lần tuần tự,
 * in cả 2 lần + chênh lệch lớn nhất; verdict lấy từ lần 1, và cờ
 * repeatVerdictMatch=false nếu lần 2 đổi verdict (không giấu).
 *
 * Khung đo (giữ đúng quy ước đợt 22–24): cửa sổ 2s mỗi clip, chuẩn
 * hoá fps=30,scale=W:H,format=rgb24,settb=AVTB; xfade duration=1
 * offset=1; frame giữa n=45 @30fps (A tại win+1,5s, B tại win+0,5s);
 * libx264 preset medium; khung mặc định 720x1280 (dọc).
 * Guard căn khung: trước mỗi cặp/type, so RGB preview vs frame
 * chuỗi rgb24 tại n=45 — MAD RGB phải < 2 (KHỚP) mới đo YUV, nếu
 * không thì bỏ cặp/type đó với lý do rõ ràng (tránh số YUV của
 * khung lệch, bài học maskedmerge đợt 24).
 *
 * Cách chạy (từ server/render/):
 *   node src/measure_r25_color_matched_crf.js --scratch <dir ngoài repo> \
 *     --pair K-L --clipA <K> --winA 28 --clipB <L> --winB 24 \
 *     --types dissolve,circleopen --crfs 0,10,12,14 \
 *     --matrix auto --repeat 2 --out <file.json>
 * Scratch chứa mp4 encode + yuv decode tạm, XOÁ NGAY sau mỗi ô đo
 * (chỉ giữ JSON + log); không viết raw lớn vào /tmp — --scratch
 * là bắt buộc và phải nằm ngoài repo.
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const FPS = 30;

function parseArgs(argv) {
  const o = { types: ["dissolve"], crfs: [0, 10, 12, 14], matrix: "auto", chain: "default", repeat: 2, size: "720x1280", probeOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = argv[i + 1];
    if (a === "--scratch") o.scratch = v;
    else if (a === "--pair") o.pair = v;
    else if (a === "--clipA") o.clipA = v;
    else if (a === "--winA") o.winA = parseFloat(v);
    else if (a === "--clipB") o.clipB = v;
    else if (a === "--winB") o.winB = parseFloat(v);
    else if (a === "--size") o.size = v;
    else if (a === "--types") o.types = v.split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--crfs") o.crfs = v.split(",").map((s) => parseInt(s, 10));
    else if (a === "--matrix") o.matrix = v;
    else if (a === "--chain") o.chain = v;
    else if (a === "--repeat") o.repeat = parseInt(v, 10);
    else if (a === "--out") o.out = v;
    else if (a === "--probe-only") { o.probeOnly = true; /* flag không value: không ăn thêm argv, vòng lặp tự tăng i */ }
    else throw new Error(`Tham số lạ: ${a}`);
    if (a !== "--probe-only") i++;
  }
  return o;
}

const OPT = parseArgs(process.argv.slice(2));
if (!OPT.scratch || !OPT.pair || !OPT.clipA || isNaN(OPT.winA) || !OPT.clipB || isNaN(OPT.winB)) {
  throw new Error("Thiếu tham số bắt buộc: --scratch --pair --clipA --winA --clipB --winB (xem header)");
}
if (path.resolve(OPT.scratch).startsWith(path.resolve(ROOT) + path.sep)) {
  throw new Error("--scratch nằm trong repo — từ chối (binary/raw không được vào repo)");
}
const [W, H] = OPT.size.split("x").map((s) => parseInt(s, 10));
if (!W || !H) throw new Error(`--size không hợp lệ: ${OPT.size}`);
fs.mkdirSync(OPT.scratch, { recursive: true });
const TMP = fs.mkdtempSync(path.join(OPT.scratch, "r25-cm-"));

const shared = require("./harnessShared");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r;
}
function ffmpeg(args) { return run("ffmpeg", ["-v", "error", ...args]); }
function findTsc() {
  for (const c of [path.join(ROOT, "apps", "web", "node_modules", ".bin", "tsc"), path.join(ROOT, "node_modules", ".bin", "tsc"), "tsc"]) {
    if (spawnSync(c, ["--version"], { encoding: "utf8" }).status === 0) return c;
  }
  return null;
}
function transpileTs(srcRel, outName) {
  const src = path.join(ROOT, srcRel);
  const outDir = path.join(TMP, outName);
  fs.mkdirSync(outDir, { recursive: true });
  spawnSync(findTsc(), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}`);
  return require(jsFile);
}
function normChain() { return `fps=${FPS},scale=${W}:${H},format=rgb24,settb=AVTB`; }
function sourceFrame(file, win, n, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  // Bài học I1 (xem LIMITS §1): output rawvideo BẮT BUỘC ghi rõ
  // -pix_fmt — không ghi thì ffmpeg tự đàm phán format và làm lệch
  // chọn frame ở chuỗi xfade+select (select45 thành frame 46,
  // MAD RGB 76,9 thay vì 0,0039). Chuỗi 1 input này không lộ lỗi
  // nhưng vẫn ghi tường minh cho đồng nhất và an toàn.
  ffmpeg(["-ss", String(win), "-t", "2", "-i", file,
    "-filter_complex", `[0:v]${normChain()},select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  const buf = fs.readFileSync(out);
  fs.unlinkSync(out);
  return buf;
}
function previewFrame(visual, frameA, frameB) {
  const buf = Buffer.alloc(W * H * 3);
  const hasRadial =
    (visual.a.region && visual.a.region.kind === "radial-gradient") ||
    (visual.b.region && visual.b.region.kind === "radial-gradient");
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5, py = y + 0.5, i = (y * W + x) * 3;
      let r = 0, g = 0, b = 0;
      if (hasRadial) {
        const ca = shared.layerPixelAlpha(visual.a, x, y, W, H);
        const cb = shared.layerPixelAlpha(visual.b, x, y, W, H);
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else if (!visual.geometric) {
        const ca = shared.layerCovers(visual.a, px, py, W, H) ? visual.a.alpha : 0;
        const cb = shared.layerCovers(visual.b, px, py, W, H) ? visual.b.alpha : 0;
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else {
        if (shared.layerCovers(visual.a, px, py, W, H)) {
          r = frameA[i] * visual.a.alpha + r * (1 - visual.a.alpha);
          g = frameA[i + 1] * visual.a.alpha + g * (1 - visual.a.alpha);
          b = frameA[i + 2] * visual.a.alpha + b * (1 - visual.a.alpha);
        }
        if (shared.layerCovers(visual.b, px, py, W, H)) {
          r = frameB[i] * visual.b.alpha + r * (1 - visual.b.alpha);
          g = frameB[i + 1] * visual.b.alpha + g * (1 - visual.b.alpha);
          b = frameB[i + 2] * visual.b.alpha + b * (1 - visual.b.alpha);
        }
      }
      buf[i] = Math.round(r); buf[i + 1] = Math.round(g); buf[i + 2] = Math.round(b);
    }
  }
  return buf;
}
function compareRgb(a, b) {
  let sum = 0, le8 = 0;
  const n = W * H * 3;
  for (let k = 0; k < n; k++) { const d = Math.abs(a[k] - b[k]); sum += d; if (d <= 8) le8++; }
  return { mad: sum / n, le8: le8 / n };
}
function chainTail() {
  if (OPT.chain === "default") return "format=yuv420p";
  if (OPT.chain === "forced601") return "scale=out_color_matrix=bt601,format=yuv420p";
  if (OPT.chain === "forced709") return "scale=out_color_matrix=bt709,format=yuv420p";
  throw new Error(`--chain không hỗ trợ: ${OPT.chain}`);
}
// Encode 1 lần ở crf cho trước, trả MAD-YUV so với preview đã chuyển
// (previewYuv) + xoá mp4/yuv ngay sau khi so.
function encodeOnce(type, crf, previewYuv, tag) {
  const mp4 = path.join(TMP, `${tag}.mp4`);
  const NORM = normChain();
  ffmpeg(["-ss", String(OPT.winA), "-t", "2", "-i", OPT.clipA, "-ss", String(OPT.winB), "-t", "2", "-i", OPT.clipB,
    "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,${chainTail()}[v]`,
    "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-pix_fmt", "yuv420p", "-t", "2", "-y", mp4]);
  const yuvOut = path.join(TMP, `${tag}.yuv`);
  try {
    ffmpeg(["-i", mp4, "-filter_complex", "[0:v]select='eq(n,45)'[v]", "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", yuvOut]);
    const encYuv = fs.readFileSync(yuvOut);
    return shared.yuv420Mad(previewYuv.yuv, encYuv, previewYuv.w, previewYuv.h);
  } finally {
    try { fs.unlinkSync(mp4); } catch { /* bỏ qua */ }
    try { fs.unlinkSync(yuvOut); } catch { /* bỏ qua */ }
  }
}
// Sàn crf0 của chuỗi MẶC ĐỊNH (không ép) — dùng cho chế độ probe.
function defaultChainFloorCrf0(previewYuv, tag) {
  const mp4 = path.join(TMP, `${tag}.mp4`);
  const NORM = normChain();
  ffmpeg(["-ss", String(OPT.winA), "-t", "2", "-i", OPT.clipA, "-ss", String(OPT.winB), "-t", "2", "-i", OPT.clipB,
    "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=dissolve:duration=1:offset=1,format=yuv420p[v]`,
    "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "0", "-pix_fmt", "yuv420p", "-t", "2", "-y", mp4]);
  const yuvOut = path.join(TMP, `${tag}.yuv`);
  try {
    ffmpeg(["-i", mp4, "-filter_complex", "[0:v]select='eq(n,45)'[v]", "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", yuvOut]);
    const encYuv = fs.readFileSync(yuvOut);
    return shared.yuv420Mad(previewYuv.yuv, encYuv, previewYuv.w, previewYuv.h);
  } finally {
    try { fs.unlinkSync(mp4); } catch { /* bỏ qua */ }
    try { fs.unlinkSync(yuvOut); } catch { /* bỏ qua */ }
  }
}
function fmtYuv(m) { return shared.formatYuvMad(m); }

function main() {
  console.log(`== R25 color-matched CRF | cặp ${OPT.pair} | ${W}x${H} | types=${OPT.types.join(",")} | crfs=${OPT.crfs.join(",")} | matrix=${OPT.matrix} | chain=${OPT.chain} | repeat=${OPT.repeat} ==`);
  console.log(`A: ${OPT.clipA} (cửa sổ ${OPT.winA}–${OPT.winA + 2}s)`);
  console.log(`B: ${OPT.clipB} (cửa sổ ${OPT.winB}–${OPT.winB + 2}s)`);
  const metaA = shared.probeColorMetadata(OPT.clipA);
  const metaB = shared.probeColorMetadata(OPT.clipB);
  console.log(`metadata A: codec=${metaA.codec} ${metaA.width}x${metaA.height} color_space=${metaA.colorSpace} transfer=${metaA.colorTransfer} primaries=${metaA.colorPrimaries} range=${metaA.colorRange}`);
  console.log(`metadata B: codec=${metaB.codec} ${metaB.width}x${metaB.height} color_space=${metaB.colorSpace} transfer=${metaB.colorTransfer} primaries=${metaB.colorPrimaries} range=${metaB.colorRange}`);

  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "df-js");
  if (typeof tp.radialGradientWeight === "function") shared.setRadialWeight(tp.radialGradientWeight);
  if (typeof df.ffmpegDissolveFrand === "function") shared.setDissolveFrand(df.ffmpegDissolveFrand);
  const frameA = sourceFrame(OPT.clipA, OPT.winA, 45, "srcA-45");
  const frameB = sourceFrame(OPT.clipB, OPT.winB, 15, "srcB-15");

  // Xác định preview matrix (chưa cần type vì preview frame theo type).
  let previewMatrix = null;
  let matrixHow = "";
  if (OPT.matrix === "auto") {
    const mA = shared.matrixForMetadata(metaA);
    const mB = shared.matrixForMetadata(metaB);
    if (mA !== mB) throw new Error(`matrix auto thất bại: A=${mA} khác B=${mB} — không đoán, dùng --matrix probe hoặc chỉ định tường minh`);
    previewMatrix = mA;
    matrixHow = "auto: metadata cả 2 nguồn đồng nhất";
  } else if (OPT.matrix === "bt709" || OPT.matrix === "bt601") {
    previewMatrix = OPT.matrix;
    matrixHow = `ép tường minh --matrix ${OPT.matrix} (giả định, không phải auto từ metadata)`;
  } else if (OPT.matrix === "probe") {
    // Probe trên dissolve (type đầu tiên nếu có dissolve, else type đầu).
    const probeType = "dissolve";
    const visP = tp.describeTransition(probeType, 0.5, W, H);
    const pvP = previewFrame(visP, frameA, frameB);
    const pv601 = shared.ffmpegRgbToYuv420Matched(pvP, W, H, TMP, "probe-prev601", "bt601");
    const pv709 = shared.ffmpegRgbToYuv420Matched(pvP, W, H, TMP, "probe-prev709", "bt709");
    const f601 = defaultChainFloorCrf0(pv601, "probe-floor601");
    const f709 = defaultChainFloorCrf0(pv709, "probe-floor709");
    console.log(`R25-probe | chuỗi mặc định crf0 vs preview-bt601 | ${fmtYuv(f601)}`);
    console.log(`R25-probe | chuỗi mặc định crf0 vs preview-bt709 | ${fmtYuv(f709)}`);
    const pick601 = f601.mad <= f709.mad;
    const best = pick601 ? f601 : f709;
    const other = pick601 ? f709 : f601;
    previewMatrix = pick601 ? "bt601" : "bt709";
    matrixHow = `probe thực nghiệm: sàn crf0 chuỗi mặc định nhỏ hơn ở ${previewMatrix} (MAD ${best.mad.toFixed(4)} so với ${other.mad.toFixed(4)} ở matrix kia)`;
    console.log(`R25-probe | matrix hiệu dụng của chuỗi mặc định = ${previewMatrix} (${matrixHow})`);
    if (OPT.probeOnly) {
      console.log("R25-probe | --probe-only: dừng sau probe, không quét crf.");
      const probeOut = { pair: OPT.pair, matrixHow, probe: { bt601: f601, bt709: f709, effective: previewMatrix }, cells: [] };
      if (OPT.out) {
        fs.mkdirSync(path.dirname(path.resolve(OPT.out)), { recursive: true });
        writeFileEpermRetry(OPT.out, JSON.stringify(probeOut, null, 2));
        console.log(`JSON đã ghi: ${OPT.out}`);
      }
      return probeOut;
    }
    if (!(best.mad <= 2 && best.le8 >= 0.99)) {
      throw new Error(`probe thất bại: sàn crf0 tốt nhất vẫn không KHỚP (MAD ${best.mad.toFixed(4)}, ≤8 ${(best.le8 * 100).toFixed(2)}%) — không gán matrix`);
    }
  } else {
    throw new Error(`--matrix không hỗ trợ: ${OPT.matrix}`);
  }
  console.log(`preview matrix = ${previewMatrix} (${matrixHow}); chain = ${OPT.chain}`);

  const results = { pair: OPT.pair, size: `${W}x${H}`, windows: { a: OPT.winA, b: OPT.winB }, metadata: { a: metaA, b: metaB }, previewMatrix, matrixHow, chain: OPT.chain, method: "matched: chuỗi sản phẩm (hoặc forced theo --chain) vs preview chuyển cùng matrix", cells: [] };
  for (const type of OPT.types) {
    const vis = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(vis, frameA, frameB);
    // Guard RGB: chuỗi rgb24 tại n=45 phải khớp preview RGB.
    const rgbOut = path.join(TMP, `guard-${type}.raw`);
    const NORM = normChain();
    ffmpeg(["-ss", String(OPT.winA), "-t", "2", "-i", OPT.clipA, "-ss", String(OPT.winB), "-t", "2", "-i", OPT.clipB,
      "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,select='eq(n,45)'[v]`,
      "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", rgbOut]);
    const chainRgb = fs.readFileSync(rgbOut);
    fs.unlinkSync(rgbOut);
    const rgbM = compareRgb(preview, chainRgb);
    const rgbVerdict = rgbM.mad <= 2 && rgbM.le8 >= 0.99 ? "KHỚP" : rgbM.mad <= 20 && rgbM.le8 >= 0.90 ? "XẤP XỈ" : "LỆCH";
    console.log(`R25-cm | ${OPT.pair} ${type} guard RGB n=45 | MAD=${rgbM.mad.toFixed(4)} ≤8=${(rgbM.le8 * 100).toFixed(2)}% ${rgbVerdict}`);
    if (rgbVerdict !== "KHỚP") {
      console.log(`R25-cm | ${OPT.pair} ${type} BỎ QUA YUV: guard RGB không KHỚP (khung lệch hoặc mô hình preview lệch)`);
      results.cells.push({ type, guardRgb: rgbM, guardVerdict: rgbVerdict, skipped: true });
      continue;
    }
    const previewYuv = shared.ffmpegRgbToYuv420Matched(preview, W, H, TMP, `prev-${type}`, previewMatrix);
    for (const crf of OPT.crfs) {
      const runs = [];
      for (let rep = 1; rep <= OPT.repeat; rep++) {
        const m = encodeOnce(type, crf, previewYuv, `enc-${type}-crf${crf}-r${rep}`);
        runs.push(m);
        console.log(`R25-cm | ${OPT.pair} ${type} crf${crf} lần ${rep}/${OPT.repeat} | ${fmtYuv(m)}`);
      }
      const v1 = shared.classifyYuvRef(runs[0]);
      const repeatMatch = runs.every((m) => shared.classifyYuvRef(m) === v1);
      const maxMadDiff = Math.max(...runs.map((m) => Math.abs(m.mad - runs[0].mad)));
      const maxLe8Diff = Math.max(...runs.map((m) => Math.abs(m.le8 - runs[0].le8)));
      console.log(`R25-cm | ${OPT.pair} ${type} crf${crf} TỔNG HỢP | verdict lần 1=${v1} repeatVerdictMatch=${repeatMatch} maxMadDiff=${maxMadDiff.toFixed(4)} maxLe8Diff=${maxLe8Diff.toFixed(4)}`);
      results.cells.push({ type, crf, guardRgb: rgbM, guardVerdict: rgbVerdict, runs, verdict: v1, repeatVerdictMatch: repeatMatch, maxMadDiff, maxLe8Diff });
    }
  }
  if (OPT.out) {
    fs.mkdirSync(path.dirname(path.resolve(OPT.out)), { recursive: true });
    writeFileEpermRetry(OPT.out, JSON.stringify(results, null, 2));
    console.log(`JSON đã ghi: ${OPT.out}`);
  }
  return results;
}

let out;
try {
  out = main();
} finally {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  console.log(`r25 scratch run đã xoá: ${TMP} (còn lại: ${fs.existsSync(TMP) ? "VẪN CÒN — CẦN DỌN TAY" : "không còn"})`);
}
