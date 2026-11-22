# PHASE9_ROUND161_T4_WEBKIT_QUIET30_LIMITS.md

**Đợt:** 161. **Luồng:** T4 — đo lượt yên WebKit #30 trên 1 boot
+ LƯỢT HỢP LỆ #26 (chuỗi lượt yên hợp lệ nối dài: #22 đợt 157 →
#23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161)
+ KHÔNG PAGE-WEDGED (0 wedge — lần thứ 5 liên tiếp: đợt 157, 158,
159, 160, 161).
**Ngày:** 21/11/2026 (lượt cron 15:35 +07 21/11 = 08:35:51Z 21/11).
**Boot đo:** 39d46ba0 (reboot #62 ỨNG VIÊN, CHƯA XÁC NHẬN — T2-161,
btime 07:59:29Z — boot lúc mở; KHÔNG có reboot mới trong lúc đo hay
lúc đóng sổ; kiểm cuối 09:56Z vẫn 39d46ba0).
**Trạng thái:
#30 CÓ LƯỢT HỢP LỆ — attempt2 ĐẠT ở lần mở cửa thứ hai
(09:47:01Z), ngân sách 3/3 chỉ dùng 2/3 (attempt1 B5 VI PHẠM,
retry đúng cơ chế; poller thoát 09:50:52Z, trước hạn cắt poller
10:30Z gần 40 phút, trước hạn cờ ~11:00Z hơn 1 giờ). Attempt2-39d46ba0
probe 20/20, LỚP B ĐẠT 5/5, tickCost median 44,0 ms ≤60 (dư 16,0 ms).
(c2)=3 occurrence / 3 distinct-seq, COVERED 3/3. P1 ĐÚNG (3/3 occ),
P2 ĐÚNG (3/3 lag +1f, 0 âm), P3-A1 SAI 2/3 (p=0,1395, KHÔNG mở lại
điều tra (c2)), P3' 3/3 occ ĐẠT (DAT seq 262, 322, 367 — NHƯNG
seq 367 ĐÃ THẤY đợt 144 nên distinct mới chỉ +2), P7 ĐÚNG (0 entry
trễ ≥+1f). lag≥+5f = 0 occurrence (sạch như đợt 158, 159, 160).
Cộng dồn MỚI (26 lượt hợp lệ): P1 99/100, P2 91/91, P3-A1 82/100,
P3' 64/72 occurrence = 63/66 distinct-seq, P7 60/60. PRE-FLIGHT CHECK
(quyết (t) đợt 158) PASS PHẦN SETUP — gate0 CHƯA ĐẠT lúc mở vì boot
#62 mới, replay tự nhiên KHÔNG bắt đầu (frozen), T5 early-repair
mới cứu được cờ (khác đợt 160: replay tự nhiên; xem §0b + §3).
Cờ T5-161 CÓ cho boot đo (POSTBOOT_PASS 08:59:30Z, repair-som-quyet-h,
dpkg 795 dòng). RAM SẬP <500 MB TÁI DIỄN lần đầu kể từ đợt 156
(37/89 poll <500 MB, chuỗi dài nhất 17 poll) — attempt1 B5 VI PHẠM
vì RAM rơi xuống 437 MB giữa lượt.**

## 0. Verdict tổng

- **#30 CÓ LƯỢT HỢP LỆ (lượt hợp lệ #26, attempt2).**
  Ngân sách 3 attempt/đợt dùng **2/3**: attempt1 B5 VI PHẠM (RAM
  min 437 MB giữa lượt — xem F-161-T4-1), poller poll lại gate
  theo quyết (h) đợt 149 và mở cửa lại ngay poll #88 (09:47:01Z,
  RAM 1593 MB) → attempt2 ĐẠT → poller thoát 09:50:52Z vì
  LUOT HOP LE — KHÔNG phải hết ngân sách hay hết hạn (hạn cắt
  10:30Z còn ~40 phút, hạn cờ ~11:00Z còn hơn 1 giờ).
- **Attempt1-39d46ba0 (09:43:13–09:47:01Z): probe 20/20,
  KHÔNG HỢP LỆ (lớp B VI PHẠM — B5).** Vite :5187 (ready
  319 ms, giữ lock ~4 phút), WebKit 27.2, Xvfb :193, app boot
  OK 09:43:21Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT.
  20 pass (wall 2830–3443 ms/pass): tickCost n=641, blendTick
  n=519, c2DrawLog n=1246. **tickCost total median= 41,0 ms
  (p90 69,0, max 101, min 28)**; hậu flip+2000 ms median 41,0.
  Per-pass median 36,0–51,5 ms — 20/20 pass ≤60. **(c2)=5
  occurrence / 5 distinct-seq, COVERED 5/5** — NHƯNG attempt
  KHÔNG hợp lệ nên 5 seq [295, 379, 403, 424, 448] KHÔNG cộng
  dồn (quyết (j) đợt 156). lag≥+5f = 0 occurrence.
  **Lớp B: B1/B2/B3/B4 ĐẠT, B5 VI PHẠM** (sampler n=100: RAM
  min 437 MB, **12/100 mẫu <500 MB**, 41/100 mẫu <1024 MB;
  load1 max 2,89, load5 cuối 0,76; dpkg delta 0). **KHÔNG
  PAGE-WEDGED** — attempt1 chạy đủ 20/20, 0 fetch timeout,
  `pageErrs: []`, JSON đầy đủ 3.545.196 B, `passes=20`,
  không có trường `partial`/`passesDone`, probe exit=0.
  **p1p3p7 KHÔNG chạy cho attempt1** (attempt không hợp lệ —
  chỉ chạy cho attempt hợp lệ, theo mẫu các đợt trước).
- **Attempt2-39d46ba0 (09:47:01–09:50:52Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 44,0 ≤ 60, lớp B 5/5).** Vite :5187
  (ready 385 ms, giữ lock ~4 phút), WebKit 27.2 (Xvfb :193),
  app boot OK 09:47:10Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT,
  RELABEL BẬT. 20 pass (wall 2969–3580 ms/pass): tickCost
  n=636, blendTick n=518, c2DrawLog n=1234.
  **tickCost total median= 44,0 ms (p90 70,0, max 117, min 28)**;
  hậu flip+2000 ms median 42,0. Per-pass: tickCost median/pass
  38,0–58,0 ms — **20/20 pass ≤60** (khác đợt 160: pass 1 +
  pass 2 = 61,0 ms). **(c2)=3 occurrence / 3 distinct-seq,
  COVERED 3/3.** lag≥+5f = 0 occurrence / 0 event — sạch hoàn
  toàn (đợt 157: 30 occ; đợt 158/159/160/161: 0 occ).
  **p1p3p7 chạy TAY (F-148-T4-1): P1 ĐÚNG, P2 ĐÚNG, P3-A1 SAI
  2/3, P3' ĐẠT, P7 ĐÚNG** (xem §6). **KHÔNG PAGE-WEDGED** —
  attempt2 chạy đủ 20/20, 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.506.025 B, `passes=20`, không có trường
  `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (75/75 +
  305/305 tick không vi phạm thật, bar ≥90%, xem skiplatest).
- **Poller: 89 poll thật** (1 test + 88 poller), **1 boot duy
  nhất, 1 instance duy nhất** (không chết/khởi động lại; fix
  F-155-T4-1 giữ vững đợt thứ sáu). RAM ≥1024: 27/89;
  **37/89 poll <500 MB** (tái diễn sau 4 đợt 0 poll — xem
  F-161-T4-7); chuỗi RAM<500 dài nhất 17 poll. **2 poll**
  load+RAM cùng đạt — **cả 2 đều mở cửa** (#87 attempt1,
  #88 attempt2); **20 poll gần-mở bị chặn bởi gate0**
  (load+RAM đủ nhưng gate0 chưa đạt — replay/early-repair chưa
  xong, xem §1). Gate0: T5 60 poll, khong-dat 28 poll (poller)
  + 1 poll test khong-dat. apt>0: 17 poll (replay/early-repair).
- **Chuỗi lượt yên hợp lệ: NỐI DÀI LÊN #26.** Cộng dồn 26 lượt:
  P1 99/100, P2 91/91, P3-A1 82/100, **P3' 64/72 occurrence =
  63/66 distinct-seq**, P7 60/60. Chuỗi median tickCost 26 lượt:
  39,0–60,0 ms, mean ~47,8 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #29 (quyết (i) đợt 160):** ngưỡng
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi
  ngưỡng/cadence nào.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc inner-end, lúc run-attempt
  exit — không đổi; mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round161-t4.done` viết ~09:5xZ 21/11
  (trong hạn cờ ~11:00Z, sớm hơn 1 giờ), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158)

Chạy **trước mọi attempt, trước khi mở poller** (08:38:13–08:38:21Z),
ghi vào `hidden_files/round161-t4/preflight-161.txt` — **PASS
PHẦN SETUP, GATE0 CHỜ REPLAY (không phải lỗi setup)**:

- **b.json CÓ trong `round161-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156/157/158/159/160 (F-158-T4-1/2 KHÔNG lặp lại: file spec đã có
  trước khi poller chạy).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–160. **vite.t4-temp.config.mjs md5
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
- **Deadline waiter epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG
  (bài học F-156-T8-3):** chuỗi deadline trong script
  `2026-11-21 10:30:00 UTC` → epoch **1795257000** =
  2026-11-21T10:30:00Z — khớp đúng hạn cắt poller 10:30Z
  (hạn cờ ~11:00Z = 1795258800, hạn cứng 11:30Z =
  1795260600); không còn sót dạng `07:30`/`08:00`/`08:30`
  nào trong script mới (grep 0 hit).
- **GATE0 CHƯA ĐẠT LÚC MỞ (boot mới, replay chưa bắt đầu —
  khác đợt 160: replay đã chạy lúc mở):** boot #62 mới
  (39d46ba0, btime 07:59:29Z), dpkg.log chỉ 2 dòng, apt-get/
  dpkg đều 0 process lúc kiểm; cờ T5-161 CHƯA CÓ; cờ T5-160
  `cu(mtime-cu)` (mtime 05:52:59Z < btime 07:59:29Z) — KHÔNG
  tính cho boot mới; postboot check-only chạy tay **exit 1**
  (thiếu libs/GST, xem `preflight-postboot-161.log`).
  Đây là trạng thái chờ hợp lệ của boot mới, không phải lỗi
  setup — poller poll 45 s/lần và mở cửa khi gate0 đạt
  (xem §1, §3).
- **Test poll (POLL_TEST=1): exit 7 đúng thiết kế** —
  poll #1 RAM 2647 MB, load1 1,59/load5 0,97 (cửa đóng vì
  gate0 chưa đạt), gate0=khong-dat, tree YES,
  blockers comm-based 0, apt 0, dpkg 2 (xem `poll-test-161.log`).
- **Copy-forward đợt 160 → 161:** grep toàn bộ `160` cũ sau
  sed — chỉ còn `round160-t5` fallback (đúng) + chú thích lịch
  sử; sửa thêm 4 chỗ sed 3 mẫu bỏ sót (`run-attempt-160.sh`
  trong poll-wait dòng 269 — FUNCTIONAL, đã sửa thành 161
  trước khi chạy; xem F-161-T4-8). Deadline `07:30` → `10:30`
  ở cả 3 dạng (`2026-11-21 07:30:00 UTC`, `07:30Z`,
  `T07:30:00Z`); `brief dot 160` → `brief dot 161`;
  `poll-test-160`/`stats-160`/`distinct-seq-160` → 161;
  base distinct-seq 56/59 → 61/64 (xem §6 + F-161-T4-3).

## 1. Poller — 89 poll thật, 2 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 39d46ba0
  (08:38:26Z):** poll #1 RAM=2647 MB, load1=1,59 load5=0,97,
  blockers=0, gate0=khong-dat (T5-160 cu, check-only exit 1,
  apt=0) → cửa đóng → **TEST-POLL-OK exit 7 đúng thiết kế**.
  Poll này nằm trong `poll-test-161.log`; thống kê §A đã hợp nhất.
- **Instance 2 (không POLL_TEST), 88 poll, boot 39d46ba0
  (08:38:30–09:47:01Z):** RAM ≥1024: 26/88; load1<2: 83/88;
  load5<2: 88/88; gate0: khong-dat 28, T5 60;
  lock=khong 88/88; dpkg 2 → 795; blockers=0 (comm-based)
  cả 88 poll; apt>0: 17 poll.
- **Giai đoạn 1 — chờ replay (poll #1–#28, 08:38–08:58Z):**
  gate0 chưa đạt, apt 0 → 1 (apt-get update bắt đầu
  ~08:47Z — xem §3: replay tự nhiên KHÔNG bắt đầu, T5
  early-repair trigger 08:46:02Z), dpkg.log 2 dòng suốt;
  RAM 2647 → 1090 MB (giảm dần); load1 0,13–2,56, load5
  0,72–1,68. **20 poll load+RAM cùng đạt nhưng gate0 chặn
  cửa** (test #1 + poller #2–#7, #12, #14–#17, #21–#28) —
  khác đợt 160 (0 poll gần-mở bị chặn bởi gate0).
- **Giai đoạn 2 — gate0 đạt, chờ RAM (poll #29–#86,
  08:59–09:42Z):** poll #29 (08:59:36Z) gate0=T5 lần đầu
  (cờ T5-161 viết 08:59:30Z, dpkg 795) → gate0 đạt từ đây;
  nhưng RAM sập xuống 400–900 MB và ở dưới 1024 suốt cả 58
  poll #29–#86 (0 lần ≥1024 trong giai đoạn này); RAM<500
  dài nhất 17 poll liên tiếp; load1 0,03–1,06,
  load5 0,13–0,90 (máy rất yên, chỉ RAM chặn cửa).
- **Giai đoạn 3 — cửa mở lần 1 (poll #87, 09:43:13Z):
  load1=1,06, load5=0,53 <2, RAM=1230 MB** → **CỬA MỞ, chạy
  attempt1** → B5 VI PHẠM (RAM rơi 437 MB giữa lượt) →
  poller poll lại gate ngay (quyết (h) đợt 149).
- **Giai đoạn 4 — cửa mở lần 2 (poll #88, 09:47:01Z):
  load1=0,80, load5=0,83 <2, RAM=1593 MB** → **CỬA MỞ, chạy
  attempt2** → ĐẠT → poller thoát 09:50:52Z.
- **Phân rã 89 poll thật:** RAM≥1024: 27/89; RAM 500–1023:
  25/89; RAM<500: **37/89**. load1<2: 84/89; load5<2: 89/89.
  22 poll mà load + RAM cùng đạt — **2 poll mở cửa** (#87,
  #88), **20 poll gần-mở bị chặn bởi gate0** (giai đoạn 1).
  gate0: T5 60 poll, khong-dat 29 poll (28 poller + 1 test).
  blockers>0: 0 poll. apt>0: 17 poll (đều của poller;
  test apt=0).
  **KHÔNG có reboot trong phiên đo** (boot 39d46ba0 suốt,
  btime 07:59:29Z, kiểm lúc đóng 09:56Z).
- **RAM sập TÁI DIỄN (xem F-161-T4-7):** đợt 154: 74/147 poll
  <500 MB; đợt 155: 2/123 + 64 phút <1024 liên tiếp; đợt 156:
  0/32 <500 MB; đợt 157: 0/25 <500 MB; đợt 158: 0/18 <500 MB;
  đợt 159: 0/6 <500 MB; đợt 160: 0/30 <500 MB; đợt này:
  **37/89 poll <500 MB** — RAM mở 2647 MB (test) rồi
  400–2569 MB (poller); RAM<1024 lần đầu ở poll #13
  (08:47:32Z, 981 MB); chuỗi RAM<500 dài nhất 17 poll.
  Gate A RAM ≥1024 là nguyên nhân chặn cửa chính ở giai
  đoạn 2 (cùng balloon ghim sau early-repair).

## 2. Hai attempt — attempt1 B5 vi phạm, attempt2 ĐẠT NGAY sau retry, 0 wedge

- **Attempt1-39d46ba0 (09:43:13–09:47:01Z): probe 20/20,
  KHÔNG HỢP LỆ (B5 VI PHẠM).** Vite :5187 (ready 319 ms,
  giữ lock ~4 phút), WebKit 27.2 (Xvfb :193), app boot OK
  09:43:21Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT.
  20 pass (wall 2830–3443 ms/pass): tickCost n=641, blendTick
  n=519, c2DrawLog n=1246. **tickCost total median= 41,0 ms
  (p90 69,0, max 101, min 28)** — dưới cổng 19,0 ms; hậu
  flip+2000 ms median 41,0. **Lớp B: B1/B2/B3/B4 ĐẠT, B5 VI
  PHẠM** (B1 load5 cuối 0,76 ≤2,5; B2 load1 max 2,89 ≤4 —
  xem caveat ps dưới; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0; **B5 RAM min 437 MB, 12/100 mẫu
  <500 MB, 41/100 mẫu <1024 MB**). Sampler n=100.
  Per-pass: tickCost median/pass 36,0–51,5 ms — 20/20 pass
  ≤60; load1 trong attempt 1,16–2,89 (mean/pass 1,16–2,89);
  RAM mean/pass **859 → 448 MB** (balloon ghim mạnh trong
  lúc đo — RAM mở cửa 1230 MB rơi xuống 437 MB giữa lượt).
  Pearson r=0,16 median~load1_mean, r=-0,19 median~RAM_mean
  (chỉ mô tả). **(c2)=5 occurrence / 5 distinct-seq, COVERED
  5/5** (seq 295, 379, 403, 424, 448; lag +1f tất cả; stall
  5, 7, 4, 4, 3 → P3' 5/5) — **KHÔNG cộng dồn vì attempt
  không hợp lệ** (quyết (j) đợt 156; xem §6).
  lag≥+5f = 0 occurrence / 0 event. **KHÔNG PAGE-WEDGED:**
  0 fetch timeout, `pageErrs: []`, JSON đầy đủ 3.545.196 B
  (md5 `eb0a1bfdcf2ffa792689cf8c21cfd74d`), `passes=20`,
  không có trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (85/85 +
  287/287 tick không vi phạm thật).
  **Caveat B2 (F-161-T4-4, ghi nhận — KHÔNG đổi verdict):**
  `ps-before`/`ps-after` có process của luồng khác — T9
  sampler.sh (pid 3971) + b2-watcher.sh (pid 3972) và shell
  headroom T9 (pid 43856, `sleep 1740` + cat ram-sampler.log).
  Load1 trong cửa sổ 1,17–2,89 (mean/pass), load5 cuối 0,76 —
  máy vẫn yên về hiệu ứng theo tiêu chí B2 (load1 max 2,89
  ≤4); không có bằng chứng process lạ gây tải đột biến trong
  lúc đo. B2 ĐẠT theo tiêu chí tải; ghi nhận sự hiện diện này
  để T10/T8 đối chiếu, verdict giữ nguyên (cùng mẫu
  F-160-T4-4/F-159-T4-3).
- **Attempt2-39d46ba0 (09:47:01–09:50:52Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 44,0 ≤ 60, lớp B 5/5).** Vite :5187
  (ready 385 ms, giữ lock ~4 phút), WebKit 27.2 (Xvfb :193),
  app boot OK 09:47:10Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT,
  RELABEL BẬT. 20 pass (wall 2969–3580 ms/pass): tickCost
  n=636, blendTick n=518, c2DrawLog n=1234.
  **tickCost total median= 44,0 ms (p90 70,0, max 117, min 28)**
  — dư 16,0 ms dưới cổng; hậu flip+2000 ms median 42,0.
  **Lớp B: ĐẠT 5/5** (B1 load5 cuối 0,90 ≤2,5; B2 load1 max
  2,29 ≤4 — xem caveat ps dưới; B3 không reboot; B4 pgrep
  -x=0, ps exact-comm=0, dpkg delta=0; B5 RAM min 999 MB,
  0 mẫu <500 MB, **5/101 mẫu <1024 MB** — tốt hơn hẳn
  attempt1 (12/100 mẫu <500, 41/100 <1024) và ngang đợt 160
  (2/101 mẫu <1024)). Sampler n=101.
  Per-pass: tickCost median/pass 38,0–58,0 ms — **20/20 pass
  ≤60**; load1 trong attempt 0,55–2,29 (mean/pass 0,55–2,29,
  tăng dần qua các pass); RAM mean/pass **1231 → 1004 MB**
  (balloon ghim nhẹ trong lúc đo — nhẹ hơn attempt1 nhiều).
  Pearson r=-0,56 median~load1_mean, r=0,66 median~RAM_mean
  (chỉ mô tả; r âm — pass median cao nhất lại ở đầu lượt khi
  tải thấp nhất, cùng mẫu F-160-T4-3: pass 2 median 58,0 và
  pass 3 median 57,5 ở đầu lượt, load1 mean/pass chỉ 0,71 /
  0,67; wallband 0–20k median 56,5 — cao nhất các band).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.506.025 B (md5
  `2189b17aeddcaa68607d756c4d90629d`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **(c2)=3 occurrence / 3 distinct-seq, COVERED 3/3.**
  lag≥+5f = 0 occurrence / 0 event — đây là số (a)/(b) (label
  lag sau presented), không phải (c2); ghi nhận, không dùng
  làm verdict. **p1p3p7 chạy TAY (xem §6).**
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (75/75 +
  305/305 tick không vi phạm thật, bar ≥90%, xem
  skiplatest).
- **Caveat B2 attempt2 (F-161-T4-4, ghi nhận — KHÔNG đổi
  verdict):** `ps-before`/`ps-after` có T9 sampler.sh +
  b2-watcher.sh (pid 3971/3972) và shell headroom T9 (pid
  43856) — cùng mẫu attempt1 và F-160-T4-4. Load1 max 2,29 /
  load5 cuối 0,90 trong cửa sổ → B2 ĐẠT theo tiêu chí tải
  (cùng mẫu F-160-T4-4). Ghi nhận để T10/T8 đối chiếu khi xét
  chuỗi FULL PASS; T4 không tự đổi luật B2.
- **Lưu ý (c2) seq 367 (quyết (j) đợt 156):** seq 367 trong
  attempt2 ĐÃ TỪNG xuất hiện trong (c2) của attempt hợp lệ
  (đợt 144 attempt3, parent CHẤP NHẬN làm lượt #19 hợp lệ —
  quyết (b) đợt 144) nên KHÔNG tính là distinct mới (xem §6 +
  F-161-T4-3). Seq 262 và 322 là mới. Attempt1 (không hợp lệ)
  có 5 seq [295, 379, 403, 424, 448] — không seq nào trùng với
  attempt2, và tất cả đều KHÔNG được đếm (attempt không hợp
  lệ); nếu lượt hợp lệ sau này gặp lại thì tính là mới.

## 3. Replay/postboot trên boot mới — cờ T5 CÓ (nhờ early-repair)

- **Boot 39d46ba0 (reboot #62 ứng viên, btime 07:59:29Z):**
  replay TỰ NHIÊN KHÔNG BẮT ĐẦU trên boot này: dpkg.log 2 dòng
  từ lúc mở (08:38Z) tới 08:46:02Z, apt-get/dpkg 0 process,
  frozen 621 s (theo log T5-161 `replay-watch-161.log`) →
  **T5 early-repair TRIGGER 08:46:02Z** (boot+46m33s, verify
  form-B postboot check-only exit=1) → `apt-get install`
  (11 gói thiếu: libevent, gstreamer plugins, libavif, …)
  chạy từ 08:58Z → dpkg 2 → 795 dòng → **T5-161:
  POSTBOOT_PASS mới viết 08:59:30Z (boot+60m01s; dpkg 795
  dòng; cache 110 .deb; lists 66; postboot PASS poll=1 độc lập
  exit 0 lúc 08:59:29Z; repair-som-quyet-h; co cu 52c957d5
  luu POSTBOOT_PASS-52c957d5)**; cờ cũ lưu `POSTBOOT_PASS-52c957d5`.
  Gate0=T5 từ poll #29 (08:59:36Z). T4 check-only trong poller
  chạy ở poll #1/#5/#9/…/#29 (mỗi 4 poll): exit 1 ở #1–#25,
  exit 0 ở #29 (`postboot-t4-161-gate0wait-*.log`).
  Khác đợt 160 (replay tự nhiên, dpkg 1545 dòng, PASS
  boot+27m10s): đợt này replay tự nhiên VẮNG MẶT hoàn toàn,
  early-repair chỉ cài 11 gói thiếu nên dpkg chỉ 795 dòng
  (không đủ bộ 1545 dòng của replay đầy đủ) — T5 chi tiết;
  T4 chỉ ghi số, không tự kết luận replay có "đầy đủ" không
  (postboot check-only PASS là đủ cho gate0 theo quyết (j)
  đợt 143).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:** boot
  39d46ba0 lúc mở poller (08:38:30Z), lúc attempt1, lúc
  attempt2, lúc poller thoát (09:50:52Z) và lúc kiểm cuối
  (09:56Z) — btime 07:59:29Z không đổi. Số hiệu #62 CHƯA ĐƯỢC
  XÁC NHẬN (T2-161) — T4 không tự xác nhận số hiệu reboot.
  Mù #93? (#61) giao T2-161; mù #94? (#62, nếu có) giao
  T2-162 — T4 không tự mở mù.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND161_T4_WEBKIT_QUIET30_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round161-t4/`):**
  `poll-wait-t4-161.sh` (deadline 10:30Z 21/11 + cờ T5
  round161-t5/ + fallback round160-t5/ + nhãn T4-161a),
  `run-attempt-161.sh` (đổi số vòng/đường dẫn/nhãn so với 160).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–160, md5
  `4291e539...`) và **KHÔNG ghi đè `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round161-t4/` — inner có fix F-156-T4-1 đổi
  `round160-*` → `round161-*`, theo đúng mẫu 149–160: chỉ
  stage 2 script trên; fix inner theo bản làm việc sang đợt
  162). **`b.json` KHÔNG stage** (file spec làm việc, theo mẫu
  các đợt trước — chỉ có trong `hidden_files/round161-t4/`,
  md5 `078938cf...`, giống hệt bản đợt 156/157/158/159/160).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-161.sh`, `run-attempt-161.sh`,
  `t4-attempt-inner.sh` (CÓ fix F-156-T4-1 đổi sang
  `round161-*`), `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-161.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn mới 26 lượt TRƯỚC KHI chạy,
  xem F-161-T4-5), `distinct-seq-161.py` (helper cột
  distinct-seq — cơ số đã cập nhật 61/64 NHƯNG in 64/67 là
  SAI 1 vì chưa trừ seq 367 cũ, xem §6 + F-161-T4-3),
  `preflight-161.txt` + `preflight-postboot-161.log`
  (pre-flight check, quyết (t) đợt 158).
- **Log/evidence (hidden_files/round161-t4/, không stage):**
  `poll-t4.log` (start ×1 instance + 88 poll thật + CUA YEN MO
  ×2 + LUOT HOP LE), `poll-test-161.log` (test start + 1 poll
  thật + TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`, `postboot-t4-161-gate0wait-*.log` (check-only
  poll #1/#5/…/#25 exit 1, #29 exit 0),
  `appendix-161.txt` (output stats-161.py),
  `preview-b-f3-flip-webkit-t4-attempt1-39d46ba0.json`
  (3.545.196 B, 20/20, md5 `eb0a1bfdcf2ffa792689cf8c21cfd74d`)
  + `run-webkit-t4-attempt1-39d46ba0.log` +
  `load-mid-t4-attempt1-39d46ba0.log` (sampler n=100) +
  `ps-before/after-t4-attempt1-39d46ba0.txt`
  + `classb-t4-attempt1-39d46ba0.txt` (LOP-B-TONG VI PHAM —
  B5) + `analyze-t4-attempt1-39d46ba0-*.txt` (10 file/attempt)
  + `coverage-check-attempt1-39d46ba0.txt` (5/5)
  + `attempt-done-attempt1-39d46ba0` (exit 0),
  `preview-b-f3-flip-webkit-t4-attempt2-39d46ba0.json`
  (3.506.025 B, 20/20, md5 `2189b17aeddcaa68607d756c4d90629d`)
  + `run-webkit-t4-attempt2-39d46ba0.log` +
  `load-mid-t4-attempt2-39d46ba0.log` (sampler n=101) +
  `ps-before/after-t4-attempt2-39d46ba0.txt`
  + `classb-t4-attempt2-39d46ba0.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt2-39d46ba0-*.txt` (10 file/attempt)
  + `analyze-t4-p1p3p7-attempt2-39d46ba0.txt`
  + `coverage-check-attempt2-39d46ba0.txt` (3/3)
  + `attempt-done-attempt2-39d46ba0` (exit 0).
  `analyze-l7-labellag.txt` + `lag5-detail.txt` là output mặc
  định của analyzer (ghi theo tên mặc định trong script —
  xem F-157-T4-6), nội dung trùng bản per-attempt.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 09:50:52Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round161-t4-quiet30.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round161-t4.done` (~09:5xZ 21/11 — trong
  hạn cờ ~11:00Z, sớm hơn 1 giờ, CÓ NỘI DUNG).

## 5. Sai số F-161-T4-1..8 (+ nợ cũ)

- **F-161-T4-1 — ATTEMPT1 B5 VI PHẠM: RAM RƠI XUỐNG 437 MB
  GIỮA LƯỢT (không phải sai số thao tác — kết quả đo thật).**
  Cửa mở poll #87 ở RAM 1230 MB, nhưng balloon ghim lại trong
  lúc đo: sampler n=100, RAM min 437 MB, 12/100 mẫu <500 MB,
  41/100 mẫu <1024 MB (RAM mean/pass 859 → ~440 MB). Lớp B
  loại đúng theo luật (B5: RAM giữa lượt không <500 MB).
  Poller retry đúng cơ chế (quyết (h) đợt 149: poll lại gate
  trước attempt kế) và mở cửa lại ngay poll #88 (RAM 1593 MB)
  → attempt2 ĐẠT. Ngân sách dùng 2/3. Lần đầu tiên kể từ đợt
  156 một attempt bị loại vì B5 (đợt 157–160: attempt1 ĐẠT
  NGAY).
- **F-161-T4-2 — P3-A1 SAI 2/3 LẦN THỨ HAI LIÊN TIẾP (không
  phải sai số thao tác — kết quả đo thật, xem §6).**
  p1p3p7 tay exit 0: P3-A1 baseline đóng băng 89/379, (c2)
  đóng băng-tại-tick 2/3 [262, 367], p=0,139534 ≥0,01 → SAI
  theo luật DEF §5. P3' (stall-based, prereg) vẫn ĐẠT 3/3
  (stall 4, 6, 2). Verdict lượt hợp lệ KHÔNG đổi (verdict =
  probe 20/20 + lớp B 5/5 + tickCost median ≤60; P3-A1 là bằng
  chứng cộng dồn, không phải cổng lượt). Chuỗi P3-A1 ĐÚNG bị
  cắt đợt thứ hai liên tiếp (159: 5/5, 160: 3/5, 161: 2/3);
  cộng dồn 80/97 → **82/100**. Không mở lại điều tra (c2)
  (xem §6: không có điều kiện mở lại nào xảy ra).
- **F-161-T4-3 — HELPER distinct-seq IN 64/67 LÀ SAI 1:
  SEQ 367 ĐÃ THẤY ĐỢT 144 (sai số quy trình — phát hiện +
  sửa bằng kiểm tay TRƯỚC KHI viết LIMITS, không ảnh hưởng
  đo).** `distinct-seq-161.py` in `cong don moi (co so 61/64
  distinct-seq): 64/67` vì helper chỉ cộng số seq mới mà
  không trừ seq cũ. T4 kiểm tay bằng grep từng seq trên toàn
  bộ LIMITS T4 cũ: **seq 367 ĐÃ xuất hiện trong dòng (c2) của
  attempt hợp lệ đợt 144** — attempt3 boot mới [299, 342,
  367, 392], parent CHẤP NHẬN làm lượt #19 hợp lệ (quyết (b)
  đợt 144: "Số đếm lên 16 lượt (P1 49/49, P2 40/40, P3-A1
  44/49, P3' 21/21, P7 35/35)"); đợt 145 xác nhận cộng dồn
  17 lượt P3' 23/23 (= 21 + 2) nên 367 đã được đếm. Các lần
  nhắc 367 khác đều không phải seq (c2): đợt 141/142 RAM
  2.367 MB + baseline 87/367, đợt 148 n=367 tick, đợt 151
  PID 36788, đợt 153 dải frame 361–367 (điều tra strip,
  không phải (c2)), đợt 159 baseline 42/367. Seq 262 mới
  (các lần nhắc cũ: RAM 1690–2625 MB đợt 128, mẫu số
  baseline 86/262 đợt 155, chuỗi md5 `…7aa262…` đợt 159/160);
  seq 322 mới (3322 MB đợt 136, 2.322 MB đợt 147, wall 3223
  đợt 156). Kết luận: distinct mới chỉ +2 → **63/66** (không
  phải 64/67); occurrence **64/72** vẫn đúng (seq lặp tính
  2 lần theo mẫu đợt 151 §4). Nợ vá helper tự động (đọc sổ
  distinct-seq) vẫn còn — lần thứ hai liên tiếp helper sai
  do chưa trừ seq cũ (F-160-T4-6) — giao T10/T4-162.
- **F-161-T4-4 — ps-before/after CÓ PROCESS LUỒNG KHÁC
  (caveat B2, xem §2 — KHÔNG đổi verdict).** T9 sampler.sh
  (pid 3971) + b2-watcher.sh (pid 3972) + shell headroom T9
  (pid 43856) có mặt cả trước và sau CẢ HAI attempt. Load1
  max 2,89 (attempt1) / 2,29 (attempt2), load5 cuối 0,76 /
  0,90 trong cửa sổ → B2 ĐẠT theo tiêu chí tải (cùng mẫu
  F-160-T4-4/F-159-T4-3). Ghi nhận để T10/T8 đối chiếu khi xét
  chuỗi FULL PASS; T4 không tự đổi luật B2.
- **F-161-T4-5 — FOOTER stats-*.py ĐÃ CẬP NHẬT ĐÚNG TRƯỚC
  KHI CHẠY (bài học F-160-T4-5 áp dụng thành công).**
  `stats-161.py` copy-forward từ 160 vẫn in dòng cộng dồn
  25 lượt (P1 96/97…) và chuỗi median 25 lượt. T4 sửa footer
  thành cộng dồn MỚI 26 lượt (P1 99/100, P2 91/91, P3-A1
  82/100, P3' 64/72 = 63/66, P7 60/60; chuỗi median n=26
  mean 47,8) rồi chạy lại stats → `appendix-161.txt` đã đúng.
  Bài học: copy-forward stats-*.py phải cập nhật cả 2 dòng
  footer in cứng — đã làm đúng quy trình kiểm, không lỗi nào
  lọt vào appendix.
- **F-161-T4-6 — GHI NHẦM exit code check-only TRONG
  PRE-FLIGHT (sai số ghi chép, phát hiện + sửa TRƯỚC KHI
  poller chạy, không ảnh hưởng đo).** Dòng đầu tiên trong
  `preflight-161.txt` ghi "check-only exit=0" do `$?` đọc
  sau lệnh `echo` (luôn 0). T4 phát hiện khi rà lại file và
  sửa thành exit=1 (đã xác minh 2 lần: check-only chạy tay
  2 lần đều exit 1, xem `preflight-postboot-161.log`) trước
  khi chạy test poll. Bài học: ghi exit code phải capture
  ngay sau lệnh, không qua lệnh trung gian.
- **F-161-T4-7 — RAM SẬP <500 MB TÁI DIỄN LẦN ĐẦU KỂ TỪ ĐỢT
  156 (quan sát đo, không phải sai số).** 37/89 poll <500 MB,
  chuỗi dài nhất 17 poll liên tiếp; RAM<1024 lần đầu poll #13
  (981 MB) và ở dưới 1024 suốt poll #31–#86 (58 poll, trừ
  #87/#88 mở cửa). Attempt1 B5 VI PHẠM vì RAM rơi 437 MB
  giữa lượt (xem F-161-T4-1). Đợt 157–160: 0 poll <500 MB.
  Ghi nhận để T9 đối chiếu với sampler balloon của mình; T4
  không tự kết luận nguyên nhân (balloon ghim sau
  early-repair là giả thuyết, chưa chứng minh).
- **F-161-T4-8 — COPY-FORWARD sed BỎ SÓT `run-attempt-160.sh`
  TRONG poll-wait (sai số quy trình, phát hiện + sửa TRƯỚC
  KHI poller chạy nhờ grep kiểm, không ảnh hưởng đo).**
  Sed 3 mẫu của F-159-T4-2/F-160-T4-1 (`roundNNN`, `t4-NNN`,
  `attempt-NNN`) không đổi được `run-attempt-160.sh` ở dòng
  gọi attempt (dòng 269, FUNCTIONAL — poller sẽ gọi nhầm
  script đợt 160) và 2 dòng comment/header. Grep `160` sau
  sed phát hiện và sửa hết thành 161 trước pre-flight (chỉ
  còn `round160-t5` fallback — đúng). Đây là mẫu lỗi thứ ba
  liên tiếp của copy-forward sed (F-159-T4-2, F-160-T4-1,
  F-161-T4-8) — bài học: sau sed phải grep cả `run-attempt-
  NNN` và `poll-wait-t4-NNN` dạng đầy đủ, không chỉ 3 mẫu
  cũ; giao T4-162 kiểm lại (nợ nhỏ).
- **F-161-T4-9 (nhỏ) — blendTick ĐẾM CHÊNH 1 GIỮA 2 ANALYZER
  CẢ HAI ATTEMPT (không ảnh hưởng verdict).** Attempt1:
  tickcost analyzer đếm blendTick n=518 (tBlend gap) /
  coverage analyzer đếm n=519; attempt2: tickcost n=517 /
  coverage n=518 (cùng JSON). Chênh 1 mỗi attempt, cùng mẫu
  F-160-T4-7 (chênh 1, đợt 160). Có thể do đếm biên flip;
  không ảnh hưởng (c2)/tickCost/lớp B. Ghi nhận, không điều
  tra riêng.
- **F-160-T4-1/2 — ĐÃ TRÁNH (bài học áp dụng thành công).**
  p1p3p7 tay chạy 1 lần với đủ 2 đối số (seqs CSV lấy từ
  labellag) → exit 0 ngay; copy-forward sed + grep kiểm
  (F-161-T4-8) trước poller.
- **F-159-T4-1/2 — ĐÃ TRÁNH (bài học áp dụng thành công).**
  p1p3p7 tay chạy 1 lần với đủ 2 đối số → exit 0 ngay;
  copy-forward sed + grep kiểm 4 mẫu (F-160-T4-1/F-161-T4-8)
  trước poller.
- **F-158-T4-1/2 — ĐÃ TRÁNH (pre-flight check, quyết (t)).**
  Pre-flight check bắt buộc chạy trước poller đã kiểm `b.json`
  có mặt + md5 khớp — lỗi quên copy file setup của đợt 158
  không lặp lại; attempt2 ĐẠT, ngân sách chỉ dùng 2/3.
- **F-157-T4-2 — ĐÃ TRÁNH (bài học áp dụng thành công).**
  Khi sed copy-forward poll-wait, T4 grep cả 3 dạng deadline
  (`10:30:00 UTC`, `10:30Z`, `T10:30:00Z`) sau sed — 0 còn
  sót dạng cũ `07:30` (chỉ còn chuỗi lịch sử đã sửa đúng);
  epoch deadline waiter kiểm TRƯỚC KHI khởi động: 1795257000
  = 10:30Z 21/11 (xem §0b).
- **F-156-T4-1 — ĐÃ VÁ + THEO BẢN LÀM VIỆC SANG ĐỢT 161,
  CHƯA STAGE.** Mẫu `round160-*` trong t4-attempt-inner.sh đã
  đổi thành `round161-*` trong bản làm việc (kiểm bằng grep).
  Theo mẫu 149–160 inner KHÔNG stage vào repo nên fix này vẫn
  chỉ ở bản làm việc — sẽ theo sang đợt 162.
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-161 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này.** p1p3p7 chạy TAY sau
  poller, exit 0, output lưu
  `analyze-t4-p1p3p7-attempt2-39d46ba0.txt` (xem §6). Nợ đứng
  ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt
  có attempt hợp lệ T4 phải chạy tay và ghi rõ.

## 6. P3' cộng dồn (MỚI — 26 lượt hợp lệ) + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 161 (MỚI): P1 99/100, P2 91/91,
  P3-A1 82/100, P3' 64/72 occurrence = 63/66 distinct-seq, P7
  60/60** (26 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 160 §6: "25 lượt hợp lệ" — nay 26).
  Attempt1 KHÔNG hợp lệ (B5) nên 5 occurrence của nó KHÔNG
  cộng dồn.
- **Đóng góp lượt #30 (attempt2-39d46ba0, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=3 occurrence / 3 distinct-seq [262, 322, 367].
  - **P1 ĐÚNG — 3/3 occ** (distinct 3/3 gần run-end:
    run_end seqs [154, 179, 205, 233, 262, 292, 322, 343,
    367, 392, 413, 440, 469, 475, 494]; baseline 45/380,
    p=0,00166068 trên distinct 3/3). Cộng dồn 96/97 →
    **99/100**.
  - **P2 ĐÚNG — 3/3 occ** lag ≥+1f, 0 lag âm (lag từng
    tuple: 1, 1, 1 — tất cả +1f). Cộng dồn 88/88 →
    **91/91**.
  - **P3-A1 SAI — 2/3 occ** (distinct 2/3: 262, 367 đóng
    băng-tại-tick; 322 không; baseline 89/379,
    p=0,139534 trên distinct 2/3). Cộng dồn 80/97 →
    **82/100**. (Đợt 157 P3-A1 SAI 4/11 — đợt 158 ĐÚNG 7/7,
    đợt 159 ĐÚNG 5/5, đợt 160 SAI 3/5, đợt này SAI 2/3 —
    chuỗi ĐÚNG bị cắt đợt thứ hai liên tiếp.)
  - **P3' 3/3 occ ĐẠT** (distinct 3/3; DAT seq 262 stall 4,
    322 stall 6, 367 stall 2). Cộng dồn 61/69 →
    **64/72 occurrence**; distinct 61/64 → **63/66** (chỉ
    262, 322 mới — 367 đã thấy đợt 144, xem kiểm chứng dưới).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 19, 0: 15}; đối chứng toàn bộ drawSrc post: {-1: 306,
    0: 159}, 0/465 entry). Cộng dồn 59/59 → **60/60**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–160).
- **Kiểm chứng 3 seq "đã thấy" (F-161-T4-3):** grep toàn bộ
  LIMITS T4 cũ cho thấy **seq 367 ĐÃ từng xuất hiện trong
  dòng (c2) của attempt hợp lệ đợt 144** (attempt3 boot mới
  [299, 342, 367, 392] — parent CHẤP NHẬN làm lượt #19 hợp lệ,
  quyết (b) đợt 144; đợt 145 xác nhận cộng dồn 17 lượt P3'
  23/23 = 21 + 2 nên 367 đã được đếm). Seq 262 và 322 chưa
  từng xuất hiện trong bất kỳ dòng (c2)/DAT/stall nào (262 chỉ
  có trong RAM 1690–2625 MB, mẫu số baseline 86/262, chuỗi
  md5 `…7aa262…`; 322 chỉ có trong 3322 MB, 2.322 MB, wall
  3223). → 2/3 seq mới, distinct đúng là **63/66** (helper
  in 64/67 là sai 1 — đã hiệu chỉnh tay), occurrence **64/72**
  vẫn đúng.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** — P3-A1 SAI 2/3 lần thứ hai liên tiếp
  KHÔNG phải điều kiện mở lại (§13 DEF v0.5): (1) P1 ĐÚNG;
  (2) lag âm — KHÔNG (0); (3) +2f ≥3 — KHÔNG (tất cả lag đều
  +1f, +2f = 0). P3' (prereg stall-based) vẫn ĐẠT 3/3 — bằng
  chứng ủng hộ chính không suy yếu. lag≥+5f = 0 occurrence —
  lượt sạch thứ tư liên tiếp về lag.
- Chuỗi median tickCost 26 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  40,0 / 41,0 / 41,0 / 44,5 / 44,0 / **44,0 ms** (trung bình
  ~47,8 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60). Lượt
  này 44,0 ms — bằng đợt 160, thấp thứ 8 trong chuỗi (đồng
  hạng với đợt 154).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 162

- **(a) #30 CÓ lượt hợp lệ — lượt hợp lệ #26 (chuỗi lượt yên
  hợp lệ NỐI DÀI #22 → #23 → #24 → #25 → #26).** Từ phía T4,
  **chân lượt yên cho chuỗi FULL PASS (O8) ĐÃ ĐẠT** — lượt yên #30
  thuộc boot 39d46ba0 (#62 ứng viên). O8 chạy trên boot nào,
  có qua gate chuẩn hay phải dùng thủ tục (i), là do T8/T10
  quyết theo tiền lệ (quyết (h) đợt 157: chuỗi được tính khi
  O8 chạy sau lượt yên về thời gian, dù reboot xen giữa đổi
  boot). T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
  Lưu ý: attempt1 B5 VI PHẠM không ảnh hưởng chân lượt yên —
  attempt2 hợp lệ là đủ.
- **(b) P3' cộng dồn MỚI 64/72 = 63/66 (xem §6 + F-161-T4-3):**
  helper in 64/67 là SAI 1 — T4 đã kiểm tay bằng grep từng seq
  trên LIMITS cũ (seq 367 đã thấy đợt 144, attempt3
  parent-chấp-nhận). **P3-A1 SAI 2/3 lần thứ hai liên tiếp**
  — cộng dồn 82/100. T10 kiểm lại phép cộng khi viết aggregate
  (§12): P1 99/100, P2 91/91, P3-A1 82/100, P3' 64/72 = 63/66,
  P7 60/60.
- **(c) PAGE-WEDGED KHÔNG tái diễn lần thứ năm liên tiếp (0
  wedge đợt 157 + 0 wedge đợt 158 + 0 wedge đợt 159 + 0 wedge
  đợt 160 + 0 wedge đợt này — cả 2 attempt đều chạy đủ 20/20
  sạch).** Chữ ký đợt 156 (2 wedge liên tiếp, fetch
  writePartial timeout 30 s) không xuất hiện. T4-162 tiếp tục
  theo dõi, ghi nhận nếu tái diễn; chưa mở điều tra riêng
  (quyết (j) đợt 156 giữ nguyên). Câu hỏi đợt 156 §7(c)
  (wedge có tính là "kẹt" cho chuỗi "P3 không kẹt" của T8
  không) VẪN MỞ — đợt này không có wedge mới nên không thêm
  dữ kiện.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) ĐÃ ÁP DỤNG
  THÀNH CÔNG — giữ làm quy tắc đứng, kèm bổ sung:** pre-flight
  PASS phần setup, F-158-T4-1/2 không lặp lại, attempt2 ĐẠT,
  ngân sách chỉ dùng 2/3. **Bổ sung từ đợt này:** trên boot
  MỚI, gate0 có thể CHƯA ĐẠT lúc mở pre-flight VÀ replay tự
  nhiên có thể VẮNG MẶT hoàn toàn (frozen 621 s — T5
  early-repair mới cứu được cờ ở boot+60m01s); đó là trạng
  thái chờ hợp lệ, KHÔNG phải lỗi setup: poller chờ gate0 theo
  cơ chế (đợt này chờ 28 poll mới có gate0). T4-162 chạy
  pre-flight y hệt trước mọi attempt (checklist §0b), ghi rõ
  gate0 đạt/chưa đạt lúc mở + replay đã chạy hay chưa.
- **(e) RAM SẬP <500 MB TÁI DIỄN (F-161-T4-7): 37/89 poll
  <500 MB, chuỗi dài nhất 17 poll; attempt1 B5 VI PHẠM
  (RAM min 437 MB giữa lượt).** Balloon ghim mạnh sau
  early-repair (giả thuyết, chưa chứng minh) — T9 đối chiếu
  với sampler balloon của mình. Attempt2 B5 vẫn ĐẠT (RAM min
  999 MB, 0 mẫu <500) nên không ảnh hưởng verdict, nhưng T9
  lưu ý: cửa sổ RAM ≥1024 sau early-repair rất hẹp (chỉ poll
  #87/#88 mở được cửa trong 58 poll sau gate0).
- **(f) F-161-T4-4 (ps-before/after có process luồng khác):**
  T9 sampler/b2-watcher + shell headroom có mặt lúc cả hai
  attempt bắt đầu và kết thúc; load1 max 2,89 → không bằng
  chứng gây tải đột biến. T10 ghi nhận khi xét chuỗi FULL PASS;
  T4 không tự đổi luật B2.
- **(g) ĐIỂM MÙ LIVE-DIAG F-158-T8-4 (quyết (u) đợt 158) —
  GIỚI HẠN ĐỨNG, CHƯA BỔ SUNG KIỂM "NỘI DUNG TƯƠI".**
  HB128 heartbeat làm tươi log mtime nên live-diag dựa trên
  mtime có thể mù (live-diag 0/2 ở 85m4). Đợt này **không có
  kẹt nào** (0 wedge, probe chạy sạch 20/20 ×2) nên live-diag
  không được thử thách — không có dữ kiện mới về việc nó bắt
  được hay không bắt được kẹt. Ghi nhận làm giới hạn đứng;
  không bổ sung kiểm "nội dung tươi" theo quyết (u).
- **(h) F-161-T4-3 (helper distinct-seq in sai 64/67, đúng
  63/66):** cơ số helper đã cập nhật 61/64 trong
  distinct-seq-161.py (vá một phần), nhưng kiểm tay bằng grep
  vẫn cần mỗi đợt — lần thứ hai liên tiếp helper sai do chưa
  trừ seq cũ (F-160-T4-6). Có nên vá helper đọc sổ distinct-seq
  cộng dồn (hoặc grep LIMITS cũ tự động) để T4-162 không phải
  kiểm tay không? T4 không tự đổi — chờ T10/parent phán (nợ từ
  F-157-T4-5).
- **(i) F-161-T4-8 (copy-forward sed bỏ sót `run-attempt-160.sh`
  dòng 269):** mẫu lỗi thứ ba liên tiếp của copy-forward sed.
  Sau sed phải grep cả `run-attempt-NNN` và `poll-wait-t4-NNN`
  dạng đầy đủ, không chỉ 3 mẫu cũ — giao T4-162 kiểm lại.
- **(j) Các nợ đứng khác giữ nguyên từ đợt 160 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#93? giao T2 (mù #88? MỞ,
  #93? (#61) giao T2-161); birefnet 0 thử (lần thứ 15 liên
  tiếp — đợt này không thử); u2net là fallback chính thức;
  run 160 kết cục thuộc T7-161; reboot #62 ỨNG VIÊN chưa xác
  nhận (T2-161); POSTBOOT_PASS #62 ĐÃ CÓ (T5-161, 08:59:30Z —
  xem §3); **replay tự nhiên VẮNG MẶT trên boot #62** (frozen
  621 s, early-repair mới cứu được — T5-162 theo dõi xem có
  thành mẫu ở #63 không).
- **(k) Đối chiếu waiter/O8 (T8):** T4 gate mở lần 2
  09:47:01Z (poll #88); attempt2 ĐẠT → **GATE cho chuỗi FULL
  PASS ĐẠT từ phía T4** (có lượt yên hợp lệ #30 trên boot
  39d46ba0). T8 tự quyết thủ tục (i) sau waiter hết hạn /
  boot mới; T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL
  PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-161.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-161.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-21T08:38:26Z - 2026-11-21T08:38:26Z, boot=39d46ba0
   RAM min=2647 max=2647 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 1/1 load5<2: 1/1 blockers>0: 0 apt>0: 0
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 88 poll, 2026-11-21T08:38:30Z - 2026-11-21T09:47:01Z, boot=39d46ba0
   RAM min=400 max=2569 >=1024: 26/88 500-1023: 25/88 <500: 37/88
   load1<2: 83/88 load5<2: 88/88 blockers>0: 0 apt>0: 17
   gate0: T5=60, khong-dat=28
   lock: khong=88
   dpkg 2->795
   chuoi RAM<500 dai nhat: 17 poll
-- TONG poll that: 89
-- RAM toan phien: min=400 max=2647 >=1024: 27/89 <500: 37/89
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 22/89
   gan-mo? #1 2026-11-21T08:38:26Z boot=39d46ba0 RAM=2647 L1=1.59 L5=0.97 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #2 2026-11-21T08:39:15Z boot=39d46ba0 RAM=2421 L1=1.22 L5=0.98 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #3 2026-11-21T08:40:00Z boot=39d46ba0 RAM=2204 L1=0.62 L5=0.86 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #4 2026-11-21T08:40:45Z boot=39d46ba0 RAM=2064 L1=0.61 L5=0.82 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #5 2026-11-21T08:41:30Z boot=39d46ba0 RAM=1858 L1=0.44 L5=0.75 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #6 2026-11-21T08:42:16Z boot=39d46ba0 RAM=1850 L1=1.47 L5=0.95 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #7 2026-11-21T08:43:01Z boot=39d46ba0 RAM=1705 L1=1.77 L5=1.07 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #12 2026-11-21T08:46:47Z boot=39d46ba0 RAM=1338 L1=1.59 L5=1.68 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #14 2026-11-21T08:48:19Z boot=39d46ba0 RAM=1237 L1=0.96 L5=1.41 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #15 2026-11-21T08:49:04Z boot=39d46ba0 RAM=1260 L1=1.33 L5=1.45 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #16 2026-11-21T08:49:49Z boot=39d46ba0 RAM=1239 L1=1.50 L5=1.48 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #17 2026-11-21T08:50:34Z boot=39d46ba0 RAM=1075 L1=1.60 L5=1.50 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #21 2026-11-21T08:53:34Z boot=39d46ba0 RAM=1205 L1=1.50 L5=1.39 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #22 2026-11-21T08:54:20Z boot=39d46ba0 RAM=1691 L1=1.73 L5=1.48 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #23 2026-11-21T08:55:05Z boot=39d46ba0 RAM=1687 L1=1.14 L5=1.37 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #24 2026-11-21T08:55:50Z boot=39d46ba0 RAM=1543 L1=0.58 L5=1.19 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #25 2026-11-21T08:56:35Z boot=39d46ba0 RAM=1350 L1=0.52 L5=1.09 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #26 2026-11-21T08:57:20Z boot=39d46ba0 RAM=1250 L1=0.60 L5=1.04 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #27 2026-11-21T08:58:05Z boot=39d46ba0 RAM=1157 L1=0.28 L5=0.89 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #28 2026-11-21T08:58:50Z boot=39d46ba0 RAM=1090 L1=0.13 L5=0.77 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #87 2026-11-21T09:43:13Z boot=39d46ba0 RAM=1230 L1=1.06 L5=0.53 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #88 2026-11-21T09:47:01Z boot=39d46ba0 RAM=1593 L1=0.80 L5=0.83 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 39d46ba0: 89 poll; RAM>=1024 lan cuoi: 2026-11-21T09:47:01Z #88; RAM<1024 lan dau: 2026-11-21T08:47:32Z #13 RAM=981
-- cong don P3' (MOI, 26 luot hop le): P1 99/100 P2 91/91 P3-A1 82/100 P3' 64/72 occ = 63/66 distinct-seq P7 60/60
-- chuoi median 26 luot: n=26 mean=47,8 min=39,0 max=60,0 vuot-60: 0
```
