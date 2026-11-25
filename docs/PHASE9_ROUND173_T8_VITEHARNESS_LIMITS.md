# Đợt 173 T8 — (f') V1 ĐÃ TRIỂN KHAI + KIỂM LẠI (kẹt-171 @305 s, kẹt-164 @125 s, 0 FP) + Q3 HEARTBEAT 84l10 ĐÃ TRIỂN KHAI (W2 6 tick, E4 0 tick — đúng thiết kế) + HARNESS 6/6 SẠCH, 0 KẸT (KẸT CỘNG DỒN GIỮ 20; CHUỖI "P3 KHÔNG KẸT" 1 → 2); O8 T8 PASS 3/3 TRÊN BOOT #84 — NHƯNG CHUỖI WEBKIT FULL PASS GIỮ 24 (KHÔNG CÓ LƯỢT YÊN HỢP LỆ TRÊN BOOT ĐO: T4 0 ATTEMPT; GATE HẾT HẠN)

Ngày: 22/11/2026 (lượt cron 03:35 +07 23/11 = 20:35:51Z 22/11; T8 mở ~20:39Z, đóng ~23:13Z — **TRỄ hạn cờ ~23:00Z ~13' (do reboot #85 lúc 22:59:36Z trong lúc viết LIMITS — phải sửa lại số liệu đóng sổ; ghi rõ theo quyết (l) đợt 152), TRONG hạn cứng ~23:30Z**). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) **TRIỂN KHAI (f') V1** theo quyết (i) đợt 172 — miễn (f) khi run paused+seeking liên tục ≥300 s — trong helper `check-fresh-173t8.py` (code live trong driver) + kiểm lại bằng chính helper trên 10 log gốc và bằng replay độc lập (xem §C); (2) **TRIỂN KHAI Q3**: heartbeat HB128 nhẹ vào vòng W2/E4 của 84l10 theo mẫu 85m4 + ghi thêm trường `seeking` vào sample W2/E4 — script repo đổi md5 `b8c08a7c` → `baaa13c0`, 32.680 → 34.880 B (vẫn dưới giới hạn push 37.768 B) — chạy 84l10 sau sửa trong harness: **PASS đầy đủ, heartbeat W2 chạy đúng 6 tick** (xem §D); (3) O8 Chromium + WebKit 21/21 (WebKit ×2) — **PASS 3/3 trên boot `4ae2d2ea` (#84, CHƯA xác minh 9 nguồn — số hiệu chờ T0-174)**, nhưng **chuỗi WebKit FULL PASS GIỮ 24 — KHÔNG TĂNG** (xem §A — không có lượt yên hợp lệ trên boot đo: T4 0 attempt cả lượt; gate hết hạn 22:30Z); (4) harness đứng — MỘT lần chạy driver duy nhất, **WebKit 3/3 + Chromium 3/3: 6/6 PASS, 0 KẸT** (đợt sạch thứ hai liên tiếp sau đợt 172); (5) **ĐIỀU TRA RIÊNG 84l10 — ĐỢT 2** (xem §D — 84l10 PASS đầy đủ lần thứ hai liên tiếp, chưa có ca kẹt mới; Q3 đã triển khai xong); (6) H3: VẪN MỞ, chỉ giám sát thụ động — 0 kẹt mới; (7) **Checklist (o) đợt 173** (xem §E — từng mục F-172 đã thực hiện/báo kết quả); (8) **3 REBOOT trong phiên** (xem §1 — #83 btime 20:25:47Z TRƯỚC khi T8 mở 14' và #84 btime 21:01:15Z GIỮA PHIÊN, sau khi T0 đóng cờ; #85 btime 22:59:36Z LÚC ĐÓNG, trong lúc viết LIMITS — boot lúc đóng là #85).
Nợ: docs/PHASE9_ROUND172_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 trên boot #81, chuỗi lên 24 theo quyết (b) đợt 172; harness 6/6 sạch; (1c') giữ nguyên + trình đề xuất sửa (f); điều tra riêng 84l10 mở đợt đầu).

## 0. Kết luận ngắn — (f') + Q3 ĐÃ TRIỂN KHAI VÀ KIỂM CHỨNG XONG; HARNESS 6/6 SẠCH; O8 T8 PASS 3/3 NHƯNG CHUỖI GIỮ 24

- **(f') V1 ĐÃ TRIỂN KHAI TRONG CODE LIVE (không còn là đề xuất).** Helper `check-fresh-173t8.py` (driver gọi mỗi poll 10 s khi log có HB128) nay miễn (f) khi trailing sub-run paused+seeking liên tục ≥300 s; (e) giữ nguyên; ngưỡng 120 s, run_len ≥3, ngân sách diag chung với (1b) giữ nguyên; vẫn diag-only. **Kiểm lại bằng CHÍNH helper đã triển khai trên 10 log gốc: kẹt-164 TRIGGER @125 s (span_seek=0 s — qua (f) thường), kẹt-171 TRIGGER @305 s (span_seek=300 s — qua (f')), 0 FP trên 8 log sạch thật (163/165/166/167/168/169/170/172, maxspan=5 s).** Replay độc lập `replay-f-fix-173t8.py` khớp từng số (V1-300: 164@125 s, 171@305 s, 0 FP). **Chạy thật đợt này: FRESH-CONTENT-173 = 0 kích hoạt trong 6 pha — ĐÚNG (0 kẹt thật; log 85m4 sạch 19 dòng HB128 maxspan=5 s; log 84l10 mới có HB128: check-fresh OK maxspan=0 s — không FP từ Q3).** V2 (f'') vẫn giữ làm dự phòng, KHÔNG triển khai.
- **Q3 ĐÃ TRIỂN KHAI + CHỨNG MINH KHÔNG VỠ TEST.** Script `clicktest-84l10-webkit-loop-w1.mjs`: thêm `hbStart` (y hệt mẫu HB128 của 85m4, tick 5 s, chạy trên event loop Node) + heartbeat vào vòng W2 và E4 + thêm trường `seeking` vào sample W2/E4 (để heartbeat báo đúng trạng thái media lúc chết — đúng mục đích Q3). `node --check` OK. **Chạy thật: WebKit W2 6 tick HB128 (5/10/15/20/25/30 s, playhead 4.367→29.333, seeking=false playing=true — tiến triển đều) + W2 PASS + E4 PASS; Chromium W2 5 tick + W2/E4 PASS.** E4 0 tick cả hai engine — ĐÚNG thiết kế (vòng E4 khỏe chỉ ~4–5 s, tick 5 s chưa kịp bắn; khi kẹt thì vòng không thoát, tick sẽ bắn liên tục với state cuối cùng đã biết — đúng giá trị chẩn đoán của Q3). md5 `b8c08a7c` → `baaa13c0`, 32.680 → 34.880 B (vẫn dưới 37.768 B).
- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (22:32:07–22:34:48Z, 2'41", boot `4ae2d2ea` = #84 CHƯA xác minh, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 22:32:25.133Z + 22:33:18.858Z, Playwright mouse click lần 2; Chromium: 22:34:17.881Z, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid 28907/29392/29774, md5 03561009/073ce61c/428e80d4). **KHÁC BỘ T0: T0-173 O8 trên boot #83 WebKit FAIL ×2 (exit=2, S1 FAIL + Target crashed, probe kết luận RENDERER CHẾT — PAGE-CRASH) + Chromium PASS — bộ T8 trên boot #84 PASS sạch. Hai bộ khác boot nên không mâu thuẫn; T10 đối chiếu.**
- **Chuỗi WebKit FULL PASS: GIỮ 24 — KHÔNG TĂNG (T8 KHÔNG đề xuất tăng).** O8 T8 pass 21/21 ×2 trên boot `4ae2d2ea`, VÀ gate (a) cho boot đo CÓ (POSTBOOT_PASS 21:27:05Z, repair-sớm, poll=1), NHƯNG **không có lượt yên hợp lệ nào trên boot đo: T4 0 attempt cả lượt** (poller chạy tới poll #75+, gate0=T5 từ 21:27Z, 0 blocker, nhưng không attempt nào bắt đầu; cờ `round173-t4.done` VẮNG lúc T8 đóng; waiter hết hạn 22:30:01Z poll 88 — xem §A). Thiếu chân (1) nên chuỗi không thể tăng dù O8 pass. **T8 chạy O8 + harness SAU waiter hết hạn theo đúng thủ tục quyết (i) đợt 143 (T4 0 attempt lúc hết hạn → được chạy, ghi rõ).**
- **Harness (MỘT lần chạy driver duy nhất, boot `4ae2d2ea` #84): WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (22:36:33–22:52:03Z, 15'30" — nhanh như đợt 172 do 0 timeout): WebKit 84l10 **PASS đầy đủ** (W1-lần1/2/3 PASS +1/+1/+1 sạch, W2 PASS playhead cuối=30, E4 PASS ended=true ct cuối=4 — lần thứ hai liên tiếp sau đợt 172); WebKit 85m4 **PASS** (P1/P2/P3 + P4-lần1/2/3 +1, P5 PASS 40 s **0 restart** — **P4-lần3 PASS lần thứ hai liên tiếp, chuỗi mới = 2**); WebKit 86n2 **PASS** (P1/P2/P3 + P4-lần1/2/3 +1, P5 PASS 40 s **0 restart** — **P4-lần2 verdict 23 → 24**). Chromium 84l10/85m4/86n2 PASS. **Kẹt cộng dồn GIỮ 20. Chuỗi "P3 không kẹt" 1 → 2** (đợt sạch thứ hai liên tiếp sau khi ĐỨT ở đợt 170). Chromium đối chứng N=34 → **N=35 mỗi pha**, 0 kẹt.
- **Watchdog (i): 0 kích hoạt — ĐÚNG (0 kẹt thật). Live-diag (1b): 0 kích hoạt — ĐÚNG (0 log im lặng). (1c') với (f') mới: 0 kích hoạt live — ĐÚNG (0 FP trên log sạch chạy thật, kể cả log 84l10 mới có HB128).** 0 snapshot stall. RAM sampler n=32: balloon max 91,6% trần, 0 mẫu ghim; avail min **488 MB @22:45:30Z** (trong cửa sổ Chromium 84l10 — KHÔNG kẹt: avail thấp một mình không gây kẹt). **Lưu ý ngoài sampler: lúc selfcheck #3 (22:31:50Z, TRƯỚC harness) balloon = 6.443.824 kB = ĐÚNG TRẦN + avail 449 MB — ghim trần quan sát được ngoài cửa sổ sampler (giao T9 đối chiếu với sampler của họ; chuỗi ghim trần phán bằng sampler T9).**
- **2 reboot TRƯỚC/GIỮA phiên + 1 reboot LÚC ĐÓNG (xem §1 — #83 btime 20:25:47Z TRƯỚC khi T8 mở 14' và #84 btime 21:01:15Z GIỮA PHIÊN, sau khi T0 đóng cờ; #85 btime 22:59:36Z SAU harness, trong lúc T8 viết LIMITS — boot lúc đóng là #85, CHƯA xác minh).** Waiter lần 1 chết theo reboot; T8 khởi động lại waiter lần 2 cho boot mới (log lần 1 đã lưu `wait-t4-t5-bootdd08464a.log`, 16 poll). Fixture /tmp MẤT theo reboot #84 — rebuild lần 2 trên #84 (md5 khớp). **X11: socket X193/X194/X195 (T0 giao T8 dọn) đã BIẾN MẤT theo reboot #84 — `/tmp/.X11-unix/` TRỐNG lúc kiểm, không còn gì để dọn (xem F-173-T8-3).**
- **T8 ĐÓNG ~23:13Z — TRỄ hạn cờ ~23:00Z ~13' (do reboot #85 lúc 22:59:36Z trong lúc viết LIMITS — phải sửa lại số liệu đóng sổ cho đúng, ghi rõ theo quyết (l) đợt 152), TRONG hạn cứng ~23:30Z** (gate hết hạn 22:30:01Z; O8 xong 22:34:48Z; harness xong 22:52:03Z; trích số xong ~22:54Z; reboot #85 22:59:36Z — sau harness, trong lúc viết LIMITS).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 20:25:47 22/11 | REBOOT #83 (boot `dd08464a`, btime 1795379147) — TRƯỚC khi đợt mở 14' (T0-173 xác minh 9/9 nguồn; gap #82→#83 = 5.099 s) |
| 20:35:51 | Đợt 173 mở (lượt cron 03:35 +07 23/11) |
| ~20:39 | T8 mở: đọc LIMITS T8-172 + GAP §101 + aggregate 172 §10.5/§11/§12.3; cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 172 (không đổi); fixture /tmp MẤT theo reboot #83; `/tmp/.X11-unix/` TRỐNG lúc mở (0 socket) |
| 20:40–20:45 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round173-t8/diag-stall-173t8.sh`, readlink + test -x + test -e xác nhận** |
| ~20:41 | **Copy driver 172→173 (cp -a, exit 1 do EPERM preserve ownership như F-172-T8-1 — nội dung + bit +x còn nguyên) + đổi nhãn + dọn scratch cũ bằng lệnh riêng (đường dẫn tuyệt đối)** |
| ~20:42 | **TRIỂN KHAI (f') V1 trong `check-fresh-173t8.py`** (tách cond_e/cond_f + `span_seeking()` ≥300 s; docstring ghi rõ quyết (i) đợt 172); **kiểm lại bằng chính helper: kẹt-164 @125 s, kẹt-171 @305 s, 0 FP trên 8 log sạch** + replay độc lập `replay-f-fix-173t8.py` khớp từng số |
| ~20:43 | **TRIỂN KHAI Q3 trong `clicktest-84l10-webkit-loop-w1.mjs`** (hbStart + heartbeat W2/E4 + trường `seeking` vào sample; `node --check` OK; md5 `b8c08a7c` → `baaa13c0`, 34.880 B) |
| 20:45:40 | **Selfcheck #1 trên #83: libs 1/6 (chỉ libevent); GST plugins 0 (binary gst-inspect-1.0 VẮNG — artifact F-172-T8-2, không kết luận plugin); dpkg.log 2; cache 178, lists 3; RAM avail 1.377 MB, balloon 4.824.096 kB** — replay chưa chạy |
| 20:46 | **Rebuild fixture /tmp lần 1 trên #83 (quy tắc (l)): hevc + i7 + h-30s/g-4s KHỚP kỳ vọng đợt 125 (`ba0c7c62`/`f05daed8`/`fbaa3d1a`/`a1fb8549`)** |
| 20:46:38 | Waiter lần 1 bắt đầu trên boot `dd08464a` (deadline 22:30Z); poll 1: t4=0 postboot=0 |
| 20:50:31 | **T0-173 O8 DONE trên #83: WebKit FAIL ×2 (exit=2; S1 FAIL + Target crashed; probe: RENDERER CHẾT — PAGE-CRASH) + Chromium PASS 21/21** (xem cờ T0 — chuỗi GIỮ 24 từ bộ T0) |
| ~20:54 | **T0-173 ĐÓNG CỜ: #83 XÁC NHẬN 9/9 nguồn; #82 XÁC NHẬN; run 172 SUCCEEDED 20:16:59Z trên #82 (margin 1.132 s); (m) #82 requeue +38,438 s TRONG dải (thuộc T2-173 + parent); (m) #83 KHÔNG PHẢI ĐIỂM; POSTBOOT_PASS #83 CHƯA CÓ; X11 X193/X194/X195 mồ côi — giao T8 dọn** |
| 21:01:15 | **REBOOT #84 (boot `4ae2d2ea`, btime 1795381275) GIỮA PHIÊN — T8 phát hiện 21:02:06Z (boot_id đổi; gap #83→#84 = 2.128 s); waiter lần 1 chết theo reboot (16 poll, GATE-NOT-YET); fixture /tmp MẤT; X193/X194/X195 biến mất theo reboot** |
| 21:02:58 | **Waiter lần 2 bắt đầu trên boot `4ae2d2ea` (deadline 22:30Z, giữ nguyên); log lần 1 đã lưu `wait-t4-t5-bootdd08464a.log` (F-155-T8-6)**; rebuild fixture lần 2 trên #84 (md5 khớp); selfcheck #2 trên #84: libs 1/6, dpkg 2, cache 0, lists 5, avail 2.344 MB |
| 21:16:43 | **T5 watcher-173b EARLY-REPAIR TRIGGER trên #84** (boot_age 928 s, frozen 882 s, dpkg 2 — verify form-B check-only exit=1) |
| 21:27:05 | **POSTBOOT_PASS #84 ĐÃ CÓ (T5, poll=1, mode repair-sớm-quyết-h — dpkg 795, cache 110, lists 75, GST 269)** — waiter chuyển postboot=1 từ poll 27 |
| 22:30:01 | **WAIT-DEADLINE 22:30Z poll 88 — GATE NOT MET (t4=0, postboot=1, t4attempt=no-lock; T4 0 attempt cả lượt)** — T8 chạy O8 + harness theo thủ tục quyết (i) đợt 143, ghi rõ |
| 22:31:50 | **Selfcheck #3 trên #84: libs 6/6 đủ; dpkg 795; cache 110, lists 75; RAM avail 449 MB, balloon 6.443.824 kB = ĐÚNG TRẦN (ghim — ngoài cửa sổ sampler, giao T9)** |
| 22:32:07–22:34:48 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #84** (xem §A) — SAU waiter hết hạn, TRÊN BOOT MỚI #84, gate (a) CÓ (repair-sớm) nhưng KHÔNG có lượt yên hợp lệ |
| 22:36:33–22:52:03 | **Harness (MỘT lần chạy driver duy nhất, boot `4ae2d2ea`): WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (xem §2) — 0 reboot giữa O8 và harness; boot #84 ổn định |
| ~22:54 | **Trích số liệu (extract-173t8.py) + replay (1c') trên log 173: C5.1 ĐẠT (0 FP trên 9 log sạch thật 163/165/166/167/168/169/170/172/173; kẹt-171 ghi đúng là BỎ LỠ theo V0 — đã bắt được bằng (f') mới, xem §C)** |
| 22:59:36 | **REBOOT #85 (boot `3c704685`, btime 1795388376) LÚC ĐÓNG — T8 phát hiện 23:08:15Z khi kiểm boot trước khi viết cờ (gap #84→#85 = 7.101 s; số hiệu #85 CHỜ T0-174 xác minh 9 nguồn; (m) #85 thuộc T2-174); marker mtime 2026-11-20 11:39:47.272154981Z KHÔNG ĐỔI — sống qua 37 reboot #49–#85 nếu #85 xác nhận; LIMITS + paths file + smoke log còn nguyên (lưu trên home, không mất theo reboot); fixture /tmp mất lần nữa (không cần rebuild — harness đã xong)** |
| ~23:10 | Cờ `round173-t8.done` (TRỄ hạn cờ ~23:00Z ~13' — do reboot #85 + sửa LIMITS; TRONG hạn cứng ~23:30Z) — kiểm boot lần cuối ngay trước khi viết cờ: boot `3c704685` (#85), btime 1795388376 = 22:59:36Z, không reboot mới sau #85 lúc viết cờ |

## A. O8 — PASS 3/3 trên boot `4ae2d2ea` (#84, CHƯA XÁC MINH), CHUỖI GIỮ 24 (KHÔNG CÓ LƯỢT YÊN HỢP LỆ TRÊN BOOT ĐO)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 22:32:07–22:33:07 | 0 | **21/21 PASS** — S1 PASS 22:32:25.133Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 22:33:08–22:33:57 | 0 | **21/21 PASS** — S1 PASS 22:33:18.858Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 22:33:57–22:34:48 | 0 | **21/21 PASS** — S1 PASS 22:34:17.881Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-22T22-32-07-4ae2d2ea-pid28907.json` 21 kết quả `ok=true` 21/21, md5 `03561009`; attempt2 `o8w-clicktest-report-2026-11-22T22-33-08-4ae2d2ea-pid29392.json` 21/21 `ok=true`, md5 `073ce61c` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-22T22-33-57-4ae2d2ea-pid29774.json` 21/21 `ok=true`, md5 `428e80d4`. Bản copy dự phòng của driver T8 khớp nội dung file stamped (cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep đầy đủ: PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- **NHÃN LIB ĐÚNG NGAY TỪ ĐẦU — O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (script O8 gốc tự đặt `LD_LIBRARY_PATH` với DEBROOT, driver cũng vậy — như đợt 162–173). Bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness chạy TRÊN CÙNG boot đo (#84) với POSTBOOT_PASS cho boot đo ĐÃ CÓ (21:27:05Z, mode repair-sớm) VÀ libs 6/6 theo selfcheck #3 — **và harness PASS 6/6, nên bằng chứng launch+pass bằng system libs đợt này là ĐẦY ĐỦ**.
- Driver O8 giữ 1 lock vite `t8-round173` suốt lượt (nhả 22:34:48Z; vite sau release curl 5560/5554 = 000000 — như đợt 162–172).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-173t8.mjs`, bản copy từ 172, chỉ đổi nhãn) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Gate cho boot đo `4ae2d2ea`: (a) CÓ — NHƯNG CHỈ MỘT CHÂN.** (a) POSTBOOT_PASS trong `round173-t5/` chứa boot `4ae2d2ea` (ghi 21:27:05Z, poll=1, mode repair-sớm-quyết-h: dpkg 795 dòng, cache 110, lists 75, GST 269; watcher-173b) — waiter chuyển postboot=1 từ poll 27 lúc ~21:28Z. Không cần đường (b). **NHƯNG cờ T4 VẮNG: `round173-t4.done` không tồn tại lúc T8 đóng; T4 0 attempt cả lượt** (poller T4 chạy tới poll #75+ lúc 21:58Z, gate0=T5 từ 21:27Z, 0 blocker, load ~0,1, RAM ~490 MB — nhưng không attempt nào bắt đầu; không lock t4 nào). Waiter hết hạn 22:30:01Z poll 88 (88 poll lần 2 + 16 poll lần 1 = 104 poll tổng, 0 GATE-FOUND, 0 REBOOT trong log lần 2).
- **Chuỗi WebKit FULL PASS: GIỮ 24 — KHÔNG TĂNG, T8 KHÔNG ĐỀ XUẤT TĂNG.** O8 pass 21/21 ×2 đợt này (trên boot `4ae2d2ea` #84), VÀ gate (a) CÓ, NHƯNG **chân (1) VẮNG: không có lượt yên hợp lệ nào trên boot đo** (T4 0 attempt — không có attempt nào để hợp lệ hay không hợp lệ). Đây là trường hợp khác đợt 169 (có lượt yên hợp lệ ở boot cũ + gate không FOUND → GIỮ) và đợt 166 (không có lượt yên hợp lệ + đổi boot + gate không FOUND → GIỮ): đợt này gate (a) CÓ nhưng lượt yên VẮNG HOÀN TOÀN. **T0-173 cũng GIỮ 24 từ bộ O8 của họ (WebKit FAIL ×2 trên #83) — hai bộ độc lập đồng thuận GIỮ 24.** T8 chạy O8 + harness sau waiter hết hạn theo đúng thủ tục quyết (i) đợt 143 (T4 0 attempt lúc hết hạn → được chạy, ghi rõ) — không phải tự ý phá thứ tự T4-trước/T8-sau: thứ tự đó đã không còn đối tượng để chờ (T4 không attempt).
- **O8 đợt này 2'41" tổng** (172: 2'32", 171: 2'37", 170: 2'36", 169: 2'40", 168: 2'36", 167: 3'01", 166: 2'59", 165: 2'37", 164: 3'02", 163: 3'07", 162: 2'37") — trong khung dao động các đợt gần đây, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: WEBKIT 3/3 + CHROMIUM 3/3, 6/6 PASS, 0 KẸT, 0 REBOOT GIỮA O8 VÀ HARNESS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 22:36:33–22:37:43 | **PASS** — W1-lần1/2/3 PASS (+1/+1/+1 sạch), W2 PASS (playhead cuối=30, tới cuối=true, restart tự nhiên Δ=0), E4 PASS (tới cuối=true, ended=true, ct cuối=4, restart 3→3) — **84l10 WebKit PASS trọn vẹn lần thứ hai liên tiếp (172, 173); Q3 heartbeat W2 6 tick chạy đúng (xem §D)** |
| 2 | WebKit 85m4 | 0 | 22:37:58–22:40:09 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** (extraEvents=[]) — **P4-lần3 PASS lần thứ hai liên tiếp (chuỗi mới = 2)** |
| 3 | WebKit 86n2 | 0 | 22:40:25–22:44:25 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** — **P4-lần2 verdict 23 → 24** |
| 4 | Chromium 84l10 | 0 | 22:44:40–22:45:41 | **PASS** — W1-lần1 PASS (+1), W1-lần2 PASS (+2 — artifact bắn lặp, xem F-173-T8-4), W1-lần3 PASS (+1), W2 PASS (playhead cuối=29.967), E4 PASS (ended=true, ct cuối=4, restart 6→6) — **Q3 heartbeat W2 5 tick chạy đúng** |
| 5 | Chromium 85m4 | 0 | 22:45:56–22:47:57 | **PASS** — P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** (report JSON ok=true, finishedAt 22:47:56.234Z) — **Chromium P5 0 restart trở lại sau 2 đợt CÓ-RESTART (171, 172)** |
| 6 | Chromium 86n2 | 0 | 22:48:12–22:52:03 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+2 — lần3 +2, xem F-173-T8-4), P5 PASS 40 s **0 restart** (report JSON ok=true, finishedAt 22:51:53.119Z) |

- 6 report JSON kiểm độc lập bằng python: 6× `ok=true` (finishedAt 22:37:41.346Z / 22:40:08.376Z / 22:44:19.863Z / 22:45:38.392Z / 22:47:56.234Z / 22:51:53.119Z).
- Môi trường: system libs trên boot `4ae2d2ea` (replay #84 CHƯA đầy đủ lúc mở — selfcheck #1/#2 libs 1/6; T5 watcher-173b repair sớm: libs 6/6 + GST symlink → debroot 269 plugin, T5 poll1 PASS GST; selfcheck T8 #3: 6/6 lib + dpkg 795 + cache 110 + lists 75; POSTBOOT_PASS cho boot đo ĐÃ CÓ 21:27:05Z mode repair-sớm). **WebKit launch + PASS THÀNH CÔNG bằng system libs** trên ĐÚNG boot đo (cả 3 pha đều chạy trọn vẹn — bằng chứng pass đầy đủ). Không cần lần chạy DEBROOT thứ hai.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn; Chromium cùng pha PASS đã là đối chứng đủ).
- **Harness 15'30"** (22:36:33–22:52:03Z) — như đợt 172 (15'33") do 0 timeout (171: 53'21" với 3 kẹt; 170: 29'24" với 1 kẹt; 169: 15'30"; 168: 15'29"; 167: 16'14").

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT (ĐÚNG — 0 KẸT THẬT) + LIVE-DIAG 0 + (1c') VỚI (f') MỚI 0 KÍCH HOẠT (0 FP, 0 BỎ LỠ)

- **Watchdog (i): 0 kích hoạt — ĐÚNG.** 0 dòng `WATCHDOG-137` trong 6 log pha (0 kẹt thật để bắt). 0 false-positive.
- **Driver (1b) live-diag: 0 kích hoạt — ĐÚNG.** 0 dòng `LIVE-DIAG-173` trong summary; `live_diags=0` ở cả 6 pha (0 log im lặng >120 s). 0 snapshot stall.
- **(1c') fresh-content với (f') V1 mới: 0 kích hoạt live — ĐÚNG, 0 FALSE-POSITIVE, 0 BỎ LỠ.** (f') đã triển khai (xem §C); log 85m4 WebKit sạch (19 dòng HB128, maxspan=5 s); log 84l10 WebKit mới có HB128 (6 dòng W2 + 0 dòng E4) — check-fresh OK maxspan=0 s (không FP từ Q3). Không có kẹt thật nào trong phạm vi (c') đợt này. **(c') + (f') ĐƯỢC GIỮ** (không có FP → không cần quyết lại; lần đầu (f') chạy live — 0 kích hoạt trên đợt sạch là đúng, chưa có ca kẹt paused+seeking để chứng minh live).
- 0 snapshot stall đợt này (đúng — 0 kẹt).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–172 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–173; 84l10 đã thêm Q3 heartbeat — không chạm `ev()`) + đường ổn định `t8-diag-stall.sh` → 173 (CẢ HAI symlink cập nhật 20:40Z, TRƯỚC mọi lần chạy) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt ĐÚNG, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT OAN KHI KHÔNG CÓ KẸT.** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy, cách nhau ≥240 s (MỚI 142, GIỮ NGUYÊN 143–173) | 6 lần chạy harness; `live_diags=0` ở cả 6 pha | **0 kích hoạt — ĐÚNG, KHÔNG LOG NÀO IM LẶNG >120 s** |
| (1c') Kiểm "nội dung tươi" (c') + (f') V1 MỚI | **(f') ĐÃ TRIỂN KHAI đợt này** (quyết (i) đợt 172; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 lần chạy harness (85m4 + 84l10 W2/E4 mới có HB128); `live_diags=0` ở 85m4/84l10 | **0 kích hoạt live — 0 FP, 0 BỎ LỠ. (c')+(f') ĐƯỢC GIỮ (xem §C).** Replay sau harness: C5.1 ĐẠT (kẹt-164 TRIGGER 125 s theo V0; 0 FP trên 9 log sạch thật 163/165/166/167/168/169/170/172/173) + kiểm lại (f') bằng chính helper: kẹt-171 @305 s (xem §C) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-173t8.sh` (cột `balloon_kb`) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=5.227.232 max=5.902.696 (91,6% trần) mean=5.582.299; avail min=488 MB @22:45:30Z (trong cửa sổ Chromium 84l10 — KHÔNG kẹt) / max 1.341 MB — xem F-173-T8-5 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 22:45:41Z), 85m4 PASS (exit 0, 22:47:57Z), 86n2 PASS (exit 0, 22:52:03Z)** | N cộng dồn **N=35 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161/162/163/164/165/166/167/168/169/170/171/172/173 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline đã lưu lúc bắt đầu; 0 snapshot stall) | 0 snapshot stall đợt này (đúng — không có kẹt) |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | **baaa13c0** | **CÓ — Q3 (f') không, Q3 heartbeat W2/E4 + trường `seeking` vào sample; 32.680 → 34.880 B, vẫn dưới 37.768 B** |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | 4994b4fc | 4994b4fc | Không (bản sửa T0-152 F-151-T10-2 còn nguyên) |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | c8acd72e | c8acd72e | Không (như trên) |

- T8 chỉ sửa 1 file repo duy nhất đợt này: `clicktest-84l10-webkit-loop-w1.mjs` (Q3 — quyết (i) đợt 172, parent CHẤP NHẬN). Driver trong hidden_files có thay đổi so với đợt 172: nhãn log `LIVE-DIAG-172` → `LIVE-DIAG-173`, `FRESH-CONTENT-172` → `FRESH-CONTENT-173`, lock `t8-round172` → `t8-round173`, deadline waiter 19:30Z → **22:30Z 22/11** (kiểm lại epoch bằng `date -d`), nhãn `T8-172` → `T8-173` trong o8-driver + selfcheck-postboot, WAIT1 trong extract sửa đúng boot lúc mở `dd08464a` (F-155-T8-6 — sau đó reboot #84 đổi boot, WAIT1 không còn dùng vì waiter lần 2 là log chính). **Thay đổi driver mới đợt này về (1c'): triển khai (f') V1 trong `check-fresh-173t8.py`** (xem §C) + cập nhật comment FRESH-CONTENT (84l10 nay cũng có HB128 từ Q3).
- Script trích số liệu `extract-173t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (đọc đủ 2 log waiter đợt này: lần 1 boot #83: 16 poll GATE-NOT-YET, 0 WAIT-DEADLINE, 0 REBOOT; lần 2 boot #84: 87 poll + WAIT-DEADLINE poll 88 lúc 22:30:01Z, 0 GATE-FOUND, 0 REBOOT trong log; postboot=1 trong 62 dòng — TẤT CẢ cho boot `4ae2d2ea`).
- Script replay (1c') `replay-1c-173t8.py` (cập nhật từ 172: thêm entry log 173-sạch, kết luận kiểm cả 10 log — xem §C); script replay (f') `replay-f-fix-173t8.py` (thêm entry 173-sạch — NO-FILE lúc chạy trước harness, có file sau harness; kết quả V1-300 không đổi).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round173` 22:34:48Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 22:52:03Z).
- Waiter lần 2 thoát sau WAIT-DEADLINE poll 88 lúc 22:30:01Z (exit 3 — cho boot `4ae2d2ea`; 0 process waiter còn lại lúc kiểm cuối; waiter lần 1 đã chết theo reboot #84).
- Kiểm cuối ~22:54Z (bằng script trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót của T8: **0**; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown — 100 sau prune 47 của T6-172 + cooldown-t8-round172 + cooldown-t8-round173, đúng mẫu đợt 150–173; prune lần 48 thuộc T6-173); boot `4ae2d2ea` ổn định TRONG O8+harness (btime 1795381275 không đổi từ 21:01:15Z — 1 reboot #84 GIỮA PHIÊN, 0 reboot trong lúc chạy). **SAU kiểm cuối: reboot #85 lúc 22:59:36Z (boot `3c704685`, btime 1795388376) — T8 phát hiện 23:08:15Z khi kiểm boot lần cuối trước khi viết cờ; đã sửa LIMITS cho đúng (xem §1 + F-173-T8-9); boot lúc viết cờ là #85, không reboot mới sau #85.**
- `/tmp/.X11-unix/` lúc mở TRỐNG; lúc kiểm cuối TRỐNG (0 file — X193/X194/X195 đã biến mất theo reboot #84, xem F-173-T8-3; socket của chính T8 — :188 O8-WebKit, :197 O8-Chromium, :199 harness — driver tự unlink).
- Fixture /tmp: rebuild lần 2 trên #84 (md5 khớp); kiểm cuối sau harness vẫn khớp.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt (replay + repair là của T5/hệ thống — T8 chỉ đọc); không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN BOOT `4ae2d2ea` (#84, CHƯA XÁC MINH 9 NGUỒN — số hiệu chờ T0-174)** — boot sau reboot #84 lúc 21:01:15Z, là boot lúc đo (không đổi boot trong phiên O8+harness). **Chuỗi WebKit FULL PASS GIỮ 24 — KHÔNG TĂNG, T8 KHÔNG ĐỀ XUẤT TĂNG** (không có lượt yên hợp lệ trên boot đo: T4 0 attempt — xem §A; T0-173 cũng GIỮ 24 từ bộ O8 của họ trên #83). Số hiệu #84 chờ T0-174 xác minh 9/9 nguồn (gap #83→#84 = 2.128 s).
2. **Harness 6/6 + 0 KẸT — kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 1 → 2.** Đợt sạch thứ hai liên tiếp (172, 173). Đừng gộp verdict pha con với verdict pha, và đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `4ae2d2ea` theo repair sớm của T5 (libs 6/6 + GST 269 plugin qua symlink, T5 poll1 PASS GST) + selfcheck T8 (6/6 lib + dpkg 795 + cache 110 + lists 75) + POSTBOOT_PASS 21:27:05Z mode repair-sớm. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness (standard driver, không LD_LIBRARY_PATH) trên cùng boot đo (xem §A) — **đợt này harness PASS 6/6 nên bằng chứng là đầy đủ**. **Nhãn đã ghi ĐÚNG ngay từ đầu đợt này — không lặp lỗi nhãn sai đợt 162.**
4. **POSTBOOT_PASS cho boot đo `4ae2d2ea` ĐÃ CÓ (21:27:05Z, T5, poll=1, mode repair-sớm-quyết-h)** — khác đợt 172 (#81 repair-sớm) và đợt 171 (#80 replay-đầy-đủ) và đợt 169 (#78 KHÔNG CÓ). Gate (a) CÓ lúc 21:28Z (poll 27) — nhưng **cờ T4 VẮNG nên gate đầy đủ KHÔNG FOUND** (waiter hết hạn 22:30:01Z). Đừng trích POSTBOOT_PASS #83 (chưa từng có — T5-173 không viết cho #83 trước reboot) hay bất kỳ cờ boot cũ nào là gate cho boot đo. **Caveat mode xem F-173-T8-5.**
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=32, max 91,6% trần) — avail min 488 MB @22:45:30Z (trong cửa sổ Chromium 84l10 — KHÔNG kẹt); **NHƯNG lúc selfcheck #3 (22:31:50Z, TRƯỚC harness) balloon = 6.443.824 kB = ĐÚNG TRẦN + avail 449 MB** — ghim trần quan sát được ngoài cửa sổ sampler (xem F-173-T8-5); giao T9 đối chiếu với sampler của họ (T9 đo cả phiên) — chỉ là tương quan, H1/H2 đã bác bỏ nên không dùng làm bằng chứng nguyên nhân.
6. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–173 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (34.880 B sau Q3) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **Chuỗi verdict ĐỔI CHIỀU đợt này (do PASS đầy đủ): 85m4 P4-lần3 PASS lần thứ hai liên tiếp (chuỗi mới = 2); 86n2 P4-lần2 PASS (chuỗi verdict 23 → 24); Chromium 85m4 P5 0 restart trở lại sau 2 đợt CÓ-RESTART (171, 172).** H3 vẫn mở, chỉ giám sát thụ động (xem §B). Điều tra riêng 84l10 ĐỢT 2 (xem §D — Q3 đã triển khai xong).
8. **84l10 E4 ended=true CẢ HAI engine đợt này** (WebKit ct cuối=4, restart 3→3; Chromium ct cuối=4, restart 6→6) — tiếp chuỗi ended=true từ đợt 172. Script verdict vẫn PASS cho cả hai; đừng trích ended thành FAIL (xem F-172-T8-4).
9. **T8 ĐÓNG TRỄ hạn cờ ~23:00Z ~13' (~23:13Z) — do reboot #85 lúc 22:59:36Z trong lúc viết LIMITS (phải sửa lại số liệu đóng sổ cho đúng, ghi rõ theo quyết (l) đợt 152); TRONG hạn cứng ~23:30Z** — gate hết hạn 22:30:01Z; O8 xong 22:34:48Z; harness xong 22:52:03Z (15'30" — nhanh như đợt 172 do 0 timeout).
10. **3 reboot liên quan đợt (#83 TRƯỚC khi đợt mở 14' + #84 GIỮA PHIÊN lúc 21:01:15Z + #85 LÚC ĐÓNG lúc 22:59:36Z)** — số hiệu #83 đã được T0-173 xác minh 9/9 nguồn (gap #82→#83 = 5.099 s; marker sống qua 35 reboot #49–#83); số hiệu #84 CHỜ T0-174 xác minh (gap #83→#84 = 2.128 s); số hiệu #85 CHỜ T0-174 xác minh (gap #84→#85 = 7.101 s; marker mtime không đổi — sống qua 37 reboot #49–#85 nếu #85 xác nhận); (m) #83 KHÔNG PHẢI ĐIỂM (theo cờ T0); (m) #84/(m) #85 thuộc T2-174; INSIDE #84/#85 giao T2-174 (dải FULL128/FULL129 — chuỗi vẫn đứt từ #80, dài 0).
11. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE đợt này, 0 kích hoạt, 0 false-positive, 0 bỏ lỡ** — replay C5.1 ĐẠT (RUNSPAN TRIGGER đúng 125 s trên log kẹt 164; 0 FP trên 9 log sạch thật 163/165/166/167/168/169/170/172/173); kiểm lại (f') bằng chính helper đã triển khai: kẹt-171 TRIGGER @305 s, kẹt-164 @125 s, 0 FP trên 8 log sạch (xem §C). **Lần đầu (f') chạy live — 0 kích hoạt trên đợt sạch là đúng, chưa có ca kẹt paused+seeking để chứng minh live.**
12. **Fixture h/g md5 KHỚP kỳ vọng đợt 125** (rebuild lần 2 trên #84; kiểm cuối sau harness vẫn khớp lúc ~22:54Z — /tmp mất lần nữa theo reboot #85, không cần rebuild vì harness đã xong). Giả thuyết "giá trị đứng" ở F-163-T8-1 vẫn SAI — đừng dùng md5 h/g làm fingerprint ổn định.
13. **Chromium 84l10 W1-lần2 delta=+2 + Chromium 86n2 P4-lần3 delta=+2** (artifact bắn lặp do ghi đè ended còn bật — xem F-173-T8-4); verdict vẫn PASS. **Chromium 85m4 P5 0 restart đợt này** (40 s, extraEvents=[]) — khác đợt 171/172 (CÓ-RESTART +1). Ghi nhận để T10 đối chiếu, không đổi verdict pha hay verdict đợt.

## 8. Sai số mới (F-173-T8-N)

- **F-173-T8-1 — COPY DRIVER 172→173: cp -a BÁO LỖI PRESERVE OWNERSHIP (EPERM) NHƯNG NỘI DUNG + BIT +x CÒN NGUYÊN — ĐÃ DỌN RIÊNG (nối F-172-T8-1).** `cp -a round172-t8 round173-t8` trả exit 1 với `cp: failed to preserve ownership ... Operation not permitted` (các thư mục smoke/, o8-chromium/chrome-userdata, ...) — nội dung file vẫn copy đủ, bit +x giữ nguyên trên toàn bộ .sh. T8 dọn scratch cũ bằng lệnh riêng với đường dẫn tuyệt đối (không ghép sau `&&` của cp) — đúng bài học F-172-T8-1. Không có điểm stale nào lọt vào chạy (waiter deadline đúng 22:30Z; extract đọc đúng 2 log waiter; diag symlink đúng 173 lúc kiểm cuối; replay đã thêm entry 173).
- **F-173-T8-2 — SELFCHECK "GST PLUGINS 0" LẠI LÀ ARTIFACT ĐO — BINARY gst-inspect-1.0 VẮNG CẢ 3 LẦN (nối F-172-T8-2).** Selfcheck #1/#2/#3 đều báo `GST plugins 0` — vì `gst-inspect-1.0` không tồn tại (gstreamer1.0-tools chưa cài — dpkg.log chỉ 2 dòng lúc #1/#2, 795 dòng lúc #3 sau repair). Thư mục plugin THẬT có đủ: sau repair, `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` là symlink → debroot, 269 file; T5 poll1 (21:27:05Z) PASS GST (đủ isomp4 + libav). **Harness PASS 6/6 là bằng chứng thật plugin đủ — đừng trích "GST 0" trong selfcheck thành "thiếu plugin".** Selfcheck đợt này đã kiểm `which gst-inspect-1.0` trước (VẮNG — ghi rõ, không ghi 0 như kết luận).
- **F-173-T8-3 — SOCKET X11 X193/X194/X195 (T0 GIAO T8 DỌN) ĐÃ BIẾN MẤT THEO REBOOT #84 — KHÔNG CÒN GÌ ĐỂ DỌN.** Lúc T8 mở (20:39Z) `/tmp/.X11-unix/` TRỐNG (X193/X194/X195 xuất hiện lúc 17:45Z đợt 172 đã được T8-172 dọn; socket mới của T0-173 chưa kịp kiểm thì reboot #84 lúc 21:01:15Z đã xóa toàn bộ /tmp). Kiểm lúc 21:02Z và kiểm cuối ~22:54Z: `/tmp/.X11-unix/` TRỐNG (0 file). Không phải T8 dọn tay — ghi rõ cơ chế (reboot xóa), không nhận công dọn.
- **F-173-T8-4 — CHROMIUM 84l10 W1-LẦN2 DELTA=+2 + CHROMIUM 86n2 P4-LẦN3 DELTA=+2 (ARTIFACT BẮN LẶP — VERDICT VẪN PASS).** 84l10 Chromium W1-lần2 PASS delta=+2 (2→4, gồm bắn lặp do ghi đè ended còn bật); W1-lần1 +1, W1-lần3 +1 — cùng họ artifact ghi đè ended còn bật, xem F-171-T8-5/F-172-T8-4. 86n2 Chromium P4-lần3 PASS delta=+2 (ct=2.196, hạ-cánh-về-target=true) — cùng họ (đợt 172 Chromium 86n2 P4-lần3 delta=+1; lần này +2). Script verdict vẫn PASS cả hai (hạ-cánh-về-target=true, errors=0). **WebKit đợt này W1/P4 đều delta=+1 sạch cả 3 pha.** Ghi nhận để T10 đối chiếu (artifact của chính script test trên Chromium, không phải kẹt hay lỗi app); không đổi verdict pha hay verdict đợt.
- **F-173-T8-5 — BALLOON GHIM ĐÚNG TRẦN 6.443.824 kB LÚC SELFCHECK #3 (22:31:50Z, TRƯỚC HARNESS) + AVAIL 449 MB — NGOÀI CỬA SỔ SAMPLER.** Selfcheck #3 ghi balloon 6.443.824 kB (= trần tuyệt đối, khớp mẫu "ghim trần" của T9) và avail 449 MB — đúng lúc T8 chuẩn bị chạy O8. Trong cửa sổ harness, sampler n=32: balloon max 5.902.696 (91,6% trần), 0 mẫu ghim, avail min 488 MB @22:45:30Z. **Hai quan sát không mâu thuẫn: balloon đã hạ khỏi trần trước khi harness bắt đầu (22:36:33Z).** T8 KHÔNG kết luận ghim trần gây/không gây gì (H1/H2 đã bác bỏ; avail thấp một mình không gây kẹt — harness 6/6 PASS ngay sau đó là bằng chứng). Giao T9 đối chiếu với sampler cả phiên của họ; chuỗi ghim trần phán bằng sampler T9.
- **F-173-T8-6 — POSTBOOT_PASS #83 CHƯA TỪNG CÓ (T5 KHÔNG VIẾT KỊP TRƯỚC REBOOT #84) — T0-173 GHI RÕ TRONG CỜ.** T0-173 đóng ~20:54Z với "POSTBOOT_PASS #83 CHƯA CÓ lúc đóng (T5-173 đang làm; T4 poll gate0 không-dat)". T5-173 sau đó viết POSTBOOT_PASS cho #84 (21:27:05Z, repair-sớm) — không có bản nào cho #83. Nghĩa là: O8 của T0 trên #83 chạy khi postboot chưa có; O8 của T8 trên #84 chạy khi postboot (a) đã có. T10 ghi nhận khi xét chuỗi (cả hai bộ đều GIỮ 24 — T0 vì FAIL, T8 vì thiếu lượt yên).
- **F-173-T8-7 — T4 0 ATTEMPT CẢ LƯỢT TRÊN BOOT MỚI #84 (GATE0=T5 TỪ 21:27Z NHƯNG KHÔNG ATTEMPT NÀO BẮT ĐẦU).** Poller T4 chạy tới poll #75+ (21:58Z), gate0=T5, 0 blocker, load ~0,1, RAM ~490 MB, không lock — nhưng không có attempt process nào, không file attempt mới nào sau 21:30Z, cờ `round173-t4.done` vắng lúc T8 đóng. T8 KHÔNG tự suy đoán nguyên nhân (không phải việc T8; có thể T4 chờ điều kiện khác hoặc agent T4 dừng sau reboot #84). Ghi nhận để T10/T4 đối chiếu; **hệ quả trực tiếp: chuỗi WebKit FULL PASS không thể tăng đợt này dù O8 pass** (xem §A). Waiter hết hạn 22:30:01Z poll 88 theo đúng thủ tục quyết (i) đợt 143.
- **F-173-T8-9 — REBOOT #85 LÚC ĐÓNG (22:59:36Z, SAU HARNESS, TRONG LÚC VIẾT LIMITS) — T8 PHÁT HIỆN KHI KIỂM BOOT LẦN CUỐI, ĐÃ SỬA LIMITS CHO ĐÚNG, ĐÓNG TRỄ CỜ ~13'.** Btime 1795388376 = 22:59:36Z (gap #84→#85 = 7.101 s); boot mới `3c704685`. T8 phát hiện 23:08:15Z — kiểm boot lần cuối ngay trước khi viết cờ (đúng bài học F-171-T10-2/F-172-T9-7) thay vì viết cờ trên số liệu cũ: LIMITS đã sửa (header + §0 + §1 + §6 + §7.9/§7.10 + §9.7 + §E o21) + cờ ghi rõ boot lúc đóng là #85. **O8 + harness không bị ảnh hưởng (chạy xong 22:34:48Z/22:52:03Z trên #84, trước #85); mọi file đóng sổ (LIMITS, paths, smoke log) còn nguyên trên home.** Marker mtime 2026-11-20 11:39:47.272154981Z không đổi — sống qua 37 reboot #49–#85 nếu T0-174 xác nhận #85. **T8 đóng ~23:13Z — TRỄ hạn cờ ~23:00Z ~13', ghi rõ theo quyết (l) đợt 152 (cùng mẫu T7 trễ ~3' đợt 172 — chỉ ghi nhận, không nhắc); TRONG hạn cứng ~23:30Z.**
- **F-173-T8-8 — REBOOT #84 GIỮA PHIÊN GIẾT WAITER LẦN 1 + XÓA FIXTURE /tmp + XÓA SOCKET X11 — T8 KHÔI PHỤC ĐẦY ĐỦ, KHÔNG MẤT DỮ LIỆU.** Reboot 21:01:15Z (gap #83→#84 = 2.128 s) xảy ra sau khi T0 đóng cờ, trong lúc T8 chờ gate: waiter lần 1 chết (16 poll), fixture /tmp mất, X193/X194/X195 mất. T8 phát hiện qua kiểm boot 21:02:06Z (41 s sau btime mới — nhanh hơn T7-172 phát hiện #82 trong 41 s, cùng mẫu), lưu log waiter lần 1, khởi động waiter lần 2, rebuild fixture lần 2 (md5 khớp), selfcheck #2 trên boot mới. **Dữ liệu bền (repo + hidden_files) còn nguyên: 84l10 md5 `baaa13c0` + check-fresh md5 `bd64610f` kiểm lại sau reboot khớp trước reboot.** Không mất công việc nào đã làm trước reboot.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = GIỮ 24 (T8 KHÔNG đề xuất tăng — T0-173 cũng GIỮ 24).** O8 T8 21/21 ×2 trên boot `4ae2d2ea` (#84, CHƯA xác minh 9 nguồn), gate (a) CÓ (POSTBOOT_PASS 21:27:05Z repair-sớm), NHƯNG **không có lượt yên hợp lệ nào trên boot đo (T4 0 attempt)**. Tiền lệ đợt 166/169: thiếu lượt yên → GIỮ. T10/parent phán cuối.
2. **Harness 6/6 + 0 kẹt — kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 1 → 2.** Đợt sạch thứ hai liên tiếp. 85m4 P4-lần3 PASS lần thứ hai liên tiếp (chuỗi mới = 2); 86n2 P4-lần2 PASS (chuỗi verdict 23 → 24); Chromium 85m4 P5 0 restart trở lại sau 2 đợt CÓ-RESTART.
3. **Điều tra riêng 84l10 — ĐỢT 2 XONG (T8 chủ trì), Q3 ĐÃ TRIỂN KHAI XONG.** 84l10 PASS đầy đủ lần thứ hai liên tiếp (172, 173) nên chưa có điểm dữ liệu kẹt mới — hồ sơ 3 điểm kẹt cũ vẫn đứng nguyên + Q3 heartbeat đã chạy thật (W2 6 tick WebKit / 5 tick Chromium, E4 0 tick — đúng thiết kế). **Nếu 84l10 kẹt lần thứ tư (ca mới), heartbeat sẽ ghi lại trạng thái media lúc chết (paused/seeking/ct/playhead) — lần đầu có bằng chứng này.** Q1/Q2/Q4 vẫn mở (xem §D đợt 172 — Q2 probe DEBROOT vẫn cần quyết trước khi chạy).
4. **(m) #84 + INSIDE #84 + kiểm lại FULL127 độc lập — thuộc T2-174 + parent** (T2-173 đóng trước #84 — như (m) #82 thuộc T2-173). (m) #82: requeue +38,438 s TRONG dải (theo cờ T0-173) — phân loại cuối thuộc T2-173 + parent 173; (m) #83 KHÔNG PHẢI ĐIỂM (0 run sống + 0 requeue — theo cờ T0-173).
5. **Đối chứng Chromium cùng pha: N cộng dồn N=35 mỗi pha** (đợt 137/139/141–173 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
6. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE — 0 kích hoạt, 0 FP, 0 bỏ lỡ → ĐƯỢC GIỮ.** Lần đầu (f') chạy live trên đợt sạch. V2 (f'') vẫn giữ làm dự phòng. Nếu đợt sau có kẹt 85m4 dạng paused+seeking, (f') sẽ bắt ở ~elapsed 305 s (theo replay) — T8-174 kiểm lại.
7. **Reboot #84 (btime 21:01:15Z, boot `4ae2d2ea`) GIỮA PHIÊN + reboot #85 (btime 22:59:36Z, boot `3c704685`) LÚC ĐÓNG — số hiệu chờ T0-174 xác minh 9/9 nguồn** (gap #83→#84 = 2.128 s; gap #84→#85 = 7.101 s; marker sống qua 37 reboot #49–#85 nếu #85 xác nhận — mtime không đổi); mù cho boot mới giao T2-174 (theo quyết (s) đợt 158); INSIDE #84/#85 giao T2-174 (dải FULL128/FULL129 — chuỗi vẫn đứt từ #80, dài 0).
8. **RAM avail min 488 MB (trong cửa sổ Chromium 84l10 — KHÔNG kẹt) + balloon ghim trần lúc selfcheck #3 (22:31:50Z, ngoài cửa sổ sampler) — chờ T9 đối chiếu** (F-173-T8-5); chuỗi ghim trần phán bằng sampler T9 (giao T10). **Avail thấp một mình không gây kẹt — H1 vẫn BÁC BỎ** (giao T9).
9. **T4 0 attempt cả lượt (F-173-T8-7) — giao T10/T4 đối chiếu nguyên nhân.** Không phải lỗi T8; hệ quả: chuỗi không tăng đợt này.
10. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-173 xác nhận số lần — lần thứ 27 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; POSTBOOT_PASS #83 chưa từng có (F-173-T8-6); E-177 đang ghim — kết cục thuộc T9-173; prune lần 48 (T6-173); T2-173: không chạy script phân tích nặng trong cửa sổ attempt (nhắc lại sau F-171-T2-1); T4-173: không chạy script phân tích nặng trong cửa sổ attempt + nhắc T5 không probe dpkg trong cửa sổ attempt; u2net là fallback chính thức.
11. **2 reboot liên quan đợt (#83 TRƯỚC khi đợt mở 14' + #84 GIỮA PHIÊN lúc 21:01:15Z)** — số hiệu #83 đã được T0-173 xác minh 9/9 nguồn; số hiệu #84 chờ T0-174; (m) #83 KHÔNG PHẢI ĐIỂM; (m) #84 thuộc T2-174; INSIDE #84 thuộc T2-174.

---

# §C — KIỂM "NỘI DUNG TƯƠI" (1c') — (f') V1 ĐÃ TRIỂN KHAI LIVE ĐỢT 173 (QUYẾT (i) ĐỢT 172 §12.3), KIỂM LẠI: KẸT-171 @305 s, KẸT-164 @125 s, 0 FP

## C1. Thiết kế (c') + (f') V1 đã triển khai (quyết (A') đợt 166 §12.3(i) + quyết (i) đợt 172 §12.3)

- **(c'):** trong vòng poll của `run_one`, lấy toàn bộ chuỗi liên tiếp (trailing run) các dòng HB128 **cùng tag + cùng playhead + cùng ct** kết thúc ở dòng mới nhất; kích hoạt khi `elapsed mới nhất − elapsed đầu chuỗi ≥ 120 s` VÀ chuỗi dài ≥3 dòng VÀ điều kiện (e)/(f) trên dòng mới nhất (playing=true khi có trường này; nếu không có thì seeking=false; paused=false và seeking=false khi các trường này có).
- **(f') V1 — MỚI ĐỢT NÀY:** miễn (f) khi trailing sub-run liên tục `paused=true + seeking=true` (cùng tag+playhead+ct) đã ≥300 s. (e) giữ nguyên; ngưỡng 120 s, run_len ≥3, ngân sách chung với (1b) ≤2 lần/lần chạy, cách nhau ≥240 s; diag-only (chỉ ghi log chẩn đoán + gọi diag-stall, không can thiệp chạy, không đổi verdict/timeout); vị trí code (helper `check-fresh-173t8.py` — driver gọi mỗi poll — không chạm script repo); phạm vi: 85m4 + 84l10 W2/E4 từ Q3 (cả hai nay đều có HB128).
- **V2 (f'') giữ làm dự phòng, KHÔNG triển khai** (miễn (f) khi watchdog đã kích hoạt — kẹt-171 @125 s nhưng ghép hai kênh chẩn đoán).

## C2. Kiểm chứng offline TRƯỚC harness (helper check-fresh-173t8.py ĐÃ TRIỂN KHAI — chạy ~20:42Z)

| Log | HB128 | check-fresh-173t8.py (code live đợt này) |
|---|---|---|
| 164-kẹt 85m4 | 174 dòng (P4-lần2 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.267 ct=0.267) | **TRIGGER elapsed=125 s** (ts 19:38:13.174Z, run 5 s→125 s, 25 dòng, span=120 s, span_seek=0 s — qua (f) thường) |
| 171-ket-85m4 | 174 dòng (P4-lần1 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.2 ct=0.2) | **TRIGGER elapsed=305 s** (ts 15:59:53.780Z, run 5 s→305 s, 61 dòng, span=300 s, span_seek=300 s — qua (f') MỚI) |
| 163-sạch 85m4 | 20 dòng | OK maxspan=5 s |
| 165-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 166-sạch 85m4 | 20 dòng | OK maxspan=5 s |
| 167-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 168-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 169-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 170-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 172-sạch 85m4 | 19 dòng | OK maxspan=5 s |

- Helper mới KHỚP replay độc lập `replay-f-fix-173t8.py` từng số (V1-300: 164@125 s, 171@305 s, 0 FP; V0 đối chứng: 171 KHÔNG kích hoạt — đúng vấn đề cũ). Hai triển khai độc lập của cùng ngữ nghĩa (f') cho cùng kết quả.

## C3. Replay sau harness (replay-1c-173t8.py, chạy ~22:54Z — thêm log 173-sạch)

| Log | HB128 | LITERAL (§C2 nguyên văn) | RUNSPAN (bản V0 — chưa có (f')) |
|---|---|---|---|
| 164-kẹt 85m4 | 174 dòng | KHÔNG kích hoạt | **TRIGGER elapsed=125 s** (ts 19:38:13.174Z, run 5 s→125 s, 25 dòng, span=120 s) |
| 163-sạch 85m4 | 20 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 165-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 166-sạch 85m4 | 20 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 167-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 168-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 169-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 170-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| **171-kẹt 85m4 (LOG KẸT — xem chú thích)** | **174 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 811 s) — (c') V0 BỎ LỠ (đã bắt được bằng (f') mới ở §C2)** |
| **172-sạch 85m4** | **19 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 5 s)** |
| **173-sạch 85m4** | **19 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 5 s)** |
| 164/165-86n2 | 0 dòng | KHÔNG kích hoạt (không có dòng) | KHÔNG kích hoạt (không có dòng) |

- **Chú thích bắt buộc cho dòng 171:** entry này là **log KẸT thật** (P4-lần1 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.2 ct=0.2) — "KHÔNG kích hoạt" ở đây trong replay V0 là **(c') V0 BỎ LỠ kẹt thật**, KHÔNG phải "log sạch pass". Với (f') mới (§C2), kẹt này đã bắt được @305 s — không còn là bỏ lỡ trong code live đợt 173.
- **Tiêu chí C5.1 — RUNSPAN (V0): ĐẠT.** Kẹt-164 kích hoạt ĐÚNG elapsed=125 s; sạch-163/165/166/167/168/169/170/172/173 đều KHÔNG kích hoạt (max run span 5 s — biên 24× so với ngưỡng 120 s). **0 false-positive trên 9 log sạch thật.**
- **Chạy thật đợt này: FRESH-CONTENT-173 = 0 kích hoạt trong 6 pha — 0 FP, 0 BỎ LỠ.** Log 85m4 WebKit đợt này sạch (19 dòng HB128, maxspan=5 s); log 84l10 WebKit mới có HB128 (6 dòng W2) — check-fresh OK maxspan=0 s. Không có kẹt thật nào trong phạm vi (c') để bắt hay để lỡ. **(c') + (f') ĐƯỢC GIỮ** (không có FP → không cần quyết lại theo quyết (i) đợt 171).
- Lưu ý: max run span 5 s trên log sạch đến từ 2 dòng liên tiếp cùng tag `sampleFor P5-phaseB-long` với playhead=30 ct=30 (elapsed 35 s→40 s) — playhead dừng ở cuối video trong P5, nhưng chỉ 2 dòng / span 5 s, xa ngưỡng 120 s (biên 24×). Đây là hành vi bình thường cuối P5, không phải kẹt.
- Lưu ý phạm vi: (c') nay có HB128 ở 85m4 + 84l10 W2/E4 (từ Q3) — 0 kích hoạt ở 86n2 là ĐÚNG theo thiết kế (86n2 không có HB128).

---

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 2 (T8 CHỦ TRÌ; QUYẾT (i) ĐỢT 171; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT NÀY)

## D1. Phạm vi điều tra (parent chốt đợt 171, giữ nguyên đợt 172/173)

- **Phạm vi = 84l10 qua 3 điểm kẹt** (157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425 — 3 call-site khác nhau, cùng vùng W2/E4, cùng script `clicktest-84l10-webkit-loop-w1.mjs` — md5 ĐỔI đợt này `b8c08a7c` → `baaa13c0` DO Q3, không phải do app đổi).
- **KHÔNG gộp 85m4-P4 / 86n2-P4-lần3 vào điều tra này** (chữ ký khác nhau — 85m4 là đóng băng waitForPlaySync với HB128, 86n2 là điểm kẹt đợt 165 tái diễn — theo dõi riêng cho T8; bên nào kẹt lần thứ ba theo đường của mình thì mở điều tra riêng — đợt này cả hai đều PASS nên chưa đủ điều kiện).
- **Chủ trì: T8-173 (đợt 2).** Đợt này 84l10 PASS đầy đủ lần thứ hai liên tiếp nên chưa có điểm dữ liệu kẹt mới — công việc đợt 2 là triển khai Q3 (xem D2) + củng cố hồ sơ.

## D2. Q3 — TRIỂN KHAI XONG + CHỨNG MINH BẰNG CHẠY THẬT (quyết (i) đợt 172 §12.3 — parent CHẤP NHẬN)

**Thay đổi (1 file repo duy nhất):** `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` md5 `b8c08a7c` → `baaa13c0`, 32.680 → 34.880 B (vẫn dưới 37.768 B):
- Thêm hàm `hbStart(tag, getSummary)` — y hệt mẫu HB128 của 85m4 (`clicktest-85m4-webkit-w7-hb128.mjs` dòng 55–66, đợt 128 T3): `setInterval` 5 s, log `[HB128] <tag> elapsed=<n>s <summary>`, chạy trên event loop Node nên vẫn ghi log khi `page.evaluate` treo. Chẩn đoán-only.
- Heartbeat vào vòng W2 (`sampleFor W2`, summary từ sample cuối: n/lastPlayhead/lastCt/paused/seeking/playing) và vòng E4 (`sampleFor E4`, cùng mẫu) — bọc `try/finally { hbStop(); }` để dừng đúng lúc vòng thoát.
- Thêm trường `seeking` vào `w2.samples.push` và `e4.samples.push` (đọc từ `v.seeking` của STATE_FN — đã có sẵn trong STATE_FN, chỉ chưa ghi vào sample) để heartbeat + hồ sơ sau này có đủ trạng thái media lúc chết (paused/seeking/ct/playhead/playing). Verdict không dùng trường mới — không đổi logic verdict.
- `node --check` OK trước khi chạy.

**Bằng chứng chạy thật (harness đợt này — cũng là lần chạy 84l10 sau sửa để chứng minh không vỡ test):**

| Engine | W2 HB128 | E4 HB128 | W2 | E4 |
|---|---|---|---|---|
| WebKit | **6 tick** (5/10/15/20/25/30 s; n=19→115; playhead 4.367→29.333; seeking=false playing=true) | **0 tick** (vòng khỏe ~4–5 s — tick 5 s chưa kịp bắn; xem chú thích) | PASS (playhead cuối=30, Δ=0) | PASS (ended=true, ct=4, restart 3→3) |
| Chromium | **5 tick** (5/10/15/20/25 s; n=25→121; playhead 5.3→25.233; seeking=false playing=true) | **0 tick** (như WebKit) | PASS (playhead cuối=29.967, Δ=0) | PASS (ended=true, ct=4, restart 6→6) |

- **Chú thích E4 0 tick — ĐÚNG THIẾT KẾ, KHÔNG PHẢI LỖI:** vòng E4 khỏe chỉ chạy ~4–5 s (clip 4 s phát tới cuối rồi thoát vòng ngay khi `playhead>=3.95 && !playing`); heartbeat 5 s chưa kịp tick lần đầu thì `hbStop()` trong `finally` đã dừng interval. Khi E4 kẹt (evaluate treo như 3 ca cũ), vòng KHÔNG thoát → `hbStop()` không chạy → tick bắn mỗi 5 s với state cuối cùng đã biết — đúng giá trị chẩn đoán Q3 cần. Tương tự W2: nếu kẹt giữa vòng, tick tiếp tục với playhead/ct đóng băng. **Không cần hạ tick xuống <5 s** (đồng bộ với HB128 của 85m4; tick dày hơn chỉ thêm log, không thêm thông tin).
- **Không FP từ Q3:** check-fresh trên log 84l10 cả hai engine: OK maxspan=0 s (W2 playhead luôn tiến; E4 0 tick) — heartbeat mới không kích hoạt (c') oan. FRESH-CONTENT-173 live = 0 kích hoạt (xem §3).
- **Hồ sơ 3 điểm kẹt cũ vẫn đứng nguyên** (xem §D đợt 172 — D2/D3): 157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425. Tinh chỉnh nhãn F-172-T8-7 giữ nguyên (:457/:433 là evaluate sample đầu tiên của vòng, chỉ :425 là evaluate setup).

## D3. Câu hỏi mở (chưa có câu trả lời — giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Thủ phạm là chuyển trạng thái hay vòng poll?** Vẫn mở — cần ca thứ tư để phân biệt (hoặc probe chủ đích chạy riêng vòng W2 nhiều lần trên cùng boot để tăng mẫu). **Nay đã có Q3: nếu ca thứ tư xảy ra, heartbeat sẽ ghi trạng thái media lúc chết — dữ liệu để trả lời Q1.**
- **Q2 — Lib hệ thống hay engine?** Vẫn mở — probe phân biệt: chạy harness 84l10 một lần dưới LD_LIBRARY_PATH DEBROOT (như O8). Chưa chạy (cần quyết parent/T10 vì đổi biến môi trường của harness chuẩn).
- **Q3 — Trạng thái media element lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT NÀY (xem D2).** Heartbeat W2/E4 đã chạy thật; chờ ca kẹt thứ tư để thu bằng chứng.
- **Q4 — Có phải race giữa evaluate và GStreamer seek/play?** Vẫn mở — chỉ là tương quan thời điểm, chưa có bằng chứng trực tiếp.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ tư (ca mới), ghi ngay call-site + dòng log cuối + RSS chuỗi + dòng HB128 cuối cùng (state lúc chết) + đối chiếu Q1 (setup hay sample-loop); nếu PASS tiếp 2–3 đợt, hồ sơ giữ nguyên, không vội kết luận "đã hết kẹt" (tần suất ~20% nên 2–3 đợt sạch là trong kỳ vọng — nay đã 2 đợt sạch liên tiếp 172–173).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 173 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 + (p) đợt 156 + (i) đợt 157 + (i) đợt 158 + (i) đợt 159 + (h) đợt 160 + (h) đợt 161 + (h) đợt 162 + (h) đợt 163 + (h) đợt 164 + (i) đợt 165 + (i) đợt 166 + (i) đợt 167 + (i) đợt 168 + (i) đợt 169 + (i) đợt 170 + (i) đợt 171 + (i) đợt 172) — 0 KẸT MỚI, H3 VẪN MỞ, CHỈ GIÁM SÁT THỤ ĐỘNG

## B1. Trạng thái giả thuyết sau đợt 173 (H3 vẫn mở — 0 kẹt mới)

| Giả thuyết | Trạng thái đợt 172 | Trạng thái đợt 173 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** — avail min 488 MB @22:45:30Z trong cửa sổ Chromium 84l10 KHÔNG kẹt; avail lúc bắt đầu các pha WebKit 1.149–1.429 MB, cao hơn avail-min 478 MB đợt 172 (khi 0 kẹt) và 247 MB đợt 170 (khi có 1 kẹt) — avail thấp mà vẫn 6/6 PASS (avail 449 MB lúc selfcheck #3 trước harness cũng không gây kẹt) |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** — 0 kẹt đợt này nên không có cửa sổ kẹt để đối chiếu; avail rơi trong lúc chạy dài mà không kẹt |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — 0 kẹt mới đợt 172 | **VẪN MỞ — 0 KẸT MỚI đợt này (harness 6/6 PASS, đợt sạch thứ hai liên tiếp)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153, 170, 171) | **BÁC BỎ (đứng nguyên — không có ca kẹt mới để kiểm lại; bằng chứng đợt 171 vẫn đứng)** |

- Đợt 173 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p)/(i): **0 kẹt trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt).
- **Điều kiện mở điều tra H3 KHÔNG đạt:** theo quyết (i) đợt 158, điều kiện là 85m4 P4-lần3 tái diễn lần 3 — đợt này 85m4 P4-lần3 PASS lần thứ hai liên tiếp (chuỗi mới = 2). **Riêng 84l10: điều tra riêng ĐÃ MỞ đợt 2 (xem §D) — H3 tổng vẫn chỉ giám sát thụ động.**

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 173

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–173; 84l10 đã thêm Q3 heartbeat — không chạm `ev()`) + đường ổn định `t8-diag-stall.sh` → 173 (CẢ HAI symlink cập nhật 20:40Z; kiểm cuối vẫn trỏ 173) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt ĐÚNG, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt thật để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–173) | 6 lần chạy harness; `live_diags=0` ở cả 6 pha | **0 kích hoạt — ĐÚNG, KHÔNG LOG NÀO IM LẶNG >120 s** |
| (1c') Kiểm "nội dung tươi" (c') + (f') V1 MỚI | **(f') ĐÃ TRIỂN KHAI đợt này** (quyết (i) đợt 172; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 lần chạy harness (85m4 + 84l10 W2/E4 mới có HB128); `live_diags=0` ở 85m4/84l10 | **0 kích hoạt live — 0 FP, 0 BỎ LỠ. (c')+(f') ĐƯỢC GIỮ (xem §C).** Replay sau harness: C5.1 ĐẠT (kẹt-164 TRIGGER 125 s theo V0; 0 FP trên 9 log sạch thật) + kiểm lại (f') bằng chính helper: kẹt-171 @305 s |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=5.227.232 max=5.902.696 (91,6% trần) mean=5.582.299; avail min=488 MB @22:45:30Z (trong cửa sổ Chromium 84l10 — KHÔNG kẹt); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness (ghim quan sát được lúc selfcheck #3 ngoài cửa sổ — xem F-173-T8-5) |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 22:45:41Z), 85m4 PASS (exit 0, 22:47:57Z), 86n2 PASS (exit 0, 22:52:03Z)** | N cộng dồn **N=35 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline đã lưu lúc bắt đầu; 0 snapshot stall) | 0 snapshot stall đợt này (đúng — không có kẹt) |

## B3. Chữ ký kẹt — đợt 173: 0 KẸT (đợt sạch thứ hai liên tiếp sau đợt 172)

| Trường | 84l10 | 85m4 | 86n2 |
|---|---|---|---|
| Pha / script | WebKit 84l10, `clicktest-84l10-webkit-loop-w1.mjs` (md5 **`baaa13c0`** — ĐỔI do Q3) | WebKit 85m4, `clicktest-85m4-webkit-w7-hb128.mjs` (md5 `610ee003`, không đổi) | WebKit 86n2, `clicktest-86n2-webkit-w7.mjs` (md5 `628088bd`, không đổi) |
| Thời gian | 22:36:33–22:37:43Z (exit 0) | 22:37:58–22:40:09Z (exit 0) | 22:40:25–22:44:25Z (exit 0) |
| Kết quả | W1-lần1/2/3 PASS (+1/+1/+1), W2 PASS (playhead cuối=30), E4 PASS (ended=true, ct=4) | P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 0 restart | P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 0 restart |
| Đối chứng | Chromium 84l10 cùng pha PASS — không phân biệt WebKit/Chromium đợt này | Chromium 85m4 cùng pha PASS (P5 0 restart) | Chromium 86n2 cùng pha PASS (P5 0 restart) |
| RAM lúc chạy | Avail 1.149 MB lúc bắt đầu → 1.141 MB lúc xong (free -m trong summary, theo thứ tự pha) | Avail 1.429 MB lúc bắt đầu → 1.372 MB lúc xong | Avail 1.154 MB lúc bắt đầu → 1.073 MB lúc xong; avail-min toàn harness 488 MB @22:45:30Z trong cửa sổ Chromium 84l10 |
| Vite | HTTP 200 trong lúc chạy (vite còn sống); 000 sau release | HTTP 200 trong lúc chạy | HTTP 200 trong lúc chạy |
| Tiền lệ | Đợt 157/170/171: 84l10 kẹt ở 3 điểm khác nhau (xem §D) — đợt này PASS đầy đủ lần thứ hai liên tiếp, điểm kẹt không tái diễn; Q3 heartbeat đã chạy thật | Đợt 164: 85m4 kẹt ở P4-lần2; đợt 171: kẹt ở P4-lần1 — đợt này PASS đầy đủ | Đợt 165: 86n2 kẹt ở P4-lần3; đợt 171: tái diễn — đợt này PASS đầy đủ |

---

# §E — CHECKLIST (o) ĐỢT 173 (nợ mở từ đợt 172 §11 — quyết (o) đợt 172 §12.3: các F-172-T*-* + đính chính; T8-173 thực hiện và báo kết quả từng mục)

Phạm vi checklist (o) = toàn bộ mục trong quyết (o) đợt 172 §12.3 (aggregate 172 §12.1 (o)/§12.3 (o)). T8-173 đã đi qua từng mục — mục nào thuộc T8 thì thực hiện, mục nào thuộc luồng khác thì ghi nhận/chuyển giao đúng chủ.

| # | Mục quyết (o) đợt 172 | Kết quả T8-173 |
|---|---|---|
| o1 | F-172-T1-1 (nhãn header GAP §100 còn cũ — T10 ĐÃ SỬA khi viết §101): GHI NHẬN — ĐÓNG | **GHI NHẬN — ĐÃ ĐÓNG từ đợt 172.** T8-173 đọc GAP §101 lúc mở (header đã đúng); không còn việc. |
| o2 | F-172-T1-2 (3 socket X11 X193/X194/X195 — T8 đã dọn, /tmp/.X11-unix TRỐNG lúc T10 đóng): GHI NHẬN — ĐÓNG | **GHI NHẬN — X193/X194/X195 đợt 173 (của T0-173) đã BIẾN MẤT theo reboot #84, không còn để dọn** (xem F-173-T8-3). `/tmp/.X11-unix/` TRỐNG lúc mở, sau reboot #84, và lúc kiểm cuối. Không socket mới nào sau khi dọn (driver tự unlink socket của mình). |
| o3 | F-172-T1-3 (đóng F-171-T10-3 — median tickCost 43 khớp): GHI NHẬN — ĐÓNG | **GHI NHẬN — ĐÃ ĐÓNG từ đợt 172.** Không còn việc. |
| o4 | F-172-T1-4 (suite trên boot mới #81): GHI NHẬN | **GHI NHẬN.** Đợt 173 T1 chạy suite trên boot mới #84 (theo cờ T1-173 — T8 không chạy lại suite; quy tắc đứng: nếu T1 không chạy được suite đầy đủ thì T10 phải chạy lại trước khi đóng — giao T10-173). |
| o5 | F-172-T0-1 (dị thường watcher-log +20 s — đã giải thích): GHI NHẬN | **GHI NHẬN.** Đợt 173 có F-173-T0-1 tương tự (watcher-172 poll cuối +23 s sau btime #82 — mẫu thứ ba liên tiếp, theo cờ T0-173); T8 ghi nhận, không đổi gì. |
| o6 | F-172-T0-2 (nháp appendix gõ sai epoch — đã sửa): GHI NHẬN | **GHI NHẬN — ĐÃ SỬA từ đợt 172.** Không còn việc. |
| o7 | F-172-T0-3 (cảnh báo sát biên (m) #81): GHI NHẬN — xem (e) | **GHI NHẬN.** (m) #81 DƯƠNG theo quyết (e) đợt 172 (parent CHẤP NHẬN). (m) #82 (+38,438 s, không sát biên) thuộc T2-173 + parent 173; (m) #83 KHÔNG PHẢI ĐIỂM (theo cờ T0-173). |
| o8 | F-172-T2-1..15: GHI NHẬN (F-172-T2-3 đã trừ số giả; F-172-T2-4 U cách sàn 29 s — theo dõi sát đợt 173) | **GHI NHẬN.** Mù #96?/#95?/#94?/#88?/#77? + hole-recheck lần 17 thuộc T2-173 (T8 không theo dõi thay). |
| o9 | F-172-T4-1/2/7: GHI NHẬN (F-172-T4-7 gate repair-mode — xem (b)/(j)) | **GHI NHẬN — ÁP DỤNG TRỰC TIẾP ĐỢT 173.** Gate (a) cho boot đo #84 cũng mode repair-sớm (POSTBOOT_PASS 21:27:05Z, poll=1, dpkg 795 — y hệt #81 đợt 172); T8 ghi rõ caveat mode ở §A + F-173-T8-5 (không giấu, như đợt 172). |
| o10 | F-172-T5-1 (poll cuối watcher SAU btime 20 s — xem (j)): GHI NHẬN | **GHI NHẬN.** Đợt 173: watcher-172 poll cuối +23 s sau btime #82 (F-173-T0-1, mẫu thứ ba liên tiếp). Giao T5/T6-173 đối chiếu (F-172-T6-5 vẫn mở — xem o12). |
| o11 | F-172-T5-2 (cache .deb mtime cũ — cơ chế chưa xác định): GHI NHẬN | **GHI NHẬN.** T8 không theo dõi cache (việc T5); đợt 173 cache 110 .deb sau repair (khớp POSTBOOT_PASS #84). |
| o12 | F-172-T5-3 (ledger 106/170 — đã đính chính): GHI NHẬN | **GHI NHẬN — ĐÃ ĐÍNH CHÍNH từ đợt 172.** Không còn việc. |
| o13 | F-172-T6-1..6: GHI NHẬN (F-172-T6-5 pid watcher lệch — giao T5/T6-173 đối chiếu) | **GHI NHẬN — CHUYỂN GIAO T5/T6-173 (vẫn mở).** T8 không đối chiếu thay (không phải việc T8); watcher-173b pid 4077 đã chạy (theo dõi của T5). |
| o14 | F-172-T7-1 (sleep bị SIGTERM do #82 — phát hiện boot mới trong 41 s, 0 số sai): GHI NHẬN | **GHI NHẬN — MẪU LẶP LẠI ĐỢT 173 (F-173-T8-8).** T8 phát hiện reboot #84 trong 51 s (btime 21:01:15Z → kiểm 21:02:06Z), 0 số sai, khôi phục đầy đủ (waiter lần 2 + rebuild fixture + selfcheck #2). |
| o15 | F-172-T8-1/2/5/7: GHI NHẬN (F-172-T8-5 gate repair caveat; F-172-T8-7 tinh chỉnh nhãn 84l10) | **ĐÃ THỰC HIỆN ĐỢT 173:** F-172-T8-1 (cp -a EPERM — lặp lại, đã dọn riêng đúng bài học — xem F-173-T8-1); F-172-T8-2 (GST 0 artifact — lặp lại cả 3 selfcheck, đã kiểm `which` trước khi kết luận — xem F-173-T8-2); F-172-T8-5 (gate repair caveat — áp dụng cho gate #84, ghi rõ ở §A); F-172-T8-7 (tinh chỉnh nhãn 84l10 — giữ nguyên trong hồ sơ §D đợt 173). |
| o16 | F-172-T9-6 (8 số tính tay sai — đã sửa bằng script trước khi đóng): GHI NHẬN | **GHI NHẬN.** T8-173 trích số bằng script `extract-173t8.py` (không gõ tay) — đúng bài học. |
| o17 | F-172-T9-7 (kiểm boot lần cuối trước .done — đã áp dụng, khác mẫu F-171-T10-2): GHI NHẬN | **ĐÃ ÁP DỤNG ĐỢT 173 (bài học đứng) — VÀ PHÁT HUY TÁC DỤNG.** T8 kiểm boot lần cuối ngay trước khi viết cờ `round173-t8.done` và PHÁT HIỆN reboot #85 (xem F-173-T8-9) thay vì viết cờ trên số liệu cũ — boot lúc viết cờ là `3c704685` (#85), không reboot mới sau #85. |
| o18 | F-172-T10-1..4 (sai số của chính T10 — xem §10.7): GHI NHẬN | **GHI NHẬN.** Giao T10-173 (T8 không sửa aggregate). |
| o19 | Quyết (l) đợt 152 về hạn cờ: XÁC NHẬN giữ trọn vẹn lần thứ hai mươi liên tiếp — GIỮ NGUYÊN quy tắc đứng | **ĐÃ THỰC HIỆN — NHƯNG T8 TRỄ CỜ ĐỢT NÀY: ĐÓNG ~23:13Z — TRỄ hạn cờ ~23:00Z ~13' (do reboot #85 lúc 22:59:36Z + sửa LIMITS — xem F-173-T8-9); TRONG hạn cứng ~23:30Z. Ghi rõ, không giấu (cùng mẫu T7 trễ ~3' đợt 172).** Quyết (l) giữ nguyên. |
| o20 | T10 không chạy lại toàn bộ suite: CHẤP NHẬN cách đóng sổ này cho đợt 172 (dựa vào suite 28/28 của T1-172) | **GHI NHẬN.** Quy tắc đứng giữ nguyên cho đợt 173 (nếu T1-173 không chạy được suite đầy đủ thì T10-173 phải chạy lại trước khi đóng — giao T10-173). |
| o21 | Marker sống qua 34 reboot #49–#82: GHI NHẬN — 34 ĐÚNG. Gap #80→#81 = 9.064 s; gap #81→#82 = 7.123 s: GHI NHẬN | **GHI NHẬN + CẬP NHẬT:** theo cờ T0-173, marker sống qua **35 reboot #49–#83** (mtime 2026-11-20 11:39:47.272154981Z không đổi); gap #82→#83 = 5.099 s; **gap #83→#84 = 2.128 s; gap #84→#85 = 7.101 s** (T8 đo từ btime; số hiệu #84/#85 chờ T0-174 xác minh — marker sống qua **37 reboot #49–#85** nếu cả hai xác nhận; mtime vẫn không đổi lúc T8 kiểm cuối). |

- **Kết quả checklist (o): 21/21 mục đã thực hiện hoặc ghi nhận đúng chủ — 0 mục bỏ sót.** Các mục T8 tự thực hiện: o2 (X11 — đã kiểm, không còn để dọn), o9/o15 (gate repair caveat + nhãn 84l10 + bài học cp/GST), o17 (kiểm boot lần cuối trước .done — phát hiện #85), o19 (đóng TRỄ cờ ~13' do #85, ghi rõ). Các mục chuyển giao đúng chủ: o4/o20 (T1/T10 suite), o8 (T2 mù), o13 (T5/T6 pid watcher), o18 (T10 sai số).
