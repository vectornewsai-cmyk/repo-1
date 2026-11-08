// pause51H3-meta155-dataurl.mjs — Phase 9 đợt 51, luồng H3:
// thử binary MUSE BROWSER 155 (meta-chromium, /opt/meta-chromium)
// cho fail-fast seek-landing-0.
//
// VÌ SAO THỬ BINARY NÀY: binary/cờ phiên Chrome Y2 gốc không còn
// bản ghi, nhưng có 2 manh mối chỉ về binary này:
//  (1) Chrome Y2 chạy cổng 9223, load được trang probe loopback
//      127.0.0.1:8901 — trong khi D3 §4.2 đã chứng minh binary
//      này khi chạy TAY với cờ C3 + policy file thì KHÔNG load
//      được loopback (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS).
//      Tức Chrome Y2 hoặc là binary khác, hoặc là binary này
//      nhưng được browser-daemon chạy với policy/cờ riêng.
//  (2) README meta-chromium: "Normal startup requires the
//      image-owned WebGL policy supplied by browser-daemon" —
//      đúng kiểu Chrome do daemon chạy.
// VÌ SAO DÙNG data: URL: chạy tay binary 155 vẫn bị chặn
// navigation tới loopback (D3 đã chẩn đoán tới cùng — KHÔNG lặp
// lại, KHÔNG sửa policy hệ thống /etc/opt/chrome). D3 cũng đã
// chứng minh `data:text/html` load BÌNH THƯỜNG trên binary này.
// Nên probe này nhúng cả trang lẫn fixture (base64) vào MỘT
// data: URL, tránh hoàn toàn loopback.
// GIỚI HẠN ĐÃ BIẾT (ghi trước, không giấu): data: URL khác
// http progressive ở tầng nguồn dữ liệu (toàn bộ bytes đã nằm
// trong bộ nhớ, không có Range request) — nên kết quả ÂM TÍNH
// (đáp đúng 2.5) KHÔNG loại trừ được giả thuyết "155 + http
// mới sinh landing-0"; chỉ kết quả DƯƠNG TÍNH (landing-0 trên
// data: URL) mới là bằng chứng mạnh cho khác biệt phiên bản.
// Đối chứng cùng data: URL trên chromium-1248 156 để tách biến
// binary khỏi biến transport.
//
// Chạy từ gốc repo:
//   node apps/web/scripts/pause51H3-meta155-dataurl.mjs
// Exit 0 khi mọi probe done (kể cả landing đúng — đó là
// OBSERVED/NOT_MEASURED, không phải FAIL); exit 1 khi đối
// chứng hỏng; exit 2 khi harness lỗi (kể cả binary 155 không
// khởi động được — ghi rõ, không retry vô hạn).

import { spawn, execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SCRATCH = path.join("/tmp", "pause51h3-meta155-" + process.pid);
const Y2_MEDIA = path.join(os.homedir(), "workspace", "tmp-round43-y2", "media");
const META = "/opt/meta-chromium/chrome";
const CHROME156 = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_PORT = parseInt(process.env.H3M_PORT || "9241", 10);
const C156_PORT = parseInt(process.env.H3M156_PORT || "9242", 10);

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.H3M_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

// ---------- policy file (theo D3 §4.2) ----------
function buildPolicy() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const content = Buffer.from("hatch-webgl-all-origins-v1\n", "utf8");
  const file = path.join(SCRATCH, "webgl-policy.txt");
  fs.writeFileSync(file, content);
  const sha = crypto.createHash("sha256").update(content).digest("hex");
  // Validator: cần cả 4 cờ (validate + file + sha256 + --version) —
  // thiếu file/sha thì lỗi "requires both file and SHA-256 switches".
  const out = execFileSync(META, ["--hatch-validate-webgl-allowed-domains", "--hatch-webgl-allowed-domains-file=" + file, "--hatch-webgl-allowed-domains-sha256=" + sha, "--version"], { encoding: "utf8", timeout: 30000 });
  log("validator output: " + JSON.stringify(out.slice(0, 300)));
  if (!out.includes("hatch-webgl-all-origins-v1")) {
    log("CẢNH BÁO: validator không in lại chuỗi policy kỳ vọng — vẫn thử khởi động, ghi rõ kết quả");
  }
  return { file, sha };
}

// ---------- data: URL probe page ----------
// Trang probe y hệt probe2.html Y2 (seek ở 3 s, chờ 6 s), chỉ
// khác nguồn video là data: URL base64 nhúng sẵn.
function dataUrlFor(fixtureFile, t) {
  const b64 = fs.readFileSync(fixtureFile).toString("base64");
  const html = "<!doctype html><meta charset=\"utf-8\"><title>H3 meta155 probe</title><body>\n"
    + "<script>\n"
    + "window.__c3 = { events: [], error: null, seeked: false, setThrew: null, done: false };\n"
    + "var t = " + JSON.stringify(t) + ";\n"
    + "window.__c3.targetParam = t;\n"
    + "var v = document.createElement('video');\n"
    + "v.preload = 'auto'; v.muted = true;\n"
    + "v.addEventListener('error', function () { var e = v.error; window.__c3.error = e ? { code: e.code, message: e.message } : null; window.__c3.events.push('error'); });\n"
    + "v.addEventListener('seeked', function () { window.__c3.seeked = true; window.__c3.atSeeked = v.currentTime; window.__c3.events.push('seeked@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('seeking', function () { window.__c3.events.push('seeking@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('loadedmetadata', function () { window.__c3.events.push('loadedmetadata'); });\n"
    + "v.addEventListener('canplay', function () { window.__c3.events.push('canplay'); });\n"
    + "v.src = 'data:video/mp4;base64," + b64 + "';\n"
    + "document.body.appendChild(v);\n"
    + "setTimeout(function () {\n"
    + "  window.__c3.beforeSet = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime };\n"
    + "  try { v.currentTime = t; window.__c3.setThrew = false; }\n"
    + "  catch (err) { window.__c3.setThrew = String(err && err.name); }\n"
    + "  setTimeout(function () {\n"
    + "    window.__c3.after = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime };\n"
    + "    window.__c3.done = true;\n"
    + "  }, 6000);\n"
    + "}, 3000);\n"
    + "</script>\n";
  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}

class TabCdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      let d; try { d = JSON.parse(m.data); } catch { return; }
      if (d.id && this.pending.has(d.id)) {
        const { res, rej } = this.pending.get(d.id); this.pending.delete(d.id);
        if (d.error) rej(new Error(JSON.stringify(d.error))); else res(d.result);
      }
    };
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = this.nextId++;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => { this.pending.delete(id); rej(new Error("CDP timeout " + method)); }, timeoutMs);
      this.pending.set(id, { res: (v) => { clearTimeout(timer); res(v); }, rej: (e) => { clearTimeout(timer); rej(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 400));
    return r.result?.value;
  }
  close() { try { this.ws.close(); } catch {} }
}

async function runProbe(port, dataUrl, timeoutMs = 40000) {
  const target = await (await fetch("http://127.0.0.1:" + port + "/json/new", { method: "PUT" })).json();
  if (!target || !target.webSocketDebuggerUrl) throw new Error("json/new không trả webSocketDebuggerUrl: " + JSON.stringify(target));
  const cdp = new TabCdp(target.webSocketDebuggerUrl);
  try {
    await cdp.ready;
    await cdp.send("Runtime.enable", {});
    await cdp.send("Page.enable", {});
    // data: URL dài ~430 KB — navigate trực tiếp; nếu lỗi thì
    // fallback document.write qua evaluate (ghi rõ đường nào chạy).
    let navigated = false;
    try {
      const nav = await cdp.send("Page.navigate", { url: dataUrl }, 30000);
      if (nav && !nav.errorText) navigated = true;
      else log("Page.navigate trả errorText: " + JSON.stringify(nav?.errorText));
    } catch (e) {
      log("Page.navigate lỗi, thử fallback document.write: " + String(e && e.message ? e.message : e));
    }
    if (!navigated) {
      // Fallback: evaluate ghi toàn bộ HTML (đã encodeURIComponent
      // sẵn trong dataUrl — decode lại phía page).
      const html = decodeURIComponent(dataUrl.slice("data:text/html;charset=utf-8,".length));
      await cdp.send("Runtime.evaluate", { expression: "document.open(); document.write(" + JSON.stringify(html) + "); document.close(); 'ok'", returnByValue: true });
    }
    await cdp.send("Page.bringToFront", {}).catch(() => {});
    let result = null;
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      await sleep(500);
      result = await cdp.evaluate("window.__c3").catch(() => null);
      if (result && result.done) break;
    }
    if (!result || !result.done) throw new Error("probe không done sau " + timeoutMs + " ms: " + JSON.stringify(result)?.slice(0, 300));
    return result;
  } finally {
    cdp.close();
    try { await fetch("http://127.0.0.1:" + port + "/json/close/" + target.id); } catch {}
  }
}

async function startChrome(binary, port, extraFlags = [], expectedVersion = null) {
  // Mỗi instance tự chọn display trống (lượt 1 dùng chung DISPLAY
  // của module nên instance 156 chết vì :90 đã bị chiếm) và kiểm
  // tra version trả về khớp binary kỳ vọng — tránh nhầm Chrome của
  // luồng khác đang giữ cổng (lượt 1: port 9231 đã có Chrome
  // 156.0.8078.80 của tiến trình vcut-studio khác).
  const display = pickFreeDisplay();
  if (!display) throw new Error("không còn display trống trong :90-:99");
  const num = display.replace(":", "");
  const sock = "/tmp/.X11-unix/X" + num;
  const xvfb = spawn("Xvfb", [display, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
  for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
  if (!fs.existsSync(sock)) throw new Error("Xvfb không tạo socket " + display);
  const profileDir = path.join(SCRATCH, "chrome-profile-" + port);
  const flags = ["--no-sandbox", "--remote-debugging-port=" + port, "--remote-debugging-address=127.0.0.1",
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--force-device-scale-factor=1", "--autoplay-policy=no-user-gesture-required",
    "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", ...extraFlags, "about:blank"];
  log("khởi động " + binary + " port " + port + " display " + display + " flags: " + JSON.stringify(flags));
  const chrome = spawn(binary, flags, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DISPLAY: display } });
  let errBuf = "";
  chrome.stderr?.on("data", (d) => { errBuf += d.toString(); });
  chrome.stdout?.on("data", () => {});
  let version = null;
  for (let i = 0; i < 60 && !version; i++) {
    await sleep(500);
    try { const r = await fetch("http://127.0.0.1:" + port + "/json/version"); if (r.ok) version = await r.json(); } catch {}
  }
  const killAll = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb.kill("SIGTERM"); } catch {} };
  if (!version) {
    killAll();
    throw new Error("Chrome không mở được DevTools port " + port + " sau 30 s; stderr cuối: " + errBuf.slice(-800));
  }
  if (expectedVersion && !String(version.Browser || "").includes(expectedVersion)) {
    killAll();
    throw new Error("port " + port + " trả version KHÔNG khớp binary kỳ vọng (" + version.Browser + " != *" + expectedVersion + "*) — cổng đang bị Chrome khác giữ");
  }
  log("Chrome DevTools: " + version.Browser + " | " + version["Protocol-Version"]);
  return { chrome, xvfb, version, profileDir };
}
async function startChromeRetry(binary, ports, extraFlags, expectedVersion) {
  let lastErr = null;
  for (const port of ports) {
    try {
      const h = await startChrome(binary, port, extraFlags, expectedVersion);
      return { handle: h, port };
    } catch (e) {
      lastErr = e;
      log("khởi động port " + port + " lỗi: " + String(e && e.message ? e.message : e) + " — thử cổng khác");
      await sleep(1000);
    }
  }
  throw lastErr;
}
function stopChrome(h) {
  try { h.chrome?.kill("SIGKILL"); } catch {}
  try { h.xvfb?.kill("SIGTERM"); } catch {}
  try { if (h.profileDir) fs.rmSync(h.profileDir, { recursive: true, force: true }); } catch {}
}

async function main() {
  if (!fs.existsSync(META)) fail("không có binary " + META);
  if (!fs.existsSync(CHROME156)) fail("không có chrome " + CHROME156);
  if (!DISPLAY) fail("không còn display trống trong :90-:99");
  const valid = path.join(Y2_MEDIA, "valid-gop.mp4");
  const gap = path.join(Y2_MEDIA, "broken-gap.mp4");
  const policy = buildPolicy();
  log("policy file=" + policy.file + " sha256=" + policy.sha);
  const results = {};
  const run = async (port, key, fixture, t) => {
    try {
      const url = dataUrlFor(fixture, t);
      log("PROBE " + key + ": data URL dài " + url.length + " ký tự");
      const r = await runProbe(port, url);
      results[key] = r;
      log("PROBE " + key + " done: " + JSON.stringify(r).slice(0, 400));
    } catch (e) {
      results[key] = { error: String(e && e.message ? e.message : e) };
      log("PROBE " + key + " ERROR: " + results[key].error);
    }
  };

  // LƯỢT META-155.
  let meta = null; let metaPort = null;
  try {
    const started = await startChromeRetry(META, [META_PORT, META_PORT + 10, META_PORT + 20], [
      "--hatch-webgl-allowed-domains-file=" + policy.file,
      "--hatch-webgl-allowed-domains-sha256=" + policy.sha,
    ], "155.0.8059.91");
    meta = started.handle; metaPort = started.port;
    await run(metaPort, "M1-meta-valid-2.5", valid, 2.5);
    for (let i = 1; i <= 3; i++) await run(metaPort, "M2-meta-gap-2.5-run" + i, gap, 2.5);
    await run(metaPort, "M3-meta-gap-1.5", gap, 1.5);
  } catch (e) {
    log("LƯỢT META-155 LỖI: " + String(e && e.message ? e.message : e));
    results["META-START-ERROR"] = String(e && e.message ? e.message : e);
  } finally {
    if (meta) stopChrome(meta);
  }

  // LƯỢT ĐỐI CHỨNG 156 — cùng data: URL, cùng probe.
  let c156 = null; let c156Port = null;
  try {
    const started = await startChromeRetry(CHROME156, [C156_PORT, C156_PORT + 10, C156_PORT + 20], [], "156.0.8078.4");
    c156 = started.handle; c156Port = started.port;
    await run(c156Port, "C1-156-valid-2.5", valid, 2.5);
    for (let i = 1; i <= 2; i++) await run(c156Port, "C2-156-gap-2.5-run" + i, gap, 2.5);
  } catch (e) {
    log("LƯỢT 156 LỖI: " + String(e && e.message ? e.message : e));
    results["C156-START-ERROR"] = String(e && e.message ? e.message : e);
  } finally {
    if (c156) stopChrome(c156);
  }

  const near = (ct, t) => typeof ct === "number" && Math.abs(ct - t) < 0.01;
  const checks = [];
  const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 900)); };
  const m1 = results["M1-meta-valid-2.5"] || {};
  const m1Ok = Array.isArray(m1.events) && m1.events.some((e) => e.startsWith("seeked@") && near(parseFloat(e.slice(7)), 2.5));
  check("CONTROL-meta155-valid-2.5-dataurl", m1Ok ? "PASS" : "FAIL", m1);
  const c1 = results["C1-156-valid-2.5"] || {};
  const c1Ok = Array.isArray(c1.events) && c1.events.some((e) => e.startsWith("seeked@") && near(parseFloat(e.slice(7)), 2.5));
  check("CONTROL-156-valid-2.5-dataurl", c1Ok ? "PASS" : "FAIL", c1);
  const metaGap = ["M2-meta-gap-2.5-run1", "M2-meta-gap-2.5-run2", "M2-meta-gap-2.5-run3"].map((k) => ({ key: k, atSeeked: results[k]?.atSeeked ?? null, events: results[k]?.events ?? null, error: results[k]?.error ?? null }));
  const metaZero = metaGap.filter((s) => s.atSeeked === 0).length;
  check("META155-gap-2.5-dataurl", "OBSERVED", { runs: metaGap.length, landedAt0: metaZero, detail: metaGap });
  const c156Gap = ["C2-156-gap-2.5-run1", "C2-156-gap-2.5-run2"].map((k) => ({ key: k, atSeeked: results[k]?.atSeeked ?? null, events: results[k]?.events ?? null, error: results[k]?.error ?? null }));
  check("C156-gap-2.5-dataurl", "OBSERVED", { detail: c156Gap });
  const m3 = results["M3-meta-gap-1.5"] || {};
  check("META155-gap-1.5-dataurl", "OBSERVED", { events: m3.events ?? null, atSeeked: m3.atSeeked ?? null, error: m3.error ?? null });

  console.log(JSON.stringify({ checks, results }, null, 2));
  const failed = checks.filter((c) => c.status === "FAIL").length;
  log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed + " | scratch " + SCRATCH);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
