#!/usr/bin/env node
/**
 * clicktest-67u6-legacy-reopen.mjs — Phase 9 đợt 67, luồng U6:
 * UI mở lại mảnh legacy đã "Bỏ qua" + xác nhận nhận tay lần 2 + hoàn
 * tác + nhập archive nhận chuỗi mới từ archive (đóng nợ đợt 66 T7
 * §5.4/§5.5/§5.6).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-66t7-legacy-adopt-ui.mjs
 * (HMR tắt bằng config tạm; profile Chrome mới tinh; MỘT tab).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   U0 setup: tab mount; đọc projectId envelope thật của app qua store.
 *   U1 seed (trong trang, module thật): spec hiện tại A (2 clip) ghi
 *        autosave; chuỗi mảnh `file-<hashB>-<tên>` (spec B, 1 version)
 *        + chuỗi con trỏ `file-<hashC>-<tên>` (spec C, 1 version, khóa
 *        legacy trỏ tới) — cả hai mơ hồ (cùng tên, hash lệch so với A).
 *   U2 reload → modal hiện 2 mục. Bấm Nhận ở mục mảnh → BẢNG XÁC NHẬN
 *        LẦN 2 hiện (không nhận ngay); bấm Hủy → bảng xác nhận biến
 *        mất, mục còn nguyên, chuỗi mảnh còn nguyên. Bấm Nhận lại →
 *        bấm Xác nhận → mục biến khỏi modal, banner Hoàn tác hiện,
 *        envelope có version mang đúng hash B.
 *   U3 bấm Hoàn tác (UI thật): mục mảnh hiện lại trong modal (2 mục),
 *        envelope không còn hash B, chuỗi mảnh có lại 1 version với
 *        đúng id gốc. Sau đó bấm Bỏ qua ở mục mảnh → modal còn 1 mục
 *        (con trỏ), id mảnh đã ghi vào danh sách bỏ qua.
 *   U4 mở panel Lịch sử (UI thật) → bấm nút "Lịch sử cũ đã bỏ qua (1)"
 *        → modal hiện mục đã bỏ qua với đúng id + bằng chứng; bấm Mở
 *        lại → mục quay lại hàng đợi chờ quyết định (modal 2 mục),
 *        danh sách bỏ qua không còn id mảnh.
 *   U5 ĐƯỜNG NHẬP ARCHIVE ĐẦY ĐỦ (trong trang, module thật): dựng
 *        project "Archive Test" với 2 version lịch sử dưới projectId Q
 *        MỚI (chưa có trên máy này — xóa khỏi kho sau khi xuất), export
 *        archive kèm history.json, nhập qua input file thật của app
 *        (DataTransfer + change; nếu React không nhận event thì gọi
 *        thẳng openArchiveFileFlow và ghi rõ trong báo cáo). Kiểm tra:
 *        tên project thành "Archive Test", kho có 2 version dưới Q,
 *        báo cáo tải có note archiveHistoryImported {imported:2},
 *        panel Lịch sử đúng 2 hàng, modal không hiện lại.
 *   U6 xung đột archive: nhập lại cùng archive → note {imported:0,
 *        skipped:2}; nhập archive đã sửa 1 version (cùng id, spec
 *        khác, hash khớp spec mới) → note {imported:0, skipped:1,
 *        conflicts:1}, bản local giữ nguyên hash gốc.
 *   U7 0 lỗi trang trong suốt phiên.
 *
 * LƯU Ý i18n (như T7): key `legacyAdopt.*` mới nằm trong fragment riêng
 * `apps/web/src/i18n/fragments/round67-u6.json`, parent gộp vào dict sau
 * — trước lúc gộp, `t()` trả về đúng key nên test chỉ assert cấu trúc/
 * dữ liệu qua data-testid + số version hiện dạng số trong bảng bằng
 * chứng, KHÔNG assert chuỗi dịch. Chuỗi dịch đã kiểm bằng node.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-67u6-legacy-reopen.mjs
 * Env: U6_DEV_PORT (mặc định tự chọn 5660–5669), U6_DEBUG_PORT (9760–9769),
 * U6_DISPLAY (mặc định :178 — display RIÊNG của U6 đợt 67), U6_SCRATCH
 * (mặc định hidden_files/round67-u6/headed). TMPDIR riêng /tmp/round67-u6/tmp.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.U6_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round67-u6", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round67-u6";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.u6.config.mjs");

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

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
    this.nextId = 1; this.pending = new Map(); this.exceptions = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Page.javascriptDialogOpening") {
        // U6: tự chấp nhận dialog xác nhận (đề phòng confirmDiscard
        // hiện khi project dirty) để harness không treo.
        this.send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
        this.exceptions.push(`dialog: ${msg.params?.type} ${msg.params?.message || ""}`);
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`CDP ${msg.error.message}`));
        else resolve(msg.result);
      }
    };
  }
  async send(method, params) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP.send timeout 60s: ${method}`));
      }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    writeFileEpermRetry(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__u6errors = [];
  window.addEventListener("error", (e) => { try { window.__u6errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__u6errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__u6errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__u6errors.push("unhandledrejection: <?>"); } });
})()`;

// projectId envelope thật của app (store sinh lúc khởi tạo).
const PROJECT_ID_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__u6storeMod || (window.__u6storeMod = await import(hit));
  return mod.useStore.getState().projectId;
})()`;

// Spec tối thiểu cho saveVersion (cùng hình dạng test Node).
const SPEC_FN = `(name, nClips, tag) => ({
  version: "0.2.0",
  meta: { name, width: 1280, height: 720, fps: 30 },
  tracks: [{ id: "v1", kind: "video", clips: Array.from({ length: nClips }, (_, i) => ({
    id: tag + (i + 1), kind: "video", src: "a.mp4", start: i * 2, duration: 2, in: 0, out: 2,
  })) }],
})`;

// U1: seed autosave (spec A) + mảnh mơ hồ (spec B) + con trỏ mơ hồ (spec C).
const SEED_FN = `(async (appProjectId) => {
  const hist = window.__u6histMod || (window.__u6histMod = await import("/src/lib/projectHistory.ts"));
  const reg = window.__u6regMod || (window.__u6regMod = await import("/src/lib/projectNameRegistry64R6.ts"));
  const repo = window.__u6repoMod || (window.__u6repoMod = await import("/src/lib/projectRepo.ts"));
  const store = hist.getHistoryStore();
  const spec = ${SPEC_FN};
  const name = "Kiểm tra headed";
  const specA = spec(name, 2, "a");
  const specB = spec(name, 1, "b");
  const specC = spec(name, 3, "c");
  const hashOf = async (s) => {
    const v = await store.saveVersion("tmp-probe-67u6", s);
    return v.hash;
  };
  const hashB = await hashOf(specB);
  const hashC = await hashOf(specC);
  const san = reg.sanitizeLegacyFileName(name);
  const fragId = "file-" + hashB + "-" + san;
  const ptrId = "file-" + hashC + "-" + san;
  await store.saveVersion(fragId, specB);
  await store.saveVersion(ptrId, specC);
  window.localStorage.setItem(hist.HISTORY_PROJECT_KEY, ptrId);
  // autosaveNow ghi ngay + hủy timer debounce của lần load mẫu (không
  // thì timer bắn sau sẽ ghi đè envelope seed bằng spec mẫu).
  repo.autosaveNow(specA, name, undefined, undefined, appProjectId);
  return { fragId, ptrId, hashB, hashC, name };
})`;

// Đọc trạng thái modal + chuỗi (sau reload / sau thao tác).
const MODAL_STATE_FN = `(() => {
  const modal = document.querySelector('[data-testid="legacy-adopt-modal"]');
  if (!modal) return { shown: false, items: [], confirm: null, undoBanner: false, dismissed: [] };
  const items = [...modal.querySelectorAll('[data-testid="legacy-adopt-item"]')].map((el) => ({
    from: el.getAttribute("data-from"),
    text: el.innerText.replace(/\\n/g, " | ").slice(0, 400),
  }));
  const confirmEl = modal.querySelector('[data-testid="legacy-adopt-confirm"]');
  const confirm = confirmEl ? { from: confirmEl.getAttribute("data-from") } : null;
  const undoBanner = !!modal.querySelector('[data-testid="legacy-adopt-last-adopt"]');
  const dismissed = [...modal.querySelectorAll('[data-testid="legacy-adopt-dismissed-item"]')].map((el) => ({
    from: el.getAttribute("data-from"),
  }));
  return { shown: true, items, confirm, undoBanner, dismissed };
})()`;

// Bấm Nhận / Bỏ qua trên một mục (theo data-from).
const CLICK_ITEM_FN = `((from, kind) => {
  const el = document.querySelector('[data-testid="legacy-adopt-item"][data-from="' + from + '"]');
  if (!el) return { clicked: false, reason: "no-item" };
  const btn = el.querySelector('[data-testid="legacy-adopt-' + kind + '"]');
  if (!btn) return { clicked: false, reason: "no-button" };
  btn.click();
  return { clicked: true };
})`;   

// Bấm một nút theo data-testid (trong toàn trang).
const CLICK_TESTID_BODY = `(testid) => {
  const btn = document.querySelector('[data-testid="' + testid + '"]');
  if (!btn) return { clicked: false, reason: "no-button" };
  btn.click();
  return { clicked: true };
}`;
async function clickTestid(cdp, testid) {
  return cdp.evalJs(`(${CLICK_TESTID_BODY})(${JSON.stringify(testid)})`);
}

// Kiểm tra chuỗi trong IDB thật + danh sách đã bỏ qua.
const CHAINS_FN = `(async (appProjectId, fragId, ptrId, hashB) => {
  const hist = window.__u6histMod || (window.__u6histMod = await import("/src/lib/projectHistory.ts"));
  const store = hist.getHistoryStore();
  const frag = await store.listVersions(fragId);
  const ptr = await store.listVersions(ptrId);
  const env = await store.listVersions(appProjectId);
  const dismissed = window.localStorage.getItem("vcut:legacy-adopt-dismissed-v1");
  return {
    fragCount: frag.length, ptrCount: ptr.length, envCount: env.length,
    envHasB: env.some((v) => v.hash === hashB),
    fragIds: frag.map((v) => v.id),
    dismissed: dismissed ? JSON.parse(dismissed) : [],
  };
})`;

const OPEN_HISTORY_FN = `(async () => {
  const btn = [...document.querySelectorAll("button")].find((b) => (b.getAttribute("title") || "").includes("Lịch sử phiên bản"));
  if (!btn) return { opened: false, reason: "no-button" };
  btn.click();
  return { opened: true };
})()`;
// U5: panel có thể đã mở từ U4 (nút Lịch sử là toggle) — chỉ bấm khi chưa mở.
const ENSURE_HISTORY_FN = `(async () => {
  if (document.querySelector(".history-panel")) return { opened: true, already: true };
  const btn = [...document.querySelectorAll("button")].find((b) => (b.getAttribute("title") || "").includes("Lịch sử phiên bản"));
  if (!btn) return { opened: false, reason: "no-button" };
  btn.click();
  return { opened: true, already: false };
})()`;
const HISTORY_ROWS_FN = `(() => {
  const rows = [...document.querySelectorAll(".history-panel table tbody tr")];
  return { count: rows.length, texts: rows.map((r) => r.innerText.replace(/\\n/g, " | ")) };
})()`;

// U5: dựng archive kèm history.json cho project Q mới rồi nhập qua input
// file thật của app (DataTransfer + change; fallback gọi thẳng flow).
const ARCHIVE_IMPORT_FN = `(async (Q) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hist = window.__u6histMod || (window.__u6histMod = await import("/src/lib/projectHistory.ts"));
  const arch = window.__u6archMod || (window.__u6archMod = await import("/src/lib/archive.ts"));
  const flow = window.__u6flowMod || (window.__u6flowMod = await import("/src/lib/openProjectFlow.ts"));
  const lr = window.__u6lrMod || (window.__u6lrMod = await import("/src/lib/loadReport.ts"));
  const storeMod = window.__u6storeMod || (window.__u6storeMod = await import("/src/store.ts"));
  const store = hist.getHistoryStore();
  const spec = ${SPEC_FN};
  const name = "Archive Test";
  const specD = spec(name, 2, "d");
  const specD2 = spec(name, 3, "d");
  const v1 = await store.saveVersion(Q, specD);
  const v2 = await store.saveVersion(Q, specD2);
  if (!v1 || !v2) return { ok: false, reason: "seed-history-failed" };
  const history = store.exportHistory(Q, await store.listVersions(Q));
  // Xóa khỏi kho trên máy này để mô phỏng "chuỗi chưa có trên máy này".
  await store.deleteVersion(v1.id);
  await store.deleteVersion(v2.id);
  const afterDelete = await store.listVersions(Q);
  const res = await arch.exportArchive(specD2, name, [], Q, history);
  if (!res.ok || !res.blob) return { ok: false, reason: "export-failed", errors: res.errors };
  window.__u6archiveBlob = res.blob;
  window.__u6history = history;
  window.__u6v1 = { id: v1.id, hash: v1.hash };
  const file = new File([res.blob], "archive-test.vcut.zip", { type: "application/zip" });
  // Đường 1: input file thật của app.
  const input = document.querySelector('input[type="file"][accept*=".vcut.zip"]');
  let via = "none";
  if (input) {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    for (let i = 0; i < 24; i++) {
      if (storeMod.useStore.getState().spec.meta.name === name) { via = "file-input"; break; }
      await sleep(500);
    }
  }
  // Đường 2 (fallback): gọi thẳng flow nhập archive (cùng hàm UI gọi).
  if (via === "none") {
    await flow.openArchiveFileFlow(file);
    via = storeMod.useStore.getState().spec.meta.name === name ? "direct-call" : "direct-call-failed";
  }
  // Tên project đổi ở replaceProject — TRƯỚC khi nhập history.json —
  // nên chờ thêm tới khi 2 version lịch sử đã vào kho (tránh đọc quá
  // sớm rồi kết luận sai là "không nhập được lịch sử").
  for (let i = 0; i < 24; i++) {
    const qv = await store.listVersions(Q);
    if (qv.length === 2) break;
    await sleep(500);
  }
  const qVersions = await store.listVersions(Q);
  const report = lr.getLastLoadReport();
  const note = report ? (report.structuredNotes || []).find((n) => n.code === "archiveHistoryImported") : null;
  const modalShown = !!document.querySelector('[data-testid="legacy-adopt-modal"]');
  return {
    ok: via !== "none" && via !== "direct-call-failed",
    via,
    afterDeleteCount: afterDelete.length,
    projectName: storeMod.useStore.getState().spec.meta.name,
    projectId: storeMod.useStore.getState().projectId,
    qCount: qVersions.length,
    qHashes: qVersions.map((v) => v.hash),
    noteParams: note ? note.params : null,
    modalShown,
  };
})`;

// U6a: nhập lại cùng archive (dự kiến skipped 2). U6b: archive đã sửa 1
// version (cùng id, spec khác) → conflicts 1, bản local giữ nguyên.
const ARCHIVE_REIMPORT_FN = `(async () => {
  const flow = window.__u6flowMod || (window.__u6flowMod = await import("/src/lib/openProjectFlow.ts"));
  const lr = window.__u6lrMod || (window.__u6lrMod = await import("/src/lib/loadReport.ts"));
  const hist = window.__u6histMod || (window.__u6histMod = await import("/src/lib/projectHistory.ts"));
  const store = hist.getHistoryStore();
  const Q = window.__u6history.projectId;
  const file = new File([window.__u6archiveBlob], "archive-test.vcut.zip", { type: "application/zip" });
  await flow.openArchiveFileFlow(file);
  const reportA = lr.getLastLoadReport();
  const noteA = reportA ? (reportA.structuredNotes || []).find((n) => n.code === "archiveHistoryImported") : null;
  return { noteParams: noteA ? noteA.params : null, qCount: (await store.listVersions(Q)).length };
})`;

const ARCHIVE_CONFLICT_FN = `(async () => {
  const hist = window.__u6histMod || (window.__u6histMod = await import("/src/lib/projectHistory.ts"));
  const arch = window.__u6archMod || (window.__u6archMod = await import("/src/lib/archive.ts"));
  const flow = window.__u6flowMod || (window.__u6flowMod = await import("/src/lib/openProjectFlow.ts"));
  const lr = window.__u6lrMod || (window.__u6lrMod = await import("/src/lib/loadReport.ts"));
  const repo = window.__u6repoMod || (window.__u6repoMod = await import("/src/lib/projectRepo.ts"));
  const store = hist.getHistoryStore();
  const Q = window.__u6history.projectId;
  const tampered = JSON.parse(JSON.stringify(window.__u6history));
  // Sửa spec của version đầu (cùng id, nội dung khác) + tính lại hash
  // cho khớp spec mới (đúng luật validateImport — xung đột chỉ lộ ở
  // tầng so sánh với bản local).
  const spec = ${SPEC_FN};
  const specT = spec("Archive Test", 2, "d");
  specT.tracks[0].clips[0].duration = 5;
  specT.tracks[0].clips[0].out = 5;
  tampered.versions[0].spec = specT;
  tampered.versions[0].hash = repo.specHash(specT);
  const specD2 = spec("Archive Test", 3, "d");
  const res = await arch.exportArchive(specD2, "Archive Test", [], Q, tampered);
  if (!res.ok || !res.blob) return { ok: false, reason: "export-failed", errors: res.errors };
  const file = new File([res.blob], "archive-test-tampered.vcut.zip", { type: "application/zip" });
  await flow.openArchiveFileFlow(file);
  const report = lr.getLastLoadReport();
  const note = report ? (report.structuredNotes || []).find((n) => n.code === "archiveHistoryImported") : null;
  const local = await store.listVersions(Q);
  const v1local = local.find((v) => v.id === window.__u6v1.id);
  return {
    ok: true,
    noteParams: note ? note.params : null,
    qCount: local.length,
    v1HashKept: v1local ? v1local.hash === window.__u6v1.hash : false,
  };
})`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  async function mountCheck(cdp, label) {
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, `app mount (${label})`, 240000);
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) break;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
    }
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__u6errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__u6errors = []`).catch(() => {});
    return e;
  }

  try {
    const DEV_PORT = Number(process.env.U6_DEV_PORT || 0) || (await pickFreePort(5660, 5669));
    const DEBUG_PORT = Number(process.env.U6_DEBUG_PORT || 0) || (await pickFreePort(9760, 9769));
    const DISPLAY = process.env.U6_DISPLAY || ":178";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5660–5669");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9760–9769");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (U6 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round67-u6/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "u6-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "u6-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
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
    await cdp.send("Page.navigate", { url: DEV_URL });
    await mountCheck(cdp, "tab");
    log("app đã mount");

    // ---- U0: projectId envelope thật của app ----
    const appProjectId = await cdp.evalJs(PROJECT_ID_FN);
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof appProjectId === "string" && uuidRe.test(appProjectId)) {
      pass("U0", `app projectId envelope = ${appProjectId}`);
    } else {
      fail("U0", `projectId app không phải UUID: ${JSON.stringify(appProjectId)}`);
    }

    // ---- U1: seed autosave + 2 chuỗi mơ hồ ----
    let seed;
    try {
      seed = await cdp.evalJs(`${SEED_FN}(${JSON.stringify(appProjectId)})`);
      if (seed.fragId && seed.ptrId && seed.fragId !== seed.ptrId) {
        pass("U1", `seed: mảnh ${seed.fragId} (hashB ${seed.hashB}), con trỏ ${seed.ptrId} (hashC ${seed.hashC}), autosave spec A 2 clip`);
      } else {
        fail("U1", `seed lệch: ${JSON.stringify(seed)}`);
      }
    } catch (e) { fail("U1", `harness lỗi: ${e.message}`); }

    // ---- U2: reload → modal 2 mục; Nhận → xác nhận lần 2 → Hủy → Nhận lại → Xác nhận ----
    try {
      await cdp.send("Page.navigate", { url: DEV_URL });
      await mountCheck(cdp, "tab sau reload");
      const state = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
        return s && s.shown && s.items.length === 2 ? s : null;
      }, "modal nhận thủ công hiện 2 mục", 60000);
      void state;
      // Bấm Nhận ở mục mảnh → bảng xác nhận lần 2 phải hiện, chưa nhận ngay.
      const clicked = await cdp.evalJs(`${CLICK_ITEM_FN}(${JSON.stringify(seed.fragId)}, "accept")`);
      if (!clicked.clicked) { fail("U2", `không bấm được nút Nhận: ${clicked.reason}`); }
      else {
        const confirming = await cdp.waitFor(async () => {
          const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
          return s && s.confirm && s.confirm.from === seed.fragId ? s : null;
        }, "bảng xác nhận lần 2 hiện ở mục mảnh", 30000);
        void confirming;
        const chainsBefore = await cdp.evalJs(`${CHAINS_FN}(${JSON.stringify(appProjectId)}, ${JSON.stringify(seed.fragId)}, ${JSON.stringify(seed.ptrId)}, ${JSON.stringify(seed.hashB)})`);
        if (chainsBefore.fragCount !== 1 || chainsBefore.envHasB) {
          fail("U2", `bấm Nhận (chưa xác nhận) mà chuỗi đã đổi: ${JSON.stringify(chainsBefore)}`);
        } else {
          // Bấm Hủy → bảng xác nhận biến mất, mục + chuỗi còn nguyên.
          const cancelled = await clickTestid(cdp, "legacy-adopt-confirm-cancel");
          if (!cancelled.clicked) { fail("U2", `không bấm được nút Hủy xác nhận: ${cancelled.reason}`); }
          else {
          const afterCancel = await cdp.waitFor(async () => {
            const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
            return s && s.shown && !s.confirm && s.items.length === 2 ? s : null;
          }, "hủy xác nhận: bảng biến mất, modal còn 2 mục", 30000);
          void afterCancel;
          const chainsAfterCancel = await cdp.evalJs(`${CHAINS_FN}(${JSON.stringify(appProjectId)}, ${JSON.stringify(seed.fragId)}, ${JSON.stringify(seed.ptrId)}, ${JSON.stringify(seed.hashB)})`);
          if (chainsAfterCancel.fragCount !== 1 || chainsAfterCancel.envHasB) {
            fail("U2", `bấm Hủy mà chuỗi đã đổi: ${JSON.stringify(chainsAfterCancel)}`);
          } else {
            // Bấm Nhận lại → Xác nhận → nhận thật + banner Hoàn tác hiện.
            await cdp.evalJs(`${CLICK_ITEM_FN}(${JSON.stringify(seed.fragId)}, "accept")`);
            const confirmed = await clickTestid(cdp, "legacy-adopt-confirm-accept");
            if (!confirmed.clicked) { fail("U2", `không bấm được nút Xác nhận: ${confirmed.reason}`); }
            else {
              const afterAdopt = await cdp.waitFor(async () => {
                const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
                return s && s.shown && s.items.length === 1 && s.items[0].from === seed.ptrId && s.undoBanner ? s : null;
              }, "sau xác nhận: modal còn 1 mục (con trỏ) + banner Hoàn tác", 30000);
              void afterAdopt;
              const chains = await cdp.evalJs(`${CHAINS_FN}(${JSON.stringify(appProjectId)}, ${JSON.stringify(seed.fragId)}, ${JSON.stringify(seed.ptrId)}, ${JSON.stringify(seed.hashB)})`);
              if (chains.fragCount === 0 && chains.envHasB) {
                await cdp.shot("legacy-adopt-confirm-undo.png");
                pass("U2", `xác nhận lần 2: Hủy không nhận, Xác nhận mới nhận (mảnh rỗng, envelope có hashB, banner Hoàn tác hiện; screenshot legacy-adopt-confirm-undo.png)`);
              } else {
                fail("U2", `sau khi xác nhận nhận: chains=${JSON.stringify(chains)}`);
              }
            }
          }
          }
        }
      }
    } catch (e) { fail("U2", `harness lỗi: ${e.message}`); }

    // ---- U3: bấm Hoàn tác → mảnh về lại modal + chuỗi gốc; rồi Bỏ qua mảnh ----
    try {
      const undone = await clickTestid(cdp, "legacy-adopt-undo");
      if (!undone.clicked) { fail("U3", `không bấm được nút Hoàn tác: ${undone.reason}`); }
      else {
        const state = await cdp.waitFor(async () => {
          const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
          return s && s.shown && s.items.length === 2 && !s.undoBanner ? s : null;
        }, "sau hoàn tác: modal lại 2 mục, banner Hoàn tác biến mất", 30000);
        void state;
        const chains = await cdp.evalJs(`${CHAINS_FN}(${JSON.stringify(appProjectId)}, ${JSON.stringify(seed.fragId)}, ${JSON.stringify(seed.ptrId)}, ${JSON.stringify(seed.hashB)})`);
        const fragIdsOk = chains.fragCount === 1 && !chains.envHasB;
        if (fragIdsOk) {
          // Bỏ qua mảnh (UI thật) → modal còn 1 mục (con trỏ), id mảnh ghi vào danh sách bỏ qua.
          const dismissed = await cdp.evalJs(`${CLICK_ITEM_FN}(${JSON.stringify(seed.fragId)}, "dismiss")`);
          if (!dismissed.clicked) { fail("U3", `không bấm được nút Bỏ qua: ${dismissed.reason}`); }
          else {
            const state2 = await cdp.waitFor(async () => {
              const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
              return s && s.shown && s.items.length === 1 && s.items[0].from === seed.ptrId ? s : null;
            }, "sau bỏ qua mảnh: modal còn 1 mục (con trỏ)", 30000);
            void state2;
            const chains2 = await cdp.evalJs(`${CHAINS_FN}(${JSON.stringify(appProjectId)}, ${JSON.stringify(seed.fragId)}, ${JSON.stringify(seed.ptrId)}, ${JSON.stringify(seed.hashB)})`);
            if (chains2.fragCount === 1 && chains2.dismissed.includes(seed.fragId)) {
              pass("U3", `hoàn tác: mảnh về lại modal + chuỗi gốc (1 version, envelope sạch hashB), rồi Bỏ qua ghi nhớ id mảnh`);
            } else {
              fail("U3", `sau khi bỏ qua mảnh: chains=${JSON.stringify(chains2)}`);
            }
          }
        } else {
          fail("U3", `sau hoàn tác: chains=${JSON.stringify(chains)} (muốn mảnh 1 version, envelope không có hashB)`);
        }
      }
    } catch (e) { fail("U3", `harness lỗi: ${e.message}`); }

    // ---- U4: mở lại mảnh đã bỏ qua từ HistoryPanel ----
    try {
      const opened = await cdp.evalJs(OPEN_HISTORY_FN);
      if (!opened.opened) { fail("U4", `không mở được panel Lịch sử: ${opened.reason}`); }
      else {
        const btn = await clickTestid(cdp, "history-open-dismissed");
        if (!btn.clicked) { fail("U4", `không bấm được nút mở mục đã bỏ qua: ${btn.reason}`); }
        else {
          const state = await cdp.waitFor(async () => {
            const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
            return s && s.shown && s.dismissed.some((d) => d.from === seed.fragId) ? s : null;
          }, "mục đã bỏ qua hiện trong modal", 30000);
          void state;
          await cdp.shot("legacy-adopt-dismissed.png");
          // Bấm Mở lại → mục quay lại hàng đợi (modal 2 mục), danh sách bỏ qua hết id mảnh.
          const reopened = await cdp.evalJs(`((from) => {
            const el = document.querySelector('[data-testid="legacy-adopt-dismissed-item"][data-from="' + from + '"]');
            if (!el) return { clicked: false, reason: "no-item" };
            const btn = el.querySelector('[data-testid="legacy-adopt-reopen"]');
            if (!btn) return { clicked: false, reason: "no-button" };
            btn.click();
            return { clicked: true };
          })(${JSON.stringify(seed.fragId)})`);
          if (!reopened.clicked) { fail("U4", `không bấm được nút Mở lại: ${reopened.reason}`); }
          else {
            const state2 = await cdp.waitFor(async () => {
              const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
              return s && s.shown && s.items.length === 2 && s.dismissed.length === 0 ? s : null;
            }, "sau mở lại: modal 2 mục chờ quyết định, mục đã bỏ qua hết", 30000);
            void state2;
            const chains = await cdp.evalJs(`${CHAINS_FN}(${JSON.stringify(appProjectId)}, ${JSON.stringify(seed.fragId)}, ${JSON.stringify(seed.ptrId)}, ${JSON.stringify(seed.hashB)})`);
            if (!chains.dismissed.includes(seed.fragId)) {
              pass("U4", `mở lại từ HistoryPanel: mục đã bỏ qua hiện đủ bằng chứng, Mở lại đưa về hàng đợi (modal 2 mục), danh sách bỏ qua hết id mảnh (screenshot legacy-adopt-dismissed.png)`);
            } else {
              fail("U4", `sau mở lại: dismissed vẫn chứa mảnh: ${JSON.stringify(chains.dismissed)}`);
            }
          }
        }
      }
    } catch (e) { fail("U4", `harness lỗi: ${e.message}`); }

    // ---- U5: đường nhập archive đầy đủ (đóng modal trước để input không bị backdrop che) ----
    try {
      await clickTestid(cdp, "legacy-adopt-close");
      await sleep(800);
      const Q = "99999999-8888-7777-6666-555555555555";
      const r = await cdp.evalJs(`${ARCHIVE_IMPORT_FN}(${JSON.stringify(Q)})`);
      if (!r.ok) {
        fail("U5", `nhập archive lỗi: via=${r.via} projectName=${r.projectName} reason=${r.reason || ""} errors=${JSON.stringify(r.errors || [])}`);
      } else if (r.afterDeleteCount !== 0) {
        fail("U5", `chuỗi Q chưa xóa khỏi kho trước khi nhập (còn ${r.afterDeleteCount}) — không còn là "chưa có trên máy này"`);
      } else if (r.projectName !== "Archive Test" || r.projectId !== Q) {
        fail("U5", `sau nhập archive: tên=${r.projectName} id=${r.projectId} (muốn Archive Test / ${Q})`);
      } else if (r.qCount !== 2) {
        fail("U5", `kho Q có ${r.qCount} version (muốn 2)`);
      } else if (!r.noteParams || r.noteParams.imported !== "2" || r.noteParams.skipped !== "0" || r.noteParams.conflicts !== "0") {
        fail("U5", `note lịch sử lệch: ${JSON.stringify(r.noteParams)} (muốn imported 2 / skipped 0 / conflicts 0)`);
      } else if (r.modalShown) {
        fail("U5", `modal nhận legacy hiện lại sau khi nhập archive (không nên — không có chuỗi mơ hồ)`);
      } else {
        const opened = await cdp.evalJs(ENSURE_HISTORY_FN);
        if (!opened.opened) { fail("U5", `không mở được panel Lịch sử để đếm hàng: ${opened.reason}`); }
        else {
          const rows = await cdp.waitFor(async () => {
            const rr = await cdp.evalJs(HISTORY_ROWS_FN).catch(() => null);
            return rr && rr.count === 2 ? rr : null;
          }, "panel Lịch sử đúng 2 hàng sau nhập archive", 30000);
          void rows;
          await cdp.shot("history-after-archive-import.png");
          pass("U5", `nhập archive qua ${r.via}: tên "Archive Test", kho Q có 2 version (chuỗi mới từ archive), note imported 2/skipped 0/conflicts 0, panel Lịch sử 2 hàng, modal không hiện lại (screenshot history-after-archive-import.png)`);
        }
      }
    } catch (e) { fail("U5", `harness lỗi: ${e.message}`); }

    // ---- U6: nhập lại (skipped) + archive sửa 1 version (conflicts) ----
    try {
      const a = await cdp.evalJs(`${ARCHIVE_REIMPORT_FN}()`);
      if (!a.noteParams || a.noteParams.imported !== "0" || a.noteParams.skipped !== "2" || a.noteParams.conflicts !== "0") {
        fail("U6", `nhập lại cùng archive: note=${JSON.stringify(a.noteParams)} (muốn imported 0 / skipped 2 / conflicts 0), qCount=${a.qCount}`);
      } else {
        const b = await cdp.evalJs(`${ARCHIVE_CONFLICT_FN}()`);
        if (!b.ok) {
          fail("U6", `nhập archive sửa lỗi: ${JSON.stringify(b)}`);
        } else if (!b.noteParams || b.noteParams.imported !== "0" || b.noteParams.skipped !== "1" || b.noteParams.conflicts !== "1") {
          fail("U6", `nhập archive sửa: note=${JSON.stringify(b.noteParams)} (muốn imported 0 / skipped 1 / conflicts 1), qCount=${b.qCount}`);
        } else if (!b.v1HashKept) {
          fail("U6", `xung đột: bản local version đầu bị ghi đè (hash đổi)`);
        } else {
          pass("U6", `xung đột có kiểm soát: nhập lại → skipped 2; archive sửa 1 version → skipped 1/conflicts 1, bản local giữ nguyên hash gốc, kho Q vẫn 2 version`);
        }
      }
    } catch (e) { fail("U6", `harness lỗi: ${e.message}`); }

    // ---- U7: 0 lỗi trang ----
    const errs = await drainErrors(cdp);
    if (errs.length === 0) pass("U7", "0 window.onerror/unhandledrejection trong suốt phiên");
    else fail("U7", `${errs.length} lỗi trang: ${errs.slice(0, 3).join(" || ")}`);

    const failed = results.filter((r) => !r.ok);
    writeFileEpermRetry(path.join(SCRATCH, "report.json"), JSON.stringify({ at: new Date().toISOString(), results, phaseErrors }, null, 2));
    log(`== KẾT QUẢ: ${results.filter((r) => r.ok).length}/${results.length} PASS ==`);
    killAll();
    process.exit(failed.length > 0 ? 1 : 0);
  } catch (e) {
    log(`HARNESS LỖI: ${e.message}`);
    try { fs.mkdirSync(SCRATCH, { recursive: true }); writeFileEpermRetry(path.join(SCRATCH, "report.json"), JSON.stringify({ at: new Date().toISOString(), harnessError: e.message, results }, null, 2)); } catch {}
    killAll();
    process.exit(2);
  }
}

void main();
