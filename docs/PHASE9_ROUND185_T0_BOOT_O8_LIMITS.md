# PHASE9_ROUND185_T0_BOOT_O8_LIMITS.md

Đợt 185 — T0 (boot survey + xác minh reboot mới + O8). Mở lượt cron 11:35:51Z 24/11, đóng ~11:48Z 24/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.
Nguồn đứng: §12.3 aggregate 184 BẢN PARENT (quyết (a)–(r); parent kiểm đếm KHỚP TỪNG SỐ lần thứ 93).

## Kết quả chính

- **REBOOT #103 — XÁC NHẬN 9 nguồn (đối chiếu từ hồ sơ lưu + DB đọc tươi)**:
  boot_id `e0921bda-b0da-4445-b83f-e494f4e52182` (khác #102 `6ecd948e`); btime
  **09:14:55Z** (epoch 1795511695; T7-184 xác minh 9 nguồn giờ thật ×2 — lúc phát hiện
  ~09:15:40Z + lúc đóng ~11:00Z; T2-184 tính độc lập từ /proc/uptime 267,87 s lúc
  09:19:23Z → 09:14:55Z + /proc/1 mtime 09:15:06.753Z (+11,753 s) — KHỚP T7 từng số;
  T8/T9-184 ghi btime khớp). 9 nguồn: (1) boot_id; (2) btime /proc/stat 1795511695;
  (3) `uptime -s` 09:14:55Z; (4) /proc/1 mtime +11,753 s; (5) journal idx 0 duy nhất,
  first entry 09:15:07Z (+12 s); (6) wtmp begins 09:15:06Z (+11 s); (7) `last` reboot
  09:15 still running + `who -b` 09:15; (8) Cloudflare ~1 s (09:15:42 GMT vs 09:15:41
  local — đồng hồ boot mới ĐÚNG); (9) DB đọc tươi hôm nay: run 184 boot_gen
  6638cc3a (#102) → ae630cdd (#103), requeue eid 10697 09:15:32.543Z = btime +37,543 s
  (T7-184 ghi +37,543 s — T0-185 kiểm lại bằng phép trừ epoch, KHỚP).
  **HẠN CHẾ (tiền lệ F-183-T0-1): nguồn (5)/(6)/(7) KHÔNG đọc tươi lại được** —
  journal runtime-only hiện chỉ liệt kê #104 (idx 0 duy nhất, 9161bfd1...);
  wtmp begins 11:13:54Z (theo boot #104); `last reboot` chỉ còn #104. Ba nguồn này
  chỉ xác minh được qua hồ sơ lưu của T7-184 (LIMITS §2.2 + appendix184.txt) và
  T2-184; 6 nguồn còn lại đối chiếu chéo T7/T2/T8/T9 + DB đọc tươi hôm nay.
  Gap #102→#103 = **7.670 s (2h07m50s)** — kiểm lại bằng phép trừ epoch, KHỚP T7/T2.
- **REBOOT #104 — XÁC NHẬN 9 nguồn TƯƠI (đo 11:40:46Z)**: boot_id
  `9161bfd1-861f-4f9f-90ed-eee0387081de` (khác #103 `e0921bda`); btime **11:13:42Z**
  (epoch 1795518822; uptime bracket ×3 khớp cùng giây — `uptime -s` 11:13:42Z,
  /proc/uptime 1623,69 s lúc 11:40:46Z → boot_est = btime +0,31 s; /proc/1 start_ticks
  1112 = btime +11,12 s, stat mtime 11:13:53.785Z = btime +11,785 s; journal idx 0
  duy nhất, first 11:13:54Z = btime +12 s; wtmp begins 11:13:54Z; `last` reboot 11:13
  still running; `who -b` Nov 24 11:13; Cloudflare ×1 (local 11:40:46Z vs CF
  11:40:47 GMT, chênh ~+1 s — đồng hồ #104 ĐÚNG); DB: run 185 boot_gen MỚI
  cron_boot_7c896c1e... (sched=started=claimed=11:35:51Z, jitter 0, RUNNING lúc đọc),
  run 184 finished 11:16:07Z trên #104 (xem dưới); marker mtime không đổi).
  Gap #103→#104 = **7.127 s (1h58m47s) — TRỞ LẠI mẫu ~2h** (chuỗi gap gần đây:
  7.041 / 7.400 / 6.878 / 7.670 / **7.127 s**; gap 576 s #97→#98 vẫn là ca ngắn bất
  thường duy nhất trong chuỗi #93–#104). #104 xảy ra SAU khi T7-184 đóng cờ (11:05Z),
  TRƯỚC khi đợt 185 mở (11:35:51Z).
- **Marker sống qua 56 reboot (#49–#104)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi (54 qua #102 + #103 + #104).
- **Run 184 SUCCEEDED (DB đọc tươi ~11:41Z — kết cục thuộc T7-185)**: finished
  11:16:07Z, status `succeeded`, timed_out false, attempt 1, boot_gen
  cron_boot_dbbf0826...; **viết lại ×2** — lần 1 tại #103 (09:15:32Z, eid 10697) +
  lần 2 tại **11:11:06Z (eid 10724, daemon startup recovery — KHÔNG phải reboot,
  155,345 s TRƯỚC btime #104; xem F-185-T0-1)**; SỚM hơn hạn started-gốc 11:35:51Z
  **1.184 s (margin +1.184 s, +19m44s)** — KHÔNG TIMEOUT, không sát nút như run 183.
  **claimed→finished = 48 s** (claimed 11:15:19Z) — DƯỚI 60 s, KHÔNG phải ca ≥60 s.
  Tổng 8 event (dispatched 10687 + requeued 10697 + dispatched 10699 + reattached
  10702 + requeued 10724 + dispatched 10725 + reattached 10726 + succeeded 10730).
  Run 185 3d57c217 (sched 11:35:51Z): started 11:35:51Z (= sched, **jitter 0**),
  RUNNING lúc đọc, boot_gen cron_boot_7c896c1e... (#104), claimed 11:35:51Z.
- **(m) #104 — SỐ LIỆU THÔ, KHÔNG tự phân loại cuối (thuộc T2-185 + parent 185)**:
  requeue trong cửa hẹp [11:13:42Z, 11:32:42Z] = **0 DÒNG** (DB đọc tươi, truy vấn
  `requeued_after_restart` toàn cửa — 0 dòng; xem F-185-T0-2); spanning = ĐÚNG 1 run
  (run 184, scheduled 08:35:51Z ≤ btime, finished 11:16:07Z > btime). Không có
  offset requeue nào để tính — (m) #104 không có số liệu offset.
  (m) #103 đối chiếu: requeue eid 10697 +37,543 s (T7-184 ghi DƯƠNG ỨNG VIÊN —
  phân loại cuối thuộc T2-185).
- **F-184-T2-11 — ĐÃ TRẢ LỜI: KHÔNG phải đồng hồ nhảy lùi.** Bằng chứng mới (đọc tươi
  hôm nay từ log lưu): watcher-184 poll CUỐI CÙNG `2026-11-24T09:15:04Z
  boot=6ecd948e` = btime #103 +9 s — boot cũ vẫn sống và ghi timestamp 9 s SAU btime
  boot mới. Poll trước 09:14:34Z; cadence 30 s; watcher chết theo #103, không poll nào
  sau. Kết luận: **đồng hồ cell NHANH trước #103, delta > 9 s** (đọc boot_id của T2
  lúc 09:14:59Z = btime +4 s cũng chỉ đòi delta > 4 s — nhất quán). Đồng hồ boot mới
  ĐÃ ĐƯỢC xác minh ĐÚNG (~1 s vs Cloudflare lúc 09:15:41Z, T7-184) nên không có
  nhảy lùi nào tại reboot — giả thuyết nhảy lùi đòi thêm một lần nhảy tới trong
  46 s sau btime, không có bằng chứng. Đây là ca thứ 7 của mẫu hệ thống (nhanh trước
  #95/#96/#97/#99/#100/#102/**#103**; riêng #98 + #101 không ước lượng được).
- **#104 KHÔNG GIẾT HOLDER — số liệu thô, T6-185 phán cuối:** lock log
  `hidden_files/vite-lock-v2.log` 2.533 dòng; dòng cuối TRƯỚC btime #104 là
  t8-round184 RELEASED 10:41:52Z (chu kỳ khép kín, hold_s=68); **0 dòng trong
  [btime #104, lúc T0 acquire lock 11:42:47Z)** — log im lặng 29m05s qua reboot;
  lock TRỐNG **1.910 s (31m50s)** trước btime #104 — lớn hơn mọi độ lệch đồng hồ
  từng ghi nhận (~26–29 s), KHÔNG cần caveat clock-fast. Chu kỳ T0-185 khép kín:
  TICKET + ACQUIRED 11:42:47Z → RELEASED 11:46:41Z, hold_s=234.
  (T6-185 phán cuối + prune lần 60.)
- **POSTBOOT_PASS #104 ĐÃ CÓ 11:42:15Z** (watcher-185 pid 18279, mode
  **replay-đầy-đủ, poll=0** — REPLAY_DONE poll đầu, dpkg 1.468, cache 170 .deb,
  lists 39, GST sys 269; postboot poll0 exit 0; cờ 315 B). Chi tiết thuộc T5-185.
  **#103 VẪN CHƯA CÓ cờ** (grep 0 file POSTBOOT_PASS* nhắc e0921bda — watcher-184
  chết theo #103, không ai repair #103; tổng boot không cờ có thể 22 → 23 —
  parent quyết, T5-185 xác nhận). **#102 VẪN CÓ cờ** (POSTBOOT_PASS-6ecd948e lưu).
- **O8 trên boot #104 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (11:42:47–11:46:41Z):** WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS
  11:43:23.869Z, Playwright mouse click lần 2), JSON 21 results, 21 ok=true, md5
  `e2bf3f92…`; attempt2 exit=0, **21/21 PASS** (S1 PASS 11:44:43.173Z), JSON 21
  results, 21 ok=true, md5 `0df83958…`; Chromium exit=0, **21/21 PASS** (S1 PASS
  11:46:06.615Z, CDP mouse click lần 2), JSON 21 results, 21 ok=true, md5
  `8b433cf5…`. Đếm lại từ JSON gốc bằng python. **Cả ba bộ đều chạy SAU
  POSTBOOT_PASS #104 (11:42:15Z) 32 s** (tiền lệ T0-184: sau cờ 77 s; T0-183:
  59 s; T0-182: 89 s). **WebKit launch-fail libevent trên #103 ĐÃ HEAL:**
  `libevent-2.1.so.7` CÓ trên hệ thống #104 (ls trực tiếp); MiniBrowser launch
  OK, version 27.2 (log 11:43:04Z); 0 lỗi exit 127/launch-fail trong cả 3 bộ.
  dpkg 1.468 trên #104 (theo poll T4-185 #1 — T0 không tự probe dpkg).
- **0 attempt chồng:** T4-185 poll-wait bắt đầu 11:41:43Z (64 s TRƯỚC khi T0 acquire
  lock); polls #4–#7 (11:44:00–11:46:18Z, TRONG cửa sổ O8) đều ghi
  `lock=co:thread=t0-round185 pid=31278 port=5560` + blockers → cửa yên KHÔNG mở
  suốt O8; poll #8 (11:47:04Z, sau khi lock nhả) lock=khong nhưng load5 4,23 > 2 —
  cửa vẫn không mở; chain-t4.log lúc T0 đóng chỉ có dòng start (chưa attempt nào
  mở). O8 chỉ chồng pha poll của T4, 0 attempt. Lock t0-round185 giữ 234 s
  (11:42:47–11:46:41Z), đã nhả; lock TRỐNG sau O8.
- X11: display O8 (:188/:197) đã dọn sạch (0 Xvfb sót), 0 process sót của T0
  (kiểm 11:47:54Z). Boot lúc T0 đóng vẫn 9161bfd1 (kiểm cuối 11:47:54Z).
  Không có reboot mới trong phiên T0. LIMITS này ~12,5 KB.

## Giới hạn / sai số ghi nhận (F-185-T0-*)

- **F-185-T0-1 — Daemon restart 11:11:06Z KHÔNG kèm reboot (run 184 viết lại lần 2)
  — HIỆN TƯỢNG MỚI, T0 chỉ ghi số, KHÔNG phán cơ chế (thuộc T7-185).**
  Bằng chứng (DB đọc tươi): eid 10724 `requeued_after_restart` 11:11:06.655Z,
  detail "daemon startup recovery" + dispatched 10725 + reattached 10726 (detail
  "execute turn already complete") — cùng mẫu 3 event như lần viết lại tại #103
  (eid 10697/10699/10702). Thời điểm 11:11:06Z = btime #104 −155,345 s — TRƯỚC
  reboot #104, TRÊN boot #103 (btime 09:14:55Z). Chỉ run 184 bị requeue trong
  cửa sổ 11:10–11:20Z (truy vấn events toàn cửa: 7 event — 3 của run 184 +
  reconciled + heartbeat dispatch/succeeded 11:15:34Z + run 184 succeeded
  11:16:07Z) — KHÔNG job nào khác bị requeue cùng lúc → restart này chỉ chạm
  run 184, không phải restart daemon toàn cục. T0 KHÔNG biết daemon nào restart
  hay vì sao (không thuộc phạm vi T0); không suy đoán cơ chế.
- **F-185-T0-2 — Reboot #104: 0 requeue trong cửa hẹp — HIỆN TƯỢNG MỚI, T0 chỉ ghi
  số, KHÔNG phân loại (m) (thuộc T2-185 + parent).**
  Bằng chứng (DB đọc tươi): 0 event `requeued_after_restart` trong
  [11:13:42Z, 11:32:42Z] (cửa hẹp đã khép hẳn lúc đọc); đúng 1 run sống tại btime
  #104 (run 184) và run này KHÔNG bị requeue tại #104 dù spanning qua btime
  (finished 11:16:07Z, sau btime 145 s). Trong chuỗi #95–#103, mọi reboot đều có
  ≥1 requeue tại btime+~37–42 s; #104 là reboot đầu tiên trong chuỗi này có 0
  requeue. Liên hệ F-185-T0-1: lần viết lại 11:11:06Z (trước #104 156 s) có thể
  đã đưa run 184 về trạng thái không cần requeue nữa — chỉ là giả thuyết, T0
  KHÔNG kết luận; T2-185 phân loại (m) #104 + parent quyết cuối.
- **F-185-T0-3 — #103: journal/wtmp/last/who KHÔNG đọc tươi lại được (xem Kết quả
  chính, HẠN CHẾ).** Xác minh #103 dựa vào hồ sơ lưu T7-184/T2-184 (giờ thật,
  2 lần đọc) + DB đọc tươi hôm nay (events + boot_gen). Cùng tiền lệ F-183-T0-1
  (#100 đối chiếu từ hồ sơ lưu). Nếu parent yêu cầu chuẩn cao hơn, #103 không
  thể xác minh lại tươi được nữa vì boot đã chết.
- **F-185-T0-4 — F-184-T2-11 ĐÃ TRẢ LỜI (xem Kết quả chính): KHÔNG nhảy lùi.**
  Đồng hồ nhanh trước #103, delta > 9 s (bằng chứng mới: poll cuối watcher-184
  09:15:04Z trên boot cũ). Không còn nợ mở về F-184-T2-11.
- **F-185-T0-5 — POSTBOOT_PASS #103 CHƯA CÓ (ghi nhận, KHÔNG phán tổng boot không
  cờ).** T0 kiểm trực tiếp: 0 file POSTBOOT_PASS* nhắc e0921bda. Tổng boot không
  cờ GIỮ 22 theo quyết (c) đợt 184 — có tăng lên 23 vì #103 hay không, parent
  quyết (T5-185 xác nhận trạng thái cờ #103).
- **F-185-T0-6 — O8 bắt đầu khi GATE_OPEN=1 (cờ #104 đã có, replay-đầy-đủ, poll=0),
  lock giữ cửa đóng suốt O8 — 0 attempt chồng (cùng cơ chế F-184-T0-3).**
  Lúc O8 acquire lock (11:42:47Z): POSTBOOT_PASS #104 đã có 32 s trước (11:42:15Z);
  T4-185 poll-wait bắt đầu 64 s TRƯỚC khi T0 acquire lock (11:41:43Z) nhưng chưa
  mở attempt; gateA chưa bao giờ mở trong cửa sổ O8 (load5 2,96–4,32 > 2 ở polls
  #4–#7; poll #8 sau nhả lock load5 4,23 > 2). Lock t0-round185 là blocker trong
  blockers-list-4..7 (11:44:00–11:46:18Z) → cửa KHÔNG mở suốt O8. T0 KHÔNG chạy
  script nặng / KHÔNG probe dpkg trong cửa sổ attempt (T4 chưa vào attempt suốt
  O8; quy tắc đứng sau vi phạm F-184-T2-8 được tuân thủ — kiểm gate trước VÀ trong
  lúc script dài chạy: T0 kiểm poll T4 trước khi chạy O8 và đối chiếu lại sau khi
  O8 xong).
  **Đánh giá O8 #104 theo mốc chuỗi 0 (quyết (b) THẬT đợt 184 — GIỮ 0):** chân O8 T0
  trên #104 ĐẠT (WebKit 21/21 ×2 + Chromium 21/21, sau cờ 32 s, cùng boot #104,
  cờ replay-đầy-đủ poll=0 — mode/caveat thuộc T5-185 + parent). Chuỗi lên lại 1
  chỉ khi đủ 5 chân cùng boot #104 (lượt yên #54 + gate (a) #104 + O8 T0 + O8 T8
  + harness) — các chân còn lại thuộc T4/T5/T8/T10-185, T0 KHÔNG phán chuỗi.
- **F-185-T0-7 — Nguồn dùng trong LIMITS này: §12.3 aggregate 184 BẢN PARENT
  (quyết (a)–(r) — parent kiểm đếm KHỚP TỪNG SỐ lần thứ 93; §12.3 đợt 184 từng
  bị điền sẵn lần thứ 17 nhưng parent đã xác minh + chấp nhận với đính chính
  tiêu đề/(q) — T0 dùng bản parent này, KHÔNG dùng đề xuất T10 ở §10.6).**
  Các quyết THẬT dùng: (a) CHẤP NHẬN đợt 184; (b) chuỗi FULL PASS GIỮ 0; (c)
  POSTBOOT_PASS #102 đứng cho gate (a) KHÔNG caveat, #100 KHÔNG CÓ cờ, tổng boot
  không cờ GIỮ 22, #103 CHƯA CÓ — T5-185 lo; (e) #102 XÁC NHẬN, #103 chờ T0-185;
  (f) (m) #102 DƯƠNG (CUỐI); (g) n ứng viên 45/46, n chính thức GIỮ 14; (j) NÂNG
  V2 (f'') làm phương án chính từ đợt 185; (n) run 183 SUCCEEDED +1.313 s, CA
  ≥60 s 12 → 13, run 184 kết cục thuộc T7-185; (p) F-184-T2-8 VI PHẠM — chuỗi 0
  vi phạm GIỮ 0; F-184-T2-11 giao T0-185; F-184-T1-1 giao T1-185; (q) đếm cuối
  đợt 184 = 10/15/15/14, lũy kế 111–184 = 728/1.259/1.096/918, chuỗi 9/9 = 6.
  T0 KHÔNG tự thay đổi verdict nào; mọi số đếm/boot/O8 trong LIMITS này không bị
  ảnh hưởng bởi nguồn (chỉ các chuỗi/mốc tham chiếu (b)/(c)/(g)/(n)/(p)/(q) theo
  bản parent).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #103 + (m) #104 phân loại cuối (T2-185 + parent); INSIDE #103 (FULL149) +
  INSIDE #104 (FULL150) (T2-185); kết cục run 184 (SUCCEEDED) + run 185 (T7-185);
  HB/DR + cửa slot đợt 185 (T7-185); POSTBOOT_PASS #104 chi tiết + mode
  replay-đầy-đủ (T5-185); lượt yên #54 (T4-185, poll-wait deadline 13:30Z);
  harness + O8 bộ thứ hai (T8-185, V2 làm phương án chính theo quyết (j) đợt 184
  — O8 của T0 vẫn dùng script 87o8 gốc, không đổi); #103/#104 có giết holder
  không — phán cuối + prune lần 60 (T6-185); headroom + ENOSPC + balloon + E-226
  nếu có (T9-185).
- Không kiểm lại dải FULL125–FULL150; không chạy lại suite T1 (chỉ O8); không xác
  minh actor của replay #104 (ai cài đặt trước 11:42Z — thuộc T5-185); không kiểm
  lại nguyên nhân daemon restart 11:11:06Z (xem F-185-T0-1) hay trigger của nó;
  không chạy `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T0 đợt này chỉ
  đọc file trực tiếp theo đường dẫn đã biết, trừ hai grep POSTBOOT_PASS* có phạm
  vi hẹp lúc ~11:41Z và ~11:47Z).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round185-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round185-t0/appendix185.py` + `appendix185.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round185-t0/boot-survey-185t0.sh`
  + `boot-survey-185t0.txt` (output thô 9 nguồn #104 — đo tươi 11:40:46Z)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round185-t0/o8-driver-185t0.sh` +
  `o8-185t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-s1-probe-185t0.mjs`
  (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
