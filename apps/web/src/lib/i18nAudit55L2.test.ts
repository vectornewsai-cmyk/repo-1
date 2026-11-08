// i18nAudit55L2.test.ts — Phase 9 đợt 55, luồng L2: audit literal tiếng Việt
// cứng toàn app web + i18n hoá nhóm còn lại (ngoài ProjectMenu/TopBar,
// luồng L1 làm). Đợt này sửa trực tiếp 9 file, 36 điểm, CHỈ dùng lại key
// i18n đã có (không thêm key mới); 617 literal còn lại chờ key mới, đề
// xuất trong hidden_files/round55-l2-keys.json (514 key).
//
// Chạy bằng esbuild bundle (mẫu L1, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì react-dom/server
// dùng require động:
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit55L2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round55-l2/l2.test.cjs \
//     && node /tmp/round55-l2/l2.test.cjs
//
// Test này RENDER THẬT 6 component bằng react-dom/server trên Node
// (không jsdom, không browser): setLang("en") rồi renderToStaticMarkup,
// assert các literal VI đã sửa không còn xuất hiện; setLang("vi") rồi
// assert chuỗi VI hiện đủ. Đồng thời khóa parity vi/en toàn file (KHÔNG
// assert tổng cố định — L1 đã khóa 1011, đợt 56 gộp lên 1722, đợt 57 gộp lên 1937, đợt 58 gộp lên 1942, đợt 59 gộp lên 1957, đợt 60 Q4 lên 1972, parent gộp đợt 61 +72 key lên 2044) + nội dung 15 key tái dùng +
// source 9 file không còn literal cũ. HistoryPanel, TemplatePackModal
// và các nhánh lỗi bridge chỉ assert ở mức source + dict (xem LIMITS:
// HistoryPanel cần IndexedDB, TemplatePackModal chỉ hiện chuỗi bridge
// khi bridge lỗi).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { setLang } from "../i18n";
import { BeatSyncModal } from "../components/BeatSyncModal";
import { CaptionModal } from "../components/CaptionModal";
import { SilenceModal } from "../components/SilenceModal";
import { TemplatePicker } from "../components/TemplatePicker";
import { ExportPanel } from "../ExportPanel";

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
  console.log(`L2 i18n audit round 55: ${pass}/${queue.length} pass`);
}

// --- Dict thật + lookup, như i18n/index.ts ---------------------------
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
function dict(lang: "vi" | "en"): Record<string, unknown> {
  return JSON.parse(
    readFileSync(`apps/web/src/i18n/${lang}.json`, "utf8"),
  ) as Record<string, unknown>;
}

// 15 key tái dùng trong 36 điểm sửa (đợt 55 L2). Không assert tổng số
// key cố định — L1 đã khóa 1011, đợt 56 gộp lên 1722, đợt 57 gộp lên 1937, đợt 58 gộp lên 1942, đợt 59 gộp lên 1957, đợt 60 Q4 lên 1969, parent gộp đợt 60 +3 key Q1 lên 1972, parent gộp đợt 61 +72 key lên 2044; ở đây chỉ khóa parity + nội dung các
// key tái dùng (đặc biệt 3 key bridge mới xác minh ở đợt này).
const REUSED_KEYS = [
  "timeline.histMove",
  "timeline.histTrim",
  "timeline.fxMove",
  "timeline.fxTrim",
  "errorDetail.summary.unknown",
  "common.close",
  "common.cancel",
  "bgremove.cancel",
  "inspector.duration",
  "sticker.allTab",
  "keyframe.tipGone",
  "topbar.deleteShort",
  "common.bridgeConn",
  "bgremove.bridgeHttp",
  "tts.bridgeEmpty",
] as const;

// --- 1. i18n: parity toàn file + nội dung key tái dùng ----------------
ok("i18n: vi/en parity toàn file, đủ 15 key tái dùng của L2", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(dict("vi"), "", viKeys);
  flatten(dict("en"), "", enKeys);
  assert.equal(viKeys.size, enKeys.size);
  for (const k of viKeys) assert.ok(enKeys.has(k), `en thiếu key ${k}`);
  for (const k of enKeys) assert.ok(viKeys.has(k), `vi thiếu key ${k}`);
  for (const k of REUSED_KEYS) {
    assert.ok(viKeys.has(k), `vi thiếu ${k}`);
    assert.ok(enKeys.has(k), `en thiếu ${k}`);
  }
});

ok("i18n: nội dung 15 key tái dùng đúng từng chữ, vi khác en", () => {
  const vi = dict("vi");
  const en = dict("en");
  const expected: Record<string, [string, string]> = {
    "timeline.histMove": ["Di chuyển clip", "Move clip"],
    "timeline.histTrim": ["Cắt clip", "Trim clip"],
    "timeline.fxMove": ["Di chuyển adjustment layer", "Move adjustment layer"],
    "timeline.fxTrim": ["Cắt adjustment layer", "Trim adjustment layer"],
    "errorDetail.summary.unknown": [
      "Render thất bại (không rõ lý do).",
      "Render failed (unknown reason).",
    ],
    "common.close": ["Đóng", "Close"],
    "common.cancel": ["Huỷ", "Cancel"],
    "bgremove.cancel": ["Huỷ", "Cancel"],
    "inspector.duration": ["Thời lượng", "Duration"],
    "sticker.allTab": ["Tất cả", "All"],
    "keyframe.tipGone": ["Clip không còn tồn tại.", "The clip no longer exists."],
    "topbar.deleteShort": ["🗑 Xoá", "🗑 Delete"],
    "common.bridgeConn": [
      "Không kết nối được bridge ({url}). Hãy chạy: cd server/bridge && npm start",
      "Cannot connect to bridge ({url}). Run: cd server/bridge && npm start",
    ],
    "bgremove.bridgeHttp": ["Bridge lỗi HTTP {status}.", "Bridge HTTP error {status}."],
    "tts.bridgeEmpty": ["Bridge trả về file rỗng.", "Bridge returned an empty file."],
  };
  for (const k of REUSED_KEYS) {
    const [v, e] = expected[k];
    assert.equal(lookup(vi, k), v, `${k} vi`);
    assert.equal(lookup(en, k), e, `${k} en`);
    assert.notEqual(lookup(vi, k), lookup(en, k), `${k}: vi phải khác en`);
  }
  // Placeholder {url}/{status} giữ nguyên cả 2 bên.
  assert.ok(lookup(vi, "common.bridgeConn").includes("{url}"));
  assert.ok(lookup(en, "common.bridgeConn").includes("{url}"));
  assert.ok(lookup(vi, "bgremove.bridgeHttp").includes("{status}"));
  assert.ok(lookup(en, "bgremove.bridgeHttp").includes("{status}"));
});

// --- 2. Render thật EN: không còn literal VI đã sửa -------------------
const noop = () => undefined;

ok("render EN: BeatSyncModal (nhánh no-clip) hiện Close, không còn Đóng", () => {
  setLang("en");
  const html = renderToStaticMarkup(
    React.createElement(BeatSyncModal, {
      trackId: "__nope__",
      clipId: "__nope__",
      onClose: noop,
    }),
  );
  assert.ok(html.includes(">Close<"), "EN thiếu nút Close");
  assert.ok(!html.includes("Đóng"), "EN vẫn còn literal Đóng");
});

ok("render EN: CaptionModal hiện Close, không còn Đóng/Huỷ", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(CaptionModal, { onClose: noop }));
  assert.ok(html.includes('title="Close"'), "EN thiếu title Close");
  assert.ok(html.includes(">Close<"), "EN thiếu nút Close");
  assert.ok(!html.includes("Đóng"), "EN vẫn còn literal Đóng");
  assert.ok(!html.includes("Hủy"), "EN vẫn còn literal Hủy");
  assert.ok(!html.includes("Huỷ"), "EN vẫn còn literal Huỷ");
});

ok("render EN: SilenceModal hiện Close, không còn Đóng/Huỷ", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(SilenceModal, { onClose: noop }));
  // Nút Close dạng text chỉ render ở step "done" (dòng 326); trạng thái
  // mặc định (step config) chỉ có nút ✕ header với title/aria.
  assert.ok(html.includes('title="Close"'), "EN thiếu title Close");
  assert.ok(!html.includes("Đóng"), "EN vẫn còn literal Đóng");
  assert.ok(!html.includes("Hủy"), "EN vẫn còn literal Hủy");
  assert.ok(!html.includes("Huỷ"), "EN vẫn còn literal Huỷ");
});

ok("render EN: TemplatePicker hiện Close + All, không còn Đóng/Huỷ/Tất cả", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(TemplatePicker, { onClose: noop }));
  assert.ok(html.includes('title="Close"'), "EN thiếu title Close");
  assert.ok(html.includes(">All<"), "EN thiếu chip All");
  assert.ok(!html.includes("Đóng"), "EN vẫn còn literal Đóng");
  assert.ok(!html.includes("Huỷ"), "EN vẫn còn literal Huỷ");
  assert.ok(!html.includes("Tất cả"), "EN vẫn còn literal Tất cả");
});

ok("render EN: ExportPanel hiện Close + Duration, không còn Đóng/Thời lượng", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(ExportPanel, { onClose: noop }));
  assert.ok(html.includes('title="Close"'), "EN thiếu title Close");
  assert.ok(html.includes(">Duration<"), "EN thiếu nhãn Duration");
  assert.ok(!html.includes("Đóng"), "EN vẫn còn literal Đóng");
  assert.ok(!html.includes("Thời lượng"), "EN vẫn còn literal Thời lượng");
});

// NOTE: EnhancePanel KHÔNG render-test được bằng SSR: nhánh tipGone cần
// selection trỏ tới clip không tồn tại, mà renderToStaticMarkup dùng
// getServerSnapshot của zustand nên luôn thấy state lúc khởi tạo (đã
// chứng minh bằng probe: setState trước render không đổi HTML; cùng giới
// hạn như nhánh dirty của L1). Nhánh này chỉ khóa ở mức source + dict
// (keyframe.tipGone đúng từng chữ cả 2 ngôn ngữ) — đo headed trên
// browser thật sẽ phủ nhánh này.

// --- 3. Render thật VI: đủ chuỗi VI, không lẫn chuỗi EN đã sửa -------
ok("render VI: CaptionModal + SilenceModal hiện Đóng/Huỷ, không lẫn Close/Cancel", () => {
  setLang("vi");
  const cap = renderToStaticMarkup(React.createElement(CaptionModal, { onClose: noop }));
  const sil = renderToStaticMarkup(React.createElement(SilenceModal, { onClose: noop }));
  for (const [name, html] of [
    ["CaptionModal", cap],
    ["SilenceModal", sil],
  ] as const) {
    assert.ok(html.includes('title="Đóng"'), `${name} VI thiếu title Đóng`);
    assert.ok(!html.includes('title="Close"'), `${name} VI lẫn title Close`);
  }
  // Nút Đóng dạng text: CaptionModal render ở footer mặc định, SilenceModal
  // chỉ ở step "done" nên không assert chung ở đây.
  assert.ok(cap.includes(">Đóng<"), "CaptionModal VI thiếu nút Đóng");
  assert.ok(!cap.includes(">Close<"), "CaptionModal VI lẫn nút Close");
  // "Huỷ" (bgremove.cancel) chỉ hiện ở nhánh chạy/cancel — trạng thái
  // mặc định không render nút đó nên chỉ khóa ở mức source + dict.
});

ok("render VI: BeatSyncModal hiện Đóng, không lẫn Close", () => {
  setLang("vi");
  const html = renderToStaticMarkup(
    React.createElement(BeatSyncModal, {
      trackId: "__nope__",
      clipId: "__nope__",
      onClose: noop,
    }),
  );
  assert.ok(html.includes(">Đóng<"), "VI thiếu nút Đóng");
  assert.ok(!html.includes(">Close<"), "VI lẫn nút Close");
});

ok("render VI: TemplatePicker hiện Đóng + Tất cả, không lẫn Close/All", () => {
  setLang("vi");
  const html = renderToStaticMarkup(React.createElement(TemplatePicker, { onClose: noop }));
  assert.ok(html.includes('title="Đóng"'), "VI thiếu title Đóng");
  assert.ok(html.includes(">Tất cả<"), "VI thiếu chip Tất cả");
  assert.ok(!html.includes('title="Close"'), "VI lẫn title Close");
  assert.ok(!html.includes(">All<"), "VI lẫn chip All");
});

ok("render VI: ExportPanel hiện Đóng + Thời lượng, không lẫn Close/Duration", () => {
  setLang("vi");
  const html = renderToStaticMarkup(React.createElement(ExportPanel, { onClose: noop }));
  assert.ok(html.includes('title="Đóng"'), "VI thiếu title Đóng");
  assert.ok(html.includes(">Thời lượng<"), "VI thiếu nhãn Thời lượng");
  assert.ok(!html.includes('title="Close"'), "VI lẫn title Close");
  assert.ok(!html.includes(">Duration<"), "VI lẫn nhãn Duration");
});

// --- 4. Source: 9 file dùng t()/i18nT() + useLang(), hết literal cũ ---
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}

ok("source: store.ts dùng i18nT() cho 4 nhãn undo, hết literal cũ", () => {
  const src = readSrc("store.ts");
  for (const k of ["timeline.histMove", "timeline.histTrim", "timeline.fxMove", "timeline.fxTrim"]) {
    assert.ok(src.includes(`i18nT("${k}")`), `store.ts phải gọi i18nT("${k}")`);
  }
  for (const frag of ['"Di chuyển clip"', '"Cắt clip"', '"Di chuyển adjustment layer"', '"Cắt adjustment layer"']) {
    assert.ok(!src.includes(frag), `store.ts còn literal cứng: ${frag}`);
  }
});

ok("source: ExportPanel dùng t() cho 5 điểm, hết literal cũ", () => {
  const src = readSrc("ExportPanel.tsx");
  assert.ok(src.includes("useLang"), "ExportPanel phải gọi useLang()");
  for (const k of ["errorDetail.summary.unknown", "common.close", "inspector.duration", "bgremove.cancel"]) {
    assert.ok(src.includes(`t("${k}")`), `ExportPanel phải gọi t("${k}")`);
  }
  for (const frag of ['"Render thất bại (không rõ lý do)."', 'title="Đóng"', 'aria-label="Đóng"', '"Thời lượng"', '"Hủy"', '"Huỷ"']) {
    assert.ok(!src.includes(frag), `ExportPanel còn literal cứng: ${frag}`);
  }
});

ok("source: BeatSyncModal dùng t() cho Đóng/Huỷ, hết literal cũ", () => {
  const src = readSrc("components/BeatSyncModal.tsx");
  assert.ok(src.includes("useLang"), "BeatSyncModal phải gọi useLang()");
  for (const k of ["common.close", "bgremove.cancel"]) {
    assert.ok(src.includes(`t("${k}")`), `BeatSyncModal phải gọi t("${k}")`);
  }
  for (const frag of ['"Đóng"', '"Hủy"', '"Huỷ"']) {
    assert.ok(!src.includes(frag), `BeatSyncModal còn literal cứng: ${frag}`);
  }
});

ok("source: CaptionModal dùng t() cho Đóng/Huỷ + 2 template bridge, hết literal cũ", () => {
  const src = readSrc("components/CaptionModal.tsx");
  assert.ok(src.includes("useLang"), "CaptionModal phải gọi useLang()");
  for (const k of ["common.close", "bgremove.cancel", "bgremove.bridgeHttp", "common.bridgeConn"]) {
    assert.ok(src.includes(`t("${k}"`), `CaptionModal phải gọi t("${k}")`);
  }
  for (const frag of ['"Đóng"', '"Hủy"', '"Huỷ"', "Bridge lỗi HTTP", "Không kết nối được bridge ("]) {
    assert.ok(!src.includes(frag), `CaptionModal còn literal cứng: ${frag}`);
  }
});

ok("source: SilenceModal dùng t() cho Đóng/Huỷ + 2 template bridge, hết literal cũ", () => {
  const src = readSrc("components/SilenceModal.tsx");
  assert.ok(src.includes("useLang"), "SilenceModal phải gọi useLang()");
  for (const k of ["common.close", "bgremove.cancel", "bgremove.bridgeHttp", "common.bridgeConn"]) {
    assert.ok(src.includes(`t("${k}"`), `SilenceModal phải gọi t("${k}")`);
  }
  for (const frag of ['"Đóng"', '"Hủy"', '"Huỷ"', "Bridge lỗi HTTP", "Không kết nối được bridge ("]) {
    assert.ok(!src.includes(frag), `SilenceModal còn literal cứng: ${frag}`);
  }
});

ok("source: TemplatePicker dùng t() cho Huỷ/Đóng/Tất cả, hết literal cũ", () => {
  const src = readSrc("components/TemplatePicker.tsx");
  assert.ok(src.includes("useLang"), "TemplatePicker phải gọi useLang()");
  for (const k of ["common.cancel", "common.close", "sticker.allTab"]) {
    assert.ok(src.includes(`t("${k}")`), `TemplatePicker phải gọi t("${k}")`);
  }
  for (const frag of ['"Huỷ"', '"Đóng"', '"Tất cả"']) {
    assert.ok(!src.includes(frag), `TemplatePicker còn literal cứng: ${frag}`);
  }
});

ok("source: EnhancePanel dùng t() cho tip clip-gone, hết literal cũ", () => {
  const src = readSrc("components/enhance/EnhancePanel.tsx");
  assert.ok(src.includes("useLang"), "EnhancePanel phải gọi useLang()");
  assert.ok(src.includes('t("keyframe.tipGone")'), "EnhancePanel phải gọi t(keyframe.tipGone)");
  assert.ok(!src.includes('"Clip không còn tồn tại."'), "EnhancePanel còn literal cứng");
});

ok("source: HistoryPanel dùng t() cho nút Xoá, hết literal cũ", () => {
  const src = readSrc("components/project/HistoryPanel.tsx");
  assert.ok(src.includes("useLang"), "HistoryPanel phải gọi useLang()");
  assert.ok(src.includes('t("topbar.deleteShort")'), "HistoryPanel phải gọi t(topbar.deleteShort)");
  assert.ok(!src.includes('"🗑 Xoá"'), "HistoryPanel còn literal cứng");
});

ok("source: TemplatePackModal dùng i18nT() cho 2 chuỗi bridge, hết literal cũ", () => {
  const src = readSrc("components/onboarding/TemplatePackModal.tsx");
  assert.ok(src.includes("useLang"), "TemplatePackModal phải gọi useLang()");
  assert.ok(src.includes('i18nT("tts.bridgeEmpty")'), "TemplatePackModal phải gọi i18nT(tts.bridgeEmpty)");
  assert.ok(src.includes('i18nT("common.bridgeConn"'), "TemplatePackModal phải gọi i18nT(common.bridgeConn)");
  assert.ok(!src.includes('"Bridge trả về file rỗng."'), "TemplatePackModal còn literal cứng");
  assert.ok(!src.includes("Không kết nối được bridge ("), "TemplatePackModal còn template bridge cứng");
});

runAll();
