# PHASE9_ROUND57_N8 — I18N sweep: giới hạn & phương pháp quét vét

Luồng N8, đợt 57 (i18n sweep), chạy 2026-11-07. Quét toàn bộ literal
tiếng Việt có dấu còn sót trong `apps/web/src` sau đợt 56, phân loại
từng literal theo phương pháp đợt 56 M6, nối trực tiếp những literal
UI-visible trong file được phép sửa, đề xuất những literal không an
toàn để sửa. Tài liệu này nói trung thực: đã quét được gì, bằng cách
nào, và chỗ nào còn nợ.

## 1. Kết quả phân loại (1650 literal-part quét được, 0 chưa phân loại)

Đơn vị đếm là **string-literal part** (một template literal chứa
backtick lồng trong `${}` bị tách thành 2 part — vd curveFix.ts:987;
xem §6). Tổng 1650 part = 56 WIRED-fallback + 288 khớp inventory M6
+ 21 khớp đề xuất L2 + 1285 literal MỚI phân loại ở đợt này.

| Phân loại | Số | Ý nghĩa |
|---|---|---|
| DATA-CONTENT | 636 | Nội dung dữ liệu tiếng Việt (template/sample/media mẫu) — theo thiết kế M7, không dùng `t()` |
| DATA-MEASURE | 346 | Số liệu đo TTS (câu chuẩn + mẫu đo + tên giọng) — dữ liệu đo, không phải chuỗi UI |
| M6-PRIOR | 288 | Đã phân loại ở đợt 56 M6 (khớp inventory 396 của M6) — không làm lại |
| NON-UI | 278 | Không tới được UI: log/console, throw bị catch nuốt, diagnostic `reason`/`detail`, identifier |
| WIRED-FALLBACK | 56 | Đã nối: literal là fallback trong `trKey()`/`tr()`/`t()` |
| UI-DIRECT (N8 nối) | 23 | UI-visible, file được phép sửa → đã nối `trKey()` qua fragment `round57-n8.json` |
| WIRED-OWNER | 15 | Đã nối bởi luồng khác (messageKey / structured-note / localized twin) |
| ALREADY-PROPOSED | 4 | Đã đề xuất từ trước (L2/M6), chưa merge — không đề xuất trùng |
| PROPER-NOUN | 3 | Tên riêng giọng TTS "Hải Đăng" — giữ nguyên mọi ngôn ngữ (L2 notProposed) |
| COVERED-N7 | 1 | Key đã có trong fragment round57-n7 của luồng khác — không trùng |
| UNCLASSIFIED | 0 | |

Bảng literal MỚI (1285) theo file — khóa bằng test
`lib/i18nAudit57N8.test.ts` §4:

| File | UI-DIRECT | WIRED-OWNER | DATA-CONTENT | DATA-MEASURE | NON-UI | PROPER-NOUN |
|---|---|---|---|---|---|---|
| lib/templates.ts | — | — | 622 | — | — | — |
| lib/ttsEstimate51H2.ts | — | — | — | 119 | — | — |
| lib/ttsEstimate50F3.ts | — | — | — | 63 | — | — |
| lib/ttsEstimate47C4.ts | — | — | — | 38 | — | — |
| lib/ttsEstimate49E1.ts | — | — | — | 38 | — | — |
| lib/ttsEstimate46B3.ts | — | — | — | 32 | — | — |
| lib/ttsEstimate51H1.ts | — | — | — | 28 | — | — |
| lib/ttsEstimate48D1.ts | — | — | — | 24 | — | — |
| lib/ttsEstimate45A3.ts | — | — | — | 4 | — | — |
| components/nested/nestUtils.ts | — | — | — | — | 118 | — |
| lib/transitionPreview.ts | — | — | — | — | 73 | — |
| lib/webglLut.ts | — | — | — | — | 12 | — |
| lib/userLut.ts | 11 | — | — | — | — | — |
| lib/gopCache40V2.ts | — | — | — | — | 8 | — |
| lib/assetStore.ts | — | — | — | — | 7 | — |
| lib/projectHistory.ts | 7 | — | — | — | — | — |
| lib/sample-nested.ts | — | — | — | — | 6 | — |
| sample.ts | — | — | 6 | — | — | — |
| lib/discardRestore35R6.ts | — | — | — | — | 6 | — |
| lib/reverseWebcodecs.ts | — | — | — | — | 6 | — |
| lib/waveform.ts | — | — | — | — | 6 | — |
| lib/rehydrate36S5.ts | — | — | — | — | 5 | — |
| lib/reverseRangeGate38U2.ts | — | — | — | — | 5 | — |
| lib/settle48D2.ts | — | — | — | — | 5 | — |
| lib/settleAsset44Z1.ts | — | — | — | — | 5 | — |
| lib/subtitles.ts | 5 | — | — | — | — | — |
| lib/curveFix.ts | — | 4 | — | — | — | — |
| lib/projectRepo.ts | — | 3 | — | — | — | — |
| lib/gopSizeProbe41W4.ts | — | — | — | — | 3 | — |
| lib/settle45A1.ts | — | — | — | — | 3 | — |
| lib/syncProtocol.ts | — | — | — | — | 2 | — |
| preview.tsx | — | — | — | — | 2 | — |
| lib/settle47C2.ts | — | — | — | — | 2 | — |
| components/TtsButton.tsx | — | — | — | — | — | 2 |
| desktop.ts | — | — | — | — | 1 | — |
| components/onboarding/TemplatePackModal.tsx | — | — | — | — | — | 1 |
| lib/previewEngine.ts | — | — | — | — | 1 | — |
| lib/sampleMedia.ts | — | — | 1 | — | — | — |
| lib/thumbnails.ts | — | — | — | — | 1 | — |

Chi tiết từng literal:
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round57-n8/verdicts.json`
(1650 entry). Đề xuất 1 literal + 4 snippet call-site:
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round57-n8-proposals.json`.

## 2. Đã nối trực tiếp (23 key, fragment `round57-n8.json`)

| File | Key | Sink UI đã xác minh |
|---|---|---|
| `lib/userLut.ts` — `parseCube` + `parseTriple` (11) | `userLut.cube*` | `LutPicker.tsx:264` parse → catch → `setImportErr(e.message)` → `<p>⚠️ {importErr}</p>` (dòng 311) |
| `lib/projectHistory.ts` — `validateImport`/`importHistory` (5) + `IndexedDBBackend.openDb` (2) | `projectHistory.history*`, `projectHistory.noIndexedDb`, `projectHistory.indexedDbOpenFailed` | `HistoryPanel.tsx` catch → `pushToast(t("history.*", { error: err.message }))` ở refresh/import/save/restore |
| `lib/subtitles.ts` — `parseBlocks` qua `parseSrt`/`parseVtt`/`parseSubtitleFile` (5) | `subtitles.err*` | `CaptionModal.tsx:298` parse → `t("caption.cueError", { reason })` → `setError` / `setImportNote` |

Mẫu nối: tham số `lookup?: I18nLookup` tùy chọn + helper `trKey`
địa phương (như M5/M6), không import `../i18n` trực tiếp. Không
lookup → fallback VI đúng từng chữ (test cũ + hành vi mặc định không
đổi). **Call-site chưa nối** (theo tiền lệ M6, để owner/parent nối):
snippet chính xác trong `round57-n8-proposals.json` (`callSites`):
`LutPicker.tsx:264` thêm `i18nT`, `HistoryPanel.tsx:52` `getHistoryStore(t)`,
`CaptionModal.tsx:298` `parseSubtitleFile(text, t)`. Trước khi parent
merge fragment vào `vi.json`/`en.json`, lookup trả về key nên `trKey`
fallback về VI — đúng như cũ, không tệ hơn.

## 3. Các chuỗi bằng chứng chính (sink đã xác minh)

- **userLut (11 UI-DIRECT)**: lỗi parse `.cube` hiển thị nguyên văn
  qua `importErr` — khác `webglLut.parseCubeData` (12 NON-UI) dù mirror
  nhau: lỗi webglLut bị `applyWebglLut` catch → `null` → fallback CSS
  (`loadCube().catch(() => failedAt.set(...))`), không hiện message.
- **projectHistory (7 UI-DIRECT)**: `HistoryPanel` toast `err.message`
  ở cả 4 cổng (refresh/save/restore/import). `getHistoryStore(lookup?)`
  lưu lookup lên singleton (`setLookup`, lan tới `IndexedDBBackend`).
- **subtitles (5 UI-DIRECT)**: `parseSubtitleFile` được `CaptionModal`
  gọi (dòng 298) và `reason` chui vào `caption.cueError` hiển thị.
  `CAPTION_TRACK_LABEL_PREFIX` ("Phụ đề") vẫn KHÔNG dịch: token nhận
  diện `startsWith` (dòng 248), như M6 đã ghi.
- **captions.ts (ALREADY-PROPOSED, 1 đề xuất mới)**: L2 đã đề xuất key
  `captions.translatedTrack` ("Phụ đề ({lang})", chưa merge). N8 đề
  xuất lại đúng tên key đó (var `{code}` cho khớp `targetCode`) kèm
  **cảnh báo chặn**: dịch `translatedTrackLabel` mà không đổi recognition
  (`startsWith("Phụ đề")`) thì track dịch tạo mới dưới locale en sẽ
  không được xuất phụ đề. `CAPTION_TRACK_LABEL` (dòng 100) không đề
  xuất dịch — token nhận diện.
- **curveFix (4 WIRED-OWNER)**: 4 part của `formatSanitizeSummary`
  (fallback VI) đã có bản song ngữ `formatSanitizeSummaryLocalized`
  dùng key `curveFix.summary*` (đã có trong `vi.json`); `store.ts`
  ưu tiên bản đã dịch khi App truyền `summary`, chỉ fallback khi
  ExportPanel không truyền. Không nối thêm.
- **projectRepo (3 WIRED-OWNER + 8 khớp L2)**: 3 literal `warn()` mới
  mang `messageKey` (`speedCurve.shape/keyframesEmpty/bezierInvalid`,
  key đã có trong `vi.json`, `loadReport.ts:257` dịch lúc hiển thị);
  7 literal `warn()` khác khớp L2 nhưng cùng cơ chế `messageKey` nên
  L2 đề xuất `curveErr.*` đã lỗi thời; `motionMigratedHint` là
  structured-note `fallback` (key `structuredNotes.*` đã có);
  `projectRepo.moreWarnings` (dòng 1112) đã có key trong fragment
  **round57-n7** của luồng khác — N8 không trùng, không sửa code.
- **nestUtils (118 NON-UI)**: `{ error }` trả về bị `store.ts`
  (`nestSelection`/`unnestClip`) nuốt lặng (`if ("error" in res)
  return false`, không toast); throw `splitLevelCurveShapeError` /
  `nestedSplitOffset` bị catch nuốt (M6 đã xác minh 55, L2 đếm 120
  error-swallowed — cộng 59 part khớp inventory M6 thì đủ 177 literal
  của file theo cách đếm part của đợt này).
- **settle*/cpuGate*/gop*/reverse*/discardRestore/rehydrate/syncProtocol
  (NON-UI)**: `reason`/`detail` trong object diagnostic; consumer chỉ
  là test của chính module, script harness, hoặc module cùng họ — không
  có reader nào trong UI app. `syncProtocol` không có caller nào trong
  app (chỉ thiết kế + test).
- **transitionPreview (73 NON-UI)**: field `note` của `TransitionVisual`
  chỉ được `transitionPreview.test.ts` đọc (probe/harness); `preview.tsx`
  chỉ dùng `a`/`b`/`geometric`, không đọc `.note`.
- **waveform (6 NON-UI)**: `ClipWaveform` `.catch(() => setPeaks(null))`
  — lỗi decode chỉ làm mất sóng, không hiện message.
- **assetStore (7 NON-UI)**: đường ingest chính best-effort
  (`importAsset37T3` catch → `manifest: null`, "Không bao giờ throw");
  `sample.ts` cũng try/catch khi ingest mẫu.
- **thumbnails (1 NON-UI)**: `v.onerror` reject → `getVideoThumbnail`
  catch → `null`.
- **previewEngine (1 NON-UI)**: `integrateRampSpeed` throw khi
  keyframes rỗng — bất biến phòng thủ, chỉ tới `console.error`
  "[preview] tick lỗi" (preview.tsx:3291), không toast.
- **preview.tsx (2) / desktop.ts (1) NON-UI**: `console.warn` /
  `console.error` thuần.
- **store.ts "Dự án mới" (2, ALREADY-PROPOSED)**: L2 key
  `projectMenu.defaultName` + M6 đề xuất — sentinel (so sánh ở
  `isDirty`, gán ở `store.ts:799`), N8 không đề xuất trùng.
- **reversePreviewGate (4)**: đã nằm trong đề xuất M6
  (`verbatimByDesign`, luật T2) — không đề xuất trùng.
- **templates.ts (622 MỚI + 7 khớp L2 tình cờ)**: DATA-content theo
  thiết kế M7 — tên/mô tả 50 template đã localize qua fragment
  round56-m7; label/default bên trong spec là nội dung mẫu, giữ VI
  theo M7 §3. 7 literal khớp L2 ("Thời gian", "Ảnh") chỉ là trùng từ
  ngắn trong label track của template, không phải chuỗi UI mới.
- **ttsEstimate\* (346 DATA-MEASURE)**: bảng hệ số + câu chuẩn + mẫu
  đo TTS (đợt 45–52) — dữ liệu đo, không phải chuỗi UI.
- **sample.ts / sample-nested.ts / sampleMedia.ts (13)**: nội dung
  project mẫu + nhãn vẽ pixel trên canvas mẫu (M7 §3) + lỗi validate
  của hàm demo `validateNestedDemo` (chỉ demo/test đọc).

## 4. Nợ M6 §4.1 đã đóng một phần (kiểm chứng 07/11)

`i18n/fragments/round56-m5.json` **nay đã tồn tại** (81 key vi/en:
52 `nested.*` + 14 `curveErr.*` + 15 khác). Trong 71 `trKey` ref của
`lib/nestedPreview.ts`, 60 key đã có trong fragment M5; 11 key còn
thiếu đều thuộc `nested.failsoft.*` — và 11 key đó đã có trong
fragment **round57-n4.json** của luồng khác đợt này. Tức là chuỗi
`trKey` đã đủ key ở tầng fragment; phần còn lại là parent merge các
fragment vào `vi.json`/`en.json` + nối call-site truyền `lookup`
(`preview.tsx:2641` gọi `buildPreviewSpecFailsoft()` không lookup —
ghi nhận từ M6, N8 không sửa `preview.tsx` vì ngoài phạm vi sweep
lib).

## 5. Kiểm chứng (lệnh + kết quả thật)

- Test mới `apps/web/src/lib/i18nAudit57N8.test.ts` — esbuild bundle
  (mẫu M6, `--format=cjs`, bundle ra `/tmp/round57-n8/`):
  `./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit57N8.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round57-n8/n8.test.cjs && node /tmp/round57-n8/n8.test.cjs`
  → **8 pass, 0 fail**. Bao gồm: fragment 23 key parity + nội dung
  đúng từng chữ + placeholder khớp; `parseCube` 11 lỗi EN/VI;
  `parseSubtitleFile` 5 lý do EN/VI; `validateImport`/`importHistory`
  5 lỗi EN/VI + `IndexedDBBackend` lỗi mở DB EN/VI (Node không có
  indexedDB nên reject ngay); `getHistoryStore` singleton vẫn hoạt
  động; source dùng `trKey` đúng key + không import `../i18n`;
  phân loại 1650 literal (tổng + bảng file 1285 literal MỚI).
- Hồi quy: `projectHistory.test.ts` **15/15**, `subtitles.test.ts`
  **14/14** (esbuild bundle, mẫu M6).
- `tsc --noEmit` trong `apps/web`: **0 lỗi**. (Lỗi 15 lỗi ở
  `i18nRound56M5.test.ts` mà M6 ghi hôm qua đã biến mất — file đó
  đã được sửa bởi luồng khác; 0 lỗi trong 5 file của N8.)
- `vite build` trong `apps/web`: **pass, 5.43s** (chunk >500kB warning
  có sẵn, không liên quan; dynamic-import warning về `userLut.ts`
  có sẵn, không liên quan).

## 6. Giới hạn mẫu đã rà & nợ mở

1. **Đơn vị đếm là part, không phải chuỗi.** Scanner tách comment
   rồi tách string literal; template literal chứa backtick lồng trong
   `${}` bị chẻ thành 2 part (vd curveFix.ts:987), và 1 literal có thể
   xuất hiện 2 lần trên cùng dòng (templates.ts:53 "Góc làm việc").
   Tổng 1650 part; so với M6 (396 entry, đếm theo template literal)
   thì số part lớn hơn số chuỗi. Khớp M6/L2 bằng chuẩn hoá (bỏ span
   `${...}` và `{var}`, collapse whitespace) + khớp chính xác cho
   literal ngắn; 12 entry M6 không khớp (toàn mảnh ngắn như "đạt",
   "TRƯỢT", "đã gọi" nằm trong literal lớn hơn) đã được phân loại
   NON-UI theo file trong đợt này, không bỏ sót.
2. **File cấm đụng không quét trực tiếp** (10 file theo lệnh đợt:
   `SilenceModal.tsx`, `HistoryPanel.tsx`, `EnhancePanel.tsx`,
   `Inspector.tsx`, `nestedPreview.ts`, `templateContentLocale.ts`,
   `loadReport.ts`, `mp4Demux.ts`, `gopTrialDecode55L8.ts`,
   `gopRangeFetch39T3.ts`) + `vi.json`/`en.json` + mọi `*.test.ts`.
   Trong đó 2 file lib có literal ở inventory M6 (nestedPreview 50,
   gopRangeFetch 23) vẫn thuộc phạm vi M6, không quét lại. Các file
   `.tsx` UI chính (App, ExportPanel, CaptionModal, TopBar...) có
   **0 literal VI** trong lần quét này — đã được nối ở đợt 56 M1–M4.
3. **37 literal MỚI thuộc họ settle/gop/reverse** (settle 15,
   gopCache 8, gopSizeProbe 3, reverseWebcodecs 6,
   reverseRangeGate 5): kết luận NON-UI dựa trên đếm importer +
   spot-check pattern `detail`/`reason` và consumer (test/harness),
   không đọc từng dòng cả 5 file — cùng phương pháp M6 §4.6. Phần
   còn lại của họ này đã thuộc inventory M6 (khớp 288).
4. **Hồi quy webglLut.test.ts KHÔNG chạy được** (lỗi có sẵn, không
   do N8 — N8 không sửa `webglLut.ts`, mtime 06/11): esbuild cjs gãy
   ở `fileURLToPath(import.meta.url)`; Node type-stripping gãy ở
   `ERR_MODULE_NOT_FOUND .../lib/bridgeUrl` (import không đuôi).
   Cần runner khác (vitest/vite) mới chạy được suite này — ngoài
   phạm vi luồng.
5. **Test không phải browser thật.** Các assert là tầng lib/helper
   qua esbuild + Node; hiển thị trên UI thật (toast LutPicker /
   HistoryPanel / CaptionModal) cần click-test headed sau khi parent
   merge fragment + nối call-site — chưa làm trong luồng này.
6. **Fragment chưa gộp vào `vi.json`/`en.json`** — parent gộp cuối
   đợt 57. Trước lúc đó, 23 key mới chỉ có tác dụng qua lookup dựng
   từ fragment (như test), còn app vẫn fallback VI.
7. **3 chuỗi `không sửa được.`** (`curveFix.ts:356/456/745`) vẫn là
   fallback khi mọi đường sống đều set reason+key (M6 đã xếp NON-UI)
   — N8 không đụng.

## 7. File đã đổi/thêm (stage, KHÔNG push)

- `apps/web/src/i18n/fragments/round57-n8.json` (mới, 23 key)
- `apps/web/src/lib/userLut.ts` (nối 11 key)
- `apps/web/src/lib/projectHistory.ts` (nối 7 key)
- `apps/web/src/lib/subtitles.ts` (nối 5 key)
- `apps/web/src/lib/i18nAudit57N8.test.ts` (mới, 8/8 pass)
- `docs/PHASE9_ROUND57_N8_I18N_SWEEP_LIMITS.md` (file này)

Stage: `~/workspace/repo-1-push/paths-loop/phase9-round57-n8-i18n-sweep.txt`
(NUL-delimited, verify read-back) — 6 entry, toàn file trong repo.
File đề xuất + verdicts nằm ngoài repo nên KHÔNG cho vào batch push
(batch push chỉ nhận đường dẫn tương đối trong repo — kiểm chứng:
không file stage round 56/57 nào chứa entry ngoài repo):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round57-n8-proposals.json`
(1 đề xuất + 4 snippet call-site) và
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round57-n8/verdicts.json`
(audit trail 1650 entry, không stage — mẫu M6).
