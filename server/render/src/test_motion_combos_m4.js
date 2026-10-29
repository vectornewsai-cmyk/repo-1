#!/usr/bin/env node
/**
 * test_motion_combos_m4.js — Test THẬT Phase 9 đợt 9 M4: các TỔ HỢP motion
 * ở render mà đợt 8 chưa đo (chỉ dừng ở lý luận theo thứ tự chain hoặc
 * claim "cho phép" chưa có số).
 *
 * Render bằng chính render.js (không mock), nguồn thật (shaky / màu đặc),
 * đo frame count / duration / pixel thật bằng ffprobe + PIL.
 *
 *   A. stabilize + interpolation (nhánh thường): vidstabtransform (enhPre,
 *      trước scale) + minterpolate (thay fps, sau pad). Kỳ vọng: đúng 90
 *      frame / 3s @ 30fps; jitter marker đỏ giảm như stabilize-only (tức
 *      stabilize vẫn tác dụng xuyên qua interpolation); frame khác bản
 *      stabilize-only (tức minterpolate không bị bypass); dry-run graph
 *      có vidstabtransform ĐỨNG TRƯỚC minterpolate.
 *   B. stabilize + motionBlur (nhánh thường): tmix sau fps. Kỳ vọng: đúng
 *      frame/duration; MAD (độ thay đổi frame liên tiếp) giảm mạnh so với
 *      stabilize-only (gradient tĩnh không nhạy trên texture shaky thô nên
 *      chỉ ghi số tham khảo, không làm chỉ số chính).
 *   C. mask-keyframes + motion (nhánh thường): mask animation (video .mkv
 *      ở fps project, áp SAU motion) + interpolation cùng fps, khác fps
 *      (60 @ project 30, không transition), và motionBlur. Kỳ vọng: vị trí
 *      mask đúng ở cả t=0.5 (trái) và t=2.5 (phải) trong cả 3 trường hợp —
 *      tức mask-keyframes + targetFps != project fps VẪN ĐƯỢC HỖ TRỢ
 *      (blend đồng bộ theo timestamp + `-r` cuối chuẩn hoá lại), KHÔNG
 *      cần fail-fast.
 *   D. mask-keyframes + ramp + motion: mask di chuyển trên clip ramp có
 *      interpolation. Kỳ vọng: vị trí mask đúng ở t=0.5 / t=2.5, đúng
 *      frame/duration.
 *   E. ramp + motion + transition (xfade): clip ramp+motion nối với clip
 *      thường, và cả hai clip đều ramp+motion, qua fade 0.5s. Kỳ vọng
 *      theo ngữ nghĩa D có sẵn (test_p3 E9): output dài D = clip kết thúc
 *      muộn nhất theo khai báo (4s, 120 frame), unit merge dài 3.5s nên
 *      đuôi 3.5–4s là nền đen; vùng merge đúng (đỏ → pha → xanh). Kèm fail-fast Ở
 *      MỨC CẶP transition (mới, M4): chỉ clip A khai transitionOut mà
 *      clip B mang targetFps != project fps thì validator PHẢI từ chối
 *      (trước M4 nó lọt và render vỡ xfade timebase 1/30 vs 1/60, ffmpeg
 *      mã 234); chiều ngược (chỉ B khai transitionIn, A mang targetFps)
 *      cũng phải từ chối; các trường hợp hợp lệ vẫn pass.
 *   F. Hồi quy fail-fast đã có: stabilize + ramp (+ motion) vẫn bị chặn;
 *      targetFps != project fps + transitionOut trên cùng clip vẫn bị chặn.
 *
 * Cách chạy: node src/test_motion_combos_m4.js (từ server/render).
 * Cần ffmpeg, ffprobe, python3 + PIL + numpy. File tạm trong os.tmpdir().
 * Minterpolate mci ở 320×180 khá chậm nên clip chỉ 2–3s, preset veryfast.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateSpec } = require("./validate");

const W = 320, H = 180, FPS = 30;
const ROOT = path.join(__dirname, ".."); // server/render
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-motioncombos-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const RENDER = path.join(__dirname, "render.js");

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
function runNoFail(cmd, args) {
  return spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
}
function countFrames(mp4) {
  const r = run("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0",
    "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", mp4], `đếm frame ${mp4}`);
  return Number(r.stdout.toString().trim());
}
function probeDur(mp4) {
  const r = run("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=duration", "-of", "csv=p=0", mp4], `probe duration ${mp4}`);
  return Number(r.stdout.toString().trim());
}
function renderSpec(specObj, name) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(specObj, null, 2));
  const out = path.join(work, `${name}.mp4`);
  const r = runNoFail("node", [RENDER, "--spec", specPath, "--out", out,
    "--media-dir", mediaDir, "--x264-preset", "veryfast", "--crf", "28", "-y", "-q"]);
  if (r.status !== 0) {
    console.error(`❌ render "${name}" thất bại (mã ${r.status}):\n${((r.stderr || "") + (r.stdout || "")).toString().slice(-1500)}`);
    process.exit(2);
  }
  return out;
}
function dryRunGraph(specObj, name) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(specObj, null, 2));
  const r = runNoFail("node", [RENDER, "--spec", specPath, "--out", path.join(work, `${name}.mp4`),
    "--media-dir", mediaDir, "--dry-run", "-q"]);
  if (r.status !== 0) {
    console.error(`❌ dry-run "${name}" thất bại:\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return (r.stdout || "").toString();
}
function framePng(mp4, t, tag) {
  const png = path.join(work, `${tag}.png`);
  run("ffmpeg", ["-v", "error", "-ss", String(t), "-i", mp4, "-frames:v", "1", "-y", png], `trích frame ${tag}`);
  return png;
}
function pixel(png, x, y) {
  const r = run("python3", ["-c",
    `from PIL import Image; im = Image.open(${JSON.stringify(png)}).convert("RGB"); print(*im.getpixel((${x}, ${y})))`],
    `đọc pixel ${png}`);
  return r.stdout.toString().trim().split(/\s+/).map(Number);
}
function meanAbsDiff(pngA, pngB) {
  const r = run("python3", ["-c",
    `from PIL import Image; import numpy as np; ` +
    `a = np.asarray(Image.open(${JSON.stringify(pngA)}).convert("RGB"), dtype=np.float64); ` +
    `b = np.asarray(Image.open(${JSON.stringify(pngB)}).convert("RGB"), dtype=np.float64); ` +
    `print(f"{np.abs(a - b).mean():.4f}")`], `meanAbsDiff`);
  return Number(r.stdout.toString().trim());
}
function gradient(png) {
  const r = run("python3", [path.join(__dirname, "test_motion_measure.py"), png], `đo gradient ${png}`);
  return Number(r.stdout.toString().trim());
}
function mad(video) {
  const r = run("python3", [path.join(ROOT, "test_p2_measure.py"), "mad", video], `đo mad ${video}`);
  const m = /consec_MAD=([0-9.]+)/.exec(r.stdout.toString());
  return m ? Number(m[1]) : NaN;
}
function redx(video) {
  const r = run("python3", [path.join(ROOT, "test_p2_measure.py"), "redx", video], `đo redx ${video}`);
  const m = /red_centroid_x_std=([0-9.]+)/.exec(r.stdout.toString());
  const f = /frames=(\d+)/.exec(r.stdout.toString());
  return { std: m ? Number(m[1]) : NaN, frames: f ? Number(f[1]) : 0 };
}

const isRed = (px) => px[0] > 150 && px[1] < 100 && px[2] < 100;
const isBlue = (px) => px[2] > 150 && px[0] < 100 && px[1] < 100;
const isBlack = (px) => px[0] < 50 && px[1] < 50 && px[2] < 50;
const isMix = (px) => px[0] > 70 && px[0] < 190 && px[2] > 70 && px[2] < 190;

function main() {
  // ---------- Media ----------
  console.log("Media: shaky (P2 gen) + màu đặc đỏ/xanh");
  run("python3", [path.join(ROOT, "test_p2_gen_shaky.py"), path.join(mediaDir, "shaky.mp4")], "tạo shaky.mp4");
  for (const [name, color, dur] of [["red3", "0xff0000", 3], ["red2", "0xff0000", 2], ["blue2", "0x0000ff", 2]]) {
    run("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", `color=c=${color}:s=${W}x${H}:d=${dur}:r=30`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
      "-an", "-y", path.join(mediaDir, `${name}.mp4`)], `tạo ${name}.mp4`);
  }
  const spec1 = (clip, name) => ({
    version: "0.2.0", meta: { name, width: W, height: H, fps: FPS },
    tracks: [{ id: "v0", kind: "video", clips: [clip] }],
  });
  const vclip = (id, src, dur, extra = {}) => ({
    id, kind: "video", src, start: 0, duration: dur, in: 0, out: dur, ...extra,
  });
  const movingRectMask = {
    shape: "rect", x: 0.5, y: 0.5, w: 0.4, h: 1.0, feather: 0,
    keyframes: [
      { t: 0, x: 0.2, y: 0.5, w: 0.4, h: 1.0 },
      { t: 3, x: 0.8, y: 0.5, w: 0.4, h: 1.0 },
    ],
  };
  const checkMovingMask = (out, tag) => {
    const l0 = pixel(framePng(out, 0.5, `${tag}-t05`), 40, 90);
    const r0 = pixel(framePng(out, 0.5, `${tag}-t05b`), 280, 90);
    const l1 = pixel(framePng(out, 2.5, `${tag}-t25`), 40, 90);
    const r1 = pixel(framePng(out, 2.5, `${tag}-t25b`), 280, 90);
    console.log(`   ${tag}: t=0.5 trái=${l0} phải=${r0}; t=2.5 trái=${l1} phải=${r1}`);
    ok(isRed(l0) && isBlack(r0), `${tag}: t=0.5 mask ở trái (trái đỏ, phải đen)`);
    ok(isBlack(l1) && isRed(r1), `${tag}: t=2.5 mask ở phải (trái đen, phải đỏ)`);
  };

  // ---------- A: stabilize + interpolation ----------
  console.log("A: stabilize + interpolation (nhánh thường, shaky 3s @ 30fps)");
  const aInterp = renderSpec(spec1(vclip("c1", "shaky.mp4", 3,
    { motion: { interpolation: "minterpolate", targetFps: 30 } }), "a-interp"), "a-interp");
  const aStab = renderSpec(spec1(vclip("c1", "shaky.mp4", 3,
    { enhance: { stabilize: { smoothing: 30 } } }), "a-stab"), "a-stab");
  const aCombo = renderSpec(spec1(vclip("c1", "shaky.mp4", 3,
    { enhance: { stabilize: { smoothing: 30 } },
      motion: { interpolation: "minterpolate", targetFps: 30 } }), "a-combo"), "a-combo");
  const rx0 = redx(aInterp);
  const rx2 = redx(aCombo);
  console.log(`   redx: interp-only std=${rx0.std} (frames=${rx0.frames}); ` +
    `stab+interp std=${rx2.std} (frames=${rx2.frames})`);
  ok(Math.abs(countFrames(aCombo) - 90) <= 2, `stab+interp đúng 90 frame (±2, thực: ${countFrames(aCombo)})`);
  ok(Math.abs(probeDur(aCombo) - 3) <= 0.2, `stab+interp duration ≈ 3s (thực: ${probeDur(aCombo)}s)`);
  ok(rx0.frames >= 60 && rx2.frames >= 60, `redx đo được đủ frame (interp-only ${rx0.frames}, combo ${rx2.frames})`);
  // Ngưỡng 0.75 (không phải 0.7 như P2 cho stabilize thuần): minterpolate
  // mci + vidstab đều có biến thiên nhỏ giữa các lần chạy (2 lần đo combo:
  // 1.57 và 2.32, cùng interp-only 3.466) nên 0.7 quá sát biên (2.32 < 2.43).
  // 0.75 vẫn chứng minh stabilize tác dụng thật (giảm ≥ 25%).
  ok(rx2.std < rx0.std * 0.75, `stabilize vẫn giảm jitter xuyên qua interpolation (redx ${rx0.std} → ${rx2.std})`);
  const diffAI = meanAbsDiff(framePng(aCombo, 1.0, "a-combo-f"), framePng(aStab, 1.0, "a-stab-f"));
  console.log(`   meanAbsDiff(stab+interp vs stab-only) @ t=1.0 = ${diffAI}`);
  ok(diffAI > 1.0, `minterpolate không bị bypass (frame combo khác stab-only, diff=${diffAI} > 1.0)`);
  const gA = dryRunGraph(spec1(vclip("c1", "shaky.mp4", 3,
    { enhance: { stabilize: { smoothing: 30 } },
      motion: { interpolation: "minterpolate", targetFps: 30 } }), "a-dry"), "a-dry");
  ok(/vidstabtransform/.test(gA) && /minterpolate=fps=30/.test(gA),
    "dry-run graph chứa cả vidstabtransform và minterpolate");
  ok(gA.indexOf("vidstabtransform") < gA.indexOf("minterpolate"),
    "thứ tự chain: vidstabtransform (enhPre, trước scale) đứng trước minterpolate (sau pad)");

  // ---------- B: stabilize + motionBlur ----------
  // Metric: MAD (độ thay đổi frame liên tiếp) — tmix trung bình 5 frame
  // liên tiếp nên MAD phải giảm mạnh trên nguồn rung. Gradient tĩnh KHÔNG
  // dùng làm chỉ số chính: texture shaky thô (ô cờ 40px) nên gradient chỉ
  // giảm 3.2% (3.366 → 3.259) dù tmix chạy thật — đã đo và ghi rõ ở đây
  // để đợt sau không "sửa" nhầm thành lỗi.
  console.log("B: stabilize + motionBlur (nhánh thường)");
  const bCombo = renderSpec(spec1(vclip("c1", "shaky.mp4", 3,
    { enhance: { stabilize: { smoothing: 30 } }, motion: { motionBlur: { frames: 5 } } }), "b-combo"), "b-combo");
  const gStab = gradient(framePng(aStab, 1.5, "b-stab-f"));
  const gBlur = gradient(framePng(bCombo, 1.5, "b-combo-f"));
  const mStab = mad(aStab);
  const mBlur = mad(bCombo);
  console.log(`   gradient: stab-only=${gStab.toFixed(3)}; stab+blur=${gBlur.toFixed(3)} (tỉ lệ ${(gBlur / gStab).toFixed(3)} — chỉ số phụ, texture thô)`);
  console.log(`   MAD: stab-only=${mStab}; stab+blur=${mBlur} (tỉ lệ ${(mBlur / mStab).toFixed(3)})`);
  ok(Math.abs(countFrames(bCombo) - 90) <= 2, `stab+blur đúng 90 frame (thực: ${countFrames(bCombo)})`);
  ok(mBlur < mStab * 0.7, `tmix làm giảm mạnh độ thay đổi frame liên tiếp sau stabilize (MAD ${mStab} → ${mBlur})`);
  const gB = dryRunGraph(spec1(vclip("c1", "shaky.mp4", 3,
    { enhance: { stabilize: { smoothing: 30 } }, motion: { motionBlur: { frames: 5 } } }), "b-dry"), "b-dry");
  ok(/vidstabtransform/.test(gB) && /tmix=frames=5/.test(gB),
    "dry-run graph stab+blur chứa cả vidstabtransform và tmix=frames=5");

  // ---------- C: mask-keyframes + motion ----------
  console.log("C: mask-keyframes + motion (nhánh thường, red 3s, rect di chuyển)");
  const c1 = renderSpec(spec1(vclip("c1", "red3.mp4", 3,
    { mask: movingRectMask, motion: { interpolation: "minterpolate", targetFps: 30 } }), "c-interp30"), "c-interp30");
  ok(Math.abs(countFrames(c1) - 90) <= 2, `mask+interp30 đúng 90 frame (thực: ${countFrames(c1)})`);
  checkMovingMask(c1, "c1");
  const c2 = renderSpec(spec1(vclip("c1", "red3.mp4", 3,
    { mask: movingRectMask, motion: { interpolation: "minterpolate", targetFps: 60 } }), "c-interp60"), "c-interp60");
  ok(Math.abs(countFrames(c2) - 90) <= 2, `mask+interp60 (không transition) đúng 90 frame sau -r 30 (thực: ${countFrames(c2)})`);
  ok(Math.abs(probeDur(c2) - 3) <= 0.2, `mask+interp60 duration ≈ 3s (thực: ${probeDur(c2)}s)`);
  checkMovingMask(c2, "c2");
  const c3 = renderSpec(spec1(vclip("c1", "red3.mp4", 3,
    { mask: movingRectMask, motion: { motionBlur: { frames: 3 } } }), "c-blur"), "c-blur");
  checkMovingMask(c3, "c3");

  // ---------- D: mask-keyframes + ramp + motion ----------
  console.log("D: mask-keyframes + ramp + motion (red 3s, ramp 1→0.5)");
  const rampCurve3 = { keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 3, v: 0.5, easing: "linear" },
  ] };
  const d1 = renderSpec(spec1(vclip("c1", "red3.mp4", 3,
    { speedKeyframes: rampCurve3, mask: movingRectMask,
      motion: { interpolation: "minterpolate" } }), "d-rampmask"), "d-rampmask");
  ok(Math.abs(countFrames(d1) - 90) <= 2, `mask+ramp+interp đúng 90 frame (thực: ${countFrames(d1)})`);
  checkMovingMask(d1, "d1");

  // ---------- E: ramp + motion + transition ----------
  console.log("E: ramp + motion + transition (fade 0.5s, red 2s → blue 2s)");
  const rampCurve2 = { keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 2, v: 0.5, easing: "linear" },
  ] };
  const transSpec = (clipA, clipB) => ({
    version: "0.2.0", meta: { name: "e-trans", width: W, height: H, fps: FPS },
    tracks: [{ id: "v0", kind: "video", clips: [clipA, clipB] }],
  });
  const checkTrans = (out, tag) => {
    // Ngữ nghĩa D CÓ SẴN (test_p3 E9 đã chốt, không phải hành vi mới của
    // M4): project D = clip kết thúc muộn nhất theo khai báo = 4s, unit
    // đã merge dài 3.5s nên output pad thêm 0.5s nền đen ở đuôi. Vì vậy
    // kiểm chứng ở đây là: tổng output 120 frame / 4s, vùng merge đúng
    // (đỏ → pha → xanh), và đuôi sau unit merge là đen.
    const n = countFrames(out);
    const d = probeDur(out);
    console.log(`   ${tag}: frames=${n}, duration=${d}`);
    ok(Math.abs(n - 120) <= 2, `${tag}: đúng 120 frame = D 4s×30 (±2, thực: ${n})`);
    ok(Math.abs(d - 4) <= 0.2, `${tag}: duration ≈ 4s = D khai báo (thực: ${d}s)`);
    const pA = pixel(framePng(out, 0.5, `${tag}-pa`), 160, 90);
    const pM = pixel(framePng(out, 1.75, `${tag}-pm`), 160, 90);
    const pB = pixel(framePng(out, 3.0, `${tag}-pb`), 160, 90);
    const pT = pixel(framePng(out, 3.75, `${tag}-pt`), 160, 90);
    console.log(`   ${tag}: t=0.5=${pA}; t=1.75(giữa transition)=${pM}; t=3.0=${pB}; t=3.75(đuôi pad)=${pT}`);
    ok(isRed(pA), `${tag}: trước transition là đỏ thuần`);
    ok(isMix(pM), `${tag}: giữa transition là màu pha đỏ+xanh`);
    ok(isBlue(pB), `${tag}: sau transition (trong unit merge) là xanh thuần`);
    ok(isBlack(pT), `${tag}: đuôi sau unit merge (3.5–4s) là nền đen theo ngữ nghĩa D`);
  };
  const e1 = renderSpec(transSpec(
    { ...vclip("a", "red2.mp4", 2, { speedKeyframes: rampCurve2,
      motion: { interpolation: "minterpolate" } }),
      transitionOut: { type: "fade", duration: 0.5 } },
    { ...vclip("b", "blue2.mp4", 2), start: 2 }), "e-ramp-trans");
  checkTrans(e1, "e1(ramp+motion → thường)");
  const e2 = renderSpec(transSpec(
    { ...vclip("a", "red2.mp4", 2, { speedKeyframes: rampCurve2,
      motion: { interpolation: "minterpolate" } }),
      transitionOut: { type: "fade", duration: 0.5 } },
    { ...vclip("b", "blue2.mp4", 2, { speedKeyframes: rampCurve2,
      motion: { interpolation: "minterpolate" } }), start: 2 }), "e-ramp-ramp-trans");
  checkTrans(e2, "e2(ramp+motion → ramp+motion)");

  // ---------- E3/E4: fail-fast mức cặp transition ----------
  console.log("E3: validator mức cặp transition (M4)");
  const pairSpec = (aExtra, bExtra) => ({
    version: "0.2.0", meta: { name: "e-pair", width: W, height: H, fps: FPS },
    tracks: [{ id: "v0", kind: "video", clips: [
      vclip("a", "red2.mp4", 2, aExtra),
      { ...vclip("b", "blue2.mp4", 2), start: 2, ...bExtra },
    ] }],
  });
  const vPairA = validateSpec(pairSpec(
    { transitionOut: { type: "fade", duration: 0.5 } },
    { motion: { interpolation: "minterpolate", targetFps: 60 } }));
  ok(!vPairA.ok && vPairA.errors.some((e) => /targetFps.*60/.test(e) && /transition/.test(e)),
    `validator từ chối: chỉ A khai transitionOut, B targetFps=60 (errors: ${JSON.stringify(vPairA.errors)})`);
  const vPairB = validateSpec(pairSpec(
    { motion: { interpolation: "minterpolate", targetFps: 60 } },
    { transitionIn: { type: "fade", duration: 0.5 } }));
  ok(!vPairB.ok && vPairB.errors.some((e) => /targetFps.*60/.test(e)),
    `validator từ chối: chỉ B khai transitionIn, A targetFps=60`);
  const vOk1 = validateSpec(pairSpec(
    { transitionOut: { type: "fade", duration: 0.5 } },
    { motion: { interpolation: "minterpolate", targetFps: 30 } }));
  ok(vOk1.ok, `control pass: cặp transition + targetFps === project fps (errors: ${JSON.stringify(vOk1.errors)})`);
  const vOk2 = validateSpec(pairSpec({}, { motion: { interpolation: "minterpolate", targetFps: 60 } }));
  ok(vOk2.ok, `control pass: targetFps != project fps nhưng KHÔNG transition`);
  const vOk3 = validateSpec(pairSpec(
    { speedKeyframes: rampCurve2, motion: { interpolation: "minterpolate" },
      transitionOut: { type: "fade", duration: 0.5 } }, {}));
  ok(vOk3.ok, `control pass: ramp+motion (targetFps vắng) + transition`);
  // E4: render.js E2E với cặp xấu → thoát lỗi, thông báo nhắc targetFps.
  const badPath = path.join(work, "e-badpair.json");
  fs.writeFileSync(badPath, JSON.stringify(pairSpec(
    { transitionOut: { type: "fade", duration: 0.5 } },
    { motion: { interpolation: "minterpolate", targetFps: 60 } })));
  const badRun = runNoFail("node", [RENDER, "--spec", badPath,
    "--out", path.join(work, "e-badpair.mp4"), "--media-dir", mediaDir, "-y", "-q"]);
  const badOut = ((badRun.stderr || "") + (badRun.stdout || "")).toString();
  ok(badRun.status !== 0 && /targetFps/.test(badOut),
    `render.js cặp xấu thoát lỗi kèm thông báo targetFps (mã ${badRun.status})`);

  // ---------- F: hồi quy fail-fast đã có ----------
  console.log("F: hồi quy fail-fast (stabilize+ramp, targetFps+transition cùng clip)");
  const vStabRamp = validateSpec(spec1(vclip("c1", "shaky.mp4", 3,
    { speedKeyframes: rampCurve3, enhance: { stabilize: { smoothing: 30 } },
      motion: { interpolation: "minterpolate" } }), "f"));
  ok(!vStabRamp.ok && vStabRamp.errors.some((e) => /stabilize/.test(e)),
    `validator vẫn chặn stabilize + ramp + motion (errors: ${JSON.stringify(vStabRamp.errors)})`);
  const vTransSame = validateSpec(spec1(vclip("c1", "red3.mp4", 3,
    { motion: { interpolation: "minterpolate", targetFps: 60 },
      transitionOut: { type: "fade", duration: 0.5 } }), "f"));
  // Lưu ý: spec 1 clip có transitionOut nhưng không có clip kề cũng lỗi
  // (thiếu clip kề) — chỉ cần khẳng định có lỗi targetFps trong đó.
  ok(!vTransSame.ok && vTransSame.errors.some((e) => /targetFps/.test(e)),
    `validator vẫn chặn targetFps != project fps + transitionOut cùng clip`);

  console.log(`\nKết quả: ${pass} pass, ${fail} fail (thư mục tạm: ${work})`);
  if (fail > 0) process.exit(1);
}

main();
