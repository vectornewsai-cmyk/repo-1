#!/usr/bin/env node
/**
 * test_motion_render.js — Test THẬT Phase 9 đợt 8 S2: slow-mo mượt /
 * nội suy frame / motion blur (minterpolate + tmix, FFmpeg có sẵn).
 *
 * Dùng chính buildMotionChain/buildSpeedFilter của repo (không mock) và
 * chạy FFmpeg thật (8.1.2). Các case:
 *   A. Nội suy frame: testsrc2 15fps + speed 0.5, chain unit với fps=15
 *      (baseline, không motion) so với minterpolate fps=30 (có motion).
 *      Vì render.js cuối cùng chuẩn hóa bằng `-r <projectFps>` nên phép
 *      đếm gấp đôi được đo Ở MỨC CHAIN UNIT (trước khi chuẩn hóa cuối),
 *      đúng vị trí mà motion thay thế filter fps — xem MOTION_LIMITS.md.
 *      Kỳ vọng: baseline ≈ 60 frame, nội suy ≈ 120 frame (±2 frame).
 *      (Minterpolate trần rớt đuôi 113 frame — buildMotionChain đã thêm
 *      fps=<targetFps> sau minterpolate để lấp đầy lưới CFR, đo lại 120.)
 *   B. Motion blur: cùng một frame testsrc2, có tmix frames=5 thì năng
 *      lượng biên (mean gradient, đo bằng PIL/numpy) phải giảm so với gốc.
 *   C. Hồi quy: spec không motion render qua render.js --dry-run cho
 *      graph KHÔNG chứa minterpolate/tmix; spec có motion render thật
 *      thành công qua render.js (đúng duration/fps cuối).
 *   D. Alpha: chain minterpolate+tmix trên yuva420p chạy được, frame
 *      trích ra vẫn có kênh alpha (PNG RGBA).
 *   E. Validator: fail-fast các motion không hợp lệ, motion hợp lệ pass.
 *
 * Cách chạy: node src/test_motion_render.js   (cần ffmpeg, ffprobe, python3+PIL+numpy)
 * File tạm nằm trong os.tmpdir().
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateSpec } = require("./validate");
const { buildMotionChain, validateMotion } = require("./motion"); // P6: validateMotion dùng cho assert strict
const { buildSpeedFilter } = require("./speed");

const W = 320, H = 180;
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-motion-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}
function countFrames(mp4) {
  const r = run("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0",
    "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", mp4], `đếm frame ${mp4}`);
  return Number(r.stdout.toString().trim());
}
function probe(mp4, entry) {
  const r = run("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", `stream=${entry}`, "-of", "csv=p=0", mp4], `probe ${entry}`);
  return r.stdout.toString().trim();
}

// Chuỗi unit của clip thường trong render.js (trim → setpts speed → scale
// → pad → fps/motion → format), dựng từ chính builder của repo.
function unitChain(motion, projectFps) {
  const spd = buildSpeedFilter(0.5, false);
  const mc = buildMotionChain(motion, projectFps);
  return `trim=start=0:end=2,setpts=PTS-STARTPTS,${spd.video},` +
    `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,` +
    `setsar=1,${mc.fpsFilter}${mc.blurChain},format=yuv420p`;
}
function renderChain(vf, name) {
  const out = path.join(work, `${name}.mp4`);
  run("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", `testsrc2=size=${W}x${H}:rate=15:duration=4`,
    "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
    "-an", "-y", out], `render chain ${name}`);
  return out;
}

function main() {
  // ---------- A: nội suy frame gấp đôi ở mức chain unit ----------
  console.log("A: testsrc2 15fps + speed 0.5, baseline fps=15 vs minterpolate fps=30");
  const base = renderChain(unitChain(undefined, 15), "a-base");
  const interp = renderChain(unitChain({ interpolation: "minterpolate", targetFps: 30 }, 15), "a-interp");
  const nBase = countFrames(base);
  const nInterp = countFrames(interp);
  console.log(`   baseline (fps=15): ${nBase} frame; nội suy (fps=30): ${nInterp} frame`);
  ok(Math.abs(nBase - 60) <= 2, `baseline ≈ 60 frame (thực: ${nBase})`);
  ok(Math.abs(nInterp - 120) <= 2, `nội suy ≈ 120 frame (thực: ${nInterp})`);
  ok(Math.abs(nInterp - 2 * nBase) <= 4, `nội suy ≈ gấp đôi baseline (${nInterp} vs 2×${nBase})`);

  // ---------- B: motion blur giảm năng lượng biên ----------
  console.log("B: tmix frames=5 làm giảm năng lượng biên so với gốc");
  const sharp2 = path.join(work, "b-sharp2.mp4");
  const blur2 = path.join(work, "b-blur2.mp4");
  run("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", `testsrc2=size=${W}x${H}:rate=30:duration=2`,
    "-vf", `scale=${W}:${H},setsar=1,fps=30,format=yuv420p`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-an", "-y", sharp2], "render b-sharp2");
  run("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", `testsrc2=size=${W}x${H}:rate=30:duration=2`,
    "-vf", `scale=${W}:${H},setsar=1,fps=30,tmix=frames=5:weights=1 1 1 1 1,format=yuv420p`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-an", "-y", blur2], "render b-blur2");
  const frame = (mp4, name) => {
    const png = path.join(work, `${name}.png`);
    run("ffmpeg", ["-v", "error", "-ss", "1.0", "-i", mp4, "-vframes", "1", "-y", png], `trích frame ${name}`);
    return png;
  };
  const measure = (png) => {
    const r = run("python3", [path.join(__dirname, "test_motion_measure.py"), png], `đo gradient ${png}`);
    return Number(r.stdout.toString().trim());
  };
  const gSharp = measure(frame(sharp2, "b-sharp2-f"));
  const gBlur = measure(frame(blur2, "b-blur2-f"));
  console.log(`   gradient gốc: ${gSharp.toFixed(3)}; gradient sau tmix: ${gBlur.toFixed(3)} ` +
    `(tỉ lệ ${(gBlur / gSharp).toFixed(3)})`);
  ok(gBlur < gSharp * 0.95, `tmix làm giảm năng lượng biên (tỉ lệ ${(gBlur / gSharp).toFixed(3)} < 0.95)`);

  // ---------- C: hồi quy + render thật qua render.js ----------
  console.log("C: render.js — no-motion graph sạch, motion render thật thành công");
  run("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", `testsrc2=size=${W}x${H}:rate=15:duration=4`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, "src15.mp4")], "tạo src15.mp4");
  const vclip = (id, extra = {}) => ({
    id, kind: "video", src: "src15.mp4", start: 0, duration: 4, in: 0, out: 2, speed: 0.5, ...extra,
  });
  const specNoMotion = {
    version: "0.2.0", meta: { name: "c-nomotion", width: W, height: H, fps: 30 },
    tracks: [{ id: "v0", kind: "video", clips: [vclip("c1")] }],
  };
  const specMotion = {
    version: "0.2.0", meta: { name: "c-motion", width: W, height: H, fps: 30 },
    tracks: [{ id: "v0", kind: "video", clips: [vclip("c1", {
      motion: { interpolation: "minterpolate", targetFps: 30, motionBlur: { frames: 3 } },
    })] }],
  };
  const dryRun = (specObj, name) => {
    const specPath = path.join(work, `${name}.json`);
    fs.writeFileSync(specPath, JSON.stringify(specObj, null, 2));
    const r = spawnSync("node", [path.join(__dirname, "render.js"),
      "--spec", specPath, "--out", path.join(work, `${name}.mp4`),
      "--media-dir", mediaDir, "--dry-run", "-q"],
    { stdio: ["ignore", "pipe", "pipe"] });
    if (r.status !== 0) {
      console.error(`❌ dry-run "${name}" thất bại:\n${(r.stderr || "").toString().slice(-1500)}`);
      process.exit(2);
    }
    return r.stdout.toString();
  };
  const cmdNoMotion = dryRun(specNoMotion, "c-nomotion");
  ok(!/minterpolate|tmix/.test(cmdNoMotion), "graph no-motion không chứa minterpolate/tmix");
  const cmdMotion = dryRun(specMotion, "c-motion");
  ok(/minterpolate=fps=30/.test(cmdMotion), "graph motion chứa minterpolate fps=30");
  ok(/tmix=frames=3/.test(cmdMotion), "graph motion chứa tmix frames=3");
  ok(/pad=[^,]+,setsar=1,(tpad=[^,]+,)?minterpolate/.test(cmdMotion),
    "minterpolate nằm sau pad (thay fps, sau tpad M1), đúng vị trí chain S2+M1");
  // Render thật spec motion qua render.js.
  const specPath = path.join(work, "c-motion-real.json");
  fs.writeFileSync(specPath, JSON.stringify(specMotion, null, 2));
  const outReal = path.join(work, "c-motion-real.mp4");
  const rr = spawnSync("node", [path.join(__dirname, "render.js"),
    "--spec", specPath, "--out", outReal, "--media-dir", mediaDir,
    "--x264-preset", "veryfast", "--crf", "23", "-y", "-q"],
  { stdio: ["ignore", "pipe", "pipe"] });
  ok(rr.status === 0, `render.js spec motion chạy thành công (mã ${rr.status})`);
  if (rr.status !== 0) {
    console.error((rr.stderr || "").toString().slice(-1500));
    process.exit(2);
  }
  const dur = Number(probe(outReal, "duration"));
  const fps = probe(outReal, "avg_frame_rate");
  console.log(`   output motion: duration=${dur}s, avg_frame_rate=${fps}`);
  ok(Math.abs(dur - 4) <= 0.2, `output motion dài ≈ 4s (thực: ${dur}s)`);
  ok(fps === "30/1", `output motion fps=30 (thực: ${fps})`);

  // ---------- D: alpha ----------
  console.log("D: minterpolate+tmix trên yuva420p giữ được kênh alpha");
  const alphaPng = path.join(work, "d-alpha.png");
  run("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", `testsrc2=size=${W}x${H}:rate=15:duration=1`,
    "-vf", "format=yuva420p,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1," +
    "tmix=frames=3:weights=1 1 1,format=yuva420p",
    "-vframes", "1", "-y", alphaPng], "render frame alpha");
  const rAlpha = run("python3", [path.join(__dirname, "test_motion_measure.py"), alphaPng, "mode"],
    "kiểm tra mode PNG");
  const mode = rAlpha.stdout.toString().trim();
  console.log(`   frame alpha trích ra: mode=${mode}`);
  ok(mode === "RGBA", `frame sau minterpolate+tmix vẫn có alpha (mode=${mode})`);

  // ---------- F (Phase 9 đợt 9 M1): vá đuôi đóng băng ----------
  // Chain unit qua buildMotionChain MỚI (có duration → đủ cặp tpad +
  // trim): testsrc2 15fps + speed 0.5, target 30fps, slot 4s.
  // Kỳ vọng: đúng 120 frame; KHÔNG còn frame đuôi đóng băng theo nghĩa
  // diff < 0.05 (trước vá: 6 frame đuôi ~0.0, xem MOTION_LIMITS.md M1);
  // giữa chuỗi vẫn chuyển động (mean diff frame 10..50 > 1.0).
  console.log("F: M1 — chain có tpad+trim: đủ frame, đuôi không đóng băng, giữa không đổi");
  {
    const mc = buildMotionChain({ interpolation: "minterpolate", targetFps: 30 }, 15, 4);
    ok(mc.preFilter === "tpad=stop_mode=clone:stop=4",
      `buildMotionChain có preFilter tpad (thực: ${mc.preFilter})`);
    ok(mc.tailFilter === ",trim=end_frame=120,setpts=PTS-STARTPTS",
      `buildMotionChain có tailFilter trim 120 (thực: ${mc.tailFilter})`);
    const spd = buildSpeedFilter(0.5, false);
    const vf = `trim=start=0:end=2,setpts=PTS-STARTPTS,${spd.video},` +
      `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
      `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,` +
      `setsar=1,${mc.preFilter},${mc.fpsFilter}${mc.blurChain}${mc.tailFilter},format=yuv420p`;
    const fixed = renderChain(vf, "f-fixed");
    const nFixed = countFrames(fixed);
    console.log(`   chain M1: ${nFixed} frame (kỳ vọng 120)`);
    ok(nFixed === 120, `chain M1 đúng 120 frame (thực: ${nFixed})`);
    // Giải mã gray thô, tính diff từng frame kề.
    const grayPath = path.join(work, "f-fixed.gray");
    run("ffmpeg", ["-i", fixed, "-vf", "format=gray", "-f", "rawvideo", "-y", grayPath], "giải mã f-fixed");
    const buf = fs.readFileSync(grayPath);
    const fs2 = W * H;
    const nF = Math.floor(buf.length / fs2);
    const diffs = [];
    for (let f = 1; f < nF; f++) {
      let s = 0;
      for (let i = 0; i < fs2; i++) s += Math.abs(buf[f * fs2 + i] - buf[(f - 1) * fs2 + i]);
      diffs.push(s / fs2);
    }
    let frozenTail = 0;
    for (let i = diffs.length - 1; i >= 0; i--) {
      if (diffs[i] < 0.05) frozenTail++;
      else break;
    }
    const midMean = diffs.slice(10, 50).reduce((a, b) => a + b, 0) / 40;
    console.log(`   đuôi đóng băng (diff < 0.05): ${frozenTail} frame; ` +
      `mid mean diff: ${midMean.toFixed(3)}; last 5 diff: ${diffs.slice(-5).map((d) => d.toFixed(3)).join(", ")}`);
    ok(frozenTail === 0, `đuôi không còn frame đóng băng (thực: ${frozenTail})`);
    ok(midMean > 1.0, `giữa chuỗi vẫn chuyển động (mid mean ${midMean.toFixed(3)} > 1.0)`);
    // Chain M1 qua render.js thật: graph phải chứa tpad + trim.
    const specFixed = {
      version: "0.2.0", meta: { name: "f-motion", width: W, height: H, fps: 30 },
      tracks: [{ id: "v0", kind: "video", clips: [vclip("c1", {
        motion: { interpolation: "minterpolate", targetFps: 30 },
      })] }],
    };
    const cmdFixed = dryRun(specFixed, "f-motion");
    ok(/tpad=stop_mode=clone:stop=4/.test(cmdFixed), "graph render.js chứa tpad clone-pad trước minterpolate");
    ok(/trim=end_frame=120/.test(cmdFixed), "graph render.js chứa trim đúng slot sau tmix/minterpolate");
  }

  // ---------- E: validator fail-fast ----------
  console.log("E: validator fail-fast");
  const baseSpec = (motion, trackKind = "video", extraClip = {}) => ({
    version: "0.2.0", meta: { name: "e", width: W, height: H, fps: 30 },
    tracks: [{ id: "t0", kind: trackKind,
      clips: [{ id: "c1", kind: trackKind, src: "src15.mp4", start: 0, duration: 2,
        in: 0, out: 2, ...(motion !== undefined ? { motion } : {}), ...extraClip }] }],
  });
  const badCases = [
    ["targetFps=0", { interpolation: "minterpolate", targetFps: 0 }],
    ["targetFps=121", { interpolation: "minterpolate", targetFps: 121 }],
    ["interpolation lạ", { interpolation: "rife" }],
    ["blur frames=1", { motionBlur: { frames: 1 } }],
    ["blur frames=9", { motionBlur: { frames: 9 } }],
    // NOTE Phase 9 đợt 11 P6: hai case dưới đây RỜI khỏi badCases một cách
    // có chủ ý (không phải hồi quy lặng lẽ): cổng load validateSpec giờ
    // migrate project cũ weights lệch/âm về dạng render được (xem khối P6
    // ngay dưới + server/render/src/motion.js normalizeLegacyMotion).
    // Tầng strict validateMotion vẫn từ chối input thô — chứng minh ở
    // test_motion_p6_legacy.js (B) và motion.js self-test.
  ];
  for (const [label, m] of badCases) {
    const v = validateSpec(baseSpec(m));
    ok(!v.ok && v.errors.length > 0, `validator từ chối ${label}`);
  }
  // Phase 9 đợt 11 P6: cổng load migrate project cũ (validateSpec pass),
  // nhưng tầng strict vẫn từ chối input thô.
  for (const [label, m] of [
    ["weights lệch frames", { motionBlur: { frames: 3, weights: [1, 1] } }],
    ["weights âm", { motionBlur: { frames: 2, weights: [1, -1] } }],
  ]) {
    const v = validateSpec(baseSpec(m));
    ok(v.ok, `P6 load gate migrate project cũ: validateSpec pass (${label})`);
    ok(validateMotion(m).length > 0, `P6 strict vẫn từ chối input thô (${label})`);
  }
  const vNonVideo = validateSpec(baseSpec({ interpolation: "minterpolate", targetFps: 30 }, "audio"));
  ok(!vNonVideo.ok, "validator từ chối motion trên clip audio");
  const vTrans = validateSpec({
    version: "0.2.0", meta: { name: "e", width: W, height: H, fps: 30 },
    tracks: [{ id: "t0", kind: "video", clips: [
      { id: "c1", kind: "video", src: "src15.mp4", start: 0, duration: 2, in: 0, out: 2,
        motion: { interpolation: "minterpolate", targetFps: 60 },
        transitionOut: { type: "fade", duration: 0.5 } },
      { id: "c2", kind: "video", src: "src15.mp4", start: 2, duration: 2, in: 0, out: 2 },
    ] }],
  });
  ok(!vTrans.ok, "validator từ chối targetFps != project fps + transition");
  const vGood = validateSpec(baseSpec({ interpolation: "minterpolate", targetFps: 30,
    motionBlur: { frames: 3, weights: [2, 1, 1] } }));
  ok(vGood.ok, `motion hợp lệ pass validator (errors: ${JSON.stringify(vGood.errors)})`);

  console.log(`\nKết quả: ${pass} pass, ${fail} fail (thư mục tạm: ${work})`);
  if (fail > 0) process.exit(1);
}

main();
