// jobHistory67U7.test.ts — Phase 9 đợt 67, luồng U7: UI lịch sử job +
// nhánh `interrupted` trong poll khi bridge restart + resume upload khi
// đóng panel (đóng nợ đợt 66 T8 / ROUND66_LIMITS §8.7).
//
// Tầng lib (hàm thuần + kho inject được, test ở đây):
//   - historyEntryFromJob / upsertHistoryEntry / removeHistoryEntry /
//     loadJobHistory / recordJobHistory / removeJobHistory: lịch sử
//     persist local, dedupe theo id (giữ createdAt gốc), mới nhất
//     trước, tối đa 20 mục, JSON hỏng → rỗng.
//   - begin/read/clearUploadSession + isUploadSessionStale +
//     findJobCreatedAfter: phiên upload đang bay (ghi trước POST,
//     khớp job tạo sau startedAt, stale >10 phút).
//   - jobHistoryStrings / historyStatusLabel: chuỗi từ fragment
//     round67-u7 (đọc trực tiếp, không chờ gộp dict — mẫu T8), không
//     bao giờ trả key thô.
// Tầng nối UI (kiểm chứng tĩnh, mẫu jobNote65S10/T8): ExportPanel ghi
// lịch sử ở mọi chuyển trạng thái terminal trong poll (kể cả nhánh
// `interrupted` mới), mount hợp nhất GET /api/render vào lịch sử +
// resume phiên upload, section .job-history với Xem kết quả / Theo dõi
// tiếp / Render lại / Xoá; giữ nguyên literal T8 khóa (retry ${jobId},
// poll 1s + getLang, setRenderNote(null) ≥2).
// Tầng headed (clicktest-67u7-job-history-headed.mjs) đo thật trên
// trình duyệt: restart bridge giữa lúc panel đang mở → nhánh
// interrupted hiện ngay không cần mở lại; job done → đóng/mở panel →
// lịch sử mở lại đúng kết quả; đóng panel giữa lúc upload (throttle
// CDP) → mở lại resume upload, không nhân đôi job.
//
// Cách chạy (từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/jobHistory67U7.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round67-u7/u7.test.cjs \
//     && node /tmp/round67-u7/u7.test.cjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  JOB_HISTORY_KEYS,
  JOB_HISTORY_LEAF_KEYS,
  JOB_HISTORY_MAX_ENTRIES,
  UPLOAD_JOB_MATCH_TOLERANCE_MS,
  UPLOAD_SESSION_MAX_AGE_MS,
  UPLOAD_WAIT_TIMEOUT_MS,
  beginUploadSession,
  clearUploadSession,
  findJobCreatedAfter,
  historyEntryFromJob,
  historyStatusLabel,
  isTerminalHistoryStatus,
  isUploadSessionStale,
  jobHistoryString,
  jobHistoryStrings,
  loadJobHistory,
  readUploadSession,
  recordJobHistory,
  removeHistoryEntry,
  removeJobHistory,
  upsertHistoryEntry,
  type BridgeJobLike,
  type HistoryStore,
  type JobHistoryEntry,
} from "./jobHistory67U7";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5/R8/S10/T8). */
declare const process: { cwd: () => string; exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`U7 job history round 67: ${pass}/${queue.length} pass`);
}

/** Tìm file từ cwd (gốc repo hoặc apps/web), mẫu modalSheet63R1/R8. */
function resolveFromCwd(...parts: string[]): string {
  const candidates = [
    resolve(process.cwd(), ...parts),
    resolve(process.cwd(), ...parts.slice(2)),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return candidates[0];
}

const FRAG_PATH = resolveFromCwd(
  "apps", "web", "src", "i18n", "fragments", "round67-u7.json",
);
const frag = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as {
  vi: { jobHistory: Record<string, string> };
  en: { jobHistory: Record<string, string> };
};

const EXPORT_PANEL_PATH = resolveFromCwd(
  "apps", "web", "src", "ExportPanel.tsx",
);
const exportPanelSrc = readFileSync(EXPORT_PANEL_PATH, "utf8");

const STYLES_PATH = resolveFromCwd("apps", "web", "src", "styles.css");
const stylesSrc = readFileSync(STYLES_PATH, "utf8");

const VI_DICT_PATH = resolveFromCwd("apps", "web", "src", "i18n", "vi.json");
const EN_DICT_PATH = resolveFromCwd("apps", "web", "src", "i18n", "en.json");
const viDict = JSON.parse(readFileSync(VI_DICT_PATH, "utf8")) as Record<string, unknown>;
const enDict = JSON.parse(readFileSync(EN_DICT_PATH, "utf8")) as Record<string, unknown>;

/** Kho giả trong bộ nhớ (Map) — thay localStorage dưới node. */
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

function entry(id: string, status = "done", createdAt = 1000): JobHistoryEntry {
  return {
    id, jobId: id, kind: "render", status, progress: status === "done" ? 1 : 0,
    createdAt, updatedAt: createdAt,
    projectName: "Mẫu", presetLabel: "1080p",
    outputName: "mau.mp4", outputSize: 12345, error: null, note: null,
  };
}

// --- 1. historyEntryFromJob: map job bridge → mục lịch sử ---
ok("historyEntryFromJob: map đủ field (id/status/progress/outputName/outputSize/error/note)", () => {
  const job: BridgeJobLike = {
    id: "abc", status: "done", progress: 1, createdAt: 5000,
    outputName: "x.mp4", outputSize: 999, error: null, note: "ghi chú",
  };
  const e = historyEntryFromJob(job, "Dự án X", "720p");
  assert.ok(e);
  assert.equal(e.id, "abc");
  assert.equal(e.jobId, "abc");
  assert.equal(e.kind, "render");
  assert.equal(e.status, "done");
  assert.equal(e.progress, 1);
  assert.equal(e.createdAt, 5000);
  assert.equal(e.outputName, "x.mp4");
  assert.equal(e.outputSize, 999);
  assert.equal(e.note, "ghi chú");
  assert.equal(e.projectName, "Dự án X");
  assert.equal(e.presetLabel, "720p");
});

ok("historyEntryFromJob: job không id → null (không ghi mục mồ côi)", () => {
  assert.equal(historyEntryFromJob(null), null);
  assert.equal(historyEntryFromJob(undefined), null);
  assert.equal(historyEntryFromJob({}), null);
  assert.equal(historyEntryFromJob({ id: "" }), null);
  assert.equal(historyEntryFromJob({ id: 42 } as unknown as BridgeJobLike), null);
});

ok("historyEntryFromJob: thiếu field → mặc định an toàn (status error, progress 0)", () => {
  const e = historyEntryFromJob({ id: "x" });
  assert.ok(e);
  assert.equal(e.status, "error");
  assert.equal(e.progress, 0);
  assert.equal(e.outputName, null);
  assert.equal(e.outputSize, null);
  assert.equal(e.projectName, null);
});

ok("isTerminalHistoryStatus: done/error/cancelled/interrupted là cuối; running/queued/uploading không", () => {
  for (const s of ["done", "error", "cancelled", "interrupted"]) assert.equal(isTerminalHistoryStatus(s), true, s);
  for (const s of ["running", "queued", "uploading", "", null, undefined]) assert.equal(isTerminalHistoryStatus(s), false, String(s));
});

// --- 2. upsert/remove: dedupe + thứ tự + trần 20 ---
ok("upsertHistoryEntry: trùng id → 1 mục, trạng thái mới thắng, GIỮ createdAt gốc", () => {
  const a = entry("j1", "running", 1000);
  const b = entry("j1", "done", 9000); // poll cập nhật: createdAt mới là giờ poll, phải giữ 1000
  const next = upsertHistoryEntry([a], b);
  assert.equal(next.length, 1);
  assert.equal(next[0].status, "done");
  assert.equal(next[0].createdAt, 1000, "cập nhật trạng thái không được đẩy job cũ lên đầu lịch sử");
  assert.ok(next[0].updatedAt >= 1000);
});

ok("upsertHistoryEntry: mới nhất trước theo createdAt desc", () => {
  const next = upsertHistoryEntry([entry("old", "done", 1000)], entry("new", "done", 2000));
  assert.deepEqual(next.map((e) => e.id), ["new", "old"]);
  const rev = upsertHistoryEntry([entry("new", "done", 2000)], entry("old", "done", 1000));
  assert.deepEqual(rev.map((e) => e.id), ["new", "old"]);
});

ok("upsertHistoryEntry: cắt ở 20 mục — mục cũ nhất rớt", () => {
  let list: JobHistoryEntry[] = [];
  for (let i = 0; i < 25; i++) list = upsertHistoryEntry(list, entry(`j${i}`, "done", 1000 + i));
  assert.equal(list.length, JOB_HISTORY_MAX_ENTRIES);
  assert.equal(JOB_HISTORY_MAX_ENTRIES, 20);
  assert.equal(list[0].id, "j24");
  assert.equal(list[list.length - 1].id, "j5");
});

ok("removeHistoryEntry: xoá đúng id, giữ các mục khác", () => {
  const list = [entry("a", "done", 3000), entry("b", "done", 2000), entry("c", "done", 1000)];
  assert.deepEqual(removeHistoryEntry(list, "b").map((e) => e.id), ["a", "c"]);
  assert.equal(removeHistoryEntry(list, "khong-co").length, 3);
});

// --- 3. Persist: load/record/remove qua kho ---
ok("recordJobHistory: ghi xuống kho + đọc lại được (JSON trong kho khớp danh sách)", () => {
  const store = new MemoryStore();
  const after = recordJobHistory(entry("j1", "done", 1000), store);
  assert.equal(after.length, 1);
  const raw = store.getItem("vcut.jobHistory.v1");
  assert.ok(raw, "phải ghi key vcut.jobHistory.v1");
  const parsed = JSON.parse(raw) as JobHistoryEntry[];
  assert.equal(parsed[0].id, "j1");
  assert.deepEqual(loadJobHistory(store), after);
});

ok("recordJobHistory: ghi đè cùng id không nhân đôi mục trong kho", () => {
  const store = new MemoryStore();
  recordJobHistory(entry("j1", "running", 1000), store);
  const after = recordJobHistory(entry("j1", "done", 1000), store);
  assert.equal(after.length, 1);
  assert.equal(after[0].status, "done");
});

ok("loadJobHistory: JSON hỏng / sai dạng → rỗng (không crash app)", () => {
  const store = new MemoryStore();
  store.setItem("vcut.jobHistory.v1", "{khong-phai-json");
  assert.deepEqual(loadJobHistory(store), []);
  store.setItem("vcut.jobHistory.v1", JSON.stringify({ khong: "phai-mang" }));
  assert.deepEqual(loadJobHistory(store), []);
  store.setItem("vcut.jobHistory.v1", JSON.stringify([{ id: "", status: "done", createdAt: 1 }, entry("ok", "done", 5)]));
  assert.deepEqual(loadJobHistory(store).map((e) => e.id), ["ok"]);
});

ok("removeJobHistory: xoá khỏi kho đã persist", () => {
  const store = new MemoryStore();
  recordJobHistory(entry("a", "done", 3000), store);
  recordJobHistory(entry("b", "done", 2000), store);
  const after = removeJobHistory("a", store);
  assert.deepEqual(after.map((e) => e.id), ["b"]);
  assert.deepEqual(loadJobHistory(store).map((e) => e.id), ["b"]);
});

// --- 4. Phiên upload đang bay ---
ok("upload session: begin → read → clear (round-trip qua kho)", () => {
  const store = new MemoryStore();
  assert.equal(readUploadSession(store), null);
  const s = beginUploadSession({ startedAt: 777000, projectName: "P", presetLabel: "1080p", mediaNames: ["a.mp4"] }, store);
  assert.equal(s.startedAt, 777000);
  assert.deepEqual(readUploadSession(store), s);
  clearUploadSession(store);
  assert.equal(readUploadSession(store), null);
});

ok("upload session: JSON hỏng / thiếu startedAt → null (về idle)", () => {
  const store = new MemoryStore();
  store.setItem("vcut.uploadSession.v1", "khong-phai-json");
  assert.equal(readUploadSession(store), null);
  store.setItem("vcut.uploadSession.v1", JSON.stringify({ projectName: "P" }));
  assert.equal(readUploadSession(store), null);
});

ok("isUploadSessionStale: ≤10 phút là tươi, >10 phút là stale", () => {
  assert.equal(UPLOAD_SESSION_MAX_AGE_MS, 10 * 60 * 1000);
  const s = { startedAt: 1_000_000, projectName: null, presetLabel: null, mediaNames: [] };
  assert.equal(isUploadSessionStale(s, 1_000_000 + 9 * 60 * 1000), false);
  assert.equal(isUploadSessionStale(s, 1_000_000 + 10 * 60 * 1000 + 1), true);
  assert.equal(isUploadSessionStale(null), true);
  assert.equal(isUploadSessionStale(undefined), true);
});

ok("UPLOAD_WAIT_TIMEOUT_MS = 120s (đủ chờ upload local xong, không chờ mù)", () => {
  assert.equal(UPLOAD_WAIT_TIMEOUT_MS, 120_000);
});

ok("findJobCreatedAfter: chỉ job tạo sau startedAt (dung sai 5s), mới nhất thắng", () => {
  assert.equal(UPLOAD_JOB_MATCH_TOLERANCE_MS, 5_000);
  const jobs: BridgeJobLike[] = [
    { id: "old", status: "done", createdAt: 900_000 },
    { id: "a", status: "running", createdAt: 1_000_000 },
    { id: "b", status: "queued", createdAt: 1_000_500 },
  ];
  assert.equal(findJobCreatedAfter(jobs, 999_000)?.id, "b");
  assert.equal(findJobCreatedAfter(jobs, 2_000_000), null);
  // Dung sai: job tạo đúng 5s TRƯỚC startedAt vẫn khớp (lệch đồng hồ).
  assert.equal(findJobCreatedAfter([{ id: "t", status: "running", createdAt: 995_000 }], 1_000_000)?.id, "t");
  // Quá dung sai (5s + 1ms trước) thì không khớp.
  assert.equal(findJobCreatedAfter([{ id: "t", status: "running", createdAt: 994_999 }], 1_000_000), null);
  // Thiếu createdAt / thiếu id thì bỏ qua, không đoán.
  assert.equal(findJobCreatedAfter([{ id: "n", status: "running" }], 999_000), null);
  assert.equal(findJobCreatedAfter([{ status: "running", createdAt: 1_000_000 }], 999_000), null);
  assert.equal(findJobCreatedAfter([], 999_000), null);
  assert.equal(findJobCreatedAfter(null, 999_000), null);
});

// --- 5. Chuỗi fragment: đủ key, vi≠en, không trả key thô, không collision dict ---
ok("fragment round67-u7: đủ 15 key vi+en, không rỗng, vi khác en", () => {
  assert.deepEqual([...JOB_HISTORY_KEYS].sort(), JOB_HISTORY_LEAF_KEYS.map((k) => `jobHistory.${k}`).sort());
  assert.equal(JOB_HISTORY_LEAF_KEYS.length, 15);
  for (const k of JOB_HISTORY_LEAF_KEYS) {
    const vi = frag.vi.jobHistory[k];
    const en = frag.en.jobHistory[k];
    assert.ok(typeof vi === "string" && vi.length > 0, `thiếu vi ${k}`);
    assert.ok(typeof en === "string" && en.length > 0, `thiếu en ${k}`);
    assert.notEqual(vi, en, `${k}: vi phải khác en`);
  }
});

ok("fragment round67-u7: namespace jobHistory.* ĐÃ có trong dict (parent gộp đợt 67, khớp fragment, không collision)", () => {
  for (const lang of ["vi", "en"] as const) {
    const dict = lang === "vi" ? viDict : enDict;
    const ns = dict.jobHistory as Record<string, string> | undefined;
    assert.ok(ns, `${lang}.json thiếu jobHistory (parent chưa gộp fragment)`);
    assert.deepEqual(Object.keys(ns).sort(), [...JOB_HISTORY_LEAF_KEYS].sort());
    for (const k of JOB_HISTORY_LEAF_KEYS) {
      assert.equal(ns[k], frag[lang].jobHistory[k], `${lang}.jobHistory.${k} khác fragment`);
    }
  }
});

ok("jobHistoryStrings: vi/en ra đúng chuỗi fragment", () => {
  assert.equal(jobHistoryStrings("vi").title, frag.vi.jobHistory.title);
  assert.equal(jobHistoryStrings("en").title, frag.en.jobHistory.title);
  assert.equal(jobHistoryStrings("vi").uploadWaiting, frag.vi.jobHistory.uploadWaiting);
  assert.equal(jobHistoryStrings("en").uploadFailed, frag.en.jobHistory.uploadFailed);
});

ok("jobHistoryString: thiếu key → undefined; thiếu en → rớt về vi (không in key thô)", () => {
  assert.equal(jobHistoryString("khongCoKeyNay", "vi"), undefined);
  assert.equal(jobHistoryString("khongCoKeyNay", "en"), undefined);
  const table = { vi: { title: "VI" }, en: {} as Record<string, string> };
  assert.equal(jobHistoryString("title", "en", table), "VI");
  assert.equal(jobHistoryStrings("vi", table).title, "VI");
  assert.equal(jobHistoryStrings("vi", table).empty, "", "thiếu key thì chuỗi rỗng để component ẩn");
});

ok("historyStatusLabel: đủ 7 trạng thái vi/en + mục lỗi upload hiện 'Tải lên thất bại'", () => {
  const cases: Array<[string, string, string]> = [
    ["done", "Xong", "Done"],
    ["running", "Đang chạy", "Running"],
    ["queued", "Đang chờ", "Queued"],
    ["error", "Lỗi", "Failed"],
    ["cancelled", "Đã huỷ", "Cancelled"],
    ["interrupted", "Gián đoạn", "Interrupted"],
    ["uploading", "Đang tải lên", "Uploading"],
  ];
  for (const [status, vi, en] of cases) {
    assert.equal(historyStatusLabel(entry("x", status), "vi"), vi, status);
    assert.equal(historyStatusLabel(entry("x", status), "en"), en, status);
  }
  const uploadErr: JobHistoryEntry = { ...entry("u", "error"), kind: "upload", jobId: null };
  assert.equal(historyStatusLabel(uploadErr, "vi"), "Tải lên thất bại");
  assert.equal(historyStatusLabel(uploadErr, "en"), "Upload failed");
  // Trạng thái lạ → trả trạng thái thô, không trả key i18n.
  assert.equal(historyStatusLabel(entry("x", "weird-status"), "vi"), "weird-status");
});

// --- 6. Tầng nối UI (tĩnh): ExportPanel ---
ok("ExportPanel pollStatus có nhánh terminal cho interrupted (nợ T8 §5.3)", () => {
  const pollIdx = exportPanelSrc.indexOf("const pollStatus");
  assert.ok(pollIdx >= 0, "thiếu pollStatus");
  const pollBlock = exportPanelSrc.slice(pollIdx, exportPanelSrc.indexOf("}, 1000);", pollIdx));
  assert.ok(pollBlock.includes('data.status === "interrupted"'), "pollStatus phải có nhánh data.status === \"interrupted\"");
  const intIdx = pollBlock.indexOf('data.status === "interrupted"');
  const intBranch = pollBlock.slice(intIdx, intIdx + 1600);
  assert.ok(intBranch.includes("stopPolling()"), "nhánh interrupted phải dừng poll (không kẹt poll mãi)");
  assert.ok(intBranch.includes('setRenderStatus("error")'), "nhánh interrupted phải về trạng thái error (hiện lỗi + nút Render lại)");
  assert.ok(intBranch.includes("recordHistoryFromJob(data)"), "nhánh interrupted phải ghi lịch sử");
});

ok("ExportPanel poll ghi lịch sử ở mọi chuyển trạng thái terminal (done/error/cancelled)", () => {
  const pollIdx = exportPanelSrc.indexOf("const pollStatus");
  const pollBlock = exportPanelSrc.slice(pollIdx, exportPanelSrc.indexOf("}, 1000);", pollIdx));
  const hits = pollBlock.match(/recordHistoryFromJob\(data\)/g) || [];
  assert.ok(hits.length >= 4, `poll phải ghi lịch sử ở done/error/interrupted/cancelled (thấy ${hits.length} lần)`);
});

ok("ExportPanel có section lịch sử job (.job-history) với đủ hành động", () => {
  assert.ok(exportPanelSrc.includes('className="job-history"'), "thiếu section .job-history");
  assert.ok(exportPanelSrc.includes("historyStrings.title"), "tiêu đề lịch sử phải dùng chuỗi fragment");
  assert.ok(exportPanelSrc.includes("historyStrings.openResult"), "phải có nút Xem kết quả (job done)");
  assert.ok(exportPanelSrc.includes("historyStrings.resume"), "phải có nút Theo dõi tiếp (job đang chạy)");
  assert.ok(exportPanelSrc.includes("historyStrings.delete"), "phải có nút Xoá khỏi lịch sử");
  assert.ok(exportPanelSrc.includes("historyStatusLabel(entry, lang)"), "mỗi dòng phải hiện nhãn trạng thái đã dịch");
  assert.ok(exportPanelSrc.includes("data-history-count={jobHistory.length}"), "section phải mang data-history-count để headed đếm");
  assert.ok(exportPanelSrc.includes("loadJobHistory()"), "lịch sử phải nạp từ localStorage lúc mount");
});

ok("ExportPanel mở lại job done từ lịch sử: hiện đúng trạng thái done + tải được (không idle)", () => {
  assert.ok(exportPanelSrc.includes("const openHistoryEntry"), "thiếu openHistoryEntry (mở job từ lịch sử)");
  const idx = exportPanelSrc.indexOf("const openHistoryEntry");
  const block = exportPanelSrc.slice(idx, idx + 2400);
  assert.ok(block.includes('fetch(`${BRIDGE_URL}/api/render/${entry.jobId}?detail=1`)'), "mở từ lịch sử phải GET trạng thái thật từ bridge trước khi hiện");
  assert.ok(block.includes('setRenderStatus("done")'), "job done phải hiện trạng thái done (banner tải MP4)");
  assert.ok(block.includes("applyResumedJob(job)"), "job đang chạy/lỗi mở từ lịch sử phải nối tiếp qua applyResumedJob");
});

ok("ExportPanel retry từ lịch sử POST đúng endpoint retry rồi poll tiếp", () => {
  assert.ok(exportPanelSrc.includes("const retryHistoryJob"), "thiếu retryHistoryJob");
  const idx = exportPanelSrc.indexOf("const retryHistoryJob");
  const block = exportPanelSrc.slice(idx, idx + 1600);
  assert.ok(block.includes("/retry"), "retry từ lịch sử phải POST /api/render/:id/retry");
  assert.ok(block.includes("refreshJobAfterRetry"), "retry xong phải lấy trạng thái mới + poll tiếp");
});

ok("ExportPanel startRender ghi phiên upload trước POST + xoá session khi POST xong", () => {
  assert.ok(exportPanelSrc.includes("beginUploadSession({"), "startRender phải ghi phiên upload trước khi POST");
  const idx = exportPanelSrc.indexOf("const startRender");
  assert.ok(idx >= 0, "thiếu startRender");
  const body = exportPanelSrc.slice(idx, idx + 7500);
  assert.ok(body.includes("beginUploadSession({"), "beginUploadSession phải nằm trong startRender");
  assert.ok(body.includes("clearUploadSession();"), "POST xong phải xoá phiên upload");
  // POST lỗi (kể cả khi panel đã đóng giữa lúc upload): ghi mục lỗi upload vào lịch sử.
  assert.ok(body.includes('id: `upload-${'), "POST lỗi phải ghi mục lịch sử kind upload (id upload-<startedAt>)");
});

ok("ExportPanel mount: hợp nhất GET /api/render vào lịch sử + resume phiên upload đang bay", () => {
  assert.ok(exportPanelSrc.includes("historyEntryFromJob(j"), "mount phải hợp nhất từng job bridge vào lịch sử");
  assert.ok(exportPanelSrc.includes("readUploadSession()"), "mount phải đọc phiên upload đang bay");
  assert.ok(exportPanelSrc.includes("isUploadSessionStale("), "mount phải kiểm tra session stale (>10 phút)");
  assert.ok(exportPanelSrc.includes("findJobCreatedAfter("), "chờ upload phải khớp job tạo sau startedAt");
  assert.ok(exportPanelSrc.includes("UPLOAD_WAIT_TIMEOUT_MS"), "chờ upload phải có hạn 120s (không chờ mù)");
  assert.ok(exportPanelSrc.includes("setUploadWaiting(true)"), "lúc chờ job upload phải bật cờ uploadWaiting");
  assert.ok(exportPanelSrc.includes("historyStrings.uploadWaiting"), "lúc chờ phải hiện ghi chú upload đang tiếp tục");
});

ok("ExportPanel giữ nguyên literal T8 khóa: retry dùng ${jobId} + poll 1s + getLang + setRenderNote(null) ≥2", () => {
  assert.ok(
    exportPanelSrc.includes('fetch(`${BRIDGE_URL}/api/render/${jobId}/retry`, { method: "POST" })'),
    "retryRender phải giữ literal POST /api/render/${jobId}/retry (T8 khóa)",
  );
  assert.ok(
    exportPanelSrc.includes("resolveJobNote(data.noteCode, data.note, getLang())"),
    "pollStatus phải giữ resolveJobNote(..., getLang()) (S10 khóa)",
  );
  assert.ok(
    !exportPanelSrc.includes("resolveJobNote(data.noteCode, data.note, lang)"),
    "CẤM resolveJobNote(..., lang) trong closure (S10 khóa)",
  );
  const nulls = exportPanelSrc.match(/setRenderNote\(null\)/g) || [];
  assert.ok(nulls.length >= 2, `cần ≥2 lần setRenderNote(null) (start + cancel, R8 khóa), thấy ${nulls.length}`);
  assert.ok(
    exportPanelSrc.includes('const handleClose = () => { stopPolling(); onClose(); }'),
    "handleClose phải giữ nguyên stopPolling + onClose (S10 khóa)",
  );
});

ok("styles.css định nghĩa .job-history (test cssClasses không đỏ)", () => {
  assert.ok(/\.job-history\s*\{/.test(stylesSrc), "styles.css thiếu .job-history");
  assert.ok(/\.job-history-row\s*\{/.test(stylesSrc), "styles.css thiếu .job-history-row");
});

runAll();
