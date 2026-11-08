# PHASE9_ROUND56_M6 — UNVERIFIED-lib: giới hạn & phương pháp xác minh sink

Luồng M6, đợt 56 (i18n), chạy 2026-11-07. Audit 396 literal `UNVERIFIED-lib`
của đợt 55 L2 (chưa xác minh sink). Tài liệu này nói trung thực: đã xác minh
được gì, bằng cách nào, và chỗ nào còn nợ.

## 1. Kết quả phân loại (396 literal, 0 còn chưa xác minh)

| Phân loại | Số | Ý nghĩa |
|---|---|---|
| UI-DIRECT (M6 nối trực tiếp) | 15 | UI-visible, file không ai sở hữu → đã nối `t()` qua fragment `round56-m6.json` |
| UI-PROPOSE (đề xuất cho parent) | 39 | UI-visible, file do luồng khác sở hữu → chỉ ghi đề xuất, không sửa code |
| WIRED-OWNER (đã nối bởi luồng khác) | 84 | Đã nối `tr()`/`trKey()` bởi M5 hoặc luồng khác — nhưng xem §4, chưa chắc hiển thị được |
| NON-UI-internal (sink đã xác minh) | 256 | Không tới được UI: chỉ dùng nội bộ / log / test / harness |
| ARTIFACT (scanner artifact) | 2 | Nằm trong comment `/** */`, không phải literal code |
| UNVERIFIED | 0 | |

Bảng theo file (khóa bằng test `lib/i18nAudit56M6.test.ts` §4):

| File | UI-DIRECT | UI-PROPOSE | WIRED-OWNER | NON-UI | ARTIFACT |
|---|---|---|---|---|---|
| components/nested/nestUtils.ts | — | — | — | 55 | 2 |
| lib/cpuGate39T6.ts | — | — | — | 6 | — |
| lib/cpuGateNodeDiag40V6.ts | — | — | — | 14 | — |
| lib/curveFix.ts | — | — | 30 | 4 | — |
| lib/discardRestore35R6.ts | — | — | — | 14 | — |
| lib/gopRangeFetch39T3.ts | — | — | — | 23 | — |
| lib/nestedPreview.ts | — | — | 38 | 12 | — |
| lib/previewEngine.ts | 1 | — | — | — | — |
| lib/projectHistory.ts | 9 | — | — | — | — |
| lib/projectRepo.ts | — | 35 | 10 | — | — |
| lib/reversePreviewGate.ts | — | 4 | — | — | — |
| lib/reverseRangeGate38U2.ts | — | — | — | 7 | — |
| lib/reverseWebcodecs.ts | — | — | — | 2 | — |
| lib/settle45A1.ts | — | — | — | 28 | — |
| lib/settle46B1.ts | — | — | — | 19 | — |
| lib/settle47C2.ts | — | — | — | 15 | — |
| lib/settle48D2.ts | — | — | — | 27 | — |
| lib/settle49E3Early.ts | — | — | — | 13 | — |
| lib/settleAsset44Z1.ts | — | — | — | 12 | — |
| lib/subtitles.ts | 1 | — | — | 1 | — |
| lib/syncProtocol.ts | — | — | — | 4 | — |
| lib/templateEngine.ts | 2 | — | — | — | — |
| lib/templatePack.ts | 2 | — | — | — | — |
| lib/twoLevelCurve.ts | — | — | 6 | — | — |

Chi tiết từng literal: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round56-m6/verdicts.json`
(script `classify.py` cùng thư mục). Đề xuất 39 literal:
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round56-m6-unverified-proposals.json`
(33 key — một số key gom nhiều literal trùng nội dung).

## 2. Phương pháp xác minh sink

1. **Định vị từng literal trong source hiện tại**: search de-interpolated
   (bỏ span `${...}`, collapse whitespace) + fallback quoted-literal cho
   nhánh ternary trong `${}`. **Cả 396 literal đều định vị được.** 4 lệch
   dòng so với inventory đợt 55 được giải thích (multi-line `${}` hoặc code
   đã dịch chuyển; đã verify bằng `sed`/`grep` trực tiếp). Inventory dùng
   dòng của đợt 55; source hiện tại đã dịch (đặc biệt `lib/nestedPreview.ts`,
   `lib/twoLevelCurve.ts` đang có luồng khác sửa trong lúc audit).
2. **Truy vết sink theo từng file**: đọc consumer thực của chuỗi (ai đọc
   field đó, ai render/toast nó), không đoán theo tên biến. Chuỗi chỉ được
   xếp NON-UI khi đã tìm được điểm kết thúc: bị catch nuốt, chỉ test/harness
   đọc, hoặc không có consumer nào.
3. **Xác minh chéo bằng test**: test mới `lib/i18nAudit56M6.test.ts` (8/8
   pass) khóa fragment 15 key, hành vi thật của 5 hàm đã nối (lookup EN →
   chuỗi EN, không lookup → fallback VI từng chữ), source dùng `trKey()`
   đúng key, và toàn bộ bảng phân loại 396 literal từ `verdicts.json`.
4. **Hồi quy**: `projectHistory` 15/15, `subtitles` 14/14,
   `previewEngine` 14/14, `templateContentLocale56M7` 10/10 — đều xanh.

## 3. Các chuỗi bằng chứng chính (sink đã xác minh)

- **nestUtils.ts (55 NON-UI)**: throw `splitLevelCurveShapeError`/`nestedSplitOffset`
  bị `store.ts` catch và nuốt message (comment ~2807: không lộ message gốc
  vào toast); 22 chuỗi `reason` của TwoLevelCheck được UI dịch qua
  `reasonCode` → key `nested.twoLevel*` (`nestedRejection.ts`), raw `reason`
  chỉ hiện qua fallback khi code lạ — mọi producer đều gắn code đã biết.
  `SPEC_SCOPE_BLOCKED_MESSAGE` là export chết, không consumer.
- **curveFix.ts (30 WIRED-OWNER, 4 NON-UI)**: 30 literal đã nối
  `curveFix.*` — 18 key đã có sẵn trong `vi.json`/`en.json`. 4 NON-UI:
  fallback `'không sửa được.'` (mọi đường sống đều set reason+key cùng lúc)
  và `exportCurveBlockers()` không có caller trong app.
- **nestedPreview.ts (38 WIRED-OWNER, 12 NON-UI)**: 38 throw đã được M5
  bọc `trKey(lookup, "nested.*")` — nhưng xem §4. 12 NON-UI:
  11 `sink.skipped.push(...)` (`FlattenResult.skipped` không consumer nào
  đọc) + 1 fallback `skippedEffectReason()` (`skippedReasons` không UI nào đọc).
- **projectRepo.ts (10 WIRED-OWNER, 35 UI-PROPOSE)**: 10 đã nối sẵn qua
  structured notes (`code` + `fallback`, key `structuredNotes.*` đã có
  trong `vi.json`/`en.json`, `LoadReportPanel` dịch theo code). 35 đề xuất:
  25 lỗi `validateSpecDeep` (→ toast `projectMenu.openFileError` qua
  `openProjectFileFlow`), 6 note sanitize (→ warning trong summary),
  `'File không phải JSON hợp lệ.'`, `'Dự án không tên'` ×2, `'Dự án mới'`.
- **reversePreviewGate.ts (4 UI-PROPOSE)**: 4 const `REVERSE_*_VI` đi vào
  gate `warnings` → `preview.tsx:2215` `pushToast(w, "info")` nguyên văn.
  **Đây là hành vi có chủ đích** theo luật T2 (`reverseDecodeAheadToggle.ts:24`,
  `preview.tsx:2166`: chuỗi cổng hiển thị nguyên văn; test
  `reverseDecodeAheadToggle38U1.test.ts` assert đúng chuỗi VI). Đề xuất
  ghi rõ `verbatimByDesign` — parent quyết định có phá luật T2 không.
- **subtitles.ts**: `'Phụ đề'` (NON-UI) là **identifier chức năng**
  (`startsWith` để nhận diện track phụ đề; dịch sẽ phá việc đọc track cũ
  đã lưu) — cố tình KHÔNG dịch. `'(không tên)'` (UI-DIRECT) là fallback
  label hiển thị trong `CaptionModal`/`RelinkPanel`.
- **settle*/cpuGate*/gop*/reverseRangeGate/reverseWebcodecs/syncProtocol/discardRestore
  (256 NON-UI)**: `detail`/`reason` trong object diagnostic; consumer chỉ
  là test của chính module, script harness CLI (`apps/web/scripts/...`),
  hoặc module settle khác — không có reader nào trong UI app.

## 4. Nợ mở & cảnh báo trung thực

1. **Key của M5 chưa có thật.** 71 key `nested.*`/`curveErr.*` (38 throw
   trong `nestedPreview.ts` + 6 trong `twoLevelCurve.ts`) được M5 nối bằng
   `trKey()` nhưng **không có trong `vi.json`/`en.json` hay bất kỳ fragment
   nào** — file `i18n/fragments/round56-m5.json` không tồn tại (đã kiểm tra
   cả `i18n/fragments/` và `paths-loop/` lúc audit). Không caller nào truyền
   `lookup` cho `buildPreviewSpecFailsoft()` (`preview.tsx:2641` gọi không
   lookup). **Hậu quả hiện tại: các lỗi preview vẫn hiển thị tiếng Việt
   fallback**, dù code đã "nối". Cần M5/parent hoàn thiện fragment + nối
   call-site.
2. **Call-site của 15 key M6 cũng chưa nối.** Không call-site nào truyền
   `lookup` vào `summarizeDiff`/`collectProjectCaptions`/`motionBadgeText`/
   `applyTemplateValues`/`resolvePackSpec` (tất cả đều nằm trong file do
   luồng khác sở hữu: `preview.tsx`, `HistoryPanel.tsx`,
   `CaptionModal.tsx`, `TemplatePicker.tsx`, `TemplatePackModal.tsx`).
   Runtime hiện tại vẫn hiển thị fallback VI — đúng như cũ, không tệ hơn,
   nhưng chưa dịch được cho tới khi parent/owner nối call-site (truyền
   `t()` làm `lookup`).
3. **`'Dự án mới'` là sentinel, không chỉ là chuỗi hiển thị.** Nó vừa là
   tên mặc định project mới, vừa được `store.ts:799` gán và `isDirty()`
   so sánh (`meta.name !== "Dự án mới"`). Dịch nó đòi đổi cả chỗ gán +
   chỗ so sánh + xử lý project cũ đã lưu — đề xuất ghi rõ cảnh báo này,
   parent quyết định.
4. **4 chuỗi VI ngoài inventory** trong `lib/nestedPreview.ts` hiện tại
   (thêm sau đợt scan 55 hoặc scanner bỏ sót): ~833
   (`reverse ở clip lồng nhau có speedKeyframes...`), ~2423
   (`flattenForPreview: spec.adjustmentLayers phải là một mảng...`),
   ~2590/2596 (`adjustmentAppliesToClip: scopeTracks...`). Thuộc file
   do luồng khác sở hữu và ngoài phạm vi 396 literal — **không sửa**,
   chỉ ghi lại đây.
5. **tsc toàn repo hiện FAIL vì file của luồng khác.** `cd apps/web &&
   ../../node_modules/.bin/tsc --noEmit` trả 15 lỗi, **tất cả** trong
   `src/lib/i18nRound56M5.test.ts` (file test của luồng M5, đang làm dở:
   import `.ts` không bật `allowImportingTsExtensions`, type `string` gán
   cho `number[]`, spread trên non-object). **0 lỗi trong 6 file của M6.**
   M6 không sửa file M5 (quy tắc tránh xung đột) — parent cần báo M5 sửa
   trước khi merge.
6. **Giới hạn mẫu đã rà.**
   - 114 literal `settle*`: kết luận NON-UI dựa trên đếm importer +
     spot-check pattern `detail`/`reason` và consumer (test/harness),
     không đọc từng dòng cả 6 file.
   - `cpuGateNodeDiag40V6` literal `'đạt'`: locator khớp comment ở dòng 96
     trước; occurrence code thật đã verify ở dòng 203.
   - Các file `nestedPreview.ts`/`twoLevelCurve.ts`/`projectRepo.ts` có
     mtime mới trong lúc audit (luồng khác đang sửa) — số dòng trong
     `verdicts.json` là dòng lúc audit; trước khi áp đề xuất phải verify
     lại dòng trong source hiện tại (đã ghi trong proposals JSON).
7. **Test không phải browser thật.** Các assert là tầng lib/helper qua
   esbuild + Node; hiển thị trên UI thật (toast/modal/badge) cần
   click-test headed — chưa làm trong luồng này.

## 5. File đã đổi/thêm (stage, KHÔNG push)

- `apps/web/src/i18n/fragments/round56-m6.json` (mới, 15 key)
- `apps/web/src/lib/projectHistory.ts` (nối 9 key)
- `apps/web/src/lib/subtitles.ts` (nối 1 key)
- `apps/web/src/lib/previewEngine.ts` (nối 1 key)
- `apps/web/src/lib/templateEngine.ts` (nối 2 key)
- `apps/web/src/lib/templatePack.ts` (nối 2 key)
- `apps/web/src/lib/i18nAudit56M6.test.ts` (mới, 8/8 pass)
- `docs/PHASE9_ROUND56_M6_UNVERIFIED_LIB_LIMITS.md` (file này)

Stage: `~/workspace/repo-1-push/paths-loop/phase9-round56-m6-unverified-lib.txt`
(NUL-delimited). File đề xuất (ngoài repo, không stage):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round56-m6-unverified-proposals.json`.
