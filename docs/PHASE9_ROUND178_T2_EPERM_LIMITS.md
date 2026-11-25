# PHASE 9 — ROUND 178 — T2 EPERM LIMITS

**T2 đợt 178** — EPERM probe #96, phân loại (m) #91 **CUỐI** +
(m) #92 **CUỐI** + INSIDE #91 TRUE (chuỗi 1 → 2) + INSIDE #92 TRUE
(chuỗi 2 → 3), mù #96?/#88?/#94?/#95?/#77?, (m) #56 lần 21.
Đợt 178 mở 11:35:51Z 23/11/2026 (18:35:51 +07 23/11; lượt cron
18:35 +07). Boot lúc mở đã là 985bc2a3 (#92, btime 11:01:27Z) —
**REBOOT #92 xảy ra GIỮA đợt 177 và 178** (sau khi T10-177 đóng
sổ ~11:0xZ, trước khi đợt 178 mở), không trong phiên T2-178.
**Số hiệu #91 + #92 ĐÃ ĐƯỢC T0-178 XÁC NHẬN** (cờ 12:01Z: #92
9 nguồn trực tiếp; #91 qua bản ghi 9 nguồn T7-177 + T4-177 độc
lập + đối chiếu DB T0-178; marker sống qua 44 reboot #49–#92) —
(m)/INSIDE dưới đây là **phân loại cuối ở cấp T2 — parent quyết
cuối**. (m) #92 + INSIDE #92 thuộc T2-178 theo chỉ định T0-178
(cửa hẹp #92 đã khép 11:20:27Z, trước khi đợt mở — điều kiện
"nếu chưa đủ dữ liệu" trong task không xảy ra).

## §0. Headline

- **(m) #91: ÂM — parent quyết cuối.** Requeue duy nhất
  eid 10369, run 177, 09:08:30.157Z = btime +50,157 s, NGOÀI
  dải [33; 49,8], vượt biên TRÊN **0,357 s** — sát biên trên
  nhất từng ghi (đối xứng #88 sát biên dưới 0,431 s, DƯƠNG).
  1 run sống tại btime. **Caveat phân số: offset thật
  ∈ (49,157 s, 50,157 s]; DƯƠNG ⟺ δ ≥ 0,357 s — KHÔNG CÓ
  boot_est nào cho #91** (T7 không đo; boot đã qua). Với
  δ #90 (+0,32 s): offset 49,837 s — vẫn NGOÀI 0,037 s.
  **Caveat overlap: sampler +15 s / watcher +17 s (LỚN NHẤT
  chuỗi)** — ghi nhận nhưng KHÔNG lật verdict theo tiền lệ
  #87/#90 (lấy theo nghĩa đen sẽ lật ÂM→DƯƠNG ở #91, đúng như
  nó sẽ lật DƯƠNG→ÂM ở #90).
- **(m) #92: ÂM — parent quyết cuối.** Requeue duy nhất
  eid 10396, run 177, 11:09:06.816Z = btime +459,816 s, NGOÀI
  dải 410,016 s — KHÔNG phải sát biên (boot_est T0-178 +0,396 s
  → 459,420 s, vẫn ngoài 409,620 s). 1 run sống. Requeue MUỘN
  BẤT THƯỜNG (F-178-T0-4); sampler KHÔNG overlap (mẫu cuối
  btime −415 s).
- **INSIDE #91: TRUE (FULL137) — chuỗi 1 → 2.** Hai dải MÂU
  THUẪN (FULL137 TRUE, biên trên 1.748 s; FULL136 FALSE, trễ
  4.487 s) — dải phương pháp chi phối (F-165-T2-1).
- **INSIDE #92: TRUE (FULL138) — chuỗi 2 → 3.** Hai dải MÂU
  THUẪN (FULL138 TRUE, biên trên 1.944 s; FULL137 FALSE, trễ
  5.079 s) — dải phương pháp chi phối.
- **INSIDE #90 KIỂM LẠI với neo ĐÚNG (#89): TRUE** — m-check177
  dùng neo sai (#88); kiểm lại neo #89 vẫn TRUE (biên 4.672 s /
  2.544 s) — verdict #90 không đổi. (F-178-T2-1).
- **Mù #96? VẪN MỞ** — walk §3: R file 1.238 s (lần thứ 14 không
  đổi), hole-recheck lần 22 NEW=0 mọi hố; U file-gap max TĂNG
  2.852 → 3.530 s do pruning 5 exec-log (không phải mốc mới).
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 21 không thu hẹp** (5
  hướng DB MỚI (xxiii)–(xxvii) đều âm tính/rỗng; tổng 77 hướng;
  file-based (vii)/(viii)/(vii-b)/(vii-c) ÂM TÍNH (0 file trong
  W; max mtime D 20:15:33Z < mốc max 20:19:34Z). Cửa R [2,56251;
  2,66817) / J [2,566; 2,80753] s GIỮ NGUYÊN.
  **n chính thức GIỮ 14; n ứng viên GIỮ 36/37** (#91 ÂM + #92 ÂM).
- **EPERM probe #96: ok=2 fail=0** (11:42:49Z, boot 985bc2a3).
  Sweep #96: 0 sóng thật — 156 *.log trong cửa sổ probe, 3 file có
  marker (10 lần), TẤT CẢ là trích dẫn trong log phân tích đợt 177
  (o8-177t0, eperm-sweep177, o8-177t8). Sóng EPERM thật gần nhất
  vẫn ~11:55–12:11Z 11/11.
- **Run 177 SUCCEEDED** 11:09:57Z (số liệu DB tươi; kết cục thuộc
  T7-178): viết lại ×2 (#91 + #92), trước hạn 1.554 s,
  claimed→finished **7 s (<60 s — KHÔNG phải ca ≥60 s)**.
  Run 178 jitter 0 s (T0-178).
- **Tuân thủ luật script nặng đợt 178: 1 chồng chéo KHÔNG CHỦ Ý
  với attempt1 sau #93 của T4 (walk chạy trong lúc T4 khởi động
  lại — xem §4.2; attempt vẫn PASS, parent quyết có tính là vi
  phạm không).**

## §1. Điểm (m)

### §1.1 (m) #91 — ÂM (CUỐI, đối chiếu độc lập + T0-178)

- **Btime #91: 09:07:40Z** (epoch 1795424860), boot 8c0ec92d,
  gap #90→#91 = 7.031 s. **T0-178 XÁC NHẬN** (cờ 12:01Z):
  T7-177 xác minh 9 nguồn trong phiên (phát hiện trong 57 s,
  kiểm lại 09:22Z + 11:01Z — boot_id + btime /proc/stat +
  uptime -s 09:07:40Z + /proc/1 mtime 09:07:56.022Z (+16,022 s)
  + journal idx 0 first + wtmp begins 09:07:56Z (+16 s) + last
  reboot 09:07 + who -b 09:07; CF ~1 s); T4-177 xác nhận độc lập
  btime + gap; T0-178 đối chiếu DB khớp từng số. Hạn chế:
  journal/wtmp hiện chỉ còn #92 nên T0-178 không đọc lại trực
  tiếp 9 nguồn địa phương của #91 — xác minh dựa trên bản ghi
  trong phiên của T7-177. Marker sống qua 44 reboot #49–#92.
- T2-178 xác minh độc lập từ DB tươi (muse.db, đọc ~11:40Z):
  **requeue duy nhất** trong cửa hẹp [09:07:40Z, 09:26:40Z] VÀ
  cửa rộng tới ~11:40Z (trừ requeue #92): **eid 10369, run 177
  (2e0ce3f4), 09:08:30.157439Z = btime +50,157 s, NGOÀI dải
  [33; 49,8], vượt biên TRÊN 0,357 s.** Cửa hẹp đã khép hẳn lúc
  đọc. Chỉ 6 requeue ngày 23/11 (#86/#87/#88/#90/#91/#92).
- Run 177: 8 event — dispatched 08:35:51.076Z eid 10359;
  requeued 09:08:30.157Z eid 10369; dispatched 09:08:30.241Z
  eid 10370; reattached 09:08:30.442Z eid 10371; requeued
  11:09:06.816Z eid 10396 (#92); dispatched 11:09:06.878Z eid
  10397; reattached 11:09:06.942Z eid 10398; succeeded
  11:09:57.057Z eid 10399. **Đúng 2 lần viết lại** (#91 + #92).
  3 event ngay trước btime [09:00:00Z, 09:07:40Z): reconciled
  09:00:00.064Z eid 10366 + DR dispatched/succeeded
  09:00:00.105Z/269Z eid 10367/10368 (xong ~460 s TRƯỚC btime).
  Không event nào trong (09:00:00Z, 09:07:40Z) hay (09:07:40Z,
  09:08:30Z) — khoảng trống event 510 s ôm btime, không cho
  thông tin về δ.
- **Đúng 1 run sống tại btime #91** (truy vấn scheduled ≤ btime
  AND finished > btime, DB tươi): run 177 (sched 08:35:51Z,
  finished 11:09:57Z). Không run nào khác.
- **Phán: (m) #91 ÂM — parent quyết cuối. n ứng viên GIỮ 36/37
  (sau #90 DƯƠNG đã chấp nhận); n chính thức GIỮ 14.**

### §1.2 (m) #92 — ÂM (CUỐI, đối chiếu độc lập + T0-178)

- **Btime #92: 11:01:27Z** (epoch 1795431687), boot 985bc2a3,
  gap #91→#92 = 6.827 s. **T0-178 XÁC NHẬN 9 nguồn trực tiếp**
  (cờ 12:01Z): boot_id + btime /proc/stat + uptime bracket ×3
  boot_est 1795431687.396/.395/.394 = btime +0,396 s + /proc/1
  start_ticks 1687/100Hz = btime +16,87 s, mtime 11:01:44.266Z
  (+17,266 s) + journal 1 boot first 11:01:44.958Z (+17,958 s)
  + CF ×4 (~1 s) + DB (run 178 boot_gen mới dcf769fa; run 177
  boot_gen → c92a2dd5). T2-178 xác minh trực tiếp: uptime -s
  11:01:27Z + /proc/stat btime + probe#96 boot-change + preflight
  T4-178 khớp.
- T2-178 xác minh độc lập từ DB tươi (đọc ~12:0xZ):
  **requeue duy nhất** trong cửa hẹp [11:01:27Z, 11:20:27Z]:
  **eid 10396, run 177, 11:09:06.815565Z = btime +459,816 s,
  NGOÀI dải 410,016 s.** Với boot_est T0-178 (+0,396 s):
  459,420 s — vẫn ngoài 409,620 s. **KHÔNG phải sát biên**
  (margin 410 s >> 1 s — caveat phân số không ảnh hưởng).
  7 event trong cửa hẹp: requeue/dispatched/reattached
  11:09:06.816Z/878Z/942Z eid 10396/10397/10398 + succeeded
  11:09:57.057Z eid 10399 + reconciled 11:15:34.071Z eid 10400
  + DR dispatched/succeeded 11:15:34.120Z/186Z eid 10401/10402.
- **Đúng 1 run sống tại btime #92:** run 177. Không run khác
  (T0-178 độc lập: cùng kết luận; cửa [btime92, btime92+900 s]
  đúng 1 requeue — khớp T2).
- **Requeue MUỘN BẤT THƯỜNG (F-178-T0-4):** +459,816 s sau
  btime — chậm hơn mọi requeue trước (#86: 49,418 s; #87:
  39,864 s; #88: 33,431 s; #90: 35,313 s; #91: 50,157 s).
  Scheduler/DB mất ~7m40s mới viết lại run 177 sau #92 (run
  177 vẫn sống tới 11:09:57Z rồi SUCCEEDED — không mất mát).
  Ghi nhận, không suy ra thêm.
- **Phán: (m) #92 ÂM — parent quyết cuối. n ứng viên GIỮ 36/37.**

### §1.3 Run 177 kết cục (số liệu; kết cục thuộc T7-178)

- **status SUCCEEDED, finished_at_utc 1795432197 = 11:09:57Z**
  (T0-178 khớp từng số). **claimed_at_utc 1795432190 =
  11:09:50Z; claimed→finished = 7 s**; wall từ sched gốc =
  9.246 s; finished **1.554 s TRƯỚC hạn** 11:35:51Z; attempt 1;
  viết lại ×2 (#91 + #92); started_at_utc 1795432146
  (= 11:09:06Z, viết lại tại #92); boot_gen cuối
  cron_boot_c92a2dd53e184af3909fa8d67a1d6577 (#92).
- **7 s < 60 s — KHÔNG phải ca claimed→finished ≥60 s**
  (số ca GIỮ 9). **Phân loại cuối thuộc T7-178 + parent** — T2
  chỉ ghi số liệu DB tươi. Run 178 (đợt này): T0-178 ghi
  jitter 0 s; kết cục thuộc T7-179.

### §1.4 Frame-drift #91 — sampler +15 s / watcher +17 s (LỚN NHẤT chuỗi)

- **Sampler-177: dòng cuối boot cũ 94247dfa 09:07:55Z = btime
  +15 s** (ram-sampler.log dòng 28); **dòng đầu boot mới
  8c0ec92d 09:09:28Z = btime +108 s** (dòng 29 — sampler khởi
  động lại trong ~93 s gap mẫu, theo T9-177).
- **Watcher-177: poll cuối 09:07:27Z, rồi THÊM 1 dòng 09:07:57Z
  = btime +17 s vẫn báo boot 94247dfa** (replay-watch-177.log
  dòng 41, file mtime 09:07:57.42Z) — **FILE KẾT THÚC TẠI ĐÓ**
  (watcher chết theo #91, T5-177 không resume sau #91).
- **Overlap +15 s / +17 s là LỚN NHẤT trong chuỗi** (trước đó:
  11/20/23/9/8/36/7/3 s). Cơ chế: đồng hồ boot cũ (#90) chạy
  NHANH ở cuối (CF lúc mở ~08:39Z chỉ chênh ~1 s; dòng cuối
  sampler/watcher mang timestamp khung nhanh +15/+17 s).
  T9-177 ghi "OVERLAP BIỂU KIẾN +15 s" (F-177-T9-2).
- Hệ quả: **lấy overlap theo nghĩa đen thì offset thật ~33–35 s
  — TRONG dải → DƯƠNG.** Nhưng tiền lệ đứng (#87 overlap +7 s,
  #90 overlap +3 s — parent chấp nhận DƯƠNG trên btime; ở #90
  lấy overlap theo nghĩa đen sẽ lật DƯƠNG→ÂM) nói: **overlap là
  caveat, KHÔNG BAO GIỜ lật verdict btime.** T2-178 áp dụng đối
  xứng: overlap không lật ÂM→DƯƠNG ở #91. Parent quyết cuối.
- **Frame-drift #92: KHÔNG overlap** — sampler-177 mẫu cuối
  trên #91 lúc 10:54:32Z = btime −415 s (log kết thúc tại đó);
  không có dòng boot cũ nào sau btime #92.

### §1.5 Caveat phân số #91 — KHÔNG CÓ boot_est (F-178-T2-2)

- Btime là số nguyên /proc/stat; boot thật ∈ [btime, btime+1 s)
  → offset thật ∈ (49,157 s, 50,157 s]. **DƯƠNG ⟺ δ ≥ 0,357 s**
  (chính xác 0,357439 s). **KHÔNG CÓ boot_est nào cho #91:**
  T7-177 không đo (chỉ ghi số thô); T0-178 không suy ra từ
  boot khác (appendix178.txt); boot đã qua, không đo lại được.
  δ(#91) KHÔNG BIẾT được sau sự kiện.
- Prior duy nhất: δ(#90) = +0,32 s (T2 + T0 khớp tới 0,01 s);
  δ(#92) = +0,396 s (T0-178, ×3 chênh <0,01 s). Nếu δ(#91)
  ≈ 0,32–0,40 s thì offset thật ≈ 49,76–49,84 s — **vẫn NGOÀI
  dải 0,037 s (δ = 0,32 s) hoặc TRONG dải 0,04 s (δ = 0,40 s).**
  Ngay cả prior cũng không phân định được: verdict phụ thuộc
  hoàn toàn vào δ thật — và δ thật không có. **Theo quy ước
  đứng (dải (m) theo offset btime-tương đối, T7-177 §3.3),
  verdict là ÂM.** Nếu parent không chấp nhận quy ước btime
  cho trường hợp sát biên này, (m) #91 là trường hợp KHÔNG
  PHÂN ĐỊNH ĐƯỢC bằng dữ liệu hiện có — parent quyết.
- Đối xứng #88 (margin 0,431 s, DƯƠNG, parent chấp nhận):
  ở #88 offset btime TRONG dải 0,431 s và caveat phân số có thể
  lật nó ra ngoài; parent chấp nhận theo btime. Ở #91 offset
  btime NGOÀI dải 0,357 s và caveat có thể lật nó vào trong;
  T2 áp dụng cùng kỷ luật: **btime quyết định, caveat ghi rõ.**

### §1.6 (m) #88/#89/#90 — chỉ tham chiếu, KHÔNG mở lại

- #88 DƯƠNG + #89 ÂM + #90 DƯƠNG: parent đã CHẤP NHẬN (quyết
  (f)/(a) đợt 176/177). KHÔNG mở lại. n ứng viên sau #90:
  **36/37** (quyết (q) 177).

## §2. INSIDE — dải FULL135/FULL136/FULL137/FULL138

Script: `m-check178.py` (log `m-check178.txt`; exec
`m-check175b.py` — FULL133 p10/p90 khớp bằng assert
1596,60/8811,20; FULL134 p10/p90 khớp T2-176 bằng assert
1605,40/8803,30; FULL135 p10/p90 khớp T2-176 bằng assert
1569,40/8795,40; FULL136 p10/p90 khớp T2-177 bằng assert
1571,00/8787,50). Quy ước đứng (F-165-T2-1): dải cho reboot #k
là FULL(110+k−64) neo btime #(k−1).

- **FULL137**: n=137, mean 1h40'16", median 1h54'16", p10 1572,60 s,
  p90 8779,60 s, sd 0h54'29", in 90–150'=74, <60'=32, >180'=9,
  >240'=3 (= FULL136 + [gap #91 = 7.031 s]).
- **INSIDE #91: TRUE (FULL137)** — dải [07:36:41Z, 09:36:48Z] neo
  07:10:29Z (#90); btime #91 09:07:40Z TRONG dải, cách biên dưới
  5.459 s, cách biên trên 1.748 s. **Chuỗi 1 → 2.** Đối chiếu vs
  FULL136 (neo #89): FALSE (dải [05:52:37Z, 07:52:53Z], trễ
  4.487 s) — **hai dải MÂU THUẪN ngược hướng (lần thứ 6)**;
  dải phương pháp FULL137 chi phối theo F-165-T2-1 (F-178-T2-3).
- **FULL138**: n=138, mean 1h40'22", median 1h54'02", p10 1574,20 s,
  p90 8771,70 s, sd 0h54'17", in 90–150'=75, <60'=32, >180'=9,
  >240'=3 (= FULL137 + [gap #92 = 6.827 s]).
- **INSIDE #92: TRUE (FULL138)** — dải [09:33:54Z, 11:33:51Z] neo
  09:07:40Z (#91); btime #92 11:01:27Z TRONG dải, cách biên dưới
  5.253 s, cách biên trên 1.944 s. **Chuỗi 2 → 3.** Đối chiếu vs
  FULL137 (neo #90): FALSE (dải [07:36:41Z, 09:36:48Z], trễ
  5.079 s) — **hai dải MÂU THUẪN ngược hướng (lần thứ 7)**;
  dải phương pháp FULL138 chi phối (F-178-T2-3).
- **INSIDE #90 KIỂM LẠI (F-178-T2-1):** m-check177.py dùng neo
  05:04:17Z (#88) cho dải FULL136 — SAI theo F-165-T2-1 (neo
  phải là #89 = 05:26:26Z). Kiểm lại: FULL136 neo #89, dải
  [05:52:37Z, 07:52:53Z], btime #90 07:10:29Z TRONG dải (biên
  dưới 4.672 s, biên trên 2.544 s) — **TRUE, verdict không đổi;
  đồng thuận với FULL135 neo #88 vẫn đứng.** Lỗi neo không đổi
  bất kỳ verdict nào đã chốt, nhưng script đợt 178 đã sửa.
- Tốc độ reboot: tới #92: 168 reboot / 302,72 h = 1 lần / 108,1
  phút (không đổi so với tới #91: 167 / 300,82 h).

## §3. Mù

B0 = 11:15:18Z 21/11 (btime #64), B1 = 13:09:46Z 23/11 (giờ chạy
thực tế, F-172-T2-12); cửa sổ 179.668 s. Walk chạy 13:09:50–
13:11:33Z (script `blind9696-investigate.py`, log cùng tên).
**Lưu ý: walk chạy SAU reboot #93 (13:07:35Z)** — /tmp bị wipe
lần nữa ở #93, và 0 file /tmp mới được tạo giữa #93 và walk.
Sàn (floor) 19'07" = 1.147 s (đứng từ đợt 162).

### §3.1 Walk + file-marks (merged/content)

- Số file có mtime trong cửa sổ: repo-1 **732** (đợt 177: 593),
  hidden_files **6.323** (6.056), outside **2.442** (2.276),
  /tmp **0** (639 — wipe bởi #93, không file mới sau #93).
- Merged unique second-marks: **4.512** (177: 4.201).
- **R file (raw): 13 marks, MAX GAP 1.238 s** (11:15:29Z →
  11:35:56Z) — **OPEN, lần thứ 14 liên tiếp KHÔNG ĐỔI.**
  R union-A 1.222 s / union-B 1.211 s — OPEN.
- S file: 226 marks, max 3.235 s (13:01:51Z → 13:55:46Z) —
  OPEN; S union-A 662 s / union-B 591 s — CLOSED.
- T file: 211 marks, max 627 s — CLOSED; T union-A 38 s —
  CLOSED.
- **U file: 4.062 marks, max 3.530 s** (09:55:21Z → 10:54:11Z
  22/11) — **OPEN, TĂNG từ 2.852 s** (đợt 177). Nguyên nhân:
  pruning xóa 5 exec-log cầu nối — proc_73d6d84bbfc1 (10:02:45Z),
  proc_6b03cdc0bb27 (10:08:01Z, H-U7 head), proc_be95c7176cb0
  (10:28:06Z, H-U7 tail), proc_e174402912c9 (10:33:43Z, H-U8
  head), proc_91e8f5fbb598 (10:53:31Z, H-U8 tail) — cả 5 ĐÃ
  XÁC NHẬN GONE, 2 thư mục exec-logs b67c016f/df7c550a nay
  TRỐNG (dir mtime 11:08:31Z / 10:58:34Z 23/11). **Không phải
  mốc mới** — chỉ mất cầu nối do pruning (cùng họ F-177-T2-9).
  U union-A 1.276 s — OPEN;
  **U union-B 1.118 s — CLOSED, cách sàn 29 s (KHÔNG ĐỔI).**
- R-head 0; R-tail repo-1=2 / hidden_files=51 / outside=2
  / tmp=0 (như 177). U-tail (12:50:39–13:09:46Z): repo-1=2 /
  hidden_files=18 / outside=54 / tmp=0.

### §3.2 Sessions + witness (exec-log)

- Exec-logs có mtime trong cửa sổ: **330** (177: 298); mtime
  trong R/S/T: **0/0/0**, trong U: 330.
- Jump witness #64–#86 (sau khi trừ T2-177 + T2-178, xem
  F-178-T2-10): **bằng đúng đợt 177, TRỪ #78: 9 → 7.** #64: 4,
  #65: 5, #66: 5, #67: 5, #68: 5, #69: 5, #70: 5, #71: 5, #72: 7,
  #73: 7, #74: 7, #75: 7, #76: 7, #77: 7, #78: 7 (−2), #79: 7,
  #80: 7, #81: 7, #82: 6, #83: 5, #84: 8, #85: 4, #86: 3.
  **#78 mất 2 witness do pruning:** proc_7e7f36045583.log (span
  08:49:06–09:42:10Z 22/11) + proc_6b03cdc0bb27.log (span
  08:49:41–10:07:10Z) — cùng df7c550a, cả hai GONE (dir trống).
  7 còn lại = 9 file đợt 177 trừ 2 đã mất.
- Witness #87–#92 (script `witness878989.py`, trừ dir T2-177 +
  T2-178 + mọi log chứa marker T2): **#87: 4, #88: 2, #89: 2,
  #90: 2 (KHÔNG ĐỔI so với đợt 177)** — cùng 2 file cũ T9-174
  (proc_f4c14c9e5897.log + proc_910b750ec4a6.log — đã kiểm đợt
  175, trích dẫn/linger). **#91: 4 thô → 2 thật; #92: 3 thô →
  2 thật** — cùng 2 file T9-174 trên. 2 file "thừa" đã kiểm tay,
  đều là TRÍCH DẪN, không phải hoạt động thật:
  (a) proc_e0519f42fe88.log (a0493e91 — log poll T4-177, hoạt động
  thật 08:42–08:47Z, TRƯỚC #91; "span" 07:10:29–10:30:00Z do
  trích btime #90 + giờ kết thúc 10:30:00Z);
  (b) proc_400d8972ac10.log (1075a569 — dòng REPLAY-WATCH-177-
  START 08:41:39Z trích btime #90 07:10:29Z + end=11:30:00Z —
  giờ kết thúc dự kiến, không phải mốc quan sát). **Kết luận:
  0 hoạt động thật ở mọi reboot #64–#92.**
- Content-ts trong hố R union (11:15:29–11:35:40Z): **2 hit,
  cùng 11:16:22Z** — 2 file đã biết (proc_2a68c5ee9e4f.log +
  proc_52cb85ef2a58.log), không đổi từ đợt 177. Content-ts
  trong hố U file max mới (09:55:21–10:54:11Z 22/11): **2 hit,
  cùng 10:08:01Z** — cùng 2 file trên, trích H-U7 head (mtime
  của file proc_6b03cdc0bb27 đã bị prune — mốc còn sống dưới
  dạng trích dẫn). 0 hoạt động thật.

### §3.3 Hole-recheck lần 22 (NEW=0 mọi hố)

Script `hole-recheck9696.py`, chạy 13:18:25–13:20:20Z, log
`hole-recheck178.log` + `holerecheck-all.txt` (B1 đã kiểm bằng
`grep ^W =` / `grep ^hi =` trước khi chạy).

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0** — lần thứ 22 liên tiếp 0 mới.
- H-U7 (10:08:01–10:28:06Z 22/11): inside=0, NEW=0; H-U8
  (10:33:43–10:53:31Z): inside=0, NEW=0 — 2 hố vẫn trống
  (5 file cầu nối đã mất do pruning, không file mới nào xuất
  hiện trong hố).
- Mọi hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-T1/H-U1/
  H-U2-old/H-U4/H-U5/H-U6 = 0; H-S3/H-U2/H-U3/H-U9/H-U10/H-U11/
  H-S4/H-T2/H-U12/H-U13/H-U14/H-U15 inside 1–10, đều float-trap
  đã biết).

### §3.4 Kết luận mù

- **Mù #96? (#64) VẪN MỞ** — R file 1.238 s lần thứ 14 không đổi;
  không mốc mới nào trong cửa sổ.
- **Mù #95? (#63) / #94? (#62) / #88? / #77?: VẪN MỞ** —
  hole-recheck lần 22 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới).
- **CERT/FULL GIỮ 76/91** (vì #77? và #88? vẫn mở).
- U union-B cách sàn 29 s — theo dõi sát (không đổi).

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 21, KHÔNG THU HẸP (5 hướng DB MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1): R ≥ 2,562 (từ file session T10-156 mtime wall
20:16:36Z); #56 là điểm ÂM ⟺ R < 2,668 (run 156 còn chạy tại #56
⟺ true-finish > 19:32:47Z). Cửa ứng viên [19:33:20Z, 19:33:37Z]
= epochs 1795203200..1795203217 (= btime #56 + [33 s, 49,8 s],
band (m) theo giờ thật). Run 156: run_id
9c7b6986-46fd-4a31-beea-2e36272d1d26, sched 1795196151
(17:35:51Z), started 1795201518 (19:05:18Z), finished 1795205974
(20:19:34Z), succeeded, request_id NULL.

- **(xxiii) DB `scheduler.events` trong cửa ứng viên (MỚI):
  0 event của run 156 trong W; 0 event của MỌI run trong W.
  ÂM TÍNH** — cửa ứng viên trống hoàn toàn ở bảng events
  (khớp (iv): không event nào giữa 19:15:34Z và 19:41:54Z).
- **(xxiv) DB `scheduler.job_runs` finished_at trong W (MỚI):
  0 run. ÂM TÍNH.**
- **(xxv) DB `scheduler.terminal_signals` run 156 (MỚI — bảng
  chưa từng tra riêng cho run 156): ĐÚNG 1 dòng** —
  notify_main_agent, created_at_utc 1795205974 = 20:19:34Z
  (KHÔNG trong W), producer_boot_generation
  cron_boot_92f3214ffd3c47f99d7c51d9c244bb1b. **ÂM TÍNH.**
- **(xxvi) DB `scheduler.delivery_outbox` run 156 (MỚI — bảng
  chưa từng tra cho #56): ĐÚNG 1 dòng** — created_at_utc
  1795205974 (20:19:34Z), delivered_at_utc 1795206469
  (20:27:49Z), state delivered — KHÔNG trong W. **ÂM TÍNH.**
- **(xxvii) DB `runtime.requests` (MỚI — 2 kiểm tra): (a)
  root_request_id = run 156 trong W: 0 dòng; (b) root_work_class
  LIKE '%vcut%'/'%build%' trong D: 0 dòng (run 156 request_id
  NULL). **ÂM TÍNH.**
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức GIỮ 14.**
  Tổng 77 hướng âm tính/rỗng liên tiếp (72 tới đợt 177 + 5 hướng
  mới đợt này).
- **Hướng file-based (vii)/(viii)/(vii-b)/(vii-c) (m56-178.py,
  chạy ~13:20:2xZ): (vii) 0 file có mtime trong W
  [19:33:20–19:33:37Z]; 333 file trong D, max mtime
  20:15:33.130Z (< mốc max 20:19:34Z — KHÔNG file mới);
  (viii) 0 exec-log có mtime trong D; (vii-b) 0 file tại
  20:16:00–20:17:00Z; (vii-c) 0 file tại 20:19:30–20:19:40Z.
  ÂM TÍNH — lần thứ 21 không thu hẹp.**

### §4.2 Tuân thủ luật script nặng đợt 178 — 1 chồng chéo không chủ ý

- T4-178 mở poller 11:39Z (pid 16569, gate0wait). T2-178
  **KHÔNG khởi động script nặng nào** trong lúc poller gate0wait:
  probe #96 (nhẹ, ~1 s) + truy vấn DB + m-check + grep có đích +
  sed đều nhẹ. **Chờ poller thoát bằng lệnh `timeout` nền**
  (chỉ kiểm log poller mỗi ~4–5 phút bằng `tail`).
- **Attempt1 (poller gốc): KHÔNG BAO GIỜ MỞ.** GateA RAM ≥1024 MB
  không đạt trong suốt 118 poll (RAMavail cuối 442 MB, Balloon
  ~6,44 GB kẹt); không file attempt-done-* nào; `run-attempt-178.sh`
  không chạy lần nào. **Poller CHẾT THEO REBOOT #93:** poll cuối
  #118 lúc 13:07:43Z (đồng hồ boot cũ, nhanh ~8 s so với btime
  #93 13:07:35Z — overlap biểu kiến +8 s, cùng họ #91);
  poll-t4.log mtime 13:07:43.17Z, không dòng nào sau đó; kiểm
  trực tiếp 13:08:18Z: không còn process poll-wait-t4-178,
  không process attempt/watcher nào của T4-178; thư mục T4-178
  không có file mới từ 11:38Z. Poller KHÔNG thoát bình thường
  (bị reboot giết giữa chừng, không có dòng exit) — nhưng đã
  chết hẳn lúc kiểm.
- **CHỒNG CHÉO KHÔNG CHỦ Ý với attempt1 sau #93 của T4 (SỬA
  THEO CỜ T4-178, đọc 13:26Z).** T4 khởi động lại TAY lúc
  13:09:15Z (sau #93) và mở attempt1-97054ac6 trên boot #93:
  setup/poll 13:09:15–13:12:15Z, WebKit lên 13:12:20Z, đo
  ~13:12:20–13:13:43Z, stop-sampler 13:15:38Z. **Walk mù của T2
  chạy 13:09:50–13:11:33Z — TRONG cửa sổ attempt1 sau #93**
  (bắt đầu 35 s sau khi T4 khởi động lại), nhưng KẾT THÚC trước
  khi đo bắt đầu (13:12:20Z). Merged/content/sessions/witness
  (~13:11:35–13:14:30Z) chồng với pha đo — nhưng đó là script
  NHẸ (mỗi script 1–2 s, đọc file). Hole-recheck (13:18:25Z) +
  m56 + sweep chạy SAU khi attempt kết thúc (13:15:38Z). **Tại
  sao không biết:** kiểm ps cuối của T2 lúc 13:09:03Z (không có
  process T4 nào) — T4 khởi động lại lúc 13:09:15Z, rơi vào
  khoảng trống 47 s trước khi walk bắt đầu (13:09:50Z); T2 chỉ
  biết khi đọc cờ T4-178 lúc 13:26Z. **Hậu quả: KHÔNG ĐO ĐƯỢC
  — attempt1-97054ac6 PASS SẠCH (20/20 + B 5/5, tickCost median
  45,0 ms; T4 ghi "0 vi pham F-175-T4-2").** T2 ghi nhận chồng
  chéo và để parent quyết có tính là vi phạm không — KHÔNG tự
  kết luận 0 vi phạm nữa.
- Walk mù chạy 13:09:50–13:11:33Z; merged/content/sessions/
  witness ~13:11:35–13:14:30Z; hole-recheck 13:18:25–13:20:20Z;
  m56 file-based ~13:20:2xZ; sweep kết thúc 13:21:38Z.
- Lưu ý: phiên T2-178 bị gián đoạn bởi runtime restart trùng với
  #93 (lệnh watch nền không có kết quả xác nhận sau restart) —
  cái chết của poller được xác minh TRỰC TIẾP bằng ps + mtime
  log, không qua lệnh watch.
- Lưu ý: gate0 đã đạt từ poll #24 (11:56:48Z, POSTBOOT_PASS #92
  CÓ, T5-178); gateA RAM ≥1024 MB KHÔNG đạt trong suốt thời gian
  chờ (RAMavail ~400–800 MB, Balloon ~6,44 GB kẹt) — poller chờ
  tới hạn cắt 13:30Z nhưng bị reboot #93 giết lúc ~13:07:35Z —
  **attempt1 (poller gốc) KHÔNG BAO GIỜ MỞ.** Nhưng T4 khởi động
  lại tay sau #93 và **CÓ lượt yên hợp lệ trên boot #93**
  (attempt1-97054ac6, 20/20 + B 5/5, median 45,0 ms; chuỗi lượt
  yên hợp lệ 40 → 41 — theo cờ T4-178, đọc 13:26Z; kết luận
  cuối thuộc T4-178/T10-178).
- Bài học F-176-T2-11 vẫn đứng: chờ poller thoát hẳn, không dựa
  vào guard giết giữa chừng (F-175-T4-2: guard không miễn trừ).

## §5. EPERM probe #96 + sweep

- **Probe #96: chạy 11:42:49Z, boot 985bc2a3, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 270 → 272 dòng (+1
  boot-changed, +1 probe#96); heartbeat n=96.
  **MemAvailable lúc probe: 3.565.560 kB.** Cửa sổ probe #96:
  08:44:05Z (#95) → 11:42:49Z = 11.904 s. Sóng EPERM thật gần
  nhất vẫn ~11:55–12:11Z 11/11. Lưu ý: probe #96 bỏ qua #91
  (không probe nào chạy trong đời #91).
- **Sweep #96** (script `eperm-sweep9696.py`, log `eperm-sweep178.log`,
  chạy ~13:21:3xZ, sau khi poller chết): **156 *.log có mtime
  trong cửa sổ probe** [08:44:05Z, 11:42:49Z]; **3 file có
  marker (10 lần)** — o8-177t0.log ("sóng EPERM đã tắt" ×3),
  eperm-sweep177.log ("Operation not permitted" ×1 + "sóng EPERM
  đã tắt" ×3), o8-177t8.log ("sóng EPERM đã tắt" ×3) — **TẤT CẢ
  là trích dẫn trong log phân tích đợt 177, 0 sóng thật.**
  Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events` + `runtime.requests` +
  `scheduler.terminal_signals` + `scheduler.delivery_outbox`);
  `muse.db` từ chối `to_timestamp` — dùng literal
  `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)`. Mọi số (m)/INSIDE đều có
  trong script đối chiếu độc lập `m-check178.py` (log
  `m-check178.txt`). Lưu ý: `events.run_id`/`job_runs.run_id`
  là UUID ĐẦY ĐỦ — tra bằng short id trả 0 dòng (bẫy đã gặp).
- INSIDE tính bằng `m-check178.py` (log `m-check178.txt`);
  FULL134/FULL135/FULL136 p10/p90 khớp T2-176/T2-177 bằng assert
  trong script. **SỬA LỖI NEO #90 (F-178-T2-1):** m-check178 dùng
  neo đúng #(k−1) cho mọi dải (FULL136 neo #89, FULL137 neo #90,
  FULL138 neo #91); m-check177 đã dùng neo #88 cho FULL136.
- Boot_est #92 của T0-178 (+0,396 s, ×3 chênh <0,01 s) dùng cho
  (m) #92; **KHÔNG CÓ boot_est #91** — không suy ra từ boot khác.
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness TRỪ
  exec-log T2-177 (ec756e29 — output m-check177 trích btime,
  witness GIẢ #88/#89/#90) + TRỪ mọi log chứa marker T2
  ("m-check17", "FULL13", "round178-t2") (F-178-T2-4); kiểm
  `grep ^W =` / `grep ^hi =` trước khi chạy hole-recheck; output
  vào thư mục riêng, không ghi đè file cũ (F-166-T2-2); kiểm
  epoch GAP bằng `date -d` trước khi chạy sessions; chụp meminfo
  cùng lệnh probe (F-172-T7-2-7). **Chờ T4 đóng attempt + poller
  thoát hẳn rồi mới chạy script nặng** (F-176-T2-11).
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-178-T2-*)

- **F-178-T2-1 — Lỗi neo m-check177 cho INSIDE #90 (SỬA Ở ĐỢT
  NÀY).** m-check177.py dùng neo 05:04:17Z (#88) cho dải FULL136
  thay vì 05:26:26Z (#89) theo F-165-T2-1. Kiểm lại neo đúng:
  TRUE (biên 4.672 s / 2.544 s) — verdict #90 KHÔNG ĐỔI. Lỗi
  không đổi verdict nào đã chốt.
- **F-178-T2-2 — (m) #91 ÂM ở cấp T2, parent quyết cuối; caveat
  phân số KHÔNG PHÂN ĐỊNH ĐƯỢC.** Offset btime 50,157 s, ngoài
  0,357 s; offset thật ∈ (49,157 s, 50,157 s]; DƯƠNG ⟺ δ ≥ 0,357 s;
  không có boot_est #91; prior δ #90 (+0,32 s) → ngoài 0,037 s,
  prior δ #92 (+0,396 s) → trong 0,04 s. Hai prior trái chiều —
  dữ liệu hiện có không phân định được. Theo quy ước đứng:
  ÂM. **Caveat overlap +15/+17 s (lớn nhất chuỗi):** lấy theo
  nghĩa đen sẽ lật thành DƯƠNG — tiền lệ #87/#90 cấm lật bằng
  overlap (áp dụng đối xứng).
- **F-178-T2-3 — INSIDE #91/#92 TRUE nhưng hai dải MÂU THUẪN
  ngược hướng lần thứ 6 và 7.** FULL137/FULL138 TRUE (biên trên
  1.748 s / 1.944 s); cross-check FALSE (trễ 4.487 s / 5.079 s).
  T2 áp dụng kỷ luật F-165-T2-1 (dải phương pháp chi phối), như
  tiền lệ #79/#82/#83/#85/#86/#87/#88/#89. Chuỗi 2 → 3 phụ thuộc
  kỷ luật này; nếu parent không đồng ý, chuỗi theo dải cũ vẫn
  đứt từ #89 — parent quyết.
- **F-178-T2-4 — Witness: loại trừ mới.** Ngoài dir agent T2-177,
  T2-178 loại trừ mọi exec-log chứa marker T2 ("m-check17",
  "FULL13", "round178-t2") vì output phân tích trích btime sẽ
  witness giả. Mọi witness đếm được đều kiểm tay từng file.
- **F-178-T2-5 — (m) #92 ÂM, KHÔNG sát biên.** Offset 459,816 s,
  ngoài 410,016 s; boot_est T0-178 (+0,396 s) không đổi verdict.
  Requeue muộn bất thường (F-178-T0-4) — ghi nhận, không suy ra.
- **F-178-T2-6 — (m) #56: 5 hướng DB mới đều âm tính/rỗng (lần
  thứ 21 không thu hẹp).** Tổng 77 hướng. (xxv)/(xxvi) là 2 bảng
  chưa từng tra cho #56 — mỗi bảng đúng 1 dòng, đều ở 20:19:34Z.
- **F-178-T2-7 — Run 177 SUCCEEDED 11:09:57Z (số liệu; kết cục
  thuộc T7-178).** Wall gốc 9.246 s, trước hạn 1.554 s,
  claimed→finished 7 s (KHÔNG phải ca ≥60 s — số ca GIỮ 9).
  Run 178 (đợt này): T0-178 ghi jitter 0 s; kết cục thuộc T7-179.
- **F-178-T2-8 — Tuân thủ luật script nặng: 1 chồng chéo KHÔNG
  CHỦ Ý (xem §4.2).** Poller T4-178 chờ gateA RAM ≥1024 MB
  (quyết đợt 132, không hạ) — RAMavail ~400–800 MB suốt thời
  gian chờ (Balloon ~6,44 GB kẹt); poller CHẾT THEO REBOOT #93
  (~13:07:35Z), attempt1 (poller gốc) KHÔNG BAO GIỜ MỞ; T4 khởi
  động lại tay 13:09:15Z, walk T2 (13:09:50–13:11:33Z) chồng
  pha setup của attempt1 sau #93 nhưng kết thúc trước khi đo
  (13:12:20Z); attempt vẫn PASS. Parent quyết có tính vi phạm.
- **F-178-T2-9 — Mù: #96? VẪN MỞ; hole-recheck lần 22 NEW=0 mọi
  hố.** R file 1.238 s lần thứ 14 không đổi; H-E1-88 337 hit,
  0 mới (lần thứ 22 liên tiếp). **U file-gap max TĂNG 2.852 →
  3.530 s do pruning 5 exec-log làm cầu nối** (10:02:45Z,
  10:08:01Z, 10:28:06Z, 10:33:43Z, 10:53:31Z 22/11 — cả 5 đã
  xác nhận GONE; 2 thư mục exec-logs b67c016f/df7c550a trống)
  — không phải mốc mới. Witness #78: 9 → 7 do pruning 2 log
  (proc_7e7f36045583 + proc_6b03cdc0bb27, df7c550a). U union-B
  1.118 s, cách sàn 29 s — KHÔNG ĐỔI. #91/#92: 0 hoạt động thật
  (witness thô 4/3 → thật 2/2 sau khi trừ 2 file trích dẫn
  đã kiểm tay). CERT/FULL GIỮ 76/91.
- **F-178-T2-10 — Lỗi loại trừ sessions-script (SỬA Ở ĐỢT NÀY,
  không đổi verdict).** `blind9696-sessions.py` sao từ đợt 177
  vẫn loại trừ dir agent T2-175 (b548b200) thay vì T2-177/T2-178:
  lần chạy đầu đợt 178, log hole-recheck của T2-177
  (proc_4c78bfdedd3e, trích biên hố 19:32:59Z 20/11–09:10:48Z
  23/11) làm MỌI đếm #64–#86 tăng đúng +1. Đã sửa script
  (loại trừ ec756e29 + b387ac70) và chạy lại: đếm = đúng đợt 177
  trừ #78 (9 → 7, do pruning thật). Bài học: cập nhật
  MY_AGENT_DIR mỗi đợt.
- **F-178-T2-11 — Reboot #93 TRONG phiên T2-178 (bàn giao cho
  T2-179, KHÔNG phân loại ở đây).** Btime #93 = 1795439255 =
  13:07:35Z, boot 97054ac6, gap #92→#93 = 7.568 s. Poll cuối
  T4-178 (#118, 13:07:43Z đồng hồ boot cũ) = btime +8 s biểu
  kiến (cùng họ #91). Watcher-178 dòng cuối 13:07:57Z boot
  985bc2a3 = btime +22 s biểu kiến (file mtime 13:07:57.22Z).
  Run 178 đã viết lại tại #93 (started_at_utc 1795439291 =
  13:08:11Z = btime +36 s; boot_gen đổi dcf769fa →
  cron_boot_92e3cfb8... — số lần viết lại chính xác thuộc
  T2-179 kiểm từ events). (m) #93 + INSIDE #93 thuộc T2-179
  (cửa hẹp khép 13:26:35Z); T2-178 chỉ ghi số thô.

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 178)

- **(a) (m) #91 ÂM — chấp nhận?** (requeue +50,157 s, vượt biên
  TRÊN 0,357 s; 1 run sống; DƯƠNG ⟺ δ ≥ 0,357 s, không có
  boot_est #91 — prior δ #90 → ngoài 0,037 s, prior δ #92 →
  trong 0,04 s; overlap +15/+17 s lớn nhất chuỗi, không lật
  verdict theo tiền lệ #87/#90.) Nếu chấp nhận: n ứng viên
  GIỮ 36/37.
- **(b) (m) #92 ÂM — chấp nhận?** (requeue +459,816 s, ngoài
  410,016 s; 1 run sống; boot_est T0-178 +0,396 s không đổi
  verdict; requeue muộn bất thường F-178-T0-4.) n ứng viên GIỮ
  36/37.
- **(c) INSIDE #91 TRUE — chấp nhận chuỗi 1 → 2?** (FULL137;
  hai dải mâu thuẫn ngược hướng lần thứ 6; dải phương pháp chi
  phối theo F-165-T2-1.)
- **(d) INSIDE #92 TRUE — chấp nhận chuỗi 2 → 3?** (FULL138;
  hai dải mâu thuẫn ngược hướng lần thứ 7; dải phương pháp chi
  phối.)
- **(e) INSIDE #90 kiểm lại neo đúng (#89) vẫn TRUE — ghi nhận
  sửa lỗi neo m-check177?** (verdict #90 không đổi.)
- **(f) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R file 1.238 s lần
  thứ 14 không đổi; hole-recheck lần 22 NEW=0 mọi hố; U file-gap
  max TĂNG 2.852 → 3.530 s do pruning 5 exec-log — không phải
  mốc mới.)
- **(g) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 22:
  H-E1-88 inside=337, NEW=0 — lần thứ 22 liên tiếp 0 mới;
  #95?/#94?/#77? cũng MỞ; CERT/FULL GIỮ 76/91.)
- **(h) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều kiện?**
  (lần thứ 21 không thu hẹp; 5 hướng DB mới đều âm tính/rỗng,
  tổng 77 hướng.) n chính thức GIỮ 14.
- **(i) Tuân thủ luật script nặng đợt 178 — 1 chồng chéo KHÔNG
  CHỦ Ý (xem §4.2): parent quyết có tính là vi phạm không?**
  (Walk 13:09:50–13:11:33Z chồng pha setup attempt1 sau #93 của
  T4 (13:09:15Z), kết thúc trước khi đo (13:12:20Z); attempt
  PASS 20/20 + B 5/5.)
- **(j) EPERM probe #96 + sweep #96 — ghi nhận?** (Probe ok=2
  fail=0, boot 985bc2a3; sweep: 156 *.log, 3 file có marker
  (10 lần) — TẤT CẢ trích dẫn trong log đợt 177, 0 sóng thật.)
- **(k) Run 177 SUCCEEDED 11:09:57Z (trước hạn 1.554 s, cf 7 s —
  KHÔNG phải ca ≥60 s, thuộc T7-178) — ghi nhận cho T7-178?**
  (Không phải verdict của T2.)
- **(l) T0-178: #92 XÁC NHẬN 9 nguồn; #91 XÁC NHẬN (qua T7/T4/DB);
  marker 44 reboot; boot_est #92 +0,396 s; POSTBOOT_PASS #92 CÓ;
  O8 trên #92 PASS 3/3 — ghi nhận?** (Thuộc T0/T5/T8-178.)
