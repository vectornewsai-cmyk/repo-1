#!/usr/bin/env node
/**
 * Phase 9 đợt 31, luồng N2: đo lại fps ngược lúc máy rảnh + instrument gap rAF.
 * Khác M2 đợt 30: (a) SCRATCH qua env N2_SCRATCH (riêng mỗi lượt, tránh ghi đè
 * như M2 §6.2); (b) probe rAF phía harness (bọc window.requestAnimationFrame,
 * CHỈ ghi timestamp callback — KHÔNG sửa logic sản phẩm preview.tsx/seek.ts):
 * đo gap rAF từng phase để kiểm chứng giả thuyết clamp dt 0.1 s gây chạy chậm
 * dưới tải; (c) ghi loadavg máy lúc đo; (d) display/port mặc định khác (:98 /
 * 4198) để không đụng luồng N1 chạy song song. Còn lại giữ nguyên M2/K4.
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
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
// Phase 9 đợt 39 T2 — probe per-seek (U6 §3.3): chỉ import phân tích thuần
// (Node), logic ghi trong trang nằm ở per-seek-probe-page.js riêng.
import { summarizePerSeek, reverseEntries } from "./per-seek-probe.mjs";

// Phase 9 đợt 31 N5 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs):
// bundle đang đo, gán trong main() sau snapshotDist() nếu có; các
// harness không snapshot dist giữ null (snapshot vẫn ghi proc/ps).
let HANG_BUNDLE = null;

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.N2_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round31-n2");
const VIDEO = process.env.K4_VIDEO || path.join(SCRATCH, "sparse-gop-noise.mp4");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.K4_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.K4_DISPLAY || ":98";
const PORT = Number(process.env.K4_PORT || 4198);
// Phase 9 đợt 39 T2 — probe per-seek: MẶC ĐỊNH TẮT (N2_PERSEEK !== "1"
// thì không cài gì vào trang, đường đo cũ không đổi 1 byte ngữ nghĩa).
// Bật: N2_PERSEEK=1 (tuỳ chọn N2_PERSEEK_GOP_SEC=<giây/GOP đều> để
// summary nhóm theo đoạn GOP, vd fixture sparse-gop 300 frame @30fps
// thì N2_PERSEEK_GOP_SEC=10). Xem docs/PHASE9_ROUND39_T2_PERSEEK_PROBE_LIMITS.md.
const PERSEEK_ENABLED = process.env.N2_PERSEEK === "1";
const PERSEEK_GOP_SEC = (() => {
  const v = Number(process.env.N2_PERSEEK_GOP_SEC || "");
  return Number.isFinite(v) && v > 0 ? v : null;
})();
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
  // N2: probe rAF phía harness. Bọc window.requestAnimationFrame: vẫn gọi
  // rAF gốc, chỉ ghi performance.now() mỗi lần callback chạy + gap so với
  // callback trước. Vòng lặp preview gọi requestAnimationFrame(loop) toàn
  // cục mỗi tick nên sau tick đầu tiên post-install mọi tick đều qua
  // wrapper này. KHÔNG đụng logic sản phẩm, không đổi timing (chỉ thêm
  // vài micro-giây ghi số). Mark phase để cắt cửa sổ phân tích.
  installRafProbe: `(()=>{if(window.__n2Raf) return "already"; const orig=window.requestAnimationFrame.bind(window); const rec=[]; let last=null; const marks=[]; window.__n2Raf={rec,marks,mark:(name)=>{marks.push({name,t:performance.now()});}}; window.requestAnimationFrame=function(cb){return orig((ts)=>{const now=performance.now(); const gap=last===null?null:now-last; rec.push({t:now,gap}); last=now; cb(ts);});}; return "installed";})()`,
  markRaf: `(name)=>{window.__n2Raf?.mark(name); return window.__n2Raf?window.__n2Raf.marks.length:-1;}`,
  readRafProbe: `(()=>{const p=window.__n2Raf; if(!p) return null; return {marks:p.marks, rec:p.rec};})()`,
  // Phase 9 đợt 39 T2 — probe per-seek (chỉ gọi khi N2_PERSEEK=1; code
  // trang nằm ở per-seek-probe-page.js, harness đọc file rồi evaluate).
  perSeekInstall: `()=>{return window.__n2PerSeek?window.__n2PerSeek.install({fps:30}):"no-probe";}`,
  perSeekMark: `(name)=>{window.__n2PerSeek?.mark(name); return window.__n2PerSeek?window.__n2PerSeek.marks.length:-1;}`,
  perSeekRead: `(()=>{const p=window.__n2PerSeek; if(!p) return null; return p.read();})()`,
};

// N2: load máy lúc đo (đọc /proc/loadavg, không dùng lệnh ngoài).
function loadavg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/).slice(0, 3).join(" "); }
  catch { return "unknown"; }
}
// N2: phân tích gap rAF trong 1 phase: từ mark start (exclusive) tới mark
// end (inclusive theo t). predictedAdvance = sum(min(0.1, gap)) — đúng công
// thức dt của vòng lặp preview; predictedRate = advance / wallPhase.
function analyzeRafPhase(probe, startName, endName) {
  if (!probe) return null;
  const start = probe.marks.find((m) => m.name === startName);
  const end = probe.marks.find((m) => m.name === endName);
  if (!start || !end) return { error: `thiếu mark ${startName}/${endName}` };
  const ticks = probe.rec.filter((r) => r.t > start.t && r.t <= end.t && r.gap !== null);
  const gaps = ticks.map((r) => r.gap / 1000);
  if (!gaps.length) return { n: 0 };
  const sorted = [...gaps].sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const over100 = gaps.filter((g) => g > 0.1);
  const predictedAdvance = gaps.reduce((s, g) => s + Math.min(0.1, g), 0);
  // N2b: biến thể trừ tick đầu cửa sổ — gap của tick đầu có thể bắc qua
  // mark (main thread bận ngay trước khi bấm phát) nên không phản ánh
  // đói rAF sustained trong phase; dùng để đối chiếu, không thay số chính.
  const gapsExclFirst = gaps.slice(1);
  const over100Excl = gapsExclFirst.filter((g) => g > 0.1);
  const predictedExcl = gapsExclFirst.reduce((s, g) => s + Math.min(0.1, g), 0);
  const wallSec = (end.t - start.t) / 1000;
  // Phase 9 đợt 36 S2 — vị trí gap, CHỈ khi N2_GAP_POS=1 (mặc định tắt,
  // output cũ không đổi 1 byte ngữ nghĩa): mỗi gap >100ms ghi thời điểm
  // bắt đầu/kết thúc theo phân đoạn phase, để phân tích gap xuôi đơn lẻ
  // ở fixture thưa trước khi đề xuất hiệu chuẩn v3. Không có env thì
  // không thêm field nào.
  const bigGaps = process.env.N2_GAP_POS === "1"
    ? ticks.filter((r) => r.gap / 1000 > 0.1).map((r) => {
        const gapSec = r.gap / 1000;
        const tEndMs = r.t - start.t;
        return {
          index: ticks.indexOf(r),
          gapSec: +gapSec.toFixed(3),
          tStartSec: +((tEndMs - r.gap) / 1000).toFixed(3),
          tEndSec: +(tEndMs / 1000).toFixed(3),
          fracStart: +(((tEndMs - r.gap) / (end.t - start.t)).toFixed(3)),
          fracEnd: +((tEndMs / (end.t - start.t)).toFixed(3)),
        };
      })
    : undefined;
  return {
    ...(bigGaps !== undefined ? { bigGaps } : {}),
    n: gaps.length, wallSec: +wallSec.toFixed(3),
    gapMean: +(gaps.reduce((s, g) => s + g, 0) / gaps.length).toFixed(4),
    gapP50: +pct(0.5).toFixed(4), gapP95: +pct(0.95).toFixed(4),
    gapP99: +pct(0.99).toFixed(4), gapMax: +pct(1).toFixed(4),
    countOver100ms: over100.length,
    lostSec: +(over100.reduce((s, g) => s + (g - 0.1), 0)).toFixed(3),
    predictedAdvanceSec: +predictedAdvance.toFixed(3),
    predictedRate: +(predictedAdvance / wallSec).toFixed(3),
    exclFirst: {
      countOver100ms: over100Excl.length,
      lostSec: +(over100Excl.reduce((s, g) => s + (g - 0.1), 0)).toFixed(3),
      predictedAdvanceSec: +predictedExcl.toFixed(3),
      predictedRate: +(predictedExcl / wallSec).toFixed(3),
    },
  };
}

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
  // Phase 9 đợt 35 R2 — dist đóng băng: N2_DIST (đường dẫn tuyệt đối tới
  // 1 bản sao dist đã đóng băng) thắng dist trên đĩa. Nếu không đặt,
  // giữ hành vi cũ (apps/web/dist) để các lượt cũ không đổi. Lý do:
  // đợt 34 Q6 §5.8 — dist trên đĩa bị luồng khác build lại giữa batch
  // nên 7 lượt chạy trên 4 bundle khác nhau, phá điều kiện baseline.
  // Frozen dist KHÔNG bị build lại: bản sao nằm ở scratch của luồng đo,
  // và wrapper Q6 kiểm tra sha256 của nó trước/sau mỗi lượt.
  const dist = process.env.N2_DIST ? path.resolve(process.env.N2_DIST) : path.join(WEB_DIR, "dist");
  if (process.env.N2_DIST) log(`dist đóng băng: ${dist} (không dùng apps/web/dist)`);
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
  const loadAtStart = loadavg();
  log(`load lúc bắt đầu: ${loadAtStart}`);
  const probeInstall = await cdp.evaluate(PAGE.installRafProbe);
  log(`probe rAF: ${probeInstall}`);
  // Phase 9 đợt 39 T2 — probe per-seek, chỉ khi N2_PERSEEK=1. Hàm phụ
  // markPerSeek gắn nhãn phase (forward/reverse/idle) cho mỗi seek;
  // khi tắt, không evaluate gì thêm nên đường đo mặc định không đổi.
  const markPerSeek = async (name) => {
    if (PERSEEK_ENABLED) await cdp.evaluate(`(${PAGE.perSeekMark})(${JSON.stringify(name)})`);
  };
  if (PERSEEK_ENABLED) {
    const perSeekSrc = fs.readFileSync(path.join(import.meta.dirname, "per-seek-probe-page.js"), "utf8");
    const perSeekDefined = await cdp.evaluate(perSeekSrc);
    const perSeekInstall = await cdp.evaluate(`(${PAGE.perSeekInstall})()`);
    log(`probe per-seek: defined=${perSeekDefined} install=${perSeekInstall} gopSec=${PERSEEK_GOP_SEC}`);
  } else {
    log("probe per-seek: tắt (đặt N2_PERSEEK=1 để bật, xem LIMITS T2)");
  }
  await cdp.evaluate(`(${PAGE.markRaf})("ready")`);
  await markPerSeek("ready");

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
  const loadBeforeFwd = loadavg();
  log(`load trước phát xuôi: ${loadBeforeFwd}`);
  await cdp.evaluate(`(${PAGE.markRaf})("fwd-start")`);
  await markPerSeek("forward");
  const fwdWallStart = Date.now();
  const fwdClick = await cdp.evaluate(`(${PAGE.clickTransport})("▶")`);
  if (fwdClick !== "clicked") fail(`không bấm được nút phát xuôi: ${fwdClick}`);
  const fwd = await samplePass("xuôi", 6);
  const fwdEnd = await cdp.evaluate(`(${PAGE.clickTransport})("⏸")`);
  await cdp.evaluate(`(${PAGE.markRaf})("fwd-end")`);
  await markPerSeek("idle");
  const fwdWallSec = (Date.now() - fwdWallStart) / 1000;
  const fwdStats = fwd[fwd.length - 1]?.stats;

  // Phát ngược: End → cuối timeline (30 s), bấm ◀, đo 14 s.
  await cdp.evaluate(PAGE.pressEnd);
  await sleep(1500);
  const preRev = await cdp.evaluate(PAGE.sample);
  const loadBeforeRev = loadavg();
  log(`load trước phát ngược: ${loadBeforeRev}`);
  await cdp.evaluate(`(${PAGE.markRaf})("rev-start")`);
  await markPerSeek("reverse");
  const revClick = await cdp.evaluate(`(${PAGE.clickTransport})("reverse")`);
  if (revClick !== "clicked") fail(`không bấm được nút Phát ngược: ${revClick}`);
  const rev = await samplePass("ngược", 14);
  const revStats = rev[rev.length - 1]?.stats;
  const stopClick = await cdp.evaluate(`(${PAGE.clickTransport})("reverse")`);
  await cdp.evaluate(`(${PAGE.markRaf})("rev-end")`);
  await markPerSeek("idle");
  const loadAtEnd = loadavg();
  log(`load cuối lượt: ${loadAtEnd}`);
  const probe = await cdp.evaluate(PAGE.readRafProbe);
  // Phase 9 đợt 39 T2 — đọc probe per-seek (chỉ khi bật): read() là cuối
  // phiên nên phải gọi sau mark idle cuối; entries thô + summary đều ghi
  // vào forward-hold.json, downstream (Q6/gate v3/solo) bỏ qua field mới.
  let perSeek = null;
  if (PERSEEK_ENABLED) {
    const perSeekRaw = await cdp.evaluate(PAGE.perSeekRead);
    const rawEntries = perSeekRaw?.entries ?? [];
    const revEntries = reverseEntries(rawEntries);
    perSeek = {
      enabled: true, version: perSeekRaw?.version ?? null, gopSeconds: PERSEEK_GOP_SEC,
      entries: rawEntries, marks: perSeekRaw?.marks ?? [],
      droppedOverflow: perSeekRaw?.droppedOverflow ?? null, counts: perSeekRaw?.counts ?? null,
      summaryAll: summarizePerSeek(rawEntries, { gopSeconds: PERSEEK_GOP_SEC }),
      summaryReverse: summarizePerSeek(revEntries, { gopSeconds: PERSEEK_GOP_SEC }),
    };
    log(`perSeek: ${rawEntries.length} entries (reverse ${revEntries.length}), counts=${JSON.stringify(perSeek.counts)}, summaryReverse=${JSON.stringify(perSeek.summaryReverse.byMechanism)}`);
  }
  const rafFwd = analyzeRafPhase(probe, "fwd-start", "fwd-end");
  const rafRev = analyzeRafPhase(probe, "rev-start", "rev-end");
  log(`rAF xuôi: ${JSON.stringify(rafFwd)}`);
  log(`rAF ngược: ${JSON.stringify(rafRev)}`);

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
  // N2: tốc độ nội suy kiểu M2 (mẫu 2 → mẫu cuối, trừ độ trễ khởi động).
  const fwdWall = fwd.map((s) => s._wallMs);
  const fwdInterpRate = (fwdTimes.length >= 3 && fwdWall.length >= 3)
    ? (fwdTimes[fwdTimes.length - 1] - fwdTimes[2]) / ((fwdWall[fwdWall.length - 1] - fwdWall[2]) / 1000) : null;
  const revWall = rev.map((s) => s._wallMs);
  const revWallSec = revWall.length >= 2 ? (revWall[revWall.length - 1] - revWall[0]) / 1000 : null;
  const revFps = (revWallSec && revWallSec > 0) ? revDrawDelta / revWallSec : null;
  const result = {
    runAt: new Date().toISOString(),
    bundle,
    video: base,
    load: { atStart: loadAtStart, beforeFwd: loadBeforeFwd, beforeRev: loadBeforeRev, atEnd: loadAtEnd },
    raf: { forward: rafFwd, reverse: rafRev, probeMarks: probe?.marks ?? null, probeTicksTotal: probe?.rec?.length ?? null },
    // Phase 9 đợt 39 T2: null khi N2_PERSEEK không bật (đường đo cũ).
    perSeekEnabled: PERSEEK_ENABLED,
    perSeek,
    forward: { samples: fwd.length, sampleWallMs: fwdWall, timeStart: fwdTimes[0] ?? null, timeEnd: fwdTimes[fwdTimes.length - 1] ?? null, statsEnd: fwdStats, statsBeforePlay: s0.stats, wallSec: fwdWallSec, playheadDelta: (fwdTimes.length >= 2 ? fwdTimes[fwdTimes.length - 1] - fwdTimes[0] : null), playheadRate: (fwdTimes.length >= 2 ? (fwdTimes[fwdTimes.length - 1] - fwdTimes[0]) / fwdWallSec : null), interpRate: fwdInterpRate, holdDelta: (fwdStats?.hold ?? 0) - (s0.stats?.hold ?? 0), drawDelta: (fwdStats?.draw ?? 0) - (s0.stats?.draw ?? 0), samplesDetail: detail(fwd) },
    reverse: {
      samples: rev.length, timeStart: revTimes[0] ?? null, timeEnd: revTimes[revTimes.length - 1] ?? null,
      timeSeries: revTimes, centerMeans: revMeans, graySeconds: revSeconds, samplesDetail: detail(rev),
      statsStart: fwdStats, statsEnd: revStats, holdDelta: revHoldDelta, drawDelta: revDrawDelta,
      wallSec: revWallSec, fps: revFps,
      blackSamplesAfterWarmup: blackRev, reverseBadgeSeen: rev.some((s) => s.reverseBadge),
      holdBadgeSeen: rev.some((s) => s.holdBadge),
    },
    checks: { reversePlaybackCorrect: reverseOk, holdFiredInApp: holdOk, noBlackInReverse: blackRev === 0 },
    verdict: reverseOk && holdOk ? "PASS" : "PARTIAL",
  };
  fs.writeFileSync(path.join(SCRATCH, "forward-hold.json"), JSON.stringify(result, null, 2));
  log(`KẾT QUẢ: reverseOk=${reverseOk} holdOk=${holdOk} (holdDelta=${revHoldDelta}, drawDelta=${revDrawDelta}, blackRev=${blackRev})`);
  log(`N2: fps ngược=${revFps !== null ? revFps.toFixed(2) : null} (draw ${revDrawDelta} / wall ${revWallSec !== null ? revWallSec.toFixed(2) : null}s); tốc độ xuôi nội suy=${fwdInterpRate !== null ? fwdInterpRate.toFixed(3) : null}; load ${loadAtStart} → ${loadAtEnd}`);
  log(`time ngược: ${revTimes[0]} -> ${revTimes[revTimes.length - 1]}; graySeconds: ${JSON.stringify(revSeconds)}`);
  log(`stats cuối: ${JSON.stringify(revStats)}; badge ngược thấy: ${result.reverse.reverseBadgeSeen}, badge giữ thấy: ${result.reverse.holdBadgeSeen}`);
  cleanup();
  process.exit(result.verdict === "PASS" ? 0 : 1);
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
