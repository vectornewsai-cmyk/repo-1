# PHASE9_ROUND202_T4_WEBKIT_QUIET70_LIMITS.md

**Đợt:** 202. **Luồng:** T4 — đo lượt yên WebKit #70 trên boot
bd22dffd — 1 attempt, 1 LƯỢT HỢP LỆ
+ **#70 HỢP LỆ — attempt1 20/20 + lớp B ĐẠT 5/5 + tickCost
  median 52,0 ms ≤ 60.** Ngân sách dùng 1/3; poller thoát
  21:37:13Z (theo thiết kế: có lượt hợp lệ thì dừng).
  **Chuỗi lượt yên hợp lệ 2 → 3 (ĐỀ XUẤT — parent quyết cuối)**
  — lượt hợp lệ thứ ba liên tiếp (#68, #69, #70).
+ **BOOT ĐO: bd22dffd (btime 21:05:15Z theo uptime -s /
  21:05:28Z theo /proc/1 — lệch 13 s).** POSTBOOT_PASS
  round202-t56 CÓ 21:28:09Z (poll=1, repair-sớm-quyết-h,
  dpkg 777, cache 108, lists 66 — cùng hồ sơ #130/#131 về
  dpkg/cache; lists 66 khác 75 của boot trước).
  **Số hiệu boot: T01-202 survey ghi "#133 candidate" —
  T4 KHÔNG tự gán số hiệu; parent quyết (e)-202.**
+ **REBOOT GIỮA PHIÊN ĐO (F-202-T4-1): boot 05bda90d chết
  21:05:15Z (khung 21:05:44–21:06:16Z); poller chết theo
  reboot, T4 khởi động lại thủ công 21:06:51Z. 0 attempt
  trên boot cũ (30 poll, 0 lần cửa mở — load5 kẹt
  2,75–4,80).**
+ **P3' CỘNG DỒN MỚI (56 lượt hợp lệ tổng; 44 lượt kỷ stall):
  P1 243/247, P2 238/238, P3-A1 207/247, P3' 205/219 occ =
  148/151 distinct-seq, P7 141/141.** Seq MỚI: 0 (174, 212,
  433 đều đã thấy). Sổ thăng cấp as-of-202, md5 `50f10815`
  (cơ sở as-of-201 `ad243797` giữ nguyên). Labellag (b):
  0 occ → **chuỗi 0 occ 2 → 3 (ĐỀ XUẤT)**.
+ **LIVE-CHECK #21: ĐẠT (ĐỀ XUẤT — chuỗi live ĐẠT 0 → 1).**
  1 cửa sổ hợp lệ (W1) VÀ **0 spike B2 trong W1**; 3 mẫu
  autotrigger đều watch/consec=0, 0 FIRE, max avail
  1.124.316 kB < guard. T9-202 xác nhận độc lập sau.
+ **B2 DỮ KIỆN #14 (cách đếm (j)-200: mỗi đợt = 1): W1
  0 SPIKE** (21:33:13–21:36:42Z, boot bd22dffd; sampler T4
  khớp: load1 max 2,98 < 3,0).
+ **W1-ACTIVE (nhiệm vụ bắt buộc T4 đợt 202): tạo
  21:33:13Z (cùng marker), xóa 21:36:47Z (ngay sau inner
  kết thúc; trap EXIT dự phòng). Kiểm lúc đóng: file
  KHÔNG còn tồn tại.**
+ **FULL PASS: chân lượt yên CÓ đợt này** (lượt hợp lệ thứ
  ba liên tiếp); chân O8 + harness thuộc T01/T8-202 báo cáo.
**Ngày:** 27/11/2026 (lượt cron 03:35 +07 28/11 = 20:35:51Z).
**Boot đo:** bd22dffd (1 test + 30 poller boot cũ + 36 poller
boot mới).

## 0. Verdict tổng

- **#70 HỢP LỆ — attempt1-bd22dffd: 20/20, (c2) [174, 212,
  433], coverage 3/3, lớp B ĐẠT 5/5, tickCost median 52,0 ms.**
  P1 ĐÚNG (3/3, p=0,0039); P2 ĐÚNG 3/3 (lag +1f cả ba);
  P3-A1 **SAI cấp lượt** (3/3 đóng băng-tại-tick nhưng
  p=0,0169 ≥ 0,01 — xem F-202-T4-2); **P3' ĐẠT 3/3**
  (stall 5, 5, 4); P7 ĐÚNG (0 entry trễ ≥+1f). **Chuỗi lượt
  yên 2 → 3 (ĐỀ XUẤT).**
- **(c2) cộng sổ:** 174 + 212 + 433 đều đã thấy → distinct
  148/151 KHÔNG ĐỔI, occ 202/216 → 205/219. Sổ đã thăng cấp
  as-of-202 (md5 `50f10815`; kiểm tay: cả ba seq có trong
  cả hai seen-list cơ sở, non_dat [260, 364, 498] KHÔNG ĐỔI).
  Labellag (b): 0 occ / 0 event ≥5f → **chuỗi 0 occ 2 → 3
  (ĐỀ XUẤT)**.
- **B2 DỮ KIỆN #14: W1 0 SPIKE — live-check #21 ĐẠT
  (ĐỀ XUẤT)** — chuỗi live ĐẠT 0 → 1. Lần đầu live ĐẠT kể
  từ #19 (đợt 200).
- **0 VI PHẠM PHÍA T4** (không script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; check-only
  postboot mỗi 4 poll là dự phòng được quyết; launch-test
  riêng KHÔNG chạy đợt này — F-201-T4-5 đứng).
  Chồng lấn ghi nhận trong W1: **T2-202 ghi 3 file +
  T56-202 ghi 2 file trong W1 (F-202-T4-3)**; waiter T8 +
  sampler live T9 (daemon đứng — theo (p)-200 KHÔNG VI
  PHẠM) — xem §3.
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `477a0eac`
  (KHÔNG ĐỔI so với đầu đợt — 0 lần cập nhật tree-md5).
- **Cờ:** `hidden_files/round202-t4.done` viết lúc đóng, CÓ
  NỘI DUNG. **Boot lúc viết cờ là bd22dffd — CÙNG boot đo.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-201-T4-5)

Chạy **trước mọi attempt, trước khi mở poller** (20:43Z),
ghi vào `hidden_files/round202-t4/preflight-202.txt`.

- **md5 khớp hệt bản đợt 201:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-201 md5
  `ad243797` (occ 202/216, distinct 148/151,
  valid_rounds_p3 43, non_dat_in_union [260, 364, 498]).
  **Tree:** preview.tsx lúc mở poller là `477a0eac` (đọc
  trực tiếp ~20:43Z; KHÔNG ĐỔI so với cuối đợt 201).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; media
  `stripes-nonperiodic.mp4` có mặt (140.828 B); không có
  `vite.lock`, không có `attempt-done-*`. **Playwright-core
  (npm): KHÔNG tìm thấy** (như đợt 201 — launch test dùng
  MiniBrowser trực tiếp).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-27
  22:30:00 UTC` → **1795818600** (hạn cờ ~23:00Z =
  1795820400, hạn cứng 23:35:51Z = 1795822551); test poll
  header deadline đúng `22:30:00Z` — 0 chuỗi sót (F-199-T4-1
  KHÔNG tái diễn).
- **Copy-forward 201 → 202 (script python thay thế có neo,
  KHÔNG sed global):** deadline `16:30Z 27/11` → `22:30Z
  27/11`; hạn cờ/cứng → `23:00Z`/`23:35:51Z`; T5FLAG chính
  `round202-t56/` + fallback `round201-t56/`; `T4-201a` →
  `T4-202a`; `WebKit #69` → `#70`; glob `round200-*` →
  `round201-*`. Lỗi neo 0 lần. **WIRE p1p3p7 ĐÃ CÓ SẴN
  trong run-analyzers-201.sh — chỉ assert (1 lần), KHÔNG
  chen lại.**
  **W1-ACTIVE ĐÃ WIRE vào run-attempt-202.sh (MỚI — nhiệm
  vụ T4 đợt 202):** tạo ngay sau `touch marker` (ghi giờ +
  boot + tag), xóa ngay sau LOCKV2 trả về + trong trap EXIT
  (dự phòng khi script chết bằng mọi đường trừ SIGKILL).
  `bash -n` OK sau sửa.
- **`cp` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 201).
- **Freeze check (F-164-T4-1):** `round201-t4` còn **0 file
  làm việc** mtime ≥ 20:35:51Z (đợt 202 mở).
- **GATE0 LÚC MỞ: T5 CHƯA CÓ + CHECK-ONLY FAIL.**
  round202-t56/ `replay-watch-202.sh` đang chạy (pid 4676,
  từ 20:42Z) nhưng POSTBOOT_PASS chưa có; fallback
  round201-t56/ POSTBOOT_PASS là của boot CŨ 7d642f2a
  (15:12:20Z) — KHÔNG khớp boot hiện tại 05bda90d.
  **Check-only postboot chạy tay exit=1 FAIL** (xem
  `preflight-postboot-202.log`): GST thiếu isomp4/libav,
  apt thiếu 11 package — replay đang cài dần. Poller chờ
  theo thiết kế (như đợt 200: T56 repair xong mới mở cửa).
  F-200-T4-1 KHÔNG tái diễn (đây là chờ repair, không phải
  thiếu sót).
- **F-201-T4-5 đứng:** launch-test chỉ chạy khi có cờ
  `--launch-test`; gate0wait không có dòng launch là đúng
  thiết kế. **Launch-test riêng KHÔNG chạy đợt này**;
  launch chứng minh bằng attempt1 20/20 trên WebKit 27.2.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG** — 0 X server đang
  chạy.
- **RAM lúc mở ~904–956 MB avail (20:40–20:43Z — các luồng
  khác đang chạy nặng); load1 ~1,87–2,35 lúc mở.** Poller
  chờ gate A đúng thiết kế.
- **T9-202 đã chạy lúc T4 mở:** `b2watch.sh` (pid 3994,
  từ 20:41Z) + `sampler-autotrigger.py --live --round-dir
  round202-t9/autotrigger-live` (pid 3993, từ 20:41Z) —
  dữ kiện B2/live có sẵn.
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 67 poll thật (1 test + 30 poller boot cũ + 36 poller boot mới), 1 lần cửa mở, 1 reboot giữa phiên

- **Test (POLL_TEST=1), 1 poll, boot 05bda90d
  (20:43:38Z):** RAM 905 MB, load1 1,73/load5 1,57,
  lock=khong, blockers=0, gate0=khong-dat (T5 cu + postboot
  exit=1), t5flag=cu, apt=0, dpkg 2 →
  **TEST-POLL-OK exit 7 đúng thiết kế.** Header deadline
  đúng 22:30:00Z — 0 chuỗi sót.
- **Poller instance 2 — boot 05bda90d, 30 poll
  (20:43:39–21:05:44Z), 0 lần cửa mở:** RAM ≥1024:
  **26/30** (min 457, max 2032 MB); **<500: 1/30**;
  load1<2: 11/30; load5<2: **6/30**; gate0:
  **T5 20/30** (POSTBOOT_PASS round202-t56 ghi 20:50:33Z,
  poll=1, repair-sớm-quyết-h — từ poll #11), khong-dat 10;
  lock=co 4 (T01-202 giữ lock pid 13832 port 5560, polls
  #5–#7 + t01-round202-probe pid 29033 poll #10 — O8),
  khong 26; blockers>0: 3 poll; apt>0: 4 poll; dpkg 2→777.
  **Cửa KHÔNG mở lần nào: load5 kẹt 2,75–4,80 trong suốt
  instance (các luồng khác chạy nặng).**
- **REBOOT 21:05:15Z (F-202-T4-1).** Boot mới bd22dffd,
  btime 21:05:15Z (uptime -s) / 21:05:28Z (/proc/1) — lệch
  13 s. Khung chết boot cũ: poll #30 21:05:44Z (boot cũ
  vẫn sống lúc poll) → T4 phát hiện boot mới 21:06:16Z.
  **Poller chết theo reboot** (process không sống qua
  reboot); T4 khởi động lại thủ công 21:06:51Z (pid 1874).
  T9 daemon + T56 replay-watch cũng chết theo reboot và
  tự khởi động lại 21:07Z (b2watch pid 2049, sampler pid
  2048, replay-watch pid 2113). **0 attempt nào đã chạy
  trước reboot nên không mất lượt nào.**
- **Poller instance 3 — boot bd22dffd, 36 poll
  (21:06:51–21:33:13Z), 1 lần cửa mở:** RAM ≥1024:
  **11/36** (min 404, max 1508 MB); **<500: 1/36**;
  load1<2: 27/36; load5<2: **36/36**; gate0:
  **T5 7/36** (POSTBOOT_PASS mới ghi 21:28:09Z, poll=1,
  repair-sớm-quyết-h — từ poll #30), khong-dat 29;
  lock=khong 36/36; blockers>0: 0 poll; apt>0: 29 poll
  (replay đang cài tới poll #29); dpkg 2→777.
- **Cửa mở 1 lần (poll #36 instance 3, 21:33:13Z):** RAM
  1057 MB, load1 1,83, load5 1,33, lock=khong, blockers=0,
  apt=0, gate0=T5 (POSTBOOT_PASS round202-t56 ghi
  21:28:09Z) → **CỬA YÊN MỞ**, attempt1 chạy. Poller thoát
  sau attempt1 hợp lệ (21:37:13Z) — không cần poll tiếp.
- **Phân rã 67 dòng poll thật (1 test + 30 + 36):**
  RAM≥1024: 37/67; RAM<500: **2/67** (457 MB instance 2,
  404 MB instance 3). load1<2: 39/67; load5<2: 43/67.
  **"gan-mo" (3 điều kiện load/RAM): 9** = 1 lần mở cửa
  thật (#36 instance 3) + 8 lần kẹt gate0/lock/apt/RAM
  (#5, #6 instance 2; #3, #6, #7, #21, #28, #29 instance
  3). gate0: T5=27, khong-dat=40. blockers>0: 3 poll.
  apt>0: 33 poll. dpkg 2→777 (cả hai boot).

## 2. Attempt — 1 attempt (ngân sách dùng 1/3), 1 lượt hợp lệ

- **attempt1-bd22dffd: 20/20 + LỚP B ĐẠT 5/5 + tickCost
  median 52,0 ms — HỢP LỆ.** Cửa sổ: marker 21:33:13Z →
  attempt-done 21:36:47Z (inner-end 21:36:42Z,
  probe_exit=0; run-attempt exit=0 21:36:47Z; analyzers chạy
  NGOÀI cửa sổ 21:36:47–21:37:13Z). JSON 3.256.940 B; flip
  wallMs 28.913 ms; lock vite giữ 214 s, nhả 21:36:47Z;
  vite :5187 kill sạch (curl 000); sampler dừng sạch
  (103 dòng = 102 mẫu + 1 header). **0 writePartial TIMEOUT**
  (grep "timeout" run-webkit log = 0; probe_exit=0).
  **tickCost:** tổng n=590 median **52,0** p90 76,0 max
  151 min 29; hậu flip+2000ms n=427 median 53,0.
  BlendTick/pass 23,9; rAF/pass median 34 (31–40).
  webkit=27.2, pageErrs=[].
  **Lớp B: B1 ĐẠT** (load5 cuối 1,29); **B2 ĐẠT (load1_max
  2,98)**; B3 ĐẠT; **B4 ĐẠT (dpkg delta 0)**; **B5 ĐẠT (RAM
  min 557 MB, 0 mẫu <500; 55/102 mẫu <1024 — cảnh báo)**.
  **(c2) = 3 seq [174, 212, 433]** (lag +1f cả ba) → P3'
  cộng sổ (xem §7). **P1 ĐÚNG** (3/3, p=0,0039);
  **P2 ĐÚNG 3/3** (lag +1f: 1, 1, 1); **P3-A1 SAI cấp lượt**
  (3/3 đóng băng-tại-tick, p=0,0169 — xem F-202-T4-2);
  **P3' ĐẠT 3/3** (stall 5, 5, 4);
  **P7 ĐÚNG** (0 entry trễ ≥+1f; đối chứng 0/426).
  **Labellag (b): 0 occurrence ≥5f** (cả hai chiều) —
  **chuỗi 0 occ 2 → 3 (ĐỀ XUẤT)**.
  **Perpass (20 pass):** median 47,0/45,0/47,5/57,0/49,0/
  52,5/57,5/62,0/58,0/53,0/51,0/49,0/42,0/55,0/50,0/43,5/
  54,0/55,0/49,5/52,5 — **không còn tăng cuối lượt** (4
  pass cuối 54,0/55,0/49,5/52,5 ms, ngang median chung —
  F-201-T4-3 KHÔNG tái diễn). RAM mean rơi 649 → 660 MB
  (thấp nhưng ổn định, không rơi sâu như đợt 201);
  load1 mean 2,56 → 2,17. Tương quan median~load1_mean
  r=−0,03; median~RAM_mean r=0,11 (chỉ mô tả — không kết
  luận nhân quả từ 1 lượt).
- **Ngân sách dùng 1/3; poller thoát 21:37:13Z (có lượt
  hợp lệ — theo thiết kế).** W2/W3 KHÔNG CHẠY.

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn + W1-ACTIVE

- **KIỂM B2 — DỮ KIỆN #14 (cách đếm (j)-200: mỗi đợt = 1):
  W1 0 SPIKE.** Watcher T9 (b2watch.sh, poll load1 mỗi
  2 s, ghi spike khi load1 ≥ 3,0; mỗi spike ghi boot_id):
  **W1: 0 spike** (21:33:13–21:36:42Z, boot bd22dffd).
  Sampler T4 xác nhận độc lập: load1_max 2,98 **< 3,0**
  (chỉ dưới ngưỡng 0,02 — SÁT BIÊN; xem F-202-T4-5).
  Watcher sống suốt W1 (spike gần nhất trước W1 21:25:36Z
  load1 3,16; spike đầu sau W1 chưa có lúc kiểm 21:43Z —
  T9-202 báo cáo tổng cuối). Tổng log T9 lúc kiểm: 137
  spike (126 trên 05bda90d + 11 trên bd22dffd) — tất cả
  NGOÀI W1. Chỉ 1 cửa sổ đợt này (poller thoát sau lượt
  hợp lệ) nên dữ kiện #14 = W1 0 spike. T4 chỉ báo số,
  KHÔNG tự quyết tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CỬA SỔ ATTEMPT, 0 FIRE.**
  Live `dry_run=False guard=6291456 consec=2` (T9-202).
  Mẫu autotrigger trong cửa sổ (marker → inner-end):
  3 mẫu 21:34:02/21:35:02/21:36:02Z (avail 838.156–
  1.124.316 kB, load1 0,72–2,49) — **trigger=watch,
  consec=0 ở tất cả các mẫu: 0 FIRE / 0 WOULD-FIRE.**
  RAM avail cao nhất trong cửa sổ: 1.124.316 kB (~1,07 GB)
  lúc 21:36:02Z — vẫn < guard 6.291.456 kB. (Mẫu 21:33:02Z
  nằm 11 s TRƯỚC marker nên KHÔNG tính vào W1.)
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 21: ĐẠT
  (F-202-T4-6, ĐỀ XUẤT — chuỗi live ĐẠT 0 → 1).** Áp ĐÚNG
  định nghĩa (p)-192 như đã áp ở #14 (đợt 195), #16 (đợt
  197), #19 (đợt 200) và #20 (đợt 201) — đợt này **CÓ 1
  cửa sổ hợp lệ (W1) VÀ 0 spike B2** nên ĐẠT. Đây là lần
  live ĐẠT đầu tiên kể từ #19 (đợt 200). T9-202 xác nhận
  độc lập sau (T9 chưa đóng lúc T4 đóng).
- **W1-ACTIVE (nhiệm vụ bắt buộc T4 đợt 202): tạo
  21:33:13Z** (cùng lúc marker, nội dung ghi giờ + boot +
  tag attempt1-bd22dffd), **xóa 21:36:47Z** (ngay sau
  LOCKV2 trả về; trap EXIT là dự phòng thứ hai). **Kiểm
  lúc đóng: file KHÔNG còn tồn tại** (ls round202-t4 chỉ
  còn marker + attempt-done). W1 thực: marker 21:33:13Z →
  inner-end 21:36:42Z (run-attempt exit 21:36:47Z).
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (kiểm file
  hidden_files mtime trong cửa sổ 21:33:13–21:36:47Z,
  loại round202-t4):**
  **W1 (marker → run-attempt exit):**
  **(1) T2-202 GHI 3 FILE TRONG W1 (F-202-T4-3):**
  `round202-t2/blind202-outside.txt` mtime 21:33:13.597Z
  (cùng giây với marker), `blind202-merged.py` +
  `blind202-content.py` mtime 21:34:04Z (ps-before: T2
  `blind202-gen.py` đang chạy). **(2) T56-202 GHI 2 FILE
  TRONG W1 (F-202-T4-3):** `round202-t56/
  gate-monitor-202-suite2.nohup.log` mtime 21:33:17Z,
  `suite-202-bd22dffd-partial.log` mtime 21:34:39Z.
  Giao T2/T56/parent phán (p)-202 (theo quy tắc tinh chỉnh
  (p)-200: ghi file hay workload nặng trong cửa sổ mới
  tính). **0 file round201-* nào bị sửa trong W1** (check
  glob đợt trước trong t4-attempt-inner.sh — kết quả
  trống).
  **ps-before W1: 0 Chrome / 0 node tsc-test / 0 vite
  preview** (không phải của T4). Có mặt: `test-vite-lock-
  v2.sh` ×3 + `vcut-vite-lock-v2.sh acquire tB` (T8 —
  kiểm tra lock, không ghi file nào trong W1 theo kiểm
  mtime trên), `find /home/hatch ... -newermt ...`
  (T10-202 đếm file — đọc, không ghi), sampler live T9
  (daemon đứng), `blind202-gen.py` của T2 (xem (1)).
  ps-after W1: chỉ esbuild service + vite :5187 của
  chính T4 (đã kill sau đó).
  **Waiter T8 trong W1:** không thấy launcher wait-t4-t5
  trong ps-before/after đợt này (khác đợt 200/201 — T8
  chưa spawn waiter lúc T4 đo, hoặc waiter đã thoát).
  **Sampler live T9 trong W1:** `b2watch.sh` (pid 2049)
  + `sampler-autotrigger.py --live` (pid 2048) — daemon
  đứng, mẫu mỗi 60 s / poll load1 mỗi 2 s (chính là nguồn
  số live + B2 §3 trên); theo (p)-200 KHÔNG VI PHẠM.
- **T56 REPAIR — 0 CHỒNG TRONG W1** (POSTBOOT_PASS
  bd22dffd ghi 21:28:09Z, 5 phút TRƯỚC marker; dpkg
  delta 0 trong cửa sổ; apt=0 ở poll #36). Verify trước cửa
  attempt đầu — KHÔNG tính vi phạm (tiền lệ (p)-199).
- **Ghi trong cửa sổ attempt: CHỈ CÓ GHI CỦA T2-202 +
  T56-202 (xem trên).** `run-analyzers-202.sh` chạy
  NGOÀI cửa sổ (21:36:47–21:37:13Z).

## 4. Replay/postboot + reboot giữa phiên

- **Boot 05bda90d (btime 20:32:07Z/20:32:25Z lệch 18 s) —
  POSTBOOT_PASS MỚI ĐÃ CÓ 20:50:33Z** (T56-202; T4 chỉ ghi
  nhận): "boot 05bda90d (btime 2026-11-27 20:32:07Z;
  watcher-202) — repair-som-quyet-h: dpkg 777 dong; cache
  108 .deb; lists 75; postboot PASS poll1 doc lap exit 0
  luc 2026-11-27T20:50:33Z; POSTBOOT_PASS moi ghi
  2026-11-27T20:50:33Z poll=1 (repair-som-quyet-h); co cu
  7d642f2a luu POSTBOOT_PASS-7d642f2a". **0 attempt trên
  boot này; boot chết 21:05:15Z.** Số hiệu boot này +
  caveat (b1)/(b2) thuộc T01-202/parent quyết (e)-202.
- **Boot bd22dffd (btime 21:05:15Z/21:05:28Z lệch 13 s) —
  POSTBOOT_PASS MỚI ĐÃ CÓ 21:28:09Z** (T56-202; T4 chỉ ghi
  nhận): "boot bd22dffd (btime 2026-11-27 21:05:15Z;
  watcher-202) — repair-som-quyet-h: dpkg 777 dong; cache
  108 .deb; lists 66; postboot PASS poll1 doc lap exit 0
  luc 2026-11-27T21:28:09Z; POSTBOOT_PASS moi ghi
  2026-11-27T21:28:09Z poll=1 (repair-som-quyet-h); co cu
  05bda90d luu POSTBOOT_PASS-05bda90d". **Cùng hồ sơ
  #130/#131 về dpkg/cache — nhưng lists 66 (khác 75 của
  boot trước).** Caveat (b1)/(b2) thuộc parent quyết (c)-202.
- **T01-202 survey:** script `boot-survey-202t01.sh` ghi
  "#133 candidate (fresh)"; file survey liệt kê boot
  05bda90d. **T4 KHÔNG tự gán số hiệu cho 05bda90d hay
  bd22dffd** — số hiệu + (m) thuộc T01/T2-202; parent
  quyết (e)-202.
- **Check-only của T4:** FAIL lúc mở (20:43Z, replay chưa
  xong) → PASS từ poll #13 instance 2 (gate0wait, postboot
  exit=0 từ poll #33 instance 3 trở đi sau khi T5 flag
  mới có — thực tế gate0=T5 từ poll #30 instance 3).
  F-200-T4-1 KHÔNG tái diễn (chờ repair theo thiết kế).
- **Watcher-202:** T4 không theo dõi trực tiếp trạng thái
  watcher — thuộc T56-202 báo cáo (watcher chết theo
  reboot 21:05:15Z, spawn lại 21:07Z — T56 xác minh).
- **(m) boot bd22dffd THÔ 0 — phân loại CUỐI thuộc T2-202**
  (T4 không đo (m)).

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND202_T4_QUIET_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round202-t4/`):**
  `poll-wait-t4-202.sh` (b22f8a71), `run-attempt-202.sh`
  (17052352 — gồm wire W1-ACTIVE mới), `run-analyzers-202.sh`
  (edaee532), `distinct-seq-202.py` (8177cb42).
  **KHÔNG stage lại probe** (byte-identical đợt 148–201,
  md5 `4291e539…`), **`t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (theo mẫu 149–201: chỉ stage 4
  script trên), **`b.json`** (md5 `078938cf…`) và
  **`stats-202.py`** (helper làm việc).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (477a0eac) +
  `stats-202.py` + `distinct-seq-202.py` +
  `distinct-seq-ledger.json` (as-of-202, md5 `50f10815`) +
  `distinct-seq-ledger-202-proposed.json` (bản đề xuất, audit
  trail) + `distinct-seq-ledger-201.json` (cơ sở as-of-201,
  md5 `ad243797` KHÔNG ĐỔI) + `preflight-202.txt` +
  `preflight-postboot-202.log` + `round202-t4-copy.py`.
- **Log/evidence (hidden_files/round202-t4/, không stage):**
  `poll-t4.log` (30 poll boot cũ + 36 poll boot mới +
  1 lần CỬA MỞ #36 instance 3),
  `poll-t4.nohup.log` + `poll-t4-restart.nohup.log`
  (poller instance 2 chết theo reboot; instance 3 khởi
  động lại 21:06:51Z),
  `poll-test-202.log` (1 test poll +
  TEST-POLL-OK exit 7), `chain-t4.log` (start poller +
  reboot + 1 lần CỬA MỞ + 1 attempt + poller thoát
  21:37:13Z),
  `postboot-t4-202-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-202-output.txt`,
  `windows.md` (công bố sớm giờ cửa sổ — W1 thực
  21:33:13–21:36:42Z),
  `preview-b-f3-flip-webkit-t4-attempt1-bd22dffd.json`
  (3.256.940 B),
  `load-mid-t4-attempt1-bd22dffd.log` (103 dòng = 102 mẫu
  + 1 header),
  `analyze-t4-attempt1-bd22dffd-*.txt` (10 file — gồm
  `p1p3p7` chạy TỰ ĐỘNG),
  `coverage-check-attempt1-bd22dffd.txt` (3/3, (c2)=3),
  `classb-t4-attempt1-bd22dffd.txt`,
  `ps-before/after-t4-attempt1-bd22dffd.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt1-*.txt`
  (B4: dpkg 777→777). **1 JSON attempt (1 hợp lệ).
  0 process T4 sống lúc đóng** (poller thoát 21:37:13Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4 — socket `/tmp/.X11-unix/X193` còn lại lúc đóng là
  stale của attempt, như mẫu đợt 200).

## 6. Sai số F-202-T4-1..6 + nợ cũ

- **F-202-T4-1 — REBOOT GIỮA PHIÊN ĐO (MỚI).** Boot
  05bda90d chết 21:05:15Z sau 30 poll (0 lần cửa mở);
  poller + T9 daemon + T56 replay-watch đều chết theo
  reboot; T4 khởi động lại poller thủ công 21:06:51Z trên
  boot mới bd22dffd (36 poll, 1 lần mở cửa, 1 lượt hợp
  lệ). 2 boot trong 1 đợt — parent quyết (e)-202 về số
  hiệu + caveat.
- **F-202-T4-2 — P3-A1 SAI CẤP LƯỢT LẦN ĐẦU Ở n=3 (MỚI).**
  3/3 seq đóng băng-tại-tick nhưng p=0,0169 ≥ 0,01 nên
  verdict SAI theo luật DEF §5 (ĐÚNG đòi p<0,01; YEU chỉ
  khi n<3). **Ngưỡng ĐÚNG không đạt được với n=3 ở
  baseline hiện tại:** p(3/3 | baseline 0,2566) =
  0,2566³ ≈ 0,0169 > 0,01 — ngay cả 3/3 hoàn hảo cũng
  không qua; cần n≥4 (0,2566⁴ ≈ 0,0043). Đây là giới hạn
  của thước kiểm định, không phải của dữ liệu (per-
  occurrence 3/3 đều ĐÚNG nên cộng dồn P3-A1 vẫn +3/+3
  theo tiền lệ đợt 200/201). Giao parent/T10 xem xét có
  chỉnh ngưỡng DEF §5 cho n=3 hay không.
- **F-202-T4-3 — T2-202 GHI 3 FILE + T56-202 GHI 2 FILE
  TRONG W1 (MỚI).** T2: `blind202-outside.txt`
  21:33:13.597Z (cùng giây marker), `blind202-merged.py`
  + `blind202-content.py` 21:34:04Z. T56: `gate-monitor-
  202-suite2.nohup.log` 21:33:17Z, `suite-202-bd22dffd-
  partial.log` 21:34:39Z. Giao T2/T56/parent phán (p)-202.
- **F-202-T4-4 — RAM THẤP KÉO DÀI TRÊN BOOT MỚI (MỚI).**
  Boot bd22dffd: 24/36 poll RAM <1024 MB (min 404 MB);
  trong W1 55/102 mẫu sampler <1024 MB (min 557 MB).
  Cửa chỉ mở khi RAM hồi lên 1057 MB ở poll #36. Theo
  dõi đợt 203: nếu RAM tiếp tục kẹt <1024 MB, lượt yên
  sẽ khó mở cửa dù load thấp.
- **F-202-T4-5 — B2 SÁT BIÊN (MỚI).** load1_max trong W1
  2,98 — chỉ dưới ngưỡng spike 3,0 có 0,02. Live #21 ĐẠT
  nhờ 0 spike, nhưng biên mong manh: cùng probe đợt 201
  đẩy load1 lên 3,66. Theo dõi đợt 203.
- **F-202-T4-6 — LIVE-CHECK #21 ĐẠT (MỚI).** 1 cửa sổ hợp
  lệ + 0 spike B2 → ĐẠT theo định nghĩa (p)-192; chuỗi
  live ĐẠT 0 → 1 (ĐỀ XUẤT). Lần live ĐẠT đầu tiên kể từ
  #19 (đợt 200).
- **Nợ cũ:** F-201-T4-1 → F-202-T4-6 (live ĐẠT trở lại;
  B2 dữ kiện #14: 0 spike); F-201-T4-2 → F-202-T4-1
  (reboot LẠI xảy ra — lần này GIỮA phiên đo, trước
  attempt); F-201-T4-3 → KHÔNG tái diễn (B1 load5 cuối
  1,29, thoải mái; median 4 pass cuối không tăng);
  F-201-T4-4 → F-202-T4-3 (T2 + T56 ghi file trong W1;
  eperm-probe KHÔNG ghi trong W1 đợt này); F-201-T4-5 →
  đứng (launch-test chỉ với --launch-test); F-201-T4-6 →
  KHÔNG tái diễn ((c2)=3, vẫn 0 seq mới nhưng n=3);
  F-200-T4-1 → KHÔNG tái diễn (chờ repair theo thiết
  kế, gate0 T5 có sau đó); F-200-T4-4 → KHÔNG tái diễn
  (không thấy waiter T8 trong W1 đợt này); F-199-T4-1 →
  KHÔNG tái diễn (header deadline đúng 22:30Z, test poll
  sạch); F-199-T4-4 → KHÔNG tái diễn (0 Chrome trong W1
  lúc ps-before); F-199-T4-7 → KHÔNG tái diễn ((c2)=3);
  F-199-T4-8 → F-202-T4-1 (reboot giữa phiên — khác đợt
  199: reboot xảy ra TRƯỚC khi poller thoát);
  F-199-T4-10 → KHÔNG tái diễn (blockers=0 ở poll mở
  cửa); F-199-T4-11 → KHÔNG tái diễn (0 file round201-*
  ghi trong W1).

## 7. P3' cộng dồn (MỚI — 56 lượt hợp lệ tổng; 44 lượt kỷ stall) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 202 (MỚI): P1 243/247, P2 238/238,
  P3-A1 207/247, P3' 205/219 occurrence = 148/151
  distinct-seq, P7 141/141** (56 lượt hợp lệ tổng — #70 CÓ
  lượt hợp lệ nên cộng thêm 3 seq; 44 lượt trong kỷ stall
  từ đợt 139 theo `valid_rounds_p3` của sổ). Cơ sở: cộng
  dồn chỉ tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #70 (attempt1): (c2) 3 occ [174, 212,
  433]; P1 ĐÚNG 3/3 (gần run-end, p=0,0039 — verdict ĐÚNG
  theo luật DEF §3 vì p<0,01 với n=3); P2 ĐÚNG 3/3 (lag
  +1f: 1, 1, 1); P3-A1 SAI cấp lượt (3/3 đóng băng-tại-
  tick, p=0,0169 — xem F-202-T4-2); P3' ĐẠT 3/3
  (stall: 174=5, 212=5, 433=4); P7 ĐÚNG.** Helper
  `distinct-seq-202.py` DÙNG LIVE (quyết (t) đợt 162): sổ
  as-of-201 (148/151 distinct, occ 202/216) +
  stall/c2coverage attempt1-bd22dffd → **148/151 distinct,
  205/219 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 0** (174 + 212 + 433 đều đã thấy). T4 kiểm tay
  lại sổ as-of-201: cả ba seq có trong `seen_c2` lẫn
  `seen_dat`; non_dat_in_union [260, 364, 498] KHÔNG ĐỔI
  (không seq nào trong 3 hố này xuất hiện đợt này). Sổ ĐÃ
  THĂNG CẤP thành as-of-202 (md5 `50f10815`; bản đề xuất
  giữ lại làm audit trail; sổ gốc as-of-201 KHÔNG đổi).
- **P1 — ĐÚNG 3/3 occ** (cả 3 seq gần run-end ±1 tick; 433
  là run-end, 174 = 173+1, 212 = 211+1; trong 18 run_end
  seqs; baseline 54/344, p=0,00386817 — verdict ĐÚNG theo
  luật DEF §3 vì p<0,01). Cộng dồn 240/244 → **243/247**.
- **P2 — ĐÚNG 3/3 occ** (cả 3 seq lag +1f: 1, 1, 1;
  DEF §4 chỉ đòi lag ≥ +1f). Cộng dồn 235/235 →
  **238/238**.
- **P3-A1 — SAI cấp lượt, 3/3 occ đóng băng-tại-tick**
  (baseline 88/343, p=0,0168875 — verdict SAI theo luật
  DEF §5 vì n=3 và p≥0,01; xem F-202-T4-2). Cộng dồn
  204/244 → **207/247** (tử số +3 — cả ba occurrence đều
  ĐÚNG per-occurrence; tiền lệ đợt 200/201: chỉ cộng
  occurrence ĐÚNG).
- **P3' 3/3 distinct ĐẠT** (stall: 174=5, 212=5, 433=4).
  Cộng dồn 148/151 → **148/151 distinct** (0 seq ĐẠT MỚI);
  occurrence 202/216 → **205/219**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 15,
  0: 15}; đối chứng toàn bộ drawSrc post: {-1: 289, 0: 137},
  0/426 entry). Cộng dồn 138/138 → **141/141** (theo mẫu
  đợt 185: P7 cộng +n/n khi ĐÚNG cho n seq của lượt).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162):**
  sổ as-of-201 + stall/c2coverage attempt1 → sổ MỚI đề xuất;
  T4 kiểm tay rồi mới thăng cấp thành as-of-202 (md5
  `50f10815`). Đợt 203 copy-forward lấy sổ này làm cơ sở.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên ở mức occurrence** (P1/P2/P3'/P7 đều
  ĐÚNG per-occurrence; chỉ verdict cấp lượt P3-A1 là SAI
  do ngưỡng kiểm định không đạt được với n=3 — F-202-T4-2).
- **Labellag (b) — CHUỖI TRƯỚC #70 = 2; #70 (lượt hợp lệ)
  0 occ / 0 event → chuỗi 0 occ 2 → 3** (lượt hợp lệ 0 occ
  thứ ba liên tiếp: #68, #69, #70).
- Chuỗi median tickCost 56 lượt (MỚI — thêm 52,0 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 / 42,0 / 53,0 / 47,0 / 55,0 / 55,0 / 50,5 /
  52,0 ms (tổng 2673,5; TB 47,7 ms; min 39,0, max 60,0; 0
  lượt vượt 60).

## 8. Chờ quyết parent / nợ đợt 203

- **(a) #70 HỢP LỆ (attempt1 20/20, lớp B 5/5, tickCost
  median 52,0 ms) — CHUỖI LƯỢT YÊN HỢP LỆ 2 → 3 (ĐỀ XUẤT
  — parent quyết cuối).** Chân lượt yên cho chuỗi FULL PASS
  **CÓ đợt này** (FULL PASS thuộc parent/T10 quyết cuối).
- **(b) FULL PASS: thuộc T01/T8-202 + parent/T10 quyết cuối.
  Live-check #21 ĐẠT (ĐỀ XUẤT) — T9-202 xác nhận độc lập
  sau.**
- **(c) P3' cộng dồn MỚI 56 lượt: P1 243/247, P2 238/238,
  P3-A1 207/247, P3' 205/219 = 148/151, P7 141/141:**
  sổ distinct-seq ĐÃ thăng cấp as-of-202 md5 `50f10815`.
  **Chờ parent/T10 quyết:** ghi nhận thăng cấp.
- **(d) BOOT ĐO bd22dffd (btime 21:05:15Z/21:05:28Z lệch
  13 s; số hiệu chưa gán — T01-202 survey "#133
  candidate"). POSTBOOT_PASS MỚI 21:28:09Z (poll=1,
  repair-sớm-quyết-h, lists 66) — caveat (b1)/(b2) thuộc
  parent quyết (c)-202. BOOT CŨ 05bda90d (btime
  20:32:07Z/20:32:25Z lệch 18 s; POSTBOOT_PASS 20:50:33Z,
  lists 75; chết 21:05:15Z, 0 attempt) — số hiệu + (m)
  thuộc T01/T2-202; parent quyết (e)-202.
  (m) bd22dffd THÔ 0 (T2-202); INSIDE (T2-202).**
- **(e) PRE-FLIGHT CHECK (quyết (t) đợt 158) TIẾP TỤC CHỨNG
  MINH HIỆU QUẢ — giữ làm quy tắc đứng.** Đợt này test poll
  sạch (0 chuỗi deadline sót), check-only FAIL lúc mở do
  replay chưa xong (chờ theo thiết kế, khác đợt 200),
  gate0 T5 có sau repair.
- **(f) POSTBOOT_PASS MỚI 21:28:09Z (poll=1,
  repair-sớm-quyết-h) trên boot đo bd22dffd + POSTBOOT_PASS
  20:50:33Z trên boot cũ 05bda90d. Tổng boot không cờ GIỮ
  NGUYÊN nếu parent chấp nhận (T01/T2-202 phán cuối).**
- **(g) RAM 2 poll <500 MB toàn phiên (min 404 MB); 24/36
  poll boot mới <1024 MB — không có episode RAM thấp
  trong W1 (min 557 MB); giao T9-202 phán (nếu có).**
- **(h) (m) bd22dffd/(m) 05bda90d (T2-202); INSIDE
  (T2-202); POSTBOOT_PASS mới 21:28:09Z (T56-202); số hiệu
  05bda90d/bd22dffd (T01-202 xác minh — parent quyết (e)
  -202); OUTAGE phán cuối T7-202; auto-trigger lần
  FIRE thật đầu tiên — VẪN CHƯA XẢY RA (T9-202); B2 dữ
  kiện #14 (0 spike — BẢN NÀY); (m) #56 / mù hole-recheck /
  prune / headroom / ENOSPC / 84l10 / 86n2-P1 / B2 live sạch
  (T2/T7/T9-202 phán — T4 không nắm số chạy); E-247 kết cục
  (T9-202); run kết cục (T7-202).**
- **(i) B2 DỮ KIỆN #14: W1 0 SPIKE (F-202-T4-6). Luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách. Auto-trigger LIVE chạy trong cửa sổ
  attempt, 0 FIRE** — lần FIRE thật đầu tiên vẫn chưa xảy
  ra; T9-202 verify end-to-end khi có FIRE.
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (attempt1) → **1 lượt yên hợp lệ #70 cho chuỗi FULL
  PASS.** O8 T01 trên 05bda90d (T01-202 báo cáo — giữ lock
  polls #5–#7 + probe poll #10 instance 2); O8 T8 +
  harness thuộc T8-202 báo cáo (T8 chưa đóng lúc T4 đóng;
  test-vite-lock-v2.sh có mặt lúc ps-before W1 — xem §3).
- **(k) F-202-T4-1 (reboot giữa phiên đo — 2 boot/đợt);
  F-202-T4-2 (P3-A1 SAI cấp lượt ở n=3 — ngưỡng DEF §5
  không đạt được); F-202-T4-3 (T2-202 + T56-202 ghi file
  trong W1); F-202-T4-4 (RAM thấp kéo dài boot mới);
  F-202-T4-5 (B2 sát biên load1_max 2,98); F-202-T4-6
  (live #21 ĐẠT — chuỗi live ĐẠT 0 → 1 đề xuất).**

## Phụ lục A — stats-202-output.txt (tóm tắt)

```
test: 1 poll, RAM 905 >=1024: 0/1, load1<2: 1/1, gate0: khong-dat=1
poller boot 05bda90d (instance 2): 30 poll 20:43:39-21:05:44Z, RAM 457-2032 >=1024: 26/30
  <500: 1/30, load1<2: 11/30, load5<2: 6/30, gate0: T5=20, khong-dat=10
  lock: co=4 (T01-202), khong=26, dpkg 2->777
poller boot bd22dffd (instance 3): 36 poll 21:06:51-21:33:13Z, RAM 404-1508 >=1024: 11/36
  <500: 1/36, load1<2: 27/36, load5<2: 36/36, gate0: T5=7, khong-dat=29
  lock: khong=36, dpkg 2->777
TONG: 67 dong poll; RAM min=404 max=2032 >=1024: 37/67 <500: 2/67
gan-mo (3 dk load/RAM): 9 = 1 mo cua that (#36 instance 3) + 8 ket gate0/lock/apt/RAM
P3' (56 luot): P1 243/247 P2 238/238 P3-A1 207/247 P3' 205/219 = 148/151 P7 141/141
median 56 luot: n=56 mean=47,7 min=39,0 max=60,0 vuot-60: 0
```
