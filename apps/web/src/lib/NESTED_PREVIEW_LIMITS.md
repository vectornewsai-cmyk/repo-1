# NESTED_PREVIEW_LIMITS.md — Preview cho nested sequence + adjustment layer (luồng N5, Phase 9)

## 1. Đã làm gì (chỉ preview, không đụng render lõi)

- `apps/web/src/lib/nestedPreview.ts` (mới, thuần TS, không import runtime):
  - `flattenForPreview(spec)` — làm phẳng nested clip thành clip lá kèm offset
    (ánh xạ affine thời gian sequence -> timeline ngoài, xử lý `in` + `speed`
    của nested clip, đệ quy nhiều cấp, cắt clip ở biên cửa sổ sequence).
  - `applyAdjustmentPreview(clip, layers, time)` — trả về filter mô tả
    (LUT/color/effects) áp lên clip tại thời điểm đó.
  - `buildPreviewSpec(spec)` — dựng spec cho preview: nested đã phẳng,
    adjustment đã gộp vào clip bằng cách cắt clip theo biên cửa sổ adjustment
    (đoạn ngoài cửa sổ giữ nguyên filter gốc).
- `apps/web/src/preview.tsx` (sửa tối thiểu, 2 chỗ): import `buildPreviewSpec`
  và đổi 1 dòng trong vòng lặp phát lại thành
  `buildPreviewSpec(useStore.getState().spec)`. Nhờ đó `renderFrame`,
  `syncMedia`/`collectActives` (kể cả seek khi pause) và các badge đều tự
  động chạy trên spec đã phẳng — video/audio trong nested được seek đúng
  frame chứ không chỉ vẽ hình tĩnh. Spec gốc trong store không bị sửa.
- `apps/web/src/lib/nestedPreview.test.ts` (mới): 14 test thuần, chạy thật bằng
  `node --experimental-strip-types src/lib/nestedPreview.test.ts` — 14/14 xanh.
- `apps/web/tsconfig.json`: chỉ thêm `nestedPreview.test.ts` vào `exclude`
  (theo đúng quy ước sẵn có của các file test khác) để `tsc` không biên dịch
  file test dùng API Node.

## 2. Ngữ nghĩa đã chọn (vì video-spec v0.2.0 chưa có 2 kind này)

File này nhận diện nested/adjustment bằng duck-typing, KHÔNG phụ thuộc định
nghĩa spec của luồng khác: nested = `kind === "nested"` + có mảng `tracks`;
adjustment = `kind === "adjustment"`, hoặc track có `kind === "adjustment"`,
hoặc clip mang field `adjustment` là object. Khi spec chính thức bổ sung 2
kind này, preview vẫn chạy nếu giữ đúng hình dạng field trên.

- Nested clip chiếm `[start, start + duration)` trên timeline cha và chiếu
  đoạn sequence con `[in, in + duration * speed)` (speed > 0, mặc định 1).
- Clip lá bị cắt mép trái (do biên cửa sổ sequence hoặc biên adjustment):
  với video/audio, `in` được dời theo `thời gian đã cắt * clip.speed` và
  `out` thu hẹp tương ứng; text/sticker/image chỉ đổi start/duration.
- Adjustment (U3 đợt 7 thay R4, xem §7 — đoạn R4 dưới đây chỉ còn giá
  trị lịch sử, đừng dùng để đối chiếu nữa): layer CHUẨN là
  `VideoSpec.adjustmentLayers` cấp project, áp theo thứ tự MẢNG, chỉ áp
  clip có track thuộc scope `tracks` của nó (`tracks` vắng = mọi track).
  Legacy `kind: "adjustment"` trong `track.clips` được normalize ở entry
  thành layer chuẩn có scope `[trackIndex]` của track host. LUT nối thật
  theo thứ tự mảng [LUT clip, LUT các layer theo đúng thứ tự mảng]
  (`lutChain`, preview-internal, không thuộc spec); color cộng dồn từng
  tham số rồi clamp `[-100, 100]` (0 bị lược bỏ); effects gộp, trùng type
  thì layer sau (trong mảng) thắng. Cửa sổ adjustment là
  `[start, start + duration)` — biên phải độc quyền.
- Các đoạn clip sau khi cắt vẫn giữ nguyên `id` gốc (chỉ 1 đoạn active tại
  mỗi thời điểm nên highlight theo selection không bị nhân đôi).

## 3. Preview khác render ở chỗ nào (trung thực)

1. **Đây mới chỉ là preview.** Render lõi (`render.js`) chưa biết nested/
   adjustment — bản export sẽ khác preview cho tới khi luồng render làm
   phần của họ. Đừng dùng preview này để khẳng định bản render.
2. **Transition qua biên nested — ĐÃ HỖ TRỢ từ R3 (chỉ type "fade").**
   Cặp biên (clip phẳng ngoài ↔ clip lồng nhau) được nối bằng fade
   opacity: đầu phải lồng nhau thì lá dịch sớm T giây + keyframes opacity
   0→effOp, đầu phải phẳng thì clip phẳng dịch sớm T giây + lá đầu trái
   fade-out effOp→0 (xem `server/render/src/R3_LIMITS.md`, test
   `nestedPreviewR3.test.ts` 17/17). Type khác "fade" → throw; các tổ hợp
   gây gap/pop → throw. Transition của clip lá bên trong thì giữ nguyên
   field như trước.
3. **Opacity của nested clip — ĐÃ HỖ TRỢ từ R3.** Opacity đặt trên nested
   clip được nhân vào từng clip lá (tĩnh nhân trực tiếp, keyframes nhân
   từng giá trị, lồng nhiều cấp nhân dồn). Speed vẫn xử lý qua ánh xạ
   thời gian như trước.
4. **Adjustment theo thứ tự track (R4 đã sửa; trước đây áp lên mọi
   track).** Layer chỉ áp cho clip có track thấp hơn trong cùng timeline
   (`adjustmentAppliesToClip`, chuỗi `trackStack` theo từng tầng nested).
   Còn lại: (a) layer cùng track với clip không áp — muốn áp phải đặt
   layer trên track adjustment riêng nằm trên; (b) preview vẫn cắt/gộp
   adjustment cho cả clip image/text/sticker/audio (chia đoạn) nhưng
   đường vẽ của các kind đó bỏ qua filter nên thực chất chỉ video đổi
   hình — đúng hướng N3 "chỉ video chịu adjustment", nhưng đoạn bị cắt
   vẫn làm đổi số đoạn clip (không đổi hình); (c) render.js vẫn chưa nối
   adjustment (xem NESTED_ROUND_LIMITS.md mục 1) nên preview đúng thứ tự
   vẫn có thể khác bản export cho tới khi render nối.
5. **Chuỗi LUT nối thật ở preview (R4 đã sửa; trước đây layer trên thắng,
   bỏ LUT dưới).** `applyAdjustmentPreview` trả `lutChain` = [LUT clip,
   LUT các layer từ dưới lên trên]; `videoClipVisual` nối chuỗi CSS
   xấp xỉ theo đúng thứ tự; `preview.tsx` áp WebGL lần lượt từng LUT
   (canvas ra của LUT trước làm nguồn cho LUT sau). Giới hạn còn lại:
   (a) WebGL theo nguyên tắc "tất cả hoặc không": 1 mắt xích chưa load
   xong/không khả dụng thì cả chuỗi rơi về CSS (đủ mắt xích, đúng thứ
   tự, nhưng chỉ là xấp xỉ); (b) fallback CSS không vẽ được LUT user
   (`user-*` không có xấp xỉ CSS) nên mắt xích đó bị lặng lẽ thiếu trong
   CSS — WebGL mới vẽ đủ chuỗi; (c) badge LUT chỉ báo có/không LUT
   (`filter.lut` = cuối chuỗi), không báo số mắt xích trong chuỗi.
6. **Effect preview không vẽ được thì bỏ qua + ghi chú, không giả vờ.**
   Bảng đầy đủ (16 effect chuẩn của video-spec, chia đúng 8/8; lý do nằm
   trong `SKIPPED_EFFECT_REASONS`, test kiểm tra từng loại):

   | Vẽ được (CSS/canvas) | Bỏ qua + lý do |
   |---|---|---|
   | blur, grayscale, sepia, vignette, brightness, invert, hue-rotate, old-film | sharpen (cần convolution, không có CSS tương đương); noise (nhiễu đổi theo frame, vẽ tĩnh sẽ sai); glitch (lệch kênh + sọc động); rgb-shift (dịch pixel theo kênh); shake (crop động theo thời gian); pixelate (lấy mẫu khối pixel); mirror (lật hình học, không phải filter màu); edgedetect (cần convolution biên) |
   | — | mọi type lạ chưa biết → bỏ qua, lý do "chưa biết" |

   Effect bỏ qua vẫn nằm trong danh sách effects đã gộp nên đường vẽ
   video báo `console.warn` 1 lần mỗi type (như effect cũ). Giới hạn:
   cảnh báo chỉ tới được clip video — effect của adjustment gộp vào clip
   image/text/sticker không qua đường vẽ effect nên không có cảnh báo
   nào (cũng không đổi hình, vì các kind đó bỏ qua effects); `enhance`,
   `mask`, `chromaKey`, keyframes, textfx, audio không phải video effect
   nên không nằm trong bảng này — đưa chúng vào adjustment sẽ bị
   `validateAdjustmentLayer` của N3 từ chối ở tầng spec, còn qua đường
   duck-typing của preview thì bị bỏ qua lặng lẽ (không báo).
7. **Mask/SR/track trên clip lá được giữ** (spread toàn bộ field của clip
   lá), nhưng mask keyframes và motion track vẫn tính theo thời gian cục
   bộ của clip lá sau khi phẳng — nếu clip lá bị cắt mép trái do biên
   nested, gốc thời gian của mask/track không được dời theo (lệch tối đa
   bằng độ dài đoạn đã cắt).
8. **Kéo-thả chữ trong nested chưa hoạt động.** Hit-test kéo chữ
   (`hitText` trong `preview.tsx`) đọc `store.spec` gốc, không qua spec
   đã phẳng, nên chữ nằm trong nested không bắt được bằng chuột. Chữ
   tầng ngoài không ảnh hưởng.
9. **Giới hạn kỹ thuật:** độ sâu nested tối đa 16 cấp; nested tạo chu
   trình theo id, nested có `speed <= 0`, `duration <= 0` hoặc số không
   hữu hạn đều bị bỏ qua và ghi vào `FlattenResult.skipped` (không crash,
   không treo). Nested nằm hoàn toàn ngoài cửa sổ sequence cha thì im
   lặng bỏ qua (không ghi skipped — đó là trường hợp bình thường).
   Track chứa clip nested bị `muted`/`volume` riêng (audio) không được
   kế thừa sang track `__nested-*` mới — nested audio luôn phát ở volume
   mặc định. Mỗi frame preview quét spec 1 lần để phát hiện nested/
   adjustment (O(số clip), cùng bậc với các vòng badge sẵn có); khi không
   có nested/adjustment thì trả đúng object spec cũ, không copy, không
   tốn thêm bộ nhớ.

## 4. Key i18n đề xuất (CHƯA thêm vào file i18n — parent merge sau)

- `preview.nestedFlattened` — nhãn track clip lá từ nested
  ("Nested (flattened)", hiện hard-code trong `buildPreviewSpec`).
- `preview.adjustmentActive` — badge khi có adjustment layer đang áp
  (hiện chưa có badge riêng; chỉ thấy qua đổi màu/LUT).
- `preview.effectSkippedInPreview` — chú thích effect bị bỏ qua ở preview
  (hiện chỉ có `console.warn` 1 lần mỗi effect như các effect cũ).

## 6. R4 (Phase 9) — preview parity cho nested/adjustment: đã làm gì

- `nestedPreview.ts`: thêm `trackStack`/`trackIndex`/`outerTrackIndex`
  cho clip lá + adjustment; hàm mới `adjustmentAppliesToClip` (quy tắc:
  cùng timeline ở độ sâu của layer, track layer phải nằm trên track chứa
  clip, cùng track không áp; dữ liệu cũ thiếu thông tin track thì fallback
  áp mọi clip như trước, ghi rõ là legacy); `applyAdjustmentPreview`
  nhận thêm `clipScope` và trả `lutChain` + `skippedReasons`;
  `splitClipByAdjustments` lọc layer theo scope TRƯỚC khi cắt (clip không
  chịu layer giữ nguyên 1 đoạn); `buildPreviewSpec` truyền scope thật
  cho clip ngoài lẫn lá trong nested (giữ `FlatClip`, không chỉ clip).
- `previewEngine.ts` (`videoClipVisual`): đọc `filter.lutChain`
  (preview-internal) — có chuỗi thì CSS nối từng xấp xỉ đúng thứ tự,
  `lut` = cuối chuỗi, `cssFilterNoLut` không chứa LUT; không có chuỗi thì
  hành vi cũ (1 LUT).
- `preview.tsx` (`drawVideoClip`): áp WebGL lần lượt từng LUT trong
  chuỗi; chỉ khi tất cả thành công mới dùng đường WebGL, ngược lại giữ
  frame gốc + CSS đã nối cả chuỗi.
- Test: `nestedPreview.test.ts` 31/31 (14 cũ + 17 mới: 7 thứ tự track,
  6 chuỗi LUT, 4 effect bỏ qua); `preview-engine.test.cjs` 337 assertion
  xanh (hồi quy, không sửa file test đó); script kiểm tra ngoài repo
  (`/tmp/r4-chain-check.cjs`, không stage) xác nhận CSS chuỗi đúng thứ
  tự cinematic → noir và `cssFilterNoLut` sạch LUT; `tsc` apps/web 0 lỗi;
  `vite build` pass. Không sửa `render.js`, không push, không binary.
- Chưa làm trong R4 (trung thực): badge LUT chưa báo số mắt xích chuỗi;
  cảnh báo effect bỏ qua chưa tới clip image/text/sticker; fallback CSS
  thiếu mắt xích LUT user; render.js vẫn chưa nối adjustment nên preview
  đúng vẫn khác export; hit-test chữ trong nested, opacity nested,
  transition qua biên nested vẫn như §3 cũ.

## 7. U3 (đợt 7, Phase 9) — thống nhất ngữ nghĩa nested/adjustment cho preview

Mục tiêu: preview đọc đúng ngữ nghĩa CHUẨN (spec/render) thay vì ngữ
nghĩa riêng của preview (R4 "track trên áp xuống", nested chỉ có
`tracks` trực tiếp, layer chuẩn/subSpec bị bỏ qua). Chỉ sửa
`nestedPreview.ts` + test của nó + file này; `preview.tsx` KHÔNG cần
sửa (điểm nối duy nhất vẫn là `buildPreviewSpec`, đã gọi sẵn).

### 7.1. Ngữ nghĩa chuẩn đã áp (preview)

- **Layer chuẩn cấp project:** `VideoSpec.adjustmentLayers` (duck-typed,
  không phụ thuộc validator spec — validator spec hiện chưa biết field
  `tracks`, xem §7.4). Mỗi layer `{ id, start, duration, filters,
  tracks? }`: `filters` là mảng entry `{ lut?, color?, effects? }`,
  gộp theo thứ tự mảng (LUT nối chuỗi, color cộng dồn, effects trùng
  type thì entry sau ghi đè). Layer áp theo **thứ tự mảng** (layer sau
  áp sau, ở ngoài cùng) — khớp thứ tự áp của render (`adjustmentLayers`
  nối tuần tự, layer sau ở ngoài cùng). Scope: `tracks` vắng = mọi
  track; có `tracks` thì chỉ áp clip có track thuộc danh sách. Với clip
  trong nested, layer cấp project xét **track tầng ngoài** chứa nested
  clip (`trackStack[0]`).
- **Legacy normalize ở entry:** clip `kind: "adjustment"` (hoặc mang
  field `adjustment`) trong `track.clips` được quy thành layer chuẩn có
  scope `[trackIndex]` của track host — tức chỉ áp clip trên đúng track
  host đó, KHÔNG còn áp theo "track sau nằm trên". Ngoại lệ duy nhất:
  track chuyên biệt có `kind === "adjustment"` không có host nên quy
  thành **không scope (mọi track)** — scope = chính track adjustment sẽ
  thành no-op (không clip lá nào nằm trên track adjustment), và đây
  cũng là default chuẩn khi field vắng. Lựa chọn này làm đổi hành vi cũ
  cho project dùng track adjustment chuyên biệt: trước đây layer chỉ áp
  track dưới nó, nay áp mọi track (kể cả track trên nó) — ghi rõ để
  luồng migration/UI biết, không giấu.
- **Scope xét theo tầng:** `adjustmentAppliesToClip` mới chỉ kiểm 2
  điều: (a) `nestedPath` của layer là tiền tố của `nestedPath` clip
  (layer ngoài áp vào lá trong nested; layer trong nested không áp clip
  ngoài hay nhánh khác); (b) `trackStack[level]` của clip (level =
  độ sâu timeline của layer) thuộc `scopeTracks`, hoặc scope vắng thì
  áp mọi. `trackIndex`/`outerTrackIndex`/`trackStack` trên window giờ
  chỉ còn là provenance/debug — KHÔNG được dùng để xét áp nữa. Scope
  rác (không phải mảng số nguyên >= 0) → throw. Chỉ số scope vượt quá
  số track thì không throw (chỉ đơn giản không khớp clip nào).
- **Thứ tự giữa 2 nguồn layer:** trong một timeline, layer legacy trong
  tracks (theo thứ tự track) đứng trước layer chuẩn (theo thứ tự mảng).
  Thứ tự này là quy ước nội bộ khi cả hai nguồn cùng tồn tại (spec
  không định nghĩa); trong từng nguồn, thứ tự mảng/track được giữ
  nguyên và chính là thứ tự áp.

### 7.2. Nested chuẩn: normalize về subSpec trước khi flatten

- `normalizeNestedClip` (exported, có test riêng) là cửa duy nhất vào
  `flattenNested`: hình cũ (`tracks` trực tiếp + `in`) và hình chuẩn
  (`subSpec` + `trim { in, out }`) đều về một dạng `{ tracks, in,
  trimOut?, subSpecLayers? }`. `isNestedClip` cũng đã mở rộng: nhận cả
  clip chỉ có `subSpec` (trước đây chỉ nhận clip có `tracks`).
- **Fail fast (throw, không lặng lẽ chọn một bên):** vừa có `tracks` vừa
  có `subSpec` mà nội dung khác nhau (deep-equal); `trim.in` khác `in`
  cũ; `trim` không hợp lệ (out <= in, in < 0); `duration` lệch
  `(trim.out − trim.in) / speed` quá 1e-6 (chỉ kiểm khi speed hợp lệ;
  speed/duration/start xấu đơn lẻ vẫn giữ hành vi cũ là bỏ qua +
  `skipped`, không throw). Khi `tracks` khớp `subSpec.tracks` thì dùng
  subSpec (kèm layer của nó).
- `trimOut` kẹp cửa sổ sequence con: clip/layer trong subSpec không tràn
  ra ngoài trim. Không có `trim` thì không kiểm duration, cửa sổ cũ
  `[in, in + duration*speed)` giữ nguyên (tương thích R3).
- **Layer trong subSpec KHÔNG còn bị bỏ qua:** `subSpec.adjustmentLayers`
  được validate ngay ở normalize, rồi quy thời gian qua `childMap`
  (ánh xạ subSpec → timeline ngoài) và kẹp vào khoảng sequence đang
  thấy, với scope xét theo track trong subSpec đó. Trước U3, render ghi
  rõ "Flatten chỉ lấy tracks, adjustmentLayers bị bỏ qua lặng lẽ" —
  preview nay đã sửa phía mình (xem §7.4 về phía render).

### 7.3. Sửa lặt vặt kèm theo (đều có test)

- **Layer phủ kín toàn bộ clip trước đây bị bỏ qua:** `splitClipByAdjustments`
  từng early-return khi không có điểm cắt trong, nên layer phủ kín clip
  (ví dụ layer chuẩn [0,10) trên clip [0,10)) không gộp filter gì cả.
  U3 bỏ early-return đó: đoạn duy nhất vẫn được gộp filter qua midpoint
  (midpoint nằm trong layer → active); layer chỉ chạm biên thì đoạn giữ
  nguyên filter gốc. Đây là lỗi thật của preview cũ, không phải hành vi
  "đã định" — render nối adjChain cho đoạn phủ kín nên preview cũ lệch
  render ở trường hợp này.
- **Chuỗi LUT đầy đủ:** `applyAdjustmentPreview` nay nối cả
  `filter.lutChain` của clip/layer (không chỉ `lut` đơn) — layer chuẩn
  nhiều entry LUT giữ đủ chuỗi theo thứ tự entry; clip đã mang chuỗi
  từ lần split trước không bị mất mắt xích đầu.
- **`buildPreviewSpec` bỏ field `adjustmentLayers` khỏi spec đầu ra:**
  layer chuẩn đã gộp vào clip, giữ field lại sẽ khiến code nào đọc
  field đó áp layer lần thứ hai (double-apply). Spec gốc không bị sửa
  (bỏ field chỉ xảy ra trên object đầu ra đã spread).
- **Test R4 cũ viết lại theo ngữ nghĩa mới** (không giữ test khóa ngữ
  nghĩa đã chết): 6 test "trên/dưới" thành test scope; test chuỗi LUT
  và effect dùng `scopeTracks` thay `trackStack`. Tổng
  `nestedPreview.test.ts` 44/44 (31 cũ đã viết lại phần scope + 13 test
  U3 mới: normalize 5, flatten subSpec/trim 2, subSpec layer 2, layer
  chuẩn 3, `hasNestedOrAdjustment` 1). `nestedPreviewR3.test.ts` 17/17
  không đổi (hình cũ vẫn tương thích). Test luồng U5
  (`nestedUnify.test.ts` §1–§2, viết theo ngữ nghĩa U3) 12/12 PROVEN
  xanh với code U3 — hai luồng khớp nhau, không xung đột.
- **`preview.tsx` không đổi:** điểm nối `buildPreviewSpec` đã có sẵn;
  không cần nối thêm.

### 7.4. Chỗ preview vẫn lệch render (trung thực — đọc trước khi claim khớp)

1. **Scope `tracks` hiện chỉ preview áp đúng — render chưa nhận.**
   Theo PENDING của luồng U5 (đã đo E2E): validator render hiện từ chối
   key `tracks` trên layer, và render áp layer cấp project cho mọi clip
   bất kể track. Tức project có layer scope `[0]` sẽ: preview chỉ đổi
   track 0, render đổi mọi track (hoặc lỗi validate). Thứ tự mảng thì
   hai phía đã khớp (layer sau ở ngoài cùng), nhưng scope thì chưa —
   cần luồng render nhận field `tracks` + áp đúng luật membership thì
   mới gọi là khớp. Đừng claim "preview = render" cho layer có scope.
2. **Layer trong subSpec: preview đã remap, render vẫn bỏ.**
   E2E case D của U5 chứng minh render hiện bỏ lặng layer của subSpec;
   preview U3 nay giữ lại + quy offset đúng. Cho tới khi render làm
   tương tự, bản export của nested có layer trong subSpec sẽ khác preview.
3. **Validator spec chưa biết field `tracks`:** preview đọc `tracks`
   bằng duck-typing nên chạy được ngay, nhưng project có layer scope sẽ
   chưa qua được `validateAdjustmentLayers` của spec (key lạ) — luồng
   spec của đợt 7 cần thêm field này thì chuỗi UI → spec → render mới
   thông. Preview không tự chế thêm field nào khác ngoài `tracks` đã định.
4. **Các lệch cũ từ §3 vẫn nguyên:** mask keyframes/motion track tính
   theo thời gian cục bộ sau phẳng (không dời theo đoạn đã cắt);
   hit-test kéo chữ trong nested vẫn đọc spec gốc; LUT user thiếu mắt
   xích ở fallback CSS; badge LUT không báo số mắt xích; cảnh báo effect
   bỏ qua chưa tới clip image/text/sticker. U3 không đụng các điểm này.
5. **Kiểm chứng kỹ thuật:** `tsc` apps/web chỉ còn 1 lỗi duy nhất nằm
   ở file của luồng U5 (`nestedUnify.test.ts` dùng import `.ts` mà
   tsconfig chưa exclude — không thuộc phạm vi U3, không tự sửa file
   của luồng khác; cần chủ file thêm vào exclude hoặc đổi import).
   `vite build` pass (không qua tsc). `preview-engine.test.cjs`
   337 assertion xanh (hồi quy, không sửa file đó). Không push, không
   binary, không sửa `packages/video-spec/*`, `server/render/*`,
   `components/nested/*`.

## 5. Chưa làm / cần luồng khác

- Render lõi cho nested/adjustment (ngoài phạm vi luồng N5).
- Timeline/store/editor tạo nested clip và adjustment layer thật (luồng
  khác sở hữu `Timeline.tsx`/`store.ts`/`index.ts` của video-spec — N5
  không đụng tới).
- Badge UI riêng cho adjustment đang active + i18n (đã liệt kê key ở §4).
