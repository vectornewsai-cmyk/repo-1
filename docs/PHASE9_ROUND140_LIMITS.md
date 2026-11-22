# VCut Studio — Phase 9, đợt 140: LIMITS gộp (đóng sổ)

- Mở: 17:35:51Z 18/11/2026 (lượt cron 00:35 +07 19/11; sched 17:35:51Z, run 1e775062). Boot lúc mở: af558fb5-e964-4116-a69b-ec784f3defab, btime 15:54:37Z (= #97?, đã xác nhận đợt 139; marker/brief/T2 đều ghi đúng btime — KHÔNG có mâu thuẫn BTO lần này).
- Đóng: 19:57Z 18/11/2026 (giờ chính xác = mtime cờ round140-t10.done, xem §9.5; hạn cứng ước lượng ~20:00Z).
- Luồng: 8 luồng + T10 (KHÔNG có T3 — (c2) đã đóng từ đợt 139). Cờ: 8/8 (T1 17:40Z, T2 ~17:55Z, T4 19:35Z, T5 18:38Z, T6 17:45Z, T7 19:33Z, T8 19:36Z, T9 19:19Z, T10 đóng sổ).
- **Verdict: CHẤP NHẬN** (8/8 cờ; khiếm khuyết lớn ghi rõ ở §9.6 — lượt yên #17 không đo được, T8 0 lần chạy harness, birefnet 0 lần thử, headroom chỉ còn ~38 trên ngưỡng báo; tất cả do điều kiện môi trường — balloon đóng băng + 1 reboot giữa lượt — không phải do luồng nào không làm việc).
- **1 reboot giữa lượt — sự kiện #22:** af558fb5 → 90392aa5, btime 17:52:56Z (epoch 1795024376). Boot mới = #98? (T2: INSIDE cả hai dải #98? FULL72 + FULL73; gap danh nghĩa #97?→#98? = 7.099 s CHƯA chứng nhận — T2-141). Khung chết #97? chờ merged mù #60 (T2-141): các khung quan sát hiện có — T4/T5 (17:53:26Z, 17:54:22Z], T8 (17:53:26Z, 17:54:02Z]; btime sớm hơn mốc cuối boot cũ ~30 s (lệch đồng hồ, xem §9.4).
- **Cây lúc đóng:** preview.tsx md5 **530e10a7** (fix logger GIỮ VĨNH VIỄN theo quyết parent đợt 137 §12.3(a) — KHÔNG revert), media.ts 2c384ed1, vite.config.ts ee80d093, vcut-webkit-postboot-check.sh 5bd00bf7 (T5 sửa 2 lần trong đợt, chỉ header + say, không đổi logic). Cây lúc mở và suốt lượt cũng là 530e10a7; suite/O8 của T10 chạy trên cùng cây 530e10a7 (boot mới 90392aa5).

## §1. T1 — kiểm chứng độc lập đợt 139: PASS (xong 17:40Z)

- **Verdict T1-140: PASS — đợt 139 đứng vững hoàn toàn.** Mọi số đếm khớp 100% với số công bố; 9/9 cờ đủ; cây lúc đóng không đổi (preview.tsx 530e10a7 GIỮ, không revert); aggregate + GAP §68 đầy đủ, quyết parent §12.2 (a)–(l) đã ghi. Không có sai số nào đổi verdict đợt 139.
- Đếm lại độc lập đợt 139: **9 batch / 14 entry / 14 file duy nhất** (khớp số công bố); lũy kế 111–139 = **287/632/543** (khớp); tái kiểm 111–138 = **278/618/534** (khớp — **lần thứ 20 liên tiếp**); tái kiểm 111–137 = 268/605/523 (khớp). 14/14 đường dẫn tồn tại trên đĩa. File closing liệt kê đúng 2 entry (aggregate + GAP).
- Sai số T1: **F-140-T1-1** (lần đếm lũy kế đầu dùng glob `phase9-round1*.txt` quét nhầm cả đợt 100–110 — 116 file thừa — cho ra 403/1235/953 SAI; phát hiện ngay, chạy lại với regex đúng phạm vi → 287/632/543 khớp. Bài học: glob `round1*` luôn nuốt cả round 100–110); **F-140-T1-2** (aggregate đợt 139 tăng ~7 kB sau khi stage do quyết parent §12.2 thêm sau — cùng mẫu đợt 138; không ảnh hưởng đếm); **F-140-T1-3** (brief T1-140 ghi sai đường dẫn cây — `apps/web/src/components/editor/preview.tsx` / `apps/web/src/lib/media.ts` không tồn tại; đường dẫn thật `apps/web/src/preview.tsx` / `apps/web/src/media.ts`; md5 khớp nên cây vẫn PASS); **F-140-T1-4** (5/9 cờ `.done` đợt 139 là file 0 byte — chỉ chứng minh luồng đã xong, không tự mô tả kết quả; thông lệ từ nhiều đợt trước, không phải sai số).
- LIMITS: `docs/PHASE9_ROUND140_T1_VERIFY139_LIMITS.md` (10.986 B lúc stage; §10 thêm sau khi stage — cùng mẫu F-140-T1-2). Stage: `phase9-round140-t1-verify139.txt` (1 entry, od verify OK).

## §2. T2 — probe #59 ok + mù #59 ĐÓNG HOÀN TOÀN + gap #96?→#97? CHỨNG NHẬN → CERT 58 / FULL 73: xong ~17:55Z

- **Probe #59:** 17:40:41Z, boot af558fb5, ok=2 fail=0, exit 0. Status đầu DEAD/STALE (heartbeat age 10.585 s, last #58 14:44:16Z, boot 541524e2, exit 1); status sau ALIVE (age 0 s, n=59). Log v2 tăng đúng **3 dòng** (166 → 169) — như mọi lượt trước; prereg đã dự báo đúng +3 trước khi đo.
- **Boot #97? = af558fb5, btime 15:54:37Z — XÁC NHẬN theo quy ước VÀ được củng cố bởi merged** (đoạn A mù #59 đóng, tối đa 0 ẩn — không có reboot ẩn giữa #96? và boot này) **+ T6-140 chốt chuỗi tương đối #57→#97?**. F97? ≈ −1 s tới −2 s (±~1 s) — lần đầu 3 server HTTP Date không đồng nhất (+1/+2/+2 s; xem F-140-T2-5).
- **Mù #59 (14:44:16Z → 17:40:41Z, 2h56'25" = 10.585 s) — ĐÓNG HOÀN TOÀN. Mù đóng hoàn toàn thứ ba liên tiếp (#57, #58, #59 — lần đầu chuỗi 3 mù đóng liên tiếp).** Đoạn A ĐÓNG bằng luật lỗ (merged 154 mốc, lỗ lớn nhất **505 s** ≪ sàn 1.147 s, tối đa **0 ẩn**); đoạn B ĐÓNG bằng uptime trực tiếp (merged 133 mốc, lỗ lớn nhất 1.722 s — vượt sàn nhưng uptime loại bỏ reboot ẩn). Merged 288 mốc giây. Chuỗi: #50 đóng, #51 hở, #52 đóng, #53 hở, #54 đóng, #55 hở, #56 hở, #57 đóng, #58 đóng, **#59 đóng**.
- **Gap #96?→#97? = [7.246 s, 7.266 s] (2h00'56" ±10 s) — CHỨNG NHẬN DẠNG KHOẢNG** (đoạn A mù #59 đóng, tối đa 0 ẩn; đoạn B đóng bằng uptime). **CERT 57→58 / FULL 72→73**: CERT58 mean 1h34'28" median 1h48'59" p10 0h27'21" p90 2h17'40" sd 0h45'27"; FULL73 mean 1h41'03" median 1h50'39" p10 0h28'01" p90 2h25'29" sd 0h56'05"; in 90–150' = 37, <60' = 17, >180' = 6, >240' = 2. Dải chứng nhận [0h00'55", 3h14'08"] không đổi. Cross-check tái hiện T2-139 100% (CERT57/FULL72 khớp từng số).
- **Khung chết #96? ứng viên MERGED: (15:54:16Z, 15:54:37Z] (21 s)** — mốc muộn nhất là ram-139t8.log của T8 (15:54:16Z). Hẹp hơn khung T9 (15:54:02Z, 15:54:37Z] (35 s) — khung T9 chỉ còn là biên ngoài (mốc cuối của nó không phải mốc muộn nhất). Khung T8 (15:54:42Z, 15:55:24Z] là cách dựng khác (driver còn sống → boot mới thấy, quan sát trực tiếp, không neo btime) và mốc dưới của nó là nhân chứng nhảy (+5 s) — không giao với khung merged. **T2 ĐỀ XUẤT 21 s làm chuẩn mới** (cùng quy ước đồng hồ đọc như chuẩn #94? 8 s / #93? 14 s), kèm caveat đồng hồ cũ chạy nhanh (+5 s chắc chắn, tới +25 s có thể — xem F-140-T2-6); **parent quyết khi đóng sổ** theo quyết (c) đợt 139.
- Khung chết #95?: (13:47:01Z, 13:53:41Z] (400 s) — GIỮ NGUYÊN (T6-140 quét lại: 3 file, cùng một sự kiện). Khung chết #94? GIỮ chuẩn (11:52:12Z, 11:52:20Z] (8 s) theo quyết (b) đợt 139. Khung chết #93? GIỮ chuẩn (09:35:47Z, 09:36:01Z] (14 s).
- **#97? INSIDE dải dự báo** T2-139 (FULL72, neo tại #96? 13:53:41Z) [14:21:34Z, 16:19:19Z] — thực tế 15:54:37Z NẰM TRONG. Chuỗi INSIDE theo dải cơ học kéo dài thành 4 lần liên tiếp (#94?, #95?, #96?, #97?).
- **Dải dự báo #98? — CHUẨN theo quyết parent (f): [16:22:31Z, 18:20:15Z] (FULL72, neo tại #97? 15:54:37Z)** — khớp đúng dải T6-140 tính độc lập; biến thể FULL73: [16:22:37Z, 18:20:05Z] — chênh ≤10 s, không đổi verdict nào (F-140-T2-7).
- **REBOOT #98? SAU KHI ĐO XONG:** boot **90392aa5, btime 17:52:56Z** (epoch 1795024376; 4 nguồn khớp: /proc/stat + uptime -s + who -b Nov 18 17:53 + journal first entry 17:53:12Z = btime +16 s, đúng mẫu 16 s) — giữa lần kiểm cuối của T2 trên #97? (17:52:29Z) và lần kiểm sau (17:54:18Z). F98? ≈ −1 s (±~1 s, cả 3 server đồng nhất +1 s). **#98? NẰM TRONG cả hai dải** (FULL72 + FULL73) và trong dải hiệu dụng sau probe #59 [17:40:41Z, 18:20:15Z]. **Gap danh nghĩa #97?→#98? = 7.099 s (1h58'19")** — trong dải chứng nhận; **CHƯA chứng nhận** (cần merged mù #60 — việc của T2-141). **Mù #60 MỚI MỞ** từ probe #59 (17:40:41Z → probe #60 đợt 141); reboot #98? nằm 735 s sau đầu mù. Khung chết #97? chờ merged mù #60.
- Không tìm thấy bằng chứng sóng EPERM thật — 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 75 file *.log có mtime trong mù #59; 2 dòng "sóng EPERM đã tắt" đều là dương tính giả launcher đã biết. Quét mở rộng: 8 match thô / 8 dòng duy nhất — phân loại hết. Sóng gần nhất vẫn là ~11:55–12:11Z 11/11 — **~173,7h** trước probe #59. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 46: 935 dòng / 261 file** (phạm vi 3.164 file); R7b đối chiếu 960 dòng / 278 file; copies 25 dòng / 17 file — y hệt lần 43, 44 và 45 về copies. Đối chiếu chéo 935+25=960=R7b, **chênh 0 — lần thứ bốn mươi sáu liên tiếp**. +9 dòng / +2 file so với lần 45, giải thích đúng hết bằng diff (7 dòng từ LIMITS T2-139 + 1 từ aggregate 139 + 1 từ LIMITS T5-139 — đều viết sau scan #45). Đối chiếu bằng **SỐ TỔNG KẾT** theo quyết (h) đợt 138 — file thô scan #43 đã mất, chấp nhận mất. Async `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray.
- RAM: max biết được trong mù #59 **2.669.952 kB ≈ 2.607,4 MiB (T9-139, 15:13:59Z, đoạn A) — 42,44% guard 6.144 MiB, THIẾU 3.621.504 kB (~3.536,6 MiB), KHÔNG vượt**; birefnet KHÔNG chạy bởi T2 (thuộc T9-140 theo quyết (e)). Đỉnh này là thấp nhất từ đợt 135.
- dpkg.log boot #97? — replay XONG: 1.545 dòng / 221 installs / 462 configure, lần ghi cuối 16:11:16Z; replay bắt đầu 15:55:19Z (boot +42 s) — KHỚP HOÀN TOÀN hình dạng replay của boot #94?/#96?.
- Sai số T2: F-140-T2-1..9 (xem LIMITS T2 §7 — gồm F-140-T2-2 script ram-max mù với format log sampler của T9; F-140-T2-5 lần đầu 3 server HTTP Date không đồng nhất; F-140-T2-6 caveat đồng hồ khung 21 s; F-140-T2-7 dải FULL73 chênh ≤10 s; các F còn lại là ghi chú phương pháp/quét).
- LIMITS: `docs/PHASE9_ROUND140_T2_EPERM_LIMITS.md` (61.973 B — oversize, push cần ENABLE_PRIVSEP=0). Stage: `phase9-round140-t2-eperm.txt` (1 entry, od verify OK).

## §3. T4 — lượt yên WebKit #17: KHÔNG ĐO ĐƯỢC (1 attempt partial, gate A không mở trên boot mới): xong 19:35Z

- **Lượt yên #17 KHÔNG ĐO ĐƯỢC.** Chỉ có 1 attempt chạy dở: **attempt1 partial 10/20** trên boot cũ af558fb5 (pass 11 timeout 120 s, rồi bị reboot giết giữa lúc ghi partial JSON). **P1–P7 + P3' KHÔNG KIỂM ĐƯỢC** (DEF v0.5 §1: attempt partial không tính verdict).
- Poller boot cũ (pid 25124, 17:41:12Z–17:48:00Z, 10 poll): gate 0 xanh từ poll #1 (cờ T5 POSTBOOT_PASS 17:40:19Z); RAMavail min 692, max 1.145, mean 926,6 MB; ≥1024 MB: 3/10 (#2, #9, #10). **Cửa yên mở ở poll #10 (17:48:00Z, RAM 1.060 MB)** — chạy attempt1 ngay.
- Attempt1 (17:48:00Z, vite ready 511 ms, lock v2 giữ): pass 1–10 xong (~18 tick/pass, 180 blendTick, flip sau pass 5, wallMs 31.917); **pass 11 kẹt: không tiến trong 120.000 ms wall-clock** (kẹt rAF/renderer), pass-timeout lúc 17:52:31Z. Sau timeout, writePartial-tickCost TIMEOUT sau 30.000 ms (17:53:01Z); writePartial-blendTick đang chạy dở (elapsed 25 s lúc 17:53:26Z) thì **reboot giết toàn bộ tiến trình**. JSON partial trên đĩa 1.275.188 B, `partial=true`, `passesDone=10/20`, `partialReason='sau pass'` (chuỗi lý do bị cắt cụt do bị giết giữa chừng).
- Attempt1 partial — chỉ quan sát, KHÔNG verdict: (c2) = 0 occurrence trong 180 tick; tickCost total n=218 **median 73,0 ms** (p90 95,0; max 186; min 32); hậu flip+2000 ms n=89 **median 69,0 ms** — trên ngưỡng 60 ms, NHƯNG đây là attempt bị wedged (pass 11 kẹt 120 s, tBlend gap median 112 ms, max 2.092 ms) nên median bị phồng bởi stall; **không được đọc như một số đo lượt yên #17**, và không dùng để bàn lại ngưỡng tickCost.
- **Nguyên nhân duy nhất trên boot mới: gate A không mở.** Poller-b (pid 3878, 17:57:08Z–19:29:47Z, 124 poll; tổng đợt 134 poll): balloon đóng băng ở đúng giá trị của #15 — **6.443.824 kB** — suốt 124 poll trên boot 90392aa5; RAMavail không một lần ≥1024 MB trong 96 poll gate 0 đã xanh (min 443, max 832, mean 551,8 MB). Gate A giữ nguyên ≥1024 MB theo quyết parent đợt 139 (d) — **KHÔNG hạ, KHÔNG chạy attempt khi gate chưa mở, KHÔNG gia hạn** (poller tự đóng đúng 19:30Z, exit 5). Hai điều kiện (RAM đủ + gate 0 xanh) **không bao giờ trùng nhau** trên boot mới: RAM ≥1024 MB chỉ 10/124 poll — tất cả ở poll #1–#10, khi gate 0 còn đỏ (postboot mới chỉ có lúc 18:17:07Z).
- **Retry theo quyết parent đợt 139 (h): 0 lượt đã dùng.** Attempt1 partial do wedged (pass-timeout) + reboot — không phải lỗi setup; không có lỗi setup nào trong đợt này, nên không có retry nào được kích hoạt. Ngân sách retry tối đa 2 lần còn nguyên cho đợt sau.
- **Cộng dồn KHÔNG ĐỔI (vẫn 13 lượt yên hợp lệ):** P1 **32/32**, P2 **23/23**, P3-A1 **28/32**, P3' **4/4 (1 lượt)**, P7 **18/18**. Điều tra (c2) vẫn ĐÓNG — không có điều kiện nào trong ba điều kiện mở lại (§13 DEF v0.5) xảy ra. Chuỗi median tickCost 13 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 ms (trung bình 47,7 ms). Ngưỡng tickCost ≤60 ms: KHÔNG BÀN LẠI.
- **Lượt #17 phải đo lại ở đợt 141** (trên boot hiện tại 90392aa5 nếu còn sống, hoặc boot mới nếu reboot tiếp).
- Sai số T4: **F-140-T4-1** (lệ đồng hồ — reboot: btime boot mới 17:52:56Z TRƯỚC last-seen log boot cũ 17:53:26Z 30 giây; khung chết ghi theo quan sát (17:53:26Z, 17:54:22Z]; btime ghi kèm để T2/T10 đối chiếu); **F-140-T4-2** (vá script hỏng lần đầu — không ảnh hưởng dữ liệu; làm lại bằng vá theo dòng + kiểm `bash -n` OK trước khi chạy poller).
- LIMITS: `docs/PHASE9_ROUND140_T4_WEBKIT_QUIET17_LIMITS.md` (18.619 B — dưới ngưỡng oversize). Stage: `phase9-round140-t4-quiet17.txt` (1 entry NUL-delimited, verify `od`).

## §4. T5 — infra: 2 boot — replay boot 1 XONG + reboot #22 → replay boot 2 CHẾT YỂU → --repair 1 lần PASS: xong 18:38Z

- **BOOT 1 af558fb5 (#97?, T2-140 đã chứng nhận gap #96?→#97? [7.246, 7.266] s → CERT 58/FULL 73): replay XONG HẲN trước khi T5 mở** — 1.545 dòng / 221 installs / 462 configure, xong 16:11:16Z = boot +16m39s (CHẬM NHẤT wall-clock trong 3 replay đầy đủ, do **GAP 805 s** không rõ nguyên nhân giữa startup configure và install thật — F-140-T5-1); postboot PASS exit 0 ngay poll0 (17:39Z) + poll0b (17:40Z); cờ POSTBOOT_PASS ghi 17:40:19Z; T4 đã đọc ở poll #1 và MỞ CỬA YÊN #17 ở poll #10 (17:48:00Z, RAM 1.060 MB).
- **REBOOT GIỮA LƯỢT #22 (~17:52:56Z):** boot af558fb5 chết, giết attempt1 của T4 (PARTIAL 10/20) + sampler RAM T5 (dừng ở mẫu 15/40) + session exec/sleep của T5 (runtime restart, SIGTERM). Boot 2 **90392aa5** (#98?, T2-140: INSIDE cả hai dải #98? FULL72 + FULL73; gap danh nghĩa #97?→#98? = 7.099 s CHƯA chứng nhận, T2-141; btime 17:52:56Z): replay **CHẾT YỂU** — dpkg đóng băng 2 dòng từ 17:53:48Z, 0 proc apt/dpkg, cache apt TRỐNG (0 .deb — KHÔNG sống qua reboot lần này), lists 5; watcher v6 poll 9 (18:04:01Z, silent 614 s) **TRIGGER=YES §8.2(B) form B**; luật (C) KHÔNG đủ (lists 5>3); T5 verify độc lập 5/5 (18:05:06Z) rồi **--repair 1 lần duy nhất** (18:05:45Z): apt-get update OK sau ~9 phút (mirror chậm, 181 dòng `Get:`), cài đủ 11 gói, RE-CHECK toàn PASS; dpkg đóng băng **795 dòng / 113 installs / 230 configure** (y hệt boot #95? 914964c3 — repair 1 phần, KHÔNG phải replay đầy đủ 1.545/221/462); GST là **SYMLINK → debroot** (269 file), không phải thư mục thật; watcher ghi cờ POSTBOOT_PASS mới **18:17:07Z poll 22** (PASS ổn định 2 poll); T4 đã khởi động lại poller 17:57:08Z và đọc cờ mới từ poll #29.
- **Lệch đồng hồ ~+30–35 s quanh reboot (F-140-T5-2; T4 F-140-T4-1 xác minh độc lập):** mốc hoạt động cuối của boot cũ theo đồng hồ cũ (sampler T5 17:53:19Z, chain T4 17:53:26Z) NẰM SAU btime boot mới 17:52:56Z (~30–35 s) — đồng hồ cũ có lẽ chạy nhanh ~+35 s so với host; T5 lấy btime kernel 17:52:56Z làm chuẩn cho boot mới, mọi mốc boot cũ giữ nguyên theo đồng hồ cũ và ghi rõ. Cửa chết boot 1 theo quan sát: (17:53:26Z, 17:54:22Z].
- RAM: boot 1 n=15 (bị cắt): avail 737.604–1.181.516 kB, 0 mẫu ≥ guard, gate A 2/15. Boot 2 n=40: avail 490.928–2.292.968 kB (max 36,5% guard), 0 mẫu ≥ guard, gate A 9/40; balloon **GHIM TRẦN KẸT 6.443.824 kB 15 mẫu**; lúc đóng avail 523.020 kB, balloon ở trần kẹt. **KHÔNG cửa sổ guard — KHÔNG ai thử birefnet.**
- **Headroom: 1.840 (mở, boot 1) → 1.838 (cuối, boot 2, 18:21Z) — chỉ còn ~38 trên ngưỡng báo < ~1.800 — T10 BÁO PARENT** (xem §8 + §12.1(j)).
- WFS #46 chênh 0 (935/261; T2 quét độc lập số đếm Y HỆT). Probe #59 ok=2 fail=0; sweep59: vẫn bật 0, CẢNH BÁO 0, OpNotPerm 0, đã tắt 2 (FP đã biết). KHÔNG có probe #60 trên boot mới (T2 đã đóng). dmesg vẫn EPERM. Async .writeFile: 2 helper đã biết, 0 stray.
- Cây không đổi: preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093. Postboot script **6b0874ba → 271fbe03 → 5bd00bf7** (header + say, KHÔNG đổi logic).
- Sai số T5: F-140-T5-1 (GAP 805 s không rõ nguyên nhân trong replay boot 1), F-140-T5-2 (lệch đồng hồ ~+30–35 s quanh reboot), F-140-T5-3 (cache apt 0 .deb trên boot 2 — không sống qua reboot lần này), F-140-T5-4..6 (xem LIMITS T5 — ghi chú watcher/repair).
- LIMITS: `docs/PHASE9_ROUND140_T5_INFRA_LIMITS.md` (52.065 B — oversize, push cần ENABLE_PRIVSEP=0). Stage: `phase9-round140-t5-infra.txt` (2 entry: LIMITS + postboot-check.sh, NUL-delimited, verify od).

## §5. T6 — lock KHỎE + prune lần 15 + chuỗi #57→#97? + dải #98? trùng khớp T2: xong 17:45Z

- **Lock KHỎE — trống lúc mở/đóng (0 ticket + 89 cooldown, 17:42Z); 993 dòng chính thức, 287 cặp, 1 "đang giữ" = t4 F-134-T6-2 cũ (giữ nguyên lịch sử); 0 TIMEOUT/STALE-LOCK mới; "KHÔNG NHẢ" trên lock thật: 0 (đợt 138+139 toàn đợt, 140 tới 17:42Z); suite 9/9 ×2 (T7 xanh cả hai, lần thứ 16 liên tiếp); prune lần 15: xóa 0 file.**
- Đợt 139: 11 chu kỳ sạch (t4 ×4 + t8 ×6 + t10 ×1) — T6 đếm bổ sung 10 chu kỳ sau khi T6-139 đóng. Đợt 140 tới 17:42Z: 0 chu kỳ (chưa luồng nào acquire). Thứ tự ghi mới: 31 chu kỳ liên tiếp sạch.
- Boot: chuỗi tương đối **CHỐT #57→#97?**; #97? TẠM cho T2-140 lúc T6 đóng (merged mù #59 chưa xong — T2 sau đó xác nhận #97? theo quy ước + merged, xem §2). Khung chết #95? (13:47:01Z, 13:53:41Z] 400 s GIỮ NGUYÊN. Khung chết #94? GIỮ chuẩn 8 s theo quyết parent (b) đợt 139. Khung chết #96? HOÃN QUYẾT — ghi cả hai khung (T9 35 s + T8 sau btime) theo quyết parent (c), chờ T2-140 merged mù #59 (T2 đã đề xuất khung merged 21 s, xem §2). #97? INSIDE cả hai dải (T6 FULL70 + T2 FULL72). **Dải #98? T6 độc lập (FULL72): [16:22:31Z, 18:20:15Z] — TRÙNG KHỚP hoàn toàn dải T2** (quyết parent (f) đợt 139).
- Sai số T6: **F-140-T6-1** (thử đọc preview.tsx bằng đường dẫn sai `apps/web/src/editor/` — đã tìm lại đúng, md5 530e10a7 khớp; cùng lớp F-140-T1-3).
- LIMITS: `docs/PHASE9_ROUND140_T6_LOCKHEALTH_LIMITS.md` (58.161 B — oversize). Stage: `phase9-round140-t6-lockhealth.txt` (1 entry).

## §6. T7 — cửa LÀNH: 0 slot thiếu MỚI + started_at lượt 140 BỊ VIẾT LẠI (bằng chứng trực tiếp thứ tư): xong 19:33Z

- **CỬA LÀNH — 0 slot thiếu MỚI (đợt 139 lành; đợt này lành tiếp): heartbeat 6/6, deterministic-doctor 3/3.** Cửa kiểm ~2h54' (16:35:44Z → 19:30:06Z); 3 lần kiểm chính + 1 kiểm giữa khớp hoàn toàn ở mọi slot trùng. Cả 6 slot HB jitter −316 s (mẫu chuẩn); cả 3 slot DR jitter 0 s.
- **Reboot giữa lượt (af558fb5 → 90392aa5, btime 17:52:56Z) KHÔNG nuốt slot nào:** slot HB 17:50:50Z chạy TRƯỚC reboot (start 17:45:34Z < btime); slot DR 18:00Z là slot đầu tiên tới hạn sau reboot — chạy đúng giờ (0 s) trên boot mới; HB 18:20:50Z + 18:50:50Z + 19:20:50Z chạy đúng giờ trên boot mới — scheduler hồi phục sau reboot giữa lượt.
- Lũy kế (cùng phương pháp đợt 125–139): heartbeat **44/230 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/186 slot thiếu** (số thiếu +0, mẫu số +3).
- **Dị thường started_at — kiểm thứ 11 của giả thuyết, BẰNG CHỨNG TRỰC TIẾP THỨ TƯ: lượt 140 ĐÃ BỊ VIẾT LẠI tại reboot giữa lượt, T7 tự quan sát được cả TRƯỚC và SAU trong cùng một đợt** (sau đợt 137, 138 và 139). Lượt vcut đợt 140 (run `1e775062`) started_at ghi 17:35:51Z ở kiểm lần 1 (jitter 0 s), sau reboot giữa lượt (boot 90392aa5, btime 17:52:56Z) ghi nay **17:53:45Z = btime + 49 s**, jitter **+1.074 s**; KHÔNG bị viết lại lần 2 (không có reboot thứ hai tới kiểm lần 3, 19:30Z). **Đồng thời, run 139 (`24a20fbc`) KHÔNG bị viết lại lần 2** tại cùng reboot vì đã finished 17:04:27Z trước reboot — đúng theo giả thuyết tinh chỉnh. **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 11.** Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / **49 s (140-lần-1)**.
- **Không có sai số số liệu mới — không có F-140-T7-n nào.** 3 lần kiểm chính + 1 kiểm giữa khớp hoàn toàn; mọi jitter tính lại bằng `date -u` từ epoch thô; boot_id tự xác minh ở cả 2 boot trong lượt. Lưu ý: boot 90392aa5 chưa có đối chiếu T2 (T2 chưa cập nhật boot-verify.txt tới kiểm lần 3) — ghi rõ, không khẳng định đối chiếu hai nguồn cho boot này.
- LIMITS: `docs/PHASE9_ROUND140_T7_SCHEDULER_LIMITS.md` (22.791 B). Stage: `phase9-round140-t7-scheduler.txt` (1 entry).

## §7. T8 — vite harness: GATE NOT MET, 0 LẦN CHẠY HARNESS (reboot giữa lúc chờ + balloon đóng băng): xong 19:36Z

- **Gate KHÔNG MỞ:** waiter `WAIT-DEADLINE 19:30Z poll=97 19:30:56Z — GATE NOT MET` (exit 3); vòng kiểm tay `WATCH-DEADLINE 19:30Z poll=97 19:30:58Z — GATE NOT MET` (exit 3). **Không gia hạn quá deadline** (đúng brief). T4 tự đóng 19:30Z với **0 attempt** trên boot mới. `round140-t4.done` KHÔNG tồn tại lúc T8 kiểm lần cuối (19:32:16Z vẫn không có — T4 đóng cờ 19:35Z sau đó).
- **1 reboot GIỮA LÚC CHỜ (F-140-T8-1):** boot `af558fb5` chết trong khoảng (17:53:26Z, 17:54:02Z]; boot mới `90392aa5`, btime 17:52:56Z — **sớm hơn mốc cuối boot cũ ~30 s** (cùng lớp F-138-T8-1 26 s / F-139-T8-3 5 s). Runtime restart giết waiter/watch/sleep-check của T8; T4 attempt1 bị giết giữa evaluate (HB129, im lặng 25/30 s); cờ POSTBOOT_PASS của T5 thành STALE. T8 khởi động lại waiter/watch 17:54:54/17:54:57Z trên boot mới, log cũ đã bảo toàn.
- **Balloon đóng băng đúng 6.443.824 kB (F-140-T8-3):** đúng giá trị đóng băng đợt 138/139, không đổi ~31 phút (18:25–18:56Z), chỉ nhúc nhích 2 lần rồi phồng lại đúng giá trị cũ; RAM phẳng ~500 MB. Gate A (≥1024 MB) không mở trên boot mới.
- **Hai nửa gate không bao giờ xanh cùng lúc trên boot mới (F-140-T8-2):** gate A đạt 1.058 MB ở poll #10 của T4 lúc 18:03:55Z nhưng gate 0 còn đỏ (POSTBOOT_PASS mới chỉ có lúc 18:17:07Z); khi gate 0 xanh thì RAM đã rơi về ~500 MB. Trên boot cũ gate ĐÃ MỞ 17:48:00Z (RAM 1.060 MB) và T4 attempt1 đã chạy — nhưng bị reboot giết.
- **Chuỗi "P3 không kẹt" GIỮ 10, KHÔNG tăng (F-140-T8-5):** 0 lần chạy ≠ 0 kẹt — không đếm, như đợt 138 (quyết parent (i) đợt 138). Watchdog diag path mới vẫn CHƯA được chứng minh bằng kẹt thật (chỉ smoke-test + 6 lần chạy sạch đợt 139).
- Chuẩn bị xong, cây không đổi: 5 script adapt 139→140 (`bash -n` OK ×5, `node --check` OK ×3); symlink ổn định trỏ lại sang diag đợt mới; smoke-test diag qua đường ổn định 10/10 lúc 17:40:29Z (dmesg EPERM + journalctl -k rỗng); preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093` giữ nguyên mở/cuối; 3 script harness md5 KHÔNG ĐỔI so với đợt 139.
- Dọn sạch: waiter/watch đã thoát (exit 3 theo thiết kế); 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium sót; `/tmp/.X11-unix/` trống; không `vite.lock`; fixture `/tmp` KHÔNG rebuild (gate không mở nên không rebuild — vẫn mất từ reboot đợt 139).
- Sai số T8: F-140-T8-1 (reboot giết waiter/watch; mốc mâu thuẫn ~30 s), F-140-T8-2 (hai nửa gate lệch nhau), F-140-T8-3 (balloon đóng băng đúng giá trị cũ), F-140-T8-4 (dmesg EPERM tái xác nhận; bước 4 vẫn nửa bằng chứng — đã chấp nhận theo quyết (h) đợt 137), F-140-T8-5 (watchdog chưa kích hoạt thật), F-140-T8-6 (không gia hạn waiter quá deadline).
- LIMITS: `docs/PHASE9_ROUND140_T8_VITEHARNESS_LIMITS.md` (28.264 B). Stage: `phase9-round140-t8-viteharness.txt` (1 entry — chỉ LIMITS; 3 script harness không đổi nên không stage lại).

## §8. T9 — headroom/RAM: 1.840, còn 40 trên ngưỡng báo — SẮP CHẠM; birefnet 0 lần thử: xong 19:19Z

- **Headroom inotify: 1.840** (đo 2 lần trên boot af558fb5 btime **15:54:37Z**: 1.840 lúc 17:38:54Z và **1.840** lúc 17:38:59Z, chênh **0**) — **TIẾP TỤC GIẢM**: 1.954 (đợt 139) → **1.840 (−114, −5,8%)**. Bước giảm nằm trong dải 106–127 của **mười một đợt gần nhất (130–140)**. Số watch giữ ngoài cell suy ra: 63.747 − 1.840 = **61.907 watch** (tăng ~114 so với 61.793 đợt 139). Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 1.840 / 1.578 ≈ **1,17 lần** — đủ cho ~1 vite dev server chạy nối tiếp.
- **CHƯA tới ngưỡng báo user (< ~1.800) — nhưng chỉ còn cách 40.** Ngưỡng có thể chạm ngay đợt 141 nếu đà giữ nguyên (40 / ~114 ≈ 0,35 đợt — chỉ là phép chia số học, KHÔNG phải dự báo). **T5 đo thêm cuối đợt trên boot mới: 1.838 lúc 18:21Z (chỉ còn ~38)** — hai số đo khác nhau 2 đơn vị do khác thời điểm/boot, không phải mâu thuẫn; cả hai đều trên ngưỡng. **T10 BÁO PARENT theo quyết (i) đợt 139** (xem §12.1(j)): đợt 140 CHƯA chạm <1.800, nhưng chỉ còn ~38–40.
- **Cùng boot af558fb5 với vòng 2 đợt 139 — headroom GIẢM NGAY TRONG CÙNG BOOT:** 1.945 (đo lần 3 đợt 139, 15:56:41Z) → 1.840 (17:38:54Z) = **−105 trong 1h42' trên cùng một boot**. Suy giảm không chỉ xảy ra qua reboot (F-140-T9-1).
- **REBOOT GIỮA CỬA SỔ ĐO:** boot af558fb5 chết, boot mới 90392aa5 lên thay, btime 17:52:56Z. Sampler vòng 1 bị SIGTERM giết cùng lúc (15 mẫu, 17:39:13–17:53:15Z); đã khởi động lại vòng 2 trên boot mới lúc ~17:55Z (gap lấy mẫu ~2 phút). Đo headroom lần 3 trên boot mới: probe thêm **20.000 watch không gặp ENOSPC lúc 17:54:16Z** (boot 80 giây tuổi — cửa sổ thoáng ngay sau boot), nhưng đo lại 29 giây sau (17:54:45Z, probe trần cao) đã về **1.840** — giá trị ổn định trên boot mới **Y HỆT boot cũ (chênh 0)**. Giá trị chuỗi vẫn lấy 1.840 (đo trên boot lúc mở đợt).
- **RAM:** đỉnh chỉ 36,49% guard. Max toàn cửa sổ (92 mẫu, hai vòng: 15 vòng 1 + 77 vòng 2, 17:39:13–19:11:26Z): **2.295.468 kB = 2.241,7 MiB lúc 17:57:20Z** (boot mới), thiếu **3.995.988 kB (~3.902,3 MiB)** mới tới guard 6.291.456 kB. Min toàn cửa sổ: **474.204 kB (463,1 MiB) lúc 18:43:24Z**. **0 mẫu ≥ 6.144 MiB. Birefnet KHÔNG THỬ.** Đỉnh thấp nhất từ đợt 135 theo T2 (đợt 138: 99,07%; đợt 137: vượt guard).
- **Balloon virtio:** ĐÓNG BĂNG ở 6.443.824 kB (79,3% tổng RAM) trong 48/92 mẫu — vòng 1: 0 mẫu; vòng 2: 48 mẫu thành 5 đợt (4 + 12 + 14 + 14 + 4 mẫu). Giá trị đóng băng y hệt đợt 138/139 — balloon KHÔNG xả bền; RAM phẳng ~0,5 GB suốt nửa sau cửa sổ vòng 2.
- Median tickCost lượt yên #17 (T4): CHƯA CÓ lúc T9 đóng — giao T10 (T4-140 chưa xuất bản LIMITS lúc 19:13Z; chỉ có file phân tích attempt1 — nay đã có: partial median 73,0 ms, chỉ quan sát, xem §3).
- Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào (journal 0 dòng "No space left"/ENOSPC từ btime 15:54:37Z).
- Sai số T9: F-140-T9-1..5 (xem LIMITS T9 — gồm F-140-T9-1 headroom giảm ngay trong cùng boot; các F còn lại là ghi chú sampler/reboot).
- LIMITS: `docs/PHASE9_ROUND140_T9_HEADROOM_LIMITS.md` (41.760 B — oversize, push cần ENABLE_PRIVSEP=0; md5 6f61e8ba3258f6623d003b2e9746bd2c). Stage: `phase9-round140-t9-headroom.txt` (1 entry).

## §9. T10 — đếm cuối + đối chiếu chéo + verify độc lập (đóng sổ)

### 9.1 Đếm cuối bằng script dedup toàn cục (`count-final-140.py`, adapt từ `count-final-139.py`)

- **Pre-count (19:39Z, trước khi viết file closing, lưu `t10-count-pre-140.txt`): đợt 140 (8 luồng) = 8 batch / 9 entry / 9 file duy nhất; lũy kế 111–140 = 295/641/551; tái kiểm 111–139 = 287/632/543 — KHỚP số công bố đợt 139 (lần thứ 20 liên tiếp khớp).** File mới-only đợt 140: 8 (8 LIMITS của 8 luồng); trùng với 111–139: 1 (`apps/web/scripts/vcut-webkit-postboot-check.sh` — trùng hợp lệ, cùng đường dẫn đã stage trước); 0 đường dẫn stage thiếu trên đĩa; 0 file paths không thuần NUL.
- Chi tiết theo từng file paths (pre-count): t1 1, t2 1, t4 1, t5 2 (LIMITS + postboot script), t6 1, t7 1, t8 1, t9 1.
- **Đếm cuối (sau khi viết file closing, script `count-final-140.py` chạy lại — xem `t10-count-final-140.txt`): đợt 140 = 9 batch / 11 entry / 11 file duy nhất; lũy kế 111–140 = 296/643/552.** Closing thêm đúng 2 entry (aggregate này + GAP): cả hai đều là đường dẫn riêng biệt trong đợt nên đợt lên 9+2 entry và 9+2 file (11); lũy kế chỉ +1 file (552) vì GAP đã có trong 111–139, chỉ aggregate là mới hoàn toàn. Không cộng tay — số cuối là kết quả script chạy lại trên toàn bộ file paths-loop (đã kiểm sau khi stage; bài học AGENTS.md + F-138-T10-3). Chạy count lần đầu sau khi stage đã bắt được 1 lỗi đường dẫn (xem F-140-T10-4) và 1 lỗi cộng tay "10 file" trong bản nháp (xem F-140-T10-5) — cả hai đã sửa trước khi tạo cờ.

### 9.2 Đối chiếu chéo giữa các luồng (T10 kiểm độc lập)

- T1-140 verify đợt 139 PASS độc lập (9/14/14; lũy kế 287/632/543; tái kiểm 111–138 = 278/618/534 khớp lần thứ 20) — KHỚP đếm cuối của T10-140 (tái kiểm 111–139 = 287/632/543; lũy kế 111–138 = 278/618/534 trong cùng script).
- T2 vs T6: dải #98? FULL72 [16:22:31Z, 18:20:15Z] trùng khớp hoàn toàn hai luồng tính độc lập; #97? INSIDE cả hai dải; chuỗi tương đối #57→#97? do T6 chốt, T2 xác nhận bằng merged.
- T4 vs T5 vs T8 vs T9 về reboot #22: btime 17:52:56Z khớp 4 luồng (T2 4 nguồn, T5 kernel, T7 /proc/stat+uptime+who-b, T8 /proc/stat+uptime); khung chết quan sát: T4/T5 (17:53:26Z, 17:54:22Z] vs T8 (17:53:26Z, 17:54:02Z] — khác nhau ở mốc cuối quan sát (T8 kiểm boot mới sớm hơn 20 s); btime sớm hơn mốc cuối boot cũ ~30 s ở cả ba — lệch đồng hồ nhất quán, không phải mâu thuẫn số liệu.
- T5 vs T9 về headroom: T9 chuỗi 1.840 (boot lúc mở); T5 1.840 → 1.838 (cuối, boot mới) — chênh 2 do khác thời điểm/boot; cả hai đều trên ngưỡng ~1.800.
- T2 vs T5 về dpkg boot #97?: 1.545/221/462 khớp hoàn toàn (T2 đọc độc lập đối chiếu; T5 là chủ quản).
- T2 vs T9 về RAM max trong mù #59: T9-139 2.669.952 kB (42,44% guard) là đỉnh cao nhất; T4-139 poll #7/#8 2.081/2.049 MB corroborate — không sampler nào quan sát được ≥ 6.144 MiB.

### 9.3 Verify độc lập T10 (suite + O8)

- **Suite cây gộp: 27/27 exit 0, 0 rerun** (chạy 19:39:46–19:44:36Z trên boot 90392aa5, cây preview.tsx 530e10a7, RAMavail 702 MB lúc bắt đầu; test-preview-engine.sh: **354 assertions pass**; log `round140-t10-suites.log`).
- **O8: Chromium 21/21 + WebKit 21/21, exit 0** (chạy 19:44:46–19:46:47Z trên boot 90392aa5, cây preview.tsx 530e10a7; lock t10-round140 giữ 121 s, đã nhả; vite sau release curl 5554/5564 = 000000; **42 dòng PASS, 0 fail**; log `t10-o8.log`). **WebKit FULL PASS lần thứ 18 liên tiếp (đợt 123–140).**
- Fixture O8: copy từ round87-o8/headed/ (6/6 md5 khớp lúc mở — T8 không rebuild fixture /tmp vì gate không mở; O8 của T10 dùng fixture riêng trong round140-t10/o8-*, không phụ thuộc /tmp).

### 9.4 Sai số của T10 (ghi rõ — không giấu)

- **F-140-T10-1** (vòng chờ cờ đầu bị SIGTERM cùng reboot 17:52:56Z — runtime restart giết exec session proc_1f85527994ef sau ~13 phút, lúc 17:50Z mới ghi được 2/8 cờ; T10 khởi động lại vòng chờ 17:54:00Z, không mất dữ liệu; đủ 8/8 cờ lúc 19:39Z).
- **F-140-T10-2** (pre-count ghi RAMavail 736 MB lúc 19:39:19Z nhưng suite log ghi 702 MB lúc bắt đầu 19:39:46Z — hai mốc đo khác nhau 27 s, không phải sai số đo; số chính thức cho suite là 702 MB theo log).
- **F-140-T10-3** (giờ đóng trong header bản nháp ghi "19:57Z" — đã sửa theo mtime cờ `.done` sau khi tạo cờ; xem §9.5).
- **F-140-T10-4** (file closing ghi sai đường dẫn GAP lần đầu: `docs/PHASE9_GAP_ANALYSIS.md` — thừa `docs/`; GAP thật ở root repo. Phát hiện nhờ count-final chạy lại sau khi stage: GAP hiện NEW vs 111–139 (trong khi closing đợt 138/139 đều ghi `PHASE9_GAP_ANALYSIS.md`); đã sửa file closing + chạy lại count trước khi tạo cờ).
- **F-140-T10-5** (bản nháp §9.1/footer ghi đợt 140 "10 file" — cộng tay sai: quên GAP là đường dẫn riêng biệt trong đợt dù trùng với lịch sử; script đếm cuối cho 11 file đúng — 8 LIMITS + postboot + aggregate + GAP = 11 đường dẫn riêng biệt trong đợt; lũy kế chỉ +1 (552) vì GAP đã có trong 111–139).
- **F-140-T10-6** (reboot #23 trong lúc đóng sổ — xem §10.2: boot 90392aa5 → 2c0efe57, btime 19:54:12Z, xảy ra SAU kiểm cuối 19:47:27Z và TRƯỚC khi tạo cờ 19:57:15Z. Câu "0 reboot trong phiên đóng sổ" ở bản nháp §10.2 chỉ đúng tới 19:47:27Z — đã sửa thành câu chính xác có ranh giới. Mọi file đóng sổ đã kiểm lại còn đủ trên đĩa sau reboot: aggregate 44.975 B, GAP §69 đủ, closing file od-verified, count chạy lại khớp 9/11/11 + 296/643/552; cờ `.done` tạo 19:57:15Z trên boot mới).

### 9.5 Giờ đóng và cờ

- Cờ `round140-t10.done` tạo lúc **19:57Z** (mtime — kiểm lại sau khi tạo; giờ đóng trong header đã sửa theo mtime cờ này, bài học F-138-T10-4).
- Chốt chặn `round-in-progress.md` đã xóa khi đóng (mtime 17:36Z).

### 9.6 Khiếm khuyết lớn của đợt (ghi rõ trong verdict)

1. **Lượt yên #17 KHÔNG ĐO ĐƯỢC** (1 attempt partial 10/20 rồi bị reboot giết; boot mới gate A không mở trong 96 poll xanh — balloon đóng băng 6.443.824 kB; P1–P7 + P3' không kiểm được; cộng dồn đứng nguyên 13 lượt hợp lệ). Đây là đợt thứ ba liên tiếp balloon xả không bền (đợt 138: 0 attempt; đợt 139: đo được nhờ xả thoáng qua trước poll #1; đợt 140: 1 partial rồi kẹt).
2. **T8 0 lần chạy harness** (gate không mở; không mẫu mới cho điều tra kẹt; watchdog diag path mới vẫn chưa kích hoạt thật; chuỗi "P3 không kẹt" giữ 10, không tăng — 0 lần chạy ≠ 0 kẹt).
3. **Birefnet 0 lần thử** (đỉnh RAM chỉ 36,49% guard — thấp nhất từ đợt 135 theo T2; 0 mẫu ≥ 6.144 MiB ở mọi sampler; u2net là fallback chính thức).
4. **Headroom chỉ còn ~38–40 trên ngưỡng báo** (1.840 chuỗi / 1.838 cuối đợt; chưa chạm <1.800 nhưng có thể chạm ngay đợt 141).
- Cả bốn đều do điều kiện môi trường (balloon đóng băng + reboot giữa lượt), không phải do luồng nào không làm việc. Không có luồng nào bỏ việc giữa chừng; mọi luồng đều đóng đúng brief (T4/T8 tự đóng đúng hạn 19:30Z, không gia hạn).

## §10. T10 — kiểm đầu lúc đóng (19:47:08Z, kiểm lại 19:47:27Z)

### 10.1 Boot

- Boot lúc mở đợt: af558fb5, btime 15:54:37Z. Boot lúc T10 mở phiên: af558fb5 (17:38:36Z). Boot lúc đóng: **90392aa5, btime 17:52:56Z** (kiểm 19:39:19Z và 19:47:08Z).

### 10.2 Reboot

- **1 reboot giữa lượt (sự kiện #22):** af558fb5 → 90392aa5, btime 17:52:56Z. Xảy ra trong lúc T10 chờ cờ (giữa 17:50:17Z và 17:54:00Z theo poll cờ của T10). **0 reboot từ lúc T10 bắt đầu đóng sổ (19:39Z) tới kiểm cuối 19:47:27Z** (boot lúc bắt đầu đóng sổ và lúc kiểm cuối đều là 90392aa5).
- **1 reboot NỮA trong lúc đóng sổ — sự kiện #23 (F-140-T10-6):** 90392aa5 → **2c0efe57, btime 19:54:12Z** (epoch 1795031652; /proc/stat + uptime -s + who -b khớp; phát hiện 19:57:28Z). Xảy ra SAU kiểm cuối của T10 (19:47:27Z, boot vẫn 90392aa5) và TRƯỚC khi tạo cờ `.done` (19:57:15Z, trên boot mới). Reboot này xảy ra sau khi suite/O8 của T10 đã chạy xong (19:39:46–19:46:47Z, trên boot 90392aa5) nên không ảnh hưởng kết quả verify; mọi file đóng sổ đã kiểm lại còn đủ trên đĩa sau reboot (aggregate 44.975 B nguyên vẹn, GAP §69 đủ, closing file od-verified, count chạy lại 19:58Z khớp 9/11/11 + 296/643/552; chốt chặn vẫn đã xóa; cờ `.done` mtime 19:57:15Z). Đợt 141 sẽ mở trên boot 2c0efe57.
- Khung chết #97? (boot cũ af558fb5): các khung quan sát — T4/T5 (17:53:26Z, 17:54:22Z], T8 (17:53:26Z, 17:54:02Z]; btime 17:52:56Z sớm hơn mốc cuối boot cũ ~30 s (lệch đồng hồ). Khung chuẩn chờ T2-141 chứng nhận bằng merged mù #60.

### 10.3 Cây lúc đóng (md5 thực tế)

- preview.tsx **530e10a7** ✓, media.ts **2c384ed1** ✓, vite.config.ts **ee80d093** ✓, vcut-webkit-postboot-check.sh **5bd00bf7** ✓ (T5 sửa 2 lần cho boot mới, chỉ header + say). Lock script `vcut-vite-lock-v2.t10.sh` md5 **520b8baa** ✓ (= đợt 139).

### 10.4 Lock / process / /tmp/.X11-unix/

- Lock TRỐNG lúc đóng: 0 ticket + 90 cooldown (89 lúc T10-139 đóng + cooldown-t10-round140 mới = 90). Log vite-lock-v2.log: thô 1005 dòng / chính thức 999 dòng (loại 6 dòng repro T6-132). Đếm bằng cột $3: thô TICKET 306 / ACQUIRED 297 / RELEASED 291 / COOLDOWN 96 / TIMEOUT 8 / STALE-LOCK 6 / STALE-TICKET 1; chính thức TICKET 304 / ACQUIRED 295 / RELEASED 289 / COOLDOWN 96 / TIMEOUT 8 / STALE-LOCK 6 / STALE-TICKET 1. **ACQUIRED − RELEASED (chính thức) = 295 − 289 = 6** = 5 ca double-acquire đã biết + 1 t4 F-134-T6-2 — KHÔNG tăng. So với T10-139 đóng (thô 999 / chính thức 993): +6 dòng = 2 chu kỳ mới sạch (T4 attempt1 17:48:00Z + T10 O8 19:44:46Z hold 121 s).
- 0 process sót lúc đóng (19:47:08Z): 0 process Xvfb/vite/MiniBrowser/Chromium/WebKit.
- /tmp/.X11-unix/: TRƯỚC khi dọn có X193/X194/X195 (mtime 19:44Z — do chính suite verify + O8 của T10 tạo; 0 process sở hữu); SAU KHI DỌN (kiểm lần cuối 19:47:27Z): đã xóa tay; **TRỐNG (total 0)**.
- started_at lượt 140 (theo T7-140, kiểm lần 3 19:30Z): **ĐÃ BỊ VIẾT LẠI** 17:35:51Z → **17:53:45Z = btime + 49 s**, jitter +1.074 s — bằng chứng trực tiếp thứ tư; KHÔNG bị viết lại lần 2. Run 139 KHÔNG bị viết lại lần 2 tại cùng reboot (đã finished 17:04:27Z trước reboot).

## §11. Nợ mở chuyển đợt 141

- Lượt yên #17 đo lại (T4; trên boot 90392aa5 nếu còn sống, hoặc boot mới nếu reboot tiếp; ngân sách retry tối đa 2 lần khi lỗi setup còn nguyên — attempt1 partial do wedged, không tính vào ngân sách lỗi setup).
- Mù #60 mới mở (T2-141: probe #60 + chứng nhận gap #97?→#98? 7.099 s + khung chết #97? bằng merged mù #60).
- Balloon đóng băng 6.443.824 kB — đợt thứ ba liên tiếp xả không bền; điều kiện can thiệp host ĐÃ THỎA từ đợt 139 nhưng KHÔNG CÓ KÊNH can thiệp từ cell (quyết (d) đợt 139) — xem §12.1(e).
- Birefnet 0 lần thử (đỉnh chỉ 36,49% guard); u2net là fallback chính thức; giữ nguyên quy trình + guard 6.144 MiB theo quyết (e) đợt 139.
- Headroom 1.838–1.840, chỉ còn ~38–40 trên ngưỡng báo < ~1.800 — nếu đợt 141 chạm ngưỡng thì báo user lúc đó (xem §12.1(j)).
- Watchdog diag path mới chưa chứng minh bằng kẹt thật (chỉ smoke-test 10/10 + 6 lần chạy sạch đợt 139 + smoke-test 10/10 đợt 140).
- G1 khung (a) M2 VẪN HOÃN — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16 — quyết parent: để yên, không nhắc lại).
- ci-security.yml vẫn 403 chờ user; file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` vẫn chưa quyết số phận.
- TTS 39 cấm kiểm lại.

## §12. Chờ quyết parent

### 12.1 Câu hỏi mở

(a) Đóng đợt 140 **CHẤP NHẬN** (8/8 cờ) với 4 khiếm khuyết lớn ở §9.6?
(b) Lượt yên #17 — giữ nguyên kế hoạch đo lại ở đợt 141?
(c) **Khung chết #96?: ứng viên merged 21 s (15:54:16Z, 15:54:37Z] của T2-140 làm chuẩn mới**, hay giữ khung T9 35 s làm biên ngoài (khung T8 (15:54:42Z, 15:55:24Z] là cách dựng khác, không giao với khung merged)?
(d) Số hiệu boot **90392aa5 = #98?** + gap danh nghĩa #97?→#98? = 7.099 s (chưa chứng nhận — T2-141) + khung chết #97? (khung quan sát T4/T5 (17:53:26Z, 17:54:22Z] hay T8 (17:53:26Z, 17:54:02Z]) — chờ T2-141 chứng nhận bằng merged mù #60, hay parent chốt khung quan sát ngay?
(e) **Gate A / balloon:** đợt thứ ba liên tiếp balloon xả không bền (đợt 138: 0 attempt; đợt 139: đo được nhờ xả thoáng qua; đợt 140: 1 partial rồi kẹt). Quyết (d) đợt 139 đã ghi "không có kênh can thiệp host từ cell" — có kênh nào khác (nhờ user can thiệp host, hay đổi cách đo) hay vẫn tiếp tục chờ xả tự nhiên?
(f) Birefnet — giữ nguyên quy trình thử khi quan sát được ≥ 6.144 MiB hay đổi (đỉnh đợt này chỉ 36,49% guard)?
(g) Headroom — **T10 BÁO PARENT: 1.838–1.840, chỉ còn ~38–40 trên ngưỡng báo < ~1.800** (quyết (i) đợt 139: "nếu đợt 140 chạm <1.800 thì báo user lúc đó" — đợt 140 CHƯA chạm; có báo user ngay về đà giảm, hay chờ đợt 141 chạm ngưỡng mới báo?
(h) Attempt1 partial của T4 có đếm vào "số attempt đã dùng" cho ngân sách retry đợt sau không? (T4 đề xuất: mỗi đợt tính lại từ đầu; ngân sách 2 retry áp dụng trong một lượt poller.)
(i) TickCost median 69,0/73,0 ms của partial attempt1 — chỉ là quan sát, không dùng cho bất kỳ quyết định ngưỡng nào (parent có đồng ý?)
(j) Gap #96?→#97? [7.246, 7.266] s → CERT 58 / FULL 73 — xác nhận?

### 12.2 QUYẾT PARENT (main chat, 03:0x +07 19/11/2026 — đóng đợt 140)

- **(a) Đợt 140: CHẤP NHẬN (8/8 luồng = 9/9 cờ gồm T10; không có T3 riêng vì điều tra (c2) đã đóng, chỉ giám sát thụ động qua T4).** Suite 27/27 exit 0 (354 assertions); O8 Chromium 21/21 + WebKit 21/21 exit 0 (WebKit FULL PASS lần thứ mười tám liên tiếp); cây lúc đóng preview.tsx 530e10a7 (fix GIỮ VĨNH VIỄN, không revert); 2 reboot trong lượt (#22 giữa lượt giết attempt1 của T4; #23 trong lúc đóng sổ); lock khỏe; chốt chặn đã xóa khi đóng; cờ t10.done có. Đếm cuối dedup toàn cục 296/643/552 đã tái kiểm đúng (111–139 = 287/632/543 khớp số công bố đợt 139 — lần tái kiểm độc lập thứ hai mươi liên tiếp khớp; đợt 140 = 9 batch / 11 entry / 11 file). 4 khiếm khuyết lớn ghi nhận (§9.6): lượt yên #17 không đo được, T8 0 lần chạy harness, birefnet 0 lần thử, 2 reboot — đều do điều kiện môi trường (balloon kẹt + reboot), không phải do luồng nào không làm việc.
- **(b) Lượt yên #17: GIỮ NGUYÊN kế hoạch đo lại ở đợt 141, không đổi cách đo.** Gate A 0/96 poll ≥1024 MB nên không có attempt hợp lệ nào; không hạ ngưỡng. Ngân sách retry tối đa 2 lần khi lỗi setup còn nguyên (xem (h)).
- **(c) Khung chết #96?: XÁC NHẬN ứng viên merged (15:54:16Z, 15:54:37Z] (21 s) của T2-140 làm chuẩn mới.** Đây đúng là chứng nhận bằng merged mù #59 mà quyết (c) đợt 139 đã giao; khung merged hẹp hơn khung T9 (15:54:02Z, 15:54:37Z] (35 s) — giữ khung T9 làm biên ngoài. Khung T8 (15:54:42Z, 15:55:24Z] là cách dựng khác, không giao với khung merged — ghi làm phương án thay thế kèm dị thường đồng hồ F-139-T8-3.
- **(d) Số boot + khung chết #97?: boot 90392aa5 = #98? TẠM (quy ước); gap danh nghĩa #97?→#98? = 7.099 s chờ T2-141 chứng nhận; khung chết #97? HOÃN QUYẾT — giao T2-141 chứng nhận bằng merged mù #60.** Hai khung quan sát T4/T5 (17:53:26Z, 17:54:22Z] và T8 (17:53:26Z, 17:54:02Z] ghi cả hai kèm nguồn, không chốt khung quan sát ngay (theo luật đứng: không chọn một khi chưa có bằng chứng phân xử).
- **(e) Gate A / balloon: GIỮ NGUYÊN ngưỡng gate A ≥1024 MB, TIẾP TỤC CHỜ xả tự nhiên; KHÔNG nhờ user can thiệp host, KHÔNG đổi cách đo.** Đợt thứ ba liên tiếp balloon xả không bền (138: 0 attempt; 139: đo được nhờ xả thoáng qua; 140: 1 partial rồi kẹt) — nhưng (1) không có kênh can thiệp host nào từ cell (quyết (d) đợt 139), và user cũng không phải người vận hành host nên nhờ user can thiệp là nhờ việc họ không làm được; (2) đổi cách đo (hạ ngưỡng cho attempt ở RAM thấp) sẽ làm bẩn chuỗi phép đo lượt yên — 13 lượt hợp lệ đã đo được đều ở điều kiện gate A đạt, giữ chuỗi sạch quan trọng hơn đo cho có. Vòng lặp vẫn làm việc hữu ích khác (T2/T6/T7/T9 đều giao đủ đợt 140); cửa sổ xả thoáng qua vẫn mở thỉnh thoảng (đợt 139 đã đo được #16 nhờ vậy). Xem lại nếu kẹt kéo dài nhiều đợt nữa.
- **(f) Birefnet: GIỮ NGUYÊN quy trình + guard 6.144 MiB.** Đỉnh đợt này chỉ 36,49% guard — không có cửa sổ nào để thử, không phải lỗi quy trình. u2net vẫn là fallback chính thức.
- **(g) Headroom 1.838–1.840 (còn ~38–40 trên ngưỡng báo < ~1.800): VẪN CHỈ THEO DÕI, CHƯA báo user (quyết (i) đợt 139).** Đợt 140 CHƯA chạm ngưỡng — luật đứng kích hoạt khi <1.800. Nếu đợt 141 chạm ngưỡng thì báo cáo đợt 141 tới user sẽ nêu. Đà giảm ~106–127/đợt khiến chạm ngưỡng ở đợt 141 rất có thể, nhưng báo trước khi chạm là báo sớm hơn luật đã định; user cũng không có hành động nào với trần inotify từ phía mình.
- **(h) Attempt1 partial của T4: KHÔNG đếm vào ngân sách retry đợt sau — mỗi đợt tính lại từ đầu.** Ngân sách 2 retry áp dụng trong một lượt poller (khi lỗi setup). Attempt1 partial (wedged — lỗi trong lúc đo, không phải lỗi setup) không tiêu ngân sách nào của đợt 141.
- **(i) TickCost median 69,0/73,0 ms của partial attempt1: ĐỒNG Ý — chỉ là quan sát, KHÔNG dùng cho bất kỳ quyết định ngưỡng nào.** Attempt partial (kẹt, bị reboot #22 giết, RAM ~500 MB, gate A không đạt) — median của nó không thuộc chuỗi lượt yên hợp lệ; chuỗi lượt hợp lệ giữ nguyên, ngưỡng tickCost ≤60 ms không đổi.
- **(j) Gap #96?→#97? [7.246, 7.266] s → CERT 58 / FULL 73: XÁC NHẬN.** Đã có trong LIMITS T2-140; dải dự báo cho #98? theo FULL73 thuộc T2 (chủ quản).

_(Để trống — parent ghi quyết vào đây, theo quy tắc AGENTS.md: quyết parent ghi thành §12.3 mới khi aggregate đánh số kiểu này, hoặc §12.1 nếu aggregate đợt này đánh số kiểu đó. T10 KHÔNG tự bịa quyết parent.)_

## Batch stage / Tổng batch

- Đợt 140: **9 batch / 11 entry / 11 file duy nhất** (gồm closing; dedup toàn cục — xem §9.1).
- Lũy kế 111–140: **296 batch / 643 entry / 552 file duy nhất**.
- Tái kiểm 111–139: **287/632/543 khớp số công bố đợt 139 (lần thứ 20 liên tiếp)**; tái kiểm 111–138: 278/618/534 khớp.
- Batch stage đợt này: phase9-round140-t1-verify139.txt, -t2-eperm.txt, -t4-quiet17.txt, -t5-infra.txt, -t6-lockhealth.txt, -t7-scheduler.txt, -t8-viteharness.txt, -t9-headroom.txt, phase9-round140-closing.txt (aggregate + GAP).
- Oversize đợt này (push cần `ENABLE_PRIVSEP=0`): aggregate này, T2 61.973 B, T6 58.161 B, T5 52.065 B, T9 41.760 B.
- KHÔNG PUSH trong phiên này — chỉ stage, để đó; user tự push sau từ main chat khi nhắn "push đi".
