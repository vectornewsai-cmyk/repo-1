# Preview — Giới hạn trung thực (R1-060/R1-061, cập nhật 2026-10-20; P1 Phase 7: 2026-10-23)

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
| Video keyframe `opacity` (P1 Phase 7) | ✅ | ✅ | keyframes thắng tuyệt đối tĩnh (khớp K1); lệch duy nhất ở clip đã merge transition — xem mục 6 |
| Text keyframes scale/rotation (P1 Phase 7) | ✅ | ✅ | mirror nhánh PNG SR của render (`textSrPlacement`); typewriter + SR → SR bị bỏ qua ở cả hai |
| Mask rect/ellipse/feather (Q1 Phase 8) | ✅ | ✅ | cùng công thức geq render (`maskAlphaAt`/`applyMask`); unit preview giới hạn 640px nên viền cứng mềm hơn render — xem `Q1_LIMITS.md` §1 |
| Speed ramp `speedKeyframes` (Q1 Phase 8) | ✅ | ✅ | `rampSpeedAt` + `rampSourceTimeAt` (tích phân đúng); playbackRate nhảy theo bậc mỗi frame RAF, drift chặn bằng re-seek 0.35s — xem `Q1_LIMITS.md` §2 |
| Phát ngược từng clip (P1 Phase 7) | ✅ (bước từng frame) | ✅ (areverse + reverse) | video: seek từng frame khi phát; audio reverse bị mute khi phát — xem mục 10 |
| Track hidden/muted | ✅ | ✅ | |

## Chưa parity / chỉ xấp xỉ (nói thẳng)

1. **LUT: WebGL 3D thật khi đủ điều kiện, CSS xấp xỉ khi không.**
   (R5 Phase 9, `lib/webglLut.ts`.) Khi clip có `filter.lut` và bridge local
   đang chạy + WebGL khả dụng + `.cube` đã tải xong, preview áp đúng lưới 3D
   bằng shader trilinear — đo thật trên Chromium headless: MAE 0.46/255,
   RMSE 0.67, max 1 so với FFmpeg `lut3d` (LUT vcut-cinematic, gradient
   256×256), tức ngang mức làm tròn 8-bit, tốt hơn ~35× so với CSS approx
   (RMSE trung bình ~16 sau Phase 8 fit). Khi bridge chưa chạy, WebGL không
   khả dụng, hoặc `.cube` đang tải/lỗi thì preview rơi về CSS filter cũ và
   badge góc trên-phải báo rõ: "LUT WebGL" / "LUT…" (đang tải) /
   "LUT CSS ≈" (đang dùng xấp xỉ). Color adjust và effects vẫn là CSS
   (chưa qua WebGL); xem chi tiết + số fps trong `R5_LIMITS.md`.
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
6. **Video keyframe `opacity` (P1 Phase 7 — đã parity, comment cũ
   "render bỏ qua → preview bỏ qua" nay SAI).** Render K1 áp opacity keyframes
   thật (alphaextract→geq→alphamerge); preview nay nội suy cùng
   `interpolateKeyframes`, clamp [0,1], keyframes thắng tuyệt đối tĩnh.
   Lệch duy nhất: clip đã **merge transition** thì render fallback về opacity
   tĩnh của clip đích (validator cảnh báo) nhưng preview không biết trạng
   thái merge nên vẫn áp keyframes → lệch render ở đoạn chuyển cảnh đó.
   `scale`/`rotation` keyframes: **đã hỗ trợ ở cả render lẫn preview**
   (render: scale `eval=frame` + filter `rotate`; preview: canvas transform
   translate→rotate→scale quanh tâm element theo `videoElementPlacement`).
   Chỉ là mirror tương đối: vị trí hình bao và góc/hệ số khớp công thức render,
   nhưng nội suy hình ảnh khác nhau (FFmpeg scale bicubic/rotate bilinear so
   với drawImage của trình duyệt) nên không pixel-perfect. Clip có
   scale/rotation KÈM transition: render bỏ qua SR (validator cảnh báo) nhưng
   preview vẫn áp SR khi vẽ từng clip riêng lẻ → preview lệch render ở đoạn
   chuyển cảnh đó.
   **Text SR (P1 Phase 7 — đã parity, trừ các xấp xỉ sau).** Render K1 vẽ chữ
   ra PNG trong suốt (pad = max(4, fontSize/4)) rồi qua pipeline overlay giống
   video có SR với `rotateExpand` (mở output ra hình vuông đường chéo).
   Preview mirror bằng `textSrPlacement` + canvas transform quanh tâm hình
   bao. Xấp xỉ còn lại: (a) Canvas không làm tròn chẵn như FFmpeg (yuva420p)
   nên bbox lệch tối đa ~1px; (b) render bỏ qua `style.x/y` tĩnh khi không có
   x/y keyframes (căn giữa) — preview mirror đúng hành vi này, nhưng người
   dùng thấy chữ nhảy về giữa khi thêm SR; (c) clip SR bỏ qua hoàn toàn
   textfx animation ở cả hai; (d) typewriter + SR → SR bị bỏ qua ở cả hai
   (validator cảnh báo); (e) hit-test của text SR dùng hình bao trục song
   song nên vùng bấm hơi rộng tay khi chữ xoay xiên.
7. **Transition:** preview chỉ mô phỏng `fade` in/out. Các loại xfade khác
   (wipe/slide/…) chỉ thấy ở bản render.
8. **Typewriter:** preview hiện chữ bằng canvas theo đúng timing
   (ký tự i từ `start + i*duration/n`); render dùng ASS/libass — timing giống
   nhau, nhưng font rendering có thể khác chút ít.
9. **`ctx.filter`:** Safari cũ không hỗ trợ → LUT/effects lặng lẽ bị bỏ qua
   trong preview (có feature-detect). Bản render không ảnh hưởng.
10. **Tốc độ phát + phát ngược (P1 Phase 7):** preview dùng `playbackRate`
    (giữ cao độ như atempo). `reverse` nay **đúng cả khi phát**: vì
    HTMLVideoElement không phát ngược được, `syncMedia` giữ element reverse ở
    trạng thái pause và seek tới target mỗi frame (target giảm dần theo
    `sourceTimeAt`) — đúng chiều, đúng vị trí, nhưng KHÔNG mượt như phát
    xuôi (seek từng frame, phụ thuộc mật độ keyframe và tốc độ decode; có
    thể giật trên video keyframe thưa). Khi pause/scrub, seek đã đúng từ
    trước. **Audio của clip reverse bị mute khi đang phát** (Web Audio
    không đảo được; render dùng areverse) — phát xuôi lệch hình còn tệ hơn
    mute nên chọn mute. Transport phát ngược toàn cục (phím shuttle kiểu
    J phát ngược) vẫn chưa có — đó là việc khác, xem SEEK_LIMITS.md mục 6.
11. **Hiệu năng:** chroma key là tốn nhất (~5–10ms/frame ở 640px). Mục tiêu 30fps
    với 10 clip không chroma; clip có chroma có thể rớt frame trên máy yếu.

## Bug đã tìm và sửa trong đợt P1 (Phase 7, 2026-10-23)

- **Preview áp opacity tĩnh HAI LẦN (bình phương).** `drawVideoClip` đặt
  `alpha = clip.opacity ?? 1` rồi lại nhân `vis.opacity` (cũng là opacity
  tĩnh) → clip opacity 0.5 hiển thị như 0.25. Nay `vis.opacity` là opacity
  hiệu dụng duy nhất (keyframes thắng tĩnh) và `drawVideoClip` chỉ nhân thêm
  hệ số fade transition. Phát hiện khi làm P1 vì keyframes opacity sẽ bị
  nhân đôi cùng lỗi này.

## Bug đã tìm và sửa trong đợt này (ngoài preview)

- **`server/render/src/render.js`: video có keyframes x/y làm render CRASH**
  (ffmpeg exit 234). Nguyên nhân: biểu thức overlay chứa dấu phẩy
  (`if(lt(...),...)`) nhưng không được bọc nháy đơn → FFmpeg tách nhầm filter.
  Demo `demo_keyframes_video.js` đã quote đúng. Đã sửa 1 dòng:
  `overlay=${ox}:${oy}` → `overlay=x='${ox}':y='${oy}'`. Kiểm chứng: render lại
  spec keyframes thành công, không còn crash.
