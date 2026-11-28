# PHASE9_ROUND198_T01_BOOT_VERIFY_LIMITS.md

Đợt 198 — T01 (gộp T0+T1: boot survey + O8 + verify đếm + GAP §126).
Mở lượt cron 06:35:51 +07 27/11/2026 (= 23:35:51Z 26/11); survey đo tươi 23:58:48Z,
O8 00:12:19–00:16:30Z 27/11. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag. Nguồn đứng: **§14.2 aggregate 197 BẢN
PARENT VIẾT TRỰC TIẾP trong lượt handoff 06:39 +07 27/11/2026 (38.437 B cuối —
37.953 B sau khi parent xóa block mạo danh + 484 B câu bổ sung về watcher-197
lúc 00:03:12Z; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 143, dedup python
+ kiểm chéo shell viết mới `/tmp/count-197-recheck.py` + `.sh`; §14.2-197 SẠCH —
lần sạch thứ năm kể từ đợt 179 (179, 183, 191, 195, 197); tổng điền sẵn GIỮ 18)**.
T01 KHÔNG dùng mục §14.2 mạo danh, không dùng `/tmp/count-197-recheck.py` của lượt
khác, không dùng mục build-loop-log dòng 8794 / nhật ký ngày dòng 69. **CẬP NHẬT:
máy reboot THÊM lần nữa trong phiên — ứng viên #126 (ba8ad21e, btime 22:32:41Z,
gap #125→#126 = 7.493 s); T01 đóng cờ sau reboot này; không luồng nào khác stage
lúc T01 đóng (xem dưới).** **CẬP NHẬT 2 (00:35Z): máy reboot THÊM lần nữa —
ứng viên #127 (6882f9a9, btime 00:34:26Z 27/11, gap #126→#127 = 7.305 s);
reboot này CẮT NGANG shell crosscheck cuối của T01 (đang chạy ~9,5 phút, chưa
xong vòng kiểm file) — T01 chạy lại từ đầu; O8 đã chạy trên #126 (nay đã chết)
vẫn giữ nguyên theo tiền lệ đợt 196 (không chạy lại O8 trên #127 — T10/parent
quyết có cần chạy lại cho chân FULL PASS hay không).**

**BỐI CẢNH: đợt 197 đã đóng (parent CHẤP NHẬN CÓ ĐIỀU KIỆN ở §14.2-197).**
Đợt 198 là đợt thứ tám theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn thiện
sản phẩm; Editing Core — parity preview/render). T10-198 do lượt cron sau spawn
để đóng sổ; T01 KHÔNG đóng sổ.

## Kết quả chính

- **REBOOT MỚI TRONG PHIÊN — XÁC NHẬN 9 nguồn TƯƠI (đo 23:58:48Z)**: boot_id
  `ba8ad21e-d1a1-489c-baa9-9e2dc52173f4` (khác boot trước `8304fcd1` #125 và khác
  `611a02f2` #124); btime **22:32:41Z** (epoch 1795732361; uptime bracket khớp
  cùng giây — `uptime -s` 22:32:41Z, /proc/stat btime 1795732361, /proc/uptime
  5167,36 s lúc 23:58:48Z → boot_est = btime +0,36 s; /proc/1 start_ticks 1827 =
  btime +18,27 s, stat mtime 22:32:59.443Z = btime +18,44 s; journal idx 0 duy
  nhất, first 22:32:59Z = btime +18 s; wtmp begins 22:32:59Z; `last` reboot
  22:32 still running; `who -b` Nov 26 22:32; Cloudflare đo chặt (local mid
  23:58:48Z vs CF-Date 23:58:50 GMT, chênh +2 s — đồng hồ ĐÚNG trong ±2 s;
  marker mtime không đổi).
  Gap #125→mới = **7.493 s (2h04m53s)**. Boot mới xảy ra TRƯỚC khi đợt 198
  mở (23:35:51Z) 1h03m10s; run 203 spanning btime #126 (sched 20:35:51Z,
  xong TIMEOUT 23:39:41Z — xem (m) dưới). Boot #125 sống 7.493 s rồi chết.
- **Số hiệu mới — ỨNG VIÊN #126 (parent quyết (e) ở aggregate 198)**:
  8c4aa907 = **#121 XÁC NHẬN** theo quyết (e)-195; 2f268a28 = **#122 XÁC
  NHẬN** theo quyết (e)-196 (parent quan sát trực tiếp lúc còn sống);
  bc09b26e = **#123 XÁC NHẬN** theo quyết (e)-196; 611a02f2 = **#124 XÁC
  NHẬN** theo quyết (e)-197; 8304fcd1 = **#125 XÁC NHẬN** theo quyết (e)-197 →
  ba8ad21e = **#126** theo hệ quả trực tiếp.
- **Marker sống qua 73 reboot đã xác nhận (#49–#121)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). 75 với #122 + #123 đã xác nhận
  (quyết (e)-196); 76 với #124 đã xác nhận (quyết (e)-197); 77 với #125 đã xác
  nhận (quyết (e)-197); 78 nếu #126 xác nhận.
- **#125 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI NỮA (cùng mẫu #122/#124):**
  journal/wtmp/dpkg chỉ còn boot hiện tại (#126) — #125 đã chết 22:32:41Z
  trước khi T01-198 mở phiên. KHÁC #122 ở một điểm quan trọng: #125 **ĐÃ
  ĐƯỢC T01-197 đo tươi 9 nguồn lúc 20:41:28Z** (`boot-survey-197t01.txt` còn
  trên đĩa: boot_id 8304fcd1, btime 20:27:48Z, uptime bracket +0,54 s, CF +2 s)
  + parent XÁC NHẬN ở (e)-197 — tồn tại của #125 không còn tranh cãi; T01-198
  không cần xác minh lại. Parent quyết (e) cho #126.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-198 + parent)**:
  **(m) #125 THÔ = 0 requeue** (T01-197 — phân loại CUỐI thuộc T2-198 theo
  (f)-197; đính chính F-197-T10-3).
  **(m) #126 THÔ = 1 requeue (DƯƠNG)** — eid 11445, run 203 (777704da),
  22:33:30.058Z = btime +49,058 s, TRONG cửa [22:33:14Z; 22:33:30,8Z]
  (T01-198 kiểm lại tươi). Cả ngày 26/11 chỉ có 3 requeue: eid 11258 (run
  198, 04:24:12Z = (m) #120, đã phân loại CUỐI) + eid 11383 ((m) #124) +
  eid 11445 ((m) #126). Event ID liên tục qua reboot (11444 → 11445 — 0
  event bị mất khỏi bảng). Phân loại CUỐI thuộc T2-198.
- **Khoảng event 1.076 s bao trùm btime #126 — KHÔNG đủ bằng chứng gọi là lặng
  scheduler:** eid 11444 (heartbeat succeeded 22:15:34.278Z) → eid 11445
  (22:33:30.058Z); không job nào due trong khoảng bị mất (heartbeat due
  22:20:50Z đã chạy sớm 22:15:34Z; doctor 22:00Z chạy, 23:00Z chạy;
  feed-pulse-05 due 22:41:54Z chạy đúng giờ). KHÁC #C (8.404 s: 2 job due trễ
  + 2 doctor VẮNG). Phân loại thuộc T7-198 + parent (n).
- **Run 203 TIMEOUT 23:39:41Z** (sched 20:35:51Z, claimed/started_at VIẾT LẠI
  22:33:30Z = btime #126 +49 s sau reboot — cùng mẫu F-196-T01-8;
  boot_gen cron_boot_863c08b7e8c449909080e6a6cb319070) — kết cục thuộc T7-198.
  **Run 204 RUNNING lúc đọc** (sched 23:35:51Z, started 23:39:41Z = btime #126
  +4.020 s; boot_gen GIỐNG run 203 — không đổi theo reboot lần này; KHÔNG dùng
  đếm chuỗi đổi gen, F-194-T7-2) — run này là chính lượt cron đang chạy đợt 198.
  Run 203 spanning btime #126 (sched trước, xong sau — (m) #126 DƯƠNG); run
  204 bắt đầu sau btime #126 4.020 s.
- **POSTBOOT_PASS #124 KHÔNG CÓ + POSTBOOT_PASS #125 CÓ caveat (b1) +
  POSTBOOT_PASS #126 CÓ (caveat giống (b1) — parent quyết (c)-198) +
  POSTBOOT_PASS #127 CHƯA CÓ (T56-198 viết)**: #124 không cờ (T56-197 không
  viết; parent (c)-197: tổng boot không cờ 30 → 31). #125 CÓ cờ (T56-197 viết
  tay 21:28:14Z, poll=1, caveat (b1) — parent (c)-197 CHẤP NHẬN caveat).
  #126 CÓ cờ — **T56-198 viết 00:22:08Z, SAU khi T01 survey #126 (23:58:48Z)
  và sau khi O8 xong (00:16:30Z)**: poll=1, repair-som-quyet-h, dpkg 777
  dòng; GST symlink → debroot (ephemeral, như #119/#125); apt đủ 11 package
  (t5-postboot-independent exit 0, 00:27Z); cờ cũ #125 lưu POSTBOOT_PASS-8304fcd1.
  **#126 CÓ cờ nên tổng boot không cờ GIỮ 31** (không tăng lên 32 — quyết (c)
  thuộc parent; T56-198 + parent quyết). #127 CHƯA CÓ (T56-198 viết lại sau
  reboot; libevent VẮNG lại, dpkg.log 2 dòng lúc survey #127).
  T01 KHÔNG viết cờ thay (tiền lệ #118/#120/#122 — viết cờ không-verify là
  bịa đặt).
- **REBOOT #127 TRONG PHIÊN — XÁC NHẬN 9 nguồn TƯƠI (đo 00:35:49Z;
  F-198-T01-9)**: boot_id `6882f9a9-59d0-41ea-bafc-1433b4f17e16` (khác boot
  trước `ba8ad21e` #126); btime **00:34:26Z 27/11** (epoch 1795739666; uptime
  bracket khớp cùng giây — `uptime -s` 00:34:26Z, /proc/stat btime 1795739666,
  /proc/uptime 83,31 s lúc 00:35:49Z → boot_est = btime +0,31 s; /proc/1
  start_ticks 1307 = btime +13,07 s, stat mtime 00:34:39.638Z = btime +13,64 s;
  journal idx 0 duy nhất, first 00:34:39Z = btime +13 s; wtmp begins
  00:34:39Z; `last` reboot 00:34 still running; `who -b` Nov 27 00:34;
  Cloudflare đo chặt (local mid 00:35:49Z vs CF-Date 00:35:51 GMT, chênh +2 s
  — đồng hồ ĐÚNG trong ±2 s; marker mtime không đổi).
  Gap #126→mới = **7.305 s (2h01m45s)**. Boot #126 sống 7.305 s rồi chết.
  **Số hiệu mới — ỨNG VIÊN #127 (parent quyết (e) ở aggregate 198)**; marker
  79 nếu #126 + #127 đều xác nhận. **(m) #127 THÔ = 1 requeue (DƯƠNG)** — eid
  11475, run 204 (87d58e2c), 00:35:08.661Z = btime +42,661 s, TRONG cửa
  [00:34:59Z; 00:35:15,8Z] (T01-198 kiểm lại tươi; phân loại CUỐI thuộc
  T2-198). Cả ngày 26/11 có 3 requeue + ngày 27/11 (tới 00:35Z) có 1 requeue
  (eid 11475). Event ID liên tục qua reboot (11474 → 11475 — 0 event mất).
  **Khoảng event 1.174 s bao trùm btime #127 — KHÔNG đủ bằng chứng gọi là
  lặng scheduler** (không job nào due trong khoảng bị mất; khác #C; phân loại
  thuộc T7-198 + parent (n)). **Run 204 RUNNING sau reboot** (started_at
  VIẾT LẠI 00:35:08Z = btime #127 +42 s; boot_gen ĐỔI sang
  cron_boot_d4b250d9e6f44b6da84a70c225f8847c — khác lần trước run 203→204
  không đổi gen; kết cục thuộc T7-198). Run 204 spanning btime #127 (sched
  23:35:51Z trước, vẫn RUNNING sau — (m) #127 DƯƠNG).
  **Watcher-198 CHƯA SPAWN** (0 process watcher sau reboot #127; không file
  log watcher trong round198-t56 — chỉ có gen-watcher-198.py; T56-198 spawn,
  kiểm ps trước theo quy tắc đứng). libevent VẮNG lại lúc survey #127
  (boot+1m23s); dpkg.log 2 dòng (replay chưa chạy lại — T56-198 viết
  POSTBOOT_PASS #127). **O8 trên #127: CHƯA CHẠY** — O8 đợt này đã chạy trên
  #126 (00:12:19–00:16:30Z, 3/3 PASS, xem trên); #126 chết 00:34:26Z sau khi
  O8 xong; T01 KHÔNG chạy lại O8 trên #127 (tiền lệ đợt 196: O8 trên #123
  giữ nguyên khi #124 đến giữa phiên) — **T10-198 + parent quyết chân FULL
  PASS đợt này tính trên O8 #126 hay cần chạy lại O8 trên #127**.
- **Watcher-197 CHẾT theo reboot #126** (0 process watcher lúc survey — T01-198
  kiểm ps tươi; khẳng định "watcher-197 pid 6248 ALIVE" trong bản mạo danh đợt
  197 là CHƯA XÁC MINH lúc parent viết ghi chú, nay đã xác minh ĐỘC LẬP 2
  nguồn: T01-198 ps tươi 0 process + parent xác minh qua T9-197/T56-197 LIMITS
  (watcher-197 START 20:45:21Z pid 6248, ALIVE lúc poll 21:49:27Z, chết theo
  reboot #126; khoảng mù watcher ~100 s) — xem ghi chú nguồn gốc aggregate
  197 dòng 136 (câu BỔ SUNG 00:03:12Z). **Watcher-198 CHƯA SPAWN**
  (T56-198 spawn, kiểm ps trước theo quy tắc đứng).
- **libevent VẮNG lúc survey (boot+1h26m)** — giống #112/#115/#116/#117/
  #119/#124/#125 (VẮNG lúc mở boot, CÓ sau replay); dpkg.log 2 dòng lúc survey
  (replay chưa chạy — T56-198 viết POSTBOOT_PASS #126).
- **O8 trên boot mới — WebKit attempt1 PASS 21/21, attempt2 PASS 21/21,
  Chromium PASS 21/21 (00:12:19–00:16:30Z, 4m11s)**: WebKit attempt1 exit=0,
  **21/21 PASS** (S1 PASS; launched 27.2; JSON 21 results, 21 ok=true, md5
  9806bdc4); attempt2 exit=0, **21/21 PASS** (JSON 21 results, 21 ok=true,
  md5 de9e86db); Chromium exit=0, **21/21 PASS** (JSON 21 results, 21 ok=true,
  md5 cebae713). Đếm lại từ JSON gốc bằng python. **0 lỗi exit 127** trong cả
  3 bộ (3 dòng chứa "127" trong log đều là http://127.0.0.1 bridge OK).
  Script gốc KHÔNG đổi so với đợt 197 (webkit 4994b4fc, headed c8acd72e);
  preview.tsx lúc O8 = **af6c3cc7** (mtime 16:10:49Z, TRƯỚC O8); media.ts =
  **ac89aeb2** (mtime 14:43:14.760Z, TRƯỚC O8); **cả 3 bộ O8 đợt này CÙNG
  CÂY**, giống đợt 197. O8 chạy TRONG LÚC T4 chỉ poll (poll #6–#8 ghi
  lock=co t01-round198, gate0 chưa đạt — 0 chồng lấn; poll #9 00:17:07Z
  lock=khong sau release). **Chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây"
  ĐẠT đợt này (3/3 bộ pass)** — lần đầu kể từ đợt 196 (đợt 197 chỉ 2/3 do
  attempt1 timeout lúc load project mẫu). X11: 0 process Xvfb sót sau O8
  (xem F-198-T01-5). Boot lúc O8 xong vẫn ba8ad21e. Không có reboot mới
  trong lúc O8 chạy.
- **Cờ các luồng khác lúc T01 đóng (00:40Z, SAU reboot #127) — 0/11 cờ có
  nội dung; KHÔNG luồng nào stage paths/.done lúc T01 đóng**: P1/P2/P3/P4/
  T2/T4/T56/T7/T8/T9 đều có thư mục làm việc + file trung gian — T4 poll lại
  trên boot #127 (poll #5 00:39:39Z, gate0 chưa đạt, lock=khong); T9 sampler
  chạy lại 00:35Z; T56 chưa chạy lại replay (apt=0 lúc poll #5); nhưng chưa
  luồng nào có LIMITS/paths/.done. T10-198 quyết giao muộn hay rớt đợt. T01
  chỉ trích dẫn trạng thái thư mục, không xác minh nội dung chuyên môn của
  các luồng chưa đóng. **Cây đã đổi SAU O8 (xem F-198-T01-10): preview.tsx
  af6c3cc7 → 477a0eac lúc 00:38:49Z (sau reboot #127); media.ts giữ
  ac89aeb2 — O8 đợt này vẫn đúng cho cây lúc O8 chạy.**

## Đếm — MỐC ĐẾM CUỐI (hai phương pháp khớp nhau; xem F-198-T01-4)

- **Verdict CUỐI (đếm cuối, hai phương pháp KHỚP TỪNG SỐ): 1/11 batch,
  đợt 198 = 1/2/2/1.**
  Tái kiểm 111–197 KHỚP quyết parent (q) đợt 197 TỪNG SỐ; đợt 190 = 0/0/0/0
  (VOID); 0 file thiếu; chuỗi khớp nối dài lần thứ **145** (T01-198 cuối —
  python + shell khớp nhau). Batch của chính T01 ĐÃ BAO trong đếm cuối
  (stage TRƯỚC khi đếm cuối — cùng tiền lệ đợt 196/197).
  Các batch stage SAU mốc này thuộc đếm lại của T10-198 — T10 chạy lại hai
  phương pháp sau closing.
- **Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)**: phương pháp
  1 (python) `recount-198-t01.py` — quét toàn bộ `phase9-round*.txt`, sắp
  xếp theo SỐ ROUND tăng dần, chuẩn hoá đường dẫn tuyệt đối về tương đối
  trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn — tiền lệ đợt 126–127),
  kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa; phương pháp 2 (shell)
  `crosscheck-198-t01.sh` — chỉ dùng `tr` / `sort -u` / `comm` / `wc`:
  union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union
  (trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa (đường
  dẫn tuyệt đối kiểm trực tiếp, không ghép prefix — bài học F-188-T10-1;
  KHÔNG cắt chuỗi e[25:] — bài học lỗi 14 "thiếu" giả đợt 196).
- **Mốc đếm TẠM (0/11 cờ: chưa luồng nào stage; 0 file đợt 198 lúc bắt đầu
  VÀ lúc kết thúc đếm tạm)**:
  quét **1.509 file** `phase9-round*.txt` (round 1–197, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.501; tổng đường
  dẫn duy nhất toàn cục 4.161.
- **Đợt 198 (TẠM) = 0/0/0/0.**
- **Lũy kế 111–198 (TẠM) = 861/1.631/1.375/1.178. Chờ push (TẠM) =
  83/282/204/183 (191+192+193+194+195+196+197). Tổng 1–198 (TẠM) =
  1.509/7.501/4.161.** (= tổng 1–197 vì chưa có file 198.)
- **Chuỗi khớp TẠM: 143 (parent-197) → 144 (T01-198 tạm, python + shell
  KHỚP TỪNG SỐ — khác đợt 197 chỉ python ở mốc tạm; xem F-198-T01-4).**
- **Mốc đếm CUỐI (CHỐT 00:25:01Z python + 00:38:36–00:42:18Z shell CHẠY LẠI
  (bản đầu bị reboot #127 cắt — xem F-198-T01-9), SAU khi stage batch T01 — 1 file
  `phase9-round198-t01-boot-verify.txt`, 1 batch: T01)**:
  quét **1.510 file** `phase9-round*.txt` (round 1–198, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.503; tổng đường
  dẫn duy nhất toàn cục 4.162.
- **Đợt 198 (CUỐI) = 1/2/2/1** (1 batch, 2 entry, 2 đường dẫn, 1 file mới).
  1 file mới: LIMITS T01-198 (`docs/PHASE9_ROUND198_T01_BOOT_VERIFY_LIMITS.md`).
  1 đường dẫn không mới: GAP (`PHASE9_GAP_ANALYSIS.md` — đã có từ đợt 1).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 4.162 đường dẫn duy nhất — cả hai
  phương pháp, mốc cuối; shell crosscheck: `missing=0 total_uniq=4162`,
  `SH_EXIT=0`; python: `missing=0 []`, `PY_EXIT=0`).
- **Lũy kế 111–198 (CUỐI) = 862/1.633/1.376/1.179. Chờ push (CUỐI) =
  84/284/205/184 (191+192+193+194+195+196+197+198). Tổng 1–198 (CUỐI) =
  1.510/7.503/4.162.** Tái kiểm: 111–197 = 861/1.631/1.375/1.178 (KHỚP
  (q)-197); 111–196 = 849/1.588/1.345/1.149 (KHỚP (q)-196); 111–195 =
  837/1.544/1.316/1.121 (KHỚP (q)-195); 111–194 = 826/1.515/1.292/1.097
  (KHỚP (q)-194); 111–193 = 814/1.474/1.262/1.072 (KHỚP (q)-193); 111–192 =
  802/1.433/1.238/1.049 (KHỚP (q)-192); 111–191 = 790/1.394/1.213/1.026
  (KHỚP (q)-191); 111–190 = 778/1.349/1.173/995 (KHỚP (q)-189).

## Giới hạn / sai số ghi nhận (F-198-T01-*)

- **F-198-T01-1 — #125 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI NỮA
  (journal/wtmp chỉ còn boot hiện tại).** KHÁC #122 ở một điểm: #125 đã được
  T01-197 đo tươi 9 nguồn lúc 20:41:28Z (file survey còn trên đĩa) + parent
  XÁC NHẬN ở (e)-197 — tồn tại của #125 không còn tranh cãi; T01-198 không
  cần xác minh lại. Parent quyết (e) cho #126.
- **F-198-T01-2 — Khoảng event 1.076 s bao trùm btime #126 KHÔNG đủ bằng
  chứng gọi là lặng scheduler.** eid 11444 (heartbeat succeeded
  22:15:34.278Z) → eid 11445 (requeued 22:33:30.058Z); không job nào due
  trong khoảng bị mất (heartbeat due 22:20:50Z đã chạy sớm 22:15:34Z;
  doctor 22:00Z + 23:00Z đều chạy; feed-pulse-05 due 22:41:54Z chạy đúng
  giờ). KHÁC #C (8.404 s: heartbeat trễ 888 s, feed-pulse trễ 3.224 s,
  doctor 19:00Z + 20:00Z VẮNG). Khoảng 1.076 s này là cửa sổ reboot +
  daemon recovery, không phải lặng scheduler. Phân loại thuộc T7-198 +
  parent (n).
- **F-198-T01-3 — GAP §125 ĐÃ ĐÍNH CHÍNH 2 ĐIỂM (giao (r)-197).**
  (1) "chỉ kém kỷ lục 8.406 s đợt 179 đúng 2 s" → **"đúng 2 ms"**
  (F-197-T10-2; 8.406 − 8.404 = 0,002 s). (2) "(m) #125 ... phân loại CUỐI
  thuộc T2-197" → **"thuộc T2-198"** (F-197-T10-3; theo (f)-197) — sửa cả
  trong bullet T01-197 lẫn bullet "Nợ mở đợt 198" (bản T01-197 gộp cả 3 (m)
  #123/#124/#125 vào T2-197; #123/#124 phân loại CUỐI đã xong ở T2-197 và
  parent CHẤP NHẬN ở (f)-197, chỉ #125 chuyển sang T2-198).
- **F-198-T01-4 — Shell crosscheck TẠM CHẠY CÙNG MỐC TẠM (khác đợt 197).**
  Đếm tạm đợt 198 chạy CẢ hai phương pháp (python 00:03:39Z + shell
  00:03:39–00:13:09Z), KHỚP TỪNG SỐ — chuỗi khớp TẠM 144 tính trên cả hai
  phương pháp, không chỉ python. Shell crosscheck chậm (~8,5 phút, chủ yếu
  vòng kiểm trực tiếp 4.161 đường dẫn trên đĩa) — O8 chạy sau khi shell tạm
  xong phần đếm số (chỉ còn vòng kiểm file), không ảnh hưởng kết quả O8.
- **F-198-T01-5 — Probe S1 của T01-198 CHẠY THỬ NHẦM LÚC KIỂM IMPORT (lỗi
  của chính T01).** Lệnh `node -e "import(...o8-s1-probe-198t01.mjs)"` để
  kiểm import đã THỰC THI top-level của probe: khởi động vite :5560 +
  Xvfb :188 (00:06:56Z). T01 phát hiện ngay, kill vite :5560 + Xvfb :188
  trước khi chạy O8 driver (00:07–00:09Z); O8 sau đó acquire lock bình
  thường, 3/3 PASS. Bài học: KHÔNG import-thử script có top-level side
  effect — chỉ dùng `node --check` (syntax) + kiểm dependency bằng grep.
  Dependency `eperm-retry.mjs` ĐÃ ĐƯỢC copy sang `round198-t01/` (khác
  F-197-T01-5: probe đợt 197 chết vì thiếu file này) — probe đợt này SẴN
  SÀNG chạy nếu attempt1 FAIL (nhưng attempt1 PASS nên probe không cần chạy).
- **F-198-T01-6 — Lỗi epoch của chính T01, ĐÃ SỬA TRƯỚC KHI ĐÓNG CỜ (cùng
  họ F-197-T01-8).** Bản đầu `appendix198.py` ghi run 203 finished / run 204
  started = 1795737581 (23:59:41Z) — SAI 1.200 s (20 phút): epoch đúng của
  23:39:41Z là 1795736381 (kiểm bằng `date -d`). T01 phát hiện khi đối chiếu
  `date -d` độc lập, đã sửa script + chạy lại; output `appendix198.txt`
  hiện tại là bản đúng. Bài học: mọi epoch gõ tay vào appendix PHẢI kiểm
  bằng `date -d @epoch` trước khi dùng (đã kiểm cho cả 4 mốc run 203/204).
- **F-198-T01-8 — Dự đoán đếm cuối của chính T01 SAI 1 đường dẫn (đã sửa
  trước khi đóng cờ — cùng bẫy F-197-T01-9).** Bản nháp LIMITS + GAP §126
  ghi lũy kế 1.377 / chờ push 206 — sai vì T01 cộng +2 cho cả hai entry của
  batch (GAP + LIMITS) trong khi GAP đã có trong union 111–197 (first_seen
  round 59; T01-197 cũng đã liệt kê GAP) nên union chỉ +1 (LIMITS).
  Dedup python chạy lại cho 1.376 / 205 — đã sửa cả 3 chỗ (LIMITS, GAP §126,
  NOTES) trước khi đóng cờ. Bài học (lặp lại): đừng cộng tay số "đường dẫn"
  theo số entry — chỉ tin dedup chạy lại.
- **F-198-T01-9 — REBOOT #127 TRONG PHIÊN (00:34:26Z) CẮT NGANG SHELL
  CROSSCHECK CUỐI.** Shell crosscheck cuối chạy 00:25:0xZ, bị runtime restart
  + reboot cắt sau ~9,5 phút khi mới xong phần đếm số (24 dòng, tới
  "tong 1-197") — vòng kiểm trực tiếp 4.162 đường dẫn CHƯA CHẠY XONG, không
  có `missing=`/`SH_EXIT=0`. T01 chạy lại shell crosscheck từ đầu sau reboot
  (00:36Z). Đếm cuối python (00:25:01Z, trước reboot) đã xong đầy đủ
  (missing=0) — số đếm không đổi vì paths-loop không đổi qua reboot (chỉ có
  1 file paths T01). Reboot cũng giết process các luồng khác (T4/T9/T56
  chạy lại sau reboot — xem trên).
- **F-198-T01-10 — Cây đổi SAU O8 (preview.tsx af6c3cc7 → 477a0eac,
  mtime 00:38:49Z).** Một luồng sản phẩm sửa preview.tsx sau reboot #127
  (476.846 → 481.426 B); media.ts giữ ac89aeb2. O8 đợt này (00:12:19–
  00:16:30Z) vẫn đúng cho cây lúc O8 chạy (af6c3cc7/ac89aeb2, 3/3 bộ cùng
  cây) — thay đổi cây sau O8 không làm mất hiệu lực O8, cùng tiền lệ đợt 196
  (cây đổi sau O8 14:51:38Z). T4-198 cũng ghi nhận tree=MD5-KHAC từ poll #4.
- **F-198-T01-7 — ĐÍNH CHÍNH SỐ MỤC GAP: T01-198 viết §126 cho đợt 198.**
  §123 đã có (T10-195 viết cho đợt 195), §124 đã có (T01-196 viết cho đợt
  196), §125 đã có (T01-197 viết cho đợt 197) — T01-198 viết **§126**
  (không ghi đè, không tạo § trùng). T10-198 + parent lưu ý khi đối chiếu
  số mục GAP.

## Phạm vi chưa kiểm (không thuộc T01)

- ĐÃ ĐÓNG TRONG PHIÊN (T01 trích dẫn, không xác minh lại nội dung chuyên
  môn): số hiệu #126 (ứng viên — parent quyết (e)); (m) #125 THÔ 0 requeue
  + (m) #126 THÔ 1 requeue DƯƠNG (phân loại CUỐI thuộc T2-198); POSTBOOT_PASS
  #124 KHÔNG CÓ + #125 CÓ caveat (b1) + #126 CÓ (00:22:08Z, caveat giống
  (b1) — parent quyết (c)-198); lượt yên
  #66 (T4-198: chưa mở attempt lúc T01 đóng — gate0 chưa đạt, chờ cờ T5 của
  T56-198); kết quả sản phẩm P1/P2/P3/P4 đợt 198 (chưa luồng nào đóng lúc
  T01 đóng).
- CHƯA KIỂM / CHUYỂN ĐỢT 199: số hiệu #126 + #127 (ứng viên — parent quyết (e));
  (m) #126 THÔ 1 requeue DƯƠNG + (m) #127 THÔ 1 requeue DƯƠNG (phân loại
  CUỐI thuộc T2-198 — cùng (m) #125); POSTBOOT_PASS #127 (T56-198); O8 trên
  #127 CHƯA CHẠY — T10-198 + parent quyết chân FULL PASS tính trên O8 #126
  hay chạy lại; watcher-198 (T56-198 spawn, kiểm ps trước); kết cục run 204
  (T7-198 — run đang chạy, là chính lượt cron đợt 198); khoảng event 1.076 s
  (btime #126) + 1.174 s (btime #127) (phân loại thuộc T7-198 + parent (n)); T7/T8/T9/P1/P2/P3/P4 đợt 198 — KHÔNG có cờ lúc T01 đóng
  (T10-198 quyết giao muộn hay rớt đợt); khung ban ngày 26/11
  (17:05:52Z → 17:35:40Z) giao T7-197 kiểm — kết quả thuộc LIMITS T7-197
  (T01-198 không đối chiếu lại); OUTAGE #1/#2/#3/#4/#5 VẪN MỞ + OUTAGE #6
  (lặng #C, parent (n)-197 chấp nhận) — phân loại thuộc parent.
- (m) #121 + INSIDE + (m) #56 (T2-198 — đã đóng? CHƯA CÓ cờ lúc T01 đóng).
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-198); không kiểm lại
  nguyên nhân khoảng event 1.076 s hay trigger của nó; không chạy `grep`/
  `find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file trực tiếp
  theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt kê).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round198-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round198-t01/appendix198.py` + `appendix198.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay — đã sửa 1 lỗi epoch
  của chính T01: run 203/204 1795737581 → 1795736381, xem F-198-T01-6)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round198-t01/boot-survey-198t01.sh`
  + `boot-survey-198t01.txt` (output thô 9 nguồn boot mới #126 — đo tươi
  23:58:48Z; script adapt từ 197; đo Cloudflare chặt theo F-188-T0-9; KHÔNG
  grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round198-t01/recount-198-t01.py` +
  `recount-198-t01-temp.out` +
  `recount-198-t01-final.out` (đếm cuối, python) +
  `crosscheck-198-t01.sh` + `crosscheck-198-t01-temp.out` +
  `crosscheck-198-t01-final.out` (đếm cuối, shell; temp chạy cùng mốc tạm,
  xem F-198-T01-4)
  (hai phương pháp đếm viết mới hoàn toàn; mốc tạm python 00:03:39Z, shell
  00:03:39–00:13:09Z)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round198-t01/o8-driver-198t01.sh` +
  `o8-198t01.log` + `o8-lock.log` + `o8-driver-198t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-198t01.mjs` + `eperm-retry.mjs` (probe SẴN SÀNG nhưng KHÔNG
  CẦN CHẠY — attempt1 PASS; xem F-198-T01-5)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round198-t01/gap126-draft.md`
  (bản nháp GAP §126 trước khi ghi vào PHASE9_GAP_ANALYSIS.md)
