# Đợt 140 T8 — GATE NOT MET, 0 LẦN CHẠY HARNESS (reboot giữa lúc chờ + balloon đóng băng)

Ngày: 18/11/2026 (lượt cron 00:35 +07 19/11 = 17:35:51Z; T8 mở ~17:38Z, đóng 19:36Z trên boot mới `90392aa5`). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: chờ cờ + chạy harness 6/6 theo quy trình (gate MỞ thì chạy; gate KHÔNG MỞ thì ghi rõ + exit — brief đợt 140). **Gate KHÔNG MỞ trước hạn waiter 19:30Z nên T8 CHẠY 0 LẦN HARNESS.** Chuẩn bị đã làm xong (adapt script, symlink diag đợt mới, smoke-test 10/10, tree md5 không đổi). KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND139_T8_VITEHARNESS_LIMITS.md + aggregate đợt 139 §11/§12.2 (quyết parent (g) watchdog diag path ổn định — ĐÃ THỰC HIỆN đợt 139; quyết (h) poller T4 retry tối đa 2 lần khi lỗi setup — từ đợt 140).

## 0. Kết luận ngắn — GATE NOT MET, 0 lần chạy; 1 reboot giữa lúc chờ; balloon đóng băng đúng giá trị cũ

- **Gate KHÔNG MỞ:** waiter `WAIT-DEADLINE 19:30Z 18/11 poll=97 19:30:56Z — GATE NOT MET` (exit 3); vòng kiểm tay `WATCH-DEADLINE 19:30Z poll=97 19:30:58Z — GATE NOT MET` (exit 3). **Không gia hạn quá deadline** (đúng brief). T4 tự đóng 19:30Z với **0 attempt** trên boot mới ("HET HAN CHO 19:30Z — 0 attempt (gate A khong mo trong cua so cho)"). `round140-t4.done` KHÔNG tồn tại (kiểm lại 19:32:16Z vẫn không có).
- **1 reboot GIỮA LÚC CHỜ (F-140-T8-1):** boot `af558fb5` chết trong khoảng (17:53:26Z, 17:54:02Z]; boot mới `90392aa5`, btime 17:52:56Z — **sớm hơn mốc cuối boot cũ ~30 s** (cùng lớp F-138-T8-1 26 s / F-139-T8-3 5 s). Runtime restart giết waiter/watch/sleep-check của T8; T4 attempt1 bị giết giữa evaluate (HB129, im lặng 25/30 s); cờ POSTBOOT_PASS của T5 thành STALE. T8 khởi động lại waiter/watch 17:54:54/17:54:57Z trên boot mới, log cũ đã bảo toàn.
- **Balloon đóng băng đúng 6.443.824 kB (F-140-T8-3):** đúng giá trị đóng băng đợt 138/139, không đổi ~31 phút (18:25–18:56Z), chỉ nhúc nhích 2 lần rồi phồng lại đúng giá trị cũ; RAM phẳng ~500 MB. Gate A (≥1024 MB) không mở trên boot mới.
- **Hai nửa gate không bao giờ xanh cùng lúc trên boot mới (F-140-T8-2):** gate A đạt 1.058 MB ở poll #10 của T4 lúc 18:03:55Z nhưng gate0 còn đỏ (POSTBOOT_PASS mới chỉ có lúc 18:17:07Z); khi gate0 xanh thì RAM đã rơi về ~500 MB. Trên boot cũ gate ĐÃ MỞ 17:48:00Z (RAM 1.060 MB) và T4 attempt1 đã chạy — nhưng bị reboot giết.
- **Chuỗi "P3 không kẹt" GIỮ 10, KHÔNG tăng (F-140-T8-5):** 0 lần chạy ≠ 0 kẹt — không đếm, như đợt 138 (quyết parent (i) đợt 138). Watchdog diag path mới vẫn CHƯA được chứng minh bằng kẹt thật (chỉ smoke-test + 6 lần chạy sạch đợt 139).
- **Chuẩn bị xong, cây không đổi:** 5 script adapt 139→140 (`bash -n` OK ×5, `node --check` OK ×3); symlink ổn định trỏ lại sang diag đợt mới; smoke-test diag qua đường ổn định 10/10 lúc 17:40:29Z (dmesg EPERM + journalctl -k rỗng); preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093` giữ nguyên mở/cuối; 3 script harness md5 KHÔNG ĐỔI so với đợt 139.
- **Dọn sạch:** waiter/watch đã thoát (exit 3 theo thiết kế); 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium sót; `/tmp/.X11-unix/` trống; không `vite.lock`; fixture `/tmp` KHÔNG rebuild (gate không mở nên không rebuild — vẫn mất từ reboot đợt 139).
- **Stage đợt này: 1 file** — LIMITS này (3 script harness không đổi nên không stage lại). KHÔNG push.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 17:35:51 | Lượt cron 00:35 +07 mở đợt 140; `round-in-progress.md` tạo (9 luồng T1–T9 + T10; hạn cứng ~20:00Z); boot lúc mở `af558fb5` (btime 15:54:37Z 18/11) |
| 17:38–17:40 | T8 mở: RAM avail ~750–913 MB, Balloon ~5,88–6,05 GB; adapt 5 script 139→140; symlink `t8-diag-stall.sh` trỏ lại sang `round140-t8/diag-stall-140t8.sh`; `bash -n` OK ×5; `node --check` OK ×3; tree-md5-open (530e10a7 / 2c384ed1 / ee80d093; harness a92432a2 / 6e3ce0a0 / 847a818f) |
| 17:40:19 | T5 viết `POSTBOOT_PASS` boot `af558fb5` (pass_at 17:40:19Z) — postboot=1 từ poll 1 của waiter |
| 17:40:29 | Smoke-test diag QUA ĐƯỜNG ỔN ĐỊNH (label `smoke-test`, devUrl rỗng): 10/10 file vào `round140-t8/smoke/stall-smoke-test-1795023629/`; dmesg EPERM, journalctl -k rỗng |
| 17:41:05 | Waiter bắt đầu (deadline 19:30Z, epoch 1795030200); 17:41:21 watch bắt đầu (poll 60 s, bài học F-139-T8-1) |
| 17:41:12 | T4 poll #1 (RAM 942 MB, gate A chưa đủ); T4 poller deadline 19:30Z, poll 45 s |
| 17:48:00 | **T4 mở cửa yên poll #10 (gate0 PASS + gateA RAM 1.060 MB) — CHẠY attempt1 NGAY** (boot cũ) |
| 17:53:16–17:53:26 | T4 attempt1: evaluate `writePartial-blendTick` im lặng 15→20→25 s (HB129, timeout 30 s) — chưa kịp timeout thì reboot |
| (17:53:26, 17:54:02] | **REBOOT** — boot mới `90392aa5`, btime 17:52:56Z (F-140-T8-1); runtime restart giết waiter/watch/sleep-check của T8 |
| 17:54:54 / 17:54:57 | Waiter + watch KHỞI ĐỘNG LẠI trên boot mới (code đọc lại boot MỖI POLL); log cũ bảo toàn `*-boot-af558fb5.log` (14 dòng mỗi file: 1 start + 13 poll) |
| 17:55:54 | T5 viết `t5-wait-replay-boot90392aa5.sh`; đổi `POSTBOOT_PASS` cũ → `POSTBOOT_PASS.stale-af558fb5` (không còn cờ PASS nào — đúng, tránh nhầm boot) |
| 18:03:55 | T4 poll #10 boot mới: **RAM 1.058 MB (gate A đạt) nhưng gate0 đỏ** (`postboot_exit=1`) — nửa gate (F-140-T8-2) |
| 18:17:07 | T5 viết `POSTBOOT_PASS` boot mới (poll=22) — gate0 xanh; nhưng RAM lúc đó đã ~500 MB |
| ~18:25 | Balloon phồng lại đúng **6.443.824 kB**; RAM ~500 MB |
| 19:04:58 | Balloon nhúc nhích xuống 6.247.216 kB (watch poll 71, RAM 707 MB) — rồi phồng lại |
| 19:14:58 | Balloon về đúng 6.443.824 kB (watch poll 81, RAM 518 MB) |
| 19:29:47 | T4 poll #124 (RAM 519 MB); 19:30:00 T4 tự đóng — **0 attempt** |
| 19:30:56 / 19:30:58 | **Waiter WAIT-DEADLINE poll 97 exit 3 / watch WATCH-DEADLINE poll 97 exit 3 — GATE NOT MET** |
| 19:32:16 | T8 kiểm cuối: 0 process sót, `/tmp/.X11-unix/` trống, cây không đổi |
| 19:36:04 | LIMITS + stage file verify od + cờ `round140-t8.done` — **T8 đóng** |

## 2. Reboot giữa lúc chờ — kết quả còn nguyên, mốc mâu thuẫn ~30 s (F-140-T8-1)

- Reboot xảy ra trong khoảng (17:53:26Z, 17:54:02Z] theo quan sát trực tiếp của T8 (log T4 attempt1 còn sống lúc 17:53:26Z; boot mới đã hiện lúc kiểm 17:54:02Z). Đây là reboot đầu tiên của đợt 140 (trước đó boot `af558fb5` sống từ 15:54:37Z 18/11 qua hết đợt 139 + mở đợt 140).
- Boot mới `90392aa5`: btime 17:52:56Z (cả `/proc/stat` lẫn `uptime -s` — khớp nhau lần này), `/proc/1` 17:53:11Z (chênh btime 15 s, cùng lớp F-138-T8-6/F-139-T8-3).
- **Mâu thuẫn mốc ~30 s:** btime boot mới (17:52:56Z) sớm hơn mốc cuối boot cũ (17:53:26Z) khoảng 30 s — cùng lớp F-138-T8-1 (26 s) và F-139-T8-3 (5 s). T8 chỉ ghi lại, không tự kết luận khung chết; T2/T6 đối chiếu.
- Runtime restart giết cả 3 session nền của T8 (waiter poll 13 lúc 17:53:06Z, watch poll 13 lúc 17:53:21Z, sleep-check đang chạy) — T8 kiểm lại bằng tay, khởi động lại waiter/watch, không mất dữ liệu: log cũ còn nguyên (đã bảo toàn sang `*-boot-af558fb5.log` trước khi script truncate log lúc khởi động lại).
- Reboot giết T4 attempt1 giữa evaluate (xem §3) và làm cờ POSTBOOT_PASS của T5 thành STALE; T5 phải chờ replay xong trên boot mới (pass_at 18:17:07Z) mới viết lại cờ.
- Reboot xóa `/tmp` lần nữa — nhưng T8 chưa có gì trong `/tmp` đợt này (fixture chưa rebuild vì gate chưa mở; không Xvfb nào đang chạy), nên không mất dữ liệu T8.

## 3. Gate không mở — hai nửa gate lệch nhau + balloon đóng băng

- **Boot cũ `af558fb5` (17:41–17:53Z): gate ĐÃ MỞ.** T4 poll #1 17:41:12Z RAM 942 MB; poll #10 17:48:00Z gate0 PASS + gateA RAM 1.060 MB → attempt1 chạy ngay. Attempt1 chạy 17:48:00–17:53:26Z thì bị reboot giết (log cuối: `[HB129] pwEvalTimeout writePartial-blendTick elapsed=25s timeoutMs=30000` lúc 17:53:26Z). T4 đã phân tích partial attempt1 (7 file `analyze-t4-attempt1-*.txt`) — việc T4, T8 chỉ ghi nhận: lượt yên #17 có 1 attempt dở dang (không tính verdict hợp lệ).
- **Boot mới `90392aa5` (17:54–19:30Z): gate KHÔNG MỞ.** T5 replay xong, viết `POSTBOOT_PASS` 18:17:07Z (poll=22; T4 ghi `t5flag=PASS`, `postboot_exit=0` từ poll sau đó). T4 poll #10–#124 (18:03:55–19:29:47Z): RAM dao động 482–1.058 MB, chỉ 1 poll vượt gate A (poll #10, 1.058 MB lúc 18:03:55Z — khi gate0 còn đỏ). Sau 18:17Z RAM chỉ còn 479–818 MB, không poll nào ≥1.024 MB nữa.
- **Balloon đóng băng (mẫu watch 10 poll/lần, kB từ `/proc/meminfo`):**

| Watch poll | Thời điểm (Z) | RAM avail | Balloon (kB) |
|---|---|---|---|
| 1 | 17:54:57 | 1.570 MB | 5.219.912 |
| 11 | 18:04:57 | 958 MB | 5.983.632 |
| 21 | 18:14:57 | 506 MB | 6.443.824 |
| 31 | 18:24:57 | 521 MB | 6.443.824 |
| 41 | 18:34:57 | 566 MB | 6.406.152 |
| 51 | 18:44:58 | 486 MB | 6.443.824 |
| 61 | 18:54:58 | 615 MB | 6.443.824 |
| 71 | 19:04:58 | 707 MB | 6.247.216 |
| 81 | 19:14:58 | 518 MB | 6.443.824 |
| 91 | 19:24:58 | 540 MB | 6.443.824 |

- Balloon phồng từ ~5,22 GB (17:54Z) lên đúng 6.443.824 kB (~18:14Z) rồi đóng băng ở đúng giá trị này, chỉ nhúc nhích 2 lần (6.406.152 lúc 18:34:57Z; 6.247.216 lúc 19:04:58Z) rồi phồng lại đúng giá trị cũ. RAM phẳng ~500 MB suốt. Cùng mẫu đợt 138 (balloon đóng băng, gate A không mở cả đợt) — khác đợt 139 (balloon xả bền, gate mở sau 9 poll).
- T4 poller tự đóng 19:30Z với 0 attempt; T8 không chạy khi chưa có cờ T4, không gia hạn waiter quá 19:30Z (F-140-T8-6).

## 4. Trạng thái 4 bước kiểm đợt này — KHÔNG CÓ LẦN CHẠY NÀO ĐỂ KIỂM (ghi rõ từng bước)

| Bước | Cơ chế (đợt 137, giữ nguyên + đường ổn định đợt 139) | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `evalDiag137` trong 3 script, đường ổn định `t8-diag-stall.sh` (quyết (g)) | **0 lần chạy → 0 kích hoạt** (không có evaluate nào để canh) | Bằng chứng duy nhất đường mới hoạt động đợt này: smoke-test tay 17:40:29Z qua symlink, 10/10 file, đúng dir đợt 140. Đường mới vẫn CHƯA kích hoạt trong kẹt thật (F-140-T8-5) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-140t8.sh` (cột `balloon_kb`) | **Driver chưa chạy → không có `ram-140t8.log`** | Thay thế bằng mẫu watch 10 poll (§3, 10 mẫu avail/balloon) + log poll T4 (#10–#124) — ghi rõ đây KHÔNG phải sampler driver, chỉ là quan sát thay thế |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **0/3 pha** | N cộng dồn GIỮ NGUYÊN **N=2 mỗi pha** (đợt 137 N=1 + đợt 139 N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 + baseline lúc bắt đầu | Baseline từ smoke-test 17:40:29Z; chưa kích hoạt thật (0 lần timeout 124) | **dmesg EPERM tái xác nhận** (F-140-T8-4); journalctl -k rỗng; bước 4 vẫn chỉ thu được một nửa nếu có kẹt — đã chấp nhận theo quyết parent §12.3(h) đợt 137 |

## 5. Cây + md5 — mở / cuối đều khớp, 3 script harness KHÔNG ĐỔI

| File | md5 lúc mở 17:40Z | md5 lúc cuối 19:32Z | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không (fix GIỮ vĩnh viễn) |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `clicktest-84l10-webkit-loop-w1.mjs` | a92432a2 | a92432a2 | Không (31.359 B) |
| `clicktest-85m4-webkit-w7-hb128.mjs` | 6e3ce0a0 | 6e3ce0a0 | Không (35.805 B) |
| `clicktest-86n2-webkit-w7.mjs` | 847a818f | 847a818f | Không (37.903 B, vẫn oversize — xem §7.6) |

- Không sửa code app, không sửa script harness (diag path đã ổn định từ đợt 139) nên không có file production nào trong batch stage ngoài LIMITS này.
- Fixture: 6/6 md5 đợt 139 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549) — **đợt này KHÔNG rebuild** (gate không mở); các dir `/tmp/round76-d8`, `/tmp/round81-i7`, `/tmp/l10`, `/tmp/m4`, `/tmp/n2` đều không tồn tại lúc kiểm cuối.

## 6. Dọn dẹp + kiểm cuối — sạch (không có gì để dọn vì chưa chạy)

- Waiter + watch đã thoát đúng thiết kế (exit 3, GATE NOT MET); không process nào của T8 còn chạy.
- Kiểm cuối 19:32:16Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; `/tmp/.X11-unix/` trống; không có `/tmp/.X*-lock`; không có `vite.lock` trong repo; không lock `t8-round140` nào được giữ (chưa từng acquire).
- RAM sampler nền chưa từng chạy đợt này (driver chưa chạy); không process nào sống sót sau reboot (reboot đã xóa).
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **"0 lần chạy đợt 140" là đúng — nhưng đừng trích "0 kẹt" hay "harness pass".** Không có lần chạy nào thì không có mẫu kẹt/pass nào; chuỗi "P3 không kẹt" giữ 10, không tăng (F-140-T8-5).
2. **Watchdog diag path mới vẫn chưa chứng minh bằng kẹt thật.** Bằng chứng đợt này chỉ có smoke-test tay 10/10 qua symlink (17:40:29Z) — giống hệt tình trạng đợt 139, chỉ khác đợt này không có cả 6 lần chạy sạch.
3. **Bước 4 thiếu dmesg vĩnh viễn trong cell này** (F-140-T8-4): dmesg EPERM + journalctl -k rỗng — nếu đợt sau có kẹt, bằng chứng kernel vẫn thiếu dmesg (đã chấp nhận theo quyết parent).
4. **Balloon "nhúc nhích" 2 lần không phải xả bền:** 6.406.152 kB (18:34:57Z) và 6.247.216 kB (19:04:58Z) đều phồng lại đúng 6.443.824 kB sau đó — đừng trích thành "balloon bắt đầu xả".
5. **Gate A đạt 1.058 MB ở poll #10 T4 (18:03:55Z) không phải "suýt mở gate":** lúc đó gate0 còn đỏ; gate chỉ mở khi CẢ HAI nửa xanh cùng lúc — chưa từng xảy ra trên boot mới đợt này. Trên boot cũ gate đã mở nhưng attempt1 bị reboot giết (không tính).
6. **86n2 vẫn oversize 37.903 B (>37.768 B giới hạn push)** — không đổi đợt này; lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp.
7. **Attempt1 của T4 bị giết khi evaluate im lặng 25/30 s KHÔNG phải kẹt harness T8:** đó là probe lượt yên của T4, không phải script 84l10/85m4/86n2 của T8; không đếm vào điều tra kẹt T8 (§B). T4/T2 đối chiếu ý nghĩa của nó.
8. **T5 viết POSTBOOT_PASS boot mới lúc 18:17:07Z (poll=22) trong khi T4 ghi `dpkg_lines=795` không đổi** (so với 1.545 dòng replay boot cũ) — T8 chỉ ghi lại 2 con số từ 2 nguồn, không kết luận có mâu thuẫn hay không (tiêu chí pass của T5 là việc T5).

## 8. Sai số mới (F-140-T8-N)

- **F-140-T8-1 — reboot GIỮA LÚC CHỜ, btime mâu thuẫn ~30 s:** boot `af558fb5` chết trong (17:53:26Z, 17:54:02Z]; boot mới `90392aa5` btime 17:52:56Z — sớm hơn mốc cuối boot cũ (log T4 attempt1 còn sống 17:53:26Z) khoảng 30 s; `/proc/1` boot mới 17:53:11Z (chênh btime 15 s). Cùng lớp F-138-T8-1 (26 s) / F-139-T8-3 (5 s). Runtime restart giết waiter (poll 13 lúc 17:53:06Z), watch (poll 13 lúc 17:53:21Z) và sleep-check đang chạy; T8 khởi động lại waiter/watch 17:54:54/17:54:57Z, log cũ bảo toàn `*-boot-af558fb5.log`. T2/T6 đối chiếu khung chết.
- **F-140-T8-2 — hai nửa gate lệch nhau trên boot mới:** gate A đạt 1.058 MB ở poll #10 T4 (18:03:55Z) nhưng gate0 đỏ (`postboot_exit=1`, POSTBOOT_PASS chưa có); gate0 xanh lúc 18:17:07Z thì RAM đã ~500 MB và không poll nào ≥1.024 MB nữa. Không phải lỗi của waiter (waiter kiểm đúng cả hai cờ mỗi poll) — chỉ ghi lại để T4/T10 thấy cửa sổ lệch.
- **F-140-T8-3 — balloon đóng băng đúng 6.443.824 kB (giá trị đợt 138/139):** phồng lên đúng giá trị này ~18:14Z, không đổi ~31 phút (18:25–18:56Z, watch poll 21–61 + T4 poll), chỉ nhúc nhích 2 lần (6.406.152 lúc 18:34:57Z; 6.247.216 lúc 19:04:58Z) rồi phồng lại đúng giá trị cũ; RAM phẳng ~500 MB. Cùng mẫu đợt 138. Theo quyết parent (d) đợt 139: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — T8 chỉ chờ, không can thiệp.
- **F-140-T8-4 — dmesg EPERM tái xác nhận + journalctl -k rỗng (giới hạn môi trường, bước 4 chỉ nửa bằng chứng):** smoke-test diag qua đường ổn định 17:40:29Z (10/10 file) — `dmesg: read kernel buffer failed: Operation not permitted`; journalctl -k `-- No entries --`. Không thử lách (không can thiệp host). Giống hệt đợt 137/138/139.
- **F-140-T8-5 — 0 lần chạy: watchdog diag path mới vẫn CHƯA chứng minh bằng kẹt thật; chuỗi "P3 không kẹt" KHÔNG tăng:** watchdog 0 kích hoạt vì không có lần chạy nào (khác đợt 139 "0 kích hoạt vì không kẹt trong 6 lần chạy"). Chuỗi giữ **10** (đợt 137 = 9, đợt 139 = 10; đợt 138/140 = 0 lần chạy KHÔNG đếm theo quyết parent (i) đợt 138).
- **F-140-T8-6 — T8 không chạy khi chưa có cờ T4, không gia hạn waiter:** waiter deadline 19:30Z (epoch 1795030200, kiểm chứng > epoch lúc viết); waiter exit 3 lúc 19:30:56Z, watch exit 3 lúc 19:30:58Z; T4 cũng tự đóng 19:30Z với 0 attempt. Không có ngoại lệ nào được áp dụng.
- **F-140-T8-7 — fixture `/tmp` KHÔNG rebuild đợt này:** gate không mở nên không rebuild theo quy trình (rebuild chỉ sau gate); các dir fixture vẫn mất từ reboot sau đợt 139 + reboot đợt này. Đợt sau (nếu gate mở) rebuild lại như thường lệ. Driver `run-webkit-140t8.sh` + retry chưa từng chạy đợt này.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Điều tra chung ba lần kẹt (§B):** H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ — đứng nguyên, **không bằng chứng mới** (0 lần chạy). Đợt 140 là đợt "0 lần chạy" thứ hai (sau đợt 138), không đếm vào số đợt 0-kẹt khi cân nhắc đóng điều tra.
2. **Watchdog diag path mới:** vẫn chờ lần kẹt thật đầu tiên để kiểm chứng live — T8 đợt sau kiểm tra dump có rơi đúng dir đợt mới không (symlink hiện trỏ `round140-t8/diag-stall-140t8.sh` — đợt sau nhớ trỏ lại; nếu quên, dump sẽ rơi vào dir đợt 140).
3. **Balloon đóng băng 6.443.824 kB lần thứ ba (đợt 138, rồi 139 xả được, rồi 140 đóng băng lại):** mẫu "phồng lại đúng giá trị cũ sau reboot" lặp lại — T9/T10 theo dõi; quyết parent (d) đợt 139 (không có kênh can thiệp host, giữ gate A) vẫn đứng, không cần quyết mới trừ khi parent muốn đổi.
4. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (đợt này RAM max lúc chờ 1.808 MB lúc 17:54Z sau reboot, xa guard — không ai thử; u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

---

# PHẦN B — Điều tra chung ba lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 140 (0 lần chạy — KHÔNG ĐẾM, như đợt 138)

## B1. Trạng thái giả thuyết sau đợt 140

| Giả thuyết | Trạng thái đợt 139 | Trạng thái đợt 140 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | Không bằng chứng mới (0 lần chạy) |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ (đứng nguyên) | **KHÔNG ỦNG HỘ (đứng nguyên)** | Không bằng chứng mới (0 lần chạy, không có mẫu RAM trong lúc chạy harness) |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | Không bằng chứng mới (0 lần chạy) |

## B2. Trạng thái 4 bước kiểm (quyết parent đợt 136 §12.3(i)) — chi tiết đợt 140

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | ĐƯỜNG ỔN ĐỊNH `t8-diag-stall.sh` (quyết (g)); md5 3 script không đổi | 0 lần chạy → 0 kích hoạt | Chỉ smoke-test tay 17:40:29Z (10/10 file) chứng minh đường đi + cú pháp; chưa kích hoạt thật (F-140-T8-5) |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (chưa chạy) | Driver chưa chạy → không có `ram-140t8.log` | Thay thế: 10 mẫu watch (§3) + log poll T4 — balloon đóng băng 6.443.824 kB, RAM ~500 MB trong lúc chờ (không phải lúc chạy harness) |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (chưa chạy) | 0/3 pha | N cộng dồn GIỮ **N=2 mỗi pha** (đợt 137 N=1 + đợt 139 N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (diag script smoke-test OK qua đường ổn định 17:40:29Z) | Chưa kích hoạt thật (0 lần timeout 124) | **dmesg BỊ CHẶN (EPERM) tái xác nhận; journalctl -k rỗng** — bước 4 vẫn chỉ thu được một nửa nếu có kẹt |

## B3. Chữ ký kẹt của cả ba lần — không đổi từ đợt 136/137 (ghi lại để đối chiếu)

Xem docs/PHASE9_ROUND137_T8_VITEHARNESS_LIMITS.md §B3: cả ba đều là một lệnh `page.evaluate` không bao giờ trả kết quả, ngay sau một bước PASS, process idle (loadavg ~0,1), không verdict FAIL. Đợt 140 không thêm mẫu kẹt mới nào (0 lần chạy) — và không thêm mẫu chạy-pass nào.

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 140 KHÔNG TĂNG

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: **0 lần chạy** (không đếm — quyết parent (i)). Đợt 139: **6 lần chạy, 0 kẹt**. Đợt 140: **0 lần chạy** (không đếm — cùng quyết (i)).
- Chuỗi "P3 không kẹt" GIỮ **lần thứ mười** (đợt 137 = 9; đợt 139 = 10; đợt 138/140 = 0 lần chạy KHÔNG đếm).
- Ba lần kẹt đợt 134/135 vẫn KHÔNG tái hiện lần nào kể từ đợt 135/136.
- Hệ quả cho quyết parent đợt 137 §B6 ("nếu nhiều đợt nữa 0 kẹt thì cân nhắc đóng điều tra dạng 'không tái hiện được'"): đợt 140 **không đếm được** (là một đợt "0 lần chạy", khác đợt 139 "0 kẹt") — cần thêm các đợt chạy được nữa trước khi bàn đóng.

## B5. Yếu tố chung khác — cập nhật đợt 140

- Cùng boot? KHÔNG — 3 lần kẹt cũ ở 3 boot khác nhau (cc1f9de0, 8ae55060, 78b55838); đợt 137 chạy không kẹt trên boot thứ tư (17db9652); đợt 139 chạy không kẹt trên boot thứ sáu (541524e2); đợt 140 chạy 0 lần trên boot thứ tám (90392aa5 — boot thứ bảy af558fb5 có 1 attempt dở dang của T4, không phải harness T8).
- Vite server còn sống lúc kẹt? VẪN KHÔNG CÓ BẰNG CHỨNG — cơ chế kiểm đã sẵn sàng (watchdog probe vite-HTTP + diag script, giờ qua đường ổn định), chỉ chờ kẹt thật.
- Tải từ luồng song song khác trong cửa sổ chờ? Load1 trong lúc chờ 0,17–1,08 (watch/T4 poll); không có lần chạy harness nào nên không so sánh được với loadavg ~0,1 lúc kẹt cũ.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ. H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- Yếu tố chung duy nhất đã chứng minh: cả ba đều là `page.evaluate` chờ trạng thái media element không trả, ngay sau một bước PASS, process idle, không verdict FAIL.
- **4 bước kiểm GIỮ NGUYÊN cho đợt sau, không cần triển khai lại** (chỉ lưu ý: symlink `t8-diag-stall.sh` hiện trỏ `round140-t8/diag-stall-140t8.sh` — đợt sau trỏ lại sang diag script đợt mới; nếu quên trỏ lại, dump sẽ rơi vào dir đợt 140). Khi có kẹt thật, watchdog + bước 4 sẽ tự kích hoạt — không cần quyết mới.
- Đề xuất nhỏ cho đợt sau (không cần quyết parent — chẩn đoán-only, nhắc lại từ đợt 137): tăng N đối chứng Chromium lên 2 lần mỗi pha nếu thời gian cho phép (cộng dồn N=2 → N=4 sau 1 đợt chạy được nữa), để baseline Chromium dày hơn trước khi kết luận gì về H3.

## B7. Bằng chứng mới từ đợt 140 — KHÔNG CÓ mẫu chạy/kẹt mới (chỉ có quan sát môi trường)

- 0 lần chạy harness (WebKit 0 + Chromium 0), 0 WATCHDOG-137, 0 timeout 124 — vì không chạy, không phải vì chạy sạch.
- Balloon đóng băng 6.443.824 kB + RAM phẳng ~500 MB trong lúc chờ (10 mẫu watch §3 + poll T4 #10–#124) — cùng mẫu đợt 138; lần xả ngắn lúc 19:04:58Z (6.247.216 kB) đã đảo ngược hoàn toàn lúc 19:14:58Z.
- Reboot giữa lúc chờ (boot af558fb5 → 90392aa5, btime mới sớm hơn mốc cuối boot cũ ~30 s) + T4 attempt1 bị giết giữa evaluate im lặng 25/30 s — ghi lại cho T4/T2 đối chiếu; không đếm vào điều tra kẹt T8.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round140-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary): LIMITS này. 3 script harness md5 không đổi so với đợt 139 nên không stage lại. Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round140-t8/` (wait-t4-t5-140t8.sh — deadline gõ tay 19:30Z, KHÔNG fallback cờ cũ, có ghi chú khởi động lại sau reboot; run-webkit-140t8.sh — Balloon + Chromium + diag-khi-124, CHƯA CHẠY đợt này; run-webkit-140t8-retry84l10.sh — đã adapt, KHÔNG dùng; rebuild-fixtures-140t8.sh — CHƯA DÙNG (gate không mở); diag-stall-140t8.sh — smoke-test tay OK qua đường ổn định 17:40:29Z; watch-gate-140t8.sh — vòng kiểm tay 60 s (bài học F-139-T8-1); smoke/wait-t4-t5.log — WAIT-DEADLINE poll 97 19:30:56Z exit 3; smoke/watch-t8.log — WATCH-DEADLINE poll 97 19:30:58Z exit 3; smoke/wait-t4-t5-boot-af558fb5.log + smoke/watch-t8-boot-af558fb5.log — log waiter/watch boot cũ (14 dòng mỗi file, bảo toàn trước khi khởi động lại); smoke/stall-smoke-test-1795023629/ (smoke-test tay QUA ĐƯỜNG ỔN ĐỊNH — 10 file, dmesg EPERM + journalctl rỗng); smoke/tree-md5-open.txt — mở 530e10a7 (cây) + a92432a2/6e3ce0a0/847a818f (harness)). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round140-t8/diag-stall-140t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` hiện TRỐNG (mất từ reboot đợt 139 + reboot đợt này — đợt sau rebuild lại sau gate).
