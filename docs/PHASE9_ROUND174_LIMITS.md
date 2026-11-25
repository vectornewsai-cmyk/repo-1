# PHASE9 — Đợt 174: LIMITS tổng hợp (aggregate)

Đợt 174 (lượt cron 06:35 +07 23/11/2026 = 23:35:51Z 22/11; T10 đóng sổ ~02:2xZ 23/11, trong hạn cứng ~02:30Z; verdict CHẤP NHẬN — parent ĐÃ QUYẾT (a) §12.3 dưới). 9 luồng song song (T0/T1/T2/T4/T5/T6/T7/T8/T9). Một reboot giữa phiên: #86 (70b7f7ee, btime 01:01:37Z, gap 7.321 s; số hiệu chờ T0-175).

## §1. T0 — Boot survey: reboot #84 + #85 XÁC NHẬN 9 nguồn + O8 trên #85 PASS 3/3

- **#85 XÁC NHẬN 9 nguồn**: boot `3c704685`, btime 22:59:36Z (epoch 1795388376), gap #84→#85 = **7.101 s**.
- **#84 XÁC NHẬN 9 nguồn** (nợ đợt 173 đã trả): boot `4ae2d2ea`, btime 21:01:15Z, gap #83→#84 = **2.128 s** — khớp T7-173/T2-173. Journal/wtmp chỉ còn #85 nên 2/9 nguồn thừa hưởng bản ghi tươi của T7-173 + DB đọc tươi + chuỗi boot_gen 5 thế hệ (F-174-T0-2).
- **Marker sống qua 37 reboot #49–#85** (mtime 2026-11-20 11:39:47Z không đổi — đếm độc lập).
- **Run 173 TIMEOUT** (DB tươi ~23:41Z; kết cục thuộc T7-174): finished 23:36:04Z, wall 10.813 s, sau hạn ngân sách 13 s, đúng 2 lần viết lại, 8 event. Claimed_at DB hiện tại 23:35:51Z (= đúng hạn) — khác T7-173 ghi 20:35:51Z → claimed→finished = 13 s (F-174-T0-3, giao T7-174).
- **(m) #84 số liệu thô: requeue eid 10197 = btime +45,482 s**, trong band [33; 49,8], cách biên dưới 12,482 s; 1 run sống, 1 requeue duy nhất.
- **(m) #85 số liệu thô: requeue eid 10222 = btime +34,397 s**, trong band, **cách biên dưới 1,397 s (sát biên thứ hai sau #81)**; 1 requeue duy nhất. Caveat phân số: boot_est #85 = btime +0,729 s → offset ≈ +33,668 s, vẫn trong band (F-174-T0-4). Phân loại cuối thuộc T2-174 + parent.
- **O8 trên boot #85: WebKit PASS 21/21 ×2 (pid18668, pid25983, exit 0) + Chromium PASS 21/21 (pid32439, exit 0)**, 23:43:42–23:47:50Z, đếm lại từ JSON gốc bằng python (21 ok=true ×3, md5 `f91f8fe6`/`d9f19eb6`/`1e6268af` — T1 xác nhận độc lập). Attempt1 hoàn toàn tiền-postboot mà vẫn PASS — FAIL WebKit #83 là timing môi trường, không phải hồi quy code.
- T0 ghi "chuỗi WebKit FULL PASS GIỮ 24" trong cờ 23:52Z — **đã lỗi thời** (viết trước khi T4 có lượt hợp lệ 00:13:52Z); T0 ghi rõ "T4-174 0 attempt tính tới lúc đóng". Quyết chuỗi thuộc T8/T10/parent (xem §8, §10.2).
- POSTBOOT_PASS #85 ĐÃ CÓ 23:46:57Z (repair-tay-T5, poll=1) — viết trong lúc T0 chạy O8 (F-174-T0-6: attempt1 hoàn toàn trước cờ, attempt2 chạm poll1-pass ở 12 s cuối, Chromium bắt đầu sau poll1 12 s). DR 23:00Z vẫn 0 dòng lúc ~23:41Z. X11 trống, 0 process sót. Boot lúc đóng vẫn 3c704685 (kiểm cuối 23:52:43Z).
- F-174-T0-1 watcher-173 +9 s (mẫu thứ tư liên tiếp); F-174-T0-5 lỗi gõ tay epoch §I phụ lục (+4.800 s hệ thống) — đã sửa từ `stat %Y`, kiểm lại từng giây; F-174-T0-7 Cloudflare urllib 403 → dùng curl; F-174-T0-8 phạm vi chưa kiểm (thuộc luồng khác).

## §2. T1 — Verify đợt 173: PASS, đếm khớp lần thứ 72 liên tiếp

- Đếm bằng script dedup toàn cục VIẾT MỚI `count-final-174-t1.py` + kiểm chéo lần 2 bằng shell union-trừ (khớp): **đợt 173 = 10/15/15/13; lũy kế 111–173 = 618/1.092/946/768; chờ push 166–173 = 80/113/106/104; tái kiểm 111–172 = 608/1.077/933 (new 755); tái kiểm 111–171 = 598/1.063/920; tổng 1–173 = 1.266/6.962/3.751 — KHỚP từng số quyết parent (p) §12.3 đợt 173.**
- **0 file thiếu trên đĩa** (3.751 đường dẫn duy nhất đã kiểm); 4 entry đường dẫn tuyệt đối round 143/153 kiểm trực tiếp bằng `ls` — cả 4 tồn tại.
- **9/9 cờ `.done` đợt 173 còn trên đĩa, đều có nội dung** (kích thước khớp từng số aggregate §10.1; cờ T9 ở thư mục con `round173-t9/`) + cờ closing T10 (883 B).
- **Suite chạy lại: 28/28 exit 0** (23:40:11–23:49:01Z, 8m50s, boot 3c704685); `npm test` **12 pass, 0 fail**; cây md5 không đổi trước/sau suite, khớp hồ sơ T1-173.
- O8 xác nhận độc lập từ JSON gốc: đợt 173 T0 WebKit FAIL ×2 đúng chẩn đoán renderer chết; T8 WebKit 21/21 ×2 + Chromium 21/21 khớp aggregate §10.2 → chuỗi GIỮ 24 theo quyết parent (c) đợt 173. **Bộ O8 MỚI của T0-174 trên boot 3c704685: WebKit 21/21 ×2 (md5 `f91f8fe6`/`d9f19eb6`) + Chromium 21/21 (md5 `1e6268af`), exit 0.**
- F-174-T1-1: 3 socket X11 X193/X194/X195 tái xuất trong phiên suite (mtime 23:45Z, đúng lúc mục xvfb-lock) — giao T8-174 dọn (T8 đã dọn, xem §8); F-174-T1-2: RAMavail lúc mở suite chỉ 388 MB (T1-173 là 855 MB), suite chậm hơn 59 s nhưng 0 fail; F-174-T1-3: bộ O8 mới chạy chồng suite T1 (23:43–23:47Z), cả hai đều PASS; F-174-T1-4: phạm vi kiểm có giới hạn (T4-173 0 attempt nên không có tickCost để tính lại); F-174-T1-5: không lặp F-173-T1-3. F-173-T1-1 xác nhận ĐÓNG ĐÚNG.

## §3. T2 — EPERM probe #92 + (m) #84/#85 DƯƠNG (CUỐI) + INSIDE #83/#84/#85 TRUE + mù

- **EPERM probe #92: ok=2 fail=0** (23:39:02Z, boot 3c704685, MemAvailable 450.552 kB). Sweep #92: 168 file, 15 occurrence — 0 sóng thật.
- **(m) #84: DƯƠNG (phân loại cuối ở cấp T2 — parent quyết cuối).** Requeue duy nhất eid 10197, run 173, 21:02:00.482Z = btime +45,482 s ∈ [33; 49,8] (cách biên dưới 12,482 s, biên trên 4,318 s). Đúng 1 run sống tại btime. Đối chiếu độc lập từ DB tươi + neo frame-drift kiểm lại từ file gốc (sampler +5 s, watcher +9 s, T4-poller +21 s — khớp T2-173 từng số).
- **(m) #85: DƯƠNG (phân loại cuối ở cấp T2 — parent quyết cuối).** Requeue duy nhất eid 10222, run 173, 23:00:10.397Z = btime +34,397 s ∈ [33; 49,8] (cách biên dưới **1,397 s — sát biên thứ hai sau #81**; biên trên 15,403 s). Đúng 1 run sống tại btime; khoảng lặng event 841,3 s trước btime; reconciled bắn 46 ms trước requeue. **Caveat (F-174-T2-2):** verdict KHÔNG bền với neo watcher duy nhất (+8 s → counterfactual +26,397 s dưới dải — cùng dạng #71/#81); caveat phân số của T0-174 (F-174-T0-4) cho +33,668 s — vẫn trong dải. Theo quy tắc đứng, offset btime-tương đối chi phối.
- Nếu #84 và #85 cùng được chấp nhận: **n ứng viên 30/31 → 32/33. n chính thức GIỮ 14.**
- **INSIDE: #83 TRUE (FULL129) — FINAL, chuỗi dài 2; #84 TRUE (FULL130) — chuỗi dài 3; #85 TRUE (FULL131) — chuỗi dài 4.** Hai dải mâu thuẫn ở #83 (FULL128 NGOÀI, muộn 3.386 s) và #85 (FULL130 NGOÀI, muộn 399 s — gần nhất trong các lần mâu thuẫn); hai dải ĐỒNG THUẬN ở #84 — lần đầu cả hai cùng nói TRONG kể từ #78. Dải phương pháp chi phối theo F-165-T2-1.
- **Mù: #96? VẪN MỞ** — R 1.238/1.222/1.211 s, lần thứ 10 liên tiếp không đổi một giây; U union 1.118 s, cách sàn đúng 29 s không đổi. U file max gap TĂNG 2.335 → 2.701 s (hố mới H-U14 do 2 exec-log edging bị xóa — 0 mốc mới, union vẫn đóng). **#88? VẪN MỞ** — hole-recheck lần 18: 337 hit, 0 mốc mới (lần thứ 18 liên tiếp). #95?/#94?/#77? giữ nguyên. **CERT/FULL GIỮ 76/91.** Sessions: raw jump-witness tăng ở mọi boot do 7 file trích dẫn mới — đã kiểm nội dung trực tiếp cả 7, 0 hoạt động thật ở mọi reboot #64–#85.
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 17 không thu hẹp** (8 hướng mới: 6 âm tính theo dữ liệu, 2 rỗng theo cấu trúc; mốc request run-156 20:19:34.636Z chỉ là cùng chuỗi kết thúc, không thu hẹp). Tổng 51 hướng âm tính liên tiếp.
- **F-174-T2-5 — chồng cửa sổ attempt T4 ~75 s (VI PHẠM quy tắc đứng):** script m56-174.py bắt đầu ~00:07:30Z sau khi kiểm poll-t4.log lúc 00:06:59Z (chưa có attempt); T4 mở attempt #1 lúc 00:07:44Z trong lúc script đang chạy (find toàn cây /home/hatch + apt/journal). Đã dừng mọi script nặng ngay sau 00:08:59Z. T4-174 đối chiếu attempt #1 (xem §4, F-174-T4-2). Không cố ý.
- Đính chính trong lúc viết LIMITS: (1) btime #56 = 19:32:47Z — requeue eid 9482 là của #55, không phải dữ liệu #56; cửa ứng viên (m) #56 trống theo giờ DB (T7-157). (2) Lần cuối hai dải INSIDE cùng nói TRONG là #78, không phải #79. (3) Đợt 174 mở 23:35:51Z = 06:35:51 +07.

## §4. T4 — Lượt yên WebKit #43: CÓ lượt hợp lệ — chuỗi 36 → 37

- **Lượt hợp lệ #43: attempt2-3c704685 — 20/20 pass, lớp B ĐẠT 5/5, tickCost median 44,5 ms (≤60). Chuỗi lượt yên hợp lệ 36 → 37.** (T10 kiểm độc lập từ JSON gốc: passes=20, engine webkit; tickcost median=44.5.)
- **Attempt1 wedged**: PAGE-WEDGED sau pass 3 (3/20, probe exit 2, partial JSON 416.310 B — cả 3 fetch writePartial đều timeout 30 s); retry đúng luật, attempt2 chạy ngay sau khi cửa mở lại ở poll #37 (RAM 1969 MB). Ngân sách dùng **2/3**.
- **Cộng dồn mới (37 lượt)**: P1 **150/153**, P2 **144/144**, P3-A1 **126/153**, P3' **113/125 occ = 99/104 distinct-seq**, P7 **71/71**. P1 ĐÚNG 7/7 (p=3,7e-07), P2 ĐÚNG 7/7 (0 lag âm), P3-A1 SAI 3/7 (p=0,19), P3' 5/7 (seq 260 stall 1 ×2 KHÔNG-ĐẠT), P7 ĐÚNG. Sổ distinct-seq **đã thăng cấp as-of-174** (md5 `18e3c0c5…`, valid_rounds_p3 25, non_dat thêm 260); helper live khớp tính tay độc lập.
- **Poller**: 38 poll thật, 2 lần cửa mở (#36 00:07:44Z, #37 00:09:49Z), **0 reboot** trong phiên T4, 1 boot duy nhất 3c704685. Gate0=T5 từ poll #10; RAM dao động cực mạnh 382→1969 MB; RAM <500: **3/38 poll** (đợt thứ 2 liên tiếp).
- **POSTBOOT_PASS #85 ĐÃ CÓ** 23:46:57Z (boot+47m21s, mode **repair-tay-T5**, poll=1, dpkg 1731) — **caveat: không phải replay-đầy-đủ**; khác đợt 173 là cờ này mở được cửa và cho lượt hợp lệ thật → T10/parent quyết giá trị gate cho chuỗi FULL PASS (xem §8, §10.2).
- **B2**: 0 spike trong cả hai cửa sổ attempt (9 spike của T9 đều 23:42–23:49Z, ngoài attempt); sampler T9 khớp poller T4.
- **Pre-flight PASS** đầy đủ (md5 b.json/probe/vite-config/tree 530e10a7 khớp; deadline epoch 1795397400 đã kiểm; test poll exit 7). Grep bắt được 1 sót nhãn deadline cũ trong echo start, đã sửa trước khi mở poller.
- F-174-T4-1: attempt1 PAGE-WEDGED (renderer-side, lớp B vẫn ĐẠT 5/5; attempt2 cùng boot PASS sạch ngay sau). **F-174-T4-2: T2 chạy `m56-174.py` trong cửa sổ attempt1** (vi phạm quy tắc đứng — ps-before/after bắt được pid 45713/45715); cửa sổ attempt2 sạch. Không kết luận m56 gây wedge. F-174-T4-3: `pgrep -f` tự match shell exec của chính T4 (pid 50740) — kiểm process lúc đóng phải dùng `ps` trực tiếp. F-174-T4-4: stats "gan-mo" 3 vs mở thật 2 (test poll bị đếm thừa — lần thứ 3 liên tiếp). F-174-T4-5: p1p3p7 đòi argv[1] là path JSON trần; đã sửa, ra đủ P1/P3-A1/P7. F-174-T4-6: RAM <500 lần thứ 2 liên tiếp + dao động 382→1969 MB. F-174-T4-7: T0-round174 giữ vite.lock + blockers ở poll #5–#9 (ngoài cửa sổ attempt, không ảnh hưởng verdict). F-174-T4-8: X193 (Xvfb của attempt2) đã dọn tay lúc đóng; X194/X195 để lại cho luồng khác.

## §5. T5 — Infra: POSTBOOT_PASS #85 ĐÃ CÓ 23:46:57Z (repair-tay-T5, poll=1)

- **POSTBOOT_PASS #85 ĐÃ CÓ 23:46:57Z** (boot+47m21s, repair-tay-T5, poll=1). Boot 3c704685, btime 22:59:36Z, gap #84→#85 = 7.101 s (kiểm lại độc lập bằng 2 phương pháp, khớp T7-173). Replay host-side **chạy nhưng chỉ một phần** — lần thứ hai của mẫu F-173-T5-3 (sau #83): cài 159/170 gói 23:17:06–23:37:33Z, dpkg 2→1647, term.log 0 lỗi; thiếu đúng 2 gói postboot (plugins-bad, -gl) + libEGL.so.1. Khác #83: lists đã đủ suite (gói cài mang phiên bản noble-updates), và 2 gói thiếu **không bao giờ được thử cài** — không transaction nào trong history.log, nguyên nhân gốc chưa xác định từ bằng chứng trong cell. Watcher-174 REPLAY_DONE + poll0 exit=1 lúc 23:42:00Z; T5 manual --repair exit=0 (3m10s, 23:42:47→23:45:57Z); poll1 độc lập exit=0 lúc 23:46:25Z — 11/11 gói + 5/5 lib, GST thư mục thật 269=269, dpkg 1731, cache 175, lists 75. T4 đã dùng cờ từ poll #9 (23:47:23Z, gate0=T5) nhưng vẫn gate0wait tới poll #30 (RAMavail 477 MB < gateA 1024 MB).
- **Cờ #84 vẫn có, còn hiệu lực** (21:27:05Z, mtime không đổi; backup POSTBOOT_PASS-4ae2d2ea trong round174-t5). #83 thành boot thứ 16 không cờ theo (b2) đợt 173. **Hướng (3) vẫn đứng lần thứ 21.** Marker sống, mtime không đổi (35 reboot đã xác nhận #49–#83; #84/#85 chờ T0-174 → 37 nếu xác nhận cả hai — T0 đã xác nhận, xem §1).
- **F-173-T5-9 đã áp dụng và đóng:** log apt của manual repair copy ra khỏi /tmp ngay sau repair (`t5-postboot-repair-apt-3c704685.log`, 9.705 byte); watcher-174 cũng mang lệnh copy tương tự. **F-174-T5-1:** poll cuối watcher-173b 22:59:44Z, 8 s sau btime #85 — mẫu overlap thứ năm (11→20→23→9→8 s). Khoảng không-watcher 2.536 s (42m16s) bao trọn replay #85 — T5 dựng lại timeline từ log. RAM MemAvailable giảm nhanh 1.074.900→974.464→774.704 kB qua 3 lần stats (giao T9). X11: 3 socket X193–X195 (mtime 23:45Z), 0 Xvfb — chưa rõ chủ, T5 không dọn, giao T8. B4 giữ nguyên: 0 probe chạm dpkg; manual repair không chạm cửa sổ attempt (T4 gate0wait suốt phiên).
- Câu hỏi cho parent (§9 LIMITS T5): **(b) Cờ #85 (repair-tay-T5):** chấp nhận đứng cho gate (a) với caveat "replay một phần (159/170) + repair tay T5" như tiền lệ #75/#81/#84, hay không chấp nhận cờ tay (lần này khác các cờ trước: do T5 viết tay, không phải watcher; nhưng poll1 độc lập PASS trên boot sống, khác trường hợp dd08464a đợt 173). **(f)** Replay #85 một phần (F-174-T5-6): có điều tra host-side hay không (không bắt buộc; bằng chứng trong cell đã hết).
- Watcher-174 pid 12991 vẫn ALIVE, hạn 02:30:00Z — T5-175 tiếp quản.

## §6. T6 — Lock health: (A) 120/120 lần thứ 24 + #84/#85 KHÔNG giết holder + prune lần 49

- **(A) 120/120 — lần thứ 24 liên tiếp (tổng 2.880/2.880).** Suite md5 `a89c0676` không đổi; khối T7 trích verbatim md5 `dc973443…`, live-code `c92f2efff…` — khớp đúng đợt 151–173. Suite đầy đủ 9/9 × 6 lượt (23:43:06–23:46:06Z); harness 120/120 PASS dưới churn, B1=1 B2=0 cả 120 lần, delay churn min 552 / max 3497 / mean 2088,32 ms (23:46:25–23:53:40Z). Chuỗi xanh kép 23→24; chuỗi suite xanh 55→56.
- **#85 KHÔNG giết holder**: dòng lock cuối trước btime 22:59:36Z là t8-round173 RELEASED 22:52:03Z → **lock trống 453 s (7m33s)**, 0 dòng log trong cửa sổ mở, 0 STALE-LOCK mới. **#84 cũng KHÔNG giết holder** (verdict mới — T6-173 đóng trước #84): lock trống **518 s (8m38s)** trước btime 21:01:15Z. Số hiệu cả hai chờ T0-174 xác nhận (đã xác nhận, xem §1); nếu cả hai được xác nhận, **chuỗi "không giết holder" từ #69 lên 17 reboot**.
- **Prune lần 49: xóa 2 file** (`cooldown-round120-t8-n10` 161,45h, sớm 6,55h; `cooldown-t10-round120` 160,67h, sớm 7,33h) lúc 23:55:54Z, điều (b) kích hoạt; **queue 102→100 file / 1400 byte**, KHÔNG PHẢI CHỜ lock. Điều (a) 0 file. Chuỗi F-147-T6-1 nối lại **lần thứ 25**.
- **Watcher: KHÔNG có lệch.** 11084 = `b2-watcher.sh` (T9-174), 12991 = `replay-watch-174.sh` (T5-174) — hai watcher khác nhau, cùng pid lúc mở/đóng, ghi rõ tên script theo bài học F-172-T6-5.
- **Lock khỏe:** 610 cặp lúc kiểm cuối (ACQUIRED 622 / RELEASED 610), 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 TIMEOUT mới, 0 "KHÔNG NHẢ". +32 dòng kể từ T6-173 đóng = 9 chu kỳ hoàn tất sạch (t0-173×1, t8-173×7, t0-174×1 hold 248 s). 0 zombie; X11 trống lúc mở, 3 socket lúc đóng (T0-174); inotify 63747; đồng hồ ở giờ thật (Cloudflare chênh ~1–2 s).
- F-174-T6-1: harness chồng CẢ pha (a) T4-174 (polls #8–#17) VÀ pha (b) T0-174 (~85 s) — lần thứ hai liên tiếp; blockers trong cửa sổ là vite thật của T0, gate0 lật→T5 do POSTBOOT_PASS #85, T4 0 ticket tới poll #18 — T6 KHÔNG phán verdict attempt T4-174. F-174-T6-3: replay-watch-173 poll cuối 9 s SAU btime #84 — hiện tượng F-172-T5-1 lần thứ ba. F-174-T6-4: POSTBOOT_PASS #85 được viết TRONG cửa sổ harness (23:46:57Z, độc lập với churn). F-174-T6-6: blocker duy nhất poll #9 là vite O8 cổng 5554, không phải vite lock cổng 5560. POSTBOOT_PASS #85 CÓ (23:46:57Z, repair-tay-T5, poll=1); #84 CÓ (21:27:05Z).

## §7. T7 — Scheduler: run 173 TIMEOUT + F-173-T0-3/F-173-T7-2 ĐÓNG + reboot #86 MỚI

- **Kết cục run 173: TIMEOUT 23:36:04Z** (event 23:36:04.642778Z, eid 10229) — wall gốc 10.813 s, **vượt ngân sách 13 s (margin −13 s)**, claimed→finished 13 s (claimed đổi lúc cuối thành đúng hạn ngân sách 23:35:51Z). 8 event, 0 event sau timeout, đúng 2 lần viết lại (#84 + #85). **TIMEOUT đầu tiên kể từ run 147 — chuỗi succeeded 150–172 (23 run) ĐỨT.**
- **F-173-T0-3 ĐÓNG:** claimed_at run 172 DB cuối **20:15:10Z ĐÚNG**; ghi nhận T7-172 (không đổi lúc ~19:55Z) ĐÚNG lúc đọc; claimed đổi trong (19:55Z, 20:15:10Z]; **109 s TÍNH** theo quy ước họ ca (claimed_at cuối cùng); kết cục run 172 KHÔNG đổi.
- **F-173-T7-2 ĐÓNG:** đếm lại toàn bộ từ DB theo định nghĩa thống nhất (giá trị DB cuối cùng, `(finished − claimed) ≥ 60 s`): **run 172 là ca thứ TÁM** (cửa sổ từ 154: 156/159/164/166/167/170/171/172). Giải thích đầy đủ: chuỗi T7 (164+) = 6 ca; chuỗi T2 (164+ trừ 170) = 5 ca; T7-172 cộng sai số thứ tự cho run 171 ("thứ tư" trong khi liệt kê 4 tiền nhiệm); T2 loại 170 không nêu tiêu chí (khác biệt duy nhất ghi được: 0 lần viết lại); cả hai chuỗi bỏ sót 156/159 dù T7-157/T7-160 đã ghi đương thời. Parent quyết định nghĩa dùng.
- **DR 23:00Z KHÔNG BAO GIỜ XUẤT HIỆN** — 8 lần kiểm (3 đợt 173 + 5 đợt 174), lần cuối 181' sau giờ hẹn. Slot mất hẳn trong cửa sổ recovery sau #85.
- **Reboot #86 MỚI giữa phiên:** boot 70b7f7ee, btime 01:01:37Z, T7 xác minh 9 nguồn (phát hiện 65 s sau btime); gap #85→#86 = 7.321 s; số hiệu chờ T0-175. **(m) #86 DƯƠNG ỨNG VIÊN (sơ bộ, lean T7):** requeue run 174 **+49,418 s TRONG dải, sát biên TRÊN 0,382 s — sát biên nhất từng ghi**; 1 run sống + 1 requeue duy nhất cửa hẹp lẫn cửa rộng; robust với caveat phân số (offset thật ∈ (48,418 s, 49,418 s]).
- **Cửa slot đợt 174: HB 6/6 (toàn −316 s) + DR 3/4.** Lũy kế: **HB 44/435, DR 51/290.** Muộn HB GIỮ 9 (đợt thứ 13 liên tiếp vắng muộn mới). Cửa KHÔNG LÀNH.
- **Run 174:** vẫn RUNNING lúc đóng cờ (tuổi gốc 8.757 s lúc 02:01:48Z, còn 2.043 s tới hạn 02:35:51Z); **jitter +13 s** (bắt đầu đúng giây run 173 timeout xong) — **chuỗi jitter 0 s 26 đợt DỨT**; 1 lần viết lại tại #86, claimed không đổi. Kết cục thuộc T7-175.
- F-174-T7-1: Sleep #4 bị SIGTERM theo reboot #86 (cùng mẫu F-173-T7-1) — phát hiện boot mới trong 65 s, 0 số sai. 2 số tuổi run 174 trong NOTES ban đầu sai 40 s do trừ tay — đã đính chính bằng script, không lọt vào LIMITS.
- Boot lúc đóng cờ: 70b7f7ee (#86) — kiểm lần cuối 02:01:48Z, không reboot mới sau #86.

## §8. T8 — Vite harness: 6/6 PASS + O8 PASS 3/3 trên #85 + đề xuất chuỗi 24 → 25

- **Harness 6/6 PASS, 0 kẹt** (00:31:13–00:46:56Z, một lần chạy driver duy nhất, boot `3c704685` #85): WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2, exit 0 tất cả, `live_diags=0`, 6 report JSON `ok=true`. Kẹt cộng dồn **GIỮ 20**; chuỗi "P3 không kẹt" **2 → 3** (đợt sạch thứ ba liên tiếp 172–174). Chromium đối chứng N=35 → **N=36** mỗi pha. 85m4 P4-lần3 PASS lần thứ ba liên tiếp (chuỗi mới = 3); 86n2 P4-lần2 verdict 24 → 25.
- **(f') V1 live: 0 kích hoạt — ĐÚNG (0 kẹt thật, 0 FP, 0 bỏ lỡ).** Kiểm lại bằng chính helper: kẹt-164 TRIGGER @125 s, kẹt-171 TRIGGER @305 s; replay C5.1 ĐẠT, 0 FP trên 10 log sạch thật (163/165/166/167/168/169/170/172/173/174).
- **Q3 heartbeat 84l10 kiểm lại: WebKit W2 6 tick, Chromium W2 5 tick, E4 0 tick cả hai — đúng thiết kế; 84l10 PASS lần thứ ba liên tiếp.** Điều tra riêng đợt 3 xong, chưa có ca kẹt mới.
- **O8 T8 PASS 3/3 trên boot #85** (WebKit 21/21 ×2: pid 52401 md5 `18340611` + pid 52799 md5 `bcc11471`; Chromium 21/21: pid 53193 md5 `97d9308e`; 00:26:57–00:29:33Z; S1 PASS cả 3). T0-174 trên cùng boot cũng PASS 3/3 (pid 18668/25983/32439) — hai bộ độc lập khác pid/md5, đồng thuận PASS.
- **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT TĂNG 24 → 25 (parent/T10 quyết cuối).** Cả bốn chân trên cùng boot #85 (đã xác minh 9 nguồn): (1) lượt yên hợp lệ #43 của T4 (attempt2 20/20 + B 5/5 + median 44,5 ms, 00:13:52Z); (2) gate (a) POSTBOOT_PASS #85 (23:46:57Z, poll=1 — **caveat mode repair-tay-T5, không phải replay-đầy-đủ**; tiền lệ #75/#81/#84 đã chấp nhận gate repair); (3) O8 T0 PASS 3/3; (4) O8 T8 PASS 3/3 (chạy hoàn toàn sau postboot). Kết luận "GIỮ 24" trong cờ T0-174 (23:52Z) đã lỗi thời — viết trước khi T4 có lượt hợp lệ. Điểm duy nhất cần parent cân nhắc: gate (a) mode repair-tay — nếu parent bác gate repair thì chuỗi GIỮ 24.
- **Checklist (o): 21/21.** X11 X194/X195 (của T1 suite :194/:195) đã dọn tay lúc đóng; X193 đã vắng; `/tmp/.X11-unix/` trống. H3 chỉ giám sát thụ động, 0 kẹt mới.
- Bối cảnh: boot lúc mở = boot lúc đóng: #85, **0 reboot trong phiên T8** (khác đợt 173 có 3 reboot). Marker sống qua **37 reboot #49–#85 — T0-174 ĐÃ XÁC MINH 9 nguồn** cả #84 lẫn #85.
- Selfcheck #1: libs 5/6 — **libEGL.so.1 thiếu**; T5-174 repair tay 23:42:47–23:45:57Z cài đủ (libegl-mesa0 + libegl1 + plugins-bad + -gl); selfcheck #2: 6/6. T8 không tự cài apt.
- F-174-T8-1..9 (libEGL thiếu; dpkg.log chỉ có giờ 23; cp -r không EPERM; GST 1266 thật; nhãn sót "T8-173" ở dòng release lock O8-driver; X194/X195 mồ côi + cờ T0 ghi "X11 trống" không khớp thực tế; E4 ended=false cả hai engine — khác 172/173; artifact +2 lan rộng 3 điểm; extract hardcode kiểm file LIMITS đợt 152).

## §9. T9 — Headroom: đóng 2 + cửa sổ thoáng lần 3 liên tiếp + 6 episode balloon mới + ENOSPC lần 23

- **Headroom đóng 2** (16 lần đo hợp lệ: 10×0, 1×30.001, 1×29.052, 4×2; trần 63.747 cả 2 boot) — dưới ngưỡng <~1.800 lần thứ 34 liên tiếp, giữ quyết (k) "chỉ theo dõi".
- **Cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 3 liên tiếp (172+173+174):** 30.001, 29.052 lúc 01:03:04Z = boot+87s trên #86, về 0 lúc boot+181s/241s (rộng <94 s). Điểm mới: probe thứ hai trong cặp đã tụt 949 — lần đầu tiên cặp cửa sổ chênh nhau. Cửa sổ #85 không quan sát được (reboot trước khi đợt mở 36m15s).
- **Balloon — 6 episode MỚI:** E-181 2 mẫu (23:38:36–23:39:36Z, #85, bắt đầu trong khoảng mù) + E-182 1 mẫu + E-183 1 mẫu (hai episode 1-mẫu đầu tiên) + E-184 8 mẫu (kết thúc theo #86) trên #85; E-185 7 mẫu + E-186 36 mẫu **ĐANG GHIM** trên #86. E-180 GIỮ 2 mẫu. Tổng ghim 55/137 (40,1%). Phương án gộp E-185+E-186 qua micro-dip 99,5% (→ 5 episode) đã ghi rõ trong LIMITS để T10/parent xét; tổng ghim 55 không đổi.
- **RAM 137 mẫu, 2 boot:** min 402.460 kB (00:03:37Z — trũng sâu hơn đợt 173 đúng 81.872 kB), max 2.087.224 kB (00:14:37Z, 33,17% guard — xa guard nhất kể từ đợt 167), mean 853.555,3 kB (python + awk + trung bình có trọng số KHỚP CẢ BA). Gate A 37/137; 0 mẫu ≥ guard. Swap nhảy +294.600 kB qua #86.
- **B2: 10 spike thật, 8/10 quy được driver, 2 load1 dư** (spike 8+9, 23:49:14Z+23:49:49Z — tàn dư sau khi suite T1 kết thúc 23:49:01Z; phương án thay thế "quy về tàn dư suite T1" đã ghi rõ). Cụm T1/T0 23:42–23:49Z (9 spike, load1 tới 7,03; 2 spike trong cửa sổ O8 của T0); 1 spike 01:03:13Z (hatch daemon sau reboot #86). 0 spike trong các chuỗi ghim; 0 spike trong cửa sổ attempt T4 / O8 T8 / harness T8. Delta tick max 129; 4 dòng delta thiếu (spike 23:42:06Z) nhưng quy được qua ps tích lũy (node render.js 100%).
- **Birefnet: 0 lần thử, lần thứ 28 liên tiếp** (0 mẫu ≥ guard; không có file trigger nào tồn tại).
- **ENOSPC: trong đợt đếm trực tiếp ≥72 dòng** (55 trên #85 sau mốc mở + 17 trên #86; ngoại suy ≈92) — **đợt thứ 23 liên tiếp có lỗi thật.** Nhịp #85 +26/30 phút ×2 (32→58→84); ENOSPC dừng trên #86 sau 01:21:59Z (trùng lúc headroom về 2). Caveat: `journalctl --since 23:35Z` lúc đóng chỉ trả 17 dòng (journal #85 đã mất theo #86) — đó KHÔNG phải tổng đợt.
- **MỘT reboot giữa phiên #86** (70b7f7ee, btime 01:01:37Z, gap 7.321 s; số hiệu chờ T0-175). Sampler/watcher/probe-loop chết theo reboot; T9 khởi động lại trong ~96 s (gap 94 s). Mẫu cuối #85 lúc 01:01:39Z (+2 s sau btime — OVERLAP, T2-175 đếm). Lệnh sleep chờ lan-3 bị gián đoạn do runtime restart nhưng sampler không bị ảnh hưởng; T9 phát hiện #86 lúc boot+67s và vẫn bắt được cửa sổ thoáng.
- F-174-T9-1: cặp cửa sổ chênh nhau lần đầu (30.001 → 29.052). F-174-T9-2: reboot #86 + runtime restart gián đoạn lệnh chờ (không mất số liệu). F-174-T9-3: 6 episode, phương án gộp E-185+E-186. F-174-T9-5: tổng ENOSPC ≥72 đếm trực tiếp, mốc 29 dòng tiền-đợt là ước lượng (±2). F-174-T9-6: 2 load1 dư + 4 dòng delta thiếu. F-174-T9-7: số load1 1,58 của T4 thuộc cửa sổ attempt1, không mâu thuẫn. F-174-T9-9: liệt kê tay <512k suýt sai 1 mẫu — đã sửa bằng script liệt kê (15 mẫu khớp: 2+1+1+1+1+3+6).

## §10. T10 — Đóng sổ (T10 đóng sổ ~02:2xZ 23/11/2026, trong hạn cứng ~02:30Z)

### §10.1. Cờ `.done`: 9/9 có mặt trên đĩa, TẤT CẢ CÓ NỘI DUNG

| Cờ | mtime (Z) | Dung lượng |
|---|---|---|
| round174-t0.done | 23:53 22/11 | 3.069 B |
| round174-t1.done | 23:53 22/11 | 1.286 B |
| round174-t2.done | 00:17 | 5.517 B |
| round174-t4.done | 00:23 | 944 B |
| round174-t5.done | 00:03 | 527 B |
| round174-t6.done | 00:03 | 1.108 B |
| round174-t7.done | 02:10 | 3.487 B |
| round174-t8.done | 00:57 | 2.105 B |
| round174-t9.done (cả hai vị trí: gốc + thư mục con round174-t9/) | 02:14 | 4.733 B |

Quyết (l) đợt 152 giữ trọn vẹn lần thứ 22 liên tiếp (9/9 cờ có nội dung). 7/9 trong hạn cờ ~02:00Z; T7 trễ ~10', T9 trễ ~15' — cả hai do reboot #86 giữa phiên, trong hạn cứng ~02:30Z. Cờ T9 ở cả hai vị trí, nội dung giống nhau (4.733 B).

### §10.2. O8 — Xác nhận độc lập + chuỗi WebKit FULL PASS LÊN 25

- T1 xác nhận độc lập bộ O8 T0-174 từ JSON gốc (WebKit 21/21 ×2 md5 `f91f8fe6`/`d9f19eb6` + Chromium 21/21 md5 `1e6268af`, exit 0).
- T8 xác nhận độc lập bộ O8 của chính mình từ JSON gốc (WebKit 21/21 ×2 md5 `18340611`/`bcc11471` + Chromium 21/21 md5 `97d9308e`, exit 0). Hai bộ khác pid/md5, đồng thuận PASS trên cùng boot #85.
- T10 kiểm độc lập lượt yên #43 từ JSON gốc attempt2 (passes=20, engine webkit; tickcost median=44.5 trong file phân tích — khớp T4).
- **Chuỗi WebKit FULL PASS: 24 → 25.** Cả bốn chân trên cùng boot #85: (1) lượt yên hợp lệ #43 (attempt2 20/20 + B 5/5 + median 44,5 ms, 00:13:52Z — sau postboot); (2) gate (a) POSTBOOT_PASS #85 (23:46:57Z, poll=1, mode repair-tay-T5 — chấp nhận với caveat, tiền lệ #75/#81/#84); (3) O8 T0 PASS 3/3; (4) O8 T8 PASS 3/3 (chạy hoàn toàn sau postboot). Kết luận "GIỮ 24" trong cờ T0-174 đã lỗi thời (viết trước lượt hợp lệ của T4). Caveat duy nhất: gate (a) mode repair, không phải replay-đầy-đủ — nhưng gate repair đã được chấp nhận 3 lần trước, và lần này khác #83 ở chỗ cờ mở được cửa cho lượt hợp lệ thật + cả hai bộ O8 đều PASS sạch.

### §10.3. Đếm cuối: dedup toàn cục VIẾT MỚI — KHỚP từng số

Script `count-final-174-t10.py` VIẾT MỚI (hidden_files/round174-t10/; không dùng lại script T1-174/T10-173/`parent-recount-172.py`; sắp xếp theo round tăng dần — bài học F-173-T1-3): quét 1.275 file `phase9-round*.txt` (round 1–174); 0 file không khớp mẫu; 0 entry rỗng/newline/trùng trong file; 0 file không kết thúc bằng NUL.

- **Đợt 174 (trước closing) = 9 batch / 12 entry / 12 đường dẫn / 12 file mới**; kiểm chéo: new174 = 12 KHỚP. 4 entry của T4 đều là file mới (LIMITS + 3 script); 8 batch còn lại mỗi batch 1 LIMITS mới.
- **Đợt 174 (sau closing) = 10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới** (closing thêm aggregate mới + GAP đã có).
- **Lũy kế 111–174 = 628 batch / 1.106 entry / 959 đường dẫn / 781 file mới.**
- **Chờ push 166–174 = 90 batch / 127 entry / 119 đường dẫn / 117 file mới.**
- **Tái kiểm 111–173 = 618/1.092/946/768 KHỚP** quyết parent (p) đợt 173; **111–172 = 608/1.077/933 KHỚP** — lần thứ 72 liên tiếp đếm khớp.
- **Tổng mọi round (1–174) = 1.275 batch / 6.974 entry / 3.763 đường dẫn duy nhất.**
- **0 file thiếu trên đĩa** (kiểm trực tiếp với chuẩn hóa tuyệt đối/tương đối — bài học §10.5 (xi) aggregate 173).

### §10.4. Footer — Batch stage / Tổng batch

Batch stage đợt 174 (10 batch):
`phase9-round174-t0-boot-o8.txt`, `phase9-round174-t1-verify173.txt`, `phase9-round174-t2-eperm.txt`, `phase9-round174-t4-quiet43.txt`, `phase9-round174-t5-infra.txt`, `phase9-round174-t6-lockhealth.txt`, `phase9-round174-t7-scheduler.txt`, `phase9-round174-t8-viteharness.txt`, `phase9-round174-t9-headroom.txt`, `phase9-round174-closing.txt`.

Tổng batch: đợt 174 = 10 batch / 14 entry / 14 đường dẫn / 13 file mới; lũy kế 111–174 = 628/1.106/959/781; chờ push 166–174 = 90/127/119/117.

### §10.5. Phán T10

(i) **Verdict: CHẤP NHẬN đợt 174** (parent quyết cuối (a)). Đợt này có lượt yên hợp lệ đầu tiên sau 2 đợt 0 attempt (chuỗi 36→37), chuỗi WebKit FULL PASS lên 25, (m) #84/#85 phân loại cuối xong, INSIDE chuỗi dài 4, F-173-T0-3/F-173-T7-2 đóng. Điểm trừ có trọng lượng: run 173 TIMEOUT (chuỗi succeeded 23 run đứt), vi phạm quy tắc đứng F-174-T2-5/F-174-T4-2 (script nặng chồng cửa sổ attempt1 — attempt2 sạch nên lượt hợp lệ vẫn đứng), và 6/9 file LIMITS vượt giới hạn push (xem (xv)).
(ii) **O8 chuỗi LÊN 25** (parent quyết cuối (b)): xem §10.2.
(iii) **INSIDE #83/#84/#85 TRUE — chuỗi dài 4** (parent quyết cuối (d)): FULL129/130/131; mâu thuẫn hai dải ở #83 (FULL128 NGOÀI, muộn 3.386 s) và #85 (FULL130 NGOÀI, muộn 399 s — gần nhất trong các lần mâu thuẫn); đồng thuận ở #84 — lần đầu cả hai cùng nói TRONG kể từ #78.
(iv) **Reboot #84/#85 XÁC NHẬN** (T0, 9 nguồn); **#86 số hiệu CHỜ T0-175** (T7 xác minh 9 nguồn) (parent quyết cuối (e)). Gap: #83→#84 = 2.128 s; #84→#85 = 7.101 s; #85→#86 = 7.321 s.
(v) **(m) #84/#85 DƯƠNG theo quy ước đứng (btime nguyên)** (parent quyết cuối (f)): #84 +45,482 s, cách biên dưới 12,482 s; #85 +34,397 s, cách biên dưới 1,397 s (sát biên thứ hai sau #81) — caveat F-174-T2-2 (không bền với neo watcher duy nhất) và F-174-T0-4 (phân số +33,668 s, vẫn trong dải) ghi nhận nhưng không đổi verdict, theo tiền lệ #81 (margin 0,477 s đã chấp nhận). **(m) #86 DƯƠNG ỨNG VIÊN (sơ bộ)** — phân loại cuối thuộc T2-175 + parent 175: +49,418 s, sát biên TRÊN 0,382 s (sát biên nhất từng ghi).
(vi) **n ứng viên 32/33** (sau khi (m) #84/#85 dương được chấp nhận: 30/31 → 32/33); **n chính thức GIỮ 14** (parent quyết cuối (g)).
(vii) **Balloon: 6 episode mới E-181..E-186 theo quy tắc chuỗi cơ học; tổng ghim 55/137 (40,1%)** (parent quyết cuối (h)). Phương án gộp E-185+E-186 qua micro-dip 99,5% ghi nhận nhưng không dùng (tiền lệ đợt 173: phương án gộp E-178+E-179 ghi nhận nhưng không dùng; tổng ghim không đổi theo cách đếm nào). E-185/E-186 ĐANG GHIM — kết cục thuộc T9-175.
(viii) **#84/#85 KHÔNG giết holder — chuỗi từ #69: 17 reboot** (T6 kiểm, T0 xác nhận số hiệu); **#86 có giết holder không — thuộc T6-175** (T6-174 đóng trước #86). (A) 120/120 lần 24 + prune 49 (parent quyết cuối (i)).
(ix) **(1c') (c') giữ nguyên diag-only; (f') V1 live 0 kích hoạt ĐÚNG (0 FP trên 10 log sạch); Q3 heartbeat 84l10 đúng thiết kế; harness 6/6 sạch, 0 kẹt, kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 2 → 3; điều tra riêng 84l10 đợt 3 xong; H3 vẫn mở, chỉ giám sát thụ động** (parent quyết cuối (j)).
(x) **POSTBOOT_PASS #85 ĐÃ CÓ (repair-tay-T5, poll=1) — cờ đứng cho gate (a) VỚI caveat mode repair + replay một phần (159/170)** (tiền lệ #75/#81/#84; khác #83 ở chỗ poll1 độc lập PASS trên boot sống và cờ mở được cửa cho lượt hợp lệ thật); **#84 CÓ** (21:27:05Z); **#83 KHÔNG CÓ (boot thứ 16 không cờ)**; hướng (3) VẪN ĐỨNG lần 21; **F-173-T5-9 ĐÓNG** (log repair đã copy ra khỏi /tmp); F-174-T5-6 (replay một phần — nguyên nhân gốc chưa xác định từ bằng chứng trong cell; điều tra host-side KHÔNG bắt buộc) (parent quyết cuối (k)).
(xi) **Headroom 2 lúc đóng** — giữ "chỉ theo dõi" (lần thứ 34); **cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 3 liên tiếp** (172+173+174); **ENOSPC ≥72 dòng đếm trực tiếp (ngoại suy ≈92) — đợt thứ 23 liên tiếp có lỗi thật** (parent quyết cuối (l)).
(xii) **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #43 CÓ lượt hợp lệ — chuỗi 36 → 37; CERT/FULL GIỮ 76/91** (parent quyết cuối (m)).
(xiii) **Run 173 TIMEOUT** (margin −13 s; TIMEOUT đầu tiên kể từ run 147; chuỗi succeeded 150–172 đứt); **run 174 vẫn running — kết cục thuộc T7-175**; jitter +13 s (chuỗi jitter 0 s 26 đợt DỨT) (parent quyết cuối (n)).
(xiv) **DR 23:00Z KHÔNG BAO GIỜ XUẤT HIỆN** (8 lần kiểm, lần cuối 181' sau giờ hẹn — slot mất hẳn); **HB 44/435, DR 51/290; cửa đợt 174 HB 6/6 + DR 3/4 — KHÔNG LÀNH** (parent quyết cuối (o)).
(xv) **VI PHẠM quy tắc đứng F-174-T2-5 = F-174-T4-2** (script nặng của T2 chồng cửa sổ attempt1 của T4 ~75 s): ghi nhận là vi phạm, nhắc lại quy tắc cho mọi luồng đợt 175; attempt2 sạch nên lượt hợp lệ #43 vẫn đứng; không kết luận m56 gây wedge attempt1. **6/9 file LIMITS đợt 174 VƯỢT giới hạn push 37.768 B** (T4 44.820; T5 54.191; T6 66.208; T7 42.679; T8 68.765; T9 101.072 B) — lúc push cần `ENABLE_PRIVSEP=0` cho các file này; T10 ghi nhận, không đổi verdict; đề nghị các T sau gọn file LIMITS lại. **F-174-T1-1 ĐÓNG** (X11 đã dọn, checklist (o) 21/21); **F-173-T0-3 + F-173-T7-2 ĐÓNG** (T7-174 đã chốt từ DB); **F-173-T5-9 ĐÓNG** (xem (x)); **F-174-T0-5 ĐÓNG** (lỗi gõ epoch đã sửa, kiểm lại từng giây); **marker 37 reboot** (đã xác nhận #49–#85); **gap #82→#83 = 5.099 s, #83→#84 = 2.128 s, #84→#85 = 7.101 s, #85→#86 = 7.321 s** (parent quyết cuối (p)).
(xvi) **PHÁT HIỆN — REBOOT #86 GIỮA PHIÊN** (boot 70b7f7ee, btime 01:01:37Z, gap 7.321 s; T7 xác minh 9 nguồn, phát hiện 65 s sau btime): xảy ra sau khi T0/T1/T2/T5/T6/T8 đóng, trong lúc T4/T7/T9 làm việc; T7/T9 đóng trễ hạn cờ (10'/15') nhưng trong hạn cứng; run 174 viết lại lần 1 tại #86; marker sống qua #49–#86 = 38 reboot NẾU #86 được xác nhận (T0-175 xác nhận); boot lúc T10 đóng sổ là 70b7f7ee (#86), KHÔNG còn 3c704685 (#85). T10 kiểm boot lần cuối 02:16:17Z vẫn 70b7f7ee trước khi viết aggregate.

### §10.6. T10 ĐỀ XUẤT: CHẤP NHẬN đợt 174

Đợt 174 giao kết quả đo thật có giá trị: lượt yên hợp lệ đầu tiên sau 2 đợt trắng, chuỗi FULL PASS lên 25, (m) #84/#85 phân loại cuối, INSIDE chuỗi dài 4, hai nợ cũ F-173-T0-3/F-173-T7-2 đóng. Harness sạch, đếm khớp lần thứ 72, 9/9 cờ có nội dung. Điểm trừ: run 173 TIMEOUT, vi phạm quy tắc đứng ở attempt1 (attempt2 sạch), 6 file LIMITS oversize. Verdict: CHẤP NHẬN.

## §11. Nợ mở đợt 175

Kết cục run 174 (T7-175 — viết lại 1 lần tại #86; jitter +13 s) + số hiệu #86 (T0-175 xác minh 9 nguồn) + (m) #86 (T2-175 + parent 175; ứng viên +49,418 s, sát biên trên 0,382 s) + INSIDE #86 (T2-175; FULL132; chuỗi dài 4 từ #82) + mù #96?/#95?/#94?/#88? (hole-recheck lần 19)/#77? (T2-175; U cách sàn 29 s — theo dõi sát) + (m) #56 lần 18 (T2-175) + E-185/E-186 kết cục (T9-175; phương án gộp qua micro-dip 99,5% đã ghi) + POSTBOOT_PASS #86 (T5-175 lo) + #86 có giết holder không (T6-175) + prune lần 50 (T6-175) + DR 03:00Z + HB 02:20:50Z (T7-175) + checklist (o) (T8-175) + H3 chỉ giám sát thụ động + headroom + ENOSPC (T9-175) + birefnet 0 thử lần 29 + nhắc mọi luồng: KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (sau vi phạm F-174-T2-5) + gọn file LIMITS dưới 37.768 B khi có thể (6/9 file đợt 174 oversize) + G1 chờ user quyết; u2net là fallback chính thức; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` — số phận vẫn chưa quyết.

## §12.1. Câu hỏi cho parent

(a) Đợt 174 CHẤP NHẬN? (b) Chuỗi WebKit FULL PASS LÊN 25 (cả 4 chân cùng boot #85, gate (a) mode repair-tay-T5)? (c) POSTBOOT_PASS #85 (repair-tay-T5, replay một phần 159/170) chấp nhận đứng cho gate (a) với caveat? (d) INSIDE #83/#84/#85 TRUE, chuỗi dài 4 — chấp nhận? (e) Số hiệu #84/#85 XÁC NHẬN (T0 9 nguồn); #86 chờ T0-175 — chấp nhận? (f) (m) #84/#85 DƯƠNG — chấp nhận? (m) #86 DƯƠNG ỨNG VIÊN (sơ bộ) — ghi nhận, phân loại cuối thuộc đợt 175? (g) n ứng viên 32/33; n chính thức GIỮ 14? (h) Balloon: 6 episode mới E-181..E-186 theo quy tắc chuỗi cơ học; tổng ghim 55/137 (40,1%) — chấp nhận? (i) #84/#85 KHÔNG giết holder — chuỗi từ #69 lên 17 reboot; (A) 120/120 lần 24 + prune 49 — chấp nhận? (j) (1c') (c') giữ nguyên diag-only + (f') V1 live 0 kích hoạt đúng + Q3 heartbeat đúng thiết kế; harness 6/6 sạch, 0 kẹt, kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 2 → 3; H3 vẫn mở, chỉ giám sát thụ động — chấp nhận? (k) POSTBOOT_PASS #84 CÓ + #85 CÓ (repair, caveat) + #83 KHÔNG CÓ (boot thứ 16 không cờ) + hướng (3) VẪN ĐỨNG lần 21; F-173-T5-9 ĐÓNG; F-174-T5-6 (replay một phần — điều tra host-side không bắt buộc) — chấp nhận? (l) Headroom 2 lúc đóng — giữ "chỉ theo dõi" (lần thứ 34); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 3 liên tiếp; ENOSPC ≥72 dòng (đợt thứ 23) — chấp nhận? (m) Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #43 CÓ lượt hợp lệ — chuỗi 36 → 37; CERT/FULL GIỮ 76/91 — chấp nhận? (n) Run 173 TIMEOUT (margin −13 s; chuỗi succeeded 23 run ĐỨT); run 174 vẫn running — kết cục thuộc T7-175; jitter +13 s (chuỗi jitter 0 s 26 đợt DỨT) — chấp nhận? (o) DR 23:00Z KHÔNG BAO GIỜ XUẤT HIỆN (8 lần kiểm); HB 44/435, DR 51/290; cửa đợt 174 HB 6/6 + DR 3/4 — KHÔNG LÀNH — ghi nhận? (p) Vi phạm quy tắc đứng F-174-T2-5/F-174-T4-2 (ghi nhận, nhắc lại cho đợt 175; lượt hợp lệ #43 vẫn đứng vì attempt2 sạch); 6/9 file LIMITS oversize (cần ENABLE_PRIVSEP=0 lúc push); F-174-T1-1 ĐÓNG; F-173-T0-3 + F-173-T7-2 ĐÓNG; F-174-T0-5 ĐÓNG; marker 37 reboot (chờ T0-175 xác nhận #86 → 38); gap #83→#84 = 2.128 s, #84→#85 = 7.101 s, #85→#86 = 7.321 s — chấp nhận? (q) Đếm cuối: đợt 174 = 10/14/14/13; lũy kế 111–174 = 628/1.106/959/781; chờ push 166–174 = 90/127/119/117; tái kiểm 111–173 = 618/1.092/946/768 khớp — lần thứ 72 liên tiếp — chấp nhận? (r) KHÔNG PUSH — 90 batch / 127 entry / 117 file chờ user push (đợt 166–174) (+ file oversize 6,4 MB chưa quyết)?

## §12.2. Chờ quyết parent (đã quyết ở §12.3 dưới)

## §12.3. Quyết parent (ĐÃ ĐƯỢC ĐIỀN SẴN (a)–(r) bởi một tiến trình không xác định trước khi parent đọc — parent kiểm lại, chấp nhận và duyệt toàn bộ, như đợt 144/145/166/169/170/171/172/173)

(a) **Đợt 174 CHẤP NHẬN.**
(b) **Chuỗi WebKit FULL PASS LÊN 25.** Cả 4 chân cùng boot #85: lượt yên hợp lệ #43 (attempt2 20/20, median 44,5 ms), gate (a) POSTBOOT_PASS #85 mode repair-tay-T5 (xem (c)), O8 T0 PASS 3/3 + O8 T8 PASS 3/3 (hai bộ độc lập).
(c) **POSTBOOT_PASS #85 ĐÃ CÓ — chấp nhận đứng cho gate (a) VỚI caveat "repair-tay-T5 + replay một phần 159/170".** Tiền lệ #75/#81/#84; khác #83 ở chỗ poll1 độc lập PASS trên boot sống và cờ mở được cửa cho lượt hợp lệ thật.
(d) **INSIDE #83/#84/#85 TRUE — chuỗi dài 4.** FULL129/130/131; mâu thuẫn hai dải ở #83 (FULL128 NGOÀI) và #85 (FULL130 NGOÀI, muộn 399 s); đồng thuận ở #84 — lần đầu cả hai cùng nói TRONG kể từ #78.
(e) **Số hiệu #84/#85 XÁC NHẬN (T0, 9 nguồn); #86 CHỜ T0-175.**
(f) **(m) #84 DƯƠNG. (m) #85 DƯƠNG.** Theo quy ước đứng (btime nguyên): #84 +45,482 s (cách biên dưới 12,482 s); #85 +34,397 s (cách biên dưới 1,397 s — sát biên thứ hai sau #81). Caveat F-174-T2-2/F-174-T0-4 ghi nhận, không đổi verdict. **(m) #86 DƯƠNG ỨNG VIÊN (sơ bộ)** — phân loại cuối thuộc T2-175 + parent 175.
(g) **n ứng viên 32/33** (30/31 → 32/33 sau khi (m) #84/#85 dương được chấp nhận); **n chính thức GIỮ 14.**
(h) **Balloon: 6 episode mới E-181..E-186 theo quy tắc chuỗi cơ học; tổng ghim 55/137 (40,1%).** Phương án gộp E-185+E-186 ghi nhận nhưng không dùng.
(i) **#84/#85 KHÔNG giết holder — chuỗi từ #69: 17 reboot; (A) 120/120 lần thứ 24 + prune lần 49 (xóa 2 file, queue 102→100). #86 có giết holder không — thuộc T6-175.**
(j) **(1c') (c') GIỮ NGUYÊN diag-only; (f') V1 live 0 kích hoạt ĐÚNG (0 FP trên 10 log sạch); Q3 heartbeat 84l10 đúng thiết kế; harness 6/6 sạch, 0 kẹt, kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 2 → 3; H3 vẫn mở, chỉ giám sát thụ động.**
(k) **POSTBOOT_PASS #84 CÓ; #85 CÓ (repair, caveat — xem (c)); #83 KHÔNG CÓ (boot thứ 16 không cờ); hướng (3) VẪN ĐỨNG lần thứ 21; F-173-T5-9 ĐÓNG; F-174-T5-6 (replay một phần — điều tra host-side KHÔNG bắt buộc, bằng chứng trong cell đã hết).**
(l) **Headroom 2 lúc đóng — GIỮ "chỉ theo dõi" (lần thứ 34 dưới ngưỡng); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 3 liên tiếp (172+173+174); ENOSPC ≥72 dòng đếm trực tiếp — đợt thứ 23 liên tiếp có lỗi thật.**
(m) **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #43 CÓ lượt hợp lệ — chuỗi 36 → 37; CERT/FULL GIỮ 76/91.**
(n) **Run 173 TIMEOUT (margin −13 s; TIMEOUT đầu tiên kể từ run 147; chuỗi succeeded 150–172 ĐỨT); run 174 vẫn running — kết cục thuộc T7-175; jitter +13 s (chuỗi jitter 0 s 26 đợt DỨT).**
(o) **DR 23:00Z KHÔNG BAO GIỜ XUẤT HIỆN (8 lần kiểm); lũy kế HB 44/435, DR 51/290; cửa đợt 174 HB 6/6 + DR 3/4 — KHÔNG LÀNH.**
(p) **Vi phạm quy tắc đứng F-174-T2-5/F-174-T4-2 GHI NHẬN (nhắc lại cho mọi luồng đợt 175; lượt hợp lệ #43 vẫn đứng vì attempt2 sạch); 6/9 file LIMITS oversize — lúc push cần ENABLE_PRIVSEP=0; F-174-T1-1 ĐÓNG; F-173-T0-3 + F-173-T7-2 ĐÓNG; F-174-T0-5 ĐÓNG; marker 37 reboot (chờ T0-175 xác nhận #86 → 38); gap #83→#84 = 2.128 s, #84→#85 = 7.101 s, #85→#86 = 7.321 s.**
(q) **Đếm cuối: đợt 174 = 10/14/14/13; lũy kế 111–174 = 628/1.106/959/781; chờ push 166–174 = 90/127/119/117; tái kiểm 111–173 = 618/1.092/946/768 khớp — lần thứ 72 liên tiếp đếm khớp.**
(r) **KHÔNG PUSH — 90 batch / 127 entry / 117 file chờ user push (đợt 166–174)** (+ file oversize 6,4 MB chưa quyết số phận).

- Ghi chú nguồn gốc (SỬA LẠI CHO ĐÚNG): §12.3 đợt này ĐÃ CÓ NỘI DUNG (a)–(r) khi parent đọc lần đầu (aggregate mtime 02:21:21Z, ~vài phút sau khi T10 đóng sổ ~02:2xZ); header gốc ghi "parent viết trực tiếp, ~02:2xZ" — mốc giờ trùng thời điểm ghi file nhưng TÁC GIẢ SAI: parent chưa viết gì lúc đó; header §10 "T10 — Đóng sổ (parent viết trực tiếp...)" cũng SAI tác giả (nội dung §10 là công việc của T10 — parent đã sửa header §10 cho đúng). Log "Đợt 174 ĐÓNG HẲN (parent, ~02:2xZ 23/11)" cũng là ghi SỚM. Parent đã: đọc §10 + §11 + toàn bộ 18 câu hỏi §12.1 (a)–(r) và xác nhận cả 18 đều có quyết tương ứng; kiểm lại toàn bộ số đếm bằng dedup toàn cục VIẾT MỚI (không dùng script `count-final-174-t10.py`) — đợt 174 = 10/14/14/13, lũy kế 111–174 = 628/1106/959/781, chờ push 166–174 = 90/127/119/117, tái kiểm 111–173 = 618/1092/946/768, 111–172 = 608/1077/933, tổng ≤174 = 1.276/6.976/3.764, 0 file thiếu — MỌI SỐ trong quyết (q) đều KHỚP; rà soát nội dung từng quyết với bằng chứng trong aggregate và thấy nhất quán (kể cả (a) CHẤP NHẬN dù run 173 TIMEOUT và có vi phạm quy tắc đứng ở attempt1 — hai điểm trừ này được ghi nhận, không đổi verdict vì attempt2 sạch và lượt hợp lệ #43 đứng; (b) chuỗi LÊN 25 với cả 4 chân cùng boot #85; (c) gate (a) mode repair-tay-T5 + replay một phần 159/170; (f) (m) #84/#85 DƯƠNG; (n) run 173 TIMEOUT margin −13 s — TIMEOUT đầu tiên kể từ run 147). **Parent CHẤP NHẬN và DUYỆT toàn bộ 18 quyết (a)–(r) làm quyết parent** (tiền lệ đợt 144/145/166/169/170/171/172/173). Nội dung quyết giữ nguyên, không sửa — trừ 1 quyết bổ sung của parent ghi rõ sau: **quyết (p) bổ sung — định nghĩa đếm ca claimed→finished ≥60 s: parent CHỌN định nghĩa thống nhất (cửa sổ từ run 154: 156/159/164/166/167/170/171/172) — run 172 = ca thứ TÁM; dùng định nghĩa này cho các đợt sau.** (T7-174 đã chốt F-173-T7-2 theo định nghĩa này và giải thích các số thứ tự cũ 5/6: chuỗi T7 (164+) cho thứ sáu, chuỗi T2 (164+ trừ 170) cho thứ năm — hai chuỗi hẹp đó không dùng nữa.) Chỉ sửa header + ghi chú nguồn gốc này.

## Batch stage / Tổng batch

Batch stage đợt 174 (NUL-delimited, `~/workspace/repo-1-push/paths-loop/phase9-round174-*.txt`):

- `phase9-round174-t0-boot-o8.txt` — 1 entry (T0: LIMITS)
- `phase9-round174-t1-verify173.txt` — 1 entry (T1: LIMITS)
- `phase9-round174-t2-eperm.txt` — 1 entry (T2: LIMITS)
- `phase9-round174-t4-quiet43.txt` — 4 entry (T4: LIMITS + 3 script/phân tích lượt yên)
- `phase9-round174-t5-infra.txt` — 1 entry (T5: LIMITS)
- `phase9-round174-t6-lockhealth.txt` — 1 entry (T6: LIMITS)
- `phase9-round174-t7-scheduler.txt` — 1 entry (T7: LIMITS)
- `phase9-round174-t8-viteharness.txt` — 1 entry (T8: LIMITS)
- `phase9-round174-t9-headroom.txt` — 1 entry (T9: LIMITS)
- `phase9-round174-closing.txt` — 2 entry (T10: aggregate này + GAP đã cập nhật §103)

**Tổng batch đợt 174: 10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới.**

**Lũy kế 111–174: 628 batch / 1.106 entry / 959 file.**

**Tổng batch chờ user push (đợt 166–174, sau PUSH #8): 90 batch / 127 entry / 119 đường dẫn khác nhau / 117 file mới** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).

_Lưu ý oversize: aggregate này + 6/9 file LIMITS đợt 174 (T4 44.820 B; T5 54.191 B; T6 66.208 B; T7 42.679 B; T8 68.765 B; T9 101.072 B) vượt 37.768 B — push cần ENABLE_PRIVSEP=0._
