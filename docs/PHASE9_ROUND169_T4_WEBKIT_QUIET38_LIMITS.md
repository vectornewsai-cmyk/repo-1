# PHASE9_ROUND169_T4_WEBKIT_QUIET38_LIMITS.md

**Đợt:** 169. **Luồng:** T4 — đo lượt yên WebKit #38 trên 1 boot
+ **#38 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 33**
  (attempt3-c44cc3ba HỢP LỆ ở lần thử thứ ba trên boot mới
  c44cc3ba; attempt1 nhiễm tải nặng, attempt2 vi phạm B4 chỉ
  vì +1 dòng dpkg.log; không reboot giữa phiên; poller 13 poll
  thật, 3 lần cửa mở).
+ **P1 ĐÚNG 3/3 LẦN THỨ HAI LIÊN TIẾP VỚI n=3** (p=0,00197)
  — cả 3 seq (c2) đều gần run-end; **P3-A1 SAI 3/3 LẦN THỨ HAI
  LIÊN TIẾP** (p=0,02135 — trượt bar p<0,01 dù 3/3 đóng
  băng-tại-tick; baseline đóng băng cao 27,7% — xem
  F-169-T4-6); **3 SEQ MỚI 160, 207, 375** vào sổ
  distinct-seq (cả 3 đều mới).
+ **BOOT MỚI c44cc3ba (btime 08:23:52Z) — ỨNG VIÊN #77**
  (số hiệu giao T0-169 xác minh); replay ĐÃ XONG TRƯỚC KHI
  T4 MỞ (dpkg 1545 dòng lúc mở, apt history.log có, postboot
  check-only PASS ngay ở pre-flight) — khác mẫu rootfs-trống
  của #74/#75; POSTBOOT_PASS #76 viết 08:46:44Z
  (replay-đầy-đủ, poll=0).
**Ngày:** 22/11/2026 (lượt cron 15:35 +07 22/11 = 08:35:51Z).
**Boot đo:** MỘT boot — c44cc3ba (btime 08:23:52Z, boot lúc mở
mới hơn giờ mở 12m01s; số hiệu reboot giao T0-169 xác minh —
ứng viên #77).
**Trạng thái:
#38 CÓ LƯỢT HỢP LỆ (attempt3-c44cc3ba: 20/20, lớp B 5/5,
tickCost median 53,5 ≤ 60 — LUOT HOP LE, poller thoát
09:03:41Z vì ĐẠT, trước hạn cắt poller 10:30Z 1h26m19s, trước
hạn cờ ~11:00Z ~1h56m). Ngân sách dùng 3/3. Cộng dồn LÊN 33
lượt hợp lệ: P1 124/127, P2 118/118, P3-A1 107/127, P3'
91/99 occurrence = 83/86 distinct-seq, P7 67/67. Sổ
distinct-seq THĂNG CẤP as-of-169 (83/86 distinct, occ 91/99,
3 seq mới 160 + 207 + 375, non_dat_in_union [283, 364, 498]
KHÔNG đổi). RAM <500 MB: 0/13 poll — SẠCH (lần thứ hai liên
tiếp). POSTBOOT_PASS cho boot mới c44cc3ba ĐÃ CÓ
(08:46:44Z, T5-169 sở hữu, replay-đầy-đủ); watcher-169 của
T5 ĐANG CHẠY lúc đóng (pid 25426, `replay-watch-169.sh`).**

## 0. Verdict tổng

- **#38 CÓ LƯỢT HỢP LỆ (attempt3-c44cc3ba).**
  Poller thoát 09:03:41Z vì LUOT HOP LE — KHÔNG phải hết
  hạn (hạn cắt 10:30Z còn 1h26m19s, hạn cờ ~11:00Z còn
  ~1h56m).
- **Attempt3-c44cc3ba (08:59:49–09:03:41Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 53,5 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2960–3615 ms/pass): tickCost n=542, blendTick n=431
  (tBlend gap n=430 — xem F-167-T4-2, quy ước đếm gaps),
  c2DrawLog n=1048.
  **tickCost total median= 53,5 ms (p90 79,0, max 146, min 28)**
  — DƯỚI NGƯỠNG 6,5 ms; hậu flip+2000 ms median 54,0.
  Per-pass median 38,0–62,5 ms (pass 9: 38,0; pass 13: 38,0;
  pass 19: 62,5; pass 20: 62,0) trong khi load1 mean/pass
  1,17→2,06 và RAM mean/pass 2020–2538 MB (tương quan Pearson
  median~load1 r=0,51, median~RAM r=-0,30 — vừa/yếu, không kết
  luận nhân quả từ 1 lượt; xem F-169-T4-7).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,55 ≤2,5; B2 load1
  max 2,12 ≤4 — sampler n=102 dòng gồm 1 header + 101 mẫu,
  xem F-168-T4-7; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0 (1546→1546); B5 RAM min 2011 MB,
  0 mẫu <500 MB, 0/102 mẫu <1024 MB — sạch hoàn toàn).
  **(c2)=3** (seq 160, 207, 375 — cả 3 COVERED, delta −23/−21/
  −25 ms; blendTick hậu-flip 311/311 trong ±500 ms của log)
  — ĐÃ CỘNG DỒN.
  P3' 3/3 DAT (stall 5/3/3). lag≥+5f (b) = 0 occurrence — sạch.
  p1p3p7 chạy TAY (F-148-T4-1): **P1 ĐÚNG 3/3** (cả 3 seq gần
  run-end [160, 207, 375 trong 13 run_end seqs], baseline
  39/311, p=0,00197 <0,01, n=3 — lần thứ hai liên tiếp P1
  ĐÚNG với n=3, xem F-169-T4-6); **P2 ĐÚNG 3/3** (lag +1f
  ×3, 0 lag âm); **P3-A1 SAI 3/3** (3/3 đóng băng-tại-tick
  nhưng p=0,02135 ≥0,01 — trượt bar p, xem F-169-T4-6);
  **P7 ĐÚNG** (0/29 entry trễ ≥+1f; đối chứng 0/392).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.148.638 B (md5
  `638c2680274dfcea5e4e244777b68044`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=72 tick).
- **Attempt1-c44cc3ba (08:44:34–08:49:53Z): 20/20 exit 0
  NHƯNG LỚP B VI PHAM (B1 + B2 + B5) — lượt nhiễm tải,
  KHÔNG dùng verdict, retry.** tickCost median 103,0 (n=332,
  p90 266,3, max 477) — vượt ngưỡng 60 dù tính riêng;
  (c2)=0 (không có seq để kiểm coverage/P3'). B1 load5 cuối
  3,50; B2 load1 max 6,43; B5 RAM min 359 MB, 8 mẫu <500 MB,
  45/125 mẫu <1024 MB; B3/B4 ĐẠT. JSON 2.008.803 B (md5
  `82537f94024c66be01d89af7a56b4038`). Chi tiết §2 + §3 (B2
  spike) + F-169-T4-5.
- **Attempt2-c44cc3ba (08:55:10–08:59:03Z): 20/20 exit 0,
  tickCost median 49,0, coverage 7/7 — NHƯNG LỚP B VI PHAM
  CHỈ B4 (dpkg delta=1) — lượt nhiễm, KHÔNG dùng verdict,
  retry.** (c2)=7 [156, 181, 209, 258, 283, 376, 403], P3'
  7/7 DAT (stall 4/5/6/5/3/4/6) — tất cả KHÔNG được cộng dồn
  (chỉ lượt hợp lệ mới tính; xem §6 + F-169-T4-8). B4: +1
  dòng dpkg.log lúc 08:55:22Z — dòng lẻ `startup packages
  configure`, 12 s sau khi attempt bắt đầu, không có dòng
  gói nào theo sau; pgrep -x=0, ps exact-comm=0 lúc kiểm
  (xem §3 + F-169-T4-8). B1/B2/B3/B5 đều ĐẠT (load5 cuối
  2,12; load1 max 2,92; RAM min 922 MB, 0 mẫu <500 MB).
  JSON 3.360.009 B (md5
  `8f16d652610f2423c8e94928a3a62dda`).
- **Poller — 1 instance thật + 1 test, 13 poll, 3 lần cửa mở,
  trên 1 boot (không reboot).** Gate0: T4-check-only 2 poll
  đầu, T5 10 poll sau (cờ T5-169 xuất hiện 08:46:44Z, trong
  lúc attempt1). RAM ≥1024: 11/13; RAM <500: **0/13**.
  load1<2: 8/12 (instance 2); load5<2: 4/12; blockers>0: 0
  poll; apt>0: 0 poll. dpkg 1545→1546.
- **Chuỗi lượt yên hợp lệ: LÊN 33 (32 → 33).** Cộng dồn MỚI:
  P1 124/127, P2 118/118, P3-A1 107/127, **P3' 91/99
  occurrence = 83/86 distinct-seq**, P7 67/67. Chuỗi median
  tickCost 33 lượt: 39,0–60,0 ms, mean 48,7 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #37 (quyết (m) đợt 167):**
  ngưỡng gate A RAM ≥1024 MB, load1<2, load5<2, tickCost
  median ≤60 ms, lớp B 5/5, ngân sách 3 attempt/đợt, poll
  45 s — KHÔNG đổi ngưỡng/cadence nào. **Quyết parent (m)
  đợt 167 đã chốt: median đúng 60,0 mà lớp B sạch thì TÍNH
  ĐẠT (luật ≤60 giữ nguyên)** — poller đã cài `m<=60`;
  đợt này median 53,5 nên không cần áp dụng luật biên.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NẶNG TRONG CỬA SỔ
  ATTEMPT: TUÂN THỦ.** Trong cả 3 cửa sổ attempt, T4 chỉ
  chạy vòng chờ nhẹ (sleep + `ls attempt-done-*` + `tail -1`
  poll log); mọi phân tích nặng (stats-169.py, helper
  distinct-seq-169, p1p3p7 chạy tay, đọc analyzer) đều làm
  SAU khi attempt kết thúc (attempt3 xong 09:03:41Z; phân
  tích 09:04–09:08Z). Pre-flight postboot check-only chạy
  TRƯỚC khi mở poller (08:43Z), không nằm trong cửa sổ
  attempt nào. Xem §0b + F-169-T4-9.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc đóng — không đổi; mọi poll
  đều tree=YES).
- **Cờ:** `hidden_files/round169-t4.done` viết ~09:1xZ 22/11
  (trong hạn cờ ~11:00Z, sớm hơn ~1h50m), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1 + F-167-T4-1 + F-168-T4-1)

Chạy **trước mọi attempt, trước khi mở poller** (08:43Z),
ghi vào `hidden_files/round169-t4/preflight-169.txt` — **PASS**:

- **b.json CÓ trong `round169-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156–168 (F-158-T4-1/2 KHÔNG lặp lại).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–168. **vite.t4-temp.config.mjs md5
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
  `2026-11-22 10:30:00 UTC` → epoch **1795343400** =
  2026-11-22T10:30:00Z — khớp đúng hạn cắt poller 10:30Z
  (hạn cờ ~11:00Z = 1795345200, hạn cứng 11:30Z =
  1795347000); không còn sót dạng `04:30`/`05:00Z`/`05:30Z`/
  `07:30Z`/`08:00Z`/`08:30Z` nào trong script mới (grep 0 hit
  — xem F-169-T4-4); grep `round167` trong mọi script làm việc
  0 hit; grep `round168` chỉ còn fallback `round168-t5/` (có
  chủ đích) + `t4-168` 0 hit (xem F-169-T4-4).
- **Copy-forward đợt 168 → 169:** deadline poller `07:30Z`
  → `10:30Z` ở cả 3 dạng; hạn cờ/cứng trong comment
  `08:00Z`/`08:30Z` → `11:00Z`/`11:30Z`; `brief dot 168` →
  `brief dot 169`; `poll-test-168`/`stats-168`/
  `distinct-seq-168` → 169; T5FLAG chính `round169-t5/` +
  fallback `round168-t5/`; **W trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` ĐÃ LÀ `round169-t4` ngay sau copy**;
  `T4-168a` → `T4-169a` trong `run-attempt-169.sh`;
  `default=168` → `default=169` trong `distinct-seq-169.py`.
  **GREP BẮT ĐƯỢC 0 SÓT** (F-168-T4-1 không tái diễn —
  checklist bổ sung dạng giờ đầy đủ `HH:MM:00Z` + tên file
  `NNN.sh`/`NNN.log`/`NNN.py` đã áp dụng và cho 0 hit).
- **Freeze check (bài học F-164-T4-1):** thư mục `round168-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-22 08:35:51Z**
  (giờ mở đợt 169); `round167-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ ĐẠT QUA ĐƯỜNG DỰ PHÒNG (không phải lỗi
  setup):** boot c44cc3ba (btime 08:23:52Z, tuổi ~20m lúc mở),
  dpkg.log 1545 dòng lúc kiểm đầu; `/var/log/apt/history.log`
  CÓ; cờ T5-169 CHƯA CÓ lúc mở (thư mục `round169-t5/` chưa
  tồn tại); cờ T5-168 chỉ ghi boot 576ca271 (#75), mtime
  06:01:38Z < btime 08:23:52Z — KHÔNG tính cho boot mới;
  postboot check-only chạy tay **exit 0** (ĐỦ — 11/11 gói apt,
  GST 269 = debroot 269, đủ isomp4 + libav; xem
  `preflight-postboot-169.log`). Lúc mở chưa thấy process
  apt-get/dpkg nào chạy (apt=0 ở test poll) — replay đã xong
  trước khi T4 mở (khác #74/#75 phải chờ replay).
- **Test poll (POLL_TEST=1): TEST-POLL-OK (exit 7 đúng thiết kế)** —
  poll #1 RAM 768 MB (<1024), load1 1,13/load5 1,19,
  gate0=T4-check-only (postboot exit 0, pb_age 0), apt=0
  (replay đã xong), dpkg 1545 (xem `poll-test-169.log`).
  TEST-POLL-OK chỉ in ngay trước `exit 7` trong code nên
  dòng này trong log là bằng chứng exit 7.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb.**
- **F-169-T4-1 (lỗi nhỏ của chính T4 trong pre-flight):** lệnh
  echo kiểm cờ fallback đặt `grep -o '576ca271' ...` BÊN
  TRONG chuỗi double-quote nên grep không chạy mà chỉ in ra
  như text. Đã kiểm lại riêng sau đó: cờ 168 chứa `576ca271`,
  mtime 06:01:38Z < btime — kết luận `cu(mtime-cu)` đứng.
  0 ảnh hưởng verdict (poller tự đánh giá cờ mỗi poll).

## 1. Poller — 13 poll thật, 3 lần cửa mở, trên 1 boot (không reboot)

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot c44cc3ba
  (08:43:42Z):** poll #1 RAM=768 MB (<1024), load1=1,13
  load5=1,19, blockers=0, gate0=T4-check-only → cửa đóng
  (RAM <1024) → **TEST-POLL-OK exit 7 đúng thiết kế**. Poll
  này nằm trong `poll-test-169.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot c44cc3ba, 12 poll (08:43:48–
  08:59:49Z), 3 lần cửa mở:** RAM ≥1024: 11/12 (min 759,
  max 3248 MB); 500–1023: 1/12; **<500: 0/12**;
  load1<2: 8/12; load5<2: 4/12; gate0: **T4-check-only 2,
  T5 10**; lock=khong 12/12; dpkg 1545→1546; blockers>0: 0
  poll; apt>0: 0 poll.
- **Giai đoạn 1 — cửa mở lần 1 (poll #2, 08:44:34Z):**
  RAM 1079 MB, load1 1,31/load5 1,24, **gate0=T4-check-only**
  (postboot exit 0, pb_age 1; cờ T5-169 chưa có) → **CỬA MỞ,
  chạy attempt1** → NHIỄM TẢI → poller chờ gate mở lại.
- **Giai đoạn 2 — chờ load hạ sau attempt1 (poll #3–#9,
  08:49:53–08:54:25Z):** load1 7,61 → 0,48, load5 4,30 →
  2,24 (load5 chặn cửa suốt giai đoạn dù load1 đã <2 từ
  poll #8); RAM 1921–2792 MB (đạt); gate0=T5 từ poll #3
  (cờ T5-169 đã có 08:46:44Z).
- **Giai đoạn 3 — CỬA MỞ lần 2 (poll #10, 08:55:10Z):**
  load1 0,23/load5 1,93, RAM 1745 MB, **gate0=T5**
  (POSTBOOT_PASS 08:46:44Z) → **CỬA MỞ, chạy attempt2**
  → B4 VI PHẠM → poller chờ gate mở lại.
- **Giai đoạn 4 — CỬA MỞ lần 3 (poll #12, 08:59:49Z):**
  load1 1,26/load5 1,89, RAM 3248 MB, **gate0=T5** →
  **CỬA MỞ, chạy attempt3** → HỢP LỆ → poller thoát
  09:03:41Z vì LUOT HOP LE.
- **Phân rã 13 poll thật:** RAM≥1024: 11/13; RAM 500–1023:
  2/13 (test poll 768 + instance 2 poll #1 759); RAM<500:
  **0/13**. load1<2: 9/13; load5<2: 5/13. 3 poll mà load +
  RAM cùng đạt — cả 3 đều là poll mở cửa thật (#2, #10,
  #12); **stats "gan-mo" đếm 3 = mở cửa thật 3 — KHÔNG còn
  lệch gan-mo/mở-cửa như F-168-T4-5** (đợt này không có poll
  nào load+RAM đạt mà bị gate0/apt chặn). gate0: T5 10 poll,
  T4-check-only 3 poll (1 test + 2 instance 2). blockers>0:
  0 poll. apt>0: 0 poll.
  **RAM <500 MB: 0/13 poll** — SẠCH, lần thứ hai liên tiếp
  (đợt 168: 0/26). Ghi nhận để T9-169 đối chiếu
  headroom/balloon trên boot mới.

## 2. Attempt3 HỢP LỆ — lượt yên #38

- **Attempt3-c44cc3ba (08:59:49–09:03:41Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 53,5 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2960–3615 ms/pass): tickCost n=542, blendTick n=431
  (tBlend gap n=430 — xem F-167-T4-2), c2DrawLog n=1048.
  **tickCost total median= 53,5 ms (p90 79,0, max 146, min 28)**
  — DƯỚI NGƯỠNG 6,5 ms; hậu flip+2000 ms median 54,0.
  Per-pass median 38,0–62,5 ms (pass 9: 38,0; pass 13: 38,0;
  pass 19: 62,5; pass 20: 62,0) trong khi load1 mean/pass
  1,17→2,06 và RAM mean/pass GIẢM 2538→2020 MB (tương quan
  Pearson median~load1 r=0,51, median~RAM r=-0,30 — vừa/yếu,
  không kết luận nhân quả từ 1 lượt; xem F-169-T4-7).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,55 ≤2,5 ĐẠT;
  B2 load1 max 2,12 ≤4 ĐẠT — sampler n=102 dòng (1 header
  + 101 mẫu, xem F-168-T4-7); B3 không reboot ĐẠT; B4
  pgrep -x=0, ps exact-comm=0, dpkg delta=0 (1546→1546)
  ĐẠT; B5 RAM min 2011 MB, 0 mẫu <500 MB, **0/102 mẫu
  <1024 MB** — sạch hoàn toàn — ĐẠT).
  **(c2)=3** (seq 160, 207, 375 — cả 3 COVERED, delta −23/−21/
  −25 ms; blendTick hậu-flip 311/311 trong ±500 ms của log)
  — ĐÃ CỘNG DỒN.
  P3' 3/3 DAT (stall 5/3/3). lag≥+5f (b) = **0 occurrence** —
  sạch.
  **p1p3p7 chạy TAY (F-148-T4-1): P1 ĐÚNG 3/3** (cả 3 seq gần
  run-end [160, 207, 375 trong 13 run_end seqs], baseline
  39/311, p=0,00197 <0,01, n=3 — lần thứ hai liên tiếp P1
  ĐÚNG với n=3, xem F-169-T4-6); **P2 ĐÚNG 3/3** (lag +1f
  ×3: (160,16,15), (207,15,14), (375,23,22); 0 lag âm);
  **P3-A1 SAI 3/3** (3/3 đóng băng-tại-tick nhưng
  p=0,02135 ≥0,01 — trượt bar p, xem F-169-T4-6);
  **P7 ĐÚNG** (0/29 entry trễ ≥+1f cho 3 seq; đối chứng
  toàn bộ drawSrc post 0/392).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.148.638 B (md5
  `638c2680274dfcea5e4e244777b68044`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0, engine
  webkit 27.2, gstPluginPath hệ thống.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=72 tick
  skippedLatest=1 hậu flip+2000ms, bar ≥30; (1) nhan 100%,
  (2) pixel-verified 100%).
  **Attempt này ĐƯỢC CỘNG DỒN** (lượt hợp lệ — theo quy ước
  đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Lưu ý seq 160/207/375 ĐỀU MỚI:** cả 3 seq chưa có trong sổ
  distinct-seq (seen_c2 + seen_dat) nên cộng thêm distinct
  (xem §6); không seq nào KHÔNG DAT cũ chuyển thành DAT đợt
  này (non_dat_in_union [283, 364, 498] không đổi — seq 283
  DAT ở attempt2 nhưng attempt2 KHÔNG HỢP LỆ nên không tính,
  xem F-169-T4-8).

## 2b. Attempt1 nhiễm tải nặng + Attempt2 vi phạm B4 (không dùng verdict)

- **Attempt1-c44cc3ba (08:44:34–08:49:53Z): 20/20 exit 0
  NHƯNG LỚP B VI PHẠM B1+B2+B5.** JSON 2.008.803 B (md5
  `82537f94024c66be01d89af7a56b4038`).
  tickCost median **103,0 ms** (n=332, p90 266,3, max 477,
  min 28); hậu flip+2000 ms median 186,0. tBlend gap n=248
  median 190,0, max 12190. (c2)=0 — không có seq để kiểm
  coverage/P3' (labellag (c)=0 hoàn toàn; baseline
  P(stall≥2)=60/136=0,441).
  Per-pass: pass 1–5 gần sạch (median 40,0–64,0; load1
  mean ~0,85–1,11; RAM mean 727–826 MB); từ pass 6 trở đi
  tickCost nổ (median 66,0–236,0; wall/pass 3592–7793 ms)
  trong khi load1 mean/pass GIẢM 0,85→0,43 rồi mới tăng vọt
  cuối (pass 18: 2,52; pass 19: 4,27; pass 20: 6,11) và RAM
  mean/pass rơi 434–527 MB ở pass 10–12 rồi hồi 1221–1580 MB
  ở pass 15–17 (r=0,15 / 0,35 — yếu, không kết luận nhân quả).
  **B1 VI PHẠM** (load5 cuối 3,50 >2,5); **B2 VI PHẠM**
  (load1 max 6,43 >4); **B5 VI PHẠM** (RAM min 359 MB, 8 mẫu
  <500 MB, 45/125 mẫu <1024 MB); B3 ĐẠT; B4 ĐẠT (dpkg delta 0).
  Sampler 125 dòng = 1 header + 124 mẫu.
  **B2 spike trong cửa sổ attempt1 — xem §3.**
- **Attempt2-c44cc3ba (08:55:10–08:59:03Z): 20/20 exit 0,
  tickCost median 49,0, coverage 7/7 — NHƯNG LỚP B VI PHẠM
  CHỈ B4.** JSON 3.360.009 B (md5
  `8f16d652610f2423c8e94928a3a62dda`).
  tickCost median **49,0 ms** (n=606, p90 74,0, max 122,
  min 28); hậu flip+2000 ms median 49,0. (c2)=7 [156, 181,
  209, 258, 283, 376, 403], coverage 7/7, P3' 7/7 DAT (stall
  4/5/6/5/3/4/6) — **KHÔNG CỘNG DỒN** (lượt không hợp lệ;
  xem F-169-T4-8). Per-pass median 36,0–66,0; load1
  mean/pass 0,79→2,85; RAM mean/pass 1314→949 MB (r=0,33 /
  -0,35). Sampler 101 dòng = 1 header + 100 mẫu.
  **B4 VI PHẠM (duy nhất): dpkg.log 1545→1546, delta=1**
  trong cửa sổ — dòng lẻ duy nhất `2026-11-22 08:55:22
  startup packages configure` (12 s sau khi attempt bắt đầu),
  không có dòng gói nào theo sau; pgrep -x=0, ps
  exact-comm=0 lúc kiểm classb (08:58:37Z). B1 ĐẠT (load5
  cuối 2,12), B2 ĐẠT (load1 max 2,92), B3 ĐẠT, B5 ĐẠT (RAM
  min 922 MB, 0 mẫu <500 MB; 8/101 mẫu <1024 MB).
  Theo chữ của B4 (bất kỳ delta dpkg.log nào trong cửa sổ
  cũng vi phạm), poller retry là ĐÚNG; T4 không tự nới luật.
  Ai gọi dpkg lúc 08:55:22Z — T4 không biết, giao T2/T5 đối
  chiếu (xem F-169-T4-8).

## 3. B2 spike trong cửa sổ attempt (theo nhiệm vụ đợt 169)

- **Attempt1 (08:44:34–08:49:53Z) — CÓ SPIKE: load1 max
  6,43 (>4).** Hai sóng nhiễm: (a) giữa lượt RAM bị bóp
  (pass 10–12 RAM mean 434–527 MB, min 359 MB) dù load1
  sampler mean chỉ 0,43–0,60 — tickCost vẫn nổ 188–236 ms;
  (b) cuối lượt load vọt (pass 18: 2,52; pass 19: 4,27;
  pass 20: 6,11). Driver ghi được trong `ps-before/after`
  của attempt1: **T6** `test-vite-lock-v2.sh` ×3 process
  (pid 20567/20953/21041 — suite lock chạy trong cửa sổ);
  **T9** sampler/b2-watcher/probe-loop (pid 7325 — process
  cha còn sống suốt phiên); **render `mask_anim.py`** của
  luồng khác (pid 27550 — `python3 .../mask_anim.py --shape
  ellipse ... --out /tmp/repo1-maskan-27534-1.mkv`, chạy
  trong cửa sổ attempt1). Delta tick max: tBlend gap max
  12190 ms (một khoảng blend dài nhất lượt); tickCost max
  477 ms. **Kết luận: attempt1 nhiễm thật, verdict VI PHẠM
  đúng — không dùng.**
- **Attempt2 (08:55:10–08:59:03Z) — KHÔNG SPIKE: load1 max
  2,92 (≤4).** Trong ps-before/after chỉ còn process T9
  (pid 7325) + vite của chính attempt; không còn T6 suite
  hay mask_anim. (Vi phạm duy nhất là B4 dòng dpkg lẻ —
  không phải spike tải.)
- **Attempt3 (08:59:49–09:03:41Z) — KHÔNG SPIKE: load1 max
  2,12 (≤4), RAM min 2011 MB.** Cửa sổ sạch nhất đợt: ps
  chỉ có T9 (pid 7325) + T2 `m56-169.py` (pid 39425/39426 —
  script phân tích nhẹ của T2, không phải process nặng) +
  vite của chính attempt. **0 spike trong cửa sổ attempt
  hợp lệ — đúng kỳ vọng.**
- **Ngoài cửa sổ attempt:** poll #3 (08:49:53Z, giữa 2
  attempt) load1 7,61 — KHÔNG tính là B2 spike trong cửa
  sổ attempt; chỉ ghi nhận là dư chấn tải sau attempt1.

## 4. Replay/postboot trên boot mới — cờ T5-169 ĐÃ CÓ (08:46:44Z); không reboot giữa phiên

- **Boot c44cc3ba (btime 08:23:52Z, số hiệu giao T0-169 xác
  minh — ứng viên #77): replay ĐÃ XONG TRƯỚC KHI T4 MỞ.**
  Lúc T4 mở (08:43Z): dpkg.log 1545 dòng, apt history.log
  có, postboot check-only exit 0 — KHÔNG phải mẫu
  rootfs-trống/rebuild như boot #74/#75 (dpkg 2 dòng lúc mở).
  **T5-169: POSTBOOT_PASS mới viết 08:46:44Z
  (boot+22m52s; dpkg 1545 dòng; cache 178 .deb; lists 37;
  postboot PASS poll=0 độc lập exit 0; replay-đầy-đủ; cờ cũ
  576ca271 lưu POSTBOOT_PASS-576ca271).** Gate0=T5 từ poll
  #3 (08:49:53Z); attempt2/attempt3 mở cửa qua đường (a)
  chuẩn. Attempt1 mở cửa qua đường dự phòng T4-check-only
  (cờ T5 chưa có lúc 08:44Z) — đúng quyết (j) đợt 143.
  T4 chỉ ghi số, không tự kết luận replay có "đầy đủ" không
  (postboot check-only PASS là đủ cho gate0 theo quyết (j)
  đợt 143) — nhưng lần này cờ T5 đã có nên gate0 đi đường
  chính từ poll #3.
  **Watcher-169 của T5 ĐANG CHẠY lúc T4 đóng** (pid 25426,
  `replay-watch-169.sh` — kiểm lúc 09:1xZ).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:**
  boot c44cc3ba lúc poller khởi động (08:43:48Z), lúc cả 3
  attempt, lúc poller thoát (09:03:41Z) và lúc kiểm cuối
  (09:07:58Z) — btime 08:23:52Z không đổi; 0 dòng REBOOT
  PHAT HIEN trong poll log.
- **Reboot MỚI TRƯỚC KHI MỞ (btime 08:23:52Z, boot c44cc3ba):**
  đợt mở 08:35:51Z — boot mới hơn giờ mở 12m01s. Số hiệu
  (#77?) + xác minh 9 nguồn giao T0-169; dữ kiện overlap
  (nếu có) giao T0/T5 đối chiếu — T4 không thấy poll nào
  trên boot cũ trong phiên này (poller mở sau reboot).
  Mù #96?/#95?/#94?/#88?/#77? giao T2-169 — T4 không tự mở mù.
- **85m4 / 86n2 / 84l10: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Đây là verdict của harness T8, T4 không đo và không suy
  đoán — giao T8-169 báo cáo. (T4 chỉ ghi: 0 kẹt quan sát
  được trong 3 attempt của mình; probe không wedged.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND169_T4_WEBKIT_QUIET38_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round169-t4/`):**
  `poll-wait-t4-169.sh` (md5 `617c384fea54b47e50f919183c4c4407`;
  deadline 10:30Z 22/11 + cờ T5 round169-t5/ + fallback
  round168-t5/ + nhãn T4-169a),
  `run-attempt-169.sh` (md5 `1ff249a38a7099f1b3246aede4842b66`;
  đổi số vòng/đường dẫn/nhãn so với 168, lượt yên #38),
  `distinct-seq-169.py` (md5 `305dc0f193a485225fa27b8a5210a31a`;
  HELPER đọc sổ distinct-seq-ledger.json; đợt này ĐÃ DÙNG
  LIVE trên attempt hợp lệ — khi chạy từ `apps/web/scripts/`
  phải truyền `--ledger` trỏ tới sổ vì sổ không nằm cùng
  thư mục — nếu không, helper lỗi FileNotFoundError thay vì
  in số sai, xem §6).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–168, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round169-t4/` — theo đúng mẫu 149–168: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round169-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–168).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-169.sh`, `run-attempt-169.sh`,
  `t4-attempt-inner.sh` (W = round169-t4 + glob check nhiễu
  chéo round169-*), `check-classb-t4.sh` (W = round169-t4),
  10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-169.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn 33 lượt — P1 124/127, P2
  118/118, P3-A1 107/127, P3' 91/99 = 83/86, P7 67/67;
  chuỗi median n=33 mean 48,7 — xem F-169-T4-3),
  `distinct-seq-169.py` (helper đọc sổ, xem §6),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-169: 83/86 distinct, occ 91/99, valid_rounds_p3 21,
  non_dat_in_union [283, 364, 498], md5
  `1b328008c913ce7b27166247f94df2f6` — nguồn thật cho T4-170),
  `distinct-seq-ledger-169-proposed.json` (bản helper ghi ra
  trong live — giống hệt sổ đã thăng cấp, giữ làm audit
  trail),
  `distinct-seq-ledger-asof167-backtest.json` (bản sao sổ
  as-of-167 dựng lại bằng cách đảo round 168 — dùng cho
  back-test, xem F-169-T4-2),
  `distinct-seq-169-backtest168.txt` (output helper back-test
  lần 1 — sai baseline, xem F-169-T4-2),
  `distinct-seq-ledger-169-backtest168-proposed.json` (bản
  helper ghi ra trong back-test lần 1),
  `distinct-seq-169-backtest168b.txt` (output helper back-test
  lần 2 — KHỚP live 168),
  `distinct-seq-ledger-169-backtest168b-proposed.json` (bản
  helper ghi ra trong back-test lần 2 — nội dung KHỚP HỆT sổ
  as-of-168 gốc, giữ làm audit trail),
  `distinct-seq-169-live.txt` (output helper live trên
  attempt3-c44cc3ba),
  `preflight-169.txt` + `preflight-postboot-169.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1
  + F-167-T4-1 + F-168-T4-1).
- **Log/evidence (hidden_files/round169-t4/, không stage):**
  `poll-t4.log` (12 poll instance 2 + CUA YEN MO ×3 + LUOT
  HOP LE ×1, 0 REBOOT PHAT HIEN),
  `poll-test-169.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`,
  `postboot-t4-169-gate0wait-*.log` (check-only các poll),
  `stats-169-output.txt` (output stats-169.py),
  `preview-b-f3-flip-webkit-t4-attempt1-c44cc3ba.json`
  (2.008.803 B, 20/20, md5
  `82537f94024c66be01d89af7a56b4038`)
  + `run-webkit-t4-attempt1-c44cc3ba.log`
  + `load-mid-t4-attempt1-c44cc3ba.log` (sampler 125 dòng =
  1 header + 124 mẫu)
  + `ps-before/after-t4-attempt1-c44cc3ba.txt`
  + `classb-t4-attempt1-c44cc3ba.txt` (LOP-B-TONG VI PHAM
  B1+B2+B5)
  + `analyze-t4-attempt1-c44cc3ba-*.txt` (11 file)
  + `coverage-check-attempt1-c44cc3ba.txt` ((c2)=0)
  + `attempt-done-attempt1-c44cc3ba` (exit 0, 08:49:53Z).
  `preview-b-f3-flip-webkit-t4-attempt2-c44cc3ba.json`
  (3.360.009 B, 20/20, md5
  `8f16d652610f2423c8e94928a3a62dda`)
  + `run-webkit-t4-attempt2-c44cc3ba.log`
  + `load-mid-t4-attempt2-c44cc3ba.log` (sampler 101 dòng =
  1 header + 100 mẫu)
  + `ps-before/after-t4-attempt2-c44cc3ba.txt`
  + `classb-t4-attempt2-c44cc3ba.txt` (LOP-B-TONG VI PHAM
  chỉ B4, delta=1)
  + `analyze-t4-attempt2-c44cc3ba-*.txt` (11 file)
  + `coverage-check-attempt2-c44cc3ba.txt` ((c2)=7/7)
  + `attempt-done-attempt2-c44cc3ba` (exit 0, 08:59:03Z).
  `preview-b-f3-flip-webkit-t4-attempt3-c44cc3ba.json`
  (3.148.638 B, 20/20, md5
  `638c2680274dfcea5e4e244777b68044`)
  + `run-webkit-t4-attempt3-c44cc3ba.log`
  + `load-mid-t4-attempt3-c44cc3ba.log` (sampler 102 dòng =
  1 header + 101 mẫu)
  + `ps-before/after-t4-attempt3-c44cc3ba.txt`
  + `classb-t4-attempt3-c44cc3ba.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt3-c44cc3ba-*.txt` (11 file, gồm
  p1p3p7 chạy tay — xem F-148-T4-1)
  + `coverage-check-attempt3-c44cc3ba.txt` ((c2)=3/3)
  + `attempt-done-attempt3-c44cc3ba` (exit 0, 09:03:41Z).
  `vite-5187-t4-attempt{1,2,3}-c44cc3ba.log` (vite log các
  attempt) + `stop-sampler-t4-attempt{1,2,3}-c44cc3ba`
  (marker) + `dpkg-lines-before-*` +
  `apt-history-before-*` (B4 baseline các attempt) +
  `marker-t4-attempt{1,2,3}-c44cc3ba` (marker).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§5); không process T4 nào còn sống lúc đóng
  (poller đã thoát 09:03:41Z vì LUOT HOP LE — xem F-169-T4-4
  về pgrep tự khớp; vite :5187 + lock trống, curl 000;
  `/tmp/.X11-unix/` còn X194/X195 của suite luồng khác —
  X193 của attempt đã dọn tay, xem §6 F-169-T4-10).

## 6. Sai số F-169-T4-1..10 (+ nợ cũ)

- **F-169-T4-1 — PRE-FLIGHT: grep kiểm cờ fallback NẰM TRONG
  CHUỖI ECHO NÊN KHÔNG CHẠY (lỗi nhỏ của chính T4, 0 thiệt
  hại).** Dòng echo kiểm cờ T5-168 đặt `grep -o '576ca271'
  ...` bên trong double-quote nên chỉ in ra như text. Đã
  kiểm lại riêng: cờ 168 chứa `576ca271`, mtime 06:01:38Z <
  btime 08:23:52Z — kết luận `cu(mtime-cu)` đứng. Poller tự
  đánh giá cờ mỗi poll nên verdict không ảnh hưởng.
  **Bài học:** lệnh kiểm trong pre-flight phải chạy ngoài
  echo, hoặc echo kết quả của command substitution đã chạy.
- **F-169-T4-2 — BACK-TEST LẦN 1 SAI BASELINE: dùng sổ
  as-of-168 để back-test attempt 168 → occurrence đếm trùng
  91/99 thay vì 88/96 (đã sửa bằng back-test lần 2, 0 thiệt
  hại).** Lần 1 chạy helper 169 trên stall + c2coverage
  attempt1-168 với sổ as-of-168 (sổ này ĐÃ chứa round 168)
  nên occurrence cộng trùng: 88+3=91, 96+3=99. Distinct vẫn
  đúng (80/83, 0 seq mới) vì 239/335/406 đã có trong sổ.
  Lần 2: dựng lại sổ as-of-167 bằng cách đảo round 168
  (bỏ per_round['168'], bỏ 239/406 khỏi seen, occ 85/93,
  valid_rounds_p3 19) rồi chạy lại → ra 80/83 distinct,
  88/96 occ, new [239, 406] — **nội dung bản proposed KHỚP
  HỆT sổ as-of-168 gốc** (so sánh dict bằng nhau). Helper
  ĐÃ ĐƯỢC KIỂM CHỨNG trước live.
  **Bài học đứng:** back-test phải dùng sổ TRƯỚC round được
  test, không dùng sổ đã chứa round đó.
- **F-169-T4-3 — STATS-169.PY FOOTER CÒN CỨNG SỐ CỘNG DỒN
  32 LƯỢT CỦA ĐỢT 168 (đã sửa trước khi chốt, 0 thiệt hại).**
  Lần chạy stats đầu in footer cũ (P1 121/124 … 32 lượt) vì
  footer là chuỗi cứng trong script, sed đổi tên file không
  chạm tới. Đã cập nhật footer thành 33 lượt (P1 124/127,
  P2 118/118, P3-A1 107/127, P3' 91/99 = 83/86, P7 67/67;
  chuỗi median n=33 mean 48,7) rồi chạy lại stats; LIMITS
  dùng output lần chạy lại. **Bổ sung checklist đợt 170:**
  sau copy-forward, grep cả số cộng dồn cứng trong stats-*.py
  (mẫu `luot hop le` / `P1 1`).
- **F-169-T4-4 — PGREP TỰ KHỚP KHI KIỂM POLLER ĐÃ THOÁT
  (không phải process sót).** Sau khi poller thoát,
  `pgrep -f poll-wait-t4-169.sh | wc -l` trả 1 vì chính shell
  exec của T4 chứa chuỗi đó trong command line. Bằng chứng
  poller thoát thật: chain log ghi "LUOT HOP LE, thoat
  poller" 09:03:41Z + không poll mới nào sau poll #12 +
  0 process T4 (lọc đúng tên script, trừ grep) lúc đóng.
  **Bài học:** kiểm poller thoát bằng chain log + log không
  tăng, không dùng pgrep -f chứa tên script.
- **F-169-T4-5 — ATTEMPT1 NHIỄM TẢI NẶNG: B1+B2+B5 VI PHẠM
  ĐỒNG THỜI, tickCost median 103,0.** Hai sóng nhiễm (§3):
  RAM bị bóp giữa lượt (min 359 MB) rồi load vọt cuối lượt
  (max 6,43). Driver: suite T6 (test-vite-lock-v2.sh ×3),
  T9 sampler/b2-watcher/probe-loop, render mask_anim.py của
  luồng khác. Poller retry là đúng; attempt1 không dùng
  verdict. Ghi nhận để T2/T5/T6/T9 đối chiếu lịch chạy script
  trong cửa sổ 08:44–08:50Z — đặc biệt mask_anim.py render
  60 s (pid 27550) chạy đúng trong cửa sổ đo yên.
- **F-169-T4-6 — P3-A1 SAI 3/3 LẦN THỨ HAI LIÊN TIẾP
  (p=0,02135) + P1 ĐÚNG 3/3 LẦN THỨ HAI LIÊN TIẾP
  (p=0,00197).** Attempt3-c44cc3ba: (c2) 160/207/375 đều
  đóng băng-tại-tick (3/3) VÀ đều gần run-end (3/3);
  baseline đóng băng 86/310 = 27,7% (cao) → p nhị thức
  P3-A1 = 0,02135 ≥ 0,01 → verdict SAI theo luật DEF §5
  (ĐÚNG cần ≥2/3 VÀ p<0,01); baseline run-end 39/311 =
  12,5% → p P1 = 0,00197 < 0,01 → verdict ĐÚNG theo luật
  DEF §3. Cùng mẫu đợt 168 (P3-A1 p=0,0149, P1 p=0,00276).
  **Không phải bằng chứng chống đóng băng:** 3/3 seq đóng
  băng-tại-tick là dữ kiện ủng hộ đóng băng; chỉ là bar p
  nghiêm ngặt không đạt vì baseline cao. P3' prereg (stall)
  vẫn DAT 3/3. Cộng dồn occurrence vẫn +3/3 (107/127).
  Điều tra (c2) VẪN ĐÓNG (chỉ giám sát thụ động theo quyết
  parent đợt 137) — verdict SAI của một phép thử nghiêm
  ngặt không mở lại điều tra (không có tiêu chí mở lại nào
  theo §13 DEF v0.5 xảy ra). Ghi nhận để T10/T2 đối chiếu.
- **F-169-T4-7 — LOAD1 MEAN/PASS TĂNG 1,17→2,06 + RAM
  MEAN/PASS GIẢM 2538→2020 MB TRONG LÚC ĐO HỢP LỆ (cùng họ
  F-168-T4-4, nhẹ hơn).** Per-pass load1 mean: pass 1: 1,32
  → pass 19: 2,06 (tăng gần đơn điệu); RAM mean/pass giảm
  2538→2020 MB (r=0,51 / -0,30). `ps-before/after` liệt kê
  T9 (pid 7325, process cha còn sống suốt phiên) và T2
  `m56-169.py` (pid 39425/39426) đang chạy trong lúc
  attempt3 — script phân tích của luồng khác, không phải
  process nặng thường trực. B2 DAT theo load (max 2,12 ≤ 4)
  là chính; tickCost median 53,5 vẫn dưới ngưỡng 6,5 ms.
  Ghi nhận, không kết luận nhân quả từ 1 lượt.
- **F-169-T4-8 — ATTEMPT2 B4 VI PHẠM CHỈ VÌ +1 DÒNG DPKG.LOG
  LẺ (`startup packages configure` 08:55:22Z) — LƯỢT ĐẸP BỊ
  HỦY, KHÔNG CỘNG DỒN.** Attempt2 có mọi chỉ số của lượt
  hợp lệ (20/20, tickCost 49,0, coverage 7/7, B1/B2/B3/B5
  ĐẠT, P3' 7/7 DAT) nhưng B4 delta=1 → poller retry theo
  chữ của luật. Dòng dpkg lẻ duy nhất, không có dòng gói
  nào theo sau, process đã chết lúc kiểm classb — nhiều khả
  năng là dư chấn của replay/T5 (apt history cuối 08:37:42Z)
  hoặc một lệnh dpkg trạng thái của luồng khác, KHÔNG phải
  cài đặt gói. **T4 không tự nới B4** (luật là luật); nhưng
  ghi rõ để parent/T10 quyết có cần xem lại độ nhạy của B4
  với dòng `startup` đơn lẻ không (đợt 168 B4 delta=0 nên
  chưa từng gặp trường hợp biên này). **Seq 283 DAT ở
  attempt2 (stall 3) KHÔNG được cộng dồn** — non_dat_in_union
  [283, 364, 498] giữ nguyên; chỉ lượt hợp lệ mới tính.
  Ai gọi dpkg lúc 08:55:22Z giao T2/T5 đối chiếu.
- **F-169-T4-9 — TUÂN THỦ LUẬT KHÔNG CHẠY SCRIPT NẶNG TRONG
  CỬA SỔ ATTEMPT (ghi rõ để T10 kiểm).** Trong 3 cửa sổ
  attempt (08:44:34–08:49:53Z, 08:55:10–08:59:03Z,
  08:59:49–09:03:41Z), T4 chỉ chạy vòng chờ nhẹ (sleep 30–55
  s + `ls attempt-done-*` + `tail -1 poll-t4.log`); KHÔNG
  chạy stats/helper/p1p3p7/đọc analyzer nào trong cửa sổ.
  Phân tích nặng làm sau khi attempt3 kết thúc (09:04–
  09:08Z). Pre-flight postboot check-only (08:43Z) chạy
  trước poller, ngoài mọi cửa sổ attempt. Không có vi phạm.
- **F-169-T4-10 — X11 3 SOCKET LÚC ĐÓNG; X193 CỦA T4 ĐÃ DỌN
  TAY, X194/X195 CỦA SUITE LUỒNG KHÁC ĐỂ T8 DỌN (cùng mẫu
  F-168-T4-6, lần thứ ba liên tiếp cùng 3 số display).**
  Sau khi poller thoát, `/tmp/.X11-unix/` còn X193 (mtime
  08:59:52Z — đúng lúc attempt3 mở Xvfb :193), X194 + X195
  (mtime 08:49:19Z — trước attempt3, của suite luồng khác).
  0 Xvfb còn chạy. T4 đã dọn tay socket X193 (rm -f); kiểm
  lại còn X194/X195 lúc đóng — giao T8-169 dọn.
- **F-168-T4-2 — P3-A1 SAI 3/3 (p=0,0149) đợt 168: KHÔNG TÁI
  DIỄN DẠNG Y HỆT NHƯNG CÙNG HỌ (F-169-T4-6).** Đợt này
  P3-A1 lại SAI 3/3 (p=0,02135) — lần thứ hai liên tiếp.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này (có attempt hợp lệ để
  chạy p1p3p7 tay).** p1p3p7 chạy tay đúng form
  (`$JSON "160,207,375"`, exit 0) — xem §2. Nợ đứng ở mức cơ
  chế (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt có attempt
  hợp lệ T4 phải chạy tay và ghi rõ.

## 7. P3' cộng dồn (MỚI — 33 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 169 (MỚI): P1 124/127, P2 118/118,
  P3-A1 107/127, P3' 91/99 occurrence = 83/86 distinct-seq,
  P7 67/67** (33 lượt hợp lệ — #38 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 168 §6: "32 lượt hợp lệ" — nay 33).
- **Đóng góp lượt #38 (attempt3-c44cc3ba, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=3 occurrence / 3 distinct-seq [160, 207, 375], trong
  đó 3 seq MỚI [160, 207, 375].
  - **P1 — ĐÚNG 3/3 occ** (cả 3 seq gần run-end: trong 13
    run_end seqs; baseline 39/311, p=0,00197 trên distinct
    3/3 — verdict ĐÚNG theo luật DEF §3 vì n=3 ≥3 và p<0,01).
    Cộng dồn 121/124 → **124/127**.
    (P1 signed đối chiếu: baseline 39/311, p=0,00197 — khớp.)
  - **P2 ĐÚNG — 3/3 occ** (lag +1f ×3: (160,16,15),
    (207,15,14), (375,23,22); 0 lag âm). Cộng dồn 115/115 →
    **118/118**.
  - **P3-A1 — SAI 3/3 occ** (cả 3 seq đóng băng-tại-tick;
    baseline 86/310, p=0,02135 — verdict SAI theo luật DEF
    §5 vì p≥0,01; xem F-169-T4-6).
    Cộng dồn 104/124 → **107/127**.
  - **P3' 3/3 occ ĐẠT** (160 stall 5, 207 stall 3, 375 stall
    3). Cộng dồn 80/83 → **83/86 distinct** (3 seq MỚI —
    160, 207, 375); occurrence 88/96 → **91/99**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 15, 0: 14}; đối chứng toàn bộ drawSrc post: {-1: 247,
    0: 145}, 0/392 entry). Cộng dồn 66/66 → **67/67**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–168).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-169.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 168: 80/83 distinct, occ 88/96), tính seq MỚI =
  tập hiệu với sổ, in cộng dồn mới distinct + occurrence,
  ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-169-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Back-test trước live (xem F-169-T4-2):** lần 1 sai
  baseline (sổ as-of-168 → occ đếm trùng 91/99); lần 2 dùng
  sổ as-of-167 dựng lại → ra 80/83 distinct, 88/96 occ —
  khớp hệt live 168 (nội dung bản proposed KHỚP HỆT sổ
  as-of-168 gốc); sổ gốc KHÔNG đổi trong back-test (md5
  `90f71f13…`).
  **Live đợt 169:** sổ + stall/c2coverage
  attempt3-c44cc3ba → **83/86 distinct, 91/99 occ** — khớp
  tính tay độc lập dưới đây. Sổ đã thăng cấp: as-of 169,
  83/86 distinct, occ 91/99, valid_rounds_p3 21,
  non_dat_in_union [283, 364, 498] (KHÔNG đổi — không seq
  không-DAT cũ nào DAT thêm đợt này; md5 sổ mới
  `1b328008c913ce7b27166247f94df2f6`).
- **Kiểm chứng seq 160/207/375 đợt 169:** helper (đọc sổ)
  xác nhận **cả 3 đều MỚI** (chưa có trong sổ — seen_c2 83
  seq VÀ seen_dat 80 seq đều không chứa 160/207/375).
  Tính tay: distinct DAT 80 + 3 = **83**; distinct tổng
  81 + 3 = **86**; occurrence 88 + 3 = **91**,
  96 + 3 = **99**. Khớp helper.
- **Attempt2 KHÔNG được cộng dồn:** (c2)=7 [156, 181, 209,
  258, 283, 376, 403], P3' 7/7 DAT — nhưng attempt2 vi phạm
  B4 nên không phải lượt hợp lệ; theo quy ước đứng, 0 seq
  nào trong 7 seq đó được cộng (kể cả 283 — seq đang nằm
  trong non_dat_in_union; nếu attempt2 hợp lệ thì 283 đã
  chuyển DAT và non_dat còn [364, 498]). Ghi nhận để T10
  đối chiếu, không tự cộng.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên:** lượt hợp lệ mới (3 occ, 3 seq mới)
  không có dữ kiện mới làm thay đổi P1/P2/P3-A1/P3'/P7 ngoài
  cộng dồn occurrence; P3-A1 SAI 3/3 (F-169-T4-6) là trượt
  bar p của phép thử nghiêm ngặt, không phải bằng chứng
  chống đóng băng, và không có tiêu chí mở lại nào xảy ra
  theo §13 DEF v0.5. Wedge không xảy ra đợt này (0 wedge —
  chuỗi 0-wedge tiếp tục từ đợt 168).
- Chuỗi median tickCost 33 lượt (mới): 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 /
  59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 /
  60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 /
  53,0 / 57,0 / 43,0 / 59,0 / 56,0 / **53,5 ms** (trung bình
  48,7 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 8. Chờ quyết parent / nợ đợt 170

- **(a) #38 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 33.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT đợt
  này** — attempt3-c44cc3ba hợp lệ trên boot c44cc3ba (btime
  08:23:52Z, boot đo lúc mở); gate mở 08:59:49Z qua đường (a)
  chuẩn (cờ T5 PASS 08:46:44Z). O8 chạy trên boot nào, có qua
  gate chuẩn hay phải dùng thủ tục (i), là do T8/T10 quyết;
  T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
  Lưu ý: waiter của T8 đang chờ cờ T4 (cùng mẫu đợt 168) —
  cờ `.done` viết ~09:1xZ, trong hạn cờ ~11:00Z.
- **(b) P3' cộng dồn MỚI 33 lượt: P1 124/127, P2 118/118,
  P3-A1 107/127, P3' 91/99 = 83/86, P7 67/67:** helper đã
  chạy live (back-test lần 2 khớp live 168); sổ
  distinct-seq-ledger.json đã thăng cấp as-of-169 (83/86
  distinct, occ 91/99, valid_rounds_p3 21, non_dat [283, 364,
  498]). **Chờ parent/T10 quyết:** ghi nhận cộng dồn mới.
  T10 kiểm lại phép cộng khi viết aggregate (§12).
- **(c) REBOOT MỚI TRƯỚC KHI MỞ (btime 08:23:52Z, boot
  c44cc3ba — ứng viên #77) — giao T0-169 xác minh số hiệu +
  9 nguồn; giao T7-169/T2-169 kiểm tra run 168 có bị viết lại
  tại reboot này không + (m) cho reboot mới.** Dữ kiện T4:
  btime 08:23:52Z; đợt mở 08:35:51Z (boot mới hơn giờ mở
  12m01s); poller mở sau reboot nên không có poll nào trên
  boot cũ trong phiên này; 0 reboot trong phiên.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1/F-167-T4-1/F-168-T4-1 TIẾP TỤC CHỨNG MINH HIỆU
  QUẢ — giữ làm quy tắc đứng, BỔ SUNG 1 MỤC:** pre-flight
  đợt này grep 0 sót copy-forward (F-168-T4-1 không tái diễn).
  T4-170 áp dụng y hệt checklist này + grep thêm số cộng dồn
  cứng trong stats-*.py (F-169-T4-3) + lệnh kiểm chạy ngoài
  echo (F-169-T4-1) + kiểm poller thoát bằng chain log, không
  dùng pgrep -f (F-169-T4-4).
- **(e) POSTBOOT_PASS cho boot mới c44cc3ba ĐÃ CÓ (08:46:44Z,
  boot+22m52s, replay-đầy-đủ, poll=0): GHI NHẬN.** Hướng (3)
  — replay tự nhiên + cờ T5 — vẫn đứng (lần này replay trên
  boot mới xong TRƯỚC khi T4 mở, nhanh hơn cả #75).
  Watcher-169 ĐANG CHẠY lúc T4 đóng.
- **(f) RAM <500 MB: 0/13 poll — SẠCH.** Lần thứ hai liên tiếp
  không có poll nào <500 MB; đợt 168: 0/26. Ghi nhận để
  T9-169 đối chiếu headroom/balloon trên boot mới.
- **(g) P3-A1 SAI 3/3 (p=0,02135) + P1 ĐÚNG 3/3 (p=0,00197):
  GHI NHẬN.** P3-A1 SAI lần thứ hai liên tiếp là trượt bar p
  của phép thử nghiêm ngặt (baseline đóng băng cao 27,7%),
  không phải bằng chứng chống đóng băng; P3' prereg DAT 3/3;
  điều tra (c2) vẫn ĐÓNG. P1 ĐÚNG lần thứ hai liên tiếp với
  n=3.
- **(h) B4 VI PHẠM CHỈ VÌ +1 DÒNG DPKG.LOG LẺ (F-169-T4-8):
  GHI NHẬN + HỎI PARENT/T10.** Attempt2 đẹp (49,0 ms, 7/7)
  bị hủy vì 1 dòng `startup packages configure` lúc
  08:55:22Z. T4 không tự nới B4; chờ parent/T10 quyết có cần
  xem lại độ nhạy của B4 với dòng `startup` đơn lẻ không.
  Ai gọi dpkg lúc 08:55:22Z giao T2/T5 đối chiếu.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate mở 08:59:49Z
  (poll #12, gate0 T5) → attempt3 HỢP LỆ 09:03:41Z
  trên boot c44cc3ba → **GATE cho chuỗi FULL PASS ĐẠT từ
  phía T4** (lượt yên hợp lệ #38, boot đo c44cc3ba, gate qua
  đường (a) chuẩn). T8 tự quyết O8 trên boot này.
- **(j) Các nợ đứng khác giữ nguyên từ đợt 168 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#94?/#95?/#96? giao T2
  (mù #88? MỞ, #94? (#62) MỞ, #95? (#63) MỞ theo quyết (b)
  đợt 163; mù #96? (#64) MỞ sau điều tra đầy đủ — T2-169
  theo dõi tiếp, hole-recheck lần 13); birefnet 0 thử (đợt
  này không thử); u2net là fallback chính thức; kết cục run
  168 + (m) #76 trường hợp biên thuộc T7-169/T2-169;
  **POSTBOOT_PASS #75 ĐÃ CÓ từ đợt 168** (chỉ còn ý nghĩa hồ
  sơ — boot #75 đã chết); **replay tự nhiên ĐÃ XONG trên
  boot mới c44cc3ba lúc T4 đóng** (dpkg 1546 dòng, cache 178
  .deb, lists 37, check độc lập của T5 PASS).

## A. Phụ lục số liệu (script trích từ log gốc — stats-169.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-169.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-22T08:43:42Z - 2026-11-22T08:43:42Z, boot=c44cc3ba
   RAM min=768 max=768 >=1024: 0/1 500-1023: 1/1 <500: 0/1
   load1<2: 1/1 load5<2: 1/1 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=1
   lock: khong=1
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 12 poll, 2026-11-22T08:43:48Z - 2026-11-22T08:59:49Z, boot=c44cc3ba
   RAM min=759 max=3248 >=1024: 11/12 500-1023: 1/12 <500: 0/12
   load1<2: 8/12 load5<2: 4/12 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=2, T5=10
   lock: khong=12
   dpkg 1545->1546
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 13
-- RAM toan phien: min=759 max=3248 >=1024: 11/13 <500: 0/13
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 3/13
   gan-mo? #2 2026-11-22T08:44:34Z boot=c44cc3ba RAM=1079 L1=1.31 L5=1.24 blk=0 apt=0 gate0=T4-check-only(pb_age=1) lock=khong t5=cu(mtime-cu)
   gan-mo? #10 2026-11-22T08:55:10Z boot=c44cc3ba RAM=1745 L1=0.23 L5=1.93 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round169-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #12 2026-11-22T08:59:49Z boot=c44cc3ba RAM=3248 L1=1.26 L5=1.89 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round169-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot c44cc3ba: 13 poll; RAM>=1024 lan cuoi: 2026-11-22T08:59:49Z #12; RAM<1024 lan dau: 2026-11-22T08:43:42Z #1 RAM=768
-- cong don P3' (MOI, 33 luot hop le): P1 124/127 P2 118/118 P3-A1 107/127 P3' 91/99 occ = 83/86 distinct-seq P7 67/67
-- chuoi median 33 luot: n=33 mean=48,7 min=39,0 max=60,0 vuot-60: 0
```
