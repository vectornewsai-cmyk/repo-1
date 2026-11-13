#!/usr/bin/env node
/**
 * probe92t2-raf-rate.cdp.mjs — Đợt 92 T2: rAF chạy bao nhiêu Hz trong
 * headless Chrome trên VM này (trang trắng, không app, không video)?
 * Để phân biệt: rAF ~12fps trong probe tickcost là do app/tick nặng,
 * hay do môi trường headless (compositor software) kẹp BeginFrame.
 * Chạy: node apps/web/scripts/probe92t2-raf-rate.cdp.mjs [--size 1440,900] [--secs 3]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const SIZE = opt("--size", "1440,900");
const SECS = Number(opt("--secs", "3")) || 3;
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const CDP_PORT = Number(opt("--cdp-port", "9232"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-92t2-raf-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
  `--window-size=${SIZE}`, "about:blank",
], { stdio: "ignore" });
const cleanup = () => {
  try { chrome.kill("SIGKILL"); } catch { /* noop */ }
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* noop */ }
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });

let target = null;
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    target = list.find((t) => t.type === "page");
    if (target) break;
  } catch { /* chưa lên */ }
  await sleep(500);
}
if (!target) { console.error("không kết nối được Chrome CDP"); process.exit(2); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const i = ++id;
  pending.set(i, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
  setTimeout(() => { if (pending.has(i)) { pending.delete(i); reject(new Error(`timeout ${method}`)); } }, 30000);
});
const evalJs = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
};
const res = await evalJs(`(async () => {
  const t0 = performance.now();
  let n = 0;
  const gaps = [];
  let last = t0;
  await new Promise((done) => {
    const loop = (t) => {
      n++;
      gaps.push(t - last);
      last = t;
      if (t - t0 < ${SECS * 1000}) requestAnimationFrame(loop);
      else done();
    };
    requestAnimationFrame(loop);
  });
  gaps.sort((a, b) => a - b);
  const med = gaps[Math.floor(gaps.length / 2)];
  return { n, secs: ${SECS}, fps: +(n / ${SECS}).toFixed(1), gapMedMs: +med.toFixed(1), gapMaxMs: +gaps[gaps.length - 1].toFixed(1) };
})()`);
console.log(JSON.stringify({ size: SIZE, ...res }));
ws.close();
cleanup();
