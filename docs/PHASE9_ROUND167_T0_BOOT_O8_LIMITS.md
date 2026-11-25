# PHASE9 ROUND 167 — T0: Boot survey + O8 JSON (BOOT MỚI b643911f — ỨNG VIÊN REBOOT #73, btime 02:28:01Z; #72 XÁC MINH BỔ SUNG — 7/9 NGUỒN, 2 NGUỒN KHÔNG KHÔI PHỤC ĐƯỢC TỪ BOOT #73; RUN 166 SUCCEEDED 02:27:00Z THEO DB — KẾT CỤC THUỘC T7-167; O8 check-only, T8-167 sở hữu O8 chính thức)

- Lượt cron 09:35 +07 22/11/2026 = 02:35:51Z. T0 mở ~02:37Z, đóng ~02:40Z.
- Hạn cờ ~05:00Z, hạn cứng đóng đợt 05:30Z 22/11/2026. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS, không chạy O8 live.

## §1. Kết luận boot: CÓ reboot mới — boot lúc mở là b643911f, btime 1795314481 = 02:28:01Z, ỨNG VIÊN reboot #73 (9 nguồn khớp, KHÔNG nghịch lý đồng hồ)

Boot lúc mở **KHÁC** boot lúc T10-166 đóng (9e089ef6, #72): **b643911f, btime 1795314481 = 02:28:01Z** — CÓ reboot mới kể từ khi T10-166 đóng sổ (02:21:42Z), xảy ra ~8 phút trước khi đợt mở. 9 nguồn đều khớp btime (bảng dưới):

| # | Nguồn | Giá trị | Khớp btime? |
|---|-------|---------|-------------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156) | `1795314481` = 02:28:01Z | ✓ |
| 2 | `boot_id` (`/proc/sys/kernel/random/boot_id`) | `b643911f-d49c-44a0-8048-82984d3461c5` | ✓ (mở và đóng cùng boot — KHÔNG reboot trong phiên T0) |
| 3 | `uptime` chính xác (`/proc/uptime`, 3 lần đọc bracket) | boot_est 1795314481,64 / ,64 / ,63 (cả 3 lần giống nhau tới 0,01 s, khớp btime tới 0,63–0,64 s) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 02:28:13Z (journal start lag +12 s sau btime — cùng họ mẫu #61/#62/#64/#65/#67/#69/#70/#72 (+11/+12/+14/+15/+16 s); xem §6); `--list-boots` chỉ còn 1 boot (journal không giữ boot cũ — hạn chế lặp lại các đợt trước) | ✓ |
| 5 | wtmp / `last reboot` | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Sat Nov 22 02:28 still running`; `wtmp begins Sat Nov 22 02:28:13 2026` | ✓ |
| 6 | `/proc/1` start | 02:28:13.096588401Z (+12,1 s sau btime — cùng họ với journal +12 s; xem §6) | ✓ |
| 7 | Mốc thời gian T10-166 đóng (mốc file thực tế) | `round166-t10.done` mtime **02:21:42Z** (hoạt động cuối trên #72 trước btime); journal first entry 02:28:13Z (+12 s), dpkg.log entry đầu 02:35:39Z (boot+458s — xem §6), thư mục `round167-t0/` tạo ~02:37Z — đều SAU btime; cửa sổ chết của #72 theo mốc file: **(02:21:42Z, 02:28:01Z] = 379 s (6m19s)** | ✓ |
| 8 | Scheduler DB host-side (`muse.db`, `scheduler.job_runs` + `scheduler.events`) | Run 166 `succeeded` **02:27:00Z** (TRƯỚC btime #73 đúng 61 s — xem §3); run 167 `running` từ 02:35:51Z, 1 event duy nhất `dispatched`, `worker_boot_generation` mới `cron_boot_2cbcc980…` (khác run 166 `cron_boot_5da239b0…`) | ✓ |
| 9 | Đồng hồ wall lúc mở vs Cloudflare | local ≈ Cloudflare ±1 s lúc ~02:38Z (2 lần đo curl, xem §6) | ✓ |

- **Số hiệu: #73 — ỨNG VIÊN theo đếm tuần tự (sau #72 9e089ef6), CHỜ PARENT XÁC NHẬN.** T0 ghi số hiệu ứng viên, không tự xác nhận số hiệu (quy tắc đứng: parent xác nhận số hiệu reboot).
- `dmesg` KHÔNG thử đọc đợt này (EPERM các đợt trước — không tính làm nguồn; 9 nguồn trên đã đủ, không cần dmesg).
- **dpkg.log (nguồn phụ) — KHÁC MẪU 6 BOOT TRƯỚC (#62, #64, #65, #67, #69, #70): chỉ 2 dòng, md5 `92b922f4`, cả hai 02:35:39Z (boot+458s), KHÔNG có burst 1.545 dòng lúc T0 đóng (boot+11m).** Các boot trước burst bắt đầu boot+35–38s và xong trong boot+163–167s. Đợt này tới boot+11m vẫn chỉ 2 dòng "startup packages configure". T0 chỉ giao số liệu thô, KHÔNG suy đoán cơ chế — T5-167 sở hữu diễn giải (xem §4/§6). Không loại trừ burst chạy muộn sau khi T0 đóng.
- Tuổi boot: **#72 sống 1.376 s (22m56s)** = 02:28:01Z − 02:05:05Z — **NGẮN NHẤT trong chuỗi gap gần đây** (ngắn hơn #67→#68 = 1.983 s, #63→#64 = 2.676 s); **#71 sống 7.025 s (1h57m05s)** = 02:05:05Z − 00:08:00Z (kiểm lại khớp T10-166); **#70 sống 7.355 s** = 00:08:00Z − 22:05:25Z (kiểm lại khớp T10-166). Gap #72→#73 = **1.376 s**.
- Hệ quả: mọi watcher/process của đợt 166 trước 02:28:01Z đều đã chết theo boot mới (watcher-166 đã chết theo #71 từ trước — xem §4); mọi timestamp wall trong đợt 167 đều thuộc boot b643911f.

## §2. Reboot #72 (9e089ef6, btime 02:05:05Z): T0-167 XÁC MINH BỔ SUNG — 7/9 NGUỒN CÓ BẰNG CHỨNG, 2 NGUỒN KHÔNG KHÔI PHỤC ĐƯỢC — T0 KHÔNG CLAIM "ĐẦY ĐỦ 9 NGUỒN"

Parent đã XÁC NHẬN số hiệu #72 ở quyết (d) đợt 166. T10-166 chỉ xác minh btime + uptime + journal + wtmp trong phiên; task T0-167 yêu cầu xác minh đầy đủ 9 nguồn. **Kết quả trung thực: 7/9 nguồn có bằng chứng, 2 nguồn không thể khôi phục từ boot #73.** T0 ghi rõ từng nguồn, không gộp:

| # | Nguồn (theo khung 9 nguồn T0-166 §1) | Trạng thái với #72 | Bằng chứng |
|---|--------------------------------------|---------------------|------------|
| 1 | `/proc/stat` btime | ✓ ĐỒNG THỜI (T10-166) | `1795313105` = 02:05:05Z, đọc trực tiếp lúc ~02:10Z (aggregate 166 §10.5 (xv)) |
| 2 | `boot_id` | ✓ ĐỒNG THỜI (T10-166) | `9e089ef6-3892-4506-b1aa-b43aa2900fbe`, đọc trực tiếp lúc ~02:10Z |
| 3 | `uptime` | ✓ ĐỒNG THỜI, 1 LẦN ĐỌC (T10-166) | `uptime -s` = 02:05:05Z (khớp); uptime 337,09 s lúc 02:10:35Z (khớp btime) — **chỉ 1 lần đọc, KHÔNG phải bracket 3 lần như chuẩn T0** (T10 không bracket) |
| 4 | journal first entry | ✓ ĐỒNG THỜI (T10-166) | 02:05:17Z (+12 s sau btime — cùng họ mẫu); idx 0 duy nhất lúc đó |
| 5 | wtmp / `last reboot` | ✓ ĐỒNG THỜI (T10-166) | `wtmp begins 02:05:16Z` (+11 s); `last reboot 02:05 still running` |
| 6 | `/proc/1` start | ✗ KHÔNG CÓ BẰNG CHỨNG | T10-166 không ghi /proc/1 cho #72; từ boot #73 không đọc lại được /proc/1 của boot cũ — **không khôi phục được** |
| 7 | Mốc file thực tế | ✓ HỒI CỨU (T0-167, từ mtime bền trên đĩa) | Hoạt động cuối trên #71: `round166-t9.done` 01:51:44Z; hoạt động đầu trên #72: `round166-t7.done` 02:08:39Z; `round166-t10.done` 02:21:42Z cũng trên #72. Cửa sổ boot #72 theo mốc file: **(01:51:44Z, 02:08:39Z] = 1.015 s, chứa btime 02:05:05Z**; cửa sổ chết #72: (02:21:42Z, 02:28:01Z] = 379 s |
| 8 | Scheduler DB host-side | ✓ HỒI CỨU (T0-167, DB host-side độc lập cell) | Requeue run 166 eid 9925 lúc **02:05:44.547Z = btime #72 +39,547 s** (detail "daemon startup recovery"); dispatch +39,588 s; reattach +39,637 s — xem §3 |
| 9 | Đồng hồ wall vs Cloudflare | ✗ KHÔNG CÓ BẰNG CHỨNG | Không có lần kiểm Cloudflare đồng thời nào cho #72 được ghi lại (T10-166 không kiểm; T7-166 lần đọc DB cuối 02:02:29Z, TRƯỚC btime #72) — **không khôi phục được** |

- **Vì sao 2 nguồn mất:** journal chỉ giữ boot hiện tại (`--list-boots` idx 0 duy nhất) và wtmp reset theo boot — từ boot #73, mọi nguồn live của #72 (boot_id, uptime, journal, wtmp, /proc/1) đều không đọc lại được. Chỉ các bản ghi bền (aggregate T10-166, mtime file, DB host-side) còn lại. Đây là giới hạn cấu trúc, không phải thiếu sót của T10-166 — cùng họ với giới hạn T10-166 ghi ở §10.6 (r) đợt 166 (không đếm lại được B2/ENOSPC sau khi boot đổi).
- **Kết luận T0 về #72:** btime 02:05:05Z được neo bởi 7 nguồn (5 đồng thời + 2 hồi cứu bền), không có xung đột nào giữa chúng; **không có nghịch lý đồng hồ cho #72** trong phạm vi bằng chứng còn lại. Nhưng T0 **KHÔNG** claim "xác minh đầy đủ 9 nguồn" cho #72 — đúng 2 nguồn (/proc/1, Cloudflare-đồng-thời) không có bằng chứng. Parent quyết có chấp nhận 7/9 này là đủ cho hồ sơ #72 hay ghi nợ vĩnh viễn 2 nguồn.
- **Caveat khung giờ (theo mẫu #70):** T0-167 KHÔNG có dữ kiện watcher-poll nào để kiểm lệch khung giờ tại biên #71/#72 như T5-166 đã làm cho #70 (watcher-166 chết theo #71; log dừng ở poll 00:08:20Z trên #70). Offset requeue #72 theo btime (+39,547 s) nằm TRONG dải dương [33; 49,8] — nhưng đó là offset theo btime, chưa đối chiếu khung giờ thật. **T7-167/T2-167 sở hữu phán (m) #72; T0 không phán.**

## §3. Run 166 SUCCEEDED 02:27:00Z theo DB — KẾT CỤC THUỘC T7-167; VIẾT LẠI LẦN 2 TẠI #72 ĐÃ XÁC NHẬN (requeue +39,547 s)

Truy vấn chỉ-đọc `muse.db` (`scheduler.job_runs` + `scheduler.events`, job `vcut-build-loop`), đọc lúc ~02:39Z:

- Run 166 `5c969404-8c41-459b-be58-3a90bdda104e`: scheduled **23:35:51Z 21/11**, `started_at` **02:05:44Z** (sau viết lại lần 2 tại #72), **`finished_at` 2026-11-22T02:27:00+00:00**, status **`succeeded`** (lúc đọc), attempt 1, `worker_claimed_at_utc` 1795314356 (02:25:56Z — claim lại sau viết lại lần 2), `worker_execution_timed_out` false. **Wall gốc: 10.269 s (2h51m09s)** — số thô, T7-167 phán. **Margin thô tới hạn cứng 02:30Z: 180 s (2m59s)**; tới lượt sau 02:35:51Z: 531 s (8m51s). **Claimed→finished: 64 s** — NGOÀI họ 6–11 s của run 154–163 và 8 s của run 165 (số thô, T7-167 phán; không suy cơ chế).
- Events run 166: **8 event** — `dispatched` eid 9888 lúc 23:35:51.143Z; **`requeued_after_restart` eid 9898 lúc 00:08:41.274Z** (detail "daemon startup recovery" — **viết lại lần 1 tại #71, btime +41,274 s** — khớp T7-166); `dispatched` eid 9899 lúc 00:08:41.339Z; `reattached_after_restart` eid 9900 lúc 00:08:41.406Z; **`requeued_after_restart` eid 9925 lúc 02:05:44.547Z** (detail "daemon startup recovery" — **VIẾT LẠI LẦN 2 TẠI #72, btime +39,547 s — TRONG dải dương [33; 49,8]** — trả lời câu hỏi T10-166 giao T7-167 ở §10.5 (xv)); `dispatched` eid 9926 lúc 02:05:44.588Z; `reattached_after_restart` eid 9927 lúc 02:05:44.637Z; **`succeeded` eid 9931 lúc 02:27:00.229Z**. **0 event sau succeeded** (lúc đọc).
- **Run 166 finish TRƯỚC btime #73 đúng 61 s** (02:27:00Z → 02:28:01Z) — nên **#73 KHÔNG gây viết lại nào cho run 166** (khác #71/#72: run đang chạy tại btime nên bị viết lại; run 166 đã xong trước #73).
- Run 167 `ddb28fcb-7f71-48d3-bfa6-1cb07d1d155c`: scheduled/started 02:35:51Z, status `running` (lúc đọc), `worker_boot_generation` `cron_boot_2cbcc9806f0b4d7493014dc7219210b4` — **generation mới trên #73** (khác run 166 sau viết lại `cron_boot_5da239b08ff547d78be9b58811ad4501`); events: **1 event duy nhất** `dispatched` eid 9933 lúc 02:35:51.065Z — **KHÔNG requeue** (khởi động sạch trên #73).
- **Suy luận duy nhất T0 được phép:** worker của run 166 báo cáo succeed lúc **thật 02:27:00Z**, sau btime #72 (02:05:05Z) **21m55s (1.315 s)**, trước btime #73 (02:28:01Z) 61 s, trước hạn cứng đợt 166 (02:30Z) 180 s. T10-166 đóng cờ 02:21:42Z với run 166 vẫn `running` — claim "chưa có kết cục" ĐÚNG lúc đóng; run finish 02:27:00Z, 5m18s sau khi T10 đóng cờ. **T0 KHÔNG phán** kết cục run 166, margin chính thức, hay điểm (m) #72 — tất cả thuộc T7-167 (kết cục) và T2-167 (đối chiếu độc lập (m) #72).
- Tiền đề như đợt 161/162/163/164/165/166: timestamp DB = giờ host thật, độc lập với đồng hồ cell (scheduler + Postgres host-side, ngoài cell VM).

## §4. Watcher: watcher-166 CHẾT THEO REBOOT #71 (đã xác nhận đợt 166); watcher-167 CHƯA khởi động lúc T0 đóng; POSTBOOT_PASS #71/#72/#73 CHƯA CÓ

- **Watcher-166 pid 26422 (T5-166, START 23:40:45Z trên boot #70): CHẾT THEO REBOOT #71** (log dừng ở poll 00:08:20Z, nhãn boot `d1ddd946` — nhãn stale sau btime #71 20 s; T10-166 §10.5 (xiv) xác minh độc lập ĐÚNG là nhãn stale). **0 process `replay-watch` đang chạy lúc T0 mở và lúc T0 đóng.**
- **Watcher-167 CHƯA khởi động lúc T0 đóng:** thư mục `round167-t5/` đã tồn tại (T5-167 đã mở) nhưng chưa có process replay-watch; T5-167 sở hữu vận hành watcher-167 + POSTBOOT_PASS #73.
- `ps` lúc kiểm thấy `b2-watcher.sh` pid 2475 chạy từ 02:38Z — không phải replay-watch (ghi nhận thô, T0 không diễn giải — cùng mẫu T0-166: b2-watcher của T9-167) — và các process `test-vite-lock-v2.sh` / `vcut-vite-lock-v2.sh acquire` chạy ~02:38Z (luồng khác đang kiểm lock, T0 không diễn giải).
- Khoảng không-watcher: từ khi watcher-166 chết theo #71 (00:08:00Z) tới khi watcher-167 khởi động — T5-167 đo chính xác (đã dài hơn 2h30m lúc T0 đóng).
- **POSTBOOT_PASS #70 CÒN** (`round166-t5/POSTBOOT_PASS`, ghi 23:40:45Z) + **#69 CÒN** (`POSTBOOT_PASS-9a1a9319`) + **#67 CÒN** (`round164-t5/POSTBOOT_PASS`); **#63/#66/#68 KHÔNG CÓ** (không bù được — quyết các đợt trước); **#71/#72/#73 CHƯA CÓ lúc T0 đóng** (kiểm bằng `find -maxdepth 2 -name POSTBOOT_PASS*` ngay trước khi ghi cờ; T5-167 chưa mở cờ nên chưa thể xuất hiện trước khi T0 đóng; nếu T5-167 ghi cờ ngay sau đó thì cờ T0 vẫn đúng tại thời điểm kiểm, T5 là nguồn chính thức).
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:47Z ngày 20/11 trên boot #48, mtime không đổi) — sống qua **25 reboot liên tiếp** #49–#73 (đếm độc lập: dải bao hàm 73 − 49 + 1 = 25; T0-166 đếm 22 tới #70, thêm #71+#72+#73 = 25. T0-167 KHÔNG lặp lỗi T0-162 ghi 15 thay vì 16).
- T0 KHÔNG chạy postboot check trong đợt này (task T0-167 không yêu cầu; T5-167 sở hữu postboot). Trạng thái postboot thực tế trên #73 do T5-167 xác nhận.

## §5. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ T10-166, 21/21 ×3, boot #71)

Đối chiếu JSON T8-166 trong `hidden_files/round166-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 166 — T8-167 đã mở thư mục, xem §6):

| File | md5 (8 đầu) | Hồ sơ T10-166 | Nội dung kiểm bằng python |
|------|-------------|---------------|---------------------------|
| WebKit attempt1 `o8w-clicktest-report-2026-11-22T00-18-28-ea73ac4f-pid8245.json` | `a3d05874…` ✓ | khớp | 21 results, 21 `ok=true`, boot ea73ac4f |
| WebKit attempt2 `o8w-clicktest-report-2026-11-22T00-19-30-ea73ac4f-pid8645.json` | `41f912ac…` ✓ | khớp | 21 results, 21 `ok=true`, boot ea73ac4f |
| Chromium `o8-clicktest-report-2026-11-22T00-20-28-ea73ac4f-pid9045.json` | `93de30a2…` ✓ | khớp | 21 results, 21 `ok=true`, boot ea73ac4f |
| `o8w-clicktest-report.json` (latest) | `41f912ac…` = attempt2 ✓ | byte-identical với stamped cuối | — |
| `o8-clicktest-report.json` (latest) | `93de30a2…` ✓ | byte-identical với stamped cuối | — |

Cây md5 lúc mở khớp đúng hồ sơ T10-165/T10-166 lúc đóng (không đổi ngoài ý muốn):

| File (đường dẫn thật) | md5 (8 đầu) |
|------------------------|-------------|
| `apps/web/src/preview.tsx` | `530e10a7` ✓ |
| `apps/web/src/media.ts` | `2c384ed1` ✓ |
| `apps/web/vite.config.ts` | `ee80d093` ✓ |
| `server/render/src/effects.js` | `fedc0141` ✓ |

- O8 JSON đợt 166 thuộc boot #71 (ea73ac4f) — nay boot đã là #73, nhưng file JSON không đổi: T0 chỉ xác minh tính toàn vẹn, không chạy lại O8.
- Chuỗi WebKit FULL PASS đang ở **19** theo quyết (b) đợt 166 (parent XÁC NHẬN GIỮ 19); T0 không tự kết luận chuỗi đợt 167 — parent quyết cuối sau khi có kết quả T4-167 + O8 T8-167 (quy tắc đứng: chuỗi chỉ lên khi CÓ lượt yên hợp lệ trong đợt + O8 chạy sau về thời gian TRÊN CÙNG BOOT đo + gate FOUND chuẩn).

## §6. O8 live: KHÔNG chạy — theo quy ước đợt 162/163/164/165/166, T8-167 sở hữu O8 chính thức; lượt yên đợt 167 CHƯA CÓ kết quả lúc T0 đóng

- Task T0-167 yêu cầu **kiểm tra sẵn sàng O8, KHÔNG tự phán chuỗi** — T0 giữ quy ước check-only (T0-162 §6: T0 kiểm tĩnh JSON, T8 sở hữu O8 live; T0 không chạy vite/playwright để tránh va chạm cổng/lock với T8). T0-167 giữ nguyên: chỉ đối chiếu tĩnh §5, không chạy O8 live.
- T8-167 đã mở thư mục (`round167-t8/` tồn tại lúc T0 đóng, có script + scratch + `o8-webkit/`/`o8-chromium/` — chưa có JSON mới). T1/T2/T4/T5/T6/T7/T9-167 cũng đã mở thư mục. T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với T8-167.
- **Lượt yên đợt 167: CHƯA CÓ kết quả lúc T0 đóng.** T4-167 đã mở thư mục; **0 cờ `.done` nào của đợt 167 tồn tại lúc T0 đóng** (T0 là cờ đầu tiên). T0 KHÔNG tự kết luận chuỗi WebKit FULL PASS — chỉ đề xuất sau khi có kết quả T4-167 + O8 T8-167; **parent quyết cuối**.
- Đồng hồ wall cell lúc mở đợt 167: **CHUẨN (±1 s so với Cloudflare)**:

| Lần đo | Local (bracket) | Cloudflare Date | Đọc |
|--------|----------------|-----------------|-----|
| ~02:38Z (curl try0) | epoch 1795315131,04–1795315131,62 | 02:38:52 GMT, epoch 1795315132 (CF trước local +0,38 đến +0,96 s so với bracket — trong độ trễ request + cắt giây) | local ≈ Cloudflare |
| ~02:38Z (curl try1) | epoch 1795315131,64–1795315132,07 | 02:38:52 GMT, epoch 1795315132 (CF trước local +0,00 đến +0,36 s) | local ≈ Cloudflare |

- **Cảnh báo phương pháp (lặp lại từ đợt 158/159/160/161/162/163/164/165/166):** GitHub Date header dao động giữa các edge server — **không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-167 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên. Caveat: CF Date cắt tới giây nên biên trên của try0 (+0,96 s) chứa thành phần cắt giây; cả hai lần đo đều nhất quán với local chậm hơn Cloudflare ~0,4 s.
- Uptime math khớp btime tới 0,63–0,64 s (3 lần đọc §1, boot_est .64/.64/.63); btime là floor của giây boot — 0,64 s nằm trong 1 s làm tròn, không phải lệch. Journal boot mới đơn điệu: 82 entry, 0 bước nhảy âm, gap lớn nhất 69,86 s (timer 1 phút, bình thường — cùng họ 69,87 s của #69/#70), 0 gap >120 s — không có dấu hiệu sửa đồng hồ sau boot.
- **Độ lệch nhỏ ghi nhận (không phải nghịch lý):** journal first entry +12 s và `/proc/1` +12,1 s sau btime — cùng họ mẫu +11/+12/+14/+15/+16 s của #61/#62/#64/#65/#67/#69/#70/#71/#72, mọi nguồn khác khớp btime; không có xung đột nào cần phán H1/H2.
- `/tmp/.X11-unix/` **TRỐNG** lúc T0 mở và lúc T0 đóng (~02:37–02:40Z, 0 socket — 3 socket X193/X194/X195 của T5-165 đã bị reboot #70 xóa; không socket mới nào xuất hiện trên #71/#72/#73).
- **dpkg.log (ghi nhận thô cho T5-167) — KHÁC MẪU:** reset theo boot nhưng chỉ **2 dòng, md5 `92b922f4`**, cả hai 02:35:39Z (boot+458s, "startup packages configure") — **KHÔNG có burst 1.545 dòng** như #69 (boot+35s→boot+167s) và #70 (boot+38s→boot+163s) lúc T0 đóng (boot+11m). T5-167 sở hữu diễn giải (T0 không suy đoán cơ chế; không loại trừ burst chạy muộn sau khi T0 đóng).

## §7. Sai số của chính mình (F-167-T0-n)

- **F-167-T0-1 — Gõ sai epoch scheduled_for run 166 trong phép kiểm nháp (1795302951 thay vì 1795304151).** Phép kiểm phụ trong python đầu dùng sai epoch → wall run 166 ra 11.469 s (sai). Bắt được ngay (lệnh `date -d @1795304151` trả 23:35:51Z đúng scheduled_for), tính lại đúng: wall = 10.269 s (2h51m09s) ✓. Không có output nào đã ghi bị ảnh hưởng (mọi số khác tính từ btime/epoch đã verify bằng `date -d`). Bài học (lặp lại F-166-T0-1): epoch nào cũng verify bằng `date -d` trước khi dùng làm số hạng.
- **F-167-T0-2 — Lệnh kiểm cuối `ls round167-*.done` exit 2 do không có file nào.** Không phải lỗi kiểm tra — 0 cờ đợt 167 lúc T0 đóng là kết quả đúng (T0 là cờ đầu tiên). Ghi nhận để T10-167 khỏi nhầm là lỗi lệnh (cùng họ F-165-T0-2/F-166-T0-2).
- **F-167-T0-3 — ĐÃ TRÁNH lỗi làm tròn uptime (F-162-T0-5/F-163-T0-3/F-164-T0-3/F-165-T0-3/F-166-T0-3):** chỉ dùng 3 lần đọc bracket bằng python có phần thập phân cho phép toán uptime−epoch (boot_est 1795314481,64/.64/.63 cả 3 lần); không dùng `date +%s` nguyên giây cho phép toán này.
- **F-167-T0-4 — ĐÃ TRÁNH grep toàn cây (F-160-T0-3/F-163-T0-4/F-164-T0-4/F-165-T0-4/F-166-T0-4):** kiểm POSTBOOT_PASS chỉ bằng `find -maxdepth 2 -name POSTBOOT_PASS*` (không quét toàn cây `hidden_files/`).
- **F-167-T0-5 — ĐÃ TRÁNH đếm marker sai (quyết (q) đợt 162 / quyết (q) đợt 163):** đếm độc lập dải bao hàm 73 − 49 + 1 = 25, đối chiếu với T0-166 đếm 22 tới #70 + #71+#72+#73 = 25 — không cộng dồn bằng trí nhớ.
- **F-167-T0-6 — ĐÃ TRÁNH tuổi boot ghi nháp sai (F-164-T0-1/F-166-T0-6):** mọi tuổi boot đều tính lại bằng phép trừ epoch (gap #72→#73 = 1.376 s; tuổi #72 = 1.376 s; tuổi #71 = 7.025 s) trước khi viết LIMITS — trừ phép kiểm nháp F-167-T0-1 đã bắt được.
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung. Không ghi vào `build-loop-log.md` (theo tiền lệ T0-161/T0-162/T0-163/T0-164/T0-165/T0-166 — log lượt thuộc về T10-167 khi tổng hợp, tránh ghi chồng chéo với 8–10 luồng cùng lúc).

## §8. Bàn giao / nợ mở đợt 167

1. **Parent:** (a) T0-167 ghi nhận **boot mới b643911f, btime 02:28:01Z — ỨNG VIÊN reboot #73, chờ parent xác nhận số hiệu** (9 nguồn khớp, không nghịch lý đồng hồ); gap #72→#73 = **1.376 s (22m56s) — ngắn nhất chuỗi gần đây**; (b) **#72: T0 xác minh bổ sung 7/9 nguồn** (5 đồng thời của T10-166 + mốc file + DB hồi cứu) — **2 nguồn (/proc/1, Cloudflare-đồng-thời) KHÔNG có bằng chứng, không khôi phục được từ boot #73** — parent quyết có chấp nhận 7/9 cho hồ sơ #72 hay ghi nợ vĩnh viễn; (c) **run 166 SUCCEEDED 02:27:00Z** (8 event, 2 lần viết lại tại #71 +41,274 s và #72 +39,547 s — cả hai trong dải [33; 49,8] theo btime; wall 10.269 s; margin thô tới hạn cứng 180 s; claimed→finished 64 s — ngoài họ 6–11 s) — kết cục + (m) #72 thuộc T7-167/T2-167, T0 không phán; (d) marker **25 reboot #49–#73** (đếm độc lập); (e) dpkg.log #73 khác mẫu (chỉ 2 dòng, không burst 1.545 dòng lúc T0 đóng) — T5-167 diễn giải.
2. **T10-167:** lưu ý (a) **CÓ reboot mới kể từ khi T10-166 đóng sổ** — boot lúc mở đợt 167 (b643911f) KHÁC boot lúc T10-166 đóng (9e089ef6); KHÔNG nghịch lý đồng hồ đợt này — khác #62, không cần phán H1/H2/OVERLAP; btime #73 dùng trực tiếp (sau khi parent xác nhận số hiệu); (b) **run 166 SUCCEEDED 02:27:00Z theo DB** (8 event, 2 lần viết lại — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ); (c) **watcher-166 chết theo reboot #71** (đã xác nhận đợt 166); **watcher-167 CHƯA khởi động** lúc T0 đóng; (d) marker **25 reboot #49–#73** (đếm độc lập, không lặp lỗi T0-162); (e) **dpkg.log #73 chỉ 2 dòng** (boot+458s, md5 92b922f4 — KHÔNG burst như #69/#70) — T5-167 diễn giải; (f) cửa sổ mốc file cho cái chết của #72 là (02:21:42Z, 02:28:01Z] = 379 s — T0 ghi nhận trung thực, không thu hẹp bằng suy đoán.
3. **T2-167:** mù #77?/#88?/#94?/#95?/#96? + **INSIDE cho #73** (dải FULL117 neo 22:05:25Z — giao đợt 166) + mô hình đồng hồ — dữ liệu mới §2 + §6 (local ≈ Cloudflare ±1 s; journal +12 s, /proc/1 +12,1 s cùng họ mẫu) + **đối chiếu độc lập (m) #72** (requeue +39,547 s ∈ [33; 49,8] theo btime; parent quyết (n) đợt 166 đã CHẤP NHẬN #72 là ứng viên DƯƠNG chờ đối chiếu — nếu chấp nhận cả #68+#69+#70+#71+#72: n ứng viên 21→26 nhánh khuyến nghị hoặc 22→27 nhánh #56 ÂM — T2 tính lại, T0 không phán) + **kiểm lệch khung tại biên #71/#72 theo cùng mẫu T5-166 (T7-166 §2.6)** — T0-167 không có dữ kiện watcher-poll cho biên này (xem §2 caveat) + **ghi chú đứng về dải (m) 33–49,8 s theo offset btime-tương đối (quyết (e) đợt 165 — T2-167 ghi vào LIMITS)** + hole-recheck #88? lần 11 + theo dõi mù #96?.
4. **T5-167:** viết POSTBOOT_PASS #73 (CHƯA CÓ lúc T0 đóng ~02:40Z) + vận hành watcher-167 (chưa khởi động lúc T0 đóng) + theo dõi replay #73 (dpkg chỉ 2 dòng lúc T0 đóng — KHÁC MẪU, xem §6) + POSTBOOT_PASS #71/#72 (CHƯA CÓ — T5-167 kiểm tra lúc mở; #71/#72 không bù được nếu replay đã qua).
5. **T7-167:** kết cục run 166 (DB ghi `succeeded` 02:27:00Z, 8 event, 2 lần viết lại — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ: margin 180 s thô tới hạn cứng, slot HB/DR, claimed→finished 64 s ngoài họ 6–11 s) + điểm (m) #72 (requeue +39,547 s trong dải theo btime; T7 phán chính thức, T2 đối chiếu). Lưu ý T7: run 166 bị viết lại lần 2 tại #72 (lần đầu 2 lần viết lại kể từ đợt 159 — đợt 166 có 1 lần; run 165 chỉ 1 lần tại #70); run 166 finish 61 s TRƯỚC btime #73 nên #73 không viết lại run 166.
6. **T8-167:** O8 chính thức (đã mở thư mục; T0 chỉ kiểm tĩnh §5, không chạy song song) + checklist (o) + triển khai (1c) bản sửa (c') theo quyết (i) đợt 166 — parent chọn (A') + H3 chỉ giám sát thụ động + X11 (đang TRỐNG).
7. **T6-167:** prune lần 42.
8. **T10-167:** tổng hợp — lưu ý chuỗi WebKit FULL PASS đang ở **19** theo quyết (b) đợt 166 (parent XÁC NHẬN GIỮ 19); chuỗi chỉ lên 20 khi T4-167 có lượt yên hợp lệ trong đợt + O8 T8-167 chạy sau về thời gian TRÊN CÙNG BOOT b643911f + gate FOUND chuẩn — **T0 không tự kết luận, parent quyết cuối**.

## §9. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND167_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round167-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round167-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round167-t0/NOTES.md` (số liệu thô: btime/uptime/journal/wtmp, Cloudflare brackets, watcher-log, DB query run 166/167).
