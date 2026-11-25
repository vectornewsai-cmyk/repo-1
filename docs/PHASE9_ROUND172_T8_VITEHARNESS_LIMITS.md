# Đợt 172 T8 — O8 PASS 3/3 TRÊN BOOT #81 (ĐỀ XUẤT CHUỖI LÊN 24 — CÓ CAVEAT GATE (a) MODE REPAIR-SỚM) + HARNESS 6/6 SẠCH, 0 KẸT (KẸT CỘNG DỒN GIỮ 20; CHUỖI "P3 KHÔNG KẸT" 0 → 1); (1c') GIỮ NGUYÊN + TRÌNH ĐỀ XUẤT SỬA (f); MỞ ĐIỀU TRA RIÊNG 84l10 — ĐỢT ĐẦU

Ngày: 22/11/2026 (lượt cron 00:35 +07 23/11 = 17:35:51Z 22/11; T8 mở ~17:38Z, đóng ~18:40Z — TRONG hạn cờ ~20:00Z và hạn cứng ~20:30Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) **giữ nguyên (1c') (c') diag-only** theo quyết (i) đợt 171 — helper `check-fresh-172t8.py` kiểm chứng offline (TRIGGER đúng elapsed=125 s trên log kẹt 164, 0 FP trên 8 log sạch 163/165/166/167/168/169/170/172), chạy thật: **0 kích hoạt — 0 FALSE-POSITIVE, 0 BỎ LỠ đợt này** (không có kẹt thật nào trong phạm vi (c')); (2) **TRÌNH ĐỀ XUẤT SỬA ĐIỀU KIỆN (f)** kèm bằng chứng replay (xem §C — T8 KHÔNG tự sửa (f), parent quyết); (3) O8 Chromium + WebKit 21/21 (WebKit ×2) — PASS 3/3 trên boot `4b9db449` (#81, T0-172 xác nhận 9/9 nguồn), **chuỗi WebKit FULL PASS T8 ĐỀ XUẤT LÊN 24** (xem §A — lượt yên #41 hợp lệ TRÊN CÙNG BOOT ĐO + gate (a) FOUND — NHƯNG POSTBOOT_PASS mode repair-sớm, KHÔNG phải replay-đầy-đủ: caveat F-172-T8-5); (4) harness đứng — MỘT lần chạy driver duy nhất, **WebKit 3/3 + Chromium 3/3: 6/6 PASS, 0 KẸT** (đợt sạch đầu tiên kể từ đợt 169); (5) **MỞ ĐIỀU TRA RIÊNG 84l10 — ĐỢT ĐẦU, T8 chủ trì** (xem §D — phạm vi theo quyết (i) đợt 171; đợt này 84l10 PASS đầy đủ nên chưa có điểm dữ liệu kẹt mới, chỉ củng cố hồ sơ 3 điểm kẹt cũ + tinh chỉnh nhãn call-site); (6) H3: VẪN MỞ, chỉ giám sát thụ động — 0 kẹt mới; (7) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau, md5 khác nhau, bản copy dự phòng khớp md5; (8) **0 REBOOT trong phiên** (boot `4b9db449` ổn định từ lúc mở tới lúc đóng — btime 1795366925 = 17:02:05Z không đổi); **1 reboot TRƯỚC khi đợt mở — #81 (btime 17:02:05Z, T0-172 xác nhận 9/9 nguồn, gap #80→#81 = 9.064 s)** là boot lúc mở.
Nợ: docs/PHASE9_ROUND171_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 trên boot #80, chuỗi LÊN 23 theo quyết (b) đợt 171; harness WebKit 0/3 + 3 kẹt thật, kẹt cộng dồn 17→20; (1c') giữ nguyên, 0 FP nhưng BỎ LỠ 1 kẹt thật 85m4 vì (f) chặn — xem F-171-T8-7; điều tra riêng 84l10 mở theo quyết (i) đợt 171, giao T8-172 đợt đầu).

## 0. Kết luận ngắn — O8 PASS 3/3, ĐỀ XUẤT CHUỖI LÊN 24 (CÓ CAVEAT); HARNESS 6/6 SẠCH; (c') GIỮ NGUYÊN + ĐỀ XUẤT SỬA (f); ĐIỀU TRA 84l10 MỞ ĐỢT ĐẦU

- **(1c') GIỮ NGUYÊN — 0 KÍCH HOẠT LIVE, 0 FALSE-POSITIVE, 0 BỎ LỠ ĐỢT NÀY.** Không sửa driver (c') đợt này. Helper `check-fresh-172t8.py` kiểm chứng offline TRƯỚC harness: TRIGGER đúng elapsed=125 s (run 5 s→125 s, 25 dòng, playhead=0.267) trên log kẹt 164; OK maxspan=5 s trên log sạch 163/165/166/167/168/169/170; OK maxspan=811 s trên log kẹt 171 (bỏ lỡ đã biết — guard (f) chặn, xem §C); OK 0 s trên log 86n2 (không có HB128) và file vắng. Chạy thật 6 pha: **FRESH-CONTENT-172 = 0 kích hoạt** — đúng (không có kẹt thật nào trong phạm vi (c') đợt này: 85m4 WebKit PASS đầy đủ, log sạch 19 dòng HB128, maxspan=5 s). **(c') ĐƯỢC GIỮ theo quyết (i) đợt 171** (không có FP → không cần quyết lại). **ĐỀ XUẤT SỬA (f) — T8 TRÌNH, KHÔNG TỰ SỬA (xem §C + §9 mục 6):** phương án chính (f') miễn (f) khi run paused+seeking liên tục ≥300 s — replay: bắt được kẹt-171 ở elapsed=305 s (hiện bỏ lỡ), kẹt-164 vẫn bắt đúng 125 s, 0 FP trên 8 log sạch thật (163/165/166/167/168/169/170/172); biên an toàn: max run paused+seeking trên log sạch = 0 s (không log sạch nào có dù chỉ 1 dòng paused+seeking trong run đóng băng). Phương án dự phòng (f'') miễn (f) khi watchdog đã kích hoạt — bắt kẹt-171 ở 125 s nhưng ghép hai kênh chẩn đoán (c')+(i).
- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (18:11:20–18:13:52Z, 2'32", boot `4b9db449` = #81, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 18:11:31.487Z + 18:12:21.786Z, Playwright mouse click lần 2; Chromium: 18:13:22.275Z, CDP mouse click lần 2 — kiểm bằng grep đầy đủ, 6 dòng = 3 thật + 3 do driver grep lại log, KHÔNG đọc nhầm như F-166-T8-9). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid 43317/43703/44052, md5 khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate — FOUND QUA ĐƯỜNG (a) — NHƯNG POSTBOOT_PASS MODE REPAIR-SỚM, KHÔNG PHẢI REPLAY-ĐẦY-ĐỦ (caveat F-172-T8-5).** Waiter GATE-FOUND poll 29 lúc 18:09:40Z: t4=OK + POSTBOOT_PASS `round172-t5/POSTBOOT_PASS` chứa boot `4b9db449` (viết 17:50:32Z, poll=1, mode repair-sớm-quyết-h — dpkg 795 dòng thay vì 1545 của replay đầy đủ; thư mục GST là symlink → debroot, ephemeral). **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT LÊN 24 (23 → 24) — CHỜ T10/parent phán** (xem §A). Lý do: (1) lượt yên #41 CÓ lượt hợp lệ — attempt1-4b9db449, 20/20, B 5/5, tickCost median 46,0 ms ≤60, TRÊN BOOT ĐO (chuỗi lượt yên hợp lệ LÊN 36); (2) O8 chạy SAU lượt hợp lệ TRÊN CÙNG BOOT `4b9db449`; (3) gate cho boot đo FOUND qua đường (a). T0-172 cũng đề xuất LÊN 24 (có điều kiện — chờ bộ O8 thứ hai của T8 + T10 xác nhận md5). **Caveat: gate (a) đợt này KHÔNG phải replay-đầy-đủ** — nếu parent cho rằng mode repair-sớm không đủ chuẩn cho chân gate thì chuỗi GIỮ 23; T8 ghi rõ cả hai hướng, không giấu (xem §A). Harness 6/6 sạch đợt này (khác hẳn caveat harness 0/3 đợt 171) nên không có caveat từ phía harness.
- **Harness (MỘT lần chạy driver duy nhất, boot `4b9db449` #81): WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (18:14:06–18:29:39Z, 15'33" — nhanh nhất kể từ đợt 169 do 0 timeout): WebKit 84l10 **PASS đầy đủ** (W1-lần1/2/3 +1, W2 PASS playhead cuối=30, E4 PASS ended=true ct cuối=4 — lần đầu 84l10 WebKit PASS trọn vẹn kể từ đợt 169); WebKit 85m4 **PASS** (P1/P2/P3 + P4-lần1/2/3 +1, P5 PASS 0 restart — **P4-lần3 PASS trở lại, chuỗi mới bắt đầu từ 1** sau khi chuỗi 11 lần DỨT ở đợt 171); WebKit 86n2 **PASS** (P1/P2/P3 + P4-lần1/2/3 +1, P5 PASS 0 restart — **điểm kẹt đợt 165 sạch trở lại sau lần tái diễn ở đợt 171**; P4-lần2 verdict 22 → 23). Chromium 84l10/85m4/86n2 PASS. **Kẹt cộng dồn GIỮ 20. Chuỗi "P3 không kẹt" 0 → 1** (đợt sạch đầu tiên sau khi ĐỨT ở đợt 170). Chromium đối chứng N=33 → **N=34 mỗi pha**, 0 kẹt.
- **Watchdog (i): 0 kích hoạt — ĐÚNG (0 kẹt thật). Live-diag (1b): 0 kích hoạt — ĐÚNG (0 log im lặng). (1c'): 0 kích hoạt — ĐÚNG (0 FP trên log sạch chạy thật).** 0 snapshot stall. RAM sampler n=32: balloon max 91,5% trần, 0 mẫu ghim; avail min **478 MB @18:21:36Z** (trong cửa sổ WebKit 86n2 — KHÔNG kẹt: avail thấp một mình không gây kẹt, xem F-172-T8-4).
- **0 reboot trong phiên** (boot `4b9db449` ổn định từ lúc T8 mở tới lúc đóng — kiểm ở mọi mốc: selfcheck #1/#2, waiter, O8, harness, kiểm cuối). Replay hệ thống trên boot mới CHƯA xong lúc T8 mở (selfcheck #1: libs 1/6, dpkg 2 dòng) — T5-172 repair sớm + viết POSTBOOT_PASS 17:50:32Z (mode repair-sớm-quyết-h, xem F-172-T8-5).
- **T8 ĐÓNG ~18:40Z — TRONG hạn cờ ~20:00Z** (gate FOUND 18:09:40Z; O8 xong 18:13:52Z; harness xong 18:29:39Z; phần còn lại là trích số + viết LIMITS).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 17:02:05 22/11 | REBOOT #81 (boot `4b9db449`, btime 1795366925) — boot lúc đợt mở (T0-172 xác minh 9/9 nguồn; gap #80→#81 = 9.064 s) |
| 17:35:51 | Đợt 172 mở (lượt cron 00:35 +07 23/11) |
| ~17:38 | T8 mở: đọc LIMITS T8-171 + GAP §100 + aggregate 171 §11/§12.3; cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 171 (không đổi); fixture /tmp MẤT theo reboot #81; `/tmp/.X11-unix/` TRỐNG lúc mở (0 socket) |
| 17:40 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round172-t8/diag-stall-172t8.sh`, readlink + test -x + test -e xác nhận; toàn bộ .sh còn bit +x (cp -a giữ quyền — xem F-172-T8-1 về lỗi preserve ownership không ảnh hưởng nội dung)** |
| 17:40:45 | **Selfcheck #1 trên #81: libs 1/6 (chỉ libevent); GST plugins 0 (binary gst-inspect-1.0 VẮNG — xem F-172-T8-2); dpkg.log 2; cache 0, lists 5; RAM avail 1.137 MB, balloon 5.203.900 kB** — replay chưa chạy |
| ~17:41 | **Copy driver 171→172 (cp -a) + đổi nhãn + dọn scratch cũ; waiter deadline 19:30Z (epoch 1795375800, kiểm bằng `date -d`)** |
| ~17:41 | **Rebuild fixture /tmp lần 1 trên #81 (quy tắc (l)): hevc + i7 + h-30s/g-4s KHỚP kỳ vọng đợt 125 (`ba0c7c62`/`f05daed8`/`fbaa3d1a`/`a1fb8549`)** |
| ~17:41 | **check-fresh-172t8.py kiểm chứng offline ĐẠT** (TRIGGER 125 s kẹt-164; OK 5 s sạch 163/165/166/167/168/169/170; OK 811 s kẹt-171 — bỏ lỡ đã biết; OK 0 s 86n2/file vắng) |
| 17:41:36 | Waiter #81 bắt đầu trên boot `4b9db449` (deadline 19:30Z); poll 1: t4=0 postboot=0 |
| 17:50:32 | **POSTBOOT_PASS #81 ĐÃ CÓ (T5, poll=1, mode repair-sớm-quyết-h)** — boot `4b9db449`, dpkg 795, cache 110, lists 75 |
| 17:59:27 | Gate (poll-wait của T4) mở poll #25 qua đường (a) — T4 bắt đầu attempt |
| 18:03:19 | T4 poller thoát vì LƯỢT HỢP LỆ (attempt1-4b9db449, 20/20, B 5/5, median 46,0 ms — ngân sách dùng 1/3, không attempt nhiễm) |
| 18:08 | **Cờ T4 `round172-t4.done` viết: LƯỢT YÊN #41 CÓ LƯỢT HỢP LỆ (chuỗi lượt yên hợp lệ LÊN 36)** — trễ ~5' sau khi poller thoát (cải thiện so với ~17' đợt 171) |
| 18:09:40 | **GATE-FOUND poll 29 — waiter bắt được gate cho boot đo (t4=OK + postboot (a) 17:50:32Z)** |
| 18:10:45 | **Selfcheck #2 trên #81: 6/6 lib CÓ; GST plugins 0 (binary vắng — xem F-172-T8-2; thư mục plugin 269 file qua symlink → debroot, T5 poll1 PASS GST); dpkg.log 795; cache 110, lists 75; RAM avail 1.783 MB, balloon 4.913.012 kB** |
| 18:10 | **T0-172 ĐÓNG CỜ: #81 XÁC NHẬN 9/9 nguồn; O8 T0 PASS 3/3 (DONE 18:09:35Z); run 171 SUCCEEDED sau viết lại tại #81 (finished 17:29:26Z, margin 385 s); (m) #81 ỨNG VIÊN DƯƠNG (requeue +33,477 s — thuộc T2-172 + parent)** |
| 18:11:13 | **Dọn X11: X194/X195 (mtime 17:45, T1 suite — T0 giao T8 dọn; 0 process giữ fd, 0 Xvfb) + `/tmp/.X11-unix/` TRỐNG trở lại** (xem F-172-T8-3) |
| 18:11:20–18:13:52 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #81** (xem §A) — sau lượt yên hợp lệ, TRÊN CÙNG BOOT, gate (a) FOUND (mode repair-sớm — caveat) |
| 18:14:06–18:29:39 | **Harness (MỘT lần chạy driver duy nhất, boot `4b9db449`): WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (xem §2) — 0 reboot giữa O8 và harness; boot #81 ổn định |
| ~18:32 | **Trích số liệu (extract-172t8.py) + replay (1c') trên log 172: C5.1 ĐẠT (0 FP trên 8 log sạch thật 163/165/166/167/168/169/170/172; kẹt-171 ghi đúng là BỎ LỠ, không gắn nhãn "sạch" nữa — sửa F-171-T8-7) + replay đề xuất sửa (f) (replay-f-fix-172t8.py — xem §C)** |
| ~18:35 | **Kiểm cuối: process Xvfb/MiniBrowser/WebKit/Chromium còn sót của T8: 0; lock vite TRỐNG; `/tmp/.X11-unix/` TRỐNG; boot `4b9db449` ổn định; fixture /tmp vẫn khớp md5** |
| ~18:40 | Cờ `round172-t8.done` (TRONG hạn cờ ~20:00Z) |

## A. O8 — PASS 3/3 trên boot `4b9db449` (#81), CHUỖI ĐỀ XUẤT LÊN 24 (23 → 24 — CÓ CAVEAT GATE (a) MODE REPAIR-SỚM)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 18:11:20–18:12:10 | 0 | **21/21 PASS** — S1 PASS 18:11:31.487Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 18:12:10–18:13:02 | 0 | **21/21 PASS** — S1 PASS 18:12:21.786Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 18:13:02–18:13:52 | 0 | **21/21 PASS** — S1 PASS 18:13:22.275Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-22T18-11-20-4b9db449-pid43317.json` 21 kết quả `ok=true` 21/21, md5 `7bc8c66d`; attempt2 `o8w-clicktest-report-2026-11-22T18-12-11-4b9db449-pid43703.json` 21/21 `ok=true`, md5 `25bb0df0` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-22T18-13-02-4b9db449-pid44052.json` 21/21 `ok=true`, md5 `8c53a5dc`. Bản copy dự phòng của driver T8 (`o8w-clicktest-report-attempt1.json` / `o8w-clicktest-report-attempt2.json` / `o8-clicktest-report-chromium.json`) khớp nội dung file stamped (cùng md5: 7bc8c66d / 25bb0df0 / 8c53a5dc). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep đầy đủ: PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- Ghi chú log: 6 dòng `PASS: S1` = 3 thật (18:11:31.487Z attempt1, 18:12:21.786Z attempt2, 18:13:22.275Z Chromium) + 3 do driver grep lại log sau mỗi attempt (cùng mẫu đợt 165–171). T8 kiểm bằng `grep -an` đầy đủ TRƯỚC khi ghi LIMITS (không lặp lỗi đọc nhầm tail-8 của F-166-T8-9); kết quả 21/21 ×3 đã xác minh độc lập từ JSON nên verdict O8 ĐỨNG.
- **NHÃN LIB ĐÚNG NGAY TỪ ĐẦU — O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (như đợt 162–171, xem F-163-T8-2 + đính chính quyết (b) đợt 167): script O8 gốc `clicktest-87o8-mask-track-webkit.mjs` tự đặt `LD_LIBRARY_PATH` với DEBROOT, và driver o8-driver-172t8.sh cũng đặt `LD_LIBRARY_PATH="$DEBROOT:..."` khi gọi node. Bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness chạy TRÊN CÙNG boot đo (#81) với thư mục GST THẬT (269 plugin qua symlink → debroot, T5 poll1 PASS GST) VÀ POSTBOOT_PASS cho boot đo ĐÃ CÓ (17:50:32Z, mode repair-sớm) — **và harness PASS 6/6, nên bằng chứng launch+pass bằng system libs đợt này là ĐẦY ĐỦ (khác đợt 171 chỉ có bằng chứng launch vì harness kẹt)**.
- Driver O8 giữ 1 lock vite `t8-round172` suốt lượt (nhả 18:13:52Z; vite sau release curl 5560/5554 = 000000 — như đợt 162–171).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-172t8.mjs`, `node --check` OK — bản copy từ 171, chỉ đổi nhãn) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Gate cho boot đo `4b9db449`: FOUND QUA ĐƯỜNG (a) — NHƯNG MODE REPAIR-SỚM (caveat F-172-T8-5).** (a) POSTBOOT_PASS trong `round172-t5/` chứa boot `4b9db449` (ghi 17:50:32Z, poll=1, mode repair-sớm-quyết-h: dpkg 795 dòng, cache 110, lists 75; thư mục GST là symlink → debroot) — waiter GATE-FOUND poll 29 lúc 18:09:40Z (t4=OK + postboot (a)). Không cần đường (b).
- **Chuỗi WebKit FULL PASS: 23 → 24? (T8 ĐỀ XUẤT: LÊN 24 — CHỜ T10/parent phán).** O8 pass 21/21 ×2 đợt này (trên boot `4b9db449` #81), VÀ cả ba điều kiện đều thỏa TRÊN CÙNG BOOT ĐO: (1) **lượt yên #41 CÓ lượt hợp lệ — TRÊN BOOT ĐO** (attempt1-4b9db449 20/20, B 5/5, tickCost median 46,0 ms ≤60; chuỗi lượt yên hợp lệ LÊN 36; P1 143/146, P2 137/137, P3-A1 123/146, P3' 108/118 occ = 96/100 distinct-seq, P7 70/70; attempt1 hợp lệ ngay, ngân sách dùng 1/3, không attempt nhiễm — theo cờ T4, viết 18:08Z); (2) **O8 chạy SAU lượt hợp lệ TRÊN CÙNG BOOT** (`4b9db449`, T0 DONE 18:09:35Z, T8 DONE 18:13:52Z, sau cờ T4 18:08Z); (3) **gate cho boot đo FOUND qua đường (a)** (POSTBOOT_PASS 17:50:32Z). Đây là trường hợp sạch như đợt 167/168/170/171 — khác đợt 169 (lượt yên hợp lệ ở boot cũ + gate không FOUND → GIỮ 21) và đợt 166 (không có lượt yên hợp lệ + đổi boot + gate không FOUND → GIỮ). **Caveat duy nhất đợt này: gate (a) mode repair-sớm, KHÔNG phải replay-đầy-đủ** (dpkg 795 thay vì 1545; GST qua symlink ephemeral) — nếu parent cho rằng mode này không đủ chuẩn cho chân gate thì chuỗi GIỮ 23; T8 ghi rõ cả hai hướng, không giấu. **Harness 6/6 sạch đợt này nên KHÔNG có caveat từ phía harness** (khác đợt 171: harness 0/3 nhưng chuỗi vẫn lên theo tiền lệ 157). T0-172 cũng đề xuất LÊN 24 (có điều kiện — chờ bộ O8 thứ hai của T8 + T10 xác nhận md5 — nay đã có: T8 md5 7bc8c66d/25bb0df0/8c53a5dc; T0 md5 386e6023/4319276f/6c289174 — T8 xác minh độc lập từ JSON gốc của T0, KHỚP cờ T0).
- **O8 đợt này 2'32" tổng** (171: 2'37", 170: 2'36", 169: 2'40", 168: 2'36", 167: 3'01", 166: 2'59", 165: 2'37", 164: 3'02", 163: 3'07", 162: 2'37") — trong khung dao động các đợt gần đây, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: WEBKIT 3/3 + CHROMIUM 3/3, 6/6 PASS, 0 KẸT, 0 REBOOT GIỮA O8 VÀ HARNESS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 18:14:09–18:15:20 | **PASS** — W1-lần1/2/3 PASS (+1/+1/+1 sạch), W2 PASS (playhead cuối=30, tới cuối=true, restart tự nhiên Δ=0), E4 PASS (tới cuối=true, ended=true, ct cuối=4, restart 3→3) — **84l10 WebKit PASS trọn vẹn lần đầu kể từ đợt 169** |
| 2 | WebKit 85m4 | 0 | 18:15:35–18:17:46 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** (extraEvents=[]) — **P4-lần3 PASS trở lại (chuỗi mới từ 1)** |
| 3 | WebKit 86n2 | 0 | 18:18:01–18:22:01 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** — **điểm kẹt đợt 165 sạch trở lại sau tái diễn đợt 171; P4-lần2 verdict 22 → 23** |
| 4 | Chromium 84l10 | 0 | 18:22:17–18:23:17 | **PASS** — W1-lần1 PASS (+2 — artifact bắn lặp, xem F-172-T8-4), W1-lần2/3 PASS (+1/+1), W2 PASS (playhead cuối=30), E4 PASS (ended=true, ct cuối=4, restart 6→6) — **E4 ended=true, dứt chuỗi ended=false 4 đợt (168–171)** |
| 5 | Chromium 85m4 | 0 | 18:23:32–18:25:33 | **PASS** — P4-lần1/2/3 PASS (+1/+1/+1), P5 CÓ-RESTART (+1) ended-at-duration (report JSON ok=true, finishedAt 18:25:31.201Z) — **lần thứ hai liên tiếp (171, 172)** |
| 6 | Chromium 86n2 | 0 | 18:25:48–18:29:39 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** (report JSON ok=true, finishedAt 18:29:31.106Z) |

- 6 report JSON kiểm độc lập bằng python: 6× `ok=true` (finishedAt 18:15:14.631Z / 18:17:44.168Z / 18:21:55.010Z / 18:23:15.850Z / 18:25:31.201Z / 18:29:31.106Z).
- Môi trường: system libs trên boot `4b9db449` (replay #81 CHƯA đầy đủ lúc mở — selfcheck #1 libs 1/6; T5 repair sớm: libs 6/6 + GST symlink → debroot 269 plugin, T5 poll1 PASS GST; selfcheck T8 #2: 6/6 lib + dpkg 795 + cache 110 + lists 75; POSTBOOT_PASS cho boot đo ĐÃ CÓ 17:50:32Z mode repair-sớm). **WebKit launch + PASS THÀNH CÔNG bằng system libs** trên ĐÚNG boot đo (cả 3 pha đều chạy trọn vẹn — bằng chứng pass đầy đủ, khác đợt 171 chỉ có bằng chứng launch). Không cần lần chạy DEBROOT thứ hai.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn; Chromium cùng pha PASS đã là đối chứng đủ).
- **Harness 15'33"** (18:14:06–18:29:39Z) — nhanh nhất kể từ đợt 169 do 0 timeout (171: 53'21" với 3 kẹt; 170: 29'24" với 1 kẹt; 169: 15'30"; 168: 15'29"; 167: 16'14").

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT (ĐÚNG — 0 KẸT THẬT) + LIVE-DIAG 0 + (1c') 0 KÍCH HOẠT (0 FP, 0 BỎ LỠ)

- **Watchdog (i): 0 kích hoạt — ĐÚNG.** 0 dòng `WATCHDOG-137` trong 6 log pha (0 kẹt thật để bắt). 0 false-positive.
- **Driver (1b) live-diag: 0 kích hoạt — ĐÚNG.** 0 dòng `LIVE-DIAG-172` trong summary; `live_diags=0` ở cả 6 pha (0 log im lặng >120 s). 0 snapshot stall.
- **(1c') fresh-content: 0 kích hoạt — ĐÚNG, 0 FALSE-POSITIVE, 0 BỎ LỠ.** (c') giữ nguyên diag-only đợt này; log 85m4 WebKit sạch (19 dòng HB128, maxspan=5 s — xem §C); kẹt 84l10/86n2 không có đợt này nên (c') không có gì để bắt ngoài phạm vi. Không có false-positive → **(c') ĐƯỢC GIỮ** theo quyết (i) đợt 171 (chỉ quyết lại khi có FP) — NHƯNG T8 đã trình đề xuất sửa điều kiện (f) theo giao quyết (i) đợt 171 (xem §C + §9 mục 6).
- 0 snapshot stall đợt này (đúng — 0 kẹt).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–171 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–172) + đường ổn định `t8-diag-stall.sh` → 172 (CẢ HAI symlink cập nhật 17:40Z, TRƯỚC mọi lần chạy) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt ĐÚNG, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT OAN KHI KHÔNG CÓ KẸT.** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy, cách nhau ≥240 s (MỚI 142, GIỮ NGUYÊN 143–172) | 6 lần chạy harness; `live_diags=0` ở cả 6 pha | **0 kích hoạt — ĐÚNG, KHÔNG LOG NÀO IM LẶNG >120 s** |
| (1c') Kiểm "nội dung tươi" (c') | **GIỮ NGUYÊN diag-only đợt này** (quyết (i) đợt 171; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 lần chạy harness (chỉ 85m4 có HB128); `live_diags=0` ở 85m4 (bộ đếm chung (1b)+(1c')) | **0 kích hoạt — 0 FP, 0 BỎ LỠ. (c') ĐƯỢC GIỮ (xem §C). Đề xuất sửa (f) đã trình (replay-f-fix-172t8.py).** Replay sau harness: C5.1 ĐẠT (kẹt-164 TRIGGER 125 s; 0 FP trên 8 log sạch thật 163/165/166/167/168/169/170/172; kẹt-171 ghi đúng là BỎ LỠ — xem F-171-T8-7 đã sửa nhãn) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-172t8.sh` (cột `balloon_kb`) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=5.120.500 max=5.896.528 (91,5% trần) mean=5.529.727; avail min=478 MB @18:21:36Z (trong cửa sổ WebKit 86n2 — KHÔNG kẹt) / max 1.661 MB — xem F-172-T8-4 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 18:23:17Z), 85m4 PASS (exit 0, 18:25:33Z), 86n2 PASS (exit 0, 18:29:39Z)** | N cộng dồn **N=34 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161/162/163/164/165/166/167/168/169/170/171/172 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline đã lưu lúc bắt đầu; 0 snapshot stall) | 0 snapshot stall đợt này (đúng — không có kẹt) |

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

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi so với đợt 171 (đều là bản copy, không chạm script repo): nhãn log `LIVE-DIAG-171` → `LIVE-DIAG-172`, `FRESH-CONTENT-171` → `FRESH-CONTENT-172`, lock `t8-round171` → `t8-round172`, deadline waiter 16:30Z → **19:30Z 22/11** (kiểm lại epoch 1795375800 bằng `date -d`), nhãn `T8-171` → `T8-172` trong o8-driver + selfcheck-postboot, WAIT1 trong extract sửa đúng boot lúc mở `4b9db449` (F-155-T8-6). **Không có thay đổi driver mới đợt này về (1c')** — (c') giữ nguyên theo quyết (i) đợt 171; replay script sửa nhãn entry log 171 thành `171-ket-85m4` (KHÔNG còn gắn nhãn "sạch" sai bản chất — sửa F-171-T8-7) + thêm entry log 172; script mới `replay-f-fix-172t8.py` trình đề xuất sửa (f) (xem §C).
- Script trích số liệu `extract-172t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (đọc đủ 1 log waiter đợt này: 28 poll GATE-NOT-YET + GATE-FOUND poll 29 lúc 18:09:40Z, 0 WAIT-DEADLINE, 0 REBOOT trong log; postboot=1 trong 19 dòng — TẤT CẢ cho boot `4b9db449`).
- Script replay (1c') `replay-1c-172t8.py` (cập nhật từ 171: thêm entry log 171-ket + 172-sạch, kết luận kiểm cả 9 log — xem §C).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round172` 18:13:52Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 18:29:39Z).
- Waiter #81 thoát sau GATE-FOUND poll 29 lúc 18:09:40Z (exit 0 — cho boot `4b9db449`; 0 process waiter còn lại lúc kiểm cuối).
- Kiểm cuối ~18:35Z (bằng script trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót của T8: **0**; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 102 cooldown — 100 sau prune 46 của T6-171 + cooldown-t8-round171 + cooldown-t8-round172, đúng mẫu đợt 150–172; prune lần 47 thuộc T6-172); boot `4b9db449` ổn định (btime 1795366925 không đổi từ 17:02:05Z — 0 reboot trong phiên; 1 reboot #81 TRƯỚC khi đợt mở).
- `/tmp/.X11-unix/` lúc mở TRỐNG; lúc kiểm cuối TRỐNG (0 file, 0 lock file — X194/X195 đã được T8 dọn tay 18:11:13Z sau khi xác minh mồ côi: 0 process giữ fd, 0 Xvfb; socket của chính T8 (:188 O8-WebKit, :197 O8-Chromium, :199 harness) đã được driver tự unlink).
- Fixture /tmp: rebuild lần 1 trên #81 (md5 khớp); kiểm cuối sau harness vẫn khớp.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt (replay + repair là của T5/hệ thống — T8 chỉ đọc); không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN BOOT `4b9db449` (#81)** — boot sau reboot #81 lúc 17:02:05Z, là boot lúc đo (không đổi boot trong phiên O8+harness). T4 chạy attempt1 trên #81 (lượt yên #41 HỢP LỆ — TRÊN CÙNG BOOT ĐO); O8 + harness chạy trên #81. **Chuỗi WebKit FULL PASS T8 ĐỀ XUẤT LÊN 24, KHÔNG TỰ CHỐT** (lượt yên hợp lệ cùng boot + gate (a) FOUND — xem §A; T10/parent phán cuối; **caveat: gate (a) mode repair-sớm, không phải replay-đầy-đủ — xem F-172-T8-5**). Số hiệu #81 đã được T0-172 xác minh 9/9 nguồn (gap #80→#81 = 9.064 s).
2. **Harness 6/6 + 0 KẸT — kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 0 → 1.** Đợt sạch đầu tiên kể từ đợt 169 (166, 167, 168, 169 sạch → chuỗi 4; 170 ĐỨT về 0; 171 giữ 0; 172 lên 1). Đừng gộp verdict pha con với verdict pha, và đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `4b9db449` theo repair sớm của T5 (libs 6/6 + GST 269 plugin qua symlink, T5 poll1 PASS GST) + selfcheck T8 (6/6 lib + dpkg 795 + cache 110 + lists 75) + POSTBOOT_PASS 17:50:32Z mode repair-sớm. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness (standard driver, không LD_LIBRARY_PATH) trên cùng boot đo (xem §A) — **đợt này harness PASS 6/6 nên bằng chứng là đầy đủ**. **Nhãn đã ghi ĐÚNG ngay từ đầu đợt này — không lặp lỗi nhãn sai đợt 162.**
4. **POSTBOOT_PASS cho boot đo `4b9db449` ĐÃ CÓ (17:50:32Z, T5, poll=1, mode repair-sớm-quyết-h)** — khác đợt 171 (#80 replay-đầy-đủ) và đợt 169 (#78 KHÔNG CÓ) và đợt 166 (#71 KHÔNG CÓ). Gate FOUND qua đường (a) lúc 18:09:40Z (poll 29). Đừng trích POSTBOOT_PASS #80 (14:52:09Z, cho `2acdd1ab`) hay bất kỳ cờ boot cũ nào là gate cho boot đo. **Caveat mode xem F-172-T8-5.**
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=32, max 91,5% trần) — avail min 478 MB @18:21:36Z (trong cửa sổ WebKit 86n2 — KHÔNG kẹt); nhưng avail lúc bắt đầu các pha WebKit còn 1.181–1.653 MB — avail rơi LÀ HỆ QUẢ trong lúc chạy dài, không phải điều kiện đầu; giao T9 đối chiếu với sampler của họ (T9 đo cả phiên) — chỉ là tương quan, H1/H2 đã bác bỏ nên không dùng làm bằng chứng nguyên nhân; giao T9 đối chiếu (chuỗi ghim trần phán bằng sampler T9).
6. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–172 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **Chuỗi verdict ĐỔI CHIỀU đợt này (do PASS đầy đủ): 85m4 P4-lần3 PASS trở lại (chuỗi mới từ 1 — chuỗi 11 lần DỨT ở đợt 171); 86n2 P4-lần3 PASS (điểm kẹt 165 sạch trở lại sau tái diễn đợt 171); 86n2 P5-entry PASS trở lại (chuỗi mới từ 1 — không có verdict đợt 171); 86n2 P4-lần2 PASS (chuỗi verdict 22 → 23); 86n2 P2-entry PASS lần thứ mười bốn liên tiếp.** H3 vẫn mở, chỉ giám sát thụ động (xem §B). Điều tra riêng 84l10 MỞ đợt đầu (xem §D).
8. **84l10 E4 ended=true CẢ HAI engine đợt này** (WebKit ct cuối=4, restart 3→3; Chromium ct cuối=4, restart 6→6) — dứt chuỗi ended=false: Chromium 4 đợt (168, 169, 170, 171) và WebKit 3 đợt (167, 168, 169 — 170/171 WebKit không có verdict E4). Script verdict vẫn PASS cho cả hai; đừng trích ended thành FAIL (xem F-172-T8-4).
9. **T8 ĐÓNG TRONG hạn cờ ~20:00Z (~18:40Z)** — gate FOUND 18:09:40Z; O8 xong 18:13:52Z; harness xong 18:29:39Z (15'33" — nhanh nhất kể từ đợt 169 do 0 timeout).
10. **1 reboot liên quan đợt (#81 TRƯỚC khi đợt mở 33m46s)** — số hiệu #81 đã được T0-172 xác minh 9/9 nguồn (gap #80→#81 = 9.064 s; marker sống qua 33 reboot #49–#81); (m) #81 ỨNG VIÊN DƯƠNG (requeue +33,477 s — thuộc T2-172 + parent, xem cờ T0); mù cho boot mới giao T2-172 (theo quyết (s) đợt 158); INSIDE #81 giao T2-172 (dải FULL127/FULL128 — chuỗi MỚI từ #73 đã ĐỨT tại #80, chuỗi mới bắt đầu từ đâu nếu #81 INSIDE?).
11. **(1c') GIỮ NGUYÊN diag-only đợt này, 0 kích hoạt, 0 false-positive, 0 bỏ lỡ** — replay C5.1 ĐẠT (RUNSPAN TRIGGER đúng 125 s trên log kẹt 164; 0 FP trên 8 log sạch thật 163/165/166/167/168/169/170/172); log kẹt-171 ghi đúng là BỎ LỠ (không gắn nhãn "sạch" nữa — sửa F-171-T8-7). **Đề xuất sửa (f) đã trình ở §C — parent quyết đợt 172, T8 không tự sửa.**
12. **Fixture h/g md5 KHỚP kỳ vọng đợt 125** (rebuild lần 1 trên #81; kiểm cuối sau harness vẫn khớp). Giả thuyết "giá trị đứng" ở F-163-T8-1 vẫn SAI — đừng dùng md5 h/g làm fingerprint ổn định.
13. **Chromium 85m4 P5 CÓ-RESTART (+1) đợt này** (40 s, ended-at-duration) — lần thứ hai liên tiếp (171, 172); verdict script vẫn KHÔNG FAIL (ok=true). **Chromium 86n2 P5 0 restart đợt này** (40 s, extraEvents=[]) — giống đợt 169/170/171. Ghi nhận để T10 đối chiếu, không đổi verdict pha hay verdict đợt. **Chromium 84l10 W1-lần1 delta=+2** (artifact bắn lặp do ghi đè ended còn bật — xem F-172-T8-4); lần2/3 delta=+1; verdict vẫn PASS.

## 8. Sai số mới (F-172-T8-N)

- **F-172-T8-1 — COPY DRIVER 171→172: cp -a BÁO LỖI PRESERVE OWNERSHIP (EPERM) NHƯNG NỘI DUNG + BIT +x CÒN NGUYÊN — LỆNH GHÉP DỪNG Ở && NÊN PHẢI DỌN RIÊNG.** `cp -a round171-t8 round172-t8` trả exit 1 với hàng loạt `cp: failed to preserve ownership ... Operation not permitted` (các thư mục smoke/stall-*, o8-chromium/chrome-userdata, o8-webkit, o8-probe, scratch) — nội dung file vẫn copy đủ, bit +x giữ nguyên trên toàn bộ .sh (kiểm `ls -l`: rwxrwx--- cả 7 script). Nhưng vì lệnh ghép dùng `&&`, exit 1 làm các bước `ls` + `rm -rf` dọn scratch cũ KHÔNG chạy — T8 phát hiện và chạy dọn riêng bằng lệnh tuyệt đối sau đó (không file nào lọt sai chỗ). Bài học đứng (nối F-171-T8-10): sau `cp -a`, kiểm exit code theo NỘI DUNG (diff/ls) chứ không theo exit code; và luôn dọn bằng đường dẫn tuyệt đối trong lệnh riêng, không ghép sau `&&` của cp. Không có điểm stale nào lọt vào chạy (waiter deadline đúng 19:30Z; extract đọc đúng 1 log waiter; diag symlink đúng 172 lúc kiểm cuối; replay đã sửa nhãn entry 171-ket).
- **F-172-T8-2 — SELFCHECK "GST PLUGINS 0" LÀ ARTIFACT ĐO — BINARY gst-inspect-1.0 VẮNG (gstreamer1.0-tools CHƯA CÀI TRONG REPLAY THIẾU), KHÔNG PHẢI PLUGIN VẮNG.** Selfcheck #1 (17:40:45Z) và #2 (18:10:45Z) đều báo `GST plugins 0` — vì `gst-inspect-1.0` không tồn tại (`/usr/bin/gst-inspect-1.0: No such file or directory`, gstreamer1.0-tools chưa cài — dpkg.log chỉ 795 dòng, replay thiếu). Thư mục plugin THẬT có đủ: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` là symlink (tạo 17:41Z, T5 repair) → debroot, 269 file; T5 poll1 (17:50:32Z) PASS GST (đủ isomp4 + libav). **Harness PASS 6/6 là bằng chứng thật plugin đủ — đừng trích "GST 0" trong selfcheck thành "thiếu plugin".** Từ nay selfcheck phải kiểm `which gst-inspect-1.0` trước khi kết luận số plugin; nếu binary vắng thì ghi "không đo được", không ghi 0.
- **F-172-T8-3 — SOCKET X11 MỚI X194/X195 (MTIME 17:45) — T8 ĐÃ DỌN, /tmp/.X11-unix TRỐNG LÚC KIỂM CUỐI.** Lúc mở (17:38Z) `/tmp/.X11-unix/` TRỐNG; trước O8 (18:11:13Z) xuất hiện X194/X195 (mtime 17:45Z — trong phiên làm việc của T1-172; T0-172 giao T8 dọn trong cờ của họ). T8 xác minh mồ côi TRƯỚC khi dọn (fuser: 0 process giữ fd cả 2 socket; ps: 0 Xvfb/MiniBrowser/WebKit/Chromium) rồi `rm -f` cả 2 — cùng thủ tục F-170-T1-3/F-171-T8-8. Kiểm cuối ~18:35Z: `/tmp/.X11-unix/` TRỐNG (socket của chính T8 — :188 O8-WebKit, :197 O8-Chromium, :199 harness — driver tự unlink). Không có socket mới nào sau khi dọn.
- **F-172-T8-4 — CHROMIUM 84l10 W1-LẦN1 DELTA=+2 (ARTIFACT BẮN LẶP — VERDICT VẪN PASS) + E4 ended=true CẢ HAI ENGINE, DỨT CHUỖI ended=false.** W1-lần1 PASS delta=+2 (0→2); W1-lần2 PASS delta=+1 (2→3); W1-lần3 PASS delta=+1 — NHƯNG có khoảng nhảy 3→4 giữa lần2 và lần3 (một restart dư ngoài vòng ép — cùng họ artifact ghi đè ended còn bật, xem F-171-T8-5). Script verdict vẫn PASS cả ba lần (hạ-cánh-về-target=true, errors=0). **Cùng mẫu đợt 169/170/171** (Chromium W1-lần1/2 delta=+2); WebKit đợt này W1-lần1/2/3 đều delta=+1 sạch. Ghi nhận để T10 đối chiếu (artifact của chính script test trên Chromium, không phải kẹt hay lỗi app); không đổi verdict pha hay verdict đợt. **E4 ended=true cả hai engine đợt này** (WebKit ct cuối=4, restart 3→3; Chromium ct cuối=4, restart 6→6) — dứt chuỗi ended=false: Chromium 4 đợt (168, 169, 170, 171) và WebKit 3 đợt (167, 168, 169; 170/171 WebKit không có verdict E4). Script verdict vẫn PASS; đừng trích ended thành FAIL.
- **F-172-T8-5 — POSTBOOT_PASS #81 MODE REPAIR-SỚM-QUYẾT-h, KHÔNG PHẢI REPLAY-ĐẦY-ĐỦ — GATE (a) FOUND NHƯNG CÓ CAVEAT CHO CHUỖI O8.** POSTBOOT_PASS viết 17:50:32Z, poll=1, mode repair-sớm-quyết-h (theo quyết (h) đợt 150: watcher repair sớm ở boot+15' nếu replay vắng): dpkg.log 795 dòng (replay đầy đủ các đợt trước: 1.545), cache 110 .deb, lists 75; thư mục GST là symlink → debroot (ephemeral — mất khi debroot đổi/xóa, khác thư mục thật 269 file của replay đầy đủ); libs 6/6 đủ theo T5 poll1 (PASS libs + PASS GST isomp4/libav + PASS apt 11 package). **Gate (a) FOUND là đúng theo thủ tục (cờ T5 chứa boot đo) — nhưng chân gate này YẾU HƠN các đợt replay-đầy-đủ (167/168/170/171).** T8 đề xuất chuỗi LÊN 24 kèm caveat rõ ràng (xem §A); nếu parent cho rằng repair-sớm không đủ chuẩn cho chân gate thì chuỗi GIỮ 23. T5-172 theo dõi: replay hệ thống có chạy tiếp cho đủ 1.545 dòng không, hay dừng ở repair sớm (giao T5-172/T10-172).
- **F-172-T8-6 — (c') LIVE 0 KÍCH HOẠT TRÊN ĐỢT SẠCH — ĐÚNG, NHƯNG ĐÂY LÀ ĐỢT SẠCH THỨ 8 LIÊN TIẾP KHÔNG CÓ CA KẸT ĐỂ (c') CHỨNG MINH.** (c') giữ nguyên diag-only; live 0 kích hoạt, 0 FP, 0 bỏ lỡ (không có kẹt thật nào trong phạm vi (c') đợt này). Replay C5.1 ĐẠT trên 8 log sạch thật + TRIGGER đúng 125 s trên kẹt-164. **Lưu ý:** bằng chứng "0 FP" đợt này là trên log sạch thật (không phải log kẹt gắn nhãn sai như đợt 171 — đã sửa nhãn, xem §C); bằng chứng "(c') bắt được kẹt thật" vẫn chỉ có 1 ca duy nhất (kẹt-164, đợt 164) + 1 ca bỏ lỡ (kẹt-171) — đề xuất sửa (f) ở §C là để ca thứ hai này không lặp lại.
- **F-172-T8-7 — TINH CHỈNH NHÃN CALL-SITE ĐIỀU TRA 84l10: :457 LÀ EVALUATE SAMPLE ĐẦU TIÊN CỦA VÒNG E4, KHÔNG PHẢI "E4-SETUP" THEO NGHĨA HẸP (xem §D).** Nhãn watchdog lấy từ stack trace (tên hàm + số dòng nơi gọi `ev()`): dòng 457 `const s = await ev(page, STATE_FN);` nằm TRONG vòng lặp `while (Date.now() - t4 < 25000)` của E4 — SAU khi setupProject (dòng 451) + startPlaying đã xong. Nhãn "E4-setup :457" trong LIMITS 171 + quyết (i) đợt 171 là gọi theo vùng (E4) chứ không phải đúng bước setup. Tương tự: :433 là evaluate sample đầu tiên của vòng W2 (sau setup evaluate :425 + sleep(300) + kiểm s2 đã xong); :425 mới đúng là evaluate setup của W2. Ba điểm kẹt ghi đúng: 157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425 — 2/3 là evaluate sample đầu tiên của vòng quan sát phát tự nhiên, 1/3 là evaluate setup bắt đầu phát tự nhiên. T10 ghi nhận tinh chỉnh này khi trích đợt 171 (§D).
- **F-172-T8-8 — CỜ T4 VIẾT NHANH HƠN ĐỢT 171 (~5' SAU KHI POLLER THOÁT, SO VỚI ~17' ĐỢT 171) + ATTEMPT1 HỢP LỆ NGAY, KHÔNG ATTEMPT NHIỄM.** T4 attempt1-4b9db449 hợp lệ ngay (20/20, B 5/5, median 46,0 ms), poller thoát 18:03:19Z; cờ `round172-t4.done` viết 18:08Z — trễ 4m41s (đợt 171: poller thoát 15:12:00Z → cờ 15:29:08Z, trễ 17m08s). Ngân sách dùng 1/3 (đợt 171: 3/3, attempt1/2 nhiễm tải). Gate (poll-wait của T4) mở poll #25 17:59:27Z qua đường (a) — ĐÂY LÀ poll của T4 (postboot), khác GATE-FOUND poll 29 lúc 18:09:40Z của waiter T8 (T4 flag + postboot) — đừng nhầm hai mốc. Ghi nhận để T10 đối chiếu (không phải lỗi T8; tải nhiễm attempt1/2 đợt 171 nhiều khả năng từ các luồng khác chạy song song đầu đợt — đợt này T4 attempt1 chạy sau khi apt replay xong nên sạch).
- **F-172-T8-9 — TIẾN TRÌNH KIỂM TRA TIẾN ĐỘ NỀN (sleep 1200) BỊ T8 KILL SAU KHI HARNESS XONG — KHÔNG ẢNH HƯỞNG CHẠY.** T8 đặt một lệnh `sleep 1200` nền để kiểm tra tiến độ harness sau 20 phút; harness xong sớm (15'33") nên T8 kill tiến trình đó (SIGTERM) trước khi nó kịp chạy phần kiểm tra. Lệnh đó chỉ đọc file summary (grep/tail), không chạm lock/vite/process chạy — không ảnh hưởng kết quả harness. Bài học: đặt sleep-check ngắn hơn thời gian chạy kỳ vọng, hoặc bỏ hẳn khi driver đã tự log đầy đủ.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 23 → 24? (T8 ĐỀ XUẤT: LÊN 24 — CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `4b9db449` (#81, T0-172 xác minh 9/9 nguồn), lượt yên #41 hợp lệ TRÊN CÙNG BOOT ĐO (attempt1-4b9db449, median 46,0 ms) VÀ gate cho boot đo FOUND qua đường (a) (POSTBOOT_PASS 17:50:32Z). T0-172 cũng đề xuất LÊN 24 (có điều kiện). Tiền lệ đợt 157: chuỗi lên dù cùng đợt harness có kẹt — đợt này harness 6/6 sạch nên không có caveat harness. **Caveat duy nhất: gate (a) mode repair-sớm, không phải replay-đầy-đủ (F-172-T8-5) — nếu parent cho rằng mode này không đủ chuẩn cho chân gate thì chuỗi GIỮ 23; T8 ghi rõ cả hai hướng (xem §A).**
2. **Harness 6/6 + 0 kẹt — kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 0 → 1.** Đợt sạch đầu tiên kể từ đợt 169. 85m4 P4-lần3 PASS trở lại (chuỗi mới từ 1); 86n2 P4-lần3 PASS (điểm kẹt 165 sạch trở lại sau tái diễn đợt 171); 86n2 P4-lần2 PASS (chuỗi verdict 22 → 23); 86n2 P5-entry PASS trở lại (chuỗi mới từ 1).
3. **Điều tra riêng 84l10 — MỞ ĐỢT ĐẦU (T8 chủ trì), phạm vi theo quyết (i) đợt 171 (xem §D).** Đợt này 84l10 PASS đầy đủ nên chưa có điểm dữ liệu kẹt mới — hồ sơ 3 điểm kẹt cũ đã củng cố + tinh chỉnh nhãn (F-172-T8-7). **KHÔNG gộp 85m4-P4 / 86n2-P4-lần3** (theo dõi riêng; bên nào kẹt lần thứ ba theo đường của mình thì mở điều tra riêng — đợt này cả hai đều PASS nên chưa đủ điều kiện).
4. **(m) #81 ỨNG VIÊN DƯƠNG (theo cờ T0-172) — thuộc T2-172 + parent phân loại.** Requeue eid 10137 btime +33,477 s, TRONG band [33; 49,8], chỉ cách biên dưới 0,477 s; run 171 sống tại btime. (m) #80 KHÔNG PHẢI ĐIỂM (quyết (e) đợt 171); (m) #56 vẫn có điều kiện (lần 15 — giao T2-172).
5. **Đối chứng Chromium cùng pha: N cộng dồn N=34 mỗi pha** (đợt 137/139/141–172 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
6. **(1c') GIỮ NGUYÊN diag-only đợt này — 0 kích hoạt, 0 FP, 0 bỏ lỡ → ĐƯỢC GIỮ. Đề xuất sửa điều kiện (f) — T8 ĐÃ TRÌNH (xem §C), parent quyết đợt 172.** Phương án chính (f'): miễn (f) khi run paused+seeking liên tục ≥300 s — replay: kẹt-171 bắt được ở 305 s, kẹt-164 vẫn 125 s, 0 FP trên 8 log sạch. Phương án dự phòng (f''): miễn (f) khi watchdog đã kích hoạt — kẹt-171 bắt ở 125 s, nhưng ghép hai kênh chẩn đoán. **T8 KHÔNG tự sửa (f) đợt này.**
7. **Lượt yên #41 CÓ LƯỢT HỢP LỆ — chuỗi lên 36** (attempt1-4b9db449 20/20, B 5/5, median 46,0 ms; P1 143/146, P2 137/137, P3-A1 123/146, P3' 108/118 occ = 96/100 distinct-seq, P7 70/70; ngân sách dùng 1/3; không attempt nhiễm). **F-172-T8-8: cờ T4 viết nhanh hơn đợt 171 (~5' sau poller thoát)** — ghi nhận, không nhắc.
8. **Reboot #81 (btime 17:02:05Z, boot `4b9db449`) TRƯỚC khi đợt mở 33m46s — T0-172 ĐÃ XÁC MINH 9/9 nguồn** (gap #80→#81 = 9.064 s; marker sống qua 33 reboot #49–#81); mù cho boot mới giao T2-172 (theo quyết (s) đợt 158); INSIDE #81 giao T2-172 (dải FULL127/FULL128 — chuỗi MỚI từ #73 đã ĐỨT tại #80, chuỗi mới bắt đầu từ đâu nếu #81 INSIDE?).
9. **RAM avail min 478 MB (trong cửa sổ WebKit 86n2 — KHÔNG kẹt) + balloon max 91,5% — chờ T9 đối chiếu** (F-172-T8-4); chuỗi ghim trần phán bằng sampler T9 (giao T10). **Avail thấp một mình không gây kẹt — H1 vẫn BÁC BỎ** (giao T9).
10. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-172 xác nhận số lần — lần thứ 26 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; POSTBOOT_PASS #81 mode repair-sớm (T5-172 theo dõi replay có chạy tiếp cho đủ không — xem F-172-T8-5); E-175 đang ghim — kết cục thuộc T9-172; prune lần 47 (T6-172); T2-172: không chạy script phân tích nặng trong cửa sổ attempt (nhắc lại sau F-171-T2-1); T4-172: không chạy script phân tích nặng trong cửa sổ attempt + nhắc T5 không probe dpkg trong cửa sổ attempt; u2net là fallback chính thức.
11. **1 reboot liên quan đợt (#81 TRƯỚC khi đợt mở 33m46s)** — số hiệu #81 đã được T0-172 xác minh 9/9 nguồn; (m) #81 ứng viên dương giao T2-172; INSIDE #81 giao T2-172 (dải FULL127/FULL128).

---

# §C — KIỂM "NỘI DUNG TƯƠI" (1c') — (c') GIỮ NGUYÊN DIAG-ONLY ĐỢT 172, 0 FALSE-POSITIVE, 0 BỎ LỠ + TRÌNH ĐỀ XUẤT SỬA ĐIỀU KIỆN (f) (QUYẾT (i) ĐỢT 171 GIAO T8-172)

## C1. Thiết kế (c') đã duyệt (quyết (A') đợt 166 §12.3(i) — triển khai đợt 167, giữ nguyên đợt 168 theo quyết (i) đợt 167, giữ nguyên đợt 169 theo quyết (i) đợt 168, giữ nguyên đợt 170 theo quyết (i) đợt 169, giữ nguyên đợt 171 theo quyết (i) đợt 170, giữ nguyên đợt 172 theo quyết (i) đợt 171)

- **(c') thay (c):** trong vòng poll của `run_one`, lấy toàn bộ chuỗi liên tiếp (trailing run) các dòng HB128 **cùng tag + cùng playhead + cùng ct** kết thúc ở dòng mới nhất; kích hoạt khi `elapsed mới nhất − elapsed đầu chuỗi ≥ 120 s` VÀ chuỗi dài ≥3 dòng VÀ điều kiện (e)/(f) trên dòng mới nhất (playing=true khi có trường này; nếu không có thì seeking=false; paused=false và seeking=false khi các trường này có).
- **Không đổi:** ngưỡng 120 s; ngân sách chung với (1b) ≤2 lần/lần chạy, cách nhau ≥240 s; diag-only (chỉ ghi log chẩn đoán + gọi diag-stall, không can thiệp chạy, không đổi verdict/timeout); vị trí code (driver copy trong hidden_files, không chạm script repo); phạm vi chỉ 85m4 (script duy nhất có HB128).
- **Giữ nguyên đợt này:** helper `check-fresh-172t8.py` (bản copy 171, chỉ đổi nhãn) + khối kiểm FRESH-CONTENT trong `run_one` của CẢ HAI driver (run-webkit + run-chromium) — không sửa logic; kiểm chứng offline lại trước harness (xem C2).

## C2. Kiểm chứng offline TRƯỚC harness (helper check-fresh, chạy ~17:41Z)

| Log | HB128 | check-fresh-172t8.py |
|---|---|---|
| 164-kẹt 85m4 | 174 dòng (P4-lần2 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.267 ct=0.267) | **TRIGGER elapsed=125 s** (ts 19:38:13.174Z, run 5 s→125 s, 25 dòng, span=120 s) |
| 163-sạch 85m4 | 20 dòng | OK maxspan=5 s |
| 165-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 166-sạch 85m4 | 20 dòng | OK maxspan=5 s |
| 167-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 168-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 169-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 170-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 171-kẹt 85m4 | 174 dòng (P4-lần1 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.2 ct=0.2) | OK maxspan=811 s — **BỎ LỠ đã biết (guard (f) chặn — xem §C4)** |
| 164/165-86n2 | 0 dòng | OK maxspan=0 s |
| (file vắng) | — | OK maxspan=0 s (không crash) |

- Helper KHỚP replay RUNSPAN đợt 171 từng dòng (cùng elapsed kích hoạt 125 s, cùng max span 5 s trên log sạch) — hai triển khai độc lập của cùng ngữ nghĩa (c') cho cùng kết quả; bản 172 chỉ đổi nhãn, không đổi logic.

## C3. Replay sau harness (replay-1c-172t8.py, chạy ~18:32Z — thêm log 171-ket + 172-sạch)

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
| **171-kẹt 85m4 (LOG KẸT — xem chú thích)** | **174 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 811 s) — (c') BỎ LỠ** |
| **172-sạch 85m4** | **19 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 5 s)** |
| 164/165-86n2 | 0 dòng | KHÔNG kích hoạt (không có dòng) | KHÔNG kích hoạt (không có dòng) |

- **Chú thích bắt buộc cho dòng 171 (SỬA NHÃN SAI đợt 171 — F-171-T8-7):** entry này trong replay đợt 171 mang tên `171-sach-85m4` theo quy ước đặt tên (log 85m4 của đợt hiện tại), NHƯNG log 171 là **log KẸT thật** (P4-lần1 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.2 ct=0.2) — "KHÔNG kích hoạt" ở đây là **(c') BỎ LỠ kẹt thật**, KHÔNG phải "log sạch pass". Đợt này entry được đổi tên thành `171-ket-85m4` cho đúng bản chất. Max run span 811 s (tag `waitForPlaySync P4-lần1`, elapsed=816 s, run_len=163, playhead=0.2 ct=0.2) — gấp 6,8× ngưỡng 120 s — nhưng cả 163 dòng đều có `paused=true seeking=true` nên điều kiện (f) chặn.
- **Tiêu chí C5.1 — RUNSPAN: ĐẠT.** Kẹt-164 kích hoạt ĐÚNG elapsed=125 s (khớp dự đoán C3 "≈125 s"); sạch-163/165/166/167/168/169/170/172 đều KHÔNG kích hoạt (max run span 5 s — biên 24× so với ngưỡng 120 s). **0 false-positive trên 8 log sạch thật.**
- **Chạy thật đợt này: FRESH-CONTENT-172 = 0 kích hoạt trong 6 pha — 0 FP, 0 BỎ LỠ.** Log 85m4 WebKit đợt này sạch (19 dòng HB128, maxspan=5 s) — không có kẹt thật nào trong phạm vi (c') để bắt hay để lỡ. Kẹt 84l10/86n2 không có đợt này. **(c') ĐƯỢC GIỮ** (không có FP → không cần quyết lại theo quyết (i) đợt 171).
- Lưu ý: max run span 5 s trên log sạch đến từ 2 dòng liên tiếp cùng tag `sampleFor P5-phaseB-long` với playhead=30 ct=30 (elapsed 35 s→40 s) — playhead dừng ở cuối video trong P5, nhưng chỉ 2 dòng / span 5 s, xa ngưỡng 120 s (biên 24×). Đây là hành vi bình thường cuối P5, không phải kẹt.
- Lưu ý phạm vi: (c') chỉ có HB128 ở 85m4 — 0 kích hoạt ở 84l10/86n2 là ĐÚNG theo thiết kế.

## C4. ĐỀ XUẤT SỬA ĐIỀU KIỆN (f) — T8-172 TRÌNH, PARENT QUYẾT ĐỢT 172 (KHÔNG TỰ SỬA)

**Vấn đề (F-171-T8-7, nhắc lại):** kẹt thật 85m4 đợt 171 (P4-lần1, đóng băng 816 s, 163 dòng HB128, playhead=0.2 ct=0.2 KHÔNG ĐỔI, elapsed 5→816 s, span 811 s = 6,8× ngưỡng 120 s) KHÔNG kích hoạt (c') vì cả 163 dòng đều có `paused=true seeking=true playing=true` → điều kiện (f) (paused=false, seeking=false) chặn. Watchdog (i) đã bắt được kẹt này (15:56:03Z) nên việc phát hiện không mất ở tầng harness — nhưng kênh (c') mù đúng ca nó được thiết kế để bắt: 1 false-negative đúng phạm vi.

**Bằng chứng đo được (replay-f-fix-172t8.py — script mới đợt này, chỉ đọc log gốc):**

| Log | HB128 | Tổ hợp (playing, paused, seeking) | Max run paused+seeking liên tục |
|---|---|---|---|
| 164-kẹt 85m4 | 174 dòng | (true,false,false): 163 dòng; (None,None,false): 11 dòng | 0 s |
| 171-ket-85m4 | 174 dòng | (true,true,true): 163 dòng; (None,None,false): 11 dòng | **811 s** (run 163 dòng, elapsed 5→816 s) |
| 163-sạch | 20 dòng | (None,None,false): 19; (true,true,false): 1 | 0 s |
| 165-sạch | 19 dòng | (None,None,false): 19 | 0 s |
| 166-sạch | 20 dòng | (None,None,false): 19; (true,false,false): 1 | 0 s |
| 167/168/169/170/172-sạch | 19 dòng mỗi log | (None,None,false): 19 | 0 s |

- Điểm mấu chốt: **không log sạch nào có dù chỉ 1 giây run paused+seeking liên tục** (max = 0 s trên cả 8 log sạch) — trong khi run kẹt 171 có tới 811 s. Seek bình thường xong trong vài giây (đồng bộ element trong P4: 0,5–1,9 s; seek dài nhất đo được trong P5 các đợt sạch: 0 mẫu); một seek kẹt hàng trăm giây là bệnh lý theo cấu trúc, không phải seek bình thường. (e) vẫn thỏa trên run kẹt 171 (playing=true cả 163 dòng) — chỉ (f) chặn.

**Các phương án ứng viên (chỉ đánh giá offline — KHÔNG sửa driver đợt này):**

| Phương án | Nội dung | Kẹt-164 | Kẹt-171 | FP trên 8 log sạch | Đánh giá |
|---|---|---|---|---|---|
| V0 = (c') hiện tại (đối chứng) | Giữ nguyên (f) | TRIGGER @125 s | KHÔNG (bỏ lỡ) | 0 | KHÔNG ĐẠT (lỡ 1 kẹt thật) |
| **V1 (f') T_seek=180 s** | Miễn (f) khi run paused+seeking liên tục ≥180 s | TRIGGER @125 s | **TRIGGER @185 s** | 0 | ĐẠT — phát hiện sớm nhất trong họ V1 |
| **V1 (f') T_seek=300 s — PHƯƠNG ÁN CHÍNH T8 ĐỀ XUẤT** | Miễn (f) khi run paused+seeking liên tục ≥300 s | TRIGGER @125 s | **TRIGGER @305 s** | 0 | **ĐẠT — cân bằng: ngưỡng = 2,5× ngưỡng gốc 120 s; biên an toàn vô hạn trên dữ liệu quan sát (0 s trên log sạch vs 300 s ngưỡng); seek thật không bao giờ kéo dài phút** |
| V1 (f') T_seek=600 s | Miễn (f) khi run paused+seeking liên tục ≥600 s | TRIGGER @125 s | TRIGGER @605 s | 0 | ĐẠT — an toàn nhất nhưng phát hiện muộn (605 s, gần timeout 900 s) |
| V2 (f'') watchdog-corroborated | Miễn (f) khi watchdog (i) ĐÃ kích hoạt cho cùng pha trước thời điểm dòng hiện tại | TRIGGER @125 s | **TRIGGER @125 s** | 0 | ĐẠT — phát hiện sớm nhất tuyệt đối; NHƯNG ghép hai kênh chẩn đoán (c')+(i): nếu logic watchdog đổi thì (c') đổi theo; cần đọc dòng WATCHDOG-137 trong cùng log (phức tạp hơn V1) |
| V3 (f''') kênh riêng seeking≥300 s | Trigger riêng khi run seeking=true liên tục ≥300 s (bất kể paused) | TRIGGER @125 s | TRIGGER @305 s | 0 | ĐẠT — tương đương V1-300 về kết quả, nhưng là kênh song song thay vì nới (f) (nhiều code hơn, hai ngưỡng) |

**Đề xuất của T8 (trình parent, không tự quyết):**
1. **Chấp nhận phương án chính V1 (f') với T_seek = 300 s, triển khai từ đợt 173** (sửa duy nhất trong `cond_ef()` của helper check-fresh + khối FRESH-CONTENT trong `run_one`: thêm điều kiện "hoặc run paused+seeking liên tục hiện tại đã ≥300 s" để miễn (f); (e) giữ nguyên; ngưỡng 120 s, run_len ≥3, ngân sách diag chung với (1b) giữ nguyên; vẫn diag-only).
2. Nếu parent muốn phát hiện sớm hơn và chấp nhận ghép kênh: chọn V2 (f'') thay cho V1 (kẹt-171 bắt ở 125 s thay vì 305 s).
3. Nếu parent chưa muốn sửa: (c') giữ nguyên V0 — chấp nhận (c') tiếp tục mù với ca kẹt paused+seeking (đã xảy ra 1 lần trong 2 ca kẹt 85m4 gần nhất: 164 bắt được, 171 bỏ lỡ).
4. Dù chọn phương án nào: replay kiểm chứng lại sau khi triển khai (kẹt-164 @125 s + kẹt-171 @ngưỡng mới + 0 FP trên các log sạch) trước khi coi là xong — theo đúng thủ tục C5.1.

---

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT ĐẦU (T8 CHỦ TRÌ; QUYẾT (i) ĐỢT 171; T10-172 GHI PHẠM VI VÀO AGGREGATE 172 §11)

## D1. Phạm vi điều tra (parent chốt đợt 171)

- **Phạm vi = 84l10 qua 3 điểm kẹt** (157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425 — 3 call-site khác nhau, cùng vùng W2/E4, cùng script `clicktest-84l10-webkit-loop-w1.mjs` md5 `b8c08a7c` không đổi).
- **KHÔNG gộp 85m4-P4 / 86n2-P4-lần3 vào điều tra này** (chữ ký khác nhau — 85m4 là đóng băng waitForPlaySync với HB128, 86n2 là điểm kẹt đợt 165 tái diễn — theo dõi riêng cho T8; bên nào kẹt lần thứ ba theo đường của mình thì mở điều tra riêng).
- **Chủ trì: T8-172 (đợt đầu).** Đợt này 84l10 PASS đầy đủ nên chưa có điểm dữ liệu kẹt mới — công việc đợt đầu là củng cố hồ sơ 3 điểm kẹt cũ + tinh chỉnh nhãn + đặt câu hỏi mở (xem D2–D4).

## D2. Hồ sơ 3 điểm kẹt (bằng chứng gốc — đọc từ log + script, không suy diễn)

| Đợt | Boot | Điểm kẹt (nhãn watchdog = hàm:dòng nơi gọi `ev()`) | Code tại call-site (script md5 `b8c08a7c`) | Dòng log cuối trước khi im lặng | Watchdog + probe |
|---|---|---|---|---|---|
| 157 | `bcbaa3ad` (btime 21:05:15Z 20/11) | **runEngine:457 — evaluate sample ĐẦU TIÊN của vòng E4** | Dòng 457 `const s = await ev(page, STATE_FN);` trong `while (Date.now() - t4 < 25000)` của E4 — SAU khi setupProject (dòng 451) + startPlaying đã xong | W2 PASS 22:37:05.719Z; setup E4 22:37:06.436Z | 22:38:10.683Z evaluate >60 s; probe 1+1 TIMEOUT 30 s 22:38:40.692Z |
| 170 | `5df1871f` (#79, btime 11:11:05Z) | **runEngine:433 — evaluate sample ĐẦU TIÊN của vòng W2** | Dòng 433 `const s = await ev(page, STATE_FN);` trong `while (Date.now() - t2 < 70000)` của W2 — SAU khi evaluate setup :425 + sleep(300) + kiểm `s2` đã xong | W1-lần3 PASS 12:12:24.742Z | 12:13:28.907Z evaluate >60 s; probe 1+1 TIMEOUT 30 s 12:13:58.913Z |
| 171 | `2acdd1ab` (#80, btime 14:31:01Z) | **runEngine:425 — evaluate SETUP của W2** | Dòng 425 `await ev(page, '(async () => { const s = await (STORE_FN); s.setPlayhead(0); if (!s.playing) s.togglePlay(); })()')` — evaluate đầu tiên của W2, TRƯỚC mọi sample W2 | W1-lần3 PASS 15:38:34.286Z | 15:40:04.444Z evaluate >60 s; probe 1+1 TIMEOUT 30 s 15:40:34.468Z |

- **Tinh chỉnh nhãn (F-172-T8-7):** :457 là evaluate sample đầu tiên của vòng E4 (sau setup), KHÔNG phải "E4-setup" theo nghĩa hẹp; :433 là evaluate sample đầu tiên của vòng W2 (sau setup); chỉ :425 mới đúng là evaluate setup. Nhãn "E4-setup :457" trong LIMITS 171 + quyết (i) đợt 171 là gọi theo vùng (E4), T8 ghi đúng lại ở đây: **157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425**.
- **Nhãn watchdog lấy từ stack trace:** `ev()` (dòng ~105–125 script) lấy frame đầu tiên ngoài `ev`/`evalDiag137` làm `site = tên-hàm:số-dòng` — nên `runEngine:425/433/457` là ĐÚNG call-site trong `runEngine`, không phải dòng trong `ev()`.

## D3. Điểm chung + điểm khác (đã xác minh)

**Điểm chung (cả 3 ca):**
- Chữ ký: evaluate chết (>60 s im lặng) + probe 1+1 TIMEOUT 30 s ("kênh evaluate kẹt cùng / page JS chết") + timeout 900 giết process (exit 124) + WebKit-only (Chromium cùng pha PASS cả 3 đợt).
- Vị trí: đều là evaluate ĐẦU TIÊN sau khi test bước vào (hoặc sắp bước vào) giai đoạn quan sát phát tự nhiên — W2 (phát tự nhiên trọn clip 30 s) hoặc E4 (phát tự nhiên clip 4 s cuối timeline). Không ca nào kẹt trong W1 (pha ép restart có chủ đích, với nhiều evaluate liên tiếp đều sống) hay trong setupProject.
- Script không đổi (md5 `b8c08a7c` cả 3 đợt); boot khác nhau cả 3 đợt (không phải flake theo boot); vite còn sống lúc watchdog (HTTP 200); RSS process kẹt GIẢM trong lúc kẹt (171: WebKitWebProcess 302.680 → 196.572 KB) — process kẹt không tự ăn thêm RAM (H3-D1 bác bỏ).
- Tần suất: 3 kẹt / 15 đợt gần nhất có chạy 84l10 (157, 170, 171) ≈ 20% mỗi đợt cho pha này; W1 chưa từng kẹt.

**Điểm khác:**
- 157 kẹt MUỘN nhất trong pha (sau khi W2 PASS trọn vẹn, tới E4); 170 kẹt GIỮA (setup W2 xong, sample đầu tiên chết); 171 kẹt SỚM nhất (ngay evaluate setup W2, W2/E4 không có verdict).
- 171 kẹt ở evaluate `setPlayhead(0)+togglePlay` (thao tác đổi trạng thái media); 157/170 kẹt ở evaluate `STATE_FN` thuần đọc trạng thái (không đổi trạng thái).
- Đợt 172 (đợt đầu điều tra): 84l10 PASS đầy đủ (W1 +1/+1/+1, W2 PASS, E4 PASS ended=true) — điểm kẹt KHÔNG tái diễn; hồ sơ 3 ca vẫn đứng nguyên, chưa có ca thứ tư.

## D4. Câu hỏi mở + hướng thăm dò tiếp theo (chưa có câu trả lời — giao các đợt sau)

- **Q1 — Thủ phạm là chuyển trạng thái hay vòng poll?** 171 kẹt ở evaluate đổi trạng thái (setPlayhead+togglePlay); 157/170 kẹt ở evaluate đọc trạng thái đầu vòng poll. Hai họ khác nhau hay cùng một nguyên nhân (kênh evaluate chết đúng lúc media pipeline chuyển trạng thái)? Cần ca thứ tư để phân biệt — hoặc probe chủ đích (chạy riêng vòng W2 nhiều lần trên cùng boot để tăng mẫu).
- **Q2 — Lib hệ thống hay engine?** Harness chạy bằng system libs (không LD_LIBRARY_PATH); O8 chạy bằng DEBROOT libs và luôn PASS. Probe phân biệt sạch nhất: **chạy harness 84l10 một lần dưới LD_LIBRARY_PATH DEBROOT** (như O8) — nếu PASS thì nghiêng về lib hệ thống; nếu vẫn kẹt thì nghiêng về engine WebKitGTK. Chưa chạy đợt này (cần quyết parent/T10 vì đổi biến môi trường của harness chuẩn).
- **Q3 — Trạng thái media element lúc chết?** 84l10 không có HB128 nên không biết paused/seeking/ct lúc chết (khác 85m4 có HB128 đóng băng làm bằng chứng). Probe: **thêm heartbeat nhẹ vào vòng W2/E4 của 84l10** (theo mẫu HB128 của 85m4) — cần quyết parent/T10 vì sửa script test (md5 đổi, cần ghi rõ).
- **Q4 — Có phải race giữa evaluate và GStreamer seek/play?** Cả 3 ca đều ở điểm chuyển sang phát tự nhiên (sau setPlayhead/togglePlay hoặc ngay khi playback bắt đầu). Giả thuyết cần kiểm: evaluate `STATE_FN` gọi đúng lúc media element đang seek/play-transition thì kẹt trong WebKitGTK (IPC/GStreamer). Chưa có bằng chứng trực tiếp — chỉ là tương quan thời điểm.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ tư (ca mới), ghi ngay call-site + dòng log cuối + RSS chuỗi + đối chiếu Q1 (setup hay sample-loop); nếu PASS tiếp 2–3 đợt, hồ sơ giữ nguyên, không vội kết luận "đã hết kẹt" (tần suất ~20% nên 2–3 đợt sạch là trong kỳ vọng).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 172 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 + (p) đợt 156 + (i) đợt 157 + (i) đợt 158 + (i) đợt 159 + (h) đợt 160 + (h) đợt 161 + (h) đợt 162 + (h) đợt 163 + (h) đợt 164 + (i) đợt 165 + (i) đợt 166 + (i) đợt 167 + (i) đợt 168 + (i) đợt 169 + (i) đợt 170 + (i) đợt 171) — 0 KẸT MỚI, H3 VẪN MỞ, CHỈ GIÁM SÁT THỤ ĐỘNG

## B1. Trạng thái giả thuyết sau đợt 172 (H3 vẫn mở — 0 kẹt mới)

| Giả thuyết | Trạng thái đợt 171 | Trạng thái đợt 172 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** — avail min 478 MB @18:21:36Z trong cửa sổ WebKit 86n2 KHÔNG kẹt; avail lúc bắt đầu các pha WebKit 1.181–1.653 MB, cao hơn avail-min 247 MB đợt 170 (khi có 1 kẹt) và 252 MB đợt 171 (khi có 3 kẹt) |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** — 0 kẹt đợt này nên không có cửa sổ kẹt để đối chiếu; avail rơi trong lúc chạy dài (1.661 → 478 MB) mà không kẹt |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — 3 kẹt mới đợt 171 | **VẪN MỞ — 0 KẸT MỚI đợt này (harness 6/6 PASS)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153, 170, 171) | **BÁC BỎ (đứng nguyên — không có ca kẹt mới để kiểm lại; bằng chứng đợt 171 vẫn đứng)** |

- Đợt 172 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p)/(i): **0 kẹt trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt).
- **Điều kiện mở điều tra H3 KHÔNG đạt:** theo quyết (i) đợt 158, điều kiện là 85m4 P4-lần3 tái diễn lần 3 — đợt này 85m4 P4-lần3 PASS (chuỗi mới từ 1). **Riêng 84l10: điều tra riêng ĐÃ MỞ đợt đầu (xem §D) — H3 tổng vẫn chỉ giám sát thụ động.**

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 172

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–172) + đường ổn định `t8-diag-stall.sh` → 172 (CẢ HAI symlink cập nhật 17:40Z; kiểm cuối vẫn trỏ 172) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt ĐÚNG, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt thật để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–172) | 6 lần chạy harness; `live_diags=0` ở cả 6 pha | **0 kích hoạt — ĐÚNG, KHÔNG LOG NÀO IM LẶNG >120 s** |
| (1c') Kiểm "nội dung tươi" (c') | **GIỮ NGUYÊN diag-only đợt này** (quyết (i) đợt 171; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 lần chạy harness (chỉ 85m4 có HB128); `live_diags=0` ở 85m4 | **0 kích hoạt — 0 FP, 0 BỎ LỠ. (c') ĐƯỢC GIỮ (xem §C). Đề xuất sửa (f) đã trình.** |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=5.120.500 max=5.896.528 (91,5% trần) mean=5.529.727; avail min=478 MB @18:21:36Z (trong cửa sổ WebKit 86n2 — KHÔNG kẹt); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 18:23:17Z), 85m4 PASS (exit 0, 18:25:33Z), 86n2 PASS (exit 0, 18:29:39Z)** | N cộng dồn **N=34 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline đã lưu lúc bắt đầu; 0 snapshot stall) | 0 snapshot stall đợt này (đúng — không có kẹt) |

## B3. Chữ ký kẹt — đợt 172: 0 KẸT (đợt sạch đầu tiên kể từ đợt 169)

| Trường | 84l10 | 85m4 | 86n2 |
|---|---|---|---|
| Pha / script | WebKit 84l10, `clicktest-84l10-webkit-loop-w1.mjs` (md5 `b8c08a7c`, không đổi) | WebKit 85m4, `clicktest-85m4-webkit-w7-hb128.mjs` (md5 `610ee003`, không đổi) | WebKit 86n2, `clicktest-86n2-webkit-w7.mjs` (md5 `628088bd`, không đổi) |
| Thời gian | 18:14:09–18:15:20Z (exit 0) | 18:15:35–18:17:46Z (exit 0) | 18:18:01–18:22:01Z (exit 0) |
| Kết quả | W1-lần1/2/3 PASS (+1/+1/+1), W2 PASS (playhead cuối=30), E4 PASS (ended=true, ct=4) | P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 0 restart | P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 0 restart |
| Đối chứng | Chromium 84l10 cùng pha PASS — không phân biệt WebKit/Chromium đợt này | Chromium 85m4 cùng pha PASS (P5 CÓ-RESTART +1) | Chromium 86n2 cùng pha PASS (P5 0 restart) |
| RAM lúc chạy | Avail 1.653 MB lúc bắt đầu → 1.536 MB lúc xong | Avail 1.471 MB lúc bắt đầu → 1.249 MB lúc xong | Avail 1.181 MB lúc bắt đầu → 999 MB lúc xong; avail-min toàn harness 478 MB @18:21:36Z trong cửa sổ pha này |
| Vite | HTTP 200 trong lúc chạy (vite còn sống); 000 sau release | HTTP 200 trong lúc chạy | HTTP 200 trong lúc chạy |
| Tiền lệ | Đợt 157/170/171: 84l10 kẹt ở 3 điểm khác nhau (xem §D) — đợt này PASS đầy đủ, điểm kẹt không tái diễn | Đợt 164: 85m4 kẹt ở P4-lần2; đợt 171: kẹt ở P4-lần1 — đợt này PASS đầy đủ | Đợt 165: 86n2 kẹt ở P4-lần3; đợt 171: tái diễn — đợt này PASS đầy đủ |
