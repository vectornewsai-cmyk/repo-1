/**
 * test_round93_u4_failfast_measure.js — Đo tiết kiệm fail-fast + thứ tự lỗi
 * + clip dài / dry-run (Phase 9 đợt 93 U4; đóng nợ LIMITS gộp đợt 92 §4 mục 4).
 * Chạy: node test_round93_u4_failfast_measure.js (từ server/render).
 * Chạy riêng 1 mảng: U4_SECTIONS=A1,A2,A3,A4,B1,B2,C1,C2 (phẩy).
 *
 *  A1 — stabilize 4s: thời gian fail TRƯỚC/SAU cổng sớm (bản cũ = bản sao
 *       tạm ~/workspace/tmp-u4-old/server/render, chỉ khác production ở 1
 *       dòng: lệnh gọi cổng sớm ở main() đã comment — cổng chỉ còn chạy
 *       trong buildFilterGraph như trước đợt 92 T4; KHÔNG revert production).
 *  A2 — stabilize 30s: như A1, clip dài hơn (vidstabdetect phân tích cả clip).
 *  A3 — stabilize 60s: như A1/A2.
 *  A4 — các cổng khác 4s (mask kf / speedKf / anim / track / transition):
 *       trước/sau — kỳ vọng tiết kiệm ~0 (vốn rẻ), chỉ khóa chung.
 *  B1 — spec xung đột kép: cổng stabilize + vidstabdetect FAIL (bước 3b,
 *       ép bằng shim ffmpeg chỉ chặn đúng lệnh chứa "vidstabdetect" —
 *       fault injection theo mẫu shim EPERM của T6; probe `-filters` đi
 *       qua bình thường). Trước T4: lỗi 3b báo trước; sau T4: cổng báo
 *       trước. Control: shim + spec hợp lệ (không dính cổng) → lỗi 3b
 *       thật, chứng minh shim kích hoạt đúng bước 3b.
 *  B2 — spec xung đột kép với lỗi Ở TRƯỚC cổng: version sai (bước 1),
 *       validateSpec (bước 2), media thiếu (bước 3) + dính cổng → cả 2
 *       bản đều báo lỗi trước-cổng trước (thứ tự không đổi).
 *  C1 — clip dài 60s, mask keyframes: trước/sau (mask anim D4 vẽ 1800
 *       frame trước khi cổng giết ở bản cũ).
 *  C2 — dry-run: stabilize 4s/60s + mask kf 4s/60s, trước/sau. Dry-run
 *       bỏ qua vidstabdetect (placeholder) nhưng VẪN chạy mask anim D4
 *       trước khi tới buildFilterGraph, nên chỉ mask kf mới tiết kiệm.
 *
 * Mọi render dùng --encoder libx264 (bỏ qua GPU probe 3c — cùng điều
 * kiện 2 bản) và --no-trf-cache khi có stabilize (ép detect thật mỗi lần,
 * khỏi cache .trf làm "trước" nhanh giả). Thời gian đo kèm loadavg lúc
 * chạy (số giây tuyệt đối nhạy tải VM vì các luồng đợt 93 chạy song
 * song; bằng chứng quyết định là vắng mặt/có mặt log pre-pass + thông
 * điệp lỗi, không phải ngưỡng giây).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const SECTIONS = new Set(
  (process.env.U4_SECTIONS || "A1,A2,A3,A4,B1,B2,C1,C2").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
const runSection = (name) => SECTIONS.has(name);

// Workdir bền vững (KHÔNG dùng /tmp — VM reboot xóa /tmp; xem LIMITS đợt 92 §4 mục 11).
const WORK = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor",
  "hidden_files", "round93-u4", "work");
const MEDIA = path.join(WORK, "media");
const OLD_RENDER = path.join(os.homedir(), "workspace", "tmp-u4-old", "server", "render", "src", "render.js");
const NEW_RENDER = path.join(__dirname, "src", "render.js");
const SHIM = path.join(WORK, "ffmpeg-vidstab-fail.sh");
const SHIM_LOG = path.join(WORK, "shim-count.log");

const RESULTS = [];
function loadavg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/).slice(0, 3).join("/"); }
  catch { return "?"; }
}
function run(cmd, args, env) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env });
}
function runRetry(cmd, args, env, attempts = 20) {
  let lastErr = null;
  for (let i = 1; i <= attempts; i++) {
    try { return run(cmd, args, env); }
    catch (e) { lastErr = e; spawnSync("sleep", [String(Math.min(2 * i, 15))], { stdio: "ignore" }); }
  }
  throw lastErr;
}

// Một lần render (production mới hoặc bản sao cũ), retry chỉ khi EPERM.
function renderOnce(renderJs, dir, mediaDir, spec, name, extraArgs = [], envExtra = {}) {
  const specPath = path.join(dir, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const out = path.join(dir, `${name}.mp4`);
  try { fs.unlinkSync(out); } catch { /* chưa có */ }
  const env = { ...process.env, ...envExtra };
  const t0 = Date.now();
  const la = loadavg();
  let r = null;
  let lastSecs = 0;
  const waits = [15, 30, 60];
  for (let attempt = 1; attempt <= 4; attempt++) {
    const tA = Date.now();
    r = spawnSync("node", [renderJs, "--spec", specPath, "--out", out, "--media-dir", mediaDir,
      "--encoder", "libx264", ...extraArgs],
      { cwd: path.dirname(renderJs), encoding: "utf8", env });
    lastSecs = (Date.now() - tA) / 1000;
    const all = (r.stdout || "") + (r.stderr || "");
    if (r.status === 0 || !/Operation not permitted/.test(all)) break;
    console.error(`  (render "${name}" fail vì EPERM, thử lại lần ${attempt}/4 sau ${waits[attempt - 1] || 60}s)`);
    spawnSync("sleep", [String(waits[attempt - 1] || 60)], { stdio: "ignore" });
  }
  const secs = (Date.now() - t0) / 1000;
  const row = {
    name, engine: renderJs === OLD_RENDER ? "OLD(pre-T4)" : "NEW(post-T4)",
    secs: +secs.toFixed(2), lastSecs: +lastSecs.toFixed(2), loadavg: la,
    status: r.status, hasMp4: fs.existsSync(out),
    gateMsg: /adjustment layer (cắt giữa clip có|giao với clip dính)/.test(r.stderr || ""),
    gateKind: (r.stderr || "").match(/adjustment layer (cắt giữa clip có [^(\n]+|giao với clip dính [^(\n]+)/)?.[1] || null,
    trfLog: /stabilize "c1"/.test(r.stdout || ""),
    trfFile: /\.trf/.test(r.stdout || ""),
    maskAnimLog: /mask anim ("|fallback)/.test((r.stdout || "") + (r.stderr || "")),
    maskMkv: /\.mkv/.test(r.stdout || ""),
    vidstabErr: /vidstabdetect cho clip/.test(r.stderr || ""),
    vidstabMissing: /thiếu filter vidstab/.test(r.stderr || ""),
    validateErr: /Spec không hợp lệ|Spec không qua kiểm tra tối thiểu|Media không hợp lệ/.test(r.stderr || ""),
    dryRunCmd: /^ffmpeg /.test((r.stdout || "").trim().split("\n")[0] || ""),
  };
  RESULTS.push(row);
  return { out, r, secs, row };
}

function countOcc(hay, re) { return (hay.match(re) || []).length; }

// Cache media dùng chung (mẫu T4): red.mp4 4s. Thêm red30/red60 sinh 1 lần.
const MEDIA_CACHE = path.join(os.homedir(), "workspace", "q4-media-cache");
function ensureMedia() {
  fs.mkdirSync(MEDIA, { recursive: true });
  const need = [
    { file: "red.mp4", dur: 4 },
    { file: "red30.mp4", dur: 30 },
    { file: "red60.mp4", dur: 60 },
  ];
  for (const { file, dur } of need) {
    const dest = path.join(MEDIA, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) continue;
    const cacheFile = path.join(MEDIA_CACHE, file);
    if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 0) {
      fs.copyFileSync(cacheFile, dest);
      continue;
    }
    const tmp = path.join(MEDIA_CACHE, `gen-${dur}.${process.pid}.mp4`);
    runRetry("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
      `color=c=0xff0000:s=1280x720:d=${dur}:r=30`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", tmp]);
    fs.renameSync(tmp, cacheFile);
    fs.copyFileSync(cacheFile, dest);
    console.log(`  (sinh media ${file} ${dur}s: ${(fs.statSync(dest).size / 1024).toFixed(0)} KiB)`);
  }
  const png = path.join(MEDIA, "red.png");
  if (!fs.existsSync(png) || fs.statSync(png).size === 0)
    fs.copyFileSync(path.join(MEDIA_CACHE, "red.png"), png);
}

// Shim ffmpeg: chỉ chặn lệnh chứa "vidstabdetect" (detect thật), còn lại
// pass-through ffmpeg thật. Ghi 1 dòng vào SHIM_LOG mỗi lần chặn để đếm
// số lần bước 3b bị kích hoạt (bằng chứng shim có/không chạy).
function writeShim() {
  const sh = `#!/bin/bash
# U4 fault-injection: vidstabdetect fail (bước 3b) — các lệnh khác pass-through.
for a in "$@"; do
  case "$a" in
    *vidstabdetect*) echo "$(date -u +%FT%TZ) BLOCK vidstabdetect: $*" >> ${JSON.stringify(SHIM_LOG)}; echo "shim: vidstabdetect forced failure (U4)" >&2; exit 1;;
  esac
done
exec /usr/bin/ffmpeg "$@"
`;
  writeFileEpermRetry(SHIM, sh);
  fs.chmodSync(SHIM, 0o755);
  writeFileEpermRetry(SHIM_LOG, "");
}
function shimCount() {
  try { return fs.readFileSync(SHIM_LOG, "utf8").trim().split("\n").filter(Boolean).length; }
  catch { return -1; }
}
function shimReset() { writeFileEpermRetry(SHIM_LOG, ""); }

const W = 1280, H = 720;
const maskKf = (dur) => ({
  shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.5, feather: 0,
  keyframes: [
    { t: 0, x: 0.3, y: 0.5, w: 0.3, h: 0.5 },
    { t: dur, x: 0.7, y: 0.5, w: 0.3, h: 0.5 },
  ],
});
const track = (dur) => ({ points: [{ t: 0, x: 0.35, y: 0.5 }, { t: dur, x: 0.65, y: 0.5 }] });
const vclip = (dur, src, extra = {}) => ({
  kind: "video", id: "c1", src, start: 0, duration: dur, in: 0, out: dur, speed: 1, ...extra,
});
const spec = (name, dur, src, clipsExtra, layerStart, layerDur) => ({
  version: "0.2.0",
  meta: { name, width: W, height: H, fps: 30, duration: dur },
  tracks: [{ id: "v1", kind: "video", clips: [vclip(dur, src, clipsExtra)] }],
  adjustmentLayers: [{ id: "adj", start: layerStart, duration: layerDur, filters: [{ color: { brightness: 20 } }] }],
});
const GATE_MSGS = {
  stab: /adjustment layer cắt giữa clip có enhance\.stabilize/,
  maskKf: /adjustment layer cắt giữa clip có mask keyframes/,
  speedKf: /adjustment layer cắt giữa clip có speedKeyframes/,
  anim: /adjustment layer cắt giữa clip có animations keyframes/,
  track: /adjustment layer cắt giữa clip có motion track/,
  trans: /adjustment layer giao với clip dính transition/,
};

async function main() {
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(MEDIA, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };
  const dump = (r) => { console.error((r.stdout || "").slice(-600)); console.error((r.stderr || "").slice(-600)); };

  ensureMedia();
  writeShim();
  if (!fs.existsSync(OLD_RENDER)) throw new Error(`thiếu bản sao cũ: ${OLD_RENDER}`);

  // ================= A1: stabilize 4s — trước/sau =================
  if (runSection("A1")) {
    console.log("== U4-A1: stabilize 4s — fail trước/sau cổng sớm (2 lần mỗi bản) ==");
    const s = spec("u4-stab4", 4, "red.mp4", { enhance: { stabilize: {} } }, 1, 2);
    const runs = [];
    for (let i = 1; i <= 2; i++) runs.push(renderOnce(OLD_RENDER, WORK, MEDIA, s, `u4-stab4-old${i}`, ["--no-trf-cache"]));
    for (let i = 1; i <= 2; i++) runs.push(renderOnce(NEW_RENDER, WORK, MEDIA, s, `u4-stab4-new${i}`, ["--no-trf-cache"]));
    for (const { r, row } of runs) {
      ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s, load ${row.loadavg}]`);
      ok(GATE_MSGS.stab.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng stabilize`);
      ok(!row.hasMp4, `${row.name}: không ra MP4`);
    }
    const olds = runs.slice(0, 2), news = runs.slice(2);
    ok(olds.every(({ row }) => row.trfLog || row.trfFile),
      `A1-OLD: vidstabdetect ĐÃ chạy (log .trf có mặt) — baseline "trước" thật`);
    ok(news.every(({ row }) => !row.trfLog && !row.trfFile),
      `A1-NEW: vidstabdetect KHÔNG chạy (không log .trf) — cổng sớm chặn trước 3b`);
    const oMed = olds.map(({ row }) => row.secs).sort((a, b) => a - b)[0];
    const nMed = news.map(({ row }) => row.secs).sort((a, b) => a - b)[0];
    console.log(`  A1: OLD ${olds.map(({ row }) => row.secs).join("/")}s → NEW ${news.map(({ row }) => row.secs).join("/")}s (tiết kiệm ~${(oMed - nMed).toFixed(1)}s)`);
  }

  // ================= A2: stabilize 30s =================
  if (runSection("A2")) {
    console.log("== U4-A2: stabilize 30s — fail trước/sau ==");
    const s = spec("u4-stab30", 30, "red30.mp4", { enhance: { stabilize: {} } }, 5, 10);
    const o = renderOnce(OLD_RENDER, WORK, MEDIA, s, "u4-stab30-old", ["--no-trf-cache"]);
    const n = renderOnce(NEW_RENDER, WORK, MEDIA, s, "u4-stab30-new", ["--no-trf-cache"]);
    for (const { r, row } of [o, n]) {
      ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s, load ${row.loadavg}]`);
      ok(GATE_MSGS.stab.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng stabilize`);
      ok(!row.hasMp4, `${row.name}: không ra MP4`);
    }
    ok(o.row.trfLog || o.row.trfFile, "A2-OLD: vidstabdetect ĐÃ chạy (30s)");
    ok(!n.row.trfLog && !n.row.trfFile, "A2-NEW: vidstabdetect KHÔNG chạy (30s)");
    console.log(`  A2: OLD ${o.secs}s → NEW ${n.secs}s (tiết kiệm ~${(o.secs - n.secs).toFixed(1)}s)`);
  }

  // ================= A3: stabilize 60s =================
  if (runSection("A3")) {
    console.log("== U4-A3: stabilize 60s — fail trước/sau ==");
    const s = spec("u4-stab60", 60, "red60.mp4", { enhance: { stabilize: {} } }, 10, 20);
    const o = renderOnce(OLD_RENDER, WORK, MEDIA, s, "u4-stab60-old", ["--no-trf-cache"]);
    const n = renderOnce(NEW_RENDER, WORK, MEDIA, s, "u4-stab60-new", ["--no-trf-cache"]);
    for (const { r, row } of [o, n]) {
      ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s, load ${row.loadavg}]`);
      ok(GATE_MSGS.stab.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng stabilize`);
      ok(!row.hasMp4, `${row.name}: không ra MP4`);
    }
    ok(o.row.trfLog || o.row.trfFile, "A3-OLD: vidstabdetect ĐÃ chạy (60s)");
    ok(!n.row.trfLog && !n.row.trfFile, "A3-NEW: vidstabdetect KHÔNG chạy (60s)");
    console.log(`  A3: OLD ${o.secs}s → NEW ${n.secs}s (tiết kiệm ~${(o.secs - n.secs).toFixed(1)}s)`);
  }

  // ================= A4: các cổng khác 4s — trước/sau =================
  if (runSection("A4")) {
    console.log("== U4-A4: các cổng khác 4s — fail trước/sau (kỳ vọng tiết kiệm ~0) ==");
    const kf = { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] };
    const anim = { opacity: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] } };
    const cases = [
      ["maskKf", spec("u4-mkf4", 4, "red.mp4", { mask: maskKf(4) }, 1, 2), GATE_MSGS.maskKf, "mask keyframes"],
      ["speedKf", spec("u4-spd4", 4, "red.mp4", { speedKeyframes: kf }, 1, 2), GATE_MSGS.speedKf, "speedKeyframes"],
      ["anim", spec("u4-anim4", 4, "red.mp4", { animations: anim }, 1, 2), GATE_MSGS.anim, "animations"],
      ["track", spec("u4-trk4", 4, "red.mp4", { track: track(4) }, 1, 2), GATE_MSGS.track, "motion track"],
    ];
    for (const [tag, s, re, label] of cases) {
      const o = renderOnce(OLD_RENDER, WORK, MEDIA, s, `u4-${tag}-old`, []);
      const n = renderOnce(NEW_RENDER, WORK, MEDIA, s, `u4-${tag}-new`, []);
      for (const { r, row } of [o, n]) {
        ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s]`);
        ok(re.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng ${label}`);
        ok(!row.hasMp4, `${row.name}: không ra MP4`);
      }
      console.log(`  A4-${tag}: OLD ${o.secs}s → NEW ${n.secs}s (Δ ${(o.secs - n.secs).toFixed(1)}s)`);
    }
    // F6 transition: 2 clip + transitionIn, layer giao.
    const c1 = { kind: "video", id: "c1", src: "red.mp4", start: 0, duration: 2, in: 0, out: 2, speed: 1 };
    const c2 = { kind: "video", id: "c2", src: "red.mp4", start: 2, duration: 2, in: 0, out: 2, speed: 1, transitionIn: { type: "fade", duration: 0.5 } };
    const s6 = { version: "0.2.0", meta: { name: "u4-trans4", width: W, height: H, fps: 30, duration: 4 },
      tracks: [{ id: "v1", kind: "video", clips: [c1, c2] }],
      adjustmentLayers: [{ id: "adj", start: 1, duration: 2, filters: [{ color: { brightness: 20 } }] }] };
    const o6 = renderOnce(OLD_RENDER, WORK, MEDIA, s6, "u4-trans-old", []);
    const n6 = renderOnce(NEW_RENDER, WORK, MEDIA, s6, "u4-trans-new", []);
    for (const { r, row } of [o6, n6]) {
      ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s]`);
      ok(GATE_MSGS.trans.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng transition`);
      ok(!row.hasMp4, `${row.name}: không ra MP4`);
    }
    console.log(`  A4-trans: OLD ${o6.secs}s → NEW ${n6.secs}s (Δ ${(o6.secs - n6.secs).toFixed(1)}s)`);
    // Khóa riêng F1-maskKf: bản cũ PHẢI vẽ mask anim (log có mặt), bản mới KHÔNG.
    const oMkf = RESULTS.find((r) => r.name === "u4-maskKf-old");
    const nMkf = RESULTS.find((r) => r.name === "u4-maskKf-new");
    ok(oMkf && oMkf.maskAnimLog, "A4-maskKf-OLD: mask anim D4 ĐÃ chạy (log 'mask anim' có mặt)");
    ok(nMkf && !nMkf.maskAnimLog, "A4-maskKf-NEW: mask anim D4 KHÔNG chạy");
  }

  // ================= B1: xung đột kép — cổng + vidstabdetect fail (3b) =================
  if (runSection("B1")) {
    console.log("== U4-B1: xung đột kép — cổng stabilize + vidstabdetect FAIL (shim, bước 3b) ==");
    const s = spec("u4-dual-stab", 4, "red.mp4", { enhance: { stabilize: {} } }, 1, 2);
    // Control: shim + spec HỢP LỆ (không dính cổng) trên production → phải
    // chết ở 3b với đúng lỗi vidstabdetect (chứng minh shim kích hoạt bước 3b).
    const validStab = { version: "0.2.0", meta: { name: "u4-stab-valid", width: W, height: H, fps: 30, duration: 4 },
      tracks: [{ id: "v1", kind: "video", clips: [vclip(4, "red.mp4", { enhance: { stabilize: {} } })] }] };
    shimReset();
    const ctrl = renderOnce(NEW_RENDER, WORK, MEDIA, validStab, "u4-shim-control",
      ["--no-trf-cache", "--ffmpeg", SHIM]);
    if (ctrl.r.status === 0) dump(ctrl.r);
    ok(ctrl.r.status === 1, `B1-control: shim + spec hợp lệ → exit 1 [${ctrl.secs}s]`);
    ok(ctrl.row.vidstabErr, "B1-control: stderr đúng lỗi bước 3b 'vidstabdetect cho clip \"c1\" thất bại'");
    ok(!ctrl.row.gateMsg, "B1-control: KHÔNG có thông điệp cổng (spec không dính cổng)");
    ok(shimCount() >= 1, `B1-control: shim đã chặn vidstabdetect ${shimCount()} lần (bước 3b chạy thật)`);
    ok(!ctrl.row.hasMp4, "B1-control: không ra MP4");
    // Trước T4 (bản cũ): 3b chạy trước cổng trong buildFilterGraph → lỗi 3b báo trước.
    shimReset();
    const o = renderOnce(OLD_RENDER, WORK, MEDIA, s, "u4-dual-old",
      ["--no-trf-cache", "--ffmpeg", SHIM]);
    ok(o.r.status === 1, `B1-OLD: exit 1 [${o.secs}s]`);
    ok(o.row.vidstabErr, "B1-OLD: lỗi vidstabdetect (3b) báo TRƯỚC — shim chặn detect trước khi tới cổng");
    ok(!o.row.gateMsg, "B1-OLD: KHÔNG có thông điệp cổng (chết ở 3b trước khi tới bước 6)");
    ok(shimCount() >= 1, `B1-OLD: shim đã chặn vidstabdetect ${shimCount()} lần`);
    ok(!o.row.hasMp4, "B1-OLD: không ra MP4");
    // Sau T4 (production): cổng chạy ngay sau validate → cổng báo trước, shim không chạy.
    shimReset();
    const n = renderOnce(NEW_RENDER, WORK, MEDIA, s, "u4-dual-new",
      ["--no-trf-cache", "--ffmpeg", SHIM]);
    ok(n.r.status === 1, `B1-NEW: exit 1 [${n.secs}s]`);
    ok(GATE_MSGS.stab.test(n.r.stderr || ""), "B1-NEW: thông điệp cổng stabilize báo TRƯỚC");
    ok(!n.row.vidstabErr, "B1-NEW: KHÔNG có lỗi vidstabdetect (cổng chặn trước 3b)");
    ok(shimCount() === 0, `B1-NEW: shim KHÔNG bị gọi lần nào (đếm=${shimCount()}) — detect chưa từng chạy`);
    ok(!n.row.hasMp4, "B1-NEW: không ra MP4");
    console.log(`  B1: OLD báo lỗi 3b trước; NEW báo lỗi cổng trước — thứ tự ĐỔI, có chủ ý (fail fast cấu trúc trước, T4 §4 mục 3).`);
  }

  // ================= B2: xung đột kép — lỗi Ở TRƯỚC cổng =================
  if (runSection("B2")) {
    console.log("== U4-B2: xung đột kép — lỗi ở bước TRƯỚC cổng + dính cổng (thứ tự không đổi) ==");
    const gateSpec = () => spec("u4-dual-pre", 4, "red.mp4", { enhance: { stabilize: {} } }, 1, 2);
    // B2a: version sai (bước 1, isVideoSpec) + dính cổng. "0.1.0" vẫn nằm
    // trong SUPPORTED_VERSIONS ("0.1.0"/"0.2.0") nên phải dùng "9.9.9".
    const sA = gateSpec(); sA.version = "9.9.9";
    for (const [tag, js] of [["OLD", OLD_RENDER], ["NEW", NEW_RENDER]]) {
      const { r, row } = renderOnce(js, WORK, MEDIA, sA, `u4-pre-ver-${tag.toLowerCase()}`, ["--no-trf-cache"]);
      ok(r.status === 1, `B2a-${tag}: exit 1 [${row.secs}s]`);
      ok(/Spec không qua kiểm tra tối thiểu/.test(r.stderr || ""), `B2a-${tag}: lỗi bước 1 (version) báo trước`);
      ok(!row.gateMsg, `B2a-${tag}: KHÔNG có thông điệp cổng`);
    }
    // B2b: validateSpec lỗi (bước 2: speedKeyframes v=99 ngoài khoảng) +
    // dính cổng stabilize. Lưu ý: mảng keyframes RỖNG bị sanitize xóa
    // trước validate nên KHÔNG dùng được làm lỗi bước 2 (đã thử, gate vẫn
    // chạy); v ngoài khoảng thì sanitize KHÔNG che (xem render.js, đợt 50).
    const sB = spec("u4-dual-val", 4, "red.mp4",
      { enhance: { stabilize: {} },
        speedKeyframes: { keyframes: [{ t: 0, v: 99, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] } }, 1, 2);
    for (const [tag, js] of [["OLD", OLD_RENDER], ["NEW", NEW_RENDER]]) {
      const { r, row } = renderOnce(js, WORK, MEDIA, sB, `u4-pre-val-${tag.toLowerCase()}`, ["--no-trf-cache"]);
      ok(r.status === 1, `B2b-${tag}: exit 1 [${row.secs}s]`);
      ok(/Spec không hợp lệ/.test(r.stderr || "") && /\.v phải trong/.test(r.stderr || ""),
        `B2b-${tag}: lỗi bước 2 (validateSpec: speedKeyframes v=99) báo trước`);
      ok(!row.gateMsg, `B2b-${tag}: KHÔNG có thông điệp cổng`);
    }
    // B2c: media thiếu (bước 3, validateMedia) + dính cổng stabilize.
    const sC = spec("u4-dual-media", 4, "missing.mp4", { enhance: { stabilize: {} } }, 1, 2);
    for (const [tag, js] of [["OLD", OLD_RENDER], ["NEW", NEW_RENDER]]) {
      const { r, row } = renderOnce(js, WORK, MEDIA, sC, `u4-pre-media-${tag.toLowerCase()}`, ["--no-trf-cache"]);
      ok(r.status === 1, `B2c-${tag}: exit 1 [${row.secs}s]`);
      ok(/Media không hợp lệ/.test(r.stderr || ""), `B2c-${tag}: lỗi bước 3 (validateMedia) báo trước`);
      ok(!row.gateMsg, `B2c-${tag}: KHÔNG có thông điệp cổng`);
    }
    console.log("  B2: cả 3 lỗi trước-cổng giữ nguyên thứ tự ở cả 2 bản — T4 chỉ đổi thứ tự với lỗi SAU cổng (B1).");
  }

  // ================= C1: clip dài 60s, mask keyframes =================
  if (runSection("C1")) {
    console.log("== U4-C1: clip dài 60s, mask keyframes — fail trước/sau (mask anim D4 vẽ 1800 frame) ==");
    const s = spec("u4-mkf60", 60, "red60.mp4", { mask: maskKf(60) }, 10, 20);
    const o = renderOnce(OLD_RENDER, WORK, MEDIA, s, "u4-mkf60-old", []);
    const n = renderOnce(NEW_RENDER, WORK, MEDIA, s, "u4-mkf60-new", []);
    for (const { r, row } of [o, n]) {
      ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s, load ${row.loadavg}]`);
      ok(GATE_MSGS.maskKf.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng mask keyframes`);
      ok(!row.hasMp4, `${row.name}: không ra MP4`);
    }
    ok(o.row.maskAnimLog, "C1-OLD: mask anim D4 ĐÃ chạy (60s, log 'mask anim' có mặt)");
    ok(!n.row.maskAnimLog, "C1-NEW: mask anim D4 KHÔNG chạy (60s)");
    console.log(`  C1: OLD ${o.secs}s → NEW ${n.secs}s (tiết kiệm ~${(o.secs - n.secs).toFixed(1)}s)`);
  }

  // ================= C2: dry-run =================
  if (runSection("C2")) {
    console.log("== U4-C2: dry-run — cổng + pre-pass (stabilize 4s/60s, mask kf 4s/60s) ==");
    const dry = ["--dry-run"];
    // C2a: stabilize 4s dry-run — detect bị bỏ qua cả 2 bản (placeholder),
    // nên tiết kiệm kỳ vọng ~0; cổng vẫn chặn trước khi in câu lệnh.
    const sS4 = spec("u4-dry-stab4", 4, "red.mp4", { enhance: { stabilize: {} } }, 1, 2);
    const oS4 = renderOnce(OLD_RENDER, WORK, MEDIA, sS4, "u4-dry-stab4-old", ["--no-trf-cache", ...dry]);
    const nS4 = renderOnce(NEW_RENDER, WORK, MEDIA, sS4, "u4-dry-stab4-new", ["--no-trf-cache", ...dry]);
    for (const { r, row } of [oS4, nS4]) {
      ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s]`);
      ok(GATE_MSGS.stab.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng stabilize (dry-run)`);
      ok(!row.dryRunCmd, `${row.name}: KHÔNG in câu lệnh ffmpeg (chết trước khi tới bước in)`);
      ok(!row.hasMp4, `${row.name}: không ra MP4`);
      ok(!row.trfLog && !row.trfFile, `${row.name}: vidstabdetect KHÔNG chạy (dry-run bỏ qua detect)`);
    }
    console.log(`  C2a-stab4-dry: OLD ${oS4.secs}s → NEW ${nS4.secs}s (Δ ${(oS4.secs - nS4.secs).toFixed(1)}s — kỳ vọng ~0)`);
    // C2b: stabilize 60s dry-run — như trên, detect vẫn bị bỏ qua.
    const sS60 = spec("u4-dry-stab60", 60, "red60.mp4", { enhance: { stabilize: {} } }, 10, 20);
    const oS60 = renderOnce(OLD_RENDER, WORK, MEDIA, sS60, "u4-dry-stab60-old", ["--no-trf-cache", ...dry]);
    const nS60 = renderOnce(NEW_RENDER, WORK, MEDIA, sS60, "u4-dry-stab60-new", ["--no-trf-cache", ...dry]);
    for (const { r, row } of [oS60, nS60]) {
      ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s]`);
      ok(GATE_MSGS.stab.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng stabilize (dry-run 60s)`);
      ok(!row.dryRunCmd, `${row.name}: KHÔNG in câu lệnh ffmpeg`);
      ok(!row.trfLog && !row.trfFile, `${row.name}: vidstabdetect KHÔNG chạy (dry-run 60s)`);
    }
    console.log(`  C2b-stab60-dry: OLD ${oS60.secs}s → NEW ${nS60.secs}s (Δ ${(oS60.secs - nS60.secs).toFixed(1)}s — kỳ vọng ~0)`);
    // C2c: mask kf 4s dry-run — D4 VẪN chạy ở bản cũ (trước khi tới cổng ở
    // bước 6), bản mới chặn trước.
    const sM4 = spec("u4-dry-mkf4", 4, "red.mp4", { mask: maskKf(4) }, 1, 2);
    const oM4 = renderOnce(OLD_RENDER, WORK, MEDIA, sM4, "u4-dry-mkf4-old", dry);
    const nM4 = renderOnce(NEW_RENDER, WORK, MEDIA, sM4, "u4-dry-mkf4-new", dry);
    for (const { r, row } of [oM4, nM4]) {
      ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s]`);
      ok(GATE_MSGS.maskKf.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng mask keyframes (dry-run)`);
      ok(!row.dryRunCmd, `${row.name}: KHÔNG in câu lệnh ffmpeg`);
      ok(!row.hasMp4, `${row.name}: không ra MP4`);
    }
    ok(oM4.row.maskAnimLog, "C2c-OLD: mask anim D4 ĐÃ chạy trong dry-run 4s");
    ok(!nM4.row.maskAnimLog, "C2c-NEW: mask anim D4 KHÔNG chạy trong dry-run 4s");
    console.log(`  C2c-mkf4-dry: OLD ${oM4.secs}s → NEW ${nM4.secs}s (tiết kiệm ~${(oM4.secs - nM4.secs).toFixed(1)}s)`);
    // C2d: mask kf 60s dry-run — tiết kiệm lớn nhất ở chế độ dry-run.
    const sM60 = spec("u4-dry-mkf60", 60, "red60.mp4", { mask: maskKf(60) }, 10, 20);
    const oM60 = renderOnce(OLD_RENDER, WORK, MEDIA, sM60, "u4-dry-mkf60-old", dry);
    const nM60 = renderOnce(NEW_RENDER, WORK, MEDIA, sM60, "u4-dry-mkf60-new", dry);
    for (const { r, row } of [oM60, nM60]) {
      ok(r.status === 1, `${row.name}: exit 1 [${row.secs}s, load ${row.loadavg}]`);
      ok(GATE_MSGS.maskKf.test(r.stderr || ""), `${row.name}: đúng thông điệp cổng mask keyframes (dry-run 60s)`);
      ok(!row.dryRunCmd, `${row.name}: KHÔNG in câu lệnh ffmpeg`);
      ok(!row.hasMp4, `${row.name}: không ra MP4`);
    }
    ok(oM60.row.maskAnimLog, "C2d-OLD: mask anim D4 ĐÃ chạy trong dry-run 60s");
    ok(!nM60.row.maskAnimLog, "C2d-NEW: mask anim D4 KHÔNG chạy trong dry-run 60s");
    console.log(`  C2d-mkf60-dry: OLD ${oM60.secs}s → NEW ${nM60.secs}s (tiết kiệm ~${(oM60.secs - nM60.secs).toFixed(1)}s)`);
  }

  // Gộp dồn: giữ lại các đo lần chạy trước (ghi đè theo tên đo nếu chạy lại).
  const resultsPath = path.join(WORK, "measurements.json");
  let merged = {};
  try {
    const prev = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    for (const r of prev.results || []) merged[r.name] = r;
  } catch { /* lần chạy đầu */ }
  for (const r of RESULTS) merged[r.name] = r;
  const allRows = Object.values(merged).sort((a, b) => a.name.localeCompare(b.name));
  writeFileEpermRetry(resultsPath, JSON.stringify({ at: new Date().toISOString(), results: allRows }, null, 2));
  console.log(`\ntest_round93_u4_failfast_measure [${[...SECTIONS].join(",")}]: ${pass} pass, ${fail} fail (WORK=${WORK})`);
  console.log(`Bảng đo chi tiết: ${resultsPath}`);
  process.exit(fail ? 1 : 0);
}

main();
