# PHASE9_ROUND201_T4_WEBKIT_QUIET69_LIMITS.md

**Đợt:** 201. **Luồng:** T4 — đo lượt yên WebKit #69 trên boot
c073c8bb — 1 attempt, 1 LƯỢT HỢP LỆ
+ **#69 HỢP LỆ — attempt1 20/20 + lớp B ĐẠT 5/5 + tickCost
  median 50,5 ms ≤ 60.** Ngân sách dùng 1/3; poller thoát
  15:00:58Z (theo thiết kế: có lượt hợp lệ thì dừng).
  **Chuỗi lượt yên hợp lệ 1 → 2 (ĐỀ XUẤT — parent quyết cuối)**
  — lượt hợp lệ thứ hai liên tiếp (#68, #69).
+ **BOOT ĐO: c073c8bb (btime 11:21:41Z theo uptime -s /
  11:21:54Z theo /proc/1 — lệch 13 s, như đợt 200;
  SỐ HIỆU #130 ĐÃ XÁC NHẬN ở (e)-200).** POSTBOOT_PASS
  round201-t56 CÓ 14:48:33Z (poll=0, replay-đầy-đủ, dpkg 777,
  cache 108, lists 75 — cùng hồ sơ #130, trên CÙNG boot).
+ **P3' CỘNG DỒN MỚI (55 lượt hợp lệ tổng; 43 lượt kỷ stall):
  P1 240/244, P2 235/235, P3-A1 204/244, P3' 202/216 occ =
  148/151 distinct-seq, P7 138/138.** Seq MỚI: 0 (274, 304
  đều đã thấy). Sổ thăng cấp as-of-201, md5 `ad243797`
  (cơ sở as-of-200 `2d3ee86c` giữ nguyên). Labellag (b):
  0 occ → **chuỗi 0 occ 1 → 2 (ĐỀ XUẤT)**.
+ **LIVE-CHECK #20: KHÔNG ĐẠT (ĐỀ XUẤT — chuỗi live ĐẠT
  1 → 0).** 1 cửa sổ hợp lệ NHƯNG **24 spike B2 trong W1**
  (định nghĩa (p)-192 đòi 0 spike); 4 mẫu autotrigger đều
  watch/consec=0, 0 FIRE, max avail 3.262.344 kB < guard.
  T9-201 xác nhận độc lập sau.
+ **B2 DỮ KIỆN #13 (cách đếm (j)-200: mỗi đợt = 1): W1
  24 SPIKE** (14:57:01–14:59:01Z, load1 3,01–3,66, max
  3,66 — tải chủ yếu do chính attempt tạo; sampler T4 khớp:
  load1 max 3,66, 59/103 mẫu ≥ 3,0).
+ **REBOOT SAU ATTEMPT (MỚI): boot mới 7d642f2a, btime
  15:04:25Z (uptime -s) / 15:04:43Z (/proc/1) — lệch 18 s.**
  Poller đã thoát 15:00:58Z trên boot cũ; T4 KHÔNG đo trên
  boot mới. Số hiệu #131? — T01-201 survey + parent quyết
  (e)-201. **Boot lúc viết cờ là 7d642f2a — KHÁC boot đo.**
+ **FULL PASS: chân lượt yên CÓ đợt này** (lượt hợp lệ thứ
  hai liên tiếp); chân O8 + harness thuộc T01/T8-201 báo cáo.
**Ngày:** 27/11/2026 (lượt cron 21:35 +07 27/11 = 14:35:51Z).
**Boot đo:** c073c8bb (1 test + 6 poller).

## 0. Verdict tổng

- **#69 HỢP LỆ — attempt1-c073c8bb: 20/20, (c2) [274, 304],
  coverage 2/2, lớp B ĐẠT 5/5, tickCost median 50,5 ms.**
  P1 YEU (2/2, p=0,0315); P2 ĐÚNG 2/2 (lag +1f cả hai);
  P3-A1 YEU (2/2, p=0,0756); **P3' ĐẠT 2/2** (stall 7, 7);
  P7 ĐÚNG (0 entry trễ ≥+1f). **Chuỗi lượt yên 1 → 2
  (ĐỀ XUẤT).**
- **(c2) cộng sổ:** 274 + 304 đều đã thấy → distinct
  148/151 KHÔNG ĐỔI, occ 200/214 → 202/216. Sổ đã thăng cấp
  as-of-201 (md5 `ad243797`; kiểm tay: 274 + 304 có trong cả
  hai seen-list cơ sở, non_dat [260, 364, 498] KHÔNG ĐỔI).
  Labellag (b): 0 occ / 0 event ≥5f → **chuỗi 0 occ
  1 → 2 (ĐỀ XUẤT)**.
- **B2 DỮ KIỆN #13: W1 24 SPIKE** — lần đầu có spike trong
  W1 kể từ đợt 199 (đợt 200: 0 spike). **Live-check #20
  KHÔNG ĐẠT (ĐỀ XUẤT)** — chuỗi live ĐẠT 1 → 0.
- **0 VI PHẠM PHÍA T4** (không script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; check-only
  postboot mỗi 4 poll là dự phòng được quyết; launch-test
  riêng KHÔNG chạy đợt này — F-200-T4-2 ĐÃ GIẢI QUYẾT, xem
  §0b/F-201-T4-5).
  Chồng lấn ghi nhận trong W1: T2-201 ghi 3 file + heartbeat
  eperm-probe ghi 2 file (giao T2/parent phán (p)-201);
  waiter T8 + sampler live T9 (daemon đứng — theo (p)-200
  KHÔNG VI PHẠM) — xem §3.
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `477a0eac`
  (KHÔNG ĐỔI so với đầu đợt — 0 lần cập nhật tree-md5).
- **Cờ:** `hidden_files/round201-t4.done` viết lúc đóng, CÓ
  NỘI DUNG. **Boot lúc viết cờ là 7d642f2a — KHÁC boot đo
  c073c8bb** (reboot 15:04:25Z sau khi poller thoát 15:00:58Z).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-200-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (14:47–14:52Z),
ghi vào `hidden_files/round201-t4/preflight-201.txt`.

- **md5 khớp hệt bản đợt 200:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-200 md5
  `2d3ee86c` (occ 200/214, distinct 148/151,
  valid_rounds_p3 42 — xem ghi chú dưới, non_dat_in_union
  [260, 364, 498]).
  **Tree:** preview.tsx lúc mở poller là `477a0eac` (đọc
  trực tiếp ~14:51Z; KHÔNG ĐỔI so với cuối đợt 200).
  Ghi chú: sổ as-of-200 ghi `valid_rounds_p3: 42` — đó là số
  lượt hợp lệ TRONG KỶ STALL (từ đợt 139); tổng lượt hợp lệ
  là 54 (xem §7). Hai số khác nhau theo định nghĩa, không
  phải mâu thuẫn.
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; media
  `stripes-nonperiodic.mp4` có mặt (140.828 B); không có
  `vite.lock`, không có `attempt-done-*`. **Playwright-core
  (npm): KHÔNG tìm thấy** (như đợt 200 — launch test dùng
  MiniBrowser trực tiếp).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-27
  16:30:00 UTC` → **1795797000** (hạn cờ ~17:00Z =
  1795798800, hạn cứng 17:35:51Z = 1795800951); test poll
  header deadline đúng `16:30:00Z` — 0 chuỗi sót (F-199-T4-1
  KHÔNG tái diễn).
- **Copy-forward 200 → 201 (script python thay thế có neo,
  KHÔNG sed global):** deadline `13:30Z 27/11` → `16:30Z
  27/11`; hạn cờ/cứng → `17:00Z`/`17:35:51Z`; T5FLAG chính
  `round201-t56/` + fallback `round200-t56/`; `T4-200a` →
  `T4-201a`; `WebKit #68` → `#69`; glob `round199-*` →
  `round200-*`. Lỗi neo 0 lần. **WIRE p1p3p7 ĐÃ CÓ SẴN
  trong run-analyzers-201.sh — chỉ assert (1 lần), KHÔNG
  chen lại.** 1 comment stale dòng 153 (tên thư mục T5 cũ,
  không có `/` nên neo không bắt) — đã sửa tay sau copy.
  Thứ tự neo quan trọng: `round200-t56/` → `round201-t56/`
  PHẢI TRƯỚC `round199-t56/` → `round200-t56/` (ghi trong
  docstring của script copy).
- **`cp` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 200).
- **Freeze check (F-164-T4-1):** `round200-t4` còn **0 file
  làm việc** mtime ≥ 14:35:51Z (đợt 201 mở).
- **GATE0 LÚC MỞ: T5 CHÍNH ĐÃ CÓ.** round201-t56/
  POSTBOOT_PASS ghi 14:48:33Z (poll=0, replay-đầy-đủ,
  dpkg 777, cache 108, lists 75 — cùng hồ sơ #130), boot
  c073c8bb KHỚP, mtime ≥ btime → gate0 T5 PASS ngay từ lúc
  mở (KHÁC đợt 200: phải chờ T56 repair tới 12:01Z).
  Fallback round200-t56/ POSTBOOT_PASS (12:01:06Z, cùng
  boot) cũng PASS. **Check-only postboot chạy tay exit=0
  PASS** (xem `preflight-postboot-201.log`): ĐỦ ĐIỀU KIỆN
  chạy WebKit (GST đủ isomp4 + libav, apt đủ 11 package).
  F-200-T4-1 KHÔNG tái diễn.
- **F-200-T4-2 ĐÃ GIẢI QUYẾT (F-201-T4-5):** đọc script
  `vcut-webkit-postboot-check.sh` — launch-test CHỈ chạy
  khi truyền cờ `--launch-test` (dòng 825–827: node
  `l8-webkit-launch.mjs`); poller gọi check-only KHÔNG cờ
  nên gate0wait không có dòng launch là ĐÚNG THIẾT KẾ,
  không phải thiếu sót. **Launch-test riêng KHÔNG chạy đợt
  này** (như đợt 200); launch được chứng minh bằng attempt1
  20/20 trên WebKit 27.2 + T56 verify POSTBOOT (poll=0)
  exit 0.
- **X11 lúc mở: `/tmp/.X11-unix/` chỉ có `X193`** (socket
  stale của chính attempt đợt 200, tạo 12:01Z 27/11; Xvfb
  đã chết) — 0 X server đang chạy.
- **RAM lúc mở ~445 MB avail (14:47Z — các luồng khác đang
  chạy nặng) → hồi phục 1.449 MB lúc 14:51Z; load1 ~0,55
  lúc mở → 2,41 lúc 14:51Z.** Poller chờ gate A đúng
  thiết kế.
- **T9-201 đã chạy lúc T4 mở:** `b2watch.sh` (pid 369775,
  từ 14:48Z) + `sampler-autotrigger.py --live --round-dir
  round201-t9/autotrigger-live` (pid 369776, từ 14:48Z) —
  dữ kiện B2/live có sẵn.
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 7 poll thật (1 test + 6 poller), 1 lần cửa mở, 0 reboot trong phiên đo

- **Test (POLL_TEST=1), 1 poll, boot c073c8bb
  (14:52:20Z):** RAM 1759 MB, load1 2,00/load5 1,28,
  lock=khong, blockers=0, gate0=T5 (POSTBOOT_PASS
  round201-t56), t5flag=PASS, apt=0, dpkg 777 →
  **TEST-POLL-OK exit 7 đúng thiết kế.** Header deadline
  đúng 16:30:00Z — 0 chuỗi sót. (load1 = 2,00 đúng ngưỡng —
  chưa < 2 nên test poll không mở cửa.)
- **Poller — boot c073c8bb (#130), 6 poll
  (14:53:03–14:56:50Z), 1 lần cửa mở:** RAM ≥1024:
  **6/6** (min 2881, max 3573 MB); **<500: 0/6**;
  load1<2: 2/6; load5<2: **3/6**; gate0:
  **T5 6/6** (POSTBOOT_PASS round201-t56 từ poll #1);
  lock=co 4 (T01-201 giữ lock pid 381631 port 5560, polls
  #2–#5 — O8), khong 2; blockers>0: 3 poll; apt>0: 0 poll;
  dpkg 777→777. **0 reboot trong phiên đo.**
- **Giai đoạn chờ cửa (poll #1–#5):** gate A đủ ở poll #2
  (L1 1,48/L5 1,33/RAM 2881) nhưng kẹt lock=co + blockers=5
  (O8 T01-201: `clicktest-87o8-mask-track-webkit.mjs`, vite
  :5560/:5554, MiniBrowser/WebKit — xem blockers-list-2.txt);
  poll #3–#4 load1 vọt 4,36/4,34 (O8 đang chạy nặng);
  poll #5 load1 2,39 + blockers=1 (O8 sắp xong). O8 nhả
  lock trước poll #6.
- **Cửa mở 1 lần (poll #6, 14:56:50Z):** RAM 3288 MB,
  load1 1,48, load5 1,99, lock=khong, blockers=0, apt=0,
  gate0=T5 (POSTBOOT_PASS round201-t56 ghi 14:48:33Z) →
  **CỬA YÊN MỞ**, attempt1 chạy. Poller thoát
  sau attempt1 hợp lệ (15:00:58Z) — không cần poll tiếp.
- **Phân rã 7 dòng poll thật (1 test + 6 poller):**
  RAM≥1024: 7/7; RAM<500: **0/7**. load1<2: 2/7;
  load5<2: 4/7. **"gan-mo" (3 điều kiện load/RAM): 2**
  = 1 lần mở cửa thật (#6) + 1 lần kẹt lock/blockers (#2).
  gate0: T5=7, khong-dat=0. blockers>0: 3 poll.
  apt>0: 0 poll. dpkg 777→777.

## 2. Attempt — 1 attempt (ngân sách dùng 1/3), 1 lượt hợp lệ

- **attempt1-c073c8bb: 20/20 + LỚP B ĐẠT 5/5 + tickCost
  median 50,5 ms — HỢP LỆ.** Cửa sổ: marker 14:56:50Z →
  attempt-done 15:00:21Z (inner-end 15:00:21Z,
  probe_exit=0; run-attempt exit=0 15:00:24Z; analyzers chạy
  NGOÀI cửa sổ 15:00:24–15:00:58Z). JSON 3.202.134 B; flip
  wallMs 28.873 ms; lock vite giữ 214 s, nhả 15:00:24Z;
  vite :5187 kill sạch (curl 000); sampler dừng sạch
  (104 dòng = 103 mẫu + 1 header). **0 writePartial TIMEOUT**
  (grep "timeout" run-webkit log = 0; probe_exit=0).
  **tickCost:** tổng n=562 median **50,5** p90 92,0 max
  285 min 28; hậu flip+2000ms n=401 median 50,0.
  BlendTick/pass 22,4; rAF/pass median 36 (21–47).
  webkit=27.2, pageErrs=[].
  **Lớp B: B1 ĐẠT** (load5 cuối 2,45 — SÁT BIÊN 2,5, xem
  F-201-T4-3); **B2 ĐẠT (load1_max 3,66)**; B3 ĐẠT;
  **B4 ĐẠT (dpkg delta 0)**; **B5 ĐẠT (RAM min 1936 MB,
  0 mẫu <500; 0/103 mẫu <1024)**.
  **(c2) = 2 seq [274, 304]** (lag +1f cả hai) → P3'
  cộng sổ (xem §7). **P1 YEU** (2/2, p=0,0315);
  **P2 ĐÚNG 2/2** (lag +1f: 1, 1); **P3-A1 YEU** (2/2,
  p=0,0756); **P3' ĐẠT 2/2** (stall_truoc=7, 7);
  **P7 ĐÚNG** (0 entry trễ ≥+1f; đối chứng 0/400).
  **Labellag (b): 0 occurrence ≥5f** (cả hai chiều) —
  **chuỗi 0 occ 1 → 2 (ĐỀ XUẤT)**.
  **Perpass (20 pass):** median 60,0/56,0/47,5/36,5/54,5/
  52,5/37,5/42,0/47,0/43,0/36,0/37,5/44,0/35,5/74,0/55,0/
  101,0/95,5/96,0/106,5 — **TĂNG Ở 4 PASS CUỐI (17–20:
  ~96–107 ms)** trong khi load1 mean giữ ~3,1–3,6 và RAM
  mean rơi 2786 → 2066 MB; n=16–36 tick mọi pass.
  Tương quan median~load1_mean r=0,42; median~RAM_mean
  r=−0,64 (chỉ mô tả — load1 là trung bình 1 phút nên biến
  thiên chậm; không kết luận nhân quả từ 1 lượt).
- **Ngân sách dùng 1/3; poller thoát 15:00:58Z (có lượt
  hợp lệ — theo thiết kế).** W2/W3 KHÔNG CHẠY.

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN #13 (cách đếm (j)-200: mỗi đợt = 1):
  W1 24 SPIKE.** Watcher T9 (b2watch.sh, poll load1 mỗi
  2 s, ghi spike khi load1 ≥ 3,0; mỗi spike ghi boot_id):
  **W1: 24 spike** (14:57:01–14:59:01Z, mỗi ~5 s, load1
  3,01–3,66, max 3,66; tất cả boot c073c8bb; tổng log T9 lúc
  kiểm ~15:08Z: 53 spike — 41 trên c073c8bb + 12 trên boot mới
  7d642f2a sau reboot; log còn tăng sau đó — T9-201 báo cáo
  tổng cuối). Sampler T4 xác nhận độc lập:
  load1_max 3,66 **KHỚP** (59/103 mẫu ≥ 3,0 — tải ≥ 3,0
  kéo dài phần lớn cửa sổ). Chỉ 1 cửa sổ đợt này (poller
  thoát sau lượt hợp lệ) nên dữ kiện #13 = W1 24 spike.
  T4 chỉ báo số, KHÔNG tự quyết tách.
  **Nguồn tải trong W1 (ảnh ps kèm mỗi spike):** đứng đầu
  là `WebKitWebProces` (69,6%) + `MiniBrowser` (30,1%) +
  `MainThread` (49,0%) của **chính attempt** (pid 386345/
  386292/386198 — probe T4) — tải chủ yếu do attempt tự
  tạo, không phải luồng khác. (Đợt 200 attempt giữ load1
  ≤ 2,62; đợt này cùng probe đẩy load1 lên ~3,2 sustained
  — xem F-201-T4-1/F-201-T4-3.)
- **AUTO-TRIGGER LIVE — CHẠY TRONG CỬA SỔ ATTEMPT, 0 FIRE.**
  Live `dry_run=False guard=6291456 consec=2` (T9-201).
  Mẫu autotrigger trong cửa sổ (marker → inner-end):
  W1 4 mẫu 14:56:51/14:57:51/14:58:51/14:59:51Z (avail
  2.336.940–3.262.344 kB, load1 1,48–3,28) — **trigger=watch,
  consec=0 ở tất cả các mẫu: 0 FIRE / 0 WOULD-FIRE.**
  RAM avail cao nhất trong cửa sổ: 3.262.344 kB (~3,11 GB)
  lúc 14:56:51Z — vẫn < guard 6.291.456 kB.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 20: KHÔNG ĐẠT
  (F-201-T4-1, ĐỀ XUẤT — chuỗi live ĐẠT 1 → 0).** Áp ĐÚNG
  định nghĩa (p)-192 như đã áp ở #14 (đợt 195), #16 (đợt
  197) và #19 (đợt 200) — cả ba lần ĐẠT đều có 0 spike B2
  VÀ 1 cửa sổ hợp lệ; đợt này **CÓ 1 cửa sổ hợp lệ (W1)
  NHƯNG 24 spike B2** nên KHÔNG ĐẠT. Trigger tự thân vẫn
  ĐÚNG (4 mẫu watch/consec=0, 0 FIRE) — lỗi là tải trong
  cửa sổ, không phải trigger. **Chuỗi live ĐẠT 1 → 0
  (ĐỀ XUẤT).** T9-201 xác nhận độc lập sau (T9 chưa đóng
  lúc T4 đóng).
- **O8 T01 TRÊN BOOT c073c8bb — thuộc T01-201 báo cáo
  (T01 giữ lock polls #2–#5, đã nhả trước poll #6).**
  O8 T8 + harness thuộc T8-201 (T8 chưa đóng lúc T4 đóng;
  waiter T8 đã chạy từ trước W1 — xem dưới).
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (kiểm file
  round201-* mtime trong cửa sổ, loại round201-t4):**
  **W1 (14:56:50–15:00:21Z):**
  **(1) T2-201 GHI 3 FILE TRONG W1 (F-201-T4-4):**
  `round201-t2/m56-201.py` mtime 14:56:56Z (6 s sau
  marker), `m-check201.log` 14:57:28Z, `m56-201.log`
  14:59:21Z. **(2) eperm-probe-v2.log + eperm-probe-v2.
  heartbeat mtime 14:59:59Z** (daemon eperm-probe ghi
  trong W1 — 22 s trước inner-end). Giao T2/parent phán
  (p)-201 (theo quy tắc tinh chỉnh (p)-200: ghi file hay
  workload nặng trong cửa sổ mới tính).
  **0 file round200-* nào bị sửa trong W1** (check glob
  đợt trước trong t4-attempt-inner.sh).
  **vite.lock.queue (thư mục): mtime 14:56:50.646** — đúng
  giây marker; bên trong chỉ có `cooldown-t4` của T4 —
  mtime thư mục là do **chính T4 acquire vite lock lúc mở
  attempt**, không phải luồng khác.
  **Waiter T8 trong W1 (như F-200-T4-4):** launcher
  `wait-t4-t5-201t8.sh` (pid 385729) có mặt trong ps-before
  VÀ ps-after W1 — vòng poll nhẹ mỗi 60 s kiểm
  `round201-t4.done` + grep `windows.md` (đọc — đúng mục
  đích công bố sớm), không ghi file, không workload nặng.
  Theo (p)-200: waiter tuân thủ KHÔNG VI PHẠM.
  **Sampler live T9 trong W1:** `b2watch.sh` (pid 369775)
  + `sampler-autotrigger.py --live` (pid 369776) — daemon
  đứng, mẫu mỗi 60 s / poll load1 mỗi 2 s (chính là nguồn
  số live + B2 §3 trên); theo (p)-200 KHÔNG VI PHẠM.
  **T9 sleep-3300 mid-probe check (pid 370318)** có mặt
  trong ps-before VÀ ps-after — lệnh sleep, không workload.
  **Các lệnh sleep 240/180 của chính T4** (giám sát poller)
  có mặt trong ps-before/after — của T4, không tính chồng
  lấn.
  **ps-before W1: 0 Chrome / 0 node tsc-test / 0 vite
  preview** (không phải của T4). ps-after W1: chỉ vite
  :5187 của chính T4.
- **T56 REPAIR — 0 CHỒNG TRONG W1** (POSTBOOT_PASS
  round201-t56 ghi 14:48:33Z, 8 phút TRƯỚC marker; dpkg
  delta 0 trong cửa sổ; apt=0 ở poll #6). Verify trước cửa
  attempt đầu — KHÔNG tính vi phạm (tiền lệ (p)-199).
- **Ghi trong cửa sổ attempt: CHỈ CÓ GHI CỦA T2-201 +
  eperm-probe (xem trên).** `run-analyzers-201.sh` chạy
  NGOÀI cửa sổ (15:00:24–15:00:58Z).

## 4. Replay/postboot + reboot sau attempt

- **Boot #130 (c073c8bb, btime 11:21:41Z — SỐ HIỆU ĐÃ XÁC
  NHẬN ở (e)-200) — POSTBOOT_PASS MỚI ĐÃ CÓ 14:48:33Z**
  (T56-201; T4 chỉ ghi nhận): "boot c073c8bb (btime
  2026-11-27 11:21:41Z; watcher-201) — replay-day-du: dpkg
  777 dong; cache 108 .deb; lists 75; postboot PASS poll0
  doc lap exit 0 luc 2026-11-27T14:48:33Z; POSTBOOT_PASS moi
  ghi 2026-11-27T14:48:33Z poll=0 (replay-day-du)". **Cùng
  hồ sơ #125/#126/#127/#129** (poll=1, repair) về dpkg/
  cache/lists — nhưng poll=0 replay-đầy-đủ như #128.
  Caveat (b1)/(b2) thuộc parent quyết (c)-201.
- **Lệch btime 13 s (như đợt 200):** uptime -s = 11:21:41Z,
  /proc/1 start = 11:21:54Z — T01-201 survey sẽ chốt btime
  chính thức; T4 ghi cả hai số, không tự chọn.
- **Check-only của T4:** PASS 2 lần (preflight tay +
  gate0wait poll #1/#5) — PASS độc lập từ T4, khớp cờ T5.
  F-200-T4-1 KHÔNG tái diễn.
- **Watcher-201:** T4 không theo dõi trực tiếp trạng thái
  watcher — thuộc T56-201 báo cáo (watcher-201 spawn
  ~14:48Z; chết theo reboot 15:04:25Z — T56 xác minh).
- **REBOOT SAU ATTEMPT — BOOT MỚI 7d642f2a (F-201-T4-2).**
  uptime -s = 15:04:25Z, /proc/1 start = 15:04:43Z — lệch
  18 s. Khung reboot: spike cuối trên c073c8bb 14:59:01Z →
  spike đầu trên 7d642f2a 15:07:37Z (b2-spikes.log T9);
  uptime -s chỉ btime 15:04:25Z. Poller T4 đã thoát
  15:00:58Z trên boot cũ — reboot xảy ra SAU KHI T4 đóng
  đo, KHÔNG ảnh hưởng attempt1. **T4 KHÔNG đo gì trên boot
  mới; (m) boot mới + số hiệu #131? thuộc T01/T2-201;
  POSTBOOT boot mới thuộc T56-201; parent quyết (e)-201.**
- **(m) #130 THÔ 0 — phân loại CUỐI thuộc T2-201** (T4
  không đo (m)).

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND201_T4_WEBKIT_QUIET69_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round201-t4/`):**
  `poll-wait-t4-201.sh` (871f1b6a), `run-attempt-201.sh`
  (4b3295e6), `run-analyzers-201.sh` (ad53ead2),
  `distinct-seq-201.py` (4b100972).
  **KHÔNG stage lại probe** (byte-identical đợt 148–200,
  md5 `4291e539…`), **`t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (theo mẫu 149–200: chỉ stage 4
  script trên), **`b.json`** (md5 `078938cf…`) và
  **`stats-201.py`** (helper làm việc).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (477a0eac) +
  `stats-201.py` + `distinct-seq-201.py` +
  `distinct-seq-ledger.json` (as-of-201, md5 `ad243797`) +
  `distinct-seq-ledger-201-proposed.json` (bản đề xuất, audit
  trail) + `distinct-seq-ledger-200.json` (cơ sở as-of-200,
  md5 `2d3ee86c` KHÔNG ĐỔI) + `preflight-201.txt` +
  `preflight-postboot-201.log` + `round201-t4-copy.py`.
- **Log/evidence (hidden_files/round201-t4/, không stage):**
  `poll-t4.log` (6 poll poller + 1 lần CỬA MỞ #6),
  `poll-t4.nohup.log`, `poll-test-201.log` (1 test poll +
  TEST-POLL-OK exit 7), `chain-t4.log` (start poller + 1 lần
  CỬA MỞ + 1 attempt + poller thoát 15:00:58Z),
  `postboot-t4-201-gate0wait-*.log` (check-only mỗi 4 poll,
  2 file: poll #1 + #5, cả hai PASS),
  `stats-201-output.txt`,
  `windows.md` (công bố sớm giờ cửa sổ — W1 thực
  14:56:50–15:00:21Z),
  `preview-b-f3-flip-webkit-t4-attempt1-c073c8bb.json`
  (3.202.134 B),
  `load-mid-t4-attempt1-c073c8bb.log` (103 dòng + header),
  `analyze-t4-attempt1-c073c8bb-*.txt` (10 file — gồm
  `p1p3p7` chạy TỰ ĐỘNG),
  `coverage-check-attempt1-c073c8bb.txt` (2/2, (c2)=2),
  `classb-t4-attempt1-c073c8bb.txt`,
  `ps-before/after-t4-attempt1-c073c8bb.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt1-*.txt`
  (B4: dpkg 777→777). **1 JSON attempt (1 hợp lệ).
  0 process T4 sống lúc đóng** (poller thoát 15:00:58Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4 — socket stale `/tmp/.X11-unix/X193` của attempt đợt 200
  đã biến mất sau reboot (kiểm lúc đóng: thư mục trống)).

## 6. Sai số F-201-T4-1..6 + nợ cũ

- **F-201-T4-1 — B2 DỮ KIỆN #13: W1 24 SPIKE + LIVE #20
  KHÔNG ĐẠT (MỚI).** Lần đầu có spike trong W1 kể từ đợt
  199 (đợt 200: 0 spike). Load1 ≥ 3,0 kéo dài 14:57:01–
  14:59:01Z (24 spike watcher + 59/103 mẫu sampler ≥ 3,0);
  tải chủ yếu do chính attempt tạo (WebKitWebProces/
  MiniBrowser đứng đầu mọi ảnh ps). Chuỗi live ĐẠT 1 → 0
  (ĐỀ XUẤT). T9-201 xác nhận độc lập sau.
- **F-201-T4-2 — REBOOT SAU ATTEMPT (MỚI).** Boot mới
  7d642f2a, btime 15:04:25Z/15:04:43Z (lệch 18 s) — sau khi
  poller thoát 15:00:58Z. T4 không đo trên boot mới; .done
  viết trên boot mới (KHÁC boot đo). Số hiệu #131? +
  POSTBOOT boot mới thuộc T01/T56-201; parent quyết (e)-201.
- **F-201-T4-3 — B1 SÁT BIÊN + CHI PHÍ TĂNG CUỐI LƯỢT
  (MỚI).** load5 cuối 2,45/2,5 (biên chỉ 0,05); tickCost
  median 4 pass cuối 101,0/95,5/96,0/106,5 ms (gấp ~2 lần
  median chung 50,5); RAM mean rơi 2786 → 2066 MB trong
  lượt; r median~RAM = −0,64. Theo dõi đợt 202: nếu B1
  vượt 2,5 hoặc median cuối lượt còn tăng, lượt yên có thể
  nhiễm tải cuối.
- **F-201-T4-4 — T2-201 GHI 3 FILE + EPERM-PROBE GHI 2 FILE
  TRONG W1 (MỚI).** `m56-201.py` 14:56:56Z (6 s sau
  marker), `m-check201.log` 14:57:28Z, `m56-201.log`
  14:59:21Z; `eperm-probe-v2.log` + `.heartbeat`
  14:59:59Z. Giao T2/parent phán (p)-201. Waiter T8 lại có
  mặt trong W1 (nhẹ, theo thiết kế — như F-200-T4-4).
- **F-201-T4-5 — F-200-T4-2 ĐÃ GIẢI QUYẾT (MỚI).**
  Launch-test chỉ chạy khi có cờ `--launch-test`
  (postboot script dòng 825–827); gate0wait không có dòng
  launch là đúng thiết kế. Launch chứng minh bằng attempt1
  20/20 trên WebKit 27.2.
- **F-201-T4-6 — (c2) = 0 SEQ MỚI (MỚI).** 274 + 304 đều đã
  thấy trong sổ → distinct-seq GIỮ 148/151 (occ +2 →
  202/216).
- **Nợ cũ:** F-200-T4-1 → KHÔNG tái diễn (postboot PASS
  lúc mở, gate0 T5 có ngay); F-200-T4-2 → F-201-T4-5 (ĐÃ
  GIẢI QUYẾT); F-200-T4-3 → lượt hợp lệ thứ hai liên tiếp
  (#69, chuỗi 1 → 2 đề xuất); F-200-T4-4 → waiter T8 lại
  có mặt trong W1 (nhẹ, theo thiết kế); F-200-T4-5 →
  F-201-T4-1 (dữ kiện #13: 24 spike); F-200-T4-6 →
  F-201-T4-1 (live KHÔNG ĐẠT — đề xuất); F-199-T4-1 →
  KHÔNG tái diễn (header deadline đúng 16:30Z, test poll
  sạch); F-199-T4-4 → KHÔNG tái diễn (0 Chrome trong W1
  lúc ps-before); F-199-T4-7 → KHÔNG tái diễn ((c2)=2);
  F-199-T4-8 → KHÔNG tái diễn (0 reboot trong phiên đo —
  reboot xảy ra SAU khi poller thoát); F-199-T4-9 → ĐÃ ÁP
  DỤNG (snapshot B2 đối chiếu cmdline mới phân loại);
  F-199-T4-10 → KHÔNG tái diễn (blockers=0 ở poll mở cửa);
  F-199-T4-11 → KHÔNG tái diễn (0 file round200-* ghi
  trong W1).

## 7. P3' cộng dồn (MỚI — 55 lượt hợp lệ tổng; 43 lượt kỷ stall) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 201 (MỚI): P1 240/244, P2 235/235,
  P3-A1 204/244, P3' 202/216 occurrence = 148/151
  distinct-seq, P7 138/138** (55 lượt hợp lệ tổng — #69 CÓ
  lượt hợp lệ nên cộng thêm 2 seq; 43 lượt trong kỷ stall
  từ đợt 139 theo `valid_rounds_p3` của sổ). Cơ sở: cộng
  dồn chỉ tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #69 (attempt1): (c2) 2 occ [274, 304];
  P1 YEU 2/2 (gần run-end, p=0,0315 — verdict YEU theo
  luật DEF §3 vì p>0,01 với n=2); P2 ĐÚNG 2/2 (lag +1f:
  1, 1); P3-A1 YEU 2/2 (p=0,0756); P3' ĐẠT 2/2
  (stall: 274=7, 304=7); P7 ĐÚNG.** Helper
  `distinct-seq-201.py` DÙNG LIVE (quyết (t) đợt 162): sổ
  as-of-200 (148/151 distinct, occ 200/214) +
  stall/c2coverage attempt1-c073c8bb → **148/151 distinct,
  202/216 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 0** (274 + 304 đều đã thấy). T4 kiểm tay lại
  sổ as-of-200: cả hai seq có trong `seen_c2` lẫn
  `seen_dat`; non_dat_in_union [260, 364, 498] KHÔNG ĐỔI
  (không seq nào trong 3 hố này xuất hiện đợt này). Sổ ĐÃ
  THĂNG CẤP thành as-of-201 (md5 `ad243797`; bản đề xuất
  giữ lại làm audit trail; sổ gốc as-of-200 KHÔNG đổi).
- **P1 — YEU 2/2 occ** (cả 2 seq gần run-end ±1 tick; 304
  là run-end, 274 = 273+1; trong 19 run_end seqs; baseline
  57/321, p=0,0315311 — verdict YEU theo luật DEF §3 vì
  p>0,01). Cộng dồn 238/242 → **240/244**.
- **P2 — ĐÚNG 2/2 occ** (cả 2 seq lag +1f: 1, 1;
  DEF §4 chỉ đòi lag ≥ +1f). Cộng dồn 233/233 →
  **235/235**.
- **P3-A1 — YEU 2/2 occ** (2/2 seq đóng băng-tại-tick;
  baseline 88/320, p=0,075625 — verdict YEU theo luật
  DEF §5). Cộng dồn 202/242 → **204/244** (tử số +2 —
  cả hai occurrence đều ĐÚNG; tiền lệ đợt 200: chỉ cộng
  occurrence ĐÚNG).
- **P3' 2/2 distinct ĐẠT** (stall: 274=7, 304=7).
  Cộng dồn 148/151 → **148/151 distinct** (0 seq ĐẠT MỚI);
  occurrence 200/214 → **202/216**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 12,
  0: 16}; đối chứng toàn bộ drawSrc post: {-1: 238, 0: 162},
  0/400 entry). Cộng dồn 136/136 → **138/138** (theo mẫu
  đợt 185: P7 cộng +n/n khi ĐÚNG cho n seq của lượt).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162):**
  sổ as-of-200 + stall/c2coverage attempt1 → sổ MỚI đề xuất;
  T4 kiểm tay rồi mới thăng cấp thành as-of-201 (md5
  `ad243797`). Đợt 202 copy-forward lấy sổ này làm cơ sở.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên ở mức occurrence** (P1/P2/P3'/P7 đều
  ĐÚNG hoặc YEU cấp lượt do n=2 — F-201-T4-3).
- **Labellag (b) — CHUỖI TRƯỚC #69 = 1; #69 (lượt hợp lệ)
  0 occ / 0 event → chuỗi 0 occ 1 → 2** (lượt hợp lệ 0 occ
  thứ ba liên tiếp kể từ #66).
- Chuỗi median tickCost 55 lượt (MỚI — thêm 50,5 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 / 42,0 / 53,0 / 47,0 / 55,0 / 55,0 / 50,5 ms
  (tổng 2621,5; TB 47,7 ms; min 39,0, max 60,0; 0 lượt vượt
  60).

## 8. Chờ quyết parent / nợ đợt 202

- **(a) #69 HỢP LỆ (attempt1 20/20, lớp B 5/5, tickCost
  median 50,5 ms) — CHUỖI LƯỢT YÊN HỢP LỆ 1 → 2 (ĐỀ XUẤT
  — parent quyết cuối).** Chân lượt yên cho chuỗi FULL PASS
  **CÓ đợt này** (FULL PASS thuộc parent/T10 quyết cuối).
- **(b) FULL PASS: thuộc T01/T8-201 + parent/T10 quyết cuối.
  Live-check #20 KHÔNG ĐẠT (ĐỀ XUẤT) — T9-201 xác nhận độc
  lập sau.**
- **(c) P3' cộng dồn MỚI 55 lượt: P1 240/244, P2 235/235,
  P3-A1 204/244, P3' 202/216 = 148/151, P7 138/138:**
  sổ distinct-seq ĐÃ thăng cấp as-of-201 md5 `ad243797`.
  **Chờ parent/T10 quyết:** ghi nhận thăng cấp.
- **(d) BOOT ĐO c073c8bb (số hiệu #130 ĐÃ XÁC NHẬN ở
  (e)-200; btime 11:21:41Z/11:21:54Z lệch 13 s).
  POSTBOOT_PASS MỚI 14:48:33Z (poll=0, replay-đầy-đủ) —
  caveat (b1)/(b2) thuộc parent quyết (c)-201. BOOT MỚI
  7d642f2a (btime 15:04:25Z/15:04:43Z lệch 18 s) — số hiệu
  #131? (T01-201 xác minh — parent quyết (e)-201); (m)
  boot mới + POSTBOOT boot mới thuộc T2/T56-201.
  (m) #130 THÔ 0 (T2-201); INSIDE (T2-201).**
- **(e) PRE-FLIGHT CHECK (quyết (t) đợt 158) TIẾP TỤC CHỨNG
  MINH HIỆU QUẢ — giữ làm quy tắc đứng.** Đợt này test poll
  sạch (0 chuỗi deadline sót), postboot check-only PASS
  lúc mở (khác đợt 200), gate0 T5 có ngay từ poll #1.
- **(f) POSTBOOT_PASS MỚI 14:48:33Z (poll=0,
  replay-đầy-đủ) trên CÙNG boot #130. Tổng boot không cờ
  GIỮ NGUYÊN nếu parent chấp nhận (T01/T2-201 phán cuối).**
- **(g) RAM 0 poll <500 MB (min 1759 MB toàn phiên) — không
  có episode RAM thấp đợt này; giao T9-201 phán (nếu có).**
- **(h) (m) #130/(m) boot 7d642f2a (T2-201); INSIDE
  (T2-201); POSTBOOT_PASS mới 14:48:33Z (T56-201); số hiệu
  7d642f2a = #131? (T01-201 xác minh — parent quyết (e)
  -201); OUTAGE phán cuối T7-201; auto-trigger lần
  FIRE thật đầu tiên — VẪN CHƯA XẢY RA (T9-201); B2 dữ
  kiện #13 (24 spike — BẢN NÀY); (m) #56 / mù hole-recheck /
  prune / headroom / ENOSPC / 84l10 / 86n2-P1 / B2 live sạch
  (T2/T7/T9-201 phán — T4 không nắm số chạy); E-247 kết cục
  (T9-201); run kết cục (T7-201).**
- **(i) B2 DỮ KIỆN #13: W1 24 SPIKE (F-201-T4-1). Luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách. Auto-trigger LIVE chạy trong cửa sổ
  attempt, 0 FIRE** — lần FIRE thật đầu tiên vẫn chưa xảy
  ra; T9-201 verify end-to-end khi có FIRE.
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (attempt1) → **1 lượt yên hợp lệ #69 cho chuỗi FULL
  PASS.** O8 T01 trên c073c8bb (T01-201 báo cáo — giữ lock
  polls #2–#5, nhả trước poll #6); O8 T8 + harness thuộc
  T8-201 báo cáo (T8 chưa đóng lúc T4 đóng).
- **(k) F-201-T4-1 (B2 dữ kiện #13: 24 spike; live #20
  KHÔNG ĐẠT); F-201-T4-2 (reboot sau attempt — boot mới
  7d642f2a); F-201-T4-3 (B1 sát biên + chi phí tăng cuối
  lượt); F-201-T4-4 (T2-201 + eperm-probe ghi file trong
  W1); F-201-T4-5 (F-200-T4-2 ĐÃ GIẢI QUYẾT — launch chỉ
  với --launch-test); F-201-T4-6 ((c2) = 0 seq mới).**

## Phụ lục A — stats-201-output.txt (tóm tắt)

```
test: 1 poll, RAM 1759 >=1024: 1/1, load1<2: 0/1, gate0: T5=1
poller (c073c8bb #130): 6 poll 14:53:03-14:56:50Z, RAM 2881-3573 >=1024: 6/6
  <500: 0/6, load1<2: 2/6, load5<2: 3/6, gate0: T5=6
  lock: co=4 (T01-201), khong=2, dpkg 777->777
TONG: 7 dong poll; RAM min=1759 max=3573 >=1024: 7/7 <500: 0/7
gan-mo (3 dk load/RAM): 2 = 1 mo cua that (#6) + 1 ket lock/blockers (#2)
P3' (55 luot): P1 240/244 P2 235/235 P3-A1 204/244 P3' 202/216 = 148/151 P7 138/138
median 55 luot: n=55 mean=47,7 min=39,0 max=60,0 vuot-60: 0
```
