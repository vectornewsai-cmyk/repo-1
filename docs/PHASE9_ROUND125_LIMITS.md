# LIMITS — Phase 9 đợt 125 (gộp 9/9, T10 đóng trong phiên)

> Đo thật, không code giả. Đợt 125: E4 lượt 7+8, DEF v0.2 + leg trung gian dò ranh giới,
> lượt yên WebKit #5, hạ tầng/boot #69→#70, lock, mù #44/#45, vite harness, scheduler.
> **KHÔNG push, KHÔNG release/tag. T10 đóng trong phiên, 9/9, trước hạn cứng 23:00Z 16/11.**
> Lượt cron 03:35 +07 17/11/2026. Chốt chặn đã xóa khi đóng đợt; cờ round125-t10.done đã tạo.

## 0. Tóm tắt (đọc trước)

- **Boot:** mở đợt trên boot #69? (670c07f6, btime 20:35:11Z, "chết replay" kiểu boot #60 —
  dpkg.log đóng băng 2 dòng suốt đời boot, postboot FAIL 14/14); **reboot giữa đợt ~20:54:19Z
  sang boot #70? (310f07e4, btime 20:54:19Z, replay CHẠY, PASS +5m02)**. Boot #70 vẫn sống
  lúc T10 đóng (21:48Z, up ~54'). Số hiệu #69?/#70? là tạm (chờ T6 recount mù #37 đợt 126).
- **E4BATCH: lô → 7/10 (0 CAUGHT, 7 VOID).** Lượt 7 (A, gop250, att2) VOID — pause-seek chậm
  nhất từ trước (1806/1871 ms) + drift >0,35 lần đầu trên baseline (14 lần, max 0,6068, cụm
  tick 12–34, KHÔNG phải re-seek). Lượt 8 (B, gop30, att2) VOID — pause-seek nhanh nhất từ
  trước (266/315 ms), drift >0,35: 0 lần → cụm drift lượt 7 KHÔNG lặp lại, không phải đặc
  tính hệ thống. Cả hai att1 đều KILLED-REBOOT (không đếm). Sự kiện resync cuối clip lượt 6
  tick 74 KHÔNG lặp lại.
- **DEF v0.2 XONG + leg GAP 6/6 VALID:** ranh giới chuyển chế độ chậm **NẰM NGAY QUANH ~53%
  avg60** (T_startup median 1,2635 s, chậm 4/6, nhanh 2/6 — TRỘN); **tickRate mức thứ ba
  28,07–29,47 (mean 28,52)** — quy tắc "2 mức" của v0.2 KHÔNG còn đúng → cần DEF v0.3.
  Pha (b) T_seek vẫn MIỄN NHIỄM (max 0,001 s, n=24). Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG.
- **WebKit lượt yên #5: 1 LƯỢT YÊN HỢP LỆ — ĐÃ ĐÓNG NỢ.** attempt1 20/20 pass, tickCost
  median 47,5 ms, lớp B 5/5 ĐẠT. Ngưỡng ≤60 ms GIỮ. Đo RAM baseline idle (ngoại lệ một lần):
  trang preview idle ~800 MB. Nợ sửa sampler ĐÃ SỬA + VERIFY.
- **Scheduler: 2 lượt thiếu CÓ THẬT, nguyên nhân khả dĩ nhất là drop phía scheduler** (không
  phải VM down, không phải VM bận — giả thuyết bận BỊ BÁC). Mẫu thiếu hệ thống: HB 36/136,
  DR 38/138 slot.
- **Mù #44 MỚI (D mở, E đóng, tối đa 5 ẩn) + mù #45 MỚI MỞ** (từ probe #44). Gap #68→#69
  = 3h01'20" VẪN SPAN; CERT giữ n=38, FULL giữ n=53. **Mâu thuẫn brief T7:** nhiệm vụ "kiểm
  sâu mù #42 đoạn B" trùng mù #43 đã chấp nhận để mở — T7 tuân luật cứng, KHÔNG kiểm lại;
  chờ quyết parent (§12a).
- **Lock KHỎE:** đợt 124 khép sạch 18/18/18; 0 zombie, 0 ticket + 52 cooldown. Đề xuất luật
  prune cooldown (chờ quyết parent, §12c).
- **Vite harness 4/4 ĐÓNG:** 82j3 check config xong; 7 harness EXIT:2 đợt 121 → 7/7 exit 0;
  libevent ĐÃ HẾT; 68v2 8/8 pass (sửa TMPDIR + selector hint). 25 file config mặc định chưa
  mirror — chờ quyết parent (§12d).
- **T10 verify: suite 27/27 exit 0; O8 Chromium 21/21 + WebKit 21/21 exit 0** (WebKit FULL
  PASS lần thứ ba liên tiếp). Cây baseline không đổi (preview.tsx 03bf029f / media.ts 2c384ed1).
- **Đếm cuối:** đợt 125 = **10 batch / 17 entry / 17 file duy nhất** (gồm closing); lũy kế
  đợt 111–125 = **147 batch / 429 entry / 389 file duy nhất** + 1 oversize 6,4 MB
  (chưa lên từ trước). Phương pháp đếm ghi ở §9 — chốt một con số duy nhất, đợt sau dùng lại.

## 1. T1+T2 — E4BATCH lượt 7 + lượt 8: lô 7/10 (0 CAUGHT, 7 VOID)

Chi tiết: docs/PHASE9_ROUND125_T1_E4BATCH_R7_LIMITS.md (10.334 B),
docs/PHASE9_ROUND125_T2_E4BATCH_R8_LIMITS.md (11.022 B).
Prereg: hidden_files/round125-t1/prereg-e4batch-luot7.md,
hidden_files/round125-t2/prereg-e4batch-luot8.md.

- **Lượt 7 (A, gop250, e4a7) — VOID, đếm được (att2).** Probe 20:59:51–21:00:51Z exit 0 (60 s),
  WebKit loadN=0, cây BASELINE md5 03bf029f trước=sau, boot #70 không đổi. velTicks=292,
  sampler=150, renderTicks=73, raf=114, rvfc=0, pageErrs=0, tailSteadyClosed=0.
  resyncsV chỉ đổi tick 3 (seek ban đầu), restartV cuối=0. Lock v2 cổng 5590 wait 0 s hold 61 s.
- **Mới lượt 7:** pause-seek **chậm nhất từ trước tới nay** (tElement 1806 ms / tCanvas 1871 ms,
  vượt lượt 5 att2 1423/1473 ms); drift sau seek ban đầu vượt >0,35 **lần đầu trên baseline:
  14 lần** (tick 12–34, max 0,6068 ở tick 17, có 3 tick liên tiếp cùng vượt 12–14) — KHÔNG
  phải re-seek (không đổi resyncsV, không sampler seeking run sau run ban đầu), là playhead
  tụt sau currentTime ~4,5 s đầu phát; sau tick 35 drift lắng. Tải lúc bắt đầu probe cao
  (load 4,45, RAM khả dụng 1071 MB — tương quan, không chứng minh nhân quả).
- **Lượt 8 (B, gop30, e4b8) — VOID, đếm được (att2).** Probe 21:11:54–21:12:27Z exit 0 (33 s),
  WebKit loadN=0, cây BASELINE trước=sau, boot #70 không đổi. velTicks=480 (nhiều nhất trên
  baseline từ trước), sampler=134, renderTicks=78, raf=110, rvfc=0, pageErrs=0,
  tailSteadyClosed=0. resyncsV chỉ đổi tick 2 (seek ban đầu — sớm hơn các lượt trước, tick 3),
  restartV cuối=0. Lock v2 wait 51 s (xếp sau T3) hold 34 s.
- **Mới lượt 8:** pause-seek **nhanh nhất trên baseline từ trước tới nay** (tElement 266 ms /
  tCanvas 315 ms; lượt 7 att2 chậm nhất 1806/1871 ms — cùng boot #70, cách nhau ~11 phút).
  Drift >0,35: **0 lần** (max 0,1139 ở tick 70) → cụm drift 14 lần của lượt 7 **KHÔNG lặp lại**
  ở lượt 8, nên không phải đặc tính hệ thống chung của cặp A+B. Sự kiện resync/restart cuối
  clip lượt 6 tick 74 cũng **KHÔNG lặp lại** (lượt 7 + lượt 8 đều không có).
- **Cả hai att1 đều KILLED-REBOOT (không đếm):** driver T1 20:42:53–~20:54:19Z và T2
  20:46:02–~20:54:19Z trên boot #69 bị reboot giết giữa lúc chờ cờ (T1 chờ cờ T5, T2 chờ
  cờ T1); att2 chạy lại trên boot #70 (T1 20:55:49Z, chờ cờ T5 4 phút; T2 20:57:02Z, chờ
  cờ T1 14 phút + cờ T5 0 phút). Runtime cũng restart cùng lúc reboot — kiểm lại bằng tay,
  không mất dữ liệu.
- **Lô sau đợt 125: 7/10 (0 CAUGHT, 7 VOID).** H1/H3 vẫn chưa có cặp CAUGHT-RESEEK trên cùng
  cây baseline. Lượt tiếp theo: lượt 9 (quyết parent đợt 124 §12.1 chỉ duyệt tới lượt 7;
  lượt 8 chạy theo kế hoạch lô — lượt 9+ chờ quyết mới, xem §12).
- Không sửa production, không push, không đo TTS 39, không thử birefnet.

## 2. T3 — Điều tra lượt chạy scheduler bị thiếu: drop phía scheduler

Chi tiết: docs/PHASE9_ROUND125_T3_SCHEDULER_LIMITS.md (11.787 B).
Ghi chú đầy đủ: hidden_files/round125-t3/NOTES.md.

- **Kết luận: 2 lượt thiếu CÓ THẬT** (heartbeat 17:50:50 +07 + deterministic-doctor 18:00 +07
  16/11, đều trong boot #63 sống). Mẫu lặp lại có hệ thống: HB thiếu 36/136 slot, DR thiếu
  38/138 slot (+1 mới: DR 03:00+07 17/11, xác nhận 20:51Z) — thiếu theo khối 9–10 giờ +
  singleton, 2 job thiếu cùng nhau (28/38 giờ DR-thiếu có HB thiếu cùng giờ).
- **Nguyên nhân khả dĩ nhất: drop phía scheduler.** Bằng chứng: cả 2 job đều có bản ghi chạy
  trong gap VM-down đã chốt (HB 17:20:50Z gap #67→#68; DR 19:00Z gap #68→#69) nên VM down
  không giải thích được; feed-pulse 0 thiếu (7/7 ngày), vcut-build-loop 0 slot thiếu;
  0/38 + 0/36 lượt thiếu trùng build-loop đang active (nền 37/100) nên giả thuyết VM bận
  **BỊ BÁC**.
- Dị thường phụ: HB jitter 2 chế độ (−316 s: 83/100; +887–889 s: 16/100, toàn slot :20:50);
  DR 12:00/15:00+07 thiếu 5/6 ngày.
- Boot mới #69? 670c07f6 btime 20:35:11Z; #68 chết trong (18:00:02Z, 20:35:11Z]. HB sau boot
  mới (03:20:50/03:50:50+07) đều có mặt.
- **Nợ mở:** cơ chế drop chi tiết cần bằng chứng ngoài VM; không điều tra tiếp từ trong VM
  bằng cùng phương pháp. Không kiểm lại mù #40 B / #43. Không quét toàn workspace (cờ
  e4a7/e4b8 chưa có lúc làm việc). Nợ T3-123 §5 đóng theo hướng đã xác minh + phân loại.

## 3. T4 — DEF PSI v0.2 + leg TRUNG GIAN: ranh giới ~53%, tickRate 3 mức

Chi tiết: docs/PHASE9_ROUND125_T4_LEGTRUNGGIAN_LIMITS.md (19.500 B),
docs/PHASE9_ROUND125_T4_PSIAXIS_DEF_V02.md (18.176 B, 280 dòng, §§1–11).
Prereg: hidden_files/round125-t4/prereg-leg-trung-gian.md.

- **DEF v0.2 ĐÃ VIẾT XONG** (20:49Z): giữ ngưỡng 3 band (Yên <30%, Vừa 30–80%, Nặng >80%);
  tickRate = chỉ báo đói 2 mức; ranh giới chuyển CHƯA xác định, khoảng trống avg60 13–66%;
  tương quan gộp n=18. File v0.1 giữ nguyên làm lịch sử. T4 thay thế đọc lại xác nhận đầy đủ,
  không viết lại (T4 gốc kết thúc không báo cáo cuối 21:04Z — DEF + prereg đã xong trên đĩa,
  luồng thay thế chỉ hoàn thành leg + LIMITS + stage, không làm lại phần đã xong).
- **Reboot giữa đợt:** boot đăng ký ở prereg (b69, 670c07f6) ĐÃ CHẾT, reboot 20:54:19Z (phát
  hiện 20:58:10Z khi gatewaiter đọc uptime -s). Chưa có phép đo nào trên boot cũ — không dữ
  liệu nào bị ảnh hưởng. Leg chạy toàn bộ trên b70. Gatewaiter sửa mẫu grep cờ T5 thành
  `boot_id[:=] *` (T5 đổi định dạng cờ ở b70, dấu `=` thay `:`); watcher khởi động lần đầu
  thất bại im lặng (không viết được t4-watch.log, không có process — nguyên nhân chưa xác
  định), khởi động lại 21:00:27Z pid 8406.
- **Phối hợp T9 (quyết parent §12.10 đợt 124):** T4 KHÔNG chạy hog nào trước cờ
  round125-t9-done (21:14:15Z). GATE 0 ĐẠT poll #8 21:15:44Z (6/6). Driver 21:15:57–21:24:35Z
  exit 0, Xvfb :198, boot b70 không đổi, cây 03bf029f/2c384ed1 trước=sau.
- **Leg GAP 6/6 VALID, 0 VOID:** 2 hog (pids 15526/15527, kill sạch cuối driver, sót 0). Dial
  TARGET-MISS 25,98% @ 2 hog (21:17:31Z, chấp nhận, KHÔNG thêm hog thứ 3). Run means avg60
  **52,75–53,99% (mean 53,19%)** — browser/vite cộng thêm ~27 điểm so với dial (bài học đo:
  dial không có browser **đánh giá thấp** avg60 lúc chạy ~27 điểm).
- **Ranh giới chuyển NẰM NGAY QUANH ~53%:** T_startup median **1,2635 s**, p90 1,421 s, chậm
  (>1,2 s) **4/6**, nhanh 2/6 (1,193 s / 1,197 s — dưới ngưỡng chỉ 3–7 ms) → **TRỘN** (dải,
  không phải đường sắc). Pha (a) bar tham khảo CHƯA ĐẠT (median 1,2635 > 1,0; p90 1,421 > 1,2).
  Pha (b) **ĐẠT** (T_seek max 0,001 s, median 0,0 s). Ngưỡng Yên <30% ĐỨNG, không cần thu hẹp.
- **tickRate mức thứ ba (mới, sửa v0.2 §3):** ở ~53% tickRate **28,07–29,47 (mean 28,52)** —
  tách rõ khỏi nhàn ~71,5 và đói ~15–20. Quy tắc "2 mức" KHÔNG còn đúng → **DEF v0.3 sửa
  thành ≥3 mức**. Tương quan gộp n=24 (caveat khác boot #67?/#68?/#70): r(avg60,tickRate)=−0,959;
  r(avg60,T_startup)=+0,864; r(tickRate,T_startup)=−0,831; r(avg60,threadsR)=+0,979; trong GAP
  phẳng (r≈−0,09/+0,08). seekImmMs 1092–1318 ms, frames 290–324, dropped 0–1, threadsR 7,1–8,9
  — đều trung gian giữa Yên và Vừa.
- **Bảng 4 mức (n=24):** Yên avg60 7,02% / tickRate 71,50 / T_startup median 0,337 s / chậm 0/6;
  GAP ~53% avg60 53,19% / tickRate 28,52 / 1,264 s / 4/6; Vừa 69,71% / 18,54 / 1,843 s / 6/6;
  Nặng 90,69% / 16,77 / 2,219 s / 6/6.
- **Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** (leg này không xét lại verdict, không gộp số với bộ
  verdict). Dữ liệu đo: benchmarks/results/webkit-blob-flaky-125t4-f2startup-legtrunggian.json
  (153.488 B) giữ trên đĩa, không đưa vào paths (tiền lệ đợt 124).
- Không sửa production, không push, không đo TTS 39, không thử birefnet.

## 4. T5 — Hạ tầng: boot #69? chết replay, boot #70? PASS +5m02

Chi tiết: docs/PHASE9_ROUND125_T5_INFRA_LIMITS.md (32.264 B).
Dữ liệu thô: hidden_files/round125-t5/ (watcher b69 12 poll + b70 3 poll, postboot
try1/after-edit/poll3/final, POSTBOOT_PASS b70).

- **BOOT #69? (tạm) CHẾT sau ~19–20' — replay KHÔNG TỚI:** boot_id 670c07f6, btime 20:35:11Z
  (sau #68? 3h01m20s). dpkg.log đóng băng 2 dòng configure (20:35:38/39Z, boot +27s) suốt đời
  boot; 0 apt/dpkg mọi lần kiểm; postboot FAIL 14/14 (try1 20:42:24Z + after-edit 20:44:12Z +
  watcher b69 12 poll). Chế độ lỗi giống #60? ("chạm mà không cài") — **lần thứ 2**. Cờ
  POSTBOOT_PASS cho #69? không bao giờ được viết.
- **REBOOT GIỮA LƯỢT #69?→#70? (~20:54:4xZ):** service exec restart trùng thời điểm reboot
  (2 lệnh sleep của T5 bị abort); T5 phát hiện boot mới 20:55:10Z, khởi động lại watcher cho
  #70? 20:57:20Z. Watcher b69 (PID 4435) chết cùng reboot theo thiết kế.
- **BOOT #70? (tạm): replay CHẠY, PASS +5m02 — ĐANG SỐNG:** boot_id 310f07e4, btime 20:54:19Z
  (sau #69? 19m08s). Replay: configure 20:55:02Z (boot +43s), installs 20:55:40–21:01:36Z,
  dpkg 2→1509 dòng, gói cuối gstreamer1.0-tools 21:01:36Z (boot +7m17s). Postboot PASS exit 0
  lúc 20:59:21Z (watcher b70 poll 3, boot +5m02s — trước khi replay xong hẳn vì 11/11 gói đã
  đủ), xác nhận lại exit 0 lúc 21:03:20Z (boot +9m01s). 2 gói từng thiếu ở #65? đều được cài
  (libav 20:57:40Z, plugins-bad 20:58:15Z; dpkg -l ii).
- **CỜ POSTBOOT_PASS HIỆN TẠI** trong hidden_files/round125-t5/ là cho boot #70? (viết
  20:59:21Z). Các luồng đo đợt 125 gate bằng cờ này; cờ #69? không tồn tại — không đọc cờ cũ.
- **Luật repair dạng (C) — ĐÁNH GIÁ LẦN 3: KHÔNG KÍCH HOẠT** trên #69? (apt không sống → điều
  kiện (b) không đạt; chế độ #60?-like không phải dạng (C) → (d) không đạt). Không kill,
  không --repair. Chính sách repair 15' cũ không áp dụng cho chế độ này theo tiền lệ T7 đợt
  120 — T5 đề xuất parent quyết mở rộng policy cho chế độ "chạm mà không cài" (đã 2/16 boot).
  Luật (C) vẫn chưa được thử trong đúng kịch bản mục tiêu.
- **Headroom:** 4318 (mở, #69?) → 3645 (cuối, #70?). **RAM khả dụng:** 1140 MB (mở) →
  987–2139 MB (watcher b69) → 1398 MB (mở #70?) → 1159–2378 MB (watcher b70) → 1788 MB
  (cuối). Tất cả < 6 GB guard — birefnet không thử.
- Stale vite.lock: không có (lock dir không tồn tại); queue 52 file cooldown (48→52); v2 log
  hoạt động cuối T10-round124 trên #68?.
- Script postboot-check sửa 2 lần (md5 457fdec7… → 2418e95e… → ea7735c2…): chỉ tham chiếu boot
  #69?/#70? (header + say); bash -n OK cả 2 lần; không đổi logic; không đổi thứ tự apt/GST
  trong --repair (phương án A chờ parent duyệt).

## 5. T6 — Lock health: đợt 124 khép sạch 18/18/18; đề xuất luật prune

Chi tiết: docs/PHASE9_ROUND125_T6_LOCKHEALTH_LIMITS.md (24.341 B).
Dữ liệu thô: hidden_files/round125-t6/ (analyze-log.py/txt, cooldown-now.txt, ps-full,
test-v2-t6-run1/2.log, repro-newmsg.sh/log).

- **BOOT MỚI #69? (tạm):** boot_id 670c07f6, btime 20:35:11Z (stat /proc/1 20:35:22Z, chênh
  11 s); reboot giữa đợt 124 đóng (18:50Z) và lượt này. Gap danh nghĩa #68?→#69? = 3h01'20";
  boot #68? sống 3h01'20", không reboot trong đợt 124. journal/wtmp chỉ giữ boot hiện tại —
  số hiệu tạm, mù #37 vẫn mở (parent đã chấp nhận để mở).
- **Lock KHỎE, trống sau boot mới #69?:** vite.lock không tồn tại; status TRỐNG, 0 ticket +
  52 cooldown. Holder cuối đợt 124 (t10-round124) nhả sạch 18:38:27Z, 1h56'44" trước reboot.
  0 zombie, 0 tiến trình vite/node/webkit sót, 0 cổng lắng nghe (2 snapshot 20:41Z/20:46Z).
  apt/apt-get pgrep -x = 0.
- **ĐÓNG NỢ T6-124 — tuân thủ lock đợt 124 (sau 17:44Z): 18/18/18 sạch.** +65 dòng log
  (512→577): TICKET 18 / ACQUIRED 18 / RELEASED 18 / COOLDOWN 11 / TIMEOUT 0 / STALE 0.
  t1-round124 2 chu kỳ (hold 54s/43s, port 5590); t2-round124 1 chu kỳ (hold 37s, 5581);
  t3 1 chu kỳ (hold 257s, 5187); t4-round124 12 chu kỳ (chu kỳ đầu wait 152s xếp hàng sau t3
  — FIFO đúng thiết kế; 11 chu kỳ sau chờ cooldown ~8–10s, hold 47–55s, 8965); t10-round124
  2 chu kỳ (hold 269s/116s). **Round 124 khép lại sạch trên lock.**
- **Log nhất quán:** 577 dòng = 178 TICKET + 169 ACQUIRED + 165 RELEASED + 51 COOLDOWN +
  8 TIMEOUT + 5 STALE-LOCK + 1 STALE-TICKET; ghép cặp 165/165, 0 đang giữ, chênh 4 = đúng
  4 ca double-acquire cũ (không ca mới); 0 TIMEOUT/STALE-LOCK mới từ đợt 120. 0 dòng
  DEFER/KILLED/ERROR.
- **"KHÔNG NHẢ"/"BỎ QUA": 0 sự kiện thật** đợt 124 (sau 17:44Z) và đợt 125 (tới 20:46Z).
  25 dòng khớp: 21 bản sao script + 3 repro /tmp của T6-124 + 1 comment driver T10. Tổng
  lock thật đợt 120–124 = 0.
- **Suite /tmp 9/9 ×2 lần chạy (20:44Z, rc=0 cả hai) — lần đầu từ đợt 120 không có lần T7
  flaky ở lần 1.** Repro A/B/C 20:44:50Z xanh như các đợt trước (guard + message mới nguyên vẹn).
- **Tuân thủ lock đợt 125: CHƯA KIỂM ĐƯỢC** — chưa luồng nào dùng lock thật tới 20:46Z (grep
  round125 = 0; log đứng 577 dòng). T6 đợt 126 kiểm tiếp. (T10 ghi chú: lúc đóng đợt 21:48Z,
  log lock đã có thêm các chu kỳ của T1/T2/T4/T9/T10 đợt 125 — T6 đợt 126 kiểm toàn bộ.)
- **Cooldown 52 file / 728 byte** (48→52, +4 tên mới t1/t2/t4/t10-round124; cooldown-t3 ghi đè
  tại chỗ). Tuổi: >48h: 1; 24–48h: 27; <24h: 24; span đúng 48,0 giờ. **ĐỀ XUẤT LUẬT PRUNE
  (chờ quyết parent, KHÔNG tự xóa):** xóa file cooldown-* mtime >7 ngày mỗi lượt T6; trần mềm
  100 file (không xóa file <48h); không xóa file đợt hiện tại/đợt trước; chỉ chạy khi lock
  trống; ghi tên file đã xóa vào log. Cơ sở: file cũ inert (acquire chỉ đọc file của chính
  thread mình, remain → 0).
- v1 frozen dòng 191 vẫn in câu cũ — chỉ ghi nhận, không mở băng (chờ quyết parent).

## 6. T7 — EPERM probe #44 + mù #44 mới + mù #45 mới

Chi tiết: docs/PHASE9_ROUND125_T7_EPERM_LIMITS.md (50.733 B — oversize).
Dữ liệu thô: hidden_files/round125-t7/ (prereg, probe-notes, blind44-*.py/log,
eperm-sweep44, ram-max44, scan-wfs, blind44-gaps.txt).

- **Probe #44: 20:45:03Z, boot 670c07f6, ok=2 fail=0.** Checklist P8 §2.3 đúng 1 lần: status
  DEAD/STALE (age 10.904 s, exit 1) → once probe #44 exit 0 → status ALIVE n=44 exit 0.
  Log v2 121 → 124 (+3, như mọi lượt). Boot #69 (tạm) 20:35:11Z, btime 1794861311, F69 ≈ 0.
- **Mù #44 (MỚI) 17:43:19Z → 20:45:03Z (3h01'44"): KHÔNG ĐÓNG HOÀN TOÀN (D mở, E đóng, tối
  đa 5 ẩn).** Đoạn D (boot #68, 2h51'52"): đuôi 5.899 s sau mốc cuối 18:56:52Z
  (docs/PHASE9_ROUND124_LIMITS.md), 0 session bắc qua cắt D-hi, 0 file trong đuôi ở cả 4 phạm
  vi. Đoạn E (boot #69, 9'52"): ĐÓNG bằng uptime trực tiếp lúc probe #44. Gap #68→#69 =
  3h01'20" (10.880 s) VẪN SPAN. CERT giữ n=38, FULL giữ n=53 (tái hiện 100% bằng
  blind42-gaps.py verbatim).
- **MÂU THUẪN BRIEF — T7 tuân LUẬT CỨNG:** nhiệm vụ (1) "kiểm tra sâu mù #42 đoạn B với góc
  mới" mâu thuẫn LUẬT CỨNG "KHÔNG kiểm lại mù #40 B / #43" (đoạn B mù #42 = mù #43; quyết
  parent §12.4 đợt 124 đã chấp nhận để mở). T7 KHÔNG kiểm lại #42 B / #43 / #40 B lượt này;
  làm probe #44 + mù #44 mới thay thế. Cần parent quyết (a) giữ §12.4 hay (b) quyết mới ghi
  đè — xem §12(a).
- **REBOOT #70 GIỮA PHIÊN (20:54:19Z, boot 310f07e4, btime 1794862459, F70 ≈ 0):** phát hiện
  lúc stage file 21:01:33Z. Không ảnh hưởng mù #44 (cửa sổ đóng 20:45:03Z). Gap #69→#70 danh
  nghĩa 1.148 s (19'08") — chỉ hơn sàn 1 s. **Mù #45 MỚI MỞ** (từ probe #44) — việc lượt sau
  (T7 KHÔNG chạy probe #45). Đính chính: không có "reset dpkg giữa boot" — quan sát 20:55:48Z
  là replay của boot #70 sau khi reboot xóa /var/log (bài học: kiểm boot trước MỖI lần đọc
  /var/log). Replay #70: 1.509 dòng, 20:55:02–21:01:36Z, kết thúc gstreamer1.0-tools (cùng
  hình dạng #68; T5 đối chiếu độc lập: replay #69 đóng băng 2 dòng suốt đời boot, postboot
  FAIL 14/14, chế độ #60?-like lần thứ 2).
- **EPERM sweep mù #44: 0 sóng thật** (131 log; 5x "Operation not permitted" = 1 dòng dmesg
  đã biết ×5; 5x "đã tắt" = FP launcher; mở rộng 65 match / 55 dòng duy nhất, phân loại hết).
  Sóng gần nhất vẫn ~11:55–12:11Z 11/11, ~128h50' trước probe #44.
- **WFS lần 31: 838 dòng / 235 file; R7B 863/252; copies 25/17 — chênh 0 (lần 31 liên tiếp).**
  +8/+2 giải thích hết bằng diff (LIMITS T7-124 +6, LIMITS gộp +1, GAP_ANALYSIS 24→25).
  Async .writeFile(: 2 helper đã biết, 0 stray.
- **RAM max trong mù #44: 3.431 MB (17:51:40Z, đoạn D) = 57% guard; đoạn E max 1.863 MB.
  Birefnet KHÔNG chạy** (quyết §12.7 đợt 124). md5 preview.tsx 03bf029f / media.ts 2c384ed1
  không đổi.
- **Nợ chuyển đợt 126:** mù #44 (D mở, tối đa 5 ẩn) + mù #45 (mới, từ probe #44) chờ parent
  quyết để mở hay điều tra; mâu thuẫn brief nhiệm vụ (1) chờ parent quyết; R9 (a) nhắc lần 11.

## 7. T8 — Vite harness: 82j3 + 7 harness EXIT:2 + libevent + 68v2 — 4/4 ĐÓNG

Chi tiết: docs/PHASE9_ROUND125_T8_VITEHARNESS_LIMITS.md (22.782 B).
Dữ liệu thô: hidden_files/round125-t8/ (backup, build-tp-ocean-a50.mjs, rerun-*.sh,
smoke/ 20+ log + 3 summary, fixtures/, tsc-web.log, vite-build.log).

- **82j3 check config — ĐÃ XONG (nợ đợt 124 §9 mục 2).** `probe-82j3-sample-load.mjs` +4 dòng
  (mẫu 65r8-overlay), md5 25c8456c → edb86968, 8.146 B. Kiểm chứng 2 chiều: config vắng → lỗi
  rõ "(chạy clicktest-77e1-deint-fps.mjs trước để tạo)", 0 spawn/mồ côi; sau writer 77e1
  (10/10 pass) → vite lên, probe tự kết luận PROJECT ĐÃ LOAD (3 clip + hook). node --check PASS.
- **7 harness EXIT:2 đợt 121 — HẾT EXIT:2, 7/7 exit 0 (nợ đợt 124 §9 mục 3 ý 1).** Khôi phục:
  hevc-a.mp4 (libx265 1080p 2s + sine 440, faststart), blend-tp-ocean-a50.mp4 (build mới theo
  method H4, α=0,50 — file này CHƯA TỪNG tồn tại), i7-clip-10s.mp4 (testsrc2 640×360 10s),
  blend-tp-slov-a085.mp4 (build lại a85 bằng script gốc + copy byte-identical), h/g 320×180
  30s+4s (l10/m4/n2). Chạy lại đầy đủ: 76d8 11/11, r80h4 3/3, r81i4 3/3, 81i7/84l10/85m4/86n2
  nhánh chromium đều exit 0. 4 harness webkit cần Xvfb ngoài (không tự spawn).
- **libevent — ĐÃ HẾT (nợ đợt 124 §9 mục 3 ý 2).** Replay hệ thống (postboot #70 của T5) đã
  cài libevent-2.1-7t64 2.1.12; T8 không tự cài apt. 81i7-webkit: không GST env → 2/2 crash
  sớm "Target crashed"; + GST_PLUGIN_PATH/SYSTEM_PATH + Xvfb :194 mới → exit 0, W1+W2 PASS.
  Một lần kẹt W2 trên :195 (timeout 600) không tái hiện trên :194 — ghi flaky/display.
- **68v2 đầy đủ H0–H7 — 8/8 pass, exit 0 (nợ đợt 124 §9 mục 3 ý 3).** Lần 1 exit 2: Chrome
  FATAL "Socket path too long" (TMPDIR dài ~128 ký tự > sun_path 108; đã tái hiện độc lập) →
  sửa TMPDIR → /tmp/round68-v2/tmp. Lần 2: 7/8, H1 fail oan do probe đọc nhầm hint
  (.preset-desc đầu tiên của dialog) → sửa selector lấy hint kề sau hàng toggle. Lần 3: 8/8.
  md5 harness 5f74da1e → 12b9b7a2, 31.685 B.
- **Reboot #70 (20:54:19Z) giữa lượt:** /tmp bị xóa, fixture tạo lại lần 2 (md5 khớp lần 1).
  T8 chờ T1/T2/T9 đo xong (lock trống 21:13Z) mới chạy 68v2/81i7-webkit; T4 leg tải chạy song
  song các lần chạy sau (loadavg cuối 3,11 — caveat).
- Không sửa production (preview.tsx 03bf029f / media.ts 2c384ed1 / vite.config.ts ee80d093
  không đổi), không push, không release/tag, không đo TTS 39, không thử birefnet. tsc apps/web
  exit 0; vite build exit 0 (6,70 s).
- **Nợ chuyển đợt 126:** chạy 84l10/85m4/86n2 nhánh webkit với GST env + display mới; 25 file
  config mặc định chưa mirror (cần parent quyết — §12d).

## 8. T9 — WebKit lượt yên #5: HỢP LỆ — ĐÃ ĐÓNG NỢ + đo RAM idle

Chi tiết: docs/PHASE9_ROUND125_T9_WEBKIT60MS_LIMITS.md (23.961 B).
Số thô: hidden_files/round125-t9/preview-b-f3-flip-webkit-t9-attempt1.json (3.049.351 B).

- **Verdict: 1 LƯỢT YÊN HỢP LỆ — attempt1 20/20 pass, tickCost median 47,5 ms (p90 70,0;
  n=614), lớp B 5/5 ĐẠT. Ngưỡng WebKit ≤60 ms GIỮ. Nợ lượt yên theo dõi lần 5 ĐÃ ĐÓNG**
  (lượt yên hợp lệ thứ 4: S5 49,5 / T4-118 40,0 / T3-121 52,0 / T9-125 47,5).
- **Reboot cắt giữa chừng 20:54:19Z (boot #69 → #70, gap 19'08"):** gate0-wait + poller T9 chết
  theo boot cũ sau poll #5 (replay #69 chết — dpkg.log đóng băng 2 dòng, khớp ghi nhận T1/T2);
  T9 khởi động lại trên boot #70 theo phụ lục prereg viết trước khi đo trên boot mới. Gate 0
  đạt ngay poll #1 trên #70 (T5 POSTBOOT_PASS 20:59:21Z, postboot riêng exit 0, apt=0 pgrep -x,
  RAM 1493 MB, md5 03bf029f). Gate A mở poll 4 (21:08:29Z, load1 0,94 / load5 1,70 / blockers 0
  / RAM 1640 MB). Probe 21:08:29–21:11:52Z exit 0. T4 chờ cờ T9 đúng hẹn (hog bắt đầu ~21:15:2x,
  sau cờ 21:14:15Z) — cửa yên sạch, khác đợt 124.
- **Số đo attempt1:** tBlend gap median 87,0 (S5: 93,0); BlendTick/pass 24,9; rAF/pass median 36;
  phân rã wallMs đều 43–52 ms mọi dải. Lớp B: B1 load5 cuối 1,32; B2 load1 max 1,94 + T2
  không nhiễm (chờ cờ T1 tới 21:11:02Z, att2 chạy 21:11:54–21:12:27Z sau khi probe T9 thoát);
  B3/B4 ĐẠT; B5 RAM min 724 MB, 0 mẫu <500 MB (4/10 mẫu <1024 MB — cảnh báo). (b) lag ≥+5f: 0;
  (c2) +1f tái hiện dạng 5 occurrence (seq 203/252/306/430/479) — ghi nhận chuyển T5 chẩn đoán;
  F6' bar đạt 100%/100% (kiểm lại, vẫn đóng từ L7); stale-ghost 0 occurrence.
- **Đo RAM baseline idle (ngoại lệ MỘT LẦN, quyết parent §12.6 đợt 124): XONG.** Trang preview
  idle ~800 MB (WebKit ~689–728 MB + vite ~99 MB, bình ổn sớm); 3 mẫu cuối nhiễu (3,5 MB →
  221 MB → 0 KB, chưa rõ nguyên nhân — không dùng để kết luận); MemAvailable dao động ±300 MB
  ngay cả khi idle (áp lực host). Nợ đợt 120 §9.4 ĐÓNG.
- **Nợ sửa sampler (LIMITS T9-124): ĐÃ SỬA + VERIFY.** Marker STOP + sleep 1 s × 20 +
  kill/kill-9; sampler dừng ~1 s sau node thoát (21:11:49Z, alive=NO, 10 mẫu, không mẫu hậu
  đo). Nợ ĐÓNG.
- Probe dùng nguyên md5 dccb8f4c (đợt 121). tsc apps/web exit 0; postboot sau lượt exit 0; cây
  baseline 03bf029f/2c384ed1 không đổi. Không sửa production, không push, không đo TTS 39,
  không thử birefnet.

## 9. T10 verify + đếm cuối (phương pháp đếm — chốt một con số)

### 9.1 Phase 1 (chạy NGAY trong phiên, boot #70 310f07e4 vẫn sống suốt)

- **Suite cây gộp 27/27 exit 0** (21:42:05–21:45:54Z, RAMavail 616 MB lúc bắt đầu; tsc-web 0,
  tsc-desktop 0, vite build 0 + 24 test; log: hidden_files/round125-t10/round125-t10-suites.log).
- **O8 Chromium 21/21 pass exit 0** (21:47:21Z) + **O8 WebKit 21/21 pass exit 0** (21:48:11Z)
  — **WebKit FULL PASS lần thứ ba liên tiếp**. Log: hidden_files/round125-t10/t10-o8.log.
- md5 trước/sau khớp (preview.tsx 03bf029f, media.ts 2c384ed1). Cây KHÔNG đổi trong đợt.
- **Không reboot trong lúc đóng** — boot #70 duy nhất từ 20:54:19Z tới lúc đóng 21:48Z.
  (Reboot duy nhất của đợt là #69→#70 lúc 20:54:19Z, giữa lượt, trước khi T10 bắt đầu.)
- 9/9 cờ .done tồn tại trên đĩa lúc kiểm đầu (21:40Z): round125-t1..t9.done — không thiếu cờ
  nào, không cần kiểm lại từ báo cáo. Hai cờ phụ round125-e4a7-done + round125-e4b8-done cũng
  có. T4 gốc kết thúc không báo cáo cuối (21:04Z) nhưng DEF v0.2 + prereg đã xong trên đĩa —
  luồng T4 thay thế đã hoàn thành leg + LIMITS + stage, không làm lại phần đã xong (bài học
  "kiểm đĩa trước khi kết luận" đã áp dụng đúng).

### 9.2 Đếm cuối — PHƯƠNG PHÁP CHỐT (đợt sau dùng lại y hệt)

Phương pháp (script hidden_files/round125-t10/recount-push125.py, log recount-push125.log):
đếm **entry NUL-delimited trong mỗi file `phase9-roundXXX-*.txt`** dưới
`~/workspace/repo-1-push/paths-loop/`; **batch = 1 file paths** (trừ file lạ `preview-parity`
đã biết, loại khỏi đếm); **entry** = số đường dẫn trong file; **file duy nhất** = số đường
dẫn khác nhau sau khi dedup theo chuỗi đường dẫn tương đối. Lũy kế = gộp tất cả batch của
các đợt trong khoảng, dedup toàn cục.

- **Đợt 125 = 10 batch / 17 entry / 17 file duy nhất** (9 batch luồng: 15 entry + closing
  batch: 2 entry — LIMITS gộp này + GAP_ANALYSIS §54; 0 file trùng nhau trong đợt).
- **Lũy kế đợt 111–124 (tính lại bằng đúng phương pháp này) = 137 batch / 412 entry / 375 file
  duy nhất** — khớp đúng số chốt đợt 124 (không sai lệch).
- **Lũy kế đợt 111–125 = 147 batch / 429 entry / 389 file duy nhất** + 1 oversize 6,4 MB
  (`benchmarks/results/webkit-blob-flaky-96x3.json`, chưa lên từ trước).
- **Đối chiếu 3 con số khác nhau trong đợt (ghi rõ để khỏi nhầm):**
  - T9 "807 file": **số file *.txt trong thư mục paths-loop lúc 21:21Z** (đếm file, không phải
    entry; lúc đó chưa có batch T4/T8/closing — nay là 810 file).
  - T4 "811 file": **không tái hiện được bằng phương pháp nào** (không khớp số file trong thư
    mục lúc 21:31Z ≈ 808, không khớp entry đợt 124–125 = 30, không khớp lũy kế) — số T4 tự
    báo, **không dùng làm số chính thức**.
  - T8 "8.706 entry": **tổng entry thô của TOÀN BỘ 809 file *.txt trong paths-loop** (bao gồm
    cả các đợt trước 111 và file không thuộc đợt nào) — đúng theo cách đếm thô đó, nhưng
    **không phải lũy kế đợt 111–125**; chỉ dùng khi cần đối chiếu tổng thô.
- **Số chính thức duy nhất: lũy kế 111–125 = 147 batch / 429 entry / 389 file.** Mọi báo cáo
  sau dùng phương pháp §9.2 này.
- Path hygiene đợt 125: 0 absolute-path, 0 missing-file (kiểm read-back từng batch lúc stage
  + recount cuối).

### 9.3 File oversize trong batch đợt này (>37.768 B, lúc push cần ENABLE_PRIVSEP=0)

Đo thật bằng stat (không đoán):

| File | Kích thước (B) |
|---|---|
| benchmarks/render/f2_startup_probe_125t4.mjs | 86.006 |
| docs/PHASE9_ROUND125_T7_EPERM_LIMITS.md | 50.733 |
| docs/PHASE9_ROUND125_LIMITS.md (gộp, file này) | 39.401 |
| PHASE9_GAP_ANALYSIS.md (trong closing batch) | 243.824 |

Trong lũy kế 111–125 có 131 file duy nhất >37.768 B (chủ yếu LIMITS các đợt trước). File đo
lớn `benchmarks/results/webkit-blob-flaky-125t4-f2startup-legtrunggian.json` (153.488 B) giữ
trên đĩa, KHÔNG đưa vào paths (tiền lệ đợt 124).

## 10. Nợ mở chuyển đợt 126

1. **E4 lượt 9+:** quyết parent đợt 124 chỉ duyệt tới lượt 7; lượt 8 đã chạy theo kế hoạch lô.
   Lượt 9 (A/B luân phiên) chờ quyết mới — xem §12.
2. **DEF v0.3:** điền ranh giới dải ~53% + tickRate ≥3 mức + bài học dial (dial không browser
   đánh giá thấp avg60 ~27 điểm). Leg dò thêm quanh ~45–55% (dial có browser ấm) để xác định
   dải chuyển hẹp hơn.
3. **Mù #44 (D mở, tối đa 5 ẩn) + mù #45 (mới, từ probe #44):** chờ quyết parent để mở hay
   điều tra — xem §12(h).
4. **Mâu thuẫn brief T7** (nhiệm vụ kiểm sâu mù #42 đoạn B vs quyết §12.4 đã chấp nhận để mở):
   chờ quyết parent — xem §12(a).
5. **Luật repair dạng (C) + policy "chạm mà không cài":** đánh giá lần 3 KHÔNG kích hoạt; đề
   xuất mở rộng policy (đã 2/16 boot) — xem §12(b).
6. **Luật prune cooldown T6:** xóa file cooldown-* mtime >7 ngày mỗi lượt; trần mềm 100 file —
   xem §12(c).
7. **25 file config mặc định chưa mirror (T8):** có mirror không — xem §12(d).
8. **T8 webkit:** chạy 84l10/85m4/86n2 nhánh webkit với GST env + display mới (như 81i7 đã
   pass) để có số đối chiếu webkit đầy đủ sau mirror.
9. **T6 đợt 126:** kiểm tuân thủ lock đợt 125 đầy đủ (T1/T2/T4/T9/T10 — lúc T6 kiểm 20:46Z
   chưa luồng nào dùng lock thật); kiểm lại log lock sau 577 dòng.
10. **T5:** chẩn đoán (c2) +1f tái hiện dạng 5 occurrence (seq 203/252/306/430/479) từ T9 —
    ghi nhận chuyển T5 chẩn đoán.
11. **Scheduler:** cơ chế drop chi tiết cần bằng chứng ngoài VM; không điều tra tiếp từ trong
    VM bằng cùng phương pháp.
12. **ci-security.yml vẫn 403 chờ user** (nợ cũ, không đổi). **TTS 39 cấm kiểm lại. Birefnet chỉ
    thử lại khi quan sát được available ≥ 6 GB** (u2net là fallback chính thức).
13. **R9 (a) vẫn chờ user (nhắc lần 11). G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.**

## 11. Bài học vận hành (đợt 125)

- **Kiểm đĩa trước khi kết luận thiếu:** T4 gốc kết thúc không báo cáo cuối (21:04Z) nhưng DEF
  v0.2 + prereg đã xong trên đĩa — luồng thay thế hoàn thành phần còn lại, không làm lại.
  9/9 cờ .done đều có trên đĩa lúc T10 kiểm đầu; không cờ nào phải suy ra từ báo cáo.
- **Reboot giữa đợt là bình thường mới:** đợt này có 2 reboot (#68→#69 lúc mở đợt, #69→#70
  giữa lượt 20:54:19Z). Mọi luồng đo đều phải gate bằng cờ POSTBOOT_PASS của đúng boot hiện
  tại; cờ boot đã chết không được dùng (luật STALE). T1/T2 att1 KILLED-REBOOT chạy lại att2
  trên boot mới — đúng tiền lệ đợt 121.
- **Kiểm boot trước MỖI lần đọc /var/log:** quan sát "reset dpkg giữa boot" của T7 hóa ra là
  replay của boot #70 sau khi reboot xóa /var/log — đính chính trong LIMITS T7.
- **Định dạng cờ có thể đổi giữa các boot:** T5 đổi cờ POSTBOOT_PASS sang dấu `=` ở b70; mẫu
  grep cũ của gatewaiter T4 đã sửa thành `boot_id[:=] *` trước khi đo. Luồng gate bằng cờ
  phải đọc lại định dạng cờ thật, không giả định.
- **Watcher khởi động có thể thất bại im lặng:** watcher T4 lần đầu không viết được log, không
  có process, nguyên nhân chưa xác định — phải xác nhận process đang chạy sau khi spawn
  (setsid + nohup + kiểm pid), không giả định spawn thành công.
- **Phối hợp T4/T9 lệch nhau ĐÃ CÓ TÁC DỤNG:** T9 lượt yên hợp lệ 20/20 trên cửa yên sạch
  (khác đợt 124 bị nhiễm tải) — quyết parent §12.10 đợt 124 được thực thi đúng, T4 chờ cờ T9
  trước khi chạy hog.
- **Đếm batch phải ghi rõ phương pháp:** ba con số 807 / 811 / 8.706 trong đợt dùng ba phương
  pháp khác nhau (đếm file trong thư mục / không tái hiện được / tổng entry thô toàn thư mục).
  Từ đợt này chốt phương pháp §9.2 (entry NUL trong file paths theo đợt + dedup) làm số chính
  thức duy nhất; mọi con số khác phải ghi rõ phương pháp kèm theo.
- **Dial đo tải phải có browser ấm:** dial 2 hog đọc 25,98% nhưng run means ~53% — tải của
  chính browser/vite cộng thêm ~27 điểm avg60. Leg dò ranh giới sau này phải dial có browser
  ấm hoặc chấp nhận TARGET-MISS và ghi rõ.
- **Số hiệu boot là tạm:** #69?/#70? chờ T6 recount mù #37 đợt 126; journal/wtmp chỉ giữ boot
  hiện tại nên không xác minh được số tuyệt đối từ trong VM.

## 12. Quyết parent (main chat, 04:5x +07 17/11/2026 — đóng đợt 125)

- **(a) Mâu thuẫn brief T7: GIỮ §12.4 đợt 124 — hủy nhiệm vụ kiểm
  sâu mù #42 đoạn B.** Nội dung brief của T7 đã cũ (viết trước
  quyết parent); luật cứng (không kiểm lại mù đã chấp nhận để mở)
  có hiệu lực cao hơn, và T7 đã xử lý đúng (không kiểm lại, làm
  probe #44 + mù #44 thay thế). **Luật đứng:** brief các đợt sau
  không được giao kiểm sâu mù nào parent đã chấp nhận ĐỂ MỞ (#35,
  #37, #39 J, #40 B, #43).
- **(b) Policy repair cho chế độ "chạm mà không cài": LÀM RÕ +
  SIẾT, không thêm luật mới.** Chế độ này VỐN ĐÃ thuộc luật
  replay-chết §8.2 dạng (B) (dpkg.log chỉ có bước configure, 0
  dòng install, lists trống) — T5 đợt này chỉ đánh giá luật (C)
  (dành cho apt còn sống nhưng kẹt) nên bỏ sót §8.2. Trên boot
  #69, §8.2 đủ 5 điều kiện từ ~20:50Z (postboot FAIL 14/14; 0
  tiến trình apt/dpkg; dpkg im ≥15'; dạng (B); không probe đang
  chạy) — chỉ còn cửa sổ ~3 phút trước reboot tự nhiên 20:54:19Z
  nên không kịp kích hoạt. Quyết: (i) **ghi rõ §8.2 dạng (B) bao
  chế độ này** — luồng hạ tầng phải đánh giá §8.2 (không chỉ luật
  (C)) khi dpkg đóng băng; (ii) **riêng dạng (B), ngưỡng chờ là
  dpkg im ≥10 phút** (thay vì 15) — log chỉ có configure + 0 tiến
  trình apt đang sống = replay đã kết thúc rõ ràng, không còn gì
  để chờ (kiểm 3 dấu hiệu chết vẫn bảo vệ khỏi giết oan replay
  chậm); (iii) **luồng hạ tầng đánh giá §8.2 ở MỖI poll của
  watcher** một khi dpkg.log đã đóng băng. Reboot tự nhiên trước
  ngưỡng vẫn chấp nhận được (như #69 — 19 phút, thiệt hại nhỏ).
  Hiệu lực từ đợt 126.
- **(c) Luật prune cooldown của T6: PHÊ DUYỆT, thành luật đứng từ
  đợt 126.** Xóa file cooldown-* mtime >7 ngày mỗi lượt T6; trần
  mềm 100 file; không xóa file <48h; không xóa file đợt hiện tại
  / đợt trước; chỉ chạy khi lock trống; ghi tên file đã xóa vào
  log. Hiện 52 file / 728 byte — nhỏ, nhưng luật ngăn tích lũy
  không giới hạn; các biện pháp bảo vệ là đủ.
  > **Chú thích ngữ nghĩa `find -mtime` (bổ sung đợt 130, theo
  > quyết parent LIMITS gộp đợt 129 §12.3(e) — chỉ ghi rõ, KHÔNG
  > đổi hành vi prune):** `find` cắt phần lẻ của tuổi theo ngày
  > nguyên, nên `-mtime +7` chỉ khớp file **≥192h (8 ngày)** chứ
  > không phải >168h đúng nghĩa, và `-mtime +2` chỉ khớp file
  > **≥72h** chứ không phải >48h. Phương pháp `find` hiện hành
  > BẢO THỦ HƠN chữ luật tối đa 24h: ngưỡng ">7 ngày" thực thi là
  > ≥192h, ngưỡng ">48h" thực thi là ≥72h — xóa muộn hơn, không
  > bao giờ xóa sớm hơn luật cho phép. Các đợt sau KHÔNG "sửa"
  > ngược ngưỡng này.
- **(d) 25 file config mặc định: KHÔNG CẦN LÀM GÌ — nợ đã cũ.**
  Đính chính hồ sơ: 25 file này **ĐÃ ĐƯỢC MIRROR ở đợt 122**
  (T8 đợt 122: 25/25 node --check PASS, smoke 25/25 PASS, đúng
  đủ 25 tên trong danh sách T9 §6.1) và **đã verify còn nguyên ở
  đợt 124** (T10 đối chiếu md5 25/25 file với
  round122-t8/edit-log.json, khớp hết). Mục nợ §9.3 của T8 đợt
  125 trích lại §6.1 đợt 121 mà không tính công việc đợt 122 —
  ghi đính chính này để các đợt sau không nêu lại. Phương án "nâng
  trần host" không còn liên quan tới 25 file này.
- **(e) DEF v0.3 + leg dò ~45–55%: PHÊ DUYỆT cả hai.** Viết DEF
  v0.3: ranh giới chuyển ghi thành **DẢI ~45–60%** (không phải
  một điểm — leg GAP TRỘN 4/6 chậm, 2/6 nhanh chỉ dưới ngưỡng
  3–7 ms); tickRate **≥3 mức** (nhàn ~71,5 / ranh giới ~28,5 /
  vừa ~18,5 / nặng ~16,8); bài học dial (dial không browser đánh
  giá thấp avg60 ~27 điểm — **dial bằng browser ấm**). Chạy **một
  leg dò thêm quanh ~45–55% ở đợt 126** (6 run, đăng ký trước,
  dial có browser ấm) để thu hẹp dải chuyển. Sau leg này, DEF v0.3
  coi như ổn định trừ khi số mới mâu thuẫn. Verdict KHÔNG ĐẠT đợt
  120 vẫn đứng.
- **(f) R9 (a): VẪN CHỜ user** (nhắc lần 11). Không thay đổi.
- **(g) G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã
  hỏi 13:44 16/11, chưa trả lời). Không thay đổi.
- **(h) Mù #44 D + mù #45 mới: ĐIỀU TRA MỘT LẦN RỒI ĐỂ MỞ.**
  #44 D: **một lần kiểm sâu ở đợt 126**, rồi ĐỂ MỞ nếu 0 bằng
  chứng mới (chữ ký đuôi trống đã rõ qua 5 mù để mở — một lần
  kiểm là đủ cho mù mới, không đốt ba đợt). #45: probe #45 + mô
  tả ban đầu ở đợt 126 (công việc đứng); nếu đuôi của nó cũng
  mang chữ ký trống tương tự thì ĐỂ MỞ luôn, không kiểm sâu thêm.
  Gap #68→#69 giữ SPAN.
- **(i) E4 lượt 9 + 10 (không có trong danh sách T10, bổ sung từ
  §10.1): CHO CHẠY TIẾP để hoàn tất lô.** Lượt 9 (A, gop250,
  e4a9) rồi lượt 10 (B, gop30, e4b10) ở đợt 126 trên cây baseline.
  Lô hiện 7/10 (0 CAUGHT, 7 VOID); dừng lúc này sẽ phí thiết kế
  đăng ký trước. Mục theo dõi: cụm drift 14 lần của lượt 7 (không
  lặp lại ở lượt 8), pause-seek dao động 266–1871 ms trên cùng
  boot #70, resync cuối clip lượt 6 (không lặp lại).
- **(j) Đóng đợt 125 9/9: CHẤP NHẬN.** Suite 27/27 exit 0; O8
  Chromium 21/21 + WebKit 21/21 exit 0 (WebKit FULL PASS lần thứ
  ba liên tiếp); cây không đổi; chốt chặn đã xóa; cờ t10.done có.

---

*Đợt 125 đóng bởi T10 trong phiên 21:48Z 16/11/2026 (trước hạn cứng 23:00Z). 9/9 luồng, KHÔNG
push. Batch closing: repo-1-push/paths-loop/phase9-round125-closing.txt.*
