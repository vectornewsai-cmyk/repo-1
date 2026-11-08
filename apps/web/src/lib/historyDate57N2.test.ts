// historyDate57N2.test.ts — Phase 9 đợt 57, luồng N2: sửa nợ LIMITS đợt 56
// §4.2 — HistoryPanel hardcode ngày kiểu Việt Nam.
//
// fmtTime() trong HistoryPanel.tsx trước đây dùng toLocaleDateString /
// toLocaleTimeString("vi-VN") cố định nên ở ngôn ngữ EN vẫn hiện ngày kiểu
// VN ("7/11/2026 06:37") cả trong row lẫn dialog confirm xoá version.
// Nay fmtTime() lấy locale từ getLang() (vi → vi-VN, en → en-US — cùng
// pattern ProjectMenu autosave), tháng viết tắt để ngày/tháng không nhầm
// ("7 thg 11, 2026" / "Nov 7, 2026").
//
// Không có key i18n mới: định dạng ngày không chứa literal text nào, mọi
// key history.* đã nối từ đợt 56 nên fragment round57-n2.json rỗng có chủ
// đích (test dưới khóa điều này: fragment hợp lệ, parity vi/en, 0 key mới).
//
// Chạy bằng esbuild bundle (mẫu i18nAudit56M2.test.ts, chạy từ gốc repo;
// bundle ra scratch ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì
// react-dom/server dùng require động:
//   ./node_modules/.bin/esbuild apps/web/src/lib/historyDate57N2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round57-n2/n2.test.cjs \
//     && node /tmp/round57-n2/n2.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setLang } from "../i18n";
import { fmtTime } from "../components/project/HistoryPanel";

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
  console.log(`N2 history date round 57: ${pass}/${queue.length} pass`);
}

function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}

// Ngày dựng bằng component local (năm, tháng 0-based, ngày, giờ, phút)
// để test không phụ thuộc múi giờ của máy chạy.
const AMBIGUOUS = new Date(2026, 10, 7, 6, 37).getTime(); // 7/11/2026 06:37
const AMBIGUOUS_2 = new Date(2026, 0, 5, 23, 5).getTime(); // 5/1/2026 23:05

// --- 1. Format theo locale đang chọn ---
ok("vi: 7/11/2026 hiện '7 thg 11, 2026 06:37', không còn dạng số gây nhầm", () => {
  setLang("vi");
  const s = fmtTime(AMBIGUOUS);
  assert.ok(s.includes("7 thg 11"), `vi phải chứa "7 thg 11", thực tế: ${s}`);
  assert.ok(s.includes("2026"), `vi phải chứa năm 2026, thực tế: ${s}`);
  assert.ok(s.includes("06:37"), `vi phải chứa giờ 06:37, thực tế: ${s}`);
  assert.ok(!s.includes("7/11") && !s.includes("11/7"), `vi không được dùng dạng số: ${s}`);
});

ok("en: 7/11/2026 hiện 'Nov 7, 2026' + giờ, khác hẳn chuỗi vi", () => {
  setLang("en");
  const s = fmtTime(AMBIGUOUS);
  assert.ok(s.includes("Nov 7"), `en phải chứa "Nov 7", thực tế: ${s}`);
  assert.ok(s.includes("2026"), `en phải chứa năm 2026, thực tế: ${s}`);
  assert.ok(s.includes("06:37"), `en phải chứa giờ 06:37, thực tế: ${s}`);
  assert.ok(!s.includes("7/11") && !s.includes("11/7"), `en không được dùng dạng số: ${s}`);
  setLang("vi");
  assert.notEqual(s, fmtTime(AMBIGUOUS), "vi và en phải format khác nhau");
});

ok("ngày/tháng dễ nhầm thứ hai (5/1/2026): vi '5 thg 1', en 'Jan 5'", () => {
  setLang("vi");
  const vi = fmtTime(AMBIGUOUS_2);
  assert.ok(vi.includes("5 thg 1"), `vi phải chứa "5 thg 1", thực tế: ${vi}`);
  assert.ok(vi.includes("23:05"), `vi phải chứa giờ 23:05, thực tế: ${vi}`);
  setLang("en");
  const en = fmtTime(AMBIGUOUS_2);
  assert.ok(en.includes("Jan 5"), `en phải chứa "Jan 5", thực tế: ${en}`);
  assert.ok(en.includes("11:05"), `en (12 giờ) phải chứa 11:05, thực tế: ${en}`);
  assert.notEqual(vi, en, "vi và en phải format khác nhau");
});

ok("đổi ngôn ngữ qua lại: fmtTime bám theo getLang() tại thời điểm gọi", () => {
  setLang("en");
  const en1 = fmtTime(AMBIGUOUS);
  setLang("vi");
  const vi1 = fmtTime(AMBIGUOUS);
  setLang("en");
  const en2 = fmtTime(AMBIGUOUS);
  assert.equal(en1, en2, "quay lại en phải cho cùng chuỗi");
  assert.notEqual(en1, vi1, "đổi sang vi phải đổi chuỗi");
});

// --- 2. Source: một hàm fmtTime duy nhất, dùng ở cả 3 chỗ ---
ok("source: fmtTime dùng getLang() -> vi-VN/en-US, không còn hardcode vi-VN", () => {
  const src = readSrc("components/project/HistoryPanel.tsx");
  assert.ok(
    src.includes('getLang() === "vi" ? "vi-VN" : "en-US"'),
    "fmtTime phải map locale theo pattern ProjectMenu",
  );
  assert.ok(!src.includes('toLocaleDateString("vi-VN")'), "không còn hardcode vi-VN ở date");
  assert.ok(!src.includes('toLocaleTimeString("vi-VN"'), "không còn hardcode vi-VN ở time");
  assert.ok(src.includes("month: \"short\""), "tháng phải viết tắt để tránh nhầm ngày/tháng");
});

ok("source: row + dialog xoá + toast khôi phục đều dùng chung fmtTime", () => {
  const src = readSrc("components/project/HistoryPanel.tsx");
  const uses = src.match(/fmtTime\(v\.createdAt\)/g) ?? [];
  assert.ok(uses.length >= 3, `fmtTime(v.createdAt) phải xuất hiện >= 3 chỗ (row, xoá, khôi phục), thực tế ${uses.length}`);
  assert.ok(src.includes('t("history.deleteConfirm", { time: fmtTime(v.createdAt) })'), "dialog xoá phải dùng fmtTime");
  assert.ok(src.includes("<td>{fmtTime(v.createdAt)}</td>"), "row bảng phải dùng fmtTime");
  assert.ok(src.includes("time: fmtTime(v.createdAt)"), "toast khôi phục phải dùng fmtTime");
});

ok("source: không sửa key i18n đã nối đợt 56 (history.* vẫn gọi t() như cũ)", () => {
  const src = readSrc("components/project/HistoryPanel.tsx");
  for (const k of [
    "history.title", "history.note", "history.snapshot", "history.export",
    "history.import", "history.empty", "history.colTime", "history.colLabel",
    "history.colChanges", "history.restore", "history.deleteConfirm",
    "history.restored", "history.saved", "history.duplicate",
  ]) {
    assert.ok(src.includes(`t("${k}"`), `phải giữ nguyên t("${k}")`);
  }
});

// --- 3. Fragment: rỗng có chủ đích, không key mới ---
ok("fragment round57-n2.json: hợp lệ, parity vi/en, 0 key mới (không cần chuỗi mới)", () => {
  const raw = JSON.parse(
    readFileSync("apps/web/src/i18n/fragments/round57-n2.json", "utf8"),
  ) as Record<string, unknown>;
  assert.deepEqual(Object.keys(raw).sort(), ["en", "vi"], "fragment phải có đúng 2 locale vi/en");
  assert.deepEqual(raw.vi, {}, "vi phải rỗng: định dạng ngày không có literal text");
  assert.deepEqual(raw.en, {}, "en phải rỗng: định dạng ngày không có literal text");
});

runAll();
