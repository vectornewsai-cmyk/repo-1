#!/usr/bin/env node
/**
 * Phase 9 đợt 30, luồng M2: bản đo pass xuôi sau sửa playhead snap (đợt 29 L2).
 * Khác K4 gốc: SCRATCH qua env M2_SCRATCH, ghi wall từng mẫu, thêm số pass xuôi
 * (wallSec, playheadRate, holdDelta/drawDelta) vào result.forward. Còn lại giữ nguyên K4.
 * clicktest-round30-m2-forward-pipe.mjs — Phase 9 đợt 27, luồng K4:
 * chứng minh 2 việc TRÊN APP THẬT (không unit test):
 *  (1) Phát ngược toàn cục hoạt động: bấm nút ◀ "Phát ngược" trên TopBar,
 *      playhead lùi từng frame, khung hình tại mỗi playhead khớp với
 *      khung hình xuôi tại cùng playhead (video xám-ramp theo giây +
 *      nhiễu: mức xám trung tâm suy ra được giây nguồn), badge
 *      "PHÁT NGƯỢC — không audio" hiện.
 *  (2) Hold-frame kích hoạt trong app thật (nợ #4 đợt 26): cùng video đó
 *      có GOP thưa (1 keyframe / 300 frame) + nhiễu nặng nên seek ngược
 *      từng frame bắt decoder giải mã lại cả GOP → readyState tụt →
 *      drawVideoClip rơi vào nhánh hold. Số tick hold đọc từ
 *      window.__vcutHoldStats (hook đo như __vcutPreviewIdle đã có sẵn).
 *
 * KHÔNG Playwright. Kế thừa mẫu harness đợt 26 J6 (pipe CDP + snapshot
 * dist + seed qua autosave): Chrome headed dưới Xvfb qua
 * --remote-debugging-pipe; import video bằng DOM.setFileInputFiles lên
 * input file thật của MediaBin; bấm nút "＋ Thêm" và nút transport bằng
 * .click() trên element UI thật (không gọi store trực tiếp).
 *
 * Video đo: scratch sparse-gop-noise.mp4 — 1280x720, 30 s, 30 fps, x264
 * GOP hiệu dụng 30, không B-frame, mỗi giây một mức xám (20 + giây×7)
 * + nhiễu thời gian (decode đắt). Tạo bằng ffmpeg (xem LIMITS K4 §3).
 * ROUND44-Z5: đính chính — file này đặt -g 300 nhưng scenecut chèn
 * keyframe mỗi 30 frame (stss 30 mục), nên nhãn "GOP 300" cũ là sai;
 * các dòng "GOP thưa (1 keyframe / 300 frame)" dưới đây mô tả tiền đề
 * của lượt K4 trên file PHẲNG, không phải file noise mặc định này
 * (K4 ghi rõ file noise đã tạo nhưng không dùng cho số hold).
 *
 * Thoát mã: 0 = phát ngược đúng + hold kích hoạt trong app (cả 2);
 * 1 = app chạy nhưng 1 trong 2 không chứng minh được (báo rõ cái nào);
 * 2 = blocker hạ tầng (không build/snapshot/chrome/video).
 * Kết quả JSON: scratch ~/workspace/tmp-round27-k4/forward-hold.json
 * (parent quyết có stage vào benchmarks/results hay không). Không sửa
 * code sản phẩm ngoài việc build dist để snapshot, không push, không
 * tag/release, không cài dependency, không binary vào repo.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-round30-m2-forward-pipe.mjs
 * Biến môi trường: K4_DISPLAY (mặc định :97), K4_PORT (mặc định 4197),
 * K4_VIDEO (mặc định ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

// Phase 9 đợt 31 N5 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs):
// bundle đang đo, gán trong main() sau snapshotDist() nếu có; các
// harness không snapshot dist giữ null (snapshot vẫn ghi proc/ps).
let HANG_BUNDLE = null;

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.M2_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round30-m2");
const VIDEO = process.env.K4_VIDEO || path.join(SCRATCH, "sparse-gop-noise.mp4");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.K4_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.K4_DISPLAY || ":97";
const PORT = Number(process.env.K4_PORT || 4197);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) {
  const line = `[${stamp()}] ${a.join(" ")}`;
  logLines.push(line);
  console.log(line);
}
function fail(msg) {
  console.error(`BLOCKER: ${msg}`);
  process.exit(2);
}

// ------------------------------------------------------------- CDP pipe --
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg;
        try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) {
          this.sessionId = msg.params.sessionId;
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });
    for (const s of [1, 2, 3, 4]) {
      try { proc.stdio[s]?.on("error", () => {}); } catch {}
    }
    proc.on("error", () => {});
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 60000) {
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
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression, timeoutMs = 120000) {
    const r = await this.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true,
    }, this.sessionId, timeoutMs);
    if (r.exceptionDetails) {
      throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 500)}`);
    }
    return r.result?.value;
  }
  async setFileInput(objectId, files) {
    await this.send("DOM.setFileInputFiles", { objectId, files }, this.sessionId);
  }
  async resolveSelector(selector) {
    const r = await this.send("Runtime.evaluate", {
      expression: `(()=>{const el=document.querySelector(${JSON.stringify(selector)}); return el ? {found:true} : {found:false};})()`,
      returnByValue: true,
    }, this.sessionId);
    if (!r.result?.value?.found) return null;
    const doc = await this.send("DOM.getDocument", { depth: 0 }, this.sessionId);
    const q = await this.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector }, this.sessionId);
    if (!q.nodeId) return null;
    const o = await this.send("DOM.resolveNode", { nodeId: q.nodeId }, this.sessionId);
    return o.object?.objectId ?? null;
  }
}

// ------------------------------------------------------------- static srv --
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
function serveDir(root) {
  return http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
      let file = path.join(root, urlPath === "/" ? "index.html" : urlPath);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, "index.html");
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
    } catch { res.writeHead(500); res.end(); }
  });
}

// ------------------------------------------------------------- page fns ---
const PAGE = {
  ready: `!!(document.querySelector("canvas.preview-canvas") && document.querySelector(".transport"))`,
  // Seed project rỗng qua autosave (mẫu J6): app khôi phục autosave thay
  // vì tự load project mẫu, timeline bắt đầu trống.
  seedEmpty: `(()=>{localStorage.setItem("vcut-welcomed","1"); localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify({format:"vcut-project",formatVersion:1,appVersion:"0.1.0",specVersion:"0.2.0",savedAt:new Date().toISOString(),name:"K4 reverse-hold seed",spec:{version:"0.2.0",meta:{name:"K4 seed",width:1280,height:720,fps:30},tracks:[]}})); return true;})()`,
  mediaNames: `[...document.querySelectorAll(".media-name")].map((el)=>(el.textContent||"").trim())`,
  clickAddFor: `(name)=>{const cards=[...document.querySelectorAll(".media-grid > *")]; const card=cards.find((c)=>(c.querySelector(".media-name")?.textContent||"").includes(name)); if(!card) return "no-card"; const btn=card.querySelector(".media-add"); if(!btn) return "no-btn"; btn.click(); return "clicked";}`,
  clickTransport: `(want)=>{const btns=[...document.querySelectorAll(".transport button")]; const b = want==="reverse" ? btns.find((x)=>x.getAttribute("aria-label")==="Phát ngược") : btns.find((x)=>(x.textContent||"").includes(want)); if(!b) return "no-btn"; b.click(); return "clicked";}`,
  // Đọc 1 mẫu: timecode TopBar, stats hold, mean vùng trung tâm canvas,
  // badge ngược / badge giữ có hiện không.
  sample: `(()=>{const cv=document.querySelector("canvas.preview-canvas"); let mean=null; if(cv && cv.width>0){const ctx=cv.getContext("2d"); const w=cv.width,h=cv.height; const x=Math.floor(w/2-50),y=Math.floor(h/2-50); try{const d=ctx.getImageData(x,y,100,100).data; let s=0; for(let i=0;i<d.length;i+=4) s+=(d[i]+d[i+1]+d[i+2])/3; mean=s/(d.length/4);}catch(e){mean=-1;}} const td=document.querySelector(".time-display"); const rev=document.querySelector(".preview-reverse-badge"); const hold=document.querySelector(".preview-hold-badge"); return {timeText: td?(td.textContent||"").trim():"", stats: window.__vcutHoldStats||null, centerMean: mean, reverseBadge: !!(rev && rev.offsetParent!==null), holdBadge: !!(hold && hold.style.display!=="none" && (hold.textContent||"").length>0)};})()`,
  pressEnd: `(()=>{const ev=new KeyboardEvent("keydown",{key:"End",code:"End",bubbles:true}); window.dispatchEvent(ev); return true;})()`,
};

function parseTime(text) {
  const m = String(text || "").match(/(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}
function graySecond(mean) {
  // Mức luma kỳ vọng ở giây s: Y = 20 + 7s (video đo). Canvas RGB sau
  // giải mã YUV limited-range: RGB ≈ (Y-16)×255/219 — đo thực tế frame
  // giây 10 cho mean 86.0 (Y=90 → (90-16)×255/219 ≈ 86.1, khớp). Suy
  // ngược: Y ≈ mean×219/255 + 16 rồi s = round((Y-20)/7). Dùng công thức
  // (mean-20)/7 trực tiếp sẽ lệch hệ thống +1..+3 giây về cuối.
  if (mean === null || mean < 0) return null;
  const y = (mean * 219) / 255 + 16;
  return Math.round((y - 20) / 7);
}

// ------------------------------------------------------------- main -------
async function main() {
  if (!fs.existsSync(VIDEO)) fail(`không có video đo ${VIDEO} (ffmpeg chưa xong?)`);
  const dist = path.join(WEB_DIR, "dist");
  if (!fs.existsSync(path.join(dist, "index.html"))) fail("chưa có dist (chạy vite build trước)");
  const bundle = fs.readdirSync(path.join(dist, "assets")).find((f) => f.endsWith(".js"));
  const bundleText = fs.readFileSync(path.join(dist, "assets", bundle), "utf8");
  for (const needle of ["Phát ngược", "__vcutHoldStats", "toggleReversePlayback"]) {
    if (!bundleText.includes(needle)) fail(`bundle snapshot thiếu dấu hiệu K4: ${needle}`);
  }
  log(`bundle snapshot OK: ${bundle} (${bundleText.length} bytes, chứa đủ dấu K4)`);
  const snap = path.join(SCRATCH, "dist-snap");
  fs.rmSync(snap, { recursive: true, force: true });
  fs.cpSync(dist, snap, { recursive: true });
  const server = serveDir(snap);
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  log(`phục vụ snapshot tại ${ORIGIN}`);

  // Xvfb: dùng chung display nếu còn sống (mẫu J6), nếu không bật mới.
  const num = DISPLAY.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch {}
    if (alive) log(`Xvfb: dùng chung display ${DISPLAY} (tiến trình còn sống)`);
    else {
      log(`Xvfb: socket ${sock} mồ côi, xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch {}
      try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
    }
  }
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) fail(`Xvfb không tạo socket ${sock}`);
    log(`Xvfb lên: DISPLAY=${DISPLAY}`);
  }
  const profile = path.join(SCRATCH, "chrome-profile");
  fs.rmSync(profile, { recursive: true, force: true });
  let chromeBin = BINARIES.find((b) => fs.existsSync(b));
  if (!chromeBin) fail(`không tìm thấy chrome: ${BINARIES.join(", ")}`);
  log(`chrome: ${chromeBin} (display ${DISPLAY})`);
  const chrome = spawn(chromeBin, [
    // --no-sandbox là bắt buộc khi chạy dưới root (không có là Chrome
    // thoát ngay, CDP timeout — đúng lỗi lần chạy đầu của harness này).
    "--no-sandbox", "--remote-debugging-pipe", "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars",
    "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required",
    `--user-data-dir=${profile}`, "--window-size=1280,800", "--window-position=0,0",
    "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
  // Xả stdout/stderr của Chrome (dbus/gpu noise) để pipe không tắc.
  chrome.stdout?.on("data", () => {});
  chrome.stderr?.on("data", () => {});
  const cdp = new PipeCdp(chrome);
  const cleanup = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} server.close(); };
  process.on("exit", cleanup);

  // Mẫu J6: getTargets → createTarget → attach → chờ sessionId.
  await cdp.send("Target.getTargets", {}, undefined, 30000);
  const target = await cdp.send("Target.createTarget", { url: "about:blank" });
  await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
  if (!cdp.sessionId) fail("không nhận được sessionId từ Target.attachedToTarget");
  await cdp.send("Page.enable", {}, cdp.sessionId);
  await cdp.send("Runtime.enable", {}, cdp.sessionId);
  await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
  await sleep(2000);
  await cdp.evaluate(PAGE.seedEmpty);
  await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    await sleep(1000);
    ready = await cdp.evaluate(PAGE.ready).catch(() => false);
  }
  if (!ready) fail("app không ready sau 60s");
  log("app ready (project seed rỗng, không load sample)");

  // Import video đo qua input file thật của MediaBin.
  const inputId = await cdp.resolveSelector(".mediabin input[type=file]");
  if (!inputId) fail("không tìm thấy input file MediaBin");
  await cdp.setFileInput(inputId, [VIDEO]);
  const base = path.basename(VIDEO);
  let imported = false;
  for (let i = 0; i < 60 && !imported; i++) {
    await sleep(1000);
    const names = await cdp.evaluate(PAGE.mediaNames).catch(() => []);
    imported = names.some((n) => n.includes(base));
  }
  if (!imported) fail(`import video không hiện trong MediaBin sau 60s (tìm ${base})`);
  // Chờ MediaBin đo xong duration (card hiện .media-dur) rồi mới bấm
  // Thêm: bấm sớm thì addMediaAtPlayhead dùng fallback duration 5 s
  // (item.duration chưa kịp đo) làm sai timeline đo.
  let durKnown = false;
  for (let i = 0; i < 30 && !durKnown; i++) {
    await sleep(1000);
    durKnown = await cdp.evaluate(`!!document.querySelector(".media-dur")`).catch(() => false);
  }
  if (!durKnown) fail("MediaBin chưa đo xong duration video sau 30s");
  log(`import OK: ${base} (duration đã đo)`);
  const addRes = await cdp.evaluate(`(${PAGE.clickAddFor})(${JSON.stringify(base)})`);
  if (addRes !== "clicked") fail(`không bấm được nút Thêm: ${addRes}`);
  await sleep(2000);
  const s0 = await cdp.evaluate(PAGE.sample);
  log(`sau khi thêm clip: time=${s0.timeText} stats=${JSON.stringify(s0.stats)}`);

  async function samplePass(label, seconds) {
    const samples = [];
    for (let i = 0; i < seconds * 2; i++) {
      await sleep(500);
      const s = await cdp.evaluate(PAGE.sample);
      s._wallMs = Date.now();
      samples.push(s);
    }
    log(`${label}: ${samples.length} mẫu`);
    return samples;
  }

  // Pass đối chứng: phát XUÔI trước (decode tuần tự rẻ → hold kỳ vọng ~0).
  const fwdWallStart = Date.now();
  const fwdClick = await cdp.evaluate(`(${PAGE.clickTransport})("▶")`);
  if (fwdClick !== "clicked") fail(`không bấm được nút phát xuôi: ${fwdClick}`);
  const fwd = await samplePass("xuôi", 6);
  const fwdEnd = await cdp.evaluate(`(${PAGE.clickTransport})("⏸")`);
  const fwdWallSec = (Date.now() - fwdWallStart) / 1000;
  const fwdStats = fwd[fwd.length - 1]?.stats;

  // Phát ngược: End → cuối timeline (30 s), bấm ◀, đo 14 s.
  await cdp.evaluate(PAGE.pressEnd);
  await sleep(1500);
  const preRev = await cdp.evaluate(PAGE.sample);
  const revClick = await cdp.evaluate(`(${PAGE.clickTransport})("reverse")`);
  if (revClick !== "clicked") fail(`không bấm được nút Phát ngược: ${revClick}`);
  const rev = await samplePass("ngược", 14);
  const revStats = rev[rev.length - 1]?.stats;
  const stopClick = await cdp.evaluate(`(${PAGE.clickTransport})("reverse")`);

  // Chuỗi stats từng mẫu (để xem hold cụm ở đầu pass hay rải đều —
  // lần chạy GOP thưa thấy pass xuôi cũng có 54 hold mà chỉ có stats
  // cuối nên không kết luận được cụm ở đâu).
  const detail = (arr) => arr.map((s) => ({
    t: parseTime(s.timeText), mean: s.centerMean,
    draw: s.stats?.draw ?? null, hold: s.stats?.hold ?? null, skip: s.stats?.skip ?? null,
  }));
  const fwdTimes = fwd.map((s) => parseTime(s.timeText)).filter((v) => v !== null);
  const revTimes = rev.map((s) => parseTime(s.timeText)).filter((v) => v !== null);
  const revMeans = rev.map((s) => s.centerMean);
  const revSeconds = rev.map((s) => graySecond(s.centerMean));
  const revHoldDelta = (revStats?.hold ?? 0) - (fwdStats?.hold ?? 0);
  const revDrawDelta = (revStats?.draw ?? 0) - (fwdStats?.draw ?? 0);
  const blackRev = rev.slice(2).filter((s) => s.centerMean !== null && s.centerMean < 5).length;
  const decreasing = revTimes.length >= 3 && revTimes[revTimes.length - 1] < revTimes[0] - 1;
  const monotonic = revSeconds.every((v, i) => i === 0 || v === null || revSeconds[i - 1] === null || v <= revSeconds[i - 1] + 1);
  const distinctDown = [...new Set(revSeconds.filter((v) => v !== null))];
  const reverseOk = decreasing && monotonic && distinctDown.length >= 3;
  const holdOk = revHoldDelta > 0;
  const result = {
    runAt: new Date().toISOString(),
    bundle,
    video: base,
    forward: { samples: fwd.length, sampleWallMs: fwd.map((s) => s._wallMs), timeStart: fwdTimes[0] ?? null, timeEnd: fwdTimes[fwdTimes.length - 1] ?? null, statsEnd: fwdStats, statsBeforePlay: s0.stats, wallSec: fwdWallSec, playheadDelta: (fwdTimes.length >= 2 ? fwdTimes[fwdTimes.length - 1] - fwdTimes[0] : null), playheadRate: (fwdTimes.length >= 2 ? (fwdTimes[fwdTimes.length - 1] - fwdTimes[0]) / fwdWallSec : null), holdDelta: (fwdStats?.hold ?? 0) - (s0.stats?.hold ?? 0), drawDelta: (fwdStats?.draw ?? 0) - (s0.stats?.draw ?? 0), samplesDetail: detail(fwd) },
    reverse: {
      samples: rev.length, timeStart: revTimes[0] ?? null, timeEnd: revTimes[revTimes.length - 1] ?? null,
      timeSeries: revTimes, centerMeans: revMeans, graySeconds: revSeconds, samplesDetail: detail(rev),
      statsStart: fwdStats, statsEnd: revStats, holdDelta: revHoldDelta, drawDelta: revDrawDelta,
      blackSamplesAfterWarmup: blackRev, reverseBadgeSeen: rev.some((s) => s.reverseBadge),
      holdBadgeSeen: rev.some((s) => s.holdBadge),
    },
    checks: { reversePlaybackCorrect: reverseOk, holdFiredInApp: holdOk, noBlackInReverse: blackRev === 0 },
    verdict: reverseOk && holdOk ? "PASS" : "PARTIAL",
  };
  writeFileEpermRetry(path.join(SCRATCH, "forward-hold.json"), JSON.stringify(result, null, 2));
  log(`KẾT QUẢ: reverseOk=${reverseOk} holdOk=${holdOk} (holdDelta=${revHoldDelta}, drawDelta=${revDrawDelta}, blackRev=${blackRev})`);
  log(`time ngược: ${revTimes[0]} -> ${revTimes[revTimes.length - 1]}; graySeconds: ${JSON.stringify(revSeconds)}`);
  log(`stats cuối: ${JSON.stringify(revStats)}; badge ngược thấy: ${result.reverse.reverseBadgeSeen}, badge giữ thấy: ${result.reverse.holdBadgeSeen}`);
  cleanup();
  process.exit(result.verdict === "PASS" ? 0 : 1);
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
