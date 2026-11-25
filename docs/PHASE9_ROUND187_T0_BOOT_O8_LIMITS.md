# PHASE9_ROUND187_T0_BOOT_O8_LIMITS.md

Đợt 187 — T0 (boot survey + xác minh reboot mới + O8). Mở lượt cron 20:35:51Z
24/11/2026 (= 03:35 +07 25/11), survey đo tươi 20:43:19Z, O8 20:58:09–21:01:19Z,
đóng ~21:05Z 24/11/2026. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag.
Nguồn đứng: §12.3 aggregate 185 BẢN PARENT (79.029 B; quyết (a)–(r); parent kiểm
đếm KHỚP TỪNG SỐ lần thứ 96) + aggregate 186 T10-186 (96.703 B, đóng 20:59Z —
**§12.3 CÒN TRỐNG lúc T0-187 đóng, parent CHƯA quyết**).

**BỐI CẢNH: đợt 186 đóng MUỘN, số hiệu boot CHƯA QUYẾT** — T10-186 spawn muộn
(20:41Z) và đóng aggregate 20:59Z, sau hạn cứng ~20:35Z (9/9 cờ đã đủ trước hạn
cứng; T9 trễ ~12' so với hạn cờ — chuỗi 9/9 = 8 nếu parent tính tiếp). Mâu thuẫn
số hiệu #106/#107 (T0-186 gọi cea79500 là #107, T2-186 gọi là #106) CHƯA được
parent quyết ở §12.3-186 — T0-187 trình bày bằng chứng cả hai bên, KHÔNG tự
khẳng định số hiệu.

## Kết quả chính

- **REBOOT MỚI — XÁC NHẬN 9 nguồn TƯƠI (đo 20:43:19Z)**: boot_id
  `6f1d9f87-7b23-4e5b-b2f5-597e6de37db4` (khác boot trước `7ea9d047`); btime
  **20:30:33Z** (epoch 1795552233; uptime bracket ×3 khớp cùng giây —
  `uptime -s` 20:30:33Z, /proc/stat btime 1795552233, /proc/uptime 766,30 s lúc
  20:43:19Z → boot_est = btime −0,30 s; /proc/1 start_ticks 1088 = btime
  +10,88 s, stat mtime 20:30:44.228Z = btime +11,228 s; journal idx 0 duy nhất,
  first 20:30:44Z = btime +11 s; wtmp begins 20:30:44Z; `last` reboot 20:30
  still running; `who -b` Nov 24 20:30; Cloudflare ×1 (local 20:43:19Z vs CF
  20:43:21 GMT, chênh +2 s — trừ ~1 s mạng → đồng hồ boot mới ĐÚNG ~+1 s, như
  các đợt trước); DB: run 188 boot_gen MỚI cron_boot_32707bf4… (xem dưới);
  marker mtime không đổi).
  Gap 7ea9d047→6f1d9f87 = **4.841 s (1h20m41s) — NGẮN HƠN mẫu ~2h** (ngắn nhất
  chuỗi gần đây: #102→#103 7.670 s, #103→#104 7.127 s, #104→#105 7.190 s,
  #107→#108 6.602 s). Boot mới xảy ra SAU khi run 187 finished (20:17:06Z),
  TRƯỚC khi đợt 187 mở (20:35:51Z).
- **SỐ HIỆU — CHƯA QUYẾT, trình bày cả hai cách đếm (parent quyết ở §12.3-186)**:
  theo cách đếm T0-186 (cea79500 = #107, #106 chưa xác minh — khung cứng
  (14:52:42Z, 17:19:50Z), ước tính mẫu ~15:13:32Z KHÔNG khẳng định): 7ea9d047 =
  **#108**, 6f1d9f87 = **#109**. Theo cách đếm T2-186 (cea79500 = #106, gap
  #105→#106 = 14.778 s): 7ea9d047 = **#107**, 6f1d9f87 = **#108**. Hệ quả kéo
  theo: gap #107→#108 (cách đếm T0) = 6.602 s (T7/T8/T9-186 KHỚP — T0-187
  kiểm lại bằng phép trừ epoch, KHỚP); nếu cea79500 = #106 thì gap đó là
  #106→#107. T0-187 KHÔNG dùng số hiệu nào làm tiền đề cho bất kỳ verdict nào
  khác trong LIMITS này — mọi chỗ khác ghi boot_id đầy đủ.
- **Marker sống qua 61 reboot (theo cách đếm T0-186) / 60 reboot (theo cách đếm
  T2-186)** — `~/.config/vcut-persistence-marker` mtime
  2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48).
  F-185-T8-4 ĐÃ SỬA từ đợt 186: boot-survey-187t0.sh stat đúng đường dẫn marker.
- **Run 187 FAILED 20:17:06Z — KHÔNG PHẢI timeout (số thô, T7-187 phán cuối)**:
  finished 1795551426, status `failed`, timed_out false, attempt 1, boot_gen
  cron_boot_7a69fe82… (sau boot 7ea9d047); sched 17:35:51Z, started viết lại
  19:10:31Z (tại boot 7ea9d047), claimed 20:13:44Z; **margin so với hạn
  20:35:51Z = +1.125 s (xong sớm 18m45s)**; **claimed→finished = 202 s** (≥60 s
  — ỨNG VIÊN CA mới, T7-187 phán cuối). Lý do failed trong DB: "The worker
  reported that the work is not finished" — T10-186 chưa spawn trong run 187,
  closing dời sang run 188 (aggregate 186 đã đóng 20:59Z trong run 188 — xem
  dưới). 5 event: dispatched 10796 + requeued 10818 + dispatched 10819 +
  reattached 10820 + failed 10836.
  **Run 188 (đợt này) vẫn RUNNING lúc đọc**: sched = started 20:35:51Z,
  boot_gen cron_boot_32707bf4… (boot mới), claimed 20:35:51Z, attempt 1.
  Kết cục thuộc T7-187.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-187 + parent)**:
  0 event `requeued_after_restart` trong [20:29:00Z, 20:33:00Z] (DB tươi) và 0
  event mới trong [20:25:00Z, 20:45:00Z] ngoài reconciled/dispatched run 188 +
  feed-pulse-03; không run nào sống tại btime (run 187 finished 20:17:06Z
  trước btime 13m27s; run 188 started 20:35:51Z sau btime 5m18s) → (m) boot mới
  không có offset. Giống #106/#107 (0 requeue vì không có run spanning), khác
  #104 (1 run spanning nhưng không bị requeue).
  **(m) 7ea9d047 — đối chiếu DB tươi, KHỚP T7-186**: requeue eid 10818 lúc
  19:10:31.437927Z = btime 7ea9d047 **+39,438 s — TRỞ LẠI mẫu btime + ~35–40 s**
  (#102 +40,341; #103 +37,543; #105 +34,931; 7ea9d047 +39,438).
- **POSTBOOT_PASS boot mới ĐÃ CÓ 20:50:24Z (T5-187; T0 chỉ ghi nhận)**:
  file `round187-t5/POSTBOOT_PASS`, 315 B; mode **replay-đầy-đủ, poll=0**;
  dpkg 1468 dòng, cache 170 .deb, lists 37; verify độc lập exit 0 lúc
  20:50:24Z; boot+19m51s (1.191 s); cờ cũ cea79500 lưu POSTBOOT_PASS-cea79500.
  Mode/caveat thuộc T5-187 + parent (tiền lệ: replay-đầy-đủ poll=0 KHÔNG
  caveat ở #104/#102/#99/#95; repair poll=1 CÓ caveat ở #107/#101/#98/#96).
  **POSTBOOT_PASS 7ea9d047 CHƯA CÓ** (grep 0 file — T5-186 đóng trước reboot;
  thuộc T5-187). **#105 VẪN CHƯA CÓ cờ** (tổng boot không cờ 23 → 24 nếu
  parent chấp nhận — T5-186/T7-186 + T10-186 đối chiếu).
- **O8 trên boot mới — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (20:58:09–21:01:19Z)**: WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS
  20:58:28.758Z, Playwright mouse click lần 2), JSON 21 results, 21 ok=true,
  md5 `a1716bb330002932ab1cbd6af926c4f3`; attempt2 exit=0, **21/21 PASS** (S1
  PASS 20:59:37.595Z), JSON 21 results, 21 ok=true, md5
  `f300052bd4bbf30cfad0b057298c91c8`; Chromium exit=0, **21/21 PASS** (S1 PASS
  21:00:46.636Z, CDP mouse click lần 2), JSON 21 results, 21 ok=true, md5
  `3143f956f9c4f70f0639001808515a9d`. Đếm lại từ JSON gốc bằng python.
  **Cả ba bộ đều chạy SAU POSTBOOT_PASS boot mới (20:50:24Z) 7m45s** (tiền lệ
  T0-186: sau cờ 9m35s; T0-185: sau cờ 32 s).
  **libevent-2.1.so.7 VẮNG lúc 20:43:19Z → CÓ lúc 20:46:27Z** (dpkg.log ghi cài
  đặt 20:45–20:48Z — replay T5-187; heal lần 3 sau #104 và #107);
  WebKit launched version 27.2 cả hai attempt (log 20:58:20Z + 20:59:27Z);
  0 lỗi exit 127 / launch-fail trong cả 3 bộ. dpkg 1468 dòng trên boot mới
  (khớp con số trong cờ T5-187 — chỉ đọc file, không chạy dpkg/apt).
- **0 attempt chồng — NHƯNG ĐẢO THỨ TỰ so với đợt 186 (xem F-187-T0-8):** T4-187
  poller bắt đầu 20:47:32Z, polls #1–#14 vẫn chờ cửa yên (gate0=T5 sau khi có
  cờ 20:50:24Z; apt=0; dpkg_lines=1468 đóng băng); T0 acquire lock 20:58:09Z
  khi lock TRỐNG và chưa có attempt T4 nào; polls #17/#18/#19 TRONG cửa sổ O8
  (20:59:38Z/21:00:23Z/21:01:08Z) đều ghi `lock=co:thread=t0-round187
  pid=270732 port=5560` → cửa yên KHÔNG mở suốt O8; poll #20 (21:01:54Z, sau
  khi lock nhả) lock=khong; chain-t4.log không có attempt nào lúc 21:03:27Z.
  O8 chỉ chồng pha poll của T4, 0 attempt. Lock t0-round187 giữ 190 s
  (20:58:09–21:01:19Z), đã nhả; lock TRỐNG sau O8.
- X11: 0 process sót (kiểm 21:03:27Z); /tmp/.X11-unix/ TRỐNG — O8 không để lại
  socket (khác đợt 186 còn X193 của T4 attempt1). Boot lúc T0 đóng vẫn
  6f1d9f87 (kiểm cuối 21:03:04Z). Không có reboot mới trong phiên T0.
  LIMITS này ~19 KB.

## Giới hạn / sai số ghi nhận (F-187-T0-*)

- **F-187-T0-1 — Số hiệu boot mới CHƯA QUYẾT: mâu thuẫn T0-186 vs T2-186 (xem
  Kết quả chính).** Bằng chứng T0 đã có: T0-186 xác minh cea79500 = #107 bằng
  9 nguồn tươi + #106 chưa xác minh (khung cứng (14:52:42Z, 17:19:50Z), ước
  tính mẫu ~15:13:32Z không khẳng định); T2-186 gọi cea79500 = #106 (gap
  #105→#106 = 14.778 s, gộp 2 reboot trong một con số). Aggregate 186 T10-186
  (96.703 B, đóng 20:59Z) có §12.1 (e) hỏi parent nhưng **§12.3 CÒN TRỐNG lúc
  T0-187 đóng** — parent chưa quyết. T0-187 KHÔNG chọn bên nào; mọi số đếm
  phụ thuộc số hiệu (chuỗi marker 61 vs 60 reboot, gap #107→#108 vs #106→#107,
  (m) #108 vs #107, FULL152/FULL153) đều trình bày kèm cách đếm. Nếu parent
  quyết cea79500 = #106 thì toàn bộ nhãn #108/#109 trong LIMITS này lùi 1
  (7ea9d047 = #107, 6f1d9f87 = #108); btime/gap/boot_id KHÔNG đổi theo cả hai
  cách.
- **F-187-T0-2 — Run 187 FAILED (số thô, T0 chỉ ghi, KHÔNG phán — thuộc T7-187
  + parent).** Bằng chứng (DB đọc tươi): finished 1795551426 (20:17:06Z),
  status `failed`, timed_out false, attempt 1; error_text: worker báo công việc
  chưa xong (T10-186 chưa spawn trong run 187); result_summary ghi 9/9 thread
  đợt 186 đã có cờ + aggregate chưa viết — closing dời sang run 188.
  **KHÔNG phải timeout** (margin +1.125 s, xong trước hạn 20:35:51Z).
  Claimed→finished 202 s ≥60 s — ỨNG VIÊN CA mới (T7-187 phán cuối; nếu xác
  nhận: số ca 18 → 19 toàn lịch sử, 15 → 16 trong cửa sổ theo đếm T7-186).
  Aggregate 186 đã đóng 20:59Z trong run 188 (T10-186 spawn 20:41Z) — kết cục
  run 188 thuộc T7-187.
- **F-187-T0-3 — Đồng hồ cell NHANH/CHẬM trước boot mới: KHÔNG ước lượng
  được.** Bằng chứng: mẫu sampler cuối trên 7ea9d047 là 19:53:26Z (cách btime
  37m07s); watcher-186 chết theo reboot 7ea9d047 (poll cuối log 19:10:05Z);
  T4 poller thoát 18:12:16Z; HB 20:20:50Z chạy 20:15:34Z (−316 s, mẫu đứng
  yên — nhưng timestamp scheduler là host-side, không đo được đồng hồ cell);
  0 log cell-side nào trong (19:53:26Z, 20:30:33Z). Đồng hồ boot mới ĐÃ ĐƯỢC
  xác minh ĐÚNG (~+1 s vs Cloudflare lúc 20:43:19Z). Cùng nhóm không ước lượng
  được như #106/#107/#98/#101.
- **F-187-T0-4 — F-186-T9-3 ĐÃ KIỂM LẠI ĐỘC LẬP: đồng hồ NHANH ≥16 s trước
  reboot 7ea9d047 (giao T7-187).** Bằng chứng: ram-sampler-FROZEN.log
  (round186-t9) dòng 19:10:08Z ghi boot=cea79500 (FULL UUID) — sampler.sh đọc
  boot_id TƯƠI mỗi mẫu (trong loop, dòng 6) nên mẫu này thật sự chạy trên boot
  cũ 16 s SAU btime 7ea9d047 (19:09:52Z) → đồng hồ cell nhanh ≥16 s (T9-186
  ước 16–30 s — T0 chỉ khẳng định cận dưới 16 s). **Cảnh báo phương pháp
  (tự bắt):** replay-watch-186.log dòng cuối 19:10:05Z boot=cea79500 TRÔNG
  giống bằng chứng corroborating nhưng KHÔNG phải — replay-watch-186.sh cache
  BOOT8 một lần lúc khởi động (dòng 94), không đọc tươi mỗi poll. T0-187
  KHÔNG dùng dòng này làm bằng chứng.
- **F-187-T0-5 — libevent VẮNG lúc mở boot mới, CÓ sau replay (heal lần 3).**
  Bằng chứng: boot-survey 20:43:19Z `libevent-2.1.so.7 MISSING`; kiểm lại
  20:46:27Z file CÓ; dpkg.log ghi cài đặt 20:45–20:48Z (replay T5-187).
  O8 KHÔNG bị ảnh hưởng (WebKit dùng DEBROOT + libevent đã có trước O8
  11m42s; launch version 27.2, 0 lỗi). Mẫu: libevent vắng/có xen kẽ theo boot
  (#103 vắng, #104 có, #107 vắng→có sau replay, boot mới vắng→có sau replay).
- **F-187-T0-6 — POSTBOOT_PASS 7ea9d047 CHƯA CÓ (ghi nhận, KHÔNG phán tổng boot
  không cờ).** T0 kiểm trực tiếp: 0 file POSTBOOT_PASS* nhắc 7ea9d047 (grep
  phạm vi hẹp lúc ~20:43Z). Tổng boot không cờ GIỮ 23 theo quyết (c) đợt 185
  — có tăng lên 24 vì #105, và #106/7ea9d047 có tính thêm không, parent quyết
  (T5-187 xác nhận trạng thái cờ 7ea9d047; T5-186 đã ghi #105 KHÔNG CÓ).
- **F-187-T0-7 — (m) boot mới: 0 requeue trong cửa — T0 chỉ ghi số, KHÔNG phân
  loại (thuộc T2-187 + parent).** Bằng chứng (DB đọc tươi): 0 event
  `requeued_after_restart` trong [20:29:00Z, 20:33:00Z] và 0 event mới trong
  [20:25:00Z, 20:45:00Z] ngoài reconciled/dispatched; không run nào sống tại
  btime (run 187 finished 20:17:06Z trước btime; run 188 started 20:35:51Z
  sau btime). Trong chuỗi #95–#105, mọi reboot có run spanning đều có ≥1
  requeue tại btime+~35–42 s; boot mới là reboot thứ ba liên tiếp có 0 requeue
  (#106/#107 trước đó) — nhưng cả ba đều KHÔNG CÓ run spanning nên 0 requeue
  là hệ quả tất yếu, KHÔNG phải hiện tượng lạ như #104.
- **F-187-T0-8 — T0 chạy O8 TRƯỚC attempt T4 (đảo thứ tự so với đợt 186) —
  0 chồng lấn, gate được kiểm trước VÀ trong lúc chạy.** Lúc T0 kiểm gate
  (20:57:58Z): lock TRỐNG, T4 poll #14 vẫn chờ cửa yên (chưa có attempt nào),
  cờ T5 đã có 20:50:24Z, apt=0 — T0 acquire lock 20:58:09Z. Polls #17/#18/#19
  của T4 TRONG cửa sổ O8 đều ghi lock=co (T4 chờ, không khởi động attempt).
  Khác đợt 186 (T4 attempt1 mở trước, T0 hoãn O8 chờ xong): đợt này T4 chưa
  mở attempt nên T0 chạy trước là hợp lệ — lock là cơ chế serialize duy nhất,
  và T4 retry poll sau khi lock nhả (poll #20 lock=khong). T0 KHÔNG biết T4
  sẽ mở attempt lúc nào sau O8 (poller deadline 22:30:00Z); phán cuối về lượt
  yên #56 thuộc T4-187 + parent.
  **Đánh giá O8 boot mới theo mốc chuỗi 1 (quyết (b) THẬT đợt 185 — FULL PASS
  0→1):** chân O8 T0 trên boot mới ĐẠT (WebKit 21/21 ×2 + Chromium 21/21, sau
  cờ 7m45s, cùng boot 6f1d9f87, cờ replay-đầy-đủ poll=0 — mode/caveat thuộc
  T5-187 + parent). Chuỗi lên lại chỉ khi đủ 5 chân cùng boot mới (lượt yên
  #56 + gate (a) boot mới + O8 T0 + O8 T8 + harness) — các chân còn lại thuộc
  T4/T5/T8/T10-187, T0 KHÔNG phán chuỗi. Lưu ý: đợt 186 FULL PASS đề xuất
  1 → 0 (ĐỨT, thiếu chân lượt yên — T10-186 §10) nên đợt 187 bắt đầu lại từ 0
  nếu parent chấp nhận.
- **F-187-T0-9 — Scheduler gap 8.406 s (F-186-T0-2) ghi nhận, T7-187 lo phần
  phán.** T0-187 không kiểm lại gap (đã đóng cửa lúc đọc: execution cuối trước
  gap HB 15:20:50Z chạy 15:15:34Z; execution đầu sau gap 17:35:40Z — theo
  T0-186/T7-186). Không có gap mới trong phiên T0-187 (HB 20:20:50Z chạy
  −316 s đúng mẫu; doctor 20:00:00Z đúng giờ; run 188 dispatch 20:35:51Z
  đúng giờ).
- **F-187-T0-10 — X11 SẠCH sau O8 (khác đợt 186).** /tmp/.X11-unix/ TRỐNG,
  0 process Xvfb sót (kiểm 21:03:27Z). Display O8 của T0 (:188/:197) không để
  lại socket; socket X193 của đợt 186 (T4 attempt1) đã không còn.
- **F-187-T0-11 — Nguồn dùng trong LIMITS này: §12.3 aggregate 185 BẢN PARENT
  (quyết (a)–(r) — parent kiểm đếm KHỚP TỪNG SỐ lần thứ 96; §12.3 đợt 185 từng
  bị điền sẵn lần thứ 18 nhưng parent đã xác minh + chấp nhận với ba đính
  chính nội dung (b)/(j)/(k) + (p)/(q) trong lượt 21:35 +07) + aggregate 186
  T10-186 (96.703 B, đóng 20:59Z, 9/9 cờ — §12.3 CÒN TRỐNG, parent CHƯA quyết
  lúc T0-187 đóng).** Các quyết THẬT dùng: (a) CHẤP NHẬN đợt 185; (b) chuỗi
  FULL PASS 0→1; (c) POSTBOOT_PASS #104 đứng cho gate (a) KHÔNG caveat, #103
  KHÔNG CÓ cờ, tổng boot không cờ 23, #105 CHƯA CÓ — T5-186 lo; (e) #103/#104
  XÁC NHẬN, #105 chờ T0-186; (f) (m) #103 DƯƠNG (CUỐI); (g) n ứng viên 46/47,
  n chính thức GIỮ 14; (j) V2 (f'') chính thức + MỞ B2 TỪ ĐỢT 186; (n) run 184
  SUCCEEDED +1.184 s, CA ≥60 s 16 toàn lịch sử / 13 trong cửa sổ, run 185 kết
  cục thuộc T7-186; (p) chuỗi 0 vi phạm 0→1 (đợt sạch đầu tiên sau khi đứt);
  F-185-T1-1 giao T1-186; F-185-T2-2: (m) #104 thuộc T2-186; (q) đếm cuối đợt
  185 = 10/16/15/14, lũy kế 111–185 = 738/1.275/1.110/932, chuỗi 9/9 = 7.
  T0 KHÔNG tự thay đổi verdict nào; mọi số đếm/boot/O8 trong LIMITS này không
  bị ảnh hưởng bởi nguồn (chỉ các chuỗi/mốc tham chiếu (b)/(c)/(g)/(n)/(p)/(q)
  theo bản parent). Số liệu đợt 186 dùng trong LIMITS này (9/9 cờ, T9 trễ
  ~12', (m) #105 DƯƠNG, FULL150/FULL151, cửa slot KHÔNG LÀNH, 0 vi phạm 1→2
  đề xuất) là đề xuất của T10-186, CHƯA có quyết parent — parent quyết ở
  §12.3-186.

## Phạm vi chưa kiểm (không thuộc T0)

- Số hiệu boot mới + 7ea9d047 + cea79500 (parent quyết §12.3-186); (m) boot mới
  + (m) 7ea9d047 + INSIDE boot mới + INSIDE 7ea9d047 (T2-187); kết cục run 188
  + phán CA 202 s + HB/DR + cửa slot đợt 187 + outage gap 8.406 s (T7-187);
  POSTBOOT_PASS 7ea9d047 chi tiết + mode/caveat cờ boot mới (T5-187); lượt yên
  #56 (T4-187 — chưa mở attempt lúc T0 đóng; poller deadline 22:30:00Z);
  harness + O8 bộ thứ hai + B2 (T8-187, V2 chính thức); boot mới/7ea9d047 có
  giết holder không — phán cuối + prune lần 62 (T6-187); headroom + ENOSPC +
  balloon + E-229/E-232/E-233 (T9-187).
- Không kiểm lại dải FULL125–FULL152; không chạy lại suite T1 (chỉ O8); không
  xác minh actor của replay boot mới (ai cài đặt trước 20:50:24Z — thuộc
  T5-187); không kiểm lại nguyên nhân scheduler gap 8.406 s (xem F-187-T0-9)
  hay trigger của nó; không chạy `grep`/`find` đệ quy lúc mở đợt (bài học
  F-179-T9-6 — T0 đợt này chỉ đọc file trực tiếp theo đường dẫn đã biết, trừ
  hai grep POSTBOOT_PASS* có phạm vi hẹp lúc ~20:43Z + một find mtime có phạm
  vi hẹp lúc ~17:56Z của đợt trước để bracket #106 — không lặp lại đợt này).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round187-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round187-t0/appendix187.py` + `appendix187.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round187-t0/boot-survey-187t0.sh`
  + `boot-survey-187t0.txt` (output thô 9 nguồn boot mới — đo tươi 20:43:19Z;
  script ĐÃ SỬA đường dẫn marker theo F-185-T8-4)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round187-t0/wait-flag-187t0.sh`
  + `wait-flag-187t0.log` (chờ cờ T5-187: tìm thấy 20:50:26Z)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round187-t0/o8-driver-187t0.sh` +
  `o8-187t0.log` + `o8-lock.log` + `o8-driver-187t0.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-187t0.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)
