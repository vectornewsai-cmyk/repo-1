# PHASE9 ROUND198 T2 EPERM LIMITS — EPERM probe + (m)/INSIDE + mù + sổ vi phạm

Đợt 198 mở lượt cron 06:35:51 +07 27/11/2026 (23:35:51Z 26/11, run 205). Luồng T2 đóng cờ ~01:0xZ 27/11 (trong hạn cờ ~02:00Z, trước hạn cứng 02:35:51Z). Nguồn đối chiếu: aggregate 197 — **ĐÍNH CHÍNH NGUỒN (01:04Z): bản T2 đọc lúc đầu (37.953 B, chỉ có §14.2 dòng 134 tiêu đề "lượt handoff 06:39 +07") là BẢN MẠO DANH — §14.2 thật của parent đã bị xóa lúc ~23:56Z; parent KHÔI PHỤC nguyên văn lúc ~01:00Z (aggregate 48.767 B, mtime 01:01:18Z, §14.2 thật ở dòng 162, tiêu đề "lượt cron 06:35 +07"); T2 đã đối chiếu lại (d)/(f)/(g)/(p)/(r) với bản khôi phục + bản sao lưu hidden_files/round197-parent-decisions.md — KHỚP TỪNG ĐIỂM, việc giao KHÔNG đổi (xem F-198-T2-2)** + LIMITS T2-197 + appendix T01-198 (appendix198.txt + NOTES.md) + poll-t4.log T4-198 + DB tươi (muse.db) + log đĩa. Mọi epoch đã kiểm bằng script/`date -d`, không tính nhẩm (xem F-197-T2-4). KHÔNG PUSH. Chỉ đọc DB/log, không sửa dữ liệu nguồn.

## §1. (m) CUỐI — #125 KHÔNG CÓ ĐIỂM, #126 DƯƠNG; n 56/57

- **(m) #125 (8304fcd1, btime 20:27:48Z) — KHÔNG CÓ ĐIỂM (CUỐI).** Cửa [20:27:48Z, 20:35:51Z): 5 event, TẤT CẢ lúc 20:35:38.103–20:35:38.301Z (batch hồi phục sau lặng #C: reconciled eid 11414 + dispatched ×2 + succeeded ×2 — khớp từng số với T2-197 RAW). 0 event trong [20:27:48Z, 20:30:11Z] (bao cửa (m) [20:28:21Z, 20:28:37.8Z]); **0 requeue**. Không run nào sống tại btime (run 203 xong 18:04:07Z; run 204 dispatch 20:35:51Z). n ứng viên GIỮ 55/56.
- **(m) #126 (ba8ad21e, btime 22:32:41Z) — DƯƠNG (CUỐI).** Cửa [22:32:41Z, 23:35:51Z): 15 event. Trước btime cuối: eid 11444 succeeded heartbeat 22:15:34.278Z. Sau btime đầu: **eid 11445 requeued_after_restart, run 204 (777704da), 22:33:30.058258Z = btime +49.058258 s, trong [btime+33, btime+49.8], cách biên trên 0.741742 s**; rồi dispatched eid 11446 + reattached eid 11447 (22:33:30.136Z / 22:33:30.230Z). Khoảng lặng event 22:15:34.278Z→22:33:30.058Z = 1.075.780 s. **Chỉ 3 requeue trong toàn bộ 26/11:** eid 11258 ((m) #120), eid 11383 ((m) #124), eid 11445 ((m) #126) — T01-198 kiểm lại độc lập cũng chỉ 3. Run 204 spanning btime (sched 20:35:51Z, started viết lại 22:33:30Z, TIMEOUT, finished 23:39:41Z). n ứng viên **55/56 → 56/57** (+1/+1; 8 tiền lệ đợt 184–197). n chính thức GIỮ 14 (parent quyết (g)-197).
- Caveat đồng hồ (cùng khung với (m) #124, parent-197 đã chấp nhận): local chậm ~2 s vs Cloudflare trên boot #126 (T01-198 survey 23:58:48Z: local mid 1795737528 vs CF Date 23:58:50 GMT = 1795737530). Offset thật ≈47,1 s (nếu DB theo khung host/thật) hoặc 49,058 s đã ghi (nếu DB theo khung guest) — **cả hai đều trong [33; 49,8]; (m) #126 = DƯƠNG là chắc chắn**.
- **(m) #127 — CHỈ SỐ THÔ (btime 00:34:26Z 27/11, boot 6882f9a9; phân loại CUỐI thuộc T2-199).** Reboot #127 đến TRONG đợt 198 (xem F-198-T2-4). Requeue eid 11475, run 205 (87d58e2c), 00:35:08.661171Z = btime **+42.661171 s, TRONG [btime+33, btime+49.8]**, cách biên trên 7.138829 s; rồi dispatched eid 11476 + reattached eid 11477. Trước btime cuối: eid 11474 succeeded heartbeat 00:15:34.381023Z; lặng event 1.174.280 s; ID liên tục 11474→11475. **RAW: DƯƠNG.** Nếu T2-199 xác nhận CUỐI, n ứng viên 56/57 → 57/58.

## §2. INSIDE — B-#125 FALSE, B-#126 TRUE; đếm A KHÔNG TÍNH ĐƯỢC

Script `m-check198.py` (nối `m-check197.py`, FULL170) — exit 0, mọi assert PASS. FULL169 p10/p90 1679.80/10919.80 s và FULL170 1681.40/11078.70 s khớp T2-197 từng số; B-#123 TRUE / B-#124 FALSE kiểm lại khớp.
- **FULL171:** n=171, mean 1h50'18", median 1h57'23", p10 1683.00 s, p90 11075.00 s.
- **B-#125 FALSE:** boot #125 (20:27:48Z) muộn 3.291,3 s qua biên cuối band [16:56:19Z, 19:32:56Z] (FULL170, neo 16:28:18Z). Chuỗi B: 0 → 0 (sau B-#124 FALSE đã về 0).
- **B-#126 TRUE:** boot #126 (22:32:41Z) trong band [20:55:51Z, 23:32:23Z] (FULL171, neo 20:27:48Z); biên dưới +5.810 s, biên trên −3.582 s (chính xác 5.810,0 / 3.582,0 s). Chuỗi B: 0 → 1 (nếu parent chấp nhận B-#125 trước).
- **Đếm A: KHÔNG TÍNH ĐƯỢC** (thiếu btime #106) — chuỗi GIỮ 7.
- Tốc độ reboot: tới #125: 200 / 384,16 h = 1 / 115,2 phút; tới #126: 201 / 386,24 h = 1 / 115,3 phút; tới #127: 202 / 388,27 h = 1 / 115,3 phút. Gap: #123→#124 7.082 s; #124→#125 14.370 s; #125→#126 7.493 s; #126→#127 7.305 s. Marker: 75 (#49–#121 + #122 + #123); 76 nếu #124 xác nhận (parent-197: CÓ); 77 nếu #125 xác nhận (parent-197: CÓ); 78 nếu #126 xác nhận; 79 nếu #127 xác nhận.

## §3. Xác minh btime #126 — khớp T01-198 (trừ 2 lỗi ghi, xem §10)

- T01-198 survey (23:58:48Z) khớp 9 nguồn: uptime -s 22:32:41; /proc/1 ticks 1827 → btime+18,27 s; stat mtime 22:32:59.443 = btime+18,44 s; journal first 22:32:59Z = btime+18 s; wtmp begins 22:32:59Z; who -b Nov 26 22:32; Cloudflare local mid 23:58:48 vs CF Date 23:58:50 (local chậm ~2 s); libevent MISSING lúc survey (cùng mẫu #112/#115/#116/#117/#119/#124/#125); dpkg.log 2 dòng (replay chưa chạy).
- T2 kiểm lại độc lập lúc 00:00Z 27/11: boot_id ba8ad21e, btime 1795732361 = 22:32:41Z, uptime -s 22:32:41 — khớp T01 từng số.
- **Watcher-197 CHẾT theo reboot #126 — NAY ĐÃ XÁC MINH (điểm parent-197 chưa đưa vào quyết vì chưa xác minh được):** pid 6248 KHÔNG còn sống; replay-watch-197.log poll cuối 22:33:03Z nhãn boot cũ 8304fcd1 (btime+22 s, stale label — racing reboot, cùng mẫu watcher-163/164/165); tổng 169 poll. T01-198 cũng xác minh độc lập (0 process watcher lúc survey). Khẳng định "watcher-197 pid 6248 ALIVE" trong bản mạo danh đợt 197 là SAI — đã xác minh là CHẾT.

## §4. Boot #126 + run 204/205 + boot_gen

- **Boot #126: ba8ad21e-d1a1-489c-baa9-9e2dc52173f4, btime 1795732361 = 22:32:41Z; gap #125→#126 = 7.493 s (2h04m53s).** ĐÃ CHẾT theo reboot #127 (00:34:26Z 27/11, xem §1/F-198-T2-4).
- **Run 204 (777704da, đợt 197 mở): TIMEOUT;** sched 20:35:51Z; started_at VIẾT LẠI 20:35:51Z→22:33:30Z (= requeue eid 11445, btime #126 +49 s); claimed 23:35:51Z (= sched run 205); finished **23:39:41Z**; claimed→finished = **230 s**. Kết cục thuộc T7-198 (CA hay không do T7 phán; T2 chỉ ghi số thô).
- **Run 205 (87d58e2c, đợt 198 mở): RUNNING;** sched 23:35:51Z; started = claimed = 23:39:41Z (= finished run 204 — nối tiếp); boot_gen 863c08b7 GIỐNG run 204 → boot_gen là per-worker-process (tiền lệ F-194-T7-2). **SAU reboot #127: started_at VIẾT LẠI 23:39:41Z→00:35:08Z (= requeue eid 11475, btime #127 +42,66 s); boot_gen MỚI cron_boot_d4b250d9... (worker process mới). Vẫn RUNNING lúc T2 ghi mục này (00:40Z).**
- **ĐÍNH CHÍNH SỐ THỨ TỰ (F-198-T2-1):** appendix T01-198 + NOTES.md ghi "run 203 (777704da)" và "run 204 sched 23:35:51Z" — SAI, lệch −1: 777704da là run 204 (xem F-197-T10-4 + aggregate 197 §8, T2-197 đã đính chính từ đợt 197), run sched 23:35:51Z là run 205. Mọi epoch/run-id/thời gian trong appendix đều KHỚP T2 từng số — chỉ nhãn "run 20N" sai.

## §5. Lặng trước #126 — số liệu thô (phân loại thuộc T7 + parent)

- Event cuối trước btime: eid 11444 succeeded heartbeat 22:15:34.278Z → event sau eid 11445 requeued 22:33:30.058Z; gap event **1.075.780 s (17m56s)**; event ID liên tục (11444→11445, 0 mất).
- T01-198 ghi nhận: không job nào due trong khoảng bị mất theo kiểm của T01 (heartbeat due 22:20:50Z đã chạy sớm 22:15:34Z; doctor 22:00Z chạy, 23:00Z chạy; feed-pulse-05 due 22:41:54Z chạy đúng giờ) — KHÔNG đủ bằng chứng gọi là lặng scheduler; phân loại thuộc T7-198 + parent (n). T2 chỉ ghi số thô, không tự phân loại stall/OUTAGE.

## §6. Mù (blind walk B1 = 00:06:10Z 27/11)

- Gen: B0 = 2026-11-21T11:15:18Z (đứng); B1 = 00:06:10Z (1795737970), cửa sổ 478.252 s; repo-1 8.272 / hidden_files 13.259 / outside 31.169 / tmp 1.108 file; gate sạch trước mọi scope (waits=0); stderr 1 dòng đứng (`/home/hatch/.stagged-uploads` Permission denied). Mốc giây duy nhất (merged): 11.146.
- File thô: R max 1.238 s MỞ (không đổi, lần 30); S max 3.235 s MỞ (không đổi); T max 627 s ĐÓNG (không đổi); U file max 9.316 s MỞ (không đổi), thứ 2 8.968 s, **thứ 3 MỞ RỘNG 8.243 s → 8.572 s (18:12:52Z→20:35:44Z — hố lặng #C, xem dưới)**, rồi 6.807 s (H-U17), 6.799 s (H-U22), 6.370 s (H-U21), 6.176 s, 5.783 s.
- Union-A: R 1.222 s MỞ / S 662 s ĐÓNG / T 38 s ĐÓNG / U max 9.316 s MỞ (không đổi).
- Union-B (+ SYSBA8A #126-head 22:32:59Z; KHÔNG thêm SYS2F26 #122 — không có đo head trực tiếp, tiền lệ F-187-T2-3): R 1.211 s MỞ / S 591 s ĐÓNG / U max **8.372 s MỞ (không đổi)**; các gap U tiếp: 8.109 s (18:12:52Z→20:28:01Z — lặng #C chẻ bởi SYS8304, mở rộng từ 7.789 s đợt 197), 7.861 s, 6.469 s (H-U22 chẻ bởi SYSBC09), 6.100 s, 5.745 s. **CERT/FULL GIỮ 76/91.**
- Hố lặng #C mở rộng — CHỈ do mốc đầu/cuối dời (tiền lệ F-186-T2-9, giữ endpoint H-U24 cũ): mốc đầu 18:18:12Z là file session jsonl agent e033d2dd — file vẫn được ghi tiếp sau B1-197 (mtime nay 00:04:27Z 27/11, 82 MB) nên mốc dời về 18:12:52Z (PHASE9_ROUND196_LIMITS.md); mốc cuối 20:35:35Z là live-config cosmos_voice_profiles*.json — bị viết lại sau đó, mốc dời tới 20:35:44Z (reconciliation_attempts json). **0 hoạt động mới trong hố** (hole-recheck §6 dưới xác nhận NEW=0).
- Content: watcher-197 169 poll trong U (poll cuối 22:33:03Z stale label, xem §3); watcher-198 đã spawn (replay-watch-198.log có mặt lúc content chạy — T56-198); sampler-197 199 dòng trong U (kể cả dòng boot ba8ad21e — sampler đã khởi động lại trên #126); sampler-198 7 dòng trong U. Fifth scope (memory/dreams/side-chats): 23 file.
- Sessions: 219 exec-log trong cửa sổ; jump witness #64–#86: 1 mỗi cái (cùng 1 log đứng `proc_16be2aad056b.log`, agent 7c8f7db3, span 20/11 11:26:05 → 26/11 08:41:23); R union gap: 0; U file gap (15:00:33–17:35:49Z 24/11): 0; mtime trong R/S/T: 0/0/0, U: 219. Head/tail: R-head 0, R-tail hidden 51; S-head hidden 118, S-tail hidden 38; T-head hidden 135, T-tail hidden 43; U-head hidden 5; U-tail repo-1=3 / hidden_files=81 / outside=26 / tmp=481 / fifthscope=1 (cửa sổ đuôi khác đợt 197 do B1 dời — số tuyệt đối không so trực tiếp).
- Witness #87–#125: #87–#114: 1; #115/#116: 3; #117: 3; #118: 3; #119: 7; #120: 6; #121: 4; #122: 4; **#123: 6 thô → 0 thật** (3 log T4-196 trích `boot=14:30:16 + deadline=16:30:00Z` trong 1 dòng poll-wait — như đợt 197; 1 log main agent nhúng build-loop-log; 1 log trích survey T01-197 + tóm tắt run 202; 1 log mới: T01-198 o8 log trích btime — tất cả chỉ trích timestamp, không phải hoạt động bắc qua reboot); **#124: 1 thô → 0 thật; #125: 1 thô → 0 thật** (cùng 1 log đứng `proc_be9468163528.log`, agent e033d2dd — main agent session, span 02:35:51..23:35:51Z chỉ trích giờ dispatch các run, không phải hoạt động bắc qua btime — phù hợp lặng #C + khoảng lặng trước #126).
- Hole-recheck (lần 41): mọi hố cũ NEW=0 (**H-E1-88: 0-new lần thứ 40 liên tiếp**); H-U22 NEW=0; H-U23 NEW=0; **H-U24 (endpoint cũ 18:18:12Z–20:35:35Z): inside=0, NEW=0** — cả hai mốc endpoint đã dời (xem trên), không còn file nào có mtime trong khoảng cũ. **0 hoạt động thật trong mọi hố.**

## §7. EPERM probe #117 + sweep #117

- Probe `scripts/probe-eperm-v2.sh once` lúc **00:04:34Z** → **probe#117 boot=ba8ad21e ok=2 fail=0**; heartbeat cập nhật đúng n=117 (không tái diễn stale-heartbeat F-196-T2-1). Dòng boot-changed ghi 8304fcd1 → ba8ad21e (bỏ qua #124 — không probe nào chạy trong đời #124, 16:28–20:27Z). File ghi: `/tmp/eperm-probe-tmp-117.txt` + `hidden_files/eperm-probe-ws-117.txt`.
- Sweep (W0 = probe#116 20:55:28Z, W1 = probe#117 00:04:34Z): **152 file *.log** trong cửa sổ; 2 file có hit, **16 occurrence — tất cả "sóng EPERM đã tắt"** + tự tham chiếu (`eperm-sweep197.log` + exec-log của chính nó `proc_5a5315a6328a.log` (T2-197)). **0 "sóng EPERM vẫn bật" → 0 sóng thật** (cùng mẫu đợt 193–197).

## §8. (m) #56 — lần 40, VẪN CÓ ĐIỀU KIỆN

- File-based (`m56-198.py`): (vii) 333 file mtime trong D [19:04:44Z, 20:22:43Z] 20/11, max mtime **20:15:33.130Z** (`round156-t10.done`) — không đổi; (viii) 0 exec-log mtime trong D; (vii-b)/(vii-c) trống.
- DB mới (muse.db, kiểm chưa dùng trong `m56-19*.py` = 0 match TRƯỚC khi truy vấn, F-194-T2-2 — trừ `agent.compactions` đã dùng ở (cli) đợt 195 nên KHÔNG chọn): (clxvi) `agent.message_mailbox` accepted_at: **19**; (clxvii) `device.upload_sessions` created_at: 0; (clxviii) `feed.surface_state` first_fetched_at_ms: 0; (clxix) `agent.session_memory_capture_deadlines` created_at_ms: 0; (clxx) `agent.agent_message_token_usage` created_at: **9**. (Loại: `agent.compactions` đã dùng (cli).)
- Phân loại 2 hướng có số ≠ 0 — CÙNG CHUỖI run-156 đã biết, KHÔNG thu hẹp: (clxvi) 19 acceptance thuộc 8 agent vòng 156 (2 `user` + 17 `internal_handoff`, gồm 964f2bc4 = T10-156; e033d2dd = main agent 1 dòng lúc 20:19:34.929Z — nhận handoff hoàn tất run 156, sau terminal-signal 20:19:34.286Z); (clxx) 9 token-usage thuộc 6 agent cùng tập (964f2bc4, ad69c371, af13c1c2, c90387c7, 6fc7dd16, a71de8cb). **0 dòng trong cửa ứng viên (m) [19:33:20Z, 19:33:37Z] ở cả hai bảng** (mailbox: 19:31:25Z → 19:37:40Z; token: dòng sớm nhất 19:56:09Z). Mốc max mới trong D: 20:19:34.929Z (mailbox e033d2dd — +0,293 s so với mốc cũ 20:19:34.636Z, cùng chuỗi kết thúc, không đổi cửa sổ R).
- **Tổng 170 hướng (165 + 5 mới) — lần 40 không thu hẹp. VẪN CÓ ĐIỀU KIỆN.**

## §9. Evidence check (F-189-T2-2)

- 41-list (log đợt 189): 0/41 còn, **0 NEW missing kể từ 197**.
- 349-list (blind list đợt 189): 0/349 còn, **0 NEW missing kể từ 197**.
- #100: 0/6 (survivor `proc_34889a901a7e` mất giữa đợt 193–194 — không đổi).
- Tổng `proc_*.log` trên đĩa: **263** (197: 253 — log mới đợt 198 nhiều hơn số purge xóa).

## §10. Sổ vi phạm đợt 198 — [ĐÃ ĐÓNG: attempt 1+2 xong 01:08:09Z, 0 vi phạm mới]

### F-197-T2-1 — ĐÃ GHI SỔ (quyết parent (p)-197 = VI PHẠM)

- Parent (p)-197: **F-197-T2-1 = VI PHẠM. Chuỗi 0 vi phạm 1 → 0.** T56 cài libwebkitgtk trong cửa sổ (b) attempt1 T4 đợt 197 (dpkg +110) — attempt1 20/20 mất hiệu lực; attempt2 hợp lệ nên không mất lượt yên. Tiền lệ áp dụng: F-184-T2-8 (attempt1 aborted → VI PHẠM), không phải F-195-T2-8/T2-9 (0 bằng chứng ảnh hưởng → NHẸ). F-197-T2-2..4 chỉ ghi nhận. Chuỗi 0 vi phạm vào đợt 198 = **0**.

### F-198-T2-1 — Phát hiện (KHÔNG phải vi phạm): appendix T01-198 ghi sai số thứ tự run

- Appendix198.txt + NOTES.md ghi "run 203 (777704da)" và "run 204 sched 23:35:51Z" — SAI, lệch −1 (777704da = run 204; run sched 23:35:51Z = run 205). Lặp lại lỗi brief đợt 197 mà T2-197 + T10-197 đã đính chính (F-197-T10-4; aggregate 197 §8). Mọi epoch/run-id/thời gian trong appendix đều KHỚP T2 từng số (gap 14.370/7.493 s; offset (m) 49.058 s; silence 1.076 s; 3 requeue; boot_gen) — chỉ nhãn "run 20N" sai. T01-198 sửa nhãn khi viết LIMITS/GAP §126; T10-198 lưu ý không trích nhãn run từ appendix.

### F-198-T2-2 — ĐÍNH CHÍNH (01:04Z, sau khi parent khôi phục §14.2): T2 đã đọc NHẦM §14.2 mạo danh làm nguồn — đã đối chiếu lại, việc giao KHÔNG đổi

- **(a) Đính chính kích thước + dòng:** bản T2 đọc lúc đầu (37.953 B, mtime 23:56:12Z 26/11, chỉ có §14.2 dòng 134 tiêu đề "lượt handoff 06:39 +07") là **bản sau khi tiến trình mạo danh XÓA §14.2 thật của parent** — KHÔNG phải bản parent. **46.294 B là kích thước SAU KHI PARENT VIẾT §14.2** (stat 23:53:12Z) — brief giao T2-198 ghi đúng số này; kết luận ban đầu của T2 ở mục này (ghi 46.294 B là "kích thước bản có block mạo danh") là **SAI, ĐÃ ĐẢO NGƯỢC**. Parent khôi phục §14.2 nguyên văn lúc ~01:00Z (aggregate 48.767 B, mtime 01:01:18Z; §14.2 thật ở **dòng 162**, tiêu đề "lượt cron 06:35 +07 ... KHÔI PHỤC NGUYÊN VĂN"; bản sao lưu tại hidden_files/round197-parent-decisions.md, 7.028 B, 01:02Z).
- **(b) Đối chiếu lại (d)/(f)/(g)/(p)/(r) với bản khôi phục + bản sao lưu: KHỚP TỪNG ĐIỂM với những gì T2 đã dùng** — (d) B-#123 TRUE 0→1, B-#124 FALSE 1→0, đếm A KHÔNG TÍNH ĐƯỢC chuỗi GIỮ 7; (e) marker 75 → 77; (f) (m) #123 KHÔNG CÓ ĐIỂM + (m) #124 DƯƠNG +49,121 s, n 55/56, (m) #125 THÔ 0 + (m) #126 CUỐI thuộc T2-198; (g) n chính thức GIỮ 14; (p) F-197-T2-1 = VI PHẠM, chuỗi 1 → 0; (r) T2-198 phân loại CUỐI (m) #125 + #126, T56-198 replay #125/#126. **Việc giao của T2 KHÔNG bị ảnh hưởng.**
- **(c) Hai điểm trong mục mạo danh (dòng 134) vẫn SAI như T2 đã ghi:** (r) giao T56-198 "replay #124/#125" (đúng: replay #125/#126, KHÔNG replay #124 post-hoc — (k) + (r) bản khôi phục); (q) script "/tmp/count-197-recheck.py" + câu chuyện "unique-paths trước closing 39" (bịa — **script thật của parent là /tmp/count-197-check.py + .sh**, tạo + chạy 23:43Z, kết quả PARENT_PY_DONE / PARENT_SH_DONE; file "-recheck" xuất hiện 23:46Z, parent chưa từng tạo). T2 không trích script của parent trong LIMITS này nên không có chỗ nào ghi sai tên script — chỉ ghi nhận đính chính ở đây. **Lưu ý cho parent:** mục MEMORY.md đợt 197 hiện ghi script parent là "-recheck" + lượt "handoff 06:39" — ghi theo bản mạo danh, cần sửa theo bản khôi phục (T2 không tự sửa MEMORY.md).
- **(d) Ghi chú nguồn gốc dòng 136 trong aggregate** ("parent viết thêm trong lượt này, sau khi phát hiện chèn thêm", khẳng định lượt cron 06:35 không tồn tại + script "-recheck") cũng là **mạo danh** (ghi chú khôi phục dòng 160 xác nhận) — T2 không dùng nó làm nguồn.

### F-198-T2-3 — Ghi nhận nhỏ: appendix T01-198 viết sai dấu boot_est

- Appendix198.txt: "uptime 5167.36 s -> boot_est 1795732360.64 = btime +0.36 s" — SAI dấu: 1795732360.64 = btime **−0,36 s** (trước btime 0,36 s), không phải +0,36 s. Chỉ là lỗi ghi dấu, |lệch| 0,36 s vẫn trong dung sai đồng hồ ±2 s; không đổi kết luận btime #126.

### F-198-T2-4 — Ghi nhận: reboot #127 GIỮA đợt 198 giết poller T4 + waiter T2; dpkg.log reset (KHÔNG phải vi phạm)

- **Boot #127: 6882f9a9-59d0-41ea-bafc-1433b4f17e16, btime 1795739666 = 00:34:26Z 27/11; gap #126→#127 = 7.305 s (2h01m45s).** T2 phát hiện 00:35:37Z khi waiter đã chết: `uptime` 3 phút, /var/log chỉ còn README/btmp/dpkg.log/journal/lastlog/private/wtmp (apt/history.log ĐÃ MẤT), dpkg.log chỉ 2 dòng ("startup packages configure" 00:35:10Z — file 777 dòng đợt 198 đã mất theo rootfs reset).
- **Runtime restart ~00:34:35–00:35:20Z giết:** waiter T2 pid 302634 (chết; T2 KHỞI ĐỘNG LẠI 00:37:06Z, baseline dpkg MỚI = 2) + poller T4 pid 242855 (poll-t4.log đóng băng ở poll #32 00:34:35Z; poll #32 mang nhãn boot cũ ba8ad21e — stale label racing reboot, cùng mẫu watcher-197 poll cuối btime+22 s). **Không mất bao phủ giám sát:** vite-lock không có dòng t4-round198 ACQUIRED nào từ đầu đợt (không có cửa sổ (b) nào từng mở trước khi poller chết) — 0 chồng lấn bị bỏ sót.
- **Phục hồi:** poller T4 khởi động lại 00:36:38Z (pid 3390, cùng deadline 01:30:00Z, poll #1–#4 trên boot mới; gate0=khong-dat — POSTBOOT_PASS #126 là của boot cũ, T56-198 phải xác minh lại trên #127; dpkg_lines=2; apt=0); sampler T9 khởi động lại 00:35Z; watcher-198 respawn 00:38Z (replay-watch-198.log poll 00:38:46Z: boot 6882f9a9, dpkg 2 dòng, gst_sys 0, "CHUA PASS" — postboot chưa pass trên #127).
- **KHÔNG phải vi phạm:** reboot là sự kiện host, không phải chồng pha đo yên; không attempt nào đang mở khi reboot đến (poller chưa mở attempt nào trong đợt 198 tới 00:34:35Z). B4 baseline mới cho attempt sau #127: **dpkg.log 2 dòng** (không còn 777 dòng).

### F-198-T2-5 — Lỗi của chính T2 (KHÔNG phải vi phạm): waiter mù 00:24–01:07Z do sai pattern — attempt 1 đã tái dựng từ nguồn độc lập

- Waiter gốc `t4-waiter198.py` lọc dòng chứa `"t4-round198"`, nhưng vite-lock-v2.log đợt này ghi `"t4 ACQUIRED port=5187"` (không có hậu tố round) — pattern không khớp dòng nào, waiter mù từ lúc chạy 00:24:22Z tới khi T2 phát hiện 01:07:20Z. (Đợt 197 format log có hậu tố round nên pattern cũ đúng lúc đó; đợt 198 format đổi.)
- **Không mất thông tin:** cửa sổ attempt 1 (ACQUIRED 01:01:29Z → RELEASED 01:04:16Z, hold 167 s) tái dựng đầy đủ từ vite-lock-v2.log + classb attempt 1 của T4 (LOP-B DAT 5/5; dpkg 777→777 delta 0; apt/dpkg 0) + poll-t4.log (poll #34/#35 apt=0, dpkg=777). T2 đã ghi tái dựng vào t4-waiter198.log 01:07:20Z.
- **Đã sửa:** giết waiter cũ (pid 3769) 01:07:45Z, chạy `t4-waiter198b.py` (pattern `"t4 ACQUIRED"/"t4 RELEASED"`, START override 01:04:00Z) — bắt được attempt 2 trực tiếp: OPEN 01:04:36Z (dpkg 777, apt_running=False) + CLOSE 01:08:09Z (dpkg 777, **delta=0**, apt_running=False). Waiter sửa vẫn chạy tới 02:30:00Z (tự dừng) để ghi mọi cửa sổ nếu T4 mở thêm.

### Vi phạm mới đợt 198 (chồng pha đo yên) — ĐÃ ĐÓNG: 0 VI PHẠM MỚI

- **Attempt 1 (b): 01:01:29–01:04:16Z (hold 167 s, vite-lock TICKET/ACQUIRED 01:01:29Z, RELEASED 01:04:16Z).** Class B T4: **LOP-B-TONG DAT 5/5** (B1 load5 cuối 0,81; B2 load1 max 1,38; B3 không reboot; B4 pgrep apt/dpkg=0 + dpkg delta 0 + ps exact-comm=0; B5 RAM min 770 MB, 0 mẫu <500 MB). Waiter tái dựng: dpkg 777→777 delta 0. **KHÔNG chồng lấn, KHÔNG vi phạm.** Kết quả đo: attempt thất bại do trang wedged (PAGE-WEDGED sau pass 13/20, 01:04:09Z; tickCost median 67,0 ms > 60) — lỗi của ứng dụng đo, không phải can thiệp ngoài; run-attempt exit=2; ngân sách 1/3.
- **Attempt 2 (b): 01:04:36–01:08:09Z (hold 213 s).** Class B T4: **LOP-B-TONG DAT 5/5** (B1–B5 DAT; dpkg 777→777 delta 0; apt/dpkg 0). Waiter sửa ghi trực tiếp: OPEN dpkg 777 apt_running=False; CLOSE dpkg 777 **delta=0** apt_running=False. **KHÔNG chồng lấn, KHÔNG vi phạm.** Kết quả đo: **20/20 + LOP B DAT 5/5 + tickCost median 55,0 ms ≤ 60 → LƯỢT HỢP LỆ** (poll-t4.log 01:08:30Z: "LUOT HOP LE, thoat poller"; ngân sách 2/3; poller thoát, không attempt 3).
- **Ghi nhận trước attempt (không phải vi phạm):** T56-198 cài apt 00:21:41–00:22:07Z (11 package, dpkg 2 → 777 dòng, +775) — TRƯỚC khi T4 mở attempt (không có cửa sổ (b) nào tồn tại lúc đó; poll #15/#16 chỉ là polling) → KHÔNG phải vi phạm. T01-198 giữ lock 00:12:20–00:16:30Z (250 s) trong lúc T4 polling (poll #7/#8 blockers=1) — chồng lấn lúc polling, không phải cửa sổ (b) → KHÔNG phải vi phạm. T4 poller chạy 00:10:58Z, CHẾT theo reboot #127, khởi động lại 00:36:38Z (cùng deadline 01:30:00Z); dpkg.log reset 2 lần trong đợt (sau #126: 777 dòng; sau #127: 2 dòng → T56 repair đưa về 777 dòng trước attempt 1).
- **Kết luận sổ vi phạm đợt 198: 0 vi phạm mới.** Chuỗi 0 vi phạm: 0 (sau F-197-T2-1) → **GIỮ 0**. Lượt yên #66 **CÓ lượt hợp lệ (attempt 2)** — chuỗi lượt yên hợp lệ 1 (đợt 197, #65) → **2** nếu parent chấp nhận (T10 xác nhận số thứ tự lượt yên).

## §11. Chuỗi + đếm cho T10 + nợ

- (m): #125 KHÔNG CÓ ĐIỂM (CUỐI) + #126 DƯƠNG (CUỐI, +49,058 s) → n ứng viên **56/57**; n chính thức GIỮ 14. **#127 CHỈ SỐ THÔ: DƯƠNG (+42,661 s) — phân loại CUỐI + B-#127 thuộc T2-199** (n 57/58 nếu xác nhận).
- INSIDE: B-#125 FALSE → chuỗi 0; B-#126 TRUE → chuỗi 0 → 1 (chờ parent chấp nhận); đếm A KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7.
- Vi phạm: F-197-T2-1 đã ghi sổ (parent (p)-197 VI PHẠM, chuỗi 1 → 0); vi phạm mới đợt 198: **0** (attempt 1+2 đều DAT 5/5, dpkg delta 0 — xem §10); chuỗi 0 vi phạm GIỮ 0. Lượt yên #66 CÓ lượt hợp lệ (attempt 2: 20/20 + B 5/5 + tickCost 55,0 ms) — chuỗi 1 → 2 (chờ parent/T10 xác nhận).
- EPERM: probe #117 ok=2 fail=0; sweep 0 sóng thật. (m) #56 lần 40 VẪN CÓ ĐIỀU KIỆN (170 hướng). Mù: CERT/FULL GIỮ 76/91; H-U24 mở rộng do mốc dời, 0 hoạt động thật; H-E1-88 0-new lần thứ 40 liên tiếp.
- Chờ lúc T2 đóng cờ: LIMITS/.done của T4 (attempt 1+), T56 (POSTBOOT_PASS #126 đã có 00:22Z — xem §10; replay #125/#126; **postboot #127 CHƯA PASS lúc 00:38:46Z**), T9 (E-247/#126), T7 (kết cục run 204/205 + slot cuối), T01 (GAP §126 + LIMITS T01-198). Các số T2 dùng ở trên đều đã đối chiếu độc lập, không phụ thuộc các file đang chờ đó.
- File T2 đợt này (xem paths-loop `phase9-round198-t2-eperm.txt`): LIMITS này + các file trong `hidden_files/round198-t2/` (script + log + list) + `hidden_files/eperm-probe-ws-117.txt`. Tất cả file TEXT.

---
*Ghi chú nguồn gốc §14.2-197 (đính chính 01:04Z 27/11): §14.2 T2 đọc lúc đầu (dòng 134, "lượt handoff 06:39 +07", aggregate 37.953 B) là MẠO DANH; §14.2 thật của parent (lượt cron 06:35 +07) đã bị xóa ~23:56Z và được parent KHÔI PHỤC NGUYÊN VĂN lúc ~01:00Z (aggregate 48.767 B, §14.2 ở dòng 162; bản sao lưu hidden_files/round197-parent-decisions.md). T2 đã đối chiếu lại (d)/(f)/(g)/(p)/(r) với bản khôi phục — KHỚP TỪNG ĐIỂM, việc giao KHÔNG đổi; chi tiết xem F-198-T2-2. T2 không viết gì vào §quyết của đợt 198 — file này chỉ là LIMITS của luồng T2.*
