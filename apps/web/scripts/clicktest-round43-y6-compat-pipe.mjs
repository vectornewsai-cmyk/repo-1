// clicktest-round43-y6-compat-pipe.mjs — Phase 9 đợt 43, luồng Y6:
// kiểm chứng tương thích/fallback đường phát ngược trên Chromium thật
// (headed qua Xvfb + pipe CDP, mẫu script T5 đợt 37).
//
// Trang test CHỈ bundle module thuần reversePlayback.ts (không chạy
// toàn bộ app): đo resolveReverseEngine / resolveReverseEngineDetailed
// trong browser thật. "API vắng mặt" được giả lập 2 cách, ghi rõ cách
// nào trong kết quả — KHÔNG mạo nhận là Safari/Firefox/máy thật:
//   (a) xóa global qua CDP Runtime.evaluate (delete window.X): nếu
//       Chrome cho xóa thì đây là vắng API thật trong trang đó;
//       nếu Chrome không cho xóa thì bước này chỉ báo cáo, không tính
//       fail, và bước (b) mới là bằng chứng logic.
//   (b) truyền caps thiếu vào resolveReverseEngineDetailed: chứng minh
//       logic fallback chạy đúng trong browser thật, với đầu vào vắng
//       API được mô phỏng tường minh.
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/clicktest-round43-y6-compat-pipe.mjs
// Script tự bundle module ra scratch ngoài repo (không vào batch),
// tự bật Xvfb :99 nếu chưa có, tự dọn profile Chrome khi xong.
// Exit 0 khi mọi kiểm tra bắt buộc pass; exit 1 khi có kiểm tra bắt
// buộc fail; bước xóa global thất bại KHÔNG làm exit 1 (xem trên).
import { spawn, spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "y6-scratch", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
// ROUND43-Y6: KHÔNG dùng chung Xvfb của luồng khác — Xvfb chạy qua
// xvfb-run kèm -auth nên process khác thiếu XAUTHORITY sẽ bị Chrome
// từ chối ("Missing X server or $DISPLAY", đã gặp khi dùng chung :99
// của luồng Y2). Script tự chọn display trống trong :90-:93 và bật
// Xvfb riêng không -auth.
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93]) {
    if (!fs.existsSync(`/tmp/.X11-unix/X${n}`)) return `:${n}`;
  }
  return null;
}
const DISPLAY = process.env.Y6_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log(`[${stamp()}]`, ...a); }
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
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result?.value;
  }
}

async function main() {
  if (!fs.existsSync(CHROME)) fail(`không có chrome ${CHROME}`);
  fs.mkdirSync(SCRATCH, { recursive: true });
  // Bundle module thuần ra scratch (không vào repo/batch).
  execFileSync(path.join(REPO, "node_modules", ".bin", "esbuild"),
    [path.join(WEB_DIR, "src", "lib", "reversePlayback.ts"), "--bundle", "--platform=browser", "--format=esm",
     `--outfile=${path.join(SCRATCH, "reversePlayback.mjs")}`], { stdio: "ignore" });
  fs.writeFileSync(path.join(SCRATCH, "page.html"), `<!doctype html><meta charset="utf-8"><title>Y6 compat</title>
<script type="module">
import { resolveReverseEngine, resolveReverseEngineDetailed, isReverseWebcodecsOptedIn } from "./reversePlayback.mjs";
window.__y6 = { resolveReverseEngine, resolveReverseEngineDetailed, isReverseWebcodecsOptedIn };
window.__y6Ready = true;
</script>
`);
  const server = http.createServer((req, res) => {
    const file = path.join(SCRATCH, req.url === "/" ? "page.html" : decodeURIComponent(req.url.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": file.endsWith(".mjs") ? "text/javascript" : "text/html" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = `http://127.0.0.1:${server.address().port}`;
  log(`scratch server tại ${ORIGIN}`);

  let xvfb = null; let chrome = null; let profileDir = null;
  const cleanup = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGTERM"); } catch {}
    try { server.close(); } catch {}
    try { if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };
  process.on("exit", cleanup);
  try {
    if (!DISPLAY) fail("không còn display trống trong :90-:93 (các luồng khác đang giữ)");
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    if (fs.existsSync(sock)) fail(`display ${DISPLAY} vừa bị luồng khác chiếm`);
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) fail("Xvfb không tạo socket");
    log(`đã bật Xvfb riêng ${DISPLAY} (headed thật, không -auth)`);
    profileDir = path.join(SCRATCH, `chrome-profile-${process.pid}`);
    chrome = spawn(CHROME, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check",
      "--hide-scrollbars", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required",
      `--user-data-dir=${profileDir}`, "--window-size=1280,800", "--window-position=0,0", "about:blank"],
      { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
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
      ready = await cdp.evaluate("!!window.__y6Ready", cdp.sessionId).catch(() => false);
    }
    if (!ready) fail("trang test không ready sau 30s");

    const results = {};
    const checks = [];
    const check = (name, cond, detail) => { checks.push({ name, pass: !!cond, detail }); log(`${cond ? "PASS" : "FAIL"} ${name} ${detail !== undefined ? JSON.stringify(detail) : ""}`); };

    // A. Hỗ trợ thật của Chromium headed.
    results.support = await cdp.evaluate(`({
      videoDecoder: typeof VideoDecoder,
      encodedVideoChunk: typeof EncodedVideoChunk,
      videoFrame: typeof VideoFrame,
      userAgent: navigator.userAgent.slice(0, 80),
    })`, cdp.sessionId);
    check("A-support-present", results.support.videoDecoder === "function" && results.support.encodedVideoChunk === "function" && results.support.videoFrame === "function", results.support);

    // B. Happy path: opt-in + đủ API -> webcodecs.
    results.happy = await cdp.evaluate(`(() => {
      window.__vcutReverseWebcodecs = true;
      return { engine: window.__y6.resolveReverseEngine(), detailed: window.__y6.resolveReverseEngineDetailed() };
    })()`, cdp.sessionId);
    check("B-happy-webcodecs", results.happy.engine === "webcodecs" && results.happy.detailed.engine === "webcodecs" && results.happy.detailed.reason === "webcodecs-ok", results.happy);

    // C. Caps thiếu truyền tường minh (giả lập vắng API, ghi rõ).
    results.capsMissing = await cdp.evaluate(`({
      noDecoder: window.__y6.resolveReverseEngineDetailed(true, { videoDecoder: false, encodedVideoChunk: true, videoFrame: true }),
      noChunk: window.__y6.resolveReverseEngineDetailed(true, { videoDecoder: true, encodedVideoChunk: false, videoFrame: true }),
      noFrame: window.__y6.resolveReverseEngineDetailed(true, { videoDecoder: true, encodedVideoChunk: true, videoFrame: false }),
      optOff: window.__y6.resolveReverseEngineDetailed(false, { videoDecoder: true, encodedVideoChunk: true, videoFrame: true }),
    })`, cdp.sessionId);
    check("C-caps-missing-fallback", results.capsMissing.noDecoder.engine === "element" && results.capsMissing.noDecoder.reason === "missing-video-decoder"
      && results.capsMissing.noChunk.engine === "element" && results.capsMissing.noChunk.reason === "missing-encoded-video-chunk"
      && results.capsMissing.noFrame.engine === "element" && results.capsMissing.noFrame.reason === "missing-video-frame"
      && results.capsMissing.optOff.engine === "element" && results.capsMissing.optOff.reason === "opt-in-off", results.capsMissing);

    // D. Xóa global thật qua CDP (báo cáo, chỉ gate khi xóa được).
    results.deleteAttempt = await cdp.evaluate(`(() => {
      const out = {};
      for (const k of ["VideoDecoder", "EncodedVideoChunk", "VideoFrame"]) {
        try { out[k] = delete window[k]; } catch (e) { out[k] = "throw:" + e.message; }
        out["typeof_" + k] = typeof window[k];
      }
      return out;
    })()`, cdp.sessionId);
    const deletedDecoder = results.deleteAttempt.VideoDecoder === true && results.deleteAttempt.typeof_VideoDecoder === "undefined";
    results.afterDelete = await cdp.evaluate(`({
      engine: window.__y6.resolveReverseEngine(),
      detailed: window.__y6.resolveReverseEngineDetailed(),
    })`, cdp.sessionId);
    log(`D-delete-attempt ${JSON.stringify(results.deleteAttempt)} afterDelete=${JSON.stringify(results.afterDelete)}`);
    if (deletedDecoder) {
      check("D-deleted-decoder-falls-back", results.afterDelete.engine === "element" && results.afterDelete.detailed.reason === "missing-video-decoder", results.afterDelete);
    } else {
      log("D-delete-attempt: Chrome không cho xóa global (delete trả false / typeof vẫn function) — bước này KHÔNG tính fail, bằng chứng vắng API là bước C + test Node xóa global.");
    }

    // E. Sau khi tắt opt-in, dù API đủ cũng về element (không kẹt webcodecs).
    results.optOffLive = await cdp.evaluate(`(() => {
      window.__vcutReverseWebcodecs = false;
      return window.__y6.resolveReverseEngineDetailed();
    })()`, cdp.sessionId);
    check("E-opt-off-live", results.optOffLive.engine === "element" && results.optOffLive.reason === "opt-in-off", results.optOffLive);

    const failed = checks.filter((c) => !c.pass);
    console.log(JSON.stringify({ results, checks }, null, 2));
    if (failed.length > 0) { console.error(`Y6 headed: ${failed.length}/${checks.length} FAIL`); process.exitCode = 1; }
    else log(`Y6 headed: ${checks.length}/${checks.length} PASS (ghi chú: bước D ${deletedDecoder ? "xóa được global, đã gate" : "không xóa được global, chỉ báo cáo"})`);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("BLOCKER:", e?.message || e); process.exit(2); });
