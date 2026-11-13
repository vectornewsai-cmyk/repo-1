// ff-tap-check-76d4.mjs — đợt 76 D4: kiểm chứng tap dọc +0.5px khử răng cưa
// trên Firefox + WebKit (Safari-ish) bằng playwright-core + browser
// đã có trong ~/.cache/ms-playwright. Đo R combing (C/S, như probe C8)
// cho noop vs tap1 trên interlaced720.mp4 + clean720.mp4, 3 mốc 1/2/3s,
// full-res 1280×720. Chỉ đo pixel (không đo FPS, không chạy app).
// Chạy: NODE_PATH=/tmp/round76-d4/node_modules node apps/web/scripts/ff-tap-check-76d4.mjs [firefox|webkit|all]
// (mặc định all; playwright-core KHÔNG nằm trong node_modules của repo —
// cài riêng: mkdir -p /tmp/round76-d4 && cd /tmp/round76-d4 && npm i playwright-core.
// Browser lấy từ cache ~/.cache/ms-playwright, không tải lại.)
// Kết quả ghi stdout + JSON vào hidden_files/round76-d4/ff-webkit-tap-check.json.
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium, firefox, webkit } from "playwright-core";

const MEDIA_DIR = path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const OUT_DIR = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round76-d4");
fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGE_HTML = `<!doctype html><meta charset="utf-8"><body><script>
async function run(url) {
  const v = document.createElement("video");
  v.muted = true; v.preload = "auto"; v.src = url;
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("load fail " + url)); });
  const W = 1280, H = 720;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const metrics = (d, w, h) => {
    const x0 = Math.floor(w * 0.1), x1 = Math.floor(w * 0.9), y0 = Math.floor(h * 0.1), y1 = Math.floor(h * 0.9);
    const lum = (x, y) => { const i = (y * w + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
    let cross = 0, same = 0, n = 0;
    for (let y = y0 + 2; y < y1 - 2; y += 2) for (let x = x0; x < x1; x += 2) {
      cross += Math.abs(lum(x, y) - lum(x, y + 1));
      same += Math.abs(lum(x, y) - lum(x, y + 2));
      n++;
    }
    return { ratio: +((cross / n) / Math.max(same / n, 0.001)).toFixed(2) };
  };
  const out = [];
  for (const t of [1.0, 2.0, 3.0]) {
    await new Promise((res) => { v.onseeked = res; v.currentTime = t; });
    await new Promise((r) => setTimeout(r, 150));
    ctx.clearRect(0, 0, W, H); ctx.drawImage(v, 0, 0, W, H);
    const noop = metrics(ctx.getImageData(0, 0, W, H).data, W, H);
    ctx.clearRect(0, 0, W, H); ctx.drawImage(v, 0, 0.5, W, H);
    const tap = metrics(ctx.getImageData(0, 0, W, H).data, W, H);
    out.push({ t, noop: noop.ratio, tap: tap.ratio });
  }
  document.title = "DONE";
  return out;
}
window.__run = run;
</script></body>`;

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    if (url === "/") { res.setHeader("Content-Type", "text/html"); res.end(PAGE_HTML); return; }
    const name = url.replace(/^\//, "");
    const fp = path.join(MEDIA_DIR, name);
    if (!name || name.includes("..") || !fs.existsSync(fp)) { res.statusCode = 404; res.end("nf"); return; }
    const st = fs.statSync(fp);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      if (m) {
        const start = Number(m[1]); const end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${st.size}`);
        res.setHeader("Content-Length", String(end - start + 1));
        fs.createReadStream(fp, { start, end }).pipe(res); return;
      }
    }
    res.setHeader("Content-Length", String(st.size));
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((res) => server.listen(0, "127.0.0.1", () => res(server)));
}

const CACHE = path.join(os.homedir(), ".cache", "ms-playwright");
function findExe(kind, sub) {
  try {
    for (const d of fs.readdirSync(CACHE).filter((x) => x.startsWith(kind + "-")).sort().reverse()) {
      const p = path.join(CACHE, d, sub);
      if (fs.existsSync(p)) return p;
    }
  } catch {}
  return null;
}

async function checkOne(name, launcher, exePath) {
  const out = { browser: name, ok: false };
  let browser = null;
  try {
    browser = await launcher.launch({ executablePath: exePath || undefined, headless: true });
    const page = await browser.newPage();
    await page.goto(BASE);
    for (const [key, file] of [["interlaced", "interlaced720.mp4"], ["clean", "clean720.mp4"]]) {
      out[key] = await page.evaluate((u) => window.__run(u), `${BASE}${file}`);
    }
    out.ok = true;
  } catch (e) {
    out.error = String(e && e.message ? e.message : e).slice(0, 500);
  } finally {
    try { await browser?.close(); } catch {}
  }
  return out;
}

const which = process.argv[2] || "all";
const server = await serve();
const BASE = `http://127.0.0.1:${server.address().port}/`;
const results = {};
try {
  if (which === "all" || which === "firefox") {
    const exe = findExe("firefox", "firefox/firefox");
    console.log(`firefox exe: ${exe}`);
    results.firefox = await checkOne("firefox", firefox, exe);
    console.log("firefox:", JSON.stringify(results.firefox));
  }
  if (which === "all" || which === "webkit") {
    const exe = findExe("webkit", "minibrowser-gtk/bin/MiniBrowser") || findExe("webkit", "minibrowser-wpe/bin/MiniBrowser");
    console.log(`webkit exe: ${exe}`);
    results.webkit = await checkOne("webkit", webkit, exe);
    console.log("webkit:", JSON.stringify(results.webkit));
  }
  if (which === "all" || which === "chromium") {
    results.chromium = await checkOne("chromium", chromium, undefined);
    console.log("chromium:", JSON.stringify(results.chromium));
  }
} finally {
  server.close();
}
writeFileEpermRetry(path.join(OUT_DIR, "ff-webkit-tap-check.json"), JSON.stringify(results, null, 2));
console.log("ghi JSON: hidden_files/round76-d4/ff-webkit-tap-check.json");
