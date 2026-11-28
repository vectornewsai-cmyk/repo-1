# PHASE9_ROUND197_T4_WEBKIT_QUIET65_LIMITS.md

**Đợt:** 197. **Luồng:** T4 — đo lượt yên WebKit #65 trên 1 boot
+ **#65 CÓ LƯỢT HỢP LỆ — attempt2 hợp lệ (chuỗi lượt yên hợp lệ
  0 → 1).** Attempt1: 20/20 NHƯNG B4 VI PHẠM (dpkg delta 110 —
  T56 cài `libwebkitgtk-6.0-4` xong trong cửa sổ). Attempt2:
  20/20 + lớp B ĐẠT 5/5 + tickCost median 47,0 ms ≤ 60 —
  **LUOT HOP LE**. Ngân sách dùng 2/3.
+ **BOOT ĐO: MỘT boot — 8304fcd1 (btime 20:27:48Z; SỐ HIỆU #125
  ỨNG VIÊN — T01-197 xác minh 9 nguồn tươi). 0 reboot TRONG
  phiên đo; boot mới xảy ra TRƯỚC khi đợt mở ~8 phút.**
+ **P3' CỘNG DỒN MỚI (52 lượt hợp lệ): P1 233/237, P2 228/228,
  P3-A1 198/237, P3' 195/209 occurrence = 145/148 distinct-seq,
  P7 131/131.** Sổ distinct-seq THĂNG CẤP as-of-197, md5
  `242e24f3` (seq MỚI: 316, 394). Sổ gốc as-of-195 KHÔNG đổi
  (`b99babc5`).
+ **Labellag (b) — lượt hợp lệ #65 có 6 occ / 1 event (lag5) nên
  chuỗi 0 occ GIỮ 0** (quyết (m)-192: chỉ lượt hợp lệ mới tính;
  lượt có occurrence thì không phải lượt 0 occ — cùng tiền lệ
  #63: 6 occ/2 events → GIỮ 0).
+ **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 16: ĐẠT** (xem §3,
  F-197-T4-6): cửa sổ attempt HỢP LỆ duy nhất W2 (attempt2)
  có 4 mẫu autotrigger đều watch/consec=0, 0 FIRE, 0 spike B2,
  max avail 2.343.548 kB < guard. **Chuỗi live ĐẠT 0 → 1.**
  T9-197 xác nhận độc lập sau (T9 chưa đóng lúc T4 đóng).
+ **B2 DỮ KIỆN THỨ 9 — CẢ 2 CỬA SỔ ĐỀU 0 SPIKE (xem §3,
  F-197-T4-5):** W1 0 spike, W2 0 spike (watcher T9 sống,
  ngưỡng load1 ≥ 3,0 mỗi 2 s; sampler T4 xác nhận độc lập
  load1_max 2,88 / 2,75 < 3,0). Lần đầu tiên kể từ dữ kiện
  thứ 7 có cửa sổ sạch hoàn toàn. T4 CHỈ BÁO SỐ — KHÔNG tự
  đổi luật KHÔNG TÁCH.
+ **FULL PASS: KHÔNG CÓ — chân O8 VẮNG.** Chân (b) lượt yên
  CÓ (attempt2 hợp lệ); chân O8 KHÔNG ĐẠT theo T01-197
  (WebKit attempt1 FAIL harness timeout 0 result, attempt2
  PASS 21/21, Chromium PASS 21/21 — 2/3). Harness T8 thuộc
  T8-197 báo cáo (T8 chưa đóng lúc T4 đóng).
**Ngày:** 26/11/2026 (lượt cron 03:35 +07 27/11 = 20:35:51Z).
**Boot đo:** 8304fcd1 (59 poll: 1 test + 58 poller).

## 0. Verdict tổng

- **#65 CÓ LƯỢT HỢP LỆ — attempt2 hợp lệ, ngân sách 2/3 đã
  dùng.** Attempt1: 20/20 NHƯNG B4 vi phạm (dpkg delta 110)
  + tickCost median 49,0 ms ≤ 60. Attempt2: 20/20 + lớp B
  ĐẠT 5/5 + median 47,0 ms ≤ 60 — **LUOT HOP LE**.
  **Chuỗi lượt yên hợp lệ: 0 → 1 (lượt hợp lệ #65 sau khi
  #64 đứt chuỗi).**
- **Chân lượt yên cho chuỗi FULL PASS: CÓ đợt này** — FULL
  PASS vẫn không có vì chân O8 vắng (parent/T10 quyết cuối).
- **(c2) attempt2 [293, 316, 342, 394, 446, 473] — CỘNG SỔ**
  (lượt hợp lệ; P1/P2/P3-A1/P7 đều ĐÚNG 6/6). (c2) attempt1
  [290, 313] KHÔNG cộng sổ (attempt không hợp lệ).
  P3' cộng dồn MỚI 52 lượt. Labellag (b): lượt hợp lệ 6 occ
  / 1 event (lag5) → chuỗi 0 occ GIỮ 0.
- **0 VI PHẠM PHÍA T4** (không khởi động script nặng nào trong
  lúc gate0wait; không probe dpkg nào trong cả phiên; check-only
  postboot mỗi 4 poll là dự phòng được quyết, không phải vi
  phạm; launch-test 1 lần ở pre-flight là kiểm nhẹ, không phải
  attempt — xem §0b). Cài `libwebkitgtk-6.0-4` trong W1 là của
  T56 (F-197-T4-2), không phải vi phạm phía T4.
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `af6c3cc7`
  (ổn định từ lúc mở poller tới đóng — 0 lần đổi trong phiên).
- **Cờ:** `hidden_files/round197-t4.done` viết lúc đóng, CÓ NỘI
  DUNG, trong hạn cờ ~23:00Z. **Boot lúc viết cờ là 8304fcd1 —
  CÙNG boot đo.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (20:40–20:50Z),
ghi vào `hidden_files/round197-t4/preflight-197.txt` — **PASS
PHẦN TĨNH, FAIL PHẦN POSTBOOT (xem dưới)**. Tóm tắt:

- **md5 khớp hệt bản đợt 196:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-195 md5 `b99babc5…`
  (occ 189/203, distinct 143/146, valid_rounds_p3 39,
  non_dat_in_union [260, 364, 498]). **Tree:** preview.tsx lúc
  mở poller là `af6c3cc7` (đọc trực tiếp 20:44Z; KHÁC md5 cuối
  đợt 196 `b2a2860b` — cây đổi trong khoảng giữa 2 đợt).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12+ file py; Playwright-core có mặt; media
  `stripes-nonperiodic.mp4` có mặt (140.828 B); không có
  `vite.lock`, không có `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-26
  22:30:00 UTC` → **1795732200** = 22:30Z (hạn cờ ~23:00Z =
  1795734000, hạn cứng 23:35:51Z = 1795736151); grep lần 2 sạch
  (chỉ còn hit `round197-t56/` fallback + glob `round196-*`
  CỐ Ý); sửa 3 chuỗi stale: comment gate0
  (round196-t56/round195-t56/ → round197-t56/round196-t56/),
  comment "het han cat 16:30Z" → 22:30Z (2 chỗ) — xem
  F-197-T4-3.
- **Copy-forward 196 → 197 (script python thay thế có neo,
  KHÔNG sed global):** deadline `16:30Z` → `22:30Z 26/11`;
  hạn cờ/cứng → `23:00Z`/`23:35Z`; T5FLAG chính `round197-t56/`
  + fallback `round196-t56/` (FIX F-192-T56-1); `T4-196a` →
  `T4-197a`; `WebKit #64` → `#65`; glob `round195-*` →
  `round196-*`. Lỗi neo 0 lần (chạy 1 lần OK).
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 196).
- **Freeze check (F-164-T4-1):** `round196-t4` còn **0 file
  làm việc** mtime ≥ 20:35:51Z (đợt 197 mở 03:35:51 +07).
- **GATE0 LÚC MỞ: CHƯA ĐẠT (cờ T5).** round197-t56/ chưa tồn
  tại (T56-197 chưa khởi động lúc 20:40Z); fallback
  round196-t56/ POSTBOOT_PASS mtime 14:41:58Z < btime
  20:27:48Z nên poller đánh "cu(mtime-cu)", KHÔNG TÍNH — đúng
  thiết kế chống cờ sai boot. **Check-only postboot chạy tay
  exit=1 FAIL** (xem `preflight-postboot-197.log`):
  thiếu libs libevent-2.1.so.7 libEGL.so.1 libavif.so.16
  libdw.so.1 libevdev.so.2; GST hệ thống KHÔNG TỒN TẠI;
  apt thiếu 10 gói; **dpkg.log CHỈ 2 DÒNG** (rootfs rebuild —
  replay hệ thống chưa chạy); debroot GST 269 plugin CÓ MẶT.
- **LAUNCH TEST (--launch-test) 20:43:33Z: PASS launch** —
  WebKit launch + evaluate OK (l8-postboot-launch.json,
  display :195, mode o8env) — WebKit CHẠY ĐƯỢC trên boot này
  NHỜ libs debroot/bundled, BẤT CHẤP check-only FAIL về libs
  hệ thống. Xvfb :195 của launch test đã kill sạch sau test.
  **Gate0 dự phòng T4-check-only TẠM KHÔNG ĐẠT** cho tới khi
  libs được khôi phục (T56-197) — poller chờ cờ T5; T4 KHÔNG
  tự chạy --repair (việc khôi phục libs thuộc T56; tránh
  tranh apt lock).
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (trước launch test).
- **RAM lúc mở ~578–754 MB avail; load1 ~0,9–1,7 lúc mở.**
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 59 poll thật (1 test + 58), 2 lần cửa mở, 0 reboot trong phiên

- **Test (POLL_TEST=1), 1 poll, boot 8304fcd1
  (20:44:22Z):** RAM 2249 MB, load1 1,52/load5 1,25, lock=co
  (T01-197 pid 5056 port 5560), blockers=4, gate0=khong-dat,
  t5flag=cu(mtime-cu), postboot_exit=1, apt=0, dpkg 2 →
  **TEST-POLL-OK exit 7 đúng thiết kế.** Poll này nằm trong
  `poll-test-197.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 8304fcd1, 58 poll
  (20:44:32Z–21:30:48Z), 2 lần cửa mở:** RAM ≥1024:
  54/58 (min 672, max 2796 MB); **<500: 0/58**;
  load1<2: 35/58; load5<2: 20/58; gate0:
  **T5 1/58**, T4-check-only 1/58, khong-dat 56/58; lock=co 8,
  khong 50; blockers>0: 14 poll; apt>0: 50 poll; dpkg 2→887.
- **Giai đoạn 1 — chờ T01 nhả lock + T56 sửa libs (poll #1–#8,
  20:44:32–20:47:33Z):** T01 giữ lock (thread=t01-round197,
  pid 5056, port 5560) polls #1–#8, nhả ở #9; load1 1,04–1,52,
  load5 1,22–1,29; RAM 1569–2187 MB. Cửa KHÔNG MỞ.
  **T56 trigger early-repair 20:45:51Z** (boot_age 1083 s,
  frozen 610 s, dpkg_lines=2 — xem LIMITS T56-197).
- **Giai đoạn 2 — gate0 chưa đạt, apt repair chạy (poll #9–#44,
  20:48:18–21:17:03Z):** gate0=khong-dat suốt (postboot_exit=1;
  T5 flag vẫn "cu"); apt=1 hầu hết các poll (T56 repair:
  apt-get update TIMEOUT 1500 s lúc 21:10:52Z, rồi chạy tay
  lại); load1 0,79–3,39, load5 1,38–3,81 — load5 KHÔNG xuống
  dưới 2 tới #45; RAM 672–2650 MB (4 poll <1024, min 672 ở
  #6). Cửa KHÔNG MỞ. **Cây ỔN ĐỊNH af6c3cc7 suốt phiên**
  (0 poll MD5-KHAC — khác hẳn đợt 196: 31 poll MD5-KHAC).
- **Giai đoạn 3 — load hạ, chờ gate0 (poll #45–#56,
  21:17:48–21:26:05Z):** load1 0,79–1,58, load5 1,38–1,85;
  apt=1 tới #53 rồi =0 từ #54 (repair xong phần apt);
  RAM 1136–2447 MB. Cửa KHÔNG MỞ (gate0 vẫn khong-dat:
  T56 viết cờ tay 21:28:14Z nhưng poller chưa thấy vì cờ
  ghi sau poll #56; check-only của T4 vẫn exit=1 tới #56).
- **Giai đoạn 4 — cửa mở 2 lần (poll #57, #58):** #57
  (21:26:50Z) RAM 2132 MB, load1 0,37, load5 1,19 →
  **CỬA YÊN MỞ (gate0=T4-check-only, pb_age=0)** — check-only
  PASS lần đầu (libs đủ sau repair 21:24:17Z), attempt1 chạy;
  #58 (21:30:48Z) RAM 2796 MB, load1 1,46, load5 1,46 →
  **CỬA MỞ NGAY** sau attempt1 (gate0=T5 — T56 viết
  POSTBOOT_PASS 21:28:14Z, poller thấy ở #58), attempt2 chạy
  (quyết (h) đợt 149: poll lại gate trước mỗi attempt — cả 2
  lần đều qua poll mới).
- **0 reboot trong phiên đo.** Poller thoát 21:34:44Z sau
  attempt2 hợp lệ (LUOT HOP LE, exit 0).
- **Phân rã 59 poll thật:** RAM≥1024: 55/59; RAM<500:
  **0/59**. load1<2: 36/59; load5<2: 21/59.
  **"gan-mo" đếm 18 = 2 lần mở cửa thật** (#57, #58)
  + 16 lần đủ load/RAM/lock/blockers nhưng kẹt gate0
  (#1–#6 test+poller, #45, #46, #48, #50–#56).
  gate0: T5=1, T4-check-only=1, khong-dat=56 (+1 test).
  blockers>0: 14 poll. apt>0: 50 poll. dpkg 2→887.

## 2. Attempts — 2 attempt (ngân sách dùng 2/3), 1 lượt hợp lệ

- **attempt1-8304fcd1: 20/20 NHƯNG B4 VI PHẠM — KHÔNG HỢP
  LỆ.** Cửa sổ: marker 21:26:51Z → attempt-done 21:30:24Z
  (inner-end 21:30:18Z, probe_exit=0; run-attempt exit=0
  21:30:24Z; analyzers chạy NGOÀI cửa sổ 21:30:24–21:30:48Z).
  JSON 3.322.486 B; flip wallMs 27.331 ms; lock vite giữ 213 s,
  nhả 21:30:24Z; vite :5187 kill sạch (curl 000); sampler dừng
  sạch (102 dòng). **0 writePartial TIMEOUT** (không wedged).
  **tickCost:** tổng n=584 median **49,0** p90 77,0 max 99
  min 28; hậu flip+2000ms n=433 median 50,0. Theo dải wallMs
  median 41,0 → 49,0 → 41,0 — THẤP ĐỀU XUYÊN SUỐT.
  **Lớp B: B1 ĐẠT** (load5 cuối 1,44); **B2 ĐẠT
  (load1_max 2,88)**; B3 ĐẠT; **B4 VI PHẠM (dpkg delta 110:
  777 → 887)**; **B5 ĐẠT (RAM min 1413 MB, 0 mẫu <500;
  0/101 mẫu <1024)**.
  **(c2) = 2 seq [290, 313]** → P3' ĐẠT (stall_truoc=4/4) —
  NHƯNG KHÔNG tính (attempt không hợp lệ).
  **Labellag (b): 0 occurrence ≥5f** (skippedLatest=1: n=71,
  max 3f; skippedLatest=0: n=280, max 4f) — **KHÔNG tính vào
  chuỗi** (attempt không hợp lệ). lag5 (b): 0 occ.
  **Perpass (20 pass):** median 42,5/38,0/41,0/38,0/57,5/47,0/
  40,0/42,0/39,5/54,0/59,5/51,0/58,5/52,0/42,0/51,0/49,0/51,0/
  56,0/54,0 — THẤP ĐỀU (38–59,5, không pass nào >60);
  **n=20–35 tick mọi pass** (không pass thưa — khác F-196-T4-4).
  **Load1 theo pass TĂNG DẦN NỬA SAU: mean 0,57 → 0,58 →
  0,54 → 0,52 → 0,49 → 0,45 → 0,44 → 0,42 → 0,51 → 0,61 →
  1,32 → 2,23 → 2,52 → 2,55 → 2,34 → 2,24 → 2,23 → 2,32 →
  2,52 → 2,70** (xem F-197-T4-4: apt install bắt đầu pass 11).
  **Vite re-optimize ở đầu attempt** (log 21:26:52Z:
  "Re-optimizing dependencies because vite config has changed")
  NHƯNG B2 vẫn ĐẠT (xem F-197-T4-1).
- **attempt2-8304fcd1: 20/20 + LỚP B ĐẠT 5/5 + tickCost median
  47,0 ms ≤ 60 — LƯỢT HỢP LỆ.** Cửa sổ: marker 21:30:48Z →
  attempt-done 21:34:18Z (inner-end 21:34:14Z, probe_exit=0;
  run-attempt exit=0 21:34:18Z; analyzers chạy NGOÀI cửa sổ
  21:34:18–21:34:44Z). JSON 3.394.434 B; flip wallMs 27.877 ms;
  lock vite giữ 210 s, nhả 21:34:18Z; vite :5187 kill sạch
  (curl 000); sampler dừng sạch (102 dòng). **0 writePartial
  TIMEOUT.**
  **tickCost:** tổng n=615 median **47,0** p90 76,6 max 150
  min 28; hậu flip+2000ms n=455 median 47,0.
  **Lớp B: B1 ĐẠT** (load5 cuối 1,18); **B2 ĐẠT
  (load1_max 2,75)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 1798 MB, 0 mẫu <500; 0/101 mẫu <1024)**.
  **(c2) = 6 seq [293, 316, 342, 394, 446, 473]** → P3' ĐẠT
  6/6 (stall_truoc=7/5/5/3/6/5); **P1 ĐÚNG 6/6
  (p=7,44e-06); P3-A1 ĐÚNG 6/6 (p=0,000214); P2 ĐÚNG 6/6
  (lag +1f cả 6); P7 ĐÚNG** (0 entry trễ ≥+1f).
  **Labellag (b): skippedLatest=1: 0 occ ≥5f** (n=75, max 3f);
  **skippedLatest=0: 6 occ ≥5f** (n=290, max 13f);
  **lag5 (b): 6 occurrence / 1 event** (seq 148–151, lag max
  +13f, M=[28], tBlend 32990–33374 ms) — **TÍNH VÀO CHUỖI:
  lượt hợp lệ có occurrence → chuỗi 0 occ GIỮ 0.**
  **Perpass (20 pass):** median 57,0/51,0/40,0/51,0/41,0/52,0/
  53,0/50,0/70,0/49,5/43,0/52,0/41,0/40,0/44,5/42,0/41,0/45,0/
  42,5/42,0 — THẤP ĐỀU (40–70, chỉ pass 9 = 70,0 là cao);
  n=24–34 tick mọi pass. **Load1 theo pass HÌNH BƯỚU:
  mean 1,57 → 1,89 → 1,89 → 1,90 → 2,22 → 2,25 → 2,44 →
  2,75 → 2,71 → 2,66 → 2,56 → 2,50 → 2,48 → 2,40 → 2,34 →
  2,39 → 2,28 → 2,28 → 2,18 → 2,06** (lên rồi hạ — khác
  ramp đơn điệu đợt 196).
- **Ngân sách 2/3 đã dùng; poller thoát 21:34:44Z (exit 0 —
  LUOT HOP LE).**

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN THỨ 9 CHO QUYẾT TÁCH: CẢ 2 CỬA SỔ ĐỀU
  0 SPIKE (xem F-197-T4-5).** Watcher T9 (pid 4526, sống
  suốt phiên) poll load1 mỗi 2 s, ghi spike khi load1 ≥ 3,0:
  **Attempt1: 0 spike trong cửa sổ** (21:26:51–21:30:24Z),
  **Attempt2: 0 spike trong cửa sổ** (21:30:48–21:34:18Z).
  Sampler T4 xác nhận độc lập: load1_max 2,88 (W1) / 2,75
  (W2) — đều < 3,0 nên 0 spike là NHẤT QUÁN, không phải
  watcher chết (log `b2-spikes.log` dừng ở 21:15:40Z vì sau
  đó không còn load1 ≥ 3,0 nào; 7 poll T4 có load1 ≥ 3,0
  đều trước 21:15:32Z). Tổng spike trong log T9: 135
  (20:4x 20, 20:5x 77, 21:0x 19, 21:1x 19 — đều TRƯỚC cửa
  sổ đo). Khác dữ kiện thứ 8 (27/21/20 spike, đều tự-tải):
  lần này KHÔNG CÓ spike nào để phân loại. T4 chỉ báo số,
  KHÔNG tự quyết tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CẢ 2 CỬA SỔ ATTEMPT,
  0 FIRE.** Live `dry_run=False guard=6291456 consec=2`
  (T9-197; quyết (o) đợt 188: BẬT LIVE từ đợt 189). Mẫu
  autotrigger trong cửa sổ (marker → attempt-done): W1 4 mẫu
  21:27:17–21:30:17Z (avail 1.476.576–1.869.060 kB, balloon
  4,05–4,52M, load1 0,56–2,52), W2 4 mẫu 21:31:17–21:34:17Z
  (avail 1.906.060–2.343.548 kB, balloon 3,39–4,19M, load1
  0,39–2,00) — **trigger=watch, consec=0 ở tất cả các mẫu:
  0 FIRE / 0 WOULD-FIRE / 0 MISSED-WINDOW.** `b2-spikes.log`
  0 hit FIRE (T9-197 phán cuối). Balloon theo autotrigger:
  W1 4,05–4,52M; W2 3,39–4,19M. RAM avail thấp nhất trong
  cửa sổ: W1 1.476.576 kB (~1,41 GB) lúc 21:28:17Z.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 16: ĐẠT
  (F-197-T4-6).** Áp ĐÚNG định nghĩa (p)-192: live-check đối
  chiếu trên cửa sổ attempt HỢP LỆ — đợt này CÓ 1 cửa sổ
  hợp lệ (W2 = attempt2, 21:30:48–21:34:18Z): 4 mẫu live
  trong W2 đều watch/consec=0, **0 FIRE** (đúng — không có
  kẹt trong W2 để bắt); **0 spike B2** trong W2 (đếm header
  từ `b2-spikes.log` T9-197); max avail trong W2 2.343.548 kB
  < guard. **Chuỗi live ĐẠT 0 → 1.** W1 (không hợp lệ) chỉ
  là dữ kiện: 4 mẫu watch/consec=0, 0 FIRE, 0 spike B2.
  T9-197 xác nhận độc lập sau (T9 chưa đóng lúc T4 đóng).
- **O8 T01 TRÊN BOOT 8304fcd1 — 2/3 (T01-197 .done 21:03Z).**
  WebKit attempt1 FAIL (harness timeout load, 0 result),
  attempt2 PASS 21/21, Chromium PASS 21/21 — chân FULL PASS
  O8 KHÔNG ĐẠT. O8 T8 + harness thuộc T8-197 báo cáo (T8 chưa
  đóng lúc T4 đóng — không có dir round197-t8).
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (brief đợt 192
  yêu cầu; kiểm file round197-* mtime trong cửa sổ, loại
  round197-t4):**
  **W1 (21:26:51–21:30:24Z): 0 file** — chỉ T9
  sampler-autotrigger (pid 4797, chạy liên tục, nhẹ) + T7
  appendix197.py (pid 6974) + T2 t4-waiter197.py (pid 181661,
  poll `poll-t4.log`) trong ps; **0 process nặng lạ**
  (không ffmpeg/tsc/chrome/vite khác trong ps-before/after).
  **W2 (21:30:48–21:34:18Z): 0 file** (chỉ T9 sampler +
  T2 waiter pid 184975 trong ps; 0 process nặng lạ).
  **0 file round196-* nào bị sửa trong cả 2 cửa sổ** (check
  glob đợt trước trong t4-attempt-inner.sh).
- **T56 REPAIR — 0 CHỒNG TRONG W2; CÓ CHỒNG TRONG W1
  (F-197-T4-2).** Cài `libwebkitgtk-6.0-4` (Start-Date
  21:28:40Z, End-Date 21:28:43Z) xong trong W1 — 110 dòng
  dpkg, B4 VI PHẠM ở attempt1. W2 sạch (dpkg delta 0).
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI QUY
  ĐỊNH.** `run-analyzers-197.sh` chạy NGOÀI cửa sổ cả 2
  lần (sau attempt-done). `round196-*` files modified sau
  marker: 0 file.

## 4. Replay/postboot — POSTBOOT_PASS 8304fcd1 CÓ (T56, poll=1, repair-tay)

- **Boot 8304fcd1 (btime 20:27:48Z, số hiệu #125 ỨNG VIÊN —
  T01-197 XÁC MINH 9 nguồn tươi, parent quyết (e) ở §14.2-197).**
  Gap #124→#125 = 11.970 s (btime #124 = 16:28:18Z theo quyết
  (e)-196; btime #125 = 20:27:48Z).
- **POSTBOOT_PASS 8304fcd1 ĐÃ CÓ 21:28:14Z** (round197-t56/,
  T56-197; T4 chỉ ghi nhận + xác minh độc lập qua check-only
  của mình): "boot 8304fcd1... repair-som-quyet-h: dpkg 777
  dong; cache 108 .deb; lists 75; postboot PASS poll1 doc lap
  exit 0 luc 2026-11-26T21:24:17Z; POSTBOOT_PASS moi ghi
  2026-11-26T21:28:14Z poll=1 (repair-som-quyet-h); co cu
  bc09b26e luu POSTBOOT_PASS-bc09b26e". **GHI CHÚ T56: cờ này
  do T56-197 VIẾT TAY** (không phải watcher tự ghi) — watcher
  repair thất bại: apt-get update TIMEOUT 1500 s (21:10:52Z);
  T56 chạy tay apt-get update (exit 0, 21:19:39Z) +
  postboot --repair (exit 0, 21:24:17Z) + verify độc lập
  exit 0 (21:24:31Z). **GST là SYMLINK → debroot (269 file,
  ephemeral, như #119)** — caveat: không phải thư mục thật
  như #123. **dpkg 777 dòng (repair, KHÔNG phải replay đầy
  đủ 1477)** — xem LIMITS T56-197 §1.3 + F-197-T56-3.
  Check-only của T4 PASS độc lập từ poll #57 (21:26:50Z) và
  giữ PASS tới đóng (gate0 T5 1/58 poll; T4-check-only 1/58).
  **Replay 8304fcd1: KHÔNG ĐẦY ĐỦ như các boot trước**
  (dpkg.log 887 dòng lúc đóng — gồm 777 repair + 110 cài
  libwebkitgtk trong W1; /var/log/apt TỒN TẠI).
- **#124 POSTBOOT_PASS KHÔNG CÓ** (T01-197 — không viết được
  post-hoc; cùng mẫu #122; tổng boot không cờ 30 → 31 NẾU
  parent chấp nhận #124 không cờ).
- **REBOOT MỚI 8304fcd1 (btime 20:27:48Z) — TRƯỚC KHI ĐỢT MỞ
  ~8 PHÚT (đợt mở 20:35:51Z).** 0 reboot trong phiên đo (từ mở
  poller 20:44:32Z tới poller thoát 21:34:44Z, boot luôn
  8304fcd1). **(m) #124 THÔ 1 requeue DƯƠNG (eid 11383,
  +49,121 s); (m) #125 THÔ 0 requeue (T01-197); phân loại
  CUỐI thuộc T2-197.**
- **KHOẢNG LẶNG SCHEDULER MỚI #C: 8.404 s (18:15:34Z →
  20:35:38Z), bao trùm btime #125 — lớn thứ hai trong họ
  (kém kỷ lục 8.406 s đợt 179 đúng 2 s).** Cùng chữ ký
  OUTAGE #2/#3 (T01-197). Phân loại cuối thuộc T7-197 +
  parent (n).
- **Scheduler gap / OUTAGE + 84l10 / 85m4 / 86n2: KHÔNG CÓ
  DỮ KIỆN TRONG PHIÊN T4.** OUTAGE phán cuối thuộc T7-197;
  verdict harness thuộc T8-197.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND197_T4_WEBKIT_QUIET65_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round197-t4/`):**
  `poll-wait-t4-197.sh` (deadline 22:30Z 26/11 + cờ T5
  round197-t56/ + fallback round196-t56/),
  `run-attempt-197.sh` (lượt yên #65),
  `run-analyzers-197.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt),
  `distinct-seq-197.py` (helper đọc sổ — DÙNG LIVE đợt này:
  sổ as-of-195 → đề xuất as-of-197, md5 `242e24f3`).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–196, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round197-t4/` — theo đúng mẫu 149–196: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, md5 `078938cf...`, giống hệt bản đợt 156–196).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (af6c3cc7) +
  `stats-197.py` + `distinct-seq-197.py` + `distinct-seq-ledger.json`
  (as-of-195, md5 `b99babc5`) +
  `distinct-seq-ledger-197-proposed.json` (as-of-197, md5
  `242e24f3`) + `preflight-197.txt` +
  `preflight-postboot-197.log` + `preflight-launch-197.log` +
  `round197-t4-copy.py`.
- **Log/evidence (hidden_files/round197-t4/, không stage):**
  `poll-t4.log` (58 poll + CỬA MỞ #57/#58 + LUOT HOP LE),
  `poll-t4.nohup.log` (1 instance),
  `poll-test-197.log` (1 test poll + TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + 2 lần CỬA MỞ + 2 attempt +
  LUOT HOP LE, poller thoát 21:34:44Z),
  `postboot-t4-197-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-197-output.txt` (output stats-197.py),
  `preview-b-f3-flip-webkit-t4-attempt{1,2}-8304fcd1.json`
  (3.322.486 B / 3.394.434 B),
  `load-mid-t4-attempt{1,2}-8304fcd1.log` (102/102 dòng),
  `analyze-t4-attempt{1,2}-8304fcd1-*.txt`
  (9 file mỗi attempt + `p1p3p7` attempt2 chạy tay — xem
  F-197-T4-8),
  `coverage-check-attempt{1,2}-8304fcd1.txt` (2/2, 6/6),
  `classb-t4-attempt{1,2}-8304fcd1.txt`,
  `ps-before/after-t4-attempt{1,2}-8304fcd1.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2}-*.txt`
  (B4: dpkg 777→887 attempt1, 887→887 attempt2). **2 JSON
  attempt (1 hợp lệ). 0 process T4 sống lúc đóng** (poller
  thoát 21:34:44Z; vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/
  WebProcess T4). **X11 KHÔNG trống — X194 + X197 (luồng
  khác; T4 chỉ dùng :193 cho probe + :195 cho launch test,
  cả hai đều đã kill).**

## 6. Sai số F-197-T4-1..8 + nợ cũ

- **F-197-T4-1 — VITE RE-OPTIMIZE Ở ĐẦU ATTEMPT1 NHƯNG B2 VẪN
  ĐẠT (MỚI — ĐIỂM TRỪ CHO GIẢ THUYẾT ĐỢT 196).** Vite
  re-optimize ("vite config has changed", 21:26:52Z) ngay đầu
  attempt1 — cùng mẫu đợt 196 (re-optimize đầu mỗi attempt
  phá B2 cả 3 lần) — NHƯNG lần này B2 ĐẠT (load1_max 2,88).
  Khác biệt: load nền lúc re-optimize chỉ ~0,5 (pass 1–10
  mean 0,42–0,61), thấp hơn nhiều so với đợt 196 (load1 mở
  ~6). Re-optimize MỘT MÌNH không đủ phá B2 — cần thêm tải
  nền cao (đợt 196) hoặc apt install (attempt1 nửa sau).
  Attempt2 KHÔNG re-optimize (vite đã ổn định sau attempt1).
- **F-197-T4-2 — B4 VI PHẠM DO T56 CÀI libwebkitgtk TRONG W1
  (MỚI).** `apt-get install libwebkitgtk-6.0-4` Start-Date
  21:28:40Z, End-Date 21:28:43Z — trong cửa sổ attempt1
  (21:26:51–21:30:24Z): dpkg 777 → 887 (delta 110, gồm
  libjavascriptcoregtk + libgtk-4 + 11 deps). Attempt1 đã
  vô hiệu vì B4 DÙ tickCost median 49,0 ≤ 60 và B1/B2/B3/B5
  đều ĐẠT. Giao T2 phán (vi phạm phía T56 hay nhiễu hạ tầng
  được miễn — tiền lệ F-196-T4-7: chồng lấn nhẹ không đổi
  verdict; lần này B4 đổi verdict attempt1).
- **F-197-T4-3 — GATE0 BỊ CHẶN 46 PHÚT VÌ THIẾU LIBS (MỚI).**
  Boot mới 20:27:48Z nhưng dpkg.log chỉ 2 dòng tới 21:24Z;
  check-only FAIL suốt polls #1–#56 (postboot_exit=1);
  gate0 chỉ đạt ở #57 (T4-check-only, 21:26:50Z) sau khi T56
  repair tay xong (21:24:17Z) và #58 (T5, 21:30:48Z). Trong
  46 phút chờ, gate A đã đủ nhiều lần (16 poll "gan-mo" kẹt
  gate0). **Launch-test PASS 20:43:33Z** (MiniBrowser chạy
  được nhờ debroot) cho thấy check-only KHẮT KHE HƠN thực
  tế chạy probe — nhưng T4 KHÔNG tự hạ gate (quy tắc đứng).
- **F-197-T4-4 — LOAD1 RAMP Ở ATTEMPT1 KHỚP GIỜ APT INSTALL
  (MỚI — BẰNG CHỨNG NHÂN QUẢ, KHÁC F-196-T4-3).** Load1 mean
  theo pass PHẲNG ~0,5 ở pass 1–10 rồi LEO từ pass 11
  (0,61 → 1,32 → 2,23 → 2,52) — đúng lúc apt install
  libwebkitgtk bắt đầu (Start-Date 21:28:40Z ≈ pass 11).
  Khác đợt 196 (ramp xuyên suốt, không kẹp được nguyên nhân):
  lần này thời điểm leo khớp chính xác với apt — tải leo
  LÀ do apt install, không phải do probe. Attempt2 hình
  bướu (lên 2,75 rồi hạ 2,06) — không ramp đơn điệu.
- **F-197-T4-5 — B2 DỮ KIỆN THỨ 9: CẢ 2 CỬA SỔ ĐỀU 0 SPIKE
  (MỚI — XEM §3).** W1 0 spike, W2 0 spike (watcher sống,
  ngưỡng load1 ≥ 3,0; sampler T4 xác nhận load1_max < 3,0).
  Lần đầu tiên có dữ kiện 0/0 (dữ kiện thứ 7: lẫn lộn 0/84/0;
  thứ 8: 27/21/20 đều spike). T4 chỉ báo số, KHÔNG tự quyết
  tách.
- **F-197-T4-6 — (p) LIVE LẦN 16 ĐẠT (MỚI — CHUỖI LIVE ĐẠT
  0 → 1).** W2 hợp lệ: 4 mẫu live watch/consec=0, 0 FIRE,
  0 spike B2, max avail < guard. Lần ĐẠT đầu tiên kể từ #14
  (đợt 195); #15 KHÔNG ĐẠT do vắng cửa sổ. T9-197 xác nhận
  độc lập sau.
- **F-197-T4-7 — T9 SAMPLER + T2 WAITER TRONG PS (MỚI — NHẸ,
  GHI NHẬN).** T9 sampler-autotrigger (pid 4797) có mặt trong
  ps-before/after cả 2 attempt (chạy liên tục theo thiết kế,
  nhẹ); T2 t4-waiter197.py (poll `poll-t4.log`) có mặt trong
  ps cả 2 attempt; T7 appendix197.py (pid 6974) có mặt trong
  ps attempt1. Cả ba đều idle/nhẹ — 0 bằng chứng ảnh hưởng
  verdict. Ghi nhận để T2/T5 đối chiếu nguồn (cùng mẫu
  F-196-T4-8).
- **F-197-T4-8 — p1p3p7 CHẠY TAY, CHƯA NỐI VÀO run-analyzers
  (MỚI — NỢ F-195-T4-12 VẪN MỞ PHẦN NỐI).**
  `run-analyzers-197.sh` vẫn không gọi `analyze-t4-p1p3p7.py`
  (grep 0 hit) — T4 chạy tay cho attempt2 hợp lệ và được
  P1/P2/P3-A1/P7 đầy đủ (xem §2). Nợ nối script vào
  run-analyzers vẫn mở cho đợt sau.
- **Nợ cũ:** F-196-T4-1 → F-197-T4-1 (dạng mới: re-optimize
  nhưng B2 ĐẠT); F-196-T4-2 ĐÃ HẾT (#65 có lượt hợp lệ, chuỗi
  0 → 1); F-196-T4-3 → F-197-T4-4 (dạng mới: ramp kẹp được
  nguyên nhân apt); F-196-T4-4 KHÔNG tái diễn (0 pass thưa
  tick); F-196-T4-5 → F-197-T4-5 (dạng mới: 0/0 spike);
  F-196-T4-6 → F-197-T4-6 (KHÔNG ĐẠT → ĐẠT); F-196-T4-7 →
  F-197-T4-2 (dạng nặng hơn: chồng lấn đổi verdict attempt1);
  F-196-T4-8 → F-197-T4-7 (dạng mới: waiter/sampler trong ps);
  F-195-T4-12 VẪN ĐỨNG (F-197-T4-8: p1p3p7 chưa nối vào
  run-analyzers).

## 7. P3' cộng dồn (MỚI — 52 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 197 (MỚI): P1 233/237, P2 228/228,
  P3-A1 198/237, P3' 195/209 occurrence = 145/148
  distinct-seq, P7 131/131** (52 lượt hợp lệ — #65 CÓ lượt
  hợp lệ nên cộng thêm 6 seq). Cơ sở: cộng dồn chỉ tính trên
  các lượt yên HỢP LỆ.
- **Đóng góp lượt #65 (attempt2): (c2) 6 occ [293, 316, 342,
  394, 446, 473]; P1 ĐÚNG 6/6; P2 ĐÚNG 6/6; P3-A1 ĐÚNG 6/6;
  P3' 6/6 distinct ĐẠT; P7 ĐÚNG.** Helper
  `distinct-seq-197.py` DÙNG LIVE (quyết (t) đợt 162): sổ
  as-of-195 (143/146 distinct, occ 189/203) +
  stall/c2coverage attempt2-8304fcd1 → **145/148 distinct,
  195/209 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 316, 394** (chưa có trong sổ);
  **293/342/446/473 ĐÃ THẤY** (trong sổ). T4 kiểm tay lại sổ
  as-of-195: seq mới 316/394 vắng thật (không có trong
  `seen_c2` lẫn `seen_dat`); 293/342/446/473 có trong cả hai;
  non_dat_in_union [260, 364, 498] KHÔNG ĐỔI (không seq nào
  trong 3 hố này xuất hiện đợt này). Sổ ĐÃ THĂNG CẤP thành
  as-of-197 (md5 `242e24f3`; bản đề xuất giữ lại làm audit
  trail; sổ gốc as-of-195 KHÔNG đổi).
- **P1 — ĐÚNG 6/6 occ** (cả 6 seq gần run-end ±1 tick; trong
  17 run_end seqs; baseline 51/365, p=7,44e-06 — verdict ĐÚNG
  theo luật DEF §3 vì n=6 ≥3 VÀ p<0,01). Cộng dồn 227/231 →
  **233/237**.
- **P2 — ĐÚNG 6/6 occ** (cả 6 seq lag +1f: 1, 1, 1, 1, 1, 1;
  DEF §4 chỉ đòi lag ≥ +1f). Cộng dồn 222/222 →
  **228/228**.
- **P3-A1 — ĐÚNG 6/6 occ** (cả 6 seq đóng băng-tại-tick;
  baseline 89/364, p=0,000214 — verdict ĐÚNG theo luật DEF
  §5). Cộng dồn 192/231 → **198/237**.
- **P3' 6/6 distinct ĐẠT** (stall: 293=7, 316=5, 342=5,
  394=3, 446=6, 473=5). Cộng dồn 143/146 → **145/148
  distinct** (2 seq ĐẠT MỚI — 316, 394); occurrence 189/203 →
  **195/209**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 34,
  0: 37}; đối chứng toàn bộ drawSrc post: {-1: 285, 0: 169},
  0/454 entry). Cộng dồn 121/121 → **131/131** (theo mẫu
  đợt 185: P7 cộng +n/n khi ĐÚNG cho n seq của lượt).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162):**
  sổ as-of-195 + stall/c2coverage attempt2 → sổ MỚI đề xuất
  (`distinct-seq-ledger-197-proposed.json`); T4 kiểm tay rồi
  mới thăng cấp thành as-of-197 (md5 `242e24f3`). Đợt 198
  copy-forward lấy sổ này làm cơ sở.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (thêm 1 lượt hợp lệ 6/6 củng cố; P1/P2/
  P3-A1/P3'/P7 đều ĐÚNG đợt này).
- **Labellag (b) — CHUỖI TRƯỚC #65 = 0; #65 (lượt hợp lệ)
  6 occ / 1 event → chuỗi 0 occ GIỮ 0** (lượt hợp lệ có
  occurrence thì không phải lượt 0 occ; chuỗi chỉ đếm các
  lượt hợp lệ LIÊN TIẾP 0 occ — quyết (m)-192). Attempt1
  (không hợp lệ) 0 occ — không tính.
- Chuỗi median tickCost 52 lượt (MỚI — thêm 47,0 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 / 42,0 / 53,0 / 47,0 ms (tổng 2461,0; trung
  bình 47,3 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).
  Median attempt1 không hợp lệ (49,0) KHÔNG đưa vào chuỗi.

## 8. Chờ quyết parent / nợ đợt 198

- **(a) #65 CÓ LƯỢT HỢP LỆ (attempt2) — CHUỖI LƯỢT YÊN HỢP LỆ
  0 → 1 (ĐỀ XUẤT — parent quyết cuối).** Chân lượt yên cho
  chuỗi FULL PASS **CÓ đợt này** (nhưng FULL PASS vẫn KHÔNG
  CÓ vì chân O8 vắng — xem (b)).
- **(b) FULL PASS: KHÔNG CÓ — chân O8 VẮNG (T01-197: WebKit
  attempt1 FAIL harness timeout, attempt2 PASS 21/21,
  Chromium PASS 21/21 — 2/3). Live-check #16 ĐẠT — T9-197
  xác nhận độc lập sau (gỡ caveat nếu T9 khớp).**
- **(c) P3' cộng dồn MỚI 52 lượt: P1 233/237, P2 228/228,
  P3-A1 198/237, P3' 195/209 = 145/148, P7 131/131:**
  sổ distinct-seq THĂNG CẤP as-of-197 md5 `242e24f3`.
  **Chờ parent/T10 quyết:** ghi nhận thăng cấp.
- **(d) BOOT 8304fcd1 (số hiệu #125 ỨNG VIÊN —
  T01-197 xác minh 9 nguồn tươi, parent quyết (e) ở §14.2-197).**
  **(m) #124 THÔ 1 requeue DƯƠNG (T01-197); (m) #125 THÔ 0
  requeue; POSTBOOT_PASS 8304fcd1 (T56-197, poll=1,
  repair-tay, GST symlink → debroot — caveat như #119).**
- **(e) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 3 chuỗi sót +
  tree-md5 khớp đọc trực tiếp (F-197-T4-3); launch-test PASS
  dù check-only FAIL (bằng chứng gate0 khắt khe hơn thực tế
  chạy probe — KHÔNG tự hạ gate).
- **(f) POSTBOOT_PASS 8304fcd1 CÓ lúc T4 đóng (T56 21:28:14Z,
  poll=1, repair-tay). Tổng boot không cờ 30 → 31 NẾU parent
  chấp nhận #124 không cờ (T01-197). GST #125 là SYMLINK →
  debroot (269 file, ephemeral) — caveat, khác #123 thư mục
  thật.**
- **(g) RAM 0 poll <500 MB (min 672 MB) — không có episode
  RAM thấp đợt này; giao T9-197 phán (nếu có).**
- **(h) (m) #124 phán CUỐI (T2-197); (m) #125 THÔ (T2-197);
  INSIDE (T2-197); POSTBOOT_PASS 8304fcd1 (T56-197); số hiệu
  8304fcd1 = #125? (T01-197 xác minh; btime 20:27:48Z);
  OUTAGE phán cuối T7-197 (lặng mới #C 8.404 s — T01-197);
  auto-trigger lần FIRE thật đầu tiên — VẪN CHƯA XẢY RA
  (T9-197); B2 dữ kiện thứ 9 đều 0 spike (T4-197 — BẢN NÀY);
  (m) #56 lần 37; mù hole-recheck lần 38; prune lần 69;
  headroom (T9-197); ENOSPC lần 43?; 84l10 PASS chuỗi?;
  86n2-P1 chuỗi 17?; B2 live sạch lần 10?; E-247 kết cục
  (T9-197); run kết cục (T7-197).**
- **(i) B2 DỮ KIỆN THỨ 9 ĐỀU 0 SPIKE (F-197-T4-5). Luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách. Auto-trigger LIVE chạy trong cả 2 cửa sổ
  attempt, 0 FIRE** — lần FIRE thật đầu tiên vẫn chưa xảy
  ra; T9-197 verify end-to-end khi có FIRE.
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 2 lần đợt này
  (attempt1/2) → **1 lượt yên hợp lệ #65 cho chuỗi FULL
  PASS.** O8 T01 trên 8304fcd1 (WebKit a2 PASS 21/21 +
  Chromium PASS 21/21, a1 FAIL — T01 đã đóng cờ, T10 xác
  minh cuối); O8 T8 + harness thuộc T8-197 báo cáo (T8 chưa
  đóng lúc T4 đóng).
- **(k) F-197-T4-1 (vite re-optimize nhưng B2 ĐẠT);
  F-197-T4-2 (B4 vi phạm do T56 cài libwebkitgtk trong W1);
  F-197-T4-3 (gate0 chặn 46 phút vì thiếu libs);
  F-197-T4-4 (load1 ramp khớp giờ apt install);
  F-197-T4-5 (B2 dữ kiện thứ 9: 0/0 spike);
  F-197-T4-6 ((p) live lần 16 ĐẠT — chuỗi live ĐẠT 0 → 1);
  F-197-T4-7 (T9 sampler + T2 waiter trong ps);
  F-197-T4-8 (p1p3p7 chạy tay, chưa nối vào run-analyzers).**

## Phụ lục A — stats-197-output.txt (tóm tắt)

```
test: 1 poll, RAM 2249 >=1024: 1/1, load1<2: 1/1, gate0: khong-dat=1
poller: 58 poll 20:44:32-21:30:48Z, RAM min=672 max=2796 >=1024: 54/58
  <500: 0/58, load1<2: 35/58, load5<2: 20/58, gate0: T5=1, T4-check-only=1, khong-dat=56
  lock: co=8, khong=50, dpkg 2->887
TONG: 59 poll; RAM min=672 max=2796 >=1024: 55/59 <500: 0/59
gan-mo: #57 21:26:50Z RAM=2132 L1=0.37 L5=1.19 gate0=T4-check-only;
  #58 21:30:48Z RAM=2796 L1=1.46 L5=1.46 gate0=T5
P3' (52 luot, MOI): P1 233/237 P2 228/228 P3-A1 198/237 P3' 195/209 = 145/148 P7 131/131
median 52 luot: n=52 mean=47,3 min=39,0 max=60,0 vuot-60: 0
```
