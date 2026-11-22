# PHASE9 ROUND 164 — T0: Boot survey + O8 JSON (REBOOT MỚI #67 ứng viên; btime 17:33:27Z LÀ GIỜ THẬT — KHÔNG CÓ NGHỊCH LÝ ĐỒNG HỒ; reboot GIỮA hai đợt, SAU khi T10-163 đóng sổ 16'50"; RUN 163 SUCCEEDED TRƯỚC BTIME — KHÔNG BỊ GIẾT; watcher-163 CHẾT THEO #66, watcher-164 ĐÃ CHẠY; O8 check-only, T8-164 sở hữu O8 chính thức)

- Lượt cron 00:35 +07 22/11/2026 = 17:35:51Z 21/11/2026. T0 mở ~17:39Z, đóng ~17:43Z.
- Hạn cờ ~20:00Z, hạn cứng ~20:30Z 21/11/2026. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS, không chạy O8 live.

## §1. Kết luận boot: CÓ reboot mới — ứng viên #67, boot f1d4ce1a; btime 1795282407 = 17:33:27Z (9 nguồn khớp, KHÔNG nghịch lý như #62)

Boot lúc mở **KHÁC** boot lúc T10-163 đóng: **f1d4ce1a, btime 1795282407 = 17:33:27Z**, trong khi T10-163 đóng trên boot **edb2acdb (#66, btime 16:06:45Z)**. 9 nguồn đều khớp btime (bảng dưới):

| # | Nguồn | Giá trị | Khớp btime? |
|---|-------|---------|-------------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156) | `1795282407` = 17:33:27Z | ✓ |
| 2 | `boot_id` (`/proc/sys/kernel/random/boot_id`) | `f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f` | ✓ |
| 3 | `uptime` chính xác (`/proc/uptime`, 3 lần đọc bracket) | 363,15 s lúc epoch 1795282770,47 → boot 1795282407,32; 364,15 s lúc 1795282771,47 → 1795282407,32; 365,15 s lúc 1795282772,47 → 1795282407,32 (cả 3 lần giống nhau tới 0,01 s, khớp btime tới 0,32 s) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 17:33:41Z (journal start lag +14 s sau btime — cùng họ mẫu #61/#62/#64/#65 (+11/+14/+15 s); xem §6); `--list-boots` chỉ còn 1 boot (journal không giữ boot cũ — hạn chế lặp lại các đợt trước) | ✓ |
| 5 | wtmp / `last reboot` | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Sat Nov 21 17:33 still running`; `wtmp begins Sat Nov 21 17:33:41 2026` | ✓ |
| 6 | `/proc/1` start | 17:33:40,95Z (+13,95 s sau btime — cùng họ với journal +14 s; xem §6) | ✓ |
| 7 | Mốc thời gian T10-163 đóng (mốc file thực tế) | `round163-t10.done` mtime **17:16:37Z**; btime 17:33:27Z muộn hơn **16'50" (1.010 s)** → reboot xảy ra SAU khi T10 đóng sổ — xem §2 | ✓ |
| 8 | Scheduler DB host-side (`muse.db`, `scheduler.job_runs` + `scheduler.events`) | Run 163 `succeeded` **17:18:13Z** (trước btime 15'14"), 0 event sau đó, 0 requeue quanh btime; run 164 `running` từ 17:35:51Z trên `worker_boot_generation` mới (`cron_boot_4c4c3fba…` ≠ run 163 `cron_boot_4beb5d7a3…`) | ✓ |
| 9 | Đồng hồ wall lúc mở vs Cloudflare | local ≈ Cloudflare ±1 s lúc ~17:39Z (2 lần đo curl, xem §6) | ✓ |

- **Số hiệu ứng viên: #67** — tiếp nối #66 (edb2acdb, btime 16:06:45Z). **Chờ parent xác nhận** số hiệu trước khi T2-164 dùng làm mốc chính thức (quy tắc đứng: T0 ghi số hiệu ứng viên, parent quyết).
- `dmesg` KHÔNG thử đọc đợt này (EPERM các đợt trước — không tính làm nguồn; 9 nguồn trên đã đủ, không cần dmesg).
- **dpkg.log (nguồn phụ): YẾU đợt này — file đã RESET theo boot** (chỉ 2 dòng, cả hai dated 2026-11-21 17:35:44, md5 `f7336062` — khác md5 #65 `aeb0886e`; xem §6). Hoạt động dpkg đầu tiên 17:35:44Z = **boot+137s**, xuất hiện **7 s TRƯỚC giờ dispatch đợt** (17:35:51Z) — cùng mẫu "7 s trước giờ mở" như #65 (boot+47s, 7 s trước mở) — có vẻ kích hoạt bởi máy móc mở đợt, không phải theo boot (ghi nhận theo T5-161/T0-163; T0 không suy đoán cơ chế). Kiểm lại lúc đóng 17:42:49Z: vẫn chỉ 2 dòng — burst chưa tăng (khác #65 burst 1.545 dòng trong boot+47s→boot+~4m; T5-164 sở hữu diễn giải replay). dpkg.log KHÔNG cho mốc btime độc lập đợt này.
- Tuổi boot: **#66 sống 5.202 s (1h26m42s)** = 17:33:27Z − 16:06:45Z; **#65 sống 5.508 s (1h31m48s)** = 16:06:45Z − 14:34:57Z; **#64 sống 11.979 s (3h19m39s)** = 14:34:57Z − 11:15:18Z (xem đính chính F-164-T0-1 §7 — nháp đầu ghi nhầm tuổi #65).
- Hệ quả: mọi watcher/process của đợt 163 đều đã chết theo #67 (xem §3 — watcher-163 vốn đã chết theo #66 từ trước); mọi timestamp wall trong đợt 164 đều thuộc boot mới.

## §2. KHÔNG có nghịch lý đồng hồ đợt này — btime 17:33:27Z LÀ giờ thật; KHÔNG OVERLAP #67/#66 dài; reboot KHÔNG rơi vào lúc T10-163 đóng sổ; RUN 163 KHÔNG BỊ REBOOT GIẾT

Khác hẳn #62 (xung đột 824 s, T10 phán OVERLAP), đợt này mọi bằng chứng đều nhất quán — **không có H1/H2 nào cần phán**:

### §2.1 Run 163 succeed TRƯỚC btime — bằng chứng DB quyết định (tin tốt nhất đợt này)

- Truy vấn chỉ-đọc `muse.db` (`scheduler.job_runs` + `scheduler.events`, job `vcut-build-loop`):
  - Run 163 `3f169faa-6a18-4615-b8ea-ac42d02d4e7c`: scheduled **14:35:51Z**, `started_at` **16:07:30Z** (viết lại sau reboot #66 — xem quyết (e)/(w) đợt 163), **`finished_at` 2026-11-21T17:18:13+00:00**, status **`succeeded`**, attempt 1, `worker_claimed_at_utc` 1795281485 (= 17:18:05Z), `worker_execution_timed_out` false. **Margin tới hạn 17:35:51Z: 1.058 s (17m38s)** — hẹp hơn run 162 (1.065 s) đúng 7 s; claimed→finished 8 s (trong họ 7–11 s).
  - Events run 163: **5 event** — `dispatched` eid 9756 lúc 14:35:51.145Z; `requeued_after_restart` eid 9781 lúc **16:07:30.460Z** (detail "daemon startup recovery" — viết lại lần 1 tại #66, đã biết từ T7-163); `dispatched` eid 9782 lúc 16:07:30.540Z; `reattached_after_restart` eid 9783 lúc 16:07:30.708Z; `succeeded` eid 9799 lúc **17:18:13.605Z**. **0 requeue sau succeeded, 0 event sau succeeded, 0 lần viết lại thêm** (chỉ 1 lần viết lại duy nhất tại #66).
  - Run 164 `0a5f9bc9-c4f4-4d68-96c7-f0baa5455606`: scheduled/started 17:35:51Z, status `running` (lúc đọc), `worker_boot_generation` mới.
- Lag T10-163 đóng cờ → run succeeded: `.done` mtime 17:16:37Z → succeeded 17:18:13Z = **96 s** — cùng họ với run 162 (87 s), run 159 (~89,7 s), run 160 (51 s), run 161 (44 s). Mẫu đứng giữ: run succeed ~1–1,5 phút sau khi T10 đóng cờ.
- **Suy luận:** worker của run 163 hoàn tất và báo cáo lúc **thật 17:18:13Z**, trước btime #67 (17:33:27Z) **15'14" (914 s)**. Lo ngại của parent lúc mở đợt ("reboot #67 144 s trước hạn run 163 — nguy cơ bị giết ngay trước hạn") **KHÔNG xảy ra**: run 163 đã succeed xong trước reboot, không bị giết, không bị viết lại thêm. Btime #67 là giờ thật trong sai số đồng hồ ±1 s (§6).
- Tiền đề như đợt 161/162/163: timestamp DB = giờ host thật, độc lập với đồng hồ cell (scheduler + Postgres host-side, ngoài cell VM).

### §2.2 Không OVERLAP dài: boot #66 chết trong (17:21:23Z, 17:33:27Z]

- **T10-163 đóng 17:16:37Z** (mtime file thực tế, nội dung cờ xác nhận boot lúc đóng là edb2acdb #66) — btime #67 muộn hơn **16'50"**. Claim "KHÔNG reboot mới trong lúc T10 đóng sổ" của T10-163 **ĐỨNG** (cùng mẫu #64: 4'23"; #65: 18'18").
- Hoạt động cuối cùng quan sát được trên #66: **aggregate đợt 163 mtime 17:20:48Z** (parent viết §12.3); hoạt động file cuối: **`build-loop-log.md` mtime 17:21:23Z**; `round163-t10.done` 17:16:37Z. DB host-side: run 163 succeeded 17:18:13Z (không phải hoạt động trên cell).
- **Cửa sổ overlap (17:33:27Z → 17:35:51Z): 0 file đổi trong `hidden_files`, 0 file đổi trong `repo-1`** (kiểm bằng `find -newermt` cả hai cây). Không có process/watcher/log nào của boot cũ viết gì sau btime.
- **Kết luận:** boot #66 chết trong khoảng (17:21:23Z, 17:33:27Z] — một reboot sạch giữa hai đợt, không phá lượt đo nào trong đợt 163. Không cần điều tra overlap như #62. Caveat: khoảng (17:21:23Z, 17:33:27Z] dài 12m04s là khoảng mù không có mốc file nào (watcher-163 đã chết theo #66 từ 16:06:54Z — xem §3), nhưng không có bằng chứng nào cho thấy boot cũ còn hoạt động trong khoảng đó; T2-164 kiểm mù #97? (#66) trên đoạn này.

### §2.3 Giao T2-164 / T7-164

- **T2-164:** dùng btime #67 **17:33:27Z giờ thật** trực tiếp làm mốc — không có hai khung giờ như #62, không cần chọn H1/H2. Mù #95? (#63) MỞ + #96? (#64) giao T2-164 theo quyết (dd) đợt 163 (gap #64 danh nghĩa 11.979 s làm cơ sở FULL110; lưu ý khoảng mù 14:25:21Z→14:34:57Z) + **#97? (#66) MỚI** (đoạn Q [16:06:45Z, 17:33:27Z] — lưu ý khoảng mù 17:21:23Z→17:33:27Z không có mốc file do watcher-163 chết theo #66; gap #66 danh nghĩa 5.202 s làm cơ sở FULL112 theo quyết (c) đợt 163). INSIDE chuỗi: tính #67 với btime thật 17:33:27Z (dải FULL112 neo 14:34:57Z — T2 kiểm #66 có INSIDE không, rồi #67; chuỗi mới bắt đầu từ #65, độ dài 1 theo quyết (c) đợt 163).
- **T7-164:** kết cục run 163 — T0 CHỈ dùng `finished_at` 17:18:13Z làm bằng chứng đồng hồ, KHÔNG phán verdict run 163 (margin, slot HB/DR thuộc T7-164). Lưu ý T7: **0 run đang chạy tại btime #67** (run 163 đã xong 17:18:13Z, run 164 dispatch 17:35:51Z sau btime 144 s), **0 requeue** quanh btime — T7 kiểm điểm (m) #67 với chữ ký này (cùng mẫu #52/#61/#64/#65 — cả bốn đều KHÔNG PHẢI điểm; khác #62: 1 run đang chạy tại btime → ứng viên điểm ÂM; khác #63/#66: requeue trong dải 33–49,8 s → ứng viên điểm DƯƠNG). T0 không phán (m) chính thức — chỉ ghi chữ ký. **Đối chiếu độc lập (m) #66 thuộc T2-164** (quyết (e) đợt 163 — T7-163 đã chốt ứng viên DƯƠNG, T2-164 đối chiếu).

## §3. Watcher: watcher-163 CHẾT THEO REBOOT #66 (đã xác nhận đợt 163); watcher-164 ĐÃ CHẠY lúc T0 đóng

- **Watcher-163 pid 25133 (T5-163, chạy từ 14:45:03Z trên boot #65): CHẾT THEO REBOOT #66 — nguyên nhân xác định được** (T10-163 phát hiện, parent quyết (x) đợt 163 GHI NHẬN).
  - Log `round163-t5/replay-watch-163.log`: poll cuối **16:06:54Z** (9 s sau btime #66 16:06:45Z, vẫn ghi nhãn boot cũ 1c1cf10c — poll cuối đua với reboot rồi chết), **0 END/0 STOP**; `pgrep` lúc T0 kiểm: 0 process. Không có file watcher-stop.
  - **Khác watcher-162 chết sớm không rõ nguyên nhân** (trước btime #65 9m37s): watcher-163 chết ĐÚNG theo reboot #66.
  - Khoảng không-watcher: 16:06:54Z → 17:40:59Z (**1h34m05s**) tới khi watcher-164 khởi động (xem dưới). Không mất đo nào được ghi nhận do khoảng trống này (T9-163 đã khởi động lại sampler bằng tay 16:08:20Z trên #66; T9-164 đã khởi động sampler trên #67).
- **Watcher-164 ĐANG CHẠY lúc T0 đóng:** pid 5451 `bash replay-watch-164.sh`, khởi động ~17:40:59Z (theo file `watcher-status-at-open.txt` của T5-164). T5-164 đã mở thư mục (`round164-t5/` có `make-watcher-164.py`, `replay-watch-164.sh/.log/.nohup.log`, `t5-stats-164.py`, `watcher-status-at-open.txt`). T5-164 sở hữu điều tra/vận hành watcher-164.
- **Lúc mở (~17:39Z): 0 watcher thật nào đang chạy** (watcher-164 khởi động 17:40:59Z, sau lúc T0 mở). Quét `ps` theo mẫu `replay-watch` lúc mở chỉ trả các process của luồng khác (T9-164 đang chuẩn bị sampler — không phải replay-watch).

## §4. POSTBOOT_PASS #65: CÒN (T5-163 sở hữu); #66 CHƯA CÓ lúc T0 đóng — đã kiểm lại ngay trước khi ghi cờ (bài học quyết (r) đợt 162 / quyết (n) đợt 163)

- Trên đĩa lúc đóng: **POSTBOOT_PASS #65 CÒN** — `round163-t5/POSTBOOT_PASS` (ghi 14:45:05Z, boot+10m08s, replay tự nhiên đầy đủ) + **POSTBOOT_PASS #64 CÒN** (`round162-t5/POSTBOOT_PASS`, ghi 11:40:00Z). Không có cờ nào cover #63 hay #66.
- **#63 KHÔNG CÓ** (boot thứ 7 lọt — quyết (n) đợt 163).
- **#66 CHƯA CÓ lúc T0 kiểm lại cuối 17:42:49Z** (kiểm ngay trước khi ghi cờ — rút kinh nghiệm quyết (r) đợt 162 / quyết (n) đợt 163: cờ T0-163 "CHƯA CÓ" stale 110 s vì T5 ghi cờ 14:45:05Z sau lúc T0 kiểm; lần này T0 kiểm lại lúc 17:42:49Z, chỉ vài chục giây trước khi đóng cờ, và T5-164 lúc đó đang ở bước thống kê (t5-stats-164.py đang chạy) — cờ #66 chưa thể xuất hiện trước khi T0 đóng; nếu T5-164 ghi cờ ngay sau đó thì cờ T0 vẫn đúng tại thời điểm kiểm, T5 là nguồn chính thức). **T5-164 xác nhận độc lập cùng kết luận** trong file `watcher-status-at-open.txt` ("POSTBOOT_PASS #66: CHƯA CÓ lúc mở — không file POSTBOOT_PASS* nào chứa edb2acdb trong hidden_files") — hai bên KHỚP, không có phân kỳ stale như đợt 163 (T0-163 vs T5-163).
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:40Z ngày 20/11 trên boot #48, mtime không đổi) — sống qua **19 reboot liên tiếp** #49–#67 (đếm độc lập: dải bao hàm 67 − 49 + 1 = 19; parent quyết (q) đợt 163 xác nhận 17 ĐÚNG tới #65; quyết (e) xác nhận #66 → 18; nay thêm #67 → 19. T0-164 KHÔNG lặp lỗi T0-162 ghi 15 thay vì 16).
- T0 KHÔNG chạy postboot check trong đợt này (task T0-164 không yêu cầu; T5-164 sở hữu postboot). Trạng thái postboot thực tế trên #66/#67 do T5-164 xác nhận.

## §5. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ T10-163/parent log, 21/21 ×3, boot #65)

Đối chiếu JSON T8-163 trong `hidden_files/round163-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 163 — T8-164 đã mở thư mục, xem §6):

| File | md5 (8 đầu) | Hồ sơ T10-163 | Nội dung kiểm bằng python |
|------|-------------|---------------|---------------------------|
| WebKit attempt1 `o8w-clicktest-report-2026-11-21T15-39-29-1c1cf10c-pid47668.json` | `d614173d…` ✓ | khớp | 21 results, 21 `ok=true`, boot 1c1cf10c |
| WebKit attempt2 `o8w-clicktest-report-2026-11-21T15-40-35-1c1cf10c-pid48104.json` | `44d90ffe…` ✓ | khớp | 21 results, 21 `ok=true`, boot 1c1cf10c |
| Chromium `o8-clicktest-report-2026-11-21T15-41-35-1c1cf10c-pid48557.json` | `931baeaf…` ✓ | khớp | 21 results, 21 `ok=true`, boot 1c1cf10c |
| `o8w-clicktest-report.json` (latest) | `44d90ffe…` = attempt2 ✓ | byte-identical với stamped cuối | — |
| `o8-clicktest-report.json` (latest) | `931baeaf…` ✓ | byte-identical với stamped cuối | — |

Cây md5 lúc mở khớp đúng hồ sơ T10-163 lúc đóng (không đổi ngoài ý muốn):

| File (đường dẫn thật) | md5 (8 đầu) |
|------------------------|-------------|
| `apps/web/src/preview.tsx` | `530e10a7` ✓ |
| `apps/web/src/media.ts` | `2c384ed1` ✓ |
| `apps/web/vite.config.ts` | `ee80d093` ✓ |
| `server/render/src/effects.js` | `fedc0141` ✓ |

- O8 JSON đợt 163 thuộc boot #65 (1c1cf10c) — nay boot đã là #67 ứng viên, nhưng file JSON không đổi: T0 chỉ xác minh tính toàn vẹn, không chạy lại O8.
- Gate FOUND đợt 163 (theo T10-163/aggregate §8 + quyết (g) đợt 163): O8 chạy 15:39:29Z, SAU lượt yên hợp lệ #28 (14:59:01–15:03:10Z) về thời gian, TRÊN CÙNG BOOT #65, gate FOUND chuẩn lần thứ sáu liên tiếp, O8 WebKit chạy bằng lib DEBROOT trên cùng boot đo (harness trên cùng boot đo chạy bằng system libs — đính chính nhãn quyết (g) đợt 162) — **chuỗi WebKit FULL PASS LÊN 18** (parent quyết cuối, quyết (g) đợt 163).

## §6. O8 live: KHÔNG chạy — theo quy ước đợt 162/163, T8-164 sở hữu O8 chính thức; lượt yên đợt 164 CHƯA CÓ kết quả lúc T0 đóng

- Task T0-164 yêu cầu **chạy/đối chiếu O8 theo quy ước đợt 162/163** — quy ước đó là **check-only** (T0-162 §6: T0 kiểm tĩnh JSON, T8 sở hữu O8 live; T0 không chạy vite/playwright để tránh va chạm cổng/lock với T8). T0-164 giữ nguyên quy ước: chỉ đối chiếu tĩnh §5, không chạy O8 live.
- T8-164 đã mở thư mục (`round164-t8/` tồn tại lúc T0 đóng). T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với T8-164. T9-164 cũng đã mở thư mục và đang chạy sampler (T9 sở hữu).
- **Lượt yên đợt 164: CHƯA CÓ kết quả lúc T0 đóng.** T4-164 đã mở thư mục; **0 cờ `.done` nào của đợt 164 tồn tại lúc T0 đóng** (T0 là cờ đầu tiên). T0 KHÔNG tự kết luận chuỗi WebKit FULL PASS — chỉ đề xuất sau khi có kết quả T4-164 + O8 T8-164; **parent quyết cuối** (quy tắc đứng: chuỗi chỉ lên khi CÓ lượt yên hợp lệ trong đợt + O8 chạy sau về thời gian TRÊN CÙNG BOOT đo + gate FOUND chuẩn).
- Đồng hồ wall cell lúc mở đợt 164: **CHUẨN (±1 s so với Cloudflare)**:

| Lần đo | Local (bracket) | Cloudflare Date | Đọc |
|--------|----------------|-----------------|-----|
| ~17:39Z (curl try0) | epoch 1795282791,37–1795282791,86 | 17:39:52 GMT, epoch 1795282792 (+0,14 đến +0,63 s so với bracket — trong độ trễ request) | local ≈ Cloudflare |
| ~17:39Z (curl try1) | epoch 1795282791,86–1795282792,41 | 17:39:52 GMT, epoch 1795282792 (cùng giây CF) | local ≈ Cloudflare |

- **Cảnh báo phương pháp (lặp lại từ đợt 158/159/160/161/162/163):** GitHub Date header dao động giữa các edge server — **không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-164 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên.
- Uptime math khớp btime tới 0,32 s (3 lần đọc §1, boot_est .32 — btime là floor của giây boot). Journal boot mới đơn điệu: 82 entry, 0 bước nhảy âm, gap lớn nhất 69,79 s (timer 1 phút, bình thường), 0 gap >120 s — không có dấu hiệu sửa đồng hồ sau boot.
- **Độ lệch nhỏ ghi nhận (không phải nghịch lý):** journal first entry +14 s và `/proc/1` +13,95 s sau btime — cùng họ mẫu +11/+14/+15 s của #61/#62/#64/#65, mọi nguồn khác khớp btime; không có xung đột nào cần phán H1/H2.
- `/tmp/.X11-unix/` **TRỐNG** lúc T0 mở (~17:39Z, 0 socket — T8-163 đã dọn 3 socket X193/X194/X195 đợt trước; không socket mới nào xuất hiện).

## §7. Sai số của chính mình (F-164-T0-n)

- **F-164-T0-1 — ĐÃ SỬA NHÁP: tuổi boot #64/#65 ghi nháp sai trong §1 (lần đầu viết LIMITS).** Nháp ban đầu ghi "#64 sống 11.979 s; #65 sống 11.979 s" — SAI: #65 sống 14:34:57Z→16:06:45Z = **5.508 s** (quyết (dd) đợt 163 đã ghi đúng 5.508 s); #64 sống 11:15:18Z→14:34:57Z = **11.979 s** đúng. Bắt được khi đối chiếu quyết (dd) đợt 163 trước khi đóng cờ; đã sửa trong bản cuối §1. Bài học: tuổi boot nào cũng tính lại bằng phép trừ epoch, không chép từ trí nhớ.
- **F-164-T0-2 — `find` toàn cây repo-1 chậm (~90 s) + exit code nhiễu (lặp lại F-163-T0-2):** hai lần `find` quét repo-1 làm lệnh nền kéo dài ~90 s; không ảnh hưởng số liệu (cả hai lần `find -newermt` đều trả đủ kết quả). Bài học giữ nguyên: tách lệnh kiểm tra cờ ra khỏi chuỗi `find` dài (đã tách — kiểm `.done` chạy riêng, nhanh).
- **F-164-T0-3 — ĐÃ TRÁNH lỗi làm tròn uptime (F-162-T0-5/F-163-T0-3):** chỉ dùng 3 lần đọc bracket bằng python có phần thập phân cho phép toán uptime−epoch (boot_est 1795282407,32 cả 3 lần); không dùng `date +%s` nguyên giây cho phép toán này.
- **F-164-T0-4 — ĐÃ TRÁNH grep toàn cây (F-160-T0-3/F-163-T0-4):** kiểm POSTBOOT_PASS #66 chỉ bằng `ls` thư mục có mục tiêu + `find -maxdepth 2 -name POSTBOOT_PASS*` (không quét toàn cây `hidden_files/`); kết quả khớp file trạng thái của T5-164.
- **F-164-T0-5 — ĐÃ TRÁNH đếm marker sai (quyết (q) đợt 162 / quyết (q) đợt 163):** đếm độc lập dải bao hàm 67 − 49 + 1 = 19, đối chiếu với quyết (q) 17 tới #65 + quyết (e) #66 → 18 — không cộng dồn bằng trí nhớ.
- **F-164-T0-6 — Lệnh kiểm POSTBOOT_PASS lần đầu chạy sai cwd (tương đối):** lệnh `ls round163-t5/POSTBOOT_PASS` trong exec thứ hai chạy từ `/home/hatch` nên báo "No such file" — KHÔNG phải file mất; kiểm lại bằng đường dẫn tuyệt đối: cả hai file đều CÒN. Bài học: trong exec, luôn dùng đường dẫn tuyệt đối cho file ngoài cwd.
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung. Không ghi vào `build-loop-log.md` (theo tiền lệ T0-161/T0-162/T0-163 — log lượt thuộc về T10-164 khi tổng hợp, tránh ghi chồng chéo với 8–10 luồng cùng lúc).

## §8. Bàn giao / nợ mở đợt 164

1. **Parent:** xác nhận số hiệu reboot ứng viên **#67** (boot f1d4ce1a, btime 17:33:27Z giờ thật) — T0 chỉ ghi ứng viên, chưa phải số hiệu chính thức.
2. **T10-164:** lưu ý (a) **KHÔNG có nghịch lý đồng hồ đợt này** — khác #62, không cần phán H1/H2/OVERLAP; btime #67 dùng trực tiếp; (b) claim "KHÔNG reboot mới trong lúc T10 đóng sổ" của T10-163 **ĐỨNG** (reboot sau khi đóng 16'50"); (c) **run 163 SUCCEEDED 17:18:13Z, margin 1.058 s — KHÔNG bị reboot #67 giết** (lo ngại lúc mở đợt không xảy ra); lag .done→succeeded 96 s; (d) **watcher-163 chết theo reboot #66** (đã xác nhận đợt 163); **watcher-164 ĐÃ CHẠY** (pid 5451, ~17:40:59Z); khoảng không-watcher 1h34m05s; (e) marker **19 reboot #49–#67** (đếm độc lập, không lặp lỗi T0-162); (f) dpkg.log reset theo boot lần thứ tư liên tiếp (#62, #64, #65, #67) — hoạt động dpkg đầu boot+137s, 7 s trước giờ dispatch đợt, vẫn chỉ 2 dòng lúc T0 đóng (T5-164 sở hữu diễn giải replay).
3. **T2-164:** mù #77?/#88?/#94?/#95? + **#96? (#64)** + **#97? (#66) MỚI** (đoạn Q [16:06:45Z, 17:33:27Z]; lưu ý khoảng mù 17:21:23Z→17:33:27Z không có mốc file do watcher-163 chết theo #66; gap #66 danh nghĩa 5.202 s làm cơ sở FULL112) + INSIDE chuỗi (dùng btime thật 17:33:27Z — dải FULL112 neo 14:34:57Z: kiểm #66 có INSIDE không, rồi #67; chuỗi mới bắt đầu từ #65, độ dài 1) + mô hình đồng hồ — dữ liệu mới §2 + §6 (local ≈ Cloudflare ±1 s; journal +14 s, /proc/1 +13,95 s cùng họ mẫu) + **đối chiếu độc lập (m) #66** (quyết (e) đợt 163; T7-163 chốt ứng viên DƯƠNG, n ứng viên 20→21 nhánh khuyến nghị) + **cập nhật n 19/20 → 20/21 trong LIMITS mới** (quyết (z) đợt 163 — F-163-T1-5).
4. **T5-164:** viết POSTBOOT_PASS #66 (chưa có cờ lúc T0 đóng 17:42:49Z) + vận hành watcher-164 (đã chạy pid 5451) + theo dõi replay #67 (dpkg 2 dòng, md5 f7336062 — burst chưa tăng lúc T0 đóng).
5. **T7-164:** kết cục run 163 (run SUCCEEDED 17:18:13Z theo DB — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ: margin 1.058 s, 1 lần viết lại duy nhất tại #66, slot HB/DR) + điểm (m) #67 (0 run đang chạy tại btime, 0 requeue — chữ ký #52/#61/#64/#65; T7 phán chính thức, T2 đối chiếu).
6. **T8-164:** O8 chính thức (đã mở thư mục; T0 chỉ kiểm tĩnh §5, không chạy song song) + checklist (o) + H3 chỉ giám sát thụ động + X11 (đang TRỐNG).
7. **T6-164:** prune lần 39.
8. **T10-164:** tổng hợp — lưu ý chuỗi WebKit FULL PASS đang ở **18** theo quyết (g) đợt 163; chuỗi chỉ lên 19 khi T4-164 có lượt yên hợp lệ trong đợt + O8 T8-164 chạy sau về thời gian TRÊN CÙNG BOOT #67 + gate FOUND chuẩn — **T0 không tự kết luận, parent quyết cuối**.

## §9. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND164_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round164-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t0/NOTES.md` (số liệu thô: btime/uptime/journal/wtmp, Cloudflare brackets, watcher-log, DB query run 163/164).
