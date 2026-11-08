# Đợt 65 S1 — Gộp Farneback vào harness motion-metric (đồng-chính với MAD) + điều tra vidstab: LIMITS trung thực

Ngày đo: 2026-11-08 (lượt cron ~15:35 +07).
Máy đo: VM này (CPU-only, FFmpeg 8.1.2, libx264, OpenCV 5.0.0 trong
`server/tracking/.venv`). 9 luồng đợt 65 khác chạy song song (tải cao).
Đóng nợ #1, `docs/PHASE9_ROUND64_LIMITS.md` §8 + §1/§4 về R5.
Harness mới: `server/render/src/test_round65_s1_motion_metric.js`
(**27/27 pass, exit 0 — lượt chạy 3 với code cuối cùng**, xem §8 về lượt 1/2).
Log đầy đủ tại `workspace/goals/capcut-clone-video-editor/hidden_files/`
(`round65-s1-run.log` = lượt 1, `round65-s1-run2.log` = lượt 2 chết giữa
chừng, `round65-s1-run3.log` = lượt 3 cuối cùng, `round65-s1-followup.log`).

## 1. Kết luận ngắn — đọc trước

- **Gộp xong: MAD + F2_V5 là đồng-chính (co-primary).** Module đo gộp
  (`motion_metric.py` nhúng trong harness) tính cả hai trên cùng frame, cùng
  render: MAD (ground truth pixel, full-frame như R2/R5/61) + F1/F2/F3_V5
  (Farneback thresholded-median winsize 25, crop giữa 160×90 như R5) +
  F2_V2 (thresh-median winsize 15) làm cross-check. Trên render R2, số tái
  lập R5 tới 4 chữ số: MAD đối chứng 11,8789, F2_V5 đối chứng 13,4624.
  Spread: F2_V5 thắng MAD ở cả 2 lượt (62,6% so với 69,2%; 8,4% so với
  17,0%); F2_V2 còn thắng hơn (58,0% / 5,1%). F2_V5 giảm 84,8–90,9% so với
  đối chứng, ngang J2c nhưng ổn định hơn nhiều.
- **J2c chỉ còn tham chiếu lịch sử** — vẫn tính (để nối chuỗi số với đợt
  62/63/64) nhưng KHÔNG dùng để kết luận (spread 128,6%/72,1%; trên
  ocean-stab-r2 nó đọc 5,55 trong khi đối chứng chỉ 0,53 — hoang dã đúng
  như R5 đã cảnh báo).
- **F5 đã bỏ** (module gộp không tính nữa). **V0 bị cấm ở mức code**
  (`estimate()` chỉ cho phép {"V5","V2"}; mode `v0check` chứng minh lệnh
  cấm: `V0_BANNED_OK`).
- **Metric frame tệ nhất hoạt động:** max/p99 của |Δm| từng cặp (V5) +
  số cặp nhảy hoang (|Δm|>8px) + max/p99 MAD từng frame. Nó bắt được
  glitch lượt 3 stab3 (maxDm 14,245px, wild8=5) mà F2 trung bình (1,2065)
  giấu nhẹm. Nhưng cảnh báo: NGAY CẢ video stabilize tốt nhất vẫn có
  frame nhảy hoang (run4-stab2: F2=1,1735 nhưng maxDm=10,98, wild8=1) —
  trung bình tốt không có nghĩa là không có glitch.
- **Điều tra vidstab — tìm ra 2 tầng không-xác-định, và 1 "không-xác-định"
  hoá ra không phải:**
  1. `vidstabdetect`: file `.trf` khác nhau byte-for-byte giữa các lần
     chạy (sha256 khác cả 3 lần, cả khi `-threads 1`), NHƯNG nội dung
     chuyển động giống hệt nhau — 149/149 dòng khác nhau đều có cùng
     multiset LM, chỉ khác THỨ TỰ liệt kê trong mỗi frame; median LM từng
     frame giống hệt (maxDiff 0px, 0/149 frame khác). Detect xác định về
     nội dung, không xác định về thứ tự byte.
  2. `vidstabtransform`: KHÔNG xác định ngay cả với cùng file `.trf`
     byte-identical — transform ×2 cho sha256 khác nhau VÀ metric khác
     nhau (MAD 7,85 so với 5,45, spread 36,1%; F2_V5 2,19 so với 1,49,
     spread 38,0%; wild8 10 so với 2). Đây mới là nguồn chính của spread
     đo được ở R2/R5 — không phải detect. Encode-only ×2 thì byte-identical
     (x264 xác định), nên không phải lỗi encode.
  3. Chênh lệch trfA-vs-trfB (MAD 7,85 so với 4,76; F2 2,19 so với 1,22)
     nằm trong sàn nhiễu của chính transform (36–38%) nên KHÔNG quy được
     cho thứ tự byte trong `.trf` — chưa chứng minh được thứ tự `.trf`
     ảnh hưởng gì.
- **Footage thật: stabilize KHÔNG chắc đã giúp.** Trên ocean-slow (camera
  gần như đứng yên, sóng chuyển động), F2_V5 tệ hơn đối chứng trong 5/5
  lần stabilize (0,94–1,98 so với 0,88); trên basgo-mid (pan mượt 2,5px/f)
  thì lúc tốt lúc tệ (0,28 / 0,77 / 1,92 so với 0,30) — hiệu ứng thật nhỏ
  hơn sàn nhiễu của transform. Giả thuyết "stabilize làm tệ footage thật"
  ở lượt chạy 1 đã bị render độc lập của R4 BÁC BỎ một phần (basgo R4 tốt
  hơn đối chứng) — xem §7. Đừng trích "stabilize hại footage thật" như
  kết luận chung; đúng hơn là "trên footage ít rung, lợi ích stabilize
  nhỏ hơn nhiễu run-to-run của vidstabtransform".
- **Lỗi phương pháp đã sửa (§8):** lượt chạy 1 tính MAD trên crop giữa
  thay vì full-frame (đối chứng 9,4673 thay vì 11,8789). Đã sửa harness,
  đo lại toàn bộ bằng module đã sửa, và chạy lại harness hoàn chỉnh
  (lượt 3, 27/27). Số MAD trong LIMITS này là bản đã sửa; log lượt 1 có
  cột MAD sai — đừng trích từ đó.

## 2. Module đo gộp — định nghĩa chốt

- **MAD** (đồng-chính): mean |diff| gray từng cặp frame kề, **full-frame
  320×180** (như R2/R5/61, để số so được xuyên đợt) + max/p99 từng frame.
- **F1/F2/F3_V5** (đồng-chính): trên chuỗi dịch chuyển toàn cục m_t ước
  lượng bằng Farneback thresholded-median winsize 25 (|flow|>1px), crop
  giữa 160×90 (như R5). F1 = std(mx)+std(my); F2 = mean|Δm|;
  F3 = RMS quỹ đạo tích lũy đã khử xu hướng (cửa sổ 15).
- **F2_V2** (cross-check): cùng công thức F2 với estimator thresh-median
  winsize 15.
- **Frame tệ nhất (mới):** maxDm / p99Dm = max / p99 của |Δm| từng cặp
  (V5); wild8 = số cặp có |Δm|>8px; maxAbsM = |m| lớn nhất một cặp;
  MAD max/p99.
- **J2c** (phase correlation, crop giữa): chỉ tham chiếu lịch sử.
- **F4** (mean |flow25 − m5|): chỉ là chẩn đoán ghosting, không phải
  metric jitter (R5 §1).
- **F5: không tính. V0: cấm ở mức code** (allowlist {"V5","V2"} trong
  `estimate()`; `v0check` assert lệnh cấm).
- Chi phí: như R5 §8 (Farneback center ~19–52ms/cặp dưới tải, 2 scale
  ~6–15s/video 150 frame) — không đo lại vì module không đổi phần này.

## 3. S0 — Đo lại render R2 bằng module gộp (2 lượt × đối chứng 2 + stab ×3)

Dùng lại frame đợt 63 (không tái tạo). Đối chứng lặp lại giống hệt cả 3
metric (chênh 0,00%). Số MAD/F2/F1/F3/J2c khớp R5 tới 4 chữ số.

### 3.1 Lượt 3 (phiên .trf xấu: stab3 tốt thật, stab1/stab2 tệ)

| Metric | Đối chứng | stab1 / stab2 / stab3 | Giảm | Spread |
|---|---|---|---|---|
| MAD mean [ĐỒNG-CHÍNH] | 11,8789 | 4,3694 / 4,2967 / 1,9272 | 70,3% | **69,2%** |
| F2_V5 [ĐỒNG-CHÍNH] | 13,4624 | 2,4884 / 2,4455 / 1,2065 | 84,8% | **62,6%** |
| F1_V5 | 9,4973 | 2,9462 / 3,2531 / 2,1251 | 70,8% | 40,7% |
| F3_V5 | 4,2553 | 2,0532 / 2,2928 / 1,9260 | 50,9% | 17,5% |
| F2_V2 [x-check] | 13,2891 | 2,3309 / 2,4014 / 1,2457 | 85,0% | 58,0% |
| J2c [lịch sử] | 14,1619 | 2,7647 / 0,7968 / 1,0295 | 89,2% | 128,6% |

### 3.2 Lượt 4 (phiên .trf tốt: 3 lần stabilize đều tốt)

| Metric | Đối chứng | stab1 / stab2 / stab3 | Giảm | Spread |
|---|---|---|---|---|
| MAD mean [ĐỒNG-CHÍNH] | 11,8789 | 1,8953 / 2,2412 / 1,9611 | 82,9% | **17,0%** |
| F2_V5 [ĐỒNG-CHÍNH] | 13,4624 | 1,2409 / 1,1735 / 1,2766 | 90,9% | **8,4%** |
| F1_V5 | 9,4973 | 2,1008 / 1,6820 / 1,9960 | 79,7% | 21,7% |
| F3_V5 | 4,2553 | 1,6195 / 1,3869 / 1,3876 | 65,6% | 15,9% |
| F2_V2 [x-check] | 13,2891 | 1,2379 / 1,2901 / 1,3035 | 90,4% | 5,1% |
| J2c [lịch sử] | 14,1619 | 0,4815 / 0,4332 / 0,2109 | 97,4% | 72,1% |

### 3.3 Metric frame tệ nhất (V5 |Δm| từng cặp + MAD từng frame)

| Video | maxDm | p99Dm | wild8 | MAD max | MAD p99 |
|---|---|---|---|---|---|
| ctrl (cả 2 lượt) | 24,82 | 24,71 | 112 | 21,01 | 20,96 |
| lượt 3 stab1 | 15,76 | 15,05 | 9 | 44,89 | 42,48 |
| lượt 3 stab2 | 22,61 | 17,46 | 13 | 34,92 | 26,76 |
| lượt 3 stab3 (có glitch frame 20) | **14,25** | 13,14 | **5** | 18,77 | 17,56 |
| lượt 4 stab1 | 13,02 | 11,35 | 7 | 23,88 | 17,92 |
| lượt 4 stab2 (tốt nhất theo F2) | 10,98 | 7,36 | 1 | 24,38 | 16,70 |
| lượt 4 stab3 | 13,36 | 8,60 | 5 | 18,11 | 14,68 |

- Glitch lượt 3 stab3 bị bắt: maxDm 14,25 > 8px, wild8=5 — trong khi
  F2 trung bình của nó (1,2065) là TỐT NHẤT lượt 3. Trung bình giấu glitch.
- Ngay cả video tốt nhất (lượt 4 stab2, F2=1,1735) vẫn có 1 cặp nhảy
  10,98px. Không có video stabilize nào sạch wild jump hoàn toàn.
- MAD max từng frame còn cực đoan hơn (44,89 ở lượt 3 stab1 trong khi
  MAD mean chỉ 4,37) — một cặp frame tệ có thể gấp 10× trung bình.
- Lưu ý: wild8 của đối chứng (112/149 cặp) không phải "glitch" — đó là
  rung nguồn nhanh (xem §5.4). Ngưỡng 8px chỉ có nghĩa trên video ĐÃ
  stabilize (kỳ vọng |Δm| nhỏ).

## 4. S1 — Validate estimator + lệnh cấm V0

Trên shaky320 (rung đã biết, seed 7), khớp R5 tới 4 chữ số:

| Estimator | corrX / corrY | RMSE (px) | slope X / Y | Bar | Kết quả |
|---|---|---|---|---|---|
| V5 (chính) | 0,9701 / 0,9998 | 1,4101 | 0,906 / 0,988 | corr>0,8; RMSE<1,5 | QUA |
| V2 (x-check) | 0,9651 / 1,0000 | 1,5587 | 0,872 / 0,992 | corr>0,8; RMSE<1,7 | QUA |

- `v0check`: gọi estimator V0 → module từ chối với `V0_BANNED_OK`
  (assert xanh). Lệnh cấm nằm trong code, không chỉ trong docs.
- Assert "module không còn tính F5" xanh: file `motion_metric.py` được ghi
  ra scratch chứa 0 lần chuỗi "F5" (kiểm tra trực tiếp bằng grep sau lượt
  3); các dòng nhắc F5 chỉ nằm trong comment của file JS harness, không
  nằm trong module đo.

## 5. S2 — Điều tra vidstab không xác định

Input: shakynoisy720.mp4 (gen P2 seed 7 → upscale 720p → noise alls=15),
filter detect y hệt `enhance.js runStabilizeDetect` (shakiness=5,
accuracy=15, stepsize=6, mincontrast=0.3, trim 0–5s).

### 5.1 vidstabdetect: byte khác, nội dung giống hệt

- Detect ×3 (mặc định threads): sha256 cả 3 khác nhau (lượt 1:
  d90aa7b4… / 9496ba9d… / 4190dd44…; lượt 3: e17ab26c… / aa407fc8… /
  6ebdf595…). `-threads 1` cũng khác bản mặc định.
- So median LM từng frame (median dx/dy của ~83 LM/frame): a↔b và a↔c
  đều **maxDiff = 0px, 0/149 frame khác**; mặc-định↔threads1 cũng
  maxDiff 0px. Detect xác định hoàn toàn về nội dung chuyển động.
- Phân tích diff byte (script riêng, không trong harness): 149/155 dòng
  khác nhau, và **cả 149 dòng đều có cùng multiset LM — chỉ khác thứ tự
  liệt kê** trong mỗi frame. Không có giá trị LM nào khác nhau, không có
  frame nào thêm/bớt LM. Nguồn không-xác-định của detect là thứ tự lặp
  của cấu trúc lưu LM (kiểu hash-order), không phải phép đo.
- Kết luận detect: **không phải nguồn của spread chất lượng stabilize**.
  Đừng đổ lỗi cho detect nữa; cũng đừng dùng sha256 `.trf` để kiểm tra
  "detect có giống nhau không" — phải so nội dung LM.

### 5.2 vidstabtransform: KHÔNG xác định ngay cả cùng .trf

- Transform ×2 với cùng file `.trf` a (byte-identical): sha256 output
  khác nhau cả 2 lượt (lượt 1: 2197190f… so với bd460af1…; lượt 3:
  0ee6274c… so với d07e0fad…).
- Đo metric 2 output đó (follow-up F3, transform trần không denoise,
  không qua render.js):
  MAD 7,8486 so với 5,4468 (spread **36,1%**); F2_V5 2,187 so với 1,4889
  (spread **38,0%**); F1_V5 2,82 so với 1,89; wild8 10 so với 2;
  maxDm 16,87 so với 15,41.
- Đây là spread CHỈ từ transform (cùng input, cùng .trf, cùng encode
  settings) — cùng cỡ với spread toàn pipeline R2 đo được (MAD 69,2%/
  17,0%). **Transform là nguồn chính của không-xác-định.** Cơ chế bên
  trong chưa xác định được (nghi ngờ: thứ tự tích lũy float / threading
  trong vidstabtransform — chưa chứng minh; không đoán thêm).
- Transform với trfB (khác byte, cùng nội dung LM): MAD 4,7609,
  F2_V5 1,2215, wild8 1 — khác trfA-run1 (7,85 / 2,19 / 10) nhưng chênh
  lệch này NẰM TRONG sàn nhiễu của chính transform (36–38%), nên
  **không quy được cho thứ tự byte trong `.trf`**. Câu hỏi "thứ tự .trf
  có ảnh hưởng transform không" vẫn mở — cần transform xác định trước đã.

### 5.3 Encode-only xác định

- Encode trim 5s (veryfast, crf 23) ×2: sha256 giống hệt cả 2 lượt
  (586cd77c…). x264 với cùng settings/thread-count là xác định. Loại
  trừ encode khỏi nguồn spread.

### 5.4 Đính chính: "nhảy hoang" trong chuỗi median LM của .trf KHÔNG phải glitch

- Quét chuỗi median LM trong `.trf`: maxJump 108px (frame 13),
  p99Jump 108px, 148/149 cặp > 8px. Con số này TRÔNG như glitch khắp nơi
  nhưng là **chuyển động thật**: rung nguồn ±7px ở 320×180, sau upscale
  ×4 lên 720p thành ±28px, đổi dấu nhanh (sin 10Hz + 7Hz ở 30fps) nên
  median LM từng frame nhảy ~50–100px giữa 2 frame kề là đúng vật lý.
  Ngưỡng 8px/15px vô nghĩa trên chuỗi detect thô. Kiểm tra nhảy hoang
  ĐÚNG là maxDm/wild8 trên video ĐÃ stabilize (§3.3), không phải trên
  `.trf`. Harness vẫn in số quét `.trf` — đọc kèm chú thích này, đừng
  trích "148 cú nhảy hoang trong .trf" như phát hiện.

## 6. S3 — Render stabilize tươi qua render.js (denoise 0.5, smoothing 10)

| Lượt chạy | MAD mean | F2_V5 | F1_V5 | maxDm | wild8 |
|---|---|---|---|---|---|
| Lượt 1 | 3,2004 | 1,2471 | 1,4324 | 11,39 | 1 |
| Lượt 3 | 1,6078 | 0,9571 | 1,8070 | 23,13 | 3 |

- Cả 2 lần đều giảm sâu so với đối chứng (MAD 11,88 → 1,6–3,2;
  F2 13,46 → 0,96–1,25). Nhưng giá trị tuyệt đối dao động lớn giữa 2
  lần chạy (MAD gấp ~2×, maxDm gấp ~2×) — cùng một transform noise như
  §5.2. Một lần chạy stabilize không cho số tuyệt đối đáng tin; chỉ
  tỉ lệ giảm so với đối chứng cùng phiên mới trích được.

## 7. S4 — Footage thật (R4: ocean-slow 25fps + basgo-mid 30fps)

Đoạn 5s 720p từ scratch R4 (ocean CC0, basgo CC BY 3.0). Đối chứng =
trim + encode y hệt preset render. Stabilize = render.js smoothing 10
+ denoise 0.5, `--no-trf-cache`. Số MAD dưới đây là bản full-frame đã
sửa (follow-up F4 / lượt 3).

### 7.1 ocean-slow — camera gần như đứng yên (0,54 px/f), sóng chuyển động

Đối chứng: MAD 2,204 | F2_V5 0,8833 | maxDm 2,95 | wild8 0.

| Lần stabilize | MAD | F2_V5 | maxDm | wild8 |
|---|---|---|---|---|
| S4 lượt 1, r1 | 2,3677 | 1,5876 | 10,58 | 1 |
| S4 lượt 1, r2 | 2,8614 | 1,6718 | 9,17 | 1 |
| R4 d0.5 (render độc lập) | 1,9905 | 0,9434 | 3,19 | 0 |
| S4 lượt 3, r1 | 3,1437 | 1,7637 | 6,92 | 0 |
| S4 lượt 3, r2 | 2,6277 | 1,9762 | 11,26 | 1 |

- F2_V5 tệ hơn đối chứng trong **5/5** lần (+7% đến +124%); MAD tệ
  hơn trong 4/5 lần. Trên footage gần như không rung, stabilize thêm
  jitter (wobble của chính transform) thay vì bớt jitter.
- J2c (lịch sử) trên ocean-stab-r2 lượt 1 đọc 5,5466 trong khi đối chứng
  0,5253 — thêm một ví dụ J2c hoang dã vô căn cứ.

### 7.2 basgo-mid — pan mượt 2,5 px/f

Đối chứng: MAD 5,1261 | F2_V5 0,3011 | maxDm 1,69 | wild8 0.

| Lần stabilize | MAD | F2_V5 | maxDm | wild8 |
|---|---|---|---|---|
| S4 lượt 1 | 4,9214 | 1,9165 | 17,55 | 15 |
| R4 d0.5 (render độc lập) | 4,3739 | 0,2755 | 1,68 | 0 |
| S4 lượt 3 | 4,1791 | 0,7665 | 17,57 | 5 |

- Kết quả phân tán mạnh: 1 lần tốt hơn đối chứng (F2 0,28, wild8 0),
  2 lần tệ hơn nhiều (F2 0,77 / 1,92; maxDm ~17,6 cả 2 lần tệ — cùng
  một cỡ nhảy, nghi cùng một cơ chế glitch ở transform).
- MAD thì cả 3 lần đều tốt hơn đối chứng một chút (4,18–4,92 so với
  5,13) — MAD và F2 kể 2 câu chuyện khác nhau trên pan mượt (MAD đo
  thay đổi pixel, F2 đo biến thiên chuyển động). Đây chính là trường
  hợp cần cả 2 metric đồng-chính.
- **Giả thuyết lượt 1 ("stabilize làm tệ footage thật") đã bị bác bỏ
  một phần:** assert follow-up F2 kỳ vọng basgo R4 tệ hơn đã FAIL —
  R4 đo được 0,2755 < 0,3011 (tốt hơn). Kết luận đúng: hiệu ứng thật
  trên pan mượt nhỏ hơn nhiễu run-to-run của transform; không kết luận
  được "tốt hơn" hay "tệ hơn" từ 1 lần chạy. Follow-up exit 1 chỉ vì
  assert giả thuyết này — không phải harness lỗi (5/6 assert còn lại
  xanh, xem §8).

### 7.3 Giới hạn của số footage thật

- F2 đối chứng (0,30–0,88) nằm gần sàn nhiễu của bộ ước lượng (R5:
  ~0,5–1,2 trên video stabilize) — chênh lệch nhỏ quanh mức này không
  có ý nghĩa; chỉ các excursion lớn (maxDm 17,6, wild8 15) mới đáng kể.
- n nhỏ: 2 đoạn × 5s, 1 preset (smoothing 10, denoise 0.5), tổng 8 lần
  stabilize. Chưa có footage rung thật mạnh (whip-pan >8px/f vẫn là nợ
  của R4).

## 8. Sự cố phương pháp trong lúc làm + cách xử lý (trung thực)

1. **Lỗi MAD crop ở lượt chạy 1 (nghiêm trọng, đã sửa):** module đo gộp
   tính MAD trên crop giữa 160×90 thay vì full-frame 320×180 như R2/R5.
   Phát hiện khi đối chiếu: MAD đối chứng lượt 1 = 9,4673, khác R5
   (11,8789), trong khi F2_V5 khớp tuyệt đối (13,4624) — vì Farneback
   vốn tính trên crop giữa. Sửa harness (`load_frames` trả về cả full
   và center; MAD dùng full, phase/Farneback dùng center). Follow-up
   trích module ĐÃ SỬA verbatim từ file harness (regex `MOTION_PY`) và
   đo lại toàn bộ: MAD khớp R5 tới 4 chữ số trên cả 10 video R2
   (11,8789; 4,3694/4,2967/1,9272; 1,8953/2,2412/1,9611), F2 không đổi.
   **Số MAD trong log lượt 1 là sai — đừng trích.** Số MAD trong LIMITS
   này và log lượt 3 là bản đúng.
2. **Lượt chạy 2 chết giữa chừng:** session nền biến mất lúc ~09:04
   (đang ở giữa S2, sau khi detect ×3 đã xong), không có lỗi trong log,
   `process.poll` báo "unknown session" — giống tiền lệ restart service
   các đợt trước. Trước khi chết, S0/S1 đã tái lập chính xác 100% số
   lượt 1 (MAD 11,8789, F2 13,4624, validate V5/V2, v0check). Đã chạy lại
   toàn bộ thành lượt 3: **27/27 pass, exit 0**, là lượt chuẩn để trích.
3. **Follow-up exit 1 (không phải lỗi harness):** 5/6 assert xanh; 1
   assert fail là giả thuyết "basgo R4 tệ hơn đối chứng" — dữ liệu bác
   bỏ giả thuyết (0,2755 < 0,3011). Assert đó đã được viết sai chiều
   (kỳ vọng tệ hơn dựa trên S4 lượt 1); kết luận đúng ghi ở §7.2.
4. **Bug log nhỏ (không ảnh hưởng số):** không còn. (Đã kiểm tra: assert
   F5 là sạch — module Python ghi ra scratch chứa 0 lần chuỗi "F5".)

## 9. Cách chạy lại

```bash
node server/render/src/test_round65_s1_motion_metric.js   # ~7 phút lúc yên, ~10-15 phút dưới tải cao; 27 pass
# Dùng lại render R2 nếu scratch còn (.scratch-r63r2m-auyFk4 / -2ulK66),
# footage thật từ .scratch-r64r4-9h00Sj (ocean-slow-seg / basgo-mid-seg).
# Log: hidden_files/round65-s1-run3.log (lượt chuẩn), round65-s1-followup.log
```

## 10. Nợ mở thêm (cho đợt sau)

- **vidstabtransform không xác định là nợ lớn nhất:** spread 36–38% chỉ
  từ transform (cùng .trf) khiến mọi so sánh stabilize 1-lần-chạy đều
  yếu. Hướng: (a) tìm nguyên nhân trong vidstabtransform (threading?
  float accumulation? phiên bản vidstab?) — có thể cần build vidstab từ
  source để thử; (b) thực dụng hơn: mọi đo stabilize sau này phải chạy
  ≥3 lần và báo cáo spread (như harness này đã làm), không bao giờ kết
  luận từ 1 lần chạy.
- **Thứ tự LM trong `.trf` có ảnh hưởng transform không?** Chưa trả lời
  được vì sàn nhiễu transform che mất. Cần transform xác định trước, hoặc
  so sánh phân phối trên nhiều lần chạy (vd 10 lần trfA vs 10 lần trfB).
- **Stabilize trên footage thật cần nghiên cứu riêng:** 2 đoạn 5s là quá
  ít; cần footage rung thật mạnh + đo nhiều lần chạy để tách "hiệu ứng
  thật" khỏi "nhiễu transform". Đặc biệt: vidstab có nên bật trên footage
  gần như đứng yên / pan mượt không (hiện tại nó thêm jitter)?
- **Ngưỡng wild8 = 8px là tùy chọn** (dựa trên glitch R5 ~10px V5).
  Chưa hiệu chuẩn ngưỡng trên footage thật; maxDm/p99Dm là số thô đáng
  tin hơn wild8.
- **F2 có sàn nhiễu ~0,5–1,2** (R5 §10.5) chưa tách được — trên footage
  thật ít rung, F2 gần như không phân biệt được "tốt" với "rất tốt".
- **Chưa làm:** độ nhạy F2 theo ngưỡng thresh (0,5/1,0/1,5px) trên
  render thật (nợ R5 §12); tách nguyên nhân F2 tăng theo denoise
  (nợ R5 §12).
