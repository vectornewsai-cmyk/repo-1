#!/usr/bin/env node
/**
 * probe-round36-s5-rehydrate-pipe.mjs — Phase 9 đợt 36, luồng S5.
 *
 * Kiểm chứng bằng trình duyệt thật (KHÔNG phải discard thật, chỉ reload
 * mô phỏng như R6): sau khi tạo project mẫu thật (MediaRecorder) rồi
 * reload, media mẫu phải được nạp lại từ AssetStore — KHÔNG hiện panel
 * Relink oan — và playhead phải khôi phục (paused, không tự phát).
 *
 * Pha A (đường user đi): profile mới → chờ project mẫu + autosave →
 * seek ruler tới ~4s → reload → assert: tên "Dự án mẫu" giữ nguyên,
 * panel Relink VẮNG, media bin chứa mau-1.webm + mau-2.webm, playhead
 * sau reload ≈ trước reload, nút phát ở trạng thái pause, autosave có
 * session.playhead ≈ playhead.
 * Pha B (đối chứng âm): sửa autosave — đổi 1 clip src thành tên file
 * không tồn tại → reload → assert panel Relink HIỆN và liệt kê đúng
 * tên đó (chứng minh rehydrate không che media thiếu thật).
 *
 * Phương pháp: phục vụ bundle probe (build riêng ra /tmp, KHÔNG đụng
 * dist của repo để khỏi nhiễm các luồng khác) bằng python http.server;
 * điều khiển Chrome qua CDP WebSocket (Node có sẵn WebSocket global,
 * không cần package playwright). Thử headless=new trước; nếu project
 * mẫu không lên trong 90s thì thử lại headed dưới Xvfb.
 *
 * Chạy từ gốc repo (sau khi đã build bundle probe):
 *   npx vite build --outDir /tmp/vcut-s5-dist   (từ apps/web)
 *   node apps/web/scripts/probe-round36-s5-rehydrate-pipe.mjs
 * Env: S5_PORT (4295), S5_CDP_PORT (9229), S5_DISPLAY (:95),
 *   S5_DIST (/tmp/vcut-s5-dist), S5_OUT
 *   (benchmarks/results/v36-s5-rehydrate.json), S5_PROFILE
 *   (/tmp/vcut-s5-profile).
 * Exit 0 khi probe chạy xong (kể cả khi assert FAIL — đó là dữ liệu,
 * xem JSON); exit 2 khi không dựng được môi trường.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const PORT = Number(process.env.S5_PORT || 4295);
const CDP_PORT = Number(process.env.S5_CDP_PORT || 9229);
const DISPLAY = process.env.S5_DISPLAY || ":95";
const DIST = process.env.S5_DIST || "/tmp/vcut-s5-dist";
const OUT = process.env.S5_OUT || path.join(ROOT, "benchmarks", "results", "v36-s5-rehydrate.json");
const PROFILE = process.env.S5_PROFILE || "/tmp/vcut-s5-profile";
const URL = `http://127.0.0.1:${PORT}/`;
const AUTOSAVE_KEY = "vcut-studio:autosave:v1";
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const CHROME = [PW_CHROME, META_CHROME].find((p) => fs.existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

function kill(proc) {
  try {
    if (proc && !proc.killed) proc.kill("SIGKILL");
  } catch { /* ignore */ }
}

// --- CDP tối thiểu qua WebSocket ---
class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }
  ready() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = () => reject(new Error("CDP websocket failed"));
      setTimeout(() => reject(new Error("CDP websocket timeout")), 15000);
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout ${method}`));
        }
      }, 30000);
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(`evaluate failed: ${JSON.stringify(r.exceptionDetails).slice(0, 300)}`);
    }
    return r.result.value;
  }
  close() {
    try { this.ws.close(); } catch { /* ignore */ }
  }
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    try {
      last = await fn();
      if (last) return last;
    } catch (e) { last = undefined; }
    await sleep(1000);
  }
  throw new Error(`timeout chờ ${label}`);
}

function parseTimes(text) {
  if (!text) return [];
  const m = [...String(text).matchAll(/(\d+):(\d\d)/g)];
  return m.map((x) => Number(x[1]) * 60 + Number(x[2]));
}

async function runBrowser(headed, serverProc) {
  // Dọn profile cũ để pha A luôn là phiên mẫu mới.
  spawnSync("rm", ["-rf", PROFILE]);
  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-first-run",
    "--disable-dev-shm-usage",
    `--user-data-dir=${PROFILE}`,
    "about:blank",
  ];
  if (headed) {
    args.push("--no-sandbox");
  } else {
    args.push("--headless=new", "--no-sandbox", "--disable-gpu", "--use-fake-ui-for-media-stream");
  }
  const env = { ...process.env };
  if (headed) env.DISPLAY = DISPLAY;
  const chrome = spawn(CHROME, args, { env, stdio: "ignore" });
  let xvfb = null;
  if (headed) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x900x24"], { stdio: "ignore" });
    await sleep(1500);
  }
  try {
    const targets = await waitFor(async () => {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      if (!res.ok) return null;
      const list = await res.json();
      return list.length > 0 ? list : null;
    }, 30000, "CDP /json/list");
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    const cdp = new Cdp(pageTarget.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");

    // ---- Pha A ----
    await cdp.send("Page.navigate", { url: URL });
    const autosaveReady = await waitFor(async () => {
      const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
      if (!raw || !raw.includes("Dự án mẫu")) return null;
      return raw;
    }, 90000, "autosave project mẫu");
    log(`[pha A] autosave mẫu đã có (${autosaveReady.length} ký tự)`);
    const time0 = await cdp.evalJs(
      `(() => { const el = document.querySelector('[aria-label="transport"]'); return el ? el.innerText : ""; })()`,
    );
    // Seek ruler tới ~4s: ruler scale mặc định 60px/s → offset 240px.
    const seekOk = await cdp.evalJs(
      `(() => { const el = document.querySelector('.tl-ruler'); if (!el) return false; ` +
      `const r = el.getBoundingClientRect(); ` +
      `el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 240, clientY: r.top + r.height / 2 })); ` +
      `return true; })()`,
    );
    log(`[pha A] ruler click dispatched: ${seekOk}`);
    await sleep(800);
    const time1Text = await cdp.evalJs(
      `(() => { const el = document.querySelector('[aria-label="transport"]'); return el ? el.innerText : ""; })()`,
    );
    const t1 = parseTimes(time1Text)[0] ?? null;
    log(`[pha A] transport trước reload: ${JSON.stringify(time1Text)} → playhead=${t1}`);
    if (t1 === null || t1 <= 0) throw new Error(`seek không đổi playhead (time1=${JSON.stringify(time1Text)})`);

    await cdp.send("Page.reload", { ignoreCache: true });
    await waitFor(async () => {
      const name = await cdp.evalJs(
        `(() => { const el = document.querySelector('input[aria-label="Tên dự án"]'); return el ? el.value : ""; })()`,
      );
      if (name !== "Dự án mẫu") return null;
      const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
      return raw ? true : null;
    }, 60000, "khôi phục sau reload");
    await sleep(2000); // chờ rehydrate IDB + checkMissingMedia chạy xong
    const after = await cdp.evalJs(`(() => {
      const transport = document.querySelector('[aria-label="transport"]');
      const relink = document.querySelector('[aria-label="Media thiếu"]');
      const playBtn = document.querySelector('[aria-label="Phát (Space)"]');
      const pauseBtn = document.querySelector('[aria-label="Tạm dừng (Space)"]');
      const raw = localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)});
      let session = null;
      try { session = JSON.parse(raw || "{}").session || null; } catch {}
      return {
        transportText: transport ? transport.innerText : "",
        relinkPresent: relink !== null,
        relinkText: relink ? relink.innerText.slice(0, 500) : "",
        playButtonPresent: playBtn !== null,
        pauseButtonPresent: pauseBtn !== null,
        session,
      };
    })()`);
    const t2 = parseTimes(after.transportText)[0] ?? null;
    log(`[pha A] sau reload: transport=${JSON.stringify(after.transportText)} → playhead=${t2}, relink=${after.relinkPresent}, session=${JSON.stringify(after.session)}`);
    // Media bin: đọc mọi `.media-name` trong toàn document (sidebar
    // desktop hoặc sheet) — không phụ thuộc nút mở sheet có bấm được
    // không. Relink vắng đã là bằng chứng chính (checkMissingMedia
    // chỉ vắng khi mọi src đều có trong mediaNames); đây là đối chiếu
    // trực quan thêm.
    const binText = await cdp.evalJs(
      `(() => [...document.querySelectorAll('.media-name')].map((e) => e.textContent).join(' | '))()`,
    );
    log(`[pha A] media bin text (đầu 400 ký tự): ${JSON.stringify(binText.slice(0, 400))}`);
    const phaA = {
      projectNameRestored: true,
      relinkAbsent: !after.relinkPresent,
      relinkText: after.relinkText,
      binHasMau1: binText.includes("mau-1.webm"),
      binHasMau2: binText.includes("mau-2.webm"),
      playheadBefore: t1,
      playheadAfter: t2,
      playheadRestored: t1 !== null && t2 !== null && Math.abs(t2 - t1) <= 0.6,
      pausedAfterReload: after.playButtonPresent && !after.pauseButtonPresent,
      sessionPlayhead: after.session ? after.session.playhead : null,
      sessionMatches: after.session !== null && t1 !== null && Math.abs(after.session.playhead - t1) <= 0.6,
    };
    phaA.pass = phaA.relinkAbsent && phaA.binHasMau1 && phaA.binHasMau2 &&
      phaA.playheadRestored && phaA.pausedAfterReload && phaA.sessionMatches;

    // ---- Pha B (đối chứng âm) ----
    const seeded = await cdp.evalJs(`(() => {
      const raw = localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)});
      if (!raw) return false;
      const env = JSON.parse(raw);
      let changed = false;
      const walk = (s) => {
        if (!s || !Array.isArray(s.tracks)) return;
        for (const tr of s.tracks) {
          for (const cl of (tr.clips || [])) {
            if (!changed && typeof cl.src === "string") { cl.src = "file-that-does-not-exist-xyz.mp4"; changed = true; }
            if (cl.subSpec) walk(cl.subSpec);
          }
        }
      };
      walk(env.spec);
      if (!changed) return false;
      localStorage.setItem(${JSON.stringify(AUTOSAVE_KEY)}, JSON.stringify(env));
      return true;
    })()`);
    log(`[pha B] seed autosave src giả: ${seeded}`);
    await cdp.send("Page.reload", { ignoreCache: true });
    await sleep(4000);
    const phaBRelink = await cdp.evalJs(`(() => {
      const d = document.querySelector('[aria-label="Media thiếu"]');
      return d ? d.innerText.slice(0, 500) : "";
    })()`);
    const phaB = {
      seeded,
      relinkPresent: phaBRelink !== "",
      relinkListsFakeSrc: phaBRelink.includes("file-that-does-not-exist-xyz.mp4"),
      relinkText: phaBRelink,
    };
    phaB.pass = phaB.seeded && phaB.relinkPresent && phaB.relinkListsFakeSrc;
    log(`[pha B] relink sau seed giả: ${JSON.stringify(phaBRelink.slice(0, 200))}`);
    cdp.close();
    return { phaA, phaB, mode: headed ? "headed-xvfb" : "headless-new" };
  } finally {
    kill(chrome);
    if (xvfb) kill(xvfb);
  }
}

// --- main ---
if (!CHROME) {
  console.error("Không tìm thấy Chrome (playwright chromium / meta-chromium).");
  process.exit(2);
}
if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error(`Chưa có bundle probe ở ${DIST} — chạy vite build --outDir trước.`);
  process.exit(2);
}
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", DIST], { stdio: "ignore" });
await sleep(1500);
let result;
try {
  try {
    result = await runBrowser(false, server);
    log(`[mode] headless-new OK`);
  } catch (e) {
    log(`[mode] headless-new thất bại (${e.message}) — thử lại headed dưới Xvfb ${DISPLAY}`);
    result = await runBrowser(true, server);
  }
} catch (e) {
  console.error(`Probe thất bại ở tầng môi trường: ${e.message}`);
  kill(server);
  process.exit(2);
}
kill(server);
const out = {
  runAt: new Date().toISOString(),
  dist: DIST,
  url: URL,
  mode: result.mode,
  phaA: result.phaA,
  phaB: result.phaB,
  allPass: result.phaA.pass && result.phaB.pass,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
