# PHASE9_ROUND170_T4_WEBKIT_QUIET39_LIMITS.md

**Đợt:** 170. **Luồng:** T4 — đo lượt yên WebKit #39 trên 1 boot
+ **#39 CÓ LƯỢT HỢP LỆ NGAY ATTEMPT ĐẦU — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 34**
  (attempt1-5df1871f HỢP LỆ ngay lần thử đầu trên boot mới
  5df1871f; ngân sách dùng 1/3; poller thoát 11:59:18Z vì ĐẠT,
  trước hạn cắt poller 13:30Z 1h30m42s, trước hạn cờ ~14:00Z
  ~2h00m42s; không reboot giữa phiên; poller 22 poll thật,
  1 lần cửa mở).
+ **P1 ĐÚNG 8/8 (p=1,44824e-08) + P3-A1 ĐÚNG 7/8 (p=8,448e-05)**
  — P3-A1 ĐÚNG TRỞ LẠI sau 2 đợt SAI liên tiếp (168: p=0,0149;
  169: p=0,02135); **8 SEQ MỚI 195, 222, 276, 306, 333, 420,
  476, 502** vào sổ distinct-seq (cả 8 đều mới — lượt nhiều
  seq mới nhất kể từ đợt 151).
+ **BOOT MỚI 5df1871f (btime 11:11:05Z) — ỨNG VIÊN #79**
  (số hiệu giao T0-170 xác minh); replay CHẠY TRONG PHIÊN T4
  (dpkg 2→1545 trong lúc poll, 11:44:52–11:48:40Z — khác mẫu
  #77 replay xong trước khi mở); POSTBOOT_PASS #79 viết
  11:49:14Z (replay-đầy-đủ, poll=0).
**Ngày:** 22/11/2026 (lượt cron 18:35 +07 22/11 = 11:35:51Z).
**Boot đo:** MỘT boot — 5df1871f (btime 11:11:05Z, boot lúc mở
mới hơn giờ mở 24m46s; số hiệu reboot giao T0-170 xác minh —
ứng viên #79).
**Trạng thái:
#39 CÓ LƯỢT HỢP LỆ (attempt1-5df1871f: 20/20, lớp B 5/5,
tickCost median 40,0 ≤ 60 — LUOT HOP LE, poller thoát
11:59:18Z vì ĐẠT, trước hạn cắt poller 13:30Z 1h30m42s, trước
hạn cờ ~14:00Z ~2h00m42s). Ngân sách dùng 1/3. Cộng dồn LÊN 34
lượt hợp lệ: P1 132/135, P2 126/126, P3-A1 114/135, P3'
99/107 occurrence = 91/94 distinct-seq, P7 68/68. Sổ
distinct-seq THĂNG CẤP as-of-170 (91/94 distinct, occ 99/107,
8 seq mới 195 + 222 + 276 + 306 + 333 + 420 + 476 + 502,
non_dat_in_union [283, 364, 498] KHÔNG đổi). RAM <500 MB: 0/22
poll — SẠCH (lần thứ ba liên tiếp). POSTBOOT_PASS cho boot mới
5df1871f ĐÃ CÓ (11:49:14Z, T5-170 sở hữu, replay-đầy-đủ);
watcher-170 của T5 ĐANG CHẠY lúc đóng (pid 20516,
`replay-watch-170.sh`).**

## 0. Verdict tổng

- **#39 CÓ LƯỢT HỢP LỆ (attempt1-5df1871f).**
  Poller thoát 11:59:18Z vì LUOT HOP LE — KHÔNG phải hết
  hạn (hạn cắt 13:30Z còn 1h30m42s, hạn cờ ~14:00Z còn
  ~2h00m42s).
- **Attempt1-5df1871f (11:55:26–11:59:18Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 40,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2861–3391 ms/pass): tickCost n=672, blendTick n=548
  (tBlend gap n=547), c2DrawLog n=1305.
  **tickCost total median= 40,0 ms (p90 64,0, max 100, min 27)**
  — DƯỚI NGƯỠNG 20,0 ms; hậu flip+2000 ms median 40,0.
  Per-pass median 36,0–53,0 ms (pass 10: 53,0 cao nhất;
  pass 3: 36,0 thấp nhất) trong khi load1 mean/pass
  0,92→2,28 và RAM mean/pass GIẢM 1786→1436 MB (tương quan
  Pearson median~load1 r=-0,05, median~RAM r=0,18 — không
  đáng kể, không kết luận nhân quả từ 1 lượt; xem
  F-170-T4-4).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,51 ≤2,5; B2 load1
  max 2,28 ≤4 — sampler n=100 dòng gồm 1 header + 99 mẫu,
  xem F-168-T4-7; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0 (1545→1545); B5 RAM min 1424 MB,
  0 mẫu <500 MB, 0/100 mẫu <1024 MB — sạch hoàn toàn).
  **(c2)=8** (seq 195, 222, 276, 306, 333, 420, 476, 502 — cả 8
  COVERED, delta −24/−25/+30/+31/−20/+27/−22 ms; blendTick
  hậu-flip 401/401 trong ±500 ms của log)
  — ĐÃ CỘNG DỒN.
  P3' 8/8 DAT (stall 5/4/7/6/3/5/5/3). lag≥+5f (b) = 0 occurrence — sạch.
  p1p3p7 chạy TAY (F-148-T4-1): **P1 ĐÚNG 8/8** (cả 8 seq gần
  run-end [195, 222, 276, 306, 333, 420, 476, 502 trong 14
  run_end seqs], baseline 42/401, p=1,44824e-08 <0,01, n=8);
  **P2 ĐÚNG 8/8** (lag +1f ×7, +3f ×1 (seq 222); 0 lag âm);
  **P3-A1 ĐÚNG 7/8** (7/8 đóng băng-tại-tick, seq 222 không
  đóng băng-tại-tick; baseline 80/400, p=8,448e-05 <0,01 —
  ĐÚNG trở lại sau 2 đợt SAI, xem F-170-T4-3);
  **P7 ĐÚNG** (0/99 entry trễ ≥+1f; đối chứng 0/487).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.689.758 B (md5
  `e1cbc5eb542da126800b35d00f60847a`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=66 tick
  skippedLatest=1 hậu flip+2000ms, bar ≥30; (1) 100%,
  (2) 100%).
  **Attempt này ĐƯỢC CỘNG DỒN** (lượt hợp lệ — theo quy ước
  đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Không có attempt2/attempt3:** ngân sách dùng 1/3, không
  retry nào cần (lượt hợp lệ ngay attempt đầu — lần đầu kể
  từ đợt 157).
- **Poller — 1 instance thật + 1 test, 22 poll, 1 lần cửa mở,
  trên 1 boot (không reboot).** Gate0: khong-dat 9 poll,
  T4-check-only 4 poll, T5 9 poll (cờ T5-170 xuất hiện
  11:49:14Z, trong lúc poll). RAM ≥1024: 22/22; RAM <500:
  **0/22**. load1<2: 6/22; load5<2: 1/22 — chỉ poll #21
  load+RAM cùng đạt, chính là poll mở cửa thật;
  blockers>0: 1 poll (#2 — vite build của luồng khác, xem
  F-170-T4-2); apt>0: 12 poll (replay). dpkg 2→1545.
- **Chuỗi lượt yên hợp lệ: LÊN 34 (33 → 34).** Cộng dồn MỚI:
  P1 132/135, P2 126/126, P3-A1 114/135, **P3' 99/107
  occurrence = 91/94 distinct-seq**, P7 68/68. Chuỗi median
  tickCost 34 lượt: 39,0–60,0 ms, mean 48,4 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #38 (quyết (m) đợt 167):**
  ngưỡng gate A RAM ≥1024 MB, load1<2, load5<2, tickCost
  median ≤60 ms, lớp B 5/5, ngân sách 3 attempt/đợt, poll
  45 s — KHÔNG đổi ngưỡng/cadence nào. **Quyết parent (m)
  đợt 167 đã chốt: median đúng 60,0 mà lớp B sạch thì TÍNH
  ĐẠT (luật ≤60 giữ nguyên)** — poller đã cài `m<=60`;
  đợt này median 40,0 nên không cần áp dụng luật biên.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NẶNG TRONG CỬA SỔ
  ATTEMPT: TUÂN THỦ.** Trong cửa sổ attempt1
  (11:55:26–11:59:18Z), T4 không chạy script nào (poller đang
  chạy; agent chỉ chờ background delivery); mọi phân tích
  nặng (stats-170.py, helper distinct-seq-170 back-test +
  live, p1p3p7 chạy tay, đọc analyzer) đều làm SAU khi
  attempt kết thúc (từ ~11:59:25Z). Pre-flight postboot
  check-only (11:39:51Z) + test poll (11:40:00Z) chạy TRƯỚC
  khi mở poller, ngoài mọi cửa sổ attempt. Không chạy probe
  chạm dpkg nào trong cả phiên (chỉ đọc `wc -l` dpkg.log +
  `pgrep -x` — đọc, không chạm). Xem §0b + F-170-T4-5.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc đóng — không đổi; mọi poll
  đều tree=YES).
- **Cờ:** `hidden_files/round170-t4.done` viết ~12:0xZ 22/11
  (trong hạn cờ ~14:00Z, sớm hơn ~2h), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1 + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4)

Chạy **trước mọi attempt, trước khi mở poller** (11:39–11:40Z),
ghi vào `hidden_files/round170-t4/preflight-170.txt` — **PASS**:

- **b.json CÓ trong `round170-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156–169 (F-158-T4-1/2 KHÔNG lặp lại).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–169. **vite.t4-temp.config.mjs md5
  `e3e874e1528b28563f7aa26234661522`** — khớp.
- **tree-md5.txt `530e10a7` == preview.tsx hiện tại** (`530e10a7`).
- **10/10 analyzer** `analyze-t4-*.py` có mặt (c2coverage,
  c2drawlog, labellag, lag5, p1p3p7, perpass, skiplatest, stall,
  tickcost, wallbands).
- **Script hệ thống:** `vcut-webkit-postboot-check.sh` +
  `vcut-vite-lock-v2.sh` có mặt; `bash -n` OK cả 4 script T4;
  `python3 -m py_compile` OK 13 file py.
- **Playwright-core** `/home/hatch/scratch-round63-r4/
  node_modules/playwright-core/index.mjs` có mặt.
- **Media** `apps/web/public/stripes-nonperiodic.mp4` có mặt
  (140.828 B).
- **Lock + ngân sách trống:** không có `vite.lock`,
  không có `attempt-done-*` trong thư mục làm việc mới.
- **Deadline waiter epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG
  (bài học F-156-T8-3):** chuỗi deadline trong script
  `2026-11-22 13:30:00 UTC` → epoch **1795354200** =
  2026-11-22T13:30:00Z — khớp đúng hạn cắt poller 13:30Z
  (hạn cờ ~14:00Z = 1795356000, hạn cứng 14:30Z =
  1795357800); không còn sót dạng `04:30`/`05:00Z`/`05:30Z`/
  `07:30Z`/`08:00Z`/`08:30Z`/`10:30Z`/`11:00Z`/`11:30Z` nào
  trong script mới (grep 0 hit); grep `round168` trong mọi
  script làm việc 0 hit; grep `round169` chỉ còn fallback
  `round169-t5/` (có chủ đích, 3 hit trong poll-wait) +
  `t4-169` 0 hit (xem F-170-T4-1).
- **Copy-forward đợt 169 → 170:** deadline poller `10:30Z`
  → `13:30Z` ở cả 3 dạng; hạn cờ/cứng trong comment
  `11:00Z`/`11:30Z` → `14:00Z`/`14:30Z`; `brief dot 169` →
  `brief dot 170`; `poll-test-169`/`stats-169`/
  `distinct-seq-169` → 170; T5FLAG chính `round170-t5/` +
  fallback `round169-t5/`; **W trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` ĐÃ LÀ `round170-t4` ngay sau copy**;
  `T4-169a` → `T4-170a` trong `run-attempt-170.sh`;
  `default=169` → `default=170` trong `distinct-seq-170.py`;
  `run-attempt-169.sh` → `run-attempt-170.sh` ở cả poll-wait
  (cả dòng gọi thật, dòng 269) lẫn comment; `WebKit #38` →
  `WebKit #39` trong run-attempt.
  **GREP BẮT ĐƯỢC 0 SÓT** (F-168-T4-1 không tái diễn —
  checklist bổ sung dạng giờ đầy đủ `HH:MM:00Z` + tên file
  `NNN.sh`/`NNN.log`/`NNN.py` đã áp dụng và cho 0 hit).
- **Freeze check (bài học F-164-T4-1):** thư mục `round169-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-22 11:35:51Z**
  (giờ mở đợt 170); `round168-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ KHÔNG ĐẠT (KHÁC MẪU #77 — replay chưa xong
  lúc mở):** boot 5df1871f (btime 11:11:05Z, tuổi ~29m lúc mở),
  dpkg.log 2 dòng lúc kiểm đầu; `/var/log/apt/history.log`
  KHÔNG CÓ; cờ T5-170 CHƯA CÓ lúc mở (thư mục `round170-t5/`
  chưa tồn tại); cờ T5-169 chỉ ghi boot c44cc3ba, mtime
  08:46:38Z < btime 11:11:05Z — KHÔNG tính cho boot mới;
  postboot check-only chạy tay **exit 1** (FAIL — thiếu 11 gói
  apt + 5 lib + GST 0/269, xem `preflight-postboot-170.log`);
  lúc mở có process apt-get đang chạy (os-intent replay,
  `apt-get update` pid 843, etime 04:11 lúc 11:39Z) — replay
  ĐANG CHẠY, chưa xong. Gate0 chỉ đạt sau khi replay xong
  (poll #9 qua đường dự phòng T4-check-only, poll #13 qua
  đường chính T5).
- **Test poll (POLL_TEST=1): TEST-POLL-OK (exit 7 đúng thiết kế)** —
  poll #1 RAM 2071 MB (≥1024), load1 4,47/load5 2,31,
  gate0=khong-dat (postboot exit 1, pb_age 0), apt=1
  (replay đang chạy), dpkg 2 (xem `poll-test-170.log`).
  TEST-POLL-OK chỉ in ngay trước `exit 7` trong code nên
  dòng này trong log là bằng chứng exit 7.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb.**
- **F-170-T4-1 (lỗi nhỏ của chính T4 trong copy-forward, 0 thiệt
  hại):** `cp -a round169-t4 round170-t4` báo `failed to
  preserve ownership` (EPERM) nên exit != 0, chuỗi `&&`
  đứt — lệnh cleanup `rm` sau đó KHÔNG chạy ở lần đầu.
  Đã chạy lại cleanup riêng (rm exit 0, thư mục sạch 23 file
  trước khi đổi tên script). **Bài học đứng mới:** không
  chain cleanup sau `cp -a` bằng `&&`; chạy cleanup không
  điều kiện và kiểm lại bằng `ls` (F-169-T4-1 không tái
  diễn — lệnh kiểm chạy ngoài echo).

## 1. Poller — 22 poll thật, 1 lần cửa mở, trên 1 boot (không reboot)

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 5df1871f
  (11:40:00Z):** poll #1 RAM=2071 MB (≥1024), load1=4,47
  load5=2,31, blockers=0, gate0=khong-dat → cửa đóng
  (load + gate0) → **TEST-POLL-OK exit 7 đúng thiết kế**. Poll
  này nằm trong `poll-test-170.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot 5df1871f, 21 poll (11:40:20–
  11:55:26Z), 1 lần cửa mở:** RAM ≥1024: 21/21 (min 1429,
  max 2765 MB); 500–1023: 0/21; **<500: 0/21**;
  load1<2: 6/21; load5<2: 1/21; gate0: **khong-dat 8,
  T4-check-only 4, T5 9**; lock=khong 21/21; dpkg 2→1545;
  blockers>0: 1 poll (#2); apt>0: 11 poll.
- **Giai đoạn 1 — replay chạy (poll #1–#8, 11:40:20–
  11:45:38Z):** apt=1–2, dpkg 2→1158, postboot exit 1,
  gate0 khong-dat suốt giai đoạn; load1 2,47–7,08, load5
  2,47–5,17 (replay nặng); poll #7 dpkg 292, poll #8 dpkg
  527 + dpkgx=1; poll #2 blockers=1 (vite build của luồng
  khác, xem F-170-T4-2).
- **Giai đoạn 2 — postboot PASS qua đường dự phòng
  (poll #9–#12, 11:46:23–11:48:40Z):** gate0=T4-check-only
  từ poll #9 (postboot exit 0, pb_age 0); dpkg 1158→1545;
  apt về 0 ở poll #12 (11:48:40Z); load5 vẫn 4,42–5,80
  chặn cửa (load1 đã <2 ở poll #11–#12? không — load1
  #11: 4,80, #12: 3,42 — cả load1 lẫn load5 đều chặn).
- **Giai đoạn 3 — cờ T5 (poll #13, 11:49:25Z):**
  T5S=PASS (cờ T5-170 viết 11:49:14Z, boot+38m09s);
  gate0=T5 từ poll #13; load5 hạ dần 4,42→2,25 qua
  poll #13–#20 (load1 <2 từ poll #14 nhưng load5 chặn
  cửa suốt giai đoạn).
- **Giai đoạn 4 — CỬA MỞ (poll #21, 11:55:26Z):**
  load1 0,20/load5 1,94, RAM 1982 MB, **gate0=T5**
  (POSTBOOT_PASS 11:49:14Z) → **CỬA MỞ, chạy attempt1**
  → HỢP LỆ → poller thoát 11:59:18Z vì LUOT HOP LE.
- **Phân rã 22 poll thật:** RAM≥1024: 22/22; RAM 500–1023:
  0/22; RAM<500: **0/22**. load1<2: 6/22; load5<2: 1/22.
  1 poll mà load + RAM cùng đạt — chính là poll mở cửa thật
  (#21); **stats "gan-mo" đếm 1 = mở cửa thật 1 — KHÔNG còn
  lệch gan-mo/mở-cửa như F-168-T4-5** (đợt này không có poll
  nào load+RAM đạt mà bị gate0/apt chặn). gate0: T5 9 poll,
  T4-check-only 4 poll, khong-dat 9 poll (8 instance 2 + 1
  test). blockers>0: 1 poll. apt>0: 12 poll.
  **RAM <500 MB: 0/22 poll** — SẠCH, lần thứ ba liên tiếp
  (đợt 168: 0/26, đợt 169: 0/13). Ghi nhận để T9-170 đối
  chiếu headroom/balloon trên boot mới.

## 2. Attempt1 HỢP LỆ — lượt yên #39

- **Attempt1-5df1871f (11:55:26–11:59:18Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 40,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2861–3391 ms/pass): tickCost n=672, blendTick n=548
  (tBlend gap n=547 — xem F-167-T4-2, quy ước đếm gaps),
  c2DrawLog n=1305.
  **tickCost total median= 40,0 ms (p90 64,0, max 100, min 27)**
  — DƯỚI NGƯỠNG 20,0 ms; hậu flip+2000 ms median 40,0.
  Per-pass median 36,0–53,0 ms (pass 10: 53,0; pass 3: 36,0;
  pass 12: 36,0; pass 19: 36,0) trong khi load1 mean/pass
  0,92→2,28 và RAM mean/pass GIẢM 1786→1436 MB (tương quan
  Pearson median~load1 r=-0,05, median~RAM r=0,18 — không
  đáng kể, không kết luận nhân quả từ 1 lượt; xem
  F-170-T4-4).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,51 ≤2,5 ĐẠT;
  B2 load1 max 2,28 ≤4 ĐẠT — sampler n=100 dòng (1 header
  + 99 mẫu, xem F-168-T4-7); B3 không reboot ĐẠT; B4
  pgrep -x=0, ps exact-comm=0, dpkg delta=0 (1545→1545)
  ĐẠT; B5 RAM min 1424 MB, 0 mẫu <500 MB, **0/100 mẫu
  <1024 MB** — sạch hoàn toàn — ĐẠT).
  **(c2)=8** (seq 195, 222, 276, 306, 333, 420, 476, 502 — cả 8
  COVERED, delta −24/−25/+30/+31/−20/+27/−22 ms; blendTick
  hậu-flip 401/401 trong ±500 ms của log)
  — ĐÃ CỘNG DỒN.
  P3' 8/8 DAT (stall 5/4/7/6/3/5/5/3). lag≥+5f (b) = **0 occurrence** —
  sạch.
  **p1p3p7 chạy TAY (F-148-T4-1): P1 ĐÚNG 8/8** (cả 8 seq gần
  run-end [195, 222, 276, 306, 333, 420, 476, 502 trong 14
  run_end seqs], baseline 42/401, p=1,44824e-08 <0,01, n=8);
  **P2 ĐÚNG 8/8** (lag +1f ×7, +3f ×1 (seq 222); 0 lag âm);
  **P3-A1 ĐÚNG 7/8** (7/8 đóng băng-tại-tick, seq 222 không
  đóng băng-tại-tick; baseline 80/400, p=8,448e-05 <0,01 —
  ĐÚNG trở lại sau 2 đợt SAI, xem F-170-T4-3);
  **P7 ĐÚNG** (0/99 entry trễ ≥+1f cho 8 seq; đối chứng
  toàn bộ drawSrc post 0/487).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.689.758 B (md5
  `e1cbc5eb542da126800b35d00f60847a`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0, engine
  webkit 27.2, gstPluginPath hệ thống.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=66 tick
  skippedLatest=1 hậu flip+2000ms, bar ≥30; (1) 100%,
  (2) 100%).
  **Attempt này ĐƯỢC CỘNG DỒN** (lượt hợp lệ — theo quy ước
  đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Lưu ý cả 8 seq 195/222/276/306/333/420/476/502 ĐỀU MỚI:**
  cả 8 seq chưa có trong sổ distinct-seq (seen_c2 + seen_dat)
  nên cộng thêm distinct (xem §6); không seq nào KHÔNG DAT cũ
  chuyển thành DAT đợt này (non_dat_in_union [283, 364, 498]
  không đổi).

## 2b. Không có attempt2/attempt3 — ngân sách dùng 1/3

Lượt hợp lệ ngay attempt đầu nên poller thoát, không retry.
Không có attempt nào nhiễm, không có attempt nào vi phạm lớp B
đợt này.

## 3. B2 spike trong cửa sổ attempt (theo nhiệm vụ đợt 170)

- **Attempt1 (11:55:26–11:59:18Z) — KHÔNG SPIKE: load1 max
  2,28 (≤4), RAM min 1424 MB.** Trong ps-before/after chỉ có
  vite của chính attempt (pid 36727/36742/36743 trong
  ps-after; ps-before không có process nặng luồng khác);
  không còn T6 suite hay render nào khác. Delta tick max:
  tBlend gap max 1824 ms; tickCost max 100 ms.
  **Kết luận: cửa sổ attempt hợp lệ sạch — đúng kỳ vọng.**
- **Ngoài cửa sổ attempt:** poll #2 (11:41:06Z) blockers=1 —
  `vite build` của luồng khác (pid 18762, xem F-170-T4-2);
  load1 vọt tới 8,32 trong lúc replay (poll #10, 11:47:09Z)
  — KHÔNG tính là B2 spike trong cửa sổ attempt; chỉ ghi
  nhận là tải replay.

## 4. Replay/postboot trên boot mới — cờ T5-170 ĐÃ CÓ (11:49:14Z); không reboot giữa phiên

- **Boot 5df1871f (btime 11:11:05Z, số hiệu giao T0-170 xác
  minh — ứng viên #79): replay CHẠY TRONG PHIÊN T4.**
  Lúc T4 mở (11:40Z): dpkg.log 2 dòng, `/var/log/apt/` chưa
  có, postboot check-only exit 1 — KHÔNG phải mẫu
  replay-xong-trước-khi-mở như boot #77 (dpkg 1545 dòng lúc
  mở). Replay os-intent (`apt-get update` pid 843) đang chạy
  lúc 11:39Z; dpkg 2→292 (poll #7, 11:44:52Z) →527 (poll #8)
  →1158 (poll #9, postboot exit 0) →1274 →1432 →1545
  (poll #12, 11:48:40Z, apt về 0); apt history.log xuất hiện,
  last Start-Date 11:48:15.
  **T5-170: POSTBOOT_PASS mới viết 11:49:14Z
  (boot+38m09s; dpkg 1545 dòng; cache 178 .deb; lists 30;
  postboot PASS poll=0 độc lập exit 0; replay-đầy-đủ; cờ cũ
  c44cc3ba lưu POSTBOOT_PASS-c44cc3ba).** Gate0=T5 từ poll
  #13 (11:49:25Z); attempt1 mở cửa qua đường (a) chuẩn.
  Gate0 đường dự phòng T4-check-only ĐẠT từ poll #9
  (11:46:23Z) nhưng load5 chặn cửa nên không mở attempt sớm
  — đúng luật (quyết (j) đợt 143: check-only chỉ là đường
  dự phòng khi cờ T5 chưa có; khi cờ T5 đã có thì đường (a)
  là chính).
  **Watcher-170 của T5 ĐANG CHẠY lúc T4 đóng** (pid 20516,
  `replay-watch-170.sh` — kiểm lúc 12:02Z).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:**
  boot 5df1871f lúc poller khởi động (11:40:20Z), lúc
  attempt1, lúc poller thoát (11:59:18Z) và lúc kiểm cuối
  (12:02:22Z) — btime 11:11:05Z không đổi; 0 dòng REBOOT
  PHAT HIEN trong poll log.
- **Reboot MỚI TRƯỚC KHI MỞ (btime 11:11:05Z, boot 5df1871f):**
  đợt mở 11:35:51Z — boot mới hơn giờ mở 24m46s. Số hiệu
  (#79?) + xác minh 9 nguồn giao T0-170; **lưu ý mốc giờ:**
  T10-169 ghi boot lúc đóng vẫn là e298bb52 ~11:15Z, trong
  khi btime boot mới là 11:11:05Z — T0-170 phải đối chiếu kỹ
  mốc giờ (có thể T10-169 kiểm boot trước 11:11:05Z rồi mới
  đóng sổ sau đó). T4 không thấy poll nào trên boot cũ trong
  phiên này (poller mở sau reboot).
  Mù #96?/#95?/#94?/#88?/#77?/#78? giao T2-170 — T4 không tự mở mù.
- **85m4 / 86n2 / 84l10: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Đây là verdict của harness T8, T4 không đo và không suy
  đoán — giao T8-170 báo cáo. (T4 chỉ ghi: 0 kẹt quan sát
  được trong attempt của mình; probe không wedged.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND170_T4_WEBKIT_QUIET39_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round170-t4/`):**
  `poll-wait-t4-170.sh` (md5 `a4531221ac8808cf348d13938cc72432`;
  deadline 13:30Z 22/11 + cờ T5 round170-t5/ + fallback
  round169-t5/ + nhãn T4-170a),
  `run-attempt-170.sh` (md5 `e4f7264ffbd760d6e123358b29f5a805`;
  đổi số vòng/đường dẫn/nhãn so với 169, lượt yên #39),
  `distinct-seq-170.py` (md5 `9dec0eb0cd6483a9feb57271cc2a98c4`;
  HELPER đọc sổ distinct-seq-ledger.json; đợt này ĐÃ DÙNG
  LIVE trên attempt hợp lệ — khi chạy từ `apps/web/scripts/`
  phải truyền `--ledger` trỏ tới sổ vì sổ không nằm cùng
  thư mục — nếu không, helper lỗi FileNotFoundError thay vì
  in số sai, xem §6).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–169, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round170-t4/` — theo đúng mẫu 149–169: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round170-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–169).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-170.sh`, `run-attempt-170.sh`,
  `t4-attempt-inner.sh` (W = round170-t4 + glob check nhiễu
  chéo round170-*), `check-classb-t4.sh` (W = round170-t4),
  10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-170.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn 34 lượt — P1 132/135, P2
  126/126, P3-A1 114/135, P3' 99/107 = 91/94, P7 68/68;
  chuỗi median n=34 mean 48,4 — xem F-170-T4-5),
  `distinct-seq-170.py` (helper đọc sổ, xem §6),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-170: 91/94 distinct, occ 99/107, valid_rounds_p3 22,
  non_dat_in_union [283, 364, 498], md5
  `63c0b5a9ed19be82a1ec17f99b91a6bd` — nguồn thật cho T4-171),
  `distinct-seq-ledger-170-proposed.json` (bản helper ghi ra
  trong live — giống hệt sổ đã thăng cấp, giữ làm audit
  trail),
  `distinct-seq-ledger-170-backtest169-proposed.json` (bản
  helper ghi ra trong back-test — nội dung KHỚP HỆT sổ
  as-of-169 gốc, md5 `1b328008...`, giữ làm audit trail),
  `distinct-seq-170-backtest169.txt` (output helper back-test —
  KHỚP live 169),
  `distinct-seq-170-live.txt` (output helper live trên
  attempt1-5df1871f),
  `preflight-170.txt` + `preflight-postboot-170.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1
  + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4).
- **Log/evidence (hidden_files/round170-t4/, không stage):**
  `poll-t4.log` (21 poll instance 2 + CUA YEN MO ×1 + LUOT
  HOP LE ×1, 0 REBOOT PHAT HIEN),
  `poll-test-170.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`,
  `postboot-t4-170-gate0wait-*.log` (check-only các poll
  #1/#5/#9/#13/#17/#21),
  `stats-170-output.txt` (output stats-170.py),
  `preview-b-f3-flip-webkit-t4-attempt1-5df1871f.json`
  (3.689.758 B, 20/20, md5
  `e1cbc5eb542da126800b35d00f60847a`)
  + `run-webkit-t4-attempt1-5df1871f.log`
  + `load-mid-t4-attempt1-5df1871f.log` (sampler 100 dòng =
  1 header + 99 mẫu)
  + `ps-before/after-t4-attempt1-5df1871f.txt`
  + `classb-t4-attempt1-5df1871f.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-5df1871f-*.txt` (11 file, gồm
  p1p3p7 chạy tay — xem F-148-T4-1)
  + `coverage-check-attempt1-5df1871f.txt` ((c2)=8/8)
  + `attempt-done-attempt1-5df1871f` (exit 0, 11:59:18Z).
  `vite-5187-t4-attempt1-5df1871f.log` (vite log attempt) +
  `stop-sampler-t4-attempt1-5df1871f` (marker) +
  `dpkg-lines-before-*` + `apt-history-before-*` (B4 baseline
  attempt) + `marker-t4-attempt1-5df1871f` (marker) +
  `blockers-ps-2.txt` + `blockers-list-2.txt` (blocker poll #2,
  xem F-170-T4-2).
  (`analyze-l7-labellag.txt` + `lag5-detail.txt` là file phụ
  analyzer tự ghi lại trong lúc chạy — có mặt từ các đợt
  trước, không stage.)
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§5); không process T4 nào còn sống lúc đóng
  (poller đã thoát 11:59:18Z vì LUOT HOP LE — xem F-169-T4-4
  về pgrep tự khớp; vite :5187 + lock trống, curl 000;
  `/tmp/.X11-unix/` còn X194/X195 của suite luồng khác —
  X193 của attempt đã dọn tay, xem §6 F-170-T4-6).

## 6. Sai số F-170-T4-1..6 (+ nợ cũ)

- **F-170-T4-1 — COPY-FORWARD: `cp -a` LỖI PRESERVE OWNERSHIP
  (EPERM) LÀM ĐỨT CHUỖI `&&`, CLEANUP KHÔNG CHẠY LẦN ĐẦU
  (lỗi nhỏ của chính T4, 0 thiệt hại).** `cp -a round169-t4
  round170-t4` báo `failed to preserve ownership` nên exit
  != 0; lệnh cleanup `rm` nối sau bằng `&&` không chạy.
  Đã chạy lại cleanup riêng (rm exit 0, thư mục sạch 23 file
  trước khi đổi tên script); freeze check round169-t4 = 0
  file mtime ≥ giờ mở (copy chỉ đọc nguồn, không đổi mtime
  nguồn). **Bài học đứng mới (bổ sung checklist đợt 171):**
  không chain cleanup sau `cp -a` bằng `&&`; chạy cleanup
  không điều kiện và kiểm lại bằng `ls`.
- **F-170-T4-2 — POLL #2 BLOCKERS=1: `vite build` CỦA LUỒNG
  KHÁC TRONG LÚC POLL (không nằm trong cửa sổ attempt, 0
  thiệt hại).** Poll #2 (11:41:06Z): 1 blocker comm-based —
  `node .../node_modules/.bin/vite build --config
  vite.config.ts` pid 18762; biến mất ở poll #3
  (blockers=0). Legacy-chuoi-con đếm 6 ở poll #1–#2 (shell
  các luồng khác nhắc tới apt/dpkg/vite trong cmdline — chỉ
  tham chiếu, không dùng verdict). Ghi nhận để T1/T2 đối
  chiếu lịch build trong cửa sổ 11:41Z.
- **F-170-T4-3 — SEQ 222 LAG +3f VÀ LÀ SEQ DUY NHẤT KHÔNG
  ĐÓNG BĂNG-TẠI-TICK (nhất quán với cơ chế catch-up lag).**
  (c2) 8 seq: 7 seq lag +1f và đóng băng-tại-tick; riêng 222
  lag +3f (lớn nhất lượt) và KHÔNG đóng băng-tại-tick —
  P3-A1 7/8 thay vì 8/8. Mẫu này nhất quán với cơ chế
  catch-up lag sau đóng băng (lag lớn hơn → tick đã thoát
  khỏi tick đóng băng). P3-A1 vẫn ĐÚNG (7/8 ≥ 2/3 VÀ
  p=8,448e-05 < 0,01). Điều tra (c2) VẪN ĐÓNG (chỉ giám sát
  thụ động theo quyết parent đợt 137) — không mở lại.
- **F-170-T4-4 — LOAD1 MEAN/PASS TĂNG 0,92→2,28 + RAM
  MEAN/PASS GIẢM 1786→1436 MB TRONG LÚC ĐO HỢP LỆ (cùng họ
  F-169-T4-7, nhẹ hơn; r không đáng kể).** Per-pass load1
  mean: pass 1: 0,92 → pass 17: 2,28 (tăng gần đơn điệu rồi
  giữ ~2,0); RAM mean/pass giảm 1786→1436 MB (r=-0,05 /
  0,18 — không đáng kể). `ps-before/after` không thấy process
  nặng luồng khác trong cửa sổ attempt (chỉ vite của chính
  attempt); ngoài cửa sổ có T9 sampler/b2-watcher/probe-loop
  + T6 suite + T8 waiter đang chạy. B2 DAT theo load (max
  2,28 ≤ 4) là chính; tickCost median 40,0 vẫn dưới ngưỡng
  20,0 ms. Ghi nhận, không kết luận nhân quả từ 1 lượt.
- **F-170-T4-5 — TUÂN THỦ LUẬT KHÔNG CHẠY SCRIPT NẶNG TRONG
  CỬA SỔ ATTEMPT (ghi rõ để T10 kiểm).** Trong cửa sổ
  attempt1 (11:55:26–11:59:18Z), T4 không chạy script nào
  (poller đang chạy nền; agent chỉ chờ background delivery);
  KHÔNG chạy stats/helper/p1p3p7/đọc analyzer nào trong cửa
  sổ. Phân tích nặng làm sau khi attempt kết thúc (từ
  ~11:59:25Z: stats-170.py, helper distinct-seq-170
  back-test + live, p1p3p7 chạy tay, đọc analyzer).
  Pre-flight postboot check-only (11:39:51Z) + test poll
  (11:40:00Z) chạy trước poller, ngoài mọi cửa sổ attempt.
  Không chạy probe chạm dpkg nào trong cả phiên (chỉ đọc
  `wc -l` dpkg.log + `pgrep -x`). Không có vi phạm.
- **F-170-T4-6 — X11 3 SOCKET LÚC ĐÓNG; X193 CỦA T4 ĐÃ DỌN
  TAY, X194/X195 CỦA SUITE LUỒNG KHÁC ĐỂ T8 DỌN (cùng mẫu
  F-169-T4-10, lần thứ tư liên tiếp cùng 3 số display).**
  Sau khi poller thoát, `/tmp/.X11-unix/` còn X193 (mtime
  11:55:30Z — đúng lúc attempt1 mở Xvfb :193), X194 + X195
  (mtime 11:44:43Z — trước attempt1, của suite luồng khác).
  0 Xvfb còn chạy. T4 đã dọn tay socket X193 (rm -f); kiểm
  lại còn X194/X195 lúc đóng — giao T8-170 dọn.
- **F-169-T4-6 — P3-A1 SAI 3/3 (p=0,02135) đợt 169: KHÔNG TÁI
  DIỄN — ĐÚNG TRỞ LẠI (F-170-T4-3).** Đợt này P3-A1 ĐÚNG 7/8
  (p=8,448e-05). Chuỗi SAI dừng ở 2.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này (có attempt hợp lệ để
  chạy p1p3p7 tay).** p1p3p7 chạy tay đúng form
  (`$JSON "195,222,276,306,333,420,476,502"`, exit 0) — xem §2.
  Nợ đứng ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn —
  mỗi đợt có attempt hợp lệ T4 phải chạy tay và ghi rõ.

## 7. P3' cộng dồn (MỚI — 34 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 170 (MỚI): P1 132/135, P2 126/126,
  P3-A1 114/135, P3' 99/107 occurrence = 91/94 distinct-seq,
  P7 68/68** (34 lượt hợp lệ — #39 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 169 §6: "33 lượt hợp lệ" — nay 34).
- **Đóng góp lượt #39 (attempt1-5df1871f, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=8 occurrence / 8 distinct-seq [195, 222, 276, 306,
  333, 420, 476, 502], trong đó 8 seq MỚI [195, 222, 276,
  306, 333, 420, 476, 502].
  - **P1 — ĐÚNG 8/8 occ** (cả 8 seq gần run-end: trong 14
    run_end seqs; baseline 42/401, p=1,44824e-08 trên distinct
    8/8 — verdict ĐÚNG theo luật DEF §3 vì n=8 ≥3 và p<0,01).
    Cộng dồn 124/127 → **132/135**.
  - **P2 ĐÚNG — 8/8 occ** (lag +1f ×7, +3f ×1 (seq 222);
    0 lag âm). Cộng dồn 118/118 → **126/126**.
  - **P3-A1 — ĐÚNG 7/8 occ** (7/8 seq đóng băng-tại-tick,
    seq 222 không; baseline 80/400, p=8,448e-05 — verdict
    ĐÚNG theo luật DEF §5 vì 7/8 ≥2/3 VÀ p<0,01; xem
    F-170-T4-3). Cộng dồn 107/127 → **114/135**.
  - **P3' 8/8 occ ĐẠT** (195 stall 5, 222 stall 4, 276 stall 7,
    306 stall 6, 333 stall 3, 420 stall 5, 476 stall 5,
    502 stall 3). Cộng dồn 83/86 → **91/94 distinct** (8 seq
    MỚI — 195, 222, 276, 306, 333, 420, 476, 502);
    occurrence 91/99 → **99/107**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 52, 0: 47}; đối chứng toàn bộ drawSrc post: {-1: 340,
    0: 147}, 0/487 entry). Cộng dồn 67/67 → **68/68**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–169).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-170.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 169: 83/86 distinct, occ 91/99), tính seq MỚI =
  tập hiệu với sổ, in cộng dồn mới distinct + occurrence,
  ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-170-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Back-test trước live (xem F-169-T4-2):** helper-170 trên
  stall + c2coverage attempt3-169 với sổ as-of-168 (bản
  backtest168b-proposed đợt 169 — nội dung bằng sổ as-of-168
  gốc) → ra 83/86 distinct, 91/99 occ — khớp hệt live 169;
  bản proposed của back-test KHỚP HỆT sổ as-of-169 gốc
  (md5 `1b328008...`, so sánh dict bằng nhau). Helper
  ĐÃ ĐƯỢC KIỂM CHỨNG trước live.
  **Live đợt 170:** sổ + stall/c2coverage
  attempt1-5df1871f → **91/94 distinct, 99/107 occ** — khớp
  tính tay độc lập dưới đây. Sổ đã thăng cấp: as-of 170,
  91/94 distinct, occ 99/107, valid_rounds_p3 22,
  non_dat_in_union [283, 364, 498] (KHÔNG đổi — không seq
  không-DAT cũ nào DAT thêm đợt này; md5 sổ mới
  `63c0b5a9ed19be82a1ec17f99b91a6bd`).
- **Kiểm chứng seq 195/222/276/306/333/420/476/502 đợt 170:**
  helper (đọc sổ) xác nhận **cả 8 đều MỚI** (chưa có trong sổ
  — seen_c2 86 seq VÀ seen_dat 83 seq đều không chứa
  195/222/276/306/333/420/476/502). Tính tay: distinct DAT
  83 + 8 = **91**; distinct tổng 86 + 8 = **94**; occurrence
  91 + 8 = **99**, 99 + 8 = **107**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — và được củng cố:** lượt hợp lệ mới
  (8 occ, 8 seq mới) có P1 ĐÚNG 8/8 (p~1e-08) + P3-A1 ĐÚNG
  7/8 (p~8e-05) — cả hai phép thử nghiêm ngặt đều ĐÚNG đợt
  này; P3' prereg (stall) DAT 8/8. Wedge không xảy ra đợt
  này (0 wedge — chuỗi 0-wedge tiếp tục từ đợt 169).
- Chuỗi median tickCost 34 lượt (mới): 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 /
  59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 /
  60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 /
  53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 / **40,0 ms**
  (trung bình 48,4 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại (chỉ ghi nhận mẫu
  seq 222 ở F-170-T4-3).

## 8. Chờ quyết parent / nợ đợt 171

- **(a) #39 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 34.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT đợt
  này** — attempt1-5df1871f hợp lệ trên boot 5df1871f (btime
  11:11:05Z, boot đo lúc mở); gate mở 11:55:26Z qua đường (a)
  chuẩn (cờ T5 PASS 11:49:14Z). O8 chạy trên boot nào, có qua
  gate chuẩn hay phải dùng thủ tục (i), là do T8/T10 quyết;
  T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
  Lưu ý: waiter của T8 đang chờ cờ T4 (cùng mẫu đợt 169) —
  cờ `.done` viết ~12:0xZ, trong hạn cờ ~14:00Z.
- **(b) P3' cộng dồn MỚI 34 lượt: P1 132/135, P2 126/126,
  P3-A1 114/135, P3' 99/107 = 91/94, P7 68/68:** helper đã
  chạy live (back-test khớp live 169); sổ
  distinct-seq-ledger.json đã thăng cấp as-of-170 (91/94
  distinct, occ 99/107, valid_rounds_p3 22, non_dat [283, 364,
  498]). **Chờ parent/T10 quyết:** ghi nhận cộng dồn mới.
  T10 kiểm lại phép cộng khi viết aggregate (§12).
- **(c) REBOOT MỚI TRƯỚC KHI MỞ (btime 11:11:05Z, boot
  5df1871f — ứng viên #79) — giao T0-170 xác minh số hiệu +
  9 nguồn; giao T7-170/T2-170 kiểm tra run 169 có bị viết lại
  tại reboot này không + (m) cho reboot mới.** Dữ kiện T4:
  btime 11:11:05Z; đợt mở 11:35:51Z (boot mới hơn giờ mở
  24m46s); poller mở sau reboot nên không có poll nào trên
  boot cũ trong phiên này; 0 reboot trong phiên. **Lưu ý mốc
  giờ:** T10-169 ghi boot lúc đóng vẫn là e298bb52 ~11:15Z —
  T0-170 đối chiếu kỹ (btime 11:11:05Z < ~11:15Z).
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1/F-167-T4-1/F-168-T4-1/F-169-T4-1/3/4 TIẾP TỤC
  CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc đứng, BỔ SUNG 1 MỤC:**
  không chain cleanup sau `cp -a` bằng `&&` (F-170-T4-1).
  T4-171 áp dụng y hệt checklist này + grep thêm số cộng dồn
  cứng trong stats-*.py (F-169-T4-3) + lệnh kiểm chạy ngoài
  echo (F-169-T4-1) + kiểm poller thoát bằng chain log, không
  dùng pgrep -f (F-169-T4-4).
- **(e) POSTBOOT_PASS cho boot mới 5df1871f ĐÃ CÓ (11:49:14Z,
  boot+38m09s, replay-đầy-đủ, poll=0): GHI NHẬN.** Hướng (3)
  — replay tự nhiên + cờ T5 — vẫn đứng (lần này replay trên
  boot mới chạy TRONG phiên T4 và xong trước khi gate mở,
  nhanh hơn cả #77). Watcher-170 ĐANG CHẠY lúc T4 đóng.
- **(f) RAM <500 MB: 0/22 poll — SẠCH.** Lần thứ ba liên tiếp
  không có poll nào <500 MB; đợt 169: 0/13, đợt 168: 0/26.
  Ghi nhận để T9-170 đối chiếu headroom/balloon trên boot mới.
- **(g) P3-A1 ĐÚNG 7/8 (p=8,448e-05) + P1 ĐÚNG 8/8
  (p=1,44824e-08): GHI NHẬN.** P3-A1 ĐÚNG trở lại sau 2 đợt
  SAI — trượt bar p đợt 168/169 là do baseline cao + n=3,
  không phải bằng chứng chống đóng băng; P3' prereg DAT 8/8;
  điều tra (c2) vẫn ĐÓNG. P1 ĐÚNG với n=8 (lớn nhất kể từ
  đợt 151).
- **(h) B4 SẠCH (delta=0): GHI NHẬN.** Không có dòng dpkg lẻ
  như đợt 169 (F-169-T4-8 không tái diễn); replay chạy xong
  TRƯỚC khi attempt mở (apt=0 từ poll #12, dpkg ổn định
  1545 từ poll #12 tới lúc đóng).
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate mở 11:55:26Z
  (poll #21, gate0 T5) → attempt1 HỢP LỆ 11:59:18Z
  trên boot 5df1871f → **GATE cho chuỗi FULL PASS ĐẠT từ
  phía T4** (lượt yên hợp lệ #39, boot đo 5df1871f, gate qua
  đường (a) chuẩn). T8 tự quyết O8 trên boot này.
- **(j) Các nợ đứng khác giữ nguyên từ đợt 169 §8:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#78?/#88?/#94?/#95?/#96? giao T2
  (mù #88? MỞ, #94? (#62) MỞ, #95? (#63) MỞ theo quyết (b)
  đợt 163; mù #96? (#64) MỞ sau điều tra đầy đủ — T2-170
  theo dõi tiếp, hole-recheck lần 14); (m) #78 ứng viên DƯƠNG
  thuộc T2-170 + parent đợt 170; birefnet 0 thử (đợt này
  không thử — lần 24); u2net là fallback chính thức; kết cục
  run 169 thuộc T7-170; **POSTBOOT_PASS #77 ĐÃ CÓ từ đợt 169**
  (chỉ còn ý nghĩa hồ sơ — boot #77 đã chết); **replay tự
  nhiên ĐÃ XONG trên boot mới 5df1871f lúc T4 đóng** (dpkg
  1545 dòng, cache 178 .deb, lists 30, check độc lập của T5
  PASS).

## A. Phụ lục số liệu (script trích từ log gốc — stats-170.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-170.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-22T11:40:00Z - 2026-11-22T11:40:00Z, boot=5df1871f
   RAM min=2071 max=2071 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 0/1 load5<2: 0/1 blockers>0: 0 apt>0: 1
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 21 poll, 2026-11-22T11:40:20Z - 2026-11-22T11:55:26Z, boot=5df1871f
   RAM min=1429 max=2765 >=1024: 21/21 500-1023: 0/21 <500: 0/21
   load1<2: 6/21 load5<2: 1/21 blockers>0: 1 apt>0: 11
   gate0: T4-check-only=4, T5=9, khong-dat=8
   lock: khong=21
   dpkg 2->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 22
-- RAM toan phien: min=1429 max=2765 >=1024: 22/22 <500: 0/22
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 1/22
   gan-mo? #21 2026-11-22T11:55:26Z boot=5df1871f RAM=1982 L1=0.20 L5=1.94 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round170-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 5df1871f: 22 poll; RAM>=1024 lan cuoi: 2026-11-22T11:55:26Z #21; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 34 luot hop le): P1 132/135 P2 126/126 P3-A1 114/135 P3' 99/107 occ = 91/94 distinct-seq P7 68/68
-- chuoi median 34 luot: n=34 mean=48,4 min=39,0 max=60,0 vuot-60: 0
```
