#!/usr/bin/env node
/**
 * clicktest-nested-ramp-pipe.mjs — Phase 9 đợt 22, luồng F: click-test
 * browser thật cho nested ramp, KHÔNG Playwright.
 *
 * NỢ GỐC: đợt 21 T4 đã thử Playwright nhưng repo không có runner nên
 * dừng (xem docs/PHASE9_ROUND21_T4_NESTED_CURVE_CREATE_UI_LIMITS.md §3);
 * đợt 18 đã chứng minh headed Chrome mở được qua --remote-debugging-pipe
 * trên VM này. Harness này tái dùng đúng hướng đó: Chrome headed dưới
 * Xvfb, CDP qua pipe (fd 3 ghi JSON+\0 / fd 4 đọc, tách bằng \0),
 * click thật bằng Input.dispatchMouseEvent (không dùng element.click()
 * trừ khi CDP Input lỗi — khi đó case ghi rõ CLICK-FALLBACK).
 *
 * PHẠM VI — ĐỌC KỸ TRƯỚC KHI TRÍCH KẾT QUẢ:
 * - Luồng click HOÀN TOÀN qua UI, không seed state: từ project mẫu
 *   (loadSample) chọn 2 clip video bằng click + Shift+click, mở
 *   NestedClipPanel, bấm "Gộp thành compound clip", rồi bấm nút tạo
 *   curve mới (đợt 21 T4) và đổi chế độ trim ở block chế độ (đợt 20 R4).
 * - KHÔNG seed qua autosave: đã thử và phát hiện validateClipDeep
 *   (apps/web/src/lib/projectRepo.ts) KHÔNG có nhánh kind "nested"
 *   nên project chứa nested clip bị cổng load web từ chối, app rơi
 *   về project mẫu — đây là phát hiện sản phẩm (xem LIMITS đợt 22 F),
 *   KHÔNG phải lỗi harness, và luồng này KHÔNG sửa code sản phẩm
 *   nên không vá nó. Vì vậy các case ramp 1→2 và nested tốc độ 2
 *   (cần seed clip mang curve/speed khác 1, UI không tạo được)
 *   KHÔNG click-test được trong đợt này — ghi rõ ở LIMITS, không bịa.
 * - Editor chạy bằng `vite preview` của build sẵn apps/web/dist
 *   (KHÔNG build lại, KHÔNG sửa dist). Nếu dist không chứa code
 *   round 21 (không thấy chuỗi "curveCreate" trong bundle), harness
 *   dừng ở mức BLOCKER thay vì báo fail giả cho code cũ.
 * - Chạy lại được, thoát mã rõ: 0 = mọi case pass; 1 = có case fail
 *   (UI thật nhưng hành vi sai); 2 = blocker hạ tầng (pipe/Chrome/
 *   preview/dist không lên — KHÔNG có kết quả click-test nào).
 * - KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG tag/release, KHÔNG
 *   cài dependency, KHÔNG đưa binary vào repo. Kết quả JSON ghi vào
 *   benchmarks/results/clicktest-nested-ramp-r22.json (file chạy,
 *   parent quyết có stage hay không).
 * - Scrub chuột kéo-thả trên timeline thuộc luồng C đợt 22, KHÔNG
 *   thuộc harness này (harness chỉ click rời rạc, không kéo).
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-nested-ramp-pipe.mjs
 * Biến môi trường: CLICK_DISPLAY (mặc định :97), CLICK_PORT (4197),
 * CLICK_CHROME_BINS (danh sách binary, mặc định PW156 rồi META152).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

// Phase 9 đợt 31 N5 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs):
// bundle đang đo, gán trong main() sau snapshotDist() nếu có; các
// harness không snapshot dist giữ null (snapshot vẫn ghi proc/ps).
let HANG_BUNDLE = null;
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "clicktest-nested-ramp-pipe");

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.CLICK_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.CLICK_DISPLAY || ":97";
const PORT = Number(process.env.CLICK_PORT || 4197);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) {
  const line = `[${stamp()}] ${a.join(" ")}`;
  logLines.push(line);
  console.log(line);
}

// ------------------------------------------------------------- CDP pipe --
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.exceptions = [];
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
        if (msg.method === "Runtime.exceptionThrown" && msg.params?.exceptionDetails) {
          this.exceptions.push(JSON.stringify(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text ?? "exception").slice(0, 300));
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });
    // Chống crash process khi Chrome chết sớm: mọi pipe stdio đều có thể
    // phát 'error' (EPIPE/ECONNRESET khi ghi vào tiến trình đã chết);
    // không có handler thì Node ném unhandled 'error' và finally không chạy.
    for (const s of [1, 2, 3, 4]) {
      try { proc.stdio[s]?.on("error", () => { /* pipe chết cùng Chrome, bỏ qua */ }); } catch { /* stdio không phải stream */ }
    }
    proc.on("error", () => { /* spawn lỗi -> send() sẽ reject, finally dọn */ });
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
            outDir: CDP_HANG_OUT_DIR, bundle: HANG_BUNDLE,
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
  async evaluate(expression, timeoutMs = 60000) {
    const r = await this.send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true,
    }, this.sessionId, timeoutMs);
    if (r.exceptionDetails) {
      throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails).slice(0, 500)}`);
    }
    return r.result.value;
  }
  /** Click thật bằng CDP Input; modifiers CDP (Shift = 8). Trả về phương thức đã dùng. */
  async clickRect(rect, modifiers = 0) {
    const x = Math.round(rect.x + rect.width / 2);
    const y = Math.round(rect.y + rect.height / 2);
    try {
      await this.send("Input.dispatchMouseEvent", {
        type: "mousePressed", x, y, button: "left", clickCount: 1, modifiers,
      }, this.sessionId, 15000);
      await this.send("Input.dispatchMouseEvent", {
        type: "mouseReleased", x, y, button: "left", clickCount: 1, modifiers,
      }, this.sessionId, 15000);
      return "cdp-input";
    } catch (e) {
      log(`  Input.dispatchMouseEvent lỗi (${e.message}), fallback element.click()`);
      return "js-click-fallback";
    }
  }
}

async function waitFor(cdp, expr, label, timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await cdp.evaluate(expr, 15000)) return true; } catch { /* chưa */ }
    await sleep(500);
  }
  throw new Error(`hết ${timeoutMs}ms chờ: ${label}`);
}

/** Tìm element bằng JS, scroll vào tầm nhìn, trả rect (null nếu không thấy). */
async function findRect(cdp, finderJs) {
  return cdp.evaluate(`(() => {
    const el = (${finderJs});
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
}

function btnByTitle(title) {
  return `[...document.querySelectorAll("button")].find((b) => b.title === ${JSON.stringify(title)})`;
}
function btnByText(text) {
  return `[...document.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === ${JSON.stringify(text)})`;
}
/** Item panel (.nested-item) chứa chuỗi name; trả element item. */
function panelItemByName(name) {
  return `[...document.querySelectorAll(".nested-item")].find((it) => (it.textContent || "").includes(${JSON.stringify(name)}))`;
}
function btnInItem(name, text) {
  return `(() => { const it = ${panelItemByName(name)}; if (!it) return null;
    return [...it.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === ${JSON.stringify(text)}); })()`;
}
function radioInItem(name, labelPart) {
  return `(() => { const it = ${panelItemByName(name)}; if (!it) return null;
    const lb = [...it.querySelectorAll("label")].find((l) => (l.textContent || "").includes(${JSON.stringify(labelPart)}));
    return lb ? lb.querySelector('input[type="radio"]') : null; })()`;
}

/** Click thật lên element tìm bằng JS; fallback element.click() nếu CDP Input lỗi. */
async function realClick(cdp, finderJs, modifiers = 0) {
  const rect = await findRect(cdp, finderJs);
  if (!rect) throw new Error(`không tìm được element: ${finderJs.slice(0, 120)}`);
  const method = await cdp.clickRect(rect, modifiers);
  if (method === "js-click-fallback") {
    await cdp.evaluate(`(${finderJs}).click()`);
  }
  await sleep(500);
  return method;
}

// ------------------------------------------------------------- infra -----
function startXvfb() {
  return new Promise((resolve, reject) => {
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    if (fs.existsSync(sock)) {
      // Socket tồn tại nhưng tiến trình Xvfb có thể đã chết (lượt chạy
      // trước bị SIGTERM): socket mồ côi khiến Chrome mới thoát ngay
      // và ghi pipe chết gây crash. Chỉ dùng chung khi pgrep thấy
      // đúng tiến trình Xvfb của display này; ngược lại xoá socket
      // mồ côi rồi bật Xvfb mới.
      let alive = false;
      try {
        const r = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]);
        alive = r.status === 0;
      } catch { alive = false; }
      if (alive) {
        log(`Xvfb: socket ${sock} đã có sẵn + tiến trình còn sống (dùng chung), không bật mới`);
        resolve(null);
        return;
      }
      log(`Xvfb: socket ${sock} mồ côi (không thấy tiến trình Xvfb ${DISPLAY}), xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch { /* kệ */ }
    }
    const xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    (async () => {
      for (let i = 0; i < 40; i++) {
        if (fs.existsSync(sock)) { log(`Xvfb lên: DISPLAY=${DISPLAY}`); resolve(xvfb); return; }
        await sleep(250);
      }
      reject(new Error(`Xvfb không tạo socket ${sock}`));
    })();
  });
}

function startVitePreview() {
  return new Promise(async (resolve) => {
    const distIndex = path.join(WEB_DIR, "dist", "index.html");
    if (!fs.existsSync(distIndex)) {
      log("BLOCKER dist: không có apps/web/dist/index.html");
      resolve(null);
      return;
    }
    const assets = fs.readdirSync(path.join(WEB_DIR, "dist", "assets"))
      .filter((f) => f.endsWith(".js"));
    const bundle = assets.map((f) => path.join(WEB_DIR, "dist", "assets", f))
      .find((p) => fs.readFileSync(p, "utf8").includes("curveCreate"));
    if (!bundle) {
      log("BLOCKER dist: bundle không chứa chuỗi curveCreate — dist cũ hơn code round 21, dừng (không báo fail giả)");
      resolve(null);
      return;
    }
    const hash = crypto.createHash("sha256").update(fs.readFileSync(bundle)).digest("hex").slice(0, 16);
    log(`dist OK: bundle ${path.basename(bundle)} sha256[:16]=${hash}`);
    // Cổng đã có tiến trình khác chiếm (vd: vite preview rò từ lượt chạy
    // trước bị crash): --strictPort sẽ làm vite mới thoát ngay, nên báo
    // BLOCKER rõ ràng thay vì để vòng fetch đoán mò.
    try {
      const r = await fetch(`${ORIGIN}/`);
      if (r.ok) {
        log(`BLOCKER port: ${ORIGIN} đã có tiến trình khác phục vụ (vite preview rò từ lượt trước?) — chạy lại với CLICK_PORT khác hoặc giết tiến trình chiếm cổng này rồi chạy lại`);
        resolve(null);
        return;
      }
    } catch { /* cổng trống, tiếp tục */ }
    const viteBin = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
    const proc = fs.existsSync(viteBin)
      ? spawn(process.execPath, [viteBin, "preview", "--port", String(PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" })
      : spawn("npx", ["vite", "preview", "--port", String(PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" });
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(proc); } }, 15000);
    (async () => {
      for (let i = 0; i < 30 && !done; i++) {
        await sleep(500);
        try {
          const r = await fetch(`${ORIGIN}/`);
          if (r.ok) { done = true; clearTimeout(timer); resolve(proc); return; }
        } catch { /* chưa lên */ }
      }
    })();
    proc.on("exit", () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
  });
}

// ------------------------------------------------------------- cases -----
const results = [];
function casePass(id, detail) { results.push({ id, status: "PASS", detail }); log(`CASE ${id}: PASS — ${detail}`); }
function caseFail(id, detail) { results.push({ id, status: "FAIL", detail }); log(`CASE ${id}: FAIL — ${detail}`); }

async function runCases(cdp) {
  // C0: project mẫu load xong, timeline có >= 2 clip video (v1: 0-4, 4-8).
  try {
    await waitFor(cdp, `document.querySelectorAll(".tl-clip.clip-video").length >= 2`, ">= 2 clip video mẫu trên timeline", 90000);
    const ids = await cdp.evaluate(`[...document.querySelectorAll(".tl-clip.clip-video")].map((c) => c.getAttribute("data-clip-id"))`);
    log(`  C0 clip video mẫu: ${JSON.stringify(ids)}`);
    casePass("C0-sample-load", `project mẫu load xong, ${ids.length} clip video trên timeline`);
  } catch (e) { caseFail("C0-sample-load", e.message); return; }

  // C1: click clip video 1, Shift+click clip video 2 -> cả 2 có class selected.
  try {
    const ids = await cdp.evaluate(`[...document.querySelectorAll(".tl-clip.clip-video")].map((c) => c.getAttribute("data-clip-id"))`);
    const m1 = await realClick(cdp, `document.querySelector('.tl-clip[data-clip-id="${ids[0]}"]')`);
    await waitFor(cdp, `!!document.querySelector('.tl-clip[data-clip-id="${ids[0]}"].selected')`, "clip 1 selected", 15000);
    const m2 = await realClick(cdp, `document.querySelector('.tl-clip[data-clip-id="${ids[1]}"]')`, 8);
    await waitFor(cdp, `document.querySelectorAll(".tl-clip.selected").length >= 2`, "cả 2 clip selected", 15000);
    casePass("C1-shift-select", `click ${m1} + Shift+click ${m2} -> 2 clip cùng selected`);
  } catch (e) { caseFail("C1-shift-select", e.message); return; }

  // C2: bấm nút Nested trên Timeline -> panel mở, nút gộp không bị disable.
  try {
    const m = await realClick(cdp, btnByTitle("Tạo và quản lý nested clip (compound clip)"));
    await waitFor(cdp, `!!document.querySelector(".nested-panel")`, "panel .nested-panel mở", 15000);
    const nestDisabled = await cdp.evaluate(`(() => { const b = ${btnByText("Gộp thành compound clip")}; return b ? b.disabled : null; })()`);
    if (nestDisabled === null) throw new Error("không tìm được nút Gộp thành compound clip");
    if (nestDisabled) throw new Error("nút gộp vẫn disabled dù đã chọn 2 clip");
    casePass("C2-open-panel", `click ${m} nút Nested -> panel mở, nút gộp enabled`);
  } catch (e) { caseFail("C2-open-panel", e.message); return; }

  // C3: bấm gộp -> 1 nested item trong panel + 1 clip-nested trên timeline.
  try {
    const m = await realClick(cdp, btnByText("Gộp thành compound clip"));
    await waitFor(cdp, `[...document.querySelectorAll(".nested-item")].length >= 1`, "panel liệt kê >= 1 nested item", 15000);
    await waitFor(cdp, `!!document.querySelector(".tl-clip.clip-nested")`, "timeline có clip-nested", 15000);
    const name = await cdp.evaluate(`(() => { const it = document.querySelector(".nested-item .nested-item-name"); return it ? it.textContent : null; })()`);
    casePass("C3-nest", `click ${m} gộp -> panel liệt kê nested (${(name || "").trim()}), timeline có clip-nested`);
  } catch (e) { caseFail("C3-nest", e.message); return; }

  // C4: click thật lên clip-nested trên timeline -> class selected.
  try {
    const m = await realClick(cdp, `document.querySelector(".tl-clip.clip-nested")`);
    await waitFor(cdp, `!!document.querySelector(".tl-clip.clip-nested.selected")`, "clip-nested selected", 15000);
    casePass("C4-select-nested", `click ${m} lên clip-nested trên timeline -> class selected xuất hiện`);
  } catch (e) { caseFail("C4-select-nested", e.message); }

  // C5: nested mới gộp (chưa curve): preview giữ nguyên -> bấm tạo -> block chế độ hiện.
  const ITEM = "Compound clip";
  try {
    const preview = await cdp.evaluate(`(() => { const it = ${panelItemByName(ITEM)}; return it ? it.textContent : null; })()`);
    if (!preview || !preview.includes("trim giữ nguyên [0, 8)")) {
      throw new Error(`preview tạo trước khi bấm không đúng dạng giữ nguyên [0, 8) (đo được: ${(preview || "").slice(0, 200)})`);
    }
    const m = await realClick(cdp, btnInItem(ITEM, "Tạo curve tốc độ hằng 1×"));
    await waitFor(cdp, `(() => { const it = ${panelItemByName(ITEM)}; if (!it) return false;
      const hasCreate = [...it.querySelectorAll("button")].some((b) => (b.textContent || "").trim() === "Tạo curve tốc độ hằng 1×");
      const hasRadios = it.querySelectorAll('input[type="radio"]').length >= 2;
      const msg = document.querySelector(".nested-panel-msg");
      return !hasCreate && hasRadios && !!msg && msg.textContent.includes("Đã tạo speed curve"); })()`,
      "sau khi tạo: nút tạo biến mất + block chế độ hiện + msg thành công", 15000);
    const cur = await cdp.evaluate(`(() => { const it = ${panelItemByName(ITEM)}; return it ? it.textContent : ""; })()`);
    if (!cur.includes("Hiện tại: duration 8s, trim [0, 8)")) {
      throw new Error(`sau khi tạo, dòng hiện tại không phải trim [0, 8) (đo được: ${cur.slice(0, 300)})`);
    }
    casePass("C5-create-curve", `click ${m} tạo curve -> block tạo ẩn, block chế độ hiện, trim giữ [0, 8)`);
  } catch (e) { caseFail("C5-create-curve", e.message); }

  // C6: đổi radio sang giữ-trim -> preview đổi -> bấm áp -> alreadyOk (clip hợp lệ), panel còn sống.
  try {
    const m1 = await realClick(cdp, `(() => { const it = ${panelItemByName(ITEM)};
      return [...it.querySelectorAll("label")].find((l) => (l.textContent || "").includes("Giữ trim, tính lại duration")); })()`);
    await waitFor(cdp, `(() => { const r = ${radioInItem(ITEM, "Giữ trim, tính lại duration")}; return !!r && r.checked; })()`,
      "radio giữ-trim được checked", 15000);
    const afterRadio = await cdp.evaluate(`(() => { const it = ${panelItemByName(ITEM)}; return it ? it.textContent : ""; })()`);
    if (!afterRadio.includes("giữ trim [0, 8)")) {
      throw new Error(`sau khi đổi radio, preview không chuyển dạng giữ-trim (đo được: ${afterRadio.slice(0, 300)})`);
    }
    const m2 = await realClick(cdp, btnInItem(ITEM, "Áp curve theo chế độ đã chọn"));
    await waitFor(cdp, `(() => { const m = document.querySelector(".nested-panel-msg"); return !!m && m.textContent.includes("đã khớp"); })()`,
      "msg alreadyOk sau khi áp giữ-trim (clip hợp lệ)", 15000);
    const stillThere = await cdp.evaluate(`!!document.querySelector(".nested-panel")`);
    if (!stillThere) throw new Error("panel biến mất sau khi áp (crash?)");
    casePass("C6-mode-fixedTrim", `click ${m1}/${m2} đổi radio giữ-trim -> preview đổi, áp -> alreadyOk, panel còn sống`);
  } catch (e) { caseFail("C6-mode-fixedTrim", e.message); }

  // C7: không exception runtime nào trong suốt phiên click.
  if (cdp.exceptions.length === 0) {
    casePass("C7-no-crash", "0 Runtime.exceptionThrown trong phiên click-test");
  } else {
    caseFail("C7-no-crash", `${cdp.exceptions.length} exception: ${cdp.exceptions[0]}`);
  }
}

// ------------------------------------------------------------- main ------
async function main() {
  log("harness clicktest-nested-ramp-pipe: bắt đầu");
  log(`display=${DISPLAY} port=${PORT} binaries=${BINARIES.join(" | ")}`);
  let xvfb = null;
  let preview = null;
  let chrome = null;
  let exitCode = 2;
  try {
    xvfb = await startXvfb();
    preview = await startVitePreview();
    if (!preview) { log("BLOCKER: vite preview/dist không lên — dừng, không có kết quả click-test"); return 2; }
    log(`vite preview lên tại ${ORIGIN}`);
    let cdp = null;
    let lastErr = null;
    for (const bin of BINARIES) {
      if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
      const profile = fs.mkdtempSync(path.join(os.tmpdir(), "clicktest-pipe-"));
      chrome = spawn(bin, [
        "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
        "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
        "--remote-debugging-pipe", `--user-data-dir=${profile}`,
        "--window-size=1920,1080", "about:blank",
      ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
      chrome.stderr.on("data", () => { /* dbus/gpu noise của VM, bỏ qua */ });
      try {
        cdp = new PipeCdp(chrome);
        const t0 = await cdp.send("Target.getTargets", {}, undefined, 30000);
        log(`pipe OK (${bin}): ${(t0.targetInfos || []).length} target ban đầu`);
        const target = await cdp.send("Target.createTarget", { url: "about:blank" });
        await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
        for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
        if (!cdp.sessionId) throw new Error("không nhận được sessionId từ Target.attachedToTarget");
        await cdp.send("Page.enable", {}, cdp.sessionId);
        await cdp.send("Runtime.enable", {}, cdp.sessionId);
        break;
      } catch (e) {
        lastErr = e;
        log(`BLOCKER-PIPE ${bin}: ${e.message}`);
        try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
        try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
        chrome = null; cdp = null;
      }
    }
    if (!cdp) { log(`BLOCKER: không binary nào mở được pipe (lỗi cuối: ${lastErr ? lastErr.message : "?"})`); return 2; }
    // Tắt modal chào lần đầu bằng localStorage rồi reload (trước khi sample load xong).
    await cdp.send("Page.navigate", { url: `${ORIGIN}/` }, cdp.sessionId);
    await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render lần đầu");
    await cdp.evaluate(`localStorage.setItem("vcut-welcomed", "1");`);
    await cdp.send("Page.reload", {}, cdp.sessionId);
    await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render sau reload");
    await runCases(cdp);
    const failed = results.filter((r) => r.status !== "PASS");
    exitCode = failed.length === 0 ? 0 : 1;
    log(`DONE clicktest-nested-ramp: ${results.filter((r) => r.status === "PASS").length}/${results.length} case pass, exit=${exitCode}`);
  } catch (e) {
    log(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
    exitCode = 2;
  } finally {
    try { chrome && chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { xvfb && xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { preview && preview.kill("SIGKILL"); } catch { /* bỏ qua */ }
    const out = {
      runAt: new Date().toISOString(), display: DISPLAY, port: PORT,
      cases: results, log: logLines,
    };
    const outPath = path.join(ROOT, "benchmarks", "results", "clicktest-nested-ramp-r22.json");
    try {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
      console.log(`results JSON: ${outPath}`);
    } catch (e) { console.log(`không ghi được results JSON: ${e.message}`); }
  }
  return exitCode;
}

process.exitCode = await main();
