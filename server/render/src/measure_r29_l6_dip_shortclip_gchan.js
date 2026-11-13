#!/usr/bin/env node
/**
 * measure_r29_l6_dip_shortclip_gchan.js — Phase 9 đợt 29, luồng L6.
 *
 * Hai việc còn nợ từ đợt 28 L6 (§6) + đợt 28 LIMITS §3.7:
 *  (1) --short: clip ngắn cả 2 cửa sổ transition cùng active (alpha
 *      tích, dip theo cửa sổ vào — transitionClipVisual). Đo (B) wiring:
 *      model CHÍNH code sản phẩm (transitionClipVisual + singleClipDipPixel)
 *      vs tham chiếu FFmpeg độc lập cho cùng mô hình đơn clip; và (A)
 *      gap cặp: model vs chuỗi xfade kép A->B->C của render (B là clip
 *      ngắn 1.5s, transition 1s mỗi đầu, vùng chồng [0.5,1) local).
 *  (2) --gchan: truy nguyên kênh G của fadeblack YUV (fit -21,05 nhưng
 *      signed G lệch ít hơn R/B). Đo signed từng kênh R/G/B trên phẳng +
 *      footage, fit slope từng kênh theo m = dip.a+dip.b, đảo ma trận
 *      bt601 từ (dR,dG,dB) ra (dY,dCb,dCr), đo tỷ lệ clip 0/255 từng kênh,
 *      và đo roundtrip yuv420p của chính frame RGB (tách hiệu ứng
 *      chuyển đổi khỏi hiệu ứng blend của xfade). Kết luận bằng số,
 *      không đoán.
 *
 * Cách dùng (từ gốc repo):
 *   node server/render/src/measure_r29_l6_dip_shortclip_gchan.js --short [--json OUT]
 *   node server/render/src/measure_r29_l6_dip_shortclip_gchan.js --gchan [--json OUT]
 *   [--workdir DIR] [--footdir DIR]
 * Raw XOÁ ngay sau mỗi phép đo. Footage + frame trung gian KHÔNG nằm
 * trong repo (footdir mặc định là footage đợt 28 đã verify SHA).
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
const MODE_SHORT = args.includes("--short");
const MODE_GCHAN = args.includes("--gchan");
if (!MODE_SHORT && !MODE_GCHAN) throw new Error("Chọn ít nhất một chế độ: --short | --gchan");
const WORKDIR = getOpt("--workdir", null);
const JSON_OUT = getOpt("--json", null);
const FOOTDIR = getOpt("--footdir", path.join(os.homedir(), "workspace", "tmp-round28-l6", "footage"));
const TMP = WORKDIR ? path.resolve(WORKDIR) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-l6-r29-"));
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
  spawnSync(tsc, [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}`);
  return require(jsFile);
}

function compareFrames(a, b) {
  let sum = 0, le8 = 0;
  const n = a.length;
  for (let k = 0; k < n; k++) {
    const d = Math.abs(a[k] - b[k]);
    sum += d;
    if (d <= 8) le8++;
  }
  return { mad: sum / n, le8: le8 / n };
}
function classify(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le8 >= 0.90) return "XẤP XỈ";
  return "LỆCH";
}
function fmt(m) { return `MAD=${m.mad.toFixed(4)} <=8:${(m.le8 * 100).toFixed(2)}% ${classify(m)}`; }
function signedMeanDiff(a, b) {
  const s = [0, 0, 0];
  const np = a.length / 3;
  for (let i = 0; i < a.length; i += 3) {
    s[0] += a[i] - b[i]; s[1] += a[i + 1] - b[i + 1]; s[2] += a[i + 2] - b[i + 2];
  }
  return s.map((v) => +(v / np).toFixed(4));
}

/** Trích các frame n (lưới 30fps) từ cửa sổ 2s của file. path: rgb|yuv. */
function extractFrames(file, win, indices, W, H, pathName, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  const norm = pathName === "rgb"
    ? `fps=30,scale=${W}:${H},format=rgb24,settb=AVTB`
    : `fps=30,scale=${W}:${H},format=yuv420p,settb=AVTB`;
  const post = pathName === "yuv" ? ",format=rgb24" : "";
  const sel = indices.map((n) => `eq(n,${n})`).join("+");
  ffmpeg(["-vsync", "0", "-ss", String(win), "-t", "2", "-i", file,
    "-filter_complex", `[0:v]${norm}${post},select='${sel}'[v]`,
    "-map", "[v]", "-f", "rawvideo", "-y", out]);
  const buf = fs.readFileSync(out);
  rm(out);
  const want = indices.length * W * H * 3;
  if (buf.length !== want) throw new Error(`extractFrames ${tagName}: got ${buf.length} want ${want}`);
  return buf;
}
function frameAt(buf, i, W, H) { return Buffer.from(buf.subarray(i * W * H * 3, (i + 1) * W * H * 3)); }

/** Xfade cặp, trích các frame n (đường rgb|yuv) — như R28. */
function xfadeFrames(type, fileA, winA, fileB, winB, indices, W, H, pathName, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  const norm = pathName === "rgb"
    ? `fps=30,scale=${W}:${H},format=rgb24,settb=AVTB`
    : `fps=30,scale=${W}:${H},format=yuv420p,settb=AVTB`;
  const post = pathName === "yuv" ? ",format=rgb24" : "";
  const sel = indices.map((n) => `eq(n,${n})`).join("+");
  ffmpeg(["-vsync", "0", "-ss", String(winA), "-t", "2", "-i", fileA, "-ss", String(winB), "-t", "2", "-i", fileB,
    "-filter_complex", `[0:v]${norm}[a];[1:v]${norm}[b];[a][b]xfade=transition=${type}:duration=1:offset=1${post},format=rgb24,select='${sel}'[v]`,
    "-map", "[v]", "-f", "rawvideo", "-y", out]);
  const buf = fs.readFileSync(out);
  rm(out);
  const want = indices.length * W * H * 3;
  if (buf.length !== want) throw new Error(`xfadeFrames ${tagName}: got ${buf.length} want ${want}`);
  return buf;
}

/* ---------------- Chế độ --short ---------------- */
/**
 * Model đơn clip cho clip ngắn bằng CHÍNH code sản phẩm:
 * transitionClipVisual (alpha tích + dipMode theo cửa sổ vào) +
 * singleClipDipPixel. fadeblack / cửa sổ vào fadeblack đi đường alpha
 * (dip đen ≡ nền đen) nên model = alpha*clip.
 */
function shortModel(tp, inType, outType, localT, frameClip, W, H) {
  const tv = tp.transitionClipVisual(
    { duration: 1.5, transitionIn: { type: inType, duration: 1 }, transitionOut: { type: outType, duration: 1 } },
    localT, W, H);
  if (tv.window !== "in") throw new Error(`shortModel: window=${tv.window}, muốn "in" ở localT=${localT} (cả 2 cửa sổ phải active)`);
  const alpha = tv.alpha;
  const buf = Buffer.alloc(W * H * 3);
  const mode = tv.dipMode;
  for (let i = 0; i < W * H * 3; i += 3) {
    if (mode === "white" || mode === "gray") {
      const out = tp.singleClipDipPixel([frameClip[i], frameClip[i + 1], frameClip[i + 2]], alpha, mode);
      buf[i] = Math.round(out[0]); buf[i + 1] = Math.round(out[1]); buf[i + 2] = Math.round(out[2]);
    } else {
      buf[i] = Math.round(alpha * frameClip[i]);
      buf[i + 1] = Math.round(alpha * frameClip[i + 1]);
      buf[i + 2] = Math.round(alpha * frameClip[i + 2]);
    }
  }
  return { buf, alpha, dipMode: mode ?? null, tv };
}

/** Tham chiếu FFmpeg độc lập cho mô hình đơn clip với alpha cho trước. */
function ffmpegSingleAlphaRef(alpha, mode, frameClip, W, H, tagName) {
  const clipRaw = path.join(TMP, `${tagName}-clip.raw`);
  const baseRaw = path.join(TMP, `${tagName}-base.raw`);
  const topRaw = path.join(TMP, `${tagName}-top.raw`);
  const outRaw = path.join(TMP, `${tagName}-out.raw`);
  writeFileEpermRetry(clipRaw, frameClip);
  if (mode === "white") {
    ffmpeg(["-f", "lavfi", "-i", `color=white:s=${W}x${H}:d=1:r=30`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", baseRaw]);
  } else if (mode === "black" || mode === null || mode === undefined) {
    ffmpeg(["-f", "lavfi", "-i", `color=black:s=${W}x${H}:d=1:r=30`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", baseRaw]);
  } else {
    ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", clipRaw,
      "-filter_complex", "[0:v]geq=r='(r(X,Y)+g(X,Y)+b(X,Y))/3':g='(r(X,Y)+g(X,Y)+b(X,Y))/3':b='(r(X,Y)+g(X,Y)+b(X,Y))/3'",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", baseRaw]);
  }
  const aInt = Math.round(alpha * 255);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", clipRaw,
    "-filter_complex", `[0:v]format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='${aInt}'`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-y", topRaw]);
  // overlay format=rgb: ép blend trong RGB (mặc định overlay chuyển qua
  // yuv420p gây nhiễu ~1–2,5 MAD trên dip xám — đã chứng minh: cùng case
  // FG/FW localT=0.6 cho MAD 2,33 với overlay mặc định, 0,0000 với
  // format=rgb; xem LIMITS đợt 29 L6 §2).
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", baseRaw,
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", topRaw,
    "-filter_complex", "[0:v][1:v]overlay=0:0:format=rgb,format=rgb24",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", outRaw]);
  const buf = fs.readFileSync(outRaw);
  rm(clipRaw); rm(baseRaw); rm(topRaw); rm(outRaw);
  return buf;
}

/** Frame phẳng đơn từ nguồn color. */
function flatFrame(color, W, H, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  ffmpeg(["-f", "lavfi", "-i", `color=${color}:s=${W}x${H}:d=1:r=30`,
    "-vf", `scale=${W}:${H},format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out);
  rm(out);
  return b;
}

/**
 * Chuỗi xfade kép A(4s) -> B(1.5s) -> C(4s), mỗi xfade 1s.
 * xfade1 offset=3 (bắt đầu ở giây 3 của A); output AB dài 4.5s, B chiếm
 * [3,4.5) với localT = t-3. xfade2 offset=3.5 (bắt đầu ở B local 0.5);
 * output dài 7.5s. Trích frame tại AB-output t = 3+localT.
 */
function chainedFlatFrame(typeIn, typeOut, colA, colB, colC, localT, W, H, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  const n = Math.round((3 + localT) * 30);
  ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W}x${H}:d=4:r=30`,
    "-f", "lavfi", "-i", `color=${colB}:s=${W}x${H}:d=1.5:r=30`,
    "-f", "lavfi", "-i", `color=${colC}:s=${W}x${H}:d=4:r=30`,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[2:v]format=rgb24[c];[a][b]xfade=transition=${typeIn}:duration=1:offset=3[ab];[ab][c]xfade=transition=${typeOut}:duration=1:offset=3.5,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out);
  rm(out);
  return b;
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
  const b = fs.readFileSync(out);
  rm(out);
  return b;
}

function runShort(tp, results) {
  console.log("== L6 --short: clip ngắn 1.5s, cả 2 cửa sổ active ==");
  const W = 720, H = 1280;
  const localTs = [0.6, 0.75, 0.9];
  const combos = [
    { inType: "fadewhite", outType: "fadewhite" },
    { inType: "fadegrays", outType: "fadewhite" },
    { inType: "fadewhite", outType: "fadegrays" },
    { inType: "fadeblack", outType: "fadeblack" },
    { inType: "fadeblack", outType: "fadewhite" },
  ];
  for (const { inType, outType } of combos) {
    for (const localT of localTs) {
      const pIn = localT, pOut = localT - 0.5;
      const frameB = flatFrame("green", W, H, tag(`short-flat-B`));
      const { buf: model, alpha, dipMode } = shortModel(tp, inType, outType, localT, frameB, W, H);
      const ref = ffmpegSingleAlphaRef(alpha, dipMode, frameB, W, H, tag(`short-flat-ref`));
      const mB = compareFrames(ref, model);
      const chain = chainedFlatFrame(inType, outType, "red", "green", "magenta", localT, W, H, tag(`short-flat-chain`));
      const mA = compareFrames(chain, model);
      console.log(`short-flat | in=${inType} out=${outType} | localT=${localT} pIn=${pIn} pOut=${pOut} alpha=${alpha.toFixed(6)} dipMode=${dipMode} | (B) ${fmt(mB)} | (A) ${fmt(mA)}`);
      results.rows.push({ kind: "flat", inType, outType, localT, pIn, pOut, alpha: +alpha.toFixed(6), dipMode,
        wiring: { mad: +mB.mad.toFixed(4), le8: +mB.le8.toFixed(4), verdict: classify(mB) },
        pairGap: { mad: +mA.mad.toFixed(4), le8: +mA.le8.toFixed(4), verdict: classify(mA) } });
    }
  }
  // Phẳng ở 1080p (chỉ (B), chứng minh quy tắc tích không phụ thuộc res).
  {
    const W2 = 1080, H2 = 1920;
    for (const localT of localTs) {
      const frameB = flatFrame("green", W2, H2, tag(`short-1080-B`));
      const { buf: model, alpha, dipMode } = shortModel(tp, "fadewhite", "fadewhite", localT, frameB, W2, H2);
      const ref = ffmpegSingleAlphaRef(alpha, dipMode, frameB, W2, H2, tag(`short-1080-ref`));
      const mB = compareFrames(ref, model);
      console.log(`short-flat-1080p | FW/FW | localT=${localT} alpha=${alpha.toFixed(6)} | (B) ${fmt(mB)}`);
      results.rows.push({ kind: "flat-1080p", inType: "fadewhite", outType: "fadewhite", localT, alpha: +alpha.toFixed(6), dipMode,
        wiring: { mad: +mB.mad.toFixed(4), le8: +mB.le8.toFixed(4), verdict: classify(mB) }, pairGap: null });
    }
  }
  // Footage K -> L(ngắn) -> J, chỉ combo FW/FW (đắt nhất đã đủ tín hiệu).
  for (const localT of localTs) {
    const nB = Math.round(localT * 30);
    const srcB = extractFrames(FILE_L, 24, [nB], W, H, "rgb", tag(`short-foot-B`));
    const frameB = frameAt(srcB, 0, W, H);
    const { buf: model, alpha, dipMode } = shortModel(tp, "fadewhite", "fadewhite", localT, frameB, W, H);
    const ref = ffmpegSingleAlphaRef(alpha, dipMode, frameB, W, H, tag(`short-foot-ref`));
    const mB = compareFrames(ref, model);
    const chain = chainedFootFrame("fadewhite", "fadewhite", localT, W, H, tag(`short-foot-chain`));
    const mA = compareFrames(chain, model);
    console.log(`short-foot | K->L->J FW/FW | localT=${localT} alpha=${alpha.toFixed(6)} | (B) ${fmt(mB)} | (A) ${fmt(mA)}`);
    results.rows.push({ kind: "footage", inType: "fadewhite", outType: "fadewhite", localT, alpha: +alpha.toFixed(6), dipMode,
      wiring: { mad: +mB.mad.toFixed(4), le8: +mB.le8.toFixed(4), verdict: classify(mB) },
      pairGap: { mad: +mA.mad.toFixed(4), le8: +mA.le8.toFixed(4), verdict: classify(mA) } });
  }
}

/* ---------------- Chế độ --gchan ---------------- */
/** Đảo ma trận bt601 full-range: (dR,dG,dB) -> (dY,dCb,dCr). */
function invertBt601(dR, dG, dB) {
  // R = Y + 1.402 Cr; G = Y - 0.344136 Cb - 0.714136 Cr; B = Y + 1.772 Cb.
  // Luma của vector lệch chính là dY (do 0.299+0.587+0.114 = 1); sau đó
  // suy Cr từ R và Cb từ B. Nếu blend YUV là offset thuần Y thì
  // dCb ≈ dCr ≈ 0; nếu chroma cũng dịch thì 2 số này khác 0 có hệ thống.
  const Y = 0.299 * dR + 0.587 * dG + 0.114 * dB;
  const Cr = (dR - Y) / 1.402;
  const Cb = (dB - Y) / 1.772;
  return { dY: +Y.toFixed(4), dCb: +Cb.toFixed(4), dCr: +Cr.toFixed(4) };
}
/** Fit slope qua gốc: signed = c * m (LSQ trên các mẫu). */
function fitSlope(samples) {
  let num = 0, den = 0;
  for (const s of samples) { num += s.signed * s.m; den += s.m * s.m; }
  return den > 0 ? num / den : 0;
}
/** Tỷ lệ pixel clip ở 0 / 255 từng kênh trong frame. */
function clipFractions(frame) {
  const n = frame.length / 3;
  const c = [0, 0, 0, 0, 0, 0]; // loR,hiR,loG,hiG,loB,hiB
  for (let i = 0; i < frame.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      if (frame[i + k] === 0) c[k * 2]++;
      if (frame[i + k] === 255) c[k * 2 + 1]++;
    }
  }
  return c.map((v) => +(v / n).toFixed(4));
}
/** Roundtrip yuv420p của 1 frame RGB (chuyển đổi thuần, không blend). */
function yuvRoundtrip(frame, W, H, tagName) {
  const inp = path.join(TMP, `${tagName}-in.raw`);
  const mid = path.join(TMP, `${tagName}-mid.yuv`);
  const out = path.join(TMP, `${tagName}-out.raw`);
  writeFileEpermRetry(inp, frame);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", inp,
    "-vf", `format=yuv420p`, "-f", "rawvideo", "-y", mid]);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${W}x${H}`, "-i", mid,
    "-vf", `format=rgb24`, "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out);
  rm(inp); rm(mid); rm(out);
  return b;
}
/** Signed từng kênh theo bin độ sáng (dựa trên luma của frame RGB gốc). */
function signedByLumaBin(frameYuv, frameRgb) {
  const bins = [
    { lo: 0, hi: 64, s: [0, 0, 0], n: 0 },
    { lo: 64, hi: 128, s: [0, 0, 0], n: 0 },
    { lo: 128, hi: 192, s: [0, 0, 0], n: 0 },
    { lo: 192, hi: 256, s: [0, 0, 0], n: 0 },
  ];
  for (let i = 0; i < frameRgb.length; i += 3) {
    const luma = 0.299 * frameRgb[i] + 0.587 * frameRgb[i + 1] + 0.114 * frameRgb[i + 2];
    const b = bins.find((x) => luma >= x.lo && luma < x.hi) || bins[3];
    b.s[0] += frameYuv[i] - frameRgb[i];
    b.s[1] += frameYuv[i + 1] - frameRgb[i + 1];
    b.s[2] += frameYuv[i + 2] - frameRgb[i + 2];
    b.n++;
  }
  return bins.map((b) => ({ bin: `${b.lo}-${b.hi}`, n: b.n,
    signed: b.n ? b.s.map((v) => +(v / b.n).toFixed(3)) : [0, 0, 0] }));
}

function runGchan(tp, results) {
  console.log("== L6 --gchan: fadeblack YUV, signed từng kênh ==");
  const W = 720, H = 1280;
  const indices = [];
  for (let n = 31; n <= 59; n++) indices.push(n);
  // --- Phẳng: 2 cặp màu, sweep p, cả 2 cửa sổ, cả 2 đường ---
  const flatPairs = [
    { tag: "rb", a: "red", b: "blue" },
    { tag: "gm", a: "green", b: "magenta" },
  ];
  // Phẳng qua lavfi trực tiếp (xfadeFrames chỉ nhận file).
  function flatXfadeFrames(type, colA, colB, W2, H2, pathName, tagName) {
    const out = path.join(TMP, `${tagName}.raw`);
    const norm = pathName === "rgb"
      ? `fps=30,scale=${W2}:${H2},format=rgb24,settb=AVTB`
      : `fps=30,scale=${W2}:${H2},format=yuv420p,settb=AVTB`;
    const post = pathName === "yuv" ? ",format=rgb24" : "";
    const sel = indices.map((n) => `eq(n,${n})`).join("+");
    ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W2}x${H2}:d=2:r=30`,
      "-f", "lavfi", "-i", `color=${colB}:s=${W2}x${H2}:d=2:r=30`,
      "-filter_complex", `[0:v]${norm}[a];[1:v]${norm}[b];[a][b]xfade=transition=${type}:duration=1:offset=1${post},format=rgb24,select='${sel}'[v]`,
      "-map", "[v]", "-f", "rawvideo", "-y", out]);
    const buf = fs.readFileSync(out);
    rm(out);
    return buf;
  }
  for (const pair of flatPairs) {
    const pairRgb = flatXfadeFrames("fadeblack", pair.a, pair.b, W, H, "rgb", tag(`g-flat-${pair.tag}-rgb`));
    const pairYuv = flatXfadeFrames("fadeblack", pair.a, pair.b, W, H, "yuv", tag(`g-flat-${pair.tag}-yuv`));
    const fitSamples = { out: [], in: [] };
    for (let k = 0; k < indices.length; k++) {
      const n = indices[k];
      const p = (n - 30) / 30;
      const vis = tp.describeTransition("fadeblack", p, W, H);
      const m = vis.dip.a + vis.dip.b;
      const signed = signedMeanDiff(frameAt(pairYuv, k, W, H), frameAt(pairRgb, k, W, H));
      // Cửa sổ ra dùng aAlpha? m chung cho cả 2 cửa sổ tại cùng p của
      // xfade (dip.a+dip.b là tổng trọng số dip của cặp tại p đó).
      fitSamples.out.push({ p, m, signed });
      fitSamples.in.push({ p, m, signed });
      if (k % 7 === 0 || n === 45) {
        console.log(`g-flat | ${pair.tag} | p=${p.toFixed(4)} m=${m.toFixed(4)} | signedYUV-RGB=[${signed.join(",")}] | inv=${JSON.stringify(invertBt601(signed[0], signed[1], signed[2]))}`);
      }
    }
    for (const ch of [0, 1, 2]) {
      const c = fitSlope(fitSamples.out.map((s) => ({ signed: s.signed[ch], m: s.m })));
      console.log(`g-flat-fit | ${pair.tag} | kênh ${["R", "G", "B"][ch]} | slope c=${c.toFixed(4)} (fit LSQ qua gốc trên 29 p)`);
      results.fits.push({ kind: "flat", pair: pair.tag, channel: ["R", "G", "B"][ch], slope: +c.toFixed(4) });
    }
    // Clip fraction + roundtrip tại p=0.5 (n=45).
    const k45 = indices.indexOf(45);
    const fRgb45 = frameAt(pairRgb, k45, W, H);
    const fYuv45 = frameAt(pairYuv, k45, W, H);
    const rt = yuvRoundtrip(fRgb45, W, H, tag(`g-flat-${pair.tag}-rt`));
    console.log(`g-flat-p05 | ${pair.tag} | signed=[${signedMeanDiff(fYuv45, fRgb45).join(",")}] | clipFracYUV(loR,hiR,loG,hiG,loB,hiB)=[${clipFractions(fYuv45).join(",")}] | roundtripSigned=[${signedMeanDiff(rt, fRgb45).join(",")}]`);
    results.rows.push({ kind: "flat-p05", pair: pair.tag, signed: signedMeanDiff(fYuv45, fRgb45),
      clipFracYuv: clipFractions(fYuv45), roundtripSigned: signedMeanDiff(rt, fRgb45),
      inv: invertBt601(...signedMeanDiff(fYuv45, fRgb45)) });
  }
  // --- Footage: KL + JL, fadeblack, sweep p, cả 2 đường ---
  const footPairs = [
    { tag: "KL", a: FILE_K, b: FILE_L, winA: 28, winB: 24 },
    { tag: "JL", a: FILE_J, b: FILE_L, winA: 28, winB: 24 },
  ];
  for (const pair of footPairs) {
    const pairRgb = xfadeFrames("fadeblack", pair.a, pair.winA, pair.b, pair.winB, indices, W, H, "rgb", tag(`g-foot-${pair.tag}-rgb`));
    const pairYuv = xfadeFrames("fadeblack", pair.a, pair.winA, pair.b, pair.winB, indices, W, H, "yuv", tag(`g-foot-${pair.tag}-yuv`));
    const fitSamples = [];
    for (let k = 0; k < indices.length; k++) {
      const n = indices[k];
      const p = (n - 30) / 30;
      const vis = tp.describeTransition("fadeblack", p, W, H);
      const m = vis.dip.a + vis.dip.b;
      const signed = signedMeanDiff(frameAt(pairYuv, k, W, H), frameAt(pairRgb, k, W, H));
      fitSamples.push({ p, m, signed });
    }
    for (const ch of [0, 1, 2]) {
      const c = fitSlope(fitSamples.map((s) => ({ signed: s.signed[ch], m: s.m })));
      console.log(`g-foot-fit | ${pair.tag} | kênh ${["R", "G", "B"][ch]} | slope c=${c.toFixed(4)}`);
      results.fits.push({ kind: "footage", pair: pair.tag, channel: ["R", "G", "B"][ch], slope: +c.toFixed(4) });
    }
    const k45 = indices.indexOf(45);
    const fRgb45 = frameAt(pairRgb, k45, W, H);
    const fYuv45 = frameAt(pairYuv, k45, W, H);
    const signed45 = signedMeanDiff(fYuv45, fRgb45);
    const rt = yuvRoundtrip(fRgb45, W, H, tag(`g-foot-${pair.tag}-rt`));
    const bins = signedByLumaBin(fYuv45, fRgb45);
    console.log(`g-foot-p05 | ${pair.tag} | signed=[${signed45.join(",")}] | inv=${JSON.stringify(invertBt601(signed45[0], signed45[1], signed45[2]))} | clipFracYUV=[${clipFractions(fYuv45).join(",")}] | roundtripSigned=[${signedMeanDiff(rt, fRgb45).join(",")}]`);
    console.log(`g-foot-p05-bins | ${pair.tag} | ${JSON.stringify(bins)}`);
    results.rows.push({ kind: "footage-p05", pair: pair.tag, signed: signed45,
      clipFracYuv: clipFractions(fYuv45), roundtripSigned: signedMeanDiff(rt, fRgb45),
      inv: invertBt601(signed45[0], signed45[1], signed45[2]), bins });
  }
}

/* ---------------- main ---------------- */
function main() {
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  console.log(`workdir: ${TMP}`);
  for (const f of [FILE_K, FILE_J, FILE_L]) if (!fs.existsSync(f)) throw new Error(`Không thấy footage: ${f}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const results = { mode: [MODE_SHORT && "short", MODE_GCHAN && "gchan"].filter(Boolean).join("+"), workdir: TMP, rows: [], fits: [] };
  if (MODE_SHORT) runShort(tp, results);
  if (MODE_GCHAN) runGchan(tp, results);
  if (JSON_OUT) {
    writeFileEpermRetry(JSON_OUT, JSON.stringify(results, null, 2) + "\n");
    console.log(`JSON: ${JSON_OUT}`);
  }
  console.log(`workdir: ${TMP} (raw đã xoá sau mỗi phép đo)`);
}

main();
