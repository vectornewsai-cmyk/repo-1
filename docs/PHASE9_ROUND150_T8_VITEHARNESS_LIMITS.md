# Đợt 150 T8 — O8 PASS 3/3 SAU KHI POLLER T4 THOÁT (T4 0 ATTEMPT, KHÔNG QUA GATE) + HARNESS 2 KẸT THẬT (85m4 P1 BOOT1, 86n2 P5 BOOT2) + REBOOT #41 GIỮA HARNESS — #22 VẪN MỞ, CHUỖI "P3 KHÔNG KẸT" ĐỨT

Ngày: 19–20/11/2026 (lượt cron 06:35 +07 20/11 = 23:35:51Z 19/11; T8 mở ~23:41Z, đóng ~01:5xZ — trải 2 boot: `e9295700` rồi `2e430750` sau reboot #41 giữa harness). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy SAU KHI POLLER T4 THOÁT (không qua gate, xem F-150-T8-1); (2) harness đứng — 2 lần chạy driver, 2 boot; (3) watchdog GIỮ NGUYÊN bản vá đợt 142, KHÔNG revert — đợt này nó KÍCH HOẠT 2 LẦN, BẮT ĐƯỢC 2 KẸT THẬT. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG sửa script O8 gốc, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND149_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 sau cờ T4, tuân (j) lần đầu; harness 6/6, 3 lần chạy driver, 2 boot; 0 kẹt; chuỗi FULL PASS 6 → 7; chuỗi "P3 không kẹt" 0 → 1; quyết parent (e): đợt 149 là đợt ghim trần MỚI, T8 phán "đứt" là SAI); aggregate đợt 149 §7, §11, §12.3 parent (a)–(r) (quyết (f) nhãn "sau khi T4 đóng cờ"; quyết (i) #22 mở; quyết (l) replay trễ + cache 0; quyết (p) truy chủ testsrc2; quyết (e) chuỗi ghim trần).

## 0. Kết luận ngắn — O8 PASS 3/3, HARNESS 2 KẸT THẬT + 1 LẦN BỊ REBOOT GIẾT, #22 VẪN MỞ

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (01:02:14–01:05:17Z, 3'03", boot `e9295700`, cùng cây preview.tsx `530e10a7` + cùng script O8 gốc md5 `ecbd1b40`, KHÔNG sửa). S1 PASS cả 3 lần (WebKit: 01:02:32 + 01:03:31, Playwright mouse click lần 2; Chromium: 01:04:44, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả hai engine (kiểm độc lập bằng python). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Chuỗi WebKit FULL PASS: 7 → 8 (chờ T10 xác nhận độc lập lúc đóng sổ)** — O8 WebKit 21/21 ×2 đợt này trên boot `e9295700`. Chuỗi này đếm O8, không đếm harness — 2 kẹt harness đợt này KHÔNG làm đứt chuỗi O8 (tiền lệ đợt 148: harness kẹt 1 lần nhưng O8 pass, chuỗi vẫn tăng 5 → 6).
- **Gate: HARNESS KHÔNG QUA GATE (F-150-T8-1 — thủ tục F-143-T8-2).** T4 0 attempt (poller hết hạn 01:00:32Z, exit 5, 97 poll gate0 không đạt lần nào); waiter T8 hết hạn 01:00:54Z (poll 79, GATE NOT MET, exit 3). T8 chạy sau khi xác nhận T4 không đo (0 attempt, lock trống, không process T4, load ~0,6). **Nhãn trích: "harness sau khi poller T4 thoát (01:00:32Z), T4 0 attempt" — KHÔNG trích là "sau cờ T4"** (cờ `round150-t4.done` chỉ viết 01:05:18Z, SAU khi O8 đã bắt đầu 01:02:13Z — xem F-150-T4-4 trong LIMITS T4) **và KHÔNG trích là "sau lượt yên hợp lệ"** (không có lượt hợp lệ nào tồn tại; #22 VẪN MỞ).
- **Harness lần 1 (boot `e9295700`, system libs sau repair T5): 84l10 PASS + 85m4 KẸT THẬT (exit 124) + 86n2 KHÔNG CÓ VERDICT (bị reboot #41 giết giữa P4).** Chromium chưa chạy đã bị giết theo driver.
- **Harness lần 2 (boot `2e430750`, system libs sau replay boot mới): 84l10 PASS + 85m4 PASS (kẹt KHÔNG tái diễn) + 86n2 KẸT THẬT (exit 124, P5 resetPlayhead0) + Chromium 84l10 PASS (exit 0, 01:51:51Z), 85m4 PASS (exit 0, 01:54:07Z), 86n2 PASS (exit 0, 01:58:12Z) — xem §2 lần 2.**
- **2 KẸT THẬT trong một đợt — lần đầu kể từ đợt 141 (1 kẹt) và là đợt nhiều kẹt nhất kể từ đợt 134/135 (3 kẹt). Chuỗi "P3 không kẹt": 1 → 0 (ĐỨT).** Cả 2 kẹt đều đúng chữ ký H3 (evaluate im lặng >60 s → watchdog chụp chẩn đoán → probe 1+1 timeout 30 s → playhead đóng băng; vite HTTP 200 suốt lúc kẹt). H3 VẪN MỞ — được ủng hộ thêm bằng bằng chứng live thứ 2 và thứ 3 (xem Phần B).
- **REBOOT #41 GIỮA HARNESS (F-150-T8-3):** btime /proc/stat 01:25:51Z (epoch 1795137951); boot `e9295700` → `2e430750`. Giết driver harness lần 1 giữa 86n2 WebKit P4 (P1/P2/P3 đã PASS; P4 chưa có verdict). Boot cũ sống 6.822 s (23:32:09Z → 01:25:51Z, stat→stat). Lock vite stale được chính lock script dọn (owner pid chết + không vite trên cổng + curl 000 + boot đổi — kiểm chứng bằng acquire/release thử trước khi chạy lại).
- **Replay apt trên boot `e9295700` KHÔNG TỚI (F-150-T8-4):** watcher T5 TIMEOUT 00:44:15Z (120 poll giống hệt nhau, dpkg 2 dòng, cache 0, gst 0). T5 chạy --repair tay 00:50:59–01:04:59Z (exit 0): GST symlink → debroot (269 file) + apt-get update + cài đủ 11 gói; RE-CHECK toàn PASS; POSTBOOT_PASS mới 01:05:33Z poll=1 (cờ repair-1-phần, KHÔNG phải replay-đầy-đủ). **Harness lần 1 chạy bằng SYSTEM LIBS thật sau repair** (libevent/libEGL/libavif/libdw/libevdev đủ 5/5 qua apt; GST qua symlink repair tạo sang debroot — ghi rõ, xem F-150-T8-5). Đây là đối chiếu F-149-T8-5 mà T5 yêu cầu: WebKit bằng system libs (sau repair) so với DEBROOT đợt 149 — kết quả: 84l10 PASS, 85m4 KẸT (không phải fail launch) — lỗi launch môi trường đợt 149 đã hết, kẹt runtime H3 còn nguyên.
- **Boot mới `2e430750`: system libs CÒN NGUYÊN sau reboot** (khác boot 802f358f đợt 149): libevent/libEGL/libavif đủ, GST là thư mục thật 269 file, dpkg 1.524 dòng, cache 177 .deb, lists 37 — replay boot mới (os-intent replay) ĐANG CHẠY lúc T8 kiểm 01:30Z (apt-get install xfonts-scalable). Harness lần 2 chạy bằng system libs trên boot mới (GST thư mục thật, không qua symlink debroot).
- **Watchdog: KÍCH HOẠT 2 LẦN, BẮT ĐÚNG 2 KẸT (F-150-T8-6).** Lần 1 (85m4 boot1): 01:10:38Z + probe timeout 01:11:08Z. Lần 2 (86n2 boot2): 01:37:52Z + probe timeout 01:38:22Z; thêm driver live-diag 01:40:25Z (log im lặng >120 s — P5 86n2 không có heartbeat nên đường (1b) mới kích hoạt được, khác 85m4 có HB128 giữ log sống). 0 false-positive. **Lỗi vận hành: symlink `t8-diag-stall.sh` vẫn trỏ script đợt 149 lúc kẹt đầu** — chẩn đoán lần 1 ghi nhầm sang `round149-t8/smoke/` (đã copy về round150 + sửa symlink 01:16Z; lần 2 ghi đúng chỗ).
- **Balloon trong cửa sổ harness T8: 0 mẫu ghim trần cả 2 boot** (boot1: n=38, max 6.105.864 kB = 94,8% trần; boot2: n=24+…, max ~6.105.180 kB = 94,7%). Sampler T9 (phủ toàn đợt, boot `e9295700`): 28/97 mẫu ghim, ĐỨT lúc 00:58:37Z (quan sát được điểm kết thúc); T9 KHÔNG phán nối/đứt — giao T10 theo quyết (e). Sampler T8 chỉ đối chiếu trong cửa sổ harness, không phán chuỗi.
- **RAM avail min trong cửa sổ harness: boot1 301 MB; boot2 278 MB.** Cả hai đều trên kỷ lục thấp 272 MB đợt 148 — chưa phá kỷ lục.
- **T8 ĐÓNG 01:58:59Z — SAU hạn cờ ~01:30Z (do reboot #41 + 2 kẹt), TRƯỚC hạn cứng 02:00Z.**

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 23:32:09 19/11 | REBOOT #40 (btime /proc/stat) — boot mới `e9295700`, TRƯỚC khi lượt cron 150 mở 23:35:51Z |
| ~23:41 | T8 mở: RAM avail ~526 MB, balloon 5.684.904 kB; đọc LIMITS T8-149 + aggregate 149 §12.3 (f); cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 149 (không đổi) |
| 23:42:40 | Waiter T8 bắt đầu (deadline 01:00Z 20/11); T4 đang poll gate (postboot FAIL, replay chưa tới) — T8 KHÔNG rebuild fixture lúc này để khỏi làm phiền phép đo yên |
| 23:43:55–00:44:15 | Watcher replay T5: 120 poll giống hệt nhau (dpkg 2 dòng, gst 0, cache 0) → **TIMEOUT 00:44:15Z, replay KHÔNG TỚI** |
| 00:50:59–01:04:59 | **T5 chạy --repair tay (14m00s, exit 0)**: GST symlink → debroot + apt-get update + cài đủ 11 gói; RE-CHECK toàn PASS |
| 01:00:32 | **Poller T4 hết hạn, exit 5 — 0 ATTEMPT** (97 poll, gate0 không đạt lần nào) |
| 01:00:54 | **Waiter T8 hết hạn (poll 79, GATE NOT MET, exit 3)** — kiểm chứng T4 0 attempt + lock trống + không process T4 → chạy theo thủ tục F-143-T8-2 |
| 01:02:06 | Fixture REBUILD lần 1: 6/6 md5 khớp đợt 125 |
| 01:02:13–01:05:17 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — sau khi poller T4 thoát, TRƯỚC khi cờ T4 viết 01:05:18Z |
| 01:05:18 | T4 viết cờ `round150-t4.done` (#22 VẪN MỞ — 0 attempt) |
| 01:05:33 | T5 ghi POSTBOOT_PASS mới cho boot `e9295700` (poll1 độc lập exit 0) |
| 01:07:44–01:09:04 | **Harness lần 1, WebKit 84l10: PASS** (system libs sau repair) |
| 01:09:20–01:24:21 | **Harness lần 1, WebKit 85m4: KẸT THẬT, exit 124** — P1-phaseA sampleFor đóng băng n=5/100 (xem §2) |
| 01:24:37–~01:25:5x | **Harness lần 1, WebKit 86n2: P1/P2/P3 PASS, bị REBOOT #41 giết giữa P4 — KHÔNG VERDICT** |
| 01:25:51 | **REBOOT #41** (btime /proc/stat; boot mới `2e430750`) |
| 01:30:09 | T8 kiểm: boot mới `2e430750`, system libs CÒN NGUYÊN (replay boot mới đang chạy), lock vite stale |
| 01:31:10 | Kiểm chứng dọn lock stale: acquire thử THÀNH CÔNG ngay (lock script tự xóa lock stale vì boot đổi), release — lock TRỐNG |
| 01:31:31 | Fixture REBUILD lần 2 (sau reboot #41 — /tmp đã mất): 6/6 md5 khớp đợt 125 |
| 01:31:34–01:32:44 | **Harness lần 2, WebKit 84l10: PASS** (system libs boot mới) |
| 01:32:59–01:35:06 | **Harness lần 2, WebKit 85m4: PASS** — kẹt lần 1 KHÔNG tái diễn |
| 01:35:25–~01:50:25 | **Harness lần 2, WebKit 86n2: P4 3/3 PASS, rồi KẸT THẬT ở P5 resetPlayhead0, exit 124** (xem §2) |
| 01:50:41–01:58:12Z | **Harness lần 2, Chromium 84l10/85m4/86n2: 3/3 PASS (exit 0, report ok=true)** |
| 01:58:59Z | Kiểm cuối + LIMITS + stage file + cờ `round150-t8.done` |

## A. O8 — PASS 3/3 trên boot `e9295700`, SAU KHI POLLER T4 THOÁT (KHÔNG QUA GATE)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 01:02:14–01:03:18 | 0 | **21/21 PASS** — S1 PASS 01:02:32 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 01:03:18–01:04:17 | 0 | **21/21 PASS** — S1 PASS 01:03:31, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 01:04:17–01:05:17 | 0 | **21/21 PASS** — S1 PASS 01:04:44 "checked=true → false, CDP mouse click lần 2" |

- Report JSON: `o8-webkit/o8w-clicktest-report.json` 21 kết quả `ok=true` 21/21; `o8-chromium/o8-clicktest-report.json` 21/21 `ok=true` (kiểm độc lập bằng python — WebKit chỉ 1 file JSON cho 2 attempt, như đợt 148/149; cả 2 attempt đều 21/21 trong log text `o8-150t8.log`). 0 dòng `HARNESS LỖI`, 0 `Target crashed`.
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã có sau repair — repair chỉ xong 01:04:59Z, GIỮA lúc O8 chạy; attempt1/2 đều khởi động trước khi repair xong). Ghi rõ để T10 không trích O8 là "chạy bằng system libs".
- Driver O8 giữ 1 lock vite `t8-round150` suốt lượt (giữ 183 s, đã nhả 01:05:17Z; vite sau release curl 5560/5554 = 000000 — vite theo lượt đã xuống, đúng thiết kế).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-150t8.mjs`, `node --check` OK) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 7 → 8 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 149 = 7; đợt này T8 pass 21/21 ×2 trên boot `e9295700`.
- **O8 đợt này 3'03" tổng** (147: 2'27", 148: 4'03", 149: 2'32") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — 2 lần chạy driver, 2 boot

### Lần 1 — boot `e9295700`, 01:07:44–~01:25:5xZ (bị reboot #41 giết giữa 86n2)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 01:07:44–01:09:04 | **PASS** — report `ok=true` (W1 3/3 delta +1 sạch, E4 PASS) |
| 2 | WebKit 85m4-hb128 | **124** | 01:09:20–01:24:21 | **KẸT THẬT** — P1-phaseA sampleFor đóng băng (xem F-150-T8-2) |
| 3 | WebKit 86n2 | — | 01:24:37–~01:25:5x | **KHÔNG CÓ VERDICT** — reboot #41 giết driver giữa P4 (P1/P2/P3 đã PASS); không có report JSON |

- 1 report JSON WebKit `ok=true` (84l10) + 1 report `ok=false` (85m4, `finishedAt` 01:24:20Z = lúc timeout giết) — kiểm độc lập bằng python.
- Môi trường lần 1: system libs sau repair T5 (5 lib apt-cài thật; GST là symlink repair tạo sang debroot — xem F-150-T8-5). **WebKit launch THÀNH CÔNG cả 3 pha** — khác hẳn lần 2 đợt 149 (0/3 fail launch do thiếu lib). Lỗi launch môi trường đã hết; còn lại là kẹt runtime.

### Lần 2 — boot `2e430750`, 01:31:34–01:58:12Z (system libs sau replay boot mới)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 01:31:34–01:32:44 | **PASS** — report `ok=true` |
| 2 | WebKit 85m4-hb128 | 0 | 01:32:59–01:35:06 | **PASS** — report `ok=true` (P4 3/3 delta +1; P5 40 s 0 restart dư, seek kẹt 0 mẫu) — kẹt lần 1 KHÔNG tái diễn |
| 3 | WebKit 86n2 | **124** | 01:35:25–~01:50:25 | **KẸT THẬT** — P4 3/3 PASS, rồi P5 resetPlayhead0 đóng băng (xem F-150-T8-3) |
| 4 | Chromium 84l10 | 0 | 01:50:41Z–01:51:51Z | **PASS** — report `ok=true` |
| 5 | Chromium 85m4-hb128 | 0 | 01:52:07Z–01:54:07Z | **PASS** — report `ok=true` |
| 6 | Chromium 86n2 | 0 | 01:54:22Z–01:58:12Z | **PASS** — report `ok=true` |

- Môi trường lần 2: system libs boot mới (GST thư mục thật 269 file, không qua symlink debroot; libevent/libEGL/libavif đủ; replay os-intent ĐANG CHẠY song song lúc harness chạy — apt-get install xfonts-scalable lúc 01:30Z, xem F-150-T8-7).
- Fixture REBUILD 2 lần đợt này (lần 1 sau khi poller T4 thoát, lần 2 sau reboot #41): 6/6 md5 khớp đợt 125 cả 2 lần (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).

## 3. Watchdog trong lượt này — KÍCH HOẠT 2 LẦN, BẮT ĐÚNG 2 KẸT THẬT

- **Kẹt 1 (85m4 boot1):** watchdog (i) kích hoạt 01:10:38Z ("evaluate im lang >60s tai sampleFor-P1-phaseA"), diag script chạy xong 01:10:39Z; probe 1+1 TIMEOUT 30 s lúc 01:11:08Z ("kenh evaluate ket cung / page JS chet"). Driver (1b) live-diag: **0 kích hoạt** — đúng thiết kế: HB128 in heartbeat mỗi 5 s nên log không bao giờ im >120 s (đường (1b) canh im lặng log, không canh đóng băng playhead). 3 dòng `WATCHDOG-137` trong log 85m4 lần 1.
- **Kẹt 2 (86n2 boot2):** watchdog (i) kích hoạt 01:37:52Z ("evaluate im lang >60s tai resetPlayhead0:299"), diag script chạy xong 01:37:52Z; probe 1+1 TIMEOUT 30 s lúc 01:38:22Z. Driver (1b) live-diag: **KÍCH HOẠT 01:40:25Z** (log im lặng >120 s — P5 86n2 không có heartbeat như HB128 của 85m4 — xem F-150-T8-8), diag live với devUrl thật, ghi vào `stall-live-silence-webkit-86n2-1795138825/`. 3 dòng `WATCHDOG-137` trong log 86n2 lần 2.
- **0 false-positive cả lượt.** 84l10 (cả 2 boot) + 85m4 lần 2 + O8 (3 lần): 0 dòng `WATCHDOG-137`.
- **Lỗi vận hành — symlink diag trỏ nhầm đợt (F-150-T8-6):** lúc kẹt 1, symlink ổn định `hidden_files/t8-diag-stall.sh` vẫn trỏ script đợt 149 (`round149-t8/diag-stall-149t8.sh`) vì T8-150 quên cập nhật khi dựng thư mục đợt — chẩn đoán kẹt 1 ghi vào `round149-t8/smoke/stall-sampleFor-P1-phaseA-1795137038/` (đã copy nguyên thư mục về `round150-t8/smoke/` + cập nhật symlink sang `round150-t8/diag-stall-150t8.sh` lúc 01:16Z). Kẹt 2 + diag timeout-124 + live-diag đều ghi đúng `round150-t8/smoke/`. Nội dung chẩn đoán kẹt 1 không mất — chỉ sai vị trí ghi. Bài học: checklist mở đợt phải gồm "cập nhật symlink t8-diag-stall.sh" (đợt 149 đã làm, đợt 150 sót).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–149 §12.3(l)). Đợt này là lần đầu watchdog bắt được kẹt kể từ đợt 148 (1 kẹt) — và là lần đầu bắt 2 kẹt trong một đợt.

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–150) + đường ổn định `t8-diag-stall.sh` → 150 (symlink đã cập nhật 01:16Z, sau kẹt 1) | 5 lần chạy harness hoàn thành (84l10 ×2, 85m4 ×2, 86n2 ×1) + 3 lần chạy O8; **2 kẹt → 2 kích hoạt, 0 false-positive** | **BẮT ĐÚNG CẢ 2 KẸT.** 3 dòng `WATCHDOG-137` mỗi lần kẹt |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–150) | 5 lần chạy harness hoàn thành; `live_diags=0` ở 84l10/85m4 (log có heartbeat), `live_diags=1` ở 86n2 lần 2 | **1 kích hoạt, đúng lúc (01:40:25Z, log im >120 s trong kẹt 2).** `dev-url.txt` ghi đủ scratch |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-150t8.sh` (cột `balloon_kb`) | 2 lần chạy driver → 2 log sampler (boot1 n=38, boot2 n=54) | Balloon boot2 n=54 pinned=0 min=5061148 max=6236484 (96.8% trần) mean=5762881; avail min=278 MB max=1593 MB; **0 mẫu ghim trần** (xem F-150-T8-9) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 01:51:51Z), 85m4 PASS (exit 0, 01:54:07Z), 86n2 PASS (exit 0, 01:58:12Z)** | N cộng dồn **N=12 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150 mỗi đợt N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **2 lần kẹt → kích hoạt 2 lần** (stall-sampleFor-P1-phaseA + stall-resetPlayhead0_299 + stall-live-silence + stall-webkit-85m4-timeout124) | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng — cả 2 boot. Lúc kẹt: vite HTTP 200 cả 2 lần (xem §B3) |

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

- Không sửa code app, không sửa script harness/O8 nào trong đợt này. Batch stage chỉ có LIMITS này (1 file) — như đợt 149. Driver trong hidden_files có 3 thay đổi nhỏ so với đợt 149: nhãn log `LIVE-DIAG-149` → `LIVE-DIAG-150`, deadline waiter 22:15Z → 01:00Z (hạn cờ đợt này), lock `t8-round149` → `t8-round150` — cả ba chỉ là chuỗi/hằng số trong bản copy, không chạm script repo. Thêm mới: bản copy driver WebKit-only qua DEBROOT `run-webkit-150t8-debroot.sh` — **KHÔNG DÙNG đợt này** (system libs đã có sau repair/replay; xem F-150-T8-5).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round150` 01:05:17Z (giữ 183 s); driver harness lần 1 bị reboot #41 giết (lock stale đã dọn bằng cơ chế của lock script, kiểm chứng acquire/release thử 01:31:10Z); driver lần 2 đã nhả lock sau mỗi lần chạy (xem summary: released từng pha; kiểm cuối lock: vite-lock-v2: TRỐNG (không có lock)).
- Kiểm cuối 01:58:59Z: process Xvfb/MiniBrowser/WebKit/Chromium còn sót: 0; `/tmp/.X11-unix/` còn 0 file; lock vite: vite-lock-v2: TRỐNG (không có lock); boot `2e430750` ổn định (uptime xem lúc kiểm).
- Không kiểm lại TTS 39; không thử birefnet (RAM avail lúc chạy xuống 301 MB — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Harness đợt này KHÔNG PHẢI 6/6 trong một lần chạy driver, cũng KHÔNG PHẢI 6/6 cộng hai lần chạy.** Lần 1: 84l10 PASS + 85m4 KẸT + 86n2 KHÔNG VERDICT (reboot giết) + Chromium CHƯA CHẠY. Lần 2: 84l10 PASS + 85m4 PASS + 86n2 KẸT + Chromium 3/3 PASS (exit 0, report ok=true). Đừng trích "harness 6/6" cho đợt này theo bất kỳ cách cộng nào.
2. **Gate đợt này KHÔNG QUA GATE — KHÔNG ĐƯỢC TRÍCH là "harness sau lượt yên hợp lệ" VÀ KHÔNG ĐƯỢC TRÍCH là "harness sau cờ T4"** (F-150-T8-1): #22 MỞ với 0 attempt; O8/harness chạy sau khi poller T4 thoát (01:00:32Z) nhưng TRƯỚC khi cờ T4 viết (01:05:18Z). Nhãn đúng duy nhất: **"sau khi poller T4 thoát, T4 0 attempt"**.
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã có sau repair. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness lần 1/2 (standard driver, không LD_LIBRARY_PATH).
4. **Harness lần 1 chạy bằng system libs SAU REPAIR — với caveat GST là symlink → debroot** (F-150-T8-5): 5 lib là apt-cài thật, nhưng toàn bộ plugin GST đi qua symlink repair tạo. Chỉ harness lần 2 (boot mới, GST thư mục thật) mới là "system libs" đầy đủ theo nghĩa chặt. Đừng gộp hai lần chạy thành một nhãn "system libs" duy nhất.
5. **Chuỗi WebKit FULL PASS = 8 CHỜ T10 xác nhận độc lập** — T8 pass 21/21 ×2 đợt này (trên boot `e9295700`, sau khi poller T4 thoát). Chuỗi này đếm O8, không bị 2 kẹt harness làm đứt.
6. **Chuỗi "P3 không kẹt" 1 → 0 (ĐỨT):** 2 kẹt đợt này (85m4 P1 boot1 + 86n2 P5 boot2). 86n2 WebKit lần 1 KHÔNG CÓ VERDICT (chết vì reboot, không phải vì kẹt) — đừng đếm lần đó vào chuỗi pass/kẹt theo hướng nào.
7. **2 kẹt đợt này là KẸT RUNTIME H3, không phải lỗi launch/môi trường** — WebKit launch thành công mọi pha cả 2 boot; vite HTTP 200 lúc kẹt; RAM lúc kẹt bắt đầu 929 MB / 711 MB (không tuyệt đối thấp); balloon 82–88% trần (không ghim). Đừng trích "WebKit fail" mà không kèm chữ ký kẹt đầy đủ.
8. **86n2 P4-lần2 PASS cả 2 lần chạy có verdict** (lần 1 bị giết giữa P4 nên không tính; lần 2 P4 3/3 PASS, đồng bộ 2,4/1,2/1,3 s) — pha nóng đợt 141/148 sạch 2 đợt liên tiếp (149 + 150-lần-2); kẹt đợt này rơi vào P1 (85m4) và P5 (86n2), không phải P4. H3 vẫn mở, chưa giải thích cơ chế.
9. **Balloon KHÔNG ghim trần trong cửa sổ harness T8** (0 mẫu ghim cả 2 boot, max ~94,8% trần) — nhưng sampler T9 (phủ toàn đợt, boot `e9295700`) ghi 28/97 mẫu ghim, ĐỨT 00:58:37Z. Đừng dùng số T8 để phán chuỗi ghim trần — T9 mới là nguồn phán chuỗi (giao T10 theo quyết (e)).
10. **T8 ĐÓNG 01:58:59Z — SAU HẠN CỜ ~01:30Z (do reboot #41 + 2 kẹt), TRƯỚC HẠN CỨNG 02:00Z — lần đầu tiên kể từ đợt 143 T8 đóng sau hạn cờ (đợt 148/149 đều đóng trước hạn). Lớp bảo vệ hạn (waiter deadline 01:00Z) đã kích hoạt đúng như thiết kế (GATE NOT MET, chạy theo thủ tục F-143-T8-2).
11. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–150 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
12. **Chromium 84l10 W1 lần 2: lần1 delta +2 (0→2); lần2 delta +1 (0→3); lần3 delta +1 (0→5)** (đối chiếu trôi +2 các đợt 146–149 — xem log run-chromium-84l10.log).

## 8. Sai số mới (F-150-T8-N)

- **F-150-T8-1 — GATE KHÔNG QUA: HARNESS SAU KHI POLLER T4 THOÁT, T4 0 ATTEMPT (thủ tục F-143-T8-2, hướng mới so với đợt 149):** cờ T4 không tồn tại lúc waiter hết hạn; poller T4 thoát exit 5 lúc 01:00:32Z ("HET HAN CHO 01:00Z — 0 attempt", poll cuối #97, gate0 không đạt 97/97); waiter T8 hết hạn 01:00:54Z (poll 79, GATE NOT MET, exit 3). T8 kiểm chứng trước khi chạy: 0 process T4 (poller đã chết, không attempt nào chạy), lock vite TRỐNG, load1 0,59, RAM avail 681 MB. O8 bắt đầu 01:02:13Z, harness lần 1 bắt đầu 01:07:44Z. **Cờ `round150-t4.done` chỉ viết 01:05:18Z — SAU khi O8 đã bắt đầu** (T4 viết cờ lúc đóng phiên, sau poller thoát 5 phút). Theo F-150-T4-4 (LIMITS T4): trích là "harness sau khi poller T4 thoát", KHÔNG trích là "sau cờ T4". Chuẩn (i) "sau lượt yên hợp lệ" KHÔNG thỏa (không có lượt hợp lệ nào). Đây là lần đầu tiên kể từ đợt 143 gate rơi vào dạng này (đợt 143: T4 0 attempt vì thiếu cờ T5 sau reboot #30; đợt 150: T4 0 attempt vì replay không tới + postboot FAIL 97/97). Để T10/parent phán có chấp nhận trích harness đợt 150 không — và trích theo nhãn nào.
- **F-150-T8-2 — KẸT THẬT #1: 85m4 WEBKIT P1-PHASEA ĐÓNG BĂNG (BOOT `e9295700`, SYSTEM LIBS SAU REPAIR):** P1 đồng bộ sau 1,9 s (playhead 1,133, ct 1,333), ép ended → restart 0→1 fired, gỡ ghi đè xong; rồi `sampleFor P1-phaseA` đóng băng ngay từ mẫu đầu: **n=5/100, lastCt=1,868, lastPlayhead=1,867 không đổi từ elapsed=5 s tới lúc bị giết (elapsed=885 s trong log cuối)** — video dừng hẳn ở ct≈1,87 s, không seeking. Watchdog (i) 01:10:38Z (evaluate im lặng >60 s) + diag script 01:10:39Z + probe 1+1 TIMEOUT 30 s 01:11:08Z ("kenh evaluate ket cung / page JS chet"). Timeout 900 giết node 01:24:20Z, exit 124; report `ok=false` (`finishedAt` 01:24:20Z). **RAM lúc kẹt bắt đầu: avail 929 MB (01:09:41Z), balloon 5.293.684 kB (82,1% trần)** — không tuyệt đối thấp, không ghim trần → H1/H2 không được ủng hộ (xem Phần B). Vite HTTP 200 lúc chẩn đoán (01:10:39Z, 0,014 s) → vite sống, kẹt ở renderer/page WebKit. Load lúc chẩn đoán 0,77 — máy yên. **Kẹt KHÔNG tái diễn ở lần 2 (boot mới): 85m4 PASS 01:32:59–01:35:06Z** (P4 3/3 + P5 40 s 0 restart) — kẹt này không gắn với pha (phase-flaky) hay boot cố định.
- **F-150-T8-3 — KẸT THẬT #2: 86n2 WEBKIT P5 RESETPLAYHEAD0 ĐÓNG BĂNG (BOOT `2e430750`, SYSTEM LIBS SAU REPLAY):** P1/P2/P3 PASS, P4-lần1/2/3 PASS (đồng bộ 2,4/1,2/1,3 s, delta +1); rồi `resetPlayhead0:299` (chuẩn bị P5) đóng băng: watchdog (i) 01:37:52Z (evaluate im lặng >60 s) + diag 01:37:52Z + probe 1+1 TIMEOUT 30 s 01:38:22Z; **driver live-diag (1b) kích hoạt 01:40:25Z** (log im lặng >120 s — P5 86n2 không có heartbeat, khác 85m4). Timeout 900 giết node 01:50:25Z, exit 124 (end 01:50:26Z, live_diags=2 — xem F-150-T8-8). **RAM lúc kẹt bắt đầu: avail ~711 MB (01:36:31Z), balloon 5.634.472 kB (87,4% trần)** — không tuyệt đối thấp, không ghim. Vite HTTP 200 lúc chẩn đoán live (01:40:25Z, 0,007 s). **2 kẹt trong 1 đợt, 2 pha khác nhau (P1-phaseA vs P5-reset), 2 boot khác nhau, 2 nguồn system libs khác nhau (repair vs replay)** — kẹt không gắn với một pha, một boot hay một nguồn lib cụ thể. Đây là bằng chứng live mạnh nhất cho H3 kể từ đợt 141/148 (mỗi đợt 1 kẹt).
- **F-150-T8-4 — REPLAY APT TRÊN BOOT `e9295700` KHÔNG TỚI (DỮ KIỆN CỦA T5, T8 CHỈ GHI CHÉO VÌ ẢNH HƯỞNG TRỰC TIẾP TỚI GATE + HARNESS):** watcher T5 120 poll giống hệt nhau (dpkg 2 dòng, md5 ba3a7c19, apt=[], dpkg=[], gst_sys=0, cache=0, lists=3) rồi TIMEOUT 00:44:15Z (boot+72m). Đây là boot thứ 2 liên tiếp replay không tới (802f358f đợt 149 cũng vậy). T5 --repair tay 00:50:59–01:04:59Z (14m00s, exit 0) mới cứu được boot — nhưng xong 01:04:59Z, **SAU hạn cắt poller T4 01:00Z đúng 5 phút** nên T4 vẫn 0 attempt. T5 LIMITS §9.2: đường xử lý đứng nếu boot sau lặp lại mẫu này là watcher 60' → TRIGGER form B → --repair (đã dùng 3 lần liên tiếp thành công: 142, 149 boot 2, 150). Nợ T5-151 + parent (quyết (c) chờ — xem §9).
- **F-150-T8-5 — HARNESS LẦN 1 CHẠY BẰNG SYSTEM LIBS SAU REPAIR — ĐỐI CHIẾU F-149-T8-5 XONG, VỚI CAVEAT GST SYMLINK:** 5 lib (libevent-2.1.so.7, libEGL.so.1, libavif.so.16, libdw.so.1, libevdev.so.2) là apt-cài thật (RE-CHECK PASS trong log repair + T5 poll1 PASS 01:05:33Z); nhưng `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` là **symlink repair tạo → debroot** (269 file), không phải thư mục thật. Postboot re-check gọi là "ĐỦ ĐIỀU KIỆN chạy WebKit" — và harness lần 1 chứng minh đúng: WebKit launch thành công cả 3 pha (84l10 PASS, 85m4 chạy tới P1 rồi kẹt runtime, 86n2 chạy tới P4 rồi bị reboot giết — không pha nào fail launch). So với DEBROOT đợt 149 (WebKit 3/3 PASS qua LD_LIBRARY_PATH + GST_PLUGIN_PATH trỏ debroot): lần này lib chính là system, chỉ GST đi qua symlink — hẹp hơn DEBROOT toàn phần. **Harness lần 2 (boot mới) mới là "system libs" đầy đủ:** GST thư mục thật 269 file (mtime 01:28Z, do replay boot mới cài), libevent đủ — WebKit launch thành công cả 3 pha, 85m4 PASS, 86n2 kẹt runtime ở P5. **Kết luận đối chiếu: lỗi launch môi trường đợt 149 đã hết trên cả 2 boot; kẹt runtime H3 còn nguyên và không liên quan nguồn lib.** Bản copy driver debroot `run-webkit-150t8-debroot.sh` KHÔNG DÙNG đợt này (không cần — system libs đã đủ cả 2 boot).
- **F-150-T8-6 — SYMLINK `t8-diag-stall.sh` TRỎ NHẦM ĐỢT LÚC KẸT 1 (LỖI VẬN HÀNH CỦA T8, ĐÃ SỬA):** symlink ổn định vẫn trỏ `round149-t8/diag-stall-149t8.sh` lúc watchdog kẹt 1 gọi diag (01:10:39Z) — vì T8-150 copy script sang round150 nhưng quên cập nhật symlink (đợt 149 đã cập nhật trong checklist đóng). Chẩn đoán kẹt 1 ghi vào `round149-t8/smoke/stall-sampleFor-P1-phaseA-1795137038/` — T8 đã copy nguyên thư mục về `round150-t8/smoke/` (cùng tên) + cập nhật symlink sang `round150-t8/diag-stall-150t8.sh` lúc 01:16Z. Kẹt 2 + diag timeout-124 + live-diag đều ghi đúng `round150-t8/smoke/`. Nội dung không mất; chỉ sai vị trí ghi ban đầu. Ghi vào checklist mở đợt 151: cập nhật symlink ngay khi dựng thư mục đợt.
- **F-150-T8-7 — REPLAY BOOT MỚI `2e430750` ĐANG CHẠY SONG SONG VỚI HARNESS LẦN 2:** lúc T8 kiểm 01:30Z, `apt-get install xfonts-scalable` (os-intent replay, PID 6735, từ cache 177 .deb) đang chạy; dpkg.log 1.524 dòng, lists 37. Replay boot mới khởi động NGAY (khác boot `e9295700` chết hẳn) — đây là lần đầu tiên sau 2 boot chết, replay lại tới. T8 không chờ replay xong mới chạy harness (hạn cứng 02:00Z không cho phép) — apt chạy nền trong lúc harness chạy có thể góp tải (load1 2,61 lúc 86n2 bắt đầu — xem ram log) nhưng không chạm vite/port/browser; các verdict harness vẫn đọc bình thường (launch thành công, P4 3/3 PASS). Ghi rõ để T10 không đọc harness lần 2 là "chạy lúc máy yên hoàn toàn".
- **F-150-T8-8 — DRIVER LIVE-DIAG (1b) KÍCH HOẠT LẦN ĐẦU KỂ TỪ ĐỢT 148 (VÀ LÀ LẦN ĐẦU NÓ BẮT ĐƯỢC KẸT THẬT MÀ WATCHDOG (i) ĐÃ BẮT TRƯỚC):** 01:40:25Z, log 86n2 im lặng >120 s (lần cuối 01:37:52Z — watchdog line; sau đó không còn dòng nào vì P5 86n2 không có heartbeat). Diag live truyền devUrl thật (`http://127.0.0.1:5490/`), vite HTTP 200, MemAvailable 421.404 kB, Balloon 6.027.988 kB. Khác kẹt 1 (85m4): HB128 in mỗi 5 s nên log không bao giờ im → (1b) không thể kích hoạt — (1b) chỉ bắt được kẹt ở pha không có heartbeat. Hai đường bổ sung nhau đúng như thiết kế đợt 142.
- **F-150-T8-9 — BALLOON TRONG CỬA SỔ HARNESS: 0 GHIM TRẦN, NHƯNG RAM AVAIL MIN XUỐNG 301 MB (BOOT1) / 361 MB (BOOT2):** sampler T8 boot1 n=38, balloon 5.272.212–6.105.864 kB (max 94,8% trần), avail min 301 MB; boot2 n=54 pinned=0 min=5061148 max=6236484 (96.8% trần) mean=5762881; avail min=278 MB max=1593 MB. Cả hai min đều trên kỷ lục thấp 272 MB đợt 148. Sampler T8 chỉ phủ cửa sổ harness (không phủ O8 01:02–01:05Z, không phủ lúc chờ T4) — chuỗi ghim trần phán bằng sampler T9 (28/97 ghim, ĐỨT 00:58:37Z, giao T10). Trong lúc kẹt 2, avail tụt 711 MB (lúc kẹt bắt đầu) → 411 MB (lúc live-diag 01:40:25Z) — tụt TRONG lúc kẹt, không phải nguyên nhân kẹt (xem Phần B).
- **F-150-T8-10 — REBOOT #41: MỐC GIỜ + NGHỊCH LÝ ĐỒNG HỒ 7 S (CÙNG HỌ VỤ 14 S ĐỢT 149):** btime /proc/stat 01:25:51Z (epoch 1795137951); boot cũ `e9295700` sống 6.822 s (23:32:09Z → 01:25:51Z, stat→stat). Dòng log cuối của 86n2 lần 1 (P3 PASS) đóng dấu **01:25:58Z, muộn hơn btime boot mới đúng 7 s** — nghịch lý đồng hồ cùng họ vụ 14 s đợt 149 (T8-149 F-149-T8-6) và vụ 8 s đợt 148 (T9): đồng hồ boot cũ chạy nhanh hơn boot mới, không phải process sống sót qua reboot. /proc/1 của boot mới T8 KHÔNG kịp chụp (kiểm 01:30Z đã qua 4 phút — ghi rõ thiếu dữ kiện này, T2 chứng nhận bằng nguồn của họ). Mù #73? (reboot #41) giao T2-151; T8 không tự chốt giây reboot.
- **F-150-T8-11 — O8 CHẠY TRƯỚC CỜ T4 3 PHÚT (HỆ QUẢ CỦA THỦ TỤC KHÔNG-QUA-GATE, KHÔNG PHẢI LỖI THỨ TỰ):** O8 bắt đầu 01:02:13Z (sau poller T4 thoát 01:00:32Z + waiter hết hạn 01:00:54Z + kiểm chứng xong); cờ T4 viết 01:05:18Z. Khác đợt 148 (O8 chạy TRƯỚC khi T4 đóng — lệch (j) đã chấp nhận có điều kiện): đợt này KHÔNG CÓ cờ T4 nào tồn tại lúc O8 chạy để mà "chạy sau" — thủ tục F-143-T8-2 cho phép chạy sau waiter hết hạn khi T4 0 attempt. T4 đã ghi nhận ở F-150-T4-4; T8 ghi chéo để T10 trích đúng nhãn.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Gate không qua (F-150-T8-1) — parent/T10 phán có chấp nhận trích O8 + harness đợt 150 không:** O8/harness chạy sau khi poller T4 thoát (T4 0 attempt), không phải sau cờ T4, không phải sau lượt yên hợp lệ. Nếu không chấp nhận: kết quả đợt 150 chỉ được trích có điều kiện ("sau khi poller T4 thoát, T4 0 attempt"). Chuẩn đứng cho đợt sau vẫn là quyết (i) (harness sau lượt yên hợp lệ) — đợt này không thỏa vì #22 mở với 0 attempt, không phải vì T8 chạy sai thứ tự.
2. **2 kẹt thật trong 1 đợt (F-150-T8-2/3) — H3 vẫn mở, cần quyết parent có mở điều tra sâu hơn không:** kẹt không gắn pha/boot/nguồn lib; 85m4 P1 kẹt lần 1 rồi PASS lần 2 (không tái diễn); 86n2 P5 kẹt lần 2 (P4 sạch). Chuỗi "P3 không kẹt" 1 → 0. Điều tra kẹt chung VẪN MỞ — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent.
3. **Chuỗi WebKit FULL PASS = 8 (chờ T10 xác nhận độc lập bằng O8 lúc đóng sổ đợt 150, trên boot `e9295700`).**
4. **Đối chứng Chromium cùng pha: N cộng dồn N=12 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
5. **#22 VẪN MỞ (T4, 0 attempt)** — đợt 151 đo lại như thường lệ (cộng dồn (c2) vẫn 18 lượt hợp lệ). T4 là chủ quản; T8 chỉ ghi nhận để trích gate cho đúng. Retry poll-lại-gate (quyết (h)) vẫn CHƯA kiểm chứng live (F-150-T4-3).
6. **Replay chết 2 boot liên tiếp + repair tới muộn 5 phút so với hạn T4 (F-150-T8-4)** — parent/T4 phán chiến lược chờ đợt 151 (T4 §9(c): T5 repair sớm hơn, hoặc T4-151 chờ qua 1 lượt cron để repair xong rồi mới mở poller). Nợ T5-151.
7. **Chuỗi ghim trần balloon — giao T10 phán theo quyết (e):** T9-150: 28/97 mẫu ghim trên boot `e9295700`, ĐỨT 00:58:37Z (quan sát được điểm kết thúc); giữa đợt 149 và 150 có reboot #40 + xả sâu + ~51 phút không ghim. Sampler T8 (cửa sổ harness): 0 mẫu ghim cả 2 boot.
8. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần thứ 4 liên tiếp (T9: 0/97 mẫu ≥ guard); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; testsrc2 ĐÃ QUY ĐƯỢC CHỦ đợt này (T5 §7 + T9 §2.5/2.6 — quyết (p) coi như đóng, không sửa test).
9. Reboot #41: mốc giờ đã ghi (btime 01:25:51Z stat; boot cũ sống 6.822 s) — mù #73?/gap chứng nhận giao T2-151; T8 không tự chốt giây reboot.

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 150 (2 KẸT THẬT, 2 PHA, 2 BOOT)

## B1. Trạng thái giả thuyết sau đợt 150

| Giả thuyết | Trạng thái đợt 149 | Trạng thái đợt 150 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên, thêm 2 bằng chứng âm)** | Kẹt 1 bắt đầu lúc avail 929 MB; kẹt 2 bắt đầu lúc avail ~711 MB — cả hai đều xa mức thấp tuyệt đối (min phiên T9 416 MB; kỷ lục 272 MB đợt 148). RAM tụt SAU khi kẹt bắt đầu (kẹt 2: 711 → 411 MB trong lúc kẹt) — hệ quả, không phải nguyên nhân |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** | Balloon lúc kẹt bắt đầu 82,1% / 87,4% trần — không ghim; 0 mẫu ghim trong cửa sổ harness cả 2 boot. Tụt RAM trong lúc kẹt 2 đi kèm balloon leo 5,63M → 6,03M nhưng không chạm trần — không có tương quan kẹt/balloon mới |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — KHÔNG CÓ DỮ KIỆN MỚI | **VẪN MỞ — ĐƯỢC ỦNG HỘ MẠNH THÊM (2 bằng chứng live mới)** | 2 kẹt đúng chữ ký (evaluate im lặng >60 s → probe 1+1 timeout → playhead đóng băng; vite HTTP 200) ở 2 pha khác nhau, 2 boot khác nhau, 2 nguồn lib khác nhau. Kẹt 85m4 P1 KHÔNG tái diễn ở lần 2 — tính flaky theo pha/boot, không phải lỗi xác định theo pha |

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 150

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–150) + đường ổn định `t8-diag-stall.sh` → 150 (symlink cập nhật 01:16Z, sau kẹt 1) | 5 lần chạy harness hoàn thành + 3 lần chạy O8; **2 kẹt → 2 kích hoạt** | **BẮT ĐÚNG CẢ 2.** 3 dòng `WATCHDOG-137` mỗi lần kẹt; 0 false-positive |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–150) | 5 lần chạy harness; `live_diags=1` ở 86n2 lần 2, 0 ở các lần còn lại | **1 kích hoạt, đúng lúc (01:40:25Z).** Lần đầu (1b) bắt được kẹt thật (kẹt 1 không kích hoạt được vì HB128 giữ log sống — đúng thiết kế) |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 2 log sampler (boot1 n=38, boot2 n=54) | Balloon boot2 n=54 pinned=0 min=5061148 max=6236484 (96.8% trần) mean=5762881; avail min=278 MB max=1593 MB; **0 mẫu ghim trần 6.443.824 kB** |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 01:51:51Z), 85m4 PASS (exit 0, 01:54:07Z), 86n2 PASS (exit 0, 01:58:12Z)** | N cộng dồn **N=12 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **2 lần kẹt → kích hoạt 2 lần + 1 live-diag** | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng. Lúc kẹt: vite HTTP 200 cả 2 lần; ps-top RSS WebKitWebProcess 326 MB (kẹt 1) |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3 + đợt 148 §B3), bổ sung đợt 150

- **Kẹt 1 — 85m4 P1-phaseA (boot1):** `sampleFor P1-phaseA elapsed=… n=5/100 lastCt=1.868 lastPlayhead=1.867 seeking=false` (không đổi từ elapsed=5 s); `WATCHDOG-137: evaluate im lang >60s tai sampleFor-P1-phaseA`; `WATCHDOG-137 probe sampleFor-P1-phaseA: probe-1+1 TIMEOUT 30s`; exit 124 sau timeout 900 (01:24:20Z); report `ok=false`. P1 vừa ép ended → restart 0→1 xong rồi đóng băng ở ct≈1,87 s.
- **Kẹt 2 — 86n2 P5-resetPlayhead0 (boot2):** P4 3/3 PASS xong; `resetPlayhead0:299` không trả về; `WATCHDOG-137: evaluate im lang >60s tai resetPlayhead0:299`; `WATCHDOG-137 probe resetPlayhead0:299: probe-1+1 TIMEOUT 30s`; log im lặng >120 s → live-diag 01:40:25Z; exit 124 sau timeout 900 (giết node 01:50:25Z, end 01:50:26Z, live_diags=2). Không có dòng HB128/sampleFor nào trong lúc kẹt (P5 86n2 không có heartbeat — khác 85m4).
- **Điểm chung 2 kẹt:** vite HTTP 200 (0,014 s / 0,007 s) — vite sống; MiniBrowser + WebKitWebProcess + node đều còn sống (ps-top); load thấp (0,77 / 0,23); RAM lúc bắt đầu kẹt không tuyệt đối thấp; balloon không ghim. **Phân biệt với fail launch:** không có `MiniBrowser: error while loading shared libraries`, không exit 127, không chết sau ~10 s — cả 2 kẹt đều sau nhiều phút chạy bình thường (P1 đồng bộ xong / P4 3/3 PASS xong).
- 86n2 WebKit P4-lần2 PASS lần 2 (đồng bộ 1,2 s) — pha nóng đợt 141/148 sạch 2 đợt liên tiếp; P6 KHÔNG-KẸT 90 s CHƯA CHẠY lần nào đợt này (lần 1 bị reboot giết giữa P4; lần 2 kẹt ở P5 trước khi tới P6) — không có dữ kiện P6 mới đợt này.

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 150: 2 KẸT, CHUỖI 1 → 0 (ĐỨT)

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
- **Bảy lần kẹt vẫn là:** đợt 134/135 (3 lần) + đợt 141 (1 lần) + đợt 148 (1 lần) + đợt 150 (2 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=12 mỗi pha tới đợt 150, 0 kẹt).

## B5. Yếu tố chung khác — đợt 150: #22 mở với 0 attempt; reboot #41 giữa harness; replay chết 2 boot liên tiếp

- T4 đợt này: **0 attempt** (gate0 không đạt 97/97 poll — replay không tới + postboot FAIL; gate A RAM ≥1024 chỉ 37/97 poll, 58 poll cuối liên tiếp <1024). #22 VẪN MỞ, không có lượt hợp lệ, không có lượt nhiễm tải. Kẹt probe T4 (nếu có) và kẹt harness T8 (evaluate im lặng) là hai chữ ký khác nhau — đừng gộp thành một lỗi.
- Reboot #41 (01:25:51Z) giết harness lần 1 giữa 86n2 WebKit P4 — không phải kẹt, không liên quan H1/H2/H3. Vite server còn sống lúc chạy harness (vite-http 200 khi launch + lúc kẹt — các lần kẹt đều có vite 200).
- 2 kẹt đều là lỗi runtime WebKitGTK thuần túy (launch thành công, chạy bình thường một lúc rồi evaluate đóng băng) — đã chứng minh bằng cách chạy lại cùng pha trên boot khác là PASS (85m4) và bằng vite HTTP 200 + process còn sống. Không phải bằng chứng cho hay chống lại H1/H2 (cả hai đều đã bác/không ủng hộ từ trước).
- Replay apt chết 2 boot liên tiếp (802f358f, e9295700) rồi sống lại trên boot `2e430750` (đang chạy lúc harness lần 2) — mẫu "replay chết" không phải vĩnh viễn; T5 theo dõi đợt 151.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (đứng nguyên, thêm 2 bằng chứng âm). H2: KHÔNG ỦNG HỘ (đứng nguyên). H3: VẪN MỞ, được ủng hộ mạnh thêm bằng 2 bằng chứng live mới (2 pha, 2 boot, 2 nguồn lib).
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143; đợt này O8 PASS 3/3 thường kỳ, SAU KHI POLLER T4 THOÁT, chuỗi FULL PASS 7 → 8 (chờ T10 xác nhận độc lập).** Không mở điều tra mới về O8; nếu O8 WebKit FAIL lại ở đợt 151 thì mở điều tra lại từ đầu.
- **Lượt yên #22 VẪN MỞ với 0 attempt — gate harness đợt này KHÔNG QUA GATE (chỉ "sau khi poller T4 thoát, T4 0 attempt").** Không còn lệch chuẩn gate họ F-146/147-T8-3 theo nghĩa cũ (T4 đã đóng hẳn, không đo dở), nhưng chuẩn (i) vẫn không thỏa — chờ parent/T10 phán cách trích.
- **Bản vá watchdog đợt 142 GIỮ NGUYÊN, không revert** (đã kiểm chứng bằng 2 kẹt thật đợt này; (1b) lần đầu bắt được kẹt thật). Nếu đợt sau có kẹt thật nữa, (i)+(ii) sẽ chụp tiếp; đừng trích "kẹt đã hiểu rõ" (H3 vẫn mở).
- **Điều tra kẹt chung VẪN MỞ** — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG.
- **Checklist mở đợt 151 (rút từ F-150-T8-6): cập nhật symlink `t8-diag-stall.sh` ngay khi dựng thư mục đợt** — đừng để chẩn đoán kẹt ghi nhầm sang thư mục đợt cũ lần nữa.

## B7. Bằng chứng mới từ đợt 150 — O8 PASS 3/3 SAU KHI POLLER T4 THOÁT, HARNESS 2 KẸT THẬT (2 PHA, 2 BOOT) + 1 LẦN BỊ REBOOT #41 GIẾT, #22 VẪN MỞ (0 ATTEMPT)

- O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0 trên boot `e9295700` (01:02:14–01:05:17Z — 3'03", sau khi poller T4 thoát 01:00:32Z, trước khi cờ T4 viết 01:05:18Z); S1 PASS cả 3 lần (WebKit: Playwright mouse click lần 2; Chromium: CDP mouse click lần 2).
- Harness lần 1 (boot `e9295700`, system libs sau repair): 84l10 PASS + 85m4 KẸT THẬT exit 124 (P1-phaseA đóng băng 285 s+) + 86n2 KHÔNG VERDICT (reboot #41 giết giữa P4).
- Harness lần 2 (boot `2e430750`, system libs sau replay boot mới): 84l10 PASS + 85m4 PASS (kẹt không tái diễn) + 86n2 KẸT THẬT exit 124 (P5 resetPlayhead0 đóng băng; watchdog + probe timeout + live-diag ×2) + Chromium 84l10 PASS (exit 0, 01:51:51Z), 85m4 PASS (exit 0, 01:54:07Z), 86n2 PASS (exit 0, 01:58:12Z).
- Vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, **kích hoạt 2 lần, bắt đúng 2 kẹt** (0 false-positive); (1b) lần đầu bắt được kẹt thật (01:40:25Z).
- Sampler: balloon 5,06–6,11 GB, RAM avail 301–1.593 MB trong lúc chạy harness (**0 mẫu ghim trần** cả 2 boot; avail min 301 MB — chưa phá kỷ lục 272 MB đợt 148). Chuỗi ghim trần phán bằng sampler T9 (28/97 mẫu, ĐỨT 00:58:37Z, giao T10).
- T8 đóng 01:58:59Z — sau hạn cờ ~01:30Z, trước hạn cứng 02:00Z — lần đầu tiên kể từ đợt 143 đóng sau hạn cờ.
- Nhãn log `LIVE-DIAG-149` đã đổi thành `LIVE-DIAG-150` trong bản copy driver — nhãn mới xuất hiện 1 lần trong log thật đợt này (live-diag 86n2 lần 2, 01:40:25Z). `/tmp/.X11-unix/` còn 0 file lúc kiểm cuối; lock vite: vite-lock-v2: TRỐNG (không có lock).

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round150-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary, **đường dẫn TƯƠNG ĐỐI**): LIMITS này. Đợt này KHÔNG sửa file repo nào khác (3 script harness giữ md5 đợt 142–150; 2 script O8 gốc không đụng). Đã verify read-back bằng `od -c` (NUL-delimited) — stage xong 02:00:57Z, 46 byte, 1 entry. Dữ liệu thô: `hidden_files/round150-t8/` (run-webkit-150t8.sh — ĐÃ CHẠY lần 1 (84l10 PASS + 85m4 KẸT exit 124 + 86n2 bị reboot #41 giết) + lần 2 (84l10 PASS + 85m4 PASS + 86n2 KẸT exit 124 + Chromium 3/3 PASS); run-webkit-150t8-debroot.sh — KHÔNG DÙNG đợt này (system libs đã đủ cả 2 boot); diag-stall-150t8.sh — ĐÃ DÙNG (2 lần watchdog + 1 live-diag + 1 timeout-124); rebuild-fixtures-150t8.sh — ĐÃ CHẠY 2 LẦN (6/6 md5 khớp đợt 125 cả 2 lần); wait-t4-t5-150t8.sh — ĐÃ CHẠY (WAIT-DEADLINE poll 79, 01:00:54Z, exit 3); o8-driver-150t8.sh — ĐÃ CHẠY (WebKit 21/21 ×2 + Chromium 21/21, SAU KHI POLLER T4 THOÁT); o8-s1-probe-150t8.mjs — KHÔNG DÙNG (chỉ chạy khi FAIL; `node --check` OK); make-probe-150t8.py — KHÔNG DÙNG đợt này (probe đã có sẵn từ đợt 145, không cần tạo lại); smoke/wait-t4-t5.log (waiter, WAIT-DEADLINE poll 79); smoke/run-webkit-summary.txt (driver lần 2 === ALL DONE Fri Nov 20 01:58:12 UTC 2026 ec webkit: 84l10=0 85m4=0 86n2=124 ; chromium: 84l10=0 85m4=0 86n2=0 ===); smoke/partial-boot-e9295700/ (lần 1: summary + ram log + 2 report JSON (84l10 ok=true + 85m4 ok=false) + 3 run log + baseline); smoke/ram-150t8.log (sampler lần 2, n=54 pinned=0 min=5061148 max=6236484 (96.8% trần) mean=5762881); smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy lần 2: 3 WebKit + 3 Chromium); smoke/stall-sampleFor-P1-phaseA-1795137038/ (chẩn đoán kẹt 1, copy từ round149-t8); smoke/stall-resetPlayhead0_299-1795138672/ (chẩn đoán watchdog kẹt 2); smoke/stall-live-silence-webkit-86n2-1795138825/ (chẩn đoán live-diag kẹt 2); smoke/stall-webkit-85m4-timeout124-1795137861/ (chẩn đoán sau timeout 124 kẹt 1); smoke/tree-md5-open.txt (530e10a7 lúc mở); smoke/tree-md5-close.txt (đã ghi — xem §5); smoke/baseline-dmesg-tail50.txt + smoke/baseline-journalctl-k.txt (dmesg EPERM + journalctl rỗng); smoke/baseline-meminfo.txt (23:4xZ, boot e9295700); o8-150t8.log + o8-lock.log (driver O8 01:02:14–01:05:17Z, lock giữ 183 s); o8-webkit/ + o8-chromium/ + o8-probe/ (scratch; o8-probe TRỐNG vì probe không chạy — chỉ có fixture copy). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round150-t8/diag-stall-150t8.sh` (cập nhật 01:16Z, ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild 2 lần đợt này, 6/6 md5 khớp.
