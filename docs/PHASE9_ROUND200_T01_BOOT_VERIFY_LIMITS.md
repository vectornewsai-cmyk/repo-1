# PHASE9_ROUND200_T01_BOOT_VERIFY_LIMITS.md

Đợt 200 — T01 (gộp T0+T1: boot survey + O8 + GAP §128).
Mở lượt cron 18:35:51 +07 27/11/2026 (= 11:35:51Z); survey đo tươi 11:39:01Z,
O8 11:43:23–11:50:36Z. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag. Nguồn đứng: **§14.2 aggregate 199 BẢN
PARENT VIẾT TRỰC TIẾP trong lượt handoff 15:39 +07 27/11/2026 (86.880 B —
bản đã KHÔI PHỤC sau vụ ghi đè 09:11–09:12Z; §14.2 TRỐNG khi parent đọc —
SẠCH, lần sạch thứ bảy kể từ đợt 179: 179, 183, 191, 195, 197, 198, 199;
tổng điền sẵn GIỮ 18; parent kiểm đếm KHỚP T10b-199 TỪNG SỐ lần thứ 153
liên tiếp, dedup python + kiểm chéo shell viết mới `/tmp/qq199.py/.sh`)**.
T01 KHÔNG dùng file `hidden_files/round199-parent-decisions.md` (GIẢ), không
dùng thư mục `hidden_files/round199-t10/` giả, không dùng script
`/tmp/qq199-count.py` + `/tmp/qq199-cross.sh` (GIẢ). **/tmp đã bị xóa sạch
do reboot — T01 tự viết script mới hoàn toàn đợt này (appendix200.py,
boot-survey-200t01.sh, o8-driver-200t01.sh).**

**BỐI CẢNH: đợt 199 đã đóng (parent CHẤP NHẬN CÓ ĐIỀU KIỆN ở §14.2-199).**
Đợt 200 là đợt thứ mười theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn
thiện sản phẩm; Editing Core — parity preview/render). T10-200 do lượt cron
sau spawn để đóng sổ; T01 KHÔNG đóng sổ. **T01-200 KHÔNG đếm đợt 200**
(theo giao (r)-199 — chỉ survey + GAP + O8; đếm thuộc T10-200).

## Kết quả chính

- **REBOOT MỚI TRONG PHIÊN — XÁC NHẬN 9 nguồn TƯƠI (đo 11:39:01Z)**:
  boot_id `c073c8bb-26f3-41e8-a4b5-3d56ce3564f8` (khác boot trước `e6e070b8`
  #129); btime **11:21:41Z** (epoch 1795778501; uptime bracket khớp cùng
  giây — `uptime -s` 11:21:41Z, /proc/stat btime 1795778501, /proc/uptime
  1039,19 s lúc 11:39:01Z → boot_est = btime +0,81 s; /proc/1 start_ticks
  1211 = btime +12,11 s, stat mtime 11:21:54.070Z = btime +13,07 s;
  journal idx 0 duy nhất, first 11:21:54Z = btime +13 s; wtmp begins
  11:21:54Z; `last` reboot 11:21 still running; `who -b` Nov 27 11:21;
  Cloudflare đo chặt (local mid 11:39:01Z vs CF-Date 11:39:02 GMT, chênh
  +1 s — đồng hồ ĐÚNG trong ±2 s; marker mtime không đổi).
  Gap #129→mới = **16.965 s (4h42m45s)**. Boot mới xảy ra TRƯỚC khi đợt
  200 mở (11:35:51Z) 14m10s. Boot #129 sống 16.965 s rồi chết.
- **Số hiệu mới — ỨNG VIÊN #130 (parent quyết (e)) — CÓ ĐIỀU KIỆN
  (xem F-200-T01-9)**: e6e070b8 = **#129 ỨNG VIÊN** theo quyết (e)-199
  (chưa xác nhận) → c073c8bb = **#130** theo hệ quả trực tiếp — TRỪ KHI
  daemon restart 08:41:43Z là reboot (khi đó boot này = #131).
- **Marker sống qua 73 reboot đã xác nhận (#49–#121)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot
  #48, 2c0a7985, btime 2026-11-20T11:26:05Z). 80 với #128 + #129 đã xác
  nhận (quyết (e)-199: 79 → 80 ĐÃ XÁC MINH — F-198-T56-6 ĐÓNG);
  **81 nếu #130 xác nhận**.
- **#129 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI NỮA (cùng mẫu #122/#124/
  #125/#127/#128):** journal/wtmp/dpkg chỉ còn boot hiện tại (#130) —
  #129 đã chết 11:21:41Z trước khi T01-200 mở phiên. KHÁC #122 ở một
  điểm quan trọng: #129 **ĐÃ ĐƯỢC T7-199 đo btime tươi lúc 06:39:58Z**
  (appendix199: live /proc/stat + who -b + uptime -s, boot_id e6e070b8)
  + POSTBOOT #129 CÓ (parent (c)-199) + parent ỨNG VIÊN ở (e)-199 — tồn
  tại của #129 không còn tranh cãi; T01-200 không cần xác minh lại.
  Parent quyết (e) cho #130.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-200 +
  parent)**: **(m) #130 THÔ = 0 requeue** — 0 event BẤT KỲ trong cửa
  [btime+33; btime+49,8] = [11:22:14Z; 11:22:30,8Z] (DB tươi: 0 event
  11:15:00–11:35:38Z; không run nào spanning btime — run 207 xong
  08:39:01Z, run 9cd50793 xong 09:16:08Z, run 208 dispatch 11:35:51Z).
  Phân loại CUỐI thuộc T2-200. **(m) #129 THÔ = 1 requeue DƯƠNG**
  (eid 11540, run 207, btime +40,934 s — T01-200 kiểm lại tươi, khớp
  T7-199; phân loại CUỐI thuộc T2-200 theo (f)-199).
- **Khoảng event 3.004,755 s bao trùm btime #130 — T01 CHỈ BÁO SỐ THÔ,
  KHÔNG gọi là lặng scheduler hay outage (xem F-200-T01-5):** eid 11596
  (succeeded 10:45:34.161Z) → eid 11597 (reconciled 11:35:38.916Z);
  event ID liên tục 11596 → 11597 — 0 event bị mất khỏi bảng; btime
  #130 (11:21:41Z) NẰM TRONG khoảng. Khoảng trước đó: eid 11585
  (succeeded 09:16:08.660Z) → eid 11586 (reconciled 10:41:43.389Z) =
  5.134,729 s, cũng 0 event, ID liên tục 11585 → 11586. Phân loại thuộc
  T7-200 + parent (n).
- **Run 207 TIMEOUT 08:39:01Z** (DB tươi: status timeout, finished
  1795768741, event eid 11568 timeout 08:39:01.886Z; claimed ĐÃ VIẾT
  LẠI 05:35:51Z → 08:37:02Z so với T7-199 ghi lúc 07:47Z — lúc nào, vì
  sao thuộc T7-200; cf THÔ 119 s; timeout muộn 190 s sau deadline
  08:35:51Z; kết cục thuộc T7-200). **Run 9cd50793 (sched 08:35:51Z =
  lượt cron 15:35 +07) SUCCEEDED theo event eid 11585 09:16:08.660Z —
  NHƯNG finished_at_utc trong row = 08:42:48Z, lệch đúng 2.000 s so
  với event (xem F-200-T01-6).** Run 9cd50793 bị requeue ở daemon
  restart 08:41:43Z (eid 11570, xem F-200-T01-9). **Run 208 RUNNING lúc
  đọc** (8c1d8a33, sched 11:35:51Z, dispatched eid 11601 11:35:51.062Z
  +0,062 s — chính lượt cron đợt 200 đang chạy; boot_gen
  cron_boot_0eac28bb…; kết cục thuộc T7-200).
- **Daemon restart 02:34:43Z — GIẢ THUYẾT REBOOT BỊ BÁC (xem
  F-200-T01-8): daemon-only restart, số hiệu #128/#129 ĐỨNG theo
  (e)-199.** Daemon restart thứ hai 08:41:43Z — CHƯA GIẢI QUYẾT (xem
  F-200-T01-9): nếu là reboot thì boot mới = #131.
- **POSTBOOT_PASS #128 CÓ không caveat (b2) + #129 CÓ caveat (b1)**
  (parent (c)-199; tổng boot không cờ GIỮ 31). **POSTBOOT_PASS #130
  CHƯA CÓ** — T56-200 đang repair (EARLY-REPAIR TRIGGER 11:45:49Z,
  boot+1448s, frozen 608s, dpkg 2 dòng, verify form-B exit=1; apt đang
  chạy lúc T01 đóng); T01 KHÔNG viết cờ thay. Parent quyết (c)-200
  sau khi đọc LIMITS T56-200.
- **Watcher-199 CHẾT theo reboot #130** (0 process watcher lúc T01
  kiểm). **Watcher-200 CHƯA SPAWN** (T56-200 spawn sau postboot, kiểm
  ps trước — đúng (r)-199 (k)).
- **libevent VẮNG lúc survey (boot+17m)** — giống #112/#115/#116/
  #117/#119/#124/#125/#126/#127/#128 (VẮNG lúc mở boot, CÓ sau replay);
  dpkg.log 2 dòng lúc survey (replay chưa chạy — T56-200 repair đang
  chạy 11:45:49Z).
- **O8 trên boot mới — WebKit attempt1 FAIL (S1), probe FAIL, attempt2
  PASS 21/21, Chromium PASS 21/21 (11:43:23–11:50:36Z, 7m13s)**:
  attempt1 exit=2 11:43:51Z — S0 PASS (mẫu tự load 3 clip), **S1 FAIL
  "tắt auto-proxy trước khi import — không đo được rect checkbox tự
  tạo proxy"** (toggle ok:false, method mouse); JSON 2 results, 1
  ok=true, md5 c09f81ca. Probe S1 exit=2 11:48:06Z — **HARNESS LỖI
  timeout chờ project mẫu tự load (3 clip, media bin 2 item),
  last=null — KHÔNG tới được S1, KHÔNG phân biệt được (a)/(b)**
  (xem F-200-T01-4). Attempt2 exit=0 11:49:30Z, **21/21 PASS**
  (S1 pass "checked=true → false, Playwright mouse click lần 2";
  JSON 21 results, 21 ok=true, md5 fcbe0ea7). Chromium exit=0
  11:50:36Z, **21/21 PASS** (JSON 21 results, 21 ok=true, md5
  f9903c26). Đếm lại từ JSON gốc bằng python. **0 lỗi exit 127**
  trong cả 3 bộ (4 dòng chứa "127" đều là http://127.0.0.1 bridge
  OK). Script gốc KHÔNG đổi so với đợt 199 (webkit 4994b4fc, headed
  c8acd72e); preview.tsx lúc O8 = **477a0eac** (giống O8-199) +
  media.ts = **ac89aeb2**; **cả 3 bộ O8 đợt này CÙNG CÂY**
  (477a0eac/ac89aeb2) và cây KHÔNG đổi trong lúc O8 chạy. **Chân FULL
  PASS "O8 3/3 ×2 cùng boot cùng cây" KHÔNG ĐẠT đợt này (2/3 bộ pass,
  cùng boot #130, cùng cây)** — giống đợt 197; parent quyết (b)-200
  có tính chuỗi FULL PASS hay không (các chân còn lại thuộc T4/T8 +
  parent). O8 chạy trong lúc T4-200 chỉ poll (poll #7–#14 ghi
  lock=co t01-round200 pid=26823 port=5560 — T4 thấy lock nên KHÔNG
  mở attempt; poll #15 11:50:36Z lock=khong sau release — 0 chồng lấn
  attempt đang chạy; xem F-200-T01-2). X11: 0 process Xvfb sót sau O8.
  Boot lúc O8 xong vẫn c073c8bb. Không có reboot mới trong lúc O8 chạy.
- **Cờ các luồng khác lúc T01 đóng (~11:51Z) — 2/11 cờ có nội dung;
  P2 + T5 đã stage paths/.done**: P2 DONE (~11:45Z — R_rel phụ thuộc
  σ hình chữ U, đề xuất GIỮ bar 0,15 + fixture σ=15); T5 DONE
  (~11:42Z — cơ chế silencing recorder ĐÚNG, KHÔNG CÓ LỖI, LIMITS
  13.271 B). P1/P3/P4/T2/T4/T56/T7/T8/T9 chưa đóng — đều có thư mục làm
  việc + file trung gian: T4 đang poll (poll #15 11:50:36Z, gate0
  chưa đạt — chờ T56-200 postboot; chưa mở attempt lượt yên #68);
  T56 đang repair (EARLY-REPAIR 11:45:49Z, apt đang chạy); T7 có
  appendix200-part1.txt + appendix200.py; T9 sampler đang chạy
  (autotrigger-live, b2-spikes.log); P1 có timbre200-frames.json; P3
  có analyze200.py + chirp_fit.py; P4 có thư mục scratch. T10-200
  quyết giao muộn hay rớt đợt. T01 chỉ trích dẫn trạng thái thư
  mục, không xác minh nội dung chuyên môn của các luồng chưa đóng.

## Đếm — batch của T01 (T10-200 đếm toàn đợt)

- **Batch T01-200: 2 entry / 2 đường dẫn / 1 file mới** (GAP
  `PHASE9_GAP_ANALYSIS.md` — đã có từ đợt 1, không mới; LIMITS
  `docs/PHASE9_ROUND200_T01_BOOT_VERIFY_LIMITS.md` — mới). T01-200
  KHÔNG chạy dedup toàn cục đợt 200 (theo giao (r)-199); mọi số lũy kế /
  chờ push / tổng thuộc T10-200 + parent (q)-200. T01 chỉ stage batch
  của chính mình TRƯỚC khi đóng cờ (cùng tiền lệ đợt 196/197/198/199).
  GAP 1.167.861 B — VƯỢT trần push 37.768 B, cần ENABLE_PRIVSEP=0 lúc
  push như các đợt trước.

## Giới hạn / sai số ghi nhận (F-200-T01-*)

- **F-200-T01-1 — Nhãn run SAI −1 trong GAP §127 + §125 (T01-200 đã
  SỬA, giao (r)-199).** §127: "run 206 RUNNING lúc đọc (sched
  05:35:51Z…)" → **"run 207 RUNNING lúc đọc…"** (bdcc830e; T7-199 .done
  + parent (n)-199 xác nhận); "kết cục run 206 thuộc T7-199" →
  **"kết cục run 207 thuộc T7-200"** (grep sau sửa: 0 chuỗi sai còn
  trong §127; 1 chuỗi "run 206" còn lại trong toàn GAP nằm trong bullet
  đính chính §128 — trích dẫn nhãn cũ có chủ đích). §125: "run 203
  RUNNING lúc đọc (sched 20:35:51Z = btime #125 +483 s; kết cục thuộc
  T7-197)" → **"run 204 TIMEOUT 23:39:41Z (eid 11461 23:39:41.436Z; CA
  mới, họ CA 26 → 27 — kết cục thuộc T7-198)"** (777704da; T7-198
  appendix DB-tươi + parent (n)-198 xác nhận); "kết cục run 203 thuộc
  T7-197" → **"kết cục run 204 thuộc T7-198 (TIMEOUT 23:39:41Z — đã
  xong ở (n)-198, không còn là nợ mở)"** (grep sau sửa: 0 chuỗi sai
  còn trong §125; "run 203" còn 2 dòng trong toàn GAP — 1 trong bullet
  đính chính §127 (có từ trước) + 1 trong bullet đính chính §128 —
  đều trích dẫn nhãn cũ có chủ đích).
  **LIMITS T01-197 + T01-199 KHÔNG viết lại** (file lịch sử — giữ
  nguyên làm bằng chứng; lỗi đã ghi nhận ở đây). Họ lỗi lệch −1 nay đã
  lặp 4 đợt (F-198-T2-1, F-199-T10-1, F-199-T01-2, F-200-T01-1) — T01
  đã đối chiếu số run với T7 (thẩm quyền scheduler) trước khi ghi.
- **F-200-T01-2 — O8 chạy KHI T4 .done CHƯA CÓ (gate thực chất theo
  (p1)-198 — KHÔNG phải vi phạm).** Lúc O8 bắt đầu (11:43:23Z), T4-200
  CHỈ POLL (poll #5 11:43:00Z, gate0 chưa đạt, chưa mở attempt lượt
  yên #68); giữa O8, T4 poll #7–#14 ghi lock=co t01-round200 — T4
  thấy lock nên KHÔNG mở attempt; poll #15 11:50:36Z lock=khong sau
  release. 0 chồng lấn attempt đang chạy trong toàn bộ cửa sổ O8.
  T01 ghi rõ gate + bằng chứng vào LIMITS ngay lúc chạy, đúng điều
  khoản thay thế của (p1)-198. T8-200 vẫn chờ T4 .done trước khi chạy
  harness (quy tắc đứng).
- **F-200-T01-3 — O8 WebKit attempt1 FAIL ở S1 (setup), KHÔNG phải
  assertion nội dung.** S0 PASS (mẫu tự load 3 clip, media 2 item);
  S1 FAIL "không đo được rect checkbox tự tạo proxy" (toggle
  ok:false, method mouse) — checkbox chưa đo được rect, tức trang
  chưa sẵn sàng hoặc element chưa render kịp lúc đo. Attempt2 S1
  PASS ngay ("Playwright mouse click lần 2") trên CÙNG CÂY, CÙNG
  BOOT, 5 phút sau — ủng hộ giả thuyết timing/tải (lúc attempt1,
  T56-200 bắt đầu apt + load1 tới 10,31; poll #7 11:44:32Z load1
  10,31, blockers=3), KHÔNG phải lỗi sản phẩm. T01 KHÔNG kết luận
  nguyên nhân chắc chắn — parent + P1/P4 quyết có coi attempt1 là
  flake đo lường hay không; chân FULL PASS đã KHÔNG ĐẠT vì 2/3.
- **F-200-T01-4 — Probe S1 KHÔNG phân biệt được (a)/(b) — probe tự
  FAIL trước S1.** Probe timeout chờ project mẫu tự load (last=null),
  exit=2 sau 4m15s (11:43:51–11:48:06Z) — CÙNG HỌ F-197-T01-3
  (attempt1 đợt 197 cũng harness timeout chờ mẫu tự load). Probe chạy
  đúng lúc tải cao nhất (T56-200 apt + T4 poll + O8 vite cùng lúc;
  load1 10,31 lúc 11:44:32Z) — timeout chờ load có thể là hệ quả tải,
  không phải renderer chết. Probe KHÔNG đưa ra kết luận về checkbox
  S1; chẩn đoán duy nhất đứng là attempt2 S1 PASS (xem F-200-T01-3).
- **F-200-T01-5 — Khoảng event 3.004,755 s bao trùm btime #130:
  T01 CHỈ BÁO SỐ THÔ.** Khoảng bắt đầu 10:45:34Z (36m07s TRƯỚC reboot
  #130) — giống S8 (bắt đầu 1h46m trước reboot #128) ở chỗ lặng (nếu
  có) KHÔNG chỉ là cửa sổ reboot + daemon recovery; NHƯNG T01 KHÔNG
  gọi là lặng/outage: (1) HB due 11:20:50Z KHÔNG dispatch sớm 11:15:34Z
  như mẫu (−316 s) — daemon đã im TRƯỚC reboot, chưa rõ vì sao;
  (2) khoảng 5.134,729 s trước đó (09:16:08Z → 10:41:43Z) cũng 0 event
  mà KHÔNG có reboot nào trong đó — lặng dài không gắn reboot đã xảy
  ra ngay trong phiên; (3) phân loại lặng/outage là thẩm quyền T7 +
  parent (n), không phải T01. T01 báo đủ số thô để T7-200 phân loại:
  2 khoảng, ID liên tục, 0 event mất, btime #130 trong khoảng sau.
- **F-200-T01-6 — Run 9cd50793: finished_at_utc trong row lệch đúng
  2.000 s so với event succeeded — BẤT THƯỜNG, T01 KHÔNG tự sửa.**
  Row: finished 1795768968 = 08:42:48Z; event eid 11585 succeeded
  09:16:08.660Z = 1795770968.660; chênh đúng 2.000 s (1795770968 −
  1795768968). Claimed 1795770898 = 09:14:58Z (trước event 70 s) thì
  khớp event. Không có event nào lúc 08:42:48Z. T01 chỉ báo số thô;
  phân loại + xác định thuộc T7-200 (row bị viết sai, hay finished_at
  mang nghĩa khác với event?).
- **F-200-T01-7 — ĐÍNH CHÍNH SỐ MỤC GAP: T01-200 viết §128 cho đợt
  200.** §123 đã có (T10-195 viết cho đợt 195), §124 đã có (T01-196
  viết cho đợt 196), §125 đã có (T01-197 viết cho đợt 197), §126 đã có
  (T01-198 viết cho đợt 198), §127 đã có (T01-199 viết cho đợt 199)
  — T01-200 viết **§128** (không ghi đè, không tạo § trùng). T10-200
  + parent lưu ý khi đối chiếu số mục GAP.
- **F-200-T01-8 — Giả thuyết reboot 02:34:43Z BỊ BÁC (daemon-only
  restart; số hiệu #128/#129 ĐỨNG).** Requeue eid 11502 02:34:43.028Z
  (detail "daemon startup recovery") — NẾU là reboot, implied btime =
  02:34:00.367–02:34:02.094Z (offset mẫu #127 +42.661 s / #129
  +40.934 s). Hai witness độc lập viết SAU implied btime, TRƯỚC
  requeue: (1) `replay-watch-198.log` poll 02:34:21Z (grid 30 s từ
  00:38:46Z, boot=6882f9a9 — process gốc, không respawn); (2) T10-198
  `count-198-t10.py` mtime 02:34:13.116Z. Find toàn ~/workspace trong
  (02:33:54, 02:34:43) chỉ thấy đúng 2 file này. Máy reboot ở 02:34:00Z
  thì downtime 02:34:00–02:34:43Z — cả hai write đều không thể xảy ra.
  Reboot ở btime muộn hơn (02:34:22–02:34:30Z, sau witness cuối) đòi
  daemon start trong 13–21 s — mẫu #127/#129 là 40.9–42.7 s, PID 1
  start btime+12–18 s — không khả thi. Cơ chế có thể nhất: daemon
  restart kèm restart userspace/runtime (boot_id/btime KHÔNG đổi).
  LOOSE END: replay-watch-198.log DỪNG sau poll 02:34:21Z — không có
  dòng END (hạn 02:35:51Z), STOP hay REPLAY_DONE; process chết trong
  (02:34:21, 02:34:51). Nguyên nhân chưa xác định (không có lệnh kill
  trong diag script T10-198; T56-198 đã đóng 01:35:23Z nên không ai
  respawn) — điểm này KHÔNG lật kết luận (nó chỉ cho thấy CÓ sự kiện
  giết process trong cửa sổ đó, không chứng minh được là reboot
  kernel; mọi btime reboot tương thích với requeue đều đã bị loại).
- **F-200-T01-9 — Daemon restart 08:41:43Z CHƯA GIẢI QUYẾT — số hiệu
  #130 CÓ ĐIỀU KIỆN.** Requeue eid 11570 run 9cd50793 08:41:43.720Z +
  dispatched .811Z + reattached .862Z (detail "daemon startup
  recovery" / "re-keyed waiter on active execute turn") — CÙNG MẪU
  02:34:43Z (requeue + dispatch + reattach trong ~200 ms). NẾU là
  reboot, implied btime ≈ 08:41:00.7–08:41:02.8Z và boot mới = #131.
  T01-200 KHÔNG chứng minh được bản chất: find toàn ~/workspace trong
  (08:41:00, 08:41:43) = 0 file (T10-199 viết 08:24–08:25Z, T10b-199
  viết 08:43:29Z/08:43:43Z — không witness); daemon viết event gần
  nhất 08:39:01Z (timeout + dispatch run 9cd50793), 162 s trước
  requeue — cửa sổ im bình thường, không phân biệt được. Gợi ý YẾU
  ủng hộ daemon-only: reattach detail "active execute turn" (worker
  còn sống lúc reattach) — KHÁC "execute turn already complete" của
  #127/#129/02:34:43Z. KHÔNG đủ làm bằng chứng. **Parent quyết
  (e)-200: #130 hay #131.** T01 ghi #130 theo hệ quả trực tiếp từ
  (e)-199 (02:34:43Z đã bác là reboot) + giả định 08:41:43Z cũng là
  daemon-only; nếu parent phán 08:41:43Z là reboot thì toàn bộ nhãn
  #130 trong LIMITS/GAP đợt này phải dời +1 (thành #131) và (m) #130
  thành (m) #131.
- **F-200-T01-10 — worker_boot_generation ĐỔI theo mỗi lần daemon
  restart (cả restart không reboot) — KHÔNG dùng được làm bằng chứng
  reboot.** Run 205 + run 206 CÙNG 751f76ee (gen từ 02:34:43Z); run 207
  bff508b1 (gen từ #129 06:39:37Z); run 9cd50793 7d6a37d2 (gen từ
  08:41:43Z); run 208 0eac28bb (gen từ #130). Gen đổi ở 08:41:43Z
  (không reboot nào đã xác nhận giữa #129 và 08:41:43Z) chứng minh
  gen đổi cả khi daemon restart đơn thuần. Bài học: đừng dùng boot_gen
  để suy ra reboot (tiền lệ T01-199 ghi boot_gen đổi ở 02:34:43Z như
  một dữ kiện — nay đã rõ nó không phân biệt được).

## Phạm vi chưa kiểm (không thuộc T01)

- ĐÃ ĐÓNG TRONG PHIÊN (T01 trích dẫn, không xác minh lại nội dung chuyên
  môn): số hiệu #130 (ứng viên CÓ ĐIỀU KIỆN — parent quyết (e)); (m)
  #130 THÔ 0 requeue + (m) #129 THÔ 1 requeue (phân loại CUỐI thuộc
  T2-200); POSTBOOT_PASS #130 CHƯA CÓ (T56-200 đang repair); watcher-200
  CHƯA SPAWN; run 207 TIMEOUT 08:39:01Z (cf THÔ 119 s — phân loại thuộc
  T7-200); run 9cd50793 finished_at_utc lệch 2.000 s (T7-200); run 208
  RUNNING (T7-200); lượt yên #68 (T4-200: chưa mở attempt lúc T01 đóng
  — mới poll #15, gate0 chưa đạt); kết quả sản phẩm P1/P3/P4 đợt 200
  (chưa luồng nào đóng lúc T01 đóng — P2 đã đóng, xem §128).
- CHƯA KIỂM / CHUYỂN ĐỢT 201: số hiệu #130 (CÓ ĐIỀU KIỆN — parent quyết
  (e)-200); (m) #129 + (m) #130 (phân loại CUỐI thuộc T2-200); khoảng
  event 3.004,755 s + 5.134,729 s (phân loại thuộc T7-200 + parent (n));
  POSTBOOT_PASS #130 caveat (parent (c)-200); marker 81 nếu #130 xác
  nhận; kết cục run 207 + run 9cd50793 + run 208 (T7-200); watcher-200
  theo dõi tiếp (T56-200); T7/T8/T9/P1/P3/P4 đợt 200 — KHÔNG có cờ lúc
  T01 đóng (T10-200 quyết giao muộn hay rớt đợt); khung ban ngày 27/11
  (15:15:34–17:35:40Z) giao T7-202/T7-203 (theo T7-199); OUTAGE #1–#7
  VẪN MỞ (phân loại thuộc parent); §125/§127 nhãn run đã sửa xong
  (F-200-T01-1).
- (m) #121 + INSIDE + (m) #56 (T2-200).
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-200); không kiểm
  lại nguyên nhân khoảng event 3.004,755 s hay trigger của nó; không chạy
  `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file
  trực tiếp theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt
  kê; 2 lệnh find có phạm vi trong mục F-200-T01-8/9 đều là find theo
  mtime hẹp, không phải grep đệ quy nội dung).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round200-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round200-t01/appendix200.py` + `appendix200.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay — mọi epoch đã
  kiểm bằng `date -d @epoch` độc lập; 2 epoch tuyệt đối trong bản nháp
  gap đã sửa trước khi chạy (lệch đều 1800 s / 7200 s, hiệu vẫn đúng —
  bài học F-199-T01-8: kiểm epoch TUYỆT ĐỐI, không chỉ hiệu)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round200-t01/boot-survey-200t01.sh`
  + `boot-survey-200t01.txt` (output thô 9 nguồn boot mới #130 — đo tươi
  11:39:01Z; script adapt từ 199; đo Cloudflare chặt theo F-188-T0-9;
  KHÔNG grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round200-t01/o8-driver-200t01.sh` +
  `o8-200t01.log` + `o8-lock.log` + `o8-driver-200t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-200t01.mjs` + `eperm-retry.mjs` (probe SẴN SÀNG — ĐÃ CHẠY
  nhưng FAIL timeout chờ mẫu tự load, xem F-200-T01-4)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round200-t01/gap128-draft.md`
  (bản nháp GAP §128 trước khi ghi vào PHASE9_GAP_ANALYSIS.md)
