# PHASE9_ROUND199_T4_WEBKIT_QUIET67_LIMITS.md

**Đợt:** 199. **Luồng:** T4 — đo lượt yên WebKit #67 trên boot
#128 (773743f2) — 3 attempt, 0 lượt hợp lệ
+ **#67 KHÔNG CÓ LƯỢT HỢP LỆ — ngân sách 3/3 đã dùng, cả 3
  attempt đều 20/20 probe NHƯNG lớp B vi phạm (B1+B2).**
  Attempt1: 20/20 + tickCost median 102,0 ms, B1 VI PHAM (load5
  cuối 5,77), B2 VI PHAM (load1 max 14,60). Attempt2: 20/20 +
  tickCost median 70,0 ms, B1 VI PHAM (load5 cuối 2,70 — sát
  bar), B2 VI PHAM (load1 max 4,88 — sát bar). Attempt3: 20/20
  + tickCost median 94,0 ms, B1 VI PHAM (load5 cuối 3,44),
  B2 VI PHAM (load1 max 8,73). **Chuỗi lượt yên hợp lệ
  2 → 0 (ĐỀ XUẤT — parent quyết cuối).**
+ **BOOT ĐO: 773743f2 (btime 05:01:50Z 27/11; SỐ HIỆU #128 ỨNG
  VIÊN — T01-199 xác minh).** Boot e6e070b8 (btime 06:38:56Z)
  đến SAU khi poller thoát 3 giây (06:38:53Z) — 0 attempt đang
  chạy lúc reboot; ứng viên #129 thuộc T01-200 survey
  (T01-199 đã đóng).
+ **P3' CỘNG DỒN KHÔNG ĐỔI (53 lượt hợp lệ): P1 236/240, P2
  231/231, P3-A1 201/240, P3' 198/212 occurrence = 147/150
  distinct-seq, P7 134/134.** Sổ distinct-seq KHÔNG thăng cấp
  (md5 `c8792589` giữ nguyên — as-of-198). (c2) các attempt
  không hợp lệ ([105], [], [301]) KHÔNG cộng sổ.
+ **Labellag (b) — 3 attempt đều 0 occ / 0 event ≥5f NHƯNG
  không attempt nào hợp lệ nên chuỗi 0 occ 1 → 0 (ĐỀ XUẤT)**
  (quyết (m)-192: chỉ lượt hợp lệ mới tính).
+ **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 18: KHÔNG ĐẠT** (xem §3,
  F-199-T4-6): KHÔNG CÓ cửa sổ hợp lệ nào để kiểm (cả 3 attempt
  đều nhiễm tải); 12 mẫu autotrigger trong 3 cửa sổ đều
  watch/consec=0, 0 FIRE, max avail 3.304.076 kB < guard —
  trigger tự thân ĐÚNG — NHƯNG mỗi cửa sổ có 33–43 spike B2
  nên không đủ điều kiện ĐẠT theo định nghĩa (p)-192 như đã
  áp ở #14/#16 (cả hai đều 0 spike). **Chuỗi live ĐẠT
  0 → GIỮ 0.** T9-199 xác nhận độc lập sau (T9 chưa đóng lúc
  T4 đóng).
+ **B2 DỮ KIỆN THỨ 13 — W1 43 / W2 33 / W3 39 SPIKE (xem §3,
  F-199-T4-5).** W1 hỗn hợp (tự-tải probe ~68% + Chrome P1
  ~74%); W2 chủ yếu ngoại-tải (node MainThread 103–110%,
  tsc/test luồng khác); W3 không quy được cho 1 process cố
  định (snapshot giữa cửa sổ không process nào >13,1%).
  T4 CHỈ BÁO SỐ — KHÔNG tự đổi luật KHÔNG TÁCH.
+ **FULL PASS: KHÔNG CÓ — chân lượt yên KHÔNG có đợt này**
  (0 lượt hợp lệ); chân O8 + harness thuộc T01/T8-199 báo cáo.
**Ngày:** 27/11/2026 (lượt cron 12:35 +07 27/11 = 05:35:51Z).
**Boot đo:** 773743f2 (51 poll: 1 test + 50 poller, trừ test = 50
poll poller).

## 0. Verdict tổng

- **#67 KHÔNG CÓ LƯỢT HỢP LỆ — ngân sách 3/3 đã dùng, poller
  thoát 06:38:53Z (exit 11 — hết ngân sách, 0 lượt hợp lệ).**
  Cả 3 attempt đều probe 20/20 (exit 0) nhưng lớp B vi phạm
  B1+B2, tickCost median đều >60 ms (102,0 / 70,0 / 94,0).
  **Chuỗi lượt yên hợp lệ: 2 → 0 (ĐỀ XUẤT).**
- **Chân lượt yên cho chuỗi FULL PASS: KHÔNG có đợt này** —
  FULL PASS thuộc parent/T10 quyết cuối (chân O8 + harness).
- **(c2) KHÔNG cộng sổ đợt này:** attempt1 [105] + attempt2 []
  + attempt3 [301] đều thuộc attempt KHÔNG hợp lệ → P1/P2/
  P3-A1/P3'/P7 cộng dồn GIỮ NGUYÊN 53 lượt. Sổ distinct-seq
  KHÔNG thăng cấp (md5 `c8792589`).
  Labellag (b): 3 attempt đều 0 occ / 0 event ≥5f NHƯNG không
  attempt nào hợp lệ → **chuỗi 0 occ 1 → 0 (ĐỀ XUẤT)**.
- **0 VI PHẠM PHÍA T4** (không khởi động script nặng nào trong
  lúc gate0wait; không probe dpkg nào trong cả phiên; check-only
  postboot mỗi 4 poll là dự phòng được quyết, không phải vi
  phạm; launch-test pre-flight là kiểm nhẹ, không phải
  attempt — xem §0b). P1 Chrome headless trong W1 + P3 ghi
  file trong W1 + node tsc/test trong W2/W3 là chồng lấn phía
  luồng khác, giao T2 phán (xem §3, F-199-T4-4/F-199-T4-11).
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `477a0eac`
  (KHÔNG ĐỔI so với đầu đợt — 0 lần cập nhật tree-md5).
- **Cờ:** `hidden_files/round199-t4.done` viết lúc đóng, CÓ NỘI
  DUNG. **Boot lúc viết cờ là e6e070b8 — KHÁC boot đo**
  (boot #129 đến 06:38:56Z, sau khi poller thoát 06:38:53Z;
  xem F-199-T4-8).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-198-T4-12)

Chạy **trước mọi attempt, trước khi mở poller** (05:46–05:48Z),
ghi vào `hidden_files/round199-t4/preflight-199.txt` — **PASS
CẢ PHẦN TĨNH + POSTBOOT + LAUNCH (xem dưới)**. Tóm tắt:

- **md5 khớp hệt bản đợt 198:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-198 md5 `c8792589…`
  (occ 198/212, distinct 147/150, valid_rounds_p3 53,
  non_dat_in_union [260, 364, 498]). **Tree:** preview.tsx lúc
  mở poller là `477a0eac` (đọc trực tiếp 05:46Z; KHÔNG ĐỔI so
  với cuối đợt 198).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; media
  `stripes-nonperiodic.mp4` có mặt (140.828 B); không có
  `vite.lock`, không có `attempt-done-*`. **Playwright-core
  (npm): KHÔNG tìm thấy** ở repo-1 hay apps/web node_modules
  (require.resolve FAIL) — launch test dùng MiniBrowser trực
  tiếp (cache webkit-2388 CÓ MẶT).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-27
  07:30:00 UTC` → **1795764600** (hạn cờ ~08:00Z =
  1795766400, hạn cứng 08:35:51Z = 1795768551); grep lần 2
  sạch trừ 1 comment stale (F-199-T4-1, đã sửa); test poll
  bắt được 2 chuỗi header deadline sót dạng
  `T01:30:00Z` — đã sửa trước khi mở poller thật.
- **Copy-forward 198 → 199 (script python thay thế có neo,
  KHÔNG sed global):** deadline `01:30Z 27/11` → `07:30Z
  27/11`; hạn cờ/cứng → `08:00Z`/`08:35:51Z`; T5FLAG chính
  `round199-t56/` + fallback `round198-t56/`; `T4-198a` →
  `T4-199a`; `WebKit #66` → `#67`; glob `round197-*` →
  `round198-*`. Lỗi neo 0 lần. **WIRE p1p3p7 ĐÃ CÓ SẴN
  trong run-analyzers-198.sh — chỉ assert (1 lần), KHÔNG
  chen lại.**
- **`cp` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 198).
- **Freeze check (F-164-T4-1):** `round198-t4` còn **0 file
  làm việc** mtime ≥ 05:35:51Z (đợt 199 mở).
- **GATE0 LÚC MỞ: T5 CHƯA CÓ NHƯNG T4-CHECK-ONLY PASS.**
  round199-t56/ mới xuất hiện ~05:43Z (T56-199 bắt đầu) nhưng
  chưa có POSTBOOT_PASS; fallback round198-t56/ POSTBOOT_PASS
  mtime 01:00:06Z < btime 05:01:50Z nên poller đánh
  "cu(mtime-cu)", KHÔNG TÍNH — đúng thiết kế chống cờ sai
  boot. **Check-only postboot chạy tay exit=0 PASS** (xem
  `preflight-postboot-199.log`): wrapper K1 đã vá, đủ libs
  hệ thống (libevent/libEGL/libavif/libdw/libevdev), GST thư
  mục thật 269 file = debroot 269, đủ 11 package apt.
  **LAUNCH TEST (--launch-test) 05:46:57Z: JSON launch=OK —
  ĐỌC TRỰC TIẾP trường `"launch"` (F-198-T4-1)** — mode
  o8env, display :195, version 27.2, eval 2, ms 12670.
  **LẦN ĐẦU trên boot mới KHÔNG CẦN REPAIR** — replay hệ
  thống đã khôi phục libs trước 05:46Z (dpkg.log 2 → 1.311
  dòng lúc preflight). Xvfb :195 do script spawn — T4 kill
  tay (lưu ý: `pkill -f 'Xvfb :195'` tự khớp shell cha —
  giết bằng pid 14168).
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG** (0 X server).
- **RAM lúc mở ~1104–1472 MB avail; load1 ~5,1–7,2 lúc mở**
  (các luồng khác đang làm nặng).
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 51 poll thật (1 test + 50 poller), 3 lần cửa mở, 0 reboot trong phiên đo

- **Test (POLL_TEST=1), 1 poll, boot 773743f2
  (05:47:53Z):** RAM 1472 MB, load1 6,36/load5 3,41,
  lock=khong, blockers=0, gate0=T4-check-only, t5flag=
  cu(mtime-cu), postboot_exit=0, apt=1, dpkg 1429 →
  **TEST-POLL-OK exit 7 đúng thiết kế.** Poll này nằm trong
  `poll-test-199.log`; thống kê §A đã hợp nhất. Header test
  poll ghi deadline `T01:30:00Z` SAI (chỉ header log;
  DEADLINE_S thật = 07:30:00 UTC) — đã sửa trước khi mở
  poller thật (F-199-T4-1).
- **Poller — boot 773743f2 (#128), 50 poll
  (05:48:51–06:34:10Z), 3 lần cửa mở:** RAM ≥1024:
  **50/50** (min 1071, max 3385 MB); **<500: 0/50**;
  load1<2: 24/50; load5<2: **4/50**; gate0:
  **T5 46/50** (từ #5 — T56 viết POSTBOOT_PASS #128
  05:51:25Z), T4-check-only 4/50; lock=co 7 (T01-199 giữ
  lock pid 31860 port 5560, polls #1–#7), khong 43;
  blockers>0: 9 poll; apt>0: 3 poll (đuôi replay hệ thống);
  dpkg 1460→1510. **0 reboot trong phiên đo** (reboot #129
  đến 06:38:56Z, SAU khi poller thoát 06:38:53Z — xem
  F-199-T4-8).
- **Giai đoạn chờ cửa đầu (poll #1–#27):** gate0 T5 từ #5
  nhưng load5 không xuống dưới 2 lần nào (2,04–4,74) —
  các luồng khác làm nặng + dư chấn attempt… (chưa có
  attempt); RAM 1071–3385 MB (0 poll <1024). **4 poll
  "gan-mo"** (đủ gate A trừ load5): #20 (L5 2,19), #22
  (L5 2,15), #27 (L5 2,04 — L1 1,52). Blocker: vite P3
  :5199 ở #49 (xem dưới).
- **Cửa mở 3 lần (poll #28, #44, #50):** #28 (06:09:34Z)
  RAM 2108 MB, load1 0,94, load5 1,81 → **CỬA YÊN MỞ**,
  attempt1 chạy; #44 (06:25:51Z) RAM 2016 MB, load1 0,69,
  load5 1,85 → **CỬA MỞ LẠI** sau attempt1 (quyết (h) đợt
  149: poll lại gate trước mỗi attempt), attempt2 chạy;
  #50 (06:34:10Z) RAM 1983 MB, load1 0,93, load5 1,78 →
  **CỬA MỞ LẠI**, attempt3 chạy.
- **Poll #49 (06:33:24Z) gần-mở nhưng KẸT blocker:**
  load1 1,13, load5 1,97, RAM 2201 MB, gate0 T5 — đủ gate A
  trừ blockers=1 (vite preview :5199 của P3-199, pid 95864)
  nên cửa KHÔNG mở; poll #50 sau đó blockers=0 nên mở.
- **Phân rã 51 dòng poll thật (1 test + 50 poller):**
  RAM≥1024: 51/51; RAM<500: **0/51**. load1<2: 24/51;
  load5<2: 4/51. **"gan-mo" (3 điều kiện load/RAM): 4**
  = 3 lần mở cửa thật + 1 lần kẹt blocker (#49). gate0:
  T5=46, T4-check-only=5 (+1 test). blockers>0: 9 poll.
  apt>0: 4 poll (3 poller + 1 test). dpkg 1429→1510.

## 2. Attempts — 3 attempt (ngân sách dùng 3/3), 0 lượt hợp lệ

- **attempt1-773743f2: 20/20 NHƯNG LỚP B VI PHAM — KHÔNG
  HỢP LỆ.** Cửa sổ: marker 06:09:34Z → attempt-done
  06:14:02Z (inner-end 06:14:02Z, probe_exit=0; run-attempt
  exit=0 06:14:02Z; analyzers chạy NGOÀI cửa sổ
  06:14:02–06:14:31Z). JSON 2.190.052 B; flip wallMs
  32.582 ms; lock vite giữ ~268 s, nhả 06:14:02Z; vite
  :5187 kill sạch (curl 000); sampler dừng sạch (124 dòng).
  **0 writePartial TIMEOUT.**
  **tickCost:** tổng n=371 median **102,0** p90 214,0 max
  536 min 31; hậu flip+2000ms n=241 median 123,0.
  **Lớp B: B1 VI PHAM** (load5 cuối 5,77); **B2 VI PHAM
  (load1_max 14,60)**; B3 ĐẠT; **B4 ĐẠT (dpkg delta 0)**;
  **B5 ĐẠT (RAM min 830 MB, 0 mẫu <500; 26/123 mẫu <1024)**.
  **(c2) = 1 seq [105]** (lag +1f) → P3' KHÔNG tính
  (attempt không hợp lệ). **P1 YEU** (n=1, p=0,3316);
  **P3-A1 YEU** (1/1 occ, p=0,4946); **P3' ĐẠT 1/1**
  (stall_truoc=3); **P7 ĐÚNG** (0 entry trễ ≥+1f).
  **Labellag (b): 0 occurrence ≥5f** (skippedLatest=1:
  n=67, max 4f; skippedLatest=0: n=552, max 4f) — **KHÔNG
  tính vào chuỗi** (attempt không hợp lệ).
  **Perpass (20 pass):** median 64,0/48,0/61,0/57,0/86,0/
  150,5/96,0/123,0/106,0/105,5/100,0/112,0/106,0/188,5/
  111,0/207,5/199,0/183,5/199,5/218,0 — TĂNG DẦN theo pass;
  n=3–28 tick mọi pass (pass 15/17 thưa nhất n=3).
  **Load1 theo pass TĂNG ĐƠN ĐIỆU: mean 1,52 → 13,10**
  (pass 19–20 mean 12,25–13,10); RAM mean rơi 1650 →
  962 MB. Tương quan median~load1_mean r=0,88.
- **attempt2-773743f2: 20/20 NHƯNG LỚP B VI PHAM — KHÔNG
  HỢP LỆ.** Cửa sổ: marker 06:25:52Z → attempt-done
  06:29:36Z (inner-end 06:29:36Z, probe_exit=0; run-attempt
  exit=0 06:29:36Z; analyzers chạy NGOÀI cửa sổ
  06:29:36–06:30:22Z). JSON 2.629.390 B; flip wallMs
  30.192 ms; lock vite giữ ~224 s, nhả 06:29:36Z; vite
  :5187 kill sạch (curl 000); sampler dừng sạch (106 dòng).
  **0 writePartial TIMEOUT.**
  **tickCost:** tổng n=455 median **70,0** p90 97,6 max 191
  min 30; hậu flip+2000ms n=329 median 72,0.
  **Lớp B: B1 VI PHAM** (load5 cuối 2,70 — sát bar 2,5);
  **B2 VI PHAM (load1_max 4,88 — sát bar 4,0)**; B3 ĐẠT;
  **B4 ĐẠT (dpkg delta 0)**; **B5 ĐẠT (RAM min 967 MB,
  0 mẫu <500; 7/105 mẫu <1024)**.
  **(c2) = 0 seq []** — lần đầu 1 attempt 20/20 có 0 (c2)
  (F-199-T4-7) → P1/P3-A1/P7 KHÔNG tính được; P3' 0/0.
  **Labellag (b): 0 occurrence ≥5f** (cả hai chiều) —
  **KHÔNG tính vào chuỗi** (attempt không hợp lệ).
  **Perpass (20 pass):** median 53,0/72,0/65,0/61,0/64,5/
  82,0/93,0/78,0/72,0/70,0/83,5/69,5/62,5/69,0/71,5/73,0/
  75,0/66,0/76,0/59,5 — PHẲNG (~60–93, không tăng theo
  load1); n=17–28 tick mọi pass. **Load1 theo pass TĂNG
  ĐƠN ĐIỆU: mean 0,73 → 4,86** (pass 20 mean 4,86); RAM
  mean rơi 1491 → 988 MB. Tương quan median~load1_mean
  r=0,15 (yếu — tickCost không chạy theo load1 đợt này).
- **attempt3-773743f2: 20/20 NHƯNG LỚP B VI PHAM — KHÔNG
  HỢP LỆ.** Cửa sổ: marker 06:34:10Z → attempt-done
  06:38:20Z (inner-end 06:38:20Z, probe_exit=0; run-attempt
  exit=0 06:38:20Z; analyzers chạy NGOÀI cửa sổ
  06:38:20–06:38:53Z). JSON 2.250.845 B; flip wallMs
  35.065 ms; lock vite giữ ~250 s, nhả 06:38:20Z; vite
  :5187 kill sạch (curl 000); sampler dừng sạch (117 dòng).
  **0 writePartial TIMEOUT.**
  **tickCost:** tổng n=402 median **94,0** p90 178,9 max
  497 min 32; hậu flip+2000ms n=296 median 98,0.
  **Lớp B: B1 VI PHAM** (load5 cuối 3,44); **B2 VI PHAM
  (load1_max 8,73)**; B3 ĐẠT; **B4 ĐẠT (dpkg delta 0)**;
  **B5 ĐẠT (RAM min 806 MB, 0 mẫu <500; 9/116 mẫu <1024)**.
  **(c2) = 1 seq [301]** (lag +1f) → P3' KHÔNG tính
  (attempt không hợp lệ). **P1 YEU** (0/1, p=1);
  **P3-A1 YEU** (1/1 occ, p=0,3922); **P3' KHÔNG ĐẠT**
  (stall_truoc=1 <2); **P7 ĐÚNG** (0 entry trễ ≥+1f).
  **Labellag (b): 0 occurrence ≥5f** — **KHÔNG tính vào
  chuỗi** (attempt không hợp lệ).
  **Perpass (20 pass):** median 86,0/91,0/76,5/79,5/98,0/
  93,0/85,5/94,5/199,0/94,0/67,0/86,0/86,5/93,5/83,0/
  128,0/102,0/109,0/111,0/121,0; n=10–35 tick mọi pass.
  **Load1 theo pass TĂNG ĐƠN ĐIỆU: mean 0,90 → 8,58**
  (pass 19 mean 8,58); RAM mean rơi 1428 → 856 MB.
  Tương quan median~load1_mean r=0,25.
- **Ngân sách 3/3 đã dùng; poller thoát 06:38:53Z (exit 11 —
  HẾT NGÂN SÁCH, 0 lượt hợp lệ).**

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN THỨ 13 CHO QUYẾT TÁCH: W1 43 / W2 33 /
  W3 39 SPIKE (xem F-199-T4-5).** Watcher T9 (b2watch.sh,
  poll load1 mỗi 2 s, ghi spike khi load1 ≥ 3,0; mỗi spike
  ghi boot_id — F-198-T9-8): **W1: 43 spike**
  (06:10:17–06:12:52Z, load1 3,00–14,60), **W2: 33 spike**
  (06:26:44–06:29:26Z, load1 3,01–4,88), **W3: 39 spike**
  (06:35:03–06:38:18Z, load1 3,00–8,73). Sampler T4 xác
  nhận độc lập: load1_max 14,60 (W1) / 4,88 (W2) / 8,73
  (W3) — **KHỚP HỆT đỉnh spike T9 cả 3 cửa sổ**
  (14,60 @06:12:20Z; 4,88 @06:27:30Z; 8,73 @W3).
  **Phân loại:** W1 HỖN HỢP — snapshot 06:11:37Z:
  WebKitWebProcess pid 68866 của probe 50,6% CPU +
  MiniBrowser 17,2% (tự-tải ~68%) VÀ 3 chrome renderer
  30,2/30,1/13,5% (ngoại-tải ~74%, P1-199) + hatch 10,6%.
  W2 CHỦ YẾU NGOẠI-TẢI — snapshot 06:29:01Z/06:29:06Z:
  node MainThread pid 93656/93985 (mới mỗi ~5 s) 103% /
  110% CPU, probe node chỉ 3,3%, vite 1,4%, Chrome P1
  0,1%; "MainThread" là comm của process node (F-199-T4-9:
  bắt sống trong W3 — `tsc --noEmit`, test P3
  `reverseAudio199P3.test.ts`, `vite preview :5199`).
  W3 KHÔNG QUY ĐƯỢC CHO 1 PROCESS — snapshot giữa cửa sổ
  06:36:52Z/06:37:02Z không process nào >13,1% (hatch
  13,1% cao nhất; probe node 4,0%; vite 1,9%;
  WebKitWebProcess vắng khỏi top-11 tại thời điểm chụp)
  trong khi load1 5,06–6,14 — phù hợp tải churn từ các
  process node ngắn ngủi của luồng khác (cùng mẫu W2) +
  tải nền probe; T4 KHÔNG khẳng định tự/ngoại cho W3.
  Tổng spike trong log T9: 281 spike (3.934 dòng, tính tới lúc
  T4 đóng).
  T4 chỉ báo số, KHÔNG tự quyết tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CẢ 3 CỬA SỔ ATTEMPT,
  0 FIRE.** Live `dry_run=False guard=6291456 consec=2`
  (T9-199). Mẫu autotrigger trong cửa sổ (marker →
  attempt-done): W1 5 mẫu 06:09:52–06:13:52Z (avail
  1.173.444–3.304.076 kB, load1 1,69–12,21), W2 3 mẫu
  06:26:52–06:28:52Z (avail 1.173.184–1.353.672 kB,
  load1 3,52–3,74) + 1 mẫu biên 06:25:52Z (cùng giây với
  marker 06:25:52.067Z — không phân biệt trước/sau, chỉ
  ghi nhận, không dùng verdict), W3 4 mẫu 06:34:52–
  06:37:52Z (avail 1.163.924–2.346.848 kB, load1 2,64–
  6,79) — **trigger=watch, consec=0 ở tất cả các mẫu:
  0 FIRE / 0 WOULD-FIRE.** RAM avail thấp nhất trong cửa
  sổ: W3 1.163.924 kB (~1,11 GB) lúc 06:35:52Z.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 18: KHÔNG ĐẠT
  (F-199-T4-6).** Áp ĐÚNG định nghĩa (p)-192 như đã áp ở
  #14 (đợt 195) và #16 (đợt 197) — cả hai lần ĐẠT đều có
  0 spike B2 VÀ 1 cửa sổ hợp lệ; tiền lệ #15 (đợt 196):
  trigger 0 FIRE chỉ ghi nhận làm dữ kiện, không dùng làm
  verdict: đợt này **KHÔNG CÓ cửa sổ hợp lệ nào** (cả 3
  attempt đều nhiễm tải) VÀ mỗi cửa sổ có 33–43 spike B2
  nên KHÔNG ĐẠT. **Chuỗi live ĐẠT 0 → GIỮ 0.**
  T9-199 xác nhận độc lập sau.
- **O8 T01 TRÊN BOOT 773743f2 — thuộc T01-199 báo cáo (T01
  đã đóng lúc T4 đóng).** O8 T8 + harness thuộc T8-199
  (T8 chưa đóng lúc T4 đóng).
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (kiểm file
  round199-* mtime trong cửa sổ, loại round199-t4):**
  **W1 (06:09:34–06:14:02Z): 1 thư mục** —
  `round199-p3/` (P3 sửa `audio-probe-199.mjs` 06:10:51Z +
  dir mtime 06:12:48Z — ghi file text nhẹ trong cửa sổ).
  **W2 (06:25:52–06:29:36Z): 0 file.**
  **W3 (06:34:10–06:38:20Z): 0 file.**
  **P1 Chrome headless trong W1 (F-199-T4-4):** ps-before
  attempt1 có chrome main pid 65415 (started 06:03,
  user-data-dir `/tmp/vf194-chrome-lkxswN` —
  `round199-p1/harness/cdp-driver.mjs`) + renderers;
  ps-after attempt1 VẪN CÒN (0 hit mất) — job P1 chạy
  suốt W1; 3 renderer 30,2/30,1/13,5% CPU tại spike
  06:11:37Z. W2/W3: chrome main còn sống nhưng idle
  0,0–0,1%. Giao T2 phán.
  **P3 audio-probe trong W2 (F-199-T4-11):** ps-before
  attempt2 có `node audio-probe-199.mjs` (P199_SAMPLES=400,
  port 4232, CDP 9256) — job P3; ps-after attempt2 KHÔNG
  còn (0 hit) — job kết thúc trong W2.
  **P3 vite preview :5199 trong cả 3 cửa sổ:** vite preview
  port 5199 (P3-199) chạy suốt phiên; là blocker DUY NHẤT
  kẹt poll #49 (gần-mở nhưng không mở cửa).
  **0 file round198-* nào bị sửa trong cả 3 cửa sổ** (check
  glob đợt trước trong t4-attempt-inner.sh).
- **T56 REPAIR — 0 CHỒNG TRONG W1/W2/W3** (replay boot mới
  xong 05:51:25Z, trước W1; dpkg delta 0 cả 3 cửa sổ).
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI QUY
  ĐỊNH.** `run-analyzers-199.sh` chạy NGOÀI cửa sổ cả 3
  lần (sau attempt-done). `round198-*` files modified sau
  marker: 0 file.

## 4. Replay/postboot — POSTBOOT_PASS #128 CÓ (T56, poll=0, replay-đầy-đủ) + REBOOT #129 SAU POLLER

- **Boot #128 (773743f2, btime 05:01:50Z 27/11 — SỐ HIỆU ỨNG
  VIÊN, T01-199 xác minh) — POSTBOOT_PASS ĐÃ CÓ 05:51:25Z**
  (T56; T4 chỉ ghi nhận): "boot 773743f2 (btime 05:01:50Z;
  watcher-199) — replay-day-du: dpkg 1510 dong; cache 174
  .deb; lists 71; postboot PASS poll0 doc lap exit 0 luc
  05:51:25Z; POSTBOOT_PASS moi ghi 05:51:25Z poll=0
  (replay-day-du); co cu 6882f9a9 luu POSTBOOT_PASS-
  6882f9a9". **#128 CHẾT ~06:38:56Z sau 5.826 s
  (= 1h37m06s).**
  **Replay 773743f2: ĐẦY ĐỦ** (dpkg.log 1510 dòng lúc đóng
  — hơn #127: 777 dòng repair). GST #128: xem LIMITS
  T56-199. Check-only của T4 PASS độc lập từ preflight
  (05:46Z) và giữ PASS tới đóng (gate0wait mỗi 4 poll).
- **REBOOT #129 (F-199-T4-8): boot e6e070b8, btime
  06:38:56Z — ĐẾN 3 GIÂY SAU KHI POLLER THOÁT (06:38:53Z).**
  Poller đã thoát (exit 11, ngân sách hết) nên 0 attempt
  đang chạy lúc reboot; 0 artifact T4 mất (attempt-done
  06:38:20Z + analyzers 06:38:53Z đều xong trước reboot).
  Runtime restart đi kèm giết exec session chờ của T4
  (sleep 240) — T4 khôi phục bằng kiểm đĩa, không chạy
  lại attempt. **Boot #129 là ứng viên mới — POSTBOOT
  #129 + survey thuộc T01-200/T56-200** (T01-199/T56-199
  đã đóng hoặc đang đóng; parent/T10 quyết).
  **(m) #127 DƯƠNG (CUỐI, T2-199); (m) #128 THÔ 0
  (phân loại CUỐI thuộc T2-200)** — T4 không đo (m).
- **KHOẢNG LẶNG SCHEDULER / OUTAGE: KHÔNG CÓ DỮ KIỆN TRONG
  PHIÊN T4.** OUTAGE phán cuối thuộc T7-199; verdict
  harness thuộc T8-199.
- **Watcher-199:** T4 không theo dõi trực tiếp trạng thái
  watcher sau reboot — thuộc T56-199 báo cáo (T9 đã
  restart daemon trên boot mới 06:41:13Z — driver.out ghi
  boot0=e6e070b8).

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND199_T4_WEBKIT_QUIET67_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round199-t4/`):**
  `poll-wait-t4-199.sh`, `run-attempt-199.sh` (lượt yên #67),
  `run-analyzers-199.sh` (classb + 9 analyzer + p1p3p7 NGOÀI
  cửa sổ), `distinct-seq-199.py` (sổ as-of-198 — KHÔNG đổi
  đợt này).
  **KHÔNG stage lại probe** (byte-identical đợt 148–198,
  md5 `4291e539...`), **`t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (theo mẫu 149–198: chỉ stage 4
  script trên), **`b.json`** (md5 `078938cf...`) và
  **`stats-199.py`** (helper làm việc).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (477a0eac) +
  `stats-199.py` + `distinct-seq-199.py` +
  `distinct-seq-ledger.json` (as-of-198, md5 `c8792589`) +
  `distinct-seq-ledger-198.json` (bản sao cơ sở) +
  `preflight-199.txt` + `preflight-postboot-199.log` +
  `preflight-launch-199.log` + `round199-t4-copy.py`.
- **Log/evidence (hidden_files/round199-t4/, không stage):**
  `poll-t4.log` (50 poll poller + 3 lần CỬA MỞ #28/#44/#50),
  `poll-t4.nohup.log`, `poll-test-199.log` (1 test poll +
  TEST-POLL-OK exit 7), `chain-t4.log` (start poller + 3
  lần CỬA MỞ + 3 attempt + poller thoát 06:38:53Z exit 11),
  `postboot-t4-199-gate0wait-*.log` (check-only mỗi 4 poll,
  13 file), `stats-199-output.txt`,
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}-773743f2.json`
  (2.190.052 / 2.629.390 / 2.250.845 B),
  `load-mid-t4-attempt{1,2,3}-773743f2.log` (124/106/117
  dòng), `analyze-t4-attempt{1,2,3}-773743f2-*.txt` (10 file
  mỗi attempt — gồm `p1p3p7` chạy TỰ ĐỘNG),
  `coverage-check-attempt{1,2,3}-773743f2.txt` (1/1, (c2)=0,
  1/1), `classb-t4-attempt{1,2,3}-773743f2.txt`,
  `ps-before/after-t4-attempt{1,2,3}-773743f2.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2,3}-*.txt`
  (B4: dpkg 1510→1510 cả 3 attempt). **3 JSON attempt (0 hợp
  lệ). 0 process T4 sống lúc đóng** (poller thoát 06:38:53Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4). **X11 TRỐNG sau reboot** (0 X server).

## 6. Sai số F-199-T4-1..11 + nợ cũ

- **F-199-T4-1 — COPY SCRIPT SÓT HEADER DEADLINE DẠNG ISO
  "T01:30:00Z" (MỚI — ĐÃ SỬA TRƯỚC KHI MỞ POLLER; DẠNG MỚI
  CỦA F-198-T4-12).** 2 chuỗi `deadline=2026-11-27T01:30:00Z`
  (dòng 64/66 poll-wait) không khớp neo `01:30Z 27/11` (dạng
  ISO có `T`); DEADLINE_S thật (dòng 57) đã đúng 07:30:00
  UTC. Test poll bắt được; đã sửa, bash -n OK, grep lần 3
  sạch (chỉ còn trong copy.py lịch sử). Neo
  `'2026-11-27T01:30:00Z'` đã bổ sung vào copy script đợt
  sau. Bài học: neo deadline phải bao cả 3 dạng (ngày-giờ,
  `HH:MMZ ngày`, ISO có `T`).
- **F-199-T4-2 — PREFLIGHT POSTBOOT PASS + LAUNCH OK TRÊN
  BOOT MỚI KHÔNG CẦN REPAIR (MỚI — LẦN ĐẦU).** Check-only
  exit=0 + JSON launch=OK ngay lúc mở (05:46–05:47Z); replay
  hệ thống đã khôi phục libs trước khi T4 kiểm (dpkg.log 2 →
  1.311 dòng). Khác mọi đợt trước (đợt 198: FAIL tới khi
  T56 repair). Gate0 dự phòng T4-check-only ĐẠT từ poll đầu;
  T5 vẫn là chính (POSTBOOT_PASS #128 có 05:51:25Z).
- **F-199-T4-3 — 3/3 ATTEMPT 20/20 NHƯNG LỚP B VI PHẠM
  B1+B2 (MỚI — LẦN ĐẦU 0 LƯỢT HỢP LỆ KỂ TỪ KHI CHUỖI BẮT
  ĐẦU ĐẾM Ở #64).** Load1 tăng đơn điệu qua 20 pass ở cả 3
  attempt (1,52→13,10 / 0,73→4,86 / 0,90→8,58); tickCost
  median 102,0/70,0/94,0 đều >60. Không phải wedge/timeout
  (0 writePartial TIMEOUT cả 3 attempt) — là nhiễm tải thật,
  không phải lỗi probe.
- **F-199-T4-4 — P1 CHROME HEADLESS TRONG W1 (MỚI — DẠNG
  MỚI CỦA F-198-T4-4).** Chrome main pid 65415 (started
  06:03, `/tmp/vf194-chrome-lkxswN`,
  `round199-p1/harness/cdp-driver.mjs`) có mặt trong
  ps-before VÀ ps-after W1; 3 renderer 30,2/30,1/13,5% CPU
  tại spike 06:11:37Z — ngoại-tải chính của W1 (cùng tự-tải
  probe ~68%). W2/W3 chrome idle 0,0–0,1%. Giao T2 phán.
- **F-199-T4-5 — B2 DỮ KIỆN THỨ 13: W1 43 / W2 33 / W3 39
  SPIKE (MỚI — XEM §3).** Đỉnh spike T9 khớp hệt sampler
  T4 cả 3 cửa sổ (14,60/4,88/8,73). W1 hỗn hợp, W2 chủ yếu
  ngoại-tải (node MainThread 103–110%), W3 không quy được
  cho 1 process. T4 chỉ báo số, KHÔNG tự quyết tách.
- **F-199-T4-6 — (p) LIVE LẦN 18 KHÔNG ĐẠT (MỚI — CHUỖI
  LIVE ĐẠT GIỮ 0).** Không có cửa sổ hợp lệ nào (0/3
  attempt hợp lệ); 12 mẫu live đều watch/consec=0, 0 FIRE
  nhưng mỗi cửa sổ 33–43 spike B2. T9-199 xác nhận độc lập
  sau.
- **F-199-T4-7 — (c2) ATTEMPT2 = [] — 0 SEQ (MỚI — LẦN
  ĐẦU).** Attempt 20/20 nhưng labellag (c)=0, (c2)=0 —
  P1/P3-A1/P7 không tính được, P3' 0/0. Không phải lỗi
  coverage (coverage-check 0/0 — không có seq để kiểm,
  khác COVERAGE 0/N). Ghi nhận: lượt 20/20 vẫn có thể cho
  0 (c2) khi trang yên hẳn (0 ghost).
- **F-199-T4-8 — REBOOT #129 ĐẾN 3 GIÂY SAU KHI POLLER
  THOÁT (MỚI).** Boot e6e070b8 btime 06:38:56Z; poller thoát
  06:38:53Z (exit 11); 0 attempt đang chạy; 0 artifact mất.
  Runtime restart đi kèm giết exec session chờ của T4 —
  khôi phục bằng kiểm đĩa. POSTBOOT #129 + survey thuộc
  T01-200/T56-200.
- **F-199-T4-9 — "MainThread" LÀ COMM CỦA PROCESS NODE
  (MỚI — GIẢI MÃ SNAPSHOT B2).** Node đặt tên main thread
  là MainThread nên `ps -eo comm` hiện MainThread thay vì
  node. Các MainThread 103–110% trong snapshot W2 là các
  process node ngắn ngủi (bắt sống trong W3: `tsc --noEmit`,
  test P3, `vite preview :5199`) — không phải process lạ.
  Bài học: snapshot B2 chỉ dùng comm thì phải đối chiếu
  cmdline mới phân loại được tự/ngoại.
- **F-199-T4-10 — VITE PREVIEW :5199 CỦA P3 CHẶN CỬA Ở
  POLL #49 (MỚI — NHẸ).** Poll #49 đủ gate A trừ
  blockers=1 (vite preview :5199, pid 95864) nên cửa không
  mở; poll #50 blockers=0 nên mở. Vite preview của P3 chạy
  suốt phiên (không phải blocker thường trực — chỉ 1 poll).
- **F-199-T4-11 — GHI FILE NHẸ TRONG CỬA SỔ (MỚI — DẠNG
  MỚI CỦA F-198-T4-11).** W1: P3 sửa `audio-probe-199.mjs`
  06:10:51Z (ghi file text nhẹ, B4 delta 0). W2/W3: 0 file.
  Ghi nhận để T2 đối chiếu nguồn (cùng mẫu F-198-T4-11).
- **Nợ cũ:** F-198-T4-1 → KHÔNG tái diễn (launch JSON đọc
  trực tiếp, launch=OK thật); F-198-T4-2 → F-199-T4-8
  (dạng mới: reboot SAU poller thoát, không giết poller);
  F-198-T4-3 → KHÔNG tái diễn (cây 0 lần đổi, md5 477a0eac
  suốt phiên); F-198-T4-4 → F-199-T4-4 (dạng mới: P1
  Chrome W1); F-198-T4-5 → F-199-T4-5 (dữ kiện 13);
  F-198-T4-6 → F-199-T4-6 (KHÔNG ĐẠT tiếp); F-198-T4-7 →
  dạng mới: P3-A1 YEU ở A1/A3 do n=1 (không phải SAI cấp
  lượt do p>0,01 với n=3); F-198-T4-8 → GIỮ (p1p3p7 đã nối,
  chạy tự động cả 3 attempt); F-198-T4-9 → ĐÃ ĐÓNG
  (footer stats-199.py giữ nguyên số 53 lượt — đúng vì #67
  không cộng thêm); F-198-T4-10 → KHÔNG tái diễn (0
  vite re-optimize cả 3 attempt); F-198-T4-11 →
  F-199-T4-11 (dạng mới: P3 ghi file trong W1); F-198-T4-12
  → F-199-T4-1 (dạng mới: sót header ISO).

## 7. P3' cộng dồn (KHÔNG ĐỔI — 53 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 199 (KHÔNG ĐỔI): P1 236/240, P2
  231/231, P3-A1 201/240, P3' 198/212 occurrence = 147/150
  distinct-seq, P7 134/134** (53 lượt hợp lệ — #67 KHÔNG
  CÓ lượt hợp lệ nên không cộng thêm seq nào). Cơ sở: cộng
  dồn chỉ tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #67: KHÔNG CÓ** — (c2) attempt1 [105],
  attempt2 [], attempt3 [301] đều thuộc attempt KHÔNG hợp
  lệ → KHÔNG cộng sổ, KHÔNG thăng cấp ledger. Sổ
  distinct-seq GIỮ as-of-198 (md5 `c8792589`; T4 kiểm lại
  md5 sau khi đóng — khớp).
- **P1/P2/P3-A1/P3'/P7 đợt này (chỉ ghi nhận, KHÔNG cộng):**
  A1: P1 YEU (n=1), P3-A1 YEU (1/1 occ, p=0,4946), P3' ĐẠT
  1/1 (stall 3), P7 ĐÚNG. A2: 0 seq — không tính được.
  A3: P1 YEU (0/1), P3-A1 YEU (1/1 occ, p=0,3922), P3'
  KHÔNG ĐẠT (stall 1), P7 ĐÚNG.
- **HELPER distinct-seq KHÔNG DÙNG ĐỢT NÀY** (không có
  lượt hợp lệ để cộng); đợt 200 copy-forward lấy sổ
  as-of-198 làm cơ sở (md5 `c8792589`).
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên ở mức occurrence** (53 lượt; đợt này
  không thêm dữ kiện hợp lệ).
- **Labellag (b) — CHUỖI TRƯỚC #67 = 1; #67 KHÔNG CÓ lượt
  hợp lệ → chuỗi 0 occ 1 → 0 (ĐỀ XUẤT)** (chỉ lượt hợp lệ
  mới tính; lượt không hợp lệ làm đứt chuỗi).
- Chuỗi median tickCost 53 lượt (KHÔNG ĐỔI — thêm 0 lượt):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 / 42,0 / 53,0 / 47,0 / 55,0 ms (tổng 2516,0;
  TB 47,5 ms; min 39,0, max 60,0; 0 lượt vượt 60). Median
  các attempt không hợp lệ (102,0 / 70,0 / 94,0) KHÔNG đưa
  vào chuỗi.

## 8. Chờ quyết parent / nợ đợt 200

- **(a) #67 KHÔNG CÓ LƯỢT HỢP LỆ (3/3 attempt đều 20/20
  nhưng lớp B vi phạm B1+B2) — CHUỖI LƯỢT YÊN HỢP LỆ
  2 → 0 (ĐỀ XUẤT — parent quyết cuối).** Chân lượt yên cho
  chuỗi FULL PASS **KHÔNG có đợt này** (FULL PASS thuộc
  parent/T10 quyết cuối).
- **(b) FULL PASS: thuộc T01/T8-199 + parent/T10 quyết cuối.
  Live-check #18 KHÔNG ĐẠT — T9-199 xác nhận độc lập sau.**
- **(c) P3' cộng dồn KHÔNG ĐỔI 53 lượt: P1 236/240, P2
  231/231, P3-A1 201/240, P3' 198/212 = 147/150, P7 134/134:**
  sổ distinct-seq GIỮ as-of-198 md5 `c8792589` (không thăng
  cấp). **Chờ parent/T10 quyết:** ghi nhận không thăng cấp.
- **(d) BOOT 773743f2 (số hiệu #128 ỨNG VIÊN — T01-199 xác
  minh; btime 05:01:50Z). POSTBOOT_PASS #128 CÓ (05:51:25Z,
  poll=0, replay-đầy-đủ) — mạnh hơn #126/#127 (poll=1,
  repair). Boot e6e070b8 (btime 06:38:56Z) đến sau poller
  thoát — ứng viên #129, POSTBOOT #129 + survey thuộc
  T01-200/T56-200. (m) #127 DƯƠNG (CUỐI, T2-199); (m) #128
  THÔ 0 (CUỐI thuộc T2-200).**
- **(e) PRE-FLIGHT CHECK (quyết (t) đợt 158) TIẾP TỤC CHỨNG
  MINH HIỆU QUẢ — giữ làm quy tắc đứng.** Đợt này test poll
  bắt được 2 chuỗi deadline sót dạng ISO + launch-test JSON
  xác nhận launch=OK thật trên boot mới không cần repair
  (F-199-T4-1/F-199-T4-2).
- **(f) POSTBOOT_PASS #128 CÓ (05:51:25Z, poll=0,
  replay-đầy-đủ). Tổng boot không cờ GIỮ NGUYÊN nếu parent
  chấp nhận (T01/T2-199 phán cuối).**
- **(g) RAM 0 poll <500 MB (min 1071 MB) — không có episode
  RAM thấp đợt này; giao T9-199 phán (nếu có).**
- **(h) (m) #127 phán CUỐI (T2-199); (m) #128 THÔ 0
  (T2-199/T2-200); INSIDE (T2-199); POSTBOOT_PASS #128
  (T56-199); số hiệu 773743f2 = #128? (T01-199 xác minh —
  parent quyết (e) aggregate 199); boot e6e070b8 = #129?
  (T01-200); OUTAGE phán cuối T7-199; auto-trigger lần
  FIRE thật đầu tiên — VẪN CHƯA XẢY RA (T9-199); B2 dữ
  kiện thứ 13 (43/33/39 — BẢN NÀY); (m) #56 / mù
  hole-recheck / prune / headroom / ENOSPC / 84l10 / 86n2-P1
  / B2 live sạch (T2/T7/T9-199 phán — T4 không nắm số
  chạy); E-247 kết cục (T9-199); run kết cục (T7-199).**
- **(i) B2 DỮ KIỆN THỨ 13: W1 43 / W2 33 / W3 39 SPIKE
  (F-199-T4-5). Luật B2 KHÔNG TÁCH vẫn đứng cho tới khi
  parent quyết — T4 KHÔNG tự quyết tách. Auto-trigger LIVE
  chạy trong cả 3 cửa sổ attempt, 0 FIRE** — lần FIRE thật
  đầu tiên vẫn chưa xảy ra; T9-199 verify end-to-end khi có
  FIRE.
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 3 lần đợt này
  (attempt1/2/3) → **0 lượt yên hợp lệ #67 cho chuỗi FULL
  PASS.** O8 T01 trên 773743f2 (T01-199 báo cáo — T01 đã
  đóng lúc T4 đóng); O8 T8 + harness thuộc T8-199 báo cáo
  (T8 chưa đóng lúc T4 đóng).
- **(k) F-199-T4-1 (sót header deadline ISO — đã sửa);
  F-199-T4-2 (preflight PASS + launch OK không cần repair);
  F-199-T4-3 (3/3 attempt 20/20 nhưng B vi phạm — 0 lượt
  hợp lệ); F-199-T4-4 (P1 Chrome trong W1);
  F-199-T4-5 (B2 dữ kiện thứ 13: 43/33/39);
  F-199-T4-6 ((p) live lần 18 KHÔNG ĐẠT — chuỗi live ĐẠT
  GIỮ 0); F-199-T4-7 ((c2) attempt2 = [] — 0 seq);
  F-199-T4-8 (reboot #129 sau poller thoát 3 s);
  F-199-T4-9 ("MainThread" = comm của process node);
  F-199-T4-10 (vite preview :5199 chặn cửa poll #49);
  F-199-T4-11 (P3 ghi file trong W1).**

## Phụ lục A — stats-199-output.txt (tóm tắt)

```
test: 1 poll, RAM 1472 >=1024: 1/1, load1<2: 0/1, gate0: T4-check-only=1
poller (773743f2 #128): 50 poll 05:48:51-06:34:10Z, RAM 1071-3385 >=1024: 50/50
  <500: 0/50, load1<2: 24/50, load5<2: 4/50, gate0: T5=46, T4-check-only=4
  lock: co=7 (T01-199), khong=43, dpkg 1460->1510
TONG: 51 dong poll; RAM min=1071 max=3385 >=1024: 51/51 <500: 0/51
gan-mo (3 dk load/RAM): 4 = 3 mo cua that + 1 ket blocker (#49 vite preview :5199)
P3' (53 luot): P1 236/240 P2 231/231 P3-A1 201/240 P3' 198/212 = 147/150 P7 134/134
median 53 luot: n=53 mean=47,5 min=39,0 max=60,0 vuot-60: 0
```
