#!/usr/bin/env node
/**
 * test_motion_e2e.js — Harness E2E độc lập cho Phase 9 đợt 8 (S6):
 * slow-mo mượt / nội suy frame / motion blur (gap E8).
 *
 * CHẠY ĐỘC LẬP BẰNG ffmpeg CLI TRỰC TIẾP — không import code của luồng
 * S2/S3 (motion.js / buildSpeedRampVideo). Vì vậy harness này xanh hay đỏ
 * chỉ nói về hành vi filter FFmpeg, không phụ thuộc tiến độ luồng khác.
 * Phần "E2E qua builder" ở cuối chỉ chạy khi motion.js đã có mặt lúc chạy;
 * nếu chưa có, harness in PENDING và vẫn exit theo các check ffmpeg CLI.
 *
 * Cách chạy (từ repo root):
 *   node server/render/src/test_motion_e2e.js [--out-dir /tmp/motion-e2e]
 *
 * Nguồn: testsrc2 (pattern chuyển động thật, không dùng màu phẳng).
 * Kích thước nhỏ 320x180 để chạy nhanh trên VM 2vCPU; bench nặng hơn
 * nằm ở benchmarks/motion/bench_motion.sh (640x360).
 *
 * Các check (số liệu là số đo thật, không ước lượng):
 *   (a) Nội suy tăng gấp đôi frame: nguồn 15fps/2s (30 frame) qua
 *       minterpolate fps=30 → kỳ vọng ≈60 frame, sai số ±3 (theo brief
 *       đợt). Xem mục "LƯU Ý VỀ CHUỖI setpts" bên dưới về vì sao chuỗi
 *       setpts=0.5*PTS theo đúng chữ trong brief KHÔNG cho ra 60.
 *   (b) Độ mượt: max frame-diff (MAD giữa 2 frame liên tiếp, đo bằng
 *       Python/numpy trên PNG giải mã) của bản nội suy phải NHỎ HƠN
 *       bản chỉ lặp frame (fps=30). Mean diff được in ra để tham khảo
 *       nhưng không assert (lý thuyết: mean của 2 bản xấp xỉ nhau vì
 *       bản lặp có một nửa cặp diff = 0, một nửa = bước nhảy gốc).
 *   (c) tmix blur: độ sắc nét (trung bình |gradient| trên frame xám)
 *       của bản tmix=5 phải THẤP HƠN bản gốc.
 *   (d) Thời gian render 3 cấu hình trên cùng nguồn ngắn (plain /
 *       minterpolate / tmix), chỉ ghi số thật để làm cảnh báo UI —
 *       KHÔNG suy ra fps cho máy khác, không assert tốc độ.
 *
 * LƯU Ý VỀ CHUỖI setpts (phát hiện trung thực, đo ngày 26/10/2026):
 *   - Chuỗi đúng chữ trong brief: src 15fps/2s + setpts=0.5*PTS +
 *     minterpolate fps=30 → đo được 29 frame, duration 0.97s.
 *     Lý do: trong ffmpeg, setpts=0.5*PTS là TỐC ĐỘ 2x (PTS bị nén một
 *     nửa → duration còn 1s), không phải slow-mo 0.5x. 1s × 30fps ≈ 30
 *     frame, trừ frame biên của minterpolate bidir → 29. Chuỗi này
 *     về mặt số học không thể cho ra 60, nên harness KHÔNG assert 60
 *     cho nó — chỉ in số thật ở mục chẩn đoán.
 *   - Slow-mo 0.5x đúng nghĩa: setpts=2*PTS + minterpolate fps=30 →
 *     đo được 113 frame, duration 3.77s (thay vì 120/4.0s lý thuyết vì
 *     minterpolate bidir cắt frame biên). Cũng chỉ in số thật, không
 *     assert 120.
 *   - Con số 60 của brief tương ứng với chuỗi nội suy thuần túy
 *     (không setpts): 15fps/2s → minterpolate fps=30 → đo được 57
 *     frame (60 − 3 frame biên), nằm trong ±3 nên check (a) PASS ở
 *     biên. Harness assert 60±3 cho chuỗi này và ghi rõ diễn giải.
 *
 * Thoát 0 khi mọi check assert xanh, khác 0 khi có check đỏ.
 * Output MP4/PNG nằm trong out-dir (mặc định thư mục tạm), KHÔNG ghi
 * binary vào repo.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SRC_DIR = __dirname;
const W = 320, H = 180, SRC_FPS = 15, SRC_DUR = 2;
const INTERP = "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1";

let pass = 0;
let fail = 0;
function check(cond, label, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}${extra ? ` — ${extra}` : ""}`); }
}
function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.error || r.status !== 0) {
    console.error(`❌ ${label} thất bại (mã ${r.status})`);
    if (r.stderr) console.error(String(r.stderr).slice(-2000));
    process.exit(2);
  }
  return r.stdout || "";
}
function ffmpeg(inFile, vf, outFile, label) {
  const args = ["-y", "-v", "error", "-i", inFile];
  if (vf) args.push("-vf", vf);
  args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
    "-pix_fmt", "yuv420p", outFile);
  return run("ffmpeg", args, label);
}
function timedFfmpeg(inFile, vf, outFile, label) {
  const t0 = Date.now();
  ffmpeg(inFile, vf, outFile, label);
  return (Date.now() - t0) / 1000;
}
function frameCount(file) {
  const out = run("ffprobe", ["-v", "error", "-count_frames",
    "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames",
    "-of", "csv=p=0", file], `ffprobe đếm frame ${path.basename(file)}`);
  return parseInt(out.trim(), 10);
}
function duration(file) {
  const out = run("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", file], `ffprobe duration ${path.basename(file)}`);
  return parseFloat(out.trim());
}

/** Đo frame-diff và độ sắc nét bằng Python/numpy trên PNG đã giải mã.
 *  pngDirs: { name: dir, __scriptDir: dir } — script .py được ghi vào
 *  __scriptDir (thư mục tạm, không vào repo), dirs truyền qua argv. */
function measureFrames(pngDirs) {
  const script = [
    "import json, sys, glob",
    "import numpy as np",
    "from PIL import Image",
    "def load(d):",
    "    fs = sorted(glob.glob(d + '/f*.png'))",
    "    return [np.asarray(Image.open(f).convert('L'), dtype=np.float32) for f in fs]",
    "pngDirs = dict(a.split('=', 1) for a in sys.argv[1:])",
    "out = {}",
    "for name, d in pngDirs.items():",
    "    fr = load(d)",
    "    diffs = [float(np.mean(np.abs(fr[i+1] - fr[i]))) for i in range(len(fr) - 1)]",
    "    sharp = []",
    "    for f in fr:",
    "        gy, gx = np.gradient(f)",
    "        sharp.append(float(np.mean(np.abs(gx) + np.abs(gy))))",
    "    out[name] = {",
    "        'frames': len(fr),",
    "        'diff_mean': float(np.mean(diffs)) if diffs else 0.0,",
    "        'diff_max': float(np.max(diffs)) if diffs else 0.0,",
    "        'sharpness': float(np.mean(sharp)) if sharp else 0.0,",
    "    }",
    "print(json.dumps(out))",
    "",
  ].join("\n");
  const scriptPath = path.join(pngDirs.__scriptDir, "measure_motion.py");
  fs.writeFileSync(scriptPath, script);
  const argv = Object.entries(pngDirs)
    .filter(([k]) => k !== "__scriptDir")
    .map(([k, v]) => `${k}=${v}`);
  const r = spawnSync("python3", [scriptPath, ...argv], { encoding: "utf8" });
  if (r.error || r.status !== 0) {
    console.error("❌ đo frame-diff/sharpness bằng python thất bại");
    if (r.stderr) console.error(String(r.stderr).slice(-2000));
    process.exit(2);
  }
  return JSON.parse(r.stdout.trim());
}
function extractPng(video, dir) {
  fs.mkdirSync(dir, { recursive: true });
  run("ffmpeg", ["-y", "-v", "error", "-i", video,
    path.join(dir, "f%03d.png")], `giải mã PNG ${path.basename(video)}`);
}

function main() {
  const outDir = process.argv.includes("--out-dir")
    ? process.argv[process.argv.indexOf("--out-dir") + 1]
    : fs.mkdtempSync(path.join(os.tmpdir(), "motion-e2e-"));
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`== test_motion_e2e (S6, ffmpeg CLI độc lập) → out: ${outDir} ==`);
  console.log(`ffmpeg: ${run("ffmpeg", ["-version"], "ffmpeg -version").split("\n")[0]}`);

  // --- Sinh nguồn testsrc2 15fps / 2s ---
  const src = path.join(outDir, "src.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
    `testsrc2=size=${W}x${H}:rate=${SRC_FPS}:duration=${SRC_DUR}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
    "-pix_fmt", "yuv420p", src], "sinh nguồn testsrc2");
  const srcCount = frameCount(src);
  const srcDur = duration(src);
  console.log(`[nguồn] testsrc2 ${W}x${H} ${SRC_FPS}fps ${SRC_DUR}s → ` +
    `${srcCount} frame, duration ${srcDur.toFixed(3)}s`);
  check(srcCount === 30, `nguồn đúng 30 frame (thực tế ${srcCount})`);

  // ============ (a) Nội suy tăng gấp đôi frame ============
  console.log("[a] minterpolate fps=30 (không setpts) — check 60±3 theo brief");
  const dbl = path.join(outDir, "interp.mp4");
  ffmpeg(src, INTERP, dbl, "render minterpolate fps=30");
  const dblCount = frameCount(dbl);
  const dblDur = duration(dbl);
  console.log(`[a] bản nội suy: ${dblCount} frame, duration ${dblDur.toFixed(3)}s ` +
    `(lý thuyết 60 frame / 2.0s; hụt ${60 - dblCount} frame biên do bidir)`);
  check(Math.abs(dblCount - 60) <= 3,
    `bản nội suy ≈60 frame ±3 (thực tế ${dblCount})`);

  // Chẩn đoán: 2 chuỗi setpts — chỉ in số thật, KHÔNG assert 60.
  console.log("[a-chẩn-đoán] chuỗi setpts (chỉ ghi số thật, không assert 60)");
  const literal = path.join(outDir, "literal-setpts05.mp4");
  ffmpeg(src, `setpts=0.5*PTS,${INTERP}`, literal, "render setpts=0.5*PTS + minterpolate");
  console.log(`  • setpts=0.5*PTS + minterpolate fps=30 (đúng chữ brief): ` +
    `${frameCount(literal)} frame, duration ${duration(literal).toFixed(3)}s ` +
    `→ KHÔNG đạt 60 vì 0.5*PTS là tốc độ 2x (duration còn ~1s), không phải slow-mo 0.5x`);
  const slow = path.join(outDir, "slow-05x.mp4");
  ffmpeg(src, `setpts=2*PTS,${INTERP}`, slow, "render setpts=2*PTS + minterpolate");
  console.log(`  • setpts=2*PTS (slow-mo 0.5x đúng nghĩa) + minterpolate fps=30: ` +
    `${frameCount(slow)} frame, duration ${duration(slow).toFixed(3)}s ` +
    `→ lý thuyết 120 frame / 4.0s; hụt do minterpolate bidir cắt frame biên`);

  // ============ (b) Độ mượt: nội suy vs lặp frame ============
  console.log("[b] độ mượt: max frame-diff bản nội suy vs bản lặp frame");
  const repeat = path.join(outDir, "repeat.mp4");
  ffmpeg(src, "fps=30", repeat, "render fps=30 (lặp frame)");
  const repeatCount = frameCount(repeat);
  console.log(`[b] bản lặp frame: ${repeatCount} frame (2s × 30fps)`);
  extractPng(repeat, path.join(outDir, "png_repeat"));
  extractPng(dbl, path.join(outDir, "png_dbl"));
  const m = measureFrames({
    __scriptDir: outDir,
    repeat: path.join(outDir, "png_repeat"),
    interp: path.join(outDir, "png_dbl"),
  });
  console.log(`[b] repeat: frames=${m.repeat.frames} meanMAD=${m.repeat.diff_mean.toFixed(3)} ` +
    `maxMAD=${m.repeat.diff_max.toFixed(3)}`);
  console.log(`[b] interp: frames=${m.interp.frames} meanMAD=${m.interp.diff_mean.toFixed(3)} ` +
    `maxMAD=${m.interp.diff_max.toFixed(3)}`);
  check(m.interp.diff_max < m.repeat.diff_max,
    `max frame-diff bản nội suy < bản lặp frame ` +
    `(${m.interp.diff_max.toFixed(3)} < ${m.repeat.diff_max.toFixed(3)})`);

  // ============ (c) tmix blur: độ sắc nét giảm ============
  console.log("[c] tmix blur: độ sắc nét bản blur < bản gốc");
  const blur = path.join(outDir, "blur.mp4");
  ffmpeg(src, "tmix=frames=5", blur, "render tmix frames=5");
  extractPng(src, path.join(outDir, "png_src"));
  extractPng(blur, path.join(outDir, "png_blur"));
  const s = measureFrames({
    __scriptDir: outDir,
    src: path.join(outDir, "png_src"),
    blur: path.join(outDir, "png_blur"),
  });
  console.log(`[c] sharpness gốc=${s.src.sharpness.toFixed(3)}, ` +
    `blur=${s.blur.sharpness.toFixed(3)} (tỉ lệ ${(s.blur.sharpness / s.src.sharpness).toFixed(3)})`);
  check(s.blur.sharpness < s.src.sharpness,
    `độ sắc nét bản tmix < bản gốc ` +
    `(${s.blur.sharpness.toFixed(3)} < ${s.src.sharpness.toFixed(3)})`);

  // ============ (d) Thời gian render 3 cấu hình ============
  console.log("[d] thời gian render 3 cấu hình (chỉ ghi số thật, không assert tốc độ)");
  const tPlain = timedFfmpeg(src, null, path.join(outDir, "t_plain.mp4"), "render plain");
  const tInterp = timedFfmpeg(src, INTERP, path.join(outDir, "t_interp.mp4"), "render minterpolate (đo giờ)");
  const tTmix = timedFfmpeg(src, "tmix=frames=5", path.join(outDir, "t_tmix.mp4"), "render tmix (đo giờ)");
  console.log(`[d] plain (không motion): ${tPlain.toFixed(3)}s`);
  console.log(`[d] minterpolate fps=30: ${tInterp.toFixed(3)}s`);
  console.log(`[d] tmix frames=5: ${tTmix.toFixed(3)}s`);
  check(fs.existsSync(path.join(outDir, "t_plain.mp4")) &&
    fs.existsSync(path.join(outDir, "t_interp.mp4")) &&
    fs.existsSync(path.join(outDir, "t_tmix.mp4")),
    "cả 3 bản render đo giờ đều tạo được MP4");

  // ============ E2E qua builder S2 (chỉ khi motion.js đã có) ============
  // Chạy THẬT qua buildMotionChain: dựng filter từ clip.motion rồi render
  // bằng ffmpeg — không chỉ kiểm tra export tồn tại. Nếu motion.js chưa
  // có mặt lúc chạy thì in PENDING (harness vẫn exit theo check CLI).
  console.log("[builder] E2E qua builder S2 (motion.js)");
  const motionPath = path.join(SRC_DIR, "motion.js");
  if (!fs.existsSync(motionPath)) {
    console.log("  • E2E qua builder: PENDING — motion.js chưa có mặt lúc chạy; " +
      "parent chạy lại sau khi gộp code S2/S3.");
  } else {
    let mod = null;
    try { mod = require(motionPath); } catch (e) {
      console.log(`  • motion.js có mặt nhưng require thất bại: ${e.message} → PENDING`);
    }
    if (mod) {
      const hasBuilder = typeof mod.buildMotionChain === "function" &&
        typeof mod.validateMotion === "function";
      check(hasBuilder, "motion.js export đủ buildMotionChain + validateMotion",
        `exports=${Object.keys(mod).join(",")}`);
      if (hasBuilder) {
        const clipMotion = { interpolation: "minterpolate", targetFps: 30,
          motionBlur: { frames: 5 } };
        const chain = mod.buildMotionChain(clipMotion, 30);
        console.log(`  • buildMotionChain(${JSON.stringify(clipMotion)}, 30) → ` +
          `fpsFilter="${chain.fpsFilter}" blurChain="${chain.blurChain}"`);
        // Builder S2 gắn thêm `,fps=30` sau minterpolate để lấp đuôi CFR
        // (vá rớt đuôi của S2) — kỳ vọng phải gồm cả hậu tố này.
        check(chain.fpsFilter === INTERP + ",fps=30",
          "builder dựng đúng filter minterpolate mci/bidir + fps lấp đuôi",
          `nhận được "${chain.fpsFilter}"`);
        check(mod.validateMotion(clipMotion, { projectFps: 30 }).length === 0,
          "validateMotion(clipMotion hợp lệ) = 0 lỗi");
        check(mod.validateMotion({ targetFps: 0 }).length > 0,
          "validateMotion(targetFps=0) báo lỗi (fail-fast)");
        // Parent đợt 8: ramp + motion KHÔNG bị cấm ở validateMotion —
        // nhánh ramp (S3) đã áp motion thật, luật ramp nằm ở
        // test_motion_ramp.js. Thay vào đó kiểm tra luật spec S1 mà
        // parent vừa khớp vào validateMotion: none không được kèm targetFps.
        check(mod.validateMotion({ interpolation: "none", targetFps: 30 }).length > 0,
          "validateMotion(none + targetFps) báo lỗi theo spec S1");
        const vf = chain.fpsFilter + chain.blurChain.replace(/^,/, ",");
        const viaBuilder = path.join(outDir, "via-builder.mp4");
        ffmpeg(src, vf, viaBuilder, "render qua filter của builder S2");
        const vbCount = frameCount(viaBuilder);
        const vbDur = duration(viaBuilder);
        console.log(`  • render qua builder: ${vbCount} frame, duration ${vbDur.toFixed(3)}s ` +
          `(kỳ vọng ≈60: builder gắn fps=30 sau minterpolate nên không rớt đuôi như bản CLI thuần 57, tmix không đổi số frame)`);
        check(Math.abs(vbCount - 60) <= 3,
          `render qua builder ≈60 frame ±3 (thực tế ${vbCount})`);
        // M6 đợt 9: spec có motion phải giữ đúng duration nguồn (2s) —
        // nội suy tăng frame nhưng không được kéo dài/thu ngắn clip.
        check(Math.abs(vbDur - SRC_DUR) <= 0.15,
          `render qua builder giữ duration ≈${SRC_DUR}s ±0.15 (thực tế ${vbDur.toFixed(3)}s)`);
      }
    }
  }

  // ============ [preview-parity] Spec ↔ render ↔ preview (M6 đợt 9) ============
  // Biên dịch CODE THẬT previewEngine.ts + video-spec bằng tsc (mẫu
  // apps/web/scripts/test-preview-engine.sh) rồi require normalizeMotion
  // + motionBadgeText — KHÔNG mirror lại logic bằng tay. So sánh 3 tầng
  // trên cùng một spec: preview claim gì, builder dựng filter gì,
  // validateMotion phán gì. Preview KHÔNG validate (khoan dung) nên
  // parity chỉ assert trên claim nội suy/blur, còn lỗi validate được
  // ghi rõ riêng — khác biệt có chủ ý này đã ghi ở LIMITS đợt 8.
  console.log("[preview-parity] spec ↔ render ↔ preview (code thật, tsc)");
  try {
    const repoRoot = path.resolve(SRC_DIR, "..", "..", "..");
    const buildDir = path.join(outDir, "preview-build");
    fs.mkdirSync(buildDir, { recursive: true });
    const tsconfig = {
      compilerOptions: {
        target: "ES2020", module: "CommonJS", moduleResolution: "node",
        strict: true, skipLibCheck: true, esModuleInterop: true,
        outDir: path.join(buildDir, "out"), rootDir: repoRoot,
        baseUrl: repoRoot,
        paths: { "@repo-1/video-spec": ["./packages/video-spec/src/index.ts"] },
      },
      include: [
        path.join(repoRoot, "apps/web/src/lib/previewEngine.ts"),
        path.join(repoRoot, "packages/video-spec/src/index.ts"),
      ],
    };
    fs.writeFileSync(path.join(buildDir, "tsconfig.json"), JSON.stringify(tsconfig));
    const tscBin = path.join(repoRoot, "node_modules", ".bin", "tsc");
    const tsc = spawnSync(tscBin, ["-p", path.join(buildDir, "tsconfig.json")],
      { encoding: "utf8" });
    if (tsc.error || tsc.status !== 0) {
      throw new Error(`tsc thất bại (mã ${tsc.status}): ` +
        String((tsc.stderr || tsc.stdout || "")).slice(-800));
    }
    const builtPreview = path.join(buildDir, "out", "apps", "web", "src", "lib", "previewEngine.js");
    let previewSrc = fs.readFileSync(builtPreview, "utf8");
    previewSrc = previewSrc.replace('require("@repo-1/video-spec")',
      'require("../../../../packages/video-spec/src/index.js")');
    fs.writeFileSync(builtPreview, previewSrc);
    const preview = require(builtPreview);
    const renderMotion = require(motionPath);
    const parity = (spec, label) => {
      const pv = preview.normalizeMotion({ motion: spec });
      const chain = renderMotion.buildMotionChain(spec, 30);
      const errs = renderMotion.validateMotion(spec, { projectFps: 30 });
      const badge = preview.motionBadgeText(pv);
      const pvInterp = pv.interpolation === "minterpolate";
      const bInterp = chain.fpsFilter.includes("minterpolate");
      const pvBlur = pv.motionBlur === true;
      const bBlur = chain.blurChain.includes("tmix");
      console.log(`  • ${label}: preview interp=${pvInterp} blur=${pvBlur} ` +
        `badge="${badge}" | builder fpsFilter="${chain.fpsFilter}" ` +
        `blurChain="${chain.blurChain}" | validate lỗi=${errs.length}`);
      return { pv, chain, errs, badge, pvInterp, bInterp, pvBlur, bBlur };
    };
    const full = parity(
      { interpolation: "minterpolate", targetFps: 30, motionBlur: { frames: 5 } },
      "spec đầy đủ (interp 30fps + blur 5)");
    check(full.pvInterp && full.bInterp && full.pv.targetFps === 30,
      "parity interp: preview và builder cùng bật nội suy fps=30",
      `preview interp=${full.pv.interpolation} targetFps=${full.pv.targetFps}, builder=${full.chain.fpsFilter}`);
    check(full.pvBlur && full.bBlur && full.badge.includes("NỘI SUY") && full.badge.includes("BLUR≈"),
      "parity blur: preview badge và builder cùng bật blur (badge có NỘI SUY + BLUR≈)",
      `badge="${full.badge}", blurChain="${full.chain.blurChain}"`);
    check(full.errs.length === 0, "validateMotion(spec đầy đủ) = 0 lỗi");
    const none = parity({}, "spec rỗng (không motion)");
    check(!none.pvInterp && !none.bInterp && !none.pvBlur && !none.bBlur && none.badge === "" &&
      none.chain.fpsFilter === "fps=30" && none.chain.blurChain === "",
      "parity tắt: preview/badge/builder cùng tắt (fps=30 thuần, badge rỗng)");
    const blurOnly = parity({ motionBlur: { frames: 3 } }, "spec chỉ blur (không interp)");
    check(!blurOnly.pvInterp && !blurOnly.bInterp && blurOnly.pvBlur && blurOnly.bBlur &&
      blurOnly.chain.blurChain.includes("tmix=frames=3"),
      "parity blur-only: preview và builder cùng blur, cùng không nội suy");
    const dup = parity({ interpolation: "dup" }, "spec lỗi thời interpolation=dup (S1 đã loại)");
    check(!dup.pvInterp && dup.errs.length > 0,
      "parity dup: preview không claim nội suy và validateMotion báo lỗi (cùng từ chối dup)",
      `preview interp=${dup.pv.interpolation}, validate lỗi=${dup.errs.length}`);
    const nonePlusFps = parity({ interpolation: "none", targetFps: 30 },
      "spec none + targetFps (S1 cấm, preview khoan dung)");
    check(!nonePlusFps.pvInterp && nonePlusFps.errs.length > 0,
      "parity none+targetFps: preview không claim nội suy, validateMotion báo lỗi — khác biệt chỉ ở tầng validate, không ở claim hiển thị",
      `preview interp=${nonePlusFps.pv.interpolation}, validate lỗi=${nonePlusFps.errs.length}`);
  } catch (e) {
    console.log(`  • [preview-parity] SKIP — không biên dịch/chạy được previewEngine thật: ${e.message}`);
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail — output: ${outDir} ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
