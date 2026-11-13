#!/usr/bin/env node
/**
 * e2e-ship-services-ramguard-q9.mjs — Phase 9 đợt 89, luồng Q9.
 *
 * Kiểm chứng end-to-end RAM guard của birefnet-general QUA BRIDGE THẬT
 * trong AppImage đã đóng gói (nợ LIMITS gộp đợt 88 §4 mục 2, phần "chưa
 * test e2e bridge thật trong AppImage" — P7 chỉ test bridge bằng stub
 * Python + chạy Python thật ngoài app).
 *
 * Tiêu chí PASS của Q9 (khác M6 — M6 đòi birefnet chạy được):
 *   - AppImage đúng sha đã verify trước khi chạy.
 *   - Bridge của chính gói đó healthy.
 *   - POST /api/bgremove session=birefnet-general khi RAM khả dụng < 6 GB:
 *     guard chặn birefnet ngay từ đầu (KHÔNG thử birefnet), bridge trả
 *     done với sessionUsed=u2net + fallbackFrom=birefnet-general +
 *     fallbackReason nhắc "RAM guard" kèm số MB khả dụng/ngưỡng.
 *   - Output MOV thật tải về được, ffprobe ok, pix_fmt có alpha,
 *     đủ frame (>= 13/15), kích thước > 1000 byte.
 *   - KHÔNG yêu cầu birefnet chạy được — trên VM ít RAM, guard chặn là
 *     hành vi ĐÚNG theo thiết kế P7. Birefnet chạy thành công lần đầu vẫn
 *     cần cửa sổ yên >= 6 GB khả dụng ~7 phút hoặc máy nhiều RAM.
 *
 * Cách chạy: node apps/desktop/scripts/e2e-ship-services-ramguard-q9.mjs
 * Env: Q9_WORK (mặc định ~/workspace/tmp-q9-round89-birefnet-e2e),
 *   Q9_APPIMAGE / Q9_EXPECTED_SHA / Q9_MODELS_DIR.
 * Exit 0 khi guard e2e PASS, 1 khi FAIL. KHÔNG sửa production, KHÔNG push.
 */
import { spawn, spawnSync, execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../web/scripts/eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const nowIso = () => new Date().toISOString();
const HOME = os.homedir();
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WORK = process.env.Q9_WORK || path.join(HOME, "workspace", "tmp-q9-round89-birefnet-e2e");
const APPIMAGE = process.env.Q9_APPIMAGE
  || path.join(HOME, "workspace", "tmp-q9-round89-ship", "ship-full", "vcut-studio-0.1.0-x86_64.AppImage");
const EXPECTED_SHA = process.env.Q9_EXPECTED_SHA || "";
const MODELS_DIR = process.env.Q9_MODELS_DIR
  || path.join(HOME, "workspace", "tmp-q9-round89-ship", "models");
const CLIP1 = path.join(ROOT, "server", "render", "examples", "media", "clip1.mp4");
const USERDATA = path.join(WORK, "userdata");
const TMP_RUN = path.join(WORK, "tmp-run");
const OUT = path.join(WORK, "outputs");
const REPORT = path.join(WORK, "e2e-report.json");
const LOGF = path.join(WORK, "e2e-run.log");
const RAM_GUARD_THRESHOLD_MB = 6144;

const logLines = [];
function log(...a) {
  const l = `[${nowIso()}] ${a.join(" ")}`;
  logLines.push(l);
  console.log(l);
}
function sha256File(p) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(p));
  return h.digest("hex");
}
function portFree(port) {
  return new Promise((res) => {
    const s = net.createServer();
    s.once("error", () => res(false));
    s.once("listening", () => s.close(() => res(true)));
    s.listen(port, "127.0.0.1");
  });
}
function pidAlive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}
function readMemAvailKb() {
  try {
    const m = fs.readFileSync("/proc/meminfo", "utf8").match(/MemAvailable:\s+(\d+)/);
    return m ? Number(m[1]) : null;
  } catch { return null; }
}
function sampleResources(tag) {
  try {
    const load = fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/).slice(0, 3).join(" ");
    const avail = readMemAvailKb();
    let rssKb = 0; let nproc = 0;
    try {
      const ps = execSync("ps -eo rss,args", { encoding: "utf8", timeout: 15000 });
      for (const line of ps.split("\n")) {
        if (/vcut|electron|bgremove\.py|rembg|onnxruntime/i.test(line) && !/ps -eo|grep|ramguard-q9/.test(line)) {
          const m = line.trim().match(/^(\d+)\s/);
          if (m) { rssKb += Number(m[1]); nproc++; }
        }
      }
    } catch {}
    const rec = { tag, at: nowIso(), loadavg: load, memAvailableKb: avail, memAvailableMb: avail ? Math.round(avail / 1024) : null, vcutRssMb: Math.round(rssKb / 1024), vcutProcs: nproc };
    log(`[res] ${tag}: loadavg=${load} memAvail=${rec.memAvailableMb}MB vcutRSS~${rec.vcutRssMb}MB (${nproc} proc)`);
    report.resources.push(rec);
    return rec;
  } catch (e) {
    log(`[res] ${tag}: sample lỗi: ${e.message}`);
    return { tag, error: e.message };
  }
}
async function httpJson(url, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const text = await res.text();
    try { return { status: res.status, json: JSON.parse(text) }; } catch { return { status: res.status, text }; }
  } finally { clearTimeout(t); }
}
async function waitBridgeHealthy(timeoutMs, port) {
  const t0 = Date.now();
  let lastErr = "?";
  while (Date.now() - t0 < timeoutMs) {
    if (app && !pidAlive(app.pid)) return { ok: false, ms: Date.now() - t0, lastErr: `app đã chết (pid ${app.pid}) trước khi bridge healthy` };
    try {
      const r = await httpJson(`http://127.0.0.1:${port}/api/health`, 5000);
      if (r.status === 200 && r.json && (r.json.ok === true || r.json.status === "ok" || r.json.healthy === true)) {
        return { ok: true, ms: Date.now() - t0, body: r.json };
      }
      lastErr = `HTTP ${r.status} ${JSON.stringify(r.json || r.text || "").slice(0, 200)}`;
    } catch (e) { lastErr = e.message; }
    await sleep(5000);
  }
  return { ok: false, ms: Date.now() - t0, lastErr };
}
async function readNdjsonStream(res, timeoutMs) {
  const t0 = Date.now();
  const events = [];
  let buf = "";
  let doneEv = null; let errEv = null;
  const dec = new TextDecoder();
  const deadline = Date.now() + timeoutMs;
  const onLine = (line) => {
    if (!line) return;
    try {
      const ev = JSON.parse(line);
      events.push(ev);
      if (ev.type === "done") doneEv = ev;
      if (ev.type === "error") errEv = ev;
    } catch { events.push({ type: "unparsable", line: line.slice(0, 200) }); }
  };
  try {
    for await (const value of res.body) {
      if (Date.now() > deadline) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        onLine(buf.slice(0, idx).trim());
        buf = buf.slice(idx + 1);
        if (doneEv || errEv) break;
      }
      if (doneEv || errEv) break;
    }
    buf += dec.decode();
    if (buf.trim()) onLine(buf.trim());
  } catch (e) {
    events.push({ type: "read-error", message: `${e.name}: ${e.message}`.slice(0, 300) });
  }
  return { events, done: doneEv, error: errEv, ms: Date.now() - t0 };
}
function ffprobeJson(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", file], { encoding: "utf8", timeout: 60000 });
  if (r.status !== 0) return { ok: false, error: (r.stderr || r.error?.message || "ffprobe fail").slice(0, 500) };
  try { return { ok: true, data: JSON.parse(r.stdout) }; } catch (e) { return { ok: false, error: `parse ffprobe: ${e.message}` }; }
}
function countFrames(file) {
  const cnt = spawnSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1", file], { encoding: "utf8", timeout: 120000 });
  return cnt.status === 0 ? Number(cnt.stdout.trim()) : null;
}
async function downloadTo(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download HTTP ${res.status} từ ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileEpermRetry(dest, buf);
  const size = fs.statSync(dest).size;
  if (size !== buf.length) throw new Error(`ghi ${dest}: size trên đĩa ${size} != buffer ${buf.length} (bẫy EPERM?)`);
  return size;
}
function analyzeAlphaPng(pngPath) {
  const py = spawnSync("python3", ["-c",
    "import sys,json\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGBA')\na=list(im.getchannel('A').getdata())\nn=len(a)\ntr=sum(1 for v in a if v==0)\nse=sum(1 for v in a if 0<v<255)\nop=sum(1 for v in a if v==255)\nprint(json.dumps({'pixels':n,'pctTransparent':round(100*tr/n,1),'pctSemi':round(100*se/n,1),'pctOpaque':round(100*op/n,1),'alphaMax':max(a),'alphaMean':round(sum(a)/n,1)}))\n",
    pngPath], { encoding: "utf8", timeout: 60000 });
  if (py.status !== 0) return { ok: false, error: (py.stderr || py.error?.message || "PIL fail").slice(0, 300) };
  try { return { ok: true, ...JSON.parse(py.stdout.trim()) }; } catch (e) { return { ok: false, error: `parse PIL: ${e.message}` }; }
}

const report = {
  tool: "e2e-ship-services-ramguard-q9.mjs (Q9, đợt 89)",
  startedAt: nowIso(),
  appimage: APPIMAGE,
  expectedSha: EXPECTED_SHA || null,
  modelsDir: MODELS_DIR,
  work: WORK,
  ramGuardThresholdMb: RAM_GUARD_THRESHOLD_MB,
  steps: {},
  resources: [],
  ramWindow: { samples: [], maxMemAvailableMb: null },
  allPass: false,
};
let xvfb = null; let app = null;
let BRIDGE_PORT = 0; let DISPLAY_NUM = 0; let CDP_PORT = 0;
let ramSampler = null;

function startRamSampler() {
  // Quan sát cửa sổ RAM trong lúc chạy job: lấy mẫu mỗi 20s, ghi max.
  ramSampler = setInterval(() => {
    const avail = readMemAvailKb();
    if (avail == null) return;
    const mb = Math.round(avail / 1024);
    report.ramWindow.samples.push({ at: nowIso(), memAvailableMb: mb });
    if (report.ramWindow.maxMemAvailableMb == null || mb > report.ramWindow.maxMemAvailableMb) {
      report.ramWindow.maxMemAvailableMb = mb;
    }
  }, 20000);
}
function stopRamSampler() {
  if (ramSampler) { clearInterval(ramSampler); ramSampler = null; }
}

async function main() {
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(TMP_RUN, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  log(`Q9 RAM guard E2E — AppImage=${APPIMAGE} WORK=${WORK}`);

  const pre = { ok: true, notes: [] };
  if (!fs.existsSync(APPIMAGE)) { pre.ok = false; pre.notes.push("AppImage không còn trên đĩa"); }
  else {
    const size = fs.statSync(APPIMAGE).size;
    const sha = sha256File(APPIMAGE);
    pre.appimageSize = size; pre.appimageSha = sha;
    log(`AppImage: ${size} byte, sha256 ${sha}`);
    if (EXPECTED_SHA && sha !== EXPECTED_SHA) { pre.ok = false; pre.notes.push("SHA KHÔNG KHỚP với Q9_EXPECTED_SHA"); }
  }
  for (const bin of ["ffmpeg", "ffprobe", "Xvfb", "python3"]) {
    if (spawnSync("which", [bin], { encoding: "utf8" }).status !== 0) { pre.ok = false; pre.notes.push(`thiếu binary ${bin}`); }
  }
  if (!fs.existsSync(CLIP1)) { pre.ok = false; pre.notes.push(`không thấy clip1 ${CLIP1}`); }
  if (!fs.existsSync(MODELS_DIR)) { pre.ok = false; pre.notes.push(`không thấy models dir ${MODELS_DIR}`); }
  report.steps.preflight = pre;
  log(`preflight: ${pre.ok ? "OK" : "FAIL"} — ${pre.notes.join("; ")}`);
  if (!pre.ok) { finish(1); return; }

  // Clip 0,5s (15 frame) — giống M6 retry (giảm thời gian giữ peak memory).
  const clip05 = path.join(WORK, "clip-0.5s.mp4");
  const mk = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", CLIP1, "-t", "0.5", "-c", "copy", clip05], { encoding: "utf8", timeout: 60000 });
  const probe05 = ffprobeJson(clip05);
  const clipOk = mk.status === 0 && probe05.ok && Number(probe05.data.format.duration) >= 0.4;
  report.steps.prepareInput = { clip05, ok: clipOk, duration: probe05.ok ? probe05.data.format.duration : null };
  log(`chuẩn bị clip 0.5s: ${clipOk ? "OK" : "FAIL"} (${report.steps.prepareInput.duration}s)`);
  if (!clipOk) { finish(1); return; }

  const pickDisplay = () => {
    for (let n = 90; n <= 99; n++) {
      if (fs.existsSync(`/tmp/.X${n}-lock`) || fs.existsSync(`/tmp/.X11-unix/X${n}`)) continue;
      return n;
    }
    return null;
  };
  DISPLAY_NUM = pickDisplay();
  for (let p = 9223; p <= 9232; p++) { if (await portFree(p)) { CDP_PORT = p; break; } }
  log(`chọn tài nguyên: DISPLAY=:${DISPLAY_NUM} cdp=${CDP_PORT}`);
  if (!DISPLAY_NUM || !CDP_PORT) { log("FAIL: không còn display/cổng CDP trống"); finish(1); return; }

  sampleResources("pre-launch");
  const xvfbLog = fs.openSync(path.join(WORK, "xvfb.log"), "w");
  xvfb = spawn("Xvfb", [`:${DISPLAY_NUM}`, "-screen", "0", "1920x1080x24"], { stdio: ["ignore", xvfbLog, xvfbLog] });
  let xvfbOk = false;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    if (pidAlive(xvfb.pid) && fs.existsSync(`/tmp/.X${DISPLAY_NUM}-lock`)) { xvfbOk = true; break; }
  }
  report.steps.xvfb = { ok: xvfbOk, pid: xvfb.pid, display: DISPLAY_NUM };
  log(`Xvfb :${DISPLAY_NUM} pid=${xvfb.pid}: ${xvfbOk ? "OK" : "FAIL"}`);
  if (!xvfbOk) { finish(1); return; }
  const appLog = fs.openSync(path.join(WORK, "app-stdout.log"), "w");
  app = spawn(APPIMAGE, [`--user-data-dir=${USERDATA}`, "--no-sandbox", `--remote-debugging-port=${CDP_PORT}`], {
    env: { ...process.env, DISPLAY: `:${DISPLAY_NUM}`, APPIMAGE_EXTRACT_AND_RUN: "1", VCUT_MODELS_DIR: MODELS_DIR, TMPDIR: TMP_RUN },
    stdio: ["ignore", appLog, appLog],
    detached: true,
  });
  log(`đã spawn AppImage pid=${app.pid}, chờ service-manager ghi cổng bridge…`);
  const mgrLog = path.join(USERDATA, "logs", "service-manager.log");
  let foundPort = 0;
  for (let i = 0; i < 300 && !foundPort; i++) {
    await sleep(1000);
    if (app && !pidAlive(app.pid)) break;
    try {
      const txt = fs.readFileSync(mgrLog, "utf8");
      const m = txt.match(/BRIDGE_PORT=(\d+)/);
      if (m) foundPort = Number(m[1]);
    } catch {}
  }
  report.steps.discoverBridgePort = { ok: foundPort > 0, port: foundPort || null };
  if (!foundPort) { log("FAIL: 300s không thấy BRIDGE_PORT trong service-manager.log"); finish(1); return; }
  BRIDGE_PORT = foundPort;
  log(`cổng bridge thật: ${BRIDGE_PORT}`);
  const healthy = await waitBridgeHealthy(600_000, BRIDGE_PORT);
  report.steps.launch = { ok: healthy.ok, msToHealthy: healthy.ms, pid: app.pid, bridgePort: BRIDGE_PORT };
  log(`bridge healthy: ${healthy.ok ? `OK sau ${(healthy.ms / 1000).toFixed(1)}s` : `FAIL — ${healthy.lastErr}`}`);
  if (!healthy.ok) { finish(1); return; }
  sampleResources("bridge-healthy");

  // --- Job bgremove qua bridge thật: session birefnet-general ---
  const bg = { ok: false, sessionRequested: "birefnet-general" };
  const memBefore = readMemAvailKb();
  bg.memAvailableMbBeforeJob = memBefore ? Math.round(memBefore / 1024) : null;
  log(`RAM khả dụng trước job: ${bg.memAvailableMbBeforeJob} MB (ngưỡng guard ${RAM_GUARD_THRESHOLD_MB} MB) — guard ${bg.memAvailableMbBeforeJob != null && bg.memAvailableMbBeforeJob < RAM_GUARD_THRESHOLD_MB ? "DỰ KIẾN CHẶN birefnet" : "DỰ KIẾN CHO QUA (thử birefnet thật)"}`);
  startRamSampler();
  try {
    const form = new FormData();
    form.append("media", new Blob([fs.readFileSync(clip05)], { type: "video/mp4" }), "clip-0.5s.mp4");
    form.append("session", "birefnet-general");
    const t0 = Date.now();
    const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/bgremove`, {
      method: "POST", body: form, signal: AbortSignal.timeout(1_800_000),
    });
    bg.httpStatus = res.status;
    if (res.status !== 200) {
      bg.error = `HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`;
    } else {
      const stream = await readNdjsonStream(res, 1_800_000);
      bg.ms = Date.now() - t0;
      bg.events = stream.events.map((e) => ({ type: e.type, phase: e.phase, done: e.done, total: e.total, message: (e.message || e.error || "").slice(0, 300) }));
      if (stream.error) bg.error = JSON.stringify(stream.error).slice(0, 500);
      else if (!stream.done) bg.error = "stream kết thúc mà không có event done";
      else if (!stream.done.downloadUrl) bg.error = "done nhưng không có downloadUrl";
      else {
        bg.sessionUsed = stream.done.sessionUsed;
        bg.fallbackFrom = stream.done.fallbackFrom || null;
        bg.fallbackReason = stream.done.fallbackReason || null;
        const reasonMentionsGuard = /ram guard/i.test(bg.fallbackReason || "");
        bg.fallbackReasonMentionsRamGuard = reasonMentionsGuard;
        if (bg.sessionUsed === "birefnet-general" && !bg.fallbackFrom) {
          // Guard cho qua (RAM >= ngưỡng) và birefnet chạy được thật —
          // đây là lần chạy thành công đầu tiên, ghi nhận riêng.
          bg.birefnetRan = true;
        } else if (bg.sessionUsed === "u2net" && bg.fallbackFrom === "birefnet-general" && reasonMentionsGuard) {
          bg.guardBlocked = true;
        } else {
          bg.error = `session dùng thật là "${bg.sessionUsed}" (fallback từ ${bg.fallbackFrom || "?"}) — lý do: ${bg.fallbackReason || "?"}`;
        }
        if (!bg.error) {
          const movPath = path.join(OUT, "clip-0.5s_no_bg.mov");
          const size = await downloadTo(`http://127.0.0.1:${BRIDGE_PORT}${stream.done.downloadUrl}`, movPath);
          const probe = ffprobeJson(movPath);
          bg.file = movPath; bg.size = size; bg.probeOk = probe.ok;
          if (probe.ok) {
            const v = probe.data.streams.find((s) => s.codec_type === "video");
            bg.duration = Number(probe.data.format.duration);
            bg.codec = v?.codec_name; bg.pixFmt = v?.pix_fmt;
            bg.width = v?.width; bg.height = v?.height;
            bg.nbFrames = v?.nb_frames ? Number(v.nb_frames) : null;
            bg.hasAlpha = /a$/.test(v?.pix_fmt || "") || (v?.pix_fmt || "").includes("yuva") || (v?.pix_fmt || "").includes("rgba") || (v?.pix_fmt || "").includes("argb");
            bg.framesRead = countFrames(movPath);
            bg.fps = bg.duration ? +(15 / (bg.ms / 1000)).toFixed(2) : null;
            const framePng = path.join(OUT, "guard-frame7.png");
            const ext = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", movPath, "-vf", "select=eq(n\\,7)", "-frames:v", "1", framePng], { encoding: "utf8", timeout: 60000 });
            if (ext.status === 0 && fs.existsSync(framePng)) bg.alphaFrame7 = analyzeAlphaPng(framePng);
            else bg.alphaFrame7 = { ok: false, error: "không trích được frame 7" };
          } else bg.error = probe.error;
          // Q9 PASS: guard chặn + u2net hoàn tất (đường ship đúng thiết kế),
          // HOẶC birefnet chạy được thật (lần đầu — còn tốt hơn).
          bg.ok = probe.ok && size > 1000 && bg.hasAlpha && (bg.framesRead ?? 0) >= 13
            && ((bg.guardBlocked === true) || (bg.birefnetRan === true));
          if (!bg.ok && !bg.error) bg.error = `hasAlpha=${bg.hasAlpha} pixFmt=${bg.pixFmt} framesRead=${bg.framesRead} size=${size} guardBlocked=${bg.guardBlocked} birefnetRan=${bg.birefnetRan}`;
          log(`Bgremove guard E2E: ${bg.ok ? "PASS" : "FAIL"} ${(bg.ms / 1000).toFixed(1)}s, session=${bg.sessionUsed}, fallbackFrom=${bg.fallbackFrom}, guardBlocked=${bg.guardBlocked === true}, birefnetRan=${bg.birefnetRan === true}, mov ${size} byte, duration=${bg.duration}s, codec=${bg.codec}, pixFmt=${bg.pixFmt}, frames=${bg.framesRead}, ~${bg.fps} fps, alpha frame7=${JSON.stringify(bg.alphaFrame7)}`);
        }
      }
    }
  } catch (e) { bg.error = `${e.name}: ${e.message}`.slice(0, 500); }
  stopRamSampler();
  if (!bg.ok) log(`Bgremove guard E2E FAIL: ${bg.error || "?"}`);
  report.steps.bgremoveGuardE2e = bg;
  const memAfter = readMemAvailKb();
  report.steps.ramAfterJob = { memAvailableMb: memAfter ? Math.round(memAfter / 1024) : null };
  sampleResources("after-bgremove");

  // Bằng chứng marker RAM_GUARD trong log app (stderr Python qua bridge).
  try {
    const appOut = fs.readFileSync(path.join(WORK, "app-stdout.log"), "utf8");
    const guardLines = appOut.split("\n").filter((l) => /RAM_GUARD|ram_guard/.test(l));
    report.steps.ramGuardLogEvidence = { found: guardLines.length, lines: guardLines.slice(0, 10) };
    log(`marker RAM_GUARD trong app-stdout.log: ${guardLines.length} dòng`);
  } catch (e) {
    report.steps.ramGuardLogEvidence = { found: 0, error: e.message };
  }
  // Cửa sổ RAM: max thấy được trong lúc chạy.
  log(`cửa sổ RAM: max MemAvailable thấy được trong lúc chạy = ${report.ramWindow.maxMemAvailableMb} MB (ngưỡng ${RAM_GUARD_THRESHOLD_MB} MB) — ${report.ramWindow.maxMemAvailableMb != null && report.ramWindow.maxMemAvailableMb >= RAM_GUARD_THRESHOLD_MB ? "CÓ cửa sổ >= 6 GB (ghi nhận, xem xét thử birefnet riêng)" : "KHÔNG có cửa sổ yên >= 6 GB trong lượt này"}`);

  finish(bg.ok ? 0 : 1);
}

function finish(code) {
  stopRamSampler();
  report.allPass = code === 0;
  report.finishedAt = nowIso();
  try {
    if (app && pidAlive(app.pid)) {
      try { process.kill(-app.pid, "SIGTERM"); } catch { try { app.kill("SIGTERM"); } catch {} }
      for (let i = 0; i < 15 && pidAlive(app.pid); i++) spawnSync("sleep", ["1"]);
      if (pidAlive(app.pid)) { try { process.kill(-app.pid, "SIGKILL"); } catch { try { app.kill("SIGKILL"); } catch {} } }
    }
  } catch {}
  try { if (xvfb && pidAlive(xvfb.pid)) xvfb.kill("SIGKILL"); } catch {}
  setTimeout(async () => {
    const bridgeGone = BRIDGE_PORT ? await portFree(BRIDGE_PORT) : null;
    report.cleanup = { bridgePortFreeAfterKill: bridgeGone, appPidAlive: pidAlive(app?.pid) };
    log(`dọn dẹp: cổng bridge ${BRIDGE_PORT} sau khi kill: ${bridgeGone ? "trống (bridge đã chết)" : "VẪN BẬN — bridge mồ côi?"}, app pid còn sống: ${pidAlive(app?.pid)}`);
    try {
      writeFileEpermRetry(REPORT, JSON.stringify(report, null, 2));
      const sz = fs.statSync(REPORT).size;
      if (sz < 100) { console.error("report ghi ra quá nhỏ — nghi EPERM"); process.exitCode = 1; return; }
      log(`report: ${REPORT} (${sz} byte)`);
      writeFileEpermRetry(LOGF, logLines.join("\n") + "\n");
    } catch (e) { console.error(`ghi report fail: ${e.message}`); process.exitCode = 1; return; }
    log(`KẾT QUẢ Q9: BgremoveGuardE2E=${report.steps.bgremoveGuardE2e?.ok ? "PASS" : "FAIL"} guardBlocked=${report.steps.bgremoveGuardE2e?.guardBlocked === true} birefnetRan=${report.steps.bgremoveGuardE2e?.birefnetRan === true} → ${report.allPass ? "PASS" : "FAIL"}`);
    process.exitCode = code;
  }, 3000);
}

main().catch((e) => { console.error("lỗi chết script:", e); try { finish(1); } catch { process.exit(1); } });
