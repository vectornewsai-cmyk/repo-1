# Phase 9 round 14 — preview–render parity vòng 5: LIMITS tổng hợp (trung thực)

> Đợt lớn cron 20:03 27/10/2026, 6 luồng song song, KHÔNG push, KHÔNG release/tag.
> Chủ đề: đóng toàn bộ nợ mở đợt 13 (hướng P custom, dissolve, ghost/split-v,
> hiệu chuẩn circle, trim/split/in-out nested + speedcurve) + effect parity residuals.
> File stage: `~/workspace/repo-1-push/paths-loop/phase9-round14-parity5.txt`
> (28 file text, NUL-delimited, không binary, không dist, không benchmarks/results).

## 1. Kết quả theo luồng (số đo thật, FFmpeg 8.1.2)

### R1 — hướng P của 23 type custom ở phía render: ĐÓNG
- `server/render/src/transitions.js`: `buildXfadeFilter` dịch mọi token P độc lập
  thành `(1-P)` trước khi đưa cho FFmpeg (đã loại giả thuyết A/B hoán đổi bằng
  expr thăm dò không phụ thuộc P). Catalog giữ nguyên literal viết theo
  p-preview tăng dần. Một điểm sửa bao phủ cả 81 type.
- Ngoại lệ duy nhất: `circle-soft` đổi hệ số A/B trong literal (đĩa B bán kính
  p·R, viền mềm 0.15R) — trước sửa tâm không bao giờ thành B.
- Đường cong B% theo frame: trước sửa 22 custom giảm 100→0%; sau sửa cả 23
  tăng đơn điệu 0→100%. V13 HD 1920×1080: 48/48 KHỚP. V13 nhỏ 192×108: 55 KHỚP,
  8 XẤP XỈ, 9 FAIL — 17 case không KHỚP đều đã xác định nguyên nhân, không phải
  lỗi hướng (xem §3).
- Ghi chú trong code: phép dịch gắn với FFmpeg 8.1.2; nếu FFmpeg đổi chiều P ở
  bản sau phải bỏ phép dịch và đo lại 23 type.

### R2 — dissolve: ĐÓNG (phát hiện lớn nhất đợt)
- Đọc được `vf_xfade.c` thật (qua GitHub raw): mọi phép toán trong `frand` đều
  là float32. Ép từng bước về float32 (`Math.fround`) thì khớp gần tuyệt đối:
  `frand(x,y) = fract(sinf(x·12.9898f + y·78.233f) · 43758.545f)`, x/y là chỉ số
  pixel NGUYÊN (tâm pixel +0,5 cho trường khác hẳn).
- MAD: 72×45 và 144×90 đều 0,0000; 320×180 ≤ 0,0089 (≤3 pixel lệch / 57600).
  V12 dissolve: KHỚP (PASS). Render 2 lần byte-identical — xác nhận lại tính
  xác định của dissolve. Badge dissolve lên matched.
- Chưa claim bit-perfect tuyệt đối: 1–3 pixel lệch ở 320×180, giả thuyết chưa
  chứng minh là FMA contraction/sinf reduction ở đối số lớn — vẫn sâu trong
  ngưỡng matched (MAD ≤ 2, ≥99% ≤ 8).
- Preview dissolve dùng mask ImageData (~158ms/lần duyệt tại 1920×1080 đo bằng
  Node, chỉ trong frame dissolve) — chưa tối ưu, không đánh đổi chính xác lấy
  tốc độ trước khi click-test xanh.

### R3 — ghost + split-v trên canvas thật: ĐÓNG, kèm 1 bug sản phẩm thật
- Blocker seek pause của đợt 13 là BUG SẢN PHẨM: vòng rAF của `PreviewCanvas`
  gọi `Seeker.request(t)` mỗi frame trong khi frame chưa vẽ được, debounce
  80ms bị reset liên tục → seek không bao giờ chạy khi rAF ~16ms.
- Fix 1 hunk trong `preview.tsx`: guard chỉ request khi `t !== lastDrawnT` và
  `t !== lastRequestedT`, + reset guard khi outcome hủy/thất bại. Không đổi
  `seek.ts`, không đổi debounce, giữ ngữ nghĩa latest-wins khi scrub.
- Đối chứng A/B trên cùng snapshot: gỡ fix → ghost FAIL lại (MAD 0,00, đói
  3 attempt × ~20s); có fix → 6 PASS, 0 FAIL: ghost signal 12,10 vs ngưỡng
  3,00; split-v 100% trong vùng / 2,2% ngoài; diamondclose 100% / 0%;
  squareopen đối chứng PASS.
- Nợ phụ chưa sửa: `seekAll` trả `ok: true` cả khi timeout nên có thể vẽ
  frame chưa giải mã xong (giải thích frame đen ở lượt đối chứng).

### R4 — hiệu chuẩn circleopen/close: ĐÓNG
- Đường cong thật là smoothstep `w = 1 − S(clamp(rho−mid+0.5, 0, 1))`,
  `S(t)=3t²−2t³` — fit tại p=0,5: rmse 0,00022 (chạm sàn lượng tử hoá), so với
  cosin 0,00716. Progress không sai (fit mid frame 45 = 0,5003), chỉ sai dạng hàm.
- Tâm/rMax của FFmpeg lấy theo cắt nguyên: `cx=floor(W/2)`, `cy=floor(H/2)`,
  `rMax=hypot(cx,cy)` — chỉ lộ ở kích thước lẻ.
- Sau sửa: V11 circle 1,56 → 0,33 (≤8 = 100%); HD 720p/1080p × p 0,25–0,75:
  MAD 0,038–0,333, ≤8 = 100% mọi ô; gương thời gian circleclose đúng tới sàn
  lượng tử hoá; 14 type V3 không hồi quy (0,00–0,52).
- MAD sàn 0,33 là sàn đo (FFmpeg truncate kênh khi blend), không phải sai mô
  hình — đừng "sửa" thêm để ép về 0. Quy tắc tâm cắt nguyên chỉ kiểm chứng
  cho vùng radial-gradient.

### R5 — trim/split/in-out cho nested + speedcurve: ĐÓNG (trong phạm vi 1 cấp)
- `sliceSpeedKeyframes`/`visibleSpeedKeyframes`: trim là cửa sổ, không phá hủy
  — thu hẹp rồi mở lại không mất keyframe; mọi keyframe kết quả nằm trong
  khoảng (validator render chặn t ngoài `[0, duration]`).
- `splitClipAt` tính điểm cắt nguồn bằng tích phân ramp thay cho tốc độ hằng;
  bezier chia bằng de Casteljau (sai số ~1,4e-5); ease-in phải / ease-out trái
  vẫn gần đúng trong chặn 0,13×|Δv| (chặn lý thuyết 0,125×|Δv|).
- `trimClip` mép trái/phải theo ramp (`rampTrimLeftIn`/`rampTrimRightOut`),
  chặn cuối file nguồn bằng `outputDurationForSource`. Ví dụ số thật: ramp
  linear 1→2 trên `[0,4]`, in=10, trim trái 1s → in=11,125 (tốc độ hằng cũ
  cho 11, sai).
- Test mới 22 pass; hồi quy speedcurveTrim 18, nestUtils 28, render P3 73 pass.
- Lưu ý kiểm chứng: `store.ts` không import được dưới Node trần nên phần nối
  store chỉ kiểm chứng bằng tsc + build, không có test chạy qua store thật
  (cùng mẫu đợt 13 C5).

### R6 — effect parity residuals + harness V14
- Sharpen: từ XẤP XỈ lên KHỚP — render `unsharp` chỉ làm sắc nét luma (chroma
  amount = 0), preview cũ làm sắc nét từng kênh RGB (lệch tới MAD 4,96). Mô
  hình mới: Y qua Gaussian [1,4,6,4,1]/16, delta Y cộng đều vào R,G,B.
  16/16 điểm đo KHỚP (MAD 0,40–0,61). Badge sharpen lên matched.
- Edgedetect: cải thiện mọi nguồn (step 6,77→3,86; tự nhiên 13,85→8,53;
  pattern 5,75→1,33) nhờ Sobel → NMS → hysteresis giữ magnitude/4, nhưng vẫn
  XẤP XỈ — Canny của FFmpeg trên step hoàn hảo chỉ cho 4 pixel (hành vi
  plateau/biên riêng), ép theo là overfit. Badge giữ approx.
- Noise: giữ nguyên — thống kê đã khớp (std render 15,70/15,40/15,64 vs
  preview 15,90/15,89/15,87, tỉ lệ 1,01–1,03); MAD từng frame ~18 là do hai
  nhiễu độc lập, không phải lỗi mô hình.
- Glitch: đổi sang rgb-shift + noise (bỏ slice cũ): pattern 30,11→18,58, tự
  nhiên 37,08→22,26; vẫn XẤP XỈ, badge giữ approx. Chỉ rgb-shift (không noise)
  cho MAD thấp hơn (14,93/18,94) nhưng đó là gian lận chỉ số — preview
  không-nhiễu trình bày sai bản chất hiệu ứng nên vẫn cộng noise.
- Harness V14 mới (`server/render/src/test_v14_parity.js`, ~52s): KHỚP 12,
  XẤP XỈ 2, LỆCH 0, PENDING 3, STAT-APPROX 1, STRUCT-OK 1, lỗi render 0.
  PENDING là do rasterizer V14 chưa hỗ trợ kind `radial-gradient` (circle)
  và region `dissolve-noise` (cần mask ImageData) — không phải circle/dissolve
  hỏng; nguồn đo cho 2 nhóm này vẫn là V11/V12/V13.

## 2. Kiểm chứng gộp của parent (chạy lại độc lập trên cây đã hợp nhất)
- `tsc --noEmit`: 0 lỗi. (Các lỗi TS5097/TS2352 ở `nestedSpeedcurve.test.ts`
  mà R3/R6 thấy giữa chừng chỉ là thoáng qua do luồng khác đang sửa dở —
  chạy lại cuối đợt sạch.)
- `vite build`: pass (5,81s).
- `transitionPreview.test.ts`: 23/23. `effectCanvas.test.ts`: 14/14.
  `effectCanvas.parity.test.ts`: 11/11. `nestedSpeedcurve.test.ts`: 22/22.
  `speedcurveTrim.test.ts`: 18/18. Badge test v5: 144 assertions PASS.
- Harness V14 chạy lại: đúng bảng R6 (KHỚP 12, XẤP XỈ 2, LỆCH 0, PENDING 3).
- Harness V12 chạy lại: 32 case, chỉ còn FAIL circleopen (rasterizer V12 cũ,
  xem §3); dissolve nay PASS. Harness V11 chạy lại: 24 case, chỉ còn FAIL
  dissolve (rasterizer V11 chưa hỗ trợ dissolve-noise, xem §3).
- Xung đột hợp nhất đã kiểm tra trên đĩa: cả sửa dissolve (R2) + circle (R4)
  đều có mặt trong `transitionPreview.ts`; cả mask dissolve (R2) + guard seek
  (R3) đều có mặt trong `preview.tsx`; `previewStatus.ts` có đủ dissolve +
  sharpen matched. Parent chỉ sửa 1 comment lỗi thời trong `previewStatus.ts`
  (bỏ "dissolve" khỏi ví dụ nhóm xấp xỉ).

## 3. Nợ còn lại (trung thực — cho đợt sau)
- `grid`: mô hình preview sai (chữ L thay vì ô vuông góc), LỆCH cả ở HD —
  cần lượt sửa preview.
- `bars-fade`: muốn MAD KHỚP phải dạy preview vẽ nền crossfade.
- `blinds-h`/`plus`/`checker`: lệch biên do quy ước lấy mẫu chỉ số nguyên vs
  tâm pixel, giảm dần theo kích thước (blinds-h HD đã KHỚP cả 3 p).
- `circle-soft` vs preview biên cứng: MAD 14–18 là khoảng cách tính năng–mô
  hình; soft-aware MAD 0,18–0,21, le8 100% ở cả 3 p.
- V12 rasterizer còn dùng mô hình circle cũ → circleopen FAIL ở V12 trong khi
  V11 PASS (0,33): cần cập nhật rasterizer V12 lên smoothstep + tâm cắt
  nguyên, hoặc đánh dấu case V12 này đã bị V11 thay thế.
- V11 rasterizer chưa hỗ trợ dissolve-noise → dissolve FAIL ở V11 trong khi
  V12 PASS (MAD 0,00): cần nối mask ImageData vào V11 hoặc đánh dấu đã bị
  V12 thay thế.
- V14 PENDING circle/dissolve vì rasterizer V14 chưa hỗ trợ 2 kind mới.
- Chưa đo: dissolve ở 1920×1080/yuv420p/16-bit/footage thật; circle ở 4K/
  footage thật; ghost ở HD/1080p/FPS khi blend; R5 nested sâu hơn 1 cấp
  (chưa có helper hợp cửa sổ đệ quy); split curve + transition chưa có test
  riêng; chưa có test render MP4 thật cho nửa clip sau split theo ramp;
  `patchClip` đổi duration trực tiếp chưa cắt/dịch curve (nợ từ đợt 13);
  `curveDropped` trả về nhưng panel chưa hiển thị cho user.
- Badge sharpen/dissolve/circle "matched" chỉ có giá trị trong phạm vi nguồn
  tổng hợp đã đo (tới 320×180 cho dissolve, tới 1080p cho circle, nguồn
  pattern/tự nhiên tổng hợp cho sharpen) — chưa có footage thật/clip dài.
- `dist/` tái tạo bởi vite build là build artifact, không đưa vào batch stage.
