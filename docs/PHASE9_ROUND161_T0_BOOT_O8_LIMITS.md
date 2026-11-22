# PHASE9 ROUND 161 — T0: Boot survey + O8 JSON (REBOOT MỚI #62 ứng viên; btime GHI 07:59:29Z NHƯNG DB CHỨNG MINH GIỜ THẬT ~08:13:30Z — NGHỊCH LÝ ĐỒNG HỒ #62 MỚI; T0 (H2) BẤT ĐỒNG VỚI T5-161 (H1), CHỜ T10 PHÁN; O8 check-only, T8-161 sở hữu O8 chính thức)

- Lượt cron 15:35 +07 21/11/2026 = 08:35:51Z 21/11. T0 mở ~08:36:57Z, đóng ~08:44Z.
- Hạn cờ ~11:00Z, hạn cứng ~11:30Z 21/11. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS, không chạy O8 live.

## §1. Kết luận boot: CÓ reboot mới — ứng viên #62, boot 39d46ba0; btime GHI 1795247969 = 07:59:29Z (7 nguồn khớp) — NHƯNG giờ thật ~08:13:30Z theo bằng chứng DB (§2)

Boot lúc mở **KHÁC** boot lúc T10-160 đóng: **39d46ba0, btime ghi 1795247969 = 07:59:29Z**, trong khi T10-160 đóng trên boot **52c957d5 (#61, btime 05:25:49Z)**. 7 nguồn độc lập đều khớp btime GHI (bảng dưới — tất cả đều đọc trên đồng hồ cell, xem caveat §2):

| # | Nguồn | Giá trị | Khớp btime ghi? |
|---|-------|---------|-----------------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156) | `1795247969` = 07:59:29Z | ✓ |
| 2 | `boot_id` (`/proc/sys/kernel/random/boot_id`) | `39d46ba0-5724-4e4e-abec-a546d4d98ab2` | ✓ |
| 3 | `uptime` chính xác (`/proc/uptime`, 3 lần đọc) | 2248,53 s lúc epoch 1795250217 → boot 1795247968,47; 2270,46 s lúc 1795250239,92 → 1795247969,46; 2287,15 s lúc 1795250256 → 1795247968,85; lúc đóng 2548,60 s lúc 1795250518 → 1795247969,40 (khớp btime tới ~0,5 s) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 07:59:40Z (journal start lag +11 s sau btime — đúng mẫu #61); `--list-boots` chỉ còn 1 boot (journal không giữ boot cũ — hạn chế lặp lại các đợt trước) | ✓ |
| 5 | wtmp / `last reboot` + btmp | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Sat Nov 21 07:59 still running`; `wtmp begins Sat Nov 21 07:59:40 2026`; btmp begins 07:59:40Z, 0 dòng (không login lỗi) | ✓ |
| 6 | `/proc/1` start | 07:59:39–40Z (+10–11 s sau btime — đúng mẫu #61: +11,5 s) | ✓ |
| 7 | Mốc thời gian T10-160 đóng (đọc theo giờ GHI) | `round160-t10.done` mtime **08:02:45Z**; btime ghi 07:59:29Z sớm hơn **3'16"** → theo giờ ghi, reboot rơi vào khoảng giữa lần kiểm boot cuối của T10 (~07:59Z) và lúc T10 đóng cờ — XEM §2: theo giờ THẬT thì reboot xảy ra ~10'45" SAU khi T10 đóng | ⚠ (xem §2) |

- **Số hiệu ứng viên: #62** — tiếp nối #61 (52c957d5, btime 05:25:49Z). **Chờ parent xác nhận** số hiệu trước khi T2-161 dùng làm mốc chính thức (quy tắc đứng: T0 ghi số hiệu ứng viên, parent quyết).
- `dmesg` KHÔNG đọc được (`read kernel buffer failed: Operation not permitted`) — không tính làm nguồn; 7 nguồn trên đã đủ, không cần dmesg.
- **dpkg.log (nguồn phụ trong danh sách 7 nguồn của task): YẾU đợt này — file đã RESET theo boot** (chỉ còn 94 byte / 2 dòng: `startup packages configure` 08:35:40Z + 08:35:41Z; không còn 1.545 dòng của #61; `/var/log/apt/` không tồn tại). Việc reset file phù hợp với một boot mới (cùng mẫu journal chỉ còn 1 boot), nhưng dpkg.log KHÔNG cho mốc btime độc lập đợt này — 2 dòng đều sau giờ boot (giờ ghi). Hoạt động dpkg đầu tiên xuất hiện 11 s TRƯỚC giờ mở đợt (08:35:40Z so với 08:35:51Z) — cùng mẫu #61 (12 s trước giờ mở) — có vẻ kích hoạt bởi máy móc mở đợt, không phải theo boot (ghi nhận theo T5-161; T0 không suy đoán cơ chế).
- Hệ quả: mọi watcher/process của đợt 160 đều đã chết theo #62 (xem §3); mọi timestamp wall trong đợt 161 đều thuộc boot mới.

## §2. NGHỊCH LÝ ĐỒNG HỒ #62 — btime GHI 07:59:29Z KHÔNG PHẢI GIỜ THẬT: giờ thật ~08:13:30Z (bằng chứng DB host-side); T0 chọn H2, T5-161 chọn H1 — CHỜ T10 PHÁN

### §2.1 Xung đột (824 s)

- Watcher-160 (pid 4539, boot #61) poll CUỐI lúc **08:13:13Z theo đồng hồ boot cũ** (log `replay-watch-160.log`, 309 dòng, xem §3) — muộn hơn btime ghi 07:59:29Z tới **824 s (13'44")**.
- Nếu btime ghi là giờ thật thì watcher-160 phải chết trước 07:59:29Z thật — không thể poll lúc 08:13:13Z. Ít nhất một trong hai đồng hồ (boot cũ lúc chết, hoặc boot mới lúc boot) lệch ~14 phút.
- T7-160 đã xác minh đồng hồ boot cũ **ĐÚNG ±1 s lúc 07:47:25Z thật** (trích nguyên văn LIMITS T7-160 §2.3: "Cloudflare ts 1795247245 vs local 1795247244 → local chậm 1 s (trong ±1 s)").
- Log watcher-160 **không có bước nhảy rời rạc nào**: 309 dòng, 05:41:26Z → 08:13:13Z, mọi khoảng giữa hai poll liên tiếp là 0 s (dòng trùng lúc start/postboot) / 30 s / 31 s (jitter lập lịch, xuất hiện đều ~mỗi 12 phút) — đã kiểm bằng script (xem NOTES.md). Không có khoảng ~14 phút nào. Một bước nhảy đồng hồ cũ sau 07:47:25Z thật sẽ để lại khoảng lớn trong log — không có.

### §2.2 Nguồn #8 (quyết định): scheduler DB host-side — run 160 SUCCEEDED 08:03:36.487Z thật

- Truy vấn chỉ-đọc `muse.db` (`scheduler.job_runs` + `scheduler.events`, job `vcut-build-loop`):
  - Run 160 `e331115f-4655-4d69-b184-3da192d7a7e8`: scheduled/started **05:35:51Z**, **finished_at 2026-11-21T08:03:36+00:00**, status **`succeeded`**, attempt **1**.
  - Events run 160: chỉ **2 event** — `dispatched` eid 9634 lúc 05:35:51.128Z, `succeeded` eid 9668 lúc **08:03:36.487Z**. **0 viết lại, 0 daemon-restart, 0 failure.**
  - Run 161 `0b0a27f8-72f4-4066-9953-e68a5157822d`: scheduled/started 08:35:51Z, status `running` (lúc đọc).
- Lag T10-160 đóng cờ → run succeeded: `.done` mtime 08:02:45.259Z → succeeded 08:03:36.487Z = **51,23 s** — cùng họ với run 159 (T10-159 `.done` 05:12:39Z → succeeded 05:14:08.721Z = ~89,7 s). Mẫu đứng: run succeed ~1–1,5 phút sau khi T10 đóng cờ.
- **Suy luận:** worker của run 160 (phiên T10-160 trong cell) phải còn sống và hoàn tất lúc **thật 08:03:36Z** thì run mới succeed lúc đó với attempt 1, không viết lại. Nếu reboot xảy ra lúc thật 07:59:29Z (btime ghi), worker đã chết trước đó 4 phút và run không thể succeed sạch lúc 08:03:36Z.
- **Tiền đề (nêu rõ):** timestamp DB = giờ host thật, độc lập với đồng hồ cell — theo cách xử lý đứng T7-160 §3.3 ("epoch DB run 159 ở khung thật") và kiến trúc runtime (scheduler + Postgres host-side, ngoài cell VM). T0 không có cách độc lập nào khác để kiểm giờ host từ trong cell; tiền đề này là điểm T10 cần phán cùng với §2.3.

### §2.3 Hai giả thuyết — T0 chọn H2; T5-161 chọn H1

- **H1 (T5-161, ghi trong `round161-t5/watcher-status-at-open.txt`): đồng hồ boot cũ chạy nhanh ≥ +824 s thật; btime ghi 07:59:29Z là giờ thật.** Luận cứ T5: (a) đồng hồ boot mới ĐÚNG vs Cloudflare ±2 s lúc mở (T5 đo local 08:37:46Z vs Cloudflare 08:37:48 GMT); (b) **KHÔNG có NTP/chrony/timesyncd trong cell** (T5 kiểm: không unit timesyncd, `timedatectl` không nối được bus) → "không có cơ chế sửa đồng hồ sau boot" → đồng hồ mới không thể từng chậm rồi tự sửa. T5 dự định kiểm thêm tính đơn điệu timestamp journal để loại H2.
- **H2 (T0-161): đồng hồ boot mới chậm ~14 phút lúc kernel boot; btime ghi KHÔNG phải giờ thật; giờ thật ~08:13:30Z.** Luận cứ T0: (a) bằng chứng DB §2.2 — run 160 succeed thật 08:03:36Z, sau btime ghi 4 phút, attempt 1 không viết lại; (b) lag 51 s khớp mẫu run 159 (89,7 s) — dưới H1, lag phân giải sẽ là ~5–9 phút (tùy tốc độ slew của đồng hồ cũ), phá mẫu đứng; (c) H1 đòi đồng hồ cũ slew nhanh gấp ~2,2 lần trong ~12 phút cuối đời — khác hẳn mẫu cũ (+20–32 s, tốc độ ~1,0002×) về bản chất, không chỉ độ lớn.
- **Phản biện H1 của T0 về kiểm journal của T5:** T0 đã quét toàn bộ journal boot mới (154 entry, 07:59:40Z → 08:37:28Z): **không có bước nhảy nào > 120 s, không có bước nhảy âm** — nhưng kiểm này CHỈ loại được một bước nhảy ĐƠN LỚN sau khi journald chạy. Nó KHÔNG loại được H2 vì H2 có hai dạng: (i) sửa đồng hồ TRƯỚC entry journal đầu tiên (07:59:40Z giờ ghi — tức trong ~11 s đầu sau btime, trước khi journald ghi dòng đầu; cơ chế có thể là host-side đặt lại đồng hồ VM lúc boot, ngoài cell nên không để lại log trong cell); (ii) slew dần bằng nhiều bước nhỏ (< 120 s mỗi bước) rải suốt 38 phút journal — mỗi bước chìm trong khoảng trống tự nhiên giữa các entry (trung bình ~15 s/entry, timer 1 phút cho 3 entry/phút đều đặn). **Kiểm đơn điệu journal không phân định được H1/H2 — T10 lưu ý khi phán.**
- **Cơ chế sửa đồng hồ mới (H2) vẫn CHƯA RÕ** — T0 không suy đoán. Giao T2-161 (mô hình đồng hồ) điều tra thêm; khả năng host-side (runtime đặt giờ VM lúc boot) là hướng kiểm đầu tiên vì trong cell không có NTP.

### §2.4 Kết luận T0-161 (đề xuất, chờ T10 phán): giờ thật ~08:13:30Z

- **Btime thật ước tính: ~08:13:30Z** (epoch 1795248810), khoảng **(08:13:13Z, 08:13:43Z]** — sau poll cuối watcher-160 (08:13:13Z, đồng hồ cũ đúng) và trước poll kế tiếp (08:13:43Z, không bao giờ chạy). Offset so với btime ghi: **+841 s (khoảng +824 – +854 s)**.
- Kiểm chéo mẫu lag sau btime: `/proc/1` start ghi 07:59:40Z = thật ~08:13:41Z (+11 s — đúng mẫu #61); journal first entry ghi 07:59:40Z = thật ~08:13:41Z (+11 s — đúng mẫu #61); wtmp begins ghi 07:59:40Z — tất cả nhất quán với offset +841 s.
- **Tuổi boot #61 (thật): 10.061 s (2h47m41s)** = 08:13:30Z − 05:25:49Z. Theo btime ghi: 9.220 s (2h33m40s). (Đối chiếu chéo: T5-161 ghi tuổi #61 là "8.620 s (~2h23m40s)" — SAI số học 600 s so với chính hai mốc T5 nêu (05:25:49Z → 07:59:29Z = 9.220 s); T10 đối chiếu khi phán. Đây không phải sai số của T0.)
- **Reboot KHÔNG xảy ra trong lúc T10-160 đóng sổ:** T10 đóng cờ thật 08:02:45Z (đồng hồ cũ đúng lúc đó); btime thật ~08:13:30Z muộn hơn **~10'45"** — reboot xảy ra GIỮA hai đợt, như #61. Câu "KHÔNG có reboot mới trong lúc T10 đóng sổ" của T10-160 **ĐỨNG** theo bằng chứng DB. (Theo giờ ghi thì ngược lại — btime ghi sớm hơn .done 3'16" — đó chính là lý do §2 này tồn tại.)
- **Giao T2-161:** mù #93? (#61) đoạn L — hai đầu đoạn phụ thuộc btime #62: dùng btime THẬT ~08:13:30Z (đề xuất T0) hay btime ghi 07:59:29Z sẽ đổi độ dài đoạn L ~841 s — T2 nêu rõ chọn mốc nào và vì sao; không dùng lẫn lộn hai khung trong một phép tính (bài học F-146/F-147/F-148-T7-1 + quy tắc §3.3 T7-160).
- **Giao T7-161:** kết cục run 160 — T0 CHỈ dùng `finished_at` 08:03:36.487Z làm bằng chứng đồng hồ, KHÔNG phán verdict run 160 (margin, viết lại, slot HB/DR thuộc T7-161). Lưu ý T7: `worker_boot_generation` run 160 (`cron_boot_a3e1dcff…`) khác run 161 (`cron_boot_b527ba3d…`) — có reboot giữa hai run, nhất quán cả H1/H2.
- **Điểm (m) #62:** T7-161 kiểm (0 run đang chạy tại btime thật ~08:13:30Z? 0 requeue trong cửa? run 161 dispatch 08:35:51Z sau btime thật) — T0 không phán vì btime thật còn chờ T10 chốt.

## §3. Watcher: watcher-160 CHẾT theo reboot #62; lúc đóng watcher-161 ĐÃ CHẠY (T5-161)

- **Watcher-160 pid 4539 (T5-160, chạy từ 05:41:26Z trên boot #61, END 08:30:00Z): CHẾT** (`kill -0` → `No such process`; `ps -p` rỗng).
  - Log `round160-t5/replay-watch-160.log`: **309 dòng, poll cuối 08:13:13Z boot=52c957d5** (`dpkg_lines=1545 md5=3411a9cc`, ổn định), **0 NEWBOOT, 0 END, 0 dòng watcher-stop** — chết giữa chu kỳ poll, đúng mẫu watcher-159 chết theo #60 (poll cuối 03:06:26Z, 0 NEWBOOT, 0 END). END 08:30:00Z chưa tới lúc chết.
  - T5-161 đã xác minh độc lập cùng kết luận (304 poll, 0 NEWBOOT, 0 END, 1 FLAG-WRITTEN, 0 EARLY-REPAIR) — **T0/T5 THỐNG NHẤT về cái chết watcher-160** (khác đợt 159, T0 từng sai suy luận — đợt này T0 không đưa ra suy luận nguyên nhân nào khác ngoài "chết theo reboot #62", khớp T5).
- **Lúc mở (~08:37Z): 0 watcher thật của đợt 160.** Quét toàn bộ `/proc/*/cmdline` theo mẫu `watch|inotify|fswatch|replay-watch|vcut-poll|test-vite-lock|vcut-vite-lock` chỉ match shell kiểm tra của chính T0 (self-match, xem F-161-T0-1) — không có process watcher thật nào của đợt 160.
- **Lúc đóng (~08:43Z): watcher-161 ĐÃ CHẠY (T5-161 khởi động, T0 không khởi động watcher nào).**
  - `replay-watch-161.sh` pid **19861**, START 08:40:01Z, boot 39d46ba0, btime (ghi) 2026-11-21 07:59:29Z, END 11:30:00Z, poll đều 30 s (log tới 08:42:01Z lúc T0 kiểm cuối).
  - `b2-watcher.sh` (T9-161) pid **3972**, START 08:37:31Z — watcher riêng của T9, hợp lệ.
  - Self-match lúc đóng: pid 20229 là shell `sleep 150` của chính lệnh kiểm tra của T0 (cmdline chứa chuỗi "replay-watch-161.log") — đã loại bằng đối chiếu cmdline đầy đủ (xem F-161-T0-1).

## §4. POSTBOOT_PASS #62: CHƯA CÓ cờ nào (T5-161 sở hữu việc tạo)

- Trên đĩa lúc mở và lúc đóng: **không có POSTBOOT_PASS cho #62 (`39d46ba0`)** — grep có mục tiêu trong `hidden_files/round160-t5/` trả 0 kết quả; thư mục `round161-t5/` (T5-161 đã mở) lúc T0 kiểm cuối cũng chưa có file POSTBOOT_PASS nào.
- Cờ mới nhất còn trên đĩa vẫn là `round160-t5/POSTBOOT_PASS`, chỉ cover **#61** (`52c957d5`, ghi 05:52:59Z, replay đầy đủ); cờ cũ `POSTBOOT_PASS-28366bd0` cover #52. Không có cờ nào cover #60 lẫn #62.
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:47Z ngày 20/11 trên boot #48, reboot #48) — sống qua **14 reboot liên tiếp** #49–#62 (đợt 160 ghi 13 reboot tới #61; nay thêm #62).
- T0 KHÔNG chạy postboot check trong đợt này (task T0-161 không yêu cầu; T5-161 sở hữu postboot). Trạng thái postboot thực tế trên #62 do T5-161 xác nhận.

## §5. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ T10-160, latest = stamped cuối)

Đối chiếu JSON T8-160 trong `hidden_files/round160-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 160 — T8-161 đã mở thư mục, xem §6):

| File | md5 (8 đầu) | Hồ sơ T10-160 | Nội dung kiểm bằng python |
|------|-------------|---------------|---------------------------|
| WebKit attempt1 `o8w-clicktest-report-2026-11-21T06-13-00-52c957d5-pid42049.json` | `e1bbe8ef…` ✓ | khớp | 21 results, 21 `ok=true` |
| WebKit attempt2 `o8w-clicktest-report-2026-11-21T06-13-54-52c957d5-pid42436.json` | `fa9d8013…` ✓ | khớp | 21 results, 21 `ok=true` |
| Chromium `o8-clicktest-report-2026-11-21T06-14-45-52c957d5-pid42835.json` | `fd0f7c37…` ✓ | khớp | 21 results, 21 `ok=true` |
| `o8w-clicktest-report.json` (latest) | `fa9d8013…` = attempt2 ✓ | byte-identical với stamped cuối | — |
| `o8-clicktest-report.json` (latest) | `fd0f7c37…` ✓ | byte-identical với stamped cuối | — |
| Các bản `...-attempt1.json` / `...-attempt2.json` / `...-chromium.json` | khớp đúng md5 stamped tương ứng ✓ | khớp | — |

Cây md5 lúc mở khớp đúng hồ sơ T10-160 lúc đóng (không đổi ngoài ý muốn):

| File (đường dẫn thật) | md5 (8 đầu) |
|------------------------|-------------|
| `apps/web/src/preview.tsx` | `530e10a7` ✓ |
| `apps/web/src/media.ts` | `2c384ed1` ✓ |
| `apps/web/vite.config.ts` | `ee80d093` ✓ |
| `server/render/src/effects.js` | `fedc0141` ✓ |

- O8 JSON đợt 160 thuộc boot #61 (52c957d5) — nay boot đã là #62 ứng viên, nhưng file JSON không đổi: T0 chỉ xác minh tính toàn vẹn, không chạy lại O8.

## §6. O8 live: KHÔNG chạy — theo task, T8-161 sở hữu O8 chính thức

- Task T0-161 chỉ yêu cầu **kiểm** cơ chế O8 JSON (§5), không chạy O8 chính thức.
- T8-161 đã mở trước lúc T0 đóng: thư mục `hidden_files/round161-t8/` đã tồn tại (cùng các thư mục round161-t1/t2/t4/t5/t6/t9 khác).
- T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với T8-161.
- Đồng hồ wall cell lúc mở đợt 161: **CHUẨN (±1 s so với Cloudflare)** — giao T2-161 (chi tiết dưới, thay cho §4 của T0-160 vì §4 nay là POSTBOOT):

| Lần đo | Local (bracket) | Cloudflare Date | GitHub Date | Đọc |
|--------|----------------|-----------------|-------------|-----|
| 08:37Z | epoch 1795250253,54–1795250255,00 | 08:37:35 GMT, epoch 1795250255 (+0,00 đến +1,46 s so với bracket — trong độ trễ request) | — | local ≈ Cloudflare |
| 08:37Z | epoch 1795250255,01–1795250255,91 | 08:37:36 GMT, epoch 1795250256 (+0,09 đến +0,99 s) | — | local ≈ Cloudflare |
| 08:37Z | epoch 1795250255,91–1795250256,61 | — | 08:37:29 GMT, epoch 1795250249 (−6,91 đến −7,61 s) | GitHub lệch −7 s (edge lag, xem dưới) |

- **Kết luận:** đồng hồ wall local (boot mới) khớp Cloudflare trong ±1 s lúc 08:37Z — **không còn dấu hiệu chạy nhanh như đợt 156**. Caveat: đo này chỉ chứng minh đồng hồ mới ĐÚNG LÚC ĐO — không chứng minh nó đúng lúc boot (xem §2.3: H2 cho rằng nó từng chậm ~14 phút rồi được sửa trước lúc đo).
- **Cảnh báo phương pháp (lặp lại từ đợt 158/159/160):** GitHub Date header lệch −6,9 đến −7,6 s trong khi Cloudflare khớp local — cùng mẫu −7,05 s (đợt 159) / −7,3 đến −7,7 s (đợt 160), do lệch giờ giữa các edge server của GitHub, không phải do đồng hồ local nhảy. **Không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-161 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên.
- Uptime math khớp btime ghi tới ~0,5 s (3 lần đọc §1) → btime ghi và uptime nhất quán nội bộ (trong khung giờ ghi).

## §7. Sai số của chính mình (F-161-T0-n)

- **F-161-T0-1 — quét watcher match chính lệnh kiểm tra (lặp lại F-160-T0-1 / F-159-T0-2):** lần quét `/proc` đầu match shell `bash -c` của chính lệnh đó (cmdline chứa chuỗi "replay-watch" trong phần echo); lần quét lúc đóng match shell `sleep 150` của chính T0 (pid 20229, cmdline chứa "replay-watch-161.log"). Cả hai đã loại bằng đối chiếu cmdline đầy đủ + quét lại bằng python (loại pid của chính tiến trình quét) → kết luận đúng (0 watcher đợt 160 lúc mở; watcher-161 pid 19861 + b2-watcher pid 3972 lúc đóng). Bài học giữ nguyên: mọi match của pgrep/ps phải đối chiếu cmdline đầy đủ và loại self-match trước khi ghi số.
- **F-161-T0-2 — suýt chốt btime ghi là giờ thật chỉ từ 7 nguồn:** 7 nguồn §1 đều khớp btime ghi 07:59:29Z — theo đúng mẫu mọi đợt trước, T0 suýt kết luận "reboot sau T10-160 đóng 3'16"". Chỉ khi đối chiếu poll cuối watcher-160 (08:13:13Z) mới lộ xung đột 824 s; đã đào thêm nguồn DB host-side (§2.2) mới có bằng chứng phân định. Bài học: luôn đối chiếu poll cuối watcher cũ với btime mới TRƯỚC khi chốt giờ reboot — 7 nguồn trong cell đều chung một đồng hồ nên không độc lập về giờ thật.
- **F-161-T0-3 — dmesg không đọc được:** `dmesg: read kernel buffer failed: Operation not permitted` — không tính làm nguồn xác minh boot; 7 nguồn còn lại đã đủ (≥5 theo task).
- **F-161-T0-4 — ĐÃ TRÁNH grep toàn cây (F-160-T0-3):** kiểm POSTBOOT_PASS #62 chỉ bằng grep có mục tiêu trong `round160-t5/` + `ls round161-t5/` (0 kết quả nhanh), không quét toàn cây `hidden_files/`. Ghi nhận là ĐÃ TRÁNH.
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung.

## §8. Bàn giao / nợ mở đợt 161

1. **Parent:** xác nhận số hiệu reboot ứng viên **#62** (boot 39d46ba0, btime ghi 07:59:29Z, giờ thật ước tính ~08:13:30Z) — T0 chỉ ghi ứng viên, chưa phải số hiệu chính thức.
2. **T10-161: PHÁN H1 vs H2 (§2.3)** — T0 chọn H2 (btime thật ~08:13:30Z, offset +841 s) từ bằng chứng DB; T5-161 chọn H1 (btime ghi là thật, đồng hồ cũ nhanh ≥ +824 s) từ "không có NTP trong cell". Kiểm journal đơn điệu KHÔNG phân định được (xem §2.3). T10 phán trước khi T2-161 chốt mốc mù #93? đoạn L.
3. **T2-161:** mù #77?/#88?/#93? + thu hẹp cửa (m) #56 lần thứ tư + mô hình đồng hồ — dữ liệu mới §2 + §6 (local ≈ Cloudflare ±1 s lúc 08:37Z; GitHub −7 s). Đoạn L mù #93? phải nêu rõ dùng btime thật hay ghi (xem §2.4). INSIDE chuỗi (chuỗi FULL PASS đang 2 sau quyết (c) đợt 160 — #62 INSIDE dải nào? T2 tính với btime thật).
4. **T5-161:** viết POSTBOOT_PASS #62 (chưa có cờ — §4); watcher-161 đã chạy (pid 19861, END 11:30:00Z); theo dõi replay #62 (dpkg mới bắt đầu boot+36m11s theo giờ ghi — muộn nhất từ trước: #59 boot+35s, #61 boot+9m50s).
5. **T7-161:** kết cục run 160 (run SUCCEEDED 08:03:36.487Z theo DB — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ: margin, viết lại, slot HB/DR) + điểm (m) #62 (0 run đang chạy tại btime thật? 0 requeue?).
6. **T8-161:** O8 chính thức (đã mở thư mục; T0 chỉ kiểm tĩnh §5, không chạy song song) + checklist (o) + dọn socket X11 (F-160-T10-4: X193/X194/X195).
7. **T6-161:** prune lần 36 (tổng lock 101 lúc T10-160 đóng).
8. **T10-161:** tổng hợp — lưu ý (a) T0-161 không chạy postboot check (ngoài task), khác T0-158 có §4 postboot; (b) **đối chiếu chéo: T5-161 ghi tuổi boot #61 "8.620 s (~2h23m40s)" — sai số học 600 s** so với chính hai mốc T5 nêu (05:25:49Z → 07:59:29Z = 9.220 s; theo giờ thật ~08:13:30Z = 10.061 s) — T10 kiểm lại khi dùng số tuổi boot; (c) reboot #62 xảy ra GIỮA hai đợt theo giờ thật (sau T10-160 đóng ~10'45", trước đợt 161 mở ~22'21"), không phá lượt đo nào trong đợt 160.

## §9. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND161_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round161-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t0/NOTES.md` (số liệu thô: btime/uptime/journal/wtmp, Cloudflare brackets, watcher-log gap analysis, DB query run 160/161).
