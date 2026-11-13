#!/usr/bin/env node
/**
 * e2e-ship-services.mjs — Phase 9 đợt 84, luồng L7: SHIP SERVICES E2E.
 *
 * Kiểm chứng end-to-end các dịch vụ AI trong AppImage VCut Studio ĐÃ ĐÓNG
 * GÓI (profile full, K7 build lại đợt 83) — không chỉ probe available mà
 * chạy JOB THẬT qua bridge của chính gói đó, rồi verify output thật trên
 * đĩa bằng ffprobe/đọc file (không tin log "ok" suông).
 *
 * Job (thứ tự có chủ đích — TTS tạo ra clip giọng nói thật làm đầu vào
 * caption, nên caption được kiểm chứng bằng text đã biết trước):
 *   1. TTS: 1 câu tiếng Việt ngắn (giọng mặc định) → WAV thật.
 *   2. Caption: faster-whisper trên chính file WAV TTS vừa tạo → segment
 *      có timestamp + text khớp câu đã đọc (kiểm tra fuzzy theo từ khóa).
 *   3. Bgremove: clip 2s (cắt từ clip1.mp4 mẫu), session=u2net → .mov thật,
 *      verify có kênh alpha + đủ frame.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/desktop/scripts/e2e-ship-services.mjs
 * Env: L7_APPIMAGE (mặc định ~/workspace/tmp-j8-electron/ship/ship-full/
 *   vcut-studio-0.1.0-x86_64.AppImage — build K7 đợt 83),
 *   L7_EXPECTED_SHA (mặc định sha256 của AppImage K7),
 *   L7_WORK (mặc định ~/workspace/tmp-l7-ship-e2e),
 *   L7_DISPLAY (mặc định 98), L7_BRIDGE_PORT (8787), L7_CDP_PORT (9223),
 *   L7_MODELS_DIR (mặc định ~/workspace/tmp-j8-electron/ship/models),
 *   L7_CLIP (mặc định server/render/examples/media/clip1.mp4).
 * Exit 0 khi cả 3 job PASS, 1 khi có FAIL (vẫn ghi report + dọn sạch app).
 *
 * KHÔNG sửa code production, KHÔNG build lại, KHÔNG push. Chỉ đọc AppImage
 * có sẵn + ghi report/output vào L7_WORK (ngoài repo).
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
const WORK = process.env.L7_WORK || path.join(HOME, "workspace", "tmp-l7-ship-e2e");
const APPIMAGE = process.env.L7_APPIMAGE
  || path.join(HOME, "workspace", "tmp-j8-electron", "ship", "ship-full", "vcut-studio-0.1.0-x86_64.AppImage");
const EXPECTED_SHA = process.env.L7_EXPECTED_SHA
  || "0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c";
const MODELS_DIR = process.env.L7_MODELS_DIR
  || path.join(HOME, "workspace", "tmp-j8-electron", "ship", "models");
const CLIP = process.env.L7_CLIP
  || path.join(ROOT, "server", "render", "examples", "media", "clip1.mp4");
let DISPLAY_NUM = Number(process.env.L7_DISPLAY || 0); // 0 = tự chọn display trống (tránh đụng luồng khác)
let BRIDGE_PORT = Number(process.env.L7_BRIDGE_PORT || 0); // 0 = tự chọn cổng trống
let CDP_PORT = Number(process.env.L7_CDP_PORT || 0);
const USERDATA = path.join(WORK, "userdata");
const TMP_RUN = path.join(WORK, "tmp-run");
const OUT = path.join(WORK, "outputs");
const REPORT = path.join(WORK, "e2e-report.json");
const LOGF = path.join(WORK, "e2e-run.log");

const TTS_TEXT = "Xin chào. Đây là video thử nghiệm của VCut Studio. Chúng ta đang kiểm chứng giọng đọc tiếng Việt ngay trong ứng dụng đã đóng gói.";
const TTS_KEYWORDS = ["xin chào", "thử nghiệm", "vcut", "giọng đọc", "tiếng việt"];

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
        if (/vcut|electron|faster_whisper|caption\.py|bgremove\.py|tts\.py|rembg|onnxruntime/i.test(line)
          && !/ps -eo|grep|e2e-ship-services/.test(line)) {
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
      // App chết sớm (vd: mất X server) — fail nhanh thay vì chờ hết 600s.
      let tail = "";
      try {
        const log = fs.readFileSync(path.join(WORK, "app-stdout.log"), "utf8");
        const lines = log.split("\n").filter((l) => /ERROR|error|Missing X|failed|FATAL/i.test(l) && !/appimage_extracted/.test(l));
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
/** Đọc stream NDJSON tới khi gặp done/error; trả {events, done, error, ms}.
 * Dùng for-await trên res.body (KHÔNG race reader.read() với timeout từng
 * lần đọc: mỗi lần race thua sẽ để lại một read() đang chờ mồ côi, chunk
 * tới sẽ bị read mồ côi nuốt mất — lỗi này đã làm mất event done của TTS
 * ở lần chạy đầu dù job thật đã xong và WAV đã tải được qua token).
 * Timeout tổng vẫn có nhờ AbortSignal.timeout ở fetch của caller + deadline
 * kiểm tra sau mỗi chunk. */
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

const report = {
  tool: "e2e-ship-services.mjs (L7, đợt 84)",
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

async function main() {
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(TMP_RUN, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  log(`L7 E2E ship services — AppImage=${APPIMAGE}`);
  log(`WORK=${WORK} DISPLAY=:${DISPLAY_NUM} bridge=${BRIDGE_PORT} cdp=${CDP_PORT}`);

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
  // (cổng/display chọn động ở bước sau — preflight chỉ kiểm tra cổng khi
  // user ép bằng env; 0 = tự chọn nên bỏ qua.)
  for (const [name, port] of [["bridge port", BRIDGE_PORT], ["cdp port", CDP_PORT]]) {
    if (port && !(await portFree(port))) { pre.ok = false; pre.notes.push(`${name} ${port}: BẬN`); }
  }
  try {
    writeFileEpermRetry(path.join(WORK, "wave-probe.txt"), "x".repeat(500));
    const sz = fs.statSync(path.join(WORK, "wave-probe.txt")).size;
    if (sz !== 500) { pre.ok = false; pre.notes.push(`EPERM? ghi node ra ${sz} byte thay vì 500`); }
    else pre.notes.push("ghi node OK (sóng EPERM đang tắt)");
  } catch (e) { pre.ok = false; pre.notes.push(`ghi node fail: ${e.message}`); }
  for (const bin of ["ffmpeg", "ffprobe", "Xvfb"]) {
    const r = spawnSync("which", [bin], { encoding: "utf8" });
    if (r.status !== 0) { pre.ok = false; pre.notes.push(`thiếu binary ${bin}`); }
  }
  if (!fs.existsSync(CLIP)) { pre.ok = false; pre.notes.push(`không thấy clip mẫu ${CLIP}`); }
  if (!fs.existsSync(MODELS_DIR)) { pre.ok = false; pre.notes.push(`không thấy models dir ${MODELS_DIR}`); }
  report.steps.preflight = pre;
  log(`preflight: ${pre.ok ? "OK" : "FAIL"} — ${pre.notes.join("; ")}`);
  if (!pre.ok) { finish(1); return; }

  // Cắt clip 2s cho bgremove (240 frame full 8s ở ~0,43fps u2net ≈ 9 phút —
  // quá dài cho 1 job kiểm chứng; 60 frame ≈ 2–3 phút vẫn là job thật).
  const clip2s = path.join(OUT, "clip-2s.mp4");
  const trim = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", CLIP, "-t", "2", "-c", "copy", clip2s], { encoding: "utf8", timeout: 60000 });
  const clip2sProbe = ffprobeJson(clip2s);
  const clip2sOk = trim.status === 0 && clip2sProbe.ok && Number(clip2sProbe.data.format.duration) >= 1.9;
  report.steps.trimClip = { ok: clip2sOk, file: clip2s, duration: clip2sProbe.ok ? clip2sProbe.data.format.duration : null };
  log(`trim clip 2s: ${clip2sOk ? "OK" : "FAIL"} duration=${report.steps.trimClip.duration}`);
  if (!clip2sOk) { finish(1); return; }

  // Chọn display / cổng trống động (nhiều luồng đợt 84 chạy song song trên
  // cùng VM: 8787 đã bị luồng khác chiếm ở lượt 2; display :98 mất Xvfb
  // ở lượt 2 nên phải verify Xvfb sống thật trước khi spawn app).
  const pickDisplay = () => {
    for (let n = 90; n <= 99; n++) {
      if (fs.existsSync(`/tmp/.X${n}-lock`) || fs.existsSync(`/tmp/.X11-unix/X${n}`)) continue;
      return n;
    }
    return null;
  };
  const pickPort = async (from, to) => {
    for (let p = from; p <= to; p++) { if (await portFree(p)) return p; }
    return null;
  };
  if (!DISPLAY_NUM) DISPLAY_NUM = pickDisplay();
  if (!BRIDGE_PORT) BRIDGE_PORT = await pickPort(8787, 8796);
  if (!CDP_PORT) CDP_PORT = await pickPort(9223, 9232);
  report.steps.pickResources = { display: DISPLAY_NUM, bridgePort: BRIDGE_PORT, cdpPort: CDP_PORT };
  log(`chọn tài nguyên: DISPLAY=:${DISPLAY_NUM} bridge=${BRIDGE_PORT} cdp=${CDP_PORT}`);
  if (!DISPLAY_NUM || !BRIDGE_PORT || !CDP_PORT) { log("FAIL: không còn display/cổng trống"); finish(1); return; }

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
  log(`đã spawn AppImage pid=${app.pid} (Xvfb :${DISPLAY_NUM}), chờ bridge healthy…`);
  const healthy = await waitBridgeHealthy(600_000, BRIDGE_PORT);
  report.steps.launch = { ok: healthy.ok, msToHealthy: healthy.ms, pid: app.pid, detail: healthy.ok ? healthy.body : healthy.lastErr };
  log(`bridge healthy: ${healthy.ok ? `OK sau ${(healthy.ms / 1000).toFixed(1)}s` : `FAIL sau ${(healthy.ms / 1000).toFixed(1)}s — ${healthy.lastErr}`}`);
  if (!healthy.ok) { finish(1); return; }
  sampleResources("bridge-healthy");
  report.resources.push(sampleResources("bridge-healthy"));

  // --- 2. TTS (tạo giọng nói thật → làm đầu vào caption) ------------------
  const tts = { ok: false };
  try {
    const voices = await httpJson(`http://127.0.0.1:${BRIDGE_PORT}/api/tts/voices`, 15000);
    tts.voicesStatus = voices.status;
    tts.voices = voices.json?.voices?.slice(0, 3);
    log(`GET /api/tts/voices: HTTP ${voices.status}, ví dụ: ${JSON.stringify(tts.voices)}`);
    const t0 = Date.now();
    const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: TTS_TEXT }),
      signal: AbortSignal.timeout(600_000),
    });
    tts.httpStatus = res.status;
    if (res.status !== 200) {
      tts.error = `HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`;
    } else {
      const stream = await readNdjsonStream(res, 600_000, "tts");
      tts.ms = Date.now() - t0;
      tts.events = stream.events.map((e) => ({ type: e.type, phase: e.phase, done: e.done, total: e.total, downloadUrl: e.downloadUrl ? "có" : undefined, message: (e.message || e.error || "").slice(0, 200) }));
      if (stream.error) tts.error = JSON.stringify(stream.error).slice(0, 500);
      else if (!stream.done) tts.error = "stream kết thúc mà không có event done";
      else if (!stream.done.downloadUrl) tts.error = "done nhưng không có downloadUrl";
      else {
        const wavPath = path.join(OUT, "tts.wav");
        const size = await downloadTo(`http://127.0.0.1:${BRIDGE_PORT}${stream.done.downloadUrl}`, wavPath);
        const probe = ffprobeJson(wavPath);
        tts.file = wavPath; tts.size = size;
        tts.duration = probe.ok ? Number(probe.data.format.duration) : null;
        tts.codec = probe.ok ? probe.data.streams?.[0]?.codec_name : null;
        tts.sampleRate = probe.ok ? probe.data.streams?.[0]?.sample_rate : null;
        tts.probeOk = probe.ok;
        tts.realtime = tts.duration ? +(tts.duration / (tts.ms / 1000)).toFixed(2) : null;
        tts.ok = probe.ok && size > 1000 && tts.duration > 1;
        if (!probe.ok) tts.error = probe.error;
        log(`TTS: ${tts.ok ? "PASS" : "FAIL"} ${(tts.ms / 1000).toFixed(1)}s, wav ${size} byte, duration=${tts.duration}s, codec=${tts.codec}, realtime=${tts.realtime}x`);
      }
    }
  } catch (e) { tts.error = `${e.name}: ${e.message}`.slice(0, 500); }
  if (!tts.ok) log(`TTS FAIL: ${tts.error || "?"}`);
  report.steps.tts = tts;
  sampleResources("after-tts");

  // --- 3. Caption trên chính WAV TTS ---------------------------------------
  const cap = { ok: false };
  if (tts.ok) {
    try {
      const form = new FormData();
      form.append("media", new Blob([fs.readFileSync(tts.file)], { type: "audio/wav" }), "tts.wav");
      form.append("lang", "vi");
      const t0 = Date.now();
      const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/caption`, {
        method: "POST", body: form, signal: AbortSignal.timeout(900_000),
      });
      cap.httpStatus = res.status;
      if (res.status !== 200) {
        cap.error = `HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`;
      } else {
        const stream = await readNdjsonStream(res, 900_000, "caption");
        cap.ms = Date.now() - t0;
        cap.events = stream.events.map((e) => ({ type: e.type, phase: e.phase, done: e.done, total: e.total, message: (e.message || e.error || "").slice(0, 200) }));
        if (stream.error) cap.error = JSON.stringify(stream.error).slice(0, 500);
        else if (!stream.done) cap.error = "stream kết thúc mà không có event done";
        else {
          const segs = stream.done.segments || [];
          cap.count = segs.length;
          cap.language = stream.done.language;
          cap.audioDurationSec = stream.done.audioDurationSec;
          cap.transcribeTimeSec = stream.done.transcribeTimeSec;
          cap.segments = segs;
          // Ghi SRT thật ra đĩa (output kiểm chứng được bằng mắt/file).
          const srt = segs.map((s, i) => {
            const fmt = (t) => { const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = Math.floor(t % 60), ms = Math.round((t % 1) * 1000); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`; };
            return `${i + 1}\n${fmt(s.start)} --> ${fmt(s.end)}\n${s.text}\n`;
          }).join("\n");
          const srtPath = path.join(OUT, "caption.srt");
          writeFileEpermRetry(srtPath, srt);
          cap.srtFile = srtPath;
          cap.srtSize = fs.statSync(srtPath).size;
          // So khớp fuzzy với câu đã đọc (bỏ dấu, so từ khóa).
          const joined = normText(segs.map((s) => s.text).join(" "));
          cap.joinedText = segs.map((s) => s.text).join(" ");
          cap.matchedKeywords = TTS_KEYWORDS.filter((k) => joined.includes(normText(k)));
          const tsOk = segs.every((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.start >= 0 && s.end <= (cap.audioDurationSec || 999) + 0.5 && s.end > s.start);
          cap.timestampsOk = tsOk;
          cap.ok = segs.length > 0 && tsOk && cap.matchedKeywords.length >= 2;
          if (!cap.ok) cap.error = `segments=${segs.length} tsOk=${tsOk} keywords khớp ${cap.matchedKeywords.length}/5 (${cap.matchedKeywords.join(",") || "không có"})`;
          log(`Caption: ${cap.ok ? "PASS" : "FAIL"} ${(cap.ms / 1000).toFixed(1)}s, ${segs.length} segment, lang=${cap.language}, transcribe=${cap.transcribeTimeSec}s, keywords ${cap.matchedKeywords.length}/5`);
          log(`  text nhận được: "${cap.joinedText}"`);
        }
      }
    } catch (e) { cap.error = `${e.name}: ${e.message}`.slice(0, 500); }
  } else { cap.error = "bỏ qua vì TTS FAIL (không có file giọng nói thật)"; }
  if (!cap.ok) log(`Caption FAIL: ${cap.error || "?"}`);
  report.steps.caption = cap;
  sampleResources("after-caption");

  // --- 4. Bgremove u2net trên clip 2s ---------------------------------------
  const bg = { ok: false };
  try {
    const form = new FormData();
    form.append("media", new Blob([fs.readFileSync(clip2s)], { type: "video/mp4" }), "clip-2s.mp4");
    form.append("session", "u2net");
    const t0 = Date.now();
    const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/bgremove`, {
      method: "POST", body: form, signal: AbortSignal.timeout(1_800_000),
    });
    bg.httpStatus = res.status;
    if (res.status !== 200) {
      bg.error = `HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`;
    } else {
      const stream = await readNdjsonStream(res, 1_800_000, "bgremove");
      bg.ms = Date.now() - t0;
      bg.events = stream.events.map((e) => ({ type: e.type, phase: e.phase, done: e.done, total: e.total, message: (e.message || e.error || "").slice(0, 200) }));
      if (stream.error) bg.error = JSON.stringify(stream.error).slice(0, 500);
      else if (!stream.done) bg.error = "stream kết thúc mà không có event done";
      else if (!stream.done.downloadUrl) bg.error = "done nhưng không có downloadUrl";
      else {
        bg.sessionUsed = stream.done.sessionUsed;
        bg.fallbackFrom = stream.done.fallbackFrom;
        const movPath = path.join(OUT, "clip-2s_no_bg.mov");
        const size = await downloadTo(`http://127.0.0.1:${BRIDGE_PORT}${stream.done.downloadUrl}`, movPath);
        const probe = ffprobeJson(movPath);
        bg.file = movPath; bg.size = size;
        bg.probeOk = probe.ok;
        if (probe.ok) {
          const v = probe.data.streams.find((s) => s.codec_type === "video");
          bg.duration = Number(probe.data.format.duration);
          bg.codec = v?.codec_name;
          bg.pixFmt = v?.pix_fmt;
          bg.width = v?.width; bg.height = v?.height;
          bg.nbFrames = v?.nb_frames ? Number(v.nb_frames) : null;
          bg.hasAlpha = /a$/.test(v?.pix_fmt || "") || (v?.pix_fmt || "").includes("yuva") || (v?.pix_fmt || "").includes("rgba") || (v?.pix_fmt || "").includes("argb");
          // Đếm frame thật bằng ffprobe count_frames (đắt nhưng chắc).
          const cnt = spawnSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1", movPath], { encoding: "utf8", timeout: 120000 });
          bg.framesRead = cnt.status === 0 ? Number(cnt.stdout.trim()) : null;
          bg.fps = bg.duration ? +(60 / (bg.ms / 1000)).toFixed(2) : null; // 60 frame / thời gian
        } else bg.error = probe.error;
        bg.ok = probe.ok && size > 1000 && bg.hasAlpha && (bg.framesRead ?? 0) >= 50;
        if (!bg.ok && !bg.error) bg.error = `hasAlpha=${bg.hasAlpha} pixFmt=${bg.pixFmt} framesRead=${bg.framesRead} size=${size}`;
        log(`Bgremove: ${bg.ok ? "PASS" : "FAIL"} ${(bg.ms / 1000).toFixed(1)}s, session=${bg.sessionUsed}, mov ${size} byte, duration=${bg.duration}s, codec=${bg.codec}, pixFmt=${bg.pixFmt}, frames=${bg.framesRead}, ~${bg.fps} fps`);
      }
    }
  } catch (e) { bg.error = `${e.name}: ${e.message}`.slice(0, 500); }
  if (!bg.ok) log(`Bgremove FAIL: ${bg.error || "?"}`);
  report.steps.bgremove = bg;
  sampleResources("after-bgremove");

  finish(report.steps.tts.ok && report.steps.caption.ok && report.steps.bgremove.ok ? 0 : 1);
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
    const bridgeGone = await portFree(BRIDGE_PORT);
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
    log(`KẾT QUẢ: TTS=${s.tts?.ok ? "PASS" : "FAIL"} Caption=${s.caption?.ok ? "PASS" : "FAIL"} Bgremove=${s.bgremove?.ok ? "PASS" : "FAIL"} → ${report.allPass ? "ALL PASS" : "CÓ FAIL"}`);
    process.exitCode = code;
  }, 3000);
}

main().catch((e) => { console.error("lỗi chết script:", e); try { finish(1); } catch { process.exit(1); } });
