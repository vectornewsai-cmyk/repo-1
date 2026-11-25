# PHASE9_ROUND175_T0_BOOT_O8_LIMITS.md

Đợt 175 — T0 (boot survey + xác minh reboot mới + O8). Mở ~02:38Z, đóng ~02:47Z 23/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #86 — XÁC NHẬN 9 nguồn**: boot_id `70b7f7ee-2e0b-4565-b019-bdabc2c6e92c`
  (khác #85 `3c704685`); btime **01:01:37Z** (epoch 1795395697; uptime bracket ×3 khớp cùng giây,
  boot_est 1795395697.897 ×3; /proc/1 start_ticks 1790 = btime +17,90 s, stat mtime
  01:01:55.793Z = btime +18,793 s; journal idx 0 duy nhất, first 01:01:56.564Z = btime +19,564 s;
  wtmp begins 01:01:56Z; last reboot 01:01 still running; Cloudflare local ≈ CF −1 s ×2;
  DB: run 174 boot_gen MỚI 0762915d, requeue eid 10252 01:02:26.418Z = btime +49,418 s,
  run 174 SUCCEEDED 02:24:03Z trên boot_gen #86; run 175 started 02:35:51Z trên boot_gen #86;
  marker mtime không đổi).
- Gap #85→#86 = **7.321 s (2h02m01s)** — #85 sống 7.321 s. #86 xảy ra SAU khi T10-174 đóng sổ
  (~02:2xZ) và TRƯỚC khi đợt 175 mở (02:35:51Z) — trong khoảng mù giữa hai đợt.
- **Marker sống qua 38 reboot (#49–#86)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (37 qua #85 + #86).
- **Run 174 SUCCEEDED (DB đọc tươi ~02:40Z — kết cục thuộc T7-175)**: finished 02:24:03Z,
  status `succeeded`, timed_out false, attempt 1, boot_gen 0762915d (#86); wall sched→finished
  10.092 s (hạn ngân sách 02:35:51Z — finished TRƯỚC hạn 708 s); succeeded event eid 10270
  02:24:03.966Z; đúng 5 event, đúng 1 lần viết lại (#86), không timeout.
  **Claimed_at DB hiện tại 02:23:52Z — KHÁC T7-174 ghi 23:36:04Z** (không đổi qua 8 lần đọc
  tới 02:01:48Z) → claimed→finished theo DB hiện tại = 11 s (xem F-175-T0-3).
  Run 175 f0ac7900: sched = started 02:35:51Z — **jitter 0 s** (trở lại 0 sau +13 s ở run 174).
- **(m) #86 — SỐ LIỆU THÔ KIỂM LẠI ĐỘC LẬP (phân loại cuối thuộc T2-175 + parent 175)**:
  requeue eid 10252 `requeued_after_restart` **btime86 +49,418 s**, NẰM TRONG band [33; 49,8] —
  **cách biên TRÊN 0,382 s (sát biên nhất từng ghi — sát hơn #81 0,477 s ở biên dưới)**,
  cách biên dưới 16,418 s; run 174 SỐNG tại btime86; 1 requeue duy nhất cửa hẹp lẫn cửa rộng
  (cửa hẹp đã khép hẳn lúc T0 đọc). Requeue MỌI job trong [btime85, btime86+900 s] đúng 2 dòng
  (eid 10222 #85 + eid 10252 #86). Caveat phân số: boot_est #86 = btime +0,897 s →
  offset ≈ +48,521 s, VẪN TRONG band, cách biên trên ≈ 1,279 s (xem F-175-T0-4).
- **O8 trên boot #86 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (02:40:52–02:46:17Z):**
  WebKit attempt1 pid17203 exit=0, **21/21 PASS** (S1 PASS 02:41:14.153Z, Playwright mouse click
  lần 2), JSON 21 results, 21 ok=true, md5 `30e46593…`, bản copy khớp JSON stamped theo lượt.
  WebKit attempt2 pid20731 exit=0, **21/21 PASS** (S1 PASS 02:43:19.571Z), JSON 21 results,
  21 ok=true, md5 `55c9d481…`, bản copy khớp JSON stamped theo lượt.
  Chromium pid29459 exit=0, **21/21 PASS** (S1 PASS 02:45:24.011Z, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `67824d3e…`, bản copy khớp JSON stamped theo lượt.
  Đếm lại từ JSON gốc bằng python (xem NOTES.md). **Cả ba bộ đều chạy SAU POSTBOOT_PASS #86
  (02:40:29Z)** — khác đợt 174 (attempt1 hoàn toàn tiền-postboot).
- **POSTBOOT_PASS #86 ĐÃ CÓ 02:40:29Z** (watcher-175, mode **replay-day-du**, poll=0, dpkg 1.545
  dòng, cache 183, lists 37, gst_sys 269; replay đóng băng từ 01:22:11Z — KHÔNG cần repair tay,
  khác #85) — viết TRONG LÚC T0 làm boot survey, TRƯỚC khi O8 bắt đầu 23 s (xem F-175-T0-7).
  Chi tiết thuộc T5-175.
- DR 23:00Z: 0 dòng lúc T0 kiểm ~02:40Z — kiểm lần 9 tổng (3 đợt 173 + 5 đợt 174 + 1 đợt 175).
  Kết luận cuối thuộc T7-175.
- X11: /tmp/.X11-unix TRỐNG, 0 Xvfb. 0 process sót lúc đóng. Boot lúc T0 đóng vẫn 70b7f7ee
  (kiểm cuối 02:47:10Z). Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-175-T0-*)

- **F-175-T0-1 — Dị thường watcher-log +36 s (mẫu thứ năm liên tiếp, LỚN NHẤT từng ghi).**
  Poll cuối watcher-174 01:02:13Z boot=3c704685 = btime #86 +36 s; poll trước 01:01:42Z
  (+5 s); trước nữa 01:01:12Z (trước btime 25 s); log dừng ở 01:02:13Z — watcher chết theo #86.
  Cùng mẫu #81 +20 s, #82 +23 s, #84 +9 s: boot_id cũ thật sự còn đọc được sau btime mới.
  Timestamp watcher-log KHÔNG dùng làm chân lý xuyên-boot (đã kết luận đợt 172). Giao T2-175.
- **F-175-T0-2 — Xác minh #85: 2/9 nguồn không đọc lại trực tiếp được.** Journal và wtmp hiện
  tại chỉ còn boot #86 (reset theo reboot — cùng mẫu #81–#85); boot_id #85 (3c704685)
  không đọc lại trực tiếp từ /proc hay journal. Xác minh dựa vào: bản ghi 9 nguồn tươi của
  T0-174 (đọc lúc ~23:40Z) + DB đọc tươi (run 174 started gốc với boot_gen 4cb68ccd theo
  T7-174 đọc #1, viết lại tại #86 sang 0762915d; eid 10252) + chuỗi boot_gen. T0 ghi rõ phần
  nào là đọc tươi, phần nào là thừa hưởng — không giấu.
- **F-175-T0-3 — claimed_at run 174 DB hiện tại khác ghi nhận của T7-174.** DB đọc tươi lúc
  ~02:40Z: worker_claimed_at_utc = 1795400632 (02:23:52Z) → claimed→finished 11 s.
  T7-174 ghi claimed_at = 1795390564 (23:36:04Z, KHÔNG đổi qua 8 lần đọc tới 02:01:48Z).
  Có thể claimed_at được cập nhật khi worker claim pha cuối / khi finish
  (02:01:48Z–02:24:03Z); T0 chỉ ghi giá trị đọc tươi + thời điểm đọc, KHÔNG suy đoán cơ chế.
  Giao T7-175 đối chiếu. Hệ quả nếu 11 s là số đúng: run 174 KHÔNG thuộc họ claimed→finished
  ≥60 s (theo định nghĩa thống nhất parent đã chọn ở quyết (p) đợt 174 — run 172 = ca thứ 8);
  T0 không phán số thứ tự ca.
- **F-175-T0-4 — Caveat phân số cho (m) #86 (cùng họ caveat #81/#85).** boot_est #86 đo độc lập
  bằng uptime bracket ×3 = btime +0,897 s (chênh nhau <0,01 s). Nếu dùng boot_est phân số thay
  btime nguyên thì offset requeue #86 ≈ +48,521 s — VẪN TRONG band [33; 49,8] nhưng cách biên
  trên ≈ 1,279 s (thay vì 0,382 s trên btime nguyên). Caveat này KHÔNG lật verdict theo ước
  tính, nhưng làm (m) #86 nhạy với quy ước estimator hơn #84 (margin 12,482 s). Offset thật
  ∈ (48,418 s, 49,418 s] theo khoảng boot thật [btime, btime+1 s) — mọi giá trị đều < 49,8 s.
  Quy ước đứng vẫn là btime nguyên /proc/stat. Phân loại cuối thuộc T2-175 + parent 175.
- **F-175-T0-5 — Tên thread lock vite vẫn là t0-round174 (nhãn sót, vô hại).** Driver O8-175
  adapt bằng sed từ 174t0 nhưng dòng acquire/release dùng literal `t0-round174` nên lock được
  giữ dưới tên cũ (owner_pid 17064, ticket 1-179540165279, giữ 324 s, nhả sạch 02:46:17Z).
  T4-175 poll log ghi nhận đúng blocker này (pid 17064, port 5560). Không ảnh hưởng verdict O8.
  Các đợt sau sửa literal thành t0-round<NNN> khi adapt driver.
- **F-175-T0-6 — O8 chồng pha (a) poll của T4-175, KHÔNG chồng attempt.** T4-175 poller bắt đầu
  02:41:36Z giữa O8 attempt1 (02:40:53–02:42:31Z); poll #1–#8 (tới 02:47:02Z) đều poll,
  gate0=T5, 0 attempt trong suốt O8; vite lock của T0 là blocker trong poll #1–#7, đã nhả
  trước poll #8 (lock=không). T0 KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ
  attempt (T4 chưa vào attempt; quy tắc đứng sau vi phạm F-174-T2-5 được tuân thủ).
- **F-175-T0-7 — POSTBOOT_PASS #86 viết TRONG LÚC T0 làm boot survey.** Cờ viết 02:40:29Z
  (mtime 02:40:29Z, mode replay-day-du, poll=0); T0 đọc được lúc ~02:40:42Z, O8 bắt đầu
  02:40:52Z — cả ba bộ O8 đều SAU cờ 23 s trở lên. Khác #85: replay #86 đã xong tự nhiên
  (dpkg 1.545, đóng băng từ 01:22:11Z), không repair tay. Chi tiết replay + cờ thuộc T5-175;
  T0 chỉ ghi mốc thời gian + mode để T8/T10-175 đối chiếu chuỗi FULL PASS.
- **F-175-T0-8 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #86 thuộc T5-175
  (T0 chỉ đọc trạng thái + mốc thời gian); (m) #86 + INSIDE #86 phân loại cuối thuộc T2-175
  + parent; kết cục run 174 thuộc T7-175; lượt yên #44 (T4-175); harness + O8 bộ thứ hai
  (T8-175); #86 có giết holder không + prune lần 50 (T6-175); headroom + ENOSPC + balloon
  episode E-185/E-186 (T9-175).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #86 phân loại cuối (T2-175 + parent); INSIDE #86 (T2-175; FULL132; chuỗi dài 4 từ #82);
  kết cục run 174 (T7-175; F-175-T0-3 claimed_at); DR 23:00Z kết luận cuối (T7-175);
  POSTBOOT_PASS #86 chi tiết (T5-175); lượt yên #44 (T4-175); harness + O8 bộ thứ hai
  (T8-175); #86 có giết holder không + prune lần 50 (T6-175); headroom + ENOSPC + balloon
  (T9-175).
- Không kiểm lại dải FULL125–FULL131; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của replay #86.

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round175-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round175-t0/appendix175.py` + `appendix175.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay — xem F-174-T0-5)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round175-t0/boot-survey-175t0.txt`
  (output thô 9 nguồn)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round175-t0/o8-driver-175t0.sh` +
  `o8-175t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-verify-175t0.txt`
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round175-t0/o8-s1-probe-175t0.mjs` +
  `eperm-retry.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver; bản copy
  sẵn cho các đợt sau, md5 khớp bản 174: probe 7d2009cb)
