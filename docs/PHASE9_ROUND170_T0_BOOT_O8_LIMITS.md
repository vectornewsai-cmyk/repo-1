# PHASE9_ROUND170_T0_BOOT_O8_LIMITS.md

Đợt 170 — T0 (boot survey + đối chiếu O8 đợt 169). Mở ~11:37Z, đóng ~11:41Z 22/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #79 MỚI — XÁC NHẬN 9 nguồn**: boot_id `5df1871f-7e19-45e1-a357-1ca4fd89bc33`
  (khác #78 `e298bb52`); btime **11:11:05Z** (epoch 1795345865.03; uptime bracket ×3 khớp tuyệt đối;
  /proc/1 start 11:11:15.986Z = btime +10,96 s; journal idx 0 duy nhất, first 11:11:16Z;
  wtmp begins 11:11:16Z; last reboot 11:11 still running; Cloudflare trước local +0,19..+1,18 s;
  DB requeue run 169 tại btime +251 s; marker mtime không đổi).
- Gap #78→#79 = **6.987 s (1h56m27s)**; #78 sống 6.987 s. Gap #77→#78 kiểm lại 3.046 s — khớp GAP §98.
- **Marker sống qua 31 reboot (#49–#79)** — mtime 2026-11-20 11:39:47Z không đổi (29 qua #77 + #78 + #79).
- **Run 169 SUCCEEDED** (kết cục thuộc T7-170): viết lại lần 2 tại #79, started_at 11:15:16Z,
  finished 11:17:44Z, margin tới hạn 11:35:51Z = **1.087 s**; wall từ sched gốc 9.713 s (2h41m53s);
  claimed→finished 35 s; 8 event; boot_gen đổi sang `cron_boot_82e24f95…`.
- **(m) #79 KHÔNG PHẢI ỨNG VIÊN**: requeue duy nhất 11:15:16.007Z = btime +251,007 s — ngoài dải dương
  [33; 49,8] s; daemon startup sau #79 chậm hơn #78 tới 210,3 s (requeue #78 chỉ +40,693 s).
- Cửa sổ chết #78 = (11:08:54Z, 11:11:05Z] = **131 s** (hoạt động cuối: round169-t7.done);
  DB gap quanh btime: 11:00:00Z → 11:15:16Z (916 s).
- Watcher: **0 process replay-watch** lúc mở và đóng; watcher-170 chưa khởi động (round170-t5 chưa tồn tại).
- POSTBOOT_PASS: #75 CÓ (repair, 06:01:38Z), #77 CÓ (replay-đầy-đủ, 08:46:44Z), **#78 KHÔNG CÓ**,
  **#79 CHƯA CÓ** (T5-170 chưa chạy), #76 KHÔNG CÓ.
- O8 đợt 169 đối chiếu GAP §98: **KHỚP TỪNG MD5** — WebKit pid8159 `2f8989f9…` (21/21),
  WebKit pid8512 `3cfe53ca…` (21/21), Chromium pid8836 `0fc2f903…` (21/21), cả ba bootId `e298bb52`;
  file latest byte-identical với bản stamped.
- /tmp/.X11-unix/ TRỐNG lúc mở và đóng. Journal -b: 127 entry, 0 bước nhảy âm, max gap 69,87 s lặp
  định kỳ (~140 s một lần) — cùng giá trị như boot #77, là artifact định kỳ.

## Giới hạn / sai số ghi nhận (F-170-T0-*)

- **F-170-T0-1 — T10-169 khẳng định sai về boot lúc đóng.** GAP §98 ghi "boot lúc đóng e298bb52 (#78),
  KHÔNG reboot mới trong lúc T10 đóng sổ", nhưng btime #79 = 11:11:05Z, TRƯỚC mtime file
  round169-t10.done và GAP (cùng 11:14:51Z) tới 226 s. T10 đọc boot_id trước 11:11:05Z rồi viết file
  sau reboot mà không kiểm lại. GAP §98 dòng 2196 cần đính chính ở đợt 170 (T10-170/parent).
- **F-170-T0-2 — /var/log ephemeral theo boot.** dpkg.log 1.545 dòng thời T0-169 đã mất hoàn toàn,
  không có dpkg.log.1; toàn bộ /var/log được tạo mới lúc 11:11Z. dpkg.log chỉ còn 2 dòng trên #79
  (`startup packages configure` 11:35:39–40Z). Từ nay dpkg.log chỉ dùng làm nhân chứng TRONG boot,
  không xuyên boot.
- **F-170-T0-3 — Tác nhân chạy dpkg 11:35:39Z trên #79 chưa xác định.** Lân cận thời gian duy nhất trong
  journal là hatch-ca-trust.service (update-ca-certificates) 11:35:42–43Z — chỉ là tương quan thời gian,
  không kết luận. Không ảnh hưởng verdict nào.
- **F-170-T0-4 — (tự kiểm)** Lúc mở, kết luận "/tmp/.X11-unix TRỐNG" dựa trên output lệnh bị cắt bởi
  khối ps; đã kiểm lại độc lập bằng `ls -la` lúc đóng: TRỐNG (chỉ `.` và `..`). Số liệu cuối đúng,
  phương pháp lúc mở thiếu chặt chẽ — ghi nhận.

## Phạm vi chưa kiểm (không thuộc T0)

- POSTBOOT_PASS #79 thuộc T5-170; (m) #79 phân loại cuối thuộc T2-170 + parent (T0 chỉ nêu requeue
  +251,007 s ngoài dải); kết cục run 170 thuộc T7-170; INSIDE #77/#78 thuộc T2-170.
- Không kiểm lại dải FULL121/FULL122; không chạy lại suite O8 (chỉ đối chiếu md5 + đếm 21/21 từ JSON gốc).
- Không xác minh được actor của dpkg 11:35:39Z (F-170-T0-3).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round170-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round170-t0/appendix170.py` + `appendix170.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
