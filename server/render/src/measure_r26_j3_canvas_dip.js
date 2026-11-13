#!/usr/bin/env node
/**
 * measure_r26_j3_canvas_dip.js — Phase 9 đợt 26, luồng J3: wiring dip
 * canvas cho fadewhite/fadegrays (đóng nợ follow-up đợt 25 I4 §7).
 *
 * Canvas đơn clip (preview.tsx drawVideoClipWithDip) KHÔNG vẽ được
 * composite cặp (thiếu clip còn lại của cặp) — nó vẽ clip đơn trên nền
 * dip của chính clip đó qua singleClipDipPixel:
 *   single = alpha·clip + (1−alpha)·dip
 * với dip = trắng (fadewhite) hoặc xám mean-kênh theo từng pixel
 * (fadegrays, đường RGB của canvas). Script này đo 3 thứ riêng biệt,
 * đừng gộp verdict của chúng:
 *
 * (B) WIRING — single model (CHÍNH code sản phẩm: describeTransition +
 *     singleClipDipPixel) vs THAM CHIẾU FFmpeg ĐỘC LẬP cho cùng mô hình
 *     đơn clip: nền dip (trắng / xám mean qua geq) + clip phủ alpha
 *     nguyên (geq a=round(255·alpha)) qua overlay. Đây là parity của
 *     THỨ J3 XÂY (wiring canvas). Verdict badge theo thang V6 áp cho
 *     giao thức này + mô hình cặp đã KHỚP của I4 (xem LIMITS).
 * (A) GAP ĐƠN CLIP vs CẶP — single model vs render xfade cặp FFmpeg
 *     cùng p: đo giới hạn kiến trúc (thiếu clip còn lại), KHÔNG phải
 *     lỗi wiring. Kỳ vọng: fadewhite vào KHỚP khi a.alpha = 0
 *     (p ≥ ~0,20); ra lệch đúng bAlpha·(dip−B); fadegrays lệch thêm
 *     dipA·(grayA−grayB) ở cửa sổ vào. Số này ghi để parent thấy rõ
 *     badge "matched" mang nghĩa nào (chuẩn precedent bars-fade:
 *     mô hình cặp KHỚP + canvas vẽ đúng projection đơn clip).
 * (O) TRƯỚC/SAU — model nền đen cũ (alpha·clip trên đen) vs pair xfade:
 *     chứng minh wiring cải thiện bao nhiêu so với hành vi trước J3.
 *
 * Cách dùng (giống script I4):
 *   node measure_r26_j3_canvas_dip.js --flat [--workdir DIR] [--json OUT]
 *   node measure_r26_j3_canvas_dip.js <clipA> <winA> <clipB> <winB> <W> <H>
 *     [--workdir DIR] [--json OUT]
 * Flat: 64×64 @30fps, xfade duration=1 offset=1, 3 cặp phẳng như I4.
 * Footage: frame giữa n=45 @30fps (p=0,5) + n=33 (p=0,1); A ở n, B ở
 * n−30 (cùng quy ước I4: A win+1,5 / B win+0,5 tại p=0,5). Raw XOÁ
 * ngay sau mỗi phép đo; scratch trên đĩa thật qua --workdir.
 * Binary clip và frame trung gian KHÔNG BAO GIỜ nằm trong repo.
 */
"use strict";
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..", "..");
const args = process.argv.slice(2);
const FLAT = args.includes("--flat");
const getOpt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const WORKDIR = getOpt("--workdir", null);
const JSON_OUT = getOpt("--json", null);
const TMP = WORKDIR ? path.resolve(WORKDIR) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-j3-"));
fs.mkdirSync(TMP, { recursive: true });

let FILE_A, WIN_A, FILE_B, WIN_B, W, H;
if (!FLAT) {
  [FILE_A, WIN_A, FILE_B, WIN_B, W, H] = [args[0], args[1], args[2], args[3], args[4], args[5]];
  WIN_A = parseFloat(WIN_A); WIN_B = parseFloat(WIN_B);
  W = parseInt(W, 10); H = parseInt(H, 10);
  if (!FILE_A || isNaN(WIN_A) || !FILE_B || isNaN(WIN_B) || !W || !H) {
    throw new Error("Dùng: node measure_r26_j3_canvas_dip.js <clipA> <winA> <clipB> <winB> <W> <H> [--workdir DIR] [--json OUT]  hoặc  --flat");
  }
  for (const f of [FILE_A, FILE_B]) if (!fs.existsSync(f)) throw new Error(`Không thấy file nguồn: ${f} — chạy scripts/fetch-r22-footage.sh trước.`);
}

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(" ")} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r;
}
function ffmpeg(cmdArgs) { return run("ffmpeg", ["-v", "error", ...cmdArgs]); }
function rm(f) { try { fs.unlinkSync(f); } catch { /* bỏ qua */ } }

function findTsc() {
  for (const c of [path.join(ROOT, "apps", "web", "node_modules", ".bin", "tsc"), path.join(ROOT, "node_modules", ".bin", "tsc"), "tsc"]) {
    if (spawnSync(c, ["--version"], { encoding: "utf8" }).status === 0) return c;
  }
  return null;
}
function transpileTs(srcRel, outName) {
  const src = path.join(ROOT, srcRel);
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), `vcut-j3-${outName}-`));
  fs.mkdirSync(outDir, { recursive: true });
  spawnSync(findTsc(), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
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

/** Frame đơn clip bằng CHÍNH code sản phẩm (singleClipDipPixel). */
function singleFrame(tp, type, window, p, frameClip, w, h) {
  const vis = tp.describeTransition(type, p, w, h);
  const alpha = window === "in" ? vis.b.alpha : vis.a.alpha;
  const mode = vis.dip.mode;
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h * 3; i += 3) {
    const out = tp.singleClipDipPixel([frameClip[i], frameClip[i + 1], frameClip[i + 2]], alpha, mode);
    buf[i] = Math.round(out[0]); buf[i + 1] = Math.round(out[1]); buf[i + 2] = Math.round(out[2]);
  }
  return { buf, alpha };
}
/** Model nền đen cũ (trước J3): alpha·clip trên đen. */
function oldFrame(tp, type, window, p, frameClip, w, h) {
  const vis = tp.describeTransition(type, p, w, h);
  const alpha = window === "in" ? vis.b.alpha : vis.a.alpha;
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h * 3; i += 3) {
    buf[i] = Math.round(alpha * frameClip[i]);
    buf[i + 1] = Math.round(alpha * frameClip[i + 1]);
    buf[i + 2] = Math.round(alpha * frameClip[i + 2]);
  }
  return buf;
}

/**
 * Tham chiếu FFmpeg độc lập cho mô hình đơn clip: nền dip + clip phủ
 * alpha nguyên qua overlay. fadewhite: nền = trắng lavfi. fadegrays:
 * nền = xám mean của chính clip qua geq. Clip phủ: format=rgba +
 * geq a = round(255·alpha). Sai số kỳ vọng chỉ do lượng tử hoá alpha
 * nguyên + làm tròn overlay (≤ ~1 mức).
 */
function ffmpegSingleRef(tp, type, window, p, frameClip, w, h, tag) {
  const vis = tp.describeTransition(type, p, w, h);
  const alpha = window === "in" ? vis.b.alpha : vis.a.alpha;
  const aInt = Math.round(alpha * 255);
  const clipRaw = path.join(TMP, `${tag}-clip.raw`);
  const baseRaw = path.join(TMP, `${tag}-base.raw`);
  const topRaw = path.join(TMP, `${tag}-top.raw`);
  const outRaw = path.join(TMP, `${tag}-out.raw`);
  writeFileEpermRetry(clipRaw, frameClip);
  if (type === "fadewhite") {
    ffmpeg(["-f", "lavfi", "-i", `color=white:s=${w}x${h}:d=1:r=30`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", baseRaw]);
  } else {
    ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", clipRaw,
      "-filter_complex", "[0:v]geq=r='(r(X,Y)+g(X,Y)+b(X,Y))/3':g='(r(X,Y)+g(X,Y)+b(X,Y))/3':b='(r(X,Y)+g(X,Y)+b(X,Y))/3'",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", baseRaw]);
  }
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", clipRaw,
    "-filter_complex", `[0:v]format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='${aInt}'`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-y", topRaw]);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", baseRaw,
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${w}x${h}`, "-i", topRaw,
    "-filter_complex", "[0:v][1:v]overlay=0:0,format=rgb24",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", outRaw]);
  const buf = fs.readFileSync(outRaw);
  rm(clipRaw); rm(baseRaw); rm(topRaw); rm(outRaw);
  return { buf, aInt };
}

const FLAT_PAIRS = [
  { tag: "rb", a: "red", b: "blue" },
  { tag: "gm", a: "green", b: "magenta" },
  { tag: "gen", a: "0xC76331", b: "0x1CB3DB" },
];
const TYPES = ["fadewhite", "fadegrays"];

function renderFlat(type, pair, pathName, tag) {
  const FW = 64, FH = 64;
  const raw = path.join(TMP, `${tag}.raw`);
  const pre = pathName === "rgb" ? "format=rgb24" : "format=yuv420p";
  const post = "format=rgb24";
  ffmpeg(["-vsync", "0", "-f", "lavfi", "-i", `color=${pair.a}:s=64x64:d=2:r=30`,
    "-f", "lavfi", "-i", `color=${pair.b}:s=64x64:d=2:r=30`,
    "-filter_complex", `[0:v]${pre}[a];[1:v]${pre}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,${post}`,
    "-frames:v", "90", "-f", "rawvideo", "-y", raw]);
  const data = fs.readFileSync(raw);
  rm(raw);
  const frame = (n) => Buffer.from(data.subarray(n * FW * FH * 3, (n + 1) * FW * FH * 3));
  return { frame, frameA: frame(29), frameB: frame(60), FW, FH };
}

function main() {
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  console.log(`workdir: ${TMP}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const results = { mode: FLAT ? "flat" : "footage", types: TYPES, workdir: TMP, rows: [] };
  const push = (row) => { results.rows.push(row); return row; };

  if (FLAT) {
    // Giao thức B + A + O tại p=0.5 cho cả 3 cặp; sweep p cho cặp rb.
    for (const pair of FLAT_PAIRS) {
      for (const type of TYPES) {
        const { frame, frameA, frameB, FW, FH } = renderFlat(type, pair, "rgb", `flat-${type}-${pair.tag}-rgb`);
        const cells = pair.tag === "rb" ? [33, 38, 45, 52].map((n) => ({ p: (n - 30) / 30, n })) : [{ p: 0.5, n: 45 }];
        for (const { p, n } of cells) {
          const pairFrame = frame(n);
          for (const window of ["out", "in"]) {
            const clipFrame = window === "out" ? frameA : frameB;
            const { buf: single } = singleFrame(tp, type, window, p, clipFrame, FW, FH);
            const mA = compareFrames(pairFrame, single);
            const mO = compareFrames(pairFrame, oldFrame(tp, type, window, p, clipFrame, FW, FH));
            const { buf: ref } = ffmpegSingleRef(tp, type, window, p, clipFrame, FW, FH, `flatB-${type}-${pair.tag}-${window}-${n}`);
            const mB = compareFrames(ref, single);
            console.log(`flat | ${type} | ${pair.tag} | ${window} | p=${p} | (B) wiring-vs-ffmpeg ${fmt(mB)} | (A) single-vs-pair ${fmt(mA)} | (O) oldblack-vs-pair ${fmt(mO)}`);
            push({ pair: pair.tag, type, window, p, wiring: { mad: +mB.mad.toFixed(4), le8: +mB.le8.toFixed(4), verdict: classify(mB) }, pairGap: { mad: +mA.mad.toFixed(4), le8: +mA.le8.toFixed(4), verdict: classify(mA) }, oldBlack: { mad: +mO.mad.toFixed(4), le8: +mO.le8.toFixed(4), verdict: classify(mO) } });
          }
        }
      }
    }
  } else {
    const norm = (pathName) => pathName === "rgb"
      ? `fps=30,scale=${W}:${H},format=rgb24,settb=AVTB`
      : `fps=30,scale=${W}:${H},format=yuv420p,settb=AVTB`;
    const sourceFrame = (file, win, n, tag, pathName) => {
      const out = path.join(TMP, `${tag}.raw`);
      const post = pathName === "yuv" ? ",format=rgb24" : "";
      ffmpeg(["-ss", String(win), "-t", "2", "-i", file,
        "-filter_complex", `[0:v]${norm(pathName)}${post},select='eq(n,${n})'[v]`,
        "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
      const buf = fs.readFileSync(out);
      rm(out);
      return buf;
    };
    const renderXfade = (type, n, tag, pathName) => {
      const out = path.join(TMP, `${tag}.raw`);
      const post = pathName === "yuv" ? ",format=rgb24" : "";
      ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(WIN_B), "-t", "2", "-i", FILE_B,
        "-filter_complex", `[0:v]${norm(pathName)}[a];[1:v]${norm(pathName)}[b];[a][b]xfade=transition=${type}:duration=1:offset=1${post},format=rgb24,select='eq(n,${n})'[v]`,
        "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
      const buf = fs.readFileSync(out);
      rm(out);
      return buf;
    };
    console.log(`== J3 footage (${W}x${H}) ==`);
    console.log(`A: ${FILE_A} (cửa sổ ${WIN_A}–${WIN_A + 2}s)`);
    console.log(`B: ${FILE_B} (cửa sổ ${WIN_B}–${WIN_B + 2}s)`);
    results.windows = { winA: WIN_A, winB: WIN_B, size: `${W}x${H}` };
    // p=0.5 (n=45) cho cả 2 đường (A) + rgb (B, O); p=0.1 (n=33) rgb.
    for (const type of TYPES) {
      for (const pathName of ["rgb", "yuv"]) {
        const frameA = sourceFrame(FILE_A, WIN_A, 45, `srcA-${type}-${pathName}`, pathName);
        const frameB = sourceFrame(FILE_B, WIN_B, 15, `srcB-${type}-${pathName}`, pathName);
        const pairFrame = renderXfade(type, 45, `x-${type}-${pathName}`, pathName);
        for (const window of ["out", "in"]) {
          const clipFrame = window === "out" ? frameA : frameB;
          const { buf: single } = singleFrame(tp, type, window, 0.5, clipFrame, W, H);
          const mA = compareFrames(pairFrame, single);
          const row = { type, window, p: 0.5, path: pathName, pairGap: { mad: +mA.mad.toFixed(4), le8: +mA.le8.toFixed(4), verdict: classify(mA) } };
          if (pathName === "rgb") {
            const mO = compareFrames(pairFrame, oldFrame(tp, type, window, 0.5, clipFrame, W, H));
            const { buf: ref } = ffmpegSingleRef(tp, type, window, 0.5, clipFrame, W, H, `footB-${type}-${window}`);
            const mB = compareFrames(ref, single);
            row.wiring = { mad: +mB.mad.toFixed(4), le8: +mB.le8.toFixed(4), verdict: classify(mB) };
            row.oldBlack = { mad: +mO.mad.toFixed(4), le8: +mO.le8.toFixed(4), verdict: classify(mO) };
            console.log(`footage | ${type} | ${window} | p=0.5 | rgb | (B) wiring ${fmt(mB)} | (A) pair-gap ${fmt(mA)} | (O) oldblack ${fmt(mO)}`);
          } else {
            console.log(`footage | ${type} | ${window} | p=0.5 | yuv | (A) pair-gap ${fmt(mA)}`);
          }
          push(row);
        }
      }
      // p=0.1 rgb: A n=33, B n=3, pair n=33.
      const frameA01 = sourceFrame(FILE_A, WIN_A, 33, `srcA01-${type}`, "rgb");
      const frameB01 = sourceFrame(FILE_B, WIN_B, 3, `srcB01-${type}`, "rgb");
      const pair01 = renderXfade(type, 33, `x01-${type}`, "rgb");
      for (const window of ["out", "in"]) {
        const clipFrame = window === "out" ? frameA01 : frameB01;
        const { buf: single } = singleFrame(tp, type, window, 0.1, clipFrame, W, H);
        const mA = compareFrames(pair01, single);
        const { buf: ref } = ffmpegSingleRef(tp, type, window, 0.1, clipFrame, W, H, `footB01-${type}-${window}`);
        const mB = compareFrames(ref, single);
        console.log(`footage | ${type} | ${window} | p=0.1 | rgb | (B) wiring ${fmt(mB)} | (A) pair-gap ${fmt(mA)}`);
        push({ type, window, p: 0.1, path: "rgb", wiring: { mad: +mB.mad.toFixed(4), le8: +mB.le8.toFixed(4), verdict: classify(mB) }, pairGap: { mad: +mA.mad.toFixed(4), le8: +mA.le8.toFixed(4), verdict: classify(mA) } });
      }
    }
  }
  if (JSON_OUT) {
    writeFileEpermRetry(JSON_OUT, JSON.stringify(results, null, 2) + "\n");
    console.log(`JSON: ${JSON_OUT}`);
  }
  console.log(`workdir: ${TMP} (raw đã xoá sau mỗi phép đo)`);
}

main();
