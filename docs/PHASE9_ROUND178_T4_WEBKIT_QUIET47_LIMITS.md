# PHASE9_ROUND178_T4_WEBKIT_QUIET47_LIMITS.md

**Đợt:** 178. **Luồng:** T4 — đo lượt yên WebKit #47 trên 2 boot
+ **#47 CÓ LƯỢT HỢP LỆ — attempt1-97054ac6 (20/20 + lớp B 5/5 +
  tickCost median 45,0 ms ≤60). CHUỖI LƯỢT YÊN HỢP LỆ 40 → 41.**
  Attempt1 thành công ngay lần đầu (ngân sách dùng 1/3) — trên
  boot #93 (ứng viên), sau khi poller bị reboot #93 giết giữa
  chừng trên boot #92 và T4 khởi động lại tay (xem §1, §4).
+ **CỘNG DỒN MỚI (41 lượt hợp lệ): P1 177/181, P2 172/172,
  P3-A1 150/181, P3' 141/153 occurrence = 117/121 distinct-seq,
  P7 75/75.** Sổ distinct-seq ĐÃ THĂNG CẤP as-of-178
  (md5 `761fd9dd…`; valid_rounds_p3 29;
  non_dat [260, 283, 364, 498] — không đổi).
+ **BOOT ĐO: 97054ac6 (btime 13:07:35Z, ứng viên #93 — số hiệu
  chờ T0-178 xác minh). GATE0 = T4-CHECK-ONLY (KHÔNG CÓ CỜ T5
  CHO #93 — xem §4).** T5-178 viết POSTBOOT_PASS cho #92
  (replay-đầy-đủ, 11:53:41Z, dpkg 1545) nhưng cửa KHÔNG MỞ
  lần nào trên #92 (RAM bị balloon ghìm 67/118 poll <500).
**Ngày:** 23/11/2026 (lượt cron 18:35 +07 23/11 = 11:35:51Z).
**Boot đo:** HAI boot — 985bc2a3 (ứng viên #92, btime
11:01:27Z; 118 poll, 0 cửa mở) + 97054ac6 (ứng viên #93,
btime 13:07:35Z; 5 poll, 1 cửa mở → attempt1 hợp lệ).
**1 reboot trong phiên T4** (#93, giết poller giữa chừng —
xem §1, §4; 0 attempt bị giết vì chưa có attempt nào chạy).

## 0. Verdict tổng

- **#47 CÓ LƯỢT HỢP LỆ (attempt1-97054ac6).**
  Cửa mở lần duy nhất ở poll #5 instance 3 (13:12:15Z):
  gate0=T4-check-only (PB=0, pb_age=0) + RAM 1567 MB +
  load1 1,61/load5 1,53 + lock khong + blockers 0 + apt 0 →
  attempt1 chạy 13:12:16–13:16:08Z:
  **20/20 pass, lớp B DAT 5/5, tickCost median 45,0 ms ≤60**
  → LUOT HOP LE, poller thoát 0 lúc 13:16:08Z. Ngân sách dùng
  **1/3**.
- **Hai boot, một reboot giết poller:** instance 2 (118 poll)
  chạy trọn trên boot 985bc2a3; reboot #93 xảy ra giữa poll
  #118 (13:07:43Z) và lần kiểm 13:08:17Z — poller chết trong
  lúc sleep giữa các poll (0 dòng REBOOT PHAT HIEN trong log);
  T4 khởi động lại tay 13:09:15Z (instance 3, 5 poll) trên
  boot mới 97054ac6; 0 attempt bị reboot giết (chưa attempt
  nào chạy trước reboot); 0 attempt-done trước khi khởi động
  lại — ngân sách 3/3 còn nguyên.
- **Chuỗi lượt yên hợp lệ: 40 → 41.** Median tickCost attempt1 =
  45,0 ms (chuỗi 41 lượt: mean 47,9, min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60 — chuỗi median ĐÃ SỬA: xem F-178-T4-2,
  §6; LIMITS 177 §7 in thiếu median #45 là 46,0 ms).
- **Điều kiện GIỮ NGUYÊN như #46 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NÀO TRONG LÚC
  PROBE PASS CHẠY: 0 VI PHẠM.** Ps-before/after attempt1:
  0 dòng m56 (grep -c = 0 cả 2 file); không có script phân tích
  nặng nào của luồng khác trong cửa sổ attempt (chỉ có watcher/
  sampler nhẹ thường trực của T5/T9 + 1 tick probe-mo-93c nhẹ
  của T9 lúc 13:13:10Z — k8-headroom.py trả 0,0 ngay (headroom
  0, không thêm watch nào), xem §3 + F-178-T4-1; 1 lần đọc
  trạng thái nhẹ của chính T4 lúc 13:12:25Z — tail/ls/pgrep,
  không phân tích, không probe dpkg). Mọi phân tích của chính
  T4 đều làm SAU khi poller thoát (từ ~13:16Z). Pre-flight +
  2 test poll chạy TRƯỚC khi mở poller / ngoài cửa sổ attempt.
  T4 không chạy probe chạm dpkg nào trong cả phiên (chỉ đọc
  `wc -l` dpkg.log + `pgrep -x`).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller instance 2, lúc attempt1, lúc đóng — không đổi;
  mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round178-t4.done` viết ~13:2xZ 23/11
  (trong hạn cờ ~14:00Z), CÓ NỘI DUNG; boot lúc kiểm lần cuối
  TRƯỚC KHI ĐÓNG (13:20:43Z) là 97054ac6 — không đổi từ lúc
  attempt1.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-177-T4-6)

Chạy **trước mọi attempt, trước khi mở poller** (11:38–11:39Z),
ghi vào `hidden_files/round178-t4/preflight-178.txt` — **PASS**
(0 sót; grep stale-string sạch ngay lần đầu — khác đợt 177).
Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–177:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq gốc as-of-177 md5
  `cd6ef445…` (occ 135/147, distinct 113/117, valid_rounds_p3 28).
- **10/10 analyzer** có mặt; `bash -n` OK 4 script T4;
  `py_compile` OK 13 file py; Playwright-core có mặt
  (`/home/hatch/scratch-round63-r4/.../playwright-core/index.mjs`,
  import OK, webkit object); media `stripes-nonperiodic.mp4`
  (140.828 B) có mặt; không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-23
  13:30:00 UTC` → **1795440600** = 13:30Z (hạn cờ ~14:00Z =
  1795442400, hạn cứng 14:35Z = 1795444500); grep 0 hit cho
  `10:30`/`11:00`/`11:30`/`07:30`/`round177-t4`/`poll-test-177`/
  `WebKit #46`/`T4-177a`/`default=177` trong script mới;
  `round177` chỉ còn fallback `round177-t5/` + glob `round177-*`
  (có chủ đích).
- **Copy-forward 177 → 178:** deadline `10:30Z` → `13:30Z`;
  hạn cờ/cứng `11:00Z`/`11:30Z` → `14:00Z`/`14:35Z`; T5FLAG
  chính `round178-t5/` + fallback `round177-t5/`; W trong 4
  script ĐÃ LÀ `round178-t4`; `T4-177a` → `T4-178a`;
  `default=177` → `default=178`; `WebKit #46` → `#47`;
  glob chống nhiễu `round176-*` → `round177-*`.
  (Grep stale-string sau copy-forward sạch ngay lần đầu —
  F-177-T4-6 không tái diễn.)
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 177); **`tree-md5.txt` KHÔNG có trong
  danh sách cleanup đợt này (F-175-T4-1 đã sửa) — còn nguyên,
  nội dung 530e10a7.**
- **Freeze check (F-164-T4-1):** `round177-t4` còn **0 file
  mtime ≥ 11:35:51Z** (giờ mở đợt 178).
- **GATE0 LÚC MỞ: CHƯA ĐẠT TRÊN BOOT #92 (ứng viên).**
  dpkg.log CHỈ 2 dòng (11:35:44 "startup packages configure" ×2
  — replay hệ thống `dpkg --configure -a`, pid 844/865
  apt-get update đang chạy); postboot check-only chạy tay
  **exit 1 FAIL** (wrapper PASS K1, GST PASS 269=269 qua
  symlink tạm → debroot, libs FAIL thiếu 5, apt FAIL thiếu 11
  gói — xem `preflight-postboot-178.log`); co T5-178 CHƯA CÓ
  lúc mở (round178-t5/ chưa tồn tại); co T5-177 chỉ ghi boot
  94247dfa — KHÔNG tính cho boot mới (đúng luật F-151-T5-3:
  fallback mtime-cu). Gate0 lúc mở CHƯA ĐẠT — poller CHỜ
  T5-178 xong + viết POSTBOOT_PASS #92 (chính) hoặc
  check-only PASS (dự phòng). Đây là TRẠNG THÁI GATE, không
  phải lỗi setup — pre-flight PASS.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (11:39:11Z): RAM 3727 MB, load1 6,21/load5 3,39,
  gate0=khong-dat, apt=1 (replay hệ thống), dpkg 2.
  Lần 2 (11:39:13Z): RAM 3742 MB, load1 5,87/load5 3,37,
  gate0=khong-dat, apt=1, dpkg 2. Chỉ load vượt 2 + gate0
  chưa đạt nên cửa chưa mở — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`).
- **RAM lúc mở 3154–3742 MB; load1 5,10–6,21 / load5 2,89–3,39
  lúc mở** — cửa chỉ mở khi đủ mọi điều kiện (poll #5
  instance 3, trên boot mới #93).
- **F-176-T4-2 ĐÃ SỬA + KIỂM CHỨNG LIVE đợt này (lần 2):**
  `check-classb-t4.sh` đếm sampler n chỉ trên dòng `boot=`
  (grep -c "^boot=") — attempt1 ghi n=100 = đúng 100 dòng
  mẫu thật (không thừa header `sampler-start` nữa).

## 1. Poller — 125 poll thật (2 test + 118 trên #92 + 5 trên #93), 1 lần cửa mở, 1 reboot giết poller

- **Instance 1 — TEST (POLL_TEST=1), 2 poll, boot 985bc2a3
  (11:39:11Z, 11:39:13Z):** cả 2 đều RAM ≥1024 (3727/3742 MB),
  load1 6,21/5,87, load5 3,39/3,37, gate0=khong-dat, lock=khong,
  blockers=0, apt=1 (replay hệ thống) → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần).
  2 poll này nằm trong `poll-test-178.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot 985bc2a3, 118 poll (11:39:24–13:07:43Z),
  0 lần cửa mở:** RAM ≥1024: 27/118 (min 405, max 4185 MB);
  500–1023: 24/118; **<500: 67/118**; load1<2: 86/118;
  load5<2: 77/118; gate0: **T5 99/118** (từ poll #20),
  khong-dat 19/118; lock=khong 113, co 5 (T0 giữ, poll
  #24–#26); blockers>0: 5 poll; apt>0: 19 poll;
  dpkg 2 → 1545 (replay hệ thống + T5 xong giữa phiên).
- **Giai đoạn 1 — replay hệ thống đang chạy (poll #1–#19,
  11:39:24–11:53:01Z):** gate0=khong-dat suốt (postboot exit 1
  ở các lần check-only #1/#5/#9/#13/#17 — libs/apt thiếu);
  apt=1 (replay hệ thống: apt-get update pid 865 rồi install
  pid 130082+; dpkg 2 → 1406 lúc 11:52:16Z); load1 1,75–10,17
  (cao lúc các luồng khác làm việc); RAM 4185 (max, poll #3)
  → ~1076 MB (poll #20).
  Cửa KHÔNG MỞ ĐƯỢC vì thiếu gate0 + apt + load.
- **Giai đoạn 2 — cờ T5 có nhưng PB cũ + load/RAM chặn
  (poll #20–#23, 11:53:46–11:56:03Z):** T5-178 viết
  POSTBOOT_PASS 11:53:41Z (replay-đầy-đủ, dpkg 1545 —
  xem §4); gate0=T5, apt=0, dpkg 1545, NHƯNG postboot_exit=1
  ở poll #20 (check-only cuối chạy lúc replay chưa xong) nên
  cửa KHÔNG MỞ (poller đòi cả PB=0 — fail-closed theo thiết
  kế; cùng mẫu F-177-T4-1). Poll #21 PB=0 nhưng load
  3,13/3,63 + RAM 947 MB → cửa KHÔNG MỞ.
- **Giai đoạn 3 — T0 chặn cửa (poll #24–#26,
  11:56:48–11:58:20Z):** T0-round178 giữ vite.lock
  (pid 136581, port 5560) + blockers 5 → 1; load1 7,07–9,21;
  RAM 709–1327 MB. Cửa KHÔNG MỞ ĐƯỢC vì thiếu lock +
  blockers + load (tái diễn dạng F-177-T4-2 — xem §6).
- **Giai đoạn 4 — load yên nhưng RAM bị ghìm (poll #27–#118,
  11:59:xx–13:07:43Z):** T0 nhả lock từ poll #28; gate0=T5,
  PB=0, apt=0, lock=khong, blockers=0 suốt — chỉ còn RAM
  chặn cửa. RAM rơi 1736 → 452 MB rồi GHÌM Ở ~410–520 MB:
  **chuỗi RAM<500 dài nhất 35 poll liên tiếp (#41–#75,
  12:09:40–12:35:18Z)**; chỉ 2 lần RAM nhích >500 rồi rơi lại
  (#76–#77: 517/501 MB; #88–#89: 615/834 MB — lần hồi cao
  nhất 834 MB, vẫn thiếu ~190 MB mới tới ngưỡng 1024).
  RAM ≥1024 lần cuối trên #92: poll #33 (12:03:38Z);
  sau đó KHÔNG poll nào ≥1024 nữa. Load yên dần
  (load1 0,18–1,06, load5 0,42–1,17 từ poll #42 trở đi) —
  máy yên hẳn về CPU nhưng RAM không hồi. **0 cửa mở trên #92.**
- **REBOOT #93 GIẾT POLLER (giữa poll #118 và lần kiểm
  13:08:17Z):** poll cuối trên #92 là #118 lúc 13:07:43Z
  (RAM 442 MB); lúc kiểm 13:08:17Z boot đã là 97054ac6
  (btime 13:07:35Z, who -b 13:07, uptime 1 phút lúc 13:08:41Z);
  poller KHÔNG CÒN process (chết trong lúc sleep 45 s giữa
  các poll — **0 dòng REBOOT PHAT HIEN trong poll log**);
  dpkg.log reset về 2 dòng (13:08:10/11 "startup packages
  configure"); RAM avail sau reboot 1902 MB (balloon đã xả).
  **Lệch 8 s chưa giải thích được:** btime #93 13:07:35Z
  SỚM HƠN timestamp poll #118 (13:07:43Z) — khả năng đồng hồ
  cũ trôi ~8 s. T4 ghi nhận cả hai mốc như quan sát được;
  khung chết chính xác của #92 + số hiệu #93 thuộc T0-178
  xác minh 9 nguồn. **Gap #92→#93 = 7.568 s.**
- **KHỞI ĐỘNG LẠI TAY (F-175-T4-5):** T4 khởi động lại poller
  13:09:15Z trên boot mới (instance 3) — 0 attempt-done,
  ngân sách 3/3 còn nguyên, không có vite.lock; poller chạy
  lại từ đầu với CURBOOTID=97054ac6.
- **Instance 3 — boot 97054ac6, 5 poll (13:09:15–13:12:15Z),
  1 lần cửa mở:** RAM 1479–1812 MB (5/5 ≥1024);
  load1<2: 1/5; load5<2: 5/5; gate0: khong-dat 4/5,
  **T4-check-only 1/5** (poll #5); lock=khong 5/5;
  blockers=0; apt>0: 2 poll (replay hệ thống trên #93 chạy
  NHANH: dpkg 461 lúc poll #1 → 1545 lúc poll #5 — chỉ ~3
  phút, nhờ cache/lists còn ấm từ #92);
  check-only chạy lại ở poll #5 → **exit 0 PASS (PB=0)**.
- **Giai đoạn 5 — cửa mở (poll #5 instance 3, 13:12:15Z):**
  load1 1,61/load5 1,53, RAM 1567 MB, gate0=T4-check-only
  (pb_age=0), PB=0, apt=0, lock=khong, blockers=0, tree=YES →
  **CỬA MỞ, attempt1 chạy ngay**. Poller thoát 0 sau attempt1
  hợp lệ (13:16:08Z), trước hạn cắt 13:30Z tới 74 phút.
- **Phân rã 125 poll thật:** RAM≥1024: 34/125; RAM 500–1023:
  24/125; RAM<500: **67/125**. load1<2: 87/125; load5<2:
  82/125. **Stats "gan-mo" đếm 1 = mở cửa thật 1 — F-177-T4-1
  KHÔNG tái diễn dạng này** (xem §6). gate0: T5 99/125,
  T4-check-only 1/125, khong-dat 25/125. blockers>0: 5 poll
  (toàn lúc T0 giữ lock). apt>0: 21/125. **RAM <500 MB:
  67/125 poll** (toàn trên #92; trên #93: 0/5). Ghi nhận để
  T9-178 đối chiếu headroom/balloon trên cả hai boot.

## 2. Attempt — 1 attempt (hợp lệ ngay lần đầu), ngân sách dùng 1/3

- **Attempt1 — attempt1-97054ac6, 13:12:16–13:16:08Z,
  LUOT HOP LE (20/20 + lớp B 5/5 + tickCost median 45,0 ms).**
  - Vite lock v2: lấy ticket ngay (chờ 0s). Xvfb :193 lên
    13:12:2xZ. WebKit 27.2, app boot OK. Pass 20 xong ~13:14Z
    (37 khung rAF/pass; rAF/pass median 37); partial JSON
    20/20 ghi ~13:14Z (tickCost n=660, blendTick n=536,
    c2DrawLog n=1281).
  - Probe exit 0; JSON 3.557.454 B; flip afterPass=5,
    wallMs=25359; tickCost total n=660 median=**45,0** p90=70,0
    max=106 min=27; hậu flip+2000ms n=489 median=43,0.
    BlendTick/pass=26,8; rAF/pass median=37 (min 32, max 45).
    pageErrs=[].
  - Lớp B attempt1: **DAT 5/5** (sampler n=100 — đúng 100 mẫu
    thật sau fix F-176-T4-2; load1 max 1,80, RAM min 1056 MB
    max 1699 MB, 0 mẫu <500 MB, **0/100 mẫu <1024 MB** (khác
    đợt 177: 59/100 mẫu <1024 — lần này RAM trong attempt tốt
    hẳn); load5 cuối 1,10; boot không đổi; dpkg delta 0;
    apt/dpkg = 0). Ps-before/after: **0 dòng m56**
    (xem §3, F-178-T4-1 — KHÔNG vi phạm).
  - Per-pass (20 pass): tick median 39,0–54,0 ms; wall
    2937–3578 ms; load1 mean 1,55–1,80; RAM mean 1062–1437 MB.
    Tương quan Pearson: median~load1_mean r=0,08;
    median~RAM_mean r=0,78 (chỉ mô tả, không kết luận nhân quả).
  - Kiểm chứng độc lập từ JSON gốc (T4 tự tính, không dùng
    analyzer): passes=20, engine=webkit, webkitVersion 27.2,
    pageErrs=[]; tickCost (trường `total`) n=660 median=45,0
    p90=70 max=106 min=27 — KHỚP analyzer từng số; hậu
    flip+2000ms n=489 median=43,0 — KHỚP; c2DrawLog n=1281
    (results/b/y2/c2DrawLog).
- **Ngân sách dùng 1/3.** Không attempt nào bị reboot giết
  (reboot #93 xảy ra TRƯỚC khi có attempt nào; 0 attempt
  chạy trên #92); 2 attempt còn lại chưa dùng.

## 3. B2 spike / đối chiếu sampler T9 (theo nhiệm vụ đợt 177–178)

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT HỢP LỆ (attempt1,
  13:12:16–13:16:08Z): 0 SPIKE.** Sampler T4 (2 s, n=100):
  load1 max 1,80 (≤4 nên lớp B DAT); poller poll #5 instance 3
  load1 1,61; ram-sampler T9 quanh cửa sổ: load1 1,55
  (13:12:54Z), 1,38 (13:13:54Z), 0,64 (13:14:54Z) — không
  spike; **`b2-spikes.log` của T9-178: tổng 35 spike, spike
  cuối 13:10:29Z (load1 3,62) — TRƯỚC cửa sổ attempt, log
  mtime 13:10:33Z, KHÔNG có spike nào trong cửa sổ.**
  **Attempt1 chạy trong cửa sổ hoàn toàn sạch B2.**
- **T9-178 ĐÃ CÓ `b2-spikes.log` lúc T4 đóng** (khác đợt 177 —
  F-177-T4-4 ĐÃ HẾT: đối chiếu B2 độc lập từ phía T9 CÓ).
- **Lưu ý timestamp trong ghi chú T9 (F-178-T4-1, xem §6):**
  `t9-178-baseline-notes.md` ghi "B2 trên #93: có 2 spike
  mới lúc 13:13Z" — SAI GIỜ: 2 spike mới nhất trong
  `b2-spikes.log` là **13:09:54Z (load1 3,10) + 13:10:29Z
  (load1 3,62)**, cả hai TRƯỚC cửa sổ attempt (13:12:16Z);
  không có spike nào lúc 13:13Z. Giao T9-178 sửa timestamp
  trong ghi chú. Không ảnh hưởng verdict attempt (0 spike
  trong cửa sổ theo cả 3 nguồn: sampler T4 + ram-sampler T9
  + b2-spikes.log T9).
- **Đối chiếu sampler T9 (độc lập):** RAM min poller trên #92
  405 MB (poll #41–#75 ghìm ~410–520); RAM min attempt1
  1056 MB (sampler T4) — attempt hợp lệ chạy trên RAM tốt
  hơn hẳn cửa sổ chờ trên #92. Phân tích balloon/headroom
  thuộc T9-178.

## 4. Replay/postboot — POSTBOOT_PASS #92 ĐÃ CÓ (replay-đầy-đủ); #93 CHƯA CÓ cờ T5; 1 reboot giết poller

- **Boot 985bc2a3 (btime 11:01:27Z, ứng viên #92 — CHƯA xác
  minh số hiệu; T0-178 xác minh 9 nguồn): replay HỆ THỐNG
  tới (os-intent replay pid 844: apt-get update pid 865 rồi
  install; dpkg.log 2 → 1545 dòng; gst_sys 0 → 269;
  lists 3 → 37; cache 178 .deb) — T5-178 chỉ quan sát
  (replay-watch-178 poll 30 s/lần) rồi xác nhận độc lập.
- **POSTBOOT_PASS #92 ĐÃ CÓ 11:53:41Z** (boot+52m14s;
  watcher-178, **mode replay-day-du (replay-đầy-đủ),
  poll=0**, dpkg 1545 dòng, cache 178 .deb, lists 37;
  postboot PASS poll0 độc lập exit 0 lúc 11:53:41Z; cờ cũ
  94247dfa lưu POSTBOOT_PASS-94247dfa). **Cờ REPLAY-ĐẦY-ĐỦ
  — KHÔNG caveat** (mẫu 1545 dòng như #86/#89; khác cờ
  repair-1-phần của #90 đợt 177). Gate0=T5 từ poll #20
  instance 2. **T4-check-only KHÔNG cần dùng làm gate0 chính
  trên #92** (chỉ dùng kèm điều kiện PB=0); check-only của T4
  PASS độc lập ở poll #21 (exit 0).
- **Boot 97054ac6 (btime 13:07:35Z, ứng viên #93 — CHƯA xác
  minh số hiệu; T0-178 xác minh 9 nguồn): replay HỆ THỐNG
  chạy NHANH (dpkg.log 2 → 461 lúc poll #1 instance 3,
  13:09:15Z → 1545 lúc poll #5, 13:12:15Z — chỉ ~3–5 phút
  sau boot, nhờ cache/lists còn ấm từ #92); T4-check-only
  PASS độc lập ở poll #5 (exit 0) → gate0=T4-check-only.
  POSTBOOT_PASS #93 CHƯA CÓ — T5-178 chưa viết (watcher-178
  của T5 chết theo reboot #93; T5-178 lo resume).**
  **Gate0 của attempt1 hợp lệ LÀ T4-check-only (quyết (j)
  đợt 143).** Giá trị cho gate (a) của chuỗi FULL PASS thuộc
  T8/T10 quyết (tiền lệ: O8 T8 trên #91 đợt 177 cũng qua
  fallback T8-check-only).
- **REBOOT #93 (ứng viên) 13:07:35Z (boot 97054ac6, gap
  #92→#93 = 7.568 s)** — xảy ra giữa poll #118 (13:07:43Z)
  và lần kiểm 13:08:17Z, giết poller trong lúc sleep (xem §1);
  KHÔNG giết attempt nào (chưa attempt nào chạy); KHÔNG ảnh
  hưởng verdict #47 (attempt1 chạy trọn trên #93 sau khi
  poller khởi động lại). Số hiệu #93 chờ T0-178 xác minh
  9 nguồn; (m) #93 + INSIDE #93 thuộc T2-178;
  #93 có giết holder không thuộc T6-178. POSTBOOT_PASS #93
  thuộc T5-178.
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-178 báo cáo. (T4 chỉ ghi:
  attempt1 chạy sạch 20/20 ngay lần đầu — không wedged.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND178_T4_WEBKIT_QUIET47_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round178-t4/`):**
  `poll-wait-t4-178.sh` (deadline 13:30Z 23/11 + cờ T5
  round178-t5/ + fallback round177-t5/),
  `run-attempt-178.sh` (lượt yên #47),
  `distinct-seq-178.py` (ĐÃ DÙNG LIVE trên dữ liệu attempt1 —
  xem §7; khi chạy từ `apps/web/scripts/` phải truyền `--ledger`
  trỏ tới sổ, nếu không helper lỗi FileNotFoundError).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–177, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round178-t4/` — theo đúng mẫu 149–177: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round178-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–177).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-178.sh`, `run-attempt-178.sh`,
  `t4-attempt-inner.sh` (W = round178-t4 + glob check nhiễu
  chéo round177-*), `check-classb-t4.sh` (W = round178-t4 +
  đếm sampler n chỉ dòng `boot=` — fix F-176-T4-2),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-178.py` (thống kê §A;
  footer ĐÃ CẬP NHẬT cộng dồn 41 lượt),
  `distinct-seq-178.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-178: 117/121 distinct, occ 141/153, valid_rounds_p3 29,
  non_dat [260, 283, 364, 498];
  md5 `761fd9ddb0d6a6c50188883907f416fe`),
  `distinct-seq-ledger-178-proposed.json` (bản helper ghi ra
  trong live run — ĐÃ DÙNG để thăng cấp sổ; audit trail),
  `preflight-178.txt` + `preflight-postboot-178.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-177-T4-6).
- **Log/evidence (hidden_files/round178-t4/, không stage):**
  `poll-t4.log` (118 poll instance 2 trên #92 + 5 poll
  instance 3 trên #93 + 0 REBOOT PHAT HIEN — poller chết
  trong lúc sleep), `poll-test-178.log` (2 test poll +
  2 TEST-POLL-OK exit 7), `poll-t4.nohup.log` (instance 2)
  + `poll-t4.nohup2.log` (instance 3, khởi động lại tay),
  `chain-t4.log` (start poller ×2 + 1 CUA YEN MO +
  attempt1 LUOT HOP LE),
  `postboot-t4-178-gate0wait-*.log` (check-only mỗi 4 poll:
  instance 2: #1/#5/#9/#13/#17 exit 1, #21 exit 0;
  instance 3: #1 exit 1, #5 exit 0),
  `stats-178-output.txt` (output stats-178.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có
  blockers: #24–#26 T0 giữ lock),
  `preview-b-f3-flip-webkit-t4-attempt1-97054ac6.json`
  (3.557.454 B, 20/20, probe exit 0),
  `classb-t4-attempt1-97054ac6.txt` (DAT 5/5),
  `analyze-t4-attempt1-97054ac6-*.txt` (10 analyzer attempt1,
  gồm p1p3p7 chạy TAY — xem F-174-T4-5, không tái diễn),
  `coverage-check-attempt1-97054ac6.txt` (6/6),
  `load-mid-t4-attempt1-97054ac6.log` (n=100 mẫu thật),
  `run-webkit-t4-attempt1-97054ac6.log` (20/20),
  `ps-before/after-t4-attempt1-97054ac6.txt` (0 dòng m56),
  `dpkg-lines-before-attempt1-97054ac6.txt` (1545) +
  `apt-history-before-attempt1-97054ac6.txt`,
  `attempt-done-attempt1-97054ac6` (exit=0).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  13:16:08Z exit 0; vite :5187 trống, curl 000;
  `/tmp/.X11-unix/` TRỐNG sau khi T4 dọn tay X193 lúc đóng,
  xem F-178-T4-3).

## 6. Sai số F-178-T4-1..3 (+ nợ cũ)

- **F-178-T4-1 — TICK probe-mo-93c CỦA T9 LÚC 13:13:10Z
  TRONG CỬA SỔ ATTEMPT (GHI NHẬN — KHÔNG VI PHẠM).**
  Shell T9 (pid 8426, chu trình probe định kỳ) chạy tick
  probe-mo-93c lúc 13:13:10Z, trong cửa sổ attempt1
  (13:12:16–13:16:08Z): `k8-headroom.py` trả 0, 0 ngay
  (headroom 0 — không thêm watch inotify nào, không tạo file
  tạm) + echo/heredoc nhẹ. Không gây spike: sampler T4 load1
  max 1,80; ram-sampler T9 1,55/1,38/0,64; b2-spikes.log 0
  spike trong cửa sổ. Verdict: probe NHẸ, không vi phạm
  F-175-T4-2 (luật cấm script NẶNG). Đề nghị T9 dời tick
  probe tránh cửa sổ attempt khi có thể. Kèm theo: timestamp
  "13:13Z" cho 2 spike mới trong `t9-178-baseline-notes.md`
  là SAI — 2 spike thực là 13:09:54Z + 13:10:29Z (trước cửa
  sổ); giao T9-178 sửa.
- **F-178-T4-2 — CHUỖI MEDIAN LIMITS 177 §7 THIẾU MEDIAN #45
  (46,0 ms) — PHÁT HIỆN KHI ĐÓNG SỔ ĐỢT NÀY (GHI NHẬN —
  KHÔNG ĐỔI VERDICT 177).** Chuỗi in ở LIMITS 177 §7 có 39
  số (tổng 1871,0) nhưng ghi "40 lượt": đã THAY median #45
  (46,0 ms — xác nhận ở LIMITS 176 dòng 5) bằng 50,0 (#46)
  thay vì THÊM 50,0 vào cuối. Mean 47,9 in ở đợt 177 VẪN
  ĐÚNG (chuỗi thật 40 số tổng 1917,0 → 47,925 → 47,9).
  Chuỗi ĐÚNG 41 lượt đợt này: xem §7 (tổng 1962,0; mean
  47,9; min 39,0; max 60,0; 0 vượt 60). Đề nghị T1-178/T10
  ghi nhận khi tái kiểm (chỉ sửa danh sách in, không đổi
  số cộng dồn nào của đợt 177).
- **F-178-T4-3 — X193 SOCKET LÚC ĐÓNG LÀ CỦA CHÍNH T4 (đã dọn
  tay — giống F-177-T4-3/F-176-T4-3/F-175-T4-6).** Sau khi
  poller thoát, `/tmp/.X11-unix/` còn X193 (Xvfb :193 của
  attempt1, process đã chết nhưng socket còn). T4 đã `rm`
  X193 lúc đóng (13:2xZ); lúc đóng `/tmp/.X11-unix/` TRỐNG.
- **F-178-T4-4 — T0-ROUND178 GIỮ VITE.LOCK + BLOCKERS TRONG
  LÚC POLLER CHỜ GATE (tái diễn dạng F-177-T4-2).** Poll
  #24–#26 instance 2: lock=co (thread=t0-round178,
  pid 136581, port 5560) + blockers 5 → 1; load1 7,07–9,21.
  Vì chưa có attempt nào nên không ảnh hưởng verdict; giao
  T0/T10 đối chiếu lịch các luồng trong cửa sổ 11:56–11:58Z.
- **F-177-T4-1 — KHÔNG TÁI DIỄN.** Stats "gan-mo" đếm 1 =
  mở cửa thật 1 (poll #5 instance 3) — lần này stats và cửa
  thật khớp nhau.
- **F-177-T4-2 — TÁI DIỄN DƯỚI DẠNG F-178-T4-4.**
- **F-177-T4-3 — TÁI DIỄN DƯỚI DẠNG F-178-T4-3** (X193 đã
  dọn tay lúc đóng).
- **F-177-T4-4 — ĐÃ HẾT.** T9-178 ĐÃ CÓ `b2-spikes.log` lúc
  T4 đóng (35 spike, mtime 13:10:33Z) — đối chiếu B2 độc lập
  từ phía T9 CÓ (xem §3).
- **F-177-T4-6 — KHÔNG TÁI DIỄN.** Grep stale-string sau
  copy-forward sạch ngay lần đầu (0 sót — kể cả
  `poll-test-177.log`).
- **F-176-T4-1 — KHÔNG TÁI DIỄN.** 0 vi phạm quy tắc đứng đợt
  này (xem §0) — chuỗi 0 vi phạm giữ 3 đợt liên tiếp
  (176, 177, 178).
- **F-176-T4-2 — ĐÃ SỬA + KIỂM CHỨNG LIVE LẦN 2 (xem §0b).**
- **F-176-T4-3 — TÁI DIỄN DƯỚI DẠNG F-178-T4-3.**
- **F-175-T4-1 — KHÔNG TÁI DIỄN.** `tree-md5.txt` không còn
  trong danh sách cleanup copy-forward; test poll lần 1
  tree=YES ngay.
- **F-175-T4-2 — KHÔNG TÁI DIỄN (xem F-178-T4-1 + §0).**
- **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG F-178-T4-4.**
- **F-175-T4-4 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (xem F-177-T4-1).**
- **F-175-T4-5 — TÁI DIỄN THEO DẠNG MỚI (reboot #93 giết
  poller — T4 đã khởi động lại tay 13:09:15Z, xem §1).**
- **F-175-T4-6 — TÁI DIỄN DƯỚI DẠNG F-178-T4-3** (X193 đã
  dọn tay lúc đóng).
- **F-174-T4-1 — KHÔNG TÁI DIỄN.** Attempt1 chạy sạch 20/20
  ngay lần đầu (không wedged như attempt1 đợt 176).
- **F-174-T4-3 — KHÔNG TÁI DIỄN.** Kiểm process lúc đóng dùng
  `ps` trực tiếp (0 process T4, 0 Xvfb) — không dùng `pgrep -f`.
- **F-174-T4-4 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (xem F-178-T4-1).**
- **F-174-T4-5 — KHÔNG TÁI DIỄN.** `p1p3p7` chạy tay đúng dạng
  `<json> "<seqs>"` ngay lần đầu, exit 0.
- **F-174-T4-6 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (RAM <500:
  67/125 poll — nhưng TOÀN trên #92, trong lúc CHỜ gate;
  RAM min trong attempt1 1056 MB, 0 mẫu <500).**

## 7. P3' cộng dồn (MỚI — 41 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 178 (MỚI): P1 177/181, P2 172/172,
  P3-A1 150/181, P3' 141/153 occurrence = 117/121 distinct-seq,
  P7 75/75** (41 lượt hợp lệ — #47 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 177 §6: "40 lượt hợp lệ" — nay 41).
- **Đóng góp lượt #47 (attempt1-97054ac6, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=6 occurrence / 6 distinct-seq [191, 217, 324, 352, 431,
  513], trong đó 4 seq MỚI [217, 324, 352, 513], 6 seq DAT
  (191 + 431 đã thấy và ĐÃ DAT từ trước — nay DAT lại).
  - **P1 — ĐÚNG 6/6 occ** (6 seq gần run-end ±1 tick;
    trong 14 run_end seqs; baseline 42/402,
    p=1,30059e-06 — verdict ĐÚNG theo luật DEF §3 vì 6/6 ≥2/3
    và p<0,01). Cộng dồn 171/175 → **177/181**.
  - **P2 ĐÚNG — 6/6 occ** (6× lag +1f; 0 lag âm; DEF §4 chỉ
    đòi lag ≥ +1f). Cộng dồn 166/166 → **172/172**.
  - **P3-A1 — ĐÚNG 5/6 occ** (5/6 seq đóng băng-tại-tick;
    191 KHÔNG đóng băng-tại-tick theo định nghĩa nghiêm
    ngặt; baseline 99/401, p=0,0043709 — verdict ĐÚNG theo
    luật DEF §5 vì 5/6 ≥2/3 VÀ p<0,01). Cộng dồn 145/175 →
    **150/181**.
  - **P3' 6/6 occ ĐẠT** (stall: 191=7, 217=7, 324=4, 352=7,
    431=3, 513=7). Cộng dồn 113/117 →
    **117/121 distinct** (4 seq DAT MỚI — 217, 324, 352,
    513); occurrence 135/147 → **141/153**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 35,
    0: 42}; đối chứng toàn bộ drawSrc post: {-1: 319, 0: 168},
    0/487 entry). Cộng dồn 74/74 → **75/75**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162).**
  Helper `distinct-seq-178.py` đọc sổ (as-of 177: 113/117
  distinct, occ 135/147), tính seq MỚI = tập hiệu với sổ,
  in cộng dồn mới, ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-178-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Live đợt 178:** sổ + stall/c2coverage attempt1-97054ac6 →
  **117/121 distinct, 141/153 occ** — khớp tính tay dưới đây.
  Sổ ĐÃ THĂNG CẤP: as-of 178, 117/121 distinct, occ 141/153,
  valid_rounds_p3 29, non_dat [260, 283, 364, 498] (không đổi;
  md5 sổ mới `761fd9dd…`). Helper KHÔNG cần back-test riêng
  đợt này (đã back-test khớp live 172 ở đợt 173, live
  174–178 đều khớp tính tay).
- **Kiểm chứng seq 191/217/324/352/431/513 đợt 178:**
  helper xác nhận **217 + 324 + 352 + 513 MỚI**;
  **191 + 431 ĐÃ THẤY VÀ ĐÃ DAT**. Tính tay: distinct DAT
  113 + 4 = **117**; distinct tổng 117 + 4 = **121**;
  occurrence DAT 135 + 6 = **141**, tổng 147 + 6 = **153**.
  Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — có thêm 6 mẫu (c2) mới đợt này:**
  P1 ĐÚNG 6/6 (p=1,3e-06) + P2 ĐÚNG 6/6 + P3-A1 ĐÚNG 5/6
  (p=4,4e-03) + P3' 6/6 + P7 ĐÚNG — **lượt ĐÚNG cả 5 trụ thứ
  tư liên tiếp** (sau đợt 175, 176, 177) — nhưng KHÔNG phải
  6/6 toàn diện như đợt 177 (P3-A1 thiếu 191).
- Chuỗi median tickCost 41 lượt (mới — ĐÃ SỬA, xem F-178-T4-2):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 /
  39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 /
  58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 /
  44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 /
  53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 / 50,0 /
  **45,0 ms** (tổng 1962,0; trung bình 47,9 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 179

- **(a) #47 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 40 → 41.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT**
  (attempt1 hợp lệ trên boot 97054ac6 — NHƯNG gate0 đợt này
  là T4-check-only, KHÔNG có cờ T5 cho #93; T8/T10 quyết
  check-only có đứng cho gate (a) không — tiền lệ: O8 T8
  trên #91 đợt 177 cũng qua fallback T8-check-only).
- **(b) P3' cộng dồn MỚI 41 lượt: P1 177/181, P2 172/172,
  P3-A1 150/181, P3' 141/153 = 117/121, P7 75/75:**
  helper đã dùng live khớp tính tay; sổ distinct-seq ĐÃ THĂNG
  CẤP as-of-178. **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới.
- **(c) BOOT 985bc2a3 (ứng viên #92) + BOOT 97054ac6 (ứng viên
  #93) — CHƯA xác minh số hiệu; giao T0-178 xác minh 9 nguồn
  cả hai + (m) #92/#93 (T2-178 + parent 178); INSIDE #91
  (T2-178) + INSIDE #92/#93 (T2-178).** Dữ kiện T4: btime
  #92 11:01:27Z, gap #91→#92 = 6.827 s; btime #93 13:07:35Z,
  gap #92→#93 = 7.568 s; reboot #93 giết poller giữa poll
  #118 (13:07:43Z, đồng hồ cũ) và lần kiểm 13:08:17Z —
  lệch 8 s so với btime, chưa giải thích được (xem §1).
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-177-T4-6) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale-string sạch ngay lần đầu
  (F-177-T4-6 không tái diễn).
- **(e) POSTBOOT_PASS #92 ĐÃ CÓ (11:53:41Z, boot+52m14s,
  mode replay-đầy-đủ, poll=0, dpkg 1545): GHI NHẬN — cờ
  REPLAY-ĐẦY-ĐỦ, không caveat. POSTBOOT_PASS #93 CHƯA CÓ —
  T5-178 lo resume sau reboot #93.** **T4-check-only LÀ
  gate0 chính của attempt1 hợp lệ đợt này.** Hướng (3)
  VẪN ĐỨNG hay không — thuộc T5-178.
- **(f) RAM <500 MB: 67/125 poll (toàn trên #92; chuỗi dài
  nhất 35 poll liên tiếp #41–#75) — LẦN ĐẦU TIÊN chuỗi
  RAM<500 dài đến thế (đợt 177: 1/22, chuỗi dài nhất 1).**
  Nhưng RAM trong attempt1 min 1056 MB (100 mẫu, 0 mẫu <500)
  — attempt hợp lệ chạy trên RAM tốt hơn cửa sổ chờ.
  Giao T9-178 đối chiếu balloon/E-199 trên #92/#93.
- **(g) (m) #92/#93 (T2-178 + parent 178); (m) #56 lần 21
  (T2-178); mù #96?/#95?/#94?/#88? (hole-recheck lần 22)/#77?
  (T2-178; U cách sàn 29 s); (1c') (f') V1 — đợt này 0 kích
  hoạt mới (chờ T8-178); 84l10 + Q3 heartbeat (T8-178);
  E-199 kết cục (T9-178); #92/#93 có giết holder không
  (T6-178); prune lần 53 (T6-178); checklist (o) (T8-178);
  H3 chỉ giám sát thụ động; birefnet 0 thử lần 32;
  nhắc mọi luồng: KHÔNG chạy script nặng / KHÔNG probe dpkg
  trong cửa sổ attempt (đợt này 0 vi phạm — chuỗi 0 vi phạm
  giữ 3 đợt liên tiếp); u2net là fallback chính thức;
  ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại;
  G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT (attempt1,
  dpkg delta 0).** dpkg ổn định 1545 sau replay hệ thống
  trên #93 (xong trước khi T4 mở cửa lúc 13:12:15Z);
  replay không chạy trong cửa sổ.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (poll #5 instance 3) → **CÓ lượt yên hợp lệ #47 cho chuỗi
  FULL PASS** (attempt1, boot 97054ac6, gate0=T4-check-only).
  T8 tự quyết O8 đợt này (cùng boot đo).
- **(j) F-178-T4-2 (chuỗi median LIMITS 177 §7 thiếu 46,0) —
  ghi nhận, KHÔNG đổi verdict đợt 177; F-178-T4-1 (tick
  probe-mo-93c của T9 trong cửa sổ attempt — nhẹ, không vi
  phạm; T9 sửa timestamp "13:13Z" trong baseline-notes).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-178.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-178.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-23T11:39:11Z - 2026-11-23T11:39:13Z, boot=985bc2a3
   RAM min=3727 max=3742 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 0/2 blockers>0: 0 apt>0: 2
   gate0: khong-dat=2
   lock: khong=2
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 118 poll, 2026-11-23T11:39:24Z - 2026-11-23T13:07:43Z, boot=985bc2a3
   RAM min=405 max=4185 >=1024: 27/118 500-1023: 24/118 <500: 67/118
   load1<2: 86/118 load5<2: 77/118 blockers>0: 5 apt>0: 19
   gate0: T5=99, khong-dat=19
   lock: co=5, khong=113
   dpkg 2->1545
   chuoi RAM<500 dai nhat: 35 poll
-- instance 3: 5 poll, 2026-11-23T13:09:15Z - 2026-11-23T13:12:15Z, boot=97054ac6
   RAM min=1479 max=1812 >=1024: 5/5 500-1023: 0/5 <500: 0/5
   load1<2: 1/5 load5<2: 5/5 blockers>0: 0 apt>0: 2
   gate0: T4-check-only=1, khong-dat=4
   lock: khong=5
   dpkg 461->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 125
-- RAM toan phien: min=405 max=4185 >=1024: 34/125 <500: 67/125
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 1/125
   gan-mo? #5 2026-11-23T13:12:15Z boot=97054ac6 RAM=1567 L1=1.61 L5=1.53 blk=0 apt=0 gate0=T4-check-only(pb_age=0) lock=khong t5=cu(mtime-cu)
-- boot 97054ac6: 5 poll; RAM>=1024 lan cuoi: 2026-11-23T13:12:15Z #5; RAM<1024 lan dau: KHONG CO
-- boot 985bc2a3: 118 poll; RAM>=1024 lan cuoi: 2026-11-23T12:03:38Z #33; RAM<1024 lan dau: 2026-11-23T11:54:31Z #21 RAM=947
-- cong don P3' (MOI, 41 luot hop le): P1 177/181 P2 172/172 P3-A1 150/181 P3' 141/153 occ = 117/121 distinct-seq P7 75/75
-- chuoi median 41 luot: n=41 mean=47,9 min=39,0 max=60,0 vuot-60: 0
```
