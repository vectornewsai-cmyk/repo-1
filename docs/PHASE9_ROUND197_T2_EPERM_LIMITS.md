# PHASE9 ROUND197 T2 EPERM LIMITS — EPERM probe + (m)/INSIDE + mù + sổ vi phạm

Đợt 197 mở lượt cron 03:35:51 +07 27/11/2026 (20:35:51Z 26/11, run 204). Luồng T2 đóng cờ ~21:55Z 26/11 (trong hạn cờ ~23:00Z, trước hạn cứng 23:35:51Z). Nguồn đối chiếu: aggregate 196 bản parent-đã-đính-chính (84.800 B, §14.2 nguồn gốc CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18) + LIMITS T2-196 + appendix T01-197 + LIMITS T7-197 (Phần 1) + chain-t4.log/classb T4-197 + DB tươi (muse.db) + log đĩa. Mọi epoch đã kiểm bằng script/`date -d`, không tính nhẩm (xem F-197-T2-4). KHÔNG PUSH. Chỉ đọc DB/log, không sửa dữ liệu nguồn.

## §1. (m) CUỐI — #123 KHÔNG CÓ ĐIỂM, #124 DƯƠNG; #125 THÔ 0

- **(m) #123 (bc09b26e, btime 14:30:16Z) — KHÔNG CÓ ĐIỂM (CUỐI).** Cửa [14:30:16Z, 14:35:51Z): 5 event, TẤT CẢ lúc 14:35:40.437–14:35:40.671Z (batch hồi phục sau lặng #B: reconciled eid 11352 + dispatched ×2 + succeeded ×2). 0 event trong [14:30:16Z, 14:32:39Z] (bao cửa (m) [14:30:49Z, 14:31:05.8Z]); **0 requeue**. Không run nào sống tại btime (run 201 xong 11:47:31Z; run 202 dispatch 14:35:51Z). n ứng viên GIỮ 54/55.
- **(m) #124 (611a02f2, btime 16:28:18Z) — DƯƠNG (CUỐI).** Cửa [16:10:00Z, 16:35:00Z): 6 event. Trước btime cuối: eid 11382 succeeded heartbeat 16:15:34.686Z. Sau btime đầu: **eid 11383 requeued_after_restart, run 202 (b182d011), 16:29:07.120671Z = btime +49.120671 s, trong [btime+33, btime+49.8], cách biên trên chỉ 0.679 s**; rồi dispatched eid 11384 + reattached eid 11385 (16:29:07.257Z). Khoảng lặng 16:15:34.686Z→16:29:07.121Z = 812.434 s. **Chỉ 2 requeue trong toàn bộ 26/11:** eid 11258 (04:24:12.008Z, (m) #120) và eid 11383 ((m) #124) — T01-197 kiểm lại độc lập cũng chỉ 2. n ứng viên **54/55 → 55/56** (+1/+1; 7 tiền lệ đợt 184–191). n chính thức GIỮ 14 (parent quyết).
- **(m) #125 (8304fcd1, btime 20:27:48Z) — THÔ 0 requeue.** Cửa [20:27:48Z, 20:35:51Z): 5 event, TẤT CẢ lúc 20:35:38.103–20:35:38.301Z (batch hồi phục sau lặng #C). 0 event trong [20:27:48Z, 20:30:11Z] (bao cửa (m) [20:28:21Z, 20:28:37.8Z]); **0 requeue**. Không run nào sống tại btime (run 203 xong 18:04:07Z; run 204 dispatch 20:35:51Z). Phân loại CUỐI thuộc T2-198.
- Caveat HB 16:20:50Z: heartbeat run 92544abd sched 16:20:50Z thực tế started 16:15:34Z (mẫu đứng sched−316 s) — KHÔNG chứng minh daemon sống lúc 16:20:50Z; khoảng lặng 812 s đứng nguyên.

## §2. INSIDE — B-#123 TRUE, B-#124 FALSE; đếm A KHÔNG TÍNH ĐƯỢC

Script `m-check197.py` (nối `m-check196.py`, FULL168) — exit 0, mọi assert PASS. FULL167 p10/p90 1676.60/10673.40 s và FULL168 1678.20/10939.20 s khớp T2-196 từng số.
- **FULL169:** n=169, mean 1h49'27", median 1h57'21", p10 1679.80 s, p90 10919.80 s.
- **FULL170:** n=170, mean 1h50'13", median 1h57'22", p10 1681.40 s, p90 11078.70 s.
- **B-#123 TRUE:** boot #124 (16:28:18Z) trong band [14:58:14Z, 17:32:35Z] (FULL168, neo 14:30:16Z); biên dưới +5.404 s, biên trên −3.857 s (chính xác 5.403,8 / 3.857,2 s). Chuỗi B: 0 → 1 (sau B-#122 FALSE đã reset về 0).
- **B-#124 FALSE:** boot #125 (20:27:48Z) muộn 3.451 s qua biên cuối band 19:30:17Z (FULL169, neo 16:28:18Z; chính xác 3.450,2 s). Chuỗi B: 1 → 0 (nếu parent chấp nhận B-#123 trước).
- **Đếm A: KHÔNG TÍNH ĐƯỢC** (thiếu btime #106) — chuỗi GIỮ 7.
- Tốc độ reboot: tới #123: 198 / 378,2 h = 1 / 114,6 phút; tới #124: 199 / 380,17 h = 1 / 114,6 phút; tới #125cand: 200 / 384,16 h = 1 / 115,2 phút. Gap: #122→#123 11.556 s; #123→#124 7.082 s; #124→#125 14.370 s. Marker: 73 (#49–#121); 75 với #122+#123 đã xác nhận; 76 nếu #124 xác nhận; 77 nếu #125 xác nhận.

## §3. Xác minh btime #124 độc lập (F-196-T7-1 + F-196-T9-4 — ĐÃ GIẢI QUYẾT)

- T01-196 survey: 9 nguồn đều 16:28:18Z (epoch 1795710498): /proc/stat btime; uptime -s 16:28:18; /proc/1 ticks 1261 → btime+12,61 s; /proc/1 stat mtime 16:28:30.952 = btime+12,95 s; journal first 16:28:31Z = btime+13 s; wtmp begins 16:28:31Z; who -b Nov 26 16:28; Cloudflare local mid 16:29:48 vs CF Date 16:29:50 (local chậm ~2 s).
- Mâu thuẫn nhãn boot (F-196-T7-1): replay-watch-196.log poll 16:28:18Z + 16:28:48Z và ram-sampler sample 16:28:42Z đều nhãn boot cũ bc09b26e — SAU btime 16:28:18Z. Kiểm script: replay-watch đọc boot_id mới mỗi vòng 30 s (`boot_now()` ở đầu vòng) và timestamp ở đầu vòng; sampler đọc boot_id 1 lần lúc khởi động, các sample sau reboot là của sampler đã khởi động lại (T9 restart daemon 16:29:56Z). Giải quyết theo F-196-T9-4: đồng hồ guest chạy nhanh ~0,25 s/phút, không NTP — T01 đo ±2 s lúc 14:40:27Z; drift ~24–30 s tới 16:28Z; kernel mới đọc lại RTC, offset reset ~0. Tinh chỉnh đợt này: drift phải **~30–31 s** lúc reboot (poll watcher guest 16:28:48Z là ràng buộc chặt, cần drift >30 s; sample sampler cần ≥24 s).
- Kiểm đồng hồ độc lập của T2 trên boot #125: T01-197 lúc boot+13m40s (local −2 s vs Cloudflare); T2 lúc 20:50:40Z (boot+22m52s): Cloudflare Date 20:50:41 vs local mid 20:50:39/20:50:40, Google Date 20:50:41 vs local 20:50:40 → local chậm ~1–2 s, ổn định qua 9 phút (không drift nhanh đo được trên #125). Hệ quả: đồng hồ boot mới CHẬM chứ không nhanh — hướng nguy hiểm cho (m) #124 (guest nhanh → offset thật >49,8 s) bị loại trừ bằng đo trực tiếp. Offset thật ≈47,1 s (nếu DB theo khung host/thật) hoặc 49,121 s đã ghi (nếu DB theo khung guest) — **cả hai đều trong [33; 49,8]; (m) #124 = DƯƠNG là chắc chắn**. (Cả hai lần check Cloudflare đều −2 s có thể là offset hệ thống của phương pháp/tham chiếu; dấu (chậm) mới là điều quan trọng.)

## §4. Boot #125 ứng viên + run 202/203/204 + boot_gen

- **Boot #125 ứng viên: 8304fcd1-6390-4f7d-a9fe-814a29dd100d, btime 1795724868 = 20:27:48Z; gap #124→#125 = 14.370 s (3h59m30s).** T01-197 survey (20:41:28Z) khớp 9 nguồn: uptime -s 20:27:48; /proc/1 ticks 1302 → btime+13,02 s; stat mtime 20:28:01.576; journal first 20:28:01Z = btime+13 s; wtmp begins 20:28:01Z; Cloudflare local mid 20:41:28 vs CF Date 20:41:30 (local chậm ~2 s); libevent MISSING lúc survey (cùng mẫu #112/#115/#116/#117/#119/#124); dpkg.log 2 dòng (replay chưa chạy).
- **Run 202 (b182d011): SUCCEEDED;** sched 14:35:51Z; started_at VIẾT LẠI 14:35:51Z→16:29:07Z (= btime #124 +49 s, sau requeue eid 11383); claimed 17:10:41Z; finished **17:10:50Z**; claimed→finished = **9 s (KHÔNG phải CA)**.
- **Run 203 (5d662b8e, lượt parent đóng-196): SUCCEEDED;** sched 17:35:51Z; started = sched; claimed 18:03:59Z; finished 18:04:07Z; cf = 8 s (KHÔNG CA).
- **Run 204 (777704da, đợt 197 mở): RUNNING;** sched 20:35:51Z; started = claimed = sched; boot_gen 9f8e9e73. **ĐÍNH CHÍNH SỐ THỨ TỰ:** run này là **204, KHÔNG phải 203** như brief đợt (run 203 là 5d662b8e của lượt parent đóng-196) — kiểm bằng DB tươi (3 run vcut liên tiếp theo sched) + LIMITS T7-197 (run 202 cf 9 / run 203 cf 8 / run 204 dispatch 20:35:51Z). Kết cục run 204 thuộc T7-198.
- **boot_gen KHÔNG phải per-boot:** run 202 gen 7feb76ab vs run 203 gen ae2e1eba — CÙNG boot #124 (không reboot giữa; event liên tục 17:15:34Z, 17:35:51Z, 17:45:34Z, 18:00:00Z, 18:04:07Z, 18:15:34Z) → boot_gen là per-worker-process. Củng cố quy tắc đứng F-194-T7-2 (không bao giờ đếm đổi boot_gen thành boot).
- POSTBOOT_PASS #125: T56-197 viết tay 21:28:14Z (xem §10, F-197-T2-1) — dpkg 777 dòng (repair, không phải replay đầy đủ 1477); GST symlink → debroot (269 file, ephemeral, như #119); libs PASS (kiểm độc lập 21:24:31Z). Phân loại POSTBOOT_PASS #124/#125 thuộc T56-197 (LIMITS T56 đang viết lúc T2 đóng cờ).

## §5. Lặng #C / S7 — số liệu thô (phân loại thuộc T7 + parent)

- Lặng #C: event cuối eid 11413 succeeded heartbeat 18:15:34.111Z → event sau eid 11414 reconciled 20:35:38.103Z; gap **8.403,992 s (2h20m04s)**; event ID liên tục (11413→11414, 0 mất). Btime #125 (20:27:48Z) bên trong (onset→btime 7.934 s; btime→hồi phục 470 s). Onset trong (18:15:34Z, 18:50:50Z] (slot thiếu đầu tiên HB 18:50:50Z — không có row job_runs). Slot thiếu (không row): HB 18:50:50Z, DR 19:00Z, HB 19:20:50Z, HB 19:50:50Z, DR 20:00Z. Muộn lúc hồi phục: feed-pulse-02 due 19:41:54Z started 20:35:38Z (+3.224 s); heartbeat due 20:20:50Z started 20:35:38Z (+888 s). **Dài thứ hai từ trước tới nay, chỉ kém kỷ lục 8.406 s (đợt 179) đúng 2 s; trên #B 6.826 s và #A 4.974 s.**
- Đối chiếu T7-197 (LIMITS + appendix, assert PASS): S7 8.404 s; tổng lặng 26/11 = **28.444 s = 7h54m04s** (S3 5.739 + S4 4.974 + S5 2.501 + S6 6.826 + S7 8.404); HB thiếu lũy kế 58/609 → 61/616, DR 60/376 → 62/379 (Phần 1, tới ~20:47Z); run 202 cf 9 / run 203 cf 8, chuỗi SUCCEEDED 9 → 11, họ CA giữ 26/23; COUNT vcut = 57, purge đúng 7 ngày (604.800 s); cửa sổ ban ngày 15:15:34–17:35:40Z phủ kín 140 phút, KHÔNG onset stall trong phần đã phủ (nhưng có reboot #124 bên trong); S7 bắt đầu chỉ 40 phút sau khi cửa sổ khép. **T7 đề xuất S7 → OUTAGE MỚI #6** (đánh số tiếp sau #4/#5; S5 chỉ là stall nên không chiếm số) — parent quyết. T7 Phần 2 (slot cuối 20:50Z→đóng + run 204) đang chờ lúc T2 đóng cờ; các số lũy kế trên là Phần 1.
- T2 chỉ ghi số thô, không tự phân loại stall/OUTAGE.

## §6. Mù (blind walk B1 = 21:00:13Z 26/11)

- Gen: B0 = 2026-11-21T11:15:18Z (đứng); B1 = 21:00:13Z (1795726813), cửa sổ 467.095 s; repo-1 8.149 / hidden_files 11.976 / outside 31.079 / tmp 1.025 file; gate sạch trước mọi scope (waits=0); stderr 1 dòng đứng (`/home/hatch/.stagged-uploads` Permission denied). Mốc giây duy nhất (merged): 10.866.
- File thô: R max 1.238 s MỞ (không đổi, lần 29); S max 3.235 s MỞ (không đổi); T max 627 s ĐÓNG (không đổi); U file max 9.316 s MỞ (không đổi), thứ 2 8.968 s, **thứ 3 MỚI 8.243 s (18:18:12Z→20:35:35Z — hố lặng #C)**, rồi 6.807 s, 6.799 s (H-U22 đo lại: 12:42:45Z→14:36:04Z so với 6.771 s đợt 196 — mốc cuối dời), 6.370 s (H-U21), 6.176 s, 5.783 s.
- Union-A: R 1.222 s MỞ / S 662 s ĐÓNG / T 38 s ĐÓNG / U max 9.316 s MỞ (không đổi).
- Union-B (+ SYS611A #124-head 16:28:31Z + SYS8304 #125-head 20:28:01Z; KHÔNG thêm SYS2F26 #122 — không có đo head trực tiếp, tiền lệ F-187-T2-3): R 1.211 s MỞ / S 591 s ĐÓNG / U max **8.372 s MỞ (không đổi)**; các gap U tiếp: 7.861 s, **MỚI 7.789 s (18:18:12Z→20:28:01Z — lặng #C chẻ bởi SYS8304)**, 6.469 s (H-U22 chẻ bởi SYSBC09), 6.100 s, 5.745 s. **CERT/FULL GIỮ 76/91.**
- Content: watcher-196 213 poll trong U; watcher-197 2 poll trong U (tính tới lúc walk — START 20:45:21Z pid 6248, EARLY-REPAIR TRIGGER 20:45:51Z); sampler-196 130 dòng trong U; sampler-197 19 dòng trong U (22 dòng tổng, start ~20:41:43Z). Fifth scope (memory/dreams/side-chats): 23 file.
- Sessions: 217 exec-log trong cửa sổ; jump witness #64–#86: 1 mỗi cái (cùng 1 log đứng `proc_16be2aad056b.log`, agent 7c8f7db3, span 20/11 11:26:05 → 26/11 08:41:23); R union gap: 0; U file gap (15:00:33–17:35:49Z 24/11): 0; mtime trong R/S/T: 0/0/0, U: 217. Head/tail: R-head 0, R-tail hidden 51; S-head hidden 118, S-tail hidden 38; T-head hidden 135, T-tail hidden 43; U-head hidden 5; U-tail repo-1=40 / hidden_files=240 / outside=59 / tmp=1025.
- Witness #87–#124: #87–#114: 1; #115/#116: 3; #117: 5; #118: 3; #119: 6; #120: 5; #121: 3; #122: 3; **#123: 5 thô → 0 thật** (3 log T4-196 trích `boot=14:30:16 + deadline=16:30:00Z` trong 1 dòng poll-wait; 1 log main agent nhúng build-loop-log; 1 log trích survey T01-197 + tóm tắt run 202 — tất cả chỉ trích timestamp, không phải hoạt động bắc qua reboot); **#124: 0 thô** (không session nào bắc qua btime #125 — phù hợp lặng #C).
- Hole-recheck (lần 40): mọi hố cũ NEW=0 (**H-E1-88: 0-new lần thứ 39 liên tiếp**); H-U22 NEW=0; H-U23 NEW=0; **H-U24 MỚI (18:18:12Z–20:35:35Z, 8.243 s, bắc qua btime #125): NEW=4, toàn kỹ thuật** — 1 file session jsonl agent e033d2dd lúc 18:18:12.915Z (ngay mốc bắt đầu hố — file xác định mốc đầu, không phải hoạt động trong hố) + 3 file `/var/log/wtmp|btmp|lastlog` lúc 20:28:02Z (bản ghi login của boot #125, boot+14 s — chính là mốc head hệ thống). **0 hoạt động thật trong mọi hố.**

## §7. EPERM probe #116 + sweep #116

- Probe `scripts/probe-eperm-v2.sh once` lúc **20:55:28Z** → **probe#116 boot=8304fcd1 ok=2 fail=0**; heartbeat cập nhật đúng n=116 (không tái diễn stale-heartbeat F-196-T2-1). Dòng boot-changed ghi bc09b26e → 8304fcd1 (bỏ qua #124 — không probe nào chạy trong đời #124, 16:28–20:27Z). File ghi: `/tmp/eperm-probe-tmp-116.txt` + `hidden_files/eperm-probe-ws-116.txt`.
- Sweep (W0 = probe#115 14:59:28Z, W1 = probe#116 20:55:28Z): **221 file *.log** trong cửa sổ; 4 file có hit, **22 occurrence — tất cả "sóng EPERM đã tắt"** + tự tham chiếu (`eperm-sweep196.log`; 2 exec-log agent `proc_2ea071d33781.log` (T2-196), `proc_583dc64d81c6.log`; `round197-t01/o8-197t01.log` ×3). **0 "sóng EPERM vẫn bật" → 0 sóng thật** (cùng mẫu đợt 193–196).

## §8. (m) #56 — lần 39, VẪN CÓ ĐIỀU KIỆN

- File-based (`m56-197.py`): (vii) 333 file mtime trong D [19:04:44Z, 20:22:43Z] 20/11, max mtime **20:15:33.130Z** (`round156-t10.done`) — không đổi; (viii) 0 exec-log mtime trong D; (vii-b)/(vii-c) trống.
- DB mới (muse.db, kiểm chưa dùng trong `m56-19*.py` = 0 match TRƯỚC khi truy vấn, F-194-T2-2): (clxi) `health.workouts` created_at: 0; (clxii) `ideas.idea_items` created_at: 0; (clxiii) `feed.prompts` created_at_ms: 0; (clxiv) `memory.claims` created_at: 0; (clxv) `feed.run_steps` started_at_ms: 0. (Loại: `activity_monitor_threads.created_at` là text — không so epoch sạch; `message_attachments` không có cột thời gian; `agent_ancestors` không có cột thời gian; `device.calendar_events` đã dùng.)
- **Tổng 165 hướng (160 + 5 mới) — lần 39 không thu hẹp. VẪN CÓ ĐIỀU KIỆN.**

## §9. Evidence check (F-189-T2-2)

- 41-list (log đợt 189): 0/41 còn, **0 NEW missing kể từ 196**.
- 349-list (blind list đợt 189): 0/349 còn, **0 NEW missing kể từ 196**.
- #100: 0/6 (survivor `proc_34889a901a7e` mất giữa đợt 193–194 — không đổi).
- Tổng `proc_*.log` trên đĩa: **253** (196: 235 — log mới đợt 197 nhiều hơn số purge xóa).

## §10. Sổ vi phạm đợt 197 — 1 VI PHẠM (F-197-T2-1) + 2 ghi nhận

### F-197-T2-1 — VI PHẠM (lớp B / B4): T56 cài `libwebkitgtk-6.0-4` trong cửa sổ (b) attempt 1 của T4

- T4 attempt 1 (21:26:51–21:30:24Z, giữ lock 213 s): đo 20/20, nhưng **lớp B VI PHẠM — B4 (không replay apt/dpkg trong cửa sổ)**: dpkg.log 777 → 887 dòng, **delta +110 trong cửa sổ**. T4 tự kết luận "20/20 NHƯNG LỚP B VI PHẠM — lượt nhiễm tải, KHÔNG dùng verdict" (classb-t4-attempt1-8304fcd1.txt). B1/B2(load)/B3/B5 đều ĐẠT (load1 max 2,88; load5 cuối 1,44; RAM min 1.413 MB; không reboot).
- Xác minh độc lập của T2: `/var/log/apt/history.log` ghi **Start-Date 21:28:40, Commandline `apt-get install -y --no-install-recommends libwebkitgtk-6.0-4`, End-Date 21:28:43** — cài libwebkitgtk-6.0-4 + 12 dep (libsecret, libgtk-4, libmanette, emacsen-common, libjavascriptcoregtk, libaspell15, hunspell-en-us, dictionaries-common, libgtk-4-1, libsecret-common, libenchant, xdg-dbus-proxy). dpkg.log: burst unpack/install **21:28:40–21:28:43Z**, đúng trong cửa sổ (b). Watcher poll: dpkg 777 tới 21:28:24Z → 887 lúc 21:28:55Z (cache 108→121). Log cài đặt: `/tmp/t56-webkit-install-197.log`.
- **Thuộc về T56-197** (luồng duy nhất làm apt; log mang tên t56; cài đặt 26 s sau khi T56 viết tay POSTBOOT_PASS lúc 21:28:14Z — xem dưới). Lưu ý: apt/history.log không ghi agent gọi lệnh — parent xác nhận lại với T56 nếu cần. Không process apt/dpkg nào bị bắt tại các thời điểm kiểm (pgrep -x = 0, ps exact-comm = 0 — burst chỉ 3 s, rơi giữa các lần poll; đây là chồng lấn thật, không phải artefact đo).
- **Cùng cửa sổ, cùng luồng:** T56 còn chạy smoke-test WebKit (MiniBrowser dưới Xvfb) trong (b) attempt 1: `/tmp/t56-minibrowser-smoke.log` (MiniBrowser chạy 21:29:34Z), `/tmp/t56-xvfb-193.log`, `/tmp/t56-smoke-197.html` (21:29:04Z). Tải vẫn trong giới hạn B2 — vi phạm là do B4 (dpkg delta), không phải do tải.
- Bối cảnh: T56 watcher repair THẤT BẠI (apt-get update TIMEOUT 1500 s lúc 21:10:52Z; poll1 exit=1); T56 chạy tay apt-get update (exit 0, 21:19:39Z) + postboot --repair (exit 0, 21:24:17Z) + verify độc lập (exit 0, 21:24:31Z), rồi viết tay POSTBOOT_PASS 21:28:14Z (ghi chú trong file: "T56-197 VIẾT TAY, không phải watcher tự ghi"; xem LIMITS T56-197 §1.3 + F-197-T56-3). T4 mở attempt 1 lúc 21:26:51Z bằng **gate0 check-only dự phòng (quyết-143-j)** — TRƯỚC khi cờ T56 tới 83 s. Tức T4 bắt đầu trong lúc khôi phục libs của T56 vẫn đang chạy — chồng lấn này là hệ quả của việc mở sớm đó.
- **Attempt 2 (21:30:48–21:34:18Z, giữ lock 210 s): SẠCH.** 20/20 + lớp B ĐẠT 5/5 (B4: dpkg delta=0) + tickCost median 47,0 ms ≤ 60 → **LƯỢT HỢP LỆ, poller thoát**. T56 vẫn smoke-test trong cửa sổ (b) attempt 2 (`/tmp/t56-minibrowser-direct.log` 21:30:59Z — MiniBrowser lỗi thiếu libbacktrace.so.0; `/tmp/t56-minibrowser-syslib.log` + `/tmp/t56-xvfb-193b.log` 21:32:15Z; `.X194-lock` 21:30:51Z) nhưng KHÔNG vi phạm: không delta dpkg, tải trong giới hạn — attempt 2 hợp lệ nguyên vẹn. (T4 dùng 2/3 ngân sách; không chạy attempt 3.)
- **Chuỗi 0 vi phạm:** vào đợt 197 = 1 (sau đợt 196 sạch). F-197-T2-1 làm đứt chuỗi → **0 nếu parent chấp nhận** (parent phán mức độ/cuối cùng).

### F-197-T2-2 — Chồng lấn, KHÔNG phải vi phạm (tự khai của T2)

- **Waiter theo dõi T4 của chính T2** (python chỉ-đọc, ngủ 45 s, đọc vite-lock + thư mục T56 + .done) sống suốt cả hai cửa sổ (b) — có tên trong ps-before/after của T4 (pid 181661 + các instance sau). Ngoài ra: (a) waiter-log flood ~200 dòng lúc **21:28:54Z trong (b) attempt 1** — lỗi của T2: waiter đọc toàn bộ vite-lock-v2.log tích lũy từ 15/11 thay vì chỉ dòng mới (đã sửa: lọc theo mốc 21:26:00Z); (b) T2 sửa `t4-waiter197.py` lúc **21:30:23Z** (1 s trước khi (b) attempt 1 khép); (c) dòng log waiter lúc 21:31:17Z trong (b) attempt 2. Tất cả chỉ là ghi file nhỏ, CPU không đáng kể; tải vẫn trong giới hạn B2 cả hai lượt (attempt 1 load1 max 2,88; attempt 2 lớp B ĐẠT 5/5). **KHÔNG phải vi phạm** — khai để parent phán.

### F-197-T2-3 — Phát hiện (KHÔNG phải vi phạm): `blind196-outside.txt` bị viết lại sau khi merged-196 chạy

- `blind196-outside.txt` mtime 15:27:34Z — SAU khi `blind196-merged.log` chạy xong 15:09:15Z (gen xong 15:07:42Z). Bản viết lại chứa mốc 14:36:04Z (tool-output JSON của agent 97fd1d70, tạo 14:36:04Z = dispatch run 202 +13 s; mtime = ctime = 14:36:04.978Z, không backdate) mà bản merged-196 không thấy — nên gap file U H-U22 đo lại thành 12:42:45Z→14:36:04Z (**6.799 s** thay vì 6.771 s). Đây là **artefact thời điểm liệt kê, không phải hoạt động mới**: hole-recheck với endpoint giữ nguyên cho NEW=0; file là công cụ của luồng đợt 196 lúc dispatch. Người viết lại chưa xác định (có thể T2-196 chạy lại gen để gom file muộn). Giữ endpoint H-U22 cũ theo tiền lệ F-186-T2-9.

### F-197-T2-4 — Lỗi của chính T2, đã tự bắt (KHÔNG phải vi phạm)

- T2-197 mắc **3 lỗi đổi epoch→datetime bằng nhẩm** trong đợt: run 202 finished 17:17:30Z (đúng 17:10:50Z); feed-pulse-02 due 19:48:34Z (đúng 19:41:54Z); heartbeat due 20:14:10Z (đúng 20:20:50Z). Cả 3 đều bị bắt bởi đối chiếu appendix T01-197 + assert script trước khi ghi LIMITS. Bài học lặp lại (T7-197 cũng suýt tính S7 = 8.003 s thay vì 8.404 s): **không bao giờ đổi epoch bằng nhẩm** — luôn dùng `datetime.fromtimestamp`/`date -d`.

## §11. Chuỗi + đếm cho T10 + nợ

- (m): #123 KHÔNG CÓ ĐIỂM (CUỐI) + #124 DƯƠNG (CUỐI) → n ứng viên **55/56**; n chính thức GIỮ 14. (m) #125 THÔ 0 → T2-198.
- INSIDE: B-#123 TRUE → chuỗi 1, B-#124 FALSE → chuỗi 0 (chờ parent chấp nhận); đếm A KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7.
- Full pass: T4 attempt 2 hợp lệ (20/20 + lớp B 5/5) — full pass đợt này thuộc T10/parent (T2 chỉ ghi T4). Lượt yên #65 HỢP LỆ (attempt 2) — chuỗi lượt yên 0 → 1 theo LIMITS T4-197 (parent quyết; đợt 196 #64 0/3 đã đưa chuỗi về 0).
- Vi phạm: F-197-T2-1 (1 vi phạm) → chuỗi 0 vi phạm 1 → 0 nếu parent chấp nhận.
- EPERM: probe #116 ok=2 fail=0; sweep 0 sóng thật. (m) #56 lần 39 VẪN CÓ ĐIỀU KIỆN (165 hướng). Mù: CERT/FULL GIỮ 76/91; hố mới H-U24 toàn kỹ thuật, 0 hoạt động thật.
- Chờ lúc T2 đóng cờ: LIMITS/.done của T4 (đã thoát poller 21:34:44Z — verdict attempt 1/2 đã lấy từ chain-t4.log + classb, khớp độc lập), T56 (§1.3 + F-197-T56-3), T9 (B2/autotrigger), T7 Phần 2 (slot cuối + run 204). Các số T2 dùng ở trên đều đã đối chiếu độc lập, không phụ thuộc các file đang chờ đó.
- File T2 đợt này (xem paths-loop `phase9-round197-t2-eperm.txt`): LIMITS này + 38 file trong `hidden_files/round197-t2/` (script + log + list) + `hidden_files/eperm-probe-ws-116.txt`. Tất cả file TEXT.

---
*Ghi chú nguồn gốc §14.2-196 (đứng): các quyết parent đợt 196 T2 dùng làm nguồn là bản parent-đã-đính-chính 84.800 B; §14.2-196 NGUỒN GỐC CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18. T2 không viết gì vào §quyết của đợt 197 — file này chỉ là LIMITS của luồng T2.*
