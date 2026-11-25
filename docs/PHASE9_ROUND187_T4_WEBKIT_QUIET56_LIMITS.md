# PHASE9_ROUND187_T4_WEBKIT_QUIET56_LIMITS.md

**Đợt:** 187. **Luồng:** T4 — đo lượt yên WebKit #56 trên 1 boot
+ **#56 CÓ LƯỢT HỢP LỆ NGAY ATTEMPT ĐẦU — attempt1-6f1d9f87
  20/20 pass + lớp B ĐẠT 5/5 + tickCost median 39,0 ms ≤ 60.
  Ngân sách dùng 1/3. CHUỖI LƯỢT YÊN HỢP LỆ 0 → 1 (KHỞI ĐỘNG
  LẠI — tiền lệ đợt 179: đợt sạch đầu tiên sau khi đứt thì
  chuỗi tính lại từ 1; parent quyết cuối).**
  Poller thoát 21:09:27Z sau khi tuyên lượt hợp lệ — trước hạn
  cắt 22:30Z, trong hạn cờ ~23:00Z.
+ **BOOT ĐO: MỘT boot — 6f1d9f87 (#109, btime 20:30:33Z; T0-187
  XÁC NHẬN 9 nguồn tươi; số hiệu #109 theo quyết (e) đợt 186
  — chấp nhận cách đếm T0-186). 0 reboot trong phiên đo.**
+ **CỘNG DỒN MỚI (48 lượt hợp lệ): P1 215/219, P2 210/210,
  P3-A1 187/219, P3' 179/191 occurrence = 139/142 distinct-seq,
  P7 113/113.** Sổ distinct-seq THĂNG CẤP as-of-187 (md5
  `ea978f23`); seq mới ĐẠT 288, 488.
**Ngày:** 25/11/2026 (lượt cron 03:35 +07 25/11 = 20:35:51Z 24/11).
**Boot đo:** 6f1d9f87 (27 poll: 2 test + 25 poller).

## 0. Verdict tổng

- **#56 CÓ LƯỢT HỢP LỆ ngay attempt đầu.** Cửa yên mở 1 lần
  (poll #25), chạy 1 attempt trên boot #109 — 20/20 pass +
  lớp B 5/5 + tickCost median 39,0 ms ≤ 60. Ngân sách **1/3
  (còn 2)**.
- **Chuỗi lượt yên hợp lệ: 0 → 1 (KHỞI ĐỘNG LẠI, đề xuất).**
  Chân lượt yên cho chuỗi FULL PASS **CÓ đợt này** (đợt 186
  chuỗi FULL PASS về 0 — đợt này có thể lên 1 nếu 4 chân còn
  lại đủ cùng boot #109: gate (a) #109 ✓ KHÔNG caveat, O8 T0
  ✓ 3/3, O8 T8 + harness thuộc T8-187; parent quyết cuối).
- **Median tickCost 39,0 ms — BẰNG min của chuỗi 48 lượt hợp lệ**
  (xem F-187-T4-6: boot #109 nhanh/sạch, khác hẳn #107 đợt
  186 với median 60,0/68,0/79,0).
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 7: ĐẠT (xem §6,
  F-187-T4-4).** 0 file analyzer nào ghi trong cửa sổ attempt;
  file skiplatest mặc định mtime vẫn 18:13:20Z (đợt 179) —
  0 ghi mới.
- **0 VI PHẠM PHÍA T4 — đề xuất CHUỖI ĐỢT SẠCH 2 → 3** (parent
  quyết cuối; đợt 186 chuỗi 1 → 2). Phía T4 giữ sạch: không
  khởi động script nặng nào trong lúc gate0wait; không probe
  dpkg nào trong cả phiên; mọi phân tích đều làm SAU khi
  attempt-done đã ghi (kiểm chứng live lần 7 ĐẠT). B2 ĐẠT
  (load1_max 2,93, dư 1,07) — phân bổ tự-tải/lạ-tải xem §3
  (luật B2 KHÔNG TÁCH đợt này theo quyết (p) đợt 186).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, mọi poll đều tree=YES, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round187-t4.done` viết lúc đóng,
  CÓ NỘI DUNG, trong hạn cờ ~23:00Z. **REBOOT MỚI 912f4a97
  (btime 21:13:21Z) xảy ra SAU khi poller thoát 21:09:27Z —
  mọi poll/attempt/analyzer đều trên #109, verdict không đổi;
  boot lúc viết cờ đã là boot mới (số hiệu chờ T0-188;
  dự kiến #110 theo cách đếm T0).**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (20:46–20:47Z),
ghi vào `hidden_files/round187-t4/preflight-187.txt` — **PASS
PHẦN TĨNH** (0 sót; xem F-187-T4-1: 4 chuỗi stale bắt được ở
lần grep thứ 2 + sửa trước pre-flight). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–186:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ as-of-185 md5 `cd5410cc…` (occ 174/186,
  distinct 137/140, valid_rounds_p3 35, non_dat [260, 364, 498]).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; Playwright-core có mặt (webkit
  object, import tuyệt đối từ `scratch-round63-r4/node_modules/
  playwright-core/index.mjs`); media `stripes-nonperiodic.mp4`
  có mặt (140.828 B); không có `vite.lock`, không có
  `attempt-done-*`.
- **Fixture /tmp mất theo #108 — KHÔNG ẢNH HƯỞNG T4**
  (probe lấy media qua vite từ `public/`; T8-187 rebuild lại).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-24
  22:30:00 UTC` → **1795559400** = 22:30Z (hạn cờ ~23:00Z =
  1795561200, hạn cứng 23:35Z = 1795563300); grep 0 hit cho
  mẫu rộng `round185|19:30|20:00|20:35|#55|cea79500|9161bfd1|
  round184|T4-186a|default=186|WebKit #55` trong 7 file vận
  hành (lần grep thứ 2 sạch — sau khi sửa 4 chuỗi sót ở lần
  2: comment "poller dung 19:30Z" + comment T5FLAG trong
  poll-wait, "poll-wait-t4-186.sh" trong run-attempt, nhãn
  "distinct-seq-186.py" — xem F-187-T4-1).
- **Copy-forward 186 → 187 (script python thay thế có neo,
  KHÔNG sed global):** deadline `19:30Z` → `22:30Z`; hạn
  cờ/cứng → `23:00Z`/`23:35Z`; T5FLAG chính `round187-t5/` +
  fallback `round186-t5/`; `T4-186a` → `T4-187a`;
  `default=186` → `default=187`; `WebKit #55` → `#56`; glob
  `round185-*` → `round186-*`.
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 186); **`tree-md5.txt` KHÔNG có trong danh
  sách cleanup — còn nguyên, 530e10a7.**
- **Freeze check (F-164-T4-1):** `round186-t4` còn **0 file
  mtime ≥ 20:35:51Z** (giờ mở đợt 187).
- **GATE0 LÚC MỞ: CHƯA ĐẠT.** round187-t5/ trống (T5-187 chưa
  ghi cờ); fallback round186-t5/POSTBOOT_PASS mtime 17:48:46Z
  < btime #109 20:30:33Z nên poller đánh "cu(mtime-cu)",
  KHÔNG TÍNH — đúng thiết kế chống cờ sai boot. **Check-only
  postboot chạy tay exit=1 FAIL** (GST thiếu isomp4/libav,
  apt thiếu 5 gói — replay hệ thống đang cài dần trên boot
  #109 mới; dpkg.log 2 → 444 lúc mở, apt-get đang chạy lúc
  20:47Z; xem `preflight-postboot-187.log`). Gate0 chỉ đạt
  khi T5-flag xuất hiện (20:50:24Z, poll #5) — check-only
  KHÔNG PASS lần nào trong cả phiên (PB=1 tới poll #4, PB=0
  từ poll #5 nhờ cờ T5, không nhờ check-only).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (20:47:16Z): RAM 1104 MB, load1 0,77/load5 1,38,
  gate0=khong-dat, t5flag=cu(mtime-cu), apt=1, dpkg 503.
  Lần 2 (20:47:20Z): RAM 1103 MB, load1 0,71/load5 1,36,
  gate0=khong-dat, apt=2, dpkg 506. Cửa chưa mở vì gate0 +
  apt — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~1.056 MB avail; load1 ~1,28 lúc mở** — cửa
  chỉ mở khi đủ điều kiện.
- **F-176-T4-2: KHÔNG TÁI DIỄN** — sampler n=98 đếm đúng.
- **F-185-T4-2: KHÔNG TÁI DIỄN** — một luồng T4 duy nhất từ
  đầu đến cuối (kiểm cả thư mục làm việc + tiến trình trước
  khi kết luận — 72 entry trong `round187-t4/` lúc đóng).

## 1. Poller — 27 poll thật (2 test + 25), 1 lần cửa mở, 0 reboot

- **Test (POLL_TEST=1), 2 poll, boot 6f1d9f87
  (20:47:16Z, 20:47:20Z):** cả 2 đều gate0=khong-dat,
  load1 0,77/0,71, load5 1,38/1,36, RAM 1104/1103 MB,
  lock=khong, blockers=0, apt=1/2, dpkg 503/506 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-187.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 6f1d9f87 (#109), 25 poll
  (20:47:32–21:05:39Z), 1 lần cửa mở (#25):** RAM ≥1024:
  23/25 (min 953, max 2454 MB); 500–1023: 2/25;
  **<500: 0/25**; load1<2: 9/25; load5<2: 3/25;
  gate0: **T5 21/25** (cờ có từ poll #5, 20:50:34Z) +
  khong-dat 4/25 (poll #1–#4, trước khi cờ T5 có);
  lock=co 4, khong 21 (T0 giữ, poll #16–#19);
  blockers>0: 4 poll; apt>0: 3 poll; dpkg 603 → 1468
  (replay xong trong phiên, NGOÀI cửa sổ attempt).
- **Giai đoạn 1 — chờ gate0 + replay (poll #1–#4,
  20:47:32–20:49:49Z):** gate0 khong-dat (check-only FAIL,
  apt=1 poll #1–#3 — T5 repair đang chạy); dpkg 603 → ~1400.
  Cửa KHÔNG MỞ.
- **Cờ T5 có 20:50:24Z (poll #5 đã nhận T5 PASS, 20:50:34Z)**
  nhưng load1 6,74/load5 3,74 (đuôi replay) → cửa KHÔNG MỞ.
- **Giai đoạn 2 — load5 hạ dần (poll #6–#15,
  20:51:20–20:58:07Z):** load5 3,83 → 2,33; load1 <2 từ
  poll #9. Cửa KHÔNG MỞ (chỉ thiếu load5).
- **Giai đoạn 3 — T0 giữ lock + O8 (poll #16–#19,
  20:58:52–21:01:08Z):** poll #16–#17 lock=co
  (thread=t0-round187, pid 270732, port 5560, ticket
  1-17955538894 = 20:58:14Z) + blockers 5/5; poll #18–#19
  blockers 1/1; load1 3,42–6,45 (tải O8). Cửa KHÔNG MỞ.
- **Giai đoạn 4 — load5 hạ nốt (poll #20–#24,
  21:01:53–21:04:54Z):** load5 3,75 → 2,24; load1 <2 từ
  poll #22. Cửa KHÔNG MỞ (chỉ thiếu load5).
- **CỬA MỞ #1 — poll #25 (21:05:39Z):** load1 0,39, load5
  1,98, RAM 1853 MB, gate0=T5, lock=khong, blockers=0, apt=0,
  dpkg 1468, tree=YES → **CHẠY attempt1 NGAY — HỢP LỆ**.
- **0 reboot trong phiên đo.** Poller thoát 21:09:27Z sau khi
  tuyên lượt hợp lệ (không chạm hạn cắt 22:30Z). **Reboot mới
  912f4a97 (btime 21:13:21Z) xảy ra SAU poller thoát — ngoài
  phiên đo; gap #109→boot mới = 2.568 s.**
- **Phân rã 27 poll thật:** RAM≥1024: 25/27; RAM 500–1023:
  2/27; RAM<500: **0/27**. load1<2: 11/27; load5<2: 5/27.
  **Stats "gan-mo" đếm 3 nhưng chỉ 1 lần mở cửa thật** (#25)
  — 2 test poll đủ load/RAM nhưng thiếu gate0 + apt>0
  (xem F-187-T4-3). gate0: T5 21/27 + khong-dat 6/27
  (4 poll thật + 2 test). blockers>0: 4 poll (toàn lúc T0
  giữ lock). apt>0: 5 poll (3 thật + 2 test, toàn lúc
  T5 repair).

## 2. Attempt — 1 attempt, 1 hợp lệ (ngân sách dùng 1/3)

- **attempt1-6f1d9f87, 21:05:39–21:09:04Z (3'25"), 20/20
  pass — LƯỢT HỢP LỆ.** JSON
  `preview-b-f3-flip-webkit-t4-attempt1-6f1d9f87.json`
  3.691.015 B, passes=20, pageErrs=[]. **tickCost total n=667
  median=39,0 p90=69,0 max=101 min=27**; hậu flip+2000ms n=496
  median=39,0; tBlend gap n=538 median=74,0 p90=100,3
  max=1733; BlendTick/pass=26,9; rAF/pass median=40 (min 35,
  max 47); webkit=27,2; pageErrs=[]; flip afterPass=5
  wallMs=25589.
- **Per-pass median attempt1:** 39,0 / 34,5 / 47,0 / 47,0 /
  39,0 / 41,0 / 42,5 / 37,0 / 37,0 / 40,5 / 36,5 / 36,0 /
  45,0 / 38,0 / 35,0 / 42,0 / 39,0 / 45,0 / 39,0 / 40,0
  (load1/pass 0,54 → 2,85; RAM/pass 1363 → 1070 MB).
- **Lớp B attempt1 ĐẠT 5/5** (`classb-t4-attempt1-6f1d9f87.txt`,
  21:09:04Z): sampler n=98, load1_max=2,93, RAM_min=1030 MB,
  RAM_max=1852 MB, **0 mẫu RAM<500 MB**, 0 mẫu RAM<1024 MB;
  load5 lúc kết thúc 1,55; boot lúc bắt đầu = boot hiện tại
  20:30:33Z; apt/dpkg thật lúc đánh giá (pgrep -x) = 0;
  **dpkg.log: trước=1468, hiện tại=1468, delta-trong-cửa-sổ=0**;
  ps-before/after exact-comm apt/dpkg = 0. B1 ĐẠT (load5 cuối
  1,55 ≤ 2,5); **B2 ĐẠT (load1 max 2,93 ≤ 4 — xem §3)**; B3
  ĐẠT (không reboot); B4 ĐẠT (pgrep -x=0, ps exact-comm=0,
  dpkg delta=0); B5 ĐẠT (RAM min 1030 MB, 0 mẫu <500 MB).
- **(c2) attempt1 5 seq — ĐÁNH GIÁ ĐẦY ĐỦ (lượt hợp lệ):**
  seq 262, 288, 343, 458, 488 (stall 6, 5, 4, 7, 7) —
  P3' DAT 5/5, coverage 5/5 (log gần nhất −24/+19/−21/−24/−21
  ms, blendTick hậu-flip trong ±500 ms của log: 406/406 =
  100,0%); P1 ĐÚNG 5/5 (baseline 45/406, p=1,67e-05); P2
  ĐÚNG 5/5 (cả 5 seq lag +1f); P3-A1 ĐÚNG 5/5 (baseline
  86/405, p=0,00043); P7 ĐÚNG (c2 drawSrc delta {-1: 31,
  0: 36}; đối chứng toàn bộ drawSrc post: {-1: 335, 0: 159},
  0/494 entry trễ ≥+1f); labellag (b) 0 occurrence / 0 event.
  F6' ĐÓNG — skipLatest pixel-verified trên WebKit
  (n tick skippedLatest=1 hậu flip+2000ms: 72; nhãn 100,0%,
  pixel-verified 100,0%).
- **Không attempt nào bị reboot giết; 2 retry còn lại.**
  Ngân sách **1/3 đã dùng**.

## 3. B2 spike / đối chiếu sampler T9 + O8 T0

- **KIỂM B2 — ATTEMPT1 ĐẠT, KHÔNG SPIKE VƯỢT BAR:**
  load1_max 2,93 (đỉnh ở pass 16–17, load1/pass 2,64–2,93);
  **0 spike T9 >3,0 trong cửa sổ attempt** (load1 < 3,0
  suốt). Phân bổ (cho quyết (p) đợt 186 — KHÔNG TÁCH luật
  B2 đợt này, tích lũy dữ kiện ≥3 đợt): **tự-tải là nguồn
  chính** — load1/pass tăng dần theo tiến trình attempt
  (0,54 → 2,85 qua 20 pass, theo đúng nhịp render của chính
  attempt; load1 là trung bình 1 phút nên trễ); **lạ-tải
  chỉ là script giám sát nhẹ của luồng khác** — ps-before/
  after ghi T9 `sampler.sh`/`b2watch.sh`/`probe-loop.sh`
  (bash, không đốt CPU) + T7 `appendix187.py` (python đang
  `sleep 3300`, chờ wake) + 2 lệnh setup bash của T9 —
  **0 process phân tích nặng của luồng khác** trong cửa sổ
  attempt. TickCost KHÔNG tương quan với load1 (per-pass
  r=0,05; median/pass 34,5–47,0 ổn định trong khi load1 tăng)
  — tải nhẹ ngoài attempt không làm xấu median.
- **O8 T0 TRÊN BOOT #109 — PASS 3/3 (theo T0-187.done 21:07Z):
  WebKit 21/21 ×2 + Chromium 21/21, 20:58:09–21:01:19Z, sau
  cờ POSTBOOT_PASS #109 7m45s; libevent heal lần 3 (vắng
  20:43Z → có 20:46Z sau replay). 0 giây chồng lấn với attempt
  T4** (O8 chạy TRƯỚC attempt — đảo thứ tự so với đợt 186;
  poll #16–#19 trong cửa sổ O8 đều ghi lock=co
  thread=t0-round187 + blockers → cửa yên KHÔNG mở; poll #20
  (21:01:53Z, sau khi O8 xong) lock=khong).
- **O8 T8 TRÊN BOOT #109 — CHƯA CÓ (T8-187 chưa đóng cờ lúc
  T4 đóng).** Chân O8 T8 + harness thuộc T8-187 báo cáo.
- **Ghi trong cửa sổ attempt: KHÔNG CÓ.** `run-analyzers-187.sh`
  chạy NGOÀI cửa sổ attempt (xem kiểm chứng live lần 7, §6,
  F-187-T4-4). File `hidden_files/round109-k7/
  analyze-k7-skiplatest.txt` mtime vẫn 2026-11-23 18:13:20Z
  (đợt 179) — 0 ghi mới.

## 4. Replay/postboot — POSTBOOT_PASS #109 ĐÃ CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat)

- **Boot 6f1d9f87 (btime 20:30:33Z, số hiệu #109 — parent
  quyết (e) đợt 186: CHẤP NHẬN cách đếm T0-186; T0-187 XÁC
  NHẬN 9 nguồn tươi).**
- **POSTBOOT_PASS #109 ĐÃ CÓ 20:50:24Z** (boot+19m51s;
  replay-đầy-đủ, poll=0, KHÔNG caveat — GST thư mục thật,
  tools cài, dpkg 1468; verify độc lập exit 0; T5-187).
  Gate0=T5 từ poll #5 (20:50:34Z). Check-only của T4 KHÔNG
  PASS lần nào (PB=1 tới poll #4 — replay chưa xong; từ poll
  #5 gate0 đi qua cờ T5). Replay #109: KHÔNG ĐÌNH TRỆ (heal
  sớm boot+5m07s, 50 transaction — T5-187).
- **POSTBOOT_PASS #108 (7ea9d047) KHÔNG CÓ — T5-187 KHÔNG
  THỬ REPAIR** (boot đã chết theo #109; tiền lệ #100/#83
  (b2)); tổng boot không cờ 24 → 25 nếu parent chấp nhận
  (tiền lệ #105; T5-187). **#105 VẪN KHÔNG CÓ.**
- **0 REBOOT trong cửa sổ attempt; 0 REBOOT trong phiên đo.**
  Số hiệu #109 đã quyết (parent (e) đợt 186); (m) #107/#108
  + INSIDE #107/#108 (FULL153/FULL154) thuộc T2-187; #109 có
  giết holder không thuộc T6-187 phán cuối; POSTBOOT_PASS
  #109 CÓ — **và CÓ chân lượt yên** nên chuỗi FULL PASS có
  thể 0 → 1 (parent quyết cuối — còn chờ chân O8 T8 +
  harness của T8-187).
- **Run 187 FAILED 20:17:06Z** (KHÔNG phải timeout — worker
  báo chưa xong, T10-186 chưa spawn; margin +1.125 s;
  claimed→finished 202 s — ỨNG VIÊN CA MỚI, T7-187 phán
  cuối). **Run 188 vẫn RUNNING lúc T0-187 đóng** (kết cục
  thuộc T7-188).
- **Scheduler gap 8.406 s tái diễn giống OUTAGE 179/186**
  (theo T0-187.done — OUTAGE #2 theo quyết (o) đợt 186;
  MỞ ĐIỀU TRA hướng "cố định theo giờ" — T7-187 lo).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-187 báo cáo.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND187_T4_WEBKIT_QUIET56_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round187-t4/`):**
  `poll-wait-t4-187.sh` (deadline 22:30Z 24/11 + cờ T5
  round187-t5/ + fallback round186-t5/),
  `run-attempt-187.sh` (lượt yên #56),
  `run-analyzers-187.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt; đợt này ĐÃ CHẠY 1 lần: 21:09:04–21:09:27Z),
  `distinct-seq-187.py` (helper đọc sổ; đợt này DÙNG LIVE —
  sổ thăng cấp as-of-187, md5 `ea978f23`). **KHÔNG stage lại
  probe** (`probe121t3-ghost-k7.webkit.mjs` — byte-identical
  với bản đã stage đợt 148–186, md5 `4291e539...`) và **KHÔNG
  stage lại `t4-attempt-inner.sh` / `check-classb-t4.sh`**
  (bản làm việc ở `hidden_files/round187-t4/` — theo đúng
  mẫu 149–186: chỉ stage 4 script trên). **`b.json` KHÔNG
  stage** (file spec làm việc, md5 `078938cf...`, giống hệt
  bản đợt 156–186).
- **Script làm việc (hidden_files, không stage):**
  5 script T4 (`poll-wait`/`run-attempt`/`run-analyzers`/
  `t4-attempt-inner` — W = round187-t4 + glob chéo round186-* /
  `check-classb-t4` — đếm sampler n chỉ dòng `boot=`),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-187.py` (thống kê §A;
  footer CỘNG DỒN MỚI 48 lượt),
  `distinct-seq-187.py` (helper đọc sổ — DÙNG LIVE đợt này),
  `distinct-seq-ledger.json` (SỔ distinct-seq, THĂNG CẤP
  as-of-187: 139/142 distinct, occ 179/191, valid_rounds_p3
  36, non_dat [260, 364, 498], md5 `ea978f23…`),
  `distinct-seq-ledger-187-proposed.json` (sổ đề xuất trước
  khi thăng cấp — giữ làm bằng chứng),
  `preflight-187.txt` + `preflight-postboot-187.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2),
  `round187-t4-copy.py` (script copy-forward 186 → 187).
- **Log/evidence (hidden_files/round187-t4/, không stage):**
  `poll-t4.log` (25 poll trên #109 + 1 lần CUA YEN MO +
  LUOT HOP LE), `poll-t4.nohup.log` (1 instance),
  `poll-test-187.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + 1 lần CUA YEN MO + 1 lần
  analyzers + LUOT HOP LE, poller thoát),
  `postboot-t4-187-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-187-output.txt` (output stats-187.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll #16–#19),
  1 JSON attempt (3.691.015 B — KHÔNG stage),
  `analyze-t4-attempt1-6f1d9f87-*.txt` (9 analyzer × 1
  attempt) + `p1p3p7-attempt1-6f1d9f87.txt` (P1/P2/P3-A1/P7
  attempt1 — ĐÚNG 5/5 cả bốn),
  `classb-t4-attempt1-6f1d9f87.txt` (B ĐẠT 5/5),
  `coverage-check-attempt1-6f1d9f87.txt` (5/5),
  `attempt-done-attempt1-6f1d9f87` (ngân sách 1/3),
  `load-mid-t4-attempt1-6f1d9f87.log` (sampler n=98),
  `run-webkit-t4-attempt1-6f1d9f87.log`,
  `ps-before/after-t4-attempt1-6f1d9f87.txt` (chỉ vite của
  chính attempt + script giám sát nhẹ của T9/T7).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  21:09:27Z; 0 vite; 0 Xvfb; 0 MiniBrowser/WebProcess;
  X11 trống — 0 socket sót).

## 6. Sai số F-187-T4-1..6 (+ nợ cũ)

- **F-187-T4-1 — COPY-FORWARD: 4 CHUỖI STALE SÓT SAU LẦN SỬA
  ĐẦU (GHI NHẬN — DẠNG F-186-T4-1).** Grep kiểm lần 2 bắt
  thêm 4 chuỗi: comment "poller dung 19:30Z" + comment T5FLAG
  `(uu tien round186-t5, du phong round185-t5)` trong
  poll-wait, "poll-wait-t4-186.sh" trong run-attempt, nhãn
  "distinct-seq-186.py". Sửa TRƯỚC pre-flight; grep lần 3
  sạch (mẫu rộng `round185|19:30|20:00|20:35|#55|cea79500|
  9161bfd1|round184|T4-186a|default=186|WebKit #55` = 0 hit
  trong 7 file vận hành). Không ảnh hưởng vận hành (3 comment
  + 1 nhãn). Bài học: mẫu grep phải rộng hơn cả tên file —
  đợt này mẫu cũ đã bắt được 4 chuỗi nhờ kiểm cả `185` lẻ.
  (Script copy-forward còn 1 lỗi assert số file 23 → sửa
  thành 22 trước khi chạy lại.)
- **F-187-T4-2 — RAM TRONG ATTEMPT SÁT NGƯỠNG 1024 (MỚI —
  NHẸ).** Sampler n=98: RAM_min=1030 MB (pass 20: 1030–1097
  MB, mean 1070) — chỉ dư 6 MB trên ngưỡng B5 phụ (0 mẫu
  <1024 MB nên B5 vẫn ĐẠT); RAM/pass giảm dần 1363 → 1070 MB
  trong attempt (giảm ~300 MB); poll RAM min 953 MB (2 poll
  500–1023 lúc đầu phiên, khi replay còn chạy). Ghi nhận;
  giao T9-187 đối chiếu balloon trên #109 (RAM avail dao
  động mạnh 953–2.454 MB trong phiên).
- **F-187-T4-3 — STATS "gan-mo" ĐẾM 3 NHƯNG CHỈ 1 LẦN MỞ CỬA
  THẬT (MỚI — DẠNG F-186-T4-4).** Script stats đếm poll đủ
  load1<2 + load5<2 + RAM≥1024 (proxy, không xét
  lock/blockers/gate0/apt): 2 test poll đủ 3 điều kiện nhưng
  cửa đóng vì gate0 khong-dat + apt>0. Chỉ là cách đếm proxy,
  không ảnh hưởng verdict (1 lần mở cửa thật #25 khớp log
  CUA YEN MO).
- **F-187-T4-4 — QUYẾT (p) KIỂM CHỨNG LIVE LẦN 7: ĐẠT
  (MỚI — F-186-T4-6 ĐÃ HẾT).** 1 cửa sổ attempt: 21:05:40.016Z
  (marker) → 21:09:04.695Z (attempt-done). Mtime sớm nhất của
  9 file analyzer + classb đều SAU attempt-done: classb
  +0,095 s, c2drawlog +0,183 s; mtime muộn nhất 21:09:27.631Z
  (coverage-check). **0 file analyzer ghi trong cửa sổ
  attempt.** File skiplatest mặc định mtime vẫn 2026-11-23
  18:13:20Z — 0 ghi mới. Kiểm chứng live lần 7 (179: lần 1
  dời; 180–182 dời; 183: lần 3 ĐẠT; 184: lần 4 ĐẠT; 185:
  lần 5 ĐẠT; 186: lần 6 ĐẠT; lần này lần 7 ĐẠT).
- **F-187-T4-5 — B2 PHÂN BỔ TỰ-TẢI/LẠ-TẢI, LẦN ĐẦU GHI CHI
  TIẾT (MỚI — THEO QUYẾT (p) ĐỢT 186).** Attempt1: load1_max
  2,93 (đỉnh pass 16–17); **tự-tải là nguồn chính** (load1/
  pass tăng dần 0,54 → 2,85 theo tiến trình attempt; tickCost
  không tương quan với load1, r=0,05); **lạ-tải chỉ là script
  giám sát nhẹ** (T9 sampler/b2watch/probe-loop + T7
  appendix187.py đang sleep + 2 lệnh setup bash của T9) —
  0 process phân tích nặng. B2 ĐẠT với dư 1,07. Đây là dữ
  kiện thứ 1 cho quyết tách B2 (cần ≥3 đợt — parent quyết
  (p) đợt 186); T4 tiếp tục báo cáo cùng mẫu các đợt sau.
- **F-187-T4-6 — F-186-T4-3 ĐÃ LÀM RÕ: MEDIAN TRỞ LẠI 39,0 MS
  TRÊN #109 (MỚI — ĐÓNG NỢ ĐỢT 186).** Đợt 186 median leo
  60,0 → 68,0 → 79,0 ms trên #107 (cả 3 ≥ max 60,0 của chuỗi
  47 lượt); đợt này median 39,0 ms ngay attempt đầu trên
  #109 — bằng min của chuỗi. Kết luận: chậm/nhiễu là đặc
  tính boot #107, KHÔNG phải ngưỡng 60 ms sai hay máy xuống
  cấp chung. Không cần xem lại ngưỡng.
- **F-186-T4-1 — TÁI DIỄN DƯỚI DẠNG F-187-T4-1**
  (4 chuỗi stale — bắt được trước pre-flight).
- **F-186-T4-2 — KHÔNG TÁI DIỄN** (B2 ĐẠT, load1_max 2,93;
  phân bổ xem F-187-T4-5).
- **F-186-T4-3 — ĐÃ LÀM RÕ (xem F-187-T4-6).**
- **F-186-T4-4 — TÁI DIỄN DƯỚI DẠNG F-187-T4-3** ("gan-mo"
  = 3, chỉ 1 lần mở cửa thật).
- **F-186-T4-5 — KHÔNG TÁI DIỄN** (X11 trống lúc đóng —
  Xvfb :193 của attempt1 đã dọn socket).
- **F-186-T4-6 — ĐÃ HẾT (xem F-187-T4-4 — kiểm chứng live
  lần 7 ĐẠT).**
- **F-186-T4-7 — KHÔNG TÁI DIỄN** (B1 ĐẠT, load5 cuối 1,55,
  dư 0,95).
- **F-185-T4-1 — TÁI DIỄN DƯỚI DẠNG F-187-T4-1.
  F-185-T4-2 — KHÔNG TÁI DIỄN** (1 luồng T4 duy nhất).
  **F-185-T4-3 — ĐÃ HẾT (P3-A1 ĐÚNG 5/5, p=0,00043 —
  lần này không còn SAI).**
  **F-185-T4-4 — KHÔNG TÁI DIỄN.** Labellag (b) lag≥+5f:
  **0 occurrence / 0 event** (lần thứ 3 liên tiếp 0:
  186, 187 — chuỗi 2 đợt >0 ở 184/185 đã đứt hẳn).
  **F-185-T4-5 — KHÔNG TÁI DIỄN** (B2 ĐẠT, load1_max 2,93,
  0 spike >3,0 trong cửa sổ attempt).
  **F-185-T4-6 — KHÔNG TÁI DIỄN** (X11 trống lúc đóng).
  **F-185-T4-7 — ĐÃ HẾT (xem F-187-T4-4).**
- **F-184-T4-1 — TÁI DIỄN DƯỚI DẠNG F-187-T4-1.
  F-184-T4-2 — KHÔNG TÁI DIỄN.** RAM <500 MB: 0/27 poll.
  **F-184-T4-3 — KHÔNG TÁI DIỄN** (labellag (b) 0 occ).
  **F-184-T4-4 — KHÔNG TÁI DIỄN** (0 reboot trong phiên đo).
  **F-184-T4-5 — ĐÃ HẾT (xem F-187-T4-4). F-184-T2-8 —
  KHÔNG TÁI DIỄN PHÍA T4** (0 chồng tải lạ nặng; các script
  lạ chỉ giám sát nhẹ, load1_max 2,93).
- **F-183-T4-1 — TÁI DIỄN DƯỚI DẠNG F-187-T4-1.
  F-183-T4-2 — KHÔNG TÁI DIỄN** (X11 trống lúc đóng).
  **F-183-T4-3 — KHÔNG TÁI DIỄN** (py_compile 12 file).
  **F-183-T4-4 — TÁI DIỄN DƯỚI DẠNG BÌNH THƯỜNG** (T0 giữ
  lock polls #16–#19). **F-183-T4-5 — ĐÃ HẾT (xem
  F-187-T4-4). F-183-T4-6 — TÁI DIỄN DƯỚI DẠNG F-187-T4-3**
  ("gan-mo" = 3, chỉ 1 lần mở cửa thật). **F-183-T4-7 —
  KHÔNG TÁI DIỄN** (tải trong attempt chủ yếu tự-tải).
- **F-182-T4-1 — KHÔNG TÁI DIỄN** (0 reboot). **F-182-T4-4 —
  ĐÃ HẾT** (#109 CÓ POSTBOOT_PASS, KHÔNG caveat).
  **F-181-T4-3 — KHÔNG TÁI DIỄN. F-181-T4-6 — CÓ SỐ MỚI:**
  chuỗi median 48 lượt (mean 47,4, max 60,0).
  **F-181-T4-7 — KHÔNG ÁP DỤNG** (sampler đếm đúng).
  **F-181-T4-8 — KHÔNG ÁP DỤNG** (p90 69,0 ms — không có
  bar p90). **F-179-T4-5 — ĐÃ HẾT (xem F-187-T4-4).
  F-178-T4-1 — KHÔNG TÁI DIỄN** (tải trong attempt chủ yếu
  tự-tải). **F-177-T4-4 — KHÔNG TÁI DIỄN. F-177-T4-6 — TÁI
  DIỄN DƯỚI DẠNG F-187-T4-1. F-176-T4-1 — KHÔNG TÁI DIỄN**
  (0 vi phạm theo T4). **F-176-T4-2 — KHÔNG TÁI DIỄN**
  (sampler n=98). **F-175-T4-1 — KHÔNG TÁI DIỄN**
  (`tree-md5.txt` còn nguyên). **F-175-T4-2 — KHÔNG TÁI
  DIỄN** (0 ghi analyzer trong cửa sổ attempt). **F-175-T4-3
  — TÁI DIỄN DƯỚI DẠNG BÌNH THƯỜNG** (T0 giữ lock #16–#19).
  **F-175-T4-5 — KHÔNG TÁI DIỄN** (0 reboot).
  **F-174-T4-1 — KHÔNG ÁP DỤNG** (p1p3p7 trên lượt hợp lệ —
  P1/P3-A1 ĐÚNG, P7 ĐÚNG). **F-174-T4-3 — KHÔNG TÁI DIỄN**
  (kiểm process lúc đóng dùng `ps`). **F-174-T4-4 — KHÔNG
  ÁP DỤNG** (p1p3p7 attempt1 — P1/P3-A1 ĐÚNG 5/5, P7 ĐÚNG).
  **F-174-T4-6 — KHÔNG TÁI DIỄN** (RAM <500 MB: 0/27 poll).

## 7. P3' cộng dồn (MỚI — 48 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 187 (MỚI): P1 215/219, P2 210/210,
  P3-A1 187/219, P3' 179/191 occurrence = 139/142 distinct-seq,
  P7 113/113** (48 lượt hợp lệ — #56 CÓ lượt hợp lệ nên cộng
  thêm 5 seq; 0 attempt nhiễm tải). Cơ sở: cộng dồn chỉ tính
  trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #56: 5/5 seq (c2) P1 + P2 + P3-A1 + P3' ĐẠT;
  P7 ĐÚNG** (seq 262, 288, 343, 458, 488; stall 6, 5, 4, 7, 7).
  Helper `distinct-seq-187.py` DÙNG LIVE (quyết (t) đợt 162):
  sổ as-of-185 (137/140 distinct, occ 174/186) + stall/
  c2coverage attempt1-6f1d9f87 → **139/142 distinct,
  179/191 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 288, 488** (chưa có trong sổ);
  **262, 343, 458 ĐÃ THẤY** (trong sổ, đã ĐẠT trước — không
  cộng thêm distinct). T4 kiểm tay lại sổ as-of-185: cả 2 seq
  mới vắng thật (288/488 không có trong `seen_dat` lẫn
  `seen_c2`); non_dat [260, 364, 498] KHÔNG ĐỔI (không seq
  nào trong 3 hố này xuất hiện đợt này).
- **P1 — ĐÚNG 5/5 occ** (cả 5 seq gần run-end ±1 tick; trong
  15 run_end seqs; baseline 45/406, p=1,67e-05 — verdict
  ĐÚNG theo luật DEF §3 vì n=5 ≥3 VÀ p<0,01). Cộng dồn
  210/214 → **215/219**.
- **P2 — ĐÚNG 5/5 occ** (cả 5 seq lag +1f; DEF §4 chỉ đòi
  lag ≥ +1f). Cộng dồn 205/205 → **210/210**.
- **P3-A1 — ĐÚNG 5/5 occ** (cả 5 seq đóng băng-tại-tick;
  baseline 86/405, p=0,00043 — verdict ĐÚNG theo luật
  DEF §5). Cộng dồn 182/214 → **187/219**.
- **P3' 5/5 occ ĐẠT** (stall: 262=6, 288=5, 343=4, 458=7,
  488=7). Cộng dồn 137/140 → **139/142 distinct** (2 seq
  ĐẠT MỚI — 288, 488); occurrence 174/186 → **179/191**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 31,
  0: 36}; đối chứng toàn bộ drawSrc post: {-1: 335, 0: 159},
  0/494 entry). Cộng dồn 108/108 → **113/113** (theo mẫu
  đợt 185: P7 cộng +n/n khi ĐÚNG cho n seq của lượt).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162).**
  Helper đọc sổ (as-of 185: 137/140 distinct, occ 174/186),
  tính seq MỚI = tập hiệu với sổ, in cộng dồn mới, ghi sổ MỚI
  đề xuất vào `distinct-seq-ledger-187-proposed.json`; T4
  kiểm tay rồi mới thăng cấp sổ thành as-of-187 (md5
  `ea978f23…`, valid_rounds_p3 35 → 36, as_of_round 185 →
  187). Sổ gốc as-of-185 KHÔNG còn (đã thăng cấp tại chỗ
  sau khi kiểm — bản đề xuất giữ lại làm bằng chứng).
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên + mạnh thêm** (lượt hợp lệ mới: P1/P2/
  P3-A1/P3'/P7 đều ĐÚNG 5/5; F-185-T4-3 ĐÃ HẾT — P3-A1
  không còn SAI).
- Chuỗi median tickCost 48 lượt (MỚI — thêm 39,0): 49,5 /
  40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 /
  40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 /
  60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 /
  44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 /
  40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 / 50,0 / 45,0 /
  49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 / **39,0** ms
  (tổng 2277,0; trung bình 47,4 ms; min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60). **Median 3 attempt bị loại đợt 186
  (60,0 / 68,0 / 79,0) KHÔNG vào chuỗi.**

## 8. Chờ quyết parent / nợ đợt 188

- **(a) #56 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ 0 → 1
  (KHỞI ĐỘNG LẠI, đề xuất — tiền lệ đợt 179).** Chân lượt yên
  cho chuỗi FULL PASS **CÓ đợt này** — chuỗi FULL PASS có thể
  0 → 1 nếu 4 chân còn lại đủ cùng boot #109 (parent quyết
  cuối — còn chờ chân O8 T8 + harness của T8-187).
- **(b) P3' cộng dồn MỚI 48 lượt: P1 215/219, P2 210/210,
  P3-A1 187/219, P3' 179/191 = 139/142, P7 113/113:**
  sổ distinct-seq thăng cấp as-of-187 md5 `ea978f23…`.
  **Chờ parent/T10 quyết:** ghi nhận cộng dồn mới.
- **(c) BOOT 6f1d9f87 (số hiệu #109 — parent quyết (e) đợt
  186) — T0-187 ĐÃ XÁC NHẬN 9 nguồn tươi (btime 20:30:33Z).**
  **(m) #107/#108 + INSIDE #107/#108 (FULL153/FULL154) thuộc
  T2-187**; **#109 có giết holder không thuộc T6-187 phán
  cuối.**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 4 chuỗi sót
  (F-187-T4-1 — sửa trước pre-flight); gate0 ĐÃ ĐẠT lúc mở
  poller qua T5 từ poll #5 (cờ T5 có 20:50:24Z).
- **(e) POSTBOOT_PASS #109 ĐÃ CÓ (20:50:24Z,
  replay-đầy-đủ, poll=0, KHÔNG caveat). POSTBOOT_PASS #108
  KHÔNG CÓ — T5-187 KHÔNG THỬ REPAIR; tổng boot không cờ
  24 → 25 nếu parent chấp nhận (tiền lệ #105).** Hướng (3)
  VẪN ĐỨNG lần 34 (theo T5-187).
- **(f) RAM <500 MB: 0/27 poll (min 953 MB).** RAM trong
  attempt min 1030 MB — sát ngưỡng 1024 (F-187-T4-2). Giao
  T9-187 đối chiếu balloon trên #109 (RAM avail dao động
  mạnh 953–2.454 MB trong phiên; RAM giảm ~300 MB trong
  mỗi attempt).
- **(g) (m) #105 DƯƠNG (parent 186 quyết cuối); (m) #56 lần
  30 (T2-187 — LƯU Ý: (m) #56 của T2 KHÁC lượt yên #56 của
  T4, đừng nhầm); mù #96?/#95?/#94?/#88?/#77? (T2-187);
  V2 phương án chính + B2 (T8-187); 84l10 + Q3 (T8-187);
  run 187 FAILED — ỨNG VIÊN CA mới (T7-187 phán); run 188
  running lúc T0 đóng; OUTAGE 8.406 s = OUTAGE #2 + điều tra
  "cố định theo giờ" (T7-187); #109 giết holder? (T6-187
  phán); prune lần 62 (T6-187); checklist (o) (T8-187); H3
  chỉ giám sát thụ động; birefnet 0 thử lần 40; nhắc mọi
  luồng: KHÔNG script nặng / KHÔNG probe dpkg trong cửa sổ
  attempt (0 chồng tải lạ nặng — các script lạ chỉ giám sát
  nhẹ); u2net là fallback; ci-security.yml 403 chờ user;
  TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B2 ĐẠT (load1_max 2,93, dư 1,07)** — phân bổ tự-tải/
  lạ-tải xem §3/F-187-T4-5 (dữ kiện thứ 1 cho quyết tách B2,
  cần ≥3 đợt). Luật B2 KHÔNG TÁCH đợt này theo quyết (p)
  đợt 186; T4 tiếp tục báo cáo phân bổ các đợt sau.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (1 attempt, 1 hợp lệ) → **CÓ lượt yên hợp lệ #56 cho
  chuỗi FULL PASS.** T8 tự quyết O8 đợt này (O8 T0 trên
  #109 PASS 3/3 — 20:58:09–21:01:19Z, 0 chồng attempt;
  O8 T8 + harness thuộc T8-187 báo cáo).
- **(j) F-187-T4-1 (4 chuỗi stale — sửa trước pre-flight);
  F-187-T4-2 (RAM trong attempt sát ngưỡng 1024);
  F-187-T4-3 (stats "gan-mo" đếm 3, chỉ 1 lần mở cửa thật);
  F-187-T4-4 (quyết (p) kiểm chứng live lần 7 ĐẠT);
  F-187-T4-5 (B2 phân bổ tự-tải/lạ-tải — dữ kiện thứ 1);
  F-187-T4-6 (F-186-T4-3 ĐÃ LÀM RÕ — median trở lại 39,0 ms
  trên #109).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-187.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-187.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-24T20:47:16Z - 2026-11-24T20:47:20Z, boot=6f1d9f87
   RAM min=1103 max=1104 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 2/2 load5<2: 2/2 blockers>0: 0 apt>0: 2
   gate0: khong-dat=2
   lock: khong=2
   dpkg 503->506
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 25 poll, 2026-11-24T20:47:32Z - 2026-11-24T21:05:39Z, boot=6f1d9f87
   RAM min=953 max=2454 >=1024: 23/25 500-1023: 2/25 <500: 0/25
   load1<2: 9/25 load5<2: 3/25 blockers>0: 4 apt>0: 3
   gate0: T5=21, khong-dat=4
   lock: co=4, khong=21
   dpkg 603->1468
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 27
-- RAM toan phien: min=953 max=2454 >=1024: 25/27 <500: 0/27
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 3/27
   gan-mo? #1 2026-11-24T20:47:16Z boot=6f1d9f87 RAM=1104 L1=0.77 L5=1.38 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #1 2026-11-24T20:47:20Z boot=6f1d9f87 RAM=1103 L1=0.71 L5=1.36 blk=0 apt=2 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #25 2026-11-24T21:05:39Z boot=6f1d9f87 RAM=1853 L1=0.39 L5=1.98 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 6f1d9f87: 27 poll; RAM>=1024 lan cuoi: 2026-11-24T21:05:39Z #25; RAM<1024 lan dau: 2026-11-24T20:47:32Z #1 RAM=1017
-- cong don P3' (MOI, 48 luot hop le): P1 215/219 P2 210/210 P3-A1 187/219 P3' 179/191 occ = 139/142 distinct-seq P7 113/113
-- chuoi median 48 luot: n=48 mean=47,4 min=39,0 max=60,0 vuot-60: 0
```
