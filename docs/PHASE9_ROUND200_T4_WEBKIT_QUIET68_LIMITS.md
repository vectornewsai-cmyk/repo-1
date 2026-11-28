# PHASE9_ROUND200_T4_WEBKIT_QUIET68_LIMITS.md

**Đợt:** 200. **Luồng:** T4 — đo lượt yên WebKit #68 trên boot
c073c8bb — 1 attempt, 1 LƯỢT HỢP LỆ
+ **#68 HỢP LỆ — attempt1 20/20 + lớp B ĐẠT 5/5 + tickCost
  median 55,0 ms ≤ 60.** Ngân sách dùng 1/3; poller thoát
  12:05:10Z (theo thiết kế: có lượt hợp lệ thì dừng).
  **Chuỗi lượt yên hợp lệ 0 → 1 (ĐỀ XUẤT — parent quyết cuối)**
  — lượt hợp lệ đầu tiên kể từ #66 (đợt 198); #67 có 0 lượt.
+ **BOOT ĐO: c073c8bb (btime 11:21:41Z theo uptime -s /
  11:21:54Z theo /proc/1 — lệch 13 s, T01-200 survey;
  SỐ HIỆU #130 ỨNG VIÊN).** POSTBOOT_PASS #130 CÓ 12:01:06Z
  (T56, poll=1, repair-som-quyet-h, dpkg 777, cache 108,
  lists 75 — cùng hồ sơ #129).
+ **P3' CỘNG DỒN MỚI (54 lượt hợp lệ): P1 238/242, P2 233/233,
  P3-A1 202/242, P3' 200/214 occ = 148/151 distinct-seq,
  P7 136/136.** Seq MỚI: 332 (357 đã thấy). Sổ thăng cấp
  as-of-200, md5 `2d3ee86c` (cơ sở as-of-198 `c8792589`
  giữ nguyên). Labellag (b): 0 occ → **chuỗi 0 occ 0 → 1
  (ĐỀ XUẤT)**.
+ **LIVE-CHECK #19: ĐẠT (ĐỀ XUẤT — chuỗi live ĐẠT 0 → 1).**
  1 cửa sổ hợp lệ + 0 spike B2 + 3 mẫu autotrigger đều
  watch/consec=0, 0 FIRE, max avail 1.457.360 kB < guard.
  T9-200 xác nhận độc lập sau.
+ **B2 DỮ KIỆN #12 (cách đếm (j)-199: mỗi đợt = 1): W1
  0 SPIKE.** Chỉ 1 cửa sổ (poller thoát sau lượt hợp lệ).
  Sampler T4 khớp: load1 max 2,62 < 3,0.
+ **FULL PASS: chân lượt yên CÓ đợt này** (lần đầu kể từ
  #66); chân O8 + harness thuộc T01/T8-200 báo cáo.
**Ngày:** 27/11/2026 (lượt cron 18:35 +07 27/11 = 11:35:51Z).
**Boot đo:** c073c8bb (30 poll: 1 test + 29 poller).

## 0. Verdict tổng

- **#68 HỢP LỆ — attempt1-c073c8bb: 20/20, (c2) [332, 357],
  coverage 2/2, lớp B ĐẠT 5/5, tickCost median 55,0 ms.**
  P1 YEU (2/2, p=0,0298); P2 ĐÚNG 2/2 (lag +1f cả hai);
  P3-A1 YEU (1/2, p=0,4086); **P3' ĐẠT 2/2** (stall 5, 6);
  P7 ĐÚNG (0 entry trễ ≥+1f). **Chuỗi lượt yên 0 → 1
  (ĐỀ XUẤT).**
- **(c2) cộng sổ:** 332 MỚI + 357 đã thấy → distinct
  148/151, occ 200/214. Sổ đã thăng cấp as-of-200
  (md5 `2d3ee86c`; kiểm tay: 332 vắng thật khỏi cả hai
  seen-list cơ sở, 357 có trong cả hai, non_dat
  [260, 364, 498] KHÔNG ĐỔI).
  Labellag (b): 0 occ / 0 event ≥5f → **chuỗi 0 occ
  0 → 1 (ĐỀ XUẤT)**.
- **0 VI PHẠM PHÍA T4** (không script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; check-only
  postboot mỗi 4 poll là dự phòng được quyết; launch-test
  riêng KHÔNG chạy đợt này — xem §0b/F-200-T4-2).
  Chồng lấn ghi nhận trong W1: waiter T8 poll .done (nhẹ,
  theo thiết kế) + sampler live T9 (daemon đứng) — xem §3,
  giao T2/parent phán (p)-200.
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `477a0eac`
  (KHÔNG ĐỔI so với đầu đợt — 0 lần cập nhật tree-md5).
- **Cờ:** `hidden_files/round200-t4.done` viết lúc đóng, CÓ
  NỘI DUNG. **Boot lúc viết cờ là c073c8bb — CÙNG boot đo**
  (không reboot trong phiên).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-199-T4-1)

Chạy **trước mọi attempt, trước khi mở poller** (11:39–11:40Z),
ghi vào `hidden_files/round200-t4/preflight-200.txt`.

- **md5 khớp hệt bản đợt 199:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-198 md5
  `c8792589…` (occ 198/212, distinct 147/150,
  valid_rounds_p3 53, non_dat_in_union [260, 364, 498]).
  **Tree:** preview.tsx lúc mở poller là `477a0eac` (đọc
  trực tiếp 11:39Z; KHÔNG ĐỔI so với cuối đợt 199).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; media
  `stripes-nonperiodic.mp4` có mặt (140.828 B); không có
  `vite.lock`, không có `attempt-done-*`. **Playwright-core
  (npm): KHÔNG tìm thấy** (như đợt 199 — launch test dùng
  MiniBrowser trực tiếp).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-27
  13:30:00 UTC` → **1795786200** (hạn cờ ~14:00Z =
  1795788000, hạn cứng 14:35:51Z = 1795790151); test poll
  header deadline đúng `13:30:00Z` — 0 chuỗi sót (F-199-T4-1
  KHÔNG tái diễn).
- **Copy-forward 199 → 200 (script python thay thế có neo,
  KHÔNG sed global):** deadline `07:30Z 27/11` → `13:30Z
  27/11`; hạn cờ/cứng → `14:00Z`/`14:35:51Z`; T5FLAG chính
  `round200-t56/` + fallback `round199-t56/`; `T4-199a` →
  `T4-200a`; `WebKit #67` → `#68`; glob `round198-*` →
  `round199-*`. Lỗi neo 0 lần. **WIRE p1p3p7 ĐÃ CÓ SẴN
  trong run-analyzers-199.sh — chỉ assert (1 lần), KHÔNG
  chen lại.** 1 comment stale dòng 153 (tên thư mục T5 cũ,
  không có `/` nên neo không bắt) — đã sửa tay sau copy.
- **`cp` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 199).
- **Freeze check (F-164-T4-1):** `round199-t4` còn **0 file
  làm việc** mtime ≥ 11:35:51Z (đợt 200 mở).
- **GATE0 LÚC MỞ: T5 CHƯA CÓ VÀ T4-CHECK-ONLY FAIL.**
  round200-t56/ mới xuất hiện sau (T56-200 bắt đầu ~11:40Z)
  nhưng chưa có POSTBOOT_PASS; fallback round199-t56/
  POSTBOOT_PASS mtime 07:08:07Z < btime 11:21:41Z, boot
  e6e070b8 nên poller đánh "cu(mtime-cu)", KHÔNG TÍNH —
  đúng thiết kế chống cờ sai boot. **Check-only postboot
  chạy tay exit=1 FAIL** (xem `preflight-postboot-200.log`):
  libs hệ thống VẮNG (libevent/libEGL/libavif/libdw/
  libevdev), GST không tồn tại, thiếu 11 package apt;
  dpkg.log chỉ 2 dòng — replay hệ thống CHƯA chạy trên boot
  mới (F-200-T4-1). **Launch-test riêng KHÔNG chạy đợt
  này** (postboot FAIL dừng trước bước launch; log
  gate0wait-29 PASS cũng không có dòng launch — xem
  F-200-T4-2). Launch được chứng minh bằng attempt1 20/20
  trên WebKit 27.2 + T56 verify POSTBOOT #130 exit 0.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG** (0 X server).
- **RAM lúc mở ~1357 MB avail; load1 ~1,96 lúc mở.**
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 30 poll thật (1 test + 29 poller), 1 lần cửa mở, 0 reboot trong phiên đo

- **Test (POLL_TEST=1), 1 poll, boot c073c8bb
  (11:39:46Z):** RAM 1359 MB, load1 1,96/load5 1,07,
  lock=khong, blockers=0, gate0=khong-dat (postboot_exit=1),
  t5flag=cu(mtime-cu), apt=0, dpkg 2 →
  **TEST-POLL-OK exit 7 đúng thiết kế.** Header deadline
  đúng 13:30:00Z — 0 chuỗi sót.
- **Poller — boot c073c8bb (#130), 29 poll
  (11:39:57–12:01:09Z), 1 lần cửa mở:** RAM ≥1024:
  **29/29** (min 1242, max 3152 MB); **<500: 0/29**;
  load1<2: 14/29; load5<2: **9/29**; gate0:
  **T5 1/29** (chỉ poll #29 — T56 viết POSTBOOT_PASS #130
  12:01:06Z), khong-dat 28/29; lock=co 9 (T01-200 giữ lock
  pid 26823 port 5560, polls #6–#14 — O8), khong 20;
  blockers>0: 11 poll; apt>0: 20 poll (đuôi repair T56);
  dpkg 2→777. **0 reboot trong phiên đo.**
- **Giai đoạn chờ cửa (poll #1–#28):** gate A đủ nhiều lần
  nhưng gate0 chưa đạt (postboot_exit=1 tới poll #28) —
  T56 repair chạy: `apt-get update` (timeout 1500 s) từ
  ~11:45:51Z tới ~12:00Z, rồi cài 11 package (dpkg.log 2 →
  777 trong poll #29). **5 poll "gan-mo"** (đủ load/RAM
  nhưng gate0 chưa đạt): #25 (L1 0,82/L5 1,96), #26
  (0,80/1,80), #27 (0,42/1,56), #28 (0,26/1,35) — cả 4 đều
  apt=1; cộng test poll #1 (apt=0 nhưng gate0 chưa đạt).
- **Cửa mở 1 lần (poll #29, 12:01:09Z):** RAM 1603 MB,
  load1 0,31, load5 1,21, lock=khong, blockers=0, apt=0,
  gate0=T5 (POSTBOOT_PASS #130 ghi 12:01:06Z, chỉ 3 s
  trước) → **CỬA YÊN MỞ**, attempt1 chạy. Poller thoát
  sau attempt1 hợp lệ (12:05:10Z) — không cần poll tiếp.
- **Phân rã 30 dòng poll thật (1 test + 29 poller):**
  RAM≥1024: 30/30; RAM<500: **0/30**. load1<2: 15/30;
  load5<2: 10/30. **"gan-mo" (3 điều kiện load/RAM): 6**
  = 1 lần mở cửa thật (#29) + 5 lần kẹt gate0 (#1 test,
  #25–#28). gate0: T5=1, khong-dat=29. blockers>0: 11 poll.
  apt>0: 20 poll. dpkg 2→777.

## 2. Attempt — 1 attempt (ngân sách dùng 1/3), 1 lượt hợp lệ

- **attempt1-c073c8bb: 20/20 + LỚP B ĐẠT 5/5 + tickCost
  median 55,0 ms — HỢP LỆ.** Cửa sổ: marker 12:01:09Z →
  attempt-done 12:04:36Z (inner-end 12:04:36Z,
  probe_exit=0; run-attempt exit=0 12:04:42Z; analyzers chạy
  NGOÀI cửa sổ 12:04:36–12:05:10Z). JSON 3.063.611 B; flip
  wallMs 27.558 ms; lock vite giữ ~207 s, nhả 12:04:36Z;
  vite :5187 kill sạch (curl 000); sampler dừng sạch
  (101 dòng + 1 header). **0 writePartial TIMEOUT**
  (grep "timeout" run-webkit log = 0; probe_exit=0).
  **tickCost:** tổng n=551 median **55,0** p90 83,0 max
  164 min 28; hậu flip+2000ms n=406 median 56,0.
  BlendTick/pass 22,2; rAF/pass median 33 (26–39).
  **Lớp B: B1 ĐẠT** (load5 cuối 1,41); **B2 ĐẠT
  (load1_max 2,62)**; B3 ĐẠT; **B4 ĐẠT (dpkg delta 0)**;
  **B5 ĐẠT (RAM min 920 MB, 0 mẫu <500; 12/101 mẫu <1024)**.
  **(c2) = 2 seq [332, 357]** (lag +1f cả hai) → P3'
  cộng sổ (xem §7). **P1 YEU** (2/2, p=0,0298);
  **P2 ĐÚNG 2/2** (lag +1f: 1, 1); **P3-A1 YEU** (1/2,
  p=0,4086); **P3' ĐẠT 2/2** (stall_truoc=5, 6);
  **P7 ĐÚNG** (0 entry trễ ≥+1f; đối chứng 0/404).
  **Labellag (b): 0 occurrence ≥5f** (cả hai chiều) —
  **chuỗi 0 occ 0 → 1 (ĐỀ XUẤT)**.
  **Perpass (20 pass):** median 56,5/39,0/55,0/53,5/47,0/
  64,0/41,0/39,5/54,5/40,0/61,0/52,0/63,5/41,0/66,0/56,0/
  38,0/61,5/61,5/58,0 — PHẲNG (~38–66, không tăng theo
  load1); n=23–31 tick mọi pass. **Load1 theo pass TĂNG
  RỒI GIẢM: mean 1,12 → 2,62 (pass 12–13) → 2,03**
  (pass 20); RAM mean rơi 1237 → 936 MB. Tương quan
  median~load1_mean r=0,10 (yếu — khác mẫu tăng đơn điệu
  đợt 199).
- **Ngân sách dùng 1/3; poller thoát 12:05:10Z (có lượt
  hợp lệ — theo thiết kế).** W2/W3 KHÔNG CHẠY.

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN #12 (cách đếm (j)-199: mỗi đợt = 1):
  W1 0 SPIKE.** Watcher T9 (b2watch.sh, poll load1 mỗi
  2 s, ghi spike khi load1 ≥ 3,0; mỗi spike ghi boot_id):
  **W1: 0 spike** (12:01:09–12:04:36Z, 0 dòng trong
  b2-spikes.log; tổng log T9 lúc đóng: 99 spike — tất cả
  NGOÀI W1). Sampler T4 xác nhận độc lập: load1_max 2,62
  < 3,0 — **KHỚP (không spike nào có thể tồn tại)**.
  Chỉ 1 cửa sổ đợt này (poller thoát sau lượt hợp lệ) nên
  dữ kiện #12 = W1 0 spike. T4 chỉ báo số, KHÔNG tự quyết
  tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CỬA SỔ ATTEMPT, 0 FIRE.**
  Live `dry_run=False guard=6291456 consec=2` (T9-200).
  Mẫu autotrigger trong cửa sổ (marker → attempt-done):
  W1 3 mẫu 12:01:39/12:02:39/12:03:39Z (avail
  934.876–1.457.360 kB, load1 1,49–1,99) — **trigger=watch,
  consec=0 ở tất cả các mẫu: 0 FIRE / 0 WOULD-FIRE.**
  RAM avail cao nhất trong cửa sổ: 1.457.360 kB (~1,39 GB)
  lúc 12:03:39Z — vẫn < guard 6.291.456 kB.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 19: ĐẠT
  (F-200-T4-6, ĐỀ XUẤT — chuỗi live ĐẠT 0 → 1).** Áp ĐÚNG
  định nghĩa (p)-192 như đã áp ở #14 (đợt 195) và #16
  (đợt 197) — cả hai lần ĐẠT đều có 0 spike B2 VÀ 1 cửa
  sổ hợp lệ; đợt này **CÓ 1 cửa sổ hợp lệ (W1) VÀ 0 spike
  B2** nên ĐẠT. **Chuỗi live ĐẠT 0 → 1 (ĐỀ XUẤT).**
  T9-200 xác nhận độc lập sau (T9 chưa đóng lúc T4 đóng).
- **O8 T01 TRÊN BOOT c073c8bb — thuộc T01-200 báo cáo
  (T01 giữ lock polls #6–#14, đã nhả trước poll #15).**
  O8 T8 + harness thuộc T8-200 (T8 chưa đóng lúc T4 đóng;
  waiter T8 đã chạy từ trước W1 — xem dưới).
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (kiểm file
  round200-* mtime trong cửa sổ, loại round200-t4):**
  **W1 (12:01:09–12:04:36Z): 0 file trong các thư mục
  round200-*; 0 file round199-* nào bị sửa** (check glob
  đợt trước trong t4-attempt-inner.sh).
  **vite.lock.queue (thư mục): mtime 12:01:09.789** — đúng
  giây marker; bên trong chỉ có `cooldown-t4` mtime 12:04
  (của T4) — mtime thư mục là do **chính T4 acquire vite
  lock lúc mở attempt**, không phải luồng khác.
  **Waiter T8 trong W1 (F-200-T4-4):** `bash
  wait-t4-t5-200t8.sh` (pid 4016) + shell launcher của nó
  (pid 30101, vòng 105×60 s) có mặt trong ps-before VÀ
  ps-after W1 — vòng poll nhẹ mỗi 60 s kiểm
  `round200-t4.done` + grep `windows.md` (đọc — đúng mục
  đích công bố sớm), không ghi file, không workload nặng.
  Giao T2/parent phán (p)-200.
  **Sampler live T9 trong W1:** `sampler-autotrigger.py
  --live` (pid 5860) — daemon đứng, mẫu mỗi 60 s (chính
  là nguồn số live §3 trên); không phải chồng lấn nặng.
  **ps-before W1: 0 Chrome / 0 node tsc-test / 0 vite
  preview** (khác hẳn W1 đợt 199 — F-199-T4-4 KHÔNG tái
  diễn). ps-after W1: chỉ vite :5187 của chính T4.
- **T56 REPAIR — 0 CHỒNG TRONG W1** (repair xong 12:01:06Z,
  3 s TRƯỚC marker; dpkg delta 0 trong cửa sổ; apt=0 ở
  poll #29). Repair trước cửa attempt đầu — KHÔNG tính vi
  phạm (tiền lệ (p)-199: T56 apt trước cửa attempt đầu).
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI QUY
  ĐỊNH.** `run-analyzers-200.sh` chạy NGOÀI cửa sổ
  (12:04:36–12:05:10Z).

## 4. Replay/postboot — POSTBOOT_PASS #130 CÓ (T56, poll=1, repair-som-quyet-h)

- **Boot #130 (c073c8bb, btime 11:21:41Z theo uptime -s —
  SỐ HIỆU ỨNG VIÊN, T01-200 survey) — POSTBOOT_PASS ĐÃ CÓ
  12:01:06Z** (T56; T4 chỉ ghi nhận): "boot c073c8bb
  (btime 2026-11-27 11:21:41Z; watcher-200) —
  repair-som-quyet-h: dpkg 777 dong; cache 108 .deb; lists
  75; postboot PASS poll1 doc lap exit 0 luc
  2026-11-27T12:01:06Z; POSTBOOT_PASS moi ghi
  2026-11-27T12:01:06Z poll=1 (repair-som-quyet-h); co cu
  e6e070b8 luu POSTBOOT_PASS-e6e070b8". **Cùng hồ sơ
  #125/#126/#127/#129** (poll=1, repair — không phải dạng
  replay-đầy-đủ poll=0 của #128). Caveat (b1)/(b2) thuộc
  parent quyết (c)-200.
- **Lệch btime 13 s:** uptime -s = 11:21:41Z, /proc/1 start
  = 11:21:54Z — T01-200 survey 9 nguồn sẽ chốt btime
  chính thức; T4 ghi cả hai số, không tự chọn.
- **Check-only của T4:** FAIL 7 lần (gate0wait-1/5/9/13/17/
  21/25) rồi **PASS ở gate0wait-29** (12:01:09Z, cùng lúc
  gate mở) — PASS độc lập từ T4, khớp cờ T5.
- **Watcher-200:** T4 không theo dõi trực tiếp trạng thái
  watcher — thuộc T56-200 báo cáo.
- **(m) #128 THÔ 0 + (m) boot 06:38:56Z THÔ 1 — phân loại
  CUỐI thuộc T2-200** (T4 không đo (m)).

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND200_T4_WEBKIT_QUIET68_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round200-t4/`):**
  `poll-wait-t4-200.sh`, `run-attempt-200.sh` (lượt yên #68),
  `run-analyzers-200.sh` (classb + 9 analyzer + p1p3p7 NGOÀI
  cửa sổ), `distinct-seq-200.py` (sổ as-of-200 — ĐÃ thăng
  cấp, md5 `2d3ee86c`).
  **KHÔNG stage lại probe** (byte-identical đợt 148–199,
  md5 `4291e539…`), **`t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (theo mẫu 149–199: chỉ stage 4
  script trên), **`b.json`** (md5 `078938cf…`) và
  **`stats-200.py`** (helper làm việc).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (477a0eac) +
  `stats-200.py` + `distinct-seq-200.py` +
  `distinct-seq-ledger.json` (as-of-200, md5 `2d3ee86c`) +
  `distinct-seq-ledger-200-proposed.json` (bản đề xuất, audit
  trail) + `distinct-seq-ledger-198.json` (cơ sở as-of-198,
  md5 `c8792589` KHÔNG ĐỔI) + `preflight-200.txt` +
  `preflight-postboot-200.log` + `round200-t4-copy.py`.
- **Log/evidence (hidden_files/round200-t4/, không stage):**
  `poll-t4.log` (29 poll poller + 1 lần CỬA MỞ #29),
  `poll-t4.nohup.log`, `poll-test-200.log` (1 test poll +
  TEST-POLL-OK exit 7), `chain-t4.log` (start poller + 1 lần
  CỬA MỞ + 1 attempt + poller thoát 12:05:10Z),
  `postboot-t4-200-gate0wait-*.log` (check-only mỗi 4 poll,
  8 file: 7 FAIL + 1 PASS), `stats-200-output.txt`,
  `windows.md` (công bố sớm giờ cửa sổ — W1 thực
  12:01:09–12:04:36Z),
  `preview-b-f3-flip-webkit-t4-attempt1-c073c8bb.json`
  (3.063.611 B),
  `load-mid-t4-attempt1-c073c8bb.log` (101 dòng + header),
  `analyze-t4-attempt1-c073c8bb-*.txt` (10 file — gồm
  `p1p3p7` chạy TỰ ĐỘNG),
  `coverage-check-attempt1-c073c8bb.txt` (2/2, (c2)=2),
  `classb-t4-attempt1-c073c8bb.txt`,
  `ps-before/after-t4-attempt1-c073c8bb.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt1-*.txt`
  (B4: dpkg 777→777). **1 JSON attempt (1 hợp lệ).
  0 process T4 sống lúc đóng** (poller thoát 12:05:10Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4 — chỉ còn socket stale `/tmp/.X11-unix/X193` của chính
  attempt, tạo 12:01 lúc mở attempt, Xvfb đã chết).

## 6. Sai số F-200-T4-1..6 + nợ cũ

- **F-200-T4-1 — PREFLIGHT POSTBOOT FAIL TRÊN BOOT MỚI
  (MỚI — DẠNG NGƯỢC CỦA F-199-T4-2).** Check-only exit=1
  lúc mở (11:39:38Z): libs hệ thống vắng hoàn toàn,
  dpkg.log chỉ 2 dòng — boot mới chưa có replay nào chạy.
  Gate0 bị chặn 28/29 poll cho tới khi T56 repair xong
  (12:01:06Z). Khác đợt 199 (replay xong trước khi T4 mở).
  Bài học: đợt mở ngay sau reboot có thể phải chờ repair
  T56 xong mới có gate0 — poller chờ đúng thiết kế, không
  cần can thiệp.
- **F-200-T4-2 — KHÔNG CÓ LAUNCH-TEST RIÊNG ĐỢT NÀY
  (MỚI).** Preflight postboot FAIL dừng trước bước launch
  nên không có JSON launch=OK riêng; log gate0wait-29 PASS
  cũng không có dòng launch (script check-only không in
  launch khi chạy qua gate0wait). Launch được chứng minh
  bằng attempt1 20/20 trên WebKit 27.2 (probe chạy thật)
  + T56 verify POSTBOOT #130 exit 0. Nợ đợt 201: xác minh
  script postboot có chạy launch trong gate0wait không,
  hay chỉ preflight tay mới có.
- **F-200-T4-3 — LƯỢT HỢP LỆ ĐẦU TIÊN KỂ TỪ #66 (MỚI).**
  #68 hợp lệ ngay attempt1 (ngân sách dùng 1/3) — đứt
  chuỗi 0 lượt hợp lệ của #67. Chuỗi lượt yên 0 → 1
  (ĐỀ XUẤT).
- **F-200-T4-4 — WAITER T8 POLL .done TRONG W1 (MỚI —
  NHẸ, THEO THIẾT KẾ).** `wait-t4-t5-200t8.sh` (pid 4016)
  + launcher (pid 30101) có mặt trong ps-before VÀ
  ps-after W1; vòng poll 60 s kiểm `.done` + grep
  `windows.md` (đọc — đúng mục đích công bố sớm), 0 ghi
  file, 0 workload nặng. Khác F-199-T4-4 (Chrome nặng):
  đây là waiter chờ cờ, không phải job build. Giao T2/
  parent phán (p)-200.
- **F-200-T4-5 — B2 DỮ KIỆN #12: W1 0 SPIKE (MỚI).**
  0 spike trong cửa sổ hợp lệ duy nhất (load1 max 2,62).
  T4 chỉ báo số, KHÔNG tự quyết tách.
- **F-200-T4-6 — (p) LIVE LẦN 19 ĐẠT (MỚI — CHUỖI LIVE
  ĐẠT 0 → 1, ĐỀ XUẤT).** 1 cửa sổ hợp lệ + 0 spike B2 +
  3 mẫu live watch/consec=0, 0 FIRE. T9-200 xác nhận độc
  lập sau.
- **Nợ cũ:** F-199-T4-1 → KHÔNG tái diễn (header deadline
  đúng 13:30Z, test poll sạch); F-199-T4-2 → F-200-T4-1
  (dạng ngược: postboot FAIL lúc mở); F-199-T4-3 →
  F-200-T4-3 (ĐÃ CÓ lượt hợp lệ lại); F-199-T4-4 → KHÔNG
  tái diễn (0 Chrome trong W1); F-199-T4-5 → F-200-T4-5
  (dữ kiện #12: 0 spike); F-199-T4-6 → F-200-T4-6 (live
  ĐẠT — đề xuất); F-199-T4-7 → KHÔNG tái diễn ((c2)=2);
  F-199-T4-8 → KHÔNG tái diễn (0 reboot trong phiên);
  F-199-T4-9 → ĐÃ ÁP DỤNG (snapshot B2 đối chiếu cmdline
  mới phân loại); F-199-T4-10 → KHÔNG tái diễn (blockers=0
  ở poll mở cửa); F-199-T4-11 → KHÔNG tái diễn (0 file
  ghi trong W1).

## 7. P3' cộng dồn (MỚI — 54 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 200 (MỚI): P1 238/242, P2 233/233,
  P3-A1 202/242, P3' 200/214 occurrence = 148/151
  distinct-seq, P7 136/136** (54 lượt hợp lệ — #68 CÓ lượt
  hợp lệ nên cộng thêm 2 seq). Cơ sở: cộng dồn chỉ tính trên
  các lượt yên HỢP LỆ.
- **Đóng góp lượt #68 (attempt1): (c2) 2 occ [332, 357];
  P1 YEU 2/2 (gần run-end, p=0,0298 — verdict YEU theo
  luật DEF §3 vì p>0,01 với n=2); P2 ĐÚNG 2/2 (lag +1f:
  1, 1); P3-A1 YEU 1/2 (p=0,4086); P3' ĐẠT 2/2
  (stall: 332=5, 357=6); P7 ĐÚNG.** Helper
  `distinct-seq-200.py` DÙNG LIVE (quyết (t) đợt 162): sổ
  as-of-198 (147/150 distinct, occ 198/212) +
  stall/c2coverage attempt1-c073c8bb → **148/151 distinct,
  200/214 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 332** (chưa có trong sổ);
  **357 ĐÃ THẤY** (trong sổ). T4 kiểm tay lại sổ as-of-198:
  seq mới 332 vắng thật (không có trong `seen_c2` lẫn
  `seen_dat`); 357 có trong cả hai;
  non_dat_in_union [260, 364, 498] KHÔNG ĐỔI (không seq nào
  trong 3 hố này xuất hiện đợt này). Sổ ĐÃ THĂNG CẤP thành
  as-of-200 (md5 `2d3ee86c`; bản đề xuất giữ lại làm audit
  trail; sổ gốc as-of-198 KHÔNG đổi).
- **P1 — YEU 2/2 occ** (cả 2 seq gần run-end ±1 tick; trong
  19 run_end seqs; baseline 57/330, p=0,0298347 — verdict
  YEU theo luật DEF §3 vì p>0,01). Cộng dồn 236/240 →
  **238/242**.
- **P2 — ĐÚNG 2/2 occ** (cả 2 seq lag +1f: 1, 1;
  DEF §4 chỉ đòi lag ≥ +1f). Cộng dồn 231/231 →
  **233/233**.
- **P3-A1 — YEU 1/2 occ** (1/2 seq đóng băng-tại-tick;
  baseline 76/329, p=0,408644 — verdict YEU theo luật
  DEF §5). Cộng dồn 201/240 → **202/242** (tử số +1 —
  chỉ cộng occurrence ĐÚNG; tiền lệ đợt 195).
- **P3' 2/2 distinct ĐẠT** (stall: 332=5, 357=6).
  Cộng dồn 147/150 → **148/151 distinct** (1 seq ĐẠT MỚI
  — 332); occurrence 198/212 → **200/214**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 8,
  0: 13}; đối chứng toàn bộ drawSrc post: {-1: 269, 0: 135},
  0/404 entry). Cộng dồn 134/134 → **136/136** (theo mẫu
  đợt 185: P7 cộng +n/n khi ĐÚNG cho n seq của lượt).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162):**
  sổ as-of-198 + stall/c2coverage attempt1 → sổ MỚI đề xuất;
  T4 kiểm tay rồi mới thăng cấp thành as-of-200 (md5
  `2d3ee86c`). Đợt 201 copy-forward lấy sổ này làm cơ sở.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên ở mức occurrence** (P1/P2/P3'/P7 đều
  ĐÚNG hoặc YEU cấp lượt do n=2 — F-200-T4-3).
- **Labellag (b) — CHUỖI TRƯỚC #68 = 0; #68 (lượt hợp lệ)
  0 occ / 0 event → chuỗi 0 occ 0 → 1** (lượt hợp lệ 0 occ
  thứ hai liên tiếp kể từ #66).
- Chuỗi median tickCost 54 lượt (MỚI — thêm 55,0 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 / 42,0 / 53,0 / 47,0 / 55,0 / 55,0 ms (tổng
  2571,0; TB 47,6 ms; min 39,0, max 60,0; 0 lượt vượt 60).

## 8. Chờ quyết parent / nợ đợt 201

- **(a) #68 HỢP LỆ (attempt1 20/20, lớp B 5/5, tickCost
  median 55,0 ms) — CHUỖI LƯỢT YÊN HỢP LỆ 0 → 1 (ĐỀ XUẤT
  — parent quyết cuối).** Chân lượt yên cho chuỗi FULL PASS
  **CÓ đợt này** (FULL PASS thuộc parent/T10 quyết cuối).
- **(b) FULL PASS: thuộc T01/T8-200 + parent/T10 quyết cuối.
  Live-check #19 ĐẠT (ĐỀ XUẤT) — T9-200 xác nhận độc lập
  sau.**
- **(c) P3' cộng dồn MỚI 54 lượt: P1 238/242, P2 233/233,
  P3-A1 202/242, P3' 200/214 = 148/151, P7 136/136:**
  sổ distinct-seq ĐÃ thăng cấp as-of-200 md5 `2d3ee86c`.
  **Chờ parent/T10 quyết:** ghi nhận thăng cấp.
- **(d) BOOT c073c8bb (số hiệu #130 ỨNG VIÊN — T01-200 xác
  minh; btime 11:21:41Z/11:21:54Z lệch 13 s).
  POSTBOOT_PASS #130 CÓ (12:01:06Z, poll=1,
  repair-som-quyet-h) — caveat (b1)/(b2) thuộc parent
  quyết (c)-200. (m) #128 THÔ 0 + (m) boot 06:38:56Z THÔ 1
  (T2-200); INSIDE (T2-200).**
- **(e) PRE-FLIGHT CHECK (quyết (t) đợt 158) TIẾP TỤC CHỨNG
  MINH HIỆU QUẢ — giữ làm quy tắc đứng.** Đợt này test poll
  sạch (0 chuỗi deadline sót) nhưng postboot check-only
  FAIL lúc mở vì boot mới chưa repair (F-200-T4-1).
- **(f) POSTBOOT_PASS #130 CÓ (12:01:06Z, poll=1,
  repair-som-quyet-h). Tổng boot không cờ GIỮ NGUYÊN nếu
  parent chấp nhận (T01/T2-200 phán cuối).**
- **(g) RAM 0 poll <500 MB (min 1242 MB) — không có episode
  RAM thấp đợt này; giao T9-200 phán (nếu có).**
- **(h) (m) #128/(m) boot 06:38:56Z (T2-200); INSIDE
  (T2-200); POSTBOOT_PASS #130 (T56-200); số hiệu
  c073c8bb = #130? (T01-200 xác minh — parent quyết (e)
  aggregate 200); OUTAGE phán cuối T7-200; auto-trigger lần
  FIRE thật đầu tiên — VẪN CHƯA XẢY RA (T9-200); B2 dữ
  kiện #12 (0 spike — BẢN NÀY); (m) #56 / mù hole-recheck /
  prune / headroom / ENOSPC / 84l10 / 86n2-P1 / B2 live sạch
  (T2/T7/T9-200 phán — T4 không nắm số chạy); E-247 kết cục
  (T9-200); run kết cục (T7-200).**
- **(i) B2 DỮ KIỆN #12: W1 0 SPIKE (F-200-T4-5). Luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách. Auto-trigger LIVE chạy trong cửa sổ
  attempt, 0 FIRE** — lần FIRE thật đầu tiên vẫn chưa xảy
  ra; T9-200 verify end-to-end khi có FIRE.
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (attempt1) → **1 lượt yên hợp lệ #68 cho chuỗi FULL
  PASS.** O8 T01 trên c073c8bb (T01-200 báo cáo); O8 T8 +
  harness thuộc T8-200 báo cáo (T8 chưa đóng lúc T4 đóng).
- **(k) F-200-T4-1 (preflight postboot FAIL — boot mới chưa
  repair); F-200-T4-2 (không launch-test riêng);
  F-200-T4-3 (lượt hợp lệ đầu kể từ #66);
  F-200-T4-4 (waiter T8 poll .done trong W1 — nhẹ);
  F-200-T4-5 (B2 dữ kiện #12: 0 spike);
  F-200-T4-6 ((p) live lần 19 ĐẠT — chuỗi live ĐẠT 0 → 1).**

## Phụ lục A — stats-200-output.txt (tóm tắt)

```
test: 1 poll, RAM 1359 >=1024: 1/1, load1<2: 1/1, gate0: khong-dat=1
poller (c073c8bb #130): 29 poll 11:39:57-12:01:09Z, RAM 1242-3152 >=1024: 29/29
  <500: 0/29, load1<2: 14/29, load5<2: 9/29, gate0: T5=1, khong-dat=28
  lock: co=9 (T01-200), khong=20, dpkg 2->777
TONG: 30 dong poll; RAM min=1242 max=3152 >=1024: 30/30 <500: 0/30
gan-mo (3 dk load/RAM): 6 = 1 mo cua that (#29) + 5 ket gate0 (#1 test, #25-#28)
P3' (54 luot): P1 238/242 P2 233/233 P3-A1 202/242 P3' 200/214 = 148/151 P7 136/136
median 54 luot: n=54 mean=47,6 min=39,0 max=60,0 vuot-60: 0
```
