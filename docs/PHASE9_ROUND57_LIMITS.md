# Phase 9 đợt 57 — TỔNG HỢP GỘP (LIMITS)

Ngày: 2026-11-07. Coordinator gộp đợt 57 (10 luồng N1–N10) + wiring + kiểm chứng
lại trên cây đã gộp. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết quả gộp dict — số thật

- Trước gộp: `vi.json` == `en.json` == **1722 key lá** (đếm thật bằng script).
- Đã gộp fragment N4 (11 key `nested.failsoft.*`), N5 (180 key
  `templatePack.*.placeholder.*.label` mới + 5 key EN ghi đè), N7 (1 key
  `projectRepo.moreWarnings`), N8 (23 key `userLut.cube*` 11 +
  `projectHistory.*` 7 + `subtitles.err*` 5). N2 fragment rỗng có chủ đích —
  không có gì để gộp.
- Sau gộp: `vi.json` == `en.json` == **1937 key lá** (1722 + 215; vi/en cùng
  tập key, placeholder `{var}` khớp toàn bộ). Script gộp `/tmp/merge57.py`:
  deep-merge, cấm trùng key cũ trừ đúng 5 key EN N5, cấm đổi giá trị cũ
  ngoài 5 override đó — đã verify sau ghi.
- **Đính chính claim N5 (đã kiểm chứng trên đĩa):** fragment M7 ĐÃ được gộp
  đợt 56 — `templatePack` có sẵn 105 key lá trong dict 1722 (100 key
  name/description M7 + 5 key cũ). Claim "grep templatePack. = 0" của N5
  là SAI (grep sai). Vì vậy 5 key EN của N5 là ghi đè giá trị EN đã có
  (`unboxing.name` "Unboxing" → "Product Unboxing",
  `audiobook-promo.name` "Audiobook Ad" → "Audiobook Promo",
  `webinar-invite.description` "online seminar" → "webinar",
  `tutorial-vertical.description` → "one scene and step text per step",
  `charity-appeal.description` → "bank account number"), KHÔNG phải key mới.
  180 key `.label` là key mới thật.

## 1. Snapshot test khóa số key — cập nhật lên 1937

8 file assert đã sửa `1722` → `1937` (giữ dòng lịch sử cũ, thêm dòng đợt 57):
`ProjectMenu.i18n55L1.test.ts` (L1), `reverseToggleI18n48D4.test.ts` (D4),
`saveToast31.test.ts`, `structuredNotes32.test.ts`,
`reverseBadge46B6.test.ts` (B6), `reverseCompat44Z6.test.ts` (Z6),
`reversePlaybackI18n49E2.test.ts` (E2), `i18nRound57N4.test.ts` (N4).
4 file chỉ comment đã cập nhật mốc: `errorDetail34Q4.test.ts`,
`i18nAudit55L2.test.ts`, `i18nRound56M5.test.ts`, `i18nAudit56M2.test.ts`.
Không còn assert nào khóa 1722/1011 trong `apps/web/src`.

## 2. Wiring đã làm ở đợt gộp (an toàn, có kiểm chứng)

- **N8 (3 call-site, theo đúng snippet `round57-n8-proposals.json`):**
  `LutPicker.tsx:264` `parseCube(text, f.size, i18nT)`;
  `HistoryPanel.tsx` `getHistoryStore(t)` ở refresh + `importHistory(data, t)`
  (singleton lưu lookup cho cả lỗi mở IndexedDB lẫn validateImport);
  `CaptionModal.tsx:298` `parseSubtitleFile(text, t)`. Lỗi .cube / history /
  phụ đề nay hiện EN thật thay vì fallback VI.
- **N7:** `projectRepo.ts:1112` nối `trKey(lookup, "projectRepo.moreWarnings",
  { n }, <fallback VI đúng từng byte>)` — trong `parseProjectText`, `trKey`
  + `lookup` đã có sẵn trong scope. Panel/toast đổi sang câu tràn có số thật:
  `LoadReportPanel.tsx` + `App.tsx:268` (autosave toast) +
  `openProjectFlow.ts` (`warnListReport`) dùng
  `formatOverflowLine(report.overflowCount, t)` khi `overflowCount != null`,
  ngược lại giữ `t("loadReport.atCap")` cũ. M5 test vẫn khóa literal VI
  fallback còn nguyên trong source (chạy lại 21/21).
- **N5:** `TemplatePicker.tsx` bước 2 nối `localizeTemplatePlaceholders`:
  form hiển thị `displayTpl.template.placeholders` (chỉ `label` đã dịch);
  `apply()` vẫn nhận `selected` gốc nên `default`/nội dung mẫu giữ VI.
- **N4: KHÔNG surface** `flat.skipped`/`skippedReasons` ra badge/toast trong
  đợt này (N4 ghi cần thiết kế riêng) — nợ mở, xem §5.

## 3. tsconfig exclude của N6 — kết luận

- N6 thêm 1 dòng `src/lib/gopTrialDecode57N6.test.ts`, N10 thêm
  `src/lib/gopTrialDecode57N10.test.ts` vào `exclude` (tổng 144 entry).
  Đây là quy ước có sẵn: mọi file `*.test.ts` chạy bằng esbuild/Node
  type-stripping đều bị exclude khỏi tsc.
- Kiểm chứng bằng tsconfig tạm (bỏ 2 dòng exclude): lúc đầu 5 lỗi; 1 lỗi
  **thật** `TS2339` ở `gopTrialDecode57N10.test.ts:590`
  (`Parameters<...>[1]["fetchImpl"]` — union có `undefined`) đã sửa:
  cast thẳng `flaky as unknown as GopRangeFetchFn` (type đã import sẵn
  trong file; chỉ đổi kiểu, không đổi runtime). 4 lỗi còn lại toàn
  `TS5097` import đuôi `.ts` — cùng mẫu với mọi test file khác trong
  exclude (M10 có 5, L8 có 4, N7 có 1). **Giữ nguyên 2 dòng exclude.**
  File `gopTrialDecode57N10.test.ts` đã nằm trong batch N10 nên sửa này
  đi theo batch đó, không liệt kê lại ở batch closing.

## 4. Kiểm chứng lại trên cây đã gộp (số thật, chạy 2026-11-07)

- `tsc` apps/web: **0 lỗi**; `tsc` apps/desktop: **0 lỗi**;
  `vite build` apps/web: **pass, 5.75s** (cảnh báo chunk >500kB có sẵn).
- Test mới 10 luồng (chạy lại bằng esbuild bundle + node):
  N1 11/11, N2 8/8, N3 4/4, N4 **14/14** (xem lưu ý dưới), N5 9/9,
  N6 32/32, N7 16/16, N8 8/8, N10 17/17. N9 là clicktest headed, xem §4.
- Hồi quy: M5 21/21, M7 10/10, L2 20/20, L1 6/6, nestedPreview 46,
  loadReport 10/8/14, projectHistory 15/15, subtitles 14/14,
  GOP M10 28/28, L8 23/23, I6 25/25, T3 10/10, demux Q2 8/8,
  snapshot ở mốc 1937 (D4 3/3, saveToast31 15, structuredNotes32 12,
  errorDetail34Q4 35, B6 8/8, Z6 10/10, E2 3/3, L1 6/6),
  projectRepo.test.ts 10/10, loadProject54K1 7/7.
- Lưu ý N4: test "không trùng key" của N4 viết cho trạng thái pre-merge
  nên sau gộp đỏ 1/14 theo thiết kế (key nay đã có trong dict). Đợt gộp
  đã đổi test này sang ngữ nghĩa post-merge: 11 key có trong dict đúng
  giá trị fragment + không trùng fragment khác → 14/14.
- Lưu ý GOP: N10/M10/L8 dùng top-level await nên phải bundle
  `--format=esm` + `.mjs` (đúng header của M10; header N10 ghi `cjs`
  là sai — cjs gãy `Top-level await is not supported`). N6 không bị.
- Re-probe headed N1 sau gộp (harness `~/scratch-round57-n1/`,
  tag `closing-1440x900`, exit 0): **PASS** — SilenceModal 640x397,
  top=151 bottom=548 trong viewport 1439x699; nút Huỷ + Phân tích
  bottom=531, nhìn thấy ở lần vẽ đầu, không cần scroll.
  Report: `~/scratch-round57-n1/n1-report-closing-1440x900.json`.
  N3 (tipGone) không re-probe lại — N1 đã đại diện cho vòng headed
  sau gộp; N3 probe gốc 6/6 PASS vẫn giữ nguyên giá trị.

## 5. Tóm tắt từng luồng (số đã kiểm chứng lại)

| Luồng | Việc | Test chạy lại |
|---|---|---|
| N1 | SilenceModal: dời `modal-actions` ra khỏi `modal-body`, đổi class `modal-overlay`/`modal-card` → `modal-backdrop`/`modal` | 11/11 + headed PASS sau gộp |
| N2 | HistoryPanel `fmtTime()` theo `getLang()` (vi-VN/en-US, tháng viết tắt); fragment rỗng có chủ đích | 8/8 |
| N3 | Gate probe dev-only `?vcut-probe=enhance-tipgone` để nhánh tipGone đo được qua UI thật (Inspector.tsx) | 4/4 (+ probe gốc 6/6) |
| N4 | 11 key `nested.failsoft.*` nối qua `trKey` trong nestedPreview (preview + flatten + skippedReasons) | 14/14 (sau sửa test post-merge) |
| N5 | Review EN template M7 (sửa 5/100) + 180 key `.label` placeholder; `default` giữ VI; helper merge N5 đè M7 | 9/9; M7 cũ 10/10 |
| N6 | `validateSampleTimestamps`: bắt đổi tỉ lệ stts đều khi có VUI timing (dung sai 2%); 17 file thật VUI==stts 0.000% lệch | 32/32 |
| N7 | `OVERFLOW_RE` + `parseOverflowCount` + `formatOverflowLine` + `overflowCount` cho câu tràn loadReport (VI+EN) | 16/16 |
| N8 | Sweep 1650 literal-part: nối 23 key UI-DIRECT (userLut 11, projectHistory 7, subtitles 5); 0 chưa phân loại | 8/8 |
| N9 | Clicktest headed timeline core-ops (lượt sạch 11/11); phát hiện Escape không đóng WelcomeModal + quan sát autosave mất media sau reload (chưa kết luận) | 11/11 (lượt 3, gốc) |
| N10 | Trial-decode sample lớn: cap 8 MiB + chunked fetch; keyframe 4K thường decode OK, keyframe 4K nhiễu 4.1 MB timeout 200ms → fail-open | 17/17 |

## 6. Nợ mở (cho đợt 58)

1. **N9 — nặng nhất:** (a) Escape không đóng WelcomeModal (chỉ nút "Để sau"
   đóng); (b) sau reload, autosave khôi phục spec nhưng **mất media mẫu**
   (media bin trống, 2 clip video mẫu biến mất — chỉ còn clip chữ) — quan
   sát chưa kết luận bug, cần đợt riêng verify bằng reload sạch có chủ đích.
2. **N4:** surface `flat.skipped`/`skippedReasons` ra badge/toast/warning
   chưa làm — cần thiết kế riêng.
3. **N1:** `BeatSyncModal.tsx` + `SceneModal.tsx` cũng dùng class
   `modal-card` chưa định nghĩa (chỉ card thiếu style, overlay đúng).
4. **N10:** keyframe 4K nhiễu (4.107.475 byte) decode không kịp timeout
   200ms → fail-open (an toàn nhưng moov giả có sample 0 là keyframe
   không bị chặn); cần timeout riêng theo kích thước nếu muốn chặn chắc.
5. **N6:** hoán đổi delta stts vẫn lọt (giữ nguyên multiset nên mọi ước
   lượng fps không đổi; đã đánh giá kỹ và quyết định không thêm kiểm hình
   dạng delta) + vẫn lọt khi SPS không có VUI timing (fail-open).
6. **N8:** đề xuất key `captions.translatedTrack` ("Phụ đề ({code})")
   CHƯA merge — bị chặn bởi recognition token `startsWith("Phụ đề")` ở
   `subtitles.ts:248`: dịch nhãn mà không đổi recognition thì track dịch
   tạo mới dưới locale en sẽ không được xuất phụ đề. Cần đổi recognition
   cùng lúc (khớp cả hai tiền tố hoặc lưu flag isCaption riêng).
7. **N8:** `webglLut.test.ts` lỗi có sẵn, không chạy được bằng esbuild cjs
   (`fileURLToPath(import.meta.url)`) lẫn Node type-stripping
   (`ERR_MODULE_NOT_FOUND .../lib/bridgeUrl`) — cần runner khác
   (vitest/vite); N8 không sửa vì ngoài phạm vi, `webglLut.ts` mtime 06/11.
8. **Nợ cũ:** comment "Hủy"/"hủy" còn lẫn (chính tả nút Hủy chưa thống nhất).
9. **N5:** bản dịch EN template chưa qua người bản ngữ (đã qua 2 cặp mắt
   nhưng không phải native); phán đoán mơ hồ đã ghi: "weight lost"
   (`gym-transformation`), "Persistent caption" (`tiktok-viral`).

## 7. Stage (KHÔNG push)

Batch closing: `~/workspace/repo-1-push/paths-loop/phase9-round57-closing.txt`
(NUL-delimited, verify read-back, 21 entry):
dict đã gộp (vi.json, en.json); 11 file snapshot/comment đã cập nhật mốc
1937 (trừ `i18nRound57N4.test.ts` — đã nằm trong batch N4, nội dung cuối
đi theo batch đó); 7 file wiring
(LutPicker, CaptionModal, projectRepo, LoadReportPanel, App,
openProjectFlow, TemplatePicker — `HistoryPanel.tsx` đã nằm trong batch N2);
LIMITS tổng hợp này.

Tổng chờ push: **561 entry** = 499 (sau đợt 56) + 41 (đợt 57, gồm
`tsconfig.json` đếm 2 lần ở N6+N10) + 21 (closing).
