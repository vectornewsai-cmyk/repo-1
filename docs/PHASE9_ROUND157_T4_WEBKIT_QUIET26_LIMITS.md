# PHASE9_ROUND157_T4_WEBKIT_QUIET26_LIMITS.md

**Đợt:** 157. **Luồng:** T4 — đo lượt yên WebKit #26 trên 1 boot
+ LƯỢT HỢP LỆ #22 (chuỗi nối lại sau 4 đợt trống #22–#25)
+ KHÔNG PAGE-WEDGED (0 wedge — chữ ký đợt 156 không tái diễn).
**Ngày:** 20–21/11/2026 (lượt cron 03:35 +07 21/11 = 20:35:51Z).
**Boot đo:** 348dab54 (ứng viên #56, btime 19:32:47Z — boot lúc mở;
KHÔNG có reboot mới trong lúc đo; reboot ứng viên #57 (boot
bcbaa3ad, btime 21:05:15Z) xảy ra SAU khi poller thoát, lúc T4 đang
đóng sổ — xem §3, không ảnh hưởng verdict #26).
**Trạng thái:
#26 CÓ LƯỢT HỢP LỆ — attempt1 chạy 1 lần duy nhất, ĐẠT NGAY,
ngân sách 3/3 chỉ dùng 1/3 (poller thoát 21:04:20Z, trước hạn cắt
22:30Z). Attempt1-348dab54 probe 20/20, LỚP B ĐẠT 5/5, tickCost
median 41,0 ms ≤60 (dư 19 ms). (c2)=11 occurrence / 8 distinct-seq,
COVERED 11/11. P1 ĐÚNG (10/11 occ), P2 ĐÚNG (11/11 lag ≥+1f, 0 âm),
P3-A1 SAI (4/11 occ, p=0,096), P3' 5/11 occ (DAT seq 168, 221, 301,
330, 360), P7 ĐÚNG (0 entry trễ ≥+1f). Chuỗi lượt yên hợp lệ NỐI
LẠI Ở #22 (dừng ở #21 từ đợt 151; 4 đợt trống #22–#25 đã dứt).
Cộng dồn MỚI (22 lượt hợp lệ): P1 79/80, P2 71/71, P3-A1 65/80,
P3' 44/52 occurrence = 44/47 distinct-seq, P7 56/56. Cờ T5-157 CÓ
cho boot đo (POSTBOOT_PASS 20:54:39Z, dpkg 1545).**

## 0. Verdict tổng

- **#26 CÓ LƯỢT HỢP LỆ (lượt hợp lệ #22, 1 attempt).**
  Ngân sách 3 attempt/đợt dùng **1/3** (chỉ attempt1; không retry,
  không attempt nào bị reboot giết). Poller thoát 21:04:20Z vì
  LUOT HOP LE — KHÔNG phải hết ngân sách hay hết hạn (hạn cắt
  22:30Z còn 1h26m).
- **Attempt1-348dab54 (21:00:27–21:04:20Z): probe 20/20, LỚP B
  ĐẠT 5/5, tickCost median 41,0 ms ≤60 (dư 19 ms) — LƯỢT HỢP
  LỆ.** Vite :5187 (giữ lock 208 s), WebKit 27.2, app boot OK,
  C2 draw log BẬT, rVFC TẮT, TAP BẬT. 20 pass (wall 2927–3376
  ms/pass): tickCost n=664, blendTick n=542, c2DrawLog n=1291.
  **tickCost total median= 41,0 ms (p90 67,0, max 109, min 28)**;
  hậu flip+2000 ms median 40,0. Per-pass median 37,0–61,0 ms —
  chỉ pass 17: 61,0 ms vượt 60 (1/20 pass; median tổng vẫn 41,0).
  **(c2)=11 occurrence / 8 distinct-seq, COVERED 11/11.**
  P3' stall: **5/11 occ ĐẠT** (seq 168 stall 5, 221 stall 4, 301
  stall 3, 330 stall 6, 360 stall 7; KHÔNG-ĐẠT: 283, 364, 498 —
  stall 1). lag≥+5f = 30 occurrence / 5 event (max +18f, xem §2).
  **p1p3p7 chạy TAY (F-148-T4-1): P1 ĐÚNG, P2 ĐÚNG, P3-A1 SAI,
  P7 ĐÚNG** (xem §6). **KHÔNG PAGE-WEDGED** — attempt chạy đủ
  20/20, 0 fetch timeout.
- **Poller: 25 poll thật** (1 test + 24 poller), **1 boot duy
  nhất, 1 instance duy nhất** (không chết/khởi động lại; fix
  F-155-T4-1 giữ vững đợt thứ hai). RAM ≥1024: 20/25; 0 poll
  <500 MB. **8 poll** load+RAM cùng đạt — **1 mở cửa** (#24),
  **7 bị chặn** (đều apt>0 + gate0 khong-dat, xem §1). Gate0:
  khong-dat 13 poll → T4-check-only 4 poll (#13–#16) → T5 8
  poll (#17–#24).
- **Chuỗi lượt yên hợp lệ: NỐI LẠI Ở #22.** Cộng dồn 22 lượt:
  P1 79/80, P2 71/71, P3-A1 65/80, **P3' 44/52 occurrence =
  44/47 distinct-seq**, P7 56/56. Chuỗi median tickCost 22 lượt:
  39,0–60,0 ms, mean ~48,6 ms, 0 lượt vượt 60.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc test poll, lúc đóng — không đổi; mọi poll đều
  tree=YES).
- **Cờ:** `hidden_files/round157-t4.done` viết ~21:1xZ (trong hạn
  cờ ~23:00Z), CÓ NỘI DUNG.

## 1. Poller — 25 poll thật, 1 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 348dab54
  (20:42:59Z):** poll #1 RAM=1094 MB, load1=0,94 load5=0,83,
  blockers=0, gate0=khong-dat (cờ T5 là của boot cũ 5353ed19 —
  round156-t5/POSTBOOT_PASS, mtime-cu; check-only FAIL: GST
  thiếu isomp4/libav + apt thiếu 11 gói, xem §3) → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế**. Poll này nằm trong
  `poll-test-157.log`; thống kê §A đã hợp nhất.
- **Instance 2 (không POLL_TEST), 24 poll, boot 348dab54
  (20:43:05–21:00:27Z):** RAM ≥1024: 19/24; load1<2: 17/24;
  load5<2: 12/24; gate0: T5=8 (#17–#24), T4-check-only=4
  (#13–#16), khong-dat=12; lock=khong 24/24; dpkg 2→1545;
  blockers>0: 1 poll (#5); apt>0: 15 poll.
- **Giai đoạn 1 — chờ replay (poll #1–#12, 20:43–20:51Z):**
  gate0 khong-dat suốt (cờ T5 cũ + check-only FAIL mỗi 4 poll:
  #1/#5/#9 đều CHUA DU). RAM nhúng 815–911 MB ở #3/#4/#5
  (3 poll <1024 liên tiếp, min 815 MB) rồi hồi 1010–2154 MB.
  load1 vọt 4,34 (#12) → 6,63–8,43 (#13–#15) khi các luồng
  khác chạy nặng. **Poll #5 (20:46:06Z): blockers=1**
  (comm-based; legacy-chuoi-con=4 — job vite/webkit của luồng
  khác; snapshot đã lưu, chỉ 1 poll bị ảnh hưởng).
- **Giai đoạn 2 — check-only PASS, tải chặn cửa (poll #13–#16,
  20:52–20:54Z):** check-only PASS từ #13 (20:52:09Z, đủ 11
  package) → gate0=T4-check-only (đường dự phòng quyết (j)
  đợt 143) NHƯNG **load1 6,63–8,43 / load5 3,05–4,43 + apt>0
  (#13–#15)** → cửa vẫn đóng. Poll #16 (20:54:25Z): apt=0,
  dpkg=1545 (replay xong) nhưng load5=3,92 → vẫn đóng.
- **Giai đoạn 3 — cờ T5 tới, chờ load5 hạ (poll #17–#24,
  20:55–21:00Z):** cờ T5 PASS từ #17 (POSTBOOT_PASS 20:54:39Z,
  dpkg 1545); RAM 1118–1784 MB, load1<2, blk=0, apt=0 — mọi
  điều kiện đạt TRỪ **load5 3,45 → 2,98 → 2,81 → 2,67 → 2,41
  → 2,33 → 2,05** (giảm dần khi các luồng khác xong việc).
  **Poll #24 (21:00:27Z): load5=1,76 <2** → **CỬA MỞ, chạy
  attempt1**. Sau attempt1 ĐẠT → poller thoát 21:04:20Z.
- **Phân rã 25 poll thật:** RAM≥1024: 20/25; RAM 500–1023:
  5/25 (#3 911, #4 815, #5 874, #7 1010, #8 1021); RAM<500:
  0/25. load1<2: 18/25; load5<2: 13/25. Chỉ 8 poll mà load +
  RAM cùng đạt — 1 mở cửa (#24), 7 bị chặn (đều apt>0 +
  gate0 khong-dat: test #1, poller #1/#2/#6/#9/#10/#11).
  gate0: T5 8 poll, T4-check-only 4 poll, khong-dat 13 poll
  (1 test + 12 instance-2). blockers>0: 1 poll (#5).
  apt>0: 16 poll (1 test + 15 instance-2 — apt-get/dpkg của
  replay/T5 repair). **KHÔNG có reboot trong phiên đo** (boot
  348dab54 suốt, btime 19:32:47Z, kiểm lúc attempt xong
  21:04:20Z).
- **RAM sập KHÔNG tái diễn:** đợt 154: 74/147 poll <500 MB;
  đợt 155: 2/123 poll <500 MB + 64 phút RAM <1024 liên tiếp;
  đợt 156: 0/32 poll <500 MB; đợt này: **0/25 poll <500 MB,
  dài nhất 3 poll <1024 liên tiếp (#3–#5)** — RAM mở 1094 MB,
  nhúng 815 MB rồi vọt 2154 MB ở #10 (balloon xả). Gate A RAM
  ≥1024 không phải nguyên nhân chặn cửa đợt này (khác đợt
  154/155) — cửa bị chặn bởi apt + load5.

## 2. Một attempt — ĐẠT NGAY, không wedge; (c2) 11 occurrence

- **Attempt1-348dab54 (21:00:27–21:04:20Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 41,0 ≤ 60, lớp B 5/5).** Vite :5187
  (giữ lock ~214 s), WebKit 27.2, app boot OK, C2 draw log BẬT,
  rVFC TẮT, TAP BẬT. 20 pass (wall 2927–3376 ms/pass):
  tickCost n=664, blendTick n=542, c2DrawLog n=1291.
  **tickCost total median= 41,0 ms (p90 67,0, max 109, min 28)**
  — dư 19 ms dưới cổng; hậu flip+2000 ms median 40,0.
  **Lớp B: ĐẠT 5/5** (B1 load5 cuối 1,39 ≤2,5; B2 load1 max
  2,53 ≤4 + ps-before/after chỉ có vite :5187 của chính T4;
  B3 không reboot; B4 pgrep -x=0, ps exact-comm=0, dpkg
  delta=0; B5 RAM min 1119 MB, 0 mẫu <500 MB, 0/101 mẫu
  <1024 MB). Sampler n=101. Per-pass: tickCost median/pass
  37,0–61,0 ms — **19/20 pass ≤60** (chỉ pass 17: 61,0 ms);
  load1 trong attempt 0,37–2,53 (thấp hơn hẳn lúc poll mở cửa
  — tải nền đã hạ); Pearson r=-0,29 median~load1_mean,
  r=-0,03 median~RAM_mean (chỉ mô tả). **KHÔNG PAGE-WEDGED:**
  0 fetch timeout, JSON đầy đủ 3.652.216 B, probe exit=0.
  **(c2)=11 occurrence / 8 distinct-seq, COVERED 11/11.**
  lag≥+5f = 30 occurrence / 5 event (max +18f tại seq 277–283,
  event 2: 12 occ, M=[34], lag max +18f) — đây là số (a)/(b)
  (label lag sau presented), không phải (c2); ghi nhận, không
  dùng làm verdict. **p1p3p7 chạy TAY (xem §6).**
- **Lưu ý trường JSON:** JSON đầy đủ lần này KHÔNG có trường
  `partial`/`passesDone` (chỉ `passes=20`) — khác JSON partial
  đợt 156 (xem F-156-T4-7). Probe chỉ ghi `partial=true` +
  `passesDone` khi wedged; JSON đầy đủ thì `passes` = số pass
  đã xong. T4 đã xác minh bằng run-webkit log (20/20 pass)
  + kích thước JSON, không chỉ dựa vào `passes`.

## 3. Replay/postboot trên boot mới — cờ T5 CÓ

- **Boot 348dab54 (ứng viên #56, btime 19:32:47Z):** replay
  VẮNG lúc mở (dpkg.log 2 dòng — rootfs rebuild). Replay tới
  tự nhiên trong phiên: dpkg 2 → 160 (#10) → 493 (#11) → 800
  (#12) → 1200 (#13) → 1545 (#16, 20:54:25Z). T5-157:
  **POSTBOOT_PASS mới viết 20:54:39Z (boot+1h21m52s; dpkg
  1545 dòng; cache 178 .deb, lists 37; postboot PASS độc lập
  exit 0, poll=0)**; cờ cũ lưu `POSTBOOT_PASS-5353ed19`.
  Gate0=T5 từ poll #17 (20:55:10Z). T4 check-only: FAIL ở
  poll #1/#5/#9 (GST thiếu isomp4/libav + apt thiếu 11 gói —
  repair/replay chưa xong), **PASS từ poll #13 (20:52:09Z,
  đủ 11 package)** — xem postboot-t4-157-gate0wait-*.log.
  Đường dự phòng T4-check-only làm gate0 ở #13–#16 (4 poll)
  nhưng tải chặn cửa; cờ T5 tới kịp từ #17 nên không lỡ lượt.
- **KHÔNG có reboot mới trong phiên đo:** boot 348dab54 lúc mở
  poller (20:43:05Z), lúc attempt1, và lúc poller thoát
  (21:04:20Z) — btime 19:32:47Z không đổi. Số hiệu #56 vẫn là
  ỨNG VIÊN (T2-157 xác nhận theo đếm chặt; mù #85?/#86?/#87?
  nếu có giao T2).
- **ADDENDUM — REBOOT ỨNG VIÊN #57 SAU KHI POLLER THOÁT (ghi
  21:05–21:10Z, sau khi viết xong verdict):** boot mới
  **bcbaa3ad, btime 21:05:15Z** (lấy từ `/proc/stat btime`
  theo quy tắc đứng mới đợt 156) — phát hiện lúc kiểm cuối
  (21:06:09Z, uptime 5 phút lúc 21:10:39Z). Reboot xảy ra
  **SAU khi poller thoát (21:04:20Z) và sau khi mọi phép đo
  hoàn tất** — mọi poll (25) và attempt1 đều trên boot
  348dab54, **verdict #26 KHÔNG bị ảnh hưởng**. Tất cả giao
  phẩm (LIMITS, 2 script snapshot, paths file, cờ) đều nguyên
  vẹn sau reboot (đã kiểm lại nội dung/md5). Số hiệu #57 là
  ỨNG VIÊN; mù #88? (nếu có) giao T2-157. POSTBOOT_PASS #57
  chưa có — giao T5-158 (watcher-157 chết theo #57).

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND157_T4_WEBKIT_QUIET26_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round157-t4/`):**
  `poll-wait-t4-157.sh` (deadline 22:30Z + cờ T5 round157-t5/ +
  fallback round156-t5/ + nhãn T4-157a), `run-attempt-157.sh`
  (đổi số vòng/đường dẫn/nhãn so với 156). **KHÔNG stage lại
  probe** (`probe121t3-ghost-k7.webkit.mjs` — byte-identical
  với bản đã stage đợt 148–156, md5 `4291e539...`) và **KHÔNG
  ghi đè `t4-attempt-inner.sh` / `check-classb-t4.sh`** (bản
  làm việc ở `hidden_files/round157-t4/` — inner có fix
  F-156-T4-1 đổi `round156-*` → `round157-*`, theo đúng mẫu
  149–156: chỉ stage 2 script trên; fix inner theo bản làm
  việc sang đợt 158).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-157.sh`, `run-attempt-157.sh`,
  `t4-attempt-inner.sh` (CÓ fix F-156-T4-1 đổi sang
  `round157-*`), `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-157.py` (thống kê §A — trích từ log gốc, không gõ tay),
  `distinct-seq-157.py` (helper cột distinct-seq — đợt này CÓ
  input mới: attempt1 8 distinct-seq, xem §6 + F-157-T4-5).
- **Log/evidence (hidden_files/round157-t4/, không stage):**
  `poll-t4.log` (start ×1 instance + 24 poll thật + CUA YEN MO
  ×1 + LUOT HOP LE), `poll-test-157.log` (test start + 1 poll
  thật + TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`, `postboot-t4-157-gate0wait-*.log` (check-only
  mỗi 4 poll: #1/#5/#9 FAIL, #13/#17/#21 PASS),
  `blockers-ps-5.txt` / `blockers-list-5.txt` (job vite/webkit
  của luồng khác, poll #5),
  `appendix-157.txt` (output stats-157.py),
  `preview-b-f3-flip-webkit-t4-attempt1-348dab54.json`
  (3.652.216 B, 20/20, md5 `1aaa82f34ea6790cf9946085ef232cee`)
  + `run-webkit-t4-attempt1-348dab54.log` +
  `load-mid-t4-attempt1-348dab54.log` (sampler n=101) +
  `ps-before/after-t4-attempt1-348dab54.txt`
  + `classb-t4-attempt1-348dab54.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-348dab54-*.txt` (9 file/attempt)
  + `analyze-t4-p1p3p7-attempt1-348dab54.txt`
  + `coverage-check-attempt1-348dab54.txt` (11/11)
  + `attempt-done-attempt1-348dab54` (exit 0).
  `analyze-l7-labellag.txt` + `lag5-detail.txt` là output mặc
  định của analyzer (ghi theo tên mặc định trong script —
  xem F-157-T4-6), nội dung trùng bản per-attempt.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 21:04:20Z vì LUOT HOP LE; vite :5187 +
  lock trống sau reboot #57).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round157-t4-quiet26.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round157-t4.done` (~21:1xZ — trong hạn
  cờ ~23:00Z, CÓ NỘI DUNG).

## 5. Sai số F-157-T4-1..6 (+ nợ cũ)

- **F-157-T4-1 — GỌI analyze-t4-p1p3p7.py THIẾU THAM SỐ seqs
  (sai số thao tác tay, phát hiện + sửa trong phiên).** Lần
  gọi đầu chỉ truyền JSON → `IndexError: list index out of
  range` (script đòi `sys.argv[2]` là danh sách seq CSV).
  Gọi lại đúng: `... "168,221,283,301,330,360,364,498"` →
  exit 0, output lưu `analyze-t4-p1p3p7-attempt1-348dab54.txt`.
  Không ảnh hưởng đo (poller đã thoát trước khi chạy tay).
- **F-157-T4-2 — SED COPY-FORWARD BỎ SÓT CHUỖI DEADLINE CỨNG
  TRONG HEADER LOG (bắt được TRƯỚC KHI CHẠY, đã vá).** Lệnh
  sed đổi `19:30Z` → `22:30Z` không chạm chuỗi
  `deadline=2026-11-20T19:30:00Z` trong 2 dòng echo header
  (dạng `T19:30:00Z`, không khớp mẫu `19:30Z` vì có chữ `T`
  dính trước). Phát hiện khi diff bản mới với bản gốc (diff
  cho thấy header vẫn 19:30:00Z trong khi `DEADLINE_S` đã
  22:30) → vá `s/T19:30:00Z/T22:30:00Z/` + grep kiểm lại
  (0 còn sót) rồi mới chạy test poll. Deadline thật trong
  script (`DEADLINE_S`) vốn đã đúng 22:30Z — chỉ header log
  in sai. Bài học copy-forward: deadline cứng xuất hiện ở 3
  dạng (`19:30:00 UTC`, `19:30Z`, `T19:30:00Z`) — phải grep
  cả 3 dạng sau sed.
- **F-157-T4-3 — RUNTIME RESTART GIÁN ĐOẠN LỆNH GIÁM SÁT
  (không mất dữ liệu đo).** Lệnh `sleep 480` theo dõi poller
  (session proc_8d5c14c5ade1) bị gián đoạn bởi runtime restart
  lúc ~21:0xZ — không có kết quả xác nhận. Lệnh này chỉ đọc
  (sleep + tail log), không ghi gì; poller chạy độc lập bằng
  nohup nên KHÔNG bị ảnh hưởng (vẫn poll, vẫn mở cửa #24,
  vẫn chạy attempt1 và thoát đúng). T4 kiểm lại log trên đĩa
  ngay sau đó, không chạy lại lệnh giám sát.
- **F-157-T4-4 — TAIL poll-t4.log THẤT BẠI Ở LẦN KIỂM ĐẦU
  (quirk phiên exec, không mất dữ liệu).** Ngay sau khi khởi
  động poller (20:43:55Z), `tail -5 poll-t4.log` báo "No such
  file" dù poller đã ghi dòng start 20:43:05Z — do phiên exec
  thoát sớm (output drain timeout) làm lệnh tail chạy trong
  ngữ cảnh khác. Kiểm lại trực tiếp 13 giây sau (20:44:08Z):
  file đã có, đủ poll #1/#2. Không ảnh hưởng đo.
- **F-157-T4-5 — HELPER distinct-seq-157.py IN "44/48" NGÂY
  THƠ (chưa trừ seq đã thấy — đã hiệu chỉnh tay).** Helper
  cộng thẳng `39+5` DAT distinct / `40+8` tổng distinct, giả
  định cả 8 seq đợt này đều mới. Grep LIMITS T4 các đợt
  trước cho thấy **seq 364 ĐÃ THẤY ở đợt 128** (lượt yên #7:
  (c2) seq 364, presented 35, label 34, lag +1f) → tổng
  distinct đúng là **40+7=47**, không phải 48. Số chính thức:
  **P3' 44/52 occurrence = 44/47 distinct-seq** (helper in
  44/48 là sai 1). Các seq DAT 168/221/301/330/360 đều mới
  (grep `seq N` + `c2seqs=[...]` không ra ở đợt nào trước —
  các hit 168/221 chỉ là p90=168,0 / dpkg=1545/221, không phải
  (c2)). Nợ: helper nên trừ seq cũ tự động (đọc LIMITS cũ
  hoặc giữ sổ distinct-seq) — giao T10/T4-158.
- **F-157-T4-6 — TÊN FILE MẶC ĐỊNH CỦA ANALYZER GÂY NHẦM
  (quirk có sẵn, không phải lỗi đợt này).**
  `analyze-t4-labellag.py:88` mặc định ghi
  `analyze-l7-labellag.txt` (tên đợt cũ L7) và
  `analyze-t4-lag5.py:52` mặc định ghi `lag5-detail.txt` khi
  không truyền tham số output — run-attempt chỉ truyền JSON
  nên 2 file này được ghi thêm bên cạnh bản per-attempt
  (`analyze-t4-attempt1-...-labellag.txt` /
  `-lag5.txt`, nội dung trùng). Không ảnh hưởng đo; ghi để
  ai đọc thư mục khỏi tưởng file lạ từ đợt khác. Nợ: đổi tên
  mặc định cho đúng đợt (giao T10 xem có cần vá analyzer
  không — analyzer byte-identical từ nhiều đợt, không tự sửa).
- **F-156-T4-1 — ĐÃ VÁ + THEO BẢN LÀM VIỆC SANG ĐỢT 157,
  CHƯA STAGE.** Mẫu `round156-*` trong t4-attempt-inner.sh đã
  đổi thành `round157-*` trong bản làm việc (kiểm bằng grep:
  dòng find + echo đều `round157-*`). Theo mẫu 149–156 inner
  KHÔNG stage vào repo nên fix này vẫn chỉ ở bản làm việc —
  sẽ theo sang đợt 158. Không có file đợt khác bị sửa trong
  cửa sổ attempt (find không ra file `round157-*` nào mới hơn
  marker ngoài chính round157-t4).
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-157 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này (lượt hợp lệ đầu tiên sau
  4 đợt trống).** p1p3p7 chạy TAY sau poller, exit 0, output
  lưu `analyze-t4-p1p3p7-attempt1-348dab54.txt` (xem §6). Nợ
  đứng ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn —
  mỗi đợt có attempt hợp lệ T4 phải chạy tay và ghi rõ.
- **F-150-T4-5 — ĐÓNG (giữ).** Test poll ghi riêng
  `poll-test-157.log` (exit 7); thống kê §A đã hợp nhất 1 poll
  test-log + 24 poll poll-t4.log = 25 poll thật, không cần tách
  tay.

## 6. P3' cộng dồn (MỚI — 22 lượt hợp lệ) + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 157 (MỚI): P1 79/80, P2 71/71,
  P3-A1 65/80, P3' 44/52 occurrence = 44/47 distinct-seq, P7
  56/56** (22 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 154 §6: "21 lượt hợp lệ" — nay 22).
- **Đóng góp lượt #26 (attempt1-348dab54, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=11 occurrence / 8 distinct-seq [168, 221, 283, 301,
  330, 360, 364, 498].
  - **P1 ĐÚNG — 10/11 occ** (distinct 7/8 gần run-end:
    168, 221, 283, 301, 330, 364, 498; chỉ seq 360 KHÔNG gần
    run-end — run_end gần nhất 364, lệch 4; baseline 48/394,
    p=2,85e-06 trên distinct 7/8; occ 10/11 vẫn ≥2/3 và
    p<0,01). Cộng dồn 69/69 → **79/80**.
  - **P2 ĐÚNG — 11/11 occ** lag ≥+1f, 0 lag âm (lag từng
    tuple: 1, 1, 6, 2, 1, 1, 1, 5, 2, 6, 3 — min +1f).
    Cộng dồn 60/60 → **71/71**.
  - **P3-A1 SAI — 4/11 occ** (distinct 4/8: 168, 301, 330,
    360 đóng băng-tại-tick; baseline 93/393, p=0,0961515 trên
    distinct 4/8; occ 4/11 vẫn SAI theo luật DEF §5). Cộng
    dồn 61/69 → **65/80**.
  - **P3' 5/11 occ ĐẠT** (distinct 5/8; DAT seq 168 stall 5,
    221 stall 4, 301 stall 3, 330 stall 6, 360 stall 7;
    KHÔNG-ĐẠT: 283, 364, 498 — stall 1). Cộng dồn 39/41 →
    **44/52 occurrence**; distinct 39/40 → **44/47** (7 seq
    mới: 168, 221, 283, 301, 330, 360, 498; seq 364 đã thấy
    đợt 128 — xem F-157-T4-5; helper in 44/48 là sai 1).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 47, 0: 51}; đối chứng toàn bộ drawSrc post: {-1: 294,
    0: 188}, 0/482 entry). Cộng dồn 55/55 → **56/56**.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** — không có điều kiện nào trong ba điều
  kiện mở lại (§13 DEF v0.5) xảy ra: (1) P1 ĐÚNG; (2) lag âm
  — KHÔNG (0); (3) +2f ≥3 — KHÔNG (+2f = 2 occurrence: seq
  283 lag 2, seq 364 lag 2). Lag +6f/+5f (seq 283, 364, 498)
  là lag (c2) dương, không phải điều kiện mở lại (cùng mẫu
  đợt 151 §4).
- Chuỗi median tickCost 22 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  40,0 / **41,0 ms** (trung bình ~48,6 ms; min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60). Lượt này 41,0 ms — thấp thứ 6
  trong chuỗi (sau 39,0 / 39,5 / 40,0 ×3).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại. Seq 283/498 (lag
  +6f, stall_truoc=1) KHÔNG phải mẫu 365-style — lag lớn nhưng
  stall trước ngắn; ghi nhận, không mở điều tra riêng.

## 7. Chờ quyết parent / nợ đợt 158

- **(a) #26 CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ NỐI LẠI Ở
  #22 (sau 4 đợt trống #22–#25).** Từ phía T4, **chân lượt
  yên cho chuỗi FULL PASS (O8) ĐÃ ĐẠT** — khác đợt 153–156
  (0 lượt hợp lệ). Nhưng reboot ứng viên #57 (bcbaa3ad, btime
  21:05:15Z) xảy ra SAU khi poller thoát — O8 chạy trên boot
  nào, có qua gate chuẩn hay phải dùng thủ tục (i) sau waiter
  hết hạn, là do T8/T10 quyết theo tiền lệ (quyết (f) đợt 155
  + (f) đợt 156: chuỗi chỉ tính lượt O8 chạy SAU MỘT LƯỢT YÊN
  HỢP LỆ — lượt yên #26 thuộc boot 348dab54, không thuộc boot
  bcbaa3ad). T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL
  PASS.
- **(b) P3' cộng dồn MỚI 44/52 = 44/47 (xem §6 + F-157-T4-5):**
  helper in 44/48 — T4 đã hiệu chỉnh tay thành 44/47 sau khi
  grep LIMITS cũ (seq 364 đã thấy đợt 128). T10 kiểm lại phép
  cộng khi viết aggregate (§12): P1 79/80, P2 71/71, P3-A1
  65/80, P3' 44/52 = 44/47, P7 56/56.
- **(c) PAGE-WEDGED KHÔNG tái diễn đợt này (0 wedge).** Chữ
  ký đợt 156 (2 wedge liên tiếp) không xuất hiện — attempt1
  chạy đủ 20/20 sạch. T4-158 tiếp tục theo dõi, ghi nhận nếu
  tái diễn; chưa mở điều tra riêng (quyết (j) đợt 156 giữ
  nguyên). Câu hỏi đợt 156 §7(c) (wedge có tính là "kẹt" cho
  chuỗi "P3 không kẹt" của T8 không) VẪN MỞ — đợt này không
  có wedge mới nên không thêm dữ kiện.
- **(d) F-157-T4-5 (helper distinct-seq chưa trừ seq cũ):**
  có nên vá helper đọc sổ distinct-seq cộng dồn (hoặc grep
  LIMITS cũ tự động) để T4-158 không phải hiệu chỉnh tay
  không? T4 không tự đổi — chờ T10/parent phán.
- **(e) F-155-T4-4 cadence check-only VẪN MỞ (xem §5
  F-156-T4-4):** đợt này check-only PASS #13 nhưng tải chặn
  cửa tới #24 — không mất lượt nhờ load5 hạ dần; câu hỏi có
  nên chạy check-only mỗi poll khi RAM đang ≥1024 vẫn chờ
  parent/T10 phán.
- **(f) F-157-T4-2 (sed bỏ sót dạng T19:30:00Z):** giao T10
  grep các script copy-forward của luồng khác xem còn chuỗi
  deadline cứng ở dạng chưa đổi không (cùng mẫu F-156-T4-1
  §7(f) đợt 156).
- **(g) Các nợ đứng khác giữ nguyên từ đợt 156 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#85?/#86?/#87? giao T2 (+ mù
  #88? nếu có, đi kèm #57); birefnet 0 thử (lần thứ 11 liên
  tiếp — đợt này không thử); u2net là fallback chính thức;
  run 156 kết cục thuộc T7-157; reboot #56 (ứng viên, boot
  348dab54) + #57 (ứng viên, boot bcbaa3ad) chờ T2 xác nhận
  số hiệu.
- **(h) Đối chiếu waiter/O8 (T8):** T4 gate mở 21:00:27Z;
  attempt1 ĐẠT → **GATE cho chuỗi FULL PASS ĐẠT từ phía T4**
  (có lượt yên hợp lệ #26 trên boot 348dab54). T8 tự quyết
  thủ tục (i) sau waiter hết hạn / boot mới #57; T4 chỉ ghi
  dữ kiện, không tự kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-157.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-157.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-20T20:42:59Z - 2026-11-20T20:42:59Z, boot=348dab54
   RAM min=1094 max=1094 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 1/1 load5<2: 1/1 blockers>0: 0 apt>0: 1
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 24 poll, 2026-11-20T20:43:05Z - 2026-11-20T21:00:27Z, boot=348dab54
   RAM min=815 max=2154 >=1024: 19/24 500-1023: 5/24 <500: 0/24
   load1<2: 17/24 load5<2: 12/24 blockers>0: 1 apt>0: 15
   gate0: T5=8, khong-dat=12, T4-check-only=4
   lock: khong=24
   dpkg 2->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 25
-- RAM toan phien: min=815 max=2154 >=1024: 20/25 <500: 0/25
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 8/25
   gan-mo? #1 2026-11-20T20:42:59Z boot=348dab54 RAM=1094 L1=0.94 L5=0.83 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #1 2026-11-20T20:43:05Z boot=348dab54 RAM=1091 L1=0.86 L5=0.81 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #2 2026-11-20T20:43:51Z boot=348dab54 RAM=1044 L1=0.75 L5=0.79 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #6 2026-11-20T20:46:51Z boot=348dab54 RAM=1178 L1=1.56 L5=1.27 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #9 2026-11-20T20:49:07Z boot=348dab54 RAM=1515 L1=1.91 L5=1.38 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #10 2026-11-20T20:49:53Z boot=348dab54 RAM=2154 L1=1.51 L5=1.35 blk=0 apt=2 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #11 2026-11-20T20:50:38Z boot=348dab54 RAM=2010 L1=1.70 L5=1.45 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #24 2026-11-20T21:00:27Z boot=348dab54 RAM=1734 L1=0.40 L5=1.76 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 348dab54: 25 poll; RAM>=1024 lan cuoi: 2026-11-20T21:00:27Z #24; RAM<1024 lan dau: 2026-11-20T20:44:36Z #3 RAM=911
-- cong don P3' (MOI, 22 luot hop le): P1 79/80 P2 71/71 P3-A1 65/80 P3' 44/52 occ = 44/47 distinct-seq P7 56/56
-- chuoi median 22 luot: n=22 mean=48,6 min=39,0 max=60,0 vuot-60: 0
```
