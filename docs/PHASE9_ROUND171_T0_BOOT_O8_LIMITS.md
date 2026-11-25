# PHASE9_ROUND171_T0_BOOT_O8_LIMITS.md

Đợt 171 — T0 (boot survey + xác minh reboot mới + O8). Mở ~14:43Z, đóng ~15:01Z 22/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #80 MỚI — XÁC NHẬN 9 nguồn**: boot_id `2acdd1ab-23a6-41b0-9d90-40641d2404a0`
  (khác #79 `5df1871f`); btime **14:31:01Z** (epoch 1795357861; uptime bracket ×3 khớp cùng giây,
  boot_est 1795357861.95; /proc/1 start 14:31:13.025Z = btime +12,03 s; journal idx 0 duy nhất,
  first 14:31:13Z; wtmp begins 14:31:13Z; last reboot 14:31 still running; Cloudflare NẰM TRONG
  bracket cả 2 lần (lệch <0,71 s / <0,61 s); DB: 0 requeue trong cửa, run 171 dispatch mới
  btime +290,103 s, boot_gen đổi f0510b46 → 94af6c79; marker mtime không đổi).
- Gap #79→#80 = **11.996 s (3h19m56s)**; #79 sống 11.996 s. Gap #78→#79 kiểm lại 6.987 s — khớp GAP §99.
- **Marker sống qua 32 reboot (#49–#80)** — mtime 2026-11-20 11:39:47Z không đổi (31 qua #79 + #80).
- **Run 170 SUCCEEDED** (kết cục thuộc T7-171): finished 14:21:03Z trên boot #79, TRƯỚC btime #80
  598 s — run 170 KHÔNG span btime; wall 9.912 s (2h45m12s); margin tới hạn 14:35:51Z = **888 s**;
  claimed→finished 110 s; 0 lần viết lại; 2 event (10062 dispatched, 10101 succeeded).
- **(m) #80 KHÔNG PHẢI ỨNG VIÊN** — dạng sạch nhất: 0 requeue trong cửa [14:31:01Z, 14:45:00Z];
  không run nào sống tại btime (run 170 xong 598 s trước, run 171 dispatch 290,103 s sau).
  Phân loại cuối thuộc T2-171 + parent.
- Cửa sổ chết #79 = (14:21:59Z, 14:31:01Z] = **542 s** (hoạt động cuối: replay-watch-170.log);
  DB gap quanh btime: 14:21:03Z → 14:35:51Z (887,505 s).
- **T10-170 ĐÚNG ở thời điểm viết** (khác F-170-T0-1): round170-t10.done 14:15:43Z = btime #80 −918 s.
- Watcher-170 (pid 20516) **chết theo #80**; watcher-171 ALIVE (pid 28156, poll 30 s, dpkg md5
  c01f3a02 ổn định). POSTBOOT_PASS #80 **CÓ** (14:52:09Z, replay-đầy-đủ, poll=0).
- **O8 (driver T0-171, kiểm chứng độc lập — T8-171 chạy O8 riêng): PASS 3/3 trên boot #80:**
  WebKit attempt1 21/21, pid34281, md5 `dfe9da72…`, S1 PASS 14:54:31.762Z; WebKit attempt2 21/21,
  pid37092, md5 `c17e5e8d…`, S1 PASS 14:55:43.376Z; Chromium 21/21, pid38116, md5 `92d5d73b…`,
  S1 PASS 14:56:52.282Z (CDP mouse click lần 2); exit 0/0/0, O8 DONE 14:57:22Z, 0 lỗi harness.
  Chuỗi WebKit FULL PASS hiện 22 (quyết (b) đợt 170) — có lên 23 hay không thuộc T10/parent
  (cần kết quả lượt yên T4-171 + gate; gate (a) FOUND qua POSTBOOT_PASS #80 14:52:09Z poll=0).
- Replay #80 nhanh nhất chuỗi: installs ~2 phút, xong boot+402 s (14:37:43Z), dpkg 1545 dòng
  (md5 c01f3a02), GST 1624 plugin — không stall như #73/#78/#79.
- /tmp/.X11-unix/: TRỐNG lúc mở (14:44Z); lúc đóng CÓ 4 socket mồ côi X193–X196 (0 process giữ
  fd, mtime 14:50–14:51Z) — giao T8-171 dọn. Journal -b: 104 entry, 0 bước nhảy âm, max gap
  69,86 s lặp định kỳ (~70 s một lần) — cùng giá trị như boot #79, là artifact định kỳ.

## Giới hạn / sai số ghi nhận (F-171-T0-*)

- **F-171-T0-1 — Truy vấn DB đầu tiên dùng sai epoch sched run 171.** Ghi 1795357851 thay vì
  1795358151 (lệch 300 s) → chỉ trả run 170, tưởng run 171 chưa có dòng. Đã sửa bằng truy vấn
  theo run_id 09bef504… — run 171 sched/started/claimed 1795358151 = 14:35:51Z, running.
  Không ảnh hưởng verdict nào. Bài học: kiểm epoch bằng `date -d` TRƯỚC khi truy vấn
  (cùng họ F-170-T7-1).
- **F-171-T0-2 — Bản nháp appendix171.py ghi sai epoch t10_170_done.** 1795358143 thay vì
  1795356943 → in "btime −282 s". Bắt được bằng `date -d` đối chiếu, đã sửa trước khi viết
  LIMITS; mọi số phụ lục kiểm lại sau sửa. Số đúng: T10-170 đóng TRƯỚC btime #80 918 s.
- **F-171-T0-3 — Driver O8 chờ lock vite 205 s.** T4-171 (pid 24010) giữ lock 14:50:05–~14:53:58Z
  (attempt đang chạy); driver xếp hàng FIFO rồi mới chạy (lock acquired 14:53:58Z). Không xung
  đột, không ảnh hưởng attempt của T4; O8 chạy SAU khi T4 nhả lock.
- **F-171-T0-4 — 4 socket X11 mồ côi X193–X196 lúc đóng.** fuser = 0 process giữ fd; mtime
  14:50–14:51Z (xuất hiện sau lúc mở TRỐNG 14:44Z). Không dọn — không phải file của mình,
  giao T8-171 (theo lệ T8-170 đã dọn X194/X195 sau khi xác minh mồ côi).
- **F-171-T0-5 — Tên file POSTBOOT_PASS-5df1871f gây nhầm.** Đó là bản lưu của boot CŨ (#79)
  trong thư mục round171-t5; nội dung POSTBOOT_PASS (không hậu tố) mới chứng thực boot #80
  (2acdd1ab, 14:52:09Z, poll=0). Đừng đối chiếu theo tên file.
- **F-171-T0-6 — (m) #80 ở dạng sạch nhất.** 0 requeue + không run sống tại btime — sạch hơn
  cả #79 (+251 s ngoài dải). T0 chỉ nêu dữ kiện; phân loại cuối thuộc T2-171 + parent.
- **F-171-T0-7 — Hai bộ O8 độc lập trên cùng boot.** T8-171 chạy O8 riêng (driver o8-driver-171t8.sh,
  scratch round171-t8); O8 của T0 là kiểm chứng độc lập, không thay thế. Script O8 gốc + cây
  giống hệt nhau (O8w 4994b4fc, O8-headed c8acd72e, preview.tsx 530e10a7 — khớp đợt 170).
  Nếu md5 hai bên lệch nhau thì T10 đối chiếu.
- **F-171-T0-8 — Replay #80 nhanh bất thường.** Installs 14:36:08→14:37:43Z (~2 phút, xong
  boot+402 s) so với #79 (~13 phút). Không stall mirror/proxy như #73/#78/#79. Chỉ ghi nhận,
  không suy đoán nguyên nhân.

## Phạm vi chưa kiểm (không thuộc T0)

- POSTBOOT_PASS #80 thuộc T5-171 (T0 chỉ đọc nội dung); (m) #80 phân loại cuối thuộc T2-171 +
  parent; kết cục run 171 thuộc T7-171; lượt yên #40 + chuỗi O8 22→23 thuộc T4/T8/T10-171 +
  parent; dọn socket X11 thuộc T8-171.
- Không kiểm lại dải FULL125; không chạy lại suite T1 (chỉ O8); không xác minh actor của
  replay 14:35:39Z (cùng họ F-170-T0-3, để T5-171 đối chiếu nếu cần).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round171-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round171-t0/appendix171.py` + `appendix171.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round171-t0/o8-driver-171t0.sh` +
  `o8-171t0.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped + bản copy dự phòng khớp md5)
