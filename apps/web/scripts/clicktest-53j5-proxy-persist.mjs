#!/usr/bin/env node
/**
 * clicktest-53j5-proxy-persist.mjs — Phase 9 đợt 53, luồng J5 (mảng 1):
 * chứng minh headed proxy BỀN QUA RELOAD (đóng nợ I9 §5 — manifest
 * AssetStore trước đây không lưu proxyUrl nên reload là mất proxy).
 *
 * Cách làm: vite dev + bridge thật (BRIDGE_WORK_DIR riêng trong
 * scratch, cổng tự chọn) + Chromium headed qua Xvfb + CDP (mẫu I2).
 * Import thật clip 1080p 8 s → thêm vào timeline → bấm nút "Proxy 720p"
 * thật trên MediaBin → chờ proxyUrl về store → kiểm tra manifest trong
 * IndexedDB đã có proxyPath → đợi autosave → RELOAD trang → kiểm tra:
 *  (a) media item khôi phục CÓ proxyUrl (ghép từ proxyPath + origin
 *      bridge hiện tại), đúng giá trị trước reload;
 *  (b) nút Proxy trên MediaBin hiện "✓ PROXY 720p";
 *  (c) file proxy trên đĩa bridge KHÔNG bị tạo lại (mtime + size giữ
 *      nguyên — tức không render lại từ gốc);
 *  (d) GET proxyUrl trả 200 (bridge vẫn phục vụ file cũ);
 *  (e) khi phát, preview thật sự fetch proxyUrl (resource timing thấy
 *      request tới /api/proxy/file/ — tức preview dùng proxy, không
 *      phải bản gốc).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-53j5-proxy-persist.mjs
 * Env: J5_DEV_PORT (mặc định tự chọn 5281–5299), J5_DEBUG_PORT (9471–9489),
 * J5_BRIDGE_PORT (mặc định tự chọn 8787–8799), J5_DISPLAY (mặc định tự
 * chọn :90–:99), J5_SCRATCH (mặc định ~/workspace/tmp-round53-j5/proxy),
 * J5_CLIP (mặc định ~/workspace/tmp-round53-j5/fixtures/clip1080p.mp4).
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG sửa file sản
 * phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.J5_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round53-j5", "proxy");
const CLIP_PATH = process.env.J5_CLIP || path.join(os.homedir(), "workspace", "tmp-round53-j5", "fixtures", "clip1080p.mp4");
const BRIDGE_WORK_DIR = path.join(SCRATCH, "proxy-work");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

async function pickFreePort(lo, hi) {
  for (let p = lo; p <= hi; p++) {
    const free = await new Promise((res) => {
      const s = net.createServer();
      s.once("error", () => res(false));
      s.once("listening", () => s.close(() => res(true)));
      s.listen(p, "127.0.0.1");
    });
    if (free) return p;
  }
  return null;
}
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync(`/tmp/.X11-unix/X${n}`)) return `:${n}`;
  }
  return null;
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map(); this.exceptions = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Page.javascriptDialogOpening") {
        const id = this.nextId++;
        this.ws.send(JSON.stringify({ id, method: "Page.handleJavaScriptDialog", params: { accept: true } }));
        return;
      }
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params?.exceptionDetails || {};
        this.exceptions.push(d.exception?.description || d.text || JSON.stringify(d).slice(0, 500));
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP.send timeout 60s: ${method}`));
      }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
  async waitFor(fn, label, timeoutMs = 180000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const INJECT_ERRORS = `(() => {
  window.__j5errors = [];
  window.addEventListener("error", (e) => {
    try { window.__j5errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__j5errors.push("window.onerror: <?>"); }
  });
  window.addEventListener("unhandledrejection", (e) => {
    try { window.__j5errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__j5errors.push("unhandledrejection: <?>"); }
  });
})()`;

// Snapshot store qua module thật mà app đã nạp (mẫu H6/I2).
const STORE_FN = `(() => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  return (async () => {
    const mod = window.__j5storeMod || (window.__j5storeMod = await import(hit));
    const st = mod.useStore.getState();
    return {
      name: st.spec.meta?.name ?? null,
      playhead: st.playhead,
      playing: st.playing,
      duration: st.duration(),
      tracks: st.spec.tracks.map((t) => ({ id: t.id, kind: t.kind, clips: t.clips.map((c) => ({
        id: c.id, kind: c.kind, src: c.src ?? null, start: +c.start.toFixed(3), duration: +c.duration.toFixed(3),
      })) })),
      media: st.media.map((m) => ({ id: m.id, name: m.name, kind: m.kind, duration: +m.duration.toFixed(3),
        assetId: m.assetId ?? null, proxyUrl: m.proxyUrl ?? null, proxyHeight: m.proxyHeight ?? null,
        proxySizeBytes: m.proxySizeBytes ?? null, hasFile: !!m.file })),
    };
  })();
})()`;

// Import clip 1080p thật qua fetch từ server tĩnh của harness → File →
// importFiles → thêm vào timeline ở playhead 0.
const IMPORT_CLIP_FN = (clipUrl) => `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__j5storeMod || (window.__j5storeMod = await import(hit));
  const st = mod.useStore.getState();
  const res = await fetch(${JSON.stringify(clipUrl)});
  if (!res.ok) return { ok: false, reason: "fetch clip HTTP " + res.status };
  const blob = await res.blob();
  const file = new File([blob], "clip1080p.mp4", { type: "video/mp4" });
  st.setPlayhead(0);
  await st.importFiles([file]);
  const after = mod.useStore.getState();
  const item = after.media.find((m) => m.name === "clip1080p.mp4");
  if (!item) return { ok: false, reason: "importFiles xong mà không thấy clip1080p.mp4 trong bin" };
  after.addMediaAtPlayhead(item.id);
  const st2 = mod.useStore.getState();
  const clip = st2.spec.tracks.flatMap((t) => t.clips.map((c) => ({ ...c, trackId: t.id })))
    .find((c) => c.kind === "video" && c.src === "clip1080p.mp4");
  return { ok: true, mediaId: item.id, itemDuration: item.duration, itemHeight: item.height ?? null,
    assetId: item.assetId ?? null, trackId: clip?.trackId ?? null, clipId: clip?.id ?? null };
})()`;

// Đọc manifest của asset từ IndexedDB thật trong trang (AssetStore thật).
const MANIFEST_FN = (assetId) => `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/lib\\/assetStore\\.ts(\\?|$)/.test(u)) || "/src/lib/assetStore.ts";
  const mod = window.__j5assetMod || (window.__j5assetMod = await import(hit));
  const store = new mod.AssetStore();
  const m = await store.get(${JSON.stringify(assetId)});
  await store.close();
  return m ? { assetId: m.assetId, originalName: m.originalName,
    proxyPath: m.proxyPath ?? null, proxyHeight: m.proxyHeight ?? null,
    proxySizeBytes: m.proxySizeBytes ?? null } : null;
})()`;

// previewUrlFor thật (module proxy.ts mà app nạp) cho item theo tên.
const PREVIEW_URL_FN = (name) => `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/lib\\/proxy\\.ts(\\?|$)/.test(u)) || "/src/lib/proxy.ts";
  const mod = window.__j5proxyMod || (window.__j5proxyMod = await import(hit));
  const sEntries = performance.getEntriesByType("resource").map((e) => e.name);
  const sHit = sEntries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const sMod = window.__j5storeMod || (window.__j5storeMod = await import(sHit));
  const item = sMod.useStore.getState().media.find((m) => m.name === ${JSON.stringify(name)});
  if (!item) return { ok: false, reason: "không thấy item" };
  return { ok: true, previewUrl: mod.previewUrlFor(item), proxyUrl: item.proxyUrl ?? null, usingProxy: mod.isUsingProxy(item) };
})()`;

const MODAL_SEL = ".modal-backdrop, .tour-card, .welcome-modal";

// Bấm nút Phát bằng click chuột THẬT qua CDP (tạo user gesture —
// .click() tổng hợp qua evaluate KHÔNG tạo activation nên AudioContext
// có thể giữ suspended và el.play() bị chặn). Trả về rect đã bấm.
async function clickPlay(cdp) {
  const r = await cdp.evalJs(`(() => {
    const b = document.querySelector('.tbtn.play');
    if (!b) return null;
    const rect = b.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  if (!r) throw new Error("không thấy nút .tbtn.play");
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(r.x), y: Math.round(r.y), button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(r.x), y: Math.round(r.y), button: "left", clickCount: 1 });
  await sleep(300);
  return r;
}


async function closeModal(cdp) {
  const present = await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`);
  if (!present) return "không có modal";
  await cdp.evalJs(`(() => { const m = document.querySelector(${JSON.stringify(MODAL_SEL)}); const b = m?.querySelector("button"); b?.click(); return true; })()`).catch(() => {});
  await sleep(600);
  let gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  if (!gone) {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" }).catch(() => {});
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" }).catch(() => {});
    await sleep(600);
    gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  }
  return gone ? "đã đóng modal" : "modal vẫn mở sau các cách đóng";
}

function proxyFileOnDisk(workDir, proxyUrl) {
  try {
    const name = decodeURIComponent(proxyUrl.split("/").pop() || "");
    const full = path.join(workDir, "proxies", name);
    const st = fs.statSync(full);
    return { name, full, size: st.size, mtimeMs: st.mtimeMs, exists: true };
  } catch {
    return { name: null, full: null, size: null, mtimeMs: null, exists: false };
  }
}

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null, bridge = null, clipServer = null;
  let harnessError = null;

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    try { bridge?.kill("SIGKILL"); } catch {}
    try { clipServer?.close(); } catch {}
  };
  process.on("exit", killAll);

  try {
    const DEV_PORT = Number(process.env.J5_DEV_PORT || 0) || (await pickFreePort(5281, 5299));
    const DEBUG_PORT = Number(process.env.J5_DEBUG_PORT || 0) || (await pickFreePort(9471, 9489));
    const BRIDGE_PORT = Number(process.env.J5_BRIDGE_PORT || 0) || (await pickFreePort(8787, 8799));
    const CLIP_PORT = await pickFreePort(5381, 5399);
    const DISPLAY = process.env.J5_DISPLAY || pickFreeDisplay();
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5281–5299");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9471–9489");
    if (!BRIDGE_PORT) throw new Error("hết cổng bridge trống 8787–8799");
    if (!CLIP_PORT) throw new Error("hết cổng clip trống 5381–5399");
    if (!DISPLAY) throw new Error("hết display Xvfb trống :90–:99");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(CLIP_PATH)) throw new Error(`không thấy clip ${CLIP_PATH}`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const BRIDGE_URL = `http://127.0.0.1:${BRIDGE_PORT}`;
    const CLIP_URL = `http://127.0.0.1:${CLIP_PORT}/clip1080p.mp4`;
    const PROFILE = path.join(SCRATCH, "cdprof-proxy");
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite dev :${DEV_PORT}, bridge :${BRIDGE_PORT}, debug :${DEBUG_PORT}, clip :${CLIP_PORT}, DISPLAY=${DISPLAY}`);

    // Bridge thật với WORK_ROOT riêng trong scratch (proxy file bền qua reload trang).
    const bridgeLogFd = fs.openSync(path.join(SCRATCH, "proxy-bridge.log"), "w");
    bridge = spawn("node", [path.join(ROOT, "server", "bridge", "src", "index.js")],
      { cwd: path.join(ROOT, "server", "bridge"), stdio: ["ignore", bridgeLogFd, bridgeLogFd],
        // Đợt 66 T9 — persist riêng theo PID (BRIDGE_WORK_DIR cố định): tránh rò mốc limiter (đợt 65 §3b).
        env: { ...process.env, BRIDGE_PORT: String(BRIDGE_PORT), BRIDGE_WORK_DIR, BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-${process.pid}.json`) } });
    let bridgeUp = false;
    for (let i = 0; i < 60 && !bridgeUp; i++) {
      try { const r = await fetch(`${BRIDGE_URL}/api/health`); if (r.ok) bridgeUp = true; } catch { await sleep(1000); }
    }
    if (!bridgeUp) throw new Error(`bridge không lên ở ${BRIDGE_URL} sau 60 s`);
    log("bridge đã lên");

    const clipBytes = fs.readFileSync(CLIP_PATH);
    clipServer = http.createServer((req, res) => {
      if (req.url === "/clip1080p.mp4") {
        res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": clipBytes.length, "Access-Control-Allow-Origin": "*" });
        res.end(clipBytes);
      } else { res.writeHead(404); res.end(); }
    });
    await new Promise((res, rej) => { clipServer.once("error", rej); clipServer.listen(CLIP_PORT, "127.0.0.1", res); });

    const viteLogFd = fs.openSync(path.join(SCRATCH, "proxy-vite.log"), "w");
    vite = spawn(VITE_BIN, ["--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd],
        env: { ...process.env, VITE_BRIDGE_URL: BRIDGE_URL } });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [`${DISPLAY}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "proxy-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY } });
    let pageTarget = null;
    for (let i = 0; i < 360 && !pageTarget; i++) {
      try {
        const ctl = new AbortController();
        const to = setTimeout(() => ctl.abort(), 5000);
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`, { signal: ctl.signal })).json();
        clearTimeout(to);
        pageTarget = (pages || []).find((p) => p.type === "page") || null;
      } catch {}
      if (!pageTarget) await sleep(500);
    }
    if (!pageTarget) throw new Error("không tìm thấy target type=page sau 180 s");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: INJECT_ERRORS });
    log("CDP đã nối, đã cài thu lỗi trang (__j5errors)");

    await cdp.send("Page.navigate", { url: DEV_URL });
    // Chờ từ phía Node (eval ngắn mỗi lần) — KHÔNG chờ bằng vòng lặp
    // dài trong trang: CDP.send timeout 60 s sẽ giết evaluate đó.
    const loaded = await cdp.waitFor(async () => {
      const n = await cdp.evalJs(`document.querySelectorAll(".tl-clip").length`).catch(() => 0);
      return n >= 3 ? true : null;
    }, "project mẫu >= 3 clip", 180000).catch(() => false);
    if (!loaded) throw new Error("project mẫu không load (>= 3 clip) sau 180 s");
    const snap0 = await cdp.evalJs(STORE_FN);
    if (snap0.name === "Dự án mẫu") pass("A0 load sample", `tên "Dự án mẫu", duration=${snap0.duration}s`);
    else fail("A0 load sample", `name=${snap0.name}`);
    log(`modal: ${await closeModal(cdp)}`);
    log(`bridge URL app đang dùng: ${await cdp.evalJs(`window.__VCUT_BRIDGE_URL__ ?? null`)}`);

    // ---- P0: import clip 1080p + thêm vào timeline ----
    const imp = await cdp.evalJs(IMPORT_CLIP_FN(CLIP_URL));
    if (imp.ok && imp.itemHeight === 1080 && imp.clipId && imp.assetId) {
      pass("P0 import clip 1080p + thêm vào timeline", `media ${imp.mediaId}, assetId=${imp.assetId}, height=${imp.itemHeight}, clip=${imp.clipId}`);
    } else {
      fail("P0 import clip 1080p + thêm vào timeline", JSON.stringify(imp));
      throw new Error("không dựng được clip 1080p — dừng lượt");
    }

    // ---- P1: bấm nút Proxy 720p thật trên MediaBin, chờ proxyUrl về store ----
    const btn = await cdp.evalJs(`(() => {
      const b = [...document.querySelectorAll(".media-proxy")].map((el) => {
        const r = el.getBoundingClientRect();
        return { text: el.textContent.trim(), x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: el.disabled };
      });
      return b;
    })()`);
    log(`nút proxy tìm được: ${JSON.stringify(btn)}`);
    if (btn.length !== 1 || btn[0].disabled) {
      fail("P1 bấm nút Proxy 720p", `cần đúng 1 nút bật, nhận ${JSON.stringify(btn)}`);
      throw new Error("không thấy nút Proxy như kỳ vọng — dừng lượt");
    }
    // Bấm bằng .click() trong trang thay vì CDP mouse event: chẩn đoán
    // proxydiag run 2 cho thấy CDP press+release tại đúng tọa độ nút
    // KHÔNG kích hoạt onClick của nút này (text nút không đổi "…",
    // không toast, không request /api/proxy) — trong khi cùng cách bấm
    // lại chạy với nút Play (.tbtn.play). Nghi ngờ nút nằm trong thẻ
    // draggable (.media-card) hoặc bị phần tử khác phủ. Ghi lại
    // elementFromPoint để đối chiếu, rồi .click() trực tiếp trên nút.
    const clickInfo = await cdp.evalJs(`(() => {
      const b = document.querySelector(".media-proxy");
      const r = b.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const top = document.elementFromPoint(cx, cy);
      const info = { atPoint: top ? (top.className?.toString().slice(0, 60) || top.tagName) : null, btnTextBefore: b.textContent.trim() };
      b.click();
      info.btnTextAfter = b.textContent.trim();
      return info;
    })()`);
    log(`bấm nút proxy: ${JSON.stringify(clickInfo)}`);
    const withProxy = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(STORE_FN).catch(() => null);
      const it = s?.media.find((m) => m.name === "clip1080p.mp4");
      return it?.proxyUrl ? it : null;
    }, "proxyUrl về store", 120000);
    const proxyUrlBefore = withProxy.proxyUrl;
    log(`proxyUrl trước reload: ${proxyUrlBefore} (height=${withProxy.proxyHeight}, size=${withProxy.proxySizeBytes})`);
    if (proxyUrlBefore.startsWith(`${BRIDGE_URL}/api/proxy/file/`) && withProxy.proxyHeight === 720) {
      pass("P1 tạo proxy qua nút MediaBin", `proxyUrl=${proxyUrlBefore}, height=720, size=${withProxy.proxySizeBytes}`);
    } else {
      fail("P1 tạo proxy qua nút MediaBin", `proxyUrl=${proxyUrlBefore} height=${withProxy.proxyHeight}`);
    }

    // ---- P2: manifest trong IndexedDB đã có proxyPath ----
    await sleep(1500); // chờ setMediaProxy persist (fire-and-forget) ghi xong
    const man = await cdp.evalJs(MANIFEST_FN(imp.assetId));
    if (man && man.proxyPath === "/api/proxy/file/clip1080p__proxy_720p.mp4" && man.proxyHeight === 720) {
      pass("P2 manifest lưu proxyPath bền", `proxyPath=${man.proxyPath}, height=${man.proxyHeight}, size=${man.proxySizeBytes}`);
    } else {
      fail("P2 manifest lưu proxyPath bền", JSON.stringify(man));
    }

    // ---- P3: file proxy trên đĩa bridge + đợi autosave rồi RELOAD ----
    const diskBefore = proxyFileOnDisk(BRIDGE_WORK_DIR, proxyUrlBefore);
    log(`file proxy trên đĩa: ${JSON.stringify(diskBefore)}`);
    if (!diskBefore.exists) fail("P3 file proxy trên đĩa bridge", "không thấy file proxy trong WORK_ROOT/proxies");
    // Đợi autosave ghi spec (có clip clip1080p.mp4) rồi mới reload.
    const autosaved = await cdp.waitFor(async () => {
      const v = await cdp.evalJs(`localStorage.getItem("vcut-studio:autosave:v1") || ""`).catch(() => "");
      return v.includes("clip1080p.mp4") ? v : null;
    }, "autosave chứa clip1080p.mp4", 60000).catch(() => null);
    if (autosaved) pass("P3 autosave đã ghi clip trước reload", "localStorage autosave chứa clip1080p.mp4");
    else fail("P3 autosave đã ghi clip trước reload", "autosave không chứa clip sau 60 s — reload vẫn thử");

    await cdp.send("Page.navigate", { url: DEV_URL });
    const loaded2 = await cdp.waitFor(async () => {
      const n = await cdp.evalJs(`document.querySelectorAll(".tl-clip").length`).catch(() => 0);
      return n >= 4 ? true : null;
    }, "project sau reload >= 4 clip", 180000).catch(() => false);
    if (!loaded2) throw new Error("sau reload: project không load (>= 4 clip) sau 180 s");
    await sleep(2000); // chờ rehydrate chạy xong (async sau replaceProject)
    const snapAfter = await cdp.evalJs(STORE_FN);
    const itemAfter = snapAfter.media.find((m) => m.name === "clip1080p.mp4");
    log(`sau reload: media=${JSON.stringify(snapAfter.media.map((m) => m.name))} clip1080p=${JSON.stringify(itemAfter)}`);
    if (itemAfter && itemAfter.proxyUrl === proxyUrlBefore && itemAfter.assetId === imp.assetId) {
      pass("P4 sau reload: proxyUrl khôi phục đúng giá trị cũ",
        `proxyUrl=${itemAfter.proxyUrl}, assetId giữ nguyên ${itemAfter.assetId}`);
    } else {
      fail("P4 sau reload: proxyUrl khôi phục đúng giá trị cũ",
        `item=${JSON.stringify(itemAfter)} kỳ vọng proxyUrl=${proxyUrlBefore}`);
    }

    // ---- P5: nút Proxy hiện "✓ PROXY 720p" sau reload ----
    const btnAfter = await cdp.evalJs(`(() => {
      const b = [...document.querySelectorAll(".media-proxy")].map((el) => el.textContent.trim());
      return b;
    })()`);
    if (btnAfter.some((t) => /✓ PROXY 720p/.test(t))) {
      pass("P5 nút Proxy hiện ✓ PROXY 720p sau reload", JSON.stringify(btnAfter));
    } else {
      fail("P5 nút Proxy hiện ✓ PROXY 720p sau reload", JSON.stringify(btnAfter));
    }

    // ---- P6: file proxy KHÔNG bị tạo lại (mtime + size giữ nguyên) ----
    const diskAfter = proxyFileOnDisk(BRIDGE_WORK_DIR, proxyUrlBefore);
    if (diskAfter.exists && diskAfter.mtimeMs === diskBefore.mtimeMs && diskAfter.size === diskBefore.size) {
      pass("P6 file proxy không bị tạo lại sau reload",
        `mtime=${diskBefore.mtimeMs} size=${diskBefore.size} giữ nguyên`);
    } else {
      fail("P6 file proxy không bị tạo lại sau reload", `trước=${JSON.stringify(diskBefore)} sau=${JSON.stringify(diskAfter)}`);
    }

    // ---- P7: GET proxyUrl trả 200 ----
    const getRes = await fetch(proxyUrlBefore, { method: "GET", headers: { Range: "bytes=0-1023" } }).catch((e) => ({ ok: false, status: `fetch lỗi: ${e.message}` }));
    if (getRes.ok || getRes.status === 206) {
      pass("P7 GET proxyUrl trả 200/206", `status=${getRes.status}, content-type=${getRes.headers?.get?.("content-type") ?? "?"}`);
    } else {
      fail("P7 GET proxyUrl trả 200/206", `status=${getRes.status}`);
    }

    // ---- P8: phát thật — preview fetch proxyUrl (resource timing) ----
    // Chẩn đoán kèm theo (P8 từng FAIL ở lượt đầu: previewUrlFor đúng
    // proxy nhưng resource timing không thấy fetch — cần biết phát có
    // chạy thật không, clip nằm ở đâu, <video> nào dùng src nào).
    const p8diag0 = await cdp.evalJs(`(() => {
      const st = window.__j5storeMod ? window.__j5storeMod.useStore.getState() : null;
      const clip = st?.spec.tracks.flatMap((t) => t.clips.map((c) => ({ ...c, trackId: t.id })))
        .find((c) => c.kind === "video" && c.src === "clip1080p.mp4");
      return { playhead: st?.playhead ?? null, playing: st?.playing ?? null,
        clip: clip ? { start: clip.start, duration: clip.duration, trackId: clip.trackId } : null };
    })()`);
    log(`P8 trước phát: ${JSON.stringify(p8diag0)}`);
    // Xóa buffer resource-timing trước khi phát: vite dev nạp hàng trăm
    // module nên buffer mặc định (150 entry) đã đầy từ lúc load trang —
    // khi đầy, trình duyệt KHÔNG ghi thêm entry mới (không phải ring
    // buffer) nên fetch proxy trong lúc phát không bao giờ xuất hiện
    // dù element thật sự dùng proxy (xem mediaState.src ở lượt trước).
    // KHÔNG clearResourceTimings: element video tạo từ lúc render tạm
    // dừng sau reload đã fetch proxy xong (preload=auto) — clear sẽ xóa
    // đúng entry duy nhất đó, và lúc phát element chỉ phát từ buffer
    // nên không fetch mới. Bằng chứng chính là element src/srcKey +
    // currentTime tiến (xem mediaState), resource timing chỉ ghi thêm.
    const resBefore = await cdp.evalJs(`performance.getEntriesByType("resource")
      .map((e) => e.name).filter((n) => n.includes("/api/proxy/file/"))`).catch(() => []);
    log(`P8 resource proxy trước phát: ${JSON.stringify(resBefore)}`);
    await clickPlay(cdp);
    // Xác nhận playing=true, bấm lại 1 lần nếu chưa chạy (click CDP có
    // thể trượt khi VM nặng — kiểm chứng bằng playing, không đoán).
    for (let attempt = 0; attempt < 2; attempt++) {
      await sleep(1200);
      const pl = await cdp.evalJs(`window.__j5storeMod ? window.__j5storeMod.useStore.getState().playing : null`).catch(() => null);
      log(`P8 bấm Phát lần ${attempt + 1}: playing=${pl}`);
      if (pl) break;
      if (attempt === 0) await clickPlay(cdp).catch(() => {});
    }
    // poll tối đa 15 s: chờ resource proxy xuất hiện (fetch có thể chậm
    // vì element video tạo lười + FPS thấp trên VM này).
    let resEntries = [];
    let p8diag1 = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      resEntries = await cdp.evalJs(`performance.getEntriesByType("resource")
        .map((e) => e.name).filter((n) => n.includes("/api/proxy/file/"))`).catch(() => []);
      if (resEntries.length > 0) break;
    }
    p8diag1 = await cdp.evalJs(`(() => {
      const st = window.__j5storeMod ? window.__j5storeMod.useStore.getState() : null;
      const vids = [...document.querySelectorAll("video")].map((v) => ({
        src: (v.currentSrc || v.src || "").slice(-90), ct: +v.currentTime.toFixed(2), paused: v.paused,
      }));
      return { playhead: st?.playhead ?? null, playing: st?.playing ?? null, videos: vids,
        mediaState: window.__vcutMediaState || null };
    })()`).catch(() => null);
    const previewUrl = await cdp.evalJs(PREVIEW_URL_FN("clip1080p.mp4"));
    await clickPlay(cdp).catch(() => {});
    log(`P8 sau phát: ${JSON.stringify(p8diag1)}; resource proxy: ${JSON.stringify(resEntries)}; previewUrlFor=${JSON.stringify(previewUrl)}`);
    // Bằng chứng chính: element video của clip có src/srcKey đúng bằng
    // proxyUrl VÀ currentTime đã chạy tới cuối clip (7.9+/8 s) — tức
    // preview thật sự giải mã từ file proxy, không phải blob gốc.
    // Resource timing chỉ là bằng chứng phụ (buffer vite dev có thể đầy
    // trước khi element tạo, và element đã preload xong trước lúc phát).
    const proxyEl = (p8diag1?.mediaState || []).find((m) => m.src === proxyUrlBefore);
    if (previewUrl.ok && previewUrl.usingProxy && previewUrl.previewUrl === proxyUrlBefore && proxyEl && proxyEl.currentTime > 0.5) {
      pass("P8 phát sau reload dùng proxy thật",
        `element src=${proxyEl.src.slice(-60)}, currentTime=${proxyEl.currentTime}, resource fetch proxy ${resEntries.length + resBefore.length} lần`);
    } else {
      fail("P8 phát sau reload dùng proxy thật",
        `previewUrl=${JSON.stringify(previewUrl)} proxyEl=${JSON.stringify(proxyEl)} resourceProxy=${JSON.stringify(resEntries)}`);
    }

    // ---- P9: 0 lỗi console trong phiên ----
    const finalErrs = await cdp.evalJs(`(window.__j5errors || []).slice()`);
    if (finalErrs.length === 0 && cdp.exceptions.length === 0) {
      pass("P9 0 lỗi console trong phiên", "window errors 0, CDP exceptions 0");
    } else {
      fail("P9 0 lỗi console trong phiên", `window=${JSON.stringify(finalErrs)} cdp=${JSON.stringify(cdp.exceptions.slice(-2))}`);
    }
  } catch (e) {
    harnessError = e;
    log(`HARNESS LỖI: ${e instanceof Error ? e.message : e}`);
  } finally {
    killAll();
  }
  const out = { results, harnessError: harnessError ? String(harnessError.message || harnessError) : null };
  writeFileEpermRetry(path.join(SCRATCH, "proxy-result.json"), JSON.stringify(out, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "proxy-log.txt"), logLines.join("\n") + "\n");
  const fails = results.filter((r) => !r.ok).length;
  log(`đã ghi ${path.join(SCRATCH, "proxy-result.json")} — ${results.length - fails}/${results.length} PASS`);
  process.exit(harnessError ? 2 : fails > 0 ? 1 : 0);
}

void main();
