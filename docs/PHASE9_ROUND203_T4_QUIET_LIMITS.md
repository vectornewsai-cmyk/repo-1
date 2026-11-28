# PHASE9_ROUND203_T4_WEBKIT_QUIET71_LIMITS.md

**Đợt:** 203. **Luồng:** T4 — đo lượt yên WebKit #71 trên boot
8ea1f5e3 — 3 attempt, 0 LƯỢT HỢP LỆ
+ **#71 KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt hợp lệ
  (tiền lệ #64 đợt 196: 0/3). Chuỗi lượt yên hợp lệ
  3 → 0 ĐỨT (ĐỀ XUẤT — parent quyết cuối)** — lần
  đầu đứt chuỗi kể từ #67 (đợt 199).
+ **BOOT ĐO: 8ea1f5e3 (btime 23:06:56Z; số hiệu #135
  ứng viên theo T01-203 survey 9 nguồn tươi —
  parent quyết (e)-203).** POSTBOOT_PASS
  round203-t56 CÓ 23:55:18Z (poll=1, repair-sớm-
  quyết-h, dpkg 777, cache 108, lists 75).
  **0 reboot trong phiên đo (1 boot duy nhất;
  F-202-T4-1 KHÔNG tái diễn).**
+ **LIVE-CHECK #22: KHÔNG ĐẠT (ĐỀ XUẤT) — không có
  cửa sổ hợp lệ để đối chiếu (tiền lệ #15 đợt 196).
  Chuỗi live ĐẠT 1 → 0 (ĐỀ XUẤT).** B2 dữ kiện #15:
  **KHÔNG CÓ W1 hợp lệ** (W1a 32 spike, W1b 14
  spike, W1c 0 spike — xem §3).
+ **P3' CỘNG DỒN GIỮ NGUYÊN 56 lượt hợp lệ: P1
  243/247, P2 238/238, P3-A1 207/247, P3' 205/219
  occ = 148/151 distinct-seq, P7 141/141.** Sổ
  as-of-202 md5 `50f10815` KHÔNG thăng cấp.
  Labellag (b): chuỗi 0 occ **3 → 0 (ĐỀ XUẤT)**.
+ **DEF §5 n≥4 (quyết (m)-202) — MINH CHỨNG ĐẦU:**
  attempt2 P3-A1 4/4, p=0,0027 < 0,01 — ĐÃ ĐỦ
  ngưỡng n=4, NHƯNG attempt KHÔNG HỢP LỆ (B2 vi
  phạm) nên KHÔNG cộng dồn. Attempt3 P3-A1 n=1 →
  CHƯA KẾT LUẬN (không phải SAI/ĐÚNG).
+ **W1-ACTIVE: tạo/xóa đúng cả 3 attempt** (xóa
  00:23:03Z / 00:26:54Z / 00:33:14Z). Kiểm lúc
  đóng: file KHÔNG còn tồn tại.
+ **FULL PASS: chân lượt yên KHÔNG CÓ đợt này**
  (chân O8 3/3 cùng boot #135 thuộc T01-203;
  harness thuộc T8-203).
**Ngày:** 28/11/2026 (lượt cron 06:35 +07 28/11 =
23:35:51Z 27/11, run 213). **Boot đo:** 8ea1f5e3
(1 boot duy nhất; 34 poll thật + 3 attempt).

## 0. Verdict tổng

- **#71 KHÔNG HỢP LỆ — 0/3 attempt hợp lệ.**
  Attempt1 WEDGED (exit=3, partial 11/20 pass);
  attempt2 20/20 NHƯNG lớp B2 VI PHẠM (sampler
  load1_max 4,84); attempt3 20/20 + lớp B ĐẠT 5/5
  NHƯNG tickCost median 117,0 ms > 60. **Ngân
  sách dùng 3/3; poller thoát exit 11 lúc
  00:33:38Z.** Chuỗi lượt yên hợp lệ 3 → 0 ĐỨT
  (ĐỀ XUẤT).
- **(c2) quan sát (KHÔNG cộng dồn):** attempt2
  [135, 198, 219, 266] (4/4 P1 ĐÚNG, P3-A1 4/4
  ĐÚNG p=0,0027); attempt3 [208] (n=1, P1/P3-A1
  YẾU → CHƯA KẾT LUẬN per DEF §5 n≥4); attempt1
  (c2)=0. **0 seq mới được cộng** (chỉ lượt hợp
  lệ mới cộng — attempt2/attempt3 đều không hợp
  lệ). Sổ distinct-seq as-of-202 KHÔNG ĐỔI
  (md5 `50f10815`).
- **Labellag (b): chuỗi 0 occ 3 → 0 (ĐỀ XUẤT)** —
  không có lượt hợp lệ đợt này; attempt3 quan sát
  15 occ ≥5f (12 + 3) do tick chậm, KHÔNG cộng
  chuỗi; attempt2 quan sát 0 occ ≥5f.
- **B2 DỮ KIỆN #15: KHÔNG CÓ W1 HỢP LỆ** — W1a
  32 spike, W1b 14 spike, W1c 0 spike (b2watch +
  sampler T4 khớp từng cửa sổ). **Live-check #22
  KHÔNG ĐẠT (ĐỀ XUẤT)** — chuỗi live ĐẠT 1 → 0.
  Caveat: W1c 0 spike nhưng lượt không hợp lệ
  (tickCost) nên T4 KHÔNG dùng làm cửa sổ hợp
  lệ — parent có thể quyết khác (xem §3).
- **0 VI PHẠM PHÍA T4** (không script nặng nào
  trong lúc gate0wait; không probe dpkg nào trong
  cả phiên; launch-test riêng KHÔNG chạy đợt này
  — F-201-T4-5 đứng). Chồng lấn ghi nhận trong
  W1: **W1a 9 file + W1b 4 file + W1c 15 file
  (F-203-T4-4)** — giao (p)-203.
- **Cây lúc đo:** `apps/web/src/preview.tsx` md5
  `477a0eac` trong cả 3 attempt (0 lần cập nhật
  tree-md5); đổi sang `25dcc7cc` lúc 00:40:22Z —
  SAU khi poller thoát, do luồng khác.
- **Cờ:** `hidden_files/round203-t4.done` viết lúc
  đóng, CÓ NỘI DUNG. **Boot lúc viết cờ là
  8ea1f5e3 — CÙNG boot đo.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-201-T4-5)

Chạy **trước mọi attempt, trước khi mở poller**
(23:54Z), ghi vào `hidden_files/round203-t4/
preflight-203.txt`.

- **md5 khớp hệt bản đợt 202:** b.json `078938cf…`,
  probe `4291e539…`, vite T4 `e3e874e1…`, sổ
  as-of-202 md5 `50f10815` (occ 205/219, distinct
  148/151, valid_rounds_p3 44, non_dat_in_union
  [260, 364, 498]). **Tree:** preview.tsx lúc mở
  poller là `477a0eac` (đọc trực tiếp ~23:54Z;
  KHÔNG ĐỔI so với cuối đợt 202).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script
  T4; `py_compile` OK 12 file py; media
  `stripes-nonperiodic.mp4` có mặt; không có
  `vite.lock`, không có `attempt-done-*`.
  **Playwright-core (npm): KHÔNG tìm thấy** (như
  đợt 202 — launch test dùng MiniBrowser trực
  tiếp).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:**
  `2026-11-28 01:30:00 UTC` → **1795829400**
  (hạn cờ ~02:00Z = 1795831200, hạn cứng
  02:35:51Z = 1795833351); test poll header
  deadline đúng `01:30:00Z` — 0 chuỗi sót
  (F-199-T4-1 KHÔNG tái diễn).
- **Copy-forward 202 → 203 (script python thay thế
  có neo, KHÔNG sed global):** deadline `22:30Z
  27/11` → `01:30Z 28/11`; hạn cờ/cứng →
  `02:00Z`/`02:35:51Z`; T5FLAG chính
  `round203-t56/` + fallback `round202-t56/`;
  `T4-202a` → `T4-203a`; `WebKit #70` → `#71`;
  glob `round201-*` → `round202-*`. Lỗi neo 0 lần.
  **WIRE p1p3p7 ĐÃ CÓ SẴN trong
  run-analyzers-203.sh — chỉ assert (1 lần),
  KHÔNG chen lại.**
  **W1-ACTIVE ĐÃ WIRE vào run-attempt-203.sh
  (nhiệm vụ T4 đợt 202, giữ nguyên):** tạo ngay
  sau `touch marker`, xóa ngay sau LOCKV2 trả về
  + trong trap EXIT. `bash -n` OK sau sửa.
- **`cp` (KHÔNG dùng `cp -a` — tránh EPERM
  ownership F-170-T4-1):** chỉ copy 22 file làm
  việc (không copy log/JSON kết quả đợt 202).
- **Freeze check (F-164-T4-1):** `round202-t4` còn
  **0 file làm việc** mtime ≥ 23:35:51Z (đợt 203
  mở).
- **GATE0 LÚC MỞ: T5 CHƯA CÓ + CHECK-ONLY FAIL.**
  round203-t56/ `replay-watch-203.sh` đang chạy
  (pid 296433, từ 23:53Z) + postboot-check
  `--repair` (pid 296538); marker
  `repaired-8ea1f5e3` có (0 B, 23:53Z) nhưng
  POSTBOOT_PASS chưa có; fallback round202-t56/
  POSTBOOT_PASS là của boot CŨ bd22dffd
  (21:28:09Z) — KHÔNG khớp boot hiện tại 8ea1f5e3.
  **Check-only postboot chạy tay exit=1 FAIL**
  (xem `preflight-postboot-203.log`): GST PASS
  (isomp4 + libav đủ), apt thiếu 11 package —
  replay đang cài dần. Poller chờ theo thiết kế
  (như đợt 200: T56 repair xong mới mở cửa).
  F-200-T4-1 KHÔNG tái diễn (đây là chờ repair,
  không phải thiếu sót).
- **F-201-T4-5 đứng:** launch-test chỉ chạy khi có
  cờ `--launch-test`; gate0wait không có dòng
  launch là đúng thiết kế. **Launch-test riêng
  KHÔNG chạy đợt này**; launch chứng minh bằng
  attempt2/attempt3 20/20 trên WebKit 27.2.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG** — 0 X
  server đang chạy.
- **RAM lúc mở ~638–1.486 MB avail (23:50–23:54Z
  — các luồng khác đang chạy nặng); load1
  ~3,03–3,99 lúc mở.** Poller chờ gate A đúng
  thiết kế.
- **T9-203 đã chạy lúc T4 mở:** `b2watch.sh`
  (pid 295996, từ 23:51Z) +
  `sampler-autotrigger.py --live` (pid 295995,
  từ 23:51Z) — dữ kiện B2/live có sẵn.
- **DEF §5 (quyết (m)-202):** P3-A1 cấp lượt yêu
  cầu n≥4 cho phán p<0,01; ở n=3, P3-A1 cấp lượt
  là CHƯA KẾT LUẬN (không phải SAI). Áp dụng đợt
  203 (xem §7).
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 34 poll thật (1 test + 33), 3 lần cửa mở, 0 reboot

- **Test (POLL_TEST=1), 1 poll, boot 8ea1f5e3
  (23:54:06Z):** RAM 1454 MB, load1 3,95/load5
  2,15, lock=khong, blockers=0, gate0=khong-dat
  (T5 cu + postboot exit=1), t5flag=cu, apt=1,
  dpkg 2 → **TEST-POLL-OK exit 7 đúng thiết kế.**
  Header deadline đúng 01:30:00Z — 0 chuỗi sót.
- **Poller instance 2 — boot 8ea1f5e3, 33 poll
  (23:54:11Z–00:28:56Z), 3 lần cửa mở:** RAM
  ≥1024: **32/33** (min 892, max 3014 MB);
  **<500: 0/33**; load1<2: 16/33; load5<2:
  **3/33** (đúng 3 lần mở cửa); gate0: **T5 31**,
  khong-dat 2 (poll #1–#2, trước khi
  POSTBOOT_PASS ghi 23:55:18Z; từ poll #3 T5
  PASS); lock=co 5 (T01-203 giữ lock O8 pid
  299783 port 5560, polls #4–#8 — T01-203 xác
  nhận 0 chồng lấn), khong 28; blockers>0: 5
  poll; apt>0: 2 poll; dpkg 2→777.
  **Load5 kẹt 2,00–3,00 trong 28 poll đầu**
  (poll #28 load5 đúng 2,00 — KHÔNG <2 nên cửa
  chưa mở; poll #29 load5 1,89 mới mở).
- **Cửa mở 3 lần:** poll #29 00:15:21Z (RAM 1894
  MB, load1 0,98, load5 1,89, lock=khong,
  blockers=0, apt=0, gate0=T5) → attempt1; poll
  #30 00:23:25Z (RAM 3014 MB, load1 0,98, load5
  1,84) → attempt2 (mở lại ngay sau analyzer
  attempt1 — gate vẫn mở); poll #33 00:28:56Z
  (RAM 2184 MB, load1 1,20, load5 1,87) →
  attempt3. Poller thoát sau attempt3 (hết ngân
  sách 3/3) lúc 00:33:38Z, exit 11.
- **Phân rã 34 dòng poll thật (1 test + 33):**
  RAM≥1024: 33/34; RAM<500: **0/34**.
  load1<2: 16/34; load5<2: 3/34.
  **"gan-mo" (3 điều kiện load/RAM): 3** = đúng
  3 lần mở cửa thật (không có lần kẹt gan-mo
  nào). gate0: T5=31, khong-dat=3 (gồm test).
  blockers>0: 5 poll. apt>0: 3 poll (gồm test).
  dpkg 2→777.
- **0 reboot trong phiên đo** (boot duy nhất
  8ea1f5e3 từ lúc mở poller tới lúc đóng cờ).

## 2. Attempt — 3 attempt (ngân sách dùng 3/3), 0 lượt hợp lệ

- **attempt1-8ea1f5e3: WEDGED — exit=3, partial
  11/20 pass, KHÔNG tính verdict.** Cửa sổ:
  marker 00:15:21Z → attempt-done 00:23:03Z
  (inner-end 00:22:58Z, probe_exit=3; vite lock
  giữ 462 s; W1-ACTIVE xóa 00:23:03Z). Pass
  12/20 kẹt: **pass-timeout 120.000 ms
  wall-clock (kẹt rAF/renderer)** 00:21:26Z; cả
  3 writePartial fetch TIMEOUT 30 s (tickCost
  n=190, blendTick n=126, c2DrawLog n=332 — giữ
  số cũ, không ghi đè); partial JSON 1.042.200 B
  (11/20 pass). Sampler n=221, load1_max
  **10,21**, RAM min 657 MB. **Lớp B: B1 ĐẠT**
  (load5 cuối 1,87); **B2 VI PHẠM (load1 max
  10,21)**; B3/B4/B5 ĐẠT. **(c2)=0 seqs**,
  coverage (c2)=0 — không có gì để tính
  P1/P3-A1/P7. (Xem F-203-T4-1.)
- **attempt2-8ea1f5e3: 20/20 NHƯNG lớp B2 VI PHẠM
  — KHÔNG hợp lệ, KHÔNG tính verdict.** Cửa sổ:
  marker 00:23:25Z → attempt-done 00:26:54Z
  (inner-end 00:26:51Z, probe_exit=0; vite lock
  giữ 209 s; W1-ACTIVE xóa 00:26:54Z). JSON
  2.935.449 B; flip wallMs 27.295 ms.
  **tickCost:** tổng n=529 median **59,0** p90
  85,0 max 179 min 28; hậu flip+2000ms n=384
  median 57,0. BlendTick/pass 20,9; rAF/pass
  median 32 (27–37). webkit=27.2, pageErrs=[].
  **Lớp B: B1 ĐẠT** (load5 cuối 2,14); **B2 VI
  PHẠM (sampler load1_max 4,84)**; B3 ĐẠT; **B4
  ĐẠT (dpkg delta 0)**; **B5 ĐẠT (RAM min 1872
  MB, 0 mẫu <1024)**. **(c2) = 4 seq [135, 198,
  219, 266]** (lag +1f cả bốn) → P1 ĐÚNG 4/4
  (p=0,00063); P2 ĐÚNG 4/4; **P3-A1 ĐÚNG 4/4
  (p=0,0027 < 0,01 — ĐÃ ĐỦ ngưỡng n=4 theo DEF
  §5 (m)-202)**; **P3' ĐẠT 4/4** (stall 5, 5, 4,
  3); **P7 ĐÚNG** (0 entry trễ ≥+1f; đối chứng
  0/383). Coverage 4/4. **Labellag (b): 0 occ
  ≥5f** cả hai chiều. **NHƯNG attempt KHÔNG HỢP
  LỆ (B2 vi phạm) → KHÔNG cộng dồn** (xem §7 —
  ghi rõ để parent khỏi nhầm số này vào sổ).
  **Perpass (20 pass):** median 41,0–75,0 ms
  (không pass nào vượt 75); load1 mean theo
  pass 0,9–1,0. Tương quan median~load1_mean
  r=−0,06; median~RAM_mean r=0,03 (chỉ mô tả).
- **attempt3-8ea1f5e3: 20/20 + lớp B ĐẠT 5/5
  NHƯNG tickCost median 117,0 ms > 60 — KHÔNG
  hợp lệ, KHÔNG tính verdict.** Cửa sổ: marker
  00:28:56Z → attempt-done 00:33:14Z
  (probe_exit=0; vite lock giữ 257 s;
  W1-ACTIVE xóa 00:33:14Z). JSON 1.847.705 B;
  flip wallMs 41.277 ms.
  **tickCost:** tổng n=289 median **117,0** p90
  204,2 max 476 min 32; hậu flip+2000ms n=216
  median 117,5. tBlend gap median 213,0 (p90
  529,0, max 8674). BlendTick/pass 11,4;
  rAF/pass median 22 (17–31). webkit=27.2,
  pageErrs=[]. **Lớp B 5/5 ĐẠT:** B1 (load5 cuối
  1,01); B2 (load1_max 1,11); B3 (không reboot);
  B4 (dpkg delta 0); **B5 ĐẠT (RAM min 781 MB,
  0 mẫu <500; 24/120 mẫu <1024 — cảnh báo)**.
  **(c2) = 1 seq [208]** (lag +1f) → P1 YẾU
  (p=0,314); **P3-A1 YẾU (p=0,444) — theo DEF
  §5 n≥4 (quyết (m)-202): CHƯA KẾT LUẬN ở n=1**
  (không phải SAI, không phải ĐÚNG); **P3' ĐẠT
  1/1** (stall 6); **P7 ĐÚNG** (0 entry trễ
  ≥+1f; đối chứng 0/215). Coverage 1/1.
  **Labellag (b): 15 occ ≥5f** (12 ở
  skippedLatest=1 + 3 ở skippedLatest=0; max
  73f = 2433 ms) — nhãn trễ do tick chậm, CHỈ
  ghi nhận quan sát (lượt không hợp lệ, không
  cộng chuỗi). **Perpass (20 pass):** median
  96,0–189,0 ms — **chậm CẢ 20 pass** (4 pass
  cuối 134,5/141,0/125,0/96,0 ms — không hồi);
  load1 mean GIẢM dần 0,97 → 0,25 trong khi
  median tick KHÔNG giảm (r=−0,14) — chậm
  KHÔNG do tải (xem F-203-T4-2). RAM mean rơi
  1475 → 842 MB rồi hồi 1701.
- **Ngân sách dùng 3/3; poller thoát 00:33:38Z
  exit 11 (hết ngân sách, không có lượt hợp
  lệ).** W2/W3 là attempt2/attempt3 (đã dùng
  hết, không còn retry).

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn + W1-ACTIVE

- **KIỂM B2 — DỮ KIỆN #15 (cách đếm (j)-200: mỗi
  đợt = 1): KHÔNG CÓ W1 HỢP LỆ.** Watcher T9
  (b2watch.sh, poll load1 mỗi 2 s, ghi spike
  khi load1 ≥ 3,0; mỗi spike ghi boot_id):
  **W1a: 32 spike** (00:15:21–00:23:03Z, boot
  8ea1f5e3; max 9,24 lúc 00:16:10Z); **W1b: 14
  spike** (00:23:25–00:26:54Z; max 4,84 lúc
  00:24:23Z); **W1c: 0 spike** (00:28:56–
  00:33:14Z). Sampler T4 xác nhận độc lập từng
  cửa sổ: W1a load1_max 10,21; W1b load1_max
  4,84; W1c load1_max 1,11. Tổng log T9 lúc
  kiểm: 170 spike trên boot 8ea1f5e3 (tất cả
  ngoài W1c). T4 chỉ báo số, KHÔNG tự quyết
  tách (tiền lệ B2 #8 đợt 196: "cả 3 cửa sổ đều
  spike tự-tải" — đợt này W1c 0 spike nhưng
  lượt không hợp lệ).
- **AUTO-TRIGGER LIVE — 0 FIRE CẢ 3 CỬA SỔ.**
  Live `dry_run=False guard=6291456 consec=2`
  (T9-203). Mẫu autotrigger trong các cửa sổ:
  W1a 8 mẫu (00:15:55–00:22:55Z, load1 tới
  9,74, avail max 2.401.144 kB); W1b 3 mẫu
  (00:23:55 load1 1,66; 00:24:55 load1 4,01;
  00:25:55 load1 2,19; avail max 2.792.880 kB);
  W1c 4 mẫu (00:29:55–00:32:55Z, load1 0,32–
  0,55, avail max 2.019.964 kB) — **tất cả
  trigger=watch, consec=0: 0 FIRE / 0
  WOULD-FIRE.** Max avail mọi cửa sổ <
  guard 6.291.456 kB. (Mẫu 00:26:55Z nằm 1 s
  SAU inner-end attempt2 nên KHÔNG tính vào
  W1b; mẫu 00:33:55Z nằm sau attempt3 nên
  KHÔNG tính vào W1c.)
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 22: KHÔNG
  ĐẠT (F-203-T4-6, ĐỀ XUẤT — chuỗi live ĐẠT
  1 → 0).** Áp ĐÚNG định nghĩa (p)-192 như đã
  áp ở #14 (đợt 195), #16 (đợt 197), #19 (đợt
  200), #20 (đợt 201) và #21 (đợt 202) — đợt
  này **KHÔNG CÓ cửa sổ hợp lệ** (attempt1
  wedged + 32 spike; attempt2 B2 vi phạm + 14
  spike; attempt3 tickCost 117 ms > 60) nên
  KHÔNG ĐẠT — tiền lệ #15 đợt 196 ("không có
  cửa sổ hợp lệ để đối chiếu"). T9-203 xác nhận
  độc lập sau (T9 chưa đóng lúc T4 đóng).
  **Caveat ghi rõ cho parent:** W1c có 0 spike
  B2 (b2watch + sampler T4 khớp) — nếu parent
  quyết W1c tính là cửa sổ hợp lệ cho live-check
  thì live #22 sẽ ĐẠT; T4 đề xuất KHÔNG (cửa sổ
  của lượt không hợp lệ không phải cửa sổ hợp
  lệ — nhất quán với cách P3' chỉ cộng lượt hợp
  lệ).
- **W1-ACTIVE: tạo/xóa đúng cả 3 attempt:**
  W1a tạo 00:15:21Z, xóa 00:23:03Z; W1b tạo
  00:23:25Z, xóa 00:26:54Z; W1c tạo 00:28:56Z,
  xóa 00:33:14Z (xóa ngay sau LOCKV2 trả về;
  trap EXIT là dự phòng thứ hai). **Kiểm lúc
  đóng: file KHÔNG còn tồn tại.**
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (kiểm
  file hidden_files mtime trong cửa sổ, loại
  round203-t4):**
  **W1a (00:15:21–00:23:03Z) — 9 file
  (F-203-T4-4):** `round203-t56/
  prune-deleted.txt` 00:15:24Z; `round203-p3/
  probe-203-longA-300s-gop300-720p.log`
  00:16:21Z; `round203-p1/scratch/render203.mjs`
  00:16:32Z + `render203.log` 00:16:54Z;
  `round203-p2/probe-203-p2c.json` +
  `probe-203-p2c.log` 00:17:07Z; `round203-p3/
  audio-probe-203-longA-300s-gop300-720p.json` +
  `probe-203-longA-300s-gop300-720p-rerun.log`
  00:20:09Z; `round203-p2/check-bandmean.mjs`
  00:21:11Z.
  **W1b (00:23:25–00:26:54Z) — 4 file
  (F-203-T4-4):** `round203-t56/
  churn-delays-8ea1f5e3.txt` +
  `prune-time.txt` 00:23:28Z; `round203-p2/
  probe-203-p2e.mjs` 00:23:35Z; `round203-p4/
  parityHarness203-single-backup.ts` 00:26:30Z.
  **W1c (00:28:56–00:33:14Z) — 15 file
  (F-203-T4-4):** `round203-t2/
  blind203-merged.py` + `blind203-sessions.py`
  + `evidence-check203.py` +
  `hole-recheck203.py` 00:29:03Z; `round203-p2/
  probe-203-p2e.json` + `probe-203-p2e.log`
  00:29:59Z; `round203-p1/scratch/frames203b.log`
  00:31:24Z; `round203-p2/probe-203-p2f.mjs`
  00:31:57Z; `round203-p1/ab203/*.wav` ×6
  (haidang/maianh/quangson × nonotch/ship-m12)
  00:32:50–00:32:53Z; `round203-p1/scratch/
  render203b.log` 00:32:53Z.
  Giao T2/P1/P2/P3/P4/T56/parent phán (p)-203
  (theo quy tắc tinh chỉnh (p)-200: ghi file hay
  workload nặng trong cửa sổ mới tính). **0 file
  round202-* nào bị sửa trong cả 3 W1** (check
  glob đợt trước trong t4-attempt-inner.sh —
  kết quả trống cả 3 lần).
  **ps-before W1b: 0 Chrome / 0 node tsc-test /
  0 vite preview** (không phải của T4) — chỉ
  thấy daemon đứng T9 (b2watch + sampler live)
  + shell spawn T9-203 (pid 295990–295995, từ
  23:51Z — shell cha của driver, không phải
  workload). **Waiter T8 trong W1:** không thấy
  launcher wait-t4-t5 trong ps-before/after cả
  3 attempt (như đợt 202 — T8 chưa spawn waiter
  lúc T4 đo, hoặc waiter đã thoát).
  **Sampler live T9 trong W1:** `b2watch.sh` +
  `sampler-autotrigger.py --live` — daemon
  đứng; theo (p)-200 KHÔNG VI PHẠM.
- **T56 REPAIR — 0 CHỒNG TRONG W1**
  (POSTBOOT_PASS 8ea1f5e3 ghi 23:55:18Z, TRƯỚC
  marker đầu 00:15:21Z; dpkg delta 0 trong cả
  3 cửa sổ; apt=0 ở cả 3 poll mở cửa). Verify
  trước cửa attempt đầu — KHÔNG tính vi phạm
  (tiền lệ (p)-199).
- **Ghi trong các cửa sổ attempt: CHỈ CÓ GHI
  CỦA CÁC LUỒNG KHÁC (xem trên).**
  `run-analyzers-203.sh` chạy NGOÀI cửa sổ cả
  3 lần.

## 4. Replay/postboot + 0 reboot trong phiên

- **Boot 8ea1f5e3 (btime 23:06:56Z; số hiệu #135
  ứng viên — T01-203 survey 9 nguồn tươi lúc
  23:50:50Z + 23:52:35Z; gap #134→#135 = 7.301
  s; marker 85, 86 nếu #135 xác nhận — parent
  quyết (e)-203). POSTBOOT_PASS MỚI ĐÃ CÓ
  23:55:18Z** (T56-203; T4 chỉ ghi nhận): "boot
  8ea1f5e3 (btime 2026-11-27 23:06:56Z;
  watcher-203) — repair-som-quyet-h: dpkg 777
  dong; cache 108 .deb; lists 75; postboot PASS
  poll1 doc lap exit 0 luc 2026-11-27T23:55:18Z;
  POSTBOOT_PASS moi ghi 2026-11-27T23:55:18Z
  poll=1 (repair-som-quyet-h); co cu bd22dffd
  luu POSTBOOT_PASS-bd22dffd". **Cùng hồ sơ
  #130/#131/#133/#134 về dpkg/cache (777/108);
  lists 75 (giống #133, khác 66 của #134).**
  Caveat (b1)/(b2) thuộc parent quyết (c)-203.
- **T01-203 survey:** script
  `boot-survey-203t01.sh` ghi "#135 candidate
  (fresh)"; file survey liệt kê boot 8ea1f5e3.
  **T4 KHÔNG tự gán số hiệu** — số hiệu + (m)
  thuộc T01/T2-203; parent quyết (e)-203.
  **(m) #135 THÔ = 1 requeue DƯƠNG trong cửa**
  (T01-203: eid 11744 requeued_after_restart
  23:07:35.568Z = btime+39,568 s, biên 10,232 s;
  phân loại CUỐI thuộc T2-203 + parent).
- **Check-only của T4:** FAIL lúc mở (23:54Z,
  replay chưa xong) → PASS từ poll #3 (gate0
  T5 từ poll #3, 23:55:42Z). F-200-T4-1 KHÔNG
  tái diễn (chờ repair theo thiết kế).
- **Watcher-203:** T4 không theo dõi trực tiếp
  trạng thái watcher — thuộc T56-203 báo cáo
  (replay-watch-203.sh pid 296433, START 23:53Z,
  boot 8ea1f5e3; watcher-202 chết theo reboot
  #135).
- **(m) boot 8ea1f5e3 THÔ 1 — phân loại CUỐI
  thuộc T2-203** (T4 không đo (m)).

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND203_T4_QUIET_LIMITS.md`.
- **Script snapshot để stage (trong repo
  `apps/web/scripts/` — md5 khớp bản làm việc ở
  `hidden_files/round203-t4/`):**
  `poll-wait-t4-203.sh` (09be5645), `run-attempt-203.sh`
  (329bea43), `run-analyzers-203.sh` (3fb8ded4),
  `distinct-seq-203.py` (7721788e).
  **KHÔNG stage lại probe** (byte-identical đợt
  148–202, md5 `4291e539…`), **`t4-attempt-inner.sh`
  / `check-classb-t4.sh`** (theo mẫu 149–202: chỉ
  stage 4 script trên), **`b.json`** (md5
  `078938cf…`) và **`stats-203.py`** (helper làm
  việc).
- **Script làm việc (hidden_files, không stage):**
  5 script T4 + 10 analyzer `analyze-t4-*.py` +
  `vite.t4-temp.config.mjs` + `b.json` + probe +
  `tree-md5.txt` (477a0eac) + `stats-203.py` +
  `distinct-seq-203.py` + `distinct-seq-ledger.json`
  (as-of-202, md5 `50f10815` — KHÔNG ĐỔI) +
  `distinct-seq-ledger-202.json` (cơ sở as-of-202)
  + `preflight-203.txt` + `preflight-postboot-203.log`
  + `round203-t4-copy.py`.
- **Log/evidence (hidden_files/round203-t4/, không
  stage):** `poll-t4.log` (33 poll + 3 lần CỬA
  MỞ #29/#30/#33), `poll-t4.nohup.log` +
  `poll-test-203.log` (1 test poll +
  TEST-POLL-OK exit 7), `chain-t4.log` (start
  poller + 3 lần CỬA MỞ + 3 attempt + poller
  thoát exit 11 00:33:38Z),
  `postboot-t4-203-gate0wait-*.log` (check-only
  mỗi 4 poll), `stats-203-output.txt`,
  `windows.md` (3 cửa sổ W1a/W1b/W1c),
  `preview-b-f3-flip-webkit-t4-attempt1-8ea1f5e3.json`
  (1.042.200 B, partial 11/20),
  `preview-b-f3-flip-webkit-t4-attempt2-8ea1f5e3.json`
  (2.935.449 B),
  `preview-b-f3-flip-webkit-t4-attempt3-8ea1f5e3.json`
  (1.847.705 B),
  `load-mid-t4-attempt*-8ea1f5e3.log` (sampler
  n=221/100/120),
  `analyze-t4-attempt*-8ea1f5e3-*.txt` (10 file
  mỗi attempt — gồm `p1p3p7` chạy TỰ ĐỘNG),
  `coverage-check-attempt*-8ea1f5e3.txt`
  (att1 (c2)=0; att2 4/4; att3 1/1),
  `classb-t4-attempt*-8ea1f5e3.txt`,
  `ps-before/after-t4-attempt*-8ea1f5e3.txt`,
  `dpkg-lines-before-` +
  `apt-history-before-attempt*-*.txt` (B4: dpkg
  777→777 cả 3 lần). **3 JSON attempt (0 hợp
  lệ). 0 process T4 sống lúc đóng** (poller
  thoát 00:33:38Z; vite :5187 kill, curl 000; 0
  Xvfb/MiniBrowser/WebProcess T4).

## 6. Sai số F-203-T4-1..6 + nợ cũ

- **F-203-T4-1 — ATTEMPT1 WEDGED (MỚI).** Renderer
  kẹt ở pass 12/20, pass-timeout 120 s
  wall-clock; cả 3 writePartial fetch TIMEOUT
  30 s; partial JSON 11/20 pass, exit=3. Đây là
  kẹt THẬT (stall) trong lúc đo yên — giao T8
  (V5 có bắt live không?) + T9. Tiền lệ:
  attempt2 đợt 195 PAGE-WEDGED (không tính
  verdict); đợt 202 không có attempt wedged.
- **F-203-T4-2 — ATTEMPT3 CHẬM TOÀN LƯỢT KHÔNG
  DO TẢI (MỚI).** tickCost median 117,0 ms cả
  20 pass (96–189 ms) trong khi sampler
  load1_max chỉ 1,11, load1 mean giảm 0,97 →
  0,25, RAM đủ (min 781 MB), lớp B 5/5 ĐẠT —
  chậm nội tại renderer/CPU (cell 1,5 CPU chia
  sẻ? throttle? suy giảm sau wedge attempt1?).
  Cùng boot cùng cây, attempt2 10 phút trước
  median chỉ 59,0 ms. Nợ điều tra đợt 204.
- **F-203-T4-3 — B2 SPIKE TỰ-TẢI Ở ATTEMPT2
  (MỚI).** load1_max 4,84 do chính
  WebKitWebProces (71,4% CPU) + MiniBrowser
  (28,9%) của probe T4 lúc 00:24:23Z — tiền lệ
  B2 #8 đợt 196 ("cả 3 cửa sổ đều spike
  tự-tải"). Probe tự đẩy mình vượt ngưỡng B2.
- **F-203-T4-4 — CHỒNG LẤN W1 CẢ 3 CỬA SỔ
  (MỚI).** W1a 9 file (T56/P1/P2/P3) + W1b 4
  file (T56/P2/P4) + W1c 15 file (T2 ×4 đầu
  cửa sổ; P1 .wav ×6 cuối cửa sổ 00:32:50–
  00:32:53Z; P1/P2 scratch/probe). Giao
  (p)-203. T4-203: 0 vi phạm.
- **F-203-T4-5 — RAM THẤP TRONG PHIÊN (MỚI).**
  Poll RAM min 892 MB (poll #8, 23:59:30Z);
  attempt3 sampler 24/120 mẫu <1024 MB (min
  781 MB); attempt1 sampler RAM min 657 MB.
  Cửa chỉ mở khi RAM hồi ≥1894 MB. Theo dõi
  đợt 204: nếu RAM tiếp tục kẹt <1024 MB, lượt
  yên sẽ khó mở cửa dù load thấp (nối
  F-202-T4-4).
- **F-203-T4-6 — LIVE-CHECK #22 KHÔNG ĐẠT
  (MỚI).** Không có cửa sổ hợp lệ → KHÔNG ĐẠT
  theo định nghĩa (p)-192; chuỗi live ĐẠT 1 →
  0 (ĐỀ XUẤT). B2 dữ kiện #15: KHÔNG CÓ W1 hợp
  lệ (W1a 32 spike, W1b 14 spike, W1c 0 spike).
- **Nợ cũ:** F-202-T4-1 → KHÔNG tái diễn (0
  reboot trong phiên); F-202-T4-2 → ĐÃ ĐƯỢC
  QUYẾT (m)-202: DEF §5 n≥4, P3-A1 n=3 → CHƯA
  KẾT LUẬN; attempt2 đợt này là minh chứng n=4
  ĐẠT p=0,0027 nhưng KHÔNG cộng vì lượt không
  hợp lệ; F-202-T4-3 → F-203-T4-4 (chồng lấn
  W1 tiếp diễn, cả 3 cửa sổ); F-202-T4-4 →
  F-203-T4-5 (RAM thấp kéo dài); F-202-T4-5 →
  KHÔNG tái diễn dạng sát biên ở lượt cuối
  (W1c load1_max 1,11 thoải mái — nhưng W1a/W1b
  spike vượt ngưỡng); F-202-T4-6 → F-203-T4-6
  (live KHÔNG ĐẠT trở lại); F-201-T4-1 →
  F-203-T4-6 (live ĐẠT trở lại ở 202 rồi đứt ở
  203); F-201-T4-2 → F-203-T4-1 (reboot KHÔNG
  xảy ra đợt này — wedge thay reboot làm yếu tố
  phá lượt); F-201-T4-3 → KHÔNG tái diễn (B1
  load5 cuối 1,01–2,14, thoải mái; median 4 pass
  cuối attempt3 không tăng — chậm đều cả lượt);
  F-201-T4-4 → F-203-T4-4 (T2 + T56 + P1/P2/P3/
  P4 ghi file trong W1; eperm-probe KHÔNG ghi
  trong W1 đợt này); F-201-T4-5 → đứng
  (launch-test chỉ với --launch-test); F-201-T4-6
  → KHÔNG tái diễn ((c2) attempt2=4, attempt3=1
  — vẫn 0 seq mới được cộng nhưng n>0);
  F-200-T4-1 → KHÔNG tái diễn (chờ repair theo
  thiết kế, gate0 T5 có sau đó); F-200-T4-4 →
  KHÔNG tái diễn (không thấy waiter T8 trong W1
  đợt này); F-199-T4-1 → KHÔNG tái diễn (header
  deadline đúng 01:30Z, test poll sạch);
  F-199-T4-4 → KHÔNG tái diễn (0 Chrome trong W1
  lúc ps-before); F-199-T4-7 → KHÔNG tái diễn
  ((c2) attempt2=4, attempt3=1); F-199-T4-8 →
  KHÔNG tái diễn (0 reboot trong phiên);
  F-199-T4-10 → KHÔNG tái diễn (blockers=0 ở cả
  3 poll mở cửa); F-199-T4-11 → KHÔNG tái diễn
  (0 file round202-* ghi trong W1).

## 7. P3' cộng dồn (GIỮ NGUYÊN — 56 lượt hợp lệ tổng; 44 lượt kỷ stall) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 203 (KHÔNG ĐỔI):
  P1 243/247, P2 238/238, P3-A1 207/247, P3'
  205/219 occurrence = 148/151 distinct-seq, P7
  141/141** (56 lượt hợp lệ tổng — #71 KHÔNG
  CÓ lượt hợp lệ nên KHÔNG cộng thêm seq nào;
  44 lượt trong kỷ stall từ đợt 139 theo
  `valid_rounds_p3` của sổ). Cơ sở: cộng dồn chỉ
  tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #71: KHÔNG CÓ.** Attempt2
  (c2) [135, 198, 219, 266] — P1 ĐÚNG 4/4, P2
  ĐÚNG 4/4, P3-A1 ĐÚNG 4/4 (p=0,0027), P3' ĐẠT
  4/4, P7 ĐÚNG — NHƯNG attempt không hợp lệ
  (B2 vi phạm) nên KHÔNG cộng. Attempt3 (c2)
  [208] — P1/P3-A1 YẾU (n=1), P3' ĐẠT 1/1, P7
  ĐÚNG — NHƯNG attempt không hợp lệ (tickCost)
  nên KHÔNG cộng. Attempt1 (c2)=0.
- **Seq MỚI được cộng: 0** (không có lượt hợp
  lệ). Sổ KHÔNG thăng cấp (giữ as-of-202, md5
  `50f10815`; không tạo bản đề xuất).
- **DEF §5 (quyết (m)-202) — ÁP DỤNG ĐỢT 203:**
  P3-A1 cấp lượt yêu cầu n≥4 cho phán p<0,01.
  Attempt2: n=4, 4/4 đóng băng-tại-tick,
  p=0,0027 < 0,01 → **ĐÚNG (minh chứng đầu
  tiên ngưỡng n=4 đạt được)** — nhưng chỉ ở
  mức quan sát (attempt không hợp lệ, không
  cộng dồn). Attempt3: n=1, 1/1 đóng băng-tại-
  tick, p=0,444 → **CHƯA KẾT LUẬN** (không phải
  SAI — đúng quyết (m)-202: ở n<4 không phán
  SAI/ĐÚNG cấp lượt). P1 cấp lượt vẫn theo DEF
  §3 (p<0,01 với n≥3): attempt2 P1 ĐÚNG (n=4,
  p=0,00063); attempt3 P1 YẾU (n=1).
- **Labellag (b) — CHUỖI TRƯỚC #71 = 3; #71
  (không có lượt hợp lệ) → chuỗi 0 occ 3 → 0
  (ĐỀ XUẤT)** — tiền lệ #64 đợt 196 (chuỗi đứt
  về 0 khi 0/3 hợp lệ; ở 196 chuỗi đang 0 nên
  ghi GIỮ 0).
- Chuỗi median tickCost 56 lượt (KHÔNG ĐỔI —
  không thêm lượt mới): 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 /
  40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 /
  41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 /
  53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 /
  40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 /
  43,5 / 45,0 / 39,0 / 42,0 / 42,0 / 53,0 /
  47,0 / 55,0 / 55,0 / 50,5 / 52,0 ms (tổng
  2673,5; TB 47,7 ms; min 39,0, max 60,0; 0
  lượt vượt 60).

## 8. Chờ quyết parent / nợ đợt 204

- **(a) #71 KHÔNG HỢP LỆ (0/3 attempt hợp lệ) —
  CHUỖI LƯỢT YÊN HỢP LỆ 3 → 0 ĐỨT (ĐỀ XUẤT —
  parent quyết cuối).** Chân lượt yên cho chuỗi
  FULL PASS **KHÔNG CÓ đợt này** (FULL PASS
  thuộc parent/T10 quyết cuối — chân O8 3/3
  cùng boot #135 đã ĐẠT theo T01-203).
- **(b) Live-check #22 KHÔNG ĐẠT (ĐỀ XUẤT) —
  chuỗi live ĐẠT 1 → 0. T9-203 xác nhận độc lập
  sau.**
- **(c) P3' cộng dồn GIỮ NGUYÊN 56 lượt: P1
  243/247, P2 238/238, P3-A1 207/247, P3'
  205/219 = 148/151, P7 141/141:** sổ
  distinct-seq KHÔNG thăng cấp (giữ as-of-202
  md5 `50f10815`). **Chờ parent/T10 quyết:** ghi
  nhận không thăng cấp.
- **(d) BOOT ĐO 8ea1f5e3 (btime 23:06:56Z; số
  hiệu #135 ứng viên — T01-203 survey 9 nguồn
  tươi; gap #134→#135 = 7.301 s; marker 85, 86
  nếu #135 xác nhận). POSTBOOT_PASS MỚI
  23:55:18Z (poll=1, repair-sớm-quyết-h, lists
  75) — caveat (b1)/(b2) thuộc parent quyết
  (c)-203. (m) #135 THÔ DƯƠNG (T01-203:
  +39,568 s, biên 10,232 s); phân loại CUỐI
  thuộc T2-203; parent quyết (e)-203.
  0 reboot trong phiên đo.
  (m) 8ea1f5e3 THÔ 1 (T2-203); INSIDE (T2-203).**
- **(e) PRE-FLIGHT CHECK (quyết (t) đợt 158)
  TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy
  tắc đứng.** Đợt này test poll sạch (0 chuỗi
  deadline sót), check-only FAIL lúc mở do
  replay chưa xong (chờ theo thiết kế, khác đợt
  200), gate0 T5 có sau repair.
- **(f) POSTBOOT_PASS MỚI 23:55:18Z (poll=1,
  repair-sớm-quyết-h) trên boot đo 8ea1f5e3.
  Tổng boot không cờ GIỮ NGUYÊN nếu parent
  chấp nhận (T01/T2-203 phán cuối).**
- **(g) RAM 0 poll <500 MB toàn phiên (min 892
  MB); sampler att1 RAM min 657 MB, att3 min
  781 MB, 24/120 mẫu att3 <1024 MB — không có
  episode RAM <500 MB trong W1; giao T9-203
  phán (nếu có).**
- **(h) (m) #135 (T2-203); INSIDE (T2-203);
  POSTBOOT_PASS mới 23:55:18Z (T56-203); số
  hiệu 8ea1f5e3 (T01-203 xác minh — parent
  quyết (e)-203); OUTAGE phán cuối T7-203;
  auto-trigger lần FIRE thật đầu tiên — VẪN
  CHƯA XẢY RA (T9-203); B2 dữ kiện #15 (BẢN
  NÀY); (m) #56 / mù hole-recheck / prune /
  headroom / ENOSPC / 84l10 / 86n2-P1 / B2 live
  sạch (T2/T7/T9-203 phán — T4 không nắm số
  chạy); E-247 kết cục (T9-203); run kết cục
  (T7-203).**
- **(i) B2 DỮ KIỆN #15: KHÔNG CÓ W1 HỢP LỆ
  (F-203-T4-6). Luật B2 KHÔNG TÁCH vẫn đứng
  cho tới khi parent quyết — T4 KHÔNG tự quyết
  tách. Auto-trigger LIVE chạy trong cả 3 cửa
  sổ attempt, 0 FIRE** — lần FIRE thật đầu tiên
  vẫn chưa xảy ra; T9-203 verify end-to-end khi
  có FIRE.
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate MỞ
  3 lần đợt này (attempt1/2/3) → **0 lượt yên
  hợp lệ #71 cho chuỗi FULL PASS.** O8 T01 trên
  #135: WebKit PASS ×2 + Chromium PASS 21/21
  (T01-203 báo cáo — chân O8 ĐẠT); O8 T8 +
  harness thuộc T8-203 báo cáo (test-vite-lock-
  v2.sh có mặt lúc ps-before W1 — xem §3).
- **(k) F-203-T4-1 (attempt1 wedged — kẹt thật
  pass 12/20); F-203-T4-2 (attempt3 chậm toàn
  lượt không do tải — tickCost median 117,0
  ms); F-203-T4-3 (B2 spike tự-tải attempt2 —
  WebKitWebProces 71,4%); F-203-T4-4 (chồng
  lấn W1 cả 3 cửa sổ — 9 + 4 + 15 file);
  F-203-T4-5 (RAM thấp kéo dài); F-203-T4-6
  (live #22 KHÔNG ĐẠT — chuỗi live ĐẠT 1 → 0
  đề xuất; B2 #15 KHÔNG CÓ W1 hợp lệ).**

## Phụ lục A — stats-203-output.txt (tóm tắt)

```
test: 1 poll, RAM 1454 >=1024: 1/1, load1<2: 0/1, gate0: khong-dat=1
poller boot 8ea1f5e3: 33 poll 23:54:11Z-00:28:56Z, RAM 892-3014 >=1024: 32/33
  <500: 0/33, load1<2: 16/33, load5<2: 3/33, gate0: T5=31, khong-dat=2
  lock: co=5 (T01-203 O8 polls #4-#8), khong=28, dpkg 2->777
TONG: 34 dong poll; RAM min=892 max=3014 >=1024: 33/34 <500: 0/34
gan-mo (3 dk load/RAM): 3 = 3 mo cua that (#29, #30, #33)
P3' (56 luot): P1 243/247 P2 238/238 P3-A1 207/247 P3' 205/219 = 148/151 P7 141/141
median 56 luot: n=56 mean=47,7 min=39,0 max=60,0 vuot-60: 0
```
