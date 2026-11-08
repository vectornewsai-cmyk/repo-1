// i18nAudit56M3.test.ts — Phase 9 đợt 56, luồng M3: nối key i18n cho 6 panel
// (HistoryPanel, TemplatePicker, TemplatePackModal, EnhancePanel,
// PerfOverlay, RelinkPanel) theo 83 proposal đợt 55 L2
// (hidden_files/round55-l2-keys.json) + 1 key thêm (templatePicker.aspect169,
// "16:9 ngang" không có trong JSON L2) + title đếm động (nợ đợt 55 L2).
//
// Key của luồng này nằm ở fragment apps/web/src/i18n/fragments/round56-m3.json
// (84 key: 83 proposal + aspect169), parent đã merge vào dict ở cuối đợt 56
// — POST-MERGE (đợt 61 R1 khóa lại): 83/84 key có trong vi.json/en.json với
// đúng chuỗi fragment; ngoại lệ duy nhất enhance.renderOnly bị đợt 60 Q4
// XÓA khỏi dict có chủ đích (0 code đọc, xem LIMITS đợt 61 R1).
// Test này KHÔNG sửa trực tiếp vi.json/en.json (nhiều luồng song song).
// ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì react-dom/server
// dùng require động:
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit56M3.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round56-m3/m3.test.cjs \
//     && node /tmp/round56-m3/m3.test.cjs
//
// Test này RENDER THẬT TemplatePicker / PerfOverlay / RelinkPanel bằng
// react-dom/server trên Node (không jsdom, không browser): setLang("en")
// rồi renderToStaticMarkup, assert các literal VI đã sửa không còn xuất
// hiện. Vì dict chính đã merge key M3 (cuối đợt 56) nên render hiện chuỗi
// dịch thật; assert vẫn chấp nhận key fallback để test không gãy nếu dict
// bị lùi. HistoryPanel cần IndexedDB, EnhancePanel cần selection
// trỏ clip thật (zustand getServerSnapshot không đổi state lúc SSR — cùng
// giới hạn như L2), TemplatePackModal chỉ hiện chuỗi bridge khi bridge lỗi:
// 3 file này chỉ khóa ở mức source + fragment (xem LIMITS).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { setLang } from "../i18n";
import { TEMPLATES } from "../lib/templates";
import { TemplatePicker } from "../components/TemplatePicker";
import { PerfOverlay } from "../components/PerfOverlay";
import { RelinkPanel } from "../components/RelinkPanel";
import type { MissingAsset } from "../lib/relink";

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
  console.log(`M3 i18n audit round 56: ${pass}/${queue.length} pass`);
}

// --- Fragment thật + lookup --------------------------------------------
function flatten(o: unknown, prefix: string, out: Set<string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.add(q);
  }
}
function lookup(raw: Record<string, unknown>, key: string): string {
  let cur: unknown = raw;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
  return cur as string;
}
function frag(lang: "vi" | "en"): Record<string, unknown> {
  return JSON.parse(
    readFileSync("apps/web/src/i18n/fragments/round56-m3.json", "utf8"),
  )[lang] as Record<string, unknown>;
}

// 84 key của M3: 83 proposal L2 (prefix history/templatePicker/
// templatePack/enhance/perf/relink có site trong 6 file) + aspect169.
// 2 key lệch khỏi proposal gốc theo chỉ đạo đợt 56 (ghi rõ trong LIMITS):
// templatePicker.title thành đếm động {n}; templatePack.ttsAdded thêm
// {suffix} để giữ "(dur)s" khi có.
const M3_KEYS = [
  "history.readFailed", "history.duplicate", "history.saved", "history.saveFailed",
  "history.restoreConfirm", "history.beforeRestore", "history.notFound",
  "history.restored", "history.restoreFailed", "history.deleteConfirm",
  "history.imported", "history.importFailed", "history.title", "history.note",
  "history.labelPlaceholder", "history.snapshot", "history.export", "history.import",
  "history.empty", "history.colTime", "history.colLabel", "history.colChanges",
  "history.restore",
  "templatePicker.kindImage", "templatePicker.kindText", "templatePicker.aspect169",
  "templatePicker.aspect916", "templatePicker.aspect11", "templatePicker.backToList",
  "templatePicker.meta", "templatePicker.metaShort", "templatePicker.defaultValue",
  "templatePicker.createFromTemplate", "templatePicker.confirmNew",
  "templatePicker.back", "templatePicker.confirmCreate", "templatePicker.title",
  "templatePicker.credit",
  "templatePack.bridgeErrorHttp", "templatePack.mediaAddFailed", "templatePack.ttsAdded",
  "enhance.selectClip", "enhance.videoOnly", "enhance.renderOnly",
  "enhance.deinterlace", "enhance.yadifMode", "enhance.yadif0", "enhance.yadif1",
  "enhance.stabilize", "enhance.smoothing", "enhance.stabTwoPass",
  "enhance.stabSpeedConflict", "enhance.denoise", "enhance.denoiseStrength",
  "enhance.heavyWarning", "enhance.quickDenoise", "enhance.disableAll",
  "perf.openFps", "perf.title", "perf.closeFps", "perf.status", "perf.playing",
  "perf.paused", "perf.fpsRecent", "perf.fpsAvg", "perf.fpsMin", "perf.dropped",
  "perf.totalFrames", "perf.note",
  "relink.unknownError", "relink.unknownErrorShort", "relink.title",
  "relink.titleCount", "relink.closeSkip", "relink.intro", "relink.usedIn",
  "relink.usedTopAndNested", "relink.usedNestedOnly", "relink.pickFile",
  "relink.readingBtn", "relink.repick", "relink.cleanupAlias", "relink.cleaning",
  "relink.skipPlaceholder",
] as const;

// --- 1. Fragment: đủ 84 key, parity vi/en, vi khác en, placeholder khớp --
// POST-MERGE (đợt 61 R1): 83/84 key đã merge vào dict chính — khóa dict phải
// chứa đúng chuỗi fragment (cả vi lẫn en). Ngoại lệ duy nhất có chủ đích:
// enhance.renderOnly bị đợt 60 Q4 XÓA khỏi dict (0 code đọc; EnhancePanel
// bỏ ghi chú "chỉ có tác dụng khi render" từ đợt 59 P8) — khóa ngược: key
// này PHẢI vắng khỏi dict, nếu không Q4 lại thành key mồ côi.
ok("fragment: đủ 84 key M3, vi/en parity, vi khác en, placeholder khớp, dict đã merge 83/84 (renderOnly đã xóa có chủ đích)", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(frag("vi"), "", viKeys);
  flatten(frag("en"), "", enKeys);
  assert.equal(viKeys.size, 84, `fragment vi phải có 84 key, thấy ${viKeys.size}`);
  assert.equal(enKeys.size, 84, `fragment en phải có 84 key, thấy ${enKeys.size}`);
  for (const k of M3_KEYS) {
    assert.ok(viKeys.has(k), `vi thiếu ${k}`);
    assert.ok(enKeys.has(k), `en thiếu ${k}`);
    assert.notEqual(lookup(frag("vi"), k), lookup(frag("en"), k), `${k}: vi phải khác en`);
    // Placeholder {var} phải giống nhau 2 bên.
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    assert.equal(vars(lookup(frag("vi"), k)), vars(lookup(frag("en"), k)), `${k}: placeholder lệch vi/en`);
  }
  // POST-MERGE: dict chính phải chứa đúng chuỗi fragment (không còn là
  // "không trùng key" như trước merge). renderOnly là ngoại lệ đã xóa.
  const mainVi = JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as Record<string, unknown>;
  const mainEn = JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as Record<string, unknown>;
  const mainViKeys = new Set<string>();
  const mainEnKeys = new Set<string>();
  flatten(mainVi, "", mainViKeys);
  flatten(mainEn, "", mainEnKeys);
  for (const k of M3_KEYS) {
    if (k === "enhance.renderOnly") {
      assert.ok(!mainViKeys.has(k), `key ${k} đã bị xóa có chủ đích, không được quay lại vi.json`);
      assert.ok(!mainEnKeys.has(k), `key ${k} đã bị xóa có chủ đích, không được quay lại en.json`);
      continue;
    }
    assert.ok(mainViKeys.has(k), `dict vi thiếu ${k} (đã merge từ fragment đợt 56)`);
    assert.ok(mainEnKeys.has(k), `dict en thiếu ${k} (đã merge từ fragment đợt 56)`);
    assert.equal(lookup(mainVi, k), lookup(frag("vi"), k), `${k}: dict vi lệch fragment`);
    assert.equal(lookup(mainEn, k), lookup(frag("en"), k), `${k}: dict en lệch fragment`);
  }
});

ok("fragment: nội dung 2 key lệch proposal đúng như chỉ đạo đợt 56", () => {
  assert.equal(lookup(frag("vi"), "templatePicker.title"), "🎬 Mẫu video ({n} mẫu)");
  assert.equal(lookup(frag("en"), "templatePicker.title"), "🎬 Video templates ({n} templates)");
  assert.equal(lookup(frag("vi"), "templatePack.ttsAdded"), "✅ Đã thêm giọng đọc{suffix} vào timeline.");
  assert.equal(lookup(frag("en"), "templatePack.ttsAdded"), "✅ Added the narration{suffix} to the timeline.");
  assert.equal(lookup(frag("vi"), "templatePicker.aspect169"), "16:9 ngang");
  assert.equal(lookup(frag("en"), "templatePicker.aspect169"), "16:9 landscape");
});

// --- 2. Render thật EN --------------------------------------------------
// POST-MERGE: key M3 đã nằm trong dict chính nên t() trả chuỗi dịch thật.
// Chuỗi dịch thật VẪN được chấp nhận kèm key fallback (phòng dict bị lùi).
// Riêng các key có placeholder (templatePicker.title {n}, relink.titleCount
// {n}, relink.intro {n}, relink.usedIn {label}/{n}, relink.usedTopAndNested
// {top}/{nested}): t() nội suy thành số thật ("(50 templates)", "(1)") nên
// chuỗi mẫu thô chứa "{n}" KHÔNG BAO GIỜ xuất hiện trong HTML render đúng —
// so mẫu thô là sai test, không phải sai code (đây chính là nguyên nhân các
// fail đỏ sẵn). Vì vậy expectRendered nhận thêm vars để so chuỗi ĐÃ nội suy;
// key không có placeholder thì vars không đổi gì.
const noop = () => undefined;
/** Chuỗi dịch thật từ fragment, hoặc key fallback khi chưa merge. */
function enOrKey(key: string): string {
  return lookup(frag("en"), key);
}
function interpolate(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
}
function expectRendered(html: string, key: string, vars?: Record<string, string>): void {
  const wanted = interpolate(enOrKey(key), vars);
  assert.ok(
    html.includes(wanted) || html.includes(key),
    `render thiếu cả chuỗi EN lẫn key fallback: ${key} (muốn "${wanted}" hoặc "${key}")`,
  );
}

ok("render EN: TemplatePicker title đếm động (50 mẫu), không còn literal VI", () => {
  setLang("en");
  assert.equal(TEMPLATES.length, 50, "TEMPLATES phải có 50 mẫu (title hardcode 10 là sai)");
  const html = renderToStaticMarkup(React.createElement(TemplatePicker, { onClose: noop }));
  expectRendered(html, "templatePicker.title", { n: "50" }); // TEMPLATES.length == 50, đã assert ở trên
  expectRendered(html, "templatePicker.aspect916");
  expectRendered(html, "templatePicker.aspect11");
  expectRendered(html, "templatePicker.aspect169");
  for (const frag of ["Mẫu video", "9:16 dọc", "1:1 vuông", "16:9 ngang", "mục điền", "(10 mẫu)"]) {
    assert.ok(!html.includes(frag), `EN vẫn còn literal: ${frag}`);
  }
});

ok("render EN: PerfOverlay nút mở hiện title EN, không còn literal VI", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(PerfOverlay));
  expectRendered(html, "perf.openFps");
  assert.ok(!html.includes("Mở đồng hồ đo FPS preview"), "EN vẫn còn literal Mở đồng hồ đo FPS preview");
});

const MISSING_ONE: MissingAsset = {
  src: "clip-a.mp4",
  kind: "video",
  clipCount: 2,
  trackLabels: ["V1"],
  topLevelClipCount: 1,
  nestedClipCount: 1,
  nestedChains: ["outer › inner"],
  locations: [],
};

ok("render EN: RelinkPanel (1 asset thiếu) hiện EN, không còn literal VI", () => {
  setLang("en");
  const html = renderToStaticMarkup(
    React.createElement(RelinkPanel, { missing: [MISSING_ONE], onPick: async () => ({ ok: true, message: "" }), onClose: noop }),
  );
  expectRendered(html, "relink.titleCount", { n: "1" }); // missing.length == 1 (MISSING_ONE)
  expectRendered(html, "relink.title");
  expectRendered(html, "relink.intro", { n: "1" }); // missing.length == 1
  expectRendered(html, "relink.usedIn", { label: "Video", n: "2" }); // kind video, clipCount == 2
  expectRendered(html, "relink.usedTopAndNested", { top: "1", nested: "1" }); // topLevelClipCount == 1, nestedClipCount == 1
  expectRendered(html, "relink.skipPlaceholder");
  for (const frag of ["Media thiếu", "Đóng (bỏ qua)", "Bỏ qua — dựng tiếp", "dùng trong", "ở cấp cao", "trong nested", "Chọn lại", "Chọn file thay thế"]) {
    assert.ok(!html.includes(frag), `EN vẫn còn literal: ${frag}`);
  }
});

// --- 3. Render thật VI --------------------------------------------------
function viOrKey(key: string): string {
  return lookup(frag("vi"), key);
}
function expectRenderedVi(html: string, key: string, vars?: Record<string, string>): void {
  const wanted = interpolate(viOrKey(key), vars);
  assert.ok(
    html.includes(wanted) || html.includes(key),
    `render thiếu cả chuỗi VI lẫn key fallback: ${key} (muốn "${wanted}" hoặc "${key}")`,
  );
}

ok("render VI: TemplatePicker title đếm động VI, không lẫn EN", () => {
  setLang("vi");
  const html = renderToStaticMarkup(React.createElement(TemplatePicker, { onClose: noop }));
  expectRenderedVi(html, "templatePicker.title", { n: "50" });
  expectRenderedVi(html, "templatePicker.aspect916");
  expectRenderedVi(html, "templatePicker.aspect169");
  assert.ok(!html.includes("Video templates"), "VI lẫn title EN");
  assert.ok(!html.includes("16:9 landscape"), "VI lẫn aspect EN");
});

ok("render VI: PerfOverlay + RelinkPanel hiện VI, không lẫn EN", () => {
  setLang("vi");
  const perf = renderToStaticMarkup(React.createElement(PerfOverlay));
  expectRenderedVi(perf, "perf.openFps");
  assert.ok(!perf.includes("Open the preview FPS meter"), "VI lẫn title EN");
  const rel = renderToStaticMarkup(
    React.createElement(RelinkPanel, { missing: [MISSING_ONE], onPick: async () => ({ ok: true, message: "" }), onClose: noop }),
  );
  expectRenderedVi(rel, "relink.titleCount", { n: "1" }); // missing.length == 1
  expectRenderedVi(rel, "relink.usedIn", { label: "Video", n: "2" }); // kind video, clipCount == 2
  expectRenderedVi(rel, "relink.usedTopAndNested", { top: "1", nested: "1" });
  assert.ok(!rel.includes("Missing media"), "VI lẫn title EN");
  assert.ok(!rel.includes("used in 2 clips"), "VI lẫn usedIn EN");
});

// --- 4. Source: 6 file dùng t()/i18nT() + useLang(), hết literal cũ ----
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}

ok("source: HistoryPanel dùng t() cho 23 key, hết literal UI cũ", () => {
  const src = readSrc("components/project/HistoryPanel.tsx");
  assert.ok(src.includes("useLang"), "HistoryPanel phải gọi useLang()");
  for (const k of M3_KEYS.filter((k) => k.startsWith("history."))) {
    assert.ok(src.includes(`t("${k}"`), `HistoryPanel phải gọi t("${k}")`);
  }
  // "trước khi khôi phục" còn lại duy nhất trong comment header (dòng 6),
  // không còn là string literal truyền vào saveVersion.
  assert.ok(!src.includes('saveVersion(projectId, st.spec, "trước khi khôi phục")'), "HistoryPanel còn literal label cứng");
  for (const frag of ['"Không đọc được lịch sử: "', '"Spec trùng version mới nhất', '"Đã lưu phiên bản ("', '"Không lưu được phiên bản: "', '"Có thay đổi chưa lưu.', '"Không tìm thấy version này nữa."', '"Đã khôi phục phiên bản ', '"Không khôi phục được: "', '"Không nhập được: "', '"🕘 Lịch sử phiên bản', '"Nhãn cho snapshot', '"📸 Lưu phiên bản"', '"⬇ Xuất lịch sử"', '"⬆ Nhập lịch sử"', '"Chưa có phiên bản nào.', '"Thời gian"', '"Nhãn"', '"Thay đổi"', '"↩ Khôi phục"']) {
    assert.ok(!src.includes(frag), `HistoryPanel còn literal cứng: ${frag}`);
  }
});

ok("source: TemplatePicker dùng t() cho 15 key, hết literal UI cũ", () => {
  const src = readSrc("components/TemplatePicker.tsx");
  assert.ok(src.includes("useLang"), "TemplatePicker phải gọi useLang()");
  for (const k of M3_KEYS.filter((k) => k.startsWith("templatePicker."))) {
    assert.ok(src.includes(`t("${k}"`), `TemplatePicker phải gọi t("${k}")`);
  }
  assert.ok(!src.includes("KIND_LABEL"), "TemplatePicker còn const KIND_LABEL cũ");
  for (const frag of ['"🖼 Ảnh"', '"✏️ Chữ"', '"16:9 ngang"', '"9:16 dọc"', '"1:1 vuông"', '"Quay lại danh sách"', '"Tạo project từ mẫu"', '"Tạo project mới từ mẫu', '"Quay lại"', '"Xác nhận tạo"', '"🎬 Mẫu video (10 mẫu)"', '"Mẫu do VCut Studio thiết kế']) {
    assert.ok(!src.includes(frag), `TemplatePicker còn literal cứng: ${frag}`);
  }
  assert.ok(!src.includes("mục cần điền"), "TemplatePicker còn literal mục cần điền");
  assert.ok(!src.includes("mục điền"), "TemplatePicker còn literal mục điền");
});

ok("source: TemplatePackModal dùng i18nT() cho 6 key, hết literal UI cũ", () => {
  const src = readSrc("components/onboarding/TemplatePackModal.tsx");
  assert.ok(src.includes("useLang"), "TemplatePackModal phải gọi useLang()");
  for (const k of ["templatePicker.aspect169", "templatePicker.aspect916", "templatePicker.aspect11", "templatePack.bridgeErrorHttp", "templatePack.mediaAddFailed", "templatePack.ttsAdded"]) {
    assert.ok(src.includes(`i18nT("${k}"`), `TemplatePackModal phải gọi i18nT("${k}")`);
  }
  for (const frag of ['"16:9 ngang"', '"9:16 dọc"', '"1:1 vuông"', "Bridge trả lỗi HTTP", '"Không đưa được file vào kho media."', "Đã thêm giọng đọc"]) {
    assert.ok(!src.includes(frag), `TemplatePackModal còn literal cứng: ${frag}`);
  }
});

ok("source: EnhancePanel dùng t() cho 15 key, renderOnly đã xóa có chủ đích, hết literal UI cũ", () => {
  const src = readSrc("components/enhance/EnhancePanel.tsx");
  assert.ok(src.includes("useLang"), "EnhancePanel phải gọi useLang()");
  // renderOnly KHÔNG nằm trong vòng này: đợt 60 Q4 đã xóa key đó khỏi dict
  // có chủ đích (0 code đọc; ghi chú "chỉ có tác dụng khi render" đã bỏ từ
  // đợt 59 P8, nay là ghi chú previewApprox của đợt 60 Q1). Khóa ngược:
  // không code nào được gọi lại key này — thêm lại key chỉ tái tạo key mồ
  // côi mà Q4 vừa dọn.
  for (const k of M3_KEYS.filter((k) => k.startsWith("enhance.") && k !== "enhance.renderOnly")) {
    assert.ok(src.includes(`t("${k}"`), `EnhancePanel phải gọi t("${k}")`);
  }
  assert.ok(!src.includes('t("enhance.renderOnly"'), "EnhancePanel không được gọi lại enhance.renderOnly đã xóa");
  for (const frag of ["Chọn một clip", "Tăng cường chỉ dùng cho clip video", "Tăng cường chỉ có tác dụng khi", "Khử răng cưa (yadif)", "Chế độ yadif", "giữ fps (an toàn)", "mỗi field 1 frame", "Chống rung (vidstab 2-pass)", "Làm mượt (smoothing)", "Chống rung chạy 2 pass", "Clip này có speed curve", "Khử nhiễu (hqdn3d)", "Cường độ khử nhiễu", "Clip này vừa có", "Bật khử nhiễu nhanh", "Tắt tất cả tăng cường"]) {
    assert.ok(!src.includes(frag), `EnhancePanel còn literal cứng: ${frag}`);
  }
});

ok("source: PerfOverlay dùng t() cho 12 key, hết literal UI cũ", () => {
  const src = readSrc("components/PerfOverlay.tsx");
  assert.ok(src.includes("useLang"), "PerfOverlay phải gọi useLang()");
  assert.ok(src.includes('from "../i18n"'), "PerfOverlay phải import từ ../i18n");
  for (const k of M3_KEYS.filter((k) => k.startsWith("perf."))) {
    assert.ok(src.includes(`t("${k}"`), `PerfOverlay phải gọi t("${k}")`);
  }
  for (const frag of ['"Mở đồng hồ đo FPS preview"', '"Đồng hồ đo FPS preview"', '"Đóng đồng hồ FPS"', '"Trạng thái:"', '"▶ Đang phát"', '"⏸ Đứng yên', '"FPS (1s gần nhất):"', '"FPS trung bình:"', '"FPS thấp nhất (cửa sổ 1s):"', '"Frame giật', '"Tổng frame:"', '"Đo bằng rAF của app']) {
    assert.ok(!src.includes(frag), `PerfOverlay còn literal cứng: ${frag}`);
  }
});

ok("source: RelinkPanel dùng i18nT() cho 15 key, hết literal UI cũ", () => {
  const src = readSrc("components/RelinkPanel.tsx");
  assert.ok(src.includes("useLang"), "RelinkPanel phải gọi useLang()");
  for (const k of M3_KEYS.filter((k) => k.startsWith("relink."))) {
    assert.ok(src.includes(`i18nT("${k}"`), `RelinkPanel phải gọi i18nT("${k}")`);
  }
  // "Media thiếu" còn lại duy nhất trong comment header (dòng 2).
  assert.ok(!src.includes('aria-label="Media thiếu"'), "RelinkPanel còn aria-label cứng");
  assert.ok(!src.includes('"🔗 Media thiếu ("'), "RelinkPanel còn title cứng");
  for (const frag of ['"Lỗi không xác định khi relink."', '"lỗi không xác định"', '"Đóng (bỏ qua)"', '"Project này dùng "', '"Chọn file thay thế cho ', '"⏳ Đang đọc…"', '"🔗 Chọn lại"', '"Xoá alias trùng tên thật', '"⏳ Đang dọn…"', '"Bỏ qua — dựng tiếp với placeholder"', "· dùng trong", "ở cấp cao", "chỉ trong nested"]) {
    assert.ok(!src.includes(frag), `RelinkPanel còn literal cứng: ${frag}`);
  }
});

runAll();
