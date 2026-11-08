# Phase 9 — Đợt 60, luồng Q4: dọn key i18n mồ côi + wiring fragment diagnostic GOP

**Ngày:** 2026-11-08 (rạng sáng, Asia/Saigon). **Phạm vi:** chỉ sửa file text trong `~/workspace/repo-1`, KHÔNG push, KHÔNG release/tag.

**Đóng nợ:** đợt 59 §6.4 (`docs/PHASE9_ROUND59_P7_I18N_AUDIT_LIMITS.md`, audit P7 ngày 2026-11-07): 41 key mồ côi + fragment 26 key diagnostic `gop.*` + `loadReport.badCase` chưa wiring.

## 1. Kết quả tổng

| Chỉ số | Trước đợt | Sau đợt |
|---|---|---|
| Key lá `vi.json` | 1957 | **1969** |
| Key lá `en.json` | 1957 | **1969** |
| Key một bên (vi-only / en-only) | 0 | **0** |
| Placeholder `{…}` lệch vi↔en | 0 | **0** |
| Giá trị rỗng | 0 | **0** |
| Key vi == en (chuỗi giống hệt) | 48 | **48** |
| Key mồ côi (trong dict, không code nào đọc) | 41 (P7) + 1 tự phát hiện | **0** |

Số học: **1957 − 14 xóa + 26 gộp = 1969** mỗi bên. 14 key xóa và 26 key gộp đều khác nhau vi↔en nên số key vi==en giữ nguyên 48.

## 2. Quyết định từng nhóm key

### 2.1. 28 key `projectRepo.*` — NỐI THẬT (wired), không xóa

P7 xếp đây là "key chết thật" vì `validateSpecDeep` trả chuỗi VI thô, không code nào đọc key. Đợt này nối thật bằng mẫu `I18nLookup` (giống đợt 56 M5): `validateSpecDeep(spec, opts?)` với `opts.lookup?`; `sanitizeKeyframeArrays(spec, lookup?)`; `parseProjectText(text, lookup?)`. **Không import trực tiếp `../i18n`** (Node type-stripping không resolve được import JSON) — lookup được truyền từ caller, kiểu `I18nLookup = (key, vars?) => string`.

- Không lookup → fallback là **đúng chuỗi VI cũ từng ký tự** (test khóa fallback VI + không-lookup), hành vi cũ không đổi.
- Có lookup → lỗi/fix đi qua dict, vi và en đều dịch thật (test Q4 khóa 20 lỗi validate EN + 4 dạng fix keyframe EN).

28 key đã nối (33 call site `trKey` trong `apps/web/src/lib/projectRepo.ts`; 4 key dùng ở 2 site mỗi key: `validateNotObject`, `validateMissingId`, `validateMissingSrc`, `validateKindUnsupported`):

| Nhóm | Key | Dùng ở |
|---|---|---|
| Validate cấu trúc | `validateNotObject`, `validateMissingId`, `validateStartRange`, `validateDurationPositive` | `validateSpecDeep` |
| Validate clip | `validateMissingSrc`, `validateMissingIn`, `validateMissingOut`, `validateMissingText`, `validateSpeedRange`, `validateTrimInvalid` | `validateSpecDeep` |
| Validate lồng nhau | `validateMissingSubSpec`, `validateKindUnsupported`, `validateNotVideoSpec`, `validateSubSpecCycle` | `validateSpecDeep` (+ đệ quy qua `{...opts, pathPrefix}`) |
| Validate meta/track | `validateMetaName`, `validateMetaWidth`, `validateMetaHeight`, `validateMetaFps`, `validateTracksArray`, `validateClipsArray` | `validateSpecDeep` |
| Fix keyframe | `keyframeFixNotObject`, `keyframeFixNotArray`, `keyframeFixEmptyAfterDrop`, `keyframeFixDroppedEntries`, `keyframeFixEasingNormalized`, `keyframeFixKept` | `sanitizeKeyframeArrays` → `sanitizeOneKeyframedValue` |
| Parse | `invalidJson`, `untitledProject` | `parseProjectText` |

Lưu ý:

- **`validateTracksArray` là code phòng thủ không tới được.** `isVideoSpec` (`packages/video-spec/src/index.ts:401`) đã bắt buộc `Array.isArray(spec.tracks)` trước, nên tracks không phải mảng sẽ rớt ở `validateNotVideoSpec` trước khi tới nhánh này. Vẫn nối cho nhất quán; test Q4 khóa hành vi chặn (gating) thay vì ép nhánh đó chạy.
- **`untitledProject`:** nối ở tên mặc định của `parseProjectText`; tên chỉ để hiển thị, nhưng nếu lưu lại thì chuỗi đã dịch sẽ được lưu (hành vi có sẵn từ trước, giống `projectMenu.untitledProject`).
- **Fix keyframe lồng trong cảnh báo:** chuỗi fix nằm trong biến `{fields}` của key `projectRepo.keyframeDropped` (đã nối từ trước) — sau đợt này toàn bộ cảnh báo được dịch (trong + ngoài).
- **`validateNotVideoSpec`:** fallback 2 phần nên bộ quét P7 xếp `DICT_VALUE-PART`/`WIRED-FALLBACK` thay vì `DICT_VALUE` thuần — không phải lỗi, test P7 vẫn xanh 7/7.
- **Kiểu TS:** 4 vars `reason` trong `gopRangeFetch39T3.ts` là `string | undefined` theo kiểu (`layout.reason`, `tsCheck.reason`, `v.reason`, `v0.reason`) nên `tsc` bắt buộc bọc `String(...)` — runtime không đổi (`${x}` với `x === undefined` in ra `"undefined"`, đúng như `String(x)`).

### 2.2. 13 key lẻ — XÓA khỏi dict (mỗi key đã xác minh 0 code đọc)

Quét toàn bộ `apps/web/src`, `apps/desktop/src`, `server/`, `packages`, `mcp-server`, `cli` (loại nhiễu `.venv`): không file code nào đọc các key này.

| Key đã xóa | Lý do |
|---|---|
| `common.apply`, `common.loading` | Không code nào đọc; UI dùng chuỗi khác / literal riêng |
| `adjustment.addFail`, `adjustment.listTitle`, `adjustment.saveOk`, `adjustment.saveFail`, `adjustment.scopeSingleBlocked` | Nhóm adjustment chết; code adjustment hiện tại dùng key khác |
| `nestedBoundary.title` | Không code nào đọc |
| `loadReport.fix` (chỉ key trần) | Các key dài hơn vẫn sống: `loadReport.fixAll`, `loadReport.fixLine`, … |
| `nativeFiles.readError`, `nativeFiles.writeError`, `nativeFiles.saveDone` | Code native-files hiện tại dùng `nativeFiles.importTooBig`, `nativeFiles.exportCancelled` |
| `pack.back` | Code pack hiện tại dùng `pack.close`, `pack.title`, … |

### 2.3. Key mồ côi thứ 42 — `enhance.renderOnly` — XÓA

Không nằm trong 41 key của P7; scan của đợt này tự phát hiện. Bằng chứng: có trong dict từ fragment đợt 56 M3, chỉ được nhắc trong `i18nAudit56M3.test.ts` (file test không tính trong scan orphan); `EnhancePanel.tsx` đã bỏ cách dùng từ đợt 59 P8. Không luồng đợt 60 nào tham chiếu (đã kiểm tra `enhancePreview60Q1.test.ts`, `EnhancePanel.tsx`, `enhancePreview.ts`). Chuỗi vẫn còn trong `apps/web/src/i18n/fragments/round56-m3.json` và trong LIMITS đợt 59 để khôi phục nếu cần.

### 2.4. 26 key fragment P7 — NỐI THẬT + GỘP VÀO DICT

Nguồn: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round59-p7-fragment.json` (26 key lá, vi khác en, placeholder khớp). Test Q4 khóa dict khớp fragment từng chữ.

| Nhóm | Số key | File nối |
|---|---|---|
| `gop.range.*` (12) | `statusNot206`, `shortBody`, `prefixStatusNot206`, `prefixShortBody`, `fetchUrlInvalid`, `fetchParamsInvalid`, `moovTooLarge`, `moovOutOfFile`, `gopOutOfFile`, `gopSampleOutOfRange`, `sampleRemainderInvalid`, `sampleChunkLimit` | `apps/web/src/lib/gopRangeFetch39T3.ts` (24 call site `trKey`; `moovTooLarge`, `notAvcc`, `trialDecodeFailed` dùng 2 site mỗi key) |
| `gop.demux.*` (9) | `avccReadFailed`, `badLayout`, `badStts`, `cttsStszMismatch`, `notAvcc`, `sampleOutOfFile`, `sampleOutsideMdat`, `stssOutOfRange`, `trialDecodeFailed` | `gopRangeFetch39T3.ts` |
| `gop.trial.*` (4) | `decodeFailed`, `noDecoder`, `timeout`, `unsupportedConfig` | `apps/web/src/lib/gopTrialDecode55L8.ts` |
| `loadReport.badCase` (1) | `badCase` | `apps/web/src/lib/loadReport.ts` |

**Lookup được nối thật trong production, không chỉ đi dây:**

- `GopRangeFetchOptions.lookup?` → `fetchVideoTrackByGopRange`; `runTrialDecode(..., lookup?)`; `fetchRangeChecked` / `fetchSampleRemainderChunked` / `fetchTrailingMoovChunked` mỗi hàm nhận thêm `lookup?` ở cuối.
- `ReversePreviewControllerOptions.i18nLookup?` lưu thành `gopI18nLookup`, truyền tại call site `fetchVideoTrackByGopRange`; `getReversePreviewController` và `reverseWebcodecsFrameFor` chuyển tiếp; `apps/web/src/preview.tsx` truyền `i18nLookup: i18nT` ở cả 2 call site (`reverseWebcodecsFrameFor` ~dòng 1266, `getReversePreviewController` ~dòng 2877).
- Không lookup → giữ đúng chuỗi VI cũ. `gopFallbackReason` chỉ để chẩn đoán (test/harness đọc, không render UI).
- Định dạng lý do giữ nguyên `prefix: …` nên các test GOP cũ (`gopWiring40V2`, `gopSizeProbe41W4`, `gopBlobUrl49E2`, `gopTail46B4`, …) vẫn khớp.

**`loadReport.badCase` là sentinel điều khiển nội bộ** (trong `formatStructuredNote`): throw rồi catch ngay, message không bao giờ hiện ra ngoài. Nối qua `trKey` cục bộ chỉ để xóa literal và tiêu thụ key fragment; hành vi không đổi. `formatStructuredNote` đã nhận `lookup` từ trước.

**Những literal KHÔNG nối (giữ nguyên chuỗi thô, có lý do — ghi theo P7):** lý do gate, lý do tail-scan, lý do `checkRangeProbeResponse` (`range-probe-*`), `demux-moov: <parser error>`, `size-too-small`, `exception:...`, `moov-missing-after-gate`, `demux-moov: track không có sample`, `demux-moov: sample 0 rỗng`, trial `decode-ok` / `probe-error:...`, và literal trong `reverseWebcodecs.ts` (`gop-unexpected-exception`, `gop-size-probe-unexpected-exception`). Các chuỗi này không nằm trong fragment P7 và không có hạ tầng `t()` tại chỗ — không tự bịa key mới.

## 3. Thay đổi test

- **Mới:** `apps/web/src/lib/i18nOrphans60Q4.test.ts` — 16 test, đỏ-trước/xanh-sau (baseline đỏ 5/16 ngày 2026-11-08, log `/tmp/round60-q4/red.log`; sau sửa 16/16).
- **P7 test** (`i18nAudit59P7.test.ts`): dict 1969; danh sách 41 orphan → rỗng; residual 26 → 0; scan 29 occurrence → 0, 26 unique → 0. Bộ quét P7 xếp các fallback mới là `DICT_VALUE` (trừ `validateNotVideoSpec` 2 phần, xem §2.1).
- **M5 test** (`i18nRound56M5.test.ts`): cập nhật 1 assertion có lý do (không phải nới lỏng) — trước đây test khóa trạng thái "nửa dịch": wrapper EN + chuỗi fix trong VI. Sau khi nối `keyframeFix*`, chuỗi trong nay là EN thật: `...volumeKeyframes.keyframes is empty after dropping 1 invalid entries — field removed...`. Assertion không-lookup giữ nguyên.
- **8 test khóa số key** 1957 → 1969: `ProjectMenu.i18n55L1.test.ts`, `reverseToggleI18n48D4.test.ts`, `reverseBadge46B6.test.ts`, `reverseCompat44Z6.test.ts`, `reversePlaybackI18n49E2.test.ts`, `i18nRound57N4.test.ts`, `saveToast31.test.ts`, `structuredNotes32.test.ts` (+ comment chuỗi gộp ghi thêm "; đợt 60 Q4: −14 key mồ côi +26 key fragment P7 → 1969 mỗi bên", giữ nguyên text lịch sử "→ 1957").
- **Chỉ comment:** `errorDetail34Q4.test.ts`, `i18nAudit55L2.test.ts`, `i18nRound56M5.test.ts` (header).
- **Sửa do `tsc`:** test Q4 thêm helper `fullFileReason(o: GopRangeOutcome)` — vừa thu hẹp union cho tsc (mode `gop-range` không có `reason`), vừa khóa mode phải là `full-file`.

## 4. Kiểm chứng (số thật, chạy 2026-11-08)

| Suite | Kết quả |
|---|---|
| Q4 mới `i18nOrphans60Q4` | **16/16 pass** |
| P7 `i18nAudit59P7` | **7/7 pass** |
| M2 `i18nAudit56M2` | **14/14 pass** |
| M5 `i18nRound56M5` | **21 pass** |
| L2 `i18nAudit55L2` | **20/20 pass** |
| M6 `i18nAudit56M6` | **8/8 pass** |
| L1 ProjectMenu, D4 toggle, B6 badge, Z6 compat, E2 playback, N4, saveToast31, structuredNotes32, errorDetail34Q4 | 6/6, 3/3, 8/8, 10/10, 3/3, 14, 15, 12, 35/35 — **xanh hết** |
| GOP hồi quy: `gopRangeFetch39T3` 10/10, `gopTrialDecode55L8` 23/23, `gopTrialDecode56M10` 28/28, `gopTrialDecode57N10` 17/17, `gopTrialDecode58O6` 18/18, `gopTrialDecode59P6` 16/16, `gopTrialDecode60Q5` 15/15, `gopWiring40V2` 16/16, `gopBlobUrl49E2` 8/8, `gopFakeMoov52I6` 25/25, `gopFakeMoov54K8` 18/18, `gopMoovHeader44Z4` 19/19, `gopMoovLarge43Y4` 10/10, `gopSharedProbe42X4` 10/10, `gopSizeProbe41W4` 15/15, `gopStreaming50F4` 6/6, `gopTail45A4` 18/18, `gopTail46B4` 13/13, `gopTail47C5` 11/11, `gopTailStream51H4` 8/8, `gopTrialDecode57N6` 32/32 | **xanh hết** |
| projectRepo hồi quy: `projectRepo` 10/10, `projectRepoNested22` 7/7, `projectRepoRound26J5` 15/15, `projectRepoRound49E4` 13/13, `loadProject54K1` 7/7, `loadReport` 10/10, `loadReport57N7` 16/16, `loadReportFix28` 8/8, `loadReportPerLine29` 14/14, `binPersist59P1` 17/17, `rehydrate36S5` 27/27, `settle49E3` 6/6, `curveFixKeyframe30` 21/21, `curveFixRound27K2` 17/17 | **xanh hết** |
| Reverse/preview hồi quy: `reverseCompat43Y6` 11/11, `reverseDecodeAheadToggle38U1` 12/12, `reverseDecodeAheadToggle39T4` 11/11, `reverseDecodeAheadWiring37T2` 12/12, `reverseFileBuffer35R3` 10/10, `reverseFileCancel37T5` 6/6, `reverseFileHeap36S4` 6/6, `reversePlaybackRound28L2` 17/17, `previewEngine` 14, `previewEngine51H6` 15, `previewLoop50F2` 20, `nestedRampPreview` 34, `effectCanvas` 14 PASS, `ghostBlend.probe` 10 xanh, `mirrorUnifyRound52I7` 12/12, `textAnimParity` 8, `textStyle27K1` 6/6, `textStyle32O6D7` 6/6, `skippedReasons59P3` 16, `skippedFlat60Q6` 15, `binOrphan60Q7` 17/17 | **xanh hết** |
| `tsc --noEmit` (apps/web) | **0 lỗi** (đã sửa 4 vars `reason: string \| undefined` bằng `String(...)` + 3 lỗi kiểu `r.reason` trên union trong test Q4) |
| `vite build` (apps/web) | **pass** (built 6.48s; chỉ cảnh báo chunk >500kB có sẵn từ trước) |

Ghi chú chạy test: test dùng top-level await không bundle được bằng esbuild `--format=cjs` (lỗi "Top-level await is currently not supported") và không chạy được bằng `node --experimental-strip-types` trên Node 24.22.1 (import không đuôi `.ts` → `ERR_MODULE_NOT_FOUND`, quirk đã biết từ P7 §4) — chạy bằng esbuild `--format=esm` rồi `node`. Đây là hạn chế của runner, không phải lỗi code.

## 5. Nợ mở (không thuộc đợt này)

1. **`i18nAudit56M3.test.ts` đỏ sẵn 7/13** — trạng thái có từ trước đợt, đã xác minh lại 2026-11-08 (vẫn 7/13, 6 fail giống hệt baseline): assertion fragment stale (84 key M3 nay đã trong dict nên `!mainVi.has(k)` sai), test source EnhancePanel đòi `t("enhance.renderOnly")` (key đã xóa ở §2.3), render TemplatePicker/RelinkPanel lệch do drift các đợt sau. Xóa `enhance.renderOnly` không đổi kết quả M3 (fail đầu tiên là `history.readFailed`). Cần một đợt riêng sửa M3, không sửa trong đợt này để khỏi lan phạm vi.
2. **Thay đổi của luồng Q5 (đã có trước khi đợt Q4 bắt đầu, 2026-11-07 17:50):** `MAX_TRIAL_DECODE_SAMPLE_BYTES` 32 MiB → 64 MiB, `MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES` 64 → **128** trong `gopRangeFetch39T3.ts`, thêm guard bỏ qua remainder fetch khi probe null. Test chunk-limit của Q4 dùng 129 chunk / sampleSize 67.633.153 theo giới hạn mới này.
3. **Workflow `ci-security.yml` vẫn 403** — chưa lên GitHub (quyền App thiếu `workflows:write`); repo vẫn không có CI chạy thật. Nợ từ đợt 6, không thuộc đợt này.
4. **Server/desktop 253 literal chưa được kiểm kê** (P7 §6.4 chỉ quét web) — vẫn là nợ mở cho đợt audit sau.
5. **Lý do diagnostic chưa nối** (§2.4, cuối) — không có key trong fragment P7; nếu muốn dịch hết cần fragment mới + hạ tầng `t()` tại các điểm đó.

## 6. File thay đổi (stage ở `phase9-round60-q4-i18n-orphans.txt`)

- `apps/web/src/lib/i18nOrphans60Q4.test.ts` (mới, 16 test)
- `apps/web/src/lib/projectRepo.ts` (28 key nối)
- `apps/web/src/lib/gopTrialDecode55L8.ts` (4 key)
- `apps/web/src/lib/gopRangeFetch39T3.ts` (21 key + `String(...)` 4 vars)
- `apps/web/src/lib/loadReport.ts` (`badCase` + `trKey` cục bộ)
- `apps/web/src/lib/reverseWebcodecs.ts` (nối `i18nLookup`)
- `apps/web/src/preview.tsx` (2 call site truyền `i18nT`)
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (1969 key mỗi bên)
- `apps/web/src/lib/i18nAudit59P7.test.ts` (cập nhật 1969 / 0 orphan / 0 residual)
- `apps/web/src/lib/i18nRound56M5.test.ts` (1 assertion + comment)
- 8 test khóa số key: `apps/web/src/components/project/ProjectMenu.i18n55L1.test.ts`, `apps/web/src/lib/reverseToggleI18n48D4.test.ts`, `reverseBadge46B6.test.ts`, `reverseCompat44Z6.test.ts`, `reversePlaybackI18n49E2.test.ts`, `i18nRound57N4.test.ts`, `saveToast31.test.ts`, `structuredNotes32.test.ts`
- Chỉ comment: `apps/web/src/lib/errorDetail34Q4.test.ts`, `i18nAudit55L2.test.ts`
- `docs/PHASE9_ROUND60_Q4_I18N_ORPHANS_LIMITS.md` (file này)
