# PHASE9_ROUND24_H1 — nestedSplitOffset nghịch đảo τ — LIMITS

## Vấn đề gốc

`nestedSplitOffset` (apps/web/src/components/nested/nestUtils.ts, đợt 15
T3) map mốc ngoài về lá bằng nội suy tuyến tính
`mapK = absoluteDuration / (visibleEnd − visibleStart)`. Từ đợt 23 G3,
`composeNestedLeafWindow` đã đúng dưới ramp (ánh xạ τ), nhưng
`leafLocalTime` của split vẫn sai khi có tầng tổ tiên mang
speedKeyframes: mốc ngoài 11.4641s dưới ramp top 1→3 phải về lá là
2.0s, đường tuyến tính cũ cho ~2.369s (lệch 0.369s — test H1 khóa cả
điểm này). Nợ ghi ở `PHASE9_ROUND23_LIMITS.md` §4 và
`PHASE9_ROUND23_G3_CURVE_WINDOW_LIMITS.md` §"Nợ còn lại" (1).

## Ngữ nghĩa đã chọn (khớp compose/flatten, không bịa ngữ nghĩa mới)

- Dựng lại đúng ánh xạ thuận F của compose (đợt 23 G3) từ các bản ghi
  TRONG CÂY (khớp chain theo id như compose, không lấy bản copy caller
  truyền vào): top map `t → start + (t − trim.in)/v` (hằng) hoặc
  `start + τ(t − trim.in)` (ramp); mỗi tầng chain bọc ngoài bằng
  `prev(clip.start + g(t))`, `g = (Δ/v)` khi hằng, `g = τ(Δ)` khi ramp.
  τ mỗi tầng tái dùng `twoLevelTauOffsetLocal` sẵn có trong nestUtils
  (mirror `nestedRampTau` của nested.ts: bisection 80 vòng trên tích
  phân, ngoại suy tuyến tính theo tốc độ biên ngoài miền).
- Đảo F bằng bisection 100 vòng trên khoảng khả kiến
  `[leafStart + visibleStart, leafStart + visibleEnd]` (F đơn điệu ngặt
  vì tốc độ ≥ 0.25 — cùng giả thiết đơn điệu của τ ở flatten/compose).
  Mốc đúng bằng biên trả đúng `visibleStart`/`visibleEnd` (tránh sai
  số bisection tại biên, khớp hành vi đường cũ).
- Mọi tầng đều hằng (kể cả curve hằng đã gộp về v — curve thắng speed
  hằng, cùng luật flatten/compose): giữ NGUYÊN công thức tuyến tính cũ
  từng phép tính → hồi quy hằng khớp strict (test khóa bằng `eq`
  strict trên biểu thức cũ, không chỉ dung sai).
- `sourceTime` không đổi đường: vẫn qua `leafSourceTimeAt` của lá
  (tích phân ramp của chính lá, hoặc tốc độ hằng/reverse) — curve của
  lá không ảnh hưởng map ngoài→lá, chỉ ảnh hưởng lá→nguồn.
- Fail-fast, không rơi lặng lẽ về tuyến tính:
  - `composeNestedLeafWindow` throw trước với curve sai hình dạng của
    top/chain (message chứa `speedKeyframes`, giữ nguyên thứ tự lỗi cũ).
  - Đường đảo kiểm tra lại hình dạng khi resolve rate
    (`splitLevelCurveShapeError`, mirror
    `validateNestedSpeedCurveShape` của nested.ts — cùng ngưỡng 1–128
    keyframe, t ∈ [0, duration + 1e-6], v ∈ [0.25, 4], easing hợp lệ,
    bezier x1, x2 ∈ [0, 1]) và throw tiền tố `nestedSplitOffset:` kèm
    lý do (v ngoài miền, t ngoài duration, keyframes rỗng/> 128,
    duration không hợp lệ, tổng tiêu thụ không hữu hạn/dương).
  - F không hữu hạn / không đơn điệu ở hai biên, hoặc không đánh giá
    được giữa khoảng → throw, không trả số sai.
  - Mốc cắt ngoài cửa sổ khả kiến vẫn trả null như cũ (không phải lỗi
    curve); lá bị trim cắt hết vẫn null qua compose.

## Số tính tay (neo test, nghiệm bậc hai giải tích — không qua bisection của code)

- Ramp 1→3, duration 4: `s(t) = 1 + t/2`, `∫₀ᵘ = u + u²/4`,
  `τ(w) = −2 + √(4 + 4w)`; `τ(2) = −2 + √12 ≈ 1.4641016151377546`,
  `τ(4) = −2 + √20 ≈ 2.47213595499958`.
- Ramp 1→2, duration 4: `s(t) = 1 + t/4`, `∫₀ᵘ = u + u²/8`,
  `τ(w) = −4 + √(16 + 8w)`; `τ(2) = −4 + √32 ≈ 1.6568542494923806`,
  `τ(4) = −4 + √48 ≈ 2.928203230275509`.
- Chuỗi hai tầng (top 1→3 ∘ mid 1→2): mốc ngoài ứng với
  leafLocalTime = 2 là `τ₁₃(τ₁₂(2))`; duration cửa sổ là
  `τ₁₃(τ₁₂(4))`. Ba tầng (thêm inner 1→2): leafLocalTime = 1 ứng với
  `τ₁₃(τ₁₂(τ₁₂(1)))`. Hỗn hợp (top speed 2 hằng + mid ramp 1→2):
  `F(t) = τ₁₂(t)/2`, mốc ứng với leafLocalTime = 2 là `τ₁₂(2)/2`.
- Lá có curve riêng dưới ramp tổ tiên: leafLocalTime = 2 qua top ramp
  1→3, nguồn lá = `10 + ∫₀² (1 + t/4) dt = 12.5`.
- Mọi neo τ đều khớp trong 1e-9s ở test (chặt hơn yêu cầu 1e-4s của
  đợt); cửa sổ của mỗi fixture đều đối chiếu `flattenNested` trong
  1e-9s.

## Test (chạy thật, không assert suông)

File mới `apps/web/src/components/nested/nestedSplitTau24.test.ts`
(8 test, chạy bằng `node` trực tiếp nhờ type-stripping):

- `node apps/web/src/components/nested/nestedSplitTau24.test.ts`
  → **8 pass, 0 fail**: ramp đơn ở top (τ tính tay + khớp flatten +
  khóa độ lệch của đường cũ > 0.3s), ramp đơn biên + ngoài miền →
  null, hai tầng ramp chuỗi τ, ba tầng ramp chuỗi τ, hỗn hợp hằng +
  ramp, lá có curve riêng dưới ramp tổ tiên, hồi quy không curve
  (strict), fail-fast 3 case (v = 5 ở top, t = 5 vượt duration 4 ở
  mid, keyframes rỗng ở top — cả 3 throw chứa `speedKeyframes`).
- Hồi quy chạy lại (khớp số cũ, không đổi):
  - `nestedDeep.test.ts` → **16 pass, 0 fail** (gồm split hằng 2–3 cấp cũ).
  - `nestedRampSplitTrim20.test.ts` → **18 pass, 0 fail**.
  - `nestedGateSampling22.test.ts` → **12 pass, 0 fail**.
  - `nestedSpeedcurve.test.ts` → **22 pass, 0 fail**.
  - `twoLevelCurve.test.ts` → **12 check pass**.
- `npx tsc --noEmit` trong `apps/web` → **0 lỗi**. Lưu ý: test mới
  phải thêm vào `exclude` của `apps/web/tsconfig.json` (cùng quy ước
  với mọi test file chạy bằng node khác — chúng đều dùng import
  `.ts` mà tsconfig dự án không bật `allowImportingTsExtensions`;
  lúc đầu chưa thêm nên tsc báo đúng 1 lỗi TS5097 ở file test mới,
  đã sửa bằng cách thêm 1 dòng exclude, không đổi code sản phẩm).
- `npx vite build` trong `apps/web` → **pass** (8.34s, chỉ warning
  chunk > 500kB cũ). `apps/web/dist/` KHÔNG stage (quy ước các đợt).

## File đổi/thêm (KHÔNG push, chỉ để parent stage)

- `apps/web/src/components/nested/nestUtils.ts` — khối H1 trước
  `nestedSplitOffset`: `SplitLevelRate`,
  `splitLevelCurveShapeError`, `resolveSplitLevelRate`,
  `buildSplitForwardMap`; `nestedSplitOffset` rẽ nhánh hằng (công thức
  cũ nguyên vẹn) / ramp (bisection đảo F); doc hàm cập nhật.
- `apps/web/src/components/nested/nestedSplitTau24.test.ts` — test mới.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (file
  chung duy nhất chạm tới; các luồng khác cũng có thể chạm tsconfig —
  parent gộp cần giữ cả hai dòng nếu trùng).
- `docs/PHASE9_ROUND24_H1_SPLIT_TAU_LIMITS.md` — file này.
- KHÔNG đụng: `store.ts` (xem nợ nối store dưới đây), render worker,
  preview, `packages/video-spec` (không cần export thêm — τ và luật
  shape đều tái dùng/mirror từ code sẵn có trong nestUtils + spec).

## Nợ còn lại (không sửa nửa vời trong đợt này)

1. **Chưa nối vào store action:** `splitNestedDeepInnerClip` trong
   store nhận `splitTime` theo timeline của tầng chứa lá (nó kiểm tra
   margin quanh `leaf.start` trực tiếp), KHÔNG nhận mốc timeline
   ngoài — nên `nestedSplitOffset` hiện vẫn là helper thuần chưa có
   caller sống ngoài test (giống tình trạng trước đợt này; đợt này chỉ
   sửa đúng hàm thuần theo lệnh đợt). Muốn tách lá sâu từ playhead
   ngoài, cần một action/panel mới: `nestedSplitOffset` → đổi ra
   `leaf.start + leafLocalTime` → gọi `splitNestedDeepInnerClip` —
   để đợt riêng, không tự ý đổi ngữ nghĩa tham số của action cũ
   (đổi sẽ phá caller/panel hiện tại).
2. **Attachment thời gian dưới ramp vẫn fail-fast ở nơi khác:**
   `clipHasTimeAttachment` / cổng hai tầng vẫn khóa attachment dưới
   ramp (nợ đợt 23 §4) — đợt này không đụng tới, split τ không làm
   attachment bỗng hợp lệ.
3. **Cổng hợp curve 1→2 ba tầng vẫn giới hạn định dạng (nợ R1):**
   đó là giới hạn của cổng gộp curve, không phải của đảo τ — bản thân
   đảo τ đã tổng quát theo chain (test tới 3 tầng ramp) và chỉ bị
   chặn bởi `MAX_NESTED_DEPTH = 8` của compose.
4. **Giả thiết đơn điệu của τ:** bezier có y1/y2 tự do nên tốc độ tức
   thời có thể overshoot khỏi [0.25, 4] và phá tính đơn điệu ngặt của
   tích phân — đây là giả thiết chung của cả τ ở flatten/compose
   (đợt 22/23), không phải giới hạn mới do split gây ra; test H1 chỉ
   dùng linear nên không đo trường hợp này. Nếu sau này có bezier
   overshoot mạnh, bisection đảo có thể về nghiệm sai mà không throw
   (chỉ kiểm tra đơn điệu ở hai biên, không kiểm tra toàn khoảng).
5. **Preview `nestedRampPreview` không audit lại:** đợt này không đối
   chiếu preview dưới ramp tổ tiên với split mới — parity
   preview↔split dưới ramp tổ tiên vẫn là việc click-test riêng
   (nợ preview đã ghi từ G3).
6. **`splitLevelCurveShapeError` là mirror, không phải export dùng
   chung:** luật shape được nhân đôi từ
   `validateNestedSpeedCurveShape` (private trong nested.ts). Nếu spec
   đổi ngưỡng shape sau này, hai nơi có thể lệch — sửa bền là export
   validator từ spec rồi bỏ mirror, nhưng đợt này cố tình không đụng
   `packages/video-spec` để giữ phạm vi split flow.
