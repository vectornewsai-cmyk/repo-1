# PHASE9_ROUND186_T4_WEBKIT_QUIET55_LIMITS.md

**Đợt:** 186. **Luồng:** T4 — đo lượt yên WebKit #55 trên 1 boot
+ **#55 KHÔNG CÓ LƯỢT HỢP LỆ — cả 3 attempt đều 20/20 nhưng đều
  bị loại (attempt1 B2 VI PHẠM load1_max 5,04; attempt2 median
  68,0 ms > 60; attempt3 B1+B2 VI PHẠM load5 cuối 2,52 /
  load1_max 6,24). Ngân sách dùng 3/3. CHUỖI LƯỢT YÊN HỢP LỆ
  47 → 0 (ĐỨT).**
  Poller thoát 18:13:11Z sau khi hết ngân sách — trước hạn cắt
  19:30Z.
+ **BOOT ĐO: MỘT boot — cea79500 (#107, btime 17:19:50Z; T0-186
  XÁC NHẬN 9 nguồn tươi). 0 reboot trong phiên đo.**
+ **CỘNG DỒN KHÔNG ĐỔI (47 lượt hợp lệ): P1 210/214, P2 205/205,
  P3-A1 182/214, P3' 174/186 occurrence = 137/140 distinct-seq,
  P7 108/108.** Sổ distinct-seq KHÔNG thăng cấp (giữ as-of-185,
  md5 `cd5410cc`); seq 110 của attempt3 (bị loại) chỉ ghi nhận,
  không đếm.
**Ngày:** 25/11/2026 (lượt cron 00:35 +07 25/11 = 17:35:51Z 24/11).
**Boot đo:** cea79500 (23 poll: 2 test + 21 poller).

## 0. Verdict tổng

- **#55 KHÔNG CÓ LƯỢT HỢP LỆ.** Cửa yên mở 3 lần (poll #11, #20,
  #21), chạy đủ 3 attempt trên cùng boot #107 — cả 3 đều 20/20
  pass nhưng không attempt nào đủ cả 3 điều kiện (20/20 + lớp B
  5/5 + tickCost median ≤ 60 ms). Ngân sách **3/3 (hết)**.
- **Chuỗi lượt yên hợp lệ: 47 → 0 (ĐỨT).** Chân lượt yên cho
  chuỗi FULL PASS **KHÔNG CÓ đợt này** (đợt 185 chuỗi FULL PASS
  lên 1 — đợt này không có lượt yên nên chuỗi về 0, parent quyết
  cuối; còn chờ chân O8 T8 + harness của T8-186).
- **Median tickCost leo dần qua 3 attempt: 60,0 → 68,0 → 79,0 ms**
  — cả 3 đều ≥ max 60,0 ms của chuỗi 47 lượt hợp lệ (xem
  F-186-T4-3). Boot #107 chậm/nhiễu hơn hẳn #104 (median 45,0).
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 6: ĐẠT (xem §6,
  F-186-T4-6).** 0 file analyzer nào ghi trong cả 3 cửa sổ
  attempt; file skiplatest mặc định mtime vẫn 18:13:20Z
  (đợt 179) — 0 ghi mới.
- **0 VI PHẠM PHÍA T4 — đề xuất CHUỖI ĐỢT SẠCH 1 → 2** (parent
  quyết cuối; đợt 185 chuỗi 0 → 1). Phía T4 giữ sạch: không khởi
  động script nặng nào trong lúc gate0wait; không probe dpkg nào
  trong cả phiên; mọi phân tích đều làm SAU khi attempt-done đã
  ghi (kiểm chứng live lần 6 ĐẠT). Các vi phạm B1/B2 là tải của
  chính attempt (burst render tự-tải, xem §3) — KHÔNG phải tải
  lạ kiểu F-184-T2-8; vẫn bị loại đúng luật B2 (xem F-186-T4-2).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, mọi poll đều tree=YES, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round186-t4.done` viết lúc đóng,
  CÓ NỘI DUNG, trong hạn cờ ~20:00Z; boot lúc đóng vẫn
  cea79500 (#107).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (17:43–17:45Z),
ghi vào `hidden_files/round186-t4/preflight-186.txt` — **PASS
PHẦN TĨNH** (0 sót; xem F-186-T4-1: 2 chuỗi stale bắt được ở
lần grep thứ 2/3 + sửa trước pre-flight). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–185:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ as-of-185 md5 `cd5410cc…` (occ 174/186,
  distinct 137/140, valid_rounds_p3 35, non_dat [260, 364, 498]).
- **10/10 analyzer** có mặt (+ `run-analyzers-186.sh` —
  quyết (p)); `bash -n` OK 5 script T4; `py_compile` OK 12
  file py; Playwright-core có mặt (webkit object, import
  tuyệt đối từ `scratch-round63-r4/node_modules/playwright-
  core/index.mjs`); media `stripes-nonperiodic.mp4` có mặt
  (140.828 B); không có `vite.lock`, không có `attempt-done-*`.
- **Fixture /tmp mất theo #105 — KHÔNG ẢNH HƯỞNG T4**
  (probe lấy media qua vite từ `public/`).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-24
  19:30:00 UTC` → **1795548600** = 19:30Z (hạn cờ ~20:00Z =
  1795550400, hạn cứng 20:35Z = 1795552500); grep 0 hit cho
  mẫu rộng `round184|13:30|14:00|14:35|#54|9161bfd1|round183|
  11:35Z|10:30Z|6ecd948e|T4-185a|default=185` trong 21 file
  mới (lần grep thứ 3 sạch — sau khi sửa 2 chuỗi sót ở lần 2:
  comment T5FLAG + tên file log postboot-t4-185, xem F-186-T4-1).
- **Copy-forward 185 → 186 (script python thay thế có neo,
  KHÔNG sed global):** deadline `13:30Z` → `19:30Z`; hạn
  cờ/cứng → `20:00Z`/`20:35Z`; T5FLAG chính `round186-t5/` +
  fallback `round185-t5/`; `T4-185a` → `T4-186a`;
  `default=185` → `default=186`; `WebKit #54` → `#55`; glob
  `round184-*` → `round185-*`.
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 185); **`tree-md5.txt` KHÔNG có trong danh
  sách cleanup — còn nguyên, 530e10a7.**
- **Freeze check (F-164-T4-1):** `round185-t4` còn **0 file
  mtime ≥ 17:35:51Z** (giờ mở đợt 186).
- **GATE0 LÚC MỞ: CHƯA ĐẠT.** round186-t5/ trống (T5-186 chưa
  ghi cờ); fallback round185-t5/POSTBOOT_PASS mtime 11:42:15Z
  < btime #107 17:19:50Z nên poller đánh "cu(mtime-cu)",
  KHÔNG TÍNH — đúng thiết kế chống cờ sai boot. **Check-only
  postboot chạy tay exit=1 FAIL** (GST thư mục thật chưa có,
  apt thiếu 11 gói — replay hệ thống đang cài dần trên boot
  #107 mới; xem `preflight-postboot-186.log`). Gate0 chỉ đạt
  khi T5-flag xuất hiện (17:48:46Z, poll #5) — check-only
  KHÔNG PASS lần nào trong cả phiên (PB=1 tới poll #4, PB=0
  từ poll #5 nhờ cờ T5, không nhờ check-only).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (17:45:34Z): RAM 5152 MB, load1 5,55/load5 3,49,
  gate0=khong-dat, t5flag=cu(mtime-cu), apt=0, dpkg 2.
  Lần 2 (17:45:37Z): RAM 5362 MB, load1 5,75/load5 3,56,
  gate0=khong-dat, apt=0, dpkg 2. Cửa chưa mở vì load +
  gate0 — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~1.006 MB avail (dao động 1.006 → 5.161 MB —
  balloon); load1 ~2,44 lúc mở** — cửa chỉ mở khi đủ điều kiện.
- **F-176-T4-2: KHÔNG TÁI DIỄN** — sampler n=104–107 đếm đúng.
- **F-185-T4-2: KHÔNG TÁI DIỄN** — một luồng T4 duy nhất từ
  đầu đến cuối (kiểm cả thư mục làm việc + tiến trình trước
  khi kết luận — 115 entry trong `round186-t4/` lúc đóng).

## 1. Poller — 23 poll thật (2 test + 21), 3 lần cửa mở, 0 reboot

- **Test (POLL_TEST=1), 2 poll, boot cea79500
  (17:45:34Z, 17:45:37Z):** cả 2 đều gate0=khong-dat,
  load1 5,55/5,75, load5 3,49/3,56, RAM 5152/5362 MB,
  lock=khong, blockers=0, apt=0, dpkg 2 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-186.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot cea79500 (#107), 21 poll
  (17:45:49–18:08:03Z), 3 lần cửa mở (#11, #20, #21):** RAM
  ≥1024: 21/21 (min 3523, max 6507 MB); 500–1023: 0/21;
  **<500: 0/21**; load1<2: 11/21; load5<2: 4/21;
  gate0: **T5 17/21** (cờ có từ poll #5, 17:48:51Z) +
  khong-dat 4/21 (poll #1–#4, trước khi cờ T5 có);
  lock=co 4, khong 17 (T0 giữ, poll #13–#16);
  blockers>0: 4 poll; apt>0: 3 poll; dpkg 2 → 768 (T5 repair
  trong phiên, NGOÀI cửa sổ attempt — B4 vẫn ĐẠT cả 3 attempt).
- **Giai đoạn 1 — chờ gate0 + load cao (poll #1–#10,
  17:45:49–17:52:37Z):** gate0 khong-dat poll #1–#4
  (check-only FAIL, apt=1 poll #2–#4 — T5 repair đang chạy);
  cờ T5 có 17:48:46Z (poll #5 đã nhận T5 PASS) nhưng load5
  3,84 → 2,18 vẫn >2 tới poll #10. Cửa KHÔNG MỞ (chỉ thiếu
  load5).
- **CỬA MỞ #1 — poll #11 (17:53:23Z):** load1 0,77, load5
  1,98, RAM 4921 MB, gate0=T5, lock=khong, blockers=0, apt=0,
  dpkg 768, tree=YES → **CHẠY attempt1 NGAY**.
- **Giai đoạn 2 — T0 giữ lock + O8 (poll #12–#19,
  17:57:41–18:03:00Z):** poll #12 (retry-wait sau attempt1)
  load1 1,83/load5 2,24; poll #13–#16 lock=co
  (thread=t0-round186, pid 115134, port 5560, ticket
  1-17955431015 = 17:58:21Z) + blockers 4/5/5/1; poll #16
  load1 4,76; poll #17–#19 load5 2,83 → 2,25 — vẫn >2.
  Cửa KHÔNG MỞ.
- **CỬA MỞ #2 — poll #20 (18:03:45Z):** load1 0,83, load5
  1,98, RAM 3523 MB, gate0=T5, lock=khong, blockers=0 →
  **CHẠY attempt2 NGAY**.
- **CỬA MỞ #3 — poll #21 (18:08:03Z, chỉ 1 poll sau attempt2):**
  load1 1,56, load5 1,84, RAM 3921 MB, gate0=T5, lock=khong,
  blockers=0 → **CHẠY attempt3 NGAY** (analyzer attempt2 xong
  18:08:03.858Z — trước marker attempt3 18:08:04.434Z 576 ms,
  không chồng lấn).
- **0 reboot trong phiên đo.** Poller thoát 18:13:11Z sau khi
  hết ngân sách 3/3 (không chạm hạn cắt 19:30Z).
- **Phân rã 23 poll thật:** RAM≥1024: 23/23; RAM 500–1023:
  0/23; RAM<500: **0/23**. load1<2: 11/23; load5<2: 6/23.
  **Stats "gan-mo" đếm 4 nhưng chỉ 3 lần mở cửa thật** (#11,
  #20, #21) — poll #14 đủ load/RAM nhưng thiếu lock+blockers
  (xem F-186-T4-4). gate0: T5 17/23 + khong-dat 6/23
  (4 poll thật + 2 test). blockers>0: 4 poll (toàn lúc T0
  giữ lock). apt>0: 3 poll (toàn lúc T5 repair).

## 2. Attempt — 3 attempt, 0 hợp lệ (ngân sách dùng 3/3)

- **attempt1-cea79500, 17:53:23–17:57:03Z (3'40"), 20/20
  pass — BỊ LOẠI (B2 VI PHẠM).** JSON
  `preview-b-f3-flip-webkit-t4-attempt1-cea79500.json`
  2.815.189 B, passes=20, pageErrs=[]. **tickCost total n=512
  median=60,0 p90=92,0 max=180 min=31** (đúng bar 60,0 —
  không cứu được vì B2 vi phạm); hậu flip+2000ms n=376
  median=59,0; tBlend gap n=408 median=106,0 p90=180,6
  max=2262; BlendTick/pass=20,4; rAF/pass median=30 (min 25,
  max 40); webkit=27,2; pageErrs=[]; flip afterPass=5
  wallMs=29920.
- **Per-pass median attempt1:** 57,5 / 67,5 / 61,0 / 73,0 /
  65,0 / 55,0 / 64,5 / 58,0 / 66,5 / 57,0 / 58,0 / 68,0 /
  72,0 / 42,5 / 45,0 / 57,0 / 77,0 / 44,0 / 62,5 / 59,0
  (load1/pass 1,03 → 5,04; RAM/pass 4063 → 3373 MB).
- **Lớp B attempt1 VI PHẠM** (`classb-t4-attempt1-cea79500.txt`,
  17:57:03Z): sampler n=105, load1_max=5,04, RAM_min=3373 MB,
  RAM_max=4899 MB, **0 mẫu RAM<500 MB**, 0 mẫu RAM<1024 MB;
  load5 lúc kết thúc 2,19; boot lúc bắt đầu = boot hiện tại
  17:19:50Z; apt/dpkg thật lúc đánh giá (pgrep -x) = 0;
  **dpkg.log: trước=768, hiện tại=768, delta-trong-cửa-sổ=0**;
  ps-before/after exact-comm apt/dpkg = 0. B1 ĐẠT (load5 cuối
  2,19 ≤ 2,5); **B2 VI PHẠM (load1 max 5,04 > 4 — burst
  tự-tải, xem §3/F-186-T4-2)**; B3 ĐẠT (không reboot); B4 ĐẠT
  (pgrep -x=0, ps exact-comm=0, dpkg delta=0); B5 ĐẠT (RAM
  min 3373 MB, 0 mẫu <500 MB).
- **(c2) attempt1 0 seq — KHÔNG ĐÁNH GIÁ P1/P2/P3-A1/P3'/P7:**
  stall analyzer: 0 seq (tick hậu-flip n=304, baseline
  P(stall≥2)=89/303); coverage-check 0/0; labellag (b)
  0 occurrence / 0 event.
- **attempt2-cea79500, 18:03:45–18:07:23Z (3'38"), 20/20
  pass — BỊ LOẠI (median 68,0 > 60).** JSON 2.654.242 B,
  passes=20, pageErrs=[]. **tickCost total n=483 median=68,0
  p90=93,8 max=160 min=31**; hậu flip+2000ms n=356
  median=65,0; tBlend gap n=387 median=112,0 p90=195,8
  max=2061; BlendTick/pass=19,4; rAF/pass median=28 (min 25,
  max 32); webkit=27,2; pageErrs=[]; flip afterPass=5
  wallMs=29875.
- **Per-pass median attempt2:** 82,0 / 74,0 / 74,5 / 66,0 /
  68,0 / 60,5 / 65,0 / 47,0 / 70,0 / 71,0 / 67,0 / 59,0 /
  70,5 / 54,5 / 65,0 / 64,0 / 79,5 / 69,0 / 64,0 / 84,0
  (load1/pass 1,56 → 2,36; RAM/pass 2889 → 2258 MB).
- **Lớp B attempt2 ĐẠT 5/5** (`classb-t4-attempt2-cea79500.txt`,
  18:07:23Z): sampler n=104, load1_max=2,91, RAM_min=2233 MB,
  RAM_max=3452 MB, **0 mẫu RAM<500 MB**, 0 mẫu RAM<1024 MB;
  load5 lúc kết thúc 1,82; **dpkg.log: trước=768, hiện tại=
  768, delta-trong-cửa-sổ=0**; ps-before/after exact-comm
  apt/dpkg = 0. B1–B5 đều ĐẠT. **0 spike T9 trong cửa sổ
  attempt2** (load1 < 3,0 suốt). Attempt2 chỉ thiếu MỖI
  median tickCost (68,0 > 60) nên vẫn bị loại.
- **(c2) attempt2 0 seq — KHÔNG ĐÁNH GIÁ P1/P2/P3-A1/P3'/P7:**
  stall analyzer: 0 seq (tick hậu-flip n=287, baseline
  P(stall≥2)=93/286); coverage-check 0/0; labellag (b)
  0 occurrence / 0 event.
- **attempt3-cea79500, 18:08:04–18:11:49Z (3'45"), 20/20
  pass — BỊ LOẠI (B1+B2 VI PHẠM).** JSON 2.484.946 B,
  passes=20, pageErrs=[]. **tickCost total n=434 median=79,0
  p90=101,0 max=196 min=30**; hậu flip+2000ms n=305
  median=77,0; tBlend gap n=344 median=119,0 p90=202,0
  max=3404; BlendTick/pass=17,2; rAF/pass median=26 (min 22,
  max 36); webkit=27,2; pageErrs=[]; flip afterPass=5
  wallMs=33451.
- **Per-pass median attempt3:** 65,5 / 85,5 / 82,0 / 76,0 /
  85,0 / 83,0 / 79,0 / 84,0 / 78,0 / 75,0 / 72,0 / 69,0 /
  71,0 / 68,0 / 70,0 / 66,0 / 74,0 / 77,0 / 71,0 / 56,0
  (load1/pass 1,82 → 6,13; RAM/pass 3691 → 2915 MB).
- **Lớp B attempt3 VI PHẠM** (`classb-t4-attempt3-cea79500.txt`,
  18:11:49Z): sampler n=107, load1_max=6,24, RAM_min=2882 MB,
  RAM_max=4025 MB, **0 mẫu RAM<500 MB**, 0 mẫu RAM<1024 MB;
  load5 lúc kết thúc **2,52**; **dpkg.log: trước=768, hiện
  tại=768, delta-trong-cửa-sổ=0**; ps-before/after exact-comm
  apt/dpkg = 0. **B1 VI PHẠM (load5 cuối 2,52 > 2,5 — chỉ
  +0,02, sát biên; xem F-186-T4-7)**; **B2 VI PHẠM (load1
  max 6,24 > 4 — burst tự-tải, xem §3)**; B3 ĐẠT; B4 ĐẠT;
  B5 ĐẠT (RAM min 2882 MB).
- **(c2) attempt3 1 seq — CHỈ GHI NHẬN, KHÔNG ĐẾM (attempt bị
  loại):** seq 110 (stall 4, labelMs=35026, prev=34221) —
  P3' DAT 1/1, coverage 1/1 (log gần nhất +36 ms, blendTick
  hậu-flip trong ±500 ms của log: 239/239 = 100,0%); P1 YẾU
  1/1 (baseline 93/239, p=0,389 — n=1 < 3, không kết luận);
  P3-A1 YẾU 0/1 (baseline 66/238, p=1 — seq 110 KHÔNG đóng
  băng-tại-tick); P2 không đánh giá (n=1); P7 ĐÚNG (c2 drawSrc
  delta {-1: 5, 0: 1}; đối chứng toàn bộ drawSrc post:
  {-1: 175, 0: 129}, 0/304 entry trễ ≥+1f); labellag (b)
  0 occurrence / 0 event.
- **Không attempt nào bị reboot giết; 0 retry còn lại.**
  Ngân sách **3/3 đã dùng hết**.

## 3. B2 spike / đối chiếu sampler T9 + O8 T0

- **KIỂM B2 — CẢ 3 ATTEMPT ĐỀU CÓ BURST TỰ-TẢI, 2 LẦN VƯỢT
  BAR 4:** attempt1: 17 spike T9 (17:54:06–17:55:28Z, load1
  3,16–5,04; đỉnh 5,04 lúc 17:54:52Z); attempt2: 0 spike
  (load1_max 2,91); attempt3: 31 spike (18:08:32–18:11:xxZ,
  load1 3,32–6,24; đỉnh 6,24 lúc 18:09:44Z).
  **Đầu bảng mọi spike đỉnh đều là process CỦA CHÍNH ATTEMPT:**
  attempt1 đỉnh 5,04: WebKitWebProces 72,1% (pid 112206) +
  MiniBrowser 33,6% + MainThread + Xvfb; attempt3 đỉnh 6,24:
  WebKitWebProces 64,0% (pid 121437) + MiniBrowser 28,8% +
  hatch 13,9% + Xvfb. **0 process phân tích nặng của luồng
  khác** trong cả 3 cửa sổ (ps-before/after chỉ có vite của
  chính attempt + 2 vòng lặp shell nhẹ `sleep 30` của T6
  chờ harness — không đốt CPU). B2 vẫn VI PHẠM vì luật B2
  hiện hành chỉ xét load1_max ≤ 4, không phân biệt nguồn tải
  (xem F-186-T4-2).
- **O8 T0 TRÊN BOOT #107 — PASS 3/3 (theo T0-186.done 18:07Z):
  WebKit 21/21 ×2 + Chromium 21/21, 17:58:21–18:01:22Z, sau
  cờ POSTBOOT_PASS #107 9m35s; libevent heal lần 2 (vắng
  17:41Z → có 17:50Z sau replay). 0 giây chồng lấn với attempt
  T4** (O8 chạy trong giai đoạn retry-wait giữa attempt1 và
  attempt2; poll #13–#16 trong cửa sổ O8 đều ghi lock=co
  thread=t0-round186 + blockers → cửa yên KHÔNG mở; poll #17
  (18:01:29Z, sau khi O8 xong) lock=khong).
- **O8 T8 TRÊN BOOT #107 — CHƯA CÓ (T8-186 chưa đóng cờ lúc
  T4 đóng).** Chân O8 T8 + harness thuộc T8-186 báo cáo.
- **Ghi trong cửa sổ attempt: KHÔNG CÓ.** `run-analyzers-186.sh`
  chạy NGOÀI cửa sổ attempt cả 3 lần (xem kiểm chứng live
  lần 6, §6, F-186-T4-6). File `hidden_files/round109-k7/
  analyze-k7-skiplatest.txt` mtime vẫn 2026-11-23 18:13:20Z
  (đợt 179) — 0 ghi mới.

## 4. Replay/postboot — POSTBOOT_PASS #107 ĐÃ CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat — đề xuất)

- **Boot cea79500 (btime 17:19:50Z, số hiệu #107 — T0-186
  XÁC NHẬN 9 nguồn tươi; #106 CHƯA XÁC MINH, F-186-T0-1).**
- **POSTBOOT_PASS #107 ĐÃ CÓ 17:48:46Z** (boot+28m56s;
  watcher-186, **mode repair-sớm-quyết-h, poll=1, CÓ caveat
  repair — đề xuất T5-186, tiền lệ #101/#98/#96**; cờ 315 B;
  dpkg 768 dòng; cache 107 .deb; lists 75; verify độc lập
  exit 0 lúc 17:48:46Z; cờ cũ #104 lưu POSTBOOT_PASS-9161bfd1).
  Gate0=T5 từ poll #5 (17:48:51Z). Check-only của T4 KHÔNG
  PASS lần nào (PB=1 tới poll #4 — replay chưa xong; từ poll
  #5 gate0 đi qua cờ T5).
- **POSTBOOT_PASS #105 CHƯA CÓ — T5-186 KHÔNG THỬ REPAIR**
  (tổng boot không cờ 23 → 24 nếu parent chấp nhận; tiền lệ
  #103/#100; T0-186 xác nhận grep 0 file).
- **0 REBOOT trong cửa sổ attempt; 0 REBOOT trong phiên đo.**
  Số hiệu #107 đã xác nhận (T0-186); (m) #106/#107 + INSIDE
  #106/#107 thuộc T2-187; #107 có giết holder không thuộc
  T6-186 phán cuối; POSTBOOT_PASS #107 CÓ — nhưng **KHÔNG
  CÓ chân lượt yên** nên chuỗi FULL PASS không hoàn thành
  đợt này (parent quyết cuối).
- **Run 185 SUCCEEDED 14:31:59Z (+232 s) + run 186 SUCCEEDED
  14:52:42Z** (theo T0-186.done; claimed→finished 94 s /
  128 s — **2 ỨNG VIÊN CA ≥60 s mới**, T7-186 phán cuối).
- **Scheduler gap 15:15:34Z–17:35:40Z = 8.406 s, tái diễn giống
  hệt OUTAGE 179** (theo T0-186.done — nợ host-side, T7-186
  theo dõi).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-186 báo cáo.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND186_T4_WEBKIT_QUIET55_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round186-t4/`):**
  `poll-wait-t4-186.sh` (md5 `4efe582b…`, deadline 19:30Z
  24/11 + cờ T5 round186-t5/ + fallback round185-t5/),
  `run-attempt-186.sh` (md5 `54301619…`, lượt yên #55),
  `run-analyzers-186.sh` (md5 `ccffdd8d…`, chạy classb + 9
  analyzer NGOÀI cửa sổ attempt; đợt này ĐÃ CHẠY 3 lần:
  17:57:03–17:57:41Z, 18:07:23–18:08:03Z, 18:11:49–18:12:16Z),
  `distinct-seq-186.py` (md5 `26cafda0…`, helper đọc sổ;
  đợt này KHÔNG dùng live vì không có lượt hợp lệ — sổ
  giữ as-of-185). **KHÔNG stage lại probe**
  (`probe121t3-ghost-k7.webkit.mjs` — byte-identical với
  bản đã stage đợt 148–185, md5 `4291e539...`) và **KHÔNG
  stage lại `t4-attempt-inner.sh` / `check-classb-t4.sh`**
  (bản làm việc ở `hidden_files/round186-t4/` — theo đúng
  mẫu 149–185: chỉ stage 4 script trên). **`b.json` KHÔNG
  stage** (file spec làm việc, md5 `078938cf...`, giống hệt
  bản đợt 156–185).
- **Script làm việc (hidden_files, không stage):**
  5 script T4 (`poll-wait`/`run-attempt`/`run-analyzers`/
  `t4-attempt-inner` — W = round186-t4 + glob chéo round185-* /
  `check-classb-t4` — đếm sampler n chỉ dòng `boot=`),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-186.py` (thống kê §A;
  footer CỘNG DỒN GIỮ NGUYÊN 47 lượt),
  `distinct-seq-186.py` (helper đọc sổ — KHÔNG dùng live đợt
  này), `distinct-seq-ledger.json` (SỔ distinct-seq, GIỮ
  as-of-185: 137/140 distinct, occ 174/186, valid_rounds_p3
  35, non_dat [260, 364, 498], md5 `cd5410cc…` — KHÔNG thăng
  cấp vì không có lượt hợp lệ),
  `preflight-186.txt` + `preflight-postboot-186.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2),
  `NOTE-attempt1-discarded.md` (ghi chú chẩn đoán attempt1).
- **Log/evidence (hidden_files/round186-t4/, không stage):**
  `poll-t4.log` (21 poll trên #107 + 3 lần CUA YEN MO +
  HET NGAN SACH 3/3), `poll-t4.nohup.log` (1 instance),
  `poll-test-186.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + 3 lần CUA YEN MO + 3 lần
  analyzers + HET NGAN SACH, poller thoát),
  `postboot-t4-186-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-186-output.txt` (output stats-186.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll #13–#16),
  3 JSON attempt (2.815.189 / 2.654.242 / 2.484.946 B —
  KHÔNG stage),
  `analyze-t4-attemptN-cea79500-*.txt` (9 analyzer × 3
  attempt) + `p1p3p7-attempt3-cea79500.txt` (P1/P3-A1/P7
  attempt3 — chạy tay sau poller, chỉ ghi nhận),
  `classb-t4-attemptN-cea79500.txt` (B attempt1 VI PHẠM,
  attempt2 ĐẠT 5/5, attempt3 VI PHẠM),
  `coverage-check-attemptN-cea79500.txt` (0/0, 0/0, 1/1),
  `attempt-done-attemptN-cea79500` (ngân sách 3/3),
  `load-mid-t4-attemptN-cea79500.log` (sampler n=105/104/107),
  `run-webkit-t4-attemptN-cea79500.log`,
  `ps-before/after-t4-attemptN-cea79500.txt` (sạch — chỉ
  vite của chính attempt + vòng lặp shell nhẹ của T6).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  18:13:11Z; 0 vite; 0 Xvfb; 0 MiniBrowser/WebProcess;
  X11 chỉ còn socket X193 mồ côi — xem F-186-T4-5).

## 6. Sai số F-186-T4-1..7 (+ nợ cũ)

- **F-186-T4-1 — COPY-FORWARD: 2 CHUỖI STALE SÓT SAU LẦN SỬA
  ĐẦU (GHI NHẬN — DẠNG NHẸ F-185-T4-1).** Grep kiểm lần 2/3
  bắt thêm 2 chuỗi: comment T5FLAG `(uu tien round185-t5, du
  phong round184-t5)` dòng 153 + tên file log
  `postboot-t4-185-gate0wait` dòng 168 trong poll-wait.
  Sửa TRƯỚC pre-flight; grep lần 3 sạch. Không ảnh hưởng vận
  hành (1 comment + 1 tên file log). Bài học: mẫu grep phải
  rộng hơn cả tên file — đợt này mẫu cũ đã bắt được 2 chuỗi
  nhờ kiểm cả `185` lẻ.
- **F-186-T4-2 — B2 VI PHẠM DO BURST TỰ-TẢI, 2/3 ATTEMPT
  (MỚI — NẶNG HƠN F-185-T4-5).** Attempt1 load1_max 5,04 +
  attempt3 load1_max 6,24 — đầu bảng spike toàn process của
  chính attempt (WebKitWebProcess 64–72%), 0 process nặng
  luồng khác. Luật B2 hiện hành không phân biệt tự-tải/lạ-tải
  nên attempt vẫn bị loại — ĐÚNG LUẬT, không tự đổi luật.
  Đề xuất parent/T10 xem xét: có nên tách B2 thành (i) bar
  load1_max cho tải lạ vs (ii) bar riêng/đánh giá riêng cho
  burst render tự-tải (ví dụ: tự-tải vượt bar nhưng median
  vẫn ≤ 60 thì giữ?) — quyết ở §8, không phải việc T4.
- **F-186-T4-3 — TICKCOST MEDIAN VƯỢT BAR CẢ 3 ATTEMPT, LEO
  DẦN 60,0 → 68,0 → 79,0 (MỚI).** Cả 3 đều ≥ max 60,0 ms
  của chuỗi 47 lượt hợp lệ; attempt2 B 5/5 nhưng median 68,0
  nên vẫn loại. Boot #107 chậm/nhiễu hơn hẳn #104 (median
  45,0 đợt 185). Chưa rõ nguyên nhân (load ngoài attempt
  thấp ở attempt2: load1 1,56–2,36; RAM ≥ 2233 MB — không
  phải do tải ngoài hay RAM thấp). Theo dõi đợt 187: nếu
  #108 median trở lại ~45 thì do boot #107; nếu vẫn cao thì
  xem lại ngưỡng 60 ms hoặc tình trạng máy.
- **F-186-T4-4 — STATS "gan-mo" ĐẾM 4 NHƯNG CHỈ 3 LẦN MỞ CỬA
  THẬT (MỚI — DẠNG NHẸ F-183-T4-6).** Script stats đếm poll
  đủ load1<2 + load5<2 + RAM≥1024 (proxy, không xét
  lock/blockers/gate0): poll #14 đủ 3 điều kiện nhưng cửa
  đóng vì T0 giữ lock + blockers=5. Chỉ là cách đếm proxy,
  không ảnh hưởng verdict (3 lần mở cửa thật #11/#20/#21
  đều khớp log CUA YEN MO).
- **F-186-T4-5 — SOCKET X193 CÒN LẠI SAU ATTEMPT (TÁI DIỄN
  F-185-T4-6).** `/tmp/.X11-unix/` lúc đóng còn socket X193
  (mtime 18:08Z — Xvfb :193 của attempt3); 0 Xvfb thật lúc
  đóng (ps). Socket mồ côi, không ảnh hưởng đo (attempt đã
  xong trước khi Xvfb thoát). Ghi nhận; lần sau kiểm tra dọn
  socket Xvfb của attempt sau khi poller thoát.
- **F-186-T4-6 — QUYẾT (p) KIỂM CHỨNG LIVE LẦN 6: ĐẠT
  (MỚI — F-185-T4-7 ĐÃ HẾT).** 3 cửa sổ attempt: #1
  17:53:23.304Z (marker) → 17:57:03.299Z (attempt-done);
  #2 18:03:45.787Z → 18:07:23.455Z; #3 18:08:04.434Z →
  18:11:49.003Z. Mtime sớm nhất của 9 file analyzer + classb
  mỗi attempt đều SAU attempt-done: #1 classb 17:57:03.451Z
  (+152 ms), c2drawlog +273 ms; #2 classb +232 ms, c2drawlog
  +330 ms; #3 classb +195 ms, c2drawlog +300 ms; mtime muộn
  nhất #1 17:57:41.051Z, #2 18:08:03.858Z, #3 18:12:16.451Z.
  **0 file analyzer ghi trong cả 3 cửa sổ attempt.**
  File skiplatest mặc định mtime vẫn 2026-11-23 18:13:20Z —
  0 ghi mới. Kiểm chứng live lần 6 (179: lần 1 dời; 180–182
  dời; 183: lần 3 ĐẠT; 184: lần 4 ĐẠT; 185: lần 5 ĐẠT; lần
  này lần 6 ĐẠT).
- **F-186-T4-7 — B1 VI PHẠM SÁT BIÊN (MỚI — NHẸ).** Attempt3:
  load5 lúc kết thúc 2,52 > bar 2,5 chỉ +0,02 — dư âm load1
  của chính attempt (load1_max 6,24) kéo load5 lên cuối lượt.
  Ghi nhận; B1 vốn nhạy với dư âm tải của chính attempt (cùng
  gốc với F-186-T4-2).
- **F-185-T4-1 — TÁI DIỄN DƯỚI DẠNG NHẸ HƠN F-186-T4-1**
  (2 chuỗi stale — bắt được trước pre-flight).
- **F-185-T4-2 — KHÔNG TÁI DIỄN** (1 luồng T4 duy nhất).
- **F-185-T4-3 — KHÔNG CÓ ĐIỂM DỮ KIỆN MỚI HỢP LỆ** (không có
  lượt hợp lệ đợt này; attempt3 bị loại có P3-A1 YẾU 0/1 —
  chỉ ghi nhận, không đếm — xem §2).
- **F-185-T4-4 — KHÔNG TÁI DIỄN.** Labellag (b) lag≥+5f:
  **0 occurrence / 0 event cả 3 attempt** (đợt 184: 6 occ;
  đợt 185: 8 occ — chuỗi 2 đợt liên tiếp >0 ĐỨT).
- **F-185-T4-5 — TÁI DIỄN DƯỚI DẠNG NẶNG HƠN F-186-T4-2**
  (burst tự-tải vượt bar 4 → loại 2 attempt).
  **F-185-T4-6 — TÁI DIỄN DƯỚI DẠNG F-186-T4-5** (socket X193
  còn lại sau attempt — lần này do attempt3 tạo).
  **F-185-T4-7 — ĐÃ HẾT (xem F-186-T4-6 — kiểm chứng live
  lần 6 ĐẠT).**
- **F-184-T4-1 — TÁI DIỄN DƯỚI DẠNG F-186-T4-1.
  F-184-T4-2 — KHÔNG TÁI DIỄN.** RAM <500 MB: 0/23 poll.
  **F-184-T4-3 — KHÔNG TÁI DIỄN** (labellag (b) 0 occ).
  **F-184-T4-4 — KHÔNG TÁI DIỄN** (0 reboot trong phiên đo).
  **F-184-T4-5 — ĐÃ HẾT (xem F-186-T4-6). F-184-T2-8 —
  KHÔNG TÁI DIỄN PHÍA T4** (0 chồng tải lạ; các spike đều
  tự-tải, ps-before/after sạch).
- **F-183-T4-1 — TÁI DIỄN DƯỚI DẠNG NHẸ HƠN F-186-T4-1.
  F-183-T4-2 — TÁI DIỄN DƯỚI DẠNG F-186-T4-5. F-183-T4-3 —
  KHÔNG TÁI DIỄN** (py_compile 12 file). **F-183-T4-4 — TÁI
  DIỄN DƯỚI DẠNG BÌNH THƯỜNG** (T0 giữ lock polls #13–#16).
  **F-183-T4-5 — ĐÃ HẾT (xem F-186-T4-6). F-183-T4-6 — TÁI
  DIỄN DƯỚI DẠNG F-186-T4-4** ("gan-mo" = 4, chỉ 3 lần mở
  cửa thật). **F-183-T4-7 — KHÔNG TÁI DIỄN** (spike đều
  tự-tải).
- **F-182-T4-1 — KHÔNG TÁI DIỄN** (0 reboot). **F-182-T4-4 —
  ĐÃ HẾT** (#107 CÓ POSTBOOT_PASS, CÓ caveat — đề xuất).
  **F-181-T4-3 — KHÔNG TÁI DIỄN. F-181-T4-6 — CÓ SỐ MỚI:**
  chuỗi median 47 lượt GIỮ NGUYÊN (mean 47,6, max 60,0).
  **F-181-T4-7 — KHÔNG ÁP DỤNG** (sampler đếm đúng).
  **F-181-T4-8 — KHÔNG ÁP DỤNG** (p90 92,0/93,8/101,0 ms —
  không có bar p90). **F-179-T4-5 — ĐÃ HẾT (xem F-186-T4-6).
  F-178-T4-1 — KHÔNG TÁI DIỄN** (spike đều tự-tải).
  **F-177-T4-4 — KHÔNG TÁI DIỄN. F-177-T4-6 — TÁI DIỄN DƯỚI
  DẠNG F-186-T4-1. F-176-T4-1 — KHÔNG TÁI DIỄN** (0 vi phạm
  theo T4). **F-176-T4-2 — KHÔNG TÁI DIỄN** (sampler n=104–
  107). **F-175-T4-1 — KHÔNG TÁI DIỄN** (`tree-md5.txt`
  còn nguyên). **F-175-T4-2 — KHÔNG TÁI DIỄN** (0 ghi
  analyzer trong cả 3 cửa sổ attempt). **F-175-T4-3 — TÁI
  DIỄN DƯỚI DẠNG BÌNH THƯỜNG** (T0 giữ lock #13–#16).
  **F-175-T4-5 — KHÔNG TÁI DIỄN** (0 reboot).
  **F-174-T4-1 — KHÔNG ÁP DỤNG** (p1p3p7 chạy tay — chỉ ghi
  nhận). **F-174-T4-3 — KHÔNG TÁI DIỄN** (kiểm process lúc
  đóng dùng `ps`). **F-174-T4-4 — KHÔNG ÁP DỤNG** (p1p3p7
  attempt3 — P1/P3-A1 YẾU, P7 ĐÚNG; attempt bị loại).
  **F-174-T4-6 — KHÔNG TÁI DIỄN** (RAM <500 MB: 0/23 poll).

## 7. P3' cộng dồn (GIỮ NGUYÊN — 47 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 186 (GIỮ NGUYÊN, không có lượt hợp lệ
  mới): P1 210/214, P2 205/205, P3-A1 182/214, P3' 174/186
  occurrence = 137/140 distinct-seq, P7 108/108** (47 lượt
  hợp lệ — #55 KHÔNG CÓ lượt hợp lệ nên không cộng thêm seq
  nào; 3 attempt bị loại đều không đếm). Cơ sở: cộng dồn chỉ
  tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #55: 0 seq** (attempt1/attempt2 (c2)=0 seq;
  attempt3 (c2)=1 seq 110 nhưng attempt bị loại — chỉ ghi
  nhận: P3' DAT 1/1, coverage 1/1, P1 YẾU, P3-A1 YẾU 0/1,
  P7 ĐÚNG — xem §2). Helper `distinct-seq-186.py` KHÔNG
  dùng live đợt này (không có lượt hợp lệ để cộng).
- **Sổ distinct-seq GIỮ as-of-185** (137/140 distinct, occ
  174/186, valid_rounds_p3 35, non_dat [260, 364, 498], md5
  `cd5410cc…`) — KHÔNG thăng cấp.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (không có dữ kiện mới hợp lệ đợt này;
  attempt3 bị loại nhưng seq 110 vẫn P3' DAT + P7 ĐÚNG —
  không đổi verdict; P3-A1 YẾU 0/1 trong attempt bị loại
  không đếm — theo dõi P3-A1 đợt sau, khi có lượt hợp lệ).
- Chuỗi median tickCost 47 lượt (GIỮ NGUYÊN — không thêm số
  mới): 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 ms
  (tổng 2238,0; trung bình 47,6 ms; min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60). **Median 3 attempt bị loại đợt này
  (60,0 / 68,0 / 79,0) KHÔNG vào chuỗi.**

## 8. Chờ quyết parent / nợ đợt 187

- **(a) #55 KHÔNG CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ
  47 → 0 (ĐỨT).** Chân lượt yên cho chuỗi FULL PASS **KHÔNG
  CÓ đợt này** — chuỗi FULL PASS đợt 185 lên 1 thì đợt này
  về 0 (parent quyết cuối — còn chờ chân O8 T8 + harness
  của T8-186).
- **(b) P3' cộng dồn GIỮ NGUYÊN 47 lượt: P1 210/214, P2
  205/205, P3-A1 182/214, P3' 174/186 = 137/140, P7 108/108:**
  sổ distinct-seq giữ as-of-185 md5 `cd5410cc…` (không thăng
  cấp). **Chờ parent/T10 quyết:** ghi nhận cộng dồn giữ nguyên.
- **(c) BOOT cea79500 (số hiệu #107) — T0-186 ĐÃ XÁC NHẬN 9
  nguồn tươi (btime 17:19:50Z).** **(m) #106/#107 + INSIDE
  #106/#107 thuộc T2-187** (#106 CHƯA XÁC MINH, F-186-T0-1);
  **#107 có giết holder không thuộc T6-186 phán cuối.**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale-string lần 2/3 bắt được 2 chuỗi
  sót (F-186-T4-1 — sửa trước pre-flight); gate0 ĐÃ ĐẠT lúc
  mở poller qua T5 từ poll #5 (cờ T5 có 17:48:46Z).
- **(e) POSTBOOT_PASS #107 ĐÃ CÓ (17:48:46Z,
  repair-sớm-quyết-h, poll=1, CÓ caveat — đề xuất): GHI NHẬN.
  POSTBOOT_PASS #105 CHƯA CÓ — T5-186 KHÔNG THỬ REPAIR;
  tổng boot không cờ 23 → 24 nếu parent chấp nhận (tiền lệ
  #103/#100).** Hướng (3) VẪN ĐỨNG lần 33 (theo T5-186).
- **(f) RAM <500 MB: 0/23 poll (min 3523 MB).** Không có
  attempt nào chạy trên RAM thấp. Giao T9-186 đối chiếu
  balloon trên #107 (RAM avail dao động mạnh 1.006–6.507 MB
  trong phiên; RAM giảm ~1.000 MB trong mỗi attempt).
- **(g) (m) #105 (T2-186); (m) #56 lần 29 (T2-186); mù
  #96?/#95?/#94?/#88?/#77? (T2-186); V2 phương án chính
  (T8-186); B2 MỞ TỪ ĐỢT 186 (T8-186); 84l10 + Q3 (T8-186);
  run 185/186 SUCCEEDED — 2 ỨNG VIÊN CA mới (T7-186 phán);
  scheduler gap 8.406 s tái diễn giống OUTAGE 179 (T0-186);
  #107 giết holder? (T6-186 phán); prune lần 61 (T6-186);
  checklist (o) (T8-186); H3 chỉ giám sát thụ động; birefnet
  0 thử lần 40; nhắc mọi luồng: KHÔNG script nặng / KHÔNG
  probe dpkg trong cửa sổ attempt (0 chồng tải lạ — spike
  B2 đều tự-tải); u2net là fallback; ci-security.yml 403
  chờ user; TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B2 CÓ TẢI TRONG CỬA SỔ ATTEMPT NHƯNG TOÀN TỰ-TẢI**
  (load1_max 5,04 / 6,24; dpkg delta 0, apt/dpkg 0 — xem §3).
  Đề xuất parent/T10 xem xét tách luật B2 (tự-tải vs lạ-tải)
  — xem F-186-T4-2; T4 KHÔNG tự đổi luật.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 3 lần đợt này
  (3 attempt, 0 hợp lệ) → **KHÔNG có lượt yên hợp lệ #55
  cho chuỗi FULL PASS.** T8 tự quyết O8 đợt này (O8 T0 trên
  #107 PASS 3/3 — 17:58:21–18:01:22Z, 0 chồng attempt;
  O8 T8-186 thuộc T8-186 báo cáo).
- **(j) F-186-T4-1 (2 chuỗi stale — sửa trước pre-flight);
  F-186-T4-2 (B2 vi phạm do burst tự-tải 2/3 attempt);
  F-186-T4-3 (median vượt bar cả 3 attempt, leo dần
  60,0 → 68,0 → 79,0); F-186-T4-4 (stats "gan-mo" đếm 4,
  chỉ 3 lần mở cửa thật); F-186-T4-5 (socket X193 còn lại
  sau attempt); F-186-T4-6 (quyết (p) kiểm chứng live lần 6
  ĐẠT); F-186-T4-7 (B1 vi phạm sát biên +0,02).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-186.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-186.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-24T17:45:34Z - 2026-11-24T17:45:37Z, boot=cea79500
   RAM min=5152 max=5362 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 0/2 blockers>0: 0 apt>0: 0
   gate0: khong-dat=2
   lock: khong=2
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 21 poll, 2026-11-24T17:45:49Z - 2026-11-24T18:08:03Z, boot=cea79500
   RAM min=3523 max=6507 >=1024: 21/21 500-1023: 0/21 <500: 0/21
   load1<2: 11/21 load5<2: 4/21 blockers>0: 4 apt>0: 3
   gate0: T5=17, khong-dat=4
   lock: co=4, khong=17
   dpkg 2->768
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 23
-- RAM toan phien: min=3523 max=6507 >=1024: 23/23 <500: 0/23
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 4/23
   gan-mo? #11 2026-11-24T17:53:23Z boot=cea79500 RAM=4921 L1=0.77 L5=1.98 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #14 2026-11-24T17:59:13Z boot=cea79500 RAM=4339 L1=1.21 L5=1.97 blk=5 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #20 2026-11-24T18:03:45Z boot=cea79500 RAM=3523 L1=0.83 L5=1.98 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #21 2026-11-24T18:08:03Z boot=cea79500 RAM=3921 L1=1.56 L5=1.84 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot cea79500: 23 poll; RAM>=1024 lan cuoi: 2026-11-24T18:08:03Z #21; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 47 luot hop le): P1 210/214 P2 205/205 P3-A1 182/214 P3' 174/186 occ = 137/140 distinct-seq P7 108/108
-- chuoi median 47 luot: n=47 mean=47,6 min=39,0 max=60,0 vuot-60: 0
```
