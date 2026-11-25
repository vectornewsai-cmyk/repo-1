# PHASE9_ROUND166_T4_WEBKIT_QUIET35_LIMITS.md

**Đợt:** 166. **Luồng:** T4 — đo lượt yên WebKit #35 trên 1 boot
+ **#35 KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ #22 → #30
ĐỨT TẠI #35** (sau 9 lượt hợp lệ liên tiếp đợt 157–165).
+ **PAGE-WEDGED TÁI DIỄN LẦN ĐẦU KỂ TỪ ĐỢT 156** (attempt3,
pass 10 kẹt rAF/renderer 120 s + 3 fetch writePartial timeout
30 s — đúng chữ ký đợt 156; chuỗi 0-wedge 9 đợt đứt).
**Ngày:** 21–22/11/2026 (lượt cron 06:35 +07 22/11 = 23:35:51Z
21/11).
**Boot đo:** MỘT boot duy nhất — d1ddd946 (reboot #70, btime
22:05:25Z — boot lúc mở, ổn định suốt phiên, KHÔNG có reboot
mới trong lúc đo hay lúc đóng).
**Trạng thái:
#35 KHÔNG CÓ LƯỢT HỢP LỆ — ngân sách 3/3 dùng hết, cả 3
attempt đều trượt trên cổng khác nhau (attempt1 B2 vi phạm +
tickCost đúng ngưỡng 60,0; attempt2 lớp B 5/5 nhưng tickCost
77,0 > 60; attempt3 PAGE-WEDGED 9/20 partial). Poller thoát
00:01:46Z vì HẾT NGÂN SÁCH — trước hạn cắt poller 01:30Z
1h28m, trước hạn cờ ~02:00Z ~1h58m. Cộng dồn KHÔNG ĐỔI
(vẫn 30 lượt hợp lệ): P1 117/120, P2 111/111, P3-A1 101/120,
P3' 84/92 occurrence = 78/81 distinct-seq, P7 64/64. Sổ
distinct-seq KHÔNG thăng cấp (giữ as-of-165). RAM <500 MB:
1/16 poll (chỉ test poll 400 MB lúc mở; instance 2: 0/15).
POSTBOOT_PASS #70 ĐÃ CÓ (23:40:45Z, T5-166 sở hữu);
watcher-166 ĐANG CHẠY lúc đóng (pid 26422).**

## 0. Verdict tổng

- **#35 KHÔNG CÓ LƯỢT HỢP LỆ (ngân sách 3/3 dùng hết).**
  Poller thoát 00:01:46Z vì HẾT NGÂN SÁCH — KHÔNG phải hết
  hạn (hạn cắt 01:30Z còn ~1h28m, hạn cờ ~02:00Z còn ~1h58m).
- **Attempt1-d1ddd946 (23:47:48–23:51:37Z): probe 20/20,
  KHÔNG HỢP LỆ (lớp B VI PHẠM — B2 load1 max 4,83 > 4;
  tickCost median ĐÚNG NGƯỠNG 60,0 — không vượt nhưng cũng
  không cứu được B2).** Vite :5187, WebKit 27.2 (Xvfb :193),
  app boot OK, C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL
  BẬT. 20 pass (wall 3112–3541 ms/pass): tickCost n=553,
  blendTick n=449 (tBlend gap), c2DrawLog n=1069.
  **tickCost total median= 60,0 ms (p90 84,0, max 167, min 28)**
  — ĐÚNG ngưỡng 60 (≤60 theo chữ, không vượt); hậu flip+2000 ms
  median 59,0. Per-pass median 41,0–67,5 ms (pass 5: 67,5;
  pass 20: 41,0 — hạ dần theo load1 cuối pass tăng 0,99 →
  4,65, xem F-166-T4-1).
  **Lớp B: VI PHẠM 4/5** (B1 load5 cuối 2,29 ≤2,5 ĐẠT;
  **B2 load1 max 4,83 > 4 VI PHẠM** — sampler n=102; ps-before/
  after chỉ có process vite của chính attempt + 1 process
  vite-lock-v2 của luồng khác (xem §5 F-166-T4-8); B3 không
  reboot ĐẠT; B4 pgrep -x=0, ps exact-comm=0, dpkg delta=0
  ĐẠT; B5 RAM min 1905 MB, 0 mẫu <500 MB, 0/102 mẫu <1024 MB
  ĐẠT).
  **(c2)=2** (seq 231, 416, COVERED, delta +18/−22 ms) —
  attempt không hợp lệ nên KHÔNG cộng dồn. P3' 2/2 DAT
  (stall 7/3). lag≥+5f (b) = **5 occurrence** (seq 121, lag
  max +11f — xem F-166-T4-4).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.023.329 B (md5
  `2804ee2a0d86a6e3051688184a79260e`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100%.
- **Attempt2-d1ddd946 (23:53:09–23:57:03Z): probe 20/20,
  KHÔNG HỢP LỆ (tickCost 77,0 > 60 DÙ lớp B 5/5 sạch).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2995–3801 ms/pass): tickCost n=464, blendTick n=371
  (tBlend gap), c2DrawLog n=1069.
  **tickCost total median= 77,0 ms (p90 103,0, max 196, min 29)**
  — VƯỢT cổng 60 đúng 17,0 ms; hậu flip+2000 ms median 87,0.
  Per-pass median 48,0–93,0 ms (pass 10: 93,0; pass 15: 88,0;
  pass 20: 48,0) trong khi load1 mean/pass chỉ 0,36–1,02 —
  tickCost cao KHÔNG do tải hệ thống (xem F-166-T4-2).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,06 ≤2,5; B2 load1
  max 1,02 ≤4; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0; B5 RAM min 1673 MB, 0 mẫu
  <500 MB, 0/105 mẫu <1024 MB). Sampler n=105.
  **(c2)=1** (seq 130, COVERED, delta −23 ms) — attempt
  không hợp lệ nên KHÔNG cộng dồn. P3' 1/1 DAT (stall 4).
  lag≥+5f (b) = 0 occurrence — sạch.
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 2.600.077 B (md5
  `48b9270310cbffb7e8bc9947c9bd14ef`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100%.
- **Attempt3-d1ddd946 (23:57:04–00:01:17Z): PAGE-WEDGED —
  probe CHỈ 9/20 pass, partial JSON, run-attempt exit=3.**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK. 9 pass
  hoàn thành (wall ~3 s/pass): tickCost n=299, blendTick
  n=246, c2DrawLog n=583 — rồi **pass 10 kẹt: pass-timeout
  120.000 ms wall-clock (kẹt rAF/renderer) 23:59:47Z**; tiếp
  **3 fetch writePartial TIMEOUT 30 s mỗi cái** (tickCost
  00:00:17Z, blendTick 00:00:47Z, c2DrawLog 00:01:17Z) —
  **đúng chữ ký wedge đợt 156**. Partial JSON 1.614.119 B
  (md5 `3ade93c767f07a9067716658449f45ce`), `passes=20`
  (trường này vẫn ghi 20 dù chỉ 9 pass thật — xem
  F-166-T4-3), `partial: true`, probe exit=3.
  tickCost trên dữ liệu từng phần median= 44,0 ms (n=299,
  p90 67,0) — KHÔNG tính verdict (probe không hoàn thành).
  **Lớp B: ĐẠT 5/5** (B1 load5 cuối 1,01; B2 load1 max 1,17;
  B3 không reboot; B4 ĐẠT; B5 RAM min 2609 MB, 0/127 mẫu
  <1024 MB) — không ý nghĩa vì probe wedged. Sampler n=127.
  **(c2)=1 trên dữ liệu từng phần** (seq 193, COVERED,
  delta −24 ms) — KHÔNG cộng dồn. P3' 1/1 DAT (stall 3)
  trên dữ liệu từng phần. lag≥+5f (b) = 0 occurrence.
  **F6' CHƯA ĐỦ MẪU** — skiplatest "CHUA DU MAU" (chỉ 9 pass).
  **HB129 vẫn ghi log trong lúc kẹt thật** (pwEvalTimeout
  10 s → 25 s, 00:00:57–00:01:12Z) — điểm mù live-diag
  F-158-T8-4 tái hiện (xem F-166-T4-3).
- **Poller: 16 poll thật** (1 test + 15 instance 2), **1 boot**,
  **3 lần cửa mở** (#11, #14, #15). RAM ≥1024: 13/16;
  **RAM <500: 1/16** (chỉ test poll 400 MB lúc mở; instance 2:
  0/15). Gate0: T5 14 poll, T4-check-only 2 poll (test + poll
  #1), không-đạt 0 poll. 4 poll mà load + RAM cùng đạt —
  chỉ 3 là poll mở cửa (poll #1 bị blockers=1 chặn — xem
  F-166-T4-7). Lock: khong 16/16. dpkg 1545 suốt phiên.
- **Chuỗi lượt yên hợp lệ: ĐỨT TẠI #35 (dừng ở #30).**
  Cộng dồn KHÔNG ĐỔI (vẫn 30 lượt hợp lệ): P1 117/120,
  P2 111/111, P3-A1 101/120, **P3' 84/92 occurrence = 78/81
  distinct-seq**, P7 64/64. Chuỗi median tickCost 30 lượt
  vẫn 39,0–60,0 ms, mean ~47,9 ms, 0 lượt vượt 60 (không
  thêm lượt mới).
- **Điều kiện GIỮ NGUYÊN như #34 (quyết (i) đợt 163):** ngưỡng
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi
  ngưỡng/cadence nào.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu — không đổi; mọi poll đều
  tree=YES).
- **Cờ:** `hidden_files/round166-t4.done` viết ~00:05Z 22/11
  (trong hạn cờ ~02:00Z, sớm hơn ~1h55m), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1)

Chạy **trước mọi attempt, trước khi mở poller** (23:39–23:40Z),
ghi vào `hidden_files/round166-t4/preflight-166.txt` — **PASS**:

- **b.json CÓ trong `round166-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156–165 (F-158-T4-1/2 KHÔNG lặp lại).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–165. **vite.t4-temp.config.mjs md5
  `e3e874e1528b28563f7aa26234661522`** — khớp.
- **tree-md5.txt `530e10a7` == preview.tsx hiện tại** (`530e10a7`).
- **10/10 analyzer** `analyze-t4-*.py` có mặt (c2coverage,
  c2drawlog, labellag, lag5, p1p3p7, perpass, skiplatest, stall,
  tickcost, wallbands).
- **Script hệ thống:** `vcut-webkit-postboot-check.sh` +
  `vcut-vite-lock-v2.sh` có mặt; `bash -n` OK cả 4 script T4;
  `python3 -m py_compile` OK 12+ file py.
- **Playwright-core** `/home/hatch/scratch-round63-r4/
  node_modules/playwright-core/index.mjs` có mặt.
- **Media** `apps/web/public/stripes-nonperiodic.mp4` có mặt
  (140.828 B).
- **Lock + ngân sách trống:** không có `vite.lock`,
  không có `attempt-done-*` trong thư mục làm việc mới.
- **Deadline waiter epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG
  (bài học F-156-T8-3):** chuỗi deadline trong script
  `2026-11-22 01:30:00 UTC` → epoch **1795311000** =
  2026-11-22T01:30:00Z — khớp đúng hạn cắt poller 01:30Z
  (hạn cờ ~02:00Z = 1795312800, hạn cứng 02:30Z =
  1795314600); không còn sót dạng `19:30`/`16:30`/`13:30`/
  `10:30`/`07:30`/`08:00`/`08:30`/`22:30`/`23:00`/`23:30` nào
  trong script mới (grep 0 hit); grep `round16[0-9]` trong
  mọi script làm việc chỉ còn `round166-t4` + fallback
  `round165-t5` (xem F-166-T4-5).
- **Copy-forward đợt 165 → 166:** deadline poller `22:30Z`
  → `01:30Z` ở cả 3 dạng (kể cả dạng `2026-11-21T22:30:00Z`
  ở dòng echo 64/66 — bị sót ở lần sed đầu, bắt được bởi
  grep pre-flight và sửa trước khi chạy); hạn cờ/cứng trong
  comment `23:00Z`/`23:30Z` → `02:00Z`/`02:30Z`; `brief dot
  165` → `brief dot 166`; `poll-test-165`/`stats-165`/
  `distinct-seq-165` → 166; T5FLAG chính `round166-t5/` +
  fallback `round165-t5/` (comment fallback ban đầu còn
  `round163-t5` — ĐÃ SỬA thành `round165-t5` trước khi chạy,
  kiểm bằng grep); **W trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` ĐÃ LÀ `round166-t4` ngay sau copy
  (không lặp bẫy F-164-T4-1/F-165-T4-2 — lần này sed đổi tên
  áp cho cả 4 script cùng lúc trước khi kiểm)**; glob nhiễu
  chéo inner.sh `round165-*` → `round166-*`.
  **HELPER distinct-seq back-test TRƯỚC LIVE: PASS** — chạy
  helper 166 trên stall + c2coverage attempt2 đợt 165 với sổ
  as-of-165 → ra 78/81 distinct, 0 seq mới, sổ gốc KHÔNG đổi
  (md5 `3668db01…` trước/sau như nhau; xem
  `distinct-seq-166-backtest165-proposed.json`; occ 92/100
  là cộng lặp lại dữ liệu cũ — như dự kiến, cùng mẫu back-test
  đợt 165).
- **Freeze check (bài học F-164-T4-1):** thư mục `round165-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-21 23:35:51Z**
  (giờ mở đợt 166); `round164-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ ĐẠT QUA DỰ PHÒNG (không phải lỗi setup):**
  boot #70 (d1ddd946, btime 22:05:25Z, tuổi ~1h34m lúc mở),
  dpkg.log 1545 dòng lúc kiểm đầu (bộ đã đầy); cờ T5-166
  CHƯA CÓ lúc mở; cờ T5-165 chỉ ghi boot 9a1a9319 (#69), mtime
  20:43Z < btime 22:05:25Z — KHÔNG tính cho boot mới; postboot
  check-only chạy tay **exit 0** (GST hệ thống 269 plugin,
  debroot 269; apt 11 gói đủ — replay đã xong lúc mở, xem
  `preflight-postboot-166.log`). T4 KHÔNG tự chạy --repair
  (thuộc T5).
- **Test poll (POLL_TEST=1): exit 7 đúng thiết kế** —
  poll #1 RAM 400 MB (<500), load1 1,19/load5 0,61 (cửa đóng
  vì RAM), gate0=T4-check-only, tree YES, blockers 0, apt 0,
  dpkg 1545 (xem `poll-test-166.log`).
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb.**
- **Snapshot 3 script vào repo `apps/web/scripts/` (md5 khớp
  bản làm việc):** `poll-wait-t4-166.sh`,
  `run-attempt-166.sh`, `distinct-seq-166.py` (xem §4).

## 1. Poller — 16 poll thật, 3 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot d1ddd946
  (23:40:05Z):** poll #1 RAM=400 MB (<500), load1=1,19
  load5=0,61, blockers=0, gate0=T4-check-only → cửa đóng
  (RAM <1024) → **TEST-POLL-OK exit 7 đúng thiết kế**. Poll
  này nằm trong `poll-test-166.log`; thống kê §A đã hợp nhất.
- **Instance 2, 15 poll, boot d1ddd946 (23:40:12–23:57:03Z):**
  RAM ≥1024: 13/15; load1<2: 9/15; load5<2: 6/15; gate0:
  T4-check-only 1, T5 14, khong-dat 0; lock=khong 15/15;
  dpkg 1545 → 1545; blockers>0: 1 poll; apt>0: 0 poll.
- **Giai đoạn 1 — chờ load hạ (poll #1–#10, 23:40–23:47Z):**
  RAM đã đủ từ poll #4 (1542 MB) nhưng load1 5,23–5,82 rồi
  load5 2,00–3,15 — cửa đóng vì load (tải từ các luồng khác
  đầu đợt). Poll #1: load+RAM cùng đạt nhưng **blockers=1
  chặn mở cửa** (xem F-166-T4-7). Poll #10 load5 đúng 2,00
  (chưa <2).
- **Giai đoạn 2 — cửa mở lần 1 (poll #11, 23:47:47Z):**
  load1=0,86, load5=1,80 <2, RAM=2702 MB,
  gate0=T5 → **CỬA MỞ, chạy attempt1** → B2 vi phạm +
  tickCost đúng ngưỡng 60,0 → KHÔNG HỢP LỆ → poller KHÔNG
  thoát, poll lại gate theo quyết (h) đợt 149.
- **Giai đoạn 3 — chờ gate mở lại cho retry (poll #12–#13,
  23:51:37–23:52:22Z):** load5 2,18 → 2,00 (tải hạ dần);
  RAM 2562–2543 MB (luôn ≥1024).
- **Giai đoạn 4 — cửa mở lần 2 (poll #14, 23:53:08Z):**
  load1=0,84, load5=1,80 <2, RAM=2497 MB, gate0=T5 →
  **CỬA MỞ, chạy attempt2** → tickCost 77,0 > 60 → KHÔNG
  HỢP LỆ → poller poll lại gate.
- **Giai đoạn 5 — cửa mở lần 3 (poll #15, 23:57:03Z):**
  load1=0,71, load5=1,10 <2, RAM=4376 MB, gate0=T5 →
  **CỬA MỞ, chạy attempt3** → PAGE-WEDGED 9/20 → run-attempt
  exit=3 → **HẾT NGÂN SÁCH 3/3, poller thoát 00:01:46Z**.
- **Phân rã 16 poll thật:** RAM≥1024: 13/16; RAM 500–1023:
  2/16; RAM<500: **1/16** (chỉ test poll 400 MB lúc mở).
  load1<2: 10/16; load5<2: 7/16. 4 poll mà load + RAM cùng
  đạt — chỉ 3 là poll mở cửa (#11, #14, #15); poll #1 bị
  blockers=1 chặn. gate0: T5 14 poll, T4-check-only 2 poll,
  khong-dat 0 poll. blockers>0: 1 poll. apt>0: 0 poll.
  **RAM <500 MB: 1/16 poll** — lần đầu có poll <500 MB kể
  từ đợt 164 (6/116, toàn boot #68); đợt 165: 0/13; đợt này
  chỉ 1 poll test lúc mở (RAM hệ thống bị ép lúc mở đợt —
  xem F-166-T4-6), instance 2: 0/15.

## 2. Attempt1 KHÔNG hợp lệ + attempt2 KHÔNG hợp lệ + attempt3 PAGE-WEDGED

- **Attempt1-d1ddd946 (23:47:48–23:51:37Z): probe 20/20,
  KHÔNG HỢP LỆ (lớp B VI PHẠM — B2 load1 max 4,83 > 4;
  tickCost median ĐÚNG NGƯỠNG 60,0).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  3112–3541 ms/pass): tickCost n=553, blendTick n=449
  (tBlend gap), c2DrawLog n=1069.
  **tickCost total median= 60,0 ms (p90 84,0, max 167, min 28)**
  — đúng ngưỡng 60 (≤60 theo chữ); hậu flip+2000 ms median
  59,0. Per-pass median 41,0–67,5 ms (pass 1: 55,0; pass 5:
  67,5; pass 10: 58,0; pass 15: 57,0; pass 20: 41,0 — hạ dần
  trong khi load1 cuối pass tăng 0,99 → 4,65).
  **Lớp B: VI PHẠM 4/5** (B1 load5 cuối 2,29 ≤2,5 ĐẠT;
  **B2 load1 max 4,83 > 4 VI PHẠM** — sampler n=102; B3
  không reboot ĐẠT; B4 pgrep -x=0, ps exact-comm=0, dpkg
  delta=0 ĐẠT; B5 RAM min 1905 MB, 0 mẫu <500 MB, **0/102
  mẫu <1024 MB** ĐẠT).
  **(c2)=2** (seq 231, 416, COVERED, delta +18/−22 ms;
  blendTick hậu-flip 328/328 trong ±500 ms của log) —
  attempt không hợp lệ nên KHÔNG cộng dồn. P3' 2/2 DAT
  (stall 7/3). lag≥+5f (b) = **5 occurrence** (seq 121,
  tBlend 29553, presented 25, label 19/22, lag max +11f —
  xem F-166-T4-4).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.023.329 B (md5
  `2804ee2a0d86a6e3051688184a79260e`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100%.
  **Attempt này KHÔNG ĐƯỢC CỘNG DỒN** (không hợp lệ — theo
  quy ước đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Attempt2-d1ddd946 (23:53:09–23:57:03Z): probe 20/20,
  KHÔNG HỢP LỆ (tickCost 77,0 > 60 DÙ lớp B 5/5 sạch).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2995–3801 ms/pass): tickCost n=464, blendTick n=371
  (tBlend gap), c2DrawLog n=1069.
  **tickCost total median= 77,0 ms (p90 103,0, max 196, min 29)**
  — vượt cổng 60 đúng 17,0 ms; hậu flip+2000 ms median 87,0.
  Per-pass median 48,0–93,0 ms (pass 1: 58,5; pass 5: 55,0;
  pass 10: 93,0; pass 15: 88,0; pass 20: 48,0) trong khi
  load1 mean/pass chỉ 0,36–1,02 — tickCost cao KHÔNG do tải
  (xem F-166-T4-2).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,06 ≤2,5; B2 load1
  max 1,02 ≤4; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0; B5 RAM min 1673 MB, 0 mẫu
  <500 MB, **0/105 mẫu <1024 MB**). Sampler n=105.
  **(c2)=1** (seq 130, COVERED, delta −23 ms; blendTick
  hậu-flip trong ±500 ms của log) — attempt không hợp lệ
  nên KHÔNG cộng dồn. P3' 1/1 DAT (stall 4).
  lag≥+5f (b) = 0 occurrence — sạch.
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 2.600.077 B (md5
  `48b9270310cbffb7e8bc9947c9bd14ef`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100%.
- **Attempt3-d1ddd946 (23:57:04–00:01:17Z): PAGE-WEDGED —
  probe CHỈ 9/20 pass, partial JSON, run-attempt exit=3.**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK. 9 pass
  hoàn thành (wall ~3 s/pass): tickCost n=299, blendTick
  n=246, c2DrawLog n=583.
  **Pass 10 kẹt: `pass-timeout: pass 10 không tiến trong
  120000ms wall-clock (kẹt rAF/renderer)` 23:59:47Z**; rồi
  **3 fetch writePartial TIMEOUT 30 s mỗi cái** (tickCost
  00:00:17Z, blendTick 00:00:47Z, c2DrawLog 00:01:17Z) —
  **đúng chữ ký wedge đợt 156** (xem F-166-T4-3). Partial
  JSON 1.614.119 B (md5
  `3ade93c767f07a9067716658449f45ce`), `passes=20` (trường
  này vẫn ghi 20 dù chỉ 9 pass thật — xem F-166-T4-3),
  `partial: true`, probe exit=3.
  tickCost trên dữ liệu từng phần median= 44,0 ms (n=299,
  p90 67,0, max 134, min 27) — KHÔNG tính verdict.
  **Lớp B: ĐẠT 5/5** (B1 load5 cuối 1,01; B2 load1 max 1,17;
  B3 không reboot; B4 ĐẠT; B5 RAM min 2609 MB, 0 mẫu <500 MB,
  0/127 mẫu <1024 MB) — không ý nghĩa vì probe wedged.
  Sampler n=127.
  **(c2)=1 trên dữ liệu từng phần** (seq 193, COVERED,
  delta −24 ms) — KHÔNG cộng dồn. P3' 1/1 DAT (stall 3)
  trên dữ liệu từng phần. lag≥+5f (b) = 0 occurrence.
  **F6' CHƯA ĐỦ MẪU** — skiplatest "CHUA DU MAU" (chỉ 9 pass).
  **HB129 vẫn ghi log trong lúc kẹt thật** ([HB129]
  pwEvalTimeout elapsed 10 s → 25 s, 00:00:57–00:01:12Z) —
  điểm mù live-diag F-158-T8-4 tái hiện (xem F-166-T4-3).
- **Caveat B2 attempt1-d1ddd946 — CÓ 1 process luồng khác
  trong ps (xem F-166-T4-8):** `ps-before/after` liệt kê 1
  process `vcut-vite-lock-v2.sh status` (vòng lặp 30 lần của
  luồng khác, pid 43079) — B2 VI PHẠM theo load (4,83 > 4)
  là chính; process này chỉ là bằng chứng phụ tải ngoài.
  Attempt2/attempt3: `ps-after` chỉ liệt kê process vite của
  chính attempt — sạch, không caveat.
- **Lưu ý seq 231/416/130/193:** cả 4 seq (c2) của 3 attempt
  đều KHÔNG được cộng dồn (không attempt nào hợp lệ). Không
  seq nào trong 4 seq này là seq KHÔNG DAT cũ chuyển thành
  DAT (cả 4 đều DAT trên dữ liệu attempt của mình nhưng
  attempt không hợp lệ).

## 3. Replay/postboot trên boot #70 — cờ T5-166 cho #70 ĐÃ CÓ (replay tự nhiên, KHÔNG cần early-repair); #69 đã chết theo reboot #70

- **Boot d1ddd946 (#70, btime 22:05:25Z):**
  replay TỰ NHIÊN ĐÃ XONG lúc T4 mở (boot+~1h34m): dpkg.log
  1545 dòng lúc T4 mở (23:40Z); postboot check-only của chính
  T4 đã PASS (exit 0) từ pre-flight; gate0 có sẵn qua đường
  dự phòng T4-check-only từ poll #1.
  **T5-166: POSTBOOT_PASS mới viết 23:40:45Z (boot+1h35m20s;
  dpkg 1545 dòng; cache 178 .deb; lists 39; postboot PASS
  poll=0 độc lập exit 0 lúc 23:40:45Z; replay-đầy-đủ; cờ cũ
  9a1a9319 lưu POSTBOOT_PASS-9a1a9319)**. Gate0=T5 từ poll #2
  instance 2 (23:40:58Z). T5 chi tiết; T4 chỉ ghi số, không
  tự kết luận replay có "đầy đủ" không (postboot check-only
  PASS là đủ cho gate0 theo quyết (j) đợt 143).
- **Boot 9a1a9319 (#69): đã chết theo reboot #70** (btime
  22:05:25Z); POSTBOOT_PASS #69 đã có từ đợt 165 (20:43:50Z)
  — chỉ còn ý nghĩa hồ sơ.
- **Watcher-166 của T5 ĐANG CHẠY lúc T4 đóng** (pid 26422,
  `replay-watch-166.sh`, poll đều ~30 s, dpkg 1545 md5
  `5f29561e`, gst 269 — xem `replay-watch-166.log` lúc
  00:03Z). Khác đợt 164: watcher đợt này KHÔNG chết trong
  phiên T4 (không có reboot mới).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:**
  boot d1ddd946 lúc poller khởi động (23:40:12Z), lúc
  attempt1, attempt2, attempt3, lúc poller thoát (00:01:46Z)
  và lúc kiểm cuối (00:03Z) — btime 22:05:25Z không đổi.
  Mù #96?/#95?/#94?/#88?/#77? giao T2-166 — T4 không tự mở mù.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND166_T4_WEBKIT_QUIET35_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round166-t4/`):**
  `poll-wait-t4-166.sh` (deadline 01:30Z 22/11 + cờ T5
  round166-t5/ + fallback round165-t5/ + nhãn T4-166a),
  `run-attempt-166.sh` (đổi số vòng/đường dẫn/nhãn so với 165),
  `distinct-seq-166.py` (HELPER đọc sổ
  distinct-seq-ledger.json; đợt này chỉ dùng cho back-test
  trước live — KHÔNG có attempt hợp lệ nên KHÔNG chạy live;
  khi chạy từ `apps/web/scripts/` phải truyền `--ledger` trỏ
  tới sổ vì sổ không nằm cùng thư mục — nếu không, helper lỗi
  FileNotFoundError thay vì in số sai, xem §6).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–165, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round166-t4/` — theo đúng mẫu 149–165: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round166-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–165).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-166.sh`, `run-attempt-166.sh`,
  `t4-attempt-inner.sh` (W = round166-t4 + glob check nhiễu
  chéo round166-*), `check-classb-t4.sh` (W = round166-t4),
  10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-166.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer giữ cộng dồn 30 lượt — ĐÚNG vì #35 không thêm lượt
  hợp lệ nào),
  `distinct-seq-166.py` (helper đọc sổ, xem §6),
  `distinct-seq-ledger.json` (SỔ distinct-seq, as-of 165:
  78/81 distinct, occ 84/92 — KHÔNG thăng cấp đợt này,
  nguồn thật cho T4-167),
  `distinct-seq-166-backtest165-proposed.json` (bản helper ghi
  ra trong back-test — giống sổ as-of-165 về distinct, occ
  92/100 là cộng lặp dữ liệu cũ, giữ làm audit trail),
  `distinct-seq-166-backtest165.txt` (output helper back-test),
  `preflight-166.txt` + `preflight-postboot-166.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1).
- **Log/evidence (hidden_files/round166-t4/, không stage):**
  `poll-t4.log` (15 poll + CUA YEN MO ×3, KHÔNG có LUOT HOP LE),
  `poll-test-166.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`, `postboot-t4-166-gate0wait-*.log` (check-only
  poll #1),
  `stats-166-output.txt` (output stats-166.py),
  `preview-b-f3-flip-webkit-t4-attempt1-d1ddd946.json`
  (3.023.329 B, 20/20, md5 `2804ee2a0d86a6e3051688184a79260e`)
  + `preview-b-f3-flip-webkit-t4-attempt2-d1ddd946.json`
  (2.600.077 B, 20/20, md5 `48b9270310cbffb7e8bc9947c9bd14ef`)
  + `preview-b-f3-flip-webkit-t4-attempt3-d1ddd946.json`
  (1.614.119 B, 9/20 partial, md5
  `3ade93c767f07a9067716658449f45ce`)
  + `run-webkit-t4-attempt1-d1ddd946.log` +
  `run-webkit-t4-attempt2-d1ddd946.log` +
  `run-webkit-t4-attempt3-d1ddd946.log` (chứa chữ ký wedge:
  pass-timeout pass 10 + 3 fetch writePartial timeout 30 s)
  + `load-mid-t4-attempt1-d1ddd946.log` (sampler n=102) +
  `load-mid-t4-attempt2-d1ddd946.log` (sampler n=105) +
  `load-mid-t4-attempt3-d1ddd946.log` (sampler n=127)
  + `ps-before/after-t4-attempt1-d1ddd946.txt` +
  `ps-before/after-t4-attempt2-d1ddd946.txt` +
  `ps-before/after-t4-attempt3-d1ddd946.txt`
  + `classb-t4-attempt1-d1ddd946.txt` (LOP-B-TONG VI PHAM
  B2 load1 max 4,83)
  + `classb-t4-attempt2-d1ddd946.txt` (LOP-B-TONG DAT 5/5)
  + `classb-t4-attempt3-d1ddd946.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-d1ddd946-*.txt` (10 file — 8 file
  đã chạy lại đúng form sau khi T4 ghi đè sai, xem F-166-T4-5)
  + `analyze-t4-attempt2-d1ddd946-*.txt` (10 file)
  + `analyze-t4-attempt3-d1ddd946-*.txt` (10 file)
  + `coverage-check-attempt1-d1ddd946.txt` ((c2)=2/2)
  + `coverage-check-attempt2-d1ddd946.txt` ((c2)=1/1)
  + `coverage-check-attempt3-d1ddd946.txt` ((c2)=1/1 partial)
  + `attempt-done-attempt1-d1ddd946` (exit 0, 23:51:37Z)
  + `attempt-done-attempt2-d1ddd946` (exit 0, 23:57:03Z)
  + `attempt-done-attempt3-d1ddd946` (exit 3, 00:01:46Z).
  `vite-5187-t4-attempt*-d1ddd946.log` (vite log mỗi attempt) +
  `stop-sampler-t4-attempt1-d1ddd946` (marker) +
  `stop-sampler-t4-attempt2-d1ddd946` (marker) +
  `stop-sampler-t4-attempt3-d1ddd946` (marker) +
  `dpkg-lines-before-*` + `apt-history-before-*` (B4 baseline
  mỗi attempt) + `marker-t4-attempt*-d1ddd946` (marker).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 00:01:46Z vì HẾT NGÂN SÁCH; vite :5187 +
  lock trống, curl 000; `/tmp/.X11-unix/` TRỐNG sau khi T4 dọn
  3 socket mồ côi X193/X194/X195 — xem §5 F-166-T4-9).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round166-t4-quiet35.txt`
  (NUL-delimited, 4 entry — LIMITS + 3 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round166-t4.done` (~00:05Z 22/11 — trong
  hạn cờ ~02:00Z, sớm hơn ~1h55m, CÓ NỘI DUNG).

## 5. Sai số F-166-T4-1..9 (+ nợ cũ)

- **F-166-T4-1 — ATTEMPT1 tickCost median ĐÚNG NGƯỠNG 60,0
  (giá trị biên — verdict KHÔNG hợp lệ chỉ vì B2).**
  Attempt1-d1ddd946: tickCost total median= 60,0 ms — đúng
  ngưỡng ≤60 theo chữ (không vượt). Per-pass median hạ dần
  67,5 → 41,0 trong khi load1 cuối pass tăng 0,99 → 4,65
  (tương quan ngược load–tickCost trong attempt này, khác
  attempt2). Verdict KHÔNG HỢP LỆ không phụ thuộc vào cách
  đọc biên này (B2 vi phạm 4,83 > 4 đã quyết định). Ghi nhận
  để T10 đối chiếu: nếu một attempt sau này có median đúng
  60,0 mà lớp B sạch, cần quyết rõ 60,0 có tính là ĐẠT không
  (hiện tại luật ghi ≤60 nên 60,0 là ĐẠT).
- **F-166-T4-2 — ATTEMPT2 tickCost 77,0 TRONG KHI TẢI HỆ
  THỐNG RẤT THẤP (ngược mẫu đợt 165 — PHÁT HIỆN ĐÁNG CHÚ Ý
  NHẤT VỀ TẢI ĐỢT NÀY).** Attempt2 chạy khi load1 max chỉ
  1,02 (sampler n=105), per-pass load1 mean 0,36–1,02, RAM
  1673–4149 MB — nhưng tickCost median 77,0 (per-pass
  48,0–93,0 ms, pass 10: 93,0 / pass 15: 88,0). Đợt 165:
  attempt1 nhiễm tải (load1 max 6,77 → tickCost 90,0) và
  attempt2 tải hạ (load1 max 3,22 → tickCost 43,0) — tương
  quan load–tickCost rõ. Đợt này attempt2 tải thấp hơn cả
  attempt2 đợt 165 nhưng tickCost cao gần gấp đôi (77,0 so
  với 43,0) — **tickCost đợt này KHÔNG phản ánh tải hệ
  thống**. Có thể là biến động nội tại WebKit/renderer
  (pass 10/15 chậm hẳn trong khi pass 1/5/20 nhanh). T4 không
  đổi ngưỡng gate A load (quyết (i) đợt 163 giữ nguyên); ghi
  nhận để T10/T8 đối chiếu tickCost attempt1/attempt2/attempt3
  (60,0 / 77,0 / 44,0 từng phần — chênh 33,0 ms giữa attempt2
  và attempt3 cùng boot, cách nhau 4 phút, cùng tải thấp).
- **F-166-T4-3 — PAGE-WEDGED TÁI DIỄN (attempt3) — CHUỖI
  0-WEDGE 9 ĐỢT ĐỨT; ĐIỂM MÙ LIVE-DIAG TÁI HIỆN.**
  Attempt3-d1ddd946: pass 10 kẹt rAF/renderer 120 s
  (pass-timeout 23:59:47Z), rồi 3 fetch writePartial TIMEOUT
  30 s mỗi cái (tickCost 00:00:17Z, blendTick 00:00:47Z,
  c2DrawLog 00:01:17Z) — **đúng chữ ký wedge đợt 156** (2 wedge
  liên tiếp, fetch writePartial timeout 30 s). Đây là wedge
  đầu tiên kể từ đợt 156 (đợt 157–165: 0 wedge). Chuỗi
  "0 PAGE-WEDGED" 9 đợt đứt tại đợt 166. **HB129 vẫn ghi log
  trong lúc kẹt thật** ([HB129] pwEvalTimeout elapsed 10 s →
  25 s, 00:00:57–00:01:12Z) — heartbeat làm tươi mtime nên
  live-diag dựa trên mtime MÙ trong lúc kẹt này (đúng điểm
  mù F-158-T8-4: live-diag 0/2 ở 85m4; đợt 164 đã kiểm chứng
  điểm mù là có thật theo hướng xấu; đợt này là lần thứ ba
  quan sát được mẫu này). Wedge lần này được probe tự bắt
  (pass-timeout + writePartial timeout), không cần live-diag.
  **Lưu ý JSON partial:** trường `passes` vẫn ghi 20 dù chỉ
  9 pass thật — T10/T8 đối chiếu wedge không được dùng
  `passes` làm bằng chứng hoàn thành; phải dùng `partial`
  + số pass trong log. Câu hỏi đợt 156 §7(c) (wedge có tính
  là "kẹt" cho chuỗi "P3 không kẹt" của T8 không) VẪN MỞ —
  đợt này có wedge mới (1 wedge, pass 10, kẹt rAF/renderer
  120 s + 3 fetch timeout) nên T8 có dữ kiện mới để quyết.
- **F-166-T4-4 — lag≥+5f (b) = 5 OCCURRENCE Ở ATTEMPT1
  (lần đầu khác 0 kể từ đợt 162).** Attempt1: (b) = 5 occ,
  tất cả seq 121 (tBlend 29553, presented 25, label 19/22,
  lag max +11f, M(pixel-that)=30). Đợt 163–165: (b) = 0 cả
  mọi attempt; đợt này attempt2/attempt3 = 0, chỉ attempt1
  = 5. Attempt1 KHÔNG hợp lệ nên 5 occ này KHÔNG tính vào
  (b) cộng dồn; ghi nhận để T10/T8 đối chiếu xem đợt 162 có
  phải nhiễu một lần không (đợt 162 cũng có (b) > 0) hay đây
  là mẫu tái diễn khi tickCost ở ngưỡng cao (attempt1 median
  60,0).
- **F-166-T4-5 — T4 TỰ GHI ĐÈ 8 FILE ANALYZER ATTEMPT1 BẰNG
  LỆNH GỌI SAI THAM SỐ (đã khôi phục đúng, 0 thiệt hại).**
  Sau attempt1, T4 chạy tay 10 analyzer bằng form
  `"T4-166a1=$JSON"` cho TẤT CẢ (form này chỉ đúng cho
  tickcost/wallbands); 8 analyzer còn lại (c2coverage,
  c2drawlog, labellag, lag5, perpass, skiplatest, stall)
  nhận path trần `$JSON` (+ SEQS cho c2coverage/stall) nên
  ghi traceback FileNotFoundError đè lên output đúng mà
  run-attempt-166.sh đã tạo. ĐÃ CHẠY LẠI đúng form theo
  run-attempt-166.sh (c2drawlog/labellag/skiplatest/lag5:
  `$JSON`; perpass: `$JSON` + 2 log; c2coverage/stall:
  `$JSON` + SEQS=231,416) — output khôi phục khớp
  coverage-check gốc ((c2)=2/2, P3' 2/2 DAT). **Bài học:**
  không chạy analyzer tay bằng form tickcost; dùng đúng form
  trong run-attempt-166.sh; kiểm exit code ngay (lần này
  exit=1 đã báo nhưng T4 vẫn phải chạy lại — lần sau dừng
  ngay khi thấy exit≠0).
- **F-166-T4-6 — TEST POLL RAM 400 MB (<500) LÚC MỞ.**
  RAM avail lúc mở đợt chỉ 400 MB (test poll 23:40:05Z) —
  hệ thống bị ép mạnh lúc mở (các luồng khác đang chạy nặng,
  load1 lúc đó 1,19 nhưng RAM đã cạn; instance 2 sau đó RAM
  hồi lên 809–4376 MB). Instance 2: 0/15 poll <500 MB. Đây
  là poll <500 MB đầu tiên kể từ đợt 164 (6/116, toàn boot
  #68). Ghi nhận, không vi phạm (test poll không tính vào
  gate; RAM hồi trước khi cửa mở lần 1).
- **F-166-T4-7 — POLL #1 LOAD+RAM CÙNG ĐẠT NHƯNG blockers=1
  CHẶN MỞ CỬA (stats "gan-mo" đếm 4, mở cửa thật chỉ 3).**
  Poll #1 instance 2 (23:40:12Z): RAM=1145 MB, load1=1,98,
  load5=0,81 — load+RAM cùng đạt — nhưng blockers=1 nên cửa
  KHÔNG mở. Script stats-166.py đếm "gan-mo" theo load+RAM
  (4 poll) mà không trừ blockers — T10 đừng nhầm 4 poll
  gan-mo thành 4 lần mở cửa; mở cửa thật chỉ 3 (#11, #14,
  #15). Ghi rõ để T10 khỏi kiểm lại.
- **F-166-T4-8 — PS-BEFORE/AFTER ATTEMPT1 CÓ 1 PROCESS LUỒNG
  KHÁC (bằng chứng phụ tải ngoài, không phải nguyên nhân
  chính B2 vi phạm).** Process `vcut-vite-lock-v2.sh status`
  (vòng lặp 30 lần, pid 43079) của luồng khác xuất hiện trong
  ps-before/after attempt1 — cùng mẫu đợt 165 (T2
  hole-recheck + T6 suite trong ps attempt1). B2 VI PHẠM
  theo load (4,83 > 4) là chính; process này chỉ củng cố
  rằng tải ngoài có thật trong lúc attempt1. Attempt2/attempt3
  ps sạch (chỉ process vite của chính attempt).
- **F-166-T4-9 — X11 3 SOCKET MỒ CÔI SAU POLLER (dọn tay,
  không ảnh hưởng đo — cùng mẫu F-165-T4-4).** Sau khi poller
  thoát, `/tmp/.X11-unix/` còn X193 (mtime 23:57Z — đúng lúc
  attempt3 mở Xvfb :193), X194 + X195 (mtime 23:44Z — trong
  lúc attempt1, chủ không rõ, có thể luồng khác); 0 Xvfb còn
  chạy. T4 đã dọn tay cả 3 socket (rm -f), kiểm lại
  `/tmp/.X11-unix/` TRỐNG lúc đóng.
- **F-165-T4-1 — blendTick ĐẾM CHÊNH 1: KHÔNG KIỂM ĐƯỢC
  ĐỢT NÀY (không có attempt hợp lệ để đối chiếu).** Attempt1:
  tickcost đếm blendTick n=449, c2coverage không in tổng
  blendTick để đối chiếu trực tiếp (chỉ đếm hậu-flip 328/328).
  Ghi nhận, không điều tra riêng.
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-166 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)" ở poll #1.
  Sửa từ đợt 152 vẫn đứng; chờ lượt sau có cờ chính non-PASS.
  Không đánh ĐÓNG vội.
- **F-148-T4-1 — KHÔNG ÁP DỤNG đợt này (không có attempt
  hợp lệ để chạy p1p3p7 tay).** Nợ đứng ở mức cơ chế (script
  chưa tự gọi p1p3p7) vẫn còn — mỗi đợt có attempt hợp lệ T4
  phải chạy tay và ghi rõ.

## 6. P3' cộng dồn (KHÔNG ĐỔI — vẫn 30 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 166 (KHÔNG ĐỔI): P1 117/120, P2
  111/111, P3-A1 101/120, P3' 84/92 occurrence = 78/81
  distinct-seq, P7 64/64** (30 lượt hợp lệ — #35 KHÔNG thêm
  lượt nào). Cơ sở: cộng dồn chỉ tính trên các lượt yên
  HỢP LỆ (LIMITS 165 §6: "30 lượt hợp lệ" — nay vẫn 30).
- **Đóng góp lượt #35: 0** — cả 3 attempt đều KHÔNG hợp lệ
  nên (c2) của attempt1 (2 occ: 231, 416), attempt2 (1 occ:
  130), attempt3 (1 occ từng phần: 193) đều KHÔNG cộng dồn.
  P1/P2/P3-A1/P3'/P7 không chạy trên dữ liệu attempt không
  hợp lệ (theo quy ước đứng).
- **HELPER distinct-seq CHỈ BACK-TEST, KHÔNG CHẠY LIVE
  (không có attempt hợp lệ).** Helper `distinct-seq-166.py`
  đọc sổ `distinct-seq-ledger.json` (as-of 165: 78/81
  distinct, occ 84/92). **Back-test trước live (xem §0b):**
  chạy helper trên stall + c2coverage attempt2 đợt 165 với
  sổ as-of-165 → ra 78/81 distinct, 0 seq mới — khớp số đã
  đính chính; sổ gốc KHÔNG đổi (md5 `3668db01…` trước/sau
  như nhau). **Live đợt 166:** KHÔNG chạy helper (không có
  attempt hợp lệ) — sổ KHÔNG thăng cấp, giữ as-of-165
  (78/81 distinct, occ 84/92, non_dat_in_union [283, 364,
  498]) làm nguồn thật cho T4-167.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên:** không có lượt hợp lệ mới nên không có
  dữ kiện mới cho P1/P2/P3-A1/P3'/P7; không có tiêu chí mở
  lại nào xảy ra theo §13 DEF v0.5. Wedge attempt3 không
  liên quan đến (c2) (kẹt rAF/renderer, không phải đóng băng
  nhãn).
- Chuỗi median tickCost 30 lượt (không đổi): 49,5 / 40,0 /
  52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 /
  58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 /
  39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 /
  42,0 / 53,0 / 57,0 / **43,0 ms** (trung bình ~47,9 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 167

- **(a) #35 KHÔNG có lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ
  #22 → #30 ĐỨT.** Từ phía T4, **chân lượt yên cho chuỗi
  FULL PASS (O8) KHÔNG ĐẠT đợt này** — không có lượt yên
  hợp lệ #35 trên boot d1ddd946 (cả 3 attempt đều trượt).
  O8 chạy trên boot nào, có qua gate chuẩn hay phải dùng thủ
  tục (i), là do T8/T10 quyết theo tiền lệ (quyết (h) đợt 157);
  T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
  Lưu ý: attempt hợp lệ gần nhất vẫn là attempt2-9a1a9319
  đợt 165 (boot #69, đã chết theo reboot #70).
- **(b) P3' cộng dồn KHÔNG ĐỔI 84/92 = 78/81 (vẫn 30 lượt
  hợp lệ):** không có attempt hợp lệ nên helper không chạy
  live; sổ distinct-seq-ledger.json giữ as-of-165. **Chờ
  parent/T10 quyết:** ghi nhận cộng dồn không đổi P1 117/120,
  P2 111/111, P3-A1 101/120, P3' 84/92 = 78/81, P7 64/64.
  T10 kiểm lại phép cộng khi viết aggregate (§12) — đợt này
  không có số mới để cộng.
- **(c) PAGE-WEDGED TÁI DIỄN (attempt3) — chuỗi 0-wedge 9 đợt
  ĐỨT.** Wedge đầu tiên kể từ đợt 156, đúng chữ ký đợt 156
  (pass-timeout 120 s tại pass 10 + 3 fetch writePartial
  timeout 30 s). T4-167 tiếp tục theo dõi, ghi nhận nếu tái
  diễn; chưa mở điều tra riêng (quyết (j) đợt 156 giữ
  nguyên). Câu hỏi đợt 156 §7(c) (wedge có tính là "kẹt"
  cho chuỗi "P3 không kẹt" của T8 không) VẪN MỞ — đợt này
  CÓ wedge mới (1 wedge, pass 10, kẹt rAF/renderer 120 s +
  3 fetch timeout) nên T8 có dữ kiện mới để quyết.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1 TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng:** pre-flight bắt được 2 chỗ sót copy-forward TRƯỚC
  khi mở poller (deadline dạng `2026-11-21T22:30:00Z` ở dòng
  echo 64/66 + comment fallback `round163-t5`); W trong
  inner/check-classb đã đúng ngay từ đầu (không lặp bẫy
  F-164-T4-1/F-165-T4-2). T4-167 áp dụng y hệt checklist này.
- **(e) lag≥+5f (b) = 5 occurrence ở attempt1 (KHÔNG hợp lệ,
  không tính cộng dồn):** lần đầu khác 0 kể từ đợt 162.
  T10/T8 đối chiếu xem đợt 162 có phải nhiễu một lần không;
  T4 không mở điều tra riêng.
- **(f) RAM <500 MB: 1/16 poll (chỉ test poll lúc mở).**
  Chuỗi "0 poll <500 MB" đợt 165 đứt ở test poll đợt này
  (400 MB lúc mở), nhưng instance 2 vẫn 0/15. RAM không còn
  là nguyên nhân chặn cửa chính đợt này (load mới là — xem
  F-166-T4-2). Ghi nhận để T9-166 đối chiếu headroom/balloon
  trên boot #70.
- **(g) ĐIỂM MÙ LIVE-DIAG F-158-T8-4 (quyết (u) đợt 158) —
  TÁI HIỆN LẦN THỨ BA THEO HƯỚNG XẤU.** HB129 vẫn ghi log
  trong lúc kẹt thật 120 s + 90 s fetch timeout ở attempt3
  (pwEvalTimeout 10 s → 25 s) — mtime tươi trong lúc kẹt,
  live-diag dựa trên mtime MÙ. Đợt này **có kẹt thật**
  (wedge attempt3) nên live-diag được thử thách — và mẫu
  mù tái hiện. Ghi nhận làm giới hạn đứng; không bổ sung
  kiểm "nội dung tươi" theo quyết (u) — chờ parent quyết ở
  đợt 166 (đề xuất T8-166; kiểm "nội dung tươi" (1c) phương
  án (A) đã duyệt — T8-166 triển khai diag-only sau replay
  offline).
- **(h) HELPER distinct-seq ĐỌC SỔ — T4-167 chỉ cần chạy
  helper với stall + c2coverage của attempt hợp lệ (nếu có);
  KHÔNG kiểm tay nữa.** Sổ nằm ở `hidden_files/round166-t4/
  distinct-seq-ledger.json` (as-of 165: 78/81 distinct, occ
  84/92) — T4-167 copy-forward sổ này (cùng thư mục làm việc)
  và chạy helper như §6 (back-test trước live). Lưu ý: helper
  ghi sổ mới ra file riêng, không sửa sổ gốc tại chỗ — T4-167
  kiểm tra rồi mới thăng cấp. **LƯU Ý COPY-FORWARD:** 2 file
  `t4-attempt-inner.sh` / `check-classb-t4.sh` đợt này đã
  đúng W — T4-167 copy từ bản làm việc đợt 166 và kiểm W
  bằng pre-flight mới (xem (d) + F-166-T4-5).
- **(i) Các nợ đứng khác giữ nguyên từ đợt 165 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#94?/#95? giao T2 (mù #88?
  MỞ, #94? (#62) MỞ, #95? (#63) MỞ theo quyết (b) đợt 163;
  mù #96? (#64) MỞ sau điều tra đầy đủ — T2-166 theo dõi
  tiếp); birefnet 0 thử (lần thứ 19 liên tiếp — đợt này
  không thử); u2net là fallback chính thức; kết cục run 165
  + (m) #70 thuộc T7-166/T2-166; reboot #70 ỨNG VIÊN — T0-166
  xác nhận; POSTBOOT_PASS #70 ĐÃ CÓ (T5-166, 23:40:45Z —
  xem §3); **POSTBOOT_PASS #69 ĐÃ CÓ từ đợt 165** (chỉ còn
  ý nghĩa hồ sơ — boot #69 đã chết); **replay tự nhiên ĐÃ
  XONG trên boot #70 lúc T4 mở** (dpkg 1545 dòng, check-only
  exit 0 từ pre-flight).
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate mở 23:47:47Z
  (poll #11, attempt1 — KHÔNG hợp lệ) + 23:53:08Z (poll #14,
  attempt2 — KHÔNG hợp lệ) + 23:57:03Z (poll #15, attempt3 —
  PAGE-WEDGED) → **GATE cho chuỗi FULL PASS KHÔNG ĐẠT từ
  phía T4** (không có lượt yên hợp lệ #35). T8 tự quyết thủ
  tục (i) sau waiter hết hạn / boot mới; T4 chỉ ghi dữ kiện,
  không tự kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-166.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-166.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-21T23:40:05Z - 2026-11-21T23:40:05Z, boot=d1ddd946
   RAM min=400 max=400 >=1024: 0/1 500-1023: 0/1 <500: 1/1
   load1<2: 1/1 load5<2: 1/1 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=1
   lock: khong=1
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 1 poll
-- instance 2: 15 poll, 2026-11-21T23:40:12Z - 2026-11-21T23:57:03Z, boot=d1ddd946
   RAM min=809 max=4376 >=1024: 13/15 500-1023: 2/15 <500: 0/15
   load1<2: 9/15 load5<2: 6/15 blockers>0: 1 apt>0: 0
   gate0: T4-check-only=1, T5=14
   lock: khong=15
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 16
-- RAM toan phien: min=400 max=4376 >=1024: 13/16 <500: 1/16
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 4/16
   gan-mo? #1 2026-11-21T23:40:12Z boot=d1ddd946 RAM=1145 L1=1.98 L5=0.81 blk=1 apt=0 gate0=T4-check-only(pb_age=0) lock=khong t5=cu(mtime-cu)
   gan-mo? #11 2026-11-21T23:47:47Z boot=d1ddd946 RAM=2702 L1=0.86 L5=1.80 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #14 2026-11-21T23:53:08Z boot=d1ddd946 RAM=2497 L1=0.84 L5=1.80 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #15 2026-11-21T23:57:03Z boot=d1ddd946 RAM=4376 L1=0.71 L5=1.10 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot d1ddd946: 16 poll; RAM>=1024 lan cuoi: 2026-11-21T23:57:03Z #15; RAM<1024 lan dau: 2026-11-21T23:40:05Z #1 RAM=400
-- cong don P3' (MOI, 30 luot hop le): P1 117/120 P2 111/111 P3-A1 101/120 P3' 84/92 occ = 78/81 distinct-seq P7 64/64
-- chuoi median 30 luot: n=30 mean=47,9 min=39,0 max=60,0 vuot-60: 0
```
