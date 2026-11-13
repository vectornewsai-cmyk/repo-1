# Phase 9 — Đợt 81, luồng I9: i18n sweep — quét nốt literal tiếng Việt còn lại sau H7 (nợ N2 thu hẹp)

> **Kết luận trước (đọc dòng này là đủ): quét AST toàn `apps/web/src`
> cho 2069 literal VI / 65 file — KHÔNG còn chuỗi UI thật nào chưa wire.
> I9 thêm 0 key, xóa 0 module, sửa 0 dòng code production. Toàn bộ 2069
> literal đã xác minh bằng grep/test là một trong: fallback chết của key
> ĐÃ CÓ trong dict (80 key khóa trong test mới), chẩn đoán/dev-only không
> tới UI, dữ liệu nội dung/khóa, hoặc module chết giữ theo lệnh. Dict
> 2461 → 2463 là do luồng round-81 khác (I6: +2 key `aiJob.etaHours` /
> `aiJob.etaEstimating`, đã bump toàn bộ test khóa số key) — KHÔNG phải
> của I9. Test mới `i18nSweep81I9.test.ts` 16/16. tsc web 0, r6-i18n-check
> PASS, P7 8/8, i18nOrphans 16/16, H7 13/13, G9 9/9. KHÔNG push, KHÔNG
> release/tag, KHÔNG binary, KHÔNG đụng TTS 39 / Gradio.**

Ngày: 10/11/2026 (lượt cron 18:35 +07). Repo: `~/workspace/repo-1`.
Luồng song song cùng đợt: I2/I3/I4/I5/I6/I8 đang chạy — dict chung đổi
dưới tay I9 trong lúc làm (xem §0.1).

## 0. Đối chiếu nhiệm vụ với trạng thái trên đĩa

### 0.1. Dict đổi giữa chừng do luồng I6 (aiJob) — đã xử lý, không phải của I9

- Lúc I9 bắt đầu (~18:37 +07): dict **2461/2461, vi==en=60** — đúng trạng
  thái H7 stage.
- Lúc 18:40 +07, luồng round-81 I6 ghi `vi.json`/`en.json`: **+2 key
  `aiJob.etaHours`** ("còn ~{hours} giờ {minutes} phút" / "about
  {hours}h {minutes}m left") và **`aiJob.etaEstimating`** ("Đang ước
  lượng thời gian còn lại…" / "Estimating remaining time…"), đồng thời
  bump toàn bộ 16 test khóa số key 2461 → 2463 + cập nhật chuỗi lịch
  sử trong comment (kiểm chứng: `grep -rln 2463` ra đủ 16 file).
- Dict lúc I9 stage: **2463/2463, vi==en=60** (vẫn 60 vì 2 key mới
  vi≠en), cùng tập key, placeholder khớp.
- **I9 thêm 0 key.** Test mới khóa 2463 theo đĩa lúc stage; nếu luồng
  khác thêm key sau thời điểm này, parent bump lại lúc gộp theo mẫu cũ.

### 0.2. Quét AST — phương pháp + so sánh với H7

Script quét viết lại (`/tmp/i9-scan.mjs`, TS compiler API, không stage —
script của H7 ở `/tmp` đã mất khi VM dọn): duyệt mọi
`StringLiteral` + `NoSubstitutionTemplateLiteral` + `TemplateHead` /
`TemplateMiddle` / `TemplateTail` + `JsxText`, không tính `*.test.*`,
không tính comment (comment không phải node AST). Kết quả:
**2069 literal / 65 file** (chi tiết §2).

So với H7 (1813 / 65 file): **+256**. Hai lần quét KHÔNG so trực
tiếp được vì script H7 đã mất — bằng chứng cho thấy phần chênh là do
cách đếm, không phải code mới: cùng một cây code, lần quét chỉ tính
string literal cho 1432, thêm template-span + JSX text cho 2069, còn
1813 của H7 nằm giữa (H7 có lẽ chỉ đếm một phần template span). Ngoài
ra vài file đổi sau quét của H7 do luồng round-80 khác
(`templates.ts` 575 → 629, `nestUtils` 177 → 202,
`nestedPreview` 112 → 147 — đều là nội dung/chẩn đoán, xem §2). Số
2069 này là baseline mới cho đợt sau; script + phương pháp ghi ở đây
để tái lập.

## 1. Việc đã làm

### 1.1. Không thêm key, không sửa code production — vì không còn rò thật

Mọi ứng viên "chuỗi UI thật" đều được truy vết tới tận nơi hiển thị
và đều rơi vào các nhóm ở §2. Hai ứng viên tưởng là rò, kiểm chứng kỹ
xong đều không phải:

1. **`fastMotion.ts` (EnhancePanel, 14 literal)** — cảnh báo denoise
   ghosting HIỂN THỊ THẬT trong panel, nhưng đã đi qua
   `fastMotionStrings(getLang())` đọc fragment `round64-r2.json` +
   `round65-s2.json` (đủ 7 key cả vi lẫn en) — và 7 key
   `enhance.fastMotion*` cũng đã có trong dict, byte-identical với
   fragment (test khóa §3). Chuỗi VI cứng trong file chỉ là fallback
   khi cả hai bảng đều thiếu key — không bao giờ tới được.
2. **`userLut.ts` (LutPicker, 13 literal)** — lỗi parse `.cube` HIỂN
   THỊ THẬT qua `setImportErr(e.message)`, nhưng `parseCube` nhận
   lookup `i18nT` và 11 key `userLut.*` ĐÃ CÓ trong dict, byte-identical
   với fragment `round57-n8.json` (test khóa §3 + test động: lỗi quá
   lớn / rỗng ném đúng câu EN). Suýt kết luận sai là "fragment chưa
   gộp" do kiểm tra nhầm tiền tố `lut.*` thay vì `userLut.*` — đã
   kiểm lại bằng `flatten` đầy đủ trước khi kết luận.

### 1.2. Đính chính H7 §2: `summarizeDiff` CÓ caller production

H7 ghi "`summarizeDiff` hiện không có caller production nào" — **sai**.
`projectHistory.ts:514` (`saveVersion`) gọi
`summarizeDiff(latest.spec, spec, lookup)`, và summary ĐƯỢC HIỂN THỊ:
toast `history.saved` (`HistoryPanel.tsx:86`) + cột "thay đổi" trong
bảng lịch sử (`HistoryPanel.tsx:208`). Tuy nhiên 9 key của nó
(`projectHistory.firstVersion/renamed/trackCount/addedClips/
removedClips/movedClips/trimmedClips/totalDuration/noContentChange`)
ĐỀU ĐÃ CÓ trong dict, vi/en đúng, placeholder khớp — và `saveVersion`
nhận lookup `t` từ HistoryPanel nên bản lưu mới theo đúng locale. Test
mới khóa cả 9 key + test động `summarizeDiff` với lookup en/vi.
**Hạn chế còn lại (ghi rõ, không sửa):** summary được nướng vào
IndexedDB lúc lưu theo locale khi đó — version lưu lúc vi vẫn hiện VI
khi xem ở locale en. Sửa đúng cách phải tính lại summary lúc hiển thị
từ spec đã lưu — ngoài phạm vi sweep i18n, để quyết định riêng.

### 1.3. Test mới: `apps/web/src/lib/i18nSweep81I9.test.ts` — 16/16

- Dict 2463/2463, cùng tập key, vi==en=60, placeholder khớp, không rỗng.
- 80 key fallback-chết (§2) đủ 2 bên, vi≠en, placeholder khớp, bản en
  không dấu VI (danh sách đầy đủ trong file test).
- Fragment == dict từng chữ: fastMotion 7 key (round64-r2 + round65-s2),
  userLut 11 key (round57-n8).
- Tĩnh: `syncProtocol` 0 importer production; `formatSanitizeSummary`
  chỉ còn 4 điểm chạm production (định nghĩa + 3 fallback store.ts);
  `discardRestore35R6` 0 importer production; `sample-nested` 0 importer
  production; `summarizeDiff` có caller `saveVersion` (đính chính H7).
- Tĩnh: store nuốt lỗi nest ở 11 action (`if ("error" in res) return
  false;`); `nestedSplitOffset` throw được giấu message gốc
  (`blocked("nested.splitOffsetCurveInvalid", true)`); preview failsoft
  truyền `i18nT` vào `buildPreviewSpecFailsoft`; decode-ahead reason
  đi qua 5 key `decodeahead.reason.*`.
- Động: `parseCube` lỗi quá lớn/rỗng ném câu EN qua lookup; `summarizeDiff`
  4 trường hợp (đầu tiên / đổi tên / thêm clip / không đổi) dịch đúng
  en/vi; `scanAvccZeroRun` 4 nhánh (quá ngắn / không phải avc1 / vi phạm
  / sạch) lý do toàn tiếng Anh; `fastMotionStrings("en")` toàn tiếng
  Anh, khớp dict từng chữ.

## 2. Phân loại 2069 literal (bảng đầy đủ)

| Nhóm (số literal) | Kết luận | Bằng chứng |
|---|---|---|
| `templates.ts` 629 | **Dữ liệu nội dung — không sửa** | Tên/mô tả template + text clip mẫu là nội dung video của user; dịch là đổi nội dung (tiền lệ G9 §2, H7 §2). |
| `ttsEstimate*` 346 (8 file) | **Chẩn đoán TTS — CẤM đụng** | Chuỗi trong module đo/ước lượng TTS (đợt 45–51); task cấm kiểm tra lại TTS 39/Gradio. Chỉ phân loại, không sửa, không import trong test mới. |
| `nestUtils.ts` 202 | **Chẩn đoán + lỗi nuốt — không sửa** | `{ error: "…" }` trả về: store nuốt ở 11 action (`return false`, test khóa §1.3); `twoLevelFail` đi qua `reasonCode` → `translateTwoLevelCheck` (store.ts:1982/2740/2785); 14 `throw` đều trong `nestedSplitOffset`, store catch và giấu message gốc (`blocked("nested.splitOffsetCurveInvalid")`, test khóa). |
| `nestedPreview.ts` 147 | **Đã key / chẩn đoán — không sửa** | 61 điểm `throw` đều qua `trKey` (đếm bằng script quét throw-site, §3); `note` của `TransitionVisual` không có consumer ngoài test (grep `.note`); failsoft `reason` lấy từ `e.message` của lỗi đã dịch qua lookup (`buildPreviewSpecFailsoft(rawSpec, i18nT)` trong preview.tsx, test khóa). |
| `projectRepo.ts` 76 | **Fallback chết — key đã có** | Warning blob-URL/missing-media là `StructuredNote.fallback` (key `structuredNotes.*` đã có); validate speed-curve dùng cặp message + `messageKey` (`speedCurve.shape/keyframesEmpty` đã có). |
| `transitionPreview.ts` 73 | **Chẩn đoán — không sửa** | `note` trong `TransitionVisual` (vd "crossfade tuyến tính") không có consumer UI nào (grep `TransitionVisual` ngoài file + test = 0); chỉ dùng trong probe report. |
| `curveFix.ts` 71 | **Đã key — không sửa** | `unsalvageableReason` đi kèm `unsalvageableReasonKey` (`curveFix.reasonShape/reasonEmpty` đã có); `formatSanitizeSummary` giữ theo lệnh (xem §4). |
| `mp4Demux.ts` 41 | **Đã key — không sửa** | 7/7 điểm `throw` qua `trKey` (`gop.demux.parserAvccTooShort/parserMoovMissing/...` đã có). |
| `gopRangeFetch39T3.ts` 39 | **Đã key — không sửa** | `throw new GopRangeFailure(trKey(...))` (`gop.range.statusNot206` đã có); trial-decode fail qua `gop.demux.trialDecodeFailed` với `{reason}` là lý do zero-run bằng tiếng Anh (xem dưới). |
| `settle*` 155 (6 file) | **Chẩn đoán — không sửa** | Chuỗi lý do trong báo cáo đo settling/probe (vd "proxy: ok=true + range mới … — NHƯNG drawn cross-check TRƯỢT"); chỉ dùng trong harness đo, không tới UI. |
| `twoLevelCurve.ts` 33 | **Đã key qua reasonCode — không sửa** | 18/18 điểm `throw` qua `trKey`; lý do trả về đi kèm `reasonCode`, UI dịch qua `translateTwoLevelCheck` (store.ts). |
| `discardRestore35R6.ts` 20 | **Module chết — GIỮ, xem §4** | 0 importer production (chỉ test của nó + 2 bảng đếm literal trong audit test M6/N8). |
| `projectHistory.ts` 18 | **Đã key — không sửa** | `summarizeDiff` 9 key đã có (đính chính H7, §1.2); `validateImport`/`openDb` 7 điểm `throw` qua `trKey` (`projectHistory.history*/noIndexedDb/indexedDbOpenFailed` đã có); `migrateVersions` 0 caller production (chỉ comment). |
| `cpuGate*` 24, `reverseRangeGate38U2.ts` 15 | **Chẩn đoán — không sửa** | Lý do cổng dạng mã `xxx: …` trong quyết định gate; UI decode-ahead hiển thị qua key `decodeahead.reason.*` (toggle map, test khóa), không hiện reason thô. |
| `userLut.ts` 16 + `webglLut.ts` 16 | **Đã key / chẩn đoán — không sửa** | `userLut`: 11/11 điểm `throw` qua `trKey`, key đã có (§1.1.2). `webglLut`: 12 `throw` thô nhưng `parseCubeData` không có caller production ngoài file, `loadCube` lỗi được nuốt (`.catch` → fallback CSS approx, badge "LUT CSS ≈"), `getLutTextureInfo` chỉ test/debug. |
| `reverseWebcodecs.ts` 9, `gopCache40V2.ts` 8, `gopTrialDecode55L8.ts` 5, `gopSizeProbe41W4.ts` 3, `gopTrialDecodeWorker62R4.worker.ts` 1 | **Đã key / chẩn đoán tiếng Anh — không sửa** | Lý do trial-decode/gate qua `trKey` (`gop.trial.*/gop.cache.*` đã có); riêng `scanAvccZeroRun` lý do viết bằng tiếng Anh từ đầu (mã chẩn đoán, test động 4 nhánh trong test mới); 1 `throw` thô duy nhất ở `buildGopSegment` ("sample … nằm ngoài buffer GOP") là lỗi bất biến nội bộ, caller `gopSampleData` nằm trong đường decode có catch/fallback. |
| `fastMotion.ts` 14 | **Đã key qua fragment — không sửa** | Xem §1.1.1: fragment đủ 2 bên + dict đủ, test khóa. `measureClipMotion` throw ("chỉ đo được … cặp frame") là chẩn đoán nội bộ, caller nuốt (không cache lỗi). |
| `EnhancePanel.tsx` 13, `SpeedPanel.tsx` 2, `Timeline.tsx` 1 | **Fallback chết — key đã có** | Toàn bộ là `enhanceT()/speedT()` đa dòng (literal nằm ở dòng riêng nên quét dòng đơn không nhận ra) — 15/15 key đã có trong dict (test khóa 80 key). |
| `assetStore.ts` 9 | **Chẩn đoán / khóa lưu trữ — không sửa** | 6 `throw` thô (IndexedDB/crypto/ingest) đều được nuốt ở caller (importFiles best-effort; StorageCleanupPanel `catch {}` không toast message); `"Dự án không tên"` ở L808 là tên fallback ghi vào sổ tham chiếu (cùng mẫu `FALLBACK_PROJECT_NAME`, không phải chuỗi UI). |
| `openProjectFlow.ts` 7 | **Fallback chết — key đã có** | Mẫu `{ code, params, fallback }` với key `structuredNotes.archiveHistory*` đã có; `historyError` thô chỉ dùng khi thiếu `historyErrorCode` (G9 đã ghi). |
| `safeArea.ts` 4 | **Dev-only — không sửa** | `validateSafeAreaPlatform` 0 caller production (chỉ test). |
| `subtitles.ts` 8 | **Đã key — không sửa** | `errBadTimestamp/errEndNotAfterStart/errEmptyCue` qua `trKey` + lookup từ CaptionModal; `CAPTION_TRACK_LABEL_PREFIX` là khóa nhận diện (khớp cả 2 tiền tố). |
| `rehydrate36S5.ts` 6 | **Đã wire ở H7 — không sửa thêm** | 6 chuỗi `reason` VI giữ làm fallback; `reasonKey` đã nối ở H7; hiện không UI nào đọc `skipped`. |
| `syncProtocol.ts` 6 | **Module chết — KHÔNG xóa theo lệnh** | 0 importer production (chỉ test); artefact thiết kế Q7, docs còn tham chiếu (H7 §2). |
| `reversePreviewGate.ts` 4 | **Đã wire ở H7 — không sửa thêm** | 4 hằng `REVERSE_*_VI` giữ làm fallback; `warningKeys` đã nối, test T2 khóa nội dung không vỡ. |
| `waveform.ts` 6, `thumbnails.ts` 1, `previewEngine.ts` 2, `preview.tsx` 2, `desktop.ts` 1, `projectId63R7.ts` 1, `sampleMedia.ts` 2, `templateEngine.ts` 2, `templatePack.ts` 2, `captions.ts` 2, `archive.ts` 2, `sample.ts` 6, `sample-nested.ts` 7, `store.ts` 2, `TtsButton.tsx` 2, `TemplatePackModal.tsx` 1, `presets.ts` 3, `loadReport.ts` 3, `projectAssetRefs62R7.ts` 1 (cộng 48) | **Đã key / chẩn đoán / dữ liệu / khóa — không sửa** | `motionBadgeText` qua `trKey(preview.motionInterp)`; preview/desktop là `console.*`; `thumbnails`/`projectId` throw được nuốt (`ClipWaveform` `.catch`); `templatePack/Engine` qua `trKey` (`templatePack.*`/`templateEngine.*` đã có); `captions` `CAPTION_TRACK_LABEL` chỉ còn test khóa (store dùng key `captions.trackLabel`); `archive` historyError qua code (`openProject.archiveHistory*` đã có); `loadReport` overflow qua `trKey(projectRepo.moreWarnings)`; `projectAssetRefs` là `FALLBACK_PROJECT_NAME` (khóa sổ); `sample*.ts`/`sampleMedia` là nội dung mẫu + canvas text trong media mẫu; `store.ts` 2× `"Dự án mới"` là khóa (`isDirty` so sánh tên, H7 §2); `TtsButton`/`TemplatePackModal` 2× `"Hải Đăng"` là tên giọng (dữ liệu). |

Tổng cộng các nhóm trên = **2069 literal / 65 file** (cộng lại từ
`/tmp/i9-scan.json` bằng script, đã đối chiếu đủ 65 file, không sót
file nào; nhóm LUT là 16 + 16 = 32, nhóm cuối 19 file = 48).

## 3. Kiểm chứng (chạy thật, từ gốc repo)

| Kiểm chứng | Kết quả |
|---|---|
| `i18nSweep81I9.test.ts` (mới, §1.3) | **16/16 pass** (esbuild esm + node; lần đầu 15/16 do đếm sai số lần nuốt lỗi store — thực tế 11, không phải 3 — đã sửa assertion theo đĩa, không nới lỏng) |
| `tsc --noEmit` (apps/web) | **0 lỗi** |
| `r6-i18n-check.cjs` | **PASS** (vi=2463 en=2463; literal i18nT 606; R6 458; transition 82; textanim 22) |
| `i18nAudit59P7.test.ts` (P7) | **8/8 pass** |
| `i18nOrphans60Q4.test.ts` | **16/16 pass** (0 key mồ côi với 2463 key) |
| `i18nModals80H7.test.ts` | **13/13 pass** (sau bump I6 lên 2463) |
| `i18nModals79G9.test.ts` | **9/9 pass** |
| `vite build` | **BỎ QUA** — I9 không sửa code production/UI nào (chỉ thêm 1 file test + LIMITS này); test file không nằm trong bundle app. Ghi rõ để đợt sau khỏi tưởng thiếu. |
| `tsc` desktop | **BỎ QUA** — không đụng `apps/desktop`. |

Quét throw-site bổ sung (script đếm `throw new Error(` kèm `trKey` /
`messageKey` / `reasonKey` trong 4 dòng sau, chạy trên 29 file):
`nestedPreview` 61 keyed / 0 raw; `twoLevelCurve` 18/0; `mp4Demux` 7/0;
`userLut` 11/0; `projectHistory` 7/0; `loadReport` 1/0;
`webglLut` 0/12 raw (đường chết — xem §2); `waveform` 0/6 raw (nuốt ở
`ClipWaveform`); `assetStore` 0/6 raw (nuốt ở caller); `nestUtils`
0/14 raw (chỉ trong `nestedSplitOffset`, store catch + giấu message);
`syncProtocol` 0/2 raw (module chết); `projectId63R7` 0/1 raw (lỗi
tham số); `gopCache40V2` 0/1 raw (`buildGopSegment`, bất biến nội bộ);
`captions` 0/3 "raw" là dương tính giả của máy đếm (dùng `t("…")`,
không phải chuỗi thô). Không file nào còn `throw` VI tới được UI mà
chưa có key hoặc chưa được nuốt.

## 4. Giới hạn trung thực / nợ còn lại

1. **Dict 2463 là số tại thời điểm I9 stage.** Các luồng đợt 81 khác
   vẫn đang chạy song song và có thể thêm key sau thời điểm này; parent
   lúc gộp phải đếm lại và bump các test khóa số key nếu tổng khác 2463
   (mẫu: I6 đã bump đủ 16 file khi thêm 2 key — xem §0.1).
2. **Không test headed** cho các đường đã dịch (toast history, lỗi
   `.cube`, cảnh báo fastMotion) — bằng chứng là test động Node (lookup
   thật từ dict + hàm thật) + kiểm tra tĩnh call-site. Render thật cần
   click-test headed riêng.
3. **`formatSanitizeSummary` không xóa + `syncProtocol.ts` không xóa**
   (lệnh từ H7, giữ nguyên) — xem §2. Ngoài ra I9 cũng KHÔNG xóa
   `discardRestore35R6.ts` / `sample-nested.ts` dù cả hai đều 0 importer
   production: (a) pipeline stage của vòng lặp (paths-loop liệt kê file
   để đẩy lên) không có cách diễn đạt "xóa file" — file xóa ở local sẽ
   không được đẩy đi, vẫn nằm trên GitHub, gây lệch cây; (b) cả hai đều
   được docs LIMITS nhiều đợt tham chiếu như artefact (discardRestore:
   8 docs; sample-nested: demo nested). Quyết định xóa (nếu có) thuộc
   về parent/user, kèm thao tác xóa trực tiếp trên GitHub.
4. **Summary lịch sử nướng theo locale lúc lưu** (xem §1.2) — version
   lưu lúc vi vẫn hiện VI khi xem ở locale en. Không phải thiếu key.
5. **Tên project mặc định `"Dự án mới"` / `"Dự án mẫu"`** và tên giọng
   `"Hải Đăng"` vẫn hiện nguyên văn ở locale en — đây là dữ liệu/khóa
   (tên project là nội dung do user đặt hoặc mặc định của project; tên
   giọng là tên riêng), không phải chuỗi UI — giữ theo tiền lệ H7 §2.
   Nếu user muốn project mặc định đa ngôn ngữ thì đó là quyết định sản
   phẩm riêng.
6. **Fallback `enhance.previewApprox` trong code đã cũ** so với dict:
   chuỗi cứng trong `EnhancePanel.tsx` ngắn hơn giá trị vi trong dict
   (dict có thêm chi tiết khử răng cưa). Fallback chết (key đã có) nên
   không ảnh hưởng UI; ghi ở đây để đợt sau khỏi tưởng là lệch dịch.
   Không sửa trong I9 vì không đổi hành vi.
7. **Quét AST không bao phủ `server/`** (Python/bridge) và không bao phủ
   `apps/desktop` — chỉ quét `apps/web/src`. Chuỗi VI trong log server
   không tới UI web.
8. **Rủi ro ghi đè dict chung:** `vi/en.json` là file chung; I6 đã ghi
   trong lúc I9 chạy (18:40 +07). I9 KHÔNG ghi dict nên không xung đột;
   test mới khóa đúng số 2463 tại thời điểm stage. Parent gộp phải đếm
   lại + chạy `i18nOrphans` / `r6-i18n-check` trên cây đã gộp.

## 5. Nợ mở cho đợt sau

1. **N2 coi như ĐÓNG ở tầng UI** sau H7 + I9: quét toàn `src` (2069
   literal) không còn rò UI thật nào; mọi nhóm còn lại đều đã xác minh
   là fallback chết / chẩn đoán / dữ liệu nội dung / module chết giữ
   theo lệnh. Đề nghị cập nhật hàng N2 trong gap analysis (trạng thái
   "xong ở tầng UI", kèm trỏ LIMITS H7 + LIMITS này).
2. **Summary lịch sử theo locale lúc lưu** (§4.4) — nếu muốn sửa: tính
   lại summary lúc hiển thị từ spec đã lưu thay vì đọc chuỗi đã nướng.
3. **`discardRestore35R6.ts` / `sample-nested.ts`** — quyết định giữ
   hay xóa hẳn (xem §4.3).
4. **`syncProtocol.ts` / `formatSanitizeSummary`** — quyết định giữ hay
   xóa vẫn thuộc về parent (H7 §5).
5. **TTS 39 / Gradio** — vẫn cấm kiểm tra lại; `ttsEstimate*` (346
   literal) chỉ được phân loại, chưa đụng.

## 6. File trong batch (stage, không push)

- `apps/web/src/lib/i18nSweep81I9.test.ts` (mới — test khóa 16/16, §1.3)
- `docs/PHASE9_ROUND81_I9_I18N_SWEEP_LIMITS.md` (mới — file này)

I9 KHÔNG sửa `vi.json`/`en.json` (dict 2461 → 2463 là của luồng I6,
đã nằm trong batch của I6 / cây chung — không liệt kê lại ở đây để
tránh trùng batch). Không sửa code production, không sửa test của luồng
khác (chỉ đọc), không binary, không file `.github/workflows/*`.
