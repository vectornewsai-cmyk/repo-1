# PHASE9_ROUND199_T01_BOOT_VERIFY_LIMITS.md

Đợt 199 — T01 (gộp T0+T1: boot survey + O8 + GAP §127).
Mở lượt cron 12:35:51 +07 27/11/2026 (= 05:35:51Z); survey đo tươi 05:43:35Z,
O8 05:48:31–05:54:24Z. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag. Nguồn đứng: **§14.2 aggregate 198 BẢN
PARENT VIẾT TRỰC TIẾP trong lượt handoff 09:41 +07 27/11/2026 (68.365 B;
§14.2 TRỐNG khi parent đọc — SẠCH, lần sạch thứ sáu kể từ đợt 179:
179, 183, 191, 195, 197, 198; tổng điền sẵn GIỮ 18; parent kiểm đếm KHỚP
T10-retry TỪNG SỐ lần thứ 148 liên tiếp, dedup python + kiểm chéo shell
viết mới `/tmp/qq198*.py/.sh`)**. T01 KHÔNG dùng file
`hidden_files/round198-parent-decisions.md` (GIẢ), không dùng mục
build-loop-log dòng 8802–8803 / nhật ký ngày mạo danh, không dùng 3 script
`/tmp/count-198-parent*.py` (GIẢ — parent không viết/chạy chúng; chúng báo
lũy kế sai phương pháp). **/tmp đã bị xóa sạch do reboot — T01 tự viết
script mới hoàn toàn đợt này (appendix199.py, boot-survey-199t01.sh,
o8-driver-199t01.sh).**

**BỐI CẢNH: đợt 198 đã đóng (parent CHẤP NHẬN CÓ ĐIỀU KIỆN ở §14.2-198).**
Đợt 199 là đợt thứ chín theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn
thiện sản phẩm; Editing Core — parity preview/render). T10-199 do lượt cron
sau spawn để đóng sổ; T01 KHÔNG đóng sổ. **T01-199 KHÔNG đếm đợt 199**
(theo giao (r)-198 — chỉ survey + GAP + O8; đếm thuộc T10-199).

## Kết quả chính

- **REBOOT MỚI TRONG PHIÊN — XÁC NHẬN 9 nguồn TƯƠI (đo 05:43:35Z)**:
  boot_id `773743f2-8538-40ee-8ade-986a4e7e41c1` (khác boot trước `6882f9a9`
  #127); btime **05:01:50Z** (epoch 1795755710; uptime bracket khớp cùng
  giây — `uptime -s` 05:01:50Z, /proc/stat btime 1795755710, /proc/uptime
  2504,73 s lúc 05:43:35Z → boot_est = btime +0,27 s; /proc/1 start_ticks
  1756 = btime +17,56 s, stat mtime 05:02:08.166Z = btime +18,17 s;
  journal idx 0 duy nhất, first 05:02:08Z = btime +18 s; wtmp begins
  05:02:08Z; `last` reboot 05:02 still running; `who -b` Nov 27 05:02;
  Cloudflare đo chặt (local mid 05:43:35Z vs CF-Date 05:43:37 GMT, chênh
  +2 s — đồng hồ ĐÚNG trong ±2 s; marker mtime không đổi).
  Gap #127→mới = **16.044 s (4h27m24s)**. Boot mới xảy ra TRƯỚC khi đợt
  199 mở (05:35:51Z) 34m01s. Boot #127 sống 16.044 s rồi chết.
- **Số hiệu mới — ỨNG VIÊN #128 (parent quyết (e) ở aggregate 199)**:
  8304fcd1 = **#125 XÁC NHẬN** theo quyết (e)-197; ba8ad21e = **#126 XÁC
  NHẬN** + 6882f9a9 = **#127 XÁC NHẬN** theo quyết (e)-198 → 773743f2 =
  **#128** theo hệ quả trực tiếp.
- **Marker sống qua 73 reboot đã xác nhận (#49–#121)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot
  #48, 2c0a7985, btime 2026-11-20T11:26:05Z). 77 với #125 đã xác nhận
  (quyết (e)-197); 78 với #126 + 79 với #127 đã xác nhận (quyết (e)-198 —
  parent nói 77 → 79 CHƯA XÁC MINH, F-198-T56-6); **80 nếu #128 xác nhận**.
- **#127 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI NỮA (cùng mẫu #122/#124/
  #125):** journal/wtmp/dpkg chỉ còn boot hiện tại (#128) — #127 đã chết
  05:01:50Z trước khi T01-199 mở phiên. KHÁC #122 ở một điểm quan trọng:
  #127 **ĐÃ ĐƯỢC T01-198 đo tươi 9 nguồn lúc 00:35:49Z** (file survey còn
  trên đĩa: boot_id 6882f9a9, btime 00:34:26Z, uptime bracket +0,31 s,
  CF +2 s) + parent XÁC NHẬN ở (e)-198 — tồn tại của #127 không còn tranh
  cãi; T01-199 không cần xác minh lại. Parent quyết (e) cho #128.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-199 +
  parent)**: **(m) #128 THÔ = 0 requeue** — 0 event BẤT KỲ trong cửa
  [btime+33; btime+49,8] = [05:02:23Z; 05:02:39,8Z] (DB tươi: 0 rows
  04:50–05:10Z; 0 event `requeued` cả ngày 27/11). Phân loại CUỐI thuộc
  T2-199. (m) #127 THÔ 1 requeue DƯƠNG (eid 11475, run 205, btime
  +42,661 s — phân loại CUỐI thuộc T2-199 theo (f)-198; GAP §126 ghi
  nham "run 204" + "T2-198" — T01-199 đã sửa, xem F-199-T01-1).
- **Khoảng event 8.406,673 s bao trùm btime #128 — T01 CHỈ BÁO SỐ THÔ,
  KHÔNG gọi là lặng scheduler hay outage (xem F-199-T01-3):** eid 11520
  (heartbeat succeeded 03:15:34.204Z) → eid 11521 (reconciled
  05:35:40.877Z); event ID liên tục 11520 → 11521 — 0 event bị mất khỏi
  bảng; btime #128 (05:01:50Z) NẰM TRONG khoảng. Job due trong khoảng bị
  mất (DB tươi): heartbeat due 05:20:50Z TRỄ 890,991 s (dispatched
  05:35:40.991Z); feed-pulse-11 due 04:41:54Z TRỄ 3.226,991 s (dispatched
  05:35:40.991Z); doctor 04:00Z + 05:00Z VẮNG (KHÔNG có job_runs row);
  heartbeat due 03:50:50Z + 04:20:50Z + 04:50:50Z VẮNG (KHÔNG có
  job_runs row — heartbeat chạy 30 phút/lần: 03:15:34Z rồi NHẢY tới
  05:35:41Z). Cấu trúc SONG SONG với lặng #C (8.404 s: heartbeat trễ
  888 s, feed-pulse trễ 3.224 s, doctor 19:00Z + 20:00Z VẮNG): khoảng
  này DÀI HƠN #C 2,673 s và DÀI HƠN kỷ lục 8.406 s đợt 179 đúng 0,673 s.
  Phân loại thuộc T7-199 + parent (n).
- **Run 205 TIMEOUT 02:41:51Z** (DB tươi: status timeout, finished
  02:41:51Z, eid 11506 timeout 02:41:51.286Z; started_at DB hiện
  02:34:43Z — ĐÃ VIẾT LẠI lần nữa sau lần viết lại 00:35:08Z mà T01-198
  ghi; boot_gen hiện cron_boot_751f76ee… — khác d4b250d9 mà T01-198 ghi
  sau #127; kết cục thuộc T7-199). Run 5fab2731 (vcut-build-loop, sched
  02:35:51Z 27/11 = lượt cron 09:35 +07): SUCCEEDED 03:11:08Z (started
  02:41:51Z — ngay sau khi run 205 timeout). **Run 206 RUNNING lúc đọc**
  (bdcc830e, sched 05:35:51Z, started 05:35:51Z; boot_gen
  cron_boot_c277a65c… — chính lượt cron đợt 199 đang chạy; kết cục thuộc
  T7-199). Run 204 (777704da, sched 20:35:51Z 26/11): TIMEOUT 23:39:41Z
  (eid 11461 23:39:41.436Z — T7-198 appendix DB-tươi); (n)-198: CA mới,
  họ CA 26 → 27; chuỗi SUCCEEDED 11 → 0.
- **POSTBOOT_PASS #126 CÓ + #127 CÓ, cả hai caveat (b1)** (parent
  (c)-198; tổng boot không cờ GIỮ 31). **POSTBOOT_PASS #128 CÓ —
  T56-199 viết 05:51:25Z, poll=0, replay-day-du, dpkg 1.510 dòng, cache
  174 .deb, lists 71, postboot PASS poll0 độc lập exit 0** — KHÁC
  #125/#126/#127 ở poll=0 + replay đầy đủ thay vì repair-som-quyet-h
  (xem F-199-T01-5); parent quyết (c)-199 có caveat hay không. T01 KHÔNG
  viết cờ thay. Cờ cũ #127 lưu POSTBOOT_PASS-6882f9a9.
- **Watcher-198 CHẾT theo reboot #128** (0 process watcher lúc survey
  05:44Z). **Watcher-199 ĐÃ SPAWN** (T56-199: pid 33388, START
  05:48:49Z, boot 773743f2, ALIVE lúc T01 kiểm 05:55Z — đúng (r)-198 (k);
  T56-199 kiểm ps trước theo quy tắc đứng: watcher-198 0 process, hết
  hạn 02:35:51Z).
- **libevent VẮNG lúc survey (boot+41m45s)** — giống #112/#115/#116/
  #117/#119/#124/#125/#126/#127 (VẮNG lúc mở boot, CÓ sau replay);
  dpkg.log 2 dòng lúc survey (replay chưa chạy — T56-199 viết
  POSTBOOT_PASS #128 05:51:25Z, dpkg 1.510 dòng sau replay).
- **O8 trên boot mới — WebKit attempt1 PASS 21/21, attempt2 PASS 21/21,
  Chromium PASS 21/21 (05:48:31–05:54:24Z, 5m53s)**: WebKit attempt1
  exit=0, **21/21 PASS** (launched 27.2; JSON 21 results, 21 ok=true,
  md5 e6056f5e); attempt2 exit=0, **21/21 PASS** (launched 27.2; JSON 21
  results, 21 ok=true, md5 2ac792a2); Chromium exit=0, **21/21 PASS**
  (JSON 21 results, 21 ok=true, md5 9824cbc1). Đếm lại từ JSON gốc bằng
  python. **0 lỗi exit 127** trong cả 3 bộ (0 dòng chứa "127" ngoài
  http://127.0.0.1 bridge OK). Script gốc KHÔNG đổi so với đợt 198
  (webkit 4994b4fc, headed c8acd72e); preview.tsx lúc O8 =
  **477a0eac** (mtime 00:38:49Z — cây MỚI sau O8 đợt 198) + media.ts =
  **ac89aeb2** (mtime 26/11 14:43:14Z); **cả 3 bộ O8 đợt này CÙNG CÂY**
  (477a0eac/ac89aeb2) và cây KHÔNG đổi trong lúc O8 chạy. **Chân FULL
  PASS "O8 3/3 ×2 cùng boot cùng cây" ĐẠT đợt này (3/3 bộ pass, cùng
  boot #128, cùng cây)** — parent quyết (b)-199 có tính chuỗi FULL PASS
  hay không (các chân còn lại thuộc T4/T8 + parent). O8 chạy trong lúc
  T4-199 chỉ poll (poll #7 05:53:36Z ghi lock=co t01-round199 pid=31860
  port=5560 — T4 thấy lock nên KHÔNG mở attempt; poll #8 05:54:24Z
  lock=khong sau release — 0 chồng lấn attempt đang chạy; xem
  F-199-T01-4). X11: 0 process Xvfb sót sau O8 (chỉ còn process waiter
  của T8, không phải vite/Xvfb). Boot lúc O8 xong vẫn 773743f2. Không có
  reboot mới trong lúc O8 chạy.
- **Cờ các luồng khác lúc T01 đóng (05:55Z) — 0/11 cờ có nội dung;
  KHÔNG luồng nào stage paths/.done lúc T01 đóng**: P1/P2/P3/P4/T2/T4/
  T56/T7/T8/T9 đều có thư mục làm việc + file trung gian — T4 đang poll
  (poll #8 05:54:24Z, gate0=T5 theo poll log, chưa mở attempt lượt yên
  #67); T56 đã viết POSTBOOT_PASS #128 + spawn watcher-199 (ALIVE);
  T9 sampler đang chạy; T8 waiter đang chờ T4 .done (đúng (p1)-198);
  P2 có enhancePreview.bundle.mjs + bbb-10s.mp4; P4 có thư mục scratch;
  T7 có thư mục làm việc; nhưng chưa luồng nào có LIMITS/paths/.done.
  T10-199 quyết giao muộn hay rớt đợt. T01 chỉ trích dẫn trạng thái thư
  mục, không xác minh nội dung chuyên môn của các luồng chưa đóng.

## Đếm — batch của T01 (T10-199 đếm toàn đợt)

- **Batch T01-199: 2 entry / 2 đường dẫn / 1 file mới** (GAP
  `PHASE9_GAP_ANALYSIS.md` — đã có từ đợt 1, không mới; LIMITS
  `docs/PHASE9_ROUND199_T01_BOOT_VERIFY_LIMITS.md` — mới). T01-199
  KHÔNG chạy dedup toàn cục đợt 199 (theo giao (r)-198); mọi số lũy kế /
  chờ push / tổng thuộc T10-199 + parent (q)-199. T01 chỉ stage batch
  của chính mình TRƯỚC khi đóng cờ (cùng tiền lệ đợt 196/197/198).

## Giới hạn / sai số ghi nhận (F-199-T01-*)

- **F-199-T01-1 — Nhãn run SAI −1 trong GAP §126 + LIMITS T01-198
  (F-198-T2-1; T01-199 đã SỬA trong GAP §126, giao (r)-198).** ĐÚNG là
  777704da = **run 204** (TIMEOUT 23:39:41Z — T7-198 appendix DB-tươi:
  run204 events ×5: dispatched 20:35:51.049Z eid 11420; requeued
  22:33:30.058Z eid 11445; timeout 23:39:41.436Z eid 11461) và 87d58e2c
  = **run 205** (sched 23:35:51Z — muse.db tươi 05:44Z). GAP §126 cũ
  ghi "run 203 TIMEOUT" / "run 204 RUNNING" / "(m) #126 … run 203" /
  "(m) #127 … run 204 … T2-198" / "run 204 RUNNING sau reboot" / "kết
  cục run 204 thuộc T7-198" — T01-199 đã sửa cả 6 chỗ (kiểm lại bằng
  grep: 0 chuỗi sai còn trong §126; 2 chuỗi "run 203" còn lại trên toàn
  GAP nằm trong bullet đính chính §127 — trích dẫn nhãn cũ có chủ đích
  — và trong §125, xem F-199-T01-2). **LIMITS T01-198 KHÔNG viết lại**
  (file lịch sử — giữ nguyên làm bằng chứng; lỗi đã ghi nhận ở đây).
  (m) #127 "phân loại CUỐI thuộc T2-198" → **"thuộc T2-199"** (theo
  (f)-198); đồng thời (m) #125 KHÔNG CÓ ĐIỂM (CUỐI) + (m) #126 DƯƠNG
  (CUỐI) — parent (f)-198 CHẤP NHẬN, không còn là nợ mở.
- **F-199-T01-2 — §125 CŨNG CÓ LỖI NHÃN RUN −1 TƯƠNG TỰ — T01-199
  KHÔNG SỬA (ngoài phạm vi giao (r)-198; ghi nhận để T10-199/parent
  quyết).** §125 ghi "run 203 RUNNING lúc đọc (sched 20:35:51Z = btime
  #125 +483 s; kết cục thuộc T7-197)" và "kết cục run 203 thuộc T7-197"
  — cùng run 777704da sched 20:35:51Z mà T7-198 + parent (n)-198 xác
  định là **run 204** (TIMEOUT 23:39:41Z). Lỗi lan từ T01-197 sang
  T01-198 (cùng nguồn đếm sai). T01-199 chỉ sửa §126 theo giao; §125
  chờ quyết.
- **F-199-T01-3 — Khoảng event 8.406,673 s bao trùm btime #128:
  T01 CHỈ BÁO SỐ THÔ.** Cấu trúc song song lặng #C (2 job due trễ +
  2 doctor VẮNG; heartbeat trễ 890,991 s ≈ 888 s của #C; feed-pulse
  trễ 3.226,991 s ≈ 3.224 s của #C) và dài hơn kỷ lục 8.406 s đợt 179
  đúng 0,673 s — nhưng T01 KHÔNG gọi là lặng/outage: (1) khoảng BẮT
  ĐẦU 03:15:34Z, tức 1h46m TRƯỚC reboot #128 (05:01:50Z) — lặng (nếu
  có) KHÔNG chỉ là cửa sổ reboot + daemon recovery như các khoảng
  1.076 s / 1.174 s đợt 198; (2) 3 heartbeat due liên tiếp VẮNG row
  (03:50:50Z + 04:20:50Z + 04:50:50Z) là mẫu chưa từng thấy trong các
  khoảng trước; (3) phân loại lặng/outage là thẩm quyền T7 + parent
  (n), không phải T01. T01 báo đủ số thô để T7-199 phân loại: khoảng
  eid 11520 → 11521, 0 event mất, 5 due VẮNG/trễ liệt kê ở trên.
- **F-199-T01-4 — O8 chạy KHI T4 .done CHƯA CÓ (gate thực chất theo
  (p1)-198 — KHÔNG phải vi phạm).** Lúc O8 bắt đầu (05:48:31Z), T4-199
  CHƯA BẮT ĐẦU (không có thư mục round199-t4, không poll, không attempt
  mở); giữa O8, T4 bắt đầu poll (poll #7 05:53:36Z ghi lock=co
  t01-round199 — T4 thấy lock nên KHÔNG mở attempt; poll #8 05:54:24Z
  lock=khong sau release). 0 chồng lấn attempt đang chạy trong toàn bộ
  cửa sổ O8. T01 ghi rõ gate + bằng chứng vào LIMITS ngay lúc chạy,
  đúng điều khoản thay thế của (p1)-198. T8-199 vẫn chờ T4 .done trước
  khi chạy harness (quy tắc đứng — T8 waiter đã quan sát đúng).
- **F-199-T01-5 — POSTBOOT_PASS #128 KHÁC LOẠI với #125/#126/#127.**
  #128: poll=0, replay-day-du, dpkg 1.510 dòng (T56-199 viết 05:51:25Z)
  — replay ĐẦY ĐỦ, không phải repair-som-quyet-h. #125/#126/#127:
  poll=1, repair, caveat (b1) (parent (c)-197/(c)-198). T01 KHÔNG suy
  ra "không caveat" — parent quyết (c)-199 sau khi đọc LIMITS T56-199.
- **F-199-T01-6 — (m) #128 = 0 requeue DÙ khoảng event dài 8.406,673 s.**
  (m) chỉ đếm requeue trong cửa [btime+33; btime+49,8] — cửa này TRỐNG
  hoàn toàn (0 event bất kỳ 04:50–05:10Z). Khoảng event dài là dữ kiện
  RIÊNG cho phân loại lặng (T7-199), không làm (m) #128 dương. Tiền lệ:
  (m) #125 cũng 0 requeue trong khi boot #125 có gap riêng.
- **F-199-T01-7 — ĐÍNH CHÍNH SỐ MỤC GAP: T01-199 viết §127 cho đợt
  199.** §123 đã có (T10-195 viết cho đợt 195), §124 đã có (T01-196
  viết cho đợt 196), §125 đã có (T01-197 viết cho đợt 197), §126 đã có
  (T01-198 viết cho đợt 198) — T01-199 viết **§127** (không ghi đè,
  không tạo § trùng). T10-199 + parent lưu ý khi đối chiếu số mục GAP.
- **F-199-T01-8 — Lỗi epoch của chính T01, ĐÃ SỬA TRƯỚC KHI ĐÓNG CỜ
  (cùng họ F-197-T01-8 / F-198-T01-6).** Bản đầu `appendix199.py` ghi
  event cuối trước reboot = 1795754134 (04:35:34Z) và heartbeat due
  05:20:50Z = 1795754450 (04:40:50Z) — SAI (lệch 4.800 s / 2.400 s).
  T01 phát hiện khi đối chiếu `date -d @epoch` độc lập, đã sửa thành
  1795749334 / 1795756850 và chạy lại; output `appendix199.txt` hiện
  tại là bản đúng (khoảng 8.406,673 s; heartbeat trễ 890,991 s).
  Bài học (lặp lại): mọi epoch gõ tay vào appendix PHẢI kiểm bằng
  `date -d @epoch` trước khi dùng.

## Phạm vi chưa kiểm (không thuộc T01)

- ĐÃ ĐÓNG TRONG PHIÊN (T01 trích dẫn, không xác minh lại nội dung chuyên
  môn): số hiệu #128 (ứng viên — parent quyết (e)); (m) #128 THÔ 0
  requeue (phân loại CUỐI thuộc T2-199); POSTBOOT_PASS #128 CÓ (poll=0,
  replay-day-du — parent quyết (c)-199 caveat hay không); watcher-199
  ĐÃ SPAWN (pid 33388, ALIVE); run 205 TIMEOUT 02:41:51Z (DB tươi —
  kết cục thuộc T7-199); lượt yên #67 (T4-199: chưa mở attempt lúc T01
  đóng — mới poll #8, gate0=T5 theo poll log); kết quả sản phẩm
  P1/P2/P3/P4 đợt 199 (chưa luồng nào đóng lúc T01 đóng).
- CHƯA KIỂM / CHUYỂN ĐỢT 200: số hiệu #128 (ứng viên — parent quyết
  (e)); (m) #128 THÔ 0 requeue (phân loại CUỐI thuộc T2-199); khoảng
  event 8.406,673 s (phân loại thuộc T7-199 + parent (n)); POSTBOOT_PASS
  #128 caveat (parent (c)-199); marker 80 nếu #128 xác nhận (CHƯA XÁC
  MINH — F-198-T56-6; T56-199 tìm đường dẫn file); kết cục run 206
  (T7-199); watcher-199 theo dõi tiếp (T56-199); T7/T8/T9/P1/P2/P3/P4
  đợt 199 — KHÔNG có cờ lúc T01 đóng (T10-199 quyết giao muộn hay rớt
  đợt); khung ban ngày 26/11 (17:05:52Z → 17:35:40Z) giao T7-197 kiểm —
  kết quả thuộc LIMITS T7-197 (T01-199 không đối chiếu lại); OUTAGE
  #1/#2/#3/#4/#5 VẪN MỞ + OUTAGE #6 (lặng #C, parent (n)-197 chấp nhận)
  — phân loại thuộc parent; §125 nhãn run −1 (xem F-199-T01-2).
- (m) #121 + INSIDE + (m) #56 (T2-199 — đã đóng? CHƯA CÓ cờ lúc T01 đóng).
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-199); không kiểm
  lại nguyên nhân khoảng event 8.406,673 s hay trigger của nó; không chạy
  `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file
  trực tiếp theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt
  kê).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round199-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round199-t01/appendix199.py` + `appendix199.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay — đã sửa 2 lỗi
  epoch của chính T01: event cuối 1795754134 → 1795749334, heartbeat due
  1795754450 → 1795756850, xem F-199-T01-8; mọi epoch đã kiểm bằng
  `date -d @epoch` độc lập)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round199-t01/boot-survey-199t01.sh`
  + `boot-survey-199t01.txt` (output thô 9 nguồn boot mới #128 — đo tươi
  05:43:35Z; script adapt từ 198; đo Cloudflare chặt theo F-188-T0-9;
  KHÔNG grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round199-t01/o8-driver-199t01.sh` +
  `o8-199t01.log` + `o8-lock.log` + `o8-driver-199t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-199t01.mjs` + `eperm-retry.mjs` (probe SẴN SÀNG nhưng KHÔNG
  CẦN CHẠY — attempt1 PASS; khác F-198-T01-5: T01-199 KHÔNG import-thử
  probe — chỉ dùng `node --check`)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round199-t01/gap127-draft.md`
  (bản nháp GAP §127 trước khi ghi vào PHASE9_GAP_ANALYSIS.md)
