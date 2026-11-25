# PHASE9_ROUND181_T4_WEBKIT_QUIET50_LIMITS.md

**Đợt:** 181. **Luồng:** T4 — đo lượt yên WebKit #50 trên 1 boot
+ **#50 CÓ LƯỢT HỢP LỆ — attempt1-e62eef3f (20/20 + lớp B 5/5 +
  tickCost median 50,0 ms ≤60). CHUỖI LƯỢT YÊN HỢP LỆ 43 → 44.**
  Attempt1 thành công ngay lần đầu (ngân sách dùng 1/3) — trên
  boot #98 (XÁC NHẬN 9 nguồn, T0-181), sau POSTBOOT_PASS #98
  (repair-sớm-quyết-h, poll=1, CÓ caveat repair) và O8 T0 DONE
  ~1 s trước khi cửa mở.
+ **CỘNG DỒN MỚI (44 lượt hợp lệ): P1 192/196, P2 187/187,
  P3-A1 165/196, P3' 156/168 occurrence = 127/131 distinct-seq,
  P7 90/90.** Lượt #50 MẠNH (8 seq (c2), cả 5 trụ ĐÚNG — lượt
  nhiều seq nhất kể từ đợt 177). Sổ distinct-seq ĐÃ THĂNG CẤP
  as-of-181 (md5 `4ea6802e…`; valid_rounds_p3 32;
  non_dat [260, 283, 364, 498] — không đổi).
+ **BOOT ĐO: e62eef3f (số hiệu #98 — T0-181 XÁC NHẬN 9 nguồn;
  btime 23:12:23Z; gap #97→#98 = 576 s NGẮN BẤT THƯỜNG).
  GATE0 = T5 (POSTBOOT_PASS #98, 00:16:31Z).** 0 reboot TRONG
  cửa sổ attempt và trong cả phiên đo (35 poll, 1 boot duy nhất).
**Ngày:** 24/11/2026 (lượt cron 06:35 +07 24/11 = 23:35:51Z 23/11).
**Boot đo:** MỘT boot — e62eef3f (#98, btime 23:12:23Z; 35 poll,
1 cửa mở → attempt1 hợp lệ).

## 0. Verdict tổng

- **#50 CÓ LƯỢT HỢP LỆ (attempt1-e62eef3f).**
  Cửa mở duy nhất ở poll #33 (00:20:12Z):
  gate0=T5 (POSTBOOT_PASS #98, 00:16:31Z) + PB=0 + RAM 1910 MB +
  load1 1,90/load5 1,42 + lock khong + blockers 0 + apt 0 →
  attempt1 chạy 00:20:12–00:23:41Z:
  **20/20 pass, lớp B DAT 5/5, tickCost median 50,0 ms ≤60**
  → LUOT HOP LE, poller thoát 0 lúc 00:24:06Z. Ngân sách dùng
  **1/3**.
- **Một boot đo, không reboot trong phiên đo:** instance 2
  (33 poll) chạy trọn trên boot e62eef3f; 0 lần poller chết;
  0 attempt bị giết. 0 reboot mới trong phiên T4.
- **Chuỗi lượt yên hợp lệ: 43 → 44.** Median tickCost attempt1 =
  50,0 ms (chuỗi 44 lượt: mean 47,9, min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60 — chuỗi ĐÃ KIỂM ĐẦY ĐỦ 44 số: xem
  F-181-T4-6, §7; median #49 (44,0) + #50 (50,0) đều có mặt).
- **Điều kiện GIỮ NGUYÊN như #49 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **QUYẾT (p) ĐỢT 179 ĐÃ TRIỂN KHAI + KIỂM CHỨNG LIVE LẦN 2
  (xem §6, F-181-T4-2):** check-classb + toàn bộ analyzer chạy
  NGOÀI cửa sổ attempt — poller gọi `run-analyzers-181.sh`
  SAU khi run-attempt thoát (attempt-done ghi 00:23:41Z),
  trước eval_attempt; analyzer chạy 00:23:41–00:24:06Z.
  **KIỂM CHỨNG: file `round109-k7/analyze-k7-skiplatest.txt`
  mtime VẪN 18:13:20Z (đợt 179) — 0 ghi mới; 0 file
  round180-* nào bị sửa sau marker attempt (find ở
  inner-end trả rỗng).**
- **0 VI PHẠM THEO T4 — CHUỖI 0 VI PHẠM 2 → 3** (chuỗi tính
  lại từ 1 ở đợt 179 theo quyết (p); đợt này giữ sạch:
  ps-before/after attempt1: 0 dòng m56; không script nặng nào
  của luồng khác trong cửa sổ attempt; T4 không probe dpkg
  nào trong cả phiên — chỉ đọc `wc -l` dpkg.log + `pgrep -x`).
  Mọi phân tích của chính T4 đều làm SAU khi poller thoát
  (từ ~00:24Z; p1p3p7 + distinct-seq + stats chạy tay sau đó).
  Pre-flight + 2 test poll chạy TRƯỚC khi mở poller / ngoài
  cửa sổ attempt. **KHÔNG khởi động script nặng nào trong lúc
  gate0wait với cả hai gate xanh** (chỉ poller + check-only
  nhẹ theo thiết kế).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt1, lúc đóng — không đổi;
  mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round181-t4.done` viết lúc đóng,
  CÓ NỘI DUNG, trong hạn cờ ~02:00Z; boot lúc attempt1 là
  e62eef3f — không đổi trong suốt phiên đo.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (23:55:47Z),
ghi vào `hidden_files/round181-t4/preflight-181.txt` — **PASS**
(0 sót; grep stale-string sạch ngay lần đầu — như đợt 180).
Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–180:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq as-of-180 md5
  `e8a69047…` (occ 148/160, distinct 122/126,
  valid_rounds_p3 31).
- **10/10 analyzer** có mặt (+ `run-analyzers-181.sh` —
  quyết (p)); `bash -n` OK 5 script
  T4 (poll-wait, run-attempt, run-analyzers, inner,
  check-classb); `py_compile` OK 13 file py; Playwright-core
  có mặt (webkit object); media `stripes-nonperiodic.mp4`
  (140.828 B) có mặt; không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-24
  01:30:00 UTC` → **1795483800** = 01:30Z (hạn cờ ~02:00Z =
  1795485600, hạn cứng 02:35Z = 1795487700); grep 0 hit cho
  `22:30`/`23:00Z`/`23:35Z`/`round179-t5`/`poll-test-180`/
  `WebKit #49`/`T4-180a`/`default=180` trong script mới;
  `round179` chỉ còn trong comment quyết (p) đợt 179 +
  F-179-T4-5 (có chủ đích).
- **Copy-forward 180 → 181:** deadline `22:30Z` → `01:30Z`;
  hạn cờ/cứng `23:00Z`/`23:35Z` → `02:00Z`/`02:35Z`; T5FLAG
  chính `round181-t5/` + fallback `round180-t5/`; W trong 5
  script ĐÃ LÀ `round181-t4`; `T4-180a` → `T4-181a`;
  `default=180` → `default=181`; `WebKit #49` → `#50`;
  glob chống nhiễu `round179-*` → `round180-*`.
  (Grep stale-string sau copy-forward sạch ngay lần đầu —
  F-177-T4-6 không tái diễn; 2 dòng echo deadline cũ
  `2026-11-23T22:30:00Z` phát hiện + sửa trước pre-flight.)
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 23 file làm việc (không copy log/
  JSON kết quả đợt 180); **`tree-md5.txt` KHÔNG có trong
  danh sách cleanup (F-175-T4-1 đã sửa) — còn nguyên,
  nội dung 530e10a7.**
- **Freeze check (F-164-T4-1):** `round180-t4` còn **0 file
  mtime ≥ 23:35:51Z** (giờ mở đợt 181).
- **GATE0 LÚC MỞ: CHƯA ĐẠT TRÊN BOOT #98 — khác đợt 180
  (lúc mở đã đạt).** dpkg.log 2 dòng (replay chưa xong);
  round181-t5 chưa tồn tại; T5-181 chưa viết POSTBOOT_PASS;
  postboot check-only chạy tay **exit 1 FAIL** (GST hệ thống
  0 plugin, thiếu 11 gói apt — root chưa bền, đúng mẫu #96;
  xem `preflight-postboot-181.log`). Gate0 chỉ đạt ở poll
  #29 sau khi T5-181 viết cờ (xem §1 + §4).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (23:55:55Z): RAM 1138 MB, load1 2,36/load5 1,19,
  gate0=khong-dat, apt=0, dpkg 2.
  Lần 2 (23:55:57Z): RAM 1126 MB, load1 2,36/load5 1,19,
  gate0=khong-dat, apt=0, dpkg 2. Cửa chưa mở vì gate0
  chưa đạt + load1 >2 — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`).
- **RAM lúc mở 1126–1257 MB; load1 2,36–2,62 lúc mở** — cửa
  chỉ mở khi đủ mọi điều kiện (poll #33, 00:20:12Z).
- **F-176-T4-2 ĐÃ SỬA + KIỂM CHỨNG LIVE đợt này (lần 5):**
  `check-classb-t4.sh` đếm sampler n chỉ trên dòng `boot=`
  — attempt1 ghi n=100 = đúng 100 mẫu thật (xem
  F-181-T4-7; attempt dài ~209 s nên 100 mẫu; header
  `sampler-start` không tính).

## 1. Poller — 35 poll thật (2 test + 33 trên #98), 1 lần cửa mở, 0 reboot trong phiên đo

- **Instance 1 — TEST (POLL_TEST=1), 2 poll, boot e62eef3f
  (23:55:55Z, 23:55:57Z):** cả 2 đều gate0=khong-dat
  (postboot exit=1), load1 2,36, load5 1,19, RAM 1138/1126 MB,
  lock=khong, blockers=0, apt=0 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần).
  2 poll này nằm trong `poll-test-181.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot e62eef3f, 33 poll (23:56:06–00:20:12Z),
  1 lần cửa mở:** RAM ≥1024: 4/33 (min 355, max 1910 MB);
  500–1023: 15/33; **<500: 14/33**; load1<2: 29/33;
  load5<2: 33/33; gate0: **T5 5/33** (từ poll #29);
  lock=khong 30, co 3 (T0 giữ, poll #30–#32); blockers>0:
  3 poll; apt>0: 23 poll; dpkg 2 → 202 → 804.
- **Giai đoạn 1 — gate0 chưa đạt, replay đang chạy (poll #1–#28,
  23:56:06–00:16:24Z):** postboot exit=1 suốt, t5flag=cu
  (cờ round180-t5 là của boot #95, mtime < btime #98);
  apt>0 từ poll #6 (apt-get replay), dpkg 2 dòng tới poll #27
  rồi 202 ở #28. RAM tụt dần 1117 → 355 MB (replay ngốn RAM).
  Cửa KHÔNG MỞ ĐƯỢC vì thiếu gate0 + thiếu RAM.
  Chuỗi RAM<500 dài nhất **14 poll (#15–#28, 00:06:38–
  00:16:24Z: 491/423/400/369/360/375/355/377/413/471/441/
  449/454/449 MB)** — dài nhất từ trước tới nay trong log T4
  (đợt 179/180: chuỗi 4). Giao T9-181 đối chiếu balloon
  trên #98.
- **Giai đoạn 2 — gate0 đạt nhưng RAM chưa đủ (poll #29,
  00:17:09Z):** T5-181 viết POSTBOOT_PASS #98 lúc 00:16:31Z
  (repair-sớm-quyết-h, poll=1 — xem §4); dpkg 804; apt=0;
  postboot exit=0. Nhưng RAM chỉ 500 MB → cửa KHÔNG MỞ.
- **Giai đoạn 3 — T0 giữ lock + blockers (poll #30–#32,
  00:17:55–00:19:26Z):** T0-round181 giữ vite.lock
  (pid 209655, port 5560) + blockers 5/5/1 (O8 T0 trên #98);
  load1 2,19/1,47/2,17; RAM 749 → 707 → 1243 MB. Cửa KHÔNG MỞ
  ĐƯỢC vì thiếu lock + blockers + load (tái diễn dạng
  F-180-T4-4 — xem §6, F-181-T4-4). T0 chạy O8 trên #98 trong
  lúc này (xem §3).
- **Giai đoạn 4 — cửa mở (poll #33, 00:20:12Z):**
  load1 1,90/load5 1,42, RAM 1910 MB, gate0=T5, PB=0,
  apt=0, lock=khong, blockers=0, tree=YES →
  **CỬA MỞ, attempt1 chạy ngay** (~1 s SAU khi O8 nhả lock —
  xem §3). Poller thoát 0 sau attempt1 hợp lệ (00:24:06Z),
  trước hạn cắt 01:30Z tới 66 phút.
- **Phân rã 35 poll thật:** RAM≥1024: 6/35; RAM 500–1023:
  15/35; RAM<500: **14/35**. load1<2: 29/35; load5<2: 35/35.
  **Stats "gan-mo" đếm 2 = 1 mở cửa thật (#33) + 1 poll đủ
  load+RAM nhưng thiếu gate0 (#3, 23:57:36Z: RAM 1234,
  load1 1,65 — xem F-181-T4-8): poll #3 KHÔNG mở cửa vì
  gate0 chưa đạt — CẦN đọc kèm điều kiện gate0 như
  F-179-T4-1.** gate0: T5 5/35 (5 poll instance 2; 2 test poll
  khong-dat). blockers>0: 3 poll (toàn lúc T0
  giữ lock). apt>0: 23 poll (toàn lúc replay). **RAM <500 MB:
  14/35 poll** (chuỗi dài nhất 14, xem trên). Ghi nhận để
  T9-181 đối chiếu headroom/balloon trên #98.

## 2. Attempt — 1 attempt (hợp lệ ngay lần đầu), ngân sách dùng 1/3

- **Attempt1 — attempt1-e62eef3f, 00:20:12–00:23:41Z,
  LUOT HOP LE (20/20 + lớp B 5/5 + tickCost median 50,0 ms).**
  - Vite lock v2: lấy ticket ngay (chờ 0s, giữ ~209 s).
    Xvfb :193 lên 00:20:16Z. WebKit 27.2, app boot OK.
    Pass 20 xong ~00:23:36Z (rAF/pass median 36);
    partial JSON 20/20 ghi ~00:23:36Z (tickCost n=618 lúc cuối;
    blendTick n=504, c2DrawLog n=1199).
  - Probe exit 0; JSON 3.374.555 B; flip wallMs=26143;
    tickCost total n=618 median=**50,0** p90=72,3 (analyzer;
    kiểm độc lập nearest-rank = 72 — xem dưới) max=148 min=28;
    hậu flip+2000ms n=452 median=50,0. BlendTick/pass=25,2;
    rAF/pass median=36 (min 32, max 43). pageErrs=[].
  - Lớp B attempt1: **DAT 5/5** (sampler n=100 — đúng 100 mẫu
    thật sau fix F-176-T4-2; load1 max 2,39, RAM min 790 MB
    max 1803 MB, 0 mẫu <500 MB, **29/100 mẫu <1024 MB**
    (cảnh báo, không vi phạm — RAM trong attempt đang hồi);
    load5 cuối 0,98; boot không đổi; dpkg delta 0;
    apt/dpkg = 0). Ps-before/after: **0 dòng m56**.
  - Per-pass (20 pass): tick median 36,5–58,0 ms; wall
    2949–3507 ms; load1 mean 0,78–2,22; RAM mean 795–1264 MB.
    Tương quan Pearson: median~load1_mean r=-0,17;
    median~RAM_mean r=-0,15 (chỉ mô tả, không kết luận nhân quả).
  - Kiểm chứng độc lập từ JSON gốc (T4 tự tính bằng
    statistics.median thuần Python, không dùng analyzer):
    passes=20, engine=webkit, webkitVersion 27.2,
    pageErrs=[]; tickCost (trường `total`) n=618 median=50,0
    p90=72 (nearest-rank; analyzer nội suy 72,3 — lệch 0,3 do
    cách tính p90, median/max/min KHỚP từng số) max=148
    min=28; hậu flip+2000ms n=452 median=50,0 — KHỚP;
    c2DrawLog n=1199, blendTick n=504.
- **Ngân sách dùng 1/3.** Không attempt nào bị reboot giết
  (0 reboot trong phiên đo); 2 attempt còn lại chưa dùng.

## 3. B2 spike / đối chiếu sampler T9 + O8 T0 (theo nhiệm vụ đợt 177–181)

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT HỢP LỆ (attempt1,
  00:20:12–00:23:41Z): 0 SPIKE.** Sampler T4 (2 s, n=100):
  load1 max 2,39 (≤4 nên lớp B DAT); poller poll #33
  load1 1,90; poll #32 (trước cửa sổ) load1 2,17 —
  không spike. **Attempt1 chạy trong cửa sổ hoàn toàn
  sạch B2.**
- **T9-181 CHƯA CÓ `b2-spikes.log` lúc T4 đóng** (thư mục
  `hidden_files/round181-t9/` chưa tồn tại; T9 làm việc ở
  `~/workspace/repo-1/round181-t9/` — chỉ có sampler +
  b2watch.sh, chưa có file spike — F-181-T4-5): đối chiếu B2
  độc lập từ phía T9 KHÔNG CÓ đợt này (tái diễn F-180-T4-5).
  Bù lại, sampler T9 (60 s, `ram-sampler.log`) có 4 mẫu trong
  cửa sổ attempt: load1 1,65 / 0,67 / 0,68 / 0,54 — đều ≤4,
  KHÔNG spike. Kết luận 0 spike đợt này dựa trên sampler T4 +
  poller + 4 mẫu T9 — đủ cho verdict lớp B, nhưng T10/T9 đối
  chiếu lại khi T9-181 có file.
- **O8 T0 TRÊN CÙNG BOOT — BÀN GIAO SẠCH, 0 CHỒNG:**
  T0-round181 chạy O8 trên #98, DONE ~00:20:11Z (WebKit 21/21
  ×2 + Chromium 21/21 — xem NOTES T0; bắt đầu 00:17:24Z,
  53 s sau POSTBOOT_PASS #98); T4 poll #30–#32
  trong cửa sổ O8 đều ghi lock=co thread=t0-round181 +
  blockers → cửa yên KHÔNG mở; poll #33 (00:20:12Z, **~1 s
  SAU khi O8 nhả lock**) "CUA YEN MO" (RAM=1910MB) → T4 chạy
  attempt1 NGAY sau O8. **0 giây chồng lấn giữa O8 và
  attempt1.** T0 kiểm cuối 00:20:36Z: 0 process sót của T0
  (chỉ còn X193 của T4 — xem F-181-T4-3).
- **Ghi trong cửa sổ (quyết (p) — xem F-181-T4-2):** 0 file
  ngoài thư mục round181-t4 bị ghi trong cửa sổ attempt
  (find round180-* sau marker trả rỗng; file
  round109-k7/analyze-k7-skiplatest.txt mtime vẫn 18:13:20Z
  đợt 179; labellag/lag5 round180-t4 mtime vẫn 21:21:05Z/
  21:21:22Z đợt 180). Analyzer + classb chạy 00:23:41–
  00:24:06Z, SAU khi run-attempt thoát — NGOÀI cửa sổ attempt.

## 4. Replay/postboot — POSTBOOT_PASS #98 ĐÃ CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat)

- **Boot e62eef3f (btime 23:12:23Z, số hiệu #98 — T0-181 XÁC
  NHẬN 9 nguồn; gap #97→#98 = 576 s NGẮN BẤT THƯỜNG).
  Replay HỆ THỐNG tới 00:16:31Z (T5-181 repair-sớm-quyết-h:
  dpkg 2 → 202 (poll #28) → 804; apt chạy tới ~00:16Z).**
- **POSTBOOT_PASS #98 ĐÃ CÓ 00:16:31Z** (boot+64m;
  watcher-181, **mode repair-som-quyet-h, poll=1**, dpkg 804
  dòng, cache 111 .deb, lists 75; postboot PASS poll1 độc lập
  exit 0 lúc 00:16:31Z; cờ cũ 8d2a69df lưu
  POSTBOOT_PASS-8d2a69df). **Cờ REPAIR-SỚM — CÓ caveat repair**
  (khác #95 replay-đầy-đủ, poll=0; giống #96/#94
  repair-sớm, poll=1). Gate0=T5 từ poll #29.
  **T4-check-only KHÔNG cần dùng làm gate0 chính trên #98**
  (chỉ dùng kèm điều kiện PB=0; check-only của T4 FAIL độc
  lập từ test poll #1 tới poll #28, exit 1 — replay chưa xong).
- **0 REBOOT trong phiên đo.** Số hiệu #98 đã xác nhận
  (T0-181, 9 nguồn); (m) #98 + INSIDE #98 thuộc T2-181;
  #98 có giết holder không thuộc T6-181. POSTBOOT_PASS #98
  CÓ caveat — giá trị chân gate (a) thuộc T8/T10 quyết.
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-181 báo cáo (driver
  hb128 làm chuẩn từ đợt 180; Plan B B1 bọc resetPlayhead0
  triển khai từ đợt 181 theo quyết (j) đợt 180).
  (T4 chỉ ghi: attempt1 chạy sạch 20/20 ngay lần đầu —
  không wedged.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND181_T4_WEBKIT_QUIET50_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round181-t4/`):**
  `poll-wait-t4-181.sh` (deadline 01:30Z 24/11 + cờ T5
  round181-t5/ + fallback round180-t5/),
  `run-attempt-181.sh` (lượt yên #50 — KHÔNG còn gọi
  classb/analyzer, xem quyết (p)),
  `run-analyzers-181.sh` (chạy classb + 9 analyzer
  NGOÀI cửa sổ attempt; argv[2] tường minh cho 3 analyzer
  ghi-file),
  `distinct-seq-181.py` (ĐÃ DÙNG LIVE trên dữ liệu attempt1 —
  xem §7; khi chạy từ `apps/web/scripts/` phải truyền `--ledger`
  trỏ tới sổ, nếu không helper lỗi FileNotFoundError).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–180, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round181-t4/` — theo đúng mẫu 149–180: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round181-t4/`, md5 `078938cf...`,
  giống hệt bản đợt 156–180).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-181.sh`, `run-attempt-181.sh`,
  `run-analyzers-181.sh`,
  `t4-attempt-inner.sh` (W = round181-t4 + glob check nhiễu
  chéo round180-*), `check-classb-t4.sh` (W = round181-t4 +
  đếm sampler n chỉ dòng `boot=` — fix F-176-T4-2),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-181.py` (thống kê §A;
  footer ĐÃ CẬP NHẬT cộng dồn 44 lượt),
  `distinct-seq-181.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-181: 127/131 distinct, occ 156/168, valid_rounds_p3 32,
  non_dat [260, 283, 364, 498];
  md5 `4ea6802e…`),
  `distinct-seq-ledger-181-proposed.json` (bản helper ghi ra
  trong live run — ĐÃ DÙNG để thăng cấp sổ; audit trail),
  `preflight-181.txt` + `preflight-postboot-181.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2).
- **Log/evidence (hidden_files/round181-t4/, không stage):**
  `poll-t4.log` (33 poll instance 2 trên #98 + 0 REBOOT PHAT
  HIEN trong phiên đo), `poll-test-181.log` (2 test poll +
  2 TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log` (start poller + 1 CUA YEN MO +
  attempt1 LUOT HOP LE),
  `postboot-t4-181-gate0wait-*.log` (check-only mỗi 4 poll:
  #1/#5/#9/#13/#17/#21/#25/#29/#33 — PB=1 tới #28, PB=0 từ #29),
  `stats-181-output.txt` (output stats-181.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có
  blockers: #30–#32 T0 giữ lock),
  `preview-b-f3-flip-webkit-t4-attempt1-e62eef3f.json`
  (3.374.555 B, 20/20, probe exit 0),
  `classb-t4-attempt1-e62eef3f.txt` (DAT 5/5),
  `analyze-t4-attempt1-e62eef3f-*.txt` (10 analyzer attempt1,
  gồm p1p3p7 chạy TAY — xem F-174-T4-5, không tái diễn),
  `coverage-check-attempt1-e62eef3f.txt` (8/8),
  `load-mid-t4-attempt1-e62eef3f.log` (n=100 mẫu thật),
  `run-webkit-t4-attempt1-e62eef3f.log` (20/20),
  `ps-before/after-t4-attempt1-e62eef3f.txt` (0 dòng m56),
  `dpkg-lines-before-attempt1-e62eef3f.txt` (804) +
  `apt-history-before-attempt1-e62eef3f.txt`,
  `attempt-done-attempt1-e62eef3f` (exit=0).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  00:24:06Z exit 0; vite :5187 trống; Xvfb :193 không còn
  process nhưng socket X193 vẫn nằm trong `/tmp/.X11-unix/`
  — xem F-181-T4-3).

## 6. Sai số F-181-T4-1..8 (+ nợ cũ)

- **F-181-T4-1 — STATS "GAN-MO" ĐẾM 2, CHỈ 1 MỞ CỬA THẬT
  (GHI NHẬN — TÁI DIỄN DẠNG F-179-T4-1).** Stats đếm poll đủ
  load1<2 + load5<2 + RAM≥1024: 2 poll (#3 + #33). Poll #3
  (23:57:36Z: RAM 1234, load1 1,65) KHÔNG mở cửa vì gate0
  chưa đạt (postboot exit=1, t5flag=cu) — chỉ #33 mở cửa thật.
  Stats và cửa thật KHÔNG khớp nếu đọc stats một mình; phải
  đọc kèm điều kiện gate0 (khác F-180-T4-8 sạch).
- **F-181-T4-2 — QUYẾT (p) ĐÃ TRIỂN KHAI + KIỂM CHỨNG LIVE
  LẦN 2 (ĐÃ SỬA — F-179-T4-5 KHÔNG TÁI DIỄN).** (i) Analyzer +
  classb tách khỏi run-attempt thành `run-analyzers-181.sh`,
  poller gọi SAU khi run-attempt thoát (00:23:41Z) —
  analyzer chạy 00:23:41–00:24:06Z, NGOÀI cửa sổ attempt.
  (ii) 3 analyzer ghi-file được truyền argv[2] tường minh
  → không còn ghi outpath mặc định. **Kiểm chứng: file
  round109-k7/analyze-k7-skiplatest.txt mtime VẪN
  18:13:20Z (đợt 179); analyze-t4-attempt1-95b483a2-labellag.txt
  (21:21:05Z) + analyze-t4-attempt1-95b483a2-lag5.txt (21:21:22Z)
  trong round180-t4 cũng không đổi; find round180-* sau marker
  trả rỗng.**
- **F-181-T4-3 — X193 SOCKET CÒN NẰM LẠI LÚC ĐÓNG, KHÔNG
  CÒN PROCESS (ghi nhận — khác F-180-T4-3).** Xvfb :193
  của attempt1 lên 00:20:16Z; lúc đóng socket X193 vẫn có
  trong `/tmp/.X11-unix/` (mtime 00:20Z) NHƯNG 0 process
  Xvfb nào sống (ps kiểm trực tiếp). Socket mồ côi, không
  phải Xvfb đang chạy — T4 không dọn tay vì poller đã thoát
  trước khi kiểm. Ghi rõ để T10 khỏi nhầm thành "Xvfb còn
  chạy" hay "T4 đã dọn tay".
- **F-181-T4-4 — T0-ROUND181 GIỮ VITE.LOCK + BLOCKERS TRONG
  LÚC POLLER CHỜ GATE (tái diễn dạng F-180-T4-4/F-179-T4-4).**
  Poll #30–#32: lock=co (thread=t0-round181, pid 209655,
  port 5560) + blockers 5/5/1; load1 leo tới 2,19. Vì chưa
  có attempt nào nên không ảnh hưởng verdict; O8 T0 DONE
  ~00:20:11Z và nhả lock trước khi cửa mở ~1 s — bàn giao
  sạch (xem §3). Giao T0/T10 đối chiếu lịch các luồng trong
  cửa sổ 00:17–00:20Z.
- **F-181-T4-5 — T9-181 CHƯA CÓ `b2-spikes.log` LÚC T4 ĐÓNG
  (GHI NHẬN — TÁI DIỄN F-180-T4-5).** Thư mục
  `hidden_files/round181-t9/` chưa tồn tại lúc 00:25Z; T9
  làm việc ở `~/workspace/repo-1/round181-t9/` (sampler +
  b2watch.sh, chưa có file spike) — đối chiếu B2 độc lập từ
  phía T9 KHÔNG CÓ đợt này. Bù lại 4 mẫu sampler T9 trong
  cửa sổ attempt đều ≤1,65 — 0 spike (xem §3).
- **F-181-T4-6 — CHUỖI MEDIAN §7 ĐÃ KIỂM ĐẦY ĐỦ TRƯỚC KHI
  NỘP (theo nhiệm vụ đợt 181).** Chuỗi 44 số: tổng 2105,5;
  mean 47,9; min 39,0; max 60,0; 0 vượt 60 — median #49
  (44,0) + #50 (50,0) đều có mặt (xem §7). F-180-T4-6
  không tái diễn.
- **F-181-T4-7 — SAMPLER n=100, KHÔNG PHẢI 101 (GHI NHẬN —
  KHÔNG PHẢI LỖI ĐẾM).** Attempt1 dài ~209 s (00:20:14–
  00:23:41Z sampler) → 100 mẫu thật 2 s/lần (đếm chỉ dòng
  `boot=` — fix F-176-T4-2 vẫn đứng; header `sampler-start`
  không tính). Giống đợt 180 (n=100), khác đợt 179 (n=101).
- **F-181-T4-8 — P90 TICKCOST: ANALYZER 72,3 vs KIỂM ĐỘC LẬP
  72 (GHI NHẬN — KHÔNG PHẢI LỆCH DỮ LIỆU).** Analyzer nội
  suy p90 = 72,3; kiểm độc lập bằng statistics.median-style
  nearest-rank = 72. Median/max/min/n KHỚP từng số
  (50,0/148/28/618; hậu flip 452/50,0). Lệch 0,3 ms chỉ do
  cách tính phân vị, không ảnh hưởng verdict (median ≤60).
- **F-180-T4-1 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (xem
  F-181-T4-1 — dạng mới: gan-mo 2, cửa thật 1).**
- **F-180-T4-2 — KHÔNG TÁI DIỄN (xem F-181-T4-2 — quyết (p)
  kiểm chứng live lần 2).**
- **F-180-T4-3 — TÁI DIỄN DƯỚI DẠNG F-181-T4-3** (X193 —
  socket mồ côi, 0 process).
- **F-180-T4-4 — TÁI DIỄN DƯỚI DẠNG F-181-T4-4.**
- **F-180-T4-5 — TÁI DIỄN DƯỚI DẠNG F-181-T4-5** (T9-181
  chưa có `b2-spikes.log` lúc T4 đóng).
- **F-180-T4-6 — KHÔNG TÁI DIỄN (xem F-181-T4-6).**
- **F-179-T4-1 — TÁI DIỄN DƯỚI DẠNG F-181-T4-1.**
- **F-179-T4-5 — ĐÃ SỬA + KIỂM CHỨNG LIVE LẦN 2 (xem
  F-181-T4-2).**
- **F-178-T4-1 — KHÔNG TÁI DIỄN.** 0 tick probe-mo của T9
  trong cửa sổ attempt.
- **F-177-T4-4 — TÁI DIỄN DƯỚI DẠNG F-181-T4-5.**
- **F-177-T4-6 — KHÔNG TÁI DIỄN.** Grep stale-string sau
  copy-forward sạch ngay lần đầu (0 sót).
- **F-176-T4-1 — KHÔNG TÁI DIỄN.** 0 vi phạm quy tắc đứng theo
  T4 — chuỗi 0 vi phạm 2 → 3 ở đợt 181.
- **F-176-T4-2 — ĐÃ SỬA + KIỂM CHỨNG LIVE LẦN 5 (xem §0b,
  F-181-T4-7).**
- **F-175-T4-1 — KHÔNG TÁI DIỄN.** `tree-md5.txt` không còn
  trong danh sách cleanup copy-forward; test poll lần 1
  tree=YES ngay.
- **F-175-T4-2 — KHÔNG TÁI DIỄN THEO T4 (xem §0 + F-181-T4-2).**
- **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG F-181-T4-4.**
- **F-175-T4-5 — KHÔNG TÁI DIỄN TRONG PHIÊN ĐO.** 0 reboot
  trong cửa sổ attempt / phiên đo.
- **F-174-T4-1 — KHÔNG TÁI DIỄN.** Attempt1 chạy sạch 20/20
  ngay lần đầu (không wedged như attempt1 đợt 176).
- **F-174-T4-3 — KHÔNG TÁI DIỄN.** Kiểm process lúc đóng dùng
  `ps` trực tiếp (0 process T4, 0 Xvfb) — không dùng `pgrep -f`.
- **F-174-T4-4 — KHÔNG TÁI DIỄN.** `p1p3p7` chạy tay đúng dạng
  `<json> "<seqs>"` ngay lần đầu, exit 0.
- **F-174-T4-6 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (RAM <500:
  14/35 poll — nhưng TOÀN trong lúc CHỜ gate, do replay;
  RAM min trong attempt1 790 MB, 0 mẫu <500).**

## 7. P3' cộng dồn (MỚI — 44 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 181 (MỚI): P1 192/196, P2 187/187,
  P3-A1 165/196, P3' 156/168 occurrence = 127/131 distinct-seq,
  P7 90/90** (44 lượt hợp lệ — #50 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 180 §6: "43 lượt hợp lệ" — nay 44).
- **Đóng góp lượt #50 (attempt1-e62eef3f, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=8 occurrence / 8 distinct-seq [183, 212, 237, 261, 334,
  359, 432, 455], stall 7/7/6/5/4/3/5/4 — TẤT CẢ ĐẠT.
  **237, 261, 334, 359, 432 MỚI** (chưa có trong sổ);
  183 ĐÃ THẤY (mới ở đợt 177), 212 ĐÃ THẤY (mới ở đợt 179),
  455 ĐÃ THẤY (mới ở đợt 175) — helper xác nhận; T4 kiểm tay
  lại sổ as-of-180: cả 5 seq mới vắng thật.
  - **P1 — ĐÚNG 8/8 occ** (cả 8 seq gần run-end ±1 tick; trong
    18 run_end seqs; baseline 54/371, p=2,0e-07 — verdict
    ĐÚNG theo luật DEF §3 vì n=8 ≥3 VÀ p<0,01). Cộng dồn
    184/188 → **192/196**.
  - **P2 ĐÚNG — 8/8 occ** (cả 8 seq lag +1f; DEF §4 chỉ đòi
    lag ≥ +1f; median/p90/max/min lag đều 1f, 0 âm). Cộng dồn
    179/179 → **187/187**.
  - **P3-A1 — ĐÚNG 8/8 occ** (cả 8 seq đóng băng-tại-tick;
    baseline 82/370, p=5,8e-06 — verdict ĐÚNG theo luật DEF
    §5 vì p<0,01 và n≥3). Cộng dồn 157/188 → **165/196**.
  - **P3' 8/8 occ ĐẠT** (stall: 183=7, 212=7, 237=6, 261=5,
    334=4, 359=3, 432=5, 455=4). Cộng dồn 122/126 → **127/131
    distinct** (5 seq ĐẠT MỚI — 237, 261, 334, 359, 432);
    occurrence 148/160 → **156/168**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 47,
    0: 44}; đối chứng toàn bộ drawSrc post: {-1: 297, 0: 154},
    0/451 entry). Cộng dồn 82/82 → **90/90**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162).**
  Helper `distinct-seq-181.py` đọc sổ (as-of 180: 122/126
  distinct, occ 148/160), tính seq MỚI = tập hiệu với sổ,
  in cộng dồn mới, ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-181-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Live đợt 181:** sổ + stall/c2coverage attempt1-e62eef3f →
  **127/131 distinct, 156/168 occ** — khớp tính tay dưới đây.
  Sổ ĐÃ THĂNG CẤP: as-of 181, 127/131 distinct, occ 156/168,
  valid_rounds_p3 32, non_dat [260, 283, 364, 498] (không đổi;
  md5 sổ mới `4ea6802e…`). Helper KHÔNG cần back-test riêng
  đợt này (đã back-test khớp live 172 ở đợt 173, live
  174–181 đều khớp tính tay).
- **Kiểm chứng seq mới đợt 181:**
  helper xác nhận **237, 261, 334, 359, 432 MỚI**; **183, 212,
  455 ĐÃ THẤY**. Tính tay: distinct DAT 122 + 5 = **127**;
  distinct tổng 126 + 5 = **131**; occurrence DAT 148 + 8 =
  **156**, tổng 160 + 8 = **168**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — có thêm 8 mẫu (c2) mới đợt này:**
  P1 ĐÚNG 8/8 (p=2,0e-07) + P2 ĐÚNG 8/8 + P3-A1 ĐÚNG 8/8
  (p=5,8e-06) + P3' ĐẠT 8/8 + P7 ĐÚNG — **lượt MẠNH (8 seq
  (c2), 5/5 trụ ĐÚNG — lượt nhiều seq nhất kể từ đợt 177)**.
  Cộng dồn vẫn tăng đều (P2 187/187, P7 90/90).
- Chuỗi median tickCost 44 lượt (mới — ĐÃ KIỂM ĐẦY ĐỦ, xem
  F-181-T4-6):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 /
  39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 /
  58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 /
  44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 /
  53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 / 50,0 /
  45,0 / 49,5 / 44,0 / **50,0 ms** (tổng 2105,5; trung bình
  47,9 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 182

- **(a) #50 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 43 → 44.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT**
  (attempt1 hợp lệ trên boot e62eef3f, gate0=T5 với
  POSTBOOT_PASS #98 repair-sớm-quyết-h, poll=1, CÓ caveat
  repair — T8/T10 quyết; tiền lệ: #96 cũng repair-sớm, poll=1).
- **(b) P3' cộng dồn MỚI 44 lượt: P1 192/196, P2 187/187,
  P3-A1 165/196, P3' 156/168 = 127/131, P7 90/90:**
  helper đã dùng live khớp tính tay; sổ distinct-seq ĐÃ THĂNG
  CẤP as-of-181. **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới. Lượt #50 MẠNH (8 seq (c2)): P1 + P2 + P3-A1 + P3' +
  P7 đều ĐÚNG — lượt ĐÚNG 5 trụ đầu tiên kể từ đợt 177, nhiều
  seq nhất kể từ đợt 177.
- **(c) BOOT e62eef3f (số hiệu #98) — T0-181 ĐÃ XÁC NHẬN 9
  nguồn (gap #97→#98 = 576 s NGẮN BẤT THƯỜNG — nguyên nhân
  chưa xác định, host-side).** Dữ kiện T4: btime #98
  23:12:23Z; 0 reboot trong phiên đo.
  **(m) #98 (T2-181 + parent 181; ứng viên DƯƠNG sơ bộ
  +37,030 s); INSIDE #98 (T2-181; FULL144); #98 có giết
  holder không (T6-181).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale-string sạch ngay lần đầu
  (F-177-T4-6 không tái diễn); gate0 CHƯA ĐẠT lúc mở (replay
  #98 chưa xong — khác đợt 180).
- **(e) POSTBOOT_PASS #98 ĐÃ CÓ (00:16:31Z, boot+64m,
  mode repair-sớm-quyết-h, poll=1, dpkg 804): GHI NHẬN — cờ
  REPAIR-SỚM, CÓ caveat (giống #96/#94). Giá trị cho gate (a)
  thuộc T8/T10 quyết.** Hướng (3) VẪN ĐỨNG hay không — thuộc
  T5-181.
- **(f) RAM <500 MB: 14/35 poll (chuỗi dài nhất 14 poll #15–
  #28, trong lúc replay) — DÀI HƠN NHIỀU đợt 180 (6/20,
  chuỗi 4).** Nhưng RAM trong attempt1 min 790 MB (100 mẫu,
  0 mẫu <500, 29 mẫu <1024) — attempt hợp lệ chạy trên RAM
  đang hồi. Giao T9-181 đối chiếu balloon/E-208 trên #98.
- **(g) (m) #96/#97/#98 (T2-181 + parent 181; ứng viên DƯƠNG
  sơ bộ +41,129 / +39,441 / +37,030 s); (m) #56 lần 24
  (T2-181); mù #96?/#95?/#94?/#88? (hole-recheck lần 25)/#77?
  (T2-181); (c')/(f') — đợt này 0 kích hoạt mới (chờ T8-181);
  Plan B B1 triển khai từ đợt 181 (quyết (j) đợt 180 — chờ
  T8-181); 84l10 + Q3 heartbeat (T8-181, driver hb128 làm
  chuẩn); E-208 kết cục (T9-181); #96/#97/#98 có giết holder
  không (T6-181); prune lần 56 (T6-181); checklist (o)
  (T8-181); H3 chỉ giám sát thụ động; birefnet 0 thử lần 35;
  nhắc mọi luồng: KHÔNG chạy script nặng / KHÔNG probe dpkg
  trong cửa sổ attempt (đợt này T4 giữ 0 vi phạm — chuỗi 2 → 3);
  u2net là fallback chính thức; ci-security.yml vẫn 403 chờ
  user; TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT (attempt1,
  dpkg delta 0).** dpkg ổn định 804 suốt phiên đo (replay
  xong 00:16:31Z, trước khi T4 mở cửa); apt=0 trong cửa sổ.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (poll #33) → **CÓ lượt yên hợp lệ #50 cho chuỗi FULL PASS**
  (attempt1, boot e62eef3f, gate0=T5). T8 tự quyết O8 đợt này
  (cùng boot đo; O8 T0 trên #98 DONE ~00:20:11Z — ~1 s trước
  attempt1, 0 chồng).
- **(j) F-181-T4-1 (stats gan-mo 2, cửa thật 1 — đọc kèm
  gate0); F-181-T4-2 (quyết (p) kiểm chứng live lần 2 —
  F-179-T4-5 KHÔNG tái diễn); F-181-T4-3 (socket X193 mồ
  côi, 0 process); F-181-T4-5 (T9-181 chưa có `b2-spikes.log`
  lúc T4 đóng); F-181-T4-8 (p90 analyzer 72,3 vs kiểm độc
  lập 72 — lệch cách tính, không lệch dữ liệu).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-181.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-181.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-23T23:55:55Z - 2026-11-23T23:55:57Z, boot=e62eef3f
   RAM min=1126 max=1138 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 2/2 blockers>0: 0 apt>0: 0
   gate0: khong-dat=2
   lock: khong=2
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 33 poll, 2026-11-23T23:56:06Z - 2026-11-24T00:20:12Z, boot=e62eef3f
   RAM min=355 max=1910 >=1024: 4/33 500-1023: 15/33 <500: 14/33
   load1<2: 29/33 load5<2: 33/33 blockers>0: 3 apt>0: 23
   gate0: T5=5, khong-dat=28
   lock: co=3, khong=30
   dpkg 2->804
   chuoi RAM<500 dai nhat: 14 poll
-- TONG poll that: 35
-- RAM toan phien: min=355 max=1910 >=1024: 6/35 <500: 14/35
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 2/35
   gan-mo? #3 2026-11-23T23:57:36Z boot=e62eef3f RAM=1234 L1=1.65 L5=1.30 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #33 2026-11-24T00:20:12Z boot=e62eef3f RAM=1910 L1=1.90 L5=1.42 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round181-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot e62eef3f: 35 poll; RAM>=1024 lan cuoi: 2026-11-24T00:20:12Z #33; RAM<1024 lan dau: 2026-11-23T23:56:51Z #2 RAM=1010
-- cong don P3' (MOI, 44 luot hop le): P1 192/196 P2 187/187 P3-A1 165/196 P3' 156/168 occ = 127/131 distinct-seq P7 90/90
-- chuoi median 44 luot: n=44 mean=47,9 min=39,0 max=60,0 vuot-60: 0
```
