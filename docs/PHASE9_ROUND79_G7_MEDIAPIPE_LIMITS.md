# LIMITS — Phase 9 đợt 79, luồng G7: MediaPipe thử sâu hơn + u2netp thêm 3 clip

Ngày: 10/11/2026 (lượt cron 09:35 +07; chạy 09:37–10:14). Đóng nợ đợt 78
§4.7/§4.10 + đợt 77 E4 ("u2netp/MediaPipe — thử sâu hơn"). KHÔNG push,
KHÔNG release/tag, KHÔNG binary/model. Mọi số dưới đây là số đo thật trên
VM này (4 vCPU EPYC 9D25, RAM 7 GB, trần cell 6,0 GiB).

## 0. Kết luận — tóm tắt

**KHÔNG tích hợp cái nào. Giữ u2net làm fallback duy nhất.**

**MediaPipe SelfieSegmenter — đo đủ bộ clip chuẩn, kết luận chắc chắn
hơn F9: chỉ 1/5 so sánh đạt.** Trên cùng bộ clip E4 (A chân dung,
B cột đèn đêm, C bàn làm việc; 480/640) + D chân dung sáng: A@480
IoU 0,819, A@640 0,8187, B 0,4452, C 0,0425 — chỉ D đạt (0,9777).
Số A/D khớp F9 đúng 4 chữ số thập phân (tái hiện xác định, không phải
nhiễu đo). Ranh giới person-only đã đo bằng số: ảnh B KHÔNG có người
mà MediaPipe vẫn hallucinate 2,2% fg; ảnh C nó chỉ lấy cánh tay
(fg 10,5% so với 25,7% của u2net, MAD 0,3548). Nhanh nhất từng đo
(13,26 fps lúc máy lặng, RSS 0,202 GiB) nhưng tốc độ không cứu được
IoU — **không tích hợp, kể cả làm "fast preview chân dung sáng"**
(vì ngay cả chân dung cũng chỉ 1/2 clip đạt, xem G bên dưới).

**u2netp — thêm 3 clip mới: 2/3 đạt (H 0,9414; I 0,9852), G rớt
(0,6681).** Tổng 9 clip từng đo: 4/9 đạt (B 0,86; D 0,99; H 0,94;
I 0,99). Đây là bằng chứng mới thật: u2netp đồng thuận gần như hoàn
toàn với u2net không chỉ trên chân dung sáng mà cả trên động vật (chó
golden) và hoa — nhưng **vẫn KHÔNG mở opt-in**, vì điều kiện thứ hai
đặt trước (đặc trưng phân biệt được ca đạt/rớt) KHÔNG đạt: 7 đặc trưng
đo được từ ảnh gốc đều không tách được 2 nhóm (§4). Cặp quyết định:
F (tháp đèn nền đen, IoU 0,58) và I (hoa hồng nền đen, IoU 0,99) gần
như giống hệt nhau trên mọi đặc trưng đo được mà kết quả trái ngược —
giống hệt bế tắc B-vs-F của F9, nay lặp lại ở F-vs-I. Thêm nữa, clip G
giết luật "chủ thể sáng thì đạt": chủ thể sáng nhất trong 9 clip
(luma_fg 203,9) vẫn rớt vì u2netp lấy thêm khúc gỗ trôi sáng bên cạnh
người mẫu.

## 1. Phạm vi + phương pháp

### 1.1 Câu hỏi của luồng (đặt trước khi đo)

1. **MediaPipe:** đo IoU/MAD trên cùng bộ clip chuẩn E4 (A/B/C, 480/640)
   so với u2net — đủ số clip (≥4) để kết luận, thay vì chỉ 2 clip
   chân dung như F9.
2. **u2netp:** thử thêm 2–3 clip mới xem có clip nào đạt IoU ≥ 0,85
   không — và quan trọng hơn, có đặc trưng nào phân biệt được ca
   đạt/rớt không (nợ F9 §4.7: B-vs-F không phân biệt được).

### 1.2 Tiêu chí (đặt TRƯỚC khi đo, giống E4/F9)

- Từng clip: mean IoU@128 ≥ 0,85, MAD ≤ 15/255 (0,0588), fg lệch
  ≤ 8 điểm phần trăm mới coi là tương đương với u2net.
- MediaPipe chỉ được xem xét tích hợp khi đạt ngưỡng trên TẤT CẢ clip
  chân dung (A, D) và không rớt thảm trên clip vật thể chung theo cách
  làm hỏng user (B, C là bằng chứng giới hạn person-only).
- u2netp chỉ được đề xuất mở lại đường dùng hẹp/opt-in khi có ≥ 2/3
  clip mới đạt **VÀ** có đặc trưng đo được phân biệt ca đạt/rớt.
  (Cả 2 điều kiện phải cùng đạt — 2/3 clip mới đạt là điều kiện cần,
  không phải đủ.)

### 1.3 Clip + license

MediaPipe tái dùng mask u2net E4/F9 trên đĩa (cùng code/model,
`bgremove.py` không đổi từ 06/11 — md5 kiểm chứng §8) nên không chạy
lại u2net cho 5 so sánh này.

u2netp — 3 clip mới (ảnh Wikimedia Commons, CHỈ dùng để đo trong
scratch `~/workspace/.tmp-r79g7/imgs/`, KHÔNG stage vào repo, không
phân phối cùng sản phẩm; video mẫu 1,5 s / 45 frame, 640×640,
`ffmpeg -loop 1`, mẫu F9):

| Clip | Ảnh gốc | License | Tính chất |
|---|---|---|---|
| G | "Portrait of a young woman standing outdoors (AM 74788-1).jpg" (946×1275) | CC BY 4.0 | Chân dung nữ đứng ngoài trời, ban ngày — **đính chính: ảnh ĐEN TRẮNG lịch sử** (sat_fg đo được = 0,0; xem §3.1), không phải ảnh màu như lúc chọn |
| H | "Golden retriever alert (30190754125).jpg" (960×650) | CC0 | Chó golden trên cỏ — động vật, chủ thể không phải người |
| I | "Red rose against a black background.jpg" (960×1445) | CC BY-SA 3.0 | Hoa hồng đỏ sáng trên nền đen tuyền |

### 1.4 Lưu ý về tải máy

Các run u2net/u2netp chạy song song với 8–10 luồng đợt 79 khác
(loadavg dao động 1–28 trong các run; có lúc lên 29,65) nên fps
tuyệt đối KHÔNG phải baseline sạch — chỉ tỉ số u2netp/u2net trong
cùng điều kiện mới có ý nghĩa (mẫu E4/F9). MediaPipe chạy lúc máy
tương đối lặng (09:37–09:40) nên fps 13,26 là cận trên so với 5,48
fps của F9 dưới tải — cùng model, khác tải máy, ghi rõ cả 2 số.

## 2. MediaPipe SelfieSegmenter — 1/5 đạt, ranh giới đã rõ

### 2.1 Tốc độ + RAM (đo lại, máy lặng hơn F9)

Lệnh: `venv-mp/bin/python -u test_round79_g7_mediapipe.py --workdir
~/workspace/.tmp-r79g7 --frames 90` (venv scratch `~/workspace/.tmp-r78f9/venv-mp`,
mediapipe 0.10.21, model `selfie_segmenter.tflite` 249.537 byte, md5
`3b2e3e1cfc7d31538caf00ff4e0fba8c` — khớp F9, không tải lại).

| Hạng mục | G7 (máy lặng) | F9 (máy tải nặng) |
|---|---|---|
| Wall 90 lần (person.jpg 640×640) | 6,79 s | 16,41 s |
| fps | **13,26 fps** | 5,48 fps |
| Latency mean / median / min / max | 0,0754 / 0,0858 / 0,0171 / 0,163 s | mean 0,182 s |
| Đỉnh RSS | **0,202 GiB** | 0,201 GiB |
| Khởi tạo segmenter | 0,78 s | 1,55 s |

- Nhanh nhất + nhẹ nhất từng đo cho bgremove (u2net 0,37 fps sạch /
  ~1,1 GiB; u2netp ~0,57 fps sạch / 0,73 GiB). Chênh lệch fps G7-vs-F9
  là do tải máy, không phải do model — model card báo 33,46 ms CPU
  trên Pixel 6, cùng bậc độ lớn.
- Runtime log vẫn `Created TensorFlow Lite XNNPACK delegate for CPU`
  (không có GPU trên VM), legacy `mediapipe.solutions` vẫn chết —
  dùng Tasks API `ImageSegmenter` như F9.

### 2.2 Chất lượng mask vs u2net — bảng đầy đủ 5 so sánh

So sánh confidence mask MediaPipe (upsample LANCZOS 256→480/640) với
mask u2net tham chiếu (frame đầu; clip tĩnh nên frame đầu đại diện).

| So sánh | IoU@128 | MAD | \|diff\|>32 | fg% MP → u2net | Verdict |
|---|---|---|---|---|---|
| A chân dung @480 | 0,8190 | 0,0537 | 11,85% | 15,9 → 19,0 | ❌ KHÔNG ĐẠT |
| A chân dung @640 | 0,8187 | 0,0539 | 11,83% | 15,9 → 19,0 | ❌ KHÔNG ĐẠT |
| B cột đèn đêm @480 | 0,4452 | 0,0278 | 5,08% | 2,2 → 3,8 | ❌ KHÔNG ĐẠT |
| C bàn làm việc @480 | 0,0425 | 0,3548 | 43,61% | 10,5 → 25,7 | ❌ KHÔNG ĐẠT |
| D chân dung trắng @480 | **0,9777** | 0,0118 | 2,51% | 41,8 → 42,6 | ✅ ĐẠT |

- **A khớp F9 đúng 4 chữ số (0,8190 / 0,9777)** — đo lại xác định,
  không phải nhiễu. A@640 ≈ A@480 (0,8187 vs 0,8190) → khác biệt là
  nội tại model, không phụ thuộc độ phân giải (cùng mẫu E4/F9).
- **B — hallucinate trên ảnh không có người.** MediaPipe person-only
  vẫn trả fg 2,2% trên ảnh cột đèn (không có người nào): nó gán một
  phần vùng sáng của cột đèn thành "người". IoU 0,4452 — không phải
  0 vì 2 mask nhỏ trùng nhau một phần, nhưng xa ngưỡng 0,85. Đây là
  bằng chứng đo được rằng person-only không chỉ "không tách được vật"
  mà còn có thể trả mask sai hẳn trên ảnh không người.
- **C — chỉ lấy cánh tay.** Bàn làm việc có tay người: MediaPipe lấy
  đúng vùng tay/cánh tay (fg 10,5%) trong khi u2net lấy cả cảnh bàn
  (fg 25,7%). MAD 0,3548 — lớn nhất từng đo trong các luồng bgremove;
  43,61% pixel lệch >32. Hai model không chỉ khác biên — chúng trả
  lời 2 câu hỏi khác nhau ("người ở đâu" vs "vật thể nổi bật ở đâu").
- **D — đạt, nhưng chỉ 1 clip.** Chân dung sáng áo trắng nền sáng:
  đồng thuận gần như hoàn toàn với u2net, giống u2netp trên D
  (0,9918). Ranh giới của MediaPipe cũng là "đồ tối màu / không phải
  người": đạt trên D, rớt trên A (váy tối), rớt thảm trên B/C.
- Kết luận MediaPipe: **KHÔNG tích hợp.** Tốc độ 13,26 fps + RAM
  0,20 GiB + license Apache-2.0 sạch không đổi được thực tế là mask
  chưa tương đương u2net trên 4/5 clip chuẩn, và "fast preview chân
  dung sáng" cũng không mở được — chỉ có đúng 1 clip D đạt, trong
  khi clip G (§3) cho thấy ngay cả chân dung ngoài trời cũng rớt
  với u2netp; MediaPipe chưa được đo trên G nhưng cùng ranh giới
  "chủ thể sáng" nên không có cơ sở tin nó đạt ở đó.

## 3. u2netp — 3 clip mới: H và I đạt, G rớt

### 3.1 Tốc độ + RAM (tỉ số mới có ý nghĩa)

6 run × 45 frame, mask thô, max-side 480. Nguồn: log
`test-g7-u2netp.log` + `results-g7-u2netp.json`.

| Run (45 frame) | u2net (wall / fps / RSS) | u2netp (wall / fps / RSS) | Tỉ số tốc độ |
|---|---|---|---|
| mask G @480 | 386,9 s / 0,12 fps / 1,11 GiB | 207,4 s / 0,22 fps / 0,73 GiB | 1,87× |
| mask H @480 | 498,0 s / 0,09 fps / 1,04 GiB | 219,0 s / 0,21 fps / 0,74 GiB | 2,27× |
| mask I @480 | 329,6 s / 0,14 fps / 1,03 GiB | 178,8 s / 0,25 fps / 0,74 GiB | 1,85× |

- Tỉ số ~1,9–2,3× khớp E4 (1,5–2,4×) và F9 (2,1–2,2×). Đỉnh RSS
  u2netp ổn định **0,73–0,74 GiB** mọi run (u2net 1,03–1,11 GiB) —
  nhẹ hơn thật ~0,3 GiB. Về tốc độ/RAM, u2netp vẫn thắng; quyết định
  vẫn do chất lượng mask (§3.2 + §4).

### 3.2 Chất lượng mask — bảng 3 clip mới

So sánh từng frame, mask thô @480 (45 frame mỗi cặp; video tĩnh nên
IoU min ≈ mean, temporal diff 0,00–0,01 — không flicker).

| Clip | IoU@128 mean (min) | MAD mean (max) | \|diff\|>32 | fg% u2net → u2netp | Verdict |
|---|---|---|---|---|---|
| G chân dung ngoài trời | 0,6681 (0,6681) | 0,0392 (0,0392) | 5,46% | 7,6 → 10,5 (+2,9) | ❌ KHÔNG ĐẠT |
| H chó golden trên cỏ | **0,9414** (0,9411) | 0,0098 (0,0098) | 2,44% | 15,4 → 15,2 (−0,2) | ✅ ĐẠT |
| I hoa hồng nền đen | **0,9852** (0,9849) | 0,0065 (0,0066) | 1,70% | 25,4 → 24,8 (−0,6) | ✅ ĐẠT |

- **G — u2netp phân đoạn THỪA một vật sáng khác.** Đối chiếu trực quan
  `compare-G-portrait-outdoors-480.png` (gốc | u2net | u2netp; đỏ =
  bất đồng >32): u2net chỉ lấy người phụ nữ; u2netp lấy thêm cả khúc
  gỗ trôi sáng màu nằm bên trái người mẫu + vùng chân/bóng (vùng đỏ
  phủ đúng khúc gỗ). Đây là lỗi lấy thừa vật thể nổi bật thứ hai —
  cùng họ lỗi với F (lấy thêm thân tháp tối). **Đính chính mô tả
  clip:** ảnh G là ảnh ĐEN TRẮNG lịch sử (bão hòa đo được = 0,0),
  không phải ảnh màu "chân dung sáng ngoài trời" như lúc chọn từ
  tiêu đề Commons. Test vẫn có giá trị (u2netp rớt trên ảnh này),
  nhưng không được dùng G làm bằng chứng cho "chân dung màu ngoài
  trời" — cần clip màu thật nếu muốn đo lại trường hợp đó.
- **H — đồng thuận gần như hoàn toàn.** Chó golden trên cỏ xanh:
  hai mask gần như giống hệt, chỉ lệch viền lông (vùng đỏ mỏng quanh
  biên). Đây là clip động vật đầu tiên u2netp đạt ngưỡng — mở rộng
  tập đạt ra ngoài chân dung/vật sáng ban đêm.
- **I — đồng thuận gần như hoàn toàn.** Hoa hồng đỏ trên nền đen:
  IoU 0,9852, MAD 0,0065 — ca tốt thứ hai từng đo sau D (0,9918).
  Đáng chú ý: cả 2 model đều LOẠI lá xanh, chỉ lấy hoa + cuống —
  đồng thuận cả về "vật thể được chọn là gì", không chỉ về biên.

### 3.3 Tổng hợp u2netp — 9 clip từng đo

| Clip | Loại | IoU | Verdict |
|---|---|---|---|
| A chân dung (váy tối) | người, đồ tối | 0,6263 | ❌ |
| B cột đèn đêm | vật sáng, nền đen | 0,8600 | ✅ |
| C bàn làm việc | cảnh phức tạp | 0,6898 | ❌ |
| D chân dung áo trắng | người, đồ sáng | 0,9918 | ✅ |
| E chùm sáng hải đăng | quầng sáng khuếch tán | 0,0237 | ❌ |
| F tháp đèn nền đen | vật sáng, nền đen | 0,5845 | ❌ |
| G chân dung ngoài trời (B&W) | người + gỗ trôi sáng | 0,6681 | ❌ |
| H chó golden trên cỏ | động vật, ban ngày | 0,9414 | ✅ |
| I hoa hồng nền đen | vật sáng, nền đen | 0,9852 | ✅ |

**4/9 đạt.** Nhóm đạt nay gồm 3 loại chủ thể khác nhau (người sáng,
động vật, hoa) — u2netp không phải "chỉ giỏi chân dung". Nhưng nhóm
rớt cũng gồm 3 kiểu lỗi khác nhau (mất vùng tối — A; chọn vật khác —
C/E; lấy thừa vật thứ hai — F/G). Không có luật đơn giản nào tách
được 2 nhóm — xem §4.

## 4. Có đặc trưng nào phân biệt được ca đạt/rớt? — KHÔNG

### 4.1 Phương pháp

Script `test_round79_g7_discriminator.py` (chỉ đọc file trên đĩa,
KHÔNG chạy model): với mỗi clip trong 9 clip, tính 7 đặc trưng từ
ẢNH GỐC (resize 480×480 giống video test) + mask u2net tham chiếu —
tức là những gì có thể đo được TRƯỚC khi chạy u2netp. Nếu một đặc
trưng tách sạch được nhóm ĐẠT/RỚT thì nó mới dùng được làm tiêu chí
mở opt-in (người dùng hoặc code tự đánh giá được trước khi chọn).
Đặc trưng thử: fg% u2net; độ sáng trung bình + tỉ lệ pixel tối (<55)
bên trong mask u2net; độ bão hòa trung bình bên trong mask; độ tương
phản chủ thể–nền (luma trong mask trừ luma ngoài mask); độ sáng trung
bình + tỉ lệ pixel tối toàn ảnh.

### 4.2 Bảng 9 clip × 7 đặc trưng

| Clip | IoU | fg% | luma_fg | dark_fg% | sat_fg | contrast | luma_all | dark_all% |
|---|---|---|---|---|---|---|---|---|
| B ✅ | 0,86 | 4,4 | 215,5 | 7,6 | 18,1 | +196,7 | 27,4 | 92,7 |
| D ✅ | 0,99 | 43,1 | 131,2 | 19,4 | 84,6 | −49,3 | 159,3 | 11,3 |
| H ✅ | 0,94 | 16,2 | 125,1 | 7,9 | 112,3 | +25,5 | 103,8 | 22,6 |
| I ✅ | 0,99 | 25,9 | 96,8 | 10,1 | 214,7 | +78,7 | 38,5 | 74,8 |
| A ❌ | 0,63 | 19,5 | 131,1 | 4,6 | 85,0 | −22,6 | 149,3 | 3,8 |
| C ❌ | 0,69 | 27,5 | 59,5 | 57,9 | 95,4 | −57,3 | 101,0 | 23,9 |
| E ❌ | 0,02 | 5,0 | 40,5 | 71,4 | 152,5 | −10,6 | 50,6 | 72,9 |
| F ❌ | 0,58 | 9,5 | 72,8 | 46,9 | 91,0 | +68,7 | 10,6 | 92,9 |
| G ❌ | 0,67 | 8,0 | 203,9 | 1,6 | 0,0 | +74,1 | 135,7 | 17,8 |

(luma_fg/dark_fg/sat_fg đo bên trong mask u2net; fg% ở đây đọc từ
frame đầu qua cv2 nên lệch nhỏ so với số toàn-video trong §3.2,
vd G 8,0% vs 7,6% — do nén x264 + frame đầu, không ảnh hưởng kết luận.)

### 4.3 Không đặc trưng nào tách được — 3 phản ví dụ quyết định

- **fg%:** ĐẠT trải 4,4–43,1%; RỚT trải 5,0–27,5% — chồng lấn hoàn toàn.
- **luma_fg ("chủ thể sáng thì đạt"):** G rớt mà luma_fg = 203,9 —
  CAO NHẤT trong 9 clip, cao hơn cả 3/4 clip đạt (D 131,2; H 125,1;
  I 96,8). Luật này chết.
- **dark_fg% ("chủ thể có vùng tối thì rớt"):** A rớt mà dark_fg chỉ
  4,6%, G rớt mà dark_fg chỉ 1,6% (thấp nhất) — trong khi D đạt mà
  dark_fg = 19,4% (cao nhất nhóm đạt). Luật này chết theo hướng ngược.
- **sat_fg:** ĐẠT trải 18,1–214,7; RỚT trải 0,0–152,5 — chồng lấn.
- **contrast:** D đạt mà contrast −49,3 (âm); F/G rớt mà contrast
  +68,7/+74,1 (dương cao). Không tách.
- **luma_all / dark_all:** chồng lấn cả 2 chiều.
- **Cặp F-vs-I là phản ví dụ sạch nhất:** cùng là "vật sáng trên nền
  đen" (dark_all 92,9% vs 74,8%; contrast +68,7 vs +78,7; fg 9,5%
  vs 25,9%), mọi đặc trưng đo được đều gần nhau, mà IoU 0,58 vs
  0,99. Sự khác biệt nằm ở ngữ nghĩa cảnh (tháp đèn có thân tối
  gắn liền; hoa hồng không có phần tối gắn liền) — không đo được
  bằng 7 đặc trưng này, và cũng không phải thứ user nhìn ảnh là
  phân biệt được chắc chắn.
- Trung bình nhóm có khác (dark_fg mean ĐẠT 11,2% vs RỚT 36,5%;
  luma_fg mean 142,1 vs 101,6) nhưng khoảng giá trị chồng lấn mạnh
  nên không đặt được ngưỡng nào mà không phân loại sai ≥ 2 clip.
  **Kết luận: không có discriminator đo được trong tay luồng này.**
  Muốn mở lại ý tưởng opt-in, đợt sau cần đặc trưng khác hẳn (vd đo
  từ chính mask u2netp sau khi chạy — nhưng thế thì đường "nhanh"
  mất ý nghĩa vì đã phải chạy cả 2 model — hoặc một classifier học
  từ nhiều clip hơn, cần tập clip lớn hơn 9).

## 5. So sánh 3 model (tổng hợp E4 + F9 + G7)

| Model | License | Kích thước | Input | fps (VM) | Đỉnh RSS | IoU vs u2net — clip đạt / tổng |
|---|---|---|---|---|---|---|
| u2net (fallback chính thức) | MIT | 176 MB | 320×320 | 0,37 (sạch) | ~1,1 GiB | 1,00 / 1,00 (tham chiếu) |
| u2netp | MIT | 4,57 MB | 320×320 | ~2× u2net | 0,73–0,74 GiB | **4/9** (B 0,86; D 0,99; H 0,94; I 0,99) |
| MediaPipe SelfieSegmenter | Apache-2.0 | 0,25 MB | 256×256 | 5,5 (tải) – 13,3 (lặng) | 0,15–0,20 GiB | **1/5** (D 0,98) |

## 6. Quyết định

**QUYẾT ĐỊNH (chốt, lần 2 cho u2netp; lần 1 đầy đủ cho MediaPipe):
KHÔNG tích hợp u2netp, KHÔNG tích hợp MediaPipe. `bgremove.py` giữ
nguyên (mặc định `birefnet-general` + fallback `u2net`).**

- u2netp: điều kiện 1 (≥2/3 clip mới đạt) ĐẠT (H, I), nhưng điều kiện
  2 (đặc trưng phân biệt ca đạt/rớt) KHÔNG ĐẠT (§4) — nên vẫn không
  mở opt-in. Mở opt-in mà user không tự đánh giá được khi nào nó đúng
  thì vẫn là bẫy như F9 đã kết luận; G7 chỉ đổi được mẫu số (4/9 thay
  vì 2/6), không đổi được bản chất bế tắc.
- MediaPipe: 1/5 so sánh đạt, ranh giới person-only đã đo bằng số
  (hallucinate trên B, chỉ lấy tay trên C) — không thay được u2net,
  không mở được "fast preview chân dung sáng" (chỉ 1 clip D đạt).
- Không đổi gì: `BgRemovePanel.tsx` giữ nguyên; `bgremove.py` giữ
  nguyên; `--session u2netp` vẫn chạy được ở CLI cho mục đích test,
  không quảng bá trong UI; model MediaPipe + venv-mp vẫn ở scratch,
  không đưa vào repo (dep mediapipe ~130 MB không được thêm).

## 7. Nợ mở cho đợt sau

1. **u2netp opt-in — vẫn ĐÓNG (lần 2).** Chỉ mở lại nếu có (a) một
   discriminator đo được tách sạch 9 clip hiện có + ≥3 clip mới độc
   lập, hoặc (b) ≥3 clip độc lập cùng 1 trường hợp hẹp cụ thể đã
   chứng minh (vd "hoa/vật đơn sắc trên nền đen" — hiện chỉ có I là
   1 clip; "động vật trên cỏ" — chỉ có H là 1 clip). Ghi chú: clip G
   cần đo lại bằng ảnh chân dung màu ngoài trời thật (ảnh G là B&W).
2. **MediaPipe fast-preview — vẫn ĐÓNG.** Chỉ mở lại nếu đạt ngưỡng
   trên ≥3 clip chân dung sáng độc lập (hiện chỉ D) VÀ có cách xử lý
   ảnh không người (B hallucinate 2,2% fg — cần ngưỡng tin cậy hoặc
   chặn hẳn khi không phát hiện người).
3. Birefnet vẫn ĐÓNG (chờ máy RAM ≥ 12 GB) — không đo lại trong sandbox.
4. `bgremove.py` production KHÔNG đổi trong luồng này (md5 kiểm chứng §8).

## 8. File đổi/thêm + kiểm chứng (batch phase9-round79-g7-mediapipe, KHÔNG push)

- `docs/PHASE9_ROUND79_G7_MEDIAPIPE_LIMITS.md` — doc này (mới).
- `server/bgremove/test_round79_g7_mediapipe.py` — test MediaPipe trên
  5 so sánh E4 + đo tốc độ (mới; mẫu theo test F9, tổng quát hóa
  multi-clip).
- `server/bgremove/test_round79_g7_u2netp.py` — test u2netp trên 3 clip
  mới G/H/I, 45 frame @480 (mới; mẫu theo test E4).
- `server/bgremove/test_round79_g7_discriminator.py` — phân tích 7 đặc
  trưng trên 9 clip + xuất ảnh đối chiếu G/H/I (mới; chỉ đọc đĩa,
  không chạy model).
- KHÔNG đổi: `bgremove.py` (md5 `b4b854641503d66cc95b0ee45cb53775` —
  khớp F9), `test_bgremove.py`, requirements, venv bgremove,
  `BgRemovePanel.tsx`, i18n, hay bất kỳ file production nào khác.
- Kiểm chứng cuối: `test_bgremove_fallback.py` **7 pass, 0 fail,
  exit 0**; `test_bgremove_smooth.py` **4/4 PASS, exit 0** (chạy
  10/11 ~10:15 +07). Không chạy lại full `test_bgremove.py`
  (90 frame u2net ~10–40 phút dưới tải đợt 79): `bgremove.py`
  không đổi 1 byte từ 06/11 (md5 khớp F9), suite full đã xanh ở
  D7/E4 với cùng file đó, và luồng này đã chạy đường production
  end-to-end 6 lần (G/H/I × u2net/u2netp, 45 frame mỗi lần, đều
  exit 0, mask có cả đen lẫn trắng, temporal diff 0,00–0,01) —
  đủ bằng chứng không hồi quy.
- Scratch không stage: `~/workspace/.tmp-r79g7/` (ảnh CC-BY/CC0 G/H/I,
  video/mask/results JSON, log, compare-G/H/I-480.png,
  mediapipe-mask-*-256.png), `~/workspace/.tmp-r78f9/` (venv-mp, model
  `selfie_segmenter.tflite`, mask E4/F9 tái dùng),
  `~/workspace/.tmp-r77e4/` (mask E4 tái dùng).
- Stage file: `paths-loop/phase9-round79-g7-mediapipe.txt`
  (NUL-delimited, verify read-back).
