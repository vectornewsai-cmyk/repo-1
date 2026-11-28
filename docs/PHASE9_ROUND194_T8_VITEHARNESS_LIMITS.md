# Đợt 194 T8 — HARNESS 6/6 TRÊN #119 (ỨNG VIÊN): 84l10 PASS LẠI (CHUỖI 1 → 2); V4 (f'''') BẬT LIVE — 0 TRIGGER LIVE, 0 FP; FULL PASS KHÔNG THỂ (LƯỢT YÊN #62 0 HỢP LỆ)

Ngày: 26/11/2026 (lượt cron 09:35:51 +07 = 02:35:51Z; T8 mở ~02:45Z, đóng ~04:45Z — **TRONG hạn cờ ~05:00Z**).
Phạm vi: (1) harness hb128 + B1/B2 live trên boot mới nhất; (2) O8 T8 3/3; (3) V2 (f'') replay kẹt @125 s + 0 FP log sạch; (4) **VIỆC CHÍNH (j)-193: V4 (f'''') BẬT LIVE — bỏ điều kiện grep HB128 ở driver (1 dòng)**; (5) điều tra riêng 84l10 (đợt 19) + H3 giám sát thụ động.

## 0. Kết luận ngắn — 6/6; 0 KẸT MỚI; FULL PASS KHÔNG THỂ (LƯỢT YÊN #62 0 HỢP LỆ); V4 LIVE 0 FP

- **MỌI PHÉP ĐO CÙNG BOOT #119.** Boot #119 ứng viên `55c9e0b7` (btime 02:28:08Z, gap #118→#119 = 14.773 s; T01-194 xác minh 9 nguồn tươi). **REBOOT #120 04:23:25Z — SAU mọi phép đo, trong lúc viết LIMITS (xem §6).** Marker **71 reboot (#49–#119)** nếu #119 xác nhận (T01-194).
- **POSTBOOT_PASS #119 CÓ 02:50:55Z** (T56-194; repair-sớm-quyết-h, poll=1, **CÓ caveat — GST SYMLINK như #115**; dpkg 777, cache 108, lists 75). **POSTBOOT_PASS #118 KHÔNG CÓ** — tổng boot không cờ **27 → 28** (watcher-193 chết theo reboot 22:21:55Z).
- **Lượt yên #62: 0 LƯỢT HỢP LỆ (T4-194, LIMITS 37.758 B, .done 03:51Z)** — a1/a2 20/20 NHƯNG B1+B2 VI PHẠM (load1_max 15,11/5,64; tickCost 220,0/75,0 ms); a3 20/20 + B 5/5 NHƯNG tickCost median **61,0 ms > 60 (thiếu 1,0 ms — giống hệt a2 #61)**. Chuỗi lượt yên hợp lệ **GIỮ 0**. Labellag (b) chuỗi **GIỮ 0** (attempt1 4 occ/1 event KHÔNG tính — attempt không hợp lệ; attempt2/3 0 occ; quyết (m)-192).
- **HARNESS 6/6 trên #119 (03:53:38–04:11:40Z): WebKit 84l10/85m4/86n2 PASS + Chromium 3/3 PASS; live_diags=0; WATCHDOG-137 ×0.** Kẹt cộng dồn **GIỮ 28 (0 kẹt mới)**. **84l10 PASS — chuỗi 1 → 2. 86n2-P1 không kẹt: lần 16** (P1 PASS 03:59:49Z).
- **O8 T8 3/3 trên #119** (04:13:29–04:16:34Z): WebKit ×2 **21/21 PASS** (md5 `6a704a74`/`93cc0ec1`) + **Chromium 21/21 PASS (md5 `bc1746f9`)**. **O8 T01 3/3 trên #119** (03:12:26–03:17:31Z): WebKit 21/21 ×2 (md5 57f5b349/a7952679) + Chromium 21/21 (md5 0ceefe17) — **O8 CÙNG BOOT, CÙNG CÂY** (preview 591f9655 + media 14baf831, đổi 03:05–03:07Z, trước O8 T01).
- **FULL PASS: KHÔNG THỂ — chuỗi GIỮ 0.** Chân (b) gãy (lượt yên #62 0 hợp lệ); 4 chân còn lại đều đạt: gate (a) #119 CÓ cờ (caveat symlink); harness 6/6; O8 3/3 ×2 cùng boot; live-check #13 KHÔNG THỂ KIỂM (T4 — chuỗi live ĐẠT GIỮ 9).
- **B2 VÙNG MỚI SẠCH LẦN 8** (setup/startPlaying/P6-wait 0 trigger; check-fresh live: 84l10 OK maxspan=0 s maxgap=12 s, 85m4 OK maxspan=5 s maxgap=14 s, 86n2 OK maxspan=85 s maxgap=14 s; P6-wait tối đa elapsed=90 s — biên 30 s dưới ngưỡng 120 s). **Dữ kiện thứ 6 cho T4: LẪN LỘN (lần thứ 3 liên tiếp — T4-194) — luật B2 KHÔNG TÁCH VẪN ĐỨNG.**
- **B1: 0 kẹt đợt này — B1 KHÔNG BẮT gì (không có kẹt để bắt); chuỗi live sạch 1 → 2.**
- **V2 (f'') phương án chính — replay: V2 bắt 5/5 kẹt @125 s (164/171/178/183/188), 0 FP trên 37 log sạch duy nhất theo md5** (39 entry; 194 đóng góp 3 log sạch mới: 194-sach-84l10 md5 `9e32764f`, 194-sach-85m4 md5 `adc2a868`, 194-sach-86n2-hb128 md5 `54a76ba0`); **V1-300 đối chứng: 4/5** (lỡ 183). **Số log sạch chuẩn (md5-unique): 34 → 37.**
- **V4 (f'''') BẬT LIVE — VIỆC CHÍNH (j)-193 XONG (§C5): driver bỏ `grep HB128` (1 dòng); live 0 trigger (0 kẹt, maxgap 12–14 s); replay V4 3/3, V2+V4 = 8/8, 0 FP.** Rollback 1 đợt nếu FP/kẹt sót — chưa cần.
- **84l10 — "THIẾU SCANNER" CÀNG YẾU (§D4):** PASS lần 2 liên tiếp với scanner VẮNG (trước + sau pha) **và** dpkg yên (777 ổn định, 0 apt/dpkg, apt cuối 02:50:53Z), 0 GStreamer-WARNING. "Cài gói đồng thời" vẫn CHƯA CÓ ca kẹt thuận mới (chỉ ca 192). H3 GIỮ ỦNG HỘ MẠNH.
- **F-194-T8-1..6 mới (xem §8).** F-193-T8-3 ĐÃ SỬA (symlink t8-diag-stall.sh nay trỏ bản 194); F-193-T8-1/2/4/5 KHÔNG TÁI DIỄN / CHƯA KIỂM CHỨNG ĐƯỢC (xem §8).

## 1. Dòng thời gian (gọn)

- 02:28:08Z **#119** (55c9e0b7, ỨNG VIÊN — T01-194, 9 nguồn tươi). 02:35:51Z Đợt 194 mở (lượt này = run 198). 02:45–02:52Z T8 mở: đọc aggregate 193 §14.2(j) (bản parent-chấp-nhận, 56.830 B) + aggregate 192 §14.2 (bản parent-kiểm, 99.871 B); copy driver 193→194 + đổi nhãn; **dọn `smoke/` (193 → `smoke/archive-193/`)**; **0 symlink Singleton\* stale**; probe S1 CÓ SẴN (md5 `453d1082`).
- 02:50:55Z **POSTBOOT_PASS #119 CÓ** (T56-194, repair-sớm-quyết-h, poll=1, CÓ caveat symlink). 02:52:49Z Selfcheck #1 trên #119: libs 6/6 CÓ, plugin dir 269, dpkg 777, balloon 5.689.984 kB, avail 444 MB; scanner + gst-inspect VẮNG. 02:54:47Z Waiter khởi động (deadline 04:15Z). 02:54:11Z T4 attempt1 chạy; 03:29:23Z attempt2; 03:36:52Z attempt3; **03:41:10Z T4 hết 3/3 attempt, 0 hợp lệ — poller thoát**. 03:48Z **rebuild fixture xong** (md5 khớp đợt 125) — sau khi poller T4 thoát. 03:51Z T4 .done; **03:52:12Z waiter GATE-FOUND poll=58** (t4=OK, postboot đường (a), t4attempt=no-lock).
- **03:53:38–04:11:40Z HARNESS 6/6** (driver pid 322501, boot #119). **04:13:29–04:16:34Z O8 T8 3/3.** 04:16–04:45Z replay + extract + LIMITS + paths + cờ. **REBOOT #120 04:23:25Z trong lúc viết LIMITS.**

## A. O8 — T8 3/3 + T01 3/3, CÙNG BOOT #119, CÙNG CÂY (KHÁC ĐỢT 193)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #119 | **21/21 PASS** — exit=0 04:14:35Z, JSON n=21 ok=21, md5 `6a704a74`, S1 PASS 04:13:45Z |
| 2 | O8 T8 WebKit attempt2 trên #119 | **21/21 PASS** — exit=0 04:15:38Z, JSON n=21 ok=21, md5 `93cc0ec1`, S1 PASS 04:14:49Z |
| 3 | O8 T8 Chromium trên #119 | **21/21 PASS** — exit=0 04:16:34Z, JSON n=21 ok=21, md5 `bc1746f9` |
| 4 | O8 T01 WebKit attempt1 trên #119 | **21/21 PASS** (md5 57f5b349, S1 PASS 03:12:49Z) |
| 5 | O8 T01 WebKit attempt2 trên #119 | **21/21 PASS** (md5 a7952679, S1 PASS 03:15:21Z) |
| 6 | O8 T01 Chromium trên #119 | **21/21 PASS** (md5 0ceefe17, S1 PASS 03:17:11Z) |

- O8 log T8: S1 PASS 6, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0. **Gate cho boot đo `55c9e0b7` (#119 ứng viên): (a) CÓ — POSTBOOT_PASS #119 02:50:55Z (repair-sớm-quyết-h, poll=1, CÓ caveat symlink).**
- **Cây đổi TRƯỚC mọi phép đo đợt này: `preview.tsx` cf331628 → 98392fa6 → `591f9655` (mtime 03:05:49Z); `media.ts` 2c384ed1 → `14baf831` (mtime 03:07:52Z)** — luồng sản phẩm sửa file trong lúc T4 attempt1/đầu đợt; O8 T01 (03:12:26Z), harness (03:53:38Z) và O8 T8 (04:13:29Z) đều chạy trên CÙNG CÂY (591f9655 + 14baf831); `vite.config.ts` ee80d093 không đổi. Ghi rõ cây thống nhất (F-194-T8-6).

## 2. Kết quả harness — 6/6; WebKit 3/3 PASS; Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 03:53:38–03:55:41 | **PASS** — W1 PASS 03:53:58Z + E4 PASS 03:55:35Z, live_diags=0 |
| 2 | WebKit 85m4 | 0 | 03:55:56–03:58:49 | **PASS** — P1 PASS 03:56:40Z + P5 PASS 03:58:44Z, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 03:59:05–04:03:40 | **PASS** — P1 PASS 03:59:49Z + P5 PASS 04:01:51Z + P6 KHÔNG-KẸT 04:03:34Z, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 04:03:55–04:05:05 | **PASS** — W1-lần1 PASS 04:04:09Z + E4 PASS 04:04:56Z, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 04:05:21–04:07:32 | **PASS** — P1 PASS 04:05:56Z + P5 PASS 04:07:25Z, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 04:07:47–04:11:40 | **PASS** — P1 PASS 04:08:21Z + P5 PASS 04:09:50Z + P6 KHÔNG-KẸT 04:11:33Z, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 28 — 0 kẹt mới.** **84l10 PASS đợt này — chuỗi 1 → 2.** **86n2-P1 không kẹt: lần 16** (P1 PASS 03:59:49Z).
- RAM sampler (n=37, suốt harness): balloon min 2.764.932 / max 4.338.960 kB (**67,3% trần, pinned=0**), avail min 1.188 MB (04:11:07Z) / max 2.946 MB. Thấp hẳn đợt 193 (82,2%).
- GATE-CHECK trước MỖI pha (bài học F-191-T10-2): 6/6 lần ghi "T4 khong giu lock" (load5 1,93 / 3,54 / 2,96 / 2,18 / 2,02 / 1,98) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 03:41:10Z; lock TRỐNG suốt harness). O8 cũng có GATE-CHECK trước acquire (T4 không giữ lock, load5=1,71). **0 vi phạm phía T8.**

# §C — B2 LIVE LẦN 8: VÙNG MỚI SẠCH TIẾP; B1 KHÔNG BẮT GÌ (0 KẸT); V4 (f'''') BẬT LIVE

## C1. Trạng thái B2 đợt này (KHÔNG đổi script — B2 đã trong 3 script từ đợt 186)

- 3 script harness giữ nguyên md5 đợt 186/187/188/189/191/192/193: 84l10 `16e5e957` (35.917 B), 85m4-hb128 `3fb2548b` (**38.737 B — VƯỢT giới hạn push, lúc push cần `ENABLE_PRIVSEP=0`**), 86n2-hb128 `de925614` (**43.653 B — VƯỢT, cần `ENABLE_PRIVSEP=0`**). `node --check` PASS cả 3 (kiểm lúc copy; không sửa đợt này).
- **Mẫu bọc + ngưỡng giữ nguyên:** ngưỡng 120 s, run_len ≥3, (e)/(f), ngân sách diag (≤2/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. **V2 (f'') vẫn là phương án chính live; V4 (f'''') bật live đợt này (xem §C5).**

## C2. Kiểm chứng offline LẠI TRƯỚC harness (check-fresh-194t8.py trên 6 log tổng hợp đợt 186)

| Ca | Log tổng hợp | check-fresh-194t8.py (V2 + V4 live) |
|---|---|---|
| B2-1 setup treo 150 s | `planb-b2-setup-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-2 startPlaying treo 150 s | `planb-b2-startplaying-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-3 P6-wait treo 150 s + WATCHDOG-137 @60 s | `planb-b2-p6wait-150s-wd.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-4 P6 seeking-kẹt 150 s, KHÔNG watchdog | `planb-b2-p6wait-150s-nowd.log` | OK maxspan=150 s wd=0 maxgap=5 s — **KHÔNG trigger (giới hạn đã biết, §C5)** |
| B2-5 P6 sạch 90 s | `planb-b2-p6-clean-90s.log` | OK maxspan=85 s wd=0 maxgap=5 s — **không FP** |
| B2-6 setup sạch 60 s | `planb-b2-setup-clean-60s.log` | OK maxspan=55 s wd=0 maxgap=5 s — **không FP** |

- **Kết luận offline: ĐẠT (khớp hệt §C2 đợt 186/187/188/189/191/192/193).** Cả 3 vùng B2 mới đều trigger đúng @125 s khi treo thật; không FP trên 2 ca sạch. V4 không làm đổi kết quả 6 ca này (B2-4 có HB128 mỗi 5 s nên maxgap=5 s — V4 không chạm tới giới hạn đã biết).
- **Kiểm đường live V4 (mới đợt này):** check-fresh-194t8.py trên log kẹt thật type-A: 192-ket-84l10 (0 HB128) → **TRIGGER silence=793 s pre-hb**; 180-ket → **TRIGGER silence=718 s pre-hb**; 179-ket → **TRIGGER silence=723 s mid-phase (hb128=11)**; 188-ket → V2 TRIGGER @125 s via=f. **Với driver cũ (có grep HB128), 192-ket và 180-ket KHÔNG BAO GIỜ được gọi check-fresh live; với driver mới, cả hai đều trigger.**

## C3. Kiểm live (harness 6/6 đợt này — script B2 là script harness)

| Vùng B2 | WebKit 84l10 | WebKit 85m4 | WebKit 86n2 | Chromium 84l10 | Chromium 85m4 | Chromium 86n2 |
|---|---|---|---|---|---|---|
| `setupProject setup` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `startPlaying start` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `P6-wait wait` | — | — | **18 dòng** (elapsed 5→90 s) | — | — | **18 dòng** (elapsed 5→90 s) |
| check-fresh live | OK maxspan=0 s wd=0 maxgap=12 s | OK maxspan=5 s maxgap=14 s | OK maxspan=85 s maxgap=14 s | OK maxspan=0 s maxgap=12 s | OK maxspan=5 s maxgap=14 s | OK maxspan=85 s maxgap=14 s |

- **B2 VÙNG MỚI SẠCH LẦN 8** — chưa bắt kẹt thật ở vùng mới (setup/startPlaying/P6-wait 0 trigger; P6-wait tối đa elapsed=90 s — biên 30 s dưới ngưỡng 120 s). **Dữ kiện thứ 6 cho T4: LẪN LỘN (lần thứ 3 liên tiếp) — luật B2 KHÔNG TÁCH VẪN ĐỨNG (quyết (j)-193).**
- **P6-wait chạy tới elapsed=90 s cả hai engine, maxspan=90 s — biên còn 30 s** (đợt 193: WebKit 85 s, Chromium 85 s — biên 30–35 s). Vẫn dưới ngưỡng 120 s, KHÔNG FP.
- **Maxgap live 12–14 s (193: 5–8 s)** — vite chậm hơn dưới tải (F-194-T8-3); biên >100 s, KHÔNG FP. **V4 live 0 trigger đợt này — ĐÚNG (không có kẹt, không có im lặng dài).**
- **Replay sau live (3 entry sạch mới, 0 entry kẹt mới):** 194-sach-84l10 12 dòng HB128, max run span 0 s; 194-sach-85m4 22 dòng, max run span 5 s; 194-sach-86n2-hb128 43 dòng, max run span **85 s** (run_len=18, playhead=30 ct=30), KHÔNG kích hoạt mọi phương án — **P6-wait không gây FP ngay cả trong replay** (biên 35 s).

## C4. Replay V1/V2 sau O8 (replay-1c-194t8.py + replay-f-fix-194t8.py — đã thêm 3 entry `194-*`)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 37 log sạch duy nhất theo md5** (39 entry sạch; 2 cặp trùng byte-identical 181/182 — xem dưới). Đợt 194 đóng góp 3 log sạch mới + 0 log kẹt mới.
- **Kẹt theo từng phương án: (c') V0: 164@125 s, 178@125 s, 188@125 s (3/5; lỡ 171, 183); V2 (f''): 164/171/178/183/188 @125 s (5/5, KỊCH BẢN CHÍNH); V1-300: 164/171/178/188 @125 s (4/5; lỡ 183); V1-60: 171/178/188 (3/5; lỡ 164, 183).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (5/5 kẹt @125 s, FP 0); **V1-300 ĐẠT** (4/5, FP 0) — V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 37 log sạch duy nhất (md5).**
- **F-184-T8-1: KHÔNG TÁI DIỄN:** 0 NO-FILE trong cả hai lần chạy replay (47 entry replay-f-fix + 44 entry replay-1c đều có file).
- **Số log sạch chuẩn (md5-unique): 17/17/19/21/23/25/27/29/31/34/37 (183/184/185/186/187/188/189/191/192/193/194 — 190 VOID, không đóng góp).** Hai cặp trùng: 181/182-sach-85m4 (md5 `166b271d`) + 181/182-sach-86n2-hb128 (md5 `e11c62cb`) — byte-identical, đã biết từ đợt 187. 0 FP không đổi theo cả hai cách đếm.
- **Biên an toàn (không đổi sau B2):** log sạch max identical-run span **90 s** (run P6-wait — ngưỡng 120 s → biên 30 s).

## C5. V4 (f'''') QUY TẮC IM LẶNG — BẬT LIVE ĐỢT NÀY (QUYẾT (j)-193 — VIỆC CHÍNH ĐÃ LÀM XONG)

- **Thay đổi driver — ĐÚNG 1 DÒNG:** run-webkit-194t8.sh:135–137 — bỏ `&& grep -aq 'HB128' "$log" 2>/dev/null` khỏi điều kiện gọi check-fresh; check-fresh nay chạy **MỖI POLL (10 s)** kể cả khi log chưa có dòng HB128. Diff vs bản 193: chỉ đổi nhãn + dòng này + 2 dòng comment V4 live. Rollback 1 đợt nếu FP/kẹt sót.
- **Bằng chứng live đợt này: 0 trigger, 0 FP.** 6 pha harness đều live_diags=0, 0 WATCHDOG-137, 0 FRESH-CONTENT, 0 LIVE-DIAG; maxgap live 12–14 s (biên >100 s dưới ngưỡng 120 s). **V4 chạy live lần đầu mà không gây FP — rollback CHƯA CẦN.**
- **Bằng chứng replay đợt 194 (replay-f-fix-194t8.py — mục ĐÁNH GIÁ V4): V4 bắt 3/3 kẹt mù** (179 gap 723 s; 180 gap 718 s; 192 gap 793 s); **0 FP trên 39 log sạch** (max gap sạch 97 s — cửa P5→P6 chờ 90 s cố định + ~7 s chuyển pha, chỉ ở log 86n2 trước đợt 186; từ 186 P6-wait đã log HB128 mỗi 5 s nên gap ≤ 14 s; **biên V4 = 23 s**). **V2+V4 = 8/8 kẹt, 0 FP.**
- **Giới hạn còn lại (trung thực):**
  - V4 cần ≥ 1 dòng timestamp trong log (pha chưa log dòng nào thì không đo được — vite không lên là lỗi khác, driver timeout 900 xử lý).
  - **Nói đúng giá trị live của V4:** live đã có (1b) mtime-silence + WATCHDOG-137 — chính hai thứ này đã bắt #28 live (diag live 2/2 đợt 192). V4 KHÔNG mở vùng phủ sóng hoàn toàn mới live; V4 củng cố bằng cách đo im lặng trên **dòng timestamp** (không bị reset bởi dòng không-timestamp như khối browser-stderr `[pid=...]`) + cho bằng chứng replay 8/8. **Bằng chứng mới đợt này (§C2): với driver cũ, kẹt type-A (192, 180) KHÔNG BAO GIỜ được gọi check-fresh live — V4 live ĐÓNG ĐÚNG lỗ hổng F-192-T8-4.**
  - B2-4 (P6 seeking-kẹt không watchdog) VẪN KHÔNG bắt được (có HB128 mỗi 5 s, maxgap=5 s) — giới hạn đã biết, đứng nguyên.
  - Nhãn echo live vẫn ghi "FRESH-CONTENT-189 (f''-V2)" ngay cả khi trigger via=silence — cosmetic, xem F-194-T8-4. run-chromium-194t8.sh:122 vẫn còn điều kiện grep HB128 (bản sao KHÔNG CHẠY — xem F-194-T8-5).
- **B2 đã bắt kẹt thật đầu tiên đợt 188 (P5, vùng chung)** + kẹt #28 đợt 192 (84l10 W2, qua watchdog) — nhưng chưa bắt kẹt thật nào ở vùng mới (setup/startPlaying/P6-wait). Bằng chứng bắt thật ở vùng mới thuộc ca kẹt tới.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 19 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173) + KẸT #28 (§D4, CẬP NHẬT ĐỢT 194)

## D1–D2. Phạm vi + Q3: 84l10 qua 5 điểm kẹt cũ (157 E4 :457; 170 W2 :433; 171 W2-setup :425; 178 W2-setup :443; 192 W2-setup :423) + ca 193/194 W2-setup PASS (§D4); 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 PASS (exit 0, 03:55:41Z), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 194: **CÓ dữ liệu mới (§D4)**. **Chuỗi PASS: 1 → 2.** Tần suất: **5 ca / 35 đợt ≈ 14%** (157, 170, 171, 178, 192).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Ca 192 là setup W2 đóng băng — giống họ kẹt "vòng poll đóng băng", cùng họ với 170/171/178. Ca 193/194 W2-setup chạy qua bình thường (194: 20 s từ setup W1 tới HB128 W2 đầu tiên).
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (§D4):** 84l10 PASS lần 2 liên tiếp với scanner VẮNG **và** dpkg yên — **nghiêng về phía engine/thời điểm, không còn nghiêng hệ thống như đợt 192.** Chromium cùng pha PASS sạch trên cùng boot (như mọi đợt).
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 194: không có kẹt — W2 chạy, E4 PASS** (media chạy bình thường).
- **Q4 — Race evaluate/GStreamer?** **BẰNG CHỨNG MỚI:** 0 GStreamer-WARNING + 0 plugin-loader trong cả 3 log WebKit (đối chiếu 1 warning lúc 16:31:57Z đợt 192) — **không có dấu hiệu race đợt này.**
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ sáu, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; kiểm `gst-plugin-scanner` + `gst-inspect-1.0` + **dpkg/apt có đang chạy không** ngay trước khi chạy pha WebKit đầu tiên (nợ từ §D4 đợt 193 — đã làm đợt này, giữ lại cho các đợt sau).

## D4. KẸT #28 — CẬP NHẬT ĐỢT 194: "THIẾU SCANNER" CÀNG YẾU; "CÀI GÓI ĐỒNG THỜI" CHƯA CÓ CA THUẬN MỚI

- **Đối chiếu 192 ↔ 193 ↔ 194 (cùng pha, cùng dạng boot, khác kết quả):**

| | Đợt 192 (KẸT #28) | Đợt 193 (PASS) | Đợt 194 (PASS) |
|---|---|---|---|
| Boot | #116 4dda8234, btime 16:21:33Z | #117 1c0bcaad, btime 20:22:37Z | #119 55c9e0b7, btime 02:28:08Z |
| Scanner trước pha | VẮNG (selfcheck 16:26:22Z) | VẮNG (selfcheck 20:45:40Z + kiểm lại 21:50:26Z) | VẮNG (selfcheck 02:52:49Z + kiểm lại 03:53:23Z + sau pha VẮNG) |
| Scanner trong pha | VẮNG lúc kẹt; CÓ lúc 16:48Z (sau pha) | VẮNG lúc 21:51:56Z (giữa pha) | (không kiểm giữa pha — xem F-194-T8-7) |
| GStreamer-WARNING plugin loader | **1×, 16:31:57Z (5 s sau khi pha khởi động)** | **0×** | **0×** (cả 3 log WebKit) |
| dpkg.log trong lúc pha | **2 → 530 → 1.446 → 1.468 (replay đang cài gói ĐỒNG THỜI)** | **768 ổn định từ 20:59Z (trước pha ~52 phút)** | **777 ổn định (0 apt/dpkg process trước pha 03:53:23Z; hoạt động apt cuối 02:50:53Z — ~63 phút trước pha)** |
| Kết quả W2-setup | Kẹt tại runEngine:423, 0 dòng HB128, exit 124 | W1-lần1 PASS 21:50:59Z, HB128 W2 từ 21:51:16Z, E4 PASS, exit 0 | W1-lần1 PASS 03:53:58Z, HB128 W2 chảy, E4 PASS 03:55:35Z, exit 0 |

- **Kết luận cơ chế (cập nhật): thiếu scanner KHÔNG ĐỦ gây kẹt** — 2 ca PASS liên tiếp với cùng điều kiện vắng scanner (193, 194), 1 ca kẹt. **Giả thuyết "cài gói đồng thời" (ghi nhận (j)-193): đợt này KHÔNG CÓ ca kẹt mới để kiểm thuận** — chỉ có thêm 1 ca PASS với dpkg yên, phù hợp với giả thuyết nhưng không chứng minh nó. **Phép thử phân biệt vẫn đứng:** kẹt khi dpkg đang chạy → ủng hộ giả thuyết mới; kẹt khi dpkg yên → cả hai đều bị bác. **H3 GIỮ mức ỦNG HỘ MẠNH** (0 kẹt đợt này không bác H3).
- **Nợ đứng:** chỉ 1 ca kẹt + 2 ca pass có trigger đo được — chưa đủ dữ kiện khẳng định tuyệt đối (cần ≥2 ca kẹt có kiểm scanner + dpkg-trước-pha, hoặc 1 ca kẹt tái diễn khi dpkg đang chạy).

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 194 (0 KẸT MỚI — KHÔNG CÓ BẰNG CHỨNG MỚI)

## B1. Trạng thái giả thuyết sau đợt 194

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — 0 kẹt đợt này; avail min 1.188 MB trong harness, balloon max 67,3% trần (thấp hơn đợt 193).
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH (GIỮ mức đợt 193)** — 0 kẹt mới; §D4 cập nhật trigger nhưng không đổi mức H3.
- Đợt 194 T8: **0 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T01 PASS 3/3 trên #119). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS, lần thứ 16.**

# §E — CHECKLIST (o) ĐỢT 194 (gọn — chỉ mục đổi so với đợt 193)

- o1. F-186-T0-1 (#106 chưa xác minh) — ĐÃ QUYẾT (e) đợt 186: cea79500 = #107.
- o2. Run 198 kết cục thuộc T7-194 (xem LIMITS T7; run 196 SUCCEEDED cf 117 s — CA #25 MỚI, họ 25/22; run 197 SUCCEEDED cf 8 s — KHÔNG CA; run 198 RUNNING lúc T7 đọc).
- o3. F-185-T1-1 (prose §112) — ĐÃ SỬA XONG đợt 186.
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 1.188–2.946 MB trong harness; balloon max 67,3% trần, pinned=0.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; T4-194: lượt yên #62 0 HỢP LỆ (chuỗi GIỮ 0); live #13 KHÔNG THỂ KIỂM (chuỗi GIỮ 9); B2 dữ kiện thứ 6 LẪN LỘN (lần 3 liên tiếp).
- o6. F-181-T4-3 (X193) — ĐÃ ĐÍNH CHÍNH: X193 là Xvfb của chính probe T4. X11 lúc T8 đóng: **5 file (X193, X194, X195, X196, X98)** — không file nào của T8 (:199 đã dọn). Xem §6.
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; POSTBOOT_PASS #119 CÓ 02:50:55Z (caveat symlink); #118 KHÔNG CÓ (tổng không cờ 27 → 28).
- o8–o10. F-181-T5-2 (ledger ts) + F-180-T5-3 (lệch btime) + F-174-T5-6 — GHI NHẬN (#119 CÓ cờ, caveat symlink).
- o11–o13. F-181-T6-1 + F-180-T6-4 + F-180-T6-5 — GHI NHẬN; T56-194 ĐÃ ĐÓNG CỜ ((A) 120/120 lần 43; #118/#119 KHÔNG GIẾT HOLDER, chuỗi 21 → 22 → 23; prune lần 68).
- o14–o16. F-181-T7-1 (OUTAGE 8.406 s — T7-194 phán cuối) + F-180-T7-4 + F-180-T7-5 — GHI NHẬN; xem LIMITS T7-194.
- o17. F-185-T8-4 (stat sai marker) — **ĐÃ SỬA (T0-186)** — marker 71 reboot (#49–#119) nếu #119 xác nhận (T01-194).
- o18. Quyết (o) 193 — GHI NHẬN; số mới thuộc T7-194/T9-194 (auto-trigger live — T9-194 CHƯA ĐÓNG CỜ lúc T8 viết LIMITS).
- o19. Quyết (l) 152 — ĐÃ THỰC HIỆN: marker 71; **T8 đóng ~04:45Z, TRONG hạn cờ ~05:00Z**.
- o20. Quyết (j) 193 — **ĐÃ THỰC HIỆN (§2, §C, §D4, §F, §B, §C5)** — B2 sạch lần 8; V2 replay 5/5 @125 s, V1-300 4/5; **V4 (f'''') BẬT LIVE — driver đổi 1 dòng, live 0 trigger 0 FP, replay V4 3/3, V2+V4 = 8/8**; **84l10 PASS — chuỗi 1 → 2; B1 live sạch 1 → 2; số log sạch chuẩn 34 → 37**.
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (T01/T2/T4/T56-194 ĐÃ ĐÓNG CỜ; T9-194 chưa).

# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 194 — DỪNG** (đã PASS 4 lần liên tiếp; đợt này 84l10 PASS nên càng không cần). **Mở lại nếu kẹt setup tái hiện mà diag live không đủ bằng chứng.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy). **Chi phí B2 giữ nguyên:** 85m4-hb128 38.737 B (VƯỢT 969 B); 86n2-hb128 43.653 B (oversize); 84l10 35.917 B (dư 1.851 B).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` **cf331628 → 98392fa6 → 591f9655** (đổi 2 lần, mtime cuối 03:05:49Z — TRƯỚC mọi phép đo; CÙNG CÂY); `media.ts` **2c384ed1 → 14baf831** (đổi 03:07:52Z); `vite.config.ts` ee80d093; `84l10` **16e5e957 (B2, KHÔNG ĐỔI)**; `85m4-hb128` **3fb2548b (B2, KHÔNG ĐỔI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` de925614 (B2, KHÔNG ĐỔI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). **T8 KHÔNG đổi file code sản phẩm đợt này** (chỉ script làm việc + LIMITS này).
- **Working dir `repo-1/hidden_files/round194-t8/`** — copy `cp -r` 193→194 (exit 0). **Đổi nhãn đúng** (193t8→194t8, waiter deadline → 04:15Z 26/11, lock ticket t8-round194) — grep: chỉ còn tham chiếu 193 trong khối LOGS đóng băng của replay (3 entry `193-*`) + nhãn lịch sử (LIVE-DIAG-189/FRESH-CONTENT-189, bằng chứng V4 đợt 193). **V4: driver đổi 1 dòng (§C5) + header check-fresh/replay cập nhật V4 live.**
- Extract (dùng lại): trích ĐÚNG số harness (6/6 exit=0, live_diags=0) + O8 (webkit 21/21 md5 6a704a74/93cc0ec1, chromium 21/21 md5 bc1746f9) + sampler n=37 + WATCHDOG-137: 0.
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** 0 symlink Singleton\* stale lúc copy (3 symlink cũ trong o8-chromium/chrome-userdata đã xóa).
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP)** — `o8-s1-probe-194t8.mjs` md5 `453d1082` (giống hệt 175–194; `node --check` PASS); O8 T8 chạy với probe này (attempt1 PASS nên probe không cần chạy lại — S1 PASS 6, FAIL 0).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round194-t8). **F-181-T8-5: ÁP DỤNG CHO #119** (repair-sớm-quyết-h, poll=1, CÓ caveat symlink). **F-181-T8-6 (gst-inspect vắng): TÁI DIỄN TRÊN #119** (VẮNG trước/sau pha — xem §D4). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 191 (tổng 27 → 28). F-181-T8-8 (log stale): VẪN CÒN — đợt này KHÔNG tái diễn.**

## 6. Dọn dẹp + kiểm cuối — REBOOT #120 04:23:25Z (sau mọi phép đo)

- Driver harness đã thoát sau pha cuối (04:11:40Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng). O8 driver đã nhả lock 04:16:34Z. **Không lock stale nào** (vite TRỐNG — extract xác nhận).
- Kiểm cuối (trước reboot): process Xvfb/MiniBrowser/WebKit sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` còn **5 file (X193, X194, X195, X196, X98)** — X193 là Xvfb của probe T4 (F-181-T4-3); **không file nào là của T8** (:199 đã dọn). ps sót T8 0, clicktest T8 0. **Sau reboot #120 04:23:25Z: /tmp/.X11-unix TRỐNG; ps sót 0 (kiểm 04:42Z trên #120); vite lock TRỐNG (0 ticket, log ghi RELEASED 04:16:34Z).**
- Fixture /tmp: **ĐÃ REBUILD 1 LẦN** (#119 03:48Z — md5 khớp đợt 125) — vẫn còn lúc đóng.
- **Reboot #119 (boot `55c9e0b7`, btime 02:28:08Z, gap 14.773 s):** xảy ra TRƯỚC khi T8 mở (đợt 194 mở 02:35:51Z). **REBOOT #120 04:23:25Z (btime 1795667005, gap #119→#120 = 6.917 s) — SAU phép đo cuối 04:16:34Z, trong lúc viết LIMITS; mọi phép đo vẫn trên #119.** dpkg.log 777 dòng (ổn định từ 02:51Z). #119 ỨNG VIÊN (parent quyết (e)); POSTBOOT_PASS #119 CÓ (caveat symlink); #118 KHÔNG CÓ cờ (tổng 27 → 28).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. Không chạy script nặng khi T4 attempt (rebuild sau khi poller thoát; GATE-CHECK 6/6 không giữ lock).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 6/6 — WebKit 84l10/85m4/86n2 PASS + Chromium 3/3 PASS (trên #119 ứng viên).** **Kẹt cộng dồn GIỮ 28 — 0 kẹt mới.**
2. **O8 T8 3/3 (WebKit 21/21 md5 6a704a74/93cc0ec1; Chromium 21/21 md5 bc1746f9 — trên #119).** O8 T01 PASS 3/3 trên #119 theo LIMITS T01 (md5 57f5b349/a7952679/0ceefe17 — T01 ĐÃ ĐÓNG CỜ). **O8 CÙNG BOOT, CÙNG CÂY.**
3. **Chuỗi WebKit FULL PASS GIỮ 0 (KHÔNG THỂ: lượt yên #62 0 hợp lệ).** Gate (a) CÓ cờ (caveat); O8 cùng boot; harness 6/6; live #13 KHÔNG THỂ KIỂM (chuỗi GIỮ 9).
4. **POSTBOOT_PASS #119 CÓ 02:50:55Z (T56-194, poll=1, CÓ caveat symlink)** — gate (a) ĐẠT có caveat; #118 KHÔNG CÓ cờ (tổng 27 → 28); marker 71 nếu #119 xác nhận.
5. **Balloon max 67,3% trần (n=37, avail min 1.188 MB, pinned=0)** — thấp hẳn đợt 193 (82,2%); KHÔNG có sampler T9 trong LIMITS này.
6. **85m4-hb128 38.737 B (VƯỢT giới hạn push 969 B) + 86n2-hb128 43.653 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 35.917 B (dư 1.851 B). **LIMITS này DƯỚI giới hạn push (xem stat lúc ghi cờ).**
7. **Chuỗi verdict: 84l10 PASS (chuỗi 1 → 2); 86n2-P1 không kẹt lần 16; B2 vùng mới sạch lần 8; B1 KHÔNG BẮT gì (0 kẹt — chuỗi live sạch 1 → 2); số chuẩn 34 → 37 (md5-unique).** H3 GIỮ ỦNG HỘ MẠNH.
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') PHƯƠNG ÁN CHÍNH — replay V2 5/5 @125 s, V1-300 4/5, 0 FP trên 37 log sạch (md5).** V1 chỉ đối chứng. **V4 BẬT LIVE: 0 trigger, 0 FP — replay V4 3/3, V2+V4 = 8/8; rollback 1 đợt nếu FP/kẹt sót.**
10. **T4-194 ĐÃ ĐÓNG CỜ (03:51Z): lượt yên #62 0 HỢP LỆ (chuỗi GIỮ 0); live #13 KHÔNG THỂ KIỂM (chuỗi GIỮ 9); B2 dữ kiện thứ 6 LẪN LỘN (lần 3 liên tiếp).** T01/T2/T56-194 ĐÃ ĐÓNG CỜ; T9-194 CHƯA ĐÓNG CỜ lúc T8 viết LIMITS.
11. **T8 ĐÓNG ~04:45Z, TRONG hạn cờ ~05:00Z** (waiter GATE-FOUND 03:52:12Z, harness 03:53–04:11Z, O8 04:13–04:16Z, replay + LIMITS 04:16–04:45Z). 0 reboot trong cửa sổ đo (03:53–04:16Z); reboot #120 04:23:25Z sau đó.

## 8. Sai số mới (F-194-T8-N) + nợ cũ đã xử lý

- **F-194-T8-1 — LIBEVENT "VẮNG" LÚC T01 SURVEY, CÓ LÚC T8 SELFCHECK (ĐÃ RÕ):** T01 survey 02:46:33Z ghi VẮNG; T8 selfcheck 02:52:49Z + T4 gate0wait-5 ghi CÓ — xuất hiện qua T5 repair-apt ~02:50Z (dpkg 768→777). Không ảnh hưởng verdict.
- **F-194-T8-2 — CHECK-FRESH TRẢ OK TRÊN FILE KHÔNG TỒN TẠI (CHƯA SỬA):** phát hiện khi T8 gõ sai đường dẫn ket-log: parse bắt FileNotFoundError → "OK maxspan=0 wd=0 maxgap=0". Driver chỉ gọi trên log vừa tạo nên không ảnh hưởng live. Nợ đợt sau: trả lỗi khi file vắng.
- **F-194-T8-3 — MAXGAP LIVE 12–14 s (193: 5–8 s):** vite khởi động/chuyển pha chậm hơn dưới tải (load5 lúc harness 1,93–3,54); biên V4 còn >100 s dưới ngưỡng 120 s, 0 FP. Ghi nhận, không đổi ngưỡng.
- **F-194-T8-4 — NHÃN ECHO LIVE KHÔNG PHÂN BIỆT V2/V4 (COSMETIC):** driver in "FRESH-CONTENT-189 (f''-V2)" ngay cả khi trigger via=silence; label diag-stall cũng chung. Không ảnh hưởng diag. Nợ: đổi nhãn theo via=.
- **F-194-T8-5 — RUN-CHROMIUM-194T8.SH:122 VẪN CÒN GREP HB128 (KHÔNG ẢNH HƯỞNG):** bản sao driver chromium không chạy (F-183-T8-3) nên V4 live không bị chặn; nhưng bản sao lệch với driver chính. Nợ: đồng bộ hoặc xóa bản sao.
- **F-194-T8-6 — CÂY ĐỔI 2 LẦN TRONG ĐỢT, TRƯỚC MỌI PHÉP ĐO (GHI RÕ):** preview.tsx cf331628 → 98392fa6 → 591f9655; media.ts 2c384ed1 → 14baf831 (03:05–03:07Z). T4 attempt1 chạy trên cây cũ; attempt2/3 + O8 T01 + harness + O8 T8 chạy trên cây mới. Cây THỐNG NHẤT giữa các lượt đo của T8/T01 (khác F-193-T8-5).
- **F-194-T8-7 — KHÔNG KIỂM SCANNER GIỮA PHA WEBKIT ĐẦU TIÊN:** đợt 193 kiểm giữa pha 21:51:56Z; đợt này chỉ kiểm trước pha (03:53:23Z, VẮNG) + sau pha (VẮNG). Nợ đợt sau: kiểm giữa pha như 193.
- **F-193-T8-1 — WAITER APPEND CHƯA KIỂM CHỨNG THỰC TẾ (VẪN CHƯA CÓ DỮ KIỆN):** đợt này **CÓ 1 reboot 04:23:25Z nhưng SAU khi waiter đã thoát** nên vẫn chưa có dữ kiện khởi động lại waiter.
- **F-193-T8-3 — SYMLINK t8-diag-stall.sh TRỎ BẢN 189: ĐÃ SỬA.** Nay trỏ `diag-stall-194t8.sh` (04:21Z); diff 189 vs 194 chỉ khác nhãn/path.
- **F-193-T8-2 (kiểm scanner trước pha — ĐÃ THỰC HIỆN, CÓ KẾT QUẢ §D4) + F-193-T8-4 (T4 .done muộn — KHÔNG TÁI DIỄN: T4 .done 03:51Z, waiter GATE-FOUND 03:52:12Z) + F-193-T8-5 (preview.tsx đổi giữa 2 lượt O8 — KHÔNG TÁI DIỄN: cây thống nhất, xem F-194-T8-6).**
- **F-194-T7-3 (result_summary run 197 lặp lại câu chuyện điền sẵn — T7-194):** T8 KHÔNG dùng DB result_summary làm nguồn narrative (quyết đứng F-193-T7-2); nguồn T8 dùng: aggregate 193 §14.2 (56.830 B) + aggregate 192 §14.2 (99.871 B).
- **F-192-T8-1..5 / F-191-T8-1/2/3/4 / F-189-T8-1 / F-189-T8-2 / F-188-T8-1 / F-186-T8-2 / F-184-T8-1: ĐÃ SỬA / KHÔNG TÁI DIỄN** (waiter kiểm cả t5 lẫn t56; nhãn extract động; ps sót 0/0; 86n2-P5 PASS 0 restart; nhãn o8-driver "T8-194"). **F-183-T8-7: libevent-2.1.so.7 CÓ trên #119 (xem F-194-T8-1).**
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG.** Dọn `smoke/` khỏi bản copy (193 smoke → `smoke/archive-193/`); replay chạy sạch. Extract vẫn liệt kê báo cáo O8 stamp cũ (copy kèm) — LIMITS này chỉ trích số 194.
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-194t8.sh` (cả 6 pha).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS GIỮ 0 (KHÔNG THỂ: lượt yên #62 0 lượt hợp lệ)** — parent/T10 quyết (gate (a) #119 có cờ caveat symlink, O8 cùng boot cùng cây, harness 6/6, live-check #13 KHÔNG THỂ KIỂM).
2. **B2 vùng mới sạch lần 8; B1 KHÔNG BẮT gì (0 kẹt — chuỗi live sạch 1 → 2)** — parent ghi nhận (biên P6-wait 30 s; V4 live 0 trigger 0 FP — rollback chưa cần).
3. **Chuỗi 84l10 PASS 1 → 2 + chuỗi 86n2-P1 không kẹt 15 → 16 + số log sạch chuẩn 34 → 37** — parent/T10 quyết (§D4; 86n2-P1 PASS 03:59:49Z).
4. **V4 (f'''') — parent ghi nhận bật live đợt 194:** driver đổi 1 dòng; live 0 trigger 0 FP; replay V4 3/3, V2+V4 = 8/8; **bằng chứng mới §C2: driver cũ không bao giờ gọi check-fresh trên kẹt type-A — V4 live đóng đúng lỗ hổng F-192-T8-4.** Rollback 1 đợt nếu FP/kẹt sót (chưa cần).
5. **Giả thuyết trigger kẹt W2-setup — "thiếu scanner" CÀNG YẾU; "cài gói đồng thời" chưa có ca thuận mới** (parent ghi nhận §D4; nợ đợt sau: kiểm scanner + dpkg/apt-trước-pha + giữa pha; H3 GIỮ ỦNG HỘ MẠNH).
6. **Reboot #119 (55c9e0b7, btime 02:28:08Z, gap #118→#119 = 14.773 s)** — ỨNG VIÊN (parent quyết (e)); (m) #117/#118 CUỐI (T2-194); POSTBOOT_PASS #119 CÓ (caveat); #118 KHÔNG CÓ (tổng 27 → 28). **REBOOT #120 04:23:25Z (btime 1795667005, gap 6.917 s) — ứng viên mới; (m) #119 + POSTBOOT_PASS #120 thuộc T2-195/T56-195.**
7. **Lượt yên #62 0 LƯỢT HỢP LỆ (chuỗi GIỮ 0); (p) live #13 KHÔNG THỂ KIỂM (chuỗi GIỮ 9); B2 dữ kiện thứ 6 LẪN LỘN (lần 3 liên tiếp)** — xem T4-194; auto-trigger LIVE (T9-194 phán cuối).
8. **Kẹt 84l10 #28 — ĐIỀU TRA CẬP NHẬT XONG (§D4): "thiếu scanner" CÀNG YẾU; "cài gói đồng thời" chưa có ca thuận mới** — H3 GIỮ ỦNG HỘ MẠNH.
9. Mở từ trước, vẫn đứng: **#118/#119 KHÔNG GIẾT HOLDER (chuỗi 21 → 22 → 23); (A) 120/120 lần 43; (m) #117/#118 CUỐI (T2-194); CA #25 MỚI (run 196 cf 117 s, họ 25/22); run 197 SUCCEEDED cf 8 s; mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần chạy; R9 (a); file oversize 6,4 MB chưa quyết; u2net là fallback; KHÔNG PUSH — chờ push = đợt 191 + đợt 192 + đợt 193 (T10 đếm cuối).**
10. **F-194-T8-2 + F-194-T8-4 + F-194-T8-5 + F-194-T8-7** — parent ghi nhận; không đổi verdict.
