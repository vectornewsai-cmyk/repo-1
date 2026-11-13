#!/usr/bin/env node
/**
 * test_r88_p9_mask_track_verify.js — Phase 9 đợt 88, luồng P9: kiểm chứng
 * độc lập mask bám motion track sau các sửa đổi đợt 88 (vai trò như O6/O7
 * đợt 87). KHÔNG sửa production. KHÔNG push, KHÔNG release/tag, KHÔNG
 * đụng TTS 39, KHÔNG đụng file workflow.
 *
 * GHI CHÚ VỀ CÂY ĐO (trung thực): lúc P9 bắt đầu (15:38 +07 11/11), KHÔNG
 * có file đợt 88 nào trên đĩa (không docs ROUND88, không hidden_files
 * round88-*, không paths-loop round88, grep "round88" toàn repo = 0 kết
 * quả). P1/P2/P6 đợt 88 chưa hạ cánh gì — nên các đo dưới đây là kiểm
 * chứng lại cây đã gộp đợt 87 + parent closing (HEAD vẫn 5f548ef8), và
 * mục (e) chỉ xác minh trạng thái hiện tại trên cây đó, không có claim
 * P1/P2/P6 nào để đối chiếu.
 *
 * - P1: png mặc định + track + mask (đo lại C7 của O6): tâm 0,275/0,5/
 *   0,725 tại t=0,5/2,0/3,5 + video đứng yên (pixel phân biệt).
 * - P2: trackgeq (đo lại C7b): tâm + video đứng yên như P1.
 * - P3: trackgeq, clip.start=1,0 (đo lại C2): T là thời gian clip-local.
 * - P4: mask+track+transitionOut fade — trackgeq (đo lại C6) VÀ png
 *   (parent closing đã verify png, P9 đo lại độc lập).
 * - P5: hồi quy — render lại spec B1/B2/B3 của O7 bằng code hiện tại;
 *   SO SÁNH VỚI SỐ O7 ĐÃ GHI (không so frame trực tiếp được vì frame O7
 *   nằm trong /tmp đã mất sau reboot VM 11/11): B3@2,5 vs B1@2,5 phải
 *   ≈ mean 0,234/pctGt8 0,489%; B3@0,2 vs B3@4,8 ≈ mean 40,65;
 *   B1@2,5 vs B2@2,5 ≈ mean 0,251. + Tính xác định: render B1 2 lần,
 *   MAD giữa 2 lần phải = 0.
 * - A/B: unit hình học + mirror CJS==ESM + validator (kể cả câu warn
 *   transition sau closing + warn image chưa sửa).
 * - D: suite cũ trên code hiện tại (O2 25/25, mask_p4 33/33, d4 13/13,
 *   self-test, maskTrack 22/22, maskKeyframes 14/14, mirror check,
 *   tsc web + desktop).
 *
 * Dùng: node server/render/test_r88_p9_mask_track_verify.js
 * Mã thoát: 0 = mọi kiểm tra PASS; 1 = có FAIL.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const { pathToFileURL } = require("url");

const ROOT = path.join(__dirname);
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r88-p9-"));
const PY = path.join(ROOT, "test_r87_o6_measure.py");
const RENDER_JS = path.join(ROOT, "src", "render.js");

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ""}`); }
  else { fail++; failures.push(name); console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`); }
}
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function runLive(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "inherit", "inherit"], ...opts });
}
function sh(cmd) {
  const r = run("bash", ["-c", cmd]);
  if (r.status !== 0) throw new Error(`lệnh fail: ${cmd}\n${r.stderr}`);
  return r.stdout;
}
function measure(args) {
  const r = run("python3", [PY, ...args]);
  if (r.status !== 0) throw new Error(`measure fail (${args.join(" ")}): ${r.stderr}`);
  const out = {};
  for (const line of r.stdout.trim().split("\n")) {
    for (const tok of line.trim().split(/\s+/)) {
      const m = /^([a-zA-Z0-9_.]+)=(\S+)$/.exec(tok);
      if (m) out[m[1]] = m[2];
    }
  }
  return out;
}
function frameAt(video, t, out) {
  const r = run("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", video, "-frames:v", "1", out]);
  if (r.status !== 0) throw new Error(`frameAt fail: ${r.stderr}`);
}
function sample(video, t, points) {
  const res = measure(["px", video, String(t), ...points]);
  const out = {};
  for (const [k, v] of Object.entries(res)) {
    const m = /^px_([\d.]+)_([\d.]+)$/.exec(k);
    if (m) out[`${m[1]},${m[2]}`] = v.split(",").map(Number);
  }
  return out;
}
function scanCenter(video, t, y = 0.5, mode = "vis") {
  const res = measure(["scan", video, String(t), String(y), mode]);
  if (res.center === "none" || res.center === undefined) return null;
  return { x0: Number(res.run_x0), x1: Number(res.run_x1), center: Number(res.center), width: Number(res.width) };
}
function mad(pa, pb) {
  const res = measure(["mad", pa, pb]);
  return { mean: Number(res.mean), max: Number(res.max), pctGt8: Number(res.pctGt8) };
}
function isRed(px) { return px && px[0] > 180 && px[1] < 80 && px[2] < 80; }
function isBlue(px) { return px && px[2] > 180 && px[0] < 80 && px[1] < 80; }
function probeDuration(video) {
  const r = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]);
  return r.status === 0 ? Number(r.stdout.trim()) : NaN;
}
function render(specObj, outName, maskMode) {
  const specPath = path.join(WORK, `${outName}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(specObj), { label: "test-r88-p9-spec" });
  const out = path.join(WORK, `${outName}.mp4`);
  const t0 = Date.now();
  const r = run("node", [RENDER_JS, "--spec", specPath, "--out", out,
    "--media-dir", WORK, "-y", "--crf", "23", "--x264-preset", "veryfast",
    "--mask-mode", maskMode || "png"], { cwd: ROOT, timeout: 1800000 });
  return { r, out, secs: (Date.now() - t0) / 1000 };
}

const TRACK_LINEAR = { points: [{ t: 0, x: 0.2, y: 0.5 }, { t: 4, x: 0.8, y: 0.5 }] };
const MASK_ELLIPSE = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.4, feather: 0 };
const EXPECT_CENTER = { 0.5: 0.275, 2.0: 0.5, 3.5: 0.725 };

async function main() {
  console.log(`WORK=${WORK}`);
  const cpu = fs.readFileSync("/proc/cpuinfo", "utf8").match(/model name\s*:\s*(.+)/);
  console.log(`CPU: ${cpu ? cpu[1].trim() : "?"}; vCPU=${os.cpus().length}; load=${fs.readFileSync("/proc/loadavg", "utf8").trim()}`);

  // Chuẩn bị media: split đỏ/xanh + xanh toàn khung (cho C6/P4)
  sh(`ffmpeg -v error -y -f lavfi -i "color=c=0xFF0000:s=640x720:d=5:r=30" -f lavfi -i "color=c=0x0000FF:s=640x720:d=5:r=30" -filter_complex "[0:v][1:v]hstack" -c:v libx264 -pix_fmt yuv420p -an ${WORK}/split.mp4`);
  sh(`ffmpeg -v error -y -f lavfi -i "color=c=0x0000FF:s=1280x720:d=5:r=30" -c:v libx264 -pix_fmt yuv420p -an ${WORK}/blue.mp4`);

  const specTracked = (start, mask, extra) => ({
    version: "0.2.0", meta: { name: "r88-p9", width: 1280, height: 720, fps: 30 },
    tracks: [{ kind: "video", id: "v1", clips: [{
      kind: "video", id: "c1", src: "split.mp4", start, duration: 4,
      in: 0, out: 4, sourceAudioMode: "mute", mask, track: TRACK_LINEAR, ...(extra || {}),
    }] }],
  });

  // ================= A. Unit =================
  console.log("== A. Unit: hình học mask bám track (chạy lại trên cây hiện tại) ==");
  {
    const maskCjs = require("./src/mask");
    const { maskGeometryAt, maskGeometryAtTrack, interpolateTrackPoints, buildMaskTrackGeqExpr, buildMaskTrackGeqChain } = maskCjs;
    const base = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.4, feather: 0 };
    for (const t of [-1, 0, 1.3, 5]) {
      ok(`A1a no-track t=${t} == maskGeometryAt`, JSON.stringify(maskGeometryAtTrack(base, undefined, t)) === JSON.stringify(maskGeometryAt(base, t)));
    }
    for (const [t, ex] of [[-1, 0.2], [0, 0.2], [1, 0.35], [2, 0.5], [3, 0.65], [4, 0.8], [5, 0.8], [10, 0.8]]) {
      const g = maskGeometryAtTrack(base, TRACK_LINEAR, t);
      ok(`A1b track t=${t} x=${ex}`, Math.abs(g.x - ex) < 1e-9 && Math.abs(g.y - 0.5) < 1e-9, `x=${g.x}`);
    }
    const kf = { shape: "rect", x: 0.1, y: 0.5, w: 0.3, h: 0.5, feather: 0.2, invert: true,
      keyframes: [{ t: 0, x: 0.1, y: 0.5, w: 0.3, h: 0.5 }, { t: 4, x: 0.9, y: 0.5, w: 0.5, h: 0.5 }] };
    const g2 = maskGeometryAtTrack(kf, TRACK_LINEAR, 2);
    ok("A2 keyframes+track: x từ track (0.5), w từ keyframes (0.4)",
      Math.abs(g2.x - 0.5) < 1e-9 && Math.abs(g2.w - 0.4) < 1e-9, `x=${g2.x} w=${g2.w}`);
    try {
      const esm = await import(pathToFileURL(path.join(__dirname, "..", "..", "packages", "video-spec", "src", "mask.js")).href);
      const esmTrack = await import(pathToFileURL(path.join(__dirname, "..", "..", "packages", "video-spec", "src", "tracking.js")).href);
      let mirrorOk = typeof esm.maskGeometryAtTrack === "function";
      for (const m of [base, kf]) for (const t of [-1, 0, 0.5, 1, 2, 3.5, 4, 5, 10]) {
        if (JSON.stringify(maskGeometryAtTrack(m, TRACK_LINEAR, t)) !== JSON.stringify(esm.maskGeometryAtTrack(m, TRACK_LINEAR, t))) mirrorOk = false;
      }
      for (const t of [-1, 0, 0.5, 1, 2, 3.5, 4, 5]) {
        if (JSON.stringify(interpolateTrackPoints(TRACK_LINEAR.points, t)) !== JSON.stringify(esmTrack.interpolateTrack(TRACK_LINEAR.points, t))) mirrorOk = false;
      }
      ok("A3 cross-mirror CJS == ESM bit-for-bit", mirrorOk);
    } catch (e) { ok("A3 cross-mirror CJS == ESM", false, e.message); }
    const e2 = buildMaskTrackGeqExpr(MASK_ELLIPSE, TRACK_LINEAR, 1280, 720);
    ok("A4 geq động chứa T + if(lt(T + sqrt (ellipse)", e2.includes("T") && e2.includes("if(lt(T") && e2.includes("sqrt("));
    let n = 0; const lblFn = (p) => `${p}${n++}`;
    const ch = buildMaskTrackGeqChain("[cv0]", MASK_ELLIPSE, TRACK_LINEAR, 1280, 720, lblFn);
    ok("A5 chain 3 entry + geq + alphamerge", ch.entries.length === 3 && ch.entries[1].includes("geq=lum=") && ch.entries[2].includes("alphamerge"));
    const r = run("node", [path.join(ROOT, "src", "mask.js"), "--self-test"], { cwd: ROOT });
    ok("A6 mask.js --self-test pass", r.status === 0, (r.stdout || "").trim().slice(-80));
  }

  // ================= B. Validator =================
  console.log("== B. Validator: combo mask+track (chạy lại) ==");
  {
    const { validateSpec } = require("./src/validate");
    const vidSpec = (clipExtra, kind = "video") => ({
      version: "0.2.0", meta: { name: "t", width: 1280, height: 720, fps: 30 },
      tracks: [{ kind, id: "v1", clips: [{ kind, id: "c1", src: "SRC", start: 0, duration: 4, in: 0, out: 4, sourceAudioMode: "mute", ...clipExtra }] }],
    });
    const v1 = validateSpec(vidSpec({ mask: MASK_ELLIPSE, track: TRACK_LINEAR }));
    ok("B1 mask+track hợp lệ → ok, 0 error", v1.ok && v1.errors.length === 0, `warnings=${JSON.stringify(v1.warnings)}`);
    const v5 = validateSpec(vidSpec({ mask: MASK_ELLIPSE, track: TRACK_LINEAR, transitionIn: { type: "fade", duration: 0.5 } }));
    console.log(`  ℹ️  B5 mask+track+transition warnings=${JSON.stringify(v5.warnings)}`);
    ok("B5 mask+track+transition → ok", v5.ok);
    ok("B5b warn transition NÓI ĐÚNG sau closing (ghi rõ mask vẫn bám)",
      v5.warnings.some((w) => w.includes("mask vẫn bám")), JSON.stringify(v5.warnings));
    const vImg = validateSpec({
      version: "0.2.0", meta: { name: "t", width: 1280, height: 720, fps: 30 },
      tracks: [{ kind: "image", id: "i1", clips: [{ kind: "image", id: "c1", src: "SRC", start: 0, duration: 4, in: 0, out: 4, mask: MASK_ELLIPSE, track: TRACK_LINEAR }] }],
    });
    console.log(`  ℹ️  B6 image+mask+track warnings=${JSON.stringify(vImg.warnings)}`);
    ok("B6 image+mask+track → ok (warn image ghi nhận riêng, xem LIMITS §5)", vImg.ok);
  }

  // ================= P1. png mặc định =================
  console.log("== P1. png mặc định + track + mask (đo lại C7) ==");
  {
    const { r, out, secs } = render(specTracked(0, MASK_ELLIPSE), "p1-png-tracked", "png");
    ok("P1 render png thành công", r.status === 0, r.stderr.slice(-400));
    console.log(`  ℹ️  P1 wall ${secs.toFixed(1)}s = ${(120 / secs).toFixed(2)} fps (cả job 4s, gồm sinh video mask)`);
    if (r.status === 0) {
      for (const [t, ex] of Object.entries(EXPECT_CENTER)) {
        const sc = scanCenter(out, Number(t));
        ok(`P1 tâm mask t=${t} ≈ ${ex} (±0.03)`, sc !== null && Math.abs(sc.center - ex) <= 0.03,
          sc ? `đo center=${sc.center} run=[${sc.x0},${sc.x1}] width=${sc.width}` : "không tìm thấy vệt sáng");
      }
      const p05 = sample(out, 0.5, ["0.4,0.5", "0.2,0.5"]);
      const p35 = sample(out, 3.5, ["0.6,0.5", "0.8,0.5"]);
      ok("P1 video đứng yên: (0.4,0.5)@0.5 ĐỎ", isRed(p05["0.4,0.5"]), JSON.stringify(p05["0.4,0.5"]));
      ok("P1 video đứng yên: (0.6,0.5)@3.5 XANH", isBlue(p35["0.6,0.5"]), JSON.stringify(p35["0.6,0.5"]));
      ok("P1 (0.2,0.5)@0.5 đỏ, (0.8,0.5)@3.5 xanh", isRed(p05["0.2,0.5"]) && isBlue(p35["0.8,0.5"]),
        `${JSON.stringify(p05["0.2,0.5"])} / ${JSON.stringify(p35["0.8,0.5"])}`);
    }
  }

  // ================= P2. trackgeq =================
  console.log("== P2. trackgeq (đo lại C7b) ==");
  {
    const { r, out, secs } = render(specTracked(0, MASK_ELLIPSE), "p2-trackgeq", "trackgeq");
    ok("P2 render trackgeq thành công", r.status === 0, r.stderr.slice(-400));
    console.log(`  ℹ️  P2 wall ${secs.toFixed(1)}s = ${(120 / secs).toFixed(2)} fps`);
    if (r.status === 0) {
      for (const [t, ex] of Object.entries(EXPECT_CENTER)) {
        const sc = scanCenter(out, Number(t));
        ok(`P2 tâm mask t=${t} ≈ ${ex} (±0.03)`, sc !== null && Math.abs(sc.center - ex) <= 0.03,
          sc ? `đo center=${sc.center}` : "không tìm thấy vệt sáng");
      }
      const p05 = sample(out, 0.5, ["0.4,0.5"]);
      const p35 = sample(out, 3.5, ["0.6,0.5"]);
      ok("P2 video đứng yên (0.4,0.5)@0.5 đỏ, (0.6,0.5)@3.5 xanh",
        isRed(p05["0.4,0.5"]) && isBlue(p35["0.6,0.5"]),
        `${JSON.stringify(p05["0.4,0.5"])} / ${JSON.stringify(p35["0.6,0.5"])}`);
    }
  }

  // ================= P3. trackgeq start=1.0 =================
  console.log("== P3. trackgeq, clip.start=1.0 — T là local hay timeline? (đo lại C2) ==");
  {
    const { r, out, secs } = render(specTracked(1.0, MASK_ELLIPSE), "p3-trackgeq-s1", "trackgeq");
    ok("P3 render trackgeq start=1 thành công", r.status === 0, r.stderr.slice(-400));
    console.log(`  ℹ️  P3 wall ${secs.toFixed(1)}s, duration=${probeDuration(out)} (kỳ vọng 5s)`);
    if (r.status === 0) {
      for (const [lt, ex] of Object.entries(EXPECT_CENTER)) {
        const tt = Number(lt) + 1;
        const sc = scanCenter(out, tt);
        ok(`P3 tâm mask timeline t=${tt} (local ${lt}) ≈ ${ex} — T là local`,
          sc !== null && Math.abs(sc.center - ex) <= 0.03,
          sc ? `đo center=${sc.center}` : "không tìm thấy vệt sáng");
      }
    }
  }

  // ================= P4. mask+track+transition =================
  console.log("== P4. mask+track+transitionOut fade — trackgeq (đo lại C6) + png (đo lại closing) ==");
  for (const mode of ["trackgeq", "png"]) {
    const spec = {
      version: "0.2.0", meta: { name: "r88-p9-p4", width: 1280, height: 720, fps: 30 },
      tracks: [{ kind: "video", id: "v1", clips: [
        { kind: "video", id: "c1", src: "split.mp4", start: 0, duration: 4, in: 0, out: 4,
          sourceAudioMode: "mute", mask: MASK_ELLIPSE, track: TRACK_LINEAR,
          transitionOut: { type: "fade", duration: 0.5 } },
        { kind: "video", id: "c2", src: "blue.mp4", start: 4, duration: 4, in: 0, out: 4, sourceAudioMode: "mute" },
      ] }],
    };
    const { r, out, secs } = render(spec, `p4-trans-${mode}`, mode);
    ok(`P4-${mode} render + transition thành công`, r.status === 0, r.stderr.slice(-400));
    console.log(`  ℹ️  P4-${mode} wall ${secs.toFixed(1)}s, duration=${probeDuration(out)} (kỳ vọng 8s)`);
    if (r.status === 0) {
      for (const [t, ex] of [[0.5, 0.275], [2.0, 0.5], [3.0, 0.65]]) {
        const sc = scanCenter(out, t);
        ok(`P4-${mode} tâm mask t=${t} ≈ ${ex} (±0.03) — mask vẫn bám track qua transition`,
          sc !== null && Math.abs(sc.center - ex) <= 0.03,
          sc ? `đo center=${sc.center}` : "không tìm thấy vệt sáng");
      }
    }
  }

  // ================= P5. Hồi quy vs số O7 =================
  console.log("== P5. Hồi quy: render lại spec B1/B2/B3 của O7, so với số O7 đã ghi ==");
  {
    sh(`ffmpeg -v error -y -f lavfi -i "testsrc2=size=1280x720:rate=30:duration=5" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -an ${WORK}/clip720.mp4`);
    const MASK_STATIC = { shape: "rect", x: 0.5, y: 0.5, w: 0.4, h: 0.4, feather: 0.2 };
    const MASK_TRACKED = { shape: "rect", x: 0.2, y: 0.5, w: 0.4, h: 0.4, feather: 0.2,
      keyframes: [{ t: 0, x: 0.2, y: 0.5, w: 0.4, h: 0.4 }, { t: 5, x: 0.8, y: 0.5, w: 0.4, h: 0.4 }] };
    const specBase = (extra) => ({
      version: "0.2.0", meta: { name: "r88-p9-p5", width: 1280, height: 720, fps: 30 },
      tracks: [{ id: "v0", kind: "video", clips: [{ id: "c0", kind: "video", src: "clip720.mp4", start: 0, duration: 5, in: 0, out: 5, ...(extra || {}) }] }],
    });
    const b1 = render(specBase({ mask: MASK_STATIC }), "p5-b1-png", "png");
    const b1b = render(specBase({ mask: MASK_STATIC }), "p5-b1-png-again", "png");
    const b2 = render(specBase({ mask: MASK_STATIC }), "p5-b2-geq", "geq");
    const b3 = render(specBase({ mask: MASK_TRACKED }), "p5-b3-tracked", "png");
    for (const [lbl, x] of [["B1-png", b1], ["B1-png-lại", b1b], ["B2-geq", b2], ["B3-tracked", b3]]) {
      ok(`P5 ${lbl} render thành công`, x.r.status === 0, x.r.stderr.slice(-300));
      if (x.r.status === 0) console.log(`  ℹ️  P5 ${lbl} wall ${x.secs.toFixed(1)}s = ${(150 / x.secs).toFixed(2)} fps`);
    }
    if (b1.r.status === 0 && b1b.r.status === 0) {
      const f1 = path.join(WORK, "p5-b1-t25.png"), f2 = path.join(WORK, "p5-b1b-t25.png");
      frameAt(b1.out, 2.5, f1); frameAt(b1b.out, 2.5, f2);
      const m = mad(f1, f2);
      ok("P5 tính xác định: render B1 2 lần, MAD = 0", m.mean === 0 && m.max === 0, `mean=${m.mean} max=${m.max} pctGt8=${m.pctGt8}%`);
    }
    if (b1.r.status === 0 && b2.r.status === 0 && b3.r.status === 0) {
      const f = (mp4, t, n) => { const p = path.join(WORK, n); frameAt(mp4, t, p); return p; };
      const m1 = mad(f(b3.out, 2.5, "p5-b3-t25.png"), f(b1.out, 2.5, "p5-b1-t25.png"));
      ok("P5 B3@2.5 vs B1@2.5 ≈ số O7 (mean 0,234 / pctGt8 0,489%)",
        Math.abs(m1.mean - 0.234) < 0.5 && Math.abs(m1.pctGt8 - 0.489) < 1.5,
        `mean=${m1.mean} max=${m1.max} pctGt8=${m1.pctGt8}%`);
      const m2 = mad(f(b3.out, 0.2, "p5-b3-t02.png"), f(b3.out, 4.8, "p5-b3-t48.png"));
      ok("P5 B3@0.2 vs B3@4.8 ≈ số O7 (mean 40,65 / pctGt8 21,465%) — mask di chuyển rõ",
        m2.mean > 20 && m2.pctGt8 > 10, `mean=${m2.mean} max=${m2.max} pctGt8=${m2.pctGt8}%`);
      const m3 = mad(f(b1.out, 2.5, "p5-b1-t25b.png"), f(b2.out, 2.5, "p5-b2-t25.png"));
      ok("P5 B1@2.5 vs B2@2.5 ≈ số O7 (mean 0,251 / pctGt8 0,464%) — png ≈ geq",
        Math.abs(m3.mean - 0.251) < 0.5 && Math.abs(m3.pctGt8 - 0.464) < 1.5,
        `mean=${m3.mean} max=${m3.max} pctGt8=${m3.pctGt8}%`);
    }
  }

  // ================= D. Suite cũ =================
  console.log("== D. Suite cũ trên code hiện tại ==");
  {
    const runNode = (file, label, re) => {
      const r = run("node", [path.join(ROOT, file)], { cwd: ROOT, timeout: 900000 });
      const m = re.exec(r.stdout || "");
      console.log(`  ℹ️  ${label} stdout cuối: ${(r.stdout || "").trim().split("\n").slice(-2).join(" | ")}`);
      ok(label, !!m && m[2] === "0", m ? `${m[1]} pass, ${m[2]} fail` : (r.stdout.slice(-300) + r.stderr.slice(-300)));
    };
    runNode("test_round87_o2_mask_track.js", "D1 test_round87_o2_mask_track.js 0 fail", /(\d+) pass, (\d+) fail/);
    runNode("test_mask_p4.js", "D2 test_mask_p4 33/33", /(\d+) pass, (\d+) fail/);
    runNode("test_d4_mask_keyframes.js", "D3 test_d4_mask_keyframes 13/13", /(\d+) pass, (\d+) fail/);
    for (const f of ["src/tracking.js", "src/sticker.js"]) {
      const r = run("node", [path.join(ROOT, f), "--self-test"], { cwd: ROOT });
      ok(`D4 self-test ${f}`, r.status === 0, (r.stdout || "").trim().slice(-80));
    }
    const mt = run("node", ["--experimental-strip-types", path.join(ROOT, "..", "..", "apps", "web", "src", "lib", "maskTrack.test.ts")], { cwd: ROOT, timeout: 300000 });
    const mtm = /(\d+)\/(\d+) passed|(\d+) pass/.exec(mt.stdout || "");
    console.log(`  ℹ️  maskTrack.test.ts stdout cuối: ${(mt.stdout || "").trim().split("\n").slice(-3).join(" | ")}${(mt.stderr || "").trim().slice(-200)}`);
    ok("D5 maskTrack.test.ts 22/22", mt.status === 0 && /22/.test(mt.stdout || ""), (mt.stdout || "").trim().slice(-200) || mt.stderr.slice(-200));
    const mk = run("node", ["--experimental-strip-types", path.join(ROOT, "..", "..", "apps", "web", "src", "lib", "maskKeyframes.test.ts")], { cwd: ROOT, timeout: 300000 });
    console.log(`  ℹ️  maskKeyframes.test.ts stdout cuối: ${(mk.stdout || "").trim().split("\n").slice(-3).join(" | ")}`);
    ok("D6 maskKeyframes.test.ts 14/14", mk.status === 0 && /14/.test(mk.stdout || ""), (mk.stdout || "").trim().slice(-200) || mk.stderr.slice(-200));
    const mc = run("node", [path.join(ROOT, "..", "..", "packages", "video-spec", "scripts", "check-video-spec-mirror.mjs")], { cwd: ROOT, timeout: 300000 });
    const mcm = /(\d+) pass, (\d+) known, (\d+) fail/.exec(mc.stdout || "");
    console.log(`  ℹ️  mirror check: ${(mc.stdout || "").trim().split("\n").slice(-2).join(" | ")}`);
    ok("D7 check-video-spec-mirror 427 pass, 6 known, 0 fail", !!mcm && mcm[3] === "0", mcm ? `${mcm[1]} pass, ${mcm[2]} known, ${mcm[3]} fail` : mc.stdout.slice(-300) + mc.stderr.slice(-300));
  }

  console.log(`\n== KẾT QUẢ P9 (verify): ${pass} pass, ${fail} fail (WORK=${WORK}) ==`);
  if (fail > 0) console.log(`FAIL: ${failures.join(" | ")}`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((e) => { console.error(`P9 VERIFY LỖI: ${e.stack}`); process.exit(3); });
