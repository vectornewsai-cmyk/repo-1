# PHASE9_ROUND171_T4_WEBKIT_QUIET40_LIMITS.md

**Đợt:** 171. **Luồng:** T4 — đo lượt yên WebKit #40 trên 1 boot
+ **#40 CÓ LƯỢT HỢP LỆ Ở ATTEMPT3 — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 35**
  (attempt1 + attempt2 NHIỄM TẢI (lớp B vi phạm) nên retry;
  attempt3-2acdd1ab HỢP LỆ ngay lần thử thứ ba trên cùng boot
  2acdd1ab; ngân sách dùng 3/3; poller thoát 15:12:00Z vì ĐẠT,
  trước hạn cắt poller 16:30Z 1h18m, trước hạn cờ ~17:00Z
  ~1h48m; không reboot giữa phiên; poller 18 poll thật,
  3 lần cửa mở).
+ **P1 ĐÚNG 4/4 (p=0,000159042) + P3-A1 ĐÚNG 4/4 (p=0,00233572)**
  — cả hai phép thử nghiêm ngặt đều ĐÚNG đợt này.
  **2 SEQ MỚI 249, 433** vào sổ distinct-seq (153 + 377 đã thấy).
+ **BOOT MỚI 2acdd1ab (btime 14:31:01Z) — ỨNG VIÊN #80**
  (số hiệu giao T0-171 xác minh); replay ĐÃ XONG TRƯỚC KHI MỞ
  POLLER (apt history End-Date 14:37:43Z — khác mẫu #79 đợt
  170 replay chạy trong phiên); POSTBOOT_PASS #80 viết
  14:52:09Z (replay-đầy-đủ, poll=0).
+ **WORDING F-170-T9-9 ĐÃ SỬA (quyết (h) đợt 170):** trong
  LIMITS này T4 dùng đúng câu chữ mới — "không chạy script
  nào trong lúc probe pass chạy" (xem §0b + F-171-T4-5).
**Ngày:** 22/11/2026 (lượt cron 21:35 +07 22/11 = 14:35:51Z).
**Boot đo:** MỘT boot — 2acdd1ab (btime 14:31:01Z, boot lúc mở
mới hơn giờ mở 4m50s; số hiệu reboot giao T0-171 xác minh —
ứng viên #80).
**Trạng thái:
#40 CÓ LƯỢT HỢP LỆ (attempt3-2acdd1ab: 20/20, lớp B 5/5,
tickCost median 43,0 ≤ 60 — LUOT HOP LE, poller thoát
15:12:00Z vì ĐẠT, trước hạn cắt poller 16:30Z 1h18m, trước
hạn cờ ~17:00Z ~1h48m). Ngân sách dùng 3/3. Cộng dồn LÊN 35
lượt hợp lệ: P1 136/139, P2 130/130, P3-A1 118/139, P3'
103/111 occurrence = 93/96 distinct-seq, P7 69/69. Sổ
distinct-seq THĂNG CẤP as-of-171 (93/96 distinct, occ 103/111,
2 seq mới 249 + 433, non_dat_in_union [283, 364, 498] KHÔNG đổi).
RAM <500 MB: 0/18 poll — SẠCH (lần thứ tư liên tiếp).
POSTBOOT_PASS cho boot mới 2acdd1ab ĐÃ CÓ (14:52:09Z, T5-171 sở
hữu, replay-đầy-đủ); watcher-171 của T5 ĐANG CHẠY lúc đóng
(pid 28156, `replay-watch-171.sh`).**

## 0. Verdict tổng

- **#40 CÓ LƯỢT HỢP LỆ (attempt3-2acdd1ab).**
  Poller thoát 15:12:00Z vì LUOT HOP LE — KHÔNG phải hết
  hạn (hạn cắt 16:30Z còn 1h18m, hạn cờ ~17:00Z còn
  ~1h48m).
- **Attempt3-2acdd1ab (15:08:10–15:12:00Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 43,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2895–3301 ms/pass): tickCost n=623, blendTick n=507
  (tBlend gap n=506), c2DrawLog n=1209.
  **tickCost total median= 43,0 ms (p90 68,8, max 167, min 27)**
  — DƯỚI NGƯỠNG 17,0 ms; hậu flip+2000 ms median 44,0.
  Per-pass median 38,0–53,0 ms (pass 2: 53,0 cao nhất;
  pass 1: 38,0 thấp nhất) trong khi load1 mean/pass
  1,69→2,96 và RAM mean/pass GIẢM 2650→2416 MB (tương quan
  Pearson median~load1 r=-0,27, median~RAM r=0,44 — không
  đáng kể, không kết luận nhân quả từ 1 lượt; xem
  F-171-T4-4).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,99 ≤2,5; B2 load1
  max 3,04 ≤4 — sampler n=100 dòng gồm 1 header + 99 mẫu,
  xem F-168-T4-7; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0 (1545→1545); B5 RAM min 2416 MB,
  0 mẫu <500 MB, 0/100 mẫu <1024 MB — sạch hoàn toàn).
  **(c2)=4** (seq 153, 249, 377, 433 — cả 4 COVERED, delta
  +35/−28/−21/+33 ms; blendTick hậu-flip 374/374 trong
  ±500 ms của log) — ĐÃ CỘNG DỒN.
  P3' 4/4 DAT (stall 5/6/5/4). lag≥+5f (b) = 6 occurrence
  (2 events, seq 458–461, max +7f — KHÔNG phải (c2), xem
  F-171-T4-3).
  p1p3p7 chạy TAY (F-148-T4-1): **P1 ĐÚNG 4/4** (cả 4 seq gần
  run-end [153, 249, 377, 433 trong 14 run_end seqs],
  baseline 42/374, p=0,000159042 <0,01, n=4);
  **P2 ĐÚNG 4/4** (lag +1f ×4; 0 lag âm);
  **P3-A1 ĐÚNG 4/4** (4/4 đóng băng-tại-tick; baseline
  82/373, p=0,00233572 <0,01);
  **P7 ĐÚNG** (0/46 entry trễ ≥+1f; đối chứng 0/456).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.352.912 B (md5
  `3f71f97f9fef0e81d06e9e6f64f6cb7c`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=69 tick
  skippedLatest=1 hậu flip+2000ms, bar ≥30; (1) 100%,
  (2) 100%).
  **Attempt này ĐƯỢC CỘNG DỒN** (lượt hợp lệ — theo quy ước
  đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Attempt1 + attempt2 NHIỄM TẢI — KHÔNG CỘNG DỒN
  (xem §2b):** attempt1 B1 + B2 VI PHẠM (load1 max 5,29,
  load5 cuối 2,83; tickCost median 90,0 — vượt 60);
  attempt2 B2 VI PHẠM SÁT BIÊN (load1 max 4,02 — chỉ +0,02
  trên ngưỡng; tickCost median 57,0 vẫn ≤60 nhưng B2
  fail-closed nên không tính). Cả hai đều probe 20/20,
  (c2) 2/2 COVERED, P3' 2/2 DAT — nhưng verdict KHÔNG dùng.
- **Poller — 1 instance thật + 1 test, 18 poll, 3 lần cửa mở,
  trên 1 boot (không reboot).** Gate0: khong-dat 0 poll,
  T4-check-only 3 poll (+1 test), T5 14 poll (cờ T5-171 xuất
  hiện 14:52:09Z, trong lúc attempt1 chạy). RAM ≥1024: 18/18;
  RAM <500: **0/18**. load1<2: 9/17 (instance 2); load5<2:
  5/17; blockers>0: 3 poll (#4–#6 — vite :5560 + MiniBrowser
  của O8/T8, xem F-171-T4-1); apt>0: 0 poll; lock=co: 3 poll
  (#4–#6, T0 thread t0-round171 pid 24786 port 5560); dpkg
  1545→1545.
- **Chuỗi lượt yên hợp lệ: LÊN 35 (34 → 35).** Cộng dồn MỚI:
  P1 136/139, P2 130/130, P3-A1 118/139, **P3' 103/111
  occurrence = 93/96 distinct-seq**, P7 69/69. Chuỗi median
  tickCost 35 lượt: 39,0–60,0 ms, mean 48,3 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #39 (quyết (m) đợt 167):**
  ngưỡng gate A RAM ≥1024 MB, load1<2, load5<2, tickCost
  median ≤60 ms, lớp B 5/5, ngân sách 3 attempt/đợt, poll
  45 s — KHÔNG đổi ngưỡng/cadence nào. **Quyết parent (m)
  đợt 167 đã chốt: median đúng 60,0 mà lớp B sạch thì TÍNH
  ĐẠT (luật ≤60 giữ nguyên)** — poller đã cài `m<=60`;
  đợt này median 43,0 nên không cần áp dụng luật biên.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NÀO TRONG LÚC
  PROBE PASS CHẠY (wording MỚI theo F-170-T9-9 / quyết (h)
  đợt 170): TUÂN THỦ.** Trong cả 3 cửa sổ probe pass
  (attempt1 14:50:04–14:53:50Z; attempt2 15:02:43–15:06:12Z;
  attempt3 15:08:10–15:11:32Z), T4 không chạy script nào
  (poller đang chạy nền; agent chỉ chờ background delivery);
  mọi phân tích nặng (stats-171.py, helper distinct-seq-171
  back-test + live, p1p3p7 chạy tay, đọc analyzer) đều làm
  SAU khi attempt3 kết thúc (từ ~15:12:05Z). Các lần kiểm
  giữa chừng chỉ là đọc nhẹ `cat/grep/ps/free` (không phải
  script, không chạy python/analyzer): 14:54:40Z + 14:55:06Z
  (sau khi pass attempt1 kết thúc 14:53:50Z),
  15:04:17Z (giữa cửa sổ attempt2 — chỉ đọc), 15:11:06Z
  (giữa cửa sổ attempt3 — chỉ đọc). Pre-flight postboot
  check-only (14:47:5xZ) + test poll (14:48:09Z) chạy TRƯỚC
  khi mở poller, ngoài mọi cửa sổ attempt. Không chạy probe
  chạm dpkg nào trong cả phiên (chỉ đọc `wc -l` dpkg.log +
  `pgrep -x` — đọc, không chạm). Xem §0b + F-171-T4-5.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc mỗi attempt bắt đầu, lúc đóng — không đổi; mọi
  poll đều tree=YES).
- **Cờ:** `hidden_files/round171-t4.done` viết ~15:2xZ 22/11
  (trong hạn cờ ~17:00Z, sớm hơn ~1h40m), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1 + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4 + F-170-T4-1)

Chạy **trước mọi attempt, trước khi mở poller** (14:47–14:48Z),
ghi vào `hidden_files/round171-t4/preflight-171.txt` — **PASS**:

- **b.json CÓ trong `round171-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156–170 (F-158-T4-1/2 KHÔNG lặp lại).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–170. **vite.t4-temp.config.mjs md5
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
  `2026-11-22 16:30:00 UTC` → epoch **1795365000** =
  2026-11-22T16:30:00Z — khớp đúng hạn cắt poller 16:30Z
  (hạn cờ ~17:00Z = 1795366800, hạn cứng 17:30Z =
  1795368600); không còn sót dạng `13:30`/`14:00Z`/`14:30Z`
  nào trong script mới (grep 0 hit); grep `round170` trong mọi
  script làm việc chỉ còn fallback `round170-t5/` (có chủ đích,
  3 hit trong poll-wait); `t4-170` 0 hit; `WebKit #39` 0 hit
  (xem F-171-T4-7 về grep `round169` — đã đổi đúng).
- **Copy-forward đợt 170 → 171:** deadline poller `13:30Z`
  → `16:30Z` ở cả 3 dạng; hạn cờ/cứng trong comment
  `14:00Z`/`14:30Z` → `17:00Z`/`17:30Z`; `brief dot 170` →
  `brief dot 171`; `poll-test-170`/`stats-170`/
  `distinct-seq-170` → 171; T5FLAG chính `round171-t5/` +
  fallback `round170-t5/`; **W trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` ĐÃ LÀ `round171-t4` ngay sau copy**;
  `T4-170a` → `T4-171a` trong `run-attempt-171.sh`;
  `default=170` → `default=171` trong `distinct-seq-171.py`;
  `run-attempt-170.sh` → `run-attempt-171.sh` ở cả poll-wait
  (cả dòng gọi thật, dòng 269) lẫn comment; `WebKit #39` →
  `WebKit #40` trong run-attempt.
  **GREP BẮT ĐƯỢC 0 SÓT** (F-168-T4-1 không tái diễn —
  checklist bổ sung dạng giờ đầy đủ `HH:MM:00Z` + tên file
  `NNN.sh`/`NNN.log`/`NNN.py` đã áp dụng và cho 0 hit).
- **`cp -a` LẠI BÁO EPERM NHƯNG CLEANUP CHẠY VÔ ĐIỀU KIỆN
  (bài học F-170-T4-1 ĐÃ ÁP DỤNG):** `cp -a round170-t4
  round171-t4` báo `failed to preserve ownership` (EPERM)
  nhưng cleanup `rm` chạy KHÔNG chain `&&` nên vẫn chạy đủ
  (exit 0, thư mục sạch 22 file trước khi đổi tên script).
- **Freeze check (bài học F-164-T4-1):** thư mục `round170-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-22 14:35:51Z**
  (giờ mở đợt 171); `round169-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ: REPLAY ĐÃ XONG TRƯỚC KHI MỞ POLLER
  (KHÁC MẪU #79 đợt 170):** boot 2acdd1ab (btime 14:31:01Z,
  tuổi ~17m lúc mở), dpkg.log 1545 dòng lúc kiểm đầu (bằng
  đúng số cuối của boot #79); `/var/log/apt/history.log`
  CÓ, Start-Date cuối 14:37:42Z / End-Date 14:37:43Z
  (replay kết thúc 1m52s SAU giờ mở đợt 14:35:51Z nhưng
  TRƯỚC khi T4 mở poller 14:48:33Z); 0 process apt-get/dpkg
  lúc mở; cờ T5-171 CHƯA CÓ lúc mở (thư mục `round171-t5/`
  chưa tồn tại); cờ T5-170 chỉ ghi boot 5df1871f, mtime
  11:49:14Z < btime 14:31:01Z — KHÔNG tính cho boot mới;
  postboot check-only chạy tay **exit 0** (PASS — đủ 11 gói
  apt + GST 269, xem `preflight-postboot-171.log`); gate0
  lúc mở đi qua đường dự phòng T4-check-only cho tới khi cờ
  T5-171 xuất hiện (14:52:09Z, trong lúc attempt1 chạy).
- **Test poll (POLL_TEST=1): TEST-POLL-OK (exit 7 đúng thiết kế)** —
  poll #1 RAM 1525 MB (≥1024), load1 3,37/load5 1,61,
  gate0=T4-check-only (postboot exit 0, pb_age 0), apt=0,
  dpkg 1545 (xem `poll-test-171.log`).
  TEST-POLL-OK chỉ in ngay trước `exit 7` trong code nên
  dòng này trong log là bằng chứng exit 7.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (xem F-171-T4-7: `pgrep -f Xvfb` đếm 3 là self-match —
  dòng lệnh chứa chữ Xvfb; kiểm lại bằng `ps` + `ls`
  socket cho 0).
- **RAM lúc mở DAO ĐỘNG MẠNH (xem F-171-T4-9):** avail 748 MB
  lúc 14:44Z → 1699 MB lúc 14:47Z → 1525 MB lúc test poll
  14:48:09Z — do các luồng khác; poller vẫn mở được cửa khi
  RAM ≥1024 và load hạ.

## 1. Poller — 18 poll thật, 3 lần cửa mở, trên 1 boot (không reboot)

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 2acdd1ab
  (14:48:09Z):** poll #1 RAM=1525 MB (≥1024), load1=3,37
  load5=1,61, blockers=0, gate0=T4-check-only → cửa đóng
  (load1) → **TEST-POLL-OK exit 7 đúng thiết kế**. Poll
  này nằm trong `poll-test-171.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot 2acdd1ab, 17 poll (14:48:33–
  15:08:10Z), 3 lần cửa mở:** RAM ≥1024: 17/17 (min 1318,
  max 3242 MB); 500–1023: 0/17; **<500: 0/17**;
  load1<2: 9/17; load5<2: 5/17; gate0: **khong-dat 0,
  T4-check-only 3, T5 14**; lock=co 3/17; dpkg 1545→1545;
  blockers>0: 3 poll (#4–#6); apt>0: 0 poll.
- **Giai đoạn 1 — chờ cửa attempt1 (poll #1–#3, 14:48:33–
  14:50:04Z):** gate0=T4-check-only suốt giai đoạn (cờ T5-171
  chưa có); load1 2,28/2,45 chặn cửa ở #1/#2; poll #3
  load1 1,92/load5 1,59, RAM 1318 MB → **CỬA MỞ, chạy
  attempt1** → NHIỄM TẢI (B1+B2 vi phạm) → retry.
- **Giai đoạn 2 — chờ cửa attempt2 (poll #4–#14, 14:55:10–
  15:02:43Z):** gate0=T5 từ poll #4 (cờ T5-171 viết
  14:52:09Z, trong lúc attempt1 chạy); load1 vọt 9,11 (#4)
  → 0,19 (#14), load5 4,55→1,80; blockers=5/5/1 ở #4/#5/#6
  (vite :5560 + MiniBrowser/WebKit của O8/T8 — xem
  F-171-T4-1); lock=co 3 poll (#4–#6, T0 thread t0-round171
  pid 24786 port 5560); poll #10–#13 load1 <1 nhưng load5
  3,17→2,06 chặn cửa; poll #14 load1 0,19/load5 1,80,
  RAM 1798 MB → **CỬA MỞ, chạy attempt2** → NHIỄM TẢI
  (B2 vi phạm sát biên) → retry.
- **Giai đoạn 3 — chờ cửa attempt3 (poll #15–#17, 15:06:40–
  15:08:10Z):** load1 1,50/1,39/1,61, load5 2,11/2,00/1,99,
  RAM 2974/2962/2825 MB, gate0=T5, lock=khong, blockers=0;
  poll #17 load1 1,61/load5 1,99, RAM 2825 MB →
  **CỬA MỞ, chạy attempt3** → HỢP LỆ → poller thoát
  15:12:00Z vì LUOT HOP LE.
- **Phân rã 18 poll thật:** RAM≥1024: 18/18; RAM 500–1023:
  0/18; RAM<500: **0/18**. load1<2: 9/18; load5<2: 6/18.
  3 poll mà load + RAM cùng đạt — chính là 3 poll mở cửa
  thật (#3, #14, #17); **stats "gan-mo" đếm 3 = mở cửa thật
  3 — KHÔNG lệch gan-mo/mở-cửa** (cùng mẫu đợt 170).
  gate0: T5 14 poll, T4-check-only 4 poll (3 instance 2 + 1
  test), khong-dat 0 poll. blockers>0: 3 poll. apt>0: 0 poll.
  **RAM <500 MB: 0/18 poll** — SẠCH, lần thứ tư liên tiếp
  (đợt 168: 0/26, đợt 169: 0/13, đợt 170: 0/22). Ghi nhận để
  T9-171 đối chiếu headroom/balloon trên boot mới.

## 2. Attempt3 HỢP LỆ — lượt yên #40

- **Attempt3-2acdd1ab (15:08:10–15:12:00Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 43,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2895–3301 ms/pass): tickCost n=623, blendTick n=507
  (tBlend gap n=506), c2DrawLog n=1209.
  **tickCost total median= 43,0 ms (p90 68,8, max 167, min 27)**
  — DƯỚI NGƯỠNG 17,0 ms; hậu flip+2000 ms median 44,0.
  Per-pass median 38,0–53,0 ms (pass 2: 53,0; pass 1: 38,0)
  trong khi load1 mean/pass 1,69→2,96 và RAM mean/pass
  GIẢM 2650→2416 MB (tương quan Pearson median~load1
  r=-0,27, median~RAM r=0,44 — không đáng kể, không kết
  luận nhân quả từ 1 lượt; xem F-171-T4-4).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,99 ≤2,5 ĐẠT;
  B2 load1 max 3,04 ≤4 ĐẠT — sampler n=100 dòng (1 header
  + 99 mẫu, xem F-168-T4-7); B3 không reboot ĐẠT; B4
  pgrep -x=0, ps exact-comm=0, dpkg delta=0 (1545→1545)
  ĐẠT; B5 RAM min 2416 MB, 0 mẫu <500 MB, **0/100 mẫu
  <1024 MB** — sạch hoàn toàn — ĐẠT).
  **(c2)=4** (seq 153, 249, 377, 433 — cả 4 COVERED, delta
  +35/−28/−21/+33 ms; blendTick hậu-flip 374/374 trong
  ±500 ms của log) — ĐÃ CỘNG DỒN.
  P3' 4/4 DAT (stall 5/6/5/4). lag≥+5f (b) = **6 occurrence**
  (2 events, seq 458–461, max +7f — KHÔNG phải (c2), xem
  F-171-T4-3).
  **p1p3p7 chạy TAY (F-148-T4-1): P1 ĐÚNG 4/4** (cả 4 seq gần
  run-end [153, 249, 377, 433 trong 14 run_end seqs],
  baseline 42/374, p=0,000159042 <0,01, n=4);
  **P2 ĐÚNG 4/4** (lag +1f ×4; 0 lag âm);
  **P3-A1 ĐÚNG 4/4** (4/4 đóng băng-tại-tick; baseline
  82/373, p=0,00233572 <0,01);
  **P7 ĐÚNG** (0/46 entry trễ ≥+1f cho 4 seq; đối chứng
  toàn bộ drawSrc post 0/456).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.352.912 B (md5
  `3f71f97f9fef0e81d06e9e6f64f6cb7c`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0, engine
  webkit 27.2, gstPluginPath hệ thống.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=69 tick
  skippedLatest=1 hậu flip+2000ms, bar ≥30; (1) 100%,
  (2) 100%).
  **Attempt này ĐƯỢC CỘNG DỒN** (lượt hợp lệ — theo quy ước
  đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Lưu ý 2/4 seq MỚI (249, 433); 2 seq ĐÃ THẤY (153, 377):**
  153 đã DAT đợt 158, 377 đã DAT đợt 153 — không cộng thêm
  distinct; 249 + 433 mới vào sổ (xem §7); không seq nào
  KHÔNG DAT cũ chuyển thành DAT đợt này (non_dat_in_union
  [283, 364, 498] không đổi).

## 2b. Attempt1 + attempt2 NHIỄM TẢI — KHÔNG CỘNG DỒN

- **Attempt1-2acdd1ab (14:50:04–14:55:10Z): probe 20/20 NHƯNG
  LỚP B VI PHẠM — B1 + B2.** tickCost median **90,0 ms**
  (n=379, p90 161,4, max 270, min 30) — VƯỢT ngưỡng 60;
  hậu flip+2000ms median 88,0. B1 VI PHẠM (load5 cuối 2,83
  > 2,5); B2 VI PHẠM (load1 max 5,29 > 4 — sampler n=109);
  B3 ĐẠT (không reboot); B4 ĐẠT (pgrep -x=0, ps
  exact-comm=0, dpkg delta=0); B5 ĐẠT (RAM min 900 MB,
  0 mẫu <500 MB; ghi nhận 14/109 mẫu <1024 MB). Load lúc
  start 1,92 → inner-end 5,83 → run-attempt exit 6,03.
  (c2)=2 [235, 262] COVERED (delta −23/+21 ms), P3' 2/2 DAT
  (stall 3/7) — **KHÔNG CỘNG DỒN** (attempt nhiễm tải).
  JSON 2.243.155 B, passes=20, pageErrs=[] — probe không
  wedged; chỉ tải hệ thống làm chậm tick (n=379 tick so với
  623 tick ở attempt3 sạch — cùng wall/pass ~3,7s).
  Nguyên nhân tải: suite T6 (`test-vite-lock-v2.sh` ×6,
  pid 8295/21557) + render `mask_anim.py` (pid 23839) +
  vite :5560 + clicktest O8 của T8 (xem F-171-T4-1).
- **Attempt2-2acdd1ab (15:02:43–15:06:40Z): probe 20/20 NHƯNG
  LỚP B VI PHẠM — B2 SÁT BIÊN.** tickCost median **57,0 ms**
  (n=548, p90 84,0, max 151, min 28) — vẫn ≤60 nhưng B2
  fail-closed nên không tính. B1 ĐẠT (load5 cuối 2,10);
  B2 VI PHẠM (load1 max **4,02** — chỉ +0,02 trên ngưỡng 4;
  sampler n=103); B3 ĐẠT; B4 ĐẠT (delta=0); B5 ĐẠT (RAM min
  757 MB, 0 mẫu <500 MB; ghi nhận 35/103 mẫu <1024 MB).
  Load lúc start 0,19 → inner-end 1,07 — spike load1 lên
  4,02 là thoáng qua giữa lượt. (c2)=2 [148, 324] COVERED
  (delta −21/+20 ms), P3' 2/2 DAT (stall — xem file stall)
  — **KHÔNG CỘNG DỒN**. Nguyên nhân tải ứng viên duy nhất:
  `hole-recheck9696.py` của T2 (pid 44023/44025) trong
  ps-before/after (xem F-171-T4-2 — không khẳng định nhân
  quả tuyệt đối, chỉ ghi ứng viên duy nhất thấy được).
- **Ngân sách dùng 3/3.** Không còn retry sau attempt3
  (không cần — attempt3 hợp lệ).

## 3. B2 spike trong cửa sổ attempt (theo nhiệm vụ đợt 171)

- **Attempt1 (14:50:04–14:53:50Z) — SPIKE NẶNG: load1 max
  5,29, load5 cuối 2,83, RAM min 900 MB.** Trong
  ps-before/after: suite T6 (test-vite-lock-v2.sh ×6),
  `mask_anim.py` render 1280×720 60s, vite :5560 + clicktest
  O8 của T8, lock acquire của T0 (t0-round171). Load1 lúc
  start 1,92 → 5,83 lúc inner-end. tickCost median 90,0 —
  nhiễm tải rõ rệt. **Kết luận: cửa sổ attempt1 nhiễm tải
  nặng từ các luồng khác — retry là đúng.**
- **Attempt2 (15:02:43–15:06:12Z) — SPIKE NHẸ SÁT BIÊN:
  load1 max 4,02, RAM min 757 MB.** Trong ps-before/after
  chỉ có vite của chính attempt + `hole-recheck9696.py`
  của T2 (pid 44023/44025) là process nặng duy nhất của
  luồng khác; không còn T6 suite hay render nào khác.
  tickCost median 57,0 vẫn ≤60 — spike chỉ vừa đủ phá B2.
  **Kết luận: cửa sổ attempt2 nhiễm tải nhẹ, sát biên —
  retry là đúng theo luật fail-closed (B2 ≤4 cứng).**
- **Attempt3 (15:08:10–15:11:32Z) — KHÔNG SPIKE: load1 max
  3,04 (≤4), RAM min 2416 MB.** Trong ps-before/after chỉ có
  vite của chính attempt + `m56-171.py` của T2 (pid
  46661/46662, xuất hiện ở ps-after — chạy trong/cuối cửa sổ
  nhưng load vẫn ≤3,04, B2 ĐẠT). Delta tick max: tBlend gap
  max 1681 ms; tickCost max 167 ms.
  **Kết luận: cửa sổ attempt3 hợp lệ sạch — đúng kỳ vọng.**
- **Ngoài cửa sổ attempt:** poll #4 (14:55:10Z) load1 9,11,
  blockers=5 (vite :5560 + MiniBrowser/WebKit của O8);
  poll #5–#6 load1 7,29/6,53, lock T0 :5560 — KHÔNG tính là
  B2 spike trong cửa sổ attempt; chỉ ghi nhận là tải các
  luồng khác trong lúc chờ retry.

## 4. Replay/postboot trên boot mới — cờ T5-171 ĐÃ CÓ (14:52:09Z); không reboot giữa phiên

- **Boot 2acdd1ab (btime 14:31:01Z, số hiệu giao T0-171 xác
  minh — ứng viên #80): replay ĐÃ XONG TRƯỚC KHI MỞ POLLER.**
  Lúc T4 mở (14:47Z): dpkg.log 1545 dòng, `/var/log/apt/`
  đã có history.log, postboot check-only exit 0 — KHÔNG phải
  mẫu replay-chạy-trong-phiên như boot #79 đợt 170. Replay
  os-intent kết thúc 14:37:43Z (Install gstreamer1.0-tools),
  tức 1m52s sau giờ mở đợt 14:35:51Z nhưng TRƯỚC khi T4 mở
  poller 14:48:33Z. dpkg 1545 dòng ổn định cả phiên
  (1545→1545, 0 poll apt>0).
  **T5-171: POSTBOOT_PASS mới viết 14:52:09Z
  (boot+21m08s; dpkg 1545 dòng; cache 178 .deb; lists 37;
  postboot PASS poll=0 độc lập exit 0; replay-đầy-đủ; cờ cũ
  5df1871f lưu POSTBOOT_PASS-5df1871f).** Gate0=T5 từ poll
  #4 (14:55:10Z); attempt2 + attempt3 mở cửa qua đường (a)
  chuẩn; attempt1 mở cửa qua đường dự phòng T4-check-only
  (cờ T5 chưa có lúc đó — đúng luật (quyết (j) đợt 143:
  check-only chỉ là đường dự phòng khi cờ T5 chưa có; khi
  cờ T5 đã có thì đường (a) là chính).
  **Watcher-171 của T5 ĐANG CHẠY lúc T4 đóng** (pid 28156,
  `replay-watch-171.sh` — kiểm lúc ~15:19Z).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:**
  boot 2acdd1ab lúc poller khởi động (14:48:33Z), lúc cả 3
  attempt, lúc poller thoát (15:12:00Z) và lúc kiểm cuối
  (~15:19Z) — btime 14:31:01Z không đổi; 0 dòng REBOOT
  PHAT HIEN trong poll log.
- **Reboot MỚI TRƯỚC KHI MỞ (btime 14:31:01Z, boot 2acdd1ab):**
  đợt mở 14:35:51Z — boot mới hơn giờ mở 4m50s. Số hiệu
  (#80?) + xác minh 9 nguồn giao T0-171; **lưu ý mốc giờ:**
  T10-170 ghi boot lúc đóng vẫn là 5df1871f ~14:2xZ, trong
  khi btime boot mới là 14:31:01Z — T0-171 phải đối chiếu kỹ
  mốc giờ (có thể T10-170 kiểm boot trước 14:31:01Z rồi mới
  đóng sổ sau đó — cùng mẫu lưu ý đợt 170 về #79). T4 không
  thấy poll nào trên boot cũ trong phiên này (poller mở sau
  reboot).
  Mù #96?/#95?/#94?/#88?/#77?/#78? giao T2-171 — T4 không tự mở mù.
- **85m4 / 86n2 / 84l10: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Đây là verdict của harness T8, T4 không đo và không suy
  đoán — giao T8-171 báo cáo. (T4 chỉ ghi: 0 kẹt quan sát
  được trong attempt của mình; probe không wedged.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND171_T4_WEBKIT_QUIET40_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round171-t4/`):**
  `poll-wait-t4-171.sh` (md5 `13a4dd28c01c718f2f99320ef14674a2`;
  deadline 16:30Z 22/11 + cờ T5 round171-t5/ + fallback round170-t5/
  + nhãn T4-171a),
  `run-attempt-171.sh` (md5 `4d21e5fa70525c4b66c4a6ddb0b4827d`;
  đổi số vòng/đường dẫn/nhãn so với 170, lượt yên #40),
  `distinct-seq-171.py` (md5 `6d5b36f1cfb2b84f56423925a1ee3e22`;
  đợt này ĐÃ DÙNG LIVE trên attempt hợp lệ — khi chạy từ
  `apps/web/scripts/` phải truyền `--ledger` trỏ tới sổ vì sổ
  không nằm cùng thư mục — nếu không, helper lỗi
  FileNotFoundError thay vì in số sai, xem §7).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–170, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round171-t4/` — theo đúng mẫu 149–170: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round171-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–170).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-171.sh`, `run-attempt-171.sh`,
  `t4-attempt-inner.sh` (W = round171-t4 + glob check nhiễu
  chéo round171-*), `check-classb-t4.sh` (W = round171-t4),
  10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-171.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn 35 lượt — P1 136/139, P2
  130/130, P3-A1 118/139, P3' 103/111 = 93/96, P7 69/69;
  chuỗi median n=35 mean 48,3 — xem F-171-T4-5),
  `distinct-seq-171.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-171: 93/96 distinct, occ 103/111, valid_rounds_p3 23,
  non_dat_in_union [283, 364, 498], md5
  `82e59e580aa16632547207ab7eab09d0` — nguồn thật cho T4-172),
  `distinct-seq-ledger-171-proposed.json` (bản helper ghi ra
  trong live — giống hệt sổ đã thăng cấp, giữ làm audit
  trail),
  `distinct-seq-ledger-171-backtest170-proposed.json` (bản
  helper ghi ra trong back-test — nội dung KHỚP HỆT sổ
  as-of-170 gốc, md5 `63c0b5a9...`, giữ làm audit trail),
  `distinct-seq-171-backtest170.txt` (output helper back-test —
  KHỚP live 170),
  `distinct-seq-171-live.txt` (output helper live trên
  attempt3-2acdd1ab),
  `preflight-171.txt` + `preflight-postboot-171.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1
  + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4 + F-170-T4-1).
- **Log/evidence (hidden_files/round171-t4/, không stage):**
  `poll-t4.log` (17 poll instance 2 + CUA YEN MO ×3 + LUOT
  HOP LE ×1, 0 REBOOT PHAT HIEN),
  `poll-test-171.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`,
  `postboot-t4-171-gate0wait-*.log` (check-only các poll
  #1/#5/#9/#13/#17),
  `stats-171-output.txt` (output stats-171.py),
  `preview-b-f3-flip-webkit-t4-attempt1-2acdd1ab.json`
  (2.243.155 B, 20/20, nhiễm tải — KHÔNG cộng dồn)
  + `preview-b-f3-flip-webkit-t4-attempt2-2acdd1ab.json`
  (20/20, nhiễm tải sát biên — KHÔNG cộng dồn)
  + `preview-b-f3-flip-webkit-t4-attempt3-2acdd1ab.json`
  (3.352.912 B, 20/20, md5
  `3f71f97f9fef0e81d06e9e6f64f6cb7c`)
  + `run-webkit-t4-attempt*-2acdd1ab.log`
  + `load-mid-t4-attempt*-2acdd1ab.log`
  + `ps-before/after-t4-attempt*-2acdd1ab.txt`
  + `classb-t4-attempt*-2acdd1ab.txt` (attempt1: LOP-B-TONG
  VI PHAM B1+B2; attempt2: VI PHAM B2; attempt3: LOP-B-TONG
  DAT 5/5)
  + `analyze-t4-attempt*-2acdd1ab-*.txt` (11 file/attempt,
  gồm p1p3p7 chạy tay cho attempt3 — xem F-148-T4-1)
  + `coverage-check-attempt*-2acdd1ab.txt` ((c2) attempt1
  2/2, attempt2 2/2, attempt3 4/4)
  + `attempt-done-attempt*-2acdd1ab` (3 file, exit 0).
  `vite-5187-t4-attempt*-2acdd1ab.log` (vite log mỗi attempt)
  + `stop-sampler-t4-attempt*-2acdd1ab` (marker) +
  `dpkg-lines-before-*` + `apt-history-before-*` (B4 baseline
  mỗi attempt) + `marker-t4-attempt*-2acdd1ab` (marker) +
  `blockers-ps-4/5/6.txt` + `blockers-list-4/5/6.txt`
  (blocker poll #4–#6, xem F-171-T4-1).
  (`analyze-l7-labellag.txt` + `lag5-detail.txt` là file phụ
  analyzer tự ghi lại trong lúc chạy — có mặt từ các đợt
  trước, không stage.)
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§5); không process T4 nào còn sống lúc đóng
  (poller đã thoát 15:12:00Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000;
  `/tmp/.X11-unix/` còn X194/X195/X196 của suite luồng khác —
  X193 của attempt đã dọn tay, xem §6 F-171-T4-6).

## 6. Sai số F-171-T4-1..10 (+ nợ cũ)

- **F-171-T4-1 — ATTEMPT1 NHIỄM TẢI NẶNG: SUITE T6 + RENDER
  mask_anim + O8/T8 CHẠY CHỒNG LÊN CỬA SỔ ATTEMPT (lỗi
  phối hợp lịch các luồng, không phải lỗi T4).**
  Trong cửa sổ attempt1 (14:50:04–14:53:50Z): suite T6
  (`test-vite-lock-v2.sh` ×6, pid 8295/21557), render
  `mask_anim.py` 1280×720 60s (pid 23839), vite :5560 +
  clicktest-87o8-mask-track-webkit + MiniBrowser/WebKit của
  T8, lock acquire của T0 (pid 24808). Load1 1,92 → 5,83;
  tickCost median 90,0 (vượt 60); B1 + B2 cùng vi phạm.
  Poll #4–#6 sau đó cũng blockers=5 (cùng nhóm O8) +
  lock T0 :5560. Retry là đúng; attempt3 sạch sau khi các
  luồng khác yên. Ghi nhận để T10/T1 đối chiếu lịch chạy
  suite/render trong cửa sổ 14:50–14:55Z.
- **F-171-T4-2 — ATTEMPT2 B2 VI PHẠM SÁT BIÊN (load1 max
  4,02 — CHỈ +0,02): ỨNG VIÊN DUY NHẤT LÀ hole-recheck CỦA
  T2.** Trong ps-before/after attempt2 chỉ có vite của chính
  attempt + `hole-recheck9696.py` của T2 (pid 44023/44025)
  là process nặng duy nhất của luồng khác. Không khẳng định
  nhân quả tuyệt đối (sampler không gắn timestamp từng mẫu
  với pid), chỉ ghi ứng viên duy nhất thấy được. Luật
  fail-closed B2 ≤4 cứng — retry là đúng dù tickCost 57,0
  vẫn ≤60.
- **F-171-T4-3 — lag≥+5f (b) = 6 OCCURRENCE TRONG ATTEMPT3
  HỢP LỆ (2 events, seq 458–461, max +7f) — KHÔNG PHẢI
  (c2), KHÔNG ẢNH HƯỞNG VERDICT P2.** Labellag (a)/(b):
  >=5f: 6 (phân phối lag {'0': 159, '<0': 52, '1-2': 326,
  '3-4': 67, '5-9': 6}); lag5 (b) liệt kê 6 occurrence
  thành 2 events (M=17: 2 occ, lag max +5f; M=21: 4 occ,
  lag max +7f). Cả 6 đều là strip match mờ (a)/(b) — không
  có strip nào trong số đó thuộc (c2) dang-ngo-that; P2
  vẫn ĐÚNG 4/4 trên (c2) (lag +1f ×4). Đợt 170: (b) = 0
  occurrence — đợt này 6 là tăng, ghi nhận để theo dõi,
  không mở điều tra (chỉ giám sát thụ động theo quyết
  parent đợt 137).
- **F-171-T4-4 — LOAD1 MEAN/PASS TĂNG 1,69→2,96 + RAM
  MEAN/PASS GIẢM 2650→2416 MB TRONG LÚC ĐO HỢP LỆ (cùng họ
  F-170-T4-4, nhẹ hơn; r không đáng kể).** Per-pass load1
  mean: pass 1: 1,69 → pass 19: 3,04 (tăng gần đơn điệu rồi
  giữ ~2,9); RAM mean/pass giảm 2650→2416 MB (r=-0,27 /
  0,44 — không đáng kể). `ps-before/after` attempt3 chỉ thấy
  vite của chính attempt + `m56-171.py` của T2 (pid
  46661/46662, xuất hiện ở ps-after); ngoài cửa sổ có T9
  sampler + T2 hole-recheck/m56 + T8 waiter đang chạy. B2
  ĐẠT theo load (max 3,04 ≤ 4) là chính; tickCost median
  43,0 vẫn dưới ngưỡng 17,0 ms. Ghi nhận, không kết luận
  nhân quả từ 1 lượt.
- **F-171-T4-5 — WORDING F-170-T9-9 ĐÃ SỬA + TUÂN THỦ LUẬT
  KHÔNG CHẠY SCRIPT TRONG LÚC PROBE PASS CHẠY (ghi rõ để
  T10 kiểm).** Từ đợt này LIMITS T4 dùng đúng câu chữ mới:
  "không chạy script nào trong lúc probe pass chạy" (thay
  cho câu cũ "không chạy script phân tích nặng trong cửa sổ
  attempt" — quyết (h) đợt 170). Tuân thủ đợt này:
  trong 3 cửa sổ probe pass (A1 14:50:04–14:53:50Z; A2
  15:02:43–15:06:12Z; A3 15:08:10–15:11:32Z), T4 không chạy
  script nào (poller đang chạy nền; agent chỉ chờ background
  delivery). Phân tích nặng làm SAU khi attempt3 kết thúc
  (từ ~15:12:05Z: stats-171.py, helper distinct-seq-171
  back-test + live, p1p3p7 chạy tay, đọc analyzer) hoặc
  GIỮA các attempt (đọc output attempt1 lúc 14:58:58Z —
  sau khi run-attempt A1 đã exit 14:53:57Z, trước khi A2 mở
  15:02:43Z). Các lần kiểm giữa chừng chỉ là đọc nhẹ
  `cat/grep/ps/free` (không phải script, không chạy
  python/analyzer): 14:54:40Z + 14:55:06Z (sau khi pass A1
  kết thúc 14:53:50Z), 15:04:17Z (giữa cửa sổ A2),
  15:11:06Z (giữa cửa sổ A3). Pre-flight postboot
  check-only (14:47:5xZ) + test poll (14:48:09Z) chạy trước
  poller, ngoài mọi cửa sổ attempt. Không chạy probe chạm
  dpkg nào trong cả phiên (chỉ đọc `wc -l` dpkg.log +
  `pgrep -x`). Không có vi phạm.
- **F-171-T4-6 — X11 4 SOCKET LÚC ĐÓNG; X193 CỦA T4 ĐÃ DỌN
  TAY, X194/X195/X196 CỦA SUITE LUỒNG KHÁC ĐỂ T8 DỌN (cùng
  mẫu F-170-T4-6, lần thứ năm liên tiếp cùng 3 số display
  194/195 + thêm 196).** Sau khi poller thoát,
  `/tmp/.X11-unix/` còn X193 (mtime 15:08Z — đúng lúc
  attempt3 mở Xvfb :193), X194 + X195 + X196 (mtime 14:51Z
  — trong cửa sổ attempt1, của suite luồng khác, khớp thời
  gian O8 clicktest). 0 Xvfb còn chạy. T4 đã dọn tay socket
  X193 (rm -f); kiểm lại còn X194/X195/X196 lúc đóng — giao
  T8-171 dọn.
- **F-171-T4-7 — PRE-FLIGHT `pgrep -f Xvfb` ĐẾM 3 LÀ
  SELF-MATCH (lỗi nhỏ của chính T4 trong lúc kiểm, 0 thiệt
  hại).** Lệnh kiểm `pgrep -f Xvfb | wc -l` trả 3 vì dòng
  lệnh bash -c chứa chữ "Xvfb" nên tự khớp chính nó (+ các
  tiến trình con). Kiểm lại bằng `ps -eo args | grep Xvfb`
  + `ls /tmp/.X11-unix/` cho 0 Xvfb thật, socket TRỐNG.
  **Bài học đứng mới:** không dùng `pgrep -f` với từ khóa
  trùng tên trong chính dòng lệnh kiểm; kiểm Xvfb bằng
  `ps` + `ls` socket (cùng họ F-169-T4-4 về pgrep tự khớp).
- **F-171-T4-8 — REPLAY ĐÃ XONG TRƯỚC KHI MỞ POLLER (KHÁC
  MẪU #79 ĐỢT 170 — KHÔNG PHẢI SAI SỐ, CHỈ GHI NHẬN MẪU
  MỚI).** Trên boot mới 2acdd1ab, replay os-intent kết thúc
  14:37:43Z — sau giờ mở đợt 14:35:51Z 1m52s nhưng trước khi
  T4 mở poller 14:48:33Z; dpkg.log 1545 dòng đã ổn định từ
  lúc kiểm đầu; postboot check-only exit 0 ngay ở pre-flight.
  Gate0 lúc mở đi qua đường dự phòng T4-check-only 3 poll
  rồi chuyển sang đường (a) T5 khi cờ T5-171 xuất hiện
  14:52:09Z — đúng luật (j) đợt 143. Không có poll nào bị
  apt chặn (apt>0: 0 poll cả phiên).
- **F-171-T4-9 — RAM AVAIL DAO ĐỘNG MẠNH LÚC MỞ (748 MB LÚC
  14:44Z → 1699 MB LÚC 14:47Z → 1525 MB LÚC TEST POLL).**
  Lúc 14:44Z `free` báo avail 748 MB (<1024 — gate A RAM
  sẽ FAIL nếu poll lúc đó); 3 phút sau đã lên 1699 MB; test
  poll 14:48:09Z: 1525 MB. Nguyên nhân: các luồng khác
  (node test pid 9470, ffmpeg pid 10544, test-vite-lock-v2
  pid 8298) đang chạy lúc đó. Poller mở 14:48:33Z gặp RAM
  1473 MB — đủ ngưỡng. Ghi nhận: RAM avail không ổn định
  lúc mở đợt, poller 45s/lần vẫn bắt được cửa khi tải hạ.
- **F-171-T4-10 — ATTEMPT3 ps-after CÓ `m56-171.py` CỦA T2
  (ghi nhận, KHÔNG vi phạm).** `m56-171.py` (pid 46661/46662)
  xuất hiện ở ps-after attempt3 (chạy trong/cuối cửa sổ
  attempt3) nhưng load1 max vẫn 3,04 ≤4, B2 ĐẠT, tickCost
  median 43,0 sạch. Ghi nhận để T2 đối chiếu mốc giờ m56
  (không kết luận chồng lấn gây nhiễu — số đo sạch).
- **F-170-T4-1 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  `cp -a` vẫn báo EPERM nhưng cleanup chạy vô điều kiện
  (không chain `&&`) nên thư mục làm việc sạch đúng 22 file
  trước khi đổi tên script.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này (có attempt hợp lệ để
  chạy p1p3p7 tay).** p1p3p7 chạy tay đúng form
  (`$JSON "153,249,377,433"`, exit 0) — xem §2.
  Nợ đứng ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn —
  mỗi đợt có attempt hợp lệ T4 phải chạy tay và ghi rõ.

## 7. P3' cộng dồn (MỚI — 35 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 171 (MỚI): P1 136/139, P2 130/130,
  P3-A1 118/139, P3' 103/111 occurrence = 93/96 distinct-seq,
  P7 69/69** (35 lượt hợp lệ — #40 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 170 §6: "34 lượt hợp lệ" — nay 35). Attempt1/2
  nhiễm tải KHÔNG cộng (dù (c2) 2/2 + P3' 2/2 DAT).
- **Đóng góp lượt #40 (attempt3-2acdd1ab, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=4 occurrence / 4 distinct-seq [153, 249, 377, 433],
  trong đó 2 seq MỚI [249, 433].
  - **P1 — ĐÚNG 4/4 occ** (cả 4 seq gần run-end: trong 14
    run_end seqs; baseline 42/374, p=0,000159042 trên distinct
    4/4 — verdict ĐÚNG theo luật DEF §3 vì n=4 ≥3 và p<0,01).
    Cộng dồn 132/135 → **136/139**.
  - **P2 ĐÚNG — 4/4 occ** (lag +1f ×4; 0 lag âm). Cộng dồn
    126/126 → **130/130**.
  - **P3-A1 — ĐÚNG 4/4 occ** (4/4 seq đóng băng-tại-tick;
    baseline 82/373, p=0,00233572 — verdict ĐÚNG theo luật
    DEF §5 vì 4/4 ≥2/3 VÀ p<0,01). Cộng dồn 114/135 →
    **118/139**.
  - **P3' 4/4 occ ĐẠT** (153 stall 5, 249 stall 6, 377 stall 5,
    433 stall 4). Cộng dồn 91/94 → **93/96 distinct** (2 seq
    MỚI — 249, 433); occurrence 99/107 → **103/111**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 22, 0: 24}; đối chứng toàn bộ drawSrc post: {-1: 303,
    0: 153}, 0/456 entry). Cộng dồn 68/68 → **69/69**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–170).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-171.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 170: 91/94 distinct, occ 99/107), tính seq MỚI =
  tập hiệu với sổ, in cộng dồn mới distinct + occurrence,
  ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-171-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Back-test trước live (xem F-169-T4-2):** helper-171 trên
  stall + c2coverage attempt1-170 với sổ as-of-169 (bản
  backtest169-proposed đợt 170 — nội dung bằng sổ as-of-169
  gốc) → ra 91/94 distinct, 99/107 occ — khớp hệt live 170;
  bản proposed của back-test KHỚP HỆT sổ as-of-170 gốc
  (dict bằng nhau, md5 `63c0b5a9...`, so sánh bằng nhau).
  Helper ĐÃ ĐƯỢC KIỂM CHỨNG trước live.
  **Live đợt 171:** sổ + stall/c2coverage
  attempt3-2acdd1ab → **93/96 distinct, 103/111 occ** — khớp
  tính tay độc lập dưới đây. Sổ đã thăng cấp: as-of 171,
  93/96 distinct, occ 103/111, valid_rounds_p3 23,
  non_dat_in_union [283, 364, 498] (KHÔNG đổi — không seq
  không-DAT cũ nào DAT thêm đợt này; md5 sổ mới
  `82e59e580aa16632547207ab7eab09d0`).
- **Kiểm chứng seq 153/249/377/433 đợt 171:**
  helper (đọc sổ) xác nhận **249 + 433 MỚI** (chưa có trong
  sổ — seen_c2 94 seq VÀ seen_dat 91 seq đều không chứa
  249/433); **153 + 377 ĐÃ THẤY** (153 DAT đợt 158, 377 DAT
  đợt 153). Tính tay: distinct DAT 91 + 2 = **93**; distinct
  tổng 94 + 2 = **96**; occurrence 99 + 4 = **103**,
  107 + 4 = **111**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — và được củng cố:** lượt hợp lệ mới
  (4 occ, 2 seq mới) có P1 ĐÚNG 4/4 (p~1,6e-04) + P3-A1 ĐÚNG
  4/4 (p~2,3e-03) — cả hai phép thử nghiêm ngặt đều ĐÚNG đợt
  này; P3' prereg (stall) DAT 4/4. Wedge không xảy ra đợt
  này (0 wedge — chuỗi 0-wedge tiếp tục từ đợt 169).
- Chuỗi median tickCost 35 lượt (mới): 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 /
  59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 /
  60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 /
  53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 / 40,0 / **43,0 ms**
  (trung bình 48,3 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại (chỉ ghi nhận mẫu
  lag (c2) đều +1f ở F-171-T4-3 là nhất quán).

## 8. Chờ quyết parent / nợ đợt 172

- **(a) #40 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 35.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT đợt
  này** — attempt3-2acdd1ab hợp lệ trên boot 2acdd1ab (btime
  14:31:01Z, boot đo lúc mở); gate mở 15:08:10Z qua đường (a)
  chuẩn (cờ T5 PASS 14:52:09Z). O8 chạy trên boot nào, có qua
  gate chuẩn hay phải dùng thủ tục (i), là do T8/T10 quyết;
  T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
  Lưu ý: waiter của T8 đang chờ cờ T4 (cùng mẫu đợt 170) —
  cờ `.done` viết ~15:2xZ, trong hạn cờ ~17:00Z.
- **(b) P3' cộng dồn MỚI 35 lượt: P1 136/139, P2 130/130,
  P3-A1 118/139, P3' 103/111 = 93/96, P7 69/69:** helper đã
  chạy live (back-test khớp live 170); sổ
  distinct-seq-ledger.json đã thăng cấp as-of-171 (93/96
  distinct, occ 103/111, valid_rounds_p3 23, non_dat [283, 364,
  498]). **Chờ parent/T10 quyết:** ghi nhận cộng dồn mới.
  T10 kiểm lại phép cộng khi viết aggregate (§12).
- **(c) REBOOT MỚI TRƯỚC KHI MỞ (btime 14:31:01Z, boot
  2acdd1ab — ứng viên #80) — giao T0-171 xác minh số hiệu +
  9 nguồn; giao T7-171/T2-171 kiểm tra run 170 có bị viết lại
  tại reboot này không + (m) cho reboot mới.** Dữ kiện T4:
  btime 14:31:01Z; đợt mở 14:35:51Z (boot mới hơn giờ mở
  4m50s); poller mở sau reboot nên không có poll nào trên
  boot cũ trong phiên này; 0 reboot trong phiên. **Lưu ý mốc
  giờ:** T10-170 ghi boot lúc đóng vẫn là 5df1871f ~14:2xZ —
  T0-171 đối chiếu kỹ (btime 14:31:01Z < ~14:2xZ).
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1/F-167-T4-1/F-168-T4-1/F-169-T4-1/3/4/F-170-T4-1
  TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc đứng, BỔ
  SUNG 2 MỤC:** không dùng `pgrep -f` với từ khóa trùng tên
  trong chính dòng lệnh kiểm (F-171-T4-7); wording mới
  "không chạy script nào trong lúc probe pass chạy" thay câu
  cũ (F-171-T4-5). T4-172 áp dụng y hệt checklist này + grep
  thêm số cộng dồn cứng trong stats-*.py (F-169-T4-3) + lệnh
  kiểm chạy ngoài echo (F-169-T4-1) + kiểm poller thoát bằng
  chain log, không dùng pgrep -f (F-169-T4-4).
- **(e) POSTBOOT_PASS cho boot mới 2acdd1ab ĐÃ CÓ (14:52:09Z,
  boot+21m08s, replay-đầy-đủ, poll=0): GHI NHẬN.** Hướng (3)
  — replay tự nhiên + cờ T5 — vẫn đứng (lần này replay xong
  TRƯỚC khi T4 mở poller — nhanh hơn cả #79). Watcher-171
  ĐANG CHẠY lúc T4 đóng.
- **(f) RAM <500 MB: 0/18 poll — SẠCH.** Lần thứ tư liên tiếp
  không có poll nào <500 MB; đợt 170: 0/22, đợt 169: 0/13,
  đợt 168: 0/26. Ghi nhận để T9-171 đối chiếu headroom/balloon
  trên boot mới.
- **(g) P3-A1 ĐÚNG 4/4 (p=0,00233572) + P1 ĐÚNG 4/4
  (p=0,000159042): GHI NHẬN.** Cả hai phép thử nghiêm ngặt
  đều ĐÚNG đợt này; P3' prereg DAT 4/4; điều tra (c2) vẫn
  ĐÓNG. lag≥+5f (b) = 6 occurrence (F-171-T4-3) — ghi nhận
  theo dõi, không mở điều tra.
- **(h) B4 SẠCH (delta=0 cả 3 attempt): GHI NHẬN.** Không có
  dòng dpkg lẻ như đợt 169 (F-169-T4-8 không tái diễn); replay
  chạy xong TRƯỚC khi attempt mở (apt=0 cả phiên, dpkg ổn
  định 1545 từ lúc mở tới lúc đóng).
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate mở 15:08:10Z
  (poll #17, gate0 T5) → attempt3 HỢP LỆ 15:12:00Z
  trên boot 2acdd1ab → **GATE cho chuỗi FULL PASS ĐẠT từ
  phía T4** (lượt yên hợp lệ #40, boot đo 2acdd1ab, gate qua
  đường (a) chuẩn). T8 tự quyết O8 trên boot này.
- **(j) Các nợ đứng khác giữ nguyên từ đợt 170 §8:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#78?/#88?/#94?/#95?/#96? giao T2
  (mù #88? MỞ, #94? (#62) MỞ, #95? (#63) MỞ theo quyết (b)
  đợt 163; mù #96? (#64) MỞ sau điều tra đầy đủ — T2-171
  theo dõi tiếp, hole-recheck lần 15); (m) #79/#80 thuộc
  T2-171 + parent đợt 171; birefnet 0 thử (đợt này
  không thử — lần 25); u2net là fallback chính thức; kết cục
  run 170 thuộc T7-171; **POSTBOOT_PASS #79 ĐÃ CÓ từ đợt 170**
  (chỉ còn ý nghĩa hồ sơ — boot #79 đã chết); **replay tự
  nhiên ĐÃ XONG trên boot mới 2acdd1ab lúc T4 đóng** (dpkg
  1545 dòng, cache 178 .deb, lists 37, check độc lập của T5
  PASS).

## A. Phụ lục số liệu (script trích từ log gốc — stats-171.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-171.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-22T14:48:09Z - 2026-11-22T14:48:09Z, boot=2acdd1ab
   RAM min=1525 max=1525 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 0/1 load5<2: 1/1 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=1
   lock: khong=1
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 17 poll, 2026-11-22T14:48:33Z - 2026-11-22T15:08:10Z, boot=2acdd1ab
   RAM min=1318 max=3242 >=1024: 17/17 500-1023: 0/17 <500: 0/17
   load1<2: 9/17 load5<2: 5/17 blockers>0: 3 apt>0: 0
   gate0: T4-check-only=3, T5=14
   lock: co=3, khong=14
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 18
-- RAM toan phien: min=1318 max=3242 >=1024: 18/18 <500: 0/18
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 3/18
   gan-mo? #3 2026-11-22T14:50:04Z boot=2acdd1ab RAM=1318 L1=1.92 L5=1.59 blk=0 apt=0 gate0=T4-check-only(pb_age=2) lock=khong t5=cu(mtime-cu)
   gan-mo? #14 2026-11-22T15:02:43Z boot=2acdd1ab RAM=1798 L1=0.19 L5=1.80 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round171-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #17 2026-11-22T15:08:10Z boot=2acdd1ab RAM=2825 L1=1.61 L5=1.99 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round171-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 2acdd1ab: 18 poll; RAM>=1024 lan cuoi: 2026-11-22T15:08:10Z #17; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 35 luot hop le): P1 136/139 P2 130/130 P3-A1 118/139 P3' 103/111 occ = 93/96 distinct-seq P7 69/69
-- chuoi median 35 luot: n=35 mean=48,3 min=39,0 max=60,0 vuot-60: 0
```
