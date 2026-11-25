# PHASE9_ROUND176_T4_WEBKIT_QUIET45_LIMITS.md

**Đợt:** 176. **Luồng:** T4 — đo lượt yên WebKit #45 trên 1 boot
+ **#45 CÓ LƯỢT HỢP LỆ — attempt2-15618ce8 (20/20 + lớp B 5/5 +
  tickCost median 46,0 ms ≤60). CHUỖI LƯỢT YÊN HỢP LỆ 38 → 39.**
  Attempt1 wedged ở pass 15 (rAF/renderer kẹt, exit 3, partial
  14/20); attempt2 chạy sạch ngay sau đó trên cùng boot.
+ **CỘNG DỒN MỚI (39 lượt hợp lệ): P1 163/166, P2 157/157,
  P3-A1 138/166, P3' 126/138 occurrence = 106/111 distinct-seq,
  P7 73/73.** Sổ distinct-seq ĐÃ THĂNG CẤP as-of-176
  (md5 `a642b111…`; valid_rounds_p3 27;
  non_dat [242, 260, 283, 364, 498] — không đổi).
+ **BOOT 15618ce8 — GATE0 = T5 SUỐT PHIÊN.** POSTBOOT_PASS của
  T5-176 viết 05:42:19Z (replay-đầy-đủ, poll=0, dpkg 1545) —
  cờ đầy đủ thứ hai liên tiếp sau #86; gate0=T5 ở 23/23 poll.
+ **RAM <500 MB: 0/23 poll** — lần đầu tiên kể từ đợt 172
  không có poll nào <500 (đợt 173: 41/144; 174: 3/38; 175: 11/50).
  RAM ≥1024 ở 23/23 poll (min 1054, max 2941 MB).
**Ngày:** 23/11/2026 (lượt cron 12:35 +07 23/11 = 05:35:51Z).
**Boot đo:** MỘT boot — 15618ce8 (btime 05:26:26Z, ứng viên #89 —
số hiệu chờ T0-176 xác nhận). **0 reboot trong phiên T4.**

## 0. Verdict tổng

- **#45 CÓ LƯỢT HỢP LỆ (attempt2-15618ce8).**
  Cửa mở lần 1 ở poll #20 (05:57:48Z): gate0=T5 + RAM 1054 MB +
  load1 0,68/load5 1,98 + lock khong + blockers 0 + apt 0 →
  attempt1 chạy 05:57:48–06:02:31Z, **wedged ở pass 15**
  (exit 3, partial 14/20). Cửa mở lại ngay ở poll #21
  (06:02:57Z, RAM 2100 MB, load1 0,78/load5 1,10) → attempt2
  chạy 06:02:57–06:06:26Z: **20/20 pass, lớp B DAT 5/5,
  tickCost median 46,0 ms ≤60** → LUOT HOP LE, poller thoát 0
  lúc 06:07:01Z. Ngân sách dùng **2/3**.
- **Một boot, không reboot:** toàn bộ 23 poll thật + 2 attempt
  trên boot 15618ce8; boot không đổi lúc attempt1, attempt2,
  poller thoát và lúc đóng (06:09Z). Khác đợt 175 (2 boot,
  1 reboot giết poller).
- **Chuỗi lượt yên hợp lệ: 38 → 39.** Median tickCost attempt2 =
  46,0 ms (chuỗi 39 lượt: mean 47,9, min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60).
- **Điều kiện GIỮ NGUYÊN như #44 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NÀO TRONG LÚC
  PROBE PASS CHẠY: 0 VI PHẠM.** Ps-before/after cả hai attempt:
  0 dòng m56 (grep -c = 0 cả 4 file); không có script phân tích
  nặng nào của luồng khác trong cửa sổ attempt (chỉ có watcher/
  sampler nhẹ thường trực của T5/T9 + waiter T8 + watcher cờ của
  parent — đều sleep/poll nhẹ). Mọi phân tích của chính T4
  (p1p3p7 tay, distinct-seq live, stats-176.py, đọc log T9)
  đều làm SAU khi poller thoát (từ ~06:07Z). Pre-flight
  postboot check-only (05:42Z) + 2 test poll (05:43:05Z,
  05:43:10Z) chạy TRƯỚC khi mở poller / ngoài cửa sổ attempt.
  T4 không chạy probe chạm dpkg nào trong cả phiên (chỉ đọc
  `wc -l` dpkg.log + `pgrep -x`).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt1, lúc attempt2, lúc đóng — không đổi;
  mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round176-t4.done` viết ~06:1xZ 23/11
  (trong hạn cờ ~08:00Z), CÓ NỘI DUNG; boot kiểm lần cuối
  trước khi viết cờ là 15618ce8.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-175-T4-1/2)

Chạy **trước mọi attempt, trước khi mở poller** (05:41–05:43Z),
ghi vào `hidden_files/round176-t4/preflight-176.txt` — **PASS**
(không sót nào bị bắt; khác đợt 175: test poll không bắt được
lỗi setup nào). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–175:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq gốc as-of-175 md5
  `42927624…` (occ 119/131, distinct 102/107, valid_rounds_p3 26).
- **10/10 analyzer** có mặt; `bash -n` OK 4 script T4;
  `py_compile` OK 13 file py; Playwright-core có mặt;
  media `stripes-nonperiodic.mp4` (140.828 B) có mặt;
  không có `vite.lock`, không có `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-23
  07:30:00 UTC` → **1795419000** = 07:30Z (hạn cờ ~08:00Z =
  1795420800, hạn cứng 08:30Z = 1795422600); grep 0 hit cho
  `01:30`/`22:30`/`23:00Z`/`23:30Z`/`02:00Z`/`02:30Z`/`04:30`/
  `05:00`/`05:30`/`round173`/`round174`/`WebKit #44`/`T4-175a`/
  `default=175`/`run-attempt-175`/`poll-wait-t4-175` trong
  script mới; `round175` chỉ còn fallback `round175-t5/` +
  glob `round175-*` (có chủ đích).
- **Copy-forward 175 → 176:** deadline `04:30Z` → `07:30Z`;
  hạn cờ/cứng `05:00Z`/`05:30Z` → `08:00Z`/`08:30Z`; T5FLAG
  chính `round176-t5/` + fallback `round175-t5/`; W trong 4
  script ĐÃ LÀ `round176-t4`; `T4-175a` → `T4-176a`;
  `default=175` → `default=176`; `WebKit #44` → `#45`;
  glob chống nhiễu `round174-*` → `round175-*`; 1 sót grep
  bắt được trước khi mở poller (`postboot-t4-175-gate0wait`
  trong poll-wait) — đã sửa thành 176.
- **`cp -a` báo EPERM nhưng cleanup chạy vô điều kiện
  (F-170-T4-1):** thư mục sạch 19 file trước khi đổi tên script;
  **`tree-md5.txt` KHÔNG có trong danh sách cleanup đợt này
  (F-175-T4-1 đã sửa) — còn nguyên, nội dung 530e10a7.**
- **Freeze check (F-164-T4-1):** `round175-t4` còn **0 file
  mtime ≥ 05:35:51Z** (giờ mở đợt 176).
- **GATE0 LÚC MỞ: REPLAY ĐÃ XONG TRÊN BOOT #89 (ứng viên).**
  dpkg.log 1545 dòng, hoạt động apt cuối 05:37:44Z
  (gstreamer1.0-tools, boot+11m18s); apt-get/dpkg không chạy
  (pgrep 0); postboot check-only chạy tay **exit 0 PASS**
  (libs đủ, GST 269=269, apt đủ 11 gói — xem
  `preflight-postboot-176.log`). **T5-176 viết POSTBOOT_PASS
  cho boot này 05:42:19Z trong lúc pre-flight** (xem §4) —
  gate0 lúc mở poller là **T5 (CHÍNH)**, không cần dự phòng
  T4-check-only. Lưu ý: dòng header đầu của
  preflight-postboot-176.log là text mẫu cũ của script
  (đợt 151) — chỉ các dòng PASS/KẾT LUẬN mới là kết quả thật.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (05:43:05Z): RAM 1134 MB, load1 2,70/load5 1,81,
  gate0=T5, lock=khong, blockers=0. Lần 2 (05:43:10Z):
  RAM 1252 MB, load1 2,49/load5 1,78, gate0=T5, lock=khong,
  blockers=0. Chỉ load1 vượt 2 nên cửa chưa mở — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`).
- **RAM lúc mở SÁT NGƯỠNG:** avail 1023 MB (05:41Z) →
  1074 MB (05:42Z) → 1134/1252 MB (2 test poll); load1
  2,49–3,29 / load5 1,78–1,85 lúc mở — cửa chỉ mở khi load
  rơi đủ (poll #20).

## 1. Poller — 23 poll thật, 2 lần cửa mở, trên 1 boot (0 reboot)

- **Instance 1 — TEST (POLL_TEST=1), 2 poll, boot 15618ce8
  (05:43:05Z, 05:43:10Z):** cả 2 đều RAM ≥1024 (1134/1252 MB),
  load1 2,70/2,49, load5 1,81/1,78, gate0=T5, lock=khong,
  blockers=0 → cửa đóng (chỉ thiếu load1<2) →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần).
  2 poll này nằm trong `poll-test-176.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot 15618ce8, 21 poll (05:43:26–06:02:57Z),
  2 lần cửa mở:** RAM ≥1024: 21/21 (min 1054, max 2941 MB);
  500–1023: 0; **<500: 0**; load1<2: 9/21; load5<2: 3/21;
  gate0: **T5 21/21**; lock=khong 17, co 4 (vite.lock của
  T0-round176, port 5560); blockers>0: 4 poll; apt>0: 0;
  dpkg 1545 đứng yên (replay đã xong).
- **Giai đoạn 1 — T0 chặn cửa (poll #1–#7, 05:43:26–
  05:47:59Z):** load1 vọt 6,97–10,16 (T0 click-test/render +
  luồng khác — 7 spike B2, xem §3); lock=co ở poll #2–#4
  (T0-round176 giữ vite.lock port 5560); load5 3,00–4,49.
  Cửa KHÔNG MỞ ĐƯỢC vì thiếu load<2 + lock + blockers.
- **Giai đoạn 2 — load hạ dần (poll #8–#12, 05:48:45–
  05:51:46Z):** load1 rơi 2,26 → 1,17 (lock đã nhả từ #8),
  RAM 1699–2506 MB, NHƯNG load5 vẫn 2,91–3,98 (trung bình
  5 phút còn dư đợt tải trước). Cửa KHÔNG MỞ ĐƯỢC vì thiếu
  load5<2.
- **Giai đoạn 3 — đợt tải thứ hai (poll #13–#15, 05:52:31–
  05:54:02Z):** load1 lại vọt 5,36/4,42/2,32 (3 spike B2,
  xem §3 — luồng khác chạy việc nặng, không rõ là luồng nào;
  lock vẫn khong, blockers 0). load5 2,94–3,76. Cửa KHÔNG MỞ.
- **Giai đoạn 4 — cửa mở lần 1 (poll #16–#20, 05:54:47–
  05:57:48Z):** load1 1,54 → 0,68, load5 2,94 → 1,98;
  poll #20 (05:57:48Z) load1 0,68/load5 1,98, RAM 1054 MB,
  apt=0 → **CỬA MỞ, attempt1 chạy ngay**. RAM ở poll #20
  là min toàn phiên (1054 MB — sát ngưỡng).
- **Giai đoạn 5 — cửa mở lại cho retry (poll #21, 06:02:57Z):**
  sau khi attempt1 exit 3, poller poll lại gate theo quyết
  (h) đợt 149: load1 0,78/load5 1,10, RAM 2100 MB, gate0=T5
  → **CỬA MỞ, attempt2 chạy ngay**. Poller thoát 0 sau
  attempt2 hợp lệ (06:07:01Z), trước hạn cắt 07:30Z tới 83 phút.
- **Phân rã 23 poll thật:** RAM≥1024: 23/23; RAM 500–1023:
  0/23; RAM<500: **0/23**. load1<2: 9/23; load5<2: 5/23.
  **Stats "gan-mo" đếm 2 = mở cửa thật 2 (KHÔNG lệch)** —
  F-175-T4-4 KHÔNG tái diễn (đợt này mọi poll đủ load+RAM
  đều đủ cả gate0/apt/lock/blockers). gate0: T5 23/23.
  blockers>0: 4 poll (toàn instance 2, lúc T0 giữ lock).
  apt>0: 0. **RAM <500 MB: 0/23 poll** — lần đầu tiên kể từ
  đợt 172 không có poll nào <500; RAM min toàn phiên 1054 MB.
  Ghi nhận để T9-176 đối chiếu headroom/balloon trên boot
  15618ce8 (balloon có vẻ đã hết trong cửa sổ poller — nhưng
  RAM trong attempt1 vẫn sụt tới 552 MB, xem §2).

## 2. Attempt — 2 attempt (1 wedged + 1 hợp lệ), ngân sách dùng 2/3

- **Attempt1 — attempt1-15618ce8, 05:57:48–06:02:31Z,
  WEDGED, exit 3 (partial 14/20 — KHÔNG hợp lệ).**
  - Vite lock v2: lấy ticket ngay (chờ 0s). Xvfb :193 lên
    05:57:5xZ. WebKit 27.2, app boot OK. Pass 1–14 xong
    (30 khung rAF/pass); **pass 15 kẹt: "pass-timeout: pass 15
    không tiến trong 120000ms wall-clock (kẹt rAF/renderer)"
    lúc 06:00:54Z** (HB129 elapsed=115s lúc 06:00:49Z).
  - Sau đó cả 3 lần fetch writePartial đều TIMEOUT 30 s
    (tickCost, blendTick, c2DrawLog — xem run log 06:01:04–
    06:02:24Z): "CA 3 FETCH DEU TIMEOUT (pass-timeout) — trang
    wedged, vong pass se tu thoat sau khi ghi partial JSON".
  - Partial JSON 14/20 ghi 06:02:24Z (2.263.190 B; tickCost
    timeout n=418, blendTick n=338, c2DrawLog n=811);
    probe exit 3; run-attempt exit 3 lúc 06:02:31Z.
  - Lớp B attempt1: **DAT 5/5** (ghi nhận — attempt đã fail
    nên không dùng làm bằng chứng hợp lệ); sampler n=137
    (136 mẫu thật + 1 dòng header — xem F-176-T4-2),
    load1 max 1,63, RAM min **552 MB** max 1003 MB,
    136/136 mẫu <1024 MB, 0 mẫu <500 MB. **RAM sụt sâu trong
    lúc attempt1 chạy** (từ 1054 MB lúc mở cửa xuống 552 MB)
    — cùng mẫu balloon các đợt trước, nhưng lần này xảy ra
    TRONG attempt chứ không phải trong lúc chờ gate; có thể
    liên quan tới việc renderer wedged (không kết luận nhân quả).
  - Coverage attempt1: 3/3 (seq 171/217/235) — attempt vẫn fail.
- **Attempt2 — attempt2-15618ce8, 06:02:57–06:06:26Z,
  LUOT HOP LE (20/20 + lớp B 5/5 + tickCost median 46,0 ms).**
  - Vite lock v2: lấy ticket ngay (chờ 0s), giữ ~205s. Xvfb :193
    lên 06:03:02Z. WebKit 27.2, app boot OK. Pass 20 xong
    06:04:24Z (35 khung rAF, 35 đo được, wall 3156 ms);
    partial JSON 20/20 ghi 06:04:25Z (tickCost n=612,
    blendTick n=492, c2DrawLog n=1188).
  - Probe exit 0; JSON 3.400.298 B; flip afterPass=5,
    wallMs=26697; tickCost total n=613 median=**46,0** p90=73,0
    max=102 min=27; hậu flip+2000ms n=447 median=48,0.
    BlendTick/pass=24,6; rAF/pass median=36 (min 31, max 43).
    pageErrs=[].
  - Lớp B attempt2: **DAT 5/5** (sampler n=101 — 100 mẫu thật +
    1 dòng header, xem F-176-T4-2; load1 max 1,97,
    RAM min 1358 MB max 2228 MB, 0 mẫu <500 MB, **0/100 mẫu
    <1024 MB**; load5 cuối 1,56; boot không đổi; dpkg delta 0;
    apt/dpkg = 0). Ps-before/after: **0 dòng m56, 0 process
    nặng của luồng khác** (xem §6, F-176-T4-1 — KHÔNG vi phạm).
  - Per-pass (20 pass): tick median 35,0–57,5 ms; wall
    2886–3503 ms; load1 mean 1,14–1,94; RAM mean 1367–1853 MB.
    Tương quan Pearson: median~load1_mean r=0,42;
    median~RAM_mean r=-0,04 (chỉ mô tả, không kết luận nhân quả).
- **Ngân sách dùng 2/3.** Không attempt nào bị reboot giết
  (0 reboot trong phiên); 1 attempt còn lại chưa dùng.

## 3. B2 spike / đối chiếu sampler T9 (theo nhiệm vụ đợt 176)

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT HỢP LỆ (attempt2,
  06:02:57–06:06:46Z): 0 SPIKE.** T9 `b2-spikes.log` ghi 12
  spike tới lúc T4 đóng, phân rã: 10 spike trong cửa sổ poller
  (05:43:26–06:07:01Z) — 7 spike giai đoạn 1 (05:44:01–05:47:35Z,
  load1 tới **10,44** lúc 05:46:23Z — T0 click-test/render) +
  3 spike giai đoạn 3 (05:52:10–05:53:22Z, load1 4,14–6,33 —
  đợt tải thứ hai, luồng gây tải không xác định); **0 spike
  trong cửa sổ attempt1** (05:57:48–06:02:57Z) **và 0 spike
  trong cửa sổ attempt2** (06:02:57–06:06:46Z); 2 spike còn lại
  ngoài cửa sổ T4 (trước 05:43:26Z). **Attempt2 chạy trong
  cửa sổ hoàn toàn sạch B2** (load1 max 1,97 = đúng load1 max
  lớp B, ≤4 nên lớp B DAT).
- **Attempt1 wedged KHÔNG kèm spike B2 nào** trong cửa sổ của
  nó (load1 max 1,63) — kẹt rAF/renderer ở pass 15 không do
  tải hệ thống đo được; giao T8-176 đối chiếu họ kẹt H3
  (chữ ký giống kẹt 86n2-P1 đợt 175 ở chỗ renderer kẹt nhưng
  khác ở chỗ đây là pass-timeout trong probe đo yên, không
  phải waitForPlaySync).
- **Đối chiếu sampler T9 (độc lập):** RAM min poller 1054 MB;
  RAM min attempt1 552 MB (sampler T4) — T9 đối chiếu trũng
  RAM trong cửa sổ attempt1. Phân tích balloon/headroom thuộc
  T9-176.

## 4. Replay/postboot — POSTBOOT_PASS #89 (ứng viên) ĐÃ CÓ (replay-đầy-đủ); 0 reboot trong phiên

- **Boot 15618ce8 (btime 05:26:26Z, ứng viên #89 — CHƯA xác
  minh số hiệu; T0-176 xác minh 9 nguồn): replay host-side
  CHẠY ĐẦY ĐỦ TRƯỚC KHI T4 MỞ.** dpkg.log 1545 dòng từ lúc
  T4 mở (05:41Z), hoạt động apt cuối 05:37:44Z
  (gstreamer1.0-tools, boot+11m18s); postboot check-only của
  T4 exit 0 ngay lúc mở.
- **POSTBOOT_PASS ĐÃ CÓ 05:42:19Z** (boot+15m53s; watcher-176,
  **mode replay-day-du, poll=0**, dpkg 1545 dòng, cache 183
  .deb, lists 37; postboot PASS poll0 độc lập exit 0 lúc
  05:42:19Z; cờ cũ 70b7f7ee lưu POSTBOOT_PASS-70b7f7ee).
  **Cờ replay-đầy-đủ thứ hai liên tiếp** (sau #86 đợt 175) —
  F-174-T5-6 (replay một phần) KHÔNG lặp lại lần thứ hai liên
  tiếp. Gate0=T5 từ poll đầu tiên của cả 2 test poll + 21 poll
  thật. **KHÁC đợt 175:** lần này lượt yên hợp lệ chạy TRÊN
  CÙNG BOOT với cờ T5 (không cần T4-check-only) — chân gate
  (a) cho chuỗi FULL PASS ĐẠT nếu O8 PASS trên cùng boot.
- **KHÔNG có reboot nào trong phiên đo hay lúc đóng:**
  boot 15618ce8 lúc attempt1 (05:57:48Z), attempt2 (06:02:57Z),
  poller thoát (06:07:01Z) và lúc kiểm cuối (06:09:24Z) —
  btime 05:26:26Z không đổi; 0 dòng REBOOT PHAT HIEN trong
  poll log. **0 reboot — lần đầu tiên kể từ đợt 173 poller
  không bị reboot giết** (đợt 174: 0 reboot trong phiên T4
  nhưng có reboot #86 trước đó; đợt 175: 1 reboot giết poller).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-176 báo cáo. (T4 chỉ ghi:
  attempt1 wedged ở pass 15 — xem §2; attempt2 hợp lệ sạch.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND176_T4_WEBKIT_QUIET45_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round176-t4/`):**
  `poll-wait-t4-176.sh` (deadline 07:30Z 23/11 + cờ T5
  round176-t5/ + fallback round175-t5/),
  `run-attempt-176.sh` (lượt yên #45),
  `distinct-seq-176.py` (ĐÃ DÙNG LIVE trên dữ liệu attempt2 —
  xem §7; khi chạy từ `apps/web/scripts/` phải truyền `--ledger`
  trỏ tới sổ, nếu không helper lỗi FileNotFoundError).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–175, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round176-t4/` — theo đúng mẫu 149–175: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round176-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–175).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-176.sh`, `run-attempt-176.sh`,
  `t4-attempt-inner.sh` (W = round176-t4 + glob check nhiễu
  chéo round175-*), `check-classb-t4.sh` (W = round176-t4),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7),
  `stats-176.py` (thống kê §A — trích từ log gốc;
  footer ĐÃ CẬP NHẬT cộng dồn 39 lượt),
  `distinct-seq-176.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-176: 106/111 distinct, occ 126/138, valid_rounds_p3 27,
  non_dat [242, 260, 283, 364, 498] — không đổi;
  md5 `a642b111d0b032613535c9477212596e`),
  `distinct-seq-ledger-176-proposed.json` (bản helper ghi ra
  trong live run — ĐÃ DÙNG để thăng cấp sổ; audit trail),
  `preflight-176.txt` + `preflight-postboot-176.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-175-T4-1/2).
- **Log/evidence (hidden_files/round176-t4/, không stage):**
  `poll-t4.log` (21 poll instance 2 + 2 CUA YEN MO +
  0 REBOOT PHAT HIEN trong log),
  `poll-test-176.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `poll-t4.nohup.log` (log 1 lần chạy poller),
  `chain-t4.log` (start poller ×1 + 2 CUA YEN MO +
  attempt1 exit 3 + attempt2 LUOT HOP LE),
  `postboot-t4-176-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-176-output.txt` (output stats-176.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có blockers),
  `preview-b-f3-flip-webkit-t4-attempt1-15618ce8.json`
  (2.263.190 B, 14/20 partial, probe exit 3),
  `preview-b-f3-flip-webkit-t4-attempt2-15618ce8.json`
  (3.400.298 B, 20/20, probe exit 0),
  `classb-t4-attempt1-15618ce8.txt` (DAT 5/5 — attempt fail),
  `classb-t4-attempt2-15618ce8.txt` (DAT 5/5),
  `analyze-t4-attempt2-15618ce8-*.txt` (10 analyzer attempt2,
  gồm p1p3p7 chạy TAY — xem F-174-T4-5, không tái diễn;
  analyzer attempt1 cũng đã chạy đủ trong run-attempt),
  `coverage-check-attempt1-15618ce8.txt` (3/3),
  `coverage-check-attempt2-15618ce8.txt` (7/7),
  `load-mid-t4-attempt1-15618ce8.log` (n=136 mẫu thật),
  `load-mid-t4-attempt2-15618ce8.log` (n=100 mẫu thật),
  `run-webkit-t4-attempt1-15618ce8.log` (pass 15 timeout),
  `run-webkit-t4-attempt2-15618ce8.log` (20/20),
  `ps-before/after-t4-attempt1-15618ce8.txt` +
  `ps-before/after-t4-attempt2-15618ce8.txt` (0 dòng m56 cả 4 file),
  `dpkg-lines-before-attempt1-15618ce8.txt` (1545) +
  `dpkg-lines-before-attempt2-15618ce8.txt` (1545) +
  `apt-history-before-attempt*.txt`,
  `attempt-done-attempt1-15618ce8` (exit=3) +
  `attempt-done-attempt2-15618ce8` (exit=0).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  06:07:01Z exit 0; vite :5187 trống, curl 000;
  `/tmp/.X11-unix/` còn X194/X195 (của T1 suite — KHÔNG phải
  của T4, để lại; X193 của chính T4 đã dọn tay lúc đóng, xem
  F-176-T4-3).

## 6. Sai số F-176-T4-1..3 (+ nợ cũ)

- **F-176-T4-1 — KHÔNG VI PHẠM QUY TẮC ĐỨNG ĐỢT NÀY (ghi nhận
  tích cực — lần đầu tiên kể từ đợt 173 không có vi phạm).**
  Ps-before/after cả hai attempt: grep `m56` = 0 dòng cả 4
  file (lần duy nhất chuỗi "m56" xuất hiện trong ps là dòng
  lệnh shell của chính T4 lúc mở poller — chứa text preflight,
  không phải process m56). Không có script phân tích nặng nào
  của luồng khác trong cửa sổ attempt: ps-before attempt2 chỉ
  có watcher cờ của parent (sleep 600s), replay-watch T5,
  sampler/b2-watcher/probe-loop T9 (daemon nhẹ thường trực),
  waiter T8 + 1 shell kiểm cờ (sleep 115s) — đều nhẹ, không
  chạm dpkg, không chạy trong lúc pass chạy. Chuỗi vi phạm
  F-174-T4-2 → F-175-T4-2 (2 đợt liên tiếp) **ĐỨT**.
- **F-176-T4-2 — CHECK-CLASSB ĐẾM n SAMPLER THỪA 1 (dòng header
  `sampler-start` bị tính là 1 mẫu — sót NHỎ MỚI).**
  `check-classb-t4.sh` đếm n = số dòng file load-mid (gồm dòng
  header `sampler-start ...`): attempt2 ghi n=101 trong khi
  chỉ có 100 dòng mẫu `boot=...`; attempt1 ghi n=137 trong khi
  chỉ có 136 dòng mẫu. Không ảnh hưởng verdict (B2/B5 tính
  load1 max / RAM min từ các dòng mẫu thật; header không có
  số liệu nên không làm lệch max/min). Ghi nhận để sửa
  check-classb ở đợt sau (đếm chỉ dòng `boot=`).
- **F-176-T4-3 — X193 SOCKET LÚC ĐÓNG LÀ CỦA CHÍNH T4 (đã dọn
  tay — giống F-175-T4-6).** Sau khi poller thoát,
  `/tmp/.X11-unix/` còn X193 (Xvfb :193 của attempt2, process
  đã chết nhưng socket còn). T4 đã `rm` X193 lúc đóng (06:09Z).
  X194/X195 còn lại là của T1 suite (F-175-T1-1) — KHÔNG phải
  của T4, để lại cho T8-176 dọn theo checklist (o).
- **F-175-T4-1 — KHÔNG TÁI DIỄN.** `tree-md5.txt` không còn
  trong danh sách cleanup copy-forward; test poll lần 1
  tree=YES ngay.
- **F-175-T4-2 — KHÔNG TÁI DIỄN (xem F-176-T4-1).**
- **F-175-T4-3 — TÁI DIỄN NHẸ (T0-ROUND176 GIỮ VITE.LOCK +
  CLICK-TEST/RENDER TRONG LÚC POLLER CHỜ GATE).** Poll #2–#4:
  lock=co (thread=t0-round176, pid 27202, port 5560) +
  blockers 1–5; load1 vọt tới 10,16 ở poll #3–#4 (7 spike B2).
  Vì chưa có attempt nào nên không ảnh hưởng verdict; giao
  T0/T10 đối chiếu lịch các luồng trong cửa sổ 05:44–05:48Z.
- **F-175-T4-4 — KHÔNG TÁI DIỄN.** Stats "gan-mo" đếm 2 =
  mở cửa thật 2 (khác đợt 175: 8 vs 1; đợt 174: 3 vs 2).
- **F-175-T4-5 — KHÔNG TÁI DIỄN.** Poller KHÔNG bị reboot giết
  (0 reboot trong phiên); không cần khởi động lại tay.
- **F-175-T4-6 — TÁI DIỄN DƯỚI DẠNG F-176-T4-3** (X193 đã
  dọn tay lúc đóng).
- **F-174-T4-1 — TÁI DIỄN DƯỚI DẠNG MỚI (attempt1 wedged ở
  pass 15, exit 3).** Khác đợt 174: lần này probe tự thoát
  sạch sau khi ghi partial JSON 14/20 (không cần can thiệp
  tay); retry attempt2 chạy sạch ngay trên cùng boot. Wedged
  không kèm spike B2, không kèm RAM <500 (RAM min 552 MB
  trong attempt1 — sụt nhưng không chạm 500).
- **F-174-T4-3 — KHÔNG TÁI DIỄN.** Kiểm process lúc đóng dùng
  `ps` trực tiếp (0 process T4, 0 Xvfb) — không dùng `pgrep -f`.
- **F-174-T4-4 — KHÔNG TÁI DIỄN (xem F-175-T4-4).**
- **F-174-T4-5 — KHÔNG TÁI DIỄN.** `p1p3p7` chạy tay đúng dạng
  `<json> "<seqs>"` ngay lần đầu, exit 0.
- **F-174-T4-6 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (RAM <500: 0/23
  poll — lần đầu tiên kể từ đợt 172).** Nhưng RAM trong
  attempt1 vẫn sụt tới 552 MB (136/136 mẫu <1024 MB) — balloon
  chưa hết hẳn, chỉ không chạm ngưỡng 500 trong cửa sổ poller.

## 7. P3' cộng dồn (MỚI — 39 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 176 (MỚI): P1 163/166, P2 157/157,
  P3-A1 138/166, P3' 126/138 occurrence = 106/111 distinct-seq,
  P7 73/73** (39 lượt hợp lệ — #45 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 175 §6: "38 lượt hợp lệ" — nay 39).
- **Đóng góp lượt #45 (attempt2-15618ce8, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=7 occurrence / 7 distinct-seq [183, 230, 284, 302, 351,
  424, 471], trong đó 4 seq MỚI [183, 302, 351, 471], cả 4 đều DAT.
  - **P1 — ĐÚNG 7/7 occ** (cả 7 gần run-end ±1 tick;
    trong 14 run_end seqs; baseline 42/358, p=3,05889e-07 —
    verdict ĐÚNG theo luật DEF §3 vì n=7 ≥3 và p<0,01).
    Cộng dồn 156/159 → **163/166**.
  - **P2 ĐÚNG — 7/7 occ** (lag +1f ×7; 0 lag âm). Cộng dồn
    150/150 → **157/157**.
  - **P3-A1 — ĐÚNG 7/7 occ** (7/7 seq đóng băng-tại-tick;
    baseline 80/357, p=2,83761e-05 — verdict ĐÚNG theo luật
    DEF §5 vì 7/7 ≥2/3 VÀ p<0,01). Cộng dồn 131/159 →
    **138/166**.
  - **P3' 7/7 occ ĐẠT** (stall: 183=6, 230=3, 284=4, 302=7,
    351=5, 424=3, 471=5). Cộng dồn 102/107 → **106/111 distinct**
    (4 seq DAT MỚI — 183, 302, 351, 471); occurrence 119/131 →
    **126/138**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 33,
    0: 44}; đối chứng toàn bộ drawSrc post: {-1: 291, 0: 154},
    0/445 entry). Cộng dồn 72/72 → **73/73**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-176.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 175: 102/107 distinct, occ 119/131), tính seq
  MỚI = tập hiệu với sổ, in cộng dồn mới, ghi sổ MỚI ra file
  riêng (`distinct-seq-ledger-176-proposed.json`) — KHÔNG sửa
  sổ gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Live đợt 176:** sổ + stall/c2coverage attempt2-15618ce8 →
  **106/111 distinct, 126/138 occ** — khớp tính tay dưới đây.
  Sổ ĐÃ THĂNG CẤP: as-of 176, 106/111 distinct, occ 126/138,
  valid_rounds_p3 27, non_dat_in_union [242, 260, 283, 364, 498]
  (không đổi; md5 sổ mới `a642b111d0b032613535c9477212596e`).
  Helper KHÔNG cần back-test riêng đợt này (đã back-test khớp
  live 172 ở đợt 173, live 174 + live 175 + live 176 đều khớp
  tính tay).
- **Kiểm chứng seq 183/230/284/302/351/424/471 đợt 176:**
  helper xác nhận **183 + 302 + 351 + 471 MỚI** (seen_c2 107 seq
  VÀ seen_dat 102 seq đều không chứa 4 seq này);
  **230 + 284 + 424 ĐÃ THẤY**. Tính tay: distinct DAT 102 + 4 =
  **106**; distinct tổng 107 + 4 = **111**; occurrence DAT
  119 + 7 = **126**, tổng 131 + 7 = **138**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — có thêm 7 mẫu (c2) mới đợt này:**
  P1 ĐÚNG 7/7 (p=3,1e-07) + P2 ĐÚNG 7/7 + P3-A1 ĐÚNG 7/7
  (p=2,8e-05) + P3' 7/7 + P7 ĐÚNG — lượt ĐÚNG TOÀN DIỆN thứ
  hai liên tiếp (sau đợt 175). Seq 260 (KHONG-DAT ×2 đợt 174)
  không xuất hiện đợt này.
- Chuỗi median tickCost 39 lượt (mới): 49,5 / 40,0 /
  52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 /
  58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 /
  39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 /
  42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 / 40,0 /
  43,0 / 46,0 / 44,5 / 41,0 / **46,0 ms** (trung bình 47,9 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 177

- **(a) #45 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 38 → 39.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT**
  (attempt2 hợp lệ trên boot 15618ce8, gate0=T5 replay-đầy-đủ
  trên CÙNG boot — nếu O8 PASS trên cùng boot thì chuỗi WebKit
  FULL PASS 25 → 26; T8 tự quyết O8).
- **(b) P3' cộng dồn MỚI 39 lượt: P1 163/166, P2 157/157,
  P3-A1 138/166, P3' 126/138 = 106/111, P7 73/73:**
  helper đã dùng live khớp tính tay; sổ distinct-seq ĐÃ THĂNG
  CẤP as-of-176. **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới.
- **(c) BOOT 15618ce8 (ứng viên #89, CHƯA xác minh số hiệu) —
  giao T0-176 xác minh 9 nguồn + (m) #89 (T2-176 + parent 176);
  (m) #88 thuộc T2-176 + parent 176 (ứng viên DƯƠNG +33,431 s,
  cách biên dưới 0,431 s).** Dữ kiện T4: btime 15618ce8
  05:26:26Z; 0 reboot trong phiên T4.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-175-T4-1/2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng, BỔ SUNG 1 MỤC:** sửa `check-classb-t4.sh` đếm sampler n
  chỉ trên dòng `boot=` (F-176-T4-2 — header `sampler-start`
  đang bị tính thừa 1). T4-177 áp dụng y hệt checklist này +
  grep số cộng dồn cứng trong stats-*.py (F-169-T4-3) + kiểm
  poller thoát bằng chain log, không dùng pgrep -f (F-169-T4-4)
  + kiểm boot + khởi động lại tay sau reboot (F-173-T4-1).
- **(e) POSTBOOT_PASS #89 (ứng viên) ĐÃ CÓ (05:42:19Z,
  boot+15m53s, mode replay-day-du, poll=0): GHI NHẬN.** Đây là
  cờ REPLAY ĐẦY ĐỦ thứ hai liên tiếp (sau #86) — và lần này
  lượt yên hợp lệ chạy TRÊN CÙNG BOOT với cờ (khác đợt 175:
  cờ #86 không được kiểm chứng bằng lượt yên trên cùng boot).
  **T4-check-only KHÔNG cần dùng đợt này** (gate0=T5 suốt).
- **(f) RAM <500 MB: 0/23 poll — LẦN ĐẦU TIÊN KỂ TỪ ĐỢT 172
  KHÔNG CÓ POLL NÀO <500.** Nhưng RAM trong attempt1 vẫn sụt
  tới 552 MB (136/136 mẫu <1024 MB) — balloon chưa hết hẳn;
  ghi nhận để T9-176 đối chiếu headroom/balloon (trong cửa sổ
  attempt2: RAM min 1358 MB — attempt hợp lệ chạy trên RAM tốt).
- **(g) (m) #88 (T2-176 + parent 176); INSIDE #88 (T2-176;
  FULL134; chuỗi dài 6 từ #82); (m) #89 (T2-176 + parent 176);
  mù #96?/#88? (hole-recheck lần 20)/#94?/#95?/#77? (T2-176;
  U cách sàn 29 s); (m) #56 lần 19 (T2-176); (1c') (f') V1 —
  đợt này 0 kích hoạt mới (chờ T8-176); 84l10 điều tra riêng +
  Q3 heartbeat (T8-176); E-188/E-189/E-190 kết cục (T9-176);
  #87/#88 có giết holder không (T6-176); prune lần 51 (T6-176);
  checklist (o) (T8-176); H3 chỉ giám sát thụ động; birefnet
  0 thử lần 30; nhắc mọi luồng: KHÔNG chạy script nặng /
  KHÔNG probe dpkg trong cửa sổ attempt (đợt này 0 vi phạm —
  chuỗi vi phạm 2 đợt liên tiếp ĐÃ ĐỨT, xem F-176-T4-1);
  u2net là fallback chính thức; ci-security.yml vẫn 403 chờ
  user; TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT (attempt2,
  dpkg delta 0).** dpkg ổn định 1545 sau replay boot mới
  (05:37:44Z, trước khi T4 mở); replay không chạy trong cửa sổ.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 2 lần đợt này
  (poll #20 + #21) → **CÓ lượt yên hợp lệ #45 cho chuỗi
  FULL PASS** (attempt2, boot 15618ce8, gate0=T5 replay-đầy-đủ).
  T8 tự quyết O8 đợt này (cùng boot đo).

## A. Phụ lục số liệu (script trích từ log gốc — stats-176.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-176.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-23T05:43:05Z - 2026-11-23T05:43:10Z, boot=15618ce8
   RAM min=1134 max=1252 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 2/2 blockers>0: 0 apt>0: 0
   gate0: T5=2
   lock: khong=2
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 21 poll, 2026-11-23T05:43:26Z - 2026-11-23T06:02:57Z, boot=15618ce8
   RAM min=1054 max=2941 >=1024: 21/21 500-1023: 0/21 <500: 0/21
   load1<2: 9/21 load5<2: 3/21 blockers>0: 4 apt>0: 0
   gate0: T5=21
   lock: co=4, khong=17
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 23
-- RAM toan phien: min=1054 max=2941 >=1024: 23/23 <500: 0/23
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 2/23
   gan-mo? #20 2026-11-23T05:57:48Z boot=15618ce8 RAM=1054 L1=0.68 L5=1.98 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round176-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #21 2026-11-23T06:02:57Z boot=15618ce8 RAM=2100 L1=0.78 L5=1.10 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round176-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 15618ce8: 23 poll; RAM>=1024 lan cuoi: 2026-11-23T06:02:57Z #21; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 39 luot hop le): P1 163/166 P2 157/157 P3-A1 138/166 P3' 126/138 occ = 106/111 distinct-seq P7 73/73
-- chuoi median 39 luot: n=39 mean=47,9 min=39,0 max=60,0 vuot-60: 0
```
