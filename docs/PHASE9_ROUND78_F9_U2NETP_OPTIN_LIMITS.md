# LIMITS — Phase 9 đợt 78, luồng F9: u2netp opt-in hẹp + MediaPipe SelfieSegmenter

Ngày: 10/11/2026 (lượt cron 06:35 +07). Đóng nợ đợt 77 §4.10
("u2netp chỉ xem xét đường dùng hẹp, opt-in; MediaPipe vẫn chưa thử;
birefnet vẫn ĐÓNG"). KHÔNG push, KHÔNG release/tag, KHÔNG binary.
Mọi số dưới đây là số đo thật trên VM này (4 vCPU EPYC 9D25, RAM 7 GB,
trần cell 6,0 GiB — xem E8 đợt 77).

## 0. Kết luận — tóm tắt

**KHÔNG triển khai đường u2netp opt-in hẹp. Bằng chứng không đủ.**

Trong phạm vi hẹp giả định ("chủ thể sáng/tương phản cao"), u2netp chỉ
đạt **2/4 clip** (cần ≥ 3/4 theo tiêu chí đặt trước): chân dung sáng D
đạt gần như tuyệt đối (IoU 0,9918), cột đèn đêm B đạt (IoU 0,86, từ E4)
— nhưng tháp đèn F **không đạt** (IoU 0,5845) và chùm sáng hải đăng E
**rớt thảm** (IoU 0,0237). Điểm quyết định: B và F nhìn bằng mắt rất
giống nhau (vật sáng trên nền đen) nhưng cho kết quả trái ngược — tiêu
chí "chủ thể sáng" KHÔNG dự đoán được khi nào u2netp đồng thuận với
u2net, nên không thể viết cảnh báo UI để user tự chọn đúng. Mở opt-in
đồng nghĩa để user chọn mù và nhận mask sai ~50% số ca trong phạm vi
hẹp. **Giữ nguyên UI/bridge/bgremove.py; u2net vẫn là fallback duy nhất.**

**MediaPipe SelfieSegmenter: chạy được, license sạch (Apache-2.0),
nhanh nhất + nhẹ nhất từng đo (4,4–5,5 fps, 0,15–0,20 GiB) — nhưng
cùng một ranh giới:** IoU 0,9777 trên chân dung sáng D (đạt) và 0,819
trên chân dung váy tối A (không đạt). Chỉ tách người, không thay được
u2net; không tích hợp trong luồng này (cần dep mediapipe ~130 MB +
đường code TFLite mới, trong khi ngưỡng chất lượng chưa đạt trên clip
chuẩn). Birefnet vẫn ĐÓNG, không thử lại.

## 1. Phạm vi + phương pháp

### 1.1 Câu hỏi của luồng

E4 (đợt 77) đã chốt: u2netp KHÔNG thay được u2net làm fallback
(IoU chân dung 0,626 < 0,85, mất toàn bộ váy tối màu; chỉ clip B cột
đèn đêm đạt IoU 0,86). Luồng này trả lời 2 câu hỏi còn lại của §4.10:

1. **u2netp opt-in hẹp:** có đủ bằng chứng để mở một đường dùng hẹp,
   opt-in (mặc định TẮT, user chọn rõ ràng), giới hạn đúng trường hợp
   u2netp đã đo là tốt (chủ thể sáng/tương phản cao) hay không?
2. **MediaPipe SelfieSegmenter:** chạy được không, tốc độ + IoU ra sao
   trên cùng clip chân dung E4, so với u2net/u2netp?

Birefnet KHÔNG thử lại (vẫn ĐÓNG — chờ máy RAM ≥ 12 GB, xem D7/E4).

### 1.2 Clip đo u2netp opt-in (phạm vi hẹp: chủ thể sáng/tương phản cao)

| Clip | Ảnh gốc | License ảnh | Tính chất |
|---|---|---|---|
| B-p1 | `scratch-bgremove/p_1.jpg` (cột đèn đêm) | ảnh mẫu có sẵn trong repo | Sáng nhỏ trên nền đen — đã đo E4, IoU 0,86 |
| D-portrait-white | Wikimedia Commons, "Inna Story studio portrait in white shirt 2026.jpg" (960×856) | CC BY 4.0 | Chân dung áo trắng sáng; nền sáng (tường/trắng) nên tương phản chủ thể–nền chỉ vừa — ghi rõ, không tô hồng |
| E-lighthouse-beam | Wikimedia Commons, "Candle in the Dark (8088588860).jpg" (960×640) | CC BY 2.0 | Đèn hải đăng + vách đá sáng trên nền đêm tối |
| F-lighthouse-lamp | Wikimedia Commons, "Lighthouse (2).jpg" (637×850) | CC BY 2.0 | Tháp đèn sáng trên nền đen tuyền |

Ảnh Commons chỉ dùng để đo trong scratch (`~/workspace/.tmp-r78f9/imgs/`),
KHÔNG stage vào repo, không phân phối cùng sản phẩm. Video mẫu 1,5 s /
45 frame, 640×640, `ffmpeg -loop 1` (E4 dùng 3 s / 90 frame — F9 giảm
xuống 45 frame vì clip là ảnh tĩnh: E4 cho thấy IoU min ≈ mean và
temporal diff ~0,00, nên 45 frame cho cùng IoU/MAD; xem §2.1 về lý do
đổi giữa chừng).

### 1.3 Tiêu chí đường opt-in hẹp (đặt TRƯỚC khi đo, giống E4)

- Tốc độ u2netp ≥ u2net (cùng clip/độ phân giải).
- Đỉnh RSS u2netp ≤ u2net.
- Mean IoU@128 ≥ 0,85, MAD ≤ 15/255 (0,0588), fg% lệch ≤ 8 điểm phần
  trăm — trên TỪNG clip trong phạm vi hẹp (không lấy trung bình gộp).
- Cần **≥ 3/4 clip đạt** (B + D + E + F) mới triển khai opt-in; nếu
  không: kết luận KHÔNG triển khai, ghi rõ.
- Mask so sánh THÔ: `bgremove.py --mode mask --temporal 0 --feather 0`,
  max-side 480 (giống E4). Clip B tái dùng mask E4 trên đĩa
  (`~/workspace/.tmp-r77e4/mask-B-p1-*.mp4`) — cùng code/model,
  `bgremove.py` không đổi từ đợt 77 — để khỏi chạy lại 2 run ~12 phút.

### 1.4 Lưu ý về tải máy

Các run u2net/u2netp chạy song song với 8–10 luồng đợt 78 khác
(loadavg dao động, xem log từng run) nên fps tuyệt đối KHÔNG phải
baseline sạch — chỉ tỉ số u2netp/u2net trong cùng điều kiện mới có
ý nghĩa (mẫu E4). Baseline sạch u2net vẫn 0,37–0,43 fps (W1).

## 2. u2netp opt-in hẹp — số đo

### 2.1 Sự cố giữa chừng (ghi trung thực)

- **Runtime restart ~00:05–00:07 10/11** giết test lần 1 khi đang ở
  frame 70/90 của run đầu (D u2net). Không phải OOM (dmesg trống,
  oomKills 0) — cây process nohup bị giết cùng phiên runtime.
- **Đổi 90 → 45 frame lúc 00:20:** sau khi chạy lại, run D u2net vẫn
  ì ạch — VM lúc đó load >12 (3 process `yes` + ffmpeg benchmark +
  Chrome renderer của các luồng đợt 78 khác), process bgremove chỉ
  được ~11% CPU, 10 phút wall mới hết khởi tạo model. Clip là ảnh
  tĩnh nên 45 frame vẫn cho cùng IoU/MAD (E4: IoU min ≈ mean,
  temporal diff ~0,00) và đủ dài để đo fps; test lần 2 (45 frame)
  chạy lại từ đầu, load lúc đó đã hạ (~2,9).
- Mask clip B tái dùng từ E4 vẫn là 90 frame (cùng code/model) — so
  sánh B dùng 90 frame của chính nó, không trộn với 45 frame.

### 2.2 Số đo — tốc độ + RAM (tỉ số mới có ý nghĩa)

6 run × 45 frame (D/E/F), mask thô, max-side 480. Nguồn: log phần 1
(`test-f9-u2netp-optin.log`, D/E) + log phần 2
(`test-f9-u2netp-optin-part2.log`, F). **fps tuyệt đối KHÔNG dùng làm
baseline** (load VM dao động 0,35–15,5 trong các run; u2net 0,04–0,10
fps ở đây so với 0,37–0,43 fps sạch W1 — hoàn toàn do tải máy, mask
đầu ra vẫn đúng). Chỉ tỉ số u2netp/u2net trên cùng clip mới có ý nghĩa
(mẫu E4).

| Run (45 frame) | u2net (wall / fps / RSS) | u2netp (wall / fps / RSS) | Tỉ số tốc độ |
|---|---|---|---|
| mask D @480 | 1139,8 s / 0,04 fps / 1,20 GiB | 244,7 s / 0,18 fps / 0,73 GiB | 4,66× * |
| mask E @480 | 463,6 s / 0,10 fps / 1,21 GiB | 209,8 s / 0,21 fps / 0,73 GiB | 2,21× |
| mask F @480 | 507,0 s / 0,09 fps / 1,06 GiB | 240,8 s / 0,19 fps / 0,73 GiB | 2,11× |

\* Tỉ số D 4,66× bị thổi phồng: load vọt 14,23 đúng lúc chạy u2net D
(trong khi u2netp D chạy lúc load 7,6–12,1). Tỉ số đáng tin là E/F:
**~2,1–2,2×** (khớp E4: 1,5–2,4×). Đỉnh RSS u2netp ổn định **0,73 GiB**
mọi run (u2net 1,06–1,21 GiB) — nhẹ hơn thật ~0,4 GiB.

### 2.3 Số đo — chất lượng mask (quyết định)

So sánh từng frame, mask thô @480 (D/E/F 45 frame; B 90 frame từ E4).

| Clip | IoU@128 mean (min) | MAD mean (max) | \|diff\|>32 | fg% u2net → u2netp | Verdict |
|---|---|---|---|---|---|
| D chân dung áo trắng | **0,9918** (0,9918) | 0,0050 (0,005) | 0,99% | 42,6 → 42,4 (−0,2) | ✅ ĐẠT |
| B cột đèn đêm (E4) | **0,8600** (0,8599) | 0,0057 (0,0057) | 1,06% | 3,8 → 3,5 (−0,3) | ✅ ĐẠT |
| F tháp đèn nền đen | 0,5845 (0,5801) | 0,0569 (0,0581) | 13,68% | 6,2 → 12,4 (+6,2) | ❌ KHÔNG ĐẠT |
| E chùm sáng hải đăng | 0,0237 (0,0009) | 0,0842 (0,0926) | 21,44% | 1,4 → 0,4 (−1,0) | ❌ KHÔNG ĐẠT |

- **D — đồng thuận gần như tuyệt đối.** Chân dung lớn, áo trắng sáng,
  nền sáng đều: hai model cho mask gần như giống hệt (IoU 0,99, MAD
  0,005). Đây là ca tốt nhất của u2netp từng đo.
- **F — u2netp phân đoạn THỪA.** Tháp đèn nền đen: u2net chỉ lấy phòng
  đèn sáng (fg 6,2%), u2netp lấy thêm cả thân tháp tối (fg 12,4%,
  gấp đôi). IoU 0,58 < 0,85; MAD 0,0569 vừa qua ngưỡng nhưng |diff|>32
  tới 13,68%. Hai model chọn "vật thể" khác nhau trên cùng một cảnh
  tối — giống kiểu lệch của clip C (E4).
- **E — hai model chọn vật thể khác hẳn.** Chùm sáng + vách đá trong
  sương đêm: u2net đánh dấu vùng xám lớn ở vách đá/biển (fg >200 chỉ
  1,4% nhưng 23,6% pixel ở vùng xám 55–200), u2netp gần như chỉ lấy
  bóng đèn (fg 0,4%). IoU 0,024, MAD 0,084 — rớt cả 2 ngưỡng.
  Đối chiếu trực quan `~/workspace/.tmp-r78f9/compare-E-u2netp.png`:
  vùng đỏ bất đồng phủ đúng vách đá + cầu — cảnh này vốn mơ hồ, không
  có ground truth để nói bên nào "đúng"; nó nằm NGOÀI phạm vi hẹp
  (chủ thể là quầng sáng khuếch tán, không phải vật rắn sáng màu).
- Temporal coherence cả 2 model đều tốt (mean inter-frame diff
  0,00–0,60 < 5,0) — video tĩnh, không flicker; không phải yếu tố
  phân biệt.

### 2.4 Vì sao KHÔNG triển khai — B và F là bằng chứng quyết định

B (IoU 0,86) và F (IoU 0,58) đều là "vật sáng trên nền đen ban đêm",
nhìn bằng mắt rất giống nhau, nhưng u2netp đồng thuận ở B và lệch
lớn ở F (phân đoạn thừa thân tháp tối). Tiêu chí phạm vi hẹp mà luồng
này đặt ra ("chủ thể sáng/tương phản cao") **không phân biệt được B
với F** — user không thể tự判断 đúng bằng mắt thường, và không có
heuristic độ sáng/tương phản đơn giản nào trong tay luồng này tách
được 2 ca (cả 2 đều sáng nhỏ trên nền đen). Mở opt-in với cảnh báo
"chỉ dùng cho chủ thể sáng" sẽ để user chọn mù: trong 4 clip phạm vi
hẹp, 2 đạt / 2 rớt — tỉ lệ sai ~50%. Một đường opt-in mà người dùng
không tự đánh giá được khi nào nó đúng thì không phải là "hẹp an
toàn", mà là bẫy. **Kết luận: KHÔNG triển khai.** Nếu đợt sau muốn mở
lại ý tưởng này, cần (a) thêm nhiều clip trong phạm vi hẹp hơn nữa để
tìm đặc trưng phân biệt B/F (vd đo thêm histogram/độ bão hòa vùng tối),
hoặc (b) chấp nhận u2netp chỉ cho đúng 1 trường hợp đã chứng minh
chắc chắn (chân dung sáng lớn, IoU 0,99) — vẫn là 1 clip duy nhất,
chưa đủ để mở tính năng.

## 3. MediaPipe SelfieSegmenter — chạy được, nhanh, nhưng chưa đạt IoU

### 3.1 License — ĐÃ KIỂM CHỨNG TRƯỚC KHI CHẠY (sạch)

- **Model card chính thức** (Google, 06/05/2021, tác giả Tingbo Hou,
  Siargey Pisarchyk, Karthik Raveendran): mục "LICENSED UNDER" ghi rõ
  **Apache License, Version 2.0** — tương thích repo MIT (cùng họ
  license với u2net/rembg đang dùng; Apache-2.0 nằm trong danh sách
  cho phép). Model card:
  https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Selfie%20Segmentation.pdf
- **Model đã tải:** `selfie_segmenter.tflite` (bản square 256×256,
  float16), 249.537 byte, md5 `3b2e3e1cfc7d31538caf00ff4e0fba8c`,
  từ `storage.googleapis.com/mediapipe-models/image_segmenter/
  selfie_segmenter/float16/1/selfie_segmenter.tflite` — khớp kích thước
  249 KB trong model card. Model là file ngoài repo (scratch),
  không stage.
- **Runtime:** mediapipe 0.10.21 (Apache-2.0, PyPI) — KHÔNG dùng
  `tflite-runtime` độc lập: gói đó trên PyPI dừng ở 2.14.0, không có
  wheel cp312, mà VM chỉ có Python 3.12 (không có 3.11). mediapipe
  0.10.21 cài được trên cp312 nhưng **legacy `mediapipe.solutions`
  đã bị gỡ** — phải dùng Tasks API mới (`ImageSegmenter`, IMAGE mode,
  `output_category_mask=True`, `output_confidence_masks=True`).
  Import đúng: `from mediapipe.tasks.python import BaseOptions`,
  `from mediapipe.tasks.python.vision import ImageSegmenter,
  ImageSegmenterOptions`,
  `from mediapipe.tasks.python.vision.core.vision_task_running_mode
  import VisionTaskRunningMode` (RunningMode KHÔNG nằm ở
  `vision.core` như doc cũ gợi ý — đã mất thời gian sửa 2 lần import).
- **Phạm vi model:** CHỈ tách người (person-only, 2 class
  human/background, MobileNetV3-like, input 256×256×3 RGB) — không
  phải vật thể chung như u2net. Chỉ đo trên ảnh chân dung (A, D).
  Model card tự báo IoU trung bình 96,48% trên tập selfie của họ
  (ground truth người gán tay 98,74%) — KHÔNG so được trực tiếp với
  IoU-vs-u2net của luồng này (u2net là tham chiếu, không phải ground
  truth).

### 3.2 Tốc độ + RAM — nhanh hơn u2net ~15×, nhẹ nhất trong 3 model

Lệnh: `venv-mp/bin/python -u test_round78_f9_mediapipe.py
--workdir ~/workspace/.tmp-r78f9 --frames 90`
(venv scratch `~/workspace/.tmp-r78f9/venv-mp`, mediapipe 0.10.21 +
numpy + Pillow; KHÔNG chạm venv bgremove).

| Hạng mục | MediaPipe (person.jpg 640×640, 90 lần) |
|---|---|
| Wall 90 lần | 16,41 s |
| fps | **5,48 fps** (latency mean 0,182 s, median 0,187 s, min 0,098 s, max 0,367 s) |
| Đỉnh RSS | **0,201 GiB** |
| Khởi tạo segmenter | 1,55 s |
| So sánh | u2net 0,37 fps / RSS ~1,1 GiB; u2netp 0,57 fps / RSS ~0,7 GiB (E4) → MediaPipe nhanh hơn u2net ~15×, u2netp ~10×; RAM chỉ ~1/5 u2netp |

- Runtime log: `Created TensorFlow Lite XNNPACK delegate for CPU`
  (GPU không có trên VM — `GPU suport is not available`, đúng kỳ vọng).
- Confidence mask trả về đã ở đúng 640×640 (segmenter tự upsample từ
  256×256), float32 0–1, mean 0,203.
- Số fps này đo lúc máy đang chạy test u2netp song song (load cao) nên
  là cận dưới; model card báo 33,46 ms CPU trên Pixel 6 — cùng bậc độ
  lớn (0,18 s trên VM 4 vCPU tải nặng vs 0,033 s trên Pixel 6 lúc lặng).

### 3.3 Chất lượng mask vs u2net — KHÔNG đạt ngưỡng trên chân dung tối

So sánh mask MediaPipe (confidence, upsample LANCZOS 256→480) với mask
u2net clip A @480 đợt 77 E4 (frame đầu):

| So sánh | IoU@128 | MAD | \|diff\|>32 | fg% MP → u2net |
|---|---|---|---|---|
| MediaPipe vs u2net, clip A person.jpg @480 | **0,819** | 0,0537 | 11,85% | 15,9 → 19,0 (−3,1 điểm) |

- Ngưỡng đặt trước: IoU ≥ 0,85, MAD ≤ 0,0588, fg lệch ≤ 8 điểm.
  → **MAD đạt (0,0537), fg đạt (−3,1), IoU KHÔNG đạt (0,819 < 0,85).**
- Đối chiếu trực quan `~/workspace/.tmp-r78f9/compare-A-mediapipe.png`
  (gốc | u2net | MediaPipe | đỏ = bất đồng >32): MediaPipe cho vùng
  **váy tối màu xám lửng** (confidence trung gian, không trắng hẳn) thay
  vì trắng như u2net — cùng kiểu lỗi với u2netp trên clip A (mất/không
  chắc vùng tiền cảnh tối màu), cộng thêm viền mờ quanh tóc. Đây là
  lỗi thật, không phải nhiễu đo: váy tối trên nền tối làm cả 2 model
  nhẹ đều thiếu tự tin.
- **Chân dung sáng D (áo trắng): ĐẠT — IoU 0,9777, MAD 0,0118,
  |diff|>32 2,51%, fg 41,8% vs 42,6% (lệch −0,8 điểm).** So sánh bằng
  mask u2net D @480 từ test F9 (`--d-mask`). MediaPipe đồng thuận gần
  như hoàn toàn với u2net khi chủ thể là người mặc đồ sáng trên nền
  sáng — cùng hướng với u2netp trên D (IoU 0,9918). Ranh giới của
  MediaPipe cũng là "đồ tối màu": đạt trên D, rớt trên A.
- Tốc độ đo lại lần 2 (30 lần, cùng lúc test u2netp chạy): 4,42 fps,
  latency mean 0,227 s / median 0,209 s, RSS 0,15 GiB — cùng bậc với
  lần 1 (5,48 fps / 0,201 GiB); chênh lệch do tải máy, không phải do
  model.

### 3.4 Kết luận MediaPipe

- **Chạy được thật, license sạch (Apache-2.0), nhanh + nhẹ vượt trội**
  (5,48 fps, 0,20 GiB) — là ứng viên nhanh nhất từng đo cho bgremove.
- **Nhưng mask chưa tương đương u2net trên chân dung tối** (IoU 0,819
  < 0,85, mất tự tin đúng vùng váy tối) — KHÔNG thay được u2net, và
  cũng không thay được u2netp trong vai trò chung (chỉ tách người,
  không tách vật thể chung).
- **Không tích hợp vào production trong luồng này:** cần thêm dep
  mediapipe (~130 MB wheel) + đường code TFLite mới trong bgremove.py
  + script fetch model — chi phí tích hợp lớn trong khi chất lượng
  chưa đạt ngưỡng trên clip chuẩn A (0,819 < 0,85). Hướng sau: chỉ
  xem xét làm "fast preview chân dung sáng" NẾU có thêm bằng chứng
  (hiện chỉ 1 clip D đạt 0,9777 — chưa đủ để mở tính năng, và vẫn
  phải giải quyết cùng bài toán ranh giới như u2netp: đạt trên D,
  rớt trên A), và vẫn phải là opt-in riêng, không đụng đường mặc định.
- Ghi chú kỹ thuật cho đợt sau: legacy `mediapipe.solutions` đã chết
  từ 0.10.21 — mọi code mẫu cũ dùng `SelfieSegmentation()` đều không
  chạy; dùng Tasks API `ImageSegmenter` như test này. `tflite-runtime`
  PyPI không có wheel cp312 — đừng thử cài độc lập trên Python 3.12.

## 4. So sánh 3 model nhẹ (tổng hợp E4 + F9)

| Model | License | Kích thước | Input | fps (VM, tải nặng) | Đỉnh RSS | IoU vs u2net, clip A / D | Vai trò |
|---|---|---|---|---|---|---|---|
| u2net (fallback chính thức) | MIT | 176 MB | 320×320 | 0,37 (sạch) | ~1,1 GiB | 1,00 / 1,00 (tham chiếu) | Mặc định fallback — giữ nguyên |
| u2netp | MIT | 4,57 MB | 320×320 | 0,18–0,21 (tải nặng; sạch ~0,57 E4) | 0,73 GiB | 0,626 / **0,9918** | KHÔNG triển khai opt-in (2/4 clip) |
| MediaPipe SelfieSegmenter | Apache-2.0 | 0,25 MB | 256×256 | 4,4–5,5 | 0,15–0,20 GiB | 0,819 / **0,9777** | Chưa đạt chung — chỉ chân dung sáng; chưa tích hợp |

## 5. Quyết định + thiết kế đường opt-in

**QUYẾT ĐỊNH (chốt): KHÔNG triển khai đường u2netp opt-in hẹp.**

- Bằng chứng: 2/4 clip trong phạm vi hẹp đạt (D 0,9918; B 0,86),
  2/4 rớt (F 0,5845; E 0,0237) — dưới ngưỡng ≥3/4 đặt trước khi đo.
  Quan trọng hơn con số: B và F không phân biệt được bằng tiêu chí
  phạm vi hẹp ("chủ thể sáng/tương phản cao") mà vẫn cho kết quả trái
  ngược, nên không có cách nào viết cảnh báo UI để user tự chọn đúng.
- **Không đổi gì:** `BgRemovePanel.tsx` giữ nguyên 3 option
  (auto/birefnet-general/u2net); bridge giữ nguyên (mặc dù
  `validateSession` đã chấp nhận `u2netp` như mọi session
  `[a-z0-9_-]+` khác — đó là hành vi chung có sẵn, không phải đường
  opt-in); `bgremove.py` giữ nguyên (mặc định `birefnet-general` +
  fallback `u2net`). `--session u2netp` vẫn chạy được ở CLI cho mục
  đích test, nhưng không được quảng bá trong UI.
- **MediaPipe:** không tích hợp (xem §3.4). Nếu đợt sau muốn mở lại
  "fast preview chân dung sáng" bằng MediaPipe (IoU 0,9777 trên D,
  4,4–5,5 fps, 0,15–0,20 GiB — con số tốt nhất từng đo), vẫn phải
  giải quyết cùng bài toán ranh giới: đạt trên D, rớt trên A
  (0,819) — và vẫn cần dep mediapipe + đường code TFLite mới.

## 6. Nợ mở cho đợt sau

1. **u2netp opt-in — ĐÃ ĐÓNG (quyết định không triển khai).** Chỉ mở
   lại nếu có thêm bằng chứng phân biệt được ca đạt/rớt trong phạm vi
   hẹp (vd đo thêm nhiều clip + đặc trưng histogram vùng tối), hoặc
   thu hẹp xuống đúng 1 trường hợp đã chứng minh (chân dung sáng lớn)
   với thêm clip tương tự.
2. MediaPipe: "fast preview chân dung sáng" vẫn là hướng mở (IoU
   0,9777 trên D) nhưng chưa đủ bằng chứng phạm vi (mới 1 clip đạt);
   cần thêm chân dung sáng khác + quyết định tích hợp dep mediapipe.
3. Birefnet vẫn ĐÓNG (chờ máy RAM ≥ 12 GB) — không đo lại trong sandbox.
4. `bgremove.py` production KHÔNG đổi trong luồng này (mặc định vẫn
   `birefnet-general` + fallback `u2net`).

## 7. File đổi/thêm (batch phase9-round78-f9-u2netp-optin, KHÔNG push)

- `docs/PHASE9_ROUND78_F9_U2NETP_OPTIN_LIMITS.md` — doc này (mới).
- `server/bgremove/test_round78_f9_u2netp_optin.py` — test so sánh
  u2netp vs u2net trên clip D/E/F + tái dùng mask B của E4 (mới;
  phần 1 abort ở E do assert fg>0,5% quá chặt — đã sửa thành fg>0,1%
  + cảnh báo fg<1% trong cả phần 1 và phần 2).
- `server/bgremove/test_round78_f9_u2netp_optin_part2.py` — phần 2:
  so lại D/E từ đĩa + chạy F + tái dùng B + verdict gộp 2/4 (mới;
  mẫu theo part2 của E4).
- `server/bgremove/test_round78_f9_mediapipe.py` — test MediaPipe
  Tasks API trên person.jpg (+ D với --d-mask) (mới; chạy bằng
  venv scratch `~/workspace/.tmp-r78f9/venv-mp`, KHÔNG phải venv
  bgremove).
- KHÔNG đổi: `bgremove.py` (mtime 06/11, md5
  `b4b854641503d66cc95b0ee45cb53775`), `test_bgremove.py`,
  requirements, venv bgremove, `BgRemovePanel.tsx`, i18n, hay bất kỳ
  file production nào khác.
- Kiểm chứng cuối: `test_bgremove_fallback.py` **7 pass, 0 fail,
  exit 0**; `test_bgremove_smooth.py` **4/4 PASS, exit 0** (chạy
  10/11 ~02:00 UTC). Không chạy lại full `test_bgremove.py`
  (90 frame u2net ~10–40 phút dưới tải đợt 78): `bgremove.py`
  không đổi 1 byte từ 06/11, suite full đã xanh ở D7/E4 với cùng
  file đó, và luồng này đã chạy đường production end-to-end 6 lần
  (D/E/F × u2net/u2netp, 45 frame mỗi lần, đều exit 0, marker
  `session_used=` đúng) — đủ bằng chứng không hồi quy.
- Scratch không stage: `~/workspace/.tmp-r78f9/` (venv-mp, model
  `selfie_segmenter.tflite` 249.537 byte, ảnh CC-BY D/E/F, video/mask/
  results JSON, log), `~/workspace/.tmp-r77e4/` (mask E4 tái dùng).
- Stage file: `paths-loop/phase9-round78-f9-u2netp-optin.txt`
  (NUL-delimited, verify read-back).
