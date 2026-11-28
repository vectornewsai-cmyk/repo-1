# Đợt 200 T8 — HARNESS 6/6 TRÊN BOOT MỚI #130 (ỨNG VIÊN, c073c8bb, btime 11:21:41Z); 84l10 PASS LẠI (CHUỖI 1 → 2); 86n2-P1 DỮ KIỆN MỚI (20 → 21); V5 LIVE TIẾP, 0 TRIGGER; B1/B2 LIVE SẠCH

Ngày: 27/11/2026 (lượt cron 18:35:51 +07 = 11:35:51Z mở đợt 200; T8 mở ~11:38Z, đóng ~12:35Z — TRONG hạn cờ ~14:00Z và hạn cứng 14:35:51Z).
Phạm vi: (1) V5 live tiếp (theo (j)-199 — V5 GIỮ LIVE); (2) harness trên boot mới nhất; (3) B1/B2 live; (4) V2/V4/V5 replay; (5) O8 — KHÔNG CHẠY (T01-200 chạy trong phiên — xem §A).
**Nguồn đứng:** §14.2 aggregate 199 (parent viết trực tiếp, lượt handoff 15:39 +07 27/11 — SẠCH, lần sạch thứ bảy; aggregate 86.880 B — bản đã KHÔI PHỤC sau ghi đè giả 09:11Z). Các mốc parent dùng: (j) V5 GIỮ LIVE (0 trigger, không kẹt — đúng; V2 phương án chính 6/6; V4 GIỮ LIVE 5/5; 11/11 kẹt, 0 FP trên 47 log sạch); 84l10 PASS — chuỗi 0 → 1; 86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 19 → 20; B2 vùng mới sạch lần 13; (b) Harness 6/6 trên #129 (chuỗi 84l10 0 → 1); (o) Auto-trigger GIỮ LIVE (133 mẫu đợt 199, tất cả consec=0, 0 FIRE; tổng live 1.227 mẫu, 0 FIRE); (r) T8-200: V5 live tiếp, B1/B2 live, harness trên boot mới nhất, **chờ T4 .done trước khi chạy harness (đúng (p1)-198 — T8-199 đã làm đúng)**.
**Boot mới:** VM reboot trước khi đợt mở — uptime chỉ 16 phút lúc 11:38Z. Boot hiện tại `c073c8bb-26f3-41e8-a4b5-3d56ce3564f8`, btime 11:21:41Z — **ỨNG VIÊN #130 (T01-200 survey 9 nguồn tươi 11:39:01Z, CÓ ĐIỀU KIỆN: nếu daemon restart 08:41:43Z là reboot thì boot này = #131 — F-200-T01-9, parent quyết (e)-200; T5-200 cũng gọi boot này là #130). Gap #129→#130 = 16.965 s (4h42m45s).**

## 0. Kết luận ngắn — HARNESS 6/6; KHÔNG KẸT MỚI; T4 CÓ LƯỢT YÊN #68 HỢP LỆ

- **BOOT #130 (ỨNG VIÊN, CÓ ĐIỀU KIỆN) `c073c8bb` (btime 11:21:41Z)** — T01-200 survey 9 nguồn tươi; POSTBOOT_PASS CÓ 12:01:06Z (T56, poll=1, repair-som-quyet-h, dpkg 777 — cùng hồ sơ #129); marker 80 → 81 nếu parent xác nhận #130.
- **HARNESS #130 (12:13:13–12:28:21Z): WebKit 84l10 PASS + 85m4 PASS + 86n2 PASS; Chromium 3/3 PASS. 6/6 — KHÔNG KẸT MỚI.** Kẹt harness cộng dồn GIỮ 31.
- **84l10 PASS — chuỗi 1 → 2** (sau PASS lại đợt 199). **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 12:18:23Z trên WebKit #130 → chuỗi 20 → 21.**
- **V2+V4+V5 = 11/11 kẹt, 0 FP trên 47 log sạch duy nhất** (44 → 47: +200-sach-84l10/85m4/86n2). V2 6/6 + V4 5/5 + V5 5/5 (không đổi — đợt này không có kẹt mới). V5 live: 0 trigger (không có kẹt để bắt); B1 live sạch.
- **B2 vùng mới sạch lần 14** (13 → 14); 0 trigger trên cả 6 pha — với caveat: vùng P6-wait trên WebKit 86n2 KHÔNG chạy đủ 90 s đợt này (P6 landed sớm sau 3,6 s — xem F-200-T8-2; Chromium 86n2 chạy đủ 90 s, 0 trigger).
- **T4-200: lượt yên #68 HỢP LỆ (attempt1 20/20, B 5/5, tickCost 55,0 ms — chuỗi lượt yên hợp lệ 0 → 1, đề xuất); live-check #19 ĐẠT (chuỗi live ĐẠT 0 → 1, đề xuất). B2 dữ kiện #12 (cách đếm (j)-199: mỗi đợt = 1): W1 0 spike.**
- **O8 T01-200: attempt1 FAIL (S1, exit=2) + probe FAIL, attempt2 PASS 21/21 + Chromium PASS 21/21 — chân FULL PASS O8 KHÔNG ĐẠT (2/3, theo T01-200).**
- **FULL PASS: KHÔNG CÓ** — chân O8 KHÔNG đạt (2/3) dù chân lượt yên #68 CÓ; chuỗi full pass GIỮ 0.
- **T8 0 vi phạm** (GATE-FOUND file-based 12:12:06Z đúng quy tắc (p1); gate-check 6/6 lần "T4 khong giu lock"; vite nối tiếp; lock trống trước khi chạy).

## 1. Dòng thời gian (gọn)

- 11:21:41Z **Boot mới `c073c8bb`** (btime; #129 chết trước đó — T01-200 survey). 11:35:51Z Đợt 200 mở (lượt cron 18:35:51 +07, run 208). 11:38Z T8 mở (đọc §14.2 aggregate 199 + LIMITS T8-199). 11:39:01Z Waiter T8 khởi động (deadline 14:00Z). 11:39:34Z Selfcheck #1: libs 6/6 THIẾU, libgst\* 0, dpkg 2 — boot mới CHƯA repair (giống #129 pre-repair đợt 199). 11:39:57Z T4-200 poller khởi động (deadline 13:30Z, 3 attempt). 11:43:24–11:50:36Z O8 T01 (lock T01; attempt1 FAIL, attempt2 + Chromium PASS). 11:45:49Z T56 EARLY-REPAIR TRIGGER; apt-get update ~15 phút, install xong 12:01:06Z.
- **12:01:06Z POSTBOOT_PASS #130 CÓ** (T56, poll=1, repair-som-quyet-h, dpkg 777). **12:01:09Z T4 W1 mở (attempt1)** — 12:04:36Z inner-end 20/20 HỢP LỆ; poller thoát 12:05:10Z. 12:02:54Z Selfcheck #2: libs 6/6 CÓ, libgst\* 79, dpkg 777. **12:11Z T4 .done** (lượt yên #68 HỢP LỆ). **12:12:06Z GATE-FOUND poll=34** (t4=OK + postboot đường (a) + no-lock). **12:13:13Z HARNESS BẮT ĐẦU** — 12:28:21Z ALL DONE 6/6. T8 đóng ~12:35Z, TRONG hạn cờ.
- Fixture rebuild 11:39Z (lần 1, duy nhất — không reboot giữa phiên): md5 khớp đợt 125 cả 4 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).

## 1b. Gate — GATE-FOUND FILE-BASED ĐÚNG QUY TẮC (p1) (không cần gate thực chất)

- Waiter 1 phiên, 34 poll 11:39:01–12:12:06Z (GATE-NOT-YET suốt tới poll 33; postboot=0 tới 12:01:06Z rồi =1 từ poll 24; t4attempt=LOCK-T4 trong lúc T4 attempt1 chạy 12:01–12:05Z, no-lock sau đó). **GATE-FOUND poll=34 12:12:06Z: t4=OK + postboot=round200-t56/POSTBOOT_PASS (đường a) + t4attempt=no-lock.**
- Đây là lần thứ hai liên tiếp T8 chạy harness theo gate file-based ĐÚNG quy tắc (p1) mà KHÔNG cần gate thực chất: T4 .done CÓ 12:11Z (nội dung khớp LIMITS T4: lượt yên #68 HỢP LỆ, live-check #19 ĐẠT, P3' cộng dồn 54 lượt, sổ md5 2d3ee86c) + POSTBOOT_PASS #130 CÓ 12:01:06Z (T56, poll=1, repair-som-quyet-h, dpkg 777, verify độc lập #130 exit=0 12:05:52Z ngoài cửa sổ (b) — theo T56) + lock vite-lock-v2 TRỐNG + 0 process T4 sống lúc đóng (T4 .done ghi rõ). Harness bắt đầu 12:13:13Z — 67 giây SAU GATE-FOUND (kiểm fixture/tree/lock trước khi chạy).

## A. O8 — T01-200 CHẠY TRONG PHIÊN; T8 KHÔNG CHẠY O8

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T01 WebKit attempt1 trên #130 | **FAIL — exit=2** (11:43:24–11:43:51Z; S1 FAIL: không đo được rect checkbox tự tạo proxy + `page.setInputFiles: Target crashed`; JSON 1.575 B, md5 c09f81ca) |
| 2 | O8 T01 S1 probe sau attempt1 | **FAIL — exit=2** (11:43:51–11:48:06Z; timeout chờ mẫu tự load) |
| 3 | O8 T01 WebKit attempt2 trên #130 | **21/21 PASS** — exit=0 (11:48:06–11:49:30Z; S1 PASS bằng mouse click lần 2; JSON md5 fcbe0ea7) |
| 4 | O8 T01 Chromium trên #130 | **21/21 PASS** — exit=0 (11:49:30–11:50:36Z; JSON md5 f9903c26) |
| 5 | O8 T8 (bộ thứ hai) | **KHÔNG CHẠY** — T01 đã chạy O8 trong phiên (brief: chạy bộ thứ hai nếu T01 chưa chạy; không chạy trùng) |

- O8 chạy cùng cây 477a0eac/ac89aeb2/ee80d093 (driver start 11:43:24Z ghi preview.tsx=477a0eac), cùng boot #130 với harness T8. 0 lỗi exit 127. **Chân FULL PASS "O8 3/3": KHÔNG ĐẠT đợt này (2/3 — attempt1 FAIL + probe FAIL, theo T01-200).** Attempt1 FAIL ở S1 (setup, trước khi import) — không phải kẹt harness (không timeout 900 s, không im lặng HB128); attempt2 PASS cùng S1 ngay sau đó nên khả năng cao là flake khởi động (target crash lúc setInputFiles) hơn là lỗi sản phẩm — T01-200 không kết luận thêm; T8 chỉ báo số.
- O8 attempt1 chạy TRONG LÚC T4 chỉ poll (0 chồng lấn; T4 gate0 lúc đó chưa đạt, attempt1 chưa mở).

## 2. Kết quả harness — 6/6 TRÊN 1 BOOT (#130) — KHÔNG KẸT MỚI

### 2a. Boot #130 (12:13:13–12:28:21Z) — WebKit 3/3 PASS, Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 12:13:13–12:14:34 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS, "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 2 | WebKit 85m4 | 0 | 12:14:50–12:17:33 | **PASS** — P1/P2/P3/P4 ×3/P5 PASS, "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 12:17:48–12:20:42 | **PASS** — **P1 PASS 12:18:23Z (DỮ KIỆN MỚI — chuỗi 86n2-P1 20 → 21)** + P5 PASS + P6 CÓ-RESTART (+1, ended-at-duration — hợp lệ, xem F-200-T8-2), live_diags=0 |
| 4 | Chromium 84l10 | 0 | 12:20:57–12:21:57 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 12:22:13–12:24:14 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 12:24:29–12:28:21 | **PASS** — P1 PASS 12:25:00Z + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 31 (0 kẹt mới). 84l10 PASS — chuỗi 1 → 2. 86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 20 → 21.**
- RAM sampler #130 (n=31 mẫu suốt harness, +1 dòng header): balloon min 3.389.424 / max **5.460.248 kB (84,7% trần)**, mean 4.218.246, pinned=0; avail min **620 MB (12:28:11Z)** / max 2.933 MB. Nhẹ hơn đợt 199 trên #129 (87,8%, avail min 440 MB) nhưng balloon max 84,7% vẫn là mức cao thứ tư từng ghi trong lúc harness (sau #124 95,4%, #125 91,6%, #129 87,8%).
- GATE-CHECK trước MỖI pha: 6/6 lần "T4 khong giu lock" (load5 0,79–3,30) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 12:05:10Z; T4 .done có 12:11Z). **T8 0 vi phạm.**
- **ALL DONE 12:28:21Z ghi đúng `ec webkit: 84l10=0 85m4=0 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0`** — fix ec=-1 kiểm chứng lại trên harness thật (lần 4 liên tiếp; xem §C1).

## C. B1/B2 live + V2/V4/V5 replay

### C1. Script md5 (đổi nhãn 200t8 — V5 giữ nguyên từ 199t8; còn lại chỉ đổi nhãn + lock t8-round200 + deadline waiter 14:00Z)

| Script | md5 | Byte | Ghi chú |
|---|---|---|---|
| check-fresh-200t8.py | d5bd9acc | 15.246 | đổi nhãn 199t8 (diff chỉ nhãn — logic V2/V4/V5 KHÔNG đổi; kiểm chứng §C5) |
| diag-stall-200t8.sh | 5f6c2175 | 2.292 | đổi nhãn |
| extract-200t8.py | 5d5e6d4f | 7.913 | đổi nhãn + archive-200-* + nhãn 200-sach |
| wait-t4-t5-200t8.sh | 0b9da480 | 3.948 | đổi nhãn + deadline 14:00Z 27/11 |
| run-webkit-200t8.sh | 92e039d4 | 13.980 | đổi nhãn (check-fresh chạy TRƯỚC mỗi poll, V5 live — giữ từ 199) |
| run-chromium-200t8.sh | b5200847 | 13.486 | như run-webkit |
| replay-1c-200t8.py | 3fdd87fe | 21.552 | đổi nhãn + thêm entry 200 (KHÔNG đổi entry cũ) |
| replay-f-fix-200t8.py | 512b5b03 | 19.722 | như replay-1c + thêm entry 200 |
| replay-wallclock-200t8.py | 35eb5766 | 11.677 | đổi nhãn + thêm entry 200 qua replay-f-fix |
| launch-test-webkit-200t8.mjs | 1d3d7d54 | ~1.289 | đổi nhãn |
| run-diag-84l10-w2setup-200t8.sh | cb5aced3 | 10.114 | driver diag W2-setup — KHÔNG chạy đợt này (xem §F) |
| build-84l10-w2setup-hb128.py | 646e17ec | 4.560 | KHÔNG ĐỔI md5 so với đợt 196/197/198/199 |
| selfcheck-postboot-200t8.sh | 08659715 | 2.299 | đổi nhãn |
| rebuild-fixtures-200t8.sh | 7b885713 | 2.810 | đổi nhãn |
| verify-163-200t8.py | 56853c1d | 2.616 | đổi nhãn (không chạy đợt này) |
| o8-driver-200t8.sh | cf307b24 | 6.660 | đổi nhãn + lock t8-round200 — KHÔNG CHẠY đợt này (T01 đã chạy O8) |
| o8-s1-probe-200t8.mjs | 453d1082 | 55.280 | KHÔNG ĐỔI md5 so với đợt 196/197/198/199 (**VƯỢT trần push** — file cũ, không đổi) |
| symlink `t8-diag-stall.sh` | — | — | **ĐÃ SỬA** về diag-stall-200t8.sh ở cả 2 nơi (repo scripts + hidden-root) — xem F-200-T8-1 |

- Script điều khiển pha: 84l10 `16e5e957` (35.917 B) / 85m4 `3fb2548b` (**38.737 B — VƯỢT trần push**) / 86n2-hb128 `de925614` (**43.653 B — VƯỢT trần push**) / 86n2-std `628088bd`; 87o8-webkit `4994b4fc` / 87o8-headed `c8acd72e`. **Cả 6 file điều khiển pha KHÔNG ĐỔI so với đợt 197/198/199** (md5 khớp).
- Báo cáo JSON ok=true (chỉ trích số 200): `l10-scratch` finishedAt 12:14:25Z; `m4-scratch` 12:17:29Z; `n2-hb128-scratch` 12:20:32Z; `l10-scratch-chromium` 12:21:56Z; `m4-scratch-chromium` 12:24:11Z; `n2-hb128-scratch-chromium` 12:28:12Z. **KHÔNG có báo cáo stale** (scratch mới hoàn toàn đợt này — không copy từ đợt trước).

### C2. Offline B2 — 6 ca §C2 đóng băng: KHỚP HỆT đợt 186–199, ĐẠT

| Case | Log tổng hợp (đợt 186) | Kết quả (check-fresh-200t8.py, --now/--until=last_ts — V5 silence=0) |
|---|---|---|
| B2-1 setup | planb-b2-setup-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-2 startPlaying | planb-b2-startplaying-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-3 P6-wait-wd | planb-b2-p6wait-150s-wd.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=wd) |
| B2-4 P6-nowd | planb-b2-p6wait-150s-nowd.log | **KHÔNG kích hoạt** (maxspan=150 s — giới hạn đã biết) |
| B2-5 P6-clean | planb-b2-p6-clean-90s.log | **KHÔNG kích hoạt** (maxspan=85 s) |
| B2-6 setup-clean | planb-b2-setup-clean-60s.log | **KHÔNG kích hoạt** (maxspan=55 s) |

- Chạy với --now/--until = last_ts đầy đủ từng file (bài học F-199-T8-2: không ghép ngày hiện tại vào giờ trong log — log từ 24/11). Kết quả lưu `smoke/b2-offline-200t8.txt`.

### C3. Live — V5 0 trigger (không có kẹt); B2 vùng mới 0 trigger; V2/V4 im lặng đúng chỗ

| Pha | HB128 (dòng) | Kết quả check-fresh live |
|---|---|---|
| #130 WebKit 84l10 (**PASS**) | 6 | OK (maxspan=0 s, wd=0, maxgap=11 s) |
| #130 WebKit 85m4 | 21 | OK (maxspan=5 s, wd=0, maxgap=13 s) |
| #130 WebKit 86n2 | 22 | OK (maxspan=5 s, wd=0, maxgap=10 s; **KHÔNG có run P6-wait 5→90 s — P6 landed sớm, xem F-200-T8-2**) |
| #130 Chromium 84l10 | 5 | OK (maxspan=0 s, wd=0, maxgap=8 s) |
| #130 Chromium 85m4 | 19 | OK (maxspan=10 s, wd=0, maxgap=6 s) |
| #130 Chromium 86n2 | 39 | OK (maxspan=85 s, wd=0, maxgap=8 s; P6-wait 5→90 s, biên 35 s, không FP) |

- **B1 live: 0 trigger — đợt này KHÔNG có kẹt nên V5 không có gì để bắt (V5 vẫn armed cả 6 pha; 0 FP). Chuỗi live sạch: đợt này SẠCH (6/6 PASS, 0 kẹt) — chuỗi 1 → 2 (đề xuất, theo tiền lệ đợt 179: đợt sạch tính từ 1; đợt 199 sạch chuỗi 1, đợt này sạch tiếp → 2).**
- **B2 vùng mới (setup/startPlaying/P6-wait): 0 trigger trên cả 6 pha → B2 vùng mới sạch lần 14 (13 → 14)** — với caveat F-200-T8-2: vùng P6-wait trên WebKit 86n2 không chạy đủ 90 s đợt này nên "0 trigger" ở vùng đó trên WebKit là vacuous; Chromium 86n2 chạy đủ 90 s (18 dòng P6-wait, 0 trigger) + B2 offline 6 ca (§C2, P6-wait có watchdog vẫn TRIGGER) bù phủ sóng.
- LIVE-DIAG-189 (nhánh mtime): **0 lần** đợt này — V5/check-fresh chạy trước mỗi poll nên đã bao phủ; nhánh mtime chỉ còn fallback (không kích hoạt lần nào — đúng thiết kế).
- WATCHDOG-137 trong-script: 0 lần. Diag live: 0 lần (không có kẹt). Tổng 0 thư mục stall.

### C4. Replay — V2 6/6 + V4 5/5 + V5 5/5 = V2+V4+V5 11/11, 0 FP trên 47 log sạch

| Kiểm tra | 200-sach-84l10 (md5 87c1db5f) | 200-sach-85m4 (md5 c549b963) | 200-sach-86n2-hb128 (md5 cceb6f63) | Cộng dồn |
|---|---|---|---|---|
| Replay-1c (c') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | (c') KHÔNG ĐỔI so với 199: kẹt-164 TRIGGER @125 s, lỡ 171 + 179 (đã biết, đã ghi); 0 FP trên log sạch |
| Replay-f-fix (f') ≥180/300/600 s | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | (f') ĐẠT trên tiêu chí 2 kẹt (164@125 s + 171@185/305/605 s), 0 FP |
| Replay-f-fix (f'') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt (0 dòng HB128 — 84l10 không log HB128 ở W1) | **V2 (f'') 6/6 trong lớp HB128** |
| Replay-f-fix V4 (f'''') | KHÔNG kích hoạt (gap=11 s) | KHÔNG kích hoạt (gap=13 s) | KHÔNG kích hoạt (gap=10 s) | **V4 5/5 kẹt mù** (179/180/192/197/198) |
| Replay-wallclock V5 (f''''') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | **V5 5/5 kẹt mù** (179/180/192/197/198) |

- **Số log sạch chuẩn (md5-unique): 44 → 47** (49 entry sạch, 47 unique; 3 log 200 đều duy nhất; 2 cặp trùng cũ 181/182 giữ nguyên: 166b271d, e11c62cb). **0 FP** trên toàn corpus sạch (corpus replay-f-fix: 60 entry = 49 sạch + 11 kẹt).
- **Hồi quy V2/V4: check-fresh-200t8.py vs 197t8.py KHỚP HỆT trên 57 log** (--now/--until=last_ts; V5 silence=0).

### C5. V5 (f''''') — GIỮ LIVE, 0 TRIGGER ĐỢT NÀY (KHÔNG CÓ KẸT); KIỂM CHỨNG LẠI TRƯỚC HARNESS

**Thiết kế (quyết (j)-197, giữ nguyên đợt 200):** trigger khi im lặng MỞ (trailing silence) `now - dòng timestamp CUỐI CÙNG >= 120 s` (cùng ngưỡng V2/V4), chỉ đánh giá khi process pha còn sống (driver chỉ gọi check-fresh trong vòng poll `while kill -0 node_pid`). V5 bổ sung, không thay thế V2 (V2 vẫn là phương án chính trong lớp HB128); V4 GIỮ LIVE. Giới hạn còn lại: log 0 dòng timestamp thì V5 không đo được (như V4) — nhánh mtime LIVE-DIAG-189 trong driver vẫn là fallback.

**Kiểm chứng lại TRƯỚC harness đợt này (replay-wallclock-200t8.py, chạy 11:41Z, lưu `smoke/replay-wallclock-200t8.out`):**
- V5 bắt 5/5 kẹt mù cũ (179 gap 723 s, 180 gap 718 s, 192 gap 793 s, 197 gap 760 s, 198 gap 784 s) tại gap_start+120 s — sớm hơn V4-live 598–673 s.
- V5 KHÔNG fire trên 6/6 kẹt lớp V2 (HB128 vẫn chảy trong lúc kẹt).
- 0 FP trên 44 log sạch duy nhất (max gap trong-log sạch 97 s — biên 22 s; max tail summary-end−last_ts 9,8 s — biên 110,2 s).
- Sau harness: corpus +200 (0 kẹt + 3 sạch) → **V5 5/5 kẹt mù, 0 FP trên 47 log sạch duy nhất**; V2/V4 hồi quy 57/57 khớp (pre) + 60/60 khớp (post, replay-f-fix-200t8-post.out).
- Live đợt này: V5 armed cả 6 pha, **0 trigger — đúng (không có kẹt)**; V4 live 0 trigger; V2 live 0 trigger. B1 live sạch.

## D. Điều tra 84l10 đợt 23 + KẸT #31 (hậu kiểm)

- **D1 (84l10 ×2 lần chạy):** WebKit #130 PASS (W1 ×3 PASS 12:13:31/36/42Z, W1b, W2 PASS 12:14:14Z, E4 PASS 12:14:24Z; 6 dòng HB128 ở W2). Chromium #130 PASS (W1 ×3 + W2 + E4). **84l10 PASS — chuỗi 1 → 2.** 84l10 không còn là pha ổn định nhất vẫn đứng (kẹt #31 đợt 198 là kẹt 84l10 đầu tiên kể từ #28 đợt 192; đợt này pass lại lần 2 liên tiếp).
- **D2 (kẹt 84l10 — 2/23 ≈ 9%):** 84l10 kẹt các đợt 192 (#28, W2-setup) và 198 (#31, W1-lần3). Đợt này W1-lần3 PASS (12:13:42Z) — cùng call-site với #31 nhưng không tái hiện kẹt; #31 vẫn là kẹt mù thuần túy nhất (0 dòng HB128 toàn log).
- **D3 (bằng chứng đã lưu):** `smoke/` — run-webkit-84l10.log (md5 87c1db5f), run-webkit-85m4.log (md5 c549b963), run-webkit-86n2-hb128.log (md5 cceb6f63), 3 log chromium, ram-200t8.log (n=31 mẫu), run-webkit-summary.txt, replay .out ×3 (+pre/+post), extract .out, waiter log 1 phiên, selfcheck ×2, rebuild-fixtures ×1.
- **D4 (so #31):** #31 là 84l10 W1-lần3, 0 dòng HB128 toàn log, V5 bắt live 01:33:38Z đợt 198. Đợt này cùng pha, cùng call-site, PASS sạch lần 2 liên tiếp — không có mẫu kẹt lặp cùng call-site 3 đợt liên tiếp.

## B. H3 — WebKitGTK treo — GIỮ ỦNG HỘ MẠNH (không có dữ kiện mới đợt này)

- Đợt này KHÔNG có kẹt harness nào (6/6 PASS) nên H3 không có thêm bằng chứng ủng hộ hay phản bác. Chữ ký kẹt #31 (đợt 198) vẫn khớp H3 (biến thể 0-HB128). WebKit chạy được trên #130 nhờ libs hệ thống sau repair T56 (6/6 CÓ) + debroot dự phòng trong driver (F-197-T8-1, giữ nguyên); launch-test headed PASS trên #130 theo T56 verify (exit 0, 12:05:52Z — ngoài cửa sổ (b), theo T56).
- Không phải H1 (T4 đã đóng, poller thoát 12:05:10Z, 0 attempt lúc harness chạy 12:13:13Z), không phải H2 (ENOSPC — dpkg 777 dòng ổn định trong lúc harness).

### C6. Debroot — WebKit chạy được nhờ libs hệ thống SAU REPAIR + debroot dự phòng

- **Dữ kiện gốc:** 84l10 PASS 3 đợt liên tiếp (193/194/195) với scanner VẮNG → giả thuyết "thiếu scanner" đã bị bác đợt 196 (kẹt #29 xảy ra với gst-inspect CÓ).
- **Dữ kiện đợt 200:** selfcheck #1 TRƯỚC repair (11:39:34Z): libs hệ thống 6/6 THIẾU, libgst\* 0, dpkg.log 2 dòng; selfcheck #2 SAU repair (12:02:54Z): libs 6/6 CÓ, libgst\* 79, dpkg 777. Driver T8 vẫn vá LD_LIBRARY_PATH + GST_PLUGIN_PATH/SYSTEM_PATH → debroot cho 3 pha WebKit (F-197-T8-1, giữ nguyên); launch-test headed PASS trên #130 (T56 verify exit 0, 12:05:52Z). Cùng điều kiện scanner vắng (gst-inspect + gst-plugin-scanner VẮNG): 84l10 PASS + 85m4 PASS + 86n2 PASS + Chromium 3/3 PASS. **Scanner vắng riêng lẻ KHÔNG phân biệt kẹt/pass — giả thuyết "thiếu scanner" vẫn bị bác (lần 5).**
- **Debroot vẫn là đường dự phòng:** `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu` (348 file; GST 269 plugin).

## E. Checklist (o) — các giá trị T8 cung cấp cho aggregate đợt 200 (T10 quyết)

- (a) Harness: WebKit 84l10 PASS + 85m4 PASS + 86n2 PASS trên #130; Chromium 3/3 PASS trên #130; **6/6 — ĐẠT.**
- (b) FULL PASS: **KHÔNG CÓ** (chân O8 KHÔNG đạt — T01-200: attempt1 FAIL + probe FAIL, 2/3; chân lượt yên #68 CÓ nhưng không đủ; chuỗi full pass GIỮ 0).
- (j) **V5 GIỮ LIVE (đề xuất — 5/5 kẹt mù, 0 FP trên 47 log sạch; live đợt này 0 trigger, đúng vì không có kẹt)**; 84l10 PASS — chuỗi 1 → 2; **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 12:18:23Z → chuỗi 20 → 21**; B2 vùng mới sạch lần 13 → 14 (với caveat F-200-T8-2: P6-wait WebKit không chạy đủ 90 s); B1 live sạch (đợt sạch — chuỗi 1 → 2, đề xuất); **V2+V4+V5 = 11/11, 0 FP trên 47 log sạch**; V2 VẪN là phương án chính (6/6 lớp HB128); V4 GIỮ LIVE (5/5). **B2 dữ kiện #12: W1 0 spike (T4-200; cách đếm (j)-199: mỗi đợt = 1) — KHÔNG TÁCH vẫn đứng** (T4 chỉ báo số).
- (m) Lượt yên #68: **HỢP LỆ** (T4-200: attempt1 20/20, B 5/5, tickCost median 55,0 ms — chuỗi lượt yên hợp lệ 0 → 1, đề xuất). Live-check #19: **ĐẠT** (T4-200: 1 cửa sổ hợp lệ + 0 spike B2 + 3 mẫu autotrigger consec=0, 0 FIRE — chuỗi live ĐẠT 0 → 1, đề xuất). P3' cộng dồn MỚI 54 lượt hợp lệ (P1 238/242, P2 233/233, P3-A1 202/242, P3' 200/214 occ = 148/151 distinct, P7 136/136; sổ md5 2d3ee86c).
- (n) Stall/outage: **0 kẹt harness mới đợt này** (cộng dồn GIỮ 31). Reboot #130 trước đợt (btime 11:21:41Z, gap #129→#130 = 16.965 s — T01-200 survey; phân loại thuộc T7-200 + parent). Run 208 kết cục + cửa slot 200 + tổng lặng thuộc T7-200 (T8 chỉ cung cấp kẹt harness + reboot).
- (o) Auto-trigger: T9-200 chưa đóng lúc T8 đóng — số mẫu đợt này xem LIMITS T9-200; trong cửa sổ T4: 3 mẫu live watch/consec=0, 0 FIRE (T4-200 .done).
- (p) Vi phạm: **T8 0 vi phạm** (GATE-FOUND file-based 12:12:06Z đúng (p1); gate-check 6/6 lần "T4 khong giu lock", 0 chồng lấn; vite nối tiếp; lock trống trước khi chạy). Harness chạy SAU khi T4 .done đã có — KHÔNG cần gate thực chất đợt này.
- (E-247) MỞ — không có dữ kiện mới đợt này từ T8 (T9-200 chưa đóng; xem LIMITS T9-200).

## F. Diag W2-setup — DỪNG (không chạy đợt này)

- Diag W2-setup (run-diag-84l10-w2setup-200t8.sh, md5 cb5aced3, 10.114 B + build-84l10-w2setup-hb128.py, md5 646e17ec, 4.560 B) KHÔNG chạy đợt này — không có ca kẹt 84l10 W2 để điều tra (84l10 PASS cả W1 lẫn W2 đợt này; kẹt #31 thuộc W1-lần3/forceOnce, không phải W2; đã có diag live ×2 (V5) + WATCHDOG + probe TIMEOUT + diag sau timeout đợt 198). Giữ script cho đợt sau.

## 5. Cây lúc đóng + md5 (kiểm lúc ~12:29Z)

- preview.tsx `477a0eac` (không đổi so với đợt 198/199); media.ts `ac89aeb2` (không đổi); vite.config.ts `ee80d093` (không đổi). **Harness #130 cùng cây 477a0eac/ac89aeb2/ee80d093. O8 T01 chạy cùng cây này trên #130 (cùng boot, cùng cây — xem §A).**
- Fixture rebuild 1 lần (11:39Z trên boot mới): md5 khớp đợt 125 cả 4 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).
- /tmp fixture đã rebuild xong trước harness lần 1. baseline-meminfo.txt ghi được (smoke mới).

## 6. Dọn dẹp + kiểm cuối (extract-200t8.py, chạy 12:29Z)

- ps sót T8: 0 (Xvfb :199, MiniBrowser, WebKitWebProcess, clicktest T8 — 0). X11 files: 1 (X193 — socket sót từ đợt cũ, KHÔNG phải của T8-200; socket X199 của T8 đã dọn).
- Symlink t8-diag-stall.sh: cả 2 nơi → diag-stall-200t8.sh.
- Lock vite-lock-v2: TRỐNG (0 ticket + 85 cooldown).
- Vite: không còn vite nào của T8 chạy (driver đã exit sạch 12:28:21Z). Chrome/Chromium: 0 process T8 còn lại.
- **T4 .done ĐÃ CÓ TRƯỚC khi harness chạy** (12:11Z — GATE-FOUND 12:12:06Z; harness 12:13:13Z). **T56 .done ĐÃ CÓ lúc T8 đóng** (POSTBOOT #130 + watcher + holder — xem §E/(i) dưới).
- Bằng chứng giữ nguyên trong smoke/ (6 log pha + ram log + summary + replay .out ×3 (+pre/+post), extract .out, waiter log 1 phiên, selfcheck ×2, rebuild-fixtures).

## 7. Giới hạn

- Harness 6/6 trên 1 boot (#130); O8 trên #130 (cùng boot, cùng cây) nhưng attempt1 FAIL — chân FULL PASS O8 không đạt.
- T8 đóng TRONG hạn cờ (~12:35Z vs ~14:00Z).
- POSTBOOT_PASS #130 CÓ (poll=1, repair-som-quyet-h — như #129). #130 ỨNG VIÊN CÓ ĐIỀU KIỆN (F-200-T01-9: daemon restart 08:41:43Z chưa giải quyết — parent quyết (e)-200).
- Sampler n=31 (chỉ suốt harness); không có sampler suốt phiên.
- Số liệu T4/T2/T01/T56/T7 trích từ LIMITS/.done của họ (đã đọc), không đo lại. T9-200 chưa đóng lúc T8 đóng — số liệu của họ (headroom, auto-trigger đợt, E-247) xem LIMITS của họ. T7-200 chưa đóng — run 208/cửa slot/tổng lặng xem LIMITS của họ.
- LIMITS này < trần push 37.768 B (kiểm sau khi ghi).

## 8. Sai số mới + nợ cũ

- **F-200-T8-1 (SYMLINK t8-diag-stall.sh CŨ — LIMITS T8-199 GHI SAI):** LIMITS T8-199 §C1 ghi "ĐÃ SỬA về diag-stall-199t8.sh ở cả 2 nơi", nhưng kiểm lúc 11:41Z đợt 200 cả 2 symlink (repo `apps/web/scripts/t8-diag-stall.sh` + goals hidden-root `t8-diag-stall.sh`) vẫn trỏ `round198-t8/diag-stall-198t8.sh` (mtime 00:34 27/11); repo `hidden_files/t8-diag-stall.sh` không tồn tại. **ĐÃ SỬA đợt này:** cả 2 symlink → `round200-t8/diag-stall-200t8.sh` (11:41Z, readlink xác nhận). Ảnh hưởng thực tế: nhỏ (diag-stall 198t8 vs 200t8 chỉ khác nhãn) — nhưng ghi nhận sai lệch sổ sách đợt 199. Bài học: kiểm symlink bằng `readlink` lúc đóng, không tin ghi chú cũ.
- **F-200-T8-2 (86n2 WEBKIT P6 LANDED SỚM — 0 DÒNG P6-WAIT HB128, P6 CÓ-RESTART (+1) HỢP LỆ):** WebKit 86n2 đợt này có 22 dòng HB128 (đợt 199: 39) — thiếu đúng 18 dòng P6-wait 5→90 s. Nguyên nhân: P5-phaseB-long kết thúc ở ct≈29,1/30 s (12:20:15Z) nên P6 bắt đầu khi clip đã ở 29,3/30; clip chạm cuối sau 3,6 s (landed dtWaitMs=3630, fromCt 29,267 → toCt 29,833) rồi restart +1 (causeTag `ended-at-duration`) — restart hợp lệ ở cuối clip, KHÔNG phải restart dư. P6-after-landing log 2 dòng (ct=30, playhead=30). Phase vẫn exit=0, "KẾT QUẢ: KHÔNG FAIL", JSON ok=true → **PASS đứng**. Đây là đường đi phụ thuộc thời gian (vị trí clip lúc P6 bắt đầu), không phải lỗi harness. Hệ quả: (i) B2 vùng P6-wait trên WebKit đợt này không có phủ sóng live 90 s (bù bằng Chromium 86n2 đủ 90 s + B2 offline §C2); (ii) maxspan WebKit 86n2 chỉ 5 s (đợt 199: 85 s) — KHÔNG phải cải thiện, chỉ là P6 không chờ đủ 90 s. Ghi nhận để T10 không đọc nhầm maxspan.
- **F-200-T8-3 (MUSE.EDIT BÁO LỖI NHƯNG VẪN ÁP DỤNG — TIÊU ĐỀ LIMITS):** lúc cập nhật LIMITS sau harness, lệnh `muse.edit` thay tiêu đề báo "text not found; no close match" nhưng kiểm bằng `od -c` thấy tiêu đề MỚI đã ghi vào file (body vẫn bản cũ); lệnh edit lớn sau đó cũng báo lỗi tương tự. **ĐÃ XỬ LÝ:** đọc lại toàn file bằng `muse.read` rồi ghi đè toàn bộ bằng `muse.write`, kiểm lại bằng grep/wc sau khi ghi. Bài học: khi edit báo lỗi, KIỂM LẠI TRÊN ĐĨA trước khi kết luận chưa áp dụng — đừng edit lại mù.
- **Nợ cũ:** F-194-T8-2/4/5 vẫn mở (check-fresh file vắng; nhãn echo; run-chromium grep HB128). F-196-T8-4 (balloon 95,4% #124) → đợt 199: 87,8%; đợt 200: 84,7% (nhẹ hơn 199 nhưng vẫn cao thứ tư). F-196-T8-9 (baseline-meminfo EPERM) → đợt 199 + 200 đều ghi được (smoke mới). F-193-T8-1 (waiter reboot) → đợt 199 CÓ dữ kiện lần 2 (reboot #129 giết waiter phiên 1); đợt 200: boot mới đến TRƯỚC khi đợt mở nên waiter 1 phiên chạy trọn, không chết giữa phiên.

## 9. Nợ / chờ parent (T10 quyết ở §14.2 aggregate 200)

- (j) **V5 GIỮ LIVE?** (đề xuất: GIỮ — 5/5 kẹt mù, 0 FP trên 47 log sạch; live đợt này 0 trigger đúng vì không có kẹt; V2 vẫn là phương án chính 6/6; V4 GIỮ LIVE 5/5); 84l10 PASS — chuỗi 1 → 2; **86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 20 → 21**; B2 vùng mới sạch lần 13 → 14 (caveat F-200-T8-2); B1 live sạch (đợt sạch — chuỗi 1 → 2, đề xuất).
- (b) FULL PASS KHÔNG CÓ (chân O8 KHÔNG đạt 2/3 dù chân lượt yên #68 CÓ; chuỗi GIỮ 0).
- (c) POSTBOOT_PASS #130 CÓ (poll=1, repair-som-quyet-h — T56-200); #129 CÓ caveat (b1) từ (c)-199 (không đổi); tổng boot không cờ GIỮ 31 nếu parent chấp nhận #130 CÓ (caveat? — T56 ghi "CÓ cờ", không ghi caveat; parent quyết).
- (e) #130: **T01-200 survey 9 nguồn tươi** (c073c8bb, btime 11:21:41Z, gap #129→#130 = 16.965 s); marker 80 → 81 nếu parent xác nhận #130 (T56 đã XÁC MINH đường dẫn file marker). #129: T01-200 xác nhận tồn tại (T7-199 đo btime tươi + POSTBOOT CÓ) nhưng KHÔNG xác minh được bằng 9 nguồn tươi nữa (đã chết trước khi T01-200 mở phiên) — parent quyết (e).
- (f) **(m) #129 DƯƠNG (THÔ, T01-200)** — eid 11540, run 207, +40,934 s, TRONG [33; 49,8]; **n 57/58** (giữ nguyên — run 207 thay run 205? xem T2-200). **(m) #130 THÔ 0 requeue** (T01-200) — phân loại CUỐI thuộc T2-200. **Mâu thuẫn -check/-recheck GIẢI QUYẾT (T2-200, 11:56:36Z): script thật của parent đợt 197 là `/tmp/count-197-check.py` + `.sh`** — F-199-T10-5 ĐÓNG (xem LIMITS T2-200).
- (i) Holder: #129 KHÔNG GIẾT — chuỗi 4 → 5 (T56-199); #130 KHÔNG GIẾT — chuỗi 5 → 6 nếu parent xác nhận #130 (T56-200). (A) 120/120 lần thứ 49; suite 9/9 × 6 (chuỗi 80 → 81): xem LIMITS T56-200.
- (m) Lượt yên #68 HỢP LỆ — chuỗi 0 → 1 (đề xuất). Live-check #19 ĐẠT — chuỗi live ĐẠT 0 → 1 (đề xuất). P3' cộng dồn MỚI 54 lượt hợp lệ (sổ md5 2d3ee86c).
- (n) Reboot #130 trước đợt (gap #129→#130 = 16.965 s) + run 208 kết cục + cửa slot 200 + tổng lặng: xem LIMITS T7-200 (T7 chưa đóng lúc T8 đóng).
- (p) Vi phạm: **T8 0 vi phạm.** Harness chạy SAU khi T4 .done đã có (GATE-FOUND file-based 12:12:06Z — đúng quy tắc (p1), KHÔNG cần gate thực chất đợt này).
- (q) Đếm: T01-200 KHÔNG đếm đợt 200 (theo giao (r)-199 — chỉ survey + GAP + O8; đếm thuộc T10-200); lũy kế/chờ push xem (q) aggregate 200 (T10 đếm toàn cục). T8 đóng góp 1 LIMITS (+ scripts).
- Chờ push 191–199 = (q)-199 (107/435/333/312) + batch đợt 200 (T10 đếm cuối).
