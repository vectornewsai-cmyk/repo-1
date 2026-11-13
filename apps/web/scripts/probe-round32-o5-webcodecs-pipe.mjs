#!/usr/bin/env node
/**
 * Phase 9 đợt 32, luồng O5 — spike WebCodecs ở tầng harness, KHÔNG sửa app.
 * Mục đích: trả lời bằng số đo (không claim sản phẩm) rằng VideoDecoder có
 * đủ sức đưa phát ngược lên 30 fps thật hay không, và seek GOP thưa còn là
 * bottleneck không.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/probe-round32-o5-webcodecs-pipe.mjs
 * Biến môi trường: O5_SCRATCH (mặc định ~/workspace/tmp-round32-o5/wc),
 * O5_DISPLAY (mặc định :96), O5_PORT (mặc định 4196).
 * Scratch phải chứa sẵn sparse.h264 / dense.h264 (ffmpeg -c copy -bsf
 * h264_mp4toannexb từ fixture MP4 — xem LIMITS O5). Script KHÔNG tự tạo
 * fixture, KHÔNG build app, KHÔNG sửa code sản phẩm, KHÔNG push.
 *
 * GIỚI HẠN TRUNG THỰC của spike này (đọc trước khi trích số):
 * - Chunk KHÔNG qua demux MP4 trong browser: dữ liệu Annex B do ffmpeg
 *   chuẩn bị offline, script chỉ parse NAL + đóng gói AVCC trong trang.
 *   Demux MP4 thật (đọc moov/avcC/sample table) vẫn CHƯA xây, chưa đo.
 * - Fixture là video phẳng (flat gray ramp) như đợt 31 N2: decode rẻ hơn
 *   footage nhiễu/thật nên decode fps đo được là CẬN TRÊN, không phải số
 *   cho footage thật.
 * - Present ngược đo bằng ctx.drawImage lên canvas 2D (readback), không
 *   phải compositor overlay của player thật — chỉ để ước lượng bậc độ lớn.
 * - VideoDecoder không tiết lộ có dùng hardware accel thật hay không, dù
 *   isConfigSupported(prefer-hardware) trả true.
 *
 * Thoát mã: 0 = probe chạy xong, có kết quả JSON; 2 = blocker hạ tầng.
 * Kết quả JSON: <scratch>/wc-result.json (parent quyết có stage không).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

// Phase 9 đợt 32 P3 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs):
// probe này không có snapshotDist nên bundle giữ null (snapshot vẫn ghi
// proc/ps). outDir bền ngoài repo, ngoài /tmp (mẫu đợt 32 O2): SCRATCH
// của probe là thư mục tạm tmp-round32-o5 nên KHÔNG dùng làm nơi ghi
// snapshot treo.
let HANG_BUNDLE = null;
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "probe-round32-o5-webcodecs-pipe");

const SCRATCH = process.env.O5_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round32-o5", "wc");
const DISPLAY = process.env.O5_DISPLAY || ":96";
const PORT = Number(process.env.O5_PORT || 4196);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.K4_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log(`[${stamp()}]`, ...a); }
function fail(msg) { console.error(`BLOCKER: ${msg}`); process.exit(2); }

function serveDir(dir) {
  return http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(dir, url === "/" ? "index.html" : url.replace(/^\//, ""));
    if (!file.startsWith(dir) || !fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    const type = file.endsWith(".html") ? "text/html" : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Content-Length": fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  });
}

// --- CDP pipe tối thiểu (mẫu J6/N2, chỉ đủ cho probe này) ---
class PipeCdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 1; this.pending = new Map(); this.sessionId = null; this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) this.sessionId = msg.params.sessionId;
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id); this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
    for (const s of [1, 2, 3, 4]) { try { proc.stdio[s]?.on("error", () => {}); } catch {} }
    proc.on("error", () => {});
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 60000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({
            proc: this.proc, pendingCount: this.pending.size, method, timeoutMs,
            outDir: CDP_HANG_OUT_DIR, bundle: HANG_BUNDLE,
            extra: { display: DISPLAY, port: PORT },
          });
          if (hangSnap.file) log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
          else log(`CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`);
        } catch (e) { log(`CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); }
        reject(new Error(`CDP timeout ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); } catch (e) { this.pending.delete(id); clearTimeout(timer); reject(e); }
    });
  }
  async evaluate(expr, sessionId) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId, 120000);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result?.value;
  }
}

// --- Probe chạy trong trang (string, evaluate qua CDP) ---
const PROBE_JS = String.raw`
(async () => {
  const prog = (st) => { try { window.__wcProgress = st; } catch {} };
  prog("start");
  const out = { errors: [], support: {}, single: null, sparse: null, dense: null, mem: null };
  const pct = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  try {
    out.hasVideoDecoder = typeof VideoDecoder !== "undefined";
    if (!out.hasVideoDecoder) { window.__wcResult = out; return "no-decoder"; }
    const codecs = ["avc1.64001F", "avc1.64001f", "avc1.4D401F", "avc1.42001F"];
    for (const c of codecs) {
      for (const accel of ["prefer-hardware", "prefer-software"]) {
        try {
          const r = await VideoDecoder.isConfigSupported({ codec: c, codedWidth: 1280, codedHeight: 720, hardwareAcceleration: accel });
          out.support[c + "/" + accel] = !!r.supported;
        } catch (e) { out.support[c + "/" + accel] = "error:" + String(e && e.message || e); }
      }
    }
    // Parse Annex B -> frames (slice grouping theo first_mb_in_slice == 0).
    function parseAnnexB(buf) {
      const bytes = new Uint8Array(buf); const nals = []; let i = 0;
      while (i < bytes.length - 3) {
        let sc = -1, scLen = 0;
        if (bytes[i] === 0 && bytes[i + 1] === 0 && bytes[i + 2] === 1) { sc = i; scLen = 3; }
        else if (i + 3 < bytes.length && bytes[i] === 0 && bytes[i + 1] === 0 && bytes[i + 2] === 0 && bytes[i + 3] === 1) { sc = i; scLen = 4; }
        if (sc < 0) { i++; continue; }
        let j = sc + scLen;
        while (j < bytes.length - 2) {
          if (bytes[j] === 0 && bytes[j + 1] === 0 && (bytes[j + 2] === 1 || (j + 3 < bytes.length && bytes[j + 2] === 0 && bytes[j + 3] === 1))) break;
          j++;
        }
        nals.push(bytes.subarray(sc + scLen, j)); i = j;
      }
      return nals;
    }
    function rbsp(nal) { // bỏ emulation prevention 00 00 03
      const r = []; for (let k = 1; k < nal.length; k++) { if (k + 1 < nal.length && nal[k] === 0 && nal[k + 1] === 0 && nal[k + 2] === 3) { r.push(0, 0); k += 2; } else r.push(nal[k]); } return r;
    }
    function firstMb(rbspBytes) { // đọc ue(v) đầu slice header
      let bit = 0; const getBit = () => { const b = (rbspBytes[bit >> 3] >> (7 - (bit & 7))) & 1; bit++; return b; };
      let zeros = 0; while (getBit() === 0) { zeros++; if (zeros > 31) return -1; }
      let val = 1; for (let k = 0; k < zeros; k++) val = (val << 1) | getBit();
      return val - 1;
    }
    function toFrames(nals) {
      let sps = null, pps = null; const frames = []; let cur = null;
      const pushFrame = () => { if (cur && cur.slices.length) frames.push(cur); cur = null; };
      for (const nal of nals) {
        const type = nal[0] & 31;
        if (type === 7) { sps = nal; continue; }
        if (type === 8) { pps = nal; continue; }
        if (type === 1 || type === 5) {
          const mb = firstMb(rbsp(nal));
          if (mb === 0 && cur && cur.slices.length) pushFrame();
          if (!cur) cur = { slices: [], key: false };
          if (type === 5) cur.key = true;
          cur.slices.push(nal);
        }
      }
      pushFrame();
      return { sps, pps, frames };
    }
    function avcc(sps, pps) {
      const b = [1, sps[1], sps[2], sps[3], 0xFF, 0xE1,
        (sps.length >> 8) & 255, sps.length & 255, ...sps, 1, (pps.length >> 8) & 255, pps.length & 255, ...pps];
      return new Uint8Array(b);
    }
    function toChunk(frame, idx) {
      let total = 0; for (const s of frame.slices) total += 4 + s.length;
      const data = new Uint8Array(total); let off = 0;
      for (const s of frame.slices) {
        data[off] = (s.length >> 24) & 255; data[off + 1] = (s.length >> 16) & 255; data[off + 2] = (s.length >> 8) & 255; data[off + 3] = s.length & 255;
        data.set(s, off + 4); off += 4 + s.length;
      }
      return new EncodedVideoChunk({ type: frame.key ? "key" : "delta", timestamp: idx * 33333, data });
    }
    async function decodeRange(parsed, count, label) {
      const frames = parsed.frames.slice(0, count);
      const desc = avcc(parsed.sps, parsed.pps);
      const decoded = []; const queueT = []; const outT = [];
      let err = null; let resolveDone; const done = new Promise((r) => { resolveDone = r; });
      const dec = new VideoDecoder({
        output: (f) => { outT.push(performance.now()); decoded.push(f); if (decoded.length === frames.length) resolveDone(); },
        error: (e) => { err = String(e && e.message || e); resolveDone(); },
      });
      try { dec.configure({ codec: "avc1.64001F", codedWidth: 1280, codedHeight: 720, description: desc, hardwareAcceleration: "prefer-software" }); }
      catch (e) { return { label, framesRequested: frames.length, framesDecoded: 0, error: "configure: " + String(e && e.message || e) }; }
      const t0 = performance.now();
      frames.forEach((fr, i) => { queueT.push(performance.now()); dec.decode(toChunk(fr, i)); });
      try { await dec.flush(); } catch {}
      await Promise.race([done, new Promise((r) => setTimeout(() => { out.errors.push(label + " decode stall >60s"); r(); }, 60000))]);
      const t1 = performance.now();
      const lat = queueT.map((q, i) => outT[i] != null ? outT[i] - q : null).filter((v) => v != null);
      const wallSec = (t1 - t0) / 1000;
      // Present ngược: drawImage từng frame theo thứ tự ngược lên canvas 2D.
      const canvas = document.createElement("canvas"); canvas.width = 1280; canvas.height = 720;
      const ctx = canvas.getContext("2d");
      const pt0 = performance.now();
      for (let i = decoded.length - 1; i >= 0; i--) { try { ctx.drawImage(decoded[i], 0, 0); } catch (e) { out.errors.push(label + " drawImage: " + String(e)); break; } }
      const pt1 = performance.now();
      const presentSec = (pt1 - pt0) / 1000;
      const frameBytes = 1280 * 720 * 3 / 2;
      const res = { label, framesRequested: frames.length, framesDecoded: decoded.length, decodeWallSec: +wallSec.toFixed(3),
        decodeFps: +(frames.length / wallSec).toFixed(1), latP50ms: lat.length ? +pct(lat, 0.5).toFixed(2) : null,
        latP95ms: lat.length ? +pct(lat, 0.95).toFixed(2) : null, latMaxMs: lat.length ? +Math.max(...lat).toFixed(2) : null,
        presentReverseSec: +presentSec.toFixed(3), presentReverseFps: +(decoded.length / presentSec).toFixed(1),
        cacheBytesOneGop: frameBytes * decoded.length, error: err };
      decoded.forEach((f) => { try { f.close(); } catch {} });
      return res;
    }
    async function loadFile(name) {
      const r = await fetch("/" + name); const buf = await r.arrayBuffer();
      const nals = parseAnnexB(buf); const parsed = toFrames(nals);
      return { name, bytes: buf.byteLength, nalCount: nals.length, frameCount: parsed.frames.length, parsed };
    }
    prog("support-done");
    if (performance.memory) out.mem = { jsHeapUsedMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1), jsHeapTotalMB: +(performance.memory.totalJSHeapSize / 1048576).toFixed(1) };
    const sparse = await loadFile("sparse.h264"); prog("sparse-loaded:" + sparse.frameCount);
    const dense = await loadFile("dense.h264"); prog("dense-loaded:" + dense.frameCount);
    out.files = { sparse: { bytes: sparse.bytes, nalCount: sparse.nalCount, frameCount: sparse.frameCount },
      dense: { bytes: dense.bytes, nalCount: dense.nalCount, frameCount: dense.frameCount } };
    // Latency 1 chunk đơn: decoder riêng, 1 keyframe chunk.
    {
      const desc = avcc(sparse.parsed.sps, sparse.parsed.pps);
      let resolveOut; const got = new Promise((r) => { resolveOut = r; });
      const dec = new VideoDecoder({ output: () => resolveOut(), error: (e) => { out.errors.push("single: " + String(e && e.message || e)); resolveOut(); } });
      try { dec.configure({ codec: "avc1.64001F", codedWidth: 1280, codedHeight: 720, description: desc, hardwareAcceleration: "prefer-software" }); prog("single-configured:state=" + dec.state); }
      catch (e) { out.errors.push("single configure: " + String(e && e.message || e)); prog("single-configure-failed"); }
      const t0 = performance.now(); try { dec.decode(toChunk(sparse.parsed.frames[0], 0)); prog("single-decode-queued:state=" + dec.state); } catch (e) { out.errors.push("single decode: " + String(e && e.message || e)); prog("single-decode-threw"); }
      await Promise.race([got, new Promise((r) => setTimeout(() => { out.errors.push("single timeout 20s, decoder.state=" + dec.state); r(); }, 20000))]); const t1 = performance.now();
      try { await dec.flush(); } catch {} const t2 = performance.now();
      out.single = { queueToOutputMs: +(t1 - t0).toFixed(2), flushWallMs: +(t2 - t0).toFixed(2) };
      try { dec.close(); } catch {}
    }
    prog("single-done");
    // GOP thưa = 300 frame; GOP dày = 30 frame -> decode 1 GOP thưa + 3 GOP dày.
    out.sparse = await decodeRange(sparse.parsed, 300, "sparse-1gop"); prog("sparse-decoded:" + JSON.stringify(out.sparse && out.sparse.framesDecoded));
    out.dense = await decodeRange(dense.parsed, 90, "dense-3gop"); prog("dense-decoded:" + JSON.stringify(out.dense && out.dense.framesDecoded));
    if (performance.memory) out.memAfter = { jsHeapUsedMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) };
  } catch (e) { out.errors.push(String(e && e.stack || e)); }
  window.__wcResult = out;
  return "done";
})()`;

async function main() {
  for (const f of ["sparse.h264", "dense.h264"]) if (!fs.existsSync(path.join(SCRATCH, f))) fail(`thiếu fixture ${f} trong ${SCRATCH}`);
  writeFileEpermRetry(path.join(SCRATCH, "index.html"), `<!doctype html><meta charset="utf-8"><title>wc probe</title><body>probe</body>`);
  const server = serveDir(SCRATCH);
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  log(`phục vụ probe tại ${ORIGIN}`);
  const num = DISPLAY.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch {}
    if (!alive) {
      log(`Xvfb: socket ${DISPLAY} mồ côi, xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch {}
      try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
    } else log(`Xvfb: dùng chung display ${DISPLAY}`);
  }
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) fail(`Xvfb không tạo socket ${DISPLAY}`);
  }
  const profile = path.join(SCRATCH, "chrome-profile");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeBin = BINARIES.find((b) => fs.existsSync(b));
  if (!chromeBin) fail(`không tìm thấy chrome: ${BINARIES.join(", ")}`);
  log(`chrome: ${chromeBin} (display ${DISPLAY})`);
  const chrome = spawn(chromeBin, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${profile}`, "--window-size=1280,800", "--window-position=0,0", "about:blank"], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
  chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
  const cdp = new PipeCdp(chrome);
  chrome.on("exit", (code, sig) => { if (!cdp.sessionId) log(`chrome thoát trước khi có sessionId: code=${code} sig=${sig}`); });
  const cleanup = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} server.close(); };
  process.on("exit", cleanup);
  await cdp.send("Target.getTargets", {}, undefined, 30000);
  const target = await cdp.send("Target.createTarget", { url: "about:blank" });
  await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
  if (!cdp.sessionId) fail("không nhận được sessionId");
  await cdp.send("Page.enable", {}, cdp.sessionId);
  await cdp.send("Runtime.enable", {}, cdp.sessionId);
  await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
  await sleep(1500);
  // Fire-and-poll: probe chạy async dài trên trang; evaluate có awaitPromise
  // sẽ treo tới 120 s nếu probe kẹt nên bắn không chờ rồi poll tiến độ.
  await cdp.send("Runtime.evaluate", { expression: `(${PROBE_JS})`, returnByValue: false, awaitPromise: false }, cdp.sessionId, 30000);
  log("probe fired (poll tiến độ)"); 
  let result = null;
  for (let i = 0; i < 120 && !result; i++) {
    await sleep(2500);
    const prog = await cdp.evaluate(`window.__wcProgress || null`, cdp.sessionId).catch(() => null);
    if (prog) log(`probe tiến độ: ${prog}`);
    result = await cdp.evaluate(`window.__wcResult || null`, cdp.sessionId).catch(() => null);
  }
  if (!result) fail("probe không trả kết quả sau 300s");
  writeFileEpermRetry(path.join(SCRATCH, "wc-result.json"), JSON.stringify(result, null, 2));
  log("KẾT QUẢ: " + JSON.stringify(result));
  cleanup();
  process.exit(0);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
