# ADJUSTMENT_LIMITS.md — Adjustment layer (Phase 9, N3 + R1 + spec R2)

## Đã nối vào render.js thật (luồng R1 — kiểm chứng bằng `node test_adjustment_render.js`, 39/39 xanh)

- Spec (R2): `VideoSpec.adjustmentLayers` trong
  `packages/video-spec/src/index.ts` — mảng layer cấp project, shape
  `{ id, start, duration, filters }` đúng `adjustment.ts` (mỗi filter entry
  chỉ `{ lut?, color?, effects? }`). Project cũ không có field này vẫn hợp
  lệ, hành vi cũ 100%.
- Validate (R1): `server/render/src/validate.js` kiểm tra field này trước
  khi dựng graph — layer sai shape / LUT lạ / filter rỗng / key lạ → lỗi
  (fail fast, không lặng lẽ bỏ qua); trùng id layer → lỗi; layer không giao
  clip video nào → chỉ cảnh báo.
- Wiring (R1): `server/render/src/render.js` đọc `spec.adjustmentLayers`
  trong vòng lặp track video, tách mỗi clip thành các đoạn con theo biên
  layer bằng `splitClipByLayers()` (trong `adjustment.js`) rồi mới chuẩn
  hoá từng đoạn. Đoạn trong layer được nối adjChain vào cuối chuỗi pixel
  của chính đoạn đó (sau effectsChain / enhPost / pluginChain — tức sau
  toàn bộ pipeline pixel của clip); đoạn ngoài layer giữ nguyên chuỗi cũ.
  Các đoạn lát kín đúng `[start, start + duration)` nên tổng thời lượng
  không đổi; audio kế thừa vẫn đọc clip gốc nên tiếng không bị tách.
- Thứ tự áp: trong một entry `color → LUT → effects`; giữa các entry theo
  thứ tự mảng `filters`; giữa các layer chồng nhau theo thứ tự mảng
  `adjustmentLayers` (layer sau ở ngoài cùng — nối filter tuần tự, không
  ghi đè; hai layer cùng chỉnh một tham số sẽ cộng dồn hiệu ứng).
- Ánh xạ `in` của đoạn đã kiểm chứng thật: không reverse thì
  `in + offset * speed`; reverse thì đoạn ở offset `o` lấy nguồn ở đầu xa
  (`in + (duration - o - d) * speed`, vì render trim cả đoạn gốc rồi đảo);
  speed 2 cũng đúng công thức. Clip speedKeyframes bao trọn trong layer
  (không cần tách) vẫn render bình thường, adjChain nối vào postChain ramp.

## Số đo thật (test_adjustment_render.js, nguồn testsrc2 320x240 30fps, so từng pixel)

| Case | Kết quả |
|---|---|
| 1 clip 0–6s, layer [2,4) brightness 60 | t=1 mean diff 0.037, t=5 mean diff 0.802 (ngoài layer), t=3 mean diff 76.844 (trong layer) |
| 2 clip kề nhau (0–3s, 3–6s), layer [2,4) tách cả hai | t=1: 0.037, t=2.5: 79.203, t=3.5: 86.368, t=5: 0.802 |
| Layer LUT `vcut-cyberpunk` [1,5) | t=0.5: 0.508, t=3: 3.112 (pct pixel lệch > 10 là 7.74%) |
| 2 layer chồng [2,4) (brightness + grayscale) | khác layer đơn tại t=3 (mean diff > 10) |
| Clip speed 2 (0–3s), layer [1,2) | t=0.5: 0.612, t=1.5: 76.875, t=2.5: 0.925 |
| Clip reverse 0–4s, layer [1,3) | t=0.5: 0.908, t=2: 77.151, t=3.5: 0.920; frame t=2 khớp eq(brightness) áp lên frame baseline cùng thời điểm với mean diff 0.665, nhưng khác eq áp lên baseline t=1 (9.278) và t=3 (8.102) — đoạn reverse không bị lấy lệch nguồn |
| Thời lượng sau khi tách | vẫn đúng 6s (không đổi) |

## "Giữ nguyên" ngoài layer — nói chính xác (không tô hồng)

- Chuỗi filter của đoạn ngoài layer giữ nguyên 100% (không thêm filter
  nào) — đó là phần render worker kiểm soát được và test chứng minh qua
  việc đoạn ngoài layer không hề có adjChain.
- Frame giải mã sau khi qua encoder x264 mặc định (GOP dài, có dự đoán
  liên frame) thì KHÔNG bằng nhau từng byte: frame ngoài layer lệch với
  baseline ở mức mean abs diff ≤ 0.92 / kênh (đo thật, xem bảng trên) do
  quyết định dự đoán/lookahead của encoder bị ảnh hưởng bởi các frame đã
  đổi trước đó — không phải do filter rò rỉ (frame trong layer lệch tới
  ~77, gấp ~80 lần). Muốn bằng nhau từng pixel thì cần encode intra-only
  (`-g 1`), nhưng CLI render.js hiện không có cờ GOP nên không claim
  "tuyệt đối từng byte" cho frame sau encode mặc định.
- Biên tách không trùng khung hình: nếu biên layer không phải bội số của
  1/fps, pha lấy mẫu của filter `fps` ở đầu đoạn có thể lệch dưới 1 frame
  so với clip không tách (bản chất của trim + fps, không riêng adjustment).
  Test dùng biên nguyên giây nên không gặp; biên lẻ giây là giới hạn đã
  biết, chưa đo riêng.

## Fail fast (thoát != 0, stderr nhắc "adjustment") — đã test cả 3

1. **Layer giao clip dính transition (xfade).** Xfade gộp 2 clip thành 1
   unit; tách sẽ phá cặp transition, còn áp adj cho cả unit thì sai ở vùng
   crossfade (vùng đó chứa nội dung cả 2 clip nhưng chưa chắc cả 2 đều
   giao layer). Kể cả layer bao trọn 1 clip trong cặp cũng bị chặn, vì
   vùng crossfade vẫn chứa nội dung clip còn lại.
2. **Layer cắt giữa clip có speedKeyframes / animations keyframes /
   motion track / mask keyframes / enhance.stabilize.** Các thứ này gắn
   theo thời gian cục bộ của clip (hoặc trf detect theo trim gốc): tách
   sẽ làm chúng chạy lại từ đầu đoạn hoặc lệch. Layer bao trọn clip thì
   không bị cổng này (không tách, render bình thường — đã test với ramp).
3. **Layer sai shape / LUT không tồn tại.** Validate chặn trước khi render;
   LUT `user-<slug>` thiếu file `.cube` thì `buildLutFilter` throw.

## Chưa làm / chưa nối (trung thực, không claim ngược)

1. **Chưa phân biệt "track bên dưới layer".** Shape N3/R2 không có field
   track nên layer áp cho MỌI clip video giao nhau về thời gian, bất kể
   track — giống ngữ nghĩa preview N5 (bỏ qua thứ tự track), KHÔNG phải
   ngữ nghĩa track-above chặt của CapCut (layer trên track A không được
   chạm clip ở track trên A). Thêm field track vào layer là việc spec
   tương lai; render worker không tự chế field này.
2. **Chỉ áp cho clip video.** Image/sticker/text không chịu adjustment
   layer (đúng CapCut: các lớp phủ này render sau video). Audio kế thừa
   của clip video cũng không bị layer chạm tới (layer chỉ là filter pixel).
3. **Chỉ 3 họ filter.** LUT catalog + LUT user, color thủ công, video
   effects — toàn bộ đều là filter pixel thuần. KHÔNG hỗ trợ: `enhance`
   (stabilize cần pass detect riêng theo từng clip), `mask`, `chromaKey`,
   keyframes, textfx, sticker, audio. Đưa field lạ vào filter entry sẽ
   bị `validateAdjustmentLayer` từ chối.
4. **Layer trong project con (nested subSpec) chưa có ngữ nghĩa.**
   Flatten của N2 chỉ lấy tracks từ project con; `adjustmentLayers` nằm
   trong subSpec sẽ bị bỏ qua lặng lẽ (không áp, không cảnh báo) — R2 đã
   ghi rõ là chưa định nghĩa. Chỉ layer ở spec cấp ngoài cùng mới được
   render.js áp dụng (và nó áp lên cả các clip đã phẳng từ nested clip,
   vì flatten chạy trước validate).
5. **Preview ≠ render ở layer chồng LUT.** Preview N5 cho layer trên
   thắng khi chuỗi 2 LUT; render nối 2 LUT tuần tự (lut3d nối tiếp). Hai
   bên đều đã ghi rõ, chưa thống nhất.
6. **UI N4 chưa nối sang spec này.** Bản ghi adjustment của UI
   (`kind: "adjustment"`, `filterType`/`intensity`, lưu trên track video
   host) KHÁC shape `spec.adjustmentLayers`; project export từ UI hiện
   tại chưa qua được validator (clip kind phải khớp track kind) và layer
   đó không được render.js áp dụng. Chuyển đổi UI → spec là việc riêng.
7. **`splitClipByLayers` chỉ có ở render worker.** Hàm tách này nằm trong
   `server/render/src/adjustment.js` (CJS); mirror TS
   `packages/video-spec/src/adjustment.ts` chưa có hàm tương đương (R2 sở
   hữu TS) — sửa logic tách ở một bên thì phải đối chiếu bên còn lại khi
   TS bổ sung hàm này, tránh lệch mirror như trường hợp message effects
   đã biết (xem mục dưới).
8. **Hiệu năng chưa đo riêng.** Mỗi layer thêm một đoạn filter vào chuỗi
   pixel của mọi đoạn nó giao nhau; chi phí tăng tuyến tính theo số
   layer × số đoạn giao nhau. LUT (`lut3d`) và effect nặng trên clip dài
   sẽ chậm tương ứng — đo chung theo benchmark render hiện có của repo.

## Khác biệt message mirror đã biết (không phải lỗi)

- `effects.ts` viết lỗi effect dạng `effects[0]: effect.intensity ...`,
  `effects.js` viết `effects[0].intensity ...` — cùng một lỗi, khác cách
  diễn đạt. Test parity N3 chuẩn hoá khác biệt này; không sửa `effects.js`
  vì nó đang được `validate.js` dùng chung (đổi message có thể vỡ test
  khác). Thống nhất message của 2 mirror effects là việc dọn dẹp riêng.

## Kế thừa từ N3 (vẫn đúng)

- Test cũ `test_adjustment.js` (46/46 xanh): unit validate/appliesTo/
  overlaps/chain, parity JS mirror vs TS, và render filter_complex dựng
  tay mô phỏng điểm nối. Từ R1, kiểm chứng wiring render.js thật nằm ở
  `test_adjustment_render.js` (39/39 xanh); test cũ giữ vai trò kiểm
  chứng chuỗi filter + logic chọn layer.
