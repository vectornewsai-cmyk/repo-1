# Đợt 185 T8 — HARNESS 6/6: WebKit HEAL TRÊN #104; O8 T8 3/3; FULL PASS 5/5 CHÂN CÙNG BOOT (ĐỀ XUẤT CHUỖI 0 → 1); V2 (f'') ĐÃ TRIỂN KHAI LÀM PHƯƠNG ÁN CHÍNH

Ngày: 24/11/2026 (lượt cron 18:35 +07 = 11:35:51Z; T8 mở ~11:40Z, đóng 12:28Z — TRONG hạn cờ ~14:00Z và hạn cứng ~14:35Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) triển khai V2 (f'') làm phương án chính — port sang check-fresh (quyết (j) đợt 184); (2) harness hb128 + B1 live trên boot hiện tại; (3) O8 T8; (4) (c')/(f') V1 đối chứng + replay; (5) H3 thụ động; (6) F-184-T8-1 + F-183-T8-7. KHÔNG chạy diag W2-setup (DỪNG, quyết (j) đợt 180). **Nguồn:** LIMITS T8-184 + aggregate 184 §8/§12.3 (bản parent đã đính chính: §12.3 ĐÃ ĐIỀN SẴN lần thứ 17, parent kiểm đếm KHỚP lần 93 và CHẤP NHẬN, chỉ sửa tiêu đề + (q)).

## 0. Kết luận ngắn — 6/6; WebKit HEAL; O8 T8 3/3; FULL PASS ĐỀ XUẤT 0 → 1; V2 LIVE 0 KÍCH HOẠT, REPLAY 4/4 @125 s

- **#104 XÁC NHẬN 9 nguồn (T0-185, theo cờ T4-185)** — boot `9161bfd1`, btime **11:13:42Z**, gap #103→#104 = **7.127 s**. **POSTBOOT_PASS #104 CÓ 11:42:15Z (T5-185: replay-đầy-đủ, poll=0, KHÔNG caveat — dpkg 1468, cache 170, lists 39). Gate (a) #104: CÓ (KHÔNG caveat).** **#103 KHÔNG CÓ cờ** (theo cờ T4-185 — tổng boot không cờ 22 → 23 nếu parent chấp nhận). Marker sống qua **56 reboot** (#49–#104, +2 so với 54 đợt 184 — mtime `~/.config/vcut-persistence-marker` 2026-11-20 11:39:47.272154981Z KHÔNG ĐỔI, T8 kiểm trực tiếp lúc đóng).
- **Lượt yên #54 CÓ LƯỢT HỢP LỆ (T4-185, đóng cờ 12:01Z)** — attempt1-9161bfd1 20/20 + B 5/5 + tickCost median 45,0 ms; **chuỗi lượt yên 46 → 47** (ngân sách 1/3; cửa mở poll #15 11:52:20Z; poller thoát 11:56:12Z). Quyết (p) kiểm chứng live lần 5: ĐẠT. 0 vi phạm phía T4.
- **WebKit launch-fail ĐÃ HEAL trên #104** — selfcheck #1 (11:42:25Z) + #2 (12:24:08Z): libs **6/6 CÓ** (kể cả `libevent-2.1.so.7` — F-183-T8-7 kiểm lại ĐẠT), GST 1624, dpkg 1468. MiniBrowser chạy được cả 3 pha WebKit (không còn exitCode 127).
- **HARNESS 6/6 trên #104 (12:03:46–12:18:56Z): WebKit 3/3 PASS** (84l10 W2+E4, 85m4 P1+P5, 86n2-hb128 P1+P5+P6 — KHÔNG FAIL cả 3) **+ Chromium 3/3 PASS** (cùng 3 pha, KHÔNG FAIL). **Kẹt cộng dồn GIỮ 26 — 0 kẹt mới.** live_diags=0 cả 6 pha; WATCHDOG-137 = 0; FRESH-CONTENT-185 (V2) = 0 kích hoạt live.
- **O8 T8 3/3 trên #104** (12:20:27–12:22:57Z): WebKit ×2 **21/21 PASS** (md5 `0fec17e7`/`b4acaadf`) + **Chromium 21/21 PASS (md5 `eeaf999b`)** — JSON đếm lại bằng python. **O8 T0 PASS 3/3 trên #104** (theo cờ T4-185).
- **FULL PASS: 5/5 CHÂN CÙNG BOOT #104** (lượt yên #54 ✓, gate (a) #104 ✓ KHÔNG caveat, O8 T0 ✓ 3/3, O8 T8 ✓ 3/3, harness ✓ 6/6) — **chuỗi 0 → 1 (ĐỀ XUẤT, parent quyết)**. Lần đầu có full pass kể từ khi chuỗi VỀ 0 (đợt 181 lên 1 rồi ĐỨT đợt 182 — xem §9).
- **V2 (f'') ĐÃ TRIỂN KHAI LÀM PHƯƠNG ÁN CHÍNH (§C)** — port sang check-fresh-185t8.py đúng thiết kế §C4 LIMITS T8-184; kiểm chứng trên log đóng băng: 164/171/178/183 đều TRIGGER @125 s (183 via=wd — ca V1 lỡ), 0 FP trên log sạch. Replay: **V2 bắt 4/4 kẹt có HB128 @125 s, 0 FP trên 18 log sạch duy nhất** (16 cũ + 2 log sạch mới đợt 185); **V1-300 đối chứng: 3/4** (164@125 s, 171@305 s, 178@125 s qua nhánh (f) thường; lỡ 183) — **ghi cả hai số**. ĐÍNH CHÍNH §C4 đợt 184 (xem F-185-T8-2): V1-300 bắt 3/4 chứ không phải 2/4 — 178 bắt được qua nhánh (f) thường, bản 184 bỏ sót khi đếm.
- **Plan B B1: KIỂM LIVE ĐƯỢC — SẠCH LẦN THỨ BA (181 + 183 + 185)** — 86n2-hb128 WebKit PASS live, 21 dòng HB128, 0 dòng bất thường, P1/P5/P6 đều PASS. **B2: đủ mốc 3 đợt live sạch theo đề xuất đợt 183 — parent quyết có mở B2 không (T8 KHÔNG tự mở).**
- **F-184-T8-1: KHÔNG TÁI DIỄN** — khối LOGS trong cả hai script replay byte-identical với đợt 184 (đã kiểm bằng diff python) + 0 NO-FILE trong cả hai lần chạy replay; 2 entry mới `185-sach-*` chỉ THÊM vào, không viết đè đường dẫn lịch sử. **F-183-T8-7: KIỂM LẠI ĐẠT** — selfcheck đúng `libevent-2.1.so.7` trên #104 CÓ (đúng — MiniBrowser chạy được), khác #103 THIẾU (đúng — launch-fail).
- **Waiter: GATE-FOUND poll=20 12:01:39Z** (t4=OK, postboot đường (a) POSTBOOT_PASS #104; t4attempt=no-lock — không cần WAIT-DEADLINE).

## 1. Dòng thời gian (gọn)

- 11:13:42Z **REBOOT #104** (T0-185 XÁC NHẬN 9 nguồn — theo cờ T4-185; gap #103→#104 = 7.127 s). 11:35:51Z Đợt 185 mở. 11:40–11:42Z T8 mở: đọc LIMITS T8-184 + aggregate 184 §12.3 (bản parent đã đính chính); md5 cây khớp 184; copy driver 184→185 + đổi nhãn (waiter → 13:30Z, LIVE-DIAG/FRESH-CONTENT → 185, T8-185); **dọn `smoke/` khỏi bản copy (F-183-T8-1 — 184 smoke → `smoke/archive-184/`, scratch + o8-webkit/o8-chromium dọn sạch để extract không đọc log cũ)**; **cả hai symlink diag → round185-t8 lúc ~11:41Z**; probe S1 CÓ SẴN (md5 `453d1082` — khớp 175–184); selfcheck #1 trên #104: libs 6/6 CÓ, GST 1624, dpkg 1468; fixture /tmp VẮNG (wipe theo #104 — chờ gate); mở: 0 process sót, X11 chỉ X193 (mồ côi của T4 — xem §6), lock trống.
- 11:42:15Z **POSTBOOT_PASS #104 CÓ** (replay-đầy-đủ, poll=0, KHÔNG caveat). 11:42:35Z Waiter bắt đầu (deadline 13:30Z). 11:52:20Z Cửa yên mở poll #15 (T4) → attempt1; 11:56:12Z poller T4 thoát exit 0. **12:01Z T4 ĐÓNG CỜ** (#54 hợp lệ, chuỗi 46→47). **12:01:39Z GATE-FOUND poll=20** (t4=OK + postboot đường (a)).
- 12:03Z **rebuild fixture: exit 0, md5 khớp đợt 125** (ba0c7c62/f05daed8/fbaa3d1a/a1fb8549) — chạy SAU khi T4 đóng cờ (không còn cửa sổ attempt).
- **12:03:46–12:18:56Z HARNESS 6/6** (driver pid 121505, boot #104). **12:20:27–12:22:57Z O8 T8 3/3.** 12:23–12:28Z replay + extract + LIMITS + paths + cờ. **0 reboot trong phiên T8** (mở → đóng cùng boot 9161bfd1).

## A. O8 — T8 3/3 TRÊN #104; T0 3/3 TRÊN #104 (CÙNG BOOT)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #104 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `0fec17e7`, S1 PASS 12:20:27Z |
| 2 | O8 T8 WebKit attempt2 trên #104 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `b4acaadf`, S1 PASS 12:21:19Z |
| 3 | O8 T8 Chromium trên #104 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `eeaf999b`, S1 PASS 12:22:07Z |
| 4 | O8 T0 WebKit attempt1 trên #104 | **21/21 PASS** (theo cờ T4-185) |
| 5 | O8 T0 WebKit attempt2 trên #104 | **21/21 PASS** (theo cờ T4-185) |
| 6 | O8 T0 Chromium trên #104 | **21/21 PASS** (theo cờ T4-185) |

- O8 T8 chạy 12:20:27–12:22:57Z trên #104 (SAU POSTBOOT_PASS #104 38'; driver chạy sau GATE-FOUND, không chờ WAIT-DEADLINE). O8 log: S1 PASS 6, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0 (theo extract-185t8).
- **Gate cho boot đo `9161bfd1` (#104): (a) CÓ — POSTBOOT_PASS #104 (replay-đầy-đủ, poll=0, KHÔNG caveat).** O8 T0 + lượt yên #54 + gate (a) + O8 T8 + harness CÙNG boot #104. **Chuỗi FULL PASS 0 → 1 (đề xuất, parent/T10 quyết).**

## 2. Kết quả harness — 6/6; WebKit 3/3 PASS (HEAL); Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 12:03:46–12:04:56 | **PASS** — W2 PASS + E4 PASS, KHÔNG FAIL, live_diags=0 |
| 2 | WebKit 85m4 | 0 | 12:05:11–12:07:22 | **PASS** — P1 PASS + P5 PASS, KHÔNG FAIL, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 12:07:37–12:11:28 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, KHÔNG FAIL, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 12:11:44–12:12:44 | **PASS** — W2 PASS + E4 PASS, KHÔNG FAIL, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 12:12:59–12:15:00 | **PASS** — P1 PASS + P5 PASS, KHÔNG FAIL, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 12:15:15–12:18:56 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, KHÔNG FAIL, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 26 — 0 kẹt mới.** **84l10 WebKit PASS đợt này** (lần PASS thứ 5 trong 7 đợt gần nhất: 179, 180, 181, 183, 185; 182 + 184 KHÔNG ĐO ĐƯỢC — launch-fail; chuỗi 4 đợt 179–181 + 183 có nối qua 2 đợt không đo được hay không — parent/T10 quyết, xem §9). **86n2-P1 không kẹt: lần thứ 8 nếu tính tiếp** (chuỗi 7 tới đợt 183; 184 KHÔNG ĐO ĐƯỢC; đợt này P1 PASS — parent/T10 quyết).
- **Đối chứng Chromium cùng pha: 3/3 PASS** — cùng kết quả WebKit; không có chênh lệch engine đợt này (ủng hộ H3 theo hướng: khi lib hệ thống đủ, cả hai engine đều chạy sạch).
- **B1 live: SẠCH LẦN THỨ BA (181 + 183 + 185)** — 86n2-hb128 WebKit PASS live (resetPlayhead0 bọc hbStart/hbStop, 21 dòng HB128, 0 dòng bất thường, P1/P5/P6 PASS); B1 chưa bắt kẹt thật. **B2: đủ mốc 3 đợt live sạch theo đề xuất đợt 183 — parent quyết có mở B2 không; T8 KHÔNG tự mở.**
- RAM sampler (ram-185t8.log, n=31): balloon min 3.256.324 / max 5.278.732 kB (**81,9% trần, pinned=0**), avail min 836 MB / max 3.083 MB — KHÔNG ghim trần lần nào trong cửa sổ harness (khác đợt 184: ghim 1 lần lúc mở).

## 3. Watchdog + 4 bước kiểm — 0 WATCHDOG-137; 0 LIVE-DIAG; V2 0 kích hoạt live

- **Watchdog (i): 0 dòng** (cả 6 pha — không có evaluate im lặng >60 s). Live-diag (1b): **0** (log chảy đều, không im lặng >120 s). **V2 (f''): 0 kích hoạt live** (check-fresh-185t8.py trên log 185 mới: 84l10 OK maxspan=0s wd=0; 85m4 OK maxspan=5s wd=0; 86n2 OK maxspan=5s wd=0 — đúng thiết kế: không có run đóng băng nào).
- **(1)** Watchdog trong 3 script (VÁ 142, GIỮ NGUYÊN 143–185) + `t8-diag-stall.sh` → 185. **(1b)** live_diags=0 cả 6 pha. **(1c')/(f'') V2: 0 kích hoạt live; replay §C.**
- **(2)** Balloon sampler: n=31 (xem §2); avail thấp nhất 836 MB (12:18:43Z).
- **(3)** Đối chứng Chromium cùng pha: 3/3 PASS (xem §2). **(4)** dmesg + journalctl -k sau mỗi lần kẹt: **0 lần kẹt → 0 snapshot mới** (dmesg không đọc được — journalctl-k trống, như mọi đợt).
- **0 snapshot stall mới.** 0 thư mục stall mới trong smoke/ (extract: `stall dirs: []`). Cả hai symlink diag cập nhật → round185-t8 lúc ~11:41Z, TRƯỚC waiter (F-178-T8-8 — checklist copy driver gồm cả hai symlink, 7 đợt liên tiếp).

# §C — V2 (f'') ĐÃ TRIỂN KHAI LÀM PHƯƠNG ÁN CHÍNH (QUYẾT (j) ĐỢT 184) + REPLAY V1/V2

## C1. Triển khai V2 (port sang check-fresh — đúng thiết kế §C4 LIMITS T8-184)

- **Thay đổi duy nhất:** `check-fresh-185t8.py` (viết lại từ `check-fresh-184t8.py`): parse thêm timestamp các dòng WATCHDOG-137 trong cùng file log; điều kiện kích hoạt thêm `or wd_before` (bất kỳ dòng WATCHDOG-137 nào có ts ≤ ts dòng HB128 hiện tại, so sánh chuỗi ISO Z). Giữ nguyên: ngưỡng span ≥ 120 s, run_len ≥ 3, (e) trên dòng mới nhất, ngân sách (≤2 diag/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. Nhánh (f') V1 (span_seek ≥300 s) KHÔNG còn trong live — chỉ còn trong replay-f-fix làm đối chứng. Nhãn log FRESH-CONTENT nay ghi `(f''-V2)` + `via=f|wd` để phân biệt nhánh kích hoạt.
- **Kiểm chứng port trên log đóng băng (trước khi chạy live):** kẹt-183 TRIGGER @125 s via=wd (V1 lỡ); kẹt-171 TRIGGER @125 s via=wd (V1 @305 s); kẹt-164 TRIGGER @125 s via=f; kẹt-178 TRIGGER @125 s via=f; sạch-182-85m4 OK maxspan=5s wd=0; sạch-183-86n2 OK maxspan=5s wd=0; kẹt-179 OK maxspan=0s wd=3 (0 dòng HB128 — mọi phương án đều lỡ, đúng kỳ vọng). Syntax check PASS.
- **Live đợt này: 0 kích hoạt** (xem §3 — không có run đóng băng nào; wd=0 cả 3 pha WebKit có HB128). V2 chưa bắt kẹt thật live (chưa có kẹt thật đợt này để bắt) — bằng chứng live đầu tiên sẽ là ca kẹt tới (nếu có) hoặc tiếp tục 0 kích hoạt trên lượt sạch.
- **Rollback:** nhánh V1 còn trong replay-f-fix-185t8.py; check-fresh-184t8.py còn trong `smoke/archive-184/` (bản copy 184) — khôi phục V1 trong 1 đợt bằng cách đổi tên file check-fresh trong driver.

## C2. Thiết kế (nhắc lại, không đổi)

**(c'):** trailing run HB128 cùng tag + playhead + ct, kích hoạt khi span ≥ 120 s VÀ chuỗi ≥3 dòng VÀ (e)/(f) trên dòng mới nhất. **(f') V1:** miễn (f) khi `paused+seeking=true` ≥300 s — NAY CHỈ ĐỐI CHỨNG TRONG REPLAY. **(f'') V2 (CHÍNH TỪ ĐỢT 185):** miễn (f) khi watchdog (i) ĐÃ kích hoạt cho cùng pha trước thời điểm dòng HB128 hiện tại. Ngân sách chung với (1b) ≤2 lần/lần chạy, ≥240 s; diag-only; phạm vi 85m4 + 84l10 W2/E4 (Q3) + 86n2-hb128 + resetPlayhead0 (B1). **B1 live sạch lần 3 (181 + 183 + 185). B2: parent quyết có mở không (đủ mốc 3 đợt).**

## C3. Replay sau O8 (replay-1c-185t8.py + replay-f-fix-185t8.py — đã thêm 2 entry `185-sach-*`)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 18 log sạch duy nhất** (16 cũ + 185-sach-85m4 19 dòng HB128 + 185-sach-86n2-hb128 21 dòng — cả hai KHÔNG kích hoạt ở mọi phương án; max run span 5 s, biên 24× so với ngưỡng 120 s). Đợt 185 đóng góp 2 log sạch mới (khác đợt 184: 0 log mới vì launch-fail).
- **Kẹt theo từng phương án (xác nhận lại đợt này, sau khi sửa F-184-T8-1): (c') V0: 164@125 s, 178@125 s; lỡ 171, 183. (f') V1-300: 164@125 s, 171@305 s, 178@125 s; lỡ 183. (f'') V2: 164/171/178/183 đều @125 s. (f''') V3: 164@125 s, 171@305 s, 178@125 s; lỡ 183. Kẹt-179 lỡ ở mọi phương án (0 dòng HB128 — lỗ hổng phủ sóng, không phải lỗ hổng điều kiện).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (164@125 s, 171@125 s, FP 0); **V1-300 ĐẠT** (164@125 s, 171@305 s, FP 0) — nhưng V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 4/4 @125 s, V1-300 3/4 (164@125, 171@305, 178@125), 0 FP cả hai trên 18 log sạch.**
- **F-184-T8-1: KHÔNG TÁI DIỄN (đã kiểm):** khối LOGS trong cả hai script replay byte-identical với đợt 184 (diff python trên khối LOGS — giống hệt); 0 NO-FILE trong cả hai lần chạy replay; 2 entry mới `185-sach-*` chỉ THÊM vào cuối LOGS, trỏ đúng `round185-t8/smoke/`. Bài học đợt 184 đã thành quy trình: đổi tên loại trừ khối LOGS, kiểm baseline NO-FILE trước khi chạy chính thức.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 14 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173)

## D1–D2. Phạm vi + Q3: 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; script `baaa13c0`) + ca 178 W2-setup :443; 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 PASS (W2+E4), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 185: **không có dữ liệu mới về kẹt** (không kẹt nào để đối chiếu); hồ sơ 4 điểm kẹt giữ nguyên. **Chuỗi 84l10 PASS: 4 đợt (179–181 + 183) + PASS đợt 185 — có nối qua 2 đợt KHÔNG ĐO ĐƯỢC (182, 184) hay không — parent/T10 quyết.** Tần suất kẹt 84l10: 4 ca / 27 đợt ≈ 15% (không đổi — đợt này không phải ca kẹt, là PASS).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — không có ca mới đợt này.
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (heal, không phải kẹt):** 84l10 WebKit PASS trên #104 khi `libevent-2.1.so.7` CÓ (libs 6/6, GST 1624), trong khi cùng pha launch-fail trên #103 khi lib THIẾU — củng cố hướng "lib hệ thống quyết định WebKit có chạy được hay không", khác với kẹt-183 (lib đủ mà vẫn kẹt phát-lên).
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 185: không có dữ liệu mới (không kẹt).**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — không có ca mới đợt này (0 probe evaluate TIMEOUT; 0 WATCHDOG-137).
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 27 đợt). Kẹt-183 (85m4 P1) theo dõi riêng: nếu 85m4 P1 kẹt lại, ghi có phải cùng chữ ký "không phát lên lần nào" không — đợt này 85m4 P1 PASS (không restart dư).
# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 185 (0 KẸT MỚI — WebKit + Chromium ĐỀU PASS; KHÔNG MỞ ĐIỀU TRA)

## B1. Trạng thái giả thuyết sau đợt 185 (KHÔNG ĐỔI — không có ca kẹt mới để đối chiếu)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — không có ca kẹt nào đợt này; avail trong lúc harness 836–3.083 MB, balloon max 81,9% trần (không ghim 100%).
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH HƠN (đứng nguyên từ 183)** — không có bằng chứng mới đợt này (0 kẹt cả hai engine); WebKit heal khi lib đủ cho thấy tầng lib hệ thống vẫn là biến quyết định WebKit chạy/không-chạy, khác với treo-kẹt.
- Đợt 185 T8 chỉ giám sát thụ động H3: **0 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T0 PASS 3/3 trên #104 — theo cờ T4-185). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS (không kẹt), lần thứ 8 nếu tính tiếp (parent quyết).** H3 vẫn chỉ giám sát thụ động.
# §E — CHECKLIST (o) ĐỢT 185 (quyết (o) đợt 180 + các F-184 còn lại — 21/21)

- o1. F-183-T0-2 (gap #97→#98 576 s) — GHI NHẬN; gap #102→#103 = 7.670 s (T2-184/T4-184); gap #103→#104 = 7.127 s (T4-185; số hiệu #104 XÁC NHẬN — theo cờ T4-185).
- o2. Run 183 SUCCEEDED 08:13:58Z (+1.313 s; claimed→finished 85 s — T7-184); run 184 kết cục thuộc T7-185 (hạn 11:35:51Z — T7-185 phán).
- o3. F-182-T1-1 — ĐÃ SỬA XONG đợt 182; T1-184 verify PASS, chuỗi khớp lần 91 (parent 90 + T1-184); T1-185 verify đợt 184 (chưa đóng cờ lúc T8 đóng).
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 836–3.083 MB trong harness (T8); balloon max 81,9% trần, pinned=0; số T9 thuộc T9-185.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; quyết (p) kiểm chứng live lần 5 ĐẠT (T4-185); **0 vi phạm phía T4 đợt này; chuỗi 0 vi phạm GIỮ 0 (parent quyết cuối)**.
- o6. F-181-T4-3 (X193) — X193 mồ côi vẫn còn lúc đóng (socket của T4 — T4-185 ghi nhận; X199 của T8 đã unlink đúng luật; X11 chỉ còn X193).
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-184 chết theo #103; watcher-185 sống trên #104 (T5-185 đã ghi POSTBOOT_PASS #104 11:42:15Z).
- o8. F-181-T5-2 (ledger ts) — GHI NHẬN (T5-185 đã đóng cờ — theo cờ T4-185 trích POSTBOOT_PASS #104; T5-185 LIMITS thuộc T5).
- o9. F-180-T5-3 (lệch btime 11 s) — GHI NHẬN; /proc/1 #104 chờ T0-185 (T4-185: btime 11:13:42Z; journal first chờ T0).
- o10. F-174-T5-6 KHÔNG áp dụng — GHI NHẬN (#104 replay-đầy-đủ, poll=0, KHÔNG caveat; #103 KHÔNG CÓ cờ — tổng boot không cờ 22 → 23 nếu parent chấp nhận).
- o11. F-181-T6-1 (chồng pha) — GHI NHẬN; T6-185 ĐANG CHẠY (chưa đóng cờ lúc T8 đóng — (A) + prune lần 60 thuộc T6-185).
- o12. F-180-T6-4 (mâu thuẫn poll=0) — GHI NHẬN (T6-185 chưa đóng cờ).
- o13. F-180-T6-5 (watcher chưa chạy lúc snapshot) — GHI NHẬN (T6-185 chưa đóng cờ).
- o14. F-181-T7-1 (sleep bị SIGTERM) — GHI NHẬN; T7-185 chưa đóng cờ (run 184 kết cục + cửa slot — T7-185).
- o15. F-180-T7-4 (lỗi nhãn T0-176/T0-177) — GHI NHẬN (F-178-T7-4 ĐÃ LÀM RÕ).
- o16. F-180-T7-5 (tuổi run cộng thừa 600 s) — GHI NHẬN (T7-185 chưa đóng cờ).
- o17. F-184-T8-1..2 — ĐÃ THỰC HIỆN (§C3, §8; F-184-T8-1 KHÔNG tái diễn; F-184-T8-2 #103 giữa phiên — số hiệu #103 chờ T0-185, (m) #103 + INSIDE #103 thuộc T2-185).
- o18. Quyết (o) 184 (cửa slot LÀNH lần 10; HB 47/501, DR 53/323) — GHI NHẬN; số mới thuộc T7-185 (chưa đóng cờ).
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — ĐÃ THỰC HIỆN: marker 56 reboot (T0-185 XÁC NHẬN #104 — theo cờ T4-185); T8 đóng 12:28Z, TRONG hạn cờ ~14:00Z (dù chờ T4 tới 12:01Z) và hạn cứng ~14:35Z.
- o20. Quyết (j) 184 (NÂNG V2 làm phương án chính từ đợt 185; B1 chưa kiểm live đợt 184 — sạch GIỮ 2; B2 HOÃN; F-178-T8-6 DỪNG; H3 giám sát; thiết kế V2 chuẩn bị xong) — ĐÃ THỰC HIỆN (§2, §C, §F, §B) — V2 ĐÃ TRIỂN KHAI; B1 kiểm live được đợt này (sạch lần 3); B2 chờ parent quyết (đủ mốc 3).
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T0-185/T9-185).
# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 185 — DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy; script diag đã đổi nhãn, không chạy). **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy** (hb128 là chuẩn). **Chi phí B1 không đổi:** 85m4-hb128 37.700 B (dưới giới hạn, dư 68 B); 86n2-hb128 41.785 B (oversize — cần ENABLE_PRIVSEP=0).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7 → 530e10a7; `media.ts` 2c384ed1 → 2c384ed1; `vite.config.ts` ee80d093 → ee80d093; `84l10` baaa13c0; `85m4-hb128` **2f707749 (B1, không đổi)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` c90e0853 (B1, không đổi)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). Tất cả không đổi so với đợt 184 — **T8 thêm 0 file repo đợt này ngoài LIMITS này + 2 script replay đã sửa (thêm 2 entry 185-sach — xem §C3; script nằm trong hidden_files, không stage riêng — xem §9).**
- **T8 thêm 1 file repo đợt này: LIMITS này.** Copy `cp -r` (exit 0). **Working dir `repo-1/hidden_files/round185-t8/`**.
- Extract (F-182-T8-6 — ĐÃ KIỂM LIVE đợt 183, dùng lại đợt này): trích ĐÚNG số harness (webkit exit=0 ×3, chromium exit=0 ×3) + O8 (webkit 21/21 md5 0fec17e7/b4acaadf, chromium 21/21 md5 eeaf999b) + sampler n=31 + WATCHDOG-137: 0 + probe TIMEOUT: False. Nhãn "ovsize LIMITS 184" đã cập nhật đúng (F-183-T8-5 — extract in 37.708 B).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** Cả hai symlink cập nhật → round185-t8 lúc ~11:41Z, TRƯỚC waiter → 0 dump stall mới đợt này (đúng — không có kẹt). Nợ đợt sau: checklist copy driver gồm CẢ HAI symlink (đã làm 7 đợt liên tiếp).
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP).** File `o8-s1-probe-185t8.mjs` có mặt sau `cp -r` 184→185 (md5 `453d1082` giống hệt 175–184; `node --check` PASS). O8 T8 chạy với probe này (S1 PASS 6, FAIL 0).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round185-t8). **F-181-T8-5: ÁP DỤNG CHO #104** (replay-đầy-đủ, poll=0, KHÔNG caveat — giống #102, khác #103 chưa heal). **F-181-T8-6 (gst-inspect vắng): KHÔNG TÁI DIỄN TRÊN #104** (GST 1624 — boot đã heal; trên #103 là 0). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 183 — tổng GIỮ 22 (23 nếu parent chấp nhận #103 KHÔNG cờ — T4-185). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đã sửa; đợt này KHÔNG tái diễn).**

## 6. Dọn dẹp + kiểm cuối — sạch (trên #104, không reboot trong phiên)

- Driver harness (pid 121505) đã thoát sau pha cuối (12:18:56Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng — đúng luật). O8 driver đã nhả lock 12:22:57Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 101 cooldown lúc đóng — extract xác nhận).
- Kiểm cuối ~12:24Z (trên #104): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` chỉ còn **X193** (mồ côi của T4 — T4-185 ghi nhận; không phải của T8).
- Fixture /tmp: **ĐÃ REBUILD ~12:03Z (md5 khớp đợt 125)** — vẫn còn lúc đóng (chưa có reboot mới sau đó).
- **Reboot #104 (boot `9161bfd1`, btime 11:13:42Z):** xảy ra TRƯỚC khi T8 mở phiên; **0 reboot trong cửa sổ đo (12:03–12:22Z).** dpkg.log 1468 dòng (đã heal). Số hiệu #104 XÁC NHẬN 9 nguồn (T0-185 — theo cờ T4-185); (m) #103 + INSIDE #103 thuộc T2-185; (m) #104 + INSIDE #104 thuộc T2-185 (tiền lệ #102: boot xảy ra sau khi đợt trước đóng, trước khi đợt này mở → thuộc đợt này).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l`.** Không chạy script nặng khi T4 gate0wait/attempt (rebuild fixture SAU khi T4 đóng cờ 12:01Z; harness SAU GATE-FOUND 12:01:39Z).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 6/6 — WebKit 3/3 PASS + Chromium 3/3 PASS, KHÔNG FAIL.** **Kẹt cộng dồn GIỮ 26 — 0 kẹt mới.**
2. **O8 T8 3/3 (WebKit 21/21 md5 0fec17e7/b4acaadf; Chromium 21/21 md5 eeaf999b).** O8 T0 PASS 3/3 trên #104 theo cờ T4-185 (T8 không kiểm lại JSON gốc).
3. **Chuỗi FULL PASS 0 → 1 (đề xuất) — 5/5 chân cùng boot #104.** Không phải FAIL sản phẩm. **Parent/T10 quyết cuối.**
4. **POSTBOOT_PASS #104 CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat)** — gate (a) #104 ĐẠT KHÔNG caveat. **#103 KHÔNG CÓ cờ** (theo cờ T4-185 — tổng boot không cờ 22 → 23 nếu parent chấp nhận).
5. **Balloon max 81,9% trần trong cửa sổ harness (n=31, avail min 836 MB, pinned=0)** — KHÔNG ghim trần lần nào; KHÔNG có sampler T9 trong LIMITS này (T9-185 chưa đóng cờ — giao T9 đối chiếu).
6. **85m4-hb128 37.700 B (dư 68 B) + 86n2-hb128 41.785 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 34.880 B, w2setup-hb128 36.113 B dưới giới hạn. **LIMITS này DƯỚI giới hạn push** (xem `wc -c` lúc stage).
7. **Chuỗi verdict: 84l10 PASS đợt này (5 lần PASS trong 7 đợt gần nhất; 182 + 184 KHÔNG ĐO ĐƯỢC — parent/T10 quyết có nối chuỗi 4 không); 86n2-P1 không kẹt lần 8 nếu tính tiếp (parent/T10 quyết); B1 live sạch lần 3 — B2 chờ parent quyết (đủ mốc 3 đợt).** H3 ỦNG HỘ MẠNH HƠN (đứng nguyên từ 183, §B). Điều tra 84l10 ĐỢT 14 (§D).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') ĐÃ TRIỂN KHAI LÀM PHƯƠNG ÁN CHÍNH đợt này — live 0 kích hoạt (không có kẹt thật để bắt); replay V2 4/4 @125 s, V1-300 3/4, 0 FP cả hai trên 18 log sạch.** V1 chỉ còn đối chứng trong replay.
10. **T7/T9/T6/T1 CHƯA ĐÓNG CỜ lúc T8 đóng** — số T7/T9/T6/T1 thuộc các luồng đó + T10-185. **T4 đóng 12:01Z với lượt yên #54 HỢP LỆ (có cờ `.done`).**
11. **#104 XÁC MINH 9 nguồn (T0-185 — theo cờ T4-185); #103 CHƯA XÁC MINH (T0-185); marker 55 reboot;** (m) #103 + INSIDE #103 thuộc T2-185; (m) #56 lần 28 (T2-185).
12. **T8 ĐÓNG 12:28Z, TRONG hạn cờ ~14:00Z và hạn cứng ~14:35Z** (dù chờ T4 tới 12:01Z + rebuild fixture). 0 reboot trong phiên T8.

## 8. Sai số mới (F-185-T8-N) + nợ cũ đã xử lý

- **F-185-T8-1 — KHÔNG TÁI DIỄN F-184-T8-1 (ĐÃ KIỂM, ĐÓNG Ở MỨC T8):** khối LOGS trong cả hai script replay byte-identical với đợt 184 (diff python); 0 NO-FILE trong cả hai lần chạy replay; 2 entry mới `185-sach-*` chỉ thêm vào, trỏ đúng `round185-t8/smoke/`. Quy trình đổi tên loại trừ khối LOGS đã thành checklist copy driver.
- **F-185-T8-2 — ĐÍNH CHÍNH SỐ LIỆU §C4 ĐỢT 184 (T8 TỰ BẮT, ĐÃ SỬA TRONG LIMITS NÀY + DOCSTRING check-fresh):** bản 184 ghi "V1-300 chỉ bắt 2/4 (164, 171@305 s) và lỡ 183" là SAI — V1-300 bắt **3/4** (164@125 s, 171@305 s, **178@125 s qua nhánh (f) thường** — run kẹt-178 thỏa (f) nên (c') gốc đã bắt được; chỉ 171 + 183 bị (f) chặn). Bằng chứng: dòng V1-300 trong replay-f-fix-185t8.txt (178=TRIGGER@125s) + dòng V0 (178=TRIGGER@125s). Kết luận V2 vẫn đứng (4/4 @125 s, sớm hơn V1 180 s trên 171 + bắt thêm 183); chỉ sửa số đếm V1 từ 2/4 → 3/4. Không đổi quyết (j) đợt 184 (nâng V2) — V2 vẫn hơn V1 đúng 1 ca (183) + sớm 180 s trên 171.
- **F-185-T8-3 — X193 MỒ CÔI (CỦA T4, KHÔNG PHẢI T8):** `/tmp/.X11-unix/` lúc đóng chỉ còn X193 — T4-185 ghi nhận "chỉ socket X193 mồ côi"; X199 của T8 đã unlink đúng luật. T8 không dọn socket của luồng khác (không thuộc phạm vi).
- **F-184-T8-1 — KHÔNG TÁI DIỄN (xem F-185-T8-1). F-184-T8-2 (#103 giữa phiên) — số hiệu #103 chờ T0-185; (m) #103 + INSIDE #103 thuộc T2-185.**
- **F-183-T8-7 — SELFCHECK LIBEVENT: KIỂM LẠI ĐẠT TRÊN #104 (ĐÓNG).** Selfcheck #1 (11:42:25Z) + #2 (12:24:08Z): `libevent-2.1.so.7` CÓ (đúng — MiniBrowser chạy được cả 3 pha); khác #103 THIẾU (đúng — launch-fail).
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG ĐỢT NÀY.** Dọn `smoke/` khỏi bản copy (184 smoke → `smoke/archive-184/` + scratch/o8-webkit/o8-chromium dọn sạch); replay baseline chạy sạch, không parse log stale. Các file stale vẫn nằm trong `smoke/archive-184/` (bằng chứng, không dùng).
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-185t8.sh` (cả 6 pha), KHÔNG chạy thêm `run-chromium-*` riêng. Ghi vào checklist copy driver đợt 186.
- **F-183-T8-5 — NHÃN "ovsize LIMITS 181": ĐÃ SỬA ĐỢT 184, ĐÚNG ĐỢT NÀY (extract in "ovsize LIMITS 184: 37708" — ĐÓNG). F-183-T8-8 — NHÃN SAI TRONG REPLAY-1c: ĐÃ SỬA ĐỢT 183, KHÔNG TÁI DIỄN. F-183-T8-2 — SOCKET X193 STALE: VẪN CÒN (xem F-185-T8-3 — của T4). F-183-T8-4 — (c') BỎ LỠ kẹt-183: V2 ĐÃ TRIỂN KHAI ĐỢT NÀY (§C — chờ ca kẹt thật live đầu tiên). F-183-T8-6 — REBOOT #102: ĐÃ GHI NHẬN ĐỢT 183; số hiệu #104 XÁC NHẬN đợt này (T0-185 — theo cờ T4-185).**
- **F-182-T8-6 — EXTRACT KIỂM LIVE: ĐÃ ĐẠT ĐỢT 183, DÙNG LẠI ĐỢT NÀY (xem §5). F-181-T8-3: ĐÃ SỬA Ở 182, ĐÃ KIỂM LIVE Ở 183 — ĐÓNG. F-181-T8-1: ĐÃ HẾT (181). F-181-T8-2: ĐÃ SỬA Ở 181, KHÔNG TÁI DIỄN. F-181-T8-4: ĐÃ SỬA Ở 181, KHÔNG TÁI DIỄN** (pilot trỏ đúng round185-t8). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 183 — tổng GIỮ 22 (23 nếu parent chấp nhận #103 KHÔNG cờ). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS 0 → 1 (đề xuất) — parent/T10 quyết** (đợt 185: 5/5 chân cùng boot #104; lần đầu có full pass kể từ khi chuỗi VỀ 0 đợt 181/182 — đợt 181 lên 1 rồi ĐỨT đợt 182 vì launch-fail; đợt 183/184 đều 0 vì không đo được/không cùng boot).
2. **V2 (f'') ĐÃ TRIỂN KHAI — parent ghi nhận** (live 0 kích hoạt đợt này; replay V2 4/4 @125 s, V1-300 3/4, 0 FP cả hai trên 18 log sạch; rollback trong 1 đợt nếu cần).
3. **Chuỗi 84l10 PASS 4 đợt + chuỗi 86n2-P1 không kẹt 7 lần: NỐI hay GIỮ?** (đợt 185 WebKit PASS cả hai — nhưng 182 + 184 KHÔNG ĐO ĐƯỢC xen giữa; parent/T10 quyết).
4. **B1 live sạch lần 3 — CÓ MỞ B2 KHÔNG?** (đủ mốc 3 đợt theo đề xuất đợt 183; T8 KHÔNG tự mở — parent quyết).
5. **Reboot #104 (9161bfd1, btime 11:13:42Z) — XÁC NHẬN 9 nguồn (T0-185 — theo cờ T4-185); (m) #104 + INSIDE #104 thuộc T2-185 (tiền lệ #102); (m) #103 + INSIDE #103 cũng thuộc T2-185; POSTBOOT_PASS #104 ĐÃ CÓ (11:42:15Z, replay-đầy-đủ, poll=0, KHÔNG caveat). #103 KHÔNG CÓ cờ — tổng boot không cờ 22 → 23 nếu parent chấp nhận (T4-185).**
6. **Replay đình trệ 3 boot liên tiếp (#100 một phần, #101/#103 toàn phần) — #104 ĐÃ HEAL (replay-đầy-đủ, poll=0)** — chuỗi đình trệ DỪNG ở #104; nếu T0/T7/T9 tìm ra nguyên nhân đình trệ #100/#101/#103 thì ghi GAP, không thì nợ host-side (quyết (k) đợt 174).
7. **F-185-T8-2 (đính chính V1-300 2/4 → 3/4)** — parent ghi nhận; không đổi quyết (j) đợt 184.
8. **T7-185/T9-185/T6-185/T1-185 chưa đóng cờ lúc T8 đóng** (run 184 kết cục + cửa slot + HB/DR + headroom/ENOSPC/E-226 + (A)/prune lần 60 + verify đợt 184 — thuộc các luồng đó + T10-185).
9. Mở từ trước, vẫn đứng: **#104 KHÔNG GIẾT HOLDER (chờ T6-185); (A) 120/120 lần 34 (T6-184 — T6-185 chưa đóng); (m) #103 DƯƠNG ỨNG VIÊN +37,543 s (T7-184 — T2-185 phân loại cuối); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck lần 29, T2-185); (m) #56 lần 28 (T2-185); run 184 kết cục thuộc T7-185; G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần 39 (T9-185); R9 (a) lần 21; file oversize 6,4 MB chưa quyết; KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt; u2net là fallback chính thức; fixture /tmp đã rebuild đợt này — còn lúc đóng; KHÔNG PUSH — 190 batch / 280 entry / 258 đường dẫn / 254 file chờ user push (đợt 166–184) + batch đợt 185 (T10-185 đếm cuối).**
10. **F-185-T8-4 — BOOT-SURVEY T0-185 STAT SAI FILE MARKER (ghi nhận, thuộc T0):** `boot-survey-185t0.sh` dòng 12 stat `PHASE9_ROUND184_LIMITS.md` làm marker (mtime 11:20:59Z 24/11) — marker thật là `~/.config/vcut-persistence-marker` (mtime 2026-11-20 11:39:47.272154981Z KHÔNG ĐỔI — T8 kiểm trực tiếp; sống qua 56 reboot #49–#104). Giao T0-186 sửa đường dẫn stat trong boot-survey.
