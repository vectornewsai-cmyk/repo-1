# PHASE9 ROUND 163 — T0: Boot survey + O8 JSON (REBOOT MỚI #65 ứng viên; btime 14:34:57Z LÀ GIỜ THẬT — KHÔNG CÓ NGHỊCH LÝ ĐỒNG HỒ; reboot GIỮA hai đợt, SAU khi T10-162 đóng sổ 18'18"; RUN 162 SUCCEEDED TRƯỚC BTIME — KHÔNG BỊ GIẾT; watcher-162 CHẾT SỚM, KHÔNG PHẢI DO REBOOT; O8 check-only, T8-163 sở hữu O8 chính thức)

- Lượt cron 21:35 +07 21/11/2026 = 14:35:51Z 21/11. T0 mở ~14:38Z, đóng ~14:45Z.
- Hạn cờ ~17:00Z, hạn cứng ~17:30Z 21/11. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS, không chạy O8 live.

## §1. Kết luận boot: CÓ reboot mới — ứng viên #65, boot 1c1cf10c; btime 1795271697 = 14:34:57Z (9 nguồn khớp, KHÔNG nghịch lý như #62)

Boot lúc mở **KHÁC** boot lúc T10-162 đóng: **1c1cf10c, btime 1795271697 = 14:34:57Z**, trong khi T10-162 đóng trên boot **d9a8d1ce (#64, btime 11:15:18Z)**. 9 nguồn đều khớp btime (bảng dưới):

| # | Nguồn | Giá trị | Khớp btime? |
|---|-------|---------|-------------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156) | `1795271697` = 14:34:57Z | ✓ |
| 2 | `boot_id` (`/proc/sys/kernel/random/boot_id`) | `1c1cf10c-0528-4cb7-ad36-1c11ad005617` | ✓ |
| 3 | `uptime` chính xác (`/proc/uptime`, 3 lần đọc bracket) | 211,15 s lúc epoch 1795271909,07 → boot 1795271697,92; 212,15 s lúc 1795271910,07 → 1795271697,92; 213,15 s lúc 1795271911,07 → 1795271697,92 (cả 3 lần giống nhau tới 0,01 s, khớp btime tới 0,92 s — boot rơi vào giây .92 của btime) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 14:35:12Z (journal start lag +15 s sau btime — hơi dài hơn mẫu #61/#62/#64 (+11 s) nhưng cùng họ; xem §6); `--list-boots` chỉ còn 1 boot (journal không giữ boot cũ — hạn chế lặp lại các đợt trước) | ✓ |
| 5 | wtmp / `last reboot` | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Sat Nov 21 14:35 still running`; `wtmp begins Sat Nov 21 14:35:11 2026` | ✓ |
| 6 | `/proc/1` start | 14:35:11,49Z (+14,49 s sau btime — hơi dài hơn mẫu +11 s, cùng họ với journal +15 s; xem §6) | ✓ |
| 7 | Mốc thời gian T10-162 đóng (mốc file thực tế) | `round162-t10.done` mtime **14:16:39Z**; btime 14:34:57Z muộn hơn **18'18" (1.098 s)** → reboot xảy ra SAU khi T10 đóng sổ — xem §2 | ✓ |
| 8 | Scheduler DB host-side (`muse.db`, `scheduler.job_runs` + `scheduler.events`) | Run 162 `succeeded` **14:18:06Z** (trước btime 16'51"), 0 event sau đó, 0 requeue; run 163 `running` từ 14:35:51Z trên `worker_boot_generation` mới (`cron_boot_f0b2f993…` ≠ run 162 `cron_boot_af9b5417…`) | ✓ |
| 9 | Đồng hồ wall lúc mở vs Cloudflare | local ≈ Cloudflare ±1 s lúc ~14:41Z (2 lần đo curl, xem §6) | ✓ |

- **Số hiệu ứng viên: #65** — tiếp nối #64 (d9a8d1ce, btime 11:15:18Z). **Chờ parent xác nhận** số hiệu trước khi T2-163 dùng làm mốc chính thức (quy tắc đứng: T0 ghi số hiệu ứng viên, parent quyết).
- `dmesg` KHÔNG thử đọc đợt này (đợt 162 EPERM — không tính làm nguồn; 9 nguồn trên đã đủ, không cần dmesg).
- **dpkg.log (nguồn phụ): YẾU đợt này — file đã RESET theo boot** (tất cả 1.545 dòng dated 2026-11-21 14:3x, dòng đầu 14:35:44Z; md5 `aeb0886e` khác md5 #64 `335dc3f2` — file mới). Hoạt động dpkg đầu tiên 14:35:44Z = **boot+47s**, xuất hiện **7 s TRƯỚC giờ mở đợt** (14:35:51Z) — cùng mẫu #61 (12 s) / #62 (11 s) / #64 (11 s) — có vẻ kích hoạt bởi máy móc mở đợt, không phải theo boot (ghi nhận theo T5-161; T0 không suy đoán cơ chế). Trùng hợp: tổng 1.545 dòng đúng bằng tổng cuối của #64 — có thể cùng bộ package được configure lại; ghi nhận, không suy đoán. dpkg.log KHÔNG cho mốc btime độc lập đợt này.
- Tuổi boot: **#64 sống 11.979 s (3h19m39s)** = 14:34:57Z − 11:15:18Z; **#63 sống 2.676 s (44m36s)**; **#62 sống 9.073 s (2h31m13s)**.
- Hệ quả: mọi watcher/process của đợt 162 đều đã chết theo #65 (xem §3 — riêng watcher-162 chết SỚM HƠN, không phải do reboot); mọi timestamp wall trong đợt 163 đều thuộc boot mới.

## §2. KHÔNG có nghịch lý đồng hồ đợt này — btime 14:34:57Z LÀ giờ thật; KHÔNG OVERLAP #65/#64 dài; reboot KHÔNG rơi vào lúc T10-162 đóng sổ; RUN 162 KHÔNG BỊ REBOOT GIẾT

Khác hẳn #62 (xung đột 824 s, T10 phán OVERLAP), đợt này mọi bằng chứng đều nhất quán — **không có H1/H2 nào cần phán**:

### §2.1 Run 162 succeed TRƯỚC btime — bằng chứng DB quyết định (tin tốt nhất đợt này)

- Truy vấn chỉ-đọc `muse.db` (`scheduler.job_runs` + `scheduler.events`, job `vcut-build-loop`):
  - Run 162 `87119032-de13-445b-bb00-fd368b676d0e`: scheduled/started **11:35:51Z**, **`finished_at` 2026-11-21T14:18:06+00:00**, status **`succeeded`**, attempt 1, `worker_claimed_at_utc` 1795270675 (= 14:17:55Z), `worker_execution_timed_out` false. **Margin tới hạn 14:35:51Z: 1.065 s (17m45s)** — hẹp hơn run 161 (1.452 s) đúng 387 s, nhưng vẫn là margin rộng thứ tư trong chuỗi (sau 160: 1.935 s; 151: 1.828 s; 161: 1.452 s).
  - Events run 162: **CHỈ 2 event** — `dispatched` eid 9715 lúc 11:35:51.077Z; `succeeded` eid 9754 lúc **14:18:06.540Z**. **0 requeue, 0 event sau succeeded, 0 lần viết lại** (started_at = scheduled_for, không đổi).
  - Run 163 `3f169faa-6a18-4615-b8ea-ac42d02d4e7c`: scheduled/started 14:35:51Z, status `running` (lúc đọc), `worker_boot_generation` mới.
- Lag T10-162 đóng cờ → run succeeded: `.done` mtime 14:16:39Z → succeeded 14:18:06Z = **87 s** — cùng họ với run 159 (~89,7 s), run 160 (51 s), run 161 (44 s). Mẫu đứng giữ: run succeed ~1–1,5 phút sau khi T10 đóng cờ.
- **Suy luận:** worker của run 162 hoàn tất và báo cáo lúc **thật 14:18:06Z**, trước btime #65 (14:34:57Z) **16'51" (1.011 s)**. Lo ngại của parent lúc mở đợt ("reboot #65 54 s trước hạn — nguy cơ bị giết ngay trước hạn") **KHÔNG xảy ra**: run 162 đã succeed xong trước reboot, không bị giết, không bị viết lại. Btime #65 là giờ thật trong sai số đồng hồ ±1 s (§6).
- Tiền đề như đợt 161/162: timestamp DB = giờ host thật, độc lập với đồng hồ cell (scheduler + Postgres host-side, ngoài cell VM).

### §2.2 Không OVERLAP dài: boot #64 chết trong (14:25:21Z, 14:34:57Z]

- **T10-162 đóng 14:16:39Z** (mtime file thực tế, nội dung cờ xác nhận boot lúc đóng là d9a8d1ce #64) — btime #65 muộn hơn **18'18"**. Claim "KHÔNG reboot mới trong lúc T10 đóng sổ" của T10-162 **ĐỨNG** (khác #62, claim tương tự của T10-160 đã bị F-161-T1-1 bác; cùng mẫu #64: 4'23").
- Hoạt động cuối cùng quan sát được trên #64: **watcher-162 poll cuối 14:25:20Z** (log mtime 14:25:21Z — xem §3); hoạt động file cuối trên repo-1: `docs/PHASE9_ROUND162_LIMITS.md` mtime **14:21:23Z** (parent viết §12.3); hoạt động file cuối trên `hidden_files` (ngoài watcher log): `round162-t10.done` 14:16:39Z.
- **Cửa sổ overlap (14:34:57Z → 14:35:51Z): 0 file đổi trong `hidden_files`, 0 file đổi trong `repo-1`** (kiểm bằng `find -newermt` cả hai cây). Không có process/watcher/log nào của boot cũ viết gì sau btime.
- **Kết luận:** boot #64 chết trong khoảng (14:25:21Z, 14:34:57Z] — một reboot sạch giữa hai đợt, không phá lượt đo nào trong đợt 162. Không cần điều tra overlap như #62. Caveat: khoảng (14:25:21Z, 14:34:57Z] dài 9m36s là khoảng mù không có mốc file nào (do watcher-162 đã chết trước — xem §3), nhưng không có bằng chứng nào cho thấy boot cũ còn hoạt động trong khoảng đó; T2-163 kiểm mù #96? (#64) trên đoạn này.

### §2.3 Giao T2-163 / T7-163

- **T2-163:** dùng btime #65 **14:34:57Z giờ thật** trực tiếp làm mốc — không có hai khung giờ như #62, không cần chọn H1/H2. Mù #95? (#63) SƠ BỘ MỞ + #96? (#64) giao T2-163 (đoạn Q [11:15:18Z, 14:34:57Z] — lưu ý khoảng mù 14:25:21Z→14:34:57Z không có mốc file; gap #64 danh nghĩa 11.979 s làm cơ sở FULL110 theo quyết (dd) đợt 162). INSIDE chuỗi: tính #65 với btime thật 14:34:57Z (chuỗi mới bắt đầu từ #63, độ dài 1 — T2 kiểm #64 có nối chuỗi không, rồi #65).
- **T7-163:** kết cục run 162 — T0 CHỈ dùng `finished_at` 14:18:06Z làm bằng chứng đồng hồ, KHÔNG phán verdict run 162 (margin, slot HB/DR thuộc T7-163). Lưu ý T7: **0 run đang chạy tại btime #65** (run 162 đã xong 14:18:06Z, run 163 dispatch 14:35:51Z sau btime), **0 requeue** quanh btime — T7 kiểm điểm (m) #65 với chữ ký này (cùng mẫu #52/#61/#64 — cả ba đều KHÔNG PHẢI điểm; khác #62: 1 run đang chạy tại btime → ứng viên điểm ÂM; khác #63: requeue +37,128 s → ứng viên điểm DƯƠNG). T0 không phán (m) chính thức — chỉ ghi chữ ký.

## §3. Watcher: watcher-162 CHẾT SỚM — KHÔNG phải do reboot #65 (phát hiện mới); lúc đóng CHƯA CÓ watcher-163 (T5-163 chưa mở xong)

- **Watcher-162 pid 18801 (T5-162, chạy từ 11:40:00Z trên boot #64, END dự kiến 14:30:00Z): CHẾT SỚM, không phải do reboot.**
  - Log `round162-t5/replay-watch-162.log`: **336 dòng = 1 START + 1 MONITOR + 334 poll**, **poll cuối 14:25:20Z** (`dpkg_lines=1545 md5=335dc3f2`, ổn định), **0 NEWBOOT, 0 END, 0 STOP** — chết giữa chu kỳ poll, trước END 14:30:00Z đúng 4'40".
  - Script chỉ thoát có log qua 2 đường: `END_EPOCH` 14:30:00Z (ghi `REPLAY-WATCH-162-END`) hoặc file `watcher-stop` (ghi `REPLAY-WATCH-162-STOP`). Không có dòng nào trong log; file `watcher-stop` KHÔNG tồn tại trong `round162-t5/`. → process **chết không ghi log** giữa 14:25:20Z và poll kế 14:25:50Z (bị kill bên ngoài / SIGKILL / OOM — không xác định được nguyên nhân từ log; journal boot cũ đã mất theo reboot #65).
  - **Khác mọi watcher trước** (watcher-160/161 đều chết theo reboot, có poll cuối sát btime): watcher-162 chết sớm hơn btime #65 **9m37s**, tạo khoảng mù giám sát replay 14:25:20Z → btime (9m37s) + tiếp tục tới khi T5-163 khởi động watcher-163. T5-163 sở hữu điều tra nguyên nhân (nếu còn dấu vết) + khởi động watcher-163.
- **Lúc mở (~14:38Z): 0 watcher thật nào đang chạy.** Quét `ps` theo mẫu `replay-watch` trả 0 kết quả (chỉ `b2-watcher.sh` pid 7300 của T9-163, chạy từ 14:40Z — không phải replay-watch).
- **Lúc đóng (~14:45Z): watcher-163 CHƯA CÓ** — `round163-t5/` mới chỉ có `make-watcher-163.py` + `replay-watch-163.sh` (cả hai 14:44Z, T5-163 đang chuẩn bị). T5-163 sở hữu việc khởi động.

## §4. POSTBOOT_PASS #64: CÒN (T5-162 sở hữu); #65 CHƯA CÓ lúc T0 đóng — đã kiểm lại ngay trước khi ghi cờ (bài học quyết (r) đợt 162)

- Trên đĩa lúc đóng: **POSTBOOT_PASS #64 CÒN** — `round162-t5/POSTBOOT_PASS` (ghi 11:40:00Z, boot+24m42s, replay tự nhiên đầy đủ) + cờ cũ `POSTBOOT_PASS-39d46ba0` cover #62. Không có cờ nào cover #60, #63, hay #65.
- **#63 KHÔNG CÓ** (boot thứ 7 lọt — quyết (n) đợt 162).
- **#65 CHƯA CÓ lúc T0 kiểm lại cuối 14:44:36Z** (kiểm ngay trước khi ghi cờ — rút kinh nghiệm quyết (r) đợt 162: cờ T0-162 "CHƯA CÓ" stale ~30 s vì T5 ghi cờ 11:40:00Z sau lúc T0 kiểm; lần này T0 kiểm lại lúc 14:44:36Z, chỉ vài chục giây trước khi đóng cờ, và T5-163 lúc đó mới ở bước chuẩn bị script — cờ #65 chưa thể xuất hiện trước khi T0 đóng; nếu T5-163 ghi cờ ngay sau đó thì cờ T0 vẫn đúng tại thời điểm kiểm, T5 là nguồn chính thức).
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:40Z ngày 20/11 trên boot #48, mtime không đổi) — sống qua **17 reboot liên tiếp** #49–#65 (đếm độc lập: dải bao hàm 65 − 49 + 1 = 17; T5-162 liệt kê đủ 16 boot #49..#64 + parent quyết (q) đợt 162 xác nhận 16 ĐÚNG; nay thêm #65 → 17. T0-163 KHÔNG lặp lỗi T0-162 ghi 15 thay vì 16).
- T0 KHÔNG chạy postboot check trong đợt này (task T0-163 không yêu cầu; T5-163 sở hữu postboot). Trạng thái postboot thực tế trên #65 do T5-163 xác nhận.

## §5. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ T10-162/parent log, 21/21 ×3, boot #64)

Đối chiếu JSON T8-162 trong `hidden_files/round162-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 162 — T8-163 đã mở thư mục, xem §6):

| File | md5 (8 đầu) | Hồ sơ T10-162 | Nội dung kiểm bằng python |
|------|-------------|---------------|---------------------------|
| WebKit attempt1 `o8w-clicktest-report-2026-11-21T12-09-11-d9a8d1ce-pid41743.json` | `959abd4f…` ✓ | khớp | 21 results, 21 `ok=true`, boot d9a8d1ce |
| WebKit attempt2 `o8w-clicktest-report-2026-11-21T12-10-06-d9a8d1ce-pid42111.json` | `10c8aeee…` ✓ | khớp | 21 results, 21 `ok=true`, boot d9a8d1ce |
| Chromium `o8-clicktest-report-2026-11-21T12-10-54-d9a8d1ce-pid42497.json` | `fc7927b0…` ✓ | khớp | 21 results, 21 `ok=true`, boot d9a8d1ce |
| `o8w-clicktest-report.json` (latest) | `10c8aeee…` = attempt2 ✓ | byte-identical với stamped cuối | — |
| `o8-clicktest-report.json` (latest) | `fc7927b0…` ✓ | byte-identical với stamped cuối | — |

Cây md5 lúc mở khớp đúng hồ sơ T10-162 lúc đóng (không đổi ngoài ý muốn):

| File (đường dẫn thật) | md5 (8 đầu) |
|------------------------|-------------|
| `apps/web/src/preview.tsx` | `530e10a7` ✓ |
| `apps/web/src/media.ts` | `2c384ed1` ✓ |
| `apps/web/vite.config.ts` | `ee80d093` ✓ |
| `server/render/src/effects.js` | `fedc0141` ✓ |

- O8 JSON đợt 162 thuộc boot #64 (d9a8d1ce) — nay boot đã là #65 ứng viên, nhưng file JSON không đổi: T0 chỉ xác minh tính toàn vẹn, không chạy lại O8.
- Gate FOUND đợt 162 (theo T10-162/aggregate §8 + quyết (g) đợt 162): O8 chạy 12:09:11Z, SAU lượt yên hợp lệ #27 (11:54:39–11:58:30Z) về thời gian, TRÊN CÙNG BOOT #64, gate FOUND chuẩn lần thứ năm liên tiếp, O8 WebKit chạy bằng system libs — **chuỗi WebKit FULL PASS LÊN 17** (parent quyết cuối).

## §6. O8 live: KHÔNG chạy — theo quy ước đợt 162, T8-163 sở hữu O8 chính thức; lượt yên đợt 163 CHƯA CÓ kết quả lúc T0 đóng

- Task T0-163 yêu cầu **chạy/đối chiếu O8 theo quy ước đợt 162** — quy ước đó là **check-only** (T0-162 §6: T0 kiểm tĩnh JSON, T8 sở hữu O8 live; T0 không chạy vite/playwright để tránh va chạm cổng/lock với T8). T0-163 giữ nguyên quy ước: chỉ đối chiếu tĩnh §5, không chạy O8 live.
- T8-163 đã mở thư mục (`round163-t8/` tồn tại lúc T0 đóng). T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với T8-163.
- **Lượt yên đợt 163: CHƯA CÓ kết quả lúc T0 đóng.** T4-163 đã mở thư mục, scripts phân tích viết 14:41Z (`analyze-t4-*.py`), **0 cờ `.done` nào của đợt 163 tồn tại lúc T0 đóng** (T0 là cờ đầu tiên). T0 KHÔNG tự kết luận chuỗi WebKit FULL PASS — chỉ đề xuất sau khi có kết quả T4-163 + O8 T8-163; **parent quyết cuối** (quy tắc đứng: chuỗi chỉ lên khi CÓ lượt yên hợp lệ trong đợt + O8 chạy sau về thời gian TRÊN CÙNG BOOT đo + gate FOUND chuẩn).
- Đồng hồ wall cell lúc mở đợt 163: **CHUẨN (±1 s so với Cloudflare)**:

| Lần đo | Local (bracket) | Cloudflare Date | Đọc |
|--------|----------------|-----------------|-----|
| ~14:41Z (curl try1) | epoch 1795272106,66–1795272107,12 | 14:41:47 GMT, epoch 1795272107 (+0,34 đến −0,12 s so với bracket — trong độ trễ request) | local ≈ Cloudflare |
| ~14:41Z (curl try2) | epoch 1795272108,23–1795272108,60 | 14:41:48 GMT, epoch 1795272108 (−0,23 đến −0,60 s) | local ≈ Cloudflare |

- **Cảnh báo phương pháp (lặp lại từ đợt 158/159/160/161/162):** GitHub Date header dao động giữa các edge server — **không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-163 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên.
- Uptime math khớp btime tới 0,92 s (3 lần đọc §1, boot_est .92 — btime là floor của giây boot). Journal boot mới đơn điệu: 81 entry, 0 bước nhảy âm, gap lớn nhất 69,8 s (timer 1 phút, bình thường), 0 gap >120 s — không có dấu hiệu sửa đồng hồ sau boot.
- **Độ lệch nhỏ ghi nhận (không phải nghịch lý):** journal first entry +15 s và `/proc/1` +14,49 s sau btime — hơi dài hơn mẫu +11 s của #61/#62/#64, nhưng cùng họ (độ trễ khởi động), mọi nguồn khác khớp btime; không có xung đột nào cần phán H1/H2.
- `/tmp/.X11-unix/` **TRỐNG** lúc T0 đóng (0 socket — T8-162 đã dọn 3 socket X193/X194/X195 đợt trước; không socket mới nào xuất hiện).

## §7. Sai số của chính mình (F-163-T0-n)

- **F-163-T0-1 — urllib tới Cloudflare 403 lần đầu (lặp lại F-162-T0-2, đã xử lý đúng):** `urllib` tới `https://www.cloudflare.com` trả `403 Forbidden` cả 2 lần (không có Date header); `curl -sI` cùng URL lấy được Date bình thường cả 2 lần (khớp local ±1 s). Bài học giữ nguyên: một client 403 không có nghĩa endpoint chặn đo giờ — thử client khác trước khi bỏ nguồn.
- **F-163-T0-2 — `find` toàn cây repo-1 chậm (~106 s) + exit 1 giả:** lệnh `find` quét `repo-1` mất ~106 s (cây lớn); exit code 1 chỉ vì lệnh cuối `ls *.done | grep 163` không match cờ nào (0 cờ đợt 163 lúc đó — đúng thực tế, không phải lỗi). Không ảnh hưởng số liệu: cả hai lần `find -newermt` đều trả đủ kết quả trước khi lệnh kết thúc. Bài học: tách lệnh `grep` kiểm tra cờ ra khỏi chuỗi `find` dài để exit code không gây nhiễu.
- **F-163-T0-3 — ĐÃ TRÁNH lỗi làm tròn uptime (F-162-T0-5):** chỉ dùng 3 lần đọc bracket bằng python có phần thập phân cho phép toán uptime−epoch (boot_est 1795271697,92 cả 3 lần); không dùng `date +%s` nguyên giây cho phép toán này.
- **F-163-T0-4 — ĐÃ TRÁNH grep toàn cây (F-160-T0-3):** kiểm POSTBOOT_PASS #65 chỉ bằng `ls round163-t5/` có mục tiêu (0 cờ) + `ls` thư mục, không quét toàn cây `hidden_files/`.
- **F-163-T0-5 — ĐÃ TRÁNH đếm marker sai (quyết (q) đợt 162):** đếm độc lập dải bao hàm 65 − 49 + 1 = 17, đối chiếu với danh sách 16 boot #49..#64 của T5-162 + quyết (q) xác nhận 16 ĐÚNG — không cộng dồn bằng trí nhớ.
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung. Không ghi vào `build-loop-log.md` (theo tiền lệ T0-161/T0-162 — log lượt thuộc về T10-163 khi tổng hợp, tránh ghi chồng chéo với 8–10 luồng cùng lúc).

## §8. Bàn giao / nợ mở đợt 163

1. **Parent:** xác nhận số hiệu reboot ứng viên **#65** (boot 1c1cf10c, btime 14:34:57Z giờ thật) — T0 chỉ ghi ứng viên, chưa phải số hiệu chính thức.
2. **T10-163:** lưu ý (a) **KHÔNG có nghịch lý đồng hồ đợt này** — khác #62, không cần phán H1/H2/OVERLAP; btime #65 dùng trực tiếp; (b) claim "KHÔNG reboot mới trong lúc T10 đóng sổ" của T10-162 **ĐỨNG** (reboot sau khi đóng 18'18"); (c) **run 162 SUCCEEDED 14:18:06Z, margin 1.065 s — KHÔNG bị reboot #65 giết** (lo ngại lúc mở đợt không xảy ra); lag .done→succeeded 87 s; (d) **watcher-162 chết sớm không ghi log** (poll cuối 14:25:20Z, chết trước btime 9m37s — phát hiện mới, xem §3); (e) marker **17 reboot #49–#65** (đếm độc lập, không lặp lỗi T0-162); (f) dpkg.log reset theo boot lần thứ ba liên tiếp (#62, #64, #65) — hoạt động dpkg đầu boot+47s, 7 s trước giờ mở đợt.
3. **T2-163:** mù #77?/#88?/#94?/#95? + **#96? (#64) MỚI** (đoạn Q [11:15:18Z, 14:34:57Z]; lưu ý khoảng mù 14:25:21Z→14:34:57Z không có mốc file do watcher-162 chết sớm) + INSIDE chuỗi (dùng btime thật 14:34:57Z — #64 có nối chuỗi bắt đầu từ #63 không? rồi #65) + mô hình đồng hồ — dữ liệu mới §2 + §6 (local ≈ Cloudflare ±1 s; journal/+15 s, /proc/1 +14,49 s hơi dài hơn mẫu +11 s).
4. **T5-163:** viết POSTBOOT_PASS #65 (chưa có cờ lúc T0 đóng 14:44:36Z) + khởi động watcher-163 (chưa có watcher nào lúc T0 đóng; khoảng mù giám sát replay từ 14:25:20Z tới nay) + điều tra watcher-162 chết sớm không ghi log (nếu còn dấu vết); theo dõi replay #65 (dpkg burst 14:35:44–14:38:49Z rồi dừng — khác #64 kéo dài tới boot+20m22s mới bắt đầu).
5. **T7-163:** kết cục run 162 (run SUCCEEDED 14:18:06Z theo DB — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ: margin 1.065 s, 0 lần viết lại, slot HB/DR) + điểm (m) #65 (0 run đang chạy tại btime, 0 requeue — chữ ký #52/#61/#64; T7 phán chính thức, T2 đối chiếu).
6. **T8-163:** O8 chính thức (đã mở thư mục; T0 chỉ kiểm tĩnh §5, không chạy song song) + checklist (o) + H3 chỉ giám sát thụ động + X11 (đang TRỐNG).
7. **T6-163:** prune lần 38.
8. **T10-163:** tổng hợp — lưu ý chuỗi WebKit FULL PASS đang ở **17** theo quyết (g) đợt 162; chuỗi chỉ lên 18 khi T4-163 có lượt yên hợp lệ trong đợt + O8 T8-163 chạy sau về thời gian TRÊN CÙNG BOOT #65 + gate FOUND chuẩn — **T0 không tự kết luận, parent quyết cuối**.

## §9. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND163_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round163-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t0/NOTES.md` (số liệu thô: btime/uptime/journal/wtmp, Cloudflare brackets, watcher-log, DB query run 162/163).
