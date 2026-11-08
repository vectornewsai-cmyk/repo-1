/**
 * templateEnReview63R10.test.ts — Phase 9 đợt 63, luồng R10: follow-up N5
 * (đợt 57) — review EN vòng 2 của toàn bộ chuỗi EN trong template.
 *
 * Phạm vi đã rà soát (xem docs/PHASE9_ROUND63_R10_DOCS_DEAD_BRANCH_LIMITS.md §2):
 *   - 100 giá trị en tên/mô tả 50 template (fragment round56-m7.json +
 *     5 override round57-n5.json = giá trị hiệu dụng).
 *   - 180 nhãn placeholder en (fragment round57-n5.json).
 *   - 46 chuỗi en text preset (`textanim.opt.*` label/desc + demo/note
 *     trong vi.json/en.json) — 46/46 tự nhiên, đúng ngữ pháp, KHÔNG sửa.
 *   - 96 file CSS trong assets/text-presets/ không có chuỗi EN hiển thị
 *     nào trong UI web (không được tham chiếu từ apps/web/src) nên không
 *     có gì để review; chuỗi EN của text preset chính là `textanim.*`.
 *
 * Kết quả: CHỈ 3 giá trị cần sửa (đều là tên/mô tả template) — nằm trong
 * fragment MỚI round63-r10.json, merge ĐÈ lên m7+n5 (r10.en thắng khi
 * trùng key); round56-m7.json / round57-n5.json KHÔNG sửa; vi không đổi;
 * không thêm key mới (dict vẫn 2146).
 *
 * Chạy bằng runner chuẩn (từ gốc repo):
 *   node scripts/run-node-test.mjs apps/web/src/lib/templateEnReview63R10.test.ts
 */
import { getLang, setLang } from "../i18n";
import fragmentM7 from "../i18n/fragments/round56-m7.json";
import fragmentN5 from "../i18n/fragments/round57-n5.json";
import fragmentR10 from "../i18n/fragments/round63-r10.json";
import { TEMPLATES } from "./templates";
import {
  LOCALIZED_PLACEHOLDER_COUNT,
  LOCALIZED_TEMPLATE_COUNT,
  localizeTemplateMeta,
  localizeTemplatePlaceholders,
  type TemplateContentTable,
} from "./templateContentLocale";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7/N5). */
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
const r10 = fragmentR10 as unknown as TemplateContentTable;

/** 3 giá trị EN đã sửa ở vòng review 2 (khóa cứng — đổi bản dịch là đỏ). */
const CORRECTED_EN_R10: Record<string, { name?: string; description?: string }> = {
  "album-teaser": { description: "Square video: cover art + album name + release date." },
  "audiobook-promo": { description: "Square video: cover art + book title + narrator." },
  "tiktok-viral": { name: "Vertical TikTok Video" },
};

/** 5 giá trị EN đã sửa ở N5 (khóa chéo — R10 không được làm drift chúng). */
const CORRECTED_EN_N5: Record<string, { name?: string; description?: string }> = {
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

/** Mẫu 10 giá trị en không đổi (đủ phủ các nhóm: tên, mô tả, pack, lẻ). */
const UNCHANGED_SAMPLE: Record<string, { name?: string; description?: string }> = {
  "album-cover": {
    name: "Album Cover",
    description: "Square video introducing an album: cover art + album name + artist name.",
  },
  "charity-appeal": { name: "Charity Appeal" },
  "tutorial-vertical": { name: "Vertical Tutorial" },
  "webinar-invite": { name: "Webinar Invitation" },
  unboxing: { description: "Square unboxing video: opening scene + name + price." },
  "youtube-intro": {
    name: "YouTube Intro",
    description: "Channel opening: the channel title rises over cinematic footage.",
  },
  slideshow: { description: "4-photo slideshow with smooth transitions." },
  "food-reel": { description: "Vertical food review: 3 quick cuts + hook + dish name." },
  "lyric-video": { name: "Lyric Video" },
};

ok("fragment R10: đúng 3 key en, 0 key vi, đúng từng chữ, đều là override key cũ", () => {
  eq(Object.keys(r10.vi).length, 0, "fragment R10 không sửa vi");
  eq(Object.keys(r10.en).length, 3, "fragment R10 đúng 3 key en");
  for (const [id, fix] of Object.entries(CORRECTED_EN_R10)) {
    if (fix.name !== undefined) {
      eq(r10.en[`templatePack.${id}.name`], fix.name, `fragment en name ${id}`);
      isTrue(
        `templatePack.${id}.name` in m7.en || `templatePack.${id}.name` in n5.en,
        `key name ${id} phải là override (đã có trong m7/n5)`,
      );
    }
    if (fix.description !== undefined) {
      eq(r10.en[`templatePack.${id}.description`], fix.description, `fragment en desc ${id}`);
      isTrue(
        `templatePack.${id}.description` in m7.en ||
          `templatePack.${id}.description` in n5.en,
        `key desc ${id} phải là override (đã có trong m7/n5)`,
      );
    }
  }
  eq(LOCALIZED_TEMPLATE_COUNT, 50, "LOCALIZED_TEMPLATE_COUNT vẫn 50 (không thêm template)");
  eq(LOCALIZED_PLACEHOLDER_COUNT, 180, "LOCALIZED_PLACEHOLDER_COUNT vẫn 180 (không thêm label)");
});

ok("helper en: 3 template trả đúng bản sửa R10, khác M7/N5", () => {
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

ok("helper vi: 3 template không đổi (vi không sửa ở R10)", () => {
  for (const id of Object.keys(CORRECTED_EN_R10)) {
    const tpl = TEMPLATES.find((t) => t.template.id === id)!;
    const meta = localizeTemplateMeta(tpl, "vi");
    eq(meta.name, tpl.template.name, `vi name không đổi ${id}`);
    eq(meta.description, tpl.template.description, `vi desc không đổi ${id}`);
  }
});

ok("không drift: 5 giá trị N5 + mẫu 10 giá trị M7 còn nguyên qua helper", () => {
  for (const [id, fix] of Object.entries(CORRECTED_EN_N5)) {
    const tpl = TEMPLATES.find((t) => t.template.id === id)!;
    const meta = localizeTemplateMeta(tpl, "en");
    if (fix.name !== undefined) eq(meta.name, fix.name, `en name N5 còn nguyên ${id}`);
    if (fix.description !== undefined) {
      eq(meta.description, fix.description, `en desc N5 còn nguyên ${id}`);
    }
  }
  for (const [id, fix] of Object.entries(UNCHANGED_SAMPLE)) {
    const tpl = TEMPLATES.find((t) => t.template.id === id)!;
    const meta = localizeTemplateMeta(tpl, "en");
    if (fix.name !== undefined) eq(meta.name, fix.name, `en name mẫu không đổi ${id}`);
    if (fix.description !== undefined) {
      eq(meta.description, fix.description, `en desc mẫu không đổi ${id}`);
    }
  }
});

ok("placeholder labels không đổi: mẫu nhãn en vẫn đúng N5", () => {
  const checks: Array<[string, string, string]> = [
    ["birthday-card", "name", "Recipient's name"],
    ["tiktok-viral", "caption", "Persistent caption"],
    ["real-estate-tour", "room3", "Kitchen & yard"],
    ["charity-appeal", "cta", "Call to action"],
    ["tutorial-vertical", "label1", "Step 1 label"],
  ];
  for (const [id, pid, expected] of checks) {
    const tpl = TEMPLATES.find((t) => t.template.id === id)!;
    const copy = localizeTemplatePlaceholders(tpl, "en");
    const p = copy.template.placeholders.find((x) => x.id === pid)!;
    eq(p.label, expected, `en label không đổi ${id}.${pid}`);
  }
});

ok("không đột biến dữ liệu gốc: TEMPLATES giữ nguyên sau localize en", () => {
  const before = JSON.stringify(TEMPLATES);
  for (const tpl of TEMPLATES) {
    localizeTemplateMeta(tpl, "en");
    localizeTemplatePlaceholders(tpl, "en");
  }
  eq(JSON.stringify(TEMPLATES), before, "TEMPLATES không đổi sau localize");
});

// Khôi phục ngôn ngữ mặc định cho tiến trình test.
setLang("vi");
isTrue(getLang() === "vi", "getLang() đã về vi");

console.log(
  `R10 template EN review: ${pass} pass, ${fail} fail${fail > 0 ? ` — FAILED: ${failedNames.join(", ")}` : ""}`,
);
if (fail > 0) process.exitCode = 1;
