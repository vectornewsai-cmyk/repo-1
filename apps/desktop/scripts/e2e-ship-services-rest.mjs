#!/usr/bin/env node
/**
 * e2e-ship-services-rest.mjs — Phase 9 đợt 85, luồng M6: SHIP SERVICES (phần còn lại).
 *
 * Kiểm chứng end-to-end các dịch vụ AI còn lại trong AppImage VCut Studio ĐÃ
 * ĐÓNG GÓI (profile full, K7 build lại đợt 83) — nối tiếp L7 đợt 84 (TTS /
 * Caption / Bgremove-u2net đã PASS 3/3). Lần này chạy JOB THẬT qua bridge
 * của chính gói đó, rồi verify output thật trên đĩa (không tin log "ok" suông):
 *   1. Reframe: clip1.mp4 8s → aspect 9:16 → MP4 thật (verify tỉ lệ 9:16,
 *      duration, số frame).
 *   2. Translate: tts.wav tiếng Việt của L7 → target en → segment tiếng Anh
 *      (verify text khớp nghĩa câu đã đọc, timestamp trong duration).
 *   3. Silence: WAV tổng hợp 6s (tone 2s + lặng 2s + tone 2s, ground truth
 *      đã biết) → JSON silences (verify khoảng lặng phát hiện khớp [2s, 4s]).
 *   4. Scene: clip ghép 4s (2s clip1 + 2s clip2, cắt cứng tại 2.0s) → cuts
 *      (verify có 1 cut gần 2.0s).
 *   5. Bgremove birefnet-general: clip 1s (30 frame), session=birefnet-general
 *      (mặc định của endpoint — L7 chỉ chạy u2net) → MOV alpha thật (verify
 *      pix_fmt rgba, đủ frame, phân tích alpha 1 frame bằng PIL; nếu bridge
 *      fallback sang u2net thì job này FAIL — ghi rõ, không nhận vơ birefnet).
 *
 * Birefnet KHÔNG phải service riêng (không có endpoint riêng): nó là 1 session
 * của /api/bgremove. Đợt 73 đã CHỐT ĐÓNG birefnet như hướng thay thế u2net
 * (u2net là fallback chính thức) — job 5 ở đây KHÔNG mở lại quyết định đó;
 * nó chỉ kiểm chứng session mặc định của endpoint có chạy được thật trong gói
 * hay không (user bấm bgremove trong app đóng gói sẽ đi đúng session này).
 *
 * Cách chạy (từ gốc repo):
 *   node apps/desktop/scripts/e2e-ship-services-rest.mjs
 * Env: M6_APPIMAGE (mặc định AppImage K7), M6_EXPECTED_SHA,
 *   M6_WORK (mặc định ~/workspace/tmp-m6-ship-e2e-rest),
 *   M6_MODELS_DIR (mặc định ~/workspace/tmp-j8-electron/ship/models),
 *   M6_TTS_WAV (mặc định output tts.wav của L7 đợt 84).
 * Exit 0 khi cả 5 job PASS, 1 khi có FAIL (vẫn ghi report + dọn sạch app).
 *
 * KHÔNG sửa code production, KHÔNG build lại, KHÔNG push. Chỉ đọc AppImage
 * có sẵn + ghi report/output vào M6_WORK (ngoài repo).
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
const WORK = process.env.M6_WORK || path.join(HOME, "workspace", "tmp-m6-ship-e2e-rest");
const APPIMAGE = process.env.M6_APPIMAGE
  || path.join(HOME, "workspace", "tmp-j8-electron", "ship", "ship-full", "vcut-studio-0.1.0-x86_64.AppImage");
const EXPECTED_SHA = process.env.M6_EXPECTED_SHA
  || "0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c";
const MODELS_DIR = process.env.M6_MODELS_DIR
  || path.join(HOME, "workspace", "tmp-j8-electron", "ship", "models");
const CLIP1 = path.join(ROOT, "server", "render", "examples", "media", "clip1.mp4");
const CLIP2 = path.join(ROOT, "server", "render", "examples", "media", "clip2.mp4");
const TTS_WAV = process.env.M6_TTS_WAV
  || path.join(HOME, "workspace", "tmp-l7-ship-e2e-run3", "outputs", "tts.wav");
const USERDATA = path.join(WORK, "userdata");
const TMP_RUN = path.join(WORK, "tmp-run");
const OUT = path.join(WORK, "outputs");
const INPUTS = path.join(WORK, "inputs");
const REPORT = path.join(WORK, "e2e-report.json");
const LOGF = path.join(WORK, "e2e-run.log");

// Ground truth cho translate: câu TTS gốc của L7 (tiếng Việt) → dịch sang en.
const TRANSLATE_KEYWORDS = ["hello", "video", "test", "vcut", "vietnamese"];
// Ground truth cho silence: tone 0–2s, lặng 2–4s, tone 4–6s (file tự tổng hợp).
const SILENCE_EXPECTED = { start: 2.0, end: 4.0, tol: 0.35 };
// Ground truth cho scene: cắt cứng tại 2.0s (clip ghép 2s clip1 + 2s clip2).
const SCENE_EXPECTED_CUT = 2.0;
const SCENE_CUT_TOL = 0.5;

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
    const total = (meminfo.match(/MemTotal:\s+(\d+)/) || [])[1] || "?";
    let rssKb = 0; let nproc = 0;
    try {
      const ps = execSync("ps -eo rss,args", { encoding: "utf8", timeout: 15000 });
      for (const line of ps.split("\n")) {
        if (/vcut|electron|faster_whisper|caption\.py|bgremove\.py|tts\.py|reframe\.py|translate\.py|rembg|onnxruntime/i.test(line)
          && !/ps -eo|grep|e2e-ship-services-rest/.test(line)) {
          const m = line.trim().match(/^(\d+)\s/);
          if (m) { rssKb += Number(m[1]); nproc++; }
        }
      }
    } catch { /* ps fail thì chỉ ghi load/mem */ }
    const s = { tag, loadavg: load, memAvailableKb: Number(avail) || null, memTotalKb: Number(total) || null, vcutRssMb: Math.round(rssKb / 1024), vcutProcs: nproc };
    log(`[res] ${tag}: loadavg=${load} memAvail=${avail}kB vcutRSS~${s.vcutRssMb}MB (${nproc} proc)`);
    return s;
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
    if (app && !pidAlive(app.pid)) {
      let tail = "";
      try {
        const lg = fs.readFileSync(path.join(WORK, "app-stdout.log"), "utf8");
        const lines = lg.split("\n").filter((l) => /ERROR|error|Missing X|failed|FATAL/i.test(l) && !/appimage_extracted/.test(l));
        tail = lines.slice(-10).join(" | ").slice(0, 1000) || "(không thấy dòng ERROR trong app-stdout.log)";
      } catch { tail = "(không đọc được app-stdout.log)"; }
      return { ok: false, ms: Date.now() - t0, lastErr: `app đã chết (pid ${app.pid}) trước khi bridge healthy — ${tail}` };
    }
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
/** Đọc stream NDJSON tới khi gặp done/error (mẫu L7: for-await, không race
 * reader.read() với timeout — xem e2e-ship-services.mjs). */
async function readNdjsonStream(res, timeoutMs, label) {
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
function normText(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
/** Phân tích alpha 1 frame PNG bằng PIL: % transparent/semi/opaque, alpha max/tb. */
function analyzeAlphaPng(pngPath) {
  const py = spawnSync("python3", ["-c",
    "import sys,json\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGBA')\na=list(im.getchannel('A').getdata())\nn=len(a)\ntr=sum(1 for v in a if v==0)\nse=sum(1 for v in a if 0<v<255)\nop=sum(1 for v in a if v==255)\nprint(json.dumps({'pixels':n,'pctTransparent':round(100*tr/n,1),'pctSemi':round(100*se/n,1),'pctOpaque':round(100*op/n,1),'alphaMax':max(a),'alphaMean':round(sum(a)/n,1)}))\n",
    pngPath], { encoding: "utf8", timeout: 60000 });
  if (py.status !== 0) return { ok: false, error: (py.stderr || py.error?.message || "PIL fail").slice(0, 300) };
  try { return { ok: true, ...JSON.parse(py.stdout.trim()) }; } catch (e) { return { ok: false, error: `parse PIL: ${e.message}` }; }
}

const report = {
  tool: "e2e-ship-services-rest.mjs (M6, đợt 85)",
  startedAt: nowIso(),
  appimage: APPIMAGE,
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
  fs.mkdirSync(INPUTS, { recursive: true });
  log(`M6 E2E ship services (rest) — AppImage=${APPIMAGE}`);
  log(`WORK=${WORK}`);

  // --- 0. Preflight -------------------------------------------------------
  const pre = { ok: true, notes: [] };
  if (!fs.existsSync(APPIMAGE)) { pre.ok = false; pre.notes.push("AppImage không còn trên đĩa"); }
  else {
    const size = fs.statSync(APPIMAGE).size;
    const sha = sha256File(APPIMAGE);
    pre.appimageSize = size; pre.appimageSha = sha;
    log(`AppImage: ${size} byte, sha256 ${sha}`);
    if (sha !== EXPECTED_SHA) { pre.ok = false; pre.notes.push(`SHA KHÔNG KHỚP (kỳ vọng ${EXPECTED_SHA})`); }
    if (size !== 556967608) pre.notes.push(`size khác K7 (${size} vs 556967608) — chỉ ghi nhận, sha mới là chuẩn`);
  }
  try {
    writeFileEpermRetry(path.join(WORK, "wave-probe.txt"), "x".repeat(500));
    const sz = fs.statSync(path.join(WORK, "wave-probe.txt")).size;
    if (sz !== 500) { pre.ok = false; pre.notes.push(`EPERM? ghi node ra ${sz} byte thay vì 500`); }
    else pre.notes.push("ghi node OK (sóng EPERM đang tắt)");
  } catch (e) { pre.ok = false; pre.notes.push(`ghi node fail: ${e.message}`); }
  for (const bin of ["ffmpeg", "ffprobe", "Xvfb", "python3"]) {
    const r = spawnSync("which", [bin], { encoding: "utf8" });
    if (r.status !== 0) { pre.ok = false; pre.notes.push(`thiếu binary ${bin}`); }
  }
  const pil = spawnSync("python3", ["-c", "import PIL"], { encoding: "utf8" });
  if (pil.status !== 0) pre.notes.push("thiếu PIL (phân tích alpha sẽ bỏ qua, ffprobe vẫn chạy)");
  else pre.notes.push("PIL có sẵn (phân tích alpha được)");
  for (const [label, p] of [["clip1", CLIP1], ["clip2", CLIP2], ["tts.wav (L7)", TTS_WAV]]) {
    if (!fs.existsSync(p)) { pre.ok = false; pre.notes.push(`không thấy ${label} ${p}`); }
  }
  if (!fs.existsSync(MODELS_DIR)) { pre.ok = false; pre.notes.push(`không thấy models dir ${MODELS_DIR}`); }
  else {
    const biref = path.join(MODELS_DIR, "bgremove", "birefnet-general.onnx");
    pre.birefnetModelPresent = fs.existsSync(biref);
    pre.birefnetModelBytes = pre.birefnetModelPresent ? fs.statSync(biref).size : null;
    if (!pre.birefnetModelPresent) pre.notes.push("THIẾU model birefnet-general.onnx trong models dir — job 5 sẽ fail, ghi rõ");
  }
  report.steps.preflight = pre;
  log(`preflight: ${pre.ok ? "OK" : "FAIL"} — ${pre.notes.join("; ")}`);
  if (!pre.ok) { finish(1); return; }

  // --- Chuẩn bị input kiểm chứng (ground truth đã biết) -------------------
  // a) WAV lặng: tone 440Hz 2s + lặng 2s + tone 880Hz 2s (48kHz mono).
  const silenceWav = path.join(INPUTS, "silence-test.wav");
  const mkSil = spawnSync("ffmpeg", ["-y", "-v", "error",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=2",
    "-f", "lavfi", "-t", "2", "-i", "anullsrc=channel_layout=mono:sample_rate=48000",
    "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=2",
    "-filter_complex", "[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]", "-map", "[out]", silenceWav],
    { encoding: "utf8", timeout: 60000 });
  const silProbe = ffprobeJson(silenceWav);
  const silOk = mkSil.status === 0 && silProbe.ok && Math.abs(Number(silProbe.data.format.duration) - 6) < 0.1;
  // b) Clip ghép scene: 2s clip1 + 2s clip2, cắt cứng tại 2.0s, re-encode.
  const sceneClip = path.join(INPUTS, "scene-test.mp4");
  const mkScene = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", CLIP1, "-i", CLIP2,
    "-filter_complex", "[0:v]trim=0:2,setpts=PTS-STARTPTS[v0];[1:v]trim=0:2,setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0[out]",
    "-map", "[out]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", sceneClip],
    { encoding: "utf8", timeout: 120000 });
  const sceneProbe = ffprobeJson(sceneClip);
  const sceneClipOk = mkScene.status === 0 && sceneProbe.ok && Math.abs(Number(sceneProbe.data.format.duration) - 4) < 0.1;
  // c) Clip 1s cho birefnet (30 frame — đủ verify code path, tránh 10+ phút chờ).
  const clip1s = path.join(INPUTS, "clip-1s.mp4");
  const mk1s = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", CLIP1, "-t", "1", "-c", "copy", clip1s], { encoding: "utf8", timeout: 60000 });
  const c1sProbe = ffprobeJson(clip1s);
  const c1sOk = mk1s.status === 0 && c1sProbe.ok && Number(c1sProbe.data.format.duration) >= 0.9;
  report.steps.prepareInputs = { silenceWav: silOk, silenceDuration: silProbe.ok ? silProbe.data.format.duration : null, sceneClip: sceneClipOk, sceneDuration: sceneProbe.ok ? sceneProbe.data.format.duration : null, clip1s: c1sOk, clip1sDuration: c1sProbe.ok ? c1sProbe.data.format.duration : null };
  log(`chuẩn bị input: silence ${silOk ? "OK" : "FAIL"} (${report.steps.prepareInputs.silenceDuration}s), scene-clip ${sceneClipOk ? "OK" : "FAIL"} (${report.steps.prepareInputs.sceneDuration}s), clip-1s ${c1sOk ? "OK" : "FAIL"} (${report.steps.prepareInputs.clip1sDuration}s)`);
  if (!silOk || !sceneClipOk || !c1sOk) { finish(1); return; }

  // Chọn display trống (verify Xvfb sống thật — bài học L7 lượt 2).
  const pickDisplay = () => {
    for (let n = 90; n <= 99; n++) {
      if (fs.existsSync(`/tmp/.X${n}-lock`) || fs.existsSync(`/tmp/.X11-unix/X${n}`)) continue;
      return n;
    }
    return null;
  };
  DISPLAY_NUM = pickDisplay();
  CDP_PORT = 0;
  for (let p = 9223; p <= 9232; p++) { if (await portFree(p)) { CDP_PORT = p; break; } }
  log(`chọn tài nguyên: DISPLAY=:${DISPLAY_NUM} cdp=${CDP_PORT} (cổng bridge sẽ đọc từ service-manager.log của app)`);
  if (!DISPLAY_NUM || !CDP_PORT) { log("FAIL: không còn display/cổng CDP trống"); finish(1); return; }

  // --- 1. Khởi động AppImage ---------------------------------------------
  sampleResources("pre-launch");
  const xvfbLog = fs.openSync(path.join(WORK, "xvfb.log"), "w");
  xvfb = spawn("Xvfb", [`:${DISPLAY_NUM}`, "-screen", "0", "1920x1080x24"], { stdio: ["ignore", xvfbLog, xvfbLog] });
  let xvfbOk = false;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    if (pidAlive(xvfb.pid) && fs.existsSync(`/tmp/.X${DISPLAY_NUM}-lock`)) { xvfbOk = true; break; }
  }
  report.steps.xvfb = { ok: xvfbOk, pid: xvfb.pid, display: DISPLAY_NUM };
  log(`Xvfb :${DISPLAY_NUM} pid=${xvfb.pid}: ${xvfbOk ? "OK (lock file đã xuất hiện)" : "FAIL — không thấy lock file sau 10s, xem xvfb.log"}`);
  if (!xvfbOk) { finish(1); return; }
  const appLog = fs.openSync(path.join(WORK, "app-stdout.log"), "w");
  app = spawn(APPIMAGE, [`--user-data-dir=${USERDATA}`, "--no-sandbox", `--remote-debugging-port=${CDP_PORT}`], {
    env: { ...process.env, DISPLAY: `:${DISPLAY_NUM}`, APPIMAGE_EXTRACT_AND_RUN: "1", VCUT_MODELS_DIR: MODELS_DIR, TMPDIR: TMP_RUN },
    stdio: ["ignore", appLog, appLog],
    detached: true,
  });
  log(`đã spawn AppImage pid=${app.pid} (Xvfb :${DISPLAY_NUM}), chờ service-manager ghi cổng bridge…`);
  // Đọc cổng bridge THẬT từ service-manager.log của chính app này (không đoán
  // cổng trống như L7: app tự scan 8787..8796, đoán trước có thể trúng app khác).
  const mgrLog = path.join(USERDATA, "logs", "service-manager.log");
  let foundPort = 0;
  for (let i = 0; i < 120 && !foundPort; i++) {
    await sleep(1000);
    if (app && !pidAlive(app.pid)) break;
    try {
      const txt = fs.readFileSync(mgrLog, "utf8");
      const m = txt.match(/BRIDGE_PORT=(\d+)/);
      if (m) foundPort = Number(m[1]);
    } catch { /* log chưa xuất hiện */ }
  }
  report.steps.discoverBridgePort = { ok: foundPort > 0, port: foundPort || null };
  if (!foundPort) {
    log("FAIL: 120s không thấy BRIDGE_PORT trong service-manager.log (app chết? xem app-stdout.log)");
    finish(1); return;
  }
  BRIDGE_PORT = foundPort;
  log(`cổng bridge thật của app này: ${BRIDGE_PORT} (đọc từ service-manager.log)`);
  const healthy = await waitBridgeHealthy(600_000, BRIDGE_PORT);
  report.steps.launch = { ok: healthy.ok, msToHealthy: healthy.ms, pid: app.pid, bridgePort: BRIDGE_PORT, health: healthy.ok ? healthy.body : healthy.lastErr };
  log(`bridge healthy: ${healthy.ok ? `OK sau ${(healthy.ms / 1000).toFixed(1)}s` : `FAIL sau ${(healthy.ms / 1000).toFixed(1)}s — ${healthy.lastErr}`}`);
  if (healthy.ok) {
    const h = healthy.body || {};
    log(`health: ok=${h.ok} ffmpeg=${h.ffmpeg || "?"} services=${JSON.stringify({ caption: h.caption, bgremove: h.bgremove, translate: h.translate, reframe: h.reframe, silence: h.silence, scene: h.scene })}`);
  }
  if (!healthy.ok) { finish(1); return; }
  sampleResources("bridge-healthy");
  report.resources.push(sampleResources("bridge-healthy"));

  // --- 2. Reframe: clip1 8s → 9:16 -----------------------------------------
  const rf = { ok: false };
  try {
    const form = new FormData();
    form.append("media", new Blob([fs.readFileSync(CLIP1)], { type: "video/mp4" }), "clip1.mp4");
    form.append("aspect", "9:16");
    const t0 = Date.now();
    const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/reframe`, {
      method: "POST", body: form, signal: AbortSignal.timeout(600_000),
    });
    rf.httpStatus = res.status;
    if (res.status !== 200) {
      rf.error = `HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`;
    } else {
      const stream = await readNdjsonStream(res, 600_000, "reframe");
      rf.ms = Date.now() - t0;
      rf.events = stream.events.map((e) => ({ type: e.type, phase: e.phase, done: e.done, total: e.total, message: (e.message || e.error || "").slice(0, 200) }));
      if (stream.error) rf.error = JSON.stringify(stream.error).slice(0, 500);
      else if (!stream.done) rf.error = "stream kết thúc mà không có event done";
      else if (!stream.done.downloadUrl) rf.error = "done nhưng không có downloadUrl";
      else {
        rf.aspect = stream.done.aspect; rf.bytes = stream.done.bytes;
        const outPath = path.join(OUT, "clip1_9x16.mp4");
        const size = await downloadTo(`http://127.0.0.1:${BRIDGE_PORT}${stream.done.downloadUrl}`, outPath);
        const probe = ffprobeJson(outPath);
        rf.file = outPath; rf.size = size; rf.probeOk = probe.ok;
        if (probe.ok) {
          const v = probe.data.streams.find((s) => s.codec_type === "video");
          rf.duration = Number(probe.data.format.duration);
          rf.codec = v?.codec_name; rf.width = v?.width; rf.height = v?.height;
          rf.nbFrames = v?.nb_frames ? Number(v.nb_frames) : null;
          rf.framesRead = countFrames(outPath);
          rf.ratioOk = rf.width && rf.height && Math.abs((rf.width / rf.height) - (9 / 16)) < 0.01;
          rf.durationOk = rf.duration && Math.abs(rf.duration - 8) < 0.2;
          rf.framesOk = (rf.framesRead ?? 0) >= 230;
        } else rf.error = probe.error;
        rf.ok = probe.ok && size > 1000 && rf.ratioOk && rf.durationOk && rf.framesOk;
        if (!rf.ok && !rf.error) rf.error = `ratioOk=${rf.ratioOk} (${rf.width}x${rf.height}) durationOk=${rf.durationOk} (${rf.duration}s) framesOk=${rf.framesOk} (read=${rf.framesRead}) size=${size}`;
        log(`Reframe: ${rf.ok ? "PASS" : "FAIL"} ${(rf.ms / 1000).toFixed(1)}s, mp4 ${size} byte, ${rf.width}x${rf.height}, duration=${rf.duration}s, frames=${rf.framesRead}`);
      }
    }
  } catch (e) { rf.error = `${e.name}: ${e.message}`.slice(0, 500); }
  if (!rf.ok) log(`Reframe FAIL: ${rf.error || "?"}`);
  report.steps.reframe = rf;
  sampleResources("after-reframe");

  // --- 3. Translate: tts.wav (vi) → en --------------------------------------
  const tr = { ok: false };
  try {
    const form = new FormData();
    form.append("media", new Blob([fs.readFileSync(TTS_WAV)], { type: "audio/wav" }), "tts.wav");
    form.append("lang", "vi");
    form.append("target", "en");
    const t0 = Date.now();
    const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/caption/translate`, {
      method: "POST", body: form, signal: AbortSignal.timeout(900_000),
    });
    tr.httpStatus = res.status;
    if (res.status !== 200) {
      tr.error = `HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`;
    } else {
      const stream = await readNdjsonStream(res, 900_000, "translate");
      tr.ms = Date.now() - t0;
      tr.events = stream.events.map((e) => ({ type: e.type, phase: e.phase, done: e.done, total: e.total, message: (e.message || e.error || "").slice(0, 200) }));
      if (stream.error) tr.error = JSON.stringify(stream.error).slice(0, 500);
      else if (!stream.done) tr.error = "stream kết thúc mà không có event done";
      else {
        const segs = stream.done.segments || [];
        tr.count = segs.length;
        tr.sourceLanguage = stream.done.sourceLanguage;
        tr.targetLanguage = stream.done.targetLanguage;
        tr.audioDurationSec = stream.done.audioDurationSec;
        tr.translateTimeSec = stream.done.translateTimeSec;
        tr.segments = segs;
        const srt = segs.map((s, i) => {
          const fmt = (t) => { const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = Math.floor(t % 60), ms = Math.round((t % 1) * 1000); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`; };
          return `${i + 1}\n${fmt(s.start)} --> ${fmt(s.end)}\n${s.text}\n`;
        }).join("\n");
        const srtPath = path.join(OUT, "translate-en.srt");
        writeFileEpermRetry(srtPath, srt);
        tr.srtFile = srtPath; tr.srtSize = fs.statSync(srtPath).size;
        const joined = normText(segs.map((s) => s.text).join(" "));
        tr.joinedText = segs.map((s) => s.text).join(" ");
        tr.matchedKeywords = TRANSLATE_KEYWORDS.filter((k) => joined.includes(k));
        const tsOk = segs.every((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.start >= 0 && s.end <= (tr.audioDurationSec || 999) + 0.5 && s.end > s.start);
        tr.timestampsOk = tsOk;
        tr.ok = segs.length > 0 && tsOk && tr.matchedKeywords.length >= 2 && tr.targetLanguage === "en";
        if (!tr.ok) tr.error = `segments=${segs.length} tsOk=${tsOk} target=${tr.targetLanguage} keywords khớp ${tr.matchedKeywords.length}/5 (${tr.matchedKeywords.join(",") || "không có"})`;
        log(`Translate: ${tr.ok ? "PASS" : "FAIL"} ${(tr.ms / 1000).toFixed(1)}s, ${segs.length} segment, ${tr.sourceLanguage}→${tr.targetLanguage}, translate=${tr.translateTimeSec}s, keywords ${tr.matchedKeywords.length}/5`);
        log(`  text nhận được: "${tr.joinedText}"`);
      }
    }
  } catch (e) { tr.error = `${e.name}: ${e.message}`.slice(0, 500); }
  if (!tr.ok) log(`Translate FAIL: ${tr.error || "?"}`);
  report.steps.translate = tr;
  sampleResources("after-translate");

  // --- 4. Silence: WAV tổng hợp, ground truth [2s, 4s] -----------------------
  const si = { ok: false };
  try {
    const form = new FormData();
    form.append("media", new Blob([fs.readFileSync(silenceWav)], { type: "audio/wav" }), "silence-test.wav");
    form.append("noiseDb", "-35");
    form.append("minDur", "0.5");
    const t0 = Date.now();
    const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/silence`, {
      method: "POST", body: form, signal: AbortSignal.timeout(300_000),
    });
    si.httpStatus = res.status;
    si.ms = Date.now() - t0;
    const body = await res.text();
    if (res.status !== 200) {
      si.error = `HTTP ${res.status}: ${body.slice(0, 500)}`;
    } else {
      let j;
      try { j = JSON.parse(body); } catch { si.error = `trả về không phải JSON: ${body.slice(0, 200)}`; }
      if (j) {
        si.audioDurationSec = j.audioDurationSec; si.noiseDb = j.noiseDb; si.minDur = j.minDur;
        si.count = j.count; si.silences = j.silences; si.keep = j.keep;
        const hit = (j.silences || []).find((s) =>
          Math.abs(s.start - SILENCE_EXPECTED.start) <= SILENCE_EXPECTED.tol &&
          Math.abs(s.end - SILENCE_EXPECTED.end) <= SILENCE_EXPECTED.tol);
        si.expectedSilenceFound = !!hit;
        si.expectedSilence = hit || null;
        si.ok = !!hit && Math.abs((j.audioDurationSec || 0) - 6) < 0.2;
        if (!si.ok) si.error = `không tìm thấy khoảng lặng [${SILENCE_EXPECTED.start}, ${SILENCE_EXPECTED.end}] (±${SILENCE_EXPECTED.tol}s) trong ${JSON.stringify(j.silences)}; audioDurationSec=${j.audioDurationSec}`;
        log(`Silence: ${si.ok ? "PASS" : "FAIL"} ${(si.ms / 1000).toFixed(1)}s, count=${j.count}, silences=${JSON.stringify(j.silences)}, keep=${JSON.stringify(j.keep)}`);
      }
    }
  } catch (e) { si.error = `${e.name}: ${e.message}`.slice(0, 500); }
  if (!si.ok) log(`Silence FAIL: ${si.error || "?"}`);
  report.steps.silence = si;
  sampleResources("after-silence");

  // --- 5. Scene: clip ghép 4s, cắt cứng tại 2.0s ------------------------------
  const sc = { ok: false };
  try {
    const form = new FormData();
    form.append("media", new Blob([fs.readFileSync(sceneClip)], { type: "video/mp4" }), "scene-test.mp4");
    form.append("threshold", "0.4");
    const t0 = Date.now();
    const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/scene`, {
      method: "POST", body: form, signal: AbortSignal.timeout(600_000),
    });
    sc.httpStatus = res.status;
    if (res.status !== 200) {
      sc.error = `HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`;
    } else {
      const stream = await readNdjsonStream(res, 600_000, "scene");
      sc.ms = Date.now() - t0;
      sc.events = stream.events.map((e) => ({ type: e.type, phase: e.phase, done: e.done, total: e.total, message: (e.message || e.error || "").slice(0, 200) }));
      if (stream.error) sc.error = JSON.stringify(stream.error).slice(0, 500);
      else if (!stream.done) sc.error = "stream kết thúc mà không có event done";
      else {
        sc.cuts = stream.done.cuts; sc.duration = stream.done.duration;
        sc.threshold = stream.done.threshold; sc.count = stream.done.count;
        const hit = (sc.cuts || []).find((c) => {
          const t = typeof c === "number" ? c : (c.time ?? c.start ?? c.timestamp);
          return Number.isFinite(t) && Math.abs(t - SCENE_EXPECTED_CUT) <= SCENE_CUT_TOL;
        });
        sc.expectedCutFound = !!hit;
        sc.expectedCut = hit ?? null;
        sc.ok = !!hit && Math.abs((sc.duration || 0) - 4) < 0.2;
        if (!sc.ok) sc.error = `không tìm thấy cut gần ${SCENE_EXPECTED_CUT}s (±${SCENE_CUT_TOL}s) trong cuts=${JSON.stringify(sc.cuts)}; duration=${sc.duration}`;
        log(`Scene: ${sc.ok ? "PASS" : "FAIL"} ${(sc.ms / 1000).toFixed(1)}s, count=${sc.count}, cuts=${JSON.stringify(sc.cuts)}, duration=${sc.duration}s`);
      }
    }
  } catch (e) { sc.error = `${e.name}: ${e.message}`.slice(0, 500); }
  if (!sc.ok) log(`Scene FAIL: ${sc.error || "?"}`);
  report.steps.scene = sc;
  sampleResources("after-scene");

  // --- 6. Bgremove birefnet-general: clip 1s, session mặc định ----------------
  const bg = { ok: false };
  try {
    const form = new FormData();
    form.append("media", new Blob([fs.readFileSync(clip1s)], { type: "video/mp4" }), "clip-1s.mp4");
    form.append("session", "birefnet-general");
    const t0 = Date.now();
    const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/bgremove`, {
      method: "POST", body: form, signal: AbortSignal.timeout(1_800_000),
    });
    bg.httpStatus = res.status;
    if (res.status !== 200) {
      bg.error = `HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`;
    } else {
      const stream = await readNdjsonStream(res, 1_800_000, "bgremove-birefnet");
      bg.ms = Date.now() - t0;
      bg.events = stream.events.map((e) => ({ type: e.type, phase: e.phase, done: e.done, total: e.total, message: (e.message || e.error || "").slice(0, 200) }));
      if (stream.error) bg.error = JSON.stringify(stream.error).slice(0, 500);
      else if (!stream.done) bg.error = "stream kết thúc mà không có event done";
      else if (!stream.done.downloadUrl) bg.error = "done nhưng không có downloadUrl";
      else {
        bg.sessionUsed = stream.done.sessionUsed;
        bg.fallbackFrom = stream.done.fallbackFrom;
        bg.fallbackReason = stream.done.fallbackReason || null;
        // Birefnet fail → bridge tự fallback u2net: đó là FAIL cho job này
        // (job chạy được nhưng KHÔNG phải birefnet — không được nhận vơ).
        if (bg.sessionUsed !== "birefnet-general" || bg.fallbackFrom) {
          bg.error = `session dùng thật là "${bg.sessionUsed}" (fallback từ ${bg.fallbackFrom || "?"}) — KHÔNG phải birefnet-general; lý do: ${bg.fallbackReason || "?"}`;
        } else {
          const movPath = path.join(OUT, "clip-1s_no_bg_birefnet.mov");
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
            bg.fps = bg.duration ? +(30 / (bg.ms / 1000)).toFixed(2) : null; // 30 frame / thời gian
            // Phân tích alpha frame giữa (frame 15) bằng PIL.
            const framePng = path.join(OUT, "birefnet-frame15.png");
            const ext = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", movPath, "-vf", "select=eq(n\\,15)", "-frames:v", "1", framePng], { encoding: "utf8", timeout: 60000 });
            if (ext.status === 0 && fs.existsSync(framePng)) bg.alphaFrame15 = analyzeAlphaPng(framePng);
            else bg.alphaFrame15 = { ok: false, error: "không trích được frame 15" };
          } else bg.error = probe.error;
          bg.ok = probe.ok && size > 1000 && bg.hasAlpha && (bg.framesRead ?? 0) >= 28 && bg.sessionUsed === "birefnet-general" && !bg.fallbackFrom;
          if (!bg.ok && !bg.error) bg.error = `hasAlpha=${bg.hasAlpha} pixFmt=${bg.pixFmt} framesRead=${bg.framesRead} size=${size}`;
          log(`Bgremove-birefnet: ${bg.ok ? "PASS" : "FAIL"} ${(bg.ms / 1000).toFixed(1)}s, session=${bg.sessionUsed}, mov ${size} byte, duration=${bg.duration}s, codec=${bg.codec}, pixFmt=${bg.pixFmt}, frames=${bg.framesRead}, ~${bg.fps} fps, alpha frame15=${JSON.stringify(bg.alphaFrame15)}`);
        }
      }
    }
  } catch (e) { bg.error = `${e.name}: ${e.message}`.slice(0, 500); }
  if (!bg.ok) log(`Bgremove-birefnet FAIL: ${bg.error || "?"}`);
  report.steps.bgremoveBirefnet = bg;
  sampleResources("after-bgremove-birefnet");

  const all = report.steps.reframe.ok && report.steps.translate.ok && report.steps.silence.ok && report.steps.scene.ok && report.steps.bgremoveBirefnet.ok;
  finish(all ? 0 : 1);
}

function finish(code) {
  report.allPass = code === 0;
  report.finishedAt = nowIso();
  // Dọn app + Xvfb, verify bridge chết thật.
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
    const s = report.steps;
    log(`KẾT QUẢ: Reframe=${s.reframe?.ok ? "PASS" : "FAIL"} Translate=${s.translate?.ok ? "PASS" : "FAIL"} Silence=${s.silence?.ok ? "PASS" : "FAIL"} Scene=${s.scene?.ok ? "PASS" : "FAIL"} BgremoveBirefnet=${s.bgremoveBirefnet?.ok ? "PASS" : "FAIL"} → ${report.allPass ? "ALL PASS" : "CÓ FAIL"}`);
    process.exitCode = code;
  }, 3000);
}

main().catch((e) => { console.error("lỗi chết script:", e); try { finish(1); } catch { process.exit(1); } });
