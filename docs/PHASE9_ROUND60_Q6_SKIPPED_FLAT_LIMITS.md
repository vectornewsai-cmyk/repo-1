# Phase 9 đợt 60 — Q6: `skippedReasons` tầng lib cho spec phẳng + decoder tụt không liệt kê sai (LIMITS)

Ngày: 2026-11-08. Luồng Q6, repo `vectornewsai-cmyk/repo-1`, nhánh main.
Đóng nợ đợt 59 §6.5 (= LIMITS đợt 59 P3 §5.3 + §5.4):
(a) spec phẳng không qua flatten → `skippedReasons` tầng lib vẫn rỗng
(đường frame ở UI bao được nhưng lib chưa đủ);
(b) decoder tụt thì helper frame vẫn liệt kê effect (nguyên nhân thật
lúc đó là decoder, không phải type effect).
KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG sửa vi.json/en.json.

## 0. Kết quả ngắn

- (a) `buildPreviewSpecDetailed` / `buildPreviewSpecFailsoft` nay trả
  `skippedReasons` đúng cho spec phẳng qua helper mới
  `flatSpecSkippedReasons` — GIỮ early-return, GIỮ identity object spec
  cũ, `skipped` vẫn `[]`. Khóa O3 §B' KHÔNG vỡ (test O3 không sửa, vẫn
  13/13 — fixture của nó là clip phẳng không effect nên vẫn trả `[]`).
- (b) `frameSkippedEffectTypes(spec, t, { notDrawnClipIds })` loại clip
  tick trước không vẽ được; `preview.tsx` ghi `tickSkippedClipIds` tại
  điểm `!srcEl` của `drawVideoClip` (decision "skip" / chưa có source
  element), reset cùng `tickHadHold`, truyền vào helper ở khối badge.
  Clip ở nhánh hold KHÔNG bị loại (frame giữ vẫn qua đúng pipeline nên
  effect vẫn bị skip thật như khi draw).
- Test mới 15/15 (đỏ-trước 0/2 probe); P3 16/16 (sau khi cập nhật 1 case
  boundary); O3 13/13; N4 14/14; hồi quy nestedPreview 46,
  nestedRampPreview 34, previewEngine 14, H6 15, M5 21, L2 20/20,
  J1 6. `tsc` 0 lỗi ở file Q6 (lỗi lúc chạy chỉ ở file luồng song song
  Q5 rồi Q2 — xem §5.4); `vite build` pass 22,08 s.
  Click-test headed PASS ngay lượt đầu (B0/B1/B2, xem §3.3).

## 1. Thiết kế đã chọn

### 1.1 (a) Thu lý do ở early-return, không bỏ early-return

Khóa O3 §B' cấm bỏ early-return một cách mù — nhưng không cần bỏ: lý
do skip của spec phẳng tính được mà không cần flatten. Helper mới
`flatSpecSkippedReasons` (export, `nestedPreview.ts`) quét clip lá tầng
ngoài và gọi đúng `applyAdjustmentPreview(clip, [], midpoint, scope,
lookup)` như nhánh không-layer của `splitClipByAdjustments` (đợt 59
P3) — cùng classifier 16 type chuẩn, cùng lookup, nên chuỗi lý do khớp
với đường flatten từng chuỗi (badge hợp nhất 2 nguồn không đếm trùng).
Chỉ clip có `effects` mới tốn 1 lần gọi (spec không effect nào chỉ tốn
vòng quét — early-return vẫn rẻ); clip không phải leaf (thiếu id,
duration <= 0) bị bỏ qua lặng lẽ như đường flatten; kết quả dedupe giữ
thứ tự. Cả 2 early-return (`detailed` + `failsoft`) dùng chung helper.
`skipped` (flatten) vẫn `[]` cho spec phẳng — không có gì bị flatten bỏ.

### 1.2 (b) Loại clip không vẽ được ở helper frame, theo id clip

`frameSkippedEffectTypes` nhận thêm tham số tùy chọn thứ 3
`opts?: FrameSkippedEffectOptions` (`{ notDrawnClipIds?:
ReadonlySet<string> }`) — không opts / set rỗng thì hành vi cũ (tương
thích ngược). Helper vẫn thuần: (spec, t, tập id tường minh). Điểm ghi
là điểm `!srcEl` duy nhất trong `drawVideoClip` — "clip không được vẽ
ở tick này" bất kể nguyên nhân (decision "skip" khi decoder tụt và
không có frame giữ, hoặc chưa có source element, hoặc ảnh chưa tải).
Clip thiếu media (`!item`) KHÔNG vào tập này: nhánh đó vẽ placeholder
text (đã vẽ, chỉ thiếu nội dung) — xem §5.2. Tập reset ở đầu
`renderFrame` cùng `tickHadHold` nên badge đọc giá trị tick trước, trễ
tối đa 1 tick như badge hold — chấp nhận được cho chỉ báo.

### 1.3 Vì sao không đụng badge merge / không đổi contract skippedReasons

Badge hợp nhất `failsoftSkippedReasons` (spec-wide, tầng lib) +
`frameReasons` (theo frame hiện tại). Sau Q6, với spec phẳng mang
effect lạ thì lib đã liệt kê đủ — `frameReasons` không còn bổ sung gì
thêm khi flatten thành công (2 nguồn khớp từng chuỗi, dedupe gộp
thành 1). Hệ quả trung thực: exclusion ở helper frame chỉ đổi được
badge khi đường lib rỗng (flatten ném lỗi → `failsoftSkippedReasons`
rỗng, badge chỉ còn lý do frame — lúc đó clip tụt decoder không bị
liệt kê sai). Muốn badge ẩn lý do theo từng clip ngay cả khi flatten
thành công thì `skippedReasons` phải mang attribution theo clip (đổi
contract chuỗi của O3/N4) — ngoài phạm vi luồng này, ghi nợ ở §5.1.
Task luồng này chốt ở helper frame ("không liệt kê sai") nên không mở
rộng sang đó.

## 2. Đã làm

### 2.1 lib — `apps/web/src/lib/nestedPreview.ts`

- `flatSpecSkippedReasons(spec, lookup?)` (mới, export): xem §1.1.
- `buildPreviewSpecDetailed` early-return:
  `{ spec, skipped: [], skippedReasons: flatSpecSkippedReasons(spec, lookup) }`.
- `buildPreviewSpecFailsoft` early-return:
  `{ spec, warnings: [], skipped: [], skippedReasons: flatSpecSkippedReasons(spec, lookup) }`.
- Comment giới hạn ở `BuildPreviewSpecDetailedResult` /
  `buildPreviewSpecDetailed` / `BuildPreviewSpecFailsoftResult` cập nhật
  theo hành vi mới.

### 2.2 lib — `apps/web/src/lib/previewEngine.ts`

- `FrameSkippedEffectOptions` (mới, export) + `frameSkippedEffectTypes`
  nhận `opts?` thứ 3, bỏ clip có id trong `opts.notDrawnClipIds`.
  Comment giới hạn cũ ("trừ trường hợp decoder tụt…") được thay bằng
  mô tả tham số mới.

### 2.3 UI — `apps/web/src/preview.tsx`

- `let tickSkippedClipIds = new Set<string>()` cạnh `tickHadHold` +
  comment; reset `tickSkippedClipIds = new Set()` ở đầu `renderFrame`
  cùng `tickHadHold = false`.
- `drawVideoClip`: điểm `if (!srcEl || mw <= 0 || mh <= 0)` nay ghi
  `tickSkippedClipIds.add(clip.id)` trước khi return.
- Khối badge: `frameSkippedEffectTypes(spec, playhead, {
  notDrawnClipIds: tickSkippedClipIds })`; comment khối cập nhật
  (helper nhận tập tick trước tường minh; spec phẳng nay đã có
  skippedReasons tầng lib nên frameReasons chỉ còn bổ sung phần lib
  chưa thấy — hiện tại là không còn phần nào khi flatten thành công).

### 2.4 Test khóa cập nhật (bắt buộc vì hành vi cũ đổi có chủ ý)

`apps/web/src/lib/skippedReasons59P3.test.ts` — CHỈ 1 case §C boundary
đổi: "spec phẳng không nested/adjustment → skippedReasons vẫn rỗng
(đường frame lo)" thành "… → skippedReasons tầng lib nay CÓ (đợt 60
Q6…)", kỳ vọng `[NEW_EN]`, kèm comment giải thích (giữ early-return +
identity, khóa O3 §B' vẫn xanh). Test O3 (`failsoftSurface58O3.test.ts`)
KHÔNG sửa — nó xanh nguyên 13/13, đó chính là bằng chứng khóa giữ.

### 2.5 i18n — không cần key mới, không fragment

Không thêm chuỗi UI nào (badge chỉ bớt liệt kê khi decoder tụt; không
có trạng thái "không biết" mới cần dịch). `vi.json`/`en.json` KHÔNG
sửa.

## 3. Kiểm chứng (số thật, chạy 2026-11-08)

### 3.1 Đỏ-trước — probe tạm 2 case (đã xóa sau khi đo)

`redBefore60Q6.test.ts` (chỉ dùng export đã có, assert hành vi mới):
0/2 đỏ — đúng 2 nợ: spec phẳng trả `skippedReasons []`; helper vẫn
liệt kê `weird-xyz` dù clip "a" trong `notDrawnClipIds`.

### 3.2 Test mới — `apps/web/src/lib/skippedFlat60Q6.test.ts`: 15/15 pass

Chạy mẫu N4/O3/P3 (esbuild bundle `--format=cjs` rồi `node`):
`./node_modules/.bin/esbuild apps/web/src/lib/skippedFlat60Q6.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round60-q6/q6.test.cjs && node /tmp/round60-q6/q6.test.cjs`

- §A lib spec phẳng (8 case): effect lạ → `[NEW_EN]` + identity spec +
  `skipped []` (cả detailed lẫn failsoft); không lookup → fallback VI
  nêu tên; lookup vi → chuỗi vi; spec không effect lạ → `[]` (khóa O3
  §B' giữ nguyên); 2 clip cùng effect → dedupe 1, 2 type lạ → cả 2 giữ
  thứ tự; chỉ effect chuẩn (blur/sharpen/glitch) → `[]`; text/image
  không effects + clip thiếu id/duration 0 → bỏ qua lặng lẽ, không
  crash; `flatSpecSkippedReasons` trực tiếp == `failsoft.skippedReasons`;
  hồi quy lá nested effect lạ vẫn `[NEW_EN]`.
- §B helper frame + notDrawn (4 case): clip trong set bị loại, clip khác
  cùng frame vẫn liệt kê; không opts / set rỗng → hành vi cũ; mọi clip
  đang hiện đều notDrawn → `[]`; id lạ trong set không ảnh hưởng clip khác.
- §C wiring (3 case): `nestedPreview.ts` dùng helper ở cả 2
  early-return; `preview.tsx` ghi `tickSkippedClipIds` ở điểm clip
  không vẽ được + truyền vào helper ở badge + reset cạnh
  `tickHadHold`; `previewEngine.ts` nhận opts `notDrawnClipIds`.
- Lưu ý: lần chạy đầu 14/15 — assert wiring tìm `tickHadHold = false`
  bằng `indexOf` bắt trúng dòng khai báo `let tickHadHold = false;`
  (dòng 1122) thay vì lệnh gán trong `renderFrame`; đã sửa test tìm
  đúng `"\n  tickHadHold = false;"` rồi chạy lại 15/15 — lỗi test, không
  phải lỗi sản phẩm.

### 3.3 Hồi quy (chạy lại, toàn bộ xanh)

| Suite | Kết quả |
|---|---|
| `skippedFlat60Q6.test.ts` (mới) | 15/15 pass |
| `failsoftSurface58O3.test.ts` (khóa, không sửa) | 13/13 pass |
| `i18nRound57N4.test.ts` | 14/14 pass |
| `skippedReasons59P3.test.ts` (1 case boundary cập nhật) | 16/16 pass |
| `nestedPreview.test.ts` | 46 pass |
| `nestedRampPreview.test.ts` | 34 pass |
| `previewEngine.test.ts` | 14 pass |
| `previewEngine51H6.test.ts` | 15 pass |
| `i18nRound56M5.test.ts` | 21 pass |
| `i18nAudit55L2.test.ts` | 20/20 pass |
| `nestedPreviewFailsoft26J1.test.ts` | 6 pass |

`tsc --noEmit` apps/web: **0 lỗi ở mọi file Q6 đụng** trong mọi lần
chạy (xem §5.4 về lỗi file luồng song song). `vite build` apps/web:
**pass, 22,08 s** (cảnh báo chunk >500kB có sẵn).

### 3.4 Click-test headed — PASS ngay lượt đầu

Harness `~/scratch-round60-q6/clicktest-60q6-skipped-flat.mjs`
(adapt từ harness P3: vite dev đóng băng + Chromium headed qua Xvfb
:164 + CDP, Node thuần; display :164, tag q6-1440x900): chích spec
PHẲNG qua `import("/src/store.ts")` — track V1 video clip mang effect
`weird-xyz` (0..4s), track T1 text "Xin chào"; KHÔNG nested, KHÔNG
adjustmentLayers.

- **B0 (phân biệt đường lib):** playhead = 5s, NGOÀI cửa sổ clip →
  badge `⚠ 1 hiệu ứng không vẽ được trong preview`, visible + trong
  viewport, title
  `type "weird-xyz" chưa biết, không có đường vẽ trong preview` — đường
  frame ở t=5 rỗng nên badge hiện được CHỈ CÓ THỂ là nhờ
  `flatSpecSkippedReasons` tầng lib. Toast effect kind `info` nêu tên.
- **B1 (đối chứng):** playhead = 0 (trong clip) → badge vẫn hiện, cùng
  nội dung.
- **B2 (helper trong trang):** `import("/src/lib/previewEngine.ts")`
  rồi gọi thật: `notDrawnClipIds: {"c1"}` → `[]`, không opts →
  `["weird-xyz"]`.
- Report: `~/scratch-round60-q6/q6-report-q6-1440x900.json`.
  Screenshot: `~/scratch-round60-q6/q6-badge-q6-1440x900.png`
  (đã xem bằng mắt: badge đỏ dưới preview + toast góc dưới-phải nêu
  tên `weird-xyz` + preview vẫn vẽ được chữ "Xin chào").

## 4. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round60-q6-skipped-flat.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, chỉ file text):

- `apps/web/src/lib/nestedPreview.ts`
- `apps/web/src/lib/previewEngine.ts`
- `apps/web/src/preview.tsx`
- `apps/web/src/lib/skippedFlat60Q6.test.ts`
- `apps/web/src/lib/skippedReasons59P3.test.ts`
- `docs/PHASE9_ROUND60_Q6_SKIPPED_FLAT_LIMITS.md`

Không có fragment i18n mới (không thêm key). Harness + report +
screenshot chỉ nằm ở `~/scratch-round60-q6/` (scratch, không stage).
Không có binary/dist/`__pycache__` trong batch.

## 5. Nợ mở / giới hạn trung thực

1. **Badge merge chưa ẩn lý do lib theo từng clip khi decoder tụt:**
   badge hợp nhất lý do lib (spec-wide) + lý do frame; exclusion ở
   helper frame chỉ đổi được badge khi đường lib rỗng (flatten ném lỗi
   → `failsoftSkippedReasons` rỗng, badge chỉ còn lý do frame). Khi
   flatten thành công, clip tụt decoder vẫn hiện lý do qua đường lib
   (đúng theo ngữ nghĩa spec-wide của O3: "spec có effect preview không
   vẽ được"). Muốn ẩn theo từng clip thì `skippedReasons` phải mang
   attribution theo clip — đổi contract chuỗi của O3/N4, cần quyết của
   parent, để luồng sau.
2. **Clip thiếu media (`!item`) không vào `tickSkippedClipIds`:**
   nhánh đó vẽ placeholder text nên tính là "đã vẽ"; badge vẫn liệt kê
   effect của clip thiếu media qua cả 2 đường. Tách riêng là việc khác
   (cần quyết: placeholder có tính là "không vẽ được" không).
3. **Trễ 1 tick:** `tickSkippedClipIds` đọc giá trị tick trước như
   `tickHadHold`; tick pause không gọi `renderFrame` thì giữ giá trị
   cũ (cùng độ trễ badge hold, chấp nhận được cho chỉ báo).
4. **`tsc` lúc chạy có lỗi ở file luồng song song (không phải file Q6):**
   lần 1: 3 lỗi ở `gopTrialDecode60Q5.test.ts` (luồng Q5); lần 2: 13
   lỗi ở `cssClasses60Q2.test.ts` (luồng Q2) — lỗi Q5 đã biến mất giữa
   2 lần chạy (Q5 tự sửa), đúng mẫu đợt 59 (P1). 0 lỗi ở mọi file Q6
   đụng trong mọi lần chạy; không sửa hộ file luồng khác.
5. **Headed chưa đo stall decoder thật:** B2 chỉ đo helper trong trang
   (module thật); chưa có fixture video stall xác định để ép decision
   "skip" thật trên browser rồi đo badge — cần file video stall + cơ
   chế ép tụt xác định, để luồng sau.
6. **Badge spec-wide (không phải bug):** lý do lib hiện cả khi playhead
   ngoài clip (B0) — cùng ngữ nghĩa O3 (`failsoft.skippedReasons` là
   của cả spec, không theo frame). Ai chỉ đọc badge mà tưởng effect
   đang ở frame hiện tại sẽ hiểu sai — frame mới là phạm vi của helper.
7. **Không đụng NestedClipPanel / LoadReportPanel:** giữ quyết định O3
   — badge preview là điểm hiển thị duy nhất.
