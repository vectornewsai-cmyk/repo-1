#!/usr/bin/env node
/**
 * clicktest-m5-round30-d7.mjs — Phase 9 đợt 30, luồng M5: đo lại D7
 * text-style (đợt 26 J6 §6) trên browser thật.
 *
 * D7 gốc: text leaf trong nested KHÔNG có trường `style` làm preview
 * ném 5× `TypeError: Cannot read properties of undefined (reading
 * 'animation')` lúc load (drawTextClip đọc clip.style.animation).
 * Đợt 27 K1 đã thêm guard normalizeTextStyle ở đầu drawTextClip
 * (preview.tsx:489) + chuẩn hóa lúc load (projectRepo.ts:685).
 * Lần đo này kiểm chứng trên UI thật, không đọc code để kết luận:
 * seed 2 text clip KHÔNG style (1 nested đúng hình I6, 1 top-level
 * theo câu hỏi mở J6 §6a), load bằng autosave, chờ preview vẽ,
 * đếm Runtime.exceptionThrown — đặc biệt các exception chứa
 * 'animation'/'style'. 0 exception dạng đó = D7 đã hết trên bundle
 * đang đo; > 0 = D7 còn, báo đúng số + nội dung.
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG tag/release, KHÔNG
 * binary. Cổng 4193, display :93.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

// Phase 9 đợt 31 N5 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs):
// bundle đang đo, gán trong main() sau snapshotDist() nếu có; các
// harness không snapshot dist giữ null (snapshot vẫn ghi proc/ps).
let HANG_BUNDLE = null;

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round30-m5-d7");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.M5_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.M5_DISPLAY || ":93";
const PORT = Number(process.env.M5_PORT || 4193);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) { const l = `[${stamp()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

class PipeCdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 1; this.pending = new Map(); this.sessionId = null; this.exceptions = []; this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) this.sessionId = msg.params.sessionId;
        if (msg.method === "Runtime.exceptionThrown" && msg.params?.exceptionDetails) {
          this.exceptions.push({ at: new Date().toISOString(), text: JSON.stringify(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text ?? "exception").slice(0, 800) });
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 30000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({
            proc: this.proc, pendingCount: this.pending.size, method, timeoutMs,
            outDir: path.join(SCRATCH, "cdp-hang-snapshots"), bundle: HANG_BUNDLE,
            extra: { display: DISPLAY, port: PORT },
          });
          if (hangSnap.file) log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
          else log(`CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`);
        } catch (e) { log(`CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); }
        reject(new Error(`CDP timeout ${method} sau ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression, timeoutMs = 60000) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, this.sessionId, timeoutMs);
    if (r.exceptionDetails) throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails).slice(0, 500)}`);
    return r.result.value;
  }
}

async function waitFor(cdp, expr, label, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await cdp.evaluate(expr, 15000)) return true; } catch { /* chưa */ }
    await sleep(500);
  }
  throw new Error(`hết ${timeoutMs}ms chờ: ${label}`);
}

function startXvfb() {
  return new Promise((resolve, reject) => {
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    if (fs.existsSync(sock)) {
      try { if (spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0) { log(`Xvfb: dùng chung display ${DISPLAY}`); resolve(null); return; } } catch {}
      try { fs.unlinkSync(sock); } catch {}
    }
    const xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    (async () => {
      for (let i = 0; i < 40; i++) { if (fs.existsSync(sock)) { log(`Xvfb lên: DISPLAY=${DISPLAY}`); resolve(xvfb); return; } await sleep(250); }
      reject(new Error(`Xvfb không tạo socket ${sock}`));
    })();
  });
}

function snapshotDist() {
  const distDir = path.join(WEB_DIR, "dist");
  if (!fs.existsSync(path.join(distDir, "index.html"))) { log("BLOCKER dist: không có apps/web/dist/index.html"); return null; }
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  const m = /assets\/index-[A-Za-z0-9_-]+\.js/.exec(html);
  if (!m) { log("BLOCKER dist: không tìm được bundle trong index.html"); return null; }
  const bundlePath = path.join(distDir, m[0]);
  const sha = crypto.createHash("sha256").update(fs.readFileSync(bundlePath)).digest("hex").slice(0, 16);
  const snapDir = path.join(SCRATCH, "dist-snapshot");
  fs.rmSync(snapDir, { recursive: true, force: true });
  fs.cpSync(distDir, snapDir, { recursive: true });
  log(`dist snapshot OK: bundle ${path.basename(bundlePath)} sha256[:16]=${sha}`);
  return { bundle: path.basename(bundlePath), sha, dir: snapDir };
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webm": "video/webm", ".wasm": "application/wasm" };
    const server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
        let file = path.join(rootDir, urlPath === "/" ? "index.html" : urlPath);
        if (!file.startsWith(rootDir)) { res.writeHead(403); res.end(); return; }
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(rootDir, "index.html");
        const ext = path.extname(file);
        res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream", "Content-Length": fs.statSync(file).size });
        fs.createReadStream(file).pipe(res);
      } catch { res.writeHead(500); res.end(); }
    });
    server.listen(PORT, "127.0.0.1", () => { log(`static server lên tại ${ORIGIN}`); resolve(server); });
    server.on("error", (e) => { log(`static server lỗi: ${e.message}`); resolve(null); });
  });
}

async function startChrome() {
  for (const bin of BINARIES) {
    if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "m5-d7-"));
    const chrome = spawn(bin, ["--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", "--hide-scrollbars",
      "--autoplay-policy=no-user-gesture-required", "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1200", "about:blank"], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stderr.on("data", () => {});
    try {
      const cdp = new PipeCdp(chrome);
      await cdp.send("Target.getTargets", {}, undefined, 30000);
      const target = await cdp.send("Target.createTarget", { url: "about:blank" });
      await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
      for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
      if (!cdp.sessionId) throw new Error("không nhận được sessionId");
      await cdp.send("Page.enable", {}, cdp.sessionId);
      await cdp.send("Runtime.enable", {}, cdp.sessionId);
      log(`pipe OK (${bin}) pid=${chrome.pid}`);
      return { cdp, chrome, profile };
    } catch (e) {
      log(`BLOCKER-PIPE ${bin}: ${e.message}`);
      try { chrome.kill("SIGKILL"); } catch {}
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }
  }
  return null;
}

// Seed D7: text clip KHÔNG trường style ở cả 2 vị trí.
function subSpec(tracks) {
  return { version: "0.2.0", meta: { name: "sub", width: 1280, height: 720, fps: 30 }, tracks: tracks.map((t) => ({ id: t.id, kind: "video", clips: t.clips })) };
}
function nestedClip(id, name, inner, extra = {}) {
  return { kind: "nested", id, name, start: 0, duration: 4, trim: { in: 0, out: 4 }, subSpec: inner, ...extra };
}
function d7Seed() {
  const CONST1 = { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] };
  return {
    version: "0.2.0",
    meta: { name: "M5 D7 seed", width: 1280, height: 720, fps: 30 },
    tracks: [
      // Nested đúng hình I6: TOP-D7 > MID-D7 > text leaf không style.
      { id: "t-d7", kind: "video", clips: [nestedClip("TOP-D7", "TOP-D7",
        subSpec([{ id: "in-d7", clips: [nestedClip("MID-D7", "MID-D7",
          subSpec([{ id: "leaf-d7", clips: [{ kind: "text", id: "leaf-text-d7", text: "TEXT-BLOCKED-LEAF", start: 0, duration: 4 }] }]), {})] }]),
        { speedKeyframes: CONST1 })] },
      // Top-level: track text chứa text clip không style (câu hỏi mở J6 §6a).
      { id: "t-d7-top", kind: "text", clips: [{ kind: "text", id: "D7-TOP", text: "D7-TOP-NOSTYLE", start: 0, duration: 4 }] },
    ],
  };
}
function envelope(spec, name) {
  return JSON.stringify({ format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0", savedAt: new Date().toISOString(), name, spec });
}

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  let xvfb = null, server = null, holder = null, exitCode = 2;
  try {
    xvfb = await startXvfb();
    const snap = snapshotDist();
    HANG_BUNDLE = snap; // đợt 31 N5: timeout handler ghi bundle này vào snapshot
    if (!snap) return 2;
    server = await startStaticServer(snap.dir);
    if (!server) return 2;
    holder = await startChrome();
    if (!holder) { log("BLOCKER: không mở được pipe Chrome"); return 2; }
    const cdp = holder.cdp;
    const seed = d7Seed();
    await cdp.send("Page.navigate", { url: `${ORIGIN}/` }, cdp.sessionId);
    await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render lần đầu", 60000);
    await cdp.evaluate(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-lang", "vi"); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(seed, "M5 D7 seed"))});`);
    const loadExceptionsBefore = cdp.exceptions.length;
    await cdp.send("Page.reload", {}, cdp.sessionId);
    await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render sau reload", 60000);
    // Chờ preview vẽ qua nhiều frame (D7 gốc ném NGAY lúc load) + autosave.
    await sleep(10000);
    const loadExceptions = cdp.exceptions.slice(loadExceptionsBefore);
    const animationExceptions = loadExceptions.filter((e) => /animation|style/i.test(e.text));
    log(`exceptions sau load: tổng ${loadExceptions.length}, dạng animation/style: ${animationExceptions.length}`);
    for (const e of loadExceptions) log(`  exception: ${e.text.slice(0, 300)}`);
    // Text có hiện trong DOM preview/timeline không (tín hiệu phụ, không thay số exception)?
    const domText = await cdp.evaluate(`(() => { const t = document.body.innerText || ""; return { hasNested: t.includes("TEXT-BLOCKED-LEAF"), hasTop: t.includes("D7-TOP-NOSTYLE") }; })()`);
    log(`DOM text: ${JSON.stringify(domText)}`);
    // Autosave sau load: style đã được chuẩn hóa chưa (quan sát, không assert)?
    // + kiểm chứng seed thực sự được load (tránh kết luận 0-exception rỗng
    // vì seed bị từ chối): nested leaf còn trong spec? canvas preview có?
    let autosaveStyle = null;
    try {
      const raw = await cdp.evaluate(`localStorage.getItem("vcut-studio:autosave:v1")`);
      const spec = JSON.parse(raw).spec;
      const topClip = (spec.tracks.find((t) => t.id === "t-d7-top")?.clips || [])[0];
      const findClip = (clips, id) => {
        for (const c of clips || []) {
          if (c.id === id) return c;
          if (c.subSpec) for (const t of c.subSpec.tracks || []) { const f = findClip(t.clips, id); if (f) return f; }
        }
        return null;
      };
      const nestedLeaf = findClip(spec.tracks.flatMap((t) => t.clips), "leaf-text-d7");
      const canvasInfo = await cdp.evaluate(`(() => { const cv = document.querySelector("canvas"); return cv ? { w: cv.width, h: cv.height } : null; })()`);
      autosaveStyle = { topHasStyle: !!topClip?.style, topStyleKeys: topClip?.style ? Object.keys(topClip.style) : [],
        nestedLeafPresent: !!nestedLeaf, nestedLeafHasStyle: !!nestedLeaf?.style, nestedLeafKind: nestedLeaf?.kind ?? null,
        previewCanvas: canvasInfo };
    } catch (e) { autosaveStyle = { error: e.message }; }
    log(`autosave sau load: ${JSON.stringify(autosaveStyle)}`);
    const pass = animationExceptions.length === 0 && autosaveStyle.nestedLeafPresent === true;
    log(pass ? "D7 PASS: seed nested leaf có trong spec sau load + 0 exception dạng animation/style (D7 đã hết trên bundle này)" : `D7 FAIL: animationExceptions=${animationExceptions.length} nestedLeafPresent=${autosaveStyle.nestedLeafPresent}`);
    const out = { runAt: new Date().toISOString(), label: "m5-round30-d7", bundle: snap.bundle, bundleSha256_16: snap.sha,
      exceptionTotalAfterLoad: loadExceptions.length, animationStyleExceptions: animationExceptions.length,
      exceptions: loadExceptions, domText, autosaveStyle, pass, log: logLines };
    fs.writeFileSync(path.join(ROOT, "benchmarks", "results", "v30-m5-d7.json"), JSON.stringify(out, null, 2));
    exitCode = pass ? 0 : 1;
  } catch (e) { log(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`); exitCode = 2; }
  finally {
    try { holder?.chrome.kill("SIGKILL"); } catch {}
    try { holder?.profile && fs.rmSync(holder.profile, { recursive: true, force: true }); } catch {}
    try { server && server.close(); } catch {}
    try { xvfb && xvfb.kill("SIGKILL"); } catch {}
  }
  return exitCode;
}
process.exit(await main());
