# Phase 9 đợt 22 luồng E — Transition tầng ngoài biết curve + flatten placement

Ngày: 2026-10-29. Luồng E, KHÔNG push, KHÔNG tag/release, KHÔNG binary,
KHÔNG dist. Chỉ chạm `packages/video-spec/src/nested.ts` (+ mirror
`nested.js` theo quy ước DEVELOPER.md §4), test của chúng, và test biên
của `apps/web/src/lib/nestedPreview.ts` (không sửa logic preview — xem §1).

## 1. Kết quả khảo sát — báo đúng bản chất (test failing trước khi sửa)

Tiền đề "transition biên tầng ngoài chưa biết curve" chỉ đúng MỘT NỬA:

- **Preview (`flattenForPreview`) đã đúng với nested ramp thường gặp.**
  Đối chiếu trực tiếp với render ground truth
  (`server/render/src/nested.js` `flattenSpecForRender`) trên cùng spec,
  trước khi sửa bất kỳ dòng nào:
  - Fade-in, nested ramp phải (A 0..10, B start 10 dur 4, ramp linear
    1→3, T = 2): preview cho lá L start 8 dur 4, keyframes opacity
    [0, 0] → [2, 1]; render cho y hệt (L start 8 dur 4, cùng keyframes).
  - Fade-out, nested ramp trái (B start 0 dur 4, T = 2, C start 4 dur 10):
    preview cho L start 0 dur 4, keyframes [2, 1] → [4, 0], C start 2;
    render cho y hệt.
  - Lý do: T đo ở timeline cha, fade tính bằng thời gian ngoài
    (localT = timelineT − start), và đợt 20 đã rescale fade qua map tầng
    cha (`map(X) − map(X−T)`); curve của chính nested chỉ đổi nội dung
    bên trong nó, không đổi placement ngoài của nó. Sửa logic preview ở
    đây chỉ thêm rủi ro hồi quy nên KHÔNG sửa — thay vào đó khóa hành vi
    đúng bằng 4 test hồi quy mới (E1–E4, xem §3).
  - Trường hợp lá biên ngắn hơn T vẫn throw khớp render (lá đầu child
    0..2 dưới ramp 1→3 có dur ngoài 1.4641 < T = 2 → cả preview lẫn
    render đều throw "ngắn hơn transition").

- **Bug thật nằm ở `flattenNested` placement-only của video-spec.**
  Trước khi sửa, nested ramp (start 10 dur 4, ramp linear 1→3, trim
  0..8, 2 lá L1 0..2 / L2 2..6) cho placement TUYẾN TÍNH, sai hoàn toàn
  so với τ: L1 dur 2 (đúng 1.4641), L2 start 12 dur 6 (đúng start
  11.4641 dur 2.5359). Hệ quả cho transition biên: mọi consumer tính
  cửa sổ fade [đầu, đầu+T] / [cuối−T, cuối] từ `FlatClip` đều neo sai
  vị trí/dài dưới curve. Đây là test failing đã dùng để dẫn dắt sửa
  (probe tạm, đã xóa sau khi chạy).

## 2. Việc đã sửa (video-spec, placement-only được giữ nguyên)

- `flattenInto` không còn dùng bộ ba affine (mapP/mapQ/mapK) mà dùng
  time-map hàm hợp thành, mirror preview `TimeMap`:
  - Tầng tốc độ hằng: `toOuter(t) = S + (t − in)/v` (đúng số học cũ).
  - Tầng ramp: `toOuter(t) = S + τ(t − in)` với τ là nghịch đảo tích
    phân (chia đôi 80 vòng, ngoại suy tuyến tính theo tốc độ biên ngoài
    [0, tổng tiêu thụ] — mirror `nestedRampTauOffset` của preview và
    `mapChildOffset` của render).
  - Cửa sổ nested con: tốc độ hằng dùng `(Δ × v)`, ramp dùng
    `∫₀^Δ s` (`integrateSpeed`), khớp công thức preview/render.
  - Curve hằng (mọi keyframe cùng v) gộp chính xác về tốc độ hằng v —
    curve thắng speed hằng, khớp render đợt 18 §1.5 và preview.
  - Curve sai hình dạng (luật `validateNestedSpeedCurveShape`: 1–128
    keyframe, t ∈ [0, duration], v ∈ [0.25, 4], easing hợp lệ) hoặc
    duration không hợp lệ khi mang curve → throw fail-fast, không đặt
    lệch lặng lẽ. Thứ tự throw cũ (speed → trim → tracks) được giữ
    nguyên, message cũ giữ nguyên từng chữ.
- `nested.js` mirror sửa song song, cho cùng kết quả từng số với `.ts`
  trên probe (L1 1.4641016151377535, L2 start 11.464101615137753).
- Vẫn placement-only: `FlatClip` vẫn chỉ là {clip gốc giữ nguyên tham
  chiếu, absoluteStart, absoluteDuration, path, depth}; KHÔNG viết lại
  in/out/keyframe/fade của lá, KHÔNG áp shift/fade transition qua biên.

## 3. Kiểm chứng (số thật, không bịa)

- video-spec `nested.test.ts` (tsc ra /tmp rồi `node --test`): **64/64**
  (59 cũ + 5 mới: ramp 1 tầng qua τ; ramp dưới nested hằng speed 2;
  ramp ngoài + nested hằng trong; curve hằng gộp + curve thắng speed;
  curve sai hình dạng/duration → throw). Số suy tay bằng công thức giải
  tích (τ(2) = −2+√12, τ(4) = −2+√20, τ(3) dưới ramp 1→2 = −4+√40).
  Trong lúc viết test, 1 kỳ vọng ban đầu của chính tác giả sai
  (tưởng lá trong nested hằng chiếm [2,4) theo thời gian output của
  ramp — thực ra [2,4) là timeline con nên cả hai đầu đều qua τ, dur
  đúng 1.0080343398618261); đã sửa test theo công thức đúng, code
  không đổi.
- Preview hồi quy mới trong `nestedPreviewR3.test.ts`: **21/21**
  (17 cũ + 4 mới E1–E4: fade-in ramp phải; fade-out ramp trái; fade-in
  khai ở đầu trái phẳng; biên trong nested hằng speed 2 với nested con
  ramp — shift/fade chia 2 đúng 1s).
- Suite liên quan chạy lại, không hồi quy: nestedPreview 46/46,
  nestedRampPreview 34/34, nestedDemo 8/8, nestedUnify 12 PROVEN
  (2 PENDING nợ cũ), previewEngine 14/14, transitionPreview 26/26,
  twoLevelCurve 12/12, nestedDeep (composeNestedLeafWindow) 16/16.
- `tsc` ở `apps/web`: **0 lỗi**. Không chạy `vite build` để khỏi viết
  lại `apps/web/dist/` (cấm sửa dist).

## 4. Những gì CHƯA xong — nợ còn lại (không mạo nhận)

- `flattenNested` vẫn KHÔNG áp shift/fade của transition qua biên:
  `NestedClip` chuẩn không có field transitionIn/Out (normalize bỏ
  chúng kèm warning); shift/fade vẫn thuộc về preview/render. Đợt này
  chỉ sửa placement dưới curve mà fade neo vào, không thêm field
  transition vào spec.
- `composeNestedLeafWindow` (video-spec, helper riêng, không dùng cho
  đường biên preview) vẫn tuyến tính-only: dùng `nestedEffectiveSpeed`,
  bỏ qua speedKeyframes. Cần một đợt riêng nếu muốn nó biết curve —
  không đụng trong luồng này để khỏi lan scope.
- Attachment thời gian dưới ramp vẫn fail-fast cả preview lẫn render
  (reverse, track/karaoke/volumeKeyframes/animations keyframes) — giữ
  nguyên, không mở.
- Chỉ type "fade" được nối qua biên; track không phải video vẫn skipped;
  2 transition qua biên trên cùng một nested vẫn throw; lá biên ngắn
  hơn T vẫn throw — tất cả khớp render, không đổi.
- τ cho curve bezier dùng `integrateSpeed` (Simpson 64 khoảng, sai số
  < 1e-4 theo docs speedcurve) nên độ chính xác τ kế thừa sai số đó;
  linear/ease-in/ease-out là chính xác giải tích.
- `flattenNested` không kiểm tra dải speed [0.25, 4] cũng không kiểm
  tra trim khớp duration (nới lỏng có từ trước); việc đó vẫn thuộc về
  `validateNestedClip`/render, không thêm trong đợt này.
- Không đo trên browser thật, footage thật, hay project của user;
  parity preview-vs-render chỉ kiểm chứng ở mức flatten (placement +
  keyframes), không phải frame pixel.
