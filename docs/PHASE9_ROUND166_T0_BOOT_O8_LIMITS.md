# PHASE9 ROUND 166 — T0: Boot survey + O8 JSON (REBOOT #70 ĐÃ XÁC NHẬN ĐẦY ĐỦ 9 NGUỒN — parent quyết (d) đợt 165 đã XÁC NHẬN số hiệu #70; T10-165 chỉ xác minh btime+uptime+boot_id, T0-166 xác minh đầy đủ; btime 22:05:25Z LÀ GIỜ THẬT — KHÔNG CÓ NGHỊCH LÝ ĐỒNG HỒ; KHÔNG reboot mới kể từ khi T10-165 đóng sổ; RUN 165 SUCCEEDED 23:19:29Z theo DB — KẾT CỤC THUỘC T7-166; O8 check-only, T8-166 sở hữu O8 chính thức)

- Lượt cron 06:35 +07 22/11/2026 = 23:35:51Z 21/11/2026. T0 mở ~23:38Z, đóng ~23:42Z.
- Hạn cờ ~02:00Z 22/11, hạn cứng đóng đợt 02:30Z 22/11/2026. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS, không chạy O8 live.

## §1. Kết luận boot: KHÔNG có reboot mới — boot lúc mở là #70 (d1ddd946), btime 1795298725 = 22:05:25Z (9 nguồn khớp, KHÔNG nghịch lý như #62)

Boot lúc mở **GIỐNG** boot lúc T10-165 đóng: **d1ddd946, btime 1795298725 = 22:05:25Z** — KHÔNG có reboot mới kể từ khi T10-165 đóng sổ (~23:2xZ). 9 nguồn đều khớp btime (bảng dưới):

| # | Nguồn | Giá trị | Khớp btime? |
|---|-------|---------|-------------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156) | `1795298725` = 22:05:25Z | ✓ |
| 2 | `boot_id` (`/proc/sys/kernel/random/boot_id`) | `d1ddd946-f9f3-4561-86e8-5eb3edceb6cc` | ✓ (mở và đóng cùng boot — KHÔNG reboot trong phiên T0) |
| 3 | `uptime` chính xác (`/proc/uptime`, 3 lần đọc bracket) | 5615,54 s lúc epoch 1795304341,44 → boot 1795298725,90; 5616,54 s lúc 1795304342,44 → 1795298725,90; 5617,54 s lúc 1795304343,44 → 1795298725,90 (cả 3 lần giống nhau tới 0,01 s, khớp btime tới 0,90 s) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 22:05:37Z (journal start lag +12 s sau btime — cùng họ mẫu #61/#62/#64/#65/#67/#69 (+11/+14/+15 s); xem §6); `--list-boots` chỉ còn 1 boot (journal không giữ boot cũ — hạn chế lặp lại các đợt trước) | ✓ |
| 5 | wtmp / `last reboot` | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Sat Nov 21 22:05 still running`; `wtmp begins Sat Nov 21 22:05:37 2026` | ✓ |
| 6 | `/proc/1` start | 22:05:36Z (+11 s sau btime — cùng họ với journal +12 s; xem §6) | ✓ |
| 7 | Mốc thời gian T10-165 đóng (mốc file thực tế) | `round165-t8.done` mtime **21:42:50Z** (hoạt động cuối trên #69 trước btime); dpkg.log entry đầu **22:06:03Z** = boot+38s (hoạt động đầu trên #70); `round165-t9.done` 22:57:37Z, `round165-t7.done` 23:11:15Z, `round165-t10.done` 23:18:20Z — đều SAU btime (ghi đóng sổ trên #70); KHÔNG file `.done` nào có mtime trong (21:42:50Z, 22:05:25Z] — xem §2 | ✓ |
| 8 | Scheduler DB host-side (`muse.db`, `scheduler.job_runs` + `scheduler.events`) | Run 165 `succeeded` **23:19:29Z** (sau btime 1h14m04"); requeue lần 1 lúc **22:06:03.729Z** (btime +38,729 s); run 166 `running` từ 23:35:51Z trên `worker_boot_generation` mới `cron_boot_0c78cfc1…` so với run 164 (`cron_boot_8818a1d1…`) | ✓ |
| 9 | Đồng hồ wall lúc mở vs Cloudflare | local ≈ Cloudflare ±1 s lúc ~23:39Z (2 lần đo curl, xem §6) | ✓ |

- **Số hiệu: #70 — ĐÃ ĐƯỢC parent XÁC NHẬN ở quyết (d) đợt 165** (T7 xác minh 9 nguồn trong phiên; T0-166 xác minh đầy đủ 9 nguồn độc lập lần này — KHỚP). T0 ghi số hiệu chính thức, không còn ứng viên.
- `dmesg` KHÔNG thử đọc đợt này (EPERM các đợt trước — không tính làm nguồn; 9 nguồn trên đã đủ, không cần dmesg).
- **dpkg.log (nguồn phụ): reset theo boot lần thứ SÁU liên tiếp (#62, #64, #65, #67, #69, #70)** — 1.545 dòng (cùng số dòng với #69) nhưng md5 ĐỔI `b9d79ebc` → `5f29561e` — KHÔNG phải bất thường: burst #70 viết lại toàn bộ trong 22:06:03–22:08:08 (hoạt động đầu boot+38s, cuối boot+163s, gói cuối gstreamer1.0-tools — cùng số dòng + gói cuối với #69, burst #69 là boot+35s→boot+167s, 132 s; burst #70 dài 125 s). T5-166 sở hữu diễn giải; T0 chỉ giao số liệu thô, không suy đoán cơ chế.
- Tuổi boot: **#69 sống 6.954 s (1h55m54s)** = 22:05:25Z − 20:09:31Z; **#68 sống 7.381 s (2h03m01s)** = 20:09:31Z − 18:06:30Z (kiểm lại khớp T10-165); **#67 sống 1.983 s** = 18:06:30Z − 17:33:27Z. Gap #69→#70 = **6.954 s** (kiểm lại khớp T7-165/T10-165).
- Hệ quả: mọi watcher/process của đợt 165 trước 22:05:25Z đều đã chết theo #70 (watcher-165 chết theo #70 — đã xác nhận đợt 165); mọi timestamp wall trong đợt 166 đều thuộc boot #70.

## §2. KHÔNG có nghịch lý đồng hồ đợt này — btime 22:05:25Z LÀ giờ thật; KHÔNG OVERLAP #70/#69 dài; RUN 165 SUCCEEDED 23:19:29Z theo DB — KẾT CỤC THUỘC T7-166

Khác hẳn #62 (xung đột 824 s, T10 phán OVERLAP), đợt này mọi bằng chứng đều nhất quán — **không có H1/H2 nào cần phán**:

### §2.1 Run 165 SUCCEEDED 23:19:29Z theo DB — bằng chứng DB quyết định (T0 CHỈ ghi số liệu thô, KHÔNG phán verdict)

- Truy vấn chỉ-đọc `muse.db` (`scheduler.job_runs` + `scheduler.events`, job `vcut-build-loop`), đọc lúc ~23:40Z:
  - Run 165 `b548ba36-77b6-4c4c-bd77-351472631ecd`: scheduled **20:35:51Z**, `started_at` **22:06:03Z** (sau viết lại lần 1 tại #70), **`finished_at` 2026-11-21T23:19:29+00:00**, status **`succeeded`** (lúc đọc), attempt 1, `worker_claimed_at_utc` 1795303161 (23:12:41Z — claim lại sau viết lại), `worker_execution_timed_out` false. **Margin thô tới hạn 23:35:51Z: 982 s (16m22s)** — số thô, T7-166 phán.
  - Events run 165: **5 event** — `dispatched` eid 9846 lúc 20:35:51.084Z; **`requeued_after_restart` eid 9868 lúc 22:06:03.729Z** (detail "daemon startup recovery" — **viết lại lần 1 tại #70, btime #70 +38,729 s — TRONG dải dương [33; 49,8]**, khớp T7-165); `dispatched` eid 9869 lúc 22:06:03.819Z; `reattached_after_restart` eid 9870 lúc 22:06:03.941Z; **`succeeded` eid 9886 lúc 23:19:29.876Z**. **0 event sau succeeded** (lúc đọc).
  - Run 166 `5c969404-8c41-459b-be58-3a90bdda104e`: scheduled/started 23:35:51Z, status `running` (lúc đọc), `worker_boot_generation` `cron_boot_0c78cfc13f7c4db582ace9d4fda24018` — **cùng generation với run 165 sau #70** (khác run 164 `cron_boot_8818a1d1deaf441d8a1753824996f191`).
  - Run 164: `succeeded` 20:28:17Z (khớp T0-165/T7-165 — không đổi).
- **Suy luận duy nhất T0 được phép:** worker của run 165 báo cáo succeed lúc **thật 23:19:29Z**, sau btime #70 (22:05:25Z) **1h14m04" (4.444 s)**, trước hạn đợt 166 (23:35:51Z) 982 s. T7-165 đóng cờ 23:11:15Z với run 165 vẫn `running` — claim "chưa có kết cục" ĐÚNG lúc đóng; run finish 23:19:29Z, 8m14s sau khi T7 đóng cờ. **T0 KHÔNG phán** kết cục run 165, margin chính thức, hay điểm (m) #70 — tất cả thuộc T7-166 (kết cục) và T2-166 (đối chiếu độc lập (m) #70). Btime #70 là giờ thật trong sai số đồng hồ ±1 s (§6).
- Tiền đề như đợt 161/162/163/164/165: timestamp DB = giờ host thật, độc lập với đồng hồ cell (scheduler + Postgres host-side, ngoài cell VM).

### §2.2 Không OVERLAP dài: boot #69 chết trong (21:42:50Z, 22:05:25Z] theo mốc file — cửa sổ RỘNG HƠN #69, ghi nhận trung thực

- **Hoạt động cuối cùng quan sát được trên #69: `round165-t8.done` mtime 21:42:50Z.** Hoạt động đầu tiên trên #70: journal first entry 22:05:37Z (+12 s), dpkg.log entry đầu 22:06:03Z (boot+38s).
- **Cửa sổ chết của #69 theo mốc file: (21:42:50Z, 22:05:25Z] — dài 22m35s, RỘNG HƠN NHIỀU so với cửa sổ 2 s của #69 đợt 165** (đợt 165 có t8.done 20:09:29Z, chỉ 2 s trước btime #69). Lý do: không có thread nào của đợt 165 ghi file trong 22m35s trước btime #70 (T8 đóng 21:42:50Z; T9/T7/T10 đóng sau btime, trên #70). Đây là giới hạn của bằng chứng mốc file đợt này — T0 ghi nhận trung thực, KHÔNG thu hẹp cửa sổ bằng suy đoán.
- **Bù lại, btime được neo CHẶT bằng 8 nguồn còn lại** (uptime bracket khớp tới 0,90 s; journal +12 s; /proc/1 +11 s; wtmp 22:05; DB requeue +38,729 s; Cloudflare ±1 s) — không có xung đột nào cần phán H1/H2. Không cần điều tra overlap như #62.
- Caveat: khoảng (21:42:50Z, 22:05:25Z] chỉ là cửa sổ mốc file — reboot thật có thể xảy ra bất cứ lúc nào trong đó theo riêng nguồn này; các nguồn khác neo btime ở 22:05:25Z.

### §2.3 Giao T2-166 / T7-166

- **T2-166:** dùng btime #70 **22:05:25Z giờ thật** trực tiếp làm mốc — không có hai khung giờ như #62, không cần chọn H1/H2. Mù #77?/#88?/#94?/#95?/#96? giữ nguyên theo quyết đợt 165 + INSIDE cho #70 (dải FULL116 neo 20:09:31Z — giao đợt 165) + mô hình đồng hồ — dữ liệu mới §2 + §6 (local ≈ Cloudflare ±1 s; journal +12 s, /proc/1 +11 s cùng họ mẫu) + **đối chiếu độc lập (m) #70** (requeue +38,729 s ∈ [33; 49,8] — parent quyết (n) đợt 165 đã CHẤP NHẬN #70 là ứng viên DƯƠNG, đối chiếu độc lập thuộc T2-166; nếu chấp nhận cả #68+#69+#70: n ứng viên 21→24 nhánh khuyến nghị hoặc 22→25 nhánh #56 ÂM — T2 tính lại, T0 không phán) + ghi chú đứng về dải (m) 33–49,8 s theo offset btime-tương đối (quyết (e) đợt 165 — T2-166 ghi vào LIMITS).
- **T7-166:** kết cục run 165 (DB ghi `succeeded` 23:19:29Z, 5 event, 1 lần viết lại — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ: margin 982 s thô, slot HB/DR) + điểm (m) #70 (requeue +38,729 s trong dải; T7 phán chính thức, T2 đối chiếu). Lưu ý T7: run 165 ĐANG CHẠY tại btime #70 nên mới bị viết lại lần 1 (cùng mẫu #69: run 164 đang chạy tại btime #69; khác #67: 0 run đang chạy).

## §3. Watcher: watcher-165 CHẾT THEO REBOOT #70 (đã xác nhận đợt 165); watcher-166 CHƯA khởi động lúc T0 đóng

- **Watcher-165 pid 28592 (T5-165, chạy từ 20:43:49Z trên boot #69): CHẾT THEO REBOOT #70** (T9-165 phát hiện sau khi T5 đóng cờ; T10-165 phán (vii) ghi nhận, không mâu thuẫn T5/T9 — chỉ khác thời điểm kiểm).
- **Watcher-166 CHƯA khởi động lúc T0 đóng:** 0 process `replay-watch` đang chạy lúc T0 kiểm (~23:38–23:40Z); thư mục `round166-t5/` chưa tồn tại (T5-166 chưa mở). T5-166 sở hữu vận hành watcher-166 + POSTBOOT_PASS #70.
- `ps` lúc kiểm thấy `b2-watcher.sh` pid 15254 chạy từ 23:38Z — không phải replay-watch (ghi nhận thô, T0 không diễn giải — cùng mẫu T0-165: b2-watcher của T9-166).
- Khoảng không-watcher: từ khi watcher-165 chết theo #70 (22:05:25Z) tới khi watcher-166 khởi động — T5-166 đo chính xác.

## §4. POSTBOOT_PASS #69: CÒN (T5-165 sở hữu); #67 CÒN; #63/#66/#68 KHÔNG CÓ + #70 CHƯA CÓ lúc T0 đóng — đã kiểm lại ngay trước khi ghi cờ (bài học quyết (r) đợt 162 / quyết (n) đợt 163)

- Trên đĩa lúc đóng: **POSTBOOT_PASS #69 CÒN** — `round165-t5/POSTBOOT_PASS` (chứa boot 9a1a9319, ghi 20:43:50Z, replay đầy đủ — T10-165 xác minh độc lập) + **POSTBOOT_PASS #67 CÒN** (`round164-t5/POSTBOOT_PASS`, boot f1d4ce1a, btime 17:33:27Z, ghi 17:54:38Z) + **POSTBOOT_PASS #65 CÒN** (`round163-t5/POSTBOOT_PASS`).
- **#63 KHÔNG CÓ** (boot thứ 7 lọt — quyết (n) đợt 163).
- **#66 KHÔNG CÓ** (boot thứ 8 không cờ — quyết đợt 164; không bù được).
- **#68 KHÔNG CÓ** (boot thứ 9 không cờ — quyết (j) đợt 165; không bù được).
- **#70 CHƯA CÓ lúc T0 kiểm lại cuối ~23:40Z** (kiểm ngay trước khi ghi cờ — rút kinh nghiệm quyết (r) đợt 162 / quyết (n) đợt 163; T5-166 chưa mở thư mục nên cờ chưa thể xuất hiện trước khi T0 đóng; nếu T5-166 ghi cờ ngay sau đó thì cờ T0 vẫn đúng tại thời điểm kiểm, T5 là nguồn chính thức).
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:47Z ngày 20/11 trên boot #48, mtime không đổi) — sống qua **22 reboot liên tiếp** #49–#70 (đếm độc lập: dải bao hàm 70 − 49 + 1 = 22; T0-165 đếm 21 tới #69, thêm #70 = 22. T0-166 KHÔNG lặp lỗi T0-162 ghi 15 thay vì 16).
- T0 KHÔNG chạy postboot check trong đợt này (task T0-166 không yêu cầu; T5-166 sở hữu postboot). Trạng thái postboot thực tế trên #70 do T5-166 xác nhận.

## §5. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ T10-165, 21/21 ×3, boot #69)

Đối chiếu JSON T8-165 trong `hidden_files/round165-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 165 — T8-166 đã mở thư mục, xem §6):

| File | md5 (8 đầu) | Hồ sơ T10-165 | Nội dung kiểm bằng python |
|------|-------------|---------------|---------------------------|
| WebKit attempt1 `o8w-clicktest-report-2026-11-21T21-08-19-9a1a9319-pid44847.json` | `89e8a951…` ✓ | khớp | 21 results, 21 `ok=true`, boot 9a1a9319 |
| WebKit attempt2 `o8w-clicktest-report-2026-11-21T21-09-14-9a1a9319-pid45253.json` | `6c69e20c…` ✓ | khớp | 21 results, 21 `ok=true`, boot 9a1a9319 |
| Chromium `o8-clicktest-report-2026-11-21T21-10-03-9a1a9319-pid45710.json` | `36d64280…` ✓ | khớp | 21 results, 21 `ok=true`, boot 9a1a9319 |
| `o8w-clicktest-report.json` (latest) | `6c69e20c…` = attempt2 ✓ | byte-identical với stamped cuối | — |
| `o8-clicktest-report.json` (latest) | `36d64280…` ✓ | byte-identical với stamped cuối | — |

Cây md5 lúc mở khớp đúng hồ sơ T10-165 lúc đóng (không đổi ngoài ý muốn):

| File (đường dẫn thật) | md5 (8 đầu) |
|------------------------|-------------|
| `apps/web/src/preview.tsx` | `530e10a7` ✓ |
| `apps/web/src/media.ts` | `2c384ed1` ✓ |
| `apps/web/vite.config.ts` | `ee80d093` ✓ |
| `server/render/src/effects.js` | `fedc0141` ✓ |

- O8 JSON đợt 165 thuộc boot #69 (9a1a9319) — nay boot đã là #70, nhưng file JSON không đổi: T0 chỉ xác minh tính toàn vẹn, không chạy lại O8.
- Chuỗi WebKit FULL PASS đang ở **19** theo quyết (b) đợt 165 (parent XÁC NHẬN LÊN 19); T0 không tự kết luận chuỗi đợt 166 — parent quyết cuối sau khi có kết quả T4-166 + O8 T8-166 (quy tắc đứng: chuỗi chỉ lên khi CÓ lượt yên hợp lệ trong đợt + O8 chạy sau về thời gian TRÊN CÙNG BOOT đo + gate FOUND chuẩn).

## §6. O8 live: KHÔNG chạy — theo quy ước đợt 162/163/164/165, T8-166 sở hữu O8 chính thức; lượt yên đợt 166 CHƯA CÓ kết quả lúc T0 đóng

- Task T0-166 yêu cầu **chạy/đối chiếu O8 theo quy ước đợt 162/163/164/165** — quy ước đó là **check-only** (T0-162 §6: T0 kiểm tĩnh JSON, T8 sở hữu O8 live; T0 không chạy vite/playwright để tránh va chạm cổng/lock với T8). T0-166 giữ nguyên quy ước: chỉ đối chiếu tĩnh §5, không chạy O8 live.
- T8-166 đã mở thư mục (`round166-t8/` tồn tại lúc T0 đóng). T9-166 cũng đã mở thư mục (b2-watcher.sh pid 15254 chạy từ 23:38Z — T9 sở hữu). T1/T2/T4/T6/T7-166 cũng đã mở thư mục. T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với T8-166.
- **Lượt yên đợt 166: CHƯA CÓ kết quả lúc T0 đóng.** T4-166 đã mở thư mục; **0 cờ `.done` nào của đợt 166 tồn tại lúc T0 đóng** (T0 là cờ đầu tiên). T0 KHÔNG tự kết luận chuỗi WebKit FULL PASS — chỉ đề xuất sau khi có kết quả T4-166 + O8 T8-166; **parent quyết cuối**.
- Đồng hồ wall cell lúc mở đợt 166: **CHUẨN (±1 s so với Cloudflare)**:

| Lần đo | Local (bracket) | Cloudflare Date | Đọc |
|--------|----------------|-----------------|-----|
| ~23:39Z (curl try0) | epoch 1795304371,76–1795304372,19 | 23:39:33 GMT, epoch 1795304373 (CF trước local +0,81 đến +1,24 s so với bracket — trong độ trễ request + cắt giây) | local ≈ Cloudflare |
| ~23:39Z (curl try1) | epoch 1795304373,19–1795304373,68 | 23:39:34 GMT, epoch 1795304374 (CF trước local +0,32 đến +0,81 s) | local ≈ Cloudflare |

- **Cảnh báo phương pháp (lặp lại từ đợt 158/159/160/161/162/163/164/165):** GitHub Date header dao động giữa các edge server — **không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-166 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên. Caveat: CF Date cắt tới giây nên biên trên của try0 (+1,24 s) chứa thành phần cắt giây; cả hai lần đo đều nhất quán với local chậm hơn Cloudflare ~0,7 s (cùng họ T0-165: try1 +1,26 s).
- Uptime math khớp btime tới 0,90 s (3 lần đọc §1, boot_est .90 cả 3 lần); btime là floor của giây boot — 0,90 s nằm trong 1 s làm tròn, không phải lệch. Journal boot mới đơn điệu: 330 entry, 0 bước nhảy âm, gap lớn nhất 69,87 s (timer 1 phút, bình thường — trùng đúng 69,87 s của #69), 0 gap >120 s — không có dấu hiệu sửa đồng hồ sau boot.
- **Độ lệch nhỏ ghi nhận (không phải nghịch lý):** journal first entry +12 s và `/proc/1` +11 s sau btime — cùng họ mẫu +11/+14/+15 s của #61/#62/#64/#65/#67/#69, mọi nguồn khác khớp btime; không có xung đột nào cần phán H1/H2.
- `/tmp/.X11-unix/` **TRỐNG** lúc T0 mở (~23:38Z, 0 socket — 3 socket X193/X194/X195 của T5-165 đã bị reboot #70 xóa; không socket mới nào xuất hiện trên #70).
- **dpkg.log (ghi nhận thô cho T5-166):** reset theo boot lần thứ sáu liên tiếp (#62, #64, #65, #67, #69, #70) — **1.545 dòng, md5 `5f29561e` (ĐỔI so với `b9d79ebc` của #69 — do burst #70 viết lại, không phải bất thường)**, toàn bộ trong 22:06:03–22:08:08 (125 giây distinct); hoạt động đầu 22:06:03Z = **boot+38s**, cuối 22:08:08Z = **boot+163s**, gói cuối `gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2`. Cùng số dòng (1.545) + gói cuối với replay #69 (md5 `b9d79ebc`) nhưng burst #70 hoàn thành trong ~2m05s thay vì ~2m32s như #69 — nhanh hơn một chút; T5-166 sở hữu diễn giải (T0 không suy đoán cơ chế). Burst đã xong trước khi T0 mở (23:38Z).

## §7. Sai số của chính mình (F-166-T0-n)

- **F-166-T0-1 — Gõ sai epoch btime #68 trong phép kiểm nháp (1795290390 thay vì 1795284390).** Phép kiểm phụ trong script python đầu dùng sai epoch → gap #68→#69 ra 1.381 s (sai). Bắt được ngay (lệnh `date -d @1795290390` trả 19:46:30Z ≠ 18:06:30Z), tính lại đúng: btime #68 = 1795284390 = 18:06:30Z, gap #68→#69 = 7.381 s ✓. Không có output nào đã ghi bị ảnh hưởng (gap #69→#70 = 6.954 s tính từ hai btime đúng ngay từ đầu). Bài học: epoch nào cũng verify bằng `date -d` trước khi dùng làm số hạng.
- **F-166-T0-2 — Lệnh kiểm cuối exit 2 do `ls round166-*.done` không có file nào.** Không phải lỗi kiểm tra — 0 cờ đợt 166 lúc T0 đóng là kết quả đúng (T0 là cờ đầu tiên). Ghi nhận để T10-166 khỏi nhầm là lỗi lệnh (cùng họ F-165-T0-2).
- **F-166-T0-3 — ĐÃ TRÁNH lỗi làm tròn uptime (F-162-T0-5/F-163-T0-3/F-164-T0-3/F-165-T0-3):** chỉ dùng 3 lần đọc bracket bằng python có phần thập phân cho phép toán uptime−epoch (boot_est 1795298725,90 cả 3 lần); không dùng `date +%s` nguyên giây cho phép toán này.
- **F-166-T0-4 — ĐÃ TRÁNH grep toàn cây (F-160-T0-3/F-163-T0-4/F-164-T0-4/F-165-T0-4):** kiểm POSTBOOT_PASS #68/#70 chỉ bằng `ls` thư mục có mục tiêu + `find -maxdepth 2 -name POSTBOOT_PASS*` (không quét toàn cây `hidden_files/`).
- **F-166-T0-5 — ĐÃ TRÁNH đếm marker sai (quyết (q) đợt 162 / quyết (q) đợt 163):** đếm độc lập dải bao hàm 70 − 49 + 1 = 22, đối chiếu với T0-165 đếm 21 tới #69 + #70 = 22 — không cộng dồn bằng trí nhớ.
- **F-166-T0-6 — ĐÃ TRÁNH tuổi boot ghi nháp sai (F-164-T0-1):** mọi tuổi boot đều tính lại bằng phép trừ epoch (gap #69→#70 = 6.954 s; tuổi #69 = 6.954 s; tuổi #68 = 7.381 s) trước khi viết LIMITS — trừ phép kiểm nháp F-166-T0-1 đã bắt được.
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung. Không ghi vào `build-loop-log.md` (theo tiền lệ T0-161/T0-162/T0-163/T0-164/T0-165 — log lượt thuộc về T10-166 khi tổng hợp, tránh ghi chồng chéo với 8–10 luồng cùng lúc).

## §8. Bàn giao / nợ mở đợt 166

1. **Parent:** T0-166 xác minh đầy đủ 9 nguồn cho reboot **#70** (boot d1ddd946, btime 22:05:25Z giờ thật) — parent đã XÁC NHẬN số hiệu #70 ở quyết (d) đợt 165; T0 chỉ xác minh độc lập bổ sung (T10-165 chỉ xác minh btime + uptime + boot_id). Gap #69→#70 = 6.954 s (kiểm lại khớp T7-165/T10-165).
2. **T10-166:** lưu ý (a) **KHÔNG có nghịch lý đồng hồ đợt này** — khác #62, không cần phán H1/H2/OVERLAP; btime #70 dùng trực tiếp; (b) **KHÔNG có reboot mới kể từ khi T10-165 đóng sổ** — boot lúc mở đợt 166 GIỐNG boot lúc T10-165 đóng; (c) **run 165 SUCCEEDED 23:19:29Z theo DB** (5 event, 1 lần viết lại tại #70) — kết cục + (m) #70 thuộc T7-166/T2-166, T0 không phán; (d) **watcher-165 chết theo reboot #70** (đã xác nhận đợt 165); **watcher-166 CHƯA khởi động** lúc T0 đóng; (e) marker **22 reboot #49–#70** (đếm độc lập, không lặp lỗi T0-162); (f) dpkg.log burst #70 hoàn thành trong boot+38s→boot+163s (1.545 dòng, md5 5f29561e — ĐỔI do viết lại theo boot, không phải bất thường) — T5-166 diễn giải; (g) cửa sổ mốc file cho cái chết của #69 RỘNG (21:42:50Z–22:05:25Z, 22m35s) — T0 ghi nhận trung thực, không thu hẹp bằng suy đoán.
3. **T2-166:** mù #77?/#88?/#94?/#95?/#96? + **INSIDE cho #70** (dải FULL116 neo 20:09:31Z — giao đợt 165) + mô hình đồng hồ — dữ liệu mới §2 + §6 (local ≈ Cloudflare ±1 s; journal +12 s, /proc/1 +11 s cùng họ mẫu) + **đối chiếu độc lập (m) #70** (requeue +38,729 s ∈ [33; 49,8]; parent quyết (n) đợt 165 đã CHẤP NHẬN #70 là ứng viên DƯƠNG; nếu chấp nhận cả #68+#69+#70: n ứng viên 21→24 nhánh khuyến nghị hoặc 22→25 nhánh #56 ÂM — T2 tính lại, T0 không phán) + **ghi chú đứng về dải (m) 33–49,8 s theo offset btime-tương đối (quyết (e) đợt 165 — T2-166 ghi vào LIMITS)** + hole-recheck #88? lần 10 + theo dõi mù #96?.
4. **T5-166:** viết POSTBOOT_PASS #70 (CHƯA CÓ lúc T0 đóng ~23:40Z) + vận hành watcher-166 (chưa khởi động lúc T0 đóng) + theo dõi replay #70 (dpkg 1.545 dòng, md5 5f29561e, xong boot+163s).
5. **T7-166:** kết cục run 165 (DB ghi `succeeded` 23:19:29Z, 5 event, 1 lần viết lại — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ: margin 982 s thô, slot HB/DR) + điểm (m) #70 (requeue +38,729 s trong dải; T7 phán chính thức, T2 đối chiếu). Lưu ý T7: run 165 ĐANG CHẠY tại btime #70 nên mới bị viết lại lần 1 (cùng mẫu #69).
6. **T8-166:** O8 chính thức (đã mở thư mục; T0 chỉ kiểm tĩnh §5, không chạy song song) + checklist (o) + triển khai (1c) diag-only sau replay offline (quyết (i) đợt 165 — phương án (A)) + H3 chỉ giám sát thụ động + X11 (đang TRỐNG).
7. **T6-166:** prune lần 41.
8. **T10-166:** tổng hợp — lưu ý chuỗi WebKit FULL PASS đang ở **19** theo quyết (b) đợt 165 (parent XÁC NHẬN LÊN 19); chuỗi chỉ lên 20 khi T4-166 có lượt yên hợp lệ trong đợt + O8 T8-166 chạy sau về thời gian TRÊN CÙNG BOOT #70 + gate FOUND chuẩn — **T0 không tự kết luận, parent quyết cuối**.

## §9. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND166_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round166-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t0/NOTES.md` (số liệu thô: btime/uptime/journal/wtmp, Cloudflare brackets, watcher-log, DB query run 165/166).
