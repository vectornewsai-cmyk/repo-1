# Đợt 193 T8 — HARNESS 6/6 TRÊN #117 (ỨNG VIÊN): 84l10 PASS LẠI (CHUỖI 0 → 1); V4 (f'''') BẮT 3/3 KẸT MÙ — V2+V4 = 8/8; FULL PASS KHÔNG THỂ (LƯỢT YÊN #61 0 HỢP LỆ)

Ngày: 25/11/2026 (lượt cron 03:35:51 +07 = 20:35:51Z; T8 mở ~20:40Z, đóng ~22:40Z — **TRONG hạn cờ ~23:00Z**).
Phạm vi: (1) harness hb128 + B1/B2 live trên boot mới nhất; (2) O8 T8 3/3; (3) V2 (f'') replay kẹt @125 s + 0 FP log sạch; (4) **NỢ (j)-192: V4 (f'''') quy tắc im lặng — đề xuất/sửa phủ sóng V2 cho kẹt trước heartbeat (F-192-T8-4)**; (5) điều tra riêng 84l10 (đợt 18) + H3 giám sát thụ động.

## 0. Kết luận ngắn — 6/6; 0 KẸT MỚI; FULL PASS KHÔNG THỂ (LƯỢT YÊN #61 0 HỢP LỆ); V4 ĐẠT 8/8

- **MỘT BOOT TRONG ĐỢT — mọi chân đo CÙNG BOOT.** Boot #117 ứng viên `1c0bcaad` (btime 20:22:37Z, gap #116→#117 = 14.464 s; T01-193 xác minh 9 nguồn tươi). **0 reboot trong phiên T8.** Marker sống qua **69 reboot (#49–#117)** nếu #117 xác nhận (T56-193).
- **POSTBOOT_PASS #117 CÓ 20:59:08Z** (T56-193; repair-sớm-quyết-h, poll=1, **CÓ caveat — NHẸ HƠN #115: GST 269 là thư mục THẬT, không phải symlink**; dpkg 768, cache 107, lists 75). **Replay #117 KHÔNG CHẠY (dạng B, như #115).** Tổng boot không cờ **26 → 27** (#116 KHÔNG CÓ cờ — T56-193).
- **Lượt yên #61: 0 LƯỢT HỢP LỆ (T4-193, LIMITS 21:40Z, .done 21:44Z)** — attempt1 partial/wedged (exit 2, 7/20); attempt2 20/20 + B 5/5 nhưng tickCost median 61,0 ms > 60 (thiếu 1,0 ms); attempt3 20/20 NHƯNG B1+B2 VI PHẠM (load1_max 5,67). Chuỗi lượt yên hợp lệ **GIỮ 0** (đã đứt ở #60). Labellag (b) chuỗi **GIỮ 0** (quyết (m)-192).
- **HARNESS 6/6 trên #117 (21:50:44–22:06:07Z): WebKit 84l10/85m4/86n2 PASS + Chromium 3/3 PASS; live_diags=0; WATCHDOG-137 ×0.** Kẹt cộng dồn **GIỮ 28 (0 kẹt mới)**. **84l10 PASS — chuỗi 0 → 1 (khởi động lại sau khi đứt ở 192). 86n2-P1 không kẹt: lần 15** (P1 PASS 21:55:10Z).
- **O8 T8 3/3 trên #117** (22:08:14–22:11:07Z): WebKit ×2 **21/21 PASS** (md5 `4f511ce7`/`aa0892a9`) + **Chromium 21/21 PASS (md5 `763ec95e`)**. **O8 T01 3/3 trên #117** (21:04:37–21:07:41Z): WebKit 21/21 ×2 (md5 748d7238/58f66a05) + Chromium 21/21 (md5 575bc079) — **O8 CÙNG BOOT (khác đợt 192 chia đôi boot).**
- **FULL PASS: KHÔNG THỂ — chuỗi GIỮ 0.** Chân (b) gãy (lượt yên #61 0 hợp lệ); 4 chân còn lại đều đạt: gate (a) #117 CÓ cờ (caveat); harness 6/6; O8 3/3 ×2 cùng boot; live-check #12 KHÔNG THỂ KIỂM (T4 — chuỗi live ĐẠT GIỮ 9).
- **B2 VÙNG MỚI SẠCH LẦN 7** (setup/startPlaying/P6-wait 0 trigger; check-fresh live: 85m4 OK maxspan=5 s, 86n2 WebKit OK maxspan=85 s, Chromium OK maxspan=85 s; P6-wait tối đa elapsed=90 s — biên 30 s dưới ngưỡng 120 s).
- **B1: 0 kẹt đợt này — B1 KHÔNG BẮT gì (không có kẹt để bắt); chuỗi live sạch 0 → 1** (đợt sạch đầu tiên sau khi đứt ở 192 — tiền lệ đợt 179: chuỗi tính lại từ 1).
- **V2 (f'') phương án chính — replay: V2 bắt 5/5 kẹt @125 s (164/171/178/183/188), 0 FP trên 34 log sạch duy nhất theo md5** (36 entry; 193 đóng góp 3 log sạch mới: 193-sach-84l10 md5 `0f9cf841`, 193-sach-85m4 md5 `8a8fa250`, 193-sach-86n2-hb128 md5 `8443209e`); **V1-300 đối chứng: 4/5** (lỡ 183). **Số log sạch chuẩn (md5-unique): 31 → 34.**
- **V4 (f'''') QUY TẮC IM LẶNG — NỢ (j)-192 ĐÃ LÀM XONG (§C5): V4 bắt 3/3 kẹt mù (179 gap 723 s; 180 gap 718 s; 192 gap 793 s), 0 FP trên 36 log sạch; V2+V4 = 8/8 kẹt, 0 FP.** V4 đã cài trong check-fresh-193t8.py + replay-f-fix-193t8.py (offline — bật live chờ (j)-193).
- **84l10 — GIẢ THUYẾT TRIGGER "THIẾU SCANNER" BỊ YẾU ĐI (§D4):** 84l10 PASS đợt này trong khi `gst-plugin-scanner` + `gst-inspect-1.0` VẮNG cả trước pha (21:50:26Z) lẫn trong pha (21:51:56Z), 0 GStreamer-WARNING trong log — thiếu scanner KHÔNG ĐỦ gây kẹt. Hướng điều tra mới: race với quá trình cài gói đồng thời, không phải chỉ vắng binary. H3 GIỮ mức ỦNG HỘ MẠNH (0 kẹt đợt này không bác H3).
- **F-193-T8-1..5 mới (xem §8).** F-192-T8-1/2/3/4 ĐÃ SỬA/LÀM XONG (waiter append; GATE-CHECK 6/6; kiểm scanner trước pha — xem §D4; V4 — xem §C5); F-192-T8-5 KHÔNG TÁI DIỄN (harness trên boot CÓ POSTBOOT_PASS).

## 1. Dòng thời gian (gọn)

- 20:22:37Z **#117** (1c0bcaad, ỨNG VIÊN — T01-193, 9 nguồn tươi). 20:35:51Z Đợt 193 mở. 20:40–20:46Z T8 mở: đọc aggregate 192 §10 + §14.2(b)(j) (bản parent, 99.871 B); copy driver 192→193 + đổi nhãn; **dọn `smoke/` (192 → `smoke/archive-192/`)**; **0 symlink Singleton\* stale**; probe S1 CÓ SẴN (md5 `453d1082`).
- 20:45:40Z Selfcheck #1 trên #117: libs 6/6 THIẾU, plugin dir 0, dpkg 2 dòng, balloon 5.608.412 kB, avail 1.104 MB; scanner + gst-inspect VẮNG. 20:46:15Z rebuild fixture lần 1 xong (md5 khớp đợt 125: hevc ba0c7c62, i7 f05daed8, h fbaa3d1a, g a1fb8549). Check-fresh offline B2: khớp hệt §C2 (3 TRIGGER @125 s; B2-4 OK không trigger — giới hạn đã biết; 2 ca sạch không FP).
- 20:45:57Z Waiter khởi động (deadline 22:15Z; append-mode — F-192-T8-1 đã sửa). 20:59:08Z **POSTBOOT_PASS #117 CÓ** (T56-193, repair-sớm-quyết-h, poll=1, CÓ caveat). 21:00Z waiter thấy postboot=1 (poll 15). 21:04:37–21:07:41Z O8 T01 3/3 trên #117. 21:18:02Z T4 attempt2 chạy (attempt1 đã dùng 1/3). 21:30Z T4 poller thoát (0 lượt hợp lệ). 21:40Z T4 LIMITS xong (36.862 B); 21:44Z T4 .done; **21:45:08Z waiter GATE-FOUND poll=60** (t4=OK, postboot đường (a), t4attempt=no-lock).
- **21:50:44–22:06:07Z HARNESS 6/6** (driver pid 233552, boot #117). **22:08:14–22:11:07Z O8 T8 3/3.** 22:11–22:40Z replay + extract + LIMITS + paths + cờ. **0 reboot trong phiên T8.**

## A. O8 — T8 3/3 + T01 3/3, CÙNG BOOT #117 (KHÁC ĐỢT 192)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #117 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `4f511ce7`, S1 PASS 22:08:15Z |
| 2 | O8 T8 WebKit attempt2 trên #117 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `aa0892a9`, S1 PASS 22:09:08Z |
| 3 | O8 T8 Chromium trên #117 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `763ec95e`, S1 PASS 22:10:12Z |
| 4 | O8 T01 WebKit attempt1 trên #117 | **21/21 PASS** (md5 748d7238, 21:04:53Z) |
| 5 | O8 T01 WebKit attempt2 trên #117 | **21/21 PASS** (md5 58f66a05, 21:05:57Z) |
| 6 | O8 T01 Chromium trên #117 | **21/21 PASS** (md5 575bc079, 21:07:11Z) |

- O8 log T8: S1 PASS 6, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0. **Gate cho boot đo `1c0bcaad` (#117 ứng viên): (a) CÓ — POSTBOOT_PASS #117 20:59:08Z (repair-sớm-quyết-h, poll=1, CÓ caveat).** O8 T01 + O8 T8 + harness CÙNG boot; **FULL PASS KHÔNG THỂ chỉ vì chân (b) (lượt yên #61 0 hợp lệ).**
- **preview.tsx đổi giữa 2 lượt O8: `50ad3faf` (ổn định suốt O8 T01) → `cf331628` (lúc O8 T8)** — luồng sản phẩm sửa file giữa chừng (P2/P3/P4 còn chạy); cả hai lượt O8 đều 21/21 — không ảnh hưởng verdict, ghi rõ cây đo khác nhau (F-193-T8-5). `media.ts` 2c384ed1, `vite.config.ts` ee80d093 không đổi.

## 2. Kết quả harness — 6/6; WebKit 3/3 PASS; Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 21:50:44–21:51:54 | **PASS** — W1-lần1 PASS 21:50:59Z + W2 HB128 chảy (playhead 4,2→24,2) + E4 PASS, live_diags=0 |
| 2 | WebKit 85m4 | 0 | 21:52:10–21:54:22 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 21:54:37–21:58:28 | **PASS** — P1 PASS 21:55:10Z + P5 PASS (0 restart) + P6 KHÔNG-KẸT, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 21:58:44–21:59:44 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 21:59:59–22:02:00 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 22:02:15–22:06:07 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 28 — 0 kẹt mới.** **84l10 PASS đợt này — chuỗi 0 → 1 (khởi động lại).** **86n2-P1 không kẹt: lần 15** (P1 PASS 21:55:10Z).
- RAM sampler (n=31, suốt harness): balloon min 4.291.548 / max 5.295.596 kB (**82,2% trần, pinned=0**), avail min 605 MB (22:05:12Z) / max 1.425 MB. Balloon thấp hẳn đợt 192 (95,8% trần) — máy nhàn hơn trong lúc harness.
- GATE-CHECK trước MỖI pha (bài học F-191-T10-2): 6/6 lần ghi "T4 khong giu lock" (load5 1,11 lúc pha 1) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 21:30Z; lock TRỐNG suốt harness). O8 cũng có GATE-CHECK trước acquire (T4 không giữ lock). **0 vi phạm phía T8.**

# §C — B2 LIVE LẦN 7: VÙNG MỚI SẠCH TIẾP; B1 KHÔNG BẮT GÌ (0 KẸT); V4 (f'''') ĐÃ LÀM XONG

## C1. Trạng thái B2 đợt này (KHÔNG đổi script — B2 đã trong 3 script từ đợt 186)

- 3 script harness giữ nguyên md5 đợt 186/187/188/189/191/192: 84l10 `16e5e957` (35.917 B), 85m4-hb128 `3fb2548b` (**38.737 B — VƯỢT giới hạn push, lúc push cần `ENABLE_PRIVSEP=0`**), 86n2-hb128 `de925614` (**43.653 B — VƯỢT, cần `ENABLE_PRIVSEP=0`**). `node --check` PASS cả 3 (kiểm lúc copy). Thiết kế §C4 LIMITS T8-180 + triển khai §C1 LIMITS T8-186 — không sửa đợt này.
- **Mẫu bọc + ngưỡng giữ nguyên:** ngưỡng 120 s, run_len ≥3, (e)/(f), ngân sách diag (≤2/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. **V2 (f'') vẫn là phương án chính live.**

## C2. Kiểm chứng offline LẠI TRƯỚC harness (check-fresh-193t8.py trên 6 log tổng hợp đợt 186)

| Ca | Log tổng hợp | check-fresh-193t8.py (V2 + V4) |
|---|---|---|
| B2-1 setup treo 150 s | `planb-b2-setup-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-2 startPlaying treo 150 s | `planb-b2-startplaying-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-3 P6-wait treo 150 s + WATCHDOG-137 @60 s | `planb-b2-p6wait-150s-wd.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-4 P6 seeking-kẹt 150 s, KHÔNG watchdog | `planb-b2-p6wait-150s-nowd.log` | OK maxspan=150 s wd=0 maxgap=5 s — **KHÔNG trigger (giới hạn đã biết, §C5)** |
| B2-5 P6 sạch 90 s | `planb-b2-p6-clean-90s.log` | OK maxspan=85 s wd=0 maxgap=5 s — **không FP** |
| B2-6 setup sạch 60 s | `planb-b2-setup-clean-60s.log` | OK maxspan=55 s wd=0 maxgap=5 s — **không FP** |

- **Kết luận offline: ĐẠT (khớp hệt §C2 đợt 186/187/188/189/191/192).** Cả 3 vùng B2 mới đều trigger đúng @125 s khi treo thật; không FP trên 2 ca sạch. V4 không làm đổi kết quả 6 ca này (B2-4 có HB128 mỗi 5 s nên maxgap=5 s — V4 không chạm tới giới hạn đã biết).

## C3. Kiểm live (harness 6/6 đợt này — script B2 là script harness)

| Vùng B2 | WebKit 84l10 | WebKit 85m4 | WebKit 86n2 | Chromium 84l10 | Chromium 85m4 | Chromium 86n2 |
|---|---|---|---|---|---|---|
| `setupProject setup` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `startPlaying start` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `P6-wait wait` | — | — | **18 dòng** (elapsed 5→90 s) | — | — | **18 dòng** (elapsed 5→90 s) |
| check-fresh live | OK maxspan=0 s wd=0 maxgap=8 s | OK maxspan=5 s maxgap=7 s | OK maxspan=85 s maxgap=7 s | OK maxspan=0 s maxgap=7 s | OK maxspan=10 s maxgap=5 s | OK maxspan=85 s maxgap=7 s |

- **B2 VÙNG MỚI SẠCH LẦN 7** — chưa bắt kẹt thật ở vùng mới (setup/startPlaying/P6-wait 0 trigger; P6-wait tối đa elapsed=90 s — biên 30 s dưới ngưỡng 120 s).
- **P6-wait chạy tới elapsed=90 s cả hai engine, maxspan=90 s — biên còn 30 s** (đợt 192: WebKit 85 s, Chromium 85 s — biên 30–35 s). Vẫn dưới ngưỡng 120 s, KHÔNG FP.
- **Replay sau live (3 entry sạch mới, 0 entry kẹt mới):** 193-sach-84l10 6 dòng HB128 (chỉ W2), max run span 0 s; 193-sach-85m4 19 dòng, max run span 5 s; 193-sach-86n2-hb128 39 dòng, max run span **85 s** (run_len=18, playhead=30 ct=30), KHÔNG kích hoạt mọi phương án — **P6-wait không gây FP ngay cả trong replay** (biên 35 s). Maxgap live 5–8 s — V4 cũng KHÔNG kích hoạt trên log live đợt này (đúng: không có kẹt, không có im lặng dài).

## C4. Replay V1/V2 sau O8 (replay-1c-193t8.py + replay-f-fix-193t8.py — đã thêm 3 entry `193-*`)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 34 log sạch duy nhất theo md5** (36 entry; 2 cặp trùng byte-identical 181/182 — xem dưới). Đợt 193 đóng góp 3 log sạch mới + 0 log kẹt mới.
- **Kẹt theo từng phương án: (c') V0: 164@125 s, 178@125 s, 188@125 s (3/5; lỡ 171, 183); V2 (f''): 164/171/178/183/188 @125 s (5/5, KỊCH BẢN CHÍNH); V1-300: 164/171/178/188 @125 s (4/5; lỡ 183); V1-60: 171/178/188 (3/5; lỡ 164, 183).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (5/5 kẹt @125 s, FP 0); **V1-300 ĐẠT** (4/5, FP 0) — V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 34 log sạch duy nhất (md5).**
- **F-184-T8-1: KHÔNG TÁI DIỄN:** 0 NO-FILE trong cả hai lần chạy replay (41 entry replay-f-fix + 44 entry replay-1c đều có file).
- **Số log sạch chuẩn (md5-unique): 17/17/19/21/23/25/27/29/31/34 (183/184/185/186/187/188/189/191/192/193 — 190 VOID, không đóng góp).** Hai cặp trùng: 181/182-sach-85m4 (md5 `166b271d`) + 181/182-sach-86n2-hb128 (md5 `e11c62cb`) — byte-identical, đã biết từ đợt 187. 0 FP không đổi theo cả hai cách đếm.
- **Biên an toàn (không đổi sau B2):** log sạch max identical-run span **90 s** (run P6-wait — ngưỡng 120 s → biên 30 s). Đây là biên ĐÚNG THIẾT KẾ — không phải FP. Watchdog chỉ kích hoạt sau evaluate im lặng >60 s — tín hiệu ĐỘC LẬP, không vòng tròn.

## C5. V4 (f'''') QUY TẮC IM LẶNG — NỢ F-192-T8-4 ĐÃ LÀM XONG (ĐỀ XUẤT, CHỜ PARENT QUYẾT (j)-193)

- **Thiết kế V4 (trong check-fresh-193t8.py):** kích hoạt khi max-gap giữa hai dòng log có timestamp ISO-Z liên tiếp **≥ 120 s** (cùng ngưỡng 120 s với V2). Hai phân loại: **pre-hb** (0 dòng HB128 toàn log: 180, 192) và **mid-phase** (có HB128 ở pha trước, 0 dòng trong lúc kẹt: 179 — kẹt P4 resetPlayhead0:320).
- **Đính chính quan trọng:** 179-ket-85m4 **CÓ 11 dòng HB128** (P1–P3) — "0 dòng HB128" trong các LIMITS trước là **0 dòng TRONG LÚC KẸT P4**, không phải toàn log (xem F-179-T8-5). V4 bắt 179 qua gap im lặng 723 s, KHÔNG cần tiền đề 0-HB128.
- **Bằng chứng replay đợt 193 (replay-f-fix-193t8.py — mục ĐÁNH GIÁ V4): V4 bắt 3/3 kẹt mù** (179 gap 723 s; 180 gap 718 s; 192 gap 793 s — detect_at = gap_start + 120 s, tương đương @125 s của V2 với poll 10 s); **0 FP trên 36 log sạch** (max gap sạch 97 s — cửa P5→P6 chờ 90 s cố định + ~7 s chuyển pha, chỉ ở log 86n2 trước đợt 186; từ 186 P6-wait đã log HB128 mỗi 5 s nên gap ≤ 8 s; **biên V4 = 23 s**). **V2+V4 = 8/8 kẹt, 0 FP.**
- **Giới hạn còn lại (trung thực):**
  - V4 cần ≥ 1 dòng timestamp trong log (pha chưa log dòng nào thì không đo được — vite không lên là lỗi khác, driver timeout 900 xử lý).
  - **Live CHƯA bật V4 đợt này:** driver chỉ gọi check-fresh khi `grep` thấy HB128 trong log (run-webkit-193t8.sh:135) — kẹt type-A (0 HB128) live vẫn cần bỏ điều kiện grep đó; kẹt type-B (179) đã được bắt vì log CÓ HB128 nên driver đã gọi. Thay đổi driver là 1 dòng — **chờ parent quyết (j)-193, không tự đổi live giữa đợt** (tiền lệ V1/V2: đề xuất offline → parent quyết → triển khai đợt sau).
  - **Nói đúng giá trị live của V4:** live đã có (1b) mtime-silence của driver (log không ghi >120 s → diag) + WATCHDOG-137 trong script — chính hai thứ này đã bắt #28 live (diag live 2/2 đợt 192). V4 KHÔNG mở vùng phủ sóng hoàn toàn mới live; V4 củng cố bằng cách đo im lặng trên **dòng timestamp** (không bị reset bởi dòng không-timestamp như khối browser-stderr `[pid=...]`) + cho bằng chứng replay 8/8. Giá trị chính là ở replay/phân loại, không phải ở bắt live lần đầu.
  - B2-4 (P6 seeking-kẹt không watchdog) VẪN KHÔNG bắt được (có HB128 mỗi 5 s, maxgap=5 s) — giới hạn đã biết, đứng nguyên.
- **B2 đã bắt kẹt thật đầu tiên đợt 188 (P5, vùng chung)** + kẹt #28 đợt 192 (84l10 W2, qua watchdog) — nhưng chưa bắt kẹt thật nào ở vùng mới (setup/startPlaying/P6-wait). Bằng chứng bắt thật ở vùng mới thuộc ca kẹt tới.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 18 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173) + KẸT #28 (§D4, CẬP NHẬT ĐỢT 193)

## D1–D2. Phạm vi + Q3: 84l10 qua 5 điểm kẹt cũ (157 E4 :457; 170 W2 :433; 171 W2-setup :425; 178 W2-setup :443; 192 W2-setup :423) + ca 193 W2-setup PASS (§D4); 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 PASS (exit 0, 21:51:54Z), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 193: **CÓ dữ liệu mới về kẹt 84l10 (§D4)**. **Chuỗi 84l10 PASS: 0 → 1 (khởi động lại).** Tần suất: **5 ca / 34 đợt ≈ 15%** (157, 170, 171, 178, 192).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Ca 192 là setup W2 đóng băng (không phải chuyển trạng thái) — giống họ kẹt "vòng poll đóng băng", cùng họ với 170/171/178. Ca 193 W2-setup chạy qua bình thường (17 s từ setup W1 tới HB128 W2 đầu tiên).
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (xem §D4):** 84l10 PASS với scanner VẮNG — **nghiêng lại về phía engine/thời điểm, không còn nghiêng hệ thống như đợt 192.** Chromium cùng pha PASS sạch trên cùng boot (như mọi đợt).
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 193: không có kẹt — W2 chạy, playhead 4,2→24,2, E4 PASS** (media chạy bình thường).
- **Q4 — Race evaluate/GStreamer?** **BẰNG CHỨNG MỚI:** 0 GStreamer-WARNING + 0 plugin-loader trong log 193 (đối chiếu 1 warning lúc 16:31:57Z đợt 192) — **không có dấu hiệu race đợt này.** Giả thuyết race vẫn mở cho ca 192, nhưng không còn là giải thích duy nhất cho họ kẹt W2-setup.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ sáu, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; kiểm `gst-plugin-scanner` + `gst-inspect-1.0` CÓ/KHÔNG ngay trước khi chạy pha WebKit đầu tiên (nợ từ §D4 đợt 192 — đã làm đợt này, giữ lại cho các đợt sau).

## D4. KẸT #28 — CẬP NHẬT ĐỢT 193: GIẢ THUYẾT TRIGGER "THIẾU SCANNER" BỊ YẾU ĐI

- **Đối chiếu trực tiếp 192 ↔ 193 (cùng pha, cùng boot-dạng, khác kết quả):**

| | Đợt 192 (KẸT #28) | Đợt 193 (PASS) |
|---|---|---|
| Boot | #116 4dda8234, btime 16:21:33Z | #117 1c0bcaad, btime 20:22:37Z |
| Scanner trước pha | VẮNG (selfcheck 16:26:22Z) | VẮNG (selfcheck 20:45:40Z + kiểm lại 21:50:26Z) |
| Scanner trong pha | VẮNG lúc kẹt; CÓ lúc 16:48Z (sau pha) | VẮNG lúc 21:51:56Z (giữa pha) |
| GStreamer-WARNING plugin loader | **1×, 16:31:57Z (5 s sau khi pha khởi động)** | **0×** |
| dpkg.log trong lúc pha | **2 → 530 → 1.446 → 1.468 (replay đang cài gói ĐỒNG THỜI)** | **768 ổn định từ 20:59Z (trước pha ~52 phút)** |
| Kết quả W2-setup | Kẹt tại runEngine:423, 0 dòng HB128, exit 124 | W1-lần1 PASS 21:50:59Z, HB128 W2 từ 21:51:16Z, E4 PASS, exit 0 |

- **Kết luận cơ chế (cập nhật): thiếu scanner KHÔNG ĐỦ gây kẹt** — cùng điều kiện vắng scanner, 1 ca kẹt + 1 ca pass. **Hướng điều tra mới: race với quá trình cài gói đồng thời** (đợt 192: dpkg/apt đang chạy trong lúc W2-setup; đợt 193: apt đã xong từ trước). Cần ≥1 ca kẹt nữa có kiểm dpkg-đang-chạy trước pha để xác nhận/bác. **H3 GIỮ mức ỦNG HỘ MẠNH** (0 kẹt đợt này không bác H3; không có bằng chứng mới đổi mức).
- **Nợ đứng:** chỉ 1 ca kẹt + 1 ca pass có trigger đo được — chưa đủ dữ kiện khẳng định tuyệt đối (cần ≥2 ca kẹt có kiểm scanner + dpkg-trước-pha, hoặc 1 ca kẹt tái diễn khi dpkg đang chạy).

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 193 (0 KẸT MỚI — KHÔNG CÓ BẰNG CHỨNG MỚI)

## B1. Trạng thái giả thuyết sau đợt 193

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — 0 kẹt đợt này; avail min 605 MB trong harness, balloon max 82,2% trần (thấp hơn đợt 192).
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH (GIỮ mức đợt 192)** — 0 kẹt mới nên không có bằng chứng mới; §D4 cập nhật giả thuyết trigger (scanner → cài gói đồng thời) nhưng không đổi mức H3.
- Đợt 193 T8: **0 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T01 PASS 3/3 trên #117). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS, lần thứ 15.**

# §E — CHECKLIST (o) ĐỢT 193 (gọn — chỉ mục đổi so với đợt 192)

- o1. F-186-T0-1 (#106 chưa xác minh) — ĐÃ QUYẾT (e) đợt 186: cea79500 = #107.
- o2. Run 194 kết cục thuộc T7-193 (run hiện tại 8c0c386d = run 194 theo quyết (n)-192; T7-193 phán — xem LIMITS T7).
- o3. F-185-T1-1 (prose §112) — ĐÃ SỬA XONG đợt 186.
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 605–1.425 MB trong harness; balloon max 82,2% trần, pinned=0.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; T4-193: (p) live #12 KHÔNG THỂ KIỂM (chuỗi GIỮ 9); B2 dữ kiện thứ 5 LẪN LỘN (lần 2 liên tiếp).
- o6. F-181-T4-3 (X193) — ĐÃ ĐÍNH CHÍNH: X193 là Xvfb của chính probe T4. X11 lúc T8 đóng: **2 file (X193, X98 — của luồng khác, không phải T8; xem §6)**.
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-193 viết POSTBOOT_PASS #117 20:59:08Z (repair-sớm-quyết-h, poll=1, CÓ caveat); POSTBOOT_PASS #116 KHÔNG CÓ — tổng boot không cờ 26 → 27 (T56-193).
- o8–o10. F-181-T5-2 (ledger ts) + F-180-T5-3 (lệch btime) + F-174-T5-6 — GHI NHẬN (#117 repair-sớm-quyết-h poll=1 CÓ caveat, GST thư mục thật — nhẹ hơn #115).
- o11–o13. F-181-T6-1 + F-180-T6-4 + F-180-T6-5 — GHI NHẬN; T56-193 ĐÃ ĐÓNG CỜ ((A) 120/120 lần 42; #116 KHÔNG GIẾT HOLDER, chuỗi 19 → 20; #117 KHÔNG GIẾT HOLDER, chuỗi → 21; prune lần 67).
- o14–o16. F-181-T7-1 (OUTAGE 8.406 s — T7-194 phán cuối) + F-180-T7-4 + F-180-T7-5 — GHI NHẬN; T7-193 kiểm onset khung 25/11 (16:52–17:35:40Z bàn giao từ đợt 192 — xem LIMITS T7-193).
- o17. F-185-T8-4 (stat sai marker) — **ĐÃ SỬA (T0-186)** — marker 69 reboot (#49–#117) nếu #117 xác nhận (T56-193).
- o18. Quyết (o) 192 — GHI NHẬN; số mới thuộc T7-193/T9-193 (auto-trigger live — xem LIMITS T9-193).
- o19. Quyết (l) 152 — ĐÃ THỰC HIỆN: marker 69; **T8 đóng ~22:40Z, TRONG hạn cờ ~23:00Z**.
- o20. Quyết (j) 192 — **ĐÃ THỰC HIỆN (§2, §C, §D4, §F, §B, §C5)** — B2 sạch lần 7; V2 replay 5/5 @125 s, V1-300 4/5; **V4 (f'''') ĐÃ LÀM XONG — replay V4 3/3 kẹt mù, V2+V4 = 8/8, 0 FP**; F-192-T8-1/2/3 ĐÃ SỬA (xem §8); **84l10 PASS — chuỗi 0 → 1; B1 live sạch 0 → 1; số log sạch chuẩn 31 → 34**.
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T01-193/T9-193; T01-193 ĐÃ ĐÓNG CỜ 21:22Z; T2-193 ĐÃ ĐÓNG CỜ 21:39Z).

# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 193 — DỪNG** (đã PASS 3 lần liên tiếp; ca kẹt setup đợt 192 được bắt live bằng watchdog + diag-stall của driver; đợt này 84l10 PASS nên càng không cần). **Mở lại nếu kẹt setup tái hiện mà diag live không đủ bằng chứng.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy). **Chi phí B2 giữ nguyên:** 85m4-hb128 38.737 B (VƯỢT 969 B); 86n2-hb128 43.653 B (oversize — cần ENABLE_PRIVSEP=0); 84l10 35.917 B (dư 1.851 B).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` **50ad3faf → cf331628** (đổi GIỮA O8 T01 và O8 T8 — luồng sản phẩm sửa file trong lúc T8 chạy; cả hai lượt O8 đều 21/21); `media.ts` 2c384ed1; `vite.config.ts` ee80d093; `84l10` **16e5e957 (B2, KHÔNG ĐỔI)**; `85m4-hb128` **3fb2548b (B2, KHÔNG ĐỔI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` de925614 (B2, KHÔNG ĐỔI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). **T8 KHÔNG đổi file repo đợt này.**
- **Working dir `repo-1/hidden_files/round193-t8/`** — copy `cp -r` 192→193 (exit 0). **Đổi nhãn đúng** (192t8→193t8, waiter deadline → 22:15Z, lock ticket t8-round193) — grep: chỉ còn tham chiếu 192 trong khối LOGS đóng băng của replay (3 entry `192-*`) + nhãn lịch sử LIVE-DIAG-189/FRESH-CONTENT-189 (cố định). **F-192-T8-1/2/3 ĐÃ SỬA/ÁP DỤNG** (xem §8/§D4).
- Extract (dùng lại): trích ĐÚNG số harness (6/6 exit=0, live_diags=0) + O8 (webkit 21/21 md5 4f511ce7/aa0892a9, chromium 21/21 md5 763ec95e) + sampler n=31 + WATCHDOG-137: 0. Nhãn "ovsize LIMITS 192" nay ĐÚNG (động).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** 0 symlink Singleton\* stale lúc copy.
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP)** — `o8-s1-probe-193t8.mjs` md5 `453d1082` (giống hệt 175–193; `node --check` PASS); O8 T8 chạy với probe này (S1 PASS 6, FAIL 0 — attempt1/2 PASS nên probe không cần chạy lại).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round193-t8). **F-181-T8-5: ÁP DỤNG CHO #117** (repair-sớm-quyết-h, poll=1, CÓ caveat — GST thư mục thật, nhẹ hơn #115). **F-181-T8-6 (gst-inspect vắng): TÁI DIỄN TRÊN #117** (VẮNG lúc selfcheck #1 20:45:40Z, selfcheck #2 21:01:15Z, trước pha 21:50:26Z và trong pha 21:51:56Z — xem §D4). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 191 — tổng boot không cờ 26 → 27 (#116). F-181-T8-8 (log stale): VẪN CÒN — đợt này KHÔNG tái diễn.**

## 6. Dọn dẹp + kiểm cuối — sạch (trên #117, không reboot sau 20:22:37Z)

- Driver harness đã thoát sau pha cuối (22:06:07Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng). O8 driver đã nhả lock 22:11:07Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 95 cooldown — extract xác nhận).
- Kiểm cuối ~22:38Z (trên #117): process Xvfb/MiniBrowser/WebKit sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` còn **2 file (X193, X98)** — X193 là Xvfb của probe T4 (F-181-T4-3), X98 socket stale từ trước O8 T01 (T01-193 ghi "1 socket stale X98, 0 process giữ") — **cả hai đều KHÔNG phải của T8** (:199 của T8 đã dọn). Extract (mới, F-191-T8-3): ps sót T8 0, clicktest T8 0.
- Fixture /tmp: **ĐÃ REBUILD 1 LẦN** (#117 20:46:15Z — md5 khớp đợt 125) — vẫn còn lúc đóng.
- **Reboot #117 (boot `1c0bcaad`, btime 20:22:37Z, gap 14.464 s):** xảy ra TRƯỚC khi T8 mở (đợt 193 mở 20:35:51Z); **0 reboot trong phiên T8.** dpkg.log 768 dòng (ổn định từ 20:59:08Z). #117 ỨNG VIÊN (parent quyết (e)); (m) #117 thuộc T2-193 (xem LIMITS T2-193); POSTBOOT_PASS #117 CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat); #116 KHÔNG CÓ cờ (tổng boot không cờ 26 → 27).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l`.** Không chạy script nặng khi T4 attempt (harness chạy SAU khi poller T4 thoát + waiter GATE-FOUND — theo (i)-143; GATE-CHECK 6/6 pha đều ghi T4 không giữ lock).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 6/6 — WebKit 84l10/85m4/86n2 PASS + Chromium 3/3 PASS (trên #117 ứng viên).** **Kẹt cộng dồn GIỮ 28 — 0 kẹt mới.**
2. **O8 T8 3/3 (WebKit 21/21 md5 4f511ce7/aa0892a9; Chromium 21/21 md5 763ec95e — trên #117).** O8 T01 PASS 3/3 trên #117 theo LIMITS T01 (md5 748d7238/58f66a05/575bc079 — T01 ĐÃ ĐÓNG CỜ 21:22Z). **O8 CÙNG BOOT.**
3. **Chuỗi WebKit FULL PASS GIỮ 0 (KHÔNG THỂ: lượt yên #61 0 hợp lệ).** Gate (a) #117 CÓ cờ (caveat); O8 cùng boot; harness 6/6; live-check #12 KHÔNG THỂ KIỂM (chuỗi GIỮ 9).
4. **POSTBOOT_PASS #117 CÓ 20:59:08Z (T56-193, repair-sớm-quyết-h, poll=1, CÓ caveat — GST thư mục thật, nhẹ hơn #115)** — gate (a) #117 ĐẠT có caveat. **POSTBOOT_PASS #116 KHÔNG CÓ** (tổng boot không cờ 26 → 27). **#117 ỨNG VIÊN (T01-193 chưa đóng cờ lúc T8 mở; parent quyết (e)); marker 69 reboot (#49–#117) nếu #117 xác nhận;** (m) #117 thuộc T2-193.
5. **Balloon max 82,2% trần trong cửa sổ harness (n=31, avail min 605 MB, pinned=0)** — thấp hẳn đợt 192 (95,8%); KHÔNG có sampler T9 trong LIMITS này.
6. **85m4-hb128 38.737 B (VƯỢT giới hạn push 969 B) + 86n2-hb128 43.653 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 35.917 B (dư 1.851 B). **LIMITS này DƯỚI giới hạn push (xem stat lúc ghi cờ).**
7. **Chuỗi verdict: 84l10 PASS (chuỗi 0 → 1, khởi động lại); 86n2-P1 không kẹt lần 15; B2 vùng mới sạch lần 7; B1 KHÔNG BẮT gì (0 kẹt — chuỗi live sạch 0 → 1); số chuẩn 31 → 34 (md5-unique).** H3 GIỮ mức ỦNG HỘ MẠNH (giả thuyết trigger cập nhật §D4).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') PHƯƠNG ÁN CHÍNH — replay V2 5/5 @125 s, V1-300 4/5, 0 FP trên 34 log sạch (md5).** V1 chỉ đối chứng. **V4 (f'''') ĐÃ XONG (offline): 3/3 kẹt mù, V2+V4 = 8/8, 0 FP — bật live chờ (j)-193; live đợt này 0 kẹt (maxgap 5–8 s).**
10. **T4-193 ĐÃ ĐÓNG CỜ (21:44Z): lượt yên #61 0 HỢP LỆ (chuỗi GIỮ 0); live #12 KHÔNG THỂ KIỂM (chuỗi GIỮ 9); B2 dữ kiện thứ 5 LẪN LỘN (lần 2 liên tiếp).** T01/T2/T56/P1-193 ĐÃ ĐÓNG CỜ; T9/P2/P3/P4-193 còn chạy lúc T8 đóng.
11. **#117 ỨNG VIÊN (parent quyết (e)); marker 69 reboot nếu xác nhận; (m) #117 thuộc T2-193; POSTBOOT_PASS #117 CÓ (caveat); #116 KHÔNG CÓ cờ.**
12. **T8 ĐÓNG ~22:40Z, TRONG hạn cờ ~23:00Z** (waiter GATE-FOUND 21:45:08Z, harness 21:50–22:06Z, O8 22:08–22:11Z, replay + LIMITS 22:11–22:40Z). 0 reboot trong cửa sổ đo (21:50–22:11Z).

## 8. Sai số mới (F-193-T8-N) + nợ cũ đã xử lý

- **F-193-T8-1 — WAITER APPEND CHƯA KIỂM CHỨNG THỰC TẾ (F-192-T8-1 ĐÃ SỬA CODE):** waiter-193 append thay vì truncate khi khởi động lại — nhưng đợt này **0 reboot** nên chưa có lần khởi động lại nào để kiểm chứng (waiter 60 poll đầy đủ trên đĩa).
- **F-193-T8-2 — KIỂM SCANNER TRƯỚC PHA WEBKIT ĐẦU TIÊN (F-192-T8-3 ĐÃ THỰC HIỆN — CÓ KẾT QUẢ BẤT NGỜ):** scanner + gst-inspect VẮNG ở cả 4 lần kiểm (selfcheck #1 20:45:40Z, selfcheck #2 21:01:15Z, trước pha 21:50:26Z, trong pha 21:51:56Z) — 84l10 vẫn PASS → giả thuyết trigger "thiếu scanner" BỊ YẾU ĐI (xem §D4). Nợ đợt sau: kiểm thêm **dpkg/apt có đang chạy không** ngay trước pha WebKit đầu tiên (hướng điều tra mới).
- **F-193-T8-3 — SYMLINK t8-diag-stall.sh VẪN TRỎ BẢN 189 (KHÔNG ẢNH HƯỞNG):** diff với bản 193 chỉ khác 4 dòng nhãn/path; driver gọi trực tiếp `diag-stall-193t8.sh`. Nợ dọn ở đợt sau.
- **F-193-T8-4 — T4 .done MUỘN 4 PHÚT SO VỚI LIMITS (KHÔNG ẢNH HƯỞNG):** LIMITS xong 21:40Z, .done 21:44Z; waiter GATE-FOUND 21:45:08Z — harness chạy đúng lịch, không chờ tới deadline 22:15Z. Cùng mẫu T2-192.
- **F-193-T8-5 — preview.tsx ĐỔI GIỮA HAI LƯỢT O8 (GHI RÕ):** 50ad3faf (O8 T01) → cf331628 (O8 T8) — luồng sản phẩm sửa file trong lúc T8 chạy; cả hai đều 21/21 PASS. Cùng boot nhưng KHÁC cây source.
- **F-192-T8-1..5: ĐÃ SỬA/ĐÃ LÀM XONG/KHÔNG TÁI DIỄN** (xem F-193-T8-1/2 + §C5/§D4; harness trên boot CÓ POSTBOOT_PASS). **F-191-T8-1/2/3/4: KHÔNG TÁI DIỄN** (waiter kiểm cả t5 lẫn t56; nhãn extract động "ovsize LIMITS 192 = 37.746 B"; ps sót 0/0; 86n2-P5 PASS 0 restart). **F-189-T8-1: ĐÃ SỬA** (nhãn o8-driver "T8-193"). **F-189-T8-2/F-188-T8-1/F-186-T8-2/F-184-T8-1: KHÔNG TÁI DIỄN.** **F-183-T8-7: libevent-2.1.so.7 CÓ trên #117.**
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG.** Dọn `smoke/` khỏi bản copy (192 smoke → `smoke/archive-192/`); replay chạy sạch. **Lưu ý:** extract vẫn liệt kê cả báo cáo O8 stamp cũ đợt 189/191/192 trong `o8-webkit/`/`o8-chromium/` (copy kèm) — LIMITS này chỉ trích số 193 (md5 4f511ce7/aa0892a9/763ec95e).
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-193t8.sh` (cả 6 pha).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS GIỮ 0 (KHÔNG THỂ: lượt yên #61 0 lượt hợp lệ)** — parent/T10 quyết (gate (a) #117 có cờ caveat, O8 cùng boot, harness 6/6, live-check #12 KHÔNG THỂ KIỂM).
2. **B2 vùng mới sạch lần 7; B1 KHÔNG BẮT gì (0 kẹt — chuỗi live sạch 0 → 1)** — parent ghi nhận (giới hạn §C5 đã ghi rõ; biên P6-wait còn 30 s; V4 đã làm xong offline, bật live chờ quyết).
3. **Chuỗi 84l10 PASS 0 → 1 (khởi động lại) + chuỗi 86n2-P1 không kẹt 14 → 15 + số log sạch chuẩn 31 → 34** — parent/T10 quyết (84l10 PASS với scanner VẮNG — giả thuyết trigger cập nhật §D4; 86n2-P1 PASS 21:55:10Z).
4. **V4 (f'''') — parent quyết (j)-193: CÓ BẬT LIVE không?** (V4 3/3 kẹt mù, V2+V4 = 8/8, 0 FP; thay đổi driver 1 dòng — bỏ `grep HB128` ở run-webkit-193t8.sh:135; lưu ý §C5: live đã có (1b) + watchdog — V4 củng cố, không mở vùng hoàn toàn mới).
5. **Giả thuyết trigger kẹt W2-setup — đổi từ "thiếu scanner" sang "cài gói đồng thời"** (parent ghi nhận §D4; nợ đợt sau: kiểm dpkg/apt đang chạy ngay trước pha WebKit đầu tiên).
6. **Reboot #117 (1c0bcaad, btime 20:22:37Z, gap #116→#117 = 14.464 s)** — ỨNG VIÊN (parent quyết (e)); (m) #117 thuộc T2-193; POSTBOOT_PASS #117 CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat); POSTBOOT_PASS #116 KHÔNG CÓ (tổng boot không cờ 26 → 27).
7. **Lượt yên #61 0 LƯỢT HỢP LỆ (chuỗi GIỮ 0); (p) live #12 KHÔNG THỂ KIỂM (chuỗi GIỮ 9); B2 dữ kiện thứ 5 LẪN LỘN (lần 2 liên tiếp)** — T4-193 chi tiết; auto-trigger LIVE (T9-193 phán cuối).
8. **Kẹt 84l10 #28 — ĐIỀU TRA CẬP NHẬT XONG (§D4): "thiếu scanner" BỊ YẾU ĐI; hướng mới là race cài gói đồng thời** — nợ đợt sau: kiểm scanner + dpkg/apt-trước-pha; kẹt lại khi dpkg đang chạy → giả thuyết mới được ủng hộ; kẹt khi dpkg ổn định → cả hai đều bị bác; H3 GIỮ ỦNG HỘ MẠNH.
9. Mở từ trước, vẫn đứng: **#116/#117 KHÔNG GIẾT HOLDER (chuỗi 19 → 20 → 21); (A) 120/120 lần 42; (m) #103 DƯƠNG +37,543 s (parent 185 quyết cuối); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (T2-193); (m) #56 (T2-193); G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần chạy; R9 (a); file oversize 6,4 MB chưa quyết; u2net là fallback; fixture /tmp rebuild 1 lần (md5 khớp đợt 125); KHÔNG PUSH — chờ push = đợt 191 + đợt 192 (T10 đếm cuối).**
10. **F-193-T8-1 (waiter append chưa kiểm chứng thực tế) + F-193-T8-3 (symlink diag trỏ bản 189) + F-193-T8-5 (preview.tsx đổi giữa 2 lượt O8)** — parent ghi nhận; không đổi verdict.
