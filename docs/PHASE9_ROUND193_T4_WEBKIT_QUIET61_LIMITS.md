# PHASE9_ROUND193_T4_WEBKIT_QUIET61_LIMITS.md

**Đợt:** 193. **Luồng:** T4 — đo lượt yên WebKit #61 trên 1 boot
+ **#61 KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt hợp lệ (chuỗi lượt yên hợp
  lệ GIỮ 0 — đã ĐỨT ở #60, không có lượt hợp lệ mới).** Attempt2 gần
  nhất: 20/20 + lớp B ĐẠT 5/5 nhưng tickCost median 61,0 ms > 60
  (thiếu 1,0 ms).
+ **BOOT ĐO: MỘT boot — 1c0bcaad (btime 20:22:37Z; SỐ HIỆU #117 ỨNG
  VIÊN — T01-193 chưa đóng cờ lúc T4 đóng, parent quyết (e)). 0 reboot
  TRONG phiên đo; boot mới xảy ra TRƯỚC khi T4 mở (20:22:37Z, sau khi
  đợt 193 mở 17:35:51Z — xem F-193-T4-9).**
+ **P3' CỘNG DỒN KHÔNG ĐỔI (50 lượt hợp lệ): P1 223/227, P2 218/218,
  P3-A1 192/227, P3' 187/199 occurrence = 142/145 distinct-seq, P7
  121/121.** Sổ distinct-seq GIỮ NGUYÊN as-of-191, md5 `b7ed5791`
  (không thăng cấp — không lượt hợp lệ mới, không seq mới).
+ **Labellag (b) — CHUỖI TRƯỚC #61 = 0 (ghi rõ theo quyết (m)-192):
  tính theo LƯỢT HỢP LỆ, không theo attempt.** Chuỗi 0 occ (185–187,
  3 đợt) đã DỪNG ở đợt 189; đợt 191 có 4 occ/1 event; #60 0 occ ở
  attempt nhưng KHÔNG có lượt hợp lệ nên chuỗi GIỮ 0. #61 lại 0 occ /
  0 event ở cả 3 attempt nhưng KHÔNG có lượt hợp lệ — chuỗi GIỮ 0.
+ **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 12: KHÔNG THỂ KIỂM** (xem §3,
  F-193-T4-7): áp ĐÚNG định nghĩa (p)-192 — live-check CHỈ đối chiếu
  trên cửa sổ attempt HỢP LỆ; #61 không có cửa sổ hợp lệ nào. Chuỗi
  live ĐẠT GIỮ 9.
+ **B2 DỮ KIỆN THỨ 5 — LẪN LỘN, CHỈ BÁO SỐ** (xem §3, F-193-T4-6):
  attempt1 lạ-tải xen vào (tsc lạ ở spike thứ 2); attempt2 sạch
  (0 spike, load1_max 1,19); attempt3 lạ-tải chiếm ưu thế nửa sau
  (2 đợt tsc lạ + vite build viết lại 263 file dist, load1_max 5,67
  VI PHẠM). Lần lẫn lộn thứ 2 liên tiếp. T4 KHÔNG tự đổi luật
  KHÔNG TÁCH.
**Ngày:** 25/11/2026 (lượt cron 00:35 +07 26/11 = 17:35:51Z 25/11).
**Boot đo:** 1c0bcaad (44 poll: 2 test + 42 poller).

## 0. Verdict tổng

- **#61 KHÔNG CÓ LƯỢT HỢP LỆ — ngân sách 3/3 đã dùng.** Attempt1:
  partial/wedged (exit 2, 7/20 pass) + lớp B ĐẠT 5/5 + tickCost median
  75,0 ms (partial n=135). Attempt2: 20/20 + lớp B ĐẠT 5/5 nhưng
  tickCost median **61,0 ms > 60 — KHÔNG hợp lệ, thiếu 1,0 ms**.
  Attempt3: 20/20 NHƯNG B1+B2 VI PHẠM (load1_max 5,67; load5 cuối
  2,55) + tickCost median 69,0 ms. **Chuỗi lượt yên hợp lệ: GIỮ 0
  (đã ĐỨT ở #60; ĐỀ XUẤT — parent quyết cuối).**
- **Chân lượt yên cho chuỗi FULL PASS: KHÔNG có đợt này** (0 lượt
  hợp lệ #61) — FULL PASS không thể lên 1 từ chân này; parent quyết
  cuối.
- **(c2) = 0 seq ở attempt1 + attempt3; = 1 seq (287) ở attempt2
  nhưng attempt KHÔNG hợp lệ nên KHÔNG tính** — P3' cộng dồn GIỮ
  NGUYÊN. P3' của seq 287 ĐẠT (stall_truoc=2) nhưng chỉ ghi nhận.
- **0 VI PHẠM PHÍA T4** (không khởi động script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; check-only postboot
  mỗi 4 poll là dự phòng được quyết, không phải vi phạm; xem §3).
  Các vi phạm B1/B2 ở attempt3 là tải của máy (vite build + tsc lạ),
  không phải do T4 gây ra.
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `93981e96` (đổi giữa
  phiên 21:08:21Z, xem F-193-T4-1; ổn định từ poll #37).
- **Cờ:** `hidden_files/round193-t4.done` viết lúc đóng, CÓ NỘI
  DUNG, trong hạn cờ ~23:00Z. **Boot lúc viết cờ là 1c0bcaad — CÙNG
  boot đo** (khác đợt 192: boot đổi sau khi T4 đóng).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (20:44–20:45Z),
ghi vào `hidden_files/round193-t4/preflight-193.txt` — **PASS
PHẦN TĨNH** (1 chuỗi stale bắt được ở lần grep thứ 2 + sửa trước
pre-flight; tree-md5 cập nhật 1 lần — xem F-193-T4-1). Tóm tắt:

- **md5 khớp hệt bản đợt 192:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-191 md5 `b7ed5791…`
  (occ 187/199, distinct 142/145, valid_rounds_p3 38, non_dat
  [260, 364, 498]). **Tree:** preview.tsx lúc mở poller là
  `50ad3faf` (ổn định từ 15:05:02Z đợt 192 — T10-192 §7 đã ghi).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; Playwright-core có mặt (webkit
  object, import tuyệt đối từ `~/scratch-round63-r4/node_modules/
  playwright-core/index.mjs`); media `stripes-nonperiodic.mp4`
  có mặt (140.828 B); không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-25
  22:30:00 UTC` → **1795636200** = 22:30Z (hạn cờ ~23:00Z =
  1795638000, hạn cứng 23:35Z = 1795640100); grep lần 2 sạch
  (chỉ còn hit `round192-t56/` + glob `round192-*` CỐ Ý);
  sửa 1 chuỗi stale: comment gate0 trong `poll-wait-t4-193.sh`
  (`round192-t5/round189-t5/` → `round193-t56/round192-t56/`)
  — xem F-193-T4-1.
- **Copy-forward 192 → 193 (script python thay thế có neo,
  KHÔNG sed global):** deadline `16:30Z` → `22:30Z 25/11`; hạn
  cờ/cứng → `23:00Z`/`23:35Z`; T5FLAG chính `round193-t56/` +
  fallback `round192-t56/` (FIX F-192-T56-1); `T4-192a` →
  `T4-193a`; `default=192` → `default=193`;
  `WebKit #60` → `#61`; glob `round191-*` → `round192-*`.
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 192).
- **Freeze check (F-164-T4-1):** `round192-t4` còn **0 file
  làm việc** mtime ≥ 17:35:51Z (1 file duy nhất là
  `round193-t4-copy.py` do chính T4-193 viết 20:43Z — không
  phải file đợt 192 bị sửa).
- **GATE0 LÚC MỞ: CHƯA ĐẠT.** round193-t56/ chưa tồn tại
  (T56-193 chưa khởi động lúc 20:44Z); fallback round192-t56/
  POSTBOOT_PASS mtime 14:55:04Z < btime 20:22:37Z nên poller
  đánh "cu(mtime-cu)", KHÔNG TÍNH — đúng thiết kế chống cờ
  sai boot. **Check-only postboot chạy tay exit=1 FAIL**
  (libs thiếu: libevent/libEGL/libavif/libdw/libevdev; GST dir
  không tồn tại; apt 11 gói chưa cài — xem
  `preflight-postboot-193.log`). Replay hệ thống CHƯA XONG
  trên boot mới (boot ~22' tuổi lúc mở); 0 process apt/dpkg
  lúc kiểm. Gate0 dự phòng T4-check-only sẽ đạt khi replay
  heal — poller chờ (mẫu #115/#116).
- **dpkg.log CHỈ CÒN 2 DÒNG** (reset theo rootfs rebuild lúc
  boot mới; bản cũ 1468 dòng ĐÃ MẤT, không có dpkg.log.1;
  /var/log/apt/ KHÔNG TỒN TẠI) — xem F-193-T4-2.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (20:44:49Z): RAM 1009 MB, load1 2,23/load5 2,04;
  lần 2: RAM 1032 MB; cả 2 gate0=khong-dat,
  t5flag=cu(mtime-cu), postboot_exit=1, apt=0, dpkg 2,
  blockers comm-based=0, tree=YES 50ad3faf. Cửa chưa mở vì
  load1/load5 >2 VÀ gate0 chưa đạt — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~1009–1121 MB avail; load1 ~2,2–3,3 lúc mở.**
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN** (sampler 1 lần/
  attempt; một luồng T4 duy nhất).

## 1. Poller — 44 poll thật (2 test + 42), 3 lần cửa mở, 0 reboot trong phiên

- **Test (POLL_TEST=1), 2 poll, boot 1c0bcaad
  (20:44:44Z, 20:44:49Z):** cả 2 đều gate0=khong-dat,
  load1 ~2,2, load5 ~2,0, RAM 1009/1032 MB, lock=khong,
  blockers comm-based=0, apt=0, dpkg 2 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-193.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 1c0bcaad, 42 poll
  (20:45:57Z–21:22:04Z), 3 lần cửa mở:** RAM ≥1024:
  38/42 (min 882, max 2949 MB); 500–1023: 4/42;
  **<500: 0/42**; load1<2: 17/42; load5<2: 6/42; gate0:
  **T5 24/42**, khong-dat 18/42; lock=co 4, khong 38;
  blockers>0: 4 poll; apt>0: 18 poll; dpkg 2 → 768
  (replay cài dần).
- **Giai đoạn 1 — replay chưa xong (poll #1–#18,
  20:45:57–20:59:20Z):** postboot_exit=1, apt=1 (apt-get đang
  chạy); load1 1,01–9,41, load5 tới 5,05. Cửa KHÔNG MỞ.
  dpkg.log 2 dòng suốt giai đoạn này. **T5FLAG LẬT PASS ở
  poll #19** (T56 ghi POSTBOOT_PASS 20:59:08Z — xem §4).
- **Giai đoạn 2 — gate0 đạt, chờ load (poll #19–#25,
  20:59:20–21:04:06Z):** gate0=T5 + check-only exit=0 từ
  #22; load5 vẫn 2,03–3,01. Cửa KHÔNG MỞ.
- **Giai đoạn 3 — T01 giữ lock + cây churn (poll #26–#38,
  21:04:52–21:13:19Z):** T01 giữ lock (thread=t01-round193,
  pid 120707, port 5560) + blockers 5 ở #26–#29 (O8 T01);
  load1 tới 6,01. **Tree CHURN ở #31** (xem F-193-T4-1):
  preview.tsx 50ad3faf → 93981e96 @21:08:21Z; T4 cập nhật
  tree-md5.txt → `93981e96` lúc 21:13:27Z sau 6 poll ổn
  định; poll #37 trở đi tree=YES. Cửa KHÔNG MỞ.
- **Giai đoạn 4 — cửa mở lần 1 (poll #39, 21:14:40Z):** RAM
  1963 MB, load1 1,04, load5 1,95 → **CỬA YÊN MỞ**, attempt1
  chạy ngay (xem §2).
- **Giai đoạn 5 — cửa mở lần 2 + 3 (poll #41–#42,
  21:18:02–21:22:04Z):** #41 RAM 2949 MB, load1 1,00,
  load5 1,84 → **CỬA MỞ**, attempt2 chạy; #42 RAM 2417 MB,
  load1 1,32, load5 1,30 → **CỬA MỞ NGAY** sau attempt2,
  attempt3 chạy (quyết (h) đợt 149: poll lại gate trước
  mỗi attempt — cả 2 lần đều qua poll mới).
- **0 reboot trong phiên đo.** Poller thoát 21:26:36Z sau
  attempt3 (hết ngân sách 3/3, không có lượt hợp lệ).
- **Phân rã 44 poll thật:** RAM≥1024: 39/44; RAM<500:
  **0/44**. load1<2: 17/44; load5<2: 6/44.
  **"gan-mo" đếm 5 = 3 lần mở cửa thật** (#39, #41, #42)
  + 2 lần đủ load/RAM nhưng gate0 chưa đạt (#1, #3).
  gate0: T5=24, khong-dat=18 (+2 test). blockers>0: 4 poll
  (lúc T01 giữ lock). apt>0: 18 poll (giai đoạn replay).

## 2. Attempts — 3 attempt (ngân sách dùng 3/3), 0 lượt hợp lệ

- **attempt1-1c0bcaad: PARTIAL/WEDGED (exit 2, 7/20 pass) +
  lớp B ĐẠT 5/5 — KHÔNG TÍNH VERDICT.** Cửa sổ: marker
  21:14:40Z → attempt-done 21:16:57Z (probe_exit=2;
  run-attempt exit=2 21:16:57Z). JSON partial 888.819 B;
  flip wallMs 27.805 ms. **Wedged:** 3 lần writePartial
  TIMEOUT 30 s liên tiếp (tickCost 21:15:51Z + blendTick
  21:16:21Z + c2DrawLog 21:16:51Z, sau pass) — kênh evaluate
  chết, process sống (mẫu H3 như P5-188, attempt2-192 —
  xem F-193-T4-3); probe tự thoát sau khi ghi partial JSON,
  exit=2. **tickCost (partial):** n=135 median **75,0**
  p90 97,6 max 158 min 29 (đã >60 — dù không wedged cũng
  không hợp lệ). Hậu flip+2000ms n=14 median 34,5.
  **Lớp B ĐẠT 5/5: B1 ĐẠT** (load5 cuối 2,16); **B2 ĐẠT
  (load1_max 3,04)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 1510 MB, 0 mẫu <1024)**.
  **(c2) = 0 seq** → P1/P3-A1/P7 KHÔNG tính được;
  **P3' 0 đóng góp. Labellag (b): 0 occurrence / 0 event**
  (skippedLatest=1: n=0; skippedLatest=0: n=28, max 2f;
  ≥5f: 0). **Perpass (7 pass):** median 84/79/91/84/57/36;
  r(median~load1) = −0,51 (âm — tải không kéo median lên).
  Sampler 64 mẫu; RAM/pass 1804–2205 MB.
- **attempt2-1c0bcaad: 20/20 + LỚP B ĐẠT 5/5 NHƯNG tickCost
  median 61,0 ms > 60 — KHÔNG HỢP LỆ (thiếu 1,0 ms).**
  Cửa sổ: marker 21:18:02Z → attempt-done 21:21:42Z
  (probe_exit=0; run-attempt exit=0 21:21:42Z). JSON
  2.811.155 B; flip wallMs 26.695 ms; lock vite giữ ~3m40s,
  nhả 21:21:42Z; vite :5187 kill sạch (curl 000); sampler
  dừng sạch (105 dòng).
  **tickCost:** tổng n=492 median **61,0** p90 102,0 max 202
  min 28; hậu flip+2000ms n=326 median 74,5. Theo dải
  wallMs median leo 45,5 → 52,0 → 55,5 → 93,0 → 98,0 →
  93,5 rồi hạ cuối (pass 15–18 median 93–101, pass 19–20
  median 66/45,5) trong khi load1 suốt lượt chỉ 0,47–1,00
  — median KHÔNG theo tải (r=−0,62).
  **Lớp B ĐẠT 5/5: B1 ĐẠT** (load5 cuối 1,15); **B2 ĐẠT
  (load1_max 1,19 — yên nhất đợt này)**; B3 ĐẠT; B4 ĐẠT
  (dpkg delta 0); **B5 ĐẠT (RAM min 995 MB, 0 mẫu <500;
  1/105 mẫu <1024)**.
  **(c2) = 1 seq (287: presented 21, label 20, lag +1f)** —
  coverage 1/1; P3' ĐẠT (stall_truoc=2); P1 YẾU (0/1,
  p=1); P3-A1 YẾU (1/1, p=0,27); P7 ĐÚNG (0/324 entry trễ
  ≥+1f) — **KHÔNG tính vào cộng dồn** (attempt không hợp
  lệ). **Labellag (b): 0 occurrence / 0 event**
  (skippedLatest=1: n=106, max 2f; skippedLatest=0: n=392,
  max 4f; ≥5f: 0). **Perpass: r(median~load1) = −0,62;
  r(median~RAM) = −0,90** (âm mạnh — median cao lúc RAM
  thấp ~1100 MB ở pass 15–18, rồi hạ khi RAM hồi ~1750 MB
  ở pass 19–20).
- **attempt3-1c0bcaad: 20/20 NHƯNG B1+B2 VI PHẠM +
  tickCost median 69,0 ms — KHÔNG HỢP LỆ.** Cửa sổ: marker
  21:22:04Z → attempt-done 21:25:41Z (probe_exit=0;
  run-attempt exit=0 21:25:41Z). JSON 2.568.267 B; flip
  wallMs 29.154 ms; lock vite giữ ~3m37s, nhả 21:25:41Z;
  vite :5187 kill sạch (curl 000); sampler dừng sạch
  (103 dòng).
  **tickCost:** tổng n=468 median **69,0** p90 110,3 max 239
  min 28; hậu flip+2000ms n=359 median 63,0. Theo dải
  wallMs median 64,0 → 102,0 → 96,5 → 90,5 → 42,5 → 50,5
  — CAO GIỮA, THẤP CUỐI (pass 17–20 median 45–52,5 trong
  khi load1 5,02–5,67 — median KHÔNG theo tải, r=−0,41).
  **Lớp B: B1 VI PHẠM** (load5 cuối 2,55 > 2,5);
  **B2 VI PHẠM (load1_max 5,67)**; B3 ĐẠT; B4 ĐẠT
  (dpkg delta 0); **B5 ĐẠT (RAM min 1016 MB, 0 mẫu <500;
  1/103 mẫu <1024)**.
  **(c2) = 0 seq** → P1/P3-A1/P7 KHÔNG tính được;
  **P3' 0 đóng góp. Labellag (b): 0 occurrence / 0 event**
  (skippedLatest=1: n=124, max 2f; skippedLatest=0: n=456,
  max 4f; ≥5f: 0). **F6' ĐÓNG LẠI:** skippedLatest=1 hậu
  flip+2000ms n=62 tick (cần ≥30): nhãn 100,0%, pixel-
  verified 100,0%, 0 tick vi phạm thật.
- **Không attempt nào bị reboot giết; ngân sách 3/3 đã hết.**
  Poller thoát 21:26:36Z (exit 11 — hết ngân sách, không
  có lượt hợp lệ).
## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN THỨ 5 CHO QUYẾT TÁCH: LẪN LỘN**
  (xem F-193-T4-6). Ba attempt cho ba bức tranh khác nhau:
  **Attempt1: LẪN (nhẹ)** — load1_max **3,04** (B2 ĐẠT);
  2 spike trong cửa sổ (21:15:09 load1 3,03; 21:15:25 load1
  3,04). Spike 1 thuần tự-tải (WebKitWebProcess 49,5% +
  MiniBrowser 20,8% + MainThread 31,0% — toàn process của
  probe); spike 2 có tsc lạ xen vào (MainThread 106% +
  `npm exec tsc` 21,0% — process lạ, bắt đầu và kết thúc
  trong cửa sổ, không có trong ps-before/after). P4 sửa
  `parityHarness193.ts` 21:16:31Z trong cửa sổ.
  **Attempt2: TỰ-TẢI LÀ CHÍNH** — load1_max **1,19** (B2
  ĐẠT, dư 2,81); **0 spike B2 trong cửa sổ** (T9); r=−0,62
  (âm). **Attempt3: LẠ-TẢI CHIẾM ƯU THẾ NỬA SAU** —
  load1_max **5,67** (B2 VI PHẠM); **24 spike trong cửa sổ**
  (21:22:34–21:24:30Z, load1 3,22–5,67). Đỉnh 5,67 lúc
  21:23:40Z thuần tự-tải tại thời điểm đó (WebKitWebProcess
  57,2% + MiniBrowser 24,3% = 81,5% top CPU); NHƯNG từ
  21:23:45Z trở đi tải lạ chiếm ưu thế: 2 đợt `npm exec tsc`
  lạ (MainThread 117–127% + tsc, 21:23:45–21:24:00Z và
  21:24:20–21:24:30Z — process lạ, không có trong
  ps-before/after) trong khi WebKit/MiniBrowser của probe
  VẮNG khỏi top-10; load1 vẫn giữ 3,22–5,21 sau khi CPU
  probe đã hạ. Thêm `privsep-test-fu` 10,0% lúc 21:22:34Z
  (lạ) và P4 `vite build` viết lại **263 file dist** trong
  cửa sổ (tsconfig.json 21:22:19Z + reverseAudio.ts
  21:24:13Z — đúng 263 file như đợt 192). **T4 chỉ báo
  số:** dữ kiện thứ 5 lẫn lộn như dữ kiện thứ 4; luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CẢ 3 CỬA SỔ ATTEMPT,
  0 FIRE.** Live `dry_run=False guard=6291456 consec=2`
  (T9-193; quyết (o) đợt 188: BẬT LIVE từ đợt 189). Mẫu
  autotrigger trong cửa sổ: W1 3 mẫu 21:14:41–21:16:41Z,
  W2 4 mẫu 21:18:41–21:21:41Z, W3 3 mẫu 21:22:41–21:24:42Z
  — **trigger=watch, consec=0 ở tất cả các mẫu: 0 FIRE /
  0 WOULD-FIRE / 0 MISSED-WINDOW.** `b2-spikes.log` 0 hit
  FIRE (T9-193 phán cuối). Balloon theo autotrigger: W1
  3,38–4,36 GB; W2 3,45–3,95 GB; W3 3,69–4,14 GB.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 12: KHÔNG THỂ KIỂM
  (F-193-T4-7).** Áp ĐÚNG định nghĩa (p)-192: live-check CHỈ
  đối chiếu trên cửa sổ attempt HỢP LỆ — #61 không có cửa
  sổ hợp lệ nào nên KHÔNG THỂ KIỂM; chuỗi live ĐẠT GIỮ 9.
  Dữ kiện ghi nhận (không dùng làm verdict): W1 marker
  21:14:40Z → done 21:16:57Z; W2 21:18:02Z → 21:21:42Z;
  W3 21:22:04Z → 21:25:41Z. Mtime sớm nhất của analyzer +
  classb mỗi attempt đều SAU attempt-done (classb +0,110 /
  +0,110 / +0,134 s). **0 file analyzer ghi trong cửa sổ
  attempt.** File skiplatest mặc định mtime vẫn 2026-11-23
  18:13:20Z — 0 ghi mới. Live 0 FIRE trong cả 3 cửa sổ
  (10 mẫu). T9 B2 spikes (chỉ ghi nhận): W1 2 / W2 0 /
  W3 24.
- **O8 T01 TRÊN BOOT 1c0bcaad — lock polls #26–#29** (giữ
  lock 21:04:52–21:07:08Z, blockers 5); O8 T8 + harness
  thuộc T8-193 báo cáo.
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (brief đợt 192
  yêu cầu):**
  **W1 (21:14:40–21:16:57Z):** (a) `vite.lock.queue`
  21:14:40Z — lock của CHÍNH T4 (acquire lúc cửa mở);
  (b) T2-193 ghi `m56-193.py` trong cửa sổ; (c) P2 sửa
  `probe-193-p2d.mjs` trong cửa sổ; (d) P4 sửa
  `parityHarness193.ts` 21:16:31Z trong cửa sổ; (e) T9
  `b2-spikes.log` appends liên tục (giám sát, nhẹ).
  **W2 (21:18:02–21:21:42Z):** (a) `vite.lock.queue`
  21:18:02Z — lock của CHÍNH T4; (b) T2-193 ghi 5 file
  evidence-check trong cửa sổ; (c) P2 sửa
  `probe-193-p2e.mjs` trong cửa sổ; (d) T01-193 ghi LIMITS
  `PHASE9_ROUND193_T01_BOOT_VERIFY_LIMITS.md` trong cửa
  sổ; (e) T9 `b2-spikes.log` appends (giám sát, nhẹ).
  **W3 (21:22:04–21:25:41Z):** (a) `vite.lock.queue`
  21:22:04Z — lock của CHÍNH T4; (b) T9 `b2-spikes.log`
  appends (giám sát, nhẹ); (c) T01-193 ghi `NOTES.md` +
  `round193-t01.done` trong cửa sổ; (d) P4 `vite build`
  viết lại **263 file dist** + sửa `tsconfig.json`
  21:22:19Z + `reverseAudio.ts` 21:24:13Z — **tải NẶNG,
  trùng lúc load1 leo 1,32 → 5,67**; (e) 2 đợt `npm exec
  tsc` lạ trong cửa sổ (21:23:45Z + 21:24:20Z). T4 ghi nhận
  sự kiện, KHÔNG tự phán vi phạm — giao T2 phán theo quy
  tắc đứng.
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI QUY
  ĐỊNH.** `run-analyzers-193.sh` chạy NGOÀI cửa sổ cả 3
  lần (sau attempt-done). `round192-*` files modified sau
  marker: 0 file.

## 4. Replay/postboot — POSTBOOT_PASS 1c0bcaad CÓ (T56, poll=1, repair-sớm) + boot mới xảy ra TRƯỚC phiên T4

- **Boot 1c0bcaad (btime 20:22:37Z, số hiệu #117 ỨNG
  VIÊN — T01-193 XÁC MINH, parent quyết (e) ở §14.2-193).**
- **POSTBOOT_PASS 1c0bcaad ĐÃ CÓ 20:59:08Z** (round193-t56/,
  T56-193; T4 chỉ ghi nhận + xác minh độc lập qua check-only
  của mình): "repair-som-quyet-h: dpkg 768 dong; cache 107
  .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc
  2026-11-25T20:59:08Z". **Check-only của T4 PASS độc lập
  từ poll #22 (21:01:51Z)** và giữ PASS suốt phiên (gate0
  T5 24/42 poll). **Replay 1c0bcaad: bracket
  (20:44Z, 20:59:08Z]** — FAIL lúc T4 kiểm tay 20:44:49Z,
  PASS lúc T56 kiểm 20:59:08Z; dpkg.log 2 → 768 dòng trong
  khoảng này; **bracket ~15 phút** (chậm hơn #115 ~11').
  **#114/#115/#116 VẪN CÓ** (không kiểm lại mtime/md5 đợt
  này — giao T5-193/T56-193).
- **Tổng boot không cờ GIỮ 26** (theo quyết (c)-192; 1c0bcaad
  CÓ cờ thì không đổi — T5-193/parent quyết).
- **REBOOT MỚI 1c0bcaad (btime 20:22:37Z, gap 14.464 s từ
  4dda8234) — TRƯỚC KHI T4 MỞ PHIÊN (xem F-193-T4-9).**
  0 reboot trong phiên đo (từ mở poller 20:45:57Z tới
  poller thoát 21:26:36Z, boot luôn 1c0bcaad). **(m)
  1c0bcaad + INSIDE + run 194 kết cục thuộc T2-193/T7-193;
  POSTBOOT_PASS 1c0bcaad thuộc T56-193.**
- **Scheduler gap / OUTAGE + 84l10 / 85m4 / 86n2: KHÔNG CÓ
  DỮ KIỆN TRONG PHIÊN T4.** OUTAGE phán cuối thuộc T7-194;
  verdict harness thuộc T8-193.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND193_T4_WEBKIT_QUIET61_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round193-t4/`):**
  `poll-wait-t4-193.sh` (deadline 22:30Z 25/11 + cờ T5
  round193-t56/ + fallback round192-t56/),
  `run-attempt-193.sh` (lượt yên #61),
  `run-analyzers-193.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt),
  `distinct-seq-193.py` (helper đọc sổ — KHÔNG DÙNG LIVE đợt
  này: không lượt hợp lệ nên sổ không thăng cấp; stage theo
  mẫu 163–192: file helper versioned theo đợt).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–192, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round193-t4/` — theo đúng mẫu 149–192: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, md5 `078938cf...`, giống hệt bản đợt 156–192).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (93981e96) +
  `stats-193.py` + `distinct-seq-193.py` (KHÔNG DÙNG LIVE) +
  `distinct-seq-ledger.json` (as-of-191, md5 `b7ed5791…`) +
  `preflight-193.txt` + `preflight-postboot-193.log` +
  `round193-t4-copy.py`.
- **Log/evidence (hidden_files/round193-t4/, không stage):**
  `poll-t4.log` (42 poll + CỬA MỞ #39/#41/#42 + HẾT NGÂN
  SÁCH 3/3), `poll-t4.nohup.log` (1 instance),
  `poll-test-193.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + 3 lần CỬA MỞ + 3 attempt +
  HẾT NGÂN SÁCH, poller thoát 21:26:36Z),
  `postboot-t4-193-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-193-output.txt` (output stats-193.py),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}-1c0bcaad.json`
  (888.819 B partial / 2.811.155 B / 2.568.267 B),
  `load-mid-t4-attempt{1,2,3}-1c0bcaad.log` (64/105/103
  dòng), `analyze-t4-attempt{1,2,3}-1c0bcaad-*.txt`
  (11 file mỗi attempt — p1p3p7 chạy tay sau analyzers),
  `coverage-check-attempt{1,2,3}-1c0bcaad.txt` (0/N, 1/1,
  0/N), `classb-t4-attempt{1,2,3}-1c0bcaad.txt`,
  `ps-before/after-t4-attempt{1,2,3}-1c0bcaad.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2,3}-*.txt`
  (B4: dpkg 768 cả 3 attempt). **3 JSON attempt (0 hợp lệ).
  0 process T4 sống lúc đóng** (poller thoát 21:26:36Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4). **X11 KHÔNG trống — X193 (probe T4, F-193-T4-8) +
  X98 (P3).**
## 6. Sai số F-193-T4-1..10 (+ nợ cũ)

- **F-193-T4-1 — TREE-MD5 STALE 1 LẦN + CÂY CHURN 1 MD5 (MỚI —
  DẠNG F-192-T4-1, NHẸ HƠN).** (a) Lúc copy-forward:
  tree-md5.txt ghi `50ad3faf` (đợt 192) — ĐÚNG lúc mở poller
  (preview.tsx chưa đổi). (b) Lúc poll: preview.tsx đổi
  **1 md5** (50ad3faf → 93981e96 @21:08:21Z — P1/P2/P3/P4
  sửa đợt 193, telephone g=0,76 + scrub + audio đảo); T4
  KHÔNG đuổi theo mà chờ ổn định 6 poll rồi cập nhật
  tree-md5.txt → `93981e96` lúc 21:13:27Z; poll #37 trở đi
  tree=YES. (c) Grep stale lần 2 bắt thêm 1 chuỗi: comment
  gate0 trong `poll-wait-t4-193.sh` → sửa trước pre-flight.
  Không ảnh hưởng verdict (không attempt nào chạy khi cây
  đang churn — cửa đầu tiên mở lúc 21:14:40Z, sau khi cây ổn
  định ~6 phút).
- **F-193-T4-2 — DPKG.LOG RESET THEO ROOTFS REBUILD (MỚI —
  DẠNG F-192-T4-2).** /var/log/dpkg.log chỉ còn 2 dòng lúc
  T4 mở (reset lúc boot mới 20:22:37Z; bản cũ 1468 dòng ĐÃ
  MẤT, không có dpkg.log.1; /var/log/apt/ KHÔNG TỒN TẠI).
  Poller chỉ ghi dpkg_lines, không gate theo nó;
  POSTBOOT_PASS/dpkg giao T56-193 phán. Replay cài lại từ
  2 → 768 dòng trong phiên.
- **F-193-T4-3 — ATTEMPT1 WEDGED, MẪU H3 (MỚI — QUAN
  TRỌNG).** 3 lần writePartial TIMEOUT 30 s liên tiếp
  (tickCost 21:15:51Z + blendTick 21:16:21Z + c2DrawLog
  21:16:51Z): kênh evaluate chết, process sống — cùng mẫu
  kẹt P5-188 mà T8-191 kết luận là H3-thuần. Đây là lần
  wedged thứ 2 của probe T4 kể từ đợt 188 (lần 1:
  attempt2-192, 2 timeout). Partial JSON giữ 7/20 pass;
  tickCost median 75,0 ms (đã >60 nên dù không wedged
  cũng không hợp lệ).
- **F-193-T4-4 — ATTEMPT2 THIẾU 1,0 ms (MỚI).** 20/20 +
  lớp B ĐẠT 5/5 (load1_max 1,19 — yên nhất đợt này) nhưng
  tickCost median 61,0 ms > 60. Median 61,0 ms là lần thiếu
  sát nhất kể từ khi có ngưỡng 60 (đợt 192 thiếu 3,0 ms);
  median leo giữa lượt (pass 15–18: 93–101) trong khi
  load1 chỉ 0,47–0,61 và RAM ~1100 MB — tải nền KHÔNG giải
  thích được (r=−0,62); không rõ nguyên nhân (cây
  preview.tsx mới 93981e96? balloon? — chỉ ghi nhận, không
  suy đoán).
- **F-193-T4-5 — ATTEMPT3 B1+B2 VI PHẠM DO TẢI LẠ (MỚI).**
  load1_max 5,67 + load5 cuối 2,55; 24 spike B2 trong cửa
  sổ; tải lạ (2 đợt tsc + vite build 263 file dist) giữ
  load1 >3 sau khi CPU probe đã hạ (xem §3). Đây là
  attempt đầu tiên kể từ đợt 192-attempt1 có B2 VI PHẠM
  (load1_max >4).
- **F-193-T4-6 — B2 DỮ KIỆN THỨ 5 LẪN LỘN (MỚI — XEM §3).**
  Attempt1 lẫn nhẹ (tsc lạ ở spike 2); attempt2 tự-tải
  (0 spike); attempt3 lạ-tải chiếm ưu thế nửa sau (tsc lạ
  ×2 + vite build 263 file dist). Lần lẫn lộn thứ 2 liên
  tiếp (dữ kiện thứ 4 cũng lẫn).
- **F-193-T4-7 — (p) LIVE LẦN 12 KHÔNG THỂ KIỂM (MỚI —
  ÁP ĐÚNG ĐỊNH NGHĨA (p)-192).** #61 không có cửa sổ
  attempt HỢP LỆ nào nên live-check KHÔNG THỂ KIỂM; chuỗi
  live ĐẠT GIỮ 9. T4-192 áp sai định nghĩa cũ ("0 spike
  trong cửa sổ attempt kể cả attempt không hợp lệ") đã
  được parent đính chính ở (p)-192; T4-193 áp đúng định
  nghĩa mới. Dữ kiện ghi nhận: 0 file analyzer trong cửa
  sổ; live 0 FIRE trong cả 3 cửa sổ; T9 B2 spikes W1 2 /
  W2 0 / W3 24.
- **F-193-T4-8 — X193 LÀ XVFB CỦA CHÍNH PROBE T4; X98 LÀ
  CỦA P3 (MỚI — THEO F-192-T4-8).** Socket X193 lúc đóng
  là Xvfb do chính probe T4 spawn (attempt3 dọn socket mồ
  côi 21:22:08Z rồi lên :193; socket còn sau khi process
  thoát — như đợt 192). X98 là Xvfb :98 của P3. 0 process
  Xvfb sống lúc đóng.
- **F-193-T4-9 — REBOOT MỚI 1c0bcaad TRƯỚC KHI T4 MỞ
  (MỚI — QUAN TRỌNG).** Boot `1c0bcaad-1f18-43b1-90f5-
  fc6319e63b29`, btime **20:22:37Z** (epoch 1795638157),
  gap từ 4dda8234 = **14.464 s (4h01m04s)**. Reboot xảy ra
  SAU khi đợt 193 mở (17:35:51Z) nhưng TRƯỚC khi T4 mở
  phiên (20:44Z); 0 ảnh hưởng tới 44 poll + 3 attempt
  (đều trên 1c0bcaad). **(m) 1c0bcaad + INSIDE + run 194
  kết cục + số hiệu #117 giao T0/T01/T2/T7/T56-193 và
  parent — T4 KHÔNG tự quyết.** Boot lúc T4 viết cờ là
  1c0bcaad (cùng boot đo).
- **F-193-T4-10 — RAM HỒI SO VỚI ĐỢT 192 NHƯNG VẪN SÁT
  NGƯỠNG (MỚI).** 0/44 poll <500 MB (đợt 192: 6/109);
  RAM <1024 ở 5/44 poll; RAM min toàn phiên 882 MB
  (test poll #1, 1009 MB; poller min 882 MB). RAM là rào
  chắn phụ của cửa retry lần 2 (cùng load5): cửa chỉ mở
  khi RAM vọt lại >1024. Giao T9-193 phán episode (nếu
  có).
- **Nợ cũ:** F-192-T4-1 tái diễn dạng F-193-T4-1 (nhẹ hơn);
  F-192-T4-2 tái diễn dạng F-193-T4-2; F-192-T4-3 tái diễn
  dạng bình thường (replay chậm, bracket ~15'); F-192-T4-4
  tái diễn dạng F-193-T4-3; F-192-T4-5 tái diễn dạng
  F-193-T4-4 (thiếu sát hơn: 1,0 ms); F-192-T4-6 có dữ kiện
  mới (F-193-T4-6); F-192-T4-7 ĐÃ SỬA dạng áp dụng
  (F-193-T4-7); F-192-T4-8 tái diễn dạng F-193-T4-8;
  F-192-T4-9 KHÔNG tái diễn dạng cũ (F-193-T4-9); F-192-
  T4-10 tái diễn dạng nhẹ hơn (F-193-T4-10). F-191-T4-1/2/3
  tái diễn dạng tương ứng; F-191-T4-4 ĐÃ HẾT (gan-mo đếm
  đúng 3 + 2 đủ điều kiện nhưng gate0 chưa đạt); F-191-
  T4-5 ĐÃ HẾT dạng cũ; F-191-T4-6 có dữ kiện mới;
  F-191-T4-7 tái diễn dạng F-193-T4-8; F-191-T4-8 tái diễn
  (T01 chưa đóng cờ); F-191-T4-9 KHÔNG tái diễn; F-191-
  T4-10 KHÔNG tái diễn (MEMORY.md 0 sửa trong phiên).
  F-189-T4-2 tái diễn dạng F-193-T4-10; F-189-T4-4/5 ĐÃ
  HẾT; F-189-T4-6 có dữ kiện mới; F-188-T4-2 tái diễn dạng
  F-193-T4-10; F-188-T4-8 tái diễn dạng F-193-T4-3; F-186/
  185-T4-2 KHÔNG tái diễn; F-184-T4-2 tái diễn dạng
  F-193-T4-10; F-184-T4-4 KHÔNG tái diễn trong phiên
  (F-193-T4-9); F-183-T4-4 tái diễn dạng bình thường (T01
  giữ lock #26–#29); F-181-T4-6 KHÔNG CÓ SỐ MỚI; F-179-
  T4-5 ĐÃ HẾT dạng cũ; F-176-T4-2 KHÔNG tái diễn;
  F-175-T4-2 KHÔNG ÁP DỤNG (0 file analyzer trong cửa sổ).

## 7. P3' cộng dồn (KHÔNG ĐỔI — 50 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 193 (KHÔNG ĐỔI): P1 223/227, P2
  218/218, P3-A1 192/227, P3' 187/199 occurrence = 142/145
  distinct-seq, P7 121/121** (50 lượt hợp lệ — #61 KHÔNG
  CÓ lượt hợp lệ nên không cộng thêm; 0 seq mới).
- **Đóng góp lượt #61: 0/0 seq.** Attempt1 (c2)=0; attempt2
  (c2)=1 (seq 287) NHƯNG attempt KHÔNG hợp lệ — KHÔNG
  tính; attempt3 (c2)=0. Helper `distinct-seq-193.py`
  KHÔNG DÙNG LIVE đợt này (không có attempt hợp lệ để
  thăng cấp sổ); sổ GIỮ NGUYÊN as-of-191 (md5 `b7ed5791`).
  Đợt 194 copy-forward lấy sổ này làm cơ sở.
- **P1/P2/P3-A1/P7 attempt2 (chỉ ghi nhận, KHÔNG tính):**
  seq 287 gần run-end? KHÔNG (0/1, p=1 — YẾU, n=1); đóng
  băng-tại-tick (1/1, p=0,27 — YẾU); P7 ĐÚNG (0/324 entry
  trễ ≥+1f). Không ảnh hưởng cộng dồn.
- **Labellag (b) — CHUỖI TRƯỚC #61 = 0 (theo quyết (m)-192):**
  chuỗi 0 occ (185–187) DỪNG ở đợt 189; đợt 191 có 4 occ/
  1 event; #60 0 occ ở attempt nhưng KHÔNG có lượt hợp lệ
  → chuỗi GIỮ 0. **#61: 0 occurrence / 0 event ở cả 3
  attempt** (max 4f; n=28/498/580 occurrence) — NHƯNG
  không có lượt hợp lệ nên chuỗi **GIỮ 0**.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (không có dữ kiện mới đợt này —
  seq 287 không tính vì attempt không hợp lệ).
- Chuỗi median tickCost 50 lượt KHÔNG ĐỔI (n=50, tổng
  2361,0, trung bình 47,2 ms, min 39,0, max 60,0; 0 lượt
  vượt ngưỡng 60 — dãy đầy đủ xem LIMITS 192 §7).
  Ba median attempt đợt này (75,0 / 61,0 / 69,0) đều VƯỢT
  60 — đợt thứ 2 liên tiếp cả 3 attempt đều vượt ngưỡng
  tickCost (đợt 192: 96,0 / 64,0 / 63,0) — xem F-193-T4-4.

## 8. Chờ quyết parent / nợ đợt 194

- **(a) #61 KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ
  GIỮ 0 (đã ĐỨT ở #60 — ĐỀ XUẤT — parent quyết cuối).**
  Chân lượt yên cho chuỗi FULL PASS **KHÔNG có đợt này.**
- **(b) P3' cộng dồn GIỮ NGUYÊN 50 lượt: P1 223/227, P2
  218/218, P3-A1 192/227, P3' 187/199 = 142/145, P7 121/121:**
  sổ distinct-seq GIỮ NGUYÊN as-of-191 md5 `b7ed5791`.
  **Chờ parent/T10 quyết:** ghi nhận không thăng cấp.
- **(c) BOOT 1c0bcaad (số hiệu #117 ỨNG VIÊN —
  T01-193 chưa đóng cờ, parent quyết (e) ở §14.2-193).**
  **(m) 1c0bcaad + INSIDE + run 194 kết cục thuộc
  T2-193/T7-193; POSTBOOT_PASS 1c0bcaad (T56-193).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 1 chuỗi sót +
  tree-md5 stale bắt bằng md5 đọc trực tiếp (F-193-T4-1);
  T5FLAG chính đã sửa sang `round193-t56/` (FIX F-192-T56-1;
  gate0 T5 PASS từ poll #19).
- **(e) POSTBOOT_PASS 1c0bcaad CÓ lúc T4 đóng (T56 20:59:08Z,
  poll=1, repair-sớm). Tổng boot không cờ GIỮ 26
  (nếu 1c0bcaad tính là có cờ).**
- **(f) RAM hồi so với đợt 192 (0/44 <500 MB) nhưng vẫn sát
  ngưỡng (5/44 <1024 MB, min 882 MB); giao T9-193 phán
  episode (nếu có).**
- **(g) (m) #117 phán CUỐI (T2-193); INSIDE (T2-193);
  POSTBOOT_PASS 1c0bcaad (T56-193); số hiệu 1c0bcaad =
  #117/#118? (T01-193 xác minh; btime 20:22:37Z); OUTAGE
  phán cuối T7-194 (T7-193 kiểm onset khung 25/11);
  auto-trigger lần FIRE thật đầu tiên — VẪN CHƯA XẢY RA
  (T9-193); B2 dữ kiện thứ 5 lẫn lộn (T4-193 — BẢN NÀY);
  (m) #56 lần 35; mù hole-recheck lần 36; prune lần 67;
  headroom 0 (lần thứ 52?); ENOSPC lần 41?; 84l10 PASS
  chuỗi 0?; 86n2-P1 chuỗi 15?; B2 live sạch lần 7?; E-247
  kết cục (T9-193); run 194 kết cục (T7-193).**
- **(h) B2 DỮ KIỆN THỨ 5 LẪN LỘN (F-193-T4-6). Luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách. Auto-trigger LIVE chạy trong cả 3 cửa sổ
  attempt, 0 FIRE** — lần FIRE thật đầu tiên vẫn chưa xảy
  ra; T9-193 verify end-to-end khi có FIRE.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 3 lần đợt này
  (attempt1/2/3) → **0 lượt yên hợp lệ #61 cho chuỗi FULL
  PASS.** O8 T01 trên 1c0bcaad (lock polls #26–#29) thuộc
  T01-193 báo cáo; O8 T8 + harness thuộc T8-193 báo cáo.
- **(j) F-193-T4-1 (tree-md5 stale 1 lần + cây churn 1 md5);
  F-193-T4-2 (dpkg.log reset 2 dòng); F-193-T4-3 (attempt1
  wedged H3, 3 timeout); F-193-T4-4 (attempt2 thiếu 1,0 ms);
  F-193-T4-5 (attempt3 B1+B2 vi phạm do tải lạ); F-193-T4-6
  (B2 dữ kiện thứ 5 lẫn lộn); F-193-T4-7 ((p) live lần 12
  KHÔNG THỂ KIỂM — áp đúng định nghĩa (p)-192);
  F-193-T4-8 (X193 của probe T4, X98 của P3); F-193-T4-9
  (reboot mới 1c0bcaad trước khi T4 mở); F-193-T4-10 (RAM
  hồi nhưng vẫn sát ngưỡng, 0/44 <500 MB).**

## Phụ lục A — stats-193-output.txt

```
== PHU LUC A — thong ke poll trich tu log goc (script stats-193.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-25T20:44:44Z - 2026-11-25T20:44:49Z, boot=1c0bcaad
   RAM min=1009 max=1032 >=1024: 1/2 500-1023: 1/2 <500: 0/2
   load1<2: 0/2 load5<2: 0/2 blockers>0: 0 apt>0: 0
   gate0: khong-dat=2
   lock: khong=2
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 42 poll, 2026-11-25T20:45:57Z - 2026-11-25T21:22:04Z, boot=1c0bcaad
   RAM min=882 max=2949 >=1024: 38/42 500-1023: 4/42 <500: 0/42
   load1<2: 17/42 load5<2: 6/42 blockers>0: 4 apt>0: 18
   gate0: T5=24, khong-dat=18
   lock: co=4, khong=38
   dpkg 2->768
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 44
-- RAM toan phien: min=882 max=2949 >=1024: 39/44 <500: 0/44
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 5/44
   gan-mo? #1 2026-11-25T20:45:57Z boot=1c0bcaad RAM=1064 L1=1.53 L5=1.88 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #3 2026-11-25T20:47:28Z boot=1c0bcaad RAM=1206 L1=1.47 L5=1.78 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #39 2026-11-25T21:14:40Z boot=1c0bcaad RAM=1963 L1=1.04 L5=1.95 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #41 2026-11-25T21:18:02Z boot=1c0bcaad RAM=2949 L1=1.00 L5=1.84 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #42 2026-11-25T21:22:04Z boot=1c0bcaad RAM=2417 L1=1.32 L5=1.30 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 1c0bcaad: 44 poll; RAM>=1024 lan cuoi: 2026-11-25T21:22:04Z #42; RAM<1024 lan dau: 2026-11-25T20:44:49Z #1 RAM=1009
-- cong don P3' (MOI, 50 luot hop le): P1 223/227 P2 218/218 P3-A1 192/227 P3' 187/199 occ = 142/145 distinct-seq P7 121/121
-- chuoi median 50 luot: n=50 mean=47,2 min=39,0 max=60,0 vuot-60: 0
```
