# PHASE9_ROUND173_T0_BOOT_O8_LIMITS.md

Đợt 173 — T0 (boot survey + xác minh reboot mới + O8). Mở ~20:40Z, đóng ~20:54Z 22/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #83 MỚI — XÁC NHẬN 9 nguồn**: boot_id `dd08464a-c4e5-4162-951e-0705e8149d97`
  (khác #82 `34e61c92`); btime **20:25:47Z** (epoch 1795379147; uptime bracket ×3 khớp cùng giây,
  boot_est 1795379147.909/.903/.908; /proc/1 start_ticks 1177 = btime +11,77 s, stat mtime
  20:25:59.680Z = btime +12,68 s; journal idx 0 duy nhất, first 20:26:00.044Z = btime +13,04 s;
  wtmp begins 20:25:59Z; last reboot 20:25 still running; Cloudflare local ≈ CF −1 s ×2;
  DB: run 173 boot_gen MỚI 1e836713, run 172 SUCCEEDED trên boot_gen #82, 0 event trong
  [btime, 20:35:51Z); marker mtime không đổi).
- Gap #82→#83 = **5.099 s (1h24m59s)** — #82 sống 5.099 s. #83 xảy ra SAU khi T10-172 đóng sổ
  (~20:14Z) và TRƯỚC khi đợt 173 mở (20:35:51Z) — trong khoảng mù giữa hai đợt.
- **Reboot #82 XÁC NHẬN (nợ đợt 172, T0-173 xác minh 9 nguồn theo quy ước)**:
  boot `34e61c92-4b99-4487-85a7-e77d545d6d92`, btime **19:00:48Z** (epoch 1795374048);
  gap #81→#82 kiểm lại = **7.123 s — KHỚP T7-172**. DB đọc tươi: run 172 started MỚI 19:01:26Z
  (btime82 +38 s), boot_gen 307b8432 (khác #81 0672507b, khác #83 1e836713);
  eid 10167 requeued 19:01:26.438Z = btime82 +38,438 s. Watcher-172 poll cuối 19:01:11Z
  boot=4b9db449 = btime82 +23 s (xem F-173-T0-1). Journal/wtmp hiện tại chỉ còn boot #83
  (reset theo reboot — cùng mẫu #81); boot_id #82 không đọc lại trực tiếp được, dựa vào
  bản ghi 9 nguồn của T7-172 + DB đọc tươi + chuỗi boot_gen 3 thế hệ.
- **Marker sống qua 35 reboot (#49–#83)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (34 qua #82 + #83).
- **Run 172 SUCCEEDED (DB đọc tươi — kết cục thuộc T7-173)**: finished 20:16:59Z trên boot #82,
  margin tới hạn 20:35:51Z = **1.132 s**; thực thi trên boot #82 4.533 s; claimed→finished 109 s
  (claimed DB hiện tại 20:15:10Z — xem F-173-T0-3); wall sched→finished 9.668 s; attempt 1.
  Run 172 finished 528 s TRƯỚC btime #83 → KHÔNG bị viết lại tại #83.
  Run 173 running, sched/started 20:35:51Z, boot_gen 1e836713 (#83), jitter 0 s.
- **(m) #82 — SỐ LIỆU THÔ KIỂM LẠI ĐỘC LẬP (phân loại cuối thuộc T2-173 + parent 173)**:
  requeue eid 10167 `requeued_after_restart` **btime82 +38,438 s**, NẰM TRONG band [33; 49,8] —
  cách biên dưới **5,438 s** (lớn hơn gấp ~11 lần margin 0,477 s của #81, KHÔNG sát biên);
  run 172 SỐNG tại btime82; 1 requeue duy nhất. So sánh: #81 +33,477 s DƯƠNG (parent quyết (e)
  đợt 172); #71 +41,274 s DƯƠNG; #72 +39,548 s DƯƠNG.
- **(m) #83 — SỐ LIỆU THÔ CHO T2-173 (T0 không phân loại cuối)**: 0 run sống tại btime83
  (run 172 finished 528 s trước; run 173 dispatch 604 s sau) + **0 requeue** trong cửa (m)
  [20:26:20Z, 20:26:37Z] lẫn cửa rộng [btime83, btime83+900 s] → **KHÔNG PHẢI ĐIỂM (m)**
  (cùng mẫu #80: 0 requeue).
- **O8 trên boot #83 — WebKit FAIL ×2, Chromium PASS 21/21 (20:44:24–20:50:31Z):**
  WebKit attempt1 pid19714 exit=2, S0 PASS 20:44:56.391Z, S1 FAIL 20:44:56.748Z
  (toggle "không đo được rect checkbox tự tạo proxy"), HARNESS LỖI `page.setInputFiles:
  Target crashed`; JSON 2 results (S0 ok, S1 fail), md5 `c87e14e6…`, bản copy khớp bản stamped.
  WebKit attempt2 pid20320 exit=2, KHÔNG tới được S0 — timeout chờ project mẫu tự load
  sau 4m12s; JSON 0 results, md5 `b389bf6b…`, bản copy khớp bản stamped.
  Chromium pid28601 exit=0, **21/21 PASS** (S1 PASS qua CDP mouse click lần 2, 20:49:48.451Z),
  JSON 21 results, 21 ok=true, md5 `58c9a64e…`, bản copy khớp bản stamped.
  Đếm lại từ JSON gốc bằng python (xem trên).
- **Probe S1 (chẩn đoán (a)-vs-(b), chạy lại đúng cách 20:52:25–20:52:37Z): (a) RENDERER CHẾT —**
  S0 PASS 20:52:36.261Z, S1 FAIL 20:52:36.300Z (chỉ 39 ms sau S0),
  PROBE-143T8: `pageErrs=["PAGE-CRASH"]`, mọi evaluate sau S1 đều
  `__err: "page.evaluate: Target crashed"` (autoUi/labelCount/labelsTotal/checkboxCount/
  onePlusOne/storeAlive), pageClosed=false, browserVersion 27.2. KHÔNG phải (b) label vắng
  khỏi DOM — không đo được DOM vì target đã chết.
- **Chuỗi WebKit FULL PASS GIỮ 24 — KHÔNG TĂNG đợt này từ bộ O8 của T0** (WebKit FAIL;
  điều kiện O8 sau lượt yên trên cùng boot không thỏa). Không có đề xuất tăng chuỗi đợt này.
  Đề nghị T8-173 chạy lại O8 WebKit SAU khi POSTBOOT_PASS #83 có (repair/replay xong):
  nếu PASS thì FAIL này là timing môi trường tiền-postboot, không phải hồi quy code;
  nếu vẫn FAIL thì là hồi quy WebKit thật, cần điều tra.
- POSTBOOT_PASS #83 CHƯA CÓ lúc T0 đóng (T5-173 đã khởi động watcher-173; T4 preflight
  20:42Z: CHƯA ĐỦ — thiếu 5 lib hệ thống, GST 0, 11 gói chưa cài; replay đang chạy,
  dpkg_lines 323 lúc T4 poll #12). T0 chạy O8 TRƯỚC khi postboot xong — khác đợt 172
  (O8 chạy sau repair 17:50Z). Đây là khác biệt môi trường lớn nhất giải thích FAIL WebKit.
- T4-173 đang poll chờ gate0 (poll #14 20:52:34Z: gate0 khong-dat, postboot_exit=1);
  T0 KHÔNG chạy O8 chồng cửa sổ attempt của T4 (T4 chưa vào attempt — gate chưa mở;
  O8 chỉ chồng pha (a) poll). T6-173 harness đã xong suite trước khi T0 bắt đầu O8.
- X11: 3 socket mồ côi X193/X194/X195 (mtime 20:47:19Z, fuser 0 process, 0 Xvfb) —
  giao T8-173 dọn (cùng mẫu đợt 172). 0 process sót lúc đóng.
  Boot lúc T0 đóng vẫn dd08464a (kiểm cuối ngay trước khi viết .done — xem F-173-T0-5).

## Giới hạn / sai số ghi nhận (F-173-T0-*)

- **F-173-T0-1 — Dị thường watcher-log +23 s (mẫu thứ ba liên tiếp).** Poll cuối watcher-172
  19:01:11Z boot=4b9db449 = btime #82 +23 s; poll trước 19:00:41Z (trước btime 7 s); log dừng
  ở 19:01:11Z — watcher chết theo #82. Cùng mẫu F-172-T5-1 (#81 +20 s): boot_id cũ thật sự
  còn đọc được >20 s sau btime mới. Timestamp watcher-log KHÔNG dùng làm chân lý xuyên-boot
  (đã kết luận đợt 172). Giao T2-173 (cận trên "boot cũ chết" từ poll cuối không chắc chắn).
- **F-173-T0-2 — Xác minh #82: 2/9 nguồn không đọc lại trực tiếp được.** Journal và wtmp hiện
  tại chỉ còn boot #83 (reset theo reboot — cùng mẫu #81); boot_id #82 (34e61c92) không đọc
  lại trực tiếp từ /proc hay journal. Xác minh dựa vào: bản ghi 9 nguồn tươi của T7-172
  (aggregate 172 §7) + DB đọc tươi (started mới, boot_gen, eid 10167) + chuỗi boot_gen
  3 thế hệ + watcher-log + gap số học. T0 ghi rõ phần nào là đọc tươi, phần nào là thừa
  hưởng — không giấu.
- **F-173-T0-3 — claimed_at run 172 hiện tại khác ghi nhận của T7-172.** DB đọc tươi lúc
  ~20:44Z: worker_claimed_at_utc = 1795378510 (20:15:10Z) → claimed→finished 109 s.
  T7-172 ghi "claimed_at KHÔNG đổi" (lúc T7 đọc ~19:55Z, trước khi run 172 finish).
  Có thể claimed_at được cập nhật sau thời điểm T7 đọc (khi worker claim pha cuối);
  T0 chỉ ghi giá trị đọc tươi + thời điểm đọc, KHÔNG suy đoán cơ chế. Giao T7-173 đối
  chiếu. Nếu claimed_at gốc (= sched) mới là số đúng cho "ca ≥60 s" thì 109 s này
  không tính; T0 không phán.
- **F-173-T0-4 — Probe S1 lần đầu KHÔNG CHẠY ĐƯỢC (2 lỗi latent trong bản copy probe,
  T0 đã sửa và chạy lại đúng cách).** (a) Probe copy từ round172-t0 thiếu file kèm
  `eperm-retry.mjs` (import `./eperm-retry.mjs` — file này chỉ có ở repo scripts;
  round 172 không chạy probe nên lỗi chưa từng lộ) → ERR_MODULE_NOT_FOUND, exit=1
  trong 1 s. (b) `ROOT = dirname + ../../..` từ vị trí hidden_files/round173-t0 trỏ
  về `~/workspace/goals`, không phải repo → VITE_BIN không thấy ("không thấy vite").
  T0 đã copy `eperm-retry.mjs` (md5 7817da4b khớp bản repo) vào round173-t0 và sửa
  ROOT trong BẢN COPY probe (không sửa script gốc trong repo), chạy lại 20:52:25Z —
  lần này probe chạy đúng và cho chẩn đoán PROBE-143T8 đầy đủ. Các đợt sau copy probe
  phải kèm `eperm-retry.mjs` + sửa ROOT (hoặc chạy probe từ trong repo scripts).
- **F-173-T0-5 — Kiểm boot lần cuối ngay trước khi viết .done** (bài học F-171-T10-2):
  boot kiểm lúc 20:54:27Z = dd08464a, btime 1795379147 — vẫn #83, không reboot mới;
  .done viết ngay sau đó (~20:54Z).
- **F-173-T0-6 — T0 chạy O8 TRƯỚC khi POSTBOOT_PASS #83 có.** Khác đợt 172 (O8 sau repair).
  WebKit FAIL có thể chỉ là timing môi trường tiền-postboot (system libs chưa cài, replay
  đang chạy, dpkg_lines 323). T0 KHÔNG kết luận đây là hồi quy code — chỉ ghi FAIL +
  bằng chứng phân biệt (Chromium PASS cùng cây code; WebKit PASS ×4 trên #81 sau repair).
  Việc chạy lại O8 sau postboot thuộc T8-173 (T8 có bộ O8 riêng).
- **F-173-T0-7 — T0 không chạy lại suite T1, không kiểm lại dải FULL127/FULL128, không đếm
  lại ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + probe. POSTBOOT_PASS #83 thuộc T5-173
  (T0 chỉ đọc trạng thái); (m) #82/#83 phân loại cuối thuộc T2-173 + parent; kết cục
  run 172/173 thuộc T7-173; lượt yên #42 + chuỗi O8 thuộc T4/T8/T10-173 + parent;
  dọn socket X11 thuộc T8-173.

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #82/#83 phân loại cuối (T2-173 + parent); INSIDE #83 + FULL128 (T2-173);
  kiểm lại FULL127 độc lập (T2-173, nợ từ đợt 172);
  kết cục run 172/173 (T7-173); POSTBOOT_PASS #83 + watcher-173 (T5-173);
  E-177 kết cục (T9-173); harness + O8 bộ thứ hai + chạy lại O8 WebKit sau postboot (T8-173);
  dọn X193/X194/X195 (T8-173); (f') triển khai + replay trên log đợt 172 (T8-173);
  84l10 điều tra đợt 2 + Q3 heartbeat (T8-173).
- Không kiểm lại dải FULL125/FULL126; không chạy lại suite T1 (chỉ O8); không xác minh
  actor của replay #83.

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round173-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round173-t0/appendix173.py` + `appendix173.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round173-t0/boot-survey-173t0.txt`
  (output thô 9 nguồn)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round173-t0/o8-driver-173t0.sh` +
  `o8-173t0.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped + bản copy dự phòng khớp md5)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round173-t0/o8-s1-probe-173t0.mjs` +
  `eperm-retry.mjs` + `o8-probe/` (o8w-s1-probe.json + o8-probe-173t0.log) + `o8-probe-lock.log`
