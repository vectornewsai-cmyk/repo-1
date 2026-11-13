#!/usr/bin/env node
/**
 * Phase 9 đợt 43, luồng Y5 — phiên Chrome thật tiến gần trần 1000 mẫu
 * per-seek/entry (đóng nợ đợt 42 §5.6: trên Chrome thật max mới 42
 * mẫu/entry, trần 1000 chưa chạm; stress vm fake của X5 chỉ chứng minh
 * logic trần, không phải hành vi Chrome).
 *
 * Ý tưởng (Chrome thật, pipeline media thật, chỉ mạng là chậm — một
 * điều kiện thật ngoài đời, không phải vm fake): video fixture
 * sparse-gop-noise (GOP hiệu dụng 30, ~14 MB/s) được phục vụ qua
 * HTTP Range server nhỏ giọt: các range lớn (> 256 KiB) chảy ở tốc
 * độ đặt, range nhỏ (moov 6 KiB ở cuối file, probe đầu file) đi
 * ngay. Seek tới vị trí chưa buffer buộc Chrome phải tải qua đường
 * nhỏ giọt (~2,5 MB mỗi seek, đo Y5 §3.3) trước khi seeked kịp nổ —
 * seeking kéo dài hàng chục giây, rAF tick tích mẫu seeking thật,
 * thay vì seek local file xong trong < 1 s như các lượt trước.
 * ROUND44-Z5: đính chính — file này đặt -g 300 nhưng scenecut
 * chèn keyframe mỗi 30 frame (stss 30 mục, cách nhau 30 frame),
 * nên GOP hiệu dụng là 30, KHÔNG phải 300; các mốc seek 25/5/15 s
 * rơi đúng keyframe. Xem docs/PHASE9_ROUND44_Z5_PROBE_LIMITS.md.
 *
 * Trang đo là trang tối giản độc lập (không qua app VCut): chỉ có
 * <video> + per-seek-probe-page.js, để không lẫn hold-frame/preview
 * của app vào số đo trần. Probe ghi entry qua setter currentTime
 * (đúng đường N2 dùng).
 *
 * Cách dùng (từ gốc repo):
 *   node apps/web/scripts/per-seek-probe-chrome-cap-run.mjs \
 *     --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
 *     --scratch /tmp/round43-y5/cap1 --display :96 --port 4196 \
 *     [--rate-kbs 2048] [--seek-timeout-sec 150]
 * Kết quả: <scratch>/cap-evidence.json (entries đã validate + max mẫu/
 * entry + dropped + nhật ký range server). Exit 0 khi phiên chạy xong
 * và evidence đã ghi, kể cả khi trần chưa chạm (chưa chạm cũng là kết
 * quả, ghi rõ); exit 2 khi blocker hạ tầng (không Chrome/Xvfb/video).
 * KHÔNG push, KHÔNG tag, KHÔNG ghi qua GitHub connector.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { validatePerSeekEntry, analyzeSeekingSamples } from "./per-seek-probe.mjs";

const REPO = path.resolve(import.meta.dirname, "..", "..", "..");
const PROBE_PAGE_SRC = fs.readFileSync(path.join(import.meta.dirname, "per-seek-probe-page.js"), "utf8");
const META_CHROME = "/opt/meta-chromium/chrome";
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");

function parseArgs(argv) {
  const o = { display: ":96", port: 4196, rateKbs: 2048, seekTimeoutSec: 150 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--fixture") o.fixture = argv[++i];
    else if (argv[i] === "--scratch") o.scratch = argv[++i];
    else if (argv[i] === "--display") o.display = argv[++i];
    else if (argv[i] === "--port") o.port = Number(argv[++i]);
    else if (argv[i] === "--rate-kbs") o.rateKbs = Number(argv[++i]);
    else if (argv[i] === "--seek-timeout-sec") o.seekTimeoutSec = Number(argv[++i]);
  }
  return o;
}
const opts = parseArgs(process.argv.slice(2));
if (!opts.fixture || !opts.scratch || !fs.existsSync(opts.fixture)) {
  console.error("Cách dùng: per-seek-probe-chrome-cap-run.mjs --fixture <mp4> --scratch <dir> [--display :96] [--port 4196] [--rate-kbs 2048]");
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();

// ------------------------------------------------- Range server nhỏ giọt --
const rangeLog = [];
function serveVideo() {
  const size = fs.statSync(opts.fixture).size;
  const rateBytesPerSec = opts.rateKbs * 1024;
  const CHUNK = 64 * 1024;
  return http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${opts.port}`).pathname);
      if (urlPath === "/probe-page.js") {
        res.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-store" });
        res.end(PROBE_PAGE_SRC);
        return;
      }
      if (urlPath === "/") {
        res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
        res.end(`<!doctype html><html><body><video id="v" controls preload="auto" style="width:640px;height:360px"></video><script src="/probe-page.js"></script><script>window.__y5ready = true;</script></body></html>`);
        return;
      }
      if (urlPath !== "/video.mp4") { res.writeHead(404); res.end(); return; }
      const range = req.headers.range;
      let start = 0, end = size - 1;
      if (range) {
        const m = range.match(/bytes=(\d*)-(\d*)/);
        if (m) {
          start = m[1] ? Number(m[1]) : size - Number(m[2]);
          end = m[2] ? Number(m[2]) : size - 1;
        }
      }
      const total = end - start + 1;
      // ROUND43-Y5: ghi bytesSent theo thời gian để đối chiếu được seek
      // kéo dài bao lâu thì Chrome đã nhận bao nhiêu byte (bằng chứng
      // throttle có tác dụng thật, không phải seek nhanh do cache).
      const rec = { t: stamp(), range: `${start}-${end}`, total, throttled: total > 256 * 1024, bytesSent: 0 };
      rangeLog.push(rec);
      res.writeHead(range ? 206 : 200, {
        "Content-Type": "video/mp4", "Accept-Ranges": "bytes",
        "Content-Length": total, "Content-Range": `bytes ${start}-${end}/${size}`,
        "Cache-Control": "no-store",
      });
      if (total <= 256 * 1024) {
        const s = fs.createReadStream(opts.fixture, { start, end });
        s.on("data", (c) => { rec.bytesSent += c.length; });
        s.pipe(res);
        return;
      }
      // Nhỏ giọt: 64 KiB mỗi nhịp để giữ đúng ~rate (không gửi ồ ạt).
      const stream = fs.createReadStream(opts.fixture, { start, end, highWaterMark: CHUNK });
      const intervalMs = Math.max(1, Math.round((CHUNK / rateBytesPerSec) * 1000));
      let paused = false;
      const timer = setInterval(() => {
        if (paused) return;
        const chunk = stream.read(CHUNK);
        if (chunk === null) { paused = true; stream.once("readable", () => { paused = false; }); return; }
        rec.bytesSent += chunk.length;
        if (!res.write(chunk)) { paused = true; res.once("drain", () => { paused = false; }); }
      }, intervalMs);
      stream.on("end", () => { clearInterval(timer); res.end(); });
      stream.on("error", () => { clearInterval(timer); try { res.end(); } catch {} });
      req.on("close", () => { clearInterval(timer); try { stream.destroy(); } catch {} });
    } catch { try { res.writeHead(500); res.end(); } catch {} }
  });
}

// ------------------------------------------------------------- CDP pipe --
// Mẫu tối giản theo harness N2 (pipe --remote-debugging-pipe, không Playwright).
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
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
    proc.on("error", () => {});
    // Mẫu N2: hứng lỗi mọi stdio pipe để Chrome chết sớm không làm
    // crash harness bằng unhandled 'error' (chẩn đoán qua exit code).
    for (const s of [1, 2, 3, 4]) {
      try { proc.stdio[s]?.on("error", () => {}); } catch {}
    }
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 60000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression, timeoutMs = 120000) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, this.sessionId, timeoutMs);
    if (r.exceptionDetails) throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 500)}`);
    return r.result?.value;
  }
}

const main = async () => {
  fs.mkdirSync(opts.scratch, { recursive: true });
  const server = serveVideo();
  await new Promise((res) => server.listen(opts.port, "127.0.0.1", res));
  console.log(`[cap] server http://127.0.0.1:${opts.port} rate=${opts.rateKbs} KiB/s fixture=${path.basename(opts.fixture)}`);
  // Xvfb: dùng chung nếu còn sống, không thì bật mới (đúng mẫu N2:
  // socket là /tmp/.X11-unix/X<num>, không phải /tmp/.X<num>-Xvfb).
  const num = opts.display.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = spawnSync("pgrep", ["-f", `Xvfb ${opts.display}`]).status === 0; } catch {}
    if (alive) console.log(`[cap] Xvfb: dùng chung display ${opts.display} (tiến trình còn sống)`);
    else {
      console.log(`[cap] Xvfb: socket ${sock} mồ côi, xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch {}
      try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
    }
  }
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [opts.display, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) { console.error("BLOCKER: Xvfb không tạo socket"); process.exit(2); }
    console.log(`[cap] Xvfb lên: DISPLAY=${opts.display}`);
  }
  // Thứ tự như N2: Playwright Chromium trước (đã chứng minh chạy được
  // trong môi trường này ở các lượt khác), rồi mới Meta Chromium.
  const chromeBin = fs.existsSync(PW_CHROME) ? PW_CHROME : (fs.existsSync(META_CHROME) ? META_CHROME : null);
  if (!chromeBin) { console.error("BLOCKER: không tìm thấy Chrome"); process.exit(2); }
  console.log(`[cap] chrome: ${chromeBin} (display ${opts.display})`);
  const chrome = spawn(chromeBin, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--autoplay-policy=no-user-gesture-required", "--disable-gpu",
    `--user-data-dir=${opts.scratch}/chrome-profile`, "--window-size=1280,800", "--window-position=0,0",
    "about:blank"],
    { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: opts.display } });
  // Xả stdout/stderr (dbus/gpu noise) để pipe không tắc (mẫu N2).
  chrome.stdout?.on("data", () => {});
  chrome.stdio[2].on("data", (c) => { try { fs.appendFileSync(path.join(opts.scratch, "chrome-stderr.log"), c); } catch {} });
  chrome.stdio[2].on("error", () => {});
  chrome.on("exit", (code, signal) => console.log(`[cap] chrome exit code=${code} signal=${signal} (stderr: ${opts.scratch}/chrome-stderr.log)`));
  const cdp = new PipeCdp(chrome);
  const cleanup = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} try { server.close(); } catch {} };
  try {
    // Mẫu J6/N2: getTargets → createTarget → attach → chờ sessionId.
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) throw new Error("không nhận được sessionId từ Target.attachedToTarget");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, cdp.sessionId);
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${opts.port}/` }, cdp.sessionId);
    await sleep(2000);
    for (let i = 0; i < 100; i++) {
      const ready = await cdp.evaluate(`!!window.__y5ready`);
      if (ready) break;
      await sleep(200);
    }
    // Cài probe: evaluate trực tiếp source trang (nó tự gán window.__n2PerSeek).
    const defined = await cdp.evaluate(PROBE_PAGE_SRC);
    console.log(`[cap] probe page defined=${defined}`);
    const inst = await cdp.evaluate(`window.__n2PerSeek.install({fps:30})`);
    console.log(`[cap] probe install=${inst}`);
    await cdp.evaluate(`(()=>{const v=document.getElementById("v"); v.src="/video.mp4?cap=1"; return true;})()`);
    // Đợi metadata (moov ở cuối file nhưng chỉ 6 KiB, đi ngay).
    for (let i = 0; i < 100; i++) {
      const md = await cdp.evaluate(`(()=>{const v=document.getElementById("v"); return {rs:v.readyState, dur:v.duration, err: v.error?String(v.error.code):null};})()`);
      if (md.rs >= 1 && md.dur > 0) { console.log(`[cap] metadata readyState=${md.rs} dur=${md.dur}`); break; }
      if (md.err) throw new Error(`video error ${md.err}`);
      await sleep(200);
    }
    // Các seek dài: tới mốc 25/5/15 s (rơi đúng keyframe 1 s của file
    // này — ROUND44-Z5: không phải giữa GOP thưa) để buộc tải ~2,5 MB
    // qua đường nhỏ giọt. Mỗi seek đợi tới khi
    // seeking=false hoặc hết timeout; poll số mẫu mỗi 2 s (không gọi
    // read() giữa chừng — read() sẽ chốt entry).
    const seeks = [25, 5, 15];
    const pollSnapshots = [];
    for (const t of seeks) {
      console.log(`[cap] seek → ${t}s`);
      await cdp.evaluate(`(()=>{const v=document.getElementById("v"); v.currentTime=${t}; return v.seeking;})()`);
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < opts.seekTimeoutSec * 1000) {
        await sleep(2000);
        const snap = await cdp.evaluate(`(()=>{const v=document.getElementById("v"); const es=window.__n2PerSeek.entries.map(e=>({k:e.k,targetTime:e.targetTime,status:e.status,samples:e.decodedSamplesWhileSeeking.length,dropped:e.droppedSeekingSamples})); return {seeking:v.seeking, ct:v.currentTime, rs:v.readyState, entries:es};})()`);
        last = snap;
        const cur = snap.entries[snap.entries.length - 1];
        console.log(`[cap]  +${Math.round((Date.now() - t0) / 1000)}s seeking=${snap.seeking} ct=${snap.ct?.toFixed(2)} entry k=${cur?.k} samples=${cur?.samples} dropped=${cur?.dropped}`);
        if (!snap.seeking) break;
      }
      pollSnapshots.push({ target: t, waitSec: Math.round((Date.now() - t0) / 1000), last });
      if (last?.seeking) console.log(`[cap] seek ${t}s HẾT TIMEOUT vẫn seeking — chuyển seek tiếp theo (entry sẽ chốt unresolved lúc read)`);
      await sleep(1000);
    }
    const raw = await cdp.evaluate(`window.__n2PerSeek.read()`);
    const entries = raw.entries.map((e) => {
      const { _el, ...rest } = e;
      return rest;
    });
    const validateProblemsTotal = entries.reduce((n, e) => n + validatePerSeekEntry(e).length, 0);
    const perEntry = entries.map((e) => {
      const a = analyzeSeekingSamples(e);
      return { k: e.k, targetTime: e.targetTime, status: e.status, sampleCount: a.sampleCount, droppedSeekingSamples: e.droppedSeekingSamples ?? 0, progress: a.progress, decodedDeltaWhileSeeking: a.decodedDeltaWhileSeeking, spanMs: a.spanMs };
    });
    const maxSamples = Math.max(0, ...perEntry.map((e) => e.sampleCount));
    const maxDropped = Math.max(0, ...perEntry.map((e) => e.droppedSeekingSamples));
    const capHit = maxSamples >= 1000 || maxDropped > 0;
    const evidence = {
      runAt: stamp(), chrome: chromeBin, display: opts.display, port: opts.port,
      rateKbs: opts.rateKbs, fixture: opts.fixture,
      seeks, pollSnapshots,
      entryCount: entries.length,
      perEntry, maxSamplesPerEntry: maxSamples, maxDroppedSeekingSamples: maxDropped,
      capHit, validateProblemsTotal, validateEntriesChecked: entries.length,
      counts: raw.counts, droppedOverflow: raw.droppedOverflow,
      rangeRequests: rangeLog.length,
      rangeLog: rangeLog.slice(-40),
      note: "Chrome thật, mạng nhỏ giọt (điều kiện thật) — không phải vm fake, không phải seek local file; số này không claim cho seek không giới hạn mạng.",
    };
    writeFileEpermRetry(path.join(opts.scratch, "cap-evidence.json"), JSON.stringify(evidence, null, 2));
    writeFileEpermRetry(path.join(opts.scratch, "cap-entries.json"), JSON.stringify(entries, null, 2));
    console.log(`[cap] entries=${entries.length} maxSamples/entry=${maxSamples} maxDropped=${maxDropped} capHit=${capHit} validateProblems=${validateProblemsTotal}`);
    console.log(`[cap] evidence → ${path.join(opts.scratch, "cap-evidence.json")}`);
  } finally {
    cleanup();
  }
  process.exit(0);
};
main().catch((e) => { console.error(`BLOCKER: ${e.message}`); process.exit(2); });
