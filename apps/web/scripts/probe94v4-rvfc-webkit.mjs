#!/usr/bin/env node
/**
 * probe94v4-rvfc-webkit.mjs — Phase 9 đợt 93, luồng U3 (nợ LIMITS gộp đợt 92 §4 mục 3c).
 * Điều tra thật: requestVideoFrameCallback trên WebKitGTK có bắn callback không?
 * T3 đợt 92 đo trong app thật: 0 mẫu / 5 lượt WebKit dù supported=true.
 * Probe tối thiểu này tách biến: trang HTML tĩnh (không có app VCut), 2 video
 * cùng clip bóng 6s (1 video HIỂN THỊ 640x360, 1 video ẨN 1x1 opacity:0 —
 * để kiểm tra giả thuyết "rVFC chỉ bắn cho video được composite/hiển thị"),
 * attach rVFC trước khi play (chuỗi A) + attach lại sau khi đã phát (chuỗi B),
 * seek giữa chừng, sampler currentTime 100ms làm đối chứng.
 * Chạy đối chứng cùng kịch bản trên Chromium (kỳ vọng: callback bắn đều).
 *
 * Chạy: node apps/web/scripts/probe94v4-rvfc-webkit.mjs --engine webkit|chromium
 * Scratch: hidden_files/round94-v4/rvfc-<engine>/rvfc-results.json
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, execFileSync } from "node:child_process";
import { chromium, webkit } from "/home/hatch/scratch-round63-r4/node_modules/playwright-core/index.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const argv = process.argv.slice(2);
const ENGINE = argv.includes("--engine") ? argv[argv.indexOf("--engine") + 1] : "webkit";
const SCRATCH = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round94-v4", `rvfc-${ENGINE}`);
const CLIP = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round87-o8", "headed", "o8-ball-720p-6s.mp4");
const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
fs.mkdirSync(SCRATCH, { recursive: true });
if (!fs.existsSync(CLIP)) throw new Error("thiếu fixture clip bóng " + CLIP);

const HTML = `<!doctype html><html><body>
<video id="vVis" src="/ball.mp4" muted loop playsinline width="640" height="360"></video>
<video id="vHid" src="/ball.mp4" muted loop playsinline style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0"></video>
<script>
window.__rvfc93 = { t0: performance.now(), protoHas: false, perVideo: {} };
try { window.__rvfc93.protoHas = "requestVideoFrameCallback" in HTMLVideoElement.prototype; } catch (e) { window.__rvfc93.protoErr = String(e); }
function setup(id) {
  const v = document.getElementById(id);
  const rec = { instHas: typeof v.requestVideoFrameCallback === "function",
    chainA: [], chainB: [], ctSamples: [], events: [], quality: null };
  window.__rvfc93.perVideo[id] = rec;
  const t0 = window.__rvfc93.t0;
  // Chuỗi A: attach TRƯỚC khi play.
  if (rec.instHas) {
    const cbA = (now, meta) => {
      if (rec.chainA.length < 600) {
        rec.chainA.push({ wallMs: Math.round(performance.now() - t0), mediaTime: +meta.mediaTime.toFixed(3), presented: meta.presentedFrames, ct: +v.currentTime.toFixed(3) });
        v.requestVideoFrameCallback(cbA);
      }
    };
    v.requestVideoFrameCallback(cbA);
    rec.events.push({ wallMs: 0, ev: "chainA-attached-before-play" });
  }
  // Sampler currentTime 100ms.
  rec._timer = setInterval(() => {
    rec.ctSamples.push({ wallMs: Math.round(performance.now() - t0), ct: +v.currentTime.toFixed(3), paused: v.paused, seeking: v.seeking, rs: v.readyState });
    try { const q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null; if (q) rec.quality = { dropped: q.droppedVideoFrames, total: q.totalVideoFrames }; } catch {}
  }, 100);
  v.addEventListener("error", () => rec.events.push({ wallMs: Math.round(performance.now() - t0), ev: "error", code: v.error ? v.error.code : null }));
  v.addEventListener("stalled", () => rec.events.push({ wallMs: Math.round(performance.now() - t0), ev: "stalled" }));
  v.play().then(() => rec.events.push({ wallMs: Math.round(performance.now() - t0), ev: "play-resolved" }))
    .catch((e) => rec.events.push({ wallMs: Math.round(performance.now() - t0), ev: "play-rejected", msg: String(e && e.message || e) }));
  // Chuỗi B: attach LẠI sau 12s (đã phát) — tách biến attach-before-play.
  setTimeout(() => {
    if (!rec.instHas) return;
    const cbB = (now, meta) => {
      if (rec.chainB.length < 600) {
        rec.chainB.push({ wallMs: Math.round(performance.now() - t0), mediaTime: +meta.mediaTime.toFixed(3), presented: meta.presentedFrames, ct: +v.currentTime.toFixed(3) });
        v.requestVideoFrameCallback(cbB);
      }
    };
    v.requestVideoFrameCallback(cbB);
    rec.events.push({ wallMs: Math.round(performance.now() - t0), ev: "chainB-attached-after-play" });
  }, 12000);
  // Seek giữa chừng lúc 8s.
  setTimeout(() => {
    try { v.currentTime = 3.0; rec.events.push({ wallMs: Math.round(performance.now() - t0), ev: "seek-to-3.0" }); }
    catch (e) { rec.events.push({ wallMs: Math.round(performance.now() - t0), ev: "seek-failed", msg: String(e) }); }
  }, 8000);
  // Dừng lúc 20s.
  setTimeout(() => { clearInterval(rec._timer); v.pause(); rec.events.push({ wallMs: Math.round(performance.now() - t0), ev: "done-paused" }); }, 20000);
}
setup("vVis");
setup("vHid");
</script></body></html>`;

let xvfb = null, browser = null;
async function main() {
  const clipBuf = fs.readFileSync(CLIP);
  // Server tĩnh CÓ hỗ trợ Range (206 Partial Content): bản đầu không hỗ trợ
  // Range đã gây MEDIA_ERR_NETWORK (code 2) trên WebKitGTK sau seek — loại
  // biến nhiễu này để rVFC được đo trên video phát sạch.
  const server = http.createServer((req, res) => {
    if (req.url === "/") { res.writeHead(200, { "content-type": "text/html" }); res.end(HTML); }
    else if (req.url === "/ball.mp4") {
      const range = req.headers.range;
      if (range) {
        const m = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (m) {
          const start = m[1] === "" ? 0 : parseInt(m[1], 10);
          const end = m[2] === "" ? clipBuf.length - 1 : Math.min(parseInt(m[2], 10), clipBuf.length - 1);
          if (start <= end && start < clipBuf.length) {
            res.writeHead(206, { "content-type": "video/mp4", "content-range": `bytes ${start}-${end}/${clipBuf.length}`, "content-length": end - start + 1, "accept-ranges": "bytes" });
            res.end(clipBuf.subarray(start, end + 1));
            return;
          }
        }
        res.writeHead(416, { "content-range": `bytes */${clipBuf.length}` }); res.end(); return;
      }
      res.writeHead(200, { "content-type": "video/mp4", "content-length": clipBuf.length, "accept-ranges": "bytes" });
      res.end(clipBuf);
    }
    else { res.writeHead(404); res.end(); }
  });
  await new Promise((res) => server.listen(0, "127.0.0.1", res));
  const port = server.address().port;
  const URL = `http://127.0.0.1:${port}/`;
  log(`rvfc probe ${ENGINE} server ${URL} clip=${clipBuf.length} bytes`);

  let DISPLAY = null;
  for (const d of [":193", ":194", ":195", ":196", ":197"]) {
    const sockD = `/tmp/.X11-unix/X${d.slice(1)}`;
    let alive = false;
    if (fs.existsSync(sockD)) {
      try { alive = execFileSync("sh", ["-c", `ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`], { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) continue;
      try { fs.unlinkSync(sockD); log(`đã dọn socket X mồ côi ${sockD}`); } catch {}
    }
    DISPLAY = d; break;
  }
  if (!DISPLAY) throw new Error("hết display Xvfb trống :193–:197");
  for (let xAttempt = 1; xAttempt <= 3; xAttempt++) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode === null && fs.existsSync(`/tmp/.X11-unix/X${DISPLAY.slice(1)}`)) { log(`Xvfb ${DISPLAY} đã lên`); break; }
    log(`Xvfb ${DISPLAY} chưa lên lần ${xAttempt}, thử lại sau 15s`);
    try { xvfb.kill("SIGKILL"); } catch {}
    xvfb = null;
    if (xAttempt === 3) throw new Error("Xvfb không khởi động được sau 3 lần thử");
    await sleep(15000);
  }

  const pw = ENGINE === "webkit" ? webkit : chromium;
  const launchEnv = { ...process.env, DISPLAY };
  if (ENGINE === "webkit") launchEnv.GST_PLUGIN_SYSTEM_PATH = "/usr/lib/x86_64-linux-gnu/gstreamer-1.0";
  browser = await pw.launch({ headless: false, env: launchEnv });
  log(`${ENGINE} launched, version: ${browser.version()}`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrs = [];
  page.on("pageerror", (e) => pageErrs.push("pageerror: " + String(e && e.message || e).slice(0, 200)));
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  log("page loaded, chờ 23s để 2 chuỗi rVFC + seek + sampler chạy xong…");
  await sleep(23000);
  const result = await page.evaluate(() => {
    const r = window.__rvfc93;
    const summarize = (rec) => {
      if (!rec) return null;
      const mt = rec.chainA.map((x) => x.mediaTime);
      const mtB = rec.chainB.map((x) => x.mediaTime);
      return {
        instHas: rec.instHas,
        chainA_n: rec.chainA.length,
        chainA_first: rec.chainA[0] || null,
        chainA_last: rec.chainA[rec.chainA.length - 1] || null,
        chainA_mediaTimeAdvances: mt.length > 1 ? +(mt[mt.length - 1] - mt[0]).toFixed(3) : null,
        chainB_n: rec.chainB.length,
        chainB_first: rec.chainB[0] || null,
        chainB_last: rec.chainB[rec.chainB.length - 1] || null,
        chainB_mediaTimeAdvances: mtB.length > 1 ? +(mtB[mtB.length - 1] - mtB[0]).toFixed(3) : null,
        ctSamples_n: rec.ctSamples.length,
        ct_first: rec.ctSamples[0] || null,
        ct_last: rec.ctSamples[rec.ctSamples.length - 1] || null,
        ct_max: rec.ctSamples.length ? Math.max(...rec.ctSamples.map((x) => x.ct)) : null,
        quality: rec.quality,
        events: rec.events,
        chainA: rec.chainA.slice(0, 10),
        chainB: rec.chainB.slice(0, 10),
      };
    };
    return { engine: null, protoHas: r.protoHas, protoErr: r.protoErr || null, userAgent: navigator.userAgent, vis: summarize(r.perVideo.vVis), hid: summarize(r.perVideo.vHid) };
  });
  result.engine = ENGINE;
  result.pageErrs = pageErrs;
  result.userAgent = result.userAgent;
  fs.writeFileSync(path.join(SCRATCH, "rvfc-results.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(SCRATCH, "rvfc-log.txt"), logLines.join("\n") + "\n");
  const verdict = (v) => `vis A=${v.vis.chainA_n} B=${v.vis.chainB_n} | hid A=${v.hid.chainA_n} B=${v.hid.chainB_n} | protoHas=${v.protoHas} instHas vis=${v.vis.instHas} hid=${v.hid.instHas} | ctMax vis=${v.vis.ct_max} hid=${v.hid.ct_max}`;
  log(`KẾT QUẢ ${ENGINE}: ${verdict(result)}`);
  log(`chi tiết: ${path.join(SCRATCH, "rvfc-results.json")}`);
  await browser.close(); browser = null;
  try { xvfb.kill("SIGKILL"); } catch {}
  server.close();
}

main().catch(async (e) => {
  console.error("RVFC PROBE LỖI: " + (e && e.stack || e));
  try { fs.writeFileSync(path.join(SCRATCH, "rvfc-error.txt"), String(e && e.stack || e)); } catch {}
  try { fs.writeFileSync(path.join(SCRATCH, "rvfc-log.txt"), logLines.join("\n") + "\n"); } catch {}
  try { if (browser) await browser.close(); } catch {}
  try { if (xvfb) xvfb.kill("SIGKILL"); } catch {}
  process.exit(2);
}).then(() => process.exit(0));
