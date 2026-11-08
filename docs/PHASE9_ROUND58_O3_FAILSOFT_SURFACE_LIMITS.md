# Phase 9 đợt 58 — O3: surface `flat.skipped` / `skippedReasons` ra UI (LIMITS)

Ngày: 2026-11-07. Luồng O3, repo `vectornewsai-cmyk/repo-1`, nhánh main.
Đóng nợ đợt 57 §6.2 (LIMITS đợt 57 §2/§5/§6 + N4 LIMITS §3/§6.2):
đợt 57 N4 đã nối 11 key `nested.failsoft.*` nhưng chưa surface ra
badge/toast/warning vì cần thiết kế riêng. KHÔNG push, KHÔNG release/tag,
KHÔNG binary.

## 1. Thiết kế đã chọn — điểm hiển thị chính: badge cảnh báo preview (J1) + toast tóm tắt

**Điểm chính: badge cảnh báo thường trực dưới khung preview** (cùng
element `.preview-curve-warn-badge` của J1, góc dưới-trái) **+ 1 toast
tóm tắt mỗi loại khi tập skipped đổi.** Badge gộp: text curve warn cũ
(nếu có) + `preview.nestedSkippedBadge` + `preview.effectSkippedBadge`
nối bằng `·`; title (hover) liệt kê đầy đủ từng chuỗi lý do failsoft.
Toast nested = kind `error`, toast effect = kind `info`.

**Lý do chọn (ghi rõ theo task):**
1. `flat.skipped`/`skippedReasons` sinh ra trong lúc flatten cho
   preview — hậu quả user thấy là ở preview (lá/effect biến mất khỏi
   khung hình), nên badge preview là nơi đúng ngữ nghĩa nhất.
2. Badge J1 đã có sẵn pattern keyed-dedup (badge + toast 1 lần khi tập
   đổi, cập nhật qua ref không re-render mỗi frame) — reuse, không thêm
   DOM mới, không thêm panel mới, không đổi layout.
3. **Không chọn NestedClipPanel làm điểm chính:** panel chỉ mở khi user
   mở, và nó không chạy flatten nên không biết lá nào bị bỏ (muốn biết
   phải flatten lại từng clip — trùng việc, dễ lệch với preview thật).
4. **Không chọn LoadReportPanel:** nó chỉ hiện lúc mở project, không
   phản ánh preview runtime.
5. Toast gộp 1 cái mỗi loại (không toast từng chuỗi — nhiều lá lỗi sẽ
   spam); lý do đầy đủ từng chuỗi nằm ở title của badge.
6. Kind toast khác nhau có chủ ý: nested bị bỏ = mất nội dung khỏi
   preview → `error`; effect chỉ không vẽ trong preview, bản render vẫn
   có → `info` (khớp ngữ nghĩa console.warn cũ của `warnSkippedEffects`).

## 2. Đã làm

### 2.1 lib — `apps/web/src/lib/nestedPreview.ts`

- **`buildPreviewSpecDetailed(spec, lookup)` (mới):** tách từ
  `buildPreviewSpec` cũ — thân hàm cũ giữ nguyên từng dòng, chỉ thêm
  việc thu `flat.skipped` (dedupe giữ thứ tự) + `skippedReasons` qua
  collector của `splitClipByAdjustments`. Trả
  `{ spec, skipped, skippedReasons }`.
- **`buildPreviewSpec` nay là wrapper mỏng** trả `.spec` — mọi caller cũ
  không đổi hành vi (test khóa `JSON.stringify` đồng nhất, xem §4).
- **`splitClipByAdjustments` thêm tham số tùy chọn thứ 5**
  `collect?: { skippedReasons: string[] }` — thu
  `merged.skippedReasons` của `applyAdjustmentPreview`; không truyền thì
  hành vi cũ (bỏ ngay) giữ nguyên; cả 3 call-site cũ gọi 4 tham số vẫn
  xanh.
- **`BuildPreviewSpecFailsoftResult` thêm `skipped` + `skippedReasons`:**
  đường nhanh lấy từ `buildPreviewSpecDetailed`; đường chậm gom từ
  `buildPreviewSpecDetailed` của spec lược nested + từng lần flatten
  riêng lẻ thành công (bản đã sanitize nếu có) + collector split; nested
  bị drop thì không có flat để gom (warning của nó đã đủ). Dedupe ở cả
  hai đường.
- Không đổi ngữ nghĩa throw/fail-fast của `flattenForPreview` /
  `buildPreviewSpec` / `resolveNestedRampCurve`; không đổi thứ tự hay
  nội dung spec đầu ra.

### 2.2 UI — `apps/web/src/preview.tsx`

- Thêm ref `lastFailsoftSkippedKeyRef` (khóa riêng, tách khỏi khóa curve
  để đổi tập nào thì chỉ toast lại tập đó; badge thì gộp chung).
- Trong khối failsoft của vòng lặp (sau khối curve warn cũ): so sánh
  key `[...skipped, "||", ...skippedReasons]`; đổi thì bắn tối đa 2
  toast tóm tắt (`preview.nestedSkippedToast` với `{n, first}`,
  `preview.effectSkippedToast` với `{n, first}`); gộp 2 dòng badge vào
  `warnText`/`warnTitle` trước khi ghi badge. Nhánh `catch` (flatten
  throw ngoài phạm vi failsoft) giữ nguyên — skipped không rõ thì không
  bịa.
- Comment badge JSX cập nhật (J1 + O3).

### 2.3 i18n — `apps/web/src/i18n/fragments/round58-o3.json` (mới, 4 key)

| Key | VI | EN |
|---|---|---|
| `preview.nestedSkippedBadge` | ⚠ Bỏ qua {n} mục lồng nhau | ⚠ Skipped {n} nested item(s) |
| `preview.nestedSkippedToast` | Preview đã bỏ qua {n} mục lồng nhau (đầu tiên: {first}). Xem chi tiết ở badge cảnh báo dưới khung preview. | Preview skipped {n} nested item(s) (first: {first}). See the warning badge below the preview for details. |
| `preview.effectSkippedBadge` | ⚠ {n} hiệu ứng không vẽ được trong preview | ⚠ {n} effect(s) not drawn in preview |
| `preview.effectSkippedToast` | Preview không vẽ được {n} hiệu ứng (ví dụ: {first}). Bản render vẫn có hiệu ứng. | Preview cannot draw {n} effect(s) (e.g. {first}). The render still includes them. |

`vi.json`/`en.json` KHÔNG sửa trong luồng này (parent gộp cuối đợt như
M5/N4). Test §A merge-proof: key chưa gộp thì vắng, đã gộp thì đúng
giá trị fragment.

## 3. Kiểm chứng (số thật, chạy 2026-11-07)

### 3.1 Test mới — `apps/web/src/lib/failsoftSurface58O3.test.ts`: 13/13 pass

Chạy mẫu N4 (esbuild bundle `--format=cjs` rồi `node`):
`./node_modules/.bin/esbuild apps/web/src/lib/failsoftSurface58O3.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round58-o3/o3.test.cjs && node /tmp/round58-o3/o3.test.cjs`

- §A fragment: 4 key, vi/en cùng tập key, khác nhau từng key,
  placeholder khớp; merge-proof + không trùng fragment khác.
- §B đường nhanh: nested duration 0 → skipped invalidNested (EN),
  spec preview không còn track `__nested-video`; 2 clip tầng ngoài
  không id → skipped dedupe còn 1 (ghi chú: `flattenForPreview` thô
  vẫn giữ trùng — dedupe là việc của tầng detailed; và spec phải có
  1 nested lành để `hasNestedOrAdjustment` mở đường flatten, nếu
  không `buildPreviewSpec` trả object cũ).
- §B' `buildPreviewSpecDetailed(...).spec` đồng nhất
  `JSON.stringify` với `buildPreviewSpec` cũ; spec không
  nested/adjustment trả đúng object cũ + skipped rỗng.
- §C skippedReasons: lá nested mang effect `weird-xyz` + layer phủ →
  `["unknown type, no draw path in preview"]`, lá vẫn còn trong
  preview; không có layer phủ → `[]` (giới hạn đã ghi, xem §5.1);
  2 lá cùng effect → dedupe còn 1.
- §D đường chậm: nested v=5 + clip con không id → warning 1×
  `linear-1x` + skipped `clip inside nested "BAD" is not recognized`,
  lá lành vẫn hiện sau fallback.
- §E không lookup → fallback VI đúng từng chữ cả hai loại.
- §F wiring: `preview.tsx` chứa `failsoft.skipped`,
  `failsoft.skippedReasons`, `lastFailsoftSkippedKeyRef`, cả 4 key
  fragment; 2 key badge nằm trước chỗ ghi badge; toast gọi qua
  `i18nT` với key fragment (không hardcode chuỗi).
- §G lookup VI = fallback; EN dịch thật cả skipped + skippedReasons.

### 3.2 Hồi quy (chạy lại, toàn bộ xanh)

| Suite | Kết quả |
|---|---|
| `nestedPreview.test.ts` | 46 pass |
| `nestedRampPreview.test.ts` | 34 pass |
| `nestedPreviewR3.test.ts` | 21 pass |
| `nestedUnify.test.ts` | 12 PROVEN pass |
| `nestedPreviewFailsoft26J1.test.ts` | 6 pass |
| `i18nRound57N4.test.ts` | 14 pass |
| `i18nRound56M5.test.ts` | 21 pass |
| `i18nAudit55L2.test.ts` | 20/20 pass |

`tsc --noEmit` apps/web: **0 lỗi** (lúc đầu 3 lỗi TS2352 ở chính file
test mới — cast `Track[]` → `AnyRec[]` thiếu `unknown` trung gian; đã
sửa bằng `as unknown as AnyRec[]`, không đổi runtime). `tsc`
apps/desktop: **0 lỗi**. `vite build` apps/web: **pass, 13.13s**
(cảnh báo chunk >500kB có sẵn).

### 3.3 Click-test headed — PASS (browser thật)

Harness `~/scratch-round58-o3/clicktest-58o3-failsoft-surface.mjs`
(mẫu N1: vite dev đóng băng + Chromium headed qua Xvfb + CDP, Node
thuần): chích spec qua `import("/src/store.ts")` — track V1 nested
`n1` là clip đầu track mang `transitionIn` fade (firstClipTransition),
track V2 nested `n2` chứa lá mang effect `weird-xyz` + layer phủ
track 1 (skippedReasons).

- **Lượt 1 (dict chưa gộp fragment, trạng thái stage thật):** badge
  hiện + title đúng cả 2 chuỗi lý do + 2 toast đúng kind, NHƯNG text
  badge/toast hiện raw key (`preview.nestedSkippedBadge`…) vì `t()`
  trả key khi key chưa có trong dict — đúng hành vi thiết kế pre-merge
  (giống N4 trước khi parent gộp). Report:
  `~/scratch-round58-o3/o3-report-o3-1440x900.json` (verdict FAIL chỉ
  vì assert text VI — cơ chế đã đúng).
- **Lượt 2 (merge TẠM fragment vào vi/en để đo text cuối, rồi khôi
  phục):** **PASS** — badge
  `⚠ Bỏ qua 1 mục lồng nhau · ⚠ 1 hiệu ứng không vẽ được trong
  preview`, visible + trong viewport; title chứa
  `track "v1": clip "n1" có transitionIn nhưng là clip đầu track — …`
  và `type chưa biết, không có đường vẽ trong preview`; toast nested
  (error) + toast effect (info) đúng text VI. Screenshot:
  `~/scratch-round58-o3/o3-badge-o3-1440x900-merged.png` (đã xem bằng
  mắt: badge đỏ dưới preview + 2 toast góc dưới-phải + preview vẫn vẽ
  được chữ "Xin chào" của lá nested).
- **Khôi phục sau lượt 2 (đã verify):** `vi.json`/`en.json` chép lại từ
  backup `/tmp/round58-o3/backup/`, `sha256sum -c` OK, đếm lại
  **1937 key lá mỗi bên, key O3 vắng** — batch stage KHÔNG chứa
  vi/en.json. (Lưu ý: repo local không có `.git` nên không dùng
  `git checkout` được; backup + checksum là cơ chế khôi phục.)

## 4. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round58-o3-failsoft-surface.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, chỉ file text):

- `apps/web/src/lib/nestedPreview.ts`
- `apps/web/src/preview.tsx`
- `apps/web/src/i18n/fragments/round58-o3.json`
- `apps/web/src/lib/failsoftSurface58O3.test.ts`
- `docs/PHASE9_ROUND58_O3_FAILSOFT_SURFACE_LIMITS.md`

`vi.json` / `en.json` KHÔNG sửa (parent merge fragment cuối đợt).
Click-test + report + screenshot chỉ nằm ở `~/scratch-round58-o3/`
(scratch, không stage). Không có binary/dist/`__pycache__` trong batch.

## 5. Nợ mở / giới hạn trung thực

1. **Fragment chưa gộp:** 4 key mới chỉ nằm trong
   `round58-o3.json`; parent gộp cuối đợt như M5/N4. Trước khi gộp,
   badge/toast hiện raw key (đã đo ở click-test lượt 1) — đúng thiết
   kế i18n của repo, không phải bug O3.
2. **`skippedReasons` chỉ sinh khi có layer adjustment áp lên clip:**
   `applyAdjustmentPreview` chỉ được gọi trên đường split (khi
   `applicable.length > 0`). Clip mang effect lạ mà không có layer nào
   phủ thì không có reason nào được thu — test §C khóa đúng giới hạn
   này. Muốn đủ 100% thì phải gọi `applyAdjustmentPreview` cho mọi clip
   kể cả không có layer (đổi hot path, ngoài phạm vi tối thiểu của
   luồng này).
3. **Chuỗi lý do effect không nêu tên type:** key N4
   `nested.failsoft.unknownEffectType` không có var `{type}` nên title
   badge/toast chỉ nói "type chưa biết" chung chung, không nói effect
   nào (ví dụ `weird-xyz`). Muốn nêu tên type thì cần đổi key N4 (thêm
   var) + đổi `skippedEffectReason` — việc của luồng i18n sau, không
   làm ở đây để khỏi vỡ test N4 đã khóa từng chữ.
4. **Đường vẽ từng frame vẫn chỉ console.warn tên type:**
   `warnSkippedEffects(vis.skippedEffects)` trong `preview.tsx` (per
   frame, không qua failsoft) chưa dùng `skippedReasons` — badge O3 chỉ
   phản ánh failsoft (flatten). Hai đường có thể khác nhau ở clip
   không có layer phủ (xem #2).
5. **Badge `whiteSpace: nowrap` (có sẵn từ J1):** text gộp curve +
   skipped có thể dài và tràn ngang trên preview hẹp — chưa đo layout
   tràn (giống nợ V5 §1 của PREVIEW_BADGE_LIMITS.md). Title vẫn đọc
   đủ bằng hover.
6. **Không đụng NestedClipPanel:** panel không hiện cảnh báo failsoft
   theo từng nested clip (xem §1 lý do). Nếu parent muốn thêm điểm
   hiển thị thứ hai ở panel thì cần nối `flat.skipped` theo từng id
   nested — hiện tại `skipped` là chuỗi đã render, không mang id riêng
   (trừ khi chuỗi tự chứa id như `nested "x" …`).
