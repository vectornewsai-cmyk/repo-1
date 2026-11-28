# Đợt 201 T8 — HARNESS 5/6 TRÊN BOOT MỚI #131 (ỨNG VIÊN); 84l10 E4 FAIL LÀ FLAKE (CHẠY LẠI PASS); 86n2-P1 DỮ KIỆN MỚI (21 → 22); V5 LIVE 0 TRIGGER; B2 SẠCH LẦN 15

Ngày: 27/11/2026 (lượt cron 21:35:51 +07 = 14:35:51Z mở đợt 201; T8 mở ~14:47Z, đóng ~16:15Z — TRONG hạn cờ ~17:00Z và hạn cứng 17:35:51Z).
Phạm vi: (1) V5 live tiếp (theo (j)-200 — V5 GIỮ LIVE); (2) harness trên boot mới nhất; (3) B1/B2 live; (4) V2/V4/V5 replay; (5) O8 — KHÔNG CHẠY (T01-201 chạy trong phiên — xem §A).
**Nguồn đứng:** §14.2 aggregate 200 (parent viết trực tiếp, lượt cron 18:35 +07 27/11 — SẠCH, lần sạch thứ tám; aggregate 83.680 B; đếm lần thứ 156). Các mốc parent dùng: (j) V5 GIỮ LIVE (0 trigger, không kẹt — đúng; V2 phương án chính 6/6; V4 GIỮ LIVE 5/5; 11/11 kẹt, 0 FP trên 47 log sạch); 84l10 PASS — chuỗi 1 → 2; 86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 20 → 21; B2 vùng mới sạch lần 14; B1 live sạch — chuỗi 1 → 2; (r) T8-201: V5 live tiếp, B1/B2 live, harness trên boot mới nhất, chờ T4 .done trước khi chạy harness.
**Reboot giữa đợt:** VM reboot 15:04:25Z (btime #130 11:21:41Z → btime mới 15:04:25Z) — boot mới `7d642f2a-da03-44ab-a2a1-f55b8010063f`, ứng viên #131 (T56-201; parent quyết (e)-201). Harness đợt này chạy trên #131; lượt yên #69 + O8 3/3 đo trên #130 (xem caveat chuỗi §E/(c)).

## 0. Kết luận ngắn — HARNESS 5/6; E4 FAIL LÀ FLAKE; KHÔNG KẸT MỚI; T4 #69 HỢP LỆ; LIVE-CHECK #20 KHÔNG ĐẠT

- **BOOT #131 (ỨNG VIÊN) `7d642f2a` (btime 15:04:25Z)** — reboot giữa đợt, gap #130→#131 = 13.364 s (3h42m44s). POSTBOOT_PASS #131 CÓ 15:12:20Z (T56-201, poll=0, replay-đầy-đủ, dpkg 1.510 — đề xuất KHÔNG caveat (b2) như #128). Marker 81 → 82 nếu parent xác nhận #131.
- **HARNESS #131 (15:28:28–15:46:45Z): WebKit 84l10 FAIL (E4) + 85m4 PASS + 86n2 PASS; Chromium 3/3 PASS. 5/6.** Kẹt harness cộng dồn GIỮ 31 (E4 FAIL không phải kẹt — xem §2).
- **84l10 FAIL — chuỗi PASS 2 → 0.** Chạy lại chẩn đoán cùng pha, cùng boot, cùng cây 16:01:46–16:03:54Z: **E4 PASS** (exit=0) → FAIL là FLAKE, nghi cold-start boot mới (W1-lần1 đồng bộ 9,9 s lần fail vs 0,7 s lần chạy lại).
- **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 15:35:00Z trên WebKit #131 → chuỗi 21 → 22.**
- **V2+V4+V5 = 11/11 kẹt, 0 FP trên 49 log sạch duy nhất** (51 entry — sau khi khôi phục entry 200, xem F-201-T8-1; log FAIL 201-84l10 đã đổi nhãn khỏi nhóm sạch, xem F-201-T8-2). V5 live: 0 trigger (không có kẹt để bắt); B1 live 0 trigger.
- **B2 vùng mới sạch lần 15** (14 → 15); 0 trigger trên cả 6 pha — lần này P6-wait WebKit chạy ĐỦ 90 s (18 dòng), caveat F-200-T8-2 đã hết.
- **T4-201: lượt yên #69 HỢP LỆ (attempt1 trên #130, chuỗi 1 → 2, đề xuất); live-check #20 KHÔNG ĐẠT (24 spike B2 trong W1 — chuỗi live ĐẠT 1 → 0). B2 dữ kiện #13: W1 24 spike.**
- **O8 T01-201 trên #130: 3/3 PASS 21/21 (attempt1 + attempt2 WebKit + Chromium) — chân O8 ĐẠT.**
- **FULL PASS: KHÔNG CÓ** — chân harness 5/6 (dù chân yên #69 CÓ + chân O8 3/3 CÓ; 2 chân đo trên #130, harness trên #131 — caveat chuỗi, xem §E/(c)). Chuỗi full pass GIỮ 0.
- **T8 0 vi phạm** (GATE-FOUND file-based 15:24:17Z đúng quy tắc (p1); gate-check 6/6 lần "T4 khong giu lock"; vite nối tiếp; lock trống trước khi chạy).

## 1. Dòng thời gian (gọn)

- 11:21:41Z **Boot #130 `c073c8bb`** (đợt 200). 14:35:51Z Đợt 201 mở (lượt cron 21:35:51 +07, run 209). 14:47Z T8 mở (đọc §14.2 aggregate 200 + LIMITS T8-200). 14:48:24Z T01-201 survey: vẫn #130, KHÔNG reboot mới (khẳng định này về sau thành STALE — xem §8). 14:48:33Z T56-201 POSTBOOT_PASS #130 (poll=0, replay-day-du) + watcher-201 spawn (pid 369613). 14:51:26Z Selfcheck #1 T8 (trên #130): libs 6/6 CÓ, dpkg 777. 14:53:25–14:56:10Z O8 T01 (3/3 PASS 21/21). 14:56:07Z Waiter T8 phiên 1 khởi động (deadline 17:00Z). 14:56:50Z T4-201 attempt1 mở (cửa yên #69). 15:00:58Z Poller T4 thoát — attempt1 HỢP LỆ (20/20, B 5/5, tickCost 50,5 ms).
- **15:04:25Z REBOOT — boot mới `7d642f2a` (ứng viên #131).** Waiter phiên 1 chết theo reboot (poll cuối 9, 15:04:08Z); attempt T4 đã xong trước reboot nên không mất dữ kiện; watcher-201 chết theo reboot; /tmp fixture bị xóa.
- 15:05:59Z Apt repair/replay trên boot mới bắt đầu (gstreamer/libegl/...). 15:07:17Z Watcher-201 RESPAWN (pid 7520, T56-201). 15:07:28Z Waiter T8 phiên 2 khởi động (chết ~15:09–15:10Z, không reboot — xem F-201-T8-4). 15:10:13Z Selfcheck #2 T8 (trên #131, giữa repair): libs 6/6 CÓ, dpkg 1.311. 15:12:16Z Waiter T8 phiên 3 khởi động (setsid — sống tới GATE-FOUND). **15:12:20Z POSTBOOT_PASS #131 CÓ** (T56-201, poll=0, replay-day-du, dpkg 1.510). ~15:13Z Fixture rebuild lần 2 (sau reboot). 15:22Z **T4 .done** (lượt yên #69 HỢP LỆ; live-check #20 KHÔNG ĐẠT). **15:24:17Z GATE-FOUND phiên 3 poll=13** (t4=OK + postboot đường (a) + no-lock). 15:27:39Z Selfcheck #3 T8 (trên #131, sau repair): libs 6/6 CÓ, dpkg 1.510, gst-inspect CÓ.
- **15:28:28Z HARNESS BẮT ĐẦU** — 15:46:45Z ALL DONE 5/6 (WebKit 84l10 exit=1). 16:01:46–16:03:54Z **Chạy lại chẩn đoán WebKit 84l10: exit=0, E4 PASS** (flake — xem §D). T8 đóng ~16:15Z, TRONG hạn cờ.
- Fixture rebuild 2 lần (14:51Z trên #130 + ~15:13Z trên #131): md5 khớp đợt 125 cả 4 cả 2 lần (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).

## 1b. Gate — GATE-FOUND FILE-BASED ĐÚNG QUY TẮC (p1) (không cần gate thực chất)

- Waiter 3 phiên, tổng 24 poll trong log (phiên 1: 9 poll 14:56:07–15:04:08Z trên #130; phiên 2: 3 poll 15:07:28–15:09:28Z trên #131; phiên 3: 13 poll 15:12:16–15:24:17Z trên #131). **GATE-FOUND phiên 3 poll=13 15:24:17Z: t4=OK + postboot=round201-t56/POSTBOOT_PASS (đường a, boot mới 7d642f2a) + t4attempt=no-lock.**
- Đây là lần thứ ba liên tiếp T8 chạy harness theo gate file-based ĐÚNG quy tắc (p1): T4 .done CÓ 15:22Z (nội dung khớp LIMITS T4: lượt yên #69 HỢP LỆ, live-check #20 KHÔNG ĐẠT, P3' cộng dồn 55 lượt, sổ md5 ad243797) + POSTBOOT_PASS #131 CÓ 15:12:20Z (T56-201, poll=0, replay-day-du, dpkg 1.510, verify độc lập exit 0 15:14:41Z theo T56) + lock vite-lock-v2 TRỐNG + 0 process T4 sống lúc đóng (T4 .done ghi rõ). Harness bắt đầu 15:28:28Z — 4m11s SAU GATE-FOUND (selfcheck #3 + kiểm fixture/tree/lock trước khi chạy).
- Caveat gate: lượt yên #69 đo trên #130 (attempt1-c073c8bb), harness chạy trên #131 (boot mới sau reboot 15:04:25Z). Gate file-based không phân biệt boot của attempt T4 — chỉ kiểm .done + postboot boot hiện tại. T8 ghi rõ để T10/parent quyết chuỗi có tính không (cùng caveat F-201-T56-10 cho suite/(A)).

## A. O8 — T01-201 CHẠY TRONG PHIÊN (TRÊN #130); T8 KHÔNG CHẠY O8

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T01 WebKit attempt1 trên #130 | **21/21 PASS** — exit=0 (14:53:25–14:54:26Z; JSON md5 37b2572d) |
| 2 | O8 T01 WebKit attempt2 trên #130 | **21/21 PASS** — exit=0 (14:54:26–14:55:19Z; JSON md5 fe58294c) |
| 3 | O8 T01 Chromium trên #130 | **21/21 PASS** — exit=0 (14:55:19–14:56:10Z; JSON md5 bac61a70) |
| 4 | O8 T8 (bộ thứ hai) | **KHÔNG CHẠY** — T01 đã chạy O8 trong phiên (brief: chạy bộ thứ hai nếu T01 chưa chạy; không chạy trùng) |

- O8 chạy cùng cây 477a0eac/ac89aeb2/ee80d093 (cùng cây với harness T8). 0 lỗi exit 127. S1 PASS cả 2 attempt ("checked=true -> false, Playwright mouse click lần 2"); probe S1 không chạy (attempt1 PASS). **Chân FULL PASS "O8 3/3": ĐẠT đợt này (khác đợt 200: 2/3 do attempt1 FAIL S1).**
- O8 chạy TRONG LÚC T4 chỉ poll (T4 gate0 lúc đó chưa đạt, attempt1 chưa mở; poll #6 14:56:50Z lock=không rồi mới mở cửa yên — 0 chồng lấn, theo T01-201.done).

## 2. Kết quả harness — 5/6 TRÊN 1 BOOT (#131) — 84l10 E4 FAIL (FLAKE, ĐÃ CHẠY LẠI PASS)

### 2a. Boot #131 (15:28:28–15:46:45Z) — WebKit 2/3, Chromium 3/3

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 1 | 15:28:28–15:30:52 | **FAIL — E4** (W1 ×3 PASS + W2 PASS; xem §D) |
| 2 | WebKit 85m4 | 0 | 15:31:07–15:33:51 | **PASS** — "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 15:34:06–15:38:43 | **PASS** — **P1 PASS 15:35:00Z (DỮ KIỆN MỚI — chuỗi 86n2-P1 21 → 22)** + P5 PASS + P6 KHÔNG-KẸT full 90 s, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 15:38:58–15:40:09 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 15:40:25–15:42:37 | **PASS** — "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 15:42:52–15:46:44 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 31 (0 kẹt mới). 84l10 FAIL — chuỗi PASS 2 → 0. 86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 21 → 22.**
- RAM sampler #131 (n=37 mẫu suốt harness, +1 dòng header): balloon min 2.957.376 / max **5.321.840 kB (82,6% trần)**, mean 4.389.486, pinned=0; avail min **852 MB (15:34:56Z)** / max 2.851 MB. Nhẹ hơn đợt 200 trên #130 (84,7%, avail min 620 MB).
- GATE-CHECK trước MỖI pha: 6/6 lần "T4 khong giu lock" (load5 1,46–2,90) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 15:00:58Z; T4 .done có 15:22Z). **T8 0 vi phạm.**
- **ALL DONE 15:46:45Z ghi `ec webkit: 84l10=1 85m4=0 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0`** — fix ec=-1 kiểm chứng lại trên harness thật (lần 5 liên tiếp; xem §C1).
- Báo cáo JSON ok=true, trừ l10-scratch WebKit ok=false (finishedAt 15:30:43.761Z): `l10-scratch` 15:30:43Z; `m4-scratch` 15:33:50Z; `n2-hb128-scratch` 15:38:33Z; `l10-scratch-chromium` 15:40:07Z; `m4-scratch-chromium` 15:42:32Z; `n2-hb128-scratch-chromium` 15:46:39Z. **KHÔNG có báo cáo stale** (scratch mới hoàn toàn đợt này).

## C. B1/B2 live + V2/V4/V5 replay

### C1. Script md5 (đổi nhãn 201t8; check-fresh sửa F-201-T8-5 — md5 mới 2f6bbdae; còn lại chỉ đổi nhãn + lock t8-round201 + deadline waiter 17:00Z)

| Script | md5 | Byte | Ghi chú |
|---|---|---|---|
| check-fresh-201t8.py | 2f6bbdae | ~15.300 | đổi nhãn 200t8 + **SỬA F-201-T8-5** (chấp --now=X; kiểm chứng §C5) |
| diag-stall-201t8.sh | 91a94732 | 2.292 | đổi nhãn |
| extract-201t8.py | d2722802 | ~7.900 | đổi nhãn + archive-201-* + nhãn 201-sach/201-fail |
| wait-t4-t5-201t8.sh | ef10cfd8 | 3.948 | đổi nhãn + deadline 17:00Z 27/11 |
| run-webkit-201t8.sh | cd5db41a | 13.980 | đổi nhãn (check-fresh chạy TRƯỚC mỗi poll, V5 live — giữ từ 200) |
| run-chromium-201t8.sh | 3c74a6f5 | 13.486 | như run-webkit |
| replay-1c-201t8.py | 1d8fe7e7 | 22.529 | đổi nhãn + khôi phục entry 200 (F-201-T8-1) + đổi nhãn 201-fail (F-201-T8-2) |
| replay-f-fix-201t8.py | 06620759 | 21.291 | như replay-1c |
| replay-wallclock-201t8.py | 82a9e8fe | 11.677 | đổi nhãn (LOGS import từ replay-f-fix) |
| launch-test-webkit-201t8.mjs | 00ce2d76 | ~1.289 | đổi nhãn |
| run-diag-84l10-w2setup-201t8.sh | 5e314c44 | 10.114 | driver diag W2-setup — KHÔNG chạy đợt này (xem §F) |
| build-84l10-w2setup-hb128.py | 646e17ec | 4.560 | KHÔNG ĐỔI md5 so với đợt 196/197/198/199/200 |
| selfcheck-postboot-201t8.sh | 120f4a21 | 2.299 | đổi nhãn |
| rebuild-fixtures-201t8.sh | 58e0ec1f | 2.810 | đổi nhãn |
| verify-163-201t8.py | 56df7872 | 2.616 | đổi nhãn (không chạy đợt này) |
| o8-driver-201t8.sh | 1660cdbc | 6.660 | đổi nhãn + lock t8-round201 — KHÔNG CHẠY đợt này (T01 đã chạy O8) |
| o8-s1-probe-201t8.mjs | 453d1082 | 55.280 | KHÔNG ĐỔI md5 so với đợt 196/197/198/199/200 (**VƯỢT trần push** — file cũ, không đổi) |
| run-diag-84l10-rerun-201t8.sh | 5f4f9be8 | 13.032 | MỚI đợt này — bản sao driver chỉ chạy WebKit 84l10, scratch/log/summary/ram/xvfb/baseline riêng (xem §D) |
| symlink `t8-diag-stall.sh` | — | — | **ĐÃ SỬA** về diag-stall-201t8.sh ở cả 2 nơi lúc mở (lúc mở vẫn trỏ 200t8) + kiểm lại bằng readlink lúc đóng — xem §6 |

- Script điều khiển pha: 84l10 `16e5e957` (35.917 B) / 85m4 `3fb2548b` (**38.737 B — VƯỢT trần push**) / 86n2-hb128 `de925614` (**43.653 B — VƯỢT trần push**) / 86n2-std `628088bd`; 87o8-webkit `4994b4fc` / 87o8-headed `c8acd72e`. **Cả 6 file điều khiển pha KHÔNG ĐỔI so với đợt 197/198/199/200** (md5 khớp).

### C2. Offline B2 — 6 ca §C2 đóng băng: KHỚP HỆT đợt 186–200, ĐẠT

| Case | Log tổng hợp (đợt 186) | Kết quả (check-fresh-201t8.py, --now/--until=last_ts — V5 silence=0) |
|---|---|---|
| B2-1 setup | planb-b2-setup-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-2 startPlaying | planb-b2-startplaying-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-3 P6-wait-wd | planb-b2-p6wait-150s-wd.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=wd) |
| B2-4 P6-nowd | planb-b2-p6wait-150s-nowd.log | **KHÔNG kích hoạt** (maxspan=150 s — giới hạn đã biết) |
| B2-5 P6-clean | planb-b2-p6-clean-90s.log | **KHÔNG kích hoạt** (maxspan=85 s) |
| B2-6 setup-clean | planb-b2-setup-clean-60s.log | **KHÔNG kích hoạt** (maxspan=55 s) |

- Chạy với --now/--until = last_ts đầy đủ từng file, dạng tách riêng (xem F-201-T8-5: dạng --now=X trước đây bị bỏ qua lặng lẽ). Kết quả lưu `smoke/b2-offline-201t8.txt`, diff với đợt 200 KHỚP HỆT.

### C3. Live — V5 0 trigger (không có kẹt); B2 vùng mới 0 trigger; V2/V4 im lặng đúng chỗ

| Pha | HB128 (dòng) | Kết quả check-fresh live |
|---|---|---|
| #131 WebKit 84l10 (**FAIL E4 — không phải kẹt**) | 12 | OK (maxspan=5 s, wd=0, maxgap=22 s) |
| #131 WebKit 85m4 | 22 | OK (maxspan=10 s, wd=0, maxgap=11 s) |
| #131 WebKit 86n2 | 39 | OK (maxspan=85 s, wd=0, maxgap=22 s; **P6-wait đủ 90 s — 18 dòng P6-wait**) |
| #131 Chromium 84l10 | 5 | OK (maxspan=0 s, wd=0, maxgap=12 s) |
| #131 Chromium 85m4 | 19 | OK (maxspan=10 s, wd=0, maxgap=11 s) |
| #131 Chromium 86n2 | 39 | OK (maxspan=85 s, wd=0, maxgap=9 s; P6-wait 5→90 s, biên 35 s, không FP) |

- **B1 live: 0 trigger — đợt này KHÔNG có kẹt nên V5 không có gì để bắt (V5 vẫn armed cả 6 pha + pha chạy lại; 0 FP). Chuỗi live sạch: đợt này KHÔNG sạch (84l10 FAIL E4) — chuỗi 2 → 0.**
- **B2 vùng mới (setup/startPlaying/P6-wait): 0 trigger trên cả 6 pha → B2 vùng mới sạch lần 15 (14 → 15)** — lần này P6-wait WebKit chạy đủ 90 s nên "0 trigger" ở vùng đó có phủ sóng đầy đủ cả 2 engine (khác đợt 200: WebKit landed sớm sau 3,6 s — F-200-T8-2 đã hết).
- LIVE-DIAG-189 (nhánh mtime): **0 lần** đợt này — V5/check-fresh chạy trước mỗi poll nên đã bao phủ; nhánh mtime chỉ còn fallback (không kích hoạt lần nào — đúng thiết kế).
- WATCHDOG-137 trong-script: 0 lần. Diag live: 0 lần (không có kẹt). Tổng 0 thư mục stall.
- Pha chạy lại 84l10 (xem §D): check-fresh OK (maxspan=0 s, wd=0, maxgap=21 s), HB128=10 dòng, 0 trigger.

### C4. Replay — V2 6/6 + V4 5/5 + V5 5/5 = V2+V4+V5 11/11, 0 FP trên 49 log sạch duy nhất

| Kiểm tra | 201-sach-85m4 | 201-sach-86n2-hb128 | 201-fail-84l10 (đánh giá riêng) | Cộng dồn |
|---|---|---|---|---|
| Replay-1c (c') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | (c') KHÔNG ĐỔI so với 200: kẹt-164 TRIGGER @125 s, lỡ 171 + 179 (đã biết, đã ghi); 0 FP trên log sạch |
| Replay-f-fix (f') ≥180/300/600 s | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | (f') ĐẠT trên tiêu chí 2 kẹt (164@125 s + 171@185/305/605 s), 0 FP |
| Replay-f-fix (f'') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | **V2 (f'') 6/6 trong lớp HB128** |
| Replay-f-fix V4 (f'''') | KHÔNG kích hoạt (gap=11 s) | KHÔNG kích hoạt (gap=22 s) | KHÔNG kích hoạt (gap=22 s) | **V4 5/5 kẹt mù** (179/180/192/197/198) |
| Replay-wallclock V5 (f''''') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt (ts=25, maxgap=22 s, tail=8,2 s, summary-end exit=1) | **V5 5/5 kẹt mù** (179/180/192/197/198) |

- **Số log sạch chuẩn (md5-unique): 47 → 49** (51 entry sạch; 2 log 201 mới đều duy nhất; 2 cặp trùng cũ 181/182 giữ nguyên: 166b271d, e11c62cb). **0 FP** trên toàn corpus sạch (corpus replay-f-fix: 63 entry = 51 sạch + 11 kẹt + 1 fail).
- **Hồi quy V2/V4: check-fresh-201t8.py vs 197t8.py KHỚP HỆT trên 63 log** (--now/--until=last_ts; V5 silence=0) — sau fix F-201-T8-5, chạy lại wallclock + f-fix post: byte-identical với bản trước fix.
- Tiền kiểm TRƯỚC harness (chạy ~14:52Z): V5 5/5 kẹt mù, 0 FP trên 47 log sạch duy nhất (49 entry, đã gồm entry 200 khôi phục — xem F-201-T8-1); V2/V4 hồi quy 60/60 khớp (pre) → 63/63 khớp (post).

### C5. V5 (f''''') — GIỮ LIVE, 0 TRIGGER ĐỢT NÀY (KHÔNG CÓ KẸT); KIỂM CHỨNG LẠI TRƯỚC HARNESS

**Thiết kế (quyết (j)-197, giữ nguyên đợt 201):** trigger khi im lặng MỞ (trailing silence) `now - dòng timestamp CUỐI CÙNG >= 120 s` (cùng ngưỡng V2/V4), chỉ đánh giá khi process pha còn sống (driver chỉ gọi check-fresh trong vòng poll `while kill -0 node_pid`). V5 bổ sung, không thay thế V2 (V2 vẫn là phương án chính trong lớp HB128); V4 GIỮ LIVE. Giới hạn còn lại: log 0 dòng timestamp thì V5 không đo được (như V4) — nhánh mtime LIVE-DIAG-189 trong driver vẫn là fallback.

**Kiểm chứng lại TRƯỚC harness đợt này (replay-wallclock-201t8.py, chạy ~14:52Z, lưu `smoke/replay-wallclock-201t8.out`):**
- V5 bắt 5/5 kẹt mù cũ (179 gap 723 s, 180 gap 718 s, 192 gap 793 s, 197 gap 760 s, 198 gap 784 s) tại gap_start+120 s — sớm hơn V4-live 598–673 s.
- V5 KHÔNG fire trên 6/6 kẹt lớp V2 (HB128 vẫn chảy trong lúc kẹt).
- 0 FP trên 47 log sạch duy nhất (max gap trong-log sạch 97 s — biên 22 s; max tail summary-end−last_ts 9,8 s — biên 110,2 s).
- Sau harness: corpus +201 (0 kẹt + 2 sạch + 1 fail) → **V5 5/5 kẹt mù, 0 FP trên 49 log sạch duy nhất**; V2/V4 hồi quy 60/60 khớp (pre) + 63/63 khớp (post, replay-f-fix-201t8-post.out).
- Live đợt này: V5 armed cả 6 pha + pha chạy lại, **0 trigger — đúng (không có kẹt)**; V4 live 0 trigger; V2 live 0 trigger. B1 live 0 trigger.

## D. Điều tra 84l10 E4 FAIL (đợt 201) + chạy lại chẩn đoán

- **D1 (lần fail — harness chính, 15:28:28–15:30:52Z):** W1-lần1 PASS (đồng bộ sau 9,9 s; playhead 6.933), W1-lần2 PASS (5,0 s; 4.6), W1-lần3 PASS (1,7 s; 1.867); W2 PASS (playhead cuối 29.933, tới cuối=true, restart tự nhiên Δ=0). **E4 FAIL 15:30:41Z — tới cuối=false, playing cuối=true, restartEndedVideo tại cuối=7 → sau 3 s=7, ct cuối=3.967, ended=false, errors=0.** HB128 trong E4: playhead kẹt quanh 3.567–3.833, ct 3.567–3.967, playing=true suốt 25 s — clip 4 s chạm cuối rồi restart 4 lần (3→7) mà không latch `ended`. So với đợt 200 (E4 PASS: tới cuối=true, playing=false, restart 3→3, ct=4, ended=true) và Chromium đợt này (E4 PASS: restart 6→6, ct=4, ended=true).
- **D2 (không phải kẹt):** phase thoát tự thân exit=1 (không timeout 900 s, không im lặng — HB128 12 dòng, maxgap 22 s; V2/V4/V5 đều OK trên log). **Kẹt harness GIỮ 31 — E4 FAIL là assertion fail, không tính vào chuỗi kẹt.** Đây là lần đầu 84l10 fail ở E4 (kẹt #28/#31 trước đây là stall ở W2/W1).
- **D3 (chạy lại chẩn đoán — run-diag-84l10-rerun-201t8.sh, 16:01:46–16:03:54Z):** cùng boot #131, cùng cây, cùng script pha, V5 armed (check-fresh mỗi poll), scratch/log/summary/ram/xvfb/baseline RIÊNG (không đè kết quả chính thức). Kết quả: **exit=0 — W1 ×3 PASS (lần1 đồng bộ chỉ 0,7 s) + W2 PASS (playhead cuối 30, restart tự nhiên Δ=1) + E4 PASS (tới cuối=true, playing=false, restart 4→4, ct=4, ended=true); JSON ok=True; check-fresh OK (maxspan=0 s, maxgap=21 s).** E4 FAIL KHÔNG tái hiện → **FLAKE**. Bằng chứng nghiêng về cold-start boot mới: lần fail là lần chạy WebKit ĐẦU TIÊN trên #131 sau repair (W1-lần1 đồng bộ 9,9 s — chậm nhất từng ghi ở lần1; lần chạy lại 0,7 s). Harness chính thức vẫn 5/6 — chạy lại chỉ là bằng chứng chẩn đoán, không thay verdict.
- **D4 (caveat script chạy lại):** summary chạy lại ghi `ALL DONE ... 85m4=0 86n2=0` là GIẢ — 2 dòng `EC_M4=$?`/`EC_N2=$?` còn sót sau khi xóa lệnh gọi 85m4/86n2 nên bắt exit 0 của lệnh echo trước đó (xem F-201-T8-3). Chỉ `84l10=0` là thật.
- **D5 (84l10 — 3/24 ≈ 13% fail/kẹt):** 84l10 fail/kẹt các đợt 192 (#28 stall W2), 198 (#31 stall W1-lần3), 201 (E4 FAIL flake). 2/3 là stall mù, 1/3 là assertion flake — chưa có mẫu lặp cùng call-site 2 đợt liên tiếp sau khi chạy lại PASS.

## B. H3 — WebKitGTK treo — GIỮ ỦNG HỘ MẠNH (không có dữ kiện mới đợt này)

- Đợt này KHÔNG có kẹt harness nào (5/6 với E4 FAIL là flake, không phải stall) nên H3 không có thêm bằng chứng ủng hộ hay phản bác. Chữ ký kẹt #31 (đợt 198) vẫn khớp H3 (biến thể 0-HB128). WebKit chạy được trên #131 nhờ libs hệ thống sau replay đầy đủ (6/6 CÓ, gst-inspect CÓ lần đầu — xem §C6) + debroot dự phòng trong driver (F-197-T8-1, giữ nguyên).
- Không phải H1 (T4 đã đóng, poller thoát 15:00:58Z, 0 attempt lúc harness chạy 15:28:28Z), không phải H2 (ENOSPC — dpkg 1.510 dòng ổn định trong lúc harness).

### C6. Debroot — WebKit chạy được nhờ libs hệ thống SAU REPLAY ĐẦY ĐỦ + debroot dự phòng

- **Dữ kiện gốc:** 84l10 PASS 3 đợt liên tiếp (193/194/195) với scanner VẮNG → giả thuyết "thiếu scanner" đã bị bác đợt 196 (kẹt #29 xảy ra với gst-inspect CÓ).
- **Dữ kiện đợt 201:** selfcheck #1 TRƯỚC reboot (14:51:26Z, #130): libs 6/6 CÓ, libgst\* 79, dpkg 777, gst-inspect VANG. Selfcheck #2 TRÊN #131 GIỮA REPAIR (15:10:13Z): libs 6/6 CÓ, dpkg 1.311, gst-inspect VANG. Selfcheck #3 TRÊN #131 SAU REPAIR (15:27:39Z): libs 6/6 CÓ, libgst\* 79, dpkg 1.510, **gst-inspect CÓ (lần đầu kể từ khi đo)**, gst-plugin-scanner VẪN VANG. Driver T8 vẫn vá LD_LIBRARY_PATH + GST_PLUGIN_PATH/SYSTEM_PATH → debroot cho 3 pha WebKit (F-197-T8-1, giữ nguyên). **Scanner vắng riêng lẻ KHÔNG phân biệt kẹt/pass — giả thuyết "thiếu scanner" vẫn bị bác (lần 6).** Điểm mới: lần đầu gst-inspect CÓ mà 84l10 vẫn FAIL E4 (flake) — CÓ scanner cũng không cứu E4 lần này; E4 fail không liên quan scanner.
- **Debroot vẫn là đường dự phòng:** `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu` (348 file; GST 269 plugin). T56-201: GST hệ thống trên #131 là thư mục thật (269=269), libwebkitgtk CÓ.

## E. Checklist (o) — các giá trị T8 cung cấp cho aggregate đợt 201 (T10 quyết)

- (a) Harness: WebKit 84l10 FAIL (E4, flake — chạy lại PASS) + 85m4 PASS + 86n2 PASS trên #131; Chromium 3/3 PASS trên #131; **5/6 — KHÔNG ĐẠT.**
- (b) FULL PASS: **KHÔNG CÓ** (chân harness 5/6; chân lượt yên #69 CÓ + chân O8 3/3 CÓ nhưng 2 chân đo trên #130, harness trên #131 — caveat chuỗi (c) dưới; chuỗi full pass GIỮ 0).
- (j) **V5 GIỮ LIVE (đề xuất — 5/5 kẹt mù, 0 FP trên 49 log sạch; live đợt này 0 trigger, đúng vì không có kẹt)**; 84l10 FAIL — chuỗi PASS 2 → 0; **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 15:35:00Z → chuỗi 21 → 22**; B2 vùng mới sạch lần 14 → 15 (P6-wait WebKit đủ 90 s lần này); B1 live 0 trigger (đợt KHÔNG sạch — chuỗi live sạch 2 → 0, đề xuất). **V2+V4+V5 = 11/11, 0 FP trên 49 log sạch**; V2 VẪN là phương án chính (6/6 lớp HB128); V4 GIỮ LIVE (5/5). **B2 dữ kiện #13: W1 24 spike (T4-201; cách đếm (j)-200: mỗi đợt = 1) — KHÔNG TÁCH vẫn đứng** (T4 chỉ báo số).
- (m) Lượt yên #69: **HỢP LỆ** (T4-201: attempt1-c073c8bb 20/20, B 5/5, tickCost median 50,5 ms — chuỗi lượt yên hợp lệ 1 → 2, đề xuất). Live-check #20: **KHÔNG ĐẠT** (T4-201: 1 cửa sổ hợp lệ NHƯNG 24 spike B2 trong W1 — chuỗi live ĐẠT 1 → 0, đề xuất). P3' cộng dồn MỚI 55 lượt hợp lệ (P1 240/244, P2 235/235, P3-A1 204/244, P3' 202/216 occ = 148/151 distinct, P7 138/138; sổ md5 ad243797). Labellag (b) 0 occ → chuỗi 0 occ 1 → 2 (đề xuất).
- (n) Stall/outage: **0 kẹt harness mới đợt này** (cộng dồn GIỮ 31). Reboot #131 giữa đợt (btime 15:04:25Z, gap #130→#131 = 13.364 s — T01-201 survey mới + parent quyết (e)-201; T01-201.done khẳng định "KHÔNG CÓ REBOOT MỚI" là STALE — survey 14:48:24Z trước reboot). Run 209 kết cục + cửa slot 201 + tổng lặng thuộc T7-201 (T8 chỉ cung cấp kẹt harness + reboot).
- (o) Auto-trigger: T9-201 chưa đóng lúc T8 đóng — số mẫu đợt này xem LIMITS T9-201; trong cửa sổ T4: 4 mẫu live watch/consec=0, 0 FIRE (T4-201 .done).
- (p) Vi phạm: **T8 0 vi phạm** (GATE-FOUND file-based 15:24:17Z đúng (p1); gate-check 6/6 lần "T4 khong giu lock", 0 chồng lấn; vite nối tiếp; lock trống trước khi chạy). Harness chạy SAU khi T4 .done đã có — KHÔNG cần gate thực chất đợt này.
- (E-247) MỞ — không có dữ kiện mới đợt này từ T8 (T9-201 chưa đóng; xem LIMITS T9-201).

## F. Diag W2-setup — DỪNG (không chạy đợt này)

- Diag W2-setup (run-diag-84l10-w2setup-201t8.sh, md5 5e314c44, 10.114 B + build-84l10-w2setup-hb128.py, md5 646e17ec, 4.560 B) KHÔNG chạy đợt này — không có ca kẹt 84l10 W2 để điều tra (84l10 FAIL ở E4, không phải W2; W2 PASS cả 2 lần chạy; đã có diag live ×2 (V5) + WATCHDOG + probe TIMEOUT + diag sau timeout đợt 198). Giữ script cho đợt sau.

## 5. Cây lúc đóng + md5 (kiểm lúc ~16:10Z)

- preview.tsx `477a0eac` (không đổi so với đợt 198/199/200); media.ts `ac89aeb2` (không đổi); vite.config.ts `ee80d093` (không đổi). **Harness #131 cùng cây 477a0eac/ac89aeb2/ee80d093. O8 T01 chạy cùng cây này trên #130 (cùng cây, khác boot — xem §A).**
- Fixture rebuild 2 lần (14:51Z trên #130 + ~15:13Z trên #131): md5 khớp đợt 125 cả 4 cả 2 lần (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).
- /tmp fixture đã rebuild xong trước harness lần 2. baseline-meminfo.txt ghi được (smoke mới + bản rerun).

## 6. Dọn dẹp + kiểm cuối (extract-201t8.py, chạy 16:09Z)

- ps sót T8: 0 (Xvfb :199, MiniBrowser, WebKitWebProcess, clicktest T8 — 0). X11 files: 0 (socket X199 của T8 đã dọn; không còn socket sót X193 như đợt 200).
- Symlink t8-diag-stall.sh: cả 2 nơi → diag-stall-201t8.sh (readlink xác nhận lúc đóng; lúc mở vẫn trỏ 200t8 — đã sửa, xem F-200-T8-1).
- Lock vite-lock-v2: TRỐNG (0 ticket + 85 cooldown).
- Vite: không còn vite nào của T8 chạy (driver đã exit sạch 15:46:45Z; driver chạy lại exit sạch 16:03:54Z). Chrome/Chromium: 0 process T8 còn lại.
- **T4 .done ĐÃ CÓ TRƯỚC khi harness chạy** (15:22Z — GATE-FOUND 15:24:17Z; harness 15:28:28Z). **T56 .done ĐÃ CÓ lúc T8 đóng** (POSTBOOT #131 CÓ + watcher respawn + holder — xem §E/(i) dưới).
- Bằng chứng giữ nguyên trong smoke/ (6 log pha + log chạy lại + ram log ×2 + summary ×2 + replay .out ×3 (+pre/+post), extract .out, waiter log 3 phiên, selfcheck ×3, rebuild-fixtures ×2).

## 7. Giới hạn

- Harness 5/6 trên 1 boot (#131); O8 trên #130 (cùng cây, khác boot) 3/3 PASS — chân FULL PASS O8 đạt nhưng harness không đạt.
- T8 đóng TRONG hạn cờ (~16:15Z vs ~17:00Z).
- POSTBOOT_PASS #131 CÓ (poll=0, replay-day-du — T56-201 đề xuất không caveat (b2)). #131 ỨNG VIÊN (parent quyết (e)-201; T01-201.done STALE về reboot).
- Sampler n=37 (chỉ suốt harness); không có sampler suốt phiên.
- Số liệu T4/T2/T01/T56/T7 trích từ LIMITS/.done của họ (đã đọc), không đo lại. T9-201 chưa đóng lúc T8 đóng — số liệu của họ (headroom, auto-trigger đợt, E-247) xem LIMITS của họ. T7-201 chưa đóng — run 209/cửa slot/tổng lặng xem LIMITS của họ.
- Chạy lại 84l10 là chẩn đoán (1 lần, n=1) — đủ kết luận flake cho đợt này, chưa đủ kết luận tỉ lệ flake E4 dài hạn.
- LIMITS này < trần push 37.768 B (kiểm sau khi ghi).

## 8. Sai số mới + nợ cũ

- **F-201-T8-1 (CORPUS REPLAY MẤT ENTRY ĐỢT TRƯỚC — LỖI ĐỔI NHÃN SED, ĐÃ SỬA):** khi tạo script đợt N từ đợt N−1 bằng sed đổi nhãn, entry `<N−1>-sach` bị đổi thành `<N>-sach` (trỏ log đợt N chưa có) nên corpus MẤT 3 log sạch đợt N−1: script 200t8 không có entry 199 (kiểm bằng đếm entry: 199t8 có 60 entry gồm 199; 200t8 có 60 entry gồm 200, không có 199). Hệ quả: "0 FP trên 47 log sạch" đợt 200 thực ra thiếu 3 log 199 (đáng lẽ 50 unique nếu đủ). **ĐÃ SỬA đợt này:** khôi phục 3 entry 200-sach (trỏ round200-t8/smoke) BÊN CẠNH 3 entry 201-sach trong replay-f-fix-201t8.py + replay-1c-201t8.py (replay-wallclock import LOGS từ f-fix nên hưởng luôn) → corpus 63 entry (51 sạch + 11 kẹt + 1 fail); pre 47 unique / post 49 unique. Bài học: từ đợt 202, khi tạo script mới phải GIỮ entry đợt trước, chỉ thêm entry đợt mới — kiểm bằng đếm entry trước khi chạy replay.
- **F-201-T8-2 (NHÃN CORPUS SAI: LOG FAIL GẮN NHÃN SẠCH — ĐÃ SỬA THEO TIỀN LỆ F-178-T8-9):** entry `201-sach-84l10` trỏ log FAIL E4 (exit=1) — gắn nhãn sạch là sai dù V5 không fire trên nó (không có kẹt nên 0 FP vẫn đúng). **ĐÃ SỬA:** đổi tên entry thành `201-fail-84l10` trong cả 2 script (không tính vào nhóm sạch, không tính vào nhóm kẹt; vẫn được đánh giá riêng trong từng dòng replay: V5/V4/(c') đều KHÔNG kích hoạt — đúng vì không có kẹt). Post sau sửa: 49 unique / 51 entry (trước sửa: 50 unique / 52 entry — con số trước sửa đã ghi trong bản post đầu, đã chạy lại post sau sửa).
- **F-201-T8-3 (SUMMARY CHẠY LẠI GHI SỐ GIẢ CHO PHA KHÔNG CHẠY):** run-diag-84l10-rerun-201t8.sh ghi `ALL DONE ... 85m4=0 86n2=0` dù 2 pha không chạy — 2 dòng `EC_M4=$?`/`EC_N2=$?` còn sót sau khi xóa lệnh gọi nên bắt exit 0 của lệnh echo. Chỉ `84l10=0` là thật. Bài học: khi cắt pha khỏi bản sao driver, xóa cả dòng gán EC đi kèm.
- **F-201-T8-4 (WAITER PHIÊN 2 CHẾT KHÔNG REBOOT):** waiter phiên 2 (nohup, khởi 15:07:28Z) chết sau poll 3 (15:09:28Z) dù không có reboot — cùng lúc wrapper exec (pid 8107) biến mất; nghi runtime dọn cả process group của exec đã kết thúc (nohup chỉ chống SIGHUP, không chống kill nhóm). **ĐÃ XỬ LÝ:** waiter phiên 3 chạy bằng `setsid` (SID riêng) + stdio ra file → sống tới GATE-FOUND poll=13. Bài học: mọi tiến trình nền dài phải chạy bằng setsid, không chỉ nohup.
- **F-201-T8-5 (CHECK-FRESH BỎ QUA LẶNG LẼ DẠNG --now=X — ĐÃ SỬA):** check-fresh chỉ nhận `--now <giá trị>` tách riêng; dạng `--now=<giá trị>` bị bỏ qua lặng lẽ (argv[0] vẫn là logfile, now_arg=None) → V5 wallclock dùng GIỜ THẬT. T8 đợt này gọi sai dạng lúc đầu: B2 offline 3 ca clean TRIGGER wallclock oan (silence ~247.918 s) — phát hiện nhờ diff với đợt 200. **ĐÃ SỬA:** parser chấp cả 2 dạng (chuẩn hóa --now=X/--until=X thành 2 token); B2 offline chạy lại KHỚP HỆT đợt 200; replay wallclock + f-fix post chạy lại byte-identical. Script md5 1d8b89c4 → 2f6bbdae.
- **F-201-T01-8 (GHI NHẬN SAI — KHÔNG PHẢI CỦA T8):** T01-201.done ghi "T8 CHƯA CÓ thư mục làm việc" — thư mục round201-t8 đã có từ 14:47Z (trước khi T01 đóng ~15:17Z); có thể T01 kiểm lúc mở phiên. Ghi nhận để T10 khỏi nhầm, không sửa file T01.
- **CẢNH BÁO STALE (T01-201.done):** khẳng định "KHÔNG CÓ REBOOT MỚI (vẫn #130)" dựa trên survey 14:48:24Z — reboot 15:04:25Z xảy ra SAU đó; T56-201 đã cảnh báo. Số hiệu #131 cần survey mới (T01-202/T10), parent quyết (e)-201.
- **Nợ cũ:** F-194-T8-2/4/5 vẫn mở (check-fresh file vắng; nhãn echo; run-chromium grep HB128). F-196-T8-4 (balloon 95,4% #124) → đợt 200: 84,7%; đợt 201: 82,6% (nhẹ hơn 200). F-196-T8-9 (baseline-meminfo EPERM) → đợt 199 + 200 + 201 đều ghi được (smoke mới). F-193-T8-1 (waiter reboot) → đợt 201: reboot #131 giết waiter phiên 1 (lần 3 — bài học setsid ở F-201-T8-4). F-200-T8-1 (symlink) → đợt này đã sửa lúc mở + kiểm readlink lúc đóng. F-200-T8-2 (P6 landed sớm) → đợt này P6-wait WebKit đủ 90 s — ĐÃ HẾT. F-200-T8-3 (muse.edit báo lỗi nhưng vẫn áp dụng) → đợt này viết LIMITS bằng muse.write toàn file, không edit từng phần.

## 9. Nợ / chờ parent (T10 quyết ở §14.2 aggregate 201)

- (j) **V5 GIỮ LIVE?** (đề xuất: GIỮ — 5/5 kẹt mù, 0 FP trên 49 log sạch; live đợt này 0 trigger đúng vì không có kẹt; V2 vẫn là phương án chính 6/6; V4 GIỮ LIVE 5/5); 84l10 FAIL — chuỗi PASS 2 → 0; **86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 21 → 22**; B2 vùng mới sạch lần 14 → 15 (P6-wait đủ 90 s cả 2 engine); B1 live 0 trigger (đợt KHÔNG sạch — chuỗi live sạch 2 → 0, đề xuất).
- (b) FULL PASS KHÔNG CÓ (chân harness 5/6; chân yên #69 CÓ + chân O8 3/3 CÓ nhưng đo trên #130 trong khi harness trên #131; chuỗi GIỮ 0).
- (c) POSTBOOT_PASS #131 CÓ (poll=0, replay-day-du — T56-201 đề xuất không caveat (b2) như #128; libwebkitgtk CÓ); #130 CÓ caveat (b1) từ (c)-200 (đứng); tổng boot không cờ GIỮ 31 nếu parent chấp nhận #131 CÓ (caveat? — T56 đề xuất (b2)).
- (e) #131: **T56-201 xác nhận boot mới 7d642f2a, btime 15:04:25Z, gap #130→#131 = 13.364 s**; marker 81 → 82 nếu #131 xác nhận (T56 đã XÁC MINH marker sống qua #131); T01-201.done STALE về reboot (survey 14:48:24Z) — cần survey mới T01-202/T10; parent quyết (e)-201.
- (f) **(m) #130 THÔ 0 requeue** (T01-201) — phân loại CUỐI thuộc T2-201. **(m) #131 THÔ** thuộc T2-201/T2-202.
- (i) Holder: #130 KHÔNG GIẾT — chuỗi 6 → 7 nếu #131 xác nhận (T56-201). (A) lần 50 + suite 82 (T56-201, đo trên #131). **Caveat chuỗi (F-201-T56-10): suite/(A) đo trên #131, lượt yên #69 đo trên #130 — parent quyết chuỗi có tính không (cùng caveat áp cho harness T8 + chân O8).**
- (m) Lượt yên #69 HỢP LỆ — chuỗi 1 → 2 (đề xuất). Live-check #20 KHÔNG ĐẠT — chuỗi live ĐẠT 1 → 0 (đề xuất). P3' cộng dồn MỚI 55 lượt hợp lệ (sổ md5 ad243797).
- (n) Reboot #131 giữa đợt (gap #130→#131 = 13.364 s) + run 209 kết cục + cửa slot + tổng lặng: xem LIMITS T7-201 (T7 chưa đóng lúc T8 đóng).
- (p) Vi phạm: **T8 0 vi phạm.** Harness chạy SAU khi T4 .done đã có (GATE-FOUND file-based 15:24:17Z — đúng quy tắc (p1), KHÔNG cần gate thực chất đợt này).
- (q) Đếm: T01-201 KHÔNG đếm đợt 201 (theo giao (r)-200); lũy kế/chờ push xem (q) aggregate 201 (T10 đếm toàn cục). T8 đóng góp 1 LIMITS (+ scripts).
- Chờ push 191–200 = (q)-200 (120/460/355/334) + batch đợt 201 (T10 đếm cuối).
