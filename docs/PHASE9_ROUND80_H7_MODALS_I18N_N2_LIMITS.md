# Phase 9 — Đợt 80, luồng H7: Modals i18n — wire phần còn chết + quét chuỗi cứng sub-panel (nợ đợt 79 G9 §5 + gap N2 §2.7)

> **Kết luận trước (đọc dòng này là đủ): N2 thu hẹp về đúng 1 rò rỉ UI thật
> còn lại — 3/4 chuỗi cảnh báo cổng phát ngược (`reversePreviewGate`) hiện
> nguyên văn tiếng Việt trong toast + title badge decode-ahead ở locale en
> — nay đã wire xong qua `warningKeys` (4 key `reverseGate.*`) + dịch tại
> `preview.tsx`. Thêm 6 key `rehydrate.*` (`reasonKey` song song lý do
> skipped) và nối `lookup` cho tên mặc định của `serializeProject`.
> Dict 2425 → 2461 (10 key H7 + 9 key H10 + 17 key aiJob của 2 luồng
> round-80 khác). Test mới `i18nModals80H7.test.ts` 13/13. tsc web 0,
> desktop 0, vite build pass, r6-i18n-check PASS, i18nOrphans 16/16,
> P7 8/8. Mọi hạng mục còn lại trong nợ G9 §5 đều được xác minh bằng
> bằng chứng là fallback chết / chẩn đoán không tới UI / code chết không
> xóa được (xem §2) — KHÔNG wire thêm. 5 suite modal/CSS đỏ lúc kiểm
> chứng lại đều do luồng round-80 khác sửa file trong lúc H7 chạy (xem
> §3.2, không phải hồi quy của H7).**

Ngày: 10/11/2026 (lượt cron 15:35 +07). Repo: `~/workspace/repo-1`.
KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Đối chiếu nhiệm vụ với trạng thái trên đĩa (kiểm chứng trước khi sửa)

Nhiệm vụ giao 2 việc: (1) wire nợ G9 §5 (fallback chết / dữ liệu nội dung /
chẩn đoán trong i18n modals), (2) quét AST toàn `src` tìm chuỗi VI cứng
trong ~15 sub-panel N2 + thông báo drop. Kiểm tra trực tiếp trên đĩa cho
thấy phần lớn nợ G9 §5 đã là fallback chết hoặc không tới UI — chỉ 3 cụm
còn rò thật, xem §1. Quét AST toàn `apps/web/src` (script tạm
`/tmp/h80-scan.mjs`, TypeScript compiler API, không stage): **1813 literal
VI trong 65 file** (không tính `*.test.*`, không tính comment) — nhưng sau
đối chiếu từng đường tới UI, chỉ 3 cụm ở §1 là UI thật chưa wire; còn lại
là fallback của key đã có, dữ liệu nội dung, chẩn đoán/dev-only, hoặc
module chết (bảng §2).

## 1. Việc đã làm

### 1.1. Mười key mới (vi/en, placeholder khớp, vi ≠ en)

| Key | vi | en |
|---|---|---|
| `reverseGate.experimentWarning` | Phát ngược bằng decode-ahead chỉ là thử nghiệm opt-in: chỉ bật cho footage dễ decode hoặc máy đã chứng minh có hardware decode; không đảm bảo 30 fps ngược cho mọi footage. | Reverse playback via decode-ahead is an opt-in experiment: only enable it for easy-to-decode footage or on a machine proven to have hardware decode; it does not guarantee 30 fps reverse for all footage. |
| `reverseGate.underLoadWarning` | Số đo decode dùng để mở cổng này đo dưới tải (under-load), không phải số quiet — nhịp ngược thực tế có thể thấp hơn khi máy bận. | The decode measurements that opened this gate were taken under load, not quiet — actual reverse pace may be lower when the machine is busy. |
| `reverseGate.noHardwareWarning` | Máy này chưa chứng minh có hardware decode — phát ngược footage nặng bằng decode phần mềm có thể rớt dưới 30 fps. | This machine has not proven hardware decode — reverse-playing heavy footage with software decode may drop below 30 fps. |
| `reverseGate.proxyMainNote` | Proxy chỉ phục vụ preview (export vẫn dùng file gốc). Chọn proxy làm hướng chính cho chiều ngược vẫn cần số đo fps ngược thật trên đúng cặp gốc/proxy, không suy từ độ phân giải. | Proxies serve preview only (export still uses the original file). Choosing a proxy as the main direction for reverse still needs real measured reverse fps on the exact original/proxy pair, not inferred from resolution. |
| `rehydrate.reasonAssetGone` | asset không còn trong IndexedDB (đã xoá hoặc project mở ở máy khác). | asset is no longer in IndexedDB (deleted, or the project was opened on another machine). |
| `rehydrate.reasonBlobStale` | blob: URL chỉ sống trong phiên cũ; reload tạo document mới nên URL chết. | blob: URL only lives in the previous session; reload creates a new document so the URL is dead. |
| `rehydrate.reasonSelfSufficient` | src tự đủ (http/data), không cần nạp lại qua media bin. | src is self-sufficient (http/data), no need to reload it through the media bin. |
| `rehydrate.reasonNoManifest` | không có manifest cùng originalName trong AssetStore (media chưa từng được ingest). | no manifest with the same originalName in AssetStore (media was never ingested). |
| `rehydrate.reasonUnknownSrc` | dạng src không nhận diện được để nạp lại. | unrecognized src format for reload. |
| `rehydrate.reasonAssetGoneBytes` | asset không còn trong IndexedDB (đã xoá bytes hoặc project mở ở máy khác). | asset is no longer in IndexedDB (bytes deleted, or the project was opened on another machine). |

Dict: **2425 → 2461 key lá mỗi bên** (vi == en, cùng tập key, placeholder
khớp). Thành phần, đếm trực tiếp từ đĩa lúc stage: 2425 (baseline đợt 79)
+ 9 key đợt 80 H10 (social presets: 7 `exportPreset.*` + 2
`safeArea.platform*`, xem `docs/PHASE9_ROUND80_H10_SOCIAL_PRESETS_LIMITS.md`)
+ 10 key H7 + 17 key `aiJob.*` (luồng round-80 khác, nhóm mới — chưa rõ
tên luồng lúc stage, chưa có LIMITS doc của luồng đó trong `docs/`).
Số key vi==en: **54 → 60** — 6 key mới giống hệt 2 bên đều của H10
(`exportPreset.tiktokLabel/reelsLabel/shortsLabel/sizeSummaryMax` +
`safeArea.platformReels/platformShorts`; tên riêng + mẫu định dạng, hợp lệ
như tiền lệ đợt 73 LIMITS §2). Đã bump 54 → 60 ở cả 3 test khóa
(`i18nOrphans60Q4`, `i18nAudit59P7`, `codecProbeUi75C6` — bản sau có thêm
bản sao thứ ba mà G9 không liệt kê).

### 1.2. Code sửa — reverseGate warnings (rò rỉ UI thật duy nhất)

Bằng chứng rò: 4 hằng `REVERSE_*_VI` trong `reversePreviewGate.ts`
được đẩy vào `warnings` của decision; `reverseWebcodecs.ts` mirror lên
`decodeAheadWarnings`; `preview.tsx` `refreshDecodeAheadUi` hiện nguyên
văn ở 3 chỗ — toast (`for (const w of st.warnings) pushToast(w, "info")`,
L2878 cũ), title nút toggle khi đang chạy, title badge khi đang chạy.
Comment "luật T2" (đợt 37 T2: hiển thị nguyên văn) là quyết định cũ; nhiệm
vụ H7 giao wire sau khi xác minh chuỗi nào tới UI — đã xác minh 3/4 tới UI
nên wire theo mẫu `reasonKey` sẵn có trong repo (curveFix/store), KHÔNG
đổi luật T2 ở tầng cổng:

1. **`lib/reversePreviewGate.ts`** — `DecodeAheadDecision` +
   `ProxyMainDirectionDecision` thêm `warningKeys: string[]` (song song
   1:1 với `warnings`, cùng thứ tự). `resolveDecodeAheadGate` đẩy key
   `reverseGate.experimentWarning` / `underLoadWarning` /
   `noHardwareWarning` cùng lúc với từng warning; blocked → `[]`.
   `resolveProxyMainDirection` mang `["reverseGate.proxyMainNote"]` ở mọi
   verdict. Các hằng `*_VI` và trường `warnings` giữ nguyên (fallback cho
   decision cũ + test T2 khóa nội dung không vỡ).
2. **`lib/reverseDecodeAheadToggle.ts`** — `aggregateDecodeAheadDecisions`
   gộp `warningKeys` song song (khử trùng, giữ thứ tự; decision cũ không
   có key → coi như rỗng); blocked → `[]`.
3. **`lib/reverseWebcodecs.ts`** — controller thêm field
   `decodeAheadWarningKeys` + getter `decodeAheadWarningKeyList`, set/clear
   cùng vòng đời với `decodeAheadWarnings` (enable/disable/dispose);
   `lastGateDecisionForController` copy kèm key; hàm mới
   `reverseDecodeAheadWarningKeys()` (hợp các controller, khử trùng);
   `ReverseDecodeAheadStatus` thêm `warningKeys`, `decision` copy kèm key.
   Mirror `window.__vcutReverseDecodeAheadWarnings` giữ nguyên chuỗi thô
   (dev-only).
4. **`preview.tsx`** — `refreshDecodeAheadUi` tính `warningLines` /
   `warningText` từ `st.warningKeys` qua `i18nT` khi có key, fallback về
   `st.warnings` nguyên văn khi decision cũ chưa mang key; dùng ở cả 3 chỗ
   (toast, title nút, title badge). Key dedupe toast theo text đã dịch.
   (Sửa phụ trong lúc edit: khôi phục dòng `private decodeAhead` bị xóa
   nhầm ở lần edit đầu — tsc báo 5 lỗi TS2339, đã sửa ngay, tsc 0 sau đó.)

Lưu ý: `resolveProxyMainDirection` hiện **không có caller production nào**
(chỉ test) nên `reverseGate.proxyMainNote` chưa tới UI qua đường này — key
đi kèm để caller tương lai dịch đúng, không claim đã hiện UI.

### 1.3. Code sửa — rehydrate reasonKey + serializeProject lookup

5. **`lib/rehydrate36S5.ts`** — `RehydrateSkipped` + `RehydrateSkippedBin`
   thêm `reasonKey?: string`; 6 điểm push `skipped` đều set key tương ứng
   (§1.1). `reason` giữ nguyên từng chữ (test cũ khóa nội dung không vỡ).
   Ghi rõ: hiện KHÔNG UI nào đọc trường `skipped` (`App.tsx` /
   `openProjectFlow.ts` chỉ dùng `items` + `staleProxies`) nên đây là
   wiring phòng ngừa theo mẫu `reasonKey`, không phải sửa rò đang hiện.
6. **`lib/projectRepo.ts` + 2 caller** — `serializeProject` nhận thêm tham
   số tùy chọn cuối `lookup?: I18nLookup`; tên envelope khi `name` rỗng
   nay qua `trKey(lookup, "projectRepo.untitledProject", {}, "Dự án không
   tên")` thay cho literal VI. Không lookup → fallback VI cũ (hành vi cũ).
   `archive.ts` (`exportArchive`) và `openProjectFlow.ts` (lưu `.vcut`)
   truyền `(k, vars) => t(k, vars)`. Key `projectRepo.untitledProject` đã
   có từ đợt 60 Q4.

### 1.4. Bump số key (16 file test)

Dict 2425 → 2461 (xem §1.1): bump assert + tên test + chuỗi lịch sử ở 15
file khóa số key (mẫu G9 §1.3): `speedWarnTooShortDead63R10` (comment),
`ProjectMenu.i18n55L1`, `saveToast31`, `structuredNotes32`,
`errorDetail34Q4` (comment), `codecProbeDebts76D8` (comment),
`reverseBadge46B6`, `reverseCompat44Z6`, `reversePlaybackI18n49E2`,
`reverseToggleI18n48D4`, `i18nAudit59P7`, `i18nOrphans60Q4`,
`codecProbeUi75C6`, `i18nRound57N4`, `i18nModals79G9` — chỉ đổi số +
chuỗi lịch sử, không đổi logic test nào khác. Ngoài ra bump 54 → 60 ở 3
test khóa số key vi==en (§1.1).

### 1.5. Test mới: `apps/web/src/lib/i18nModals80H7.test.ts` — 13/13

- Dict 2461/2461, cùng tập key, 10 key mới đủ 2 bên, vi ≠ en, placeholder
  khớp, bản en không còn dấu tiếng Việt.
- Gate: allowed easy+quiet (không HW) → 2 warnings + 2 keys 1:1, dịch vi
  khớp từng chữ warnings gốc; under-load → thêm key thứ 3; HW đã chứng
  minh → chỉ còn 1 key; blocked → `[]`. Proxy direction: mọi verdict đều
  mang `proxyMainNote`. Aggregate: gộp key khử trùng, giữ thứ tự.
- Rehydrate: 5 lý do `planRehydrate` + 1 lý do `planRehydrateBin` đều có
  `reasonKey`, vi dịch khớp `reason` từng chữ, en không dấu VI.
- `serializeProject`: name rỗng + lookup en → `"Untitled project"`; không
  lookup → `"Dự án không tên"`; tên có sẵn giữ nguyên.
- Hồi quy tĩnh: `preview.tsx` không còn `st.warnings.join` /
  `for (const w of st.warnings)`; `reverseWebcodecs.ts` có
  `reverseDecodeAheadWarningKeys` + getter + `warningKeys` trong status.
- Chạy bằng esbuild bundle `--format=esm` (mẫu G9): 13/13 pass.

## 2. Phương pháp quét + phân loại (vì sao chỉ 10 key, không phải "hết hardcode")

Quét AST toàn `apps/web/src` (script tạm `/tmp/h80-scan.mjs`, TS compiler
API, không stage): **1813 literal VI / 65 file** (không tính test, không
tính comment). Phân loại theo "chuỗi có tới mắt user không", truy vết từng
đường tới UI (toast/note/dialog/badge/title):

| Nhóm | Kết luận | Bằng chứng |
|---|---|---|
| EnhancePanel 13 literal / SpeedPanel 2 / Timeline badge 1 | **Fallback chết** — key đã có trong dict | Toàn bộ là đối số fallback của `enhanceT()`/`speedT()` với key `enhance.*` / `speed.curveStab*` đã có vi/en (kiểm tra trực tiếp 17/17 key). UI lấy từ dict. |
| Thông báo drop | **Đã wire từ trước** — N2 lỗi thời | `Timeline.tsx` onDrop → `validateDrop` (`lib/drop.ts`) trả `reason` qua `i18nT("drop.locked/wrongKind/overlap")`, `kindLabel` qua key `drop.kind*`; key đã có đủ. |
| projectRepo warnings blob-URL (L405–406) + missing-media (L437–438) | **Fallback chết** | Là `StructuredNote.fallback`; key `structuredNotes.blobUrl` / `archiveMissingExport` / `archiveMissingImport` đã có vi/en; UI (`formatNoteLines`) dịch qua key, fallback chỉ dùng khi key vắng. Tương tự `openProjectFlow.ts` L265/279/287/303 (`structuredNotes.archiveHistory*` đã có). |
| projectHistory `summarizeDiff` (10) + lỗi IndexedDB/history (8) | **Fallback chết / đã key** | Đều qua `trKey(lookup, "projectHistory.*")`, key đã có. `summarizeDiff` hiện không có caller production nào. |
| curveFix sanitize reasons + `changeItems` + `reasonKey` | **Đã key** | `unsalvageable[].reasonKey` (`curveFix.reasonShape/Empty/AllDropped`, key đã có) + `changeItems` (`curveFix.change*`, 11/11 key đã có) → `formatSanitizeSummaryLocalized` / `formatFixEntryChanges` dịch qua key; chuỗi VI chỉ là fallback khi key vắng. |
| `formatSanitizeSummary` (bản không-lookup) | **Chết ở production, KHÔNG xóa** | Chỉ còn là fallback `summary ?? formatSanitizeSummary(res)` trong 3 store action; cả 3 caller production (`ExportPanel` L618, `App.tsx` L148/181/207) đều truyền summary đã dịch. Hàm vẫn được 3 test dùng trực tiếp (khóa output VI) nên không phải code chết theo nghĩa "không ai dùng" — giữ nguyên, ghi rõ ở đây thay vì xóa + sửa test lan man. |
| nestUtils (177) | **Không tới UI** | Store nuốt lỗi (`nestClips`/`unnestClip`/… trả `false`/`null`, không toast `error`); panel toast qua `i18nT("nested.*")`; hai tầng dịch qua `reasonCode` → `translateTwoLevelCheck` (`nestedRejection.ts`); action deep trả `reason` đã dịch + `reasonKey` (đợt 21 T3). Chuỗi VI là diagnostic nội bộ của hàm thuần. |
| safeArea validate (4) | **Dev-only** | `validateSafeAreaPlatform` chỉ test dùng (`safeArea73A9.test.ts`); 0 caller production. Không wire. |
| syncProtocol (6) | **Module chết — KHÔNG xóa** | 0 caller production trong toàn repo (chỉ `syncProtocol.test.ts` import); N8 LIMITS đã ghi nhận. Đây là bản cài đặt tham chiếu của giao thức Q7, docs (`Q7_LIMITS.md`, `docs/SYNC_PROTOCOL.md`) còn tham chiếu — xóa module + test sẽ phá artefact thiết kế đã ghi. Ghi rõ bằng chứng ở đây, để quyết định xóa (nếu có) cho parent/user. |
| rehydrate (6) | **Wire phòng ngừa** (§1.3) | `skipped` không UI nào đọc (xem §1.3); thêm `reasonKey` để caller tương lai dịch được. |
| reversePreviewGate (4) | **Rò thật — ĐÃ WIRE** (§1.2) | 3/4 tới UI (toast + title); 1/4 (`proxyMainNote`) chưa có caller. |
| Nội dung template/sample (`templates.ts` 575, `sample*.ts`, câu mẫu TTS, tên giọng "Hải Đăng", `CAPTION_TRACK_LABEL_PREFIX`, `FALLBACK_PROJECT_NAME`, `"Dự án mới"` ở `store.ts`) | **Không sửa — dữ liệu / khóa** | Như G9 §2: tên/mô tả template + text clip mẫu là nội dung video của user, dịch là đổi nội dung; hằng nhận diện/khóa đổi theo locale sẽ vỡ khóa (`isDirty` so `meta.name !== "Dự án mới"`, nhận diện track khớp 2 tiền tố). |
| Chẩn đoán/dev-only (`ttsEstimate*` ~337, `settle*` ~126, `transitionPreview` 73, `gop*`, `cpuGate*`, `reverse*` còn lại, `discardRestore`, `nestedPreview` 112, `twoLevelCurve`, `waveform`, `mp4Demux`, `userLut`, `webglLut`, `loadReport` fallback, `subtitles.ts` err* đã key, `archive.ts` historyError giữ theo G9, `desktop.ts` console, `preview.tsx` console) | **Không sửa** | Chuỗi trong báo cáo chẩn đoán, `throw`/`console.*`, mã lý do worker, hoặc fallback của key đã có (`subtitles.err*`, `projectRepo.moreWarnings`, `loadReport` overflow). Không tới UI web. |

## 3. Kiểm chứng (chạy thật, từ gốc repo)

| Kiểm chứng | Kết quả |
|---|---|
| `i18nModals80H7.test.ts` (mới, §1.5) | **13/13 pass** (esbuild esm + node) |
| `tsc --noEmit` (apps/web) | **0 lỗi** (sau khi sửa lỗi tự gây: xóa nhầm dòng `private decodeAhead`, xem §1.2) |
| `tsc -p tsconfig.json` (apps/desktop) | **0 lỗi** |
| `vite build` (apps/web) | **pass** — `✓ built in 1m 4s`; JS 1,597.08 kB (cảnh báo chunk >500 kB có sẵn từ trước; tăng ~15 kB so với G9 là code các luồng khác, không phải H7) |
| `r6-i18n-check.cjs` | **PASS** (vi=2461 en=2461; literal i18nT 605; R6 458; transition 82; textanim 22). Lần chạy đầu đỏ 2 lỗi do comment trong test mới của H7 chứa chuỗi `i18nT("nested.*")` mà regex của script quét cả comment — đã sửa comment, chạy lại PASS. Bài học: không viết mẫu `i18nT("...")` trong comment. |
| `i18nOrphans60Q4.test.ts` | **16/16 pass** (0 key mồ côi với 2461 key) |
| `i18nAudit59P7.test.ts` (P7) | **8/8 pass** |
| `escapeModals59P2.test.ts` | **26/26 pass** |
| `escapeForms60Q10.test.ts` | **15/15 pass** |
| `welcomeEscape58O1.test.ts` | **9/9 pass** |
| `silenceModal57N1.test.ts` | **11/11 pass** |
| `i18nModals79G9.test.ts` | **9/9 pass** |
| `reversePreviewGate.test.ts` | **12 pass** |
| `reverseDecodeAheadWiring37T2.test.ts` | **12/12 pass** (warnings VI cũ giữ nguyên → test T2 không vỡ) |
| `rehydrate36S5.test.ts` | **27 pass, 0 fail** |
| `projectRepo.test.ts` | **10 pass, 0 fail** |
| `saveToast31` / `structuredNotes32` | **15 pass** / **12 pass** |
| `reverseBadge46B6` / `reverseCompat44Z6` | **8/8** / **10/10** |
| `reversePlaybackI18n49E2` / `reverseToggleI18n48D4` | **3/3** / **3/3** |
| `i18nRound57N4` | **14 pass** |
| `codecProbeUi75C6` | **16/16 pass** (sau bump 54→60, xem §3.1) |
| `ProjectMenu.i18n55L1` | **6/6 pass** (BẮT BUỘC `--format=cjs` theo header test; esbuild esm fail giả do react-dom `require("stream")`) |
| `errorDetail34Q4` | **35 pass** |
| `codecProbeDebts76D8` | **14/14 pass** |
| `speedWarnTooShortDead63R10` | **5/5 pass** |

### 3.1. Ba test từng đỏ trong lúc chạy — đều đã sửa đúng nguyên nhân, không phải đỏ chờ gộp

1. `i18nOrphans60Q4` 15/16 + `i18nAudit59P7` 7/8 + `codecProbeUi75C6`
   15/16: cùng 1 check — số key vi==en 54 → 60 do **H10** thêm 6 key
   giống hệt 2 bên (xem §1.1). Đã bump 54 → 60 ở cả 3 file kèm chú thích
   thành phần (mẫu parent gộp đợt 73).
2. `r6-i18n-check` đỏ 2 lỗi do comment test H7 (xem bảng trên) — đã sửa.

### 3.2. Năm suite đỏ do luồng round-80 khác sửa file trong lúc H7 chạy — KHÔNG phải hồi quy H7, KHÔNG sửa

H7 không chạm các file này (mtime + nội dung đối chiếu dưới đây đều là
luồng khác, sau khi H7 bắt đầu 15:35):

| Suite | Lỗi | File luồng khác sửa (mtime UTC 10/11) |
|---|---|---|
| `modalClasses59P4` | `checkI18n` Caption: thiếu `bgremove.cancel` trong `t("...")` của CaptionModal | `components/CaptionModal.tsx` 09:07:22 — bỏ call site `t("bgremove.cancel")` |
| `cssClasses60Q2` | class chưa định nghĩa: `.perf-fps-btn`, `.perf-fps-panel` | `components/PerfOverlay.tsx` 09:10:39 — thêm 2 class chưa có trong CSS |
| `cssClasses61R4` | class chưa định nghĩa mới: `perf-fps-btn`, `perf-fps-panel` | cùng PerfOverlay trên |
| `modalCard58O4` | Scene: số call site i18nT() phải = 32, nhận 33 | `components/SceneModal.tsx` 09:08:22 — thêm 1 call site |
| `captionModal60Q3` | 20 passed, 3 failed: mất nút Huỷ lúc running; `t()` còn 58 call site | cùng CaptionModal trên |

Parent chạy lại 5 suite này sau khi gộp đợt 80; luồng sở hữu các file
đó tự cập nhật test khóa của chúng trong batch của mình. H7 không sửa test
khóa của luồng khác, không sửa file của luồng khác.

## 4. Giới hạn trung thực / nợ còn lại

1. **Dict 2461 là số tại thời điểm H7 stage (09:05 UTC, ổn định tới
   09:29).** Các luồng đợt 80 khác vẫn đang chạy song song và có thể thêm
   key sau thời điểm này; parent lúc gộp phải đếm lại và bump các test
   khóa số key nếu tổng khác 2461 (mẫu: §1.4). Riêng nhóm `aiJob.*` (17
   key) chưa rõ luồng nào — parent xác nhận tên luồng lúc gộp.
2. **Không test headed** cho toast/title decode-ahead đã dịch — bằng chứng
   là test động Node (gate thật + lookup thật từ dict) + kiểm tra tĩnh
   `preview.tsx` dùng `warningLines`. Render thật của badge/toast cần
   click-test headed riêng (bật decode-ahead trên footage dễ decode).
3. **`warningKeys` chỉ đi kèm decision mới.** Decision cũ (nếu có nơi nào
   tự dựng literal `DecodeAheadDecision` không có key — đã grep: chỉ còn
   trong test) sẽ rơi về hiển thị nguyên văn qua fallback ở `preview.tsx`.
4. **`formatSanitizeSummary` không xóa** (xem §2) — vẫn là hàm export tạo
   chuỗi VI, nhưng không còn đường production nào tới được nó (mọi caller
   đều truyền summary đã dịch). Nếu parent muốn xóa hẳn thì phải sửa 3
   test khóa output VI của nó + 3 fallback trong `store.ts`.
5. **`syncProtocol.ts` không xóa** (xem §2) — module chết nhưng là artefact
   thiết kế Q7 có test + docs tham chiếu; quyết định xóa thuộc về parent.
6. **Quét AST không bao phủ `server/`** (Python/bridge) — chỉ quét
   `apps/web/src`. Chuỗi VI trong server log không tới UI web.
7. **Rủi ro ghi đè dict chung:** `vi/en.json` là file chung, 3 luồng
   round-80 cùng sửa trong đợt này (H7 + H10 + aiJob). H7 đã xác minh key
   của mình còn nguyên sau lần ghi 09:05 UTC của luồng khác (đếm lại
   2461, key sets khớp). Parent gộp phải đếm lại + chạy `i18nOrphans` /
   `r6-i18n-check` trên cây đã gộp trước khi coi là xong.

## 5. Nợ mở cho đợt sau

1. **N2 coi như đóng ở tầng sub-panel + drop + modal** sau H7 (rò UI thật
   cuối cùng đã wire). Còn lại trong §2 đều là fallback chết / chẩn đoán /
   dữ liệu nội dung — nếu user muốn template đa ngôn ngữ thì đó là quyết
   định sản phẩm riêng, không phải bug i18n. Đề nghị cập nhật hàng N2
   §2.7 trong gap analysis (trạng thái "xong ở tầng UI", kèm trỏ LIMITS
   này + G9).
2. **5 suite §3.2** — chạy lại sau gộp đợt 80 (CaptionModal / SceneModal /
   PerfOverlay thuộc luồng khác).
3. **`syncProtocol.ts`** — quyết định giữ hay xóa module chết (xem §2).
4. **`formatSanitizeSummary`** — quyết định xóa hẳn hay giữ làm fallback
   tham chiếu (xem §2).

## 6. File trong batch (stage, không push)

- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (+10 key H7;
  file chung — xem §4.1 về số đếm lúc stage)
- `apps/web/src/lib/reversePreviewGate.ts`, `apps/web/src/lib/reverseDecodeAheadToggle.ts`,
  `apps/web/src/lib/reverseWebcodecs.ts`, `apps/web/src/preview.tsx` (wire reverseGate, §1.2)
- `apps/web/src/lib/rehydrate36S5.ts` (reasonKey, §1.3)
- `apps/web/src/lib/projectRepo.ts`, `apps/web/src/lib/archive.ts`,
  `apps/web/src/lib/openProjectFlow.ts` (lookup serializeProject, §1.3)
- `apps/web/src/lib/i18nModals80H7.test.ts` (mới, §1.5)
- 15 file test bump 2425 → 2461 + 3 file bump vi==en 54 → 60 (§1.4, §3.1)
- `docs/PHASE9_ROUND80_H7_MODALS_I18N_N2_LIMITS.md` (mới — file này)

Không sửa CSS, không sửa code modal (CaptionModal/SceneModal/PerfOverlay
là của luồng khác), không binary, không file `.github/workflows/*`.
`preview.tsx` trong batch mang cả thay đổi của luồng khác lúc 08:55 UTC
(file chung — parent gộp khử trùng theo mẫu push #4).
