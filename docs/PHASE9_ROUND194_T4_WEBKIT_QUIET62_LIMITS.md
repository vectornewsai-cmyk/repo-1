# PHASE9_ROUND194_T4_WEBKIT_QUIET62_LIMITS.md

**Đợt:** 194. **Luồng:** T4 — đo lượt yên WebKit #62 trên 1 boot
+ **#62 KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt hợp lệ (chuỗi lượt yên hợp
  lệ GIỮ 0 — đã ĐỨT ở #60, không có lượt hợp lệ mới).** Attempt3 gần
  nhất: 20/20 + lớp B ĐẠT 5/5 nhưng tickCost median 61,0 ms > 60
  (thiếu 1,0 ms — đúng bằng mức thiếu của attempt2-193).
+ **BOOT ĐO: MỘT boot — 55c9e0b7 (btime 02:28:08Z; SỐ HIỆU #119 ỨNG
  VIÊN — T01-194 xác minh 9 nguồn tươi, parent quyết (e)). 0 reboot
  TRONG phiên đo; boot mới xảy ra TRƯỚC khi đợt mở ~7 phút.**
+ **P3' CỘNG DỒN KHÔNG ĐỔI (50 lượt hợp lệ): P1 223/227, P2 218/218,
  P3-A1 192/227, P3' 187/199 occurrence = 142/145 distinct-seq, P7
  121/121.** Sổ distinct-seq GIỮ NGUYÊN as-of-191, md5 `b7ed5791`
  (không thăng cấp — không lượt hợp lệ mới, không seq mới).
+ **Labellag (b) — CHUỖI TRƯỚC #62 = 0 (ghi rõ theo quyết (m)-192):
  tính theo LƯỢT HỢP LỆ, không theo attempt.** Attempt1 có 4 occ /
  1 event (b) nhưng attempt KHÔNG hợp lệ nên chuỗi GIỮ 0; attempt2/3
  0 occ / 0 event.
+ **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 13: KHÔNG THỂ KIỂM** (xem §3,
  F-194-T4-6): áp ĐÚNG định nghĩa (p)-192 — live-check CHỈ đối chiếu
  trên cửa sổ attempt HỢP LỆ; #62 không có cửa sổ hợp lệ nào. Chuỗi
  live ĐẠT GIỮ 9.
+ **B2 DỮ KIỆN THỨ 6 — LẪN LỘN, CHỈ BÁO SỐ** (xem §3, F-194-T4-5):
  attempt1 lạ-tải nặng (load1_max 15,11, 68 spike); attempt2 tự-tải
  là chính (đỉnh spike: probe chiếm ~77% CPU); attempt3 sạch (0 spike).
  Lần lẫn lộn thứ 3 liên tiếp. T4 KHÔNG tự đổi luật KHÔNG TÁCH.
+ **FULL PASS: KHÔNG THỂ — chuỗi GIỮ 0.** Chân (b) gãy (lượt yên #62
  0 hợp lệ); gate (a) #119 CÓ cờ (T56, repair-sớm, poll=1); O8 T01
  3/3 theo NOTES.md (T01 chưa đóng cờ lúc T4 đóng); harness T8 CHƯA
  CÓ (dir round194-t8 trống lúc T4 đóng); live-check #13 KHÔNG THỂ
  KIỂM.
**Ngày:** 26/11/2026 (lượt cron 09:35 +07 26/11 = 02:35:51Z).
**Boot đo:** 55c9e0b7 (52 poll: 2 test + 50 poller).

## 0. Verdict tổng

- **#62 KHÔNG CÓ LƯỢT HỢP LỆ — ngân sách 3/3 đã dùng.** Attempt1:
  20/20 NHƯNG B1+B2 VI PHẠM (load1_max 15,11; load5 cuối 5,89) +
  tickCost median 220,0 ms. Attempt2: 20/20 NHƯNG B1+B2 VI PHẠM
  (load1_max 5,64; load5 cuối 2,87) + tickCost median 75,0 ms.
  Attempt3: 20/20 + lớp B ĐẠT 5/5 NHƯNG tickCost median **61,0 ms
  > 60 — KHÔNG hợp lệ, thiếu 1,0 ms**. **Chuỗi lượt yên hợp lệ: GIỮ 0
  (đã ĐỨT ở #60; ĐỀ XUẤT — parent quyết cuối).**
- **Chân lượt yên cho chuỗi FULL PASS: KHÔNG có đợt này** (0 lượt
  hợp lệ #62) — FULL PASS không thể lên 1 từ chân này; parent quyết
  cuối.
- **(c2) = 0 seq ở cả 3 attempt** — P1/P3-A1/P7 KHÔNG tính được;
  **P3' 0 đóng góp. Labellag (b): attempt1 4 occ / 1 event** (seq
  183–185, lag max +10f — KHÔNG tính vì attempt không hợp lệ);
  **attempt2/3: 0 occurrence / 0 event** (max 4f).
- **0 VI PHẠM PHÍA T4** (không khởi động script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; check-only postboot
  mỗi 4 poll là dự phòng được quyết, không phải vi phạm; xem §3).
  T56-194 xác nhận **0 chồng pha (b) với T4** (F-194-T56-4 chồng
  ~48 s là với t01, KHÔNG phải T4 — parent quyết).
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `591f9655` (đổi 3
  md5 trong phiên 03:01:52–03:05:49Z, xem F-194-T4-1; ổn định từ poll
  #15).
- **Cờ:** `hidden_files/round194-t4.done` viết lúc đóng, CÓ NỘI
  DUNG, trong hạn cờ ~05:00Z. **Boot lúc viết cờ là 55c9e0b7 — CÙNG
  boot đo.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (02:46–02:48Z),
ghi vào `hidden_files/round194-t4/preflight-194.txt` — **PASS
PHẦN TĨNH** (1 chuỗi stale bắt được ở lần grep thứ 2 + sửa trước
pre-flight; tree-md5 cập nhật 1 lần — xem F-194-T4-1). Tóm tắt:

- **md5 khớp hệt bản đợt 193:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-191 md5 `b7ed5791…`
  (occ 187/199, distinct 142/145, valid_rounds_p3 38, non_dat
  [260, 364, 498]). **Tree:** preview.tsx lúc mở poller là
  `cf331628` (đọc trực tiếp 02:46Z; tree-md5.txt ghi đúng).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; Playwright-core có mặt (webkit
  object, import tuyệt đối từ `~/scratch-round63-r4/node_modules/
  playwright-core/index.mjs`); media `stripes-nonperiodic.mp4`
  có mặt (140.828 B); không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-26
  04:30:00 UTC` → **1795667400** = 04:30Z (hạn cờ ~05:00Z =
  1795669200, hạn cứng 05:35:51Z = 1795671351); grep lần 2 sạch
  (chỉ còn hit `round193-t56/` + glob `round193-*` CỐ Ý);
  sửa 1 chuỗi stale: comment gate0 trong `poll-wait-t4-194.sh`
  (`round193-t56/round192-t56/` → `round194-t56/round193-t56/`)
  — xem F-194-T4-1.
- **Copy-forward 193 → 194 (script python thay thế có neo,
  KHÔNG sed global):** deadline `22:30Z 25/11` → `04:30Z 26/11`;
  hạn cờ/cứng → `05:00Z`/`05:35Z`; T5FLAG chính `round194-t56/` +
  fallback `round193-t56/` (FIX F-192-T56-1); `T4-193a` →
  `T4-194a`; `default=193` → `default=194`;
  `WebKit #61` → `#62`; glob `round192-*` → `round193-*`.
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 193).
- **Freeze check (F-164-T4-1):** `round193-t4` còn **0 file
  làm việc** mtime ≥ 02:35:51Z (1 file duy nhất là
  `round194-t4-copy.py` do chính T4-194 viết 02:47Z — không
  phải file đợt 193 bị sửa).
- **GATE0 LÚC MỞ: CHƯA ĐẠT.** round194-t56/ chưa tồn tại
  (T56-194 chưa khởi động lúc 02:48Z); fallback round193-t56/
  POSTBOOT_PASS mtime 20:59:08Z 25/11 < btime 02:28:08Z nên
  poller đánh "cu(mtime-cu)", KHÔNG TÍNH — đúng thiết kế chống cờ
  sai boot. **Check-only postboot chạy tay exit=1 FAIL**
  (libs thiếu: libevent/libEGL/libavif/libdw/libevdev; GST dir
  không tồn tại; apt 11 gói chưa cài — xem
  `preflight-postboot-194.log`). Replay hệ thống CHƯA XONG
  trên boot mới (boot ~20' tuổi lúc mở); 0 process apt/dpkg
  lúc kiểm. Gate0 dự phòng T4-check-only sẽ đạt khi replay
  heal — poller chờ (mẫu #115/#116).
- **dpkg.log CHỈ CÒN 2 DÒNG** (reset theo rootfs rebuild lúc
  boot mới; bản cũ 777 dòng ĐÃ MẤT, không có dpkg.log.1;
  /var/log/apt/ KHÔNG TỒN TẠI) — xem F-194-T4-2.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (02:48:18Z): RAM 1115 MB, load1 2,99/load5 1,73;
  lần 2: RAM 1123 MB; cả 2 gate0=khong-dat,
  t5flag=cu(mtime-cu), postboot_exit=1, apt=0, dpkg 2,
  blockers comm-based=0, tree=YES cf331628. Cửa chưa mở vì
  load1 >2 VÀ gate0 chưa đạt — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~1115–1166 MB avail; load1 ~3,0–3,4 lúc mở.**
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 52 poll thật (2 test + 50), 3 lần cửa mở, 0 reboot trong phiên

- **Test (POLL_TEST=1), 2 poll, boot 55c9e0b7
  (02:48:18Z, 02:48:19Z):** cả 2 đều gate0=khong-dat,
  load1 ~3,0, load5 ~1,7, RAM 1115/1123 MB, lock=khong,
  blockers comm-based=0, apt=0, dpkg 2 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-194.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 55c9e0b7, 50 poll
  (02:48:52Z–03:36:51Z), 3 lần cửa mở:** RAM ≥1024:
  41/50 (min 254, max 2563 MB); 500–1023: 8/50;
  **<500: 1/50** (poll #6, 254 MB — xem F-194-T4-9);
  load1<2: 26/50; load5<2: 10/50; gate0:
  **T5 47/50**, khong-dat 3/50; lock=co 7, khong 43;
  blockers>0: 10 poll; apt>0: 2 poll; dpkg 2 → 777
  (replay cài dần).
- **Giai đoạn 1 — replay chưa xong (poll #1–#3,
  02:48:52–02:50:22Z):** postboot_exit=1, apt=1 (apt-get đang
  chạy); load1 1,77–1,87, load5 1,57–1,71; RAM tụt 980 → 770 MB.
  Cửa KHÔNG MỞ. dpkg.log 2 dòng suốt giai đoạn này.
  **T5FLAG LẬT PASS ở poll #4** (T56 ghi POSTBOOT_PASS
  02:50:55Z — xem §4). **Check-only của T4 PASS từ poll #5.**
- **Giai đoạn 2 — gate0 đạt, chờ load/RAM (poll #4–#7,
  02:51:07–02:53:24Z):** gate0=T5 + check-only exit=0; RAM
  772 → 254 → 949 MB; load1 1,60–2,29. Cửa KHÔNG MỞ.
- **Giai đoạn 3 — cửa mở lần 1 (poll #8, 02:54:10Z):** RAM
  1925 MB, load1 1,89, load5 1,81 → **CỬA YÊN MỞ**, attempt1
  chạy ngay (xem §2).
- **Giai đoạn 4 — cây churn 3 md5 (poll #9–#21,
  03:01:51–03:11:00Z):** preview.tsx cf331628 → 78aba7bc (#9)
  → 98392fa6 (#10–#14, 5 poll) → 591f9655 (#15–#21, 7 poll);
  T4 cập nhật tree-md5.txt → `591f9655` lúc 03:11:32Z sau 7 poll
  ổn định (xem F-194-T4-1); poll #22 trở đi tree=YES.
  Trong giai đoạn này load5 2,04–5,81 (đỉnh 7,31/5,81 ở #15).
  Cửa KHÔNG MỞ.
- **Giai đoạn 5 — T01 giữ lock + tải cao (poll #23–#31,
  03:12:30–03:18:43Z):** T01 giữ lock (thread=t01-round194,
  pid 128040, port 5560) + blockers 5 ở #24/#27 (O8 T01);
  load1 tới 12,43 (#26). Cửa KHÔNG MỞ. T01 nhả lock ở #30
  (03:17:58Z).
- **Giai đoạn 6 — load5 hạ dần (poll #32–#44,
  03:19:29–03:28:37Z):** load1 0,76–4,50, load5 2,11–3,86.
  Cửa KHÔNG MỞ (load5 vẫn >2).
- **Giai đoạn 7 — cửa mở lần 2 + 3 (poll #45, #50):** #45
  (03:29:22Z) RAM 1516 MB, load1 0,76, load5 1,85 → **CỬA MỞ**,
  attempt2 chạy; #50 (03:36:51Z) RAM 1906 MB, load1 0,64,
  load5 1,82 → **CỬA MỞ NGAY** sau attempt2, attempt3 chạy
  (quyết (h) đợt 149: poll lại gate trước mỗi attempt — cả 2
  lần đều qua poll mới).
- **0 reboot trong phiên đo.** Poller thoát 03:41:10Z sau
  attempt3 (hết ngân sách 3/3, không có lượt hợp lệ, exit 11).
- **Phân rã 52 poll thật:** RAM≥1024: 43/52; RAM<500:
  **1/52**. load1<2: 26/52; load5<2: 12/52.
  **"gan-mo" đếm 3 = 3 lần mở cửa thật** (#8, #45, #50).
  gate0: T5=47, khong-dat=3 (+2 test). blockers>0: 10 poll
  (lúc T01 giữ lock + 2 poll lẻ). apt>0: 2 poll (giai đoạn replay).

## 2. Attempts — 3 attempt (ngân sách dùng 3/3), 0 lượt hợp lệ

- **attempt1-55c9e0b7: 20/20 NHƯNG B1+B2 VI PHẠM + tickCost median
  220,0 ms — KHÔNG HỢP LỆ.** Cửa sổ: marker 02:54:11Z →
  attempt-done 03:00:46Z (probe_exit=0; run-attempt exit=0
  03:00:46Z). JSON 1.766.210 B; flip wallMs 93.625 ms; lock vite
  giữ ~6m34s (hold 394 s — dài nhất gần đây, xem F-194-T56-7),
  nhả 03:00:46Z; vite :5187 kill sạch (curl 000); sampler dừng
  sạch (175 dòng). **0 writePartial TIMEOUT** (không wedged —
  20/20 partial save đều OK, pass cuối 02:58:47Z; chậm do tải,
  không phải kênh evaluate chết).
  **tickCost:** tổng n=251 median **220,0** p90 394,0 max 716
  min 84; hậu flip+2000ms n=191 median 210,0. Theo dải
  wallMs median 342,5 (32–45k) rồi 167–327 cả lượt — CAO ĐỀU
  (pass 1–5 median 280–327,5; pass 13–20 median 167–283).
  **Lớp B: B1 VI PHẠM** (load5 cuối 5,89); **B2 VI PHẠM
  (load1_max 15,11 — cao nhất kể từ đợt 192)**; B3 ĐẠT; B4 ĐẠT
  (dpkg delta 0); **B5 ĐẠT (RAM min 877 MB, 0 mẫu <500;
  15/174 mẫu <1024)**.
  **(c2) = 0 seq** → P1/P3-A1/P7 KHÔNG tính được;
  **P3' 0 đóng góp. Labellag (b): skippedLatest=1: 0 occurrence
  ≥5f** (n=142, max 1f); **skippedLatest=0: 4 occurrence / 1 event**
  (seq 183–185, M=[38], tBlend 231608–232513, lag max +10f) —
  **KHÔNG tính vào chuỗi** (attempt không hợp lệ).
  **Perpass (20 pass):** median 291/301/327,5/317/280/209/286/
  222/190/215/212/201,5/167,5/204/202/283/257/207/216,5/219;
  r(median~load1) = +0,01; r(median~RAM) = −0,08 (load1 là
  trung bình 1 phút nên biến thiên chậm — không kết luận nhân
  quả từ 1 lượt).
- **attempt2-55c9e0b7: 20/20 NHƯNG B1+B2 VI PHẠM + tickCost median
  75,0 ms — KHÔNG HỢP LỆ.** Cửa sổ: marker 03:29:23Z →
  attempt-done 03:33:20Z (probe_exit=0; run-attempt exit=0
  03:33:20Z). JSON 2.496.943 B; flip wallMs 40.157 ms; lock vite
  giữ ~3m57s (hold 237 s), nhả 03:33:20Z; vite :5187 kill sạch
  (curl 000); sampler dừng sạch (112 dòng). **0 writePartial
  TIMEOUT.**
  **tickCost:** tổng n=431 median **75,0** p90 112,0 max 240
  min 31; hậu flip+2000ms n=336 median 65,0. Theo dải wallMs
  median 99–105 đầu lượt (pass 1–7) rồi 39–68 cuối (pass 14–20)
  — CAO ĐẦU, HẠ CUỐI trong khi load1 leo 0,94 → 5,64 rồi hạ —
  median KHÔNG theo tải (r=−0,82).
  **Lớp B: B1 VI PHẠM** (load5 cuối 2,87); **B2 VI PHẠM
  (load1_max 5,64)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 632 MB, 0 mẫu <500; 42/111 mẫu <1024)**.
  **(c2) = 0 seq** → P1/P3-A1/P7 KHÔNG tính được;
  **P3' 0 đóng góp. Labellag (b): 0 occurrence / 0 event**
  (skippedLatest=1: n=146, max 4f; skippedLatest=0: n=386,
  max 4f; ≥5f: 0). **Perpass:** median 99/102/97/102/102/97/
  105/65/57/63/74/62/58/40/39/62,5/62/68/55,5/94;
  r(median~load1) = −0,82; r(median~RAM) = −0,65 (âm mạnh —
  median cao lúc RAM thấp ~900 MB đầu lượt, hạ khi RAM hồi
  ~1000 MB cuối lượt).
- **attempt3-55c9e0b7: 20/20 + LỚP B ĐẠT 5/5 NHƯNG tickCost median
  61,0 ms > 60 — KHÔNG HỢP LỆ (thiếu 1,0 ms).** Cửa sổ: marker
  03:36:52Z → attempt-done 03:40:34Z (probe_exit=0;
  run-attempt exit=0 03:40:34Z). JSON 2.822.661 B; flip wallMs
  31.602 ms; lock vite giữ ~3m42s (hold 222 s), nhả 03:40:34Z;
  vite :5187 kill sạch (curl 000); sampler dừng sạch (105 dòng).
  **0 writePartial TIMEOUT.**
  **tickCost:** tổng n=510 median **61,0** p90 89,0 max 138
  min 31; hậu flip+2000ms n=371 median 60,0. Theo dải wallMs
  median 61,0 → 63,0 → 65,0 — PHẲNG QUANH NGƯỠNG (pass 1–20
  median 51,5–68,0; 13/20 pass ≥60,0) trong khi load1 chỉ
  1,28–2,99 và RAM 733–1832 MB — median KHÔNG theo tải
  (r=−0,11).
  **Lớp B ĐẠT 5/5: B1 ĐẠT** (load5 cuối 1,62); **B2 ĐẠT
  (load1_max 2,99)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 733 MB, 0 mẫu <500; 33/104 mẫu <1024)**.
  **(c2) = 0 seq** → P1/P3-A1/P7 KHÔNG tính được;
  **P3' 0 đóng góp. Labellag (b): 0 occurrence / 0 event**
  (skippedLatest=1: n=136, max 3f; skippedLatest=0: n=472,
  max 4f; ≥5f: 0). **Perpass:** median 58/64/59/61,5/64,5/65/
  65/63,5/65/56,5/60/51,5/68/59/62/60/59/64/55/53,5;
  r(median~load1) = −0,11; r(median~RAM) = +0,18.
  **F6' ĐÓNG LẠI:** skippedLatest=1 hậu flip+2000ms n=68 tick
  (cần ≥30): nhãn 100,0%, pixel-verified 100,0%, 0 tick vi
  phạm thật.
- **Không attempt nào bị reboot giết; ngân sách 3/3 đã hết.**
  Poller thoát 03:41:10Z (exit 11 — hết ngân sách, không có
  lượt hợp lệ).

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN THỨ 6 CHO QUYẾT TÁCH: LẪN LỘN**
  (xem F-194-T4-5). Ba attempt cho ba bức tranh khác nhau:
  **Attempt1: LẠ-TẢI NẶNG** — load1_max **15,11** (B2 VI PHẠM);
  **68 spike trong cửa sổ** (02:54:11–03:00:46Z). Đỉnh 15,11 lúc
  02:57:00Z: MainThread 23,0% + WebKitWebProcess 21,2% + chrome
  lạ 17,8% + hatch 11,3% — probe chỉ ~44% top CPU, còn lại là
  tải lạ; spike sớm 02:55:02Z load1 8,32: `npm exec tsc` lạ
  (MainThread 25,8%, PID 37055) + chrome lạ 13,3%. Trong cửa sổ:
  T01 recount (PID 8115, python crosscheck nặng) + P4 `npx tsc`
  + parity194-run (PID 27502) + P1 chrome headless
  (vf194-chrome-xilK7P) — đều là process lạ, không có trong
  ps-before/after của chính T4.
  **Attempt2: TỰ-TẢI LÀ CHÍNH** — load1_max **5,64** (B2 VI
  PHẠM); **37 spike trong cửa sổ** (03:29:23–03:33:20Z), thành
  cao nguyên liên tục 3,62 → 5,64 (03:29:40–03:31:12Z). Đỉnh
  5,64 lúc 03:30:47Z thuần tự-tải tại thời điểm đó
  (WebKitWebProcess 53,9% + MiniBrowser 23,0% = 76,9% top CPU;
  hatch 20,1%); spike đầu 03:29:40Z cũng vậy (WebKit 27,0% +
  MainThread 20,8% + MiniBrowser 17,3%). Chrome lạ
  (vf194-chrome-xilK7P) có mặt trước/sau attempt nhưng KHÔNG
  vào top-5 CPU ở bất kỳ spike nào đã kiểm. RAM min 632 MB,
  42/111 mẫu <1024 MB — RAM thấp là rào chắn phụ (xem F-194-T4-9).
  **Attempt3: SẠCH** — load1_max **2,99** (B2 ĐẠT);
  **0 spike trong cửa sổ** (T9); r=−0,11 (âm). **T4 chỉ báo
  số:** dữ kiện thứ 6 lẫn lộn như dữ kiện thứ 4/thứ 5; luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CẢ 3 CỬA SỔ ATTEMPT,
  0 FIRE.** Live `dry_run=False guard=6291456 consec=2`
  (T9-194; quyết (o) đợt 188: BẬT LIVE từ đợt 189). Mẫu
  autotrigger trong cửa sổ: W1 7 mẫu 02:54:11–03:00:11Z,
  W2 4 mẫu 03:30:12–03:33:12Z, W3 4 mẫu 03:37:12–03:39:12Z
  — **trigger=watch, consec=0 ở tất cả các mẫu: 0 FIRE /
  0 WOULD-FIRE / 0 MISSED-WINDOW.** `b2-spikes.log` 0 hit
  FIRE (T9-194 phán cuối). Balloon theo autotrigger: W1
  3,03–4,36 GB; W2 4,02–4,22 GB; W3 4,24–4,57 GB.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 13: KHÔNG THỂ KIỂM
  (F-194-T4-6).** Áp ĐÚNG định nghĩa (p)-192: live-check CHỈ
  đối chiếu trên cửa sổ attempt HỢP LỆ — #62 không có cửa
  sổ hợp lệ nào nên KHÔNG THỂ KIỂM; chuỗi live ĐẠT GIỮ 9.
  Dữ kiện ghi nhận (không dùng làm verdict): W1 marker
  02:54:11Z → done 03:00:46Z; W2 03:29:23Z → 03:33:20Z;
  W3 03:36:52Z → 03:40:34Z. Mtime sớm nhất của analyzer +
  classb mỗi attempt đều SAU attempt-done (classb +0,4 /
  +0,4 / +0,3 s). **0 file analyzer ghi trong cửa sổ
  attempt.** File skiplatest mặc định mtime vẫn 2026-11-23
  18:13:20Z — 0 ghi mới. Live 0 FIRE trong cả 3 cửa sổ
  (15 mẫu). T9 B2 spikes (chỉ ghi nhận): W1 68 / W2 37 /
  W3 0.
- **O8 T01 TRÊN BOOT 55c9e0b7 — lock polls #23–#29** (giữ
  lock 03:12:27–03:17:31Z, blockers 5; T56-194 §6 xác nhận
  O8 T01 21/21 ×2 WebKit + Chromium — xem NOTES.md T01-194;
  T01 chưa đóng cờ lúc T4 đóng, T10 xác minh cuối). O8 T8 +
  harness thuộc T8-194 báo cáo (dir round194-t8 TRỐNG lúc
  T4 đóng 03:41Z — T8 chưa chạy/chưa ghi).
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (brief đợt 192
  yêu cầu; kiểm file round194-* mtime trong cửa sổ, loại
  round194-t4):**
  **W1 (02:54:11–03:00:46Z, 10 file):** (a) P1
  `chrome-2026-11-26T02-54-38-973Z.json` + `sample-tel-pitch7-
  preview.wav` 02:59:04Z; (b) T56 ghi `t7-control-a194.sh` +
  `t7-gate-monitor-194.sh` 02:57:20Z (chỉ ghi file, monitor
  chạy sau — xem dưới); (c) T01 ghi `o8-driver-194t01.sh` +
  `o8-s1-probe-194t01.mjs` 02:57:47Z; (d) T7 ghi `appendix194.py`
  + `appendix194.txt` 02:59:38Z; (e) T01 ghi `crosscheck-194-
  t01.sh` 03:00:06Z; (f) T9 `b2-spikes.log` appends liên tục
  (giám sát, nhẹ). **Tải NẶNG trong cửa sổ:** T01 recount
  (PID 8115) + P4 tsc/parity (PID 27502) + P1 chrome — xem §3
  B2. T4 ghi nhận sự kiện, KHÔNG tự phán vi phạm — giao T2
  phán theo quy tắc đứng.
  **W2 (03:29:23–03:33:20Z, 5 file):** (a) P3 `ab-dense-194.log`
  + `audio-probe-194-chirp-10s.json` 03:31:35Z; (b) T9
  `b2-spikes.log` appends (giám sát, nhẹ); (c) `round194-p3.done`
  03:32:51Z; (d) T9 `headroom-log.txt` 03:33:16Z.
  **W3 (03:36:52–03:40:34Z, 1 file):** (a) `round194-p4.done`
  03:39:37Z — cửa sổ sạch nhất đợt này.
  **0 file round193-* nào bị sửa trong cả 3 cửa sổ** (check
  glob đợt trước trong t4-attempt-inner.sh — các luồng đợt 194
  ghi vào round194-*, không ghi round193-*).
- **T56 HARNESS — 0 CHỒNG PHA (b) VỚI T4 (xem F-194-T4-7).**
  T56-194 LIMITS §6: suite 6 lần 03:02–03:05Z (SAU khi attempt1
  nhả lock 03:00:46Z); harness 120 lần, 4 chunk 03:05:44–
  03:13:15Z (SAU attempt1, TRƯỚC W2/W3); monitor 10 s/chu kỳ
  (sửa F-193-T56-3), 0 lần kill chunk. **F-194-T56-4: chunk 4
  chồng ~48 s với t01-round194 O8 (03:12:27–03:13:15Z) — KHÔNG
  phải T4; 0 bằng chứng ảnh hưởng; T56 giao parent quyết.**
  T8: 0 chồng lấn (chưa chạy lúc T4 đóng).
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI QUY
  ĐỊNH.** `run-analyzers-194.sh` chạy NGOÀI cửa sổ cả 3
  lần (sau attempt-done). `round193-*` files modified sau
  marker: 0 file.

## 4. Replay/postboot — POSTBOOT_PASS 55c9e0b7 CÓ (T56, poll=1, repair-sớm)

- **Boot 55c9e0b7 (btime 02:28:08Z, số hiệu #119 ỨNG
  VIÊN — T01-194 XÁC MINH, parent quyết (e) ở §14.2-194).**
  Gap #118→#119 = 14.773 s (T56-194).
- **POSTBOOT_PASS 55c9e0b7 ĐÃ CÓ 02:50:55Z** (round194-t56/,
  T56-194; T4 chỉ ghi nhận + xác minh độc lập qua check-only
  của mình): "repair-som-quyet-h: dpkg 777 dong; cache 108
  .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc
  2026-11-26T02:50:55Z". **Check-only của T4 PASS độc lập
  từ poll #5 (02:51:53Z)** và giữ PASS suốt phiên (gate0
  T5 47/50 poll). **Replay 55c9e0b7: bracket
  (02:48:52Z, 02:50:55Z]** — FAIL lúc T4 kiểm tay 02:48:18Z,
  PASS lúc T56 kiểm 02:50:55Z; dpkg.log 2 → 777 dòng trong
  khoảng này; **bracket ~2 phút** (nhanh nhất các boot gần
  đây — apt-get update ~1 phút theo T56; #117 ~15').
  **GST #119 là SYMLINK** (T56-194 §2 — như #115, khác #117
  thư mục thật) — caveat (nếu parent chấp nhận CÓ caveat).
  **#117/#118 VẪN CÓ** (không kiểm lại mtime/md5 đợt này —
  giao T5-194/T56-194).
- **Tổng boot không cờ GIỮ 27** (theo quyết (c)-193; 55c9e0b7
  CÓ cờ thì không đổi — T5-194/parent quyết).
- **REBOOT MỚI 55c9e0b7 (btime 02:28:08Z, gap 14.773 s từ
  8a23277a) — TRƯỚC KHI ĐỢT MỞ ~7 PHÚT (đợt mở 02:35:51Z).**
  0 reboot trong phiên đo (từ mở poller 02:48:52Z tới
  poller thoát 03:41:10Z, boot luôn 55c9e0b7). **(m)
  55c9e0b7 + INSIDE + run 197/198 kết cục thuộc T2-194/T7-194;
  POSTBOOT_PASS 55c9e0b7 thuộc T56-194.**
- **Scheduler gap / OUTAGE + 84l10 / 85m4 / 86n2: KHÔNG CÓ
  DỮ KIỆN TRONG PHIÊN T4.** OUTAGE phán cuối thuộc T7-194;
  verdict harness thuộc T8-194.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND194_T4_WEBKIT_QUIET62_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round194-t4/`):**
  `poll-wait-t4-194.sh` (deadline 04:30Z 26/11 + cờ T5
  round194-t56/ + fallback round193-t56/),
  `run-attempt-194.sh` (lượt yên #62),
  `run-analyzers-194.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt),
  `distinct-seq-194.py` (helper đọc sổ — KHÔNG DÙNG LIVE đợt
  này: không lượt hợp lệ nên sổ không thăng cấp; stage theo
  mẫu 163–193: file helper versioned theo đợt).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–193, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round194-t4/` — theo đúng mẫu 149–193: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, md5 `078938cf...`, giống hệt bản đợt 156–193).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (591f9655) +
  `stats-194.py` + `distinct-seq-194.py` (KHÔNG DÙNG LIVE) +
  `distinct-seq-ledger.json` (as-of-191, md5 `b7ed5791…`) +
  `preflight-194.txt` + `preflight-postboot-194.log` +
  `round194-t4-copy.py`.
- **Log/evidence (hidden_files/round194-t4/, không stage):**
  `poll-t4.log` (50 poll + CỬA MỞ #8/#45/#50 + HẾT NGÂN
  SÁCH 3/3), `poll-t4.nohup.log` (1 instance),
  `poll-test-194.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + 3 lần CỬA MỞ + 3 attempt +
  HẾT NGÂN SÁCH, poller thoát 03:41:10Z),
  `postboot-t4-194-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-194-output.txt` (output stats-194.py),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}-55c9e0b7.json`
  (1.766.210 B / 2.496.943 B / 2.822.661 B),
  `load-mid-t4-attempt{1,2,3}-55c9e0b7.log` (175/112/105
  dòng), `analyze-t4-attempt{1,2,3}-55c9e0b7-*.txt`
  (10 file mỗi attempt — p1p3p7 KHÔNG có vì (c2)=0 cả 3),
  `coverage-check-attempt{1,2,3}-55c9e0b7.txt` (0/N cả 3),
  `classb-t4-attempt{1,2,3}-55c9e0b7.txt`,
  `ps-before/after-t4-attempt{1,2,3}-55c9e0b7.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2,3}-*.txt`
  (B4: dpkg 777 cả 3 attempt). **3 JSON attempt (0 hợp lệ).
  0 process T4 sống lúc đóng** (poller thoát 03:41:10Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4). **X11 KHÔNG trống — X194/X195/X196 (socket Xvfb của
  probe T4, 1/attempt) + X193 (đợt 193) + X98 (P3).**

## 6. Sai số F-194-T4-1..10 (+ nợ cũ)

- **F-194-T4-1 — TREE-MD5 STALE 1 LẦN + CÂY CHURN 3 MD5 (MỚI —
  DẠNG F-193-T4-1, NẶNG HƠN).** (a) Lúc copy-forward:
  tree-md5.txt ghi `cf331628` (đợt 194) — ĐÚNG lúc mở poller.
  (b) Lúc poll: preview.tsx đổi **3 md5** (cf331628 →
  78aba7bc @03:01:52Z → 98392fa6 → 591f9655 @03:05:49Z —
  P1/P2/P3/P4 sửa đợt 194); T4 KHÔNG đuổi theo mà chờ ổn định
  7 poll rồi cập nhật tree-md5.txt → `591f9655` lúc 03:11:32Z;
  poll #22 trở đi tree=YES. (c) Grep stale lần 2 bắt thêm 1
  chuỗi: comment gate0 trong `poll-wait-t4-194.sh` → sửa trước
  pre-flight. Không ảnh hưởng verdict (không attempt nào chạy
  khi cây đang churn — cửa đầu tiên mở lúc 02:54:11Z, trước
  khi cây đổi; cửa sau mở lúc 03:29:23Z/03:36:52Z, sau khi cây
  ổn định ~24/31 phút).
- **F-194-T4-2 — DPKG.LOG RESET THEO ROOTFS REBUILD (MỚI —
  DẠNG F-193-T4-2).** /var/log/dpkg.log chỉ còn 2 dòng lúc
  T4 mở (reset lúc boot mới 02:28:08Z; bản cũ 777 dòng ĐÃ
  MẤT, không có dpkg.log.1; /var/log/apt/ KHÔNG TỒN TẠI).
  Poller chỉ ghi dpkg_lines, không gate theo nó;
  POSTBOOT_PASS/dpkg giao T56-194 phán. Replay cài lại từ
  2 → 777 dòng trong phiên.
- **F-194-T4-3 — ATTEMPT1 NHIỄM TẢI NẶNG NHẤT KỂ TỪ ĐỢT 192
  (MỚI — QUAN TRỌNG).** load1_max 15,11 + load5 cuối 5,89;
  tickCost median 220,0 ms (gấp 3,7 lần ngưỡng); flip wallMs
  93.625 ms (gấp ~3 lần attempt3). Tải lạ quy được cho luồng
  cụ thể: T01 recount (PID 8115) + P4 tsc/parity (PID 27502)
  + P1 chrome headless — cả 3 đều chạy trong cửa sổ W1.
  **0 writePartial TIMEOUT** — không wedged như attempt1-193;
  chậm là do tải, không phải kênh evaluate chết.
- **F-194-T4-4 — ATTEMPT3 THIẾU 1,0 ms, LẦN THỨ 2 LIÊN TIẾP
  THIẾU ĐÚNG 1,0 ms (MỚI).** 20/20 + lớp B ĐẠT 5/5 (load1_max
  2,99 — yên nhất đợt này) nhưng tickCost median 61,0 ms >
  60. Attempt2-193 cũng thiếu đúng 1,0 ms (61,0 ms). Hai lần
  thiếu sát liên tiếp ở 2 đợt khác nhau, trên 2 boot khác nhau
  — median quanh 61,0 ms có thể là mức sàn mới của probe trên
  cây preview.tsx hiện tại (591f9655), không phải nhiễu ngẫu
  nhiên; chỉ ghi nhận, không suy đoán nguyên nhân.
- **F-194-T4-5 — B2 DỮ KIỆN THỨ 6 LẪN LỘN (MỚI — XEM §3).**
  Attempt1 lạ-tải nặng (68 spike); attempt2 tự-tải là chính
  (37 spike, đỉnh ~77% CPU là probe); attempt3 sạch (0 spike).
  Lần lẫn lộn thứ 3 liên tiếp (dữ kiện thứ 4, 5, 6 đều lẫn).
- **F-194-T4-6 — (p) LIVE LẦN 13 KHÔNG THỂ KIỂM (MỚI —
  ÁP ĐÚNG ĐỊNH NGHĨA (p)-192).** #62 không có cửa sổ
  attempt HỢP LỆ nào nên live-check KHÔNG THỂ KIỂM; chuỗi
  live ĐẠT GIỮ 9. Dữ kiện ghi nhận: 0 file analyzer trong cửa
  sổ; live 0 FIRE trong cả 3 cửa sổ (15 mẫu); T9 B2 spikes
  W1 68 / W2 37 / W3 0.
- **F-194-T4-7 — T56 0 CHỒNG PHA (b) VỚI T4; MONITOR 10 s
  HIỆU QUẢ (MỚI — ĐÃ SỬA F-193-T56-3).** Suite 03:02–03:05Z
  + harness 03:05:44–03:13:15Z đều chạy SAU attempt1 nhả lock
  và TRƯỚC W2/W3; monitor kiểm mỗi 10 s, 0 lần kill. Khác
  đợt 193: lần này T56 KHÔNG chồng pha (b) nào với T4.
  F-194-T56-4 (chunk 4 chồng t01 ~48 s) KHÔNG liên quan T4 —
  parent quyết riêng.
- **F-194-T4-8 — X194/X195/X196 LÀ XVFB CỦA CHÍNH PROBE T4;
  X193 CỦA ĐỢT 193, X98 CỦA P3 (MỚI — THEO F-193-T4-8).**
  Mỗi attempt để lại 1 socket Xvfb (attempt1/2/3 → :194/:195/
  :196); socket còn sau khi process thoát — như đợt 192/193.
  0 process Xvfb sống lúc đóng.
- **F-194-T4-9 — RAM RƠI XUỐNG 254 MB Ở POLL #6 (MỚI).**
  1/52 poll <500 MB (đợt 193: 0/44); RAM min toàn phiên 254 MB
  (poll #6, 02:52:38Z); RAM <1024 ở 9/52 poll. RAM là rào
  chắn phụ của cửa retry lần 2 (cùng load5): cửa chỉ mở khi
  RAM vọt lại >1024. Giao T9-194 phán episode (nếu có).
- **F-194-T4-10 — ATTEMPT1 HOLD 394 s, DÀI NHẤT GẦN ĐÂY (MỚI
  — GHI NHẬN, T56 F-194-T56-7).** Hold 394 s (attempt2: 237 s;
  attempt3: 222 s; đợt 193: 136 s / ~217 s). Hold dài là quyền
  của T4 (20/20 đo WebKit dưới tải nặng); không ảnh hưởng
  verdict.
- **Nợ cũ:** F-193-T4-1 tái diễn dạng F-194-T4-1 (nặng hơn: 3 md5);
  F-193-T4-2 → F-194-T4-2; F-193-T4-3 KHÔNG tái diễn (0 writePartial
  TIMEOUT); F-193-T4-4 → F-194-T4-4; F-193-T4-5 → F-194-T4-3 (nặng
  hơn); F-193-T4-6 → F-194-T4-5; F-193-T4-7 ĐÃ SỬA (F-194-T4-6);
  F-193-T4-8 → F-194-T4-8; F-193-T4-9 KHÔNG tái diễn dạng cũ
  (F-194-T4-9); F-193-T4-10 → F-194-T4-9 (nặng hơn). F-192-T4-1–10,
  F-191-T4-1/2/3/6/7/8 tái diễn dạng tương ứng; F-191-T4-4/5 ĐÃ HẾT;
  F-191-T4-9/10 KHÔNG tái diễn; F-189-T4-2 → F-194-T4-9; F-189-T4-4/5
  ĐÃ HẾT; F-189-T4-6 có dữ kiện mới; F-188-T4-2 → F-194-T4-9;
  F-188-T4-8 KHÔNG tái diễn; F-186/185-T4-2 KHÔNG tái diễn;
  F-184-T4-2 → F-194-T4-9; F-184-T4-4 KHÔNG tái diễn; F-183-T4-4
  tái diễn (T01 giữ lock #23–#29); F-181-T4-6 KHÔNG CÓ SỐ MỚI;
  F-179-T4-5 ĐÃ HẾT; F-176-T4-2 KHÔNG tái diễn; F-175-T4-2 KHÔNG
  ÁP DỤNG (0 file analyzer trong cửa sổ).

## 7. P3' cộng dồn (KHÔNG ĐỔI — 50 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 194 (KHÔNG ĐỔI): P1 223/227, P2
  218/218, P3-A1 192/227, P3' 187/199 occurrence = 142/145
  distinct-seq, P7 121/121** (50 lượt hợp lệ — #62 KHÔNG
  CÓ lượt hợp lệ nên không cộng thêm; 0 seq mới).
- **Đóng góp lượt #62: 0/0 seq.** Attempt1 (c2)=0; attempt2
  (c2)=0; attempt3 (c2)=0. Helper `distinct-seq-194.py`
  KHÔNG DÙNG LIVE đợt này (không có attempt hợp lệ để
  thăng cấp sổ); sổ GIỮ NGUYÊN as-of-191 (md5 `b7ed5791`).
  Đợt 195 copy-forward lấy sổ này làm cơ sở.
- **P1/P2/P3-A1/P7 cả 3 attempt (chỉ ghi nhận, KHÔNG tính):**
  (c2)=0 nên không có seq nào để kiểm — không ảnh hưởng cộng
  dồn.
- **Labellag (b) — CHUỖI TRƯỚC #62 = 0 (theo quyết (m)-192):**
  chuỗi 0 occ (185–187) DỪNG ở đợt 189; đợt 191 có 4 occ/
  1 event; #60/#61 0 occ ở attempt nhưng KHÔNG có lượt hợp
  lệ → chuỗi GIỮ 0. **#62: attempt1 4 occ / 1 event** (seq
  183–185, lag max +10f) **NHƯNG attempt KHÔNG hợp lệ**;
  attempt2/3 0 occ / 0 event (max 4f; n=146/386/136/472
  occurrence) — chuỗi **GIỮ 0**.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (không có dữ kiện mới đợt này —
  cả 3 attempt (c2)=0).
- Chuỗi median tickCost 50 lượt KHÔNG ĐỔI (n=50, tổng
  2361,0, trung bình 47,2 ms, min 39,0, max 60,0; 0 lượt
  vượt ngưỡng 60 — dãy đầy đủ xem LIMITS 192 §7).
  Ba median attempt đợt này (220,0 / 75,0 / 61,0) đều VƯỢT
  60 — đợt thứ 3 liên tiếp cả 3 attempt đều vượt ngưỡng
  tickCost (đợt 192: 96,0 / 64,0 / 63,0; đợt 193: 75,0 /
  61,0 / 69,0) — xem F-194-T4-4.

## 8. Chờ quyết parent / nợ đợt 195

- **(a) #62 KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ
  GIỮ 0 (đã ĐỨT ở #60 — ĐỀ XUẤT — parent quyết cuối).**
  Chân lượt yên cho chuỗi FULL PASS **KHÔNG có đợt này.**
- **(b) P3' cộng dồn GIỮ NGUYÊN 50 lượt: P1 223/227, P2
  218/218, P3-A1 192/227, P3' 187/199 = 142/145, P7 121/121:**
  sổ distinct-seq GIỮ NGUYÊN as-of-191 md5 `b7ed5791`.
  **Chờ parent/T10 quyết:** ghi nhận không thăng cấp.
- **(c) BOOT 55c9e0b7 (số hiệu #119 ỨNG VIÊN —
  T01-194 xác minh 9 nguồn tươi, parent quyết (e) ở §14.2-194).**
  **(m) 55c9e0b7 + INSIDE + run 197/198 kết cục thuộc
  T2-194/T7-194; POSTBOOT_PASS 55c9e0b7 (T56-194).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 1 chuỗi sót +
  tree-md5 stale bắt bằng md5 đọc trực tiếp (F-194-T4-1);
  T5FLAG chính đã sửa sang `round194-t56/` (FIX F-192-T56-1;
  gate0 T5 PASS từ poll #4).
- **(e) POSTBOOT_PASS 55c9e0b7 CÓ lúc T4 đóng (T56 02:50:55Z,
  poll=1, repair-sớm). Tổng boot không cờ GIỮ 27
  (nếu 55c9e0b7 tính là có cờ). GST #119 là SYMLINK (như #115)
  — parent quyết caveat ở (c) aggregate.**
- **(f) RAM rơi xuống 254 MB ở poll #6 (1/52 poll <500 MB);
  giao T9-194 phán episode (nếu có).**
- **(g) (m) #118 phán CUỐI (T2-194); (m) #119 THÔ (T2-194);
  INSIDE (T2-194); POSTBOOT_PASS 55c9e0b7 (T56-194); số hiệu
  55c9e0b7 = #119? (T01-194 xác minh; btime 02:28:08Z); OUTAGE
  phán cuối T7-194 (T7-193 kiểm onset khung 25/11);
  auto-trigger lần FIRE thật đầu tiên — VẪN CHƯA XẢY RA
  (T9-194); B2 dữ kiện thứ 6 lẫn lộn (T4-194 — BẢN NÀY);
  (m) #56 lần 36; mù hole-recheck lần 37; prune lần 68;
  headroom (T9-194); ENOSPC lần 42?; 84l10 PASS chuỗi?;
  86n2-P1 chuỗi 16?; B2 live sạch lần 8?; E-247 kết cục
  (T9-194); run 197/198 kết cục (T7-194).**
- **(h) B2 DỮ KIỆN THỨ 6 LẪN LỘN (F-194-T4-5). Luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách. Auto-trigger LIVE chạy trong cả 3 cửa sổ
  attempt, 0 FIRE** — lần FIRE thật đầu tiên vẫn chưa xảy
  ra; T9-194 verify end-to-end khi có FIRE.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 3 lần đợt này
  (attempt1/2/3) → **0 lượt yên hợp lệ #62 cho chuỗi FULL
  PASS.** O8 T01 trên 55c9e0b7 (lock polls #23–#29, 21/21 ×2
  WebKit + Chromium theo NOTES.md — T01 chưa đóng cờ, T10
  xác minh cuối); O8 T8 + harness thuộc T8-194 báo cáo (T8
  chưa đóng lúc T4 đóng).
- **(j) F-194-T4-1 (tree-md5 stale 1 lần + cây churn 3 md5);
  F-194-T4-2 (dpkg.log reset 2 dòng); F-194-T4-3 (attempt1
  nhiễm tải nặng nhất, load1_max 15,11, median 220,0);
  F-194-T4-4 (attempt3 thiếu 1,0 ms, lần 2 liên tiếp thiếu
  đúng 1,0 ms); F-194-T4-5 (B2 dữ kiện thứ 6 lẫn lộn, lần 3
  liên tiếp); F-194-T4-6 ((p) live lần 13 KHÔNG THỂ KIỂM —
  áp đúng định nghĩa (p)-192); F-194-T4-7 (T56 0 chồng pha
  (b), monitor 10 s hiệu quả); F-194-T4-8 (X194/X195/X196
  của probe T4, X193 đợt 193, X98 của P3); F-194-T4-9 (RAM
  rơi 254 MB ở poll #6); F-194-T4-10 (attempt1 hold 394 s,
  dài nhất gần đây).**

## Phụ lục A — stats-194-output.txt (tóm tắt)

```
test: 2 poll, RAM 1115-1123 >=1024: 2/2, load1<2: 0/2, gate0: khong-dat=2
poller: 50 poll 02:48:52-03:36:51Z, RAM min=254 max=2563 >=1024: 41/50
  <500: 1/50, load1<2: 26/50, load5<2: 10/50, gate0: T5=47, khong-dat=3
  lock: co=7, khong=43, dpkg 2->777
TONG: 52 poll; RAM min=254 max=2563 >=1024: 43/52 <500: 1/52
gan-mo: #8 02:54:10Z RAM=1925 L1=1.89 L5=1.81; #45 03:29:22Z RAM=1516
  L1=0.76 L5=1.85; #50 03:36:51Z RAM=1906 L1=0.64 L5=1.82
P3' (50 luot): P1 223/227 P2 218/218 P3-A1 192/227 P3' 187/199 = 142/145 P7 121/121
median 50 luot: n=50 mean=47,2 min=39,0 max=60,0 vuot-60: 0
```
