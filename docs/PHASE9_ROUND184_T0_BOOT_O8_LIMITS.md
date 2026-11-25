# PHASE9_ROUND184_T0_BOOT_O8_LIMITS.md

Đợt 184 — T0 (boot survey + xác minh reboot mới + O8). Mở lượt cron 08:35:51Z 24/11, đóng ~08:51Z 24/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #102 — XÁC NHẬN 9 nguồn**: boot_id `6ecd948e-1abd-46bf-9159-9f5731e7cb50`
  (khác #101 `51745634`); btime **07:07:05Z** (epoch 1795504025; uptime bracket ×3 khớp cùng giây,
  boot_est 1795504025.213/.215/.225 = btime +0,21 s; /proc/1 start_ticks 1092 = btime +10,92 s,
  stat mtime 07:07:16.145Z = btime +11,145 s; journal idx 0 duy nhất, first 07:07:16Z =
  btime +11 s; wtmp begins 07:07:16Z; last reboot 07:07 still running; Cloudflare ×4
  (+0,972/+1,004/+0,489/+1,126 s — cùng họ các đợt trước ~1 s; boot mới đúng giờ);
  DB: run 183/184 boot_gen MỚI 6638cc3a, requeue #102 = 1 (xem dưới); marker mtime không đổi).
  T8-183/T9-183 ghi nhận trong lúc đóng sổ — KHỚP T0-184 từng số.
- Gap #101→#102 = **6.878 s (1h54m38s) — TRỞ LẠI mẫu ~2h** (gap #100→#101 = 7.400 s;
  gap #99→#100 = 7.041 s). #102 xảy ra SAU khi T8-183 đóng O8 (07:04:15Z), TRƯỚC khi
  T9-183 đóng cờ (~07:38Z), TRƯỚC khi đợt 184 mở (08:35:51Z).
- **Marker sống qua 54 reboot (#49–#102)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (53 qua #101 + #102).
- **Run 183 SUCCEEDED (DB đọc tươi ~08:42Z — kết cục thuộc T7-184)**: finished 08:13:58Z,
  status `succeeded`, timed_out false, attempt 1, boot_gen 6638cc3a (#102); viết lại ×1
  (tại #102 07:07:45Z); SỚM hơn hạn started-gốc 08:35:51Z **1.313 s (margin +1.313 s)** —
  KHÔNG TIMEOUT. **claimed→finished = 85 s** (claimed hiện tại 08:12:33Z). Tổng 5 event;
  succeeded event eid 10682 08:13:58.019Z. Run 184 b8fc08e4 (sched 08:35:51Z): started
  08:35:51Z (= sched, **jitter 0**), RUNNING lúc đọc, boot_gen 6638cc3a (#102), claimed 08:35:51Z.
- **(m) #102 — SỐ LIỆU THÔ, KHÔNG tự phân loại cuối (thuộc T2-184 + parent 184)**:
  eid 10667 **+40,341 s** — TRONG dải [33; 49,8], KHÔNG sát biên (cách biên dưới 7,341 s,
  cách biên trên 9,459 s); offset thật ∈ (39,341 s, 40,341 s]; đúng 1 requeue trong cửa hẹp
  [07:07:05Z, 07:26:05Z] (T0-184 đọc tươi); spanning = ĐÚNG 1 run (run 183, kiểm DB phương pháp T7).
- **Lệch đồng hồ trước #102: XÁC NHẬN, delta ≥ 17 s** (1 nguồn độc lập: watcher-183 poll cuối
  07:07:22Z = btime102 +17 s; xem §F-184-T0-1). **Trước #101: KHÔNG ĐO ĐƯỢC** (đợt 183, F-183-T0-3).
- **F-182-T0-2 — ĐÃ TRẢ LỜI: /proc/1 #102 TRỞ LẠI +11,x s, KHÔNG giữ mẫu +16 s của #99**
  (start_ticks +10,92 s, stat mtime +11,145 s). #99 +16,118 s là ca lẻ một lần.
- **#102 KHÔNG GIẾT HOLDER — chuỗi "không giết holder" = 7 (#96–#102)** nếu parent tính tiếp:
  lock log 2.495 dòng thô, mtime 07:04:15Z KHÔNG ĐỔI từ lúc T8-183 đóng; dòng cuối
  t8-round183 RELEASED 07:04:15Z; lock trống 170 s trước btime #102.
  (T6-184 phán cuối.)
- **POSTBOOT_PASS #102 ĐÃ CÓ 08:43:59Z** (watcher-184 pid 211325, mode **replay-đầy-đủ, poll=0,
  KHÔNG caveat** — dpkg 1.461 dòng, cache 170 .deb, lists 39, GST sys 269; postboot poll0 độc lập
  exit 0). Chi tiết thuộc T5-184. **#101 VẪN CÓ cờ** (cờ cũ lưu POSTBOOT_PASS-51745634).
  **#100 VẪN KHÔNG CÓ cờ** (quyết (c) THẬT đợt 183 — ĐÃ XÁC NHẬN, KHÔNG bù được vì boot #100
  đã chết; **tổng boot không cờ GIỮ 22**).
- **O8 trên boot #102 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (08:45:16–08:48:57Z):**
  WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS 08:45:37.223Z, Playwright mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `ce3eebb4…`, bản copy attempt1.
  WebKit attempt2 exit=0, **21/21 PASS** (S1 PASS 08:46:51.818Z), JSON 21 results,
  21 ok=true, md5 `42810c2d…`, bản stamped theo lượt khớp md5.
  Chromium exit=0, **21/21 PASS** (S1 PASS 08:48:23.365Z, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `ca54a31e…`, bản stamped theo lượt khớp md5.
  Đếm lại từ JSON gốc bằng python. **Cả ba bộ đều chạy SAU POSTBOOT_PASS #102 (08:43:59Z)
  77 s** — O8 bắt đầu khi cờ đã có (tiền lệ T0-183: sau cờ 59 s; T0-182: 89 s).
- **0 attempt chồng:** T4-184 poll-wait bắt đầu 08:46:16Z (60 s SAU khi T0 acquire lock,
  TRONG cửa sổ O8); polls #1/#2/#3/#4 (08:46:16–08:48:33Z, TRONG cửa sổ O8) đều ghi
  `lock=co:thread=t0-round184 pid=261262 port=5560` + blockers 5/5/5/1 → cửa yên KHÔNG mở
  suốt O8; poll #5 (08:49:19Z, sau khi lock nhả) lock=khong nhưng load5 5,38 > 2 — cửa vẫn
  không mở; chain-t4.log lúc T0 đóng chỉ có dòng start (chưa poll nào mở attempt). O8 chỉ
  chồng pha poll của T4, 0 attempt. Lock t0-round184 giữ 221 s (08:45:16–08:48:57Z), đã nhả;
  lock TRỐNG sau O8.
- X11: display O8 (:188/:197) đã dọn sạch (ls /tmp/.X11-unix trống, 0 Xvfb sót), 0 process sót
  của T0 (kiểm 08:50:32Z). Boot lúc T0 đóng vẫn 6ecd948e (kiểm cuối 08:50:32Z).
  Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-184-T0-*)

- **F-184-T0-1 — Lệch đồng hồ trước #102: XÁC NHẬN độc lập, delta ≥ 17 s (1 nguồn — ít hơn
  #100, nơi có 2 nguồn độc lập).**
  Bằng chứng (log gốc): watcher-183 poll CUỐI CÙNG 07:07:22Z, boot 51745634 (dòng CUỐI
  replay-watch-183.log) = btime102 +17 s; poll trước 07:06:52Z; cadence 30 s; watcher chết
  theo #102, không poll nào sau. Sampler T9 mẫu cuối #101 07:06:43Z = btime102 −22 s
  (ram-sampler-FROZEN.log, T9-183) — KHÔNG cho dấu lệch. T4 poller thoát 06:08:24Z sau
  attempt #52 — KHÔNG cho dấu lệch. Lệch nhanh tái diễn ở cả 6 reboot #95/#96/#97/#99/#100/
  #102 (riêng #98 + #101 không ước lượng được) — mẫu hệ thống, không phải ca lẻ. HẠN CHẾ
  (như F-182-T0-1): watcher 30 s KHÔNG cho thấy bước nhảy +delta trong cadence — mâu thuẫn
  bề mặt chưa giải quyết được, giao T2-184/T10-184.
- **F-184-T0-2 — Run 183 SUCCEEDED (margin +1.313 s theo hạn started-gốc; claimed→finished 85 s
  dùng claimed hiện tại) — T0 chỉ ghi số, KHÔNG phán ca ≥60 s.**
  Run 183 finished 08:13:58Z SUCCEEDED (sau hạn started-gốc 08:35:51Z 1.313 s SỚM); 5 event
  (dispatched 10645 + requeued 10667 + dispatched 10668 + reattached 10669 + succeeded 10682);
  viết lại ×1 (#102). claimed_at: DB đọc tươi ~08:42Z ghi 08:12:33Z (1795507953) — T0 KHÔNG
  có lần đọc claimed trước đó của run 183 để đối chiếu có đổi hay không (khác run 182, nơi
  T7-182 ghi claimed không đổi tới 05:03Z); T0 chỉ ghi số DB đọc tươi + thời điểm đọc, KHÔNG
  phán "ca ≥60 s thứ mười ba" (số ca GIỮ 12 theo quyết (n) đợt 183) hay cơ chế đổi claimed —
  kết cục run 183 + run 184 thuộc T7-184.
- **F-184-T0-3 — O8 bắt đầu khi GATE_OPEN=1 (cờ #102 đã có, replay-đầy-đủ, poll=0,
  KHÔNG caveat), lock giữ cửa đóng suốt O8 — 0 attempt chồng (cùng cơ chế F-183-T0-5).**
  Lúc O8 acquire lock (08:45:16Z): POSTBOOT_PASS #102 đã có 77 s trước (08:43:59Z);
  T4-184 poll-wait bắt đầu 60 s SAU khi T0 acquire lock (08:46:16Z) nhưng chưa mở attempt;
  gateA chưa bao giờ mở trong cửa sổ O8 (load5 3,12–5,62 > 2 ở polls #1–#4). Lock
  t0-round184 là blocker trong blockers-list-1..4 (08:46:16–08:48:33Z) → cửa KHÔNG mở suốt
  O8. T0 KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (T4 chưa vào attempt
  suốt O8; quy tắc đứng sau vi phạm F-183-T2-7 được tuân thủ — chuỗi 0 vi phạm đã đứt về 0
  đợt 183 theo quyết (p) parent, T0 không làm đứt thêm).
  Caveat: cờ #102 ghi ở boot+1h36m54s (08:43:59Z) vì không watcher nào sống trên #102 trước
  08:43Z (khoảng không-watcher ~96 phút) — KHÔNG phải vì repair chậm (mode replay-đầy-đủ,
  poll=0, dpkg 1.461 dòng — replay host đã cài đủ trước khi watcher-184 mở).
  **Đánh giá O8 #102 theo mốc chuỗi 0 (quyết (b) THẬT đợt 183 — GIỮ 0):** chân O8 T0 trên #102
  ĐẠT (WebKit 21/21 ×2 + Chromium 21/21, sau cờ 77 s, cùng boot #102, cờ KHÔNG caveat).
  Chuỗi lên lại 1 chỉ khi đủ 5 chân cùng boot #102 (lượt yên #53 + gate (a) #102 + O8 T0 +
  O8 T8 + harness) — các chân còn lại thuộc T4/T5/T8/T10-184, T0 KHÔNG phán chuỗi.
- **F-184-T0-4 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #102 thuộc T5-184
  (T0 chỉ đọc trạng thái + mốc thời gian + mode); (m) #102 + INSIDE #102 (FULL148) phân loại
  cuối thuộc T2-184 + parent; kết cục run 183 (SUCCEEDED) + run 184 (T7-184); lượt yên #53
  (T4-184, poll-wait đang chạy, deadline 10:30Z); harness + O8 bộ thứ hai (T8-184, driver
  hb128 + Plan B B1 + thiết kế nâng V2 theo quyết (j) đợt 183 — O8 của T0 vẫn dùng script
  87o8 gốc, không đổi); #102 có giết holder không — T0-184 xác minh độc lập KHÔNG (T6-184
  phán cuối) + prune lần 59 (T6-184); headroom + ENOSPC + balloon + E-220 (T9-184).
- **F-184-T0-5 — Nguồn dùng trong LIMITS này: §12.3 aggregate 183 BẢN PARENT VIẾT TRỰC TIẾP
  (sạch, không điền sẵn — lần đầu kể từ đợt 179; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 90).**
  Các quyết THẬT dùng: (a) CHẤP NHẬN đợt 183; (b) chuỗi FULL PASS GIỮ 0; (c) POSTBOOT_PASS
  #101 đứng cho gate (a) CÓ caveat, #100 KHÔNG CÓ cờ, tổng boot không cờ GIỮ 22, #102 CHƯA CÓ
  — T5-184 lo; (e) #100/#101 XÁC NHẬN, #102 chờ T0-184; (f) (m) #100/#101 DƯƠNG (CUỐI);
  (g) n ứng viên 44/45, n chính thức GIỮ 14; (n) run 183 kết cục thuộc T7-184, số ca ≥60 s
  GIỮ 12; (p) F-183-T2-7 VI PHẠM NHẸ — chuỗi 0 vi phạm 4 → 0 (ĐỨT); (q) đếm cuối đợt 183 =
  10/15/15/14, lũy kế 111–183 = 718/1.244/1.082/904, chuỗi 9/9 = 5. T0 KHÔNG tự thay đổi
  verdict nào; mọi số đếm/boot/O8 trong LIMITS này không bị ảnh hưởng bởi nguồn (chỉ các
  chuỗi/mốc tham chiếu (b)/(c)/(g)/(n)/(p)/(q) theo bản parent).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #102 phân loại cuối (T2-184 + parent); INSIDE #102 (FULL148) (T2-184); kết cục run 183
  (SUCCEEDED) + run 184 (T7-184); HB/DR + cửa slot đợt 184 (T7-184); POSTBOOT_PASS #102 chi
  tiết + mode replay-đầy-đủ (T5-184); lượt yên #53 (T4-184, poll-wait deadline 10:30Z);
  harness + O8 bộ thứ hai (T8-184, hb128 + Plan B B1 + thiết kế nâng V2); #102 có giết holder
  không — phán cuối + prune lần 59 (T6-184); headroom + ENOSPC + balloon + E-220 (T9-184).
- Không kiểm lại dải FULL125–FULL148; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của replay #102 (ai cài đặt trước 08:43Z — thuộc T5-184); không kiểm lại nguyên nhân clock
  nhanh ~17–29 s (xem F-184-T0-1) hay trigger daemon restart; không chạy `grep`/`find` đệ quy
  lúc mở đợt (bài học F-179-T9-6 — T0 đợt này chỉ đọc file trực tiếp theo đường dẫn đã biết,
  trừ hai grep POSTBOOT_PASS* có phạm vi hẹp lúc ~08:42Z).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round184-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round184-t0/appendix184.py` + `appendix184.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round184-t0/boot-survey-184t0.txt`
  (output thô 9 nguồn — xem NOTES.md §đầu; số liệu đầy đủ trong appendix184.txt)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round184-t0/o8-driver-184t0.sh` +
  `o8-184t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-s1-probe-184t0.mjs`
  (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
