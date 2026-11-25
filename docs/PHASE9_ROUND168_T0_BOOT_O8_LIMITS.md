# PHASE9 ROUND 168 — T0: Boot survey + O8 JSON (BOOT MỚI 576ca271 — ỨNG VIÊN REBOOT #75, btime 05:32:46Z; RUN 167 SUCCEEDED 05:26:04Z THEO DB — KẾT CỤC THUỘC T7-168; O8 check-only, T8-168 sở hữu O8 chính thức)

- Lượt cron 12:35 +07 22/11/2026 = 05:35:51Z. T0 mở ~05:39Z, đóng ~05:42Z.
- Hạn cờ ~08:00Z, hạn cứng đóng đợt 08:30Z 22/11/2026. KHÔNG PUSH (chỉ stage).
- `round-in-progress.md`: KHÔNG tồn tại lúc mở — không có đợt main-chat đang chạy, gate qua.
- T0 không chạm code, không chạy vite/playwright, không khởi động watcher, không viết POSTBOOT_PASS, không chạy O8 live.

## §1. Kết luận boot: CÓ reboot mới — boot lúc mở là 576ca271, btime 1795325566 = 05:32:46Z, ỨNG VIÊN reboot #75 (9 nguồn khớp, KHÔNG nghịch lý đồng hồ)

Boot lúc mở **KHÁC** boot lúc T10-167 đóng (194efd93, #74): **576ca271, btime 1795325566 = 05:32:46Z** — CÓ reboot mới kể từ khi T10-167 đóng sổ (05:23:51Z), xảy ra ~3 phút trước khi đợt mở. 9 nguồn đều khớp btime (bảng dưới):

| # | Nguồn | Giá trị | Khớp btime? |
|---|-------|---------|-------------|
| 1 | `/proc/stat` btime (nguồn btime DUY NHẤT — quyết (e) đợt 156) | `1795325566` = 05:32:46Z | ✓ |
| 2 | `boot_id` (`/proc/sys/kernel/random/boot_id`) | `576ca271-c659-4baa-8523-78b9e72297a7` | ✓ (mở và đóng cùng boot — KHÔNG reboot trong phiên T0; kiểm lại lúc đóng 05:41:25Z: cùng boot_id, cùng btime) |
| 3 | `uptime` chính xác (`/proc/uptime`, 3 lần đọc bracket) | boot_est 1795325566,13 / ,13 / ,12 (cả 3 lần giống nhau tới 0,01 s, khớp btime tới 0,12–0,13 s) | ✓ |
| 4 | journal first entry (`journalctl --list-boots`, idx 0 duy nhất) | 05:32:57Z (journal start lag +11 s sau btime — cùng họ mẫu #61/#62/#64/#65/#67/#69/#70/#72/#73 (+11/+12/+14/+15/+16 s); xem §6); `--list-boots` chỉ còn 1 boot (journal không giữ boot cũ — hạn chế lặp lại các đợt trước) | ✓ |
| 5 | wtmp / `last reboot` | 1 entry duy nhất: `reboot system boot 7.0.0-44-generic Sun Nov 22 05:32 still running`; `wtmp begins Sun Nov 22 05:32:57 2026` | ✓ |
| 6 | `/proc/1` start | 05:32:56.881630977Z (+10,9 s sau btime — cùng họ với journal +11 s; xem §6) | ✓ |
| 7 | Mốc thời gian T10-167 đóng (mốc file thực tế) | `round167-t10.done` mtime **05:23:51Z** (hoạt động cuối trên #74 trước btime); journal first entry 05:32:57Z (+11 s), dpkg.log entry đầu 05:33:26Z (boot+40s — xem §6), thư mục `round168-t0/` tạo ~05:41Z — đều SAU btime; cửa sổ chết của #74 theo mốc file: **(05:23:51Z, 05:32:46Z] = 535 s (8m55s)** | ✓ |
| 8 | Scheduler DB host-side (`muse.db`, `scheduler.job_runs` + `scheduler.events`) | Run 167 `succeeded` **05:26:04Z** (TRƯỚC btime #75 đúng 402 s — xem §3); run 168 `running` từ 05:35:51Z, 1 event duy nhất `dispatched`, `worker_boot_generation` mới `cron_boot_8a3b5a79…` (khác run 167 `cron_boot_25cde4f3…`) | ✓ |
| 9 | Đồng hồ wall lúc mở vs Cloudflare | local ≈ Cloudflare ±1 s lúc ~05:40Z (2 lần đo curl, xem §6) | ✓ |

- **Số hiệu: #75 — ỨNG VIÊN theo đếm tuần tự (sau #74 194efd93), CHỜ PARENT XÁC NHẬN.** T0 ghi số hiệu ứng viên, không tự xác nhận số hiệu (quy tắc đứng: parent xác nhận số hiệu reboot).
- `dmesg` KHÔNG đọc được đợt này (EPERM — `read kernel buffer failed: Operation not permitted`, như các đợt trước — không tính làm nguồn; 9 nguồn trên đã đủ, không cần dmesg).
- **dpkg.log (nguồn phụ) — CÙNG HỌ #73, KHÁC MẪU #69/#70/#74: chỉ 2 dòng, md5 `dbdf981a`, cả hai 05:33:26Z (boot+40s), KHÔNG có burst 1.545 dòng lúc T0 đóng (boot+9m).** Các boot #69/#70/#74 burst bắt đầu boot+35–38s và xong trong boot+163–167s; #73 tới boot+11m vẫn chỉ 2 dòng (boot+458s). Đợt này tới boot+9m vẫn chỉ 2 dòng "startup packages configure" (boot+40s — sớm hơn #73). T0 chỉ giao số liệu thô, KHÔNG suy đoán cơ chế — T5-168 sở hữu diễn giải (xem §4/§6). Không loại trừ burst chạy muộn sau khi T0 đóng.
- Tuổi boot: **#74 sống 5.237 s (1h27m17s)** = 05:32:46Z − 04:05:29Z; **#73 sống 5.848 s (1h37m28s)** = 04:05:29Z − 02:28:01Z (kiểm lại khớp T10-167, KHÔNG lặp lỗi 2.248 s của T5-167); **#72 sống 1.376 s (22m56s)** — vẫn ngắn nhất chuỗi gần đây. Gap #74→#75 = **5.237 s**.
- Hệ quả: mọi watcher/process của đợt 167 trước 05:32:46Z đều đã chết theo boot mới — NGOẠI TRỪ watcher-167 lần 2 đã tự kết thúc theo lịch 05:30:10Z, TRƯỚC btime #75 2m36s (xem §4); mọi timestamp wall trong đợt 168 đều thuộc boot 576ca271.

## §2. Reboot #74 (194efd93, btime 04:05:29Z): ĐÃ ĐƯỢC XÁC MINH 9 NGUỒN TRONG PHIÊN BỞI T7-167 — T0-168 KHÔNG XÁC MINH LẠI TỪ BOOT #75

Parent đã XÁC NHẬN số hiệu #74 ở quyết (d) đợt 167. T7-167 xác minh 9 nguồn trong phiên (aggregate 167 §10.5 (vi) + quyết (d)). T0-168 không lặp lại xác minh bổ sung kiểu T0-167 làm cho #72 — vì #74 đã có hồ sơ 9 nguồn đầy đủ trong phiên, không phải chỉ 4 nguồn như #72 lúc T10-166 đóng. T0 chỉ ghi nhận các mốc bền còn đọc được từ boot #75 để đối chiếu:

| # | Nguồn | Trạng thái với #74 | Bằng chứng còn lại |
|---|-------|---------------------|---------------------|
| 1 | `/proc/stat` btime | ✓ ĐỒNG THỜI (T7-167) | `1795320329` = 04:05:29Z, theo aggregate 167 |
| 2 | `boot_id` | ✓ ĐỒNG THỜI (T7-167) | `194efd93-ef9b-44e9-b570-0b161c71a080`, theo aggregate 167 + POSTBOOT_PASS #74 |
| 3 | `uptime` | ✓ ĐỒNG THỜI (T7-167) | theo aggregate 167 |
| 4 | journal first entry | ✓ ĐỒNG THỜI (T7-167) | theo aggregate 167 |
| 5 | wtmp / `last reboot` | ✓ ĐỒNG THỜI (T7-167) | theo aggregate 167 |
| 6 | `/proc/1` start | ✓ ĐỒNG THỜI (T7-167) | theo aggregate 167 |
| 7 | Mốc file thực tế | ✓ HỒI CỨU (T0-168, từ mtime bền trên đĩa) | Hoạt động cuối trên #74: `round167-t10.done` 05:23:51Z; hoạt động đầu trên #75: journal 05:32:57Z. Cửa sổ chết #74: **(05:23:51Z, 05:32:46Z] = 535 s** |
| 8 | Scheduler DB host-side | ✓ HỒI CỨU (T0-168, DB host-side độc lập cell) | Requeue run 167 eid 9955 lúc **04:06:15.242Z = btime #74 +46,242 s** (detail "daemon startup recovery"); run 167 `succeeded` 05:26:04Z — xem §3 |
| 9 | Đồng hồ wall vs Cloudflare | ✓ ĐỒNG THỜI (T7-167) | theo aggregate 167 |

- **Kết luận T0 về #74:** hồ sơ 9 nguồn đã đầy đủ từ trong phiên (T7-167); 2 nguồn hồi cứu của T0-168 (mốc file + DB) khớp, không xung đột. T0 **KHÔNG** claim xác minh lại 9 nguồn cho #74 — chỉ đối chiếu 2 nguồn bền. Parent không cần quyết lại số hiệu #74 (đã xác nhận quyết (d) đợt 167).
- **Caveat khung giờ:** T0-168 không có dữ kiện watcher-poll nào để kiểm lệch khung giờ tại biên #73/#74 (12 s theo T5-167) — giao T2-168 theo quyết (e) đợt 167. Watcher-167 lần 2 kết thúc theo lịch 05:30:10Z (xem §4), không có poll nào gần biên #74/#75 để đối chiếu khung giờ — **T0 không phán lệch khung tại biên #74/#75**; nếu T5-168 có dữ kiện poll thì giao T2-168.

## §3. Run 167 SUCCEEDED 05:26:04Z theo DB — KẾT CỤC THUỘC T7-168; #75 KHÔNG VIẾT LẠI RUN 167 (0 requeue)

Truy vấn chỉ-đọc `muse.db` (`scheduler.job_runs` + `scheduler.events`, job `vcut-build-loop`), đọc lúc ~05:40Z:

- Run 167 `ddb28fcb-7f71-48d3-bfa6-1cb07d1d155c`: scheduled **02:35:51Z**, `started_at` **04:06:15Z** (sau viết lại lần 1 tại #74), **`finished_at` 2026-11-22T05:26:04+00:00**, status **`succeeded`** (lúc đọc), attempt 1, `worker_claimed_at_utc` 1795325056 (05:24:16Z — claim lại sau viết lại lần 1), `worker_execution_timed_out` false. **Wall gốc: 10.213 s (2h50m13s)** — số thô, T7-168 phán. **Margin thô tới hạn cứng 05:35:51Z: 587 s (9m47s)**. **Claimed→finished: 108 s** — NGOÀI họ 6–11 s của run 154–163 và 165, và NGOÀI cả 64 s của run 166 — ca 60+ s thứ ba liên tiếp (run 164: 66 s, run 166: 64 s, run 167: 108 s — số thô, T7-168 phán; không suy cơ chế).
- Events run 167: **5 event** — `dispatched` eid 9933 lúc 02:35:51.065Z; **`requeued_after_restart` eid 9955 lúc 04:06:15.242Z** (detail "daemon startup recovery" — **viết lại lần 1 tại #74, btime +46,242 s** — khớp T7-167 từng ms; trong dải dương [33; 49,8]); `dispatched` eid 9956 lúc 04:06:15.343Z; `reattached_after_restart` eid 9957 lúc 04:06:15.455Z; **`succeeded` eid 9973 lúc 05:26:04.310Z**. **0 event sau succeeded** (lúc đọc).
- **Run 167 finish TRƯỚC btime #75 đúng 402 s** (05:26:04Z → 05:32:46Z) — nên **#75 KHÔNG gây viết lại nào cho run 167** (cùng mẫu #73 vs run 166: finish 61 s trước btime; lần này margin 402 s, rộng hơn). **#75 KHÔNG PHẢI ĐIỂM (m) theo dữ kiện thô:** 0 requeue tại #75; run 167 đã xong trước btime; run 168 start 185 s sau btime — T7-168/T2-168 phán chính thức, T0 không phán.
- Run 168 `a3642ec4-8a8e-4da3-82d5-290879a3003e`: scheduled/started 05:35:51Z, status `running` (lúc đọc), `worker_boot_generation` `cron_boot_8a3b5a79d1c047979b835fad406ab596` — **generation mới trên #75** (khác run 167 sau viết lại `cron_boot_25cde4f3b1014b418d4ab9b46279685c`); events: **1 event duy nhất** `dispatched` eid 9975 lúc 05:35:51.091Z — **KHÔNG requeue** (khởi động sạch trên #75).
- **Suy luận duy nhất T0 được phép:** worker của run 167 báo cáo succeed lúc **thật 05:26:04Z**, sau btime #74 (04:05:29Z) **1h20m35s (4.835 s)**, trước btime #75 (05:32:46Z) 402 s, trước hạn cứng đợt 167 (05:35:51Z) 587 s. T7-167 đóng cờ 05:11:23Z với run 167 vẫn `running` — claim "chưa có kết cục" ĐÚNG lúc đóng; run finish 05:26:04Z, 14m41s sau khi T7 đóng cờ. **T0 KHÔNG phán** kết cục run 167, margin chính thức, hay điểm (m) #74/#75 — tất cả thuộc T7-168 (kết cục) và T2-168 (đối chiếu độc lập (m) #74 + (m) #75).
- Tiền đề như đợt 161/162/163/164/165/166/167: timestamp DB = giờ host thật, độc lập với đồng hồ cell (scheduler + Postgres host-side, ngoài cell VM).

## §4. Watcher: watcher-167 lần 2 KẾT THÚC THEO LỊCH 05:30:10Z (KHÔNG chết theo #75); watcher-168 CHƯA khởi động lúc T0 đóng; POSTBOOT_PASS #75 CHƯA CÓ

- **Watcher-167 lần 2 pid 4928 (T5-167, START 04:08:22Z trên boot #74): KẾT THÚC THEO LỊCH, KHÔNG chết theo reboot #75.** Log `replay-watch-167.log`: poll cuối **05:29:40Z** trên boot #74 (dpkg_lines=1545, md5=ef7480f9 — đã đủ replay), dòng cuối **`REPLAY-WATCH-167-END han cung 05:30:00Z` lúc 05:30:10Z** — watcher tự dừng khi hết hạn cung (end=05:30:00Z trong lệnh START), **2m36s TRƯỚC btime #75 (05:32:46Z)**. `ps -p 4928` lúc T0 kiểm: không còn process. **Đây là lần đầu watcher kết thúc theo lịch thay vì chết theo reboot** (các lần trước: watcher-166 chết theo #71; watcher-167 lần 1 chết theo #74, poll cuối 04:05:41Z). Hệ quả cho T2-168: **không có poll watcher nào trong cửa sổ (05:30:10Z, 05:32:46Z]** — không thể đối chiếu lệch khung giờ tại biên #74/#75 bằng watcher-poll (xem §2 caveat).
- **Watcher-168 CHƯA khởi động lúc T0 đóng:** thư mục `round168-t5/` chưa tồn tại lúc T0 kiểm (chỉ có `round168-t1/`, `round168-t2/`, `round168-t6/`, `round168-t9/` đã mở); 0 process `replay-watch` đang chạy lúc T0 mở và lúc T0 đóng. T5-168 sở hữu vận hành watcher-168 + POSTBOOT_PASS #75.
- Khoảng không-watcher: từ khi watcher-167 lần 2 kết thúc theo lịch (05:30:10Z) tới khi watcher-168 khởi động — T5-168 đo chính xác (đã dài ~11 phút lúc T0 đóng; cộng dồn với khoảng không-watcher trước đó của đợt 167: 2h32m41s + 2m41s theo aggregate 167 — T5-168 tính lại toàn bộ nếu cần).
- **POSTBOOT_PASS #74 CÒN** (`round167-t5/POSTBOOT_PASS`, ghi 04:10:23Z — replay đầy đủ, dpkg 1545 dòng) + **#70 CÒN** (`round166-t5/POSTBOOT_PASS`) + **#69 CÒN** (`POSTBOOT_PASS-9a1a9319`) + **#67 CÒN** (`round164-t5/POSTBOOT_PASS`); **#63/#66/#68/#71/#72/#73 KHÔNG CÓ** (không bù được — quyết các đợt trước); **#75 CHƯA CÓ lúc T0 đóng** (kiểm bằng `find -maxdepth 2 -name POSTBOOT_PASS*` ngay trước khi ghi cờ; T5-168 chưa mở thư mục nên chưa thể xuất hiện trước khi T0 đóng; nếu T5-168 ghi cờ ngay sau đó thì cờ T0 vẫn đúng tại thời điểm kiểm, T5 là nguồn chính thức).
- Marker persistence `~/.config/vcut-persistence-marker` **CÒN** (ghi 11:39:47Z ngày 20/11 trên boot #48, mtime không đổi) — sống qua **27 reboot liên tiếp** #49–#75 (đếm độc lập: dải bao hàm 75 − 49 + 1 = 27; T0-167 đếm 25 tới #73, T5-167 đếm 26 tới #74, thêm #75 = 27. T0-168 KHÔNG lặp lỗi T0-162 ghi 15 thay vì 16).
- T0 KHÔNG chạy postboot check trong đợt này (task T0-168 không yêu cầu; T5-168 sở hữu postboot). Trạng thái postboot thực tế trên #75 do T5-168 xác nhận.

## §5. Cơ chế O8 JSON: CÒN ĐÚNG (md5 khớp hồ sơ T10-167, 21/21 ×3, boot #74)

Đối chiếu JSON T8-167 trong `hidden_files/round167-t8/o8-webkit/` và `o8-chromium/` (không có JSON O8 mới nào được tạo từ sau đợt 167 — T8-168 chưa mở thư mục lúc T0 đóng):

| File | md5 (8 đầu) | Hồ sơ T10-167 | Nội dung kiểm bằng python |
|------|-------------|---------------|---------------------------|
| WebKit attempt1 `o8w-clicktest-report-2026-11-22T04-32-52-194efd93-pid14190.json` | `cdd09a3e…` ✓ | khớp | 21 results, 21 `ok=true`, boot 194efd93 (theo tên file) |
| WebKit attempt2 `o8w-clicktest-report-2026-11-22T04-33-56-194efd93-pid14663.json` | `69d3adbc…` ✓ | khớp | 21 results, 21 `ok=true`, boot 194efd93 (theo tên file) |
| Chromium `o8-clicktest-report-2026-11-22T04-34-55-194efd93-pid15117.json` | `b087bae6…` ✓ | khớp | 21 results, 21 `ok=true`, boot 194efd93 (theo tên file) |
| `o8w-clicktest-report.json` (latest) | `69d3adbc…` = attempt2 ✓ | byte-identical với stamped cuối | — |
| `o8-clicktest-report.json` (latest) | `b087bae6…` ✓ | byte-identical với stamped cuối | — |

- O8 JSON đợt 167 thuộc boot #74 (194efd93) — nay boot đã là #75, nhưng file JSON không đổi: T0 chỉ xác minh tính toàn vẹn, không chạy lại O8.
- Chuỗi WebKit FULL PASS đang ở **20** theo quyết (b) đợt 167 (parent XÁC NHẬN LÊN 20); T0 không tự kết luận chuỗi đợt 168 — parent quyết cuối sau khi có kết quả T4-168 + O8 T8-168 (quy tắc đứng: chuỗi chỉ lên khi CÓ lượt yên hợp lệ trong đợt + O8 chạy sau về thời gian TRÊN CÙNG BOOT đo + gate FOUND chuẩn).

## §6. O8 live: KHÔNG chạy — theo quy ước đợt 162/163/164/165/166/167, T8-168 sở hữu O8 chính thức; lượt yên đợt 168 CHƯA CÓ kết quả lúc T0 đóng

- Task T0-168 yêu cầu **kiểm tra sẵn sàng O8, KHÔNG tự phán chuỗi** — T0 giữ quy ước check-only (T0-162 §6: T0 kiểm tĩnh JSON, T8 sở hữu O8 live; T0 không chạy vite/playwright để tránh va chạm cổng/lock với T8). T0-168 giữ nguyên: chỉ đối chiếu tĩnh §5, không chạy O8 live.
- T8-168 chưa mở thư mục lúc T0 đóng. T1/T2/T6/T9-168 đã mở thư mục. T0 không chạy vite/playwright lần nào trong đợt này → không va chạm cổng/lock với T8-168.
- **Lượt yên đợt 168: CHƯA CÓ kết quả lúc T0 đóng.** T4-168 chưa mở thư mục; **0 cờ `.done` nào của đợt 168 tồn tại lúc T0 đóng** (T0 là cờ đầu tiên). T0 KHÔNG tự kết luận chuỗi WebKit FULL PASS — chỉ đề xuất sau khi có kết quả T4-168 + O8 T8-168; **parent quyết cuối**.
- Đồng hồ wall cell lúc mở đợt 168: **CHUẨN (±1 s so với Cloudflare)**:

| Lần đo | Local (bracket) | Cloudflare Date | Đọc |
|--------|----------------|-----------------|-----|
| ~05:40Z (curl try0) | epoch 1795326003,48–1795326004,55 | 05:40:05 GMT, epoch 1795326005 (CF trước local +0,45 đến +1,52 s so với bracket — trong độ trễ request + cắt giây) | local ≈ Cloudflare |
| ~05:40Z (curl try1) | epoch 1795326004,58–1795326005,04 | 05:40:05 GMT, epoch 1795326005 (CF trước local +0,00 đến +0,42 s) | local ≈ Cloudflare |

- **Cảnh báo phương pháp (lặp lại từ đợt 158/159/160/161/162/163/164/165/166/167):** GitHub Date header dao động giữa các edge server — **không dùng GitHub Date làm chuẩn giờ tuyệt đối.** T2-168 sở hữu mô hình đồng hồ; T0 chỉ giao số liệu thô trên. Caveat: CF Date cắt tới giây nên biên trên của try0 (+1,52 s) chứa thành phần cắt giây + độ trễ request; cả hai lần đo đều nhất quán với local chậm hơn Cloudflare ~0–0,5 s.
- Uptime math khớp btime tới 0,12–0,13 s (3 lần đọc §1, boot_est .13/.13/.12); btime là floor của giây boot — 0,13 s nằm trong 1 s làm tròn, không phải lệch. Journal boot mới đơn điệu: 79 entry, 0 bước nhảy âm, gap lớn nhất 69,82 s (timer 1 phút, bình thường — cùng họ 69,86 s của #73), 0 gap >120 s — không có dấu hiệu sửa đồng hồ sau boot.
- **Độ lệch nhỏ ghi nhận (không phải nghịch lý):** journal first entry +11 s và `/proc/1` +10,9 s sau btime — cùng họ mẫu +11/+12/+14/+15/+16 s của #61/#62/#64/#65/#67/#69/#70/#71/#72/#73/#74, mọi nguồn khác khớp btime; không có xung đột nào cần phán H1/H2.
- `/tmp/.X11-unix/` **TRỐNG** lúc T0 mở và lúc T0 đóng (~05:39–05:41Z, 0 socket — 3 socket X193/X194/X195 của T5-165 đã bị reboot #70 xóa; không socket mới nào xuất hiện trên #73/#74/#75).
- **dpkg.log (ghi nhận thô cho T5-168) — CÙNG HỌ #73:** reset theo boot nhưng chỉ **2 dòng, md5 `dbdf981a`**, cả hai 05:33:26Z (boot+40s, "startup packages configure") — **KHÔNG có burst 1.545 dòng** như #69 (boot+35s→boot+167s), #70 (boot+38s→boot+163s) và #74 (đủ 1.545 dòng lúc 05:05:36Z, boot+~61m) lúc T0 đóng (boot+9m). T5-168 sở hữu diễn giải (T0 không suy đoán cơ chế; không loại trừ burst chạy muộn sau khi T0 đóng). Lưu ý: #73 cũng chỉ 2 dòng tới boot+11m (boot+458s) — đợt này mới boot+9m, chưa tới mốc so sánh đó.

## §7. Sai số của chính mình (F-168-T0-n)

- **F-168-T0-1 — Gõ sai epoch scheduled_for run 167 trong phép kiểm nháp (1795313751 thay vì 1795314951).** Phép kiểm phụ trong python đầu dùng sai epoch → wall run 167 ra 11.413 s (sai). Bắt được ngay (lệnh `date -d @1795314951` trả 02:35:51Z đúng scheduled_for), tính lại đúng: wall = 10.213 s (2h50m13s) ✓. Không có output nào đã ghi bị ảnh hưởng (mọi số khác tính từ btime/epoch đã verify bằng `date -d`). Bài học (lặp lại F-167-T0-1): epoch nào cũng verify bằng `date -d` trước khi dùng làm số hạng.
- **F-168-T0-2 — Lệnh kiểm cuối `ls round168-*.done` exit 2 do không có file nào.** Không phải lỗi kiểm tra — 0 cờ đợt 168 lúc T0 đóng là kết quả đúng (T0 là cờ đầu tiên). Ghi nhận để T10-168 khỏi nhầm là lỗi lệnh (cùng họ F-165-T0-2/F-166-T0-2/F-167-T0-2).
- **F-168-T0-3 — ĐÃ TRÁNH lỗi làm tròn uptime (F-162-T0-5/F-163-T0-3/F-164-T0-3/F-165-T0-3/F-166-T0-3/F-167-T0-3):** chỉ dùng 3 lần đọc bracket bằng python có phần thập phân cho phép toán uptime−epoch (boot_est 1795325566,13/.13/.12 cả 3 lần); không dùng `date +%s` nguyên giây cho phép toán này.
- **F-168-T0-4 — ĐÃ TRÁNH grep toàn cây (F-160-T0-3/F-163-T0-4/F-164-T0-4/F-165-T0-4/F-166-T0-4/F-167-T0-4):** kiểm POSTBOOT_PASS chỉ bằng `find -maxdepth 2 -name POSTBOOT_PASS*` (không quét toàn cây `hidden_files/`).
- **F-168-T0-5 — ĐÃ TRÁNH đếm marker sai (quyết (q) đợt 162 / quyết (q) đợt 163):** đếm độc lập dải bao hàm 75 − 49 + 1 = 27, đối chiếu với T0-167 đếm 25 tới #73 + T5-167 đếm 26 tới #74 + #75 = 27 — không cộng dồn bằng trí nhớ.
- **F-168-T0-6 — ĐÃ TRÁNH tuổi boot ghi nháp sai (F-164-T0-1/F-166-T0-6/F-167-T0-6):** mọi tuổi boot đều tính lại bằng phép trừ epoch (gap #74→#75 = 5.237 s; tuổi #74 = 5.237 s; tuổi #73 = 5.848 s) trước khi viết LIMITS — trừ phép kiểm nháp F-168-T0-1 đã bắt được.
- Không có sai số nào khác. Không chạy lệnh repair, không ghi cờ của thread khác, không chạm file chung. Không ghi vào `build-loop-log.md` (theo tiền lệ T0-161/T0-162/T0-163/T0-164/T0-165/T0-166/T0-167 — log lượt thuộc về T10-168 khi tổng hợp, tránh ghi chồng chéo với 8–10 luồng cùng lúc).

## §8. Bàn giao / nợ mở đợt 168

1. **Parent:** (a) T0-168 ghi nhận **boot mới 576ca271, btime 05:32:46Z — ỨNG VIÊN reboot #75, chờ parent xác nhận số hiệu** (9 nguồn khớp, không nghịch lý đồng hồ); gap #74→#75 = **5.237 s (1h27m17s)**; (b) **#74: hồ sơ 9 nguồn đã đầy đủ từ trong phiên (T7-167) — T0-168 chỉ đối chiếu 2 nguồn bền (mốc file + DB), khớp, không xung đột — không cần quyết lại số hiệu** (đã xác nhận quyết (d) đợt 167); (c) **run 167 SUCCEEDED 05:26:04Z** (5 event, 1 lần viết lại tại #74 +46,242 s — trong dải [33; 49,8]; wall 10.213 s; margin thô tới hạn cứng 587 s; claimed→finished 108 s — ca 60+ s thứ ba liên tiếp sau 66 s run 164 và 64 s run 166) — kết cục + (m) #74 thuộc T7-168/T2-168, T0 không phán; (d) **#75 KHÔNG viết lại run 167** (finish 402 s trước btime; 0 requeue tại #75 — dữ kiện thô cho thấy KHÔNG PHẢI ĐIỂM (m), T7/T2 phán chính thức); (e) marker **27 reboot #49–#75** (đếm độc lập); (f) **watcher-167 lần 2 KẾT THÚC THEO LỊCH 05:30:10Z, không chết theo #75** — lần đầu watcher kết thúc theo lịch; không có poll watcher trong cửa sổ (05:30:10Z, 05:32:46Z] nên không đối chiếu lệch khung tại biên #74/#75 bằng watcher-poll; (g) dpkg.log #75 cùng họ #73 (chỉ 2 dòng lúc T0 đóng) — T5-168 diễn giải.
2. **T10-168:** lưu ý (a) **CÓ reboot mới kể từ khi T10-167 đóng sổ** — boot lúc mở đợt 168 (576ca271) KHÁC boot lúc T10-167 đóng (194efd93); KHÔNG nghịch lý đồng hồ đợt này — khác #62, không cần phán H1/H2/OVERLAP; btime #75 dùng trực tiếp (sau khi parent xác nhận số hiệu); (b) **run 167 SUCCEEDED 05:26:04Z theo DB** (5 event, 1 lần viết lại — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ); (c) **watcher-167 lần 2 kết thúc theo lịch 05:30:10Z** (không chết theo #75); **watcher-168 CHƯA khởi động** lúc T0 đóng; (d) marker **27 reboot #49–#75** (đếm độc lập, không lặp lỗi T0-162); (e) **dpkg.log #75 chỉ 2 dòng** (boot+40s, md5 dbdf981a — cùng họ #73, KHÔNG burst như #69/#70/#74) — T5-168 diễn giải; (f) cửa sổ mốc file cho cái chết của #74 là (05:23:51Z, 05:32:46Z] = 535 s — T0 ghi nhận trung thực, không thu hẹp bằng suy đoán.
3. **T2-168:** mù #77?/#88?/#94?/#95?/#96? + **INSIDE cho #74** (dải FULL120 neo 02:28:01Z — giao đợt 167; chuỗi mới từ #73 nếu INSIDE) + **INSIDE cho #75** (dải FULL121 neo 04:05:29Z — T2 tính; chuỗi mới từ #73 tiếp tục nếu INSIDE cả #74 lẫn #75) + mô hình đồng hồ — dữ liệu mới §2 + §6 (local ≈ Cloudflare ±1 s; journal +11 s, /proc/1 +10,9 s cùng họ mẫu) + **đối chiếu độc lập (m) #74** (requeue +46,242 s ∈ [33; 49,8] theo btime; parent quyết (f) đợt 167 đã GHI NHẬN ứng viên — nếu chấp nhận: n 26→27 / 27→28) + **đối chiếu độc lập (m) #75** (0 requeue; run 167 finish 402 s trước btime; run 168 start 185 s sau btime — dữ kiện thô cho thấy KHÔNG PHẢI ĐIỂM, T2 phán chính thức) + **kiểm lệch khung tại biên #73/#74 (12 s theo T5-167)** theo cùng mẫu T5-165 §4.2 / T5-166 §4.2 + hole-recheck #88? lần 12 + theo dõi mù #96?/#95?/#94?/#77? + **ghi chú đứng về dải (m) 33–49,8 s theo offset btime-tương đối (quyết (e) đợt 165 — T2-168 ghi vào LIMITS)** + lưu ý watcher-167 lần 2 kết thúc theo lịch nên **không có poll watcher tại biên #74/#75** để đối chiếu lệch khung (xem §4).
4. **T5-168:** viết POSTBOOT_PASS #75 (CHƯA CÓ lúc T0 đóng ~05:42Z) + vận hành watcher-168 (chưa khởi động lúc T0 đóng) + theo dõi replay #75 (dpkg chỉ 2 dòng lúc T0 đóng — CÙNG HỌ #73, xem §6) + POSTBOOT_PASS #71/#72/#73 (CHƯA CÓ — không bù được) + điều tra #73 postboot FAIL thiếu 4 gói gstreamer (nợ từ đợt 167, nguyên nhân gốc CHƯA xác định).
5. **T7-168:** kết cục run 167 (DB ghi `succeeded` 05:26:04Z, 5 event, 1 lần viết lại — T0 chỉ dùng làm bằng chứng đồng hồ; T7 phán verdict đầy đủ: margin 587 s thô tới hạn cứng, slot HB/DR, claimed→finished 108 s — ca 60+ s thứ ba liên tiếp sau 66 s run 164 và 64 s run 166, chỉ ghi nhận không suy cơ chế) + điểm (m) #74 (requeue +46,242 s trong dải theo btime; T7 phán chính thức, T2 đối chiếu) + điểm (m) #75 (0 requeue; run 167 finish 402 s trước btime — dữ kiện thô cho thấy KHÔNG PHẢI ĐIỂM, T7 phán chính thức). Lưu ý T7: run 167 chỉ bị viết lại 1 lần (tại #74); #75 không viết lại run 167 (khác #71/#72 viết lại run 166; cùng mẫu #73 không viết lại run 166).
6. **T8-168:** O8 chính thức (chưa mở thư mục lúc T0 đóng; T0 chỉ kiểm tĩnh §5, không chạy song song) + checklist (o) + giữ nguyên (1c) (c') theo quyết (i) đợt 167 — không cần quyết lại trừ khi có FP + H3 chỉ giám sát thụ động + X11 (đang TRỐNG).
7. **T6-168:** prune lần 43.
8. **T10-168:** tổng hợp — lưu ý chuỗi WebKit FULL PASS đang ở **20** theo quyết (b) đợt 167 (parent XÁC NHẬN LÊN 20); chuỗi chỉ lên 21 khi T4-168 có lượt yên hợp lệ trong đợt + O8 T8-168 chạy sau về thời gian TRÊN CÙNG BOOT 576ca271 + gate FOUND chuẩn — **T0 không tự kết luận, parent quyết cuối**.

## §9. Stage

- 1 file LIMITS này: `docs/PHASE9_ROUND168_T0_BOOT_O8_LIMITS.md`.
- Stage file: `~/workspace/repo-1-push/paths-loop/phase9-round168-t0-boot-o8.txt` (1 entry NUL-delimited; đã kiểm bằng `od -c`).
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round168-t0.done` (có nội dung).
- File làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round168-t0/NOTES.md` (số liệu thô: btime/uptime/journal/wtmp, Cloudflare brackets, watcher-log, DB query run 167/168).
