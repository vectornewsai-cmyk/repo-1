# PHASE9 ROUND 159 — T2 (blind spot #91? + EPERM + (m) #56) — LIMITS

## 0. Kết luận trước (headline)

- **Mù #91? (#59): ĐÓNG.** H ĐÓNG (union file+nội dung max gap 31 s) + I ĐÓNG (union max gap 634 s). Lưu ý duy nhất: max gap FILE của H là 1.355 s (01:02:22Z → 01:24:57Z), VƯỢT sàn 1.147 s đúng 208 s — nhưng đó là artifact log append-only: 45 poll watcher-158 (cadence ~30 s, đóng dấu `boot=28366bd0` tươi từng dòng) + 13 dòng sampler lấp đầy hố, max sub-gap 31 s; hole-recheck 0 mốc file mới. Verdict ĐÓNG theo tiền lệ T2-157 §2.4 / T2-158 §2.4 (mốc nội dung làm mốc luật gap) — trình rõ cả hai số file/union để parent có thể bác (xem §2.5, F-159-T2-7).
- **Mù #88? (#56): VẪN MỞ.** Hole-recheck lại hố đầu E (19:32:59Z, 20:17:30Z): 345 hit, TẤT CẢ là float-trap theo cơ sở T2-157, **0 mốc mới** — lần thứ ba liên tiếp 0 mốc mới (T2-157, T2-158, T2-159). **Mù #77?: VẪN MỞ** (đoạn N 1.308 s, cửa sổ đợt 155, dữ liệu cố định; cửa sổ đợt này không chạm — không có bằng chứng mới).
- **Reboot #59 XÁC NHẬN ĐỘC LẬP:** boot `eec65561`, btime `/proc/stat` 1795224827 = 01:33:47Z (T0-159 6 nguồn + T6-159 + T7-159 + T2-159). **INSIDE: #59 NGOÀI dải FULL105 [23:31:24Z, 01:26:22Z] — muộn hơn 445 s (7m25s) → chuỗi KHÔNG lên 5, GIỮ 4.** Dải cho boot sau eec65561 (FULL106): [01:59:11Z, 03:56:17Z].
- **REBOOT #60 MỚI GIỮA PHIÊN (T2-160 sẽ xử lý):** boot `e590ae0a`, btime `/proc/stat` 1795230359 = 03:05:59Z (GIỜ THẬT: drift test tỉ lệ 1,0015 trên chính boot này). Xảy ra trong lúc hai lần chạy F122? đầu của T2 bị treo — phiên exec của T2 chết theo reboot. #60 INSIDE dải FULL106 → một chuỗi mới bắt đầu từ #60 (độ dài 1). Gap #60 danh nghĩa 5.532 s. Mù #92? giao T2-160.
- **CERT/FULL chính thức GIỮ 76/91** (không tự chứng nhận). Ứng viên có điều kiện: CERT91/FULL106 (gap #59) — tất cả yêu cầu #74?..#91? ĐÓNG hết, là SAI (#77? còn mở, #88? MỞ) nên chỉ là ứng viên.
- **Mô hình đồng hồ + điểm (m) #56: KHÔNG THU HẸP ĐƯỢC CỬA — lần thứ hai.** Đã thử 3 hướng MỚI (quét lại toàn cây tìm file có mtime trong cửa sổ wall D mà T2-157 chưa biết; kiểm /var/log + wtmp còn sót bản ghi thời c99a1045; đối chiếu cờ T0/T7-159; hướng git log không chạy được vì repo-1 không phải git repo) — không tìm được neo giờ thật mới nào. Cửa GIỮ NGUYÊN: **R ∈ [2,56251; 2,66817)** / **J ∈ [2,566; 2,80753] s**. **#56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14.**
- **Điểm (m) #59: DƯƠNG +35,173 s ĐÃ GHI** (T7-158; T7-159 xác nhận KHÔNG có điểm mới trong phiên này — đúng 1 requeue 01:33–02:36Z). n ứng viên 17 (15 dương + 2 âm, nhánh khuyến nghị) hoặc 18 (15 dương + 3 âm); dải 33–49,8 s GIỮ NGUYÊN. **Điểm (m) #57: DƯƠNG +47,698 s ĐÃ CHẤP NHẬN** (quyết (f) đợt 157). **Điểm (m) #58: DƯƠNG MỚI +42,529 s** (T7-158) — vẫn chờ parent quyết.
- **Nghịch lý đồng hồ mới:** #59 — đồng hồ cũ (28366bd0) nhanh ≥ **+19 s** lúc chết (poll watcher-158 cuối 01:34:06Z + dòng sampler 01:34:05Z, cả hai đóng dấu `boot=28366bd0` tươi sau btime #59 01:33:47Z). T5-159 xác nhận độc lập cùng số ≥ +19 s. Cùng họ +12 s #53 / +7 s #55 / +25 s #57 / +28 s #58 — đồng hồ cell chạy nhanh dần ở cuối mỗi boot.
- **WFS #65: chênh 0 — lần thứ 65 liên tiếp.** NEWSTD 986/290, R7b 1.011/307, copies 25/17 (986+25 = 1.011). **EPERM: 0 sóng thật** trong cửa sổ probe. **RAM cửa sổ:** peak 2.250.420 kB = 35,77% guard; 0 mẫu ≥ guard → **birefnet 0 lần thử, lần thứ 13 liên tiếp**.
- **Run 158 SUCCEEDED 02:27:11Z** (T7-159), margin 520 s — hẹp thứ ba từ đợt 150. **POSTBOOT_PASS #59 ĐÃ GHI 02:41:22Z** (T5-159, poll=0). **O8 3/3 PASS trên #59** (T8-159: WebKit 21/21 ×2 + Chromium 21/21, DONE 03:04:13Z — trước reboot #60). Run 159 RUNNING, jitter 0 s (lần thứ 12 liên tiếp).

## 1. Checklist probe EPERM #78 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

- Probe #77: 23:45:15Z 20/11/2026, boot `28366bd0`, log 223 dòng.
- `status` 02:42:48Z: DEAD/STALE, heartbeat n=77, ts 2026-11-20T23:45:15Z, boot `28366bd0`, tuổi **10.653 s (2h57'33")**, exit 1. Log 223 → 224 (chính `status` ghi thêm dòng DEAD).
- `once` 02:42:53Z: **probe #78, boot=`eec65561`, ok=2 fail=0**, exit 0; log `boot changed 28366bd0 -> eec65561 (uptime since 2026-11-21 01:33:47)`.
- `status` lại: ALIVE, tuổi 2 s, n=78, exit 0. Log **223 → 226 (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Heartbeat: pid=28073, ts 2026-11-21T02:42:53Z, boot `eec65561-8a81-4f1a-99d6-a1ea81606127`, n=78. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **Cửa sổ probe #78: 23:45:15Z → 02:42:53Z = 10.658 s.**
- Dòng boot-changed: bước nhảy đơn 28366bd0 → eec65561, **không boot trung gian** — củng cố độc lập bằng scheduler: run 158 chỉ có đúng 1 bộ requeue tại #59 (eid 9572/9573/9574, T7-159); một boot trung gian sẽ để lại thêm 1 bộ requeue.
- Prereg (`round159-t2/prereg-t2.md`, viết TRƯỚC probe #78 ~02:42Z): (a) DEAD/STALE + #78 ok=2 fail=0 boot eec65561 + log 223→226 ✓ (kể cả chi tiết bước nhảy đơn); (b) F122? ≈ +1 s, 3 server — **ĐÚNG giá trị nhưng SAI BOOT** (đo trên #60, không phải #59 — xem F-159-T2-3); (c) #91? ĐÓNG — **ĐÚNG verdict nhưng SAI cơ chế** (prereg đoán đóng bằng mốc hợp nhất chung chung; thực tế H file-gap VƯỢT sàn 1.355 s, đóng nhờ mốc nội dung — xem F-159-T2-7); (d) #88? giữ MỞ ✓; (e) INSIDE không lên 5 ✓ (đúng 445 s muộn như dự báo 7m25s); (f) thu hẹp cửa (m) #56 — **KHÔNG ĐẠT** (không neo mới, cửa giữ nguyên); (g) WFS #65 chênh 0 ✓, EPERM 0 sóng ✓, RAM < guard ✓, birefnet 0 lần ×13 ✓; (h) #77? vẫn mở ✓, CERT/FULL giữ 76/91 ✓; (i) không reboot mới sau 02:25Z — **SAI: reboot #60 lúc 03:05:59Z giữa phiên** (xem F-159-T2-2, F-159-T2-5).
- F122? (03:37:58–59Z — **TRÊN BOOT #60 e590ae0a, xem F-159-T2-3**, `round159-t2/f122.txt`): example.com Date 03:37:58 vs local-mid 03:37:57,258 = **+0,742 s** (latency 0,099 s); google.com 03:37:58 vs 03:37:57,749 = **+0,251 s** (0,870 s); cloudflare.com 03:37:59 vs 03:37:58,456 = **+0,544 s** (0,544 s) → **F122? ≈ +0,25…+0,74 s, đủ 3 server**. Cùng họ +0/+1 s với F119?/F120?/F121? (latency + cắt giây, không phải lệch đồng hồ thật). **Giá trị này chứng thực đồng hồ #60, KHÔNG phải #59.** Đồng hồ #59 dựa vào đo chéo: T0-159 Cloudflare +0,51/+0,47 s lúc ~02:41Z; T7-159 ±1–2 s lúc ~02:40Z.
- Drift test (03:38:11Z → 03:41:11Z, `round159-t2/drift-test.txt` — **cũng trên boot #60**): server elapsed 180,0 s, local elapsed 180,3 s, **tỉ lệ 1,0015 ≈ 1,0**, offset thay đổi −0,265 s → đồng hồ boot e590ae0a chạy đúng tốc độ thật; **btime #60 = 03:05:59Z là GIỜ THẬT**. (Script dùng curl thay http.client — http.client treo trong cell này, xem F-159-T2-2.)

## 2. Điều tra mù #91? (#59)

### 2.1 Sự kiện + định nghĩa đoạn (GIỜ THẬT, trừ khi ghi rõ là wall)

- Reboot #59: boot `eec65561`, btime 01:33:47Z (XÁC NHẬN đợt 159: T0-159 6 nguồn, T6-159, T7-159, T2-159). Reboot #60: boot `e590ae0a`, btime 03:05:59Z (XÁC NHẬN trong phiên này, xem §2.11 — ngoài cửa sổ probe #78, giao T2-160).
- Btime CHỈ lấy từ `/proc/stat btime` (quyết (e) đợt 156).
- Đoạn (giờ thật): **H** [23:45:15Z 20/11, 01:33:47Z 21/11] = 6.512 s — đuôi 28366bd0 sau probe #77. **I** [01:33:47Z, 02:42:53Z] = 4.146 s — đầu eec65561 tới probe #78.
- Sàn luật gap: **1.147 s** (19'07"). Đánh số boot (đếm chặt): 28366bd0 = #134?, eec65561 = #135?, e590ae0a = #136?. Mù: #91? ↔ #59 (H+I).
- Gap danh nghĩa (btime − btime, `/proc/stat`): **#59 = 8.859 s** (lifetime của 28366bd0: 1795224827 − 1795215968). Cả hai btime đều được chứng thực ~giờ thật trong vòng ~2 s (xem §2.2) — không có khung ±25 s kiểu #57.
- Quét thô (`blind9191-investigate.py`, cửa sổ [23:45:15Z, 02:42:53Z]): repo-1 **15 file**, hidden_files **430**, ngoài cây **129**, /tmp **0**, fifth-scope **0**; mốc giây duy nhất merged **284** (H 199 + I 85 = 284, không có giây biên chung).

### 2.2 Đồng hồ, nghịch lý #59 ≥ +19 s

- **Xác minh boot #59 độc lập, 6 nguồn (T0-159, cờ ~02:41Z):** boot hiện tại lúc mở `eec65561-8a81-4f1a-99d6-a1ea81606127`; `/proc/stat btime` **1795224827 = 01:33:47Z**; `uptime -s` = 01:33:47Z; journal đúng 1 boot, entry đầu 01:33:59Z (+12 s); `last reboot` 01:33 still running; wtmp bắt đầu 01:33:58Z (+11 s); `/proc/1` mtime 01:33:58,779Z. T6-159 + T7-159 xác minh độc lập cùng boot/btime.
- **Nghịch lý #59 ≥ +19 s (mới, hai nguồn độc lập):** (i) watcher-158 (`round158-t5/replay-watch-158.log`) poll cuối đóng dấu **01:34:06Z boot=28366bd0** — 19 s sau btime #59; (ii) sampler T9-158 (`round158-t9/ram-sampler.log`) dòng cuối trên boot cũ **01:34:05Z boot=28366bd0** — 18 s sau btime. Cả hai tiến trình đều đọc boot_id tươi mỗi vòng và đều chết theo reboot — một dòng có wall sau btime trên boot cũ chỉ xảy ra nếu đồng hồ cũ nhanh ≥ +19 s lúc chết. **T5-159 xác nhận độc lập cùng số ≥ +19 s** (cờ ~02:46Z: watcher-158 chết theo #59, log dừng 01:34:06Z, 0 NEWBOOT, không dòng END).
- Cùng họ +12 s #53 / +7 s #55 / +25 s #57 / +28 s #58 — **đồng hồ cell chạy nhanh dần ở cuối mỗi boot** (trường hợp cực đoan là c99a1045, J ≥ 42'46").
- **Khung chết #135? (28366bd0, chết ở #59):** danh nghĩa (01:33:36Z, 01:33:47Z] = 11 s theo mốc nội dung cuối (poll watcher 01:33:36Z), nhưng nghịch lý +19 s làm mất hiệu lực wall-frame (poll 01:33:36Z wall = thật ~01:33:17Z sau hiệu chỉnh) → **KHÔNG xác định bằng số đứng** (giữ như các đợt trước).
- **Mâu thuẫn ghi nhận (không phán thay — giao T10-159, F-159-T5-3):** T0-159 viết watcher-158 "chết tự nhiên, không do reboot"; T5-159 + T2-159 (log dừng đúng 01:34:06Z, không dòng END, poll cuối sau btime) đọc là chết theo #59. Bằng chứng log ủng hộ phía T5.

### 2.3 Hoạt động từng đoạn (tóm tắt có kiểm chứng)

- **H [23:45:15Z, 01:33:47Z] — 384 file-marks:** đầu +0 s (chính probe #77 — session agent T2-158 + heartbeat/log 23:45:15Z), cuối −168 s theo mốc file thô (01:30:59Z, exec-log T10-158). Nội dung: các luồng 158 đóng sổ (T2-158 f121/drift/LIMITS tới ~00:31Z; T6-158 test-v2 run3–run6 tới 23:46:46Z; T5-158 stats 23:46Z; T8-158 LIMITS 01:00:45Z + .done 01:01:22Z; T9-158 sampler + b2-watcher chạy suốt; T10-158 exec-log 01:02–01:30Z), sampler T9-158 restart? không — sampler 28366bd0 chạy liên tục 60 s/lần qua cả H (113 dòng trong H, xem §2.4), watcher-158 poll 30 s/lần (225 dòng tới 01:34:06Z).
- **I [01:33:47Z, 02:42:53Z] — 190 file-marks:** đầu **+19 s thô / +31 s sau CLOCK RULE / +11 s sau mốc hệ thống** (xem §2.4); cuối −9 s theo mốc file (02:42:44Z, prereg T2-159) / −0 s union (poll watcher-159 02:42:53Z đúng giây probe #78). Nội dung: sampler khởi động lại trên #59 (dòng đầu eec65561 01:35:25Z, 22 dòng tới 01:56:25Z rồi NGỪNG tới 02:39:46Z), T7-158 đóng sổ (LIMITS 02:01:40Z, NOTES 02:01:45Z, .done 02:02:24Z), T10-158 count-final (script 02:13:31Z, .done 02:24:48Z), dispatch đợt 159 (02:35:51Z), các luồng 159 viết từ 02:38Z (T0/T1/T4/T5/T6/T7/T8/T9), watcher-159 khởi động bằng tay 02:41:21Z (poll 30 s/lần), POSTBOOT_PASS #59 02:41:22Z, probe #78 (02:42:53Z).
- **Session bắc cầu / jump witness (`blind9191-sessions.py`, 30 exec-log có mtime trong cửa sổ):** H 21, I 9 exec-log. Jump witness: **#59: 0 thật.** Hai hit thô đều là artifact trích dẫn trong văn bản lệnh/log (xem F-159-T2-8): log T8-158 trích "Attempt3 (23:53:09-23:57:16Z)" + dòng "btime 23:06:08Z" trong banner start; log T8-158 khác trích btime #58 trong banner `=== start 00:10:25Z boot 28366bd0 ... btime 23:06:08Z ===`.
- **Đuôi/head (mỗi đoạn lấy 1 sàn 1.147 s ở đầu/cuối — đếm FILE thô, không phải mốc giây) — ngoài cây / /tmp / repo-1 / hidden_files / fifth:** H-head **49 / 0 / 3 / 111 / 0**; H-tail **4 / 0 / 0 / 0 / 0**; I-head **3 / 0 / 0 / 3 / 0**; I-tail **38 / 0 / 4 / 117 / 0**. (H-tail và I-head thưa file thô nhưng mốc nội dung sampler/waiter lấp đầy — xem §2.4. /tmp = 0 cả cửa sổ: không còn node-compile-cache như đợt 158 — vite chưa chạy trong đợt 159 lúc probe.)

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

- Merged 5 phạm vi (repo-1 + hidden_files + ngoài cây + /tmp + fifth): **284 mốc giây duy nhất** (đã sửa lỗi float của T2-158 — fifth-scope cắt về giây trước khi merge, F-158-T2-7 không tái diễn). CLOCK RULE: mốc nào chứng minh bằng nội dung thuộc boot cũ thì loại khỏi đầu đoạn mới (I: loại file replay-watch-158.log 01:34:06Z — nội dung `boot=28366bd0`).
- **H — ĐÓNG (bằng mốc nội dung; mốc file vượt sàn). 199 mốc file, max gap FILE 1.355 s** (01:02:22Z → 01:24:57Z); các gap file tiếp 558 s / 493 s / 389 s / 179 s / 168 s; head +0 s, tail −168 s (thô).
  - **Mốc nội dung lấp hố 1.355 s — HAI nguồn độc lập, đóng dấu boot tươi:** (i) watcher-158 (`round158-t5/replay-watch-158.log`, 225 dòng trong H, cadence ~30 s): **45 poll trong hố** (01:02:33Z … 01:24:35Z), tất cả `boot=28366bd0`; (ii) sampler T9-158 (`round158-t9/ram-sampler.log`, 113 dòng trong H, cadence 60 s): **13 dòng trong hố** (01:03:05Z … 01:24:05Z), tất cả `boot=28366bd0`. Hợp nhất file + nội dung: **507 mốc, max gap 31 s** (01:02:33Z → 01:03:04Z — vùng giữa hai poll); các gap tiếp 31 s / 30 s / 30 s / 30 s / 30 s; tail −11 s wall (poll 01:33:36Z).
  - **Vì sao hố file 1.355 s là artifact, không phải khoảng mù thật:** quãng 01:02–01:25Z là lúc yên nhất của đợt 158 (T8 đã đóng 01:01:22Z; T7/T10 đang tính toán, chưa ghi file; watcher + sampler chỉ ghi nối vào 1 file mỗi nguồn — mtime file chỉ ghi lần cuối). Một boot ẩn sống trong hố sẽ phải giết cả watcher lẫn sampler (cả hai đều chết theo reboot — bằng chứng: watcher dừng 01:34:06Z + sampler dừng 01:34:05Z theo #59) rồi cho chúng chạy lại đúng cadence 30/60 s với cùng boot stamp — không thể xảy ra mà không để lại gap nội dung > 60 s. Cả hai nguồn đều liên tục qua hố.
  - **Tiền lệ phương pháp:** T2-157 §2.4 (đoạn D: gap 353 s là artifact log append-only) và T2-158 §2.4 (đoạn F: file 1.279 s / union 103 s). Lần này mốc file VƯỢT sàn nên nội dung là căn cứ verdict — trình rõ cả hai số + tiền lệ để parent bác nếu không chấp nhận cách đọc này (F-159-T2-7).
  - **Caveat đồng hồ trên mốc nội dung H:** các dòng watcher/sampler cuối H mang wall-frame của 28366bd0, đồng hồ này nhanh dần tới ≥ +19 s lúc chết — mốc nội dung cuối H (01:33:36Z wall) có giờ thật ~01:33:17Z, tức tail union thật ~30 s thay vì 11 s wall. Bất định ±~20 s này không đổi verdict (max gap 31 s ≪ sàn 1.147 s).
- **I — ĐÓNG. 85 mốc file (84 sau CLOCK RULE), max gap 1.132 s** (01:35:40Z → 01:54:32Z — chỉ dưới sàn 15 s); các gap file tiếp 634 s / 305 s / 237 s / 194 s / 165 s; head +19 s (thô) / **+31 s (CLOCK RULE)** / **+11 s (union)**; tail −9 s (file) / −0 s (union).
  - **Đầu I, ba lớp số:** (i) mốc file thô đầu tiên 01:34:06Z (replay-watch-158.log) — LOẠI theo CLOCK RULE vì nội dung chứng minh boot cũ; (ii) mốc file đầu tiên sau CLOCK RULE 01:34:18Z (docs `client-surfaces.md`/`ideas.md`/`muse.md`, +31 s — quy gán boot theo thời điểm, phù hợp phiên agent khởi động lại trên #59; không có boot stamp trong nội dung); (iii) mốc hệ thống +11 s: bản ghi reboot trong wtmp 01:33:58Z + entry đầu journal 01:33:59Z + `/proc/1` mtime 01:33:58,779Z (cả ba ghi nhận TRƯỚC reboot #60 — wtmp/journal hiện tại đã xoay theo #60, xem F-159-T2-9).
  - **Mốc nội dung lấp hố file 1.132 s:** sampler trên #59 (22 dòng 01:35:25–01:56:25Z, cadence 60 s): **19 dòng trong hố** (01:36:25Z … 01:53:25Z), tất cả `boot=eec65561`. Hợp nhất file + nội dung: **112 mốc, max gap 634 s** (02:13:31Z → 02:24:05Z — vùng T10-158 tính toán chưa ghi file; 0 exec-log nào có mốc nội dung trong gap này, đã kiểm); các gap tiếp 305 s / 237 s / 194 s / 165 s / 162 s. Hố file 1.132 s còn max sub-gap 60 s sau khi lấp.
  - **Lưu ý:** max gap file I (1.132 s) chỉ dưới sàn 15 s — verdict file-alone mong manh; union 634 s cho biên an toàn 513 s. Cả hai số đều trình.
- **Không còn mốc AMBIG trong vùng chồng lấn H/I:** mọi mốc wall 01:34:05–06Z đều là nội dung 28366bd0 đã chứng minh (sampler + watcher); mốc I thật đầu tiên theo hệ thống là 01:33:58Z (wtmp), theo file là 01:34:18Z (docs).

### 2.5 CERT/FULL ứng viên + INSIDE (NOMINAL — chỉ trình, parent quyết)

- Cơ sở: CERT76/FULL91 CHÍNH THỨC (quyết (c) đợt 155, giữ theo quyết (b) đợt 157). CERT89/90 + FULL104/105 là ứng viên có điều kiện (T2-158) — tất cả yêu cầu #74?..#90? ĐÓNG hết, là SAI (#77? còn mở, #88? MỞ) nên chỉ là ứng viên. CERT91/FULL106 dưới đây là ứng viên có điều kiện trên chuỗi đó CỘNG #91? đóng — tức yêu cầu #74?..#91? ĐÓNG hết, là **SAI** (#77? còn mở, #88? MỞ) → chỉ là ứng viên, không chứng nhận.
- **CERT91** (gap #59 NOMINAL 8.859 s): n=91, mean 1h34'25", median 1h49'17", p10 0h19'38", p90 2h16'19", sd 0h50'36", min 0h00'55", max 5h14'27"; trong 90–150' = 50, <60' = 22, >180' = 4, >240' = 1.
- **FULL106** (gap #59 NOMINAL 8.859 s): n=106, mean 1h38'58", median 1h51'50", p10 0h25'24", p90 2h22'30", sd 0h56'55", min 0h00'55", max 5h43'18"; trong 90–150' = 57, <60' = 25, >180' = 7, >240' = 3.
- Nhạy cảm gap #59 ±2 s: không đổi thống kê (cả hai btime chứng thực ~giờ thật trong ~2 s; xem §2.2).
- **INSIDE (chuỗi):** chuỗi 4 sau #58 (ứng viên). **#59: btime eec65561 01:33:47Z NGOÀI dải FULL105 [23:31:24Z 20/11, 01:26:22Z 21/11] — muộn hơn 445 s → chuỗi KHÔNG lên 5, GIỮ 4.** Dải cho boot sau eec65561 (FULL106 neo 01:33:47Z): **[01:59:11Z, 03:56:17Z 21/11]**.
- **Reboot #60 (ngoài phạm vi #91?, ghi nhận cho T2-160):** btime e590ae0a 03:05:59Z INSIDE dải FULL106 [01:59:11Z, 03:56:17Z] → một chuỗi mới bắt đầu từ #60 (độ dài 1 tính tới đây). Gap #60 danh nghĩa (lifetime eec65561) = **5.532 s**. Cách đếm chuỗi mới giao parent/T2-160 xác nhận.
- Tốc độ reboot: tới #58: 134 reboot / 242,80 h = 1 lần / 108,7 phút; **#59: 135 reboot / 245,26 h = 1 lần / 109,0 phút** (boot #1: 2026-11-10T20:18:10Z).

### 2.6 Hole-recheck (toàn cây `/home/hatch` + `/var/log`, mtime float)

- Một lần find trên hợp [19:32:59Z, 02:42:53Z]: **2.153 file** có mtime trong hợp (`holerecheck-all.txt`). Đối chiếu từng hố (bên trong nghiêm ngặt):
  - H-H1 (01:02:22, 01:24:57) 1.355 s: **3 hit, đều bẫy float** (session T8-158 01:02:22,493–626Z — cùng giây cạnh trái) — **0 mốc file mới trong hố** (mốc nội dung watcher/sampler xem §2.4). H-H2 (00:49:51, 00:59:09) 558 s: 1 hit, bẫy float. H-H3 (00:18:41, 00:26:54) 493 s: 1 hit, bẫy float. H-HT (01:30:59, 01:33:47) 168 s: 1 hit, bẫy float. H-IH (01:33:47, 01:34:18) 31 s: 1 hit, bẫy float (replay-watch-158.log 01:34:06,602Z — đã loại theo CLOCK RULE). H-I1 (01:35:40, 01:54:32) 1.132 s: 1 hit, bẫy float (b2-nohup2.out 01:35:40,502Z — cùng giây cạnh trái) — **0 mốc file mới** (mốc nội dung sampler xem §2.4). H-I2 (02:13:31, 02:24:05) 634 s: 1 hit, bẫy float. H-I3 (02:02:48, 02:07:53) 305 s: 3 hit, bẫy float.
  - **H-E1-88 (19:32:59Z, 20:17:30Z) 2.671 s — hố đầu E (#88?): 345 hit, TẤT CẢ bẫy float theo cơ sở T2-157 (blind85 lists + holerecheck-all), 0 MỚI.** Không có bằng chứng mới cho #88? — lần thứ ba liên tiếp.
  - Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (thư mục mode 0000, nobody:nogroup; bản thân thư mục có mtime 23:06:19,03Z — tạo lúc boot #58, là một mốc G-head; nội dung không đọc được nhưng không thể chứa mốc trong H/I/hố-#88? vì thư mục mới tạo 23:06:19Z — ghi làm giới hạn, không phải lỗ hổng verdict).

### 2.7 Verdict mù (tổng hợp)

| Mù | Reboot | Đoạn | Max gap | Verdict |
|----|--------|------|---------|---------|
| #91? | #59 | H+I | H 1.355 s (file) / **31 s (union)**; I 1.132 s (file) / **634 s (union)** | **ĐÓNG** |
| #88? | #56 | D+E | E đầu mở 2.683 s (Model 1) / 2.996 s (Model 2), 0 mốc mới | **MỞ (giữ)** |
| #77? | #45 | N | N 1.308 s, dữ liệu cố định đợt 155, không bằng chứng mới | **MỞ (giữ)** |

- #91? ĐÓNG theo luật gap trên mốc hợp nhất file + nội dung (max gap 31/634 s, max ẩn 0, hole-recheck 0 mốc file mới) — nhưng **KHÔNG tự chứng nhận**: CERT/FULL chính thức GIỮ 76/91 (quyết (b) đợt 157; #77? còn mở chặn phía trước theo thứ tự; #88? MỞ). Đề xuất parent: ghi nhận #91? ĐÓNG (ứng viên chứng nhận sau), #88?/#77? MỞ.
- Caveat duy nhất của #91?: max gap FILE của H vượt sàn (1.355 s > 1.147 s) — verdict ĐÓNG phụ thuộc vào việc chấp nhận mốc nội dung (watcher + sampler) làm mốc luật gap. Nếu parent chỉ chấp nhận mốc file thì H MỞ và #91? MỞ (xem §7 (a)). Đây là lần thứ hai liên tiếp verdict phụ thuộc mốc nội dung (F đợt 158: file 1.279 s / union 103 s).

### 2.8 Quét WFS #65 (03:59:43–04:00:07Z 21/11 — chạy trên boot e590ae0a (#60); đếm nội dung file nên không phụ thuộc boot; phương pháp ĐÚNG như scan-wfs64.sh)

- **NEWSTD: 986 dòng / 290 file** (phạm vi 3.376 file). **R7b: 1.011 / 307** (phạm vi 12.769 file). **Copies: 25 / 17** (không đổi). Đối chiếu 986+25 = 1.011 = R7b, **chênh 0 — lần thứ 65 liên tiếp**.
- Delta so với #64 (985/289): **+1 dòng / +1 file**, giải thích đầy đủ bằng diff (không đoán trước): `docs/PHASE9_ROUND158_T2_EPERM_LIMITS.md:1` — chính LIMITS T2-158 nhắc chuỗi "writeFileSync" một lần trong văn bản §2.8 (cùng mẫu các đợt trước; `grep -c` xác minh đúng 1 lần trong file đó). Phạm vi quét tăng +12 file (3.364 → 3.376) là file LIMITS + script đợt 159 — không chứa writeFileSync ngoài file trên.

### 2.9 Kiểm async `.writeFile(`

- Chỉ còn đúng 2 helper đã biết trong source: `apps/web/scripts/eperm-retry.mjs:71` và `apps/desktop/src/services/epermRetry.js:116`. **0 stray trong source.**
- Thêm 1 hit: `apps/desktop/dist/services/epermRetry.js:116` — bản build của đúng helper trên (diff 30 dòng quanh đó với source: byte-identical, exit 0) — không phải call site mới. (Lần quét này bao cả `dist`; các đợt trước không ghi rõ có bao dist hay không — ghi rõ để T2-160 khỏi đếm lại.)

### 2.10 Quét EPERM (cửa sổ probe #78)

- 115 file `*.log` có mtime trong cửa sổ probe. 1 file có hit, tổng 3 lần xuất hiện — đều KHÔNG phải sóng thật: `round158-t8/o8-158t8.log` ("sóng EPERM đã tắt" ×3 — marker đã biết).
- **0 lần "sóng EPERM vẫn bật", 0 lần "CẢNH BÁO", 0 lần "Operation not permitted" → 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~230,5 h** trước probe #78). EPERM chưa tuyên bố hết. (Không chạy `grep -r` tuỳ tiện cho chuỗi marker — F-150-T2-2: grep của T2 có thể bị ghi thành spike B2 bởi watcher T9.)

### 2.11 Reboot #59 xác nhận + reboot #60 mới + bàn giao T0/T1/T5/T7/T8/T9-159 (đối chiếu, không phán thay)

- **#59 XÁC NHẬN (T0-159 + T2-159 + T1-159 + T5-159 + T6-159 + T7-159 độc lập):** boot eec65561, btime /proc/stat 1795224827 = 01:33:47Z (GIỜ THẬT: T0-159 Cloudflare +0,51/+0,47 s; T7-159 ±1–2 s). T0-159 (cờ ~02:41Z): 6 nguồn khớp; KHÔNG reboot mới kể từ T10-158 đóng (~02:25Z); O8 JSON còn đúng (md5 khớp hồ sơ); local ≈ Cloudflare ±1 s; GitHub −7,05 s — không dùng làm chuẩn. T1-159 (cờ ~02:47Z): PASS verify 158, suite 28/28 trên eec65561; đếm toàn cục khớp (468/885/755; chờ push 136–158: 220/307/259); T1 xác nhận độc lập RAM max 2.250.420 / min 199.248 / balloon 38 — KHỚP số T2-159 (§5). T5-159 (cờ ~02:46Z): watcher-158 chết theo #59 (log dừng 01:34:06Z); **POSTBOOT_PASS #59 ĐÃ GHI 02:41:22Z** (boot+67m35s, replay-day-du, poll=0 — replay nhanh nhất từng ghi: hoạt động đầu boot+35s, xong boot+2m36s); ENOSPC #59: 58 dòng lúc 02:42:29Z (số riêng T5). T7-159 (NOTES #1, ~02:39–02:41Z): **run 158 SUCCEEDED 02:27:11Z** (event 02:27:11,543Z, eid 9587), margin **520 s** tới hạn 02:35:51Z (hẹp thứ ba từ đợt 150 sau 150: 177 s; 157: 345 s); run 159 RUNNING, jitter 0 s (lần thứ 12 liên tiếp), hạn 05:35:51Z 21/11. T8-159 (cờ ~03:35Z): **O8 PASS 3/3 QUA GATE CHUẨN CÙNG-BOOT #59** (WebKit 21/21 ×2 + Chromium 21/21, DONE 03:04:13Z); lượt yên #28 CÓ lượt hợp lệ #24 (attempt1 20/20, B 5/5, tickCost 44,5 ms, boot #59 — đúng boot); chuỗi WebKit FULL PASS 13 → ? (chờ T10/parent phán).
- **#60 MỚI — XÁC NHẬN TRONG PHIÊN NÀY (T2-159 + T8-159 + T9-159 độc lập):** boot `e590ae0a`, btime `/proc/stat` **1795230359 = 03:05:59Z** (GIỜ THẬT: F122? +0,25…+0,74 s + drift tỉ lệ 1,0015 trên chính boot này — nhưng xem F-159-T2-3: đó là đo của T2 sau khi boot đã đổi, không phải đo đương thời trên #59). `uptime -s` = 03:05:59Z; journal idx0 duy nhất, entry đầu 03:06:15Z (+16 s); wtmp bắt đầu 03:06:15Z (+16 s, bản ghi reboot 03:06:15,419204Z); `/proc/1` mtime 03:06:15,224Z; sampler T9-159: mẫu cuối #59 03:05:47Z → mẫu đầu #60 03:07:27Z. T9-159 reboot-note: sleep bị SIGTERM sau 1.575 s, phát hiện 03:06:58Z; sampler+watcher khởi động lại bằng tay. T8-159: harness attempt 1 chết giữa chừng theo #60 (không verdict; bằng chứng lưu `smoke/attempt1-reboot-killed/`); O8 đã xong TRƯỚC #60 nên không ảnh hưởng; harness attempt 2 trên #60: **6/6 PASS** (03:12:12–03:28:25Z), 85m4 KHÔNG tái kẹt lần 3, 86n2 PASS, kẹt cộng dồn GIỮ 13, chuỗi "P3 không kẹt" 0 → 1.
- **#60 không ảnh hưởng verdict #91?** (xảy ra 03:05:59Z, sau probe #78 02:42:53Z — ngoài cửa sổ H+I). Nó chỉ ảnh hưởng: (i) F122?/drift-test của T2 thực chất đo #60 (F-159-T2-3); (ii) wtmp/journal hiện tại đã xoay theo #60 — các mốc hệ thống đầu I (01:33:58/59Z) chỉ còn trong ghi chép trước #60 (xem F-159-T2-9); (iii) mù #92? giao T2-160.

## 3. Mù #88? + #77? — vẫn mở, không có bằng chứng mới

- #88? (đầu E trống 2.683 s Model 1 / 2.996 s Model 2, trong cửa sổ đợt 157) vẫn MỞ. Hole-recheck lại toàn cây + /var/log cho hố (19:32:59Z, 20:17:30Z): 345 hit, tất cả là bẫy float theo cơ sở T2-157, **0 mốc mới** (xem §2.6) — lần thứ ba liên tiếp 0 mốc mới. Không có nguồn mốc nào chưa kiểm cho cửa sổ lịch sử này (file tạo sau 21:56Z có mtime trong hố: 0; /var/log hiện tại đã bị ghi đè bởi #59 rồi #60 — khung wtmp +12 s chỉ còn trong ghi chép T2-157/T2-158; chrome-userdata 182 mốc đều là D đã chứng minh).
- #77? (đoạn N 1.308 s, trong cửa sổ đợt 155, 13:05:12–14:43:07Z, dữ liệu cố định; T2-155/156 đã áp chuẩn mốc merged cho L/M/N: L 60 s / M 81 s / N 1.308 s) vẫn MỞ. Cửa sổ đợt này (23:45:15Z–02:42:53Z) không chạm dữ liệu #77?. Không có bằng chứng mới trong đợt này. #77? vẫn là nút chặn chứng nhận theo thứ tự.
- #88? vẫn là hố MỞ duy nhất trong chuỗi #85?–#91? (cùng với #77? ở phía trước). CERT/FULL chính thức GIỮ 76/91.

## 4. Mô hình đồng hồ + điểm (m) #56: thu hẹp cửa — KHÔNG ĐẠT (lần thứ hai)

### 4.1 Cửa hiện tại (sau quyết (d)/(e) đợt 157, giữ theo T2-158)

- Model 1 (mô hình làm việc, đã chọn): R ≥ 2,562 (từ file session T10-156 mtime wall 20:16:36Z); #56 là điểm ÂM ⟺ R < 2,668 (run 156 còn chạy tại #56 ⟺ true-finish > 19:32:47Z). Cửa **2,562–2,668** (tinh chỉnh mili-giây: R ∈ [2,56251; 2,66817), rộng 0,10566).
- Model 2 (không chọn làm mô hình làm việc, chỉ để đối chiếu): J ≥ 2,566 s (cờ T10 20:15:33Z); #56 là điểm ÂM ⟺ J < 2,807 s. Cửa **2,566–2,807 s** (tinh chỉnh: J ∈ [2,566; 2,80753] s).
- n chính thức (ứng viên) GIỮ 14 cho tới khi #56 được chốt.

### 4.2 Ba hướng MỚI đã thử (prereg (f)) — không hướng nào cho neo mới

- **(i) Quét lại toàn cây tìm file có mtime trong cửa sổ wall D mà T2-157 chưa biết** (`d-rescan-all.txt`, find `/home/hatch` + `/var/log`, [19:04:44Z, 20:22:43Z]): **363 file, 0 giây MỚI** so với cơ sở T2-157 (557 giây từ blind85 lists + holerecheck-all). Mốc D muộn nhất VẪN là **file session T10-156 (6fc7dd16) mtime 20:16:36Z**; mốc muộn nhất toàn cửa sổ là sessions.json của session E 964f2bc4 lúc 20:19:34,327Z (đã biết từ T2-158 — là mốc E, không phải D). Không có file D nào muộn hơn 20:16:36Z; không có mốc D-wall mới nào để nâng cận dưới R.
- **(ii) Kiểm /var/log + wtmp còn sót bản ghi thời c99a1045 có timestamp ngoài:** find ở (i) đã bao `/var/log` — 0 giây mới. wtmp hiện tại chỉ còn boot #60 (đã xoay 2 lần kể từ c99a1045); các bản ghi wtmp/journal thời c99a1045 đã mất từ các reboot sau. Không còn bản ghi hệ thống nào thời c99a1045 mang timestamp ngoài (Date header / server timestamp) chưa kiểm — T2-158 đã grep `Date: ... GMT` toàn bộ `round156-t*/` + exec-log đợt 156: 0 hit; không lặp lại grep đó (không có nguồn mới).
- **(iii) Đối chiếu cờ T0/T7-159 xem có F-measure mới nào nhắc c99a1045 không:** grep `c99a1045` trên round159-t0.done, round159-t7/NOTES.md, round159-t1/*, round159-t5/*, round159-t6/* — **0 hit**. Không có F-measure mới nào cho c99a1045.
- **Hướng git log — KHÔNG THỰC HIỆN ĐƯỢC:** repo-1 không phải git repo (không có `.git`; push đi qua GitHub API từ main chat). Cũng không có push nào trong cửa sổ D (PUSH #7 ngày 18/11; các batch 136–158 chưa push) nên không tồn tại committer timestamp GitHub nào trong cửa sổ D từ repo này. Hướng này đóng.
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566; 2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n GIỮ 14. T2-159 KHÔNG chốt #56** (đúng như brief dặn — để parent quyết).
- Ghi chú: cửa chỉ khép được bằng một neo giờ thật mới trên c99a1045 (F-measure đương thời — đã chết cùng boot, không bù được) hoặc bằng một mốc D-wall muộn hơn 20:16:36Z (đã quét toàn cây lần thứ hai — không có). Cả hai đường đều đã đóng; **không còn hướng đo nào khác trong tầm cell** (ghi rõ để T2-160 khỏi làm lại — trừ khi xuất hiện nguồn dữ liệu mới ngoài cell).

### 4.3 Điểm (m) #57 + #58 + #59 (ghi nhận, không phán thay — T7 sở hữu)

- **#57: DƯƠNG +47,698 s — ĐÃ CHẤP NHẬN** (quyết (f) đợt 157). n ứng viên 15 (13 dương + 2 âm, nhánh khuyến nghị) hoặc 16 (13 dương + 3 âm nếu #56 là điểm ÂM). Dải 33–49,8 s GIỮ NGUYÊN. Điều tra (m) VẪN ĐÓNG.
- **#58: DƯƠNG MỚI +42,529 s (T7-158 NOTES #1)** — requeue run 157 lần 2 tại #58 (23:06:50,529Z, eid 9539), trong dải, khung giờ sạch. Nếu được chấp nhận thì n ứng viên thành 16 (14 dương + 2 âm, nhánh khuyến nghị) hoặc 17 (14 dương + 3 âm). T7-158 chưa đóng cờ lúc T2-158 đóng — verdict thuộc T7/parent; T2-159 không phán thay.
- **#59: DƯƠNG +35,173 s ĐÃ GHI (T7-158)** — requeue run 158 tại #59 (01:34:22,173Z, eid 9572), trong dải. **T7-159 xác nhận KHÔNG có điểm (m) mới trong phiên này** (đúng 1 requeue 01:33–02:36Z, mọi job). Nếu #58 và #59 đều được chấp nhận thì n ứng viên thành **17 (15 dương + 2 âm, nhánh khuyến nghị) hoặc 18 (15 dương + 3 âm)**. Dải dương GIỮ 33–49,8 s.
- Run 158 SUCCEEDED 02:27:11Z, margin 520 s (T7-159 NOTES #1) — hẹp thứ ba từ đợt 150 (sau 150: 177 s; 157: 345 s).

## 5. RAM trong cửa sổ probe (T9-158 sampler 131 mẫu + T9-159 4 mẫu)

- Guard 6.144 MiB = 6.291.456 kB. Balloon ceiling 6.443.824 kB. Gán theo trường `boot=` (không theo timestamp).
- **T9-158 (28366bd0 + eec65561):** n=131 trong cửa sổ, peak mem=**2.250.420 kB = 35,77% guard**; balloon(ceiling)=**38**; mẫu ≥ guard=0. Theo boot: 28366bd0 n=109, peak 2.250.420 kB (35,77%); eec65561 n=22, peak 1.750.264 kB (27,82%). Min 199.248 kB (195 MiB).
- **T9-159 (eec65561):** n=4 trong cửa sổ (02:39:46–02:42:46Z), peak 1.891.264 kB = 30,06% guard; balloon=0; ≥ guard=0.
- **Toàn cửa sổ: peak 35,77% guard; 0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 13 liên tiếp** (cơ chế (a) vẫn trực; u2net là fallback chính thức).
- **Đối chiếu độc lập:** T1-159 đọc cùng log và ghi RAM max 2.250.420 / min 199.248 / balloon 38 — KHỚP từng số.
- **Lưu ý:** sampler NGỪNG 01:56:25Z → 02:39:46Z (43 phút, T9-159 khởi động lại bằng tay lúc ~02:39Z) — KHÔNG có mẫu RAM nào cho quãng đó (bao gồm đuôi I sau T7-158 đóng sổ); peak trong quãng đó là cận dưới (cùng họ F-142-T2-10). Balloon chạm trần 38 lần (28366bd0) — áp lực bộ nhớ có thật nhưng mem vẫn dưới guard.
- **Lưu ý 2:** sau cửa sổ probe, sampler T9-159 tiếp tục chạy qua reboot #60 (mẫu đầu #60 03:07:27Z, boot=e590ae0a) — ngoài phạm vi RAM đợt này, giao T2-160.

## 6. Phương pháp, sai số riêng, câu hỏi cho parent

### 6.1 Phương pháp (đạo lại từ đầu, không chỉ đối chiếu)

- Luật gap trên mốc merged 5 phạm vi (repo-1 + hidden_files + ngoài cây + /tmp + fifth-scope memory/dreams/side-chats), độ chính xác giây; sàn 1.147 s; CLOCK RULE loại mốc nội dung boot cũ khỏi đầu đoạn mới; hole-recheck toàn cây `/home/hatch` + `/var/log` (mtime float) cho mọi hố lớn + hố #88?; session bắc cầu + jump witness trên 30 exec-log (kiểm tay từng hit thô); head/tail đếm FILE thô theo sàn; mốc NỘI DUNG (watcher-158 poll 30 s + sampler 60 s, boot stamp tươi) dùng để lấp hố file append-only theo tiền lệ T2-157 §2.4 / T2-158 §2.4 — lần thứ hai nội dung quyết định verdict (H), trình rõ cả hai số file/union; WFS quét lại bằng đúng phương pháp đợt 158 (script sed từ scan-wfs64.sh, chỉ đổi tên OUT); EPERM quét marker trong `*.log` có mtime trong cửa sổ; RAM gán theo `boot=`; CERT/FULL + INSIDE tính lại từ CERT90/FULL105 (exec script đợt 158, tự nó exec script đợt 157 → 156).
- Phạm vi: đạo lại từ đầu cho #91? (H+I đầy đủ) + kiểm lại #88?/#77?. Đối chiếu chéo (không phán thay): run 158 + (m) (T7-159 NOTES #1), POSTBOOT_PASS (T5-159 cờ), O8/suite (T1-159 + T8-159 cờ), boot survey (T0-159 cờ), RAM (sampler T9-158/T9-159 đọc trực tiếp; T1-159 đối chiếu khớp).
- Script trong `round159-t2/`: `prereg-t2.md`, `f122.py` + `f122.txt`, `drift-test.py` + `drift-test.txt`, `blind9191-investigate.py` (+ 4 file mốc thô + log), `blind9191-merged.py` (+ `blind9191-fifthscope.txt`, log), `blind9191-content.py` (+ log), `blind9191-sessions.py` (+ `sessions-9191.txt`, log), `hole-recheck9191.py` (+ `holerecheck-all.txt`, `find-stderr.txt`, log), `blind9191-gaps.py` (+ txt), `eperm-sweep9191.py` (+ txt), `ram-max9191.py` (+ txt), `scan-wfs65.sh` (+ `files-newstd.bin`, `files-r7b.bin`, `files-copies.txt`, `wfs-newstd.txt`, `wfs-r7b.txt`, `wfs-copies.txt`, `scan-meta.txt`, `scan-wfs65.txt`), `d-rescan-all.txt` + `d-rescan.log` (hướng (m) mới).

### 6.2 Sai số riêng (F-159-T2-*)

- **F-159-T2-1:** prereg + docstring script `blind9191-investigate.py` ghi H = 6.632 s — SAI, đúng là **6.512 s** (23:45:15Z → 01:33:47Z = 885 + 5.627). Script in ra 6.512 s nên bắt ngay; đã sửa docstring bằng sed trước khi chạy merged. Số dùng trong LIMITS này là 6.512 s.
- **F-159-T2-2:** hai lần chạy `f122.py` đầu bị treo (lần 1: http.client treo + lỗi approval correlation của runtime; lần 2: session exec "disappeared before completion") — phiên exec chết theo **reboot #60 lúc 03:05:59Z** giữa lúc treo; lúc `date -u` chạy lại đã là 03:37:30Z trên boot mới. Đã viết lại F122/drift-test dùng curl (chạy ngay, 0,1–0,9 s/lần). Không mất dữ liệu probe #78 (đã fsync trước reboot).
- **F-159-T2-3:** `f122.txt` header ghi "boot eec65561 (#59)" — **SAI BOOT**: đo lúc 03:37:58Z trên `e590ae0a` (#60). Giá trị +0,742/+0,251/+0,544 s vẫn đúng — nhưng chứng thực đồng hồ #60, KHÔNG phải #59. Đồng hồ #59 dựa vào đo chéo T0-159 (Cloudflare +0,51/+0,47 s) và T7-159 (±1–2 s). Drift-test (03:38:11–03:41:11Z, tỉ lệ 1,0015) cũng trên #60 → btime #60 là giờ thật. Prereg (b) vì vậy chỉ đúng một nửa.
- **F-159-T2-4:** mốc file của chính probe #78 (`eperm-probe-v2.log`/`eperm-probe-v2.heartbeat`, mtime 02:42:53,670Z) vượt B1 đúng 0,67 s nên bị loại khỏi file-marks (đuôi file I 02:42:44Z, không phải 02:42:53Z). Đuôi union I −0 s là nhờ poll watcher-159 lúc 02:42:53Z đúng giây đó (đã truy nguồn trực tiếp bằng grep). Không ảnh hưởng verdict (đuôi file −9 s cũng ≪ sàn).
- **F-159-T2-5:** prereg (i) "không reboot mới sau 02:25Z → KHÔNG có mù #92?" — **SAI: reboot #60 xảy ra 03:05:59Z giữa phiên** (xác nhận 6 nguồn, xem §2.11). #92? giao T2-160.
- **F-159-T2-6:** hướng git log cho (m) không chạy được vì repo-1 không phải git repo (không có `.git`; push đi qua GitHub API). Cũng không có push nào trong cửa sổ D nên hướng này đóng cả về dữ liệu lẫn công cụ.
- **F-159-T2-7:** prereg (c) dự báo "#91? ĐÓNG" với giả định ngầm là đóng chung chung — SAI cơ chế: max gap file H là 1.355 s, VƯỢT sàn 208 s. Verdict H ĐÓNG dựa vào mốc nội dung (watcher 45 poll + sampler 13 dòng trong hố) — lần thứ hai liên tiếp nội dung quyết định verdict thay vì chỉ giải thích gap (sau F đợt 158). Trình rõ cả hai số file/union + tiền lệ để parent bác nếu không chấp nhận.
- **F-159-T2-8:** `blind9191-sessions.py`: regex giờ (`HH:MM:SSZ`) khớp cả chuỗi trích dẫn trong văn bản lệnh/log → 2 hit jump-witness GIẢ (dòng "Attempt3 (23:53:09-23:57:16Z)" + btime #58 trích trong banner start của log T8-158). Đã kiểm tay từng hit — tất cả là artifact; jump witness thật **0**. Số trong LIMITS này là số đã hiệu chỉnh. (Cùng mẫu F-158-T2-3.)
- **F-159-T2-9:** các mốc hệ thống đầu I (wtmp 01:33:58Z, journal 01:33:59Z, `/proc/1` 01:33:58,779Z) chỉ còn trong ghi chép TRƯỚC reboot #60 (T0-159 + lệnh `last reboot`/`journalctl --list-boots` của T2 lúc ~02:42Z) — wtmp/journal hiện tại đã xoay theo #60 (wtmp begins 03:06:15Z). T2-160 muốn kiểm lại phải dùng ghi chép này, không đọc lại được từ đĩa.

### 6.3 Câu hỏi cho parent (quyết)

- **(a) Mù #91? ĐÓNG — chấp nhận mốc nội dung làm mốc luật gap?** H: max gap file 1.355 s (vượt sàn 208 s) nhưng union file+nội dung max gap 31 s (watcher 45 poll + sampler 13 dòng trong hố, cadence 30/60 s, boot stamp tươi, hai nguồn độc lập). Nếu parent chỉ chấp nhận mốc file thì H MỞ và #91? MỞ. CERT91/FULL106 là ứng viên có điều kiện (xem §2.5). (Cùng câu hỏi như (a) đợt 158 cho F — tiền lệ đã có.)
- **(b) Mù #88? VẪN MỞ (0 mốc mới lần thứ ba) + #77? VẪN MỞ — ghi nhận?** CERT/FULL chính thức GIỮ 76/91 (chờ chứng nhận theo thứ tự — #77? còn mở phía trước).
- **(c) Chuỗi INSIDE: 4, KHÔNG lên 5 (#59 ngoài dải FULL105 đúng 445 s) — ghi nhận?** Dải cho boot sau eec65561 (FULL106): [01:59:11Z, 03:56:17Z 21/11]. #60 (03:05:59Z) INSIDE dải này — một chuỗi mới bắt đầu từ #60; cách đếm chuỗi mới giao parent/T2-160 xác nhận.
- **(d) Điểm (m) #56: VẪN CÓ ĐIỀU KIỆN — cửa R 2,56251–2,66817 không thu hẹp được lần thứ hai (3 hướng mới đều âm tính, không còn hướng đo nào trong tầm cell) — chấp nhận để mở?** n chính thức (ứng viên) GIỮ 14.
- **(e) Điểm (m) #58: DƯƠNG MỚI +42,529 s (T7-158) — chấp nhận?** (T7 sở hữu phán; T2 chỉ ghi nhận.) Nếu chấp nhận cả #58 lẫn #59 (+35,173 s) thì n ứng viên 17 (nhánh khuyến nghị) hoặc 18.
- **(f) Reboot #60 (btime 03:05:59Z, giờ thật) + mù #92? — ghi nhận, giao T2-160?** Gap #60 danh nghĩa 5.532 s.
- **(g) Nghịch lý #59 ≥ +19 s (đồng hồ 28366bd0 nhanh lúc chết; T5-159 xác nhận độc lập) — ghi nhận như vậy?** Khung chết #135? KHÔNG xác định bằng số đứng.
- **(h) Mâu thuẫn T0-159 vs T5-159 về cái chết của watcher-158 (tự nhiên vs theo #59) — giao T10-159 phán (F-159-T5-3)?** Bằng chứng log của T2-159 ủng hộ phía T5 (poll cuối 01:34:06Z sau btime, không dòng END).

## 7. File + stage

- LIMITS này: `docs/PHASE9_ROUND159_T2_EPERM_LIMITS.md` (1 file, text; oversize — lúc push cần `ENABLE_PRIVSEP=0`, cùng mẫu LIMITS T2-157 51.420 B / T2-158). Không sửa code repo. KHÔNG PUSH, KHÔNG release/tag.
- Stage: `phase9-round159-t2-eperm.txt` — 1 entry (LIMITS này), NUL-delimited, text only, đã verify bằng `od -c`.
- Cờ: `round159-t2.done` (có nội dung) — hạn cờ ~05:00Z, hạn cứng ~05:30Z 21/11; T2 đóng trước hạn.
