# Phase 9 đợt 57 — N4: nối key i18n cho failsoft nested (LIMITS)

Ngày: 2026-11-07. Luồng N4, repo `vectornewsai-cmyk/repo-1`, nhánh main.
Phạm vi: CHỈ `apps/web/src/lib/nestedPreview.ts` + fragment mới
`apps/web/src/i18n/fragments/round57-n4.json` + test mới
`apps/web/src/lib/i18nRound57N4.test.ts`. KHÔNG push, KHÔNG release/tag,
KHÔNG binary. Đóng 2 nợ LIMITS đợt 56 (§4.4 + §4.5 trong
`docs/PHASE9_ROUND56_M6_UNVERIFIED_LIB_LIMITS.md`, chi tiết §6 trong
`docs/PHASE9_ROUND56_M5_I18N_WIRING_LIMITS.md`).

## 1. Đã nối: 11 key `nested.failsoft.*`

Pattern lookup injection của M5, không đổi: `trKey(lookup, key, vars, fallback)`,
không import `../i18n` trực tiếp (Node strip-types lỗi import JSON).
Không lookup → fallback đúng từng chữ literal VI cũ; có lookup → chuỗi theo
locale. Key mới trong fragment `round57-n4.json` (vi/en cùng tập key,
placeholder khớp 100%, không trùng key đã có — kiểm chứng trong test §A
đối chiếu 1722 key lá vi.json/en.json + toàn bộ fragment khác).

| # | Key | Site (dòng hiện tại) | Hàm | Vars |
|---|---|---|---|---|
| 1 | `nested.failsoft.nonVideoBoundary` | 963 | `resolvePreviewBoundaries` | path, id |
| 2 | `nested.failsoft.firstClipTransition` | 1014 | `resolvePreviewBoundaries` | path, id |
| 3 | `nested.failsoft.maxDepth` | 1632 | `flattenNested` | id, max (= 16) |
| 4 | `nested.failsoft.invalidNested` | 1654 | `flattenNested` | id |
| 5 | `nested.failsoft.speedOutOfRange` | 1677 | `flattenNested` | id, speed |
| 6 | `nested.failsoft.cycle` | 1841 | `flattenNested` | id, path (`a > b`) |
| 7 | `nested.failsoft.invalidNestedAdjustment` | 1969 | `flattenNested` | id |
| 8 | `nested.failsoft.unknownNestedClip` | 2320 | `flattenNested` | id |
| 9 | `nested.failsoft.invalidOuterAdjustment` | 2406 | `flattenForPreview` | — |
| 10 | `nested.failsoft.unknownOuterClip` | 2429 | `flattenForPreview` | — |
| 11 | `nested.failsoft.unknownEffectType` | 2554 | `skippedEffectReason` | — |

Hai điểm nối phụ trong cùng file (không thêm key):
- `skippedEffectReason(type, lookup?)`: thêm tham số lookup tùy chọn
  (tương thích ngược — `nestedPreview.test.ts:555` gọi 1 tham số vẫn xanh).
- `applyAdjustmentPreview` đã nhận `lookup?` nhưng `splitClipByAdjustments`
  gọi nó mà KHÔNG truyền lookup (dòng 2832 cũ) → nay truyền `lookup`
  xuống, để `skippedReasons` dịch được trên đường preview thật
  (`buildPreviewSpec` → `splitClipByAdjustments` → `applyAdjustmentPreview`).
- 2 site passthrough KHÔNG cần key riêng: `innerBoundary.skipped` (1775)
  và `outerBoundary.skipped` (2368) đẩy lại chuỗi đã dịch y nguyên —
  test §C khóa passthrough EN qua biên trong.

## 2. §4.4 M6: 4 literal VI ngoài inventory — ĐÃ nối sẵn bởi M5, không sửa lại

Kiểm chứng trong test §F (không chỉ đọc mắt): cả 4 key đã có trong
`vi.json`/`en.json` đúng từng chữ giá trị fragment M5, source đã `trKey`,
runtime EN dịch thật (assert `reverseSpeed` qua `flattenForPreview` +
lookup EN). Kết luận inventory §4.4 của M6 đã lỗi thời lúc N4 làm việc:

| Literal (dòng M6 → dòng nay) | Key | Trạng thái |
|---|---|---|
| reverse `~833` → 835 + 1680 | `nested.reverseSpeed` | Đã nối, **2 site** trKey |
| flattenAdjLayers `~2423` → ~2437 | `nested.flattenAdjLayers` | Đã nối |
| adjScopeNotArray `~2590` → 2600 | `nested.adjScopeNotArray` | Đã nối |
| adjScopeBadIndex `~2596` → 2607 | `nested.adjScopeBadIndex` | Đã nối |

Hai sai lệch trong tài liệu đợt 56 được phát hiện khi làm việc này (ghi lại
để parent khỏi mất công kiểm lại):
- M6 §4.1 nói file `i18n/fragments/round56-m5.json` "không tồn tại" — **sai**:
  file có đủ 81 key, và cả 81 key đã gộp vào `vi.json`/`en.json`
  (1722 key lá mỗi bên, kiểm bằng script đếm lá).
- Header test M5 ghi chạy bằng `node --experimental-strip-types`, nhưng file
  đó import extensionless (`./nestedPreview`) nên strip-types lỗi
  `ERR_MODULE_NOT_FOUND` trên Node v24.22.1 — phải chạy bằng esbuild bundle
  như M5 LIMITS §3 đã ghi (21/21 xanh qua esbuild, xem §4).

## 3. Sink / call-site: đã nối tới đâu, còn hở chỗ nào (trung thực)

**Lookup đã chảy tới tận lib** (xác minh bằng source + test §G):
`preview.tsx:2641` gọi `buildPreviewSpecFailsoft(rawSpec, i18nT)` →
`buildPreviewSpecFailsoft(spec, lookup)` → `buildPreviewSpec(spec, lookup)` →
`flattenForPreview(input, lookup)` → `flattenNested(..., lookup)` /
`resolvePreviewBoundaries(..., lookup)`. Không sửa `preview.tsx` (file luồng
khác, và đã nối sẵn — không còn việc để nối ở đó).

**Nhưng 11 chuỗi này hôm nay CHƯA tới được UI** — nối lib xong vẫn chưa hiển
thị, vì sink chưa có consumer:
- `FlattenResult.skipped` (10 chuỗi §1 #1–#10): `buildPreviewSpec` /
  `buildPreviewSpecFailsoft` chỉ đọc `flat.adjustments` / `flat.clips` /
  `flat.plainShifts`, KHÔNG đọc `.skipped`; `preview.tsx` cũng không đọc.
  Xác nhận lại kết luận NON-UI của M6 §3 — chỉ khác là giờ chuỗi đã có key,
  nên luồng nào surface `flat.skipped` (badge/toast/warning) sẽ nhận ngay
  chuỗi đúng locale mà không cần sửa lib nữa.
- `skippedReasons` (#11): chỉ test đọc (`nestedPreview.test.ts:206, 549,
  566, 578`). `preview.tsx` chỉ đọc `skippedEffects` (tên type) để
  `console.warn` trong `warnSkippedEffects` (dòng 477) — không hiện lý do.
  Muốn hiện lý do thì luồng sở hữu `preview.tsx` dùng
  `applyAdjustmentPreview(...).skippedReasons` (nay đã nhận lookup qua
  `splitClipByAdjustments`).

## 4. Kiểm chứng (số thật, chạy 2026-11-07)

Test mới `apps/web/src/lib/i18nRound57N4.test.ts` — **14/14 pass**,
chạy mẫu M5/L2 (esbuild bundle `--format=cjs` rồi `node`):

```
./node_modules/.bin/esbuild apps/web/src/lib/i18nRound57N4.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round57-n4/n4.test.cjs
node /tmp/round57-n4/n4.test.cjs   →  i18n round 57 N4: 14 pass
```

Test gồm: (A) fragment parity + không trùng key; (B) fallback không lookup
đúng từng chữ 11 chuỗi (runtime thật, gồm cả chuỗi độ sâu 16 qua chain 17
tầng và passthrough biên trong); (C) lookup EN dịch thật cả 11 chuỗi +
passthrough; (D) lookup VI = fallback; (E) source có đủ 11 `trKey` + thread
lookup qua `splitClipByAdjustments`; (F) §4.4 đã nối sẵn (key trong dict +
runtime EN); (G) call-site `preview.tsx` đã truyền `i18nT`.

Hồi quy chạy lại, toàn bộ xanh:

| Suite | Kết quả |
|---|---|
| `nestedPreview.test.ts` | 46 pass |
| `nestedRampPreview.test.ts` | 34 pass |
| `nestedPreviewFailsoft26J1.test.ts` | 6 pass |
| `nestedPreviewR3.test.ts` | 21 pass |
| `nestedUnify.test.ts` | 12 PROVEN pass |
| `i18nRound56M5.test.ts` (esbuild) | 21/21 pass |
| `i18nAudit55L2.test.ts` (esbuild) | 20/20 pass |

`tsc --noEmit` trong `apps/web`: **6 lỗi, tất cả trong
`src/lib/gopTrialDecode57N10.test.ts`** (file test của luồng N10 đợt 57:
import member không tồn tại `MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES` /
`TRIAL_DECODE_SAMPLE_CHUNK_BYTES` / `fetchSampleRemainderChunked`,
`allowImportingTsExtensions`, `fetchImpl`). **0 lỗi trong 3 file của N4.**
N4 không sửa file N10 (quy tắc tránh xung đột luồng song song) — parent cần
báo N10 sửa trước khi merge.

`vite build` trong `apps/web`: **pass** (18.03s; cảnh báo chunk >500kB có sẵn
từ trước).

Test không phải browser thật: các assert là tầng lib/helper qua esbuild +
Node; hiển thị trên UI thật cần click-test headed — chưa làm trong luồng này
(và hiện tại chuỗi skipped còn chưa có consumer UI, xem §3).

## 5. Literal VI còn sót trong `nestedPreview.ts` (đếm trung thực)

Quét bằng script: strip comment rồi đếm literal chuỗi chứa ký tự VI nằm
**ngoài** vùng `trKey(...)` (fallback trong `trKey` là cố tình giữ — một phần
của thiết kế M5, không tính là sót). Tổng 112 literal VI trong code, 74 vùng
`trKey`; chỉ còn **2 literal ngoài `trKey`**, đều là **label `{path}`** chứ
không phải thông báo:

- Dòng 2150 + 2177: `` `clip lá "${raw.id}"` `` — label truyền vào
  `resolveNestedRampCurve` / `rescaleConstantCurve` làm `{path}` cho các
  lỗi đã key sẵn (`nested.leafNoOwnCurve`, `nested.leafConstSpeed`,
  `curveErr.*`). Hệ quả có sẵn từ M5: bản EN của các lỗi đó mang nhãn VI
  (`clip lá "x": speedKeyframes must be...`). Đổi label sẽ đổi byte
  fallback VI mà test M5 đã khóa từng chữ nên N4 cố tình không đụng —
  cần quyết định ở tầng thiết kế (label trung lập + key riêng cho path)
  nếu parent muốn EN sạch 100%.

Mọi literal VI khác trong file là comment giải thích hoặc fallback trong
`trKey`.

## 6. Việc còn lại (cho luồng khác / parent)

1. **Gộp fragment**: `round57-n4.json` (11 key) chưa gộp vào `vi.json` /
   `en.json` — parent gộp cuối đợt như M5 (KHÔNG sửa trực tiếp vi/en
   trong luồng này, theo task).
2. **Surface `skipped` ra UI** (xem §3): nối `FlattenResult.skipped` /
   `skippedReasons` vào badge/toast ở `preview.tsx` nếu muốn user thấy các
   chuỗi này; hiện tại chúng chỉ nằm trong object trả về.
3. **tsc repo** đang fail vì file test của luồng N10 (xem §4) — báo N10 sửa.
4. (Tùy chọn) Label `{path}` VI `clip lá` trong lỗi EN (xem §5).

## 7. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round57-n4-nested-failsoft.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, chỉ file text):

- `apps/web/src/lib/nestedPreview.ts`
- `apps/web/src/i18n/fragments/round57-n4.json`
- `apps/web/src/lib/i18nRound57N4.test.ts`
- `docs/PHASE9_ROUND57_N4_NESTED_FAILSOFT_LIMITS.md`

`vi.json` / `en.json` KHÔNG sửa (parent merge fragment cuối đợt).
Không có binary/dist/`__pycache__`/benchmarks/results trong batch.
