/**
 * templateContentLocale.ts — localize HIỂN THỊ tên/mô tả template (DATA-content,
 * Phase 9 đợt 56, luồng M7) + review EN và tách placeholder label/default
 * (đợt 57, luồng N5).
 *
 * Vấn đề (đợt 55 L2, `notProposed` trong `round55-l2-keys.json`): 643 literal
 * trong `lib/templates.ts` / `lib/sample*.ts` / `lib/sampleMedia.ts` là NỘI
 * DUNG (data), không phải chuỗi UI — không được dịch bằng `t()` trực tiếp.
 * Thiết kế đầy đủ xem `docs/DATA_CONTENT_I18N_DESIGN.md`. Tóm tắt:
 *
 * - (a) Tên/mô tả template trong CATALOG (hiển thị ở TemplatePicker /
 *   TemplatePackModal): localize được qua bảng song ngữ. Bảng nằm ở fragment
 *   RIÊNG `i18n/fragments/round56-m7.json` (KHÔNG sửa `vi.json`/`en.json`
 *   trực tiếp); key dạng `templatePack.<id>.name` / `.description` — đã
 *   tương thích `t()` để đợt sau gộp thẳng vào `vi.json`/`en.json` nếu parent
 *   quyết. Helper này mirror đúng ngữ nghĩa fallback của `t()`:
 *   ngôn ngữ hiện tại → `vi` → giá trị gốc trong `templates.ts`.
 * - (b) Nội dung mẫu BÊN TRONG project (placeholder default, text clip,
 *   tên clip, `spec.meta.name`): KHÔNG localize — đó là dữ liệu người dùng
 *   sau khi tạo project, dịch lén sẽ đổi nội dung họ export.
 * - (c) Tên file media mẫu (`mau-*.webm`, `pack-<id>-*.webm`): KHÔNG đổi —
 *   tên file là định danh, đổi là vỡ liên kết `src` trong spec.
 *
 * Đợt 57 N5 — 2 thay đổi trên nền M7:
 *
 * 1. REVIEW EN (LIMITS đợt 56 §5: bản dịch en đợt 56 dịch tay một người,
 *    chưa review): rà soát lại toàn bộ 100 giá trị en, sửa 5 giá trị
 *    (xem `docs/PHASE9_ROUND57_N5_TEMPLATE_EN_LIMITS.md`). 5 giá trị sửa
 *    nằm trong fragment MỚI `i18n/fragments/round57-n5.json` và được MERGE
 *    ĐÈ lên bảng M7 (n5.en thắng m7.en khi trùng key); `round56-m7.json`
 *    KHÔNG sửa. 95 giá trị en còn lại giữ nguyên y hệt M7 (test khóa).
 * 2. TÁCH placeholder `label` / `default` (DESIGN §5 mục 1 — quyết định
 *    của N5): `label` là NHÃN FORM mà TemplatePicker bước 2 render thành
 *    `<span>{kindLabel} — {p.label}</span>` — tức chuỗi UI người dùng đọc
 *    để điền form → LOCALIZE được, qua key
 *    `templatePack.<id>.placeholder.<pid>.label` trong fragment N5
 *    (180 key, 50 template, vi trích bằng máy từ `templates.ts`).
 *    `default` là NỘI DUNG MẪU (text mẫu chảy vào video export, hoặc tên
 *    file media mẫu chảy vào `applyTemplateValues` khi user để trống) →
 *    GIỮ NGUYÊN tiếng Việt, helper KHÔNG BAO GIỜ đụng `default`
 *    (test khóa 180/180 `default` không đổi sau localize).
 *    Track `label` trong spec (DESIGN §5 mục 2) KHÔNG thuộc đợt này: nó
 *    nằm trong spec đã lưu nên cần thiết kế riêng — xem LIMITS N5.
 *
 * Đợt 63 R10 — review EN vòng 2 (follow-up N5): rà soát lại toàn bộ 100
 * giá trị en tên/mô tả + 180 nhãn placeholder, sửa 3 giá trị en
 * (xem `docs/PHASE9_ROUND63_R10_DOCS_DEAD_BRANCH_LIMITS.md` §2).
 * 3 giá trị sửa nằm trong fragment MỚI `i18n/fragments/round63-r10.json`
 * và được MERGE ĐÈ lên bảng M7+N5 (r10.en thắng khi trùng key);
 * `round56-m7.json` / `round57-n5.json` KHÔNG sửa. Chuỗi EN của text
 * preset (44 chuỗi `textanim.opt.*` label/desc + demo/note trong
 * vi.json/en.json) cũng đã rà soát ở đợt này: 46/46 tự nhiên, đúng
 * ngữ pháp, KHÔNG sửa gì — xem LIMITS R10 §2.3 (không sửa dict trực
 * tiếp nên không có fragment cho nhóm này).
 *
 * Module này chỉ TRẢ VỀ BẢN SAO đã localize để hiển thị — không bao giờ sửa
 * `TEMPLATES` hay `TemplateDef` gốc (test khóa bất biến này). Điểm nối UI:
 * TemplatePackModal dùng `localizeTemplateMeta(tpl)` CHỈ cho 2 node text
 * tên/mô tả (dòng 158/160), vẫn truyền `tpl` GỐC vào `create()`; xem chi
 * tiết trong `docs/PHASE9_ROUND56_M7_DATA_CONTENT_LIMITS.md` §4.
 * TemplatePicker bước 2 dùng `localizeTemplatePlaceholders(tpl)` CHỈ để
 * hiển thị nhãn form — `values`/`apply()` vẫn nhận `tpl` GỐC và `default`
 * gốc (xem LIMITS N5 §3).
 */
import { getLang, type Lang } from "../i18n";
import fragmentM7 from "../i18n/fragments/round56-m7.json";
import fragmentN5 from "../i18n/fragments/round57-n5.json";
// Đợt 63 R10 — follow-up N5: review EN vòng 2, sửa 3 giá trị (xem
// docs/PHASE9_ROUND63_R10_DOCS_DEAD_BRANCH_LIMITS.md §2). Fragment mới
// CHỈ đè 3 key en, không thêm key mới, không sửa vi; m7/n5 không đụng.
import fragmentR10 from "../i18n/fragments/round63-r10.json";
import { getPacks, PACK_TEMPLATE_IDS } from "./templatePack";
import type { TemplateDef, TemplatePlaceholder } from "./templateEngine";

/** Bảng song ngữ: `vi`/`en` map key `templatePack.<id>.name|.description`. */
export interface TemplateContentTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/**
 * Bảng hợp nhất: N5 merge ĐÈ lên M7 (n5.en thắng m7.en khi trùng key —
 * 5 giá trị en đã review/sửa; n5.vi chỉ có key placeholder `.label` mới
 * nên không đè key nào của M7). R10 merge ĐÈ lên cả hai (r10.en thắng
 * m7.en/n5.en khi trùng key — 3 giá trị en review vòng 2; r10.vi rỗng
 * nên không đè key nào). `vi.json`/`en.json` KHÔNG sửa trực tiếp;
 * parent gộp fragment vào dict cuối đợt.
 */
const TABLE: TemplateContentTable = {
  vi: {
    ...(fragmentM7 as unknown as TemplateContentTable).vi,
    ...(fragmentN5 as unknown as TemplateContentTable).vi,
    ...(fragmentR10 as unknown as TemplateContentTable).vi,
  },
  en: {
    ...(fragmentM7 as unknown as TemplateContentTable).en,
    ...(fragmentN5 as unknown as TemplateContentTable).en,
    ...(fragmentR10 as unknown as TemplateContentTable).en,
  },
};

/** 6 pack tuyển trong `templatePack.ts` — phạm vi đã localize + kiểm chứng. */
export const LOCALIZED_PACK_IDS: readonly string[] = PACK_TEMPLATE_IDS;

/** Số template có tên/mô tả song ngữ trong fragment (6 pack + 44 còn lại). */
export const LOCALIZED_TEMPLATE_COUNT = Object.keys(
  (fragmentM7 as unknown as TemplateContentTable).vi,
).filter((k) => k.endsWith(".name")).length;

/** Số placeholder có nhãn form song ngữ trong fragment N5 (50 template). */
export const LOCALIZED_PLACEHOLDER_COUNT = Object.keys(
  (fragmentN5 as unknown as TemplateContentTable).vi,
).filter((k) => k.endsWith(".label")).length;

function lookup(table: TemplateContentTable, lang: Lang, key: string): string | undefined {
  return table[lang]?.[key] ?? table.vi[key];
}

/**
 * Tên + mô tả hiển thị của 1 template theo ngôn ngữ.
 * `lang` mặc định = ngôn ngữ hiện tại (`getLang()`); `table` chỉ để test
 * truyền bảng thiếu key (fallback) — production luôn dùng fragment mặc định.
 * Thiếu key ở cả 2 ngôn ngữ → trả đúng giá trị gốc trong `templates.ts`.
 */
export function localizeTemplateMeta(
  tpl: TemplateDef,
  lang: Lang = getLang(),
  table: TemplateContentTable = TABLE,
): { name: string; description: string } {
  const id = tpl.template.id;
  return {
    name: lookup(table, lang, `templatePack.${id}.name`) ?? tpl.template.name,
    description:
      lookup(table, lang, `templatePack.${id}.description`) ?? tpl.template.description,
  };
}

/**
 * Bản SAO của template với `template.name`/`description` đã localize (chỉ
 * phục vụ hiển thị). `spec` giữ nguyên tham chiếu — nội dung project bên
 * trong không đổi (xem thiết kế (b) ở header).
 */
export function localizeTemplate(
  tpl: TemplateDef,
  lang: Lang = getLang(),
  table: TemplateContentTable = TABLE,
): TemplateDef {
  const meta = localizeTemplateMeta(tpl, lang, table);
  return { ...tpl, template: { ...tpl.template, name: meta.name, description: meta.description } };
}

/** 6 pack tuyển, tên/mô tả đã localize — dùng cho TemplatePackModal. */
export function getLocalizedPacks(
  lang: Lang = getLang(),
  table: TemplateContentTable = TABLE,
): TemplateDef[] {
  return getPacks().map((tpl) => localizeTemplate(tpl, lang, table));
}

/** Tên hiển thị của 1 pack theo id (không tìm thấy pack → trả lại chính id). */
export function packDisplayName(
  id: string,
  lang: Lang = getLang(),
  table: TemplateContentTable = TABLE,
): string {
  return lookup(table, lang, `templatePack.${id}.name`) ?? id;
}

/** Mô tả hiển thị của 1 pack theo id (không tìm thấy pack → chuỗi rỗng). */
export function packDisplayDescription(
  id: string,
  lang: Lang = getLang(),
  table: TemplateContentTable = TABLE,
): string {
  return lookup(table, lang, `templatePack.${id}.description`) ?? "";
}

// ---- Đợt 57 N5: tách placeholder `label` (nhãn form, localize) khỏi
// `default` (nội dung mẫu, giữ nguyên) — xem header + DESIGN §5 mục 1. ----

/**
 * Nhãn form hiển thị của 1 placeholder theo ngôn ngữ.
 * Fallback mirror `t()`: en → vi → `label` gốc trong `templates.ts`.
 * `default` KHÔNG qua hàm này — nó là nội dung mẫu, không phải nhãn.
 */
export function localizePlaceholderLabel(
  tpl: TemplateDef,
  p: TemplatePlaceholder,
  lang: Lang = getLang(),
  table: TemplateContentTable = TABLE,
): string {
  return (
    lookup(table, lang, `templatePack.${tpl.template.id}.placeholder.${p.id}.label`) ?? p.label
  );
}

/**
 * Bản SAO của template với CHỈ placeholder `label` đã localize (phục vụ
 * hiển thị form bước 2 của TemplatePicker). `default` của mọi placeholder
 * giữ nguyên từng chữ — đó là nội dung mẫu chảy vào video export
 * (xem header (b)); `spec` giữ nguyên tham chiếu; `template.name` /
 * `description` giữ nguyên (dùng `localizeTemplate` riêng cho 2 field đó).
 */
export function localizeTemplatePlaceholders(
  tpl: TemplateDef,
  lang: Lang = getLang(),
  table: TemplateContentTable = TABLE,
): TemplateDef {
  return {
    ...tpl,
    template: {
      ...tpl.template,
      placeholders: tpl.template.placeholders.map((p) => ({
        ...p,
        label: localizePlaceholderLabel(tpl, p, lang, table),
      })),
    },
  };
}
