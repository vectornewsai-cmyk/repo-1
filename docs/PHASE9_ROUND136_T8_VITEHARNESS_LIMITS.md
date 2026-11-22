# Đợt 136 T8 — Vite harness WebKit 84l10/85m4/86n2: 3/3 exit 0 ngay lần chạy đầu, 0 reboot — ĐIỀU TRA CHUNG ba lần kẹt "treo không trả mẫu"

Ngày: 18/11/2026 (lượt cron 12:35 +07 = 05:35Z; T8 mở 05:40Z, hạn cứng T10 08:00Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: (A) chờ cờ + chạy harness + LIMITS này; (B) ĐIỀU TRA CHUNG ba lần kẹt "treo không trả mẫu" (85m4 P1-phaseA + 86n2 P4-lần2 đợt 134; 84l10 W1-lần2 đợt 135) — CHỈ bằng chứng + giả thuyết kiểm được, KHÔNG đổi production, KHÔNG sửa harness. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND135_T8_VITEHARNESS_LIMITS.md (phương pháp: waiter gate, 3 harness, fixture rebuild md5, dọn dẹp) + docs/PHASE9_ROUND135_T4_WEBKIT_QUIET12_LIMITS.md.

## 0. Kết luận ngắn — 3/3 exit 0 lần chạy đầu, 0 reboot; điều tra: RAM tuyệt đối BÁC BỎ, WebKitGTK vẫn mở

- **Gate đủ 05:58:21Z (waiter poll 16, CHỈ 1 waiter, không reboot lúc chờ):** `round136-t4.done` + `POSTBOOT_PASS` boot `1ca1feaa` pass_at 05:48:02Z poll=2 (T5 — cờ tới nhanh, ~19 phút sau boot, như đợt 135).
- **Lượt yên #13 của T4 (ghi trong cờ, không phải số đo của T8): 1 attempt hợp lệ, 20/20 pass, median tickCost 58,0 ms (ngưỡng ≤60 ms GIỮ — biên chỉ 2 ms, CAO NHẤT trong 11 lượt hợp lệ), (c2)=1, coverage 1/1, lớp B 5/5, F6' ĐÓNG lần thứ 2 liên tiếp, logger nới KIỂM CHỨNG lần thứ 2 (loop 1–21, 20 wrap).**
- **Chạy 1 trên boot 1ca1feaa (05:59:39–06:07:46Z): 84l10 exit 0 (~78 s), 85m4 exit 0 (~136 s), 86n2 exit 0 (~243 s) — 3/3 exit 0 NGAY LẦN ĐẦU, không cần retry.** Cả ba pha từng kẹt (85m4 P1-phaseA, 86n2 P4-lần2, 84l10 W1-lần2) đều PASS lần này. **P3 không kẹt lần thứ tám liên tiếp.**
- **0 reboot trong suốt thời gian T8 làm việc (05:40–06:08Z)** — khác đợt 134 (5 reboot) và đợt 135 (1 reboot sau khi xong việc).
- **Fixture rebuild 1 lần: 6/6 md5 khớp đợt 125–135.**
- **Cây: preview.tsx `530e10a7` suốt lượt** (fix T3 KHÔI PHỤC theo quyết parent đợt 135 §12.3(a)); media.ts `2c384ed1`, vite.config.ts `ee80d093` giữ nguyên (mở / trước chạy / cuối lượt đều khớp).
- **Dọn sạch:** 0 process Xvfb/vite/MiniBrowser sót, `/tmp/.X11-unix/` chỉ còn X193 (của luồng khác), không `vite.lock`; lock `t8-round136` đã nhả đủ 3 lần giữ.
- **Điều tra chung (§B): giả thuyết "RAM tuyệt đối thấp gây kẹt" BÁC BỎ bằng 4 bằng chứng độc lập; "RAM tụt trong lúc kẹt là nguyên nhân" KHÔNG ỦNG HỘ (mức tụt nằm trong biên độ balloon host đã đo độc lập, và đợt này RAM tụt 3285→1870 MB trong một lần chạy PASS hoàn toàn); giả thuyết WebKitGTK treo VẪN MỞ nhưng chưa chứng minh (thiếu đối chứng Chromium + snapshot process lúc kẹt + dmesg các boot cũ đã mất).**

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 05:29:34 | Boot `1ca1feaa` lên (btime) |
| 05:35 | Lượt cron 12:35 +07 mở đợt 136; parent tạo `round-in-progress.md` |
| 05:40:47 | T8 mở: boot `1ca1feaa`, RAM avail 1462 MB, `/tmp/.X11-unix/` trống, 0 process; cây preview.tsx `530e10a7` (khớp quyết khôi phục fix) |
| 05:43:20 | Waiter bắt đầu poll 60 s (deadline 07:00Z, epoch 1794985200 đã kiểm chứng — gõ tay, không sed) |
| 05:48:02 | T5 viết `POSTBOOT_PASS` boot `1ca1feaa` (poll 2) — waiter thấy postboot=1 từ poll 6 |
| 05:58:21 | Waiter poll 16: **GATE-FOUND**, exit 0 (15 poll NOT-YET trước đó; T4.done đã có — lượt yên #13 20/20 pass, median 58,0 ms) |
| 05:59:28 | Kiểm cây trước chạy: 530e10a7 / 2c384ed1 / ee80d093; RAM avail 3479 MB |
| 05:59:28 | Rebuild fixture xong (~17 s): 6/6 md5 khớp |
| 05:59:39–06:00:57 | **84l10 exit 0** (~78 s, W1×3/W2/E4 PASS) |
| 06:01:12–06:03:28 | **85m4 exit 0** (~136 s, toàn bộ PASS; P5 CÓ-RESTART +1 ended-at-duration — xem F-136-T8-1) |
| 06:03:43–06:07:46 | **86n2 exit 0** (~243 s, toàn bộ PASS tới P6) |
| 06:08:20 | Kiểm cuối: cây không đổi (530e10a7), 0 process sót, X193 (luồng khác) còn, không `vite.lock`, boot vẫn `1ca1feaa` — **0 reboot cả lượt** |

## 2. Chuẩn bị — waiter deadline gõ tay đã kiểm chứng; script adapt từ đợt 135

- **Deadline waiter gõ TAY TRỰC TIẾP, không sed** (bài học đợt 132): `DEADLINE=$(date -d '2026-11-18 07:00:00 UTC' +%s)` = **1794985200**, lớn hơn epoch lúc viết (1794980556) đúng 4644 s (~77 phút); `bash -n` OK. Gate mở 05:58:21Z nên deadline không bị trigger — nhưng DEADLINE đã có giá trị hợp lệ, khác rỗng, suốt lượt.
- **Waiter chỉ 1 lần, không chết giữa lượt** (không reboot lúc chờ): đọc lại boot_id mỗi poll (bản vá đợt 134) đã có sẵn trong script đợt này từ đầu.
- Driver + fixture script adapt từ đợt 135 bằng sed `135→136` (đã grep kiểm: 0 ref `135` còn sót; `bash -n` OK). Timeout 900 s cho MỌI harness (quy định đợt 135). Script retry 84l10 đã adapt sẵn (timeout 900 s) nhưng KHÔNG cần dùng vì 3/3 exit 0 lần đầu.
- **F-136-T8-3:** log rebuild-fixtures lần đầu chỉ in ra stdout (chạy kèm `tail -15`, không redirect vào file) — đã kiểm lại md5 trực tiếp trên đĩa ngay sau đó và lưu vào `smoke/rebuild-fixtures.log` (6/6 khớp, xem §5). Số md5 đã kiểm chứng, chỉ có stdout gốc không lưu file.

## 3. Kết quả harness chi tiết — boot 1ca1feaa, Xvfb :199, lock t8-round136

### 84l10 — exit 0 (05:59:39–06:00:57Z, ~78 s)
- W1-lần1 PASS (đồng bộ 2,4 s, delta=+1, hạ-cánh-về-target=true), **W1-lần2 PASS (đồng bộ 1,3 s, delta=+1) — pha kẹt đợt 135 KHÔNG tái hiện**, W1-lần3 PASS (đồng bộ 0,8 s, delta=+1), W2 PASS (playhead cuối=30, restart tự nhiên Δ=0), E4 PASS (tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=7 → sau 3 s=7, ct cuối=4, ended=true, errors=0).
- `KẾT QUẢ: KHÔNG FAIL` — report `l10-scratch/l10-webkit-loop-w1-report.json` (33.177 B, ok=True).

### 85m4 hb128 — exit 0 (06:01:12–06:03:28Z, ~136 s)
- P1 PASS (không restart dư — **pha kẹt P1-phaseA đợt 134 KHÔNG tái hiện**), P2 PASS (reset 791 ms), **P3 PASS (0 restart — phát thường ổn định)**, P4-lần1/2/3 PASS (đồng bộ 2,0/1,4/2,0 s; delta=+1, hạ-cánh-về-target=true), P5 CÓ-RESTART (+1) — xem F-136-T8-1 (không phải kẹt).
- HB128: **19 dòng `sampleFor`** — đúng bằng đợt 133/134/135.
- `KẾT QUẢ: KHÔNG FAIL` — report `m4-scratch/m4-webkit-w7-report.json` (117.817 B, ok=True).

### 86n2 — exit 0 (06:03:43–06:07:46Z, ~243 s)
- P1 PASS (không restart dư), P2 PASS (reset 885 ms), **P3 PASS (0 restart)**, P4-lần1/2/3 PASS (đồng bộ 1,9/1,9/3,7 s; delta=+1, hạ-cánh-về-target=true) — **P4-lần2, pha kẹt đợt 134, PASS sau đồng bộ 1,9 s**, P5 PASS (seek kẹt dài nhất 1 mẫu ~0,2 s), **P6 KHÔNG-KẸT (element phát thường suốt 90 s chờ — 0 restart)**.
- `KẾT QUẢ: KHÔNG FAIL` — report `n2-scratch/n2-webkit-w7-report.json` (146.089 B, ok=True).

### Tổng hợp
- **3/3 exit 0 ngay lần chạy đầu, 0 TIMEOUT, 0 retry.** Không có kẹt mới nào trong đợt này.
- **P3 không kẹt lần thứ tám liên tiếp** có chạy tới P3 (đợt 131: lần 4; 132: không chạy — không tính; 133: lần 5; 134: lần 6; 135: lần 7; 136: lần 8 — 85m4 + 86n2 đều P3 PASS 0 restart).
- Ba lần kẹt đợt 134/135 đều KHÔNG tái hiện đợt này (lần thứ 2 liên tiếp cho 85m4 P1-phaseA và 86n2 P4-lần2 sau đợt 135; lần đầu cho 84l10 W1-lần2 sau retry đợt 135).

## 4. Lượt yên #13 — bối cảnh từ cờ T4 (không phải số đo của T8)

- T4 đóng với **1 attempt hợp lệ, 20/20 pass, median tickCost 58,0 ms (ngưỡng ≤60 ms GIỮ — biên chỉ 2 ms, CAO NHẤT trong 11 lượt hợp lệ trước: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 ms, trung bình 46,6 ms), (c2)=1, coverage 1/1, lớp B 5/5, F6' ĐÓNG lần thứ 2 liên tiếp, logger nới KIỂM CHỨNG lần thứ 2 (loop 1–21, 20 wrap)** — lượt yên hợp lệ thứ hai liên tiếp với logger nới (đợt 135: loop 1–22, 21 wrap).
- POSTBOOT_PASS cho boot 1ca1feaa tới nhanh (pass_at 05:48:02Z, poll 2 — ~19 phút sau boot), nên gate T8 mở được 05:58:21Z mà không cần gate thay thế (như đợt 135; khác đợt 134 phải dùng check-only trực tiếp cho retry).
- T8 không đo log draw, không phân tích (c2) — đó là việc T5 pha 2 / T3 bước 2.

## 5. Fixture rebuild — 6/6 md5 khớp (1 lần duy nhất)

- Rebuild 05:59:1xZ trên boot 1ca1feaa (~17 s): hevc `ba0c7c62`, i7 `f05daed8`, h-30s `fbaa3d1a` (×3: l10/m4/n2), g-4s `a1fb8549` — khớp đợt 125–135. ffprobe đúng spec; blend media bền kiểm tra đủ (ocean-a50 `f1e277f0`, slov-a085 `f4c35a6a`).
- 0 reboot trong lượt nên KHÔNG rebuild lần 2; fixture trong /tmp còn nguyên sau khi xong (đúng thiết kế — fixture chỉ sống trong /tmp, rebuild lại sau mỗi reboot, không có trong batch stage).

## 6. Dọn dẹp + kiểm cuối — đã dọn sạch (phần của T8)

- Trap `cleanup` của driver: kill Xvfb :199 (+ `kill -9` sau 2 s), unlink `/tmp/.X11-unix/X199` + `/tmp/.X199-lock`, kill cả nhóm RAM sampler (+ `pkill -f ram-136t8*.log` dự phòng).
- Kiểm cuối 06:08:20Z (trên boot 1ca1feaa): 0 process Xvfb/vite/MiniBrowser/WebKit; `/tmp/.X11-unix/` còn **X193** (của luồng khác — KHÔNG phải của T8, để nguyên); không có `/tmp/.X199-lock`; không có `vite.lock`.
- Lock `t8-round136`: nhả đủ 3 lần giữ — 84l10 giữ ~78 s nhả 06:00:57Z; 85m4 giữ ~136 s nhả 06:03:28Z; 86n2 giữ ~243 s nhả 06:07:46Z.
- RAM sampler log: `smoke/ram-136t8.log` (17 dòng, 05:59:36–06:07:36Z; avail 3285 → 1870 MB — xem §B7: RAM tụt trong một lần chạy PASS hoàn toàn).
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **"3/3 exit 0" đợt này là lần chạy đầu, không retry** — khác đợt 135 (84l10 cần retry). Không suy ra "84l10 luôn pass lần đầu" ngoài boot 1ca1feaa này.
2. **Ba lần kẹt đợt 134/135 vẫn là "treo không trả mẫu", không phải FAIL có verdict** (xem §B) — đợt này không có kẹt mới nên không thêm mẫu nào; điều tra §B dựa trên 3 mẫu cũ + 1 bằng chứng mới từ lần chạy pass đợt này (§B7).
3. **Cột "swap_used" trong `ram-136t8.log` thực chất là Mem used** — label sai từ script sampler gốc (đợt 128): `$3` của dòng `Mem:` trong `free -m` là used, không phải swap. Không trích số swap từ log này; chỉ dùng cột `avail`.
4. **Lượt yên #13 median 58,0 ms — biên chỉ 2 ms dưới ngưỡng 60 ms, cao nhất 11 lượt hợp lệ.** T8 chỉ ghi lại từ cờ T4, không phân tích nguyên nhân (đó là việc T4/T3); không suy ra xu hướng từ 1 số.
5. **85m4 P5 CÓ-RESTART (+1)** (F-136-T8-1) là restart tự nhiên ended-at-duration, harness verdict KHÔNG FAIL — không phải restart dư, không phải kẹt. Đừng trích thành "P5 fail".
6. **0 reboot trong cửa sổ T8 đợt này không có nghĩa nhịp reboot đã dừng** — đợt 134 có 5 reboot, đợt 135 có 1 reboot sau khi xong việc. T8 đợt sau vẫn phải chịu reboot (waiter đọc lại boot mỗi poll + backup log + retry trên boot mới nếu cần).

## 8. Sai số mới (F-136-T8-N)

- **F-136-T8-1 — 85m4 P5 CÓ-RESTART (+1), causeTag ended-at-duration (không phải kẹt, không phải fail):** P5 chạy 40 s sau reset (06:02:47–06:03:28Z); element chạm cuối clip (ct=30, dur=30, seeking=false, paused=true, ticksEndedTrue=1, endedFlippedThisTick=true) và restart +1 theo cơ chế W2 tự nhiên (restart khi ended-at-duration). Seek kẹt dài nhất chỉ 2 mẫu (~0,4 s). Harness verdict: `KẾT QUẢ: KHÔNG FAIL`. Khác đợt 135 (P5 PASS "không restart dư trong 40 s sau reset") — khác biệt này là do element chạm cuối clip trong cửa sổ P5 lần này, không phải hồi quy: cơ chế ended-at-duration đã được ghi trong chú thích harness ("restart tự nhiên (nếu có) phải là ended-at-duration (cơ chế W2)"). Ghi nhận để T3/T10 đối chiếu, không tự kết luận.
- **F-136-T8-2 — label "swap_used" sai (lặp lại từ đợt 128/134/135):** xem §7.3. Chỉ dùng cột `avail` trong `ram-136t8.log`.
- **F-136-T8-3 — log rebuild-fixtures lần đầu không lưu file:** xem §2. Số md5 đã kiểm lại trực tiếp trên đĩa và lưu vào `smoke/rebuild-fixtures.log` (6/6 khớp); chỉ stdout gốc không còn file riêng.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Điều tra chung ba lần kẹt (§B):** H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ (chưa chứng minh). Bước kiểm tiếp theo ở §B6 — quyết parent/T3, làm ở đợt sau, KHÔNG đổi production đợt này.
2. **Lượt yên #13 median 58,0 ms (biên 2 ms):** T4/T3 xem có cần theo dõi riêng không — T8 chỉ ghi nhận.
3. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; mù #55 mới (probe #55, T2 đợt 136); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

---

# PHẦN B — Điều tra chung ba lần kẹt "treo không trả mẫu" (quyết parent đợt 135 §12.3(d))

## B1. Chữ ký kẹt của cả ba lần (so sánh trực tiếp, đã kiểm trên đĩa)

| | Kẹt 1 | Kẹt 2 | Kẹt 3 |
|---|---|---|---|
| Đợt / harness / pha | 134 / 85m4 / P1-phaseA (sampleFor) | 134 / 86n2 / P4-lần2 (waitForPlaySync) | 135 / 84l10 / W1-lần2 (waitForPlaySync) |
| Boot | cc1f9de0 | 8ae55060 | 78b55838 |
| Uptime boot lúc kẹt | ~59 phút (btime 00:17:36Z, kẹt ~01:17:05Z) | ~6 phút (btime 01:31:18Z, kẹt ~01:37:17Z) | ~38 phút (btime 02:27:38Z, kẹt ~03:05:28Z) |
| Bắt đầu kẹt / dòng cuối trước im lặng | ~01:17:05Z; P1 settle 01:17:00Z (restart=1, events=1) | ~01:37:17Z; P4-lần1 PASS 01:37:17Z (đồng bộ 1,3 s, delta=+1) | ~03:05:28Z; W1-lần1 PASS 03:05:28Z (đồng bộ 0,6 s, delta=+1) |
| Im lặng bao lâu / kết thúc ra sao | 881 s; reboot #5 giết driver trước timeout 900 s (khung chết quan sát (01:31:40Z, 01:32:21Z]) — KHÔNG có exit code | ~821 s (13,7 phút); timeout kill 01:50:58Z, exit 124 | ~886 s; timeout kill 03:20:14Z, exit 124 |
| Dạng im lặng | HB128 Node vẫn tick 5 s/lần, 176 dòng, TẤT CẢ n=0/100, lastCt=? lastPlayhead=? seeking=? | Im lặng tuyệt đối, 0 dòng | Im lặng tuyệt đối, 0 dòng (log 33 dòng; dòng cuối có nội dung là W1-lần1 PASS) |
| RAM avail đầu → cuối kẹt | 1226 → 491 MB (−735 MB) | 1204 → 724 MB (−480 MB net; đáy 210 MB lúc 01:44:25Z rồi hồi 978 MB lúc 01:44:55Z) | 1437 → 349 MB (−1088 MB) |
| Loadavg lúc kẹt | → 0,13 (1-phút) | → 0,08–0,27 | → 0,13 |
| Lỗi / crash / OOM | Không có dòng FAIL/crash nào; dmesg boot cũ đã mất theo reboot; không core dump | Dòng HARNESS/FAIL duy nhất là lỗi do timeout kill đóng browser ("Target page, context or browser has been closed") — không phải verdict pha | Như kẹt 2; browser stderr chỉ có warning lúc khởi động (libEGL DRI3, Gtk session bus/dbus-launch, PipeWire/ALSA — đều trước W1-lần1 PASS) |
| Tái hiện? | KHÔNG (retry 85m4 cùng cây, boot 8ae55060, 2m09s PASS; đợt 135 + đợt 136 đều PASS) | KHÔNG (đợt 135 86n2 PASS 3m52s; đợt 136 PASS 4m03s) | KHÔNG (retry 5 phút sau cùng boot 78b55838, 69 s PASS; đợt 136 PASS 78 s) |

## B2. Điểm chung thật sự (đã kiểm)

1. Cùng cơ chế treo ở tầng Playwright: một lệnh `page.evaluate` không bao giờ trả kết quả. Bằng chứng quyết định cho kẹt 1: `sampleFor` lặp `await page.evaluate(STATE_FN)` mỗi 200 ms và `samples.push` sau mỗi lần trả — n giữ 0/100 suốt 881 s nghĩa là lệnh evaluate ĐẦU TIÊN trong sampleFor đã không trả (không phải trả về 0 mẫu). HB128 là setInterval phía Node ("Heartbeat chạy trên event loop Node nên vẫn ghi log ngay cả khi page.evaluate treo" — chú thích trong clicktest-85m4-webkit-w7-hb128.mjs) nên 176 dòng HB chỉ chứng minh NODE còn sống, KHÔNG chứng minh page còn sống.
2. Cả ba đều là bước "đồng bộ / lấy mẫu trạng thái media element" (đọc currentTime/paused/seeking/restartEndedVideo) và đều xảy ra NGAY SAU một bước PASS trong cùng lần chạy (P1 settle → sampleFor; P4-lần1 PASS → P4-lần2; W1-lần1 PASS → W1-lần2).
3. Cả ba đều idle trong lúc kẹt: loadavg 1-phút tụt về ~0,08–0,27 — process không bận (không phải vòng lặp CPU), phù hợp với chờ IPC/JS-main-thread/GStreamer hơn là treo do tải.
4. Cả ba đều không có verdict FAIL nào của pha: không dòng FAIL, không pageerror, không "Target crashed", không crash log, không core dump, không OOM ghi nhận được.

## B3. Kiểm giả thuyết RAM thấp

### H1 — "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (4 bằng chứng độc lập)
- (a) Kẹt 1 bắt đầu ở avail 1226 MB; retry 85m4 PASS bắt đầu ở 1203 MB — gần như cùng mức RAM, kết quả ngược nhau.
- (b) Kẹt 3 bắt đầu ở 1437 MB; retry 84l10 PASS bắt đầu ở chỉ 652 MB — thấp hơn nhiều mà vẫn pass trong 69 s.
- (c) Kẹt 2: avail hồi từ đáy 210 MB (01:44:25Z) lên 978 MB (01:44:55Z) trong lúc kẹt vẫn tiếp diễn tới 01:50:58Z — nếu RAM thấp là nguyên nhân trực tiếp, kẹt phải tự tháo khi RAM hồi.
- (d) Đợt 135 86n2 PASS toàn bộ (tới P6) trong khi avail chỉ ~493–557 MB suốt lần chạy (ram-135t8.log 03:25:42–03:26:42Z) — mức RAM thấp không kẹt.

### H2 — "RAM tụt trong lúc kẹt là nguyên nhân": KHÔNG ỦNG HỘ (chưa xác định được chiều nhân quả)
- Mức tụt trong 3 lần kẹt: −735 / −480 (net) / −1088 MB trong ~15 phút. Nhưng biên độ này NẰM TRONG dao động balloon của host đã đo ĐỘC LẬP với harness:
  - T9 đợt 135 ram-snapshot-1.log: 02:41:04Z Balloon 6.050.256 kB / avail 843.892 kB → 02:43:04Z Balloon 5.212.536 kB / avail 1.733.612 kB — balloon −838 MB, avail +890 MB trong 120 s, lúc KHÔNG chạy harness nào (T8 còn đang chờ gate).
  - T9 đợt 134: balloon dao động 5.977.872 → 5.256.064 → 4.179.380 kB trong đợt.
  - Kẹt 2 tự nó cho thấy swing balloon: avail 210 → 978 MB trong 30 s giữa lúc kẹt.
- KHÔNG có RSS theo process nào trong lúc kẹt (sampler chỉ ghi `free -m` + loadavg) nên không quy được tụt RAM cho process kẹt (MiniBrowser / WebKitWebProcess / vite / node).
- Yếu tố gây nhiễu thời lượng: lần chạy kẹt kéo dài ~15 phút, lần chạy pass chỉ 1–4 phút — một allocator nền chậm (balloon host, luồng khác trên VM chung) cũng tạo ra tụt lớn hơn trong cửa sổ 15 phút dù không liên quan tới kẹt.
- Kết luận H2: tụt RAM trong lúc kẹt là TƯƠNG QUAN, không phải bằng chứng nhân quả. Khả năng "một cú tụt balloon thoáng qua kích hoạt kẹt rồi kẹt tự khóa (không tự tháo khi RAM hồi)" vẫn mở, nhưng không có bằng chứng nào ủng hộ nó hơn giả thuyết ngược (kẹt gây rò rỉ / balloon gây tụt độc lập).

## B4. Kiểm giả thuyết WebKitGTK treo

- Ủng hộ (yếu): cả ba kẹt đều là `page.evaluate` im lặng trong MiniBrowser WebKitGTK 27.2 qua Xvfb; đều chạm trạng thái video element (GStreamer pipeline là thành phần chung); đều idle (loadavg ~0,1) — khớp mẫu deadlock main-thread/IPC hoặc pipeline GStreamer kẹt; không có crash/error nào trồi lên Playwright.
- Thiếu / chống: không có crash log, không "Target crashed", không lỗi GStreamer nào trong browser stderr (dump lúc đóng chỉ có warning khởi động); dmesg các boot kẹt đã mất theo reboot (dmesg hiện tại chỉ phủ boot 1ca1feaa); KHÔNG có lần chạy đối chứng Chromium cùng pha trên đĩa (T8 chỉ chạy webkit; các script có ENGINE=both nhưng không chạy Chromium ở đợt 134/135); không có snapshot trạng thái process (ps/RSS WebKitWebProcess/vite) nào lúc kẹt.
- Lưu ý: dòng `WebKitWebView is-controlled-by-automation set but automation is not allowed in the context` (CRITICAL, 03:05:18Z trong dump kẹt 3) là warning lúc KHỞI ĐỘNG trình duyệt, trước W1-lần1 PASS — không phải bằng chứng kẹt; và không đối chiếu được với lần chạy pass vì lần chạy pass không dump browser stderr (chỉ dump khi fail/đóng).
- Kết luận H3: VẪN MỞ — là giả thuyết khả dĩ nhất còn đứng, nhưng chưa được chứng minh; mức tin cậy thấp vì thiếu đối chứng.

## B5. Yếu tố chung khác — đã kiểm, đều loại trừ hoặc không có bằng chứng

- Cùng boot? KHÔNG — 3 boot khác nhau (cc1f9de0, 8ae55060, 78b55838).
- Cùng giờ trong ngày? KHÔNG — 01:17Z, 01:37Z, 03:05Z.
- Cùng uptime boot? KHÔNG — ~59 / ~6 / ~38 phút.
- Cùng pha? KHÔNG — P1-phaseA / P4-lần2 / W1-lần2.
- Cùng vite lock / luồng khác giữ lock? Không có bằng chứng trên đĩa (lock t8-round134/135 đều nhả đúng; không có log lock của luồng khác trong cửa sổ kẹt).
- Vite server còn sống lúc kẹt? KHÔNG CÓ BẰNG CHỨNG TRÊN ĐĨA — không probe nào kiểm tra vite (HTTP/kết nối) trong lúc kẹt ở cả ba lần. Vẫn mở.
- Tải từ luồng song song khác trong cửa sổ kẹt? Không có log top/ps nào trong cửa sổ kẹt (T9 snapshot gần nhất đợt 135 là 02:41–02:44Z, trước kẹt 3; đợt 134 không có snapshot trùng cửa sổ kẹt). Không kết luận được, nhưng loadavg ~0,1 trong lúc kẹt loại trừ khả năng VM bận CPU lúc đó.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production đợt này)

- H1 (RAM tuyệt đối thấp gây kẹt): BÁC BỎ.
- H2 (RAM tụt trong lúc kẹt là nguyên nhân): KHÔNG ỦNG HỘ — tương quan trong biên độ balloon, chiều nhân quả chưa xác định.
- H3 (WebKitGTK treo — deadlock/IPC/GStreamer): VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- Yếu tố chung duy nhất đã chứng minh: cả ba đều là `page.evaluate` chờ trạng thái media element không trả, ngay sau một bước PASS, process idle, không verdict FAIL.
- Đề xuất bước kiểm tiếp theo (quyết parent/T3, làm ở đợt sau — KHÔNG làm trong đợt này):
  1. Watchdog chẩn đoán trong harness: khi một `page.evaluate` im lặng >60 s, chụp `ps` RSS của MiniBrowser/WebKitWebProcess/vite/node + `/proc/meminfo` (kèm dòng Balloon) + thử một `page.evaluate` tầm thường (`1+1`) để phân biệt "page JS chết" / "media pipeline kẹt" / "kênh CDP chết"; kiểm tra vite còn trả HTTP không.
  2. Bổ sung cột Balloon vào RAM sampler (tách balloon host khỏi rò rỉ process).
  3. Chạy đối chứng Chromium cùng pha (84l10/85m4/86n2 bản Chromium) N lần: nếu Chromium không bao giờ kẹt ở các pha này thì H3 mạnh lên; nếu Chromium cũng kẹt thì H3 yếu đi, hướng sang vite/app.
  4. Lưu `dmesg` + `journalctl -k` sau mỗi lần kẹt (trước khi reboot xóa) — hiện tại dmesg các boot kẹt đã mất, không khôi phục được.

## B7. Bằng chứng mới từ đợt 136 (lần chạy pass) — làm yếu thêm H2

- Trong lần chạy PASS hoàn toàn đợt này (05:59:36–06:07:46Z, 3/3 exit 0, không kẹt), RAM avail vẫn tụt **3285 → 1870 MB (−1415 MB)** theo `ram-136t8.log` (05:59:36Z avail=3285MB → 06:07:36Z avail=1870MB), trong khi loadavg giữ ~1,1–1,9 (harness đang chạy bình thường).
- Mức tụt này CÙNG CỠ với mức tụt trong 3 lần kẹt (−735 / −480 / −1088 MB) nhưng xảy ra KHÔNG có kẹt nào. Đây là bằng chứng trực tiếp rằng tụt RAM avail ~1 GB trong cửa sổ vài–15 phút là chuyện thường xuyên trên VM này (balloon host + luồng song song khác) và KHÔNG đặc hiệu cho kẹt.
- Hệ quả: H2 càng yếu — tụt RAM không phân biệt được lần chạy kẹt với lần chạy pass, nên không thể dùng làm dấu hiệu giải thích kẹt.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round136-t8-viteharness.txt` — **1 file** (LIMITS này), đã verify read-back, 0 binary, < 37.768 B. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật — fixture chỉ sống trong `/tmp`, rebuild lại sau mỗi reboot). Dữ liệu thô: `hidden_files/round136-t8/` (wait-t4-t5-136t8.sh — deadline gõ tay 07:00Z epoch 1794985200 đã kiểm chứng; run-webkit-136t8.sh; run-webkit-136t8-retry84l10.sh — đã adapt nhưng KHÔNG dùng (3/3 pass lần đầu); rebuild-fixtures-136t8.sh; partB-draft.md — nháp điều tra; smoke/wait-t4-t5.log — GATE-FOUND poll 16; smoke/run-webkit-summary.txt — ec: 84l10=0 85m4=0 86n2=0; smoke/run-webkit-{84l10,85m4,86n2}.log + attempt1/; smoke/ram-136t8.log; smoke/rebuild-fixtures.log; smoke/tree-md5-{open,before-run,final}.txt — đều 530e10a7; l10/m4/n2-scratch report JSON — cả 3 ok=True).
