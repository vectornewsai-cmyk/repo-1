# LIMITS — Phase 9 đợt 57, luồng N5: review EN template + tách placeholder label/default

> Follow-up M7 theo LIMITS đợt 56 §4.8 + DESIGN §5 của
> `docs/PHASE9_ROUND56_M7_DATA_CONTENT_LIMITS.md` và
> `docs/DATA_CONTENT_I18N_DESIGN.md`.
> Không sửa `vi.json`/`en.json` (quy định đợt 56/57: fragment riêng, parent
> gộp cuối đợt). Không sửa `round56-m7.json`. Không đụng
> `TemplatePackModal` / `TemplatePicker` (file luồng khác / đã nối đợt 56).

## 1. Phạm vi đã làm (thật)

### (a) Review toàn bộ 100 giá trị EN đợt 56 — sửa 5, giữ 95

Rà soát từng cặp VI→EN (đối chiếu nghĩa với giá trị VI gốc trong
`templates.ts`, không chỉ đọc EN một mình). Kết quả: 95/100 giá trị giữ
nguyên; 5 giá trị sửa, nằm trong fragment MỚI
`apps/web/src/i18n/fragments/round57-n5.json` (key trùng M7, merge ĐÈ lên
khi helper load — xem §2). Test khóa cả 2 chiều: 5 giá trị mới đúng chuỗi
kỳ vọng, 95 giá trị còn lại byte-identical với M7.

| Key | EN cũ (M7) | EN mới (N5) | Lý do |
|---|---|---|---|
| `templatePack.audiobook-promo.name` | Audiobook Ad | **Audiobook Promo** | Thống nhất thuật ngữ: id `*-promo` → "Promo" (cf. `fitness-promo` → "Gym Promo"); "Ad" lẻ loi trong khi mọi promo khác đều dùng "Promo". |
| `templatePack.charity-appeal.description` | …field footage + message + account number. | …field footage + message + **bank account number**. | Chính xác nghĩa: "số tài khoản" trong ngữ cảnh kêu gọi từ thiện là tài khoản ngân hàng; "account number" đứng một mình mơ hồ (có thể hiểu là số tài khoản nền tảng). |
| `templatePack.tutorial-vertical.description` | Vertical 3-step tutorial: one scene + one step label each. | Vertical 3-step tutorial: **one scene and step text per step**. | Ngữ pháp/không tự nhiên: "one step label each" lủng củng; VI gốc "mỗi bước 1 cảnh + chữ bước" = mỗi bước có 1 cảnh và 1 đoạn chữ. |
| `templatePack.unboxing.name` | Unboxing | **Product Unboxing** | Sát nghĩa gốc "Mở hộp sản phẩm": "Unboxing" đơn lẻ mất thành tố "sản phẩm"; tên template khác đều giữ đủ thành tố (vd "Product Showcase"). |
| `templatePack.webinar-invite.description` | Landscape video inviting viewers to an online seminar: speaker + topic + time. | Landscape video inviting viewers to a **webinar**: speaker + topic + time. | Thuật ngữ chuẩn: "webinar" chính là "hội thảo trực tuyến"; "online seminar" là cách giải nghĩa dài dòng, không phải tên gọi sản phẩm. |

Quy tắc thuật ngữ đã áp khi review (ghi lại để đợt sau khỏi lệch):
`Video ngang` → "Landscape", `Video dọc` → "Vertical", `Video vuông` →
"Square"; `nổi bật` → "featured" (giữ nhất quán ở cả `podcast-highlight`
"a featured quote" và `gaming-highlight` "featured score" — KHÔNG sửa
"featured score" thành "standout score" vì sẽ phá nhất quán này);
`kêu gọi*` → "call to action"; `tên X` → "X name"; `teaser` giữ nguyên
không dịch.

KHÔNG sửa (đã cân nhắc, giữ nguyên có chủ đích):
- 6 pack trong test M7 (`title-card`, `youtube-intro`, `birthday-card`,
  `app-launch`, `travel-vlog-intro`, `sale-countdown`): EN đã đúng, test
  M7 cũ khóa cứng — không đụng để test cũ 10/10 không cần sửa.
- `gym-transformation.description` "weight lost": VI "số kg" mơ hồ (kg
  giảm hay số kg hiện tại) nhưng trong ngữ cảnh video before/after gym thì
  "weight lost" là cách đọc hợp lý nhất; ghi nhận là phán đoán, không phải
  lỗi dịch.
- `lower-third.name` "Lower Third" (bỏ "Bảng tên"): giữ theo quyết định
  có chủ đích của M7 (DESIGN §5 mục 6).

### (b) Tách placeholder `label` / `default` — QUYẾT ĐỊNH của N5

Vấn đề (DESIGN §5 mục 1): 50 template × ~3 placeholder, mỗi placeholder
có 2 field dễ nhầm: `label` và `default`. Quyết định, căn cứ bằng chứng
code thật trong `TemplatePicker.tsx` bước 2 (dòng 98–114):

- `label` render thành `<span>{kindLabel(p.kind)} — {p.label}</span>`:
  **nhãn form** — chuỗi UI người dùng đọc để điền form → **LOCALIZE
  ĐƯỢC**. Bảng trong fragment N5, key
  `templatePack.<id>.placeholder.<pid>.label`, **180 key** (50 template,
  vi trích bằng máy từ `templates.ts`, en dịch tay; script gen fail nếu
  thiếu bản dịch). Key theo từng template (không dùng chung key theo
  chuỗi label) vì cùng một chuỗi VI có thể cần EN khác theo ngữ cảnh
  (vd "Tên" → "Name" hay "Title" tùy template).
- `default` dùng làm `placeholder={p.default}` của input text và option
  mặc định của select media — tức **nội dung mẫu chảy vào video export**
  qua `applyTemplateValues` (khi user để trống) → **GIỮ NGUYÊN tiếng
  Việt**, helper không bao giờ đụng `default` (test khóa 180/180
  `default` không đổi sau localize en).

API mới trong `apps/web/src/lib/templateContentLocale.ts` (helper cũ
không đổi hành vi):
- `localizePlaceholderLabel(tpl, p, lang?, table?)` — nhãn form 1
  placeholder; fallback en → vi → `label` gốc (mirror `t()`).
- `localizeTemplatePlaceholders(tpl, lang?, table?)` — bản SAO template
  chỉ đổi `label` của placeholder; `default`, `kind`, `id`,
  `template.name`/`description`, `spec` giữ nguyên.
- `LOCALIZED_PLACEHOLDER_COUNT` = 180.
- Helper merge fragment N5 ĐÈ lên M7:
  `TABLE = { vi: {...m7.vi, ...n5.vi}, en: {...m7.en, ...n5.en} }`.
  N5.vi chỉ có key `.label` mới nên không đè key M7 nào; N5.en đè đúng
  5 key đã sửa. `LOCALIZED_TEMPLATE_COUNT` đổi cách tính (đếm key
  `.name` trong M7) vì `TABLE.vi` giờ có thêm 180 key `.label` — không
  còn tính bằng `length / 2` được nữa.

## 2. Kiểm chứng (lệnh + kết quả thật)

- Test mới `apps/web/src/lib/templateContentLocale57N5.test.ts` — chạy
  bằng esbuild bundle (mẫu M7, `--format=cjs`, bundle ra `/tmp/round57-n5/`):
  `./node_modules/.bin/esbuild apps/web/src/lib/templateContentLocale57N5.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round57-n5/n5.test.cjs && node /tmp/round57-n5/n5.test.cjs`
  → **9 pass, 0 fail**. Bao gồm: fragment N5 180 vi + 185 en (180 label
  + 5 override); vi label == gốc `templates.ts` 180/180; 5 EN sửa đúng
  chuỗi kỳ vọng và khác M7; 95 EN còn lại byte-identical với M7; nhãn
  placeholder en đúng fragment toàn bộ 50 template + khóa cứng mẫu
  (album-cover, birthday-card, tiktok-viral, gaming-highlight,
  tutorial-vertical, real-estate-tour, charity-appeal, lofi-visual,
  podcast-highlight); `default` 180/180 không đổi + `kind`/`id`/
  tên/mô tả không đổi; vi: nhãn = gốc; fallback thiếu key en → vi,
  thiếu cả vi → label gốc, placeholder lạ → label truyền vào,
  `getLang()` mặc định; `TEMPLATES` không đột biến.
  (Lần chạy đầu test đỏ 1 case do test đoán sai 2 placeholder id
  (`gaming-highlight.pha1/pha2`, `real-estate-tour.kitchen`) — đối chiếu
  lại `templates.ts` thấy id thật là `clip1/clip2` và `room3`, sửa TEST
  cho đúng dữ liệu thật, chạy lại 9/9 — không sửa code sản phẩm.)
- Test M7 cũ `templateContentLocale56M7.test.ts` chạy lại — **10 pass,
  0 fail**, không sửa test cũ (6 pack EN không đổi nên kỳ vọng cứng vẫn
  đúng; helper merge N5 không làm lệch hành vi M7).
- `tsc --noEmit` trong `apps/web`: **3 lỗi, tất cả ở
  `src/lib/loadReport57N7.test.ts` — file của luồng N7 khác** (import
  `SpeedCurveWarning` không export + 2 lỗi `.ts` extension
  TS5097). File của N5 (`templateContentLocale.ts`,
  `templateContentLocale57N5.test.ts`, fragment JSON) **không có lỗi
  nào**. N5 không sửa file N7.
- `vite build` trong `apps/web`: **pass, 6.38s** (chunk >500kB warning
  có sẵn, không liên quan).

## 3. Điểm nối UI (cho parent / luồng sở hữu TemplatePicker)

`TemplatePicker.tsx` bước 2 (form điền placeholder, dòng ~98–114) — N5
KHÔNG sửa file này. Để hiển thị nhãn form tiếng Anh, luồng sở hữu chỉ
cần đổi 1 chỗ, giữ nguyên mọi thứ khác:

```tsx
import { localizeTemplateMeta, localizeTemplatePlaceholders } from "../lib/templateContentLocale";
// trong nhánh `if (selected)`:
const meta = localizeTemplateMeta(selected); // đã có từ M7
const displayTpl = localizeTemplatePlaceholders(selected); // MỚI (N5) — chỉ để HIỂN THỊ nhãn
// ... {displayTpl.template.placeholders.map((p) => ( ... {kindLabel(p.kind)} — {p.label} ... ))}
```

BẮT BUỘC giữ: `values`/`apply()` vẫn nhận `tpl` GỐC (`selected`) và
`p.default` gốc — truyền bản đã localize vào `applyTemplateValues`
sẽ làm `default` (nội dung mẫu) bị thay bằng nhãn đã dịch nếu code
sau này vô tình dùng `p.label` làm giá trị. `spec.meta.name` sinh ra
vẫn bắt nguồn từ tên VI gốc như M7 đã khóa.

## 4. Chưa review / nợ mở

- **Bản dịch EN vẫn chưa qua người bản ngữ**: đợt 56 một người dịch,
  đợt 57 một người khác review (N5) — đã là cặp mắt thứ hai nhưng vẫn
  không phải native speaker; các phán đoán mơ hồ đã ghi ở §1 (đặc biệt
  "weight lost" ở `gym-transformation` và "Persistent caption" cho
  "Chú thích chạy suốt" ở `tiktok-viral` — nhãn này là handle
  `@kenhcuaban` hiện suốt video, không phải caption chạy ngang).
- **Fragment M7 CHƯA gộp vào `vi.json`/`en.json`**: kiểm tra thật trên
  đĩa lúc làm N5 — `grep -c "templatePack\." vi.json en.json` đều = 0
  (trái với tiền đề task rằng đợt 56 đã gộp). Parent khi gộp cần gộp cả
  2 fragment: (1) toàn bộ M7 (100 key), (2) N5: 5 key en ĐÈ lên giá trị
  M7 tương ứng + 180 key `.label` mới (cả vi lẫn en). Hướng dẫn gộp đã
  ghi trong `meta.merge` của fragment N5. Nếu chỉ gộp M7 mà quên N5 thì
  5 lỗi EN cũ vẫn hiện trên UI; nếu gộp N5 mà quên M7 thì thiếu 100 key
  tên/mô tả.
- Nếu `templates.ts` regenerate (thêm/sửa placeholder), phải chạy lại
  script gen (`/tmp/round57-n5-gen.py`, không stage — scratch ngoài
  repo, xem M7) nếu không vi label trong fragment lệch với gốc — test
  parity 180/180 sẽ đỏ (đã khóa).
- Track `label` trong spec (DESIGN §5 mục 2, vd "Video 1", "Chữ 1",
  "Bìa"): KHÔNG làm trong đợt này — nó nằm trong spec đã lưu nên cần
  thiết kế riêng (localize ở tầng hiển thị Timeline hay giữ nguyên).
- Nhãn canvas trong media mẫu + nội dung project mẫu: giữ VI theo
  DESIGN §2(b)(c), không đổi.
- Chưa có click-test browser thật cho form placeholder tiếng Anh
  (chỉ khóa ở tầng data/helper, như M7).

## 5. Stage (KHÔNG push)

- File stage: `~/workspace/repo-1-push/paths-loop/phase9-round57-n5-template-en.txt`
  — 4 entry, NUL-delimited, verify read-back:
  - `apps/web/src/i18n/fragments/round57-n5.json` (mới, 180 vi + 185 en)
  - `apps/web/src/lib/templateContentLocale.ts` (sửa: merge N5 + API placeholder)
  - `apps/web/src/lib/templateContentLocale57N5.test.ts` (mới, 9 test)
  - `docs/PHASE9_ROUND57_N5_TEMPLATE_EN_LIMITS.md` (mới, file này)
- `docs/DATA_CONTENT_I18N_DESIGN.md` KHÔNG sửa và KHÔNG stage: thiết kế
  §5 vẫn đúng nguyên văn, N5 chỉ thực thi quyết định mục 1 của nó; ghi
  nhận ở đây để parent khỏi nhầm là quên cập nhật.
- `round56-m7.json` KHÔNG sửa, `vi.json`/`en.json` KHÔNG sửa.
