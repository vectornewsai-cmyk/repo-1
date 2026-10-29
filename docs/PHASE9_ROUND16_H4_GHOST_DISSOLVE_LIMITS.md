# Phase 9 đợt 16 — Luồng H4: ghost frames 2..8 + dissolve 16-bit + FPS canvas (LIMITS)

> Ngày: 2026-10-28. Luồng H4 trong đợt lớn round 16, đóng 3 nợ mở của
> đợt 15 (§3 và T5 §8): ghost chưa quét frames 2..8, dissolve 16-bit
> chưa đo, FPS canvas trình duyệt thật chưa đo.
> KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist, KHÔNG sửa
> code sản phẩm, KHÔNG sửa badge — chỉ đo + script đo + tài liệu này.
> Parent stage (luồng này KHÔNG ghi paths-loop, KHÔNG ghi build-loop-log).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

| Nợ đợt 15 | Kết quả đợt 16 | Trạng thái |
|---|---|---|
| Ghost frames 2..8 chưa quét | 60/60 cell MATCHED (2 độ phân giải × 2 mode × frames 2..8 × weights đều/ramp + neo V15) | ĐÓNG ở điều kiện đo (§2) |
| Dissolve 16-bit chưa đo | MATCHED cả rgb48le lẫn yuv444p16le với nguồn 16-bit thật; giá trị 16-bit được giữ nguyên qua xfade | ĐÓNG — xfade KHÔNG lượng tử hoá xuống 8-bit (§3) |
| FPS canvas trình duyệt thật chưa đo | Đo được trên Chromium headless (SwiftShader, không GPU thật): ghost 1080p f8 ≈ 7–9,5 fps, f3 ≈ 14–27 fps (dao động theo tải máy), nền không ghost ≈ 27–33 fps | ĐÓNG MỘT PHẦN — có số đo engine thật nhưng kèm phạm vi headless/SwiftShader (§4); FPS trên GPU thật + video decode thật vẫn chưa đo |

Thang matched giữ nguyên V6/V11/V12: **MATCHED ⇔ MAD ≤ 2 và
≥ 99% pixel có lệch kênh tối đa ≤ 8** (16-bit: MAD16 ≤ 514 và lệch
kênh ≤ 2056, tức cùng thang chia cho 257).

Máy đo đợt này: CPU Intel(R) Xeon(R) Platinum 8321HC, 2 vCPU;
RAM 7,8 GiB; FFmpeg 8.1.2; không GPU thật; Chromium headless
152.0.7977.82 (`/opt/meta-chromium/chrome`). Lưu ý: CPU khác máy
đo đợt 15 (AMD EPYC 9D64) — số tuyệt đối giữa hai đợt không so
trực tiếp được, chỉ so được tỉ lệ/xu hướng trong cùng đợt.

## 1. Phương pháp đo (tái tạo được)

- **Script ghost:** `server/render/src/test_v16_ghost_sweep.mjs`.
  Chạy từ gốc repo:
  `node --experimental-strip-types server/render/src/test_v16_ghost_sweep.mjs`
  Exit 0 khi mọi cell render xong.
- **Nguồn ghost:** testsrc2 động (natA của V15), fps 30. Frame nguồn
  39..47 trích một lần mỗi độ phân giải rồi dùng chung mọi N/weights/
  mode (tránh sai lệch do trích lặp).
- **Cell ghost:** độ phân giải {1280×720, 1920×1080} × mode
  {yuv = tmix trên yuv420p thật rồi về rgb24, rgb = tmix trên rgb24}
  × frames N = 2..8 × bộ weights {uniform (1/N — mặc định product
  khi weights vắng), ramp ((i+1)/Σ — khái quát dạng tăng dần của
  V15), v15 ([0,2, 0,3, 0,5] chỉ cho N=3)}.
- **Cửa sổ đo:** ends 46, 47; tmix outputs 45..48. Diagonal =
  (end == k): tmix output k phải bằng blend của đúng cửa sổ kết
  thúc ở k. Báo MAD diagonal tốt nhất + MAD off-diagonal tốt nhất;
  tier áp cho diagonal.
- **Preview blend:** chuỗi source-over theo `motionBlurBlendPlan`
  THẬT (`previewEngine.ts`), giống V15 — không copy công thức.
- **Neo đối chiếu V15:** cell N=3 weights v15 phải tái tạo gần đúng
  số V15, nếu không thì phương pháp đo đã đổi và sweep không đáng
  tin. Kết quả neo (§2.1): tái tạo đúng tới ±0,001 — phương pháp
  được kiểm chứng.

## 2. Ghost quét frames 2..8 — 60/60 MATCHED, không frame nào lệch

### 2.1 Neo V15 (kiểm chứng phương pháp)

| Cell | V15 | Đợt 16 (neo) | Chênh |
|---|---|---|---|
| 1080p, yuv, N=3, [0,2, 0,3, 0,5] | MAD 0,0535 / le8 99,850% | MAD 0,0532 / le8 99,856% | 0,0003 |
| 1080p, rgb, N=3, [0,2, 0,3, 0,5] | MAD 0,0057 / le8 100% | MAD 0,0056 / le8 100% | 0,0001 |
| 720p, yuv, N=3, [0,2, 0,3, 0,5] | MAD 0,0583 / le8 99,840% | MAD 0,0574 / le8 99,833% | 0,0009 |
| 720p, rgb, N=3, [0,2, 0,3, 0,5] | MAD 0,0064 / le8 100% | MAD 0,0060 / le8 100% | 0,0004 |

### 2.2 Bảng MAD diagonal (le8 mọi cell yuv ≥ 99,662%, rgb = 100%)

720p, yuv:

| weights | N=2 | N=3 | N=4 | N=5 | N=6 | N=7 | N=8 |
|---|---|---|---|---|---|---|---|
| uniform | 0,0440 | 0,0548 | 0,0687 | 0,0782 | 0,0877 | 0,0986 | 0,1130 |
| ramp | 0,0407 | 0,0568 | 0,0656 | 0,0774 | 0,0864 | 0,0969 | 0,1052 |

1080p, yuv:

| weights | N=2 | N=3 | N=4 | N=5 | N=6 | N=7 | N=8 |
|---|---|---|---|---|---|---|---|
| uniform | 0,0417 | 0,0506 | 0,0637 | 0,0728 | 0,0809 | 0,0901 | 0,1043 |
| ramp | 0,0390 | 0,0524 | 0,0604 | 0,0718 | 0,0795 | 0,0887 | 0,0964 |

rgb (cả 2 độ phân giải, cả 2 bộ weights): MAD tối đa 0,0084
(720p ramp N=3), còn lại ≤ 0,0074, đa số ≈ 0,0000 — tức mô hình
blend khớp tmix tới sàn làm tròn khi không có subsampling.

### 2.3 Đọc kết quả

1. **Không frame nào lệch khỏi mô hình.** Mọi cell diagonal đều
   MATCHED với biên an toàn lớn: MAD yuv tối đa 0,1130 (ngưỡng 2,
   tức còn cách ngưỡng ~18 lần); le8 yuv thấp nhất 99,662%
   (ngưỡng 99%). Cả weights đều lẫn weights tăng dần đều khớp.
2. **MAD yuv tăng đơn điệu theo N** (0,04 → 0,11 từ N=2 lên N=8,
   ở cả 2 độ phân giải, cả 2 bộ weights) trong khi MAD rgb đứng
   yên ≈ 0. Đây là cùng hiện tượng V15 đã thấy ở N=3 (yuv 0,054
   vs rgb 0,006): chênh lệch nằm ở bước qua yuv420p, không phải
   ở mô hình blend — cửa sổ càng dài thì sai số subsampling
   tích luỹ càng nhiều, nhưng vẫn nhỏ hơn ngưỡng hai bậc độ lớn.
   Không có điểm gãy nào ở N cụ thể (không có N nào đột ngột
   tệ hơn hẳn N trước nó).
3. **Alignment không thể nhầm.** MAD off-diagonal tốt nhất toàn
   sweep là 0,5378 (rgb) / 0,6073 (yuv) — gấp ≥ 5 lần MAD diagonal
   tệ nhất (0,1130). tmix output k đúng là blend của cửa sổ kết
   thúc ở k với mọi N từ 2 tới 8, không trễ frame, không lệch
   cửa sổ, không đảo weights.
4. **Giới hạn của kết luận này:** một nguồn động duy nhất
   (testsrc2, chuyển động vừa phải); chưa đo vật chuyển động
   nhanh (signal ghost lớn hơn); chưa đo clip dài (tích luỹ
   theo thời gian); chưa đo đường mask/SR (dùng cùng plan blend
   nhưng chưa có số riêng ở HD); chưa đo weights giảm dần
   (newest nhẹ nhất) hay weights tùy ý của user. Những mục này
   vẫn là nợ, nhưng "quét frames 2..8" như đợt 15 đặt ra thì đã
   đóng.

## 3. Dissolve 16-bit — MATCHED, xfade giữ nguyên giá trị 16-bit

### 3.1 Vì sao phải đo 2 chặng (bài học phương pháp — đọc kỹ)

Chặng 1 (`test_v16_dissolve16.mjs`, nguồn phẳng lavfi color, p=0,5,
1280×720) cho MAD16 = 1,69 (rgb48le) / 1,07 (yuv444p16le), le8eq
99,996% cả hai — nhưng **không được dùng div257 của chặng này
để kết luận gì**: nguồn color vốn là 8-bit nên khi nâng lên
rgb48le nó đã là bội của 257 (đỏ = 64764 = 252×257), đầu ra
div257 = 100% là hệ quả của nguồn, không phải bằng chứng xfade
lượng tử hoá. Tài liệu này ghi rõ điểm đó và script chặng 1 đã
được sửa chú thích để không ai trích nhầm.

Chặng 2 (`test_v16_dissolve16_true.mjs`) mới là phép đo quyết
định: nguồn gradient 16-bit thật sinh bằng Node (99,609% mẫu
không chia hết cho 257), ghi raw ra /tmp (không vào repo),
xfade dissolve thật giữa chúng, so frame 36 (p=0,5) với frame
gốc theo frand (code thật `dissolveFrand.ts`).

### 3.2 Bảng số chặng 2 (640×360, p=0,5, frame 36)

| Đường | MAD16 | MAD8eq | le8eq | Đầu ra không chia hết cho 257 | Tier |
|---|---|---|---|---|---|
| rgb48le (xfade nội bộ chuyển sang gbrp16le — xem debug chặng 1) | 0,80 | 0,0031 | 99,996% | 99,609% (= nguồn 99,609%) | MATCHED |
| yuv444p16le (đo trong miền YUV, không chuyển về RGB) | 0,53 | 0,0021 | 99,996% | 99,604% (≈ nguồn 99,609%) | MATCHED |

Bằng chứng format negotiation (chặng 1, log debug): xfade nhận
rgb48le và FFmpeg tự chèn auto_scale chọn `gbrp16le` — vẫn là
định dạng 16-bit, không hạ xuống 8-bit. Validation ánh xạ frame
chặng 1: frame 29 vs A và frame 42 vs B đều MAD16 = 0,00.

### 3.3 Kết luận dissolve 16-bit

- **Nợ "dissolve 16-bit chưa đo" ĐÓNG với kết quả dương tính:**
  frand đúng ở 16-bit, xfade không lượng tử hoá xuống 8-bit,
  giá trị 16-bit của nguồn được giữ nguyên qua transition
  (tỉ lệ mẫu không chia hết cho 257 ở đầu ra ≈ tỉ lệ ở nguồn).
- **Phạm vi:** đo ở 640×360, p=0,5, nguồn gradient tĩnh (không
  phải nội dung tự nhiên, không phải 1080p). Bản chất câu hỏi
  16-bit là "xfade có giữ 16-bit không" — câu trả lời không phụ
  thuộc độ phân giải hay nội dung, nên không cần đo lại ở 1080p
  trừ khi muốn số cho đủ bộ. **Không suy ra product xuất được
  16-bit:** pipeline product xuất yuv420p 8-bit, nên dissolve
  16-bit ở đây chỉ trả lời câu hỏi về mô hình xfade, không phải
  về đầu ra cuối cùng của product.

## 4. FPS canvas khi bật ghost — số đo engine thật, phạm vi headless

### 4.1 Phương pháp và cái bẫy đã phát hiện

- **Script:** `server/render/src/test_v16_canvas_fps.mjs` — tự bật
  Chromium headless (`/opt/meta-chromium/chrome --headless=new
  --disable-gpu --remote-debugging-port`), nối CDP bằng WebSocket
  của Node, chạy benchmark trong trang, rồi tắt Chrome. Không
  tải Playwright mới, không dùng trình duyệt của user.
- **Đường vẽ đo:** composite ghost đúng plan preview — vẽ các
  frame nguồn bằng drawImage với globalAlpha theo
  `motionBlurBlendPlan` (frame đầu alpha 1, frame i alpha =
  w_i / Σ_{j≤i} w_j) lên 1 lớp canvas gắn vào DOM, đúng như
  preview làm. Nguồn là pattern ImageData xác định (đo CHI PHÍ
  VẼ, không đo giải mã video).
- **Cái bẫy — thời gian gọi drawImage KHÔNG phải chi phí raster:**
  đo `performance.now()` quanh vòng draw cho kết quả ≈ 0 ms ở
  hầu hết các case (baseline, f3, f8 ở 720p, f3 ở 1080p) — vì
  Chromium hoãn raster hoá drawImage tới lúc present. Chỉ case
  f8 1080p cho số khác 0 (trung vị 23,2 ms lần 1, 64,8 ms lần 2
  — không ổn định). **Vì vậy mọi số "ms/draw" trong log đều
  KHÔNG được trích; số dùng được là throughput vòng rAF**
  (số frame rAF kích được trong 3 giây khi mỗi frame vẽ đủ
  composite rồi present), vì rAF chỉ kích frame tiếp theo sau
  khi frame trước đã qua present.
- **Đối chứng trần rAF:** vòng rAF trống (không vẽ gì) đạt
  52,8–57,3 fps trong headless này — tức trần rAF headless ≈ 60,
  không bị throttle lạ; phần tụt dưới trần đó là chi phí vẽ/
  present thật trong môi trường này.

### 4.2 Bảng throughput rAF (3 lần chạy, mỗi lần 3 giây/case)

1080p:

| Case | Lần 1 | Lần 2 | Lần 3 | Khoảng |
|---|---|---|---|---|
| rAF trống | — | 57,31 | 52,76 | 52,8–57,3 |
| 1 frame (không ghost) | — | 32,98 | 27,29 | 27,3–33,0 |
| ghost f3 uniform | 27,46 | 24,90 / 26,80 | 15,54 / 13,75 | 13,8–27,5 |
| ghost f8 uniform | 9,54 | 7,00 / 8,57 | 8,97 / 7,75 | 7,0–9,5 |

720p (chỉ lần 3): 1 frame 35,99 fps; ghost f3 26,23 fps;
ghost f8 9,97 fps.

### 4.3 Đọc kết quả — và những gì KHÔNG được kết luận

1. **Ghost f8 sụp xuống một chữ số ở cả 2 độ phân giải**
   (7–10 fps) trong môi trường này — ổn định qua cả 3 lần chạy.
   Ghost f3 ở 1080p dao động mạnh giữa các lần chạy (13,8–27,5
   fps), trong khi f8 ổn định: f3 nằm gần ngưỡng mà tải nền của
   VM 2 vCPU làm nhiễu được, còn f8 thì quá tải rõ rệt nên số
   nào cũng thấp. **Vì vậy tài liệu này báo KHOẢNG, không báo
   một con số fps duy nhất cho f3 — ai trích "ghost f3 = 27 fps"
   là đã chọn lần chạy đẹp nhất.**
2. **Đừng đổ hết cho ghost.** Ngay cả không ghost, present 1
   canvas 1080p trong headless SwiftShader này cũng chỉ đạt
   27–33 fps (so với trần rAF 53–57). Nút cổ chai lớn nhất ở đây
   là raster phần mềm SwiftShader cho khung hình full-HD, không
   phải riêng phép blend ghost: ghost f3 chỉ mất thêm ~20–25%
   so với nền 1 frame trong lần chạy ổn định, còn f8 mới là
   điểm sụp thật (gấp ~4 lần số frame vẽ mỗi lần present).
3. **Tuyệt đối không trích các số này thành "FPS trình duyệt".**
   Phạm vi đúng: Chromium headless 152, SwiftShader (không GPU
   thật), VM 2 vCPU, nguồn pattern tổng hợp (không decode
   video), không có lớp UI/timeline/preview nào khác, không có
   màn hình thật. Trên GPU thật, số sẽ khác hẳn (nhiều khả năng
   cao hơn nhiều); trong preview thật (cộng decode video + UI),
   số cũng sẽ khác theo hướng khác. Nợ còn lại sau đợt này:
   FPS trên phần cứng GPU thật + video thật + toàn bộ preview
   (không phải canvas cô lập) — vẫn cần click-test trên trình
   duyệt thật có màn hình, do parent/main-chat sắp xếp.
4. **Số Node 180 ms/frame của đợt 15 chính thức bị thay thế**
   khỏi vị trí "FPS canvas": nó là toán per-pixel JS, còn số
   đợt này là canvas thật (dù headless). Hai số không so được
   với nhau và không số nào là FPS trình duyệt của user.

## 5. Kiểm chứng liên quan (chạy trong đợt này)

- `ghostBlend.probe.test.ts`: 10/10 kiểm chứng xanh.
- `previewEngine.test.ts`: 14/14 pass.
- `transitionPreview.test.ts`: 26/26 pass.
- `tsc --noEmit` (apps/web): **4 lỗi, KHÔNG phải do luồng này**
  (luồng này không sửa file .ts nào): `store.ts` (2 lỗi:
  StateCreator/patchClip type, unused `patchCurveSlice`) và 2 file
  test speed (`nestedStore.test.ts`, `speedcurveH3.test.ts`,
  TS5097). Mốc thời gian cho thấy các file này bị sửa trong lúc
  đợt 16 đang chạy (store.ts sửa lúc 01:22 UTC, trong ca làm
  việc của đợt) — tức là phần việc của luồng khác đang chạy song
  song; theo luật luồng, H4 không sửa/revert phần của người khác.
  Parent cần đối chiếu tsc ở bước gộp sau khi các luồng khác xong.
- `vite build` không chạy trong đợt này (không đổi code TS, chỉ
  thêm script .mjs + tài liệu; build artifact `dist/` cũng không
  thuộc batch stage theo quy ước).

## 6. File đã đổi/thêm (text only — PARENT stage, luồng này không ghi paths-loop)

- `server/render/src/test_v16_ghost_sweep.mjs` (MỚI — quét ghost
  frames 2..8, 60 cell, kèm neo V15).
- `server/render/src/test_v16_dissolve16.mjs` (MỚI — dissolve 16-bit
  chặng 1, nguồn phẳng; chú thích div257 đã sửa cho đúng).
- `server/render/src/test_v16_dissolve16_true.mjs` (MỚI — dissolve
  16-bit chặng 2, nguồn gradient 16-bit thật).
- `server/render/src/test_v16_canvas_fps.mjs` (MỚI — đo canvas qua
  CDP Chromium headless: draw timing + throughput rAF).
- `docs/PHASE9_ROUND16_H4_GHOST_DISSOLVE_LIMITS.md` (MỚI — chính
  file này).

KHÔNG đưa vào stage (chỉ để trên đĩa / trong /tmp, ghi tên để
đối chiếu): log đo `/tmp/h4-ghost-sweep.log`,
`/tmp/h4-dissolve16.log`, `/tmp/h4-dissolve16-true.log`,
`/tmp/h4-canvas-fps*.log`, `/tmp/h4-tsc.log`; file raw gradient
16-bit trong /tmp đã xoá sau khi đo; profile Chrome tạm đã xoá.
Không tạo file binary nào trong repo. Không push, không tag/release.

## 7. Nợ còn lại (trung thực — cho đợt sau)

- Ghost: vật chuyển động nhanh, clip dài, weights giảm dần/tùy ý,
  đường mask/SR ở HD, nguồn footage máy quay thật (lavfi chỉ là
  cận lành/cận xấu như đợt 15 đã ghi).
- Dissolve 16-bit: đã đóng ở mức câu hỏi "xfade có giữ 16-bit
  không"; không cần đo lại trừ khi muốn đủ bộ 1080p/nội dung
  tự nhiên. Product vẫn xuất yuv420p 8-bit nên đây không phải
  tính năng xuất 16-bit.
- FPS: số headless/SwiftShader này không thay thế được FPS trên
  GPU thật + video thật + toàn bộ preview; cần click-test trên
  trình duyệt có màn hình. 720p rAF chỉ đo 1 lần (chưa lặp);
  phương sai f3 1080p giữa các lần chạy chưa chẩn đoán nguyên
  nhân (tải nền VM là giả thuyết, chưa chứng minh).
- tsc 4 lỗi ở §5 thuộc về luồng khác/đợt gộp — không phải việc
  H4 sửa trong ca này.
