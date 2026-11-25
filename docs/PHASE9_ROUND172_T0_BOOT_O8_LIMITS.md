# PHASE9_ROUND172_T0_BOOT_O8_LIMITS.md

Đợt 172 — T0 (boot survey + xác minh reboot mới + O8). Mở ~17:38Z, đóng ~18:12Z 22/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #81 MỚI — XÁC NHẬN 9 nguồn**: boot_id `4b9db449-7699-4441-a4cf-72983f15dbbd`
  (khác #80 `2acdd1ab`); btime **17:02:05Z** (epoch 1795366925; uptime bracket ×3 khớp cùng giây,
  boot_est 1795366925.63/.62/.63; /proc/1 start 17:02:16.745Z = btime +11,75 s; journal idx 0 duy nhất,
  first 17:02:17Z; wtmp begins 17:02:16Z; last reboot 17:02 still running; Cloudflare local ≈ CF −1 s ×2;
  DB: run 171 viết lại, boot_gen đổi 94af6c79 → 0672507b; marker mtime không đổi).
- Gap #80→#81 = **9.064 s (2h31m04s)** — kiểm lại KHỚP T10-171; #80 sống 9.064 s.
- **Marker sống qua 33 reboot (#49–#81)** — mtime 2026-11-20 11:39:47.272154981Z không đổi (32 qua #80 + #81).
- **Run 171 SUCCEEDED sau khi VIẾT LẠI tại #81 — XÁC NHẬN** (kết cục thuộc T7-172): finished 17:29:26Z
  trên boot #81, margin tới hạn 17:35:51Z = **385 s**; thực thi trên boot mới 1.608 s (started 17:02:38Z);
  claimed→finished (viết lại) 82 s; wall sched→finished 10.415 s; attempt 1; boot_gen 0672507b.
- **(m) #81 — ỨNG VIÊN DƯƠNG (số liệu thô cho T2-172, T0 không phân loại cuối)**:
  requeue eid 10137 `requeued_after_restart` ("daemon startup recovery") **btime +33,477 s**,
  NAM TRONG band [33; 49,8] — chỉ cách biên dưới **0,477 s**; run 171 SỐNG tại btime (span btime);
  1 requeue duy nhất trong cửa [17:02:05Z, 17:15:00Z]. So sánh: #71 +41,274 s DƯƠNG,
  #72 +39,548 s DƯƠNG, #78 +40,693 s ứng viên dương, #79 +251,007 s KHÔNG PHẢI ĐIỂM, #80 0 requeue.
- **Dị thường watcher-log đợt 171 ĐÃ GIẢI THÍCH (F-172-T0-1)**: poll cuối watcher-171 17:02:25Z
  boot=2acdd1ab = btime +20 s — do đồng hồ guest cũ nhanh ~20 s so với đồng hồ boot mới
  (script đọc boot_id tươi đầu mỗi lặp rồi mới lấy ts; /proc/1 boot mới start 17:02:16Z,
  TRƯỚC poll cuối 8,255 s; không có timesyncd/D-Bus trong cell nên cơ chế drift chính xác
  không khôi phục được; tiền lệ cùng mẫu #70/#71 trong GAP §167). Timestamp watcher-log
  KHÔNG dùng được làm chân lý xuyên-boot.
- **POSTBOOT_PASS #81 ĐÃ CÓ 17:50:32Z** (mode **repair-som-quyet-h**, poll=1, dpkg 795 dòng,
  cache 110, lists 75, GST 269 — T5-172; KHÔNG phải replay-đầy-đủ như #80).
- **O8 (driver T0-172, kiểm chứng độc lập — T8-172 chạy O8 riêng): PASS 3/3 trên boot #81:**
  WebKit attempt1 21/21, pid41420, md5 `386e6023…`, S1 PASS 18:07:12.775Z; WebKit attempt2 21/21,
  pid41850, md5 `4319276f…`, S1 PASS 18:08:02.899Z; Chromium 21/21, pid42277, md5 `6c289174…`,
  S1 PASS 18:09:04.551Z (CDP mouse click lần 2); exit 0/0/0, O8 DONE 18:09:35Z, 0 lỗi harness.
  Đếm lại từ JSON gốc: 21 results, 21 ok=true ×3; bản copy dự phòng khớp md5 bản gốc có stamp.
- **Chuỗi WebKit FULL PASS — T0 ĐỀ XUẤT LÊN 24 (23 → 24), có điều kiện:** (1) lượt yên #41
  HỢP LỆ attempt1-4b9db449 (20/20, B 5/5, tickCost median 46,0 ms, T4 .done 18:08Z) TRÊN BOOT ĐO
  4b9db449; (2) O8 PASS 3/3 SAU lượt hợp lệ TRÊN CÙNG BOOT (lượt xong 18:03:19Z, O8 18:07:00–18:09:35Z);
  (3) gate (a) FOUND poll #25 lúc 17:59:27Z qua POSTBOOT_PASS #81 17:50:32Z. **Caveat:**
  cờ #81 là mode repair poll=1, không phải replay-đầy-đủ poll=0 như #80 (T4 ghi F-172-T4-7;
  tiền lệ #75 mode repair đã được chấp nhận — quyết (j)/(b) đợt 168); **đề xuất này chờ
  bộ O8 thứ hai của T8-172 PASS + T10 xác nhận md5** (T8 chưa chạy O8 lúc T0 đóng cờ).
  Chuỗi lượt yên hợp lệ lên 36 (T4-172).
- Watcher-172 ALIVE (pid 17944, start 17:41Z, poll 30 s, dpkg 795 md5 e89e703c ổn định).
  /tmp/.X11-unix: 2 socket mồ côi X194/X195 (mtime 17:45:11Z, 0 process giữ fd, 0 Xvfb) — giao T8-172 dọn.
  0 process sót lúc đóng (vite/playwright/chromium/webkit/electron — trống).
  Boot lúc T0 đóng vẫn 4b9db449 (kiểm cuối 18:10:09Z — xem F-172-T0-5).

## Giới hạn / sai số ghi nhận (F-172-T0-*)

- **F-172-T0-1 — Dị thường watcher-log +20 s (xem trên): ĐÃ GIẢI THÍCH, không lật reboot.**
  Bằng chứng ủng hộ mô hình "đồng hồ cũ nhanh": daemon recovery eid 10137 ở boot+33 s là thoải mái,
  còn nếu đồng hồ mới chậm 20 s thì recovery chỉ cách journal-start ~1–2 s — quá chật.
  Đề nghị T5-172: stamp mỗi poll thêm uptime đơn điệu (`/proc/uptime`) để thứ tự xuyên-boot
  chứng minh được. T10-172 / parent không dùng timestamp watcher-171 làm mốc xuyên-boot.
- **F-172-T0-2 — Bản nháp appendix172.py gõ sai 2 epoch, bắt được bằng đối chiếu chéo, đã sửa
  TRƯỚC khi viết LIMITS:** (a) T0-171 .done: 1795363306 → đúng 1795359706 (15:01:46Z);
  (b) 3 event run 171 eid 10137/10138/10139: 1795366962.xxx → đúng 1795366958.xxx
  (17:02:38.477/.518/.573Z — khớp started_at_utc 1795366958 của DB). Số (m) +33,477 s trong
  LIMITS này là số ĐÃ SỬA (bản nháp sai ghi +37,477 s). Mọi số phụ lục kiểm lại sau sửa.
- **F-172-T0-3 — (m) #81 sát biên dưới band.** Requeue +33,477 s chỉ hơn biên dưới 33 s
  đúng 0,477 s. T0 chỉ nêu dữ kiện; T2-172 đối chiếu độc lập timestamp eid 10137 + btime,
  parent quyết cuối. Nếu T2 đo lệch ≥0,5 s thì kết luận có thể đổi — ghi rõ để tránh
  hiểu lầm đây là dương chắc chắn.
- **F-172-T0-4 — T0 không chạy lại suite T1, không kiểm lại dải FULL125/FULL126, không đếm
  lại ENOSPC/RAM/balloon.** Chỉ O8 + boot survey. POSTBOOT_PASS #81 thuộc T5-172 (T0 chỉ đọc
  nội dung); (m) #81 phân loại cuối thuộc T2-172 + parent; kết cục run 171 thuộc T7-172;
  lượt yên #41 + chuỗi O8 23→24 thuộc T4/T8/T10-172 + parent; dọn socket X11 thuộc T8-172.
- **F-172-T0-5 — Kiểm boot lần cuối 18:10:09Z, .done viết ~18:12Z.** Khoảng trống ~2 phút
  (viết LIMITS + paths + .done) — chấp nhận được trong hạn cờ ~20:00Z, nhưng ghi rõ:
  nếu có reboot mới trong khoảng này, T10-172 phải bắt bằng kiểm lúc đóng của chính mình
  (bài học F-170-T0-1/F-171-T10-2: không khẳng định boot lúc đóng quá sớm).
- **F-172-T0-6 — T4-172 chạy attempt1 trong lúc T0 chờ O8 (17:59:27–18:03:19Z).** T0 KHÔNG
  chạy O8 chồng lên cửa sổ attempt của T4 (driver chỉ khởi động 18:07:00Z, sau khi T4 nhả
  lock; lock TRỐNG lúc kiểm 18:07:00Z). Không xung đột, không ảnh hưởng attempt của T4.

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #81 phân loại cuối (T2-172 + parent); INSIDE #81 + FULL127/FULL128 (T2-172);
  kết cục run 171 (T7-172); POSTBOOT_PASS #81 chi tiết + watcher-172 (T5-172);
  E-175 kết cục (T9-172); harness + O8 bộ thứ hai (T8-172); dọn X194/X195 (T8-172).
- Không kiểm lại dải FULL125/FULL126; không chạy lại suite T1 (chỉ O8); không xác minh
  actor của replay #81 (cùng họ F-170-T0-3, để T5-172 đối chiếu nếu cần).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round172-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round172-t0/appendix172.py` + `appendix172.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round172-t0/boot-survey-172t0.txt`
  (output thô 9 nguồn)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round172-t0/o8-driver-172t0.sh` +
  `o8-172t0.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped + bản copy dự phòng khớp md5)
