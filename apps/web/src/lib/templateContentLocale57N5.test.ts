/**
 * templateContentLocale57N5.test.ts — Phase 9 đợt 57, luồng N5: follow-up M7.
 *
 * (a) Review EN của 50 template (100 key đợt 56): 5 giá trị đã sửa, nằm
 *     trong fragment MỚI round57-n5.json và merge ĐÈ lên round56-m7.json;
 *     95 giá trị còn lại phải giữ nguyên y hệt M7 (khóa chống drift).
 *     Đợt 63 R10 review vòng 2 sửa thêm 3 giá trị (fragment
 *     round63-r10.json, đè lên cả m7+n5) nên case "95 giá trị" nay là
 *     "92 giá trị" + case (a2) khóa 3 giá trị R10 — xem
 *     docs/PHASE9_ROUND63_R10_DOCS_DEAD_BRANCH_LIMITS.md §2.
 * (b) Tách placeholder `label` (nhãn form → localize) khỏi `default`
 *     (nội dung mẫu → giữ nguyên): 180 key
 *     `templatePack.<id>.placeholder.<pid>.label` trong fragment N5.
 *
 * Chạy bằng esbuild bundle (mẫu M7, chạy từ gốc repo; bundle ra scratch
 * ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs (mẫu M3):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/templateContentLocale57N5.test.ts \
 *     --bundle --platform=node --format=cjs --outfile=/tmp/round57-n5/n5.test.cjs \
 *     && node /tmp/round57-n5/n5.test.cjs
 *
 * Test ĐỌC fragment JSON THẬT + TEMPLATES THẬT + gọi helper THẬT (không
 * mock hàm localize, không fake dict). Phạm vi Node: tầng data/helper —
 * KHÔNG mạo nhận là browser thật (hiển thị trên form thật cần headed;
 * TemplatePicker do luồng khác sở hữu, điểm nối ghi trong
 * docs/PHASE9_ROUND57_N5_TEMPLATE_EN_LIMITS.md §3).
 */
import { getLang, setLang } from "../i18n";
import fragmentM7 from "../i18n/fragments/round56-m7.json";
import fragmentN5 from "../i18n/fragments/round57-n5.json";
import { TEMPLATES } from "./templates";
import {
  LOCALIZED_PLACEHOLDER_COUNT,
  LOCALIZED_TEMPLATE_COUNT,
  localizePlaceholderLabel,
  localizeTemplateMeta,
  localizeTemplatePlaceholders,
  type TemplateContentTable,
} from "./templateContentLocale";

/** Khai báo tối thiểu để không cần @types/node (mẫu loadSampleQueue49E6). */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual !== expected) {
    throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function isTrue(cond: boolean, what: string): void {
  if (!cond) throw new Error(`expected true: ${what}`);
}

const m7 = fragmentM7 as unknown as TemplateContentTable;
const n5 = fragmentN5 as unknown as TemplateContentTable;

/** 5 giá trị EN đã sửa sau review (khóa cứng — đổi bản dịch là đỏ). */
const CORRECTED_EN: Record<string, { name?: string; description?: string }> = {
  "audiobook-promo": { name: "Audiobook Promo" },
  "charity-appeal": {
    description: "Landscape appeal video: field footage + message + bank account number.",
  },
  "tutorial-vertical": {
    description: "Vertical 3-step tutorial: one scene and step text per step.",
  },
  unboxing: { name: "Product Unboxing" },
  "webinar-invite": {
    description: "Landscape video inviting viewers to a webinar: speaker + topic + time.",
  },
};

/** 3 giá trị EN đã sửa ở đợt 63 R10 (review vòng 2 — khóa cứng như
 * CORRECTED_EN; đổi bản dịch là đỏ). Xem
 * docs/PHASE9_ROUND63_R10_DOCS_DEAD_BRANCH_LIMITS.md §2 +
 * apps/web/src/lib/templateEnReview63R10.test.ts (khóa fragment R10). */
const CORRECTED_EN_R10: Record<string, { name?: string; description?: string }> = {
  "album-teaser": { description: "Square video: cover art + album name + release date." },
  "audiobook-promo": { description: "Square video: cover art + book title + narrator." },
  "tiktok-viral": { name: "Vertical TikTok Video" },
};

/** Mẫu nhãn placeholder EN đã dịch (khóa cứng một phần — đủ phủ các loại). */
const EXPECTED_LABEL_EN: Record<string, Record<string, string>> = {
  "album-cover": { cover: "Album cover photo", album: "Album name", artist: "Artist name" },
  "birthday-card": { bg: "Background photo", name: "Recipient's name", wish: "Wish" },
  "tiktok-viral": { caption: "Persistent caption" },
  "gaming-highlight": { clip1: "Play 1", clip2: "Play 2 (highlight)" },
  "tutorial-vertical": { step1: "Step 1", label1: "Step 1 label" },
  "real-estate-tour": { room3: "Kitchen & yard", price: "Price" },
  "charity-appeal": { message: "Message", cta: "Call to action" },
  "lofi-visual": { artist: "Artist", bg: "Background photo" },
  "podcast-highlight": { quote: "Quote", show: "Show name" },
};

ok("fragment N5: 180 key vi + 185 key en (180 label + 5 override)", () => {
  eq(Object.keys(n5.vi).length, 180, "số key vi N5");
  eq(Object.keys(n5.en).length, 185, "số key en N5");
  eq(LOCALIZED_PLACEHOLDER_COUNT, 180, "LOCALIZED_PLACEHOLDER_COUNT");
  eq(LOCALIZED_TEMPLATE_COUNT, 50, "LOCALIZED_TEMPLATE_COUNT vẫn 50 sau khi gộp N5");
  for (const k of Object.keys(n5.vi)) {
    isTrue(k.endsWith(".label"), `key vi N5 là placeholder label: ${k}`);
    isTrue(typeof n5.en[k] === "string" && n5.en[k].length > 0, `en label ${k} tồn tại`);
  }
  for (const k of Object.keys(CORRECTED_EN)) {
    isTrue(k in m7.en || true, `override ${k} có trong M7`);
  }
});

ok("fragment N5 vi == đúng label gốc trong templates.ts (180/180)", () => {
  eq(TEMPLATES.length, 50, "TEMPLATES length");
  let total = 0;
  for (const tpl of TEMPLATES) {
    const id = tpl.template.id;
    for (const p of tpl.template.placeholders) {
      total++;
      eq(
        n5.vi[`templatePack.${id}.placeholder.${p.id}.label`],
        p.label,
        `vi label ${id}.${p.id}`,
      );
    }
  }
  eq(total, 180, "tổng số placeholder");
});

ok("(a) 5 giá trị EN đã sửa: helper trả đúng bản sửa, khác M7", () => {
  for (const [id, fix] of Object.entries(CORRECTED_EN)) {
    const tpl = TEMPLATES.find((t) => t.template.id === id)!;
    const meta = localizeTemplateMeta(tpl, "en");
    if (fix.name !== undefined) {
      eq(meta.name, fix.name, `en name đã sửa ${id}`);
      isTrue(meta.name !== m7.en[`templatePack.${id}.name`], `khác M7 (name ${id})`);
    }
    if (fix.description !== undefined) {
      eq(meta.description, fix.description, `en desc đã sửa ${id}`);
      isTrue(
        meta.description !== m7.en[`templatePack.${id}.description`],
        `khác M7 (desc ${id})`,
      );
    }
  }
});

ok("(a2) 3 giá trị EN đã sửa ở đợt 63 R10: helper trả đúng bản sửa, khác M7", () => {
  for (const [id, fix] of Object.entries(CORRECTED_EN_R10)) {
    const tpl = TEMPLATES.find((t) => t.template.id === id)!;
    const meta = localizeTemplateMeta(tpl, "en");
    if (fix.name !== undefined) {
      eq(meta.name, fix.name, `en name đã sửa R10 ${id}`);
      isTrue(meta.name !== m7.en[`templatePack.${id}.name`], `khác M7 (name ${id})`);
    }
    if (fix.description !== undefined) {
      eq(meta.description, fix.description, `en desc đã sửa R10 ${id}`);
      isTrue(
        meta.description !== m7.en[`templatePack.${id}.description`],
        `khác M7 (desc ${id})`,
      );
    }
  }
});

ok("(a) 92 giá trị EN còn lại giữ nguyên y hệt M7 (không drift; 100 − 5 N5 − 3 R10)", () => {
  let checked = 0;
  for (const tpl of TEMPLATES) {
    const id = tpl.template.id;
    const meta = localizeTemplateMeta(tpl, "en");
    if (CORRECTED_EN[id]?.name === undefined && CORRECTED_EN_R10[id]?.name === undefined) {
      eq(meta.name, m7.en[`templatePack.${id}.name`], `en name không đổi ${id}`);
      checked++;
    }
    if (
      CORRECTED_EN[id]?.description === undefined &&
      CORRECTED_EN_R10[id]?.description === undefined
    ) {
      eq(meta.description, m7.en[`templatePack.${id}.description`], `en desc không đổi ${id}`);
      checked++;
    }
  }
  eq(checked, 92, "92 giá trị en không đổi (50 name + 50 desc − 5 sửa N5 − 3 sửa R10)");
});

ok("(b) localizeTemplatePlaceholders: nhãn en đúng fragment, mẫu nhãn khóa cứng", () => {
  setLang("en");
  try {
    for (const tpl of TEMPLATES) {
      const id = tpl.template.id;
      const copy = localizeTemplatePlaceholders(tpl, "en");
      eq(copy.template.placeholders.length, tpl.template.placeholders.length, `số placeholder ${id}`);
      for (const p of copy.template.placeholders) {
        eq(
          p.label,
          n5.en[`templatePack.${id}.placeholder.${p.id}.label`],
          `en label ${id}.${p.id}`,
        );
      }
    }
    for (const [id, labels] of Object.entries(EXPECTED_LABEL_EN)) {
      const tpl = TEMPLATES.find((t) => t.template.id === id)!;
      const copy = localizeTemplatePlaceholders(tpl, "en");
      for (const [pid, expected] of Object.entries(labels)) {
        const p = copy.template.placeholders.find((x) => x.id === pid);
        isTrue(p !== undefined, `placeholder ${id}.${pid} tồn tại`);
        eq(p!.label, expected, `nhãn en khóa cứng ${id}.${pid}`);
      }
    }
  } finally {
    setLang("vi");
  }
});

ok("(b) default KHÔNG đổi: 180/180 default giữ nguyên sau localize en", () => {
  for (const tpl of TEMPLATES) {
    const copy = localizeTemplatePlaceholders(tpl, "en");
    for (let i = 0; i < tpl.template.placeholders.length; i++) {
      const orig = tpl.template.placeholders[i];
      const got = copy.template.placeholders[i];
      eq(got.default, orig.default, `default không đổi ${tpl.template.id}.${orig.id}`);
      eq(got.kind, orig.kind, `kind không đổi ${tpl.template.id}.${orig.id}`);
      eq(got.id, orig.id, `id không đổi ${tpl.template.id}.${orig.id}`);
    }
    // localizeTemplatePlaceholders không đụng tên/mô tả template.
    eq(copy.template.name, tpl.template.name, `name giữ vi ${tpl.template.id}`);
    eq(copy.template.description, tpl.template.description, `desc giữ vi ${tpl.template.id}`);
  }
});

ok("(b) vi: nhãn placeholder = đúng gốc templates.ts", () => {
  setLang("vi");
  for (const tpl of TEMPLATES) {
    const copy = localizeTemplatePlaceholders(tpl, "vi");
    for (let i = 0; i < tpl.template.placeholders.length; i++) {
      eq(copy.template.placeholders[i].label, tpl.template.placeholders[i].label, `vi label ${tpl.template.id}`);
    }
  }
});

ok("(b) fallback label: thiếu key en → vi; thiếu cả vi → label gốc; lang mặc định theo getLang()", () => {
  const tpl = TEMPLATES.find((t) => t.template.id === "birthday-card")!;
  const p = tpl.template.placeholders.find((x) => x.id === "name")!;
  const copy: TemplateContentTable = {
    vi: { ...m7.vi, ...n5.vi },
    en: { ...m7.en, ...n5.en },
  };
  delete copy.en["templatePack.birthday-card.placeholder.name.label"];
  eq(localizePlaceholderLabel(tpl, p, "en", copy), "Tên người nhận", "thiếu en label → vi");
  delete copy.vi["templatePack.birthday-card.placeholder.name.label"];
  eq(localizePlaceholderLabel(tpl, p, "en", copy), p.label, "thiếu cả vi → label gốc");
  // placeholder lạ (không có trong template/fragment) → trả đúng label truyền vào.
  eq(
    localizePlaceholderLabel(tpl, { id: "khong-co", kind: "text", label: "Nhãn lạ", default: "x" }, "en"),
    "Nhãn lạ",
    "placeholder lạ → label gốc",
  );
  // lang mặc định theo getLang().
  setLang("en");
  try {
    eq(localizePlaceholderLabel(tpl, p), "Recipient's name", "mặc định en theo getLang()");
  } finally {
    setLang("vi");
  }
  eq(localizePlaceholderLabel(tpl, p), "Tên người nhận", "mặc định vi");
  eq(getLang(), "vi", "getLang() đã về vi");
});

ok("không đột biến dữ liệu gốc: TEMPLATES giữ nguyên sau localize en toàn bộ 50 template", () => {
  const before = JSON.stringify(TEMPLATES);
  for (const tpl of TEMPLATES) {
    localizeTemplatePlaceholders(tpl, "en");
    localizeTemplateMeta(tpl, "en");
  }
  eq(JSON.stringify(TEMPLATES), before, "TEMPLATES không đổi sau localize");
});

// Khôi phục ngôn ngữ mặc định cho tiến trình test.
setLang("vi");

console.log(`N5 templateContentLocale: ${pass} pass, ${fail} fail${fail > 0 ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
