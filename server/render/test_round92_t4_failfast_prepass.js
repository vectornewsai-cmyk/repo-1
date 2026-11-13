/**
 * test_round92_t4_failfast_prepass.js — Dời cổng fail fast lên trước pre-pass
 * (Phase 9 đợt 92 T4; đóng nợ S4 §3 mục 3 / LIMITS gộp đợt 91 §4 mục 4).
 * Chạy: node test_round92_t4_failfast_prepass.js (từ server/render).
 * Chạy riêng 1 mảng: T4_SECTIONS=F1|F2|F3|F4|F5|F6|R1 (phẩy, vd "F1,R1").
 *
 * Trước đợt này (S4): cổng fail fast adjustment-layer tách clip nằm trong
 * buildFilterGraph (bước 6, render.js ~664 cũ) — SAU mọi pre-pass. Job
 * S4-F (layer cắt clip có mask keyframes) vẽ video mask ~5–10s rồi mới
 * chết: exit 1 đúng, 0 warn, không MP4, nhưng lãng phí thời gian pre-pass.
 * Đợt này: cổng tách ra checkAdjLayerSplitConflicts(spec, transitions) và
 * main() gọi SỚM, ngay sau validateSpec + validateMedia (trước vidstab
 * detect 3b, GPU probe 3c, font 4, text SR PNG, mask PNG R2, mask anim
 * D4); buildFilterGraph vẫn gọi lại ở đầu để giữ phòng thủ.
 *
 *  F1 — mask keyframes bị cắt (replay S4-F + khóa mới): exit 1, đúng thông
 *       điệp cổng, 0 warn site "mask keyframes:", không MP4, NHANH
 *       (secs < 5; trước: 5,1–10,7s), và KHÔNG có log pre-pass D4 nào
 *       (`mask anim "…" →` / `mask anim "…": không vẽ được` /
 *       `mask anim fallback PNG t=0`) — chứng minh pre-pass không chạy
 *       (assert quyết định, không phụ thuộc tải VM như ngưỡng giây).
 *       Lưu ý: thông điệp cổng tự nó chứa "mask animation" nên assert
 *       phải khớp đúng dạng log pre-pass, không khớp chuỗi "mask anim"
 *       trần.
 *  F2 — speedKeyframes bị cắt: thông điệp cổng speedKeyframes, exit 1,
 *       không MP4, nhanh. (Case này trước đây vốn rẻ — không mask anim,
 *       không vidstab — nên tiết kiệm ~0s; cổng dời chỉ khóa chung để
 *       pre-pass tương lai không tái gây lãng phí.)
 *  F3 — animations keyframes bị cắt: thông điệp cổng animations, như F2.
 *  F4 — motion track bị cắt: thông điệp cổng motion track, như F2.
 *  F5 — enhance.stabilize bị cắt: thông điệp cổng stabilize, exit 1,
 *       không MP4, nhanh, và KHÔNG có log vidstabdetect (".trf" /
 *       'stabilize "c1"') — trước đây bước 3b chạy detect rồi mới chết.
 *  F6 — clip dính transition (xfade) giao layer: thông điệp cổng
 *       transition, exit 1, không MP4, nhanh.
 *  R1 — đối chứng dương: cùng clip mask keyframes + layer BAO TRỌN
 *       (parts == 1, không tách) → render OK ra MP4, pre-pass VẪN chạy
 *       (log "mask anim" + ".mkv" có mặt), keyframes chạy thật
 *       (tâm mask t=2 ≈ 0,5/0,5).
 *
 * Các case bao trọn / mask tĩnh bị cắt / hồi quy không shim đã khóa ở
 * S4-G/H/C (test_round91_s4_fallback_warn_ext.js 60/60) — chạy lại
 * nguyên suite đó để hồi quy, không lặp lại render đắt ở đây.
 *
 * Chống sóng EPERM (mẫu Q4/R4/S4): retry RỘNG mọi thao tác ghi file phụ,
 * render chỉ retry khi fail đúng vì EPERM (tối đa 4 lần); backoff bằng
 * spawnSync("sleep") vì Atomics.wait trả ngay 0ms trên VM này.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const SECTIONS = new Set(
  (process.env.T4_SECTIONS || "F1,F2,F3,F4,F5,F6,R1").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
const runSection = (name) => SECTIONS.has(name);

function run(cmd, args, env) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env });
}

function runRetry(cmd, args, env, attempts = 20) {
  let lastErr = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      return run(cmd, args, env);
    } catch (e) {
      lastErr = e;
      spawnSync("sleep", [String(Math.min(2 * i, 15))], { stdio: "ignore" });
    }
  }
  throw lastErr;
}

function renderSpec(dir, mediaDir, spec, name, extraArgs = [], shimDir = null) {
  const specPath = path.join(dir, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const out = path.join(dir, `${name}.mp4`);
  const env = shimDir ? { ...process.env, PATH: `${shimDir}:${process.env.PATH}` } : process.env;
  const t0 = Date.now();
  let r = null;
  let lastSecs = 0;
  const waits = [15, 30, 60];
  for (let attempt = 1; attempt <= 4; attempt++) {
    const tA = Date.now();
    r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", out, "--media-dir", mediaDir, ...extraArgs],
      { cwd: __dirname, encoding: "utf8", env });
    lastSecs = (Date.now() - tA) / 1000;
    const all = (r.stdout || "") + (r.stderr || "");
    if (r.status === 0 || !/Operation not permitted/.test(all)) break;
    console.error(`  (render "${name}" fail vì EPERM, thử lại lần ${attempt}/4 sau ${waits[attempt - 1] || 60}s)`);
    spawnSync("sleep", [String(waits[attempt - 1] || 60)], { stdio: "ignore" });
  }
  return { out, r, specPath, secs: (Date.now() - t0) / 1000, lastSecs };
}

function framePng(out, t, dir, tag) {
  const png = path.join(dir, `${tag}.png`);
  let lastErr = null;
  for (let attempt = 1; attempt <= 25; attempt++) {
    try {
      run("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", out, "-frames:v", "1", png]);
      if (fs.existsSync(png) && fs.statSync(png).size > 0) return png;
      lastErr = new Error(`ffmpeg exit 0 nhưng ${png} rỗng/thiếu (attempt ${attempt})`);
    } catch (e) {
      lastErr = e;
    }
    spawnSync("sleep", [String(Math.min(0.5 * attempt, 12))], { stdio: "ignore" });
  }
  throw lastErr;
}

function centroid(png, chan) {
  const py = `import numpy as np
from PIL import Image
im = np.asarray(Image.open(${JSON.stringify(png)}).convert("RGB")).astype(float)
m = im[:, :, ${chan}] > 100
m &= (im[:, :, ( ${chan} + 1) % 3] < 100) & (im[:, :, (${chan} + 2) % 3] < 100)
ys, xs = np.nonzero(m)
H, W = m.shape
print(f"{xs.mean()/W:.4f} {ys.mean()/H:.4f} {len(xs)}")`;
  const s = run("python3", ["-c", py]).trim().split(/\s+/).map(Number);
  return { x: s[0], y: s[1], n: s[2] };
}

function countOcc(hay, re) {
  return (hay.match(re) || []).length;
}

// Cache media dùng chung ngoài repo (mẫu Q4/R4/S4, không stage): sinh 1 lần
// bằng ffmpeg, các lượt sau copy bằng node fs. Cache hợp lệ = file > 0 byte.
const MEDIA_CACHE = path.join(os.homedir(), "workspace", "q4-media-cache");
function copyCached(mediaDir) {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      fs.mkdirSync(MEDIA_CACHE, { recursive: true });
      const mp4 = path.join(MEDIA_CACHE, "red.mp4");
      const png = path.join(MEDIA_CACHE, "red.png");
      if (!fs.existsSync(mp4) || fs.statSync(mp4).size === 0 ||
          !fs.existsSync(png) || fs.statSync(png).size === 0) return false;
      fs.copyFileSync(mp4, path.join(mediaDir, "red.mp4"));
      fs.copyFileSync(png, path.join(mediaDir, "red.png"));
      if (fs.statSync(path.join(mediaDir, "red.mp4")).size > 0 &&
          fs.statSync(path.join(mediaDir, "red.png")).size > 0) return true;
    } catch (e) { /* thử lại */ }
    spawnSync("sleep", ["5"], { stdio: "ignore" });
  }
  return false;
}
function ensureMedia(mediaDir) {
  if (copyCached(mediaDir)) return;
  fs.mkdirSync(MEDIA_CACHE, { recursive: true });
  const tmpMp4 = path.join(MEDIA_CACHE, `red.${process.pid}.mp4`);
  const tmpPng = path.join(MEDIA_CACHE, `red.${process.pid}.png`);
  runRetry("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xff0000:s=1280x720:d=4:r=30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", tmpMp4]);
  runRetry("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xff0000:s=1280x720:d=1:r=1",
    "-frames:v", "1", tmpPng]);
  if (fs.statSync(tmpMp4).size > 0) fs.renameSync(tmpMp4, path.join(MEDIA_CACHE, "red.mp4"));
  if (fs.statSync(tmpPng).size > 0) fs.renameSync(tmpPng, path.join(MEDIA_CACHE, "red.png"));
  if (!copyCached(mediaDir)) throw new Error("ensureMedia: không copy được media từ cache sau khi sinh");
}

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-t4-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };
  const dump = (r) => { console.error((r.stdout || "").slice(-800)); console.error((r.stderr || "").slice(-800)); };

  ensureMedia(mediaDir);

  const W = 1280, H = 720;
  const meta = { width: W, height: H, fps: 30, duration: 4 };
  const mask = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.5, feather: 0 };
  // Keyframes x 0.3 → 0.7 (t=0: 0.3; t=2.0: 0.5; t=4: 0.7) — như R4/S4.
  const maskKf = {
    ...mask,
    keyframes: [
      { t: 0, x: 0.3, y: 0.5, w: 0.3, h: 0.5 },
      { t: 4, x: 0.7, y: 0.5, w: 0.3, h: 0.5 },
    ],
  };
  const track = { points: [{ t: 0, x: 0.35, y: 0.5 }, { t: 4, x: 0.65, y: 0.5 }] };
  const vclip = (extra = {}) => ({
    kind: "video", id: "c1", src: "red.mp4", start: 0, duration: 4, in: 0, out: 4, speed: 1, ...extra,
  });
  const vclip2 = (id, start, duration, extra = {}) => ({
    kind: "video", id, src: "red.mp4", start, duration, in: 0, out: duration, speed: 1, ...extra,
  });
  const spec = (name, tracks, adjustmentLayers) => {
    const s = { version: "0.2.0", meta: { name, ...meta }, tracks };
    if (adjustmentLayers) s.adjustmentLayers = adjustmentLayers;
    return s;
  };
  const vtrack = (clips) => [{ id: "v1", kind: "video", clips }];
  const cutLayer = [{ id: "adj", start: 1, duration: 2, filters: [{ color: { brightness: 20 } }] }];
  const fullLayer = [{ id: "adj", start: 0, duration: 4, filters: [{ color: { brightness: 20 } }] }];

  // Assert chung cho 1 case cổng fail fast: chết đúng thông điệp, không MP4,
  // nhanh (ngưỡng giây) — cộng thêm assert "không chạy pre-pass" riêng
  // từng case ở dưới (log đặc trưng của pre-pass đó phải vắng mặt).
  const gateCase = (tag, r, out, secs, msgRe, msgLabel) => {
    ok(r.status !== 0, `${tag}: job FAIL (exit ${r.status}) [${secs.toFixed(1)}s]`);
    ok(msgRe.test(r.stderr || ""), `${tag}: stderr chứa đúng thông điệp cổng '${msgLabel}'`);
    ok(!fs.existsSync(out), `${tag}: KHÔNG ra file MP4 (job chết trước khi encode)`);
    ok(secs < 5, `${tag}: chết nhanh ${secs.toFixed(1)}s < 5s (cổng chạy trước pre-pass)`);
  };

  // ================= F1: mask keyframes bị cắt (replay S4-F + khóa pre-pass) =================
  if (runSection("F1")) {
    console.log("== T4-F1: layer cắt clip có mask keyframes — chết nhanh, không vẽ mask ==");
    const cutSpec = spec("t4-kf-cut", vtrack([vclip({ mask: maskKf })]), cutLayer);
    const { out, r, secs } = renderSpec(dir, mediaDir, cutSpec, "t4-kf-cut");
    if (r.status === 0) dump(r);
    gateCase("T4-F1", r, out, secs,
      /adjustment layer cắt giữa clip có mask keyframes/, "adjustment layer cắt giữa clip có mask keyframes");
    ok(countOcc(r.stderr || "", /mask keyframes:/g) === 0,
      "T4-F1: KHÔNG có warn site 'mask keyframes:' nào — job chết trước khi dựng graph");
    const all = (r.stdout || "") + (r.stderr || "");
    // Lưu ý: thông điệp cổng tự nó chứa "mask animation" (không có dấu ")
    // nên assert phải khớp đúng dạng log pre-pass D4: `mask anim "c1" →`
    // (vẽ xong), `mask anim "c1": không vẽ được…` (warn fail), hoặc
    // `mask anim fallback PNG t=0` — cả 3 đều vắng mặt mới chứng minh
    // pre-pass không chạy.
    ok(!/mask anim ("|fallback)/.test(all),
      "T4-F1: KHÔNG có log/warn pre-pass 'mask anim \"…\"' / 'mask anim fallback' — pre-pass D4 không chạy (assert quyết định)");
    ok(!/\.mkv/.test(r.stdout || ""),
      "T4-F1: KHÔNG có video mask .mkv nào được vẽ/log");
  }

  // ================= F2: speedKeyframes bị cắt =================
  if (runSection("F2")) {
    console.log("== T4-F2: layer cắt clip có speedKeyframes ==");
    const kf = { keyframes: [
      { t: 0, v: 1, easing: "linear" }, { t: 4, v: 1, easing: "linear" },
    ] };
    const cutSpec = spec("t4-spd-cut", vtrack([vclip({ speedKeyframes: kf })]), cutLayer);
    const { out, r, secs } = renderSpec(dir, mediaDir, cutSpec, "t4-spd-cut");
    gateCase("T4-F2", r, out, secs,
      /adjustment layer cắt giữa clip có speedKeyframes/, "adjustment layer cắt giữa clip có speedKeyframes");
  }

  // ================= F3: animations keyframes bị cắt =================
  if (runSection("F3")) {
    console.log("== T4-F3: layer cắt clip có animations keyframes ==");
    const anim = { opacity: { keyframes: [
      { t: 0, v: 1, easing: "linear" }, { t: 4, v: 1, easing: "linear" },
    ] } };
    const cutSpec = spec("t4-anim-cut", vtrack([vclip({ animations: anim })]), cutLayer);
    const { out, r, secs } = renderSpec(dir, mediaDir, cutSpec, "t4-anim-cut");
    gateCase("T4-F3", r, out, secs,
      /adjustment layer cắt giữa clip có animations keyframes/, "adjustment layer cắt giữa clip có animations keyframes");
  }

  // ================= F4: motion track bị cắt =================
  if (runSection("F4")) {
    console.log("== T4-F4: layer cắt clip có motion track ==");
    const cutSpec = spec("t4-track-cut", vtrack([vclip({ track })]), cutLayer);
    const { out, r, secs } = renderSpec(dir, mediaDir, cutSpec, "t4-track-cut");
    gateCase("T4-F4", r, out, secs,
      /adjustment layer cắt giữa clip có motion track/, "adjustment layer cắt giữa clip có motion track");
  }

  // ================= F5: enhance.stabilize bị cắt =================
  if (runSection("F5")) {
    console.log("== T4-F5: layer cắt clip có enhance.stabilize — chết trước vidstabdetect ==");
    const cutSpec = spec("t4-stab-cut", vtrack([vclip({ enhance: { stabilize: {} } })]), cutLayer);
    const { out, r, secs } = renderSpec(dir, mediaDir, cutSpec, "t4-stab-cut");
    gateCase("T4-F5", r, out, secs,
      /adjustment layer cắt giữa clip có enhance\.stabilize/, "adjustment layer cắt giữa clip có enhance.stabilize");
    ok(!/stabilize "c1"/.test(r.stdout || ""),
      "T4-F5: KHÔNG có log vidstabdetect 'stabilize \"c1\" → ...trf' — bước 3b không chạy");
    ok(!/\.trf/.test(r.stdout || ""),
      "T4-F5: KHÔNG có file .trf nào được detect/log");
  }

  // ================= F6: clip dính transition giao layer =================
  if (runSection("F6")) {
    console.log("== T4-F6: layer giao clip dính transition (xfade) ==");
    const c1 = vclip2("c1", 0, 2);
    const c2 = vclip2("c2", 2, 2, { transitionIn: { type: "fade", duration: 0.5 } });
    const cutSpec = spec("t4-trans-cut", vtrack([c1, c2]), cutLayer);
    const { out, r, secs } = renderSpec(dir, mediaDir, cutSpec, "t4-trans-cut");
    gateCase("T4-F6", r, out, secs,
      /adjustment layer giao với clip dính transition/, "adjustment layer giao với clip dính transition");
  }

  // ================= R1: đối chứng dương — layer bao trọn, pre-pass vẫn chạy =================
  if (runSection("R1")) {
    console.log("== T4-R1: layer bao trọn clip có mask keyframes — render OK, pre-pass vẫn chạy ==");
    const fullSpec = spec("t4-kf-full", vtrack([vclip({ mask: maskKf })]), fullLayer);
    const { out, r, secs } = renderSpec(dir, mediaDir, fullSpec, "t4-kf-full");
    if (r.status !== 0) dump(r);
    ok(r.status === 0 && fs.existsSync(out), `T4-R1: render clip bao trọn layer ra MP4 [${secs.toFixed(1)}s]`);
    ok(/mask anim/.test(r.stdout || "") && /\.mkv/.test(r.stdout || ""),
      "T4-R1: log pre-pass 'mask anim' + video .mkv có mặt — cổng dời không giết pre-pass của spec hợp lệ");
    if (r.status === 0) {
      const c = centroid(framePng(out, 2.0, dir, "t4r120"), 0);
      ok(Math.abs(c.x - 0.5) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
        `T4-R1: t=2.0 tâm mask x=${c.x} y=${c.y} ≈ (0.5, 0.5) — keyframes chạy thật, không bị cổng chặn nhầm`);
    }
  }

  console.log(`\ntest_round92_t4_failfast_prepass [${[...SECTIONS].join(",")}]: ${pass} pass, ${fail} fail (WORK=${dir})`);
  process.exit(fail ? 1 : 0);
}

main();
