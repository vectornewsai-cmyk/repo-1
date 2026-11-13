# Đợt 105 G5 — G1: BẢN QUYẾT ĐỊNH CHO USER (G5 hay M2?) — KIỂM CHỨNG ĐỘC LẬP SỐ F1

Ngày: 13/11/2026 (lượt cron 18:35 +07; phân tích offline, KHÔNG đo live mới).
Nguồn: `docs/PHASE9_ROUND104_F1_G1_LIMITS.md` + `benchmarks/results/g1-evidence-v14-104f1.json`
(pool v14: 30fps n=109, 60fps n=69) + chạy lại 2 script trong
`hidden_files/round104-f1/` (`analyze-pool104f1.py`, `analyze-m2-quiet104f1.py`).

**Trạng thái: G1 VẪN MỞ. Tài liệu này chỉ trình bày số đã kiểm chứng + khuyến
nghị — KHÔNG tự đóng G1, KHÔNG đổi ngưỡng (0,75×), KHÔNG đổi metric, KHÔNG
đổi khung. Quyết định cuối thuộc user.**

## 1. Kiểm chứng độc lập — F1 báo đúng hay sai (từng số)

Chạy lại cả hai script từ dữ liệu gốc trên đĩa (report JSON của e1-run1..9
và 60fps-deint-run1..5 đều có trên đĩa, md5 JSON gộp không đổi sau khi
chạy lại). **Output chạy lại giống hệt từng byte log của F1**
(`pool104f1-analysis.log`, `m2-quiet104f1.log` — diff 0 dòng). Ngoài ra
tính tay từ tỉ lệ thô trong report run8/run9 (median/mean của 5 tỉ lệ):
khớp hoàn toàn.

| Số F1 công bố | Kiểm chứng lại | Kết quả |
|---|---|---|
| run8 yên: G5 0,91×, M2 0,94×, baseline 21,87 fps | mean [0,60; 1,02; 1,11; 0,90; 0,94] = 0,91; median = 0,94; baseMean 21,87 | **KHỚP** |
| run9 yên: G5 0,90×, M2 0,92×, baseline 27,39 fps | mean [0,92; 0,88; 0,92; 0,94; 0,86] = 0,90; median = 0,92; baseMean 27,39 | **KHỚP** |
| Pool v14: 30fps n=109 PASS 100/109 (92%); 60fps n=69 PASS 66/69 (96%) | chạy lại: đúng n, đúng PASS, đúng median/mean/CI | **KHỚP** |
| Tái tạo v13 trước khi gộp: 30fps 91/100, 60fps 61/64 | chạy lại: đúng cả hai | **KHỚP** |
| Chân yên 30fps G5: n=32, 28/32 (88%), median 0,940 | chạy lại: đúng | **KHỚP** |
| Chân yên 60fps: 26/26 (100%) cả G5 lẫn M2, median M2 0,975 | chạy lại: đúng | **KHỚP** |
| Khung (c): 26–27/32 = 81,2%–84,4%; kịch bản xấu 26/32 = 81,25% | 26/32 = 0,8125; 27/32 = 0,84375 | **KHỚP** |
| Khung (a): tối đa 15/20 = 75% | 20 lần đầu: 14 PASS tính-lại-được + tối đa 1 (I5-1) = 15 | **KHỚP** |
| Khung (b): 19/20 (95%), chỉ FAIL X6 r6 | chạy lại: 19/20, đúng thành phần, đúng 1 FAIL | **KHỚP** |
| Khung (d): 26/28 = 93% | chạy lại: đúng | **KHỚP** |
| Khung (e): 24/26 tính-lại-được (92%), tổng 30 lần | chạy lại: đúng (cờ: A7-7, D8-3) | **KHỚP** |
| Khung (f): 10/10 (100%) | chạy lại: đúng | **KHỚP** |
| Khung (g): 14/14 (100%) hậu-A9 | chạy lại: đúng | **KHỚP** |
| Khung (h): không đổi (0 lần biên 9–10 fps trong pool 30fps) | chạy lại: 0 lần biên | **KHỚP** |
| Khung (i): chịu được 4 lần yên FAIL liên tiếp (16/20) | mô phỏng lại: +4 → 16/20, +5 → 15/20 | **KHỚP** |
| Đồng thuận G5/M2: 140/146 (95,9%), 6 lần lật, 0 lần F1 lật | chạy lại: đúng 6 lần lật cũ (W6 r5, X6 r6, R6 N10 r2, U6 N10 r5, W6 N10 r5, Z9 N10 r5), 0 lần FAIL→PASS | **KHỚP** |
| Quy luật G5 ≥ 1,00: 71 lần, 0 lần lật | chạy lại: 71/0 | **KHỚP** |
| G5 PASS trong [0,75; 1,00): 70 lần, 6 lần lật (9%) | chạy lại: 70/6; tách band 48 lần (2 lật) + 22 lần (4 lật) = 70/6 | **KHỚP** |
| Chuỗi PASS yên liên tiếp (G5): 26 | đếm lại từ cuối chân yên: đúng 26, đứt ở U6 r2 (G5 0,67) | **KHỚP** |
| F1 riêng: 14/14 PASS cả hai metric | chạy lại: 9/9 E1 + 5/5 N10 | **KHỚP** |
| Số học Q5: +1 FAIL → 26/33 = 78,8%; +2 PASS → 28/34 = 82,4%; +2 PASS rồi +1 FAIL → 28/35 = 80,0% | 26/33 = 0,7879; 28/34 = 0,8235; 28/35 = 0,8000 | **KHỚP** |

**Một điểm diễn đạt chưa chính xác (không đổi số):** LIMITS F1 §1 viết cửa
sổ trượt (b) "sang phải 2 bậc: X6-1..4 ra, F1-8/9 vào". Kiểm lại: trước
F1, cửa sổ 20 lần cuối đã là X6-3..E1-1 (X6-1, X6-2 đã ra khỏi cửa sổ từ
các đợt trước); đợt này chỉ X6-3 và X6-4 rời cửa sổ. Cả hai đều PASS
(M2 0,90 và 1,09) nên số 19/20 không đổi — chỉ sửa diễn đạt, không sửa
số. Ghi ở đây để đợt sau khỏi trích sai.

**Kết luận kiểm chứng: 0 số sai. Mọi con số quyết định đều tái tạo được từ
dữ liệu gốc trên đĩa.**

## 2. Đối chiếu khung (a)–(i) và quy luật G5 ≥ 1,00 — có mâu thuẫn không?

**Không có mâu thuẫn số học nào.** Các khung không hề bất đồng về số đo —
chúng bất đồng về **luật chơi** (lần cũ có còn tính không):

| Khung | M2 đạt 16/20? | Bản chất của khung |
|---|---|---|
| (a) 20 lần yên đầu, cố định | KHÔNG — tối đa 15/20, trần cứng | Giữ toàn bộ lịch sử, khung đóng |
| (b) 20 lần yên mới nhất, trượt | CÓ — 19/20 | Chỉ tính 20 lần gần nhất; lần cũ tự rơi ra |
| (c) Tích lũy đầy đủ | CÓ — 26–27/32, xấu nhất 81,25% | Giữ toàn bộ lịch sử, khung mở |
| (d) Chỉ lần tính-lại-được | CÓ — 26/28 = 93% | Loại 4 lần mất dữ liệu (lệch chọn mẫu, A9 đã cảnh báo) |
| (e) Yên sạch (loại cờ slot-tải-đầu) | CÓ — 24/26 = 92% | Tập con, không phải khung chính |
| (f) Trượt 10 lần mới nhất | CÓ — 10/10 | Cửa sổ ngắn, nhạy với FAIL tương lai |
| (g) Kỷ nguyên hậu-A9 | CÓ — 14/14 | Chỉ tính từ đợt 99; lần cũ coi là "lỗi thời" |
| (h) Ngưỡng yên ≥ 9 thay vì ≥ 10 | Không kiểm được (0 lần biên) | Không có dữ liệu biên — không phải bằng chứng ổn định |
| (i) Biên an toàn của (b) | Chịu 4 FAIL liên tiếp | Đo độ dày đệm của (b), không phải khung độc lập |

Điểm mấu chốt: **(a) và (c) đều giữ toàn bộ lịch sử nhưng cho đáp án
ngược nhau** — (a) KHÔNG BAO GIỜ đạt vì 5 lần FAIL đã chốt trong 20 lần
đầu, (c) ĐÃ ĐẠT vì 2 lần yên mới đẩy tỉ lệ tích lũy lên 81,25% kịch bản
xấu. Đây không phải lỗi số — khung cố định 20 lần đầu là khung duy nhất
bị "khóa" bởi quá khứ; mọi khung còn lại đều đã đạt. Vì vậy câu hỏi thực
sự không phải "M2 có đạt không" mà là **"khung nào mới là luật chơi"**.

Quy luật "G5 ≥ 1,00 không bao giờ lật" (71 lần, 0 lật) cũng không mâu
thuẫn với khung nào: nó chỉ nói G5 cao thì an toàn, không nói G5 trong
[0,75; 1,00) thì an toàn — và đúng là vùng này có 6/70 lần lật (9%).

## 3. Hai phương án metric — đặt cạnh nhau

Ngưỡng 0,75× giữ nguyên trong mọi phương án. Yên = baseline mean ≥ 10 fps
(luật X6). Cả hai phương án đều dùng cùng dữ liệu đo; chỉ khác cách tính
tốc độ deint của một lần.

### Phương án A — Giữ G5 (mean 5 tỉ lệ)

- **Số đo:** chân yên 30fps 28/32 = 87,5% (số duy nhất, không khoảng —
  G5 của 4 lần mất fpsSlots vẫn còn: I5-1 0,93 PASS, J3-1/L3-1/L3-2 FAIL);
  chân yên 60fps 26/26 (100%); chuỗi PASS yên liên tiếp 26.
- **Đạt 16/20 không?** Tương đương: 87,5% > 80% — **đã đạt ngay, không
  cần thêm lần đo nào, không cần chọn khung**.
- **Ưu điểm:** đơn giản, số duy nhất, không còn câu hỏi mở về khung hay
  về 4 lần mất dữ liệu; đã dùng từ đầu lịch sử G1 nên so sánh được trực
  tiếp với mọi đợt cũ.
- **Nhược điểm (đã đo được):** G5 là mean nên bị phồng dưới tải — F1
  run3 G5 1,37× (chứa tỉ lệ đơn 3,03× do slot đóng băng), run7 G5 1,56×
  (chứa tỉ lệ đơn 4,06×). 6 lần trong lịch sử G5 PASS nhưng M2 FAIL
  (tỉ lệ lật 9% trong vùng [0,75; 1,00)) — nghĩa là G5 đã từng "báo nhanh"
  cho 6 lần thực chất chậm. Chọn G5 là chấp nhận metric này.

### Phương án B — Chuyển sang M2 (median 5 tỉ lệ, loại tỉ lệ có mẫu số kề < 0,5 fps)

- **Số đo:** chân yên 30fps 26–27/32 = 81,2%–84,4% (khoảng do I5-1 mất
  fpsSlots, vĩnh viễn không tính lại được); chân yên 60fps 26/26 (100%);
  14/14 lần F1 đồng thuận G5/M2.
- **Đạt 16/20 không?** Tùy khung (§2): khung (a) KHÔNG BAO GIỜ đạt;
  khung (c) ĐÃ ĐẠT kịch bản xấu 81,25%; khung (b)/(f)/(g) ĐÃ ĐẠT. **Chọn
  M2 mà không chọn khung thì câu hỏi vẫn mở.**
- **Ưu điểm:** trung thực hơn về tốc độ deint thật — median loại spike
  tải (run3: 1,37× → 0,95×; run7: 1,56× → 1,10×); M2 nghiêm ngặt hơn
  G5 theo đúng một chiều: 146 lần, 0 lần M2 PASS mà G5 FAIL — mọi lần
  M2 PASS đều là G5 PASS, không có lần nào M2 "tha" cho lần G5 bắt.
  Bước loại mẫu số đóng băng đã bắn đúng 1 lần đợt này (run3, tỉ lệ
  3,03×) — cơ chế hoạt động như thiết kế.
- **Nhược điểm:** khoảng 26–27/32 không bao giờ cho số duy nhất; đệm
  khung (c) mỏng (+1,25 điểm — 1 lần yên FAIL nữa kéo kịch bản xấu
  xuống 78,8%); M2 của 1 lần là median của chỉ 5 tỉ lệ nên nhiễu
  (lần sát ngưỡng run9 M2 0,92× có thể lật nếu đo lại); cần định nghĩa
  lại khung + 6 điều kiện A9 §9 nếu chuyển hẳn.

## 4. Khuyến nghị của G5 (khuyến nghị được phép — quyết định thuộc user)

**Khuyến nghị: phương án B (chuyển sang M2), với khung (c) tích lũy đầy
đủ làm khung đóng G1, lấy kịch bản xấu 26/32 = 81,25% làm số headline —
và đóng G1 ngay với điều kiện đệm mỏng ở §5.**

Lý do, theo thứ tự sức nặng của số đo:

1. **M2 nghiêm ngặt hơn G5 theo đúng một chiều, đã chứng minh trên 146
   lần.** 6 lần G5 PASS bị M2 bắt lại, 0 lần ngược lại. Giữ G5 đồng
   nghĩa với giữ một metric đã biết là báo nhanh trong 9% các lần
   PASS ở vùng [0,75; 1,00). Đây là lý do kỹ thuật mạnh nhất — không
   phải vì M2 "đạt" mà vì G5 "thổi phồng".
2. **Khung (c) là khung trung thực nhất còn đạt.** Nó giữ toàn bộ lịch
   sử (không vứt lần cũ như (b)/(f)/(g), không loại lần mất dữ liệu
   như (d)), và nay cả hai đầu khoảng đều vượt mốc — lần đầu tiên
   trong lịch sử G1. Không cần viện tới khung trượt hay kỷ nguyên mới
   để đạt; chỉ cần chấp nhận đệm +1,25 điểm.
3. **Khung (b) 19/20 và (g) 14/14 là bằng chứng củng cố, không phải lý
   do chính.** Nếu user thấy (c) chưa đủ dày, (b) cho thấy cùng một
   kết luận với đệm dày hơn nhiều (chịu 4 FAIL liên tiếp) — nhưng (b)
   đạt được bằng cách trượt bỏ lần cũ, nên chỉ nên dùng làm xác nhận
   chéo, không nên làm khung chính thức nếu user muốn giữ toàn bộ
   lịch sử.
4. **Không khuyến nghị khung (a) làm luật chơi.** (a) là khung duy nhất
   không bao giờ đạt dù đo thêm bao nhiêu lần — nó khóa quyết định
   vào 5 lần FAIL từ kỷ nguyên harness cũ (trước A9), trong đó 3 lần
   mất dữ liệu. Giữ (a) đồng nghĩa với giữ G5 mãi mãi, vì M2 dưới (a)
   không có đường nào đạt.

Nếu user không đồng ý đóng ngay với đệm mỏng: phương án dự phòng là chờ
thêm 2 lần yên PASS nữa (28/34 → chịu được 1 FAIL mà vẫn 80,0% kịch bản
xấu, đúng mốc) rồi đóng — không cần đổi khung hay metric, chỉ cần thêm
bằng chứng.

## 5. Điều kiện đóng G1 nếu user chọn mỗi phương án

### Nếu chọn phương án A (giữ G5)
- G1 đóng ngay, không cần thêm lần đo. Số đóng: chân yên 30fps 28/32 =
  87,5%; chân yên 60fps 26/26 = 100%; ngưỡng 0,75× giữ nguyên.
- Ghi rõ trong LIMITS đóng: G5 là mean nên tốc độ deint công bố có thể
  cao hơn tốc độ thật dưới tải; 6 lần lịch sử G5 PASS/M2 FAIL được ghi
  nhận là giới hạn đã biết của metric.
- Không cần định nghĩa lại khung (khung tích lũy dưới G5 đã là số duy
  nhất).

### Nếu chọn phương án B (chuyển M2 + khung (c)) — phương án được khuyến nghị
- G1 đóng ngay với số headline **kịch bản xấu 26/32 = 81,25%** (kịch bản
  tốt 27/32 = 84,4%). Khoảng 26–27/32 do I5-1 phải được ghi kèm mọi lần
  trích số — không được trích một đầu như số chắc.
- **Điều kiện kèm (đệm mỏng):** 1 lần yên FAIL trong tương lai kéo kịch
  bản xấu xuống 26/33 = 78,8% (dưới mốc) → **G1 tự mở lại** nếu xảy ra.
  Đợt sau đo được 2 lần yên PASS nữa thì điều kiện này hết hiệu lực
  (28/34 chịu được 1 FAIL).
- Cần định nghĩa lại khung chính thức theo 6 điều kiện A9 §9 (M2 chỉ
  tính trên lần có fpsSlots + luật loại mẫu số < 0,5 fps + phân loại
  yên/tải theo baseline vòng 1 + lần hỗn hợp chỉ tính pool tổng).
- Khung (a) cố định 20 lần đầu được ghi là **không còn áp dụng** cho
  quyết định M2 (vì trần cứng 15/20), hoặc user xác nhận rõ vẫn giữ
  (a) — trong trường hợp đó phương án B không đóng được G1.

### Nếu chọn phương án B với khung (b) trượt-20 thay vì (c)
- G1 đóng ngay với 19/20 (95%), đệm 4 lần yên FAIL liên tiếp. Cần user
  xác nhận rõ: lần cũ tự rơi khỏi cửa sổ là luật chơi đã duyệt (không
  phải cherry-picking). Khung (c) vẫn được theo dõi song song và ghi
  trong LIMITS.

## 6. Rủi ro còn lại của mỗi phương án

| Rủi ro | Phương án A (G5) | Phương án B (M2) |
|---|---|---|
| Báo nhanh (PASS giả) | **Có, đã đo:** 6/70 lần PASS trong [0,75; 1,00) lật dưới M2 (9%); tỉ lệ đơn phồng tới 4,06× | Không — 0 lần M2 PASS mà G5 FAIL trong 146 lần |
| Đệm mỏng, 1 FAIL tương lai lật kết luận | Không — 87,5%, chịu được nhiều FAIL | **Có, khung (c):** 1 lần yên FAIL → 78,8%; khung (b) thì không (chịu 4 FAIL) |
| Khoảng bất định vĩnh viễn (I5-1) | Không — G5 của I5-1 còn (0,93) | **Có:** 26–27/32 mãi mãi, không số duy nhất |
| Khung (a) chặn | Không áp dụng (G5 không dùng khung (a)) | **Có nếu user giữ (a):** M2 không bao giờ đạt |
| Nhiễu 1 lần đo (median 5 tỉ lệ) | Ít hơn (mean 5 tỉ lệ) | **Có:** run9 M2 0,92× có thể lật nếu đo lại — phải dùng tỉ lệ PASS + CI, không dùng 1 lần |
| Biên phân loại yên/tải chưa từng đo | Như nhau cả hai phương án | Như nhau: 0 lần biên 9–10 fps trong pool 30fps; khung (h) không kiểm được |
| Lần hỗn hợp (F1 run5, vòng 1 yên 14,86 fps) | Như nhau: chỉ tính pool tổng theo tiền lệ Z9 | Như nhau; nếu tính vòng yên như mẫu yên thì chân yên thành 29/33 (G5) / 27/29 tính-lại-được (M2) — kết luận không đổi |

Rủi ro chung (cả hai phương án): số đo chỉ đúng trên VM này (CPU-only,
4 vCPU, Chrome `--disable-gpu`, Xvfb) trong giờ vòng lặp 8–10 luồng song
song; không suy ra máy khác / máy có GPU / Safari thật. G4 flake lần thứ
hai (F1 run2, 2/18 lần E1) và toggle chậm kỷ lục (pause 837ms) là nợ
harness, không chạm tới G5/M2 nhưng đợt sau nên điều tra.

## 7. Câu hỏi cho user — chỉ còn quyết, không còn đo

**Q1 — Chọn metric nào: G5 hay M2?** (khuyến nghị: M2, §4).

**Q2 — Nếu chọn M2, khung nào là luật chơi?** (a) cố định 20 lần đầu
(M2 không bao giờ đạt), (b) trượt 20 lần mới nhất (19/20, đệm 4 FAIL),
(c) tích lũy đầy đủ (26–27/32, xấu nhất 81,25% — khuyến nghị), (f)
trượt 10 (10/10), hay (g) kỷ nguyên hậu-A9 (14/14)?

**Q3 — Đệm +1,25 điểm của khung (c) có đủ không?** (a) chấp nhận 81,25%
là đủ, đóng G1 ngay với điều kiện tự mở lại nếu 1 lần yên FAIL;
(b) chờ thêm 2 lần yên PASS nữa để chịu được 1 FAIL (28/34 → 28/35 =
80,0% đúng mốc); hay (c) coi (c) vẫn chưa khép vì chưa chịu được
1 FAIL?

**Q4 — 4 lần yên cũ mất fpsSlots xử lý thế nào?** Giữ khoảng 26–27/32
(khuyến nghị — trung thực nhất); loại khỏi mẫu, trích 26/28 = 93%
(đẹp nhưng lệch chọn mẫu); hay ghi I5-1 là "không xác định" và hoãn
quyết định tích lũy?

**Q5 — Lần hỗn hợp F1 run5 (và 5 lần trước) có giữ cách tính "chỉ pool
tổng" không?** Nếu tính vòng yên của run5 như mẫu yên thì chân yên G5
thành 29/33, M2 tính-lại-được thành 27/29 — kết luận không đổi, nhưng
số khung đổi. Cần xác nhận trước khi đợt sau trích số.

**Q6 — Các lần đo trước A9 có còn tính không?** Nếu đặt "tuổi thọ" cho
bằng chứng (chỉ tính từ đợt 99) thì khung (g) 14/14 là đáp án; nếu giữ
toàn bộ lịch sử thì khung (a) vẫn chặn. Đây là quyết định về tuổi thọ
bằng chứng, không phải về số đo.

## 8. Cách kiểm chứng lại (offline, không đo live)

```bash
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f1/analyze-pool104f1.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f1/analyze-m2-quiet104f1.py
# Output chạy lại giống hệt log F1 (diff 0 dòng) — xem
# hidden_files/round105-g5/pool-recheck.log và m2-recheck.log
# Tính tay run8/run9 từ tỉ lệ thô trong e1-run8/e1-run9/c77e1-headed-report.json
```

## 9. File đã đổi/thêm (stage, không push)

- `docs/PHASE9_ROUND105_G5_G1_DECISION.md` (file này).
- Log + dữ liệu kiểm chứng lại: `hidden_files/round105-g5/`
  (`pool-recheck.log`, `m2-recheck.log`, `g5-verification.md`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round105-g5-g1decision.txt`.

## 10. Giới hạn

1. G1 VẪN MỞ — tài liệu này không đóng G1, không đổi ngưỡng/metric/khung.
   Mọi câu hỏi §7 cần user quyết.
2. Không đo live mới đợt này (máy 8–10 luồng song song, RAM ~800MB sau
   reboot #30 lúc 11:26Z — không đủ yên). Mọi số đều từ dữ liệu F1 đợt
   104 đã đo + phân tích offline.
3. Khoảng 26–27/32 là vĩnh viễn (I5-1 mất fpsSlots). Mọi kết luận về chân
   yên tích lũy dưới M2 phải mang khoảng này.
4. Không kiểm lại TTS 39. Không thử birefnet. Không đụng
   `.github/workflows/*`. Không sửa code production — chỉ thêm tài liệu
   quyết định + log kiểm chứng.
