# Thiết kế localize DATA-content (VCut Studio)

> Phase 9 đợt 56, luồng M7. Nguồn: `notProposed` trong
> `hidden_files/round55-l2-keys.json` — "Nội dung template/sample
> (lib/templates.ts, lib/sample*.ts, lib/sampleMedia.ts): DATA-content
> (643 literal) — cần thiết kế localize nội dung riêng, không dùng t()."

## 1. Vì sao không dùng `t()` trực tiếp

`lib/templates.ts` (50 template, auto-gen từ `assets/templates/*.json`),
`src/sample.ts`, `src/sample-nested.ts`, `lib/sampleMedia.ts` chứa **dữ liệu**,
không phải chuỗi giao diện: tên/mô tả template, placeholder default, text
clip mẫu, tên file media mẫu. Đưa chúng vào `t()` sẽ:

- trộn dữ liệu người dùng (nội dung project sau khi tạo) với chuỗi UI;
- bắt `templates.ts` (file auto-gen — "đừng sửa tay") phụ thuộc vào i18n;
- dịch lén nội dung mà người dùng sẽ export thành video.

Vì vậy DATA-content được localize bằng **bảng song ngữ riêng**, tách khỏi
`vi.json`/`en.json`.

## 2. Phân loại và quyết định

### (a) Tên + mô tả template trong CATALOG — LOCALIZE ĐƯỢC (làm trong luồng này)

- Đây là **nhãn hiển thị** trong TemplatePicker (gallery 50 template) và
  TemplatePackModal (6 pack tuyển). Người dùng đọc để chọn mẫu, không phải
  nội dung họ sở hữu.
- Bảng song ngữ: `apps/web/src/i18n/fragments/round56-m7.json` — 100 key vi
  + 100 key en cho 50 template (6 pack + 44 còn lại), key dạng
  `templatePack.<id>.name` / `templatePack.<id>.description`. Giá trị vi
  được trích **bằng máy** từ `templates.ts` (script `/tmp/m7_gen_fragment.py`,
  không chép tay); en dịch tay trong cùng script, fail nếu thiếu key.
- Fragment nằm riêng, KHÔNG sửa `vi.json`/`en.json` trực tiếp (nhiều luồng
  đợt 56 song song; parent gộp vào dict ở cuối đợt). Key đã tương thích
  `t()` nên việc gộp là cơ học.
- Helper: `apps/web/src/lib/templateContentLocale.ts` — `localizeTemplateMeta`,
  `localizeTemplate`, `getLocalizedPacks`, `packDisplayName`,
  `packDisplayDescription`. Ngữ nghĩa fallback mirror đúng `t()`:
  **ngôn ngữ hiện tại (`getLang()`) → `vi` → giá trị gốc trong
  `templates.ts`**. Helper chỉ trả **bản sao** — không bao giờ sửa `TEMPLATES`.

### (b) Nội dung mẫu BÊN TRONG project — GIỮ NGUYÊN (không localize)

- Placeholder `default` (vd "ĐÊM PHỐ", "Chúc mừng sinh nhật Linh!"),
  text clip trong spec, track `label`, `spec.meta.name`, nội dung project
  mẫu `src/sample.ts` ("Dự án mẫu", "Xin chào! Đây là VCut Studio",
  "CLIP MẪU 01/02"), demo nested `src/sample-nested.ts`.
- Lý do: sau khi tạo project, đó là **dữ liệu của người dùng**; dịch lén
  sẽ đổi nội dung video họ export mà họ không hay biết. Muốn bản en thì
  người dùng tự sửa text (hoặc một tính năng "dịch nội dung project" riêng
  trong tương lai, có xác nhận rõ ràng — ngoài phạm vi luồng này).
- Bằng chứng code (quyết định điểm nối): `applyTemplateValues`
  (`lib/templateEngine.ts`) đặt tên project bằng
  `` `${tpl.template.name} — ${finalSpec.meta.name}` `` — tức tên project
  sinh ra bắt nguồn từ `tpl.template.name`. Nếu truyền bản template đã
  localize vào `create()` thì tên project sẽ thành tiếng Anh theo. Vì vậy
  **điểm nối chỉ thay 2 node text hiển thị, không thay `tpl` truyền vào
  `create()`** (xem §4).

### (c) Tên file media mẫu — KHÔNG ĐỔI

- `mau-1.webm`, `mau-2.webm`, `pack-<id>-<placeholder>-<suffix>.webm/.png`:
  tên file là **định danh**, `src` trong spec trỏ đúng tên đó — đổi tên là
  vỡ liên kết (đã có tiền lệ: hậu tố duy nhất chống importFiles đổi tên,
  xem header `lib/templatePack.ts`).
- Nhãn vẽ trong canvas (`drawPackFrame` trong `lib/sampleMedia.ts`,
  label = tên template uppercase + dòng "VCut Studio · media mẫu tự sinh"):
  đó là **pixel đã render**, không phải chuỗi UI — đổi nhãn đồng nghĩa sinh
  lại media. Giữ nguyên tiếng Việt trong đợt này (ghi nhận là nợ, xem §5).

## 3. Phạm vi luồng này (đã làm)

- 6 pack tuyển đã localize + kiểm chứng: `title-card`, `youtube-intro`,
  `birthday-card`, `app-launch`, `travel-vlog-intro`, `sale-countdown`.
- Bảng song ngữ phủ thêm 44 template còn lại (tổng 50) để TemplatePicker
  dùng chung một helper sau này, không cần file dữ liệu mới.
- Test khóa: vi→en đổi thật, fallback vi, không đột biến dữ liệu gốc,
  `resolvePackSpec` 6/6 pack OK (xem LIMITS).

## 4. Điểm nối UI (cho parent / luồng sở hữu component)

**TemplatePackModal** (`components/onboarding/TemplatePackModal.tsx`, dòng
158/160 — do luồng khác sở hữu trong đợt này, M7 KHÔNG sửa):

```tsx
import { localizeTemplateMeta } from "../../lib/templateContentLocale";
// trong map packs:
const meta = localizeTemplateMeta(tpl); // chỉ để HIỂN THỊ
<b>🎬 {meta.name}</b>
<p className="muted small">
  {meta.description} · {aspectLabel(tpl.template.aspect)} · {tpl.template.durationSec}s
</p>
// create(tpl) vẫn nhận tpl GỐC — không truyền bản localize.
```

Component đã gọi `useLang()` nên re-render khi đổi ngôn ngữ; không cần
thay đổi gì thêm.

**TemplatePicker** (`components/TemplatePicker.tsx`, gallery + form header):

```tsx
import { localizeTemplateMeta } from "../lib/templateContentLocale";
// gallery: const meta = localizeTemplateMeta(t); dùng meta.name/meta.description
// thay t.template.name/t.template.description ở title + 2 span.
// form bước 2: const meta = localizeTemplateMeta(selected); dùng meta.name/meta.description
// ở <h3> và <p className="muted">. Placeholder label/default KHÔNG đổi (nhóm (b)).
```

## 5. Chưa làm / nợ mở

1. Placeholder `label` + `default` text (50 template × ~3 placeholder):
   cần quyết định riêng — `label` là nhãn form (gần với UI, localize được),
   `default` là nội dung mẫu (nhóm (b), giữ nguyên). Chưa tách 2 loại này.
2. Track `label` trong spec ("Video 1", "Chữ 1", "Bìa", "Tên album"...):
   là tên track hiển thị trong Timeline — có thể localize ở tầng hiển thị
   sau, nhưng `label` cũng nằm trong spec đã lưu nên cần thiết kế riêng.
3. Nhãn canvas trong media mẫu (`sampleMedia.ts`, `sample.ts`):
   pixel tiếng Việt, xem §2(c).
4. Nội dung project mẫu + demo nested: giữ vi theo §2(b); nếu muốn project
   mẫu tiếng Anh thì cần cơ chế "tạo project mẫu theo ngôn ngữ hiện tại"
   riêng, không phải dịch chuỗi.
5. Fragment chưa gộp vào `vi.json`/`en.json` — parent gộp cuối đợt 56.
   Nếu `templates.ts` regenerate (thêm/sửa template), phải chạy lại script
   gen fragment, nếu không vi trong fragment lệch với gốc (test khóa parity
   50/50 sẽ đỏ).
6. Bản dịch en do một người dịch tay, chưa review bởi người bản ngữ;
   vài tên giữ nguyên dạng gốc có chủ đích (vd "Teaser concert" → "Concert
   Teaser", "Bảng tên (Lower Third)" → "Lower Third").
