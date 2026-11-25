# PHASE9_ROUND178_T0_BOOT_O8_LIMITS.md

Đợt 178 — T0 (boot survey + xác minh reboot mới + O8). Mở ~11:37Z, đóng ~12:01Z 23/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #92 — XÁC NHẬN 9 nguồn**: boot_id `985bc2a3-f5b0-451f-af26-fac9d89a5419`
  (khác #91 `8c0ec92d`); btime **11:01:27Z** (epoch 1795431687; uptime bracket ×3 khớp cùng giây,
  boot_est 1795431687.396/.395/.394 = btime +0,396 s; /proc/1 start_ticks 1687 = btime +16,87 s,
  stat mtime 11:01:44.266Z = btime +17,266 s; journal idx 0 duy nhất, first 11:01:44.958Z =
  btime +17,958 s; wtmp begins 11:01:44Z; last reboot 11:01 still running; Cloudflare ×4
  (CF nhanh hơn local ~0,4–1,5 s sau trừ latency — cùng chiều các đợt trước); DB: run 178 boot_gen MỚI
  dcf769fa, sched = started 11:35:51Z trên #92; requeue eid 10396 = btime92 +459,816 s;
  marker mtime không đổi). T4-178 preflight xác nhận độc lập boot + btime + gap.
  Đối chiếu T7-177 (xác minh 9 nguồn kiểu T0, phát hiện 09:08:37Z = btime +57 s) + T4-177
  (xác nhận độc lập btime + gap) cho #91: KHỚP T0-178 từng số qua đối chiếu DB (xem dưới).
- Gap #91→#92 = **6.827 s (1h53m47s) — TRỞ LẠI mẫu ~2 giờ** (gap #90→#91 = 7.031 s).
  #92 xảy ra SAU khi T10-177 đóng sổ (~11:0xZ) và TRƯỚC khi đợt 178 mở (11:35:51Z).
- **#91 XÁC NHẬN** (nợ đợt 177 đã trả — chuỗi bằng chứng: T7-177 xác minh 9 nguồn trong phiên
  + T4-177 xác nhận độc lập + T0-178 đối chiếu DB: run 177 boot_gen đổi 3af1984b → c29591c7
  (#91) → c92a2dd5 (#92); requeue #91 eid 10369 = btime91 +50,157 s, KHỚP T7-177.
  Hạn chế: journal/wtmp hiện chỉ còn #92 — T0-178 không đọc lại trực tiếp 9 nguồn địa
  phương của #91; xem F-178-T0-2).
- **Marker sống qua 44 reboot (#49–#92)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (42 qua #90 + #91 + #92).
- **Run 177 SUCCEEDED (DB đọc tươi ~11:39Z — kết cục thuộc T7-178)**: finished 11:09:57Z,
  status `succeeded`, timed_out false, attempt 1, boot_gen c92a2dd5 (#92); wall sched→finished
  9.246 s (hạn ngân sách 11:35:51Z — finished TRƯỚC hạn 1.554 s); succeeded event eid 10399
  11:09:57.057Z; đúng 8 event, đúng **2 lần viết lại (#91 + #92)** — run đầu tiên bị viết lại
  2 lần trong 2 reboot liên tiếp, không timeout.
  **Claimed_at DB hiện tại 11:09:50Z — KHÁC T7-177 ghi 08:35:51Z** (không đổi qua 10 lần đọc
  tới ~11:01Z) → claimed→finished = **7 s < 60 s** (xem F-178-T0-3 — cùng mẫu run 176;
  phân loại cuối thuộc T7-178 + parent 178).
  Run 178 1949f57a: sched = started 11:35:51Z — **jitter 0 s** (chuỗi jitter 0 s tiếp tục từ
  run 175/176/177); claimed 11:35:51Z, boot_gen dcf769fa (#92) — RUNNING lúc T0 đọc.
- **(m) #92 — KHÔNG CÓ ĐIỂM (đếm cuối cửa hẹp + cửa rộng; phân loại cuối thuộc T2-178 + parent 178)**:
  requeue eid 10396 `requeued_after_restart` **btime92 +459,816 s**, NGOÀI band [33; 49,8],
  vượt biên TRÊN 410,016 s; run 177 SỐNG tại btime92; **0 requeue cửa hẹp** [11:02:00Z,
  11:02:16,8Z] (đã khép hẳn lúc T0 đọc) và 1 requeue duy nhất cửa rộng [11:01:27Z, 11:16:27Z]
  (truy vấn mọi job). Requeue MUỘN BẤT THƯỜNG (+459,8 s so với +35,3 s / +50,2 s các reboot
  trước — xem F-178-T0-4). **(m) #91 đối chiếu lại: +50,157 s**, NGOÀI dải, vượt biên TRÊN
  0,357 s — KHỚP T7-177 (ÂM ỨNG VIÊN, sơ bộ); caveat phân số: DƯƠNG ⟺ boot_est91−btime91
  ≥ 0,357 s — T7-177 không ghi boot_est91; T0-178 KHÔNG suy ra từ boot_est của boot khác.
- **O8 trên boot #92 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (11:55:45–11:59:08Z):**
  WebKit attempt1 pid136668 exit=0, **21/21 PASS** (S1 PASS 11:56:06.020Z, Playwright mouse click
  lần 2), JSON 21 results, 21 ok=true, md5 `cd482875…`, bản stamped theo lượt khớp md5.
  WebKit attempt2 pid137403 exit=0, **21/21 PASS** (S1 PASS 11:57:15.606Z), JSON 21 results,
  21 ok=true, md5 `eb1cedf8…`, bản stamped theo lượt khớp md5.
  Chromium pid138112 exit=0, **21/21 PASS** (S1 PASS 11:58:36.536Z, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `2a8721a1…`, bản stamped theo lượt khớp md5.
  Đếm lại từ JSON gốc bằng python. **Cả ba bộ đều chạy SAU POSTBOOT_PASS #92 (11:53:41Z)**
  — O8 bắt đầu 124 s sau cờ (cùng mẫu #86/#89/#90).
- **POSTBOOT_PASS #92 ĐÃ CÓ 11:53:41Z** (T5-178, mode **replay-đầy-đủ, poll=0**, dpkg 1545
  dòng, cache 178, lists 37, GST 269 — KHÁC #90 repair-sớm-quyet-h, poll=1; GIỐNG #89
  replay-đầy-đủ, không caveat repair; xem F-178-T0-1). Chi tiết thuộc T5-178.
- **0 attempt chồng:** T4 poll #23–#27 trong cửa sổ O8 đều ghi lock=co thread=t0-round178 +
  blockers 1 → cửa yên KHÔNG mở; poll #28 (11:59:52Z, 44 s SAU khi O8 nhả lock) lock=không
  nhưng load1 5,35 → cửa VẪN chưa mở lúc T0 đóng (không có dòng "CUA YEN MO" tới 12:00Z;
  xem F-178-T0-5). O8 chỉ chồng pha poll của T4, 0 attempt.
- X11: /tmp/.X11-unix trống lúc O8 đóng — display O8 (:188/:197) đã dọn sạch, 0 process sót
  của T0 (kiểm lại 12:00:50Z; xem F-178-T0-6).
  Boot lúc T0 đóng vẫn 985bc2a3 (kiểm cuối 12:01:13Z). Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-178-T0-*)

- **F-178-T0-1 — POSTBOOT_PASS #92 CHƯA CÓ lúc T0 mở (~11:38Z) — O8 CHỜ cờ (mẫu #86/#89/#90).**
  Lúc T0 mở: round178-t5 CHƯA CÓ thư mục; T5-178 chưa bắt đầu; watcher-177 pid 114543
  (hạn 11:30:00Z) CHẾT theo #92. T5-178 bắt đầu 11:43:08Z (replay-watch-178 pid 92180,
  early_repair_at boot+900s); replay chạy 11:50:40–11:53:11Z (dpkg 2 → 1545 dòng, GST 269,
  cache 178, lists 37); cờ về 11:53:41Z (mode replay-đầy-đủ, poll=0, verify độc lập exit 0).
  T0 chờ ~15 phút (11:38Z–11:53Z) rồi mới chạy O8 — không chạy O8 trước cờ. Mode replay-đầy-đủ
  (không phải repair) + dpkg 1545 (bằng #89: 1545) có ảnh hưởng gì tới gate (a) hay không —
  thuộc T5-178 + parent 178; T0 chỉ ghi mode + số liệu, KHÔNG phán verdict về cờ.
- **F-178-T0-2 — #91 xác minh gián tiếp (hạn chế phương pháp).** Journal/wtmp/utmp hiện tại chỉ
  còn #92 (journal --list-boots 1 boot) — T0-178 KHÔNG đọc lại trực tiếp 9 nguồn địa phương
  của #91. Xác minh #91 dựa trên: (a) bản ghi 9 nguồn của T7-177 (trong phiên, phát hiện
  btime +57 s; kiểm lại 09:22Z + 11:01Z — cả 3 lần đều 8c0ec92d, btime 1795424860; /proc/1
  mtime 09:07:56.022Z = btime +16,022 s; journal first 09:07:56Z; wtmp begins 09:07:56Z;
  last reboot 09:07 still running; who -b 09:07; CF ~1 s); (b) T4-177 xác nhận độc lập
  btime + gap 7.031 s; (c) T0-178 đối chiếu DB đọc tươi: boot_gen đổi đúng 2 lần theo đúng
  thứ tự #90 → #91 → #92, requeue #91 +50,157 s khớp T7-177 từng ms. Ba nguồn độc lập đồng
  thuận — T0 kết luận số hiệu #91 XÁC NHẬN (nợ đợt 177 đã trả), nhưng ghi rõ hạn chế này
  để parent 178 biết #91 không được T0 xác minh trực tiếp 9 nguồn địa phương như #90/#92.
- **F-178-T0-3 — claimed_at run 177 DB hiện tại khác ghi nhận của T7-177.** DB đọc tươi lúc
  ~11:39Z: worker_claimed_at_utc = 1795432190 (11:09:50Z) → claimed→finished 7 s.
  T7-177 ghi claimed_at = 1795422951 (08:35:51Z, KHÔNG đổi qua 10 lần đọc tới ~11:01Z).
  Có thể claimed_at được cập nhật khi worker claim pha cuối / khi finish
  (11:01Z–11:09:57Z); T0 chỉ ghi giá trị đọc tươi + thời điểm đọc, KHÔNG suy đoán cơ chế.
  Giao T7-178 đối chiếu. Hệ quả nếu 7 s là số đúng: run 177 KHÔNG phải ca claimed→finished
  ≥60 s (số ca GIỮ 9 — cùng mẫu run 176: 8 s). T0 không phán số thứ tự ca. Cùng mẫu run
  171/172/173/174/175/176 (claimed đổi lúc cuối).
- **F-178-T0-4 — Requeue #92 muộn bất thường +459,816 s (lệch khỏi mẫu mọi reboot trước).**
  Các reboot trước: requeue tới trong +35,313 s (#90) / +50,157 s (#91) sau btime — đều
  trong/vừa ngoài band (m). #92: requeue duy nhất eid 10396 tới 11:09:06.816Z = btime92
  +459,816 s (7m40s sau btime), dù run 177 SỐNG tại btime92 (dispatch 08:35:51Z, finish
  11:09:57Z). Hệ quả: (m) #92 KHÔNG CÓ ĐIỂM từ run 177 (0 requeue cửa hẹp); run 177 là run
  đầu tiên bị viết lại 2 lần trong 2 reboot liên tiếp (#91 + #92). T0 chỉ ghi số thô + thời
  điểm đọc, KHÔNG suy đoán cơ chế chậm (scheduler/runtime hồi phục sau reboot hay worker
  kẹt). Phân loại cuối thuộc T2-178 + parent 178.
- **F-178-T0-5 — O8 bắt đầu khi GATE_OPEN=0 (PB=1), lock giữ cửa đóng suốt O8 — 0 attempt
  chồng (cùng cơ chế F-177-T0-5).** Lúc O8 acquire lock (11:55:45Z): T4 poll #22
  (11:55:17Z) gate0=T5 + postboot_exit=0 nhưng RAM 804 MB (< 1024 MB) + load1 3,34 → cửa
  chưa mở; T4 chưa vào attempt. Lock t0-round178 là blocker trong poll #23–#27 (lock=co,
  blockers 1) → cửa KHÔNG mở suốt O8; poll #28 (11:59:52Z, 44 s sau khi O8 nhả lock)
  lock=không, postboot_exit=0, RAM 1736 MB nhưng load1 5,35 → cửa VẪN chưa mở (không có
  dòng "CUA YEN MO" tới lúc T0 đóng 12:00Z). T0 KHÔNG chạy script nặng / KHÔNG probe dpkg
  trong cửa sổ attempt (T4 chưa vào attempt suốt O8; quy tắc đứng sau vi phạm F-174-T2-5/
  F-175-T4-2 được tuân thủ). Load1 trong cửa sổ O8 theo poll log T4: 3,13–9,21 (poll #21–#27)
  — thuộc T9-178 quy B2, T0 chỉ ghi nhận.
- **F-178-T0-6 — Kiểm X11 lúc đóng: 1 match thoáng qua, kiểm lại sạch.** Lúc 12:00:31Z:
  `ps | grep Xvfb` đếm 1 — là FALSE POSITIVE (dòng lệnh launcher của T4, pid 16567, chứa
  chữ "0 Xvfb" trong echo preflight); `ps | grep clicktest` đếm 1 — process thoáng qua
  đang tắt. Kiểm lại 12:00:50Z: 0 Xvfb, 0 process O8/clicktest sót, /tmp/.X11-unix trống,
  không còn file /tmp/.X*-lock — display O8 (:188/:197) đã dọn sạch. T0 ghi cả hai lần kiểm
  để không giấu match đầu.
- **F-178-T0-7 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #92 thuộc T5-178
  (T0 chỉ đọc trạng thái + mốc thời gian + mode); (m) #91/#92 + INSIDE #91/#92 phân loại cuối
  thuộc T2-178 + parent; kết cục run 177 thuộc T7-178; lượt yên #47 (T4-178, chưa mở cửa lúc
  T0 đóng); harness + O8 bộ thứ hai (T8-178); #92 có giết holder không + prune lần 53 (T6-178);
  headroom + ENOSPC + balloon (T9-178).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #91/#92 phân loại cuối (T2-178 + parent); INSIDE #91 (FULL137?) + INSIDE #92 (T2-178);
  kết cục run 177 (T7-178; F-178-T0-3 claimed_at); DR 12:00Z + HB 11:20:50Z kết luận cuối
  (T7-178); POSTBOOT_PASS #92 chi tiết + mode replay-đầy-đủ (T5-178); lượt yên #47 (T4-178,
  chưa mở cửa lúc T0 đóng); harness + O8 bộ thứ hai (T8-178); #92 có giết holder không +
  prune lần 53 (T6-178); headroom + ENOSPC + balloon + E-199 (T9-178).
- Không kiểm lại dải FULL125–FULL137; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của replay #92; không kiểm lại nguyên nhân requeue #92 muộn +459,8 s (xem F-178-T0-4) hay
  nguyên nhân gap 6.827 s (đã trở lại mẫu ~2 giờ, không bất thường).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round178-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round178-t0/appendix178.py` + `appendix178.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round178-t0/boot-survey-178t0.txt`
  (output thô 9 nguồn)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round178-t0/o8-driver-178t0.sh` +
  `o8-178t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-s1-probe-178t0.mjs`
  (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
