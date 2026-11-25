# PHASE9_ROUND175_T4_WEBKIT_QUIET44_LIMITS.md

**Đợt:** 175. **Luồng:** T4 — đo lượt yên WebKit #44 trên 2 boot
+ **#44 CÓ LƯỢT HỢP LỆ — attempt1-ca31fac1 (20/20 + lớp B 5/5 +
  tickCost median 41,0 ms ≤60). CHUỖI LƯỢT YÊN HỢP LỆ 37 → 38.**
  Đạt ngay attempt1 (ngân sách dùng 1/3) — lần đầu tiên kể từ đợt 169
  không cần retry. Boot đo là boot MỚI ca31fac1 (reboot giữa phiên
  giết poller lúc 03:06Z; T4 khởi động lại tay, poller chạy lại).
+ **CỘNG DỒN MỚI (38 lượt hợp lệ): P1 156/159, P2 150/150,
  P3-A1 131/159, P3' 119/131 occurrence = 102/107 distinct-seq,
  P7 72/72.** Sổ distinct-seq ĐÃ THĂNG CẤP as-of-175
  (md5 `42927624dd8d6e405fb6a69a4df7b10d`; valid_rounds_p3 26;
  non_dat [242, 260, 283, 364, 498] — không đổi).
+ **BOOT ca31fac1 — GATE0 QUA DU PHONG T4-CHECK-ONLY.**
  POSTBOOT_PASS #86 (replay-đầy-đủ, poll=0) đã có từ 02:40:29Z
  nhưng chỉ cho boot cũ 70b7f7ee; trên boot mới, replay xong
  (dpkg 2→1545) và check-only của T4 PASS từ poll #13, gate0
  = T4-check-only — T5-175 CHƯA viết cờ mới cho boot này tính
  tới lúc T4 đóng (03:24Z). Khác đợt 174: cờ repair không còn
  là cửa duy nhất — lần này gate đứng bằng check-only.
+ **RAM <500 MB: 11/50 poll** (đợt thứ ba liên tiếp có poll <500;
  đợt 173: 41/144, đợt 174: 3/38). Toàn bộ 11 poll đều trên boot
  #86, chuỗi dài nhất 11 poll — RAM sập trong lúc load đã hạ.
**Ngày:** 23/11/2026 (lượt cron 09:35 +07 23/11 = 02:35:51Z).
**Boot đo:** HAI boot — 70b7f7ee (btime 01:01:37Z, ứng viên #86,
T7-174 đã xác minh 9 nguồn sơ bộ; số hiệu chờ T0-175 xác nhận)
rồi ca31fac1 (btime 03:06:05Z, ứng viên #87 — T0-175 xác minh).

## 0. Verdict tổng

- **#44 CÓ LƯỢT HỢP LỆ (attempt1-ca31fac1).**
  Poll #15 instance 3 (03:17:47Z) mở cửa: gate0=T4-check-only
  (pb_age=2) + RAM 1887 MB + load1 1,84/load5 1,63 + lock khong
  + blockers 0 + apt 0. Attempt1 chạy 03:17:47–03:21:38Z:
  **20/20 pass, lớp B DAT 5/5, tickCost median 41,0 ms ≤60**
  → LUOT HOP LE, poller thoát 0. Ngân sách dùng 1/3.
- **Hai boot, hai giai đoạn:** (a) boot 70b7f7ee: gate0=T5 suốt
  33 poll (cờ T5-175 viết 02:40:29Z, trước khi poller mở)
  NHƯNG RAM sập <1024 từ poll #12 (02:49:19Z là lần cuối
  RAM ≥1024) và giữ <1024 suốt 22 poll liên tiếp (min 404 MB),
  load5 cũng >2 phần lớn phiên — cửa KHÔNG MỞ ĐƯỢC lần nào;
  (b) reboot 03:06:05Z giết poller (0 attempt đã chạy nên
  không mất ngân sách); (c) boot ca31fac1: RAM ≥1024 ở 15/15
  poll (1414–1994 MB) NHƯNG gate0 khong-dat 12 poll đầu
  (replay đang cài, apt=1, dpkg 2→1545) — cửa chỉ mở khi
  check-only PASS ở poll #13–#15 và load1 rơi <2 ở poll #15.
- **Poller — 2 test poll + 2 instance thật, 50 poll thật,
  1 lần cửa mở, trên 2 boot (1 reboot).** Instance 2: 33 poll
  (02:41:36–03:05:57Z, boot 70b7f7ee), gate0 T5 33/33,
  RAM ≥1024: 10/33, RAM <500: **11/33**, dpkg 1545 đứng yên.
  Instance 3: 15 poll (03:07:15–03:17:47Z, boot ca31fac1),
  gate0 khong-dat 12 / T4-check-only 3, RAM ≥1024: 15/15,
  dpkg 2→1545 (replay cài xong trong phiên).
- **Chuỗi lượt yên hợp lệ: 37 → 38.** Median tickCost attempt1 =
  41,0 ms (chuỗi 38 lượt: mean 47,9, min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60).
- **Điều kiện GIỮ NGUYÊN như #43 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NÀO TRONG LÚC
  PROBE PASS CHẠY: CÓ 1 VI PHẠM NGOÀI T4 — xem F-175-T4-2.**
  Mọi phân tích của chính T4 (p1p3p7 tay, distinct-seq live,
  stats-175.py, đọc log T9) đều làm SAU khi poller thoát
  (từ ~03:23Z). Pre-flight postboot check-only (02:40Z) +
  2 test poll (02:40:53Z, 02:41:09Z) + check-only boot mới
  (03:07Z) chạy TRƯỚC khi mở poller / ngoài cửa sổ attempt.
  T4 không chạy probe chạm dpkg nào trong cả phiên (chỉ đọc
  `wc -l` dpkg.log + `pgrep -x`).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt1, lúc đóng — không đổi; mọi poll đều tree=YES
  sau khi sửa tree-md5.txt, xem F-175-T4-1).
- **Cờ:** `hidden_files/round175-t4.done` viết ~03:2xZ 23/11
  (trong hạn cờ ~05:00Z), CÓ NỘI DUNG; boot kiểm lần cuối
  trước khi viết cờ là ca31fac1.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-174-T4-3/5)

Chạy **trước mọi attempt, trước khi mở poller** (02:38–02:41Z),
ghi vào `hidden_files/round175-t4/preflight-175.txt` — **PASS**
(sau khi sửa 1 sót do test poll bắt được, xem F-175-T4-1).
Chi tiết đầy đủ trong preflight-175.txt; tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–174:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx (sau khi tạo lại tree-md5.txt, xem F-175-T4-1).
- **10/10 analyzer** có mặt; `bash -n` OK 4 script T4;
  `py_compile` OK 13 file py; Playwright-core có mặt;
  media `stripes-nonperiodic.mp4` (140.828 B) có mặt;
  không có `vite.lock`, không có `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-23
  04:30:00 UTC` → **1795408200** = 04:30Z (hạn cờ ~05:00Z =
  1795410000, hạn cứng 05:30Z = 1795411800); grep 0 hit cho
  `01:30`/`22:30`/`23:00Z`/`23:30Z`/`02:00Z`/`02:30Z`/`round173`/
  `WebKit #43`/`T4-174a`/`default=174`; `round174` chỉ còn
  fallback `round174-t5/` + glob `round174-*` (có chủ đích).
- **Copy-forward 174 → 175:** deadline `01:30Z` → `04:30Z`;
  hạn cờ/cứng `02:00Z`/`02:30Z` → `05:00Z`/`05:30Z`; T5FLAG
  chính `round175-t5/` + fallback `round174-t5/`; W trong 4
  script ĐÃ LÀ `round175-t4`; `T4-174a` → `T4-175a`;
  `default=174` → `default=175`; `WebKit #43` → `#44`;
  glob chống nhiễu `round173-*` → `round174-*`. **Grep không
  bắt được sót nào** trong nhãn deadline (khác đợt 174).
- **`cp -a` báo EPERM nhưng cleanup chạy vô điều kiện
  (F-170-T4-1):** thư mục sạch 19 file trước khi đổi tên script.
- **Freeze check (F-164-T4-1):** `round174-t4` còn **0 file
  mtime ≥ 02:35:51Z** (giờ mở đợt 175).
- **GATE0 LÚC MỞ: REPLAY ĐÃ XONG TRÊN BOOT #86 — KHÁC ĐỢT 174:**
  dpkg.log 1545 dòng, apt cuối 01:22:11Z (gstreamer1.0-tools);
  apt-get/dpkg không chạy (pgrep 0); cờ T5-175 VIẾT 02:40:29Z
  trong lúc pre-flight: mode **replay-day-du**, poll=0, dpkg
  1545, cache 183 .deb, lists 37; postboot check-only chạy tay
  **exit 0 PASS** (libs đủ, GST 269=269, apt đủ 11 gói — xem
  `preflight-postboot-175.log`). Gate0 lúc mở DAT cả hai đường
  (T5 chính + T4-check-only dự phòng). Lưu ý: dòng header đầu
  của preflight-postboot-175.log là text mẫu cũ của script
  (đợt 151) — chỉ các dòng PASS/KẾT LUẬN mới là kết quả thật.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7):**
  lần 1 (02:40:53Z) bắt được tree=CHUA-CO-MD5 (F-175-T4-1);
  lần 2 (02:41:09Z) sau khi tạo lại tree-md5.txt, tree=YES.
  Lần 1: RAM 549 MB, load1 3,73/load5 2,37, gate0=T5, lock=co
  (t0-round174, port 5560), blockers=1. Lần 2: RAM 529 MB,
  load1 5,79/load5 2,92, blockers=5 (T0 chạy click-test/render).
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`).
- **RAM lúc mở THẤP VÀ DAO ĐỘNG MẠNH:** avail 467 MB (02:39Z)
  → 550 MB (02:40Z) → 549/529 MB (2 test poll) — dưới ngưỡng
  1024 ngay từ đầu; cửa chỉ mở được trên boot mới.

## 1. Poller — 50 poll thật, 1 lần cửa mở, trên 2 boot (1 reboot)

- **Instance 1 — TEST (POLL_TEST=1), 2 poll, boot 70b7f7ee
  (02:40:53Z, 02:41:09Z):** cả 2 đều RAM <1024 (549/529 MB),
  load1 3,73/5,79, load5 2,37/2,92, gate0=T5, lock=co,
  blockers=1/5 → cửa đóng (thiếu RAM + load + lock +
  blockers) → **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần).
  2 poll này nằm trong `poll-test-175.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot 70b7f7ee, 33 poll (02:41:36–03:05:57Z),
  0 lần cửa mở:** RAM ≥1024: 10/33 (min 404, max 1796 MB);
  500–1023: 12/33; **<500: 11/33**; load1<2: 18/33; load5<2:
  11/33; gate0: **T5 33/33**; lock=khong 26, co 7 (vite.lock
  của T0-round174, port 5560 — xem F-175-T4-3); blockers>0:
  6 poll; apt>0: 0; dpkg 1545 đứng yên (replay đã xong).
- **Giai đoạn 1 — load + lock chặn (poll #1–#11, 02:41:36–
  02:49:19Z):** RAM ≥1024 ở 10/11 poll (1015–1796 MB);
  load1 vọt 6,43–11,09 ở poll #2–#6 (T0 click-test/render +
  luồng khác — 19 spike B2, xem §3); lock=co ở poll #1–#7
  (T0-round174 giữ vite.lock port 5560); load5 4,86–5,87.
  Cửa KHÔNG MỞ ĐƯỢC vì thiếu load<2 + lock + blockers.
- **Giai đoạn 2 — RAM sập, load đã hạ (poll #12–#33,
  02:50:04–03:05:57Z):** RAM<1024 từ #12 (1015 MB) và giữ
  <1024 suốt 22 poll liên tiếp; RAM<500 lần đầu ở #25
  (436 MB), chuỗi <500 dài nhất 11 poll (#23–#33, 404–492 MB);
  load1/load5 lúc này đều đẹp (0,30–1,24 / 0,85–1,50).
  Cửa KHÔNG MỞ ĐƯỢC vì thiếu RAM — giống hệt mẫu đợt
  174 giai đoạn 3, nhưng lần này RAM KHÔNG hồi lại trước reboot.
- **REBOOT GIỮA PHIÊN (03:06:05Z):** poll #33 (03:05:57Z) là
  poll cuối instance 2; reboot giết poller (service exec cũng
  restart theo); **0 attempt đã chạy nên không mất ngân sách**.
  T4 phát hiện boot mới ca31fac1 lúc ~03:06:50Z (gap #86→#87
  ứng viên = 7.468 s), chạy postboot check-only tay trên boot
  mới (exit 1 FAIL — replay mới bắt đầu) rồi **khởi động lại
  poller tay 03:07:15Z** (bài học F-173-T4-1). Khoảng
  không-poll ~1 phút (03:06–03:07Z).
- **Instance 3 — boot ca31fac1, 15 poll (03:07:15–03:17:47Z),
  1 lần cửa mở:** RAM ≥1024: 15/15 (min 1414, max 1994 MB);
  500–1023: 0; **<500: 0**; load1<2: 8/15; load5<2: 15/15;
  gate0: **khong-dat 12, T4-check-only 3**; lock=khong 15;
  blockers=0; apt>0: 14 poll; dpkg 2→1545.
- **Giai đoạn 3 — chờ gate0 trên boot mới (poll #1–#12
  instance 3, 03:07:15–03:14:47Z):** RAM ≥1024 ở 12/12 poll
  (1414–1994 MB), load1/load5 đẹp từ poll #4 (1,26/1,11)
  NHƯNG gate0=khong-dat (postboot exit 1; replay đang cài,
  apt=1, dpkg 2→252); dpkg nhảy 2→252 ở ~03:14Z rồi 252→1545
  ở ~03:16Z. Cửa KHÔNG MỞ ĐƯỢC vì thiếu gate0 + apt>0.
- **Giai đoạn 4 — cửa mở (poll #13–#15 instance 3):**
  postboot check-only PASS từ poll #13 (03:16:17Z),
  gate0=T4-check-only; load1 còn 2,61 ở poll #14 nên cửa chưa
  mở; poll #15 (03:17:47Z) load1 1,84/load5 1,63, RAM 1887 MB,
  apt=0 → **CỬA MỞ, attempt1 chạy ngay**. Poller thoát 0 sau
  attempt1 hợp lệ (03:21:38Z), trước hạn cắt 04:30Z tới 68 phút.
- **Phân rã 50 poll thật:** RAM≥1024: 25/50; RAM 500–1023:
  14/50; RAM<500: **11/50**. load1<2: 26/50; load5<2: 26/50.
  **Stats "gan-mo" đếm 8 vs mở cửa thật 1 (xem F-175-T4-4):**
  heuristic chỉ kiểm load1<2 + load5<2 + RAM≥1024 mà KHÔNG
  kiểm gate0/apt/PB/lock/blockers — 7 poll instance 3 (#4,
  #6–#11) bị đếm thừa dù gate0 khong-dat + apt=1; poll còn lại
  (#15) chính là lần mở cửa thật. Poller vẫn đúng (chỉ mở khi
  đủ MỌI điều kiện). gate0: T5 35 poll (2 test + 33 instance 2),
  khong-dat 12, T4-check-only 3. blockers>0: 8 poll (2 test +
  6 instance 2). apt>0: 14 poll (toàn instance 3, replay boot
  mới). **RAM <500 MB: 11/50 poll** — đợt thứ ba liên tiếp
  có poll <500 (đợt 173: 41/144; đợt 174: 3/38; đợt này
  11/50, toàn bộ trên boot #86). Ghi nhận để T9-175 đối
  chiếu headroom/balloon trên boot 70b7f7ee.

## 2. Attempt — 1 attempt (hợp lệ ngay), ngân sách dùng 1/3

- **Attempt1 — attempt1-ca31fac1, 03:17:47–03:21:38Z,
  LUOT HOP LE (20/20 + lớp B 5/5 + tickCost median 41,0 ms).**
  - Vite lock v2: lấy ticket ngay (chờ 0s), giữ ~207s. Xvfb :193
    lên 03:17:52Z. WebKit 27.2, app boot OK. Pass 20 xong
    03:19:12Z (30 khung rAF, 30 đo được, wall 3187 ms);
    partial JSON 20/20 ghi 03:19:1xZ (tickCost n=632,
    blendTick n=511, c2DrawLog n=1227).
  - Probe exit 0; JSON 3.513.890 B; flip afterPass=5,
    wallMs=25233; tickCost total n=632 median=**41,0** p90=68,0
    max=103 min=28; hậu flip+2000ms n=472 median=40,0.
    BlendTick/pass=25,6; rAF/pass median=37 (min 33, max 44).
    pageErrs=[].
  - Lớp B attempt1: **DAT 5/5** (sampler n=100, load1 max 3,29,
    RAM min 1031 MB max 1842 MB, 0 mẫu <500 MB, **0/100 mẫu
    <1024 MB**; load5 cuối 1,46; boot không đổi; dpkg delta 0;
    apt/dpkg = 0). Ps-before/after: `m56-175.py` của T2 chạy
    trong lúc attempt1 bắt đầu (xem F-175-T4-2 — chỉ ~4 s đầu,
    trước khi pass chạy).
  - Per-pass (20 pass): tick median 38,0–49,5 ms; wall
    2884–3309 ms; load1 mean 2,38–3,20; RAM mean 1060–1503 MB.
    Tương quan Pearson: median~load1_mean r=0,34;
    median~RAM_mean r=0,17 (chỉ mô tả, không kết luận nhân quả).
    Lưu ý: load1 mean trong attempt cao hơn hẳn đợt 174
    attempt2 (0,94–1,69) — do load1 là trung bình 1 phút còn
    dư từ đợt tải trước attempt (replay + T0), xem §3.
- **Ngân sách dùng 1/3.** Không attempt nào bị reboot giết
  (reboot 03:06:05Z xảy ra TRƯỚC attempt1); 2 attempt còn lại
  chưa dùng.

## 3. B2 spike / đối chiếu sampler T9 (theo nhiệm vụ đợt 175)

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT HỢP LỆ (attempt1,
  03:17:47–03:21:38Z): 1 SPIKE (03:18:04Z, load1 3,29).**
  T9 `b2-spikes.log` ghi **24 spike** tới lúc T4 đóng, phân rã:
  19 spike trong cửa sổ instance 2 (02:41–03:06Z, load1 tới
  6,10 lúc 02:51:36Z — T0 click-test/render + luồng khác);
  1 spike instance 3 pre-attempt (03:07:00Z, load1 3,22 —
  boot+55s); **1 spike trong cửa sổ attempt (03:18:04Z,
  load1 3,29)**; 3 spike còn lại ngoài các cửa sổ T4.
  Spike trong attempt BẰNG ĐÚNG load1 max của lớp B (3,29 ≤4
  nên lớp B vẫn DAT). Nó rơi 17 s sau khi pass 1 bắt đầu,
  trong lúc load1 trung bình 1 phút còn đang rớt dần từ đợt
  tải trước attempt (replay vừa xong 03:16Z + T0 khởi động
  lại sau reboot); ps-after SẠCH m56 (0 dòng) và không có
  process nặng mới nào trong lúc pass chạy — T4 không quy
  spike này cho một process cụ thể; giao T9-175 đối chiếu
  driver.
- **Đối chiếu sampler T9 (độc lập):** RAM min ~404 MB (khớp
  poller T4 min 404 MB). Phân tích balloon/headroom thuộc T9-175.

## 4. Replay/postboot trên 2 boot — POSTBOOT_PASS #86 ĐÃ CÓ (replay-đầy-đủ); cờ cho boot mới CHƯA CÓ lúc T4 đóng; 1 reboot trong phiên

- **Boot 70b7f7ee (btime 01:01:37Z, ứng viên #86 — CHƯA xác
  minh số hiệu; T0-175 xác minh 9 nguồn): replay host-side
  CHẠY ĐẦY ĐỦ.** dpkg.log 1545 dòng từ lúc T4 mở (02:38Z),
  hoạt động apt cuối 01:22:11Z (gstreamer1.0-tools,
  boot+20m34s); postboot check-only của T4 exit 0 ngay lúc
  mở. Theo cờ T5-175: watcher-175, **POSTBOOT_PASS mới viết
  02:40:29Z (boot+1h38m52s; dpkg 1545 dòng; cache 183 .deb;
  lists 37; postboot PASS poll0 độc lập exit 0 lúc 02:40:29Z;
  mode replay-day-du, poll=0; cờ cũ 3c704685 lưu
  POSTBOOT_PASS-3c704685)**. Gate0=T5 từ poll đầu tiên.
  **KHÁC đợt 174: đây là cờ REPLAY-ĐẦY-ĐỦ, KHÔNG phải
  repair-tay** — lần đầu tiên kể từ #83 có cờ đầy đủ (theo
  hồ sơ T5: #84/#85 đều repair). Tiếc là cửa không mở được
  trên boot này (RAM sập + load cao, xem §1) — giá trị gate
  của cờ #86 chưa được kiểm chứng bằng lượt yên trên cùng boot.
- **REBOOT 03:06:05Z — boot ca31fac1 (ứng viên #87).**
  T4 phát hiện ~03:06:50Z (44 s sau btime) qua boot_id đổi
  + poller chết; gap #86→#87 ứng viên = **7.468 s**
  (btime 1795403165 − 1795395697). Số hiệu chờ T0-175 xác
  minh 9 nguồn; (m) #87 + INSIDE #87 thuộc T2-175.
  Replay trên boot mới: dpkg.log chỉ 2 dòng lúc 03:07Z,
  apt-get đang chạy; cài dần 2→252 (~03:14Z) →1545 (~03:16Z),
  postboot check-only của T4 PASS từ poll #13 instance 3
  (03:16:17Z). **T5-175 CHƯA viết POSTBOOT_PASS mới cho
  boot ca31fac1 tính tới lúc T4 đóng (03:24Z)** — cờ trong
  `round175-t5/` vẫn là cờ cũ 70b7f7ee (mtime 02:40:29Z).
  Gate0 cho lượt hợp lệ #44 là **T4-check-only** (quyết (j)
  đợt 143) — hợp lệ theo luật đứng, nhưng T10/parent cần
  quyết giá trị gate này cho chuỗi FULL PASS (nếu O8 PASS trên
  cùng boot). T4 chỉ ghi dữ kiện, KHÔNG tự kết luận.
- **KHÔNG có reboot nào khác trong phiên đo hay lúc đóng:**
  boot ca31fac1 lúc attempt1 (03:17:47Z), lúc poller thoát
  (03:21:38Z) và lúc kiểm cuối (03:24:28Z) — btime 03:06:05Z
  không đổi; 0 dòng REBOOT PHAT HIEN trong poll log instance 3.
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-175 báo cáo. (T4 chỉ ghi:
  0 kẹt quan sát được trong attempt1 hợp lệ.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND175_T4_WEBKIT_QUIET44_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round175-t4/`):**
  `poll-wait-t4-175.sh` (deadline 04:30Z 23/11 + cờ T5
  round175-t5/ + fallback round174-t5/),
  `run-attempt-175.sh` (lượt yên #44),
  `distinct-seq-175.py` (ĐÃ DÙNG LIVE trên dữ liệu attempt1 —
  xem §7; khi chạy từ `apps/web/scripts/` phải truyền `--ledger`
  trỏ tới sổ, nếu không helper lỗi FileNotFoundError).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–174, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round175-t4/` — theo đúng mẫu 149–174: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round175-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–174).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-175.sh`, `run-attempt-175.sh`,
  `t4-attempt-inner.sh` (W = round175-t4 + glob check nhiễu
  chéo round174-*), `check-classb-t4.sh` (W = round175-t4),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7),
  `stats-175.py` (thống kê §A — trích từ log gốc;
  footer ĐÃ CẬP NHẬT cộng dồn 38 lượt),
  `distinct-seq-175.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-175: 102/107 distinct, occ 119/131, valid_rounds_p3 26,
  non_dat [242, 260, 283, 364, 498] — không đổi;
  md5 `42927624dd8d6e405fb6a69a4df7b10d`),
  `distinct-seq-ledger-175-proposed.json` (bản helper ghi ra
  trong live run — ĐÃ DÙNG để thăng cấp sổ; audit trail),
  `preflight-175.txt` + `preflight-postboot-175*.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-174-T4-3/5).
- **Log/evidence (hidden_files/round175-t4/, không stage):**
  `poll-t4.log` (33 poll instance 2 + 15 poll instance 3 +
  1 CUA YEN MO + 0 REBOOT PHAT HIEN trong log — reboot xảy ra
  giữa 2 instance, xem §1),
  `poll-test-175.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `poll-t4.nohup.log` + `poll-t4.nohup2.log` (log 2 lần chạy
  poller), `chain-t4.log` (start poller ×2 + 1 CUA YEN MO +
  attempt1 LUOT HOP LE),
  `postboot-t4-175-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-175-output.txt` (output stats-175.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có blockers),
  `preview-b-f3-flip-webkit-t4-attempt1-ca31fac1.json`
  (3.513.890 B, 20/20, probe exit 0),
  `classb-t4-attempt1-ca31fac1.txt` (DAT 5/5),
  `analyze-t4-attempt1-ca31fac1-*.txt` (10 analyzer attempt1,
  gồm p1p3p7 chạy TAY — xem F-174-T4-5, không tái diễn),
  `coverage-check-attempt1-ca31fac1.txt` (6/6),
  `load-mid-t4-attempt1-ca31fac1.log` (n=100),
  `run-webkit-t4-attempt1-ca31fac1.log` (20/20),
  `ps-before/after-t4-attempt1-ca31fac1.txt` (m56-175.py của T2
  chỉ trong ps-before — xem F-175-T4-2),
  `dpkg-lines-before-attempt1-ca31fac1.txt` (1545) +
  `apt-history-before-attempt1-ca31fac1.txt`,
  `attempt-done-attempt1-ca31fac1` (exit=0).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  03:21:38Z exit 0; vite :5187 trống, curl 000;
  `/tmp/.X11-unix/` trống — X193 của chính T4 đã dọn tay lúc
  đóng, xem F-175-T4-6).

## 6. Sai số F-175-T4-1..6 (+ nợ cũ)

- **F-175-T4-1 — CLEANUP COPY-FORWARD XÓA NHẦM `tree-md5.txt`
  (sót MỚI — test poll bắt được TRƯỚC khi mở poller, đã sửa).**
  Lệnh cleanup sau `cp -a` liệt kê `tree-md5.txt` trong danh
  sách file round-174 cần xóa (file này không phải artifact
  theo attempt mà là spec cây đứng) → test poll lần 1 báo
  tree=CHUA-CO-MD5. T4 tạo lại `tree-md5.txt` (530e10a7, khớp
  preview.tsx), test poll lần 2 tree=YES, rồi mới mở poller.
  Không mất số liệu, không ảnh hưởng verdict (test poll chỉ
  để bắt lỗi setup — đúng mục đích của nó). Checklist T4-176:
  KHÔNG đưa `tree-md5.txt` vào danh sách cleanup nữa.
- **F-175-T4-2 — T2 CHẠY `m56-175.py` TRONG CỬA SỔ ATTEMPT1
  (vi phạm quy tắc đứng — KHÔNG PHẢI T4, T4 chỉ ghi nhận;
  lần thứ hai liên tiếp sau F-174-T4-2).** Ps-before bắt được
  4 process: pid 6010 (bash wrapper `.../round175-t2 &&
  bash run-guarded.sh m56 python3 m56-175.py`), 6011
  (run-guarded.sh), 6012 (tee), 6019 (python3 m56-175.py).
  Ps-after: **0 dòng m56**; log m56-175.log mtime 03:17:51Z —
  chỉ ~4 s sau khi attempt mở (03:17:47Z), TRƯỚC khi Xvfb lên
  (03:17:52Z) và WebKit launch (03:17:53Z) — **0 giây chồng
  với probe pass** (pass chạy ~03:18–03:19:12Z). Class B vẫn
  DAT 5/5 nên không ảnh hưởng verdict; KHÔNG kết luận m56 gây
  ra spike 03:18:04Z (spike rơi 13 s sau khi m56 xong, trong
  lúc load1 trung bình 1 phút còn rớt dần). Nhẹ hơn hẳn đợt
  174 (~75 s chồng attempt1): lần này chỉ ~4 s chồng pha khởi
  động. Nhắc lại cho đợt 176: T2 (và mọi luồng) KHÔNG chạy
  script phân tích nặng trong lúc probe pass chạy — kể cả pha
  khởi động attempt.
- **F-175-T4-3 — T0-ROUND174 GIỮ VITE.LOCK + CLICK-TEST/RENDER
  CHẠY TRONG LÚC POLLER CHỜ GATE TRÊN BOOT #86 (ghi nhận,
  KHÔNG vi phạm — ngoài cửa sổ attempt vì chưa có attempt).**
  Poll #1–#7 instance 2: lock=co (thread=t0-round174, pid
  17064, port 5560, http 200) + blockers 1–6 (clicktest
  webkit + render node); load1 vọt tới 11,09 ở poll #2
  (19 spike B2, xem §3). Vì chưa có attempt nào nên không
  ảnh hưởng verdict; giao T0/T10 đối chiếu lịch các luồng
  trong cửa sổ 02:41–02:49Z. Lưu ý: tên thread vẫn là
  `t0-round174` dù ticket/started là giờ đợt 175 — có thể
  T0-175 tái dùng nhãn cũ; giao T0-175 xác nhận.
- **F-175-T4-4 — STATS "GAN-MO" ĐẾM 8 ≠ MỞ CỬA THẬT 1
  (heuristic đếm thừa — lần thứ tư liên tiếp, poller vẫn
  đúng).** `stats-175.py` đếm "gan-mo" = load1<2 + load5<2
  + RAM≥1024 đồng thời, KHÔNG kiểm gate0/apt/PB/lock/
  blockers: ra 8 (7 poll instance 3 #4/#6–#11 bị chặn bởi
  gate0 khong-dat + apt=1, + poll #15 mở cửa thật) trong
  khi chỉ 1 poll mở cửa thật (#15). Đợt 174 cũng lệch
  (3 vs 2), đợt 173 (34 vs 0), đợt 172 (6 vs 1). Poller
  không sai (chỉ mở khi đủ MỌI điều kiện). Ghi nhận để T10
  kiểm: số "gan-mo" trong §A KHÔNG được dùng làm số cửa mở
  — số đúng là 1.
- **F-175-T4-5 — REBOOT GIỮA PHIÊN GIẾT POLLER, T4 KHỞI ĐỘNG
  LẠI TAY (bài học F-173-T4-1 ĐÃ ÁP DỤNG — lần đầu tiên
  kể từ đợt 173 poller chết theo reboot).** Reboot 03:06:05Z
  xảy ra lúc poller instance 2 đang chờ gate (0 attempt đã
  chạy); T4 phát hiện boot mới lúc ~03:06:50Z, chạy postboot
  check-only tay trên boot mới (exit 1 FAIL — replay mới bắt
  đầu), khởi động lại poller 03:07:15Z. Poller mới nối tiếp
  đúng luật: đếm poll tách instance theo dòng start
  (stats-175.py), ngân sách attempt đếm trên đĩa (0 file
  attempt-done-* trước attempt1), tag attempt mang boot mới
  (attempt1-ca31fac1). Khoảng không-poll ~1 phút (03:06–03:07Z)
  được ghi nhận, không che giấu.
- **F-175-T4-6 — X193 SOCKET LÚC ĐÓNG LÀ CỦA CHÍNH T4 (đã dọn
  tay — giống F-174-T4-8).** Sau khi poller thoát,
  `/tmp/.X11-unix/` còn X193 (Xvfb :193 của attempt1, process
  đã chết nhưng socket còn). T4 đã `rm` X193 lúc đóng (03:24Z).
- **F-174-T4-1 — KHÔNG TÁI DIỄN.** Attempt1 PASS sạch 20/20
  ngay lần đầu, không wedged.
- **F-174-T4-3 — KHÔNG TÁI DIỄN.** Kiểm process lúc đóng dùng
  `ps` trực tiếp (0 process T4, 0 Xvfb) — không dùng `pgrep -f`.
- **F-174-T4-4 — TÁI DIỄN DƯỚI DẠNG F-175-T4-4** (gan-mo
  8 vs mở thật 1 — lần thứ tư liên tiếp).
- **F-174-T4-5 — KHÔNG TÁI DIỄN.** `p1p3p7` chạy tay đúng dạng
  `<json> "<seqs>"` ngay lần đầu, exit 0.
- **F-174-T4-6 — TÁI DIỄN, NẶNG HƠN (RAM <500: 11/50 poll,
  chuỗi dài nhất 11 poll).** RAM <500 ở poll #23–#33 instance 2
  (404–492 MB) trong khi load ~0,3–1,2 (máy gần như idle) —
  cùng mẫu balloon đợt 173/174. T4 không kết luận nguyên nhân
  balloon (thuộc T9-175); gate RAM ≥1024 giữ nguyên theo quyết
  parent đợt 132, KHÔNG hạ ngưỡng để vớt lượt.
- **F-174-T4-7 — TÁI DIỄN DƯỚI DẠNG F-175-T4-3.**
- **F-174-T4-8 — TÁI DIỄN DƯỚI DẠNG F-175-T4-6** (X193 đã
  dọn tay lúc đóng).

## 7. P3' cộng dồn (MỚI — 38 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 175 (MỚI): P1 156/159, P2 150/150,
  P3-A1 131/159, P3' 119/131 occurrence = 102/107
  distinct-seq, P7 72/72** (38 lượt hợp lệ — #44 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 174 §6: "37 lượt hợp lệ" — nay 38).
- **Đóng góp lượt #44 (attempt1-ca31fac1, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=6 occurrence / 6 distinct-seq [301, 353, 382, 442, 469,
  493], trong đó 3 seq MỚI [353, 442, 493], cả 3 đều DAT.
  - **P1 — ĐÚNG 6/6 occ** (cả 6 gần run-end ±1 tick: 301/353/
    382/469/493 khớp run_end trực tiếp, 442 khớp 441 ±1;
    trong 15 run_end seqs; baseline 45/385, p=2,54983e-06 —
    verdict ĐÚNG theo luật DEF §3 vì n=6 ≥3 và p<0,01).
    Cộng dồn 150/153 → **156/159**.
  - **P2 ĐÚNG — 6/6 occ** (lag +1f ×6; 0 lag âm). Cộng dồn
    144/144 → **150/150**.
  - **P3-A1 — ĐÚNG 5/6 occ** (5/6 seq đóng băng-tại-tick
    [301, 353, 382, 442, 493]; 469 không; baseline 77/384,
    p=0,0016201 — verdict ĐÚNG theo luật DEF §5 vì 5/6 ≥2/3
    VÀ p<0,01). Cộng dồn 126/153 → **131/159**.
  - **P3' 6/6 occ ĐẠT** (stall: 301=6, 353=5, 382=5, 442=7,
    469=3, 493=5). Cộng dồn 99/104 → **102/107 distinct**
    (3 seq DAT MỚI — 353, 442, 493); occurrence 113/125 →
    **119/131**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 36,
    0: 38}; đối chứng toàn bộ drawSrc post: {-1: 316, 0: 154},
    0/470 entry). Cộng dồn 71/71 → **72/72**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-175.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 174: 99/104 distinct, occ 113/125), tính seq
  MỚI = tập hiệu với sổ, in cộng dồn mới, ghi sổ MỚI ra file
  riêng (`distinct-seq-ledger-175-proposed.json`) — KHÔNG sửa
  sổ gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Live đợt 175:** sổ + stall/c2coverage attempt1-ca31fac1 →
  **102/107 distinct, 119/131 occ** — khớp tính tay dưới đây.
  Sổ ĐÃ THĂNG CẤP: as-of 175, 102/107 distinct, occ 119/131,
  valid_rounds_p3 26, non_dat_in_union [242, 260, 283, 364, 498]
  (không đổi; md5 sổ mới `42927624dd8d6e405fb6a69a4df7b10d`).
  Helper KHÔNG cần back-test riêng đợt này (đã back-test khớp
  live 172 ở đợt 173, live 174 + live 175 đều khớp tính tay).
- **Kiểm chứng seq 301/353/382/442/469/493 đợt 175:**
  helper xác nhận **353 + 442 + 493 MỚI** (seen_c2 104 seq VÀ
  seen_dat 99 seq đều không chứa 3 seq này);
  **301 + 382 + 469 ĐÃ THẤY**. Tính tay: distinct DAT 99 + 3 =
  **102**; distinct tổng 104 + 3 = **107**; occurrence DAT
  113 + 6 = **119**, tổng 125 + 6 = **131**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — có thêm 6 mẫu (c2) mới đợt này:**
  P1 ĐÚNG 6/6 (p=2,5e-06) + P2 ĐÚNG 6/6 + P3-A1 ĐÚNG 5/6
  (p=0,0016) + P3' 6/6 + P7 ĐÚNG — lượt ĐÚNG TOÀN DIỆN đầu
  tiên kể từ đợt 169 (P3-A1 đợt 174 SAI 3/7). Seq 260
  (KHONG-DAT ×2 đợt 174) không xuất hiện đợt này.
- Chuỗi median tickCost 38 lượt (mới): 49,5 / 40,0 /
  52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 /
  58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 /
  39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 /
  42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 / 40,0 /
  43,0 / 46,0 / 44,5 / **41,0 ms** (trung bình 47,9 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 176

- **(a) #44 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 37 → 38.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT**
  (attempt1 hợp lệ trên boot ca31fac1 — nếu O8 PASS trên
  cùng boot thì chuỗi WebKit FULL PASS 25 → 26; T8 tự quyết O8).
- **(b) P3' cộng dồn MỚI 38 lượt: P1 156/159, P2 150/150,
  P3-A1 131/159, P3' 119/131 = 102/107, P7 72/72:**
  helper đã dùng live khớp tính tay; sổ distinct-seq ĐÃ THĂNG
  CẤP as-of-175. **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới.
- **(c) BOOT ca31fac1 (ứng viên #87, CHƯA xác minh số hiệu) —
  giao T0-175 xác minh 9 nguồn + (m) #87 (T2-175 + parent 175);
  (m) #86 cũng thuộc T2-175 + parent 175 (ứng viên DƯƠNG
  +49,418 s, sát biên trên 0,382 s — theo T7-174); (m) #84/#85
  đã CHẤP NHẬN đợt 174.** Dữ kiện T4: btime ca31fac1
  03:06:05Z, gap #86→#87 = 7.468 s; 1 reboot trong phiên T4.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-174-T4-3/5) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng, BỔ SUNG 2 MỤC:** KHÔNG đưa `tree-md5.txt` vào danh sách
  cleanup copy-forward (F-175-T4-1); T2/mọi luồng KHÔNG chạy
  script phân tích nặng trong cửa sổ attempt — kể cả pha khởi
  động attempt (F-175-T4-2 — vi phạm lần thứ hai liên tiếp).
  T4-176 áp dụng y hệt checklist này + grep số cộng dồn cứng
  trong stats-*.py (F-169-T4-3) + kiểm poller thoát bằng chain
  log, không dùng pgrep -f (F-169-T4-4) + kiểm boot + khởi động
  lại tay sau reboot (F-173-T4-1 — đã dùng đợt này).
- **(e) POSTBOOT_PASS #86 ĐÃ CÓ (02:40:29Z, boot+1h38m52s,
  mode replay-day-du, poll=0): GHI NHẬN.** Đây là cờ REPLAY
  ĐẦY ĐỦ đầu tiên kể từ #83 (khác #84/#85 mode repair) —
  nhưng cửa không mở được trên boot #86 nên giá trị gate của
  nó chưa được kiểm chứng bằng lượt yên. **POSTBOOT_PASS cho
  boot mới ca31fac1 CHƯA CÓ lúc T4 đóng (03:24Z)** — gate0
  cho lượt hợp lệ #44 là **T4-check-only** (quyết (j) đợt
  143): T10/parent cần quyết giá trị gate này cho chuỗi FULL
  PASS. Watcher-175 ĐANG CHẠY hay đã dừng lúc T4 đóng —
  giao T5-175 báo cáo.
- **(f) RAM <500 MB: 11/50 poll — ĐỢT THỨ BA LIÊN TIẾP CÓ POLL
  <500 (đợt 173: 41/144; đợt 174: 3/38).** Chuỗi <500 dài
  nhất 11 poll trên boot #86 (min 404 MB). Ghi nhận để
  T9-175 đối chiếu headroom/balloon (trong cửa sổ attempt1:
  RAM min 1031 MB — attempt chạy trên boot mới, không bị
  balloon).
- **(g) (m) #86/#87 (T2-175 + parent 175); INSIDE #86/#87
  (T2-175; FULL132/FULL133; chuỗi dài 4 từ #82); mù #96?/#88?
  (hole-recheck lần 19)/#94?/#95?/#77? (T2-175; U cách sàn
  29 s); (m) #56 lần 18 (T2-175); (1c') (f') V1 — đợt này
  0 kích hoạt mới (chờ T8-175); 84l10 điều tra riêng + Q3
  heartbeat (T8-175); E-185/E-186 kết cục (T9-175);
  POSTBOOT_PASS #87 (T5-175 lo — chưa có lúc T4 đóng, xem (e));
  #87 có giết holder không (T6-175); prune lần 50 (T6-175);
  checklist (o) (T8-175); H3 chỉ giám sát thụ động; birefnet
  0 thử lần 29; nhắc mọi luồng: KHÔNG chạy script nặng /
  KHÔNG probe dpkg trong cửa sổ attempt (đợt này T2 VI PHẠM
  1 lần trong attempt1 — xem F-175-T4-2; T5 không vi phạm);
  u2net là fallback chính thức; ci-security.yml vẫn 403 chờ
  user; TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT (attempt1,
  dpkg delta 0).** dpkg ổn định 1545 sau replay boot mới
  (poll #13–#15 instance 3); replay không chạy trong cửa sổ.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (poll #15 instance 3) → **CÓ lượt yên hợp lệ #44 cho chuỗi
  FULL PASS** (attempt1, boot ca31fac1). T8 tự quyết O8 đợt
  này (cùng boot đo).

## A. Phụ lục số liệu (script trích từ log gốc — stats-175.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-175.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-23T02:40:53Z - 2026-11-23T02:41:09Z, boot=70b7f7ee
   RAM min=529 max=549 >=1024: 0/2 500-1023: 2/2 <500: 0/2
   load1<2: 0/2 load5<2: 0/2 blockers>0: 2 apt>0: 0
   gate0: T5=2
   lock: co=2
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 33 poll, 2026-11-23T02:41:36Z - 2026-11-23T03:05:57Z, boot=70b7f7ee
   RAM min=404 max=1796 >=1024: 10/33 500-1023: 12/33 <500: 11/33
   load1<2: 18/33 load5<2: 11/33 blockers>0: 6 apt>0: 0
   gate0: T5=33
   lock: co=7, khong=26
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 11 poll
-- instance 3: 15 poll, 2026-11-23T03:07:15Z - 2026-11-23T03:17:47Z, boot=ca31fac1
   RAM min=1414 max=1994 >=1024: 15/15 500-1023: 0/15 <500: 0/15
   load1<2: 8/15 load5<2: 15/15 blockers>0: 0 apt>0: 14
   gate0: T4-check-only=3, khong-dat=12
   lock: khong=15
   dpkg 2->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 50
-- RAM toan phien: min=404 max=1994 >=1024: 25/50 <500: 11/50
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 8/50
   gan-mo? #4 2026-11-23T03:09:31Z boot=ca31fac1 RAM=1876 L1=1.26 L5=1.11 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #6 2026-11-23T03:11:01Z boot=ca31fac1 RAM=1549 L1=1.06 L5=1.24 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #7 2026-11-23T03:11:46Z boot=ca31fac1 RAM=1459 L1=0.68 L5=1.11 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #8 2026-11-23T03:12:31Z boot=ca31fac1 RAM=1510 L1=1.10 L5=1.16 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #9 2026-11-23T03:13:16Z boot=ca31fac1 RAM=1700 L1=0.71 L5=1.06 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #10 2026-11-23T03:14:01Z boot=ca31fac1 RAM=1516 L1=0.50 L5=0.95 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #11 2026-11-23T03:14:47Z boot=ca31fac1 RAM=1414 L1=0.75 L5=0.95 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #15 2026-11-23T03:17:47Z boot=ca31fac1 RAM=1887 L1=1.84 L5=1.63 blk=0 apt=0 gate0=T4-check-only(pb_age=2) lock=khong t5=cu(mtime-cu)
-- boot 70b7f7ee: 35 poll; RAM>=1024 lan cuoi: 2026-11-23T02:49:19Z #11; RAM<1024 lan dau: 2026-11-23T02:40:53Z #1 RAM=549
-- boot ca31fac1: 15 poll; RAM>=1024 lan cuoi: 2026-11-23T03:17:47Z #15; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 38 luot hop le): P1 156/159 P2 150/150 P3-A1 131/159 P3' 119/131 occ = 102/107 distinct-seq P7 72/72
-- chuoi median 38 luot: n=38 mean=47,9 min=39,0 max=60,0 vuot-60: 0
```
