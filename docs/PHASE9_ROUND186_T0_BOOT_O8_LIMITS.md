# PHASE9_ROUND186_T0_BOOT_O8_LIMITS.md

Đợt 186 — T0 (boot survey + xác minh reboot mới + O8). Mở lượt cron 17:35:51Z
24/11/2026 (= 00:35 +07 25/11), đóng ~18:03Z 24/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.
Nguồn đứng: §12.3 aggregate 185 BẢN PARENT (79.029 B; quyết (a)–(r); parent kiểm
đếm KHỚP TỪNG SỐ lần thứ 96).

**BỐI CẢNH: đợt 186 mở MUỘN 3 giờ** — lượt cron 14:35:51Z 24/11 chỉ đóng đợt 185,
KHÔNG spawn luồng 186 nào (0 file round186 lúc mở đợt, parent kiểm trực tiếp).
Hai reboot #106 + #107 xảy ra trong khoảng trống không ai theo dõi; T0 khôi phục
từ hồ sơ lưu + DB tươi, ghi rõ hạn chế (tiền lệ F-183-T0-1).

## Kết quả chính

- **REBOOT #105 — XÁC NHẬN (đối chiếu từ hồ sơ lưu + DB đọc tươi)**:
  boot_id `053a35c3-5b54-4bcf-adf9-7d2eda54d26d` (khác #104 `9161bfd1`); btime
  **13:13:32Z** (epoch 1795526012; T7-185 đo uptime 45,80 s lúc 13:14:17Z →
  boot ~13:13:31Z + uptime 2.940,22 s lúc đóng → ~13:13:32Z — KHỚP; T9-185
  `uptime -s` 13:13:32Z — KHỚP; parent đã xác minh boot_id hiện tại lúc đó là
  053a35c3). DB đọc tươi hôm nay: requeue eid 10756 13:14:06.931Z = btime
  **+34,931 s** (T7-185 ghi +34,931 s — T0-186 kiểm lại bằng phép trừ epoch,
  KHỚP); run 185 started viết lại 13:14:07Z = btime +35 s; boot_gen
  `cron_boot_7c896c1e…` (#104) → `cron_boot_a5f49c21…` (#105).
  Gap #104→#105 = **7.190 s (1h59m50s)** — kiểm lại bằng phép trừ epoch, KHỚP
  T7/T9.
  **HẠN CHẾ (tiền lệ F-183-T0-1): nguồn journal/wtmp/last/who/CF KHÔNG đọc tươi
  lại được** — journal runtime-only hiện chỉ liệt kê #107; wtmp begins
  17:20:05Z (theo boot #107); `last reboot` chỉ còn #107; /proc/1 mtime + CF
  #105 không có trong hồ sơ T7/T9. Xác minh #105 dựa vào hồ sơ lưu T7-185
  (LIMITS §3 + appendix185.txt, giờ thật) + T9-185 (LIMITS §144) + DB đọc tươi
  hôm nay (requeue + boot_gen + started viết lại). Nếu parent yêu cầu chuẩn
  cao hơn, #105 không thể xác minh lại tươi được nữa vì boot đã chết.
- **REBOOT #106 — CHƯA XÁC MINH (không có btime đo được — xem F-186-T0-1)**:
  tồn tại theo suy luận (boot hiện tại #107, boot trước #105 — phải có đúng 1
  boot #106 ở giữa; parent cũng ghi #106 ~15:13Z, btime chính xác chưa biết).
  Khung cứng **(14:52:42Z, 17:19:50Z)**, rộng 8.828 s = 2h27m08s (dưới: run 186
  finished 14:52:42Z trên #105, không requeue → #106 sau đó; trên: btime #107).
  Ước tính theo mẫu — KHÔNG đo được, KHÔNG khẳng định: **~15:13:32Z**
  (btime #105 + 7.200 s đúng nhịp ~2h; gap #106→#107 khi đó = 7.578 s =
  2h06m18s, trong dải gap gần đây 6.878–7.670 s). 0 event
  `requeued_after_restart` trong [14:52:42Z, 17:35:51Z] (DB tươi, toàn job) →
  không run nào spanning #106 → (m) #106 không có offset. 0 file nào trên
  /var/log, /tmp, ~/.config, hidden_files (trừ round186) có mtime trong
  (14:52:42Z, 17:19:50Z) → không mốc cell-side nào bracket được #106.
  0 dòng runtime_restart_checkpoints updated trong [1795530000, 1795542000].
  Journal/wtmp/last chỉ còn #107.
- **REBOOT #107 — XÁC NHẬN 9 nguồn TƯƠI (đo 17:41:16Z)**: boot_id
  `cea79500-c3bc-4a95-ae6e-28ebdd36e06d` (khác #105 `053a35c3`); btime
  **17:19:50Z** (epoch 1795540790; uptime bracket ×3 khớp cùng giây —
  `uptime -s` 17:19:50Z, /proc/uptime 1286,47 s lúc 17:41:16Z → boot_est =
  btime −0,47 s; /proc/1 start_ticks 1523 = btime +15,23 s, stat mtime
  17:20:05.344Z = btime +15,344 s; journal idx 0 duy nhất, first 17:20:05Z =
  btime +15 s; wtmp begins 17:20:05Z; `last` reboot 17:20 still running;
  `who -b` Nov 24 17:20; Cloudflare ×1 (local 17:41:16Z vs CF 17:41:18 GMT,
  chênh +2 s — trừ ~1 s mạng → đồng hồ #107 ĐÚNG ~+1 s, như các đợt trước);
  DB: run 187 boot_gen MỚI cron_boot_54857bd6… (sched=started=claimed≈17:35:51Z,
  RUNNING lúc đọc — xem dưới); marker mtime không đổi).
  Gap #105→#107 = **14.778 s (4h06m18s — gộp 2 reboot, KHÔNG tách được khi
  chưa biết #106)**. #107 xảy ra SAU khi run 186 finished (14:52:42Z), TRƯỚC
  khi đợt 186 mở (17:35:51Z). 0 requeue tại #107 (xem F-186-T0-7).
- **Marker sống qua 59 reboot (#49–#107)** —
  `~/.config/vcut-persistence-marker` mtime 2026-11-20 11:39:47.272154981Z
  không đổi, 239 B (nội dung ghi boot #48). F-185-T8-4 ĐÃ SỬA: boot-survey-186t0
  .sh stat đúng đường dẫn marker (đường dẫn cũ stat LIMITS file — SAI).
- **Run 185 SUCCEEDED (DB đọc tươi — kết cục thuộc T7-186)**: finished
  14:31:59Z, status `succeeded`, timed_out false, attempt 1, boot_gen
  cron_boot_a5f49c21… (#105); **viết lại ×1 tại #105** (started → 13:14:07Z,
  eid 10756); SỚM hơn hạn 14:35:51Z **232 s (+3m52s)** — KHÔNG TIMEOUT.
  **claimed→finished = 94 s** (claimed 14:30:25Z) — ≥60 s, ỨNG VIÊN CA mới
  (phán cuối thuộc T7-186 — xem F-186-T0-3). 5 event (dispatched 10732 +
  requeued 10756 + dispatched 10757 + reattached 10758 + succeeded 10774).
  **Run 186 SUCCEEDED 14:52:42Z** (sched=started 14:35:51Z, attempt 1,
  boot_gen a5f49c21… KHÔNG đổi — vẫn #105; claimed 14:50:34Z;
  **claimed→finished = 128 s** — ≥60 s, ỨNG VIÊN CA mới, T7-186 phán cuối;
  wall sched→finished 1.011 s; 2 event: dispatched 10776 + succeeded 10783).
  Run 187 887c998d (sched=started 17:35:51Z): RUNNING lúc đọc, boot_gen
  cron_boot_54857bd6… (#107), claimed 17:35:52Z, event dispatched 10796.
  Run 185 + 186 SUCCEEDED liên tiếp — KHÔNG có timeout mới.
- **Scheduler gap 15:15:34Z–17:35:40Z = 8.406 s (số thô — T7-186 phán cuối,
  xem F-186-T0-2)**: execution cuối trước gap: HB 15:20:50Z chạy 15:15:34Z
  (−316 s, succeeded); execution đầu sau gap: HB 17:20:50Z + feed-pulse-23
  cùng start 17:35:40Z. **3 HB THIẾU** (không có row job_runs): 15:50:50Z,
  16:20:50Z, 16:50:50Z (HB mỗi 30 phút — mẫu 22/11 + 23/11 đều có đủ).
  HB 17:20:50Z MUỘN **+890 s**; feed-pulse-23 (sched 16:41:54Z) MUỘN **+3.226 s**.
  Đối chiếu 23/11 (OUTAGE 179): CÙNG mẫu đến từng giây (HB 15:20:50Z chạy
  15:15:34Z; HB 17:20:50Z +890 s; feed-pulse-23 +3.226 s; gap 8.406 s).
  Ghi chú: "OUTAGE scheduler 8.406 s" trong MEMORY = 8.406 GIÂY (dấu . hàng
  nghìn), không phải 8,406 s; cửa sổ OUTAGE 179 ghi 15:15:35–17:35:39Z =
  8.404 s (lệch 2 s do quy ước biên mở). Đối chiếu 22/11 (12:20–16:30Z):
  HB/feed-pulse/doctor chạy ĐẦY ĐỦ đúng giờ — gap KHÔNG phải mẫu hằng ngày.
- **(m) #105 — SỐ LIỆU THÔ, KHÔNG tự phân loại cuối (thuộc T2-186 + parent)**:
  requeue eid 10756 lúc 13:14:06.931Z = btime #105 **+34,931 s — TRỞ LẠI mẫu
  btime + ~35–40 s** (#102 +40,341; #103 +37,543; #105 +34,931); 1 run sống
  duy nhất tại btime (run 185); 1 requeue duy nhất. (m) #106 + (m) #107:
  0 requeue, không có offset (xem F-186-T0-7).
- **POSTBOOT_PASS #107 ĐÃ CÓ 17:48:46Z** (T5-186; T0 chỉ ghi nhận): file
  round186-t5/POSTBOOT_PASS, 324 B; mode **repair-sớm-quyết-h, poll=1**;
  dpkg 768 dòng, cache 107 .deb, lists 75; postboot PASS poll1 độc lập exit 0;
  cờ cũ 9161bfd1 lưu POSTBOOT_PASS-9161bfd1. Boot+28m56s (1.736 s).
  Mode/caveat thuộc T5-186 + parent. **#105 VẪN CHƯA CÓ cờ** (grep 0 file
  POSTBOOT_PASS* nhắc 053a35c3 — T5-186 lo; tổng boot không cờ parent quyết).
  **#104 VẪN CÓ cờ** (POSTBOOT_PASS-9161bfd1 backup trong round186-t5).
- **O8 trên boot #107 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (17:58:21–18:01:22Z)**: WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS
  17:58:37.518Z, Playwright mouse click lần 2), JSON 21 results, 21 ok=true,
  md5 `7413e219d6980cf0c3af9bf24a352140`; attempt2 exit=0, **21/21 PASS** (S1
  PASS 17:59:40.130Z), JSON 21 results, 21 ok=true, md5
  `18eda9e6502dfe0717819bd247568f3c`; Chromium exit=0, **21/21 PASS** (S1 PASS
  18:00:51.446Z, CDP mouse click lần 2), JSON 21 results, 21 ok=true, md5
  `eb14d47d235bd719cf23741bd6727ec1`. Đếm lại từ JSON gốc bằng python.
  **Cả ba bộ đều chạy SAU POSTBOOT_PASS #107 (17:48:46Z) 9m35s** (tiền lệ
  T0-185: sau cờ 32 s; T0-184: 77 s; T0-183: 59 s; T0-182: 89 s).
  **libevent-2.1.so.7 VẮNG lúc 17:41:16Z → CÓ lúc 17:50:53Z** (replay T5-186
  cài 17:48:17–17:48:44Z theo dpkg.log — heal lần 2, lần 1 là #104);
  WebKit launched version 27.2 (log 17:58:26Z + 17:59:31Z); 0 lỗi exit 127/
  launch-fail trong cả 3 bộ. dpkg 768 dòng trên #107 (wc -l dpkg.log lúc
  17:50:53Z — chỉ đọc file, không chạy dpkg/apt).
- **0 attempt chồng:** T4-186 MỞ attempt1 lúc 17:53:23Z (poll #11 CUA YEN MO)
  — T0 HOÃN O8, chờ attempt1 T4 xong (17:57:41Z, run-attempt exit=0) mới
  acquire lock (bài học F-184-T2-8 — kiểm gate trước VÀ trong lúc script dài
  chạy); polls #15/#16 (17:59:58Z/18:00:44Z, TRONG cửa sổ O8) đều ghi
  `lock=co:thread=t0-round186 pid=115134 port=5560` + blockers → cửa yên
  KHÔNG mở suốt O8; poll #17 (18:01:29Z, sau khi lock nhả) lock=khong;
  chain-t4.log không có attempt2 nào trong cửa sổ O8. O8 chỉ chồng pha poll
  của T4, 0 attempt. Lock t0-round186 giữ 181 s (17:58:21–18:01:22Z), đã nhả;
  lock TRỐNG sau O8. Lưu ý: T4 attempt1 20/20 NHƯNG LỚP B VI PHẠM (nhiễm tải
  — xem F-186-T0-8); T4 retry attempt2 sau O8.
- X11: 0 process sót (kiểm 18:02:00Z); socket /tmp/.X11-unix/X193 còn lại
  (mtime 17:53:28Z — của T4 attempt1, không phải display O8 :188/:197).
  Boot lúc T0 đóng vẫn cea79500 (kiểm cuối 18:02:23Z). Không có reboot mới
  trong phiên T0. LIMITS này ~21 KB.

## Giới hạn / sai số ghi nhận (F-186-T0-*)

- **F-186-T0-1 — Reboot #106 CHƯA XÁC MINH: không có btime đo được (xem Kết quả
  chính).** Bằng chứng T0 đã thử: (i) journal/wtmp/last chỉ còn #107
  (runtime-only, mất theo 2 reboot); (ii) DB tươi: 0 event
  `requeued_after_restart` trong [14:52:42Z, 17:35:51Z], toàn job — không run
  nào spanning #106 (khác mọi reboot #95–#103, mỗi reboot đều có ≥1 requeue
  khi có run spanning; #104 là reboot đầu tiên có 0 requeue — xem
  F-185-T0-2); (iii) 0 file trên
  /var/log, /tmp, ~/.config, hidden_files (trừ round186) có mtime trong
  (14:52:42Z, 17:19:50Z); (iv) 0 dòng runtime_restart_checkpoints updated
  trong [1795530000, 1795542000]; (v) không watcher/sampler nào sống sau
  13:41Z trên #105 (T9-185 dừng daemon lúc đóng). Ước tính ~15:13:32Z chỉ là
  mẫu nhịp ~2h + trùng con số parent ghi (~15:13Z, nguồn chưa rõ) — KHÔNG
  phải số đo, T0 KHÔNG khẳng định. Số hiệu #106 + gap #105→#106 + #106→#107
  chờ parent quyết (có chấp nhận ước tính mẫu hay để CHƯA XÁC MINH); (m) #106
  + INSIDE #106 (FULL152) thuộc T2-186 trên số thô 0 requeue này.
- **F-186-T0-2 — Scheduler gap 8.406 s TÁI DIỄN giống hệt OUTAGE 179 (số thô,
  T0 chỉ ghi, KHÔNG phán outage — thuộc T7-186 + parent).** Bằng chứng (DB
  đọc tươi): last execution HB 15:20:50Z finished 15:15:34Z; next execution
  17:35:40Z (HB 17:20:50Z + feed-pulse-23); 3 HB thiếu (15:50:50Z, 16:20:50Z,
  16:50:50Z — không row job_runs); HB 17:20:50Z +890 s; feed-pulse-23
  +3.226 s. Mọi mốc trùng 23/11 (OUTAGE 179) đến từng giây, kể cả thời điểm
  revive 17:35:40Z (11 s trước lượt cron 17:35:51Z). Đối chiếu 22/11: không
  gap. Lưu ý phương pháp: scheduler/daemon có thể chạy host-side (ngoài cell
  reboot) nên gap này KHÔNG ràng buộc được btime #106 — T0 không dùng gap
  để suy btime #106. T7-186 kiểm DR + cửa slot + phán outage mới hay không.
- **F-186-T0-3 — Run 185 + run 186: claimed→finished 94 s / 128 s (≥60 s —
  ỨNG VIÊN CA mới, T0 chỉ ghi số, KHÔNG phán — thuộc T7-186).** Bằng chứng
  (DB đọc tươi): run 185 claimed 1795530625 (14:30:25Z), finished 1795530719
  (14:31:59Z), chênh 94 s; run 186 claimed 1795531834 (14:50:34Z), finished
  1795531962 (14:52:42Z), chênh 128 s. Định nghĩa CA ≥60 s theo F-173-T7-2
  (T7-185 đếm: 16 ca toàn lịch sử / 13 ca trong cửa sổ từ run 154 — GIỮ
  NGUYÊN trước 2 ứng viên này). Nếu T7-186 xác nhận cả hai: số ca 13 → 15
  trong cửa sổ. Run 185 SUCCEEDED (margin +232 s) + run 186 SUCCEEDED —
  KHÔNG phải timeout; cả hai ca (nếu xác nhận) đều là ca SUCCEEDED, khác
  run 180/181 là ca timeout trong họ.
- **F-186-T0-4 — F-185-T8-4 ĐÃ SỬA (xem Kết quả chính — Marker).**
  `boot-survey-186t0.sh` stat `~/.config/vcut-persistence-marker` (mtime
  2026-11-20 11:39:47.272154981Z KHÔNG ĐỔI → sống qua 59 reboot #49–#107).
  Không còn nợ mở về F-185-T8-4.
- **F-186-T0-5 — libevent VẮNG lúc mở boot #107, CÓ sau replay (heal lần 2).**
  Bằng chứng: boot-survey 17:41:16Z `libevent-2.1.so.7 MISSING`; kiểm lại
  17:50:53Z file CÓ; dpkg.log ghi cài đặt 17:48:17–17:48:44Z (replay T5-186).
  O8 KHÔNG bị ảnh hưởng (WebKit dùng DEBROOT + replay xong trước O8 9m37s;
  launch version 27.2, 0 lỗi). Mẫu: libevent vắng/có xen kẽ theo boot
  (#103 vắng, #104 có, #107 vắng→có sau replay).
- **F-186-T0-6 — POSTBOOT_PASS #105 CHƯA CÓ (ghi nhận, KHÔNG phán tổng boot
  không cờ).** T0 kiểm trực tiếp: 0 file POSTBOOT_PASS* nhắc 053a35c3.
  Tổng boot không cờ GIỮ 23 theo quyết (c) đợt 185 — có tăng lên 24 vì #105
  hay không, parent quyết (T5-186 xác nhận trạng thái cờ #105).
- **F-186-T0-7 — Reboot #106 + #107: 0 requeue trong cửa — HIỆN TƯỢNG MỚI,
  T0 chỉ ghi số, KHÔNG phân loại (m) (thuộc T2-186 + parent).** Bằng chứng
  (DB đọc tươi): 0 event `requeued_after_restart` trong [14:52:42Z,
  17:35:51Z] (cửa đã khép hẳn lúc đọc, bao cả btime #106 lẫn btime #107);
  không run nào sống tại btime #106 hay #107 (run 186 finished 14:52:42Z
  trước #106; run 187 started 17:35:51Z sau #107). Trong chuỗi #95–#105,
  mọi reboot có run spanning đều có ≥1 requeue tại btime+~35–42 s; #104 là
  reboot đầu tiên có 0 requeue (F-185-T0-2 — 1 run spanning nhưng không bị
  requeue); #106/#107 là 2 reboot tiếp theo có 0 requeue — nhưng khác #104:
  ở đây KHÔNG CÓ run nào spanning nên 0 requeue là hệ quả tất yếu của
  khoảng trống 3 giờ không ai theo dõi, KHÔNG phải hiện tượng lạ như #104.
  (m) #106 + (m) #107 không có offset — T2-186 ghi nhận phạm vi.
- **F-186-T0-8 — T4 attempt1 20/20 NHƯNG LỚP B VI PHẠM (nhiễm tải) — T0 hoãn
  O8 chờ attempt xong, 0 chồng lấn (cùng cơ chế F-185-T0-6).** Lúc T0 kiểm
  gate lần 2 (17:53:49Z): T4 poll #11 CUA YEN MO 17:53:23Z + attempt1 đã
  chạy (play pass 1, 17:53:48Z) — T0 KHÔNG acquire lock, chờ attempt1 xong
  17:57:41Z (run-attempt exit=0) rồi mới chạy O8 17:58:21Z. Kết quả attempt1
  T4: 20/20 NHƯNG lớp B vi phạm (nhiễm tải, không dùng verdict — T4 retry
  attempt2 sau O8; phán cuối thuộc T4-186 + parent). T0 KHÔNG biết tác nhân
  nhiễm tải là gì (T0 chỉ chạy lệnh nhẹ: DB query, grep, cat dpkg.log — không
  chạy script nặng / không probe dpkg trong cửa sổ attempt; T5 replay apt
  17:48Z xong TRƯỚC khi attempt mở 17:53:23Z — chỉ ghi thời gian, không suy
  đoán cơ chế). O8 của T0 giữ lock suốt cửa sổ → T4 retry chờ qua O8
  (polls #15/#16 lock=co; poll #17 sau nhả lock lock=khong).
  **Đánh giá O8 #107 theo mốc chuỗi 1 (quyết (b) THẬT đợt 185 — FULL PASS
  0→1):** chân O8 T0 trên #107 ĐẠT (WebKit 21/21 ×2 + Chromium 21/21, sau
  cờ 9m35s, cùng boot #107, cờ repair-sớm-quyết-h poll=1 — mode/caveat
  thuộc T5-186 + parent). Chuỗi lên lại chỉ khi đủ 5 chân cùng boot #107
  (lượt yên #55 + gate (a) #107 + O8 T0 + O8 T8 + harness) — các chân còn
  lại thuộc T4/T5/T8/T10-186, T0 KHÔNG phán chuỗi.
- **F-186-T0-9 — Đồng hồ cell NHANH/CHẬM trước #106/#107: KHÔNG ước lượng
  được.** Bằng chứng: không poll/log nào trên #106 (không watcher/sampler
  sau 13:41Z trên #105; scheduler gap 15:15:34–17:35:40Z không có execution
  nào); trước #107 cũng không có nguồn (HB 17:20:50Z scheduled SAU btime
  #107 60 s; execution đầu sau btime là 17:35:40Z). Đồng hồ #107 ĐÃ ĐƯỢC
  xác minh ĐÚNG (~+1 s vs Cloudflare lúc 17:41:16Z). Khác các ca trước
  (#95/#96/#97/#99/#100/#102/#103 có delta đo được từ poll cuối watcher;
  #98/#101 không ước lượng được — #106/#107 cùng nhóm không ước lượng được).
- **F-186-T0-10 — Socket X193 sót sau T4 attempt1 (ghi nhận, không phải của
  T0).** /tmp/.X11-unix/X193 mtime 17:53:28Z, 0 process Xvfb sót (kiểm
  18:02:00Z). Display O8 của T0 (:188/:197) không để lại socket. T4-186
  dọn hoặc ghi nhận theo quy trình của mình; T0 không xóa file của luồng khác.
- **F-186-T0-11 — Nguồn dùng trong LIMITS này: §12.3 aggregate 185 BẢN PARENT
  (quyết (a)–(r) — parent kiểm đếm KHỚP TỪNG SỐ lần thứ 96; §12.3 đợt 185
  từng bị điền sẵn lần thứ 18 nhưng parent đã xác minh + chấp nhận với ba
  đính chính nội dung (b)/(j)/(k) — T0 dùng bản parent này, KHÔNG dùng đề
  xuất T10 ở §10.6).** Các quyết THẬT dùng: (a) CHẤP NHẬN đợt 185; (b) chuỗi
  FULL PASS 0→1; (c) POSTBOOT_PASS #104 đứng cho gate (a) KHÔNG caveat,
  #103 KHÔNG CÓ cờ, tổng boot không cờ 23, #105 CHƯA CÓ — T5-186 lo; (e)
  #103/#104 XÁC NHẬN, #105 chờ T0-186; (f) (m) #103 DƯƠNG (CUỐI); (g) n ứng
  viên 46/47, n chính thức GIỮ 14; (j) V2 (f'') chính thức + MỞ B2 TỪ ĐỢT 186;
  (n) run 184 SUCCEEDED +1.184 s, CA ≥60 s 13 ca trong cửa sổ, run 185 kết
  cục thuộc T7-186; (p) F-184-T2-8 đã đứt, chuỗi 0 vi phạm 0→1 (đợt sạch đầu
  tiên sau khi đứt); F-185-T8-4 giao T0-186; F-185-T1-1 giao T1-186; (q) đếm
  cuối đợt 185 = 10/16/15/14, lũy kế 111–185 = 738/1.275/1.110/932, chuỗi
  9/9 = 7. T0 KHÔNG tự thay đổi verdict nào; mọi số đếm/boot/O8 trong LIMITS
  này không bị ảnh hưởng bởi nguồn (chỉ các chuỗi/mốc tham chiếu (b)/(c)/
  (g)/(n)/(p)/(q) theo bản parent).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #104 (thuộc T2-186 theo quyết (p) đợt 185 — T0-185 đã ghi số thô 0
  requeue, không phân loại lại) + (m) #105/#106/#107 + INSIDE #104 (FULL150)
  + INSIDE #105 (FULL151) + INSIDE #106 (FULL152) (T2-186); kết cục run 185/
  186 (SUCCEEDED — số thô) + phán CA ≥60 s + HB/DR + cửa slot đợt 186 +
  outage gap 8.406 s (T7-186); POSTBOOT_PASS #105 chi tiết + mode repair
  #107 (T5-186); lượt yên #55 (T4-186 — attempt1 20/20 lớp B vi phạm, retry
  attempt2 sau O8; poll-wait deadline 19:30Z); harness + O8 bộ thứ hai +
  B2 (T8-186, V2 chính thức); #105/#106/#107 có giết holder không — phán
  cuối + prune lần 61 (T6-186); headroom + ENOSPC + balloon + E-229 (T9-186).
- Không kiểm lại dải FULL125–FULL152; không chạy lại suite T1 (chỉ O8); không
  xác minh actor của replay #107 (ai cài đặt trước 17:48Z — thuộc T5-186);
  không kiểm lại nguyên nhân scheduler gap 8.406 s (xem F-186-T0-2) hay
  trigger của nó; không chạy `grep`/`find` đệ quy lúc mở đợt (bài học
  F-179-T9-6 — T0 đợt này chỉ đọc file trực tiếp theo đường dẫn đã biết,
  trừ hai grep POSTBOOT_PASS* có phạm vi hẹp lúc ~17:41Z và ~17:50Z + một
  find mtime có phạm vi hẹp lúc ~17:56Z để bracket #106).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round186-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round186-t0/appendix186.py` + `appendix186.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round186-t0/boot-survey-186t0.sh`
  + `boot-survey-186t0.txt` (output thô 9 nguồn #107 — đo tươi 17:41:16Z;
  script ĐÃ SỬA đường dẫn marker theo F-185-T8-4)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round186-t0/o8-driver-186t0.sh` +
  `o8-186t0.log` + `o8-lock.log` + `o8-driver-186t0.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-186t0.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)
