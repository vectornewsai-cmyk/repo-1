#!/usr/bin/env node
/**
 * measure_r25_i4_fade_levels.js — Phase 9 đợt 25, luồng I4: fadeblack mức
 * đen YUV + fadewhite/fadegrays có màu trung gian.
 *
 * Khác đợt 24 H3 ở điểm then chốt: composite preview KHÔNG cài lại công
 * thức mà dùng CHÍNH code sản phẩm — transpile apps/web/src/lib/
 * transitionPreview.ts rồi gọi describeTransition + compositeFadePixel
 * theo từng pixel. Vì vậy số đo ở đây là parity đầu-cuối của code mới
 * (dip + offset YUV), không phải của 1 mô hình đo riêng.
 *
 * Chế độ 1 — flat sweep (không cần footage):
 *   node measure_r25_i4_fade_levels.js --flat [--workdir DIR] [--json OUT.json]
 *   Mỗi type (fadeblack, fadewhite, fadegrays, fade đối chứng) × mỗi cặp
 *   phẳng (đỏ→xanh, xanh lá→magenta, (199,99,49)→(28,179,219)) × 2 đường
 *   (rgb24 ép TRƯỚC xfade; yuv420p ép TRƯỚC xfade = đường render thật)
 *   được render 90 frame 64×64 @30fps, xfade duration=1 offset=1; so
 *   từng frame transition n=30..59 (p=(n-30)/30) với composite code.
 *   A_ref/B_ref lấy từ chính frame thuần của render (n=29/n=60) nên
 *   sweep chỉ đo sai số mô hình, không lẫn sai số màu nguồn.
 *   Đường YUV: fadeblack/fadewhite cộng offset mức (code: −21,05 /
 *   +20,45); fadegrays YUV đổi gray sang luma bt601 (không offset hằng).
 *   Ngoài số code, flat còn báo biến thể offset lý thuyết (fadeblack
 *   −18,63, fadewhite +23,1) để thấy fit thực nghiệm hơn lý thuyết
 *   bao nhiêu — không dùng biến thể làm số chính.
 *
 * Chế độ 2 — footage (cần clip H.264 dọc, xem scripts/fetch-r22-footage.sh):
 *   node measure_r25_i4_fade_levels.js <clipA> <winA> <clipB> <winB> <W> <H>
 *     [--types fadeblack,fadewhite,fadegrays,fade] [--workdir DIR] [--json OUT.json]
 *   Ngữ nghĩa khung hình giữ đúng R23/H3: frame giữa transition n=45
 *   @30fps (p=0.5); A lấy ở win+1.5 (n=45), B ở win+0.5 (n=15). Mỗi
 *   type × đường (rgb + yuv-in) render 1 frame giữa rồi so với composite
 *   code; raw bị XOÁ ngay sau mỗi phép đo (đo tuần tự, không giữ raw
 *   720p trên đĩa). Đường yuv-in: yuv420p TRƯỚC xfade, format=rgb24
 *   SAU xfade để so — đúng đường render thật (render.js chuẩn hoá
 *   về yuv420p trước xfade).
 *
 * Thang verdict (thang V6): KHỚP = MAD ≤ 2 VÀ ≥ 99% pixel lệch ≤ 8;
 * XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8; còn lại là LỆCH.
 *
 * CHÚ Ý đĩa: /tmp của VM chỉ là tmpfs 512MB. Luôn truyền --workdir trỏ
 * vào scratch trên đĩa thật (ví dụ ~/workspace/tmp-round25-i4/) và
 * script tự xoá raw sau mỗi phép đo — scratch KHÔNG đưa vào batch
 * stage. Binary clip và frame trung gian KHÔNG BAO GIỜ nằm trong repo.
 */
"use strict";
const fs = require("fs");
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
const TYPES = (getOpt("--types", "fadeblack,fadewhite,fadegrays,fade") || "").split(",").filter(Boolean);
const TMP = WORKDIR ? path.resolve(WORKDIR) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-i4-"));
fs.mkdirSync(TMP, { recursive: true });

let FILE_A, WIN_A, FILE_B, WIN_B, W, H;
if (!FLAT) {
  [FILE_A, WIN_A, FILE_B, WIN_B, W, H] = [args[0], args[1], args[2], args[3], args[4], args[5]];
  WIN_A = parseFloat(WIN_A); WIN_B = parseFloat(WIN_B);
  W = parseInt(W, 10); H = parseInt(H, 10);
  if (!FILE_A || isNaN(WIN_A) || !FILE_B || isNaN(WIN_B) || !W || !H) {
    throw new Error("Dùng: node measure_r25_i4_fade_levels.js <clipA> <winA> <clipB> <winB> <W> <H> [--types ...] [--workdir DIR] [--json OUT.json]  hoặc  --flat");
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
  // Transpile ra tmpdir hệ thống, KHÔNG ra WORKDIR: nếu WORKDIR nằm
  // trong repo (package.json có "type": "module") thì file .js sinh ra
  // bị Node coi là ESM và `exports` vỡ (bài học từ script H3).
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), `vcut-i4-${outName}-`));
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(findTsc(), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}: ${(r.stderr || "").slice(0, 300)}`);
  return require(jsFile);
}

// Composite cặp bằng CHÍNH code sản phẩm (describeTransition +
// compositeFadePixel), theo từng pixel. visualOverride cho phép đo biến
// thể (offset lý thuyết / tắt offset) mà không sửa code.
function previewFrame(tp, type, p, frameA, frameB, w, h, pathName, visualOverride) {
  const visual = { ...tp.describeTransition(type, p, w, h), ...(visualOverride || {}) };
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h * 3; i += 3) {
    const out = tp.compositeFadePixel(
      [frameA[i], frameA[i + 1], frameA[i + 2]],
      [frameB[i], frameB[i + 1], frameB[i + 2]],
      visual, pathName,
    );
    buf[i] = Math.round(out[0]); buf[i + 1] = Math.round(out[1]); buf[i + 2] = Math.round(out[2]);
  }
  return buf;
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
function fmt(m) {
  return `MAD=${m.mad.toFixed(4)} <=8:${(m.le8 * 100).toFixed(2)}% ${classify(m)}`;
}

// Các cặp phẳng: tên lavfi color + nhãn. Cặp gen dùng hex RGB trực tiếp.
const FLAT_PAIRS = [
  { tag: "rb", a: "red", b: "blue" },
  { tag: "gm", a: "green", b: "magenta" },
  { tag: "gen", a: "0xC76331", b: "0x1CB3DB" },
];

function renderFlat(tp, type, pair, pathName, tag) {
  const FW = 64, FH = 64;
  const raw = path.join(TMP, `${tag}.raw`);
  const pre = pathName === "rgb" ? "format=rgb24" : "format=yuv420p";
  const post = pathName === "rgb" ? "format=rgb24" : "format=rgb24";
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
  const results = { mode: FLAT ? "flat-sweep" : "footage", types: TYPES, workdir: TMP, rows: [] };

  if (FLAT) {
    for (const pair of FLAT_PAIRS) {
      for (const type of TYPES) {
        for (const pathName of ["rgb", "yuv"]) {
          const { frame, frameA, frameB, FW, FH } = renderFlat(tp, type, pair, pathName, `flat-${type}-${pair.tag}-${pathName}`);
          let worst = 0, mid = null;
          for (let n = 30; n <= 59; n++) {
            const p = (n - 30) / 30;
            const m = compareFrames(frame(n), previewFrame(tp, type, p, frameA, frameB, FW, FH, pathName, null));
            worst = Math.max(worst, m.mad);
            if (n === 45) mid = m;
          }
          console.log(`flat | ${type} | ${pair.tag} | ${pathName} | p=0.5 ${fmt(mid)} | worst MAD=${worst.toFixed(4)}`);
          results.rows.push({ pair: pair.tag, type, path: pathName, p05: { mad: +mid.mad.toFixed(4), le8: +mid.le8.toFixed(4), verdict: classify(mid) }, worstMad: +worst.toFixed(4) });
          // Biến thể offset lý thuyết (chỉ đường YUV, chỉ type có offset):
          if (pathName === "yuv" && (type === "fadeblack" || type === "fadewhite")) {
            const theory = type === "fadeblack" ? -18.63 : 23.1;
            const mT = compareFrames(frame(45), previewFrame(tp, type, 0.5, frameA, frameB, FW, FH, pathName, { yuvLevelOffset: theory }));
            const m0 = compareFrames(frame(45), previewFrame(tp, type, 0.5, frameA, frameB, FW, FH, pathName, { yuvLevelOffset: 0 }));
            console.log(`flat | ${type} | ${pair.tag} | yuv | p=0.5 biến thể: lý thuyết(${theory}) ${fmt(mT)} | tắt-offset(0) ${fmt(m0)}`);
            results.rows.push({ pair: pair.tag, type, path: "yuv-variant", theoryOffset: theory, theory: { mad: +mT.mad.toFixed(4), le8: +mT.le8.toFixed(4), verdict: classify(mT) }, noOffset: { mad: +m0.mad.toFixed(4), le8: +m0.le8.toFixed(4), verdict: classify(m0) } });
          }
          // Biến thể fadegrays YUV dùng gray RGB (mean) thay vì luma:
          if (pathName === "yuv" && type === "fadegrays") {
            const mR = compareFrames(frame(45), previewFrame(tp, type, 0.5, frameA, frameB, FW, FH, "rgb", null));
            console.log(`flat | fadegrays | ${pair.tag} | yuv | p=0.5 biến thể gray-RGB(mean) ${fmt(mR)}`);
            results.rows.push({ pair: pair.tag, type, path: "yuv-variant", grayRgbMean: { mad: +mR.mad.toFixed(4), le8: +mR.le8.toFixed(4), verdict: classify(mR) } });
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
    const renderXfade = (type, tag, pathName) => {
      const out = path.join(TMP, `${tag}.raw`);
      const post = pathName === "yuv" ? ",format=rgb24" : "";
      ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(WIN_B), "-t", "2", "-i", FILE_B,
        "-filter_complex", `[0:v]${norm(pathName)}[a];[1:v]${norm(pathName)}[b];[a][b]xfade=transition=${type}:duration=1:offset=1${post},format=rgb24,select='eq(n,45)'[v]`,
        "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
      const buf = fs.readFileSync(out);
      rm(out);
      return buf;
    };
    console.log(`== I4 footage (frame 45 @30fps, p=0.5, ${W}x${H}) ==`);
    console.log(`A: ${FILE_A} (cửa sổ ${WIN_A}–${WIN_A + 2}s)`);
    console.log(`B: ${FILE_B} (cửa sổ ${WIN_B}–${WIN_B + 2}s)`);
    results.windows = { winA: WIN_A, winB: WIN_B, size: `${W}x${H}` };
    for (const pathName of ["rgb", "yuv"]) {
      const frameA = sourceFrame(FILE_A, WIN_A, 45, `srcA-${pathName}`, pathName);
      const frameB = sourceFrame(FILE_B, WIN_B, 15, `srcB-${pathName}`, pathName);
      for (const type of TYPES) {
        const rendered = renderXfade(type, `x-i4-${type}-${pathName}`, pathName);
        const m = compareFrames(rendered, previewFrame(tp, type, 0.5, frameA, frameB, W, H, pathName, null));
        console.log(`footage | ${type} | ${pathName} | p=0.5 ${fmt(m)}`);
        const row = { type, path: pathName, p: 0.5, mad: +m.mad.toFixed(4), le8: +m.le8.toFixed(4), verdict: classify(m) };
        if (pathName === "yuv" && (type === "fadeblack" || type === "fadewhite")) {
          const theory = type === "fadeblack" ? -18.63 : 23.1;
          const mT = compareFrames(rendered, previewFrame(tp, type, 0.5, frameA, frameB, W, H, pathName, { yuvLevelOffset: theory }));
          const m0 = compareFrames(rendered, previewFrame(tp, type, 0.5, frameA, frameB, W, H, pathName, { yuvLevelOffset: 0 }));
          console.log(`footage | ${type} | yuv | p=0.5 biến thể: lý thuyết(${theory}) ${fmt(mT)} | tắt-offset(0) ${fmt(m0)}`);
          row.variantTheory = { offset: theory, mad: +mT.mad.toFixed(4), le8: +mT.le8.toFixed(4), verdict: classify(mT) };
          row.variantNoOffset = { mad: +m0.mad.toFixed(4), le8: +m0.le8.toFixed(4), verdict: classify(m0) };
        }
        if (pathName === "yuv" && type === "fadegrays") {
          const mR = compareFrames(rendered, previewFrame(tp, type, 0.5, frameA, frameB, W, H, "rgb", null));
          console.log(`footage | fadegrays | yuv | p=0.5 biến thể gray-RGB(mean) ${fmt(mR)}`);
          row.variantGrayRgbMean = { mad: +mR.mad.toFixed(4), le8: +mR.le8.toFixed(4), verdict: classify(mR) };
        }
        results.rows.push(row);
      }
    }
  }
  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify(results, null, 2) + "\n");
    console.log(`JSON: ${JSON_OUT}`);
  }
  console.log(`workdir: ${TMP} (raw đã xoá sau mỗi phép đo)`);
}

main();
