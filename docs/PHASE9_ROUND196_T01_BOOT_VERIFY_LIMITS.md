# PHASE9_ROUND196_T01_BOOT_VERIFY_LIMITS.md

Đợt 196 — T01 (gộp T0+T1: boot survey + O8 + verify đếm + GAP §124).
Mở lượt cron 21:35:51 +07 26/11/2026 (= 14:35:51Z); survey đo tươi 14:40:27Z,
O8 14:43:14–14:48:54Z. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag. Nguồn đứng: **§14.2 aggregate 195 BẢN
PARENT-KIỂM (68.559 B; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 133, dedup python
+ kiểm chéo shell viết mới; §14.2-195 SẠCH — parent viết trực tiếp, lần sạch
thứ tư kể từ đợt 179 (179, 183, 191, 195); tổng điền sẵn GIỮ 18)**. T01 KHÔNG
khẳng định §14.2-195 theo nguồn nào khác (theo hồ sơ đứng MEMORY.md + aggregate
195 + nhật ký ngày — mục "Đợt 195 — PARENT KIỂM LẠI (~11:47Z)" KHÔNG phải do
parent viết, đã đính chính; số 133 trong mục đó là trùng). **CẬP NHẬT CUỐI
16:36Z: máy reboot THÊM lần nữa trong phiên — ứng viên #124 (611a02f2,
btime 16:28:18Z, gap #123→#124 = 7.082 s); T01 đóng cờ sau reboot này; T7/T8/T9
chưa có cờ lúc T01 đóng (process chết theo reboot #124 — xem F-196-T01-7).**

**BỐI CẢNH: đợt 195 đã đóng (parent CHẤP NHẬN CÓ ĐIỀU KIỆN ở §14.2-195).**
Đợt 196 là đợt thứ sáu theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn thiện
sản phẩm; Editing Core — parity preview/render). T10-196 do lượt cron sau spawn
để đóng sổ; T01 KHÔNG đóng sổ.

## Kết quả chính

- **REBOOT MỚI NỮA TRONG PHIÊN — XÁC NHẬN 9 nguồn TƯƠI (đo 14:40:27Z)**: boot_id
  `bc09b26e-18f4-4c64-acf6-09aefc5946ec` (khác boot trước `8c4aa907` #121 và khác
  `2f268a28` #122 theo quyết (e)-195); btime **14:30:16Z** (epoch 1795703416;
  uptime bracket khớp cùng giây — `uptime -s` 14:30:16Z, /proc/stat btime
  1795703416, /proc/uptime 611,49 s lúc 14:40:27Z → boot_est = btime +0,49 s;
  /proc/1 start_ticks 1791 = btime +17,91 s, stat mtime 14:30:33.932Z = btime
  +17,93 s; journal idx 0 duy nhất, first 14:30:34Z = btime +18 s; wtmp begins
  14:30:34Z; `last` reboot 14:30 still running; `who -b` Nov 26 14:30;
  Cloudflare đo chặt (local mid 14:40:27Z vs CF-Date 14:40:29 GMT, chênh +2 s
  — đồng hồ ĐÚNG trong ±2 s; marker mtime không đổi).
  Gap #122→mới = **11.556 s (3h12m36s)** NẾU btime #122 đúng. Boot mới xảy ra
  SAU khi run 201 SUCCEEDED (11:47:31Z), TRƯỚC khi đợt 196 mở (14:35:51Z).
  Boot #122 sống 11.556 s rồi chết (NẾU btime #122 đúng).
- **Số hiệu mới — ỨNG VIÊN #123 (parent quyết (e) ở aggregate 196)**:
  1c0bcaad = **#117 XÁC NHẬN** theo quyết (e)-193; 8a23277a = **#118 XÁC
  NHẬN** theo quyết (e)-193; 55c9e0b7 = **#119 XÁC NHẬN** theo quyết (e)-194;
  ac8a88aa = **#120 ỨNG VIÊN** theo quyết (e)-194 (parent KHÔNG xác nhận số
  hiệu #120 — chỉ ghi #120 KHÔNG CÓ cờ); 8c4aa907 = **#121 XÁC NHẬN** theo
  quyết (e)-195; 2f268a28 = **#122 ỨNG VIÊN** theo quyết (e)-195 (chưa xác
  minh độc lập — xem F-196-T01-3) → bc09b26e = **#123** theo hệ quả trực tiếp.
- **Marker sống qua 73 reboot đã xác nhận (#49–#121)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). 75 nếu #122 + #123 đều xác nhận;
  76 nếu #124 cũng xác nhận.
- **#122 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI NỮA (F-196-T01-3):**
  journal/wtmp/dpkg chỉ còn boot hiện tại (#123) — #122 đã chết 14:30:16Z
  trước khi T01-196 mở phiên. Tồn tại của #122 được CỦNG CỐ bằng 3 nguồn độc
  lập: (i) boot_gen đổi run 200 (5b654332) → run 201 (4ececfeb) — reboot xảy
  ra giữa run 200 xong 10:12:46Z và run 201 bắt đầu 11:35:51Z; (ii) khoảng lặng
  #A 10:12:46Z → 11:35:41Z bao trùm btime #122 (11:17:40Z theo (e)-195);
  (iii) round195-t10.done mtime 11:45:52Z — T10-195 đóng đợt 195 TRÊN boot
  #122 (run 201), chứng minh #122 đã up và chạy được lượt agent đầy đủ. NHƯNG
  btime 11:17:40Z + boot_id 2f268a28... (chỉ có trong quyết (e)-195 của parent
  — T01 không tìm thấy nguồn độc lập nào khác trên đĩa ghi 2 giá trị này)
  KHÔNG xác minh được độc lập — parent quyết (e) cho cả #122 và #123.
  Gap #121→#122 = 10.535 s (2h55m35s) NẾU btime #122 đúng.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-196 + parent)**:
  **0 event `requeued_after_restart`** cho #122 VÀ #123 (cả ngày 26/11 chỉ có
  1 requeue: eid 11258, run 198, 04:24:12Z = (m) #120, đã phân loại CUỐI) và
  **0 event BẤT KỲ** trong [11:15:00Z; 11:22:00Z] và [14:28:00Z; 14:38:00Z]
  (DB đọc tươi) — cửa (m) #122 [11:18:13Z; 11:18:29.8Z] trống hoàn toàn; cửa
  (m) #123 [14:30:49Z; 14:31:05.8Z] trống hoàn toàn. Không run nào sống tại
  btime: run 200 SUCCEEDED 10:12:46Z (trước btime #122 3.894 s); run 201
  SUCCEEDED 11:47:31Z (bắt đầu sau btime #122 1.091 s, xong trước btime #123
  9.765 s); run 202 (b182d011) sched/started 14:35:51Z = **btime #123 +335 s**,
  status running lúc đọc 14:40Z, boot_gen `cron_boot_2c4cb8ea…` (mới — chỉ
  ghi nhận, KHÔNG dùng đếm chuỗi đổi gen, xem F-194-T7-2) — **nhưng sau
  reboot #124, started_at của run 202 BỊ VIẾT LẠI** (xem bullet #124 dưới —
  F-196-T01-8). **Khác #120** (1 requeue vì
  run 198 spanning, +47,01 s): ở đây 0 requeue vì không run nào spanning — cùng
  mẫu #109/#112/#114/#115/#117/#119/#121 (0 requeue, không run spanning).
  Phân loại CUỐI thuộc T2-196 + parent. (m) #121 THÔ 0 requeue (T01-195) —
  phân loại CUỐI cũng thuộc T2-196.
- **Run 200 SUCCEEDED cf 9 s** (sched 08:35:51Z, claimed 10:12:37Z, finished
  10:12:46Z) — kết cục thuộc T7-196. **Run 201 SUCCEEDED cf 6 s** (sched
  11:35:51Z, claimed 11:47:25Z, finished 11:47:31Z) — lượt cron 18:35 +07
  (đóng đợt 195, T10-195); kết cục thuộc T7-196. Chuỗi SUCCEEDED 5 → 7 đề
  xuất từ đợt 195 — T7-196 chốt.
- **HAI khoảng lặng scheduler MỚI (F-196-T01-2) — mỗi lặng BAO TRÙM một reboot:**
  lặng #A **4.974 s (10:12:46.713Z → 11:35:41.152Z)** bao trùm btime #122
  (lặng bắt đầu trước reboot 3.893 s; hồi phục sau reboot 1.081 s); lặng #B
  **6.826 s (12:41:54.161Z → 14:35:40.437Z)** bao trùm btime #123 (lặng bắt
  đầu trước reboot 6.502 s; hồi phục sau reboot 324 s). 0 event scheduler BẤT
  KỲ (mọi job) trong mỗi lặng; event ID liên tục qua lặng (11326 → 11327;
  11351 → 11352 — 0 event bị mất khỏi bảng). Hồi phục #A: heartbeat due
  11:20:50Z started 11:35:41Z (trễ 891 s); feed-pulse-17 due 10:41:54Z started
  11:35:41Z (trễ 3.227 s); doctor 11:00Z VẮNG. Hồi phục #B: heartbeat due
  14:20:50Z started 14:35:40Z (trễ 890 s); feed-pulse-20 due 13:41:54Z started
  14:35:40Z (trễ 3.226 s); doctor 13:00Z + 14:00Z VẮNG. Lặng #B 6.826 s là
  lớn thứ hai trong họ (sau 8.406 s đợt 179; trên 5.739 s đợt 195, 4.807 s
  đợt 194). 4 lặng trong ~11,5 giờ ngày 26/11 (onset 01:15:34Z, 07:00:00Z,
  10:12:46Z, 12:41:54Z) — failure mode LẶP LẠI, tần suất đang tăng. Phân loại
  thuộc T7-196 + parent (n).
- **POSTBOOT_PASS #123 CÓ 14:41:58Z (T56-196; T01 kiểm độc lập khớp)**:
  file `round196-t56/POSTBOOT_PASS`, 315 B, md5 theo cờ T56-196; mode
  **replay-day-du, poll=0**; dpkg **1.477** dòng (= `wc -l /var/log/dpkg.log`
  T01 kiểm độc lập — nguồn thứ ba khớp cờ + watcher), cache 171 .deb, lists
  37; postboot PASS poll0 độc lập exit 0 lúc 14:41:58Z; **boot+11m42s**; cờ cũ
  #121 backup `POSTBOOT_PASS-8c4aa907`. **Replay #123 ĐÃ CHẠY (dạng A):**
  dpkg.log bắt đầu 14:35:47Z (boot+5m31s) rồi cài liên tục tới 14:39:00Z
  (1.477 dòng) — install cuối gstreamer1.0-tools (apt history End-Date
  14:39:00Z). **GST #123 là THƯ MỤC THẬT (269 file = debroot 269)** theo
  preflight T4-196 14:41Z — giống #117/#121, KHÁC #119 (symlink). **O8 chạy
  SAU khi cờ #123 có 1m16s** (cờ 14:41:58Z, O8 14:43:14Z) — ĐÚNG quy trình
  (khác đợt 195, F-195-T01-3).
  **POSTBOOT_PASS #122 KHÔNG CÓ — KHÔNG VIẾT ĐƯỢC post-hoc** (T56-196 chưa
  viết cờ cho #122; #122 đã chết trước khi T56-196 mở phiên; viết cờ
  không-verify là bịa đặt — tiền lệ #118/#120). **Tổng boot không cờ 29 →
  30** nếu parent chấp nhận #122 không cờ (quyết (c)).
- **Watcher-195 CHẾT ~10:14:39Z, TRONG lặng #A — KHÔNG phải chết theo reboot #122**
  (đính chính theo T56-196 F-196-T56-6 — cách nói "chết theo reboot" của T01-196 là
  nói lỏng): poll cuối 10:14:39Z trên 8c4aa907, KHÔNG còn process lúc survey, KHÔNG có
  dòng END/STOP/NEWBOOT; chết **~1h03m TRƯỚC reboot #122 (11:17:40Z)** và ~4h21m
  TRƯỚC hạn 14:35:51Z; cơ chế chết CHƯA XÁC ĐỊNH (đóng băng VM vs teardown runtime).
  Khoảng không-watcher ~4h27m17s (10:14:39Z → 14:41:56Z) — bao ~1h03m cuối đời #121 +
  toàn bộ đời #122 + 11m40s đầu #123; mẫu hệ thống lần thứ tư liên tiếp bao trọn một
  boot (#116, #118, #120, #122). **Watcher-196 đã spawn** (START 14:41:56Z, pid 7775,
  hạn 17:35:51Z — T56-196; T01 kiểm ps: không còn watcher-195).
- **REBOOT #124 TRONG PHIÊN — ỨNG VIÊN #124, XÁC NHẬN 9 NGUỒN TƯƠI (survey
  16:29:48Z, sau khi T01 ngủ 25 phút và bị SIGTERM)** (F-196-T01-7): boot_id
  `611a02f2-7a7b-4dcb-9752-ae50a1fa1a48` (khác `bc09b26e` #123); btime
  **16:28:18Z** (epoch 1795710498; `uptime -s` 16:28:18Z; /proc/uptime 90,26 s
  lúc 16:29:48Z → boot_est = btime +0,26 s; /proc/1 start_ticks 1261 = btime
  +12,61 s, stat mtime 16:28:30.952Z = btime +12,95 s; journal idx 0 duy nhất,
  first 16:28:31Z = btime +13 s; wtmp begins 16:28:31Z; `last` reboot 16:28
  still running; `who -b` Nov 26 16:28; Cloudflare đo chặt: local mid
  16:29:48Z vs CF-Date 16:29:50 GMT, chênh +2 s — đồng hồ ĐÚNG trong ±2 s;
  marker mtime không đổi). Gap **#123→#124 = 7.082 s (1h58m02s)** — boot #123
  sống 7.082 s rồi chết. libevent **VẮNG** lúc survey (boot+1m30s — giống
  #112/#115/#116/#117/#119, VẮNG lúc mở boot, CÓ sau replay); dpkg.log 2 dòng
  (replay mới bắt đầu — apt-get đang chạy lúc survey). **POSTBOOT_PASS #124
  CHƯA CÓ** (cờ trong `round196-t56/` lúc survey vẫn là cờ #123, 315 B,
  14:41Z — T56-197 viết cờ #124; T01 không viết cờ thay). **Watcher-196 CHẾT
  theo reboot #124** (ALIVE lúc poll 15:03:14Z của T56-196; KHÔNG còn process
  lúc survey #124 — T56-197 spawn watcher-197, kiểm ps trước theo quy tắc
  đứng).
- **(m) #124 — SỐ LIỆU THÔ (thuộc T2-197 + parent, KHÔNG tự phân loại)**:
  **1 requeue** — eid 11383, run 202 (vcut-build-loop), 16:29:07.121Z = **btime
  +49,121 s**, TRONG cửa [btime+33; btime+49,8] = [16:28:51Z; 16:29:07,8Z] →
  **DƯƠNG (THÔ)**. Event cuối TRƯỚC btime: succeeded heartbeat 16:15:34.686Z
  eid 11382; event đầu SAU btime: requeue eid 11383 (liên tục 11382 → 11383);
  tiếp theo dispatched run 202 eid 11384 16:29:07.180Z + reattached_after_restart
  eid 11385 16:29:07.257Z. Khoảng 16:15:34.686Z → 16:29:07.121Z = **812 s**
  không có event — **KHÔNG đủ bằng chứng gọi là lặng** (khác #A/#B: chưa xác
  minh được job nào due VẮNG trong khoảng — doctor 16:00Z đã chạy, heartbeat
  tiếp theo ~16:44Z, doctor tiếp theo 17:00Z; T7-197 kiểm slot). **Run 202 bị
  VIẾT LẠI sau reboot (F-196-T01-8)**: started_at 1795703751 (= sched, T01 đọc
  lúc 14:40Z) → **1795710547** (16:29:07Z = btime #124 +49 s, sau requeue eid
  11383); boot_gen 2c4cb8ea → **7feb76ab** (đổi theo reboot — KHÔNG dùng đếm
  chuỗi đổi gen, F-194-T7-2); claimed GIỮ 1795703751; status RUNNING lúc đọc
  16:30Z. Sleep nền của T01-196 bị SIGTERM ~16:28Z (850 s/1.200 s) — reboot
  #124 cắt phiên làm việc của run 202 giữa chừng; session T01 sống lại sau
  reattach (eid 11385).
- **Cờ các luồng khác lúc T01 đóng (16:36Z) — 8/11 cờ có nội dung; T7/T8/T9
  THIẾU (process chết theo reboot #124; T10-196 quyết)**: P1-196 TD-PSOLA
  pitch-shift đã implement (offline core + AudioWorklet + preview wiring;
  headed 35/40 in-band, AM 39/40 harmonic; 440 Hz tệ nhất 0,27 — 195: 0,72;
  giới hạn vật lý: ratio nguyên r=0,5 cho output = input, không shift —
  PSOLA đối xứng); P2-196 `fps: 30` ĐÃ GHI + **N10 blend dọc sau bob w=0,75
  THẮNG tap-P4, đã ship** (gap +0,468 → −0,013 MAD; phát hiện PHA: lệch
  −0,5px mới đúng, +0,5px tệ hơn cả bob thuần; ngưỡng σ̂ hiệu chuẩn lại 2,7
  trên khung đã mã hóa; N5b gap KHÔNG thu được bằng denoise nhẹ — cơ chế đã
  rõ; FPS bob không hồi quy trên clip sạch 1,02×); P3-196 cap drift 0,5 →
  0,3 s đã implement + đo headed: drift tuyệt đối max **0,485 s (longA) /
  0,481 s (longB)** — DƯỚI bar 0,5 s, đúng bằng delta siết cap; decode cửa sổ
  KHÔNG đạt bar 5.000 ms (longA đầu 10.765 ms, longB 5.053 ms); P4-196
  harness **47/54 ĐẠT** (N5b + N11a-longA → ĐẠT; longB P3 0,481 s có lọc S2
  vs P4 0,537 s không S2 — quy tắc S2 chờ chấp nhận); T2-196 (m) #121 +
  #122 = **KHÔNG CÓ ĐIỂM (CUỐI)**, n GIỮ 54/55; (m) #123 THÔ 0 requeue
  (phân loại CUỐI thuộc T2-197 — cùng #124); F-195-P4-3b VI PHẠM NHẸ; lỗ
  mù H-U22 = 6,771 s + H-U23 = 4,861 s; T4-196 **lượt yên #64 KHÔNG CÓ LƯỢT
  HỢP LỆ — 0/3 attempt hợp lệ** (cả 3 đều 20/20 probe NHƯNG B2 load1_max
  6,55/5,06/5,42 > 4 VÀ tickCost median 84,0/67,0/67,0 ms > 60 — chuỗi lượt
  yên hợp lệ 1 → 0 ĐỨT; live-check #15 KHÔNG ĐẠT, chuỗi live ĐẠT 10 → 0;
  P3' cộng dồn GIỮ NGUYÊN 51 lượt hợp lệ; B2 dữ kiện thứ 8 — cả 3 cửa sổ đều
  spike tự-tải); T56-196 (A) 120/120 lần 45, suite 9/9 × 6, chuỗi xanh 76 →
  77, holder #122 25 → 26, #123 → 27. **Kích thước LIMITS vs trần push
  37.768 B**: T2 43.715 B **VƯỢT (+5.947 B)**, T56 43.020 B **VƯỢT (+5.252 B)**,
  T4 37.724 B (dưới trần 44 B), P1 29.808 B, P2 28.487 B, P3 25.167 B,
  P4 16.908 B, T01 30.559 B (sau cập nhật cuối).
- **libevent CÓ lúc survey (boot+10m11s)** — giống #121 (CÓ lúc survey sau
  replay), khác #119 (VẮNG lúc survey); dpkg.log 1.477 dòng lúc survey (bằng
  #121 — nhưng dpkg.log đã reset theo boot #123, xem trên; so sánh số dòng
  xuyên boot KHÔNG còn ý nghĩa — F-195-T8-4).
- **O8 trên boot mới — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (14:43:14–14:48:54Z, 5m40s)**: SAU cờ #123 1m16s (xem trên). WebKit
  attempt1 exit=0, **21/21 PASS** (S1 PASS 14:43:59Z, Playwright mouse click
  lần 2; launched version 27.2), JSON 21 results, 21 ok=true, md5
  `3c98bdf2d1667156846a68e35aab590e`; attempt2 exit=0, **21/21 PASS** (S1 PASS
  14:45:39Z; launched 27.2), JSON 21 results, 21 ok=true, md5
  `6aa3b6e68ba2ec1334672b7db7bd530b`; Chromium exit=0, **21/21 PASS**, JSON 21
  results, 21 ok=true, md5 `9ddb5fa81507dc5f2d7c4883e8372200`. Đếm lại từ JSON
  gốc bằng python; JSON stamped theo lượt khớp md5 với bản copy. **0 lỗi exit
  127 / launch-fail** trong cả 3 bộ (3 dòng chứa "127" trong log đều là
  http://127.0.0.1:8861/8851 bridge OK). Script gốc KHÔNG đổi so với đợt 195
  (webkit 4994b4fc, headed c8acd72e); preview.tsx lúc O8 = **591f9655** (CHẮC
  — mtime 14:51:38Z, sau O8); media.ts KHÔNG CHẮC (mtime 14:43:14.760Z, đúng
  giây driver bắt đầu — xem F-196-T01-5). dpkg.log 1.477 dòng trên boot mới
  (khớp cờ T56-196). O8 T8-196 **KHÔNG có cờ lúc T01 đóng** (process chết
  theo reboot #124 — T10-196 quyết; hai bộ O8 đợt này KHÔNG cùng cây —
  xem F-196-T01-5).
- **O8 chạy TRONG LÚC T4 chỉ poll — 0 chồng lấn**: T4 chưa mở attempt1 lúc
  O8 chạy (poll #9 14:47:22Z + poll #10 14:48:12Z ghi lock=co t01-round196,
  KHÔNG mở attempt; poll #11 14:48:58Z lock=khong sau release; poll #12
  14:49:43Z load1=0,61 lock=khong blockers=0 — T4 sắp mở attempt1 sau O8).
  T01 acquire lock 14:43:14Z khi lock TRỐNG, giữ ~5m40s, đã nhả 14:48:54Z.
  Phán cuối về lượt yên #64: **T4-196 — 0/3 attempt hợp lệ, KHÔNG CÓ LƯỢT
  HỢP LỆ** (chuỗi 1 → 0 ĐỨT; live-check #15 KHÔNG ĐẠT — xem bullet cờ các
  luồng trên).
- X11: 0 process Xvfb của T01 sót sau O8 (/tmp/.X11-unix TRỐNG sau O8).
  Boot lúc O8 xong vẫn bc09b26e. Không có reboot mới trong lúc O8 chạy.

## Đếm — MỐC ĐẾM CUỐI (hai phương pháp khớp nhau; xem F-196-T01-4)

- **Verdict CUỐI (đếm cuối 16:30:39–16:33:11Z, SAU reboot #124; hai phương
  pháp KHỚP TỪNG SỐ): 8/11 batch, đợt 196 = 8/40/39/24.**
  Tái kiểm 111–195 KHỚP quyết parent (q) đợt 195 TỪNG SỐ; đợt 190 = 0/0/0/0
  (VOID); 0 file thiếu; chuỗi khớp nối dài lần thứ **135** (T01-196 cuối —
  python + shell khớp nhau). Batch của chính T01 ĐÃ BAO trong đếm cuối (stage
  14:54:52Z, TRƯỚC khi đếm cuối 16:30:39Z — khác tiền lệ F-195-T10-1: đếm
  cuối T01 đợt 195 không bao batch của chính mình do stage sau khi đếm).
  Các batch stage SAU mốc này (nếu T7/T8/T9 giao muộn + batch closing) thuộc
  đếm lại của T10-196 — T10 chạy lại hai phương pháp sau closing.
- **Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)**: phương pháp
  1 (python) `recount-196-t01.py` — quét toàn bộ `phase9-round*.txt`, sắp
  xếp theo SỐ ROUND tăng dần, chuẩn hoá đường dẫn tuyệt đối về tương đối
  trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn — tiền lệ đợt 126–127),
  kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa; phương pháp 2 (shell)
  `crosscheck-196-t01.sh` — chỉ dùng `tr` / `sort -u` / `comm` / `wc`:
  union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union
  (trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa (đường
  dẫn tuyệt đối kiểm trực tiếp, không ghép prefix — bài học F-188-T10-1).
- **Mốc đếm TẠM (0/11 cờ: chưa luồng nào stage; 0 file đợt 196 lúc bắt đầu
  VÀ lúc kết thúc đếm)**:
  quét **1.485 file** `phase9-round*.txt` (round 1–195, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.414; tổng đường
  dẫn duy nhất toàn cục 4.104.
- **Đợt 196 (TẠM) = 0/0/0/0.**
- **Lũy kế 111–196 (TẠM) = 837/1.544/1.316/1.121. Chờ push (TẠM) =
  59/195/145/126 (191+192+193+194+195). Tổng 1–196 (TẠM) = 1.485/7.414/4.104.**
- **Chuỗi khớp CUỐI: 133 (parent-195) → 134 (T01-196 tạm, python only)
  → 135 (T01-196 cuối, python + shell khớp nhau).**
- **Mốc đếm CUỐI (CHỐT 16:30:39–16:33:11Z, SAU reboot #124 — 8 file
  `phase9-round196-*.txt`, 8 batch: P1/P2/P3/P4/T01/T2/T4/T56; T7/T8/T9
  chưa stage)**:
  quét **1.493 file** `phase9-round*.txt` (round 1–196, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.454; tổng đường
  dẫn duy nhất toàn cục 4.128.
- **Đợt 196 (CUỐI) = 8/40/39/24** (8 batch, 40 entry, 39 đường dẫn, 24 file
  mới). 24 file mới: 8 LIMITS + distinct-seq-196.py + poll-wait-t4-196.sh +
  run-analyzers-196.sh + run-attempt-196.sh + parityHarness196.ts +
  parityHarness196.test.ts + psola.ts + psola.test.ts +
  psolaWorkletSource.ts + reverseAudio196P3.test.ts + audio-probe-196.mjs +
  3 waveform JSON (chirp-70s, longA-300s-gop300-720p, longB-300s-gop15-360p)
  + parity196-run.mjs + parity196-run-test.mjs. 15 đường dẫn không mới:
  GAP (59), 3 test enhance (60/62/91P2), audioEngine.ts (3),
  enhancePreview.ts (60), previewVoiceFx.ts (191), reverseAudio194/195P3
  test, reverseAudioWiring.ts (192), media.fpsProbe94P2.test.ts (194),
  media.ts (38), preview.tsx (1), sample.ts (36), tsconfig.json (1).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 4.128 đường dẫn duy nhất — cả hai
  phương pháp, mốc cuối; shell crosscheck: `missing=0 total_uniq=4128`,
  `SH_EXIT=0`; python: `missing=0 []`, `PY_EXIT=0`).
- **Lũy kế 111–196 (CUỐI) = 845/1.584/1.341/1.145. Chờ push (CUỐI) =
  67/235/170/150 (191+192+193+194+195+196). Tổng 1–196 (CUỐI) =
  1.493/7.454/4.128.** Tái kiểm: 111–195 = 837/1.544/1.316/1.121 (KHỚP
  (q)-195); 111–194 = 826/1.515/1.292/1.097 (KHỚP (q)-194); 111–193 =
  814/1.474/1.262/1.072 (KHỚP (q)-193); 111–192 = 802/1.433/1.238/1.049
  (KHỚP (q)-192); 111–191 = 790/1.394/1.213/1.026 (KHỚP (q)-191); 111–190
  = 778/1.349/1.173/995 (KHỚP (q)-189).

## Giới hạn / sai số ghi nhận (F-196-T01-*)

- **F-196-T01-1 — GAP §123 ĐÃ CÓ TRÊN ĐĨA (T10-195 viết cho đợt 195) — brief
  T01-196 chỉ "viết §123" là SAI SỐ MỤC.** T01-196 viết **§124** cho đợt 196
  (không ghi đè §123, không tạo §123 trùng). T10-196 + parent lưu ý khi đối
  chiếu số mục GAP.
- **F-196-T01-2 — HAI khoảng lặng scheduler MỚI (#A 4.974 s + #B 6.826 s),
  mỗi lặng BAO TRÙM một reboot (#122 / #123).** Cùng chữ ký OUTAGE #2
  (4.807 s) + OUTAGE #3 (5.739 s): 0 event bất kỳ (mọi job) trong lặng; event
  ID liên tục qua lặng; reboot nằm trong lặng (không phải điểm bắt đầu); run
  trễ lúc hồi phục; doctor slot VẮNG. Lặng #B 6.826 s là lớn thứ hai trong họ
  (sau 8.406 s đợt 179). 4 lặng trong ~11,5 giờ ngày 26/11 (onset 01:15:34Z,
  07:00:00Z, 10:12:46Z, 12:41:54Z) — failure mode LẶP LẠI, tần suất đang tăng.
  Phân loại thuộc T7-196 + parent (n): OUTAGE MỚI (sự kiện thứ 4 và thứ 5?)
  hay gộp chung failure mode? OUTAGE 8.406 s đợt 179 + OUTAGE #2 (4.807 s) +
  OUTAGE #3 (5.739 s, parent (n)-195) VẪN MỞ riêng.
- **F-196-T01-3 — #122 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI
  (journal/wtmp chỉ còn boot hiện tại).** Tồn tại được củng cố bằng boot_gen
  đổi + lặng #A + .done T10-195 mtime 11:45:52Z trên đời #122; btime
  11:17:40Z + boot_id 2f268a28 chỉ có trong quyết (e)-195 — T01 không tìm
  thấy nguồn độc lập nào khác. Parent quyết (e) cho cả #122 và #123.
  POSTBOOT_PASS #122 KHÔNG CÓ (không viết bù được — tiền lệ #118/#120).
- **F-196-T01-4 — Shell crosscheck TẠM HOÃN (chưa chạy lúc T01 viết LIMITS
  bản đầu).** T4-196 đang poll (poll #12 14:49:43Z load1=0,61, blockers=0 —
  sắp mở attempt1); shell crosscheck nặng ~3 phút sẽ đẩy load1 lên ~4,5 và
  làm chậm/trễ cửa yên T4. Tiền lệ F-195-T01-4 (giết crosscheck giữa chừng
  để bảo vệ pha yên). T01 chạy shell crosscheck SAU khi T4 xong hết attempt
  (cùng mốc đếm CUỐI); đếm TẠM chỉ tính python (ghi rõ, không giấu) — chuỗi
  khớp TẠM 134 tính trên python + tái kiểm khớp (q)-195.
- **F-196-T01-5 — CÂY ĐỔI DƯỚI CHÂN O8 (preview.tsx chắc chắn, media.ts
  không chắc).** preview.tsx = 591f9655 suốt O8 (mtime 14:51:38Z, SAU O8) —
  O8 chạy đúng cây này; media.ts mtime 14:43:14.760Z (đúng giây driver O8
  bắt đầu; vite attempt1 bridge OK 14:43:19.896Z) — KHÔNG xác định được
  media.ts lúc O8 là 14baf831 (đợt 194/195) hay ac89aeb2 (hiện tại). O8
  T8-196 sẽ chạy trên cây MỚI (preview.tsx 558123e3) — hai bộ O8 đợt này
  KHÔNG cùng cây (cùng boot bc09b26e); chân FULL PASS "O8 3/3 ×2 cùng boot
  cùng cây" cần caveat cây — T10/parent lưu ý.
- **F-196-T01-6 — T01 viết lỏng "watcher-195 CHẾT theo reboot #122" — SAI
  THỜI ĐIỂM (T56-196 đính chính, F-196-T56-6).** Watcher-195 chết ~10:14:39Z,
  TRONG lặng #A (lặng bắt đầu 10:12:46.713Z — poll cuối = lặng+1m53s), ~1h03m
  TRƯỚC reboot #122 (11:17:40Z). Điều đúng: watcher KHÔNG SỐNG SANG đời #122;
  khoảng không-watcher ~4h27m17s bao trọn đời #122. T01 đã sửa lại ở §Kết quả
  chính + NOTES + GAP §124 (ghi rõ đính chính theo T56-196, không xóa bản
  viết lỏng — bản viết lỏng đã sửa trực tiếp vì T01 là tác giả và T56 chưa
  đóng lúc T01 viết; khác các mục mạo danh parent — không viết lại lịch sử).
- **F-196-T01-7 — REBOOT #124 TRONG PHIÊN (btime 16:28:18Z, gap #123→#124 =
  7.082 s) CẮT NGANG ĐỢT 196.** Boot #123 chỉ sống 1h58m02s. Reboot xảy ra
  SAU khi 8 luồng đã đóng cờ (P1/P2/P3/P4/T01/T2/T4/T56) và TRƯỚC hạn cờ
  ~17:00Z — T7/T8/T9 đang chạy thì process chết (không LIMITS/paths/.done
  lúc T01 đóng 16:36Z). (m) #124 THÔ = 1 requeue (eid 11383, run 202, btime
  +49,121 s — TRONG cửa [33; 49,8] → DƯƠNG thô; phân loại CUỐI thuộc T2-197).
  Khoảng 812 s không event trước reboot KHÔNG đủ bằng chứng gọi là lặng
  (khác #A/#B). Sleep nền của T01 bị SIGTERM ~16:28Z; session T01 sống lại
  sau reattach (eid 11385). Đây là reboot thứ ba trong ngày 26/11 được T01
  ghi trong một phiên (#122, #123, #124 — #122/#123 từ DB + đĩa, #124 đo
  tươi) và là boot thứ tư trong ngày (kể cả #121). T10-196 quyết T7/T8/T9
  giao muộn hay rớt đợt; parent quyết (e) cho #124.
- **F-196-T01-8 — RUN 202 BỊ VIẾT LẠI SAU REBOOT #124 (started_at +
  boot_gen).** started_at 1795703751 (= sched, đọc lúc 14:40Z) →
  1795710547 (16:29:07Z = btime #124 +49 s, sau requeue eid 11383);
  boot_gen 2c4cb8ea → 7feb76ab; claimed GIỮ 1795703751. Cùng mẫu run 198
  (F-195-T01-5): started_at bị viết lại sau reboot, boot_gen đổi theo reboot
  — KHÔNG dùng boot_gen đếm chuỗi đổi gen (quyết đứng F-194-T7-2). T7-197
  quyết kết cục run 202 (status RUNNING lúc T01 đọc 16:30Z — run này là
  chính lượt cron đang chạy đợt 196, worker sống lại sau reattach).

## Phạm vi chưa kiểm (không thuộc T01)

- ĐÃ ĐÓNG TRONG PHIÊN (T01 trích dẫn, không xác minh lại nội dung chuyên
  môn): số hiệu #122/#123 (ứng viên — parent quyết (e)); (m) #121/#122 =
  KHÔNG CÓ ĐIỂM (CUỐI, T2-196); POSTBOOT_PASS #123 (T56-196: replay-day-du,
  poll=0, GST thư mục thật); lượt yên #64 (T4-196: 0/3 hợp lệ); holder
  #122 25 → 26, #123 → 27 (T56-196); kết quả sản phẩm P1–P4 đợt 196
  (xem bullet cờ các luồng trên).
- CHƯA KIỂM / CHUYỂN ĐỢT 197: số hiệu #124 (ứng viên — parent quyết (e));
  (m) #124 THÔ 1 requeue DƯƠNG (phân loại CUỐI thuộc T2-197 — cùng (m) #123);
  POSTBOOT_PASS #124 (T56-197); watcher-197 (T56-197 spawn, kiểm ps trước);
  kết cục run 202 (T7-197 — run bị viết lại sau reboot #124, xem
  F-196-T01-8); T7/T8/T9 đợt 196 — KHÔNG có cờ lúc T01 đóng (process chết
  theo reboot #124; T10-196 quyết giao muộn hay rớt đợt — T7: kết cục run
  200/201 + HB/DR + cửa slot + hai lặng #A/#B (phân loại thuộc T7-196 +
  parent (n)); T8: harness + O8 bộ thứ hai + B2 + B1; T9: headroom + ENOSPC
  + E-247 + auto-trigger live + xác nhận live-check #14 — ĐIỀU KIỆN chấp nhận
  đợt 195).
- (m) #121 + INSIDE + (m) #56 (T2-196 — đã đóng: (m) #121 KHÔNG CÓ ĐIỂM
  (CUỐI), n GIỮ 54/55; INSIDE B-#121 TRUE → chuỗi B 1 → 2).
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-196); không kiểm lại
  nguyên nhân các khoảng lặng scheduler hay trigger của chúng; không chạy
  `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file trực
  tiếp theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt kê, trừ
  một lệnh `find -newermt` hẹp trên hidden_files để kiểm mtime trong cửa sổ
  đời #122).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round196-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round196-t01/appendix196.py` + `appendix196.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round196-t01/boot-survey-196t01.sh`
  + `boot-survey-196t01.txt` (output thô 9 nguồn boot mới #123 — đo tươi
  14:40:27Z; script adapt từ 195; đo Cloudflare chặt theo F-188-T0-9; KHÔNG
  grep đệ quy) + `boot-survey-196t01-b124.txt` (output thô 9 nguồn boot #124
  — đo tươi 16:29:48Z, cùng script)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round196-t01/recount-196-t01.py` +
  `recount-196-t01-temp.out` +
  `recount-196-t01-final.out` (đếm cuối 16:30:39Z, python) +
  `crosscheck-196-t01.sh` + `crosscheck-196-t01-temp.out` (hoãn
  tới sau attempt T4, xem F-196-T01-4 — temp chưa chạy) +
  `crosscheck-196-t01-final.out` (đếm cuối 16:30:39–16:33:11Z, shell)
  (hai phương pháp đếm viết mới hoàn toàn; mốc tạm python 14:49:xxZ)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round196-t01/o8-driver-196t01.sh` +
  `o8-196t01.log` + `o8-lock.log` + `o8-driver-196t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-196t01.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round196-t01/gap124-draft.md`
  (bản nháp GAP §124 trước khi ghi vào PHASE9_GAP_ANALYSIS.md)
