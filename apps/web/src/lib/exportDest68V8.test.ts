// exportDest68V8.test.ts — Phase 9 đợt 68, luồng V8: đích export .mp4 bền
// qua reopen theo jobId + kiểm tra download được trước khi hiện nút tải
// (đóng nợ đợt 67 U7 / ROUND67_LIMITS §5 mục 1–2).
//
// Tầng lib (hàm thuần, test ở đây):
//   - checkDownloadAvailable: HEAD /api/render/:id/download → 200 =
//     available, 404/409 = missing, lỗi khác/throw = unknown (không throw).
//   - findHistoryExportDest: tìm đích đã lưu của job trong lịch sử.
//   - exportDestStrings / exportDestString: chuỗi từ fragment round68-v8
//     (đọc trực tiếp, không chờ gộp dict — mẫu U7), không trả key thô.
//   - jobHistory67U7 (mở rộng đợt 68): historyEntryFromJob nhận đích,
//     upsert GIỮ đích cũ khi mục mới từ bridge không mang đích,
//     loadJobHistory đọc lại đích (mục cũ không có field → null).
// Tầng nối UI (kiểm chứng tĩnh, mẫu U7/T8): ExportPanel ghi đích vào lịch
// sử lúc POST xong (startRender), khôi phục đích khi mở từ lịch sử /
// resume lúc mount, HEAD kiểm tra khi job về done rồi mới hiện nút tải,
// job done mà output đã mất thì ẩn nút + báo rõ + cho xoá khỏi lịch sử.
// Tầng headed (clicktest-68v8-export-dest-headed.mjs + -electron.mjs) đo
// thật trên trình duyệt + Electron: reopen → đích bền, output mất →
// không anchor lỗi.
//
// Cách chạy (từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/exportDest68V8.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round68-v8/v8.test.cjs \
//     && node /tmp/round68-v8/v8.test.cjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  EXPORT_DEST_KEYS,
  EXPORT_DEST_LEAF_KEYS,
  checkDownloadAvailable,
  exportDestString,
  exportDestStrings,
  findHistoryExportDest,
  type DownloadAvailability,
} from "./exportDest68V8";
import {
  historyEntryFromJob,
  loadJobHistory,
  recordJobHistory,
  upsertHistoryEntry,
  type HistoryStore,
  type JobHistoryEntry,
} from "./jobHistory67U7";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5/R8/S10/T8/U7). */
declare const process: { cwd: () => string; exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`V8 export dest round 68: ${pass}/${queue.length} pass`);
}

/** Tìm file từ cwd (gốc repo hoặc apps/web), mẫu modalSheet63R1/R8/U7. */
function resolveFromCwd(...parts: string[]): string {
  const candidates = [
    resolve(process.cwd(), ...parts),
    resolve(process.cwd(), ...parts.slice(2)),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return candidates[0];
}

const FRAG_PATH = resolveFromCwd(
  "apps", "web", "src", "i18n", "fragments", "round68-v8.json",
);
const frag = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as {
  vi: { exportDest: Record<string, string> };
  en: { exportDest: Record<string, string> };
};

const EXPORT_PANEL_PATH = resolveFromCwd(
  "apps", "web", "src", "ExportPanel.tsx",
);
const exportPanelSrc = readFileSync(EXPORT_PANEL_PATH, "utf8");

const BRIDGE_INDEX_PATH = resolveFromCwd(
  "server", "bridge", "src", "index.js",
);
const bridgeSrc = readFileSync(BRIDGE_INDEX_PATH, "utf8");

const OPENAPI_PATH = resolveFromCwd("server", "bridge", "openapi.yaml");
const openapiSrc = readFileSync(OPENAPI_PATH, "utf8");

const VI_DICT_PATH = resolveFromCwd("apps", "web", "src", "i18n", "vi.json");
const EN_DICT_PATH = resolveFromCwd("apps", "web", "src", "i18n", "en.json");
const viDict = JSON.parse(readFileSync(VI_DICT_PATH, "utf8")) as Record<string, unknown>;
const enDict = JSON.parse(readFileSync(EN_DICT_PATH, "utf8")) as Record<string, unknown>;

/** Kho giả trong bộ nhớ (Map) — thay localStorage dưới node (mẫu U7). */
class MemoryStore implements HistoryStore {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function entry(id: string, status = "done", createdAt = 1000, exportDest?: string | null): JobHistoryEntry {
  return {
    id, jobId: id, kind: "render", status, progress: status === "done" ? 1 : 0,
    createdAt, updatedAt: createdAt,
    projectName: "Mẫu", presetLabel: "1080p",
    outputName: "mau.mp4", outputSize: 12345, error: null, note: null,
    exportDest: exportDest ?? null,
  };
}

// --- 1. checkDownloadAvailable: HEAD endpoint, 3 trạng thái, không throw ---
ok("checkDownloadAvailable: 200 → available (kèm HEAD đúng URL)", async () => {
  const calls: Array<{ url: string; init?: { method?: string } }> = [];
  const res = await checkDownloadAvailable("http://127.0.0.1:8999/", "abc123", async (url, init) => {
    calls.push({ url, init });
    return { status: 200, ok: true };
  });
  assert.equal(res, "available");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "http://127.0.0.1:8999/api/render/abc123/download");
  assert.equal(calls[0].init?.method, "HEAD");
});

ok("checkDownloadAvailable: 404 (job bị dọn) / 409 (output mất) → missing", async () => {
  const missing404: DownloadAvailability = await checkDownloadAvailable("http://b", "j1", async () => ({ status: 404, ok: false }));
  const missing409: DownloadAvailability = await checkDownloadAvailable("http://b", "j2", async () => ({ status: 409, ok: false }));
  assert.equal(missing404, "missing");
  assert.equal(missing409, "missing");
});

ok("checkDownloadAvailable: 500 / fetch throw / thiếu tham số → unknown (không throw, UI giữ hành vi cũ)", async () => {
  assert.equal(await checkDownloadAvailable("http://b", "j", async () => ({ status: 500, ok: false })), "unknown");
  assert.equal(await checkDownloadAvailable("http://b", "j", async () => { throw new Error("mất mạng"); }), "unknown");
  assert.equal(await checkDownloadAvailable("", "j"), "unknown");
  assert.equal(await checkDownloadAvailable("http://b", ""), "unknown");
});

ok("checkDownloadAvailable: jobId được encode (không vỡ URL khi id lạ)", async () => {
  let seen = "";
  await checkDownloadAvailable("http://b", "a/b c", async (url) => { seen = url; return { status: 200, ok: true }; });
  assert.ok(seen.includes("a%2Fb%20c"), `URL phải encode jobId, thấy ${seen}`);
});

// --- 2. findHistoryExportDest: tìm đích theo jobId ---
ok("findHistoryExportDest: tìm theo jobId/id, thiếu thì null", () => {
  const list = [entry("j1", "done", 1000, "/tmp/a.mp4"), entry("j2", "done", 2000, null)];
  assert.equal(findHistoryExportDest(list, "j1"), "/tmp/a.mp4");
  assert.equal(findHistoryExportDest(list, "j2"), null, "mục không có đích → null");
  assert.equal(findHistoryExportDest(list, "khong-co"), null);
  assert.equal(findHistoryExportDest(list, null), null);
  assert.equal(findHistoryExportDest(list, undefined), null);
  assert.equal(findHistoryExportDest(null, "j1"), null);
  assert.equal(findHistoryExportDest([], "j1"), null);
  // Đích rỗng không phải là đích hợp lệ.
  assert.equal(findHistoryExportDest([entry("j3", "done", 3000, "")], "j3"), null);
});

// --- 3. Persist đích trong kho lịch sử (jobHistory67U7 mở rộng đợt 68) ---
ok("historyEntryFromJob: nhận đích thứ 4; không truyền → null (không đoán)", () => {
  const withDest = historyEntryFromJob({ id: "x", status: "queued" }, "P", "1080p", "/home/u/x.mp4");
  assert.ok(withDest);
  assert.equal(withDest.exportDest, "/home/u/x.mp4");
  const withoutDest = historyEntryFromJob({ id: "x", status: "queued" }, "P", "1080p");
  assert.ok(withoutDest);
  assert.equal(withoutDest.exportDest, null);
  const emptyDest = historyEntryFromJob({ id: "x", status: "queued" }, "P", "1080p", "");
  assert.ok(emptyDest);
  assert.equal(emptyDest.exportDest, null, "đích rỗng → null, không lưu chuỗi rỗng");
});

ok("upsertHistoryEntry: hợp nhất từ bridge (không mang đích) GIỮ đích cũ — không xoá đích đã lưu", () => {
  const stored = entry("j1", "queued", 1000, "/tmp/cu.mp4");
  const fromBridge = entry("j1", "done", 9000, null); // poll/mount: trạng thái mới, không biết đích
  const next = upsertHistoryEntry([stored], fromBridge);
  assert.equal(next.length, 1);
  assert.equal(next[0].status, "done", "trạng thái mới thắng");
  assert.equal(next[0].createdAt, 1000, "vẫn giữ createdAt gốc (U7 khóa)");
  assert.equal(next[0].exportDest, "/tmp/cu.mp4", "hợp nhất bridge KHÔNG được xoá đích đã lưu");
});

ok("upsertHistoryEntry: mục mới mang đích thì đích mới thắng", () => {
  const stored = entry("j1", "queued", 1000, "/tmp/cu.mp4");
  const newer = entry("j1", "done", 9000, "/tmp/moi.mp4");
  assert.equal(upsertHistoryEntry([stored], newer)[0].exportDest, "/tmp/moi.mp4");
});

ok("recordJobHistory + loadJobHistory: đích đi qua kho JSON (round-trip), mục cũ thiếu field → null", () => {
  const store = new MemoryStore();
  recordJobHistory(entry("j1", "done", 1000, "/tmp/a.mp4"), store);
  const loaded = loadJobHistory(store);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].exportDest, "/tmp/a.mp4");
  // Mục cũ (trước đợt 68) không có field exportDest trong JSON → null.
  store.setItem("vcut.jobHistory.v1", JSON.stringify([{
    id: "cu", jobId: "cu", kind: "render", status: "done", progress: 1,
    createdAt: 500, updatedAt: 500, projectName: null, presetLabel: null,
    outputName: null, outputSize: null, error: null, note: null,
  }]));
  assert.equal(loadJobHistory(store)[0].exportDest, null);
});

// --- 4. Chuỗi fragment round68-v8: đủ key, vi≠en, không collision dict ---
ok("fragment round68-v8: đủ 4 key vi+en, không rỗng, vi khác en", () => {
  assert.deepEqual([...EXPORT_DEST_KEYS].sort(), EXPORT_DEST_LEAF_KEYS.map((k) => `exportDest.${k}`).sort());
  assert.equal(EXPORT_DEST_LEAF_KEYS.length, 4);
  for (const k of EXPORT_DEST_LEAF_KEYS) {
    const vi = frag.vi.exportDest[k];
    const en = frag.en.exportDest[k];
    assert.ok(typeof vi === "string" && vi.length > 0, `thiếu vi ${k}`);
    assert.ok(typeof en === "string" && en.length > 0, `thiếu en ${k}`);
    assert.notEqual(vi, en, `${k}: vi phải khác en`);
  }
});

ok("fragment round68-v8: namespace exportDest.* ĐÃ có trong dict (parent gộp đợt 68, khớp fragment, không collision)", () => {
  for (const lang of ["vi", "en"] as const) {
    const dict = lang === "vi" ? viDict : enDict;
    const ns = dict.exportDest as Record<string, string> | undefined;
    assert.ok(ns, `${lang}.json thiếu exportDest (parent chưa gộp fragment)`);
    assert.deepEqual(Object.keys(ns).sort(), [...EXPORT_DEST_LEAF_KEYS].sort());
    for (const k of EXPORT_DEST_LEAF_KEYS) {
      assert.equal(ns[k], frag[lang].exportDest[k], `${lang}.exportDest.${k} khác fragment`);
    }
  }
});

ok("fragment round68-v8: savedTo có placeholder {path} ở cả vi+en", () => {
  assert.ok(frag.vi.exportDest.savedTo.includes("{path}"), "vi savedTo phải có {path}");
  assert.ok(frag.en.exportDest.savedTo.includes("{path}"), "en savedTo phải có {path}");
});

ok("exportDestStrings: vi/en ra đúng chuỗi fragment; thiếu key → rỗng (component ẩn)", () => {
  assert.equal(exportDestStrings("vi").checking, frag.vi.exportDest.checking);
  assert.equal(exportDestStrings("en").missing, frag.en.exportDest.missing);
  assert.equal(exportDestString("khongCoKeyNay", "vi"), undefined);
  const table = { vi: { checking: "VI" }, en: {} as Record<string, string> };
  assert.equal(exportDestString("checking", "en", table), "VI", "thiếu en → rớt về vi");
  assert.equal(exportDestStrings("vi", table).missing, "", "thiếu key thì chuỗi rỗng để component ẩn");
});

// --- 5. Tầng nối UI (tĩnh): ExportPanel ---
ok("ExportPanel startRender: ghi đích vào lịch sử cùng jobId lúc POST xong", () => {
  const idx = exportPanelSrc.indexOf("const startRender");
  assert.ok(idx >= 0, "thiếu startRender");
  const body = exportPanelSrc.slice(idx, idx + 8000);
  assert.ok(body.includes("let pickedDest: string | null = null;"), "startRender phải giữ đích đã chọn trong biến cục bộ (không tin state chưa flush)");
  assert.ok(body.includes("pickedDest = dest;"), "đích Electron phải gán vào pickedDest");
  assert.ok(body.includes("recordHistoryFromJob({ id, status: \"queued\", progress: 0, createdAt: Date.now() }, pickedDest)"), "POST xong phải ghi lịch sử kèm đích đã chọn");
});

ok("ExportPanel openHistoryEntry: khôi phục đích từ mục lịch sử trước khi hiện kết quả", () => {
  const idx = exportPanelSrc.indexOf("const openHistoryEntry");
  assert.ok(idx >= 0, "thiếu openHistoryEntry");
  const block = exportPanelSrc.slice(idx, idx + 2400);
  assert.ok(block.includes("setExportDest(entry.exportDest ?? null)"), "mở từ lịch sử phải khôi phục đích đã lưu vào state exportDest");
});

ok("ExportPanel mount resume: khôi phục đích khi nối job lúc mở lại panel", () => {
  assert.ok(exportPanelSrc.includes("restoreExportDest(job.id)"), "mount resume / chờ upload phải khôi phục đích của job nối lại");
  const hits = exportPanelSrc.match(/restoreExportDest\(job\.id\)/g) || [];
  assert.ok(hits.length >= 3, `cần khôi phục đích ở cả 3 đường nối lại (candidate + chờ upload done + chờ upload running), thấy ${hits.length}`);
});

ok("ExportPanel kiểm tra download khi job done rồi mới hiện nút tải", () => {
  assert.ok(exportPanelSrc.includes("checkDownloadAvailable(BRIDGE_URL, jobId)"), "phải HEAD kiểm tra download khi job về done");
  assert.ok(exportPanelSrc.includes('data-download-state='), "banner done phải mang data-download-state để headed đọc trạng thái kiểm tra");
  assert.ok(exportPanelSrc.includes("downloadAvailable === false"), "phải có nhánh output đã mất (ẩn nút tải)");
  assert.ok(exportPanelSrc.includes("exportDestStringsForLang.missing"), "nhánh mất output phải hiện chuỗi báo rõ");
  assert.ok(exportPanelSrc.includes("exportDestStringsForLang.checking"), "lúc đang kiểm tra phải hiện chuỗi đang kiểm tra (chưa hiện nút)");
  assert.ok(exportPanelSrc.includes("deleteMissingDownload"), "phải có handler xoá khỏi lịch sử khi output đã mất");
  const idx = exportPanelSrc.indexOf("const deleteMissingDownload");
  assert.ok(idx >= 0, "thiếu deleteMissingDownload");
  const block = exportPanelSrc.slice(idx, idx + 800);
  assert.ok(block.includes("removeJobHistory(jobId)"), "xoá khi output mất phải xoá khỏi kho lịch sử đã persist");
  assert.ok(block.includes('setRenderStatus("idle")'), "xoá xong phải về idle");
});

ok("ExportPanel banner done: hiện đích đã chọn/khôi phục trong Electron + giữ đường anchor web cũ", () => {
  assert.ok(exportPanelSrc.includes("exportDestStringsForLang.savedTo.replace(\"{path}\", exportDest)"), "banner done (Electron) phải hiện đích sẽ lưu ra");
  assert.ok(exportPanelSrc.includes("data-export-dest={exportDest}"), "banner phải mang data-export-dest để headed đọc đích đang dùng");
  assert.ok(
    exportPanelSrc.includes("if (isNativeDesktop() && exportDest) {"),
    "downloadMp4 phải giữ nhánh native (saveExportNative khi có đích)",
  );
  assert.ok(
    exportPanelSrc.includes("a.href = `${BRIDGE_URL}/api/render/${jobId}/download`;"),
    "downloadMp4 phải giữ đường anchor web khi không có đích native",
  );
});

// --- 6. Bridge: HEAD endpoint tối thiểu (tĩnh) ---
ok("bridge có handler HEAD /api/render/:id/download riêng (không để Express map sang GET rồi stream MP4)", () => {
  assert.ok(bridgeSrc.includes('app.head("/api/render/:id/download"'), "bridge phải có app.head riêng cho download");
  const idx = bridgeSrc.indexOf('app.head("/api/render/:id/download"');
  const block = bridgeSrc.slice(idx, idx + 1200);
  assert.ok(block.includes('res.status(404).json(apiError("JOB_NOT_FOUND"'), "HEAD: job không có → 404 JOB_NOT_FOUND");
  assert.ok(block.includes('res.status(409).json(apiError("JOB_NOT_DONE"'), "HEAD: job chưa xong / output mất → 409 JOB_NOT_DONE");
  assert.ok(block.includes('res.setHeader("Content-Length"'), "HEAD 200 phải kèm Content-Length");
  assert.ok(block.includes("fs.existsSync(job.outPath)"), "HEAD phải kiểm tra file output còn tồn tại trên đĩa");
});

ok("openapi.yaml ghi nhận HEAD checkRenderDownload (cùng mã lỗi với GET)", () => {
  assert.ok(openapiSrc.includes("operationId: checkRenderDownload"), "openapi phải có operationId checkRenderDownload");
  assert.ok(openapiSrc.includes("head:"), "openapi phải có khối head: cho /download");
});

runAll();
