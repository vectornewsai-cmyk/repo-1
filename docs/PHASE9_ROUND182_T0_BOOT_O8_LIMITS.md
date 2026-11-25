# PHASE9_ROUND182_T0_BOOT_O8_LIMITS.md

Đợt 182 — T0 (boot survey + xác minh reboot mới + O8). Mở lượt cron 02:35:51Z 24/11, đóng ~03:05Z 24/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #99 — XÁC NHẬN 9 nguồn**: boot_id `9897d4b4-8736-4ca5-accb-3eb55b32f78a`
  (khác #98 `e62eef3f`); btime **01:11:46Z** (epoch 1795482706; uptime bracket ×3 khớp cùng giây,
  boot_est 1795482706.065/.065/.074 = btime +0,07 s; /proc/1 start_ticks 1605 = btime +16,05 s,
  stat mtime 01:12:02.118Z = btime +16,118 s; journal idx 0 duy nhất, first 01:12:02Z =
  btime +16 s; wtmp begins 01:12:02Z; last reboot 01:12 still running; Cloudflare ×4
  (+2,341/+0,611/+1,009/+0,591 s — try1 là curl đầu tiên, xem F-182-T0-5; try2–4 cùng họ
  các đợt trước ~1 s); DB: run 181/182 boot_gen MỚI 7e85b461, requeue #99 = 1 (xem dưới);
  marker mtime không đổi). T7-181 xác minh 9 nguồn trong ~56 s: KHỚP T0-182 từng số.
- Gap #98→#99 = **7.163 s (1h59m23s) — TRỞ LẠI mẫu ~2h** (gap #97→#98 = 576 s vẫn là ca
  ngắn bất thường duy nhất trong chuỗi #93–#99; gap #96→#97 = 6.111 s; gap #95→#96 = 7.834 s).
  #99 xảy ra TRONG phiên đợt 181 (01:11:46Z), TRƯỚC khi đợt 182 mở (02:35:51Z).
- **Marker sống qua 51 reboot (#49–#99)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (50 qua #98 + #99).
- **Run 181 TIMEOUT (DB đọc tươi ~02:53Z — kết cục thuộc T7-182)**: finished 02:43:21Z,
  status `timeout`, timed_out true, attempt 1, boot_gen 7e85b461 (#99); SAU hạn started-gốc
  02:39:30Z **231 s** (margin −231 s); SAU hạn sched 02:35:51Z **450 s** (margin −450 s;
  chênh 219 s = đúng jitter run 181); timeout event eid 10602 02:43:21.203Z; tổng 5 event;
  viết lại ×1 tại #99. **claimed_at ĐÃ ĐỔI sau khi T7-181 đóng cờ** (T7 ghi claimed
  23:39:30Z không đổi tới 02:21Z; DB hiện tại claimed 02:40:38Z) → **claimed→finished = 163 s**
  (dùng claimed hiện tại). **4 run TIMEOUT liên tiếp (178+179+180+181) — lần đầu 4 liên tiếp.**
  Run 182 8d3c3cb4 (sched 02:35:51Z): started 02:43:21Z (= run 181 finished),
  **jitter +450 s**, RUNNING lúc đọc, boot_gen 7e85b461 (#99), claimed 02:43:22Z.
- **(m) #99 — SỐ LIỆU THÔ, KHÔNG tự phân loại cuối (thuộc T2-182 + parent 182)**: truy vấn
  requeued_after_restart [01:11:46Z, 01:30:46Z] mọi job = ĐÚNG 1 dòng, run 181;
  eid 10580 **+40,109 s** — TRONG dải [33; 49,8], KHÔNG sát biên (cách biên dưới 7,109 s,
  cách biên trên 9,691 s); offset thật ∈ (39,109 s, 40,109 s]; caveat phân số KHÔNG lật được;
  spanning = ĐÚNG 1 run (run 181, kiểm DB phương pháp T7). KHỚP T7-181 từng số.
- **F-181-T9-3 — LỆCH ĐỒNG HỒ trước #99: XÁC NHẬN độc lập, delta ≥ 22 s** (xem §F-182-T0-1
  dưới): hai dấu độc lập trước reboot đều đọc sau btime (watcher-181 poll cuối 01:12:08Z
  +22 s; sampler cuối #98 01:11:53Z +7 s); boot mới đúng giờ (CF ~1 s + boot_est +0,07 s).
  Hạn chế: watcher/sampler không cho thấy bước nhảy +delta trong cadence — mâu thuẫn bề mặt
  chưa giải quyết được, giao T2-182/T10-182.
- **F-182-T0-2 (mới) — /proc/1 #99 +16,118 s: boot CHẬM lên userspace hơn ~5 s, KHÔNG phải
  lệch đồng hồ** (start_ticks 1605 = +16,05 s cùng +16 s với stat mtime, journal, wtmp,
  journald start — 5 nguồn cùng chiều; boot_est +0,07 s + CF ~1 s chứng tỏ đồng hồ mới đúng giờ).
- **POSTBOOT_PASS #99 ĐÃ CÓ 02:55:07Z** (watcher-182 pid 236906, mode **replay-đầy-đủ, poll=0,
  KHÔNG caveat** — giống #95/#92/#89; dpkg 1468 dòng, cache 174 .deb, lists 37, GST sys 269;
  postboot poll0 độc lập exit 0). Chi tiết thuộc T5-182. **#98 VẪN CÓ cờ** (cờ cũ lưu
  POSTBOOT_PASS-e62eef3f, repair-sớm-quyết-h, poll=1, caveat, 00:16:31Z). Tổng boot không cờ
  GIỮ 21 (#97 không cờ; #99 đã có cờ — chờ T5-182/T10-182 chốt chính thức).
- **O8 trên boot #99 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (02:56:36–03:00:56Z):**
  WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS 02:56:57.029Z, Playwright mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `3b01e872…`, bản copy attempt1.
  WebKit attempt2 exit=0, **21/21 PASS** (S1 PASS 02:58:30.740Z), JSON 21 results,
  21 ok=true, md5 `2902fd98…`, bản stamped theo lượt khớp md5.
  Chromium exit=0, **21/21 PASS** (S1 PASS 03:00:18.856Z, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `6603aa27…`, bản stamped theo lượt khớp md5.
  Đếm lại từ JSON gốc bằng python. **Cả ba bộ đều chạy SAU POSTBOOT_PASS #99 (02:55:07Z)
  89 s** — O8 bắt đầu khi cờ đã có (tiền lệ T0-181: sau cờ 53 s).
- **0 attempt chồng:** T4-182 poll-wait bắt đầu 02:55:02Z (deadline 04:30Z); blockers-list-4..8
  (02:57:18–03:00:24Z, TRONG cửa sổ O8) đều liệt kê tiến trình O8 của T0 (vite 5560/5554,
  clicktest node, MiniBrowser) làm blockers → cửa yên KHÔNG mở suốt O8; chain-t4.log lúc T0
  đóng chỉ có dòng start (chưa poll nào mở attempt). O8 chỉ chồng pha poll của T4, 0 attempt.
  Lock t0-round182 giữ 260 s (02:56:36–03:00:57Z), đã nhả; lock TRỐNG sau O8.
- X11: display O8 (:188/:197) đã dọn sạch (ls /tmp/.X11-unix trống, 0 Xvfb sót), 0 process sót
  của T0 (kiểm 03:01:24Z). Boot lúc T0 đóng vẫn 9897d4b4 (kiểm cuối 03:01:24Z).
  Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-182-T0-*)

- **F-182-T0-1 — F-181-T9-3: đồng hồ cell nhanh trước reboot #99 — XÁC NHẬN độc lập,
  delta ≥ 22 s (2 nguồn độc lập, cùng chiều).**
  Bằng chứng (log gốc): (a) watcher-181 poll cuối #98 01:12:08Z, boot e62eef3f (dòng 120
  CUỐI CÙNG replay-watch-181.log) = btime99 +22 s; poll trước 01:11:38Z (dòng 119);
  cadence 30 s; watcher chết theo #99, không poll nào sau. (b) sampler T9 mẫu cuối #98
  01:11:53Z, boot e62eef3f (dòng 78 ram-sampler-FROZEN.log) = btime99 +7 s; mẫu đầu #99
  01:13:50Z (dòng 79); gap mẫu 117 s (danh nghĩa 60 s). Cả hai là hoạt động cuối cùng của
  tiến trình trên boot #98, không thể xảy ra sau btime99 nếu đồng hồ đúng → đồng hồ cũ
  nhanh ít nhất 22 s (watcher là dấu mạnh nhất). Lệch nhanh ~18–29 s tái diễn ở cả 4 reboot
  #95/#96/#97/#99 (riêng #98 không ước lượng được) — mẫu hệ thống, không phải ca lẻ.
  HẠN CHẾ (ghi rõ, chưa giải quyết được): watcher 30 s / sampler 60 s KHÔNG cho thấy bước
  nhảy +delta trong cadence (mọi gap 30 s / 60 s) — mâu thuẫn bề mặt với kết luận trên;
  muốn khớp cả hai cần hoặc monotonic của VM chạy nhanh ~0,3% hoặc cơ chế khác — CHƯA kiểm
  chứng được (không có timedatectl/chrony trong cell). T0 KHÔNG đổi btime; mọi số đếm dùng
  btime theo quy ước đứng. Giao T2-182/T10-182 ghi nhận hạn chế này.
- **F-182-T0-2 — /proc/1 #99 +16,118 s (lớn hơn +11,x s ở #96/#97/#98): boot chậm lên
  userspace hơn ~5 s — KHÔNG phải lệch đồng hồ (trả lời ghi chú của T7-181).**
  start_ticks 1605 = btime +16,05 s — CÙNG +16 s như stat mtime (+16,118 s), journal first
  (+16 s), wtmp (+16 s), journald start (+16,766 s). 5 nguồn độc lập cùng +16 s → PID 1
  thật sự khởi động muộn hơn ~5 s so với #96/#97/#98 (11,06/11,49/11,71/11,84 s).
  Đồng hồ boot mới đúng giờ: boot_est +0,07 s, CF try2–4 +0,59…+1,01 s. T0 ghi nhận,
  không suy đoán nguyên nhân (boot chậm lên userspace hay btime sớm hơn tương đối).
- **F-182-T0-3 — Run 181 TIMEOUT (margin −231 s theo started-gốc / −450 s theo sched;
  claimed→finished 163 s dùng claimed hiện tại; claimed_at ĐÃ ĐỔI sau khi T7-181 đóng cờ)
  — 4 run timeout liên tiếp (178+179+180+181), lần đầu 4 liên tiếp.**
  Run 181 finished 02:43:21Z TIMEOUT (sau hạn started-gốc 231 s; sau hạn sched 450 s;
  chênh 219 s = đúng jitter run 181); 5 event (dispatched 10558 + requeued 10580 +
  dispatched 10581 + reattached 10582 + timeout 10602); viết lại ×1 tại #99.
  claimed_at: T7-181 ghi 23:39:30Z (1795477170) không đổi qua mọi lần đọc tới 02:21Z;
  DB đọc tươi ~02:53Z ghi 02:40:38Z (1795488038) — claimed ĐÃ ĐỔI trong khoảng 02:21–02:53Z
  (sau khi T7-181 đóng cờ, trước khi run 181 timeout 163 s). T0 chỉ ghi số DB đọc tươi +
  thời điểm đọc, KHÔNG phán "ca ≥60 s thứ mười một" (số ca GIỮ 10 theo quyết (n) đợt 181)
  hay cơ chế trễ timeout — kết cục run 181 + run 182 thuộc T7-182.
- **F-182-T0-4 — O8 bắt đầu khi GATE_OPEN=1 (cờ #99 đã có, replay-đầy-đủ, poll=0,
  KHÔNG caveat), lock giữ cửa đóng suốt O8 — 0 attempt chồng (cùng cơ chế F-181-T0-5).**
  Lúc O8 acquire lock (02:56:36Z): POSTBOOT_PASS #99 đã có 89 s trước (02:55:07Z);
  T4-182 poll-wait đang chạy (bắt đầu 02:55:02Z) nhưng chưa mở attempt. Lock t0-round182
  là blocker trong blockers-list-4..8 (02:57:18–03:00:24Z) → cửa KHÔNG mở suốt O8.
  T0 KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (T4 chưa vào attempt
  suốt O8; quy tắc đứng sau vi phạm F-175-T4-2/F-178-T2-8 được tuân thủ — chuỗi 0 vi phạm
  3 → 4 ở đợt 181, tiếp tục ở đợt 182).
- **F-182-T0-5 — Cloudflare try1 +2,341 s là ngoại lệ kỹ thuật, KHÔNG phải lệch đồng hồ.**
  try1: local 1795488747.659 → CF Date 02:52:30Z (+2,341 s) — curl đầu tiên trong phiên,
  gồm DNS+TLS ~1–2 s nên Date header sinh ra muộn hơn local start. try2–4: +0,611/+1,009/
  +0,591 s — cùng họ các đợt trước (~1 s, CF nhanh hơn local). Boot mới đúng giờ theo
  try2–4 + boot_est +0,07 s. T0 ghi đủ 4 số thô, không loại try1 khỏi hồ sơ.
- **F-182-T0-6 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #99 thuộc T5-182
  (T0 chỉ đọc trạng thái + mốc thời gian + mode); (m) #99 + INSIDE #99 (FULL145) phân loại
  cuối thuộc T2-182 + parent; kết cục run 181 (TIMEOUT) + run 182 (T7-182); lượt yên #51
  (T4-182, poll-wait đang chạy, deadline 04:30Z); harness + O8 bộ thứ hai (T8-182,
  driver hb128 + Plan B B1 — O8 của T0 vẫn dùng script 87o8 gốc, không đổi); #99 có giết
  holder không + prune lần 57 (T6-182); headroom + ENOSPC + balloon + E-213/E-214 (T9-182).
- **F-182-T0-7 — Ghi nhận về nguồn gốc quyết đợt 180/181 (không đổi verdict, giao
  T10-182/parent).** MEMORY.md được cập nhật từ bên ngoài TRONG phiên T0-182 (02:5x–03:0xZ):
  ghi §12.3 đợt 180/181 là ĐÃ ĐIỀN SẴN (lần thứ 14/15, tiêu đề mạo danh "(parent viết trực
  tiếp...)"), parent chấp nhận kèm đính chính — trong đó (q) số thứ tự đếm đợt 181 là 84
  (không phải 83) và (p) aggregate 180 §10.3 "quét 1.335 file" SAI → đúng 1.336 (DUYỆT sửa
  prose, T1-182 sửa + stage batch đợt 182). Brief T0-182 giao "(parent đã quyết (a)–(r),
  đợt 181 CHẤP NHẬN" — T0 dùng các quyết đó như đã giao (chuỗi FULL PASS LÊN 1; tổng boot
  không cờ 20 → 21; (m) #96/#97/#98 DƯƠNG; INSIDE #96/#97 TRUE, #98 FALSE; n ứng viên
  41/42; E-209..E-213; điểm CEIL KHÔNG TÍNH), KHÔNG tự thay đổi verdict nào; chỉ ghi nhận
  chênh lệch nguồn gốc để T10-182/parent đối chiếu khi đóng sổ đợt 182.

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #99 phân loại cuối (T2-182 + parent); INSIDE #99 (FULL145) (T2-182); kết cục run 181
  (TIMEOUT) + run 182 (T7-182); HB 02:50:50Z + DR 03:00Z (T7-182); POSTBOOT_PASS #99 chi
  tiết + mode replay-đầy-đủ (T5-182); lượt yên #51 (T4-182, poll-wait deadline 04:30Z);
  harness + O8 bộ thứ hai (T8-182, hb128 + Plan B B1); #99 có giết holder không + prune
  lần 57 (T6-182); headroom + ENOSPC + balloon + E-213/E-214 (T9-182).
- Không kiểm lại dải FULL125–FULL145; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của replay #99 (ai cài đặt 01:13–01:17Z — thuộc T5-182); không kiểm lại nguyên nhân clock
  nhanh ~18–29 s (xem F-182-T0-1) hay trigger daemon restart; không chạy `grep`/`find` đệ quy
  lúc mở đợt (bài học F-179-T9-6 — T0 đợt này chỉ đọc file trực tiếp theo đường dẫn đã biết,
  trừ một grep POSTBOOT_PASS* có phạm vi hẹp lúc ~02:54Z).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round182-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round182-t0/appendix182.py` + `appendix182.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round182-t0/boot-survey-182t0.txt`
  (output thô 9 nguồn)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round182-t0/o8-driver-182t0.sh` +
  `o8-182t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-s1-probe-182t0.mjs`
  (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
