# Phase 9 đợt 10 — Preview khớp render: transition + effect + text (LIMITS tổng hợp)

Ngày: 2026-10-26. Chạy từ cron vcut-build-loop (20:03 +07). 6 luồng song song,
KHÔNG push, KHÔNG tag/release, KHÔNG binary. Parent kiểm chứng gộp + sửa
xung đột, stage 1 batch (xem `~/workspace/repo-1-push/paths-loop/phase9-round10-preview-parity.txt`).

## 1. Đã làm gì (và đã đo gì)

| Luồng | Nội dung | Kiểm chứng xanh |
|---|---|---|
| V1 transition preview | `lib/transitionPreview.ts`: hình học xfade cho 68 type catalog cũ (wipe/slide/circle/dissolve/custom-expr…), type lạ fallback fade; `transitionClipVisual` tính cửa sổ vào/ra cho 1 clip | test module 15/15; 17 assertions qua module biên dịch; tsc 0; vite build pass |
| V2 effect canvas | `lib/effectCanvas.ts`: vẽ thật 8 effect từng bị skip (mirror, pixelate, sharpen, edgedetect, rgb-shift, shake, glitch, noise có seed) trên ImageData; nối vào `preview.tsx` sau khối LUT | test 12/12; `effectsVisual` không còn skip 8 type |
| V3 transition render | +14 custom-expr vào `server/render/src/transitions.js` (diamondclose, squareopen/close, checker-alt, blinds-diag, split-h/v, barn-h/v, rings, corners, star, clock-ccw, spiral); catalog 67 → 81 (+none = 82 trong panel) | render FFmpeg thật + pixel-check 14/14 (dA/dB đều > 5, probe pattern đúng) |
| V4 text parity | 4 animation text lệch nặng (tiltIn, skewIn, slideReveal, curtainIn) chuyển sang render ASS thật (`\fr`/`\fax`/`\clip` + `\t`); mirror ở preview (`rotationDeg`/`skewXDeg`/`clipRect`) | render thật 17/17 (pixel đo được: xoay/skew/clip chặn đúng); preview mirror 8/8 |
| V5 UI badge | Badge trạng thái preview cho TransitionPanel/EffectPanel + i18n vi/en | test badge 125 assertions (sau sửa tích hợp); i18n parity 684/684 |
| V6 đối chiếu | Harness `test_v10_parity.js` (render FFmpeg vs preview canvas) + click-test CDP 6/6 + benchmark | fade KHỚP (sai số ≤ 0.5); mirror KHỚP (MAD 0.00); sharpen XẤP XỈ (MAD 1.04); pixelate LỆCH (MAD 26.75) |

Kiểm chứng gộp của parent (chạy lại độc lập, tất cả xanh): tsc 0, vite
build pass, V1 15/15, V2 12/12, V4 render 17/17 + mirror 8/8, V3 14/14,
V5 badge 125, i18n PASS, preview-engine script (gồm block V1) PASS,
nestedPreview 44/44 (qua test strip-types), previewEngine test PASS.

## 2. Sửa tích hợp do song song (parent)

1. **Badge effect của V5 bị lỗi thời ngay khi V2 xong**: V5 map 8 effect
   canvas về "chưa có preview" vì lúc đó chúng còn bị skip. Parent chuyển
   sang "xấp xỉ" trong `previewStatus.ts` (không "khớp": V6 đo pixelate
   LỆCH, sharpen chỉ xấp xỉ, noise/glitch dùng seed) và cập nhật test V5.
2. **Test `preview-engine.test.cjs` cũ assert sharpen/noise bị skip** → sửa
   thành "không còn skip" (V2 vẽ canvas thật) để block V1 chạy tới cuối.
3. **`transitionClipVisual` dời từ `previewEngine.ts` sang
   `transitionPreview.ts`**: `previewEngine` là file tsc-include nên không
   dùng được import `.ts` (TS5097), còn test strip-types lại cần extension
   tường minh; `.js` cũng không được (Node strip-types không map `.js`
   → `.ts` ở đây). Dời hàm sang module không import gì giải quyết cả hai:
   tsc 0, strip-types xanh, `.sh` biên dịch được. `preview.tsx` import
   hàm từ `transitionPreview`; test `.cjs` block V1 require module biên
   dịch riêng; `test-preview-engine.sh` thêm `transitionPreview.ts` vào
   include. Flag `allowImportingTsExtensions` đã thêm rồi gỡ (không còn
   cần sau khi dời hàm).
4. **Test V5 đếm panel 68 type** → sửa thành 82 (81 catalog + none) sau
   khi V3 thêm 14 type.

## 3. Giới hạn trung thực — đọc trước khi claim "preview = render"

- **Preview vẫn không phải crossfade thật.** Preview vẽ từng clip riêng
  lẻ: clip đang vào chỉ dùng lớp B, clip đang ra chỉ dùng lớp A, phần
  khung còn lại là nền đen. Hướng/vùng của từng lớp đúng, nhưng không
  thấy 2 clip cùng lúc như xfade render (V1, LIMITS §1). Đừng claim
  "transition preview khớp pixel render".
- **Một số transition preview chỉ xấp xỉ**: diag/smooth/wind/dissolve/
  pixelize/radial dùng biên cứng thay gradient, lưới ô thay nhiễu pixel,
  bỏ viền mềm; fadeblack/white/grays bỏ màu trung gian; hblur fallback
  fade; image clip chưa có transition hình học (V1).
- **Pixelate LỆCH có cơ sở** (V6 đo MAD 26.75): preview lấy màu pixel góc
  trái-trên của khối, FFmpeg scale neighbor lấy mẫu tại điểm khác trong
  khối. Trên nguồn phẳng 1 màu thì trùng; trên nguồn có chi tiết thì
  lệch hệ thống. Cần quyết định đổi điểm lấy mẫu của preview ở đợt sau
  hoặc giữ nhãn "xấp xỉ" (hiện badge đã là "xấp xỉ").
- **Noise/glitch chỉ xấp xỉ**: noise render là nhiễu thời gian không tái
  tạo được (canvas dùng seed); glitch canvas chỉ làm phần cắt lát, còn
  render glitch = rgb-shift + noise. Sharpen: kernel khác (box-blur 3×3
  vs unsharp 5×5) nên chỉ xấp xỉ (MAD 1.04).
- **Text parity**: `\clip` quét theo khung hình, không theo hộp chữ (ASS
  không biết bề rộng chữ đã render) nên thời gian lộ nhìn thấy ngắn hơn
  CSS gốc (vd chữ 208px giữa khung 640px chỉ lộ trong 0.34s–0.67s của
  hiệu ứng 1.0s). Preview mirror đúng công thức này nên preview khớp
  render, nhưng cả hai khác CSS gốc — sửa triệt để cần đo bề rộng chữ
  qua PNG trước khi dựng ASS (đợt sau). Clip vừa parity vừa karaoke thì
  render vẽ karaoke nhưng preview vẫn áp transform parity (validator đã
  cảnh báo).
- **Star chỉ xấp xỉ**: bán kính dùng `(1+0.4·cos 5θ)/0.6` để phủ kín khung
  ở P=1 nên cánh giữa transition dài hơn sao đều thật. Diamondclose/
  squareclose/clock-ccw là bản ngược chiều của transition đã có.
- **Không thể bằng custom-expr**: mọi hiệu ứng cần remap tọa độ (xoay,
  zoom/morph, swirl, glitch displace) và 21 transition GLSL vẫn ngoài tầm
  với nếu không có gltransition (không biên dịch lại FFmpeg).
- **V6 harness vẫn ghi PENDING cho phía preview của transition/text**:
  nhãn này là hardcode từ lúc viết harness (chưa có module V1/V4), không
  phải kết quả đo mới — module V1/V4 đã có trên đĩa và đã test riêng,
  nhưng đối chiếu frame preview-vs-render tự động cho transition/text
  thì harness chưa implement. Đừng đọc PENDING đó thành "chưa làm".
- **Chưa đồng bộ**: `nestedPreview.ts` vẫn giữ `PREVIEW_SKIPPED_EFFECTS`
  gồm 8 type canvas (báo cáo của adjustment-layer preview) dù đường vẽ
  chính đã vẽ thật — parent cố tình KHÔNG đổi vì chưa xác minh đường vẽ
  của adjustment layer có đi qua effectCanvas hay không; đổi nhãn báo
  cáo khi chưa xác minh đường vẽ là claim sai. Test `nestedPreview`
  hiện vẫn assert 8 type này là skipped — đợt sau xác minh rồi mới đổi.
- **Mirror `.js` của video-spec đã lệch từ trước đợt này**
  (`packages/video-spec/src/transitions.js` thiếu cả 9 entry P5 lẫn 14
  entry V3; nguồn thật là `transitions.ts`). Web dùng export `.ts` qua
  Vite nên panel không ảnh hưởng, nhưng đừng dùng file `.js` mirror làm
  căn cứ — cần regenerate bằng tsc ở đợt sau (không regenerate bừa
  trong đợt này vì sẽ chạm nhiều file).
- **TextAnimPicker vẫn liệt kê 18 animation cũ**, chưa có 4 animation
  mới (dùng được qua spec/API, chưa chọn được từ picker, chưa có key
  i18n cho chúng). Click-test V6 6/6 chạy trước khi badge effect của V5
  vào code nên badge effect chưa được click-test (badge đã có trong
  code, kiểm chứng bằng test node + tsc).
- **Số đo chỉ đúng máy đo**: VM 2 CPU (fade render 119–205ms, custom-expr
  166–384ms, pixelate 95–263ms qua các lần chạy). Pixelate render co
  khung khi kích thước không chia hết cho k (64×48, k=9 → 63×45).

## 4. Nợ mở cho đợt sau

- Đối chiếu frame preview-vs-render tự động cho transition/text trong
  harness V6 (bỏ nhãn PENDING hardcode).
- Đổi điểm lấy mẫu pixelate của preview cho khớp FFmpeg (hoặc giữ
  "xấp xỉ" một cách có chủ ý).
- Xác minh đường vẽ adjustment layer qua effectCanvas rồi mới đồng bộ
  `PREVIEW_SKIPPED_EFFECTS` + test nestedPreview.
- Regenerate mirror `.js` của video-spec bằng tsc.
- Đo bề rộng chữ qua PNG để `\clip` quét theo hộp chữ (text parity).
- Đưa 4 animation mới vào TextAnimPicker + i18n; click-test badge effect.
- Benchmark/đo trên footage thật, HD, clip dài (hiện chỉ nguồn tổng hợp).
