# PHASE9_ROUND57_N2_HISTORY_DATE_LIMITS.md

Phase 9 đợt 57, luồng N2 — sửa nợ LIMITS đợt 56 §4.2: HistoryPanel hardcode
ngày kiểu Việt Nam.

## Việc làm

`apps/web/src/components/project/HistoryPanel.tsx` — `fmtTime()` trước đây
dùng `toLocaleDateString("vi-VN")` + `toLocaleTimeString("vi-VN", ...)` cố
định, nên ở ngôn ngữ EN vẫn hiện ngày kiểu VN ("7/11/2026 06:37") cả trong
row bảng lẫn dialog confirm xoá version (và cả toast sau khôi phục, cùng
dùng `fmtTime`).

Nay `fmtTime()` lấy locale từ `getLang()` — đúng pattern đã có sẵn trong
codebase (`apps/web/src/components/project/ProjectMenu.tsx`, autosave:
`getLang() === "vi" ? "vi-VN" : "en-US"`), không chế cơ chế mới. Một hàm
duy nhất phục vụ cả 3 chỗ: row bảng, dialog confirm xoá (`history.deleteConfirm`),
toast khôi phục (`history.restored`). `fmtTime` được export để test import
trực tiếp. Mọi key i18n `history.*` đã nối đợt 56 giữ nguyên, không sửa.

## Locale đã chọn cho en và vì sao

- **en → `en-US`** (không phải `en-GB`): theo đúng tiền lệ duy nhất trong
  codebase — ProjectMenu autosave đã dùng `en-US`. Thống nhất một locale
  cho toàn app, và khớp icon 🇺🇸 ở nút đổi ngôn ngữ trong TopBar.
- **Tháng viết tắt, không dùng dạng số:** `toLocaleDateString(locale,
  { year: "numeric", month: "short", day: "numeric" })` → vi:
  "7 thg 11, 2026", en: "Nov 7, 2026". Dạng số mặc định gây nhầm lẫn
  ngày/tháng chính là lỗi gốc của nợ này: cùng ngày 7/11/2026 thì vi-VN
  cho "7/11/2026" còn en-US cho "11/7/2026" — đọc ngược nhau. Tháng viết
  chữ thì không thể nhầm ở cả hai ngôn ngữ.
- Giờ giữ `{ hour: "2-digit", minute: "2-digit" }` như cũ: vi "06:37",
  en "06:37 AM" (12 giờ, chuẩn en-US).

## Fragment rỗng có chủ đích

`apps/web/src/i18n/fragments/round57-n2.json` là `{"vi": {}, "en": {}}` —
không có key i18n mới vì định dạng ngày/giờ không chứa literal text nào;
mọi chuỗi trong panel đã có trong `vi.json`/`en.json` từ đợt 56. Không
sửa `vi.json`/`en.json` trực tiếp (theo luật đợt). Test khóa điều này:
fragment hợp lệ, parity vi/en, 0 key mới.

## Kiểm chứng thật

- Test mới `apps/web/src/lib/historyDate57N2.test.ts`, chạy bằng esbuild
  bundle `--format=cjs` (mẫu `i18nAudit56M2.test.ts`), **8/8 pass**:
  format vi/en cho 7/11/2026 và 5/1/2026 (hai ngày dễ nhầm ngày/tháng),
  đổi ngôn ngữ qua lại bám theo `getLang()`, source không còn hardcode
  `vi-VN`, cả 3 chỗ dùng chung `fmtTime`, giữ nguyên key `history.*`,
  fragment rỗng có chủ đích.
- `tsc --noEmit` apps/web: **0 lỗi**.
- `vite build` apps/web: **pass** (229 modules, built in 5.70s; cảnh báo
  chunk > 500 kB và dynamic-import userLut đã có từ trước, không liên
  quan đợt này).

## Chưa kiểm chứng / giới hạn

- Chưa click-test trên browser thật: chuỗi hiển thị trong panel/dialog
  mới chỉ khóa bằng unit test trên `fmtTime` + assert source (component
  cần IndexedDB/store nên không render SSR trong test Node này). Cần
  click-test thủ công: đổi sang EN, mở History panel, xem row và dialog
  xoá hiện "Nov 7, 2026".
- Định dạng tháng viết tắt phụ thuộc ICU của runtime: Node hiện tại cho
  "7 thg 11" (vi) / "Nov 7" (en); trình duyệt khác có thể viết tắt khác
  đôi chút (vd "Thg 11" hoa/thường) nhưng vẫn không nhầm ngày/tháng.
- `fmtTime` đọc `getLang()` tại thời điểm gọi; component đã có `useLang()`
  nên re-render khi đổi ngôn ngữ — dialog `window.confirm` dùng chuỗi đã
  format tại lúc bấm, không tự cập nhật nếu đổi ngôn ngữ giữa chừng (không
  thể xảy ra vì confirm là modal chặn).
- Không đụng file của luồng khác; không push, không release/tag.
