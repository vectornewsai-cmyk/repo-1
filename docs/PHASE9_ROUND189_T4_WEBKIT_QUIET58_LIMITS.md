# PHASE9_ROUND189_T4_WEBKIT_QUIET58_LIMITS.md

**Đợt:** 189. **Luồng:** T4 — đo lượt yên WebKit #58 trên 1 boot
+ **#58 CÓ LƯỢT HỢP LỆ — attempt1-27e6714f 20/20 + LỚP B ĐẠT
  5/5 + tickCost median 42,0 ms ≤ 60 — LƯỢT HỢP LỆ ĐẦU TIÊN
  SAU 2 ĐỢT TRẮNG (#57 0 attempt; #55 3 attempt đều median
  ≥60). CHUỖI LƯỢT YÊN HỢP LỆ 0 → 1 (KHỞI ĐỘNG LẠI, tiền lệ
  đợt 179 — parent quyết cuối).**
+ **BOOT ĐO: MỘT boot — 27e6714f (btime 02:33:19Z; SỐ HIỆU
  #112 ỨNG VIÊN — T0-189 CHƯA ĐÓNG CỜ lúc T4 đóng, parent
  quyết (e) ở §12.3-189). 0 reboot trong phiên đo.**
+ **CỘNG DỒN MỚI (49 lượt hợp lệ): P1 220/224, P2 215/215,
  P3-A1 192/224, P3' 184/196 occurrence = 140/143
  distinct-seq, P7 118/118.** Sổ distinct-seq THĂNG CẤP
  as-of-189, md5 `8d20238b` (seq mới duy nhất: 163); 0 seq
  mới khác.
**Ngày:** 25/11/2026 (lượt cron 09:35 +07 25/11 = 02:35:51Z 25/11).
**Boot đo:** 27e6714f (37 poll: 2 test + 35 poller).

## 0. Verdict tổng

- **#58 CÓ LƯỢT HỢP LỆ — attempt1-27e6714f.** Cửa yên mở
  poll #35 (03:12:48Z, RAM 1091 MB, gate0=T5); attempt chạy
  03:12:48–03:16:16Z, probe 20/20, lớp B ĐẠT 5/5, tickCost
  median **42,0 ms** (n=620, p90 68,0, max 109, min 28) —
  **LUỘT HỢP LỆ, poller thoát 03:16:42Z.** Ngân sách **1/3
  đã dùng (còn 2)**.
- **Chuỗi lượt yên hợp lệ: 0 → 1 (KHỞI ĐỘNG LẠI, đề xuất —
  parent quyết cuối ở §12.3-189).** #57 0 attempt đã đứt
  chuỗi 1 → 0 theo quyết (m) đợt 188 (SẠCH, parent viết
  trực tiếp, kiểm đếm lần thứ 108).
- **Chân lượt yên cho chuỗi FULL PASS: CÓ đợt này** (gate
  (a) POSTBOOT_PASS #112 ứng viên + lượt yên #58 trên cùng
  boot 27e6714f). FULL PASS 5/5 còn chờ chân O8 T0 + O8 T8
  + harness của T0-189/T8-189 (cả hai chưa đóng cờ lúc T4
  đóng) — parent quyết cuối.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 9: ĐẠT** (xem §6,
  F-189-T4-5). 1 cửa sổ attempt: marker 03:12:48.671Z →
  attempt-done 03:16:16.817Z. Mtime sớm nhất của 9 file
  analyzer + classb đều SAU attempt-done: classb +0,106 s,
  c2drawlog +0,211 s; muộn nhất 03:16:42.172Z
  (coverage-check). **0 file analyzer ghi trong cửa sổ
  attempt.** File skiplatest mặc định mtime vẫn 2026-11-23
  18:13:20Z — 0 ghi mới. Chuỗi live ĐẠT 7 → 8 (đề xuất).
- **0 VI PHẠM PHÍA T4 — đề xuất CHUỖI ĐỢT SẠCH 4 → 5**
  (parent quyết cuối; (p)-188 đã chấp nhận 3 → 4). Phía T4
  giữ sạch: không khởi động script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; 0 chồng
  tải lạ nặng trong cửa sổ attempt (xem §3/F-189-T4-6).
  **B2 CÓ DỮ KIỆN MỚI — dữ kiện thứ 2 cho quyết tách**
  (cần ≥3 đợt theo quyết (p) đợt 186); luật B2 KHÔNG TÁCH
  vẫn đứng.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, mọi poll đều tree=YES, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round189-t4.done` viết lúc đóng
  (~03:24Z), CÓ NỘI DUNG, trong hạn cờ ~05:00Z. **0 reboot
  trong phiên đo; boot lúc viết cờ vẫn 27e6714f.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (02:46Z),
ghi vào `hidden_files/round189-t4/preflight-189.txt` — **PASS
PHẦN TĨNH** (0 sót sau lần grep thứ 2; xem F-189-T4-1).
Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–188:** b.json `078938cf…`,
  probe `4291e539…`, vite T4 `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ as-of-187 md5 `ea978f23…` (occ 179/191,
  distinct 139/142, valid_rounds_p3 36, non_dat [260, 364,
  498]). Xem F-189-T4-2: md5 thứ 5 lúc đầu đọc nhầm
  `apps/web/vite.config.ts` (`ee80d093`, mtime 18/10, không
  đổi) — đã đính chính trước khi mở poller.
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; Playwright-core có mặt (webkit
  object, import tuyệt đối từ `scratch-round63-r4/node_modules/
  playwright-core/index.mjs`); media `stripes-nonperiodic.mp4`
  có mặt (140.828 B); không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-25
  04:30:00 UTC` → **1795581000** = 04:30Z (hạn cờ ~05:00Z =
  1795582800, hạn cứng 05:35Z = 1795584900); grep 0 hit cho
  mẫu rộng `round187|01:30|02:00Z|02:35Z|#57|257c1eae|
  T4-188a|default=188|WebKit #57|23:35|poll-wait-t4-188|
  run-attempt-188|run-analyzers-188|postboot-t4-188|
  poll-test-188|stats-188|distinct-seq-188|dot 188|
  T4-188[^a]|round188-t4` trong 7 file vận hành (lần grep
  thứ 2 sạch — sau khi sửa 1 chuỗi sót ở lần 1: comment
  T5FLAG `(uu tien round188-t5, du phong round187-t5)`
  không có slash — xem F-189-T4-1).
- **Copy-forward 188 → 189 (script python thay thế có neo,
  KHÔNG sed global):** deadline `01:30Z 25/11` → `04:30Z
  25/11`; hạn cờ/cứng → `05:00Z`/`05:35Z`; T5FLAG chính
  `round189-t5/` + fallback `round188-t5/`; `T4-188a` →
  `T4-189a`; `default=188` → `default=189`; `WebKit #57` →
  `#58`; glob `round187-*` → `round188-*`; SỬA 2 chuỗi stale
  cũ trong file 188: `(chi goi tu poll-wait-t4-187.sh)` →
  `poll-wait-t4-189.sh`, docstring `distinct-seq-187.py` →
  `distinct-seq-189.py`.
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 188); **`tree-md5.txt` KHÔNG có trong danh
  sách cleanup — còn nguyên, 530e10a7.**
- **Freeze check (F-164-T4-1):** `round188-t4` còn **0 file
  mtime ≥ 02:35:51Z** (giờ mở đợt 189).
- **GATE0 LÚC MỞ: CHƯA ĐẠT.** round189-t5/ đã tồn tại
  (T5-189 đã khởi động, replay-watch đang chạy) nhưng chưa
  có POSTBOOT_PASS; fallback round188-t5/POSTBOOT_PASS
  mtime 00:11:36Z < btime 02:33:19Z nên poller đánh
  "cu(mtime-cu)", KHÔNG TÍNH — đúng thiết kế chống cờ sai
  boot. **Check-only postboot chạy tay exit=1 FAIL** (GST
  thiếu isomp4/libav, apt thiếu 5 gói gstreamer — replay hệ
  thống chưa chạy trên boot #112 mới; dpkg.log 397 dòng lúc
  02:46Z, 0 apt/dpkg đang chạy lúc đó; xem
  `preflight-postboot-189.log`). Gate0 đạt qua check-only
  từ poll #17 (02:59:15Z) và qua cờ T5 từ poll #33
  (03:11:18Z).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (02:46:57Z): RAM 1283 MB, load1 1,76/load5 1,29,
  gate0=khong-dat, t5flag=cu(mtime-cu), apt=1, dpkg 397.
  Lần 2 (02:47:01Z): RAM 1304 MB, load1 1,94/load5 1,34,
  gate0=khong-dat, apt=1, dpkg 397. Cửa chưa mở vì gate0 +
  apt — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~1.360 MB avail; load1 ~0,89 lúc mở** —
  balloon lúc mở ~5,38 GB (avail ≥1024 nhưng sát ngưỡng).
- **F-176-T4-2: KHÔNG TÁI DIỄN** — sampler chạy đúng 1 lần
  trong attempt (100 mẫu, dừng sạch, xem §2).
- **F-185-T4-2: KHÔNG TÁI DIỄN** — một luồng T4 duy nhất từ
  đầu đến cuối.

## 1. Poller — 37 poll thật (2 test + 35), 1 lần cửa mở, 0 reboot

- **Test (POLL_TEST=1), 2 poll, boot 27e6714f
  (02:46:57Z, 02:47:01Z):** cả 2 đều gate0=khong-dat,
  load1 1,76/1,94, load5 1,29/1,34, RAM 1283/1304 MB,
  lock=khong, blockers=0, apt=1, dpkg 397 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-189.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 27e6714f (#112 ứng viên), 35 poll
  (02:47:12Z–03:12:48Z), 1 lần cửa mở:** RAM ≥1024:
  6/35 (min 432, max 1309 MB); 500–1023: 21/35;
  **<500: 8/35**; load1<2: 32/35; load5<2: 35/35;
  gate0: **T5 3/35** (cờ có từ poll #33, 03:11:18Z) +
  **T4-check-only 16/35** (poll #17–#32) + khong-dat 16/35
  (poll #1–#16); lock=khong 35/35; blockers=0 (35/35);
  apt>0: 31 poll; dpkg 426 → 1461 (replay đang cài).
- **Giai đoạn 1 — chờ gate0 + replay (poll #1–#16,
  02:47:12–02:58:29Z):** gate0 khong-dat (check-only FAIL,
  apt=1 — T5 replay đang chạy); dpkg 426 → 1153. Cửa
  KHÔNG MỞ. RAM ≥1024 ở #1–#3/#6–#7 nhưng thiếu gate0 +
  apt=1. Replay #112 KHÔNG ĐÌNH TRỆ (T5-189): heal
  02:35:40Z, replay host chạy thật 50 transaction.
- **Giai đoạn 2 — check-only PASS nhưng RAM + apt chặn
  (poll #17–#32, 02:59:15–03:10:32Z):** check-only PASS
  từ #17 → gate0=T4-check-only (du phong, quyết (j) đợt
  143) nhưng cửa KHÔNG MỞ: apt=1 tới #31, RAM <1024 suốt
  (min 432 MB #24; <500: 8 poll trong giai đoạn này).
  Balloon chạm trần đúng 1 mẫu 03:10:24Z (6.443.824 kB,
  avail 434.488 kB — theo T9-189) rồi xả ngay 03:11:24Z
  (6.087.324 kB) — CHƯA ĐỦ 2 mẫu liên tiếp nên KHÔNG tính
  episode. apt=0 từ #32 (03:10:32Z), dpkg đã 1461.
- **Giai đoạn 3 — cờ T5 + RAM hồi (poll #33–#35,
  03:11:18–03:12:48Z):** POSTBOOT_PASS #112 CÓ 03:11:11Z
  (T5-189; boot+37m52s, replay-đầy-đủ, poll=0, KHÔNG
  caveat); gate0=T5 từ #33. #33 RAM 791 MB, #34 RAM 749 MB
  → cửa KHÔNG MỞ (chỉ thiếu RAM). **#35 RAM 1091 MB →
  CỬA YÊN MỞ 03:12:48Z** (load1 1,16, load5 0,94, lock
  trống, blockers 0, apt 0, dpkg 1461).
- **0 reboot trong phiên đo.** Poller thoát 03:16:42Z sau
  attempt1 hợp lệ (trong hạn cờ ~05:00Z, còn ~1h43').
- **Phân rã 37 poll thật:** RAM≥1024: 8/37; RAM 500–1023:
  21/37; RAM<500: **8/37**. load1<2: 34/37; load5<2: 37/37.
  **Stats "gan-mo" đếm 7 nhưng chỉ 1 lần mở cửa thật**
  — #1-test ×2 + #1/#3/#6/#7 đủ load/RAM nhưng thiếu gate0
  + apt=1 (xem F-189-T4-4). gate0: T5 3/37 +
  T4-check-only 16/37 + khong-dat 18/37 (16 poll thật +
  2 test). blockers>0: 0 poll. apt>0: 33 poll (31 poll thật
  + 2 test — toàn lúc T5 replay).

## 2. Attempt — 1 attempt (ngân sách dùng 1/3)

- **attempt1-27e6714f: 20/20 + LỚP B ĐẠT 5/5 + tickCost
  median 42,0 ms — LƯỢT HỢP LỆ.** Cửa sổ attempt: marker
  03:12:48.671Z → attempt-done 03:16:16.817Z (inner-end
  03:16:12Z, probe_exit=0; run-attempt exit=0 03:16:16Z).
  JSON 3.468.155 B; flip wallMs 26.744 ms; lock vite giữ
  208 s, nhả 03:16:16Z; vite :5187 kill sạch (curl 000);
  sampler dừng sạch (alive_after_stop=NO, 101 dòng).
- **tickCost:** tổng n=620 median **42,0** p90 68,0 max 109
  min 28; hậu flip+2000ms n=449 median 41,0. Theo dải
  wallMs: 0–20k median 42,0; 20–32k median 50,0; 32–45k
  median 41,0; 45–62k median 40,0; 62–70k median 39,0;
  70–80k median 45,0 — ổn định, không leo theo thời gian.
- **(c2) attempt: 5/5 seq COVERED** (163, 182, 207, 301,
  425; delta log −32..+38 ms); **P3' 5/5 DAT** (stall_truoc
  6, 3, 4, 3, 6); **P1 ĐÚNG 5/5** (cả 5 gần run-end ±1
  tick, trong 15 run_end seqs; baseline 45/359,
  p=3,09e-05); **P2 ĐÚNG 5/5** (cả 5 lag +1f); **P3-A1
  ĐÚNG 5/5** (đóng băng-tại-tick; baseline 81/358,
  p=0,000593); **P7 ĐÚNG** (0 entry trễ ≥+1f: c2 drawSrc
  delta {-1: 29, 0: 27}; đối chứng toàn bộ drawSrc post
  {-1: 293, 0: 155}, 0/448 entry).
- **Labellag (b): 6 occurrence / 1 event** (skippedLatest=0;
  seq 277–280, M=[25], tBlend 49125–49343, 218 ms, lag max
  +11f; presented 15→23, label 14→18). skippedLatest=1:
  0 occ ≥5f. **Chuỗi 0 occ (185–187, 3 đợt — theo
  F-185-T4-4; đợt 188 KHÔNG ÁP DỤNG) DỪNG.** (a)/(b) toàn
  occurrence: n=584 median 1f, p90 2f, max 11f, ≥5f: 6,
  ≥10f: 4, âm: 48.
- **F6' ĐÓNG — skipLatest pixel-verified trên WebKit**
  (n tick skippedLatest=1 hậu flip+2000ms: 67; nhãn 100,0%;
  pixel-verified 100,0%; 0 tick vi phạm thật).
- **(c2) seqs mới trong sổ: chỉ 163** (182, 207, 301, 425
  đã thấy); non_dat [260, 364, 498] KHÔNG ĐỔI.
- **Không attempt nào bị reboot giết; 2 retry còn lại.**

## 3. B2 spike / đối chiếu sampler T9 + O8 T0

- **KIỂM B2 — CÓ DỮ KIỆN MỚI, DỮ KIỆN THỨ 2 CHO QUYẾT TÁCH
  (xem F-189-T4-6).** Attempt1: load1_max **2,94** (B2 ĐẠT,
  dư 1,06); load1/pass tăng dần 1,34 (pass 1) → 2,72
  (pass 10–11) → 2,42 (pass 20), rồi rơi về ~1,0 ngay sau
  attempt (sampler 03:16:06–03:16:11Z: load1 1,10–1,01) —
  **tự-tải là nguồn chính** (đường cong tải theo tiến trình
  attempt; tickCost KHÔNG tương quan dương với load1,
  r=−0,31 theo perpass). **Lạ-tải chỉ là script giám sát
  nhẹ** (T9 sampler/b2watch/probe-loop + autotrigger watch
  + T2 gate-wait) — 0 process phân tích nặng trong
  ps-before/after (grep birefnet/ffmpeg/rembg = 0 hit thực;
  1 hit là dòng heredoc của T9 trong ps-after, không phải
  process chạy).
- **AUTO-TRIGGER LIVE — KHỞI ĐỘNG TRONG CỬA SỔ ATTEMPT,
  0 FIRE.** Theo quyết (o) đợt 188 (BẬT LIVE từ đợt 189):
  dry-run 30 mẫu 02:44–~03:13Z, 0 WOULD-FIRE, pid 32884 bị
  kill trước khi bật live; live start 03:14:10Z, pid
  315572, `dry_run=False guard=6291456 consec=2` (T9-189).
  Live sampler 03:14:10–03:18:10Z: trigger=watch, consec=0
  ở cả 5 mẫu (avail 616.212 → 2.500.548 kB; balloon
  5.350.596 → 4.297.604 kB) — **0 FIRE / 0 WOULD-FIRE /
  0 MISSED-WINDOW trong cửa sổ attempt.** `b2-spikes.log`
  KHÔNG tồn tại trong round189-t9 lúc T4 đóng (T9-189 chưa
  đóng cờ; T9 phán cuối).
- **O8 T0 TRÊN BOOT #112 — CHƯA CÓ lúc T4 đóng** (T0-189
  chưa đóng cờ; poller ghi lock=khong + blockers=0 cả 35
  poll — T0 không giữ lock trong phiên T4). Chân O8 T0 +
  O8 T8 + harness thuộc T0-189/T8-189 báo cáo.
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI
  QUY ĐỊNH.** `run-analyzers-189.sh` chạy NGOÀI cửa sổ
  (03:16:16–03:16:42Z, sau attempt-done 03:16:16.817Z —
  xem F-189-T4-5). File `hidden_files/round109-k7/
  analyze-k7-skiplatest.txt` mtime vẫn 2026-11-23
  18:13:20Z — 0 ghi mới. `round188-*` files modified sau
  marker: 0 file.

## 4. Replay/postboot — POSTBOOT_PASS #112 CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat; số hiệu CHƯA QUYẾT)

- **Boot 27e6714f (btime 02:33:19Z, số hiệu #112 ỨNG VIÊN
  — T0-189 XÁC MINH, parent quyết (e) ở §12.3-189; gap
  #111→#112 = 12.155 s theo T6-189, dài nhất chuỗi gần
  đây).**
- **POSTBOOT_PASS #112 ĐÃ CÓ 03:11:11Z** (boot+37m52s;
  replay-đầy-đủ, poll=0, **KHÔNG caveat** — GST thư mục
  thật 269=269 + tools ĐÃ CÀI + dpkg 1461/50 transaction;
  verify độc lập exit 0; T5-189). Gate0=T5 từ poll #33
  (03:11:18Z). Check-only của T4 PASS độc lập từ poll #17
  (02:59:15Z) — gate0 dự phòng đã đạt trước cờ T5 ~12'.
  **Replay #112: KHÔNG ĐÌNH TRỆ** (heal 02:35:40Z
  (boot+2m21s), replay host chạy thật 50 transaction, dpkg
  2 → 1461, GST 32 → 269 (02:57:39Z), xong 03:10:41Z;
  DỨT chuỗi đình trệ #111 — T5-189). **#111/#110/#109/
  #107/#104/#102/#101/#99/#98/#96/#95 VẪN CÓ** (mtime +
  md5 không đổi). **#108/#105/#103/#100/#97 VẪN KHÔNG
  CÓ — tổng boot không cờ GIỮ 25** (theo quyết (c)-188;
  #112 CÓ cờ nên không đổi).
- **0 REBOOT trong cửa sổ attempt; 0 REBOOT trong phiên
  đo.** Số hiệu #112 chưa quyết (T0-189 chưa đóng cờ);
  **(m) #112 + INSIDE #112 thuộc T2-189** ((m) #111 SỐ
  THÔ DƯƠNG theo quyết (f)-188 — T2-189 phán cuối);
  **#112 KHÔNG GIẾT HOLDER** (T6-189 — chuỗi 15 → 16);
  **run 189 kết cục thuộc T7-189** (start TRỄ +175 s theo
  quyết (n)-188).
- **Scheduler gap / OUTAGE: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  T7-189 phán cuối (điều tra "cố định theo giờ" — T7-194
  phán cuối theo quyết (n)-188).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-189 báo cáo. (Ghi chú
  mốc: (j)-188 đính chính 86n2-P1 chuỗi 10 → 11, và "§11
  ghi 'lần 11?' cho đợt 189 là SAI 1, đúng là 12".)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND189_T4_WEBKIT_QUIET58_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round189-t4/`):**
  `poll-wait-t4-189.sh` (deadline 04:30Z 25/11 + cờ T5
  round189-t5/ + fallback round188-t5/),
  `run-attempt-189.sh` (lượt yên #58),
  `run-analyzers-189.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt),
  `distinct-seq-189.py` (helper đọc sổ — DÙNG LIVE đợt này:
  sổ as-of-187 + stall/c2coverage attempt1 → sổ MỚI
  as-of-189, md5 `8d20238b`).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–188, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round189-t4/` — theo đúng mẫu 149–188: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, md5 `078938cf...`, giống hệt bản đợt 156–188).
- **Script làm việc (hidden_files, không stage):**
  5 script T4 (`poll-wait`/`run-attempt`/`run-analyzers`/
  `t4-attempt-inner` — W = round189-t4 + glob chéo round188-* /
  `check-classb-t4` — đếm sampler n chỉ dòng `boot=`),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-189.py` (thống kê §A;
  footer CỘNG DỒN MỚI 49 lượt),
  `distinct-seq-189.py` (helper đọc sổ — DÙNG LIVE đợt này),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-189: 140/143 distinct, occ 184/196, valid_rounds_p3
  37, non_dat [260, 364, 498], md5 `8d20238b…`),
  `distinct-seq-ledger-189-proposed.json` (bản đề xuất trước
  khi thăng cấp — giữ làm audit trail),
  `preflight-189.txt` + `preflight-postboot-189.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2),
  `round189-t4-copy.py` (script copy-forward 188 → 189).
- **Log/evidence (hidden_files/round189-t4/, không stage):**
  `poll-t4.log` (35 poll trên #112 ứng viên + CỬA MỞ #35 +
  LUỘT HỢP LỆ), `poll-t4.nohup.log` (1 instance),
  `poll-test-189.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + CỬA MỞ + attempt + analyzers
  + LUỘT HỢP LỆ, poller thoát 03:16:42Z),
  `postboot-t4-189-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-189-output.txt` (output stats-189.py),
  `preview-b-f3-flip-webkit-t4-attempt1-27e6714f.json`
  (3.468.155 B), `load-mid-t4-attempt1-27e6714f.log`
  (101 dòng: 100 mẫu sampler),
  `analyze-t4-attempt1-27e6714f-*.txt` (10 file: c2drawlog,
  labellag, skiplatest, lag5, tickcost, wallbands, perpass,
  c2coverage, stall, p1p3p7),
  `coverage-check-attempt1-27e6714f.txt` (5/5),
  `classb-t4-attempt1-27e6714f.txt` (LOP-B-TONG: DAT 5/5),
  `ps-before/after-t4-attempt1-27e6714f.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt1-*.txt`
  (B4 baseline: dpkg 1461, apt Start-Date 03:10:28Z).
  **1 JSON attempt (attempt1 hợp lệ). 0 process T4 sống lúc
  đóng** (poller đã thoát 03:16:42Z; vite :5187 đã kill,
  curl 000; 0 Xvfb T4; 0 MiniBrowser/WebProcess T4;
  pid 318815 trong log pgrep lúc đóng là tự-trùng pattern
  của chính lệnh exec — đã xác minh không còn).
  **X11 KHÔNG trống lúc đóng — 2 socket X193 (03:12Z) +
  X198 (03:20Z), thuộc luồng khác** (xem F-189-T4-7).

## 6. Sai số F-189-T4-1..9 (+ nợ cũ)

- **F-189-T4-1 — COPY-FORWARD: 1 CHUỖI STALE SÓT SAU LẦN SỬA
  ĐẦU (GHI NHẬN — DẠNG F-188-T4-1).** Grep kiểm lần 2 bắt
  thêm 1 chuỗi: comment T5FLAG `(uu tien round188-t5, du
  phong round187-t5)` không có slash nên cặp thay thế
  `round188-t5/` không chạm. Sửa TRƯỚC pre-flight; grep
  lần 2 sạch (mẫu rộng 20+ chuỗi = 0 hit trong 7 file vận
  hành). Nhân tiện sửa 2 chuỗi stale CŨ trong file 188:
  `(chi goi tu poll-wait-t4-187.sh)` trong run-attempt +
  docstring `distinct-seq-187.py`. Không ảnh hưởng vận hành
  (toàn comment/docstring).
- **F-189-T4-2 — PREFLIGHT: MD5 THỨ 5 ĐỌC NHẦM FILE
  (MỚI — NHẸ, ĐÃ ĐÍNH CHÍNH TRƯỚC KHI MỞ POLLER).**
  Preflight lúc đầu md5 `apps/web/vite.config.ts`
  (`ee80d093`) thay vì `vite.t4-temp.config.mjs` — file app
  mtime 18/10, KHÔNG đổi, không phải file T4. Đính chính
  trong `preflight-189.txt`: vite T4 đúng là `e3e874e1`,
  khớp bản 156–188. Không ảnh hưởng vận hành.
- **F-189-T4-3 — BALLOON CHẠM TRẦN ĐÚNG 1 MẪU, RAM <500 MB:
  8/35 POLL (MỚI — NHẸ, KHÔNG GHIM).** Balloon chạm
  6.443.824 kB đúng 1 mẫu 03:10:24Z (avail 434.488 kB) rồi
  xả ngay 03:11:24Z (6.087.324 kB) — chưa đủ 2 mẫu liên
  tiếp nên KHÔNG tính episode (theo T9-189). RAM poll min
  432 MB (#24); <500: 8/35; chuỗi RAM<500 dài nhất 5 poll.
  Khác hẳn đợt 188 (ghim phẳng 6,44 GB, <1024 trong 101/136
  poll): đợt này balloon xả dần 5,6 → 4,36 GB, avail lúc
  đóng 2.506.664 kB.
- **F-189-T4-4 — STATS "gan-mo" ĐẾM 7 NHƯNG CHỈ 1 LẦN MỞ
  CỬA THẬT (MỚI — DẠNG F-188-T4-3).** Script stats đếm poll
  đủ load1<2 + load5<2 + RAM≥1024 (proxy, không xét
  lock/blockers/gate0/apt): 2 test + #1/#3/#6/#7 đủ 3 điều
  kiện nhưng cửa đóng vì gate0 khong-dat + apt=1. Chỉ là
  cách đếm proxy, không ảnh hưởng verdict (1 lần mở cửa thật
  khớp log CUA YEN MO = 1).
- **F-189-T4-5 — QUYẾT (p) KIỂM CHỨNG LIVE LẦN 9: ĐẠT
  (MỚI — F-188-T4-4 ĐÃ HẾT).** 1 cửa sổ attempt: marker
  03:12:48.671Z → attempt-done 03:16:16.817Z. Mtime sớm nhất
  của 9 file analyzer + classb đều SAU attempt-done: classb
  +0,106 s, c2drawlog +0,211 s; muộn nhất 03:16:42.172Z
  (coverage-check). **0 file analyzer ghi trong cửa sổ
  attempt.** File skiplatest mặc định mtime vẫn 2026-11-23
  18:13:20Z — 0 ghi mới. Chuỗi live ĐẠT 7 → 8 (đề xuất).
- **F-189-T4-6 — B2 PHÂN BỔ TỰ-TẢI/LẠ-TẢI, DỮ KIỆN THỨ 2
  (MỚI — THEO QUYẾT (p) ĐỢT 186).** Attempt1: load1_max
  2,94 (đỉnh pass 9–13); **tự-tải là nguồn chính**
  (load1/pass tăng dần 1,34 → 2,72 theo tiến trình attempt
  rồi rơi về ~1,0 ngay sau attempt; tickCost không tương
  quan dương với load1, r=−0,31); **lạ-tải chỉ là script
  giám sát nhẹ** (T9 sampler/b2watch/probe-loop +
  autotrigger watch consec=0 + T2 gate-wait) — 0 process
  phân tích nặng. **Auto-trigger LIVE khởi động 03:14:10Z
  trong cửa sổ attempt nhưng 0 FIRE** (xem §3). B2 ĐẠT với
  dư 1,06. Đây là dữ kiện thứ 2 cho quyết tách B2 (cần ≥3
  đợt); luật B2 KHÔNG TÁCH vẫn đứng; T4 tiếp tục báo cáo
  cùng mẫu các đợt sau.
- **F-189-T4-7 — X11 KHÔNG TRỐNG LÚC ĐÓNG, NHƯNG KHÔNG PHẢI
  CỦA T4 (MỚI — DẠNG F-188-T4-6).** Lúc đóng (03:20Z):
  socket X193 (tạo 03:12Z) + X198 (tạo 03:20Z) — T4 chạy
  0 Xvfb (probe headless qua vite :5187, đã kill sạch,
  curl 000); 0 process T4 sống lúc đóng. Cả hai socket
  thuộc luồng khác (nghi harness T8-189); T4 không xác minh
  được chủ — ghi nhận, không phán.
- **F-189-T4-8 — T0-189 CHƯA ĐÓNG CỜ LÚC T4 ĐÓNG (MỚI —
  GHI NHẬN).** Lúc T4 đóng (~03:24Z): `round189-t0.done`
  chưa tồn tại; số hiệu #112 cho boot 27e6714f là ỨNG VIÊN
  (T5-189.done ghi rõ "CHƯA QUYẾT — T0-189 xác minh").
  Hệ quả: (e)/(m)/INSIDE/O8 T0 trong LIMITS này đều ghi
  "chờ T0-189/T2-189" — T4 KHÔNG tự quyết số hiệu.
- **F-189-T4-9 — MEMORY.md SỬA NGOÀI LƯỢT ~02:51Z (MỚI —
  THEO F-189-T5-3; CHỈ GHI NHẬN).** Mục đợt 185 viết lại +
  thêm mục đợt 188 trong lúc parent KHÔNG sửa MEMORY.md
  (AGENTS.md mới + T1-189/T6-189 cùng quan sát). T4 KHÔNG
  phán tác giả; ghi nhận làm bằng chứng, không viết lại
  file nào.
- **F-188-T4-1 — TÁI DIỄN DƯỚI DẠNG F-189-T4-1**
  (1 chuỗi stale không-slash — bắt được trước pre-flight).
- **F-188-T4-2 — KHÔNG TÁI DIỄN NẶNG** (balloon chỉ chạm
  trần 1 mẫu, không ghim — xem F-189-T4-3).
- **F-188-T4-3 — TÁI DIỄN DƯỚI DẠNG F-189-T4-4** ("gan-mo"
  = 7, chỉ 1 lần mở cửa thật).
- **F-188-T4-4 — ĐÃ HẾT (xem F-189-T4-5 — lần 9 ĐẠT).**
- **F-188-T4-5 — CÓ DỮ KIỆN MỚI (xem F-189-T4-6 — dữ kiện
  thứ 2).**
- **F-188-T4-6 — TÁI DIỄN DƯỚI DẠNG F-189-T4-7** (X11 có
  socket lúc đóng — nhưng thuộc luồng khác, không phải sót
  của T4). **F-188-T4-7 — KHÔNG TÁI DIỄN** (replay #112
  KHÔNG đình trệ). **F-188-T4-8 — KHÔNG TÁI DIỄN** (load1
  cuối phiên ổn định ~1,0, không tăng vọt).
  **F-188-T4-9 — KHÔNG ÁP DỤNG** (aggregate 188 SẠCH —
  parent viết trực tiếp, lần sạch thứ ba kể từ đợt 179;
  tổng điền sẵn GIỮ 18).
- **F-187-T4-4 — ĐÃ HẾT (xem F-189-T4-5). F-187-T4-5 —
  CÓ DỮ KIỆN THỨ 2 (xem F-189-T4-6). F-187-T4-6 — KHÔNG
  TÁI DIỄN** (median 42,0 ms ngay attempt đầu, không leo
  như đợt 186 trên #107). **F-187-T4-1 — TÁI DIỄN DƯỚI
  DẠNG F-189-T4-1. F-187-T4-2 — KHÔNG TÁI DIỄN** (B2 ĐẠT,
  load1_max 2,94; phân bổ xem F-189-T4-6). **F-187-T4-3 —
  TÁI DIỄN DƯỚI DẠNG F-189-T4-4.**
- **F-186-T4-2 — KHÔNG TÁI DIỄN** (B2 ĐẠT). **F-186-T4-5
  — TÁI DIỄN DƯỚI DẠNG F-189-T4-7. F-186-T4-7 — KHÔNG TÁI
  DIỄN** (B1 không đo được đợt này — 0 attempt? KHÔNG:
  B1 ĐẠT, load5 cuối 1,26 — lần sạch tiếp theo của B1 chờ
  T8 phán chuỗi).
- **F-185-T4-4 — DỪNG CHUỖI 0** ((b) 6 occ/1 event — không
  còn 0). **F-185-T4-2 — KHÔNG TÁI DIỄN** (1 luồng T4 duy
  nhất). **F-185-T4-3 — KHÔNG ÁP DỤNG** (median 42,0 ms,
  không có attempt thứ 2 để so).
- **F-184-T4-2 — KHÔNG TÁI DIỄN NẶNG** (RAM <500 MB: 8/35
  poll — xem F-189-T4-3). **F-184-T4-4 — KHÔNG TÁI DIỄN**
  (0 reboot trong phiên đo).
- **F-183-T4-4 — KHÔNG TÁI DIỄN** (0 lần T0 giữ lock trong
  phiên). **F-183-T4-6 — TÁI DIỄN DƯỚI DẠNG F-189-T4-4**
  ("gan-mo" = 7, chỉ 1 lần mở cửa thật).
- **F-182-T4-1 — KHÔNG TÁI DIỄN** (0 reboot).
  **F-181-T4-3 — KHÔNG TÁI DIỄN. F-181-T4-6 — CÓ SỐ MỚI**
  (chuỗi median 49 lượt: thêm 42,0 ms). **F-179-T4-5 —
  ĐÃ HẾT (xem F-189-T4-5). F-178-T4-1 — KHÔNG ÁP DỤNG**
  (1 attempt hợp lệ ngay lần đầu). **F-177-T4-4 — KHÔNG
  TÁI DIỄN. F-177-T4-6 — TÁI DIỄN DƯỚI DẠNG F-189-T4-1.
  F-176-T4-1 — KHÔNG TÁI DIỄN** (0 vi phạm theo T4).
  **F-176-T4-2 — KHÔNG ÁP DỤNG** (sampler dừng sạch, 0
  sampler thừa). **F-175-T4-1 — KHÔNG TÁI DIỄN**
  (`tree-md5.txt` còn nguyên). **F-175-T4-2 — KHÔNG ÁP
  DỤNG** (0 file analyzer ghi trong cửa sổ attempt).
  **F-175-T4-3 — KHÔNG TÁI DIỄN** (T0 không giữ lock).
  **F-175-T4-5 — KHÔNG TÁI DIỄN** (0 reboot).
  **F-174-T4-1 — KHÔNG ÁP DỤNG** (1 attempt hợp lệ).
  **F-174-T4-6 — KHÔNG TÁI DIỄN NẶNG** (RAM <500 MB: 8/35
  poll).

## 7. P3' cộng dồn (MỚI — 49 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 189 (MỚI): P1 220/224, P2 215/215,
  P3-A1 192/224, P3' 184/196 occurrence = 140/143
  distinct-seq, P7 118/118** (49 lượt hợp lệ — #58 CÓ lượt
  hợp lệ nên cộng thêm 5 seq; 0 attempt nhiễm tải). Cơ sở:
  cộng dồn chỉ tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #58: 5/5 seq (c2) P1 + P2 + P3-A1 + P3'
  ĐẠT; P7 ĐÚNG** (seq 163, 182, 207, 301, 425; stall 6, 3,
  4, 3, 6). Helper `distinct-seq-189.py` DÙNG LIVE (quyết
  (t) đợt 162): sổ as-of-187 (139/142 distinct, occ 179/191)
  + stall/c2coverage attempt1-27e6714f → **140/143 distinct,
  184/196 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 163** (chưa có trong sổ);
  **182, 207, 301, 425 ĐÃ THẤY** (trong sổ, đã ĐẠT trước —
  không cộng thêm distinct). T4 kiểm tay lại sổ as-of-187:
  seq mới 163 vắng thật (không có trong `seen_dat` lẫn
  `seen_c2`); non_dat [260, 364, 498] KHÔNG ĐỔI (không seq
  nào trong 3 hố này xuất hiện đợt này). Sổ ĐÃ THĂNG CẤP
  thành as-of-189 (md5 `8d20238b`; bản đề xuất giữ lại làm
  audit trail).
- **P1 — ĐÚNG 5/5 occ** (cả 5 seq gần run-end ±1 tick; trong
  15 run_end seqs; baseline 45/359, p=3,09e-05 — verdict
  ĐÚNG theo luật DEF §3 vì n=5 ≥3 VÀ p<0,01). Cộng dồn
  215/219 → **220/224**.
- **P2 — ĐÚNG 5/5 occ** (cả 5 seq lag +1f; DEF §4 chỉ đòi
  lag ≥ +1f). Cộng dồn 210/210 → **215/215**.
- **P3-A1 — ĐÚNG 5/5 occ** (cả 5 seq đóng băng-tại-tick;
  baseline 81/358, p=0,000593 — verdict ĐÚNG theo luật
  DEF §5). Cộng dồn 187/219 → **192/224**.
- **P3' 5/5 occ ĐẠT** (stall: 163=6, 182=3, 207=4, 301=3,
  425=6). Cộng dồn 139/142 → **140/143 distinct** (1 seq
  ĐẠT MỚI — 163); occurrence 179/191 → **184/196**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 29,
  0: 27}; đối chứng toàn bộ drawSrc post: {-1: 293, 0: 155},
  0/448 entry). Cộng dồn 113/113 → **118/118** (theo mẫu
  đợt 185: P7 cộng +n/n khi ĐÚNG cho n seq của lượt).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162).**
  Helper đọc sổ (as-of 187: 139/142 distinct, occ 179/191),
  tính seq MỚI = tập hiệu với sổ, in cộng dồn mới, ghi sổ MỚI
  đề xuất vào `distinct-seq-ledger-189-proposed.json`; T4
  kiểm tay rồi mới thăng cấp sổ thành as-of-189 (md5
  `8d20238b`). Đợt 190 copy-forward lấy sổ này làm cơ sở.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (thêm 1 lượt hợp lệ 5/5 củng cố).
- Chuỗi median tickCost 49 lượt (MỚI — thêm 42,0 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 ms (tổng 2319,0; trung bình 47,3 ms; min 39,0,
  max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 190

- **(a) #58 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ 0 → 1
  (KHỞI ĐỘNG LẠI, tiền lệ đợt 179)?** Chân lượt yên cho
  chuỗi FULL PASS **CÓ đợt này** — FULL PASS lên 1 hay
  không còn chờ chân O8 T0 + O8 T8 + harness của T0-189/
  T8-189 trên cùng boot #112 ứng viên (cả hai chưa đóng cờ
  lúc T4 đóng — parent quyết cuối).
- **(b) P3' cộng dồn MỚI 49 lượt: P1 220/224, P2 215/215,
  P3-A1 192/224, P3' 184/196 = 140/143, P7 118/118:**
  sổ distinct-seq ĐÃ THĂNG CẤP as-of-189 md5 `8d20238b`.
  **Chờ parent/T10 quyết:** ghi nhận cộng dồn mới.
- **(c) BOOT 27e6714f (số hiệu #112 ỨNG VIÊN — T0-189 CHƯA
  ĐÓNG CỜ, parent quyết (e) ở §12.3-189).**
  **(m) #112 + INSIDE #112 thuộc T2-189** ((m) #111 SỐ THÔ
  DƯƠNG theo quyết (f)-188 — T2-189 phán cuối);
  **#112 KHÔNG GIẾT HOLDER** (T6-189 — chuỗi 15 → 16);
  **(m) #111 + INSIDE thuộc T2-189.**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 1 chuỗi sót
  (F-189-T4-1 — sửa trước pre-flight); gate0 ĐÃ ĐẠT lúc
  mở poller qua check-only từ poll #17 và qua T5 từ poll #33.
- **(e) POSTBOOT_PASS #112 ĐÃ CÓ (03:11:11Z,
  replay-đầy-đủ, poll=0, KHÔNG caveat — GST thư mục thật
  269=269 + tools ĐÃ CÀI + dpkg 1461/50 transaction).
  Replay #112 KHÔNG ĐÌNH TRỆ (T5-189) — DỨT chuỗi đình trệ
  #111. Tổng boot không cờ GIỮ 25.**
  Hướng (3) VẪN ĐỨNG lần 36 (theo T5-189).
- **(f) Balloon chạm trần đúng 1 mẫu 03:10:24Z (6.443.824
  kB, avail 434.488 kB) rồi xả ngay — KHÔNG tính episode;
  RAM <500 MB: 8/35 poll (min 432 MB).** Giao T9-189 phán
  episode (E-244? — theo dõi).
- **(g) (m) #111 SỐ THÔ DƯƠNG (T2-189 phán cuối); (m) #57
  lần 32 (T2-189 — LƯU Ý: (m) #57 của T2 KHÁC lượt yên #57
  của T4, đừng nhầm); mù #97?/#96?/#95?/#89?/#78? (T2-189);
  V2 phương án chính + B2 (T8-189); 84l10 + Q3 (T8-189);
  run 189 kết cục thuộc T7-189; OUTAGE #2 điều tra "cố định
  theo giờ" (T7-194 phán cuối); #112 giết holder? KHÔNG
  (T6-189 — chuỗi 15 → 16); prune lần 64 (T6-189);
  checklist (o) (T8-189); H3 chỉ giám sát thụ động; birefnet
  0 thử lần 42; nhắc mọi luồng: KHÔNG script nặng / KHÔNG
  probe dpkg trong cửa sổ attempt; u2net là fallback;
  ci-security.yml 403 chờ user; TTS 39 cấm kiểm lại; G1 chờ
  user quyết.**
- **(h) B2 CÓ DỮ KIỆN MỚI — DỮ KIỆN THỨ 2 CHO QUYẾT TÁCH**
  (F-189-T4-6; cần ≥3 đợt). Luật B2 KHÔNG TÁCH vẫn đứng
  theo quyết (p) đợt 186. **Auto-trigger LIVE đã khởi động
  03:14:10Z trong cửa sổ attempt, 0 FIRE** — lần FIRE thật
  đầu tiên vẫn chưa xảy ra; T9-189 verify end-to-end khi
  có FIRE.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (attempt1 hợp lệ #58) → **CÓ lượt yên hợp lệ #58 cho
  chuỗi FULL PASS.** T8 tự quyết O8 đợt này (O8 T0 trên
  #112 chưa có lúc T4 đóng; O8 T8 + harness thuộc T8-189
  báo cáo).
- **(j) F-189-T4-1 (1 chuỗi stale — sửa trước pre-flight);
  F-189-T4-2 (preflight đọc nhầm md5 vite.config — đã đính
  chính); F-189-T4-3 (balloon chạm trần 1 mẫu, RAM <500:
  8/35 poll); F-189-T4-4 (stats "gan-mo" đếm 7, chỉ 1 lần
  mở cửa thật); F-189-T4-5 ((p) kiểm chứng live lần 9
  ĐẠT); F-189-T4-6 (B2 dữ kiện thứ 2 cho quyết tách);
  F-189-T4-7 (X11 có socket lúc đóng — thuộc luồng khác);
  F-189-T4-8 (T0-189 chưa đóng cờ — số hiệu #112 chưa
  quyết); F-189-T4-9 (MEMORY.md sửa ngoài lượt ~02:51Z —
  chỉ ghi nhận).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-189.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-189.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-25T02:46:57Z - 2026-11-25T02:47:01Z, boot=27e6714f
   RAM min=1283 max=1304 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 2/2 load5<2: 2/2 blockers>0: 0 apt>0: 2
   gate0: khong-dat=2
   lock: khong=2
   dpkg 397->397
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 35 poll, 2026-11-25T02:47:12Z - 2026-11-25T03:12:48Z, boot=27e6714f
   RAM min=432 max=1309 >=1024: 6/35 500-1023: 21/35 <500: 8/35
   load1<2: 32/35 load5<2: 35/35 blockers>0: 0 apt>0: 31
   gate0: T4-check-only=16, T5=3, khong-dat=16
   lock: khong=35
   dpkg 426->1461
   chuoi RAM<500 dai nhat: 5 poll
-- TONG poll that: 37
-- RAM toan phien: min=432 max=1309 >=1024: 8/37 <500: 8/37
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 7/37
   gan-mo? #1 2026-11-25T02:46:57Z boot=27e6714f RAM=1283 L1=1.76 L5=1.29 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #1 2026-11-25T02:47:01Z boot=27e6714f RAM=1304 L1=1.94 L5=1.34 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #1 2026-11-25T02:47:12Z boot=27e6714f RAM=1121 L1=1.80 L5=1.33 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #3 2026-11-25T02:48:43Z boot=27e6714f RAM=1054 L1=1.45 L5=1.43 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #6 2026-11-25T02:50:58Z boot=27e6714f RAM=1309 L1=1.06 L5=1.24 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #7 2026-11-25T02:51:43Z boot=27e6714f RAM=1166 L1=0.65 L5=1.10 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #35 2026-11-25T03:12:48Z boot=27e6714f RAM=1091 L1=1.16 L5=0.94 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 27e6714f: 37 poll; RAM>=1024 lan cuoi: 2026-11-25T03:12:48Z #35; RAM<1024 lan dau: 2026-11-25T02:49:28Z #4 RAM=904
-- cong don P3' (MOI, 49 luot hop le): P1 220/224 P2 215/215 P3-A1 192/224 P3' 184/196 occ = 140/143 distinct-seq P7 118/118
-- chuoi median 49 luot: n=49 mean=47,3 min=39,0 max=60,0 vuot-60: 0
```
