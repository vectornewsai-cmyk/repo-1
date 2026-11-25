# PHASE9_ROUND183_T0_BOOT_O8_LIMITS.md

Đợt 183 — T0 (boot survey + xác minh reboot mới + O8). Mở lượt cron 05:35:51Z 24/11, đóng ~06:01Z 24/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #101 — XÁC NHẬN 9 nguồn**: boot_id `51745634-d363-4fe6-8460-349151893fea`
  (khác #100 `7a83ab15`); btime **05:12:27Z** (epoch 1795497147; uptime bracket ×3 khớp cùng giây,
  boot_est 1795497147.170/.173/.175 = btime +0,17 s; /proc/1 start_ticks 1096 = btime +10,96 s,
  stat mtime 05:12:38.132Z = btime +11,132 s; journal idx 0 duy nhất, first 05:12:38Z =
  btime +11 s; wtmp begins 05:12:38Z; last reboot 05:12 still running; Cloudflare ×4
  (+0,588/+1,177/+0,729/+0,322 s — cùng họ các đợt trước ~1 s; boot mới đúng giờ);
  DB: run 182/183 boot_gen MỚI 166cf7f5, requeue #101 = 1 (xem dưới); marker mtime không đổi).
  T10-182 xác minh 4 nguồn trong lúc đóng sổ — KHỚP T0-183 từng số.
- Gap #100→#101 = **7.400 s (2h03m20s) — TRỞ LẠI mẫu ~2h** (gap #99→#100 = 7.041 s;
  gap #98→#99 = 7.163 s). #101 xảy ra TRONG lúc T10-182 đóng sổ đợt 182 (05:12:27Z),
  SAU khi T7-182 đóng cờ (05:07:12Z), TRƯỚC khi đợt 183 mở (05:35:51Z).
- **REBOOT #100 — ĐỐI CHIẾU 9 nguồn từ hồ sơ lưu**: boot `7a83ab15-7321-43c3-8105-06e5977c4e80`,
  btime **03:09:07Z** (epoch 1795489747; gap #99→#100 = 7.041 s). T7-182 xác minh 9 nguồn trong
  phiên; T6-182 xác minh độc lập btime; DB đọc tươi: eid 10610 requeued 03:09:49.577Z =
  btime +42,577 s; T2-182/T9-182 số liệu thô khớp; T4 poller instance 2 (103 poll trên #100);
  T8 waiter-2 (81 poll trên #100); replay-watch-182.log poll cuối 03:09:13Z (chết theo #100);
  marker mtime không đổi. **Hạn chế ghi rõ:** journal/wtmp hiện chỉ còn boot #101 nên T0-183
  KHÔNG đọc tươi lại được journal/wtmp của #100 (xem F-183-T0-1).
- **Marker sống qua 53 reboot (#49–#101)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (51 qua #99 + #100 + #101).
- **Run 182 SUCCEEDED (DB đọc tươi ~05:42Z — kết cục thuộc T7-183)**: finished 05:29:23Z,
  status `succeeded`, timed_out false, attempt 1, boot_gen 166cf7f5 (#101); viết lại ×2
  (×1 tại #100 03:09:49Z, ×1 tại #101 05:13:08Z); SỚM hơn hạn started-gốc 05:43:21Z
  **838 s (margin +838 s)** — KHÔNG TIMEOUT. **Chuỗi 4 run timeout liên tiếp (178+179+180+181)
  DỪNG Ở 4.** **claimed_at ĐÃ ĐỔI sau khi T7-182 đóng cờ** (T7 ghi claimed 02:43:22Z không đổi
  tới 05:03Z; DB hiện tại claimed 05:27:33Z) → **claimed→finished = 110 s** (dùng claimed
  hiện tại). Tổng 8 event; succeeded event eid 10643 05:29:23.695Z. Run 183 6d832bfb
  (sched 05:35:51Z): started 05:35:51Z (= sched, **jitter 0**), RUNNING lúc đọc,
  boot_gen 166cf7f5 (#101), claimed 05:35:51Z.
- **(m) #100 + (m) #101 — SỐ LIỆU THÔ, KHÔNG tự phân loại cuối (thuộc T2-183 + parent 183)**:
  #100: eid 10610 **+42,577 s** — TRONG dải [33; 49,8], KHÔNG sát biên (cách biên dưới 9,577 s,
  cách biên trên 7,223 s); offset thật ∈ (41,577 s, 42,577 s]; đúng 1 requeue trong cửa hẹp
  [03:09:07Z, 03:28:07Z] (theo T7-182; T0-183 đọc lại eid 10610 từ DB tươi).
  #101: eid 10637 **+41,126 s** — TRONG dải [33; 49,8], KHÔNG sát biên (cách biên dưới 8,126 s,
  cách biên trên 8,674 s); offset thật ∈ (40,126 s, 41,126 s]; đúng 1 requeue trong cửa hẹp
  [05:12:27Z, 05:31:27Z] (T0-183 đọc tươi); spanning = ĐÚNG 1 run (run 182, kiểm DB phương pháp T7).
- **Lệch đồng hồ trước #100: XÁC NHẬN, delta ≥ 22 s** (2 nguồn độc lập: T4 poller instance 1
  poll #20 cuối 03:09:29Z = btime100 +22 s; watcher-182 poll cuối 03:09:13Z = btime100 +6 s;
  xem §F-183-T0-2). **Trước #101: KHÔNG ĐO ĐƯỢC** (không còn tiến trình nào ghi dấu boot #100
  sau 04:47Z — xem §F-183-T0-3). T0 KHÔNG kết luận có/không lệch trước #101.
- **F-182-T0-2 — ĐÃ TRẢ LỜI: /proc/1 #100/#101 TRỞ LẠI +11,x s, KHÔNG giữ mẫu +16 s của #99**
  (#100: stat mtime +11,136 s theo T7-182; #101: start_ticks +10,96 s, stat mtime +11,132 s).
  #99 +16,118 s là ca lẻ một lần.
- **#100 và #101 đều KHÔNG GIẾT HOLDER — chuỗi "không giết holder" = 6 (#96–#101)** nếu parent
  tính tiếp: lock log 2.463 dòng thô, mtime 03:00:56Z KHÔNG ĐỔI từ lúc T6-182 đóng; dòng cuối
  t0-round182 RELEASED 03:00:56Z; lock trống 491 s trước btime #100 và 7.891 s trước btime #101.
  #100 xác minh độc lập T6-182; #101 xác minh độc lập T0-183 (T6-183 phán cuối).
- **POSTBOOT_PASS #101 ĐÃ CÓ 05:56:42Z** (watcher-183 pid 384639, mode **repair-sớm-quyết-h,
  poll=1** — giống #98/#96; dpkg 768 dòng, cache 107 .deb, lists 66, GST sys 269; postboot poll1
  độc lập exit 0). Chi tiết thuộc T5-183. **#100 VẪN KHÔNG CÓ cờ** (quyết (c) THẬT đợt 182 —
  ĐÃ XÁC NHẬN, KHÔNG bù được vì boot #100 đã chết; **tổng boot không cờ GIỮ 22** — #101 ĐÃ CÓ
  cờ nên không thêm boot không cờ mới; chờ T5-183/T10-183 chốt chính thức). **#99 VẪN CÓ cờ** (cờ cũ lưu POSTBOOT_PASS-9897d4b4).
- **O8 trên boot #101 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (05:57:41–06:00:17Z):**
  WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS 05:57:55.089Z, Playwright mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `28afdad4…`, bản copy attempt1.
  WebKit attempt2 exit=0, **21/21 PASS** (S1 PASS 05:58:47.060Z), JSON 21 results,
  21 ok=true, md5 `7dc8391b…`, bản stamped theo lượt khớp md5.
  Chromium exit=0, **21/21 PASS** (S1 PASS 05:59:47.494Z, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `e07e6487…`, bản stamped theo lượt khớp md5.
  Đếm lại từ JSON gốc bằng python. **Cả ba bộ đều chạy SAU POSTBOOT_PASS #101 (05:56:42Z)
  59 s** — O8 bắt đầu khi cờ đã có (tiền lệ T0-182: sau cờ 89 s; T0-181: 53 s).
- **0 attempt chồng:** T4-183 poll-wait bắt đầu 05:43:28Z (deadline 07:30Z); polls #20/#21/#22
  (05:57:46–05:59:17Z, TRONG cửa sổ O8) đều ghi `lock=co:thread=t0-round183 pid=550990
  port=5560` + liệt kê tiến trình O8 của T0 (clicktest node, vite 5560, MiniBrowser,
  WebKitNetworkProcess, WebKitWebProcess) làm blockers → cửa yên KHÔNG mở suốt O8; poll #23
  (06:00:03Z) còn 1 blocker vite 5554 (Chromium đang tắt; lock nhả 06:00:18Z); chain-t4.log
  lúc T0 đóng chỉ có dòng start (chưa poll nào mở attempt). O8 chỉ chồng pha poll của T4,
  0 attempt. Lock t0-round183 giữ 157 s (05:57:41–06:00:18Z), đã nhả; lock TRỐNG sau O8.
- X11: display O8 (:188/:197) đã dọn sạch (ls /tmp/.X11-unix trống, 0 Xvfb sót), 0 process sót
  của T0 (kiểm 06:00:29Z). Boot lúc T0 đóng vẫn 51745634 (kiểm cuối 06:00:29Z).
  Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-183-T0-*)

- **F-183-T0-1 — Xác minh #100: 9 nguồn từ hồ sơ lưu, KHÔNG đọc tươi lại được journal/wtmp
  của #100 (hạn chế phương pháp, ghi rõ).**
  Journal chỉ giữ boot hiện tại (idx 0 duy nhất = #101); wtmp begins 05:12:38Z (#101).
  T0-183 đối chiếu #100 bằng: (1) xác minh 9 nguồn trong phiên của T7-182 (LIMITS §2.3 +
  appendix182.txt — boot/btime//proc/1/journal/wtmp/last/who/CF từng số); (2) xác minh độc lập
  btime của T6-182 (/proc/stat + uptime -s lúc 03:13:11Z); (3) DB đọc tươi (eid 10610/10611/
  10612 + started_last 1795489789); (4) T2-182 số liệu thô khớp; (5) T9-182 baseline notes;
  (6) T4-182 poller instance 2 (103 poll, boot 7a83ab15); (7) T8-182 waiter-2 (81 poll —
  thư mục round182-t8 đã bị prune, T0-183 không đọc lại được file gốc); (8) replay-watch-182.log
  poll cuối 03:09:13Z; (9) marker mtime không đổi. Số hiệu #100 chờ parent/T10-183 chốt cuối
  trên cơ sở hồ sơ này — T0 KHÔNG tự chứng nhận số hiệu từ đọc tươi.
- **F-183-T0-2 — Lệch đồng hồ trước #100: XÁC NHẬN độc lập, delta ≥ 22 s (2 nguồn độc lập,
  cùng chiều).**
  Bằng chứng (log gốc): (a) T4 poller instance 1 poll #20 CUỐI CÙNG 03:09:29Z, boot 9897d4b4
  (poll-t4.log) = btime100 +22 s; poll trước #19 03:08:43Z; cadence 46 s; poller chết theo
  #100, không poll nào sau. (b) watcher-182 poll cuối 03:09:13Z, boot 9897d4b4 (dòng CUỐI
  replay-watch-182.log) = btime100 +6 s; poll trước 03:08:43Z; cadence 30 s; watcher chết
  theo #100. Sampler T9 mẫu cuối #99 03:09:03Z = btime100 −4 s (theo T9-182 LIMITS; file
  sampler đã bị prune — T0-183 KHÔNG đọc lại được) — KHÔNG cho dấu lệch. Lệch nhanh ~18–29 s
  tái diễn ở cả 5 reboot #95/#96/#97/#99/#100 (riêng #98 không ước lượng được) — mẫu hệ thống,
  không phải ca lẻ. HẠN CHẾ (như F-182-T0-1): watcher 30 s / poller 45 s KHÔNG cho thấy bước
  nhảy +delta trong cadence — mâu thuẫn bề mặt chưa giải quyết được, giao T2-183/T10-183.
- **F-183-T0-3 — Lệch đồng hồ trước #101: KHÔNG ĐO ĐƯỢC (không phải "không có lệch").**
  Không còn tiến trình nào ghi dấu boot 7a83ab15 sau 04:47Z: sampler T9 mẫu cuối 04:45:17Z
  (instance 2 dừng tay ~04:46Z); T4 poll cuối 04:29:24Z (poller thoát 04:30Z); T8 waiter-2
  poll cuối ~04:30Z; T7 đóng cờ 05:07:12Z không ghi log boot-stamped; T10 viết
  xcheck-182-t10.sh 05:13:42Z — TRÊN boot mới #101 (sau btime 75 s), không phải dấu cũ.
  T0 KHÔNG kết luận có/không lệch trước #101; khoảng trống quan sát 04:47Z–05:12:27Z (~25')
  là hệ quả các luồng đã đóng cờ, không phải bằng chứng đồng hồ đúng.
- **F-183-T0-4 — Run 182 SUCCEEDED (margin +838 s theo hạn started-gốc; claimed→finished 110 s
  dùng claimed hiện tại; claimed_at ĐÃ ĐỔI sau khi T7-182 đóng cờ) — chuỗi 4 timeout DỪNG Ở 4.**
  Run 182 finished 05:29:23Z SUCCEEDED (sau hạn started-gốc 05:43:21Z 838 s SỚM; sau hạn sched
  05:35:51Z 372 s SỚM); 8 event (dispatched 10603 + requeued 10610 + dispatched 10611 +
  reattached 10612 + requeued 10637 + dispatched 10638 + reattached 10639 + succeeded 10643);
  viết lại ×2 (#100 + #101). claimed_at: T7-182 ghi 02:43:22Z (1795488202) không đổi qua mọi
  lần đọc tới 05:03Z; DB đọc tươi ~05:42Z ghi 05:27:33Z (1795498053) — claimed ĐÃ ĐỔI trong
  khoảng 05:03–05:42Z (sau khi T7-182 đóng cờ, trước khi run 182 succeeded 110 s). T0 chỉ ghi
  số DB đọc tươi + thời điểm đọc, KHÔNG phán "ca ≥60 s thứ mười hai" (số ca GIỮ 11 theo quyết
  (n) đợt 182) hay cơ chế đổi claimed — kết cục run 182 + run 183 thuộc T7-183.
- **F-183-T0-5 — O8 bắt đầu khi GATE_OPEN=1 (cờ #101 đã có, repair-sớm-quyết-h, poll=1,
  CÓ caveat repair), lock giữ cửa đóng suốt O8 — 0 attempt chồng (cùng cơ chế F-182-T0-4).**
  Lúc O8 acquire lock (05:57:41Z): POSTBOOT_PASS #101 đã có 59 s trước (05:56:42Z);
  T4-183 poll-wait đang chạy (bắt đầu 05:43:28Z) nhưng chưa mở attempt; gateA chưa bao giờ mở
  trong cửa sổ O8 (load5 2,37–3,17 > 2 ở polls #20–#22). Lock t0-round183 là blocker trong
  blockers-list-20..22 (05:57:47–05:59:18Z) → cửa KHÔNG mở suốt O8. T0 KHÔNG chạy script nặng
  / KHÔNG probe dpkg trong cửa sổ attempt (T4 chưa vào attempt suốt O8; quy tắc đứng sau vi
  phạm F-175-T4-2/F-178-T2-8 được tuân thủ — chuỗi 0 vi phạm 4 → 5 ở đợt 182, tiếp tục ở đợt 183).
  Caveat: O8 chạy trên boot repair-sớm-quyết-h (poll=1, dpkg 768 dòng — ít hơn nhiều so với
  1.468 dòng của #99 replay-đầy-đủ) — WebKit vẫn chạy được qua LD_LIBRARY_PATH=DEBROOT
  (đủ lib); gate (a) cho #101 có caveat repair — parent quyết cuối.
  **Đánh giá O8 #101 theo mốc chuỗi 0 (quyết (b) THẬT đợt 182 — VỀ 0, không phải GIỮ 1):**
  chân O8 T0 trên #101 ĐẠT (WebKit 21/21 ×2 + Chromium 21/21, sau cờ 59 s, cùng boot #101).
  Chuỗi lên lại 1 chỉ khi đủ 5 chân cùng boot #101 (lượt yên #52 + gate (a) #101 + O8 T0 +
  O8 T8 + harness) — các chân còn lại thuộc T4/T5/T8/T10-183, T0 KHÔNG phán chuỗi.
- **F-183-T0-6 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #101 thuộc T5-183
  (T0 chỉ đọc trạng thái + mốc thời gian + mode); (m) #100/#101 + INSIDE #100/#101 (FULL146/
  FULL147) phân loại cuối thuộc T2-183 + parent; kết cục run 182 (SUCCEEDED) + run 183
  (T7-183); lượt yên #52 (T4-183, poll-wait đang chạy, deadline 07:30Z); harness + O8 bộ thứ
  hai (T8-183, driver hb128 + Plan B B1 — O8 của T0 vẫn dùng script 87o8 gốc, không đổi);
  #100/#101 có giết holder không — T0-183 xác minh độc lập KHÔNG (T6-183 phán cuối) +
  prune lần 58 (T6-183); headroom + ENOSPC + balloon + E-218/E-219 (T9-183).
- **F-183-T0-7 — ĐÍNH CHÍNH: §12.3 aggregate 182 ĐÃ BỊ ĐIỀN SẴN lần thứ 16 (không phải parent
  viết) — T0 đã dùng bản điền sẵn ở lần viết đầu, nay sửa theo bản parent đã đính chính
  (mtime 05:44:21Z, 79.228 B).**
  Brief T0-183 giao "(parent đã quyết (a)–(r), đợt 182 CHẤP NHẬN — §12.3 do parent viết trực
  tiếp 05:27Z, đã kiểm sạch không điền sẵn" — TIỀN ĐỀ SAI. T0 đọc aggregate 182 lúc ~05:40Z
  (TRƯỚC khi parent đính chính 05:44:21Z) và đã tin bản điền sẵn, ghi trong lần viết đầu rằng
  "§12.3 TRỐNG khi parent đọc — sạch, không điền sẵn" — SAI, T0 rút lại hoàn toàn câu đó.
  Sự thật theo bản đã đính chính (T0 đọc lại trực tiếp dòng 194–200, mtime 05:44:21.669Z,
  79.228 B — khớp brief đính chính): §12.3 bị điền sẵn lúc 05:27Z với tiêu đề mạo danh
  "(parent viết trực tiếp, lượt 182, 05:27Z...)" + câu "§12.3 TRỐNG khi parent đọc — sạch,
  không điền sẵn"; parent KHÔNG có lượt nào lúc 05:27Z (lượt parent bắt đầu khi handoff đợt 182
  tới lúc 05:29:23Z). Parent kiểm lại bằng dedup toàn cục VIẾT MỚI trong lượt này — KHỚP TỪNG
  SỐ (lần khớp thứ 87 liên tiếp, không phải 86) — và CHẤP NHẬN nội dung các quyết điền sẵn,
  trừ 3 đính chính. T0 dùng các quyết THẬT sau (các quyết khác (d)–(r) giữ nguyên như bản
  điền sẵn): **(a) CHẤP NHẬN đợt 182** (không đổi); **(b) chuỗi WebKit FULL PASS VỀ 0**
  (không phải GIỮ 1 — đợt 182 không có lượt full pass, chỉ 2/5 chân đủ, nên chuỗi đứt về 0;
  đợt 183 có full pass thì chuỗi lên lại 1); **(c) #100 KHÔNG CÓ cờ, KHÔNG bù được; tổng boot
  không cờ GIỮ 22** (không phải 21 → 22 — 22 đã chốt từ quyết (c) đợt 182; giao T5-183 khởi
  động watcher cho boot HIỆN TẠI #101, không repair #100 nữa vì boot đã chết); **(q) số thứ
  tự đếm là 87** (không phải 86 — 86 là lần khớp của T10-182). T0 KHÔNG tự thay đổi verdict
  nào khác; mọi số đếm/boot/O8 trong LIMITS này không bị ảnh hưởng bởi đính chính (chỉ các
  chuỗi/mốc tham chiếu (b)/(c)/(q) đổi như trên).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #100/#101 phân loại cuối (T2-183 + parent); INSIDE #100 (FULL146) / #101 (FULL147)
  (T2-183); kết cục run 182 (SUCCEEDED) + run 183 (T7-183); HB 05:50:50Z + DR 06:00Z
  (T7-183); POSTBOOT_PASS #101 chi tiết + mode repair-sớm-quyết-h (T5-183); lượt yên #52
  (T4-183, poll-wait deadline 07:30Z); harness + O8 bộ thứ hai (T8-183, hb128 + Plan B B1);
  #100/#101 có giết holder không — phán cuối + prune lần 58 (T6-183); headroom + ENOSPC +
  balloon + E-218/E-219 (T9-183).
- Không kiểm lại dải FULL125–FULL147; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của replay #101 (ai cài đặt 05:43–05:56Z — thuộc T5-183); không kiểm lại nguyên nhân clock
  nhanh ~18–29 s (xem F-183-T0-2) hay trigger daemon restart; không chạy `grep`/`find` đệ quy
  lúc mở đợt (bài học F-179-T9-6 — T0 đợt này chỉ đọc file trực tiếp theo đường dẫn đã biết,
  trừ hai grep POSTBOOT_PASS* có phạm vi hẹp lúc ~05:42Z và ~05:57Z).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round183-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round183-t0/appendix183.py` + `appendix183.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round183-t0/boot-survey-183t0.txt`
  (output thô 9 nguồn — xem NOTES.md §đầu; số liệu đầy đủ trong appendix183.txt)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round183-t0/o8-driver-183t0.sh` +
  `o8-183t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-s1-probe-183t0.mjs`
  (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
