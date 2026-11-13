#!/usr/bin/env node
/**
 * measure_r24_h3_fade.js — Phase 9 đợt 24, luồng H3: fadeblack dip qua đen
 * trong preview + đo fade ở native/4K.
 *
 * Chế độ 1 — flat sweep (không cần footage):
 *   node measure_r24_h3_fade.js --flat [--workdir DIR] [--json OUT.json]
 *   xfade fadeblack trên cặp đỏ→xanh phẳng (64×64, 30fps, duration=1,
 *   offset=1), so từng frame transition (n=30..59, p=(n-30)/30) của
 *   render với 2 mô hình preview: MỚI (describeTransition thật sau đợt
 *   24 H3) và CŨ (alpha tuyến tính 1-p/p — mô hình đợt 23 G5 đã đo
 *   LỆCH). A_ref/B_ref lấy từ chính frame thuần của render (n=29/n=60)
 *   nên sweep chỉ đo sai số trọng số, không lẫn sai số màu nguồn.
 *   Sweep chạy 2 đường: YUV (lavfi thẳng vào xfade — đúng đường render
 *   thật) và RGB (format=rgb24 ép TRƯỚC xfade — đường harness R23):
 *   fadeblack nhạy format trước xfade: đường YUV blend về mức đen
 *   Y=0 thay vì Y=16 của limited range nên frame render tối thêm
 *   ≈ −18,6×(1−w) so với blend RGB (chứng minh bằng fit có chặn,
 *   xem LIMITS đợt 24 H3 §3); fade tuyến tính không bị vì nó chỉ blend
 *   A với B, không qua đen. Mô hình MỚI lấy trọng số từ đường RGB
 *   (trọng số thật, không offset) — vì vậy flat-YUV của MỚI sẽ lộ
 *   đúng sàn offset đó, không phải lỗi trọng số.
 *
 * Chế độ 2 — footage (cần clip H.264 dọc, xem scripts/fetch-r22-footage.sh):
 *   node measure_r24_h3_fade.js <clipA> <winA> <clipB> <winB> <W> <H>
 *     [--types fadeblack,fade] [--crf 14] [--yuv] [--yuv-in] [--workdir DIR] [--json OUT.json]
 *   Ngữ nghĩa khung hình giữ đúng R23: frame giữa transition n=45 @30fps
 *   (p=0.5); A lấy ở win+1.5 (n=45), B ở win+0.5 (n=15); ép rgb24 TRƯỚC
 *   xfade (phương pháp harness R23). Cờ --yuv-in đổi sang ép yuv420p
 *   TRƯỚC xfade rồi mới format=rgb24 để so — đúng đường render thật
 *   (render.js chuẩn hoá clip về yuv420p trước xfade). PHÁT HIỆN H3:
 *   fadeblack nhạy với format trước xfade (đường YUV blend về mức đen
 *   Y=0, tối thêm ≈ −18,6×(1−w) so với đường RGB; xem LIMITS §3),
 *   còn fade tuyến tính thì không — vì vậy số fadeblack đường rgb24
 *   đo trọng số thật, số yuv-in đo đường sản phẩm kèm offset mức đen;
 *   cả hai đều phải báo kèm nhãn đường, không trích lẫn nhau.
 *   Ô YUV e2e (libx264 preset medium, crf cho trước) chỉ chạy khi
 *   có cờ --yuv. MỚI vs CŨ đều báo ở ô RGB.
 *
 * CHÚ Ý đĩa: /tmp của VM chỉ là tmpfs 512MB (đợt 23 G5 từng chết ENOSPC
 * ở 4K). Chạy native/4K phải truyền --workdir trỏ vào thư mục scratch
 * trên đĩa thật (ví dụ ~/workspace/repo-1/scratch-h3/) và XOÁ scratch
 * sau khi đo xong — scratch KHÔNG đưa vào batch stage. Binary clip và
 * frame trung gian KHÔNG BAO GIỜ nằm trong repo.
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
const YUV = args.includes("--yuv");
const YUV_IN = args.includes("--yuv-in");
const getOpt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const WORKDIR = getOpt("--workdir", null);
const JSON_OUT = getOpt("--json", null);
const TYPES = (getOpt("--types", "fadeblack,fade") || "").split(",").filter(Boolean);
const CRF = parseInt(getOpt("--crf", "14"), 10);
const TMP = WORKDIR ? path.resolve(WORKDIR) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-h3-"));
fs.mkdirSync(TMP, { recursive: true });

let FILE_A, WIN_A, FILE_B, WIN_B, W, H;
if (!FLAT) {
  [FILE_A, WIN_A, FILE_B, WIN_B, W, H] = [args[0], args[1], args[2], args[3], args[4], args[5]];
  WIN_A = parseFloat(WIN_A); WIN_B = parseFloat(WIN_B);
  W = parseInt(W, 10); H = parseInt(H, 10);
  if (!FILE_A || isNaN(WIN_A) || !FILE_B || isNaN(WIN_B) || !W || !H) {
    throw new Error("Dùng: node measure_r24_h3_fade.js <clipA> <winA> <clipB> <winB> <W> <H> [--types fadeblack,fade] [--crf 14] [--yuv] [--workdir DIR] [--json OUT.json]  hoặc  --flat");
  }
  for (const f of [FILE_A, FILE_B]) if (!fs.existsSync(f)) throw new Error(`Không thấy file nguồn: ${f} — chạy scripts/fetch-r22-footage.sh trước.`);
}

const shared = require("./harnessShared");

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(" ")} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r;
}
function ffmpeg(cmdArgs) { return run("ffmpeg", ["-v", "error", ...cmdArgs]); }

function findTsc() {
  for (const c of [path.join(ROOT, "apps", "web", "node_modules", ".bin", "tsc"), path.join(ROOT, "node_modules", ".bin", "tsc"), "tsc"]) {
    if (spawnSync(c, ["--version"], { encoding: "utf8" }).status === 0) return c;
  }
  return null;
}
function transpileTs(srcRel, outName) {
  const src = path.join(ROOT, srcRel);
  // Transpile ra tmpdir hệ thống, KHÔNG ra WORKDIR: nếu WORKDIR nằm
  // trong repo (package.json có "type": "module") thì file .js sinh ra
  // bị Node coi là ESM và `exports` vỡ. Output transpile nhỏ, tạm —
  // không cần nằm cùng thư mục encode lớn.
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), `vcut-h3-${outName}-`));
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(findTsc(), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}: ${(r.stderr || "").slice(0, 300)}`);
  return require(jsFile);
}

// Composite preview tổng quát (copy đúng logic R23: nhánh non-geometric
// cộng A·αA + B·αB trên nền đen — đủ cho họ fade; nhánh geometric giữ
// nguyên để script không lệch khi type khác lọt vào).
function previewFrame(visual, frameA, frameB, w, h) {
  const buf = Buffer.alloc(w * h * 3);
  const hasRadial =
    (visual.a.region && visual.a.region.kind === "radial-gradient") ||
    (visual.b.region && visual.b.region.kind === "radial-gradient");
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5, py = y + 0.5, i = (y * w + x) * 3;
      let r = 0, g = 0, b = 0;
      if (hasRadial) {
        const ca = shared.layerPixelAlpha(visual.a, x, y, w, h);
        const cb = shared.layerPixelAlpha(visual.b, x, y, w, h);
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else if (!visual.geometric) {
        const ca = shared.layerCovers(visual.a, px, py, w, h) ? visual.a.alpha : 0;
        const cb = shared.layerCovers(visual.b, px, py, w, h) ? visual.b.alpha : 0;
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else {
        if (shared.layerCovers(visual.a, px, py, w, h)) {
          r = frameA[i] * visual.a.alpha + r * (1 - visual.a.alpha);
          g = frameA[i + 1] * visual.a.alpha + g * (1 - visual.a.alpha);
          b = frameA[i + 2] * visual.a.alpha + b * (1 - visual.a.alpha);
        }
        if (shared.layerCovers(visual.b, px, py, w, h)) {
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
// Mô hình CŨ (đợt 23 trở về trước): fadeblack = alpha tuyến tính 1-p/p.
function oldPreviewFrame(type, p, frameA, frameB, w, h) {
  if (type !== "fadeblack") return null;
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h * 3; i += 3) {
    buf[i] = Math.round(frameA[i] * (1 - p) + frameB[i] * p);
    buf[i + 1] = Math.round(frameA[i + 1] * (1 - p) + frameB[i + 1] * p);
    buf[i + 2] = Math.round(frameA[i + 2] * (1 - p) + frameB[i + 2] * p);
  }
  return buf;
}
function compareFrames(a, b, w, h) {
  let sum = 0, le8 = 0;
  const n = w * h * 3;
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
function normChain(w, h) { return `fps=30,scale=${w}:${h},format=rgb24,settb=AVTB`; }
// Đường render thật: yuv420p trước xfade (render.js), chỉ format=rgb24
// SAU xfade để lấy frame so sánh (so sánh lúc này gồm cả nhiễu roundtrip
// yuv→rgb, cùng bản chất với số fade 0.5008 của G5).
function normChainYuv(w, h) { return `fps=30,scale=${w}:${h},format=yuv420p,settb=AVTB`; }
function renderXfadeRgb(type, tag, w, h) {
  const out = path.join(TMP, `${tag}.raw`);
  const NORM = YUV_IN ? normChainYuv(w, h) : normChain(w, h);
  const POST = YUV_IN ? ",format=rgb24" : "";
  ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(WIN_B), "-t", "2", "-i", FILE_B,
    "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=${type}:duration=1:offset=1${POST},format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}
function renderXfadeYuv(type, tag, crf, w, h) {
  const mp4 = path.join(TMP, `${tag}-crf${crf}.mp4`);
  const NORM = YUV_IN ? normChainYuv(w, h) : normChain(w, h);
  ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(WIN_B), "-t", "2", "-i", FILE_B,
    "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=yuv420p[v]`,
    "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-pix_fmt", "yuv420p", "-t", "2", "-y", mp4]);
  const yuvOut = path.join(TMP, `${tag}-crf${crf}.yuv`);
  const rgbOut = path.join(TMP, `${tag}-crf${crf}-rgb.raw`);
  ffmpeg(["-i", mp4, "-filter_complex", "[0:v]select='eq(n,45)'[v]", "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", yuvOut]);
  ffmpeg(["-i", mp4, "-filter_complex", "[0:v]select='eq(n,45)'[v]", "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", rgbOut]);
  try { fs.unlinkSync(mp4); } catch { /* bỏ qua */ }
  return { yuv: fs.readFileSync(yuvOut), rgb: fs.readFileSync(rgbOut) };
}
function sourceFrame(file, win, n, tag, w, h) {
  const out = path.join(TMP, `${tag}.raw`);
  const NORM = YUV_IN ? normChainYuv(w, h) : normChain(w, h);
  const POST = YUV_IN ? ",format=rgb24" : "";
  ffmpeg(["-ss", String(win), "-t", "2", "-i", file,
    "-filter_complex", `[0:v]${NORM}${POST},select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}

function main() {
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  console.log(`workdir: ${TMP}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const results = { mode: FLAT ? "flat-sweep" : "footage", types: TYPES, workdir: TMP, yuvIn: YUV_IN, rows: [] };

  if (FLAT) {
    // Cặp phẳng đỏ→xanh, toàn bộ transition trong 1 lần render.
    const FW = 64, FH = 64;
    const raw = path.join(TMP, "flat-fadeblack.raw");
    ffmpeg(["-f", "lavfi", "-i", "color=red:s=64x64:d=2:r=30", "-f", "lavfi", "-i", "color=blue:s=64x64:d=2:r=30",
      "-filter_complex", "[0:v][1:v]xfade=transition=fadeblack:duration=1:offset=1,format=rgb24",
      "-frames:v", "90", "-f", "rawvideo", "-y", raw]);
    const data = fs.readFileSync(raw);
    const frame = (n) => Buffer.from(data.subarray(n * FW * FH * 3, (n + 1) * FW * FH * 3));
    const frameA = frame(29), frameB = frame(60);
    console.log("== H3 flat sweep: fadeblack đỏ→xanh phẳng, p=(n-30)/30, n=30..59 ==");
    let worstNew = 0, worstOld = 0;
    for (let n = 30; n <= 59; n++) {
      const p = (n - 30) / 30;
      const rendered = frame(n);
      const visual = tp.describeTransition("fadeblack", p, FW, FH);
      const prevNew = previewFrame(visual, frameA, frameB, FW, FH);
      const prevOld = oldPreviewFrame("fadeblack", p, frameA, frameB, FW, FH);
      const mNew = compareFrames(rendered, prevNew, FW, FH);
      const mOld = compareFrames(rendered, prevOld, FW, FH);
      worstNew = Math.max(worstNew, mNew.mad);
      worstOld = Math.max(worstOld, mOld.mad);
      results.rows.push({ n, p: +p.toFixed(4), madNew: +mNew.mad.toFixed(4), le8New: +mNew.le8.toFixed(4), verdictNew: classify(mNew), madOld: +mOld.mad.toFixed(4), le8Old: +mOld.le8.toFixed(4), verdictOld: classify(mOld) });
      console.log(`flat | fadeblack | p=${p.toFixed(4)} | MỚI MAD=${mNew.mad.toFixed(4)} <=8:${(mNew.le8 * 100).toFixed(2)}% ${classify(mNew)} | CŨ MAD=${mOld.mad.toFixed(4)} <=8:${(mOld.le8 * 100).toFixed(2)}% ${classify(mOld)}`);
    }
    console.log(`flat | fadeblack | worst MỚI MAD=${worstNew.toFixed(4)} | worst CŨ MAD=${worstOld.toFixed(4)}`);
    results.worst = { madNew: +worstNew.toFixed(4), madOld: +worstOld.toFixed(4) };
    // Đường RGB (format=rgb24 ép TRƯỚC xfade — phương pháp harness R23):
    // fadeblack lệch đúng 1 frame so với đường YUV trên (render thật).
    // Dùng -vsync 0 để thứ tự frame là thứ tự filter thật (tránh vsync
    // nhân frame đầu khi pts đầu = 1/30 — xem LIMITS H3 §3).
    const rawRgb = path.join(TMP, "flat-fadeblack-rgb.raw");
    ffmpeg(["-vsync", "0", "-f", "lavfi", "-i", "color=red:s=64x64:d=2:r=30", "-f", "lavfi", "-i", "color=blue:s=64x64:d=2:r=30",
      "-filter_complex", "[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade=transition=fadeblack:duration=1:offset=1,format=rgb24",
      "-frames:v", "90", "-f", "rawvideo", "-y", rawRgb]);
    const dataRgb = fs.readFileSync(rawRgb);
    const frameRgb = (n) => Buffer.from(dataRgb.subarray(n * FW * FH * 3, (n + 1) * FW * FH * 3));
    const frameARgb = frameRgb(29), frameBRgb = frameRgb(60);
    console.log("== H3 flat sweep RGB (format=rgb24 trước xfade): MỚI vs render RGB ==");
    let worstRgb = 0;
    const rgbRows = [];
    for (let n = 30; n <= 59; n++) {
      const p = (n - 30) / 30;
      const rendered = frameRgb(n);
      const visual = tp.describeTransition("fadeblack", p, FW, FH);
      const prevNew = previewFrame(visual, frameARgb, frameBRgb, FW, FH);
      const mRgb = compareFrames(rendered, prevNew, FW, FH);
      worstRgb = Math.max(worstRgb, mRgb.mad);
      rgbRows.push({ n, p: +p.toFixed(4), madNewRgb: +mRgb.mad.toFixed(4), le8NewRgb: +mRgb.le8.toFixed(4), verdictNewRgb: classify(mRgb) });
      console.log(`flat-RGB | fadeblack | p=${p.toFixed(4)} | MỚI MAD=${mRgb.mad.toFixed(4)} <=8:${(mRgb.le8 * 100).toFixed(2)}% ${classify(mRgb)}`);
    }
    console.log(`flat-RGB | fadeblack | worst MỚI MAD=${worstRgb.toFixed(4)}`);
    results.rgbRows = rgbRows;
    results.worstRgb = { madNew: +worstRgb.toFixed(4) };
  } else {
    console.log(`== H3 footage (${YUV_IN ? "yuv420p trước xfade — đường render thật" : "rgb24 trước xfade — phương pháp harness R23"}, frame 45 @30fps, p=0.5, ${W}x${H}) ==`);
    console.log(`A: ${FILE_A} (cửa sổ ${WIN_A}–${WIN_A + 2}s)`);
    console.log(`B: ${FILE_B} (cửa sổ ${WIN_B}–${WIN_B + 2}s)`);
    const frameA = sourceFrame(FILE_A, WIN_A, 45, "srcA-45", W, H);
    const frameB = sourceFrame(FILE_B, WIN_B, 15, "srcB-15", W, H);
    const frameA2 = sourceFrame(FILE_A, WIN_A, 45, "srcA-45-repeat", W, H);
    let diffRepeat = 0;
    for (let k = 0; k < frameA.length; k++) diffRepeat += Math.abs(frameA[k] - frameA2[k]);
    console.log(`đối chứng trích lặp frame A: tổng lệch tuyệt đối=${diffRepeat} (0 = xác định)`);
    results.windows = { winA: WIN_A, winB: WIN_B, size: `${W}x${H}`, repeatDiff: diffRepeat };
    for (const type of TYPES) {
      const visual = tp.describeTransition(type, 0.5, W, H);
      const preview = previewFrame(visual, frameA, frameB, W, H);
      const rendered = renderXfadeRgb(type, `x-h3-${type}`, W, H);
      const m = compareFrames(rendered, preview, W, H);
      const row = { type, size: `${W}x${H}`, p: 0.5, rgb: { mad: +m.mad.toFixed(4), le8: +m.le8.toFixed(4), verdict: classify(m) } };
      console.log(`footage | ${type} | RGB24 ${W}x${H} | MỚI MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
      if (type === "fadeblack") {
        const prevOld = oldPreviewFrame(type, 0.5, frameA, frameB, W, H);
        const mOld = compareFrames(rendered, prevOld, W, H);
        row.rgbOld = { mad: +mOld.mad.toFixed(4), le8: +mOld.le8.toFixed(4), verdict: classify(mOld) };
        console.log(`footage | ${type} | RGB24 ${W}x${H} | CŨ MAD=${mOld.mad.toFixed(4)} <=8: ${(mOld.le8 * 100).toFixed(2)}% | ${classify(mOld)}`);
      }
      if (YUV) {
        const enc = renderXfadeYuv(type, `x-h3-${type}-yuv`, CRF, W, H);
        const prevYuv = shared.ffmpegRgbToYuv420(preview, W, H, TMP, `prev-${type}`);
        const ym = shared.yuv420Mad(prevYuv.yuv, enc.yuv, prevYuv.w, prevYuv.h);
        const rgbDec = compareFrames(enc.rgb, preview, W, H);
        row.yuv = { crf: CRF, yuvMad: shared.formatYuvMad(ym), rgbDecodeMad: +rgbDec.mad.toFixed(4), rgbDecodeLe8: +rgbDec.le8.toFixed(4), rgbDecodeVerdict: classify(rgbDec) };
        console.log(`footage | ${type} | YUV420p crf${CRF} ${W}x${H} | ${shared.formatYuvMad(ym)} | MAD-RGB-decode=${rgbDec.mad.toFixed(4)} <=8: ${(rgbDec.le8 * 100).toFixed(2)}% ${classify(rgbDec)}`);
      }
      results.rows.push(row);
    }
  }
  if (JSON_OUT) {
    writeFileEpermRetry(JSON_OUT, JSON.stringify(results, null, 2) + "\n");
    console.log(`JSON: ${JSON_OUT}`);
  }
  console.log(`workdir: ${TMP} (giữ lại để đối chứng, không đưa vào batch stage)`);
}

main();
