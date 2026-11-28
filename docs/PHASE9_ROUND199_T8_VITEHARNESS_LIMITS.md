# Đợt 199 T8 — HARNESS 6/6 TRÊN BOOT MỚI #129; 84l10 PASS LẠI (CHUỖI 0 → 1); 86n2-P1 DỮ KIỆN MỚI (19 → 20); REBOOT #129 GIỮA ĐỢT; T4 HẾT 3 ATTEMPT, KHÔNG CÓ LƯỢT YÊN #67

Ngày: 27/11/2026 (lượt cron 12:35:51 +07 = 05:35:51Z mở đợt 199; T8 mở ~05:43Z, đóng ~07:40Z — TRONG hạn cờ ~08:00Z và hạn cứng 08:35:51Z).
Phạm vi: (1) V5 live tiếp (theo (j)-198 — V5 GIỮ LIVE); (2) harness trên boot mới nhất #129; (3) B1/B2 live; (4) V2/V4/V5 replay; (5) O8 — KHÔNG CHẠY (T01 đã chạy lại 3/3 trên #128, xem §A).
**Nguồn đứng:** §14.2 aggregate 198 (parent viết trực tiếp, lượt handoff 09:41 +07 27/11 — SẠCH, lần sạch thứ sáu; aggregate 68.365 B). Các mốc parent dùng: (j) V5 GIỮ LIVE, V2 phương án chính 6/6, V4 GIỮ LIVE 5/5, 84l10 KẸT chuỗi 5 → 0, 86n2-P1 18 → 19, B2 vùng mới sạch lần 12, B2 KHÔNG TÁCH (dữ kiện thứ 10), log sạch 44; (r) T8-199: V5 live tiếp, B1/B2 live, harness trên boot mới nhất, **chờ T4 .done trước khi chạy harness (xem (p1))**; (p1) từ đợt 199 harness chỉ chạy khi T4 .done đã có, HOẶC ghi rõ gate thực chất + bằng chứng 0 chồng lấn vào LIMITS ngay lúc chạy; (b) O8 3/3 trên #126 KHÔNG tính (cây đổi sau O8) — T01-199 chạy lại O8 trên boot mới nhất; (e) #126 + #127 XÁC NHẬN, marker 77 → 79 CHƯA XÁC MINH (F-198-T56-6); (c) POSTBOOT #126 + #127 CÓ caveat (b1). **Nhiệm vụ (3) của brief — bổ sung trigger đồng hồ treo vào check-fresh — ĐÃ XONG từ đợt 198** (V5 live, bắt sống kẹt #31, kiểm chứng 0 FP trên 42 log sạch trước khi bật live); đợt này chỉ kế thừa V5 + kiểm chứng lại trên corpus mở rộng (xem §C4/C5).

## 0. Kết luận ngắn — HARNESS 6/6; KHÔNG KẸT MỚI; T4 KHÔNG CÓ LƯỢT YÊN

- **HAI BOOT trong phiên: #128 `773743f2` (btime 05:01:50Z) CHẾT 06:38:56Z (sống 5.826 s); #129 `e6e070b8` (btime 06:38:56Z 27/11) — ỨNG VIÊN, T01-200 survey.** POSTBOOT_PASS #128 CÓ 05:51:25Z (T56, poll=0, replay-day-du — mạnh nhất kể từ #123) + #129 CÓ 07:08:07Z (T56, poll=1, repair-som-quyet-h — yếu hơn, như #126/#127).
- **HARNESS #129 (07:16:26–07:32:00Z): WebKit 84l10 PASS + 85m4 PASS + 86n2 PASS; Chromium 3/3 PASS. 6/6 — KHÔNG KẸT MỚI.** Kẹt harness cộng dồn GIỮ 31.
- **84l10 PASS — chuỗi 0 → 1** (sau kẹt #31 đứt chuỗi 5 đợt 198). **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 07:21:05Z trên WebKit #129 → chuỗi 19 → 20.**
- **V2+V4+V5 = 11/11 kẹt, 0 FP trên 47 log sạch duy nhất** (44 → 47: +199-sach-84l10/85m4/86n2-hb128). V2 6/6 + V4 5/5 + V5 5/5 (không đổi — đợt này không có kẹt mới). V5 live: 0 trigger (không có kẹt để bắt); B1 live sạch.
- **B2 vùng mới sạch lần 13** (12 → 13); 0 trigger trên cả 6 pha. **B2 dữ kiện mới (T4-199): W1 43 / W2 33 / W3 39 spike** — T4 đếm mỗi cửa sổ attempt = 1 dữ kiện (#11/#12/#13); theo cách đếm cũ (mỗi đợt = 1 dữ kiện) thì đây là dữ kiện thứ 11 — parent/T10 quyết cách ghi chuỗi (xem §E). W1 hỗn hợp, W2 chủ yếu ngoại-tải, W3 không quy được — **KHÔNG TÁCH vẫn đứng theo T4 (chỉ báo số, không tự quyết)**.
- **T4-199: lượt yên #67 KHÔNG CÓ LƯỢT HỢP LỆ (attempt1/2/3 đều 20/20 nhưng lớp B VI PHẠM + tickCost median 102,0/70,0/94,0 ms > bar 60) — chuỗi lượt yên hợp lệ 2 → 0 (đề xuất); live-check #18 KHÔNG ĐẠT — chuỗi live ĐẠT GIỮ 0.**
- **O8 T01-199 3/3 PASS trên #128 (21/21 ×3, 05:48:31–05:54:24Z, cùng cây 477a0eac)** — NHƯNG harness chạy trên #129 (boot khác) nên chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây" KHÔNG gộp được đợt này; chân lượt yên cũng KHÔNG có → **FULL PASS: KHÔNG CÓ — chuỗi GIỮ 0.**
- **T8 0 vi phạm** (GATE-FOUND file-based 07:09:06Z đúng quy tắc (p1) mới; gate-check 6/6 lần "T4 khong giu lock"; vite nối tiếp; lock trống trước khi chạy).

## 1. Dòng thời gian (gọn)

- 05:01:50Z **#128** (773743f2). 05:35:51Z Đợt 199 mở (run 206). 05:43Z T8 mở (đọc aggregate 198 §14.2 + LIMITS T8-198). 05:46:31Z Waiter T8 phiên 1 khởi động (deadline 07:30Z). 05:48:49Z watcher-199 L1 START pid 33388 (#128). 05:48:51Z T4 poller khởi động. 05:51:25Z **POSTBOOT_PASS #128 CÓ** (T56, poll=0, replay-day-du). 05:48:31–05:54:24Z O8 T01 3/3 PASS trên #128. 05:56Z T01-199 đóng (.done). 06:09:34Z T4 attempt1 (20/20, B vi phạm, tickCost 102,0 ms — KHÔNG HỢP LỆ). 06:26Z T4 attempt2 (20/20, B vi phạm, 70,0 ms — KHÔNG HỢP LỆ). 06:35Z T4 attempt3 (20/20, B vi phạm, 94,0 ms — KHÔNG HỢP LỆ). 06:38:53Z T4 poller thoát (exit 11 — hết ngân sách 3/3, 0 lượt hợp lệ).
- **06:38:56Z REBOOT #129 (e6e070b8)** — #128 chết sau 5.826 s; watcher-199 L1 + waiter T8 phiên 1 chết theo (waiter phiên 1 dừng ở poll 53, 06:38:51Z — không kịp ghi dòng REBOOT); /tmp fixture mất. 06:41:01Z **Waiter T8 phiên 2 KHỞI ĐỘNG LẠI** (append, không truncate — F-192-T8-1). 06:42Z Fixture rebuild lần 2 (md5 khớp cả 4). 06:44:07Z **watcher-199 L2 START pid 7194** (#129). 06:57Z **T4-199 đóng (.done)** — 0 lượt yên #67, live-check #18 KHÔNG ĐẠT. 07:08:07Z **POSTBOOT_PASS #129 CÓ** (T56, poll=1, repair-som-quyet-h, dpkg 777). **07:09:06Z GATE-FOUND poll=29** (phiên 2) — t4=OK + postboot đường (a) + lock trống. 07:16:13Z Selfcheck #2 trên #129 (libs 6/6 CÓ sau repair). **07:16:26Z HARNESS BẮT ĐẦU.** 07:17:47Z WebKit 84l10 PASS; 07:20:13Z WebKit 85m4 PASS; 07:21:05Z **86n2 P1 PASS (dữ kiện mới)**; 07:24:31Z WebKit 86n2 PASS; 07:25:47Z Chromium 84l10 PASS; 07:28:03Z Chromium 85m4 PASS; 07:32:00Z Chromium 86n2 PASS — **ALL DONE 07:32:00Z, 6/6.** T8 đóng ~07:40Z, TRONG hạn cờ ~08:00Z.

## 1b. Gate — GATE-FOUND FILE-BASED ĐÚNG QUY TẮC (p1) MỚI (không cần gate thực chất)

- Waiter 2 phiên (tổng 81 dòng poll theo extract): phiên 1 — 53 poll 05:46:31–06:38:51Z, GATE-NOT-YET suốt (t4=0; postboot=1 từ poll 3 nhờ đường (b) gate0wait log của T4 cho #128); phiên 1 CHẾT theo reboot #129 (không kịp ghi REBOOT — reboot 06:38:56Z, 5 s sau poll 53). Phiên 2 — khởi động lại 06:41:01Z (append), boot mới e6e070b8; postboot=0 tới khi T56 viết POSTBOOT_PASS #129; **GATE-FOUND poll=29 07:09:06Z: t4=OK + postboot=round199-t56/POSTBOOT_PASS (đường a) + t4attempt=no-lock.**
- Đây là lần đầu T8 chạy harness theo gate file-based ĐÚNG quy tắc (p1) mới mà KHÔNG cần gate thực chất: T4 .done CÓ 06:57Z (nội dung khớp LIMITS T4: 0 lượt hợp lệ, live-check #18 KHÔNG ĐẠT, P3' giữ 53 lượt, md5 sổ c8792589) + POSTBOOT_PASS #129 CÓ 07:08:07Z (T56, poll=1, repair-som-quyet-h, dpkg 777, verify độc lập exit 0 07:10:51Z md5 8d1487ba) + lock vite-lock-v2 TRỐNG + 0 process T4 sống lúc đóng (T4 .done ghi rõ). Harness bắt đầu 07:16:26Z — 7 phút SAU GATE-FOUND (selfcheck #2 + kiểm fixture/tree/lock trước khi chạy).

## A. O8 — T01 3/3 TRÊN #128; T8 KHÔNG CHẠY O8; HARNESS 6/6 TRÊN #129 (BOOT KHÁC)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T01 WebKit attempt1 trên #128 | **21/21 PASS** — exit=0, launched 27.2, JSON md5 e6056f5e (05:48:31Z–) |
| 2 | O8 T01 WebKit attempt2 trên #128 | **21/21 PASS** — exit=0, JSON md5 2ac792a2 |
| 3 | O8 T01 Chromium trên #128 | **21/21 PASS** — exit=0, JSON md5 9824cbc1 (05:54:24Z) |
| 4 | O8 trên #129 | **CHƯA CHẠY** — T01-199 chỉ survey + O8 trên #128 (đợt mở trước khi #129 đến); survey #129 thuộc T01-200 |
| 5 | O8 T8 (bộ thứ hai) | **KHÔNG CHẠY** — T01 đã chạy O8 trong phiên (brief: chạy bộ thứ hai nếu T01 chưa chạy; không chạy trùng) |

- O8 3/3 bộ CÙNG CÂY (preview.tsx 477a0eac + media.ts ac89aeb2 — cây lúc O8; cây KHÔNG đổi trong lúc O8 chạy). 0 lỗi exit 127. **Chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây": T01 ghi ĐẠT cho O8 đợt này (3/3 bộ pass, cùng boot #128 + cùng cây)** — NHƯNG harness T8 chạy trên #129 (boot khác #128) nên hai chân KHÔNG cùng boot → **KHÔNG gộp thành chân FULL PASS của đợt** (cộng thêm chân lượt yên KHÔNG có). FULL PASS đợt này: KHÔNG CÓ — chuỗi GIỮ 0 (xem §E).
- O8 chạy TRONG LÚC T4 chỉ poll (0 chồng lấn; poll #7 05:53:36Z ghi lock=co t01-round199).

## 2. Kết quả harness — 6/6 TRÊN 1 BOOT (#129) — KHÔNG KẸT MỚI

### 2a. Boot #129 (07:16:26–07:32:00Z) — WebKit 3/3 PASS, Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 07:16:26–07:17:47 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS, "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 2 | WebKit 85m4 | 0 | 07:18:02–07:20:13 | **PASS** — P1/P2/P3/P4 ×3/P5 PASS, "KẾT QUẢ: KHÔNG FAIL", live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 07:20:29–07:24:31 | **PASS** — **P1 PASS 07:21:05Z (DỮ KIỆN MỚI — chuỗi 86n2-P1 19 → 20)** + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 07:24:46–07:25:47 | **PASS** — W1 ×3 PASS + W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 07:26:02–07:28:03 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 07:28:18–07:32:00 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 31 (0 kẹt mới). 84l10 PASS — chuỗi 0 → 1. 86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 19 → 20.**
- RAM sampler #129 (n=32, suốt harness): balloon min 4.535.676 / max **5.655.824 kB (87,8% trần)**, mean 5.206.644, pinned=0; avail min **440 MB (07:25:24Z)** / max 2158 MB. Nặng hơn đợt 198 trên #127 (86,7%, avail min 305 MB — avail min đợt này cao hơn 135 MB) nhưng balloon max 87,8% là mức cao thứ ba từng ghi trong lúc harness (sau #124 95,4% và #125 91,6%).
- GATE-CHECK trước MỖI pha: 6/6 lần "T4 khong giu lock" (load5 0,79–1,47) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 06:38:53Z exit 11; T4 .done có 06:57Z). **T8 0 vi phạm.**
- **ALL DONE 07:32:00Z ghi đúng `ec webkit: 84l10=0 85m4=0 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0`** — fix ec=-1 kiểm chứng lại trên harness thật (lần 3 liên tiếp; xem §C1).

## C. B1/B2 live + V2/V4/V5 replay

### C1. Script md5 (đổi nhãn 199t8 — V5 giữ nguyên từ 198t8; còn lại chỉ đổi nhãn)

| Script | md5 | Byte | Ghi chú |
|---|---|---|---|
| check-fresh-199t8.py | f1fd7989 | 15.246 | đổi nhãn 198t8 (diff chỉ 8 dòng nhãn — logic V2/V4/V5 KHÔNG đổi) |
| diag-stall-199t8.sh | 5df7adc4 | 2.292 | đổi nhãn |
| extract-199t8.py | f17969ab | 7.913 | đổi nhãn + archive-199-* + boot #128 |
| wait-t4-t5-199t8.sh | 4604f6b7 | 3.948 | đổi nhãn + deadline 07:30Z 27/11 |
| run-webkit-199t8.sh | 07aa6079 | 13.980 | đổi nhãn (check-fresh chạy TRƯỚC mỗi poll, V5 live — giữ từ 198) |
| run-chromium-199t8.sh | 34a5efac | 13.486 | như run-webkit (run_one GIỐNG HỆT — diff 0 dòng) |
| replay-1c-199t8.py | 7c658eb6 | 21.552 | đổi nhãn + thêm entry 199 (KHÔNG đổi entry cũ) |
| replay-f-fix-199t8.py | ba68ed2b | 19.722 | như replay-1c + thêm entry 199 |
| replay-wallclock-199t8.py | 0cf01a8d | 11.677 | đổi nhãn + thêm entry 199 qua replay-f-fix |
| launch-test-webkit-199t8.mjs | 91ad384c | ~1.100 | đổi nhãn |
| run-diag-84l10-w2setup-199t8.sh | 727bb081 | 10.114 | driver diag W2-setup — KHÔNG chạy đợt này (xem §F) |
| build-84l10-w2setup-hb128.py | 646e17ec | 4.560 | KHÔNG ĐỔI md5 so với đợt 196/197/198 |
| selfcheck-postboot-199t8.sh | 09889185 | 2.299 | đổi nhãn; nhãn echo T8-199 |
| rebuild-fixtures-199t8.sh | a6993437 | 2.810 | đổi nhãn |
| verify-163-199t8.py | 74408039 | 2.616 | đổi nhãn (không chạy đợt này) |
| o8-driver-199t8.sh | 9fb65c89 | 6.660 | đổi nhãn — KHÔNG CHẠY đợt này (T01 đã chạy O8) |
| o8-s1-probe-199t8.mjs | 453d1082 | 55.280 | KHÔNG ĐỔI md5 so với đợt 196/197/198 (**VƯỢT trần push** — file cũ, không đổi) |
| symlink `t8-diag-stall.sh` | — | — | **ĐÃ SỬA** về diag-stall-199t8.sh ở cả 2 nơi (repo scripts + hidden-root) |

- Script điều khiển pha: 84l10 `16e5e957` (35.917 B) / 85m4 `3fb2548b` (**38.737 B — VƯỢT trần push**) / 86n2-hb128 `de925614` (**43.653 B — VƯỢT trần push**) / 86n2-std `628088bd`; 87o8-webkit `4994b4fc` / 87o8-headed `c8acd72e`. **Cả 6 file điều khiển pha KHÔNG ĐỔI so với đợt 197/198** (md5 khớp).
- Báo cáo JSON ok=true (chỉ trích số 199): `l10-scratch` finishedAt 07:17:39Z; `m4-scratch` 07:20:13Z; `n2-hb128-scratch` 07:24:26Z; `l10-scratch-chromium` 07:25:46Z; `m4-scratch-chromium` 07:28:00Z; `n2-hb128-scratch-chromium` 07:32:00Z. **KHÔNG có báo cáo stale** (scratch mới hoàn toàn đợt này — không copy từ đợt trước).

### C2. Offline B2 — 6 ca §C2 đóng băng: KHỚP HỆT đợt 186–198, ĐẠT

| Case | Log tổng hợp (đợt 186) | Kết quả (check-fresh-199t8.py, --now/--until=last_ts — V5 silence=0) |
|---|---|---|
| B2-1 setup | planb-b2-setup-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-2 startPlaying | planb-b2-startplaying-150s.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=f) |
| B2-3 P6-wait-wd | planb-b2-p6wait-150s-wd.log | **TRIGGER @125 s** (span=120 s, run_len=25, via=wd) |
| B2-4 P6-nowd | planb-b2-p6wait-150s-nowd.log | **KHÔNG kích hoạt** (maxspan=150 s — giới hạn đã biết) |
| B2-5 P6-clean | planb-b2-p6-clean-90s.log | **KHÔNG kích hoạt** (maxspan=85 s) |
| B2-6 setup-clean | planb-b2-setup-clean-60s.log | **KHÔNG kích hoạt** (maxspan=55 s) |

- Đối chiếu check-fresh-198t8.py (không --now) trên cùng 6 log: **KHỚP TỪNG DÒNG** — V2 không đổi. (Lưu ý phương pháp: lần chạy đầu dùng --now sai ngày (lấy giờ trong log gán ngày 27/11) nên V5 báo 3 TRIGGER wallclock giả trên B2-4/5/6 do silence ~215.000 s — ĐÃ CHẠY LẠI với --now/--until = last_ts đầy đủ của log, kết quả trên là đúng; bài học: --now replay phải lấy đúng timestamp đầy đủ của log, không ghép ngày.)

### C3. Live — V5 0 trigger (không có kẹt); B2 vùng mới 0 trigger; V2/V4 im lặng đúng chỗ

| Pha | HB128 (dòng) | Kết quả check-fresh live |
|---|---|---|
| #129 WebKit 84l10 (**PASS**) | 6 | OK (maxspan=0 s, wd=0, maxgap=11 s) |
| #129 WebKit 85m4 | 19 | OK (maxspan=5 s, wd=0, maxgap=7 s) |
| #129 WebKit 86n2 | 39 | OK (maxspan=85 s, wd=0, maxgap=8 s; P6-wait 5→90 s, biên 35 s, không FP) |
| #129 Chromium 84l10 | 5 | OK (maxspan=0 s, wd=0, maxgap=7 s) |
| #129 Chromium 85m4 | 19 | OK (maxspan=10 s, wd=0, maxgap=10 s) |
| #129 Chromium 86n2 | 39 | OK (maxspan=85 s, wd=0, maxgap=7 s; P6-wait 5→90 s, không FP) |

- **B1 live: 0 trigger — đợt này KHÔNG có kẹt nên V5 không có gì để bắt (V5 vẫn armed cả 6 pha; 0 FP). Chuỗi live sạch: đợt này SẠCH (6/6 PASS, 0 kẹt) — chuỗi 0 → 1 (đề xuất, theo tiền lệ đợt 179: đợt sạch đầu tiên sau khi đứt tính lại từ 1; đợt 198 có kẹt #31 nên chuỗi về 0; xem §E).**
- **B2 vùng mới (setup/startPlaying/P6-wait): 0 trigger trên cả 6 pha → B2 vùng mới sạch lần 13 (12 → 13).**
- LIVE-DIAG-189 (nhánh mtime): **0 lần** đợt này — V5/check-fresh chạy trước mỗi poll nên đã bao phủ; nhánh mtime chỉ còn fallback (không kích hoạt lần nào — đúng thiết kế).
- WATCHDOG-137 trong-script: 0 lần. Diag live: 0 lần (không có kẹt). Tổng 0 thư mục stall.

### C4. Replay — V2 6/6 + V4 5/5 + V5 5/5 = V2+V4+V5 11/11, 0 FP trên 47 log sạch

| Kiểm tra | 199-sach-84l10 (md5 8427903c) | 199-sach-85m4 (md5 28e8de9f) | 199-sach-86n2-hb128 (md5 546c523e) | Cộng dồn |
|---|---|---|---|---|
| Replay-1c (c') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | (c') KHÔNG ĐỔI so với 198: kẹt-164 TRIGGER @125 s, lỡ 171 + 179 (đã biết, đã ghi); 0 FP trên log sạch |
| Replay-f-fix (f') ≥180/300/600 s | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | (f') ĐẠT trên tiêu chí 2 kẹt (164@125 s + 171@185/305/605 s), 0 FP |
| Replay-f-fix (f'') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt (0 dòng HB128 — 84l10 không log HB128 ở W1) | **V2 (f'') 6/6 trong lớp HB128** |
| Replay-f-fix V4 (f'''') | KHÔNG kích hoạt (gap=11 s) | KHÔNG kích hoạt (gap=7 s) | KHÔNG kích hoạt (gap=8 s) | **V4 5/5 kẹt mù** (179/180/192/197/198) |
| Replay-wallclock V5 (f''''') | KHÔNG kích hoạt | KHÔNG kích hoạt | KHÔNG kích hoạt | **V5 5/5 kẹt mù** (179/180/192/197/198) |

- **Số log sạch chuẩn (md5-unique): 44 → 47** (49 entry sạch, 47 unique; 3 log 199 đều duy nhất; 2 cặp trùng cũ 181/182 giữ nguyên: 166b271d, e11c62cb). **0 FP** trên toàn corpus sạch (corpus replay-f-fix: 60 entry = 49 sạch + 11 kẹt).
- **Hồi quy V2/V4: check-fresh-199t8.py vs 197t8.py KHỚP HET trên 60 log** (--now/--until=last_ts; V5 silence=0).

### C5. V5 (f''''') — GIỮ LIVE, 0 TRIGGER ĐỢT NÀY (KHÔNG CÓ KẸT); KIỂM CHỨNG LẠI TRƯỚC HARNESS

**Thiết kế (quyết (j)-197, giữ nguyên đợt 199):** trigger khi im lặng MỞ (trailing silence) `now - dòng timestamp CUỐI CÙNG >= 120 s` (cùng ngưỡng V2/V4), chỉ đánh giá khi process pha còn sống (driver chỉ gọi check-fresh trong vòng poll `while kill -0 node_pid`). V5 bổ sung, không thay thế V2 (V2 vẫn là phương án chính trong lớp HB128); V4 GIỮ LIVE. Giới hạn còn lại: log 0 dòng timestamp thì V5 không đo được (như V4) — nhánh mtime LIVE-DIAG-189 trong driver vẫn là fallback.

**Kiểm chứng lại TRƯỚC harness đợt này (replay-wallclock-199t8.py, chạy trước harness):**
- V5 bắt 5/5 kẹt mù cũ (179 gap 723 s, 180 gap 718 s, 192 gap 793 s, 197 gap 760 s, 198 gap 784 s) tại gap_start+120 s — sớm hơn V4-live 598–673 s.
- V5 KHÔNG fire trên 6/6 kẹt lớp V2 (HB128 vẫn chảy trong lúc kẹt).
- 0 FP trên 44 log sạch duy nhất (max gap trong-log sạch 97 s — biên 22 s; max tail summary-end−last_ts 9,8 s — biên 110,2 s).
- Sau harness: corpus +199 (0 kẹt + 3 sạch) → **V5 5/5 kẹt mù, 0 FP trên 47 log sạch duy nhất**; V2/V4 hồi quy 60/60 khớp.
- Live đợt này: V5 armed cả 6 pha, **0 trigger — đúng (không có kẹt)**; V4 live 0 trigger; V2 live 0 trigger. B1 live sạch.

## D. Điều tra 84l10 đợt 23 + KẸT #31 (hậu kiểm)

- **D1 (84l10 ×2 lần chạy):** WebKit #129 PASS (W1 ×3 PASS 07:16:44/49/55Z, W1b, W2 PASS 07:17:27Z, E4 PASS 07:17:37Z; 6 dòng HB128 ở W2). Chromium #129 PASS (W1 ×3 + W2 + E4). **84l10 PASS — chuỗi 0 → 1.** 84l10 không còn là pha ổn định nhất vẫn đứng (kẹt #31 đợt 198 là kẹt 84l10 đầu tiên kể từ #28 đợt 192; đợt này pass lại ngay).
- **D2 (kẹt 84l10 — 2/23 ≈ 9%):** 84l10 kẹt các đợt 192 (#28, W2-setup) và 198 (#31, W1-lần3). Đợt này W1-lần3 PASS (07:16:55Z) — cùng call-site với #31 nhưng không tái hiện kẹt; #31 vẫn là kẹt mù thuần túy nhất (0 dòng HB128 toàn log).
- **D3 (bằng chứng đã lưu):** `smoke/` — run-webkit-84l10.log (md5 8427903c), run-webkit-85m4.log (md5 28e8de9f), run-webkit-86n2-hb128.log (md5 546c523e), 3 log chromium, ram-199t8.log (n=32), run-webkit-summary.txt, replay .out ×3 (+post), extract .out, harness-gate-note (xem §1b — gate file-based, không cần note riêng).
- **D4 (so #31):** #31 là 84l10 W1-lần3, 0 dòng HB128 toàn log, V5 bắt live 01:33:38Z đợt 198. Đợt này cùng pha, cùng call-site, PASS sạch — không có mẫu kẹt lặp cùng call-site 2 đợt liên tiếp (P2 → W1-lần3 → PASS).

## B. H3 — WebKitGTK treo — GIỮ ỦNG HỘ MẠNH (không có dữ kiện mới đợt này)

- Đợt này KHÔNG có kẹt harness nào (6/6 PASS) nên H3 không có thêm bằng chứng ủng hộ hay phản bác. Chữ ký kẹt #31 (đợt 198) vẫn khớp H3 (biến thể 0-HB128). WebKit chạy được trên #129 nhờ libs hệ thống sau repair T56 (6/6 CÓ) + debroot dự phòng trong driver (F-197-T8-1, giữ nguyên); launch-test headed PASS trên #129 theo T56 verify (exit 0, 07:10:51Z).
- Không phải H1 (T4 đã đóng, poller thoát 06:38:53Z, 0 attempt lúc harness chạy 07:16:26Z), không phải H2 (ENOSPC — xem LIMITS T9-199; dpkg 777 dòng ổn định trong lúc harness).

### C6. Debroot — WebKit chạy được nhờ libs hệ thống SAU REPAIR + debroot dự phòng

- **Dữ kiện gốc:** 84l10 PASS 3 đợt liên tiếp (193/194/195) với scanner VẮNG → giả thuyết "thiếu scanner" đã bị bác đợt 196 (kẹt #29 xảy ra với gst-inspect CÓ).
- **Dữ kiện đợt 199:** selfcheck #1 trên #129 TRƯỚC repair (07:05:13Z): libs hệ thống 6/6 THIEU, libgst* 0, dpkg.log 2 dòng; selfcheck #2 SAU repair (07:16:13Z): libs 6/6 CÓ, libgst* 79, dpkg 777. Driver T8 vẫn vá LD_LIBRARY_PATH + GST_PLUGIN_PATH/SYSTEM_PATH → debroot cho 3 pha WebKit (F-197-T8-1, giữ nguyên); launch-test headed PASS trên #129 (T56 verify exit 0, 07:10:51Z). Cùng điều kiện scanner vắng (gst-inspect + gst-plugin-scanner VẮNG): 84l10 PASS + 85m4 PASS + 86n2 PASS + Chromium 3/3 PASS. **Scanner vắng riêng lẻ KHÔNG phân biệt kẹt/pass — giả thuyết "thiếu scanner" vẫn bị bác (lần 4).**
- **Debroot vẫn là đường dự phòng:** `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu` (348 file; GST 269 plugin). Trên #129 libs hệ thống đã đủ sau repair nên WebKit chạy được cả hai đường; driver giữ debroot để phòng cell mới thiếu libs (F-197-T8-1).

## E. Checklist (o) — các giá trị T8 cung cấp cho aggregate đợt 199 (T10 quyết)

- (a) Harness: WebKit 84l10 PASS + 85m4 PASS + 86n2 PASS trên #129; Chromium 3/3 PASS trên #129; **6/6 — ĐẠT.**
- (b) FULL PASS: **KHÔNG CÓ** (chân lượt yên KHÔNG có — #67 0 lượt hợp lệ; chân O8 3/3 trên #128 nhưng harness chạy trên #129, khác boot → không gộp; chuỗi full pass GIỮ 0).
- (j) **V5 GIỮ LIVE (đề xuất — 5/5 kẹt mù, 0 FP trên 47 log sạch; live đợt này 0 trigger, đúng vì không có kẹt)**; 84l10 PASS — chuỗi 0 → 1; **86n2-P1 CÓ DỮ KIỆN MỚI — P1 PASS 07:21:05Z → chuỗi 19 → 20**; B2 vùng mới sạch lần 12 → 13; B1 live sạch (đợt sạch — chuỗi tính lại từ 1 nếu parent chấp nhận theo tiền lệ đợt 179); **V2+V4+V5 = 11/11, 0 FP trên 47 log sạch**; V2 VẪN là phương án chính (6/6 lớp HB128); V4 GIỮ LIVE (5/5). **B2 dữ kiện mới: W1 43 / W2 33 / W3 39 spike — T4 đếm #11/#12/#13 (mỗi cửa sổ = 1 dữ kiện); theo cách đếm cũ (mỗi đợt = 1) thì là dữ kiện thứ 11 — parent/T10 quyết cách ghi chuỗi; KHÔNG TÁCH vẫn đứng** (T4 chỉ báo số).
- (m) Lượt yên #67: **KHÔNG CÓ LƯỢT HỢP LỆ** (T4-199: 3 attempt đều 20/20 nhưng lớp B vi phạm + tickCost median 102,0/70,0/94,0 ms — chuỗi lượt yên hợp lệ 2 → 0, đề xuất). Live-check #18: **KHÔNG ĐẠT** (T4-199; 0 cửa sổ hợp lệ; 12 mẫu autotrigger 0 FIRE nhưng mỗi cửa sổ 33–43 spike B2 — chuỗi live ĐẠT GIỮ 0). P3' cộng dồn KHÔNG ĐỔI 53 lượt (T4-199 .done; sổ md5 c8792589).
- (n) Stall/outage: **0 kẹt harness mới đợt này** (cộng dồn GIỮ 31). Reboot #129 giữa đợt (06:38:56Z, gap #128→#129 = 5.826 s — T01-200 survey; phân loại thuộc T7-199 + parent). Run 205 kết cục + run 206 thuộc T7-199. Cửa slot 199 + tổng lặng thuộc T7-199 (T8 chỉ cung cấp kẹt harness + reboot #129).
- (o) Auto-trigger: T9-199 chưa đóng lúc T8 đóng — số mẫu đợt này xem LIMITS T9-199; trong cửa sổ T4: 0 FIRE (T4-199 .done: 12 mẫu live watch/consec=0, 0 FIRE).
- (p) Vi phạm: **T8 0 vi phạm** (GATE-FOUND file-based 07:09:06Z đúng (p1); gate-check 6/6 lần "T4 khong giu lock", 0 chồng lấn; vite nối tiếp; lock trống trước khi chạy). Harness chạy SAU khi T4 .done đã có — KHÔNG cần gate thực chất đợt này.
- (E-247) MỞ — không có dữ kiện mới đợt này từ T8 (T9-199 chưa đóng; xem LIMITS T9-199).

## F. Diag W2-setup — DỪNG (không chạy đợt này)

- Diag W2-setup (run-diag-84l10-w2setup-199t8.sh, md5 727bb081, 10.114 B + build-84l10-w2setup-hb128.py, md5 646e17ec, 4.560 B) KHÔNG chạy đợt này — không có ca kẹt 84l10 W2 để điều tra (84l10 PASS cả W1 lẫn W2 đợt này; kẹt #31 thuộc W1-lần3/forceOnce, không phải W2; đã có diag live ×2 (V5) + WATCHDOG + probe TIMEOUT + diag sau timeout đợt 198). Giữ script cho đợt sau.

## 5. Cây lúc đóng + md5 (kiểm lúc ~07:33Z)

- preview.tsx `477a0eac` (không đổi so với đợt 198); media.ts `ac89aeb2` (không đổi); vite.config.ts `ee80d093` (không đổi). **Harness #129 cùng cây 477a0eac/ac89aeb2/ee80d093. O8 T01 chạy cùng cây này trên #128 (khác boot, cùng cây — xem §A).**
- Fixture rebuild 2 lần (05:47Z trên #128 — MẤT theo reboot #129; 06:42Z trên #129): md5 khớp đợt 125 cả 4 lần 2 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549).
- /tmp fixture đã rebuild xong trước harness lần 2. baseline-meminfo.txt ghi được (smoke mới).

## 6. Dọn dẹp + kiểm cuối (extract-199t8.py, chạy 07:33Z)

- ps sót T8: 0 (Xvfb :199, MiniBrowser, WebKitWebProcess, clicktest T8 — 0). X11 files: 0 (X199 socket của T8 đã dọn; không còn socket sót X193/X197 như đợt 198 — đã sạch).
- Symlink t8-diag-stall.sh: cả 2 nơi → diag-stall-199t8.sh.
- Lock vite-lock-v2: TRỐNG (0 ticket + 87 cooldown).
- Vite: không còn vite nào của T8 chạy (driver đã exit sạch 07:32:00Z). Chrome/Chromium: 0 process T8 còn lại.
- **T4 .done ĐÃ CÓ TRƯỚC khi harness chạy** (06:57Z — GATE-FOUND 07:09:06Z; harness 07:16:26Z). **T56 .done ĐÃ CÓ lúc T8 đóng** (POSTBOOT #129 + watcher L2 + holder — xem §E/(i) dưới).
- Bằng chứng giữ nguyên trong smoke/ (6 log pha + ram log + summary + replay .out ×6, extract .out, waiter log 2 phiên, selfcheck ×2, rebuild-fixtures ×2).

## 7. Giới hạn

- Harness 6/6 trên 1 boot (#129); O8 trên #128 (boot khác) — chân FULL PASS O8/harness không gộp được đợt này (khác boot).
- T8 đóng TRONG hạn cờ (~07:40Z vs ~08:00Z).
- POSTBOOT_PASS #128 CÓ (poll=0, replay-day-du — mạnh) + #129 CÓ (poll=1, repair — yếu hơn, như #126/#127). #129 CHƯA được T01 xác minh 9 nguồn tươi (T01-199 chỉ survey #128; survey #129 thuộc T01-200).
- Sampler n=32 (chỉ suốt harness); không có sampler suốt phiên.
- Số liệu T4/T2/T01/T56/T7 trích từ LIMITS/.done của họ (đã đọc), không đo lại. T9-199 chưa đóng lúc T8 đóng — số liệu của họ (headroom, auto-trigger đợt, E-247) xem LIMITS của họ. T7-199 chưa đóng — run 205/206 + cửa slot + tổng lặng xem LIMITS của họ.
- LIMITS này < trần push 37.768 B (kiểm sau khi ghi).

## 8. Sai số mới + nợ cũ

- **F-199-T8-1 (REBOOT #129 GIỮA ĐỢT — WAITER CHẾT THEO, FIXTURE MẤT, GATE TRỄ ~30 PHÚT):** reboot 06:38:56Z giết watcher-199 L1 + waiter T8 phiên 1 (poll 53, 06:38:51Z — không kịp ghi dòng REBOOT) + fixture /tmp. Waiter khởi động lại 06:41:01Z (append, không truncate — F-192-T8-1) và bắt đúng boot mới. T56 repair #129 (apt ~15 phút) tới 07:08:07Z mới có POSTBOOT_PASS; T4 .done 06:57Z; GATE-FOUND 07:09:06Z; harness bắt đầu 07:16:26Z (trễ ~40 phút so với nhịp thường nếu không có reboot). **T8 đóng trong hạn cờ — ghi nhận, không phạt (nguyên nhân ngoài T8).**
- **F-199-T8-2 (B2-OFFLINE — --NOW SAI NGÀY BỊA TRIGGER V5 GIẢ):** lần chạy đầu 6 ca B2-offline dùng --now = giờ trong log gán ngày 27/11 (log từ 24/11) nên V5 báo 3 TRIGGER wallclock giả trên B2-4/5/6 (silence ~215.000 s). Nguyên nhân: --now phải là timestamp ĐẦY ĐỦ của log (ngày + giờ), không được ghép ngày hiện tại vào giờ trong log. **ĐÃ SỬA:** chạy lại với --now/--until = last_ts đầy đủ; kết quả đúng khớp 198 (3 TRIGGER via f/wd + 3 KHÔNG kích hoạt). Bài học: timestamp replay luôn lấy nguyên chuỗi ISO trong log; file b2-offline-199t8.txt đã ghi đè bằng kết quả đúng.
- **F-199-T8-3 (SED ĐỔI NHÃN DỪNG GIỮA CHỪNG DO `&&` + THƯ MỤC smoke):** lệnh `sed -i 's/198t8/199t8/g' * && ...` dừng sau khi sed gặp thư mục `smoke` (exit != 0) nên các file sau smoke theo thứ tự alphabet (verify-163, wait-t4-t5) + toàn bộ sed vòng for + sed waiter KHÔNG chạy; đã phát hiện bằng grep và sửa riêng từng file, kiểm lại bằng diff (check-fresh chỉ 8 dòng nhãn) + bash -n + py_compile. Bài học: KHÔNG dùng `sed ... * &&` khi thư mục có thể lẫn trong glob — dùng danh sách file tường minh hoặc `find -type f`.
- **F-199-T8-4 (LỆNH NỀN + `cd` — BẪY `&` + `cd` CŨ, GẶP LẠI):** `cd DIR && nohup ... & sleep 65; tail ...` background CẢ chuỗi cd+nohup nên sleep/tail chạy ở cwd cũ (/home/hatch), tail báo "No such file" (waiter vẫn chạy đúng — chỉ lệnh kiểm sai cwd). Cùng họ lỗi với F-198-T8-6. Bài học: dùng subshell `(cd DIR && ...) &` hoặc đường dẫn tuyệt đối cho mọi lệnh sau `&`.
- **F-198-T8-7 (TIÊU ĐỀ LIMITS T8 GHI SAI GIỜ MỞ ĐỢT — ĐÃ SỬA, ĐÓNG):** tiêu đề LIMITS T8-198 ghi "03:35" thay vì "06:35"; đợt này ghi đúng "12:35 +07" (lượt cron mở đợt 199). ĐÓNG.
- **Nợ cũ:** F-194-T8-2/4/5 vẫn mở (check-fresh file vắng; nhãn echo; run-chromium grep HB128). F-196-T8-4 (balloon 95,4% #124) → nay 87,8% (nặng hơn 198 nhưng nhẹ hơn #124/#125). F-196-T8-9 (baseline-meminfo EPERM) → nay ghi được (smoke mới). F-193-T8-1 (waiter reboot) → nay CÓ dữ kiện lần 2 (reboot #129 giết waiter phiên 1 — waiter khởi động lại append đúng quy trình; xem F-199-T8-1).

## 9. Nợ / chờ parent (T10 quyết ở §14.2 aggregate 199)

- (j) **V5 GIỮ LIVE?** (đề xuất: GIỮ — 5/5 kẹt mù, 0 FP trên 47 log sạch; live đợt này 0 trigger đúng vì không có kẹt; V2 vẫn là phương án chính 6/6; V4 GIỮ LIVE 5/5); 84l10 PASS — chuỗi 0 → 1; **86n2-P1 CÓ DỮ KIỆN MỚI — chuỗi 19 → 20**; B2 vùng mới sạch lần 12 → 13; B1 live sạch (đợt sạch — chuỗi tính lại từ 1 nếu parent chấp nhận theo tiền lệ đợt 179); **B2 dữ kiện mới: W1 43 / W2 33 / W3 39 — T4 đếm #11/#12/#13, cách đếm cũ thì #11 — parent/T10 quyết cách ghi chuỗi; KHÔNG TÁCH vẫn đứng** (T4 chỉ báo số, không tự quyết tách).
- (b) FULL PASS KHÔNG CÓ (chân lượt yên KHÔNG có; chân O8 3/3 trên #128 nhưng harness 6/6 trên #129 — khác boot nên không gộp; chuỗi GIỮ 0).
- (c) POSTBOOT_PASS #128 CÓ (poll=0, replay-day-du — T56-199) + #129 CÓ (poll=1, repair-som-quyet-h — T56-199); cả hai đã có verify độc lập exit 0. #127 CÓ caveat (b1) từ (c)-198 (không đổi); tổng boot không cờ GIỮ 31 (nếu parent chấp nhận #128/#129 đều CÓ).
- (e) #128: **T01-199 survey 9 nguồn tươi** (773743f2, btime 05:01:50Z, gap #127→#128 = 16.044 s); marker 79 → 80 nếu parent xác nhận #128 (T56 đã XÁC MINH đường dẫn file marker: /home/hatch/.config/vcut-persistence-marker, md5 cb7102c0 — F-198-T56-6 ĐÓNG). #129 ỨNG VIÊN (e6e070b8, btime 06:38:56Z — T01-200 survey; marker 81 nếu #129 cũng xác nhận).
- (f) **(m) #127 DƯƠNG (CUỐI, T2-199)** — eid 11475, run 205, +42,661171 s, TRONG [33; 49,8]; **n 57/58** (T2-199 .done). **(m) #128 THÔ 0 requeue** (T01-199) — phân loại CUỐI thuộc T2-200.
- (i) Holder: #128 KHÔNG GIẾT — chuỗi 3 → 4; #129 KHÔNG GIẾT — chuỗi 4 → 5 (T56-199). (A) + suite + hướng (3): xem LIMITS T56-199 (T56 đã đóng).
- (m) Lượt yên #67 KHÔNG CÓ LƯỢT HỢP LỆ — chuỗi 2 → 0 (đề xuất). Live-check #18 KHÔNG ĐẠT — chuỗi live ĐẠT GIỮ 0. P3' cộng dồn KHÔNG ĐỔI 53 lượt hợp lệ (sổ md5 c8792589).
- (n) Reboot #129 giữa đợt (gap #128→#129 = 5.826 s) + run 205/206 kết cục + cửa slot 199 + tổng lặng: xem LIMITS T7-199 (T7 chưa đóng lúc T8 đóng).
- (p) Vi phạm: **T8 0 vi phạm.** Harness chạy SAU khi T4 .done đã có (GATE-FOUND file-based 07:09:06Z — đúng quy tắc (p1) mới, KHÔNG cần gate thực chất đợt này).
- (q) Đếm: T01-199 đếm cuối (lúc T01 đóng 05:56Z) — xem LIMITS T01-199; lũy kế/chờ push xem (q) aggregate 199 (T10 đếm toàn cục). T8 đóng góp 1 LIMITS (+ scripts).
- Chờ push 191–198 = (q)-198 (95/366/273/252) + batch đợt 199 (T10 đếm cuối).
