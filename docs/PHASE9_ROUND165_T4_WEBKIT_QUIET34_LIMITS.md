# PHASE9_ROUND165_T4_WEBKIT_QUIET34_LIMITS.md

**Đợt:** 165. **Luồng:** T4 — đo lượt yên WebKit #34 trên 1 boot
+ LƯỢT HỢP LỆ #30 (chuỗi lượt yên hợp lệ nối dài: #22 đợt 157 →
#23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161 → #27
đợt 162 → #28 đợt 163 → #29 đợt 164 → #30 đợt 165)
+ KHÔNG PAGE-WEDGED (0 wedge — lần thứ 9 liên tiếp: đợt 157, 158,
159, 160, 161, 162, 163, 164, 165).
**Ngày:** 21/11/2026 (lượt cron 03:35 +07 22/11 = 20:35:51Z 21/11).
**Boot đo:** MỘT boot duy nhất — 9a1a9319 (reboot #69 ỨNG VIÊN, CHƯA
XÁC NHẬN — T0-165, btime 20:09:31Z — boot lúc mở, ổn định suốt
phiên, KHÔNG có reboot mới trong lúc đo hay lúc đóng).
**Trạng thái:
#34 CÓ LƯỢT HỢP LỆ — attempt2-9a1a9319 ĐẠT ở lần mở cửa thứ hai
(20:53:05Z), ngân sách 2/3 dùng (attempt1 KHÔNG hợp lệ; attempt2
ĐẠT — xem §2). Poller thoát 20:56:59Z vì LUOT HOP LE — trước hạn
cắt poller 22:30Z 1h33m, trước hạn cờ ~23:00Z ~2h03m.
Attempt1 20/20 nhưng lớp B VI PHẠM (B1 load5 cuối 3,13 > 2,5 VÀ
B2 load1 max 6,77 > 4) VÀ tickCost 90,0 > 60 — KHÔNG hợp lệ trên
cả hai cổng (nhiễm tải nặng từ luồng khác — xem §5 F-165-T4-5).
Attempt2 20/20, LỚP B ĐẠT 5/5 sạch, tickCost median 43,0 ms ≤ 60.
(c2)=8 occurrence / 8 distinct-seq [158, 182, 211, 236, 335, 360,
440, 467], COVERED 8/8. P1 ĐÚNG (8/8, p=2,1e-07, n=8), P2 ĐÚNG
(8/8 lag +1f, 0 âm), P3-A1 ĐÚNG (8/8, p=4,1e-06, n=8), P3' 8/8
occ ĐẠT (stall 4/3/6/3/3/3/3/7 — 7 seq MỚI DAT, 360 đã DAT từ
trước), P7 ĐÚNG (0 entry trễ ≥+1f).
lag≥+5f (b) = 0 occurrence cả 2 attempt — SẠCH. Cộng dồn MỚI
(30 lượt hợp lệ): P1 117/120, P2 111/111, P3-A1 101/120,
P3' 84/92 occurrence = 78/81 distinct-seq, P7 64/64. HELPER
distinct-seq đọc sổ (quyết (t) đợt 162, đính chính quyết (i)
đợt 163): sổ đã thăng cấp as-of 165 (78/81 distinct, occ 84/92,
non-DAT còn [283, 364, 498]).
PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung F-164-T4-1) PASS —
gate0 lúc mở ĐẠT QUA DỰ PHÒNG T4-check-only (cờ T5-165 chưa có;
postboot check-only exit 0, replay đã xong lúc mở, dpkg 1545
dòng — trạng thái chờ hợp lệ của boot mới, không phải lỗi setup).
Cờ T5-165 cho boot #69 tới ở poll #4 (20:47:03Z; file mtime
20:43:50Z, boot+34m19s, replay-đầy-đủ).
RAM <500 MB: 0/13 poll — trở lại 0 sau khi đợt 164 tái diễn
6/116; RAM ≥1024: 12/13 poll (chỉ test poll 974 MB dưới ngưỡng).
POSTBOOT_PASS #69 ĐÃ CÓ (20:43:50Z, T5-165 sở hữu); #68 VẪN
CHƯA CÓ lúc đóng (T5-165 sở hữu). Watcher-165 ĐANG CHẠY lúc
đóng (pid 28592).**

## 0. Verdict tổng

- **#34 CÓ LƯỢT HỢP LỆ (lượt hợp lệ #30, attempt2-9a1a9319).**
  Ngân sách 3 attempt/đợt dùng **2/3**: attempt1 KHÔNG hợp lệ
  (B1+B2 vi phạm + tickCost 90,0 > 60); attempt2 ĐẠT. Poller
  thoát 20:56:59Z vì LUOT HOP LE — KHÔNG phải hết ngân sách
  hay hết hạn (hạn cắt 22:30Z còn ~1h33m, hạn cờ ~23:00Z còn
  ~2h03m).
- **Attempt1-9a1a9319 (20:42:07–20:47:02Z): probe 20/20,
  KHÔNG HỢP LỆ (lớp B VI PHẠM + tickCost 90,0 > 60, (c2)=1
  không tính).** Vite :5187, WebKit 27.2 (Xvfb :193), app boot
  OK, C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass
  (wall 3330–4615 ms/pass): tickCost n=412, blendTick n=328
  (tBlend gap), c2DrawLog n=790.
  **tickCost total median= 90,0 ms (p90 111,0, max 276, min 29)**
  — VƯỢT cổng 60 đúng 30,0 ms; hậu flip+2000 ms median 89,0.
  Per-pass median 85,0–103,0 ms. **Lớp B: VI PHẠM 3/5**
  (B1 load5 cuối 3,13 > 2,5 VI PHẠM; **B2 load1 max 6,77 > 4
  VI PHẠM** + ps-before/after có process luồng khác — T2
  hole-recheck + T6 suite, xem §5 F-165-T4-5; B3 không reboot
  ĐẠT; B4 pgrep -x=0, ps exact-comm=0, dpkg delta=0 ĐẠT; B5
  RAM min 1268 MB, 0 mẫu <500 MB, 0/116 mẫu <1024 MB ĐẠT).
  Sampler n=116. **(c2)=1** (seq 316, COVERED, delta +22 ms)
  — attempt không hợp lệ nên KHÔNG cộng dồn. lag≥+5f (b) = 0
  occurrence. **KHÔNG PAGE-WEDGED:** 0 fetch timeout,
  `pageErrs: []`, JSON đầy đủ 2.366.560 B (md5
  `7c35f0c2afd58803b429bbd6cad9e4b5`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (xem
  skiplatest attempt1).
- **Attempt2-9a1a9319 (20:53:05–20:56:59Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 43,0 ≤ 60, lớp B 5/5).** Vite :5187,
  WebKit 27.2 (Xvfb :193), app boot OK, C2 draw log BẬT, rVFC
  TẮT, TAP BẬT, RELABEL BẬT, FLIP sau pass 5 (wallMs=26601).
  20 pass (wall 2843–3388 ms/pass): tickCost n=625,
  blendTick n=510 (tBlend gap; c2coverage đếm 511 — chênh 1,
  xem F-165-T4-1), c2DrawLog n=1211.
  **tickCost total median= 43,0 ms (p90 72,6, max 181, min 28)**
  — dư 17,0 ms dưới cổng; hậu flip+2000 ms median 43,0.
  Per-pass median 38,0–58,0 ms; RAM mean/pass 1258–1698 MB;
  load1 mean/pass 1,71–3,11.
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,68 ≤2,5; B2 load1 max
  3,22 ≤4; B3 không reboot; B4 pgrep -x=0, ps exact-comm=0,
  dpkg delta=0; B5 RAM min 1220 MB, 0 mẫu <500 MB,
  **0/100 mẫu <1024 MB** — ghi nhận, không vi phạm). Sampler
  n=100.
  **(c2)=8 occurrence / 8 distinct-seq [158, 182, 211, 236, 335,
  360, 440, 467], COVERED 8/8** (tBlend 31177/34512/38013/
  41368/54666/58174/68870/72482, delta −20/−20/−23/−23/−31/
  −21/−24/−26 ms; blendTick hậu-flip 369/369 trong ±500 ms
  của log).
  lag≥+5f (b) = 0 occurrence — sạch.
  **p1p3p7 chạy TAY (F-148-T4-1): P1 ĐÚNG, P2 ĐÚNG, P3-A1 ĐÚNG,
  P3' ĐẠT, P7 ĐÚNG** (xem §6 — lần đầu P1 VÀ P3-A1 cùng ĐÚNG
  với n=8 kể từ chuỗi lượt n=2 yếu đợt 163–164).
  **KHÔNG PAGE-WEDGED** — attempt chạy đủ 20/20, 0 fetch
  timeout, `pageErrs: []`, JSON đầy đủ 3.370.179 B (md5
  `4d310994a30d8d3593c89d378937e4af`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (64 tick
  skippedLatest=1 hậu-flip; nhân 100%, pixel-verified 100%,
  xem skiplatest).
- **Poller: 13 poll thật** (1 test + 12 instance 2), **1 boot**,
  **2 lần cửa mở** (#3, #12). RAM ≥1024: 12/13; **RAM <500:
  0/13**. Gate0: T5 9 poll, T4-check-only 4 poll (3 instance +
  1 test), không-đạt 0 poll. 2 poll mà load + RAM cùng đạt —
  cả 2 đều là poll mở cửa; 0 poll gần-mở bị chặn bởi gate0.
  Lock: khong 13/13. dpkg 1545 suốt phiên.
- **Chuỗi lượt yên hợp lệ: NỐI DÀI LÊN #30.** Cộng dồn 30 lượt:
  P1 117/120, P2 111/111, P3-A1 101/120, **P3' 84/92 occurrence
  = 78/81 distinct-seq**, P7 64/64. Chuỗi median tickCost 30 lượt:
  39,0–60,0 ms, mean ~47,9 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #33 (quyết (i) đợt 163):** ngưỡng
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi
  ngưỡng/cadence nào.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc inner-end, lúc run-attempt
  exit — không đổi; mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round165-t4.done` viết 21:07Z 21/11
  (trong hạn cờ ~23:00Z, sớm hơn ~1h53m), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1)

Chạy **trước mọi attempt, trước khi mở poller** (20:39–20:40Z),
ghi vào `hidden_files/round165-t4/preflight-165.txt` — **PASS
PHẦN SETUP, GATE0 LÚC MỞ ĐẠT QUA DỰ PHÒNG T4-CHECK-ONLY**:

- **b.json CÓ trong `round165-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156/157/158/159/160/161/162/163/164 (F-158-T4-1/2 KHÔNG lặp
  lại: file spec đã có trước khi poller chạy).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–164. **vite.t4-temp.config.mjs md5
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
  `2026-11-21 22:30:00 UTC` → epoch **1795300200** =
  2026-11-21T22:30:00Z — khớp đúng hạn cắt poller 22:30Z
  (hạn cờ ~23:00Z = 1795302000, hạn cứng 23:30Z =
  1795303800); không còn sót dạng `19:30`/`16:30`/`13:30`/
  `10:30`/`07:30`/`08:00`/`08:30` nào trong script mới (grep 0
  hit); grep `round16[34]` trong inner/check-classb 0 hit
  (xem F-165-T4-2).
- **Copy-forward đợt 164 → 165:** deadline poller `19:30Z` →
  `22:30Z` ở cả 3 dạng; hạn cờ/cứng trong comment `20:00Z`/
  `20:30Z` → `23:00Z`/`23:30Z`; `brief dot 164` → `brief dot
  165`; `poll-test-164`/`stats-164`/`distinct-seq-164` → 165;
  T5FLAG chính `round165-t5/` + fallback `round164-t5/`
  (fallback ban đầu bị sót `round163-t5` — ĐÃ SỬA thành
  `round164-t5` trước khi chạy, kiểm bằng grep — xem
  F-165-T4-2); **W trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` ban đầu vẫn `round164-t4` sau khi đổi
  tên script — ĐÃ BẮT ĐƯỢC bởi grep pre-flight mới và sửa
  thành `round165-t4` TRƯỚC khi mở poller (xem F-165-T4-2)**;
  glob nhiễu chéo inner.sh `round164-*` → `round165-*`.
  **HELPER distinct-seq back-test TRƯỚC LIVE: PASS** — chạy
  helper 165 trên stall + c2coverage attempt2 đợt 164 với sổ
  as-of-164 → ra 71/74 distinct, 0 seq mới, sổ gốc KHÔNG đổi
  (xem `distinct-seq-165-backtest164-proposed.json`; occ 78/86
  là cộng lặp lại dữ liệu cũ — như dự kiến).
- **Freeze check (bài học F-164-T4-1):** thư mục `round164-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-21 20:35:51Z**
  (giờ mở đợt 165); `round163-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ ĐẠT QUA DỰ PHÒNG (không phải lỗi setup):**
  boot #69 (9a1a9319, btime 20:09:31Z, tuổi ~31m lúc mở),
  dpkg.log 1545 dòng lúc kiểm đầu (bộ đã đầy); cờ T5-165
  CHƯA CÓ; cờ T5-164 chỉ ghi boot f1d4ce1a (#67), mtime cũ <
  btime 20:09:31Z — KHÔNG tính cho boot mới; postboot
  check-only chạy tay **exit 0** (GST hệ thống 269 plugin,
  debroot 269; apt 11 gói đủ — replay đã xong lúc mở, xem
  `preflight-postboot-165.log`). T4 KHÔNG tự chạy --repair
  (thuộc T5).
- **Test poll (POLL_TEST=1): exit 7 đúng thiết kế** —
  poll #1 RAM 974 MB, load1 1,35/load5 0,81 (cửa đóng vì RAM),
  gate0=T4-check-only, tree YES, blockers 0, apt 0,
  dpkg 1545 (xem `poll-test-165.log`).
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb.**
- **Snapshot 3 script vào repo `apps/web/scripts/` (md5 khớp
  bản làm việc):** `poll-wait-t4-165.sh` (`44bf1afa`),
  `run-attempt-165.sh` (`a800d0b4`), `distinct-seq-165.py`
  (`e5642337`).

## 1. Poller — 13 poll thật, 2 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 9a1a9319
  (20:40:13Z):** poll #1 RAM=974 MB, load1=1,35 load5=0,81,
  blockers=0, gate0=T4-check-only → cửa đóng (RAM <1024) →
  **TEST-POLL-OK exit 7 đúng thiết kế**. Poll này nằm trong
  `poll-test-165.log`; thống kê §A đã hợp nhất.
- **Instance 2, 12 poll, boot 9a1a9319 (20:40:35–20:53:05Z):**
  RAM ≥1024: 12/12; load1<2: 7/12; load5<2: 4/12; gate0:
  T4-check-only 3, T5 9, khong-dat 0; lock=khong 12/12;
  dpkg 1545 → 1545; blockers=0; apt>0: 0 poll.
- **Giai đoạn 1 — chờ load hạ (poll #1–#2, 20:40–20:41Z):**
  RAM đã đủ (1129/2153 MB) nhưng load1 2,92/2,66 (>2) —
  cửa đóng vì load. **0 poll gần-mở bị chặn bởi gate0**
  (mọi poll load+RAM cùng đạt đều là poll mở cửa).
- **Giai đoạn 2 — cửa mở lần 1 (poll #3, 20:42:06Z):**
  load1=1,79, load5=1,37 <2, RAM=2054 MB,
  gate0=T4-check-only (pb_age=2) → **CỬA MỞ, chạy attempt1**
  → B1+B2 vi phạm + tickCost 90,0 > 60 → KHÔNG HỢP LỆ →
  poller KHÔNG thoát, poll lại gate theo quyết (h) đợt 149.
- **Giai đoạn 3 — chờ gate mở lại cho retry (poll #4–#11,
  20:47:03–20:52:19Z):** cờ T5-165 tới poll #4 (file mtime
  20:43:50Z); load5 còn cao 3,76 → 2,00 (tải từ luồng khác
  hạ dần); RAM 2087–3845 MB (luôn ≥1024). **0 poll gần-mở
  bị chặn bởi gate0.**
- **Giai đoạn 4 — cửa mở lần 2 (poll #12, 20:53:05Z):**
  load1=1,14, load5=1,97 <2, RAM=2087 MB, gate0=T5 →
  **CỬA MỞ, chạy attempt2-9a1a9319** → ĐẠT → poller thoát
  20:56:59Z.
- **Phân rã 13 poll thật:** RAM≥1024: 12/13; RAM 500–1023:
  1/13; RAM<500: **0/13**. load1<2: 8/13; load5<2: 5/13.
  2 poll mà load + RAM cùng đạt — cả 2 đều là poll mở cửa
  (#3, #12). gate0: T5 9 poll, T4-check-only 4 poll,
  khong-dat 0 poll. blockers>0: 0 poll. apt>0: 0 poll.
  **RAM <500 MB: 0 poll** — trở lại 0 sau đợt 164 tái diễn
  (6/116); chuỗi: đợt 162: 0/23; đợt 163: 0/19; đợt 164:
  6/116 (toàn boot #68); đợt này: **0/13 (boot #69)**.
  RAM mở phiên 974 MB (test) rồi 1129–3845 MB (instance 2).

## 2. Attempt1 KHÔNG hợp lệ + attempt2 HỢP LỆ, 0 wedge

- **Attempt1-9a1a9319 (20:42:07–20:47:02Z): probe 20/20,
  KHÔNG HỢP LỆ (lớp B VI PHẠM + tickCost 90,0 > 60, (c2)=1
  không tính).**
  Vite :5187, WebKit 27.2 (Xvfb :193), WebKit launched
  ~20:42:1xZ, app boot OK, C2 draw log BẬT, rVFC TẮT, TAP BẬT,
  RELABEL BẬT, FLIP sau pass 5 (wallMs=40962). 20 pass (wall
  3330–4615 ms/pass): tickCost n=412, blendTick n=328
  (tBlend gap), c2DrawLog n=790.
  **tickCost total median= 90,0 ms (p90 111,0, max 276, min 29)**
  — vượt cổng 60 đúng 30,0 ms; hậu flip+2000 ms median 89,0.
  **Lớp B: VI PHẠM 3/5** (B1 load5 cuối 3,13 > 2,5 VI PHẠM;
  **B2 load1 max 6,77 > 4 VI PHẠM** + ps-before/after có
  process luồng khác — T2 hole-recheck9696 + T6 suite, xem
  F-165-T4-5; B3 không reboot ĐẠT; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0 ĐẠT; B5 RAM min 1268 MB, 0 mẫu
  <500 MB, **0/116 mẫu <1024 MB** ĐẠT). Sampler n=116.
  Per-pass: tickCost median/pass 85,0–103,0 ms.
  **(c2)=1** (seq 316, COVERED, delta +22 ms; stall analyzer
  "P3' TONG: 1/1 seq stall>=2 — P3' DAT") — attempt không hợp
  lệ nên KHÔNG cộng dồn. lag≥+5f (b) = 0 occurrence.
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 2.366.560 B (md5
  `7c35f0c2afd58803b429bbd6cad9e4b5`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (xem
  skiplatest attempt1).
  **Attempt này KHÔNG ĐƯỢC CỘNG DỒN** (không hợp lệ — theo
  quy ước đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Attempt2-9a1a9319 (20:53:05–20:56:59Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 43,0 ≤ 60, lớp B 5/5).** Vite :5187,
  WebKit 27.2 (Xvfb :193), WebKit launched ~20:53:1xZ, app boot
  OK, C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT, FLIP
  sau pass 5 (wallMs=26601). 20 pass (wall 2843–3388 ms/pass):
  tickCost n=625, blendTick n=510 (tBlend gap; c2coverage đếm
  511 — chênh 1, xem F-165-T4-1), c2DrawLog n=1211.
  **tickCost total median= 43,0 ms (p90 72,6, max 181, min 28)**
  — dư 17,0 ms dưới cổng; hậu flip+2000 ms median 43,0.
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,68 ≤2,5; B2 load1 max
  3,22 ≤4; B3 không reboot; B4 pgrep -x=0, ps exact-comm=0,
  dpkg delta=0; B5 RAM min 1220 MB, 0 mẫu <500 MB,
  **0/100 mẫu <1024 MB** — ghi nhận, không vi phạm). Sampler
  n=100. Per-pass: tickCost median/pass 38,0–58,0 ms;
  load1 mean/pass 1,71–3,11; RAM mean/pass 1258–1698 MB;
  Pearson r=0,20 median~load1_mean, r=-0,16 median~RAM_mean
  (chỉ mô tả). Wallbands: median ổn định 39,0–51,0 ms mọi dải.
  **(c2)=8 occurrence / 8 distinct-seq [158, 182, 211, 236, 335,
  360, 440, 467], COVERED 8/8** (tBlend 31177/34512/38013/
  41368/54666/58174/68870/72482, delta −21/−20/−23/−23/−31/
  −21/−24/−26 ms; blendTick hậu-flip 369/369 trong ±500 ms
  của log).
  lag≥+5f (b) = 0 occurrence — sạch.
  **p1p3p7 chạy TAY (xem §6): P1 ĐÚNG, P2 ĐÚNG, P3-A1 ĐÚNG,
  P3' ĐẠT, P7 ĐÚNG.** **KHÔNG PAGE-WEDGED:** 0 fetch timeout,
  `pageErrs: []`, JSON đầy đủ 3.370.179 B (md5
  `4d310994a30d8d3593c89d378937e4af`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (64 tick
  skippedLatest=1 hậu-flip; nhân 100% + pixel-verified 100%,
  xem skiplatest).
- **Caveat B2 attempt2-9a1a9319 — KHÔNG CÓ (sạch):**
  `ps-after` chỉ liệt kê process vite của chính attempt
  (pid 40199/40214/40215, config `round165-t4/` — đúng thư mục);
  không có process luồng khác nào bắt đầu trong lúc attempt
  chạy (khác attempt1 đợt này: T2 hole-recheck + T6 suite
  trong ps-before/after). B2 ĐẠT sạch, không caveat để T10
  đối chiếu.
- **Lưu ý seq 158/182/211/236/335/440/467 (quyết (j) đợt 156):**
  7 seq MỚI hoàn toàn trên cơ sở P3' (chưa từng xuất hiện
  trong (c2) của lượt hợp lệ nào); 360 đã có trong union
  distinct-seq VÀ đã DAT từ trước — lần này stall 3 → DAT
  lại (không cộng thêm distinct). Không seq nào trong 8 seq
  này là seq KHÔNG DAT cũ chuyển thành DAT (khác đợt 164:
  365 từng KHÔNG DAT, nay DAT).

## 3. Replay/postboot trên boot #69 — cờ T5-165 cho #69 ĐÃ CÓ (replay tự nhiên, KHÔNG cần early-repair); cờ cho #68 VẪN CHƯA CÓ

- **Boot 9a1a9319 (#69 ứng viên, btime 20:09:31Z):**
  replay TỰ NHIÊN ĐÃ XONG lúc T4 mở (boot+~31m): dpkg.log
  1545 dòng lúc T4 mở (20:40Z); postboot check-only của chính
  T4 đã PASS (exit 0) từ pre-flight; gate0 có sẵn qua đường
  dự phòng T4-check-only từ poll #1.
  **T5-165: POSTBOOT_PASS mới viết 20:43:50Z (boot+34m19s;
  dpkg 1545 dòng; cache 178 .deb; lists 37; postboot PASS
  poll=0 độc lập exit 0 lúc 20:43:50Z; replay-đầy-đủ; cờ cũ
  f1d4ce1a lưu POSTBOOT_PASS-f1d4ce1a)**. Gate0=T5 từ poll #4
  instance 2 (20:47:03Z). T5 chi tiết; T4 chỉ ghi số, không
  tự kết luận replay có "đầy đủ" không (postboot check-only
  PASS là đủ cho gate0 theo quyết (j) đợt 143).
- **Boot 0c8a94aa (#68): POSTBOOT_PASS VẪN CHƯA CÓ lúc T4
  đóng** (grep `0c8a94aa` trong POSTBOOT_PASS* của round165-t5
  = 0 — T5-165 sở hữu; boot #68 đã chết theo reboot #69 nên
  cờ này, nếu có, chỉ còn ý nghĩa hồ sơ).
- **Watcher-165 của T5 ĐANG CHẠY lúc T4 đóng** (pid 28592,
  poll đều ~30 s, dpkg 1545 md5 `b9d79ebc`, gst 269 — xem
  `replay-watch-165.log` lúc 21:02Z). Khác đợt 164: watcher
  đợt này KHÔNG chết trong phiên T4 (không có reboot mới).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:**
  boot 9a1a9319 lúc poller khởi động (20:40:35Z), lúc
  attempt1, lúc attempt2, lúc poller thoát (20:56:59Z) và
  lúc kiểm cuối (21:02Z) — btime 20:09:31Z không đổi. Số hiệu
  #69 CHƯA ĐƯỢC XÁC NHẬN (T0-165) — T4 không tự xác nhận số
  hiệu reboot. Mù #95?/#94?/#88?/#77? giao T2-165 — T4 không
  tự mở mù.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND165_T4_WEBKIT_QUIET34_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round165-t4/`):**
  `poll-wait-t4-165.sh` (md5 `44bf1afa…`, deadline 22:30Z 21/11 +
  cờ T5 round165-t5/ + fallback round164-t5/ + nhãn T4-165a),
  `run-attempt-165.sh` (md5 `a800d0b4…`, đổi số vòng/đường dẫn/
  nhãn so với 164),
  `distinct-seq-165.py` (md5 `e5642337…`, HELPER đọc sổ
  distinct-seq-ledger.json; bản snapshot trong repo là bản ghi
  code đã dùng live; khi chạy từ `apps/web/scripts/` phải truyền
  `--ledger` trỏ tới sổ vì sổ không nằm cùng thư mục — nếu
  không, helper lỗi FileNotFoundError thay vì in số sai, xem §6).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–164, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round165-t4/` — theo đúng mẫu 149–164: chỉ
  stage 3 script trên; **fix W trong inner/check-classb ĐÃ ÁP
  DỤNG ở bản làm việc đợt này** — xem F-165-T4-2; T4-166
  copy-forward 2 file này từ bản làm việc đợt 165, KHÔNG copy
  từ bản round164-t4). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round165-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–164).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-165.sh`, `run-attempt-165.sh`,
  `t4-attempt-inner.sh` (ĐÃ VÁ W → round165-t4 + glob check
  nhiễu chéo round165-*), `check-classb-t4.sh` (ĐÃ VÁ W →
  round165-t4), 10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-165.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn mới 30 lượt TRƯỚC KHI chạy lần
  cuối — xem F-165-T4-3),
  `distinct-seq-165.py` (helper đọc sổ, xem §6),
  `distinct-seq-ledger.json` (SỔ distinct-seq, as-of 165:
  78/81 distinct, occ 84/92 — nguồn thật mới cho T4-166),
  `distinct-seq-ledger-165-proposed.json` (bản helper ghi ra
  trước khi T4 thăng cấp thành sổ — giống hệt sổ hiện tại,
  giữ làm audit trail),
  `distinct-seq-165-backtest164-proposed.json` (back-test helper
  trên dữ liệu đợt 164 trước live),
  `build-distinct-seq-ledger.py` (script xây sổ từ file
  stall/c2coverage gốc của 15 lượt hợp lệ 139–162 — chạy lại
  được, xem §6),
  `distinct-seq-165-run-attempt2-9a1a9319.txt` (output helper
  chạy live trên attempt2-9a1a9319),
  `preflight-165.txt` + `preflight-postboot-165.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1).
- **Log/evidence (hidden_files/round165-t4/, không stage):**
  `poll-t4.log` (12 poll + CUA YEN MO ×2 + LUOT HOP LE),
  `poll-test-165.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`, `postboot-t4-165-gate0wait-*.log` (check-only
  poll #1/#5/#9),
  `stats-165-output.txt` (output stats-165.py),
  `preview-b-f3-flip-webkit-t4-attempt1-9a1a9319.json`
  (2.366.560 B, 20/20, md5 `7c35f0c2afd58803b429bbd6cad9e4b5`)
  + `preview-b-f3-flip-webkit-t4-attempt2-9a1a9319.json`
  (3.370.179 B, 20/20, md5 `4d310994a30d8d3593c89d378937e4af`)
  + `run-webkit-t4-attempt1-9a1a9319.log` +
  `run-webkit-t4-attempt2-9a1a9319.log` +
  `load-mid-t4-attempt1-9a1a9319.log` (sampler n=116) +
  `load-mid-t4-attempt2-9a1a9319.log` (sampler n=100) +
  `ps-before/after-t4-attempt1-9a1a9319.txt` +
  `ps-before/after-t4-attempt2-9a1a9319.txt`
  + `classb-t4-attempt1-9a1a9319.txt` (LOP-B-TONG VI PHAM
  B1 load5 cuối 3,13 + B2 load1 max 6,77)
  + `classb-t4-attempt2-9a1a9319.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-9a1a9319-*.txt` (10 file)
  + `analyze-t4-attempt2-9a1a9319-*.txt` (10 file)
  + `analyze-t4-p1p3p7-attempt2-9a1a9319.txt`
  + `coverage-check-attempt1-9a1a9319.txt` ((c2)=1/1)
  + `coverage-check-attempt2-9a1a9319.txt` (8/8)
  + `attempt-done-attempt1-9a1a9319` (exit 0, 20:47:02Z)
  + `attempt-done-attempt2-9a1a9319` (exit 0, 20:56:59Z).
  `analyze-l7-labellag.txt` + `lag5-detail.txt` là output mặc
  định của analyzer (ghi theo tên mặc định trong script —
  xem F-157-T4-6), nội dung trùng bản per-attempt.
  `vite-5187-t4-attempt*-9a1a9319.log` (vite log mỗi attempt) +
  `stop-sampler-t4-attempt1-9a1a9319` (marker) +
  `stop-sampler-t4-attempt2-9a1a9319` (marker) +
  `dpkg-lines-before-*` + `apt-history-before-*` (B4 baseline
  mỗi attempt) + `marker-t4-attempt*-9a1a9319` (marker).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 20:56:59Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000; `/tmp/.X11-unix/` TRỐNG sau khi T4 dọn
  3 socket mồ côi X193/X194/X195 — xem §5 F-165-T4-4).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round165-t4-quiet34.txt`
  (NUL-delimited, 4 entry — LIMITS + 3 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round165-t4.done` (21:07Z 21/11 — trong
  hạn cờ ~23:00Z, sớm hơn ~1h53m, CÓ NỘI DUNG).

## 5. Sai số F-165-T4-1..5 (+ nợ cũ)

- **F-165-T4-1 — blendTick ĐẾM CHÊNH 1 GIỮA 2 ANALYZER
  (không ảnh hưởng verdict — lần thứ sáu liên tiếp cùng mẫu).**
  Attempt2-9a1a9319: tickcost analyzer đếm blendTick n=510
  (tBlend gap); c2coverage đếm n=511 (cùng JSON). Chênh 1,
  cùng mẫu F-160-T4-7, F-161-T4-9, F-162-T4-2, F-163-T4-8,
  F-164-T4-5. Có thể do đếm biên flip; không ảnh hưởng
  (c2)/tickCost/lớp B. Ghi nhận, không điều tra riêng.
- **F-165-T4-2 — BẪY COPY-FORWARD W HARDCODE TÁI DIỄN Ở KHÂU
  CHUẨN BỊ — NHƯNG ĐÃ BẮT ĐƯỢC BỞI PRE-FLIGHT MỚI TRƯỚC KHI
  MỞ POLLER (quy trình đúng, 0 thiệt hại).** Sau khi đổi tên
  4 script 164→165 bằng sed, `t4-attempt-inner.sh` /
  `check-classb-t4.sh` (không đổi tên) VẪN còn
  `W=.../round164-t4` — đúng y bẫy F-164-T4-1. Lần này grep
  pre-flight bắt buộc (grep `W=` + `round16[34]` trong 2
  script này + grep `round16[0-9]` trong MỌI script làm việc)
  đã bắt được TRƯỚC khi poller chạy: sửa W → round165-t4 ở
  cả 2 script (bash -n OK, grep round163/round164 0 hit —
  kể cả glob check nhiễu chéo round164-* → round165-*),
  sửa luôn fallback T5 `round163-t5` → `round164-t5` trong
  poll-wait (cũng bị sót ban đầu). **Kiểm chứng 0 file lạc
  hướng:** round164-t4 còn 0 file mtime ≥ giờ mở đợt 165;
  round165-t4 chỉ chứa file đợt 165; JSON/classb/sampler cả
  2 attempt đều nằm đúng round165-t4. **Đây là bằng chứng
  quy tắc pre-flight bổ sung từ F-164-T4-1 HOẠT ĐỘNG** —
  giữ làm quy tắc đứng, T4-166 áp dụng y hệt.
- **F-165-T4-3 — NHÃN FOOTER stats-165.py STALE "29 luot"
  (sai số ghi chép — bắt trước khi chạy stats lần cuối).**
  Lần chạy stats đầu vẫn mang nhãn/cộng dồn cũ as-of-164
  trong khi số trong đã là đợt 165. ĐÃ SỬA footer thành cộng
  dồn mới 30 lượt (P1 117/120, P2 111/111, P3-A1 101/120,
  P3' 84/92 = 78/81, P7 64/64; chuỗi median 30 lượt mean 47,9)
  và chạy lại stats-165.py — output cuối
  (`stats-165-output.txt`) đúng. (Cùng họ lỗi F-164-T4-6:
  số ghi tay giữa đợt lệch số log gốc — lần này bắt được
  trước khi đóng sổ.)
- **F-165-T4-4 — X11 3 SOCKET MỒ CÔI SAU POLLER (dọn tay,
  không ảnh hưởng đo).** Sau khi poller thoát, `/tmp/.X11-unix/`
  còn X193 (mtime 20:53:07Z — đúng lúc attempt2 mở Xvfb :193),
  X194 + X195 (mtime 20:46:03Z — trong lúc attempt1, chủ
  không rõ, có thể luồng khác); 0 Xvfb còn chạy. T4 đã dọn
  tay cả 3 socket (rm -f), kiểm lại `/tmp/.X11-unix/` TRỐNG
  lúc đóng. (Cùng mẫu đợt 164: 3 socket X193/X194/X195 của
  T5 bị reboot #68 xóa — đợt này không có reboot nên T4 tự
  dọn.)
- **F-165-T4-5 — ATTEMPT1 NHIỄM TẢI NẶNG TỪ LUỒNG KHÁC
  (quan sát đo, không phải sai số T4 — PHÁT HIỆN ĐÁNG CHÚ Ý
  NHẤT VỀ TẢI ĐỢT NÀY).** Attempt1 chạy đúng lúc T2
  (hole-recheck9696) + T6 (suite test-vite-lock-v2) chạy nặng:
  ps-before/after attempt1 liệt kê trực tiếp process của 2
  luồng này; sampler load1 max 6,77, load5 cuối 3,13;
  tickCost median 90,0 (per-pass 85,0–103,0) — cao nhất kể
  từ đợt 161 trở lại đây ở attempt đầu. Attempt2 chạy khi
  tải đã hạ (load1 max 3,22, load5 cuối 1,68) thì tickCost
  43,0 — chênh 47,0 ms giữa 2 attempt cùng boot, cùng cây,
  cách nhau 11 phút. **tickCost attempt1 KHÔNG phản ánh
  WebKit mà phản ánh tải hệ thống** — verdict KHÔNG HỢP LỆ
  của attempt1 là đúng về thực chất (lớp B bắt đúng nhiễm
  tải), và poller retry đúng quy trình. T4 không đổi ngưỡng
  gate A load (quyết (i) đợt 163 giữ nguyên); ghi nhận để
  T10 đối chiếu tickCost attempt1/attempt2.
- **F-164-T4-3..8 — ĐÃ TRÁNH / KHÔNG LẶP LẠI (trừ F-164-T4-5
  dạng nhẹ, xem F-165-T4-1).** p1p3p7 gọi đúng tham số ngay
  lần đầu (F-164-T4-3 không lặp); RAM sập <500 MB không tái
  diễn (0/13 — F-164-T4-4 không tái diễn); gate0 KHÔNG còn
  hoàn toàn qua T4-check-only (cờ T5-165 tới poll #4 —
  F-164-T4-8 chỉ còn ở 3 poll đầu instance 2); không reboot
  trong phiên nên poller/monitor không chết (F-164-T4-7
  không tái diễn); blockers=0 mọi poll; lag≥+5f (b) = 0 occ
  cả 2 attempt.
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-165 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này.** p1p3p7 chạy TAY sau
  poller, exit 0 ngay lần đầu (đủ tham số seqs — không lặp
  F-164-T4-3), output lưu
  `analyze-t4-p1p3p7-attempt2-9a1a9319.txt` (xem §6). Nợ đứng
  ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt
  có attempt hợp lệ T4 phải chạy tay và ghi rõ.

## 6. P3' cộng dồn (MỚI — 30 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 165 (MỚI): P1 117/120, P2 111/111,
  P3-A1 101/120, P3' 84/92 occurrence = 78/81 distinct-seq, P7
  64/64** (30 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 164 §6: "29 lượt hợp lệ" — nay 30).
- **Đóng góp lượt #34 (attempt2-9a1a9319, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=8 occurrence / 8 distinct-seq [158, 182, 211, 236, 335,
  360, 440, 467].
  - **P1 ĐÚNG — 8/8 occ** (distinct 8/8 gần run-end:
    run_end seqs [158, 181, 210, 236, 251, 254, 259, 284, 310,
    335, 360, 388, 394, 414, 440, 466, 489, 508]; baseline
    54/369, p=2,10348e-07 trên distinct 8/8 — đạt luật DEF §3
    vì n=8 ≥3 và p<0,01). Cộng dồn 109/112 → **117/120**.
    (P1 signed đối chiếu: baseline 52/369, p=1,55531e-07 —
    cũng ĐÚNG.)
  - **P2 ĐÚNG — 8/8 occ** lag +1f, 0 lag âm (lag từng tuple:
    158: 15/14/1; 182: 15/14/1; 211: 15/14/1; 236: 13/12/1;
    335: 14/13/1; 360: 16/15/1; 440: 15/14/1; 467: 14/13/1 —
    cả tám +1f). Cộng dồn 103/103 → **111/111**.
  - **P3-A1 ĐÚNG — 8/8 occ** (distinct 8/8 đóng
    băng-tại-tick; baseline 78/368, p=4,07356e-06 trên distinct
    8/8 — đạt luật DEF §5 vì n=8 ≥3 và p<0,01). Cộng dồn
    91/110 → **101/120**. (Cơ số mẫu 110 ở đợt 164: 91/110 —
    xem đính chính dưới.)
  - **P3' 8/8 occ ĐẠT** (distinct 8/8; DAT seq 158 stall 4,
    182 stall 3, 211 stall 6, 236 stall 3, 335 stall 3, 360
    stall 3, 440 stall 3, 467 stall 7). Cộng dồn 76/84 →
    **84/92 occurrence**; distinct 71/74 → **78/81** (7 seq
    MỚI [158, 182, 211, 236, 335, 440, 467]; 360 đã DAT từ
    trước nên không cộng thêm distinct).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 46, 0: 42}; đối chứng toàn bộ drawSrc post: {-1: 298,
    0: 151}, 0/449 entry). Cộng dồn 63/63 → **64/64**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–164).
- **HELPER distinct-seq ĐỌC SỔ (quyết (t) đợt 162 + đính chính
  quyết (i) đợt 163 — ĐÃ DÙNG LIVE, KHÔNG KIỂM TAY).** Helper
  `distinct-seq-165.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 164: 71/74 distinct, occ 76/84), tính seq MỚI =
  tập hiệu với sổ, in cộng dồn mới distinct + occurrence, ghi
  sổ MỚI ra file riêng
  (`distinct-seq-ledger-165-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Back-test trước live (xem §0b):** chạy helper trên stall +
  c2coverage attempt2 đợt 164 với sổ as-of-164 → ra 71/74
  distinct, 0 seq mới — khớp số đã đính chính quyết (i) đợt
  163; sổ gốc KHÔNG đổi trong back-test. **Live đợt 165:**
  sổ + stall/c2coverage attempt2-9a1a9319 → **78/81 distinct,
  84/92 occ** — khớp tính tay độc lập dưới đây. Sổ đã thăng
  cấp: as-of 165, 78/81 distinct, occ 84/92, valid_rounds_p3
  18, non_dat_in_union [283, 364, 498] (KHÔNG đổi — không
  seq không-DAT cũ nào DAT thêm đợt này).
- **Kiểm chứng 8 seq đợt 165:** helper (đọc sổ) xác nhận
  **7 seq MỚI hoàn toàn** (158, 182, 211, 236, 335, 440, 467 —
  chưa có trong union 139–164) và **360 đã có trong seen_c2
  (74 seq) VÀ đã có trong seen_dat (71 seq)** — 360 từng DAT
  trong lượt hợp lệ trước; lần này stall 3 → DAT lại. Tính
  tay: distinct DAT 71 + 7 = **78**; distinct tổng 74 + 7 =
  **81**; occurrence 76 + 8 = **84**, 84 + 8 = **92**. Khớp
  helper. (Theo cách ghi cũ bằng grep LIMITS, 7 seq mới chưa
  từng xuất hiện trong (c2) của lượt hợp lệ nào; 360 đã xuất
  hiện và đã DAT — hai cách kiểm đồng thuận lần này.)
- **Đính chính cơ số P3-A1/P1 (ghi rõ để T10 khỏi kiểm lại):**
  LIMITS 164 §6 ghi cộng dồn P3-A1 "91/110 → 93/112" và P1
  "107/110 → 109/112" — mẫu số 110 ở đầu cộng dồn đợt 164,
  rồi đồng bộ 112 sau khi cộng 2 occ đợt 164. Đợt này:
  P3-A1 93/112 + 8/8 = **101/120**, P1 109/112 + 8/8 =
  **117/120** — mẫu số 120 = 112 + 8, nhất quán. T4 không
  tự suy diễn lý do mẫu số 110 (không có bằng chứng trong
  LIMITS 164); chỉ ghi nhận số đã đính chính.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — VÀ MẠNH HƠN:** lần đầu kể từ chuỗi
  lượt n=2 yếu (đợt 163–164), P1 VÀ P3-A1 cùng ĐÚNG với n=8
  (p ~1e-06–1e-07, vượt xa ngưỡng 0,01); P2 ĐÚNG 8/8 lag +1f;
  P3' ĐẠT 8/8; lag≥+5f (b) = 0 occurrence cả 2 attempt.
  Không có tiêu chí mở lại nào xảy ra theo §13 DEF v0.5.
- Chuỗi median tickCost 30 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 / 53,0 /
  57,0 / **43,0 ms** (trung bình ~47,9 ms; min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60). Lượt này 43,0 ms — thấp thứ 8
  trong chuỗi (7 lượt thấp hơn: 39,0/39,0/39,5/40,0×4).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 166

- **(a) #34 CÓ lượt hợp lệ — lượt hợp lệ #30 (chuỗi lượt yên
  hợp lệ NỐI DÀI #22 → #23 → #24 → #25 → #26 → #27 → #28 →
  #29 → #30).** Từ phía T4, **chân lượt yên cho chuỗi FULL PASS
  (O8) ĐÃ ĐẠT** — lượt yên #34 thuộc MỘT boot duy nhất
  (attempt hợp lệ trên boot 9a1a9319 #69 ứng viên; không có
  reboot xen giữa). O8 chạy trên boot nào, có qua gate chuẩn
  hay phải dùng thủ tục (i), là do T8/T10 quyết theo tiền lệ
  (quyết (h) đợt 157: chuỗi được tính khi O8 chạy sau lượt
  yên về thời gian, dù reboot xen giữa đổi boot — đợt này
  KHÔNG có reboot nên chân còn sạch hơn). T4 chỉ ghi dữ kiện,
  không tự kết luận chuỗi FULL PASS. Lưu ý: attempt hợp lệ
  chạy trên boot #69; gate cho attempt này mở qua **cờ T5**
  (POSTBOOT_PASS #69 đã có 20:43:50Z — xem §3); O8/T8 đối
  chiếu gate khi xét chuỗi.
- **(b) P3' cộng dồn MỚI 84/92 = 78/81 + 7 seq MỚI DAT
  (xem §6 + F-165-T4-2):** helper đọc sổ và kiểm chứng
  back-test + live; sổ distinct-seq-ledger.json là nguồn thật
  mới (as-of 165). **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới P1 117/120, P2 111/111, P3-A1 101/120, P3' 84/92 = 78/81,
  P7 64/64. T10 kiểm lại phép cộng khi viết aggregate (§12).
- **(c) PAGE-WEDGED KHÔNG tái diễn lần thứ chín liên tiếp (0
  wedge đợt 157 + 0 wedge đợt 158 + 0 wedge đợt 159 + 0 wedge
  đợt 160 + 0 wedge đợt 161 + 0 wedge đợt 162 + 0 wedge đợt
  163 + 0 wedge đợt 164 + 0 wedge đợt này — cả 2 attempt chạy
  đủ 20/20 sạch).** Chữ ký đợt 156 (2 wedge liên tiếp, fetch
  writePartial timeout 30 s) không xuất hiện. T4-166 tiếp tục
  theo dõi, ghi nhận nếu tái diễn; chưa mở điều tra riêng
  (quyết (j) đợt 156 giữ nguyên). Câu hỏi đợt 156 §7(c) (wedge
  có tính là "kẹt" cho chuỗi "P3 không kẹt" của T8 không) VẪN
  MỞ — đợt này không có wedge mới nên không thêm dữ kiện.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1 ĐÃ CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc đứng:**
  pre-flight bắt được bẫy W hardcode tái diễn TRƯỚC khi mở
  poller (xem F-165-T4-2); 0 file lạc hướng đợt này. T4-166
  áp dụng y hệt checklist này.
- **(e) lag≥+5f (b) = 0 occurrence cả 2 attempt: SẠCH.**
  Đây là số (a)/(b), không phải (c2); không dùng làm verdict.
  T10/T8 đối chiếu xem đợt 162 có phải nhiễu một lần không;
  T4 không mở điều tra riêng.
- **(f) RAM <500 MB: 0/13 poll — TRỞ LẠI 0 sau đợt 164 tái
  diễn 6/116.** Chuỗi "0 poll <500 MB" đợt 162–163 đứt ở
  đợt 164, nay nối lại (0/13 trên boot #69). RAM ≥1024:
  12/13 poll; RAM không còn là nguyên nhân chặn cửa chính
  đợt này (load mới là — xem F-165-T4-5). Ghi nhận để T9-165
  đối chiếu headroom/balloon trên boot #69.
- **(g) ĐIỂM MÙ LIVE-DIAG F-158-T8-4 (quyết (u) đợt 158) —
  GIỚI HẠN ĐỨNG, CHƯA BỔ SUNG KIỂM "NỘI DUNG TƯƠI".**
  HB128 heartbeat làm tươi log mtime nên live-diag dựa trên
  mtime có thể mù (live-diag 0/2 ở 85m4; đợt 164 đã kiểm
  chứng điểm mù là có thật theo hướng xấu). Đợt này **không
  có kẹt nào** (0 wedge, probe chạy sạch 20/20 cả 2 attempt)
  nên live-diag không được thử thách — không có dữ kiện mới
  về việc nó bắt được hay không bắt được kẹt. Ghi nhận làm
  giới hạn đứng; không bổ sung kiểm "nội dung tươi" theo
  quyết (u) — chờ parent quyết ở đợt 165 (đề xuất T8-165).
- **(h) HELPER distinct-seq ĐỌC SỔ — T4-166 chỉ cần chạy
  helper với stall + c2coverage của attempt hợp lệ; KHÔNG kiểm
  tay nữa.** Sổ nằm ở `hidden_files/round165-t4/
  distinct-seq-ledger.json` (as-of 165: 78/81 distinct, occ
  84/92) — T4-166 copy-forward sổ này (cùng thư mục làm việc)
  và chạy helper như §6. Lưu ý: helper ghi sổ mới ra file
  riêng, không sửa sổ gốc tại chỗ — T4-166 kiểm tra rồi mới
  thăng cấp. **LƯU Ý COPY-FORWARD:** 2 file `t4-attempt-inner.sh`
  / `check-classb-t4.sh` đợt này ĐÃ VÁ W — T4-166 copy từ bản
  làm việc đợt 165 (không copy từ round164-t4) và kiểm W bằng
  pre-flight mới (xem (d) + F-165-T4-2).
- **(i) Các nợ đứng khác giữ nguyên từ đợt 164 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#94?/#95? giao T2 (mù #88?
  MỞ, #94? (#62) MỞ, #95? (#63) MỞ theo quyết (b) đợt 163;
  mù #96? (#64) SƠ BỘ MỞ — điều tra đầy đủ giao T2-165);
  birefnet 0 thử (lần thứ 18 liên tiếp — đợt này không thử);
  u2net là fallback chính thức; kết cục run 164 + (m) #68/#69
  thuộc T7-165/T2-165; reboot #68/#69 ỨNG VIÊN chưa xác nhận
  (T0-165/T2-165); POSTBOOT_PASS #69 ĐÃ CÓ (T5-165,
  20:43:50Z — xem §3); **POSTBOOT_PASS #68 VẪN CHƯA CÓ**
  (T5-165 sở hữu — kiểm tra lúc mở đợt 166); **replay tự
  nhiên ĐÃ XONG trên boot #69 lúc T4 mở** (dpkg 1545 dòng,
  check-only exit 0 từ pre-flight).
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate mở 20:42:06Z
  (poll #3, attempt1 — KHÔNG hợp lệ) + 20:53:05Z (poll #12,
  attempt2-9a1a9319 — ĐẠT, qua cờ T5) → **GATE cho chuỗi FULL
  PASS ĐẠT từ phía T4** (có lượt yên hợp lệ #34 trên boot
  9a1a9319, không reboot xen giữa). T8 tự quyết thủ tục (i)
  sau waiter hết hạn / boot mới; T4 chỉ ghi dữ kiện, không
  tự kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-165.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-165.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-21T20:40:13Z - 2026-11-21T20:40:13Z, boot=9a1a9319
   RAM min=974 max=974 >=1024: 0/1 500-1023: 1/1 <500: 0/1
   load1<2: 1/1 load5<2: 1/1 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=1
   lock: khong=1
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 12 poll, 2026-11-21T20:40:35Z - 2026-11-21T20:53:05Z, boot=9a1a9319
   RAM min=1129 max=3845 >=1024: 12/12 500-1023: 0/12 <500: 0/12
   load1<2: 7/12 load5<2: 4/12 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=3, T5=9, khong-dat=0
   lock: khong=12
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 13
-- RAM toan phien: min=974 max=3845 >=1024: 12/13 <500: 0/13
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 2/13
   gan-mo? #3 2026-11-21T20:42:06Z boot=9a1a9319 RAM=2054 L1=1.79 L5=1.37 blk=0 apt=0 gate0=T4-check-only(pb_age=2) lock=khong t5=cu(mtime-cu)
   gan-mo? #12 2026-11-21T20:53:05Z boot=9a1a9319 RAM=2087 L1=1.14 L5=1.97 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 9a1a9319: 13 poll; RAM>=1024 lan cuoi: 2026-11-21T20:53:05Z #12; RAM<1024 lan dau: 2026-11-21T20:40:13Z #1 RAM=974
-- cong don P3' (MOI, 30 luot hop le): P1 117/120 P2 111/111 P3-A1 101/120 P3' 84/92 occ = 78/81 distinct-seq P7 64/64
-- chuoi median 30 luot: n=30 mean=47,9 min=39,0 max=60,0 vuot-60: 0
```
