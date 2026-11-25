# PHASE9_ROUND174_T0_BOOT_O8_LIMITS.md

Đợt 174 — T0 (boot survey + xác minh reboot mới + O8). Mở ~23:38Z, đóng ~23:5xZ 22/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #85 MỚI — XÁC NHẬN 9 nguồn**: boot_id `3c704685-a16c-4b61-8573-af6eb7cb48c6`
  (khác #84 `4ae2d2ea`); btime **22:59:36Z** (epoch 1795388376; uptime bracket ×3 khớp cùng giây,
  boot_est 1795388376.729/.738/.729; /proc/1 start_ticks 1148 = btime +11,48 s, stat mtime
  22:59:48.218Z = btime +12,218 s; journal idx 0 duy nhất, first 22:59:48.774Z = btime +12,774 s;
  wtmp begins 22:59:48Z; last reboot 22:59 still running; Cloudflare local ≈ CF −1 s ×2;
  DB: run 173 boot_gen MỚI 4cb68ccd, requeue eid 10222 23:00:10.397Z = btime +34,397 s,
  run 173 TIMEOUT 23:36:04Z trên boot_gen #85; marker mtime không đổi).
- Gap #84→#85 = **7.101 s (1h58m21s)** — #84 sống 7.101 s. #85 xảy ra SAU khi T10-173 đóng sổ
  (~23:35Z) và TRƯỚC khi đợt 174 mở (23:35:51Z) — trong khoảng mù giữa hai đợt.
- **Reboot #84 XÁC NHẬN (nợ đợt 173, T0-174 xác minh 9 nguồn theo quy ước)**:
  boot `4ae2d2ea-a7d6-4869-8b32-2a142adaa586`, btime **21:01:15Z** (epoch 1795381275);
  gap #83→#84 kiểm lại = **2.128 s — KHỚP T7-173/T2-173**. DB đọc tươi: run 173 started viết lại
  lần 1 21:02:00Z (btime84 +45 s), boot_gen a6a30a36 (khác #83 1e836713, khác #85 4cb68ccd);
  eid 10197 requeued 21:02:00.482Z = btime84 +45,482 s. Watcher-173 poll cuối 21:01:24Z
  boot=dd08464a = btime84 +9 s (xem F-174-T0-1). Journal/wtmp hiện tại chỉ còn boot #85
  (reset theo reboot — cùng mẫu #81/#82/#83); boot_id #84 không đọc lại trực tiếp được, dựa vào
  bản ghi 9 nguồn tươi của T7-173 + 8 nguồn của T2-173 + DB đọc tươi + chuỗi boot_gen 5 thế hệ.
- **Marker sống qua 37 reboot (#49–#85)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (35 qua #83 + #84 + #85).
- **Run 173 TIMEOUT (DB đọc tươi ~23:41Z — kết cục thuộc T7-174)**: finished 23:36:04Z,
  status `timeout`, timed_out true, attempt 1, boot_gen 4cb68ccd (#85); wall sched→finished
  10.813 s (hạn ngân sách 23:35:51Z — finished SAU hạn 13 s); timeout event eid 10229
  23:36:04.643Z; đúng 8 event, đúng 2 lần viết lại (#84 + #85), không thêm.
  **Claimed_at DB hiện tại 23:35:51Z (= đúng hạn ngân sách) — KHÁC T7-173 ghi 20:35:51Z**
  (không đổi qua 8 lần đọc) → claimed→finished theo DB hiện tại = 13 s (xem F-174-T0-3).
- **(m) #84 — SỐ LIỆU THÔ KIỂM LẠI ĐỘC LẬP (phân loại cuối thuộc T2-174 + parent 174)**:
  requeue eid 10197 `requeued_after_restart` **btime84 +45,482 s**, NẰM TRONG band [33; 49,8] —
  cách biên dưới **12,482 s** (lớn nhất từ #81), cách biên trên 4,318 s;
  run 173 SỐNG tại btime84; 1 requeue duy nhất cửa hẹp lẫn cửa rộng.
- **(m) #85 — SỐ LIỆU THÔ KIỂM LẠI ĐỘC LẬP (phân loại cuối thuộc T2-174 + parent 174)**:
  requeue eid 10222 `requeued_after_restart` **btime85 +34,397 s**, NẰM TRONG band [33; 49,8] —
  **cách biên dưới 1,397 s (sát biên thứ hai sau #81 0,477 s)**, cách biên trên 15,403 s;
  run 173 SỐNG tại btime85; 1 requeue duy nhất cửa hẹp (ĐÃ KHÉP HẲN lúc T0 đọc — khác T7-173
  đọc lúc cửa chưa khép) lẫn cửa rộng; requeue MỌI job trong [btime84, btime85+900 s] đúng 2 dòng.
  Caveat phân số: boot_est #85 = btime +0,729 s → offset ≈ +33,668 s, VẪN TRONG band,
  cách biên dưới ≈ 0,668 s (xem F-174-T0-4).
- **O8 trên boot #85 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (23:43:42–23:47:50Z):**
  WebKit attempt1 pid18668 exit=0, **21/21 PASS** (S1 PASS 23:44:00.899Z, Playwright mouse click
  lần 2), JSON 21 results, 21 ok=true, md5 `f91f8fe6…`, bản copy khớp bản stamped.
  WebKit attempt2 pid25983 exit=0, **21/21 PASS** (S1 PASS 23:45:29.970Z), JSON 21 results,
  21 ok=true, md5 `d9f19eb6…`, bản copy khớp bản stamped.
  Chromium pid32439 exit=0, **21/21 PASS**, JSON 21 results, 21 ok=true, md5 `1e6268af…`,
  bản copy khớp bản stamped. Đếm lại từ JSON gốc bằng python (xem NOTES.md).
  **Đối chiếu #83 → #85: trên #83 WebKit FAIL ×2 tiền-postboot (renderer chết, replay chỉ một
  phần dpkg 323); trên #85 WebKit PASS 21/21 ×2 NGAY CẢ tiền-postboot — attempt1 hoàn toàn
  trước cờ (poll1 23:46:25Z, cờ 23:46:57Z); replay #85 đã xong (dpkg 1.647 → 1.731), chỉ thiếu
  2 gói GST + libEGL mà click-test không cần. FAIL #83 được xác nhận là timing môi trường,
  không phải hồi quy code.**
- **Chuỗi WebKit FULL PASS GIỮ 24 — KHÔNG TĂNG đợt này từ bộ O8 của T0** (điều kiện O8 sau lượt
  yên trên cùng boot không thỏa: T4-174 0 attempt tính tới lúc T0 đóng; lượt yên #43 chưa có
  lượt hợp lệ). T8-174 có bộ O8 riêng (chờ T4/T5) — nếu T4 có lượt yên hợp lệ trên #85 + T8 PASS
  thì chuỗi xét lại ở T8/T10-174.
- POSTBOOT_PASS #85 ĐÃ CÓ 23:46:57Z (T5-174, mode repair-tay-T5, poll=1, dpkg 1.731 dòng,
  cache 175, lists 75; poll1 độc lập exit 0 lúc 23:46:25Z) — **viết TRONG LÚC T0 chạy O8**
  (attempt1 hoàn toàn trước cờ; attempt2 chạm poll1-pass ở 12 s cuối; Chromium bắt đầu sau
  poll1 nhưng trước cờ 20 s — xem F-174-T0-6). T4-174 KHÔNG vào attempt trong suốt O8
  (poll #5–#12 đều poll; gate0 chỉ flip sang T5 ở poll #9 23:47:23Z; T4 vẫn poll tới #12
  23:49:40Z, chưa attempt) — O8 chỉ chồng pha (a) poll, không chồng attempt.
- DR 23:00Z: 0 dòng lúc T0 kiểm ~23:41Z — KHÔNG xuất hiện muộn sau lần kiểm cuối của T7-173
  (23:11:49Z). Kết luận cuối thuộc T7-174.
- X11: /tmp/.X11-unix TRỐNG, 0 Xvfb — không còn socket mồ côi (T8-173 đã dọn X193–X195).
  0 process sót lúc đóng. Boot lúc T0 đóng vẫn 3c704685 (kiểm cuối ngay trước khi viết .done).

## Giới hạn / sai số ghi nhận (F-174-T0-*)

- **F-174-T0-1 — Dị thường watcher-log +9 s (mẫu thứ tư liên tiếp).** Poll cuối watcher-173
  21:01:24Z boot=dd08464a = btime #84 +9 s; poll trước 21:00:54Z (trước btime 21 s); log dừng
  ở 21:01:24Z — watcher chết theo #84. Cùng mẫu #81 +20 s, #82 +23 s: boot_id cũ thật sự
  còn đọc được sau btime mới (OVERLAP thứ 11 theo T2-173). Timestamp watcher-log KHÔNG dùng
  làm chân lý xuyên-boot (đã kết luận đợt 172). Giao T2-174 (cận trên "boot cũ chết" từ poll
  cuối không chắc chắn).
- **F-174-T0-2 — Xác minh #84: 2/9 nguồn không đọc lại trực tiếp được.** Journal và wtmp hiện
  tại chỉ còn boot #85 (reset theo reboot — cùng mẫu #81/#82/#83); boot_id #84 (4ae2d2ea)
  không đọc lại trực tiếp từ /proc hay journal. Xác minh dựa vào: bản ghi 9 nguồn tươi của
  T7-173 (đọc lúc ~21:02Z + kiểm lại 22:18Z + 23:11Z) + 8 nguồn của T2-173 + DB đọc tươi
  (started viết lại lần 1, boot_gen, eid 10197) + chuỗi boot_gen 5 thế hệ + watcher-log +
  gap số học. T0 ghi rõ phần nào là đọc tươi, phần nào là thừa hưởng — không giấu.
- **F-174-T0-3 — claimed_at run 173 DB hiện tại khác ghi nhận của T7-173.** DB đọc tươi lúc
  ~23:41Z: worker_claimed_at_utc = 1795390551 (23:35:51Z = ĐÚNG hạn ngân sách sched+10.800 s)
  → claimed→finished 13 s. T7-173 ghi claimed_at = 1795379751 (20:35:51Z, KHÔNG đổi qua 8 lần
  đọc tới 23:11Z). Có thể claimed_at được cập nhật khi worker claim pha cuối / khi timeout
  (23:35:51Z–23:36:04Z); T0 chỉ ghi giá trị đọc tươi + thời điểm đọc, KHÔNG suy đoán cơ chế.
  Giao T7-174 đối chiếu. Hệ quả nếu 13 s là số đúng: run 173 KHÔNG thuộc họ claimed→finished
  ≥60 s (khác run 171/172); F-173-T0-3 + F-173-T7-2 (số thứ tự ca ≥60 s) vẫn chờ T7-174 chốt
  từ DB — T0 không phán.
- **F-174-T0-4 — Caveat phân số cho (m) #85 (cùng họ caveat #81).** boot_est #85 đo độc lập
  bằng uptime bracket ×3 = btime +0,729 s (chênh nhau <0,01 s). Nếu dùng boot_est phân số thay
  btime nguyên thì offset requeue #85 ≈ +33,668 s — VẪN TRONG band [33; 49,8] nhưng cách biên
  dưới chỉ còn ≈ 0,668 s (thay vì 1,397 s trên btime nguyên). Caveat này KHÔNG lật verdict
  theo ước tính, nhưng làm (m) #85 nhạy với quy ước estimator hơn #84 (margin 12,482 s).
  Quy ước đứng vẫn là btime nguyên /proc/stat (quyết (e) đợt 172 cho #81 đã chấp nhận caveat
  tương tự). Phân loại cuối thuộc T2-174 + parent 174.
- **F-174-T0-5 — Lỗi gõ tay epoch ở phụ lục §I (ĐÃ SỬA, bài học ghi).** Bản nháp đầu của
  appendix174.py gõ sai epoch mtime của cả 10 file .done đợt 173 (lệch hệ thống +4.800 s —
  giờ hiển thị 22:14 thay vì 20:54 v.v.). T0 phát hiện khi đối chiếu output với `stat` gốc,
  sửa bằng epoch đọc trực tiếp từ `stat -c %Y` và kiểm lại bằng `date -u` (mọi giờ khớp từng
  giây). Bài học: KHÔNG gõ tay epoch từ giờ hiển thị — lấy epoch trực tiếp từ `stat`/DB rồi
  mới đổi ra giờ bằng script.
- **F-174-T0-6 — POSTBOOT_PASS #85 viết TRONG LÚC T0 chạy O8.** Cờ viết 23:46:57Z (mtime chính
  xác 23:46:57.580Z); poll1 độc lập exit 0 lúc 23:46:25Z. WebKit attempt1 (23:43:42–23:45:10Z)
  hoàn toàn trước cờ; attempt2 (23:45:10–23:46:37Z) chạm poll1-pass ở 12 s cuối nhưng kết thúc
  20 s TRƯỚC khi cờ viết; Chromium (23:46:37–23:47:50Z) bắt đầu sau poll1 nhưng trước cờ 20 s.
  Cả ba đều PASS 21/21 nên không có nghi vấn "pass nhờ cờ viết giữa chừng" — attempt1 đã pass
  khi môi trường còn thiếu 2 gói GST + libEGL. T4 không vào attempt trong suốt O8 (poll #5–#12)
  nên không có chồng lấn cửa sổ attempt. T0 ghi rõ mốc thời gian từng bộ để T8/T10-174 đối chiếu.
- **F-174-T0-7 — Cloudflare qua urllib bị 403.** `urllib.request` tới https://www.cloudflare.com/
  trả HTTP 403 (bot protection) cả 2 lần. T0 dùng `curl -sI` + User-Agent trình duyệt — lấy
  được Date header, kết quả cùng mẫu các đợt trước (local ≈ CF −1 s: +1,184 s / +1,012 s).
  Các đợt sau dùng curl thay urllib cho nguồn Cloudflare.
- **F-174-T0-8 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #85 thuộc T5-174
  (T0 chỉ đọc trạng thái + mốc thời gian); (m) #84/#85 + INSIDE #83/#84/#85 phân loại cuối
  thuộc T2-174 + parent; kết cục run 173 thuộc T7-174; lượt yên #43 + chuỗi O8 thuộc
  T4/T8/T10-174 + parent; DR 23:00Z kết luận cuối thuộc T7-174.

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #84/#85 phân loại cuối (T2-174 + parent); INSIDE #83/#84/#85 (T2-174; FULL129/FULL130/
  FULL131; chuỗi mới dài 1 từ #82); kết cục run 173 (T7-174; F-174-T0-3 claimed_at);
  DR 23:00Z kết luận cuối (T7-174); POSTBOOT_PASS #85 chi tiết (T5-174); lượt yên #43
  (T4-174); harness + O8 bộ thứ hai (T8-174); #85 có giết holder không + prune lần 49
  (T6-174); headroom + ENOSPC + balloon episode mới (T9-174).
- Không kiểm lại dải FULL125/FULL126/FULL127; không chạy lại suite T1 (chỉ O8); không xác minh
  actor của replay #85.

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round174-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round174-t0/appendix174.py` + `appendix174.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay — xem F-174-T0-5)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round174-t0/boot-survey-174t0.txt`
  (output thô 9 nguồn) + `done-mtimes-173.txt` + `o8-prereq-174t0.txt`
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round174-t0/o8-driver-174t0.sh` +
  `o8-174t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped + bản copy dự phòng
  khớp md5) + `o8-verify-174t0.txt` + `postboot-t4-check-174t0.txt`
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round174-t0/o8-s1-probe-174t0.mjs` +
  `eperm-retry.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver; bản copy
  sẵn cho các đợt sau, md5 khớp bản 173: probe 7d2009cb, eperm-retry 7817da4b)
