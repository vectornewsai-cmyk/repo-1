# PHASE9_ROUND58_O8_SPELLING_LIMITS.md — Đợt 58, luồng O8: đóng nợ đợt 57 §6.8 — chính tả Hủy/Huỷ

Nhiệm vụ: đóng nợ cũ đợt 57 §6.8 — comment "Hủy"/"hủy" còn lẫn (chuẩn là
"Huỷ" theo `common.cancel`, vi.json:8 — đợt 56 M8 đã chuẩn hoá 7 chỗ chuỗi UI,
đợt 56 gộp xác nhận chuỗi UI sạch). KHÔNG push, KHÔNG tag/release, KHÔNG binary.

## 1. Phạm vi quét (số thật)

- Quét `apps/web/src` + `server` + `packages` (`.ts/.tsx/.json/.md/.css/.py/.js`,
  loại `dist`/`node_modules`/`.git`): **182 dòng match** `Hủy|hủy`.
- Trừ **37 dòng là bản copy build** (`apps/desktop/release/*`,
  `release-round55-l4/*`, `build/bundled-server/*`, `dist-web/*` — bản sao của
  `server/*` + bundle web cũ, tái sinh khi build) → **145 dòng trong phạm vi
  nguồn**, gồm **148 occurrence** (3 dòng có 2 occurrence).
- `packages/` (plugin-api, video-spec): **0 occurrence**.
- `vi.json`: 0 "Hủy"/"hủy" (đã sạch từ đợt 56); 3 "Huỷ" + 5 "huỷ" đúng chuẩn.
  `en.json`: không có vấn đề (dùng "Cancel").

## 2. Phân loại 148 occurrence

| Loại | Số | Ví dụ |
|---|---|---|
| Chuỗi UI user thấy được | **9** | §3 — sửa hết sang "Huỷ"/"huỷ" |
| Comment / JSDoc / tên test / message assert / docs nội bộ — đã sửa | **132** | §4 |
| Assertion phủ định trong test L2 — giữ "Hủy" làm mẫu cấm, có chủ đích | **6** | §3 (L2) |
| False positive — "nguyên thủy" (giữ nguyên) | **1** | §5 |
| **Tổng** | **148** | 141 đã sửa + 7 giữ có chủ đích |

### §3. Chuỗi UI — 9 chỗ, đã sửa hết sang "Huỷ"/"huỷ"

Cách đếm: script thay **135** occurrence trong 49 file; L2 sửa tay **6**
(tên test) + giữ **6** occurrence "Hủy" cũ trong các assertion phủ định
(nay cấm thêm cả "Huỷ"); 1 "thủy" giữ nguyên. 135 + 6 = 141 đã sửa;
141 + 6 + 1 = 148. Trong 141 đã sửa: chuỗi UI = **9** (fragment 3 +
modelDownloader 3 + bridge 1 + jobQueue 1 + main.ts 1); nội bộ = **132**.

| # | Vị trí | Trước | Sau |
|---|---|---|---|
| 1 | `apps/web/src/i18n/fragments/round56-m2.json:62` — `exportPanel.renderCancelled` | "Đã hủy render." | "Đã huỷ render." |
| 2 | `apps/web/src/i18n/fragments/round56-m2.json:105` — `caption.cancelled` | "Đã hủy tạo phụ đề." | "Đã huỷ tạo phụ đề." |
| 3 | `apps/web/src/i18n/fragments/round56-m2.json:147` — `silence.cancelled` | "Đã hủy phân tích khoảng lặng." | "Đã huỷ phân tích khoảng lặng." |
| 4–6 | `apps/desktop/src/services/modelDownloader.js:386,435,475` — `new Error('Đã hủy tải model.')` ×3 | "Đã hủy tải model." | "Đã huỷ tải model." |
| 7 | `server/bridge/src/index.js:1501` — lỗi API DELETE job | "không hủy được." | "không huỷ được." |
| 8 | `server/bridge/src/jobQueue.js:448` — thông báo job đã hủy | "Job đã hủy thì…" | "Job đã huỷ thì…" |
| 9 | `apps/desktop/src/main.ts:463` — lỗi cancel-model-download | "hủy trước khi tải model khác." | "huỷ trước khi tải model khác." |

- Fragment `round56-m2.json` là snapshot đã merge vào `vi.json`/`en.json`
  đợt 56 (M2 test vẫn đọc nó); giá trị trong fragment là bản sao cũ của 3
  key đã sửa trong dict đợt 56 — sửa cho khớp dict, không thêm key mới,
  không sửa `vi.json`/`en.json`.
- Không có test nào khóa 9 chuỗi lỗi này (grep `*.test.*` = 0 match) nên
  không cần cập nhật test cho chúng; không có code nào `includes`/`===`/
  `startsWith` trên các chuỗi này (đã grep).

### §4. Nội bộ — 132 chỗ, đã sửa hết

- Comment/JSDoc trong code nguồn (`preview.tsx` 9, `reverseWebcodecs.ts` 17,
  `store.ts` 7, `seek.ts` 4, `desktop.ts` 3, `preload.ts` 3, `main.ts` 2
  comment còn lại, `nativeFiles.ts`, `toast.ts`, `i18n/index.ts`,
  `media.ts`, `Timeline.tsx`, `ExportPanel.tsx`, `ProjectMenu.tsx`,
  `RenameProjectDialog.tsx`, `nestUtils.ts` 2 ("phá hủy" → "phá huỷ"),
  `captionFollow.ts` 2, `loadReport.ts`, `gopCache40V2.ts`,
  `gopRangeFetch39T3.ts`, `gopSizeProbe41W4.ts` 3, `reverseDecodeAheadToggle.ts`,
  `pauseSeekCap42X2.ts`, `desktop.ts`, `openFileQueue.ts`, bridge
  `index.js` 4 comment + `jobQueue.js` 3 comment).
- Tên test + message assert (`reverseFileCancel37T5.test.ts` 15,
  `desktopSaveAs53J4.test.ts` 8, `clipboard.test.ts` 2, `d6.test.ts` 2,
  `pause46B2.test.ts` 2, `seek.test.ts` 1, `reverseFileBuffer35R3.test.ts` 1,
  `openFileQueue.test.ts` 1).
- Docs nội bộ trong phạm vi quét: `SEEK_LIMITS.md`, `K5_LIMITS.md`
  ("phá hủy" → "phá huỷ"), `CLIPBOARD_LIMITS.md`, `D6_LIMITS.md`,
  `Q5_LIMITS.md` ("phá hủy" → "phá huỷ"), `MOTION_LIMITS.md`,
  `P7_LIMITS.md`, `EXPORT_E2E_LIMITS.md`, `BGREMOVE_LIMITS.md` 2,
  `API.md` 2, `README.md` (bridge).
- Cách sửa: script Python regex `\bHủy\b` / `\bhủy\b` (word-boundary,
  U+1EE7 → U+1EF7), kèm assert "thủy" không đổi và "thuỷ" = 0 sau sửa.

### §5. False positive — giữ nguyên

- `apps/web/src/lib/nestedPreview.ts:474` — "nguyên thủy" (primitive):
  "thủy" chứa chuỗi con "hủy" nhưng là chính tả đúng, KHÔNG sửa. Script
  xác nhận 0 thay thế ở file này (file không có trong batch).

## 3. Test L2 — cập nhật assertion (không nới lỏng, chỉ siết thêm)

File: `apps/web/src/lib/i18nAudit55L2.test.ts` (12 occurrence → sửa tay,
không qua script):

- Tên test: "Đóng/Hủy" → "Đóng/Huỷ" (6 chỗ: dòng 164, 173, 211, 287, 298, 309).
- Render EN (dòng 170, 181): giữ `!html.includes("Hủy")` và **thêm**
  `!html.includes("Huỷ")` — EN nay cấm cả 2 dạng.
- Source check (dòng 284, 295, 306, 317): giữ `'"Hủy"'` trong danh sách
  literal cấm và **thêm** `'"Huỷ"'` — source nay cấm cả 2 dạng literal.
- Không đổi logic nào khác; expected dict đã đúng "Huỷ" từ đợt 56.

## 4. Kiểm chứng (số thật, chạy 2026-11-07 từ gốc repo)

- **Grep sau sửa** (52 file phạm vi, `.ts/.tsx/.json/.md/.js`):
  còn **0** "Hủy"/"hủy" trong chuỗi UI. Còn lại duy nhất:
  (a) `nestedPreview.ts:474` "nguyên thủy" — chính tả đúng, giữ nguyên;
  (b) 6 dòng trong chính `i18nAudit55L2.test.ts` — assertion phủ định
  (`!includes("Hủy")`, danh sách literal cấm) giữ "Hủy" làm mẫu cấm,
  có chủ đích, nay cấm thêm cả "Huỷ".
- **"thuỷ" (sai) = 0** toàn phạm vi nguồn.
- **Test chạy lại (esbuild bundle + node):**
  L2 **20/20**, M2 **13/14** (xem §5 — lỗi cũ, không đổi), M8 **7/7**,
  N4 **14/14**, N8 **8/8**, clipboard **18/18**, d6 **11/11**, seek **15/15**
  (esm, top-level await), reverseFileBuffer35R3 **10/10**,
  reverseFileCancel37T5 **6/6**, pause46B2 **11/11** (esm),
  desktopSaveAs53J4 **ALL PASS**, openFileQueue **4/4** (esm),
  native-files (desktop) **8/8** (esm).
- **`tsc --noEmit`: apps/web 0 lỗi; apps/desktop 0 lỗi.**
- **`vite build` apps/web: pass, 5.37s** (chỉ cảnh báo chunk >500kB có sẵn).

## 5. Nợ mở / việc còn lại

1. **M2 test đỏ sẵn 1/14 (trước đợt này, không do O8):** baseline chạy
   trước khi sửa đã là 13/14 — test "fragment: đủ 156 key" rớt ở
   `exportPanel.bridgeError đã tồn tại trong vi.json` (fragment M2 đã merge
   vào dict đợt 56 nhưng test vẫn assert "không trùng key cũ"). Cùng mẫu
   với M5 đợt 56 (đã đổi sang ngữ nghĩa post-merge). O8 KHÔNG sửa vì ngoài
   phạm vi (không phải assertion chính tả) — cần luồng riêng đổi test M2
   sang ngữ nghĩa post-merge như M5.
2. **Bản copy build còn "Hủy" cũ (không sửa, tái sinh khi build):**
   `apps/desktop/release/*`, `release-round55-l4/*`, `build/bundled-server/*`
   (bản sao `server/*` — sẽ khớp sau lần build/packaging tới) và
   `apps/desktop/dist-web/assets/index-*.js` (bundle cũ, có
   `cancel:"Hủy"` từ trước đợt 56). Không đưa vào batch.
3. **Báo cáo lịch sử `docs/PHASE9_ROUND5*.md` / `PHASE9_ROUND57_LIMITS.md`**
   còn nhắc "Hủy" trong văn bản tường thuật (ngoài phạm vi quét của nhiệm
   vụ: `apps/web/src` + `server` + `packages`) — giữ nguyên như hồ sơ
   lịch sử, không viết lại.
4. `docs/PHASE9_ROUND57_LIMITS.md` §6.8 nay đã đóng (nợ comment đã xử lý
   hết trong phạm vi nguồn).

## 6. Stage (KHÔNG push)

- File stage: `~/workspace/repo-1-push/paths-loop/phase9-round58-o8-spelling.txt`
  — **51 entry**, NUL-delimited, verify read-back, toàn text:
  49 file script sửa + `apps/web/src/lib/i18nAudit55L2.test.ts` + file
  LIMITS này. Không binary, không dist, không `__pycache__`.
- Không sửa `vi.json`/`en.json` (không thêm key, không đổi giá trị —
  đã đúng chuẩn từ đợt 56).
