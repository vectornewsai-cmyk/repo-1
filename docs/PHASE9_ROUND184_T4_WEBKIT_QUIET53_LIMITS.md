# PHASE9_ROUND184_T4_WEBKIT_QUIET53_LIMITS.md

**Đợt:** 184. **Luồng:** T4 — đo lượt yên WebKit #53 trên 1 boot
+ **#53 CÓ LƯỢT HỢP LỆ — attempt2-6ecd948e: 20/20 + lớp B DAT 5/5
  + tickCost median 43,5 ms ≤ 60. CHUỖI LƯỢT YÊN HỢP LỆ 45 → 46.**
  Ngân sách dùng **2/3** (attempt1 NHIỄM TẢI, retry attempt2 sạch).
  Poller thoát exit 0 lúc 09:12:01Z — trước hạn cắt 10:30Z 1h17'59".
+ **BOOT ĐO: MỘT boot — 6ecd948e (#102, btime 07:07:05Z; T0-184
  XÁC NHẬN 9 nguồn, gap #101→#102 = 6.878 s). 0 reboot trong phiên đo.**
  Reboot #103 (e0921bda, btime 09:14:55Z, gap 7.670 s) xảy ra SAU khi
  poller thoát — KHÔNG ảnh hưởng #53 (số hiệu chờ T0-185).
+ **CỘNG DỒN MỚI (46 lượt hợp lệ): P1 205/209, P2 200/200,
  P3-A1 178/209, P3' 169/181 occurrence = 134/138 distinct-seq,
  P7 103/103.** Seq (c2) mới: 274, 325, 398, 425 (kiểm tay vắng thật
  trong sổ as-of-183); 299, 375 ĐÃ THẤY. Sổ distinct-seq as-of-184
  md5 `349e5c14` (lúc mở `b799edb8`).
**Ngày:** 24/11/2026 (lượt cron 15:35 +07 24/11 = 08:35:51Z).
**Boot đo:** 6ecd948e (28 poll: 2 test + 26 poller).

## 0. Verdict tổng

- **#53 CÓ LƯỢT HỢP LỆ (attempt2-6ecd948e).** Cửa yên mở poll #25
  (09:04:21Z): load1 1,48, load5 1,14, RAM 1088 MB, gate0=T5
  (POSTBOOT_PASS #102, 08:43:59Z, replay-đầy-đủ, poll=0, KHÔNG
  caveat), lock=khong, blockers=0, apt=0, dpkg 1461.
  Attempt1 chạy 09:04:22–09:07:51Z (3'29") — 20/20 nhưng **B2 VI
  PHẠM (load1_max 4,48)** do hole-recheck của T2 chồng lên cửa sổ
  attempt (F-184-T2-8, T2 tự báo) → NHIỄM TẢI, retry. Cửa mở lại
  poll #26 (09:08:13Z, RAM 2112 MB) → attempt2 chạy
  09:08:13–09:11:40Z (3'27"); analyzers chạy NGOÀI cửa sổ attempt
  09:11:40–09:12:01Z (quyết (p) đợt 179); poller thoát exit 0 lúc
  09:12:01Z. Ngân sách **2/3**.
- **Chuỗi lượt yên hợp lệ: 45 → 46.** Cộng dồn P1/P2/P3-A1/P3'/
  P7 MỚI như trên (xem §7). Chuỗi median tickCost 46 số
  (mean 47,7, min 39,0, max 60,0; 0 lượt vượt 60).
- **Điều kiện GIỮ NGUYÊN như #50 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 4: ĐẠT (xem §6,
  F-184-T4-5).** 0 file analyzer nào ghi trong cửa sổ attempt2
  (09:08:13.196–09:11:40.056Z); file skiplatest mặc định
  `round109-k7/analyze-k7-skiplatest.txt` mtime vẫn
  18:13:20Z (đợt 179) — 0 ghi mới.
- **0 VI PHẠM THEO T4 — NHƯNG CHUỖI 0 VI PHẠM GIỮ 0** (chuỗi đã
  VỀ 0 theo quyết (p) đợt 183 — F-183-T2-7 VI PHẠM NHẸ; đợt này
  có vi phạm MỚI F-184-T2-8 thuộc T2, chồng attempt thật và làm
  hỏng attempt1 — chuỗi KHÔNG lên 1; parent quyết cuối, xem §6).
  Phía T4 giữ sạch: không khởi động script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; mọi phân tích
  đều làm SAU khi poller thoát 09:12:01Z. Trong cửa sổ attempt
  T4 chỉ chạy probe + sampler của chính attempt.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, mọi poll đều tree=YES, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round184-t4.done` viết lúc đóng,
  CÓ NỘI DUNG, trong hạn cờ ~11:00Z; boot lúc đóng đã là
  e0921bda (#103 ứng viên — reboot 09:14:55Z, SAU khi poller
  thoát; lượt đo xong trên #102).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (08:45–08:46Z),
ghi vào `hidden_files/round184-t4/preflight-184.txt` — **PASS**
(0 sót; xem F-184-T4-1: 4 chuỗi stale bắt được ở lần grep thứ 2
+ sửa trước pre-flight). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–183:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq as-of-183 md5 `b799edb8…`
  (occ 163/175, distinct 130/134, valid_rounds_p3 33).
- **10/10 analyzer** có mặt (+ `run-analyzers-184.sh` —
  quyết (p)); `bash -n` OK 5 script
  T4 (poll-wait, run-attempt, run-analyzers, inner,
  check-classb); `py_compile` OK 12 file py; Playwright-core
  có mặt (webkit object — import tuyệt đối
  `/home/hatch/scratch-round63-r4/node_modules/playwright-core/
  index.mjs`, cùng đường dẫn probe dùng); media
  `stripes-nonperiodic.mp4` có mặt; không có
  `vite.lock`, không có `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-24
  10:30:00 UTC` → **1795516200** = 10:30Z (hạn cờ ~11:00Z =
  1795518000, hạn cứng 11:35Z = 1795520100); grep 0 hit cho
  `round182`/`07:30`/`08:00Z`/`08:35Z`/`04:30`/`05:00Z`/`05:35Z`/
  `round181`/`WebKit #52`/`T4-183`/`default=183`/`poll-test-183`
  trong 7 file mới; `round183` chỉ còn trong fallback T5FLAG +
  glob chống nhiễu (có chủ đích).
- **Copy-forward 183 → 184 (KHÔNG sed global — sửa bằng script
  python thay thế có neo từng chuỗi + kiểm lại bằng tay 2 lần,
  xem F-184-T4-1):** deadline `07:30Z` → `10:30Z`;
  hạn cờ/cứng `08:00Z`/`08:35Z` → `11:00Z`/`11:35Z`; T5FLAG
  chính `round184-t5/` + fallback `round183-t5/`; W trong 5
  script ĐÃ LÀ `round184-t4`; `T4-183a` → `T4-184a`;
  `default=183` → `default=184`; `WebKit #52` → `#53`;
  glob chống nhiễu `round182-*` → `round183-*`.
  (Grep stale-string lần 2 phát hiện 4 chuỗi sót — xem
  F-184-T4-1; sửa TRƯỚC pre-flight; grep lần 3 sạch.)
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 183); **`tree-md5.txt` KHÔNG có trong danh
  sách cleanup (F-175-T4-1 đã sửa) — còn nguyên, 530e10a7.**
- **Freeze check (F-164-T4-1):** `round183-t4` còn **0 file
  mtime ≥ 08:35:51Z** (giờ mở đợt 184).
- **GATE0 LÚC MỞ: ĐÃ ĐẠT TRÊN BOOT #102.** POSTBOOT_PASS
  round184-t5/ CÓ từ 08:43:59Z (replay-đầy-đủ, poll=0, KHÔNG
  caveat — T5-184.done 08:50Z); postboot check-only chạy tay
  **exit 0 PASS** (GST đủ isomp4 + libav; apt đủ 11 gói).
  dpkg.log 1461 dòng. T0-184 chưa đóng cờ lúc mở (T0-184.done
  08:52Z, sau khi pre-flight xong).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (08:45:58Z): RAM 1163 MB, load1 7,98/load5 3,05,
  gate0=T5, lock=co (t0-round184), blockers=5, apt=0, dpkg 1461.
  Lần 2 (08:46:02Z): RAM 1164 MB, load1 7,58/load5 3,05,
  gate0=T5, lock=co, blockers=5, apt=0, dpkg 1461. Cửa chưa mở
  vì load + lock — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket). F-183-T4-2: socket X193 đã
  wipe theo #102 — không còn.
- **RAM lúc mở 863 MB; load1 3,49 lúc mở** — cửa chỉ mở khi
  đủ mọi điều kiện.
- **F-176-T4-2: KHÔNG TÁI DIỄN** — sampler n=99/101 đếm đúng.

## 1. Poller — 28 poll thật (2 test + 26), 2 lần cửa mở, 0 reboot

- **Test (POLL_TEST=1), 2 poll, boot 6ecd948e
  (08:45:58Z, 08:46:02Z):** cả 2 đều gate0=T5, load1 7,98/7,58,
  load5 3,05, RAM 1163/1164 MB, lock=co (t0-round184),
  blockers=5, apt=0 → cửa đóng → **TEST-POLL-OK exit 7 đúng
  thiết kế** (cả 2 lần). 2 poll này nằm trong `poll-test-184.log`;
  thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 6ecd948e (#102), 26 poll
  (08:46:16–09:08:13Z), 2 lần cửa mở (#25, #26):** RAM ≥1024:
  14/26 (min 435, max 2112 MB); 500–1023: 10/26; **<500: 2/26**;
  load1<2: 19/26; load5<2: 12/26;
  gate0: **T5 26/26** (cờ có từ trước khi mở poller);
  lock=co 4, khong 22 (T0 giữ, poll #1–#4);
  blockers>0: 4 poll; apt>0: 0 poll; dpkg 1461 → 1461 (đứng yên).
- **Giai đoạn 1 — T0 giữ lock + load cao (poll #1–#4,
  08:46:16–08:48:33Z):** lock=co (thread=t0-round184, pid 261262,
  port 5560, ticket 1-17955099163) + blockers 5/5/5/1; load1
  7,18–9,65, load5 3,12–5,62; RAM 873–1067 MB. O8 T0 chạy trên
  #102 trong lúc này (PASS 3/3, xem §3). Cửa KHÔNG MỞ ĐƯỢC vì
  thiếu lock + blockers + load.
- **Giai đoạn 2 — lock đã nhả, load5 hạ dần (poll #5–#14,
  08:49:19–08:56:05Z):** lock=khong từ poll #5; load1<2 từ
  poll #8 (1,89); load5 5,38 → 2,03 — vẫn >2 tới poll #14
  (2,03). Cửa KHÔNG MỞ (chỉ thiếu load5).
- **Giai đoạn 3 — load đủ, RAM sụt (poll #15–#24,
  08:56:50–09:03:36Z):** load1 0,21–1,48, load5 0,93–1,76 —
  đều <2; nhưng RAM 969 → 435 → 876 MB, toàn <1024.
  RAM<500: poll #22 (438 MB, 09:02:06Z) + #23 (435 MB,
  09:02:51Z) — 2 poll liên tiếp (xem F-184-T4-2). Cửa KHÔNG MỞ
  (chỉ thiếu RAM — balloon ghim, xem §4, E-220).
- **CỬA MỞ LẦN 1 — poll #25 (09:04:21Z):** load1 1,48, load5
  1,14, RAM 1088 MB, gate0=T5, lock=khong, blockers=0, apt=0,
  dpkg 1461, tree=YES → **CHẠY attempt1 NGAY**.
- **CỬA MỞ LẦN 2 (retry) — poll #26 (09:08:13Z):** load1 1,28,
  load5 1,56, RAM 2112 MB, gate0=T5, lock=khong, blockers=0,
  apt=0, dpkg 1461, tree=YES → **CHẠY attempt2 NGAY**
  (poll lại gate trước retry — quyết (h) đợt 149).
- **0 reboot trong phiên đo.** Poller thoát exit 0 lúc
  09:12:01Z sau khi attempt2 hợp lệ (không chạm hạn cắt
  10:30Z).
- **Phân rã 28 poll thật:** RAM≥1024: 16/28; RAM 500–1023:
  10/28; RAM<500: **2/28**. load1<2: 19/28; load5<2: 14/28.
  **Stats "gan-mo" đếm 2 = đúng 2 poll mở cửa thật** (#25, #26).
  gate0: T5 28/28. blockers>0: 6 poll (2 test + 4 poller,
  toàn lúc T0 giữ lock). apt>0: 0 poll.

## 2. Attempt — 2 attempt, 1 NHIỄM TẢI + 1 HỢP LỆ (ngân sách dùng 2/3)

- **attempt1-6ecd948e, 09:04:22–09:07:51Z (3'29"), 20/20 pass
  NHƯNG NHIỄM TẢI — KHÔNG TÍNH.** JSON
  `preview-b-f3-flip-webkit-t4-attempt1-6ecd948e.json`
  3.431.676 B. **tickCost total n=625 median=47,0 p90=73,0
  max=162 min=28** (≤60 nếu chỉ xét median — nhưng verdict
  vẫn HỦY vì lớp B); hậu flip+2000ms n=456 median=46,5;
  tBlend gap n=515 median=89,0 p90=112,6 max=1796;
  BlendTick/pass=25,8; rAF/pass median=36 (min 32, max 41);
  webkit=27,2; pageErrs=[]; flip afterPass=5 wallMs=27827.
- **Per-pass median attempt1:** 40,0 / 55,0 / 54,5 / 53,5 /
  45,0 / 42,5 / 46,0 / 45,0 / 52,0 / 41,0 / 48,0 / 39,0 /
  41,5 / 52,0 / 41,5 / 50,0 / 52,0 / 52,5 / 51,5 / 44,5.
  Load1 trung bình/pass LEO DẦN 1,78 → 3,65 (dấu vết nhiễm tải
  xuyên suốt lượt, xem F-184-T2-8).
- **Lớp B attempt1 VI PHẠM — B2(load)**
  (`classb-t4-attempt1-6ecd948e.txt`, 09:07:51Z): sampler n=101,
  **load1_max=4,48**, RAM_min=824 MB, RAM_max=1722 MB,
  **0 mẫu RAM<500 MB**, 3 mẫu RAM<1024 MB (cảnh báo, không vi
  phạm); load5 lúc kết thúc 1,54; boot lúc bắt đầu = boot hiện
  tại 07:07:05Z; apt/dpkg thật lúc đánh giá (pgrep -x) = 0;
  **dpkg.log: trước=1461, hiện tại=1461, delta-trong-cửa-sổ=0**;
  ps-before/after exact-comm apt/dpkg = 0. B1 DAT (load5 cuối
  ≤2,5); **B2 VI PHẠM (load1 max 4,48 > 4)**; B3 DAT (không
  reboot); B4 DAT (pgrep -x=0, ps exact-comm=0, dpkg delta=0);
  B5 DAT (RAM min 824 MB, 0 mẫu <500 MB). **Kết luận: attempt1
  20/20 BỊ HỦY — lượt NHIỄM TẢI, KHÔNG cộng dồn.**
- **(c2) attempt1 7/7 COVERED + P3' 7/7 DAT (KHÔNG CỘNG DỒN —
  attempt nhiễm tải):** seq 159 (stall 3), 230 (7), 258 (7),
  340 (7), 363 (2), 469 (6), 496 (7) — đều ở cuối chuỗi đóng
  băng ≥2 tick; coverage 7/7 (blendTick hậu-flip trong ±500 ms
  của log: 377/377 = 100,0%); labellag (c2) cả 7 seq lag +1f.
  Các số này chỉ ghi nhận, KHÔNG đưa vào cộng dồn §7.
- **attempt2-6ecd948e, 09:08:13–09:11:40Z (3'27"), 20/20
  pass — HỢP LỆ.** JSON
  `preview-b-f3-flip-webkit-t4-attempt2-6ecd948e.json`
  3.378.154 B. **tickCost total n=622 median=43,5 p90=71,0
  max=113 min=28**; hậu flip+2000ms n=461 median=41,0;
  tBlend gap n=501 median=87,0 p90=108,0 max=1609;
  BlendTick/pass=25,1; rAF/pass median=36 (min 33, max 41);
  webkit=27,2; pageErrs=[]; flip afterPass=5 wallMs=26301.
- **Per-pass median attempt2:** 45,0 / 49,0 / 56,0 / 51,0 /
  39,0 / 50,0 / 51,5 / 39,0 / 40,0 / 52,0 / 51,0 / 41,0 /
  34,5 / 39,0 / 43,0 / 47,0 / 36,0 / 40,0 / 52,5 / 40,0
  (p90/pass 63,7–84,6; load1/pass 1,20 → 2,14; RAM/pass
  1637 → 1340 MB). Tương quan median~load1 r=-0,26;
  median~RAM r=0,38 (chỉ mô tả, không kết luận nhân quả từ
  1 lượt).
- **Lớp B attempt2 DAT 5/5** (`classb-t4-attempt2-6ecd948e.txt`,
  09:11:40Z): sampler n=99, load1_max=2,19, RAM_min=1318 MB,
  RAM_max=1990 MB, **0 mẫu RAM<500 MB**, 0 mẫu RAM<1024 MB;
  load5 lúc kết thúc 1,24; boot lúc bắt đầu = boot hiện tại
  07:07:05Z; apt/dpkg thật lúc đánh giá (pgrep -x) = 0;
  **dpkg.log: trước=1461, hiện tại=1461, delta-trong-cửa-sổ=0**;
  ps-before/after exact-comm apt/dpkg = 0. B1 DAT (load5 cuối
  ≤2,5); B2 DAT (load1 max ≤4 + ps-before/after chỉ có vite
  của chính attempt — 0 process phân tích nặng khác); B3 DAT
  (không reboot trong lúc đo); B4 DAT (pgrep -x=0, ps
  exact-comm=0, dpkg delta=0); B5 DAT (RAM min 1318 MB,
  0 mẫu <500 MB).
- **(c2) attempt2 6/6 COVERED + P3' 6/6 DAT:** seq 274 (stall 3),
  299 (3), 325 (5), 375 (2), 398 (2), 425 (4) — đều ở cuối
  chuỗi đóng băng ≥2 tick; coverage 6/6 (blendTick hậu-flip
  trong ±500 ms của log: 376/376 = 100,0%); P1 6/6 DUNG
  (baseline 48/376, p=4,33e-06); P3-A1 6/6 DUNG (baseline
  80/375, p=9,43e-05); P2 6/6 (cả 6 seq lag +1f; median/p90/
  max lag đều 1f, 0 âm); P7 DUNG (c2 drawSrc delta {-1: 34,
  0: 26}; đối chứng toàn bộ drawSrc post: {-1: 297, 0: 162},
  0/459 entry trễ ≥+1f); labellag (b) lag≥+5f: **6 occurrence /
  1 event** (seq 482–485, lag max +11f, tBlend 76613–76934 —
  xem F-184-T4-3); F6' ĐÓNG (skipLatest n=66 hậu flip+2000ms:
  (1) 100,0%, (2) 100,0%).
- **Không attempt nào bị reboot giết; 1 retry do nhiễm tải.**
  Ngân sách còn 1/3 (không dùng thêm vì đã có lượt hợp lệ).

## 3. B2 spike / đối chiếu sampler T9 + O8 T0

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT2: 0 SPIKE.** T9-184 CÓ
  `b2-spikes.log` Ở ĐÚNG ĐƯỜNG DẪN
  (`~/workspace/repo-1/round184-t9/b2-spikes.log`, 1190 dòng
  lúc kiểm, 88 header SPIKE; F-181-T9-5 KHÔNG tái diễn):
  **0 spike trong cửa sổ attempt2 09:08:13–09:11:40Z**.
- **KIỂM B2 TRONG CỬA SỔ ATTEMPT1: 10 SPIKE** (09:05:18–
  09:06:18Z, load1 3,02 → 4,48 → 3,08 — khớp sampler
  load1_max=4,48 lúc 09:05:53Z từng giây). Bằng chứng độc lập
  thứ hai cho F-184-T2-8 (ngoài ps-before + sampler).
- **O8 T0 TRÊN BOOT #102 — PASS 3/3 (theo T0-184.done 08:52Z):
  WebKit 21/21 ×2 + Chromium 21/21, SAU POSTBOOT_PASS #102
  77 s; 0 attempt chồng với T4.** T4 poll #1–#4 trong cửa sổ
  O8 đều ghi lock=co thread=t0-round184 + blockers → cửa yên
  KHÔNG mở; poll #5 (08:49:19Z, sau khi O8 xong) lock=khong.
  **0 giây chồng lấn giữa O8 và attempt T4** (O8 xong trước
  poll #5 08:49:19Z, attempt1 bắt đầu 09:04:22Z — cách ~15').
- **O8 T8 TRÊN BOOT #102 — CHƯA CÓ (T8-184 chưa đóng cờ lúc
  T4 đóng).** Chân O8 T8 + harness thuộc T8-184 báo cáo.
- **Ghi trong cửa sổ attempt2: KHÔNG CÓ.** `run-analyzers-184.sh`
  chạy 09:11:40–09:12:01Z, SAU khi attempt-done đã ghi
  (09:11:40.056Z) — xem kiểm chứng live lần 4 (§6,
  F-184-T4-5). File `hidden_files/round109-k7/
  analyze-k7-skiplatest.txt` mtime vẫn 2026-11-23 18:13:20Z
  (đợt 179) — 0 ghi mới.

## 4. Replay/postboot — POSTBOOT_PASS #102 ĐÃ CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat)

- **Boot 6ecd948e (btime 07:07:05Z, số hiệu #102 — T0-184 XÁC
  NHẬN 9 nguồn; gap #101→#102 = 6.878 s).**
- **POSTBOOT_PASS #102 ĐÃ CÓ 08:43:59Z** (boot+1h36m54s;
  watcher-184 pid 211325, **mode replay-đầy-đủ, poll=0,
  KHÔNG caveat**; T5-184.done 08:50Z; replay #102 KHÔNG đình
  trệ — dpkg 1461 dòng, 50 transaction; T4 nhận cờ ở poll #1
  08:46:16Z). Gate0=T5 cả 28/28 poll. Hướng (3) VẪN ĐỨNG lần 31.
- **0 REBOOT trong cửa sổ attempt; 0 REBOOT trong phiên đo.**
  Số hiệu #102 đã xác nhận (T0-184); (m) #102 + INSIDE #102
  thuộc T2-184 (T2-184.done: (m) #102 DƯƠNG ỨNG VIÊN +40,341 s;
  INSIDE #102 TRUE FULL148 — parent 184 quyết cuối);
  #102 KHÔNG GIẾT HOLDER (T0-184 + T6-184 KHỚP — lock trống
  170 s; chuỗi mới = 7 nếu parent tính tiếp);
  POSTBOOT_PASS #102 CÓ — giá trị chân gate (a) cho chuỗi
  FULL PASS: **lượt yên #53 CÓ trên #102 + gate (a) #102 CÓ
  (KHÔNG caveat) + O8 T0 PASS 3/3 trên #102 — 3 chân CÙNG
  BOOT #102**; O8 T8 + harness thuộc T8-184. Chuỗi FULL PASS
  **GIỮ 0** theo quyết (b) đợt 183 — đợt 184 có full pass thì
  chuỗi lên lại 1 (parent quyết cuối).
- **REBOOT #103 MỚI SAU PHIÊN ĐO (F-184-T4-4):** boot
  `e0921bda`, btime **09:14:55Z**, gap #102→#103 = **7.670 s**
  — xảy ra 2'54" SAU khi poller thoát (09:12:01Z), trong lúc
  T4 phân tích sau poller; T4 phát hiện khi kiểm boot lúc
  09:16:44Z. **0 ảnh hưởng tới lượt yên #53** (đo xong trên
  #102). Số hiệu #103 CHỜ T0-185 xác minh 9 nguồn (T0-184 đã
  đóng cờ trên #102 lúc 08:52Z); watcher-184 đã chết theo
  #103 (hạn ghi 11:35:00Z — thuộc T5-185). Lưu ý: T2-184.done
  (đóng 09:18Z) ghi "không có reboot #103 trong phiên" — T10
  đối chiếu (phiên T2 kết thúc kiểm trước 09:14:55Z hoặc
  khác cửa sổ kiểm).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-184 báo cáo.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND184_T4_WEBKIT_QUIET53_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round184-t4/`):**
  `poll-wait-t4-184.sh` (deadline 10:30Z 24/11 + cờ T5
  round184-t5/ + fallback round183-t5/),
  `run-attempt-184.sh` (lượt yên #53),
  `run-analyzers-184.sh` (chạy classb + 9 analyzer
  NGOÀI cửa sổ attempt; đợt này ĐÃ CHẠY 09:11:40–09:12:01Z),
  `distinct-seq-184.py` (helper đọc sổ; đợt này DÙNG LIVE —
  sổ as-of-184: 134/138 distinct, occ 169/181).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–183, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round184-t4/` — theo đúng mẫu 149–183: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round184-t4/`, md5 `078938cf...`,
  giống hệt bản đợt 156–183).
- **Script làm việc (hidden_files, không stage):**
  5 script T4 (`poll-wait`/`run-attempt`/`run-analyzers`/
  `t4-attempt-inner` — W = round184-t4 + glob chéo round183-* /
  `check-classb-t4` — đếm sampler n chỉ dòng `boot=`),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-184.py` (thống kê §A;
  footer CỘNG DỒN MỚI 46 lượt),
  `distinct-seq-184.py` (helper đọc sổ — DÙNG LIVE),
  `distinct-seq-ledger.json` (SỔ distinct-seq, as-of-184:
  134/138 distinct, occ 169/181, valid_rounds_p3 34,
  non_dat [260, 283, 364, 498]; md5 `349e5c14…` — ĐÃ THĂNG
  CẤP từ bản đề xuất, sổ gốc as-of-183 `b799edb8…` còn
  trong `distinct-seq-ledger-184-proposed.json` đối chiếu
  + trong `hidden_files/round183-t4/distinct-seq-ledger.json`),
  `preflight-184.txt` + `preflight-postboot-184.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2).
- **Log/evidence (hidden_files/round184-t4/, không stage):**
  `poll-t4.log` (26 poll trên #102 + CUA YEN MO #25/#26 +
  LUOT HOP LE), `poll-t4.nohup.log` (1 instance),
  `poll-test-184.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + CUA YEN MO + analyzers +
  LUOT HOP LE, thoát poller exit 0),
  `postboot-t4-184-gate0wait-*.log` (check-only mỗi 4 poll;
  PB=0 suốt), `stats-184-output.txt` (output stats-184.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có
  blockers: #1–#4 T0 giữ lock),
  2 JSON attempt (3.431.676 B + 3.378.154 B — KHÔNG stage),
  `analyze-t4-attempt1-6ecd948e-*.txt` (9 analyzer, attempt1
  nhiễm tải — chỉ ghi nhận) + `analyze-t4-attempt2-6ecd948e-*.txt`
  (9 analyzer, attempt2 hợp lệ),
  `classb-t4-attempt1-6ecd948e.txt` (B2 VI PHẠM) +
  `classb-t4-attempt2-6ecd948e.txt` (B 5/5),
  `coverage-check-attempt1-6ecd948e.txt` (7/7) +
  `coverage-check-attempt2-6ecd948e.txt` (6/6),
  `p1p3p7-attempt2-6ecd948e.txt` (P1/P3-A1/P7 attempt2),
  `attempt-done-attempt1-6ecd948e` +
  `attempt-done-attempt2-6ecd948e` (ngân sách 2/3),
  `load-mid-t4-attempt1-6ecd948e.log` (sampler n=101) +
  `load-mid-t4-attempt2-6ecd948e.log` (sampler n=99),
  `run-webkit-t4-attempt1-6ecd948e.log` +
  `run-webkit-t4-attempt2-6ecd948e.log`,
  `ps-before/after-t4-attempt1-6ecd948e.txt` (ps-before CÓ
  hole-recheck T2 — bằng chứng F-184-T2-8) +
  `ps-before/after-t4-attempt2-6ecd948e.txt` (sạch).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  09:12:01Z exit 0; 0 vite; 0 Xvfb; 0 MiniBrowser/WebProcess;
  X11 trống — xem F-184-T4-2).

## 6. Sai số F-184-T4-1..5 (+ nợ cũ)

- **F-184-T4-1 — COPY-FORWARD: 4 CHUỖI STALE SÓT SAU LẦN SỬA
  ĐẦU (GHI NHẬN — DẠNG F-183-T4-1, MỨC NHẸ HƠN).** Lần sửa
  đầu bằng script thay thế có neo đã đổi đúng fallback/glob
  (không lặp lỗi sed global đợt 183), nhưng grep kiểm lần 2
  bắt thêm 4 chuỗi stale: comment gate0 (line 153, vẫn ghi
  round183-t5 chính / round182-t5 fallback), comment hạn cắt
  (line 202, `07:30Z`), echo hết hạn (line 257, `han co
  ~08:00Z`), echo chờ gate (line 282, `han cat 07:30Z`). Sửa
  TRƯỚC pre-flight; grep lần 3 sạch. Không ảnh hưởng vận hành
  (toàn chuỗi comment/echo; deadline + T5FLAG + glob đều đúng
  từ lần sửa đầu). Bài học: thay thế có neo vẫn cần grep lần 2
  với mẫu rộng (`07:30|08:00Z|08:35Z|round18`) — đã làm.
- **F-184-T4-2 — RAM <500 MB 2 POLL LIÊN TIẾP TRƯỚC CỬA MỞ
  (MỚI — DẠNG F-174-T4-6).** Poll #22 (438 MB, 09:02:06Z) +
  #23 (435 MB, 09:02:51Z); RAM toàn phiên min 435 MB. 0
  attempt chạy trong lúc RAM<500 (cửa chỉ mở ở #25 khi RAM đã
  hồi 1088 MB). Ghi nhận cho T9-184 (balloon ghim trên #102 —
  E-220 đang ghim lúc T9-183 đóng).
- **F-184-T4-3 — LABELLAG (b) lag≥+5f: 6 OCCURRENCE / 1 EVENT
  (MỚI — ĐỢT 183 LÀ 0).** Attempt2: seq 482–485, lag max
  +11f, tBlend 76613–76934 ms (321 ms, 1 event, M=[26]).
  Đây là chẩn đoán (b) — KHÔNG phải gate verdict (P1/P2/P3-A1/
  P7 của attempt2 đều DUNG; F6' ĐÓNG). Ghi nhận lần đầu có
  occurrence (b) ≥+5f kể từ đợt 183 (0) — theo dõi đợt sau
  xem có lặp lại không.
- **F-184-T4-4 — REBOOT #103 MỚI SAU PHIÊN ĐO (MỚI).**
  Boot `e0921bda`, btime 09:14:55Z, gap #102→#103 = 7.670 s —
  xảy ra 2'54" sau khi poller thoát (09:12:01Z), trong lúc T4
  phân tích sau poller. 0 ảnh hưởng tới #53 (đo xong trên
  #102). Số hiệu #103 CHỜ T0-185 xác minh 9 nguồn. Lưu ý
  mâu thuẫn nhẹ: T2-184.done (đóng 09:18Z) ghi "không có
  reboot #103 trong phiên" — T10 đối chiếu cửa sổ kiểm của T2.
- **F-184-T4-5 — QUYẾT (p) KIỂM CHỨNG LIVE LẦN 4: ĐẠT
  (MỚI — F-183-T4-5 ĐÃ HẾT).** Cửa sổ attempt2
  09:08:13.196Z (marker) → 09:11:40.056Z (attempt-done).
  Run-analyzers bắt đầu 09:11:40Z (cùng giây với attempt-done,
  sau trap EXIT). Mtime sớm nhất của 9 file analyzer +
  classb: classb 09:11:40.153Z, c2drawlog 09:11:40.230Z —
  cả hai SAU attempt-done 09:11:40.056Z; 8 file còn lại
  09:11:47–09:12:01Z. **0 file analyzer ghi trong cửa sổ
  attempt2.** File skiplatest mặc định
  `hidden_files/round109-k7/analyze-k7-skiplatest.txt`
  mtime vẫn 2026-11-23 18:13:20Z — 0 ghi mới. Kiểm chứng live
  lần 4 (đợt 179: lần 1 dời; 180–182 dời; 183: lần 3 ĐẠT;
  lần này lần 4 ĐẠT).
- **F-184-T2-8 — VI PHẠM TUÂN THỦ CỦA T2 (T2 TỰ BÁO — XEM
  T2-184.done): HOLE-RECHECK CHỒNG LÊN ATTEMPT1, LÀM HỎNG
  ATTEMPT1.** T2 khởi động `hole-recheck9797.py` (quét
  whole-tree 24.602 file) khi poller T4 đang gate0wait; process
  đã chạy trong ps-before attempt1 (pid 348034/348035, lấy
  trước marker 09:04:22.147Z); log `hole-recheck184.log`
  mtime 09:04:38Z (16 s sau khi attempt bắt đầu); load1 leo
  1,78 → 3,65 theo pass, sampler max 4,48 lúc 09:05:53Z;
  10 spike B2 09:05:18–09:06:18Z (khớp sampler từng giây);
  class-B B2 VI PHẠM → attempt1 20/20 BỊ HỦY; retry attempt2
  HỢP LỆ (load1_max 2,19, 0 spike). Khác F-183-T2-7 (0 chồng
  chéo, 0 hậu quả): lần này CÓ chồng chéo VÀ CÓ hậu quả thật
  (1 attempt bị hủy — ngân sách 2/3 thay vì 1/3). T4 ghi nhận
  đầy đủ bằng chứng (ps-before + sampler + B2 log + classb);
  T2 đã tự báo trung thực trong cờ của mình. **Chuỗi 0 vi
  phạm GIỮ 0 — parent quyết cuối** (chuỗi đã VỀ 0 theo quyết
  (p) đợt 183; đợt này có vi phạm mới nên không lên 1).
- **F-183-T4-1 — TÁI DIỄN DƯỚI DẠNG NHẸ HƠN F-184-T4-1**
  (4 chuỗi stale — bắt được trước pre-flight).
- **F-183-T4-2 — KHÔNG TÁI DIỄN.** X11 trống lúc đóng (0
  socket, 0 Xvfb) — không còn socket mồ côi sau attempt.
- **F-183-T4-3 — KHÔNG TÁI DIỄN.** py_compile 12 file
  (10 analyzer + stats + distinct-seq) — đếm đúng.
- **F-183-T4-4 — TÁI DIỄN DƯỚI DẠNG BÌNH THƯỜNG:** T0 giữ
  lock polls #1–#4 + blockers (xem §1 giai đoạn 1); đó là vận
  hành bình thường của O8, không phải sai số mới.
- **F-183-T4-5 — ĐÃ HẾT (xem F-184-T4-5 — kiểm chứng live
  lần 4 ĐẠT). F-183-T4-6 — KHÔNG TÁI DIỄN THEO NGHĨA MỚI:**
  stats "gan-mo" = 2 = đúng 2 poll mở cửa thật (#25, #26).
- **F-183-T4-7 — KHÔNG TÁI DIỄN** (kiểm đúng đường dẫn ngay
  từ đầu; 0 spike trong cửa sổ attempt2). **F-182-T4-1 —
  KHÔNG TÁI DIỄN** (0 reboot trong phiên đo). **F-182-T4-4 —
  ĐÃ HẾT** (#102 CÓ POSTBOOT_PASS, KHÔNG caveat).
- **F-181-T4-3 — KHÔNG TÁI DIỄN. F-181-T4-6 — CÓ SỐ MỚI:**
  chuỗi median 45 → 46, thêm 43,5 ms; mean 47,8 → 47,7.
- **F-181-T4-7 — KHÔNG ÁP DỤNG** (sampler n=99/101 đếm đúng
  dòng `boot=`). **F-181-T4-8 — KHÔNG ÁP DỤNG** (p90 tickCost
  attempt2 71,0 ms — chỉ ghi nhận, không có bar p90).
- **F-179-T4-5 — ĐÃ HẾT (xem F-184-T4-5). F-178-T4-1 —
  KHÔNG TÁI DIỄN** (0 spike trong cửa sổ attempt2).
  **F-177-T4-4 — KHÔNG TÁI DIỄN. F-177-T4-6 — TÁI DIỄN
  DƯỚI DẠNG F-184-T4-1. F-176-T4-1 — KHÔNG TÁI DIỄN**
  (0 vi phạm theo T4). **F-176-T4-2 — KHÔNG TÁI DIỄN**
  (sampler n=99/101). **F-175-T4-1 — KHÔNG TÁI DIỄN**
  (`tree-md5.txt` còn nguyên; test poll lần 1 tree=YES).
  **F-175-T4-2 — KHÔNG TÁI DIỄN** (0 ghi analyzer trong cửa
  sổ attempt2). **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG BÌNH
  THƯỜNG** (T0 giữ lock polls #1–#4). **F-175-T4-5 — KHÔNG
  TÁI DIỄN** (0 reboot trong phiên đo).
- **F-174-T4-1 — KHÔNG ÁP DỤNG** (p1p3p7 chạy tay sau attempt
  — kết quả §7, không lỗi). **F-174-T4-3 — KHÔNG TÁI DIỄN**
  (kiểm process lúc đóng dùng `ps` trực tiếp). **F-174-T4-4 —
  KHÔNG ÁP DỤNG** (p1p3p7 chạy — 6/6 cả ba). **F-174-T4-6 —
  TÁI DIỄN DƯỚI DẠNG F-184-T4-2** (RAM <500 MB: 2/28 poll —
  #22/#23, 438/435 MB; không attempt nào chạy trên RAM thấp).

## 7. P3' cộng dồn (MỚI — 46 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 184 (MỚI): P1 205/209, P2 200/200,
  P3-A1 178/209, P3' 169/181 occurrence = 134/138 distinct-seq,
  P7 103/103** (46 lượt hợp lệ — #53 CÓ lượt hợp lệ nên cộng
  thêm 6 seq; attempt1 nhiễm tải KHÔNG cộng).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #53: 6/6 seq (c2) ĐẠT cả P1 + P2 + P3-A1 +
  P3'** (seq 274, 299, 325, 375, 398, 425; stall 3, 3, 5, 2,
  2, 4); P7 ĐÚNG (0/459 entry trễ ≥+1f).
  Helper `distinct-seq-184.py` DÙNG LIVE (quyết (t) đợt 162):
  sổ as-of-183 (130/134 distinct, occ 163/175) + stall/
  c2coverage attempt2-6ecd948e → **134/138 distinct,
  169/181 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 274, 325, 398, 425** (chưa có trong sổ);
  **299, 375 ĐÃ THẤY** (trong sổ).
  T4 kiểm tay lại sổ as-of-183: cả 4 seq mới vắng thật
  (274/325/398/425 không có trong `seen_dat` lẫn `seen_c2`).
- **P1 — ĐÚNG 6/6 occ** (cả 6 seq gần run-end ±1 tick; trong
  16 run_end seqs; baseline 48/376, p=4,33e-06 — verdict
  ĐÚNG theo luật DEF §3 vì n=6 ≥3 VÀ p<0,01). Cộng dồn
  199/203 → **205/209**.
- **P2 ĐÚNG — 6/6 occ** (cả 6 seq lag +1f; DEF §4 chỉ đòi
  lag ≥ +1f; median/p90/max lag đều 1f, 0 âm). Cộng dồn
  194/194 → **200/200**.
- **P3-A1 — ĐÚNG 6/6 occ** (cả 6 seq đóng băng-tại-tick;
  baseline 80/375, p=9,43e-05 — verdict ĐÚNG theo luật DEF
  §5 vì p<0,01 và n≥3). Cộng dồn 172/203 → **178/209**.
- **P3' 6/6 occ ĐẠT** (stall: 274=3, 299=3, 325=5, 375=2,
  398=2, 425=4). Cộng dồn 130/134 → **134/138
  distinct** (4 seq ĐẠT MỚI — 274, 325, 398, 425);
  occurrence 163/175 → **169/181**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 34,
  0: 26}; đối chứng toàn bộ drawSrc post: {-1: 297, 0: 162},
  0/459 entry). Cộng dồn 97/97 → **103/103**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162).**
  Helper đọc sổ (as-of 183: 130/134 distinct, occ 163/175),
  tính seq MỚI = tập hiệu với sổ, in cộng dồn mới, ghi sổ MỚI
  ra file riêng (`distinct-seq-ledger-184-proposed.json`) —
  KHÔNG sửa sổ gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp.
  **Live đợt 184:** sổ + stall/c2coverage attempt2-6ecd948e →
  **134/138 distinct, 169/181 occ** — khớp tính tay trên.
  Sổ ĐÃ THĂNG CẤP: as-of 184, 134/138 distinct, occ 169/181,
  valid_rounds_p3 34, non_dat [260, 283, 364, 498] (không đổi;
  sổ gốc as-of-183 md5 `b799edb8…` còn trong file đề xuất
  đối chiếu + trong `hidden_files/round183-t4/
  distinct-seq-ledger.json`; sổ mới md5 `349e5c14…`).
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (lượt #53 thêm 4 seq mới đều ĐẠT cả
  P1/P2/P3-A1/P3' — ủng hộ thêm, không đổi verdict).
- Chuỗi median tickCost 46 lượt (MỚI — thêm 43,5 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 /
  39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 /
  58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 /
  44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 /
  53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 / 50,0 /
  45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 ms (tổng 2193,0;
  trung bình 47,7 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 185

- **(a) #53 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 45 → 46.**
  Chân lượt yên cho chuỗi FULL PASS **CÓ đợt này** (attempt2
  trên #102, 20/20 + B 5/5 + median 43,5 ms) — cùng boot với
  gate (a) #102 (CÓ, KHÔNG caveat) + O8 T0 PASS 3/3 trên #102.
  Chuỗi FULL PASS **GIỮ 0** theo quyết (b) đợt 183 — đợt 184
  có full pass thì chuỗi lên lại 1 (parent quyết cuối — còn
  chờ chân O8 T8 + harness của T8-184).
- **(b) P3' cộng dồn MỚI 46 lượt: P1 205/209, P2 200/200,
  P3-A1 178/209, P3' 169/181 = 134/138, P7 103/103:**
  sổ distinct-seq as-of-184 md5 `349e5c14…` (4 seq mới 274,
  325, 398, 425 — kiểm tay vắng thật). **Chờ parent/T10 quyết:**
  ghi nhận cộng dồn mới.
- **(c) BOOT 6ecd948e (số hiệu #102) — T0-184 ĐÃ XÁC NHẬN 9
  nguồn (gap #101→#102 = 6.878 s).**
  **(m) #102 (T2-184 + parent 184; số liệu thô +40,341 s từ
  T0-184); INSIDE #102 (T2-184; FULL148); #102 KHÔNG GIẾT
  HOLDER (T0-184 + T6-184 KHỚP — chuỗi = 7 nếu parent xác
  nhận).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale-string lần 2 bắt được 4 chuỗi
  sót (F-184-T4-1 — sửa trước pre-flight); gate0 ĐÃ ĐẠT lúc
  mở (cờ T5 có từ 08:43:59Z, trước poller 2 phút).
- **(e) POSTBOOT_PASS #102 ĐÃ CÓ (08:43:59Z, boot+1h36m54s,
  replay-đầy-đủ, poll=0, KHÔNG caveat): GHI NHẬN — cờ KHÔNG
  caveat (khác #101/#98/#96 có caveat). Giá trị cho gate (a)
  thuộc T8/T10 quyết. #100 KHÔNG CÓ — KHÔNG bù được, tổng
  boot không cờ GIỮ 22 (quyết (c) đợt 183).** Hướng (3)
  VẪN ĐỨNG lần 31.
- **(f) RAM <500 MB: 2/28 poll (min 435 MB, poll #22/#23).**
  Không có attempt nào chạy trên RAM thấp. Giao T9-184 đối
  chiếu balloon trên #102 (E-220 đang ghim).
- **(g) (m) #102 (T2-184 + parent 184); (m) #56 lần 27
  (T2-184); mù #96?/#95?/#94?/#88? (hole-recheck lần 28)/#77?
  (T2-184); (c')/(f') — T8-184 chuẩn bị thiết kế nâng V2
  (quyết (j) đợt 183); Plan B B1 (T8-184); 84l10 + Q3
  heartbeat (T8-184); E-220 kết cục (T9-184); #102 có giết
  holder không (T0-184 + T6-184 ghi KHÔNG — chuỗi = 7 nếu
  parent xác nhận); prune lần 59 (T6-184 — xóa 3 file,
  queue 103 → 100); checklist (o) (T8-184); H3 chỉ giám sát
  thụ động; birefnet 0 thử lần 38; nhắc mọi luồng: KHÔNG chạy
  script nặng / KHÔNG probe dpkg trong cửa sổ attempt (đợt này
  F-184-T2-8 — hole-recheck chồng attempt1, attempt1 bị hủy;
  phía T4 giữ 0 vi phạm); u2net là fallback chính thức;
  ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại;
  G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT** (dpkg delta
  0 cả hai attempt, apt/dpkg 0 — xem §2).
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 2 lần đợt này
  (attempt1 nhiễm tải + attempt2 hợp lệ) → **CÓ lượt yên
  hợp lệ #53 cho chuỗi FULL PASS** (cùng boot #102 với O8 T0).
  T8 tự quyết O8 đợt này (O8 T0 trên #102 PASS 3/3 —
  sau cờ 77 s; O8 T8-184 thuộc T8-184 báo cáo).
- **(j) F-184-T4-1 (4 chuỗi stale — sửa trước pre-flight);
  F-184-T4-2 (RAM <500 2 poll liên tiếp); F-184-T4-3 (labellag
  (b) lag≥+5f 6 occ / 1 event — lần đầu >0 kể từ đợt 183);
  F-184-T4-4 (reboot #103 sau phiên đo); F-184-T4-5 (quyết (p)
  kiểm chứng live lần 4 ĐẠT); F-184-T2-8 (T2 hole-recheck
  chồng attempt1 — attempt1 bị hủy, chuỗi 0 vi phạm GIỮ 0).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-184.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-184.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-24T08:45:58Z - 2026-11-24T08:46:02Z, boot=6ecd948e
   RAM min=1163 max=1164 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 0/2 blockers>0: 2 apt>0: 0
   gate0: T5=2
   lock: co=2
   dpkg 1461->1461
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 26 poll, 2026-11-24T08:46:16Z - 2026-11-24T09:08:13Z, boot=6ecd948e
   RAM min=435 max=2112 >=1024: 14/26 500-1023: 10/26 <500: 2/26
   load1<2: 19/26 load5<2: 12/26 blockers>0: 4 apt>0: 0
   gate0: T5=26
   lock: co=4, khong=22
   dpkg 1461->1461
   chuoi RAM<500 dai nhat: 2 poll
-- TONG poll that: 28
-- RAM toan phien: min=435 max=2112 >=1024: 16/28 <500: 2/28
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 2/28
   gan-mo? #25 2026-11-24T09:04:21Z boot=6ecd948e RAM=1088 L1=1.48 L5=1.14 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #26 2026-11-24T09:08:13Z boot=6ecd948e RAM=2112 L1=1.28 L5=1.56 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 6ecd948e: 28 poll; RAM>=1024 lan cuoi: 2026-11-24T09:08:13Z #26; RAM<1024 lan dau: 2026-11-24T08:46:16Z #1 RAM=987
-- cong don P3' (MOI, 46 luot hop le): P1 205/209 P2 200/200 P3-A1 178/209 P3' 169/181 occ = 134/138 distinct-seq P7 103/103
-- chuoi median 46 luot: n=46 mean=47,7 min=39,0 max=60,0 vuot-60: 0
```
