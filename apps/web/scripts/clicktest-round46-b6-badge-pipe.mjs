// clicktest-round46-b6-badge-pipe.mjs — Phase 9 đợt 46, luồng B6.
//
// Bằng chứng headed trên Chromium thật (Xvfb headed, pipe CDP, mẫu
// Z6 đợt 44 / probe A6 đợt 45) cho 2 nợ A6 §5.2:
//  (a) Effect đổi lang lúc pause: khi vòng lặp preview NGỦ (không
//      tick nào chạy), đổi lang vẫn refresh badge ngay.
//  (b) Badge failed hiển thị đúng khi controller.failed.
//
// MỨC BẰNG CHỨNG — ĐỌC KỸ, KHÔNG PHÓNG ĐẠI: đây là mức HELPER,
// không phải app đầy đủ. Trang test bundle MODULE THẬT của repo
// (reverseBadge45A6.ts sau sửa B6, reversePlayback.ts, i18n/index.ts
// đọc vi.json/en.json thật, reverseBadge46B6.ts) + phần tử DOM
// badge thật (cùng class preview-reverse-engine-badge, cùng cách
// ghi textContent/title/background/display như preview.tsx).
// Phần "effect" trong trang là bản sao từng dòng thân effect
// [previewLang] của preview.tsx (đọc badge đã lưu -> display qua
// t() hiện tại -> ghi DOM), chạy khi KHÔNG có tick nào đang chạy
// (mô phỏng vòng lặp ngủ lúc pause — trang không đặt rAF/interval
// nào sau tick khởi tạo). Điều này chứng minh: hàm display thật +
// dict thật + ghi DOM thật hoạt động trên Chromium khi loop dừng.
// Nó KHÔNG chứng minh wiring React thật (effect [previewLang] có
// chạy khi user bấm nút đổi lang ở TopBar trong app đầy đủ không,
// ref badge đã được tick điền chưa) — phần đó vẫn chỉ có tsc +
// đọc code, và vẫn là nợ mở cho click-test app đầy đủ (cần footage
// thật + clip reverse + pause + bấm đổi lang, xem LIMITS B6 §5).
// Tương tự, (b) chứng minh display của badge failed qua dict thật
// trên Chromium, không phải controller.failed thật từ footage hỏng
// trong app (cần fixture footage hỏng + đường chạy app đầy đủ).
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/clicktest-round46-b6-badge-pipe.mjs
// Script tự bundle ra tmpdir (không vào repo, không vào batch), tự
// bật Xvfb riêng trong :90-:99; nếu hết display thì rơi về
// --headless=new (vẫn Chromium thật, ghi rõ mode ở output).
// Exit 0 khi mọi kiểm tra bắt buộc pass; exit 1 khi có FAIL;
// exit 2 khi thiếu Chrome (khi đó KHÔNG có bằng chứng để báo).
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "b6-headed-"));
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const viJson = JSON.parse(fs.readFileSync(path.join(WEB_DIR, "src", "i18n", "vi.json"), "utf8"));
const enJson = JSON.parse(fs.readFileSync(path.join(WEB_DIR, "src", "i18n", "en.json"), "utf8"));
function pickFreeDisplay() {
  for (let n = 90; n <= 99; n++) {
    if (!fs.existsSync(`/tmp/.X11-unix/X${n}`)) return `:${n}`;
  }
  return null;
}
const DISPLAY = process.env.B6_DISPLAY || pickFreeDisplay();
const MODE = DISPLAY ? `headed Xvfb ${DISPLAY}` : "headless=new (hết display :90-:99)";
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
  const esbuild = path.join(REPO, "node_modules", ".bin", "esbuild");
  for (const [src, out] of [
    ["src/lib/reverseBadge45A6.ts", "badge45.mjs"],
    ["src/lib/reversePlayback.ts", "reversePlayback.mjs"],
    ["src/lib/reverseBadge46B6.ts", "badge46.mjs"],
    ["src/i18n/index.ts", "i18n.mjs"],
  ]) {
    execFileSync(esbuild, [path.join(WEB_DIR, src), "--bundle", "--platform=browser", "--format=esm", `--outfile=${path.join(SCRATCH, out)}`], { stdio: "ignore" });
  }
  fs.writeFileSync(path.join(SCRATCH, "page.html"), `<!doctype html><meta charset="utf-8"><title>B6 badge headed</title>
<style>.preview-reverse-engine-badge{position:absolute;left:8px;bottom:32px;padding:2px 8px;border-radius:4px;color:#fff;font-size:12px;font-weight:700;}</style>
<div class="preview-reverse-engine-badge" id="badge" style="display:none"></div>
<script type="module">
import { resolveReverseEngineBadge45A6, reverseEngineBadgeDisplay45A6 } from "./badge45.mjs";
import { collectReverseTrackBadges, renderSingleBadgeFromTracks } from "./badge46.mjs";
import * as i18nMod from "./i18n.mjs";
const el = document.getElementById("badge");
// Tick khởi tạo DUY NHẤT (mô phỏng tick đã điền badge trước khi pause).
let tickCount = 0;
function tickWrite(badge) {
  tickCount++;
  const d = reverseEngineBadgeDisplay45A6(badge, i18nMod.t);
  el.textContent = d.text; el.title = d.title;
  if (d.bg) el.style.background = d.bg;
  el.style.display = d.text ? "block" : "none";
  return d;
}
// Thân effect [previewLang] của preview.tsx, sao từng dòng (đọc badge
// đã lưu -> display qua t() hiện tại -> ghi DOM). Sau tick khởi tạo,
// trang KHÔNG đặt rAF/interval nào: vòng lặp đang "ngủ" như lúc pause.
function langEffect(savedBadge) {
  const d = reverseEngineBadgeDisplay45A6(savedBadge, i18nMod.t);
  el.textContent = d.text; el.title = d.title;
  if (d.bg) el.style.background = d.bg;
  el.style.display = d.text ? "block" : "none";
  return d;
}
const result = { ua: navigator.userAgent, videoDecoder: typeof VideoDecoder };
try {
  i18nMod.setLang("vi");
  const WC = { engine: "webcodecs", reason: "webcodecs-ok" };
  // (b) Badge failed: controllerFailed=true -> element-failed.
  const failedBadge = resolveReverseEngineBadge45A6(WC, true, true);
  result.failedKind = failedBadge && failedBadge.kind;
  result.failedControllerFailed = failedBadge && failedBadge.controllerFailed;
  tickWrite(failedBadge);
  result.afterTickVi = { text: el.textContent, title: el.title, bg: el.style.background, display: el.style.display, tickCount };
  // (a) Đổi lang lúc pause: KHÔNG tick nào chạy thêm, chỉ effect.
  i18nMod.setLang("en");
  langEffect(failedBadge);
  result.afterLangEn = { text: el.textContent, title: el.title, bg: el.style.background, display: el.style.display, tickCount, lang: i18nMod.getLang() };
  // Đổi ngược về vi, vẫn không tick.
  i18nMod.setLang("vi");
  langEffect(failedBadge);
  result.afterLangViAgain = { text: el.textContent, title: el.title, tickCount };
  // Badge webcodecs đổi lang lúc pause cũng phải đổi chuỗi.
  const wcBadge = resolveReverseEngineBadge45A6(WC, true, false);
  tickWrite(wcBadge);
  const ticksBeforeLang = tickCount;
  i18nMod.setLang("en");
  langEffect(wcBadge);
  result.wcAfterLangEn = { text: el.textContent, title: el.title, tickCount, ticksBeforeLang };
  // Per-track (tầng thuần): collect 2, render đơn 1.
  const per = collectReverseTrackBadges([
    { trackId: "t0", trackIndex: 0, clipId: "c0", atPlayhead: true, stepping: true, detailed: WC, controllerFailed: false },
    { trackId: "t1", trackIndex: 1, clipId: "c1", atPlayhead: true, stepping: true, detailed: WC, controllerFailed: true },
  ]);
  result.perTrack = { count: per.length, kinds: per.map((e) => e.badge.kind), single: renderSingleBadgeFromTracks(per).trackId };
} catch (e) { result.fatal = (e && e.message ? e.message : String(e)); }
window.__b6Result = result;
window.__b6Ready = true;
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
  log(`scratch server tại ${ORIGIN} (mode: ${MODE})`);
  let xvfb = null; let chrome = null; let profileDir = null;
  const cleanup = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGTERM"); } catch {}
    try { server.close(); } catch {}
    try { if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch {}
  };
  process.on("exit", cleanup);
  try {
    if (DISPLAY) {
      const num = DISPLAY.replace(":", "");
      const sock = `/tmp/.X11-unix/X${num}`;
      if (fs.existsSync(sock)) fail(`display ${DISPLAY} vừa bị luồng khác chiếm`);
      xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
      for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
      if (!fs.existsSync(sock)) fail("Xvfb không tạo socket");
      log(`đã bật Xvfb riêng ${DISPLAY} (headed thật)`);
    }
    profileDir = path.join(SCRATCH, `chrome-profile-${process.pid}`);
    const args = ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check",
      "--hide-scrollbars", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required",
      `--user-data-dir=${profileDir}`, "--window-size=1280,800", "--window-position=0,0"];
    if (!DISPLAY) args.push("--headless=new");
    args.push("about:blank");
    chrome = spawn(CHROME, args, { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, ...(DISPLAY ? { DISPLAY } : {}) } });
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
      ready = await cdp.evaluate("!!window.__b6Ready", cdp.sessionId).catch(() => false);
    }
    if (!ready) fail("trang test không ready sau 30s");
    const result = await cdp.evaluate("window.__b6Result", cdp.sessionId);
    const checks = [];
    const check = (name, cond, detail) => { checks.push({ name, pass: !!cond, detail }); log(`${cond ? "PASS" : "FAIL"} ${name} ${detail !== undefined ? JSON.stringify(detail) : ""}`); };
    const expViFailed = viJson.reverseEngine.badgeElementFailed;
    const expEnFailed = enJson.reverseEngine.badgeElementFailed;
    const expViTitle = viJson.reverseEngine.titleElementFailed;
    const expEnTitle = enJson.reverseEngine.titleElementFailed;
    check("B-failed-kind", result.failedKind === "element-failed" && result.failedControllerFailed === true, { failedKind: result.failedKind, failedControllerFailed: result.failedControllerFailed });
    check("B-failed-vi-dom", result.afterTickVi && result.afterTickVi.text === expViFailed && result.afterTickVi.title === expViTitle && result.afterTickVi.display === "block", result.afterTickVi);
    check("A-lang-pause-en", result.afterLangEn && result.afterLangEn.text === expEnFailed && result.afterLangEn.title === expEnTitle && result.afterLangEn.tickCount === 1 && result.afterLangEn.lang === "en", result.afterLangEn);
    check("A-lang-pause-vi-again", result.afterLangViAgain && result.afterLangViAgain.text === expViFailed && result.afterLangViAgain.tickCount === 1, result.afterLangViAgain);
    check("A-lang-pause-wc", result.wcAfterLangEn && result.wcAfterLangEn.text === enJson.reverseEngine.badgeWebcodecs && result.wcAfterLangEn.tickCount === result.wcAfterLangEn.ticksBeforeLang, result.wcAfterLangEn);
    check("P-pertrack-headed", result.perTrack && result.perTrack.count === 2 && result.perTrack.kinds[0] === "webcodecs" && result.perTrack.kinds[1] === "element-failed" && result.perTrack.single === "t0", result.perTrack);
    check("no-fatal", !result.fatal, result.fatal);
    console.log(JSON.stringify({ mode: MODE, result, checks }, null, 2));
    const failed = checks.filter((c) => !c.pass);
    if (failed.length > 0) { console.error(`B6 headed: ${failed.length}/${checks.length} FAIL`); process.exitCode = 1; }
    else log(`B6 headed: ${checks.length}/${checks.length} PASS (mode: ${MODE}; UA: ${result.ua})`);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("BLOCKER:", e?.message || e); process.exit(2); });
