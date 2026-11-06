#!/usr/bin/env node
/**
 * measure_r28_l6_dip_coverage.js — Phase 9 đợt 28, luồng L6: đo phủ dip
 * (nợ đợt 27 §3.6 / đợt 27 LIMITS §6). Đo là chính; KHÔNG sửa code sản phẩm.
 *
 * Ba chế độ (chạy riêng để dễ kiểm soát thời gian):
 *   --res   : dip canvas ở 1080p (1080x1920, dọc — khớp footage K/L) và
 *             4K (2160x3840) so với render: fadeblack/fadewhite/fadegrays,
 *             cửa sổ ra/vào, p=0.5 (+p=0.1 ở 1080p). Giao thức như J3:
 *             (B) wiring = model code sản phẩm vs tham chiếu FFmpeg độc
 *             lập cho cùng mô hình đơn clip; (A) pair-gap = model vs
 *             xfade cặp FFmpeg; resampled = cả hai về 720x1280 lanczos
 *             rồi so (mô phỏng viewport resample của K3).
 *   --sweep : sweep p (n=31..59, p=0.0333..0.9667) trên footage K->L và
 *             J->L ở 720x1280, cả 3 type, đường rgb + yuv. Vẽ đường lệch
 *             theo p, tìm p lệch nhất, và kiểm tra giả thuyết offset mức
 *             đen YUV (đợt 24 H3 / đợt 25 I4): fadewhite c=(18.10,22.59,
 *             16.04), fadeblack c=-21.05, fadegrays không có c hằng
 *             (thay bằng kiểm tra luma-vs-mean).
 *   --combo : tổ hợp dip + mask-rect / mask-ellipse / SR (scale 1.3 +
 *             rotate 15°) / track (+80,-40) / motion-blur (tmix 3 frame,
 *             weights đều) ở 720x1280, p=0.5, cặp K->L, fadewhite +
 *             fadegrays. Mỗi tổ hợp: sanity (transform không dip),
 *             (B) wiring tổ hợp, (A) gap vs xfade của 2 clip đã transform.
 *             Model transform là cài đặt harness theo đúng ngữ nghĩa đã
 *             ghi trong code preview (maskAlphaAt/scale-rotate/track-shift/
 *             trailing snapshots); bước dip dùng CHÍNH singleClipDipPixel
 *             + describeTransition của sản phẩm. Riêng maskAlphaAt dùng
 *             CHÍNH code sản phẩm (transpile previewEngine.ts).
 *             Vì vậy (B) tổ hợp khóa "dip composite đúng sau transform",
 *             KHÔNG khóa wiring DOM/offscreen của preview (cần browser
 *             như K3) — ghi rõ trong LIMITS, không mạo nhận.
 *
 * Cách dùng:
 *   node measure_r28_l6_dip_coverage.js --res [--json OUT]
 *   node measure_r28_l6_dip_coverage.js --sweep [--json OUT]
 *   node measure_r28_l6_dip_coverage.js --combo [--json OUT]
 *   [--workdir DIR] [--footdir DIR]
 * Raw XOÁ ngay sau mỗi phép đo (sweep giữ buffer trong RAM rồi xoá
 * file). Binary footage + frame trung gian KHÔNG BAO GIỜ nằm trong repo.
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
const MODE_RES = args.includes("--res");
const MODE_SWEEP = args.includes("--sweep");
const MODE_COMBO = args.includes("--combo");
if (!MODE_RES && !MODE_SWEEP && !MODE_COMBO) {
  throw new Error("Chọn ít nhất một chế độ: --res | --sweep | --combo");
}
const WORKDIR = getOpt("--workdir", null);
const JSON_OUT = getOpt("--json", null);
const FOOTDIR = getOpt("--footdir", path.join(os.homedir(), "workspace", "tmp-round28-l6", "footage"));
const TMP = WORKDIR ? path.resolve(WORKDIR) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-l6-"));
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
  // Stub cho @repo-1/video-spec để previewEngine.ts load được (chỉ dùng
  // maskAlphaAt, không đụng các import giá trị khác lúc chạy).
  const stubDir = path.join(TMP, "node_modules", "@repo-1", "video-spec");
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(path.join(stubDir, "package.json"), JSON.stringify({ name: "@repo-1/video-spec", version: "0.0.0", main: "index.js" }));
  fs.writeFileSync(path.join(stubDir, "index.js"), "module.exports = { CHROMA_DEFAULTS:{}, EFFECT_TYPES:[], LUT_IDS:[], STICKER_DEFAULTS:{}, interpolateKeyframes:()=>null, sourceTimeAt:()=>0, speedAt:()=>1 };\n");
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
  // mean(a-b) từng kênh (a = pairYUV, b = pairRGB).
  const s = [0, 0, 0];
  const np = a.length / 3;
  for (let i = 0; i < a.length; i += 3) {
    s[0] += a[i] - b[i]; s[1] += a[i + 1] - b[i + 1]; s[2] += a[i + 2] - b[i + 2];
  }
  return s.map((v) => +(v / np).toFixed(4));
}

/** Model đơn clip bằng CHÍNH code sản phẩm. fadeblack = đường alpha cũ. */
function singleModel(tp, type, window, p, frameClip, W, H) {
  const vis = tp.describeTransition(type, p, W, H);
  const alpha = window === "in" ? vis.b.alpha : vis.a.alpha;
  const t0 = Date.now();
  const buf = Buffer.alloc(W * H * 3);
  if (type === "fadeblack") {
    for (let i = 0; i < W * H * 3; i += 3) {
      buf[i] = Math.round(alpha * frameClip[i]);
      buf[i + 1] = Math.round(alpha * frameClip[i + 1]);
      buf[i + 2] = Math.round(alpha * frameClip[i + 2]);
    }
  } else {
    const mode = vis.dip.mode;
    for (let i = 0; i < W * H * 3; i += 3) {
      const out = tp.singleClipDipPixel([frameClip[i], frameClip[i + 1], frameClip[i + 2]], alpha, mode);
      buf[i] = Math.round(out[0]); buf[i + 1] = Math.round(out[1]); buf[i + 2] = Math.round(out[2]);
    }
  }
  return { buf, alpha, vis, ms: Date.now() - t0 };
}
/** Model fadegrays dùng luma bt601 thay vì mean (chỉ để kiểm tra đường YUV). */
function singleModelLuma(tp, type, window, p, frameClip, W, H) {
  const vis = tp.describeTransition(type, p, W, H);
  const alpha = window === "in" ? vis.b.alpha : vis.a.alpha;
  const buf = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H * 3; i += 3) {
    const g = 0.299 * frameClip[i] + 0.587 * frameClip[i + 1] + 0.114 * frameClip[i + 2];
    buf[i] = Math.round(alpha * frameClip[i] + (1 - alpha) * g);
    buf[i + 1] = Math.round(alpha * frameClip[i + 1] + (1 - alpha) * g);
    buf[i + 2] = Math.round(alpha * frameClip[i + 2] + (1 - alpha) * g);
  }
  return buf;
}

/** Tham chiếu FFmpeg độc lập cho mô hình đơn clip (như J3, thêm fadeblack). */
function ffmpegSingleRef(tp, type, window, p, frameClip, W, H, tagName) {
  const vis = tp.describeTransition(type, p, W, H);
  const alpha = window === "in" ? vis.b.alpha : vis.a.alpha;
  const aInt = Math.round(alpha * 255);
  const clipRaw = path.join(TMP, `${tagName}-clip.raw`);
  const baseRaw = path.join(TMP, `${tagName}-base.raw`);
  const topRaw = path.join(TMP, `${tagName}-top.raw`);
  const outRaw = path.join(TMP, `${tagName}-out.raw`);
  fs.writeFileSync(clipRaw, frameClip);
  if (type === "fadewhite") {
    ffmpeg(["-f", "lavfi", "-i", `color=white:s=${W}x${H}:d=1:r=30`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", baseRaw]);
  } else if (type === "fadeblack") {
    ffmpeg(["-f", "lavfi", "-i", `color=black:s=${W}x${H}:d=1:r=30`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", baseRaw]);
  } else {
    ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", clipRaw,
      "-filter_complex", "[0:v]geq=r='(r(X,Y)+g(X,Y)+b(X,Y))/3':g='(r(X,Y)+g(X,Y)+b(X,Y))/3':b='(r(X,Y)+g(X,Y)+b(X,Y))/3'",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", baseRaw]);
  }
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", clipRaw,
    "-filter_complex", `[0:v]format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='${aInt}'`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-y", topRaw]);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", baseRaw,
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", topRaw,
    "-filter_complex", "[0:v][1:v]overlay=0:0,format=rgb24",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", outRaw]);
  const buf = fs.readFileSync(outRaw);
  rm(clipRaw); rm(baseRaw); rm(topRaw); rm(outRaw);
  return { buf, aInt };
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

/** Xfade cặp, trích các frame n. */
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

/** Downscale frame về tW×tH bằng lanczos (mô phỏng viewport resample). */
function resampleFrame(buf, W, H, tW, tH, tagName) {
  const inp = path.join(TMP, `${tagName}-in.raw`);
  const out = path.join(TMP, `${tagName}-out.raw`);
  fs.writeFileSync(inp, buf);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", inp,
    "-vf", `scale=${tW}:${tH}:flags=lanczos,format=rgb24`,
    "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const r = fs.readFileSync(out);
  rm(inp); rm(out);
  return r;
}

/* ---------------- Chế độ --res: 1080p / 4K ---------------- */
const FLAT_PAIRS = [
  { tag: "rb", a: "red", b: "blue" },
  { tag: "gm", a: "green", b: "magenta" },
];
const RES_TYPES = ["fadeblack", "fadewhite", "fadegrays"];

function flatFramesAt(type, pair, W, H, indices, tagName) {
  // Clip A/B: frame đơn từ nguồn color; pair: xfade trích indices.
  const norm = `fps=30,scale=${W}:${H},format=rgb24,settb=AVTB`;
  const sel = indices.map((n) => `eq(n,${n})`).join("+");
  const outPair = path.join(TMP, `${tagName}-pair.raw`);
  ffmpeg(["-f", "lavfi", "-i", `color=${pair.a}:s=${W}x${H}:d=2:r=30`,
    "-f", "lavfi", "-i", `color=${pair.b}:s=${W}x${H}:d=2:r=30`,
    "-filter_complex", `[0:v]${norm}[a];[1:v]${norm}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='${sel}'[v]`,
    "-map", "[v]", "-f", "rawvideo", "-y", outPair]);
  const pairBuf = fs.readFileSync(outPair);
  rm(outPair);
  const one = (color, tagF) => {
    const out = path.join(TMP, `${tagF}.raw`);
    ffmpeg(["-f", "lavfi", "-i", `color=${color}:s=${W}x${H}:d=1:r=30`,
      "-vf", `scale=${W}:${H},format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-y", out]);
    const b = fs.readFileSync(out);
    rm(out);
    return b;
  };
  return { pairBuf, frameA: one(pair.a, `${tagName}-fa`), frameB: one(pair.b, `${tagName}-fb`) };
}

function runRes(tp, results) {
  console.log("== L6 --res: 1080p (1080x1920) + 4K (2160x3840) ==");
  const sizes = [
    { label: "1080p", W: 1080, H: 1920, ps: [0.5, 0.1] },
    { label: "4K", W: 2160, H: 3840, ps: [0.5] },
  ];
  for (const { label, W, H, ps } of sizes) {
    for (const type of RES_TYPES) {
      // Phẳng: 2 cặp; footage K->L (win 28/24).
      const jobs = [];
      for (const pair of FLAT_PAIRS) jobs.push({ kind: "flat", pair });
      jobs.push({ kind: "footage", pair: { tag: "KL", a: FILE_K, b: FILE_L, winA: 28, winB: 24 } });
      for (const job of jobs) {
        for (const p of ps) {
          const n = Math.round(30 + p * 30);
          const indices = [n];
          let pairBuf, frameA, frameB;
          if (job.kind === "flat") {
            ({ pairBuf, frameA, frameB } = flatFramesAt(type, job.pair, W, H, indices, tag(`res-${label}-${type}-${job.pair.tag}-${n}`)));
          } else {
            pairBuf = xfadeFrames(type, job.pair.a, job.pair.winA, job.pair.b, job.pair.winB, indices, W, H, "rgb", tag(`res-${label}-${type}-KL-pair`));
            const srcA = extractFrames(job.pair.a, job.pair.winA, [n], W, H, "rgb", tag(`res-${label}-${type}-KL-A`));
            const srcB = extractFrames(job.pair.b, job.pair.winB, [n - 30], W, H, "rgb", tag(`res-${label}-${type}-KL-B`));
            frameA = frameAt(srcA, 0, W, H); frameB = frameAt(srcB, 0, W, H);
          }
          const pairFrame = frameAt(pairBuf, 0, W, H);
          for (const window of ["out", "in"]) {
            const clipFrame = window === "out" ? frameA : frameB;
            const { buf: single, alpha, ms } = singleModel(tp, type, window, p, clipFrame, W, H);
            const mA = compareFrames(pairFrame, single);
            const { buf: ref } = ffmpegSingleRef(tp, type, window, p, clipFrame, W, H, tag(`res-${label}-${type}-${job.pair.tag}-${window}-${n}`));
            const mB = compareFrames(ref, single);
            const rsPair = resampleFrame(pairFrame, W, H, 720, 1280, tag(`res-rs-pair`));
            const rsSingle = resampleFrame(single, W, H, 720, 1280, tag(`res-rs-single`));
            const mAr = compareFrames(rsPair, rsSingle);
            const rsRef = resampleFrame(ref, W, H, 720, 1280, tag(`res-rs-ref`));
            const mBr = compareFrames(rsRef, rsSingle);
            console.log(`res | ${label} | ${type} | ${job.pair.tag} | ${window} | p=${p} | (B) ${fmt(mB)} resampled ${fmt(mBr)} | (A) ${fmt(mA)} resampled ${fmt(mAr)} | modelMs=${ms}`);
            results.rows.push({ size: label, W, H, kind: job.kind, pair: job.pair.tag, type, window, p, alpha: +alpha.toFixed(6), modelMs: ms,
              wiring: { mad: +mB.mad.toFixed(4), le8: +mB.le8.toFixed(4), verdict: classify(mB) },
              wiringResampled: { mad: +mBr.mad.toFixed(4), le8: +mBr.le8.toFixed(4), verdict: classify(mBr) },
              pairGap: { mad: +mA.mad.toFixed(4), le8: +mA.le8.toFixed(4), verdict: classify(mA) },
              pairGapResampled: { mad: +mAr.mad.toFixed(4), le8: +mAr.le8.toFixed(4), verdict: classify(mAr) } });
          }
        }
      }
    }
  }
}

/* ---------------- Chế độ --sweep: sweep p trên footage ---------------- */
const YUV_C = { fadeblack: [-21.05, -21.05, -21.05], fadewhite: [18.10, 22.59, 16.04] };

function runSweep(tp, results) {
  console.log("== L6 --sweep: p grid n=31..59, 720x1280 ==");
  const W = 720, H = 1280;
  const indices = [];
  for (let n = 31; n <= 59; n++) indices.push(n);
  const pairs = [
    { tag: "KL", a: FILE_K, b: FILE_L, winA: 28, winB: 24 },
    { tag: "JL", a: FILE_J, b: FILE_L, winA: 28, winB: 24 },
  ];
  for (const pair of pairs) {
    for (const type of RES_TYPES) {
      for (const pathName of ["rgb", "yuv"]) {
        const pairBuf = xfadeFrames(type, pair.a, pair.winA, pair.b, pair.winB, indices, W, H, pathName, tag(`sw-${pair.tag}-${type}-${pathName}-pair`));
        const srcA = extractFrames(pair.a, pair.winA, indices, W, H, pathName, tag(`sw-${pair.tag}-${type}-${pathName}-A`));
        const srcB = extractFrames(pair.b, pair.winB, indices.map((n) => n - 30), W, H, pathName, tag(`sw-${pair.tag}-${type}-${pathName}-B`));
        for (let k = 0; k < indices.length; k++) {
          const n = indices[k];
          const p = (n - 30) / 30;
          const pairFrame = frameAt(pairBuf, k, W, H);
          for (const window of ["out", "in"]) {
            const clipFrame = window === "out" ? frameAt(srcA, k, W, H) : frameAt(srcB, k, W, H);
            const { buf: single, vis } = singleModel(tp, type, window, p, clipFrame, W, H);
            const mA = compareFrames(pairFrame, single);
            const row = { pair: pair.tag, type, window, p: +p.toFixed(4), n, path: pathName,
              aAlpha: +vis.a.alpha.toFixed(6), bAlpha: +vis.b.alpha.toFixed(6),
              dipA: vis.dip ? +vis.dip.a.toFixed(6) : null, dipB: vis.dip ? +vis.dip.b.toFixed(6) : null,
              pairGap: { mad: +mA.mad.toFixed(4), le8: +mA.le8.toFixed(4), verdict: classify(mA) } };
            results.rows.push(row);
          }
        }
        console.log(`sweep | ${pair.tag} | ${type} | ${pathName} | 29 p x 2 window done`);
      }
    }
  }
  // Tổng hợp worst-p từ gap đã có (corrected chạy riêng ở runSweepCorrected).
  for (const pair of pairs) {
    for (const type of RES_TYPES) {
      for (const window of ["out", "in"]) {
        for (const pathName of ["rgb", "yuv"]) {
          const rows = results.rows.filter((r) => r.pair === pair.tag && r.type === type && r.window === window && r.path === pathName);
          let worst = rows[0];
          for (const r of rows) if (r.pairGap.mad > worst.pairGap.mad) worst = r;
          console.log(`sweep-worst | ${pair.tag} | ${type} | ${window} | ${pathName} | p=${worst.p} MAD=${worst.pairGap.mad}`);
          results.worst.push({ pair: pair.tag, type, window, path: pathName, p: worst.p, mad: worst.pairGap.mad, le8: worst.pairGap.le8, verdict: worst.pairGap.verdict });
        }
      }
    }
  }
}

/** Kiểm tra offset YUV: corrected pair = pairYUV - c*m (hoặc luma model cho fadegrays). */
function runSweepCorrected(tp, results) {
  console.log("== L6 --sweep-corrected: kiểm tra offset YUV tại các p mẫu ==");
  const W = 720, H = 1280;
  const pairs = [
    { tag: "KL", a: FILE_K, b: FILE_L, winA: 28, winB: 24 },
    { tag: "JL", a: FILE_J, b: FILE_L, winA: 28, winB: 24 },
  ];
  const sampleNs = [33, 38, 45, 52, 57]; // p = 0.1, 0.2667, 0.5, 0.7333, 0.9
  for (const pair of pairs) {
    for (const type of RES_TYPES) {
      const pairRgb = xfadeFrames(type, pair.a, pair.winA, pair.b, pair.winB, sampleNs, W, H, "rgb", tag(`swc-${pair.tag}-${type}-rgb`));
      const pairYuv = xfadeFrames(type, pair.a, pair.winA, pair.b, pair.winB, sampleNs, W, H, "yuv", tag(`swc-${pair.tag}-${type}-yuv`));
      const srcARgb = extractFrames(pair.a, pair.winA, sampleNs, W, H, "rgb", tag(`swc-${pair.tag}-${type}-Argb`));
      const srcBRgb = extractFrames(pair.b, pair.winB, sampleNs.map((n) => n - 30), W, H, "rgb", tag(`swc-${pair.tag}-${type}-Brgb`));
      const srcAYuv = extractFrames(pair.a, pair.winA, sampleNs, W, H, "yuv", tag(`swc-${pair.tag}-${type}-Ayuv`));
      const srcBYuv = extractFrames(pair.b, pair.winB, sampleNs.map((n) => n - 30), W, H, "yuv", tag(`swc-${pair.tag}-${type}-Byuv`));
      for (let k = 0; k < sampleNs.length; k++) {
        const n = sampleNs[k];
        const p = (n - 30) / 30;
        const fRgb = frameAt(pairRgb, k, W, H);
        const fYuv = frameAt(pairYuv, k, W, H);
        const signed = signedMeanDiff(fYuv, fRgb);
        for (const window of ["out", "in"]) {
          const clipRgb = window === "out" ? frameAt(srcARgb, k, W, H) : frameAt(srcBRgb, k, W, H);
          const clipYuv = window === "out" ? frameAt(srcAYuv, k, W, H) : frameAt(srcBYuv, k, W, H);
          const { buf: singleRgb, vis } = singleModel(tp, type, window, p, clipRgb, W, H);
          const { buf: singleYuv } = singleModel(tp, type, window, p, clipYuv, W, H);
          const gapRgb = compareFrames(fRgb, singleRgb);
          const gapYuv = compareFrames(fYuv, singleYuv);
          const m = (vis.dip ? vis.dip.a + vis.dip.b : 0);
          let corrected = null, correctedMad = null;
          if (type !== "fadegrays") {
            const c = YUV_C[type];
            const corr = Buffer.from(fYuv);
            for (let i = 0; i < corr.length; i += 3) {
              corr[i] = Math.max(0, Math.min(255, Math.round(corr[i] - c[0] * m)));
              corr[i + 1] = Math.max(0, Math.min(255, Math.round(corr[i + 1] - c[1] * m)));
              corr[i + 2] = Math.max(0, Math.min(255, Math.round(corr[i + 2] - c[2] * m)));
            }
            corrected = compareFrames(corr, singleYuv);
            correctedMad = +corrected.mad.toFixed(4);
          } else {
            const lumaModel = singleModelLuma(tp, type, window, p, clipYuv, W, H);
            corrected = compareFrames(fYuv, lumaModel);
            correctedMad = +corrected.mad.toFixed(4);
          }
          console.log(`swc | ${pair.tag} | ${type} | ${window} | p=${p.toFixed(4)} | m=${m.toFixed(4)} | signedYUV-RGB=${signed} | gapRGB ${fmt(gapRgb)} | gapYUV ${fmt(gapYuv)} | corrected ${fmt(corrected)}`);
          results.corrected.push({ pair: pair.tag, type, window, p: +p.toFixed(4), m: +m.toFixed(4), signedYuvMinusRgb: signed,
            gapRgb: { mad: +gapRgb.mad.toFixed(4), le8: +gapRgb.le8.toFixed(4), verdict: classify(gapRgb) },
            gapYuv: { mad: +gapYuv.mad.toFixed(4), le8: +gapYuv.le8.toFixed(4), verdict: classify(gapYuv) },
            corrected: { mad: correctedMad, le8: +corrected.le8.toFixed(4), verdict: classify(corrected) } });
        }
      }
    }
  }
}

/* ---------------- Chế độ --combo: dip + mask/SR/track/blur ---------------- */
const COMBO_W = 720, COMBO_H = 1280, COMBO_P = 0.5;
const MASK_RECT = { shape: "rect", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.1 };
const MASK_ELLIPSE = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.1 };
const SR_SCALE = 1.3, SR_ROT = 15 * Math.PI / 180;
const TRACK_DX = 80, TRACK_DY = -40;

/** Model RGBA (Node) cho từng transform, theo ngữ nghĩa preview đã ghi. */
function modelRGBA(combo, pe, frames, W, H) {
  const out = Buffer.alloc(W * H * 4);
  if (combo === "mask-rect" || combo === "mask-ellipse") {
    const mask = combo === "mask-rect" ? MASK_RECT : MASK_ELLIPSE;
    const src = frames[0];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, j = (y * W + x) * 3;
        out[i] = src[j]; out[i + 1] = src[j + 1]; out[i + 2] = src[j + 2];
        out[i + 3] = Math.round(255 * pe.maskAlphaAt(mask, W, H, x, y));
      }
    }
  } else if (combo === "sr") {
    const src = frames[0];
    const cs = Math.cos(SR_ROT), sn = Math.sin(SR_ROT);
    const bilin = (sx, sy) => {
      const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
      if (x0 < 0 || y0 < 0 || x0 + 1 >= W || y0 + 1 >= H) return null;
      const p = (xx, yy) => { const k = (yy * W + xx) * 3; return [src[k], src[k + 1], src[k + 2]]; };
      const p00 = p(x0, y0), p10 = p(x0 + 1, y0), p01 = p(x0, y0 + 1), p11 = p(x0 + 1, y0 + 1);
      return [0, 1, 2].map((c) => Math.round((1 - fx) * (1 - fy) * p00[c] + fx * (1 - fy) * p10[c] + (1 - fx) * fy * p01[c] + fx * fy * p11[c]));
    };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const dx = x + 0.5 - W / 2, dy = y + 0.5 - H / 2;
        const sx = (cs * dx + sn * dy) / SR_SCALE + W / 2 - 0.5;
        const sy = (-sn * dx + cs * dy) / SR_SCALE + H / 2 - 0.5;
        const v = bilin(sx, sy);
        if (!v) { out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 0; }
        else { out[i] = v[0]; out[i + 1] = v[1]; out[i + 2] = v[2]; out[i + 3] = 255; }
      }
    }
  } else if (combo === "track") {
    const src = frames[0];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const sx = x - TRACK_DX, sy = y - TRACK_DY;
        if (sx < 0 || sy < 0 || sx >= W || sy >= H) { out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 0; }
        else { const j = (sy * W + sx) * 3; out[i] = src[j]; out[i + 1] = src[j + 1]; out[i + 2] = src[j + 2]; out[i + 3] = 255; }
      }
    }
  } else if (combo === "blur") {
    // Trung bình trailing đều 3 frame (snapshot preview = các frame đã vẽ
    // trước đó + frame hiện tại; render tmix đã probe là trailing avg).
    for (let k = 0; k < W * H * 3; k++) {
      const px = Math.floor(k / 3);
      out[px * 4 + (k % 3)] = Math.round((frames[0][k] + frames[1][k] + frames[2][k]) / 3);
    }
    for (let px = 0; px < W * H; px++) out[px * 4 + 3] = 255;
  }
  return out;
}
/** Dip lên RGBA rồi composite trên nền đen (đúng drawVideoClipWithDip). */
function dipOverBlack(tp, type, window, p, rgba, W, H) {
  const vis = tp.describeTransition(type, p, W, H);
  const alpha = window === "in" ? vis.b.alpha : vis.a.alpha;
  const mode = vis.dip.mode;
  const out = Buffer.alloc(W * H * 3);
  for (let px = 0; px < W * H; px++) {
    const i = px * 4, j = px * 3;
    const cov = rgba[i + 3] / 255;
    if (cov === 0) { out[j] = 0; out[j + 1] = 0; out[j + 2] = 0; continue; }
    const d = tp.singleClipDipPixel([rgba[i], rgba[i + 1], rgba[i + 2]], alpha, mode);
    out[j] = Math.round(cov * d[0]); out[j + 1] = Math.round(cov * d[1]); out[j + 2] = Math.round(cov * d[2]);
  }
  return { buf: out, alpha };
}
/** Transform trên nền đen (sanity, không dip). */
function transformOverBlack(rgba, W, H) {
  const out = Buffer.alloc(W * H * 3);
  for (let px = 0; px < W * H; px++) {
    const i = px * 4, j = px * 3, cov = rgba[i + 3] / 255;
    out[j] = Math.round(cov * rgba[i]); out[j + 1] = Math.round(cov * rgba[i + 1]); out[j + 2] = Math.round(cov * rgba[i + 2]);
  }
  return out;
}

function maskGeqA(mask, W, H) {
  const band = 0.1 * Math.min(mask.w * W, mask.h * H);
  if (mask.shape === "rect") {
    const x0 = (mask.x - mask.w / 2) * W, x1 = (mask.x + mask.w / 2) * W;
    const y0 = (mask.y - mask.h / 2) * H, y1 = (mask.y + mask.h / 2) * H;
    return `255*min(1,max(0,0.5-max(max(${x0}-X,X-${x1}),max(${y0}-Y,Y-${y1}))/${band}))`;
  }
  const cx = mask.x * W, cy = mask.y * H, rx = mask.w * W / 2, ry = mask.h * H / 2;
  const nx = `(X-${cx})/${rx}`, ny = `(Y-${cy})/${ry}`;
  const r = `sqrt(${nx}*${nx}+${ny}*${ny})`;
  const gx = `(X-${cx})/${rx * rx}`, gy = `(Y-${cy})/${ry * ry}`;
  const grad = `sqrt(${gx}*${gx}+${gy}*${gy})`;
  return `255*min(1,max(0,0.5-((${r}-1)/${grad})/${band}))`;
}
/** RGBA tham chiếu FFmpeg cho 1 frame đơn (mask/sr/track). */
function ffmpegRefRGBA(combo, frame, W, H, tagName) {
  const inp = path.join(TMP, `${tagName}-in.raw`);
  const out = path.join(TMP, `${tagName}-out.raw`);
  fs.writeFileSync(inp, frame);
  if (combo === "mask-rect" || combo === "mask-ellipse") {
    const mask = combo === "mask-rect" ? MASK_RECT : MASK_ELLIPSE;
    ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", inp,
      "-filter_complex", `[0:v]format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='${maskGeqA(mask, W, H)}'`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-y", out]);
  } else if (combo === "sr") {
    ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", inp,
      "-filter_complex", `[0:v]format=rgba,scale=${Math.round(W * SR_SCALE)}:${Math.round(H * SR_SCALE)}:flags=bilinear,rotate=a=${SR_ROT}:ow=${W}:oh=${H}:c=none,format=rgba`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-y", out]);
  } else if (combo === "track") {
    const bg = path.join(TMP, `${tagName}-bg.raw`);
    fs.writeFileSync(bg, Buffer.alloc(W * H * 4));
    ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", bg,
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", inp,
      "-filter_complex", "[0:v]format=rgba[bg];[1:v]format=rgba[fg];[bg][fg]overlay=x=80:y=-40,format=rgba",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-y", out]);
    rm(bg);
  }
  const buf = fs.readFileSync(out);
  rm(inp); rm(out);
  return buf;
}
/** Dip geq lên RGBA rồi overlay lên nền đen → RGB. */
function ffmpegDipOverBlack(type, alpha, rgba, W, H, tagName) {
  const inp = path.join(TMP, `${tagName}-in.raw`);
  const dipRaw = path.join(TMP, `${tagName}-dip.raw`);
  const out = path.join(TMP, `${tagName}-out.raw`);
  fs.writeFileSync(inp, rgba);
  const a = alpha.toFixed(6);
  const dipExpr = type === "fadewhite"
    ? `r='${a}*r(X,Y)+(1-${a})*255':g='${a}*g(X,Y)+(1-${a})*255':b='${a}*b(X,Y)+(1-${a})*255'`
    : `r='${a}*r(X,Y)+(1-${a})*(r(X,Y)+g(X,Y)+b(X,Y))/3':g='${a}*g(X,Y)+(1-${a})*(r(X,Y)+g(X,Y)+b(X,Y))/3':b='${a}*b(X,Y)+(1-${a})*(r(X,Y)+g(X,Y)+b(X,Y))/3'`;
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", inp,
    "-filter_complex", `[0:v]geq=${dipExpr}:a='alpha(X,Y)'`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-y", dipRaw]);
  ffmpeg(["-f", "lavfi", "-i", `color=black:s=${W}x${H}:d=1:r=30`,
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", dipRaw,
    "-filter_complex", "[0:v][1:v]overlay=0:0,format=rgb24",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  const buf = fs.readFileSync(out);
  rm(inp); rm(dipRaw); rm(out);
  return buf;
}
/** Overlay RGBA lên nền đen → RGB. */
function ffmpegOverBlack(rgba, W, H, tagName) {
  const inp = path.join(TMP, `${tagName}-in.raw`);
  const out = path.join(TMP, `${tagName}-out.raw`);
  fs.writeFileSync(inp, rgba);
  ffmpeg(["-f", "lavfi", "-i", `color=black:s=${W}x${H}:d=1:r=30`,
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", inp,
    "-filter_complex", "[0:v][1:v]overlay=0:0,format=rgb24",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  const buf = fs.readFileSync(out);
  rm(inp); rm(out);
  return buf;
}

/**
 * Stream transform 1s (A: winA+1..winA+2, B: winB..winB+1) rồi xfade
 * offset=0, trích frame n=15 (p=0.5). Đối tác render của tổ hợp.
 */
function comboPairFrame(combo, type, W, H, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  const norm = `fps=30,scale=${W}:${H},format=rgb24,settb=AVTB`;
  const black = `color=black:s=${W}x${H}:d=1:r=30`;
  const tfBody = () => {
    if (combo === "mask-rect" || combo === "mask-ellipse") {
      const mask = combo === "mask-rect" ? MASK_RECT : MASK_ELLIPSE;
      return `format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='${maskGeqA(mask, W, H)}'`;
    }
    return `format=rgba,scale=${Math.round(W * SR_SCALE)}:${Math.round(H * SR_SCALE)}:flags=bilinear,rotate=a=${SR_ROT}:ow=${W}:oh=${H}:c=none,format=rgba`;
  };
  if (combo === "blur") {
    ffmpeg(["-ss", "29", "-t", "1", "-i", FILE_K, "-ss", "24", "-t", "1", "-i", FILE_L,
      "-filter_complex", `[0:v]${norm},tmix=frames=3:weights='1 1 1',format=rgb24[a];[1:v]${norm},tmix=frames=3:weights='1 1 1',format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=0,format=rgb24,select='eq(n,15)'[v]`,
      "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  } else if (combo === "track") {
    ffmpeg(["-ss", "29", "-t", "1", "-i", FILE_K, "-ss", "24", "-t", "1", "-i", FILE_L,
      "-f", "lavfi", "-i", black, "-f", "lavfi", "-i", black,
      "-filter_complex", `[0:v]${norm},format=rgba[fgA];[1:v]${norm},format=rgba[fgB];[2:v][fgA]overlay=x=80:y=-40,format=rgb24[a];[3:v][fgB]overlay=x=80:y=-40,format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=0,format=rgb24,select='eq(n,15)'[v]`,
      "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  } else {
    ffmpeg(["-ss", "29", "-t", "1", "-i", FILE_K, "-ss", "24", "-t", "1", "-i", FILE_L,
      "-f", "lavfi", "-i", black, "-f", "lavfi", "-i", black,
      "-filter_complex", `[0:v]${norm},${tfBody()}[fgA];[1:v]${norm},${tfBody()}[fgB];[2:v][fgA]overlay=0:0,format=rgb24[a];[3:v][fgB]overlay=0:0,format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=0,format=rgb24,select='eq(n,15)'[v]`,
      "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  }
  const buf = fs.readFileSync(out);
  rm(out);
  return buf;
}
/** Frame tmix từ cùng cửa sổ 2s với frame model (tránh lệch phase fps). */
function blurStreamFrame(file, win, n, W, H, tagName) {
  const out = path.join(TMP, `${tagName}.raw`);
  const norm = `fps=30,scale=${W}:${H},format=rgb24,settb=AVTB`;
  ffmpeg(["-vsync", "0", "-ss", String(win), "-t", "2", "-i", file,
    "-filter_complex", `[0:v]${norm},tmix=frames=3:weights='1 1 1',format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const buf = fs.readFileSync(out);
  rm(out);
  return buf;
}

function runCombo(tp, pe, results) {
  console.log("== L6 --combo: 720x1280, p=0.5, K->L ==");
  const W = COMBO_W, H = COMBO_H, p = COMBO_P;
  // Frame nguồn: A local 1.5 (n=45), B local 0.5 (n=15); blur thêm n-2,n-1.
  const srcA = extractFrames(FILE_K, 28, [43, 44, 45], W, H, "rgb", tag("combo-A"));
  const srcB = extractFrames(FILE_L, 24, [13, 14, 15], W, H, "rgb", tag("combo-B"));
  const combos = ["mask-rect", "mask-ellipse", "sr", "track", "blur"];
  for (const combo of combos) {
    const framesA = combo === "blur" ? [frameAt(srcA, 0, W, H), frameAt(srcA, 1, W, H), frameAt(srcA, 2, W, H)] : [frameAt(srcA, 2, W, H)];
    const framesB = combo === "blur" ? [frameAt(srcB, 0, W, H), frameAt(srcB, 1, W, H), frameAt(srcB, 2, W, H)] : [frameAt(srcB, 2, W, H)];
    const rgbaA = modelRGBA(combo, pe, framesA, W, H);
    const rgbaB = modelRGBA(combo, pe, framesB, W, H);
    const modelTobA = transformOverBlack(rgbaA, W, H);
    const modelTobB = transformOverBlack(rgbaB, W, H);
    // Sanity: transform không dip, CÙNG frame nguồn với model (không dùng
    // stream cửa sổ khác — bài học: fps=30 từ 23,976fps lệch phase giữa
    // cửa sổ 1s và 2s, gây nhiễu ~1,5 MAD trên footage K chi tiết).
    let refSanA, refSanB, refRgbaA = null, refRgbaB = null;
    if (combo === "blur") {
      refSanA = blurStreamFrame(FILE_K, 28, 45, W, H, tag(`combo-san-${combo}-A`));
      refSanB = blurStreamFrame(FILE_L, 24, 15, W, H, tag(`combo-san-${combo}-B`));
    } else {
      refRgbaA = ffmpegRefRGBA(combo, framesA[0], W, H, tag(`combo-ref-${combo}-A`));
      refRgbaB = ffmpegRefRGBA(combo, framesB[0], W, H, tag(`combo-ref-${combo}-B`));
      refSanA = ffmpegOverBlack(refRgbaA, W, H, tag(`combo-san-${combo}-A`));
      refSanB = ffmpegOverBlack(refRgbaB, W, H, tag(`combo-san-${combo}-B`));
    }
    const mSanA = compareFrames(refSanA, modelTobA);
    const mSanB = compareFrames(refSanB, modelTobB);
    console.log(`combo | ${combo} | sanity-out ${fmt(mSanA)} | sanity-in ${fmt(mSanB)}`);
    results.rows.push({ combo, check: "sanity", window: "out", sanity: { mad: +mSanA.mad.toFixed(4), le8: +mSanA.le8.toFixed(4), verdict: classify(mSanA) } });
    results.rows.push({ combo, check: "sanity", window: "in", sanity: { mad: +mSanB.mad.toFixed(4), le8: +mSanB.le8.toFixed(4), verdict: classify(mSanB) } });
    for (const type of ["fadewhite", "fadegrays"]) {
      const pairFrame = comboPairFrame(combo, type, W, H, tag(`combo-pair-${combo}-${type}`));
      for (const window of ["out", "in"]) {
        const rgba = window === "out" ? rgbaA : rgbaB;
        const { buf: modelDip, alpha } = dipOverBlack(tp, type, window, p, rgba, W, H);
        let refDip;
        if (combo === "blur") {
          // Blur: ref RGBA = tmix frame (opaque); dip geq lên đó.
          const tmixFrame = window === "out" ? refSanA : refSanB;
          const rgbaTmp = Buffer.alloc(W * H * 4);
          for (let px = 0; px < W * H; px++) {
            const j = px * 3, i = px * 4;
            rgbaTmp[i] = tmixFrame[j]; rgbaTmp[i + 1] = tmixFrame[j + 1]; rgbaTmp[i + 2] = tmixFrame[j + 2]; rgbaTmp[i + 3] = 255;
          }
          refDip = ffmpegDipOverBlack(type, alpha, rgbaTmp, W, H, tag(`combo-ref-${combo}-${type}-${window}`));
        } else {
          const refRgba = window === "out" ? refRgbaA : refRgbaB;
          refDip = ffmpegDipOverBlack(type, alpha, refRgba, W, H, tag(`combo-dip-${combo}-${type}-${window}`));
        }
        const mB = compareFrames(refDip, modelDip);
        const mA = compareFrames(pairFrame, modelDip);
        console.log(`combo | ${combo} | ${type} | ${window} | p=0.5 | (B) ${fmt(mB)} | (A) ${fmt(mA)}`);
        results.rows.push({ combo, type, window, p, alpha: +alpha.toFixed(6),
          wiring: { mad: +mB.mad.toFixed(4), le8: +mB.le8.toFixed(4), verdict: classify(mB) },
          pairGap: { mad: +mA.mad.toFixed(4), le8: +mA.le8.toFixed(4), verdict: classify(mA) } });
      }
    }
  }
}

/* ---------------- main ---------------- */
function main() {
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  console.log(`workdir: ${TMP}`);
  for (const f of [FILE_K, FILE_J, FILE_L]) if (!fs.existsSync(f)) throw new Error(`Không thấy footage: ${f} — chạy scripts/fetch-r22-footage.sh trước.`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const pe = MODE_COMBO ? transpileTs(path.join("apps", "web", "src", "lib", "previewEngine.ts"), "pe-js") : null;
  const results = { mode: [MODE_RES && "res", MODE_SWEEP && "sweep", MODE_COMBO && "combo"].filter(Boolean).join("+"), workdir: TMP, rows: [], worst: [], corrected: [] };
  if (MODE_RES) runRes(tp, results);
  if (MODE_SWEEP) { runSweep(tp, results); runSweepCorrected(tp, results); }
  if (MODE_COMBO) runCombo(tp, pe, results);
  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify(results, null, 2) + "\n");
    console.log(`JSON: ${JSON_OUT}`);
  }
  console.log(`workdir: ${TMP} (raw đã xoá sau mỗi phép đo)`);
}

main();
