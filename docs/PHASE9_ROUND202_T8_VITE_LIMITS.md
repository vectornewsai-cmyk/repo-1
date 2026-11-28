# Đợt 202 T8 — HARNESS 6/6 TRÊN BOOT MỚI #134 (ỨNG VIÊN); 84l10 PASS TRỞ LẠI (FLAKE 201 KHÔNG TÁI HIỆN); 86n2-P1 DỮ KIỆN MỚI (22 → 23); V5 LIVE 0 TRIGGER; B2 SẠCH LẦN 16

Ngày: 27/11/2026 (lượt cron 03:35:51 +07 = 20:35:51Z mở đợt 202; T8 mở ~20:41Z, đóng ~22:15Z — TRONG hạn cờ ~23:00Z và hạn cứng 23:35:51Z).
Phạm vi: (1) V5 live tiếp (theo (j)-201 — V5 GIỮ LIVE); (2) harness trên boot mới nhất; (3) B1/B2 live; (4) V2/V4/V5 replay; (5) O8 — KHÔNG CHẠY (T01-202 chạy trong phiên — xem §A).
**Nguồn đứng:** §14.2 aggregate 201 (parent viết trực tiếp, lượt handoff 01:12 +07 28/11 — BẢN THAY THẾ bản giả mạo của lượt 00:35; aggregate 92.112 B; parent kiểm đếm KHỚP T10-201 và T10b-201 từng số lần thứ 163 liên tiếp). Các mốc parent dùng: (j) V5 GIỮ LIVE (V2 phương án chính 6/6; V4 5/5; V2+V4+V5 = 11/11 kẹt, 0 FP trên 49 log sạch duy nhất); 84l10 FAIL (E4 flake, chạy lại PASS) — chuỗi PASS 2 → 0; 86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 21 → 22; B2 vùng mới sạch lần thứ 15 (14 → 15); B1 live 0 trigger nhưng đợt KHÔNG sạch — chuỗi live sạch 2 → 0; (r) T8-202: V5 live tiếp; B1/B2 live; harness trên boot mới nhất; **chờ T4 .done trước khi chạy harness.**
**Reboot giữa đợt:** VM reboot 21:05:15Z (btime #133 20:32:07Z → btime mới 21:05:15Z) — boot mới `bd22dffd-4949-4ac2-8e57-a6d3fb2868e2`, ứng viên #134 (T01-202 survey 9 nguồn tươi 21:10:07Z; T5-202 gọi #133). Harness đợt này chạy trên #134; lượt yên #70 + O8 đo trên #133 (O8) / #134 (yên) — xem caveat chuỗi §E/(c).

## 0. Kết luận ngắn — HARNESS 6/6; KHÔNG KẸT MỚI; T4 #70 HỢP LỆ; LIVE-CHECK #21 ĐẠT

- **BOOT #134 (ỨNG VIÊN) `bd22dffd` (btime 21:05:15Z)** — reboot giữa đợt, gap #133→#134 = 1.988 s (33m08s). POSTBOOT_PASS #134 CÓ 21:28:09Z (T56-202, poll=1, repair-som-quyet-h, dpkg 777, cache 108, lists 66, verify độc lập exit 0 21:30:15Z). Marker 82 → 85 nếu #132+#133+#134 đều xác nhận (T01/T56 đề xuất, parent quyết (e)-202).
- **HARNESS #134 (21:50:18–22:06:04Z): WebKit 84l10 PASS + 85m4 PASS + 86n2 PASS; Chromium 3/3 PASS. 6/6.** Kẹt harness cộng dồn GIỮ 31 (0 kẹt mới).
- **84l10 PASS — chuỗi PASS 0 → 1 (đề xuất).** E4 PASS cả 2 engine (WebKit restart 3→3, ct=4, ended=true; Chromium restart 6→6, ct=4, ended=false — verdict PASS của script). Flake E4 đợt 201 KHÔNG tái hiện (W1-lần1 đồng bộ chỉ 0,7 s WebKit / 0,5 s Chromium, so với 9,9 s lần fail đợt 201) → KHÔNG cần chạy lại chẩn đoán đợt này.
- **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 21:55:11Z trên WebKit #134 (+ Chromium 22:02:53Z) → chuỗi 22 → 23 (đề xuất).**
- **V2+V4+V5 = 11/11 kẹt, 0 FP trên 52 log sạch duy nhất** (54 entry — +3 log 202 mới, đều duy nhất). V5 live: 0 trigger (không có kẹt để bắt); B1 live 0 trigger.
- **B2 vùng mới sạch lần 16** (15 → 16); 0 trigger trên cả 6 pha — P6-wait đủ 90 s cả 2 engine (18 dòng mỗi bên).
- **T4-202: lượt yên #70 HỢP LỆ (attempt1-bd22dffd 20/20, lớp B 5/5, tickCost median 52,0 ms, chuỗi 2 → 3 đề xuất); live-check #21 ĐẠT (W1 0 spike B2, chuỗi live ĐẠT 0 → 1 đề xuất). B2 dữ kiện #14: W1 0 spike.**
- **O8 T01-202 trên #133 (trước repair): WebKit FAIL ×2 (S1 + Target crashed) + Chromium 21/21 PASS → 1/3 — chân FULL PASS O8 KHÔNG ĐẠT.**
- **FULL PASS: KHÔNG CÓ** — chân harness 6/6 CÓ + chân yên #70 CÓ + chân O8 1/3 KHÔNG. Chuỗi full pass GIỮ 0.
- **T8 tự báo 1 chồng lấn nhẹ trong W1 (F-202-T8-4):** waiter phiên 2 ghi 4 dòng poll vào log của mình trong W1 (21:33:40–21:36:40Z) — giao parent phán (p)-202. Ngoài ra 0 chồng lấn (gate-check 6/6 lần "T4 khong giu lock"; harness chạy SAU T4 .done).

## 1. Dòng thời gian (gọn)

- 20:32:07Z **Boot #133 `05bda90d`** (trước khi đợt mở; T01-202 survey 20:42:50Z). 20:35:51Z Đợt 202 mở (lượt cron 03:35:51 +07, run 212). ~20:41Z T8 mở (đọc §14.2 aggregate 201 + LIMITS T8-201). 20:42:59Z Watcher-202 START spawn1 (T56-202). 20:46:27–20:48:49Z O8 T01 trên #133 (WebKit FAIL ×2 + Chromium PASS). 20:46:31Z Waiter T8 phiên 1 khởi động (setsid — chết theo reboot sau đó). 20:46:34Z Selfcheck #1 T8 (trên #133, trước repair): libs 6/6 THIẾU, dpkg 2 dòng. ~20:52Z Tiền kiểm replay V5/B2 offline xong (V5 5/5, 0 FP trên 49 log sạch; B2 offline khớp hệt đợt 186–200). 20:50:33Z **POSTBOOT_PASS #133 CÓ** (T56-202, poll=1, dpkg 777, lists 75).
- **21:05:15Z REBOOT — boot mới `bd22dffd` (ứng viên #134).** Waiter phiên 1 chết theo reboot (poll cuối 21:05:40Z); vòng chờ nền của T8 cũng chết theo runtime restart cùng lúc (~21:06Z); T4 poller + T9 daemon + T56 replay-watch đều chết theo reboot; 0 attempt T4 nào đã chạy trước reboot nên không mất dữ kiện; /tmp fixture bị xóa.
- 21:06:51Z T4 poller khởi động lại (instance 3). 21:07:12Z Watcher-202 RESPAWN (pid 2113, T56-202). 21:07:36Z Waiter T8 phiên 2 khởi động (setsid — sống tới GATE-FOUND). 21:08Z Selfcheck #2 T8 (trên #134, trước repair): libs 6/6 THIẾU, dpkg 2 dòng. 21:21:44Z EARLY-REPAIR TRIGGER #134 (T56-202). **21:28:09Z POSTBOOT_PASS #134 CÓ** (T56-202, poll=1, dpkg 777, cache 108, lists 66). 21:33:13Z **T4 mở cửa yên W1** (attempt1-bd22dffd). 21:36:47Z W1-ACTIVE xóa; 21:37:13Z attempt1 xong — HỢP LỆ. 21:48:41Z **GATE-FOUND phiên 2 poll=42** (t4=OK + postboot đường (a) + no-lock). 21:48:47Z **T8 thấy T4 .done** (lượt yên #70 HỢP LỆ; live-check #21 ĐẠT).
- 21:49Z Selfcheck #3 T8 (trên #134, sau repair): libs 6/6 CÓ, dpkg 777. 21:49Z Fixture rebuild (md5 khớp đợt 125 cả 4).
- **21:50:18Z HARNESS BẮT ĐẦU** — 22:06:04Z ALL DONE 6/6 (toàn exit=0). 22:06–22:12Z Kiểm chứng sau harness (extract + replay post + check-fresh live từng pha). T8 đóng ~22:15Z, TRONG hạn cờ.

## 1b. Gate — GATE-FOUND FILE-BASED ĐÚNG QUY TẮC (p1)

- Waiter 2 phiên (phiên 1 chết theo reboot #134 — lần 4 waiter chết theo reboot, sau các đợt 193/198/201; phiên 2 setsid sống tới GATE-FOUND). Tổng 61 dòng poll trong log (extract đếm). **GATE-FOUND phiên 2 poll=42 21:48:41Z: t4=OK + postboot=round202-t56/POSTBOOT_PASS (đường a, boot mới bd22dffd) + t4attempt=no-lock.**
- Gate đúng quy tắc (p1): waiter poll=42 lúc 21:48:41Z thấy t4=OK (file .done đã tồn tại); vòng chờ của T8 thấy .done lúc 21:48:47Z (poll đầu tiên sau khi file xuất hiện). Nội dung .done khớp LIMITS T4 (lượt yên #70 HỢP LỆ, live-check #21 ĐẠT, P3' cộng dồn 56 lượt, sổ md5 50f10815) + POSTBOOT_PASS #134 CÓ 21:28:09Z (T56-202, poll=1, dpkg 777, verify độc lập exit 0 21:30:15Z theo T56) + lock vite-lock-v2 TRỐNG + 0 process T4 sống lúc đóng (poller thoát 21:37:13Z). Harness bắt đầu 21:50:18Z — 1m37s SAU GATE-FOUND (selfcheck #3 + rebuild fixture + kiểm tree/lock trước khi chạy).
- Caveat gate: KHÔNG CÓ caveat boot đợt này — lượt yên #70 đo trên #134 (attempt1-bd22dffd), harness chạy trên #134 (cùng boot, khác với đợt 201: yên #69 trên #130, harness trên #131). O8 đo trên #133 (trước repair, trước reboot) — chân O8 khác boot với 2 chân còn lại (xem §E/(c)).

## A. O8 — T01-202 CHẠY TRONG PHIÊN (TRÊN #133, TRƯỚC REPAIR); T8 KHÔNG CHẠY O8

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T01 WebKit attempt1 trên #133 | **FAIL — exit=2, S1** ("không đo được rect checkbox tự tạo proxy") + HARNESS LỖI "page.setInputFiles: Target crashed" |
| 2 | O8 T01 WebKit attempt2 trên #133 | **FAIL — exit=2, y hệt attempt1** (S1 + Target crashed) |
| 3 | O8 T01 Chromium trên #133 | **21/21 PASS** — exit=0 (JSON md5 f55a10ef) |
| 4 | O8 T8 (bộ thứ hai / chạy lại sau repair) | **KHÔNG CHẠY** — không nằm trong brief T8-202 (chỉ harness + B1/B2 + V5); T01 ghi "việc chạy lại WebKit sau repair thuộc T8-202 + parent" — T8 ghi nhận, giao parent quyết (xem §9) |

- O8 chạy cùng cây 477a0eac/ac89aeb2 (cùng cây với harness T8). 0 lỗi exit 127. Probe S1 lần 1 không chạy (lỗi setup T01, F-202-T01-2); probe chạy lại 20:50:05–20:50:31Z exit=2 "page.goto: WebKit encountered an internal error" (renderer chết ngay lúc navigate). **Chân FULL PASS "O8 3/3": KHÔNG ĐẠT đợt này (1/3 bộ pass)** — khác đợt 201 (3/3) và đợt 200 (2/3).
- O8 chạy trong lúc T4 chỉ poll (poll #5–#7 lock=co t01-round202; poll #8 20:48:59Z lock=khong sau release — 0 chồng lấn attempt đang chạy, theo T01-202).

## 2. Kết quả harness — 6/6 TRÊN 1 BOOT (#134)

### 2a. Boot #134 (21:50:18–22:06:04Z) — WebKit 3/3, Chromium 3/3

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 21:50:21–21:51:42 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS (xem §D) |
| 2 | WebKit 85m4 | 0 | 21:51:57–21:54:19 | **PASS** — "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 21:54:34–21:58:36 | **PASS** — **P1 PASS 21:55:11Z (DỮ KIỆN MỚI — chuỗi 86n2-P1 22 → 23)** + P5 CÓ-RESTART (+2, ended-at-duration) + P6 KHÔNG-KẸT full 90 s, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 21:58:51–21:59:52 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 22:00:07–22:02:08 | **PASS** — "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 22:02:23–22:06:04 | **PASS** — P1 PASS 22:02:53Z + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 31 (0 kẹt mới). 84l10 PASS — chuỗi PASS 0 → 1 (đề xuất). 86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 22 → 23 (đề xuất).**
- RAM sampler #134 (n=32 mẫu suốt harness, +1 dòng header): balloon min 2.986.228 / max **5.690.420 kB (88,3% trần)**, mean 4.073.403, pinned=0; avail min **1.041 MB (21:50:18Z, ngay lúc bắt đầu)** / max 3.549 MB. Nặng hơn đợt 201 trên #131 (82,6%, avail min 852 MB) và đợt 200 trên #130 (84,7%, avail min 620 MB) về balloon; avail min cao hơn cả hai.
- GATE-CHECK trước MỖI pha: 6/6 lần "T4 khong giu lock" — **0 chồng lấn với attempt T4** (poller T4 đã thoát 21:37:13Z; T4 .done có 21:48:47Z). **T8 0 vi phạm ngoài tự báo F-202-T8-4** (waiter ghi log trong W1 — xem §8).
- **ALL DONE 22:06:04Z ghi `ec webkit: 84l10=0 85m4=0 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0`** — driver exit 0 22:06:07Z.
- Báo cáo JSON ok=true cả 6, trừ không có báo cáo stale: `l10-scratch` 21:51:35.941Z; `m4-scratch` 21:54:11.997Z; `n2-hb128-scratch` 21:58:32.812Z; `l10-scratch-chromium` 21:59:48.704Z; `m4-scratch-chromium` 22:02:04.852Z; `n2-hb128-scratch-chromium` 22:06:04.029Z. **KHÔNG có báo cáo stale** (scratch mới hoàn toàn đợt này).

## C. B1/B2 live + V2/V4/V5 replay

### C1. Script md5 (đổi nhãn 202t8; check-fresh KHÔNG đổi logic so với 201 — md5 khác chỉ do đổi nhãn)

| Script | md5 | Byte | Ghi chú |
|---|---|---|---|
| check-fresh-202t8.py | 205f85b9 | 15.551 | đổi nhãn (logic V5 giữ nguyên; parser --now=X đã sửa ở 201) |
| diag-stall-202t8.sh | d082625b | 2.292 | đổi nhãn |
| extract-202t8.py | 2c951221 | ~7.900 | đổi nhãn + archive-202-* + nhãn 202-sach/202-fail |
| wait-t4-t5-202t8.sh | be1df624 | 3.948 | đổi nhãn + deadline 23:00Z 27/11 |
| run-webkit-202t8.sh | 759bcee4 | 13.980 | đổi nhãn (check-fresh chạy TRƯỚC mỗi poll, V5 live) |
| run-chromium-202t8.sh | b3c6effa | 13.486 | như run-webkit (CHỈ dùng khi cần chạy riêng Chromium — đợt này KHÔNG dùng) |
| replay-1c-202t8.py | 13aa3872 | 22.855 | đổi nhãn + GIỮ entry 201 + thêm entry 202 (F-201-T8-1) |
| replay-f-fix-202t8.py | db241847 | 21.617 | như replay-1c |
| replay-wallclock-202t8.py | a78b354b | 11.677 | đổi nhãn (LOGS import từ replay-f-fix) |
| launch-test-webkit-202t8.mjs | 89b4b2c1 | ~1.289 | đổi nhãn |
| run-diag-84l10-w2setup-202t8.sh | 84628da2 | 10.114 | driver diag W2-setup — KHÔNG chạy đợt này (xem §F) |
| build-84l10-w2setup-hb128.py | 646e17ec | 4.560 | KHÔNG ĐỔI md5 so với đợt 196/197/198/199/200/201 |
| selfcheck-postboot-202t8.sh | 80823681 | 2.299 | đổi nhãn (+ sửa nhãn "T8-201" → "T8-202") |
| rebuild-fixtures-202t8.sh | ec91f117 | 2.810 | đổi nhãn |
| verify-163-202t8.py | 47efaa64 | 2.616 | đổi nhãn (không chạy đợt này) |
| o8-driver-202t8.sh | bad3578e | 6.660 | đổi nhãn + lock t8-round202 — KHÔNG CHẠY đợt này (T01 đã chạy O8) |
| o8-s1-probe-202t8.mjs | 453d1082 | 55.280 | KHÔNG ĐỔI md5 so với đợt 196/197/198/199/200/201 (**VƯỢT trần push** — file cũ, không đổi) |
| run-diag-84l10-rerun-202t8.sh | 06f94ea9 | 13.032 | **ĐÃ SỬA F-201-T8-3** (xóa gán EC_M4/EC_N2/EC_C_* giả — xem F-202-T8-1); KHÔNG chạy đợt này (84l10 PASS, không cần chẩn đoán) |
| symlink `t8-diag-stall.sh` | — | — | cả 2 nơi → diag-stall-202t8.sh (goal HF sửa lúc mở; repo-1/hidden_files sửa lúc đóng — xem F-202-T8-5) |

- Script điều khiển pha: 84l10 `16e5e957` (35.917 B) / 85m4 `3fb2548b` (**38.737 B — VƯỢT trần push**) / 86n2-hb128 `de925614` (**43.653 B — VƯỢT trần push**) / 86n2-std `628088bd`; 87o8-webkit `4994b4fc` / 87o8-headed `c8acd72e`. **Cả 6 file điều khiển pha KHÔNG ĐỔI so với đợt 197/198/199/200/201** (md5 khớp).

### C2. Offline B2 — 6 ca §C2 đóng băng: KHỚP HỆT đợt 186–201, ĐẠT

| Case | Log tổng hợp (đợt 186) | Kết quả (check-fresh-202t8.py, --now/--until=last_ts — V5 silence=0) |
|---|---|---|
| B2-1 setup | planb-b2-setup-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-2 startPlaying | planb-b2-startplaying-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-3 P6-wait-wd | planb-b2-p6wait-150s-wd.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=wd) |
| B2-4 P6-nowd | planb-b2-p6wait-150s-nowd.log | **KHÔNG kích hoạt** (maxspan=150 s — giới hạn đã biết) |
| B2-5 P6-clean | planb-b2-p6-clean-90s.log | **KHÔNG kích hoạt** (maxspan=85 s) |
| B2-6 setup-clean | planb-b2-setup-clean-60s.log | **KHÔNG kích hoạt** (maxspan=55 s) |

- Chạy với --now/--until = last_ts đầy đủ từng file, dạng tách riêng. Kết quả lưu `smoke/b2-offline-202t8.txt`, diff với đợt 201 KHỚP HỆT.

### C3. Live — V5 0 trigger (không có kẹt); B2 vùng mới 0 trigger; V2/V4 im lặng đúng chỗ

| Pha | HB128 (dòng) | Kết quả check-fresh live |
|---|---|---|
| #134 WebKit 84l10 | 7 | OK (maxspan=0 s, wd=0, maxgap=11 s) |
| #134 WebKit 85m4 | 19 | OK (maxspan=0 s, wd=0, maxgap=7 s) |
| #134 WebKit 86n2 | 39 | OK (maxspan=85 s, wd=0, maxgap=8 s; **P6-wait đủ 90 s — 18 dòng P6-wait**) |
| #134 Chromium 84l10 | 5 | OK (maxspan=0 s, wd=0, maxgap=7 s) |
| #134 Chromium 85m4 | 18 | OK (maxspan=5 s, wd=0, maxgap=6 s) |
| #134 Chromium 86n2 | 39 | OK (maxspan=85 s, wd=0, maxgap=7 s; P6-wait 18 dòng) |

- **B1 live: 0 trigger — đợt này KHÔNG có kẹt nên V5 không có gì để bắt (V5 vẫn armed cả 6 pha; 0 FP). Đợt này SẠCH (harness 6/6) — chuỗi live sạch 0 → 1 (đề xuất).** Tiền lệ đợt 200: B1 chain tính theo harness 6/6 (O8 2/3 đợt đó không làm đứt chuỗi); O8 1/3 đợt này chỉ ảnh hưởng chân FULL PASS, không ảnh hưởng chuỗi B1-live.
- **B2 vùng mới (setup/startPlaying/P6-wait): 0 trigger trên cả 6 pha → B2 vùng mới sạch lần 16 (15 → 16)** — P6-wait đủ 90 s cả 2 engine.
- LIVE-DIAG-189 (nhánh mtime): **0 lần** đợt này — V5/check-fresh chạy trước mỗi poll nên đã bao phủ; nhánh mtime chỉ còn fallback.
- WATCHDOG-137 trong-script: 0 lần. Diag live: 0 lần (không có kẹt). Tổng 0 thư mục stall.

### C4. Replay — V2 6/6 + V4 5/5 + V5 5/5 = V2+V4+V5 11/11, 0 FP trên 52 log sạch duy nhất

| Kiểm tra | 202-sach-85m4 | 202-sach-86n2-hb128 | 202-sach-84l10 | Cộng dồn |
|---|---|---|---|---|
| Replay-1c (c') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | (c') KHÔNG ĐỔI so với 201: kẹt-164 TRIGGER @125 s, lỡ 171 + 179 (đã biết, đã ghi); 0 FP trên log sạch |
| Replay-f-fix (f') ≥180/300/600 s | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | (f') ĐẠT trên tiêu chí 2 kẹt (164@125 s + 171@185/305/605 s), 0 FP |
| Replay-f-fix (f'') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | **V2 (f'') 6/6 trong lớp HB128** |
| Replay-f-fix V4 (f'''') | KHÔNG kích hoạt (gap=7 s) | KHÔNG kích hoạt (gap=8 s) | KHÔNG kích hoạt (gap=11 s) | **V4 5/5 kẹt mù** (179/180/192/197/198) |
| Replay-wallclock V5 (f''''') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt (ts=25, maxgap=11 s, tail=8,2 s, summary-end exit=0) | **V5 5/5 kẹt mù** (179/180/192/197/198) |

- **Số log sạch chuẩn (md5-unique): 49 → 52** (54 entry sạch; 3 log 202 mới đều duy nhất; 2 cặp trùng cũ 181/182 giữ nguyên: 166b271d, e11c62cb). **0 FP** trên toàn corpus sạch (corpus replay-f-fix: 66 entry = 54 sạch + 11 kẹt + 1 fail; corpus replay-1c: 68 entry).
- **Hồi quy V2/V4: check-fresh-202t8.py vs 197t8.py KHỚP HỆT trên 66 log** (--now/--until=last_ts; V5 silence=0).
- Tiền kiểm TRƯỚC harness (chạy ~20:52Z): V5 5/5 kẹt mù, 0 FP trên 49 log sạch duy nhất (51 entry); V2/V4 hồi quy 63/63 khớp (pre) → 66/66 khớp (post).

### C5. V5 (f''''') — GIỮ LIVE, 0 TRIGGER ĐỢT NÀY (KHÔNG CÓ KẸT); KIỂM CHỨNG LẠI TRƯỚC HARNESS

**Thiết kế (quyết (j)-197, giữ nguyên đợt 202):** trigger khi im lặng MỞ (trailing silence) `now - dòng timestamp CUỐI CÙNG >= 120 s` (cùng ngưỡng V2/V4), chỉ đánh giá khi process pha còn sống (driver chỉ gọi check-fresh trong vòng poll `while kill -0 node_pid`). V5 bổ sung, không thay thế V2 (V2 vẫn là phương án chính trong lớp HB128); V4 GIỮ LIVE. Giới hạn còn lại: log 0 dòng timestamp thì V5 không đo được (như V4) — nhánh mtime LIVE-DIAG-189 trong driver vẫn là fallback.

**Kiểm chứng lại TRƯỚC harness đợt này (replay-wallclock-202t8.py, chạy ~20:52Z, lưu `smoke/replay-wallclock-202t8.out`):**
- V5 bắt 5/5 kẹt mù cũ (179 gap 723 s, 180 gap 718 s, 192 gap 793 s, 197 gap 760 s, 198 gap 784 s) tại gap_start+120 s — sớm hơn V4-live 598–673 s.
- V5 KHÔNG fire trên 6/6 kẹt lớp V2 (HB128 vẫn chảy trong lúc kẹt).
- 0 FP trên 49 log sạch duy nhất (max gap trong-log sạch 97 s — biên 22 s; max tail summary-end−last_ts 9,8 s — biên 110,2 s).
- Sau harness: corpus +202 (0 kẹt + 3 sạch) → **V5 5/5 kẹt mù, 0 FP trên 52 log sạch duy nhất**; V2/V4 hồi quy 63/63 khớp (pre) + 66/66 khớp (post, replay-f-fix-202t8-post.out).
- Live đợt này: V5 armed cả 6 pha, **0 trigger — đúng (không có kẹt)**; V4 live 0 trigger; V2 live 0 trigger. B1 live 0 trigger.

## D. 84l10 E4 — PASS ĐỢT NÀY; FLAKE 201 KHÔNG TÁI HIỆN; KHÔNG CẦN CHẠY LẠI

- **Lần chạy duy nhất (harness chính, 21:50:21–21:51:42Z):** W1-lần1 PASS (đồng bộ sau 0,7 s; playhead 1.667→1.733, ct=1,8; restartEndedVideo 0→1), W1-lần2 PASS (1→2; 1.433→1.833, ct=2), W1-lần3 PASS (2→3; 1.533→1.867, ct=2,115); W2 PASS (playhead cuối 30, tới cuối=true, restart tự nhiên Δ=0). **E4 PASS 21:51:34Z — tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=3 → sau 3 s=3, ct cuối=4, ended=true, errors=0.** Chromium E4 PASS (restart 6→6, ct=4, ended=false — verdict PASS của script).
- So với đợt 201: lần fail E4 đồng bộ W1-lần1 9,9 s (nghi cold-start boot mới); lần chạy lại PASS 0,7 s. Đợt này W1-lần1 đồng bộ 0,7 s ngay lần đầu trên #134 (đã repair xong trước harness) → **không có bằng chứng cold-start; E4 PASS ngay lần đầu nên KHÔNG chạy lại chẩn đoán** (driver chạy lại đã sửa F-201-T8-3, sẵn sàng nhưng không cần dùng).
- **84l10 fail/kẹt: 3/25 ≈ 12%** (192 #28 stall W2, 198 #31 stall W1-lần3, 201 E4 FAIL flake) — đợt 202 PASS ngay lần đầu, chưa có mẫu lặp cùng call-site 2 đợt liên tiếp.

## B. H3 — WebKitGTK treo — GIỮ ỦNG HỘ MẠNH (không có dữ kiện mới đợt này)

- Đợt này KHÔNG có kẹt harness nào (6/6 PASS) nên H3 không có thêm bằng chứng ủng hộ hay phản bác. Chữ ký kẹt #31 (đợt 198) vẫn khớp H3 (biến thể 0-HB128). WebKit chạy được trên #134 nhờ libs hệ thống sau replay đầy đủ (6/6 CÓ, xem §C6) + debroot dự phòng trong driver (F-197-T8-1, giữ nguyên).
- Không phải H1 (T4 đã đóng, poller thoát 21:37:13Z, 0 attempt lúc harness chạy 21:50:18Z), không phải H2 (ENOSPC — dpkg 777 dòng ổn định trong lúc harness).

### C6. Debroot — WebKit chạy được nhờ libs hệ thống SAU REPAIR + debroot dự phòng

- **Dữ kiện gốc:** 84l10 PASS 3 đợt liên tiếp (193/194/195) với scanner VẮNG → giả thuyết "thiếu scanner" đã bị bác đợt 196 (kẹt #29 xảy ra với gst-inspect CÓ).
- **Dữ kiện đợt 202:** selfcheck #1 TRƯỚC repair trên #133 (20:46:34Z): libs 6/6 THIẾU, libgst\* 0, dpkg 2, gst-inspect VẮNG. Selfcheck #2 TRÊN #134 TRƯỚC repair (21:08Z): libs 6/6 THIẾU, dpkg 2, gst-inspect VẮNG. Selfcheck #3 TRÊN #134 SAU REPAIR (~21:49Z): libs 6/6 CÓ, libgst\* 79, dpkg 777, **gst-inspect VẮNG (khác đợt 201: #131 sau repair gst-inspect CÓ lần đầu)**, gst-plugin-scanner VẪN VẮNG, plugin dir 269 .so. Driver T8 vẫn vá LD_LIBRARY_PATH + GST_PLUGIN_PATH/SYSTEM_PATH → debroot cho 3 pha WebKit (F-197-T8-1, giữ nguyên). **Scanner vắng riêng lẻ KHÔNG phân biệt kẹt/pass — giả thuyết "thiếu scanner" vẫn bị bác (lần 7).** O8 WebKit FAIL ×2 trên #133 TRƯỚC repair (libevent MISSING) vs harness WebKit 3/3 PASS trên #134 SAU repair — tương quan thời gian ủng hộ "repair giúp WebKit", nhưng T01-202 đã ghi rõ CHƯA chứng minh libevent là nguyên nhân (xem F-202-T01-3).
- **Debroot vẫn là đường dự phòng:** `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu` (348 file; GST 269 plugin). T56-202: GST hệ thống trên #134 là thư mục thật (269=269), libwebkitgtk CÓ.

## E. Checklist (o) — các giá trị T8 cung cấp cho aggregate đợt 202 (T10 quyết)

- (a) Harness: WebKit 84l10 PASS + 85m4 PASS + 86n2 PASS trên #134; Chromium 3/3 PASS trên #134; **6/6 — ĐẠT.**
- (b) FULL PASS: **KHÔNG CÓ** (chân harness 6/6 CÓ + chân lượt yên #70 CÓ + chân O8 1/3 KHÔNG; chuỗi full pass GIỮ 0).
- (j) **V5 GIỮ LIVE (đề xuất — 5/5 kẹt mù, 0 FP trên 52 log sạch; live đợt này 0 trigger, đúng vì không có kẹt)**; 84l10 PASS — chuỗi PASS 0 → 1; **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 21:55:11Z → chuỗi 22 → 23**; B2 vùng mới sạch lần 15 → 16 (P6-wait đủ 90 s cả 2 engine); B1 live 0 trigger (đợt SẠCH — chuỗi live sạch 0 → 1, đề xuất). **V2+V4+V5 = 11/11, 0 FP trên 52 log sạch**; V2 VẪN là phương án chính (6/6 lớp HB128); V4 GIỮ LIVE (5/5). **B2 dữ kiện #14: W1 0 spike (T4-202; cách đếm (j)-200: mỗi đợt = 1) — KHÔNG TÁCH vẫn đứng** (T4 chỉ báo số).
- (m) Lượt yên #70: **HỢP LỆ** (T4-202: attempt1-bd22dffd 20/20, (c2) [174, 212, 433], coverage 3/3, lớp B 5/5, tickCost median 52,0 ms — chuỗi lượt yên hợp lệ 2 → 3, đề xuất). Live-check #21: **ĐẠT** (T4-202: 1 cửa sổ hợp lệ VÀ 0 spike B2 trong W1 — chuỗi live ĐẠT 0 → 1, đề xuất). P3' cộng dồn MỚI 56 lượt hợp lệ (P1 243/247, P2 238/238, P3-A1 207/247, P3' 205/219 occ = 148/151 distinct, P7 141/141; sổ md5 50f10815). Labellag (b) 0 occ → chuỗi 0 occ 2 → 3 (đề xuất). P3-A1 SAI cấp lượt (3/3 đóng băng, p=0,0169 — F-202-T4-2: ngưỡng DEF §5 không đạt được với n=3).
- (n) Stall/outage: **0 kẹt harness mới đợt này** (cộng dồn GIỮ 31). Reboot #134 giữa đợt (btime 21:05:15Z, gap #133→#134 = 1.988 s — T01-202 survey 9 nguồn tươi; T5-202 gọi #133). Run 210 TIMEOUT → CA MỚI #32 (T7-202); lặng S11 8.405,823 s → OUTAGE #9 (T7-202 đề xuất); cửa slot KHÔNG LÀNH (T7-202); tổng lặng 27/11 = 24.952 s (T7-202).
- (o) Auto-trigger: T9-202 chưa đóng lúc T8 đóng — số mẫu đợt này xem LIMITS T9-202; trong cửa sổ T4: 3 mẫu live watch/consec=0, 0 FIRE (T4-202 .done).
- (p) Vi phạm: **T8 tự báo 1 chồng lấn nhẹ (F-202-T8-4)** — waiter phiên 2 ghi 4 dòng poll vào log của mình trong W1 (21:33:40–21:36:40Z); giao parent phán (p)-202. Ngoài ra: gate-check 6/6 lần "T4 khong giu lock", 0 chồng lấn; vite nối tiếp; lock trống trước khi chạy; harness chạy SAU khi T4 .done đã có. T4-202 ghi nhận chồng lấn W1 khác: T2-202 ghi 3 file + T56-202 ghi 2 file (F-202-T4-3) — giao parent phán.
- (E-247) MỞ — không có dữ kiện mới đợt này từ T8 (T9-202 chưa đóng; xem LIMITS T9-202).

## F. Diag W2-setup — DỪNG (không chạy đợt này)

- Diag W2-setup (run-diag-84l10-w2setup-202t8.sh, md5 84628da2, 10.114 B + build-84l10-w2setup-hb128.py, md5 646e17ec, 4.560 B) KHÔNG chạy đợt này — không có ca kẹt 84l10 W2 để điều tra (84l10 PASS cả W2 lẫn E4 ngay lần đầu; đã có diag live ×2 (V5) + WATCHDOG + probe TIMEOUT + diag sau timeout đợt 198). Giữ script cho đợt sau.

## 5. Cây lúc đóng + md5 (kiểm lúc ~22:10Z)

- preview.tsx `477a0eac` (không đổi so với đợt 198/199/200/201); media.ts `ac89aeb2` (không đổi); vite.config.ts `ee80d093` (không đổi). **Harness #134 cùng cây 477a0eac/ac89aeb2/ee80d093. O8 T01 chạy cùng cây này trên #133 (cùng cây, khác boot — xem §A).**
- Fixture rebuild 1 lần (21:49Z trên #134, sau reboot): md5 khớp đợt 125 cả 4 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).
- /tmp fixture đã rebuild xong trước harness. baseline-meminfo.txt ghi được (smoke mới).

## 6. Dọn dẹp + kiểm cuối (extract-202t8.py, chạy 22:07Z)

- ps sót T8: 0 (Xvfb :199, MiniBrowser, WebKitWebProcess, clicktest T8 — 0). X11 files: 1 — socket X193 + lock `/tmp/.X193-lock` (21:33Z, stale của attempt T4 — T4 LIMITS §5 xác nhận "stale của attempt, như mẫu đợt 200"; không phải của T8, không có process giữ — fuser trống).
- Symlink t8-diag-stall.sh: cả 2 nơi → diag-stall-202t8.sh (readlink xác nhận lúc đóng; lúc mở repo-1/hidden_files vẫn trỏ 201t8 — đã sửa, xem F-202-T8-5).
- Lock vite-lock-v2: TRỐNG (0 ticket + 86 cooldown).
- Vite: không còn vite nào của T8 chạy (driver exit sạch 22:06:07Z). Chrome/Chromium: 0 process T8 còn lại.
- **T4 .done ĐÃ CÓ TRƯỚC khi harness chạy** (21:48:47Z — GATE-FOUND 21:48:41Z; harness 21:50:18Z). **T56 .done ĐÃ CÓ lúc T8 đóng** (POSTBOOT #134 CÓ + watcher respawn + holder — xem §E/(i) dưới).
- Bằng chứng giữ nguyên trong smoke/ (6 log pha + ram log + summary + replay .out ×3 (+pre/+post), extract .out, waiter log 2 phiên, selfcheck #2/#3, rebuild-fixtures).

## 7. Giới hạn

- Harness 6/6 trên 1 boot (#134); O8 trên #133 (cùng cây, khác boot, trước repair) 1/3 — chân FULL PASS O8 không đạt.
- T8 đóng TRONG hạn cờ (~22:15Z vs ~23:00Z).
- POSTBOOT_PASS #134 CÓ (poll=1, repair-som-quyet-h — T56-202; caveat (b1)/(b2) thuộc parent (c)-202). #133 ỨNG VIÊN (parent quyết (e)-202; T01-202 survey 9 nguồn tươi; T5-202 gọi #133).
- Sampler n=32 (chỉ suốt harness); không có sampler suốt phiên.
- Số liệu T4/T2/T01/T56/T7 trích từ LIMITS/.done của họ (đã đọc), không đo lại. T9-202 chưa đóng lúc T8 đóng — số liệu của họ (headroom, auto-trigger đợt, E-247) xem LIMITS của họ. T2-202 đã đóng — (m) #131 DƯƠNG (CUỐI), B-#130 FALSE, (m) #56 lần 44 VẪN CÓ ĐIỀU KIỆN, probe #121 ok=2 fail=0, sweep #121 0 sóng thật, mù CERT/FULL GIỮ 76/91, n 58/61 → 59/62 nếu parent chấp nhận (xem LIMITS T2-202).
- O8 chạy lại sau repair KHÔNG nằm trong brief T8-202 nên không chạy (xem §A/§9) — chân O8 giữ kết quả T01-202 trên #133.
- LIMITS này < trần push 37.768 B (kiểm sau khi ghi).

## 8. Sai số mới + nợ cũ

- **F-202-T8-1 (DRIVER CHẠY LẠI GHI SỐ GIẢ — ĐÃ SỬA, sửa F-201-T8-3):** run-diag-84l10-rerun-201t8.sh ghi `85m4=0 86n2=0` dù 2 pha không chạy (2 dòng `EC_M4=$?`/`EC_N2=$?` còn sót bắt exit 0 của echo). **ĐÃ SỬA đợt này:** xóa cả 5 dòng gán EC giả (`EC_M4`/`EC_N2` sau `EC_L10=$?` + `EC_C_L10`/`EC_C_M4`/`EC_C_N2` sau echo/tee) trong run-diag-84l10-rerun-202t8.sh (md5 06f94ea9) — các EC giữ -1 (không chạy) như thiết kế F-196-T8-2. Driver chạy lại KHÔNG dùng đợt này (84l10 PASS ngay lần đầu).
- **F-202-T8-2 (SELFCHECK GHI ĐÈ FILE — MẤT FILE #1):** selfcheck-postboot-202t8.sh luôn ghi cùng đường dẫn `smoke/selfcheck-postboot-202t8.txt` nên lần chạy #2 đã ghi đè file #1 (20:46:34Z trên #133: libs 6/6 THIẾU, libgst\* 0, dpkg 2, gst-inspect VẮNG, balloon 5.486.600 kB, avail 1.029 MB). Nội dung #1 còn trong output phiên làm việc (trích ở LIMITS này), không bịa thêm. **ĐÃ XỬ LÝ:** cp ngay sau mỗi lần chạy từ #2 trở đi (file `-2.txt` + `-3.txt` còn nguyên). Bài học: script tự đổi tên output theo lần chạy (hoặc T8 cp ngay sau mỗi lần chạy) — 201 làm ngầm, đợt này ghi rõ.
- **F-202-T8-3 (WAITER PHIÊN 1 + VÒNG CHỜ CHẾT THEO REBOOT #134):** waiter phiên 1 (setsid, khởi 20:46:31Z) chết theo reboot 21:05:15Z (poll cuối ghi 21:05:40Z, sau btime reboot 25 s — chênh lệch chưa giải thích; phiên 2 khởi lại và GATE-FOUND đúng nên không ảnh hưởng kết luận); vòng chờ nền của T8 cũng chết theo runtime restart cùng lúc (~21:06Z, không có kết quả xác nhận — chỉ là vòng poll đọc file, không có tác dụng phụ). **ĐÃ XỬ LÝ:** waiter phiên 2 khởi lại bằng setsid 21:07:36Z (sống tới GATE-FOUND poll=42); vòng chờ nền khởi lại, tìm thấy T4 .done 21:48:47Z poll=80. Bài học: sau mọi reboot/runtime restart phải kiểm lại waiter + vòng chờ còn sống không trước khi kết luận "đang chờ".
- **F-202-T8-4 (WAITER T8 GHI LOG TRONG W1 — TỰ BÁO, GIAO PARENT PHÁN (p)):** waiter phiên 2 append 4 dòng poll vào `smoke/wait-t4-t5.log` trong cửa sổ yên W1 (poll 27–30 lúc 21:33:40/21:34:40/21:35:40/21:36:40Z; W1 21:33:13–21:36:47Z). Đây là hoạt động thường xuyên của daemon poll (1 dòng/phút, chỉ đọc trạng thái + ghi log của mình), cùng lớp với sampler live T9 (daemon đứng — theo (p)-200 KHÔNG VI PHẠM), nhưng kiểm chồng lấn của T4 (§3 LIMITS T4) chỉ quét goal hidden_files nên KHÔNG thấy (log waiter nằm ở repo-1/hidden_files). T8 tự báo đầy đủ để parent phán (p)-202; T4 cũng ghi nhận T2-202 (3 file) + T56-202 (2 file) trong W1 (F-202-T4-3).
- **F-202-T8-5 (SYMLINK REPO-1/HIDDEN_FILES CHƯA SỬA LÚC MỞ):** symlink `t8-diag-stall.sh` ở goal hidden_files đã sửa lúc mở (→ 202t8), nhưng symlink cùng tên ở repo-1/hidden_files/ vẫn trỏ 201t8 tới lúc extract chạy 22:07Z mới phát hiện. **ĐÃ SỬA:** ln -sf về diag-stall-202t8.sh ~22:07Z; kiểm readlink cả 2 nơi lúc đóng đều → 202t8. Bài học: kiểm readlink CẢ 2 nơi lúc mở (F-200-T8-1 chỉ kiểm 1 nơi đợt này).
- **Nợ cũ:** F-194-T8-2/4/5 vẫn mở (check-fresh file vắng; nhãn echo; run-chromium grep HB128). F-196-T8-4 (balloon 95,4% #124) → đợt 200: 84,7%; đợt 201: 82,6%; đợt 202: **88,3%** (nặng hơn 201 — theo dõi đợt 203). F-196-T8-9 (baseline-meminfo EPERM) → đợt 199 + 200 + 201 + 202 đều ghi được (smoke mới). F-193-T8-1 (waiter reboot) → đợt 202: reboot #134 giết waiter phiên 1 (lần 4 — xem F-202-T8-3). F-200-T8-1 (symlink) → đợt này sửa cả 2 nơi lúc đóng (xem F-202-T8-5). F-200-T8-2 (P6 landed sớm) → đợt này P6-wait đủ 90 s cả 2 engine (18 dòng mỗi bên) — ĐÃ HẾT. F-200-T8-3 (muse.edit báo lỗi nhưng vẫn áp dụng) → đợt này viết LIMITS bằng muse.write toàn file, không edit từng phần. F-201-T8-1 (corpus mất entry) → đợt này GIỮ entry 201 + thêm entry 202 (kiểm: f-fix 66 entry, 63 có file + 3 mới; 1c 68 entry, 65 + 3). F-201-T8-2 (nhãn fail gắn sạch) → đợt này 3 entry 202 đều gắn nhãn `-sach-` theo kết quả PASS thật (nếu pha nào FAIL sẽ đổi thành `-fail-` sau harness — không pha nào FAIL nên giữ nguyên). F-201-T8-3 → F-202-T8-1 (đã sửa). F-201-T8-4 (waiter phiên 2 chết không reboot) → đợt này phiên 2 setsid sống tới GATE-FOUND — KHÔNG tái diễn. F-201-T8-5 (check-fresh --now=X) → đợt này dùng dạng tách riêng + parser đã sửa — B2 offline khớp hệt.

## 9. Nợ / chờ parent (T10 quyết ở §14.2 aggregate 202)

- (j) **V5 GIỮ LIVE?** (đề xuất: GIỮ — 5/5 kẹt mù, 0 FP trên 52 log sạch; live đợt này 0 trigger đúng vì không có kẹt; V2 vẫn là phương án chính 6/6; V4 GIỮ LIVE 5/5); 84l10 PASS — chuỗi PASS 0 → 1; **86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 22 → 23**; B2 vùng mới sạch lần 15 → 16 (P6-wait đủ 90 s cả 2 engine); B1 live 0 trigger (đợt SẠCH — chuỗi live sạch 0 → 1, đề xuất).
- (b) FULL PASS KHÔNG CÓ (chân harness 6/6 CÓ + chân yên #70 CÓ + chân O8 1/3 KHÔNG; chuỗi GIỮ 0).
- (c) POSTBOOT_PASS #134 CÓ (poll=1, repair-som-quyet-h — T56-202; verify độc lập exit 0 21:30:15Z); #133 CÓ (poll=1, lists 75 — T56-202); tổng boot không cờ GIỮ 31 nếu parent chấp nhận #134 CÓ (caveat? — T56 đề xuất không caveat như #128/#131, parent quyết (c)-202).
- (e) #132: **T9-201 bắt trực tiếp + bằng chứng DB độc lập** (T01-202: full boot_id 9a30eb2a, btime 17:03:20Z; (m) #132 THÔ 1 requeue DƯƠNG, biên 0,592 s — T2-202 phân loại CUỐI); #133: **T01-202 xác nhận 9 nguồn tươi** (btime 20:32:07Z, gap #132→#133 = 12.527 s); #134: **T01-202 xác nhận 9 nguồn tươi** (btime 21:05:15Z, gap #133→#134 = 1.988 s); marker 82 → 85 nếu cả #132 + #133 + #134 xác nhận (T01/T56 đề xuất); T01-202.done ghi "3 boot mới trong đợt" (tính cả #132 chết trước khi đợt mở — parent quyết cách đếm).
- (f) **(m) #131 DƯƠNG (CUỐI)** (T2-202); **(m) #132 THÔ 1 DƯƠNG** (T01-202, biên 0,592 s — T2-202 phân loại CUỐI); **(m) #133 THÔ 0 event** (T01-202 — T2-202 phân loại CUỐI); **(m) #134 THÔ 1 requeue DƯƠNG** (T01-202, biên 2,44 s — T2-203 phân loại CUỐI); B-#130 FALSE (T2-202); (m) #56 lần 44 VẪN CÓ ĐIỀU KIỆN (T2-202); n 58/61 → 59/62 nếu parent chấp nhận DƯƠNG #131. Mâu thuẫn chuỗi FULL175 mới (T2-202 phát hiện — parent quyết FULL175 chuẩn).
- (i) Holder: #132/#133/#134 KHÔNG GIẾT — chuỗi 7 → 10 nếu parent chấp nhận cả ba (T56-202). (A) 120/120 lần 51 + suite 9/9 × 6 lần 83 (T56-202, đo trên #134). **Caveat chuỗi: suite/(A) đo trên #134, lượt yên #70 đo trên #134, harness T8 đo trên #134 — CÙNG boot đợt này (khác đợt 201: yên/harness khác boot); chỉ O8 đo trên #133.**
- (m) Lượt yên #70 HỢP LỆ — chuỗi 2 → 3 (đề xuất). Live-check #21 ĐẠT — chuỗi live ĐẠT 0 → 1 (đề xuất). P3' cộng dồn MỚI 56 lượt hợp lệ (sổ md5 50f10815).
- (n) Reboot #134 giữa đợt (gap #133→#134 = 1.988 s) + run 210 TIMEOUT → CA #32 + lặng S11 8.405,823 s → OUTAGE #9 (T7-202 đề xuất) + cửa slot KHÔNG LÀNH: xem LIMITS T7-202 (T7 đã đóng). **O8 WebKit FAIL ×2 trên #133 (trước repair) + harness WebKit 3/3 PASS trên #134 (sau repair): T01-202 ghi "chạy lại sau repair thuộc T8-202 + parent" — T8 KHÔNG chạy lại (không nằm trong brief T8-202); parent quyết có chạy lại O8 đợt 203 hay giữ kết quả 1/3.**
- (p) Vi phạm: **T8 tự báo F-202-T8-4** (waiter ghi 4 dòng log trong W1 — giao parent phán); T2-202 + T56-202 ghi file trong W1 (F-202-T4-3 — giao parent phán). Harness chạy SAU khi T4 .done đã có (GATE-FOUND file-based 21:48:41Z — đúng quy tắc (p1), KHÔNG cần gate thực chất đợt này).
- (q) Đếm: T01-202 KHÔNG đếm đợt 202 (theo giao (r)-201); lũy kế/chờ push xem (q) aggregate 202 (T10 đếm toàn cục). T8 đóng góp 1 LIMITS (+ scripts).
- Chờ push 191–201 = (q)-201 (133/490/378/357) + batch đợt 202 (T10 đếm cuối).
