# Đợt 151 T8 — O8 PASS 3/3 SAU LƯỢT YÊN HỢP LỆ #19 (QUA GATE CHUẨN (i)) + HARNESS 2 KẸT THẬT 85m4 (2 BOOT, 2 NGUỒN LIB) + REBOOT #42 GIỮA HARNESS — H3-D1 BÁC BỎ, 85m4 KẸT 3/4 LẦN CHẠY GẦN NHẤT

Ngày: 20/11/2026 (lượt cron 09:35 +07 = 02:35:51Z; T8 mở ~02:37Z, đóng ~04:5xZ — trải 2 boot: `2e430750` rồi `fad2aab9` sau reboot #42 giữa harness). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy SAU LƯỢT YÊN HỢP LỆ #19, QUA GATE theo chuẩn đứng quyết (i); (2) harness đứng — 2 lần chạy driver, 2 boot (lần 1 system libs, lần 2 DEBROOT); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, KHÔNG revert — đợt này nó KÍCH HOẠT 2 LẦN, BẮT ĐÚNG 2 KẸT THẬT; (4) ĐIỀU TRA H3 CÓ GIỚI HẠN theo quyết parent đợt 150 §12.3 (g): đối chiếu 2 chẩn đoán live-diag đợt 150 + kiểm MỘT giả thuyết phân biệt H3-D1. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG sửa script O8 gốc, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND150_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 sau khi poller T4 thoát, T4 0 attempt; harness 2 kẹt thật 85m4 P1 + 86n2 P5; reboot #41 giữa harness; chuỗi FULL PASS 7 → 8; chuỗi "P3 không kẹt" 1 → 0 ĐỨT); aggregate đợt 150 §11, §12.3 parent (a)–(t) (quyết (f) nhãn "sau khi poller T4 thoát"; quyết (g) H3 mở điều tra có giới hạn giao T8-151; quyết (h) T5 repair sớm; quyết (o) checklist symlink mở đợt 151; quyết (i) mẫu xử lý reboot/mù).

## 0. Kết luận ngắn — O8 PASS 3/3 SAU LƯỢT YÊN HỢP LỆ, HARNESS 2 KẸT THẬT 85m4 + 1 LẦN BỊ REBOOT #42 GIẾT, H3-D1 BÁC BỎ

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (03:16:53–03:19:21Z, 2'28", boot `2e430750`, cùng cây preview.tsx `530e10a7` + cùng script O8 gốc md5 `ecbd1b40`, KHÔNG sửa). S1 PASS cả 3 lần (WebKit: 03:17:05 + 03:17:53, Playwright mouse click lần 2; Chromium: 03:18:50, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả hai engine (kiểm độc lập bằng python). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: QUA GATE THEO CHUẨN ĐỨNG QUYẾT (i) — LẦN ĐẦU SAU 3 ĐỢT LỆCH CHUẨN (148/149/150).** T4-151 có lượt yên hợp lệ mới #19 (attempt2 20/20 + lớp B 5/5 + tickCost median 39,0 ms ≤60, n=648); cờ `round151-t4.done` viết 03:15Z; waiter T8 GATE-FOUND poll 36 lúc 03:16:15Z (t4=OK + postboot đường (a) `round151-t5/POSTBOOT_PASS`); O8 bắt đầu 03:16:53Z, harness lần 1 bắt đầu 03:21:10Z — CẢ HAI SAU CỜ T4 VÀ SAU LƯỢT YÊN HỢP LỆ. **Nhãn trích: "harness sau lượt yên hợp lệ #19" — ĐÚNG CHUẨN (i), không cần nhãn lệch chuẩn.**
- **Chuỗi WebKit FULL PASS: 8 → 9 (chờ T10 xác nhận độc lập lúc đóng sổ)** — O8 WebKit 21/21 ×2 đợt này trên boot `2e430750`, sau lượt yên hợp lệ.
- **Harness lần 1 (boot `2e430750`, system libs sau replay tự nhiên): 84l10 PASS + 85m4 KẸT THẬT (P5-phaseB-long, exit chưa có — bị reboot #42 giết giữa lúc kẹt) + 86n2 KHÔNG CÓ VERDICT (chưa chạy đã bị giết theo driver) + Chromium CHƯA CHẠY.** Kẹt 3 của đợt (xem F-151-T8-2).
- **Harness lần 2 (boot `fad2aab9`, DEBROOT — system libs vắng): 84l10 PASS + 85m4 KẸT THẬT (exit 124, P1 waitForPlaySync, chữ ký đầy đủ) + 86n2 PASS (P1/P2/P3 PASS, P4 3/3 PASS, P5 PASS) + Chromium 3/3 PASS (exit 0, 04:41:42Z/04:43:57Z/04:48:03Z, report ok=true).** Kẹt 4 của đợt (xem F-151-T8-3).
- **2 KẸT THẬT trong một đợt — lần thứ hai liên tiếp (đợt 150 cũng 2 kẹt). Chuỗi "P3 không kẹt": 0 → 0 (VẪN ĐỨT, không tăng).** Cả 2 kẹt đều ở 85m4 (P5 lần 1, P1 lần 2), 2 boot khác nhau, 2 nguồn lib khác nhau (system libs vs DEBROOT). **85m4 đã kẹt 3/4 lần chạy gần nhất** (150-lần1 P1, 151-lần1 P5, 151-lần2 P1; chỉ 150-lần2 PASS) — xem F-151-T8-4. H3 VẪN MỞ — xem Phần B.
- **REBOOT #42 GIỮA HARNESS (F-151-T8-5):** btime /proc/stat 03:25:16Z (epoch 1795145116); boot `2e430750` → `fad2aab9`. Giết driver harness lần 1 giữa lúc 85m4 ĐANG KẸT (watchdog đã chụp chẩn đoán 03:25:09Z, probe 1+1 chưa kịp hoàn tất). Boot cũ sống 7.165 s (01:25:51Z → 03:25:16Z, stat→stat). Lock vite stale được chính lock script dọn (owner pid chết + không vite trên cổng + boot đổi — kiểm chứng bằng acquire/release thử 03:27:07Z trước khi chạy lại).
- **Boot mới `fad2aab9`: system libs VẮNG HOÀN TOÀN sau reboot** (khác boot `2e430750` đợt 150): 5/5 lib thiếu, không có thư mục GST, dpkg.log chỉ 2 dòng, cache 0 .deb — replay KHÔNG TỚI sau 12 phút quan sát (03:27–03:39Z, 12 poll). Watcher replay của T5 chết theo reboot #42, chưa có postboot cho boot mới lúc T8 chạy lần 2. **Harness lần 2 chạy bằng DEBROOT** (5/5 lib + 269 plugin GST còn nguyên) — tiền lệ đợt 149 lần 3.
- **Watchdog: KÍCH HOẠT 2 LẦN, BẮT ĐÚNG 2 KẸT (F-151-T8-6).** Kẹt 3: 03:25:09Z + diag 03:25:10Z (probe chưa hoàn tất do reboot giết). Kẹt 4: 03:42:50Z + diag 03:42:50Z + probe 1+1 TIMEOUT 30 s 03:43:20Z. 0 false-positive. **Checklist mở đợt (quyết (o)): symlink `t8-diag-stall.sh` ĐÃ cập nhật trỏ script đợt 151 NGAY khi dựng thư mục (02:39Z) — chẩn đoán kẹt 3 ghi ĐÚNG `round151-t8/smoke/` ngay lần đầu, không lặp lỗi F-150-T8-6.**
- **Balloon trong cửa sổ harness T8: 0 mẫu ghim trần cả 2 lần chạy** (lần 1: n=~10, max ~5,80M; lần 2: n=42, max 6.378.288 kB = 99,0% trần — sát trần nhưng không chạm). Sampler T8 chỉ đối chiếu trong cửa sổ harness, không phán chuỗi.
- **RAM avail min trong cửa sổ harness: lần 1 ~430 MB; lần 2 253 MB (03:55:30Z, trong lúc kẹt 4) — THẤP HƠN kỷ lục 272 MB đợt 148 theo sampler T8 (chờ T9 đối chiếu bằng sampler toàn đợt).**
- **T8 ĐÓNG 04:49Z — TRONG hạn cờ ~05:00Z, trước hạn cứng 05:30Z.**

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 01:25:51 | REBOOT #41 (đợt 150) — boot `2e430750`, TRƯỚC phiên đợt 151 |
| ~02:37 | T8 mở: RAM avail ~1.106 MB, balloon 5.677.928 kB; đọc LIMITS T8-150 + aggregate 150 §12.3 (f)(g)(o); cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 150 (không đổi) |
| 02:39 | **CHECKLIST (1): dựng thư mục `round151-t8`, copy script 150→151, cập nhật symlink `t8-diag-stall.sh` → `round151-t8/diag-stall-151t8.sh` NGAY (quyết (o))** |
| 02:40 | T4-151 mở poller (deadline 04:30Z); T5-151 postboot poll2 đã có cờ POSTBOOT_PASS 02:48:41Z cho boot `2e430750` |
| 02:41:09 | Waiter T8 bắt đầu (deadline 04:30Z, khớp poller T4-151); poll 1: t4=0 postboot=1 (đường (b) gate0wait live của T4) |
| 03:15 | **T4 viết cờ `round151-t4.done`: #22 CÓ LƯỢT HỢP LỆ MỚI #19** (attempt2 20/20, median 39,0 ms, lớp B 5/5) |
| 03:16:15 | **Waiter GATE-FOUND poll 36 (t4=OK + postboot đường (a))** — O8/harness được chạy theo chuẩn (i) |
| 03:16:49 | Fixture REBUILD lần 1: 6/6 md5 khớp đợt 125 |
| 03:16:53–03:19:21 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — SAU lượt yên hợp lệ #19 |
| 03:21:10–03:22:23 | **Harness lần 1, WebKit 84l10: PASS** (system libs, boot `2e430750`) |
| 03:22:39–~03:25:3x | **Harness lần 1, WebKit 85m4: KẸT THẬT P5-phaseB-long, bị REBOOT #42 giết giữa lúc kẹt** (watchdog 03:25:09Z; probe chưa hoàn tất) |
| 03:25:16 | **REBOOT #42** (btime /proc/stat; boot mới `fad2aab9`) |
| 03:27:07 | Kiểm chứng dọn lock stale: acquire thử THÀNH CÔNG ngay (lock script tự xóa lock stale vì boot đổi), release — lock TRỐNG |
| 03:27–03:39 | Chờ replay boot mới: 12 poll, dpkg vẫn 2 dòng, cache 0 — **replay KHÔNG TỚI**; watcher T5 chết theo reboot |
| 03:39:53 | Fixture REBUILD lần 2 (sau reboot #42 — /tmp đã mất): 6/6 md5 khớp đợt 125 |
| 03:39:59–04:00:55 | **Harness lần 2, WebKit qua DEBROOT: 84l10 PASS + 85m4 KẸT THẬT exit 124 (P1 waitForPlaySync) + 86n2 PASS** |
| 04:40:28–04:48:03 | **Harness lần 2, Chromium 84l10/85m4/86n2: 3/3 PASS (exit 0, report ok=true)** |
| 04:48–04:49Z | Kiểm cuối + LIMITS + stage file + cờ `round151-t8.done` |

## A. O8 — PASS 3/3 trên boot `2e430750`, SAU LƯỢT YÊN HỢP LỆ #19 (QUA GATE CHUẨN (i))

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 03:16:53–03:17:43 | 0 | **21/21 PASS** — S1 PASS 03:17:05 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 03:17:43–03:18:32 | 0 | **21/21 PASS** — S1 PASS 03:17:53, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 03:18:32–03:19:21 | 0 | **21/21 PASS** — S1 PASS 03:18:50 "checked=true → false, CDP mouse click lần 2" |

- Report JSON: `o8-webkit/o8w-clicktest-report.json` 21 kết quả `ok=true` 21/21; `o8-chromium/o8-clicktest-report.json` 21/21 `ok=true` (kiểm độc lập bằng python — WebKit chỉ 1 file JSON cho 2 attempt, như đợt 148/149/150; cả 2 attempt đều 21/21 trong log text `o8-151t8.log`). 0 dòng `HARNESS LỖI`, 0 `Target crashed`.
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã có trên boot `2e430750` — replay tới tự nhiên boot+4m22s). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness lần 1 (standard driver, không LD_LIBRARY_PATH).
- Driver O8 giữ 1 lock vite `t8-round151` suốt lượt (nhả 03:19:21Z; vite sau release curl 5560/5554 = 000000 — vite theo lượt đã xuống, đúng thiết kế).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-151t8.mjs`, `node --check` OK) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 8 → 9 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 150 = 8; đợt này T8 pass 21/21 ×2 trên boot `2e430750`, sau lượt yên hợp lệ #19.
- **O8 đợt này 2'28" tổng** (148: 4'03", 149: 2'32", 150: 3'03") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — 2 lần chạy driver, 2 boot

### Lần 1 — boot `2e430750`, 03:21:10–~03:25:3xZ (bị reboot #42 giết giữa lúc 85m4 đang kẹt)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 03:21:10–03:22:23 | **PASS** — report `ok=true` (W1 3/3 delta +1 sạch, W2 PASS, E4 PASS) |
| 2 | WebKit 85m4-hb128 | — | 03:22:39–~03:25:3x | **KẸT THẬT, KHÔNG CÓ VERDICT EXIT** — P5-phaseB-long đóng băng, watchdog 03:25:09Z, bị reboot #42 giết trước khi probe timeout hoàn tất (xem F-151-T8-2) |
| 3 | WebKit 86n2 | — | chưa chạy | **KHÔNG CÓ VERDICT** — reboot #42 giết driver trước khi chạy |
| 4 | Chromium 3 pha | — | chưa chạy | **KHÔNG CHẠY** lần 1 |

- 1 report JSON WebKit `ok=true` (84l10) + 0 report 85m4 (chưa có `finishedAt` — driver chết giữa chừng).
- Môi trường lần 1: system libs sau replay tự nhiên (5 lib apt-cài thật; GST thư mục thật 269 file; dpkg 1.545 dòng; cache 178 .deb; replay xong boot+4m22s; POSTBOOT_PASS T5 02:48:41Z poll=2). **WebKit launch THÀNH CÔNG cả 2 pha đã chạy** — kẹt là runtime, không phải lỗi launch.

### Lần 2 — boot `fad2aab9`, 03:39:59–04:00:55Z WebKit qua DEBROOT + Chromium [ĐANG CHẠY]

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 03:40:03–03:41:23 | **PASS** — report `ok=true` (W1 3/3 delta +1; đồng bộ 2,4/1,8/1,3 s) |
| 2 | WebKit 85m4-hb128 | **124** | 03:41:38–03:56:39 | **KẸT THẬT** — P1 waitForPlaySync đóng băng ngay từ đầu (xem F-151-T8-3) |
| 3 | WebKit 86n2 | 0 | 03:56:55–04:00:55 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 1,2/1,7/1,9 s; P5 PASS 40 s 0 restart) |
| 4 | Chromium 84l10 | 0 | 04:40:31–04:41:42 | **PASS** — report `ok=true` (W1 3/3, lần1 delta +2 — trôi +2 đã biết; W2 PASS, E4 PASS) |
| 5 | Chromium 85m4 | 0 | 04:41:57–04:43:57 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 1,0/1,0/1,0 s) |
| 6 | Chromium 86n2 | 0 | 04:44:12–04:48:03 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 0,5/0,5/1,0 s; P5 PASS 40 s 0 restart) |

- Môi trường lần 2: DEBROOT (LD_LIBRARY_PATH + GST_PLUGIN_PATH trỏ debroot; 5/5 lib + 269 plugin GST còn nguyên trong `~/workspace/tmp-q6r3-debroot/`). System libs trên boot mới VẮNG (xem F-151-T8-7). **WebKit launch THÀNH CÔNG cả 3 pha qua DEBROOT** — lỗi launch môi trường không tái hiện; kẹt runtime H3 còn nguyên.
- Fixture REBUILD 2 lần đợt này (lần 1 sau gate, lần 2 sau reboot #42): 6/6 md5 khớp đợt 125 cả 2 lần (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).

## 3. Watchdog trong lượt này — KÍCH HOẠT 2 LẦN, BẮT ĐÚNG 2 KẸT THẬT

- **Kẹt 3 (85m4 boot1, P5-phaseB-long):** watchdog (i) kích hoạt 03:25:09Z ("evaluate im lang >60s tai sampleFor-P5-phaseB-long"), diag script chạy xong 03:25:10Z; probe 1+1 CHƯA HOÀN TẤT (reboot #42 giết driver ~03:25:16Z giờ boot mới, trước mốc probe timeout ~03:25:40Z giờ boot cũ). Driver (1b) live-diag: **0 kích hoạt** — đúng thiết kế: HB128 in heartbeat mỗi 5 s nên log không bao giờ im >120 s. **Symlink diag ĐÚNG đợt 151 ngay lần đầu** (chẩn đoán ghi vào `round151-t8/smoke/stall-sampleFor-P5-phaseB-long-1795145109/` — checklist (o) đã kiểm chứng bằng kẹt thật).
- **Kẹt 4 (85m4 boot2, P1-waitForPlaySync):** watchdog (i) kích hoạt 03:42:50Z ("evaluate im lang >60s tai waitForPlaySync-P1"), diag script chạy xong 03:42:50Z; probe 1+1 TIMEOUT 30 s lúc 03:43:20Z ("kenh evaluate ket cung / page JS chet"). Driver (1b) live-diag: **0 kích hoạt** — HB128 giữ log sống (đúng thiết kế; (1b) chỉ bắt được kẹt ở pha không có heartbeat như 86n2 P5 đợt 150).
- **0 false-positive cả lượt.** 84l10 (cả 2 boot) + 86n2 lần 2 + O8 (3 lần): 0 dòng `WATCHDOG-137`.
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–150 §12.3(l)). Đợt này là lần thứ hai liên tiếp watchdog bắt được 2 kẹt trong một đợt.

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–151) + đường ổn định `t8-diag-stall.sh` → 151 (symlink cập nhật 02:39Z, TRƯỚC mọi lần chạy) | 4 lần chạy harness hoàn thành (84l10 ×2, 85m4 ×1 lần 2, 86n2 ×1 lần 2) + 1 lần 85m4 lần 1 bị reboot giết giữa kẹt + 3 lần chạy O8; **2 kẹt → 2 kích hoạt, 0 false-positive** | **BẮT ĐÚNG CẢ 2 KẸT.** 2 dòng `WATCHDOG-137` kẹt 3 (watchdog + diag), 3 dòng kẹt 4 (watchdog + diag + probe timeout) |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–151) | 4 lần chạy harness hoàn thành + 1 lần dở; `live_diags=0` mọi lần (cả 2 kẹt đều ở 85m4 có HB128) | **0 kích hoạt — ĐÚNG THIẾT KẾ** (log có heartbeat nên không im >120 s; (1b) chỉ bắt kẹt ở pha không heartbeat) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-151t8.sh` + bản debroot (cột `balloon_kb`) | 2 lần chạy driver → 2 log sampler (lần 1 n=9, lần 2 n=42) | Balloon lần 1 n=9 min=5.470.708 max=5.798.812 (90,0% trần), avail min=430 MB; lần 2 n=42 pinned=0 min=5.417.012 max=6.378.288 (99,0% trần) mean≈5,9M; avail min=253 MB (xem F-151-T8-8); **0 mẫu ghim trần** |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 04:41:42Z), 85m4 PASS (exit 0, 04:43:57Z), 86n2 PASS (exit 0, 04:48:03Z)** | N cộng dồn **N=13 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **2 lần kẹt → kích hoạt 2 lần** (stall-sampleFor-P5-phaseB-long + stall-waitForPlaySync-P1 + stall-webkit-85m4-timeout124) | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng — cả 2 boot. Lúc kẹt: vite HTTP 200 cả 2 lần (xem §B3) |

## 5. Cây + md5 — mở / cuối (KHÔNG ĐỔI)

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | ecbd1b40 | ecbd1b40 | Không (script O8 gốc, chỉ đọc) |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | 8911ad3d | 8911ad3d | Không (script O8 Chromium gốc, chỉ đọc) |

- Không sửa code app, không sửa script harness/O8 nào trong đợt này. Batch stage chỉ có LIMITS này (1 file) — như đợt 149/150. Driver trong hidden_files có 3 thay đổi nhỏ so với đợt 150: nhãn log `LIVE-DIAG-150` → `LIVE-DIAG-151`, deadline waiter 01:00Z → 04:30Z (khớp poller T4-151), lock `t8-round150` → `t8-round151` — cả ba chỉ là chuỗi/hằng số trong bản copy, không chạm script repo. Thêm mới: bản copy driver Chromium-only `run-chromium-151t8.sh` (tách từ driver chuẩn, chỉ chạy 3 pha Chromium — dùng cho lần 2 sau khi WebKit chạy qua DEBROOT); bản copy driver debroot `run-webkit-151t8-debroot.sh` — **ĐÃ DÙNG đợt này** (lần 2, system libs vắng).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round151` 03:19:21Z (giữ 148 s, 03:16:53–03:19:21Z); driver harness lần 1 bị reboot #42 giết (lock stale đã dọn bằng cơ chế của lock script, kiểm chứng acquire/release thử 03:27:07Z); driver lần 2 (debroot) đã nhả lock sau mỗi lần chạy (xem summary: released từng pha); driver Chromium đã nhả lock sau mỗi lần chạy (84l10 giữ 71 s, 85m4 giữ ~120 s, 86n2 giữ 231 s).
- Kiểm cuối 04:48:20Z: process Xvfb/MiniBrowser/WebKit/Chromium còn sót: 0; `/tmp/.X11-unix/` còn 0 file; lock vite: vite-lock-v2: TRỐNG (không có lock); boot `fad2aab9` ổn định (uptime xem lúc kiểm).
- Không kiểm lại TTS 39; không thử birefnet (RAM avail lúc chạy xuống 253 MB — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Harness đợt này KHÔNG PHẢI 6/6 trong một lần chạy driver, cũng KHÔNG PHẢI 6/6 cộng hai lần chạy.** Lần 1: 84l10 PASS + 85m4 KẸT (không verdict exit) + 86n2 CHƯA CHẠY + Chromium CHƯA CHẠY. Lần 2: 84l10 PASS + 85m4 KẸT exit 124 + 86n2 PASS + Chromium 3/3 PASS (exit 0, report ok=true). Đừng trích "harness 6/6" cho đợt này theo bất kỳ cách cộng nào.
2. **Gate đợt này QUA GATE THEO CHUẨN (i) — trích là "harness sau lượt yên hợp lệ #19"** (T4 flag 03:15Z; waiter GATE-FOUND 03:16:15Z; O8 03:16:53Z; harness lần 1 03:21:10Z). Đây là lần đầu sau 3 đợt lệch chuẩn (148/149/150) gate thỏa đúng chuẩn đứng. Lần 2 (sau reboot #42) chạy tiếp trên boot mới mà KHÔNG chờ T4 lại — theo tiền lệ đợt 150 (harness lần 2 sau reboot #41 cũng chạy tiếp, chỉ kiểm lock + libs); T4 đã đóng cờ, không đo nữa.
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã có trên boot `2e430750`. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness lần 1 (standard driver, không LD_LIBRARY_PATH).
4. **Harness lần 2 chạy bằng DEBROOT — với caveat KHÔNG có postboot T5 cho boot mới** (F-151-T8-7): watcher replay T5 chết theo reboot #42; T5 chưa viết POSTBOOT_PASS cho `fad2aab9` lúc T8 chạy lần 2. DEBROOT tự chứa đủ lib nên không cần postboot — nhưng đừng trích lần 2 là "chạy sau postboot".
5. **Chuỗi WebKit FULL PASS = 9 CHỜ T10 xác nhận độc lập** — T8 pass 21/21 ×2 đợt này (trên boot `2e430750`, sau lượt yên hợp lệ #19). Chuỗi này đếm O8, không bị 2 kẹt harness làm đứt.
6. **Chuỗi "P3 không kẹt" 0 → 0 (VẪN ĐỨT):** 2 kẹt đợt này (85m4 P5 lần 1 + 85m4 P1 lần 2). 86n2 lần 1 KHÔNG CÓ VERDICT (chưa chạy, reboot giết driver) — đừng đếm lần đó vào chuỗi pass/kẹt theo hướng nào. 85m4 lần 1 cũng KHÔNG CÓ VERDICT EXIT (bị reboot giết giữa lúc kẹt) — đếm là KẸT theo chữ ký playhead đóng băng + watchdog (xem F-151-T8-2), không đếm theo exit code.
7. **2 kẹt đợt này là KẸT RUNTIME H3, không phải lỗi launch/môi trường** — WebKit launch thành công mọi pha cả 2 boot (lần 1 system libs, lần 2 DEBROOT); vite HTTP 200 lúc kẹt; RAM lúc kẹt bắt đầu 580/495 MB (không tuyệt đối thấp); balloon 90,0/92,4% trần (không ghim). Đừng trích "WebKit fail" mà không kèm chữ ký kẹt đầy đủ.
8. **86n2 P4-lần2 PASS cả 2 lần chạy có verdict gần nhất** (đợt 150-lần-2 P4 3/3 PASS; đợt 151-lần-2 P4 3/3 PASS, đồng bộ 1,2/1,7/1,9 s) — pha nóng đợt 141/148 sạch 3 đợt liên tiếp tính theo lần chạy có verdict; kẹt đợt này rơi vào 85m4 (P5 lần 1, P1 lần 2), không phải P4. H3 vẫn mở, chưa giải thích cơ chế.
9. **Balloon KHÔNG ghim trần trong cửa sổ harness T8** (0 mẫu ghim cả 2 lần chạy, max ~99,0% trần lần 2) — nhưng sampler T8 chỉ phủ cửa sổ harness; chuỗi ghim trần phán bằng sampler T9 (giao T10).
10. **RAM avail min 253 MB (lần 2, 03:55:30Z, trong lúc kẹt 4) — THẤP HƠN kỷ lục 272 MB đợt 148 theo sampler T8** (chờ T9 đối chiếu bằng sampler toàn đợt trước khi ghi là kỷ lục mới). Balloon lúc đó 6.280.120 kB (97,5% trần), load 0,34.
11. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–151 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
12. **Chromium 84l10 W1 lần 2: lần1 delta +2 (0→2); lần2 delta +1 (2→3); lần3 delta +1 (4→5)** (đối chiếu trôi +2 các đợt 146–150 — lần1 +2 là artifact test đã biết, xem log run-chromium-84l10.log).

## 8. Sai số mới (F-151-T8-N)

- **F-151-T8-1 — GATE QUA CHUẨN (i) LẦN ĐẦU SAU 3 ĐỢT LỆCH CHUẨN:** T4-151 có lượt yên hợp lệ #19 (attempt2 20/20, tickCost median 39,0 ms ≤60, n=648, lớp B 5/5); cờ `round151-t4.done` viết 03:15Z; waiter T8 GATE-FOUND poll 36 lúc 03:16:15Z (t4=OK + postboot đường (a) POSTBOOT_PASS T5 02:48:41Z poll=2); O8 bắt đầu 03:16:53Z (sau cờ 1m53s), harness lần 1 bắt đầu 03:21:10Z. Khác đợt 148 (O8 chạy TRƯỚC khi T4 đóng), đợt 149 (sau cờ nhưng không có lượt hợp lệ), đợt 150 (sau khi poller thoát, T4 0 attempt). Attempt1 của T4 nhiễm tải (median 108,0 ms, B1+B2 vi phạm) rồi retry poll-lại-gate live thành công ở attempt2 — F-150-T4-3 (retry chưa kiểm chứng live) nay ĐÓNG. Cộng dồn (c2): P1 62/62, P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48; median chain 19 lượt, tb 48,9 ms.
- **F-151-T8-2 — KẸT THẬT #3: 85m4 WEBKIT P5-PHASEB-LONG ĐÓNG BĂNG, BỊ REBOOT #42 GIẾT GIỮA LÚC KẸT (BOOT `2e430750`, SYSTEM LIBS):** P1/P2/P3 PASS (03:23:13/29/53Z); P5 `sampleFor P5-phaseB-long` đóng băng: **n=3/200, lastCt=2.135, lastPlayhead=0, seeking=false, không đổi từ elapsed=25 s tới lúc bị giết (elapsed=85 s+ trong log cuối 03:25:34Z giờ boot cũ)** — video dừng hẳn ở ct≈2,14 s, playhead=0. Watchdog (i) 03:25:09.846Z (evaluate im lặng >60 s) + diag script 03:25:10.052Z; **probe 1+1 CHƯA HOÀN TẤT** — reboot #42 (btime 03:25:16Z giờ boot mới) giết driver trước mốc probe timeout ~03:25:40Z giờ boot cũ. **Phân loại: KẸT THẬT theo chữ ký playhead đóng băng + evaluate im lặng >60 s + watchdog — thiếu mỗi bước probe timeout do reboot cắt ngang, không phải do hồi phục** (không có dòng nào cho thấy video chạy lại; HB128 chỉ in vì heartbeat, sampleFor vẫn n=3/200). **RAM lúc kẹt bắt đầu (diag 03:25:10Z): avail 580 MB, balloon 5.798.812 kB (90,0% trần)** — không tuyệt đối thấp, không ghim trần → H1/H2 không được ủng hộ (xem Phần B). Vite HTTP 200 lúc chẩn đoán (03:25:10Z, 0,037 s) → vite sống, kẹt ở renderer/page WebKit. Load lúc chẩn đoán 1,62. WebProcess RSS 242.088 kB, CPU TIME 1:28 (đã chạy ~60% CPU trước khi đóng băng — khác kẹt 4, xem F-151-T8-3). **Kẹt KHÔNG tái diễn cùng pha ở lần 2 (86n2 P5 PASS; 85m4 lần 2 kẹt ở P1, không phải P5)** — kẹt không gắn với một pha cố định.
- **F-151-T8-3 — KẸT THẬT #4: 85m4 WEBKIT P1-WAITFORPLAYSYNC ĐÓNG BĂNG NGAY TỪ ĐẦU (BOOT `fad2aab9`, DEBROOT):** `waitForPlaySync P1` đóng băng ngay từ mẫu đầu: **playhead=0, ct=0.502, paused=true, seeking=false, playing=true — không đổi từ elapsed=5 s tới lúc bị giết (elapsed=135 s+)** — video chưa từng phát (ct kẹt ở 0,502 s, playhead=0). Watchdog (i) 03:42:50Z (evaluate im lặng >60 s) + diag 03:42:50Z + probe 1+1 TIMEOUT 30 s 03:43:20Z ("kenh evaluate ket cung / page JS chet"). Timeout 900 giết node 03:56:39Z, exit 124; không có report JSON (script chưa tới `KẾT QUẢ`). **RAM lúc kẹt bắt đầu: avail 495 MB (03:42:50Z), balloon 5.953.032 kB (92,4% trần)** — không tuyệt đối thấp, không ghim. Vite HTTP 200 lúc chẩn đoán (03:42:50Z, 0,028 s). Load lúc chẩn đoán 0,58. WebProcess RSS 282.344 kB, **CPU TIME chỉ 0:08 trên elapsed 01:08 (~7%)** — process gần như chưa làm việc gì đã đóng băng (khác kẹt 3: TIME 1:28). **2 kẹt trong 1 đợt, cùng phase 85m4 nhưng 2 điểm khác nhau (P5 vs P1), 2 boot khác nhau, 2 nguồn lib khác nhau (system libs vs DEBROOT)** — kẹt không gắn với một pha, một boot hay một nguồn lib cụ thể. Đây là bằng chứng live thứ 4 và thứ 5 cho H3 (sau 2 kẹt đợt 150).
- **F-151-T8-4 — 85m4 KẸT 3/4 LẦN CHẠY GẦN NHẤT (QUAN SÁT, KHÔNG KẾT LUẬN CƠ CHẾ):** 150-lần1 P1-phaseA kẹt, 150-lần2 PASS, 151-lần1 P5-phaseB-long kẹt, 151-lần2 P1-waitForPlaySync kẹt. Điểm kẹt khác nhau mỗi lần (P1-phaseA sampleFor, P5-phaseB-long sampleFor, P1-waitForPlaySync) — không phải một điểm pha cố định; điểm chung là workload 85m4 (clip 30 s, nhiều pha dài, heartbeat HB128). 84l10 PASS 4/4 lần chạy gần nhất (150 ×2 + 151 ×2); 86n2 PASS 3/3 lần chạy có verdict gần nhất (150-lần2 + 151-lần2; 150-lần1/151-lần1 không verdict do reboot). Ghi nhận để T8-152 đối chiếu tiếp; KHÔNG đổi script 85m4 trong đợt này (đổi giữa chừng sẽ làm vỡ chuỗi so sánh).
- **F-151-T8-5 — REBOOT #42: MỐC GIỜ + NGHỊCH LÝ ĐỒNG HỒ 18 S (LỚN NHẤT TỪ TRƯỚC TỚI NAY):** btime /proc/stat 03:25:16Z (epoch 1795145116); boot cũ `2e430750` sống 7.165 s (01:25:51Z → 03:25:16Z, stat→stat). Dòng log cuối của 85m4 lần 1 (HB128 elapsed=85 s) đóng dấu **03:25:34Z, muộn hơn btime boot mới đúng 18 s**; /proc/1 của boot mới bắt đầu 03:25:27Z, muộn hơn btime 11 s. Cùng họ vụ 7 s đợt 150 (T8-150 F-150-T8-10), 14 s đợt 149, 8 s đợt 148: đồng hồ boot cũ chạy nhanh hơn boot mới, không phải process sống sót qua reboot. Con số 18 s là lớn nhất chuỗi (8/14/7/18 s) — ghi nhận, không mở điều tra mới; tranh chấp clock giữ khoảng rộng e2 ∈ [313, 340] s theo quyết parent 149 (b). Mù #74? (reboot #42) giao T2-152; T8 không tự chốt giây reboot.
- **F-151-T8-6 — WATCHDOG KÍCH HOẠT 2 LẦN, BẮT ĐÚNG 2 KẸT; SYMLINK ĐÚNG NGAY LẦN ĐẦU (CHECKLIST (o) KIỂM CHỨNG BẰNG KẸT THẬT):** symlink `t8-diag-stall.sh` cập nhật 02:39Z (ngay khi dựng thư mục đợt, TRƯỚC mọi lần chạy — quyết (o)); chẩn đoán kẹt 3 ghi đúng `round151-t8/smoke/stall-sampleFor-P5-phaseB-long-1795145109/` ngay lần đầu, không lặp lỗi F-150-T8-6 (ghi nhầm sang thư mục đợt cũ). Kẹt 4 + diag timeout-124 cũng ghi đúng `round151-t8/smoke/`. (1b) live-diag 0 kích hoạt cả 2 kẹt (đúng thiết kế — 85m4 có HB128). 0 false-positive.
- **F-151-T8-7 — BOOT MỚI `fad2aab9`: REPLAY KHÔNG TỚI SAU 12 PHÚT QUAN SÁT + T5 CHƯA CÓ POSTBOOT CHO BOOT MỚI:** lúc T8 kiểm 03:27–03:39Z (12 poll, mỗi 60 s): dpkg.log vẫn 2 dòng (`startup packages configure` 03:25:48–49Z), cache 0 .deb, 5/5 lib thiếu, không có thư mục GST. Watcher replay của T5 (`replay-watch-151.sh`) chết theo reboot #42 (log cuối 03:25:21Z trên boot cũ); T5 chưa khởi động lại watcher / chưa viết POSTBOOT_PASS cho boot mới lúc T8 chạy lần 2 (kiểm 04:40Z: file mới nhất trong `round151-t5/` vẫn là `replay-watch-151.log` 03:25Z). T8 KHÔNG chờ T5 repair (quyết (h) giao T5 repair sớm — T5 tự triển khai; T8 không can thiệp lịch T5) mà chạy lần 2 bằng DEBROOT theo tiền lệ đợt 149 lần 3. Ghi rõ để T10 không đọc lần 2 là "chạy sau postboot boot mới".
- **F-151-T8-8 — RAM AVAIL MIN 253 MB (LẦN 2, 03:55:30Z) — THẤP HƠN KỶ LỤC 272 MB ĐỢT 148 THEO SAMPLER T8:** mẫu sampler T8 lúc 03:55:30Z (trong lúc kẹt 4, 85m4 P1): avail=253 MB, mem_used=7.680 MB, balloon_kb=6.280.120 (97,5% trần), load 0,34. Kỷ lục trước: 272 MB đợt 148 (sampler T8). Chờ T9 đối chiếu bằng sampler toàn đợt (phủ rộng hơn sampler T8) trước khi ghi là kỷ lục mới chính thức. Balloon max lần 2: 6.378.288 kB (99,0% trần) lúc 03:39:59Z (đầu lần 2) — sát trần nhưng 0 mẫu ghim (pinned=0/42).
- **F-151-T8-9 — WAIT-LOOP CỦA T8 BỊ HỦY 2 LẦN DO REBOOT/HỒI ÂM PGREP (LỖI VẬN HÀNH NHỎ, KHÔNG ẢNH HƯỞNG VERDICT):** vòng chờ harness lần 1 bị SIGTERM khi reboot #42 giết session exec (03:25:3xZ); vòng chờ harness lần 2 chạy đủ 60 poll tới 04:40Z dù harness đã xong 04:00:55Z — vì `pgrep -f "run-webkit-151t8-debroot.sh"` khớp luôn dòng lệnh của chính vòng chờ (hồi âm). Bài học: vòng chờ phải dùng `pgrep -f` với pattern loại trừ chính nó (vd `pgrep -f "[r]un-webkit..."`) hoặc kiểm tra PID cụ thể, không pgrep theo tên script trần. Không mất dữ kiện (summary + log đầy đủ trên đĩa).

## 9. Nợ cho đợt sau / cần quyết parent

1. **2 kẹt thật 85m4 trong 1 đợt (F-151-T8-2/3) — H3 vẫn mở, điều tra có giới hạn đợt 151 đã xong phần của T8 (H3-D1 bác bỏ — xem Phần B).** Kẹt không gắn pha/boot/nguồn lib; 85m4 kẹt 3/4 lần chạy gần nhất (xem F-151-T8-4). Chuỗi "P3 không kẹt" 0 → 0 (vẫn đứt). Quyết đóng/mở lại điều tra là việc parent.
2. **Chuỗi WebKit FULL PASS = 9 (chờ T10 xác nhận độc lập bằng O8 lúc đóng sổ đợt 151, trên boot `2e430750`, sau lượt yên hợp lệ #19).**
3. **Đối chứng Chromium cùng pha: N cộng dồn N=13 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **#22 CÓ LƯỢT HỢP LỆ MỚI #19 — ĐÓNG HAY VẪN MỞ?** (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng.) T4-151: attempt2 20/20 + lớp B 5/5 + median 39,0 ms; cộng dồn (c2) P1 62/62, P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48. Nếu #22 được tính là ĐÓNG thì đây là lượt yên hợp lệ đầu tiên sau nhiều đợt mở — T4/T10 phán.
5. **Reboot #42 / mù #74? — giao T2-152** (btime 03:25:16Z stat; boot cũ sống 7.165 s; nghịch lý đồng hồ 18 s — lớn nhất chuỗi; xử lý theo mẫu T10-148).
6. **Replay boot mới không tới + T5 chưa có postboot cho boot mới (F-151-T8-7)** — nợ T5-152 (repair sớm theo quyết (h) đã giao T5-151 nhưng watcher chết theo reboot; T5 tự xử lý).
7. **RAM avail min 253 MB — chờ T9 đối chiếu** (F-151-T8-8); balloon max 99,0% trần trong cửa sổ harness lần 2 — chuỗi ghim trần phán bằng sampler T9 (giao T10).
8. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần thứ năm liên tiếp (chờ T9-151 xác nhận); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; V19 đã nối vào `test_integration.sh` hay chưa (quyết (j) giao T0-151 — chờ T0).
9. **F-151-T8-9 (vòng chờ pgrep hồi âm):** ghi vào checklist vận hành T8-152 — vòng chờ kiểm PID cụ thể, không pgrep tên script trần.

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 151 (2 KẸT THẬT MỚI 85m4 + H3-D1 BÁC BỎ)

## B1. Trạng thái giả thuyết sau đợt 151

| Giả thuyết | Trạng thái đợt 150 | Trạng thái đợt 151 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên, thêm 2 bằng chứng âm)** | Kẹt 3 bắt đầu lúc avail 580 MB; kẹt 4 bắt đầu lúc avail 495 MB — cả hai đều xa mức thấp tuyệt đối (min phiên T8 253 MB; kỷ lục 272 MB đợt 148). Balloon lúc bắt đầu kẹt 90,0% / 92,4% — không ghim |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên, thêm bằng chứng phân biệt)** | Xem H3-D1: RAM tụt trong lúc kẹt là do balloon host + kernel reclaim, không phải process kẹt gây ra |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — ĐƯỢC ỦNG HỘ MẠNH THÊM (2 bằng chứng live mới) | **VẪN MỞ — ĐƯỢC ỦNG HỘ THÊM (2 bằng chứng live mới, tổng 4 kẹt/2 đợt) + THU HẸP: wedge "chết lặng"** | 2 kẹt mới đều đúng chữ ký (evaluate im lặng >60 s → probe timeout / playhead đóng băng; vite HTTP 200), ở 2 điểm khác nhau của 85m4, 2 boot, 2 nguồn lib. H3-D1 bác bỏ "leak/spin" — kẹt là wedge chết lặng (idle, không spin, không leak) |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt (leak/spin) — RAM tụt là hệ quả của kẹt" | — (mới, đợt 151) | **BÁC BỎ** | Xem §B1a dưới |

## B1a. Kiểm H3-D1 — ĐỐI CHIẾU 2 CHẨN ĐOÁN LIVE-DIAG ĐỢT 150 (01:40:25Z/01:44:25Z) + WATCHDOG DIAG (QUYẾT (g))

**Giả thuyết phân biệt H3-D1 (do T8-151 đề xuất):** "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt (leak/spin) — RAM tụt là hệ quả của kẹt." Dự đoán phân biệt: nếu đúng, RSS và/hoặc CPU TIME của WebKitWebProcess phải TĂNG đơn điệu trong lúc kẹt; nếu sai, RSS/CPU đứng yên hoặc giảm trong khi balloon tăng. Nguồn: `hidden_files/round150-t8/smoke/stall-*/` (kẹt 2 đợt 150, 86n2 P5, boot `2e430750`). Trần balloon: 6.443.824 kB.

| Thời điểm | Nguồn | MemAvail | Balloon (% trần) | WebProcess RSS | WebProcess CPU TIME | MiniBrowser RSS / TIME | Network RSS | Swap used | Load1 | vite HTTP |
|---|---|---|---|---|---|---|---|---|---|---|
| 01:37:52Z | watchdog (i) | 700.200 kB (684 MB) | 5.779.160 (89,7%) | 353.316 kB | 1:24 (84 s) | 250.988 / 0:25 | 62.276 | 341 MB | 0,91 | 200 (0,017 s) |
| 01:40:25Z | live-diag #1 | 421.404 kB (412 MB) | 6.027.988 (93,5%) | 271.344 kB (−23%) | 1:29 (89 s) | 176.424 / 0:25 | 35.464 | 346 MB | 0,25 | 200 (0,007 s) |
| 01:44:25Z | live-diag #2 | 454.772 kB (444 MB) | 6.041.992 (93,8%) | 215.256 kB (−39% tổng) | 1:37 (97 s) | 147.984 / 0:26 | 19.420 | 367 MB | 0,06 | 200 (0,015 s) |
| 01:50:26Z | timeout-124 (sau kill) | 1.018.464 kB (995 MB) | 5.965.600 (92,6%) | — (process đã chết) | — | — | — | 417 MB | 2,98 | 000 (driver chết) |

- CPU WebProcess: +5 s trong 153 s tường (01:37:52→01:40:25) và +8 s trong 240 s tường (01:40:25→01:44:25) — ~3,3% CPU, tức process gần như ĐỨNG YÊN, không quay vòng (spin).
- VSZ WebProcess KHÔNG ĐỔI cả 3 snapshot trong lúc kẹt: 75.577.016 kB — rò rỉ bộ nhớ sẽ làm VSZ/RSS tăng; ở đây RSS giảm đơn điệu trong khi VSZ đứng yên = page bị kernel reclaim/swap-out.
- Cả 3 process WebKit cùng co lại: WebProcess −39%, MiniBrowser −41% (250.988→147.984), NetworkProcess −69% (62.276→19.420). Đây là reclaim toàn hệ thống dưới áp lực balloon, không phải hành vi riêng của process kẹt.
- Swap used bò lên 341→346→367 MB trong lúc kẹt, rồi 417 MB sau khi driver chết — phù hợp balloon host phồng (5,78M→6,04M) ép kernel swap-out page nhàn rỗi.
- Sau khi timeout 900 giết driver (01:50:25Z), MemAvail hồi lên 995 MB — RAM được giải phóng khi process kẹt chết, đúng như kỳ vọng khi process kẹt là nạn nhân giữ RAM chứ không phải thủ phạm ăn RAM.
- **Kết quả: H3-D1 BÁC BỎ.** RAM tụt trong lúc kẹt (700→421 MB) đi kèm balloon host phồng 5,78M→6,03M — tức RAM tụt là do balloon host + kernel reclaim page của process đang kẹt (nạn nhân), KHÔNG phải process kẹt gây ra. Kẹt là wedge thuần túy ở tầng renderer/page (evaluate không trả về, page JS chết, vite vẫn HTTP 200 cả 3 snapshot trong lúc kẹt, load tụt 0,91→0,06).

**Đối chiếu chéo với kẹt 1 đợt 150 (chỉ có 1 snapshot trong lúc kẹt — không có live-diag vì HB128 giữ log sống):** watchdog 01:10:38Z: avail 838.744 kB (819 MB), balloon 5.376.852 (83,4%), WebProcess RSS 326.608 kB, TIME 0:13, vite 200 (0,014 s), load 0,77, swap 423 MB. Điểm bắt đầu xa mức thấp tuyệt đối — củng cố H1 bác bỏ; không có quỹ đạo thứ hai nên không dùng để kiểm H3-D1.

**Bằng chứng mới đợt 151 (2 kẹt, mỗi kẹt 1 snapshot trong lúc kẹt — không có live-diag vì cả 2 đều ở 85m4 có HB128):**

| Kẹt | Watchdog diag | MemAvail | Balloon (% trần) | WebProcess RSS | WebProcess CPU TIME / elapsed | vite HTTP | Load1 |
|---|---|---|---|---|---|---|---|
| Kẹt 3 — 85m4 P5, boot `2e430750`, system libs | 03:25:10Z | 594.132 kB (580 MB) | 5.798.812 (90,0%) | 242.088 kB | 1:28 / 02:27 (~60% — đã chạy rồi mới đóng băng) | 200 (0,037 s) | 1,62 |
| Kẹt 4 — 85m4 P1, boot `fad2aab9`, DEBROOT | 03:42:50Z | 506.640 kB (495 MB) | 5.953.032 (92,4%) | 282.344 kB | 0:08 / 01:08 (~7% — đóng băng gần như ngay khi bắt đầu) | 200 (0,028 s) | 0,58 |

- Hai kẹt mới cho thấy 2 dạng đóng băng: kẹt 3 "chạy rồi đóng băng" (TIME 1:28, P1–P3 PASS xong mới kẹt ở P5) và kẹt 4 "đóng băng ngay từ đầu" (TIME 0:08, video chưa từng phát, ct kẹt 0,502 s). Cả hai đều có RSS ở mức bình thường (~240–280 MB, cùng cỡ kẹt 1/2 đợt 150: 327/353 MB) — không có dấu hiệu leak tại thời điểm watchdog chụp.
- Hạn chế: 2 kẹt mới chỉ có 1 snapshot trong lúc kẹt mỗi kẹt nên KHÔNG kiểm được quỹ đạo RSS/CPU trong lúc kẹt (khác kẹt 2 đợt 150 có 3 snapshot). Kết luận H3-D1 dựa vào kẹt 2 đợt 150 (quỹ đạo đầy đủ); 2 kẹt mới chỉ củng cố điểm bắt đầu (không leak/không spin tại thời điểm chụp, vite 200, RAM không thấp tuyệt đối).

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 151

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–151) + đường ổn định `t8-diag-stall.sh` → 151 (symlink cập nhật 02:39Z, TRƯỚC mọi lần chạy) | 4 lần chạy harness hoàn thành + 1 lần 85m4 lần 1 bị reboot giết giữa kẹt + 3 lần chạy O8; **2 kẹt → 2 kích hoạt** | **BẮT ĐÚNG CẢ 2.** Kẹt 3: 2 dòng `WATCHDOG-137`; kẹt 4: 3 dòng (watchdog + diag + probe timeout); 0 false-positive |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–151) | 5 lần chạy harness; `live_diags=0` mọi lần | **0 kích hoạt — ĐÚNG THIẾT KẾ** (cả 2 kẹt đều ở 85m4 có HB128 giữ log sống) |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy, cả bản debroot) | 2 log sampler (lần 1 n≈10, lần 2 n=42) | Balloon lần 2 n=42 pinned=0 min=5.417.012 max=6.378.288 (99,0% trần); avail min=253 MB (xem F-151-T8-8); **0 mẫu ghim trần 6.443.824 kB** |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 04:41:42Z), 85m4 PASS (exit 0, 04:43:57Z), 86n2 PASS (exit 0, 04:48:03Z)** | N cộng dồn **N=13 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **2 lần kẹt → kích hoạt 2 lần + 1 timeout-124 (kẹt 4)** | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng. Lúc kẹt: vite HTTP 200 cả 2 lần; kẹt 3 thiếu diag timeout-124 (reboot giết driver trước) — ghi rõ, không bịa |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3 + đợt 148 §B3 + đợt 150 §B3), bổ sung đợt 151

- **Kẹt 3 — 85m4 P5-phaseB-long (boot1, system libs):** P1/P2/P3 PASS xong; `sampleFor P5-phaseB-long elapsed=… n=3/200 lastCt=2.135 lastPlayhead=0 seeking=false` (không đổi từ elapsed=25 s); `WATCHDOG-137: evaluate im lang >60s tai sampleFor-P5-phaseB-long`; diag script xong 03:25:10Z; **probe 1+1 CHƯA HOÀN TẤT — reboot #42 giết driver**; không có report JSON (script chưa tới `KẾT QUẢ`). Playhead đóng băng ở ct≈2,14 s, playhead=0.
- **Kẹt 4 — 85m4 P1-waitForPlaySync (boot2, DEBROOT):** video chưa từng phát; `waitForPlaySync P1 elapsed=… resets=0 playhead=0 ct=0.502 paused=true seeking=false playing=true` (không đổi từ elapsed=5 s); `WATCHDOG-137: evaluate im lang >60s tai waitForPlaySync-P1`; `WATCHDOG-137 probe waitForPlaySync-P1: probe-1+1 TIMEOUT 30s`; exit 124 sau timeout 900 (giết node 03:56:39Z). Không có dòng P2/P3/P4/P5 nào (kẹt ngay P1).
- **Điểm chung 2 kẹt:** vite HTTP 200 (0,037 s / 0,028 s) — vite sống; MiniBrowser + WebKitWebProcess + node đều còn sống (ps-top); load thấp (1,62 / 0,58); RAM lúc bắt đầu kẹt không tuyệt đối thấp (580/495 MB); balloon không ghim (90,0% / 92,4%). **Phân biệt với fail launch:** không có `MiniBrowser: error while loading shared libraries`, không exit 127, không chết sau ~10 s — kẹt 3 sau ~3 phút chạy bình thường (P1–P3 PASS xong); kẹt 4 sau ~1 phút (video chưa phát nhưng process đã lên, P1 đang chờ đồng bộ).
- 86n2 WebKit P4-lần2 PASS lần 2 (đồng bộ 1,2 s) — pha nóng đợt 141/148 sạch 3 đợt liên tiếp tính theo lần chạy có verdict; P5 86n2 PASS 40 s 0 restart (lần 2) — khác kẹt P5 86n2 đợt 150. Kẹt đợt này rơi vào 85m4, không phải 86n2.

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 151: 2 KẸT, CHUỖI 0 → 0 (VẪN ĐỨT)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL**. Chuỗi **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **1 → 2**.
- Đợt 144: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **2 → 3**.
- Đợt 145: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **3 → 4**.
- Đợt 146: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **4 → 5**.
- Đợt 147: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **5 → 6**.
- Đợt 148: **6 lần chạy harness, 1 KẸT (86n2 WebKit, P4-lần2, exit 124), 0 FAIL oan** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **6 → 0 (ĐỨT)**.
- Đợt 149: **8 lần chạy harness hoàn thành, 0 KẸT** (lần 1: WebKit 84l10/85m4 PASS + 86n2 KHÔNG VERDICT do reboot; lần 2: WebKit 0/3 FAIL LAUNCH môi trường + Chromium 3/3 PASS; lần 3: WebKit 3/3 PASS qua DEBROOT) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **0 → 1**.
- Đợt 150: **5 lần chạy harness hoàn thành, 2 KẸT (85m4 P1-phaseA boot1 + 86n2 P5-resetPlayhead0 boot2, cả hai exit 124)** + 1 lần 86n2 KHÔNG VERDICT (reboot #41 giết giữa P4) + **3 lần chạy O8, 0 kẹt, 0 FAIL** + Chromium lần 2 84l10 PASS (exit 0, 01:51:51Z), 85m4 PASS (exit 0, 01:54:07Z), 86n2 PASS (exit 0, 01:58:12Z). Chuỗi **1 → 0 (ĐỨT)**.
- Đợt 151: **4 lần chạy harness hoàn thành, 2 KẸT (85m4 P5-phaseB-long boot1 + 85m4 P1-waitForPlaySync boot2, 1 exit 124 + 1 không verdict exit do reboot #42 giết giữa lúc kẹt)** + 1 lần 85m4 KHÔNG VERDICT EXIT (reboot giết — nhưng đếm là KẸT theo chữ ký, xem F-151-T8-2) + 1 lần 86n2 KHÔNG VERDICT (chưa chạy, reboot giết driver) + **3 lần chạy O8, 0 kẹt, 0 FAIL** + Chromium lần 2 84l10 PASS (exit 0, 04:41:42Z), 85m4 PASS (exit 0, 04:43:57Z), 86n2 PASS (exit 0, 04:48:03Z). Chuỗi **0 → 0 (VẪN ĐỨT)**.
- **Chín lần kẹt vẫn là:** đợt 134/135 (3 lần) + đợt 141 (1 lần) + đợt 148 (1 lần) + đợt 150 (2 lần) + đợt 151 (2 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=13 mỗi pha tới đợt 151, 0 kẹt).

## B5. Yếu tố chung khác — đợt 151: #22 CÓ lượt hợp lệ #19; reboot #42 giữa harness; replay boot mới không tới

- T4 đợt này: **CÓ lượt hợp lệ #19** (attempt2 20/20, median 39,0 ms, lớp B 5/5) sau attempt1 nhiễm tải (median 108,0 ms) + retry poll-lại-gate live thành công — F-150-T4-3 ĐÓNG. Gate harness QUA CHUẨN (i) lần đầu sau 3 đợt lệch chuẩn. Kẹt probe T4 (nếu có) và kẹt harness T8 (evaluate im lặng) là hai chữ ký khác nhau — đừng gộp thành một lỗi.
- Reboot #42 (03:25:16Z) giết harness lần 1 giữa lúc 85m4 ĐANG KẸT — không phải kẹt, không liên quan H1/H2/H3 (nhưng cắt ngang probe timeout của kẹt 3, xem F-151-T8-2). Vite server còn sống lúc chạy harness (vite-http 200 khi launch + lúc kẹt — các lần kẹt đều có vite 200).
- 2 kẹt đều là lỗi runtime WebKitGTK thuần túy (launch thành công, rồi evaluate đóng băng) — đã chứng minh bằng vite HTTP 200 + process còn sống + chạy lại cùng pha trên boot khác cho kết quả khác (85m4 P5 kẹt lần 1 nhưng 86n2 P5 PASS lần 2; 85m4 P1 kẹt lần 2 nhưng 84l10/86n2 PASS cùng boot). Không phải bằng chứng cho hay chống lại H1/H2 (cả hai đều đã bác/không ủng hộ từ trước).
- Replay apt: tới tự nhiên trên boot `2e430750` (xong boot+4m22s, cache 178 sống — chuỗi 0 .deb 2 lần ĐỨT) rồi KHÔNG TỚI trên boot `fad2aab9` (12 phút quan sát, dpkg 2 dòng, cache 0) — mẫu "replay chết" không phải vĩnh viễn cũng không phải đã hết; T5 theo dõi đợt 152.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (đứng nguyên, thêm 2 bằng chứng âm). H2: KHÔNG ỦNG HỘ (đứng nguyên). H3: VẪN MỞ, được ủng hộ thêm bằng 2 bằng chứng live mới (tổng 4 kẹt/2 đợt) + thu hẹp thành wedge "chết lặng" (idle, không spin, không leak — H3-D1 bác bỏ). Cơ chế deadlock/IPC/GStreamer cụ thể vẫn chưa xác định.
- **H3-D1: BÁC BỎ (xem §B1a).** Đây là giả thuyết phân biệt duy nhất kiểm trong đợt 151 theo quyết (g) — không mở điều tra không giới hạn; giám sát thụ động tiếp tục.
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143; đợt này O8 PASS 3/3 thường kỳ, SAU LƯỢT YÊN HỢP LỆ #19, chuỗi FULL PASS 8 → 9 (chờ T10 xác nhận độc lập).** Không mở điều tra mới về O8; nếu O8 WebKit FAIL lại ở đợt 152 thì mở điều tra lại từ đầu.
- **Lượt yên #22 CÓ lượt hợp lệ mới #19 — gate harness đợt này QUA GATE theo chuẩn (i).** Không còn lệch chuẩn gate họ F-146/147/148/149/150 — chờ T4/T10 phán #22 đóng hay vẫn mở.
- **Bản vá watchdog đợt 142 GIỮ NGUYÊN, không revert** (đã kiểm chứng bằng 2 kẹt thật đợt này; (1b) 0 kích hoạt là đúng thiết kế với 85m4 có HB128). Nếu đợt sau có kẹt thật nữa, (i)+(ii) sẽ chụp tiếp; đừng trích "kẹt đã hiểu rõ" (H3 vẫn mở, chỉ thu hẹp được dạng wedge).
- **Điều tra kẹt chung VẪN MỞ** — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG.
- **Checklist mở đợt 152 (rút từ F-151-T8-9): vòng chờ kiểm PID cụ thể, không pgrep tên script trần (hồi âm); cập nhật symlink `t8-diag-stall.sh` ngay khi dựng thư mục đợt (đã kiểm chứng đúng đợt 151).**

## B7. Bằng chứng mới từ đợt 151 — O8 PASS 3/3 SAU LƯỢT YÊN HỢP LỆ #19, HARNESS 2 KẸT THẬT 85m4 (2 BOOT) + 1 LẦN BỊ REBOOT #42 GIẾT, H3-D1 BÁC BỎ

- O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0 trên boot `2e430750` (03:16:53–03:19:21Z — 2'28", sau cờ T4 03:15Z, sau lượt yên hợp lệ #19); S1 PASS cả 3 lần (WebKit: Playwright mouse click lần 2; Chromium: CDP mouse click lần 2).
- Harness lần 1 (boot `2e430750`, system libs sau replay tự nhiên): 84l10 PASS + 85m4 KẸT THẬT exit chưa có (P5-phaseB-long đóng băng; watchdog + diag, probe chưa hoàn tất do reboot #42 giết driver) + 86n2 KHÔNG VERDICT (chưa chạy).
- Harness lần 2 (boot `fad2aab9`, DEBROOT): 84l10 PASS + 85m4 KẸT THẬT exit 124 (P1 waitForPlaySync đóng băng ngay từ đầu; watchdog + probe timeout) + 86n2 PASS (P1/P2/P3 PASS, P4 3/3 PASS, P5 PASS) + Chromium 84l10 PASS (exit 0, 04:41:42Z), 85m4 PASS (exit 0, 04:43:57Z), 86n2 PASS (exit 0, 04:48:03Z).
- Vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, **kích hoạt 2 lần, bắt đúng 2 kẹt** (0 false-positive); (1b) 0 kích hoạt (đúng thiết kế — 85m4 có HB128).
- Sampler: balloon 5,42–6,38 GB, RAM avail 253–1.218 MB trong lúc chạy harness lần 2 (**0 mẫu ghim trần**; avail min 253 MB — thấp hơn kỷ lục 272 MB đợt 148 theo sampler T8, chờ T9 đối chiếu). Chuỗi ghim trần phán bằng sampler T9 (giao T10).
- T8 đóng 04:49Z — TRONG hạn cờ ~05:00Z, trước hạn cứng 05:30Z.
- Nhãn log `LIVE-DIAG-150` đã đổi thành `LIVE-DIAG-151` trong bản copy driver — nhãn mới KHÔNG xuất hiện trong log thật đợt này ((1b) 0 kích hoạt). `/tmp/.X11-unix/` còn 0 file lúc kiểm cuối; lock vite: vite-lock-v2: TRỐNG (không có lock).

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round151-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary, **đường dẫn TƯƠNG ĐỐI**): LIMITS này. Đợt này KHÔNG sửa file repo nào khác (3 script harness giữ md5 đợt 142–151; 2 script O8 gốc không đụng). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round151-t8/` (wait-t4-t5-151t8.sh — ĐÃ CHẠY (GATE-FOUND poll 36, 03:16:15Z, sau lượt yên hợp lệ #19); o8-driver-151t8.sh — ĐÃ CHẠY (WebKit 21/21 ×2 + Chromium 21/21, SAU LƯỢT YÊN HỢP LỆ #19); run-webkit-151t8.sh — ĐÃ CHẠY lần 1 (84l10 PASS + 85m4 KẸT P5, không verdict exit + 86n2 chưa chạy — reboot #42 giết); run-webkit-151t8-debroot.sh — ĐÃ CHẠY lần 2 (84l10 PASS + 85m4 KẸT exit 124 P1 + 86n2 PASS); run-chromium-151t8.sh — ĐÃ CHẠY (Chromium 3/3 PASS); diag-stall-151t8.sh — ĐÃ DÙNG (2 lần watchdog + 1 timeout-124; symlink cập nhật 02:39Z, chẩn đoán ghi đúng thư mục đợt 151 ngay lần đầu); rebuild-fixtures-151t8.sh — ĐÃ CHẠY 2 LẦN (6/6 md5 khớp đợt 125 cả 2 lần); o8-s1-probe-151t8.mjs — KHÔNG DÙNG (chỉ chạy khi FAIL; `node --check` OK); make-probe-151t8.py — KHÔNG DÙNG đợt này (probe đã có sẵn từ đợt 145); h3-analysis-151t8.md — PHÂN TÍCH H3-D1 (đối chiếu 2 live-diag đợt 150 + quỹ đạo RSS/CPU kẹt 2; H3-D1 BÁC BỎ); smoke/wait-t4-t5.log (waiter, GATE-FOUND poll 36); smoke/run-webkit-summary.txt (driver lần 2 === ALL DONE Fri Nov 20 04:00:55 UTC 2026 ec webkit: 84l10=0 85m4=124 86n2=0 ===); smoke/run-chromium-summary.txt (=== ALL DONE (chromium-only) Fri Nov 20 04:48:03 UTC 2026 chromium: 84l10=0 85m4=0 86n2=0 ===); smoke/partial-boot-2e430750/ (lần 1: summary + ram log + 2 run log + baseline); smoke/partial-boot-fad2aab9/ (lần 2: 2 summary + 2 ram log); smoke/ram-151t8.log (sampler lần 2, n=42 pinned=0 min=5417012 max=6378288 (99,0% trần); avail min 253 MB); smoke/ram-151t8-chromium.log (sampler Chromium); smoke/run-webkit-*.log + smoke/run-chromium-*.log (lần chạy WebKit lần 1/2 + Chromium); smoke/stall-sampleFor-P5-phaseB-long-1795145109/ (chẩn đoán watchdog kẹt 3); smoke/stall-waitForPlaySync-P1-1795146170/ (chẩn đoán watchdog kẹt 4); smoke/stall-webkit-85m4-timeout124-1795146999/ (chẩn đoán sau timeout 124 kẹt 4); smoke/tree-md5-open.txt (530e10a7 lúc mở); smoke/tree-md5-close.txt (đã ghi — xem §5, khớp lúc mở); smoke/baseline-dmesg-tail50.txt + smoke/baseline-journalctl-k.txt (dmesg EPERM + journalctl rỗng); smoke/baseline-meminfo.txt (02:41Z, boot 2e430750); o8-151t8.log + o8-lock.log (driver O8 03:16:53–03:19:21Z, lock giữ 148 s); o8-webkit/ + o8-chromium/ + o8-probe/ (scratch; o8-probe TRỐNG vì probe không chạy — chỉ có fixture copy). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round151-t8/diag-stall-151t8.sh` (cập nhật 02:39Z, ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild 2 lần đợt này, 6/6 md5 khớp.
