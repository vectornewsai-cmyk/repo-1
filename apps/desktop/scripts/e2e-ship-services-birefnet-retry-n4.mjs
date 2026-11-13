#!/usr/bin/env node
/**
 * e2e-ship-services-birefnet-retry-n4.mjs — Phase 9 đợt 86, luồng N4 (attempt 2).
 *
 * Attempt 1 (script M6, AppImage qua APPIMAGE_EXTRACT_AND_RUN=1) FAIL ở bước
 * khởi động: giải nén lạnh 557MB AppImage chỉ được ~49% (9.367/19.034 file,
 * 1,1/2,4 GB) sau 120s nên script M6 kill app trước khi Electron kịp chạy —
 * KHÔNG tới được job birefnet. L7/M6 đã chứng minh bước giải nén + khởi động
 * AppImage chạy được; N4 không chứng minh lại mà chạy thẳng AppRun đã giải nén
 * đầy đủ (cùng nội dung gói, cùng AppImage sha 0326dccb… đã verify) để tới
 * được job birefnet. Mọi bước verify job giữ nguyên như M6 (clip 0,5s/15 frame,
 * session birefnet-general, FAIL cứng nếu fallback sang u2net).
 *
 * Cách chạy: node apps/desktop/scripts/e2e-ship-services-birefnet-retry-n4.mjs
 * Env: N4R_WORK (mặc định ~/workspace/tmp-n4-ship-e2e-birefnet),
 *   N4R_APPRUN (mặc định AppRun đã giải nén đầy đủ của M6),
 *   M6R_APPIMAGE / M6R_EXPECTED_SHA / M6R_MODELS_DIR (mặc định như script M6).
 * Exit 0 khi birefnet PASS, 1 khi FAIL. KHÔNG sửa production, KHÔNG push.
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
const WORK = process.env.N4R_WORK || path.join(HOME, "workspace", "tmp-n4-ship-e2e-birefnet");
const APPIMAGE = process.env.M6R_APPIMAGE
  || path.join(HOME, "workspace", "tmp-j8-electron", "ship", "ship-full", "vcut-studio-0.1.0-x86_64.AppImage");
// N4 attempt 2: chạy AppRun đã giải nén đầy đủ (19.034 file / 2,4 GB, cùng
// AppImage sha đã verify ở preflight) thay vì giải nén lạnh lại — xem header.
const APPRUN = process.env.N4R_APPRUN
  || path.join(HOME, "workspace", "tmp-m6-ship-e2e-rest", "tmp-run",
    "appimage_extracted_d0b4d821b7a8433ea985347fec965b49", "AppRun");
const EXPECTED_SHA = process.env.M6R_EXPECTED_SHA
  || "0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c";
const MODELS_DIR = process.env.M6R_MODELS_DIR
  || path.join(HOME, "workspace", "tmp-j8-electron", "ship", "models");
const CLIP1 = path.join(ROOT, "server", "render", "examples", "media", "clip1.mp4");
const USERDATA = path.join(WORK, "userdata");
const TMP_RUN = path.join(WORK, "tmp-run");
const OUT = path.join(WORK, "outputs");
const REPORT = path.join(WORK, "e2e-report.json");
const LOGF = path.join(WORK, "e2e-run.log");

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
function sampleResources(tag) {
  try {
    const load = fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/).slice(0, 3).join(" ");
    const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
    const avail = (meminfo.match(/MemAvailable:\s+(\d+)/) || [])[1] || "?";
    let rssKb = 0; let nproc = 0;
    try {
      const ps = execSync("ps -eo rss,args", { encoding: "utf8", timeout: 15000 });
      for (const line of ps.split("\n")) {
        if (/vcut|electron|bgremove\.py|rembg|onnxruntime/i.test(line) && !/ps -eo|grep|birefnet-retry/.test(line)) {
          const m = line.trim().match(/^(\d+)\s/);
          if (m) { rssKb += Number(m[1]); nproc++; }
        }
      }
    } catch {}
    log(`[res] ${tag}: loadavg=${load} memAvail=${avail}kB vcutRSS~${Math.round(rssKb / 1024)}MB (${nproc} proc)`);
    return { tag, loadavg: load, memAvailableKb: Number(avail) || null, vcutRssMb: Math.round(rssKb / 1024), vcutProcs: nproc };
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
  tool: "e2e-ship-services-birefnet-retry-n4.mjs (N4, đợt 86, attempt 2 — AppRun đã giải nén)",
  startedAt: nowIso(),
  appimage: APPIMAGE,
  apprun: APPRUN,
  expectedSha: EXPECTED_SHA,
  modelsDir: MODELS_DIR,
  work: WORK,
  steps: {},
  resources: [],
  allPass: false,
};
let xvfb = null; let app = null;
let BRIDGE_PORT = 0; let DISPLAY_NUM = 0; let CDP_PORT = 0;

async function main() {
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(TMP_RUN, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  log(`N4 birefnet RETRY attempt 2 — AppRun=${APPRUN} (từ AppImage ${APPIMAGE}) WORK=${WORK}`);

  const pre = { ok: true, notes: [] };
  if (!fs.existsSync(APPIMAGE)) { pre.ok = false; pre.notes.push("AppImage không còn trên đĩa"); }
  else {
    const size = fs.statSync(APPIMAGE).size;
    const sha = sha256File(APPIMAGE);
    pre.appimageSize = size; pre.appimageSha = sha;
    log(`AppImage: ${size} byte, sha256 ${sha}`);
    if (sha !== EXPECTED_SHA) { pre.ok = false; pre.notes.push("SHA KHÔNG KHỚP"); }
  }
  // AppRun phải là cây đã giải nén ĐẦY ĐỦ của chính AppImage đó (kiểm chứng:
  // app.asar + vcut-server có mặt; đếm file — kỳ vọng ~19.034 như lần M6).
  if (!fs.existsSync(APPRUN)) { pre.ok = false; pre.notes.push("không thấy AppRun đã giải nén"); }
  else {
    const appDir = path.dirname(APPRUN);
    pre.apprunDir = appDir;
    pre.appAsarOk = fs.existsSync(path.join(appDir, "resources", "app.asar"));
    pre.vcutServerOk = fs.existsSync(path.join(appDir, "resources", "vcut-server"));
    try {
      const n = execSync(`find "${appDir}" -type f | wc -l`, { encoding: "utf8", timeout: 120000 });
      pre.extractedFileCount = Number(n.trim());
    } catch { pre.extractedFileCount = null; }
    log(`AppRun đã giải nén: ${appDir} — app.asar=${pre.appAsarOk} vcut-server=${pre.vcutServerOk} files=${pre.extractedFileCount}`);
    if (!pre.appAsarOk || !pre.vcutServerOk) { pre.ok = false; pre.notes.push("cây giải nén thiếu app.asar/vcut-server"); }
    if (pre.extractedFileCount && pre.extractedFileCount < 18000) { pre.ok = false; pre.notes.push(`cây giải nén chưa đủ file (${pre.extractedFileCount} < 18000 — nghi giải nén dở)`); }
  }
  for (const bin of ["ffmpeg", "ffprobe", "Xvfb", "python3"]) {
    if (spawnSync("which", [bin], { encoding: "utf8" }).status !== 0) { pre.ok = false; pre.notes.push(`thiếu binary ${bin}`); }
  }
  if (!fs.existsSync(CLIP1)) { pre.ok = false; pre.notes.push(`không thấy clip1 ${CLIP1}`); }
  if (!fs.existsSync(MODELS_DIR)) { pre.ok = false; pre.notes.push(`không thấy models dir ${MODELS_DIR}`); }
  report.steps.preflight = pre;
  log(`preflight: ${pre.ok ? "OK" : "FAIL"} — ${pre.notes.join("; ")}`);
  if (!pre.ok) { finish(1); return; }

  // Clip 0,5s (15 frame) — giảm thời gian giữ peak memory so với lần 1 (1s/30 frame).
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
  app = spawn(APPRUN, [`--user-data-dir=${USERDATA}`, "--no-sandbox", `--remote-debugging-port=${CDP_PORT}`], {
    env: { ...process.env, DISPLAY: `:${DISPLAY_NUM}`, APPDIR: path.dirname(APPRUN), VCUT_MODELS_DIR: MODELS_DIR, TMPDIR: TMP_RUN },
    stdio: ["ignore", appLog, appLog],
    detached: true,
  });
  log(`đã spawn AppRun pid=${app.pid}, chờ service-manager ghi cổng bridge…`);
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

  const bg = { ok: false };
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
      bg.events = stream.events.map((e) => ({ type: e.type, phase: e.phase, done: e.done, total: e.total, message: (e.message || e.error || "").slice(0, 200) }));
      if (stream.error) bg.error = JSON.stringify(stream.error).slice(0, 500);
      else if (!stream.done) bg.error = "stream kết thúc mà không có event done";
      else if (!stream.done.downloadUrl) bg.error = "done nhưng không có downloadUrl";
      else {
        bg.sessionUsed = stream.done.sessionUsed;
        bg.fallbackFrom = stream.done.fallbackFrom;
        bg.fallbackReason = stream.done.fallbackReason || null;
        if (bg.sessionUsed !== "birefnet-general" || bg.fallbackFrom) {
          bg.error = `session dùng thật là "${bg.sessionUsed}" (fallback từ ${bg.fallbackFrom || "?"}) — KHÔNG phải birefnet-general; lý do: ${bg.fallbackReason || "?"}`;
        } else {
          const movPath = path.join(OUT, "clip-0.5s_no_bg_birefnet.mov");
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
            const framePng = path.join(OUT, "birefnet-frame7.png");
            const ext = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", movPath, "-vf", "select=eq(n\\,7)", "-frames:v", "1", framePng], { encoding: "utf8", timeout: 60000 });
            if (ext.status === 0 && fs.existsSync(framePng)) bg.alphaFrame7 = analyzeAlphaPng(framePng);
            else bg.alphaFrame7 = { ok: false, error: "không trích được frame 7" };
          } else bg.error = probe.error;
          bg.ok = probe.ok && size > 1000 && bg.hasAlpha && (bg.framesRead ?? 0) >= 13 && bg.sessionUsed === "birefnet-general" && !bg.fallbackFrom;
          if (!bg.ok && !bg.error) bg.error = `hasAlpha=${bg.hasAlpha} pixFmt=${bg.pixFmt} framesRead=${bg.framesRead} size=${size}`;
          log(`Bgremove-birefnet RETRY: ${bg.ok ? "PASS" : "FAIL"} ${(bg.ms / 1000).toFixed(1)}s, session=${bg.sessionUsed}, mov ${size} byte, duration=${bg.duration}s, codec=${bg.codec}, pixFmt=${bg.pixFmt}, frames=${bg.framesRead}, ~${bg.fps} fps, alpha frame7=${JSON.stringify(bg.alphaFrame7)}`);
        }
      }
    }
  } catch (e) { bg.error = `${e.name}: ${e.message}`.slice(0, 500); }
  if (!bg.ok) log(`Bgremove-birefnet RETRY FAIL: ${bg.error || "?"}`);
  report.steps.bgremoveBirefnet = bg;
  sampleResources("after-bgremove-birefnet");

  finish(bg.ok ? 0 : 1);
}

function finish(code) {
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
    log(`KẾT QUẢ RETRY: BgremoveBirefnet=${report.steps.bgremoveBirefnet?.ok ? "PASS" : "FAIL"} → ${report.allPass ? "PASS" : "FAIL"}`);
    process.exitCode = code;
  }, 3000);
}

main().catch((e) => { console.error("lỗi chết script:", e); try { finish(1); } catch { process.exit(1); } });
