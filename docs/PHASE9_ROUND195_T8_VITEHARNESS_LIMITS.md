# Đợt 195 T8 — HARNESS 6/6 TRÊN #121; 84l10 PASS LẦN 3 LIÊN TIẾP (CHUỖI 2 → 3); LƯỢT YÊN #63 CÓ LƯỢT HỢP LỆ — FULL PASS CÓ THỂ (T10/parent quyết); V4 GIỮ LIVE 0 FP

Ngày: 26/11/2026 (lượt cron 15:35:51 +07 = 08:35:51Z; T8 mở ~08:41Z, đóng ~10:05Z — **TRONG hạn cờ ~11:00Z**).
Phạm vi: (1) harness hb128 + B1/B2 live trên boot mới nhất; (2) O8 T8 3/3; (3) V2 (f'') replay kẹt @125 s + 0 FP log sạch; (4) V4 (f'''') GIỮ LIVE; (5) điều tra riêng 84l10 (đợt 20) + H3 giám sát thụ động.

## 0. Kết luận ngắn — 6/6; 0 KẸT MỚI; LƯỢT YÊN #63 CÓ LƯỢT HỢP LỆ; FULL PASS CÓ THỂ; V4 GIỮ LIVE 0 FP

- **MỌI PHÉP ĐO CÙNG BOOT #121.** Boot #121 ứng viên `8c4aa907` (btime 08:22:05Z, gap #120→#121 = 14.320 s; T01-195 xác minh). **0 reboot trong phiên đo** (btime vẫn 1795681325 lúc đóng 09:59Z).
- **POSTBOOT_PASS #121 CÓ 08:51:26Z** (T56-195; poll=0, replay-day-du; GST thư mục thật). Gate (a) ĐẠT.
- **Lượt yên #63: CÓ LƯỢT HỢP LỆ (T4-195, LIMITS 44.762 B, .done 09:35Z)** — attempt3 HỢP LỆ (20/20 + lớp B 5/5 + tickCost median 53,0 ms ≤ 60). **Chuỗi lượt yên hợp lệ 0 → 1 (lượt hợp lệ ĐẦU TIÊN kể từ #59 đợt 191).** Attempt1 20/20 + B 5/5 nhưng median 78,0 ms > 60; attempt2 PAGE-WEDGED (exit=2, không tính verdict).
- **HARNESS 6/6 trên #121 (09:36:56–09:53:01Z): WebKit 84l10/85m4/86n2 PASS + Chromium 3/3 PASS; live_diags=0; WATCHDOG-137 ×0.** Kẹt cộng dồn **GIỮ 28 (0 kẹt mới)**. **84l10 PASS — chuỗi 2 → 3. 86n2-P1 không kẹt: lần 17** (P1 PASS 09:41:46Z).
- **O8 T8 3/3 trên #121** (09:53:29–09:56:12Z): WebKit ×2 **21/21 PASS** (md5 `2bd6cec1`/`97be0b44`) + **Chromium 21/21 PASS (md5 `c63d819e`)**. **O8 T01 3/3 trên #121** (08:43:23–08:46:54Z): WebKit 21/21 ×2 (md5 119247a9/7546bc35) + Chromium 21/21 (md5 39da0643) — **O8 CÙNG BOOT, CÙNG CÂY** (preview 591f9655 + media 14baf831, không đổi cả đợt).
- **FULL PASS: CÓ THỂ — 5 chân đều đạt:** gate (a) #121 CÓ cờ; chân (b) #63 hợp lệ; harness 6/6; O8 3/3 ×2 cùng boot cùng cây; **live-check #14 ĐẠT (T4 — chuỗi live ĐẠT 9 → 10)**. T10/parent quyết cuối (chuỗi 0 → 1 nếu chấp nhận).
- **B2 VÙNG MỚI SẠCH LẦN 9** (setup/startPlaying/P6-wait 0 trigger; check-fresh live 6/6 OK, maxspan 85 s, maxgap 7–11 s; P6-wait tối đa elapsed=90 s — biên 30 s dưới ngưỡng 120 s). **Dữ kiện thứ 7 cho T4: LẪN LỘN (lần thứ 4 liên tiếp — T4-195) — luật B2 KHÔNG TÁCH VẪN ĐỨNG.**
- **B1: 0 kẹt đợt này — B1 KHÔNG BẮT gì (không có kẹt để bắt); chuỗi live sạch 2 → 3.**
- **V2 (f'') phương án chính — replay: V2 bắt 5/5 kẹt @125 s (164/171/178/183/188), 0 FP trên 40 log sạch duy nhất theo md5** (42 entry; 195 đóng góp 3 log sạch mới: 195-sach-84l10 md5 `5327a2b5`, 195-sach-85m4 md5 `02a429cb`, 195-sach-86n2-hb128 md5 `e760c72e`); **V1-300 đối chứng: 4/5** (164/178/188 @125 s, 171 @305 s; lỡ 183). **Số log sạch chuẩn (md5-unique): 37 → 40.**
- **V4 (f'''') GIỮ LIVE — live 0 trigger, 0 FP; replay V4 3/3, V2+V4 = 8/8, 0 FP.** Rollback 1 đợt nếu FP/kẹt sót — chưa cần.
- **84l10 — "THIẾU SCANNER" CÀNG YẾU (§D4):** PASS lần 3 liên tiếp với scanner VẮNG (trước + giữa + sau pha) **và** dpkg yên (1477 dòng ổn định, apt cuối 08:37:34Z), 0 GStreamer-WARNING. **NHƯNG gst-inspect-1.0 nay CÓ (cài 08:37:34Z)** — caveat, xem §D4. "Cài gói đồng thời" vẫn CHƯA CÓ ca thuận mới (chỉ ca 192). H3 GIỮ ỦNG HỘ MẠNH.
- **F-195-T8-1..6 mới (xem §8).** F-194-T8-7 ĐÃ SỬA (kiểm scanner giữa pha); F-194-T8-2/4/5 CHƯA SỬA (vẫn mở).

## 1. Dòng thời gian (gọn)

- 08:22:05Z **#121** (8c4aa907, ỨNG VIÊN — T01-195, gap #120→#121 = 14.320 s). 08:35:51Z Đợt 195 mở. 08:37:34Z **apt cài gstreamer1.0-tools** (os-intent replay, host/runtime — không phải T5/T8) — gst-inspect CÓ từ đây; **dpkg.log reset ở boot #121** (mọi dòng 08:35:42–08:37:34Z).
- 08:41–08:45Z T8 mở: đọc aggregate 194 §14.2 (bản parent-chấp-nhận, 56.089 B); copy driver 194→195 + đổi nhãn; **dọn `smoke/` (194 → `smoke/archive-194/`)**; **0 symlink Singleton\* stale**; probe S1 CÓ SẴN (md5 `453d1082`).
- 08:45:02Z Selfcheck #1 trên #121: libs 6/6 CÓ, plugin dir 269, dpkg 1477, balloon 4.038.900 kB, avail 1732 MB; scanner VẮNG, gst-inspect CÓ (1624 dòng). 08:45:59Z Waiter khởi động (deadline 10:15Z). 08:51:26Z **POSTBOOT_PASS #121 CÓ** (T56-195).
- 09:10:07Z T4 attempt1 chạy (cửa yên mở poll #36 — load5 < 2 sau 26 phút poll vì tải nền cao); 09:13:53Z attempt1 xong exit=0; 09:14:16Z attempt2; 09:17:52Z attempt3; **09:21:58Z attempt3 xong exit=0 (20/20 + B 5/5 + median 53,0 ms — HỢP LỆ, poller thoát)**. 09:24:30Z **rebuild fixture xong** (md5 khớp đợt 125). 09:35Z T4 .done; **09:36:05Z waiter GATE-FOUND poll=51** (t4=OK, postboot đường (a), t4attempt=no-lock).
- **09:36:56–09:53:01Z HARNESS 6/6** (driver pid 194557, boot #121). **09:53:29–09:56:12Z O8 T8 3/3.** 09:57–10:05Z replay + extract + LIMITS + paths + cờ. **T8 đóng ~10:05Z, TRONG hạn cờ ~11:00Z.**

## A. O8 — T8 3/3 + T01 3/3, CÙNG BOOT #121, CÙNG CÂY

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #121 | **21/21 PASS** — exit=0 09:54:24Z, JSON n=21 ok=21, md5 `2bd6cec1`, S1 PASS 09:53:42Z |
| 2 | O8 T8 WebKit attempt2 trên #121 | **21/21 PASS** — exit=0 09:55:21Z, JSON n=21 ok=21, md5 `97be0b44`, S1 PASS 09:54:36Z |
| 3 | O8 T8 Chromium trên #121 | **21/21 PASS** — exit=0 09:56:12Z, JSON n=21 ok=21, md5 `c63d819e`, S1 PASS 09:55:40Z |
| 4 | O8 T01 WebKit attempt1 trên #121 | **21/21 PASS** (md5 119247a9, S1 PASS 08:43:42Z, exit=0 08:44:32Z) |
| 5 | O8 T01 WebKit attempt2 trên #121 | **21/21 PASS** (md5 7546bc35, S1 PASS 08:44:49Z, exit=0 08:45:40Z) |
| 6 | O8 T01 Chromium trên #121 | **21/21 PASS** (md5 39da0643, exit=0 08:46:54Z) |

- O8 log T8: S1 PASS 6, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0. **Gate cho boot đo `8c4aa907` (#121 ứng viên): (a) CÓ — POSTBOOT_PASS #121 08:51:26Z (replay-day-du, GST thư mục thật).**
- **Cây KHÔNG ĐỔI cả đợt: `preview.tsx` 591f9655; `media.ts` 14baf831; `vite.config.ts` ee80d093** — O8 T01 (08:43Z), harness (09:36Z) và O8 T8 (09:53Z) đều chạy trên CÙNG CÂY (khác đợt 194: cây đổi 2 lần trước phép đo). **T01-195 CHƯA ĐÓNG CỜ lúc T8 viết LIMITS** — số O8 T01 lấy trực tiếp từ log + JSON trên đĩa của T01 (đã xác minh md5), chưa qua LIMITS T01.

## 2. Kết quả harness — 6/6; WebKit 3/3 PASS; Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 09:36:56–09:38:18 | **PASS** — W1 ×3 PASS 09:37:13/17/23Z + W2 PASS 09:37:57Z + E4 PASS 09:38:09Z, live_diags=0 |
| 2 | WebKit 85m4 | 0 | 09:38:33–09:40:54 | **PASS** — P1 PASS 09:39:11Z + P5 PASS 09:40:47Z, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 09:41:10–09:45:11 | **PASS** — P1 PASS 09:41:46Z + P5 PASS 09:43:22Z + P6 KHÔNG-KẸT 09:45:04Z, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 09:45:26–09:46:27 | **PASS** — W1-lần1 PASS 09:45:38Z + E4 PASS 09:46:24Z, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 09:46:42–09:48:54 | **PASS** — P1 PASS 09:47:19Z + P5 PASS 09:48:48Z, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 09:49:09–09:53:01 | **PASS** — P1 PASS 09:49:41Z + P5 PASS 09:51:08Z + P6 KHÔNG-KẸT 09:52:52Z, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 28 — 0 kẹt mới.** **84l10 PASS đợt này — chuỗi 2 → 3.** **86n2-P1 không kẹt: lần 17** (P1 PASS 09:41:46Z).
- RAM sampler (n=33, suốt harness): balloon min 4.033.840 / max 5.206.144 kB (**80,8% trần, pinned=0**), avail min 787 MB (09:44:54Z) / max 1823 MB. Cao hơn đợt 194 (67,3%), thấp hơn đợt 193 (82,2%) — xem F-195-T8-2.
- GATE-CHECK trước MỖI pha (bài học F-191-T10-2): 6/6 lần ghi "T4 khong giu lock" (load5 1,02 / 1,33 / 1,96 / 1,74 / 1,56 / 3,13) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 09:21:58Z; lock TRỐNG suốt harness). O8 cũng có GATE-CHECK trước acquire (T4 không giữ lock, load5=1,91). **0 vi phạm phía T8.** (Lưu ý: load5 pha 6 = 3,13 — T4 đang viết LIMITS, không giữ lock; không tính vi phạm.)

# §C — B2 LIVE LẦN 9: VÙNG MỚI SẠCH TIẾP; B1 KHÔNG BẮT GÌ (0 KẸT); V4 (f'''') GIỮ LIVE

## C1. Trạng thái B2 đợt này (KHÔNG đổi script — B2 đã trong 3 script từ đợt 186)

- 3 script harness giữ nguyên md5 đợt 186–194: 84l10 `16e5e957` (35.917 B), 85m4-hb128 `3fb2548b` (**38.737 B — VƯỢT giới hạn push, cần `ENABLE_PRIVSEP=0`**), 86n2-hb128 `de925614` (**43.653 B — VƯỢT, cần `ENABLE_PRIVSEP=0`**). `node --check` PASS cả 3 (không sửa đợt này).
- **Mẫu bọc + ngưỡng giữ nguyên:** ngưỡng 120 s, run_len ≥3, (e)/(f), ngân sách diag (≤2/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. **V2 (f'') vẫn là phương án chính live; V4 (f'''') GIỮ LIVE (quyết (j)-194).**

## C2. Kiểm chứng offline TRƯỚC harness (check-fresh-195t8.py trên 6 log tổng hợp đợt 186)

| Ca | Log tổng hợp | check-fresh-195t8.py (V2 + V4 live) |
|---|---|---|
| B2-1 setup treo 150 s | `planb-b2-setup-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-2 startPlaying treo 150 s | `planb-b2-startplaying-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-3 P6-wait treo 150 s + WATCHDOG-137 @60 s | `planb-b2-p6wait-150s-wd.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-4 P6 seeking-kẹt 150 s, KHÔNG watchdog | `planb-b2-p6wait-150s-nowd.log` | OK maxspan=150 s wd=0 maxgap=5 s — **KHÔNG trigger (giới hạn đã biết, §C5)** |
| B2-5 P6 sạch 90 s | `planb-b2-p6-clean-90s.log` | OK maxspan=85 s wd=0 maxgap=5 s — **không FP** |
| B2-6 setup sạch 60 s | `planb-b2-setup-clean-60s.log` | OK maxspan=55 s wd=0 maxgap=5 s — **không FP** |

- **Kết luận offline: ĐẠT (khớp hệt §C2 đợt 186–194).** Cả 3 vùng B2 mới đều trigger đúng @125 s khi treo thật; không FP trên 2 ca sạch. V4 không đổi kết quả 6 ca này (B2-4 maxgap=5 s — giới hạn đã biết).

## C3. Kiểm live (harness 6/6 đợt này — script B2 là script harness)

| Vùng B2 | WebKit 84l10 | WebKit 85m4 | WebKit 86n2 | Chromium 84l10 | Chromium 85m4 | Chromium 86n2 |
|---|---|---|---|---|---|---|
| `setupProject setup` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `startPlaying start` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `P6-wait wait` | — | — | **18 dòng** (elapsed 5→90 s) | — | — | **18 dòng** (elapsed 5→90 s) |
| check-fresh live | OK maxspan=0 s wd=0 maxgap=9 s | OK maxspan=5 s maxgap=11 s | OK maxspan=85 s maxgap=7 s | OK maxspan=0 s maxgap=7 s | OK maxspan=10 s maxgap=10 s | OK maxspan=85 s maxgap=8 s |

- **B2 VÙNG MỚI SẠCH LẦN 9** — chưa bắt kẹt thật ở vùng mới (setup/startPlaying/P6-wait 0 trigger; P6-wait tối đa elapsed=90 s — biên 30 s dưới ngưỡng 120 s). **Dữ kiện thứ 7 cho T4: LẪN LỘN (lần thứ 4 liên tiếp — T4-195) — luật B2 KHÔNG TÁCH VẪN ĐỨNG (quyết (j)-194).**
- **P6-wait chạy tới elapsed=90 s cả hai engine, maxspan=90 s — biên còn 30 s** (đợt 194: WebKit 85 s, Chromium 85 s — biên 30–35 s). Vẫn dưới ngưỡng 120 s, KHÔNG FP.
- **Maxgap live 7–11 s (194: 12–14 s)** — vite nhanh hơn đợt trước; biên >100 s, KHÔNG FP. **V4 live 0 trigger đợt này — ĐÚNG (không có kẹt, không có im lặng dài).**
- **Replay sau live (3 entry sạch mới, 0 entry kẹt mới):** 195-sach-84l10 6 dòng HB128, max run span 0 s; 195-sach-85m4 19 dòng, max run span 5 s; 195-sach-86n2-hb128 39 dòng, max run span **85 s** (run_len=18, playhead=30 ct=30), KHÔNG kích hoạt mọi phương án — **P6-wait không gây FP ngay cả trong replay** (biên 35 s).

## C4. Replay V1/V2 sau O8 (replay-1c-195t8.py + replay-f-fix-195t8.py — đã thêm 3 entry `195-*`, KHÔI PHỤC 3 entry `194-*` — xem F-195-T8-1)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 40 log sạch duy nhất theo md5** (42 entry sạch; 2 cặp trùng byte-identical 181/182 — xem dưới). Đợt 195 đóng góp 3 log sạch mới + 0 log kẹt mới.
- **Kẹt theo từng phương án: (c') V0: 164@125 s, 178@125 s, 188@125 s (3/5; lỡ 171, 183); V2 (f''): 164/171/178/183/188 @125 s (5/5, KỊCH BẢN CHÍNH); V1-300: 164/178/188 @125 s + 171 @305 s (4/5; lỡ 183); V1-60: 171/178/188 (3/5; lỡ 164, 183).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (5/5 kẹt @125 s, FP 0); **V1-300 ĐẠT** (4/5, FP 0) — V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 40 log sạch duy nhất (md5).**
- **F-184-T8-1: KHÔNG TÁI DIỄN:** 0 NO-FILE trong cả hai lần chạy replay (50 entry replay-f-fix + 52 entry replay-1c đều có file).
- **Số log sạch chuẩn (md5-unique): 17/17/19/21/23/25/27/29/31/34/37/40 (183/184/185/186/187/188/189/191/192/193/194/195 — 190 VOID, không đóng góp).** Hai cặp trùng: 181/182-sach-85m4 (md5 `166b271d`) + 181/182-sach-86n2-hb128 (md5 `e11c62cb`) — byte-identical, đã biết từ đợt 187. 0 FP không đổi theo cả hai cách đếm.
- **Biên an toàn (không đổi sau B2):** log sạch max identical-run span **90 s** (run P6-wait — ngưỡng 120 s → biên 30 s).

## C5. V4 (f'''') QUY TẮC IM LẶNG — GIỮ LIVE ĐỢT NÀY (QUYẾT (j)-194)

- **Thay đổi driver đợt này: KHÔNG** — driver giữ nguyên bản 194 (V4 live từ 194; check-fresh chạy **MỖI POLL (10 s)** kể cả khi log chưa có dòng HB128). Rollback 1 đợt nếu FP/kẹt sót — chưa cần.
- **Bằng chứng live đợt này: 0 trigger, 0 FP.** 6 pha harness đều live_diags=0, 0 WATCHDOG-137, 0 FRESH-CONTENT, 0 LIVE-DIAG; maxgap live 7–11 s (biên >100 s dưới ngưỡng 120 s). **V4 chạy live đợt thứ hai mà không gây FP — rollback CHƯA CẦN.**
- **Bằng chứng replay đợt 195 (replay-f-fix-195t8.py — mục ĐÁNH GIÁ V4): V4 bắt 3/3 kẹt mù** (179 gap 723 s; 180 gap 718 s; 192 gap 793 s); **0 FP trên 42 log sạch** (max gap sạch 97 s — cửa P5→P6 chờ 90 s + ~7 s chuyển pha, chỉ ở log 86n2 trước đợt 186; từ 186 gap ≤ 11 s; **biên V4 = 23 s**). **V2+V4 = 8/8 kẹt, 0 FP.**
- **Giới hạn còn lại (trung thực):**
  - V4 cần ≥ 1 dòng timestamp trong log (pha chưa log dòng nào thì không đo được — vite không lên là lỗi khác, driver timeout 900 xử lý).
  - **Nói đúng giá trị live của V4:** live đã có (1b) mtime-silence + WATCHDOG-137 — chính hai thứ này đã bắt #28 live (diag live 2/2 đợt 192). V4 KHÔNG mở vùng phủ sóng hoàn toàn mới live; V4 củng cố bằng cách đo im lặng trên **dòng timestamp** (không bị reset bởi dòng không-timestamp như khối browser-stderr `[pid=...]`) + cho bằng chứng replay 8/8. **Bằng chứng đợt 194 (§C2): với driver cũ, kẹt type-A (192, 180) KHÔNG BAO GIỜ được gọi check-fresh live — V4 live ĐÓNG ĐÚNG lỗ hổng F-192-T8-4.**
  - B2-4 (P6 seeking-kẹt không watchdog) VẪN KHÔNG bắt được (có HB128 mỗi 5 s, maxgap=5 s) — giới hạn đã biết, đứng nguyên.
  - Nhãn echo live vẫn ghi "FRESH-CONTENT-189 (f''-V2)" ngay cả khi trigger via=silence — cosmetic, xem F-194-T8-4. run-chromium-195t8.sh:122 vẫn còn điều kiện grep HB128 (bản sao KHÔNG CHẠY — xem F-194-T8-5).
- **B2 đã bắt kẹt thật đầu tiên đợt 188 (P5, vùng chung)** + kẹt #28 đợt 192 (84l10 W2, qua watchdog) — nhưng chưa bắt kẹt thật nào ở vùng mới (setup/startPlaying/P6-wait). Bằng chứng bắt thật ở vùng mới thuộc ca kẹt tới.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 20 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173) + KẸT #28 (§D4, CẬP NHẬT ĐỢT 195)

## D1–D2. Phạm vi + Q3: 84l10 qua 5 điểm kẹt cũ (157 E4 :457; 170 W2 :433; 171 W2-setup :425; 178 W2-setup :443; 192 W2-setup :423) + ca 193/194/195 W2-setup PASS (§D4); 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 PASS (exit 0, 09:38:18Z), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 195: **CÓ dữ liệu mới (§D4)**. **Chuỗi PASS: 2 → 3.** Tần suất: **5 ca / 36 đợt ≈ 14%** (157, 170, 171, 178, 192).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Ca 192 là setup W2 đóng băng — cùng họ "vòng poll đóng băng" với 170/171/178. Ca 193/194/195 W2-setup chạy qua bình thường (195: W1-lần1 PASS 09:37:13Z, W2 PASS 09:37:57Z, E4 PASS 09:38:09Z).
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (§D4):** 84l10 PASS lần 3 liên tiếp với scanner VẮNG **và** dpkg yên — **nghiêng về phía engine/thời điểm, không còn nghiêng hệ thống như đợt 192 — NHƯNG gst-inspect nay CÓ (caveat §D4).** Chromium cùng pha PASS sạch trên cùng boot (như mọi đợt).
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 195: không có kẹt — W2 chạy, E4 PASS** (media chạy bình thường).
- **Q4 — Race evaluate/GStreamer?** **BẰNG CHỨNG MỚI:** 0 GStreamer-WARNING + 0 plugin-loader trong cả 3 log WebKit — **không có dấu hiệu race đợt này.**
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ sáu, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; kiểm `gst-plugin-scanner` + `gst-inspect-1.0` + **dpkg/apt có đang chạy không** ngay trước khi chạy pha WebKit đầu tiên + giữa pha (nợ F-194-T8-7 — **ĐÃ LÀM đợt này, giữ lại cho các đợt sau**).

## D4. KẸT #28 — CẬP NHẬT ĐỢT 195: "THIẾU SCANNER" CÀNG YẾU (LẦN 3); MÔI TRƯỜNG ĐỔI — GST-INSPECT NAY CÓ

- **Đối chiếu 192 ↔ 193 ↔ 194 ↔ 195 (cùng pha, cùng dạng boot, khác kết quả):**

| | Đợt 192 (KẸT #28) | Đợt 193 (PASS) | Đợt 194 (PASS) | Đợt 195 (PASS) |
|---|---|---|---|---|
| Boot | #116 4dda8234, btime 16:21:33Z | #117 1c0bcaad, btime 20:22:37Z | #119 55c9e0b7, btime 02:28:08Z | #121 8c4aa907, btime 08:22:05Z |
| Scanner trước pha | VẮNG (selfcheck 16:26:22Z) | VẮNG (selfcheck 20:45:40Z + kiểm lại 21:50:26Z) | VẮNG (selfcheck 02:52:49Z + kiểm lại 03:53:23Z + sau pha VẮNG) | VẮNG (selfcheck 08:45:02Z + trước pha 09:36:45Z + sau pha 09:57:12Z) |
| Scanner trong pha | VẮNG lúc kẹt; CÓ lúc 16:48Z (sau pha) | VẮNG lúc 21:51:56Z (giữa pha) | (không kiểm giữa pha — F-194-T8-7) | **VẮNG lúc 09:38:38Z (giữa pha WebKit 85m4) — F-194-T8-7 ĐÃ SỬA** |
| gst-inspect-1.0 | VẮNG | VẮNG | VẮNG | **CÓ (cài 08:37:34Z, trước pha ~59 phút)** |
| GStreamer-WARNING plugin loader | **1×, 16:31:57Z (5 s sau khi pha khởi động)** | **0×** | **0×** (cả 3 log WebKit) | **0×** (cả 3 log WebKit) |
| dpkg.log trong lúc pha | **2 → 530 → 1.446 → 1.468 (replay đang cài gói ĐỒNG THỜI)** | **768 ổn định từ 20:59Z (trước pha ~52 phút)** | **777 ổn định (0 apt/dpkg process trước pha 03:53:23Z; hoạt động apt cuối 02:50:53Z — ~63 phút trước pha)** | **1477 ổn định (0 apt/dpkg trước/giữa/sau pha; apt cuối 08:37:34Z — ~59 phút trước pha; dpkg.log RESET ở boot #121 — so sánh số dòng xuyên boot vô nghĩa, F-195-T8-4)** |
| Kết quả W2-setup | Kẹt tại runEngine:423, 0 dòng HB128, exit 124 | W1-lần1 PASS 21:50:59Z, HB128 W2 từ 21:51:16Z, E4 PASS, exit 0 | W1-lần1 PASS 03:53:58Z, HB128 W2 chảy, E4 PASS 03:55:35Z, exit 0 | W1-lần1 PASS 09:37:13Z, W2 PASS 09:37:57Z, E4 PASS 09:38:09Z, exit 0 |

- **Kết luận cơ chế (cập nhật): thiếu scanner KHÔNG ĐỦ gây kẹt** — 3 ca PASS liên tiếp với cùng điều kiện vắng scanner (193, 194, 195), 1 ca kẹt. **CAVEAT MỚI:** gst-inspect-1.0 nay CÓ (trước đây VẮNG cả 3 đợt 192/193/194) — nếu "thiếu scanner" hiểu rộng là "thiếu bộ công cụ GStreamer", ca PASS này KHÔNG còn là bằng chứng phản bác thuần túy; chỉ riêng `gst-plugin-scanner` vẫn vắng trong cả 3 ca PASS. **Giả thuyết "cài gói đồng thời" (ghi nhận (j)-193): đợt này KHÔNG CÓ ca kẹt mới để kiểm thuận** — chỉ có thêm 1 ca PASS với dpkg yên, phù hợp với giả thuyết nhưng không chứng minh nó. **Phép thử phân biệt vẫn đứng:** kẹt khi dpkg đang chạy → ủng hộ giả thuyết mới; kẹt khi dpkg yên → cả hai đều bị bác. **H3 GIỮ mức ỦNG HỘ MẠNH** (0 kẹt đợt này không bác H3).
- **Nợ đứng:** chỉ 1 ca kẹt + 3 ca pass có trigger đo được — chưa đủ dữ kiện khẳng định tuyệt đối (cần ≥2 ca kẹt có kiểm scanner + dpkg-trước-pha, hoặc 1 ca kẹt tái diễn khi dpkg đang chạy).

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 195 (0 KẸT MỚI — KHÔNG CÓ BẰNG CHỨNG MỚI)

## B1. Trạng thái giả thuyết sau đợt 195

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — 0 kẹt đợt này; avail min 787 MB trong harness, balloon max 80,8% trần.
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH (GIỮ mức đợt 194)** — 0 kẹt mới; §D4 cập nhật trigger nhưng không đổi mức H3.
- Đợt 195 T8: **0 kẹt trong 3 lần chạy harness WebKit + 3 lần Chromium + 3 lần O8 T8** (O8 T01 PASS 3/3 trên #121). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS, lần thứ 17.**

# §E — CHECKLIST (o) ĐỢT 195 (gọn — chỉ mục đổi so với đợt 194)

- o1. F-186-T0-1 (#106 chưa xác minh) — ĐÃ QUYẾT (e) đợt 186: cea79500 = #107.
- o2. Kết cục run 198 + run lượt này thuộc T7-195 (xem LIMITS T7-195; run 196 SUCCEEDED cf 117 s — CA #25, họ 25/22; run 197 SUCCEEDED cf 8 s — KHÔNG CA).
- o3. F-185-T1-1 (prose §112) — ĐÃ SỬA XONG đợt 186.
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 787–1823 MB trong harness; balloon max 80,8% trần, pinned=0.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; T4-195: lượt yên #63 CÓ LƯỢT HỢP LỆ (chuỗi 0 → 1); live #14 ĐẠT (chuỗi 9 → 10); B2 dữ kiện thứ 7 LẪN LỘN (lần 4 liên tiếp).
- o6. F-181-T4-3 (X193) — ĐÃ ĐÍNH CHÍNH: X193 là Xvfb của chính probe T4. X11 lúc T8 đóng: **3 file (X193, X195, X196)** — không file nào của T8 (:189 đã dọn). Xem §6.
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; POSTBOOT_PASS #121 CÓ 08:51:26Z (replay-day-du); #120 thuộc T56-195.
- o8–o10. F-181-T5-2 (ledger ts) + F-180-T5-3 (lệch btime) + F-174-T5-6 — GHI NHẬN (#121 CÓ cờ, GST thư mục thật).
- o11–o13. F-181-T6-1 + F-180-T6-4 + F-180-T6-5 — GHI NHẬN; T56-195 ĐÃ ĐÓNG CỜ (xem LIMITS T56-195); #120 thuộc T56-195.
- o14–o16. F-181-T7-1 (OUTAGE 8.406 s — T7-195 phán cuối) + F-180-T7-4 + F-180-T7-5 — GHI NHẬN; xem LIMITS T7-195.
- o17. F-185-T8-4 (stat sai marker) — **ĐÃ SỬA (T0-186)** — marker 71 reboot (#49–#119) nếu #119 xác nhận (T01-194); #121 thuộc T01-195.
- o18. Quyết (o) 194 — GHI NHẬN; auto-trigger live thuộc T9-195 (CHƯA ĐÓNG CỜ lúc T8 viết LIMITS).
- o19. Quyết (l) 152 — ĐÃ THỰC HIỆN: marker 71; **T8 đóng ~10:05Z, TRONG hạn cờ ~11:00Z**.
- o20. Quyết (j) 194 — **ĐÃ THỰC HIỆN (§2, §C, §D4, §F, §B, §C5)** — B2 sạch lần 9; V2 replay 5/5 @125 s, V1-300 4/5; **V4 (f'''') GIỮ LIVE — live 0 trigger 0 FP, replay V4 3/3, V2+V4 = 8/8**; **84l10 PASS — chuỗi 2 → 3; B1 live sạch 2 → 3; số log sạch chuẩn 37 → 40; B2 dữ kiện thứ 7 LẪN LỘN (lần 4 liên tiếp) — KHÔNG TÁCH; live-check #14 ĐẠT (chuỗi 9 → 10); lượt yên #63 HỢP LỆ (chuỗi 0 → 1) — FULL PASS CÓ THỂ**.
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (T2/T4/T56/T7-195 ĐÃ ĐÓNG CỜ; T01/T9-195 CHƯA ĐÓNG CỜ lúc T8 viết LIMITS).

# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 195 — DỪNG** (đã PASS 5 lần liên tiếp; đợt này 84l10 PASS nên càng không cần). **Mở lại nếu kẹt setup tái hiện mà diag live không đủ bằng chứng.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy). **Chi phí B2 giữ nguyên:** 85m4-hb128 38.737 B (VƯỢT 969 B); 86n2-hb128 43.653 B (oversize); 84l10 35.917 B (dư 1.851 B).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` **591f9655 (KHÔNG ĐỔI cả đợt)**; `media.ts` **14baf831 (KHÔNG ĐỔI)**; `vite.config.ts` ee80d093; `84l10` **16e5e957 (B2, KHÔNG ĐỔI)**; `85m4-hb128` **3fb2548b (B2, KHÔNG ĐỔI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` de925614 (B2, KHÔNG ĐỔI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). **T8 KHÔNG đổi file code sản phẩm đợt này** (chỉ script làm việc + LIMITS này).
- **Working dir `repo-1/hidden_files/round195-t8/`** — copy `cp -r` 194→195 (exit 0). **Đổi nhãn đúng** (194t8→195t8, waiter deadline → 10:15Z 26/11, lock ticket t8-round195) — grep: chỉ còn tham chiếu 194 trong khối LOGS đóng băng của replay (3 entry `194-*` — đã khôi phục, F-195-T8-1) + nhãn lịch sử (LIVE-DIAG-189/FRESH-CONTENT-189). **V4: driver GIỮ NGUYÊN bản 194 (không đổi dòng nào); header check-fresh/replay cập nhật V4 GIỮ LIVE (quyết (j)-194).**
- Extract (dùng lại): trích ĐÚNG số harness (6/6 exit=0, live_diags=0) + O8 (webkit 21/21 md5 2bd6cec1/97be0b44, chromium 21/21 md5 c63d819e) + sampler n=33 + WATCHDOG-137: 0.
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** 0 symlink Singleton\* stale lúc copy (3 symlink cũ trong o8-chromium/chrome-userdata đã xóa).
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP)** — `o8-s1-probe-195t8.mjs` md5 `453d1082` (giống hệt 175–195; `node --check` PASS); O8 T8 chạy với probe này (attempt1 PASS nên probe không cần chạy lại — S1 PASS 6, FAIL 0).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round195-t8). **F-181-T8-5: ÁP DỤNG CHO #121** (replay-day-du, poll=0). **F-181-T8-6 (gst-inspect vắng): KHÔNG TÁI DIỄN — gst-inspect nay CÓ (cài 08:37:34Z); scanner vẫn VẮNG.** **F-181-T8-7: ĐÃ QUYẾT (c) đợt 191 (tổng 27 → 28 — #120 thuộc T56-195). F-181-T8-8 (log stale): VẪN CÒN — đợt này KHÔNG tái diễn.**
- **Symlink t8-diag-stall.sh: ĐÃ SỬA (F-195-T8-6)** — nay trỏ `diag-stall-195t8.sh` (09:57Z).

## 6. Dọn dẹp + kiểm cuối — 0 REBOOT TRONG PHIÊN ĐO

- Driver harness đã thoát sau pha cuối (09:53:01Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng). O8 driver đã nhả lock 09:56:12Z. **Không lock stale nào** (vite TRỐNG — extract xác nhận).
- Kiểm cuối: process Xvfb/MiniBrowser/WebKit sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` còn **3 file (X193, X195, X196)** — X193 là Xvfb của probe T4 (F-181-T4-3); **không file nào là của T8** (:189 đã dọn). ps sót T8 0, clicktest T8 0.
- Fixture /tmp: **ĐÃ REBUILD 1 LẦN** (#121 09:24:30Z — md5 khớp đợt 125) — vẫn còn lúc đóng.
- **Reboot #121 (boot `8c4aa907`, btime 08:22:05Z, gap #120→#121 = 14.320 s):** xảy ra TRƯỚC khi T8 mở (đợt 195 mở 08:35:51Z). **0 reboot trong cửa sổ đo (09:36–09:56Z).** dpkg.log 1477 dòng (ổn định từ 08:37:34Z — reset ở boot #121). #121 ỨNG VIÊN (parent quyết (e)); POSTBOOT_PASS #121 CÓ (replay-day-du); #120 thuộc T56-195/T2-195 (T8 không phán; POSTBOOT_PASS-55c9e0b7 trong dir T56-195 là cờ #119 cũ được lưu lại).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt; không push. Không chạy script nặng khi T4 attempt (rebuild sau khi poller thoát).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 6/6 — WebKit 84l10/85m4/86n2 PASS + Chromium 3/3 PASS (trên #121 ứng viên).** **Kẹt cộng dồn GIỮ 28 — 0 kẹt mới.**
2. **O8 T8 3/3 (WebKit 21/21 md5 2bd6cec1/97be0b44; Chromium 21/21 md5 c63d819e — trên #121).** O8 T01 PASS 3/3 trên #121 theo log + JSON trên đĩa (md5 119247a9/7546bc35/39da0643 — T01 CHƯA ĐÓNG CỜ lúc T8 viết LIMITS). **O8 CÙNG BOOT, CÙNG CÂY.**
3. **FULL PASS: CÓ THỂ (5 chân đều đạt — T10/parent quyết cuối; chuỗi 0 → 1 nếu chấp nhận).** Gate (a) CÓ cờ; chân (b) #63 hợp lệ (chuỗi 0 → 1); harness 6/6; O8 cùng boot cùng cây; live-check #14 ĐẠT (chuỗi 9 → 10).
4. **POSTBOOT_PASS #121 CÓ 08:51:26Z (T56-195, poll=0, replay-day-du, GST thư mục thật)** — gate (a) ĐẠT; #120 thuộc T56-195/T2-195.
5. **Balloon max 80,8% trần (n=33, avail min 787 MB, pinned=0)** — cao hơn đợt 194 (67,3%), thấp hơn đợt 193 (82,2%); KHÔNG có sampler T9 trong LIMITS này.
6. **85m4-hb128 38.737 B (VƯỢT giới hạn push 969 B) + 86n2-hb128 43.653 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 35.917 B (dư 1.851 B). **LIMITS này DƯỚI giới hạn push (xem stat lúc ghi cờ).**
7. **Chuỗi verdict: 84l10 PASS (chuỗi 2 → 3); 86n2-P1 không kẹt lần 17; B2 vùng mới sạch lần 9; B1 KHÔNG BẮT gì (0 kẹt — chuỗi live sạch 2 → 3); số chuẩn 37 → 40 (md5-unique).** H3 GIỮ ỦNG HỘ MẠNH.
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') PHƯƠNG ÁN CHÍNH — replay V2 5/5 @125 s, V1-300 4/5 (171 @305 s), 0 FP trên 40 log sạch (md5).** V1 chỉ đối chứng. **V4 GIỮ LIVE: 0 trigger, 0 FP — replay V4 3/3, V2+V4 = 8/8; rollback 1 đợt nếu FP/kẹt sót.**
10. **T4-195 ĐÃ ĐÓNG CỜ (09:35Z): lượt yên #63 CÓ LƯỢT HỢP LỆ (chuỗi 0 → 1); live #14 ĐẠT (chuỗi 9 → 10); B2 dữ kiện thứ 7 LẪN LỘN (lần 4 liên tiếp).** T01/T9-195 CHƯA ĐÓNG CỜ lúc T8 viết LIMITS.
11. **T8 ĐÓNG ~10:05Z, TRONG hạn cờ ~11:00Z** (waiter GATE-FOUND 09:36:05Z, harness 09:36–09:53Z, O8 09:53–09:56Z, replay + LIMITS 09:57–10:05Z). 0 reboot trong cửa sổ đo (09:36–09:56Z).

## 8. Sai số mới (F-195-T8-N) + nợ cũ đã xử lý

- **F-195-T8-1 — REPLAY CORPUS MẤT 3 LOG 194 DO ĐỔI TÊN (ĐÃ SỬA, CÓ ẢNH HƯỞNG ĐẾM):** lúc copy 194→195, T8 đổi tên key `194-sach-*` thành `195-sach-*` (thay vì THÊM entry mới như lệ cũ) — corpus mất 3 log 194, đếm sẽ ra 37 thay vì 40. Phát hiện khi đối chiếu script 194; đã khôi phục 3 entry 194-sach-\* (md5 khớp LIMITS 194), chạy lại cả hai replay, đếm lại: 42 entry / 40 duy nhất / 0 NO-FILE. Bài học: entry replay chỉ THÊM, không đổi tên key cũ.
- **F-195-T8-2 — BALLOON MAX 80,8% TRẦN (194: 67,3%):** sampler n=33, balloon max 5.206.144 kB (09:45:24Z), avail min 787 MB (09:44:54Z) — cao nhất kể từ đợt 193 (82,2%). 0 kẹt, 0 FP — không ảnh hưởng verdict. Ghi nhận, theo dõi đợt sau.
- **F-195-T8-3 — T4 GATE MỞ MUỘN (poll #36, 09:10:07Z):** load5 ≥ 2 suốt 08:43–09:10Z do tải nền các luồng sản phẩm — poller T4 chờ 36 poll; waiter T8 chờ 51 poll (GATE-FOUND 09:36:05Z). Harness vẫn xong 09:53Z, trong hạn cờ. Ghi nhận, không đổi quy trình.
- **F-195-T8-4 — DPKG.LOG RESET Ở BOOT #121:** mọi dòng đều 08:35:42–08:37:34Z (cài gstreamer1.0-tools); so sánh số dòng dpkg xuyên boot KHÔNG còn ý nghĩa — từ nay kiểm apt bằng timestamp hoạt động cuối + số dòng trong phiên.
- **F-195-T8-5 — GST-INSPECT-1.0 XUẤT HIỆN (cài 08:37:34Z, os-intent apt replay — không phải T5/T8):** môi trường đo đổi giữa 194→195; scanner (gst-plugin-scanner) vẫn VẮNG. Ghi rõ trong §D4 (caveat cho giả thuyết "thiếu scanner").
- **F-195-T8-6 — SYMLINK t8-diag-stall.sh TRỎ BẢN 194: ĐÃ SỬA.** Nay trỏ `diag-stall-195t8.sh` (09:57Z).
- **F-194-T8-2 — CHECK-FRESH TRẢ OK TRÊN FILE KHÔNG TỒN TẠI (CHƯA SỬA):** vẫn mở (đợt này driver chỉ gọi trên log vừa tạo nên không ảnh hưởng live). Nợ đợt sau: trả lỗi khi file vắng.
- **F-194-T8-4 — NHÃN ECHO LIVE KHÔNG PHÂN BIỆT V2/V4 (COSMETIC, CHƯA SỬA):** driver in "FRESH-CONTENT-189 (f''-V2)" ngay cả khi trigger via=silence. Nợ: đổi nhãn theo via=.
- **F-194-T8-5 — RUN-CHROMIUM-195T8.SH:122 VẪN CÒN GREP HB128 (KHÔNG ẢNH HƯỞNG, CHƯA SỬA):** bản sao driver chromium không chạy nên V4 live không bị chặn; bản sao lệch với driver chính. Nợ: đồng bộ hoặc xóa bản sao.
- **F-194-T8-7 — KHÔNG KIỂM SCANNER GIỮA PHA WEBKIT ĐẦU TIÊN: ĐÃ SỬA ĐỢT NÀY** (kiểm giữa pha 09:38:38Z — VẮNG; trước pha 09:36:45Z VẮNG; sau pha 09:57:12Z VẮNG).
- **F-193-T8-1 — WAITER APPEND CHƯA KIỂM CHỨNG THỰC TẾ (VẪN CHƯA CÓ DỮ KIỆN):** đợt này 0 reboot trong lúc waiter chạy nên vẫn chưa có dữ kiện khởi động lại waiter.
- **F-194-T7-3 / F-193-T7-2 (result_summary lặp câu chuyện điền sẵn):** T8 KHÔNG dùng DB result_summary làm nguồn narrative; nguồn T8 dùng: aggregate 194 §14.2 (56.089 B, bản parent-chấp-nhận).
- **F-192-T8-1..5 / F-191-T8-1/2/3/4 / F-189-T8-1 / F-189-T8-2 / F-188-T8-1 / F-186-T8-2 / F-184-T8-1: ĐÃ SỬA / KHÔNG TÁI DIỄN** (waiter kiểm cả t5 lẫn t56 — GATE-FOUND đường (a); nhãn extract động; ps sót 0/0; 86n2-P5 PASS 0 restart; nhãn o8-driver "T8-195"). **F-183-T8-7: libevent-2.1.so.7 CÓ trên #121.**
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG.** Dọn `smoke/` khỏi bản copy (194 smoke → `smoke/archive-194/`); replay chạy sạch. Extract vẫn liệt kê báo cáo O8 stamp cũ (copy kèm) — LIMITS này chỉ trích số 195.
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-195t8.sh` (cả 6 pha).

## 9. Nợ cho đợt sau / cần quyết parent

1. **FULL PASS CÓ THỂ (5 chân đều đạt — T10/parent quyết cuối; chuỗi 0 → 1 nếu chấp nhận).** Chân (b) #63 hợp lệ (lượt hợp lệ đầu tiên kể từ #59); gate (a) #121 có cờ; O8 cùng boot cùng cây; harness 6/6; live-check #14 ĐẠT (chuỗi 9 → 10).
2. **B2 vùng mới sạch lần 9; B1 KHÔNG BẮT gì (0 kẹt — chuỗi live sạch 2 → 3)** — parent ghi nhận (biên P6-wait 30 s; V4 live 0 trigger 0 FP — rollback chưa cần).
3. **Chuỗi 84l10 PASS 2 → 3 + chuỗi 86n2-P1 không kẹt 16 → 17 + số log sạch chuẩn 37 → 40** — parent/T10 quyết (§D4; 86n2-P1 PASS 09:41:46Z).
4. **V4 (f'''') — parent ghi nhận GIỮ LIVE đợt 195:** driver không đổi; live 0 trigger 0 FP; replay V4 3/3, V2+V4 = 8/8; 0 FP trên 40 log sạch duy nhất. Rollback 1 đợt nếu FP/kẹt sót (chưa cần).
5. **Giả thuyết trigger kẹt W2-setup — "thiếu scanner" CÀNG YẾU (lần 3 liên tiếp) NHƯNG có caveat: gst-inspect nay CÓ** — parent ghi nhận §D4; nợ đợt sau: kiểm scanner + dpkg/apt-trước-pha + giữa pha; H3 GIỮ ỦNG HỘ MẠNH.
6. **Reboot #121 (8c4aa907, btime 08:22:05Z, gap #120→#121 = 14.320 s) — ỨNG VIÊN (parent quyết (e)); (m) #119 THÔ 0 requeue + #120 thuộc T2-195; POSTBOOT_PASS #121 CÓ (replay-day-du); #120 thuộc T56-195.**
7. **Lượt yên #63 CÓ LƯỢT HỢP LỆ (chuỗi 0 → 1); (p) live #14 ĐẠT (chuỗi 9 → 10); B2 dữ kiện thứ 7 LẪN LỘN (lần 4 liên tiếp)** — xem T4-195; auto-trigger LIVE (T9-195 phán cuối).
8. **Kẹt 84l10 #28 — ĐIỀU TRA CẬP NHẬT XONG (§D4): "thiếu scanner" CÀNG YẾU (lần 3); "cài gói đồng thời" chưa có ca thuận mới** — H3 GIỮ ỦNG HỘ MẠNH.
9. Mở từ trước, vẫn đứng: **#118/#119 KHÔNG GIẾT HOLDER (chuỗi 21 → 22 → 23); (A) 120/120 lần 43; (m) #117/#118 CUỐI; CA #25 (run 196 cf 117 s); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần; R9 (a); file oversize 6,4 MB chưa quyết; u2net là fallback; KHÔNG PUSH — chờ push = đợt 191–194 (T10 đếm cuối).**
10. **F-195-T8-1 + F-195-T8-2 + F-195-T8-3 + F-195-T8-4 + F-195-T8-5** — parent ghi nhận; F-194-T8-2/4/5 vẫn mở (không đổi verdict).
