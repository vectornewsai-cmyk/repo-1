# Đợt 170 T8 — O8 PASS 3/3 TRÊN BOOT #79, CHUỖI ĐỀ XUẤT LÊN 22 (GATE (a) CHUẨN + LƯỢT YÊN #39 HỢP LỆ CÙNG BOOT) — NHƯNG HARNESS 5/6: WEBKIT 84l10 KẸT THẬT Ở W2-SETUP (runEngine:433), CHUỖI "P3 KHÔNG KẸT" 4 → 0, KẸT CỘNG DỒN 16 → 17

Ngày: 22/11/2026 (lượt cron 18:35 +07 22/11 = 11:35:51Z; T8 mở ~11:37Z, đóng ~12:50Z — TRONG hạn cờ ~14:00Z và hạn cứng 14:30Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) **giữ nguyên (1c') (c') diag-only** theo quyết (i) đợt 168/169 — helper `check-fresh-170t8.py` kiểm chứng offline (TRIGGER đúng elapsed=125 s trên log kẹt 164, 0 FP trên 6 log sạch 163/165/166/167/168/169), chạy thật: **0 kích hoạt — ĐÚNG (0 kẹt ở 85m4, max run span 5 s)** — lưu ý phạm vi: (c') chỉ giám sát 85m4 nên kẹt 84l10 ngoài phạm vi, không phải false-negative (xem F-170-T8-7); (2) O8 Chromium + WebKit 21/21 (WebKit ×2) — PASS 3/3 trên boot `5df1871f` (#79 ứng viên), **chuỗi WebKit FULL PASS T8 ĐỀ XUẤT LÊN 22** (xem §A — lượt yên #39 hợp lệ TRÊN CÙNG BOOT ĐO + gate (a) chuẩn FOUND); (3) harness đứng — MỘT lần chạy driver duy nhất, **5/6 PASS + 1 KẸT THẬT WebKit 84l10 ở W2-setup** (đợt kẹt đầu tiên kể từ đợt 157); (4) H3: VẪN MỞ, chỉ giám sát thụ động — kẹt mới 84l10 cùng họ H3 (evaluate chết, probe timeout) nhưng khác điểm kẹt 85m4/86n2; (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau, md5 khác nhau, bản copy dự phòng khớp md5; (6) **0 REBOOT trong phiên** (boot `5df1871f` ổn định từ lúc mở tới lúc đóng — btime 1795345865 = 11:11:05Z không đổi); **1 reboot TRƯỚC khi đợt mở — #79 ứng viên (btime 11:11:05Z)** là boot lúc mở, T0-170 xác minh (xem F-170-T8-6 về mốc giờ chồng lấn với lúc đóng đợt 169).
Nợ: docs/PHASE9_ROUND169_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 trên boot #78, chuỗi GIỮ 21 — gate cho boot đo KHÔNG FOUND + lượt yên #38 hợp lệ ở boot cũ; harness 6/6 + 0 kẹt; chuỗi "P3 không kẹt" 3 → 4; (1c') giữ nguyên, 0 FP).

## 0. Kết luận ngắn — O8 PASS 3/3, CHUỖI ĐỀ XUẤT LÊN 22; HARNESS 5/6 + 1 KẸT THẬT 84l10; (1c') GIỮ NGUYÊN 0 FP

- **(1c') GIỮ NGUYÊN — 0 KÍCH HOẠT, 0 FALSE-POSITIVE (ĐÚNG).** Không sửa driver (c') đợt này. Helper `check-fresh-170t8.py` kiểm chứng offline TRƯỚC harness: TRIGGER đúng elapsed=125 s (run 5 s→125 s, 25 dòng, playhead=0.267) trên log kẹt đóng băng 164; OK maxspan=5 s trên log sạch 163/165/166/167/168/169; OK 0 s trên log 86n2 (không có HB128) và file vắng. Chạy thật 6 pha: **FRESH-CONTENT-170 = 0 kích hoạt** — ĐÚNG (0 kẹt ở 85m4; replay sau harness xác nhận max run span trên log 170-sạch là 5 s). (c') ĐƯỢC GIỮ (xem §C).
- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (12:08:45–12:11:21Z, 2'36", boot `5df1871f` = #79 ứng viên, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 12:08:57.417Z + 12:09:49.821Z, Playwright mouse click lần 2; Chromium: 12:10:51.207Z, CDP mouse click lần 2 — kiểm bằng grep đầy đủ, 6 dòng = 3 thật + 3 do driver grep lại log, KHÔNG đọc nhầm như F-166-T8-9). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid 41525/41917/42357, md5 khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate — FOUND QUA ĐƯỜNG (a) CHUẨN CHO BOOT ĐO.** Waiter GATE-FOUND poll 27 lúc 12:05:49Z: t4=OK + POSTBOOT_PASS `round170-t5/POSTBOOT_PASS` chứa boot `5df1871f` (viết 11:49:14Z, replay-đầy-đủ, poll=0). **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT LÊN 22 (21 → 22) — CHỜ T10/parent phán** (xem §A). Lý do: (1) lượt yên #39 CÓ lượt hợp lệ — attempt1-5df1871f, 20/20, B 5/5, tickCost median 40,0 ms ≤60, TRÊN BOOT ĐO; (2) O8 chạy SAU lượt hợp lệ TRÊN CÙNG BOOT `5df1871f`; (3) gate cho boot đo FOUND qua đường (a) chuẩn. Tiền lệ đợt 157: chuỗi lên dù cùng đợt harness có kẹt 84l10 — O8 chain và verdict harness là hai phán riêng.
- **Harness (MỘT lần chạy driver duy nhất, boot `5df1871f` #79 ứng viên): 5/6 PASS + 1 KẸT THẬT** (12:11:59–12:41:23Z, 29'24" — dài do timeout 900 s của pha kẹt): WebKit 84l10 **exit 124 (KẸT, 12:12:02–12:27:03Z)** — W1-lần1/2/3 PASS rồi chết ở W2-setup (runEngine:433); WebKit 85m4/86n2 PASS; Chromium 84l10/85m4/86n2 PASS. **85m4 P4-lần3 PASS (chuỗi 10 → 11)**; **86n2 P4-lần3 PASS (điểm kẹt đợt 165 sạch đợt thứ năm liên tiếp)**; **86n2 P4-lần2 PASS (chuỗi verdict 20 → 21)**; **86n2 P5-entry PASS** (163, 164, 166, 167, 168, 169, 170 — 165 không có verdict). **Kẹt cộng dồn 16 → 17. Chuỗi "P3 không kẹt" 4 → 0 (ĐỨT).** Chromium đối chứng N=31 → **N=32 mỗi pha**, 0 kẹt.
- **Watchdog (i): 1 kích hoạt — ĐÚNG (có kẹt thật). Live-diag (1b): 2 kích hoạt — ĐÚNG (log im lặng thật 124 s + 365 s). (1c'): 0 kích hoạt — ĐÚNG (0 kẹt ở 85m4).** 4 snapshot stall (1 watchdog + 2 live-silence + 1 timeout124). RAM sampler n=59: balloon max 96,8% trần, 0 mẫu ghim; avail min **247 MB @12:25:29Z** (trong cửa sổ kẹt 84l10 — thấp nhất kể từ đợt 164; xem F-170-T8-2).
- **0 reboot trong phiên** (boot `5df1871f` ổn định từ lúc T8 mở tới lúc đóng — kiểm ở mọi mốc: selfcheck #1/#2, waiter, O8, harness, kiểm cuối). Replay hệ thống trên boot mới chạy TRONG phiên T4 (dpkg 2→1545, 11:44:52–11:48:40Z; `apt-get update` chậm ~9 phút rồi tự hồi phục — cùng họ #73/#78, xem F-170-T8-3).
- **T8 ĐÓNG ~12:50Z — TRONG hạn cờ ~14:00Z** (gate FOUND 12:05:49Z; O8 + harness xong 12:41:23Z; phần còn lại là trích số + viết LIMITS).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 11:11:05 22/11 | REBOOT #79 ứng viên (boot `5df1871f`, btime 1795345865) — boot lúc đợt mở (T0-170 xác minh; xem F-170-T8-6 về mốc giờ chồng lấn lúc đóng đợt 169) |
| 11:35:51 | Đợt 170 mở (lượt cron 18:35 +07 22/11) |
| ~11:37 | T8 mở: đọc LIMITS T8-169 + GAP §98; cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 169 (không đổi); fixture /tmp MẤT theo reboot #79; `/tmp/.X11-unix/` TRỐNG lúc mở (0 socket) |
| 11:38:56 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round170-t8/diag-stall-170t8.sh`, readlink + test -x + test -e xác nhận** (phát hiện file copy mất bit +x — xem F-170-T8-4) |
| 11:38:59 | **Selfcheck #1 trên #79: 1/6 lib CÓ (chỉ libevent); GST plugins 0 (số giả — xem F-170-T8-8); dpkg.log 2; cache 178, lists 3; RAM avail 1.420 MB, balloon 5.386.196 kB** — replay chưa chạy |
| 11:39:37 | **Rebuild fixture /tmp lần 1 trên #79 (quy tắc (l)): hevc + i7 + h-30s/g-4s KHỚP kỳ vọng đợt 125 (`ba0c7c62`/`f05daed8`/`fbaa3d1a`/`a1fb8549`)** |
| 11:39:42 | **check-fresh-170t8.py kiểm chứng offline ĐẠT** (TRIGGER 125 s kẹt-164; OK 5 s sạch 163/165/166/167/168/169; OK 0 s 86n2/file vắng) |
| 11:39:47 | Waiter #79 bắt đầu trên boot `5df1871f` (deadline 13:30Z — kiểm epoch 1795354200 bằng `date -d` TRƯỚC khi khởi động); poll 1: t4=0 postboot=0 |
| ~11:35–11:44 | Replay hệ thống: `apt-get update` (lazy refresh, pid 843) chạy chậm ~9 phút (cùng họ #73/#78 — xem F-170-T8-3), rồi vòng lặp cài đặt 11:44:52–11:48:40Z, dpkg 2→1545 |
| 11:40:20 | T4 poller bắt đầu (poll #1: gate0 KHÔNG ĐẠT — postboot exit=1, lib thiếu, replay đang chạy) |
| 11:49:14 | **POSTBOOT_PASS #79 ĐÃ CÓ (T5, poll=0, replay-đầy-đủ)** — verify độc lập: boot `5df1871f`, dpkg 1545, cache 178, lists 30 |
| 11:55:26–11:59:18 | T4 attempt1 trên #79: **20/20, lớp B ĐẠT 5/5, tickCost median 40,0 ms ≤60 — LƯỢT YÊN #39 HỢP LỆ**; poller T4 thoát 11:59:18Z vì LUOT HOP LE |
| 12:04:54 | **Cờ T4 `round170-t4.done` viết (mtime 12:05Z): LƯỢT YÊN #39 CÓ LƯỢT HỢP LỆ (chuỗi lượt yên hợp lệ LÊN 34)** |
| 12:05:49 | **GATE-FOUND poll=27 — waiter bắt được gate cho boot đo (t4=OK + POSTBOOT_PASS đường (a) 11:49:14Z)** |
| 12:08:34 | **Selfcheck #2 trên #79: 6/6 lib CÓ; GST plugins 1624; dpkg.log 1545; cache 178, lists 30; RAM avail 1.252 MB, balloon 5.524.496 kB** |
| 12:08:43 | **Dọn X11: X194/X195 (T1 suite, mtime 11:44, mồ côi — 0 process giữ fd, 0 Xvfb) + lock file đã xóa, `/tmp/.X11-unix/` TRỐNG trở lại** (xem F-170-T4-6) |
| 12:08:45–12:11:21 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #79 ứng viên** (xem §A) — sau lượt yên hợp lệ, TRÊN CÙNG BOOT, gate (a) FOUND |
| 12:11:59–12:41:23 | **Harness (MỘT lần chạy driver duy nhất, boot `5df1871f`): 5/6 PASS + 1 KẸT THẬT WebKit 84l10** (xem §2) — 0 reboot giữa O8 và harness; boot #79 ổn định |
| ~12:43 | **Trích số liệu (extract-170t8.py) + replay (1c') trên log 170: C5.1 ĐẠT (0 FP trên 7 log sạch)** |
| 12:44:38 | **Kiểm cuối: process Xvfb/MiniBrowser/WebKit/Chromium còn sót của T8: 0; lock vite TRỐNG; `/tmp/.X11-unix/` TRỐNG; boot `5df1871f` ổn định** |
| ~12:50 | Cờ `round170-t8.done` (TRONG hạn cờ ~14:00Z) |

## A. O8 — PASS 3/3 trên boot `5df1871f` (#79 ứng viên), CHUỖI ĐỀ XUẤT LÊN 22 (21 → 22)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 12:08:45–12:09:3x | 0 | **21/21 PASS** — S1 PASS 12:08:57.417Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 12:09:38–12:10:2x | 0 | **21/21 PASS** — S1 PASS 12:09:49.821Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 12:10:28–12:11:21 | 0 | **21/21 PASS** — S1 PASS 12:10:51.207Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-22T12-08-45-5df1871f-pid41525.json` 21 kết quả `ok=true` 21/21, md5 `0da64d6e`; attempt2 `o8w-clicktest-report-2026-11-22T12-09-39-5df1871f-pid41917.json` 21/21 `ok=true`, md5 `f8d4b76b` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-22T12-10-28-5df1871f-pid42357.json` 21/21 `ok=true`, md5 `09d0a23b`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep đầy đủ: PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- Ghi chú log: 6 dòng `PASS: S1` = 3 thật (12:08:57.417Z attempt1, 12:09:49.821Z attempt2, 12:10:51.207Z Chromium) + 3 do driver grep lại log sau mỗi attempt (cùng mẫu đợt 165/166/167/168/169). T8 kiểm bằng `grep -an` đầy đủ TRƯỚC khi ghi LIMITS (không lặp lỗi đọc nhầm tail-8 của F-166-T8-9); kết quả 21/21 ×3 đã xác minh độc lập từ JSON nên verdict O8 ĐỨNG.
- **NHÃN LIB ĐÚNG NGAY TỪ ĐẦU — O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (như đợt 162–169, xem F-163-T8-2 + đính chính quyết (b) đợt 167): script O8 gốc `clicktest-87o8-mask-track-webkit.mjs` tự đặt `LD_LIBRARY_PATH` với DEBROOT, và driver o8-driver-170t8.sh cũng đặt `LD_LIBRARY_PATH="$DEBROOT:..."` khi gọi node. Bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness chạy TRÊN CÙNG boot đo (#79 ứng viên) với thư mục GST THẬT (1624 plugin theo gst-inspect-1.0 sau replay) VÀ POSTBOOT_PASS cho boot đo ĐÃ CÓ (11:49:14Z).
- Driver O8 giữ 1 lock vite `t8-round170` suốt lượt (nhả 12:11:21Z; vite sau release curl 5560/5554 = 000000 — như đợt 162–169).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-170t8.mjs`, `node --check` OK — bản copy từ 169, chỉ đổi nhãn) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Gate cho boot đo `5df1871f`: FOUND QUA ĐƯỜNG (a) CHUẨN.** (a) POSTBOOT_PASS trong `round170-t5/` chứa boot `5df1871f` (ghi 11:49:14Z, poll=0, replay-đầy-đủ, dpkg 1545, cache 178, lists 30) — waiter GATE-FOUND poll 27 lúc 12:05:49Z (t4=OK + postboot (a)). Không cần đường (b).
- **Chuỗi WebKit FULL PASS: 21 → 22? (T8 ĐỀ XUẤT: LÊN 22 — CHỜ T10/parent phán).** O8 pass 21/21 ×2 đợt này (trên boot `5df1871f` #79 ứng viên), VÀ cả ba điều kiện đều thỏa TRÊN CÙNG BOOT ĐO: (1) **lượt yên #39 CÓ lượt hợp lệ — TRÊN BOOT ĐO** (attempt1-5df1871f 20/20, B 5/5, tickCost median 40,0 ms ≤60, 11:55:26–11:59:18Z; chuỗi lượt yên hợp lệ LÊN 34; cộng dồn 34 lượt hợp lệ: P1 132/135, P2 126/126, P3-A1 114/135, P3' 99/107 occ = 91/94 distinct-seq, P7 68/68 — theo cờ T4, viết 12:04:54Z); (2) **O8 chạy SAU lượt hợp lệ TRÊN CÙNG BOOT** (`5df1871f`, 12:08:45–12:11:21Z, sau cờ T4 12:05Z); (3) **gate cho boot đo FOUND qua đường (a) chuẩn** (POSTBOOT_PASS 11:49:14Z). Đây là trường hợp sạch như đợt 167/168/159 — khác đợt 169 (lượt yên hợp lệ ở boot cũ + gate không FOUND → GIỮ 21) và đợt 166 (không có lượt yên hợp lệ + đổi boot + gate không FOUND → GIỮ). **Kẹt harness 84l10 cùng đợt KHÔNG đổi đề xuất chuỗi** — tiền lệ đợt 157: chuỗi LÊN 12 theo quyết (h) đợt 157 dù cùng đợt harness 5/6 + 1 kẹt thật 84l10 (chuỗi O8 và verdict harness là hai phán riêng; T10/parent phán cuối).
- **O8 đợt này 2'36" tổng** (169: 2'40", 168: 2'36", 167: 3'01", 166: 2'59", 165: 2'37", 164: 3'02", 163: 3'07", 162: 2'37") — trong khung dao động các đợt gần đây, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: 5/6 PASS + 1 KẸT THẬT WEBKIT 84l10, 0 REBOOT GIỮA O8 VÀ HARNESS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 124 | 12:12:02–12:27:03 | **KẸT THẬT — TIMEOUT 900 s** — W1-lần1/2/3 PASS (delta=+1 sạch), chết ở **W2-setup (runEngine:433)** — xem F-170-T8-1 |
| 2 | WebKit 85m4 | 0 | 12:27:19–12:29:30 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart — **P4-lần3 PASS (chuỗi 10 → 11); P4-lần2 PASS (điểm kẹt đợt 164 sạch đợt thứ sáu liên tiếp)** |
| 3 | WebKit 86n2 | 0 | 12:29:45–12:33:45 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart — **P4-lần3 PASS (điểm kẹt đợt 165 sạch đợt thứ năm liên tiếp); P4-lần2 PASS (chuỗi verdict 20 → 21); P5-entry PASS** |
| 4 | Chromium 84l10 | 0 | 12:34:01–12:35:01 | **PASS** — W1-lần1 PASS (+1), W1-lần2/3 PASS (lần2 delta=+2 — artifact bắn lặp, xem F-170-T8-5), W2 PASS (playhead cuối=30, tới cuối=true, restart tự nhiên Δ=1), E4 PASS ended=false ct cuối=3,997 (report JSON ok=true, finishedAt 12:34:58.646Z) — **đối chứng âm tính cho điểm kẹt WebKit 84l10** |
| 5 | Chromium 85m4 | 0 | 12:35:16–12:37:17 | **PASS** — P4-lần1/2/3 PASS (+2/+1/+1), P5 PASS 40 s 0 restart (report JSON ok=true, finishedAt 12:37:16.158Z) |
| 6 | Chromium 86n2 | 0 | 12:37:33–12:41:23 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+2/+1/+1), P5 PASS 40 s **0 restart** (report JSON ok=true, finishedAt 12:41:16.597Z) — **giống đợt 169 (0 restart), khác đợt 168 (CÓ-RESTART +1); verdict VẪN KHÔNG FAIL, như thường lệ** |

- 6 report JSON kiểm độc lập bằng python: 5× `ok=true` + 1× `ok=false` (WebKit 84l10, finishedAt 12:27:03.241Z, cases chỉ có W1 — 3 rounds ok=true; W2/E4 không có verdict). WebKit 85m4 finishedAt 12:29:27.762Z; 86n2 12:33:37.362Z; Chromium 84l10 12:34:58.646Z; 85m4 12:37:16.158Z; 86n2 12:41:16.597Z.
- Môi trường: system libs trên boot `5df1871f` (replay #79 ĐÃ CHẠY ĐẦY ĐỦ — dpkg 1545 ổn định; selfcheck T8 12:08:34Z: 6/6 lib + GST 1624 + dpkg 1545; POSTBOOT_PASS cho boot đo ĐÃ CÓ 11:49:14Z). **WebKit launch THÀNH CÔNG bằng system libs** trên ĐÚNG boot đo (85m4/86n2 PASS; 84l10 kẹt sau khi launch thành công + W1 PASS — không phải lỗi launch/lib). Không cần lần chạy DEBROOT thứ hai.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn; Chromium cùng pha PASS đã là đối chứng đủ).
- **Harness 29'24"** (12:11:59–12:41:23Z) — dài nhất các đợt gần đây do timeout 900 s của pha kẹt (169: 15'30", 168: 15'29", 167: 16'14"; đợt 157 có kẹt 84l10: 30'35").

## 3. Watchdog trong lượt này — 1 KÍCH HOẠT ĐÚNG (CÓ KẸT THẬT) + LIVE-DIAG 2/2 ĐÚNG + (1c') 0 KÍCH HOẠT ĐÚNG

- **Watchdog (i): 1 kích hoạt — ĐÚNG.** 3 dòng `WATCHDOG-137` trong summary + log 84l10 (1 trigger 12:13:28.907Z "evaluate im lang >60s tai runEngine:433" + 1 diag-done + 1 probe 1+1 TIMEOUT 30 s 12:13:58.913Z "kenh evaluate ket cung / page JS chet"). 0 false-positive ở 5 pha còn lại (0 dòng WATCHDOG-137 trong log 85m4/86n2/Chromium).
- **Driver (1b) live-diag: 2 kích hoạt — ĐÚNG.** `LIVE-DIAG-170` lần 1 lúc 12:16:02Z (log im lặng 124 s) + lần 2 lúc 12:20:03Z (log im lặng 365 s) — cả hai trong pha kẹt 84l10, đúng ngân sách ≤2 lần/lần chạy; `live_diags=2` ở pha 84l10, `live_diags=0` ở cả 5 pha còn lại. 4 snapshot stall (1 watchdog + 2 live-silence + 1 timeout124).
- **(1c') fresh-content: 0 kích hoạt — ĐÚNG (xem §C).** (c') giữ nguyên diag-only đợt này; 0 kẹt ở 85m4 → 0 kích hoạt đúng; 0 false-positive trên log sạch chạy thật (max run span 5 s, biên 24× so với ngưỡng 120 s). Kẹt 84l10 ngoài phạm vi (c') (chỉ 85m4 có HB128) — xem F-170-T8-7.
- 4 snapshot stall đợt này (đúng — có kẹt thật): `stall-runEngine_433-1795349608` (watchdog, 12:13:29Z), `stall-live-silence-webkit-84l10-1795349762` (12:16:02Z), `stall-live-silence-webkit-84l10-1795350003` (12:20:03Z), `stall-webkit-84l10-timeout124-1795350423` (12:27:03Z).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–169 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–170) + đường ổn định `t8-diag-stall.sh` → 170 (CẢ HAI symlink cập nhật 11:38:56Z, TRƯỚC mọi lần chạy) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **1 kẹt thật → 1 kích hoạt ĐÚNG, 0 false-positive** | **ĐÚNG — KÍCH HOẠT KHI CÓ KẸT, KHÔNG KÍCH HOẠT OAN.** 4 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy, cách nhau ≥240 s (MỚI 142, GIỮ NGUYÊN 143–170) | 6 lần chạy harness; `live_diags=2` ở pha kẹt 84l10, `live_diags=0` ở 5 pha còn lại | **2 kích hoạt — ĐÚNG, LOG IM LẶNG THẬT (124 s + 365 s)** |
| (1c') Kiểm "nội dung tươi" (c') | **GIỮ NGUYÊN diag-only đợt này** (quyết (i) đợt 168/169; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 lần chạy harness (chỉ 85m4 có HB128); `live_diags=0` ở 85m4 (bộ đếm chung (1b)+(1c')) | **0 kích hoạt — ĐÚNG, KHÔNG CÓ KẸT Ở 85m4; 0 false-positive. (c') ĐƯỢC GIỮ.** Replay sau harness: C5.1 ĐẠT (kẹt-164 TRIGGER 125 s; 0 FP trên 7 log sạch 163/165/166/167/168/169/170) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-170t8.sh` (cột `balloon_kb`) | 1 log sampler (n=59 mẫu hợp lệ) | Balloon n=59 pinned=0 min=4.727.592 max=6.239.624 (96,8% trần) mean=5.612.732; avail min=247 MB @12:25:29Z (trong cửa sổ kẹt WebKit 84l10) / max 2.054 MB — xem F-170-T8-2 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 12:35:01Z), 85m4 PASS (exit 0, 12:37:17Z), 86n2 PASS (exit 0, 12:41:23Z)** | N cộng dồn **N=32 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161/162/163/164/165/166/167/168/169/170 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **1 lần kẹt → kích hoạt 1 lần** (baseline đã lưu lúc bắt đầu; 4 snapshot stall) | 4 snapshot stall đầy đủ đợt này (đúng — có kẹt) |

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

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi so với đợt 169 (đều là bản copy, không chạm script repo): nhãn log `LIVE-DIAG-169` → `LIVE-DIAG-170`, `FRESH-CONTENT-169` → `FRESH-CONTENT-170`, lock `t8-round169` → `t8-round170`, deadline waiter 10:30Z 22/11 → **13:30Z 22/11** (kiểm lại epoch 1795354200 bằng `date -d`), nhãn `T8-169` → `T8-170` trong o8-driver + selfcheck-postboot, WAIT1 trong extract sửa đúng boot lúc mở `5df1871f` (F-155-T8-6). **Không có thay đổi driver mới đợt này về (1c')** — (c') giữ nguyên theo quyết (i) đợt 168/169; replay script thêm entry log 169-sạch + log 170-sạch (xem F-170-T8-4).
- Script trích số liệu `extract-170t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (đọc đủ 1 log waiter đợt này: 26 poll GATE-NOT-YET + GATE-FOUND poll 27 lúc 12:05:49Z, 0 WAIT-DEADLINE, 0 REBOOT trong log; postboot=1 trong 19 dòng — TẤT CẢ cho boot `5df1871f`).
- Script replay (1c') `replay-1c-170t8.py` (cập nhật từ 169: thêm entry log 169-sạch + 170-sạch, biến run170 riêng, kết luận kiểm cả 7 log sạch).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round170` 12:11:21Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 12:41:23Z).
- Waiter #79 thoát sau GATE-FOUND poll 27 lúc 12:05:49Z (exit 0 — cho boot `5df1871f`; 0 process waiter còn lại lúc kiểm cuối).
- Kiểm cuối ~12:44Z (bằng script trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót của T8: **0**; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown — 100 sau prune 44 của T6-169 + cooldown-t8-round170, đúng mẫu đợt 150–170; prune lần 45 thuộc T6-170); boot `5df1871f` ổn định (btime 1795345865 không đổi từ 11:11:05Z — 0 reboot trong phiên; 1 reboot #79 ứng viên TRƯỚC khi đợt mở).
- `/tmp/.X11-unix/` lúc mở TRỐNG; lúc kiểm cuối TRỐNG (0 file, 0 lock file — X194/X195 của T1 suite đã được T8 dọn tay 12:08:43Z sau khi xác minh mồ côi: 0 process giữ fd, 0 Xvfb; socket của chính T8 (:188 O8-WebKit, :197 O8-Chromium, :199 harness) đã được driver tự unlink).
- Fixture /tmp: rebuild lần 1 trên #79 (11:39:37Z, md5 khớp); kiểm cuối sau harness vẫn khớp.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt (replay + repair là của T5/hệ thống — T8 chỉ đọc); không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN BOOT `5df1871f` (#79 ỨNG VIÊN)** — boot sau reboot #79 lúc 11:11:05Z, là boot lúc đo (không đổi boot trong phiên O8+harness). T4 chạy attempt1 trên #79 (lượt yên #39 HỢP LỆ — TRÊN CÙNG BOOT ĐO); O8 + harness chạy trên #79. **Chuỗi WebKit FULL PASS T8 ĐỀ XUẤT LÊN 22, KHÔNG TỰ CHỐT** (lượt yên hợp lệ cùng boot + gate (a) FOUND — xem §A; T10/parent phán cuối). Số hiệu #79 là ỨNG VIÊN theo đếm tuần tự (sau #78 `e298bb52`) — giao T0-170 xác minh đầy đủ 9 nguồn (xem F-170-T8-6 về mốc giờ chồng lấn).
2. **Harness 5/6 + 1 KẸT THẬT — kẹt cộng dồn 16 → 17; chuỗi "P3 không kẹt" 4 → 0 (ĐỨT).** Kẹt ở WebKit 84l10 W2-setup (lần thứ hai 84l10 kẹt, sau đợt 157). Đợt kẹt đầu tiên kể từ đợt 157 (166, 167, 168, 169 sạch). Đừng gộp verdict pha con với verdict pha, và đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `5df1871f` theo replay #79 (dpkg 1545) + selfcheck T8 (6/6 lib + GST 1624 + dpkg 1545 ổn định) + POSTBOOT_PASS 11:49:14Z. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness (standard driver, không LD_LIBRARY_PATH) trên cùng boot đo (xem §A). **Nhãn đã ghi ĐÚNG ngay từ đầu đợt này — không lặp lỗi nhãn sai đợt 162.**
4. **POSTBOOT_PASS cho boot đo `5df1871f` ĐÃ CÓ (11:49:14Z, T5, poll=0, replay-đầy-đủ)** — khác đợt 169 (#78 KHÔNG CÓ) và đợt 166 (#71 KHÔNG CÓ). Gate FOUND qua đường (a) chuẩn lúc 12:05:49Z (poll 27). Đừng trích POSTBOOT_PASS #77 (08:46:44Z, cho `c44cc3ba`) hay bất kỳ cờ boot cũ nào là gate cho boot đo.
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=59, max 96,8% trần) — avail min 247 MB @12:25:29Z (trong cửa sổ kẹt WebKit 84l10, xem F-170-T8-2); nhưng RAM avail rơi đơn điệu trong lúc kẹt trong khi RSS của chính process WebKit GIẢM — giao T9 đối chiếu với sampler của họ (T9 đo cả phiên) — chỉ là tương quan, H1/H2 đã bác bỏ nên không dùng làm bằng chứng nguyên nhân; giao T9 đối chiếu (chuỗi ghim trần phán bằng sampler T9).
6. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–170 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **86n2 P5-entry PASS đợt này** (163, 164, 166, 167, 168, 169, 170 — 165 không có verdict do kẹt ở P4-lần3 trước khi tới P5; đừng trích thành "P5-entry PASS 7 lần liên tiếp" mà không ghi khoảng trống 165). **86n2 P2-entry PASS lần thứ mười hai liên tiếp; 85m4 P4-lần3 PASS lần thứ mười một liên tiếp.** H3 vẫn mở, chỉ giám sát thụ động (xem §B).
8. **WebKit 84l10 KHÔNG tới được E4 đợt này** (kẹt ở W2-setup) — chuỗi "84l10 E4 ended=false liên tiếp" (167, 168, 169 = 3 lần) DỨT vì không có verdict E4. Chromium 84l10 đợt này E4 ended=false (ct cuối=3,997) — lần thứ ba liên tiếp của Chromium (168, 169, 170). Script verdict vẫn PASS cho Chromium; đừng trích ended thành FAIL (xem F-170-T8-5).
9. **T8 ĐÓNG TRONG hạn cờ ~14:00Z (~12:50Z)** — gate FOUND 12:05:49Z; O8 + harness xong 12:41:23Z trên #79.
10. **1 reboot liên quan đợt (#79 ứng viên TRƯỚC khi đợt mở 24m46s)** — số hiệu #79 là ỨNG VIÊN, chờ xác minh (T8 chỉ xác minh btime + uptime + boot_id; giao T0-170 xác minh đầy đủ 9 nguồn; lưu ý mốc giờ F-170-T8-6); mù cho boot mới giao T2-170 (theo quyết (s) đợt 158); INSIDE #79 giao T2-170 (dải FULL123/FULL124 — chuỗi MỚI từ #73 nếu INSIDE).
11. **(1c') GIỮ NGUYÊN diag-only đợt này, 0 kích hoạt, 0 false-positive** — replay C5.1 ĐẠT (RUNSPAN TRIGGER đúng 125 s trên log kẹt 164; 0 FP trên 7 log sạch 163/165/166/167/168/169/170); live 0 kích hoạt là ĐÚNG (0 kẹt ở 85m4). (c') ĐƯỢC GIỮ (xem §C). Đừng trích đợt này là "chưa triển khai (1c')" hay "(1c') mới triển khai" (khác đợt 166/167). **Lưu ý phạm vi:** (c') chỉ giám sát 85m4 (HB128) — kẹt 84l10 đợt này ngoài phạm vi (c'), 0 kích hoạt không phải false-negative (xem F-170-T8-7).
12. **Fixture h/g md5 KHỚP kỳ vọng đợt 125** (rebuild lần 1 trên #79 11:39:37Z; kiểm cuối sau harness vẫn khớp). Giả thuyết "giá trị đứng" ở F-163-T8-1 vẫn SAI — đừng dùng md5 h/g làm fingerprint ổn định.
13. **Chromium 86n2 P5 0 restart đợt này** (40 s, extraEvents=[]) — giống đợt 169 (0 restart), khác đợt 168 (CÓ-RESTART +1 ended-at-duration); verdict script vẫn KHÔNG FAIL (ok=true) cả ba đợt. Ghi nhận để T10 đối chiếu, không đổi verdict pha hay verdict đợt. **Chromium 84l10 W1-lần2 delta=+2** (artifact bắn lặp do ghi đè ended còn bật — xem F-170-T8-5); verdict vẫn PASS.

## 8. Sai số mới (F-170-T8-N)

- **F-170-T8-1 — KẸT THẬT WEBKIT 84l10 Ở W2-SETUP (runEngine:433) — LẦN THỨ HAI 84l10 KẸT, KHÁC ĐIỂM ĐỢT 157, CHUỖI "P3 KHÔNG KẸT" 4 → 0, KẸT CỘNG DỒN 16 → 17.** Pha WebKit 84l10 (12:12:02–12:27:03Z, exit 124 sau timeout 900 s): W1-lần1 PASS (12:12:15.036Z, delta=+1), W1-lần2 PASS (12:12:19.003Z, delta=+1), W1-lần3 PASS (12:12:24.742Z, delta=+1) — rồi log im lặng hoàn toàn. WATCHDOG-137 12:13:28.907Z: "evaluate im lang >60s tai runEngine:433"; probe 1+1 TIMEOUT 30 s 12:13:58.913Z ("kenh evaluate ket cung / page JS chet"); timeout 900 giết process 12:27:03Z ("page.evaluate: Target page, context or browser has been closed", KẾT QUẢ: CÓ FAIL; report JSON ok=false, cases chỉ có W1 — 3 rounds ok=true). Điểm kẹt: dòng `await ev(page, '(async () => { const s = await (STORE_FN); s.setPlayhead(0); if (!s.playing) s.togglePlay(); })()')` — evaluate ĐẦU TIÊN của W2-setup (phát tự nhiên trọn clip 30 s), TRƯỚC mọi sample W2. **Khác đợt 157** (kẹt ở E4-setup runEngine:457, SAU khi W2 PASS): đợt này kẹt SỚM HƠN — ngay đầu W2, W2/E4 không có verdict. Cùng họ chữ ký: evaluate chết + probe timeout + WebKit-only (Chromium 84l10 cùng pha PASS 12:34:01–12:35:01Z: W1 +1/+2/+1, W2 PASS playhead cuối=30, E4 PASS ended=false). Snapshot: 4 thư mục stall (watchdog 12:13:29Z, live-silence 12:16:02Z + 12:20:03Z, timeout124 12:27:03Z); tại watchdog: WebKitWebProcess RSS 348.676 KB, MiniBrowser 293.480 KB, vite HTTP 200 (vite còn sống); tại timeout124: process WebKit đã chết theo node, vite HTTP 000 (đã release). **Hệ quả:** kẹt cộng dồn 16 → 17; chuỗi "P3 không kẹt" 4 → 0 (ĐỨT — đợt kẹt đầu tiên kể từ đợt 157; các đợt 166/167/168/169 sạch). Giao T10 quyết: có mở điều tra riêng cho 84l10 không (điều kiện H3 theo quyết (i) đợt 158 là 85m4 P4-lần3 tái diễn lần 3 — KHÔNG đạt, 85m4 P4-lần3 PASS lần thứ 11 liên tiếp đợt này).
- **F-170-T8-2 — RAM AVAIL RƠI ĐƠN ĐIỆU 1.189 → 247 MB TRONG LÚC KẸT, NHƯNG RSS CỦA CHÍNH PROCESS WEBKIT GIẢM — H3-D1 VẪN BÁC BỎ; AVAIL RƠI LÀ DO BALLOON HOST TĂNG.** Sampler n=59: avail min=247 MB @12:25:29Z (trong cửa sổ kẹt 84l10 12:12–12:27Z) — thấp nhất kể từ đợt 164 (chuỗi trũng RAM: 163: 502 → 164: 291 → 165: 253 → 166: 527 → 167: 489 → 168: 488 → 169: 512 → 170: 247); balloon max 6.239.624 kB (96,8% trần) cùng mốc 12:25:29Z, 0 mẫu ghim. Quỹ đạo trong lúc kẹt (mẫu 30 s): avail 1.189 MB @12:13:29Z → 1.149 → 1.099 → 987 → 901 → 850 → 755 → 679 → 603 → 553 → 509 → 476 → 420 → 387 → 342 → 329 → 247 MB @12:25:29Z — rơi đơn điệu gần như từng mẫu; mem_used 6.744 → 7.686 MB; balloon 5.030.168 → 6.239.624 kB. NHƯNG RSS process kẹt GIẢM trong cùng cửa sổ: WebKitWebProcess 348.676 KB (12:13:29Z) → 338.136 (12:16:02Z) → 291.372 (12:20:03Z); MiniBrowser 293.480 → 289.156 → 235.420 KB; node MainThread 210.336 → 129.580 → 111.664 KB. **Kết luận: process bị kẹt KHÔNG tự ăn thêm RAM — H3-D1 vẫn BÁC BỎ (đợt 151, khẳng định lại đợt này).** Avail rơi là do balloon host tăng (~1,2 GB trong 15 phút kẹt), không phải process kẹt phình — chỉ là tương quan, H1/H2 đã bác bỏ nên không dùng làm bằng chứng nguyên nhân; giao T9 đối chiếu với sampler của họ (T9 đo cả phiên). Avail hồi phục lên ~999 MB lúc 12:29:30Z sau khi timeout giết process kẹt (12:27:03Z).
- **F-170-T8-3 — REPLAY #79: `apt-get update` CHẬM ~9 PHÚT RỒI TỰ HỒI PHỤC (CÙNG HỌ #73/#78 — STALL MIRROR/PROXY).** Replay hệ thống trên boot #79 (pid 822, process hệ thống): `apt-get update` (lazy index refresh, pid 843) chạy từ ~11:35:36Z, còn chạy lúc T8 kiểm 11:40:52Z (elapsed 05:16, dpkg.log đứng yên 2 dòng, lists=3) → TỰ XONG trước 11:44:52Z; vòng lặp cài đặt 11:44:52–11:48:40Z (theo cờ T4), dpkg 2→1545; POSTBOOT_PASS viết 11:49:14Z (T5, poll=0, replay-đầy-đủ). **Giống #78** (stall ~11 phút rồi tự hồi phục, không cần repair) và **khác #73** (stall rồi postboot FAIL) / **khác #75** (replay không chạy, T5 repair-sớm). **Ảnh hưởng T8:** T8 + T4 chờ replay xong mới chạy đo (selfcheck #2 12:08:34Z xác nhận 6/6 lib + GST 1624 trước O8 12:08:45Z) — không chạy đo trên môi trường thiếu lib. Ghi nhận để T5-170 đối chiếu (stall update ~9 phút có phải cùng cơ chế #73/#78 không).
- **F-170-T8-4 — COPY DRIVER 169→170: (a) FILE .sh MẤT BIT +x KHI TẠO BẰNG REDIRECT — PHÁT HIỆN Ở CHECKLIST (o), ĐÃ CHMOD +x TRƯỚC KHI CHẠY; (b) REPLAY THIẾU ENTRY 169-SẠCH — ĐÃ VÁ.** (a) Copy bằng `sed ... > file` tạo file mới với quyền mặc định 644 — cả 7 file .sh đều mất bit +x so với bản gốc 169 (rwxrwx---). Phát hiện khi kiểm checklist (o) (`test -x diag-stall-170t8.sh` = NOT executable lúc 11:38:56Z); đã `chmod +x` toàn bộ .sh TRƯỚC mọi lần chạy (diag-stall + driver + waiter + selfcheck đều executable lúc kiểm lại). Bài học đứng: sau copy bằng redirect, kiểm `ls -l` + `test -x` ngay (đừng chỉ kiểm nội dung). (b) `sed s/169/170/` đổi key `169-sach` trong LOGS dict của replay thành `170-sach` — làm mất entry log 169-sạch; đã vá: thêm entry `169-sach-85m4` → round169-t8 + biến `run170` riêng + kết luận C5.1 kiểm cả 7 log sạch (kiểm lại bằng grep: replay chạy đúng 10 log — 164-kẹt + 163/165/166/167/168/169/170-sạch + 2 log 86n2). Không có điểm stale nào khác lọt vào chạy (waiter chạy đúng deadline 13:30Z — thực tế thoát sớm sau GATE-FOUND poll 27; extract đọc đúng 1 log waiter; diag symlink đúng 170 lúc kiểm cuối).
- **F-170-T8-5 — CHROMIUM 84l10 W1-LẦN2 DELTA=+2 (ARTIFACT BẮN LẶP — VERDICT VẪN PASS) + CHROMIUM E4 ended=false LẦN THỨ BA LIÊN TIẾP.** W1-lần1 PASS delta=+1; W1-lần2 PASS delta=+2 (2→4, "gồm bắn lặp do ghi đè ended còn bật — artifact test"); W1-lần3 PASS delta=+1 (4→5). Script verdict vẫn PASS cả ba lần (hạ-cánh-về-target=true, errors=0; KẾT QUẢ: KHÔNG FAIL). **Cùng mẫu đợt 169** (Chromium W1-lần2/3 delta=+2); WebKit đợt này W1-lần1/2/3 đều delta=+1 sạch (trước khi kẹt ở W2). Ghi nhận để T10 đối chiếu (artifact của chính script test trên Chromium, không phải kẹt hay lỗi app); không đổi verdict pha hay verdict đợt. **Chromium E4 ended=false lần thứ ba liên tiếp** (168, 169, 170; đợt này ct cuối=3,997, restartEndedVideo tại cuối=7 → sau 3 s=7) — WebKit E4 không có verdict đợt này nên chuỗi ended=false của WebKit (167, 168, 169) DỨT. Script verdict vẫn PASS; đừng trích ended thành FAIL.
- **F-170-T8-6 — MỐC GIỜ CHỒNG LẤN: BOOT LÚC ĐÓNG ĐỢT 169 e298bb52 ~11:15Z vs BTIME #79 11:11:05Z — GIAO T0-170 XÁC MINH, T8 KHÔNG PHÁN.** Cờ T4-170 nêu: "lưu ý mốc giờ T10-169: boot lúc đóng e298bb52 ~11:15Z vs btime 11:11:05Z". T8 xác minh độc lập: btime boot hiện tại 1795345865 = 11:11:05Z (đọc trực tiếp /proc/stat lúc mở 11:37:47Z + kiểm cuối 12:44:38Z — không đổi); boot_id `5df1871f` không đổi trong phiên; uptime lúc mở 26 phút (khớp btime 11:11:05Z). T8 KHÔNG xác minh được mốc "~11:15Z" của T10-169 (không có trong phạm vi T8) — số hiệu #79 là ỨNG VIÊN theo đếm tuần tự sau #78. Giao T0-170 xác minh đầy đủ 9 nguồn (overlap/migration hay mốc giờ ghi tay lệch — cùng họ nghịch lý đồng hồ F-169-T8-3, nhưng đợt này KHÔNG có lệch đồng hồ trong phiên: waiter/O8/harness dùng cùng một đồng hồ boot, 0 reboot trong phiên).
- **F-170-T8-7 — (c') NGOÀI PHẠM VI KẸT 84l10: 0 KÍCH HOẠT TRONG LÚC KẸT LÀ ĐÚNG THEO THIẾT KẾ, KHÔNG PHẢI FALSE-NEGATIVE.** (c') chỉ chạy trên log có dòng HB128 — chỉ script 85m4 có HB128; 84l10/86n2 không có HB128 nên khối FRESH-CONTENT bỏ qua (đúng thiết kế quyết (A') đợt 166). Kẹt 84l10 đợt này (12:12–12:27Z) xảy ra ở pha không có HB128 → (c') 0 kích hoạt là ĐÚNG, không phải bỏ sót. Đừng trích "0 kích hoạt (c') đợt này" thành "(c') không bắt được kẹt 84l10" mà không ghi phạm vi 85m4-only. Nếu parent muốn (c') bao phủ 84l10 thì cần thiết kế mới (84l10 không có heartbeat 5 s) — T8 không đề xuất trong đợt này.
- **F-170-T8-8 — SELFCHECK #1 GST PLUGINS = 0 LÀ SỐ GIẢ LẦN THỨ NĂM (GST-INSPECT-1.0 CHƯA CÓ LÚC KIỂM).** Selfcheck #1 (11:38:59Z, #79, replay chưa chạy) cho "GST plugins 0" vì `gst-inspect-1.0` chưa được cài (gstreamer1.0-tools chưa tới lượt cài; GST dir 0 file lúc đó; chỉ 1/6 lib có). Selfcheck #2 (12:08:34Z, sau replay) cho 1624 thật + GST dir đầy đủ. Cùng họ F-166-T8-4 / F-167-T8-6 / F-168-T8-2 / F-169-T8-6 — bài học đứng: selfcheck GST đếm bằng `gst-inspect-1.0 | wc -l` gây hiểu nhầm khi replay chưa cài tools — lần sau đếm file plugin trước, chỉ dùng gst-inspect sau khi dpkg.log ổn định + tools đã có.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 21 → 22? (T8 ĐỀ XUẤT: LÊN 22 — CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `5df1871f` (#79 ứng viên), lượt yên #39 hợp lệ TRÊN CÙNG BOOT ĐO (attempt1-5df1871f, median 40,0 ms) VÀ gate cho boot đo FOUND qua đường (a) chuẩn (POSTBOOT_PASS 11:49:14Z). Tiền lệ đợt 157: chuỗi lên dù cùng đợt harness có kẹt 84l10. Nếu parent chọn GIỮ 21 thì phải nêu lý do vượt ba điều kiện đã thỏa — T8 không thấy lý do như vậy (xem §A).
2. **Kẹt thật WebKit 84l10 ở W2-setup (runEngine:433) — kẹt cộng dồn 16 → 17; chuỗi "P3 không kẹt" 4 → 0 (ĐỨT); H3 vẫn mở, chỉ giám sát thụ động tiếp.** 85m4 P4-lần3 PASS lần thứ mười một liên tiếp; 86n2 P4-lần3 PASS (điểm kẹt đợt 165 sạch đợt thứ năm liên tiếp); 86n2 P4-lần2 PASS (chuỗi verdict 20 → 21); 84l10 kẹt lần thứ hai (157: E4-setup; 170: W2-setup — khác điểm, cùng họ evaluate-chết). **Câu hỏi cho T10/parent: có mở điều tra riêng cho 84l10 không** (điều kiện H3 theo quyết (i) đợt 158 là 85m4 P4-lần3 tái diễn lần 3 — KHÔNG đạt; 84l10 đã kẹt 2 lần trong 14 đợt gần đây, ở 2 điểm khác nhau trong cùng script).
3. **Đối chứng Chromium cùng pha: N cộng dồn N=32 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161/162/163/164/165/166/167/168/169/170 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **Lượt yên #39 CÓ LƯỢT HỢP LỆ — chuỗi lên 34** (P1 132/135, P2 126/126, P3-A1 114/135, P3' 99/107 occ = 91/94 distinct-seq, P7 68/68; attempt1 tickCost median 40,0 ms; 8 seq (c2) đều MỚI: 195, 222, 276, 306, 333, 420, 476, 502). **Không có attempt nhiễm** (chỉ 1 attempt, hợp lệ ngay lần đầu) — chờ quyết §12.1 của T10 (T4 đã đóng cờ; LIMITS T4-170 đã có).
5. **Reboot #79 (btime 11:11:05Z, boot `5df1871f`) TRƯỚC khi đợt mở 24m46s — chờ quyết §12.1 của T10** (số hiệu theo đếm tuần tự sau #78; T8 chỉ xác minh btime + uptime + boot_id — giao T0-170 xác minh đầy đủ 9 nguồn; lưu ý mốc giờ F-170-T8-6; POSTBOOT_PASS cho #79 ĐÃ CÓ 11:49:14Z; watcher-170 đang chạy lúc T4 đóng (pid 20516)).
6. **(1c') GIỮ NGUYÊN diag-only đợt này — 0 kích hoạt, 0 FP — GIỮ NGUYÊN (xem §C).** Replay: C5.1 ĐẠT (RUNSPAN TRIGGER đúng 125 s trên log kẹt 164; 0 FP trên 7 log sạch 163/165/166/167/168/169/170). Live: 0 kích hoạt (đúng — 0 kẹt ở 85m4). Không cần quyết lại trừ khi đợt sau có FP. Lưu ý phạm vi 85m4-only (F-170-T8-7).
7. **85m4 P4-lần3 PASS lần thứ mười một liên tiếp (chuỗi 10 → 11); 85m4 P4-lần2 PASS (điểm kẹt đợt 164 sạch đợt thứ sáu liên tiếp); 86n2 P4-lần2 PASS (chuỗi verdict 20 → 21); 86n2 P5-entry PASS (163, 164, 166, 167, 168, 169, 170 — 165 không có verdict); 86n2 P2-entry PASS lần thứ mười hai liên tiếp; WebKit 84l10 E4 KHÔNG có verdict đợt này** (kẹt ở W2-setup — xem F-170-T8-5). 85m4/86n2 CHƯA đủ điều kiện mở điều tra riêng theo quyết (i) đợt 158 — nay có kẹt mới ở 84l10, xem mục 2 trên.
8. **RAM avail min 247 MB (thấp nhất kể từ đợt 164) + balloon max 96,8% — chờ T9 đối chiếu** (F-170-T8-2); chuỗi ghim trần phán bằng sampler T9 (giao T10). **Avail rơi đơn điệu trong lúc kẹt nhưng RSS process kẹt GIẢM — H3-D1 vẫn BÁC BỎ** (giao T9).
9. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-170 xác nhận số lần — lần thứ 24 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; POSTBOOT_PASS cho boot `0c8a94aa` (#68 ứng viên) CHƯA CÓ (boot thứ 9 lọt — không bù được); POSTBOOT_PASS #69 ĐÃ CÓ (20:43:50Z, replay-đầy-đủ, dpkg 1545); POSTBOOT_PASS #70 ĐÃ CÓ (23:40:45Z, replay-đầy-đủ, dpkg 1545); POSTBOOT_PASS #63 KHÔNG CÓ, không bù được (boot thứ 7 lọt); #66 CHƯA CÓ (đợt 163 — nay thêm #68 CHƯA CÓ, #71 CHƯA CÓ, #73 KHÔNG CÓ, #78 KHÔNG CÓ — boot thứ 13 lọt, không bù được trong đợt này; **#79 ĐÃ CÓ 11:49:14Z**).
10. **1 reboot liên quan đợt (#79 ứng viên TRƯỚC khi đợt mở 24m46s)** — số hiệu #79 đã được T0-170 xác minh? (chờ xác minh — T8 chỉ xác minh btime + uptime + boot_id; giao T0-170 xác minh đầy đủ 9 nguồn); mù cho boot mới giao T2-170 (theo quyết (s) đợt 158); INSIDE #79 giao T2-170 (dải FULL123/FULL124 — chuỗi MỚI từ #73 nếu INSIDE).

---

# §C — KIỂM "NỘI DUNG TƯƠI" (1c') — (c') GIỮ NGUYÊN DIAG-ONLY ĐỢT 170, 0 FALSE-POSITIVE

## C1. Thiết kế (c') đã duyệt (quyết (A') đợt 166 §12.3(i) — triển khai đợt 167, giữ nguyên đợt 168 theo quyết (i) đợt 167, giữ nguyên đợt 169 theo quyết (i) đợt 168, giữ nguyên đợt 170 theo quyết (i) đợt 169)

- **(c') thay (c):** trong vòng poll của `run_one`, lấy toàn bộ chuỗi liên tiếp (trailing run) các dòng HB128 **cùng tag + cùng playhead + cùng ct** kết thúc ở dòng mới nhất; kích hoạt khi `elapsed mới nhất − elapsed đầu chuỗi ≥ 120 s` VÀ chuỗi dài ≥3 dòng VÀ điều kiện (e)/(f) trên dòng mới nhất (playing=true khi có trường này; nếu không có thì seeking=false; paused=false và seeking=false khi các trường này có).
- **Không đổi:** ngưỡng 120 s; ngân sách chung với (1b) ≤2 lần/lần chạy, cách nhau ≥240 s; diag-only (chỉ ghi log chẩn đoán + gọi diag-stall, không can thiệp chạy, không đổi verdict/timeout); vị trí code (driver copy trong hidden_files, không chạm script repo); phạm vi chỉ 85m4 (script duy nhất có HB128).
- **Giữ nguyên đợt này:** helper `check-fresh-170t8.py` (bản copy 169, chỉ đổi nhãn) + khối kiểm FRESH-CONTENT trong `run_one` của CẢ HAI driver (run-webkit + run-chromium) — không sửa logic; kiểm chứng offline lại trước harness (xem C2).

## C2. Kiểm chứng offline TRƯỚC harness (helper check-fresh, chạy ~11:39Z)

| Log | HB128 | check-fresh-170t8.py |
|---|---|---|
| 164-kẹt 85m4 | 174 dòng (P4-lần2 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.267 ct=0.267) | **TRIGGER elapsed=125 s** (ts 19:38:13.174Z, run 5 s→125 s, 25 dòng, span=120 s) |
| 163-sạch 85m4 | 20 dòng | OK maxspan=5 s |
| 165-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 166-sạch 85m4 | 20 dòng | OK maxspan=5 s |
| 167-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 168-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 169-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 164/165-86n2 | 0 dòng | OK maxspan=0 s |
| (file vắng) | — | OK maxspan=0 s (không crash) |

- Helper KHỚP replay RUNSPAN đợt 169 từng dòng (cùng elapsed kích hoạt 125 s, cùng max span 5 s trên log sạch) — hai triển khai độc lập của cùng ngữ nghĩa (c') cho cùng kết quả; bản 170 chỉ đổi nhãn, không đổi logic.

## C3. Replay sau harness (replay-1c-170t8.py, chạy ~12:44Z — thêm log 169-sạch + 170-sạch)

| Log | HB128 | LITERAL (§C2 nguyên văn) | RUNSPAN (bản sửa (c')) |
|---|---|---|---|
| 164-kẹt 85m4 | 174 dòng | KHÔNG kích hoạt | **TRIGGER elapsed=125 s** (ts 19:38:13.174Z, run 5 s→125 s, 25 dòng, span=120 s) |
| 163-sạch 85m4 | 20 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 165-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 166-sạch 85m4 | 20 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 167-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 168-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| **169-sạch 85m4** | **19 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 5 s)** |
| **170-sạch 85m4** | **19 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 5 s)** |
| 164/165-86n2 | 0 dòng | KHÔNG kích hoạt (không có dòng) | KHÔNG kích hoạt (không có dòng) |

- **Tiêu chí C5.1 — RUNSPAN: ĐẠT.** Kẹt-164 kích hoạt ĐÚNG elapsed=125 s (khớp dự đoán C3 "≈125 s"); sạch-163/165/166/167/168/169/170 đều KHÔNG kích hoạt (max run span 5 s — biên 24× so với ngưỡng 120 s). **0 false-positive trên 7 log sạch.**
- **Chạy thật đợt này: FRESH-CONTENT-170 = 0 kích hoạt trong 6 pha — ĐÚNG** (0 kẹt ở 85m4; log 85m4 live có 19 dòng HB128, max run span 5 s — khớp replay). Không có false-positive → **(c') ĐƯỢC GIỮ**, không cần báo lại parent theo quyết (A') (chỉ báo lại khi có FP).
- Lưu ý: max run span 5 s trên log sạch đến từ 2 dòng liên tiếp cùng tag `sampleFor P5-phaseB-long` với playhead=30 ct=30 (elapsed 35 s→40 s) — playhead dừng ở cuối video trong P5, nhưng chỉ 2 dòng / span 5 s, xa ngưỡng 120 s (biên 24×). Đây là hành vi bình thường cuối P5, không phải kẹt.
- Lưu ý phạm vi: kẹt 84l10 đợt này ở pha không có HB128 nên (c') không thể kích hoạt — 0 kích hoạt không phải false-negative (xem F-170-T8-7).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 170 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 + (p) đợt 156 + (i) đợt 157 + (i) đợt 158 + (i) đợt 159 + (h) đợt 160 + (h) đợt 161 + (h) đợt 162 + (h) đợt 163 + (h) đợt 164 + (i) đợt 165 + (i) đợt 166 + (i) đợt 167 + (i) đợt 168 + (i) đợt 169) — 1 KẸT MỚI 84l10 W2-SETUP, H3 VẪN MỞ, CHỈ GIÁM SÁT THỤ ĐỘNG

## B1. Trạng thái giả thuyết sau đợt 170 (H3 vẫn mở — 1 KẸT MỚI 84l10)

| Giả thuyết | Trạng thái đợt 169 | Trạng thái đợt 170 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** — avail min 247 MB trong lúc kẹt NHƯNG kẹt bắt đầu lúc avail còn 1.189 MB (12:13:29Z, cao hơn avail-min 512 MB đợt 169 khi 0 kẹt); avail rơi LÀ HỆ QUẢ trong lúc kẹt, không phải điều kiện đầu (xem F-170-T8-2) |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** — avail rơi đơn điệu 1.189→247 MB trong lúc kẹt (tương quan), nhưng RSS process kẹt GIẢM, balloon host tăng — không có bằng chứng chiều nhân quả từ RAM sang kẹt |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — 0 kẹt mới đợt 169 | **VẪN MỞ — 1 KẸT MỚI đợt này (WebKit 84l10 W2-setup, evaluate chết, probe 1+1 timeout, WebKit-only)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153) | **BÁC BỎ (đứng nguyên — KHẲNG ĐỊNH LẠI BẰNG SỐ ĐO MỚI đợt này: WebKitWebProcess RSS GIẢM 348.676 → 291.372 KB trong lúc kẹt; xem F-170-T8-2)** |

- Đợt 170 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p)/(i): **1 kẹt trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — kẹt đợt này cùng họ H3: evaluate chết + probe timeout + WebKit-only, như kẹt 85m4 đợt 158 và 84l10 đợt 157).
- **Điều kiện mở điều tra H3 KHÔNG đạt:** theo quyết (i) đợt 158, điều kiện là 85m4 P4-lần3 tái diễn lần 3 — ngược lại, 85m4 P4-lần3 **PASS lần thứ mười một liên tiếp** (chuỗi 10 → 11); điểm kẹt đợt 165 (86n2 P4-lần3) **PASS, sạch đợt thứ năm liên tiếp**. Kẹt mới là ở 84l10 (W2-setup) — điểm khác, không thuộc điều kiện (i). **Câu hỏi cho T10/parent: có mở điều tra riêng cho 84l10 không** (đã kẹt 2 lần: đợt 157 E4-setup runEngine:457, đợt 170 W2-setup runEngine:433 — 2 điểm khác nhau trong cùng script, cùng họ evaluate-chết).

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 170

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–170) + đường ổn định `t8-diag-stall.sh` → 170 (CẢ HAI symlink cập nhật 11:38:56Z; kiểm cuối vẫn trỏ 170) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **1 kẹt thật → 1 kích hoạt ĐÚNG, 0 false-positive** | **1 KÍCH HOẠT — ĐÚNG (có kẹt thật để bắt).** 4 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–170) | 6 lần chạy harness; `live_diags=2` ở pha kẹt 84l10, `live_diags=0` ở 5 pha còn lại | **2 kích hoạt — ĐÚNG, LOG IM LẶNG THẬT (124 s + 365 s)** |
| (1c') Kiểm "nội dung tươi" (c') | **GIỮ NGUYÊN diag-only đợt này** (quyết (i) đợt 168/169; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 lần chạy harness (chỉ 85m4 có HB128); `live_diags=0` ở 85m4 | **0 kích hoạt — ĐÚNG, KHÔNG CÓ KẸT Ở 85m4; 0 false-positive. (c') ĐƯỢC GIỮ (xem §C).** |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=59 mẫu hợp lệ) | Balloon n=59 pinned=0 min=4.727.592 max=6.239.624 (96,8% trần) mean=5.612.732; avail min=247 MB @12:25:29Z (trong cửa sổ kẹt WebKit 84l10); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 12:35:01Z), 85m4 PASS (exit 0, 12:37:17Z), 86n2 PASS (exit 0, 12:41:23Z)** | N cộng dồn **N=32 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **1 lần kẹt → kích hoạt 1 lần** (baseline đã lưu lúc bắt đầu; 4 snapshot stall) | 4 snapshot stall đầy đủ đợt này (đúng — có kẹt) |

## B3. Chữ ký kẹt — đợt 170: 1 KẸT (WebKit 84l10 W2-setup)

| Trường | Giá trị |
|---|---|
| Pha / script | WebKit 84l10, `clicktest-84l10-webkit-loop-w1.mjs` (md5 `b8c08a7c`, không đổi) |
| Thời gian | 12:12:02–12:27:03Z (exit 124 sau timeout 900 s); log im lặng từ 12:12:24.742Z |
| Điểm kẹt | W2-setup, `runEngine:433` — evaluate đầu tiên của W2 (`setPlayhead(0)` + `togglePlay`); W1-lần1/2/3 PASS trước đó; W2/E4 không có verdict |
| Chẩn đoán | WATCHDOG-137 12:13:28.907Z (evaluate >60 s); probe 1+1 TIMEOUT 30 s 12:13:58.913Z (kênh evaluate kẹt cùng / page JS chết); LIVE-DIAG 12:16:02Z (im lặng 124 s) + 12:20:03Z (im lặng 365 s) |
| Đối chứng | Chromium 84l10 cùng pha PASS (W1/W2/E4 đầy đủ) — WebKit-only |
| RAM lúc kẹt | Avail 1.189 MB lúc watchdog → 247 MB min @12:25:29Z (rơi đơn điệu); WebKitWebProcess RSS GIẢM 348.676 → 291.372 KB (H3-D1 vẫn bác bỏ); balloon 5.030.168 → 6.239.624 kB |
| Vite | HTTP 200 lúc watchdog (vite còn sống); 000 lúc timeout124 (đã release) |
| Tiền lệ | Đợt 157: 84l10 kẹt ở E4-setup runEngine:457 (sau W2 PASS) — khác điểm, cùng họ evaluate-chết; đợt 158: 85m4 kẹt P4-lần3 + 86n2 kẹt P2-entry (cùng họ) |
