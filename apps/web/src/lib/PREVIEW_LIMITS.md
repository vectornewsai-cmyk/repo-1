# Preview — Giới hạn trung thực (R1-060/R1-061, cập nhật 2026-10-20)

Tài liệu này liệt kê **chính xác** những gì preview canvas làm được và chưa làm
được so với render engine (`server/render/src/render.js`). Không phóng đại.

## Đã parity (đã kiểm chứng bằng test + đọc code render.js)

| Hạng mục | Preview | Render | Ghi chú |
|---|---|---|---|
| Thứ tự transform video | speed → chroma → LUT → effects → opacity → keyframes | giống hệt | `PREVIEW_TRANSFORM_ORDER`, test `preview-engine.test.cjs` |
| Letterbox video (giữ tỉ lệ + nền đen) | ✅ | ✅ | Trước đây preview dùng cover-fit (crop) — đã sửa thành letterbox cho khớp |
| Image clip (contain/cover) | ✅ | ✅ | Trước đây preview không vẽ image track — đã thêm |
| Sticker (vị trí/tỉ lệ/xoay/opacity) | ✅ | ✅ | Trước đây preview không vẽ sticker — đã thêm |
| Composite video → image → sticker → text | ✅ | ✅ | Trước đây duyệt theo thứ tự track — đã sửa |
| Text keyframes x/y/opacity (ưu tiên hơn animation) | ✅ | ✅ | cùng công thức nội suy `interpolateKeyframes` |
| Video keyframes scale/rotation (+ x/y khi có SR) | ✅ | ✅ | cùng `interpolateKeyframes` + clamp scale [0.01, 8]; hình học khớp, nội suy pixel chỉ tương đối — xem mục 6 phần chưa parity |
| 7 text animation (fadeUp/fadeIn/slideIn*/slideUp/bounce/typewriter) | ✅ | ✅ | fadeUp đã sửa 0.5s/24px → **0.6s/30px** cho khớp render; typewriter đã sửa reveal suốt **duration** (trước đây min(1.5s)) |
| Opacity clip + fade transition | ✅ | ✅ | |
| Track hidden/muted | ✅ | ✅ | |

## Chưa parity / chỉ xấp xỉ (nói thẳng)

1. **LUT chỉ là xấp xỉ.** Preview ánh xạ 104 LUT sang CSS filter
   (`grayscale()`, `sepia()`, `contrast()`…). Cảm giác màu gần đúng nhưng
   **không pixel-perfect** so với file `.cube`. Muốn chính xác phải xem bản render.
2. **Effect `sharpen` và `noise` không hiển thị trong preview** (không có
   CSS/canvas tương đương; noise thời gian vẽ từng frame sẽ sai). Console warn
   1 lần. Bản render vẫn có đầy đủ.
3. **Vignette là xấp xỉ** (radial gradient canvas) so với filter `vignette` của FFmpeg.
4. **Chroma key là xấp xỉ.** FFmpeg tính khoảng cách màu trong không gian YUV;
   preview dùng khoảng cách Euclid RGB. Ngưỡng `similarity`/`blend` được ánh xạ
   tuyến tính (`inner = similarity*0.5`, `outer += blend*0.5` trên thang
   khoảng cách tối đa) — biên keying có thể khác render một chút.
   Xử lý ở độ phân giải ≤640px chiều rộng để giữ 30fps.
5. **Video keyframes x/y: không có hiệu ứng nhìn thấy ở CẢ render lẫn preview
   — TRỪ khi clip có thêm keyframes scale/rotation.** Render pad unit đúng WxH
   trước khi overlay nên biểu thức `interp * (main_w - overlay_w)` = 0 (đã kiểm
   chứng bằng render thật: 0 pixel khác nhau giữa t=0.2 và t=1.8). Preview
   mirror đúng công thức này. Khi có scale/rotation, element nhỏ hơn khung
   hình → overlay_w/overlay_h thay đổi theo frame và x/y CÓ tác dụng thật ở cả
   render lẫn preview (xem KEYFRAMES_LIMITS.md; test render A2 + placement
   trong `preview-engine.test.cjs` mục 10).
6. **Video keyframe `opacity`: render bỏ qua → preview bỏ qua** (parity).
   `scale`/`rotation` keyframes: **đã hỗ trợ ở cả render lẫn preview**
   (render: scale `eval=frame` + filter `rotate`; preview: canvas transform
   translate→rotate→scale quanh tâm element theo `videoElementPlacement`).
   Chỉ là mirror tương đối: vị trí hình bao và góc/hệ số khớp công thức render,
   nhưng nội suy hình ảnh khác nhau (FFmpeg scale bicubic/rotate bilinear so
   với drawImage của trình duyệt) nên không pixel-perfect. Clip có
   scale/rotation KÈM transition: render bỏ qua SR (validator cảnh báo) nhưng
   preview vẫn áp SR khi vẽ từng clip riêng lẻ → preview lệch render ở đoạn
   chuyển cảnh đó.
7. **Transition:** preview chỉ mô phỏng `fade` in/out. Các loại xfade khác
   (wipe/slide/…) chỉ thấy ở bản render.
8. **Typewriter:** preview hiện chữ bằng canvas theo đúng timing
   (ký tự i từ `start + i*duration/n`); render dùng ASS/libass — timing giống
   nhau, nhưng font rendering có thể khác chút ít.
9. **`ctx.filter`:** Safari cũ không hỗ trợ → LUT/effects lặng lẽ bị bỏ qua
   trong preview (có feature-detect). Bản render không ảnh hưởng.
10. **Tốc độ phát:** preview dùng `playbackRate` (giữ cao độ như atempo);
    `reverse` chỉ đúng khi pause/scrub (giới hạn HTMLVideoElement, đã ghi ở R1-013).
11. **Hiệu năng:** chroma key là tốn nhất (~5–10ms/frame ở 640px). Mục tiêu 30fps
    với 10 clip không chroma; clip có chroma có thể rớt frame trên máy yếu.

## Bug đã tìm và sửa trong đợt này (ngoài preview)

- **`server/render/src/render.js`: video có keyframes x/y làm render CRASH**
  (ffmpeg exit 234). Nguyên nhân: biểu thức overlay chứa dấu phẩy
  (`if(lt(...),...)`) nhưng không được bọc nháy đơn → FFmpeg tách nhầm filter.
  Demo `demo_keyframes_video.js` đã quote đúng. Đã sửa 1 dòng:
  `overlay=${ox}:${oy}` → `overlay=x='${ox}':y='${oy}'`. Kiểm chứng: render lại
  spec keyframes thành công, không còn crash.
