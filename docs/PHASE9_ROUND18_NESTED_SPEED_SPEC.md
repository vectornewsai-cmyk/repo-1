# Phase 9 đợt 18 — Spec: speedKeyframes trên clip nested (phía render)

Ngày: 2026-10-28. Luồng render của đợt 18. Đóng nợ đợt 17 N3 /
`PHASE9_ROUND17_LIMITS.md` §"Chưa đóng":

> "Nested mang speedKeyframes vẫn chưa có ngữ nghĩa duration (render
> worker cấm field này ở nested); patch speed hằng trên nested đã mang
> curve giữ nguyên duration."

Từ đợt này render worker KHÔNG còn cấm `speedKeyframes` ở clip lồng
nhau. Spec này định nghĩa ngữ nghĩa chính xác; code triển khai nằm ở
`server/render/src/nested.js` (flatten trước validate, giống mọi clip
lồng nhau khác — xem `render.js` bước flatten). Spec này chỉ nói phía
render; phía store/UI (patch nào tính lại duration, panel nào hiển thị
gì) thuộc luồng khác và phải tuân theo §2 dưới đây, không được tự
định nghĩa lại bất biến.

## 0. Ký hiệu

- Clip lồng nhau chiếm timeline ngoài `[S, S+D)` (`S = start`,
  `D = duration` — thời gian OUTPUT).
- Cửa sổ trong timeline con bắt đầu tại `in` (mặc định 0).
- Curve của clip lồng nhau (nếu có): `s(t)`, `t ∈ [0, D]`, là
  `speedKeyframes` đánh giá bằng đúng engine của
  `server/render/src/speedramp.js` (`speedAt`: linear / ease-in /
  ease-out / bezier, keyframe `v ∈ [0.25, 4]`, tối đa 128 keyframe,
  `t` trong `[0, D]` — cùng luật validator của clip ramp thường).
- Vị trí timeline con tại thời gian output `t`:
  `u(t) = in + ∫₀ᵗ s(τ) dτ` (tích phân ramp, `speedramp.js`
  `integrateSpeed`).
- Tổng nguồn con tiêu thụ: `C = ∫₀ᴰ s(τ) dτ`, cửa sổ con là
  `[in, in + C)`.
- Ánh xạ ngược `τ(w)`: thời gian output ứng với vị trí con `w`
  (`w` đo từ đầu cửa sổ, tức `w = childTime − in`):
  `τ(w)` là nghiệm của `∫₀^τ s = w`. Vì `s ≥ 0.25 > 0` nên tích phân
  đơn điệu tăng ngặt — nghiệm duy nhất, tính bằng chia đôi
  (80 vòng, sai số ≪ 1 frame). Ngoài `[0, C]` thì `τ` được ngoại suy
  tuyến tính theo tốc độ biên (`s(0)` / `s(D)`) — chỉ dùng cho fade
  audio (§4), không dùng cho ánh xạ clip.

## 1. Bất biến render kiểm tra (fail fast, không đoán)

Clip lồng nhau có curve phải thỏa TẤT CẢ, nếu không flatten throw và
render dừng (exit 1, giống mọi lỗi nested khác):

1. `duration > 0`, `in ≥ 0` (luật cũ, không đổi).
2. Curve hợp lệ theo đúng luật validator clip ramp thường: object
   `{ keyframes: [...] }`, 1–128 keyframe, mỗi keyframe `t ∈ [0, D]`,
   `v ∈ [0.25, 4]`, `easing ∈ linear | ease-in | ease-out | bezier`,
   bezier có `x1, x2 ∈ [0, 1]` (`y` tự do, overshoot được phép như
   clip thường).
3. Nếu ghi `trim.out` (hoặc `out` trực tiếp khi không có `trim`):
   `out = in + C` với sai số cho phép `1e-4` (lớn hơn `1e-6` của tốc
   độ hằng vì `C` tính bằng tích phân số với bezier; 1e-4s vẫn ≪
   1 frame ở 30fps = 0.033s). Không có `out` thì cửa sổ con kết thúc
   tại `in + C`.
4. `reverse` trên clip lồng nhau vẫn bị cấm hoàn toàn (luật cũ — đảo
   timeline con chưa được hỗ trợ, có hay không có curve cũng vậy).
5. Có cả `speed` hằng và curve: `speed` phải nằm trong `[0.25, 4]`
   (nếu không vẫn fail như clip thường), nhưng render DÙNG CURVE và
   BỎ QUA `speed` hằng + warning (khớp validator clip thường:
   "có cả speed và speedKeyframes — render dùng speedKeyframes").
   Đây là đáp án chính thức cho nửa sau của nợ N3: patch speed hằng
   trên nested đã mang curve KHÔNG đổi gì ở tầng render — curve
   thắng, duration giữ nguyên, `out` (nếu ghi) vẫn phải khớp tích
   phân curve, không khớp tích phân speed hằng.

## 2. Ngữ nghĩa duration — hai chế độ sửa, một bất biến

Đây là điểm N3 ghi là "chưa có ngữ nghĩa". Ngữ nghĩa là: **duration
của nested có curve là thời gian OUTPUT (giống clip ramp thường),
không phải suy ra từ trim; trim/out suy ra từ duration + curve.**
Render chỉ kiểm tra bất biến §1.3, không đoán chế độ sửa. Tầng
store/UI khi sửa curve phải chọn đúng một trong hai chế độ sau và
ghi cả hai đầu cho khớp (nếu không render sẽ fail ở §1.3 — đó là
tính năng, không phải lỗi render):

- **Chế độ duration-cố-định** (giống `patchCurve` của clip thường —
  đây chính là hành vi N3 đã làm: patch curve không đổi duration):
  giữ `D`, đặt lại `out := in + ∫₀ᴰ s`. Đổi curve mà giữ `D` thì
  đoạn con phát được dài/ngắn theo tích phân mới; cửa sổ con thay
  đổi, timeline ngoài không đổi.
- **Chế độ trim-cố-định** (giống `trimClip` theo ramp của đợt 14 R5):
  giữ `[in, out)`, tính lại
  `D := outputDurationForSource(s, out − in)` — tức đảo tích phân:
  thời gian output dài nhất mà nguồn tiêu thụ không vượt `out − in`
  (chia đôi, đúng hàm `outputDurationForSource` của
  `packages/video-spec/src/speedcurve.ts`, đã có mirror ở R5).
  Đổi curve mà giữ trim thì timeline ngoài co/giãn theo tích phân
  ngược, đoạn con phát vẫn đúng `[in, out)`.

Hai chế độ này mâu thuẫn nhau nếu áp cùng lúc — vì vậy patch đổi
curve BẮT BUỘC đi kèm hoặc duration mới (chế độ 1) hoặc trim mới
(chế độ 2) cho khớp; patch chỉ đổi curve mà giữ cả `D` lẫn `out`
cũ thì render fail ở §1.3 trừ khi tích phân mới tình cờ bằng cũ.
N3 "patch speed hằng giữ nguyên duration" nay được hiểu lại cho
đúng: ở tầng render, speed hằng bị curve lấn át (§1.5) nên duration
không có gì để tính lại; nếu store muốn đổi tốc độ thật thì phải
đổi curve (hoặc xóa curve rồi patch speed hằng theo luật N3 cũ).

Trường hợp suy biến — **curve hằng**: mọi keyframe có cùng `v`
(hoặc chỉ 1 keyframe) thì `s(t) = v` hằng với mọi `t` (vì
`speedAt = a.v + (b.v − a.v)·easing(...) = a.v` khi hai đầu bằng
nhau, bất kể easing — kể cả bezier overshoot). Render gộp chính
xác trường hợp này về tốc độ hằng `speed = v`: cửa sổ, ánh xạ lá,
transition, layer đều đi đường tốc độ hằng cũ, và các luật cũ cho
lá mang curve/attachment (chỉ cấm khi `speed ≠ 1`) được áp như cũ.
Không có gần đúng ở đây — đây là đẳng thức, không phải xấp xỉ.
Hệ quả: curve toàn `v = 1` không cấm lá mang attachment (vì thực
chất là `speed = 1`).

## 3. Ánh xạ clip lá qua cửa sổ ramp (thay cho ánh xạ tuyến tính)

Với clip con `[s, e)` trong timeline con, giao với cửa sổ
`[in, in + C)` là `[vs, ve)` (`vs = max(s, in)`, `ve = min(e, in+C)`).
Ngoài cửa sổ hoàn toàn → bỏ (như cũ). Ngược lại:

- `start' = S + τ(vs − in)`, `duration' = τ(ve − in) − τ(vs − in)`
  (với tốc độ hằng thì `τ(w) = w / speed`, đúng công thức cũ).
- Clip text/sticker/image (không có trục nguồn): chỉ đổi
  start/duration như trên, xong.
- Clip media (video/audio, có `in/out`, tốc độ hằng `c` — mặc định
  1): nó KHÔNG còn là clip tốc độ hằng sau ánh xạ, vì tốc độ hiệu
  dụng theo thời gian output là `c·s(t)` thay đổi theo `t`. Vì vậy
  lá được tổng hợp thành **clip ramp**:
  - `in' = in_gốc + (vs − s)·c` (phần con bị cắt trái, tính theo
    thời gian timeline con — giống công thức cũ, vì `vs − s` là
    thời gian con, chưa qua `τ`).
  - `speedKeyframes'` = slice của curve lồng nhau trên đoạn output
    của lá `[τ(vs−in), τ(ve−in))`, rebase về 0, nhân mọi `v` với `c`
    (slice dùng đúng thuật toán `sliceSpeedKeyframes` của R5/H3 đã
    port vào `nested.js`: linear đúng hệt, bezier đúng hệt nhờ chia
    de Casteljau, ease-in/ease-out đúng hệt nhờ bezier nâng bậc từ
    bậc 2 — không có gần đúng 0.125·|Δv| như bản R5 ban đầu).
  - `out' = in' + c·(ve − vs)`, capped ở `out` gốc (không vượt đoạn
    nguồn gốc). Tính nhất quán: `∫` của curve lá trên `duration'`
    bằng đúng `c·(ve − vs)` theo định nghĩa của `τ`, nên validator
    clip ramp thường (bỏ qua `out`, dùng `in + ∫`) và render ramp
    theo đoạn (segment 0.2s của `speedramp.js`) đều cho cùng đoạn
    nguồn — lá ramp tổng hợp đi đúng đường render ramp thường,
    không có đường render riêng.
  - Field `speed` hằng của lá bị xóa (curve đã chứa `c`; giữ lại
    chỉ gây warning "speed bị bỏ qua" ở validator).
  - Tích `v·c` của mọi keyframe sau slice phải nằm trong
    `[0.25, 4]` — nếu không flatten fail với thông báo rõ (validator
    phẳng cũng sẽ fail, nhưng fail ở đây nói rõ nguyên nhân là tích
    tốc độ lá × tốc độ lồng nhau vượt khoảng, thay vì để validator
    báo keyframe lạ).
- Clip lá bị cắt phải: các field gắn thời gian vượt `duration'` vẫn
  bị cắt + warning như cũ (đường `trimTimedFields`; với lá dưới
  ramp thì trường hợp này không xảy ra vì lá có attachment đã bị
  cấm ở §5, nhưng code vẫn giữ đường đó cho đường tốc độ hằng).

## 4. Fade audio, transition trong, adjustment layer, fade biên

- **Fade audio** (chỉ audio): giữ nguyên ngữ nghĩa cũ "giữ hình dạng
  fade, không scale" — chỉ đổi cách đo phần bị cắt sang thời gian
  output: `fadeIn' = max(0, fadeIn − cắtTráiOuter)`,
  `fadeOut' = max(0, fadeOut − cắtPhảiOuter)`, trong đó
  `cắtTráiOuter = τ(vs−in) − τ(s−in)` (với `τ` ngoại suy tuyến tính
  khi `s < in`) và tương tự phía phải. Với tốc độ hằng công thức
  này rút gọn đúng về `leftCut/speed` cũ.
- **Transition trong project con** (cặp còn nguyên vẹn, không bị cửa
  sổ cắt): thời lượng transition là thời gian timeline con, phải đổi
  sang thời gian output: với biên con `X` (cuối clip A = đầu clip B)
  và thời lượng con `T`, thời lượng output là
  `T' = τ(X − in) − τ(X − T − in)`. Lý do: render phẳng dịch clip B
  sớm `T'` giây (ngữ nghĩa xfade), và `∫` của curve trên đoạn dịch
  đó bằng đúng `T` giây con — tức nội dung B bắt đầu sớm đúng `T`
  giây con như thiết kế gốc. Cặp bị cửa sổ phá vỡ vẫn strip +
  warning như cũ.
- **Adjustment layer trong project con**: giao cửa sổ rồi ánh xạ bằng
  `τ` giống clip (`start' = S + τ(vs−in)`,
  `duration' = τ(ve−in) − τ(vs−in)`), scope thu hẹp như cũ (đợt 7 U2).
- **Transition qua biên + opacity** (R3): không đổi — `shiftIn`,
  `fadeIn`, `fadeOut` vốn đã là thời gian timeline ngoài; lá ở biên
  cửa sổ vẫn nhận keyframes opacity theo thời gian local (là thời
  gian output sau ánh xạ). Kiểm tra "lá ở biên" dùng `start'` sau
  ánh xạ `τ` nên vẫn đúng.

## 5. Các trường hợp bị từ chối (fail fast) và vì sao

| Trường hợp | Lý do |
|---|---|
| `reverse = true` trên clip lồng nhau (có/không curve) | Đảo timeline con chưa được hỗ trợ (luật cũ, giữ nguyên). |
| Lá `reverse` dưới clip lồng nhau có curve | Đảo + ramp không biểu diễn được bằng một clip ramp (cần curve đảo thời gian). Lá reverse dưới tốc độ hằng không bị cắt vẫn được như cũ. |
| Lá có `speedKeyframes` riêng dưới clip lồng nhau có curve | Hợp thành hai đường cong (curve của curve) chưa được triển khai — cần slice + hợp easing, ngoài phạm vi đợt này. Lá có curve dưới tốc độ hằng vẫn theo luật cũ (cấm khi `speed ≠ 1` hoặc bị cắt trái). |
| Lá mang attachment thời gian (`animations` keyframes, `track`, `karaoke`, `volumeKeyframes`) dưới clip lồng nhau có curve | Thời gian của keyframe/điểm track tính từ đầu lá theo thời gian con; qua `τ` phi tuyến chúng phải nội suy lại từng điểm — chưa làm. Đây là mở rộng trực tiếp của luật cũ "cấm khi `speed ≠ 1`": với ramp, mọi lá đều bị scale thời gian phi tuyến nên đều cấm (trừ khi curve gộp về hằng, §2). |
| Curve không hợp lệ (t ngoài `[0, D]`, `v` ngoài `[0.25, 4]`, >128 keyframe, easing lạ, bezier `x` ngoài `[0, 1]`) | Mirror validator clip ramp thường — project không hợp lệ không được render bừa. |
| `out` ghi sẵn không khớp `in + ∫curve` (sai > 1e-4) | Mơ hồ — không đoán chế độ sửa nào đúng (§2). Sửa ở tầng store/UI cho khớp rồi render lại. |
| `speed` hằng ngoài `[0.25, 4]` dù có curve | Luật clip thường: speed vẫn phải hợp lệ dù bị curve lấn át. |
| Hai tầng lồng nhau đều có curve (ramp ngoài + lá đã là ramp tổng hợp từ tầng trong) | Lá tầng trong sau flatten đã mang `speedKeyframes` → rơi vào hàng 3 ở trên và fail. Muốn hỗ trợ cần hợp curve hai tầng — nợ mở, xem LIMITS. |
| Lá media mà `v·c` vượt `[0.25, 4]` sau khi nhân tốc độ lá | Validator phẳng sẽ từ chối keyframe đó; fail sớm ở flatten với thông báo rõ nguyên nhân. |

Không bị từ chối (cố tình): lá text/sticker/image dưới ramp (không
có trục nguồn nên ánh xạ `τ` là đủ); lá media tốc độ hằng bất kỳ
trong `[0.25, 4]` miễn tích với curve vẫn trong khoảng; clip lồng
nhau có curve nhưng cửa sổ không cắt lá nào (ánh xạ vẫn qua `τ`,
không có đường tắt tuyến tính).

## 6. Những gì KHÔNG thuộc spec này

- Store/UI: patch nào tính lại duration theo chế độ nào (§2), panel
  nested speed, toast khi curve bị cắt — thuộc luồng store/UI, chỉ
  cần tuân bất biến §1.3.
- Preview web (`previewEngine`): preview cho nested ramp chưa làm
  trong đợt này — xem LIMITS (preview vẫn dùng ánh xạ cũ sẽ lệch với
  render; không claim parity).
- Hợp curve hai tầng, rescale keyframe attachment qua `τ`, lá
  reverse dưới ramp: nợ mở cho đợt sau (xem LIMITS).
