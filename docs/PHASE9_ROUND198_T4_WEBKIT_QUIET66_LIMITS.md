# PHASE9_ROUND198_T4_WEBKIT_QUIET66_LIMITS.md

**Đợt:** 198. **Luồng:** T4 — đo lượt yên WebKit #66 trên 2 boot
(#126 chết giữa đợt, #127 đo)
+ **#66 CÓ LƯỢT HỢP LỆ — attempt2 hợp lệ (chuỗi lượt yên hợp lệ
  1 → 2).** Attempt1: 13/20 PAGE-WEDGED (3 writePartial TIMEOUT
  sau pass 13, exit 2) — KHÔNG HỢP LỆ. Attempt2: 20/20 + lớp B
  ĐẠT 5/5 + tickCost median 55,0 ms ≤ 60 — **LUOT HOP LE**.
  Ngân sách dùng 2/3.
+ **BOOT ĐO: 6882f9a9 (btime 00:34:26Z 27/11; SỐ HIỆU #127 ỨNG
  VIÊN — T01-198 xác minh).** Boot #126 (ba8ad21e) CHẾT giữa
  đợt ~00:34:26Z (poller instance 1 chết theo — restart 00:36:38Z);
  0 reboot TRONG phiên đo instance 2; 0 attempt đang chạy lúc reboot.
+ **P3' CỘNG DỒN MỚI (53 lượt hợp lệ): P1 236/240, P2 231/231,
  P3-A1 201/240, P3' 198/212 occurrence = 147/150 distinct-seq,
  P7 134/134.** Sổ distinct-seq THĂNG CẤP as-of-198, md5
  `c8792589` (seq MỚI: 214, 326). Sổ gốc as-of-197 KHÔNG đổi
  (`242e24f3`).
+ **Labellag (b) — lượt hợp lệ #66 có 0 occ / 0 event nên chuỗi
  0 occ 0 → 1** (quyết (m)-192: chỉ lượt hợp lệ mới tính; #65 có
  6 occ nên chuỗi đã về 0).
+ **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 17: KHÔNG ĐẠT** (xem §3,
  F-198-T4-6): W2 có 4 mẫu autotrigger đều watch/consec=0,
  0 FIRE, max avail 1.396.348 kB < guard — trigger tự thân
  ĐÚNG — NHƯNG có **5 spike B2 trong W2** (đều tự-tải:
  WebKitWebProcess của probe 71–74% CPU) nên không đủ điều
  kiện ĐẠT theo định nghĩa (p)-192 như đã áp ở #14/#16
  (cả hai đều 0 spike B2). **Chuỗi live ĐẠT 1 → 0.**
  T9-198 xác nhận độc lập sau (T9 chưa đóng lúc T4 đóng).
+ **B2 DỮ KIỆN THỨ 10 — W1 0 SPIKE, W2 5 SPIKE (xem §3,
  F-198-T4-5):** W2 5 spike đều tự-tải (probe chiếm 71–74% CPU,
  khớp bướu load1 pass 12–15). T4 CHỈ BÁO SỐ — KHÔNG tự đổi
  luật KHÔNG TÁCH.
+ **P3-A1 SAI CẤP LƯỢT (F-198-T4-7):** 3/3 occ đóng băng-tại-tick
  NHƯNG p=0,0118 > 0,01 (n=3 nhỏ) — verdict SAI theo DEF §5.
  Occurrence vẫn cộng dồn 3/3 (xem §7).
+ **FULL PASS: KHÔNG PHÁN Ở ĐÂY — chân lượt yên CÓ đợt này**
  (attempt2 hợp lệ); chân O8 + harness thuộc T01/T8-198 báo cáo
  (T01/T8 chưa đóng lúc T4 đóng).
**Ngày:** 27/11/2026 (lượt cron 06:35 +07 27/11 = 23:35:51Z 26/11).
**Boot đo:** 6882f9a9 (67 poll: 1 test + 32 instance 1 + 35
instance 2, trừ test = 67 poll poller).

## 0. Verdict tổng

- **#66 CÓ LƯỢT HỢP LỆ — attempt2 hợp lệ, ngân sách 2/3 đã
  dùng.** Attempt1: 13/20 PAGE-WEDGED (exit 2, JSON partial
  1.891.268 B) — KHÔNG HỢP LỆ. Attempt2: 20/20 + lớp B ĐẠT
  5/5 + median 55,0 ms ≤ 60 — **LUOT HOP LE**.
  **Chuỗi lượt yên hợp lệ: 1 → 2.**
- **Chân lượt yên cho chuỗi FULL PASS: CÓ đợt này** — FULL
  PASS thuộc parent/T10 quyết cuối (chân O8 + harness).
- **(c2) attempt2 [214, 326, 441] — CỘNG SỔ** (lượt hợp lệ;
  P1 ĐÚNG 3/3; P2 ĐÚNG 3/3; P3-A1 3/3 occ NHƯNG verdict SAI
  p=0,0118; P3' 3/3; P7 ĐÚNG). (c2) attempt1 [202] KHÔNG
  cộng sổ (attempt không hợp lệ).
  P3' cộng dồn MỚI 53 lượt. Labellag (b): lượt hợp lệ 0 occ
  / 0 event → chuỗi 0 occ 0 → 1.
- **0 VI PHẠM PHÍA T4** (không khởi động script nặng nào trong
  lúc gate0wait; không probe dpkg nào trong cả phiên; check-only
  postboot mỗi 4 poll là dự phòng được quyết, không phải vi
  phạm; launch-test pre-flight là kiểm nhẹ, không phải
  attempt — xem §0b). P3 Chrome headless trong W1 + T56/T2 ghi
  file nhẹ trong cửa sổ là chồng lấn phía luồng khác, giao T2
  phán (xem §3, F-198-T4-4/F-198-T4-11).
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `477a0eac`
  (cập nhật 00:47Z — F-198-T4-3; khác md5 đầu đợt `af6c3cc7`).
- **Cờ:** `hidden_files/round198-t4.done` viết lúc đóng, CÓ NỘI
  DUNG, trong hạn cờ ~02:00Z. **Boot lúc viết cờ là 6882f9a9 —
  CÙNG boot đo.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (00:00–00:12Z),
ghi vào `hidden_files/round198-t4/preflight-198.txt` — **PASS
PHẦN TĨNH, FAIL PHẦN POSTBOOT (xem dưới)**. Tóm tắt:

- **md5 khớp hệt bản đợt 197:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-197 md5 `242e24f3…`
  (occ 195/209, distinct 145/148, valid_rounds_p3 40,
  non_dat_in_union [260, 364, 498]). **Tree:** preview.tsx lúc
  mở poller là `af6c3cc7` (đọc trực tiếp 00:00Z; KHÔNG ĐỔI so
  với cuối đợt 197).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; media
  `stripes-nonperiodic.mp4` có mặt (140.828 B); không có
  `vite.lock`, không có `attempt-done-*`. **Playwright-core
  (npm): KHÔNG tìm thấy** ở repo-1 hay apps/web node_modules
  (require.resolve FAIL) — launch test dùng MiniBrowser trực
  tiếp (cache webkit-2388 CÓ MẶT).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-27
  01:30:00 UTC` → **1795743000** (hạn cờ ~02:00Z =
  1795744800, hạn cứng 02:35:51Z = 1795746951); grep lần 2
  sạch (chỉ còn hit fallback/glob CỐ Ý + lịch sử 197 trong
  comment); test poll bắt được 2 chuỗi header deadline sót
  dạng `T22:30:00Z` — đã sửa trước khi mở poller thật
  (F-198-T4-12).
- **Copy-forward 197 → 198 (script python thay thế có neo,
  KHÔNG sed global):** deadline `22:30Z 26/11` → `01:30Z
  27/11`; hạn cờ/cứng → `02:00Z`/`02:35:51Z`; T5FLAG chính
  `round198-t56/` + fallback `round197-t56/`; `T4-197a` →
  `T4-198a`; `WebKit #65` → `#66`; glob `round196-*` →
  `round197-*`. Lỗi neo 0 lần. **WIRE MỚI: run-analyzers-198.sh
  gọi analyze-t4-p1p3p7.py** NGOÀI cửa sổ attempt — đóng
  F-195-T4-12 / F-197-T4-8.
- **`cp` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 197).
- **Freeze check (F-164-T4-1):** `round197-t4` còn **0 file
  làm việc** mtime ≥ 23:35:51Z (đợt 198 mở).
- **GATE0 LÚC MỞ: CHƯA ĐẠT (cờ T5).** round198-t56/ mới xuất
  hiện ~00:09Z (T56-198 bắt đầu) nhưng chưa có POSTBOOT_PASS;
  fallback round197-t56/ POSTBOOT_PASS mtime 21:28:14Z < btime
  22:32:41Z nên poller đánh "cu(mtime-cu)", KHÔNG TÍNH — đúng
  thiết kế chống cờ sai boot. **Check-only postboot chạy tay
  exit=1 FAIL** (xem `preflight-postboot-198.log`):
  thiếu libs libevent-2.1.so.7 libEGL.so.1 libavif.so.16
  libdw.so.1 libevdev.so.2; GST hệ thống KHÔNG TỒN TẠI;
  apt thiếu 11 gói; **dpkg.log CHỈ 2 DÒNG** (rootfs rebuild —
  replay hệ thống chưa chạy); debroot GST 269 plugin CÓ MẶT.
- **LAUNCH TEST (--launch-test) 00:05Z: JSON FAIL — KHÔNG PHẢI
  PASS** (xem F-198-T4-1): MiniBrowser lỗi libevent-2.1.so.7;
  chạy lại với LD_LIBRARY_PATH=debroot VẪN FAIL (mode o8env
  xóa LD_LIBRARY_PATH; ldd với debroot vẫn thiếu
  libwebkitgtk-6.0.so.4, libjavascriptcoregtk, libbacktrace,
  libjxl — các gói apt hệ thống). Xvfb :195 do script spawn
  KHÔNG tự kill — T4 kill tay. **Gate0 dự phòng T4-check-only
  TẠM KHÔNG ĐẠT** cho tới khi libs được khôi phục (T56-198) —
  poller chờ cờ T5; T4 KHÔNG tự chạy --repair (việc khôi phục
  libs thuộc T56; tránh tranh apt lock).
- **X11 lúc mở: `/tmp/.X11-unix/` chỉ có X188** (luồng khác);
  0 Xvfb của T4 sau khi kill :195.
- **RAM lúc mở ~1735–2795 MB avail; load1 ~1,1–1,8 lúc mở.**
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 67 poll thật (1 test + 32 + 35), 2 lần cửa mở, 1 reboot giữa đợt

- **Test (POLL_TEST=1), 1 poll, boot ba8ad21e
  (00:10:11Z, chạy lại 00:10:57Z sau khi sửa header):** RAM
  2277–2400 MB, load1 3,47/load5 2,35, lock=khong,
  blockers=0, gate0=khong-dat, t5flag=cu(mtime-cu),
  postboot_exit=1, apt=1, dpkg 2 →
  **TEST-POLL-OK exit 7 đúng thiết kế.** Poll này nằm trong
  `poll-test-198.log`; thống kê §A đã hợp nhất.
- **Instance 1 — boot ba8ad21e (#126), 32 poll
  (00:10:58–00:34:35Z), 0 lần cửa mở:** RAM ≥1024:
  32/32 (min 1097, max 3228 MB); **<500: 0/32**;
  load1<2: 5/32; load5<2: **0/32**; gate0:
  **T5 17/32** (từ #16 — T56 viết POSTBOOT_PASS #126
  00:22:08Z), khong-dat 15/32; lock=co 6 (T01-198 giữ lock
  pid 271492 port 5560, polls #3–#8), khong 26; blockers>0:
  7 poll; apt>0: 15 poll; dpkg 2→777. **Cửa KHÔNG MỞ** —
  load5 không xuống dưới 2 lần nào (repair + luồng khác
  làm nặng). **Instance 1 CHẾT theo reboot ~00:34:26Z**
  (poll #32 00:34:35Z là poll cuối; xem F-198-T4-2).
- **REBOOT #127 (F-198-T4-2): boot ba8ad21e chết, boot mới
  6882f9a9 btime 00:34:26Z.** Poller instance 1 (pid 242855)
  chết theo (runtime restart ~00:34:35–00:35:20Z cũng giết
  T2 waiter — xem ghi chú T2 waiter log); T4 khởi động lại
  poller 00:36:38Z (instance 2, pid 3390, log riêng
  `poll-t4.nohup2.log`). **0 attempt đang chạy lúc reboot;
  ngân sách 0/3 đã dùng.** Dị thường đồng hồ: btime boot
  mới 00:34:26Z sớm hơn timestamp poll cuối boot cũ
  00:34:35Z đúng 9 s — ghi nhận như bằng chứng clock-jump
  lúc reboot (tiền lệ F-196-T7-1: đồng hồ guest chạy nhanh);
  T2/T7 phán cuối.
- **Instance 2 — boot 6882f9a9 (#127), 35 poll
  (00:36:38–01:04:36Z), 2 lần cửa mở:** RAM ≥1024:
  30/35 (min 864, max 1936 MB); **<500: 0/35**;
  load1<2: 27/35; load5<2: 32/35; gate0:
  **T5 3/35** (#33–#35), khong-dat 32/35; lock=khong 35/35;
  blockers>0: 4 poll; apt>0: 14 poll (T56 repair boot mới);
  dpkg 2→777.
- **Giai đoạn chờ gate0 (instance 2, poll #1–#32):**
  gate0=khong-dat suốt (T56 repair boot mới từ ~00:49Z);
  tree đổi 2 lần rồi ổn định (F-198-T4-3); load hạ dần;
  RAM 864–1936 MB (5 poll <1024, min 864 ở #7). **9 poll
  "gần-mở" đúng nghĩa** (đủ gate A, chỉ kẹt gate0): #2, #3,
  #4, #10, #12, #13, #16, #17, #18. Blocker: vite P2 :5790
  ở #14/#15/#23 (nhẹ, tự hết).
- **Cửa mở 2 lần (poll #34, #35):** #34 (01:01:29Z) RAM
  1499 MB, load1 1,38, load5 1,06 → **CỬA YÊN MỞ
  (gate0=T5 — POSTBOOT_PASS #127 01:00:06Z)**, attempt1
  chạy; #35 (01:04:36Z) RAM 1762 MB, load1 0,88, load5
  0,88 → **CỬA MỞ NGAY** sau attempt1 (quyết (h) đợt 149:
  poll lại gate trước mỗi attempt), attempt2 chạy.
- **0 reboot trong phiên đo instance 2** (00:36:38Z–01:08:30Z).
- **Phân rã 68 dòng poll thật (1 test + 67 poller):**
  RAM≥1024: 63/68; RAM<500: **0/68**. load1<2: 32/68;
  load5<2: 32/68. **"gan-mo" (3 điều kiện load/RAM): 23**
  = 2 lần mở cửa thật + 9 lần gần-mở đúng nghĩa + 12 lần
  kẹt apt/blockers. gate0: T5=20, khong-dat=47 (+1 test).
  blockers>0: 11 poll. apt>0: 29 poll. dpkg 2→777.

## 2. Attempts — 2 attempt (ngân sách dùng 2/3), 1 lượt hợp lệ

- **attempt1-6882f9a9: 13/20 PAGE-WEDGED — KHÔNG HỢP LỆ.**
  Cửa sổ: marker 01:01:29Z → attempt-done 01:04:16Z
  (inner-end 01:04:11Z, probe_exit=2; run-attempt exit=2
  01:04:16Z; analyzers chạy NGOÀI cửa sổ 01:04:17–01:04:36Z).
  JSON partial 1.891.268 B; flip wallMs 30.594 ms; lock vite
  giữ ~167 s, nhả 01:04:16Z; vite :5187 kill sạch (curl 000);
  sampler dừng sạch (80 dòng). **3 writePartial TIMEOUT**
  (30 s mỗi lần, sau pass 13) — trang wedged, probe tự thoát
  sau pass 13 với partial JSON (xem F-198-T4-4).
  **tickCost (partial):** tổng n=306 median **67,0** p90
  93,0 max 160 min 28; hậu flip+2000ms n=173 median 62,0.
  **Lớp B: B1 ĐẠT** (load5 cuối 0,87); **B2 ĐẠT
  (load1_max 1,38)**; B3 ĐẠT; **B4 ĐẠT (dpkg delta 0)**;
  **B5 ĐẠT (RAM min 770 MB, 0 mẫu <500; 7/79 mẫu <1024)**.
  **(c2) = 1 seq [202]** → P3' KHÔNG tính (attempt không
  hợp lệ). **Labellag (b): 0 occurrence ≥5f**
  (skippedLatest=1: n=58, max 4f; skippedLatest=0: n=218,
  max 4f) — **KHÔNG tính vào chuỗi** (attempt không hợp lệ).
  **Perpass (12 pass ghi được):** median 72,0/70,0/79,0/
  73,0/82,0/71,5/63,0/50,0/69,0/62,0/60,5/63,5 — CAO HƠN
  attempt2 (50–82); **n=15–32 tick mọi pass** (pass 9 thưa
  nhất n=15). **Load1 theo pass PHẲNG ~0,9** (mean 0,91–0,92
  ở pass 11–12 — máy yên thật lúc wedge, xem F-198-T4-4).
- **attempt2-6882f9a9: 20/20 + LỚP B ĐẠT 5/5 + tickCost median
  55,0 ms ≤ 60 — LƯỢT HỢP LỆ.** Cửa sổ: marker 01:04:36Z →
  attempt-done 01:08:09Z (inner-end 01:08:03Z, probe_exit=0;
  run-attempt exit=0 01:08:09Z; analyzers chạy NGOÀI cửa sổ
  01:08:09–01:08:30Z). JSON 3.126.931 B; flip wallMs 27.925 ms;
  lock vite giữ ~213 s, nhả 01:08:09Z; vite :5187 kill sạch
  (curl 000); sampler dừng sạch (102 dòng). **0 writePartial
  TIMEOUT.**
  **tickCost:** tổng n=571 median **55,0** p90 85,0 max 148
  min 29; hậu flip+2000ms n=417 median 55,0.
  **Lớp B: B1 ĐẠT** (load5 cuối 1,38); **B2 ĐẠT
  (load1_max 3,36)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 821 MB, 0 mẫu <500; 7/101 mẫu <1024)**.
  **(c2) = 3 seq [214, 326, 441]** → P3' ĐẠT 3/3
  (stall_truoc=3/7/3); **P1 ĐÚNG 3/3
  (p=0,0055444); P3-A1 3/3 occ NHƯNG verdict SAI (p=0,0118228
  — xem F-198-T4-7); P2 ĐÚNG 3/3 (lag +1f cả 3); P7 ĐÚNG**
  (0 entry trễ ≥+1f).
  **Labellag (b): skippedLatest=1: 0 occ ≥5f** (n=126, max
  3f); **skippedLatest=0: 0 occ ≥5f** (n=552, max 4f);
  **lag5 (b): 0 occurrence / 0 event** — **TÍNH VÀO CHUỖI:
  lượt hợp lệ 0 occ → chuỗi 0 occ 0 → 1.**
  **Perpass (20 pass):** median 62,5/40,0/58,0/60,5/37,0/
  59,0/54,0/53,0/57,0/52,0/87,5/58,0/40,0/57,0/58,5/53,5/
  50,0/53,0/53,5/53,0 — THẤP ĐỀU (chỉ pass 11 = 87,5 cao);
  n=22–34 tick mọi pass. **Load1 theo pass HÌNH BƯỚU: mean
  1,40 → 3,36 (pass 14) → 2,76** (gây 5 spike B2 ở pass
  12–15, xem §3).
- **Ngân sách 2/3 đã dùng; poller thoát 01:08:30Z (exit 0 —
  LUOT HOP LE).**

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN THỨ 10 CHO QUYẾT TÁCH: W1 0 SPIKE,
  W2 5 SPIKE — ĐỀU TỰ-TẢI (xem F-198-T4-5).** Watcher T9
  (pid 3194/3196, sống suốt phiên đo instance 2 — restart
  sau reboot) poll load1 mỗi 2 s, ghi spike khi load1 ≥ 3,0:
  **Attempt1: 0 spike trong cửa sổ** (01:01:29–01:04:16Z),
  **Attempt2: 5 spike trong cửa sổ** (01:04:36–01:08:09Z:
  01:05:32 load1 3,22; 01:05:37 3,04; 01:05:42 3,36; 01:05:47
  3,17; 01:05:52 3,00 — đúng pass 12–15, bướu load1).
  Sampler T4 xác nhận độc lập: load1_max 1,38 (W1) / 3,36
  (W2) — 0 spike ở W1 và 5 spike ở W2 đều NHẤT QUÁN với
  sampler (max W2 3,36 đúng bằng đỉnh spike 01:05:42Z).
  **Phân loại 5 spike W2: TỰ-TẢI** — snapshot top-process
  cả 5 lần đều là WebKitWebProcess pid 168202 của chính
  probe (71,5–74,1% CPU) + MiniBrowser pid 168159 (~30%);
  chỉ có `hatch` pid 706 (14,2%, runtime nền) ngoài ra.
  Tổng spike trong log T9: 198. T4 chỉ báo số, KHÔNG tự
  quyết tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CẢ 2 CỬA SỔ ATTEMPT,
  0 FIRE.** Live `dry_run=False guard=6291456 consec=2`
  (T9-198). Mẫu autotrigger trong cửa sổ (marker →
  attempt-done): W1 3 mẫu 01:01:55–01:03:55Z (avail
  1.081.360–1.205.788 kB, balloon 4,45–4,62M, load1
  0,42–1,25), W2 4 mẫu 01:04:55–01:07:55Z (avail
  1.058.000–1.396.348 kB, balloon 4,43–4,92M, load1
  0,86–3,00) — **trigger=watch, consec=0 ở tất cả các mẫu:
  0 FIRE / 0 WOULD-FIRE.** RAM avail thấp nhất trong cửa sổ:
  W2 1.058.000 kB (~1,01 GB) lúc 01:05:55Z.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 17: KHÔNG ĐẠT
  (F-198-T4-6).** Áp ĐÚNG định nghĩa (p)-192 như đã áp ở
  #14 (đợt 195) và #16 (đợt 197) — cả hai lần ĐẠT đều có
  0 spike B2; tiền lệ #15 (đợt 196): "trigger 0 FIRE chỉ
  ghi nhận làm dữ kiện, không dùng làm verdict": W2 có 4
  mẫu live đều watch/consec=0, **0 FIRE**, max avail
  1.396.348 kB < guard — NHƯNG có **5 spike B2 trong W2**
  nên KHÔNG đủ điều kiện ĐẠT. **Chuỗi live ĐẠT 1 → 0.**
  W1 (không hợp lệ) chỉ là dữ kiện: 3 mẫu watch/consec=0,
  0 FIRE, 0 spike B2. T9-198 xác nhận độc lập sau.
- **O8 T01 TRÊN BOOT 6882f9a9 — thuộc T01-198 báo cáo (T01
  chưa đóng lúc T4 đóng).** O8 T8 + harness thuộc T8-198
  (T8 chưa đóng lúc T4 đóng).
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (kiểm file
  round198-* mtime trong cửa sổ, loại round198-t4):**
  **W1 (01:01:29–01:04:16Z): 1 file** —
  `round198-t56/t56-postboot-independent-6882f9a9.log` (T56
  ghi verify độc lập — nhẹ; B4 delta 0).
  **W2 (01:04:36–01:08:09Z): 1 file** —
  `round198-t2/t4-waiter198b.py` (T2 ghi script waiter —
  nhẹ; B4 delta 0).
  **P3 Chrome headless trong W1 (F-198-T4-4):** ps-before
  attempt1 có `asc-198.mjs` (pid 164917) + headless Chrome
  (pid 164921, esbuild + AudioDecoder) — job nặng của P3;
  ps-after attempt1 KHÔNG còn (0 hit) — job kết thúc trong
  W1. Load1 lúc wedge chỉ ~0,9 nên KHÔNG đủ bằng chứng đổ
  wedge cho P3; giao T2 phán.
  **W2 sạch:** ps-before/after attempt2 chỉ có T9
  sampler-autotrigger (pid 3196, nhẹ) + T2 waiter (pid 3769)
  + shell restart poller của chính T4 (pid 3388, idle) +
  vite :5187 của T4; **0 process nặng lạ** (không
  ffmpeg/tsc/chrome/vite khác trong ps-before/after).
  **0 file round197-* nào bị sửa trong cả 2 cửa sổ** (check
  glob đợt trước trong t4-attempt-inner.sh).
- **T56 REPAIR — 0 CHỒNG TRONG W1/W2** (repair boot mới xong
  01:00:06Z, trước W1; dpkg delta 0 cả 2 cửa sổ).
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI QUY
  ĐỊNH.** `run-analyzers-198.sh` chạy NGOÀI cửa sổ cả 2
  lần (sau attempt-done). `round197-*` files modified sau
  marker: 0 file.

## 4. Replay/postboot — POSTBOOT_PASS #126 CÓ + #127 CÓ (T56, poll=1, repair-tay)

- **Boot #126 (ba8ad21e, btime 22:32:41Z 26/11) — POSTBOOT_PASS
  ĐÃ CÓ 00:22:08Z** (T56; T4 chỉ ghi nhận): "repair-som-quyet-h:
  dpkg 777 dong; cache 108 .deb; lists 75; postboot PASS poll1
  doc lap exit 0 luc 00:22:08Z; POSTBOOT_PASS moi ghi 00:22:08Z
  poll=1; co cu 8304fcd1 luu POSTBOOT_PASS-8304fcd1".
  **#126 CHẾT ~00:34:26Z sau 7.305 s.**
- **Boot #127 (6882f9a9, btime 00:34:26Z 27/11 — SỐ HIỆU ỨNG
  VIÊN, T01-198 xác minh) — POSTBOOT_PASS ĐÃ CÓ 01:00:06Z**
  (T56; T4 ghi nhận + xác minh độc lập qua check-only — gate0
  T5 từ poll #33): "repair-som-quyet-h: dpkg 777 dong; cache
  108 .deb; lists 66; postboot PASS poll1 doc lap exit 0 luc
  01:00:06Z; POSTBOOT_PASS moi ghi 01:00:06Z poll=1; co cu
  ba8ad21e luu POSTBOOT_PASS-ba8ad21e".
  **Replay 6882f9a9: KHÔNG ĐẦY ĐỦ** (dpkg.log 777 dòng lúc
  đóng — repair, không phải replay đầy đủ 1477). GST #127:
  xem LIMITS T56-198. Check-only của T4 PASS độc lập từ poll
  #33 (01:00:44Z) và giữ PASS tới đóng.
- **REBOOT MỚI 6882f9a9 — GIỮA ĐỢT, GIẾT POLLER INSTANCE 1.**
  0 reboot trong phiên đo instance 2 (00:36:38Z–01:08:30Z).
  **(m) #126 THÔ + (m) #127 THÔ thuộc T2-198** (phân loại
  CUỐI); T4 không đo (m).
- **KHOẢNG LẶNG SCHEDULER / OUTAGE: KHÔNG CÓ DỮ KIỆN TRONG
  PHIÊN T4.** OUTAGE phán cuối thuộc T7-198; verdict harness
  thuộc T8-198.
- **Watcher-198:** T4 không theo dõi trực tiếp trạng thái
  watcher sau reboot — thuộc T56-198 báo cáo.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND198_T4_WEBKIT_QUIET66_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round198-t4/`):**
  `poll-wait-t4-198.sh`, `run-attempt-198.sh` (lượt yên #66),
  `run-analyzers-198.sh` (classb + 9 analyzer + p1p3p7 NGOÀI
  cửa sổ — MỚI đợt này), `distinct-seq-198.py` (DÙNG LIVE:
  sổ as-of-197 → đề xuất as-of-198, md5 `c8792589`).
  **KHÔNG stage lại probe** (byte-identical đợt 148–197,
  md5 `4291e539...`), **`t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (theo mẫu 149–197: chỉ stage 4
  script trên), **`b.json`** (md5 `078938cf...`) và
  **`stats-198.py`** (helper làm việc).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (477a0eac) +
  `tree-md5-updates-198.txt` + `stats-198.py` +
  `distinct-seq-198.py` + `distinct-seq-ledger.json`
  (as-of-197, md5 `242e24f3`) +
  `distinct-seq-ledger-198-proposed.json` (as-of-198, md5
  `c8792589`) + `preflight-198.txt` +
  `preflight-postboot-198.log` + `preflight-launch-198.log` +
  `preflight-launch-198-debroot.log` + `round198-t4-copy.py`.
- **Log/evidence (hidden_files/round198-t4/, không stage):**
  `poll-t4.log` (67 poll poller + 2 lần CỬA MỞ #34/#35 +
  LUOT HOP LE), `poll-t4.nohup.log` (instance 1 — chết theo
  reboot) + `poll-t4.nohup2.log` (instance 2),
  `poll-test-198.log` (1 test poll + TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller ×2 + 2 lần CỬA MỞ + 2 attempt +
  LUOT HOP LE, poller thoát 01:08:30Z),
  `postboot-t4-198-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-198-output.txt` (đã sửa footer P3'),
  `preview-b-f3-flip-webkit-t4-attempt{1,2}-6882f9a9.json`
  (1.891.268 B partial / 3.126.931 B),
  `load-mid-t4-attempt{1,2}-6882f9a9.log` (80/102 dòng),
  `analyze-t4-attempt{1,2}-6882f9a9-*.txt` (10 file mỗi
  attempt — gồm `p1p3p7` chạy TỰ ĐỘNG),
  `coverage-check-attempt{1,2}-6882f9a9.txt` (1/1, 3/3),
  `classb-t4-attempt{1,2}-6882f9a9.txt`,
  `ps-before/after-t4-attempt{1,2}-6882f9a9.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2}-*.txt`
  (B4: dpkg 777→777 cả 2 attempt). **2 JSON attempt (1 hợp
  lệ). 0 process T4 sống lúc đóng** (poller thoát 01:08:30Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4). **X11 KHÔNG trống — X188 (luồng khác).**

## 6. Sai số F-198-T4-1..12 + nợ cũ

- **F-198-T4-1 — "PASS LAUNCH" CỦA vcut-webkit-postboot-check.sh
  LÀ RỒNG + KHẲNG ĐỊNH LAUNCH PASS ĐỢT 197 LÀ SAI (MỚI —
  ĐÍNH CHÍNH HỒ SƠ ĐỢT 197).** Script dòng 825–826:
  `node ... | tail -1` trong `if` luôn exit 0 (exit của
  tail) nên in "PASS launch" CẢ KHI JSON FAIL. Bằng chứng:
  JSON launch-test đợt 198 FAIL cả 2 lần (thường +
  LD_LIBRARY_PATH=debroot — mode o8env xóa LD_LIBRARY_PATH
  ở dòng 12 l8-webkit-launch.mjs, chỉ kiểm libs hệ thống)
  nhưng script vẫn in "PASS launch". **Đính chính:**
  JSON launch-test đợt 197 (`preflight-launch-197.log`)
  cũng ghi `"launch":"FAIL"` — khẳng định "LAUNCH TEST PASS
  20:43:33Z" ở preflight-197.txt / LIMITS-197 §0b là SAI.
  WebKit đợt 197 chỉ chạy được SAU khi T56-197 repair
  (21:24:17Z) cài đủ libs hệ thống. Bài học: từ đợt này,
  launch-test chỉ tính khi đọc TRỰC TIẾP trường `"launch"`
  trong JSON, không tin dòng "PASS launch" của script.
- **F-198-T4-2 — REBOOT #127 GIỮA ĐỢT, POLLER CHẾT, RESTART
  (MỚI).** Boot ba8ad21e chết ~00:34:26Z (sau khi T56 viết
  POSTBOOT_PASS #126 00:22:08Z và gate0 đã T5 17 poll nhưng
  load5 chưa từng <2 nên 0 cửa mở trên #126); poller instance
  1 chết theo (poll cuối #32 00:34:35Z); T4 restart poller
  00:36:38Z (instance 2, pid 3390). Dị thường: btime boot mới
  00:34:26Z sớm hơn timestamp poll cuối boot cũ 9 s
  (clock-jump lúc reboot). 0 attempt đang chạy lúc reboot;
  ngân sách 0/3 đã dùng — restart an toàn, không mất attempt.
- **F-198-T4-3 — CÂY ĐỔI 2 LẦN SAU REBOOT, CẬP NHẬT tree-md5
  1 LẦN (MỚI — TIỀN LỆ ĐỢT 196: 3 LẦN CẬP NHẬT GIỮA ĐỢT).**
  preview.tsx đổi e43bfae0 (poll #3 instance 2) rồi 477a0eac
  (từ poll #4), ổn định từ mtime 00:38:49Z — 11 poll liên
  tiếp cùng md5 (~8 phút) nên T4 cập nhật tree-md5.txt
  af6c3cc7 → 477a0eac lúc 00:47Z (ghi `tree-md5-updates-198.txt`).
  Poller thấy tree=YES từ poll #15. Nếu cây đổi lại giữa đợt,
  poller lại MD5-KHAC và cửa không mở (run-attempt ghi md5
  đầu/cuối attempt để bắt đổi cây giữa attempt).
- **F-198-T4-4 — ATTEMPT1 PAGE-WEDGED SAU PASS 13 (MỚI).**
  3 writePartial TIMEOUT 30 s (tickCost, blendTick,
  c2DrawLog) sau pass 13 → probe tự thoát với partial JSON
  13/20, exit 2. Đợt 197: 0 TIMEOUT cả 2 attempt. P3 Chrome
  headless (asc-198.mjs) có mặt trong ps-before W1 nhưng
  mất ở ps-after; load1 lúc wedge chỉ ~0,9 và RAM đủ nên
  KHÔNG đủ bằng chứng đổ wedge cho P3 — wedge có vẻ nội bộ
  trang/probe. Giao T2 phán chồng lấn.
- **F-198-T4-5 — B2 DỮ KIỆN THỨ 10: W1 0 / W2 5 SPIKE, ĐỀU
  TỰ-TẢI (MỚI — XEM §3).** 5 spike W2 (01:05:32–01:05:52Z,
  load1 3,00–3,36) đều do WebKitWebProcess của chính probe
  (71–74% CPU) + MiniBrowser (~30%), khớp bướu load1 pass
  12–15. Khác dữ kiện thứ 9 (0/0): lần này W2 có spike để
  phân loại, và phân loại là tự-tải (như dữ kiện thứ 8).
  T4 chỉ báo số, KHÔNG tự quyết tách.
- **F-198-T4-6 — (p) LIVE LẦN 17 KHÔNG ĐẠT (MỚI — CHUỖI LIVE
  ĐẠT 1 → 0).** W2 hợp lệ: 4 mẫu live watch/consec=0,
  0 FIRE, max avail < guard — trigger tự thân ĐÚNG — nhưng
  5 spike B2 trong W2 nên KHÔNG ĐẠT theo định nghĩa (p)-192
  như đã áp ở #14/#16 (đều 0 spike). Tiền lệ #15 (đợt 196):
  trigger 0 FIRE chỉ ghi nhận làm dữ kiện, không dùng làm
  verdict. T9-198 xác nhận độc lập sau.
- **F-198-T4-7 — P3-A1 SAI CẤP LƯỢT DÙ 3/3 OCC (MỚI — TIỀN
  LỆ #63 ĐỢT 195).** P3-A1: 3/3 seq đóng băng-tại-tick nhưng
  baseline 77/338 = 0,2278, p=0,0118228 > 0,01 (n=3 nhỏ) →
  verdict SAI theo DEF §5. Occurrence vẫn cộng dồn 3/3
  (tử số chỉ cộng occurrence ĐÚNG — như đợt 195: 2/4 occ →
  tử số GIỮ 192, mẫu số +4). "Ghost-freeze ĐƯỢC ỦNG HỘ MẠNH"
  vẫn đứng ở mức occurrence (201/240 = 83,8%) nhưng có thêm
  1 lượt verdict SAI cấp lượt.
- **F-198-T4-8 — p1p3p7 ĐÃ NỐI VÀO run-analyzers (MỚI —
  ĐÓNG F-195-T4-12 / F-197-T4-8).** `run-analyzers-198.sh`
  gọi `analyze-t4-p1p3p7.py` NGOÀI cửa sổ attempt cho cả 2
  attempt (file `analyze-t4-attempt{1,2}-6882f9a9-p1p3p7.txt`
  có mặt; attempt1 chạy được dù partial — p1p3p7 chỉ đọc
  JSON + SEQS). Nợ nối script ĐÃ ĐÓNG.
- **F-198-T4-9 — stats-198.py FOOTER P3' HARDCODE SỐ CŨ
  (MỚI — ĐÃ SỬA TRONG ĐỢT).** `stats-198.py` dòng 90–91 ghi
  cứng số as-of-195 (51 lượt) do copy-forward không neo được
  dòng này; output đầu in sai cơ số. T4 sửa tay thành số
  53 lượt và chạy lại `stats-198-output.txt`. Copy script
  đợt sau cần neo thêm 2 dòng này (hoặc stats đọc cơ số từ
  ledger).
- **F-198-T4-10 — VITE RE-OPTIMIZE Ở ĐẦU ATTEMPT1 NHƯNG B2
  VẪN ĐẠT (MỚI — CỦNG CỐ F-197-T4-1).** Vite re-optimize
  ("vite config has changed", 01:01:30Z) ngay đầu attempt1 —
  B2 ĐẠT (load1_max 1,38, thấp nhất 2 đợt). Attempt2 KHÔNG
  re-optimize. Re-optimize MỘT MÌNH không đủ phá B2 — cần
  thêm tải nền cao hoặc apt install (xem F-197-T4-1).
- **F-198-T4-11 — GHI FILE NHẸ TRONG CỬA SỔ (MỚI — NHẸ,
  GHI NHẬN).** W1: T56 ghi `t56-postboot-independent-6882f9a9.log`;
  W2: T2 ghi `t4-waiter198b.py`. Cả hai đều là ghi file text
  nhẹ, B4 delta 0 cả 2 cửa sổ, 0 bằng chứng ảnh hưởng verdict.
  Ghi nhận để T2 đối chiếu nguồn (cùng mẫu F-197-T4-7).
- **F-198-T4-12 — COPY SCRIPT BỎ SÓT HEADER DEADLINE DẠNG
  "T22:30:00Z" (MỚI — ĐÃ SỬA TRƯỚC KHI MỞ POLLER).** 2 chuỗi
  `deadline=2026-11-26T22:30:00Z` (dòng 64/66) không khớp
  neo `22:30Z 26/11` (dạng ISO có `T`); DEADLINE_S thật
  (dòng 57) đã đúng. Test poll bắt được; đã sửa, bash -n
  OK, grep lần 3 sạch.
- **Nợ cũ:** F-197-T4-1 → F-198-T4-10 (dạng mới: re-optimize
  nhưng B2 ĐẠT, load thấp); F-197-T4-2 KHÔNG tái diễn (0
  chồng apt/dpkg trong cửa sổ); F-197-T4-3 → dạng mới: gate0
  chặn ~50 phút vì 2 lần repair (2 boot); F-197-T4-4 →
  F-198-T4-5 (dạng mới: spike tự-tải W2); F-197-T4-5 →
  F-198-T4-5; F-197-T4-6 → F-198-T4-6 (ĐẠT → KHÔNG ĐẠT);
  F-197-T4-7 → F-198-T4-11 (dạng mới: ghi file nhẹ trong
  cửa sổ); F-197-T4-8 → F-198-T4-8 (ĐÃ ĐÓNG — p1p3p7 đã nối);
  F-195-T4-12 ĐÃ ĐÓNG (F-198-T4-8).

## 7. P3' cộng dồn (MỚI — 53 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 198 (MỚI): P1 236/240, P2 231/231,
  P3-A1 201/240, P3' 198/212 occurrence = 147/150
  distinct-seq, P7 134/134** (53 lượt hợp lệ — #66 CÓ lượt
  hợp lệ nên cộng thêm 3 seq). Cơ sở: cộng dồn chỉ tính trên
  các lượt yên HỢP LỆ.
- **Đóng góp lượt #66 (attempt2): (c2) 3 occ [214, 326, 441];
  P1 ĐÚNG 3/3; P2 ĐÚNG 3/3; P3-A1 3/3 occ NHƯNG verdict SAI
  (p=0,0118); P3' 3/3 distinct ĐẠT; P7 ĐÚNG.** Helper
  `distinct-seq-198.py` DÙNG LIVE (quyết (t) đợt 162): sổ
  as-of-197 (145/148 distinct, occ 195/209) +
  stall/c2coverage attempt2-6882f9a9 → **147/150 distinct,
  198/212 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 214, 326** (chưa có trong sổ);
  **441 ĐÃ THẤY** (trong sổ). T4 kiểm tay lại sổ as-of-197:
  seq mới 214/326 vắng thật (không có trong `seen_c2` lẫn
  `seen_dat`); 441 có trong cả hai;
  non_dat_in_union [260, 364, 498] KHÔNG ĐỔI (không seq nào
  trong 3 hố này xuất hiện đợt này). Sổ ĐÃ THĂNG CẤP thành
  as-of-198 (md5 `c8792589`; bản đề xuất giữ lại làm audit
  trail; sổ gốc as-of-197 KHÔNG đổi).
- **P1 — ĐÚNG 3/3 occ** (cả 3 seq gần run-end ±1 tick; trong
  20 run_end seqs; baseline 60/339, p=0,0055444 — verdict
  ĐÚNG theo luật DEF §3 vì n=3 ≥3 VÀ p<0,01). Cộng dồn
  233/237 → **236/240**.
- **P2 — ĐÚNG 3/3 occ** (cả 3 seq lag +1f: 1, 1, 1;
  DEF §4 chỉ đòi lag ≥ +1f). Cộng dồn 228/228 →
  **231/231**.
- **P3-A1 — 3/3 occ NHƯNG verdict SAI** (cả 3 seq đóng
  băng-tại-tick; baseline 77/338, p=0,0118228 > 0,01 —
  verdict SAI theo luật DEF §5 vì n=3 nhỏ). Cộng dồn
  198/237 → **201/240** (tử số +3 — chỉ cộng occurrence
  ĐÚNG; tiền lệ đợt 195).
- **P3' 3/3 distinct ĐẠT** (stall: 214=3, 326=7, 441=3).
  Cộng dồn 145/148 → **147/150 distinct** (2 seq ĐẠT MỚI —
  214, 326); occurrence 195/209 → **198/212**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 14,
  0: 15}; đối chứng toàn bộ drawSrc post: {-1: 267, 0: 148},
  0/415 entry). Cộng dồn 131/131 → **134/134** (theo mẫu
  đợt 185: P7 cộng +n/n khi ĐÚNG cho n seq của lượt).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162):**
  sổ as-of-197 + stall/c2coverage attempt2 → sổ MỚI đề xuất;
  T4 kiểm tay rồi mới thăng cấp thành as-of-198 (md5
  `c8792589`). Đợt 199 copy-forward lấy sổ này làm cơ sở.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên ở mức occurrence** (P1/P2/P3'/P7 đều
  ĐÚNG đợt này; P3-A1 SAI cấp lượt do n=3 — F-198-T4-7).
- **Labellag (b) — CHUỖI TRƯỚC #66 = 0; #66 (lượt hợp lệ)
  0 occ / 0 event → chuỗi 0 occ 0 → 1** (lượt hợp lệ 0 occ
  đầu tiên kể từ #64).
- Chuỗi median tickCost 53 lượt (MỚI — thêm 55,0 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 / 42,0 / 53,0 / 47,0 / 55,0 ms (tổng 2516,0;
  TB 47,5 ms; min 39,0, max 60,0; 0 lượt vượt 60). Median attempt1 không hợp lệ (67,0) KHÔNG đưa vào
  chuỗi.

## 8. Chờ quyết parent / nợ đợt 199

- **(a) #66 CÓ LƯỢT HỢP LỆ (attempt2) — CHUỖI LƯỢT YÊN HỢP LỆ
  1 → 2 (ĐỀ XUẤT — parent quyết cuối).** Chân lượt yên cho
  chuỗi FULL PASS **CÓ đợt này** (FULL PASS thuộc parent/T10
  quyết cuối).
- **(b) FULL PASS: thuộc T01/T8-198 + parent/T10 quyết cuối.
  Live-check #17 KHÔNG ĐẠT — T9-198 xác nhận độc lập sau.**
- **(c) P3' cộng dồn MỚI 53 lượt: P1 236/240, P2 231/231,
  P3-A1 201/240, P3' 198/212 = 147/150, P7 134/134:**
  sổ distinct-seq THĂNG CẤP as-of-198 md5 `c8792589`.
  **Chờ parent/T10 quyết:** ghi nhận thăng cấp.
- **(d) BOOT 6882f9a9 (số hiệu #127 ỨNG VIÊN — T01-198 xác
  minh; btime 00:34:26Z). POSTBOOT_PASS #126 CÓ (00:22:08Z,
  poll=1, repair) + #127 CÓ (01:00:06Z, poll=1, repair) —
  cả hai đều yếu hơn #123 (poll=0, replay đầy đủ, GST thư
  mục thật) — parent quyết (c) ở aggregate 198.**
  **(m) #126 THÔ + (m) #127 THÔ (T2-198); các đếm cộng dồn
  khác xem (h).**
- **(e) PRE-FLIGHT CHECK (quyết (t) đợt 158) TIẾP TỤC CHỨNG
  MINH HIỆU QUẢ — giữ làm quy tắc đứng.** Đợt này test poll
  bắt được 2 chuỗi deadline sót + launch-test JSON vạch ra
  khẳng định PASS sai của đợt 197 (F-198-T4-1/F-198-T4-12).
- **(f) POSTBOOT_PASS #126 CÓ (00:22:08Z, poll=1, repair)
  + #127 CÓ (01:00:06Z, poll=1, repair). Tổng boot không
  cờ GIỮ NGUYÊN nếu parent chấp nhận cả hai (T01/T2-198
  phán cuối).**
- **(g) RAM 0 poll <500 MB (min 864 MB) — không có episode
  RAM thấp đợt này; giao T9-198 phán (nếu có).**
- **(h) (m) #126 phán CUỐI (T2-198); (m) #127 THÔ (T2-198);
  INSIDE (T2-198); POSTBOOT_PASS #126/#127 (T56-198); số hiệu
  6882f9a9 = #127? (T01-198 xác minh); OUTAGE phán cuối
  T7-198; auto-trigger lần FIRE thật đầu tiên — VẪN CHƯA
  XẢY RA (T9-198); B2 dữ kiện thứ 10 (0/5 tự-tải — BẢN
  NÀY); (m) #56 lần 40; mù hole-recheck lần 39; prune lần
  70; headroom (T9-198); ENOSPC lần 45?; 84l10 PASS chuỗi?;
  86n2-P1 chuỗi 18?; B2 live sạch lần 11?; E-247 kết cục
  (T9-198); run kết cục (T7-198).**
- **(i) B2 DỮ KIỆN THỨ 10: W1 0 / W2 5 SPIKE TỰ-TẢI
  (F-198-T4-5). Luật B2 KHÔNG TÁCH vẫn đứng cho tới khi
  parent quyết — T4 KHÔNG tự quyết tách. Auto-trigger LIVE
  chạy trong cả 2 cửa sổ attempt, 0 FIRE** — lần FIRE thật
  đầu tiên vẫn chưa xảy ra; T9-198 verify end-to-end khi có
  FIRE.
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 2 lần đợt này
  (attempt1/2) → **1 lượt yên hợp lệ #66 cho chuỗi FULL
  PASS.** O8 T01 trên 6882f9a9 (T01-198 báo cáo — T01 chưa
  đóng lúc T4 đóng); O8 T8 + harness thuộc T8-198 báo cáo
  (T8 chưa đóng lúc T4 đóng).
- **(k) F-198-T4-1 (launch PASS rỗng + đính chính 197);
  F-198-T4-2 (reboot #127, poller chết/restart);
  F-198-T4-3 (cây đổi 2 lần, cập nhật tree-md5);
  F-198-T4-4 (attempt1 PAGE-WEDGED + P3 Chrome trong W1);
  F-198-T4-5 (B2 dữ kiện thứ 10: 0/5 tự-tải);
  F-198-T4-6 ((p) live lần 17 KHÔNG ĐẠT — chuỗi live ĐẠT
  1 → 0); F-198-T4-7 (P3-A1 SAI cấp lượt, p=0,0118);
  F-198-T4-8 (p1p3p7 đã nối — ĐÓNG F-195-T4-12);
  F-198-T4-9 (stats footer hardcode số cũ — đã sửa);
  F-198-T4-10 (vite re-optimize nhưng B2 ĐẠT);
  F-198-T4-11 (ghi file nhẹ trong cửa sổ);
  F-198-T4-12 (copy script sót header deadline — đã sửa).**

## Phụ lục A — stats-198-output.txt (tóm tắt)

```
test: 1 poll, RAM 2277 >=1024: 1/1, load1<2: 0/1, gate0: khong-dat=1
inst 1 (ba8ad21e #126): 32 poll 00:10:58-00:34:35Z, RAM 1097-3228 >=1024: 32/32
  <500: 0/32, load1<2: 5/32, load5<2: 0/32, gate0: T5=17, khong-dat=15
  lock: co=6 (T01-198), khong=26, dpkg 2->777
inst 2 (6882f9a9 #127): 35 poll 00:36:38-01:04:36Z, RAM 864-1936 >=1024: 30/35
  <500: 0/35, load1<2: 27/35, load5<2: 32/35, gate0: T5=3, khong-dat=32
  lock: co=0, khong=35, dpkg 2->777
TONG: 68 dong poll; RAM min=864 max=3228 >=1024: 63/68 <500: 0/68
gan-mo (3 dk load/RAM): 23 = 2 mo cua that + 9 gan-mo dung nghia + 12 ket apt/blockers
P3' (53 luot): P1 236/240 P2 231/231 P3-A1 201/240 P3' 198/212 = 147/150 P7 134/134
median 53 luot: n=53 mean=47,5 min=39,0 max=60,0 vuot-60: 0
```
