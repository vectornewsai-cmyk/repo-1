# PHASE9_ROUND180_T0_BOOT_O8_LIMITS.md

Đợt 180 — T0 (boot survey + xác minh reboot mới + O8). Mở ~20:57Z, đóng ~21:17Z 23/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #95 — XÁC NHẬN 9 nguồn**: boot_id `95b483a2-2c91-4dd1-882b-d8f6481391be`
  (khác #94 `ae2a9a47`); btime **19:10:22Z** (epoch 1795461022; uptime bracket ×3 khớp cùng giây,
  boot_est 1795461022.995/.990/.995 = btime +0,995 s, kiểm lại 21:12:31Z +0,990 s; /proc/1 start_ticks 1111 = btime +11,11 s,
  stat mtime 19:10:34.106Z = btime +12,106 s; journal idx 0 duy nhất, first 19:10:34Z =
  btime +12 s; wtmp begins 19:10:34Z; last reboot 19:10 still running; Cloudflare ×4
  (CF nhanh hơn local +0,175…+1,185 s — cùng chiều các đợt trước); DB: run 179 boot_gen MỚI
  d67600a2, run 180 boot_gen d67600a2 (#95); requeue #95 = 1 (xem dưới);
  marker mtime không đổi). T7-179 xác minh 9 nguồn trong 52 s + T4-179 xác nhận độc lập boot + btime:
  KHỚP T0-180 từng số qua đối chiếu (xem dưới).
- Gap #94→#95 = **6.793 s (1h53m13s) — TRỞ LẠI mẫu ~2 giờ** (gap #93→#94 = 14.974 s;
  gap #92→#93 = 7.568 s; gap #91→#92 = 6.827 s). #95 xảy ra TRONG phiên đợt 179 (19:10:22Z),
  TRƯỚC khi đợt 180 mở (20:35:51Z); T7-179 phát hiện trong 52 s.
- **Marker sống qua 47 reboot (#49–#95)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (46 qua #94 + #95).
- **Run 179 TIMEOUT (DB đọc tươi ~21:01Z — kết cục thuộc T7-180)**: finished 20:36:19Z,
  status `timeout`, timed_out true, attempt 1, boot_gen d67600a2 (#95); SAU hạn ngân sách
  20:35:51Z 28 s; timeout event eid 10509 20:36:19.057Z ("Ran out of its 10800s time
  budget"); claimed 20:36:12Z → claimed→finished **7 s** (cùng mẫu run 177/178); đúng 5 event,
  đúng **1 lần viết lại (#95)**. Run 180 6ee0f154 (tick 20:35:51Z): started 20:36:19Z
  (**trễ 28 s so với sched — đúng bằng run 179 finished**), RUNNING lúc T0 đọc, boot_gen
  d67600a2 (#95) — chuỗi jitter 0 s run đợt (175–179) ĐỨT tại run 180.
- **(m) #95 — KHỚP T7-179 (phân loại cuối thuộc T2-180 + parent 180)**: requeue eid 10490
  `requeued_after_restart` **btime95 +38,743 s**, TRONG band [33; 49,8], cách biên dưới
  5,743 s, cách biên trên 11,057 s; 1 requeue duy nhất cửa rộng [19:10:22Z, 19:25:22Z]
  (truy vấn mọi job); 1 requeue cửa hẹp [19:10:55Z, 19:11:11,8Z]; spanning = ĐÚNG 1 run
  (run 179); reattach +39,032 s; dispatch lần 2 +38,897 s; offset thật ∈ (37,743 s, 38,743 s]
  — caveat phân số KHÔNG lật được.
- **F-179-T9-2 — LỆCH ĐỒNG HỒ: XÁC NHẬN đồng hồ cell nhanh ~26 s trước reboot, boot mới đúng giờ
  (xem §F-180-T0-2)**: ba dấu độc lập trước reboot đều đọc 23–27 s sau btime (sampler cuối #94
  19:10:45Z +23 s; diag T8 heartbeat cuối 19:10:48.806Z +26,806 s; SIGTERM T7 ~19:10:48Z +26 s);
  boot_est − btime = +0,99 s + CF ~1 s + /proc/1 +12,106 s chứng minh btime ĐÚNG trong ~2 s;
  gap sampler THẬT ≈ 136 s (không phải 110 s danh nghĩa). Hạn chế: sampler 60 s không cho thấy
  bước nhảy +26 s — mâu thuẫn bề mặt chưa giải quyết được, giao T2-180/T10-180.
- **POSTBOOT_PASS #95 ĐÃ CÓ 20:59:47Z** (T5-180, mode **replay-đầy-đủ, poll=0**,
  dpkg 1545, cache 178, lists 71, GST 269 — KHÁC #94 repair-sớm-quyết-h, poll=1, dpkg 795;
  GIỐNG #92 replay-đầy-đủ, poll=0, dpkg 1545; xem F-180-T0-1). Chi tiết thuộc T5-180.
- **O8 trên boot #95 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (21:13:23–21:16:02Z):**
  WebKit attempt1 pid146550 exit=0, **21/21 PASS** (S1 PASS 21:13:38.111Z, Playwright mouse
  click lần 2), JSON 21 results, 21 ok=true, md5 `0e5ed913…`, bản copy attempt1.
  WebKit attempt2 exit=0, **21/21 PASS** (S1 PASS 21:14:30.797Z), JSON 21 results,
  21 ok=true, md5 `5413ceb7…`, bản stamped theo lượt khớp md5.
  Chromium exit=0, **21/21 PASS** (S1 PASS 21:15:32.477Z, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `a009cca9…`, bản stamped theo lượt khớp md5.
  Đếm lại từ JSON gốc bằng python. **Cả ba bộ đều chạy SAU POSTBOOT_PASS #95 (20:59:47Z)**
  — O8 bắt đầu 816 s sau cờ; cờ replay-đầy-đủ KHÔNG caveat repair (khác #94).
- **0 attempt chồng:** T4 poll #15–#16 trong cửa sổ O8 đều ghi lock=co thread=t0-round180 +
  blockers → cửa yên KHÔNG mở; poll #17 (21:16:44Z, 42 s SAU khi O8 nhả lock) lock=không
  (RAM=1490MB) → T4 vào attempt SAU O8 — bàn giao sạch, 0 chồng (xem F-180-T0-5).
  O8 chỉ chồng pha poll của T4, 0 attempt.
- X11: display O8 (:188/:197) đã dọn sạch, /tmp/.X11-unix trống, 0 process sót của T0
  (kiểm 21:17:00Z).
  Boot lúc T0 đóng vẫn 95b483a2 (kiểm cuối 21:17:00Z). Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-180-T0-*)

- **F-180-T0-1 — POSTBOOT_PASS #95 ĐÃ CÓ lúc T0 mở (~20:57Z) — O8 KHÔNG phải chờ cờ
  (khác mẫu #86/#89/#90/#92/#94).** Cờ ghi 20:59:47Z — SAU lúc T0 mở ~20:57Z nhưng TRƯỚC khi
  T0 chạy O8 (21:13:23Z); T0 kiểm cờ xong mới acquire lock. Mode replay-đầy-đủ, poll=0,
  dpkg 1545 (KHÁC #94: repair-sớm-quyết-h, poll=1, dpkg 795; GIỐNG #92: replay-đầy-đủ,
  poll=0, dpkg 1545). Root filesystem CÒN NGUYÊN sau #95 (dpkg 1545, đóng băng từ 19:15:05Z
  — khớp T8-179 ghi libs 6/6, GST 269, dpkg 1.265; chỉ /tmp bị wipe) — khác #92/#93/#94
  đều về libs 1/6 + dpkg 2 sau reboot; replay-đầy-đủ đạt ngay vì dpkg đã đóng băng từ
  19:15:05Z. T0 chỉ ghi mode + số liệu, KHÔNG phán verdict về cờ (thuộc T5-180 + parent 180).
- **F-180-T0-2 — F-179-T9-2: đồng hồ cell nhanh ~26 s trước reboot #95 — XÁC NHẬN (có hạn chế).**
  Bằng chứng: (a) ba dấu thời gian độc lập trước reboot đều đọc sau btime — sampler cuối #94
  19:10:45Z (+23 s, boot ae2a9a47, dòng 88 ram-sampler-FROZEN.log), diag T8 lần 1 heartbeat
  cuối 19:10:48.806Z (+26,806 s, E4 elapsed=55s, cadence đúng 5,000 s, 11 dòng E4 + 6 dòng W2),
  SIGTERM sleep T7 ~19:10:48Z (+26 s, F-179-T7-1) — cả ba là hoạt động cuối cùng của tiến trình
  bị reboot giết, không thể xảy ra sau btime; (b) boot mới đúng giờ: boot_est − btime = +0,99 s
  (×3 + kiểm lại 21:12:31Z +0,990 s), CF ×4 +0,175…+1,185 s, /proc/1 mtime +12,106 s, journal
  first +12 s — btime 19:10:22Z ĐÚNG trong ~2 s, nên ba dấu trên phải đọc bằng đồng hồ cũ
  nhanh ~26 s; (c) requeue #95 +38,743 s khớp họ phục hồi daemon 35–39 s (#90 +35,313 s,
  #93 +36,248 s) — btime đúng. Hệ quả: gap sampler THẬT ≈ 136 s (mẫu cuối thật ~19:10:19Z
  với δ≈26 s → mẫu đầu #95 19:12:35Z), không phải 110 s danh nghĩa T9 ghi — đính chính.
  HẠN CHẾ (ghi rõ, chưa giải quyết được): sampler 60 s KHÔNG cho thấy bước nhảy +26 s
  (mọi gap 60/61 s, giây :43→:45 chỉ +2 s trong 87 khoảng) — mâu thuẫn bề mặt với kết luận
  trên; muốn khớp cả hai cần hoặc monotonic của VM chạy nhanh ~0,5% (sleep 60 ≈ 59,7 s thật)
  hoặc cơ chế khác — CHƯA kiểm chứng được từ dữ liệu hiện có (không có timedatectl/chrony
  trong cell: no systemd bus, chronyc không có). T0 KHÔNG đổi btime; mọi số đếm dùng btime
  19:10:22Z theo quy ước đứng. Giao T2-180/T10-180 ghi nhận hạn chế này.
- **F-180-T0-3 — Run 179 TIMEOUT (margin −28 s; claimed→finished 7 s) — chuỗi succeeded run
  đợt ĐỨT lần 2 liên tiếp (178: −38 s; 179: −28 s).** Run 179 finished 20:36:19Z TIMEOUT
  (sau hạn 28 s; 5 event; 1 lần viết lại tại #95). Run 180 started 20:36:19Z — trễ 28 s
  so với sched, đúng bằng run 179 finished (cùng mẫu tick 14:35:51Z trễ 38 s ở đợt 178);
  chuỗi jitter 0 s run đợt (175–179) ĐỨT tại run 180. T0 chỉ ghi số DB đọc tươi +
  thời điểm đọc, KHÔNG suy đoán cơ chế chờ slot. Kết cục run 179 + run 180 thuộc T7-180.
- **F-180-T0-4 — #94 xác minh gián tiếp (hạn chế phương pháp, cùng mẫu F-179-T0-2).**
  Journal/wtmp/utmp hiện tại chỉ còn #95 (journal --list-boots 1 boot) — T0-180 KHÔNG đọc
  lại trực tiếp 9 nguồn địa phương của #94. #94 đứng trên bản ghi 9 nguồn của T0-179
  (trong phiên, btime 1795454229; uptime bracket ×3; /proc/1 +11,18 s; journal first +11,818 s;
  CF ×4; DB run 179 boot_gen 32a2a7ed) + xác nhận độc lập T4-179. Số hiệu #94 đã được parent
  179 CHẤP NHẬN (§12.3(e)) — T0 chỉ ghi rõ hạn chế này.
- **F-180-T0-5 — O8 bắt đầu khi GATE_OPEN=0 (PB=1), lock giữ cửa đóng suốt O8 — 0 attempt
  chồng (cùng cơ chế F-179-T0-5).** Lúc O8 acquire lock (21:13:23Z): T4 poll #7–#12
  (21:09:11–21:12:56Z) gate0=T5 + postboot_exit=0 nhưng RAM 441–611 MB (< 1024 MB) → cửa
  chưa mở; T4 chưa vào attempt. Lock t0-round180 là blocker trong poll #15–#16 (lock=co,
  blockers 1) → cửa KHÔNG mở suốt O8; poll #17 (21:16:44Z, 42 s sau khi O8 nhả lock)
  lock=không, postboot_exit=0, RAM 1490 MB → T4 vào attempt SAU O8.
  T0 KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (T4 chưa vào attempt
  suốt O8; quy tắc đứng sau vi phạm F-175-T4-2/F-178-T2-8 được tuân thủ — chuỗi 0 vi phạm
  tính lại từ 1 ở đợt 179, tiếp tục ở đợt 180). Load1 trong cửa sổ O8 theo poll log T4:
  3,04–3,56 (poll #15–#16) — thuộc T9-180 quy B2, T0 chỉ ghi nhận.
- **F-180-T0-6 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #95 thuộc T5-180
  (T0 chỉ đọc trạng thái + mốc thời gian + mode); (m) #95 + INSIDE #94/#95 phân loại cuối
  thuộc T2-180 + parent; kết cục run 179 (TIMEOUT) + run 180 (T7-180); lượt yên #49
  (T4-180, attempt bắt đầu sau khi O8 nhả lock); harness + O8 bộ thứ hai (T8-180,
  driver hb128 mới theo quyết (j) đợt 179 — O8 của T0 vẫn dùng script 87o8 gốc, không đổi);
  #95 có giết holder không + prune lần 55 (T6-180); headroom + ENOSPC + balloon + E-205
  kết cục (T9-180).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #95 phân loại cuối (T2-180 + parent); INSIDE #94 (FULL140) + INSIDE #95 (FULL141)
  (T2-180); kết cục run 179 (TIMEOUT) + run 180 (T7-180); HB 20:50:50Z + DR 21:00Z
  (T7-180); POSTBOOT_PASS #95 chi tiết + mode replay-đầy-đủ (T5-180); lượt yên #49
  (T4-180, attempt bắt đầu sau khi O8 nhả lock 21:16:02Z); harness + O8 bộ thứ hai
  (T8-180, hb128 làm driver chuẩn từ đợt 180); #95 có giết holder không + prune lần 55
  (T6-180); headroom + ENOSPC + balloon + E-205 (T9-180).
- Không kiểm lại dải FULL125–FULL141; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của replay #95; không kiểm lại nguyên nhân clock nhanh ~26 s (xem F-180-T0-2) hay
  trigger daemon restart; không chạy `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6
  — T0 đợt này chỉ đọc file trực tiếp theo đường dẫn đã biết).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round180-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round180-t0/appendix180.py` + `appendix180.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round180-t0/boot-survey-180t0.txt`
  (output thô 9 nguồn)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round180-t0/o8-driver-180t0.sh` +
  `o8-180t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-s1-probe-180t0.mjs`
  (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
