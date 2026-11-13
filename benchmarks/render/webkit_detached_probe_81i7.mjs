// webkit_detached_probe_81i7.mjs — Phase 9 đợt 81, luồng I7 (phát hiện W5):
// element video TÁCH DOM có phát được trên WebKitGTK headed không?
//
// Bối cảnh: trong app thật, preview dùng MediaPool.videoFor tạo element
// video nhưng KHÔNG gắn vào document (chỉ làm nguồn cho canvas
// drawImage). Kiểm chứng headed đợt này thấy currentTime của element
// trong app kẹt ở ~0,067 dù paused=false — probe này tách riêng câu
// hỏi: cùng clip H.264, element tách DOM vs gắn DOM, trên WebKitGTK
// headed và Chromium headed đối chứng.
//
// Chạy (cần dep WebKit đã cài — xem LIMITS I7 §5 — và clip đã encode):
//   I7_CLIP=/tmp/round81-i7/i7-clip-4s.mp4 xvfb-run -a node benchmarks/render/webkit_detached_probe_81i7.mjs
// Clip mặc định: /tmp/round81-i7/i7-clip-4s.mp4 (H.264 640×360 4 s,
// ffmpeg testsrc2 — encode lại nếu đã mất: xem LIMITS I7 §5).
// Kết quả ghi vào benchmarks/results/webkit-detached-probe-81i7.json.
// KHÔNG sửa production, KHÔNG push.
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const { webkit, chromium } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CLIP = process.env.I7_CLIP || "/tmp/round81-i7/i7-clip-4s.mp4";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-detached-probe-81i7.json");

const server = http.createServer((rq, rs) => {
  if (rq.url === "/clip.mp4") {
    const data = fs.readFileSync(CLIP);
    rs.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": data.length, "Access-Control-Allow-Origin": "*" });
    rs.end(data);
  } else { rs.writeHead(404); rs.end(); }
});
await new Promise((res) => server.listen(8891, "127.0.0.1", res));

const PAGE = `<!doctype html><meta charset=utf-8><body>
<script>
window.results = {};
async function test(tag, attach) {
  const v = document.createElement("video");
  v.src = "http://127.0.0.1:8891/clip.mp4";
  v.muted = true; v.playsInline = true; v.preload = "auto";
  if (attach) { v.style.cssText = "position:fixed;left:0;top:0;width:160px;height:90px"; document.body.appendChild(v); }
  await new Promise((res) => { v.onloadedmetadata = res; v.onerror = () => res(); setTimeout(res, 8000); });
  const meta = { readyState: v.readyState, duration: v.duration };
  try { await v.play(); } catch (e) { meta.playErr = String(e).slice(0, 120); }
  const samples = []; const frames = [];
  for (let i = 0; i < 10; i++) { await new Promise((r) => setTimeout(r, 500)); samples.push(+v.currentTime.toFixed(3)); frames.push(v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality().totalVideoFrames : null); }
  window.results[tag] = { ...meta, paused: v.paused, ended: v.ended, samples, frames };
  v.pause();
}
(async () => { await test("detached", false); await test("attached", true); })();
</script></body>`;

async function run(engine, name) {
  const b = await (engine === "webkit" ? webkit : chromium).launch({ headless: false, ...(engine === "chromium" ? { executablePath: "/home/hatch/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome", args: ["--no-sandbox"] } : {}) });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.setContent(PAGE, { waitUntil: "load" });
  await sleep(30000);
  const r = await p.evaluate(() => window.results);
  console.log(`[${name}]`, JSON.stringify(r));
  await b.close();
  return r;
}

const results = { clip: CLIP, startedAt: new Date().toISOString() };
results.webkitHeaded = await run("webkit", "WEBKIT-HEADED");
results.chromiumHeaded = await run("chromium", "CHROMIUM-HEADED");
results.finishedAt = new Date().toISOString();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
console.log("ghi:", OUT);
server.close();
process.exit(0);
