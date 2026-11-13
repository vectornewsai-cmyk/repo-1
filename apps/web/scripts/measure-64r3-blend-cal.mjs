#!/usr/bin/env node
/**
 * measure-64r3-blend-cal.mjs — Phase 9 đợt 64, luồng R3: kiểm tra lại
 * thang blend piecewise đợt 63 còn khớp hqdn3d không (B-only, tách riêng
 * khỏi fps-cal vì phase A2 bench của fps-cal hay làm CDP timeout 60s
 * dưới tải — xem LIMITS đợt 64 R3 §2).
 *
 * Đo (tab trắng, offscreen canvas, cùng metric đợt 62/63 — giảm std RGB
 * mean vùng trung tâm + step-edge 25–75%):
 *   - V0 linear a=s (đối chứng — phải tái tạo số đợt 62: -28.9/-48.4/
 *     -73.6/-83.7% trên flat15 720p, sai số cho phép ±2).
 *   - V3 piecewise (đã ship — kỳ vọng đợt 63: -18.5/-45.7/-73.8/-82.9%,
 *     sai tối đa 1.3 so với hqdn3d -19/-47/-74/-83%).
 *   - hqdn3d cùng metric (frame hq15_x.png / hq40_x.png).
 *   - Step-edge ở cả 2 biến thể, 2 khổ (720p + preview 488×275).
 *   - Lặp lại V3 1 lần trên flat15 720p (kiểm tra ổn định số).
 * Verdict B: V3 maxErr ≤ 10, đơn điệu, s=0.3 giảm > 10% (hết vùng chết),
 * edge s=0.5 = 0px — cùng tiêu chí fps-cal B.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/measure-64r3-blend-cal.mjs
 * Env: R3_BLEND_OUT (mặc định hidden_files/round64-r3/blend-cal-r64.json).
 * Exit 0 khi B PASS, 1 khi B FAIL, 2 harness lỗi. KHÔNG sửa code sản
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
const SCRATCH_TXT = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3-scratch.txt");
const MEDIA_DIR = fs.existsSync(SCRATCH_TXT)
  ? path.join(fs.readFileSync(SCRATCH_TXT, "utf8").trim(), "media")
  : path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const OUT = process.env.R3_BLEND_OUT || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round64-r3", "blend-cal-r64.json");
const PROFILE = "/tmp/round64-r3/probe-profile";
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir)
      .filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome"))
      .filter((p) => fs.existsSync(p))
      .sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}
const CHROME = findChrome() || (() => { throw new Error("không thấy chrome trong ~/.cache/ms-playwright"); })();
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
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

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout 120s: ${method}`)); }, 120000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
}

// Đo giảm std qua composite blend — đúng cơ chế preview.tsx:
// (1-a)·gốc + a·blur(3.0px). mode "linear": a=s (đợt 62, đối chứng);
// mode "piecewise": a nội suy qua (0,0),(0.3,0.195),(0.5,0.486),
// (0.8,0.806),(1,0.981) — phải khớp lib/enhancePreview.ts.
// (Sao chép BLEND_CAL_FN của clicktest-61r3-fps-cal.mjs, thêm mode.)
const CAL_FN = (imgUrl, levels, targetW, targetH, mode) => `(async () => {
  const alphaOf = (s) => {
    if (${JSON.stringify(mode)} === "linear") return s;
    const pts = [[0, 0], [0.3, 0.195], [0.5, 0.486], [0.8, 0.806], [1, 0.981]];
    if (s <= 0) return 0;
    for (let i = 1; i < pts.length; i++) {
      if (s <= pts[i][0]) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return y0 + ((s - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return 0.981;
  };
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("không tải được ảnh")); img.src = ${JSON.stringify(imgUrl)}; });
  const W = ${targetW} || img.naturalWidth, H = ${targetH} || img.naturalHeight;
  const base = document.createElement("canvas"); base.width = W; base.height = H;
  base.getContext("2d").drawImage(img, 0, 0, W, H);
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const step = 2;
  const stats = (data) => {
    let n = 0; const sum = [0, 0, 0]; const sq = [0, 0, 0];
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) { const v = data[i + c]; sum[c] += v; sq[c] += v * v; }
      n++;
    }
    const std = [0, 1, 2].map((c) => Math.sqrt(Math.max(0, sq[c] / n - (sum[c] / n) ** 2)));
    return { n, std, stdMean: (std[0] + std[1] + std[2]) / 3 };
  };
  let baseData = null; let baseStats = null;
  const rows = [];
  for (const s of ${JSON.stringify(levels)}) {
    const a = alphaOf(s);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(base, 0, 0);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.filter = "blur(3.00px)";
      ctx.drawImage(base, 0, 0);
      ctx.restore();
      ctx.filter = "none";
    }
    const data = ctx.getImageData(0, 0, W, H).data;
    const st = stats(data);
    if (baseData === null) { baseData = data; baseStats = st; rows.push({ strength: s, alpha: a, ...st, stdReductPct: 0, meanAbsDiff: 0 }); continue; }
    let sum = 0, cnt = 0;
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let ch = 0; ch < 3; ch++) { sum += Math.abs(data[i + ch] - baseData[i + ch]); cnt++; }
    }
    rows.push({ strength: s, alpha: a, ...st, stdReductPct: +(((baseStats.stdMean - st.stdMean) / baseStats.stdMean) * 100).toFixed(1), meanAbsDiff: +(sum / cnt).toFixed(3) });
  }
  return { w: W, h: H, baseStdMean: +baseStats.stdMean.toFixed(3), rows };
})()`;

// Step-edge: nửa đen nửa trắng; đo độ rộng chuyển tiếp 25%→75% ở hàng giữa.
const STEP_EDGE_FN = (W, H, levels, mode) => `(() => {
  const alphaOf = (s) => {
    if (${JSON.stringify(mode)} === "linear") return s;
    const pts = [[0, 0], [0.3, 0.195], [0.5, 0.486], [0.8, 0.806], [1, 0.981]];
    if (s <= 0) return 0;
    for (let i = 1; i < pts.length; i++) {
      if (s <= pts[i][0]) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return y0 + ((s - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return 0.981;
  };
  const edge = document.createElement("canvas"); edge.width = ${W}; edge.height = ${H};
  const ectx = edge.getContext("2d");
  ectx.fillStyle = "#000"; ectx.fillRect(0, 0, ${W} / 2, ${H});
  ectx.fillStyle = "#fff"; ectx.fillRect(${W} / 2, 0, ${W} / 2, ${H});
  const rows = [];
  for (const s of ${JSON.stringify(levels)}) {
    const a = alphaOf(s);
    const c = document.createElement("canvas"); c.width = ${W}; c.height = ${H};
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(edge, 0, 0);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.filter = "blur(3.00px)";
      ctx.drawImage(edge, 0, 0);
      ctx.restore();
      ctx.filter = "none";
    }
    const y = Math.floor(${H} / 2);
    const data = ctx.getImageData(0, y, ${W}, 1).data;
    const v = (x) => data[x * 4];
    let x25 = -1, x75 = -1;
    for (let x = 0; x < ${W}; x++) { if (x25 < 0 && v(x) >= 64) x25 = x; if (x75 < 0 && v(x) >= 192) x75 = x; }
    rows.push({ strength: s, alpha: a, width25_75: (x25 >= 0 && x75 >= 0) ? x75 - x25 : -1, vAtCenter: v(Math.floor(${W} / 2)) });
  }
  return { w: ${W}, h: ${H}, rows };
})()`;

async function main() {
  let server = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
  };
  process.on("exit", killAll);
  try {
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 190; n <= 199; n++) {
        const d = `:${n}`;
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
          log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
        }
        return d;
      }
      return null;
    }
    const DISPLAY = await pickDisplay();
    if (!DISPLAY) throw new Error("hết display trống :190–:199");
    const PORT = await pickFreePort(5790, 5799);
    const DEBUG_PORT = await pickFreePort(9670, 9679);
    if (!PORT || !DEBUG_PORT) throw new Error("hết cổng trống");
    server = http.createServer((req, res) => {
      const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "");
      const fp = path.join(MEDIA_DIR, name);
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (!name || name.includes("..") || !fs.existsSync(fp)) { res.statusCode = 404; res.end("nf"); return; }
      res.setHeader("Content-Type", name.endsWith(".png") ? "image/png" : "video/mp4");
      fs.createReadStream(fp).pipe(res);
    });
    await new Promise((res) => server.listen(PORT, "127.0.0.1", res));
    log(`http :${PORT}, debug :${DEBUG_PORT}, display ${DISPLAY}, media ${MEDIA_DIR}, load ${loadAvg()}`);
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    {
      const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
      let ready = false;
      for (let i = 0; i < 30 && !ready; i++) {
        if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
        else await sleep(500);
      }
      if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s (socket ${sock} chưa có)`);
    }
    fs.mkdirSync("/tmp/round64-r3/tmp", { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: "ignore", env: { ...process.env, DISPLAY, TMPDIR: "/tmp/round64-r3/tmp" } });
    let pageTarget = null;
    for (let i = 0; i < 120 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error("không lấy được page target CDP");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    const U = (f) => `http://127.0.0.1:${PORT}/${f}`;
    const LEVELS = [0, 0.3, 0.5, 0.8, 1.0];
    const HQ_TARGETS = { 0.3: 19, 0.5: 47, 0.8: 74, 1.0: 83 };
    const out = { mode: "B-only round64", loadStart: loadAvg() };

    for (const mode of ["linear", "piecewise"]) {
      out[mode] = {};
      for (const [name, file, W, H] of [
        ["flat15-720p", "frame15.png", null, null],
        ["flat15-preview", "frame15.png", 488, 275],
        ["flat40-720p", "frame40.png", null, null],
        ["flat40-preview", "frame40.png", 488, 275],
      ]) {
        const t0 = Date.now();
        const cal = await cdp.evalJs(CAL_FN(U(file), LEVELS, W, H, mode));
        out[mode][name] = cal;
        log(`CAL ${mode} ${name}: base std ${cal.baseStdMean} — ` + cal.rows.map((r) => `s=${r.strength}→-${r.stdReductPct}%`).join(", ") + ` (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      }
      for (const [name, W, H] of [["edge-720p", 1280, 720], ["edge-preview", 488, 275]]) {
        const e = await cdp.evalJs(STEP_EDGE_FN(W, H, LEVELS, mode));
        out[mode][name] = e;
        log(`EDGE ${mode} ${name}: ` + e.rows.map((r) => `s=${r.strength}→${r.width25_75}px`).join(", "));
      }
    }
    // hqdn3d cùng metric.
    out.hqdn3d = {};
    for (const [key, orig, hq] of [
      ["flat15-s0.3", "frame15.png", "hq15_0.3.png"],
      ["flat15-s0.5", "frame15.png", "hq15_0.5.png"],
      ["flat15-s0.8", "frame15.png", "hq15_0.8.png"],
      ["flat15-s1.0", "frame15.png", "hq15_1.0.png"],
      ["flat40-s0.5", "frame40.png", "hq40_0.5.png"],
      ["flat40-s1.0", "frame40.png", "hq40_1.0.png"],
    ]) {
      const b = await cdp.evalJs(CAL_FN(U(orig), [0], null, null, "piecewise"));
      const h = await cdp.evalJs(CAL_FN(U(hq), [0], null, null, "piecewise"));
      const reduct = +(((b.baseStdMean - h.baseStdMean) / b.baseStdMean) * 100).toFixed(1);
      out.hqdn3d[key] = { base: b.baseStdMean, hq: h.baseStdMean, reduct };
      log(`HQDN3D ${key}: base ${b.baseStdMean} → hq ${h.baseStdMean} (giảm ${reduct}%)`);
    }
    // Lặp lại V3 1 lần trên flat15 720p.
    const rep = await cdp.evalJs(CAL_FN(U("frame15.png"), LEVELS, null, null, "piecewise"));
    out.repeatPiecewiseFlat15 = rep;
    log(`LẶP LẠI V3 flat15-720p: ` + rep.rows.map((r) => `s=${r.strength}→-${r.stdReductPct}%`).join(", "));

    // Verdict B (cùng tiêu chí fps-cal B).
    const v3 = out.piecewise["flat15-720p"].rows.filter((r) => r.strength > 0);
    const v3Errs = v3.map((r) => ({ s: r.strength, reduct: r.stdReductPct, target: HQ_TARGETS[r.strength], err: +(Math.abs(r.stdReductPct - HQ_TARGETS[r.strength])).toFixed(1) }));
    const v3MaxErr = Math.max(...v3Errs.map((e) => e.err));
    const v3Mono = v3.every((r, i) => i === 0 || r.stdReductPct > v3[i - 1].stdReductPct);
    const v3NoDead = (out.piecewise["flat15-720p"].rows.find((r) => r.strength === 0.3)?.stdReductPct ?? 0) > 10;
    const v3EdgeOk = out.piecewise["edge-720p"].rows.find((r) => r.strength === 0.5)?.width25_75 === 0;
    const v0 = out.linear["flat15-720p"].rows.filter((r) => r.strength > 0);
    const v0Expect = { 0.3: 28.9, 0.5: 48.4, 0.8: 73.6, 1.0: 83.7 };
    const v0Errs = v0.map((r) => +(Math.abs(r.stdReductPct - v0Expect[r.strength])).toFixed(1));
    const v0MaxErr = Math.max(...v0Errs);
    const repErrs = rep.rows.filter((r) => r.strength > 0).map((r, i) => Math.abs(r.stdReductPct - v3[i].stdReductPct));
    const repMaxDiff = Math.max(...repErrs);
    const detail = `V3 piecewise 720p flat15: ` + v3Errs.map((e) => `s=${e.s} giảm ${e.reduct}% (hqdn3d -${e.target}%, sai ${e.err})`).join(", ")
      + `; maxErr=${v3MaxErr}, mono=${v3Mono}, noDead=${v3NoDead}, edge s=0.5=${out.piecewise["edge-720p"].rows.find((r) => r.strength === 0.5)?.width25_75}px`
      + `; V0 linear đối chứng sai tối đa ${v0MaxErr} so với số đợt 62 (kỳ vọng ≤2)`
      + `; lặp lại V3 chênh tối đa ${repMaxDiff.toFixed(1)} (kỳ vọng ≤0.5)`
      + `; 488×275: ` + out.piecewise["flat15-preview"].rows.map((r) => `s=${r.strength}→-${r.stdReductPct}%`).join(" ");
    out.verdict = { v3MaxErr, v3Mono, v3NoDead, v3EdgeOk, v0MaxErr, repMaxDiff, detail };
    if (v3MaxErr <= 10 && v3Mono && v3NoDead && v3EdgeOk && v0MaxErr <= 2 && repMaxDiff <= 0.5) {
      log(`PASS B hiệu chuẩn blend (B-only): ${detail}`);
      process.exitCode = 0;
    } else {
      log(`FAIL B hiệu chuẩn blend (B-only): ${detail}`);
      process.exitCode = 1;
    }
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
    log(`đã ghi ${OUT}, load cuối ${loadAvg()}`);
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
