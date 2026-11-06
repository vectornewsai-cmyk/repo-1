// probeCost45A6.mjs — Phase 9 đợt 45, luồng A6: đo chi phí THẬT của
// probe VideoDecoder.isConfigSupported mà decodeGop (ROUND44-Z6) gọi
// 1 lần mỗi cửa sổ GOP, trên Chromium thật (mẫu pipe CDP của Z6).
// Đóng nợ Z6 §6.4 (chi phí probe chưa có số ms).
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/probeCost45A6.mjs [--load-label <nhãn>]
// Script tự bật Xvfb riêng (display trống trong :90-:99) + Chromium
// từ Playwright cache; nếu không còn display trống thì rơi về
// --headless=new (vẫn là Chromium thật, ghi rõ mode ở output).
// Profile Chrome tạo trong tmpdir và dọn khi xong; không ghi gì vào
// repo. Exit 0 khi đo xong; exit 2 khi thiếu Chrome/VideoDecoder/
// isConfigSupported (khi đó KHÔNG có số ms để báo — không bịa số).
//
// Fixture/config (lấy từ test Z6: track avc1.64001F 64×64, sample 1):
// probe dùng đúng shape decoderConfig của decodeGop (codec, codedWidth,
// codedHeight, hardwareAcceleration). 3 arm, mỗi arm warmup 50 + đo 600
// lần gọi tuần tự (1 probe = 1 cửa sổ GOP, đúng nhịp production):
//   A. cùng config, prefer-software (đường decodeGop hay dùng: 2 điểm
//      gọi trong controller đều truyền preferHardware=false).
//   B. cùng config, prefer-hardware.
//   C. xoay 12 config khác nhau (3 codec × 2 kích thước × 2 hw) —
//      xấp xỉ chi phí lần gọi đầu cho mỗi config mới (production mỗi
//      footage/track là 1 config khác, browser có thể không cache
//      bằng arm A/B).
// Thống kê mỗi arm: n, supported count, median/p95/p99/mean/min/max
// (ms, performance.now trong trang). Số này là chi phí của riêng lệnh
// probe trong Chromium — KHÔNG bao gồm fetch/decode của cửa sổ GOP,
// và KHÔNG phải baseline quiet khi chạy cùng các luồng đợt 45 khác
// (xem --load-label, mặc định under-load-parallel).
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const LOAD_LABEL = process.argv.includes("--load-label")
  ? process.argv[process.argv.indexOf("--load-label") + 1] || "under-load-parallel"
  : "under-load-parallel";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const log = (...a) => console.log(`[${stamp()}]`, ...a);
function fail(msg) { console.error(`BLOCKER: ${msg}`); process.exit(2); }

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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); } catch (e) { this.pending.delete(id); clearTimeout(timer); reject(e); }
    });
  }
  async evaluate(expr, sessionId) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 800));
    return r.result?.value;
  }
}

function pickFreeDisplay() {
  for (let n = 90; n <= 99; n++) {
    if (!fs.existsSync(`/tmp/.X11-unix/X${n}`)) return `:${n}`;
  }
  return null;
}

function stats(ms) {
  const s = [...ms].sort((a, b) => a - b);
  const at = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  return {
    n: s.length,
    medianMs: +at(0.5).toFixed(4),
    p95Ms: +at(0.95).toFixed(4),
    p99Ms: +at(0.99).toFixed(4),
    meanMs: +mean.toFixed(4),
    minMs: +s[0].toFixed(4),
    maxMs: +s[s.length - 1].toFixed(4),
  };
}

async function main() {
  if (!fs.existsSync(CHROME)) fail(`không có chrome ${CHROME}`);
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<!doctype html><meta charset="utf-8"><title>A6 probe cost</title><script>window.__a6Ready = true;</script>`);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = `http://127.0.0.1:${server.address().port}`;

  let xvfb = null; let chrome = null; let mode = "headless";
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "a6-probe-"));
  const cleanup = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGTERM"); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };
  process.on("exit", cleanup);
  try {
    const display = pickFreeDisplay();
    const args = ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run",
      "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
      `--user-data-dir=${profileDir}`, "--window-size=1280,800", "about:blank"];
    let env = { ...process.env };
    if (display) {
      const num = display.replace(":", "");
      xvfb = spawn("Xvfb", [display, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
      for (let i = 0; i < 40 && !fs.existsSync(`/tmp/.X11-unix/X${num}`); i++) await sleep(250);
      if (!fs.existsSync(`/tmp/.X11-unix/X${num}`)) fail("Xvfb không tạo socket");
      env = { ...env, DISPLAY: display };
      mode = `headed-xvfb-${display}`;
      log(`Xvfb riêng ${display} (headed thật)`);
    } else {
      args.unshift("--headless=new");
      log("không còn display trống :90-:99 -> rơi về --headless=new (vẫn Chromium thật)");
    }
    chrome = spawn(CHROME, args, { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env });
    chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
    const cdp = new PipeCdp(chrome);
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) fail("không nhận được sessionId");
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
    let ready = false;
    for (let i = 0; i < 60 && !ready; i++) {
      await sleep(500);
      ready = await cdp.evaluate("!!window.__a6Ready", cdp.sessionId).catch(() => false);
    }
    if (!ready) fail("trang probe không ready sau 30s");

    const probeExpr = `(() => {
      const out = { hasVideoDecoder: typeof VideoDecoder !== "undefined",
        hasProbe: typeof VideoDecoder !== "undefined" && typeof VideoDecoder.isConfigSupported === "function" };
      return out;
    })()`;
    const caps = await cdp.evaluate(probeExpr, cdp.sessionId);
    log("capability:", JSON.stringify(caps));
    if (!caps.hasVideoDecoder) fail("Chromium này không có VideoDecoder — không đo được probe");
    if (!caps.hasProbe) fail("Chromium này không có VideoDecoder.isConfigSupported — probe Z6 đi nhánh fallback, không có số ms");

    // Đo trong trang: 3 arm, warmup 50 + 600 lần tuần tự mỗi arm.
    const measureExpr = `(async () => {
      const cfgs = (codec, w, h, hw) => ({ codec, codedWidth: w, codedHeight: h, hardwareAcceleration: hw });
      const arms = {
        A_same_software: Array.from({ length: 650 }, () => cfgs("avc1.64001F", 64, 64, "prefer-software")),
        B_same_hardware: Array.from({ length: 650 }, () => cfgs("avc1.64001F", 64, 64, "prefer-hardware")),
        C_rotating: Array.from({ length: 650 }, (_, i) => {
          const codecs = ["avc1.64001F", "avc1.640028", "avc1.4D401F"];
          const sizes = [[64, 64], [640, 360], [1920, 1080]];
          const hw = ["prefer-software", "prefer-hardware"];
          const c = codecs[i % 3], s = sizes[Math.floor(i / 3) % 3], h = hw[Math.floor(i / 9) % 2];
          return cfgs(c, s[0], s[1], h);
        }),
      };
      const result = {};
      for (const [name, list] of Object.entries(arms)) {
        const ms = []; let supported = 0; let unsupported = 0;
        for (let i = 0; i < list.length; i++) {
          const t0 = performance.now();
          let r; try { r = await VideoDecoder.isConfigSupported(list[i]); } catch (e) { r = { supported: false, error: String(e && e.message || e) }; }
          const dt = performance.now() - t0;
          if (i >= 50) { ms.push(dt); if (r && r.supported) supported++; else unsupported++; }
        }
        result[name] = { ms, supported, unsupported };
      }
      return result;
    })()`;
    const raw = await cdp.evaluate(measureExpr, cdp.sessionId);
    const out = { mode, load: LOAD_LABEL, chrome: CHROME, arms: {} };
    for (const [name, arm] of Object.entries(raw)) {
      out.arms[name] = { ...stats(arm.ms), supported: arm.supported, unsupported: arm.unsupported };
    }
    console.log(JSON.stringify(out, null, 2));
    for (const [name, s] of Object.entries(out.arms)) {
      log(`${name}: n=${s.n} supported=${s.supported} unsupported=${s.unsupported} median=${s.medianMs}ms p95=${s.p95Ms}ms p99=${s.p99Ms}ms mean=${s.meanMs}ms max=${s.maxMs}ms`);
    }
    log("Ghi chú: số này là chi phí riêng lệnh isConfigSupported trong Chromium (không gồm fetch/decode cửa sổ GOP); load=" + LOAD_LABEL + " nên KHÔNG dùng làm baseline quiet.");
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("BLOCKER:", e?.message || e); process.exit(2); });
