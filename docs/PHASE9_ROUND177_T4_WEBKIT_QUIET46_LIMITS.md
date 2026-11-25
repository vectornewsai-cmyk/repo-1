# PHASE9_ROUND177_T4_WEBKIT_QUIET46_LIMITS.md

**Đợt:** 177. **Luồng:** T4 — đo lượt yên WebKit #46 trên 1 boot
+ **#46 CÓ LƯỢT HỢP LỆ — attempt1-94247dfa (20/20 + lớp B 5/5 +
  tickCost median 50,0 ms ≤60). CHUỖI LƯỢT YÊN HỢP LỆ 39 → 40.**
  Attempt1 thành công ngay lần đầu (ngân sách dùng 1/3) — khác
  đợt 176 (attempt1 wedged, attempt2 mới hợp lệ).
+ **CỘNG DỒN MỚI (40 lượt hợp lệ): P1 171/175, P2 166/166,
  P3-A1 145/175, P3' 135/147 occurrence = 113/117 distinct-seq,
  P7 74/74.** Sổ distinct-seq ĐÃ THĂNG CẤP as-of-177
  (md5 `cd6ef445…`; valid_rounds_p3 28;
  non_dat [260, 283, 364, 498] — 242 ĐÃ RA KHỎI danh sách).
+ **BOOT 94247dfa — GATE0 = T5 (REPAIR, KHÔNG PHẢI REPLAY-ĐẦY-ĐỦ).**
  POSTBOOT_PASS của T5-177 viết 08:51:55Z (repair-som-quyet-h,
  poll=1, dpkg 795 dòng, cache 110 .deb, lists 75) — cờ REPAIR;
  giá trị cho chuỗi FULL PASS thuộc T8/T10 quyết.
+ **RAM <500 MB: 1/22 poll** (poll #11, 444 MB lúc T5 apt-get
  update — khác đợt 176: 0/23). RAM ≥1024 ở 10/22 poll.
  Trong attempt1: RAM min 723 MB, 0 mẫu <500 MB.
**Ngày:** 23/11/2026 (lượt cron 15:35 +07 23/11 = 08:35:51Z).
**Boot đo:** MỘT boot — 94247dfa (btime 07:10:29Z, ứng viên #90 —
số hiệu chờ T0-177 xác nhận). **0 reboot trong phiên T4.**

## 0. Verdict tổng

- **#46 CÓ LƯỢT HỢP LỆ (attempt1-94247dfa).**
  Cửa mở lần duy nhất ở poll #20 (08:56:40Z): gate0=T5 + RAM
  1785 MB + load1 0,76/load5 1,07 + lock khong + blockers 0 +
  apt 0 + PB=0 → attempt1 chạy 08:56:40–09:00:35Z:
  **20/20 pass, lớp B DAT 5/5, tickCost median 50,0 ms ≤60**
  → LUOT HOP LE, poller thoát 0 lúc 09:00:35Z. Ngân sách dùng
  **1/3**.
- **Một boot, không reboot:** toàn bộ 22 poll thật + 1 attempt
  trên boot 94247dfa; boot không đổi lúc attempt1, poller thoát
  và lúc đóng (09:07Z).
- **Chuỗi lượt yên hợp lệ: 39 → 40.** Median tickCost attempt1 =
  50,0 ms (chuỗi 40 lượt: mean 47,9, min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60).
- **Điều kiện GIỮ NGUYÊN như #45 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NÀO TRONG LÚC
  PROBE PASS CHẠY: 0 VI PHẠM.** Ps-before/after attempt1:
  0 dòng m56 (grep -c = 0 cả 2 file); không có script phân tích
  nặng nào của luồng khác trong cửa sổ attempt (chỉ có watcher/
  sampler nhẹ thường trực của T5/T9 + waiter T8 + watcher cờ của
  parent + 1 read-loop nhẹ của T7 (pid 205269, python in
  timestamp + sleep 540 — đã chạy từ TRƯỚC attempt, không khởi
  động trong cửa sổ) — đều sleep/poll nhẹ). Mọi phân tích của
  chính T4 (p1p3p7 tay, distinct-seq live, stats-177.py, đọc log
  T9) đều làm SAU khi poller thoát (từ ~09:00Z). Pre-flight
  postboot check-only (08:41Z) + 2 test poll (08:42:13Z,
  08:42:17Z) chạy TRƯỚC khi mở poller / ngoài cửa sổ attempt.
  T4 không chạy probe chạm dpkg nào trong cả phiên (chỉ đọc
  `wc -l` dpkg.log + `pgrep -x`).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt1, lúc đóng — không đổi;
  mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round177-t4.done` viết ~09:10Z 23/11
  (trong hạn cờ ~11:00Z), CÓ NỘI DUNG; boot lúc kiểm lần cuối
  TRƯỚC KHI ĐÓNG PHIÊN ĐO (09:07:00Z) là 94247dfa — NHƯNG
  **có reboot mới 09:07:40Z (boot 8c0ec92d, ứng viên #91),
  xảy ra SAU khi poller thoát (09:00:35Z) và sau lần kiểm boot
  09:07:00Z, phát hiện lúc viết cờ 09:10:41Z** (xem §4). Reboot
  này KHÔNG ảnh hưởng verdict #46 (toàn bộ phiên đo chạy trên
  #90, 0 reboot trong phiên).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-176-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (08:39–08:42Z),
ghi vào `hidden_files/round177-t4/preflight-177.txt` — **PASS**
(không sót nào bị bắt; 2 lỗi copy-forward bắt được bằng grep
trước khi mở poller — xem dưới). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–176:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq gốc as-of-176 md5
  `a642b111…` (occ 126/138, distinct 106/111, valid_rounds_p3 27).
- **10/10 analyzer** có mặt; `bash -n` OK 4 script T4;
  `py_compile` OK 13 file py; Playwright-core có mặt;
  media `stripes-nonperiodic.mp4` (140.828 B) có mặt;
  không có `vite.lock`, không có `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-23
  10:30:00 UTC` → **1795429800** = 10:30Z (hạn cờ ~11:00Z =
  1795431600, hạn cứng 11:30Z = 1795433400); grep 0 hit cho
  `01:30`/`22:30`/`23:00Z`/`23:30Z`/`02:00Z`/`02:30Z`/`04:30`/
  `05:00`/`05:30`/`07:30`/`round174`/`round175`/`WebKit #45`/
  `T4-176a`/`default=176`/`run-attempt-176`/`poll-wait-t4-176`/
  `postboot-t4-176` trong script mới; `round176` chỉ còn fallback
  `round176-t5/` + glob `round176-*` (có chủ đích).
- **Copy-forward 176 → 177:** deadline `07:30Z` → `10:30Z`;
  hạn cờ/cứng `08:00Z`/`08:30Z` → `11:00Z`/`11:30Z`; T5FLAG
  chính `round177-t5/` + fallback `round176-t5/`; W trong 4
  script ĐÃ LÀ `round177-t4`; `T4-176a` → `T4-177a`;
  `default=176` → `default=177`; `WebKit #45` → `#46`;
  glob chống nhiễu `round175-*` → `round176-*`; 2 sót grep
  bắt được trước khi mở poller: (1) `poll-test-176.log`
  trong poll-wait (LÀ CODE THẬT — test poll sẽ ghi nhầm file
  176 — đã sửa thành 177); (2) 2 dòng header echo log còn
  `deadline=2026-11-23T07:30:00Z` (chỉ text log — đã sửa
  thành 10:30:00Z).
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 176); **`tree-md5.txt` KHÔNG có trong
  danh sách cleanup đợt này (F-175-T4-1 đã sửa) — còn nguyên,
  nội dung 530e10a7.**
- **Freeze check (F-164-T4-1):** `round176-t4` còn **0 file
  mtime ≥ 08:35:51Z** (giờ mở đợt 177).
- **GATE0 LÚC MỞ: REPLAY CHƯA XONG TRÊN BOOT #90 (ứng viên).**
  dpkg.log CHỈ 2 dòng (07:11:03Z "startup packages configure",
  boot+34s), 0 hoạt động apt kể từ đó; apt-get/dpkg không chạy
  lúc mở pre-flight (pgrep 0) nhưng T5-177 đang repair
  (apt-get update từ ~08:41Z); postboot check-only chạy tay
  **exit 1 FAIL** (wrapper PASS K1, GST PASS 269=269 qua
  symlink tạm → debroot, libs FAIL thiếu 5, apt FAIL thiếu 11
  gói — xem `preflight-postboot-177.log`); co T5-177 CHƯA CÓ
  lúc mở (round177-t5/ chỉ có formB log FAIL); co T5-176 chỉ
  ghi boot 15618ce8, mtime 05:42:19Z < btime 07:10:29Z —
  KHÔNG tính cho boot mới. Gate0 lúc mở CHƯA ĐẠT — poller
  CHỜ T5-177 repair xong + viết POSTBOOT_PASS #90 (chính)
  hoặc check-only PASS (dự phòng). Đây là TRẠNG THÁI GATE,
  không phải lỗi setup — pre-flight PASS. Lưu ý: dòng header
  đầu của preflight-postboot-177.log là text mẫu cũ của script
  (đợt 151) — chỉ các dòng PASS/FAIL/KẾT LUẬN mới là kết quả
  thật + exit 1.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (08:42:13Z): RAM 1274 MB, load1 2,77/load5 1,34,
  gate0=khong-dat, lock=khong, blockers=0, apt=1 (T5 repair
  đang chạy), dpkg 2. Lần 2 (08:42:17Z): RAM 1295 MB,
  load1 2,95/load5 1,40, gate0=khong-dat, lock=khong,
  blockers=0, apt=1, dpkg 2. Chỉ load1 vượt 2 + gate0 chưa
  đạt nên cửa chưa mở — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`).
- **RAM lúc mở DAO ĐỘNG MẠNH:** avail 420 MB (08:39Z) →
  1327–1387 MB (08:41Z); load1 1,43–2,95 / load5 0,56–1,40
  lúc mở — cửa chỉ mở khi đủ mọi điều kiện (poll #20).
- **F-176-T4-2 ĐÃ SỬA + KIỂM CHỨNG LIVE đợt này:**
  `check-classb-t4.sh` đếm sampler n chỉ trên dòng `boot=`
  (grep -c "^boot=") — attempt1 ghi n=100 = đúng 100 dòng
  mẫu thật (không thừa header `sampler-start` nữa).

## 1. Poller — 22 poll thật, 1 lần cửa mở, trên 1 boot (0 reboot)

- **Instance 1 — TEST (POLL_TEST=1), 2 poll, boot 94247dfa
  (08:42:13Z, 08:42:17Z):** cả 2 đều RAM ≥1024 (1274/1295 MB),
  load1 2,77/2,95, load5 1,34/1,40, gate0=khong-dat, lock=khong,
  blockers=0, apt=1 (T5 repair) → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần).
  2 poll này nằm trong `poll-test-177.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot 94247dfa, 20 poll (08:42:22–08:56:40Z),
  1 lần cửa mở:** RAM ≥1024: 8/20 (min 444, max 1785 MB);
  500–1023: 11/20; **<500: 1/20** (poll #11, 444 MB);
  load1<2: 17/20; load5<2: 20/20; gate0: **T5 7/20**,
  khong-dat 13/20; lock=khong 17, co 3 (vite.lock của
  T0-round177, port 5560); blockers>0: 3 poll; apt>0: 13 poll;
  dpkg 2 → 795 (repair xong giữa phiên).
- **Giai đoạn 1 — T5 repair đang chạy (poll #1–#13, 08:42:22–
  08:51:23Z):** gate0=khong-dat suốt (postboot exit 1 ở các
  lần check-only #1/#5/#9/#13 — libs/apt thiếu); apt=1
  (T5 `--repair`: apt-get update rồi install 11 gói);
  dpkg đứng yên 2 dòng; RAM rơi 1248 → 444 MB (balloon lúc
  apt chạy — poll #11 chạm 444 MB, poll <500 duy nhất);
  load1 0,40–2,88. Cửa KHÔNG MỞ ĐƯỢC vì thiếu gate0 + apt.
- **Giai đoạn 2 — cờ T5 có nhưng PB cũ (poll #14–#16,
  08:52:09–08:53:39Z):** T5-177 viết POSTBOOT_PASS 08:51:55Z
  (repair, dpkg 795); gate0=T5, apt=0, dpkg 795, RAM 1139–
  1294 MB, load1 0,86–1,89/load5 1,14–1,36 — đủ gate A +
  gate0, NHƯNG postboot_exit=1 (pb_age=1–3x45s: check-only
  cuối chạy ở poll #13, lúc repair chưa xong) nên cửa
  KHÔNG MỞ (poller đòi cả PB=0 — fail-closed theo thiết kế).
  Xem F-177-T4-1.
- **Giai đoạn 3 — T0 chặn cửa (poll #17–#19, 08:54:24–
  08:55:55Z):** check-only chạy lại ở poll #17 → **exit 0
  PASS (PB=0)**; nhưng T0-round177 giữ vite.lock
  (pid 205903, port 5560) + blockers 5 → 1, RAM 863–1042 MB
  (poll #17/#18 <1024). Cửa KHÔNG MỞ ĐƯỢC vì thiếu lock +
  blockers + RAM.
- **Giai đoạn 4 — cửa mở (poll #20, 08:56:40Z):** load1 0,76/
  load5 1,07, RAM 1785 MB, gate0=T5, PB=0, apt=0, lock=khong,
  blockers=0, tree=YES → **CỬA MỞ, attempt1 chạy ngay**.
  Poller thoát 0 sau attempt1 hợp lệ (09:00:35Z), trước hạn
  cắt 10:30Z tới 90 phút.
- **Phân rã 22 poll thật:** RAM≥1024: 10/22; RAM 500–1023:
  11/22; RAM<500: **1/22**. load1<2: 17/22; load5<2: 22/22.
  **Stats "gan-mo" đếm 6 ≠ mở cửa thật 1 — F-175-T4-4 TÁI
  DIỄN DƯỚI DẠNG F-177-T4-1 (đã giải thích: stats chỉ đếm
  load+RAM; 5 poll gan-mo không mở đều thiếu điều kiện khác
  có tên — xem §6).** gate0: T5 7/22 (poll #14–#20),
  khong-dat 15/22. blockers>0: 3 poll (toàn lúc T0 giữ lock).
  apt>0: 15/22 (13 poll instance 2 + 2 test poll — lúc T5
  repair). **RAM <500 MB: 1/22 poll** (poll #11, 444 MB lúc
  T5 apt-get update — khác đợt 176: 0/23; balloon chưa hết
  hẳn). Ghi nhận để T9-177 đối chiếu headroom/balloon trên
  boot 94247dfa.

## 2. Attempt — 1 attempt (hợp lệ ngay lần đầu), ngân sách dùng 1/3

- **Attempt1 — attempt1-94247dfa, 08:56:40–09:00:35Z,
  LUOT HOP LE (20/20 + lớp B 5/5 + tickCost median 50,0 ms).**
  - Vite lock v2: lấy ticket ngay (chờ 0s). Xvfb :193 lên
    08:56:45Z. WebKit 27.2, app boot OK. Pass 20 xong ~08:58Z
    (36 khung rAF/pass 1; rAF/pass median 35); partial JSON
    20/20 ghi 08:58Z (tickCost n=597, blendTick n=483,
    c2DrawLog n=1155).
  - Probe exit 0; JSON 3.243.494 B; flip afterPass=5,
    wallMs=27054; tickCost total n=597 median=**50,0** p90=76,0
    max=111 min=27; hậu flip+2000ms n=438 median=48,0.
    BlendTick/pass=24,1; rAF/pass median=35 (min 29, max 39).
    pageErrs=[].
  - Lớp B attempt1: **DAT 5/5** (sampler n=100 — đúng 100 mẫu
    thật sau fix F-176-T4-2, không thừa header; load1 max 1,31,
    RAM min 723 MB max 1684 MB, 0 mẫu <500 MB, **59/100 mẫu
    <1024 MB** (cảnh báo, không vi phạm); load5 cuối 0,95;
    boot không đổi; dpkg delta 0; apt/dpkg = 0).
    Ps-before/after: **0 dòng m56, 0 process nặng của luồng
    khác** (xem §6, F-177-T4-5 — KHÔNG vi phạm).
  - Per-pass (20 pass): tick median 34,0–59,0 ms; wall
    2929–3537 ms; load1 mean 0,55–1,15; RAM mean 734–1149 MB.
    Tương quan Pearson: median~load1_mean r=0,24;
    median~RAM_mean r=0,19 (chỉ mô tả, không kết luận nhân quả).
  - Kiểm chứng độc lập từ JSON gốc (T4 tự tính, không dùng
    analyzer): passes=20, engine=webkit, webkitVersion 27.2,
    pageErrs=[]; tickCost n=597 median=50,0 p90=76 max=111
    min=27 — KHỚP analyzer từng số; c2DrawLog n=1155
    (results/b/y2/c2DrawLog).
- **Ngân sách dùng 1/3.** Không attempt nào bị reboot giết
  (0 reboot trong phiên); 2 attempt còn lại chưa dùng.

## 3. B2 spike / đối chiếu sampler T9 (theo nhiệm vụ đợt 177)

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT HỢP LỆ (attempt1,
  08:56:40–09:00:35Z): 0 SPIKE.** Sampler T4 (2 s, n=100):
  load1 max 1,31 (≤4 nên lớp B DAT); poller poll #20
  load1 0,76; ram-sampler T9 quanh cửa sổ: load1 1,05
  (09:00:54Z), 1,08 (09:01:54Z) — không spike. **Attempt1
  chạy trong cửa sổ hoàn toàn sạch B2.**
- **T9-177 CHƯA CÓ `b2-spikes.log` lúc T4 đóng**
  (`b2-nohup.out` 0 byte; thư mục round177-t9 chưa có file
  spike nào) — đối chiếu B2 độc lập từ phía T9 CHƯA CÓ;
  giao T9-177 bổ sung/khẳng định (F-177-T4-4). Không vì
  thế mà hoãn verdict: sampler T4 + poller + ram-sampler T9
  đều không thấy spike trong cửa sổ attempt.
- **Đối chiếu sampler T9 (độc lập):** RAM min poller 444 MB
  (poll #11, lúc T5 repair); RAM min attempt1 723 MB
  (sampler T4) — T9 đối chiếu trũng RAM trong cửa sổ
  attempt1. Phân tích balloon/headroom thuộc T9-177.

## 4. Replay/postboot — POSTBOOT_PASS #90 (ứng viên) ĐÃ CÓ (repair, KHÔNG phải replay-đầy-đủ); 0 reboot trong phiên

- **Boot 94247dfa (btime 07:10:29Z, ứng viên #90 — CHƯA xác
  minh số hiệu; T0-177 xác minh 9 nguồn): replay KHÔNG tới
  (dpkg.log chỉ 2 dòng "startup packages configure" từ
  07:11:03Z, boot+34s, im hoàn toàn sau đó); T5-177 kích
  `--repair` sớm theo quyết (h) đợt 150 (replay-watch-177.sh
  pid 114543; apt-get update rồi install 11 gói; repair log
  53.018 B) → dpkg 795 dòng / 113 installs (mẫu repair-1-phần
  như đợt 150, goi cuoi libc-bin theo mẫu) — KHÁC mẫu
  replay-đầy-đủ 1545 dòng / 221 installs của #86/#89.
- **POSTBOOT_PASS ĐÃ CÓ 08:51:55Z** (boot+1h41m26s;
  watcher-177, **mode repair-som-quyet-h, poll=1**, dpkg 795
  dòng, cache 110 .deb, lists 75; postboot PASS poll1 độc lập
  exit 0 lúc 08:51:55Z; cờ cũ 15618ce8 lưu
  POSTBOOT_PASS-15618ce8). **Cờ REPAIR — KHÔNG phải
  replay-đầy-đủ**; giá trị cho gate (a) của chuỗi FULL PASS
  thuộc T8/T10 quyết (tiền lệ đợt 150: cờ repair-1-phần được
  chấp nhận với caveat; đợt 176: cờ replay-đầy-đủ không
  caveat). Gate0=T5 từ poll #14. **T4-check-only KHÔNG cần
  dùng làm gate0 chính đợt này** (chỉ dùng kèm điều kiện
  PB=0); check-only của T4 PASS độc lập ở poll #17 (exit 0,
  5 PASS / 0 FAIL).
- **KHÔNG có reboot nào trong phiên đo hay lúc poller thoát:**
  boot 94247dfa lúc attempt1 (08:56:40Z), poller thoát
  (09:00:35Z) và lúc kiểm cuối phiên đo (09:07:00Z) — btime
  07:10:29Z không đổi; 0 dòng REBOOT PHAT HIEN trong poll log.
  **NHƯNG có reboot mới SAU PHIÊN ĐO: boot 8c0ec92d, btime
  09:07:40Z (ứng viên #91), gap #90→#91 = 7.031 s** — xảy ra
  sau lần kiểm boot 09:07:00Z, phát hiện lúc T4 viết cờ
  09:10:41Z (trong lúc dọn dẹp/đóng sổ, sau khi poller đã thoát
  10 phút). Reboot này KHÔNG giết process T4 nào (0 process
  T4 còn sống từ 09:00:35Z), KHÔNG ảnh hưởng verdict #46
  (attempt1 + poller chạy trọn trên #90). Số hiệu #91 chờ
  T0-178 xác minh 9 nguồn; (m) #91 + INSIDE #91 thuộc T2-178;
  #91 có giết holder không thuộc T6-178. POSTBOOT_PASS #91
  CHƯA CÓ — T5-178 lo.
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-177 báo cáo. (T4 chỉ ghi:
  attempt1 chạy sạch 20/20 ngay lần đầu — không wedged.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND177_T4_WEBKIT_QUIET46_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round177-t4/`):**
  `poll-wait-t4-177.sh` (deadline 10:30Z 23/11 + cờ T5
  round177-t5/ + fallback round176-t5/),
  `run-attempt-177.sh` (lượt yên #46),
  `distinct-seq-177.py` (ĐÃ DÙNG LIVE trên dữ liệu attempt1 —
  xem §7; khi chạy từ `apps/web/scripts/` phải truyền `--ledger`
  trỏ tới sổ, nếu không helper lỗi FileNotFoundError).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–176, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round177-t4/` — theo đúng mẫu 149–176: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round177-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–176).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-177.sh`, `run-attempt-177.sh`,
  `t4-attempt-inner.sh` (W = round177-t4 + glob check nhiễu
  chéo round176-*), `check-classb-t4.sh` (W = round177-t4 +
  **FIX F-176-T4-2: đếm sampler n chỉ dòng `boot=`**),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7),
  `stats-177.py` (thống kê §A — trích từ log gốc;
  footer ĐÃ CẬP NHẬT cộng dồn 40 lượt),
  `distinct-seq-177.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-177: 113/117 distinct, occ 135/147, valid_rounds_p3 28,
  non_dat [260, 283, 364, 498];
  md5 `cd6ef4458aaf9c3dcde0a8a85c24244d`),
  `distinct-seq-ledger-177-proposed.json` (bản helper ghi ra
  trong live run — ĐÃ DÙNG để thăng cấp sổ; audit trail),
  `preflight-177.txt` + `preflight-postboot-177.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-176-T4-2).
- **Log/evidence (hidden_files/round177-t4/, không stage):**
  `poll-t4.log` (20 poll instance 2 + 1 CUA YEN MO +
  0 REBOOT PHAT HIEN trong log),
  `poll-test-177.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `poll-t4.nohup.log` (log 1 lần chạy poller),
  `chain-t4.log` (start poller ×1 + 1 CUA YEN MO +
  attempt1 LUOT HOP LE),
  `postboot-t4-177-gate0wait-*.log` (check-only mỗi 4 poll:
  #1/#5/#9/#13 exit 1 CHUA DU, #17 exit 0 DU DIEU KIEN),
  `stats-177-output.txt` (output stats-177.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có blockers),
  `preview-b-f3-flip-webkit-t4-attempt1-94247dfa.json`
  (3.243.494 B, 20/20, probe exit 0),
  `classb-t4-attempt1-94247dfa.txt` (DAT 5/5),
  `analyze-t4-attempt1-94247dfa-*.txt` (10 analyzer attempt1,
  gồm p1p3p7 chạy TAY — xem F-174-T4-5, không tái diễn),
  `coverage-check-attempt1-94247dfa.txt` (9/9),
  `load-mid-t4-attempt1-94247dfa.log` (n=100 mẫu thật),
  `run-webkit-t4-attempt1-94247dfa.log` (20/20),
  `ps-before/after-t4-attempt1-94247dfa.txt` (0 dòng m56 cả 2 file),
  `dpkg-lines-before-attempt1-94247dfa.txt` (795) +
  `apt-history-before-attempt1-94247dfa.txt`,
  `attempt-done-attempt1-94247dfa` (exit=0).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  09:00:35Z exit 0; vite :5187 trống, curl 000;
  `/tmp/.X11-unix/` TRỐNG sau khi T4 dọn tay X193 lúc đóng,
  xem F-177-T4-3).

## 6. Sai số F-177-T4-1..5 (+ nợ cũ)

- **F-177-T4-1 — STATS "GAN-MO" ĐẾM 6 ≠ MỞ CỬA THẬT 1
  (tái diễn dạng F-175-T4-4 — ĐÃ GIẢI THÍCH, không phải lỗi
  đếm).** Stats "gan-mo" chỉ đếm 3 điều kiện load+RAM
  (load1<2 + load5<2 + RAM≥1024): 6 poll (#2, #14, #15, #16,
  #19, #20). Cửa thật chỉ mở ở #20; 5 poll còn lại đều thiếu
  điều kiện khác CÓ TÊN: #2 apt=1 + gate0 khong-dat (T5 đang
  repair); #14/#15/#16 PB=1 (check-only cũ chạy lúc repair
  chưa xong — xem §1 giai đoạn 2); #19 lock=co + blockers=1
  (T0 giữ vite.lock). Ghi nhận để T10 khỏi nhầm là lệch đếm;
  đề xuất (không bắt buộc): stats các đợt sau in thêm lý do
  chặn từng poll gan-mo không mở.
- **F-177-T4-2 — T0-ROUND177 GIỮ VITE.LOCK + BLOCKERS TRONG
  LÚC POLLER CHỜ GATE (tái diễn dạng F-175-T4-3).** Poll
  #17–#19: lock=co (thread=t0-round177, pid 205903, port 5560)
  + blockers 5 → 1; RAM 863–1042 MB. Vì chưa có attempt nào
  nên không ảnh hưởng verdict; giao T0/T10 đối chiếu lịch
  các luồng trong cửa sổ 08:54–08:56Z.
- **F-177-T4-3 — X193 SOCKET LÚC ĐÓNG LÀ CỦA CHÍNH T4 (đã dọn
  tay — giống F-176-T4-3/F-175-T4-6).** Sau khi poller thoát,
  `/tmp/.X11-unix/` còn X193 (Xvfb :193 của attempt1, process
  đã chết nhưng socket còn). T4 đã `rm` X193 lúc đóng (09:07Z);
  lúc đóng `/tmp/.X11-unix/` TRỐNG.
- **F-177-T4-4 — T9-177 CHƯA CÓ `b2-spikes.log` LÚC T4 ĐÓNG.**
  `b2-nohup.out` 0 byte; thư mục round177-t9 chưa có file
  spike nào. Đối chiếu B2 trong cửa sổ attempt chỉ dựa được
  sampler T4 (load1 max 1,31) + poller + ram-sampler T9
  (load1 ~1,0–1,6) — đều sạch; giao T9-177 bổ sung/khẳng
  định độc lập.
- **F-177-T4-6 — COPY-FORWARD SÓT `poll-test-176.log` TRONG
  poll-wait (MỚI — bắt được bằng grep TRƯỚC KHI MỞ POLLER,
  không gây hậu quả).** Sau sed 176→177, dòng
  `POLLLOG="$W/poll-test-176.log"` còn sót (chỉ đổi tên file
  trong stats-177.py, quên trong poll-wait) — test poll sẽ ghi
  nhầm vào file log đợt 176. Grep stale-string trong pre-flight
  bắt được (cùng 2 dòng header echo còn `deadline=...07:30:00Z`);
  đã sửa thành `poll-test-177.log` + `10:30:00Z` trước khi mở
  poller. Bài học cho đợt sau: grep kiểm cả `poll-test-<cũ>`
  sau copy-forward (đã bổ sung vào §8(d)).
- **F-177-T4-5 — GHI NHẬN TÍCH CỰC: FIX F-176-T4-2 ĐÃ KIỂM
  CHỨNG LIVE.** `check-classb-t4.sh` đếm sampler n chỉ trên
  dòng `boot=` → attempt1 ghi n=100 = đúng 100 dòng mẫu thật
  (file load-mid có 100 dòng `boot=` + 1 dòng header
  `sampler-start` — header không còn bị tính thừa).
- **F-176-T4-1 — KHÔNG TÁI DIỄN.** 0 vi phạm quy tắc đứng đợt
  này (xem §0) — chuỗi 0 vi phạm giữ 2 đợt liên tiếp (176, 177).
- **F-176-T4-2 — ĐÃ SỬA + KIỂM CHỨNG LIVE (xem F-177-T4-5).**
- **F-176-T4-3 — TÁI DIỄN DƯỚI DẠNG F-177-T4-3** (X193 đã
  dọn tay lúc đóng).
- **F-175-T4-1 — KHÔNG TÁI DIỄN.** `tree-md5.txt` không còn
  trong danh sách cleanup copy-forward; test poll lần 1
  tree=YES ngay.
- **F-175-T4-2 — KHÔNG TÁI DIỄN (xem F-177-T4-5 + §0).**
- **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG F-177-T4-2.**
- **F-175-T4-4 — TÁI DIỄN DƯỚI DẠNG F-177-T4-1** (đã giải
  thích — stats gan-mo chỉ đếm load+RAM, không phải lỗi đếm).
- **F-175-T4-5 — KHÔNG TÁI DIỄN.** Poller KHÔNG bị reboot giết
  (0 reboot trong phiên); không cần khởi động lại tay.
- **F-175-T4-6 — TÁI DIỄN DƯỚI DẠNG F-177-T4-3** (X193 đã
  dọn tay lúc đóng).
- **F-174-T4-1 — KHÔNG TÁI DIỄN.** Attempt1 chạy sạch 20/20
  ngay lần đầu (không wedged như attempt1 đợt 176).
- **F-174-T4-3 — KHÔNG TÁI DIỄN.** Kiểm process lúc đóng dùng
  `ps` trực tiếp (0 process T4, 0 Xvfb) — không dùng `pgrep -f`.
- **F-174-T4-4 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (xem F-177-T4-1).**
- **F-174-T4-5 — KHÔNG TÁI DIỄN.** `p1p3p7` chạy tay đúng dạng
  `<json> "<seqs>"` ngay lần đầu, exit 0.
- **F-174-T4-6 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (RAM <500: 1/22
  poll — chỉ 1 poll lúc T5 repair, KHÔNG trong cửa sổ
  attempt; RAM min trong attempt1 723 MB, 0 mẫu <500).**

## 7. P3' cộng dồn (MỚI — 40 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 177 (MỚI): P1 171/175, P2 166/166,
  P3-A1 145/175, P3' 135/147 occurrence = 113/117 distinct-seq,
  P7 74/74** (40 lượt hợp lệ — #46 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 176 §6: "39 lượt hợp lệ" — nay 40).
- **Đóng góp lượt #46 (attempt1-94247dfa, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=9 occurrence / 9 distinct-seq [145, 166, 191, 218, 242,
  268, 345, 367, 413], trong đó 6 seq MỚI [145, 166, 191, 268,
  345, 413], 7 seq DAT MỚI [145, 166, 191, 242, 268, 345, 413]
  (242 đã thấy nhưng CHƯA DAT — nay DAT lần đầu).
  - **P1 — ĐÚNG 8/9 occ** (8 seq gần run-end ±1 tick; 145
    KHÔNG gần run-end; trong 17 run_end seqs; baseline 51/356,
    p=1,39331e-06 — verdict ĐÚNG theo luật DEF §3 vì 8/9 ≥2/3
    và p<0,01). Cộng dồn 163/166 → **171/175**.
  - **P2 ĐÚNG — 9/9 occ** (8× lag +1f + 1× lag +3f (seq 145);
    0 lag âm; DEF §4 chỉ đòi lag ≥ +1f — lag +3f KHÔNG vi
    phạm, là lần thứ hai lag >+1f trong lịch sử sau seq 145
    lượt #14 (lag +2f)). Cộng dồn 157/157 → **166/166**.
  - **P3-A1 — ĐÚNG 7/9 occ** (7/9 seq đóng băng-tại-tick;
    145 + 218 KHÔNG đóng băng-tại-tick theo định nghĩa nghiêm
    ngặt; baseline 84/355, p=0,000941085 — verdict ĐÚNG theo
    luật DEF §5 vì 7/9 ≥2/3 VÀ p<0,01). Cộng dồn 138/166 →
    **145/175**.
  - **P3' 9/9 occ ĐẠT** (stall: 145=5, 166=4, 191=4, 218=7,
    242=7, 268=7, 345=5, 367=3, 413=5). Cộng dồn 106/111 →
    **113/117 distinct** (7 seq DAT MỚI — 145, 166, 191, 242,
    268, 345, 413); occurrence 126/138 → **135/147**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 44,
    0: 54}; đối chứng toàn bộ drawSrc post: {-1: 282, 0: 155},
    0/437 entry). Cộng dồn 73/73 → **74/74**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-177.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 176: 106/111 distinct, occ 126/138), tính seq
  MỚI = tập hiệu với sổ, in cộng dồn mới, ghi sổ MỚI ra file
  riêng (`distinct-seq-ledger-177-proposed.json`) — KHÔNG sửa
  sổ gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Live đợt 177:** sổ + stall/c2coverage attempt1-94247dfa →
  **113/117 distinct, 135/147 occ** — khớp tính tay dưới đây.
  Sổ ĐÃ THĂNG CẤP: as-of 177, 113/117 distinct, occ 135/147,
  valid_rounds_p3 28, non_dat_in_union [260, 283, 364, 498]
  (242 ĐÃ RA — nay DAT; md5 sổ mới
  `cd6ef4458aaf9c3dcde0a8a85c24244d`).
  Helper KHÔNG cần back-test riêng đợt này (đã back-test khớp
  live 172 ở đợt 173, live 174 + live 175 + live 176 + live 177
  đều khớp tính tay).
- **Kiểm chứng seq 145/166/191/218/242/268/345/367/413 đợt 177:**
  helper xác nhận **145 + 166 + 191 + 268 + 345 + 413 MỚI**
  (seen_c2 111 seq VÀ seen_dat 106 seq đều không chứa 6 seq
  này); **218 + 242 + 367 ĐÃ THẤY** (242 đã thấy nhưng CHƯA
  DAT — nay DAT). Tính tay: distinct DAT 106 + 7 =
  **113**; distinct tổng 111 + 6 = **117**; occurrence DAT
  126 + 9 = **135**, tổng 138 + 9 = **147**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — có thêm 9 mẫu (c2) mới đợt này:**
  P1 ĐÚNG 8/9 (p=1,4e-06) + P2 ĐÚNG 9/9 + P3-A1 ĐÚNG 7/9
  (p=9,4e-04) + P3' 9/9 + P7 ĐÚNG — **lượt ĐÚNG cả 5 trụ thứ
  ba liên tiếp** (sau đợt 175, 176) — nhưng KHÔNG phải 9/9
  toàn diện như đợt 176 (P1 thiếu 145, P3-A1 thiếu 145 + 218).
  Seq 260 (KHONG-DAT ×2 đợt 174) không xuất hiện đợt này;
  seq 242 (KHONG-DAT ×2 đợt 174) xuất hiện và DAT lần đầu.
- Chuỗi median tickCost 40 lượt (mới): 49,5 / 40,0 /
  52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 /
  58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 /
  39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 /
  42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 / 40,0 /
  43,0 / 46,0 / 44,5 / 41,0 / **50,0 ms** (trung bình 47,9 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 178

- **(a) #46 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 39 → 40.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT**
  (attempt1 hợp lệ trên boot 94247dfa, gate0=T5 — NHƯNG cờ
  T5 đợt này là REPAIR, không phải replay-đầy-đủ như đợt 176;
  T8/T10 quyết cờ repair có đứng cho gate (a) không).
- **(b) P3' cộng dồn MỚI 40 lượt: P1 171/175, P2 166/166,
  P3-A1 145/175, P3' 135/147 = 113/117, P7 74/74:**
  helper đã dùng live khớp tính tay; sổ distinct-seq ĐÃ THĂNG
  CẤP as-of-177. **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới.
- **(c) BOOT 94247dfa (ứng viên #90, CHƯA xác minh số hiệu) —
  giao T0-177 xác minh 9 nguồn + (m) #90 (T2-177 + parent 177);
  INSIDE #89 (sơ bộ FALSE — T2-177) + INSIDE #90 (T2-177).**
  Dữ kiện T4: btime 94247dfa 07:10:29Z; 0 reboot trong phiên đo.
  **MỚI: reboot #91 (ứng viên) 09:07:40Z (boot 8c0ec92d, gap
  #90→#91 = 7.031 s) xảy ra SAU phiên đo, phát hiện lúc T4
  viết cờ 09:10:41Z — số hiệu + (m) #91 + INSIDE #91 thuộc
  T2-178; POSTBOOT_PASS #91 thuộc T5-178.**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-176-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng, BỔ SUNG 1 MỤC:** grep số cộng dồn cứng trong stats-*.py
  (F-169-T4-3) + kiểm poller thoát bằng chain log, không dùng
  pgrep -f (F-169-T4-4) + kiểm boot + khởi động lại tay sau
  reboot (F-173-T4-1) + **kiểm `poll-test-*.log` trong poll-wait
  sau copy-forward (F-177-T4-6 mới — xem §6).**
- **(e) POSTBOOT_PASS #90 (ứng viên) ĐÃ CÓ (08:51:55Z,
  boot+1h41m26s, mode repair-som-quyet-h, poll=1, dpkg 795):
  GHI NHẬN — cờ REPAIR, không phải replay-đầy-đủ.**
  **T4-check-only KHÔNG cần dùng làm gate0 chính đợt này**
  (gate0=T5 suốt từ poll #14; check-only chỉ kèm điều kiện
  PB=0). Hướng (3) VẪN ĐỨNG hay không — thuộc T5-177.
- **(f) RAM <500 MB: 1/22 poll (poll #11, 444 MB lúc T5 repair)
  — LẦN ĐẦU TIÊN KỂ TỪ ĐỢT 176 có poll <500 (đợt 176: 0/23).**
  Nhưng RAM trong attempt1 min 723 MB (100 mẫu, 0 mẫu <500)
  — attempt hợp lệ chạy trên RAM tốt hơn cửa sổ chờ.
- **(g) (m) #90 (T2-177 + parent 177; ứng viên +35,313 s, cách
  biên dưới 2,313 s); (m) #56 lần 20 (T2-177); mù #96?/#95?/
  #94?/#88? (hole-recheck lần 21)/#77? (T2-177; U cách sàn
  29 s); (1c') (f') V1 — đợt này 0 kích hoạt mới (chờ T8-177);
  84l10 điều tra riêng + Q3 heartbeat (T8-177); E-195 kết cục
  (T9-177); #90 có giết holder không (T6-177); prune lần 52
  (T6-177); checklist (o) (T8-177); H3 chỉ giám sát thụ động;
  birefnet 0 thử lần 31; nhắc mọi luồng: KHÔNG chạy script nặng
  / KHÔNG probe dpkg trong cửa sổ attempt (đợt này 0 vi phạm —
  chuỗi 0 vi phạm giữ 2 đợt liên tiếp, xem F-177-T4-5);
  u2net là fallback chính thức; ci-security.yml vẫn 403 chờ
  user; TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT (attempt1,
  dpkg delta 0).** dpkg ổn định 795 sau repair của T5
  (08:51:55Z, trước khi T4 mở cửa); repair không chạy trong
  cửa sổ.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (poll #20) → **CÓ lượt yên hợp lệ #46 cho chuỗi
  FULL PASS** (attempt1, boot 94247dfa, gate0=T5 repair).
  T8 tự quyết O8 đợt này (cùng boot đo).

## A. Phụ lục số liệu (script trích từ log gốc — stats-177.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-177.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-23T08:42:13Z - 2026-11-23T08:42:17Z, boot=94247dfa
   RAM min=1274 max=1295 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 2/2 blockers>0: 0 apt>0: 2
   gate0: khong-dat=2
   lock: khong=2
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 20 poll, 2026-11-23T08:42:22Z - 2026-11-23T08:56:40Z, boot=94247dfa
   RAM min=444 max=1785 >=1024: 8/20 500-1023: 11/20 <500: 1/20
   load1<2: 17/20 load5<2: 20/20 blockers>0: 3 apt>0: 13
   gate0: T5=7, khong-dat=13
   lock: co=3, khong=17
   dpkg 2->795
   chuoi RAM<500 dai nhat: 1 poll
-- TONG poll that: 22
-- RAM toan phien: min=444 max=1785 >=1024: 10/22 <500: 1/22
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 6/22
   gan-mo? #2 2026-11-23T08:43:07Z boot=94247dfa RAM=1144 L1=1.88 L5=1.39 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #14 2026-11-23T08:52:09Z boot=94247dfa RAM=1294 L1=1.89 L5=1.36 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #15 2026-11-23T08:52:54Z boot=94247dfa RAM=1139 L1=0.93 L5=1.19 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #16 2026-11-23T08:53:39Z boot=94247dfa RAM=1236 L1=0.86 L5=1.14 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #19 2026-11-23T08:55:55Z boot=94247dfa RAM=1042 L1=0.97 L5=1.14 blk=1 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t5/POSTBOOT_PASS) lock=co t5=PASS
   gan-mo? #20 2026-11-23T08:56:40Z boot=94247dfa RAM=1785 L1=0.76 L5=1.07 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 94247dfa: 22 poll; RAM>=1024 lan cuoi: 2026-11-23T08:56:40Z #20; RAM<1024 lan dau: 2026-11-23T08:44:37Z #4 RAM=957
-- cong don P3' (MOI, 40 luot hop le): P1 171/175 P2 166/166 P3-A1 145/175 P3' 135/147 occ = 113/117 distinct-seq P7 74/74
-- chuoi median 40 luot: n=40 mean=47,9 min=39,0 max=60,0 vuot-60: 0
```
