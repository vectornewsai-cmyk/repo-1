# Đợt 137 T8 — Vite harness WebKit 3/3 + đối chứng Chromium 3/3, 0 retry — 4 BƯỚC KIỂM ĐÃ PHÊ DUYỆT: watchdog + Balloon + Chromium + dmesg/journalctl

Ngày: 18/11/2026 (lượt cron 15:35 +07 = 08:35Z; T8 mở 08:40Z, chạy harness 09:58:43–10:14:20Z, kiểm cuối ~10:18Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (A) chờ cờ + chạy harness + LIMITS này; (B) TRIỂN KHAI 4 bước kiểm điều tra chung ba lần kẹt "treo không trả mẫu" đã được parent PHÊ DUYỆT ở đợt 136 §12.3(i) — CHẨN ĐOÁN-ONLY, KHÔNG đổi production, KHÔNG sửa app (chỉ thêm watchdog chẩn đoán vào 3 script harness + cột Balloon vào RAM sampler). KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND136_T8_VITEHARNESS_LIMITS.md (§B + §B6: 4 bước kiểm đề xuất) + docs/PHASE9_ROUND136_LIMITS.md §12.3(i) (quyết parent phê duyệt).

## 0. Kết luận ngắn — 6/6 exit 0 ngay lần đầu, 0 retry, 0 kẹt; 4 bước kiểm: 3 xong + chạy được, 1 sẵn sàng nhưng bị chặn một nửa bởi môi trường

- **Gate đủ 09:54:24Z (waiter poll 7 trên boot mới):** `round137-t4.done` + `POSTBOOT_PASS` boot `17db9652` pass_at 09:43:47Z poll=6 (T5).
- **Lượt yên #14 của T4 (ghi trong cờ, không phải số đo của T8) — LƯỢT QUYẾT ĐỊNH cho điều tra (c2): 1 attempt hợp lệ, 20/20 pass, median tickCost 59,0 ms (ngưỡng ≤60 ms GIỮ — biên chỉ 1 ms, CAO NHẤT trong 12 lượt, lần thứ 2 liên tiếp ≥55 ms), (c2)=6 occ/5 seq (có 1 lag 2f đầu tiên), coverage 6/6, lớp B 5/5, F6' ĐÓNG lần thứ 3 liên tiếp, logger nới KIỂM CHỨNG lần thứ 3 (loop 1–21, 20 wrap).** Theo quyết parent đợt 136 §12.3(c): median ≥55 ms lần thứ 2 liên tiếp thì parent bàn lại ngưỡng/bar — T4/T10 báo, T8 chỉ ghi lại.
- **Chạy 1 trên boot 17db9652 (09:58:43–10:14:20Z): WebKit 84l10 exit 0 (~71 s), 85m4 exit 0 (~134 s), 86n2 exit 0 (~238 s) — 3/3 exit 0 NGAY LẦN ĐẦU, không retry; đối chứng Chromium 84l10 exit 0 (~65 s), 85m4 exit 0 (~124 s), 86n2 exit 0 (~227 s) — 3/3 exit 0 NGAY LẦN ĐẦU.** Tổng 6/6 exit 0, 0 TIMEOUT, 0 retry. **P3 không kẹt lần thứ chín liên tiếp.**
- **1 reboot giữa phiên:** boot cũ `2104246b` (btime 08:07:26Z) chết ~09:36:1x–09:36:2xZ; boot mới `17db9652` btime 09:36:16Z (theo /proc/1) — khung chết chính xác do T2/T6 xác định, T8 chỉ ghi mốc quan sát được. Reboot giết waiter + exec session đang chờ của T8 (đã khởi động lại waiter bằng tay 09:37:50Z, không mất dữ liệu).
- **4 bước kiểm (quyết parent §12.3(i)) — trạng thái:**
  1. **Watchdog chẩn đoán: TRIỂN KHAI XONG** trong cả 3 script harness (`evalDiag137`, 5 vị trí: `waitForPlaySync` ×3 + `sampleFor` ×2; `node --check` pass cả 3) — **CHƯA KÍCH HOẠT** (0 lần kẹt đợt này → 0 dòng `WATCHDOG-137` trong cả 6 log; xem §2.1).
  2. **Cột Balloon vào RAM sampler: TRIỂN KHAI XONG + ĐÃ CHẠY** (`ram-137t8.log` 32 mẫu; balloon 4.865.912 → max 5.796.056 kB → 5.289.808; avail 1.899 → min 574 → 933 MB) + sửa label sai `swap_used` → `mem_used`.
  3. **Đối chứng Chromium cùng pha: CHẠY XONG 3/3** (N=1 mỗi pha; các pha từng kẹt đều PASS: W1-lần2 đồng bộ 1,0 s; P4-lần2 (86n2) 1,0 s; P1-phaseA 85m4 PASS).
  4. **Lưu dmesg + journalctl -k sau mỗi lần kẹt: CƠ CHẾ SẴN SÀNG** (diag script + driver gọi khi exit 124 + baseline lúc bắt đầu) nhưng **CHƯA CÓ LẦN KẸT ĐỂ KÍCH HOẠT**; và **`dmesg` BỊ CHẶN (EPERM — kernel buffer không đọc được trong cell này) + `journalctl -k` trả "-- No entries --"** — bước 4 chỉ thu được một nửa bằng chứng nếu có kẹt (F-137-T8-1).
- **Điều tra chung (§B): H1 BÁC BỎ (đứng nguyên); H2 KHÔNG ỦNG HỘ → YẾU THÊM (bằng chứng mới #2 có cột Balloon chứng minh cơ chế: avail −1.325 MB trong khi balloon +908 MB trong một lần chạy pass 6/6); H3 VẪN MỞ (đối chứng Chromium 3/3 pass không phân biệt được vì 0 kẹt cả hai engine đợt này — cần kẹt tái hiện + watchdog kích hoạt mới phân biệt được).**
- **Fixture rebuild 1 lần: 6/6 md5 khớp đợt 125–136.**
- **Cây: preview.tsx `530e10a7` suốt lượt** (fix GIỮ theo quyết parent đợt 136 §12.3(a) — lượt #14 là lượt quyết định); media.ts `2c384ed1`, vite.config.ts `ee80d093` giữ nguyên (mở / trước chạy / cuối lượt đều khớp). 3 script harness đã sửa (watchdog): 84l10 `46ab78a5`, 85m4 `14bb67e2`, 86n2 `406abb75` (mtime 08:51Z, không đổi sau khi chạy).
- **Dọn sạch:** 0 process Xvfb/vite/MiniBrowser sót, `/tmp/.X11-unix/` chỉ còn X193 (của luồng khác), không `vite.lock`; lock `t8-round137` đã nhả đủ 6 lần giữ.
- **Cảnh báo stage: script 86n2 sau khi thêm watchdog là 37.918 B — VƯỢT giới hạn push-files 37.768 B đúng 150 B** (F-137-T8-4); file chạy = file stage (trung thực), push cần `ENABLE_PRIVSEP=0` theo luật đứng.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 08:07:26 | Boot `2104246b` lên (btime theo /proc/1 — boot này có TRƯỚC khi lượt 137 dispatch 08:35Z; dải dự báo đợt 136 cho boot #93? là [05:56:47Z, 07:55:21Z] — 08:07:11Z nằm ngoài dải ~12 phút, việc T2/T6) |
| 08:35 | Lượt cron 15:35 +07 mở đợt 137; parent tạo `round-in-progress.md` (đã xóa lúc mở? — T8 mở thấy không có file chặn; xem build-loop log) |
| 08:40:47 | T8 mở: boot `2104246b`, RAM avail 932 MB, Balloon 5.987.940 kB, cây preview.tsx `530e10a7` (khớp quyết GIỮ fix) |
| 08:46:31 | Waiter bắt đầu poll 60 s (deadline gốc 10:00Z, epoch 1794996000 đã kiểm chứng — gõ tay, không sed) |
| 08:51 | Watchdog `evalDiag137` thêm xong vào 3 script harness; `node --check` pass cả 3; driver run-webkit-137t8.sh viết xong (Balloon + Chromium + diag-khi-124) |
| 09:05:29 | Waiter khởi động lại sau lần pkill tự giết shell (F-137-T8-2); deadline gia hạn 10:00Z → 10:30Z (epoch 1794997800) vì T5 postboot vẫn FAIL do apt replay chưa cài xong GST plugins |
| 09:10–09:34 | apt replay cài `gstreamer1.0-plugins-bad` (dpkg_lines 656 → 753); T5 postboot GST chuyển FAIL → PASS (isomp4 + libav đủ, 09:34Z) nhưng vẫn thiếu plugins-bad/ugly/x nên postboot_exit vẫn 1 |
| 09:35:47 / 09:36:02 | Mốc cuối trên boot cũ: T4 poll #69 (RAM 492 MB), T5 poll 51 (postboot_exit=1) |
| ~09:36:1x–09:36:2x | **REBOOT — boot `2104246b` chết, boot mới `17db9652` lên (btime 09:36:16Z theo /proc/1)**; waiter + exec session đang sleep của T8 chết theo; T4/T5 poller chết theo |
| 09:37:50 | T8 khởi động lại waiter bằng tay (pid 2288); cây + script watchdog còn nguyên (workspace bền qua reboot); fixture /tmp đã mất — rebuild lại sau gate |
| 09:43:47 | T5 viết `POSTBOOT_PASS` boot `17db9652` (poll 6) — replay lần 2 nhanh hơn hẳn lần 1 |
| 09:44:26 | T4: "CỬA YÊN MỞ poll #10 — gate0 PASS + gateA đủ (RAM=1134MB) — CHẠY attempt1 NGAY" (lượt yên #14 bắt đầu) |
| 09:48:24 | Waiter khởi động lại lần 2 (pid 9806) sau lần pkill tự giết shell thứ hai (F-137-T8-2); deadline gia hạn 10:30Z → 10:45Z (epoch 1794998700) |
| 09:54:24 | Waiter poll 7: **GATE-FOUND**, exit 0 (t4=OK postboot=OK) |
| 09:58:17 | Kiểm cây trước chạy: 530e10a7 / 2c384ed1 / ee80d093; RAM avail 2.033 MB |
| 09:58:38 | Rebuild fixture xong (~17 s): 6/6 md5 khớp |
| 09:58:43–09:59:57 | **84l10 WebKit exit 0** (~71 s, W1×3/W2/E4 PASS) |
| 10:00:12–10:02:26 | **85m4 WebKit exit 0** (~134 s, toàn bộ PASS; P5 KHÔNG restart dư — khác đợt 136, xem F-137-T8-6) |
| 10:02:41–10:06:39 | **86n2 WebKit exit 0** (~238 s, toàn bộ PASS tới P6) |
| 10:06:54–10:07:59 | **84l10 Chromium exit 0** (~65 s) — đối chứng bước 3 |
| 10:08:14–10:10:18 | **85m4 Chromium exit 0** (~124 s) — đối chứng bước 3 |
| 10:10:33–10:14:20 | **86n2 Chromium exit 0** (~227 s) — đối chứng bước 3 |
| 10:14:20 | Driver ALL DONE: webkit 0/0/0, chromium 0/0/0 |
| ~10:18 | Kiểm cuối: cây không đổi (530e10a7 + 3 script watchdog md5 giữ nguyên), 0 process sót, X193 (luồng khác) còn, không `vite.lock`, boot vẫn `17db9652` — **0 reboot trong cửa sổ chạy harness** |

## 2. Chuẩn bị — waiter deadline gõ tay (gia hạn 2 lần); 4 bước kiểm triển khai TRƯỚC khi gate mở

- **Deadline waiter gõ TAY TRỰC TIẾP, không sed** (bài học đợt 132): gốc 10:00Z epoch 1794996000 (> epoch lúc viết 1794991524); gia hạn 10:30Z epoch 1794997800 (09:05Z) và 10:45Z epoch 1794998700 (09:48Z) — cả hai đều gõ tay + `bash -n` OK. Gate mở 09:54:24Z nên không deadline nào bị trigger. Lý do gia hạn: T5 postboot FAIL kéo dài trên boot cũ + reboot giữa phiên (F-137-T8-5).
- **Waiter chỉ 1 lần chạy tại mỗi thời điểm, đọc lại boot_id mỗi poll** (bản vá đợt 134) — nhờ đó waiter khởi động lại sau reboot tự theo boot mới `17db9652` thay vì kẹt chờ cờ boot cũ.
- Driver + fixture script adapt từ đợt 136 bằng sed `136→137` (đã grep kiểm: 0 ref `136`/`135` còn sót; `bash -n` OK). Comment header stale (boot d2e66749 / 78b55838) đã sửa tay (F-137-T8-3).
- **F-137-T8-2 — pkill -f tự giết shell của mình (2 lần, 09:05Z + 09:48Z):** `pkill -f "wait-t4-t5-137t8.sh"` giết luôn shell exec đang chạy lệnh đó, vì pattern xuất hiện trong chính command line (cả trong heredoc Python lẫn dòng nohup) — trick `[w]ait-...` KHÔNG cứu được khi chuỗi plain `wait-t4-t5-137t8.sh` còn nằm ở chỗ khác trong cùng command. Bài học: giết waiter cũ bằng PID chính xác, không dùng `pkill -f`. Hậu quả giới hạn: waiter chết, khởi động lại bằng tay ngay; không mất dữ liệu (log đã copy trước khi restart; flag/gate là file trên đĩa, waiter mới đọc lại).

### 2.1 Bước 1 — Watchdog chẩn đoán trong harness (TRIỂN KHAI XONG, chưa kích hoạt)

- Thêm vào cả 3 script `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs`, `clicktest-85m4-webkit-w7-hb128.mjs`, `clicktest-86n2-webkit-w7.mjs`: hàm `evalDiag137(page, fn, label)` + `import { execFile }` + `DIAG137_DEV_URL` (set trong `main()` sau khi vite sẵn sàng).
- Cơ chế: bọc đúng 5 lệnh `page.evaluate(STATE_FN)` trong `waitForPlaySync` (×3 file) + `sampleFor` (85m4, 86n2) — đúng hai hàm chứa cả 3 điểm kẹt cũ. Mỗi lần gọi đặt timer 60 s: nếu evaluate im lặng >60 s thì (a) log `WATCHDOG-137`, (b) gọi `diag-stall-137t8.sh` (ps/RSS + `/proc/meminfo` kèm Balloon + dmesg + journalctl -k + kiểm vite HTTP), (c) probe `page.evaluate(() => 1+1)` race 30 s để phân biệt "kênh evaluate còn sống — evaluate gốc kẹt ở media pipeline/JS" với "kênh evaluate kẹt cùng / page JS chết". Timer được clear khi evaluate trả về (thành công hay lỗi).
- **CHẨN ĐOÁN-ONLY, không đổi hành vi:** không resolve/reject evaluate đang treo, không đổi timeout 900 s ngoài, không đổi verdict — harness vẫn treo tới timeout kill như trước nếu kẹt thật (khi đó driver gọi thêm diag, bước 4).
- Kiểm chứng trước chạy: `node --check` pass cả 3 file; grep xác nhận 0 lệnh `page.evaluate(STATE_FN)` thô còn sót trong 2 hàm mục tiêu (5/5 đã bọc); `DIAG137_DEV_URL` được set ở cả 3 file (dòng 498 / 593 / 615).
- **Kết quả đợt này: watchdog CHƯA KÍCH HOẠT — 0 dòng `WATCHDOG-137` trong cả 6 log harness** (grep -c = 0 cho cả 6 file). Đúng kỳ vọng khi 0 lần kẹt: watchdog đã sẵn sàng, chưa có lần kẹt để kích hoạt bước 1/4 (theo brief: ghi rõ trạng thái này).
- Smoke-test diag script chạy tay 08:46Z (label `smoke-test`, devUrl chết `http://127.0.0.1:1/`): ghi đủ 10 file (`ps.txt`, `ps-top-rss.txt`, `meminfo.txt`, `free.txt`, `loadavg.txt`, `vite-http.txt` = http_code 000 + curl exit 7, `dmesg.txt`, `dmesg-tail100.txt`, `journalctl-k-tail200.txt`, `README.txt`) — chứng minh script chạy được; chỉ có dmesg EPERM + journalctl rỗng (F-137-T8-1).

### 2.2 Bước 2 — Cột Balloon vào RAM sampler (TRIỂN KHAI XONG + ĐÃ CHẠY)

- Sampler trong `run-webkit-137t8.sh`: mỗi 30 s ghi `avail / mem_used / balloon_kb (từ /proc/meminfo) / loadavg` vào `smoke/ram-137t8.log` (32 mẫu + header + marker pha Chromium).
- Đồng thời sửa label sai từ đợt 128: `swap_used` → `mem_used` (`$3` của dòng `Mem:` là used, không phải swap). Header log ghi rõ lý do đổi tên để đợt sau không trích nhầm.
- Số liệu đợt này (xem §B7): balloon 4.865.912 → max 5.796.056 kB (10:06:44Z) → 5.289.808; avail 1.899 → min 574 MB (10:09:44Z) → 933 MB.

### 2.3 Bước 3 — Đối chứng Chromium (CHẠY XONG 3/3, N=1 mỗi pha)

- Sau pha WebKit, driver chạy tiếp cùng 3 script với `ENGINE=chromium`, scratch dir riêng (`*-scratch-chromium`, không ghi đè report WebKit), log riêng (`run-chromium-*.log`), cùng Xvfb :199, cùng lock `t8-round137` (acquire/release từng lần).
- Kết quả: 3/3 exit 0 ngay lần đầu (xem §3.2). Đây là lần đầu tiên trên đĩa có đối chứng Chromium cùng pha cho 3 điểm kẹt (đợt 136 §B4 ghi "KHÔNG có lần chạy đối chứng Chromium cùng pha trên đĩa").

### 2.4 Bước 4 — Lưu dmesg + journalctl -k sau mỗi lần kẹt (CƠ CHẾ SẴN SÀNG, chưa kích hoạt; dmesg bị chặn)

- Cơ chế 3 lớp: (a) watchdog trong harness gọi `diag-stall-137t8.sh` khi evaluate im >60 s; (b) driver gọi diag ngay khi một harness timeout (exit 124); (c) baseline `dmesg`/`journalctl -k`/`meminfo` lưu lúc bắt đầu chạy (`smoke/baseline-*`).
- **Chưa có lần kẹt đợt này nên (a)/(b) chưa kích hoạt.** Baseline đã lưu: `baseline-dmesg-tail50.txt` (58 B — chỉ có dòng lỗi EPERM), `baseline-journalctl-k.txt` (17 B — "-- No entries --"), `baseline-meminfo.txt` (đầy đủ, có Balloon).
- **F-137-T8-1 — dmesg KHÔNG đọc được trong cell này:** `dmesg: read kernel buffer failed: Operation not permitted` (kernel.dmesg_restrict) — kiểm trực tiếp 08:46Z + lúc baseline 09:58Z, cả hai đều EPERM. `journalctl -k` exit 0 nhưng trả "-- No entries --" (không có kernel journal nào nhìn thấy được trong cell). Hệ quả: bước 4, nếu có kẹt, chỉ thu được `journalctl -k` rỗng + bản ghi EPERM + ps/meminfo/vite-HTTP (vẫn đủ 3/5 thành phần). Đây là giới hạn môi trường, không phải lỗi triển khai; không có cách lách trong quyền của T8 (không tự cài apt / không can thiệp host).

## 3. Kết quả harness chi tiết — boot 17db9652, Xvfb :199, lock t8-round137

### 3.1 Pha WebKit — 3/3 exit 0 ngay lần đầu, 0 retry

#### 84l10 — exit 0 (09:58:46–09:59:57Z, ~71 s)
- W1-lần1 PASS (đồng bộ 0,8 s, delta=+1, hạ-cánh-về-target=true), **W1-lần2 PASS (đồng bộ 1,9 s, delta=+1) — pha kẹt đợt 135 KHÔNG tái hiện (lần thứ 2 liên tiếp)**, W1-lần3 PASS (đồng bộ 1,2 s, delta=+1), W2 PASS (playhead cuối=30, restart tự nhiên Δ=0), E4 PASS (tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=3 → sau 3 s=3, ct cuối=4, ended=true, errors=0).
- `KẾT QUẢ: KHÔNG FAIL` — report `l10-scratch/l10-webkit-loop-w1-report.json` (31.286 B, ok=True, engines=[webkit]).

#### 85m4 hb128 — exit 0 (10:00:12–10:02:26Z, ~134 s)
- P1 PASS (không restart dư — **pha kẹt P1-phaseA đợt 134 KHÔNG tái hiện, lần thứ 3 liên tiếp sau đợt 135/136**), P2 PASS (reset 723 ms), **P3 PASS (0 restart — phát thường ổn định)**, P4-lần1/2/3 PASS (đồng bộ 1,9/1,3/1,8 s; delta=+1, hạ-cánh-về-target=true), P5 PASS (không restart dư trong 40 s sau reset — seek kẹt dài nhất 0 mẫu; KHÁC đợt 136 CÓ-RESTART +1, xem F-137-T8-6).
- HB128: **19 dòng `sampleFor`** — đúng bằng đợt 133/134/135/136.
- `KẾT QUẢ: KHÔNG FAIL` — report `m4-scratch/m4-webkit-w7-report.json` (128.214 B, ok=True, engines=[webkit]).

#### 86n2 — exit 0 (10:02:41–10:06:39Z, ~238 s)
- P1 PASS (không restart dư), P2 PASS (reset 694 ms), **P3 PASS (0 restart)**, P4-lần1/2/3 PASS (đồng bộ 1,9/1,9/1,4 s; delta=+1, hạ-cánh-về-target=true) — **P4-lần2, pha kẹt đợt 134, PASS sau đồng bộ 1,9 s (lần thứ 3 liên tiếp)**, P5 PASS (seek kẹt dài nhất 0 mẫu), **P6 KHÔNG-KẸT (element phát thường suốt 90 s chờ — 0 restart)**.
- `KẾT QUẢ: KHÔNG FAIL` — report `n2-scratch/n2-webkit-w7-report.json` (153.280 B, ok=True, engines=[webkit]).

#### Tổng hợp pha WebKit
- **3/3 exit 0 ngay lần chạy đầu, 0 TIMEOUT, 0 retry.** Không có kẹt mới nào trong đợt này.
- **P3 không kẹt lần thứ chín liên tiếp** có chạy tới P3 (đợt 131: lần 4; 132: không chạy — không tính; 133: lần 5; 134: lần 6; 135: lần 7; 136: lần 8; 137: lần 9 — 85m4 + 86n2 đều P3 PASS 0 restart).
- Ba lần kẹt đợt 134/135 đều KHÔNG tái hiện đợt này (lần thứ 3 liên tiếp cho 85m4 P1-phaseA và 86n2 P4-lần2 sau đợt 135/136; lần thứ 2 liên tiếp cho 84l10 W1-lần2 sau đợt 136).

### 3.2 Pha đối chứng Chromium (bước 3) — 3/3 exit 0 ngay lần đầu, 0 retry

#### 84l10 Chromium — exit 0 (10:06:54–10:07:59Z, ~65 s)
- W1-lần1/2/3 PASS; **W1-lần2 PASS (đồng bộ 1,0 s, delta=+1)** — pha từng kẹt trên WebKit cũng pass trên Chromium; W2/E4 PASS.
- `KẾT QUẢ: KHÔNG FAIL` — report `l10-scratch-chromium/l10-webkit-loop-w1-report.json` (42.872 B, ok=True, engines=[chromium]).

#### 85m4 Chromium — exit 0 (10:08:14–10:10:18Z, ~124 s)
- P1 PASS (không restart dư — pha kẹt P1-phaseA đợt 134 pass trên Chromium), P2 PASS, **P3 PASS (0 restart)**, P4-lần1/2/3 PASS, P5 PASS (không restart dư, seek kẹt dài nhất 0 mẫu).
- `KẾT QUẢ: KHÔNG FAIL` — report `m4-scratch-chromium/m4-webkit-w7-report.json` (189.461 B, ok=True, engines=[chromium]).

#### 86n2 Chromium — exit 0 (10:10:33–10:14:20Z, ~227 s)
- P1/P2/P3 PASS (0 restart), P4-lần1/2/3 PASS — **P4-lần2 PASS (đồng bộ 1,0 s, delta=+1)** — pha từng kẹt trên WebKit cũng pass trên Chromium; P5 PASS, **P6 KHÔNG-KẸT (0 restart trong 90 s)**.
- `KẾT QUẢ: KHÔNG FAIL` — report `n2-scratch-chromium/n2-webkit-w7-report.json` (223.463 B, ok=True, engines=[chromium]).

#### Tổng hợp pha Chromium
- **3/3 exit 0 ngay lần chạy đầu, 0 TIMEOUT, 0 retry. N=1 mỗi pha trên boot này — mẫu mỏng, chỉ làm baseline lần đầu, không đủ để kết luận về H3 một mình (xem §B).**
- Tổng cả hai pha: **6/6 harness exit 0, 0 kẹt, 0 WATCHDOG-137, 0 lần gọi diag-stall thật** (chỉ có 1 dir `stall-smoke-test-*` từ smoke-test tay lúc chuẩn bị — không phải kẹt thật).

## 4. Lượt yên #14 — bối cảnh từ cờ T4 (không phải số đo của T8)

- T4 đóng với **1 attempt hợp lệ, 20/20 pass, median tickCost 59,0 ms (ngưỡng ≤60 ms GIỮ — biên chỉ 1 ms, CAO NHẤT trong 12 lượt, lần thứ 2 liên tiếp ≥55 ms), (c2)=6 occ/5 seq (có 1 lag 2f đầu tiên), coverage 6/6, lớp B 5/5, F6' ĐÓNG lần thứ 3 liên tiếp, logger nới KIỂM CHỨNG lần thứ 3 (loop 1–21, 20 wrap)** — lượt yên hợp lệ thứ ba liên tiếp với logger nới (đợt 135: loop 1–22, 21 wrap; đợt 136: loop 1–21, 20 wrap).
- POSTBOOT_PASS cho boot 17db9652 tới nhanh (pass_at 09:43:47Z, poll=6 — ~7 phút sau boot 09:36:16Z; khác boot cũ 2104246b: postboot FAIL suốt 08:07–09:36Z vì apt replay chưa cài xong GST plugins), nên gate T8 mở được 09:54:24Z.
- T8 không đo log draw, không phân tích (c2) — đó là việc T5 pha 2 / T3 bước 2. Lưu ý cho T3/parent: **lượt #14 là lượt quyết định** (quyết parent đợt 136 §12.3(a)) — (c2)=6 occ/5 seq với 1 lag 2f đầu tiên là bằng chứng mới quan trọng cho verdict.

## 5. Fixture rebuild — 6/6 md5 khớp (1 lần duy nhất, sau reboot)

- Rebuild 09:58:2xZ trên boot 17db9652 (~17 s): hevc `ba0c7c62`, i7 `f05daed8`, h-30s `fbaa3d1a` (×3: l10/m4/n2), g-4s `a1fb8549` — khớp đợt 125–136. ffprobe đúng spec; blend media bền kiểm tra đủ (ocean-a50 `f1e277f0`, slov-a085 `f4c35a6a`).
- Rebuild lần này là BẮT BUỘC (reboot xóa /tmp); log redirect vào `smoke/rebuild-fixtures.log` ngay từ đầu (khác đợt 136 F-136-T8-3 — lần này stdout đã lưu file).
- 0 reboot trong cửa sổ chạy harness nên KHÔNG rebuild lần 2; fixture trong /tmp còn nguyên sau khi xong (đúng thiết kế — fixture chỉ sống trong `/tmp`, rebuild lại sau mỗi reboot, không có trong batch stage).

## 6. Dọn dẹp + kiểm cuối — đã dọn sạch (phần của T8)

- Trap `cleanup` của driver: kill Xvfb :199 (+ `kill -9` sau 2 s), unlink `/tmp/.X11-unix/X199` + `/tmp/.X199-lock`, kill cả nhóm RAM sampler (+ `pkill -f ram-137t8.log` dự phòng).
- Kiểm cuối ~10:18Z (trên boot 17db9652): 0 process Xvfb/vite/MiniBrowser/WebKit; `/tmp/.X11-unix/` còn **X193** (của luồng khác — KHÔNG phải của T8, để nguyên); không có `/tmp/.X199-lock`; không có `vite.lock`.
- Lock `t8-round137`: nhả đủ 6 lần giữ — webkit 84l10 ~71 s, 85m4 ~134 s, 86n2 ~238 s; chromium 84l10 ~65 s, 85m4 ~124 s, 86n2 ~227 s.
- RAM sampler log: `smoke/ram-137t8.log` (34 dòng gồm header + marker pha Chromium, 09:58:43–10:14:14Z; xem §B7).
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **"6/6 exit 0" đợt này là lần chạy đầu, không retry** — trên boot 17db9652 duy nhất. Không suy ra "luôn pass lần đầu" ngoài boot này.
2. **Ba lần kẹt đợt 134/135 vẫn là "treo không trả mẫu", không phải FAIL có verdict** (xem §B) — đợt này không có kẹt mới nên không thêm mẫu nào; điều tra §B dựa trên 3 mẫu cũ + bằng chứng mới từ lần chạy pass đợt này (§B7) + đối chứng Chromium lần đầu (§3.2).
3. **Watchdog chưa từng kích hoạt thật** — code đã vào 3 script và smoke-test tay chứng minh diag script chạy được, nhưng chưa có lần kẹt nào để chứng minh watchdog kích hoạt đúng lúc + probe 1+1 phân biệt được như thiết kế. Đừng trích "watchdog đã bắt được kẹt" — chưa có.
4. **Đối chứng Chromium N=1 mỗi pha** — mẫu mỏng. Tỉ lệ kẹt lịch sử ở các pha này là ~3 lần / hàng chục lượt chạy; 3 lần pass Chromium không đủ sức mạnh thống kê để loại H3 hay xác nhận H3. Chỉ làm baseline lần đầu.
5. **Bước 4 bị chặn một nửa bởi môi trường** (F-137-T8-1): dmesg EPERM + journalctl -k rỗng trong cell này — nếu đợt sau có kẹt, bằng chứng kernel sẽ thiếu dmesg.
6. **Lượt yên #14 median 59,0 ms — biên chỉ 1 ms dưới ngưỡng 60 ms, cao nhất 12 lượt, lần thứ 2 liên tiếp ≥55 ms.** T8 chỉ ghi lại từ cờ T4, không phân tích nguyên nhân; theo quyết parent đợt 136 §12.3(c), đợt 137 median ≥55 ms thì parent bàn lại (ngưỡng/bar hay điều tra tải song song trước).
7. **85m4 P5 đợt này "không restart dư"** (F-137-T8-6) khác đợt 136 "CÓ-RESTART (+1)" — cả hai đều harness PASS; khác biệt là do element có chạm cuối clip trong cửa sổ P5 hay không, không phải hồi quy. Đừng trích thành "P5 đợt 136 sai".
8. **Script 86n2 37.918 B vượt giới hạn push-files 37.768 B đúng 150 B** (F-137-T8-4) — push cần `ENABLE_PRIVSEP=0`. Hai script còn lại dưới giới hạn; **LIMITS này cũng vượt: 39.672 B (vượt 1.904 B)** — xem F-137-T8-8.
9. **Hạn cứng T10 đợt 137 (~11:00Z) là ước theo mẫu +2h25m của đợt 136, chưa xác nhận** — T8 đóng ~10:18Z, còn ~42 phút đệm nếu ước đúng.
10. **0 reboot trong cửa sổ chạy harness không có nghĩa nhịp reboot đã dừng** — đợt này đã có 1 reboot giữa phiên (09:36Z). T8 đợt sau vẫn phải chịu reboot (waiter đọc lại boot mỗi poll + backup log + rebuild fixture sau reboot).

## 8. Sai số mới (F-137-T8-N)

- **F-137-T8-1 — dmesg EPERM + journalctl -k rỗng (giới hạn môi trường, bước 4 chỉ thu được một nửa):** xem §2.4. `dmesg` báo `read kernel buffer failed: Operation not permitted` ở cả smoke-test 08:46Z và baseline 09:58Z; `journalctl -k` exit 0 nhưng "-- No entries --". Không thử lách (không can thiệp host). Nếu đợt sau có kẹt thật, diag-stall vẫn lưu được ps/RSS + meminfo kèm Balloon + vite-HTTP + journalctl rỗng + bản ghi EPERM.
- **F-137-T8-2 — pkill -f tự giết shell của mình, 2 lần (09:05Z + 09:48Z):** xem §2. Hậu quả giới hạn ở waiter chết + khởi động lại bằng tay; không mất dữ liệu, không mất gate. Luật mới cho T8: giết process cũ bằng PID chính xác, không dùng `pkill -f` với pattern xuất hiện trong chính command line.
- **F-137-T8-3 — comment header stale trong script adapt (boot d2e66749 / 78b55838):** sed `136→137` không đổi được boot id trong comment (vì boot id không chứa "136"). Đã sửa tay trước khi chạy (rebuild header → 2104246b; retry header → 2104246b). Chỉ là comment, không ảnh hưởng logic; ghi để đợt sau kiểm header sau sed.
- **F-137-T8-4 — script 86n2 37.918 B, vượt giới hạn push-files 37.768 B đúng 150 B:** watchdog thêm ~2,9 KB vào file vốn ~35,0 KB. File chạy = file stage (trung thực, không cắt bớt sau khi chạy). Push cần `ENABLE_PRIVSEP=0` theo luật đứng. Đợt sau: nếu thêm chẩn đoán vào 86n2 nữa thì cân nhắc gọn comment để giữ dưới giới hạn, hoặc chấp nhận oversize + cờ PRIVSEP.
- **F-137-T8-5 — waiter deadline gia hạn 2 lần (10:00Z → 10:30Z → 10:45Z):** nguyên nhân: T5 postboot FAIL kéo dài trên boot cũ (apt replay cài GST plugins từ 08:07Z tới 09:34Z mới đủ isomp4+libav, vẫn thiếu bad/ugly/x) + reboot 09:36Z bắt T4/T5 làm lại từ đầu trên boot mới. Deadline cuối 10:45Z không bị trigger (gate mở 09:54:24Z). Hạn cứng T10 đợt 137 vẫn là ước ~11:00Z chưa xác nhận.
- **F-137-T8-6 — 85m4 P5 đợt này "không restart dư", khác đợt 136 "CÓ-RESTART (+1) ended-at-duration":** P5 chạy 40 s sau reset (10:01:46–10:02:26Z); lần này element không chạm cuối clip trong cửa sổ P5 nên không có restart tự nhiên; đợt 136 element chạm cuối clip (ct=30, dur=30) nên restart +1 theo cơ chế W2. Cả hai đều harness verdict KHÔNG FAIL. Ghi nhận để T3/T10 đối chiếu, không tự kết luận.
- **F-137-T8-8 — LIMITS này 39.672 B, vượt giới hạn push-files 37.768 B đúng 1.904 B:** doc dài do gộp cả §B cập nhật + trạng thái 4 bước kiểm. Nội dung đã viết xong mới đo kích thước (ước ~29 KB lúc viết phụ lục là sai — đã đính chính trong phụ lục). Push cần `ENABLE_PRIVSEP=0` như file oversize khác (tiền lệ: LIMITS T2 đợt 136 54.288 B cũng oversize, chỉ stage). Không cắt nội dung để vừa giới hạn (nội dung điều tra cần đầy đủ).
- **F-137-T8-7 — reboot giữa phiên giết waiter + exec session đang sleep của T8:** boot `2104246b` chết ~09:36:1x–09:36:2xZ (mốc cuối trên boot cũ: T4 poll #69 09:35:47Z, T5 poll 51 09:36:02Z, waiter poll 32 09:36:29Z — lưu ý mốc waiter 09:36:29Z muộn hơn btime boot mới 09:36:16Z theo /proc/1, mâu thuẫn nhỏ này để T2/T6 đối chiếu khi xác định khung chết; T8 không tự kết luận thời điểm chết chính xác). Waiter khởi động lại tay 09:37:50Z; exec session sleep-570 bị gián đoạn bởi runtime restart (lệnh chỉ đọc trạng thái, không có side-effect, không cần chạy lại). Fixture /tmp mất theo reboot, rebuild lại sau gate (6/6 khớp).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Điều tra chung ba lần kẹt (§B):** H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ (yếu thêm), H3 VẪN MỞ. Cần kẹt tái hiện để watchdog + bước 4 chứng minh H3; nếu nhiều đợt nữa 0 kẹt thì parent cân nhắc đóng điều tra dạng "không tái hiện được sau N đợt" thay vì chờ kẹt mới.
2. **Lượt yên #14 median 59,0 ms (biên 1 ms, lần 2 liên tiếp ≥55 ms):** parent bàn lại ngưỡng/bar theo quyết §12.3(c) đợt 136 — T4/T10 báo.
3. **86n2 script oversize 150 B** (F-137-T8-4): parent/T10 quyết push bằng `ENABLE_PRIVSEP=0` hay gọn comment watchdog.
4. **Bước 4 thiếu dmesg vĩnh viễn trong cell này?** Nếu parent muốn dmesg thật sau kẹt thì cần can thiệp host (ngoài quyền T8) — hoặc chấp nhận bước 4 chỉ có ps/meminfo/vite-HTTP/journalctl rỗng.
5. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6.144 MiB; mù #56 (T2 đợt 137) + mù mới từ reboot 09:36Z (T2/T6); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

---

# PHẦN B — Điều tra chung ba lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 137 (4 bước kiểm đã phê duyệt)

## B1. Trạng thái giả thuyết sau đợt 137

| Giả thuyết | Trạng thái đợt 136 | Trạng thái đợt 137 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | Không có bằng chứng mới nào đổi; đợt này avail lúc bắt đầu chạy chỉ 1.899 MB (thấp hơn mức bắt đầu của kẹt 1: 1.226 MB? — không: 1.899 > 1.226; nhưng avail tụt tới min 574 MB trong lúc chạy mà 0 kẹt — xem B7) |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ — YẾU THÊM** | Bằng chứng mới #2 (§B7): tụt avail −1.325 MB xảy ra trong lần chạy pass 6/6, và cột Balloon mới chứng minh tụt đó là balloon host (+908 MB), không phải rò rỉ process |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | Đối chứng Chromium 3/3 pass không phân biệt được (0 kẹt cả hai engine); watchdog chưa kích hoạt; dmesg bị chặn (F-137-T8-1) |

## B2. Trạng thái 4 bước kiểm (quyết parent đợt 136 §12.3(i)) — chi tiết

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | XONG — `evalDiag137` trong 3 script, 5 vị trí, `node --check` pass | Chưa kích hoạt (0 kẹt → 0 dòng WATCHDOG-137) | Sẵn sàng; chưa có bằng chứng mới về H3 |
| (2) Cột Balloon vào RAM sampler | XONG + ĐÃ CHẠY — 32 mẫu, label `mem_used` đã sửa | Đã chạy suốt 09:58:43–10:14:14Z | Bằng chứng mới #2 cho H2 (§B7) |
| (3) Đối chứng Chromium cùng pha | XONG — 3/3, N=1 mỗi pha, scratch/log riêng | Đã chạy 10:06:54–10:14:20Z | 3/3 pass; baseline lần đầu; không phân biệt H3 (0 kẹt cả hai engine) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (diag script + driver gọi khi exit 124 + baseline) | Chưa kích hoạt (0 kẹt); baseline đã lưu | **dmesg BỊ CHẶN (EPERM); journalctl -k rỗng** — bước 4 chỉ thu được một nửa nếu có kẹt |

## B3. Chữ ký kẹt của cả ba lần — không đổi từ đợt 136 (ghi lại để đối chiếu)

Xem docs/PHASE9_ROUND136_T8_VITEHARNESS_LIMITS.md §B1–B2: cả ba đều là một lệnh `page.evaluate` không bao giờ trả kết quả, ngay sau một bước PASS, process idle (loadavg ~0,1), không verdict FAIL. Đợt 137 không thêm mẫu kẹt mới nào (0 kẹt trong 6 lần chạy).

## B4. Kiểm giả thuyết H3 bằng đối chứng Chromium — kết quả lần đầu

- **Ủng hộ H3 (yếu, gián tiếp):** 3 lần kẹt lịch sử đều là WebKit; Chromium pass 3/3 ở đúng các pha đó là điều H3 dự đoán (Chromium không dùng WebKitGTK/GStreamer pipeline đó).
- **Chống / giới hạn:** 0 kẹt cả hai engine đợt này — WebKit cũng pass 3/3 ở đúng các pha đó, nên đối chứng không tách được "WebKit hay kẹt" khỏi "pha đó hiếm khi kẹt". N=1 mỗi pha là mẫu mỏng so với tỉ lệ kẹt lịch sử (~3 lần / hàng chục lượt chạy WebKit). Không có snapshot process lúc kẹt (vì không có kẹt), không có dmesg (F-137-T8-1).
- **Kết luận H3:** VẪN MỞ, mức tin cậy không đổi (thấp). Để tiến lên cần một trong hai: (a) kẹt tái hiện trên WebKit với watchdog kích hoạt (probe 1+1 + ps/RSS + vite-HTTP sẽ phân biệt được "page JS chết" / "media pipeline kẹt" / "kênh chết" / "vite chết"); (b) kẹt tái hiện trên Chromium ở cùng pha (sẽ yếu đi H3 mạnh, hướng sang vite/app). Nếu nhiều đợt nữa 0 kẹt thì điều tra này không còn mẫu mới để tiến — parent cân nhắc đóng dạng "không tái hiện được".

## B5. Yếu tố chung khác — không đổi (đợt 136 §B5 vẫn đứng)

- Cùng boot? KHÔNG — 3 boot khác nhau (cc1f9de0, 8ae55060, 78b55838); đợt 137 chạy trên boot thứ tư (17db9652) không kẹt.
- Vite server còn sống lúc kẹt? VẪN KHÔNG CÓ BẰNG CHỨNG — nhưng cơ chế kiểm đã sẵn sàng (watchdog probe vite-HTTP + diag script), chỉ chờ kẹt thật.
- Tải từ luồng song song khác trong cửa sổ kẹt? Không có log top/ps nào trong cửa sổ kẹt cũ; đợt 137 load1 trong lúc chạy 0,73–3,61 (harness đang chạy bình thường) — không so sánh được với loadavg ~0,1 lúc kẹt.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ. H2: KHÔNG ỦNG HỘ (yếu thêm sau bằng chứng Balloon). H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- Yếu tố chung duy nhất đã chứng minh: cả ba đều là `page.evaluate` chờ trạng thái media element không trả, ngay sau một bước PASS, process idle, không verdict FAIL.
- **4 bước kiểm đợt 137 đã triển khai xong (1/2/3 chạy được, 4 sẵn sàng một nửa) — GIỮ NGUYÊN cho đợt sau, không cần triển khai lại:** watchdog ở trong 3 script harness (đã stage), cột Balloon ở trong driver, đối chứng Chromium chạy lại mỗi đợt (tăng N cộng dồn), diag script + baseline dmesg/journalctl chạy lại mỗi đợt. Khi có kẹt thật, watchdog + bước 4 sẽ tự kích hoạt — không cần quyết mới.
- Đề xuất nhỏ cho đợt sau (không cần quyết parent — chẩn đoán-only): tăng N đối chứng Chromium lên 2 lần mỗi pha nếu thời gian cho phép (cộng dồn N=1 đợt này → N=3 sau 2 đợt), để baseline Chromium dày hơn trước khi kết luận gì về H3.

## B7. Bằng chứng mới từ đợt 137 (lần chạy pass) — làm yếu thêm H2, lần thứ hai, nay có cột Balloon chứng minh cơ chế

- Trong lần chạy PASS hoàn toàn đợt này (09:58:43–10:14:20Z, 6/6 exit 0, không kẹt), RAM avail vẫn tụt **1.899 → 574 MB (−1.325 MB, min lúc 10:09:44Z trong pha Chromium 85m4)** theo `ram-137t8.log` (32 mẫu), trong khi load1 giữ 0,73–3,61 (harness đang chạy bình thường).
- **Mới so với đợt 136:** cột Balloon cho thấy trong cùng cửa sổ, balloon host tăng **4.865.912 → 5.796.056 kB (+908 MB, max lúc 10:06:44Z)** rồi xả về 5.289.808 kB cuối lượt. Tụt avail −1.325 MB đi cùng balloon +908 MB — tức phần lớn tụt avail là **balloon host bơm lên**, không phải process nào rò rỉ (không có RSS theo process, nhưng balloon tăng cùng chiều + cùng cỡ là bằng chứng cơ chế trực tiếp đầu tiên, không còn chỉ là tương quan).
- Mức tụt này CÙNG CỠ với mức tụt trong 3 lần kẹt (−735 / −480 / −1.088 MB) nhưng xảy ra KHÔNG có kẹt nào — lần thứ hai liên tiếp (sau §B7 đợt 136: −1.415 MB). H2 càng yếu: tụt RAM không phân biệt được lần chạy kẹt với lần chạy pass, và nay đã biết cơ chế tụt là balloon host.
- Hệ quả: H2 chỉ còn đứng ở dạng yếu nhất ("một cú tụt balloon thoáng qua kích hoạt kẹt rồi kẹt tự khóa") — dạng này không kiểm được bằng RAM sampler nữa (đã chứng minh tụt balloon xảy ra thường xuyên không kẹt); chỉ watchdog + probe lúc kẹt thật mới kiểm được.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round137-t8-viteharness.txt` — **4 file** (LIMITS này + 3 script harness đã thêm watchdog), đã verify read-back bằng `od -c` (NUL-delimited), 0 binary. Chi tiết kích thước: **LIMITS 39.672 B (VƯỢT 1.904 B — F-137-T8-8)**; 84l10 31.374 B (dưới); 85m4 35.820 B (dưới); **86n2 37.918 B (VƯỢT 150 B — F-137-T8-4, push cần `ENABLE_PRIVSEP=0`)**. Không sửa code app nên không có file production nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật — fixture chỉ sống trong `/tmp`, rebuild lại sau mỗi reboot). Dữ liệu thô: `hidden_files/round137-t8/` (wait-t4-t5-137t8.sh — deadline gõ tay, gia hạn 10:00Z→10:30Z→10:45Z; run-webkit-137t8.sh — Balloon + Chromium + diag-khi-124; run-webkit-137t8-retry84l10.sh — đã adapt nhưng KHÔNG dùng (6/6 pass lần đầu); rebuild-fixtures-137t8.sh; diag-stall-137t8.sh — script dump chẩn đoán bước 1/4; smoke/wait-t4-t5.log — GATE-FOUND poll 7 09:54:24Z (boot mới) + wait-t4-t5-boot2104246b.log (log waiter trên boot cũ, poll 1–32) + wait-t4-t5-deadline1000.log + wait-t4-t5-boot17db9652-pre1045.log (các bản log trước mỗi lần gia hạn deadline); smoke/run-webkit-summary.txt — ec webkit 0/0/0 + chromium 0/0/0; smoke/run-webkit-*.log + run-chromium-*.log + attempt1/; smoke/ram-137t8.log (32 mẫu, có balloon_kb); smoke/rebuild-fixtures.log (6/6 md5 khớp); smoke/tree-md5-{open,before-run,final}.txt — đều 530e10a7; smoke/baseline-{dmesg-tail50,journalctl-k,meminfo}.txt; smoke/stall-smoke-test-1794991642/ (smoke-test tay, KHÔNG phải kẹt thật); l10/m4/n2-scratch + *-scratch-chromium report JSON — cả 6 ok=True).
