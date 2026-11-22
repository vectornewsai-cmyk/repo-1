# PHASE9_ROUND160_T4_WEBKIT_QUIET29_LIMITS.md

**Đợt:** 160. **Luồng:** T4 — đo lượt yên WebKit #29 trên 1 boot
+ LƯỢT HỢP LỆ #25 (chuỗi lượt yên hợp lệ nối dài: #22 đợt 157 →
#23 đợt 158 → #24 đợt 159 → #25 đợt 160)
+ KHÔNG PAGE-WEDGED (0 wedge — lần thứ 4 liên tiếp: đợt 157, 158,
159, 160).
**Ngày:** 21/11/2026 (lượt cron 12:35 +07 21/11 = 05:35:51Z 21/11).
**Boot đo:** 52c957d5 (reboot #61 ĐÃ XÁC NHẬN — T2-160, btime
05:25:49Z — boot lúc mở; KHÔNG có reboot mới trong lúc đo hay
lúc đóng sổ; kiểm cuối 06:07Z vẫn 52c957d5).
**Trạng thái:
#29 CÓ LƯỢT HỢP LỆ — attempt1 ĐẠT NGAY ở lần mở cửa đầu tiên
(06:01:26Z), ngân sách 3/3 chỉ dùng 1/3 (poller thoát 06:05:21Z,
trước hạn cắt poller 07:30Z gần 1h25m, trước hạn cờ ~08:00Z gần
2h). Attempt1-52c957d5 probe 20/20, LỚP B ĐẠT 5/5, tickCost
median 44,0 ms ≤60 (dư 16,0 ms). (c2)=5 occurrence / 5
distinct-seq, COVERED 5/5. P1 ĐÚNG (5/5 occ), P2 ĐÚNG (5/5 lag
+1f, 0 âm), P3-A1 SAI 3/5 (p=8,48e-02 — ĐÚNG chuỗi bị cắt, xem
§6 + F-160-T4-2), P3' 5/5 occ ĐẠT (DAT seq 201, 230, 254, 437,
469), P7 ĐÚNG (0 entry trễ ≥+1f). lag≥+5f = 0 occurrence (sạch
như đợt 158, 159). Cộng dồn MỚI (25 lượt hợp lệ): P1 96/97,
P2 88/88, P3-A1 80/97, P3' 61/69 occurrence = 61/64
distinct-seq, P7 59/59. PRE-FLIGHT CHECK (quyết (t) đợt 158)
PASS PHẦN SETUP — gate0 CHƯA ĐẠT lúc mở vì boot #61 mới, replay
chưa xong (khác đợt 159: cờ T5 có sẵn); poller chờ gate0 theo
đúng cơ chế, KHÔNG phải lỗi setup (xem §0b). Cờ T5-160 CÓ cho
boot đo (POSTBOOT_PASS 05:52:59Z, replay-day-du, không cần
repair).**

## 0. Verdict tổng

- **#29 CÓ LƯỢT HỢP LỆ (lượt hợp lệ #25, attempt1).**
  Ngân sách 3 attempt/đợt dùng **1/3**: attempt1 ĐẠT NGAY, không
  cần retry. Poller thoát 06:05:21Z vì LUOT HOP LE — KHÔNG
  phải hết ngân sách hay hết hạn (hạn cắt 07:30Z còn 1h25m).
- **Attempt1-52c957d5 (06:01:26–06:05:21Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 44,0 ≤ 60, lớp B 5/5).** Vite :5187
  (ready 390 ms, giữ lock ~4 phút), WebKit 27.2, Xvfb :193,
  app boot OK 06:01:36Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT,
  RELABEL BẬT. 20 pass (wall 2869–3439 ms/pass): tickCost
  n=639, blendTick n=513, c2DrawLog n=1239.
  **tickCost total median= 44,0 ms (p90 70,0, max 100, min 28)**;
  hậu flip+2000 ms median 43,0. Per-pass median 38,0–61,0 ms —
  **pass 1 và pass 2 median 61,0 ms (>60, xem F-160-T4-3)**;
  18/20 pass ≤60. **(c2)=5 occurrence / 5 distinct-seq,
  COVERED 5/5.**
  lag≥+5f = 0 occurrence / 0 event — sạch hoàn toàn (đợt 157:
  30 occ; đợt 158: 0 occ; đợt 159: 0 occ). **p1p3p7 chạy TAY
  (F-148-T4-1): P1 ĐÚNG, P2 ĐÚNG, P3-A1 SAI 3/5, P3' ĐẠT,
  P7 ĐÚNG** (xem §6). **KHÔNG PAGE-WEDGED** — attempt1 chạy
  đủ 20/20, 0 fetch timeout, `pageErrs: []`, JSON đầy đủ
  3.435.824 B, `passes=20`, không có trường `partial`/
  `passesDone`, probe exit=0.
- **Poller: 30 poll thật** (1 test + 29 poller), **1 boot duy
  nhất, 1 instance duy nhất** (không chết/khởi động lại; fix
  F-155-T4-1 giữ vững đợt thứ năm). RAM ≥1024: 23/30; 0 poll
  <500 MB. **1 poll** load+RAM cùng đạt — **poll đó mở cửa**
  (#29), 0 poll gần-mở bị chặn bởi apt/gate0 (gate0 đã đạt
  từ poll #17).
  Gate0: T5 12 poll, T4-check-only 1 poll, khong-dat 16 poll
  (poller) + 1 poll test khong-dat.
  apt>0: 16 poll (replay boot mới).
- **Chuỗi lượt yên hợp lệ: NỐI DÀI LÊN #25.** Cộng dồn 25 lượt:
  P1 96/97, P2 88/88, P3-A1 80/97, **P3' 61/69 occurrence =
  61/64 distinct-seq**, P7 59/59. Chuỗi median tickCost 25 lượt:
  39,0–60,0 ms, mean ~48,0 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #28 (quyết (j) đợt 158):** ngưỡng
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi
  ngưỡng/cadence nào.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc inner-end, lúc run-attempt
  exit — không đổi; mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round160-t4.done` viết ~06:1xZ 21/11
  (trong hạn cờ ~08:00Z, sớm ~1h45m), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158)

Chạy **trước mọi attempt, trước khi mở poller** (05:39–05:40Z),
ghi vào `hidden_files/round160-t4/preflight-160.txt` — **PASS
PHẦN SETUP, GATE0 CHỜ REPLAY (không phải lỗi setup)**:

- **b.json CÓ trong `round160-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156/157/158/159 (F-158-T4-1/2 KHÔNG lặp lại: file spec đã có
  trước khi poller chạy).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–159. **vite.t4-temp.config.mjs md5
  `e3e874e1528b28563f7aa26234661522`** — khớp.
- **tree-md5.txt `530e10a7` == preview.tsx hiện tại** (`530e10a7`).
- **10/10 analyzer** `analyze-t4-*.py` có mặt (c2coverage,
  c2drawlog, labellag, lag5, p1p3p7, perpass, skiplatest, stall,
  tickcost, wallbands).
- **Script hệ thống:** `vcut-webkit-postboot-check.sh` +
  `vcut-vite-lock-v2.sh` có mặt; `bash -n` OK cả 4 script T4;
  `python3 -m py_compile` OK 12 file py.
- **Playwright-core** `/home/hatch/scratch-round63-r4/
  node_modules/playwright-core/index.mjs` có mặt.
- **Media** `apps/web/public/stripes-nonperiodic.mp4` có mặt
  (140.828 B).
- **Lock + ngân sách trống:** không có `vite.lock`,
  không có `attempt-done-*` trong thư mục làm việc mới.
- **GATE0 CHƯA ĐẠT LÚC MỞ (khác đợt 159 — boot mới, replay
  chưa xong, poller chờ theo cơ chế):** boot #61 mới
  (52c957d5, btime 05:25:49Z), replay đang chạy (apt-get update
  pid 818, os-intent replay), dpkg.log chỉ 2 dòng; cờ T5-160
  CHƯA CÓ; cờ T5-159 `cu(mtime-cu)` (mtime 02:41:22Z < btime
  05:25:49Z) — KHÔNG tính cho boot mới; postboot check-only
  chạy tay **exit 1** (thiếu libs/GST, xem
  `preflight-postboot-160.log`). Đây là trạng thái chờ hợp lệ
  của boot mới, không phải lỗi setup — poller poll 45 s/lần
  và mở cửa khi gate0 đạt (xem §1, §3).
- **Test poll (POLL_TEST=1): exit 7 đúng thiết kế** —
  poll #1 RAM 1693 MB, load1 6,69/load5 2,88 (cửa đóng vì tải
  + apt + gate0 chưa đạt), gate0=khong-dat, tree YES,
  blockers comm-based 0, apt 1, dpkg 2 (xem `poll-test-160.log`).

## 1. Poller — 30 poll thật, 1 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 52c957d5
  (05:40:10Z):** poll #1 RAM=1693 MB, load1=6,69 load5=2,88,
  blockers=0, gate0=khong-dat (T5-159 cu, check-only exit 1,
  apt=1) → cửa đóng → **TEST-POLL-OK exit 7 đúng thiết kế**.
  Poll này nằm trong `poll-test-160.log`; thống kê §A đã hợp nhất.
- **Instance 2 (không POLL_TEST), 29 poll, boot 52c957d5
  (05:40:19–06:01:26Z):** RAM ≥1024: 22/29; load1<2: 15/29;
  load5<2: 5/29; gate0: khong-dat 16, T4-check-only 1, T5 12;
  lock=khong 29/29; dpkg 2 → 1545; blockers=0 (comm-based)
  cả 29 poll; apt>0: 16 poll.
- **Giai đoạn 1 — chờ replay (poll #1–#16, 05:40–05:51Z):**
  gate0 chưa đạt, apt>0, dpkg.log 2 → 1445 dòng (replay cài
  dần: poll #9 dpkg 53, #10 dpkg 252, #15 dpkg 1256),
  postboot_exit=1; RAM 1108–2196 MB, cây YES, lock trống,
  blockers 0 — **chỉ replay + tải chặn cửa**: load1 6,79 →
  3,87; load5 2,96 → 4,23.
- **Giai đoạn 2 — gate0 đạt (poll #17–#18, 05:52–05:53Z):**
  poll #17 check-only PASS lần đầu (exit 0, dpkg 1545, apt 0)
  → gate0=T4-check-only; poll #18 cờ T5-160 PASS
  (POSTBOOT_PASS viết 05:52:59Z, replay-day-du) → gate0=T5
  từ đây. Nhưng load5 còn 3,85 → 3,37 và RAM có lúc <1024
  nên cửa vẫn đóng.
- **Giai đoạn 3 — chờ tải + RAM (poll #19–#28, 05:53–06:00Z):**
  load5 hạ dần 2,97 → 1,46; RAM dao động 857–1261 MB, 7/29
  poll <1024 (poll #19 994, #20 918, #21 920, #25 937,
  #26 857, #28 981 MB — balloon ghim, xem §7(e)); load1
  0,37–1,65.
- **Giai đoạn 4 — cửa mở (poll #29, 06:01:26Z): load1=1,41,
  load5=1,53 <2, RAM=1159 MB** → **CỬA MỞ, chạy attempt1** →
  ĐẠT → poller thoát 06:05:21Z.
- **Phân rã 30 poll thật:** RAM≥1024: 23/30; RAM 500–1023:
  7/30; RAM<500: 0/30. load1<2: 15/30; load5<2: 5/30. Chỉ 1
  poll mà load + RAM cùng đạt — **poll đó mở cửa** (#29), 0
  poll gần-mở bị chặn bởi apt/gate0 (gate0 đã đạt từ #17).
  gate0: T5 12 poll, T4-check-only 1 poll, khong-dat 17 poll
  (16 poller + 1 test). blockers>0: 0 poll. apt>0: 17 poll
  (16 poller + 1 test). **KHÔNG có reboot trong phiên đo**
  (boot 52c957d5 suốt, btime 05:25:49Z, kiểm lúc đóng 06:07Z).
- **RAM sập KHÔNG tái diễn:** đợt 154: 74/147 poll <500 MB;
  đợt 155: 2/123 + 64 phút <1024 liên tiếp; đợt 156: 0/32
  <500 MB; đợt 157: 0/25 <500 MB; đợt 158: 0/18 <500 MB;
  đợt 159: 0/6 <500 MB; đợt này: **0/30 poll <500 MB** —
  RAM mở 1693 MB (test) rồi 857–2196 MB (poller); 7 poll
  500–1023 MB đều do balloon ghim sau replay, không phải sập
  RAM. Gate A RAM ≥1024 là nguyên nhân chặn cửa chính ở giai
  đoạn 3 (cùng load5).

## 2. Một attempt — ĐẠT NGAY, 0 wedge

- **Attempt1-52c957d5 (06:01:26–06:05:21Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 44,0 ≤ 60, lớp B 5/5).** Vite :5187
  (ready 390 ms, giữ lock ~4 phút), WebKit 27.2 (Xvfb :193),
  app boot OK 06:01:36Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT,
  RELABEL BẬT. 20 pass (wall 2869–3439 ms/pass): tickCost
  n=639, blendTick n=513, c2DrawLog n=1239.
  **tickCost total median= 44,0 ms (p90 70,0, max 100, min 28)**
  — dư 16,0 ms dưới cổng; hậu flip+2000 ms median 43,0.
  **Lớp B: ĐẠT 5/5** (B1 load5 cuối 1,26 ≤2,5; B2 load1 max
  2,75 ≤4 — xem caveat ps dưới; B3 không reboot; B4 pgrep
  -x=0, ps exact-comm=0, dpkg delta=0; B5 RAM min 956 MB,
  0 mẫu <500 MB, **2/101 mẫu <1024 MB** — tốt hơn đợt 158
  (75/101 mẫu <1024), ngang đợt 159 (0/103)). Sampler n=101.
  Per-pass: tickCost median/pass 38,0–61,0 ms — **pass 1 và
  pass 2 median 61,0 ms (>60, F-160-T4-3)**; load1 trong
  attempt 1,09–2,75 (mean/pass 1,09–2,72, tăng dần qua các
  pass); RAM mean/pass **1129 → 1099 MB** (balloon ghim nhẹ
  trong lúc đo — nhẹ hơn hẳn đợt 158: 837 → 657 MB; xem
  §7(e)). Pearson r=-0,40 median~load1_mean, r=0,09
  median~RAM_mean (chỉ mô tả; r âm — pass median cao nhất
  lại ở đầu lượt khi tải thấp nhất, xem F-160-T4-3).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.435.824 B (md5
  `b3990daa00c18695189179e5ca4ee48d`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **(c2)=5 occurrence / 5 distinct-seq, COVERED 5/5.**
  lag≥+5f = 0 occurrence / 0 event — đây là số (a)/(b) (label
  lag sau presented), không phải (c2); ghi nhận, không dùng
  làm verdict. **p1p3p7 chạy TAY (xem §6).**
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (76/76 +
  314/314 tick không vi phạm thật, bar ≥30 tick, xem
  skiplatest).
- **Caveat B2 (F-160-T4-4, ghi nhận — KHÔNG đổi verdict):**
  `ps-before` có process của luồng khác — T9 sampler.sh
  (pid 3133) + b2-watcher.sh (pid 3458) và T2
  `hole-recheck9292.py` (pid 37530); `ps-after` vẫn còn T9
  sampler/b2-watcher, T2 đã hết giữa attempt. Load1 trong
  cửa sổ tăng dần 1,09 → 2,75 (mean/pass), load5 cuối 1,26 —
  máy vẫn yên về hiệu ứng theo tiêu chí B2 (load1 max 2,75
  ≤4); không có bằng chứng process lạ gây tải đột biến trong
  lúc đo (tải tăng đều, không spike). B2 ĐẠT theo tiêu chí
  tải; ghi nhận sự hiện diện này để T10/T8 đối chiếu, verdict
  giữ nguyên (cùng mẫu F-159-T4-3).
- **Lưu ý (c2) seq 259 (quyết (j) đợt 156):** đợt này KHÔNG
  phát sinh trường hợp tương tự — cả 5 seq đều mới (xem §6);
  không có seq nào ĐẠT trong attempt không hợp lệ để phải
  loại trừ.

## 3. Replay/postboot trên boot mới — cờ T5 CÓ

- **Boot 52c957d5 (reboot #61 ứng viên, btime 05:25:49Z):**
  replay chạy trong phiên T4 (không xong trước khi mở như
  đợt 159): dpkg.log 2 dòng lúc mở → 1545 dòng lúc poll #17
  (05:52:24Z); T5-160: **POSTBOOT_PASS mới viết 05:52:59Z
  (boot+27m10s; dpkg 1545 dòng; replay-day-du, không cần
  repair; old=eec65561)**; cờ cũ lưu `POSTBOOT_PASS` bản
  trước (xem `round160-t5/`). Gate0=T4-check-only từ poll
  #17 (check-only PASS độc lập exit 0), gate0=T5 từ poll
  #18. T4 check-only trong poller chạy ở poll #1/#5/#9/#13/
  #17 (mỗi 4 poll): exit 1 ở #1/#5/#9/#13 (replay chưa xong),
  exit 0 ở #17 (`postboot-t4-160-gate0wait-*.log`).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:** boot
  52c957d5 lúc mở poller (05:40:19Z), lúc attempt1, lúc poller
  thoát (06:05:21Z) và lúc kiểm cuối (06:07Z) — btime
  05:25:49Z không đổi. Số hiệu #61 ĐÃ ĐƯỢC XÁC NHẬN (T2-160,
  ghi nhật ký 06:13Z 21/11: reboot #61 xác nhận, 52c957d5,
  btime 05:25:49Z giờ thật); mù #92? (#60) giao T2-160,
  mù #93? (#61, nếu có) giao T2-161 — T4 không tự xác nhận
  số hiệu reboot.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND160_T4_WEBKIT_QUIET29_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round160-t4/`):**
  `poll-wait-t4-160.sh` (deadline 07:30Z 21/11 + cờ T5
  round160-t5/ + fallback round159-t5/ + nhãn T4-160a),
  `run-attempt-160.sh` (đổi số vòng/đường dẫn/nhãn so với 159).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–159, md5
  `4291e539...`) và **KHÔNG ghi đè `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round160-t4/` — inner có fix F-156-T4-1 đổi
  `round159-*` → `round160-*`, theo đúng mẫu 149–159: chỉ
  stage 2 script trên; fix inner theo bản làm việc sang đợt
  161). **`b.json` KHÔNG stage** (file spec làm việc, theo mẫu
  các đợt trước — chỉ có trong `hidden_files/round160-t4/`,
  md5 `078938cf...`, giống hệt bản đợt 156/157/158/159).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-160.sh`, `run-attempt-160.sh`,
  `t4-attempt-inner.sh` (CÓ fix F-156-T4-1 đổi sang
  `round160-*`), `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-160.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn mới 25 lượt, xem F-160-T4-5),
  `distinct-seq-160.py` (helper cột distinct-seq — cơ số đã
  cập nhật 56/59, xem §6 + F-160-T4-6),
  `preflight-160.txt` + `preflight-postboot-160.log`
  (pre-flight check, quyết (t) đợt 158).
- **Log/evidence (hidden_files/round160-t4/, không stage):**
  `poll-t4.log` (start ×1 instance + 29 poll thật + CUA YEN MO
  ×1 + LUOT HOP LE), `poll-test-160.log` (test start + 1 poll
  thật + TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`, `postboot-t4-160-gate0wait-*.log` (check-only
  poll #1/#5/#9/#13 exit 1, #17 exit 0),
  `appendix-160.txt` (output stats-160.py),
  `preview-b-f3-flip-webkit-t4-attempt1-52c957d5.json`
  (3.435.824 B, 20/20, md5 `b3990daa00c18695189179e5ca4ee48d`)
  + `run-webkit-t4-attempt1-52c957d5.log` +
  `load-mid-t4-attempt1-52c957d5.log` (sampler n=101) +
  `ps-before/after-t4-attempt1-52c957d5.txt`
  + `classb-t4-attempt1-52c957d5.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-52c957d5-*.txt` (10 file/attempt)
  + `analyze-t4-p1p3p7-attempt1-52c957d5.txt`
  + `coverage-check-attempt1-52c957d5.txt` (5/5)
  + `attempt-done-attempt1-52c957d5` (exit 0).
  `analyze-l7-labellag.txt` + `lag5-detail.txt` là output mặc
  định của analyzer (ghi theo tên mặc định trong script —
  xem F-157-T4-6), nội dung trùng bản per-attempt.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 06:05:21Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round160-t4-quiet29.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round160-t4.done` (~06:1xZ 21/11 — trong
  hạn cờ ~08:00Z, sớm ~1h45m, CÓ NỘI DUNG).

## 5. Sai số F-160-T4-1..6 (+ nợ cũ)

- **F-160-T4-1 — COPY-FORWARD sed CẦN MẪU THỨ 4: `poll-test-NNN`
  / `stats-NNN.py` / `distinct-seq-NNN.py` / `brief dot NNN`
  (sai số quy trình, phát hiện + sửa TRƯỚC KHI poller chạy nhờ
  grep kiểm, không ảnh hưởng đo).** Sed 3 mẫu của F-159-T4-2
  (`roundNNN`, `t4-NNN`, `attempt-NNN`) không đổi được
  `poll-test-159.log` trong poll-wait (dòng POLLLOG — test poll
  sẽ ghi nhầm vào file đợt 159), `poll-test-159.log` +
  `stats-159.py` trong stats-159.py, `distinct-seq-159.py`
  trong distinct-seq, và `brief dot 159` trong comment deadline.
  Grep `159` sau sed phát hiện và sửa hết trước pre-flight
  (chỉ còn `round159-t5` fallback — đúng). Bài học: copy-forward
  phải grep toàn bộ `NNN` cũ sau sed, không chỉ 3 mẫu — đã làm
  đúng quy trình kiểm, không lỗi nào lọt vào poller.
- **F-160-T4-2 — P3-A1 SAI 3/5 LẦN ĐẦU KỂ TỪ ĐỢT 157 (không phải
  sai số thao tác — kết quả đo thật, xem §6).** p1p3p7 tay exit 0:
  P3-A1 baseline đóng băng 90/389, (c2) đóng băng-tại-tick 3/5
  [201, 254, 437], p=0,084843 ≥0,01 → SAI theo luật DEF §5.
  P3' (stall-based, prereg) vẫn ĐẠT 5/5 (stall 3, 4, 5, 7, 7).
  Verdict lượt hợp lệ KHÔNG đổi (verdict = probe 20/20 + lớp B
  5/5 + tickCost median ≤60; P3-A1 là bằng chứng cộng dồn, không
  phải cổng lượt). Chuỗi P3-A1 ĐÚNG bị cắt (158: 7/7, 159: 5/5
  → 160: 3/5); cộng dồn 77/92 → **80/97**. Không mở lại điều
  tra (c2) (xem §6: không có điều kiện mở lại nào xảy ra).
- **F-160-T4-3 — PER-PASS MEDIAN PASS 1 + PASS 2 = 61,0 ms
  (>60) — LẦN ĐẦU TRONG CHUỖI HỢP LỆ (quan sát đo, không đổi
  verdict).** Đợt 159: 20/20 pass ≤60 (38,5–59,0 ms). Đợt này
  pass 1 median 61,0 (n=23), pass 2 median 61,0 (n=27); 18 pass
  còn lại 38,0–54,5 ms. Cổng lượt là tickCost TOTAL median
  (44,0 ≤60) nên verdict đứng. Đáng chú ý: 2 pass >60 lại ở
  ĐẦU lượt khi tải THẤP nhất (load1 mean/pass 1,19 / 1,09;
  wallband 0–20k median 53,0 — cao nhất các band), còn các pass
  sau tải cao hơn (load1 2,4–2,75) mà median thấp hơn (38–54,5;
  r=-0,40) — nên KHÔNG phải tải gây ra; có thể là warm-up đầu
  lượt. Ghi nhận để T10/T8 đối chiếu, không tự kết luận.
- **F-160-T4-4 — ps-before/after CÓ PROCESS LUỒNG KHÁC
  (caveat B2, xem §2 — KHÔNG đổi verdict).** T9 sampler.sh +
  b2-watcher.sh có mặt cả trước và sau attempt; T2
  `hole-recheck9292.py` có mặt lúc attempt bắt đầu, hết giữa
  attempt. Load1 max 2,75 / load5 cuối 1,26 trong cửa sổ →
  B2 ĐẠT theo tiêu chí tải (cùng mẫu F-159-T4-3). Ghi nhận để
  T10/T8 đối chiếu khi xét chuỗi FULL PASS; T4 không tự đổi
  luật B2.
- **F-160-T4-5 — FOOTER stats-*.py VẪN IN CỘNG DỒN CŨ THEO MẪU
  (phát hiện + sửa trong phiên, không ảnh hưởng đo).**
  `stats-160.py` copy-forward từ 159 vẫn in dòng cộng dồn 24
  lượt (P1 91/92...) và chuỗi median 24 lượt. T4 sửa footer
  thành cộng dồn MỚI 25 lượt (P1 96/97, P2 88/88, P3-A1 80/97,
  P3' 61/69 = 61/64, P7 59/59; chuỗi median n=25 mean 48,0)
  rồi chạy lại stats → `appendix-160.txt` đã đúng. Bài học:
  copy-forward stats-*.py phải cập nhật cả 2 dòng footer in
  cứng — giao T4-161 kiểm lại (nợ nhỏ).
- **F-160-T4-6 — HELPER distinct-seq ĐÃ CẬP NHẬT CƠ SỐ NHƯNG
  VẪN CHƯA TRỪ SEQ CŨ TỰ ĐỘNG (vá một phần F-159-T4-4 —
  đợt này KHÔNG SAI SỐ NHỜ KIỂM TAY).** `distinct-seq-160.py`
  đã đổi cơ số 51/54 → 56/59 (hậu-159) nên in 61/64. T4 kiểm
  tay bằng grep từng seq trên toàn bộ LIMITS T4 cũ (xem §6):
  **không seq nào trong 5 seq từng xuất hiện trong dòng (c2)/
  DAT/stall của attempt hợp lệ nào** — seq 230 chỉ từng xuất
  hiện dưới dạng số 0,230 (baseline P stall, đợt 151), KHÔNG
  phải seq (c2). Kết luận: cả 5 seq đều mới, 61/64 là ĐÚNG.
  Nợ vá helper tự động (đọc sổ distinct-seq) vẫn còn — giao
  T10/T4-161.
- **F-160-T4-7 (nhỏ) — blendTick ĐẾM CHÊNH 1 GIỮA 2 ANALYZER
  (không ảnh hưởng verdict).** tickcost analyzer đếm blendTick
  n=513, coverage analyzer đếm n=514 (cùng JSON). Chênh 1,
  có thể do đếm biên flip; không ảnh hưởng (c2)/tickCost/lớp B.
  Ghi nhận, không điều tra riêng.
- **F-159-T4-1/2 — ĐÃ TRÁNH (bài học áp dụng thành công).**
  p1p3p7 tay chạy 1 lần với đủ 2 đối số (seqs CSV lấy từ
  labellag) → exit 0 ngay; copy-forward sed + grep kiểm 4 mẫu
  (F-160-T4-1) trước poller.
- **F-158-T4-1/2 — ĐÃ TRÁNH (pre-flight check, quyết (t)).**
  Pre-flight check bắt buộc chạy trước poller đã kiểm `b.json`
  có mặt + md5 khớp — lỗi quên copy file setup của đợt 158
  không lặp lại; attempt1 ĐẠT NGAY, ngân sách chỉ dùng 1/3.
- **F-157-T4-2 — ĐÃ TRÁNH (bài học áp dụng thành công).**
  Khi sed copy-forward poll-wait, T4 grep cả 3 dạng deadline
  (`07:30:00 UTC`, `07:30Z`, `T07:30:00Z`) sau sed — 0 còn
  sót dạng cũ `04:30` (chỉ còn chuỗi lịch sử `brief dot 160`
  đã sửa đúng).
- **F-156-T4-1 — ĐÃ VÁ + THEO BẢN LÀM VIỆC SANG ĐỢT 160,
  CHƯA STAGE.** Mẫu `round159-*` trong t4-attempt-inner.sh đã
  đổi thành `round160-*` trong bản làm việc (kiểm bằng grep).
  Theo mẫu 149–159 inner KHÔNG stage vào repo nên fix này vẫn
  chỉ ở bản làm việc — sẽ theo sang đợt 161.
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-160 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này.** p1p3p7 chạy TAY sau
  poller, exit 0, output lưu
  `analyze-t4-p1p3p7-attempt1-52c957d5.txt` (xem §6). Nợ đứng
  ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt
  có attempt hợp lệ T4 phải chạy tay và ghi rõ.

## 6. P3' cộng dồn (MỚI — 25 lượt hợp lệ) + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 160 (MỚI): P1 96/97, P2 88/88,
  P3-A1 80/97, P3' 61/69 occurrence = 61/64 distinct-seq, P7
  59/59** (25 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 159 §6: "24 lượt hợp lệ" — nay 25).
- **Đóng góp lượt #29 (attempt1-52c957d5, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=5 occurrence / 5 distinct-seq [201, 230, 254, 437, 469].
  - **P1 ĐÚNG — 5/5 occ** (distinct 5/5 gần run-end:
    run_end seqs [146, 175, 201, 229, 254, 280, 309, 334, 360,
    384, 408, 437, 469, 491]; baseline 42/390, p=1,44852e-05
    trên distinct 5/5). Cộng dồn 91/92 → **96/97**.
  - **P2 ĐÚNG — 5/5 occ** lag ≥+1f, 0 lag âm (lag từng
    tuple: 1, 1, 1, 1, 1 — tất cả +1f). Cộng dồn 83/83 →
    **88/88**.
  - **P3-A1 SAI — 3/5 occ** (distinct 3/5: 201, 254, 437 đóng
    băng-tại-tick; 230, 469 không; baseline 90/389,
    p=0,084843 trên distinct 3/5). Cộng dồn 77/92 →
    **80/97**. (Đợt 157 P3-A1 SAI 4/11 — đợt 158 ĐÚNG 7/7,
    đợt 159 ĐÚNG 5/5, đợt này SAI 3/5 — chuỗi ĐÚNG bị cắt.)
  - **P3' 5/5 occ ĐẠT** (distinct 5/5; DAT seq 201 stall 3,
    230 stall 4, 254 stall 5, 437 stall 7, 469 stall 7).
    Cộng dồn 56/64 → **61/69 occurrence**; distinct 56/59 →
    **61/64** (5 seq đều mới — xem kiểm chứng dưới).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 28, 0: 32}; đối chứng toàn bộ drawSrc post: {-1: 325,
    0: 154}, 0/479 entry). Cộng dồn 58/58 → **59/59**.
- **Kiểm chứng 5 seq "đã thấy" (F-160-T4-6):** grep toàn bộ
  LIMITS T4 cũ cho thấy **không seq nào trong 5 seq từng
  xuất hiện trong dòng (c2)/DAT/stall của attempt hợp lệ
  nào**. Seq 230 chỉ từng xuất hiện dưới dạng số 0,230
  (baseline P(stall≥2), đợt 151) — đó là xác suất, KHÔNG phải
  seq (c2), nên chưa từng được đếm. 4 seq còn lại (201, 254,
  437, 469) không xuất hiện trong bất kỳ dòng (c2)/DAT/stall
  nào; grep danh sách `[...]` trên toàn bộ LIMITS cũ cũng
  trả 0 hit cho cả 5 số. → 5/5 seq mới, helper in 61/64 là
  đúng, không cần hiệu chỉnh.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** — P3-A1 SAI 3/5 một lượt KHÔNG phải
  điều kiện mở lại (§13 DEF v0.5): (1) P1 ĐÚNG; (2) lag âm —
  KHÔNG (0); (3) +2f ≥3 — KHÔNG (tất cả lag đều +1f). P3'
  (prereg stall-based) vẫn ĐẠT 5/5 — bằng chứng ủng hộ chính
  không suy yếu. lag≥+5f = 0 occurrence — lượt sạch thứ ba
  liên tiếp về lag.
- Chuỗi median tickCost 25 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  40,0 / 41,0 / 41,0 / 44,5 / **44,0 ms** (trung bình ~48,0 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60). Lượt này 44,0 ms —
  thấp thứ 8 trong chuỗi (đồng hạng với đợt 154).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 161

- **(a) #29 CÓ lượt hợp lệ — lượt hợp lệ #25 (chuỗi lượt yên
  hợp lệ NỐI DÀI #22 → #23 → #24 → #25).** Từ phía T4, **chân
  lượt yên cho chuỗi FULL PASS (O8) ĐÃ ĐẠT** — lượt yên #29
  thuộc boot 52c957d5 (#61 ứng viên). O8 chạy trên boot nào,
  có qua gate chuẩn hay phải dùng thủ tục (i), là do T8/T10
  quyết theo tiền lệ (quyết (h) đợt 157: chuỗi được tính khi
  O8 chạy sau lượt yên về thời gian, dù reboot xen giữa đổi
  boot). T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
- **(b) P3' cộng dồn MỚI 61/69 = 61/64 (xem §6 + F-160-T4-6):**
  helper in 61/64 — T4 đã kiểm tay bằng grep từng seq trên
  LIMITS cũ (seq 230 chỉ có trong số 0,230 baseline nên chưa
  được đếm). **P3-A1 SAI 3/5** — cộng dồn 80/97. T10 kiểm lại
  phép cộng khi viết aggregate (§12): P1 96/97, P2 88/88,
  P3-A1 80/97, P3' 61/69 = 61/64, P7 59/59.
- **(c) PAGE-WEDGED KHÔNG tái diễn lần thứ tư liên tiếp (0
  wedge đợt 157 + 0 wedge đợt 158 + 0 wedge đợt 159 + 0 wedge
  đợt này).** Chữ ký đợt 156 (2 wedge liên tiếp, fetch
  writePartial timeout 30 s) không xuất hiện — attempt1 chạy
  đủ 20/20 sạch. T4-161 tiếp tục theo dõi, ghi nhận nếu tái
  diễn; chưa mở điều tra riêng (quyết (j) đợt 156 giữ nguyên).
  Câu hỏi đợt 156 §7(c) (wedge có tính là "kẹt" cho chuỗi "P3
  không kẹt" của T8 không) VẪN MỞ — đợt này không có wedge mới
  nên không thêm dữ kiện.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) ĐÃ ÁP DỤNG
  THÀNH CÔNG — giữ làm quy tắc đứng, kèm bổ sung:** pre-flight
  PASS phần setup, F-158-T4-1/2 không lặp lại, attempt1 ĐẠT
  NGAY, ngân sách chỉ dùng 1/3. **Bổ sung từ đợt này:** trên
  boot MỚI, gate0 có thể CHƯA ĐẠT lúc mở pre-flight (replay
  chưa xong — check-only exit 1, cờ T5 chưa có) và đó là trạng
  thái chờ hợp lệ, KHÔNG phải lỗi setup: poller chờ gate0 theo
  cơ chế (đợt này chờ 16 poll mới có gate0). T4-161 chạy
  pre-flight y hệt trước mọi attempt (checklist §0b), ghi rõ
  gate0 đạt/chưa đạt lúc mở.
- **(e) RAM TRONG ATTEMPT1 GIẢM NHẸ 1129 → 1099 MB mean/pass
  (sampler n=101: min 956, max 1670, 2/101 mẫu <1024):**
  balloon ghim nhẹ trong lúc đo — nhẹ hơn hẳn đợt 158 (837 →
  657 MB, 75/101 mẫu <1024), ngang đợt 159 (0/103 mẫu <1024;
  đợt này 2/101). B5 vẫn ĐẠT (min ≥500 MB) nên không ảnh
  hưởng verdict, nhưng T9 đối chiếu với sampler balloon của
  mình. Ghi nhận thêm: RAM poll ghim dưới 1024 ở 7/29 poll
  trước khi cửa mở (857–994 MB) — gate A lúc poll có thể khó
  mở hơn khi balloon ghim; không tự kết luận.
- **(f) F-160-T4-4 (ps-before/after có process luồng khác):**
  T9 sampler/b2-watcher + T2 hole-recheck có mặt lúc attempt
  bắt đầu; load1 max 2,75 → không bằng chứng gây tải đột
  biến. T10 ghi nhận khi xét chuỗi FULL PASS; T4 không tự
  đổi luật B2.
- **(g) ĐIỂM MÙ LIVE-DIAG F-158-T8-4 (quyết (u) đợt 158) —
  GIỚI HẠN ĐỨNG, CHƯA BỔ SUNG KIỂM "NỘI DUNG TƯƠI".**
  HB128 heartbeat làm tươi log mtime nên live-diag dựa trên
  mtime có thể mù (live-diag 0/2 ở 85m4). Đợt này **không có
  kẹt nào** (0 wedge, probe chạy sạch 20/20) nên live-diag
  không được thử thách — không có dữ kiện mới về việc nó bắt
  được hay không bắt được kẹt. Ghi nhận làm giới hạn đứng;
  không bổ sung kiểm "nội dung tươi" theo quyết (u).
- **(h) F-160-T4-6 (helper distinct-seq chưa trừ seq cũ tự
  động):** cơ số helper đã cập nhật 56/59 trong
  distinct-seq-160.py (vá một phần), nhưng kiểm tay bằng grep
  vẫn cần mỗi đợt. Có nên vá helper đọc sổ distinct-seq cộng
  dồn (hoặc grep LIMITS cũ tự động) để T4-161 không phải kiểm
  tay không? T4 không tự đổi — chờ T10/parent phán (nợ từ
  F-157-T4-5).
- **(i) Các nợ đứng khác giữ nguyên từ đợt 159 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#92? giao T2 (mù #88? MỞ,
  #92? (#60) giao T2-160); birefnet 0 thử (lần thứ 14 liên
  tiếp — đợt này không thử); u2net là fallback chính thức;
  run 159 kết cục thuộc T7-160 (SUCCEEDED 05:14:08Z theo T2-160);
  reboot #61 ĐÃ XÁC NHẬN (T2-160, 06:13Z); POSTBOOT_PASS #61
  ĐÃ CÓ (T5-160, 05:52:59Z — xem §3).
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate mở 06:01:26Z
  (poll #29); attempt1 ĐẠT → **GATE cho chuỗi FULL PASS ĐẠT
  từ phía T4** (có lượt yên hợp lệ #29 trên boot 52c957d5).
  T8 tự quyết thủ tục (i) sau waiter hết hạn / boot mới; T4
  chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-160.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-160.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-21T05:40:10Z - 2026-11-21T05:40:10Z, boot=52c957d5
   RAM min=1693 max=1693 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 0/1 load5<2: 0/1 blockers>0: 0 apt>0: 1
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 29 poll, 2026-11-21T05:40:19Z - 2026-11-21T06:01:26Z, boot=52c957d5
   RAM min=857 max=2196 >=1024: 22/29 500-1023: 7/29 <500: 0/29
   load1<2: 15/29 load5<2: 5/29 blockers>0: 0 apt>0: 16
   gate0: T4-check-only=1, T5=12, khong-dat=16
   lock: khong=29
   dpkg 2->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 30
-- RAM toan phien: min=857 max=2196 >=1024: 23/30 <500: 0/30
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 1/30
   gan-mo? #29 2026-11-21T06:01:26Z boot=52c957d5 RAM=1159 L1=1.41 L5=1.53 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 52c957d5: 30 poll; RAM>=1024 lan cuoi: 2026-11-21T06:01:26Z #29; RAM<1024 lan dau: 2026-11-21T05:53:55Z #19 RAM=994
-- cong don P3' (MOI, 25 luot hop le): P1 96/97 P2 88/88 P3-A1 80/97 P3' 61/69 occ = 61/64 distinct-seq P7 59/59
-- chuoi median 25 luot: n=25 mean=48,0 min=39,0 max=60,0 vuot-60: 0
```
