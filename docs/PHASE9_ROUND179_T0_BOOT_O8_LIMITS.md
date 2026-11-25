# PHASE9_ROUND179_T0_BOOT_O8_LIMITS.md

Đợt 179 — T0 (boot survey + xác minh reboot mới + O8). Mở ~17:41Z, đóng ~18:13Z 23/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #94 — XÁC NHẬN 9 nguồn**: boot_id `ae2a9a47-2de7-48ef-853d-0023b47bdc0b`
  (khác #93 `97054ac6`); btime **17:17:09Z** (epoch 1795454229; uptime bracket ×3 khớp cùng giây,
  boot_est 1795454229.192/.198/.193 = btime +0,192 s; /proc/1 start_ticks 1118 = btime +11,18 s,
  stat mtime 17:17:20.378Z = btime +11,378 s; journal idx 0 duy nhất, first 17:17:20.818Z =
  btime +11,818 s; wtmp begins 17:17:20Z; last reboot 17:17 still running; Cloudflare ×4
  (CF nhanh hơn local ~0,6–1,1 s — cùng chiều các đợt trước); DB: run 179 boot_gen MỚI
  32a2a7ed, sched = started 17:35:51Z trên #94; requeue #94 = 0 (xem dưới);
  marker mtime không đổi). T4-179 preflight + poll #2–#6 xác nhận độc lập boot + btime.
  Đối chiếu T7-178 (xác minh 9 nguồn trong 64 s, phát hiện 13:08:39Z = btime +64 s) + T4-178
  (xác nhận độc lập btime + gap) cho #93: KHỚP T0-179 từng số qua đối chiếu DB (xem dưới).
- Gap #93→#94 = **14.974 s (4h09m34s) — DÀI GẤP ĐÔI mẫu ~2 giờ** (gap #92→#93 = 7.568 s;
  gap #91→#92 = 6.827 s). #94 xảy ra TRƯỚC khi đợt 179 mở (17:35:51Z); parent phát hiện
  lúc 17:36:42Z (uptime 19 phút → btime ~17:17Z) — KHỚP T0-179.
- **#93 XÁC NHẬN** (nợ đợt 178 đã trả — chuỗi bằng chứng: T7-178 xác minh 9 nguồn trong phiên
  + T4-178 xác nhận độc lập + T0-179 đối chiếu DB: run 178 boot_gen đổi dcf769fa → 92e3cfb8
  (#93); requeue #93 eid 10428 = btime93 +36,248 s, KHỚP T7-178. Hạn chế: journal/wtmp hiện
  chỉ còn #94 — T0-179 không đọc lại trực tiếp 9 nguồn địa phương của #93; xem F-179-T0-2).
- **Marker sống qua 46 reboot (#49–#94)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (44 qua #92 + #93 + #94).
- **Run 178 TIMEOUT (DB đọc tươi ~17:44Z — kết cục thuộc T7-179)**: finished 14:36:29Z,
  status `timeout`, timed_out true, attempt 1, boot_gen 92e3cfb8 (#93); SAU hạn ngân sách
  14:35:51Z 38 s; timeout event eid 10447 14:36:29.756Z ("Ran out of its 10800s time
  budget"); claimed 14:36:22Z → claimed→finished **7 s** (cùng mẫu run 177); đúng 5 event,
  đúng **1 lần viết lại (#93)**. Run 17c51ba6 (tick 14:35:51Z — worker đóng sổ đợt 178):
  started 14:36:29Z (**trễ 38 s so với sched — đúng bằng run 178 finished**), finished
  14:53:32Z **SUCCEEDED**, claimed→finished 8 s, boot_gen 92e3cfb8 (#93).
  Run 179 f253dced: sched = started 17:35:51Z — **jitter 0 s** (chuỗi jitter 0 s tiếp tục từ
  run 175/176/177/178); claimed 17:35:51Z, boot_gen 32a2a7ed (#94) — RUNNING lúc T0 đọc.
- **(m) #93 — KHỚP T7-178 (phân loại cuối thuộc T2-179 + parent 179)**: requeue eid 10428
  `requeued_after_restart` **btime93 +36,248 s**, TRONG band [33; 49,8], cách biên dưới
  3,248 s, cách biên trên 13,552 s; 1 requeue duy nhất cửa rộng [13:07:35Z, 13:22:35Z]
  (truy vấn mọi job); 1 requeue cửa hẹp (đã khép hẳn lúc T0 đọc).
- **(m) #94 — KHÔNG CÓ ĐIỂM (đếm cuối cửa hẹp + cửa rộng; phân loại cuối thuộc T2-179 +
  parent 179)**: **0 requeue cửa rộng** [17:17:09Z, 17:32:09Z] (truy vấn mọi job) và
  **0 requeue cửa hẹp** [17:17:42Z, 17:17:58,8Z] — không có run nào sống qua #94
  (run 17c51ba6 finished 14:53:32Z, trước btime94 8.617 s; run 179 dispatch 17:35:51Z,
  sau btime94 1.122 s).
- **F-178-T7-4 — LÀM RÕ**: worker_boot_generation theo **daemon start** (requeue detail:
  "daemon startup recovery"), KHÔNG phải OS boot — đổi ở mỗi daemon start. Run 177:
  c92a2dd5 (reattach 11:09:06Z, #92); run 178: dcf769fa (dispatch 11:35:51Z, #92) →
  92e3cfb8 (reattach 13:08:11Z, #93); run 17c51ba6: 92e3cfb8 (CÙNG daemon gen với run 178
  sau #93 — không có daemon restart giữa 13:08:11Z và 14:53:24Z); run 179: 32a2a7ed
  (MỚI sau #94). Daemon restart 1 lần thêm trên #92 giữa 11:09:06Z và 11:35:51Z; trigger
  không xác định được từ dữ liệu hiện có (host-side, 0 scheduler event đánh dấu);
  số hiệu boot OS #92 không ảnh hưởng. Chi tiết xem appendix179 §H.
- **O8 trên boot #94 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (18:06:38–18:09:23Z):**
  WebKit attempt1 pid68401 exit=0, **21/21 PASS** (S1 PASS 18:06:55.567Z, Playwright mouse
  click lần 2), JSON 21 results, 21 ok=true, md5 `11a6f1bf…`, bản stamped theo lượt khớp md5.
  WebKit attempt2 pid68924 exit=0, **21/21 PASS** (S1 PASS 18:07:49.283Z), JSON 21 results,
  21 ok=true, md5 `b32e23b8…`, bản stamped theo lượt khớp md5.
  Chromium pid69388 exit=0, **21/21 PASS** (S1 PASS 18:08:53.061Z, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `d58b9a3c…`, bản stamped theo lượt khớp md5.
  Đếm lại từ JSON gốc bằng python. **Cả ba bộ đều chạy SAU POSTBOOT_PASS #94 (18:03:08Z)**
  — O8 bắt đầu 210 s sau cờ (cùng mẫu #86/#89/#90/#92).
- **POSTBOOT_PASS #94 ĐÃ CÓ 18:03:08Z** (T5-179, mode **repair-sớm-quyết-h, poll=1**,
  dpkg 795 dòng, cache 110, lists 37→66, GST 269 — KHÁC #92 replay-đầy-đủ, poll=0,
  dpkg 1545; GIỐNG #90 repair-sớm-quyết-h, poll=1; xem F-179-T0-1). Chi tiết thuộc T5-179.
- **0 attempt chồng:** T4 poll #31–#33 trong cửa sổ O8 đều ghi lock=co thread=t0-round179 +
  blockers → cửa yên KHÔNG mở; poll #34 (18:09:31Z, 8 s SAU khi O8 nhả lock) "CUA YEN MO"
  (RAM=1535MB) → T4 chạy attempt1 NGAY sau O8 — bàn giao sạch, 0 chồng (xem F-179-T0-5).
  O8 chỉ chồng pha poll của T4, 0 attempt.
- X11: display O8 (:188/:197) đã dọn sạch, 0 process sót của T0 (kiểm 18:11:59Z; còn socket
  X193 tạo 18:09:35Z trong lúc T4 attempt1 setup — thuộc T4, xem F-179-T0-6).
  Boot lúc T0 đóng vẫn ae2a9a47 (kiểm cuối 18:12:40Z). Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-179-T0-*)

- **F-179-T0-1 — POSTBOOT_PASS #94 CHƯA CÓ lúc T0 mở (~17:42Z) — O8 CHỜ cờ (mẫu #86/#89/#90/#92).**
  Lúc T0 mở: round179-t5 CHƯA CÓ thư mục; T5-179 bắt đầu ~17:46Z (check-only: CHƯA ĐỦ —
  libs thiếu 5, GST FAIL, apt thiếu 11 gói, giống lúc mở đợt 178); replay-watch-179 pid 61023
  bắt đầu 17:49:58Z (early-repair trigger, boot_age 1.969 s, frozen 856 s, dpkg 2 dòng);
  `apt-get update` chạy 17:49Z (~15 phút); cờ về 18:03:08Z (mode repair-sớm-quyết-h, poll=1,
  dpkg 795, cache 110, lists 66, GST 269; verify độc lập exit 0 — libs đủ 5, GST đủ
  isomp4+libav, apt đủ 11 gói). T0 chờ ~21 phút (17:42Z–18:03Z) rồi mới chạy O8 — không chạy
  O8 trước cờ. Mode repair-sớm-quyết-h (không phải replay-đầy-đủ) + dpkg 795 (khác #92:
  1545; khác #90: chưa đối chiếu) có ảnh hưởng gì tới gate (a) hay không — thuộc T5-179 +
  parent 179; T0 chỉ ghi mode + số liệu, KHÔNG phán verdict về cờ.
- **F-179-T0-2 — #93 xác minh gián tiếp (hạn chế phương pháp, cùng mẫu F-178-T0-2).**
  Journal/wtmp/utmp hiện tại chỉ còn #94 (journal --list-boots 1 boot) — T0-179 KHÔNG đọc
  lại trực tiếp 9 nguồn địa phương của #93. Xác minh #93 dựa trên: (a) bản ghi 9 nguồn của
  T7-178 (trong phiên, phát hiện 13:08:39Z = btime +64 s; kiểm lại — boot 97054ac6, btime
  1795439255; /proc/1 mtime +16 s; journal first +16 s; wtmp begins +16 s; last reboot 13:07
  still running; who -b 13:07; CF ~1 s); (b) T4-178 xác nhận độc lập btime + gap 7.568 s;
  (c) T0-179 đối chiếu DB đọc tươi: boot_gen đổi đúng 1 lần dcf769fa → 92e3cfb8 theo đúng
  thứ tự #92 → #93, requeue #93 +36,248 s khớp T7-178 từng ms. Ba nguồn độc lập đồng
  thuận — T0 kết luận số hiệu #93 XÁC NHẬN (nợ đợt 178 đã trả), nhưng ghi rõ hạn chế này
  để parent 179 biết #93 không được T0 xác minh trực tiếp 9 nguồn địa phương như #92/#94.
- **F-179-T0-3 — Run 178 TIMEOUT nhưng công việc đóng sổ đợt 178 vẫn hoàn thành (qua tick sau).**
  Run 178 finished 14:36:29Z TIMEOUT (sau hạn 38 s; 5 event; 1 lần viết lại tại #93).
  Tick 14:35:51Z (run 17c51ba6) started 14:36:29Z — trễ 38 s so với sched, đúng bằng run 178
  finished — rồi finished 14:53:32Z SUCCEEDED; worker của tick này đã spawn T10-178 đóng
  aggregate ~14:48Z (theo ghi chú nguồn gốc §12.3 đợt 178). T0 chỉ ghi số DB đọc tươi +
  thời điểm đọc, KHÔNG suy đoán cơ chế chờ slot. Kết cục run 178 + run 17c51ba6 thuộc
  T7-179 phán cuối.
- **F-179-T0-4 — Gap #93→#94 dài gấp đôi mẫu (14.974 s = 4h09m34s).** Các gap trước:
  6.827 s (#91→#92) / 7.568 s (#92→#93) — đều ~2 giờ. #94 cách #93 gần 4h10m: khoảng
  trống 14:35:51Z–17:35:51Z không có tick vcut-build-loop nào chạy build (tick 14:35:51Z
  chỉ đóng sổ đợt 178, finished 14:53:32Z; không có run nào sống qua #94 nên (m) #94 =
  0 requeue). T0 chỉ ghi số thô, KHÔNG suy đoán nguyên nhân gap dài (host-side hay lịch
  cron). Phân loại cuối về (m) #94 thuộc T2-179 + parent 179.
- **F-179-T0-5 — O8 bắt đầu khi GATE_OPEN=0 (PB=1), lock giữ cửa đóng suốt O8 — 0 attempt
  chồng (cùng cơ chế F-178-T0-5).** Lúc O8 acquire lock (18:06:38Z): T4 poll #30
  (18:06:30Z) gate0=T5 + postboot_exit=0 nhưng RAM 469 MB (< 1024 MB) → cửa chưa mở;
  T4 chưa vào attempt. Lock t0-round179 là blocker trong poll #31–#33 (lock=co,
  blockers 5→1) → cửa KHÔNG mở suốt O8; poll #34 (18:09:31Z, 8 s sau khi O8 nhả lock)
  lock=không, postboot_exit=0, RAM 1535 MB → "CUA YEN MO", T4 chạy attempt1 NGAY.
  T0 KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (T4 chưa vào attempt
  suốt O8; quy tắc đứng sau vi phạm F-175-T4-2/F-178-T2-8 được tuân thủ — chuỗi 0 vi phạm
  đếm lại từ 0 ở đợt 179). Load1 trong cửa sổ O8 theo poll log T4: 1,34–2,13 (poll
  #31–#33) — thuộc T9-179 quy B2, T0 chỉ ghi nhận.
- **F-179-T0-6 — Kiểm X11 lúc đóng: socket X193 KHÔNG thuộc T0.** Lúc 18:11:05Z:
  /tmp/.X11-unix chỉ còn X193 (tạo 18:09:35.584Z — 4 s sau khi T4 attempt1 bắt đầu
  18:09:31Z); /tmp/.X193-lock có mặt; `ps | grep Xvfb` = 0; `fuser` socket = 0 process
  giữ. Display O8 của T0 (:188/:197) đã dọn sạch; 0 process T0 sót (kiểm 18:11:59Z:
  không còn o8-driver-179, vite 5560/5554, :188/:197); vite lock lúc kiểm cuối do t4 giữ
  (pid 70088, attempt1 đang chạy). X193 thuộc phiên T4 attempt1 (setup) — T0 KHÔNG chạm
  vào, giao T4-179/T8-179 đối chiếu nếu attempt cần :193.
- **F-179-T0-7 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #94 thuộc T5-179
  (T0 chỉ đọc trạng thái + mốc thời gian + mode); (m) #93/#94 + INSIDE #93 phân loại cuối
  thuộc T2-179 + parent; kết cục run 178 (TIMEOUT) + run 179 thuộc T7-179; lượt yên #48
  (T4-179, attempt1 bắt đầu 18:09:31Z sau khi O8 nhả lock); harness + O8 bộ thứ hai
  (T8-179); #94 có giết holder không + prune lần 54 (T6-179); headroom + ENOSPC +
  balloon + E-201 kết cục (T9-179).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #93/#94 phân loại cuối (T2-179 + parent); INSIDE #93 (FULL139?) (T2-179);
  kết cục run 178 (TIMEOUT) + run 179 (T7-179); DR 15:00Z + HB 14:20:50Z kết luận cuối
  (T7-179); POSTBOOT_PASS #94 chi tiết + mode repair-sớm-quyết-h (T5-179); lượt yên #48
  (T4-179, attempt1 bắt đầu 18:09:31Z); harness + O8 bộ thứ hai (T8-179); #94 có giết
  holder không + prune lần 54 (T6-179); headroom + ENOSPC + balloon + E-201 (T9-179).
- Không kiểm lại dải FULL125–FULL139; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của replay #94; không kiểm lại nguyên nhân gap 14.974 s (xem F-179-T0-4) hay trigger
  daemon restart thêm trên #92 (xem F-178-T7-4 — host-side, không có event).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round179-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round179-t0/appendix179.py` + `appendix179.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round179-t0/boot-survey-179t0.txt`
  (output thô 9 nguồn)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round179-t0/o8-driver-179t0.sh` +
  `o8-179t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-s1-probe-179t0.mjs`
  (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
