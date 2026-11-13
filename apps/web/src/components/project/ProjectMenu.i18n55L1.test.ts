// ProjectMenu.i18n55L1.test.ts — Phase 9 đợt 55, luồng L1: i18n hoá
// ProjectMenu + nút "Bắt đầu" ở TopBar (đóng bug M19 của đợt 54 K3:
// chuyển sang EN mà nhóm nút project + "Bắt đầu" vẫn tiếng Việt vì
// literal cứng + ProjectMenu không useLang()).
//
// Chạy bằng esbuild bundle (mẫu D4/B6, chạy từ gốc repo; bundle ra
// scratch ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì
// react-dom/server dùng require động (bundle esm lỗi "Dynamic require
// of stream is not supported"):
//   ./node_modules/.bin/esbuild apps/web/src/components/project/ProjectMenu.i18n55L1.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round55-l1/l1.test.cjs \
//     && node /tmp/round55-l1/l1.test.cjs
//
// Test này RENDER THẬT 2 component bằng react-dom/server trên Node
// (không jsdom, không browser): setLang("en") rồi renderToStaticMarkup,
// assert không còn literal VI nào của 2 file; setLang("vi") rồi assert
// chuỗi VI hiện đủ. Đồng thời khóa parity vi/en toàn file (2044 key sau parent gộp đợt 61 (+72 key; 1972 sau parent gộp đợt 60; 1969 sau đợt 60 Q4; 1957 sau gộp đợt 59)
// + nội dung 24 key mới + source 2 file không còn literal cũ.
// Phạm vi Node: render SSR tĩnh — KHÔNG mạo nhận là browser thật hay
// app thật (đo headed EN trên vite dev nằm ở LIMITS, script riêng).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { setLang } from "../../i18n";
import { ProjectMenu } from "./ProjectMenu";
import { TopBar } from "../../TopBar";

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
  console.log(`L1 i18n ProjectMenu+TopBar: ${pass}/${queue.length} pass`);
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

const NEW_PROJECTMENU_KEYS = [
  "projectMenu.new",
  "projectMenu.newHint",
  "projectMenu.open",
  "projectMenu.openHint",
  "projectMenu.save",
  "projectMenu.saveHint",
  "projectMenu.saveAs",
  "projectMenu.saveAsHint",
  "projectMenu.exportArchive",
  "projectMenu.exportArchiveHint",
  "projectMenu.importArchive",
  "projectMenu.importArchiveHint",
  "projectMenu.history",
  "projectMenu.historyHint",
  "projectMenu.unsavedChangesHint",
  "projectMenu.allSavedHint",
  "projectMenu.unsaved",
  "projectMenu.autosaveAt",
  "projectMenu.saved",
  "projectMenu.saveAsPrompt",
  "projectMenu.untitledProject",
] as const;
const NEW_TOPBAR_KEYS = [
  "topbar.welcome",
  "topbar.welcomeHint",
  "topbar.welcomeLabel",
] as const;
const NEW_KEYS = [...NEW_PROJECTMENU_KEYS, ...NEW_TOPBAR_KEYS] as const;

// Literal VI cũ trong 2 file (M19): ở chế độ EN không được xuất hiện
// trong HTML đã render. Chuỗi nào cũng gắn emoji/title riêng nên không
// lẫn với tên project mặc định "Dự án mới" (dữ liệu user, không phải
// literal UI — không assert nó).
const FORBIDDEN_VI_IN_EN = [
  "🆕 Mới",
  "📂 Mở",
  "💾 Lưu",
  "Lưu thành…",
  "Xuất bản nén",
  "Nhập bản nén",
  "Lịch sử",
  "Chưa lưu",
  "Tạo dự án mới",
  "Mở file dự án",
  "Lưu thành file",
  "Lưu thành tên khác",
  "mang đi máy khác",
  "khôi phục project",
  "Lịch sử phiên bản",
  "Có thay đổi chưa được lưu",
  "Mọi thay đổi đã được lưu",
  "✓ Đã lưu",
  "👋 Bắt đầu",
  "Mở lại màn chào",
] as const;

// Chuỗi EN tương ứng phải xuất hiện khi lang=en (trạng thái sạch:
// project mặc định "Dự án mới", chưa có track → chỉ báo "✓ Saved").
// "● Unsaved" chỉ xuất hiện khi dirty — đo riêng ở cuối test này.
const REQUIRED_EN = [
  "🆕 New",
  "📂 Open",
  "💾 Save",
  "Save as…",
  "Export archive",
  "Import archive",
  "History",
  "✓ Saved",
  "👋 Get started",
  "Reopen the welcome screen",
] as const;

// Chuỗi VI tương ứng phải xuất hiện khi lang=vi.
const REQUIRED_VI = [
  "🆕 Mới",
  "📂 Mở",
  "💾 Lưu",
  "Lưu thành…",
  "Xuất bản nén",
  "Nhập bản nén",
  "Lịch sử",
  "👋 Bắt đầu",
] as const;

function renderBoth(): string {
  const menu = renderToStaticMarkup(React.createElement(ProjectMenu));
  const top = renderToStaticMarkup(
    React.createElement(TopBar, {
      onExport: () => undefined,
      onCaption: () => undefined,
      onSilence: () => undefined,
      onTemplate: () => undefined,
      onWelcome: () => undefined,
    }),
  );
  return menu + "\n" + top;
}

// --- 1. i18n: 24 key mới + parity toàn file ---------------------------
ok("i18n: vi/en parity toàn file, đủ 24 key mới (21 projectMenu + 3 topbar)", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(dict("vi"), "", viKeys);
  flatten(dict("en"), "", enKeys);
  assert.equal(viKeys.size, enKeys.size);
  for (const k of viKeys) assert.ok(enKeys.has(k), `en thiếu key ${k}`);
  for (const k of enKeys) assert.ok(viKeys.has(k), `vi thiếu key ${k}`);
  for (const k of NEW_KEYS) {
    assert.ok(viKeys.has(k), `vi thiếu ${k}`);
    assert.ok(enKeys.has(k), `en thiếu ${k}`);
  }
  // Snapshot: 987 (đợt 53 J4) + 24 key L1 đợt 55 = 1011 mỗi bên.
// Parent gộp đợt 56: +711 key (683 fragment M1–M8 + 28 đề xuất M6) -> 1722 mỗi bên (vi == en, 0 key mồ côi).
// Parent gộp đợt 57: +215 key (11 N4 + 180 label N5 + 1 N7 + 23 N8; 5 key EN N5 ghi đè, không tính thêm) -> 1937 mỗi bên (vi == en, 0 key mồ côi).
// Parent gộp đợt 58: +5 key (4 O3 preview.*Skipped* + 1 O5 captions.translatedTrack) -> 1942 mỗi bên (vi == en, 0 key mồ côi).
// Parent gộp đợt 59: +15 key (4 P1 mediabin/store + 11 P8 enhance.*) -> 1957 mỗi bên (vi == en); P3 ghi đè 1 key nested.failsoft.unknownEffectType (thêm {type}), không tăng số key; đợt 60 Q4: −14 key mồ côi +26 key fragment P7 → 1969 mỗi bên; parent gộp đợt 60: +3 key Q1 → 1972 mỗi bên; parent gộp đợt 61: +72 key (R2 3 + R5 1 + R6 50 + R9 18) → 2044 mỗi bên; parent gộp đợt 62: +102 key (R2 2 + R5 91 + R7 9) → 2146 mỗi bên.
  // Parent gộp đợt 63: +131 key fragment (R1 5 + R5 123 + R7 2 + R9 1) − 1 key chết speed.warnTooShort − 1 key jobNote chưa có UI → 2275 mỗi bên (vi == en, 0 key mồ côi); parent gộp đợt 64: +7 key fragment (R2 6 + R8 1) + 1 key parent (projectHistory.migrateVersionsNeedsProjectId) → 2283 mỗi bên.
  // Đợt 73 A9: +19 key (17 safeArea.* + 2 exportPreset.igPortrait*) → 2400 mỗi bên.
  // Đợt 74 B9: +4 key caption.karaokeStyle* → 2404 mỗi bên; đợt 74 B3: +1 key mediabin.codecUnsupported → 2405 mỗi bên; đợt 75 C6: +8 key mediabin.codec* → 2413 mỗi bên; đợt 76 D9: +6 key exportPanel.aspectFit* → 2419 mỗi bên; đợt 79 G9: +6 key (5 openProject.archiveHistory* + 1 captions.trackLabel) → 2425 mỗi bên; đợt 80 H7: +10 key (4 reverseGate.* + 6 rehydrate.*) → 2435; +9 key đợt 80 H10 (social presets) → 2444 mỗi bên; +17 key aiJob.* (luồng round-80 khác) → 2461 mỗi bên; đợt 81 I6: +2 key aiJob.etaEstimating + aiJob.etaHours → 2463 mỗi bên; đợt 84 L9: +2 key (mediabin.proxyHeightLabel + mediabin.proxyNoOriginalFile) → 2465 mỗi bên; đợt 84 L8: +24 key (18 tts.* + 6 bridgeErrors.*) → 2489 mỗi bên; đợt 85 M7: +11 key tts.* (export/import giọng) → 2500 mỗi bên; đợt 85 M8: +7 key mediabin.proxy* (progress/retry) → 2507 mỗi bên; đợt 87 O5: +7 key (4 mask.* + 3 motionTrack.*) → 2514 mỗi bên; +1 key closing (motionTrack.maskStillFollows) → 2515 mỗi bên; +1 key đợt 88 P6 (validation.TRACK_IMAGE_MASK) → 2516 mỗi bên; +1 key đợt 91 S5 (motionTrack.title) → 2517 mỗi bên; +1 key đợt 92 T5 (sticker.title) → 2518 mỗi bên; +249 key đợt 93 U5 (5 sticker.cat.* + 244 sticker.item.*) → 2767 mỗi bên.
  assert.equal(viKeys.size, 2767);
  assert.equal(enKeys.size, 2767);
});

ok("i18n: nội dung 24 key mới đúng từng chữ, vi khác en", () => {
  const vi = dict("vi");
  const en = dict("en");
  const expected: Record<string, [string, string]> = {
    "projectMenu.new": ["🆕 Mới", "🆕 New"],
    "projectMenu.newHint": ["Tạo dự án mới", "Create a new project"],
    "projectMenu.open": ["📂 Mở", "📂 Open"],
    "projectMenu.openHint": ["Mở file dự án (.vcut.json)", "Open a project file (.vcut.json)"],
    "projectMenu.save": ["💾 Lưu", "💾 Save"],
    "projectMenu.saveHint": ["Lưu thành file (Ctrl+S)", "Save to file (Ctrl+S)"],
    "projectMenu.saveAs": ["💾 Lưu thành…", "💾 Save as…"],
    "projectMenu.saveAsHint": ["Lưu thành tên khác", "Save under a different name"],
    "projectMenu.exportArchive": ["📦 Xuất bản nén", "📦 Export archive"],
    "projectMenu.exportArchiveHint": [
      "Xuất project + media thành 1 file nén (.vcut.zip) — mang đi máy khác",
      "Export the project + media as a single archive (.vcut.zip) — take it to another machine",
    ],
    "projectMenu.importArchive": ["📥 Nhập bản nén", "📥 Import archive"],
    "projectMenu.importArchiveHint": [
      "Nhập file bản nén (.vcut.zip) — khôi phục project + media",
      "Import an archive file (.vcut.zip) — restore the project + media",
    ],
    "projectMenu.history": ["🕘 Lịch sử", "🕘 History"],
    "projectMenu.historyHint": [
      "Lịch sử phiên bản project (lưu local, chưa đồng bộ cloud)",
      "Project version history (stored locally, not synced to the cloud)",
    ],
    "projectMenu.unsavedChangesHint": [
      "Có thay đổi chưa được lưu thành file (.vcut.json)",
      "There are changes not yet saved to a file (.vcut.json)",
    ],
    "projectMenu.allSavedHint": ["Mọi thay đổi đã được lưu", "All changes have been saved"],
    "projectMenu.unsaved": ["● Chưa lưu", "● Unsaved"],
    "projectMenu.autosaveAt": ["✓ Autosave {time}", "✓ Autosaved {time}"],
    "projectMenu.saved": ["✓ Đã lưu", "✓ Saved"],
    "projectMenu.saveAsPrompt": ["Tên dự án", "Project name"],
    "projectMenu.untitledProject": ["Dự án không tên", "Untitled project"],
    "topbar.welcome": ["👋 Bắt đầu", "👋 Get started"],
    "topbar.welcomeHint": [
      "Mở lại màn chào / tour / template pack 1 chạm",
      "Reopen the welcome screen / tour / template pack in one tap",
    ],
    "topbar.welcomeLabel": ["Mở lại màn chào", "Reopen the welcome screen"],
  };
  for (const k of NEW_KEYS) {
    const [v, e] = expected[k];
    assert.equal(lookup(vi, k), v, `${k} vi`);
    assert.equal(lookup(en, k), e, `${k} en`);
    assert.notEqual(lookup(vi, k), lookup(en, k), `${k}: vi phải khác en`);
  }
  // autosaveAt giữ placeholder {time} cả 2 bên.
  assert.ok(lookup(vi, "projectMenu.autosaveAt").includes("{time}"));
  assert.ok(lookup(en, "projectMenu.autosaveAt").includes("{time}"));
});

// --- 2. Render thật: EN không còn literal VI -------------------------
ok("render EN: ProjectMenu + TopBar không còn literal VI nào của M19", () => {
  setLang("en");
  const html = renderBoth();
  for (const s of FORBIDDEN_VI_IN_EN) {
    assert.ok(!html.includes(s), `EN vẫn còn literal VI: ${JSON.stringify(s)}`);
  }
  for (const s of REQUIRED_EN) {
    assert.ok(html.includes(s), `EN thiếu chuỗi: ${JSON.stringify(s)}`);
  }
  // NHÁNH DIRTY ("● Unsaved" / "● Chưa lưu") KHÔNG đo được bằng
  // render SSR: renderToStaticMarkup dùng getServerSnapshot của zustand
  // nên luôn thấy state lúc khởi tạo (sạch), dù isDirty(spec) sau
  // setProjectName đã = true (đã chứng minh bằng probe riêng, xem
  // LIMITS). Nhánh này chỉ là ternary dùng cùng t() đã chứng minh ở
  // trạng thái sạch + key-content test khóa đúng từng chữ cả 2 ngôn
  // ngữ; đo headed trên browser thật sẽ phủ nhánh dirty.
});

ok("render VI: ProjectMenu + TopBar hiện đủ chuỗi VI cũ", () => {
  setLang("vi");
  const html = renderBoth();
  for (const s of REQUIRED_VI) {
    assert.ok(html.includes(s), `VI thiếu chuỗi: ${JSON.stringify(s)}`);
  }
  // VI không được lẫn chuỗi EN của các key mới.
  for (const s of ["🆕 New", "📂 Open", "💾 Save", "Export archive", "Import archive", "👋 Get started"]) {
    assert.ok(!html.includes(s), `VI lẫn chuỗi EN: ${JSON.stringify(s)}`);
  }
});

// --- 3. Source: 2 file dùng t() + không còn literal cũ ----------------
ok("source: ProjectMenu.tsx dùng t() cho mọi chuỗi mới + useLang()", () => {
  const src = readFileSync("apps/web/src/components/project/ProjectMenu.tsx", "utf8");
  assert.ok(src.includes("useLang"), "ProjectMenu phải gọi useLang()");
  for (const k of NEW_PROJECTMENU_KEYS) {
    assert.ok(src.includes(`t("${k}"`), `ProjectMenu phải gọi t("${k}")`);
  }
  for (const frag of [
    'title="Tạo dự án mới"',
    'title="Mở file dự án (.vcut.json)"',
    'title="Lưu thành file (Ctrl+S)"',
    'title="Lưu thành tên khác"',
    'title="Xuất project + media thành 1 file nén',
    'title="Nhập file bản nén (.vcut.zip)',
    'title="Lịch sử phiên bản project',
    '"Tên dự án"',
    '"Dự án không tên"',
    '"● Chưa lưu"',
    '"✓ Đã lưu"',
    '"Có thay đổi chưa được lưu thành file',
    '"Mọi thay đổi đã được lưu"',
    'toLocaleTimeString("vi-VN")',
  ]) {
    assert.ok(!src.includes(frag), `ProjectMenu còn literal cứng: ${frag}`);
  }
});

ok("source: TopBar.tsx dùng t() cho nút Bắt đầu, không còn literal", () => {
  const src = readFileSync("apps/web/src/TopBar.tsx", "utf8");
  for (const k of NEW_TOPBAR_KEYS) {
    assert.ok(src.includes(`t("${k}"`), `TopBar phải gọi t("${k}")`);
  }
  for (const frag of [
    '"👋 Bắt đầu"',
    '"Mở lại màn chào / tour / template pack 1 chạm"',
    'aria-label="Mở lại màn chào"',
  ]) {
    assert.ok(!src.includes(frag), `TopBar còn literal cứng: ${frag}`);
  }
});

runAll();
