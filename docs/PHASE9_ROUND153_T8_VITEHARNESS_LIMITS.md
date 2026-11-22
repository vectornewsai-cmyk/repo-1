# Đợt 153 T8 — O8 PASS 3/3 SAU LƯỢT YÊN HỢP LỆ #21 (THỦ TỤC (i) SAU WAITER HẾT HẠN) + HARNESS 5/6, 1 KẸT THẬT 85m4 P1-phaseA — CHUỖI "P3 KHÔNG KẸT" 1 → 0 (ĐỨT)

Ngày: 20/11/2026 (lượt cron 15:35 +07 = 08:35:51Z; T8 mở ~08:37Z, đóng ~11:1xZ). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy SAU LƯỢT YÊN HỢP LỆ #21 của T4-153, qua THỦ TỤC (i) sau waiter hết hạn (không phải gate chuẩn — xem §0/§1); (2) harness đứng — 1 lần chạy driver, 5/6 PASS, 1 KẸT THẬT WebKit 85m4 P1-phaseA exit 124 (WebKit 84l10/86n2 PASS + Chromium 3/3 PASS); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, 1 kích hoạt ĐÚNG (bắt kẹt thật) + live-diag ×2, 0 false-positive; (4) H3: CHỈ GIÁM SÁT THỤ ĐỘNG (quyết parent (f) đợt 151 + (h) đợt 152 — GIỮ NGUYÊN); kẹt đợt này có chữ ký mới (kẹt trước mẫu HB128 đầu tiên) nhưng vẫn thuộc wedge "chết lặng", KHÔNG mở giả thuyết phân biệt mới; (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON của T0-152 còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau.
Nợ: docs/PHASE9_ROUND152_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 sau lượt yên hợp lệ #20, QUA GATE chuẩn (i); harness 6/6 PASS một lần chạy, 0 kẹt; chuỗi FULL PASS 9 → 10; chuỗi "P3 không kẹt" 0 → 1); aggregate đợt 152 §12.3 parent (a)–(l) (quyết (h) H3 chỉ giám sát thụ động; quyết (i) T5-153 kiểm tra watcher; quyết (j) O8 chuỗi 9 → 10 XÁC NHẬN; quyết (l) T7 viết nội dung vào cờ).

## 0. Kết luận ngắn — O8 PASS 3/3, HARNESS 5/6 (1 KẸT THẬT 85m4), REBOOT #46 GIỮA PHIÊN

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (10:32:01–10:34:54Z, 2'53", boot `1450ac80` = reboot #46, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 10:32:17Z + 10:33:15Z, Playwright mouse click lần 2; Chromium: CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: KHÔNG ĐẠT THEO ĐƯỜNG CHUẨN — CHẠY THEO THỦ TỤC (i) SAU WAITER HẾT HẠN.** T4-153 CÓ lượt yên hợp lệ #21 (attempt2-401fca75 20/20 + lớp B 5/5 + tickCost median 40,0 ms ≤60, cờ `round153-t4.done` viết 09:12Z — SAU reboot #46, dựa trên attempt chạy trên boot #45 TRƯỚC reboot). Nhưng postboot chính thức cho boot MỚI #46 KHÔNG BAO GIỜ tới (waiter 83 poll trên boot mới: t4=1 từ poll 5 lúc 09:11:25Z, postboot=0 suốt; 0 dòng postboot=1; không có cờ T5 cho boot `1450ac80`, không có gate0wait mới của T4). T4 KHÔNG attempt lúc waiter hết hạn 10:30Z (no-lock, 0 process, poller thoát 09:03:09Z boot cũ) → theo quyết (i) đợt 143, T8 được chạy sau waiter hết hạn kèm ghi rõ. **T8 tự kiểm postboot boot #46 lúc 10:31Z — ĐẦY ĐỦ** (GST 269 file, dpkg 1545 dòng, replay xong 09:09:12Z boot+4m23s, cache 178 .deb, lists 37, lib đủ) — chỉ thiếu giấy tờ chính thức, không thiếu môi trường. **Nhãn trích: "O8 + harness sau lượt yên hợp lệ #21 (boot #45), theo thủ tục (i) sau waiter hết hạn 10:30Z; postboot boot #46 tự kiểm T8 đầy đủ" — KHÔNG ghi "qua gate chuẩn (i)" như đợt 151/152.**
- **Chuỗi WebKit FULL PASS: 10 → 11 (chờ T10 xác nhận độc lập lúc đóng sổ)** — O8 WebKit 21/21 ×2 đợt này trên boot `1450ac80`, sau lượt yên hợp lệ #21 (boot #45).
- **Harness: 5/6 PASS TRONG MỘT LẦN CHẠY DRIVER DUY NHẤT, 1 KẸT THẬT** (10:35:08–11:04:11Z, boot `1450ac80`, system libs sau replay tự nhiên): WebKit 84l10 PASS (10:35:11–10:36:31Z) + **85m4 KẸT THẬT exit 124** (10:36:46–10:51:48Z, P1-phaseA — xem §2/F-153-T8-4) + 86n2 PASS (10:52:04–10:56:14Z) + Chromium 84l10 PASS (10:56:30–10:57:40Z) + 85m4 PASS (10:57:55–11:00:05Z) + 86n2 PASS (11:00:21–11:04:11Z). Cả 6 report JSON đã kiểm độc lập bằng python (5× `ok=true`, 1× `ok=false` — WebKit 85m4). **Chuỗi "P3 không kẹt": 1 → 0 (ĐỨT).**
- **REBOOT #46 GIỮA PHIÊN (09:04:49Z)** — boot `401fca75` (#45) → `1450ac80` (#46), giết waiter T8 (lần 1) + poller T4 TRƯỚC KHI T4 viết cờ; T4 viết cờ sau đó (09:12Z) dựa trên attempt đã xong trước reboot. Reboot #45 trước phiên (07:32:38Z) — xem F-153-T8-1/F-153-T8-2.
- **Watchdog: 1 kích hoạt ĐÚNG + live-diag ×2, 0 false-positive** — watchdog (i) bắt đúng kẹt thật 85m4 lúc 10:38:03Z (evaluate im lặng >60 s, runEngine:433) + probe 1+1 TIMEOUT 30 s; driver (1b) live-diag ×2 (10:40:37Z silence 124 s, 10:44:37Z silence 364 s). Chú ý: snapshot watchdog 10:38:03Z ghi NHẦM sang thư mục đợt 152 do symlink hidden-root chưa cập nhật (xem F-153-T8-5) — bằng chứng không mất, đã copy về thư mục 153.
- **Balloon trong cửa sổ harness T8: 0 mẫu ghim trần** (n=59, max 6.202.396 kB = 96,3% trần); **avail min 306 MB lúc 10:46:38Z — TRONG LÚC KẸT** (cùng thời điểm balloon max). Balloon GHIM TRẦN lúc mở phiên (6.443.824 kB lúc 10:31Z, trước harness) — xem F-153-T8-6; chuỗi ghim phán bằng sampler T9 (giao T10).
- **T8 ĐÓNG ~11:1xZ — SAU hạn cờ ~11:00Z (do reboot #46 + waiter hết hạn 10:30Z + kẹt 85m4 ăn 900 s), TRƯỚC hạn cứng 11:30Z.**

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 07:32:38 | REBOOT #45 (chờ T2-153 xác nhận số) — boot `18e179e0` → `401fca75`, btime 1795159958, TRƯỚC phiên đợt 153 (lượt cron 08:35:51Z) |
| ~08:37 | T8 mở: RAM avail ~1.921 MB lúc mở, balloon 4.918.416 kB (76,3% trần); đọc LIMITS T8-152 + aggregate 152 §12.3 (h)(i)(j)(l); cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 152 (không đổi) |
| 08:38 | **CHECKLIST (o): dựng thư mục `round153-t8`, copy script 152→153, cập nhật symlink `t8-diag-stall.sh` → `round153-t8/diag-stall-153t8.sh` NGAY (trước mọi lần chạy) — NHƯNG chỉ cập nhật symlink trong repo `apps/web/scripts/`; symlink gốc `hidden_files/t8-diag-stall.sh` vẫn trỏ về 152 (xem F-153-T8-5/F-153-T8-7)** |
| 08:38 | Boot mới `401fca75`: REPLAY VẮNG lúc mở (không có thư mục GST, cache 0 .deb, lists 3) — mẫu lần thứ 4 liên tiếp replay vắng lúc mở (150, 151-boot-mới, 152, 153-boot-#45) |
| 08:39:15 | Waiter T8 (lần 1) bắt đầu (deadline 10:30Z); poll 1: t4=0 postboot=0 |
| 08:49:16 | Waiter poll 11: postboot=1 (đường (b) — gate0wait-21 của T4, GST 269, apt đủ; replay tới tự nhiên trên boot #45, dpkg 1545) |
| 08:56:15 | T4: cửa yên mở poll #23 — chạy attempt1 (exit=2 partial 16/20, wedged, KHÔNG tính verdict) |
| 08:59:22 | T4: cửa yên mở lại poll #24 — chạy attempt2 |
| 09:03:09 | **T4 attempt2-401fca75 XONG: 20/20 + LOP B 5/5 + tickCost median 40,0 ms — LƯỢT YÊN HỢP LỆ #21, poller thoát** |
| 09:04:49 | **REBOOT #46** — boot `401fca75` → `1450ac80`, btime 1795165489; giết waiter T8 (lần 1) giữa poll 26/27 + poller T4 TRƯỚC KHI T4 viết cờ |
| 09:07:18 | Boot mới #46: replay ĐANG TỚI NHANH (dpkg.log có hoạt động, GST mới 32/269 file) |
| 09:07:24 | Waiter T8 (lần 2) khởi động lại trên boot mới (deadline 10:30Z; log lần 1 đã sao lưu sang `wait-t4-t5-boot401fca75.log` trước khi script truncate) |
| 09:09:12 | Replay boot #46 xong (gstreamer1.0-tools installed — dpkg.log cuối; boot+4m23s) |
| 09:11:25 | Waiter (lần 2) poll 5: t4=1 (cờ T4 đã có) nhưng postboot=0 |
| 09:12 | **T4 viết cờ `round153-t4.done` (09:12Z, 1053 B): lượt yên #22 hợp lệ #21 + XEM XÉT P3' xong kết luận (b) + bổ sung reboot #46** |
| 10:30:29 | **Waiter HẾT HẠN poll 84 — GATE NOT MET** (t4=1, postboot=0; T4 không attempt — no-lock, 0 process) → áp thủ tục (i): chạy sau hết hạn kèm ghi rõ |
| 10:31:14 | **T8 tự kiểm postboot boot #46: ĐẦY ĐỦ** (GST 269, dpkg 1545, cache 178, lists 37, lib đủ 16) — xem F-153-T8-3 |
| 10:31:50 | Fixture REBUILD sau gate: 6/6 md5 khớp đợt 125 |
| 10:32:01–10:34:54 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — SAU lượt yên hợp lệ #21 (boot #45), theo thủ tục (i) |
| 10:35:08–11:04:11 | **Harness lần 1 (duy nhất), WebKit + Chromium qua system libs: 5/6 PASS, 1 KẸT THẬT WebKit 85m4 exit 124** (xem §2) |
| ~11:07–11:1x | Kiểm cuối + LIMITS + stage file + cờ `round153-t8.done` |

## A. O8 — PASS 3/3 trên boot `1450ac80`, SAU LƯỢT YÊN HỢP LỆ #21 (THỦ TỤC (i) SAU WAITER HẾT HẠN)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 10:32:01–10:33:02 | 0 | **21/21 PASS** — S1 PASS 10:32:17Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 10:33:02–10:33:58 | 0 | **21/21 PASS** — S1 PASS 10:33:15Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 10:33:58–10:34:54 | 0 | **21/21 PASS** — S1 PASS, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-20T10-32-02-1450ac80-pid17449.json` 21 kết quả `ok=true` 21/21; attempt2 `o8w-clicktest-report-2026-11-20T10-33-02-1450ac80-pid17793.json` 21/21 `ok=true` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-20T10-33-58-1450ac80-pid18102.json` 21/21 `ok=true`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng khối `run`). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep: PASS S1 6 dòng, FAIL S1 0).
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã đầy đủ trên boot `1450ac80` sau replay). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness lần 1 (standard driver, không LD_LIBRARY_PATH).
- Driver O8 giữ 1 lock vite `t8-round153` suốt lượt (nhả 10:34:54Z; vite sau release curl 5560/5554 = 000000 — vite đã tắt, đúng).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-153t8.mjs`, `node --check` OK — bản copy từ 152, chưa dùng) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 10 → 11 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 152 = 10; đợt này T8 pass 21/21 ×2 trên boot `1450ac80`, sau lượt yên hợp lệ #21 (boot #45).
- **O8 đợt này 2'53" tổng** (148: 4'03", 149: 2'32", 150: 3'03", 151: 2'28", 152: 2'51") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — 1 lần chạy driver duy nhất, 5/6 PASS, 1 KẸT THẬT (WebKit 85m4)

### Lần 1 (duy nhất) — boot `1450ac80`, 10:35:08–11:04:11Z, system libs sau replay tự nhiên nhanh

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 10:35:11–10:36:31 | **PASS** — report `ok=true` (W1 3/3 delta +1 sạch 0→1/1→2/2→3, W2 PASS, E4 PASS) |
| 2 | WebKit 85m4-hb128 | 124 | 10:36:46–10:51:48 | **KẸT THẬT — TIMEOUT 900** — report `ok=false` (kẹt P1-phaseA, trước mẫu HB128 đầu tiên; watchdog + probe timeout + live-diag ×2 — xem F-153-T8-4) |
| 3 | WebKit 86n2 | 0 | 10:52:04–10:56:14 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 1,8/1,8/3,6 s; P5 PASS 40 s 0 restart) |
| 4 | Chromium 84l10 | 0 | 10:56:30–10:57:40 | **PASS** — report `ok=true` (W1 3/3 delta +1 nhưng trôi đếm +1 giữa các lần: 0→1/2→3/4→5 — xem F-153-T8-8; W2 PASS, E4 PASS) |
| 5 | Chromium 85m4 | 0 | 10:57:55–11:00:05 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 1,0/0,5/1,0 s; P5 PASS 40 s 0 restart) |
| 6 | Chromium 86n2 | 0 | 11:00:21–11:04:11 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 0,5/1,0/1,0 s; P5 PASS 40 s 0 restart) |

- 6 report JSON kiểm độc lập bằng python, `finishedAt` khớp cửa sổ chạy từng pha: WebKit 10:36:23Z (`ok=true`) / 10:51:47Z (`ok=false`) / 10:56:04Z (`ok=true`); Chromium 10:57:30Z / 10:59:58Z / 11:04:09Z (cả ba `ok=true`).
- Môi trường lần 1: system libs sau replay tự nhiên NHANH trên boot #46 (replay xong 09:09:12Z, boot+4m23s; GST thư mục thật 269 file; dpkg 1545 dòng; cache 178 .deb; lists 37). **WebKit launch THÀNH CÔNG cả 3 pha bằng system libs** — không cần lần chạy DEBROOT thứ hai (khác đợt 149/151).
- Fixture REBUILD sau gate (10:31:50Z): 6/6 md5 khớp đợt 125 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- **85m4 KẸT — chuỗi "P3 không kẹt" 1 → 0 (ĐỨT).** Kẹt ở P1-phaseA, workload đã kẹt ở P1 hai đợt trước đó (150-lần1 P1-phaseA, 151-lần2 P1-waitForPlaySync) — nhưng chữ ký đợt này SỚM HƠN: kẹt ngay evaluate đầu tiên của P1-phaseA, trước cả mẫu HB128 đầu tiên (xem F-153-T8-4). 86n2 P4-lần2 PASS lần thứ 5 liên tiếp tính theo lần chạy có verdict (nối tiếp lần thứ 4 ở đợt 152; T10 đối chiếu chuỗi đầy đủ).
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn đã đủ 5/6 + 1 kẹt thật đã chẩn đoán) — ghi rõ để T10 không tìm log lần 2.

## 3. Watchdog trong lượt này — 1 KÍCH HOẠT ĐÚNG, LIVE-DIAG ×2, 0 FALSE-POSITIVE

- **Watchdog (i): 1 kích hoạt — ĐÚNG (bắt kẹt thật).** 10:38:03Z, evaluate im lặng >60 s tại runEngine:433 trong WebKit 85m4 (P1-phaseA); probe 1+1 TIMEOUT 30 s lúc 10:38:33Z (kênh evaluate kẹt cùng / page JS chết); diag script chạy xong — nhưng ghi vào thư mục đợt 152 do symlink stale (xem F-153-T8-5). Tổng 3 dòng `WATCHDOG-137` trong log 85m4 (1 kích hoạt + 1 diag-xong + 1 probe-timeout).
- **Driver (1b) live-diag: 2 kích hoạt — ĐÚNG THIẾT KẾ.** 10:40:37Z (log im lặng 124 s) + 10:44:37Z (im lặng 364 s), cả hai gọi diag-stall live với devUrl thật `http://127.0.0.1:5490/`; vite trả HTTP 200 cả hai lần (vite còn sống trong lúc kẹt); snapshot đầy đủ trong `smoke/stall-live-silence-webkit-85m4-1795171237/` + `...-1795171477/`.
- **0 false-positive cả lượt.** 5 lần chạy harness PASS + 3 lần chạy O8: 0 dòng `WATCHDOG-137`, 0 live-diag. Watchdog chỉ kích hoạt đúng ở lần chạy kẹt thật duy nhất.
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–152 §12.3(l)). Đợt này là lần đầu tiên kể từ đợt 151 watchdog bắt đúng kẹt thật (đợt 152: 0 kích hoạt vì 0 kẹt).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–153) + đường ổn định `t8-diag-stall.sh` → 153 (symlink repo cập nhật 08:38Z, TRƯỚC mọi lần chạy; NHƯNG symlink gốc `hidden_files/` vẫn trỏ 152 — xem F-153-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **1 kẹt thật → 1 kích hoạt, 0 false-positive** | **ĐÚNG — BẮT ĐÚNG KẸT THẬT.** Snapshot watchdog 10:38:03Z ghi nhầm sang `round152-t8/smoke/stall-runEngine_433-1795171083` (đã copy về `round153-t8/smoke/` + ghi chú nguồn gốc); 2 snapshot live-diag + 1 snapshot timeout124 ghi đúng thư mục 153 |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–153) | 6 lần chạy harness; `live_diags=2` ở 85m4 WebKit, `live_diags=0` ở 5 lần còn lại | **2 kích hoạt — ĐÚNG THIẾT KẾ** (log im lặng 124 s rồi 364 s trong lúc kẹt; 5 lần PASS không có khoảng im lặng >120 s) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-153t8.sh` (cột `balloon_kb`) | 1 log sampler (n=59) | Balloon n=59 pinned=0 min=5.078.504 max=6.202.396 (96,3% trần) mean=5.660.000; avail min=306 MB lúc 10:46:38Z (TRONG LÚC KẸT, cùng thời điểm balloon max) — xem F-153-T8-6 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 10:57:40Z), 85m4 PASS (exit 0, 11:00:05Z), 86n2 PASS (exit 0, 11:04:11Z)** | N cộng dồn **N=15 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **1 lần kẹt → 1 lần kích hoạt (timeout124 10:51:48Z) + 2 live-diag + 1 watchdog-diag** | Baseline: dmesg EPERM tái xác nhận (cả 4 snapshot); journalctl -k "-- No entries --" (watchdog snapshot) / rỗng; timeout124 diag chụp SAU khi node bị giết nên ps.txt trống + vite-http curl exit 7 (đúng — process đã chết; bằng chứng lúc kẹt nằm ở 3 snapshot trước đó) |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | 4994b4fc | 4994b4fc | Không (bản sửa T0-152 F-151-T10-2 còn nguyên) |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | c8acd72e | c8acd72e | Không (như trên) |

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi nhỏ so với đợt 152: nhãn log `LIVE-DIAG-152` → `LIVE-DIAG-153`, deadline waiter 07:30Z → 10:30Z (khớp hạn cứng đợt 153), lock `t8-round152` → `t8-round153` — chỉ chuỗi/hằng số trong bản copy, không chạm script repo. Thêm mới: script trích số liệu `extract-153t8.py` (thay cho `fill-limits-152t8.py` đã lỗi thời — script cũ trỏ LIMITS đợt 150, không dùng cho đợt này); các bản copy driver Chromium-only + debroot giữ nguyên mẫu 152 (đổi nhãn 152→153), KHÔNG dùng đợt này.

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round153` 10:34:54Z; driver harness đã nhả lock sau mỗi lần chạy (xem summary: released từng pha, exit 0/124/0/0/0/0).
- Kiểm cuối ~11:07Z (bằng script trích số liệu): process Xvfb/MiniBrowser/WebKit/Chromium còn sót: 0; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown — 100 sau prune + 1 cooldown T8); boot `1450ac80` ổn định (btime 1795165489 không đổi từ 09:04:49Z).
- `/tmp/.X11-unix/` trống 0 file lúc kiểm cuối (Xvfb :199 của T8 đã dọn socket của mình; :188 O8-WebKit + :197 O8-Chromium cũng đã dọn — khác đợt 152 còn socket X193 mồ côi của luồng khác).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Gate đợt này KHÔNG PHẢI gate chuẩn (i) — trích đúng nhãn thủ tục (i) sau waiter hết hạn** (xem §0/§1/F-153-T8-3): lượt yên #21 hợp lệ thật (T4 flag 09:12Z, attempt2 trên boot #45) + waiter hết hạn 10:30Z vì thiếu postboot chính thức cho boot #46 + T4 không attempt lúc hết hạn + T8 tự kiểm postboot boot #46 đầy đủ lúc 10:31Z. Đừng trích "qua gate chuẩn (i)" cho đợt này.
2. **Harness đợt này LÀ 5/6 trong MỘT lần chạy driver duy nhất** (10:35:08–11:04:11Z, 1 boot #46, system libs) — 1 kẹt thật WebKit 85m4 exit 124. Trích đúng: "harness 5/6 PASS, 1 kẹt thật 85m4 P1-phaseA".
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `1450ac80` sau replay. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness lần 1 (standard driver, không LD_LIBRARY_PATH).
4. **Chuỗi WebKit FULL PASS = 11 CHỜ T10 xác nhận độc lập** — T8 pass 21/21 ×2 đợt này (trên boot `1450ac80`, sau lượt yên hợp lệ #21 boot #45, theo thủ tục (i)). Chuỗi này đếm O8, không bị kẹt harness làm đứt (kẹt harness không ảnh hưởng chuỗi O8).
5. **Chuỗi "P3 không kẹt" 1 → 0 (ĐỨT):** đợt này 6 lần chạy harness, 1 kẹt thật (85m4 WebKit). Một đợt có kẹt thì chuỗi về 0 theo luật đứng — H3 vẫn mở, chỉ giám sát thụ động tiếp (xem Phần B).
6. **Kẹt 85m4 đợt này KHÔNG chứng minh cơ chế mới** — chữ ký SỚM HƠN các lần kẹt 85m4 trước (kẹt ngay evaluate đầu P1-phaseA, trước HB128 đầu tiên) nhưng vẫn thuộc wedge "chết lặng" (RSS giảm trong lúc kẹt, CPU gần như idle, vite HTTP 200); H1 đã bác bỏ, H3 chỉ giám sát thụ động (xem Phần B). Đừng trích "đã tìm ra nguyên nhân kẹt" — không có code nào sửa kẹt trong đợt này.
7. **Balloon KHÔNG ghim trần trong cửa sổ harness T8** (0 mẫu ghim, n=59, max 96,3% trần) — nhưng sampler T8 chỉ phủ cửa sổ harness; balloon ĐÃ ghim trần lúc mở phiên (10:31Z, trước harness) và avail min 306 MB rơi vào đúng lúc kẹt; chuỗi ghim trần phán bằng sampler T9 (giao T10).
8. **RAM avail min 306 MB lúc 10:46:38Z (trong lúc kẹt)** — thấp hơn 677 MB đợt 152 và cao hơn kỷ lục thấp 250.840 kB đợt 151 theo sampler T9; chờ T9 đối chiếu bằng sampler toàn đợt trước khi kết luận gì về RAM phiên.
9. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–153 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn. O8 webkit/headed sau sửa T0: kiểm kích thước lúc push (T0 báo +23/+24 dòng — T10 kiểm lại).
10. **Chromium 84l10 W1: trôi đếm +1 giữa các lần** (lần1 0→1, lần2 2→3, lần3 4→5 — xem F-153-T8-8): artifact test đã biết cùng họ với trôi +2 các đợt 146–152, không phải FAIL (W1 vẫn PASS delta +1 mỗi lần; W2/E4 PASS). WebKit 84l10 W1 sạch hoàn toàn (0→1/1→2/2→3).
11. **T8 ĐÓNG SAU hạn cờ ~11:00Z (do reboot #46 + waiter hết hạn 10:30Z + kẹt 85m4 ăn 900 s), TRƯỚC hạn cứng 11:30Z** — lần thứ hai kể từ đợt 143 đóng sau hạn cờ (đợt 150 cũng sau hạn cờ vì reboot #41 + 2 kẹt).

## 8. Sai số mới (F-153-T8-N)

- **F-153-T8-1 — REBOOT #46 GIỮA PHIÊN (chờ T2-153 xác nhận số):** btime /proc/stat 09:04:49Z (epoch 1795165489); boot `401fca75` (btime 07:32:38Z, reboot #45) → `1450ac80`; boot cũ sống 5.531 s (07:32:38Z → 09:04:49Z, stat→stat). Reboot giết waiter T8 (lần 1) giữa poll 26 (09:04:18Z) và poll 27, và giết poller T4 TRƯỚC KHI T4 viết cờ (poller thoát 09:03:09Z sau lượt hợp lệ #21; cờ viết 09:12Z sau reboot). **Nghịch lý đồng hồ:** poll 27 của waiter (lần 1) ghi timestamp 09:05:18Z với boot `401fca75` trong khi btime boot mới là 09:04:49Z — chênh ~29 s, cùng họ nghịch lý clock các đợt trước (≥ +18 s tại #42, ≥ +10 s tại #44); waiter chết theo reboot nên không có dòng "!!! REBOOT" trong log lần 1. /tmp fixture MẤT theo reboot (rebuild sau gate 10:31:50Z, 6/6 md5 khớp). Mù #76? (nếu #46 đúng số) giao T2-153 theo mẫu T10-148; T8 không tự chốt giây reboot.
- **F-153-T8-2 — REBOOT #45 TRƯỚC PHIÊN (chờ T2-153 xác nhận số) + REPLAY: VẮNG LÚC MỞ TRÊN #45, TỚI NHANH TỰ NHIÊN TRÊN #46:** btime 07:32:38Z (epoch 1795159958); boot `18e179e0` (btime 05:20:57Z, reboot #43) → `401fca75`; boot cũ sống 7.901 s. Lúc T8 mở (08:38Z, boot+~66 phút): không có thư mục GST, cache 0 .deb, lists 3 — replay VẮNG, mẫu lần thứ 4 liên tiếp vắng lúc mở (150, 151-boot-mới, 152, 153-boot-#45). Nhưng replay TỚI MUỘN TỰ NHIÊN trên boot #45 (dpkg 2 → 1545 theo poll T4; gate0wait-21 của T4: GST 269, apt đủ 11 gói, "DU DIEU KIEN chay WebKit" — KHÔNG cần repair; T5-153 không viết cờ POSTBOOT_PASS nào cho boot #45). Trên boot #46, replay TỚI NHANH TỰ NHIÊN (hoạt động dpkg 09:07:18Z, GST 32/269 file lúc 09:07Z, xong 09:09:12Z boot+4m23s — giống mẫu đợt 151 boot+44s/bộ xong boot+4m22s). **Kết luận: replay không chết hẳn — lúc vắng lúc tới, không đoán trước được; T5 theo dõi tiếp đợt 154.**
- **F-153-T8-3 — GATE KHÔNG ĐẠT THEO ĐƯỜNG CHUẨN, CHẠY THEO THỦ TỤC (i) SAU WAITER HẾT HẠN 10:30Z:** waiter lần 1 (boot #45, 27 poll): t4=0 suốt, postboot=1 từ poll 11 (đường (b), gate0wait-21 của T4) — chết theo reboot #46. Waiter lần 2 (boot #46, 83 poll + dòng hết hạn poll 84): **t4=1 từ poll 5 (09:11:25Z, cờ T4 viết 09:12Z) nhưng postboot=0 SUỐT — 0 dòng postboot=1** (không có cờ T5 cho boot `1450ac80`; không có gate0wait mới của T4 — log mới nhất vẫn là -21 của boot cũ, btime 07:32:38Z không khớp boot mới). T4 KHÔNG attempt lúc hết hạn (no-lock, 0 process, poller thoát 09:03:09Z boot cũ) → đủ điều kiện thủ tục (i) đợt 143: chạy sau waiter hết hạn kèm ghi rõ. **T8 tự kiểm postboot boot #46 lúc 10:31:14Z — ĐẦY ĐỦ:** GST 269 file, dpkg 1545 dòng (hoạt động cuối 09:09:12Z), cache 178 .deb, lists 37, lib đủ (grep libgstreamer/libevent/libEGL/libavif/libdw/libevdev = 16). O8 bắt đầu 10:32:01Z, harness bắt đầu 10:35:08Z — CẢ HAI SAU CỜ T4 (09:12Z) VÀ SAU LƯỢT YÊN HỢP LỆ #21 (09:03:09Z, boot #45). **Lần đầu tiên kể từ đợt 150 T8 phải chạy theo thủ tục (i) sau hết hạn thay vì gate chuẩn (đợt 151/152 qua gate chuẩn).** Nợ T4/T5-154: viết gate0wait/POSTBOOT_PASS mới cho boot hiện tại sau mỗi reboot (không để waiter đói postboot cả lượt).
- **F-153-T8-4 — KẸT THẬT WebKit 85m4 P1-phaseA, exit 124 (CHỮ KÝ MỚI — SỚM NHẤT TỪ TRƯỚC TỚI NAY):** 10:36:46Z start → vite ready 10:36:48Z → setup 10:36:57Z → **P1 sync 10:37:00.215Z ("element đồng bộ sau 0.8 s, playhead=0.8, ct=1.4")** → IM LẶNG HOÀN TOÀN → WATCHDOG-137 10:38:03.407Z (evaluate im lặng >60 s tại runEngine:433) → probe 1+1 TIMEOUT 30 s 10:38:33Z (kênh evaluate kẹt cùng / page JS chết) → live-diag 10:40:37Z (im lặng 124 s) + 10:44:37Z (im lặng 364 s) → timeout 900 giết node 10:51:47Z, exit 124, report `ok=false` (finishedAt 10:51:47.045Z). **KHÔNG CÓ DÒNG HB128 NÀO** — kẹt ngay evaluate đầu tiên của P1-phaseA (sampleFor), trước cả mẫu heartbeat 5 s đầu tiên. So với các lần kẹt 85m4 trước: 150-lần1 P1-phaseA (có HB128 rồi mới kẹt), 151-lần1 P5-phaseB-long, 151-lần2 P1-waitForPlaySync — đợt này SỚM HƠN CẢ BA (kẹt trước HB128 đầu tiên). Chromium đối chứng cùng pha PASS đủ P1–P5 (P4 1,0/0,5/1,0 s; P5 40 s 0 restart) — kẹt chỉ ở WebKit. **Chuỗi "P3 không kẹt" 1 → 0 (ĐỨT)** — lần đầu có kẹt kể từ đợt 152 sạch. Xem Phần B để đối chiếu wedge "chết lặng" (RSS WebKitWebProcess GIẢM trong lúc kẹt: 344 → 332 → 269 MB; CPU gần như idle; vite HTTP 200 cả 3 snapshot).
- **F-153-T8-5 — SNAPSHOT WATCHDOG 10:38:03Z GHI NHẦM SANG THƯ MỤC ĐỢT 152 (SYMLINK HIDDEN-ROOT CHƯA CẬP NHẬT — LỖI QUY TRÌNH, BẰNG CHỨNG KHÔNG MẤT):** 3 script harness vá đợt 142 gọi diag qua hằng `DIAG137_SCRIPT = "hidden_files/t8-diag-stall.sh"` (dòng 86 file `clicktest-85m4-webkit-w7-hb128.mjs`). Symlink đó vẫn trỏ về `round152-t8/diag-stall-152t8.sh` (tạo 05:39Z đợt 152) vì checklist (o) của T8-153 chỉ cập nhật symlink trong repo `apps/web/scripts/t8-diag-stall.sh` → 153. Hậu quả: snapshot watchdog lúc kẹt ghi vào `round152-t8/smoke/stall-runEngine_433-1795171083/` (README: "diag-stall start 10:38:03Z label=runEngine:433 devUrl=http://127.0.0.1:5490/ boot 1450ac80..."). **Bằng chứng KHÔNG mất:** T8 đã copy nguyên vẹn thư mục đó về `round153-t8/smoke/stall-runEngine_433-1795171083/` + file `COPY-NOTE-153.txt` ghi rõ nguồn gốc; bản gốc trong thư mục 152 GIỮ NGUYÊN (không xóa/sửa — đợt 152 đã đóng sổ). **Sửa cho đợt 154:** checklist (o) phải cập nhật CẢ HAI symlink (repo `apps/web/scripts/t8-diag-stall.sh` VÀ `hidden_files/t8-diag-stall.sh`) ngay lúc mở, trước mọi lần chạy; T0-154 cân nhắc sửa hằng `DIAG137_SCRIPT` trong 3 script harness trỏ thẳng vào symlink repo (1 mối duy nhất) thay vì đường hidden-root. Hai snapshot live-diag + snapshot timeout124 ghi ĐÚNG thư mục 153 (driver gọi diag qua đường `$T8/diag-stall-153t8.sh` — không qua symlink).
- **F-153-T8-6 — BALLOON GHIM TRẦN LÚC MỞ PHIÊN + AVAIL MIN 306 MB TRONG LÚC KẸT:** lúc 10:31:14Z (trước harness) balloon = 6.443.824 kB = 100% trần, RAM avail 513 MB; lúc mở phiên 08:38Z balloon 4.918.416 kB (76,3%). Sampler harness (n=59, 10:35:08–11:04:09Z): 0 mẫu ghim trần, max 6.202.396 kB (96,3%), mean 5.660.000 kB; avail min 306 MB + balloon max CÙNG LÚC 10:46:38Z — TRONG LÚC KẸT 85m4 (10:36:46–10:51:48Z), load lúc đó 0,21. So với đợt 152 (avail min 677 MB, balloon max 87,9%, 0 kẹt): cửa sổ harness đợt này "nặng" hơn rõ rệt VÀ có kẹt — chỉ là tương quan quan sát được trong 1 lần chạy; H1 đã bác bỏ, H3 chỉ giám sát thụ động (xem Phần B). Chuỗi ghim trần phán bằng sampler T9 (giao T10).
- **F-153-T8-7 — SYMLINK REPO `t8-diag-stall.sh` ĐÃ MẤT SAU ĐỢT 152 (T8-153 TẠO LẠI LÚC MỞ):** lúc T8 mở (~08:37Z) `apps/web/scripts/t8-diag-stall.sh` KHÔNG TỒN TẠI (dù T8-152 đã tạo/cập nhật nó 05:39Z đợt 152) — không rõ ai/xóa khi nào (có thể dọn dẹp lúc đóng sổ đợt 152 hoặc đồng bộ cây). T8-153 tạo lại ngay 08:38Z (`ln -sfn ... round153-t8/diag-stall-153t8.sh`, `readlink` xác nhận) TRƯỚC mọi lần chạy — checklist (o) vẫn được giữ về mặt thời điểm, nhưng việc symlink "tự mất" giữa các đợt cho thấy checklist (o) cần kiểm tra SỰ TỒN TẠI của cả hai symlink lúc mở, không chỉ cập nhật đích. Ghi vào checklist T8-154.
- **F-153-T8-8 — CHROMIUM 84l10 W1 TRÔI ĐẾM +1 GIỮA CÁC LẦN (ARTIFACT ĐÃ BIẾT, KHÔNG PHẢI FAIL):** lần1 0→1, lần2 2→3, lần3 4→5 — đếm `restartEndedVideo` tăng +1 ngoài delta giữa các lần (1→2, 3→4), cùng họ trôi +2 các đợt 146–152 (đợt 152: lần1 +2). W1 vẫn PASS delta +1 mỗi lần; W2 PASS; E4 PASS (restartEndedVideo tại cuối 5 → sau 3 s 5, `ended=false` — khác WebKit `ended=true`, như các đợt trước). WebKit 84l10 W1 sạch hoàn toàn (0→1/1→2/2→3, không trôi). Ghi nhận để T10 không đọc trôi đếm thành FAIL.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi "P3 không kẹt" 1 → 0 (ĐỨT) — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (f)/(h)).** Kẹt thật thứ 10 (xem Phần B §B4). Nếu đợt 154 cũng kẹt thì chuỗi vẫn 0; cần nhiều đợt sạch liên tiếp mới bắt đầu lại.
2. **Chuỗi WebKit FULL PASS = 11 (chờ T10 xác nhận độc lập bằng JSON stamped lúc đóng sổ đợt 153, trên boot `1450ac80`, sau lượt yên hợp lệ #21 boot #45, theo thủ tục (i)).**
3. **Đối chứng Chromium cùng pha: N cộng dồn N=15 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **#22 CÓ LƯỢT HỢP LỆ MỚI #21 — ĐÓNG HAY VẪN MỞ?** (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng.) T4-153: attempt2-401fca75 20/20 + lớp B 5/5 + median 40,0 ms (n=647); (c2) 7, tất cả lag +1f; P1 7/7, P2 7/7, P3-A1 6/7, P3' 7/7, P7 đúng; lũy kế 21 lượt: P1 69/69, P2 60/60, P3-A1 61/69, P3' 39/41, P7 55/55. **XEM XÉT P3' XONG (quyết (d) đợt 152): kết luận (b)** — 2 tick không đạt là 1 event thật seq 365 đợt 151, cơ chế thứ hai "catch-up lag sau đóng băng", KHÔNG phải artifact; verdict ghost-freeze đứng nguyên; P3' nghiêm ngặt 39/41 vẫn không tròn — parent quyết (i)/(ii)/(iii) ở LIMITS T4 §9. **Caveat gate:** lượt hợp lệ #21 chạy trên boot #45 đã chết theo reboot #46; O8/harness chạy trên boot #46 sau đó (theo thủ tục (i)) — parent phán xem nhãn này có đủ chuẩn để tính chuỗi FULL PASS hay không.
5. **Reboot #45/#46 / mù #76? — giao T2-153** (btime #45 07:32:38Z, #46 09:04:49Z; boot #45 sống 7.901 s, boot #46 đang sống; xử lý theo mẫu T10-148). Mù #74?/#75? giao T2-153 theo nợ đợt 152.
6. **Postboot chính thức cho boot mới KHÔNG BAO GIỜ tới trong phiên (F-153-T8-3)** — nợ T4/T5-154 (viết gate0wait/POSTBOOT_PASS mới cho boot hiện tại sau mỗi reboot; T5 kiểm tra watcher theo quyết (i) đợt 152 — watcher-153 có sống qua #46 không?).
7. **Checklist (o) phải cập nhật CẢ HAI symlink diag (F-153-T8-5/F-153-T8-7)** — ghi vào brief T8-154; T0-154 cân nhắc sửa hằng `DIAG137_SCRIPT` trong 3 script harness về 1 mối duy nhất.
8. **RAM avail min 306 MB + balloon max 96,3% (cửa sổ harness) — chờ T9 đối chiếu** (F-153-T8-6); chuỗi ghim trần phán bằng sampler T9 (giao T10); balloon ghim trần lúc mở phiên 10:31Z cần T9 đối chiếu với sampler toàn đợt.
9. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-153 xác nhận số lần — lần thứ 7 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận.

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 153 (quyết parent (f) đợt 151 + (h) đợt 152) — 1 KẸT THẬT, CHỮ KÝ SỚM NHẤT TỪ TRƯỚC TỚI NAY, WEDGE "CHẾT LẶNG" KHẲNG ĐỊNH LẠI

## B1. Trạng thái giả thuyết sau đợt 153 (đứng nguyên — không mở giả thuyết mới)

| Giả thuyết | Trạng thái đợt 152 | Trạng thái đợt 153 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — CHỈ GIÁM SÁT THỤ ĐỘNG, 1 KẸT THẬT MỚI, WEDGE KHẲNG ĐỊNH LẠI (xem B3)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151) | **BÁC BỎ (đứng nguyên — RSS GIẢM trong lúc kẹt đợt này, xem B3)** |

- Đợt 153 T8 chỉ giám sát thụ động theo quyết (f)/(h): **1 kẹt thật trong 6 lần chạy harness + 0 kẹt trong 3 lần chạy O8**. Chữ ký kẹt mới (kẹt ngay evaluate đầu P1-phaseA, trước HB128 đầu tiên) vẫn đối chiếu được với wedge "chết lặng" bằng 3 snapshot trong lúc kẹt (watchdog 10:38:03Z + live-diag 10:40:37Z + live-diag 10:44:37Z): WebKitWebProcess idle, RSS giảm, vite HTTP 200. KHÔNG mở giả thuyết phân biệt mới — chữ ký mới là biến thể sớm hơn của cùng họ kẹt P1, không phải họ chữ ký khác (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đây vẫn là evaluate đóng băng + page JS chết, cùng họ với các lần kẹt 85m4 trước).
- Điểm quan sát duy nhất (tương quan, không kết luận): avail min 306 MB + balloon max 96,3% rơi đúng vào lúc kẹt (10:46:38Z) — cửa sổ harness đợt này "nặng" hơn đợt 152 (677 MB / 87,9%, 0 kẹt). H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-154 đối chiếu tiếp.

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 153

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–153) + đường ổn định `t8-diag-stall.sh` → 153 (symlink repo cập nhật 08:38Z; symlink hidden-root vẫn trỏ 152 — xem F-153-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **1 kẹt thật → 1 kích hoạt, 0 false-positive** | **1 KÍCH HOẠT — ĐÚNG (bắt kẹt thật 85m4).** Snapshot watchdog ghi nhầm sang thư mục đợt 152 (đã copy về 153 + ghi chú); không có thư mục `smoke/stall-*` nào bị thiếu — đủ 4 snapshot (1 watchdog + 2 live-diag + 1 timeout124) |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–153) | 6 lần chạy harness; `live_diags=2` ở 85m4 WebKit, `live_diags=0` ở 5 lần còn lại | **2 kích hoạt — ĐÚNG THIẾT KẾ** (log im lặng 124 s rồi 364 s trong lúc kẹt; 5 lần PASS không có khoảng im lặng >120 s) |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=59) | Balloon n=59 pinned=0 min=5.078.504 max=6.202.396 (96,3% trần) mean=5.660.000; avail min=306 MB lúc 10:46:38Z (TRONG LÚC KẸT); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness (nhưng balloon ĐÃ ghim trần lúc 10:31Z trước harness — xem F-153-T8-6) |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 10:57:40Z), 85m4 PASS (exit 0, 11:00:05Z), 86n2 PASS (exit 0, 11:04:11Z)** | N cộng dồn **N=15 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **1 lần kẹt → 1 lần kích hoạt (timeout124) + 2 live-diag + 1 watchdog-diag** | Baseline: dmesg EPERM tái xác nhận; journalctl -k "-- No entries --" (watchdog snapshot) / rỗng; timeout124 diag chụp sau khi node chết nên ps trống + vite-http lỗi kết nối (bằng chứng lúc kẹt nằm ở 3 snapshot trước) |

## B3. Chữ ký kẹt — kẹt P1-phaseA sớm nhất từ trước tới nay (đợt 153) + đối chiếu wedge "chết lặng"

- **Đợt 153: 1 KẸT THẬT (WebKit 85m4, P1-phaseA, exit 124).** Dòng thời gian kẹt (log gốc `smoke/run-webkit-85m4.log`): vite ready 10:36:48Z → setup 10:36:57Z → P1 sync 10:37:00.215Z ("element đồng bộ sau 0.8 s, playhead=0.8, ct=1.4") → IM LẶNG → WATCHDOG-137 10:38:03.407Z (evaluate im lặng >60 s tại runEngine:433) → probe 1+1 TIMEOUT 30 s 10:38:33.421Z (kênh evaluate kẹt cùng / page JS chết) → live-diag 10:40:37Z + 10:44:37Z → timeout 900 giết node 10:51:47Z, "HARNESS/FAIL: page.evaluate: Target page, context or browser has been closed", report `ok=false`. **0 dòng HB128** — kẹt trước mẫu heartbeat đầu tiên của P1-phaseA. Đây là lần kẹt 85m4 SỚM NHẤT: các lần trước đều có HB128 rồi mới kẹt (150-lần1 P1-phaseA, 151-lần1 P5-phaseB-long, 151-lần2 P1-waitForPlaySync).
- **Đối chiếu wedge "chết lặng" — 3 snapshot trong lúc kẹt, KHẲNG ĐỊNH LẠI:**

| Snapshot | Thời điểm (Z) | WebKitWebProcess RSS / CPU | MiniBrowser RSS | vite HTTP | MemAvail / Balloon | Load |
|---|---|---|---|---|---|---|
| Watchdog 10:38:03Z (`stall-runEngine_433-1795171083`, ghi nhầm thư mục 152, đã copy về 153) | kẹt +~63 s | 344.220 kB / 0:11 CPU, SLl | 261.572 kB | 200 (0,004 s) | 921 MB / 5.362.132 kB (83,2%) | 1,27 |
| Live-diag #1 10:40:37Z (`stall-live-silence-...-1795171237`) | kẹt +~3,6 phút | 332.476 kB / 0:18 CPU, SLl | 226.728 kB | 200 (0,006 s) | 775 MB / 5.686.604 kB (88,3%) | 0,46 |
| Live-diag #2 10:44:37Z (`stall-live-silence-...-1795171477`) | kẹt +~7,6 phút | 269.036 kB / 0:30 CPU, SLl | 189.868 kB | 200 (0,018 s) | 435 MB / 6.060.608 kB (94,0%) | 0,19 |

- **Đọc wedge:** RSS WebKitWebProcess GIẢM đều 344 → 332 → 269 MB trong lúc kẹt (không leak, không ăn thêm RAM — H3-D1 vẫn BÁC BỎ); CPU chỉ +19 s trong ~6,5 phút (~0,05 core — idle, không spin); vite còn sống và trả HTTP 200 cả 3 lần (vite không chết, chỉ kênh evaluate/page JS chết); MiniBrowser RSS cũng giảm (261 → 226 → 189 MB). Page JS chết lặng trong khi vite + browser shell vẫn sống — đúng wedge "chết lặng" đã ghi từ đợt 137/141/148/150/151. Không có điểm pha nào khác "nóng" đợt này: 84l10/86n2 WebKit + cả 3 pha Chromium đều PASS đủ P1–P5.
- Timeout124 snapshot (10:51:48Z, sau khi node bị giết): ps.txt trống (process đã chết), vite-http curl exit 7, MemAvail 954 MB / Balloon 5.971.316 kB (92,7%), load 0,50 — chỉ có giá trị hậu kiểm, không phải bằng chứng lúc kẹt.

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 153: 1 KẸT, CHUỖI 1 → 0 (ĐỨT)

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
- Đợt 152: **6 lần chạy harness hoàn thành, 0 KẸT, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 06:18:57Z, 85m4 PASS 06:21:32Z, 86n2 PASS 06:25:48Z; Chromium 84l10 PASS 06:27:14Z, 85m4 PASS 06:29:39Z, 86n2 PASS 06:33:45Z — tất cả exit 0, report `ok=true`). Chuỗi **0 → 1 (BẮT ĐẦU LẠI)**.
- Đợt 153: **5 lần chạy harness hoàn thành, 1 KẸT THẬT (85m4 WebKit, P1-phaseA, exit 124)** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 10:36:31Z, 86n2 PASS 10:56:14Z; Chromium 84l10 PASS 10:57:40Z, 85m4 PASS 11:00:05Z, 86n2 PASS 11:04:11Z — tất cả exit 0 trừ 85m4 WebKit, report `ok=true` trừ 85m4 WebKit `ok=false`). Chuỗi **1 → 0 (ĐỨT)**.
- **Mười lần kẹt vẫn là:** đợt 134/135 (3 lần) + đợt 141 (1 lần) + đợt 148 (1 lần) + đợt 150 (2 lần) + đợt 151 (2 lần) + đợt 153 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=15 mỗi pha tới đợt 153, 0 kẹt).

## B5. Yếu tố chung khác — đợt 153: #22 CÓ lượt hợp lệ #21 (boot #45); reboot #46 giữa phiên; replay tới nhanh trên boot #46

- T4 đợt này: **CÓ lượt hợp lệ #21** (attempt2-401fca75 20/20, median 40,0 ms, lớp B 5/5 — lượt hợp lệ thứ ba liên tiếp (151: #19; 152: #20; 153: #21)). Gate harness đợt này theo THỦ TỤC (i) sau waiter hết hạn (không phải gate chuẩn — xem F-153-T8-3). Kẹt probe T4 (nếu có) và kẹt harness T8 (evaluate im lặng) là hai chữ ký khác nhau — đừng gộp thành một lỗi; đợt này T4 0 kẹt probe (attempt1 exit=2 partial wedged — wedged ở phía T4, không phải kẹt harness), T8 1 kẹt thật.
- Reboot #46 giữa phiên (09:04:49Z) — giết waiter + poller T4 trước khi T4 viết cờ; reboot #45 trước phiên (07:32:38Z). Boot #46 ổn định suốt O8 + harness (10:32–11:04Z).
- Replay apt: TỚI MUỘN TỰ NHIÊN trên boot #45 (dpkg 2 → 1545, không cần repair) và TỚI NHANH TỰ NHIÊN trên boot #46 (xong boot+4m23s) — mẫu "replay chết" 3 đợt liên tiếp (150, 151-boot-mới, 152) ĐÃ ĐỨT; T5 theo dõi đợt 154.
- Vite server còn sống lúc kẹt (vite-http 200 cả 3 snapshot trong lúc kẹt) — kẹt nằm ở kênh evaluate/page JS của WebKit, không phải vite chết.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (đứng nguyên). H2: KHÔNG ỦNG HỘ (đứng nguyên). H3: VẪN MỞ, wedge "chết lặng" — giám sát thụ động đợt 153, 1 kẹt thật mới với chữ ký sớm nhất từ trước tới nay (xem §B1a dưới — không có gì để kiểm thêm đợt này ngoài việc đã ghi).
- **H3-D1: BÁC BỎ (đứng nguyên, đợt 151; khẳng định lại đợt 153 — RSS GIẢM 344 → 332 → 269 MB trong lúc kẹt).**
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143; đợt này O8 PASS 3/3 thường kỳ, SAU LƯỢT YÊN HỢP LỆ #21 (boot #45), theo thủ tục (i) sau waiter hết hạn — chuỗi FULL PASS 10 → 11 (chờ T10 xác nhận độc lập).** Không mở điều tra mới về O8.
- **Lượt yên #22 CÓ lượt hợp lệ mới #21 — gate harness đợt này theo THỦ TỤC (i), không phải gate chuẩn.** Parent phán xem nhãn này có đủ chuẩn để tính chuỗi FULL PASS hay không (xem §9.4).

### B6a. Giám sát thụ động đợt 153 — chữ ký mới nhưng cùng họ wedge

Theo quyết (f), T8-153 chỉ ghi nhận chữ ký kẹt nếu kẹt tái diễn. Kết quả: 1 kẹt thật trong 6 lần chạy harness (85m4 WebKit, P1-phaseA) + 0 kẹt trong 3 lần chạy O8. Bảng đối chiếu wedge "chết lặng" đợt này CÓ 3 hàng dữ kiện mới (xem B3): RSS giảm đều, CPU gần như idle, vite HTTP 200 cả 3 lần, probe 1+1 timeout — tất cả khớp wedge. Điểm mới duy nhất: kẹt xảy ra SỚM HƠN mọi lần trước (trước HB128 đầu tiên, ngay evaluate đầu P1-phaseA) — đây là biến thể thời điểm, không phải họ chữ ký khác, nên KHÔNG mở giả thuyết phân biệt mới theo quyết (f). Nếu đợt 154 kẹt lại ở cùng điểm sớm này thì T8-154 ghi nhận thành mẫu tái diễn; quyết đóng/mở lại điều tra là việc parent.

---

## Phụ lục — số liệu trích bằng script từ log gốc (không gõ tay)

Script: `hidden_files/round153-t8/extract-153t8.py` (chạy 11:06:44Z, output đầy đủ tại `hidden_files/round153-t8/smoke/extract-153t8-output.txt`). Mọi số dưới đây đều là output của script đó, đọc từ file gốc.

- Harness (từ `smoke/run-webkit-summary.txt`): WebKit 84l10 start 10:35:11Z exit 0 end 10:36:31Z live_diags=0; WebKit 85m4 start 10:36:46Z exit 124 end 10:51:48Z live_diags=2; WebKit 86n2 start 10:52:04Z exit 0 end 10:56:14Z live_diags=0; Chromium 84l10 start 10:56:30Z exit 0 end 10:57:40Z live_diags=0; Chromium 85m4 start 10:57:55Z exit 0 end 11:00:05Z live_diags=0; Chromium 86n2 start 11:00:21Z exit 0 end 11:04:11Z live_diags=0. ALL DONE 11:04:11Z.
- Report JSON (6 file): 5× `ok=true` (WebKit 84l10 finishedAt 10:36:23.253Z; WebKit 86n2 10:56:04.891Z; Chromium 84l10 10:57:30.239Z; Chromium 85m4 10:59:58.109Z; Chromium 86n2 11:04:09.083Z) + 1× `ok=false` (WebKit 85m4 finishedAt 10:51:47.045Z).
- O8 JSON stamped (3 file): WebKit attempt1 `...-10-32-02-1450ac80-pid17449.json` n=21 ok_true=21; attempt2 `...-10-33-02-1450ac80-pid17793.json` n=21 ok_true=21; Chromium `...-10-33-58-1450ac80-pid18102.json` n=21 ok_true=21. O8 log: PASS S1 6 dòng, FAIL S1 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0; "O8 DONE 2026-11-20T10:34:54Z webkit1=0 webkit2=0 chromium=0".
- Sampler (`smoke/ram-153t8.log`): n=59 pinned=0 min=5.078.504 max=6.202.396 (96,3% trần) mean=5.660.000; avail min=306 MB max=1.497 MB; avail-min + balloon-max cùng dòng 10:46:38Z (avail=306MB, balloon_kb=6202396).
- Watchdog/live-diag: WATCHDOG-137 trong summary 3 dòng; LIVE-DIAG-153 trong summary 2 dòng; probe 1+1 TIMEOUT 30 s: có; dòng P1 cuối trước watchdog: "[2026-11-20T10:37:00.215Z] [webkit] P1: element đồng bộ sau 0.8 s (playhead=0.8, ct=1.4)". Stall dirs (4): `stall-live-silence-webkit-85m4-1795171237`, `stall-live-silence-webkit-85m4-1795171477`, `stall-runEngine_433-1795171083` (copy từ thư mục 152 + COPY-NOTE-153.txt), `stall-webkit-85m4-timeout124-1795171908`.
- MD5 cây lúc đóng: preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093, 84l10 b8c08a7c, 85m4 610ee003, 86n2 628088bd, O8-webkit 4994b4fc, O8-headed c8acd72e (khớp lúc mở).
- Waiter: log boot #45 (27 poll, GATE-FOUND không, WAIT-DEADLINE không); log boot #46 (83 poll + dòng hết hạn poll 84, GATE-FOUND không, WAIT-DEADLINE có 10:30:29Z); t4=1 từ poll 5 (09:11:25Z); postboot=1: 0 dòng trên boot #46.
- Kiểm cuối (lúc chạy script 11:06:44Z): boot 1450ac80, btime 1795165489; process sót 0; /tmp/.X11-unix/ 0 file; lock vite TRỐNG (0 ticket + 101 cooldown); symlink repo → `round153-t8/diag-stall-153t8.sh`; symlink hidden-root → `round152-t8/diag-stall-152t8.sh` (stale — xem F-153-T8-5); LIMITS đợt 152: 38.561 B; kích thước script: 86n2 39.194 B, 84l10 32.680 B, 85m4 37.111 B.
- Nguồn bằng chứng kẹt (đọc tay từ file gốc, không phải số đo tự động — chỉ trích nguyên văn): `smoke/run-webkit-85m4.log` (dòng P1 sync, WATCHDOG-137, probe timeout, HARNESS/FAIL); 4 thư mục stall-* (ps.txt / meminfo.txt / vite-http.txt / free.txt / loadavg.txt); `smoke/run-webkit-summary.txt` (ALL DONE + released từng pha); `smoke/ram-153t8.log` (sampler, đã trích bằng script ở trên).
