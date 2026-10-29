# EFFECT_CANVAS_LIMITS.md — Giới hạn trung thực: 8 effect vẽ thật bằng canvas (V2, Phase 9 đợt 10)

## 0. Đã làm thật

Module thuần `effectCanvas.ts` (ImageData, không DOM) implement 8 effect trước
đây `previewEngine.effectsVisual()` liệt kê vào `skipped`: mirror, pixelate,
sharpen, edgedetect, rgb-shift, shake, glitch, noise. `effectsVisual()` không
còn đưa 8 type này vào `skipped` (chỉ type lạ chưa biết mới bị báo), và
`preview.tsx` vẽ chúng thật ở bước effects của `drawVideoClip` (sau
chroma/LUT, trước mask/SR/opacity) qua offscreen canvas `effectCanvasSource`.

Kiểm chứng: `apps/web/src/lib/effectCanvas.test.ts` — 12/12 test xanh
(`node --experimental-strip-types`), `npx tsc --noEmit` trong `apps/web` sạch,
test cũ `previewEngine.test.ts` (14) và `nestedPreview.test.ts` (44) vẫn xanh.

## 1. Noise chỉ xấp xỉ — KHÔNG khớp frame render

Render dùng `noise=alls=…:allf=t`: nhiễu thời gian, mỗi frame ngẫu nhiên khác
nhau và không tái tạo được từ seed. Bản canvas dùng PRNG mulberry32 có seed
nên cùng seed cho cùng một ảnh; để nhiễu "sống" theo frame, preview đổi seed
theo localT (30 khung/giây). Hậu quả: hạt nhiễu preview và hạt nhiễu bản
render là hai dãy ngẫu nhiên khác nhau — giống về mật độ/cường độ (strength
= 5 + t*45, mirror render), khác về từng hạt, từng frame. Không có cách nào
khớp pixel-đối-pixel nếu không chạy cùng thuật toán nhiễu của FFmpeg.

## 2. Chiều dịch và công thức xấp xỉ — chưa đối chiếu pixel-đối-pixel với FFmpeg

- **rgb-shift**: đỏ dịch phải s = 2 + t*14 px, xanh dịch trái s (đúng dấu
  `rgbashift rh=+s, bh=-s` của render), vùng trống điền 0. Chưa chạy so sánh
  pixel-đối-pixel với frame render thật → ghi "chưa đo".
- **glitch**: render = rgb-shift + noise thời gian; bản canvas chỉ làm phần
  cắt lát ngang dịch ngẫu nhiên có seed (lát cao 1..8 hàng, dịch tối đa
  6 + t*10 px). Dùng cùng seed thì lặp lại được — ngược với glitch ngẫu
  nhiên của render. Preview đổi seed 12 lần/giây theo localT để glitch vẫn
  nhấp nháy, nhưng dãy lát/dịch vẫn khác render.
- **edgedetect**: render dùng thuật toán Canny của FFmpeg (`edgedetect`
  low/high); bản canvas dùng Sobel + ngưỡng tuyến tính low = 0.1 + t*0.2,
  high = 0.3 + t*0.3 (tỉ lệ /255, mirror ngưỡng render). Hình dạng biên tương
  đương về mặt thị giác, không khớp pixel-đối-pixel. Sai số: chưa đo.
- **sharpen**: render dùng `unsharp` 5×5; bản canvas dùng unsharp với blur
  box 3×3, amount = 0.2 + t*1.8 (mirror render). Độ gắt tương đương, kernel
  khác → sai số chưa đo.
- **shake**: dịch tịnh tiến (-12·sin(2πt·9), -12·cos(2πt·7)) suy ra từ công
  thức crop/pad của render; viền đen điền 0. Chưa đối chiếu frame render.
- **pixelate / mirror**: khớp công thức render (neighbor lấy pixel góc
  trái-trên khối k = 2 + round(t*14); hflip nhị phân), nhưng cũng chưa đo
  pixel-đối-pixel với frame render thật.

## 3. Thứ tự áp dụng — canvas trước CSS, bất kể thứ tự trong clip.effects

Trong render, mọi effect chạy nối tiếp theo đúng thứ tự mảng effects. Trong
preview, 8 effect canvas luôn chạy TRƯỚC toàn bộ CSS filter (blur, sepia,
…), bất kể vị trí của chúng trong mảng. Ví dụ clip có effects
`[blur, sharpen]`: render áp blur rồi sharpen, preview áp sharpen (canvas)
rồi blur (CSS) — kết quả thị giác gần giống nhưng không đồng nhất về mặt
toán học. Sửa đúng cần hợp nhất canvas + CSS thành một pipeline theo thứ
tự — chưa làm.

## 4. Phạm vi và hiệu năng — chưa đo

- Chỉ video clip đi qua `drawVideoClip` mới có canvas effects. Image clip
  không áp effects (khớp render: render cũng không áp effects cho ảnh).
- Hiệu năng: mỗi frame có canvas effect phải `getImageData` + `putImageData`
  ở độ phân giải letterbox đầy đủ (không cap 640px như chroma/mask). FPS
  thực tế khi bật sharpen/noise/glitch trên khung hình lớn: chưa đo.
- Khi không có document/context 2D, `effectCanvasSource` trả null và frame
  đó giữ đường vẽ cũ (effect bị bỏ qua ở frame đó, không crash) — hành vi
  fallback này chưa có test trình duyệt thật (test Node chỉ kiểm chứng hàm
  thuần; đường nối preview.tsx chỉ kiểm chứng bằng tsc + đọc code).

## 5. Nợ nhất quán còn lại (ngoài phạm vi luồng V2)

`apps/web/src/lib/nestedPreview.ts` vẫn giữ bảng riêng
`PREVIEW_SKIPPED_EFFECTS` (gồm cả 8 type này) và `SKIPPED_EFFECT_REASONS`
dùng cho báo cáo flatten adjustment/nested. Nghĩa là: clip đi qua adjustment
layer vẫn có thể bị báo "skipped" cho 8 type này trong báo cáo flatten,
dù đường vẽ chính trong preview.tsx đã vẽ chúng thật. Cần một luồng riêng
đồng bộ bảng này với `effectsVisual()` + cập nhật test
`nestedPreview.test.ts` (hiện vẫn assert `sharpen` bị skip) — KHÔNG tự sửa
trong luồng này để tránh xung đột file chung với các luồng song song khác.
