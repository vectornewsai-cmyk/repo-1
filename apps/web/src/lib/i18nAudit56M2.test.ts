// i18nAudit56M2.test.ts — Phase 9 đợt 56, luồng M2: nối key i18n cho 4 file
// (BeatSyncModal, CaptionModal, SilenceModal, ExportPanel).
//
// Key mới nằm trong fragment apps/web/src/i18n/fragments/round56-m2.json
// (156 key) — parent merge vào vi.json/en.json ở cuối đợt, test này KHÔNG
// sửa vi.json/en.json. Vì vậy render-test chỉ assert KHÔNG CÒN literal VI
// trong HTML ở locale EN (đúng cả trước và sau khi merge: trước merge
// t() fallback về key, sau merge về chuỗi EN — cả hai đều không chứa
// literal VI). Chuỗi EN thật chỉ khóa được sau merge (xem LIMITS).
// expectT() bên dưới tự nhận biết đã merge hay chưa nên test xanh ở cả
// hai trạng thái.
//
// Chạy bằng esbuild bundle (mẫu L1/L2, chạy từ gốc repo; bundle ra
// scratch ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì
// react-dom/server dùng require động:
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit56M2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round56-m2/m2.test.cjs \
//     && node /tmp/round56-m2/m2.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { setLang } from "../i18n";
import { BeatSyncModal } from "../components/BeatSyncModal";
import { CaptionModal } from "../components/CaptionModal";
import { SilenceModal } from "../components/SilenceModal";
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
  console.log(`M2 i18n audit round 56: ${pass}/${queue.length} pass`);
}

function flatten(o: unknown, prefix: string, out: Record<string, string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out[q] = rec[k] as string;
  }
}
function frag(lang: "vi" | "en"): Record<string, string> {
  const raw = JSON.parse(
    readFileSync("apps/web/src/i18n/fragments/round56-m2.json", "utf8"),
  ) as Record<string, unknown>;
  const out: Record<string, string> = {};
  flatten((raw as Record<string, unknown>)[lang], "", out);
  return out;
}
function dict(lang: "vi" | "en"): Record<string, unknown> {
  return JSON.parse(
    readFileSync(`apps/web/src/i18n/${lang}.json`, "utf8"),
  ) as Record<string, unknown>;
}
function dictKeys(lang: "vi" | "en"): Set<string> {
  const rec: Record<string, string> = {};
  flatten(dict(lang), "", rec);
  return new Set(Object.keys(rec));
}
function dictVal(lang: "vi" | "en", key: string): string {
  const rec: Record<string, string> = {};
  flatten(dict(lang), "", rec);
  return rec[key];
}
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}
/** Bỏ comment /* *\/ và // để literal trong comment không gây dương tính giả. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");
}
function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

// Key theo file (prefix -> file nguồn).
const FILE_BY_PREFIX: Record<string, string> = {
  beatsync: "components/BeatSyncModal.tsx",
  caption: "components/CaptionModal.tsx",
  silence: "components/SilenceModal.tsx",
  exportPanel: "ExportPanel.tsx",
};
const EXPECTED_COUNTS: Record<string, number> = {
  beatsync: 24,
  caption: 45,
  silence: 21,
  exportPanel: 66,
};

// --- 1. Fragment: 156 key, parity vi/en, placeholder, không trùng key cũ ---
ok("fragment: đủ 156 key (24 beatsync + 45 caption + 21 silence + 66 exportPanel)", () => {
  const vi = frag("vi");
  const en = frag("en");
  assert.equal(Object.keys(vi).length, 156);
  assert.equal(Object.keys(en).length, 156);
  for (const [prefix, n] of Object.entries(EXPECTED_COUNTS)) {
    const got = Object.keys(vi).filter((k) => k.startsWith(`${prefix}.`)).length;
    assert.equal(got, n, `${prefix} phải có ${n} key, thực tế ${got}`);
  }
  for (const k of Object.keys(vi)) assert.ok(k in en, `en thiếu key ${k}`);
  for (const k of Object.keys(en)) assert.ok(k in vi, `vi thiếu key ${k}`);
  // Post-merge (đợt 58): fragment M2 đã gộp hết vào dict từ đợt 56 nên mọi key
  // fragment đều đã có trong vi.json/en.json — khóa tính trung thực của lần gộp:
  // giá trị trong dict phải đúng từng chữ giá trị fragment.
  const oldVi = dictKeys("vi");
  const oldEn = dictKeys("en");
  for (const k of Object.keys(vi)) {
    assert.ok(oldVi.has(k), `key ${k} chưa có trong vi.json (merge đợt 56 thiếu)`);
    assert.ok(oldEn.has(k), `key ${k} chưa có trong en.json (merge đợt 56 thiếu)`);
    assert.equal(dictVal("vi", k), vi[k], `vi.json lệch giá trị fragment ở ${k}`);
    assert.equal(dictVal("en", k), en[k], `en.json lệch giá trị fragment ở ${k}`);
  }
  for (const k of Object.keys(vi)) {
    assert.notEqual(vi[k], en[k], `${k}: vi phải khác en`);
    assert.ok(vi[k].length > 0 && en[k].length > 0, `${k}: chuỗi rỗng`);
    assert.deepEqual(placeholders(vi[k]), placeholders(en[k]), `${k}: placeholder vi/en lệch`);
  }
});

ok("fragment: vi đúng từng chữ source ở các key đã hiệu chỉnh + key tách nhánh", () => {
  const vi = frag("vi");
  const en = frag("en");
  // Các key proposal gốc bị mojibake / sai dấu ngoặc — đã sửa theo source.
  const fixed: Record<string, [string, string]> = {
    "exportPanel.quality": ["Chất lượng:", "Quality:"],
    "silence.thresholdHint": ['(càng gần 0 càng "khó tính")', "(the closer to 0, the stricter)"],
    "exportPanel.userLutMissing": [
      'LUT user "{name}" (file .cube chưa lưu trong trình duyệt — nhập lại)',
      'User LUT “{name}” (the .cube file is not saved in the browser — please import it again)',
    ],
    "exportPanel.reframeAdded": [
      '✅ Đã thêm "{name}" vào kho media — xuất bằng preset TikTok 9:16 để đăng.',
      "✅ Added “{name}” to the media library — export with the TikTok 9:16 preset to post it.",
    ],
    "exportPanel.shareLinked": [
      'Video {size}MB nên trang dùng chế độ linked: hãy bấm "Tải xuống MP4", đổi tên thành video.mp4 và đặt cùng thư mục với file HTML. {warnings}',
      "The video is {size} MB, so the page uses linked mode: tap “Download MP4”, rename it to video.mp4, and put it in the same folder as the HTML file. {warnings}",
    ],
    "exportPanel.jsonNote": [
      'File JSON này là "ngôn ngữ chung": render worker (Phase 1B) đọc nó để xuất MP4, AI agent (Phase 4) cũng sinh đúng định dạng này. Trường src là tên file gốc trong thư mục media của dự án.',
      "This JSON file is the “common language”: the render worker (Phase 1B) reads it to export MP4, and AI agents (Phase 4) generate exactly this format. The src field is the original file name in the project's media folder.",
    ],
  };
  for (const [k, [v, e]] of Object.entries(fixed)) {
    assert.equal(vi[k], v, `${k} vi`);
    assert.equal(en[k], e, `${k} en`);
  }
  // Key tách nhánh (proposal gộp 2 nhánh JSX thành 1 chuỗi — không khớp
  // render thật nên tách; key gộp silence.found bị bỏ, xem LIMITS).
  assert.ok(!("silence.found" in vi), "silence.found (gộp sai) không được có trong fragment");
  assert.equal(
    vi["silence.foundPartial"],
    "Tìm thấy {n} khoảng lặng (sẽ cắt {kept}, bỏ chọn {skipped}), tổng {total}s. Bỏ tick để giữ lại đoạn không muốn cắt:",
  );
  assert.equal(
    vi["silence.foundAll"],
    "Tìm thấy {n} khoảng lặng — sẽ cắt tất cả, tổng {total}s. Bỏ tick để giữ lại đoạn không muốn cắt:",
  );
  assert.equal(
    vi["caption.foundPlain"],
    "Tìm được {n} câu phụ đề. Kiểm tra lại rồi bấm Áp dụng:",
  );
  assert.equal(
    vi["caption.translatedPlain"],
    "🌐 {n} câu dịch ({lang}) — sẽ tạo track {track}:",
  );
});

// --- 2. Source: mọi key đều được gọi t(), hết literal cũ (không placeholder) ---
for (const [prefix, file] of Object.entries(FILE_BY_PREFIX)) {
  ok(`source: ${file} gọi t() cho mọi key ${prefix}.* trong fragment`, () => {
    const src = readSrc(file);
    const keys = Object.keys(frag("vi")).filter((k) => k.startsWith(`${prefix}.`));
    assert.ok(keys.length > 0, `không tìm thấy key ${prefix}.* trong fragment`);
    for (const k of keys) {
      assert.ok(src.includes(`t("${k}"`), `${file} phải gọi t("${k}")`);
    }
  });

  ok(`source: ${file} hết literal VI cũ của key không-placeholder`, () => {
    const src = stripComments(readSrc(file));
    const vi = frag("vi");
    const keys = Object.keys(vi).filter((k) => k.startsWith(`${prefix}.`));
    for (const k of keys) {
      if (placeholders(vi[k]).length > 0) continue; // template ${} — check bằng t() ở trên
      assert.ok(!src.includes(vi[k]), `${file} còn literal cứng: ${JSON.stringify(vi[k])} (key ${k})`);
    }
  });
}

// --- 3. Render thật EN: không còn literal VI trong trạng thái mặc định ---
const noop = () => undefined;

/**
 * Assert merge-proof cho 1 key đã nối: trước khi parent merge fragment
 * thì render hiện fallback là chính key; sau merge thì hiện chuỗi EN.
 */
function expectT(key: string, html: string): void {
  const en = frag("en")[key];
  assert.ok(en !== undefined, `fragment thiếu key ${key}`);
  if (dictKeys("en").has(key)) {
    assert.ok(html.includes(en), `EN sau merge phải hiện chuỗi: ${en} (key ${key})`);
  } else {
    assert.ok(html.includes(key), `EN trước merge phải hiện fallback key: ${key}`);
  }
}

// Literal VI render ở trạng thái mặc định (config / no-clip / invalid spec).
const EN_ABSENT: Array<[string, string[]]> = [
  [
    "BeatSyncModal",
    ["Cắt theo beat", "Không tìm thấy clip audio/video đã chọn.", "🎵 Cắt clip theo beat"],
  ],
  [
    "CaptionModal",
    [
      "Tạo phụ đề tự động",
      "Ngôn ngữ nói trong video",
      "🌐 Dịch sang",
      "Không dịch",
      "Hoặc nhập file phụ đề có sẵn:",
      "Xuất phụ đề của project:",
      "Project chưa có phụ đề nào",
      "🎙 Bắt đầu tạo phụ đề",
    ],
  ],
  [
    "SilenceModal",
    [
      "Cắt khoảng lặng",
      "Tự động phát hiện đoạn im lặng",
      "Clip cần cắt",
      "Timeline chưa có clip video/audio nào.",
      "Ngưỡng im lặng:",
      "Chỉ cắt khoảng lặng dài hơn:",
      "🔍 Phân tích khoảng lặng",
    ],
  ],
  [
    "ExportPanel",
    [
      "⬇ Xuất video",
      "❌ Spec chưa hợp lệ",
      "🎬 Xuất MP4",
      "Chất lượng:",
      "Chuẩn hoá âm thanh:",
      "⬇ Tải xuống .json",
      "⧉ Sao chép JSON",
    ],
  ],
];

ok("render EN: BeatSyncModal (nhánh no-clip) không còn literal VI", () => {
  setLang("en");
  const html = renderToStaticMarkup(
    React.createElement(BeatSyncModal, {
      trackId: "__nope__",
      clipId: "__nope__",
      onClose: noop,
    }),
  );
  for (const frag of EN_ABSENT[0][1]) {
    assert.ok(!html.includes(frag), `EN vẫn còn literal: ${frag}`);
  }
  // t() đã chạy: trước merge fragment, key fallback hiện thay cho chuỗi.
  expectT("beatsync.title", html);
  expectT("beatsync.noClip", html);
});

ok("render EN: CaptionModal (config) không còn literal VI", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(CaptionModal, { onClose: noop }));
  for (const frag of EN_ABSENT[1][1]) {
    assert.ok(!html.includes(frag), `EN vẫn còn literal: ${frag}`);
  }
  expectT("caption.title", html);
});

ok("render EN: SilenceModal (config) không còn literal VI", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(SilenceModal, { onClose: noop }));
  for (const frag of EN_ABSENT[2][1]) {
    assert.ok(!html.includes(frag), `EN vẫn còn literal: ${frag}`);
  }
  expectT("silence.title", html);
});

ok("render EN: ExportPanel không còn literal VI", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(ExportPanel, { onClose: noop }));
  for (const frag of EN_ABSENT[3][1]) {
    assert.ok(!html.includes(frag), `EN vẫn còn literal: ${frag}`);
  }
  expectT("exportPanel.title", html);
});

runAll();
