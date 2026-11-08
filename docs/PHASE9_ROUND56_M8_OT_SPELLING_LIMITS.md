# PHASE9_ROUND56_M8_OT_SPELLING_LIMITS.md — Đợt 56, luồng M8: ot() + chính tả Hủy/Huỷ

Nhiệm vụ: (1) chuyển literal song ngữ của `ot()` trong `lib/onboardingCopy.ts`
sang fragment riêng; (2) thống nhất chính tả "Hủy" vs "Huỷ" trong chuỗi UI.
KHÔNG push, KHÔNG tag/release, KHÔNG binary trong batch.

## 1. ot() merge — ĐÃ XONG (45 literal, không phải 43)

- **Đính chính số đếm:** nhiệm vụ ghi 43 theo audit đợt 55 L2, nhưng đếm thật
  trong `onboardingCopy.ts` là **45 key** (welcome 14 + tour 16 + pack 15),
  VI và EN khớp nhau 45/45. Test mới khóa con số 45.
- **Fragment mới:** `apps/web/src/i18n/fragments/round56-m8.json`
  (`{"vi": {...}, "en": {...}}`, nhóm `welcome`/`tour`/`pack` lồng nhau như
  `vi.json`/`en.json`). Sinh bằng script parse trực tiếp từ `onboardingCopy.ts`
  cũ rồi verify round-trip từng giá trị (không gõ tay lại) — sha256 fragment
  `5ba76ada9043e53bf63a8a75f8ff9bbb0c278c3b402ddc33e39ac4f19fd94eea`.
- **Không sửa `vi.json`/`en.json` trực tiếp** (luồng khác sở hữu), đúng luật.
- **`lib/onboardingCopy.ts` viết lại:** bỏ 2 dict VI/EN, chỉ còn `ot()` đọc
  fragment bằng lookup dotted-path (cùng cơ chế như `t()` trong `i18n/index.ts`).
- **Caller KHÔNG sửa:** `WelcomeModal`, `TourCard`, `TemplatePackModal` giữ
  nguyên `ot("...")` — 0 file caller bị đụng.
- **Không trùng nhóm với luồng khác:** `welcome`/`tour`/`pack` không trùng với
  bất kỳ fragment round-56 nào khác trên đĩa lúc kiểm tra (m1, m2, m3, m4, m7).

### Vì sao `ot()` KHÔNG phải wrapper mỏng trên `t()`

Nhiệm vụ ưu tiên `ot()` thành wrapper trên `t()`, nhưng điều đó đòi sửa
`i18n/index.ts` (để `t()` biết fragment) hoặc `vi.json`/`en.json` — cả 3 đều
nằm ngoài phạm vi luồng này ("file khác CHỈ đọc, không sửa"). `ot()` hiện đọc
thẳng fragment, giữ nguyên API + ngữ nghĩa (ngôn ngữ hiện tại → `vi` → key).
**Việc parent gộp:** copy 3 nhóm `welcome`/`tour`/`pack` từ fragment vào
`vi.json`/`en.json`, rồi đổi `ot()` thành bí danh của `t()`
(`export const ot = t;` — caller vẫn không phải sửa). Sau đó fragment
`round56-m8.json` và test `onboardingOt56M8.test.ts` có thể giữ (vô hại) hoặc
xoá khi dọn dẹp.

## 2. Chính tả Hủy/Huỷ — chuẩn "Huỷ", đã sửa 0 / còn chờ 7

- **Căn cứ chuẩn:** `common.cancel` trong `vi.json:8` đang dùng **"Huỷ"** (ỷ) —
  đây là key chung, lâu đời nhất, nên lấy làm chuẩn cho toàn app.
  (Chính tả "huỷ" với ỷ cũng là dạng chuẩn trong tiếng Việt.)
- **Trong `lib/onboardingCopy.ts`: 0 chỗ** có Hủy/Huỷ — không có gì để sửa
  trong file của luồng này.
- **Còn chờ parent sửa ở bước gộp — 7 chuỗi UI (đều ngoài phạm vi M8):**

  | # | Vị trí | Hiện tại (sai) | Đúng |
  |---|--------|----------------|------|
  | 1 | `apps/web/src/i18n/vi.json:511` — `bgremove.cancel` | "Hủy" | "Huỷ" |
  | 2 | `apps/web/src/i18n/vi.json:515` — `bgremove.aborted` | "Đã hủy." | "Đã huỷ." |
  | 3 | `apps/web/src/i18n/vi.json:1041` — `projectMenu.renameCancel` | "Hủy" | "Huỷ" |
  | 4 | `apps/web/src/i18n/vi.json:1073` — `nativeFiles.exportCancelled` | "Đã hủy xuất video (chưa chọn thư mục đích)." | "Đã huỷ xuất video (chưa chọn thư mục đích)." |
  | 5 | `apps/web/src/components/ExportPanel.tsx:908` (literal cứng) | "Đã hủy render." | "Đã huỷ render." |
  | 6 | `apps/web/src/components/CaptionModal.tsx:235` (literal cứng, `setError`) | "Đã hủy tạo phụ đề." | "Đã huỷ tạo phụ đề." |
  | 7 | `apps/web/src/components/SilenceModal.tsx:149` (literal cứng, `setError`) | "Đã hủy phân tích khoảng lặng." | "Đã huỷ phân tích khoảng lặng." |

  Lý do không sửa trực tiếp: `vi.json` do luồng wiring round-56 sở hữu;
  3 file `.tsx` là file chung lớn, rất có thể luồng i18n khác đang sửa trong
  cùng đợt — sửa lén sẽ gây xung đột khi gộp. Parent sửa 7 chỗ này ở bước gộp.
- **Lưu ý test đi kèm:** `lib/i18nAudit55L2.test.ts:122-123` khóa cứng giá trị
  hiện tại (`"common.cancel": ["Huỷ", ...]`, `"bgremove.cancel": ["Hủy", ...]`)
  và nhiều assert render/source nhắc "Hủy"/"Huỷ" — sau khi sửa #1 thì test L2
  phải cập nhật expected dict tương ứng (không thì test đỏ).
- **Ngoài phạm vi (comment, không phải chuỗi UI — chỉ ghi nhận, không đếm):**
  "Hủy"/"hủy" xuất hiện trong comment ở `ProjectMenu.tsx:117`,
  `RenameProjectDialog.tsx:15`, `nativeFiles.ts:87`, `captionFollow.ts:564,604`,
  `gopRangeFetch39T3.ts:568`, `gopSizeProbe41W4.ts:74`,
  `reverseFileCancel37T5.test.ts:1`, `desktopSaveAs53J4.test.ts:174-182` và
  hàng chục comment "hủy" thường khác; "phá hủy" vs "phá huỷ" cũng lẫn nhau
  trong comment (`nestUtils.ts:742,1228` dùng "phá hủy",
  `captionFollow.ts:29` dùng "phá huỷ"). Comment không hiện lên UI nên M8
  không đụng; parent muốn thống nhất thì sửa riêng một đợt.
- **Không còn sót chuỗi UI nào khác:** grep toàn `apps/web/src`
  (`.ts`/`.tsx`/`.json`/`.md`/`.css`) chỉ ra đúng 7 chỗ trên + `common.cancel`
  đã đúng chuẩn. `en.json` không có vấn đề (dùng "Cancel").

## 3. Script parity i18n — còn đúng, nhưng parent gộp phải cập nhật số đếm

- 3 test khóa **số tuyệt đối 1011 key mỗi bên** trong `vi.json`/`en.json`:
  `lib/reversePlaybackI18n49E2.test.ts:81-82` (E2),
  `lib/reverseCompat44Z6.test.ts:95-96` (Z6),
  `components/project/ProjectMenu.i18n55L1.test.ts:181-182` (L1).
  M8 không sửa `vi.json`/`en.json` nên 3 test này vẫn xanh (đã chạy lại, xem §4).
  **Khi parent gộp fragment (+45 key mỗi bên, nếu chỉ gộp M8 → 1056; cộng thêm
  các fragment luồng khác cùng đợt thì số còn lớn hơn), phải cập nhật cả 3 con
  số tuyệt đối này theo tổng thực tế** — đúng như comment trong chính các test
  đó đã dặn ("parent gộp cập nhật lại số này theo tổng thực tế").
- `lib/i18nAudit55L2.test.ts` chỉ khóa parity vi==en (không assert tổng cố
  định) nên không cần sửa vì lý do này — chỉ cần sửa expected dict ở §2 nếu
  đổi `bgremove.cancel`.

## 4. Kiểm chứng (số thật, chạy từ gốc repo)

- **Test mới** `lib/onboardingOt56M8.test.ts` — **7/7 pass** (exit 0):
  fragment 45/45 key, ot() đúng từng chữ cả 45 key × 2 ngôn ngữ, spot-check
  khóa cứng 9 chuỗi, fallback key lạ, render thật 3 caller bằng
  `react-dom/server` cả vi lẫn en. Lệnh (bắt buộc `--format=cjs`):
  `./node_modules/.bin/esbuild apps/web/src/lib/onboardingOt56M8.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round56-m8/m8.test.cjs && node /tmp/round56-m8/m8.test.cjs`
- **Đỏ-trước:** sửa tạm 1 giá trị fragment (`welcome.later` vi → "SAI TAM"),
  test rớt **5/7** (exit 1) ở đúng 2 test spot-check + render VI; khôi phục
  file (sha256 khớp lại `5ba76ada…`) rồi chạy lại **7/7** (exit 0).
- **`tsc --noEmit` (apps/web): exit 0, 0 lỗi** ở lần chạy cuối. Lưu ý giữa đợt
  có 2 lần tsc báo lỗi ở file luồng khác đang sửa dở (`TemplatePicker.tsx`,
  `Toasts.tsx`, `i18nAudit56M3.test.ts`) — luồng đó tự sửa xong trước lần chạy
  cuối; 0 lỗi nào thuộc file M8.
- **`vite build`: pass, 6.55s** (`dist/assets/index-CrbP7Zj6.js` 1,172.94 kB,
  gzip 352.07 kB; chỉ cảnh báo chunk > 500 kB có từ trước).
- **Parity chạy lại (không regression):** E2 3/3, Z6 10/10, L1 6/6, L2 20/20.
- **Sự cố môi trường:** service restart giữa lúc chạy 4 test parity (lệnh đầu
  chưa hoàn tất, `/tmp` bị xoá); đã chạy lại từng test riêng, đủ 4/4 xanh.
  File trong repo nguyên vẹn (fragment sha256 đã verify).

## 5. Stage (KHÔNG push)

- File stage: `~/workspace/repo-1-push/paths-loop/phase9-round56-m8-ot-spelling.txt`
  — **4 entry**, NUL-delimited, verify read-back, toàn text:
  1. `apps/web/src/lib/onboardingCopy.ts` (viết lại, 1791 byte)
  2. `apps/web/src/i18n/fragments/round56-m8.json` (mới, 45 key × 2 ngôn ngữ)
  3. `apps/web/src/lib/onboardingOt56M8.test.ts` (mới, 7 test)
  4. `docs/PHASE9_ROUND56_M8_OT_SPELLING_LIMITS.md` (file này)
- Tổng chờ push: 404 entry sau đợt 55 + đợt 56 đã stage (M3 9 entry + M8 4
  file; các luồng đợt 56 khác có thể stage thêm sau).

## 6. Nợ mở / việc parent gộp

1. Copy 3 nhóm `welcome`/`tour`/`pack` từ `round56-m8.json` vào `vi.json`/
   `en.json`; đổi `ot()` thành bí danh `t()`; dọn fragment/test nếu muốn.
2. Cập nhật số đếm tuyệt đối 1011 → tổng mới trong 3 test E2/Z6/L1.
3. Sửa 7 chỗ chính tả §2 (4 key `vi.json` + 3 literal `.tsx`) + cập nhật
   expected dict trong test L2 (`i18nAudit55L2.test.ts:122-123`).
4. `ot()` hiện không qua `t()` nên các chuỗi onboarding không nằm trong
   parity vi/en toàn file của Z6/E2 — sau khi gộp vào `vi.json`/`en.json` thì
   chúng mới được khóa parity chung.
