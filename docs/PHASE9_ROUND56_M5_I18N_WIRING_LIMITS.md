# Phase 9 đợt 56 — M5: nối key i18n cho lib nested (LIMITS)

Ngày: 2026-11-07. Luồng M5, repo `vectornewsai-cmyk/repo-1`, nhánh main.
Phạm vi: CHỈ 4 file `apps/web/src/lib/` — `nestedPreview.ts`, `twoLevelCurve.ts`,
`curveFix.ts`, `projectRepo.ts`. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 1. Đã nối

**81 key mới** trong `apps/web/src/i18n/fragments/round56-m5.json`
(dạng `{"vi": {...}, "en": {...}}`, vi/en cùng tập key, khác nhau từng key,
không trùng key đã có trong `vi.json`/`en.json` — kiểm chứng bằng script trong test),
**+ 3 key tái dùng đã có sẵn** (`speedCurve.shape`, `speedCurve.keyframesEmpty`,
`speedCurve.keyframesTooMany` — khớp từng chữ cho curveFix 829/833/837).

| File | Key mới nối | Ghi chú |
|---|---|---|
| `nestedPreview.ts` | 52 `nested.*` + 8 `curveErr.*` | `trKey` qua 63 điểm gọi |
| `twoLevelCurve.ts` | 10 `twoLevel.*` + 8 `curveErr.*` | `trKey` qua 19 điểm gọi |
| `curveFix.ts` | 8 (`curveFix.moreViolations`, `exportBlockedHead`, `exportBlockedTail`, 5 `curveErr.*` + 1 `kfVRangeBrackets`) + tái dùng 3 `speedCurve.*` | `trKey` qua 12 điểm gọi |
| `projectRepo.ts` | 2 (`projectRepo.openFailed`, `projectRepo.keyframeDropped`) | `trKey` qua 3 điểm gọi |

Tổng: 77 proposal trong `round55-l2-keys.json` khớp 4 file này (trong 514 proposal)
→ đã nối 81 key mới (một số proposal tách thành nhiều key, xem §4).

## 2. Lựa chọn thiết kế: lookup injection, KHÔNG import `t()` trực tiếp

Task gợi ý dùng `t()` trực tiếp trong các file lib thuần. **Đã chứng minh là không
làm được nếu không hồi quy**: probe ngày 2026-11-07 (Node v24.22.1) import
`../i18n` dưới `node --experimental-strip-types` lỗi
`ERR_IMPORT_ATTRIBUTE_MISSING` cho `i18n/vi.json` (exit 1) — Node ESM bắt
import attribute cho JSON. Toàn bộ test hiện có của 4 file chạy bằng strip-types
(`nestedPreview.test.ts`, `twoLevelCurve.test.ts` 12 checks,
`projectRepo.test.ts`, `curveFixRound27K2.test.ts`); một `import { t }` tĩnh
sẽ vỡ tất cả ngay lúc load.

Đã dùng pattern có sẵn trong chính codebase (`curveFix.formatSanitizeSummaryLocalized`,
`loadReport.resolveWarningMessage` — cả hai cố tình tránh import i18n vì đúng lý do
này): mỗi hàm tạo thông báo nhận thêm tham số cuối tùy chọn `lookup?: I18nLookup`,
với helper cục bộ `trKey(lookup, key, vars, fallback)` mỗi file. Fallback = đúng
từng byte literal VI cũ; lookup trả về đúng key cũng rơi về fallback. **Không
truyền lookup → hành vi + test cũ không đổi.**

```ts
export type I18nLookup = (key: string, vars?: Record<string, string>) => string;
```

`I18nLookup` được export từ cả 4 file; không có xung đột tên `trKey`/`I18nLookup`.

### ⚠️ Khoảng trống kích hoạt runtime (open item chính)

Việc nối ở tầng lib chỉ có tác dụng khi **tầng UI truyền `t()` vào**: các caller
(`App`, preview, `ExportPanel`, `openProjectFlow` — ngoài phạm vi 4 file này)
phải truyền `t()` làm tham số `lookup` cho `validateCurve`, `encodeHermite`,
`composeTwoLevelCurve`, `flattenNested`, `flattenForPreview`, `buildPreviewSpec`,
`buildPreviewSpecFailsoft`, `checkSpeedKeyframesRenderFatal`,
`collectRenderFatalSpeedWarnings`, `exportCurveBlockers`, `formatExportCurveError`,
`parseProjectText`, `loadProject`, `loadAutosave`. Chưa có caller nào được sửa
trong đợt này → **hiện tại app vẫn hiển thị tiếng Việt mặc định ở mọi nơi**;
bản dịch EN chỉ kích hoạt sau khi một luồng khác nối caller. Đây là bước tiếp
theo, không phải lỗi của đợt này.

## 3. Kiểm chứng (số thật, chạy 2026-11-07)

Test mới `apps/web/src/lib/i18nRound56M5.test.ts` — **21/21 pass**, chạy theo mẫu
L2 (esbuild bundle rồi chạy node):

```
./node_modules/.bin/esbuild apps/web/src/lib/i18nRound56M5.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round56-m5/m5.test.cjs
node /tmp/round56-m5/m5.test.cjs   →  i18n round 56 M5: 21 pass
```

Test gồm: (A) fragment parity/nội dung (81 key, vi≠en, placeholder khớp,
không trùng key cũ, 3 key tái dùng khớp từng chữ); (B) fallback không lookup
đúng từng byte literal cũ (gọi runtime thật); (C) lookup build từ fragment:
EN dịch thật, VI bằng fallback; (D) assert source (`trKey(lookup, "key"` có
mặt đúng từng file) + site bỏ qua còn nguyên. Lookup trong test được build bằng
cách merge fragment lên vi/en JSON đọc từ đĩa (không import module i18n nên
strip-types/esbuild đều chạy được). Import trong test dùng dạng extensionless
(`./nestedPreview`, không `.ts`) để `tsc` resolve được như file L2.

`tsc --noEmit` trong `apps/web`: **0 lỗi** (đã sửa 15 lỗi ban đầu trong file test
mới: TS5097 do import `.ts`, TS2322/TS2698/TS2741/TS2820 do fixture cố tình
đưa sai kiểu — sửa bằng `as const`/`as never` tại chỗ, không đổi logic).

`vite build` trong `apps/web`: **pass** (7.08s; cảnh báo chunk >500kB có sẵn từ trước).

Test hiện có chạy lại, toàn bộ xanh (lệnh: `node --experimental-strip-types <file>`
từ repo root, trừ L2 audit chạy esbuild như trên):

| Suite | Kết quả |
|---|---|
| `nestedPreview.test.ts` | 46 pass |
| `nestedRampPreview.test.ts` | 34 pass |
| `nestedPreviewR3.test.ts` | 21 pass |
| `nestedPreviewFailsoft26J1.test.ts` | 6 pass |
| `twoLevelCurve.test.ts` | 12 pass |
| `curveFixRound27K2.test.ts` | 17 pass, 0 fail |
| `curveFixKeyframe30.test.ts` | 21 pass, 0 fail |
| `projectRepo.test.ts` | 10 pass, 0 fail |
| `projectRepoNested22.test.ts` | 7 pass, 0 fail |
| `projectRepoRound26J5.test.ts` | 15 pass, 0 fail |
| `projectRepoRound49E4.test.ts` | 13 passed, 0 failed |
| `loadReport.test.ts` | 10 pass, 0 fail |
| `loadReportFix28.test.ts` | 8 pass, 0 fail |
| `loadReportPerLine29.test.ts` | 14 pass, 0 fail |
| `saveToast31.test.ts` | 15 pass, 0 fail |
| `structuredNotes32.test.ts` | 12 pass, 0 fail |
| `i18nAudit55L2.test.ts` (L2, esbuild) | 20/20 pass |

## 4. Key tách / đuôi câu đã xác minh theo source

25 proposal mang note "cần xác minh theo source" (đuôi câu bị cắt trong dump quét):
mỗi site đã đọc source trước khi nối. Đuôi cố định trong source được đưa nguyên
văn vào fragment; site nào thực sự khác nhau thì tách key:

- `nested.transitionOut` → `transitionOutDuration` / `transitionOutType`
- `nested.leafUnderNested` → `leafUnderNestedRefusal` / `NonMedia` / `NoIn`
- `nested.leafSpeedKeyframes` → `Composed` / `Slice`
- `nested.trimOutMismatch` → `Const` / `Curve`
- `twoLevel.speedOutOfRange` → `Hermite` / `InnerConst` / `OuterConst`
- `curveErr.kfBezier` (có value, chỉ twoLevelCurve) vs `kfBezierNoValue`
  (nestedPreview 1237, không value, không dấu chấm) vs `kfBezierNoValueDot`
  (curveFix 858, không value, có dấu chấm); `kfNotObject` / `kfTOutOfRange` /
  `kfEasing` (không chấm, nestedPreview + twoLevelCurve) vs các biến thể
  `…Dot` (có chấm, curveFix). `curveErr.kfVRangeBrackets` chỉ nối được ở
  curveFix 853 (thêm dấu chấm vào fragment vi theo source; lệch khỏi proposal).
- `curveFix.exportBlocked` (proposal có `\n\n{details}`) không khớp cấu trúc thật
  (head `\n` + các dòng + rest + `\n` + câu đuôi) → tách `exportBlockedHead` +
  `exportBlockedTail`; `curveFix.moreViolations` nối như proposal.

Đuôi cố định đã xác minh (thay `{detail}` trong proposal bằng text thật):
`nested.subSpecConflict`, `trimInConflict` (`{a},{b}`), `trimOutMismatch*`,
`durationMismatch`, `multiEnd`, `transitionNoPrev` (`{start}`),
`transitionCrossBorder` (`{value}` = loại effect), `transitionBothSides`,
`transitionEarly` (`{n}`), `transitionFlatExists`, `leafAtTransitionEdge`,
`leafOpacityAndTransition`, `leafShorterThanTransition` (`{t}`),
`leafInnerAndOuterTransition`, `leafCutLeft`, `combinedSpeedOutOfRange`
(`{outer}`), `leafSpeedProduct` (`{v}`), `leafNoOwnCurve`, `leafConstSpeed`,
`twoLevel.mergeBreakpoints`.

Bug tìm thấy và sửa trong lúc nối (đều có test bao):
1. `resolveNestedRampCurve`: truyền `{path: where}` (`"L: speedKeyframes"`) cho
   `curveErr.speedNotObject/speedEmpty/speedTooMany`, trong khi template
   fragment là `{path}: speedKeyframes …` → EN render trùng tiền tố
   (`L: speedKeyframes: speedKeyframes must be…`). Đã sửa thành `{path: label}`.
   (Fallback VI vẫn đúng; test EN bắt được.)
2. Bỏ sót site `nested.reverseSpeed` thứ hai trong `normalizeNestedClip`
   (~dòng 834, label ``nested clip "n1"`` — reverse + ramp không hằng throw ở
   đây trước, trước site trong `flattenNested` với label ``nested "n1"``).
   Đã nối với `{path: label}`.

## 5. Site cố tình BỎ QUA (không nối) + lý do

### 5.1 projectRepo `curveErr.*` (10 site: 352, 356, 361, 369, 377, 380, 384, 390, 394, 404)
Đã i18n sẵn qua `messageKey` + key `speedCurve.*` có sẵn; UI dịch lúc hiển thị
qua `loadReport.resolveWarningMessage`; trường `message` chỉ là fallback VI, và
comment `SpeedCurveWarning` trong projectRepo.ts (~131–147) khóa message VI
đúng từng byte (test cũ + parity `formatStructured`). Literal trong proposal
cũng không khớp source (thiếu tiền tố `{path}:`, dấu chấm cuối khác).

### 5.2 curveFix `fixedSummary` / `unsalvageable` / `skippedLocked` / `noViolations`
Đã i18n sẵn qua `formatSanitizeSummaryLocalized` + key `curveFix.*` có sẵn;
`formatSanitizeSummary` (bản VI fallback) bị khóa đúng từng byte bởi
`curveFixKeyframe30.test.ts` / `loadReportPerLine29.test.ts`. Các chuỗi
per-keyframe trong sanitize (dòng 164–288, 544–669) đã có bản song song có cấu
trúc `SanitizeChangeItem` (đợt 29 L4, key `curveFix.change*` + vars) — text VI
giữ nguyên từng chữ theo thiết kế đó; không nối thêm.

### 5.3 projectRepo `moreWarnings` (1083)
`loadReport.ts` có `OVERFLOW_RE = /^Còn \d+ cảnh báo speedKeyframes khác/`
khớp chuỗi VI để phát hiện overflow + `atCap`; dịch chuỗi này sẽ làm dòng đó
rơi vào `otherWarnings` và đặt `atCap=false`. Cần luồng sở hữu `loadReport.ts`
cập nhật regex trước.

### 5.4 projectRepo `motionMigrated` (1096)
Đã i18n sẵn qua key `structuredNotes.motionMigratedHint` có sẵn; chuỗi
`warnings.push(hintFallback)` phải giữ đúng từng byte để `buildLoadReport`
fallback dedup đúng.

### 5.5 Không có site nối được
- `curveErr.speedTooManyCount` / `kfTNegative` / `kfTNotMonotonic`: chỉ có ở
  projectRepo (đã bỏ qua theo §5.1); curveFix 837 tái dùng
  `speedCurve.keyframesTooMany`.
- `sanitizeNestedCurves` (nestedPreview ~2828): cố tình không đụng — nó nuốt
  lỗi `resolveNestedRampCurve` chỉ để lấy tín hiệu invalidity.

### 5.6 Site không tới được (defensive / unreachable — chỉ assert source + fragment, không trigger runtime)
`nested.leafNoOwnCurve` (`resolveNestedRampCurve` chỉ trả null khi curve
`undefined`, nhưng caller kiểm tra `!== undefined` trước),
`nested.leafSpeedKeyframesComposed` / `Slice`, `twoLevel.sliceOuter` /
`sliceInner`, `twoLevel.mergeDuration`; site reverse trong `flattenNested`
chỉ tới được khi bypass `normalizeNestedClip`.

## 6. Literal VI còn sót trong 4 file (đếm trung thực)

Đếm bằng script quét dòng code chứa ký tự VI **nằm ngoài** `trKey(...)`
(literal trong fallback của `trKey` là cố tình giữ — fallback đúng từng byte
là một phần của thiết kế §2, không tính là "còn sót"). Baseline trước khi sửa:
nestedPreview 119, twoLevelCurve 24, curveFix 48, projectRepo 61 dòng code có VI.

| File | Dòng VI ngoài `trKey` | Phân loại |
|---|---|---|
| `nestedPreview.ts` | 20 dòng (8 là comment trong code) | 12 dòng = 11 chuỗi failsoft `sink.skipped` / cảnh báo bỏ transition (963–964, 1013, 1630, 1651, 1673, 1836, 1961, 2310, 2394, 2414, 2537): **không có trong proposal round 55** nên không nối. |
| `twoLevelCurve.ts` | **0** | Mọi literal VI còn lại đều là fallback trong `trKey`. |
| `curveFix.ts` | 37 dòng | Toàn bộ đã có cơ chế i18n từ trước: `formatSanitizeSummaryLocalized` (`tr` cục bộ, dòng 795) + bản song song `SanitizeChangeItem` (§5.2) + fallback VI của `formatSanitizeSummary` (978–990). Không còn chuỗi user-facing nào chưa có key. |
| `projectRepo.ts` | 59 dòng (2 là comment) | Không có trong proposal round 55 (trừ các site đã ghi ở §5): cảnh báo blob/missing-media (286, 318), fallback VI của `curveErr.*` messageKey (§5.1), lỗi `validateProject` (500–627), lỗi spec/meta (595–613), fallback motion/keyframe/textStyle (753, 915–950, 1143), `formatVersion`/envelope/schemaMigrated (1048, 1057, 1086), `moreWarnings` (§5.3), `motionMigrated` (§5.4), giá trị mặc định `"Dự án không tên"` / `"Dự án mới"` (1040, 1201, 1259 — là tên project, không phải thông báo). |

## 7. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round56-m5-i18n-nested-lib.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, chỉ file text):

- `apps/web/src/lib/nestedPreview.ts`
- `apps/web/src/lib/twoLevelCurve.ts`
- `apps/web/src/lib/curveFix.ts`
- `apps/web/src/lib/projectRepo.ts`
- `apps/web/src/i18n/fragments/round56-m5.json`
- `apps/web/src/lib/i18nRound56M5.test.ts`
- `docs/PHASE9_ROUND56_M5_I18N_WIRING_LIMITS.md`

`vi.json` / `en.json` KHÔNG sửa (theo quy định đợt 56 — parent merge fragment
cuối đợt). Không có binary/dist/`__pycache__`/benchmarks/results trong batch.

## 8. Việc còn lại (cho luồng khác)

1. Nối caller truyền `t()` vào các hàm ở §2 (App/preview/ExportPanel/
   openProjectFlow) — nếu không, EN không bao giờ hiển thị ở các chuỗi này.
2. `loadReport.ts`: cập nhật `OVERFLOW_RE` để `projectRepo.moreWarnings` dịch được.
3. (Tùy chọn) đề xuất key mới cho 11 chuỗi failsoft `sink.skipped` trong
   nestedPreview (§6) và các lỗi `validateProject` trong projectRepo — các chuỗi
   này chưa từng có trong proposal round 55.
