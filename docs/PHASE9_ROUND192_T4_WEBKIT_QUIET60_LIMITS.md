# PHASE9_ROUND192_T4_WEBKIT_QUIET60_LIMITS.md

**Đợt:** 192. **Luồng:** T4 — đo lượt yên WebKit #60 trên 1 boot
+ **#60 KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt hợp lệ (chuỗi 2 → 0 ĐỨT,
  ĐỀ XUẤT — parent quyết cuối).** Attempt3 gần nhất: 20/20 + lớp B
  ĐẠT 5/5 nhưng tickCost median 63,0 ms > 60 (thiếu 3,0 ms).
+ **BOOT ĐO: MỘT boot — ebc5a3b9 (btime 14:23:56Z; SỐ HIỆU #115/#116
  ỨNG VIÊN — T01-192 chưa đóng cờ lúc T4 đóng, parent quyết (e)).
  0 reboot TRONG phiên đo; REBOOT MỚI 4dda8234 (btime 16:21:33Z) xảy
  ra SAU khi poller thoát 16:18:10Z — xem F-192-T4-9.**
+ **P3' CỘNG DỒN KHÔNG ĐỔI (50 lượt hợp lệ): P1 223/227, P2 218/218,
  P3-A1 192/227, P3' 187/199 occurrence = 142/145 distinct-seq, P7
  121/121.** Sổ distinct-seq GIỮ NGUYÊN as-of-191, md5 `b7ed5791`
  (không thăng cấp — không lượt hợp lệ mới, không seq mới).
+ **Labellag (b): 0 occurrence / 0 event ở cả 3 attempt (max 4f).**
+ **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 11: ĐỀ XUẤT KHÔNG ĐẠT** (xem §3,
  F-192-T4-7): W1 22 spike B2 (lạ-tải), W3 4 spike (tự-tải); chỉ W2
  sạch. Chuỗi live ĐẠT 9 → 0 nếu parent chấp nhận.
+ **B2 DỮ KIỆN THỨ 4 — LẪN LỘN, CHỈ BÁO SỐ** (xem §3, F-192-T4-6):
  attempt1 lạ-tải chiếm ưu thế (load1_max 6,09 VI PHẠM), attempt2/3
  tự-tải là chính (load1_max 2,27 / 3,31, B2 ĐẠT cả 2). T4 KHÔNG tự
  đổi luật KHÔNG TÁCH.
**Ngày:** 25/11/2026 (lượt cron 21:35 +07 25/11 = 14:35:51Z 25/11).
**Boot đo:** ebc5a3b9 (109 poll: 2 test + 107 poller).

## 0. Verdict tổng

- **#60 KHÔNG CÓ LƯỢT HỢP LỆ — ngân sách 3/3 đã dùng.** Attempt1:
  20/20 nhưng B2 VI PHẠM (load1_max 6,09) + tickCost median 96,0 ms.
  Attempt2: partial/wedged (exit 3, 9/20 pass) + B5 VI PHẠM (RAM min
  499 MB, 1 mẫu <500) + tickCost median 64,0 ms. Attempt3: 20/20 +
  lớp B ĐẠT 5/5 nhưng tickCost median **63,0 ms > 60** — KHÔNG hợp
  lệ, thiếu 3,0 ms. **Chuỗi lượt yên hợp lệ: 2 → 0 (ĐỨT, ĐỀ XUẤT).**
- **Chân lượt yên cho chuỗi FULL PASS: KHÔNG có đợt này** (0 lượt
  hợp lệ #60) — FULL PASS không thể lên 3; parent quyết cuối.
- **(c2) = 0 seq ở attempt1 + attempt3; = 1 seq (115) ở attempt2
  nhưng attempt partial nên KHÔNG tính** — P3' cộng dồn GIỮ NGUYÊN.
- **0 VI PHẠM PHÍA T4** (không khởi động script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; xem §3/F-192-T4-9).
  Phía T4 giữ sạch — các vi phạm B2/B5 là tải/RAM của máy, không phải
  do T4 gây ra.
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `50ad3faf` (cập
  nhật giữa phiên, xem F-192-T4-1; ổn định từ poll #28).
- **Cờ:** `hidden_files/round192-t4.done` viết lúc đóng, CÓ NỘI
  DUNG, trong hạn cờ ~17:00Z. **Boot lúc viết cờ là 4dda8234 (mới,
  btime 16:21:33Z) — khác boot đo ebc5a3b9 (xem F-192-T4-9).**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (14:42–14:44Z),
ghi vào `hidden_files/round192-t4/preflight-192.txt` — **PASS
PHẦN TĨNH** (1 chuỗi stale bắt được ở lần grep thứ 2 + sửa trước
pre-flight; tree-md5 cập nhật 2 lần — xem F-192-T4-1). Tóm tắt:

- **md5 khớp hệt bản đợt 191:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-191 md5 `b7ed5791…`
  (occ 187/199, distinct 142/145, valid_rounds_p3 38, non_dat
  [260, 364, 498]). **Tree:** preview.tsx lúc mở poller là
  `043a0ef5` (tree-md5.txt đã cập nhật từ `530e10a7` stale của
  đợt 191 — P2/P3 sửa 09:35:30Z đợt 191 sau khi T4-191 đóng;
  T10-191 §2 đã ghi 043a0ef5).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; Playwright-core có mặt (webkit
  object, import tuyệt đối từ `~/scratch-round63-r4/node_modules/
  playwright-core/index.mjs`); media `stripes-nonperiodic.mp4`
  có mặt (140.828 B); không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-25
  16:30:00 UTC` → **1795624200** = 16:30Z (hạn cờ ~17:00Z =
  1795626000, hạn cứng 17:35Z = 1795628100); grep lần 2 sạch
  (chỉ còn hit `round189` CỐ Ý: fallback T5 `round189-t5/` +
  glob `round191-*`); sửa 1 chuỗi stale: comment `(530e10a7)`
  trong `poll-wait-t4-192.sh` → `(043a0ef5)` — xem F-192-T4-1.
- **Copy-forward 191 → 192 (script python thay thế có neo,
  KHÔNG sed global):** deadline `10:30Z` → `16:30Z 25/11`; hạn
  cờ/cứng → `17:00Z`/`17:35Z`; T5FLAG chính `round192-t5/` +
  fallback `round189-t5/` (round191-t5/ KHÔNG TỒN TẠI — T5-191
  chưa từng khởi động); `T4-191a` → `T4-192a`;
  `default=191` → `default=192`; `WebKit #59` → `#60`;
  glob `round189-*` → `round191-*`.
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 191).
- **Freeze check (F-164-T4-1):** `round191-t4` còn **0 file
  mtime ≥ 14:35:51Z** (giờ mở đợt 192).
- **GATE0 LÚC MỞ: CHƯA ĐẠT.** round192-t5/ chưa tồn tại
  (T5-192/T56-192 chưa khởi động lúc 14:44Z); fallback
  round189-t5/ POSTBOOT_PASS mtime 03:11:11Z < btime 14:23:56Z
  nên poller đánh "cu(mtime-cu)", KHÔNG TÍNH — đúng thiết kế
  chống cờ sai boot. **Check-only postboot chạy tay exit=1
  FAIL** (libs thiếu: libevent/libEGL/libavif/libdw/libevdev;
  GST dir không tồn tại; apt 11 gói chưa cài — xem
  `preflight-postboot-192.log`). Replay hệ thống CHƯA XONG
  trên boot mới (boot ~20' tuổi lúc mở); 0 process apt/dpkg
  lúc kiểm. Gate0 dự phòng T4-check-only sẽ đạt khi replay
  heal — poller chờ (mẫu #111/#112).
- **dpkg.log CHỈ CÒN 2 DÒNG** (reset 14:24:38Z theo rootfs
  rebuild lúc boot mới; bản cũ 1468 dòng ĐÃ MẤT, không có
  dpkg.log.1; /var/log/apt/ KHÔNG TỒN TẠI) — xem F-192-T4-2.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (14:44:19Z): RAM 4654 MB, load1 4,47/load5 2,90;
  lần 2 (14:44:23Z): RAM 4642 MB, load1 4,11/load5 2,85;
  cả 2 gate0=khong-dat, t5flag=cu(mtime-cu), postboot_exit=1,
  apt=0, dpkg 2, blockers comm-based=0, tree=YES 043a0ef5.
  Cửa chưa mở vì load1/load5 >2 VÀ gate0 chưa đạt — đúng
  thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~4.600 MB avail; load1 ~4,1 lúc mở** — các luồng
  đợt 192 đang khởi động build/test.
- **F-176-T4-2: KHÔNG TÁI DIỄN** — sampler chạy đúng 1 lần
  trong mỗi attempt (3 load-mid log, dừng sạch).
- **F-185-T4-2: KHÔNG TÁI DIỄN** — một luồng T4 duy nhất từ
  đầu đến cuối.

## 1. Poller — 109 poll thật (2 test + 107), 3 lần cửa mở, 0 reboot trong phiên

- **Test (POLL_TEST=1), 2 poll, boot ebc5a3b9
  (14:44:19Z, 14:44:23Z):** cả 2 đều gate0=khong-dat,
  load1 4,47/4,11, load5 2,90/2,85, RAM 4654/4642 MB,
  lock=khong, blockers comm-based=0, apt=0, dpkg 2 → cửa đóng
  → **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-192.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot ebc5a3b9, 107 poll
  (14:44:49Z–16:13:59Z), 3 lần cửa mở:** RAM ≥1024:
  77/107 (min 249, max 5039 MB); 500–1023: 24/107;
  **<500: 6/107 (chuỗi dài nhất 5 poll)**; load1<2: 27/107;
  load5<2: 3/107; gate0: **T4-check-only 91/107**,
  khong-dat 16/107; lock=co 5, khong 102; blockers>0: 6 poll;
  apt>0: 14 poll; dpkg 2 → 768 (replay cài dần).
- **Giai đoạn 1 — replay chưa xong (poll #1–#16,
  14:44:49–14:56:20Z):** postboot_exit=1, apt=1 (apt-get đang
  chạy); load1 1,31–10,01, load5 tới 5,85. Cửa KHÔNG MỞ.
  dpkg.log 2 → 184 dòng trong giai đoạn này.
- **Giai đoạn 2 — gate0 đạt + T01 giữ lock (poll #17–#21,
  14:57:06–15:00:11Z):** check-only PASS đầu tiên ở #17
  (pb_age=0); T56 ghi POSTBOOT_PASS 14:55:04Z (xem §4).
  T01 giữ lock (thread=t01-round192, pid 101495, port 5560)
  + blockers 5 (vite :5560 + MiniBrowser/WebKit O8).
  **Tree BẮT ĐẦU CHURN ở #18** (xem F-192-T4-1). Cửa KHÔNG MỞ.
- **Giai đoạn 3 — cây churn + tải vọt (poll #22–#40,
  15:00:58–15:14:36Z):** tree đổi 5 lần (549278c8 → 420082ed →
  dc58f1b4 → 254f50f4 → bbad473a → 50ad3faf); load1 tới 10,69,
  load5 tới 6,82 (P3/P4 headed: Chromium run-dense-on-2 +
  parity192 — xem §3). Cửa KHÔNG MỞ.
- **Giai đoạn 4 — cửa mở lần 1 (poll #41, 15:15:22Z):** RAM
  1951 MB, load1 0,60, load5 1,80 → **CỬA YÊN MỞ**, attempt1
  chạy ngay (xem §2).
- **Giai đoạn 5 — tải vọt sau attempt1 (poll #42–#59,
  15:20:19–15:33:17Z):** load1 tới 10,09, load5 tới 6,71
  (P3/P4 headed tiếp tục); RAM rơi dần 2.000 → 1.285 MB.
  Cửa KHÔNG MỞ.
- **Giai đoạn 6 — RAM sập (poll #60–#101,
  15:34–16:05Z):** RAM <1024 ở 30/41 poll, min 249 MB
  (#100); 6 poll <500 MB; balloon tới 5,33 GB. Cửa KHÔNG
  MỞ (RAM và load5 thay nhau chặn).
- **Giai đoạn 7 — cửa mở lần 2 + 3 (poll #106–#107,
  16:08:51–16:13:59Z):** #106 RAM 1062 MB, load1 1,20,
  load5 1,92 → **CỬA MỞ**, attempt2 chạy; #107 RAM 2349 MB,
  load1 0,83, load5 1,25 → **CỬA MỞ NGAY** sau attempt2,
  attempt3 chạy (quyết (h) đợt 149: poll lại gate trước
  mỗi attempt — cả 2 lần đều qua poll mới).
- **0 reboot trong phiên đo.** Poller thoát 16:18:10Z sau
  attempt3 (hết ngân sách 3/3, không có lượt hợp lệ).
- **Phân rã 109 poll thật:** RAM≥1024: 79/109; RAM<500:
  **6/109**. load1<2: 27/109; load5<2: 3/109.
  **Stats "gan-mo" đếm 3 = đúng 3 lần mở cửa thật**
  (#41, #106, #107 — cả 3 đều đủ load1<2 + load5<2 +
  RAM≥1024 đồng thời). gate0: T4-check-only 91/109,
  khong-dat 18/109 (16 poll + 2 test). blockers>0: 6 poll
  (5 lúc T01 giữ lock + 1 lúc khác). apt>0: 14 poll
  (toàn giai đoạn replay).

## 2. Attempts — 3 attempt (ngân sách dùng 3/3), 0 lượt hợp lệ

- **attempt1-ebc5a3b9: 20/20 NHƯNG B2 VI PHẠM + tickCost median
  96,0 ms — KHÔNG HỢP LỆ.** Cửa sổ: marker 15:15:22.573Z →
  attempt-done 15:19:23Z (probe_exit=0; run-attempt exit=0
  15:19:23Z). JSON 1.945.440 B; flip wallMs 31.816 ms; lock
  vite giữ ~4 phút, nhả 15:19:23Z; vite :5187 kill sạch
  (curl 000); sampler dừng sạch (113 dòng).
  **tickCost:** tổng n=327 median **96,0** p90 181,4 max 312
  min 32; hậu flip+2000ms n=204 median 108,0. Theo dải
  wallMs: 0–20k median 69,5; 20–32k median 68–69; 32–45k
  median 51–69; 45–62k median 78,5–114; 62–80k median
  97,5–177 — LEO THEO THỜI GIAN (theo tải lạ tăng dần).
  **Lớp B: B1 ĐẠT** (load5 cuối 2,44); **B2 VI PHẠM
  (load1_max 6,09)**; B3 ĐẠT; B4 ĐẠT (pgrep -x=0, ps
  exact-comm=0, dpkg delta 0); **B5 ĐẠT** (RAM min 664 MB,
  0 mẫu <500; 22/113 mẫu <1024 — cảnh báo, không vi phạm).
  **(c2) = 0 seq** (labellag không có seq nghi ngờ) → P1/
  P3-A1/P7 KHÔNG tính được; **P3' 0 đóng góp.**
  **Labellag (b): 0 occurrence / 0 event** (skippedLatest=1:
  n=64, max 1f; skippedLatest=0: n=242, max 4f; ≥5f: 0).
  **Perpass: load1/pass tăng dần 1,97 → 6,00** (pass 1 →
  pass 15–16) rồi 4,13 (pass 20); RAM/pass rơi dần 1518 →
  664 MB; **r(median~load1) = +0,71** (dương mạnh — khác
  hẳn mẫu tự-tải đợt 191 r=−0,37).
- **attempt2-ebc5a3b9: PARTIAL/WEDGED (exit 3, 9/20 pass) +
  B5 VI PHẠM — KHÔNG TÍNH VERDICT.** Cửa sổ: marker
  16:08:51.914Z → attempt-done 16:13:22Z. JSON partial
  1.148.136 B; flip wallMs 30.003 ms. **Wedged:** 2 lần
  writePartial TIMEOUT 30 s liên tiếp (blendTick 16:12:45Z
  + c2DrawLog 16:13:15Z, pass-timeout) — kênh evaluate chết,
  process sống (mẫu H3 như P5-188 — xem F-192-T4-4); probe
  tự thoát sau khi ghi partial JSON, exit=3.
  **tickCost (partial):** n=210 median **64,0** p90 92,1
  max 163 min 31 (đã >60 — dù không wedged cũng không hợp
  lệ). **Lớp B: B1 ĐẠT; B2 ĐẠT (load1_max 2,27); B3 ĐẠT;
  B4 ĐẠT; B5 VI PHẠM (RAM min 499 MB, 1 mẫu <500;
  126/129 mẫu <1024).** **(c2) = 1 seq (115: presented 21,
  label 20, lag +1f)** — coverage 1/1; P1 YẾU (1/1, p=0,42),
  P3-A1 YẾU (1/1, p=0,254), P7 ĐÚNG (0/80 entry trễ ≥+1f)
  — **KHÔNG tính vào cộng dồn** (attempt partial).
  **Labellag (b): 0 occurrence / 0 event** (max 4f).
  Perpass (9 pass): r=+0,23 (yếu); RAM/pass rơi 1172 → 851.
- **attempt3-ebc5a3b9: 20/20 + LỚP B ĐẠT 5/5 NHƯNG tickCost
  median 63,0 ms > 60 — KHÔNG HỢP LỆ (thiếu 3,0 ms).**
  Cửa sổ: marker 16:13:59.297Z → attempt-done 16:17:38Z
  (probe_exit=0; run-attempt exit=0 16:17:38Z). JSON
  2.766.183 B; flip wallMs 30.269 ms; lock vite giữ ~3m39s,
  nhả 16:17:38Z; vite :5187 kill sạch (curl 000); sampler
  dừng sạch (104 dòng).
  **tickCost:** tổng n=483 median **63,0** p90 90,0 max 168
  min 30; hậu flip+2000ms n=351 median 63,0. Ổn định theo
  thời gian (pass 1–20 median 58–65, không leo).
  **Lớp B ĐẠT 5/5: B1 ĐẠT** (load5 cuối 1,43); **B2 ĐẠT
  (load1_max 3,31)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 1736 MB, 0 mẫu <1024)**.
  **(c2) = 0 seq** → P1/P3-A1/P7 KHÔNG tính được;
  **P3' 0 đóng góp. Labellag (b): 0 occurrence / 0 event**
  (skippedLatest=1: n=124, max 3f; skippedLatest=0: n=434,
  max 4f; ≥5f: 0). **Perpass: r(median~load1) = −0,32**
  (không tương quan dương — mẫu tự-tải như đợt 191).
- **Không attempt nào bị reboot giết; ngân sách 3/3 đã hết.**
  Poller thoát 16:18:10Z (exit 11 — hết ngân sách, không
  có lượt hợp lệ).

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN THỨ 4 CHO QUYẾT TÁCH: LẪN LỘN**
  (xem F-192-T4-6). Ba attempt cho ba bức tranh khác nhau:
  **Attempt1: LẠ-TẢI CHIẾM ƯU THẾ** — load1_max **6,09**
  (B2 VI PHẠM); load1/pass tăng dần theo tiến trình attempt
  (1,97 → 6,00) rồi KHÔNG rơi sau attempt (load5 2,31–2,35
  lúc poll #42–#44 rồi vọt lên 6,71 ở #59 — tải lạ tiếp tục
  leo); r=+0,71. Bằng chứng lạ-tải trực tiếp trong cửa sổ:
  P4 `vite build` viết lại **263 file dist** (index.html
  15:17:33Z) + sửa `parityHarness192.ts` 15:17:54Z +
  `.test.ts` 15:18:34Z. Nhưng top CPU lúc spike đỉnh 6,09
  (15:16:56Z) lại là **probe của chính T4**
  (WebKitWebProcess 53,1% + MainThread 46,2% + MiniBrowser
  22,2%) — bằng chứng lẫn, không thuần một chiều.
  **Attempt2: TỰ-TẢI LÀ CHÍNH** — load1_max **2,27** (B2
  ĐẠT, dư 1,73); 0 spike B2 trong cửa sổ (T9); r=+0,23
  (yếu); fail là do RAM (B5), không phải tải.
  **Attempt3: TỰ-TẢI LÀ CHÍNH** — load1_max **3,31** (B2
  ĐẠT, dư 0,69); 4 spike trong cửa sổ đều tự-tải (lúc spike
  đỉnh 16:15:25Z: WebKitWebProcess 73,2% + MiniBrowser
  32,5% — toàn process của probe T4); r=−0,32 (như đợt 191).
  **T4 chỉ báo số:** dữ kiện thứ 4 không thuần như 3 dữ kiện
  trước (187: 2,93; 189: 2,94; 191: 2,91 — đều tự-tải là
  chính); luật B2 KHÔNG TÁCH vẫn đứng cho tới khi parent
  quyết — T4 KHÔNG tự quyết tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CẢ 3 CỬA SỔ ATTEMPT,
  0 FIRE.** Live `dry_run=False guard=6291456 consec=2`
  (T9-192; quyết (o) đợt 188: BẬT LIVE từ đợt 189). Mẫu
  autotrigger trong cửa sổ: W1 5 mẫu 15:15:29–15:19:29Z,
  W2 5 mẫu 16:08:30–16:12:30Z (+16:13:30Z), W3 4 mẫu
  16:14:30–16:17:30Z — **trigger=watch, consec=0 ở tất cả
  các mẫu: 0 FIRE / 0 WOULD-FIRE / 0 MISSED-WINDOW.**
  `b2-spikes.log` 0 hit FIRE (T9-192 phán cuối). Balloon
  theo autotrigger: W1 4,34–4,64 GB; W2 4,75–5,33 GB (leo —
  khớp RAM sập); W3 3,43–4,27 GB (xả — khớp RAM hồi).
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 11: ĐỀ XUẤT KHÔNG ĐẠT
  (xem F-192-T4-7).** 3 cửa sổ attempt: W1 marker
  15:15:22.573Z → attempt-done 15:19:23Z; W2 marker
  16:08:51.914Z → done 16:13:22Z; W3 marker 16:13:59.297Z
  → done 16:17:38Z. Mtime sớm nhất của 10 file analyzer +
  classb mỗi attempt đều SAU attempt-done: W1 classb
  +0,696 s, W2 classb +0,969 s, W3 classb +0,914 s; muộn
  nhất W1 15:20:19Z, W2 16:13:59Z, W3 16:18:10Z. **0 file
  analyzer ghi trong cửa sổ attempt (cả 3 cửa sổ).**
  File skiplatest mặc định mtime vẫn 2026-11-23 18:13:20Z
  — 0 ghi mới. **Nhưng T9 B2 spikes: W1 22 spike**
  (15:16:09–15:19Z, đỉnh 6,09); **W2 0 spike** (sạch);
  **W3 4 spike** (16:15:15–16:15:30Z, 3,13–3,31, tự-tải).
  Theo định nghĩa đứng ("0 spike B2 trong cửa sổ") thì
  live lần 11 KHÔNG ĐẠT — chuỗi live ĐẠT 9 → 0 nếu parent
  chấp nhận. Ghi chú công bằng: chỉ W2 sạch hoàn toàn; W3
  spike là tự-tải (probe chiếm 73%); W1 spike gắn với vi
  phạm B2 đã ghi (attempt vốn đã không hợp lệ).
- **O8 T01 TRÊN BOOT ebc5a3b9 — CHƯA RÕ LÚC T4 ĐÓNG** (T01-192
  chưa đóng cờ; lock T01 giữ polls #18–#21 rồi nhả; xem
  §4). O8 T8 + harness thuộc T8-192 báo cáo.
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (brief đợt 192
  yêu cầu; khác đợt 191 chỉ ghi "nhẹ"):**
  **W1 (15:15:22–15:19:23Z):** (a) `vite.lock.queue`
  15:15:22.703Z — lock của CHÍNH T4 (acquire lúc cửa mở);
  (b) T2-192 ghi `t4-watch192b.sh` 15:18:03Z (script text
  nhỏ) + `round192-t2.done` 15:19:10Z + LIMITS T2
  (`PHASE9_ROUND192_T2_EPERM_LIMITS.md`) + append
  `build-loop-log.md` 15:19:19Z; (c) P4 sửa
  `parityHarness192.ts` 15:17:54Z + `.test.ts` 15:18:34Z
  VÀ `vite build` viết lại **263 file dist** (index.html
  15:17:33Z) — **tải NẶNG, trùng đúng lúc load1 leo
  1,97 → 6,09**; (d) T9 `b2-spikes.log` appends liên tục
  (giám sát, nhẹ). **W2 (16:08:51–16:13:22Z): 0 file** —
  không file nào trong hidden_files (ngoài round192-t4)
  hay repo (src/docs/dist) bị sửa trong cửa sổ. **W3
  (16:13:59–16:17:38Z):** (a) `vite.lock.queue`
  16:13:59.423Z — lock của CHÍNH T4; (b) T9
  `b2-spikes.log` 16:15:30Z (giám sát, nhẹ); 0 file repo
  bị sửa. T4 ghi nhận sự kiện, KHÔNG tự phán vi phạm —
  giao T2 phán theo quy tắc đứng.
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI
  QUY ĐỊNH.** `run-analyzers-192.sh` chạy NGOÀI cửa sổ cả
  3 lần (sau attempt-done — xem §3, mtime analyzer).
  `round191-*` files modified sau marker: 0 file.

## 4. Replay/postboot — POSTBOOT_PASS ebc5a3b9 CÓ (T56, poll=1, repair-sớm) + boot mới 4dda8234 CHƯA CÓ cờ

- **Boot ebc5a3b9 (btime 14:23:56Z, số hiệu #115/#116 ỨNG
  VIÊN — T01-192 XÁC MINH, parent quyết (e) ở §14.2-192).**
- **POSTBOOT_PASS ebc5a3b9 ĐÃ CÓ 14:55:04Z** (round192-t56/,
  T56-192; T4 chỉ ghi nhận + xác minh độc lập qua check-only
  của mình): "repair-som-quyet-h: dpkg 768 dong; cache 107
  .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc
  2026-11-25T14:55:04Z". **Check-only của T4 PASS độc lập
  từ poll #17 (14:57:06Z)** và giữ PASS suốt phiên (91/107
  poll gate0=T4-check-only). **Replay ebc5a3b9: bracket
  (14:44Z, 14:55:04Z]** — FAIL lúc T4 kiểm tay 14:42:28Z,
  PASS lúc T56 kiểm 14:55:04Z; dpkg.log 2 → 768 dòng trong
  khoảng này; **bracket HẸP NHẤT kẹp được kể từ #48**
  (~11 phút; #52: 2'16", #54: 5'16" — vẫn chậm hơn).
  **#113/#112/#111 VẪN CÓ** (không kiểm lại mtime/md5 đợt
  này — giao T5-192/T56-192).
- **Tổng boot không cờ GIỮ 26** (theo quyết (c)-191 đã đính
  chính 25 → 26; ebc5a3b9 CÓ cờ thì không đổi — T5-192/
  parent quyết).
- **REBOOT MỚI 4dda8234 (btime 16:21:33Z, gap 7.057 s từ
  ebc5a3b9) — SAU KHI T4 ĐÓNG (xem F-192-T4-9).** 0 reboot
  trong phiên đo (từ mở poller 14:44:49Z tới poller thoát
  16:18:10Z, boot luôn ebc5a3b9). **(m) 4dda8234 + INSIDE +
  run 192 kết cục thuộc T2-192/T7-192; POSTBOOT_PASS
  4dda8234 thuộc T56-192.**
- **Scheduler gap / OUTAGE: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  T7-192 phán cuối (T7-194 phán cuối OUTAGE #2 theo quyết
  (n)-188).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-192 báo cáo.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND192_T4_WEBKIT_QUIET60_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round192-t4/`):**
  `poll-wait-t4-192.sh` (deadline 16:30Z 25/11 + cờ T5
  round192-t5/ + fallback round189-t5/),
  `run-attempt-192.sh` (lượt yên #60),
  `run-analyzers-192.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt),
  `distinct-seq-192.py` (helper đọc sổ — KHÔNG DÙNG LIVE đợt
  này: không lượt hợp lệ nên sổ không thăng cấp; stage theo
  mẫu 163–191: file helper versioned theo đợt).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–191, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round192-t4/` — theo đúng mẫu 149–191: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, md5 `078938cf...`, giống hệt bản đợt 156–191).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (50ad3faf) +
  `stats-192.py` + `distinct-seq-192.py` (KHÔNG DÙNG LIVE) +
  `distinct-seq-ledger.json` (as-of-191, md5 `b7ed5791…`) +
  `preflight-192.txt` + `preflight-postboot-192.log` +
  `round192-t4-copy.py`.
- **Log/evidence (hidden_files/round192-t4/, không stage):**
  `poll-t4.log` (107 poll + CỬA MỞ #41/#106/#107 + HẾT NGÂN
  SÁCH 3/3), `poll-t4.nohup.log` (1 instance),
  `poll-test-192.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + 3 lần CỬA MỞ + 3 attempt +
  HẾT NGÂN SÁCH, poller thoát 16:18:10Z),
  `postboot-t4-192-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-192-output.txt` (output stats-192.py),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}-ebc5a3b9.json`
  (1.945.440 B / 1.148.136 B partial / 2.766.183 B),
  `load-mid-t4-attempt{1,2,3}-ebc5a3b9.log` (113/129/104
  dòng sampler), `analyze-t4-attempt{1,2,3}-ebc5a3b9-*.txt`
  (11 file mỗi attempt — p1p3p7 chạy tay sau analyzers,
  như đợt 191),
  `coverage-check-attempt{1,2,3}-ebc5a3b9.txt` (0/N, 1/1,
  0/N), `classb-t4-attempt{1,2,3}-ebc5a3b9.txt`,
  `ps-before/after-t4-attempt{1,2,3}-ebc5a3b9.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2,3}-*.txt`
  (B4: dpkg 768 cả 3 attempt). **3 JSON attempt (0 hợp lệ).
  0 process T4 sống lúc đóng** (poller thoát 16:18:10Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4; pgrep = 1 là tự-trùng pattern). **X11 KHÔNG trống —
  X193 (probe T4, xem F-192-T4-8) + X98 (P3).**

## 6. Sai số F-192-T4-1..10 (+ nợ cũ)

- **F-192-T4-1 — TREE-MD5 STALE 2 LẦN (MỚI — DẠNG
  F-191-T4-1, NẶNG HƠN).** (a) Lúc copy-forward:
  tree-md5.txt còn ghi `530e10a7` (đợt 191) trong khi
  preview.tsx đã đổi thành `043a0ef5` từ 09:35:30Z đợt 191
  (P2/P3 sửa sau khi T4-191 đóng) — T4 cập nhật trước
  pre-flight (bắt bằng md5 đọc trực tiếp, không phải grep).
  (b) Lúc poll: preview.tsx đổi **6 md5 trong 19 phút**
  (043a0ef5 → 549278c8 @14:57:44Z → 420082ed @15:01:13Z →
  dc58f1b4 @15:01:23Z → 254f50f4 → bbad473a → 50ad3faf
  @15:05:02Z — P3 nối reverse-audio wiring, P2/P4 sửa cùng
  lúc); T4 KHÔNG đuổi theo từng md5 mà chờ ổn định 9 poll
  rồi cập nhật tree-md5.txt → `50ad3faf` lúc 15:11:57Z;
  poll #37 trở đi tree=YES. (c) Grep stale lần 2 bắt thêm
  1 chuỗi: comment `(530e10a7)` trong `poll-wait-t4-192.sh`
  → sửa trước pre-flight. Không ảnh hưởng verdict (không
  attempt nào chạy khi cây đang churn — cửa đầu tiên mở
  lúc 15:15:22Z, sau khi cây ổn định 10 phút).
- **F-192-T4-2 — DPKG.LOG RESET THEO ROOTFS REBUILD (MỚI).**
  /var/log/dpkg.log chỉ còn 2 dòng lúc T4 mở (reset
  14:24:38Z lúc boot mới; bản cũ 1468 dòng ĐÃ MẤT, không
  có dpkg.log.1; /var/log/apt/ KHÔNG TỒN TẠI). Poller chỉ
  ghi dpkg_lines, không gate theo nó; POSTBOOT_PASS/dpkg
  giao T56-192 phán. Replay cài lại từ 2 → 768 dòng trong
  phiên.
- **F-192-T4-3 — REPLAY CHẬM, KẸP ĐƯỢC BRACKET (MỚI).**
  Check-only FAIL lúc 14:42:28Z (thiếu 5 lib + GST + 11
  gói apt) → PASS lúc T56 kiểm 14:55:04Z (poll=1,
  repair-sớm-quyet-h). Bracket (14:44Z, 14:55:04Z] —
  ~11 phút, chậm hơn #48 (2'44") và #52 (2'16") nhưng
  nhanh hơn #47 (27,7'). 0 process apt/dpkg lúc T4 kiểm
  14:42Z nhưng apt=1 ở polls #1–#16 (replay chạy ngắt
  quãng).
- **F-192-T4-4 — ATTEMPT2 WEDGED, MẪU H3 (MỚI — QUAN
  TRỌNG).** 2 lần writePartial TIMEOUT 30 s liên tiếp
  (blendTick 16:12:45Z + c2DrawLog 16:13:15Z): kênh
  evaluate chết, process sống — cùng mẫu kẹt P5-188 mà
  T8-191 kết luận là H3-thuần (process sống, kênh evaluate
  chết). Đây là lần wedged đầu tiên của probe T4 kể từ
  đợt 188 (P5) — nhưng ở luồng đo yên, không phải harness.
  Partial JSON giữ 9/20 pass; tickCost median 64,0 ms
  (đã >60 nên dù không wedged cũng không hợp lệ).
- **F-192-T4-5 — ATTEMPT3 THIẾU 3,0 ms (MỚI).** 20/20 +
  lớp B ĐẠT 5/5 (RAM min 1736 MB — tốt nhất đợt này)
  nhưng tickCost median 63,0 ms > 60. Median 63,0 ms là
  cao nhất trong 3 attempt hợp lệ gần nhất của chuỗi
  (58: 42,0; 59: 42,0; 60-attempt3: 63,0) — tải nền của
  đợt (P3/P4 headed + balloon) đã qua nhưng tickCost vẫn
  cao hơn hẳn 42,0 ms của 2 đợt trước; không rõ nguyên
  nhân (cây preview.tsx mới 50ad3faf? — chỉ ghi nhận,
  không suy đoán).
- **F-192-T4-6 — B2 DỮ KIỆN THỨ 4 LẪN LỘN (MỚI — XEM §3).**
  Attempt1 lạ-tải chiếm ưu thế (load1_max 6,09 + vite
  build P4 trong cửa sổ + load không rơi sau attempt);
  attempt2/3 tự-tải là chính (2,27 / 3,31; r=+0,23 / −0,32;
  spike W3 toàn process probe). Đây là dữ kiện đầu tiên
  KHÔNG thuần tự-tải kể từ quyết (p) đợt 186.
- **F-192-T4-7 — (p) LIVE LẦN 11 ĐỀ XUẤT KHÔNG ĐẠT (MỚI).**
  0 file analyzer ghi trong cả 3 cửa sổ (T4 sạch) nhưng
  T9 B2 spikes: W1 22 spike, W3 4 spike — chỉ W2 sạch.
  Theo định nghĩa đứng ("0 spike B2 trong cửa sổ") thì
  KHÔNG ĐẠT; chuỗi live ĐẠT 9 → 0 nếu parent chấp nhận.
  T9-192 phán cuối về định nghĩa spike.
- **F-192-T4-8 — X193 LÀ XVFB CỦA CHÍNH PROBE T4; X98 LÀ
  CỦA P3 (MỚI — THEO F-191-T4-7).** Socket X193 lúc đóng
  là Xvfb do chính probe T4 spawn (như đợt 191). X98 là
  Xvfb :98 của P3 (headed chrome run-dense-on-2, còn
  socket sau khi P3 đóng cờ). 0 process Xvfb sống lúc đóng.
- **F-192-T4-9 — REBOOT MỚI 4dda8234 SAU KHI T4 ĐÓNG (MỚI —
  QUAN TRỌNG).** Boot `4dda8234-2f0f-4414-8a51-25ab2e7e5d6a`,
  btime **16:21:33Z** (epoch 1795623693), gap từ ebc5a3b9 =
  **7.057 s (1h57m37s)**. Poller đã thoát 16:18:10Z —
  reboot xảy ra **~3 phút SAU khi T4 xong việc**; 0 ảnh
  hưởng tới 109 poll + 3 attempt (đều trên ebc5a3b9).
  Journal chỉ còn boot mới (idx 0). T9 sampler-autotrigger
  + T8 wait-t4-t5 đã chạy lại sau reboot (pid mới, etime
  ~4–5'); T56 replay-watch CHƯA thấy lại lúc kiểm 16:28Z.
  **(m) 4dda8234 + INSIDE + run 192 kết cục + POSTBOOT_PASS
  4dda8234 + số hiệu #115/#116 giao T0/T01/T2/T7/T56-192
  và parent — T4 KHÔNG tự quyết.** Boot lúc T4 viết cờ
  là 4dda8234 (khác boot đo).
- **F-192-T4-10 — RAM SẬP (MỚI).** 6/109 poll <500 MB
  (chuỗi dài nhất 5 poll, #97–#101); RAM <1024 ở 30/109
  poll; RAM min toàn phiên 249 MB (#100); balloon theo
  autotrigger tới 5,33 GB (W2). RAM là rào chắn chính của
  cửa retry lần 2 (cùng load5): cửa chỉ mở khi RAM vọt
  lại >1024 (#106: 1062 MB; #107: 2349 MB). Giao T9-192
  phán episode (nếu có).
- **Nợ cũ:** F-191-T4-1 tái diễn dạng F-192-T4-1; F-191-T4-2
  tái diễn dạng F-192-T4-10 (RAM <500: 6/109 — đợt 191 là
  0/23); F-191-T4-3 tái diễn dạng bình thường (tải vọt
  #42–#59, cửa đóng); F-191-T4-4 ĐÃ HẾT (gan-mo đếm đúng 3);
  F-191-T4-5 ĐÃ HẾT dạng cũ (xem F-192-T4-7); F-191-T4-6 có
  dữ kiện mới (F-192-T4-6); F-191-T4-7 tái diễn dạng
  F-192-T4-8; F-191-T4-8 tái diễn (T01 chưa đóng cờ);
  F-191-T4-9 KHÔNG tái diễn dạng cũ (W2 sạch; W1/W3 liệt
  kê đầy đủ ở §3); F-191-T4-10 KHÔNG tái diễn (MEMORY.md
  mtime 11:49:58Z, 0 sửa ngoài lượt).
- **Nợ cũ (tiếp):** F-189-T4-2 tái diễn dạng F-192-T4-10;
  F-189-T4-4 ĐÃ HẾT; F-189-T4-5 ĐÃ HẾT dạng cũ; F-189-T4-6
  có dữ kiện mới; F-188-T4-2 tái diễn dạng F-192-T4-10;
  F-188-T4-8 tái diễn dạng F-192-T4-3 (lần này kẹp được
  bracket); F-186-T4-2 KHÔNG tái diễn; F-185-T4-2 KHÔNG
  tái diễn; F-184-T4-2 tái diễn dạng F-192-T4-10;
  F-184-T4-4 KHÔNG tái diễn trong phiên (reboot mới SAU
  khi T4 xong — F-192-T4-9); F-183-T4-4 tái diễn dạng bình
  thường (T01 giữ lock #18–#21); F-181-T4-6 KHÔNG CÓ SỐ
  MỚI; F-179-T4-5 ĐÃ HẾT dạng cũ; F-176-T4-2 KHÔNG tái
  diễn; F-175-T4-2 KHÔNG ÁP DỤNG (0 file analyzer trong
  cửa sổ attempt).

## 7. P3' cộng dồn (KHÔNG ĐỔI — 50 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 192 (KHÔNG ĐỔI): P1 223/227, P2
  218/218, P3-A1 192/227, P3' 187/199 occurrence = 142/145
  distinct-seq, P7 121/121** (50 lượt hợp lệ — #60 KHÔNG
  CÓ lượt hợp lệ nên không cộng thêm; 0 seq mới).
- **Đóng góp lượt #60: 0/0 seq.** Attempt1 (c2)=0; attempt2
  (c2)=1 (seq 115) NHƯNG attempt partial — KHÔNG tính;
  attempt3 (c2)=0. Helper `distinct-seq-192.py` KHÔNG
  DÙNG LIVE đợt này (không có attempt hợp lệ để thăng cấp
  sổ); sổ GIỮ NGUYÊN as-of-191 (md5 `b7ed5791`). Đợt 193
  copy-forward lấy sổ này làm cơ sở.
- **P1/P2/P3-A1/P7 attempt2 (chỉ ghi nhận, KHÔNG tính):**
  seq 115 gần run-end (1/1, p=0,42 — YẾU, n=1); đóng
  băng-tại-tick (1/1, p=0,254 — YẾU); P7 ĐÚNG (0/80 entry
  trễ ≥+1f). Không ảnh hưởng cộng dồn.
- **Labellag (b): 0 occurrence / 0 event ở cả 3 attempt**
  (max 4f; n=306/128/558 occurrence). Chuỗi 0 occ: đợt 191
  có 4 occ/1 event (đã DỪNG chuỗi 0 ở đợt 189); đợt này
  (b) lại 0 occ — NHƯNG không có lượt hợp lệ nên T4
  KHÔNG tự quyết chuỗi 0 có tính lại từ 1 hay không —
  giao parent/T10 (câu hỏi: (b) tính theo lượt hợp lệ hay
  theo attempt đo?).
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (không có dữ kiện mới đợt này).
- Chuỗi median tickCost 50 lượt KHÔNG ĐỔI (n=50, tổng
  2361,0, trung bình 47,2 ms, min 39,0, max 60,0; 0 lượt
  vượt ngưỡng 60 — dãy đầy đủ xem LIMITS 191 §7).
  Ba median attempt đợt này (96,0 / 64,0 / 63,0) đều VƯỢT
  60 — đợt đầu tiên cả 3 attempt đều vượt ngưỡng tickCost
  (xem F-192-T4-5).

## 8. Chờ quyết parent / nợ đợt 193

- **(a) #60 KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ
  2 → 0 (ĐỨT, ĐỀ XUẤT — parent quyết cuối).** Chân lượt yên
  cho chuỗi FULL PASS **KHÔNG có đợt này.**
- **(b) P3' cộng dồn GIỮ NGUYÊN 50 lượt: P1 223/227, P2
  218/218, P3-A1 192/227, P3' 187/199 = 142/145, P7 121/121:**
  sổ distinct-seq GIỮ NGUYÊN as-of-191 md5 `b7ed5791`.
  **Chờ parent/T10 quyết:** ghi nhận không thăng cấp.
- **(c) BOOT ebc5a3b9 (số hiệu #115/#116 ỨNG VIÊN —
  T01-192 chưa đóng cờ, parent quyết (e) ở §14.2-192).**
  **Boot mới 4dda8234 (btime 16:21:33Z) chờ T0/T01-192
  xác minh + parent quyết số hiệu. (m) ebc5a3b9 + (m)
  4dda8234 + INSIDE thuộc T2-192.**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 1 chuỗi sót +
  tree-md5 stale bắt bằng md5 đọc trực tiếp (F-192-T4-1);
  gate0 dự phòng ĐẠT lúc mở poller qua check-only ở poll
  #17 (replay heal 14:55:04Z).
- **(e) POSTBOOT_PASS ebc5a3b9 CÓ lúc T4 đóng (T56 14:55:04Z,
  poll=1, repair-sớm). POSTBOOT_PASS 4dda8234 CHƯA CÓ lúc
  T4 đóng — chờ T56-192.** Tổng boot không cờ GIỮ 26
  (nếu ebc5a3b9 tính là có cờ).
- **(f) RAM sập + balloon tới 5,33 GB (F-192-T4-10); giao
  T9-192 phán episode (nếu có).**
- **(g) (m) #115/#116 phán CUỐI (T2-192); (m) 4dda8234
  (T2-192); INSIDE (T2-192); POSTBOOT_PASS 4dda8234
  (T56-192); số hiệu 4dda8234 = #116/#117? (T01-192 xác
  minh; btime 16:21:33Z); OUTAGE phán cuối T7-194 (T7-193
  kiểm onset khung 25/11); auto-trigger lần FIRE thật đầu
  tiên — VẪN CHƯA XẢY RA (T9-192); B1 điều tra kẹt P5 đợt
  188 (xong đợt 191); B2 dữ kiện thứ 4 lẫn lộn (T4-192 —
  BẢN NÀY); (m) #56 lần 34; mù hole-recheck lần 35; prune
  lần 66; headroom 0 (lần thứ 51?); ENOSPC lần 40?;
  84l10 PASS chuỗi 11?; 86n2-P1 chuỗi 14?; B2 live sạch lần
  6?; E-247 kết cục (T9-192); run 192 kết cục (T7-192 —
  reboot 16:21:33Z giữa chừng).**
- **(h) B2 DỮ KIỆN THỨ 4 LẪN LỘN (F-192-T4-6). Luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách. Auto-trigger LIVE chạy trong cả 3 cửa sổ
  attempt, 0 FIRE** — lần FIRE thật đầu tiên vẫn chưa xảy
  ra; T9-192 verify end-to-end khi có FIRE.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 3 lần đợt này
  (attempt1/2/3) → **0 lượt yên hợp lệ #60 cho chuỗi FULL
  PASS.** O8 T01 trên ebc5a3b9 (lock polls #18–#21) thuộc
  T01-192 báo cáo; O8 T8 + harness thuộc T8-192 báo cáo.
- **(j) F-192-T4-1 (tree-md5 stale 2 lần + cây churn 6 md5);
  F-192-T4-2 (dpkg.log reset 2 dòng); F-192-T4-3 (replay
  chậm, bracket ~11'); F-192-T4-4 (attempt2 wedged H3);
  F-192-T4-5 (attempt3 thiếu 3,0 ms); F-192-T4-6 (B2 dữ
  kiện thứ 4 lẫn lộn); F-192-T4-7 ((p) live lần 11 đề xuất
  KHÔNG ĐẠT); F-192-T4-8 (X193 của probe T4, X98 của P3);
  F-192-T4-9 (reboot mới 4dda8234 sau khi T4 đóng);
  F-192-T4-10 (RAM sập 6/109 poll <500 MB).**

## Phụ lục A — stats-192-output.txt (nguyên văn)

```
== PHU LUC A — thong ke poll trich tu log goc (script stats-192.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-25T14:44:19Z - 2026-11-25T14:44:23Z, boot=ebc5a3b9
   RAM min=4642 max=4654 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 0/2 blockers>0: 0 apt>0: 0
   gate0: khong-dat=2
   lock: khong=2
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 107 poll, 2026-11-25T14:44:49Z - 2026-11-25T16:13:59Z, boot=ebc5a3b9
   RAM min=249 max=5039 >=1024: 77/107 500-1023: 24/107 <500: 6/107
   load1<2: 27/107 load5<2: 3/107 blockers>0: 6 apt>0: 14
   gate0: T4-check-only=91, khong-dat=16
   lock: co=5, khong=102
   dpkg 2->768
   chuoi RAM<500 dai nhat: 5 poll
-- TONG poll that: 109
-- RAM toan phien: min=249 max=5039 >=1024: 79/109 <500: 6/109
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 3/109
   gan-mo? #41 2026-11-25T15:15:22Z boot=ebc5a3b9 RAM=1951 L1=0.60 L5=1.80 blk=0 apt=0 gate0=T4-check-only(pb_age=0) lock=khong t5=cu(mtime-cu)
   gan-mo? #106 2026-11-25T16:08:51Z boot=ebc5a3b9 RAM=1062 L1=1.20 L5=1.92 blk=0 apt=0 gate0=T4-check-only(pb_age=1) lock=khong t5=cu(mtime-cu)
   gan-mo? #107 2026-11-25T16:13:59Z boot=ebc5a3b9 RAM=2349 L1=0.83 L5=1.25 blk=0 apt=0 gate0=T4-check-only(pb_age=2) lock=khong t5=cu(mtime-cu)
-- boot ebc5a3b9: 109 poll; RAM>=1024 lan cuoi: 2026-11-25T16:13:59Z #107; RAM<1024 lan dau: 2026-11-25T15:30:59Z #56 RAM=861
-- cong don P3' (MOI, 50 luot hop le): P1 223/227 P2 218/218 P3-A1 192/227 P3' 187/199 occ = 142/145 distinct-seq P7 121/121
-- chuoi median 50 luot: n=50 mean=47,2 min=39,0 max=60,0 vuot-60: 0
```
