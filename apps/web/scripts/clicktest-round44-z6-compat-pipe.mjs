// clicktest-round44-z6-compat-pipe.mjs — Phase 9 đợt 44, luồng Z6:
// kiểm chứng mức runtime app-level trên Chromium thật (headed qua Xvfb
// + pipe CDP, mẫu script Y6 đợt 43):
//   F. importFiles THẬT của store (bundle store.ts nguyên vẹn) khi
//      IndexedDB vắng mặt trong trang thật: phải resolve (không reject),
//      media vẫn vào bin, không unhandled rejection. Đây là mức runtime
//      app-level mà Y6 §7.7 còn nợ — khác test Node Y6 chỉ chứng minh
//      `new AssetStore()` ném khi IDB vắng.
//   G. Badge engine qua i18n trong browser thật: cùng hàm thuần
//      resolveReverseEngineBadge + cùng t() key reverseEngine.* mà
//      preview.tsx dùng, đổi lang vi/en cho ra đúng chuỗi dict.
//
// "IDB vắng" được tạo bằng cách xóa/ghi đè window.indexedDB TRƯỚC khi
// import store (ghi rõ phương pháp nào thành công trong kết quả; nếu
// Chrome không cho xóa/ghi đè thì test FAIL rõ ràng, không kết luận
// bừa). KHÔNG mạo nhận là Safari/Firefox/máy thật — chỉ là Chromium
// headed với IDB bị gỡ.
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/clicktest-round44-z6-compat-pipe.mjs
// Script tự bundle ra scratch ngoài repo (không vào batch), tự bật
// Xvfb riêng không -auth trong :90-:93, tự dọn profile Chrome khi xong.
// Exit 0 khi mọi kiểm tra bắt buộc pass; exit 1 khi có kiểm tra fail.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "z6-scratch", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93]) {
    if (!fs.existsSync(`/tmp/.X11-unix/X${n}`)) return `:${n}`;
  }
  return null;
}
const DISPLAY = process.env.Z6_DISPLAY || pickFreeDisplay();
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
  const esbuild = path.join(REPO, "node_modules", ".bin", "esbuild");
  execFileSync(esbuild, [path.join(WEB_DIR, "src", "store.ts"), "--bundle", "--platform=browser", "--format=esm", `--outfile=${path.join(SCRATCH, "store.mjs")}`], { stdio: "ignore" });
  execFileSync(esbuild, [path.join(WEB_DIR, "src", "lib", "reversePlayback.ts"), "--bundle", "--platform=browser", "--format=esm", `--outfile=${path.join(SCRATCH, "reversePlayback.mjs")}`], { stdio: "ignore" });
  execFileSync(esbuild, [path.join(WEB_DIR, "src", "i18n", "index.ts"), "--bundle", "--platform=browser", "--format=esm", `--outfile=${path.join(SCRATCH, "i18n.mjs")}`], { stdio: "ignore" });
  fs.writeFileSync(path.join(SCRATCH, "page.html"), `<!doctype html><meta charset="utf-8"><title>Z6 compat</title>
<script type="module">
window.__z6Errors = [];
window.addEventListener("unhandledrejection", (e) => { window.__z6Errors.push("unhandledrejection:" + (e.reason && e.reason.message ? e.reason.message : String(e.reason))); });
window.addEventListener("error", (e) => { window.__z6Errors.push("error:" + e.message); });
// ROUND44-Z6: gỡ IndexedDB TRƯỚC khi import store — defaultFactory()
// trong assetStore.ts đọc globalThis.indexedDB lúc new AssetStore(),
// nên gỡ trước import là đủ để mô phỏng "IDB vắng" ở mức runtime.
const idbBefore = typeof indexedDB;
let removeMethod = "none";
try { if (delete window.indexedDB) removeMethod = "delete"; } catch (e) { removeMethod = "delete-throw:" + e.message; }
if (typeof indexedDB !== "undefined") {
  try {
    Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true, writable: true });
    if (typeof indexedDB === "undefined") removeMethod = "defineProperty-undefined";
  } catch (e) { removeMethod = "defineProperty-throw:" + e.message; }
}
const idbAfter = typeof indexedDB;
const result = { idbBefore, idbAfter, removeMethod };
try {
  const storeMod = await import("./store.mjs");
  const badgeMod = await import("./reversePlayback.mjs");
  const i18nMod = await import("./i18n.mjs");
  const { useStore } = storeMod;
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const file = new File([bytes], "z6-test.png", { type: "image/png" });
  let resolved = false;
  let importError = null;
  try { await useStore.getState().importFiles([file]); resolved = true; }
  catch (e) { importError = e && e.message ? e.message : String(e); }
  const media = useStore.getState().media;
  result.importFiles = { resolved, importError, mediaCount: media.length, names: media.map((m) => m.name), idbAtCall: typeof indexedDB };
  const detailed = badgeMod.resolveReverseEngineDetailed(true, { videoDecoder: true, encodedVideoChunk: true, videoFrame: true });
  const badge = badgeMod.resolveReverseEngineBadge(detailed, true);
  i18nMod.setLang("vi");
  const viText = i18nMod.t("reverseEngine.badgeWebcodecs");
  i18nMod.setLang("en");
  const enText = i18nMod.t("reverseEngine.badgeWebcodecs");
  const missing = badgeMod.resolveReverseEngineBadge({ engine: "element", reason: "missing-video-decoder" }, true);
  const enMissing = i18nMod.t("reverseEngine.badgeElementMissing", { api: missing.missingApi });
  result.badgeI18n = { viText, enText, enMissing, badgeKind: badge.kind };
} catch (e) { result.fatal = (e && e.message ? e.message : String(e)) + "\\n" + String((e && e.stack) || "").slice(0, 500); }
result.unhandled = window.__z6Errors;
window.__z6Result = result;
window.__z6Ready = true;
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
      ready = await cdp.evaluate("!!window.__z6Ready", cdp.sessionId).catch(() => false);
    }
    if (!ready) fail("trang test không ready sau 30s");
    const result = await cdp.evaluate("window.__z6Result", cdp.sessionId);
    const checks = [];
    const check = (name, cond, detail) => { checks.push({ name, pass: !!cond, detail }); log(`${cond ? "PASS" : "FAIL"} ${name} ${detail !== undefined ? JSON.stringify(detail) : ""}`); };
    check("F-importFiles-idb-absent-runtime",
      result.idbAfter === "undefined" && result.importFiles && result.importFiles.resolved === true
      && result.importFiles.importError === null && result.importFiles.mediaCount >= 1
      && result.importFiles.names.includes("z6-test.png") && result.importFiles.idbAtCall === "undefined",
      result);
    check("F2-no-unhandled-rejection",
      Array.isArray(result.unhandled) && result.unhandled.length === 0, result.unhandled);
    check("G-badge-i18n-headed",
      result.badgeI18n && result.badgeI18n.viText === "◀ NGƯỢC: WEBCODECS"
      && result.badgeI18n.enText === "◀ REVERSE: WEBCODECS"
      && result.badgeI18n.enMissing === "◀ REVERSE: ELEMENT (missing VideoDecoder)"
      && result.badgeI18n.badgeKind === "webcodecs",
      result.badgeI18n);
    const failed = checks.filter((c) => !c.pass);
    console.log(JSON.stringify({ result, checks }, null, 2));
    if (failed.length > 0) { console.error(`Z6 headed: ${failed.length}/${checks.length} FAIL`); process.exitCode = 1; }
    else log(`Z6 headed: ${checks.length}/${checks.length} PASS (gỡ IDB bằng: ${result.removeMethod})`);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("BLOCKER:", e?.message || e); process.exit(2); });
