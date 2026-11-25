# PHASE9_ROUND179_T4_WEBKIT_QUIET48_LIMITS.md

**Đợt:** 179. **Luồng:** T4 — đo lượt yên WebKit #48 trên 1 boot
+ **#48 CÓ LƯỢT HỢP LỆ — attempt1-ae2a9a47 (20/20 + lớp B 5/5 +
  tickCost median 49,5 ms ≤60). CHUỖI LƯỢT YÊN HỢP LỆ 41 → 42.**
  Attempt1 thành công ngay lần đầu (ngân sách dùng 1/3) — trên
  boot #94 (ứng viên), sau khi T5 viết POSTBOOT_PASS #94
  (repair-sớm, poll=1) và T0 nhả lock O8 8 s trước khi cửa mở.
+ **CỘNG DỒN MỚI (42 lượt hợp lệ): P1 178/182, P2 173/173,
  P3-A1 151/182, P3' 142/154 occurrence = 118/122 distinct-seq,
  P7 76/76.** Sổ distinct-seq ĐÃ THĂNG CẤP as-of-179
  (md5 `9f13bc95…`; valid_rounds_p3 30;
  non_dat [260, 283, 364, 498] — không đổi).
+ **BOOT ĐO: ae2a9a47 (btime 17:17:09Z, ứng viên #94 — số hiệu
  chờ T0-179 xác minh). GATE0 = T5 (POSTBOOT_PASS #94 CÓ —
  xem §4).** 0 reboot trong phiên T4. Gap #93→#94 = 14.974 s.
**Ngày:** 23/11/2026 (lượt cron 00:35 +07 24/11 = 17:35:51Z).
**Boot đo:** MỘT boot — ae2a9a47 (ứng viên #94, btime
17:17:09Z; 34 poll, 1 cửa mở → attempt1 hợp lệ).

## 0. Verdict tổng

- **#48 CÓ LƯỢT HỢP LỆ (attempt1-ae2a9a47).**
  Cửa mở duy nhất ở poll #34 (18:09:31Z):
  gate0=T5 (POSTBOOT_PASS #94, 18:03:08Z) + PB=0 + RAM 1535 MB +
  load1 1,34/load5 1,16 + lock khong + blockers 0 + apt 0 →
  attempt1 chạy 18:09:31–18:13:27Z:
  **20/20 pass, lớp B DAT 5/5, tickCost median 49,5 ms ≤60**
  → LUOT HOP LE, poller thoát 0 lúc 18:13:27Z. Ngân sách dùng
  **1/3**.
- **Một boot, không reboot:** instance 2 (34 poll) chạy trọn
  trên boot ae2a9a47; 0 lần poller chết; 0 attempt bị giết.
- **Chuỗi lượt yên hợp lệ: 41 → 42.** Median tickCost attempt1 =
  49,5 ms (chuỗi 42 lượt: mean 47,9, min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60 — chuỗi ĐÃ KIỂM ĐẦY ĐỦ 42 số: xem
  F-179-T4-6, §7; median #47 (45,0) + #48 (49,5) đều có mặt).
- **Điều kiện GIỮ NGUYÊN như #47 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NÀO TRONG LÚC
  PROBE PASS CHẠY: 0 VI PHẠM THEO T4** (ps-before/after
  attempt1: 0 dòng m56; không có script phân tích nặng nào
  của luồng khác trong cửa sổ attempt — chỉ có waiter nhẹ
  của T8 + sampler/watcher nhẹ thường trực của T9 + 2 lần
  đọc trạng thái nhẹ của chính T4; xem §3 + F-179-T4-5 —
  **1 ghi nhẹ không rõ nguồn lúc 18:13:20Z, T4 ghi nhận
  đầy đủ và giao parent quyết như tiền lệ F-178-T2-8**).
  Mọi phân tích của chính T4 đều làm SAU khi poller thoát
  (từ ~18:13Z). Pre-flight + 2 test poll chạy TRƯỚC khi mở
  poller / ngoài cửa sổ attempt. T4 không chạy probe chạm
  dpkg nào trong cả phiên (chỉ đọc `wc -l` dpkg.log +
  `pgrep -x`).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt1, lúc đóng — không đổi;
  mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round179-t4.done` viết ~18:2xZ 23/11
  (trong hạn cờ ~20:00Z), CÓ NỘI DUNG; boot lúc kiểm lần cuối
  TRƯỚC KHI ĐÓNG (18:20:22Z) là ae2a9a47 — không đổi từ lúc
  attempt1.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (17:44:20Z),
ghi vào `hidden_files/round179-t4/preflight-179.txt` — **PASS**
(0 sót; grep stale-string sạch ngay lần đầu — khác đợt 177).
Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–178:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq gốc as-of-178 md5
  `761fd9dd…` (occ 141/153, distinct 117/121, valid_rounds_p3 29).
- **10/10 analyzer** có mặt; `bash -n` OK 4 script T4;
  `py_compile` OK 13 file py; Playwright-core có mặt
  (`/home/hatch/scratch-round63-r4/.../playwright-core/index.mjs`,
  import OK, webkit object); media `stripes-nonperiodic.mp4`
  (140.828 B) có mặt; không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-23
  19:30:00 UTC` → **1795462200** = 19:30Z (hạn cờ ~20:00Z =
  1795464000, hạn cứng 20:35Z = 1795466100); grep 0 hit cho
  `13:30`/`14:00`/`14:35`/`round177`/`poll-test-178`/
  `WebKit #47`/`T4-178a`/`default=178` trong script mới;
  `round178` chỉ còn fallback `round178-t5/` + glob `round178-*`
  (có chủ đích).
- **Copy-forward 178 → 179:** deadline `13:30Z` → `19:30Z`;
  hạn cờ/cứng `14:00Z`/`14:35Z` → `20:00Z`/`20:35Z`; T5FLAG
  chính `round179-t5/` + fallback `round178-t5/`; W trong 4
  script ĐÃ LÀ `round179-t4`; `T4-178a` → `T4-179a`;
  `default=178` → `default=179`; `WebKit #47` → `#48`;
  glob chống nhiễu `round177-*` → `round178-*`.
  (Grep stale-string sau copy-forward sạch ngay lần đầu —
  F-177-T4-6 không tái diễn.)
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 178); **`tree-md5.txt` KHÔNG có trong
  danh sách cleanup đợt này (F-175-T4-1 đã sửa) — còn nguyên,
  nội dung 530e10a7.**
- **Freeze check (F-164-T4-1):** `round178-t4` còn **0 file
  mtime ≥ 17:35:51Z** (giờ mở đợt 179).
- **GATE0 LÚC MỞ: CHƯA ĐẠT TRÊN BOOT #94 (ứng viên).**
  dpkg.log CHỈ 2 dòng (17:35:42 "startup packages configure" ×2
  — replay hệ thống); postboot check-only chạy tay
  **exit 1 FAIL** (wrapper PASS K1, GST FAIL 0 plugin hệ thống,
  libs FAIL thiếu 5, apt FAIL thiếu 11 gói — xem
  `preflight-postboot-179.log`); co T5-179 CHƯA CÓ lúc mở
  (round179-t5/ chưa tồn tại); co T5-178 chỉ ghi boot
  97054ac6 — KHÔNG tính cho boot mới (đúng luật F-151-T5-3:
  fallback mtime-cu). Gate0 lúc mở CHƯA ĐẠT — poller CHỜ
  T5-179 xong + viết POSTBOOT_PASS #94 (chính) hoặc
  check-only PASS (dự phòng). Đây là TRẠNG THÁI GATE, không
  phải lỗi setup — pre-flight PASS.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (17:44:30Z): RAM 1720 MB, load1 2,77/load5 1,49,
  gate0=khong-dat, apt=0, dpkg 2.
  Lần 2 (17:44:33Z): RAM 1782 MB, load1 2,77/load5 1,49,
  gate0=khong-dat, apt=0, dpkg 2. Chỉ load vượt 2 + gate0
  chưa đạt nên cửa chưa mở — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`).
- **RAM lúc mở 967–1782 MB; load1 2,03–3,69 lúc mở** — cửa chỉ
  mở khi đủ mọi điều kiện (poll #34, 18:09:31Z).
- **F-176-T4-2 ĐÃ SỬA + KIỂM CHỨNG LIVE đợt này (lần 3):**
  `check-classb-t4.sh` đếm sampler n chỉ trên dòng `boot=`
  — attempt1 ghi n=101 = đúng 101 dòng mẫu thật (xem
  F-179-T4-2; attempt dài ~209 s nên 101 mẫu, không phải 100).

## 1. Poller — 36 poll thật (2 test + 34 trên #94), 1 lần cửa mở, 0 reboot

- **Instance 1 — TEST (POLL_TEST=1), 2 poll, boot ae2a9a47
  (17:44:30Z, 17:44:33Z):** cả 2 đều RAM ≥1024 (1720/1782 MB),
  load1 2,77, load5 1,49, gate0=khong-dat, lock=khong,
  blockers=0, apt=0 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần).
  2 poll này nằm trong `poll-test-179.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot ae2a9a47, 34 poll (17:44:40–18:09:31Z),
  1 lần cửa mở:** RAM ≥1024: 16/34 (min 447, max 2083 MB);
  500–1023: 11/34; **<500: 7/34**; load1<2: 27/34;
  load5<2: 28/34; gate0: **T5 9/34** (từ poll #26),
  khong-dat 25/34; lock=khong 31, co 3 (T0 giữ, poll
  #31–#33); blockers>0: 3 poll; apt>0: 17 poll;
  dpkg 2 → 795 (repair T5 xong giữa phiên).
- **Giai đoạn 1 — load cao + gate0 chưa đạt (poll #1–#8,
  17:44:40–17:49:57Z):** gate0=khong-dat suốt (postboot exit 1
  ở các lần check-only #1/#5); load1 1,21–3,88, load5
  1,46–2,49 (cao lúc các luồng khác làm việc); RAM 1619–2083
  MB (tốt). Cửa KHÔNG MỞ ĐƯỢC vì thiếu gate0 + load.
- **Giai đoạn 2 — load yên + RAM tốt nhưng gate0/apt chặn
  (poll #9–#15, 17:50:42–17:55:13Z):** load1 0,21–0,76,
  load5 0,94–1,78, RAM 1051–1732 MB — đủ gate A — NHƯNG
  gate0=khong-dat + apt=1 (T5 repair đang chạy: apt-get
  update/install) → cửa KHÔNG MỞ. Đây là 7/8 poll "gan-mo"
  của stats (xem F-179-T4-1).
- **Giai đoạn 3 — RAM bị ghìm (poll #16–#25,
  17:55:58–18:02:44Z):** RAM rơi 1000 → 447 MB rồi GHÌM Ở
  ~447–519 MB: **chuỗi RAM<500 dài nhất 4 poll (#23–#26,
  18:01:14–18:03:29Z)**; load yên (load1 0,42–1,61);
  gate0=khong-dat tới poll #25. Cửa KHÔNG MỞ ĐƯỢC vì thiếu
  gate0 + RAM.
- **Giai đoạn 4 — cờ T5 có nhưng RAM + PB chặn (poll #26–#30,
  18:03:29–18:06:30Z):** T5-179 viết POSTBOOT_PASS 18:03:08Z
  (repair-sớm, poll=1, dpkg 795 — xem §4); gate0=T5 từ poll
  #26, apt=0, dpkg 795, NHƯNG postboot_exit=1 ở poll #26–#28
  (check-only cuối chạy lúc repair chưa xong hẳn) nên cửa
  KHÔNG MỞ (poller đòi cả PB=0 — fail-closed theo thiết kế;
  cùng mẫu F-177-T4-1). Poll #29 PB=0 nhưng RAM 495 MB →
  cửa KHÔNG MỞ; poll #30 RAM 469 MB → cửa KHÔNG MỞ.
- **Giai đoạn 5 — T0 chặn cửa (poll #31–#33,
  18:07:15–18:08:46Z):** T0-round179 giữ vite.lock
  (pid 68315, port 5560) + blockers 5/5/1; RAM hồi 673 → 941
  → 1005 MB; load1 1,34–2,13. Cửa KHÔNG MỞ ĐƯỢC vì thiếu
  lock + blockers + RAM (tái diễn dạng F-178-T4-4 — xem §6,
  F-179-T4-4). T0 chạy O8 trên #94 trong lúc này (xem §3).
- **Giai đoạn 6 — cửa mở (poll #34, 18:09:31Z):**
  T0 nhả lock sau O8 (O8 DONE 18:09:23Z — 8 s trước);
  load1 1,34/load5 1,16, RAM 1535 MB, gate0=T5, PB=0,
  apt=0, lock=khong, blockers=0, tree=YES →
  **CỬA MỞ, attempt1 chạy ngay**. Poller thoát 0 sau attempt1
  hợp lệ (18:13:27Z), trước hạn cắt 19:30Z tới 77 phút.
- **Phân rã 36 poll thật:** RAM≥1024: 18/36; RAM 500–1023:
  11/36; RAM<500: **7/36**. load1<2: 27/36; load5<2: 30/36.
  **Stats "gan-mo" đếm 8 = poll đủ load+RAM, CHỈ 1 mở cửa
  thật — F-179-T4-1 (xem §6): 7 poll thiếu gate0/apt/PB,
  không phải lỗi đếm.** gate0: T5 9/36, khong-dat 27/36.
  blockers>0: 3 poll (toàn lúc T0 giữ lock). apt>0: 17 poll.
  **RAM <500 MB: 7/36 poll** (chuỗi dài nhất 4, ngắn hơn hẳn
  đợt 178: 67/125, chuỗi 35). Ghi nhận để T9-179 đối chiếu
  headroom/balloon trên #94.

## 2. Attempt — 1 attempt (hợp lệ ngay lần đầu), ngân sách dùng 1/3

- **Attempt1 — attempt1-ae2a9a47, 18:09:31–18:13:27Z,
  LUOT HOP LE (20/20 + lớp B 5/5 + tickCost median 49,5 ms).**
  - Vite lock v2: lấy ticket ngay (chờ 0s). Xvfb :193 lên
    18:09:3xZ. WebKit 27.2, app boot OK. Pass 20 xong ~18:11Z
    (37 khung rAF/pass; rAF/pass median 36); partial JSON
    20/20 ghi ~18:11Z (tickCost n=597 lúc partial, n=598
    lúc cuối; blendTick n=482, c2DrawLog n=1156).
  - Probe exit 0; JSON 3.270.609 B; flip afterPass=5,
    wallMs=27155; tickCost total n=598 median=**49,5** p90=77,0
    max=100 min=28; hậu flip+2000ms n=429 median=50,0.
    BlendTick/pass=24,1; rAF/pass median=36 (min 31, max 39).
    pageErrs=[].
  - Lớp B attempt1: **DAT 5/5** (sampler n=101 — đúng 101 mẫu
    thật sau fix F-176-T4-2; load1 max 2,57, RAM min 682 MB
    max 1443 MB, 0 mẫu <500 MB, **54/101 mẫu <1024 MB**
    (cảnh báo, không vi phạm — RAM trong attempt đang hồi);
    load5 cuối 1,38; boot không đổi; dpkg delta 0;
    apt/dpkg = 0). Ps-before/after: **0 dòng m56**
    (xem §3, F-179-T4-5 — KHÔNG vi phạm theo T4, chờ parent
    quyết ghi nhẹ 18:13:20Z).
  - Per-pass (20 pass): tick median 37,5–69,0 ms; wall
    3035–3506 ms; load1 mean 0,83–2,55; RAM mean 704–1008 MB.
    Tương quan Pearson: median~load1_mean r=-0,03;
    median~RAM_mean r=0,03 (chỉ mô tả, không kết luận nhân quả).
  - Kiểm chứng độc lập từ JSON gốc (T4 tự tính, không dùng
    analyzer): passes=20, engine=webkit, webkitVersion 27.2,
    pageErrs=[]; tickCost (trường `total`) n=598 median=49,5
    p90=77 max=100 min=28 — KHỚP analyzer từng số; hậu
    flip+2000ms n=429 median=50,0 — KHỚP; c2DrawLog n=1156
    (results/b/y2/c2DrawLog).
- **Ngân sách dùng 1/3.** Không attempt nào bị reboot giết
  (0 reboot trong phiên); 2 attempt còn lại chưa dùng.

## 3. B2 spike / đối chiếu sampler T9 + O8 T0 (theo nhiệm vụ đợt 177–179)

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT HỢP LỆ (attempt1,
  18:09:31–18:13:27Z): 0 SPIKE.** Sampler T4 (2 s, n=101):
  load1 max 2,57 (≤4 nên lớp B DAT); poller poll #34
  load1 1,34; ram-sampler T9 quanh cửa sổ: load1 1,13
  (18:09:43Z), 2,29 (18:10:44Z), 1,82 (18:11:44Z), 1,65
  (18:12:44Z), 1,22 (18:13:44Z) — không spike;
  **`b2-spikes.log` của T9-179: spike cuối 17:47:28Z
  (load1 3,43) — TRƯỚC cửa sổ attempt gần 22 phút;
  0 spike nào trong cửa sổ.** **Attempt1 chạy trong cửa sổ
  hoàn toàn sạch B2.**
- **T9-179 ĐÃ CÓ `b2-spikes.log` lúc T4 đóng** (F-177-T4-4
  VẪN HẾT: đối chiếu B2 độc lập từ phía T9 CÓ).
- **O8 T0 TRÊN CÙNG BOOT — BÀN GIAO SẠCH, 0 CHỒNG:**
  T0-round179 chạy O8 trên #94, DONE 18:09:23Z (WebKit 21/21
  ×2 + Chromium 21/21 — xem NOTES T0); T4 poll #31–#33
  trong cửa sổ O8 đều ghi lock=co thread=t0-round179 +
  blockers → cửa yên KHÔNG mở; poll #34 (18:09:31Z, **8 s
  SAU khi O8 nhả lock**) "CUA YEN MO" (RAM=1535MB) → T4
  chạy attempt1 NGAY sau O8. **0 giây chồng lấn giữa O8
  và attempt1.** T0 kiểm cuối 18:12:40Z: 0 process sót của T0.
- **Ghi nhẹ trong cửa sổ (F-179-T4-5, xem §6):**
  `round109-k7/analyze-k7-skiplatest.txt` (2.084 B) mtime
  18:13:20Z — trong cửa sổ attempt (còn 7 s mới hết attempt);
  nguồn chưa xác định (không có process python nào trong
  ps-after; T2-179 có file witness/sessions sau cửa sổ —
  nghi T2 chạy lại analyzer k7 cũ, chưa xác nhận).
  Không ảnh hưởng load (load1 trong cửa sổ ≤2,57, 0 spike).
  T4 ghi nhận đầy đủ, KHÔNG tự phán vi phạm — parent quyết
  theo tiền lệ F-178-T2-8.

## 4. Replay/postboot — POSTBOOT_PASS #94 ĐÃ CÓ (repair-sớm, poll=1)

- **Boot ae2a9a47 (btime 17:17:09Z, ứng viên #94 — CHƯA xác
  minh số hiệu; T0-179 xác minh 9 nguồn): replay HỆ THỐNG
  tới (os-intent replay: dpkg.log 2 → 795 dòng; T5-179
  repair-sớm-quyết-h: cache 110 .deb, lists 66).
- **POSTBOOT_PASS #94 ĐÃ CÓ 18:03:08Z** (boot+46m;
  watcher-179, **mode repair-som-quyet-h, poll=1**, dpkg 795
  dòng, cache 110 .deb, lists 66; postboot PASS poll1 độc lập
  exit 0 lúc 18:03:08Z; cờ cũ 985bc2a3 lưu
  POSTBOOT_PASS-985bc2a3). **Cờ REPAIR-SỚM — CÓ caveat
  theo mẫu #90** (dpkg 795 ≠ 1545 của #92 replay-đầy-đủ;
  GIỐNG #90 repair-sớm-quyết-h, poll=1). Gate0=T5 từ poll
  #26 instance 2. **T4-check-only KHÔNG cần dùng làm gate0
  chính trên #94** (chỉ dùng kèm điều kiện PB=0; check-only
  của T4 PASS độc lập từ poll #29, exit 0).
- **REBOOT: 0 reboot trong phiên T4.** Boot lúc mở = boot lúc
  đóng = ae2a9a47. Số hiệu #94 chờ T0-179 xác minh 9 nguồn;
  (m) #94 + INSIDE #94 thuộc T2-179; #94 có giết holder
  không thuộc T6-179. POSTBOOT_PASS #94 thuộc T5-179
  (đã có — xem trên).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-179 báo cáo. (T4 chỉ ghi:
  attempt1 chạy sạch 20/20 ngay lần đầu — không wedged.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND179_T4_WEBKIT_QUIET48_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round179-t4/`):**
  `poll-wait-t4-179.sh` (deadline 19:30Z 23/11 + cờ T5
  round179-t5/ + fallback round178-t5/),
  `run-attempt-179.sh` (lượt yên #48),
  `distinct-seq-179.py` (ĐÃ DÙNG LIVE trên dữ liệu attempt1 —
  xem §7; khi chạy từ `apps/web/scripts/` phải truyền `--ledger`
  trỏ tới sổ, nếu không helper lỗi FileNotFoundError).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–178, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round179-t4/` — theo đúng mẫu 149–178: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round179-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–178).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-179.sh`, `run-attempt-179.sh`,
  `t4-attempt-inner.sh` (W = round179-t4 + glob check nhiễu
  chéo round178-*), `check-classb-t4.sh` (W = round179-t4 +
  đếm sampler n chỉ dòng `boot=` — fix F-176-T4-2),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-179.py` (thống kê §A;
  footer ĐÃ CẬP NHẬT cộng dồn 42 lượt),
  `distinct-seq-179.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-179: 118/122 distinct, occ 142/154, valid_rounds_p3 30,
  non_dat [260, 283, 364, 498];
  md5 `9f13bc95…`),
  `distinct-seq-ledger-179-proposed.json` (bản helper ghi ra
  trong live run — ĐÃ DÙNG để thăng cấp sổ; audit trail),
  `preflight-179.txt` + `preflight-postboot-179.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2).
- **Log/evidence (hidden_files/round179-t4/, không stage):**
  `poll-t4.log` (34 poll instance 2 trên #94 + 0 REBOOT PHAT
  HIEN), `poll-test-179.log` (2 test poll +
  2 TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log` (start poller + 1 CUA YEN MO +
  attempt1 LUOT HOP LE),
  `postboot-t4-179-gate0wait-*.log` (check-only mỗi 4 poll:
  #1/#5/#9/#13/#17/#21/#25 exit 1, #29 exit 0, #33 exit 0),
  `stats-179-output.txt` (output stats-179.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có
  blockers: #31–#33 T0 giữ lock),
  `preview-b-f3-flip-webkit-t4-attempt1-ae2a9a47.json`
  (3.270.609 B, 20/20, probe exit 0),
  `classb-t4-attempt1-ae2a9a47.txt` (DAT 5/5),
  `analyze-t4-attempt1-ae2a9a47-*.txt` (10 analyzer attempt1,
  gồm p1p3p7 chạy TAY — xem F-174-T4-5, không tái diễn),
  `coverage-check-attempt1-ae2a9a47.txt` (1/1),
  `load-mid-t4-attempt1-ae2a9a47.log` (n=101 mẫu thật),
  `run-webkit-t4-attempt1-ae2a9a47.log` (20/20),
  `ps-before/after-t4-attempt1-ae2a9a47.txt` (0 dòng m56),
  `dpkg-lines-before-attempt1-ae2a9a47.txt` (795) +
  `apt-history-before-attempt1-ae2a9a47.txt`,
  `attempt-done-attempt1-ae2a9a47` (exit=0).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  18:13:27Z exit 0; vite :5187 trống, curl 000;
  `/tmp/.X11-unix/` TRỐNG sau khi T4 dọn tay X193 lúc đóng,
  xem F-179-T4-3).

## 6. Sai số F-179-T4-1..6 (+ nợ cũ)

- **F-179-T4-1 — STATS "GAN-MO" ĐẾM 8 NHƯNG CHỈ 1 MỞ CỬA
  THẬT (GHI NHẬN — KHÔNG PHẢI LỖI ĐẾM).** Stats đếm poll đủ
  load1<2 + load5<2 + RAM≥1024 (8 poll: #9–#15 + #34); 7 poll
  #9–#15 thiếu gate0 (khong-dat) + apt=1 nên cửa không mở —
  đúng thiết kế (poller đòi cả gate0 + PB=0 + apt=0 + lock +
  blockers). Khác F-177-T4-1 (stats đếm sai mở cửa): lần này
  stats và cửa thật KHÔNG mâu thuẫn — chỉ cần đọc kèm điều
  kiện gate0. Ghi rõ để T10 khỏi nhầm khi tái kiểm.
- **F-179-T4-2 — SAMPLER n=101, KHÔNG PHẢI 100 (GHI NHẬN —
  KHÔNG PHẢI LỖI ĐẾM).** Attempt1 dài ~209 s (18:09:33–
  18:13:02Z sampler) → 101 mẫu thật 2 s/lần (đếm chỉ dòng
  `boot=` — fix F-176-T4-2 vẫn đứng; header `sampler-start`
  không tính). Khác đợt 178 (n=100, attempt ~192 s).
- **F-179-T4-3 — X193 SOCKET LÚC ĐÓNG LÀ CỦA CHÍNH T4 (đã dọn
  tay — giống F-178-T4-3/F-177-T4-3/F-176-T4-3/F-175-T4-6).**
  Sau khi poller thoát, `/tmp/.X11-unix/` còn X193 (Xvfb :193
  của attempt1, process đã chết nhưng socket còn; T0-179 cũng
  ghi nhận socket này lúc 18:09:35Z — thuộc T4). T4 đã `rm`
  X193 lúc đóng (18:20Z); lúc đóng `/tmp/.X11-unix/` TRỐNG.
- **F-179-T4-4 — T0-ROUND179 GIỮ VITE.LOCK + BLOCKERS TRONG
  LÚC POLLER CHỜ GATE (tái diễn dạng F-178-T4-4/F-177-T4-2).**
  Poll #31–#33: lock=co (thread=t0-round179, pid 68315,
  port 5560) + blockers 5/5/1; load1 1,34–2,13. Vì chưa có
  attempt nào nên không ảnh hưởng verdict; O8 T0 DONE
  18:09:23Z và nhả lock trước khi cửa mở 8 s — bàn giao sạch
  (xem §3). Giao T0/T10 đối chiếu lịch các luồng trong cửa sổ
  18:07–18:09Z.
- **F-179-T4-5 — GHI NHẸ KHÔNG RÕ NGUỒN TRONG CỬA SỔ ATTEMPT
  (GHI NHẬN — CHỜ PARENT QUYẾT, TIỀN LỆ F-178-T2-8).**
  `round109-k7/analyze-k7-skiplatest.txt` (2.084 B) mtime
  18:13:20Z — trong cửa sổ attempt1 (còn 7 s mới hết attempt);
  không có process python nào trong ps-after; T2-179 có file
  witness/sessions sau cửa sổ (nghi T2 chạy lại analyzer k7
  cũ — chưa xác nhận). Không ảnh hưởng load (load1 ≤2,57,
  0 spike B2, 0 dòng m56). T4 KHÔNG tự phán vi phạm —
  parent quyết có tính là chồng chéo không (nhẹ hơn hẳn
  walk mù của F-178-T2-8: chỉ 1 ghi file 2 KB, không phải
  script nặng chạy xuyên cửa sổ).
- **F-179-T4-6 — CHUỖI MEDIAN §7 ĐÃ KIỂM ĐẦY ĐỦ TRƯỚC KHI
  NỘP (theo nhiệm vụ đợt 179).** Chuỗi 42 số: tổng 2011,5;
  mean 47,9; min 39,0; max 60,0; 0 vượt 60 — median #47
  (45,0) + #48 (49,5) đều có mặt (xem §7). F-178-T4-2
  không tái diễn.
- **F-178-T4-1 — KHÔNG TÁI DIỄN.** 0 tick probe-mo của T9
  trong cửa sổ attempt (khác đợt 178: 1 tick 13:13:10Z).
  T9-179 sửa timestamp "13:13Z" sai đợt 178 — xem T9-179.
- **F-178-T4-2 — ĐÃ SỬA + KIỂM LẠI (xem F-179-T4-6).**
- **F-178-T4-3 — TÁI DIỄN DƯỚI DẠNG F-179-T4-3** (X193 đã
  dọn tay lúc đóng).
- **F-178-T4-4 — TÁI DIỄN DƯỚI DẠNG F-179-T4-4.**
- **F-177-T4-1 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (xem
  F-179-T4-1).**
- **F-177-T4-2 — TÁI DIỄN DƯỚI DẠNG F-179-T4-4.**
- **F-177-T4-3 — TÁI DIỄN DƯỚI DẠNG F-179-T4-3** (X193 đã
  dọn tay lúc đóng).
- **F-177-T4-4 — VẪN HẾT.** T9-179 ĐÃ CÓ `b2-spikes.log` lúc
  T4 đóng — đối chiếu B2 độc lập từ phía T9 CÓ (xem §3).
- **F-177-T4-6 — KHÔNG TÁI DIỄN.** Grep stale-string sau
  copy-forward sạch ngay lần đầu (0 sót).
- **F-176-T4-1 — KHÔNG TÁI DIỄN.** 0 vi phạm quy tắc đứng theo
  T4 (xem §0) — chuỗi 0 vi phạm đếm lại từ 0 ở đợt 179
  (F-178-T2-8 đã đứt chuỗi cũ ở đợt 178; đợt này T4 giữ 0
  vi phạm, F-179-T4-5 chờ parent quyết).
- **F-176-T4-2 — ĐÃ SỬA + KIỂM CHỨNG LIVE LẦN 3 (xem §0b,
  F-179-T4-2).**
- **F-176-T4-3 — TÁI DIỄN DƯỚI DẠNG F-179-T4-3.**
- **F-175-T4-1 — KHÔNG TÁI DIỄN.** `tree-md5.txt` không còn
  trong danh sách cleanup copy-forward; test poll lần 1
  tree=YES ngay.
- **F-175-T4-2 — KHÔNG TÁI DIỄN THEO T4 (xem F-179-T4-5 + §0).**
- **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG F-179-T4-4.**
- **F-175-T4-4 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (xem F-179-T4-1).**
- **F-175-T4-5 — KHÔNG TÁI DIỄN.** 0 reboot trong phiên T4.
- **F-175-T4-6 — TÁI DIỄN DƯỚI DẠNG F-179-T4-3** (X193 đã
  dọn tay lúc đóng).
- **F-174-T4-1 — KHÔNG TÁI DIỄN.** Attempt1 chạy sạch 20/20
  ngay lần đầu (không wedged như attempt1 đợt 176).
- **F-174-T4-3 — KHÔNG TÁI DIỄN.** Kiểm process lúc đóng dùng
  `ps` trực tiếp (0 process T4, 0 Xvfb) — không dùng `pgrep -f`.
- **F-174-T4-4 — KHÔNG TÁI DIỄN.** `p1p3p7` chạy tay đúng dạng
  `<json> "<seqs>"` ngay lần đầu, exit 0.
- **F-174-T4-6 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (RAM <500:
  7/36 poll — nhưng TOÀN trong lúc CHỜ gate;
  RAM min trong attempt1 682 MB, 0 mẫu <500).**

## 7. P3' cộng dồn (MỚI — 42 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 179 (MỚI): P1 178/182, P2 173/173,
  P3-A1 151/182, P3' 142/154 occurrence = 118/122 distinct-seq,
  P7 76/76** (42 lượt hợp lệ — #48 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 178 §6: "41 lượt hợp lệ" — nay 42).
- **Đóng góp lượt #48 (attempt1-ae2a9a47, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=1 occurrence / 1 distinct-seq [441], seq MỚI, DAT
  (stall=7). **441 MỚI** (440 + 442 đã có trong sổ, 441 chưa
  — helper xác nhận; T4 kiểm tay lại sổ as-of-178: 441 vắng
  thật).
  - **P1 — YẾU 1/1 occ** (441 gần run-end ±1 tick; trong 18
    run_end seqs; baseline 54/348, p=0,155 — verdict YẾU
    theo luật DEF §3 vì n=1 <3 VÀ p≥0,01). Cộng dồn 177/181 →
    **178/182** (đếm occurrence, không đổi dù verdict lượt YẾU).
  - **P2 ĐÚNG — 1/1 occ** (441 lag +1f; DEF §4 chỉ đòi
    lag ≥ +1f). Cộng dồn 172/172 → **173/173**.
  - **P3-A1 — YẾU 1/1 occ** (441 đóng băng-tại-tick; baseline
    88/347, p=0,254 — verdict YẾU theo luật DEF §5 vì p≥0,01
    và n<3). Cộng dồn 150/181 → **151/182**.
  - **P3' 1/1 occ ĐẠT** (stall: 441=7). Cộng dồn 117/121 →
    **118/122 distinct** (1 seq ĐẠT MỚI — 441);
    occurrence 141/153 → **142/154**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 5,
    0: 7}; đối chứng toàn bộ drawSrc post: {-1: 287, 0: 140},
    0/427 entry). Cộng dồn 75/75 → **76/76**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162).**
  Helper `distinct-seq-179.py` đọc sổ (as-of 178: 117/121
  distinct, occ 141/153), tính seq MỚI = tập hiệu với sổ,
  in cộng dồn mới, ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-179-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Live đợt 179:** sổ + stall/c2coverage attempt1-ae2a9a47 →
  **118/122 distinct, 142/154 occ** — khớp tính tay dưới đây.
  Sổ ĐÃ THĂNG CẤP: as-of 179, 118/122 distinct, occ 142/154,
  valid_rounds_p3 30, non_dat [260, 283, 364, 498] (không đổi;
  md5 sổ mới `9f13bc95…`). Helper KHÔNG cần back-test riêng
  đợt này (đã back-test khớp live 172 ở đợt 173, live
  174–179 đều khớp tính tay).
- **Kiểm chứng seq 441 đợt 179:**
  helper xác nhận **441 MỚI**; **0 seq ĐÃ THẤY**.
  Tính tay: distinct DAT 117 + 1 = **118**; distinct tổng
  121 + 1 = **122**; occurrence DAT 141 + 1 = **142**,
  tổng 153 + 1 = **154**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — có thêm 1 mẫu (c2) mới đợt này:**
  P1 YẾU 1/1 (p=0,155) + P2 ĐÚNG 1/1 + P3-A1 YẾU 1/1
  (p=0,254) + P3' ĐẠT 1/1 + P7 ĐÚNG — **lượt MỎNG (chỉ 1
  seq (c2)) nên 2/5 trụ YẾU theo luật n<3 — KHÔNG phải lượt
  ĐÚNG cả 5 trụ như đợt 175–177** (và không phải 6/6 toàn diện
  như đợt 177). Cộng dồn vẫn tăng đều (P2 173/173, P7 76/76).
- Chuỗi median tickCost 42 lượt (mới — ĐÃ KIỂM ĐẦY ĐỦ, xem
  F-179-T4-6):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 /
  39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 /
  58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 /
  44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 /
  53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 / 50,0 /
  45,0 / **49,5 ms** (tổng 2011,5; trung bình 47,9 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 180

- **(a) #48 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 41 → 42.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT**
  (attempt1 hợp lệ trên boot ae2a9a47, gate0=T5 với
  POSTBOOT_PASS #94 repair-sớm, poll=1 — T8/T10 quyết cờ
  repair-sớm có đứng cho gate (a) không; tiền lệ: #90 cũng
  repair-sớm, poll=1).
- **(b) P3' cộng dồn MỚI 42 lượt: P1 178/182, P2 173/173,
  P3-A1 151/182, P3' 142/154 = 118/122, P7 76/76:**
  helper đã dùng live khớp tính tay; sổ distinct-seq ĐÃ THĂNG
  CẤP as-of-179. **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới. Lượt #48 MỎNG (1 seq (c2)): P1 + P3-A1 YẾU theo luật
  n<3 — không phải lượt ĐÚNG 5 trụ.
- **(c) BOOT ae2a9a47 (ứng viên #94) — CHƯA xác minh số hiệu;
  giao T0-179 xác minh 9 nguồn + (m) #94 (T2-179 + parent
  179); INSIDE #94 (T2-179).** Dữ kiện T4: btime #94
  17:17:09Z, gap #93→#94 = 14.974 s; 0 reboot trong phiên T4.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale-string sạch ngay lần đầu
  (F-177-T4-6 không tái diễn).
- **(e) POSTBOOT_PASS #94 ĐÃ CÓ (18:03:08Z, boot+46m,
  mode repair-sớm-quyết-h, poll=1, dpkg 795): GHI NHẬN — cờ
  REPAIR-SỚM, có caveat theo mẫu #90 (khác cờ replay-đầy-đủ
  của #92). Giá trị cho gate (a) thuộc T8/T10 quyết.**
  Hướng (3) VẪN ĐỨNG hay không — thuộc T5-179.
- **(f) RAM <500 MB: 7/36 poll (chuỗi dài nhất 4 poll #23–#26)
  — NHẸ HƠN HẲN đợt 178 (67/125, chuỗi 35).** Nhưng RAM
  trong attempt1 min 682 MB (101 mẫu, 0 mẫu <500, 54 mẫu
  <1024) — attempt hợp lệ chạy trên RAM đang hồi.
  Giao T9-179 đối chiếu balloon/E-201 trên #94.
- **(g) (m) #94 (T2-179 + parent 179); (m) #56 lần 22
  (T2-179); mù #96?/#95?/#94?/#88? (hole-recheck lần 23)/#77?
  (T2-179); (1c') (f') — đợt này 0 kích hoạt mới (chờ T8-179);
  84l10 + Q3 heartbeat (T8-179); E-201 kết cục (T9-179);
  #94 có giết holder không (T6-179); prune lần 54 (T6-179);
  checklist (o) (T8-179); H3 chỉ giám sát thụ động;
  birefnet 0 thử lần 33; nhắc mọi luồng: KHÔNG chạy script
  nặng / KHÔNG probe dpkg trong cửa sổ attempt (đợt này T4
  giữ 0 vi phạm — F-179-T4-5 chờ parent quyết);
  u2net là fallback chính thức; ci-security.yml vẫn 403 chờ
  user; TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT (attempt1,
  dpkg delta 0).** dpkg ổn định 795 sau repair T5 (xong trước
  khi T4 mở cửa lúc 18:09:31Z); replay không chạy trong cửa sổ.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (poll #34) → **CÓ lượt yên hợp lệ #48 cho chuỗi FULL PASS**
  (attempt1, boot ae2a9a47, gate0=T5). T8 tự quyết O8 đợt này
  (cùng boot đo; O8 T0 trên #94 DONE 18:09:23Z — 8 s trước
  attempt1, 0 chồng).
- **(j) F-179-T4-5 (ghi nhẹ round109-k7 lúc 18:13:20Z trong
  cửa sổ attempt — chờ parent quyết có tính chồng chéo
  không); F-179-T4-1 (stats gan-mo 8 vs mở thật 1 — ghi rõ,
  không phải lỗi đếm); F-179-T4-2 (sampler n=101 — ghi nhận,
  không phải lỗi đếm).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-179.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-179.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-23T17:44:30Z - 2026-11-23T17:44:33Z, boot=ae2a9a47
   RAM min=1720 max=1782 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 2/2 blockers>0: 0 apt>0: 0
   gate0: khong-dat=2
   lock: khong=2
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 34 poll, 2026-11-23T17:44:40Z - 2026-11-23T18:09:31Z, boot=ae2a9a47
   RAM min=447 max=2083 >=1024: 16/34 500-1023: 11/34 <500: 7/34
   load1<2: 27/34 load5<2: 28/34 blockers>0: 3 apt>0: 17
   gate0: T5=9, khong-dat=25
   lock: co=3, khong=31
   dpkg 2->795
   chuoi RAM<500 dai nhat: 4 poll
-- TONG poll that: 36
-- RAM toan phien: min=447 max=2083 >=1024: 18/36 <500: 7/36
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 8/36
   gan-mo? #9 2026-11-23T17:50:42Z boot=ae2a9a47 RAM=1732 L1=0.76 L5=1.78 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #10 2026-11-23T17:51:27Z boot=ae2a9a47 RAM=1632 L1=0.36 L5=1.53 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #11 2026-11-23T17:52:12Z boot=ae2a9a47 RAM=1493 L1=0.38 L5=1.38 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #12 2026-11-23T17:52:57Z boot=ae2a9a47 RAM=1291 L1=0.53 L5=1.29 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #13 2026-11-23T17:53:42Z boot=ae2a9a47 RAM=1223 L1=0.70 L5=1.24 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #14 2026-11-23T17:54:27Z boot=ae2a9a47 RAM=1157 L1=0.45 L5=1.10 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #15 2026-11-23T17:55:13Z boot=ae2a9a47 RAM=1051 L1=0.21 L5=0.94 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #34 2026-11-23T18:09:31Z boot=ae2a9a47 RAM=1535 L1=1.34 L5=1.16 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round179-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot ae2a9a47: 36 poll; RAM>=1024 lan cuoi: 2026-11-23T18:09:31Z #34; RAM<1024 lan dau: 2026-11-23T17:55:58Z #16 RAM=1000
-- cong don P3' (MOI, 42 luot hop le): P1 178/182 P2 173/173 P3-A1 151/182 P3' 142/154 occ = 118/122 distinct-seq P7 76/76
-- chuoi median 42 luot: n=42 mean=47,9 min=39,0 max=60,0 vuot-60: 0
```
