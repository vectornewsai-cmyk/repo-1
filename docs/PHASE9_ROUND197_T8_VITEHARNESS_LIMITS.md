# Đợt 197 T8 — KẸT #30 MỚI (85m4 P2) — B1 BỎ LỠ LIVE (V2+V4 ĐỀU KHÔNG TRIGGER LIVE); V4 BẮT ĐƯỢC Ở REPLAY; WEBKIT CHẠY ĐƯỢC NHỜ DEBROOT; DRIVER ec=-1 ĐÃ VÁ + KIỂM CHỨNG

Ngày: 26/11/2026 (lượt cron 03:35:51 +07 = 20:35:51Z; T8 mở ~20:40Z, đóng ~22:30Z — TRONG hạn cờ ~23:00Z và hạn cứng 23:35:51Z).
Phạm vi: (1) khởi tạo ec=-1 cho driver (F-196-T8-2) + kiểm chứng; (2) harness trên boot mới nhất #125; (3) B1/B2 live; (4) V2 (f'') + V4 (f'''') replay; (5) O8 bộ thứ hai — KHÔNG CHẠY (T01 đã chạy, không trùng).
**Nguồn đứng:** §14.2 aggregate 196 **BẢN PARENT-ĐÃ-ĐÍNH-CHÍNH (84.800 B; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 138; nguồn gốc §14.2-196 CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18)**. Các mốc parent dùng: (j) V4 GIỮ LIVE, 84l10 chuỗi 3 → 4, 86n2-P1 GIỮ 17 (không dữ kiện mới), log sạch 40 → 41, B2 vùng mới sạch lần 10, B1 live sạch 3 ĐỨT; (b) FULL PASS KHÔNG CÓ, chuỗi 1 → 0; (r) T8-197 khởi tạo ec=-1 cho driver (F-196-T8-2); T56-197 khôi phục libs WebKit (nếu không, harness 197 chỉ có Chromium).

## 0. Kết luận ngắn — 1 KẸT MỚI; HARNESS 5/6; B1 BỎ LỠ KẸT LIVE LẦN ĐẦU

- **MỘT BOOT trong phiên: #125 `8304fcd1`** (btime 20:27:48Z, T01-197 xác minh 9 nguồn tươi; gap #124→#125 = 14.370 s). POSTBOOT_PASS #125 CÓ 21:28:14Z (T56 viết tay, poll=1, repair-som-quyet-h; dpkg 777; GST symlink → debroot). **#124 KHÔNG CÓ cờ** (chết trước khi T56 mở; tổng boot không cờ 30 → 31).
- **HARNESS #125 (21:49:01–22:17:58Z): WebKit 84l10 PASS** (exit=0, live_diags=0); **WebKit 85m4 KẸT P2-lần1 (KẸT #30 — cộng dồn 29 → 30)**, exit=124; **WebKit 86n2 PASS** (exit=0, live_diags=0); **Chromium 3/3 PASS** (exit=0 cả 3, live_diags=0). **KHÔNG 6/6.**
- **B1 BỎ LỠ KẸT #30 LIVE — LẦN ĐẦU B1 IM LẶNG TRƯỚC KẸT THẬT.** check-fresh live: OK maxspan=5s wd=3 maxgap=60s (21:54:23Z) — V2 (f'') không trigger (HB128 NGỪNG CHẢY sau khi page chết, không có trailing run ≥120 s); V4 (f'''') không trigger live (gap trong-log mới 60 s < 120 s; gap chỉ đóng ở 760 s khi log khép lại sau timeout). Kẹt chỉ được bắt live bởi **WATCHDOG-137 21:52:27Z + LIVE-DIAG-189 ×2 (21:54:59Z + 21:59:01Z) + timeout 124**. **Chuỗi live sạch GIỮ 0.**
- **V4 BẮT ĐƯỢC #30 Ở REPLAY (TRIGGER gap=760s, detect_at 21:54:57Z) — V4 4/4 kẹt mù; V2+V4 = 10/10; 0 FP trên 42 log sạch duy nhất.**
- **84l10 PASS — chuỗi 4 → 5. 86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 22:06:31Z trên WebKit #125 → chuỗi 17 → 18** (lần đầu có dữ kiện mới kể từ đợt 195).
- **WebKit CHẠY ĐƯỢC trên #125 NHỜ DEBROOT** (không phải libs hệ thống): driver đã vá LD_LIBRARY_PATH + GST_PLUGIN_PATH → debroot cho 3 pha WebKit (F-197-T8-1); launch-test headed PASS (version 27.2, evaluate 1+1=2). Headless WPE FAIL là đường khác, không đại diện.
- **Driver ec=-1 (F-196-T8-2) ĐÃ VÁ + KIỂM CHỨNG CHỨC NĂNG + KIỂM CHỨNG TRÊN HARNESS THẬT:** ALL DONE 22:17:58Z ghi đúng `85m4=124` (không còn 0 gây hiểu lầm).
- **T4-197: lượt yên #65 CÓ LƯỢT HỢP LỆ (attempt2; chuỗi 0 → 1); live-check #16 ĐẠT (chuỗi 0 → 1); B2 dữ kiện thứ 9: CẢ 2 CỬA SỔ ĐỀU 0 SPIKE — không có spike nào để phân loại (không phải spike tự-tải, không phải lẫn lộn); B2 KHÔNG TÁCH vẫn đứng. FULL PASS: KHÔNG CÓ** (chân O8 vắng + chân harness kẹt #30).
- **O8 T01 2/3 trên #125** (WebKit a1 FAIL harness timeout 0 result, a2 PASS 21/21, Chromium PASS 21/21). **O8 T8 KHÔNG CHẠY** (T01 đã chạy — không trùng).
- **T8 0 vi phạm** (gate-check 6/6 lần "T4 khong giu lock", 0 chồng lấn attempt T4; T56 ghi nhận "t8-197 acquire lock 21:49:01Z (sau khi T56 xong, 0 chồng lấn)").

## 1. Dòng thời gian (gọn)

- 20:27:48Z **#125** (8304fcd1). 20:35:51Z Đợt 197 mở. 20:40Z T4 poller khởi động (gate A ĐÓNG, RAM avail 578 MB). 20:41:28Z T01 survey khớp 9 nguồn. 20:43:23Z Selfcheck #1 của T8 (libs 6/6 THIẾU, GST 0, dpkg 2). 20:43:33Z T4 launch-test PASS (o8env). 20:43:41–20:50:33Z O8 T01 (a1 FAIL, a2 PASS, Chromium PASS). 20:45:32Z Waiter T8 khởi động (deadline 22:15Z). 20:45:21Z Watcher-197 START. 20:45:51Z EARLY-REPAIR TRIGGER (T56). 21:10:52Z apt-get update TIMEOUT 1500 s (watcher repair thất bại). 21:19:39Z T56 chạy tay apt-get update exit=0. 21:24:17Z postboot --repair exit=0. 21:24:31Z verify độc lập exit=0. 21:28:14Z **POSTBOOT_PASS #125 CÓ (T56 viết tay, poll=1)**. 21:28:40–43Z libwebkitgtk-6.0-4 cài xong (dpkg 777 → 887).
- 21:26:51–21:30:24Z T4 attempt1 20/20 NHƯNG B4 VI PHẠM (dpkg delta +110 — T56 cài lib trong cửa sổ; F-197-T2-1). 21:30:48–21:34:18Z T4 attempt2 20/20 + lớp B 5/5 + tickCost median 47,0 ms — **LƯỢT HỢP LỆ, poller thoát**. 21:45Z T4 LIMITS (36.723 B). 21:47Z T4 .done.
- 21:47:39Z **Waiter GATE-FOUND poll=63** (t4=OK, postboot đường (a), t4attempt=no-lock). 21:48:48Z Selfcheck #2 của T8 (libs 6/6 CÓ, GST 269, dpkg 887). 21:48:58Z Driver harness start.
- 21:49:01–21:50:22Z WebKit 84l10 PASS. 21:50:37Z WebKit 85m4 start; 21:51:11Z P1 PASS; 21:51:12Z P2-phaseB đóng băng (playhead 0.167); 21:52:27Z WATCHDOG-137; 21:52:57Z probe TIMEOUT; 21:54:59Z LIVE-DIAG lan 1/2; 21:59:01Z LIVE-DIAG lan 2/2; 22:05:41Z **TIMEOUT 124 — KẸT #30**. 22:05:56–22:10:18Z WebKit 86n2 PASS. 22:10:33–22:17:58Z Chromium 3/3 PASS. 22:17:58Z ALL DONE. **T8 đóng ~22:30Z, TRONG hạn cờ ~23:00Z và hạn cứng 23:35:51Z.**

## A. O8 — T01 2/3 TRÊN #125; T8 KHÔNG CHẠY

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T01 WebKit attempt1 trên #125 | **FAIL — exit=2** — HARNESS LỖI "timeout chờ project mẫu tự load (3 clip, media bin 2 item) (last=null)"; JSON n=0 result; S1 probe sau đó PASS |
| 2 | O8 T01 WebKit attempt2 trên #125 | **21/21 PASS** — exit=0 21:49:36Z, JSON n=21 ok=21 (stamp 20:48:08, pid 8288), S1 PASS |
| 3 | O8 T01 Chromium trên #125 | **21/21 PASS** — exit=0 20:50:33Z, S1 PASS |
| 4 | O8 T8 (bộ thứ hai) | **KHÔNG CHẠY** — T01 đã chạy O8 trong phiên (brief: chạy bộ thứ hai nếu T01 chưa chạy; không chạy trùng). WebKit nay chạy được nhờ debroot nhưng không chạy thêm để giữ hạn cờ + tránh trùng |

- O8 DONE 20:50:33Z webkit1=2 webkit2=0 chromium=0. **Chân FULL PASS O8 KHÔNG ĐẠT (2/3)** — T4-197 .done + T01-197 .done đồng thuận.
- Cây O8 T01: preview.tsx=af6c3cc7 (cùng cây harness — lần đầu O8 và harness cùng cây kể từ đợt 194).

## 2. Kết quả harness — 5/6 TRÊN 1 BOOT (1 KẸT MỚI #30)

### 2a. Boot #125 (21:49:01–22:17:58Z) — WebKit 2/3 (2 PASS + 1 KẸT), Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 21:49:01–21:50:22 | **PASS** — W1 ×3 PASS 21:49:19/24/30Z + W2 PASS 21:50:03Z + E4 PASS 21:50:13Z, live_diags=0 |
| 2 | WebKit 85m4 | 124 | 21:50:37–22:05:41 | **KẸT P2-lần1 — KẸT #30** — P1 PASS 21:51:11Z; P2-phaseB đóng băng playhead 0.167 từ elapsed=5s; HB128 NGỪNG sau 21:51:27Z; WATCHDOG-137 21:52:27Z + probe TIMEOUT 21:52:57Z; LIVE-DIAG ×2; timeout 124 22:05:41Z; report ok=False |
| 3 | WebKit 86n2-hb128 | 0 | 22:05:56–22:10:18 | **PASS** — **P1 PASS 22:06:31Z (DỮ KIỆN MỚI — chuỗi 86n2-P1 17 → 18)** + P5 PASS 22:08:28Z + P6 KHÔNG-KẸT 22:10:10Z, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 22:10:33–22:11:34 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 22:11:49–22:13:51 | **PASS** — P1 PASS + P5 PASS 22:13:49Z, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 22:14:06–22:17:58 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn 29 → 30 (1 kẹt mới). 84l10 PASS — chuỗi 4 → 5. 86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 17 → 18.**
- RAM sampler #125 (n=59, suốt harness): balloon min 4.920.500 / max **5.904.204 kB (91,6% trần)**, mean 5.459.859, pinned=0; avail min **247 MB (22:01:59Z, trong lúc kẹt)** / max 1562 MB. Thấp hơn đợt 196 trên #124 (95,4%) nhưng cao hơn #123 (88,1%); avail min 247 MB thấp hơn mọi mức avail min đợt 196 (478 MB trên #123, 512 MB trên #124).
- GATE-CHECK trước MỖI pha: 6/6 lần "T4 khong giu lock" (load5 0,73–2,36) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 21:34:44Z, .done 21:47Z; T56 ghi nhận 0 chồng lấn lúc acquire 21:49:01Z). **T8 0 vi phạm.**
- **ALL DONE 22:17:58Z ghi đúng `ec webkit: 84l10=0 85m4=124 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0`** — fix ec=-1 kiểm chứng trên harness thật (xem §C1).

## C. B1/B2 live + V2/V4 replay

### C1. Script md5 (đã đổi nhãn 197t8 — không đổi logic, trừ 3 chỗ ghi rõ)

| Script | md5 | Byte | Ghi chú |
|---|---|---|---|
| check-fresh-197t8.py | 08c1c779 | 10.214 | đổi nhãn 196t8 → 197t8 (logic giữ nguyên) |
| diag-stall-197t8.sh | 8212f0f2 | 2.292 | đổi nhãn |
| extract-197t8.py | 41e4c271 | 7.913 | đổi nhãn + SỬA: O8 tolerant (T8 không chạy O8), đường log WATCHDOG theo boot đơn, WAIT1 boot 8304fcd1 |
| wait-t4-t5-197t8.sh | 17c2df15 | 3.948 | đổi nhãn + deadline 22:15Z |
| run-webkit-197t8.sh | a76868a1 | 13.295 | **VÁ ec=-1 (F-196-T8-2) + VÁ DEBROOT cho 3 pha WebKit (F-197-T8-1)** |
| run-chromium-197t8.sh | c577febe | 12.801 | **VÁ ec=-1 (F-196-T8-2: init -1 + xóa 3 dòng EC=$? stray)**; KHÔNG debroot (chromium tự bundle) |
| replay-1c-197t8.py | fe133a51 | 21.552 | đổi nhãn + thêm entry 197 (KHÔNG đổi tên entry cũ — bài học F-195-T8-1) + SỬA 2 đường dẫn 196 về round196-t8 (sed relabel đổi nhầm) |
| replay-f-fix-197t8.py | 03b77834 | 19.722 | như replay-1c |
| launch-test-webkit-197t8.mjs | d683e4d0 | ~1.100 | MỚI — launch-test headed debroot (PASS) |
| run-diag-84l10-w2setup-197t8.sh | 30ba025d | 10.114 | driver diag W2-setup — KHÔNG chạy đợt này (xem §F) |
| build-84l10-w2setup-hb128.py | 646e17ec | 4.560 | KHÔNG ĐỔI md5 so với đợt 196 |
| selfcheck-postboot-197t8.sh | 144d9458 | 2.299 | đổi nhãn; nhãn echo T8-196 → T8-197 |
| rebuild-fixtures-197t8.sh | 296acf8a | 2.810 | đổi nhãn |
| verify-163-197t8.py | 1164e285 | 2.616 | đổi nhãn (không chạy đợt này) |
| o8-driver-197t8.sh | 809a5b69 | 6.660 | đổi nhãn — KHÔNG CHẠY đợt này (T01 đã chạy O8) |
| o8-s1-probe-197t8.mjs | 453d1082 | 55.280 | KHÔNG ĐỔI md5 so với đợt 196 (**VƯỢT trần push** — file cũ, không đổi) |
| symlink `t8-diag-stall.sh` | — | — | **ĐÃ SỬA** về diag-stall-197t8.sh ở cả 2 nơi (repo scripts + hidden-root) |

- Script điều khiển pha: 84l10 `16e5e957` (35.917 B) / 85m4 `3fb2548b` (**38.737 B — VƯỢT trần push**) / 86n2-hb128 `de925614` (**43.653 B — VƯỢT trần push**) / 86n2-std `628088bd`; 87o8-webkit `4994b4fc` / 87o8-headed `c8acd72e`. **Cả 6 file điều khiển pha KHÔNG ĐỔI so với đợt 196** (md5 khớp).
- Báo cáo JSON ok=true (chỉ trích số 197): `l10-scratch` webkit finishedAt 21:50:14Z; `l10-scratch-chromium` 22:11:32Z; `m4-scratch-chromium` 22:13:49Z; `n2-hb128-scratch-chromium` 22:17:48Z; `n2-hb128-scratch` webkit 22:10:12Z. `m4-scratch` webkit ok=False finishedAt 22:05:38Z (kẹt #30). **KHÔNG có báo cáo stale** (scratch mới hoàn toàn đợt này — không copy từ đợt trước).

### C2. Offline — 6 ca §C2 đóng băng: KHỚP HỆT đợt 186–197, ĐẠT

| Case | Log đóng băng | Kết quả (kiểm bằng check-fresh-197t8.py trên md5 gốc) |
|---|---|---|
| B2-1 setup | 84l10 WebKit @125 s | **TRIGGER @125 s** (maxspan=150 s, 124 dòng setupProject, via=f) — kiểm tra `run-setup` |
| B2-2 startPlaying | 86n2 WebKit @125 s | **TRIGGER @125 s** (maxspan=150 s, 116 dòng startPlaying, via=f) — kiểm tra `run-start` |
| B2-3 P6-wait-wd | 85m4 Chromium @125 s (P6 wd) | **TRIGGER @125 s** (maxspan=150 s, via=wd) |
| B2-4 P6-nowd | 86n2 Chromium @125 s (P6 no-wd) | **KHÔNG kích hoạt** (maxspan=150 s — giới hạn đã biết) |
| B2-5 P6-clean | 86n2 Chromium @85 s (P6 clean) | **KHÔNG kích hoạt** (maxspan=85 s) |
| B2-6 setup-clean | 84l10 Chromium @55 s (setup clean) | **KHÔNG kích hoạt** (maxspan=55 s) |

### C3. Live — B1 BỎ LỠ KẸT #30; B2 vùng mới 0 trigger

| Pha | HB128 (dòng) | Kết quả check-fresh |
|---|---|---|
| #125 WebKit 84l10 | 6 | OK (maxspan=0 s, wd=0, maxgap=11 s) |
| #125 WebKit 85m4 (KẸT #30) | 7 | **TRIGGER silence=760s (CHỈ Ở REPLAY — live: OK maxspan=5s wd=3 maxgap=60s)** — xem F-197-T8-3 |
| #125 WebKit 86n2 | 21 sampleFor + 4 waitForPlaySync + 18 P6-wait | OK (maxspan=85 s, wd=0, maxgap=8 s; P6-wait 5→90 s, biên 35 s, không FP) |
| #125 Chromium 84l10 | 5 | OK (maxspan=0 s, wd=0, maxgap=7 s) |
| #125 Chromium 85m4 | 19 | OK (maxspan=10 s, wd=0, maxgap=6 s) |
| #125 Chromium 86n2 | 21 sampleFor + 18 P6-wait | OK (maxspan=85 s, wd=0, maxgap=7 s; P6-wait 5→90 s, không FP) |

- **B1 live: KHÔNG bắt được kẹt #30 — chuỗi live sạch GIỮ 0.** 84l10 sạch riêng không tăng chuỗi đợt vì đợt có kẹt (quy tắc chuỗi theo đợt như (j)-195/(j)-196). Diag live ×2 là LIVE-DIAG-189 (mtime im lặng), KHÔNG phải B1/check-fresh.
- **B2 vùng mới (setup/startPlaying/P6-wait): 0 trigger trên cả 6 pha → B2 vùng mới sạch lần 11 (10 → 11).**
- Diag-stall live: lần 1/2 21:54:59Z (im lặng 122 s, devUrl http://127.0.0.1:5490/) + lần 2/2 21:59:01Z (im lặng 364 s) + diag WATCHDOG trong-script 21:52:27Z + diag sau timeout-124 (bước 4). Tổng 4 thư mục stall.

### C4. Replay — V2 (f'') 6/6 trong lớp HB128 (LỠ #30 — ngoài lớp); V2+V4 = 10/10

| Kiểm tra | 197-sach-84l10 (md5 1b66afc6) | 197-ket-85m4 (md5 45899727) | Cộng dồn |
|---|---|---|---|
| Replay-1c (c') | KHÔNG kích hoạt | KHÔNG kích hoạt (như 171, 179 — (c') lỡ kẹt HB128 ngừng) | V0 (c') 3/6 (lỡ 171, 179, 197) |
| Replay-f-fix (f') ≥180/300/600 s | KHÔNG kích hoạt | **KHÔNG kích hoạt** cả 3 mức | V1-300 (f' ≥300 s) 4/6 |
| Replay-f-fix (f'') | KHÔNG kích hoạt | **KHÔNG kích hoạt** (maxspan=5 s — HB128 ngừng, không có trailing run) | **V2 (f'') 6/6 trong lớp HB128** (164/171/178/183/188/196); #30 ngoài lớp |
| Replay-f-fix (f''') | KHÔNG kích hoạt | KHÔNG kích hoạt | — |
| Replay-f-fix V4 (f'''') | KHÔNG kích hoạt (gap=11 s) | **TRIGGER gap=760 s** (detect_at 21:54:57Z) | **V4 4/4 kẹt mù** (179/180/192/197) |

- **Số log sạch chuẩn (md5-unique): 41 → 42** (44 entry sạch, 42 unique; 197-sach-84l10 md5 1b66afc6 là duy nhất; 2 cặp trùng cũ 181/182 giữ nguyên: 166b271d, e11c62cb). **0 FP** trên toàn corpus sạch (corpus replay-f-fix: 54 entry = 44 sạch + 10 kẹt).
- **LƯU Ý — bộ đếm tóm tắt trong replay-f-fix-197t8.py ĐÃ LỖI THỜI (F-197-T8-5):** script in "V2 bắt kẹt có HB128: 5/5", "V4 bắt kẹt mù: 4/3", "KẾT HỢP V2+V4: 9/8 kẹt — KHÔNG ĐẠT" — các mẫu số cứng 5/3/8 từ lúc corpus có 8 kẹt; corpus nay có 10 kẹt (6 lớp HB128 + 4 lớp im lặng). Số ĐÚNG tính tay: V2 6/6 + V4 4/4 = **V2+V4 10/10**, 0 FP. T8-196 đã tính tay 9/9 tương tự.

### C5. V4 (f'''') — bắt #30 Ở REPLAY; KHÔNG bắt được live (giới hạn đã biết nay thành hiện thực)

| Kiểm tra | 197-sach-84l10 | 197-ket-85m4 |
|---|---|---|
| silence gap tối đa | 11 s | **760 s** (21:52:57Z → 22:05:38Z) |
| V4 trigger (replay) | KHÔNG | **TRIGGER — gap 760 s, detect_at 21:54:57Z** |

- V4 nay 4/4 kẹt mù (179 gap 723 s, 180 gap 718 s, 192 gap 793 s, **197 gap 760 s**), 0 FP. **V2+V4 = 10/10.** Biên V4 = 23 s (gap sạch tối đa 97 s).
- **V4 GIỮ LIVE (đề xuất).** Nhưng #30 phơi bày giới hạn live của V4: V4 đo gap GIỮA các dòng log — log đóng băng thì gap không đóng lại cho tới khi process chết (timeout) viết dòng cuối. Live, V4 không thể trigger trước timeout; chỉ WATCHDOG-137 + LIVE-DIAG-189 (mtime) bắt được live. Muốn B1 bắt được dạng kẹt này live, cần trigger theo đồng hồ treo (wall-clock silence) chứ không theo gap trong-log — giao parent/T8-198 xem xét (xem F-197-T8-3).

### C6. Debroot — WebKit chạy được nhờ libs debroot; "thiếu scanner" vẫn bị bác

- **Dữ kiện gốc:** 84l10 PASS 3 đợt liên tiếp (193/194/195) với scanner VẮNG → giả thuyết "thiếu scanner" đã bị bác đợt 196 (kẹt #29 xảy ra với gst-inspect CÓ).
- **Dữ kiện đợt 197:** T56 cài apt xong 21:28:43Z (libwebkitgtk-6.0-4 2.52.6 + libjavascriptcoregtk-6.0-1; libs hệ thống 6/6 CÓ lúc selfcheck #2) — NHƯNG **gst-plugin-scanner vẫn VẮNG + gst-inspect-1.0 vẫn VẮNG** (gstreamer1.0-tools chưa cài). Cùng điều kiện scanner vắng: 84l10 PASS + 86n2 PASS + Chromium 3/3 PASS + 85m4 KẸT #30. **Scanner vắng riêng lẻ KHÔNG phân biệt kẹt/pass — giả thuyết "thiếu scanner" vẫn bị bác (lần 2).**
- **Debroot là đường chạy WebKit trên boot này:** `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu` (348 file; GST 269 plugin; có libevent/libEGL/libavif/libdw/libevdev/libgstreamer; KHÔNG có libwebkitgtk hệ thống — MiniBrowser dùng lib bundle trong webkit-2388/minibrowser-gtk/lib/). T56 còn symlink GST hệ thống → debroot (269 file) lúc 20:45Z. Driver T8 vá LD_LIBRARY_PATH + GST_PLUGIN_PATH/SYSTEM_PATH → debroot cho 3 pha WebKit (xem F-197-T8-1). **Launch-test headed PASS** (version 27.2, evaluate 1+1=2, +6,8 s); launch-test headless WPE FAIL (thiếu libgstreamer — minibrowser-wpe là binary khác, không phải đường harness dùng; harness chạy headed qua Xvfb :199).

## D. Điều tra 84l10 đợt 21 + KẸT #30 (85m4 P2-lần1)

- **D1 (84l10 ×2 lần chạy):** WebKit #125 PASS (W1 ×3 21:49:19/24/30Z, delta +1 mỗi lần, hạ-cánh-về-target=true cả 3; W2 PASS 21:50:03Z; E4 PASS 21:50:13Z; 0 lỗi; 0 GStreamer-WARNING). Chromium #125 PASS (W1 ×3 + W2 + E4). **84l10 PASS — chuỗi 4 → 5 (mốc parent (j)-196: chuỗi 3 → 4).** 84l10 vẫn là pha ỔN ĐỊNH NHẤT của harness (5/5 PASS kể từ đợt 193, sau kẹt #28 đợt 192, trên cả 2 engine).
- **D2 (kẹt 85m4 — 6/37 ≈ 16%):** 85m4 kẹt các đợt 164, 171, 178, 179, 196, 197 (P4-lần1: 164, 171, 178, 196; P5: 179; **P2-lần1: 197 — lần đầu kẹt ở P2**). Kẹt #30 khác họ 171-ket và 196-ket ở điểm then chốt: **HB128 NGỪNG CHẢY** (7 dòng, dòng cuối elapsed=15s 21:51:27Z) thay vì chảy tiếp với playhead đóng băng — page JS chết + kênh evaluate chết (probe TIMEOUT). (f) và (f') đều không bắt được vì không có run dài; chỉ (f'''') bắt được (gap 760 s). **#30 là kẹt LAI: playhead đóng băng (lớp V2) + im lặng (lớp V4) — và nó thuộc lớp V4 về mặt phát hiện.**
- **D3 (bằng chứng đã lưu):** `smoke/` — run-webkit-84l10.log (md5 1b66afc6), run-webkit-85m4.log (md5 45899727), run-webkit-86n2-hb128.log (md5 b4c074a1), 3 log chromium, ram-197t8.log (n=59), run-webkit-summary.txt, 4 thư mục stall (`stall-runEngine_496-1795729947`, `stall-live-silence-webkit-85m4-1795730099`, `stall-live-silence-webkit-85m4-1795730341`, `stall-webkit-85m4-timeout124-1795730741`). Log kẹt: 7 dòng HB128; cuối log elapsed=900s (timeout).
- **D4 (so 196-ket):** 196-ket là 85m4 P4-lần1 @135 s, HB128 chảy (run_len=111, span=550 s), (f'') bắt được. 197-ket là 85m4 P2-lần1, HB128 ngừng sau 15 s, (f'') LỠ, (f'''') bắt được ở replay. Hai ca kẹt khác pha, khác chữ ký — không có mẫu kẹt lặp cùng call-site 2 đợt liên tiếp (P4 → P2).

## B. H3 — WebKitGTK treo — GIỮ ỦNG HỘ MẠNH (kẹt #30 đúng chữ ký H3, biến thể im lặng)

- Chữ ký kẹt #30: playhead đóng băng 0.167 (elapsed=5s → 900s), ct=0.167, seeking=true, paused=false (suy ra từ P2-phaseB), playing=true; evaluate im lặng >60 s (WATCHDOG-137 21:52:27Z); probe 1+1 TIMEOUT 30 s 21:52:57Z (kênh evaluate kẹt cứng / page JS chết); **vite HTTP 200** cả 3 diag lúc kẹt (vite sống — kẹt ở page/renderer, không phải vite; http 000 chỉ sau khi timeout giết vite); MiniBrowser sống (RSS ~164 MB), WebKitWebProcess sống (RSS ~294 MB lúc diag); balloon 82,4% → 91,6% lúc diag (cao nhưng không OOM — avail còn 332 MB lúc diag #3, 247 MB lúc sampler min); load 0,11–0,60 lúc kẹt (không bão CPU).
- Không phải H1 (máy đo yên — T4 đã đóng, poller thoát 21:34:44Z), không phải H2 (ENOSPC — dpkg 887 dòng ổn định trong lúc kẹt, không có lỗi inotify mới trong diag), không phải thiếu scanner (xem §C6). **H3 là giải thích duy nhất khớp toàn bộ chữ ký.**

## E. Checklist (o) — các giá trị T8 cung cấp cho aggregate đợt 197 (T10 quyết)

- (a) Harness: WebKit 84l10 PASS + 85m4 KẸT #30 + 86n2 PASS trên #125; Chromium 3/3 PASS trên #125; **5/6 — KHÔNG 6/6.**
- (b) FULL PASS: **KHÔNG CÓ** (chân O8 vắng — T01 2/3; chân harness kẹt #30; chuỗi full pass GIỮ 0).
- (j) 84l10 PASS chuỗi 4 → 5; **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS → chuỗi 17 → 18**; B2 vùng mới sạch lần 10 → 11; B1 live sạch GIỮ 0 (B1 bỏ lỡ kẹt #30 live); V4 GIỮ LIVE (V2+V4 = 10/10); V2 VẪN là phương án chính trong lớp HB128 (6/6).
- (m) Lượt yên #65: **CÓ LƯỢT HỢP LỆ** (T4-197: attempt2 hợp lệ, chuỗi 0 → 1; attempt1 20/20 nhưng B4 vi phạm). Live-check #16: **ĐẠT** (T4-197; chuỗi 0 → 1). P3' cộng dồn MỚI 52 lượt (T4-197 .done).
- (n) Stall/outage: KẸT #30 85m4 P2 (21:51:12Z, playhead đóng băng tới timeout 22:05:41Z). Lặng scheduler #C 8.404 s bao trùm btime #125 (T01/T2-197 — phân loại thuộc T7-197 + parent). T7-197 xác minh stall/outage đợt này (cửa slot 197, HB/DR) — T8 chỉ cung cấp kẹt harness.
- (o) Auto-trigger GIỮ LIVE (T9-197 chưa đóng lúc T8 đóng — số mẫu đợt này xem LIMITS T9-197; trong cửa sổ T4: 8 mẫu, 0 FIRE).
- (p) Vi phạm: **T8 0 vi phạm** (gate-check 6/6 lần "T4 khong giu lock", 0 chồng lấn; vite nối tiếp; lock trống trước khi chạy). F-197-T2-1 (T56 B4) thuộc sổ T2 — chuỗi 0 vi phạm 1 → 0 nếu parent chấp nhận (đề xuất T2-197).
- (E-247) ĐÃ ĐÓNG đợt 196 — không có dữ kiện mới đợt này (T9-197 chưa đóng; xem LIMITS T9-197).

## F. Diag W2-setup — DỪNG (không chạy đợt này)

- Diag W2-setup (run-diag-84l10-w2setup-197t8.sh, md5 30ba025d, 10.114 B + build-84l10-w2setup-hb128.py, md5 646e17ec, 4.560 B) KHÔNG chạy đợt này — không có ca kẹt 84l10 W2 để điều tra (84l10 PASS cả 2 engine); kẹt #30 thuộc 85m4 P2 (đã có diag live ×2 + WATCHDOG + probe TIMEOUT + diag sau timeout). Giữ script cho đợt sau.

## 5. Cây lúc đóng + md5 (kiểm lúc ~22:20Z)

- preview.tsx `af6c3cc7` (mtime 16:10:49Z, ổn định suốt phiên); media.ts `ac89aeb2` (14:43:14.76Z); vite.config.ts `ee80d093` (không đổi). **Harness #125 (cả WebKit lẫn Chromium) cùng cây af6c3cc7/ac89aeb2/ee80d093 — và O8 T01 cũng cùng cây này.**
- Fixture rebuild 1 lần (20:43Z): md5 khớp đợt 125 cả 4 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).
- /tmp fixture đã mất theo boot mới — đã rebuild xong trước gate. baseline-meminfo.txt ghi được lần này (smoke mới, không còn file cũ gây EPERM như F-196-T8-9).

## 6. Dọn dẹp + kiểm cuối (extract-197t8.py, chạy 22:2xZ)

- ps sót T8: 0 (Xvfb :199, MiniBrowser, WebKitWebProcess, clicktest T8 — 0). X11 files: 1 (X194 — của luồng khác, để nguyên; X197 socket sót của launch-test đã dọn).
- Symlink t8-diag-stall.sh: cả 2 nơi → diag-stall-197t8.sh.
- Lock vite-lock-v2: TRỐNG (0 ticket + 88 cooldown).
- Vite: không còn vite nào của T8 chạy (driver đã exit sạch 22:17:58Z). Chrome/Chromium: 0 process T8 còn lại.
- Bằng chứng #30 giữ nguyên trong smoke/ (6 log pha + 4 thư mục stall + ram log + summary).

## 7. Giới hạn

- Harness KHÔNG 6/6 trên 1 boot: WebKit 85m4 kẹt #30 (exit 124, pha chưa hoàn thành).
- O8 T8 KHÔNG CHẠY (T01 đã chạy; không trùng). O8 T01 2/3 — chân FULL PASS O8 KHÔNG ĐẠT.
- B1 live BỎ LỠ kẹt #30 — V2+V4 chỉ bắt được ở replay (xem F-197-T8-3). Chuỗi live sạch GIỮ 0.
- POSTBOOT_PASS #124 CHƯA CÓ lúc T8 đóng (T56: không viết được post-hoc; tổng boot không cờ 30 → 31). Số hiệu #125 là ỨNG VIÊN (T01 xác minh 9 nguồn; parent quyết (e) ở §14.2-197).
- Sampler n=59 (chỉ suốt harness); không có sampler suốt phiên.
- Số liệu T4/T2/T01/T56 trích từ LIMITS/.done của họ (đã đọc), không đo lại. T9-197/T7-197 chưa đóng lúc T8 đóng — số liệu của họ (headroom, auto-trigger đợt, cửa slot, run 203) xem LIMITS của họ.
- LIMITS này < trần push 37.768 B (kiểm sau khi ghi).

## 8. Sai số mới + nợ cũ

- **F-197-T8-1 (DEBROOT — WebKit chạy được nhờ libs debroot, KHÔNG phải libs hệ thống):** boot #125 cell mới: libs hệ thống 6/6 THIẾU lúc mở (selfcheck #1), GST hệ thống 0 file; T56 cài apt xong 21:28:43Z (libs 6/6 CÓ) + symlink GST → debroot. Driver T8 vá LD_LIBRARY_PATH + GST_PLUGIN_PATH/SYSTEM_PATH → debroot cho 3 pha WebKit; launch-test headed PASS (27.2). Nếu đợt sau cell mới lại thiếu libs mà debroot còn, driver này vẫn chạy được; nếu debroot mất thì WebKit lại không chạy được — T56 nên ghi debroot vào quy trình khôi phục (không chỉ apt).
- **F-197-T8-2 (DRIVER ec=-1 — ĐÃ VÁ + KIỂM CHỨNG, ĐÓNG):** init `EC_*=-1` ở dòng 39 cả 2 driver; chromium driver xóa 3 dòng `EC_*=$?` stray sau run_one webkit bị comment (chúng ghi đè -1 thành 0). Kiểm chứng chức năng: ALL DONE mẫu webkit=-1/-1/-1 chromium=0/0/0. Kiểm chứng trên harness thật: ALL DONE 22:17:58Z ghi đúng `85m4=124`. F-196-T8-2 ĐÓNG.
- **F-197-T8-3 (B1 BỎ LỠ KẸT #30 LIVE — LỖ HỔNG PHÁT HIỆN MỚI):** kẹt #30 là kẹt ĐẦU TIÊN mà B1 (check-fresh live) im lặng hoàn toàn: V2 không trigger (HB128 ngừng — maxspan=5s, không có trailing run); V4 không trigger live (gap trong-log 60 s < 120 s — gap chỉ đóng 760 s khi log khép sau timeout). Kẹt chỉ được bắt live bởi WATCHDOG-137 (trong-script) + LIVE-DIAG-189 (mtime im lặng >120 s, ×2) + timeout 124. V4 bắt được ở replay (TRIGGER gap=760 s). **Đề xuất:** bổ sung trigger live theo đồng hồ treo (wall-clock silence — như LIVE-DIAG-189 đã làm) vào check-fresh, để B1 bắt được dạng kẹt "HB128 ngừng" ngay lúc im lặng đủ 120 s thay vì chờ log khép. Giao T8-198 (hoặc parent quyết có sửa B1 không — sửa detector là thay đổi phương án chính, cần parent duyệt).
- **F-197-T8-4 (KẸT #30 — P2 LẦN ĐẦU, CHỮ KÝ LAI):** 85m4 kẹt lần thứ 6 (164/171/178/179/196/197); lần đầu ở P2-lần1 (trước đây P4-lần1 ×4, P5 ×1). Chữ ký lai: playhead đóng băng (lớp V2) + HB128 ngừng + evaluate chết (lớp V4). V2 lỡ, V4 bắt (replay). Không có mẫu kẹt lặp cùng call-site 2 đợt liên tiếp.
- **F-197-T8-5 (REPLAY-F-FIX — BỘ ĐẾM TÓM TẮT LỖI THỜI):** script in "V2 5/5, V4 4/3, V2+V4 9/8 — KHÔNG ĐẠT" — mẫu số cứng 5/3/8 từ lúc corpus có 8 kẹt; corpus nay 10 kẹt (6 + 4). Số đúng tính tay: V2 6/6 + V4 4/4 = V2+V4 10/10, 0 FP. Cần sửa mẫu số thành 6/4/10 ở đợt 198 (sửa script, không sửa logic phát hiện).
- **F-197-T8-6 (AVAIL THẤP 247 MB TRONG LÚC KẸT):** sampler avail min 247 MB lúc 22:01:59Z (trong lúc kẹt #30); diag #3 avail 332 MB. Thấp hơn mọi mức avail min đợt 196 (478 MB trên #123, 512 MB trên #124). Balloon max 91,6% trần (5.904.204 kB). Chưa OOM (avail >0, vite HTTP 200) nhưng là mức RAM căng nhất trong lúc kẹt từng ghi — theo dõi.
- **F-197-T8-7 (SED RELABEL ĐỔI NHẦM ĐƯỜNG DẪN LỊCH SỬ):** copy script 196→197 bằng sed global `round196 → round197` đã đổi nhầm 2 đường dẫn entry 196 trong replay-1c/replay-f-fix thành round197-t8/smoke/archive-196-boot123 (không tồn tại). **ĐÃ SỬA** về round196-t8; verify 0 file thiếu trong corpus (54 entry). Bài học: relabel chỉ đổi nhãn script, KHÔNG sed global lên đường dẫn dữ liệu lịch sử.
- **Nợ cũ:** F-194-T8-2/4/5 vẫn mở (check-fresh file vắng; nhãn echo; run-chromium grep HB128). F-196-T8-4 (balloon 95,4% #124) → nay 91,6% (nhẹ hơn #124, nặng hơn #123 88,1%). F-196-T8-9 (baseline-meminfo EPERM) → nay ghi được (smoke mới). F-193-T8-1 (waiter reboot) — vẫn chưa có dữ kiện (không reboot trong phiên).

## 9. Nợ / chờ parent (T10 quyết ở §14.2 aggregate 197)

- (j) V4 GIỮ LIVE? (đề xuất: GIỮ — 0 FP, V2+V4 10/10; kẹt #30 ngoài vùng phủ live của V4 nhưng trong vùng phủ replay — xem F-197-T8-3 về trigger wall-clock); 84l10 chuỗi 4 → 5; **86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 17 → 18**; B2 vùng mới sạch lần 10 → 11; B1 live sạch GIỮ 0; **B2 dữ kiện thứ 9: 0 spike cả 2 cửa sổ — KHÔNG TÁCH vẫn đứng** (không có spike nào để phân loại).
- (b) FULL PASS KHÔNG CÓ (chân O8 vắng + chân harness kẹt #30; chuỗi GIỮ 0).
- (c) POSTBOOT_PASS #125 CÓ (poll=1, viết tay, caveat GST symlink + dpkg 777 — T56-197); #124 KHÔNG CÓ (tổng boot không cờ 30 → 31).
- (e) 8304fcd1 = #125 ỨNG VIÊN (T01 9 nguồn tươi; gap #124→#125 = 14.370 s). Marker 76 nếu #124 xác nhận; 77 nếu #125 cũng xác nhận.
- (f) (m) #123 KHÔNG CÓ ĐIỂM (CUỐI) + (m) #124 DƯƠNG (CUỐI) — T2-197; (m) #125 THÔ 0 requeue — phân loại CUỐI thuộc T2-198.
- (i) Holder: #124 GIẾT — chuỗi 27 → 0; #125 KHÔNG GIẾT — chuỗi 0 → 1 (T56-197). (A) 120/120 lần thứ 46; suite xanh 77 → 78; hướng (3) lần thứ 43 (T56-197).
- (n) Lặng #C 8.404 s bao trùm btime #125 (T01/T2-197) — phân loại thuộc T7-197 + parent. Kẹt harness #30 (T8 cung cấp).
- (p) F-197-T2-1 (T56 B4) VI PHẠM — chuỗi 0 vi phạm 1 → 0 nếu parent chấp nhận (T2-197). **T8 0 vi phạm.**
- (q) Đếm: T01-197 đếm cuối (lúc T01 đóng 21:03Z) = 1/2/2/1; lũy kế 850/1.590/1.346/1.150; chờ push 72/241/175/155; chuỗi khớp lần thứ 140. T8 đóng góp 1 LIMITS (+ scripts).
- Chờ push 191–197 = 72/241/175/155 (theo T01-197, lúc T01 đóng) + LIMITS T8-197 này.
