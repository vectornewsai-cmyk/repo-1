/**
 * templateContentLocale56M7.test.ts — Phase 9 đợt 56, luồng M7: localize
 * DATA-content (tên/mô tả template pack + catalog) qua fragment riêng.
 *
 * Chạy bằng esbuild bundle (mẫu L1/L2/M3, chạy từ gốc repo; bundle ra
 * scratch ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs (mẫu M3):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/templateContentLocale56M7.test.ts \
 *     --bundle --platform=node --format=cjs --outfile=/tmp/round56-m7/m7.test.cjs \
 *     && node /tmp/round56-m7/m7.test.cjs
 *
 * Test ĐỌC fragment JSON THẬT + TEMPLATES THẬT + gọi helper THẬT (không
 * mock hàm localize, không fake dict). Phạm vi Node: tầng data/helper —
 * KHÔNG mạo nhận là browser thật (hiển thị trên modal thật cần headed;
 * TemplatePackModal do luồng khác sở hữu trong đợt này, điểm nối ghi trong
 * docs/PHASE9_ROUND56_M7_DATA_CONTENT_LIMITS.md §4).
 * buildSampleProject() KHÔNG chạy được ở Node (cần MediaRecorder/canvas)
 * nên hồi quy project mẫu được khóa bằng: TEMPLATES nguyên vẹn + resolvePackSpec
 * 6/6 pack OK không còn marker + spec.meta.name giữ nguyên vi.
 */
import { getLang, setLang } from "../i18n";
import fragment from "../i18n/fragments/round56-m7.json";
import { TEMPLATES } from "./templates";
import { getPacks, PACK_TEMPLATE_IDS, resolvePackSpec } from "./templatePack";
import {
  getLocalizedPacks,
  localizeTemplate,
  localizeTemplateMeta,
  LOCALIZED_PACK_IDS,
  LOCALIZED_TEMPLATE_COUNT,
  packDisplayDescription,
  packDisplayName,
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

/** Tên + mô tả EN kỳ vọng cho 6 pack (khóa cứng — đổi bản dịch là đỏ). */
const EXPECTED_EN: Record<string, { name: string; description: string }> = {
  "title-card": {
    name: "Title Card",
    description: "Cinematic title screen: large text fading in over a dark background.",
  },
  "youtube-intro": {
    name: "YouTube Intro",
    description: "Channel opening: the channel title rises over cinematic footage.",
  },
  "birthday-card": {
    name: "Birthday Card",
    description: "Square birthday photo: name + wishes + sticker.",
  },
  "app-launch": {
    name: "App Launch",
    description: "Vertical app launch video: app screen + app name + tagline.",
  },
  "travel-vlog-intro": {
    name: "Travel Vlog Intro",
    description: "Travel intro: the place name flies in over the footage.",
  },
  "sale-countdown": {
    name: "Sale Countdown",
    description: "Vertical countdown video: product + discount + time left.",
  },
};

const table = fragment as unknown as TemplateContentTable;

ok("fragment: 100 key vi + 100 key en, đủ 50 template", () => {
  eq(Object.keys(table.vi).length, 100, "số key vi");
  eq(Object.keys(table.en).length, 100, "số key en");
  eq(LOCALIZED_TEMPLATE_COUNT, 50, "LOCALIZED_TEMPLATE_COUNT");
  eq(LOCALIZED_PACK_IDS.length, 6, "số pack");
  for (const id of PACK_TEMPLATE_IDS) {
    eq(LOCALIZED_PACK_IDS.includes(id), true, `pack ${id} trong LOCALIZED_PACK_IDS`);
  }
});

ok("fragment vi == đúng giá trị gốc trong templates.ts (50/50)", () => {
  eq(TEMPLATES.length, 50, "TEMPLATES length");
  for (const tpl of TEMPLATES) {
    const id = tpl.template.id;
    eq(table.vi[`templatePack.${id}.name`], tpl.template.name, `vi name ${id}`);
    eq(table.vi[`templatePack.${id}.description`], tpl.template.description, `vi desc ${id}`);
    isTrue(typeof table.en[`templatePack.${id}.name`] === "string", `en name ${id} tồn tại`);
    isTrue(typeof table.en[`templatePack.${id}.description`] === "string", `en desc ${id} tồn tại`);
  }
});

ok("vi→en: 6 pack đổi tên + mô tả thật (không mock)", () => {
  setLang("en");
  try {
    for (const tpl of getPacks()) {
      const id = tpl.template.id;
      const meta = localizeTemplateMeta(tpl, "en");
      eq(meta.name, EXPECTED_EN[id].name, `en name ${id}`);
      eq(meta.description, EXPECTED_EN[id].description, `en desc ${id}`);
      isTrue(meta.name !== tpl.template.name, `en khác vi (name ${id})`);
      isTrue(meta.description !== tpl.template.description, `en khác vi (desc ${id})`);
    }
  } finally {
    setLang("vi");
  }
});

ok("vi: tên/mô tả pack = đúng gốc templates.ts", () => {
  setLang("vi");
  for (const tpl of getPacks()) {
    const meta = localizeTemplateMeta(tpl, "vi");
    eq(meta.name, tpl.template.name, `vi name ${tpl.template.id}`);
    eq(meta.description, tpl.template.description, `vi desc ${tpl.template.id}`);
  }
});

ok("lang mặc định theo getLang() (không truyền lang)", () => {
  const tpl = getPacks()[0];
  setLang("en");
  try {
    eq(localizeTemplateMeta(tpl).name, EXPECTED_EN[tpl.template.id].name, "mặc định en");
  } finally {
    setLang("vi");
  }
  eq(localizeTemplateMeta(tpl).name, tpl.template.name, "mặc định vi");
  eq(getLang(), "vi", "getLang() đã về vi");
});

ok("fallback: thiếu key en → về vi; thiếu cả vi → về gốc templates.ts", () => {
  const tpl = getPacks().find((t) => t.template.id === "birthday-card")!;
  const copy: TemplateContentTable = {
    vi: { ...table.vi },
    en: { ...table.en },
  };
  delete copy.en["templatePack.birthday-card.name"];
  eq(
    localizeTemplateMeta(tpl, "en", copy).name,
    "Thiệp sinh nhật",
    "thiếu en name → vi",
  );
  eq(
    localizeTemplateMeta(tpl, "en", copy).description,
    EXPECTED_EN["birthday-card"].description,
    "key en còn lại vẫn dùng",
  );
  delete copy.vi["templatePack.birthday-card.name"];
  eq(
    localizeTemplateMeta(tpl, "en", copy).name,
    tpl.template.name,
    "thiếu cả vi → gốc templates.ts",
  );
});

ok("packDisplayName/Description: id lạ → id / chuỗi rỗng", () => {
  eq(packDisplayName("khong-co-pack-nay", "en"), "khong-co-pack-nay", "name id lạ");
  eq(packDisplayDescription("khong-co-pack-nay", "en"), "", "desc id lạ");
  eq(packDisplayName("title-card", "en"), "Title Card", "name title-card en");
});

ok("không đột biến dữ liệu gốc: TEMPLATES + TemplateDef giữ nguyên sau localize en", () => {
  const before = JSON.stringify(TEMPLATES);
  const packs = getLocalizedPacks("en");
  eq(packs.length, 6, "getLocalizedPacks length");
  eq(
    packs.map((p) => p.template.id).join(","),
    [...PACK_TEMPLATE_IDS].join(","),
    "thứ tự pack giữ nguyên",
  );
  eq(packs[0].template.name, EXPECTED_EN[packs[0].template.id].name, "bản sao đã en");
  // localize toàn bộ 50 template rồi đối chiếu lại
  for (const tpl of TEMPLATES) localizeTemplate(tpl, "en");
  eq(JSON.stringify(TEMPLATES), before, "TEMPLATES không đổi sau localize");
});

ok("không hồi quy: resolvePackSpec 6/6 pack OK, không còn marker, spec.meta.name giữ vi", () => {
  for (const tpl of getPacks()) {
    const fileNames: Record<string, string> = {};
    for (const p of tpl.template.placeholders) {
      if (p.kind === "video") fileNames[p.id] = `test-${p.id}.webm`;
      else if (p.kind === "image") fileNames[p.id] = `test-${p.id}.png`;
    }
    const res = resolvePackSpec(tpl, fileNames);
    eq(res.ok, true, `resolvePackSpec ${tpl.template.id} ok`);
    if (res.ok) {
      isTrue(!JSON.stringify(res.spec).includes("{{"), `không còn marker ${tpl.template.id}`);
      // applyTemplateValues đặt tên project = "<tên template gốc> — <meta.name gốc>":
      // tên project sinh ra PHẢI bắt nguồn từ tên vi gốc, không từ bản localize.
      eq(
        res.spec.meta.name,
        `${tpl.template.name} — ${tpl.spec.meta.name}`,
        `spec.meta.name từ tên vi gốc ${tpl.template.id}`,
      );
    }
  }
});

ok("getLocalizedPacks: bản sao en không làm đổi pack gốc", () => {
  const before = JSON.stringify(getPacks());
  const localized = getLocalizedPacks("en");
  eq(localized[0].template.name, EXPECTED_EN[localized[0].template.id].name, "pack sao en");
  eq(JSON.stringify(getPacks()), before, "getPacks() gốc không đổi");
});

// Khôi phục ngôn ngữ mặc định cho tiến trình test.
setLang("vi");

console.log(`M7 templateContentLocale: ${pass} pass, ${fail} fail${fail > 0 ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
