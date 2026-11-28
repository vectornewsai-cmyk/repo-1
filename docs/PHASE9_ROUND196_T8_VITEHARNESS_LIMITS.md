# Đợt 196 T8 — KẸT #29 THẬT (85m4 P4) — B1 BẮT LIVE LẦN ĐẦU; CELL MỚI #124 GIẾT HARNESS GIỮA PHA; WEBKIT KHÔNG CHẠY ĐƯỢC TRÊN #124; CHROMIUM 3/3 TRÊN #124

Ngày: 26/11/2026 (lượt cron 21:35:51 +07 = 14:35:51Z; T8 mở ~14:38Z, đóng 16:59Z — TRONG hạn cờ ~17:00Z và hạn cứng 17:35:51Z).
Phạm vi: (1) harness trên boot mới nhất — 2 boot trong phiên (#123 rồi #124); (2) B1/B2 live; (3) V2 (f'') + V4 (f'''') replay; (4) điều tra 84l10 đợt 21 + giả thuyết "thiếu scanner" với gst-inspect nay CÓ.
**Nguồn đứng:** §14.2 aggregate 195 **BẢN PARENT-KIỂM (68.559 B; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 133; §14.2-195 SẠCH — parent viết trực tiếp)**. Các mốc parent dùng: (j) V4 GIỮ LIVE, 84l10 chuỗi 2 → 3, 86n2-P1 lần 17, log sạch 37 → 40, B2 vùng mới sạch lần 9, B1 live sạch 2 → 3; (b) FULL PASS CÓ, chuỗi 0 → 1; (m) lượt yên #63 hợp lệ, chuỗi 0 → 1; live-check #14 ĐẠT, chuỗi 9 → 10.

## 0. Kết luận ngắn — 1 KẸT MỚI BẮT LIVE; HARNESS KHÔNG ĐỦ 6/6 TRÊN 1 BOOT; FULL PASS KHÔNG CÓ

- **HAI BOOT trong phiên.** #123 `bc09b26e` (btime 14:30:16Z, T01/T4 xác minh) → #124 `611a02f2` (btime 16:28:18Z, **T01-196 xác minh, gap #123→#124 = 7.082 s**). #124 KHÔNG phải reboot thường — **CELL MỚI** (dpkg.log 1477 → 2 dòng, libs 6/6 THIẾU, journal chỉ 1 boot, /tmp trống).
- **HARNESS #123 (16:16:32–16:28:54Z): WebKit 84l10 PASS** (exit=0, 16:16:32–16:17:54Z, live_diags=0); **WebKit 85m4 KẸT P4-lần1 (KẸT #29 — cộng dồn 28 → 29)**; 86n2 WebKit + Chromium chưa chạy thì cell mới giết driver (không có exit).
- **B1 BẮT ĐƯỢC KẸT THẬT LIVE LẦN ĐẦU — TRIGGER 16:21:43Z** (elapsed=135 s, span=120 s, run_len=25, via=wd, tag waitForPlaySync P4-lần1, playhead=0.533 ct=0.3); **chuỗi live sạch 3 ĐỨT**. Diag live ×2 (16:21:51Z, 16:25:53Z).
- **HARNESS #124 — CHROMIUM 3/3 PASS** (16:40:23–16:47:56Z, exit=0 cả 3, live_diags=0). **WebKit KHÔNG CHẠY ĐƯỢC trên #124** (libwebkitgtk-6.0.so.4 vắng toàn hệ thống; không tự cài apt). **86n2-P1 KHÔNG CÓ DỮ KIỆN MỚI — chuỗi GIỮ 17.**
- **84l10 PASS — chuỗi 3 → 4.** O8 T01 3/3 trên #123 (21/21 ×3). **O8 T8 KHÔNG CHẠY** (WebKit vắng #124).
- **T4-196: lượt yên #64 0/3 hợp lệ (chuỗi 1 → 0 ĐỨT); live-check #15 KHÔNG ĐẠT (chuỗi 10 → 0 ĐỨT); B2 dữ kiện thứ 8 LẪN LỘN — KHÔNG TÁCH. FULL PASS: KHÔNG CÓ** (chân b vắng; chuỗi full pass 1 → 0).
- **V2 (f'') replay 6/6** (164/171/178/183/188/196 — 196 @135 s); V1-300 4/6; V0 (c') 3/6; **0 FP trên 41 log sạch** (md5-unique, 40 → 41). **V4 3/3 kẹt mù; V2+V4 = 9/9.** V4 live 0 trigger 0 FP — NHƯNG không bắt kẹt #29 (không phải kẹt im lặng). **V4 GIỮ LIVE.**
- **Giả thuyết "thiếu scanner":** kẹt #29 xảy ra với gst-inspect CÓ + scanner VẮNG + dpkg yên → "thiếu bộ công cụ GStreamer" BỊ BÁC; scanner vắng riêng lẻ KHÔNG phân biệt kẹt/pass (3 PASS + 1 KẸT cùng điều kiện). **H3 GIỮ ỦNG HỘ MẠNH.**

## 1. Dòng thời gian (gọn)

- 14:30:16Z **#123** (bc09b26e). 14:35:51Z Đợt 196 mở. 14:41:22Z Selfcheck #1 trên #123 (libs 6/6, plugin 269, dpkg 1477, scanner VẮNG, gst-inspect CÓ). 14:41:43Z Waiter T8 khởi động (deadline 16:15Z). 14:41:58Z **POSTBOOT_PASS #123 CÓ** (T56-196, poll=0, replay-day-du). 14:43:14–14:48:54Z O8 T01 3/3 trên #123.
- 14:41:12Z T4 poller khởi động; cửa yên mở muộn (poll #78 15:40:01Z). Attempt1 15:40:01–15:44:37Z; attempt2 15:49:10–15:53:33Z; attempt3 15:56:35–16:00:57Z — cả 3 đều 20/20 nhưng lớp B vi phạm → 0/3 hợp lệ; poller thoát 16:00:57Z. 16:05:35Z Rebuild fixture xong (md5 khớp đợt 125).
- 16:15:04Z **Waiter HẾT HẠN poll=94 (t4=0, postboot=1)** — T8 chạy theo quyết (i)-143 (poller T4 đã thoát, 0 attempt live, lock trống). 16:16:29Z Kiểm scanner/dpkg trước pha: scanner VẮNG, gst-inspect CÓ, dpkg 1477, 0 apt/dpkg. 16:16:32Z Harness #123 start.
- 16:17:54Z 84l10 PASS. 16:19:28Z P4-lần1 đóng băng (playhead 0.533). 16:20:44Z WATCHDOG-137. 16:21:14Z probe 1+1 TIMEOUT. 16:21:43Z **B1 TRIGGER**. 16:21:51Z/16:25:53Z diag live. 16:20Z T4 .done (0/3 hợp lệ). 16:28:18Z **#124 — CELL MỚI** (btime; log cuối 16:28:54Z — lệch 36 s, xem F-196-T8-5). 16:36Z T01 đóng cờ (xác minh #124).
- 16:37:32Z Selfcheck #2 trên #124 (libs 6/6 THIẾU, plugin 0, dpkg 2, gst-inspect VẮNG). 16:37:46Z Rebuild fixture lần 2 xong (md5 khớp đợt 125). 16:40:19Z Chromium #124 start. 16:47:56Z ALL DONE (chromium 3/3). 16:5xZ replay + extract + LIMITS. **T8 đóng 16:59Z, TRONG hạn cờ ~17:00Z và hạn cứng 17:35:51Z.**

## A. O8 — T01 3/3 TRÊN #123; T8 KHÔNG CHẠY

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T01 WebKit attempt1 trên #123 | **21/21 PASS** — exit=0 14:45:19Z, JSON n=21 ok=21, md5 `3c98bdf2`, S1 PASS 14:43:59Z |
| 2 | O8 T01 WebKit attempt2 trên #123 | **21/21 PASS** — exit=0 14:47:17Z, JSON n=21 ok=21, md5 `6aa3b6e6`, S1 PASS 14:45:39Z |
| 3 | O8 T01 Chromium trên #123 | **21/21 PASS** — exit=0 14:48:54Z, JSON n=21 ok=21, md5 `9ddb5fa8`, S1 PASS 14:47:18Z |
| 4 | O8 T8 trên #124 | **KHÔNG CHẠY** — WebKit không chạy được (libwebkitgtk vắng); O8-Chromium đơn lẻ không chạy để giữ hạn cờ (F-196-T8-10) |

- O8 log T01: S1 PASS 6, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0. O8 DONE 14:48:54Z. Driver start 14:43:14Z với preview.tsx=591f9655, o8w=4994b4fc.
- **Cây O8 T01 KHÔNG giống cây harness:** media.ts đổi 14:43:14.760Z ngay lúc driver start (vite khởi động ~14:43:17Z, sau khi media đổi → nhiều khả năng O8 chạy trên media ac89aeb2); preview.tsx đổi tiếp 3 lần sau đó (xem §5). O8 T01 và harness KHÔNG cùng cây — như đợt 194.

## 2. Kết quả harness — KHÔNG ĐỦ 6/6 TRÊN 1 BOOT (1 KẸT MỚI + 1 CELL MỚI)

### 2a. Boot #123 (16:16:32–16:28:54Z) — WebKit 1/2 (1 PASS + 1 KẸT, pha chưa xong)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 16:16:32–16:17:54 | **PASS** — W1 ×3 PASS 16:16:51/56/17:03Z + W2 PASS 16:17:36Z + E4 PASS 16:17:46Z, live_diags=0 |
| 2 | WebKit 85m4 | — | 16:18:09–16:28:54 (log dừng) | **KẸT P4-lần1 — KẸT #29** — P1 PASS 16:18:46Z + P2 PASS 16:19:03Z + P3 PASS 16:19:27Z; P4 waitForPlaySync đóng băng playhead 0.533 từ elapsed=15s; WATCHDOG-137 16:20:44Z + probe TIMEOUT 16:21:14Z; **B1 TRIGGER 16:21:43Z**; log dừng 16:28:54Z do cell mới (elapsed=565s, run_len=111) — pha KHÔNG hoàn thành, không có exit |

### 2b. Boot #124 (16:40:23–16:47:56Z) — Chromium 3/3 PASS, WebKit KHÔNG CHẠY ĐƯỢC

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 3 | Chromium 84l10 | 0 | 16:40:23–16:41:33 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS, live_diags=0 |
| 4 | Chromium 85m4 | 0 | 16:41:49–16:43:49 | **PASS** — P1 PASS 16:42:20Z + P5 PASS 16:43:47Z, live_diags=0 |
| 5 | Chromium 86n2-hb128 | 0 | 16:44:05–16:47:56 | **PASS** — P1 PASS 16:44:37Z + P5 PASS 16:46:03Z + P6 KHÔNG-KẸT 16:47:46Z, live_diags=0 |

- **Kẹt harness cộng dồn 28 → 29 (1 kẹt mới). 84l10 PASS — chuỗi 3 → 4. 86n2-P1 KHÔNG CÓ DỮ KIỆN MỚI — chuỗi GIỮ 17** (86n2 WebKit không chạy trên cả 2 boot).
- RAM sampler #123 (n=25, suốt harness): balloon min 4.578.996 / max 5.674.892 kB (**88,1% trần**, pinned=0), avail min 478 MB (16:28:30Z) / max 1674 MB. Cao hơn đợt 195 (80,8%) — xem F-196-T8-4.
- RAM sampler #124 (n=16, chromium run): balloon min 5.100.212 / max **6.148.788 kB (95,4% trần)**, avail min 512 MB / max 1660 MB — cao nhất từng ghi; balloon đã 6.148.788 kB ngay lúc driver start (16:40:19Z, avail 667 MB) — cell mới bị balloon từ đầu.
- GATE-CHECK trước MỖI pha: #123: 2/2 lần "T4 khong giu lock" (load5 1,37 / 1,85) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 16:00:57Z). #124: 3/3 lần (load5 0,61 / 1,08 / 1,39). **0 vi phạm phía T8.**
- **Cảnh báo ALL DONE:** dòng `ALL DONE ... ec webkit: 84l10=0 85m4=0 86n2=0` của driver chromium-only là SAI GÂY HIỂU LẦM — webkit KHÔNG chạy, biến ec mặc định 0 (F-196-T8-2). Chỉ chromium ec=0 là thật.

## C. B1/B2 live + V2/V4 replay

### C1. Script md5 (đã đổi nhãn 196t8 — không đổi logic)

| Script | md5 | Byte | Ghi chú |
|---|---|---|---|
| diag-stall-196t8.sh | d6a4e104 | 2.292 | đổi nhãn 195t8 → 196t8; đã chạy live 2 lần trong pha kẹt #29 |
| check-fresh-196t8.py | 91f338ff | 10.214 | đổi nhãn 195t8 → 196t8; dùng cả offline (§C2) lẫn live (§C3) — không có file check-fresh-live riêng đợt này |
| extract-196t8.py | bc668bbb | 7.548 | đổi nhãn 195t8 → 196t8, SỬA WATCHDOG đọc archived #123 + chromium #124 (bản đã sửa này là bản chạy extract — xem F-196-T8-8) |
| wait-t4-t5-196t8.sh | 5f22ba7a | 3.948 | đổi nhãn 195t8 → 196t8 (deadline 16:15Z; quay 60 s) |
| run-webkit-196t8.sh | 3e5aa891 | 12.130 | đổi nhãn 195t8 → 196t8 (driver #123; LOCK=Vite T8 riêng ticket t8-round196) |
| run-chromium-196t8.sh | 3ac16aaa | 12.431 | MỚI — sao từ run-webkit-196t8.sh, comment 3 dòng run_one webkit, giữ 3 chromium; Xvfb :199 |
| replay-1c-196t8.py | 3a1bcd35 | 21.343 | đổi nhãn 195t8 → 196t8, thêm entry "196-sach-84l10" + "196-ket-85m4" (KHÔNG đổi tên entry cũ — bài học F-195-T8-1) |
| replay-f-fix-196t8.py | 1ee33d0d | 19.513 | đổi nhãn 195t8 → 196t8, thêm entry 196 (dòng 105–106) |
| run-diag-84l10-w2setup-196t8.sh | 77ca19af | 10.114 | driver diag W2-setup — KHÔNG chạy đợt này (xem §F) |
| build-84l10-w2setup-hb128.py | 646e17ec | 4.560 | build fixture diag W2-setup |
| selfcheck-postboot-196t8.sh | 6279854d | 2.299 | selfcheck #1/#2 |
| rebuild-fixtures-196t8.sh | 4655ff03 | 2.810 | rebuild fixture ×2 (16:05:35Z + 16:37:46Z) |
| verify-163-196t8.py | e074db98 | 2.616 | helper verify (không chạy đợt này) |
| symlink `t8-diag-stall.sh` | — | — | **ĐÃ SỬA** về diag-stall-196t8.sh ở cả 2 nơi (repo scripts + hidden-root) — trước đó trỏ bản 189/195 (F-196-T8-6) |

- Script điều khiển pha: 84l10 `16e5e957` (35.917 B) / 85m4 `3fb2548b` (**38.737 B — VƯỢT trần push**) / 86n2-hb128 `de925614` (**43.653 B — VƯỢT trần push**) / 86n2-std `628088bd`; 87o8-webkit `4994b4fc` / 87o8-headed `c8acd72e`; o8-s1-probe-196t8.mjs `453d1082` (**55.280 B — VƯỢT trần push**). **Cả 6 file điều khiển pha KHÔNG ĐỔI so với đợt 195** (md5 khớp) — kiểm chứng độc lập với cây đang đổi (preview/media).
- Báo cáo JSON ok=true (chỉ trích số 196): `l10-scratch` webkit #123 finishedAt 16:17:47Z; `l10-scratch-chromium` 16:41:24Z; `m4-scratch-chromium` 16:43:48Z; `n2-hb128-scratch-chromium` 16:47:46Z. **CẢNH BÁO STALE:** `m4-scratch/m4-webkit-w7-report.json` finishedAt 09:40:47Z và `n2-hb128-scratch/n2-webkit-w7-report.json` finishedAt 09:45:06Z là báo cáo 195 còn trong thư mục copy — KHÔNG phải số 196 (F-196-T8-8). Tương tự, o8 JSON stamp cũ đã được chuyển sang `o8-webkit/stale-195/` + `o8-chromium/stale-195/` trước khi chạy extract (extract hiện: O8 JSON stamped = 0).

### C2. Offline — 6 ca §C2 đóng băng: KHỚP HỆT đợt 186–195, ĐẠT

| Case | Log đóng băng | Kết quả (kiểm bằng check-fresh-196t8.py trên md5 gốc) |
|---|---|---|
| B2-1 setup | 84l10 WebKit @125 s | **TRIGGER @125 s** (maxspan=150 s, 124 dòng setupProject, via=f) — kiểm tra `run-setup` |
| B2-2 startPlaying | 86n2 WebKit @125 s | **TRIGGER @125 s** (maxspan=150 s, 116 dòng startPlaying, via=f) — kiểm tra `run-start` |
| B2-3 P6-wait-wd | 85m4 Chromium @125 s (P6 wd) | **TRIGGER @125 s** (maxspan=150 s, via=wd) |
| B2-4 P6-nowd | 86n2 Chromium @125 s (P6 no-wd) | **KHÔNG kích hoạt** (maxspan=150 s — giới hạn đã biết) |
| B2-5 P6-clean | 86n2 Chromium @85 s (P6 clean) | **KHÔNG kích hoạt** (maxspan=85 s) |
| B2-6 setup-clean | 84l10 Chromium @55 s (setup clean) | **KHÔNG kích hoạt** (maxspan=55 s) |

### C3. Live — B1 BẮT KẸT THẬT; B2 vùng mới 0 trigger

| Pha | setup (dòng) | startPlaying (dòng) | P6-wait (dòng) | Kết quả check-fresh |
|---|---|---|---|---|
| #123 WebKit 84l10 | 0 | 0 | — | OK (maxspan=0 s, wd=0, maxgap=12 s) |
| #123 WebKit 85m4 (KẸT #29) | 0 | 0 | — | **TRIGGER @135 s** (giống B1 live; max run span 550 s, run_len=111) |
| #124 Chromium 84l10 | 0 | 0 | 0 | OK (maxspan=0 s, wd=0, maxgap=10 s) |
| #124 Chromium 85m4 | 0 | 0 | 0 | OK (maxspan=10 s, wd=0, maxgap=6 s) |
| #124 Chromium 86n2 | 0 | 0 | 18 | OK (maxspan=85 s, wd=0, maxgap=7 s; P6-wait 5→90 s, biên 35 s, không FP) |

- **B1 live sạch: 3 ĐỨT — B1 BẮT ĐƯỢC KẸT THẬT LẦN ĐẦU.** Diag-stall live lần 1/2 16:21:51Z + lần 2/2 16:25:53Z (2 thư mục `smoke/stall-freshcontent-webkit-85m4-1795710111/` và `-1795710353/`). Diag #1: MemAvailable 817.928 kB, Balloon 5.308.644 kB (82,4% trần), swap dùng 365 MB, load 1.16/1.87/1.94, vite HTTP 200 (0,006 s), WebKitWebProcess RSS 250 MB, MiniBrowser RSS 160 MB, WATCHDOG-137 1, probe TIMEOUT 1.
- **B2 vùng mới (setup/startPlaying/P6-wait): 0 trigger trên cả 2 boot → B2 vùng mới sạch lần 10 (9 → 10).** Dữ kiện thứ 8 cho T4: LẪN LỘN (T4-196) → **B2 KHÔNG TÁCH VẪN ĐỨNG.**

### C4. Replay — V2 (f'') 6/6; V2+V4 = 9/9

| Kiểm tra | 196-sach-84l10 (md5 e64b070b) | 196-ket-85m4 (md5 742dea2c) | Cộng dồn |
|---|---|---|---|
| Replay-1c (c'): HB128 mỗi 5 s — 6 HB128, run span 0 s | KHÔNG kích hoạt (6 HB128, max run span 0 s) | KHÔNG kích hoạt cả LITERAL lẫn RUNSPAN (max run span 550 s, run_len=111 — (f) chặn vì seeking=true suốt run, cùng họ 171-ket) | V0 (c') 3/6 (lỡ 171, 183, 196) |
| Replay-f-fix (f') ≥180/300/600 s | KHÔNG kích hoạt | **KHÔNG kích hoạt** cả 3 mức (max run paused+seeking liên tục chỉ 5 s — paused=false suốt lúc đóng băng) | V1-300 (f' ≥300 s) 4/6 (lỡ 183, 196) |
| Replay-f-fix (f'') | KHÔNG kích hoạt | **TRIGGER @135 s** — miễn (f) khi watchdog đã kích hoạt | **V2 (f'') 6/6** (164/171/178/183/188/196 — @125 s/@135 s) |
| Replay-f-fix (f''') | KHÔNG kích hoạt | KHÔNG kích hoạt | — |

- **Số log sạch chuẩn (md5-unique): 40 → 41** (43 entry sạch, 41 unique; 196-sach-84l10 md5 e64b070b là duy nhất; 2 cặp trùng cũ 181/182 giữ nguyên: 166b271d, e11c62cb). **0 FP** trên toàn corpus sạch (corpus replay-f-fix: 52 entry = 43 sạch + 9 kẹt; 3 ca kẹt mù V4: 179/180/192).

### C5. V4 (f'''') — live 0 trigger / 0 FP; NHƯNG không bắt được kẹt #29

| Kiểm tra | 196-sach-84l10 | 196-ket-85m4 |
|---|---|---|
| silence gap tối đa | 12 s | **9 s** (HB128 chảy mỗi 5 s lúc kẹt) |
| V4 trigger | KHÔNG | **KHÔNG** — kẹt đóng băng playhead, không phải kẹt im lặng |

- V4 vẫn 3/3 kẹt mù (179 gap 723 s, 180 gap 718 s, 192 gap 793 s), 0 FP. **V2+V4 = 9/9** (trước đây 8/8). Biên V4 = 23 s (gap sạch tối đa 97 s).
- **V4 GIỮ LIVE.** Kẹt #29 nằm NGOÀI vùng phủ của V4 (im lặng) nhưng TRONG vùng phủ của V2 (đóng băng playhead + watchdog) — đã bắt bởi V2. V4 live vẫn 0 trigger / 0 FP trên Chromium #124 + 84l10 #123.

### C6. Giả thuyết "thiếu scanner" — PHÉP THỬ ĐỔI NGHĨA, KẾT LUẬN MỚI

- **Dữ kiện gốc:** 84l10 PASS 3 đợt liên tiếp (193/194/195) với scanner VẮNG → giả thuyết "thiếu scanner" CÀNG YẾU (lần 3). **Từ đợt 195, gst-inspect CÓ** (cài qua replay os-intent 08:37:34Z 26/11) nên phép thử đổi nghĩa: "thiếu bộ công cụ GStreamer" ≠ "thiếu gst-plugin-scanner".
- **Dữ kiện đợt 196:** kẹt #29 xảy ra với gst-inspect CÓ (1624 dòng) + scanner VẮNG + dpkg 1477 dòng ổn định + 0 apt/dpkg process. Kiểm scanner/dpkg: trước pha 16:16:29Z VẮNG/CÓ/1477/0 apt; giữa pha 16:21:02Z VẮNG/CÓ/1477/0 apt; 0 GStreamer-WARNING trong log 84l10.
- **Kết luận:** (a) **"Thiếu bộ công cụ GStreamer" BỊ BÁC** — kẹt #29 là ca kẹt ĐẦU TIÊN với gst-inspect CÓ; (b) **scanner vắng riêng lẻ KHÔNG phân biệt kẹt/pass** — cùng điều kiện vắng scanner: 3 PASS (193/194/195) + 1 KẸT (196); (c) giả thuyết không còn đứng như nguyên nhân — kẹt thuộc họ H3 (xem §B), không thuộc họ thiếu công cụ. T9-197 cần ghi nhận: từ nay phép thử "scanner vắng" chỉ còn là dữ kiện bối cảnh, không còn là phép thử giả thuyết.

## D. Điều tra 84l10 đợt 21 + KẸT #29 (85m4 P4-lần1)

- **D1 (84l10 ×3 lần chạy):** WebKit #123 PASS (16:16:51Z/56Z/17:03Z, delta +1 mỗi lần, hạ-cánh-về-target=true cả 3; playhead 1.4/1.5/2.1 → 2.1/2.5/2.767; ct 1.5/1.5/2.833); W2 PASS 16:17:36Z; E4 PASS 16:17:46Z; 0 lỗi; 0 GStreamer-WARNING. Chromium #124 PASS (W1 ×3 + W2 + E4). **84l10 PASS — chuỗi 3 → 4 (mốc parent (j)-195: chuỗi 2 → 3).** 84l10 vẫn là pha ỔN ĐỊNH NHẤT của harness (4/4 PASS kể từ đợt 193, sau kẹt #28 đợt 192, trên cả 2 engine).
- **D2 (kẹt 85m4 — 5/36 ≈ 14%):** 85m4 kẹt các đợt 164, 171, 178, 179, 196 (P4-lần1: 164, 171, 178, 196; P5: 179). Kẹt #29 đồng họ 171-ket (P4-lần1 waitForPlaySync, seeking=true suốt run) NHƯNG khác cờ paused: 196 paused=false (171 paused=true) → (f') không bắt được 196 (max run paused+seeking liên tục chỉ 5 s). **Chỉ (f'') bắt được** (nhờ watchdog đã kích hoạt) — bằng chứng trực tiếp cho quyết parent (j)-184 PROMOTE V2 (f'') làm phương án chính từ đợt 185.
- **D3 (bằng chứng đã lưu):** `smoke/archive-196-boot123/` — run-webkit-84l10-boot123.log (md5 e64b070b), run-webkit-85m4-boot123-ket.log (md5 742dea2c), run-webkit-summary-boot123.txt, ram-196t8-boot123.log, run-webkit-196t8-nohup-boot123.log (đã xóa 5 bản trùng tên không hậu tố). Log kẹt 124 dòng HB128; cuối log elapsed=565s run_len=111 span=550s.
- **D4 (so 192-ket):** 192-ket là 84l10 W2 @125 s; 196-ket là 85m4 P4-lần1 @135 s (kẹt giữa pha 85m4, sau 3 lần P1/P2/P3 PASS). Hai ca kẹt khác pha, khác call-site — không có mẫu kẹt lặp cùng call-site 2 đợt liên tiếp.

## B. H3 — WebKitGTK treo — GIỮ ỦNG HỘ MẠNH (kẹt #29 đúng chữ ký H3)

- Chữ ký kẹt #29: playhead đóng băng 0.533 (elapsed=15s → 565s), ct=0.3, seeking=true, paused=false, playing=true; evaluate im lặng >60 s (WATCHDOG-137 16:20:44Z); probe 1+1 TIMEOUT 30 s 16:21:14Z (kênh evaluate kẹt cứng / page JS chết); **vite HTTP 200** (vite sống — kẹt ở page/renderer, không phải vite); MiniBrowser sống (RSS 160 MB), WebKitWebProcess sống (RSS 250 MB); balloon 82,4% lúc diag (cao nhưng không OOM — avail 798 MB còn); load 1.16/1.87/1.94 (không bão CPU).
- Không phải H1 (máy đo yên — không chạy trong pha), không phải H2 (ENOSPC — journalctl chỉ ghi lỗi inotify watch của home-assistant-ensure.service, không phải lỗi harness), không phải thiếu scanner (xem §C6). **H3 là giải thích duy nhất khớp toàn bộ chữ ký.**

## E. Checklist (o) — các giá trị T8 cung cấp cho aggregate đợt 196 (T10 quyết)

- (a) Harness: WebKit 84l10 PASS + 85m4 KẸT #29 trên #123; Chromium 3/3 PASS trên #124; WebKit 86n2 + 2 pha WebKit còn lại KHÔNG CHẠY (cell mới). **KHÔNG 6/6.**
- (b) FULL PASS: **KHÔNG CÓ** (chân b vắng — T4 #64 0/3; chuỗi full pass 1 → 0).
- (j) 84l10 PASS chuỗi 3 → 4; 86n2-P1 KHÔNG CÓ DỮ KIỆN MỚI — chuỗi GIỮ 17; B2 vùng mới sạch lần 9 → 10; B1 live sạch 3 ĐỨT; V4 GIỮ LIVE (V2+V4 = 9/9).
- (m) Lượt yên #64: **KHÔNG CÓ LƯỢT HỢP LỆ** (T4-196: 0/3 attempt; attempt1 median 84,0 ms, B1+B2 vi phạm load1_max 6,55; attempt2 median 67,0 ms, B2 vi phạm 5,06; attempt3 median 67,0 ms, B2 vi phạm 5,42; cả 3 đều 20/20). Chuỗi lượt yên hợp lệ 1 → 0.
- (n) Stall/outage: KẸT #29 85m4 P4 (16:19:28Z, playhead đóng băng 550 s tới khi cell mới giết log 16:28:54Z). T7-196 xác minh stall/outage đợt này (cửa slot 196, HB/DR) — T8 chỉ cung cấp kẹt harness.
- (o) Live-check #15: **KHÔNG ĐẠT** (T4-196) — chuỗi live ĐẠT 10 → 0. V4 live 0 trigger 0 FP; B1 1 trigger thật.
- (p) Vi phạm: **T8 0 vi phạm** (gate-check 5/5 lần "T4 khong giu lock", 0 chồng lấn; vite nối tiếp; lock trống trước khi chạy).
- (E-247) T9-196: 0 CEIL cả 2 boot (#123 0/107 mẫu; #124 0/21 mẫu, max 6.157.328 kB) — ghim #120 không kéo dài qua reboot và không quay lại; E-247 giữ mở hay đóng thuộc parent.

## F. Diag W2-setup — DỪNG (không chạy đợt này)

- Diag W2-setup (run-diag-84l10-w2setup-196t8.sh, md5 77ca19af, 10.114 B + build-84l10-w2setup-hb128.py, md5 646e17ec, 4.560 B) KHÔNG chạy đợt này — không có ca kẹt 84l10 W2 để điều tra (84l10 PASS cả 2 engine); kẹt #29 thuộc 85m4 P4 (đã có diag live ×2 + WATCHDOG + probe TIMEOUT). Giữ script cho đợt sau.

## 5. Cây lúc đóng + md5 (kiểm lúc ~16:55Z)

- preview.tsx `af6c3cc7` (mtime 16:10:49Z, ổn định tới lúc đo); media.ts `ac89aeb2` (14:43:14.76Z); vite.config.ts `ee80d093` (không đổi). **Harness #123 + Chromium #124 cùng cây af6c3cc7/ac89aeb2/ee80d093.**
- Churn preview.tsx 5 lần trong phiên: 591f9655 → 558123e3 (14:51:38Z) → 0e60683b (15:09:20Z) → 03b6c941 (theo T4) → b2a2860b (15:23:42Z) → af6c3cc7 (16:10:49Z). media.ts 1 lần: 14baf831 → ac89aeb2 (14:43:14.76Z).
- Fixture rebuild 2 lần (16:05:35Z #123 + 16:37:46Z #124): md5 khớp đợt 125 cả 2 lần (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).
- /tmp bị xóa bởi cell mới (fixture mất) — đã rebuild lần 2. baseline-meminfo.txt bị EPERM lúc driver start 16:16 (cp /proc/meminfo thất bại "Permission denied" — file copy từ 195 không ghi đè được; meminfo lúc kẹt vẫn có trong diag dirs) — F-196-T8-9.
- O8 T01 vs harness KHÔNG cùng cây (xem §A). Cây lúc T4 đo yên: preview 03b6c941 → b2a2860b (đổi giữa các attempt — xem T4-196 LIMITS).

## 6. Dọn dẹp + kiểm cuối (extract-196t8.py, chạy 16:5xZ)

- ps sót T8: 0 (Xvfb :199, MiniBrowser, WebKitWebProcess, clicktest T8 — 0). X11 files: 0. Lock vite-lock-v2: TRỐNG (0 ticket + 90 cooldown).
- Symlink t8-diag-stall.sh: cả 2 nơi → diag-stall-196t8.sh (đã sửa, F-196-T8-6).
- Vite: không còn vite nào của T8 chạy (driver #123 chết theo cell mới; driver chromium đã exit sạch 16:47:56Z). Chrome/Chromium: 0 process T8 còn lại.
- Bằng chứng #123 đã archive trong smoke/archive-196-boot123/ (5 file). Stall dirs ×2 giữ nguyên trong smoke/.

## 7. Giới hạn

- Harness KHÔNG 6/6 trên 1 boot: WebKit 86n2 + 2 pha WebKit còn lại không chạy (cell mới); 85m4 #123 không có exit (pha chưa hoàn thành).
- O8 T8 KHÔNG CHẠY (WebKit vắng #124). O8 T01 3/3 trên #123 nhưng cây khác harness.
- WebKit trên #124 KHÔNG CHẠY ĐƯỢC — cần runtime/T56 khôi phục libs trước đợt sau; T8 không tự cài apt (luật đứng).
- POSTBOOT_PASS #124 CHƯA CÓ lúc T8 đóng (T56 chưa xác minh lại sau cell mới). Số hiệu #124 đã được T01 xác minh (611a02f2, btime 16:28:18Z).
- Sampler #123 n=25 (chỉ suốt harness); sampler #124 n=16 (chỉ chromium run) — không có sampler suốt phiên.
- Số liệu T4/T7/T2/T56/P1–P4 trích từ LIMITS/.done của họ (đã đọc), không đo lại.
- LIMITS này < trần push 37.768 B (kiểm sau khi ghi).

## 8. Sai số mới + nợ cũ

- **F-196-T8-1 (CELL MỚI, không phải reboot thường):** dpkg.log 1477 → 2 dòng, libs 6/6 THIẾU, journal chỉ 1 boot, /tmp trống; WebKit không chạy được trên #124. Mức: chặn harness WebKit. Giao T56/runtime khôi phục libs trước đợt 197.
- **F-196-T8-2 (DRIVER CHẾT THEO CELL MỚI + ALL DONE GÂY HIỂU LẦM):** 85m4 #123 không có exit (driver chết giữa pha); dòng ALL DONE của driver chromium-only ghi `ec webkit: 84l10=0 85m4=0 86n2=0` là SAI — webkit không chạy, biến ec mặc định 0. Driver sau nên khởi tạo ec=-1.
- **F-196-T8-3 (KẸT #29 — B1 bắt live lần đầu):** chuỗi live sạch 3 ĐỨT; V2 (f'') 6/6; (c') và (f') đều LỠ 196-ket ((f) chặn vì seeking=true; (f') miễn chỉ khi paused+seeking liên tục — 196 paused=false). Chỉ (f'') bắt được (nhờ watchdog đã kích hoạt).
- **F-196-T8-4 (BALLOON 95,4% TRẦN trên #124):** sampler n=16, max 6.148.788 kB; avail min 512 MB — cao nhất từng ghi; #123 cũng 88,1%. Ghi nhận, theo dõi.
- **F-196-T8-5 (BTIME #124 LỆCH 36 s — ĐÃ GIẢI THÍCH):** btime 16:28:18Z sớm hơn dòng log cuối 16:28:54Z — **đồng hồ guest chạy nhanh dần ~0,25 s/phút trước reboot (F-196-T9-4: lệch ~24–30 s lúc 16:28Z; kernel mới đọc lại RTC, offset về 0)** — btime #124 (RTC mới) là đúng; log 16:28:54Z bị lệch nhanh ~36 s (gồm cả độ trễ ghi log vài giây). Không cần xác minh thêm.
- **F-196-T8-6 (SYMLINK t8-diag-stall.sh TRỎ BẢN CŨ):** repo scripts trỏ bản 189, hidden-root trỏ bản 195 — **ĐÃ SỬA** về diag-stall-196t8.sh cả 2 nơi.
- **F-196-T8-7 (WAITER HẾT HẠN 16:15:04Z):** poll=94, t4=0 — chạy theo (i)-143 (T4 poller đã thoát 16:00:57Z, 0 attempt live, lock trống); T4 .done xuất hiện sau (16:20Z) — xác nhận 0/3 hợp lệ.
- **F-196-T8-8 (SCRATCH STALE TRONG COPY):** m4/n2 scratch còn báo cáo 195 (09:40:47Z/09:45:06Z); extract liệt kê — LIMITS chỉ trích số 196. Bài học: dọn scratch khi copy (như smoke).
- **F-196-T8-9 (BASELINE-MEMINFO EPERM):** cp /proc/meminfo thất bại lúc driver start 16:16 — file copy từ 195 không ghi đè được.
- **F-196-T8-10 (O8 T8 KHÔNG CHẠY):** WebKit vắng #124; O8-Chromium đơn lẻ không chạy để giữ hạn cờ.
- **Nợ cũ:** F-194-T8-2/4/5 vẫn mở (check-fresh file vắng; nhãn echo; run-chromium grep HB128). F-195-T8-2 (balloon 80,8%) → nay 88,1%/95,4% (nặng hơn). F-195-T8-3 (T4 gate mở muộn) → nay nặng hơn (poll #78 mới mở; waiter hết hạn). F-195-T8-4 (dpkg reset) → nay cell mới reset toàn bộ. F-193-T8-1 (waiter reboot) — vẫn chưa có dữ kiện (waiter đã hết hạn TRƯỚC reboot 16:28Z nên không kiểm được khởi động lại waiter).

## 9. Nợ / chờ parent (T10 quyết ở §14.2 aggregate 196)

- (j) V4 GIỮ LIVE? (đề xuất: GIỮ — 0 FP, V2+V4 9/9; kẹt #29 ngoài vùng phủ V4); 84l10 chuỗi 3 → 4; 86n2-P1 GIỮ 17 (không dữ kiện mới); B2 vùng mới sạch lần 9 → 10; B1 live sạch 3 ĐỨT.
- (b) FULL PASS KHÔNG CÓ (chân b vắng); (m) lượt yên #64 không hợp lệ; (o) live-check #15 KHÔNG ĐẠT.
- Cell mới #124: WebKit không chạy được — T56/runtime cần khôi phục libs (libwebkitgtk-6.0.so.4) trước đợt 197; nếu không, harness đợt sau chỉ có Chromium.
- Btime #124 lệch 36 s so với log cuối — ĐÃ GIẢI THÍCH (F-196-T8-5 + F-196-T9-4: đồng hồ guest chạy nhanh; btime RTC mới là đúng).
- Chờ push 191–196 = 67/235/170/150 (T01-196 đếm cuối, chuỗi khớp lần thứ 135); T8 đóng góp 1 LIMITS.
