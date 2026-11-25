# Đợt 184 T8 — HARNESS 3/6: WebKit KHÔNG ĐO ĐƯỢC (launch-fail libevent trên #103); O8 T8 1/3; REBOOT #103 GIỮA PHIÊN; THIẾT KẾ V2 ĐÃ CHUẨN BỊ

Ngày: 24/11/2026 (lượt cron 15:35 +07 = 08:35:51Z; T8 mở ~08:41Z, đóng ~10:47Z — TRONG hạn cờ ~11:00Z và hạn cứng ~11:35Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) harness hb128 + B1 live trên boot hiện tại; (2) O8 T8; (3) (c')/(f') + thiết kế V2 (F-183-T8-4); (4) H3 thụ động; (5) F-183-T8-7 + F-183-T8-3 + F-183-T8-1. KHÔNG chạy diag W2-setup (DỪNG, quyết (j) đợt 180). **Nguồn:** LIMITS T8-183 + aggregate 183 §8/§12.3 (bản parent quyết, §12.3 TRỐNG khi parent đọc — SẠCH, lần đầu kể từ đợt 179; parent kiểm đếm KHỚP lần 90).

## 0. Kết luận ngắn — 3/6; WebKit 0/3 KHÔNG ĐO ĐƯỢC (KHÔNG PHẢI KẸT); O8 T8 1/3; FULL PASS GIỮ 0

- **#102 XÁC NHẬN 9 nguồn (T0-184)** — boot `6ecd948e`, btime 07:07:05Z, gap #101→#102 = 6.878 s. **POSTBOOT_PASS #102 CÓ 08:43:59Z (T5-184: replay-đầy-đủ, poll=0, KHÔNG caveat — dpkg 1461, cache 170, lists 39). Gate (a) #102: CÓ (KHÔNG caveat).** Marker sống qua **54 reboot**.
- **Lượt yên #53 CÓ LƯỢT HỢP LỆ (T4-184, đóng cờ 09:33Z)** — attempt2-6ecd948e 20/20 + B 5/5 + tickCost median 43,5 ms; **chuỗi lượt yên 45 → 46** (attempt1 NHIỄM TẢI — F-184-T2-8: hole-recheck T2 chồng cửa sổ attempt; retry attempt2 sạch; ngân sách 2/3). Quyết (p) kiểm chứng live lần 4: ĐẠT.
- **REBOOT #103 MỚI 09:14:55Z (F-184-T8-2)** — boot `e0921bda`, gap #102→#103 = 7.670 s (T2-184/T4-184; số hiệu chờ T0-185); xảy ra SAU khi T4 poller thoát 09:12:01Z, TRƯỚC khi T8 chạy harness; 0 reboot trong phiên đo của T4; **0 reboot trong cửa sổ harness/O8 của T8 (10:31–10:41Z)**. **#103 KHÔNG HEAL**: dpkg giữ 2 dòng từ 09:15:33Z tới 10:30Z (không đổi); libs 0/6; GST 0; cache 0; lists 5 — replay đình trệ boot thứ ba liên tiếp (#100 một phần, #101 toàn phần, #103 toàn phần tính tới lúc đóng; #102 đã heal 07:40:57Z).
- **HARNESS 3/6 trên #103 (10:31:15–10:40:05Z, sau WAIT-DEADLINE — xem §1): WebKit 0/3 KHÔNG ĐO ĐƯỢC — launch-fail `libevent-2.1.so.7` (MiniBrowser exitCode 127, exit=1, ~10 s/pha, 0 dòng HB128); Chromium 3/3 PASS** (84l10 W2+E4, 85m4 P1+P5, 86n2-hb128 P1+P5+P6 — KHÔNG FAIL cả 3). **Kẹt cộng dồn GIỮ 26 — 0 kẹt mới** (0 pha WebKit đo được; không có kẹt thật mới).
- **O8 T8 1/3 trên #103** (10:40:44–10:41:52Z): WebKit ×2 KHÔNG ĐO ĐƯỢC (exit=2, JSON n=2 ok=1, md5 `fc6e2a02`/`bdb31e03`; S1 probe exit=1) + **Chromium 21/21 PASS (md5 `e3c91524`)** — JSON đếm lại bằng python. **O8 T0 PASS 3/3 trên #102** (theo cờ T0-184: WebKit md5 `ce3eebb4`/`42810c2d` + Chromium `ca54a31e`, 08:45:16–08:48:57Z, sau cờ 77 s).
- **FULL PASS: KHÔNG CÓ full pass đợt này — chuỗi GIỮ 0 (đề xuất, parent quyết).** Trên #102 đủ 3/5 chân (lượt yên #53 ✓, gate (a) #102 ✓ KHÔNG caveat, O8 T0 ✓ 3/3) nhưng O8 T8 + harness thuộc #103 (khác boot); trên #103 cả hai chân đều KHÔNG ĐO ĐƯỢC (launch-fail, không phải FAIL sản phẩm).
- **(c')/(f') V1: replay C5.1 ĐẠT, 0 FP trên 16 log sạch duy nhất (KHÔNG ĐỔI — đợt 184 đóng góp 0 log mới: log WebKit launch-fail 0 dòng HB128, không phải log sạch cũng không phải log kẹt). (f') V1-300 ĐẠT. V2 (f'') bắt được kẹt-183 @125 s (xác nhận lại sau khi sửa F-184-T8-1). THIẾT KẾ V2 ĐÃ CHUẨN BỊ XONG (§C4) — parent quyết ở đợt 184.**
- **Plan B B1: CHƯA KIỂM LIVE đợt này** (86n2-hb128 WebKit launch-fail — B1 không chạy được; Chromium 86n2 PASS không thử B1 vì B1 bọc WebKit). **B1 live sạch GIỮ 2 (181 + 183). B2 VẪN HOÃN.**
- **F-183-T8-7: SỬA XONG + KIỂM LIVE ĐẠT** — selfcheck kiểm đúng `libevent-2.1.so.7`: trên #102 CO (đúng), trên #103 THIEU (đúng). **F-183-T8-3: ĐÃ ÁP DỤNG** — chỉ chạy `run-webkit-184t8.sh` (cả 6 pha), KHÔNG chạy thêm `run-chromium-*` riêng. **F-183-T8-1: ĐÃ ÁP DỤNG** — dọn `smoke/` khỏi bản copy (51 entry → `smoke/archive-183/`).
- **Waiter: WAIT-DEADLINE 10:30:51Z poll=75 — GATE NOT MET** (t4=1, postboot=0 — xem §1).

## 1. Dòng thời gian (gọn)

- 07:07:05Z **REBOOT #102** (T0-184 XÁC NHẬN 9 nguồn). 08:35:51Z Đợt 184 mở. 08:41–08:45Z T8 mở: đọc LIMITS T8-183 + aggregate 183 §12.3 (bản parent quyết); md5 cây khớp 183; copy driver 183→184 + đổi nhãn (waiter → 10:30Z, LIVE-DIAG/FRESH-CONTENT → 184, T8-184); **dọn `smoke/` khỏi bản copy (F-183-T8-1)**; sửa selfcheck libevent (F-183-T8-7); sửa nhãn extract "ovsize LIMITS 181" → 183 (F-183-T8-5); **cả hai symlink diag → round184-t8 lúc ~08:45Z**; probe S1 CÓ SẴN (md5 `453d1082`); selfcheck #1 trên #102: libs 6/6 CO, GST 1624, dpkg 1461; fixture /tmp VẮNG (wipe theo #102 — chờ gate); mở: 0 process sót, X11 TRỐNG, lock trống.
- 08:43:59Z **POSTBOOT_PASS #102 CÓ** (replay-đầy-đủ, poll=0, KHÔNG caveat). 08:45:16–08:48:57Z **O8 T0 PASS 3/3 trên #102**. 08:45:42Z Waiter-1 bắt đầu (deadline 10:30Z). T4 poller bắt đầu 08:46:16Z.
- 09:04:22Z Cửa yên mở poll #25 → attempt1 (20/20 NHIỄM TẢI — F-184-T2-8); 09:08:13Z cửa mở lại poll #26 → attempt2 HỢP LỆ; 09:12:01Z poller thoát exit 0 (ngân sách 2/3).
- **09:14:55Z REBOOT #103 (e0921bda)** — giết waiter-1 (poll 30, t4=0, postboot=1), watcher-183/184, poller T4 đã thoát trước đó; T4 LIMITS chưa viết xong lúc reboot (viết 09:31:23Z, cờ 09:33Z — sau reboot, trên #103).
- 09:16:45Z Waiter-2 bắt đầu (boot #103, deadline 10:30Z). 09:21:02Z selfcheck #2 trên #103: libs 0/6 THIEU (kể cả `libevent-2.1.so.7` — kiểm live lần 2, đúng), GST 0, dpkg 2 — **#103 chưa heal**. 09:20:21Z EPERM probe #103 ok=2 fail=0 (T2-184). 09:31:23Z T4 LIMITS viết xong (36.422 B); **09:33Z T4 ĐÓNG CỜ** (#53 hợp lệ, chuỗi 45→46). Waiter-2: t4=1 từ poll 19 (09:34:47Z), postboot=0 suốt (không watcher nào cho #103 — T5-184 đã đóng cờ 09:11Z cho #102; không gate0wait nào cho #103 — log T4 đều của #102).
- ~10:02Z **rebuild fixture: exit 0, md5 khớp đợt 125** (ba0c7c62/f05daed8/fbaa3d1a/a1fb8549) — chạy SAU khi T4 đóng cờ (không còn cửa sổ attempt), trước waiter hết hạn để kịp giờ.
- **10:30:51Z WAIT-DEADLINE poll=75 — GATE NOT MET** (t4=1, postboot=0). Theo thủ tục quyết parent (i) đợt 143 + tiền lệ đợt 182: T4 có 0 attempt trên boot hiện tại #103, không attempt nào đang chạy → T8 chạy harness sau waiter hết hạn, ghi rõ.
- **10:31:15–10:40:05Z HARNESS 3/6** (driver pid 16370, boot #103). **10:40:44–10:41:52Z O8 T8 1/3.** 10:42–10:47Z replay + extract + LIMITS + paths + cờ.

## A. O8 — T8 1/3 TRÊN #103 (KHÔNG ĐO ĐƯỢC WebKit); T0 3/3 TRÊN #102

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #103 | **KHÔNG ĐO ĐƯỢC** — exit=2, JSON n=2 ok=1, md5 `fc6e2a02` (S1 FAIL 10:40:53Z, Target crashed — launch-fail libevent) |
| 2 | O8 T8 WebKit attempt2 trên #103 | **KHÔNG ĐO ĐƯỢC** — exit=2, JSON n=2 ok=1, md5 `bdb31e03` (S1 FAIL 10:41:01Z, Target crashed) |
| 3 | O8 T8 Chromium trên #103 | **21/21 PASS** — exit=0, JSON 21/21 ok=true, md5 `e3c91524`, S1 PASS 10:41:21Z |
| 4 | O8 T0 WebKit attempt1 trên #102 | **21/21 PASS** — md5 `ce3eebb4`, S1 08:45:37Z (theo cờ T0-184) |
| 5 | O8 T0 WebKit attempt2 trên #102 | **21/21 PASS** — md5 `42810c2d`, S1 08:46:51Z (theo cờ T0-184) |
| 6 | O8 T0 Chromium trên #102 | **21/21 PASS** — md5 `ca54a31e`, S1 08:48:23Z (theo cờ T0-184) |

- O8 T8 chạy 10:40:44–10:41:52Z trên #103 (KHÔNG có POSTBOOT_PASS — boot chưa heal; driver chạy sau WAIT-DEADLINE theo thủ tục (i) đợt 143). S1 probe chạy vì attempt1 FAIL (exit=1 — cũng launch-fail). O8 log: S1 PASS 1 (Chromium), FAIL 8, HARNESS LỖI 5, Target crashed 7, WATCHDOG-137 0 (theo extract-184t8).
- O8 T0 chạy 08:45:16–08:48:57Z trên #102, sau cờ 77 s (theo cờ T0-184; T8 chỉ đối chiếu md5 + S1 từ LIMITS T0-184).
- **Gate cho boot đo `e0921bda` (#103 ứng viên): KHÔNG CÓ — POSTBOOT_PASS #103 CHƯA CÓ** (không watcher nào sống trên #103; T5-184 đã đóng cờ cho #102). **Gate cho #102: (a) CÓ — POSTBOOT_PASS #102 (replay-đầy-đủ, poll=0, KHÔNG caveat).** O8 T0 + lượt yên #53 + gate (a) cùng boot #102; O8 T8 + harness cùng boot #103 (khác boot). **Chuỗi FULL PASS GIỮ 0 (đề xuất, parent/T10 quyết).**

## 2. Kết quả harness — 3/6; WebKit 0/3 KHÔNG ĐO ĐƯỢC (launch-fail); Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 1 | 10:31:15–10:31:25 | **KHÔNG ĐO ĐƯỢC** — launch-fail libevent-2.1.so.7 (exitCode 127), 0 dòng HB128 |
| 2 | WebKit 85m4-hb128 | 1 | 10:31:41–10:31:51 | **KHÔNG ĐO ĐƯỢC** — launch-fail libevent-2.1.so.7 (exitCode 127), 0 dòng HB128 |
| 3 | WebKit 86n2-hb128 | 1 | 10:32:06–10:32:16 | **KHÔNG ĐO ĐƯỢC** — launch-fail libevent-2.1.so.7 (exitCode 127), 0 dòng HB128 |
| 4 | Chromium 84l10 | 0 | 10:32:31–10:33:41 | **PASS** — W2 PASS + E4 PASS, KHÔNG FAIL, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 10:33:57–10:35:58 | **PASS** — P1 PASS + P5 PASS, KHÔNG FAIL, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 10:36:13–10:40:05 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, KHÔNG FAIL, live_diags=0 |

- **Chữ ký launch-fail (cả 3 pha WebKit, giống hệt đợt 182):** vite dev sẵn sàng → MiniBrowser lỗi `error while loading shared libraries: libevent-2.1.so.7: cannot open shared object file` → exitCode 127 → report JSON ok=False. Mỗi pha chỉ ~10 s. **KHÔNG PHẢI kẹt (exit 124), KHÔNG PHẢI FAIL sản phẩm** — engine không khởi động được vì thiếu lib hệ thống trên boot chưa heal.
- **Kẹt harness cộng dồn GIỮ 26 — 0 kẹt mới.** **84l10 PASS: KHÔNG NỐI ĐƯỢC chuỗi 4 đợt** (179–181 + 183 — WebKit không đo được đợt này; parent/T10 quyết chuỗi đứt hay giữ nguyên chờ đợt sau). **86n2-P1 không kẹt: KHÔNG NỐI ĐƯỢC chuỗi 7** (cùng lý do — Chromium 86n2 P1 PASS không tính vào chuỗi WebKit).
- **Đối chứng Chromium cùng pha: 3/3 PASS** — Chromium tự gói lib nên chạy được trên boot chưa heal; WebKitGTK phụ thuộc lib hệ thống nên launch-fail. Bằng chứng đối chứng cho H3 theo hướng ngược: kẹt/không-chạy của WebKit gắn với môi trường hệ thống, không phải lỗi app (vite dev sẵn sàng cả 6 pha; clip fixture md5 khớp).
- **B1 live: CHƯA KIỂM đợt này** — 86n2-hb128 WebKit launch-fail nên wrapper resetPlayhead0 (B1) không chạy được; Chromium 86n2 PASS không thử B1 (B1 bọc WebKit). **B1 live sạch GIỮ 2 (181 + 183). B2 VẪN HOÃN.**
- RAM sampler (ram-184t8.log, n=18): balloon min 5.236.820 / max 6.443.824 kB (**100,0% trần, pinned=1**), avail min 429 MB / max 1.428 MB — ghim trần 1 lần lúc mở harness (10:31:12Z).

## 3. Watchdog + 4 bước kiểm — 0 WATCHDOG-137; 0 LIVE-DIAG; (1c')/(f') 0 kích hoạt live

- **Watchdog (i): 0 dòng** (cả 6 pha — WebKit chết ở launch, chưa tới evaluate; Chromium chạy sạch). Live-diag (1b): **0** (log WebKit ngắn, không im lặng >120 s theo nghĩa đo — chết ngay ở launch; log Chromium chảy đều). (1c')/(f') V1: 0 kích hoạt live; replay C5.1 ĐẠT (§C).
- **(1)** Watchdog trong 3 script (VÁ 142, GIỮ NGUYÊN 143–184) + `t8-diag-stall.sh` → 184. **(1b)** live_diags=0 cả 6 pha. **(1c')** 0 kích hoạt live (log WebKit 0 dòng HB128 nên không có gì để kiểm).
- **(2)** Balloon sampler: n=18 (xem §2); avail thấp nhất 429 MB (10:31:12Z).
- **(3)** Đối chứng Chromium cùng pha: 3/3 PASS (xem §2). **(4)** dmesg + journalctl -k sau mỗi lần kẹt: **0 lần kẹt → 0 snapshot mới** (dmesg không đọc được — journalctl-k trống, như mọi đợt).
- **0 snapshot stall mới.** 0 thư mục stall mới trong smoke/ (extract: `stall dirs: []`; các thư mục stall cũ nằm trong `smoke/archive-183/`). Cả hai symlink diag cập nhật → round184-t8 lúc ~08:45Z, TRƯỚC waiter (F-178-T8-8 — checklist copy driver gồm cả hai symlink, 6 đợt liên tiếp).

# §C — (1c')/(f') V1: REPLAY C5.1 ĐẠT, 0 FP; THIẾT KẾ V2 ĐÃ CHUẨN BỊ XONG (F-183-T8-4 → QUYẾT ĐỢT 184)

## C1–C2. Thiết kế + B1: **(c'):** trailing run HB128 cùng tag + playhead + ct, kích hoạt khi span ≥ 120 s VÀ chuỗi ≥3 dòng VÀ (e)/(f) trên dòng mới nhất. **(f') V1:** miễn (f) khi `paused+seeking=true` ≥300 s. Ngân sách chung với (1b) ≤2 lần/lần chạy, ≥240 s; diag-only; phạm vi 85m4 + 84l10 W2/E4 (Q3) + 86n2-hb128 (đợt 180) + resetPlayhead0 (B1, đợt 181). V2 (f'') dự phòng, CHƯA triển khai. **B1 CHƯA KIỂM LIVE đợt này** (86n2-hb128 WebKit launch-fail); **B1 live sạch GIỮ 2. B2 VẪN HOÃN.**

## C3. Replay sau O8 (replay-1c-184t8.py + replay-f-fix-184t8.py, ~10:42Z)

- **(c') V1: kẹt-164 TRIGGER @125 s; kẹt-178 TRIGGER @125 s (TRUE POSITIVE); kẹt-171/179/183 KHÔNG (BỎ LỠ — đã biết); 0 FP trên 16 log sạch duy nhất (KHÔNG ĐỔI — đợt 184 đóng góp 0 log mới: log WebKit launch-fail 0 dòng HB128, không phải log sạch cũng không phải log kẹt — KHÔNG thêm entry 184 nào vào cả hai script replay). C5.1 ĐẠT** (tiêu chí C5.1 chỉ xét kẹt-164 + log sạch).
- **(f') V1-300: ĐẠT** — 164 @125 s; 171 @305 s; V1-180: 164@125 s (171 KHÔNG); V1-600: cả hai; V2: cả hai. **(c') hiện tại KHÔNG ĐẠT** (lỡ 171 — đã biết).
- **Kẹt-183 theo từng phương án (xác nhận lại đợt này, sau khi sửa F-184-T8-1): (c') KHÔNG; (f') V1-180/300/600 đều KHÔNG; (f'') V2 TRIGGER @125 s; (f''') V3 KHÔNG.** Lý do: kẹt-183 có paused=true + seeking=false suốt 886 s — (f) chặn; (f') V1 chỉ miễn khi seeking=true nên bó tay; V2 miễn khi watchdog đã kích hoạt — WATCHDOG-137 ĐÃ kích hoạt 06:33:39Z đợt 183 — nên V2 bắt được @125 s.
- **F-184-T8-1 (mới — TỰ BẮT ĐƯỢC, ĐÃ SỬA):** script đổi tên copy 183→184 đã viết đè đường dẫn log lịch sử trong replay (entry `183-ket-85m4`/`183-sach-86n2-hb128` trỏ nhầm sang `round184-t8/smoke/`) — baseline replay báo NO-FILE cho cả hai entry (đúng ra phải có file: 177 dòng HB128 + 3 WATCHDOG-137 cho kẹt-183). Đã sửa 2 entry về `round183-t8/smoke/` trong cả hai script + chạy lại baseline sạch (kẹt-183 parse đủ 177 dòng, V2 TRIGGER @125 s). Bài học: token `round183-t8` trong replay LOGS là đường dẫn lịch sử, KHÔNG phải nhãn đợt hiện tại — lần đổi tên sau phải loại trừ khối LOGS khỏi thay token.

## C4. THIẾT KẾ NÂNG V2 (f'') — CHUẨN BỊ CHO PARENT QUYẾT Ở ĐỢT 184 (F-183-T8-4; KHÔNG tự triển khai)

- **Vấn đề:** (c') bỏ lỡ kẹt-183 vì (f) chặn trên run paused=true + seeking=false suốt 886 s; (f') V1 chỉ miễn khi seeking=true nên bó tay. Đây là lỗ hổng thứ ba của (c') (sau 171/179).
- **Thiết kế V2 (f''):** giữ nguyên mọi điều kiện của (c') (trailing run cùng tag+playhead+ct, span ≥ 120 s, run_len ≥ 3, (e) vẫn giữ: playing=true khi có, không có → seeking=false) — CHỈ THÊM một nhánh miễn (f): **miễn (f) khi watchdog (i) ĐÃ kích hoạt cho cùng pha trước thời điểm dòng HB128 hiện tại** (dòng WATCHDOG-137 trong cùng file log, timestamp ≤ ts dòng hiện tại; so sánh chuỗi ISO Z cùng định dạng). Không đổi ngưỡng 120 s, không đổi ngân sách (≤2 diag/lần chạy, ≥240 s, diag-only), không đổi timeout 900 s, không đổi verdict.
- **Bằng chứng (replay-f-fix-184t8.py, chạy lại đợt này):** V2 bắt được **4/4 kẹt có HB128** — 164@125 s, 171@125 s (sớm hơn V1-300 tới 180 s), 178@125 s, 183@125 s; **0 FP trên 16 log sạch duy nhất** (+ các log 86n2). V1-300 chỉ bắt 2/4 (164, 171@305 s) và lỡ 183. Kẹt-179 vẫn lỡ ở mọi phương án (0 dòng HB128 trong lúc kẹt — lỗ hổng phủ sóng, không phải lỗ hổng điều kiện).
- **Biên an toàn:** log sạch max identical-run span **5 s** (ngưỡng 120 s → 24×); watchdog chỉ kích hoạt sau evaluate im lặng >60 s — tín hiệu ĐỘC LẬP (kênh JS chết), không suy từ HB128 nên không vòng tròn. Xấu nhất nếu watchdog kích hoạt oan trên lượt sạch: (f) được miễn nhưng (c') vẫn cần run đóng băng 120 s (log sạch max 5 s) → không FP; diag thừa tối đa 2 lần/lần chạy, đúng ngân sách hiện tại.
- **Triển khai (nếu parent duyệt — ước tính ~15 dòng):** port hàm `replay(..., variant="V2")` từ replay-f-fix-184t8.py sang check-fresh-184t8.py (helper live mà driver `run_one` gọi mỗi poll): quét log tìm dòng WATCHDOG-137 có ts ≤ ts dòng HB128 hiện tại; điều kiện kích hoạt thêm `or wd_before`; nhãn log FRESH-CONTENT ghi rõ `(f''-V2)` để phân biệt. Giữ nhánh V0/V1 trong code, chuyển bằng cờ để rollback được trong 1 đợt.
- **Đề xuất cho parent (T8 KHÔNG tự triển khai): NÂNG V2 LÀM PHƯƠNG ÁN CHÍNH từ đợt 185** (diag-only + 0 FP trên 16 log sạch + bắt 4/4 kẹt có HB128). Phương án dự phòng nếu parent muốn thận trọng hơn: chạy V2 1 đợt ở chế độ shadow (ghi log TRIGGER mà không gọi diag) rồi quyết — T8 khuyến nghị nâng thẳng vì rủi ro xấu nhất chỉ là diag thừa trong ngân sách.
# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 13 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173)

## D1–D2. Phạm vi + Q3: 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; script `baaa13c0`) + ca 178 W2-setup :443; 86n2-P1 theo dõi riêng — **KHÔNG ĐO ĐƯỢC đợt này (launch-fail — §2)**. Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 184: **không có dữ liệu mới (WebKit không chạy được)**; hồ sơ 4 điểm kẹt giữ nguyên. **Chuỗi 84l10 PASS: KHÔNG NỐI ĐƯỢC (4 đợt 179–181 + 183 — parent/T10 quyết).** Tần suất kẹt 84l10: 4 ca / 26 đợt ≈ 15% (không đổi — đợt này không phải ca kẹt, là launch-fail).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — không có ca mới đợt này.
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (launch-fail, không phải kẹt):** 84l10 WebKit KHÔNG ĐO ĐƯỢC trên #103 vì thiếu `libevent-2.1.so.7`, trong khi Chromium cùng pha PASS với cùng file h-30s — lib/decode đủ ở tầng app, thiếu ở tầng lib hệ thống WebKitGTK. Cùng mẫu đợt 182 (launch-fail do thiếu lib), khác đợt 183 (kẹt-183 là lỗi phát-lên, lib đủ).
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 184: không có dữ liệu mới (WebKit không chạy được).**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — không có ca mới đợt này (0 probe evaluate TIMEOUT; WebKit chết ở launch, chưa tới evaluate).
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 26 đợt). Kẹt-183 (85m4 P1) theo dõi riêng: nếu 85m4 P1 kẹt lại, ghi có phải cùng chữ ký "không phát lên lần nào" không.
# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 184 (0 KẸT MỚI — WebKit KHÔNG ĐO ĐƯỢC; KHÔNG MỞ ĐIỀU TRA)

## B1. Trạng thái giả thuyết sau đợt 184 (KHÔNG ĐỔI — không có ca kẹt mới để đối chiếu)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — không có ca kẹt nào đợt này; avail trong lúc harness 429–1.428 MB.
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH HƠN (đứng nguyên từ 183)** — không có bằng chứng mới đợt này (WebKit chết ở launch, chưa tới treo); Chromium cùng pha 3/3 PASS vẫn ủng hộ tính đặc thù WebKitGTK, nhưng lần này ở tầng launch (thiếu lib) chứ không phải treo.
- Đợt 184 T8 chỉ giám sát thụ động H3: **0 kẹt trong 3 lần chạy harness WebKit (KHÔNG ĐO ĐƯỢC — launch-fail) + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T0 PASS 3/3 trên #102 — theo cờ T0-184). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 KHÔNG ĐO ĐƯỢC (không phải kẹt lại).** H3 vẫn chỉ giám sát thụ động.
# §E — CHECKLIST (o) ĐỢT 184 (quyết (o) đợt 180 + các F-183 còn lại — 21/21)

- o1. F-183-T0-2 (gap #97→#98 576 s) — GHI NHẬN; gap #101→#102 = 6.878 s (T0-184); gap #102→#103 = 7.670 s (T2-184/T4-184; số hiệu #103 chờ T0-185).
- o2. Run 183 SUCCEEDED 08:13:58Z (+1.313 s; chuỗi 4 timeout DỪNG Ở 4 — T0-184/T2-184; claimed→finished 85 s — thuộc T7-184); run 184 kết cục thuộc T7-184.
- o3. F-182-T1-1 — ĐÃ SỬA XONG đợt 182; T1-184 verify PASS, chuỗi khớp lần 91 (parent 90 + T1-184).
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 429–1.428 MB trong harness (T8); balloon ghim trần 1 lần; số T9 thuộc T9-184.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; quyết (p) kiểm chứng live lần 4 ĐẠT; **F-184-T2-8 MỚI: hole-recheck T2 chồng attempt1 → B2 VI PHẠM** (T4-184).
- o6. F-181-T4-3 (X193) — X193 đã wipe theo #102 (đợt 183); X11 trống lúc đóng đợt này (0 socket — extract xác nhận).
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-183 chết theo #102; watcher-184 chết theo #103 (log cuối 09:15:04Z — T5-184 đã đóng cờ cho #102, không spawn watcher mới cho #103).
- o8. F-181-T5-2 (ledger ts) — GHI NHẬN (T5-184 đã đóng cờ).
- o9. F-180-T5-3 (lệch btime 11 s) — GHI NHẬN; /proc/1 #102 +10,92 s/+11,145 s (T0-184); #103 chờ T0-185 (journal first 09:15:07Z = btime +12 s).
- o10. F-174-T5-6 KHÔNG áp dụng — GHI NHẬN (#102 replay-đầy-đủ, poll=0, KHÔNG caveat; #103 CHƯA CÓ cờ — không watcher nào sống trên #103).
- o11. F-181-T6-1 (chồng pha) — GHI NHẬN; T6-184 ĐÃ ĐÓNG: (A) 120/120 lần 34; #102 KHÔNG GIẾT HOLDER (lock trống 170 s — T0-184); prune 59 (xem cờ T6-184); F-147-T6-1 đếm lại từ 0.
- o12. F-180-T6-4 (mâu thuẫn poll=0) — GHI NHẬN (T6-184 đã đóng cờ).
- o13. F-180-T6-5 (watcher chưa chạy lúc snapshot) — GHI NHẬN (T6-184 đã đóng cờ).
- o14. F-181-T7-1 (sleep bị SIGTERM) — GHI NHẬN; T7-184 chưa đóng cờ (run 184 kết cục + cửa slot — T7-184).
- o15. F-180-T7-4 (lỗi nhãn T0-176/T0-177) — GHI NHẬN (F-178-T7-4 ĐÃ LÀM RÕ).
- o16. F-180-T7-5 (tuổi run cộng thừa 600 s) — GHI NHẬN (T7-184 chưa đóng cờ).
- o17. F-183-T8-1..8 — ĐÃ THỰC HIỆN (§8; F-183-T8-7 sửa xong + kiểm live ĐẠT; F-183-T8-3 checklist copy driver đã áp dụng; F-183-T8-1 dọn smoke/ đã áp dụng).
- o18. Quyết (o) 183 (cửa slot LÀNH lần 9; HB 47/495, DR 53/320) — GHI NHẬN; số mới thuộc T7-184 (chưa đóng cờ).
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — ĐÃ THỰC HIỆN: marker 54 reboot (T0-184); T8 đóng ~10:47Z, TRONG hạn cờ ~11:00Z (dù reboot #103 + waiter hết hạn 10:30Z) và hạn cứng ~11:35Z.
- o20. Quyết (j) 183 (B1 chưa kiểm live đợt này; B2 HOÃN; F-178-T8-6 DỪNG; H3 giám sát; thiết kế V2 chuẩn bị xong) — ĐÃ THỰC HIỆN (§2, §C, §F, §B).
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T0-185/T9-184).
# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 184 — DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy; script diag đã đổi nhãn, không chạy). **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy** (hb128 là chuẩn). **Chi phí B1 không đổi:** 85m4-hb128 37.700 B (dưới giới hạn, dư 68 B); 86n2-hb128 41.785 B (oversize — cần ENABLE_PRIVSEP=0).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7 → 530e10a7; `media.ts` 2c384ed1 → 2c384ed1; `vite.config.ts` ee80d093 → ee80d093; `84l10` baaa13c0; `85m4-hb128` **2f707749 (B1, không đổi)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` c90e0853 (B1, không đổi)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). Tất cả không đổi so với đợt 183 — **T8 thêm 0 file repo đợt này ngoài LIMITS này + 2 script replay đã sửa (sửa đường dẫn entry 183-ket/183-sach — xem F-184-T8-1; script nằm trong hidden_files, không stage riêng — xem §9).**
- **T8 thêm 1 file repo đợt này: LIMITS này.** Copy `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round184-t8/`**.
- Extract (F-182-T8-6 — ĐÃ KIỂM LIVE đợt 183, dùng lại đợt này): trích ĐÚNG số harness (webkit exit=1 ×3, chromium exit=0 ×3) + O8 (chromium 21/21 md5 e3c91524, webkit n=2 ok=1 ×2) + sampler n=18 + WATCHDOG-137: 0 + probe TIMEOUT: False (không có — WebKit chết ở launch). Nhãn "ovsize LIMITS 183" đã sửa đúng (F-183-T8-5 — extract in 37.738 B).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** Cả hai symlink cập nhật → round184-t8 lúc ~08:45Z, TRƯỚC waiter → 0 dump stall mới đợt này (đúng — không có kẹt). Nợ đợt sau: checklist copy driver gồm CẢ HAI symlink (đã làm 6 đợt liên tiếp).
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP).** File `o8-s1-probe-184t8.mjs` có mặt sau `cp -r` 183→184 (md5 `453d1082` giống hệt 175–178; `node --check` PASS). O8 T8 chạy với probe này (probe exit=1 — launch-fail, không phải S1 FAIL thật).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round184-t8). **F-181-T8-5: ÁP DỤNG CHO #102** (replay-đầy-đủ, poll=0, KHÔNG caveat — khác #101 repair-sớm-quyết-h). **F-181-T8-6 (gst-inspect vắng): TÁI DIỄN TRÊN #103** (GST 0 — boot chưa heal; trên #102 sau heal: 1624 qua selfcheck). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 183 — tổng GIỮ 22. F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đã sửa 2 entry replay; các file stale khác vẫn nằm trong `smoke/archive-183/`).**

## 6. Dọn dẹp + kiểm cuối — sạch (trên #103 sau reboot)

- Driver harness (pid 16370) đã thoát sau pha cuối (10:40:05Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng — đúng luật). O8 driver đã nhả lock 10:41:52Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 101 cooldown lúc đóng — extract xác nhận).
- Kiểm cuối ~10:47Z (trên #103): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` TRỐNG (0 file — extract xác nhận).
- Fixture /tmp: **ĐÃ REBUILD ~10:02Z (md5 khớp đợt 125)** — vẫn còn lúc đóng (chưa có reboot mới sau đó).
- **Reboot #103 (boot `e0921bda`, btime 09:14:55Z):** xảy ra SAU khi T4 poller thoát (09:12:01Z) và TRƯỚC khi T8 chạy harness (10:31:15Z); **0 reboot trong cửa sổ đo (10:31–10:41Z).** dpkg.log giữ 2 dòng từ 09:15:33Z (mẫu chưa heal). Số hiệu #103 CHƯA XÁC MINH (thuộc T0-185); (m) #103 + INSIDE #103 thuộc T2-185. T7 chưa đóng cờ lúc T8 đóng; T9 đóng 10:47Z — thuộc T7-184/T9-184 + T10-184.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l`/`ls`.** Không chạy script nặng khi T4 gate0wait (rebuild fixture SAU khi T4 đóng cờ 09:33Z; harness SAU waiter hết hạn 10:30:51Z).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 3/6 — WebKit 0/3 KHÔNG ĐO ĐƯỢC (launch-fail libevent), KHÔNG PHẢI 3/6 FAIL.** Chromium 3/3 PASS. **Kẹt cộng dồn GIỮ 26 — 0 kẹt mới.**
2. **O8 T8 1/3 (Chromium 21/21 PASS, md5 e3c91524; WebKit ×2 KHÔNG ĐO ĐƯỢC, JSON n=2 ok=1).** O8 T0 PASS 3/3 trên #102 theo cờ T0-184 (T8 không kiểm lại JSON gốc).
3. **Chuỗi FULL PASS GIỮ 0 (đề xuất) — #102 đủ 3/5 chân, #103 cả hai chân T8 đều KHÔNG ĐO ĐƯỢC.** Không phải FAIL sản phẩm. **Parent/T10 quyết cuối.**
4. **POSTBOOT_PASS #102 CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat)** — gate (a) #102 ĐẠT KHÔNG caveat. **#103 CHƯA CÓ cờ** (không watcher nào sống trên #103; T5-184 đã đóng cờ cho #102).
5. **Balloon max 100% trần trong cửa sổ harness (n=18, avail min 429 MB, pinned=1)** — KHÔNG có sampler T9 trong LIMITS này (T9-184 chưa đóng cờ — giao T9 đối chiếu).
6. **85m4-hb128 37.700 B (dư 68 B) + 86n2-hb128 41.785 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 34.880 B, w2setup-hb128 36.113 B dưới giới hạn. **LIMITS này DƯỚI giới hạn push** (xem `wc -c` lúc stage).
7. **Chuỗi verdict: 84l10 PASS KHÔNG NỐI ĐƯỢC (4 đợt); 86n2-P1 không kẹt KHÔNG NỐI ĐƯỢC (7 lần); B1 live sạch GIỮ 2 — NHƯNG B1 chưa kiểm live đợt này.** H3 ỦNG HỘ MẠNH HƠN (đứng nguyên từ 183, §B). Điều tra 84l10 ĐỢT 13 (§D).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **T8 ĐÓNG ~10:47Z, TRONG hạn cờ ~11:00Z và hạn cứng ~11:35Z** (dù reboot #103 + waiter hết hạn 10:30Z). 1 reboot trong phiên T8 (#103, trước khi đo). 0 reboot trong phiên đo (10:31–10:41Z).
10. **#102 XÁC MINH 9 nguồn (T0-184); #103 CHƯA XÁC MINH (T0-185); marker 54 reboot;** (m) #102 +40,341 s (T2-184 CUỐI — parent 184 quyết cuối); INSIDE #102 TRUE (FULL148, chuỗi 3 → 4); (m) #56 lần 27 (T2-184).
11. **(1c') + (f') V1: replay C5.1 ĐẠT, 0 FP; đợt 184 đóng góp 0 log mới; THIẾT KẾ V2 ĐÃ CHUẨN BỊ XONG (§C4) — parent quyết ở đợt 184. B1 chưa kiểm live; B2 VẪN HOÃN.**
12. **T7 CHƯA ĐÓNG CỜ lúc T8 đóng; T9 đóng 10:47Z** — số T9 thuộc T9-184, T10 gộp sau. **T4 đóng 09:33Z với lượt yên #53 HỢP LỆ (có cờ `.done`).**

## 8. Sai số mới (F-184-T8-N) + nợ cũ đã xử lý

- **F-184-T8-1 — SCRIPT ĐỔI TÊN VIẾT ĐÈ ĐƯỜNG DẪN LOG LỊCH SỬ TRONG REPLAY (TỰ BẮT ĐƯỢC, ĐÃ SỬA):** token `round183-t8` → `round184-t8` đã viết đè cả 2 entry lịch sử trong LOGS của replay-1c/replay-f-fix (`183-ket-85m4`/`183-sach-86n2-hb128` trỏ nhầm sang `round184-t8/smoke/` chưa có file). Baseline replay báo NO-FILE cho cả hai — đúng ra phải có file (kẹt-183: 177 dòng HB128 + 3 WATCHDOG-137). Đã sửa 2 entry về `round183-t8/smoke/` trong cả hai script + chạy lại baseline sạch (V2 TRIGGER @125 s cho kẹt-183). Bài học: khối LOGS trong replay là đường dẫn lịch sử — lần đổi tên sau phải loại trừ khối LOGS khỏi thay token (hoặc kiểm tra baseline NO-FILE trước khi chạy chính thức).
- **F-184-T8-2 — REBOOT #103 GIỮA PHIÊN (boot `e0921bda`, btime 09:14:55Z).** Sau T4 poller thoát (09:12:01Z), trước harness; giết waiter-1 + watcher-184; journal chỉ còn boot mới (idx 0, first 09:15:07Z = btime +12 s); dpkg.log về 2 dòng; fixture /tmp mất lại (đã rebuild ~10:02Z). Số hiệu #103 CHỜ T0-185; (m) #103 + INSIDE #103 thuộc T2-185. 0 reboot trong cửa sổ đo.
- **F-184-T8-3 — CHECKLIST COPY DRIVER (F-183-T8-3 ĐÃ ÁP DỤNG, KHÔNG TÁI DIỄN):** T8 chỉ chạy `run-webkit-184t8.sh` (cả 6 pha), KHÔNG chạy thêm `run-chromium-*` riêng. Ghi vào checklist copy driver đợt 185.
- **F-184-T8-4 — THIẾT KẾ V2 (f'') ĐÃ CHUẨN BỊ XONG:** xem §C4 — V2 bắt 4/4 kẹt có HB128 (164/171/178/183, đều @125 s), 0 FP trên 16 log sạch; đề xuất parent NÂNG V2 LÀM PHƯƠNG ÁN CHÍNH từ đợt 185 (hoặc chạy shadow 1 đợt). KHÔNG tự triển khai đợt này.
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG ĐỢT NÀY (ĐÓNG Ở MỨC T8).** Dọn `smoke/` khỏi bản copy (51 entry → `smoke/archive-183/` + README-184); replay baseline chạy sạch, không parse log stale. Các file stale khác vẫn nằm trong `smoke/archive-183/` (bằng chứng, không dùng).
- **F-183-T8-7 — SELFCHECK LIBEVENT DƯƠNG TÍNH GIẢ: ĐÃ SỬA + KIỂM LIVE ĐẠT (ĐÓNG).** Selfcheck kiểm đúng tên file `libevent-2.1.so.7`: trên #102 CO (đúng — MiniBrowser chạy được), trên #103 THIEU (đúng — MiniBrowser launch-fail đúng lỗi này).
- **F-183-T8-3 — CHẠY THỪA DRIVER: ĐÃ KHÉP ĐỢT 183, KHÔNG TÁI DIỄN (xem F-184-T8-3). F-183-T8-5 — NHÃN "ovsize LIMITS 181": ĐÃ SỬA (extract nay in "ovsize LIMITS 183: 37738" — ĐÓNG). F-183-T8-8 — NHÃN SAI TRONG REPLAY-1c: ĐÃ SỬA ĐỢT 183, KHÔNG TÁI DIỄN. F-183-T8-2 — SOCKET X193 STALE: ĐÃ WIPE THEO #102 (đợt 183); X11 trống lúc đóng đợt này. F-183-T8-4 — (c') BỎ LỠ kẹt-183: THIẾT KẾ V2 ĐÃ CHUẨN BỊ (§C4 — chờ parent quyết). F-183-T8-6 — REBOOT #102: ĐÃ GHI NHẬN ĐỢT 183; số hiệu #102 XÁC NHẬN đợt này (T0-184).**
- **F-182-T8-6 — EXTRACT KIỂM LIVE: ĐÃ ĐẠT ĐỢT 183, DÙNG LẠI ĐỢT NÀY (xem §5). F-181-T8-3: ĐÃ SỬA Ở 182, ĐÃ KIỂM LIVE Ở 183 — ĐÓNG. F-181-T8-1: ĐÃ HẾT (181). F-181-T8-2: ĐÃ SỬA Ở 181, KHÔNG TÁI DIỄN. F-181-T8-4: ĐÃ SỬA Ở 181, KHÔNG TÁI DIỄN** (pilot trỏ đúng round184-t8). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 183 — tổng GIỮ 22. F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đã sửa).**

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS GIỮ 0 (đề xuất) — parent/T10 quyết** (đợt 184: #102 đủ 3/5 chân, #103 cả hai chân T8 đều KHÔNG ĐO ĐƯỢC — launch-fail, không phải FAIL sản phẩm; mốc 0 theo quyết (b) đợt 183).
2. **NÂNG V2 (f'') LÀM PHƯƠNG ÁN CHÍNH?** (F-184-T8-4: thiết kế đã chuẩn bị xong §C4; V2 bắt 4/4 kẹt có HB128, 0 FP — parent quyết ở đợt 184; nếu duyệt, T8-185 port sang check-fresh.)
3. **Chuỗi 84l10 PASS 4 đợt + chuỗi 86n2-P1 không kẹt 7 lần: ĐỨT hay GIỮ?** (đợt này WebKit KHÔNG ĐO ĐƯỢC — parent/T10 quyết; tiền lệ đợt 182 chưa bao quát chuỗi riêng này.)
4. **Reboot #103 (e0921bda, btime 09:14:55Z) — số hiệu chờ T0-185 xác minh 9 nguồn; (m) #103 + INSIDE #103 thuộc T2-185; POSTBOOT_PASS #103 CHƯA CÓ** (không watcher nào sống trên #103 — T5-184 đã đóng cờ cho #102; T5-185 lo watcher cho boot #104 hoặc repair #103 nếu còn kịp — parent quyết).
5. **Replay đình trệ 3 boot liên tiếp (#100 một phần, #101/#103 toàn phần)** — nếu T0/T7/T9 tìm ra thì ghi GAP, không thì nợ host-side (quyết (k) đợt 174).
6. **B2 VẪN HOÃN (đề xuất)** — B1 chưa kiểm live đợt này (WebKit launch-fail); B1 live sạch GIỮ 2.
7. **F-184-T2-8 (hole-recheck T2 chồng attempt1 — B2 VI PHẠM, attempt1 bị hủy)** — chuỗi 0 vi phạm GIỮ 0 (đã VỀ 0 đợt 183); parent quyết cuối.
8. **T7-184 chưa đóng cờ lúc T8 đóng; T9 đóng 10:47Z** (run 184 kết cục + cửa slot + HB/DR + headroom/ENOSPC/E-220 kết cục — thuộc T7-184/T9-184 + T10-184).
9. Mở từ trước, vẫn đứng: **#102 KHÔNG GIẾT HOLDER (lock trống 170 s — T0-184); (A) 120/120 lần 34 (T6-184); (m) #102 DƯƠNG (CUỐI cấp T2) + INSIDE #102 TRUE (FULL148, chuỗi 3 → 4) — parent 184 quyết cuối; n ứng viên đề xuất 44/45 → 45/46, n chính thức GIỮ 14; mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck lần 28, NEW=0); (m) #56 lần 27; run 183 SUCCEEDED 08:13:58Z (margin +1.313 s; claimed→finished 85 s — T7-184 phán); G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần 38 (T9-184); R9 (a) lần 21; file oversize 6,4 MB chưa quyết; prune lần 59 (T6-184); KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức; fixture /tmp đã rebuild đợt này — còn lúc đóng; KHÔNG PUSH — 180 batch / 265 entry / 244 đường dẫn / 240 file chờ user push (đợt 166–183) + batch đợt 184 (T10-184 đếm cuối).**
