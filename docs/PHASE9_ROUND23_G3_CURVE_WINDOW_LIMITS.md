# PHASE9_ROUND23_G3 — composeNestedLeafWindow biết speed curve — LIMITS

## Vấn đề gốc

`composeNestedLeafWindow` trong `packages/video-spec/src/nested.ts`
(đợt 15 T3) hợp cửa sổ lá qua nhiều tầng nested bằng ánh xạ affine
duy nhất (mapP/mapQ/mapK, chia tuyến tính theo `speed` hằng). Nested
clip mang `speedKeyframes` bị bỏ qua hoàn toàn — nợ ghi ở
`PHASE9_ROUND22_LIMITS.md` §E. Trong khi đó `flattenNested` đã biết
curve từ đợt 22 E (mở phẳng qua τ), nên compose và flatten lệch nhau
ngay khi một tầng trong chain mang curve.

## Ngữ nghĩa đã chọn (khớp flatten/render, không bịa ngữ nghĩa mới)

- Mỗi tầng (top + từng chain step, lấy từ bản ghi TRONG CÂY như cũ)
  được resolve bằng `resolveNestedFlattenRate` — cùng luật flatten
  đợt 22 E và render đợt 18 §2:
  - Không có `speedKeyframes` → tốc độ hằng `nestedEffectiveSpeed`.
  - Curve hằng (mọi keyframe cùng v, sai số 1e-12) → gộp chính xác
    về tốc độ hằng v; **curve thắng `speed` hằng**.
  - Curve không hằng → ramp: `duration` là thời gian OUTPUT, cửa sổ
    con là `[trim.in, trim.in + ∫curve)`, ánh xạ ra ngoài qua
    τ = nghịch đảo tích phân (`nestedRampTau`, bisection 80 vòng,
    ngoại suy tuyến tính theo tốc độ biên ngoài miền — y hệt
    `flattenInto`).
- Cửa sổ tầng con tính như `flattenInto`: tầng hằng dùng
  `(vis − start) × speed`, tầng ramp dùng `∫₀^(vis−start) s`
  (tích phân theo thời gian OUTPUT tính từ `start` của tầng đó).
- Ánh xạ ra ngoài:
  - Mọi tầng đều hằng → giữ NGUYÊN đường affine cũ, cùng thứ tự
    phép tính (mapP/mapQ/mapK) → hồi quy hằng khớp bit-exact với
    hành vi trước đợt 23 (chứng minh bằng test strict, xem dưới).
  - Có ít nhất 1 tầng ramp → hợp hàm từ ngoài vào trong:
    `toOuter(t) = toOuter_prev(start + g(t − trim.in))` với
    `g = Δ/v` khi hằng, `g = τ(Δ)` khi ramp.
- `visibleStart`/`visibleEnd` KHÔNG đổi ngữ nghĩa: vẫn tính trong
  timeline của tầng chứa lá (giao của lá với cửa sổ tầng đó).
- `cumulativeSpeed` KHI CÓ RAMP: không còn là tốc độ tức thời duy
  nhất. Trường này nay là tích các "tốc độ gộp": tầng hằng đóng góp
  `rate.speed` (curve hằng → v của curve), tầng ramp đóng góp tốc
  độ TRUNG BÌNH `∫₀ᴰ s / D`. Nó chỉ là số tóm tắt — **không dùng
  để suy ra `absoluteStart`/`absoluteDuration` khi có ramp**
  (ánh xạ τ mới là chuẩn). Khi không có ramp, giá trị y hệt cũ
  (`1/mapK` = tích speed).
- Fail-fast (không lặng lẽ rơi về tuyến tính):
  - Curve sai hình dạng (keyframes rỗng, v ngoài [0.25, 4], easing
    lạ, t vượt duration, > 128 keyframe — luật
    `validateNestedSpeedCurveShape`) → throw, message chứa
    `speedKeyframes`, tiền tố `composeNestedLeafWindow:` (hàm
    `resolveNestedFlattenRate` nay nhận thêm tham số `caller`,
    mặc định `"flattenNested"` nên message của flatten không đổi).
  - Nested mang curve nhưng duration không hữu hạn / ≤ 0 → throw
    có lý do duration (cần duration output làm miền của τ).
  - Thứ tự lỗi: curve của top được resolve SAU các kiểm tra cũ
    (top speed/trim/tracks, leaf kind/start/duration) nên mọi lỗi
    không-curve cũ giữ nguyên thứ tự; curve của một chain step
    được resolve TRƯỚC khi xét vis của chính step đó (giống
    flattenInto), nhưng một `null` từ tầng TRƯỚC (bị trim cắt hết)
    vẫn short-circuit trước khi tới step sau — đúng thứ tự cũ
    (speed/trim lỗi của step sau cũng từng bị short-circuit như vậy).
- KHÔNG validate ở compose: `trim.out = trim.in + ∫curve` (cũng như
  flatten không kiểm tra) — đó là việc của `validateNestedClip`;
  cửa sổ lệch được kẹp bằng `max`/`min` và τ ngoại suy như flatten.

## Số tính tay (neo test, không lấy từ code)

- Ramp linear 1→3, duration 4 (neo đợt 20): `s(t) = 1 + t/2`,
  `∫₀^τ = τ + τ²/4`, `τ(2) = −2 + √12 ≈ 1.4641016151377546`,
  `τ(4) = −2 + √20 ≈ 2.47213595499958`.
  - Ramp trong + hằng ngoài (speed 2): lá `[0,2)` trong inner
    `[10,14)` → `absoluteStart = 5`,
    `absoluteDuration = τ(2)/2 ≈ 0.7320508075688772`.
  - Ramp ngoài + hằng trong: mid `[2,4)` → `absoluteStart =
    10 + τ(2) ≈ 11.464101615137755`,
    `absoluteDuration = τ(4) − τ(2) = √20 − √12 ≈ 1.0080343398618256`.
- Ease-in 1→2 trên `[0,4]`: `v(t) = 1 + (t/4)²` (easing của keyframe
  đầu áp cho đoạn), neo `speedAt(t=2) = 1.25`; `∫₀^T = T + T³/48`;
  τ kiểm bằng bisection độc lập phía test trên `integrateSpeed`.
- Bezier full-window: lá phủ đúng `[0, ∫₀⁴ s]` thì
  `absoluteDuration = duration` (τ của tổng tiêu thụ).
- Biên 0.25→4 trên duration 4: `∫₀^T = 0.25T + 0.46875T²`,
  `∫₀⁴ = 8.5`; `τ(w) = (−0.25 + √(0.0625 + 1.875w)) / 0.9375`
  (giải tích bậc 2, không qua bisection).
- Hồi quy hằng 3 tầng (top 7/speed 3/trim [1,10), mid 2/speed 0.5/
  trim [0,3), inner 1/speed 2/trim [0,4), lá `[0,5)`):
  `absoluteStart = 8`, `absoluteDuration = 4/3`,
  `cumulativeSpeed = 3`, `visible = [0,4)` — assert STRICT
  (`assert.equal`, không dung sai) với công thức affine cũ.

## Test (chạy thật, không assert suông)

File mới `packages/video-spec/src/nestedCurveWindow23.test.ts`
(12 test, chạy bằng `node --test` trực tiếp nhờ type-stripping):

- `node --test packages/video-spec/src/nestedCurveWindow23.test.ts`
  → **12 pass, 0 fail**. Mọi fixture curve đều đối chiếu 3 chiều:
  `.ts` ↔ `.js` (strict với hằng, 1e-12 với τ, 1e-6 với bezier)
  và compose ↔ `flattenNested` (1e-9, cả 2 module).
- Hồi quy: `npx tsc packages/video-spec/src/nested.ts
  packages/video-spec/src/nested.test.ts --outDir /tmp/nested-test23b
  --module nodenext --target es2022 --moduleResolution nodenext
  --skipLibCheck` rồi `node --test /tmp/nested-test23b/nested.test.js`
  → **64 pass, 0 fail**.
- `node apps/web/src/components/speed/nestedDeep.test.ts`
  → **16 pass, 0 fail** (gồm parity `.ts` ↔ `.js` của compose cũ).
- `npx tsc packages/video-spec/src/nested.ts --noEmit --module
  nodenext --target es2022 --moduleResolution nodenext --skipLibCheck`
  → **0 lỗi**. (Lúc đầu tsc báo 4 lỗi narrowing `lv.rate` trong
  closure `g`; đã sửa bằng cách rút rate ra biến local `const`
  trước khi tạo closure — không đổi logic.)

## File đổi/thêm (KHÔNG push, chỉ để stage)

- `packages/video-spec/src/nested.ts` — `resolveNestedFlattenRate`
  thêm tham số `caller`; `composeNestedLeafWindow` biết curve
  (đường affine cũ + đường hợp hàm τ); doc `ComposedLeafWindow`
  và doc hàm cập nhật ngữ nghĩa G3.
- `packages/video-spec/src/nested.js` — mirror viết tay tương ứng
  (cùng thứ tự lỗi, cùng 2 đường tính).
- `packages/video-spec/src/nestedCurveWindow23.test.ts` — test mới.
- `docs/PHASE9_ROUND23_G3_CURVE_WINDOW_LIMITS.md` — file này.
- KHÔNG đụng: `store.ts`, `NestedClipPanel.tsx`, i18n, render
  worker. Không binary, không tag/release.

## Nợ còn lại (không sửa nửa vời trong đợt này)

1. **`nestedSplitOffset` (apps/web/src/components/nested/nestUtils.ts)
   vẫn tuyến tính-only — NỢ MỞ.** Nó map mốc ngoài về lá bằng
   `mapK = absoluteDuration / (visibleEnd − visibleStart)` tuyến
   tính. Từ đợt này `window` nó nhận đã đúng dưới ramp (vì compose
   đã đúng), nhưng `leafLocalTime` nội suy tuyến tính vẫn sai khi
   có tầng tổ tiên mang ramp: cần nghịch đảo chuỗi τ (đi ngược
   hợp hàm từ ngoài vào trong, bisection trên ánh xạ đã hợp),
   không phải một phép chia. Sửa đúng cần đi lại chain + đảo τ —
   vượt phạm vi "chỉ sửa nested.ts/js + test" của luồng G3 và
   chạm store/split flow nên để đợt riêng, không vá tỉ lệ xấp xỉ.
   Khi mọi tầng đều hằng, `nestedSplitOffset` vẫn đúng như cũ.
2. **`deepNestedLeafVisibleSpeedCurve` tự hưởng lợi một phần:**
   `window` của nó nay đúng dưới ramp tổ tiên; phần slice curve
   của CHÍNH lá (dựa trên `visibleStart`/`visibleEnd` trong
   timeline tầng chứa lá) không đổi ngữ nghĩa nên không cần sửa.
   Nhưng `effectiveIn`/`effectiveOut` của nó đi qua curve của lá
   chứ không qua ramp tổ tiên — consumer nào cần in/out nguồn
   tuyệt đối dưới ramp tổ tiên vẫn phải tự map thêm qua τ.
3. **Preview `nestedPreview.ts` / `nestedRampPreview` không đổi:**
   đường ramp riêng của preview (đợt 19 G1) là module khác, không
   dùng `composeNestedLeafWindow`; đợt này không audit lại toàn
   bộ preview dưới ramp tổ tiên — parity preview↔compose dưới
   ramp tổ tiên vẫn là việc cần click-test riêng.
4. **Reverse + curve:** nested clip không có field reverse nên
   không áp dụng luật cấm reverse+curve của clip lá; không phát
   sinh tổ hợp mới.
