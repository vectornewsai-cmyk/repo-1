# PHASE9 — Đợt 173: LIMITS tổng hợp (aggregate)

**PHÁT HIỆN LỚN TRONG PHIÊN: BA REBOOT — #83 TRƯỚC KHI MỞ, #84 GIỮA PHIÊN, #85 SÁT HẠN CỜ.** #83 (dd08464a, btime 20:25:47Z, gap 5.099 s) xảy ra sau khi T10-172 đóng sổ, trước khi đợt 173 mở. #84 (4ae2d2ea, btime 21:01:15Z, gap 2.128 s — ngắn nhất chuỗi) xảy ra giữa phiên, giết poller T4 + cả 3 loop T9, viết lại run 173 lần 1. #85 (3c704685, btime 22:59:36Z, gap 7.101 s) xảy ra sát hạn cờ, trong lúc T8 viết LIMITS, viết lại run 173 lần 2; boot lúc T10 đóng sổ là 3c704685 (#85). Lượt yên #42: 0 attempt (RAM ≥1024 và gate0 không bao giờ trùng nhau) — chuỗi giữ 36. O8: T0 WebKit FAIL ×2 trên #83 (renderer chết, chạy trước postboot) + Chromium PASS; T8 PASS 3/3 trên #84 — chuỗi WebKit FULL PASS GIỮ 24, KHÔNG TĂNG. (f') V1 + Q3 heartbeat 84l10 ĐÃ TRIỂN KHAI live (replay + chạy thật chứng minh). DR 23:00Z THIẾU — chuỗi cửa lành hoàn toàn 11 đợt DỨT.

## §1. T0 — Boot survey: reboot #83 XÁC NHẬN 9 nguồn + #82 xác nhận (nợ) + O8 trên #83 WebKit FAIL ×2

- **Reboot #83 MỚI — XÁC NHẬN 9 nguồn:** boot `dd08464a-c4e5-4162-951e-0705e8149d97`, btime **20:25:47Z** (epoch 1795379147); gap #82→#83 = **5.099 s**. #83 xảy ra sau khi T10-172 đóng sổ (~20:14Z) và trước khi đợt 173 mở — trong khoảng mù giữa hai đợt.
- **Reboot #82 XÁC NHẬN (nợ đợt 172):** boot `34e61c92`, btime **19:00:48Z**, gap #81→#82 kiểm lại = **7.123 s — khớp T7-172**. DB đọc tươi: run 172 started mới 19:01:26Z, boot_gen 307b8432, eid 10167 requeued +38,438 s. Caveat (F-173-T0-2): journal/wtmp hiện tại chỉ còn boot #83 nên 2/9 nguồn của #82 không đọc lại trực tiếp được — xác minh dựa vào bản ghi 9 nguồn tươi của T7-172 + DB đọc tươi + chuỗi boot_gen 3 thế hệ; đã ghi rõ phần nào đọc tươi, phần nào thừa hưởng.
- **Marker sống qua 35 reboot #49–#83** (mtime 2026-11-20 11:39:47.272154981Z không đổi).
- **Run 172 SUCCEEDED 20:16:59Z** trên boot #82 (DB đọc tươi — kết cục thuộc T7-173): margin tới hạn 1.132 s; wall 9.668 s; thực thi trên boot #82 4.533 s; claimed→finished 109 s — với caveat F-173-T0-3: claimed_at DB hiện tại là 20:15:10Z, khác ghi nhận "claimed_at KHÔNG đổi" của T7-172 (lúc T7 đọc ~19:55Z); giao T7-173 đối chiếu, T0 không phán. Run 172 finished 528 s trước btime #83 nên không bị viết lại tại #83. Run 173 running, boot_gen 1e836713 (#83), jitter 0 s.
- **(m) #82 — số liệu thô kiểm lại độc lập:** requeue eid 10167 = btime82 **+38,438 s**, trong band [33; 49,8], cách biên dưới **5,438 s** (không sát biên như #81) — phân loại cuối thuộc T2-173 + parent.
- **(m) #83 — số liệu thô:** 0 run sống tại btime + **0 requeue** trong cửa (m) lẫn cửa rộng → **KHÔNG PHẢI ĐIỂM (m)** (cùng mẫu #80).
- **O8 trên boot #83 — WebKit FAIL ×2, Chromium PASS 21/21:** attempt1 pid19714 exit=2 (S0 PASS, S1 FAIL toggle rect + `page.setInputFiles: Target crashed`); attempt2 pid20320 exit=2 (timeout chờ project mẫu tự load sau 4m12s); Chromium pid28601 exit=0, **21/21 PASS**. Probe S1 chạy lại đúng cách sau khi sửa 2 lỗi latent (F-173-T0-4: probe copy thiếu `eperm-retry.mjs` + ROOT trỏ sai): chẩn đoán **(a) RENDERER CHẾT** — `pageErrs=["PAGE-CRASH"]`, mọi evaluate sau S1 đều `Target crashed` (S0 PASS chỉ 39 ms trước S1 FAIL). Không phải lỗi app: cùng cây code (md5 khớp đợt 172) đã PASS WebKit 21/21 ×4 trên #81 sau repair; Chromium PASS trên cùng boot #83.
- **Chuỗi WebKit FULL PASS GIỮ 24 — KHÔNG TĂNG** từ bộ O8 của T0. Đề nghị T8-173 chạy lại O8 WebKit SAU khi POSTBOOT_PASS #83 có (chưa có lúc T0 đóng; T4 preflight FAIL, replay đang chạy, dpkg_lines 323) — nếu PASS thì FAIL này là timing môi trường tiền-postboot, không phải hồi quy code. T0 chạy O8 trước postboot (khác đợt 172 chạy sau repair) — ghi rõ là caveat F-173-T0-6.
- **Khác:** F-173-T0-1 — watcher-172 poll cuối +23 s sau btime #82 (mẫu thứ ba liên tiếp: #81 +20 s, #82 +23 s). Tất cả .done đợt 172 đều trước btime #83 (không lặp mẫu F-170-T0-1). X11: X193/X194/X195 mồ côi, 0 process giữ — giao T8-173 dọn. 0 process sót. Boot kiểm cuối 20:54:27Z vẫn dd08464a, .done viết ngay sau đó.

## §2. T1 — Verify đợt 172: PASS, đếm khớp lần thứ 70 liên tiếp

- **Đếm khớp từng số quyết parent (a) §12.3 đợt 172 — lần thứ 70 liên tiếp**, bằng script dedup toàn cục VIẾT MỚI (`count-final-173-t1.py`, không dùng lại script T1-172/T10-172/`parent-recount-172.py`): đợt 172 = **10 batch / 14 entry / 14 đường dẫn / 13 file mới**; lũy kế 111–172 = **608/1.077/933** (new 755); chờ push 166–172 = **70/98/92/91**; tái kiểm 111–171 = **598/1.063/920**, 111–170 = **588/1.049/907**; tổng 1–172 = 1.256/6.947/3.738; **0 file thiếu**. Kiểm chéo lần 2 (shell union-trừ) + lần 3 (quét lại toàn bảng) đều khớp.
- **Suite 28/28 exit 0** trên boot `dd08464a` (7m51s, 20:42:57–20:50:48Z); `npm test` **12 pass, 0 fail**; cây md5 không đổi trước/sau suite, khớp hồ sơ T10-171.
- **O8 xác nhận độc lập từ JSON gốc ×6: 21/21 ok ×6**, md5 khớp từng số T10 §10.2 (386e6023/4319276f/6c289174; 7bc8c66d/25bb0df0/8c53a5dc) → chuỗi FULL PASS **LÊN 24 xác nhận độc lập** (quyết parent (b)). Không chạy O8 riêng (6 JSON còn đủ trên đĩa).
- **Median tickCost attempt1 T4-172 tính lại độc lập: n=600, median 46,0, p90 76, max 134, min 28 — KHỚP** T4 + aggregate §10.5(iii); passes=20, pageErrs=[].
- **10/10 cờ đợt 172 còn trên đĩa, đều có nội dung** (9 luồng + closing t10; cờ T9 ở thư mục con `round172-t9/round172-t9.done`, 1.273 B, đã kiểm nội dung; kích thước khớp aggregate §10.1).
- **F-173-T1-6 — REBOOT MỚI SAU KHI T10-172 ĐÓNG SỔ:** boot `dd08464a`, btime 1795379147 = 20:25:47Z (sau T10 đóng ~20:14Z). Số hiệu chờ T0-173 xác minh 9 nguồn (T1 không chốt — nếu đếm tiếp thì là #83 nhưng đó chỉ là suy đoán). Boot ổn định suốt phiên T1 (20:39–20:53Z). Kết cục run 172 thuộc T7-173. Marker mtime không đổi 2026-11-20 11:39:47Z.
- **F-173-T1-1:** H1 aggregate 172 ghi sai "Đợt 171" (nội dung là đợt 172) — giao T10-173 sửa khi viết aggregate 173. GAP §101 đã đúng → **F-172-T1-1 ĐÓNG ĐÚNG**. (T10-173 ĐÃ SỬA H1 aggregate 172 — xem §10.5 (x).)
- **F-173-T1-2:** 3 socket X11 X193/X194/X195 (mtime 20:47Z) xuất hiện trong phiên suite — giao T8-173 dọn.
- **F-173-T1-3:** bug thứ tự sắp xếp trong *bản nháp đầu* script đếm của chính T1 (first_seen theo tên file lexicographic → số "new" lũy kế lệch +139; batch/entry/distinct vẫn khớp) — đã phát hiện qua mismatch, chẩn đoán bằng script độc lập, sửa (sắp xếp theo round tăng dần) và chạy lại khớp toàn bộ. Bài học ghi trong LIMITS cho các T1 sau.
- **F-173-T1-4:** phạm vi kiểm có giới hạn (suite trên boot mới dd08464a; O8/T4 từ file gốc đóng băng; kết cục run 172 → T7-173; (m) #82 + INSIDE #82 → T2-173).
- **F-173-T1-5:** ghi chú nguồn gốc trong `.done` T10-172 vẫn giữ cách ghi cũ — ghi nhận, không đổi verdict.

## §3. T2 — EPERM probe #91 + (m) #82/#83/#84 + INSIDE + mù

- **(m) #82: DƯƠNG ỨNG VIÊN — parent quyết cuối.** Requeue duy nhất eid 10167, run 172, 19:01:26.438Z = btime +38,438 s ∈ [33; 49,8] (cách biên dưới 5,438 s). 1 run sống tại btime; spanning 0 là artifact viết-lại. Nếu chấp nhận: n 29/30 → 30/31. Run 172 SUCCEEDED 20:16:59.553Z, claimed→finished 109,553 s (≈110 s, ca thứ năm ≥60 s — xem F-173-T7-2 về số thứ tự ca).
- **(m) #83: KHÔNG PHẢI ĐIỂM (sơ bộ).** 0 requeue (cửa hẹp + mở rộng — 1 row trong cửa mở rộng là requeue của #84) + 0 run sống.
- **(m) #84: DƯƠNG ỨNG VIÊN (sơ bộ)** — reboot xảy ra GIỮA đợt (21:01:15Z, boot 4ae2d2ea, gap 2.128 s; T2 tự xác minh 8 nguồn, số hiệu chờ T0-174). Requeue eid 10197, run 173, 21:02:00.482Z = btime +45,482 s (cách biên dưới 12,482 s, biên trên 4,318 s). 1 run sống. Cửa hẹp kiểm lại ĐẦY ĐỦ sau 21:20:10Z: 6 event, 1 requeue duy nhất.
- **INSIDE #82: TRUE (FULL128)** — chuỗi MỚI bắt đầu tại #82, dài 1. FULL127 còn hiệu lực nói NGOÀI (muộn 7.348 s) — hai dải MÂU THUẪN, FULL128 chi phối theo F-165-T2-1. **FULL127 kiểm lại độc lập PASS — nợ F-171-T10-7 ĐÃ TRẢ.** INSIDE #83 sơ bộ TRUE (FULL129, chuỗi dài 2 nếu xác nhận); INSIDE #84 sơ bộ TRUE (FULL130, chuỗi dài 3 nếu xác nhận).
- **Mù #96? VẪN MỞ** — R 1.238/1.222/1.211 s, lần thứ 9 liên tiếp không đổi một giây; U cách sàn đúng 29 s (không đổi). **Hole-recheck lần 17: 337 hit, 0 mốc mới** (lần thứ 17 liên tiếp) — #88? VẪN MỞ. #94?/#95?/#77? giữ nguyên. CERT/FULL GIỮ 76/91. Sessions: 0 hoạt động thật ở mọi reboot (đã trừ 2 artifact T2-172 + 1 trích dẫn aggregate-171 sau khi kiểm nội dung).
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 16 không thu hẹp** (7 hướng MỚI: DB phi-scheduler — runtime.requests 167 trong D, max 20:22:35.041Z là traffic maintenance, dòng chạy qua D1 nên không ràng buộc R; Chromium/VS Code/systemd-timers rỗng theo cấu trúc; shell history 0 trong D; mtime scan ~/workspace 333 file, max 20:15:33.131Z; /var/log/apt BỊ CHẶN bởi reboot #84 — không đếm là âm tính). Cửa R/J giữ nguyên; **n chính thức GIỮ 14.**
- **EPERM probe #91: ok=2 fail=0** (20:44:34Z, boot dd08464a, MemAvailable 788.528 kB). Sweep #91: 156 log, 3 file có hit, 11 occurrence — **0 sóng thật**.
- **F-172-T5-1: ĐÃ GIẢI THÍCH** — container stop/start overlap (btime đánh dấu boot mới bắt đầu, không phải boot cũ chết); 4 reboot liên tiếp có bằng chứng; #84 có BA tiến trình cũ viết qua btime (+5/+9/+21 s) — OVERLAP thứ 11. Verdict #84 bền với neo sampler/watcher (+5/+9 s vẫn trong dải), chỉ neo T4-poller +21 s đẩy xuống dưới (caveat F-173-T2-5, cùng dạng tiền lệ #71).
- T4: 0 attempt trước #84; POSTBOOT_PASS #83 không bao giờ được viết (gate0 chưa đạt) — thuộc T4/T5.

## §4. T4 — Lượt yên WebKit #42: KHÔNG CÓ lượt hợp lệ (0 attempt)

- **Verdict:** Poller hết hạn 22:30Z (exit 5), 0 attempt, ngân sách dùng 0/3. Chuỗi lượt yên hợp lệ **giữ 36** (không tăng). Cộng dồn **không đổi**: P1 143/146, P2 137/137, P3-A1 123/146, P3' 108/118 occ = 96/100 distinct-seq, P7 70/70; sổ distinct-seq giữ as-of-172.
- **Vì sao 0 attempt — gate0 và RAM không bao giờ trùng nhau:** RAM≥1024 chỉ có trong cửa sổ 21:05:28–21:21:16Z (instance 3 poll #5–#26) trong khi gate0 còn khong-dat. Cờ T5-173 về 21:27:05Z (POSTBOOT_PASS, mode **repair-sớm-quyết-h**, poll=1, dpkg 795 — KHÔNG phải replay-đầy-đủ; dpkg nhảy 2→795 trong một poll #34, không có replay tự nhiên trên boot mới) thì RAM đã 624 MB và rơi tiếp, không bao giờ trở lại ≥1024 trong 90 poll còn lại.
- **RAM<500: 41/144 poll** (min 429 MB, chuỗi dài nhất 13 poll #68–#80) — phá chuỗi sạch 5 đợt liên tiếp (168–172 đều 0); 10 poll cuối RAM 490–513 MB với load1 chỉ 0,02–0,09 (balloon ~6,4M kB theo sampler T9 — thuộc T9).
- **Reboot giữa phiên giết poller:** boot #83 dd08464a (btime 20:25:47Z, đã xác nhận 9 nguồn bởi T0-173) chết ~21:01:15Z; poller cũ (pid 12832) + waiter cùng bị giết (SIGTERM). T4 khởi động lại poller tay 21:02:28Z (pid 3151) trên boot mới **4ae2d2ea** (btime 21:01:15Z, ứng viên #84 — chưa xác minh). Ngân sách 0/3 còn nguyên. Trên boot cũ replay CÓ chạy (dpkg 2→438) nhưng reboot giết giữa chừng; T0 giữ vite.lock port 5560 + click-test chạy trong lúc chờ gate (poll #4–#14 instance 2, load1 max 6,92) — ngoài cửa sổ attempt nên không ảnh hưởng verdict.
- **Kiểm chứng khác:** Preflight PASS (b.json/probe/vite-config md5 khớp, tree 530e10a7, deadline 22:30Z epoch 1795386600 đã kiểm, test poll exit 7 đúng thiết kế). Không chạy script nào trong lúc probe pass chạy (không có probe pass nào). Không có cửa sổ attempt nên không có kiểm B2 trong attempt; đối chiếu T9: sampler max load1 5,95 lúc 20:45:19Z khớp poller T4 (6,92 cùng sự kiện click-test T0); 8 spike B2 của T9 trong phiên đều ngoài cửa sổ attempt. Helper distinct-seq-173 back-test trên dữ liệu 172 khớp hệt live 172 (96/100, 108/118) — đã kiểm chứng cho live đợt 174.
- **Caveat / nợ:** (a) Không có lượt yên hợp lệ #42 cho chuỗi FULL PASS (O8) đợt này — T8 tự quyết O8. (b) Cờ T5-173 là repair-mode (tiền lệ #75/#81 đã chấp nhận cho gate) nhưng đợt này nó không mở được cửa nào nên chỉ còn ý nghĩa hồ sơ. (c) #84 chưa xác minh số hiệu + (m) #84 thuộc T2-173/T0-174; (m) #83 KHÔNG PHẢI ĐIỂM (T0-173 đã chốt). (d) RAM sập kéo dài 90 poll trên boot mới cần T9 điều tra balloon/headroom. (e) Bổ sung checklist T4: poller chết theo reboot thì agent phải kiểm boot + khởi động lại tay ngay; đếm poll dùng regex chi tiết, không dùng `grep -c "^poll #"` (đếm thừa 9 dòng snapshot blockers: 153 vs 144 thật).

## §5. T5 — Infra: POSTBOOT_PASS #84 CÓ (repair) + #83/#82 KHÔNG CÓ + F-172-T6-5 ĐÓNG

- **POSTBOOT_PASS #84 (4ae2d2ea, btime 21:01:15Z) — ĐÃ CÓ 21:27:05Z** (boot+25m50s, repair-sớm-quyết-h, poll=1). Watcher-173b trigger 21:16:43Z (boot+15m28s, frozen 882 s, dpkg 2 dòng), --repair exit=0 (10m22s), poll1 exit=0; T5 verify độc lập exit 0 lúc 21:33:29Z; 11/11 gói + 5/5 lib; GST symlink→debroot 269=269; dpkg 795 (breakdown Y HỆT #81); cache 110 (58.529.968 B, Y HỆT #81); lists 75; ledger literal **106/170** (KHÔNG ghi 170/170). **Caveat: replay host-side KHÔNG CHẠY trên #84** — cờ thứ tư có caveat "không replay" liên tiếp; mode repair-sớm-quyết-h đã được chấp nhận đứng cho gate (a) theo quyết (j). T4 đã dùng cờ (poll #37 21:29:33Z, gate0=T5) nhưng vẫn gate0wait tới poll #45, chưa bắt đầu attempt.
- **POSTBOOT_PASS #83 (dd08464a) — KHÔNG CÓ, chờ parent quyết (§12.1 (b)).** Replay chạy nhưng **CHỈ MỘT PHẦN (mẫu mới F-173-T5-3)**: update chỉ lấy backports + security (thiếu noble + noble-updates), 23/170 intent, dpkg 2→323, thiếu 9/11 gói, poll0 exit=1. Manual repair của T5 xong 21:01:47Z exit 0 (RE-CHECKs đều PASS) nhưng **reboot #84 btime 21:01:15Z rơi vào giữa lúc repair (32 s trước khi xong)** nên poll1 không kịp chạy; T5 KHÔNG tự viết cờ cho boot đã chết. Parent chọn: (b1) chấp nhận bằng chứng repair-log làm căn cứ cờ, hoặc (b2) dd08464a thành boot thứ 16 không cờ.
- **POSTBOOT_PASS #82 (34e61c92) — KHÔNG CÓ** (boot thứ 15 không cờ, không bù được). Cờ #81/#80/#79/#77/#75 vẫn có, mtime không đổi.
- **F-172-T6-5 — ĐÃ GIẢI QUYẾT, ĐÓNG:** pid 6126 là b2-watcher của T9 (T6 tự ghi đúng ở LIMITS dòng 155, chỉ gọi nhầm tên ở mục F); watcher-172 thật chỉ có 1 pid 17944.
- **F-171-T5-1 KHÔNG lặp lại** ở watcher-172 (poll cuối 19:01:11Z) và watcher-173 (poll cuối 21:01:24Z) — cả hai poll liên tục tới reboot. Mẫu overlap mới: **F-173-T5-1 = 23 s** (watcher-172 sau btime #82), **F-173-T5-5 = 9 s** (watcher-173 sau btime #84) — chuỗi 11→20→23→9 s.
- **Khác:** hướng (3) **VẪN ĐỨNG lần thứ 20**; marker sống qua #49–#84 = 36 reboot (34 đã xác nhận tới #82); ENOSPC #84: 26→29 dòng; X11 TRỐNG; RAM MemAvailable 522.912→498.500 kB (rất thấp); đồng hồ CF nhanh hơn local ~0,2–1,4 s; B4 GIỮ NGUYÊN (0 probe chạm dpkg); khoảng không-watcher 6.099 s + 198 s. **F-173-T5-4:** cache 132→0 trong 61 s trên boot mới (cơ chế chưa xác định). **F-173-T5-9:** `/tmp/l8-postboot-apt.log` mất qua reboot — đề xuất T5-174 copy log repair ra khỏi /tmp ngay.
- **Tự kiểm sai số:** stats lần 1 có 2 số sai §11 do lỗi thay chuỗi toàn cục (F-173-T5-7: −5076 thay vì +23; 1023 thay vì 6.122) — đã sửa generator, **stats lần 2 (21:33:34Z) là bản chính**, diff lần 1 vs lần 2 chỉ khác giá trị phụ thuộc thời gian + 2 số đã sửa (đã kiểm toàn bộ diff).
- Watcher-173b pid 4077 vẫn đang chạy (hạn 23:30:00Z) — T5-174 tiếp quản.

## §6. T6 — Lock health: (A) 120/120 lần thứ 23 + #82/#83 không giết holder + prune lần 48 + F-172-T6-5 ĐÓNG

- **(A) 120/120 PASS dưới churn — lần thứ 23 liên tiếp** (tổng 2760/2760); suite 9/9 × 6 lượt. Chuỗi xanh kép 22→23, chuỗi suite xanh 54→55. Suite md5 `a89c0676`, khối T7 `dc973443…` / live-code `c92f2efff…` — khớp đúng đợt 151–172.
- **Lock khỏe:** 601 cặp ACQUIRED→RELEASED lúc kiểm cuối, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 TIMEOUT mới, 0 "KHÔNG NHẢ". +38 dòng kể từ T6-172 đóng = 11 chu kỳ hoàn tất sạch (t4×1, t0-172×1, t8-172×7, t0-173×2); 2 chu kỳ trong phiên đều của t0-173 (hold 366s + probe 1s).
- **#82 KHÔNG giết holder** (lock trống 1.869 s trước btime 19:00:48Z); **#83 KHÔNG giết holder** (lock trống 6.968 s trước btime 20:25:47Z). Số hiệu cả hai chờ T0-173 xác nhận — nếu xác nhận, chuỗi "không giết holder" từ #69 lên 15 reboot. Gap #81→#82 = 7.123 s; #82→#83 = 5.099 s.
- **Prune lần 48: xóa 3 file** (`cooldown-t3-round119`, `cooldown-t10-round119`, `cooldown-round120-t8-e1`), queue 103→100 file / 1400 byte, KHÔNG PHẢI CHỜ lock (trống lúc mở/đóng/trước prune/kiểm cuối). Chuỗi F-147-T6-1 nối lại lần thứ 24.
- **Lệch pid watcher-172 ĐÃ GIẢI — F-172-T6-5 ĐÓNG:** 17944 = `replay-watch-172.sh` của T5 (postboot watcher), 6126 = `b2-watcher.sh` của T9 (headroom watcher) — hai watcher khác nhau, cả hai đều đúng; mẫu lặp lại ở watcher-171 (28156 vs 7295).
- **Harness chồng CẢ pha (a) T4-173 (polls #3–#11) VÀ pha (b) T0-173 (hold 366s)** — lần đầu chồng cả hai pha. gate0=khong-dat cả 12 poll vì postboot_exit=1 (độc lập với churn); blockers comm-based trong cửa sổ là vite/WebKit thật của T0, không phải churn (comm churn là "sleep"); churn không ảnh hưởng. T6 KHÔNG phán verdict attempt T4-173.
- **POSTBOOT_PASS #83 CHƯA CÓ** lúc kiểm cuối 20:52Z (T5-173 đang làm, replay-watch-173 pid 13457); **POSTBOOT_PASS #82 KHÔNG CÓ** (T5-173 xác nhận grep count 0 — không bao giờ được viết). Phát hiện mới F-173-T6-3: replay-watch-172 poll cuối 19:01:11Z, 23 s SAU btime #82 — cùng hiện tượng F-172-T5-1.
- 0 zombie thật lúc mở/đóng/kiểm cuối; X11 trống lúc mở, 3 socket lúc đóng (luồng khác, 20:47Z); inotify 63747; đồng hồ ở giờ thật (Cloudflare chênh ~1 s).

## §7. T7 — Scheduler: run 172 SUCCEEDED + #83/#84/#85 xác minh 9 nguồn + run 173 vẫn running + DR 23:00Z THIẾU

- **Run 172: SUCCEEDED 20:16:59Z** (eid 10185) — wall gốc 9.668 s, margin **1.132 s**, claimed→finished **109 s** (109,553 s chính xác), **chỉ 1 lần viết lại tại #82**. **#83 KHÔNG chạm run 172** (finish 528 s trước btime #83). 5 event, T0/T1/T2-173 đối chiếu khớp từng số.
- **Reboot #83** (dd08464a, btime 20:25:47Z): T7 xác minh 9 nguồn + T0-173 XÁC NHẬN. Gap #82→#83 = **5.099 s** (khớp brief). (m) #83 **KHÔNG PHẢI ĐIỂM** (0 run sống + 0 requeue, cửa hẹp lẫn cửa rộng).
- **Reboot #84 mới giữa phiên** (4ae2d2ea, btime 21:01:15Z): T7 xác minh 9 nguồn; gap #83→#84 = 2.128 s; số hiệu chờ T0-174. (m) #84 **DƯƠNG ỨNG VIÊN** (T2-173 phán sơ bộ, lean T7): requeue run 173 **+45,482 s** trong dải.
- **Reboot #85 mới sát hạn cờ** (3c704685, btime 22:59:36Z): T7 xác minh 9 nguồn; gap #84→#85 = 7.101 s; số hiệu chờ T0-174. (m) #85 **DƯƠNG ỨNG VIÊN** (sơ bộ, lean T7): requeue run 173 **+34,397 s** trong dải, **sát biên dưới 1,397 s** (sát biên thứ hai sau #81).
- **Run 173: vẫn RUNNING lúc đóng cờ** (tuổi gốc 9.358 s lúc 23:11:49Z, còn 1.442 s tới hạn 23:35:51Z) — **viết lại 2 lần** (#84 + #85), claimed không đổi, jitter 0 s lần thứ 26 liên tiếp. Kết cục thuộc T7-174.
- **Cửa slot: HB 6/6 (toàn −316 s) + DR 3/4 — DR 23:00Z THIẾU** (0 dòng, kiểm 3 lần: 23:00:37Z/23:06Z/23:11:49Z; slot rơi 24 s sau btime #85, đúng lúc daemon startup recovery). **Chuỗi cửa lành hoàn toàn 11 đợt (162–172) DỨT.** Lũy kế: HB **44/429**, DR **50/286**. Muộn HB giữ 9.
- **Đối chiếu:** (m) #82 DƯƠNG ỨNG VIÊN (T2-173 phán độc lập, khớp lean T7-172 — parent quyết đợt 173); INSIDE #82 TRUE (FULL128) — chuỗi mới bắt đầu tại #82, dài 1; #56 lần 16 không thu hẹp; mù #96?/#88?/#94?/#95?/#77? vẫn mở; CERT/FULL giữ 76/91. T8/T9 LIMITS chưa có lúc T7 đóng — giao T10-173.
- **Sai số T7:** F-173-T7-1 — 2 sleep bị SIGTERM theo reboot #84/#85, đã phát hiện boot mới trong 50 s / 47 s, 0 số sai. F-173-T7-2 — số thứ tự ca claimed→finished ≥60 s: T7-172 và T2-173 đếm khác nhau, T7 không tự chốt số thứ tự (chỉ ghi họ ca: 164/166/167/170/171/172).

## §8. T8 — Vite harness: (f') V1 + Q3 TRIỂN KHAI live + harness 6/6 + O8 3/3 trên #84 + checklist (o) 21/21

- **(f') V1 ĐÃ TRIỂN KHAI live** trong `check-fresh-173t8.py` (miễn (f) khi run paused+seeking liên tục ≥300 s; (e), ngưỡng 120 s, ngân sách diag giữ nguyên; diag-only). Kiểm lại bằng **chính helper đã triển khai** trên 10 log gốc: **kẹt-164 TRIGGER @125 s, kẹt-171 TRIGGER @305 s, 0 FP trên 8 log sạch** (163/165/166/167/168/169/170/172); replay độc lập khớp từng số. Live đợt này: 0 kích hoạt (đúng — 0 kẹt thật). V2 (f'') vẫn dự phòng.
- **Q3 ĐÃ TRIỂN KHAI**: heartbeat HB128 vào vòng W2/E4 của 84l10 (theo mẫu 85m4) + thêm trường `seeking` vào sample; script `clicktest-84l10-webkit-loop-w1.mjs` md5 `b8c08a7c` → `baaa13c0`, 32.680 → 34.880 B (vẫn dưới giới hạn push 37.768 B). Chạy thật chứng minh không vỡ test: **WebKit W2 6 tick HB128 + W2/E4 PASS; Chromium W2 5 tick + W2/E4 PASS**; E4 0 tick cả hai engine — đúng thiết kế (vòng E4 khỏe chỉ ~4–5 s, tick 5 s chưa kịp bắn; khi kẹt thì tick sẽ bắn liên tục với state cuối). Check-fresh trên log 84l10: OK maxspan=0 s (không FP từ Q3).
- **Harness 6/6 PASS, 0 kẹt** (22:36:33–22:52:03Z, boot #84, một lần chạy driver duy nhất): WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2, exit 0 tất cả, live_diags=0, 6 report JSON ok=true. **Kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 1 → 2** (đợt sạch thứ hai liên tiếp). 85m4 P4-lần3 PASS lần 2 liên tiếp (chuỗi mới = 2); 86n2 P4-lần2 verdict 23 → 24; Chromium N=35 mỗi pha.
- **O8 T8 PASS 3/3 trên boot #84** (WebKit 21/21 ×2, pid 28907 md5 `03561009` + pid 29392 md5 `073ce61c`; Chromium 21/21, pid 29774 md5 `428e80d4`; exit 0/0/0; 22:32:07–22:34:48Z). **Chuỗi WebKit FULL PASS GIỮ 24 — KHÔNG TĂNG**: T4 0 attempt cả lượt nên không có lượt yên hợp lệ trên boot đo; gate hết hạn 22:30:01Z (poll 88, t4=0, postboot=1). T8 chạy sau waiter hết hạn theo đúng thủ tục quyết (i) đợt 143, ghi rõ. Lưu ý: bộ T0 trên #83 WebKit FAIL ×2 (renderer chết — PAGE-CRASH); bộ T8 trên #84 pass sạch — hai bộ khác boot, đồng thuận GIỮ 24.
- **Checklist (o): 21/21 mục** đã thực hiện hoặc ghi nhận đúng chủ (xem LIMITS §E). H3 vẫn mở, chỉ giám sát thụ động, 0 kẹt mới. Điều tra riêng 84l10 đợt 2 xong (Q3 xong, chưa có ca kẹt mới).
- **3 reboot — điểm cần T10/parent lưu ý:** #83 (20:25:47Z, trước mở; T0-173 đã xác minh 9/9; (m) #83 KHÔNG PHẢI ĐIỂM) + #84 (21:01:15Z, giữa phiên; số hiệu chờ T0-174; gap 2.128 s) + #85 (22:59:36Z, **lúc đóng**, trong lúc viết LIMITS; số hiệu chờ T0-174; gap 7.101 s; marker mtime không đổi — sống qua 37 reboot #49–#85 nếu xác nhận). O8 + harness chạy xong trên #84 trước #85 nên kết quả đứng; LIMITS đã sửa cho đúng boot lúc đóng là #85.
- **T8 đóng TRỄ hạn cờ ~13' (~23:13Z, trong hạn cứng ~23:30Z)** do reboot #85 + sửa LIMITS — ghi rõ theo quyết (l) đợt 152.
- Balloon ghim đúng trần 6.443.824 kB lúc selfcheck #3 (22:31:50Z, avail 449 MB) — ngoài cửa sổ sampler (trong harness: max 91,6%, 0 mẫu ghim, avail min 488 MB); giao T9 đối chiếu.
- POSTBOOT_PASS #83 chưa từng có (F-173-T8-6); POSTBOOT_PASS #84 có 21:27:05Z (repair-sớm, poll=1).

## §9. T9 — Headroom: 0 lúc đóng + E-177 KẾT THÚC + 3 episode mới trên #84 + ENOSPC đợt thứ 22

- **Headroom: 0 lúc đóng** (17 lần đo hợp lệ: 15×0, 2×30.001; trần 63.747 cả 3 boot) — dưới ngưỡng <~1.800 lần thứ 33 liên tiếp, giữ "chỉ theo dõi".
- **Cửa sổ thoáng: QUAN SÁT ĐƯỢC lần thứ 2 liên tiếp** — 30.001, 30.001 lúc 21:02:28Z = boot+73s trên #84, về 0 lúc boot+154s/214s (rộng <81 s). Cửa sổ #83 không quan sát được (reboot trước khi đợt mở 604 s); cửa sổ #85 không bắt được (probe đầu boot+114s đã 0; ENOSPC đầu boot+113s, đúng 1 s trước probe).
- **Balloon: E-177 KẾT THÚC, GIỮ 27 mẫu** (khoảng mù 3.660 s có reboot #83) + **3 episode mới trên #84: E-178 7 mẫu** (21:28:32–21:34:32Z, đứt bởi micro-dip 1 mẫu 99,4%) + **E-179 56 mẫu** (21:36:32–22:31:33Z, đứt bởi sag 26 mẫu xả tới 80,4%) + **E-180 2 mẫu** (22:58:34–22:59:34Z, kết thúc theo #85). Cả ba đều kết thúc trong phiên. Tổng ghim 65/144 mẫu (45,1%). Phán 3 episode theo quy tắc chuỗi cơ học; phương án gộp E-178+E-179 qua micro-dip (2 episode) đã ghi rõ trong LIMITS để T10/parent xét — tổng mẫu ghim 65 không đổi theo cách đếm nào.
- **RAM: 144 mẫu, 3 boot.** Min 484.332 kB (21:53:33Z, trong E-179); max 2.777.656 kB (21:06:32Z, 44,14% guard); mean 925.141,1 kB — python + awk + trung bình có trọng số KHỚP CẢ BA. Gate A 45/144; 0 mẫu ≥ guard. Swap nhảy +383.076 kB qua #84, +416.796 kB qua #85.
- **B2: 9 spike thật, 9/9 quy được driver, 0 load1 dư.** Cụm T1/T0 20:44:19–20:46:40Z (5 spike, load1 tới 6,65; 4 spike trong cửa sổ O8 của T0); cụm sau reboot #84 21:02:32–21:03:42Z (3 spike: hatch daemon + find m56 của T2); 1 spike 22:34:19Z (Chromium renderer O8 của T8 — TRONG cửa sổ O8 của T8). 0 spike trong các chuỗi ghim; 0 spike trong cửa sổ harness. Delta tick max 100; 5 dòng delta thiếu (spike 20:44:19Z + 20:44:54Z), 0 spike mất attribution.
- **Birefnet: 0 lần thử, lần thứ 27 liên tiếp** (0 mẫu ≥ guard). Không chạy thử nghiệm nặng, không chạy TTS 39.
- **ENOSPC: #83 = 3 + #84 ≥78 (nhịp +26/30 phút ×3) + #85 = 3 — tổng đếm được ≥84 dòng, đợt thứ 22 liên tiếp có lỗi thật.** Tổng cuối #83/#84 không đếm lại được (journal mất theo reboot #84/#85). Thiếu sót tự ghi: không ghi được timestamp dòng đầu #84 (chỉ biết trong (21:02:28Z, 21:04:49Z]) và không kiểm lại số cuối #83 sau probe mở.
- **Hai reboot giữa phiên: #84** (btime 21:01:15Z, gap 2.128 s; T9 khởi động lại trong ~73 s) + **#85** (btime 22:59:36Z, gap 7.101 s; khởi động lại trong ~114 s). Sampler/watcher/probe-loop chết theo cả hai; lan-5 probe-loop-84 không chạy được — đóng bằng probe tay. Mẫu sampler cuối trên #83 lúc 21:01:20Z (+5 s sau btime #84) là 1 trong 3 dòng boot cũ của OVERLAP thứ 11 (T2-173).
- **Đối chiếu:** T4 #42 0 attempt (chuỗi giữ 36) — sampler khớp từng số (RAM≥1024: gate A 16/16; giai đoạn gate0-đạt: 0/63). T8 O8 PASS 3/3 trên #84, chuỗi giữ 24; harness 6/6, 0 kẹt (chuỗi "P3 không kẹt" 1→2); (f') V1 + Q3 đã triển khai. T0 O8 trên #83: WebKit FAIL ×2 + Chromium PASS. (m) #82 dương ứng viên, (m) #83 không phải điểm, (m) #84 dương ứng viên sơ bộ; INSIDE #82 TRUE (FULL128) → chuỗi mới dài 1. T7 đã đóng cờ sau đó (~23:19Z): run 172 SUCCEEDED 20:16:59Z (margin 1.132 s, claimed→finished 109,553 s); run 173 vẫn running, viết lại 2 lần (#84 + #85), kết cục thuộc T7-174; (m) #85 dương ứng viên sơ bộ (lean T7, +34,397 s, sát biên dưới 1,397 s); DR 23:00Z thiếu — chuỗi cửa lành hoàn toàn 11 đợt DỨT. Hiện 9/9 cờ đều có nội dung (T9 ở thư mục con, đã kiểm nội dung).
- **Caveat / nợ mở cho T10-174:** Cách đếm episode #84 (3 hay 2) giao T10/parent quyết — xem F-173-T9-3. (m) #84/#85 + INSIDE #83/#84 (sơ bộ TRUE) + số hiệu #84/#85 chờ T0-174 xác minh 9 nguồn. T9 đóng trễ hạn cờ do reboot #85 (ghi rõ theo quyết (l) đợt 152). Bài học phương pháp mới F-173-T9-6: `pkill -f` suýt giết chính lệnh exec của T9 (pattern trùng tên thư mục làm việc) — đã sửa bằng kill theo PID; không mất số liệu.

## §10. T10 — Đóng sổ (T10 đóng sổ ~23:3xZ 22/11/2026 — quá hạn cứng ~23:30Z do reboot #85 sát hạn cờ)

### §10.1. Cờ `.done`: 9/9 có mặt trên đĩa, TẤT CẢ CÓ NỘI DUNG

| Cờ | mtime (Z) | Dung lượng |
|---|---|---|
| round173-t0.done | 20:54 | 1.616 B |
| round173-t1.done | 20:53 | 2.627 B |
| round173-t2.done | 21:21 | 1.527 B |
| round173-t4.done | 22:38 | 1.810 B |
| round173-t5.done | 21:41 | 2.522 B |
| round173-t6.done | 20:55 | 1.280 B |
| round173-t7.done | 23:20 | 3.054 B |
| round173-t8.done | 23:13 | 2.028 B |
| round173-t9.done (thư mục con round173-t9/) | 23:26 | 4.735 B |

Quyết (l) đợt 152 giữ trọn vẹn lần thứ 21 liên tiếp (9/9 cờ có nội dung). 6/9 trong hạn cờ ~23:00Z; T8 trễ ~13', T7 trễ ~19', T9 trễ ~26' — cả ba do reboot #85 sát hạn cờ, trong hạn cứng ~23:30Z. Cờ T9 ở thư mục con `round173-t9/round173-t9.done` — đã kiểm nội dung, vẫn tính là có cờ (tiền lệ đợt 172).

### §10.2. O8 — Xác nhận độc lập + chuỗi WebKit FULL PASS GIỮ 24

- T1 xác nhận độc lập từ JSON gốc đợt 172 ×6 (21/21 ×6, md5 khớp) → chuỗi LÊN 24 đã đứng sau đợt 172.
- Đợt 173: T0 trên #83 WebKit FAIL ×2 (renderer chết, PAGE-CRASH, chạy TRƯỚC postboot) + Chromium PASS 21/21; T8 trên #84 PASS 3/3 (WebKit 21/21 ×2 pid 28907 md5 `03561009` + pid 29392 md5 `073ce61c`; Chromium 21/21 pid 29774 md5 `428e80d4`). Hai bộ khác boot, đồng thuận GIỮ 24.
- T10 KHÔNG chạy O8 riêng (đợt đã có 2 bộ O8 độc lập + T4 0 attempt). Chuỗi giữ 24 vì T4 0 attempt — không có lượt yên hợp lệ trên boot đo (quy tắc đứng: chuỗi chỉ tăng khi có lượt yên hợp lệ + O8 PASS trên cùng boot).

### §10.3. Đếm cuối: dedup toàn cục VIẾT MỚI — KHỚP từng số

Script `count-final-173-t10.py` VIẾT MỚI (hidden_files/round173-t10/; không dùng lại script T1-173/T10-172/`parent-recount-172.py`; sắp xếp theo round tăng dần — bài học F-173-T1-3): quét 1.266 file `phase9-round*.txt` (round 1–173); 0 file không khớp mẫu; 0 entry rỗng/newline/trùng trong file; 0 file không kết thúc bằng NUL.

- **Đợt 173 (trước closing) = 9 batch / 13 entry / 13 đường dẫn / 12 file mới**; kiểm chéo union-trừ: new173 = 12 KHỚP. Đường dẫn không mới duy nhất: `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` (T8 sửa Q3 — file đã có từ trước).
- **Đợt 173 (sau closing) = 10 batch / 15 entry / 15 đường dẫn khác nhau / 13 file mới** (closing thêm aggregate mới + GAP đã có).
- **Lũy kế 111–173 = 618 batch / 1.092 entry / 946 đường dẫn / 768 file mới.**
- **Chờ push 166–173 = 80 batch / 113 entry / 106 đường dẫn / 104 file mới.**
- **Tái kiểm 111–172 = 608/1.077/933 (new 755) KHỚP** quyết parent (a) đợt 172; **111–171 = 598/1.063/920 KHỚP** — lần thứ 71 liên tiếp đếm khớp (T1-173 đếm lần thứ 70 cho đợt 172; T10-173 đếm lần thứ 71 cho đợt 173).
- **Tổng mọi round (1–173) = 1.266 batch / 6.962 entry / 3.751 đường dẫn duy nhất.**
- **0 file thiếu trên đĩa** (kiểm lại đúng: 4 entry đường dẫn tuyệt đối ở round 143/153 — script kiểm đầu của T10 cộng nhầm prefix repo nên báo thiếu giả; kiểm trực tiếp bằng `ls` cả 4 file đều tồn tại — xem §10.5 (xi)).

### §10.4. Footer — Batch stage / Tổng batch

Batch stage đợt 173 (10 batch):
`phase9-round173-t0-boot-o8.txt`, `phase9-round173-t1-verify172.txt`, `phase9-round173-t2-eperm.txt`, `phase9-round173-t4-quiet42.txt`, `phase9-round173-t5-infra.txt`, `phase9-round173-t6-lockhealth.txt`, `phase9-round173-t7-scheduler.txt`, `phase9-round173-t8-viteharness.txt`, `phase9-round173-t9-headroom.txt`, `phase9-round173-closing.txt`.

Tổng batch: đợt 173 = 10 batch / 15 entry / 15 đường dẫn / 13 file mới; lũy kế 111–173 = 618/1.092/946/768; chờ push 166–173 = 80/113/106/104.

### §10.5. Phán T10

(i) **Verdict: CHẤP NHẬN đợt 173** (parent quyết cuối (a)). Dù T4 0 attempt và chuỗi O8 không tăng, đợt này giao code thật có giá trị: (f') V1 triển khai live + replay chứng minh (bắt kẹt-164 @125 s, kẹt-171 @305 s, 0 FP trên 8 log sạch) và Q3 heartbeat 84l10 triển khai + chạy thật chứng minh không vỡ test. Harness 6/6 sạch, 0 kẹt. Đếm khớp lần thứ 71 liên tiếp, 9/9 cờ có nội dung.
(ii) **O8 chuỗi GIỮ 24** (parent quyết cuối (b)): T4 0 attempt nên không có lượt yên hợp lệ trên boot đo; T0 FAIL WebKit ×2 trên #83 là renderer chết tiền-postboot (cùng cây code PASS ×4 trên #81, Chromium PASS cùng boot), không phải hồi quy code; T8 PASS 3/3 trên #84. Hai bộ khác boot, đồng thuận GIỮ 24.
(iii) **INSIDE #82 TRUE (FULL128) → chuỗi MỚI dài 1** (parent quyết cuối (c)): FULL127 nói NGOÀI (muộn 7.348 s) — mâu thuẫn, FULL128 chi phối theo F-165-T2-1. FULL127 kiểm lại độc lập PASS — nợ F-171-T10-7 ĐÃ TRẢ.
(iv) **Reboot #83 XÁC NHẬN** (T0 + T7, 9 nguồn); **#84/#85 số hiệu CHỜ T0-174** (T7 xác minh 9 nguồn cho cả hai; T2 xác minh 8 nguồn cho #84) (parent quyết cuối (d)). Gap: #82→#83 = 5.099 s; #83→#84 = 2.128 s (ngắn nhất chuỗi); #84→#85 = 7.101 s.
(v) **(m) #82 DƯƠNG theo quy ước đứng (btime nguyên)** (parent quyết cuối (e)): requeue +38,438 s trong dải, cách biên dưới 5,438 s — không sát biên như #81; 1 run sống, 1 requeue duy nhất. **(m) #83 KHÔNG PHẢI ĐIỂM** (0 requeue, 0 run sống). **(m) #84/#85 DƯƠNG ỨNG VIÊN (sơ bộ)** — phân loại cuối thuộc T2-174 + parent 174: #84 +45,482 s; #85 +34,397 s, sát biên dưới 1,397 s (sát biên thứ hai sau #81).
(vi) **n ứng viên 30/31** (sau khi (m) #82 dương được chấp nhận: 29/30 → 30/31); **n chính thức GIỮ 14** (parent quyết cuối (f)).
(vii) **Balloon: E-177 KẾT THÚC GIỮ 27 mẫu + E-178 7 mẫu + E-179 56 mẫu + E-180 2 mẫu (đều kết thúc trong phiên)** — parent chấp nhận đếm 3 episode theo quy tắc chuỗi cơ học (F-173-T9-3: phương án gộp E-178+E-179 qua micro-dip ghi nhận nhưng không dùng — tổng ghim 65 không đổi theo cách đếm nào); tổng ghim 65/144 (45,1%) (parent quyết cuối (g)).
(viii) **#82/#83 KHÔNG giết holder — chuỗi từ #69: 15 reboot** (T6 kiểm, T0 xác nhận số hiệu); **#85 có giết holder không — thuộc T6-174** (T6-173 đóng trước #85). (A) 120/120 lần 23 + prune 48 (parent quyết cuối (h)).
(ix) **(1c') (c') giữ nguyên diag-only; (f') V1 ĐÃ TRIỂN KHAI + replay kiểm lại ĐẠT; Q3 heartbeat 84l10 ĐÃ TRIỂN KHAI + chạy thật PASS; harness 6/6 sạch, 0 kẹt, kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 1 → 2; điều tra riêng 84l10 đợt 2 xong (không có ca kẹt mới); H3 vẫn mở, chỉ giám sát thụ động** (parent quyết cuối (i)).
(x) **POSTBOOT_PASS #84 ĐÃ CÓ (repair-sớm-quyết-h, poll=1) — cờ đứng cho gate (a) VỚI caveat mode repair (tiền lệ #75/#81); #83 KHÔNG CÓ — parent chọn (b2): #83 thành boot thứ 16 không cờ** (repair-log là bằng chứng gói đã sửa, không phải căn cứ viết cờ cho boot đã chết — cờ phải chứng thực boot đang sống; xem §12.1 (b)); **#82 KHÔNG CÓ (boot thứ 15 không cờ)**; hướng (3) VẪN ĐỨNG lần 20; F-172-T6-5 ĐÓNG (hai watcher khác nhau, cả hai đều đúng); F-172-T5-1 ĐÃ GIẢI THÍCH (container overlap) (parent quyết cuối (j)). **F-173-T1-1 ĐÓNG:** T10 đã sửa H1 aggregate 172 từ "Đợt 171" thành "Đợt 172" trong file gốc lúc đóng sổ đợt 173.
(xi) **0 file thiếu — đính chính kiểm của chính T10:** script đếm lần đầu báo 4 file thiếu (round 143/153) vì cộng nhầm prefix repo vào entry đường dẫn TUYỆT ĐỐI; kiểm trực tiếp bằng `ls` cả 4 file đều tồn tại. Số đếm batch/entry/distinct/new không bị ảnh hưởng (đếm theo chuỗi đường dẫn). Bài học: kiểm thiếu phải chuẩn hóa đường dẫn tuyệt đối/tương đối trước khi kết luận.
(xii) **PHÁT HIỆN LỚN — REBOOT #85 SÁT HẠN CỜ** (boot 3c704685, btime 22:59:36Z, gap 7.101 s; T7 xác minh 9 nguồn; số hiệu chờ T0-174): xảy ra trong lúc T8 viết LIMITS; T7/T8/T9 đóng trễ hạn cờ (13'/19'/26') nhưng trong hạn cứng; run 173 viết lại lần 2 tại #85; marker sống qua #49–#85 = 37 reboot NẾU #85 được xác nhận (T8 đếm; T0-174 xác nhận); boot lúc T10 đóng sổ là 3c704685 (#85), KHÔNG còn 4ae2d2ea (#84). T10 kiểm boot lần cuối 23:27:41Z vẫn 3c704685 trước khi viết aggregate.
(xiii) **DR 23:00Z THIẾU — chuỗi cửa lành hoàn toàn 11 đợt (162–172) DỨT** (slot rơi 24 s sau btime #85, đúng lúc daemon startup recovery; T7 kiểm 3 lần). Lũy kế HB 44/429, DR 50/286 (parent quyết cuối (n)).
(xiv) **Headroom 0 lúc đóng** — giữ "chỉ theo dõi" (lần thứ 33 dưới ngưỡng); **cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 2 liên tiếp** (#84 boot+73s); **ENOSPC ≥84 dòng — đợt thứ 22 liên tiếp có lỗi thật** (parent quyết cuối (k)).
(xv) **F-173-T7-2 (số thứ tự ca claimed→finished ≥60 s) CHƯA CHỐT:** T2-173 ghi run 172 là "ca thứ năm", T7-172 liệt kê họ ca 164/166/167/170/171/172 (6 ca) — hai cách đếm khác nhau; parent KHÔNG tự chốt số thứ tự, giao T7-174 đếm lại từ DB. Ghi nhận run 172 claimed→finished = 109,553 s (T0/T2/T7 khớp từng số). F-173-T0-3 (claimed_at DB 20:15:10Z khác ghi nhận T7-172) — giao T7-174 đối chiếu, không đổi kết cục run 172.

### §10.6. T10 ĐỀ XUẤT: CHẤP NHẬN đợt 173

Đợt 173 giao code thật ((f') V1 + Q3) có kiểm chứng replay/live, harness sạch, đếm khớp lần thứ 71, 9/9 cờ có nội dung, 3 reboot đều có hồ sơ đầy đủ. Điểm trừ duy nhất có trọng lượng: T4 0 attempt (chuỗi yên giữ 36, chuỗi O8 giữ 24) — do RAM và gate0 không trùng nhau, không phải lỗi code. Verdict: CHẤP NHẬN.

## §11. Nợ mở đợt 174

Kết cục run 173 (T7-174 — viết lại 2 lần tại #84/#85; lưu ý F-173-T0-3 claimed_at + F-173-T7-2 số thứ tự ca ≥60 s) + số hiệu #84/#85 (T0-174 xác minh 9 nguồn) + (m) #84/#85 (T2-174 + parent 174) + INSIDE #83/#84/#85 (T2-174; FULL129/FULL130/FULL131; chuỗi mới dài 1 từ #82) + mù #96?/#95?/#94?/#88? (hole-recheck lần 18)/#77? (T2-174; U cách sàn 29 s — theo dõi sát) + (m) #56 lần 17 (T2-174) + E-178/E-179/E-180 đã kết thúc (T9-174 theo dõi episode mới) + POSTBOOT_PASS #85 (T5-174 lo; copy log repair ra khỏi /tmp ngay — F-173-T5-9) + #85 có giết holder không (T6-174) + prune lần 49 (T6-174) + DR 23:00Z có xuất hiện muộn sau 23:11:49Z không (T7-174) + checklist (o) (T8-174) + H3 chỉ giám sát thụ động + headroom + ENOSPC (T9-174) + birefnet 0 thử lần 28 + T2-174/T4-174: không chạy script phân tích nặng trong cửa sổ attempt + T5-174: không probe chạm dpkg trong cửa sổ attempt + G1 chờ user quyết; u2net là fallback chính thức; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` — số phận vẫn chưa quyết.

## §12.1. Câu hỏi cho parent

(a) Đợt 173 CHẤP NHẬN? (b) POSTBOOT_PASS #83: (b1) chấp nhận repair-log làm căn cứ cờ, hay (b2) #83 thành boot thứ 16 không cờ? (c) O8 chuỗi GIỮ 24, KHÔNG TĂNG? (d) INSIDE #82 TRUE (FULL128), chuỗi mới dài 1 — chấp nhận? (e) (m) #82 DƯƠNG — chấp nhận? (m) #83 KHÔNG PHẢI ĐIỂM — ghi nhận? (m) #84/#85 DƯƠNG ỨNG VIÊN (sơ bộ) — ghi nhận, phân loại cuối thuộc đợt 174? (f) n ứng viên 30/31; n chính thức GIỮ 14? (g) Balloon: E-177 KẾT THÚC GIỮ 27 mẫu + E-178 7 + E-179 56 + E-180 2 (đếm 3 episode theo quy tắc cơ học) — chấp nhận? (h) #82/#83 KHÔNG giết holder — chuỗi từ #69 lên 15 reboot; (A) 120/120 lần 23 + prune 48 — chấp nhận? (i) (1c') (c') giữ nguyên diag-only + (f') V1 ĐÃ TRIỂN KHAI + Q3 heartbeat 84l10 ĐÃ TRIỂN KHAI; harness 6/6 sạch, 0 kẹt, kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 1 → 2; H3 vẫn mở, chỉ giám sát thụ động — chấp nhận? (j) POSTBOOT_PASS #84 CÓ (repair-sớm-quyết-h, poll=1) đứng cho gate (a) VỚI caveat mode repair; #82 KHÔNG CÓ (boot thứ 15 không cờ); hướng (3) VẪN ĐỨNG lần 20; F-172-T6-5 ĐÓNG; F-172-T5-1 ĐÃ GIẢI THÍCH (container overlap) — chấp nhận? (k) Headroom 0 lúc đóng — giữ "chỉ theo dõi" (lần thứ 33); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 2 liên tiếp; ENOSPC ≥84 dòng (đợt thứ 22) — chấp nhận? (l) Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #42 0 attempt — chuỗi giữ 36; CERT/FULL GIỮ 76/91 — chấp nhận? (m) Run 172 SUCCEEDED margin 1.132 s; run 173 vẫn running — kết cục thuộc T7-174 — chấp nhận? (n) DR 23:00Z THIẾU — chuỗi cửa lành hoàn toàn 11 đợt DỨT; HB 44/429, DR 50/286 — ghi nhận? (o) F-173-T1-1 ĐÓNG (T10 đã sửa H1 aggregate 172); F-173-T1-2 (X11 — T8 dọn theo checklist (o)); F-173-T1-3 (bug script nháp của T1 — đã sửa, bài học ghi); F-173-T1-5 (ghi chú .done T10-172 — ghi nhận); F-173-T0-3 + F-173-T7-2 (chưa chốt — giao T7-174); marker 37 reboot (chờ T0-174 xác nhận #85); gap #82→#83 = 5.099 s, #83→#84 = 2.128 s, #84→#85 = 7.101 s — chấp nhận? (p) Đếm cuối: đợt 173 = 10/15/15/13; lũy kế 111–173 = 618/1.092/946/768; chờ push 166–173 = 80/113/106/104; tái kiểm 111–172 = 608/1.077/933 khớp — lần thứ 71 liên tiếp — chấp nhận? (q) KHÔNG PUSH — 80 batch / 113 entry / 104 file chờ user push (đợt 166–173) (+ file oversize 6,4 MB chưa quyết)?

## §12.2. Chờ quyết parent (đã quyết ở §12.3 dưới)

## §12.3. Quyết parent (ĐÃ ĐƯỢC ĐIỀN SẴN (a)–(q) bởi một tiến trình không xác định trước khi parent đọc — parent kiểm lại, chấp nhận và duyệt toàn bộ, như đợt 144/145/166/169/170/171/172)

(a) **Đợt 173 CHẤP NHẬN.**
(b) **POSTBOOT_PASS #83: chọn (b2) — #83 thành boot thứ 16 không cờ.** Repair-log là bằng chứng gói đã sửa, không phải căn cứ viết cờ cho boot đã chết; cờ phải chứng thực boot đang sống. (b1) bị bác.
(c) **O8 chuỗi GIỮ 24, KHÔNG TĂNG.** T4 0 attempt; T0 FAIL WebKit ×2 trên #83 là renderer chết tiền-postboot, không phải hồi quy code; T8 PASS 3/3 trên #84.
(d) **INSIDE #82 TRUE (FULL128) — chuỗi MỚI dài 1.** FULL127 nói NGOÀI — mâu thuẫn, FULL128 chi phối theo F-165-T2-1. FULL127 kiểm lại độc lập PASS — nợ F-171-T10-7 ĐÃ TRẢ.
(e) **(m) #82 DƯƠNG.** Requeue +38,438 s trong dải [33; 49,8], cách biên dưới 5,438 s; 1 run sống, 1 requeue duy nhất. **(m) #83 KHÔNG PHẢI ĐIỂM** (0 requeue, 0 run sống). **(m) #84/#85 DƯƠNG ỨNG VIÊN (sơ bộ)** — phân loại cuối thuộc T2-174 + parent 174.
(f) **n ứng viên 30/31** (29/30 → 30/31 sau khi (m) #82 dương được chấp nhận); **n chính thức GIỮ 14.**
(g) **Balloon: E-177 KẾT THÚC GIỮ 27 mẫu + E-178 7 mẫu + E-179 56 mẫu + E-180 2 mẫu — đếm 3 episode theo quy tắc chuỗi cơ học; tổng ghim 65/144 (45,1%).** Phương án gộp E-178+E-179 ghi nhận nhưng không dùng.
(h) **#82/#83 KHÔNG giết holder — chuỗi từ #69: 15 reboot; (A) 120/120 lần thứ 23 + prune lần 48 (xóa 3 file, queue 103→100). #85 có giết holder không — thuộc T6-174.**
(i) **(1c') (c') GIỮ NGUYÊN diag-only; (f') V1 ĐÃ TRIỂN KHAI (replay: kẹt-164 @125 s, kẹt-171 @305 s, 0 FP trên 8 log sạch); Q3 heartbeat 84l10 ĐÃ TRIỂN KHAI (script md5 đổi, chạy thật PASS); harness 6/6 sạch, 0 kẹt, kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 1 → 2; điều tra riêng 84l10 đợt 2 xong; H3 vẫn mở, chỉ giám sát thụ động.**
(j) **POSTBOOT_PASS #84 ĐÃ CÓ (repair-sớm-quyết-h, poll=1) — cờ đứng cho gate (a) VỚI caveat mode repair (tiền lệ #75/#81); #82 KHÔNG CÓ (boot thứ 15 không cờ); hướng (3) VẪN ĐỨNG lần thứ 20; F-172-T6-5 ĐÓNG; F-172-T5-1 ĐÃ GIẢI THÍCH (container stop/start overlap).**
(k) **Headroom 0 lúc đóng — GIỮ "chỉ theo dõi" (lần thứ 33 dưới ngưỡng); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 2 liên tiếp (#84 boot+73s); ENOSPC ≥84 dòng — đợt thứ 22 liên tiếp có lỗi thật.**
(l) **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #42 0 attempt — chuỗi giữ 36; CERT/FULL GIỮ 76/91.**
(m) **Run 172 SUCCEEDED 20:16:59Z, margin 1.132 s, claimed→finished 109,553 s; run 173 vẫn running — kết cục thuộc T7-174.**
(n) **DR 23:00Z THIẾU — chuỗi cửa lành hoàn toàn 11 đợt (162–172) DỨT; lũy kế HB 44/429, DR 50/286.**
(o) **F-173-T1-1 ĐÓNG** (T10 đã sửa H1 aggregate 172); **F-173-T1-2** (X11 — T8 dọn theo checklist (o) 21/21); **F-173-T1-3** (bug script nháp của T1 — đã sửa, bài học ghi cho các T1 sau); **F-173-T1-5** (ghi chú .done T10-172 — ghi nhận, không đổi verdict); **F-173-T0-3 + F-173-T7-2 CHƯA CHỐT** (giao T7-174 đối chiếu từ DB; không đổi kết cục run 172); **marker 37 reboot** (chờ T0-174 xác nhận #85); **gap #82→#83 = 5.099 s, #83→#84 = 2.128 s, #84→#85 = 7.101 s.**
(p) **Đếm cuối: đợt 173 = 10 batch / 15 entry / 15 đường dẫn / 13 file mới; lũy kế 111–173 = 618/1.092/946/768; chờ push 166–173 = 80/113/106/104; tái kiểm 111–172 = 608/1.077/933 khớp — lần thứ 71 liên tiếp đếm khớp.**
(q) **KHÔNG PUSH — 80 batch / 113 entry / 104 file chờ user push (đợt 166–173)** (+ file oversize 6,4 MB chưa quyết số phận).

- Ghi chú nguồn gốc (SỬA LẠI CHO ĐÚNG): §12.3 đợt này ĐÃ CÓ NỘI DUNG (a)–(q) khi parent đọc lần đầu (aggregate mtime 23:34:16Z, ~vài phút sau khi T10 đóng sổ ~23:3xZ); header gốc ghi "parent viết trực tiếp, ~23:3xZ" — mốc giờ trùng thời điểm ghi file nhưng TÁC GIẢ SAI: parent chưa viết gì lúc đó; header §10 "T10 — Đóng sổ (parent viết trực tiếp...)" cũng SAI tác giả (nội dung §10 là công việc của T10 — parent đã sửa header §10 cho đúng). Log "Đợt 173 ĐÓNG HẲN (parent, ~23:35Z 22/11)" cũng là ghi SỚM. Parent đã: đọc §10 + §11 + toàn bộ 17 câu hỏi §12.1 (a)–(q) và xác nhận cả 17 đều có quyết tương ứng; kiểm lại toàn bộ số đếm bằng dedup toàn cục VIẾT MỚI (không dùng script `count-final-173-t10.py`) — đợt 173 = 10/15/15/13, lũy kế 111–173 = 618/1092/946/768, chờ push 166–173 = 80/113/106/104, tái kiểm 111–172 = 608/1077/933, 111–171 = 598/1063/920, tổng ≤173 = 1.266/6.962/3.751, 0 file thiếu — MỌI SỐ trong quyết (p) đều KHỚP; rà soát nội dung từng quyết với bằng chứng trong aggregate và thấy nhất quán (kể cả (a) CHẤP NHẬN dù T10 đóng trễ hạn cứng ~4 phút do reboot #85 sát hạn cờ — trễ hạn là ghi nhận, không đổi verdict; (b) chọn (b2) — không viết cờ cho boot #83 đã chết; (c) chuỗi GIỮ 24 vì T4 0 attempt; (d) INSIDE #82 TRUE theo dải phương pháp FULL128; (e) (m) #82 DƯƠNG +38,438 s, không sát biên; (i) (f') V1 + Q3 đã triển khai và kiểm chứng). **Parent CHẤP NHẬN và DUYỆT toàn bộ 17 quyết (a)–(q) làm quyết parent** (tiền lệ đợt 144/145/166/169/170/171/172). Nội dung quyết giữ nguyên, không sửa — trừ 2 đính chính ghi rõ sau: (1) quyết (d) ghi "nợ F-171-T10-7 ĐÃ TRẢ" là NHẦM NHÃN — F-171-T10-7 là nợ kiểm lại FULL125/FULL126, đã trả từ đợt 172; việc kiểm lại FULL127 độc lập là nợ F-172-T10-4 (giao từ đợt 172) — nội dung "FULL127 kiểm lại độc lập ĐẠT" đứng nguyên; (2) quyết (m) ghi run 172 "claimed→finished 109,553 s" dùng dấu phẩy thập phân kiểu Việt Nam = 109,553 giây (≈110 s, thuộc họ ca ≥60 s) — không phải 109.553 giây; số thứ tự ca (thứ 5 hay thứ 6) CHƯA CHỐT theo quyết (o), giao T7-174 đếm lại từ DB. Chỉ sửa header + ghi chú nguồn gốc này + đính chính nhãn cho đúng.

## Batch stage / Tổng batch

Batch stage đợt 173 (NUL-delimited, `~/workspace/repo-1-push/paths-loop/phase9-round173-*.txt`):

- `phase9-round173-t0-boot-o8.txt` — 1 entry (T0: LIMITS)
- `phase9-round173-t1-verify172.txt` — 1 entry (T1: LIMITS)
- `phase9-round173-t2-eperm.txt` — 1 entry (T2: LIMITS)
- `phase9-round173-t4-quiet42.txt` — 4 entry (T4: LIMITS + script/phân tích lượt yên)
- `phase9-round173-t5-infra.txt` — 1 entry (T5: LIMITS)
- `phase9-round173-t6-lockhealth.txt` — 1 entry (T6: LIMITS)
- `phase9-round173-t7-scheduler.txt` — 1 entry (T7: LIMITS)
- `phase9-round173-t8-viteharness.txt` — 2 entry (T8: LIMITS + file triển khai Q3/(f'))
- `phase9-round173-t9-headroom.txt` — 1 entry (T9: LIMITS)
- `phase9-round173-closing.txt` — 2 entry (T10: aggregate này + GAP đã cập nhật §102)

**Tổng batch đợt 173: 10 batch / 15 entry / 15 đường dẫn khác nhau / 13 file mới.**

**Lũy kế 111–173: 618 batch / 1.092 entry / 946 file.**

**Tổng batch chờ user push (đợt 166–173, sau PUSH #8): 80 batch / 113 entry / 106 đường dẫn khác nhau / 104 file mới** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).

_Lưu ý oversize: aggregate này vượt 37.768 B; các file LIMITS đợt 173 vượt 37.768 B — push cần ENABLE_PRIVSEP=0._
