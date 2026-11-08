# LIMITS — Phase 9 đợt 56, luồng M7: localize DATA-content (template pack)

> Thiết kế đầy đủ: `docs/DATA_CONTENT_I18N_DESIGN.md`.
> Nguồn: `notProposed` trong `hidden_files/round55-l2-keys.json` (DATA-content
> 643 literal trong `lib/templates.ts` / `lib/sample*.ts` / `lib/sampleMedia.ts`
> — cần thiết kế riêng, không dùng `t()` trực tiếp).

## 1. Phạm vi đã làm (thật)

- **Bảng song ngữ** `apps/web/src/i18n/fragments/round56-m7.json` (mới):
  100 key vi + 100 key en cho **50 template** (tên + mô tả), key dạng
  `templatePack.<id>.name` / `.description`. Giá trị vi trích bằng máy từ
  `templates.ts` (script gen, không chép tay); en dịch tay.
- **Helper** `apps/web/src/lib/templateContentLocale.ts` (mới):
  `localizeTemplateMeta`, `localizeTemplate`, `getLocalizedPacks`,
  `packDisplayName`, `packDisplayDescription`. Fallback mirror `t()`:
  ngôn ngữ hiện tại (`getLang()`) → `vi` → giá trị gốc trong `templates.ts`.
  Chỉ trả bản sao, không sửa `TEMPLATES` (test khóa).
- **6 pack đã localize + kiểm chứng**: `title-card`, `youtube-intro`,
  `birthday-card`, `app-launch`, `travel-vlog-intro`, `sale-countdown`.
  44 template còn lại có sẵn trong bảng để TemplatePicker dùng chung sau.
- **Không sửa** `vi.json`/`en.json` (theo quy định đợt 56: fragment riêng,
  parent gộp cuối đợt). **Không sửa** `lib/templates.ts` (auto-gen),
  `lib/sample*.ts`, `lib/sampleMedia.ts`, `src/sample.ts`,
  `src/sample-nested.ts`, `TemplatePicker.tsx`, `TemplatePackModal.tsx`,
  `tsconfig.json`.

## 2. Kiểm chứng (lệnh + kết quả thật)

- Test mới `apps/web/src/lib/templateContentLocale56M7.test.ts` — chạy bằng
  esbuild bundle (mẫu M3, `--format=cjs`, bundle ra `/tmp/round56-m7/`):
  `./node_modules/.bin/esbuild apps/web/src/lib/templateContentLocale56M7.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round56-m7/m7.test.cjs && node /tmp/round56-m7/m7.test.cjs`
  → **10 pass, 0 fail**. Bao gồm: vi→en đổi tên+mô tả 6 pack thật (khóa cứng
  chuỗi en kỳ vọng, không mock hàm localize); fallback thiếu key en → vi,
  thiếu cả vi → gốc `templates.ts`; fragment vi == gốc `templates.ts` 50/50;
  không đột biến `TEMPLATES`; `resolvePackSpec` 6/6 pack OK, không còn
  marker `{{...}}`, `spec.meta.name` bắt nguồn từ tên vi gốc.
  (Lần chạy đầu 9/10: test kỳ vọng sai `spec.meta.name == tên template`,
  thực tế `applyTemplateValues` đặt tên project =
  `"<tên template> — <meta.name gốc>"` nên ra `"Thẻ tiêu đề — Thẻ tiêu đề"`.
  Sửa kỳ vọng test cho đúng hành vi thật, chạy lại 10/10 — không sửa code
  sản phẩm để cho test xanh.)
- `tsc --noEmit` trong `apps/web`: **0 lỗi** ở lần chạy cuối. (Lần chạy đầu
  có 2 lỗi ở `src/components/Toasts.tsx` — file do luồng khác sửa cùng lúc,
  `t` import bị shadow bởi biến map; M7 không chạm file đó và không sửa;
  lỗi đã biến mất ở lần chạy sau do luồng kia sửa. File của M7 không có
  lỗi nào trong cả 2 lần chạy.)
- `vite build` trong `apps/web`: **pass, 17.09s** (chunk >500kB warning có
  sẵn, không liên quan).

## 3. Phần DATA chưa localize (theo thiết kế, có chủ đích)

- Nội dung mẫu bên trong project: placeholder `default`, text clip, track
  `label`, `spec.meta.name`, project mẫu `src/sample.ts`, demo nested —
  GIỮ NGUYÊN tiếng Việt vì đó là dữ liệu người dùng sau khi tạo.
- Tên file media mẫu (`mau-*.webm`, `pack-*.webm/.png`) — KHÔNG đổi.
- Nhãn vẽ trong canvas media mẫu — pixel tiếng Việt, giữ nguyên đợt này.
- Placeholder `label` (nhãn form) vs `default` (nội dung mẫu) chưa tách —
  cần thread follow-up (xem DESIGN §5).

## 4. Điểm nối còn chờ parent / luồng khác (M7 KHÔNG tự nối)

- **TemplatePackModal** do luồng khác sở hữu trong đợt này: chỉ cần thay
  2 node text ở dòng 158/160 bằng `localizeTemplateMeta(tpl)` (snippet
  chính xác trong DESIGN §4); `create(tpl)` vẫn nhận `tpl` GỐC — truyền
  bản localize vào `create()` sẽ làm tên project sinh ra thành tiếng Anh
  (do `applyTemplateValues` đặt tên từ `tpl.template.name`). M7 không sửa
  file này nên **trên UI thật, tên/mô tả pack vẫn hiện tiếng Việt cho đến
  khi điểm nối được áp dụng** — helper + bảng đã sẵn, chưa có thay đổi
  nhìn thấy được trên app.
- **TemplatePicker**: chưa nối (ngoài phạm vi file được phép sửa của luồng);
  snippet trong DESIGN §4.
- Fragment chưa gộp vào `vi.json`/`en.json` — parent gộp cuối đợt 56.
- `i18n/README.md` chưa cập nhật về fragments — để parent gộp chung.

## 5. Rủi ro / nợ mở

- Nếu `templates.ts` regenerate mà không chạy lại script gen fragment, vi
  trong fragment lệch với gốc — test parity 50/50 sẽ đỏ (đã khóa).
- Bản dịch en dịch tay một người, chưa review bởi người bản ngữ.
- `buildSampleProject()` không chạy được ở Node (cần MediaRecorder/canvas)
  nên hồi quy project mẫu chỉ khóa ở tầng data (`TEMPLATES` nguyên vẹn +
  `resolvePackSpec` 6/6) — chưa có click-test browser thật cho pack sau
  khi nối UI.
- Test dùng `esbuild --format=cjs` (mẫu M3/L1/L2); không thêm vào
  `tsconfig.json` exclude — test viết không dùng `node:` import nên
  `tsc --noEmit` vẫn xanh mà không cần sửa tsconfig chung.

## 6. Stage (KHÔNG push)

- File stage: `~/workspace/repo-1-push/paths-loop/phase9-round56-m7-data-content.txt`
  — 5 entry, NUL-delimited, verify read-back:
  - `apps/web/src/i18n/fragments/round56-m7.json` (mới)
  - `apps/web/src/lib/templateContentLocale.ts` (mới)
  - `apps/web/src/lib/templateContentLocale56M7.test.ts` (mới)
  - `docs/DATA_CONTENT_I18N_DESIGN.md` (mới)
  - `docs/PHASE9_ROUND56_M7_DATA_CONTENT_LIMITS.md` (mới)
- Tổng batch đang chờ user push: 404 entry (sau đợt 55) + 5 (luồng này) =
  **409 entry** (chưa tính các luồng đợt 56 khác stage cùng lúc).
