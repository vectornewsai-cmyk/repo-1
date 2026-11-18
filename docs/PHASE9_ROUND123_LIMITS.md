# PHASE9 ROUND123 — LIMITS gộp (đợt 123, lượt cron 21:35 +07 16/11/2026)

> Đợt 123 đóng bởi T10 trong phiên (phase 1 xong 15:49:10Z → đóng trước hạn cứng 17:15Z).
> 9/9 luồng về (T9 về muộn 15:41:42Z; phase 1 kích hoạt tự động 9/9 lúc 15:43:21Z).
> KHÔNG push, KHÔNG release/tag, KHÔNG code giả.

## 0. Kiểm chứng gộp — T10 verify độc lập

- **Suite cây gộp: 27/27 exit 0** (tsc-web 0, tsc-desktop 0, vite build 0 + 24 test; chạy 15:43:22–15:47:08Z, boot #67, RAMavail 507 MB; log `round123-t10-suites.log`).
- **O8: Chromium 21/21 pass, 0 fail, 0 note, exit 0 (15:48:17Z); WebKit 21/21 pass, 0 fail, 0 note, exit 0 (15:49:08Z)** — WebKit FULL PASS (khác đợt 122 exit=2 do hạ tầng): postboot PASS cho boot #67 đã có (FOUND-FRESH-BOOT, cờ POSTBOOT_PASS của T5 chứa đúng boot_id `94e29be5…`); log `t10-o8.log`.
- **Recount (sau closing batch): đợt 123 = 10 batch / 15 entry / 15 file duy nhất; lũy kế đợt 111–123 = 127 batch / 397 entry / 362 file duy nhất + 1 oversize 6,4 MB** (`benchmarks/results/webkit-blob-flaky-96x3.json`, vẫn chưa lên từ trước — không nằm trong batch nào). Trước closing: 9 batch / 13 entry / 13 unique; lũy kế 126 / 395 / 361 (log `recount-push123.log`). File oversize trong batch đợt này (lúc push cần ENABLE_PRIVSEP=0): LIMITS gộp này 39.166 B, `PHASE9_ROUND123_T7_EPERM_LIMITS.md` 52.282 B, `f2_startup_probe_123t4.mjs` 85.927 B.
- **Cờ done 9/9** (giờ Z 16/11): T1 14:55:41, T2 15:10:23, T3 14:55:08, T4 15:11:36, T5 15:09:58, T6 14:45:17, T7 14:59:30, T8 14:59:18, T9 15:41:42. Poller kích hoạt phase 1 tự động khi 9/9 (poll #11, 15:43:21Z, driver pid 16185) — không cần kích hoạt tay.
- **Cây KHÔNG đổi trong đợt:** preview.tsx `03bf029f09b8890b285eacc10a02172b` (baseline cả đợt; H3f đã gỡ đợt 122, không apply lại) và media.ts `2c384ed13703809d5e999311147745e7` — md5 TRƯỚC = SAU phase 1. Lock v2 `cd0c05c1` không đổi. HEAD không đổi (repo-1 không phải git checkout — quản lý qua push-files; md5 là kiểm chứng cây).
- **Verify headline từng luồng (T10 đọc LIMITS + dữ liệu thô + kiểm mẫu):** T1/T2 tailSteadyClosed=0 kiểm trực tiếp trong probe-results.json của cả hai lượt, khớp verdict VOID; sổ cái E4BATCH ghi lô 3/10 (§1–§2); T3 quét v2 có script + sessions-all.txt 264 dòng trên đĩa (§3); T4 6 run VALID khớp bảng run (seekImmMs 522/316/271/336/375/394 trong file JSON gốc, md5 `bbee7107…` khớp LIMITS; check-valid 6/6 trong t4-analysis.txt) (§4); T5 POSTBOOT_PASS chứa đúng boot_id boot #67 `94e29be5…` (§5); T6 lock TRỐNG lúc phase 1 (0 ticket + 47 cooldown) và 48 sau phase 1 — giải trình đầy đủ bằng 3 lần acquire của T1/T2/T4 + 1 lần suite của T10 (§6); T7 probe #42 ok=2 fail=0 kiểm trực tiếp trong once.txt (heartbeat n=42, 14:44:29Z, boot 9bbda390); CERT n=35→37 / FULL n=50→52 khớp §2.5 LIMITS T7 (§7); T8 mirror 25/25 — T10 tự đối chiếu md5 25/25 file với `round122-t8/edit-log.json`, khớp hết; file 57n9 có khối mirror `watch: { ignored: ["**/**"] }` (§8); T9 đúng 30 poll gate A trong poll-t9.log, RAM 499 MB ở poll cuối (§9). Không phát hiện headline nào sai số liệu.
- **Giới hạn của verify T10 (ghi rõ, không giấu):** số velTicks (428/447) và drift recount chi tiết của T1/T2 lấy theo analyzer của luồng (T2 đã đối chiếu chéo lượt 3 của T1 bằng analyze-t2.py); số headroom 4447→2830→4533 của T5 lấy theo LIMITS T5 (T10 chỉ kiểm POSTBOOT_PASS); số quét WFS lần 29 của T7 (821 dòng / 231 file, chênh 0) lấy theo LIMITS T7; số kiểm kê 201/201 harness của T8 lấy theo LIMITS T8 (T10 chỉ kiểm mẫu 57n9 + 25/25 md5).

## 1. T1 — E4 chạy bù lượt 3 trên cây BASELINE (A, gop250) (quyết parent đợt 122 §12.1): VOID (đếm được), lô → 2/10

- **Kết quả: lượt 3 att3 VOID (đếm được) — lượt đếm ĐẦU TIÊN trên cây baseline.** Probe chạy 14:50:14–14:50:48Z, **exit=0** (34 s). Pause-seek tới t=5: confirmed=true (tElement 781 ms, tCanvas 897 ms). Số đo thật (probe-results.json trong `hidden_files/round123-t1/probe-webkit-load0-gop250-e4a3/`): velTicks=428, sampler=133, renderTicks=74, raf=135, rvfc=0, pageErrs=0. **tailSteadyClosed = 0 → VOID** (prereg §4). Drift recount sau seek ban đầu: vượt >0,35 = **0 lần**; max 0,1475, min −0,0667; resyncsV chỉ đổi ở tick 5 (seek ban đầu); tailBursts cuối 0; 10 tick cuối drift toàn 0.
- **Tính hợp lệ:** cây baseline md5 `03bf029f` trước=sau (media.ts `2c384ed1`); boot #66 (`9bbda390…`) không đổi trong lượt; lock v2 cổng 5590: wait 0 s, hold 35 s, RELEASED 14:50:49Z. Postboot PASS sau 4 phút chờ cờ T5 (14:46:13→14:50:13Z): replay boot #66 cài thật, KHÔNG repair — apt-get update pid 813 chạy 14:35–~14:45Z (xong, không kẹt), installs 14:45:33–14:48:19Z, dpkg.log 2→1509 dòng, gói cuối gstreamer1.0-tools 14:48:19Z (boot +23m36); postboot FAIL 14:45:27Z → PASS 14:48:41Z.
- **Reboot SAU lượt (không ảnh hưởng verdict):** boot đổi sang `94e29be5…` lúc 14:52:19Z (gap 27'36") — SAU khi driver kết thúc (14:51:04Z). T1 viết LIMITS + cờ `round123-t1.done` lúc 14:54–14:55Z (sau reboot).
- **Ghi chú:** transient tick 3 drift 4,5 xảy ra TRƯỚC seek ban đầu, không tính vào recount (cùng mẫu lượt 3 att3 đợt 122). Pause-seek chậm hơn lượt 2 (781/897 ms vs 157/207 ms trên H3f) — vẫn confirmed, chưa giải thích. VOID này không chứng minh E4 vắng mặt tuyệt đối — chỉ chứng minh trong 1 lượt A gop250 trên baseline, 428 tick, không quan sát được steady-close nào. Không gộp với lượt 2 (VOID trên H3f).
- LIMITS: `docs/PHASE9_ROUND123_T1_E4BATCH_R3_LIMITS.md` (5.988 B). Batch stage: `phase9-round123-t1-e4batch-r3.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round123-t1/`. Cờ `round123-t1.done` đã tạo (14:55:41Z).

## 2. T2 — E4 chạy bù lượt 4 trên cây BASELINE (B, gop30) sau khi T1 xong: VOID (đếm được), lô → 3/10

- **Kết quả: lượt 4 att5 VOID (đếm được).** Probe chạy 15:00:28–15:01:03Z, **exit=0** (35 s). Pause-seek tới t=5: confirmed=true (tElement 563 ms, tCanvas 672 ms). Số đo thật (probe-results.json trong `hidden_files/round123-t2/probe-webkit-load0-gop30-e4b4/`): velTicks=447, sampler=131, renderTicks=79, raf=121, rvfc=0, pageErrs=0. **tailSteadyClosed = 0 → VOID.** Drift recount sau seek ban đầu: vượt >0,35 = **0 lần**; max 0,1102, min −0,0334; resyncsV chỉ đổi ở tick 3 (seek ban đầu); tailBursts cuối 7 (chỉ số thô, không đổi verdict).
- **Lô E4BATCH: 3/10** (0 CAUGHT, 3 VOID — lượt 2 B gop30 cây H3f; lượt 3 att3 A gop250 cây baseline; lượt 4 att5 B gop30 cây baseline). Lượt không đếm: 7. **Cặp A+B trên cây baseline đều VOID — H1/H3 vẫn chưa có cặp CAUGHT-RESEEK.** Lượt tiếp theo: lượt 5 (A, gop250, phase `e4a5`) ở đợt sau, trên cây baseline.
- **att4: KILLED-REBOOT (không đếm).** Driver att4 (PID 5363) khởi động 14:43:43Z trên boot #66, md5 live khớp baseline ngay từ đầu; đang ở giai đoạn 0 chờ cờ `round123-t1.done` thì **reboot ~14:52:19Z giết driver giữa lúc chờ** (log cuối 14:43:44Z, không marker kết thúc). Không chạy probe, không lấy lock, không có probe-results.json cho att4. Chạy lại là att5 trên boot #67 (đồng hồ chờ chạy lại từ đầu; prereg phụ lục §6).
- **Luật đứng MỚI — cờ postboot phải khớp boot hiện tại (STALE).** Sau reboot #66→#67, file POSTBOOT_PASS của boot #66 (PASS 14:48:41Z) vẫn nằm trong `round123-t5/`. Driver cũ chỉ kiểm tra file TỒN TẠI → sẽ chấp nhận ngay và đo mù trên boot #67 chưa xác minh. T2 đã vá `t5_status()` trong run-t2.sh TRƯỚC khi khởi động lại att5: cờ chỉ PASS khi chứa đúng boot_id hiện tại; cờ boot cũ → STALE (ghi log, tiếp tục chờ, KHÔNG đo mù). Kiểm chứng sống: driver att5 log 14:56:27Z "cờ T5 là của BOOT CŨ đã chết — KHÔNG chấp nhận"; tới 15:00:27Z mới chấp nhận cờ PASS MỚI cho boot #67 (14:59:19Z, PASS NHỜ REPLAY, không repair). T5 cũng tự đánh dấu PASS cũ là SUPERSEDED. T4 đã áp dụng cùng luật cho gatewaiter của mình (§4).
- **Tính hợp lệ att5:** cây baseline md5 `03bf029f` trước=sau (preview.tsx mtime 12:02:56Z không đổi); boot #67 (`94e29be5…`) không đổi trong lượt; lock v2 cổng 5581: wait 0 s, hold 36 s, RELEASED 15:01:03Z. Không reboot, không DEFER.
- LIMITS: `docs/PHASE9_ROUND123_T2_E4BATCH_R4_LIMITS.md` (9.515 B). Batch stage: `phase9-round123-t2-e4batch-r4.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round123-t2/` (prereg + driver + analyzer + probe-results.json). Sổ cái `hidden_files/round118-t9/e4batch-ledger.md` đã thêm hàng lượt 4 att4 + att5. Cờ `round123-t2.done` đã tạo (15:10:23Z).

## 3. T3 — Mù #39 đoạn J: ĐIỀU TRA SÂU (lần 3) — VẪN MỞ, HẾT GÓC MỚI TRÊN VM

- **Kết quả: VẪN MỞ — lần kiểm tra sâu thứ ba liên tiếp (T4-121, T7-122, T3-123) đều cho 0 bằng chứng mới.** Đợt này thử **10 góc chưa từng thử**: mtime tươi phạm vi rộng hơn, **birth time, atime, ctime, directory-mtime, .git, system log, lịch sử chạy cron của scheduler, đối chiếu mù đã đóng** — tất cả đều 0 trong đuôi J.
- **Quét v2 (đã sửa lỗi script v1): 605.910 file** — mtime trong đuôi J: **0**; atime trong đuôi: **0**; ctime trong đuôi: **0**; birth trong đuôi: **0**; thư mục có mtime trong đuôi: **0**; session chạm đuôi: **0/264** (T7 đếm 218, nay 264); session bắc qua cắt J-hi (08:06:40Z): **0**.
- **Lịch sử chạy cron của scheduler (nguồn MỚI, chưa luồng nào kiểm):** có 2 lượt chạy rơi vào đuôi J — feed-pulse-14 lúc **07:41:54Z** và heartbeat lúc **08:20:50Z** — nhưng cả hai đều là **skip phía scheduler, không để lại dấu vết nào trên VM** (chứng minh bằng control: feed-pulse-15 lúc 08:41:54Z cũng không để lại session nào; session duy nhất sinh phút đó là waiter T10 đợt 121). **Không dùng được để đóng J.** Hai lượt chạy bị thiếu trong đuôi (heartbeat 14:50:50+07, deterministic-doctor 15:00+07) cũng **không dùng được làm bằng chứng reboot ẩn** — cùng mẫu thiếu lượt xảy ra trên boot khỏe đã biết (09:50:50+07 trong boot #59, 17:50:50+07 trong boot #63).
- **repo-1 KHÔNG có .git** — khảo cổ git (log/reflog/fsck) là không thể, không phải chưa thử. **System log của boot #61 đã mất hoàn toàn** (journal/wtmp/dpkg chỉ còn boot hiện tại) — cùng lý do reboot #16 không chốt được giờ.
- **Đối chiếu mù đã đóng:** #34 B đóng nhờ poller cadence 300 s sống xuyên đoạn + session bắc qua cắt + số học sàn; #34 C / #40 C đóng nhờ đo uptime trực tiếp tại probe. Đoạn J thiếu đúng thành phần đó — **không có observer sống nào trong đuôi** — và đợt này chứng minh không còn kênh timestamp nào trên VM chưa quét mà observer đó có thể để lại dấu.
- **Kết luận + khuyến nghị (T3 §5 mục 1): ĐỂ MỞ như mù #35/#37, KHÔNG giao kiểm lại J từ trong VM nữa** — 3 lần điều tra sâu với phạm vi mở rộng dần đều cho 0; con đường duy nhất còn lại là bằng chứng NGOÀI VM do parent cung cấp (ví dụ output `uptime -s` của chính parent trong phiên main-chat ~07:3x–08:2xZ 16/11). Chờ quyết parent (§12 mục 2).
- Clock VM hiện tại CHÍNH XÁC so với UTC thật (HTTP `Date` 3 server khớp `date -u` trong 1–3 s) → **F_now ≈ 0**.
- LIMITS: `docs/PHASE9_ROUND123_T3_BLIND39J_LIMITS.md` (21.647 B). Batch stage: `phase9-round123-t3-blind39j.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round123-t3/` (blind39J-t3.py/v2 + log + sessions-all.txt). Cờ `round123-t3.done` đã tạo (14:55:08Z).

## 4. T4 — Bar F2 leg B chạy lại trên cây BASELINE theo DEF PSI v0.1: 6/6 VALID, bar F2 ĐẠT trên bộ này; verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG (chờ quyết parent)

- **Kết quả: CHẠY ĐƯỢC — 6/6 attempt, 6/6 VALID, cả hai pha bar F2 đều ĐẠT trên bộ 6 run này.** Driver 14:59:38–15:05:55Z trên boot #67, exit 0. T_startup (trộn): 0,656 / 0,295 / 0,265 / 0,312 / 0,367 / 0,362 s — **median 0,337 s, p90 0,656 s, 0 run chậm (>1,2 s)** → pha (a) **ĐẠT** (median ≤1,0 s và p90 ≤1,2 s, n=6). T_seek: 0 / 0 / 0 / 0 / 0 / 0,001 s — **max 0,001 s, median 0,0 s** → pha (b) **ĐẠT** (mọi run ≤100 ms, median ≤50 ms). **Chế độ chậm KHÔNG tái hiện:** 0/6 run >1,2 s trên boot này + cây baseline, ở band Yên (avg60 trong run 4,38–13,14%).
- **Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG.** Luật lật verdict (i) đòi ≥6 run nhanh trên CÙNG MỘT boot + CÙNG cây với bộ verdict (cây H3f). Bộ này đo trên cây baseline — là loạt đo MỚI theo định nghĩa PSI, KHÔNG gộp với số H3f, KHÔNG lật verdict. **Cần quyết parent:** (a) giữ verdict KHÔNG ĐẠT và coi bộ baseline này chỉ là dữ liệu hiệu chỉnh DEF; hoặc (b) xét lại verdict theo luật (ii) (quyết lại ngưỡng/định nghĩa pha (a)); hoặc (c) ra lệnh leg mới trên cây H3f (apply lại patch từ `h3f.patch` còn giữ) để xét luật (i). T4 không đề xuất hướng nào — chỉ ghi rõ cả ba cửa đều đang mở (§12 mục 1).
- **DEF v0.2 có dữ liệu đầu tiên:** PSI avg60 thực tế lúc browser chạy ở band Yên 4,38–13,14% (bracket 3,98–15,51%) — ngưỡng Yên <30% ĐẠT ĐƯỢC, **đề xuất v0.2: GIỮ ngưỡng Yên <30%**; tickRate bão hòa ~70–73 tick/s trong toàn band Yên, r(avg60, tickRate) = −0,13 — **tickRate giữ vai trò chỉ báo đói, KHÔNG dùng để tách mức tải trong một band**. Tương quan +0,90 của T2-120 KHÔNG tái hiện trong band Yên hẹp này. load1 lại nói ngược/không đơn điệu so với PSI (thêm bằng chứng load1 vô hiệu).
- **Hai boot của đợt — gate ĐẠT cả hai, leg chỉ chạy trên boot thứ hai.** Boot #66: gate 0 ĐẠT poll #3 (14:50:01Z) nhưng driver bị reboot giết ở dial #2 (0 run). Boot #67: replay nhanh (configure +40s, dpkg 2→1509 dòng, gói cuối gstreamer1.0-tools 14:55:31Z, boot +3m12) → T5 POSTBOOT_PASS 14:59:19Z (boot +7m00, PASS NHỜ REPLAY, không repair); gate 0 ĐẠT poll #3 (14:59:32Z); leg chạy xong 15:05:55Z. Cây không đổi trong lúc đo.
- **2 lỗi đã sửa TRƯỚC khi đo lại (phụ lục A prereg, 14:55Z):** (§5.1) hàm `psi_avg60()` mẫu grep sai — không bao giờ khớp vì dòng `some` trong `/proc/pressure/cpu` là `some avg10=... avg60=...`; đã sửa thành `grep -o 'avg60=[0-9.]*'` (test sau sửa đọc được 11,74%). (§5.2) gatewaiter cũ chỉ kiểm tra sự tồn tại của POSTBOOT_PASS — sau reboot, cờ PASS của boot #66 vẫn nằm trên đĩa và gate cho boot mới sẽ PASS SAI; đã sửa: cờ T5 chỉ tính khi file chứa `boot_id` khớp boot HIỆN TẠI (cùng luật STALE của T2 §2). **Độ lệch nhỏ so với prereg §7 (ghi rõ):** driver KHÔNG chạy smoke run riêng — instrumentation đã được kiểm chứng bằng validate analyzer trên dữ liệu đợt 121 + `node --check` runner + test `bracket-t4.py` + chính run 1 cho thấy sampler ghi đủ số.
- **So sánh tham khảo (KHÔNG kết luận nhân quả):** median T_startup baseline đợt này 0,337 s so với median bộ 8 run H3f của T7-121 ~0,484 s — khác boot, khác tải, khác thời điểm nên KHÔNG được đọc là "baseline nhanh hơn H3f".
- LIMITS: `docs/PHASE9_ROUND123_T4_LEGB_LIMITS.md` (17.667 B). Batch stage: `phase9-round123-t4-legb.txt` (**3 entry**: LIMITS + `benchmarks/render/f2_startup_probe_123t4.mjs` 85.927 B — **>37.768 B, cần `ENABLE_PRIVSEP=0` khi push** + `benchmarks/render/f2_startup_analyze_123t4.py`), đã verify read-back, 0 binary. Dữ liệu thô (KHÔNG stage): `benchmarks/results/webkit-blob-flaky-123t4-f2startup-legb.json` (140.896 B, md5 `bbee71076670685f84c7e7dd93af48bd`, 6 case) + `hidden_files/round123-t4/` (prereg + phụ lục A + gate-wait 2 boot + 6 run log + pull/gst log). Cờ `round123-t4.done` đã tạo (15:11:36Z).

## 5. T5 — Hạ tầng: hai boot trong một lượt — #66? PASS rồi CHẾT sau 27p36; #67? replay NHANH NHẤT NHÌ (PASS +7m00) — luật repair dạng (C) đánh giá lần đầu: KHÔNG kích hoạt (cả 2 replay đều tiến triển)

- **Replay boot #65? KHÔNG tự hoàn thành** (kiểm từ bằng chứng trên đĩa): tiến triển tới 14:01:09Z rồi DỪNG, không PASS (postboot GẦN ĐẠT — chỉ thiếu libav + 2 gói apt: gstreamer1.0-plugins-bad, gstreamer1.0-libav), rồi reboot 14:24:43Z cắt đứt mọi cơ hội. Số "kẹt ở 599 dòng từ ~13:27Z" của T4 đợt 122 là đọc giữa chừng đã cũ; chi tiết att3 có timestamp (cài pocketsphinx 13:55:10Z, gstreamer1.0-tools 14:01:09Z) mới là chuẩn.
- **Boot #66? (TẠM): PASS rồi CHẾT.** btime 14:24:43Z, boot_id `9bbda390-bd64-4679-a1ff-3619899cee7d`, sau #65? 1h31m18s. Replay chạy tốt: configure +10m56, update xong ~14:45Z, installs 14:45:33–14:48:19Z, dpkg 2 → 1509 dòng, postboot PASS exit 0 lúc 14:48:41Z (boot +23m58). NHƯNG boot CHẾT 14:52:19Z — chỉ sống 27p36. PASS đó đã đánh dấu SUPERSEDED; các luồng đo KHÔNG được dùng nó (luật STALE §2 T2). Watcher b66 (7 poll) + phiên exec của T5 chết theo reboot.
- **Boot #67? (TẠM): replay NHANH, PASS +7m00 — boot ĐANG SỐNG.** btime 14:52:19Z, boot_id `94e29be5-a52c-4840-9ca9-4e896482e4a2`, sau #66? 27m36s. Replay khởi động NHANH (configure +40s), installs xong 14:55:31Z (boot +3m12), dpkg 2 → 1509 dòng, postboot PASS exit 0 lúc 14:59:19Z (boot +7m00), xác nhận lại exit 0 ở poll 10 (15:04:46Z) + cuối (15:06:05Z). Cờ `POSTBOOT_PASS` hiện tại trong `round123-t5/` là cho boot này. Đây là lần đầu tiên trong đợt 123 các luồng đo có boot PASS thật để chạy.
- **Luật repair dạng (C) — ĐÁNH GIÁ LẦN ĐẦU (hiệu lực từ đợt này): KHÔNG KÍCH HOẠT trên cả 2 boot.** Cả 2 replay đều TIẾN TRIỂN (điều kiện (b) không bao giờ đạt). Không có kill nào được cân nhắc, không có `--repair` nào chạy. Luật vẫn CHƯA ĐƯỢC THỬ trong đúng kịch bản mục tiêu của nó (replay kẹt thật) — giữ hiệu lực.
- **Headroom inotify: 4447 (#66? lúc mở) → 2830 (#67? lúc mở) → 4533 (#67? cuối).** Số 2830 lúc mở #67? là thấp nhất kể từ #63?, nhưng HỒI lên 4533 khi replay xong — số đo lúc mở boot bị đè tạm thời (replay + luồng khác khởi động), không phải suy giảm bền vững. Vite thường (~1586 watch) chạy được trên cả 2 boot. **Lưu ý:** T8 đo trực tiếp headroom thật chỉ ~2.830 watch (xem §8) — số đếm /proc (~63.733 "trống") không phải headroom dùng được.
- **Cập nhật `postboot-check.sh` 2 lần trong lượt** (md5 `a10b43ea…` → `24578b48…` (#66?) → `f684bb6b…` (#67?)): chỉ đổi tham chiếu boot — xem LIMITS T5 §6 để biết chi tiết thay đổi.
- LIMITS: `docs/PHASE9_ROUND123_T5_INFRA_LIMITS.md` (35.878 B). Batch stage: `phase9-round123-t5-infra.txt` (2 entry: LIMITS + `apps/web/scripts/vcut-webkit-postboot-check.sh`), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round123-t5/` (watcher b66/b67 + POSTBOOT_FAIL/PASS + headroom log). Cờ `round123-t5.done` đã tạo (15:09:58Z).

## 6. T6 — Sức khỏe lock v2 sau boot mới + housekeeping: KHỎE

- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới, 0 zombie, 0 tiến trình vite/node/webkit sót, 0 cổng lắng nghe (2 snapshot 14:41Z + 14:44Z). Log 476 dòng lúc 14:44Z: +24 dòng = TICKET +8 / ACQUIRED +8 / RELEASED +8 / COOLDOWN +0 / TIMEOUT +0 / STALE-LOCK +0 / STALE-TICKET +0 — khớp từng con số, không có event nào mất dấu. Ghép cặp 137/137 (theo LIMITS T6). 0 sự kiện "KHÔNG NHẢ"/"BỎ QUA" mới.
- **Cooldown tích lũy: 44 file / 616 byte lúc 14:44Z (CHỈ ĐO, KHÔNG prune).** T10 thấy lock TRỐNG lúc phase 1 (15:43Z, 0 ticket + **47** cooldown) và **48** sau phase 1 — giải trình đầy đủ: 44 + 3 (T1/T2/T4 mỗi luồng acquire lock 1 lần trong đợt) = 47; +1 (suite của T10 trong phase 1) = 48. **Đính chính đợt 122:** T6 đợt 122 ghi 42 file/588 byte lúc 11:40Z, T10 thấy 44 lúc 13:42Z — chênh +2, trong đó +1 là suite T10 chạy nhầm lúc false-trigger 11:40Z; 1 còn lại vẫn chưa rõ nguồn (không có lần acquire nào khác được ghi trong cửa sổ đó) — T6 đợt 124 kiểm tiếp nếu chênh tái hiện.
- Suite /tmp 9/9 PASS (theo LIMITS T6 — lần thứ 5 liên tiếp) + repro A/B/C giống hệt đợt 120/121/122; script v2 cd0c05c1, v1 fd21193c, suite 1c0d7eaa — không đổi.
- **Số hiệu boot:** T6 ghi tạm **#66** cho boot 14:24:54Z (boot_id `9bbda390…`) — sau #65 (12:53:25Z). T6 KHÔNG tự xác minh số hiệu (thuộc T5, mù #37); `journalctl --list-boots` và wtmp chỉ còn giữ boot hiện tại — không có lịch sử boot độc lập trên máy này. Boot mới 14:52:19Z (sau khi T6 kết thúc) chờ T5/T6 đợt sau xác nhận số hiệu (dự kiến #67).
- LIMITS: `docs/PHASE9_ROUND123_T6_LOCKHEALTH_LIMITS.md` (20.849 B). Batch stage: `phase9-round123-t6-lockhealth.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round123-t6/`. Cờ `round123-t6.done` đã tạo (14:45:17Z — sớm nhất đợt).

## 7. T7 — EPERM probe #42 + mù #41 ĐÓNG HOÀN TOÀN + gap #64→#65 CHỨNG NHẬN DẠNG KHOẢNG + gap #65→#66 CHỨNG NHẬN ĐIỂM + gap #63→#64 VẪN SPAN (mù #40 B kiểm lại VẪN MỞ) + mù #39 J (T3-123: VẪN MỞ, đề nghị ĐỂ MỞ)

- **Probe #42: ok=2 fail=0**, 14:44:29Z, boot 9bbda390, exit 0. Checklist P8 §2.3 chạy ĐÚNG 1 lần: status DEAD/STALE (heartbeat age 10.684 s, last #40 08:40:45Z, boot 9788ce28, exit 1 — theo LIMITS T7; T10 kiểm trực tiếp once.txt: `probe#42 boot=9bbda390 ok=2 fail=0`, heartbeat n=42, ts 14:44:29Z, boot 9bbda390, age 0s) → once probe #42 → status ALIVE (age 0 s, n=42), exit 0. Log v2 tăng đúng 3 dòng (theo LIMITS T7 — T10 chưa đối chiếu trực tiếp file heartbeat v2). Clock VM hiện tại CHÍNH XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u` trong 0–1 s) → F_now ≈ 0.
- **Mù #41: 11:38:49Z → 14:44:29Z (3h05'40") — ĐÓNG HOÀN TOÀN (mới, lượt này).** Đoạn A **ĐÓNG**; đoạn B **ĐÓNG**; đoạn C **ĐÓNG** (uptime trực tiếp lúc probe #42 + dấu boot tươi sibling đợt 123). **2 reboot đã chốt trong mù (#65 12:53:25Z, #66 14:24:43Z — cả hai đều có giây chính xác trên đĩa) + 0 ẩn danh nghĩa.**
- **Gap #64→#65 = KHOẢNG [1h48'17", 1h50'17"] ([6.497, 6.617] s, mid 1h49'17" = 6.557 s) ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG (mới).** Điều kiện: đoạn A mù #41 đã đóng. Dạng khoảng vì bước nhảy clock tại #65 đã CHỨNG MINH (X ∈ [6, 120] s — hai nhân chứng độc lập, xem §2.2 LIMITS T7).
- **Gap #65→#66 = 1h31'18" (5.478 s) ĐƯỢC CHỨNG NHẬN DẠNG ĐIỂM (mới).** Điều kiện: đoạn B mù #41 đã đóng. Dạng điểm vì bước nhảy clock tại #66 KHÔNG xảy ra (bằng chứng: session birth 14:37:26Z mtime 14:37:27Z theo đồng hồ mới, 1 s sau btime #66 — xem §2.5 LIMITS T7).
- **Gap #63→#64 = 2h12'13" (7.933 s) VẪN CHỈ LÀ SPAN — KHÔNG vào FULL/CERT** (đoạn B mù #40 kiểm lại VẪN MỞ — xem dưới).
- **CERT n=35 → n=37; FULL n=50 → n=52** (cùng với 2 gap mới từ mù #41). Dải chứng nhận không đổi (theo LIMITS T7 §2.5).
- **Gap #66→#67 danh nghĩa 27'36" (1.656 s) thuộc mù #42** (probe #42 → probe #43), để luồng EPERM đợt 124 chứng nhận. Reboot #67 phát hiện 14:54:32Z (T3 verify stage) — boot_id `94e29be5…`, btime 14:52:19Z.
- **Mù #40 B: KIỂM LẠI — VẪN MỞ.** Không có bằng chứng mới (xem §2.6 LIMITS T7).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" (mẫu hoa O) trong 171 file *.log có mtime trong mù #41 (0 file repo-1, 171 file hidden_files). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7) — **~122h41'** trước probe #42. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 29: 821 dòng / 231 file** (phạm vi 2.973 file); R7b đối chiếu 846 dòng; copies 25 dòng / 17 file; đối chiếu chéo 821+25=846=R7b, **chênh 0 — lần thứ hai mươi chín liên tiếp**. +9 dòng / +3 file so với lần 28, giải thích đúng hết bằng diff (theo LIMITS T7 §2.7).
- RAM: max biết được trong mù #41 **2.787 MB** (T3, 11:44:49Z, đoạn B) = 46% ngưỡng guard; đoạn A max 2.614 MB (theo LIMITS T7 — T10 chưa đối chiếu trực tiếp file ram-max.txt). Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong gói. Reboot #16 VẪN MỞ; cron riêng 10 phút vẫn chờ user quyết; R9 (a) vẫn chờ user.
- LIMITS: `docs/PHASE9_ROUND123_T7_EPERM_LIMITS.md` (52.282 B — OVERSIZE > 37.768, lúc push cần ENABLE_PRIVSEP=0). Batch stage: `phase9-round123-t7-eperm.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round123-t7/` (prereg viết trước khi đo). Cờ `round123-t7.done` đã tạo (14:59:30Z).

## 8. T8 — Vite harness: kiểm mirror L8 sau boot mới + phủ nốt 4 file chỉ tiêu thụ config khác + kiểm kê lại toàn repo — 201/201 đã phủ mirror

- **Mirror L8 đợt 122 còn nguyên vẹn: 25/25 file khớp md5_after** trong `round122-t8/edit-log.json`, 0 file đổi sau reboot — T10 tự đối chiếu md5 25/25, khớp hết. `vite.config.ts` md5 `ee80d093…`, `media.ts` md5 `2c384ed1…`, `preview.tsx` md5 `03bf029f…` — cả ba khớp đúng số đợt 122.
- **Phủ nốt 4 file chỉ tiêu thụ config khác:** `measure-65r8-perf-overlay.mjs` và `probe-82j3-sample-load.mjs` **thừa hưởng mirror từ harness viết config** (đã mirror từ trước — xác minh bằng template + config đã sinh + import-check, không cần sửa); `clicktest-68v2-stab-toggle-headed.mjs` **mirror tay file config ngoài repo** `hidden_files/round68-v2/vite.config.cjs` (1 dòng, `hmr: false` → thêm `watch.ignored`; md5 `cf0c0194…` → `1596c6ec…`, require-verify OK) — **không stage được vì ngoài repo** (chỉ có hiệu lực trên VM này; sửa bền vững — để harness 68v2 tự ghi config như 57n9 — là việc đợt sau); `clicktest-57n9-timeline-core-ops.mjs` **thêm khối tự ghi config mirror** (mẫu đợt 122, +8/−1 dòng; md5 `4d6d309d…` → `4a2694a7…`, `node --check` PASS, import-check config OK) — lần đầu tiên 57n9 tự tạo lại được config của nó sau reboot (T10 kiểm mẫu: file có khối mirror `watch: { ignored: ["**/**"] }`).
- **Smoke sweep mẫu 13 config: 13/13 PASS** (vite lên, HTTP 200, **0 inotify watch**, 0 ENOSPC) — gồm cả 5 file `.cjs` (PASS ngay lượt 1 với driver thử `localhost` trước, không lặp lại lỗi driver đợt 122) và 2 harness viết config (65r8-presented, 77e1-deint-fps).
- **Kiểm kê lại toàn repo: 201 harness vite dev — 201/201 đã phủ mirror** (198 tự ghi config mirror trong source + 2 thừa hưởng + 1 config ngoài repo đã mirror tay). Thêm 2 harness mới từ đợt 121/122 (`probe121t8-h3fext-ab.mjs`, `probe122t3-h3f-ab.mjs`) đều sinh ra đã có mirror. 35 file không chạy vite dev không đổi.
- **Đính chính quan trọng về headroom (§2 LIMITS T8):** số đếm `/proc` (~63.733 "trống") **không phải headroom dùng được**. Probe trực tiếp của T5 trên cả 2 boot của lượt này chỉ thêm được **2.830 watch trước khi ENOSPC**. Vite config mặc định giữ ~1.617 watch nên thực tế chỉ chạy được **1 vite mặc định tại một thời điểm**; 2 vite mặc định song song sẽ ENOSPC. Mirror (0 watch) vì vậy là **điều kiện để chạy được, không chỉ phòng ngừa** — nâng mức kết luận của đợt 122 (đợt 122 gọi mirror là "phòng ngừa" vì trên boot #64 ENOSPC không tái hiện).
- **Giải thích khả dĩ (chưa chứng minh, T5/T6 theo dõi):** có một tiến trình giữ một fd inotify với ~60.000 watch mà fdinfo của nó không đọc được (T8 gặp `PermissionError` khi đọc `/proc/14123/fdinfo` trên boot #66?; tiến trình đó đã chết theo reboot). Đếm `/proc` vì vậy thiếu sót — **đừng trích 63.733 làm headroom dùng được nữa**.
- **`/tmp` bị xóa ở reboot 14:52:19Z** (clip `r3-auto-proxy-test.mp4` + mọi config `/tmp/round*/` đã tạo trước đó đều mất) — các harness tự ghi config đã chứng minh ghi lại được trong smoke; file trên đĩa bền (`/home/hatch`) không ảnh hưởng.
- LIMITS: `docs/PHASE9_ROUND123_T8_VITEHARNESS_LIMITS.md` (23.210 B). Batch stage: `phase9-round123-t8-viteharness.txt` (**2 entry**: LIMITS + `apps/web/scripts/clicktest-57n9-timeline-core-ops.mjs`), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round123-t8/` (inventory + backup + smoke sweep). Cờ `round123-t8.done` đã tạo (14:59:18Z).

## 9. T9 — WebKit lượt yên theo dõi lần 5: KHÔNG CHẠY ĐƯỢC (gate A không mở — RAM host bị ghim ~480 MB, 3 attempt) — ngưỡng GIỮ

- **Kết quả chính — 0 LƯỢT YÊN ĐỢT NÀY (GATE A KHÔNG MỞ, 3 ATTEMPT).**
  1. **Gate 0 boot #66 KHÔNG BAO GIỜ ĐẠT — 4 poll** (b66 #1–#4, 14:45–14:51Z): T5 POSTBOOT_PASS đã có ở poll #4 (14:48:41Z, đủ 11/11 gói, GST thật) + check-only riêng PASS, nhưng wrapper closing pass còn chạy (apt_procs=1 theo đếm grep) → (0c) không đạt. Reboot 14:52:19Z cắt trước poll #5.
  2. **Gate 0 boot #67 ĐẠT (~15:00Z)** — nhưng chỉ khi phán (0c) bằng `pgrep -x` (phụ lục 2 prereg): đếm apt bằng grep-ps của gate0-wait b67 là DƯƠNG TÍNH GIẢ — nó khớp chính cmdline của các phiên kiểm của T9 (chứa chuỗi "apt-get"/"dpkg"). Bằng chứng thật: `pgrep -x apt-get` = 0, `pgrep -x dpkg` = 0; watcher T5 apt=no, wrapper=no; dpkg.log đóng băng 1509 dòng từ 14:55:31Z; T5 POSTBOOT_PASS cho #67 (kiểm 14:59:19Z, đủ 11/11, GST thật 269 file). run-t9.sh (gate 0 vốn dùng pgrep -x) PASS ngay lần thử 1 ở cả 3 attempt.
  3. **Gate A KHÔNG MỞ ở cả 3 attempt (30 poll, 15:05–15:36Z)** — T10 kiểm trực tiếp: đúng 30 poll gate A trong poll-t9.log; mọi điều kiện khác đều xanh mọi poll (load1/load5 <2 sau poll đầu attempt1, lock TRỐNG, blockers 0, cây md5 đúng) — CHỈ RAM chặn: attempt1 1056→474 MB, attempt2 576→474 MB, attempt3 447→499 MB. RAM host bị ghim ~474–576 MB suốt 30+ phút dù máy gần như yên hoàn toàn (load1 0,10–0,75 ở attempt3). T9 DỪNG sau attempt3 theo prereg — KHÔNG hạ ngưỡng RAM, KHÔNG đo "cho có".
  4. **Ngưỡng WebKit ≤60 ms: GIỮ (không đổi).** Không có lượt yên mới nên không áp dụng quy tắc quyết định prereg §1 — 3 lượt yên hợp lệ trước đó vẫn đứng (S5 49,5 / T4-118 40,0 / T3-121 52,0). **Nợ lượt yên theo dõi lần 5 CHUYỂN TIẾP sang đợt 124.**
- T9 xác nhận: cây baseline 03bf029f (patch H3f đã gỡ); tsc apps/web exit 0 trên cây cuối. Probe ĐÃ SỬA đợt 121 dùng nguyên, KHÔNG sửa (md5 `dccb8f4c…` khớp). Dry-run analyzer PASS (S5 49,5/75,0; A8 40,0/64,7). T9 không sửa production.
- LIMITS: `docs/PHASE9_ROUND123_T9_WEBKIT60MS_LIMITS.md` (24.234 B). Batch stage: `phase9-round123-t9-webkit.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round123-t9/` (prereg + phụ lục 1/2 + gate-wait 2 boot + 3 attempt). Cờ `round123-t9.done` đã tạo (15:41:42Z — muộn nhất đợt, sau 3 attempt gate A).

## 10. Nợ mở — chuyển đợt 124

1. **E4 lô 3/10 (0 CAUGHT, 3 VOID) — lượt 5 (A, gop250, phase `e4a5`) ở đợt sau, trên cây baseline.** H1/H3 cần cặp A+B CAUGHT-RESEEK trên CÙNG cây — chưa có (cặp A+B baseline hiện đều VOID). Luật STALE (cờ postboot phải khớp boot_id hiện tại) là luật đứng từ đợt này — prereg E4 đợt sau ghi rõ cây đo + thư mục cờ hạ tầng đợt hiện tại.
2. **Verdict F2 chờ quyết parent (§12 mục 1):** ba cửa (a) giữ verdict KHÔNG ĐẠT + coi bộ baseline là dữ liệu hiệu chỉnh DEF; (b) xét lại verdict theo luật (ii); (c) leg mới trên cây H3f. DEF v0.2 chờ dữ liệu leg tải (Vừa/Nặng) mới hiệu chỉnh tiếp ngưỡng Yên/tickRate; ngưỡng v0.1 giữ nguyên tạm thời.
3. **WebKit lượt yên #5: chưa chạy được** (gate A không mở — RAM host bị ghim ~474–576 MB, 3 attempt); ngưỡng ≤60 ms GIỮ; nợ chuyển đợt 124. Chưa rõ tiến trình nào ghim RAM — T9 đợt 124 có thể điều tra nguyên nhân ghim trước khi chạy attempt (xem §12 mục 4).
4. **Luật repair dạng (C): đánh giá lần đầu KHÔNG kích hoạt** (cả 2 replay đều tiến triển); luật vẫn CHƯA ĐƯỢC THỬ trong đúng kịch bản mục tiêu (replay kẹt thật) — giữ hiệu lực cho đợt sau.
5. **Mù #39 J: T3 đề nghị ĐỂ MỞ** (không kiểm lại từ trong VM nữa; chỉ còn bằng chứng ngoài VM do parent cung cấp) — chờ quyết parent (§12 mục 2).
6. **EPERM (§7):** mù #40 B vẫn mở (kiểm lại không có bằng chứng mới); gap #63→#64 vẫn SPAN 2h12'13" chưa chứng nhận; CERT n=37, FULL n=52; gap #66→#67 danh nghĩa 27'36" thuộc mù #42, chờ probe #43 đợt 124. Reboot #16 VẪN MỞ; cron riêng 10 phút vẫn chờ user quyết.
7. **Vite harness (§8):** 201/201 harness vite dev đã phủ mirror; headroom thật chỉ ~2.830 watch (1 vite mặc định tại một thời điểm). Sửa bền vững cho 68v2 (để harness tự ghi config như 57n9) là việc đợt sau — config ngoài repo hiện chỉ có hiệu lực trên VM này.
8. **Nợ đứng chưa có quyết user:** G1 deinterlace (khung (a) M2 HOÃN); mù #22/#28–#31/#35; birefnet (chỉ thử lại khi RAM đổi — RAM max trong mù #41 là 2.787 MB, 46% guard; u2net là fallback chính thức); ci-security.yml 403 (chờ user); TTS 39 cấm kiểm lại; R9 (a) VẪN CHỜ user (nhắc lần 9).

## 11. Ghi chú vận hành

- **Bài học T10 đợt 119/120/121/122 đã áp dụng:** phase 2 chạy NGAY trong cùng phiên driver (phase 1 xong 15:49:10Z → đóng trước hạn cứng 17:15Z); LIMITS gộp KHUNG viết ngay sau suite+O8+recount (do phase-1 driver viết tự động); recount chờ 9/9 (kích hoạt 15:43:21Z lúc 9/9, recount sau khi đủ 9/9).
- **Poller đợt 123 VIẾT MỚI từ đầu (không adapt poller đợt 122): CHỈ kích hoạt phase 1 khi 9/9, không có trigger theo giờ (bài học false-trigger đợt 122). Đã đọc lại code poller trước khi chạy, xác nhận không còn số/giờ cũ nào (bash -n OK, scan stale CLEAN). KHÔNG false-trigger đợt này** — poll #1 14:46:02Z đúng 1/9; trigger 9/9 lúc 15:43:21Z (poll #11). Không cần kích hoạt tay.
- **Reboot #67? (14:52:19Z, boot 94e29be5, gap #66→#67 27'36"):** giết poller sau poll #2 (14:51:02Z, 1/9) + phiên sleep chờ của T10 + driver T2 att4 + gate-wait T4/T9. T10 chạy lại poller 14:53:21Z (ghi RESTART; poll #1 mới 1/9). T1 + T6 về trước reboot (cờ 14:55:41Z/14:45:17Z — viết sau reboot nhưng công việc xong trước) — gộp từ đĩa. T2 chạy lại att5; T4/T9 khởi động lại gate-wait trên boot mới theo tiền lệ; T5 tự chạy lại watcher cho boot mới và viết cờ PASS mới. Đợt mở trên boot #66, đo rải trên #66/#67, đóng trên boot #67.
- **WebKit O8 exit=0 (21/21) lần đầu sau nhiều đợt exit=2** — nhờ boot #67 postboot PASS thật (FOUND-FRESH-BOOT). Chromium 21/21 exit 0 trên cùng boot.
- **Đính chính batch T9 (T10 sửa trước recount cuối, 16:03Z):** file `paths-loop/phase9-round123-t9-webkit.txt` ban đầu chứa đường dẫn TUYỆT ĐỐI `/home/hatch/workspace/repo-1/docs/PHASE9_ROUND123_T9_WEBKIT60MS_LIMITS.md` (sai định dạng batch — push-files cần đường dẫn tương đối; recount cũng đếm sai unique). T10 đã viết lại đường dẫn tương đối `docs/PHASE9_ROUND123_T9_WEBKIT60MS_LIMITS.md`, verify read-back. Chỉ 1 batch lỗi; 8 batch còn lại đã quét sạch đường dẫn tuyệt đối.
- **Cooldown lock:** 44 file/616 byte (T6 14:44Z) → 47 (phase 1, 15:43Z) → 48 (sau phase 1) — giải trình đầy đủ: +3 (T1/T2/T4 mỗi luồng acquire 1 lần) +1 (suite của T10).
- **Chốt chặn `round-in-progress.md` ĐÃ TẠO lúc mở đợt 123 (lượt cron 21:35 +07 16/11); T10 xóa khi đóng đợt** (sau closing batch + LIMITS gộp này).
- **Cờ `round123-t10.done` ĐÃ TẠO khi đóng đợt** (bài học đợt 121: T10 đợt trước thiếu cờ này).

## 12. Quyết parent (main chat, 23:1x +07 16/11/2026 — đóng đợt 123)

1. **Verdict F2: chọn cửa (a) — GIỮ verdict KHÔNG ĐẠT, coi bộ
   baseline là dữ liệu hiệu chỉnh DEF.** Bộ leg B đợt này (6/6
   VALID, cả hai pha ĐẠT, median T_startup 0,337 s, 0 run chậm)
   đo trên cây baseline — là loạt đo MỚI theo định nghĩa PSI,
   KHÔNG gộp với số H3f, KHÔNG lật verdict theo luật (i). Cửa (c)
   (leg mới trên cây H3f để xét luật (i)) KHÔNG chọn: luật (i)
   đòi ≥6 run nhanh trên CÙNG boot + CÙNG cây với bộ verdict, mà
   các boot của bộ verdict (27c8b1d9, 80a940d7) đã không còn — luật
   (i) giờ KHÔNG THỂ KIỂM được cho verdict này; apply lại patch
   đã gỡ chỉ để đo trên một boot mới cũng không thỏa luật (i).
   Cửa (b) (xét lại ngưỡng/định nghĩa pha (a)) KHÔNG chọn: định
   nghĩa hai pha làm đúng việc nó được thiết kế (báo chế độ chậm
   riêng, verdict KHÔNG ĐẠT — chế độ chậm); không có bằng chứng
   định nghĩa sai, chỉ có bằng chứng chế độ chậm hiếm/tạm thời
   (không tái hiện trong 14 run liên tiếp sau đó: 8 run trên boot
   #63 cây H3f + 6 run trên boot #67 cây baseline). Verdict KHÔNG
   ĐẠT đợt 120 đứng như verdict lịch sử của bộ đo đó. Chế độ chậm
   vẫn là hiện tượng mở cần theo dõi: nếu tái hiện trong một leg
   sau này thì câu hỏi verdict mở lại. **DEF v0.2: PHÊ DUYỆT
   hướng hiệu chỉnh — GIỮ ngưỡng Yên <30%** (PSI avg60 lúc chạy
   browser ở band Yên 4,38–13,14% — ngưỡng đạt được); **tickRate
   giữ vai trò chỉ báo đói, KHÔNG dùng để tách mức tải trong một
   band** (bão hòa ~70–73 tick/s trong toàn band Yên,
   r(avg60, tickRate) = −0,13; tương quan +0,90 của T2-120 không
   tái hiện trong band Yên hẹp). Ngưỡng v0.1 giữ nguyên tạm thời
   cho tới khi có dữ liệu leg tải band Vừa/Nặng.
2. **Mù #39 J: CHẤP NHẬN đề nghị ĐỂ MỞ.** Ba lần điều tra sâu
   liên tiếp (T4-121, T7-122, T3-123) với phạm vi mở rộng dần đều
   cho 0 bằng chứng mới; đợt này quét v2 605.910 file qua mọi kênh
   timestamp (mtime/atime/ctime/birth/directory-mtime) + 264
   session + lịch sử cron scheduler — tất cả 0 trong đuôi J; đoạn
   J thiếu đúng thành phần mà các mù đã đóng có (observer sống
   trong đoạn). **KHÔNG giao kiểm lại J từ trong VM nữa** — con
   đường duy nhất còn lại là bằng chứng NGOÀI VM do parent cung
   cấp (ví dụ output `uptime -s` của chính parent trong phiên
   main-chat ~07:3x–08:2xZ 16/11; parent không có output đó trong
   tay lúc này). J để mở như mù #35/#37; nếu bằng chứng ngoài VM
   xuất hiện thì mở lại.
3. **WebKit lượt yên #5 — RAM host bị ghim: PHÊ DUYỆT điều tra
   CÓ GIỚI HẠN ở đợt 124.** T9 đợt 124 điều tra nguyên nhân ghim
   TRƯỚC khi chạy attempt (những gì nhìn được từ trong cell:
   /proc/meminfo, tiến trình top, giới hạn cgroup, bộ nhớ dùng
   chung), **giới hạn 30 phút đầu lượt**; nếu tiến trình ghim
   không nhìn được từ trong VM thì ghi "không điều tra được từ
   trong VM" và dừng điều tra (không đốt cả lượt). Ghi chú kèm:
   gate-0 waiter đếm apt bằng grep-ps cho DƯƠNG TÍNH GIẢ (khớp
   chính cmdline các phiên kiểm của T9) — **luật đứng: đếm tiến
   trình apt bằng `pgrep -x`, không dùng grep-ps** (run-t9.sh đã
   dùng pgrep -x và PASS ngay lần thử 1 ở cả 3 attempt). Ngưỡng
   ≤60 ms GIỮ; nợ lượt yên #5 chuyển đợt 124.
4. **E4 lượt 5 (A, gop250, phase e4a5) đợt 124 trên cây baseline:
   PHÊ DUYỆT.** Lô hiện 3/10 (0 CAUGHT, 3 VOID — lượt 2 VOID trên
   cây H3f + lượt 3, 4 VOID trên baseline). Luật STALE (cờ postboot
   phải khớp boot_id hiện tại) là luật đứng từ đợt này.
5. **G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã hỏi
   13:44 16/11, chưa trả lời). Không thay đổi so với quyết đợt 120
   §12.2 / đợt 121 §12.5 / đợt 122 §12.5.
6. **R9 (a): VẪN CHỜ user** (nhắc lần 9). Không thay đổi.
7. **Đóng đợt 9/9 sau reboot #67: CHẤP NHẬN.** Suite 27/27,
   O8 Chromium 21/21 + WebKit 21/21 (WebKit FULL PASS lần đầu sau
   nhiều đợt); T9 về muộn 15:41:42Z nhưng phase 1 kích hoạt tự
   động lúc 9/9 (15:43:21Z) — không cần kích hoạt tay. Luật repair
   dạng (C) đánh giá lần đầu KHÔNG kích hoạt (cả 2 replay đều
   tiến triển) — luật vẫn CHƯA ĐƯỢC THỬ trong đúng kịch bản mục
   tiêu, giữ hiệu lực cho đợt sau.
