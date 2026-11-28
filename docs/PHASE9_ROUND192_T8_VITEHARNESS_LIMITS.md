# Đợt 192 T8 — HARNESS 5/6 TRÊN #116 (ỨNG VIÊN): KẸT #28 (84l10 WebKit W2-setup); FULL PASS KHÔNG THỂ; T4 #60 0 LƯỢT HỢP LỆ

Ngày: 25/11/2026 (lượt cron 21:35 +07 = 14:35:51Z; T8 mở ~14:40Z, đóng ~17:10Z — **SAU hạn cờ ~17:00Z, TRONG hạn cứng ~17:35Z** — trễ do reboot 16:21:33Z + waiter tới 16:30:48Z + harness/O8 sau đó).
Phạm vi: (1) harness hb128 + B1/B2 live trên boot mới nhất; (2) O8 T8 21/21 ×2 + 21/21; (3) V2 (f'') replay kẹt @125 s + 0 FP log sạch; (4) điều tra riêng 84l10 (đợt 17) + H3 giám sát thụ động.

## 0. Kết luận ngắn — 5/6; KẸT #28 (84l10 WebKit, W2-setup); FULL PASS KHÔNG THỂ; T4 #60 0 lượt hợp lệ

- **HAI BOOT TRONG ĐỢT — mọi chân đo CHIA ĐÔI BOOT.** Boot #115 ứng viên `ebc5a3b9` (btime 14:23:56Z, gap #114→#115 = 21.493 s — dài nhất chuỗi) **CHẾT 16:21:33Z** (sống 7.057 s). Boot #116 ứng viên `4dda8234` (btime 16:21:33Z, gap #115→#116 = 7.057 s). Marker sống qua **67 reboot (#49–#115), 68 nếu #116** (mtime không đổi 2026-11-20).
- **POSTBOOT_PASS #115 CÓ 14:55:05Z** (T56-192; repair-sớm-quyết-h, poll=1, **CÓ caveat**; dpkg 768, cache 107, lists 75; GST 269 symlink → debroot ephemeral; replay #115 KHÔNG CHẠY, dạng B). **POSTBOOT_PASS #116 KHÔNG CÓ** (watcher-192 chết theo reboot 16:21:33Z; T56-192 đã đóng cờ trước đó — không ai viết cờ cho #116 trong đợt này).
- **Lượt yên #60: 0 LƯỢT HỢP LỆ (T4-192, .done 16:42Z)** — attempt1 20/20 nhưng lớp B vi phạm (nhiễm tải); attempt2 exit=3, partial 9/20 (trang wedged, 3 fetch TIMEOUT 30 s); attempt3 20/20 + B 5/5 nhưng tickCost median 63,0 ms > 60. Ngân sách 3/3 hết, poller thoát 16:18:10Z. Chuỗi 2 → 0 (ĐỨT, đề xuất).
- **HARNESS 5/6 trên #116 (16:31:49–17:01:25Z): WebKit 84l10 exit=124 TIMEOUT (KẸT #28) + 85m4 PASS + 86n2 PASS; Chromium 3/3 PASS.** Kẹt cộng dồn **27 → 28**. live_diags=2 (cả hai trong 84l10); WATCHDOG-137 ×3.
- **O8 T8 3/3 trên #116** (17:02:29–17:04:58Z): WebKit ×2 **21/21 PASS** (md5 `bbe2e1fc`/`66e534ba`) + **Chromium 21/21 PASS (md5 `81736056`)**. **O8 T01 3/3 trên #115** (WebKit 9df451e1/c3df5c23, Chromium d23ce495, 14:57:20–15:01:08Z) — **O8 CHIA ĐÔI BOOT.**
- **FULL PASS: KHÔNG THỂ — chuỗi 2 → 0 (ĐỨT, đề xuất).** 5 chân không cùng boot: gate (a) #116 KHÔNG CÓ cờ; O8 T01 trên #115, O8 T8 trên #116; lượt yên #60 0 lượt hợp lệ; harness 5/6 (84l10 kẹt).
- **B2 VÙNG MỚI SẠCH LẦN 6** (setup/startPlaying/P6-wait 0 trigger; check-fresh live: 85m4 OK maxspan=5 s, 86n2 WebKit OK maxspan=85 s, Chromium OK maxspan=85 s; P6-wait tối đa elapsed=90 s — biên 30 s dưới ngưỡng 120 s).
- **V2 (f'') phương án chính — replay: V2 bắt 5/5 kẹt @125 s (164/171/178/183/188), 0 FP trên 31 log sạch duy nhất theo md5** (33 entry; 192 đóng góp 2 log sạch mới: 192-sach-85m4 md5 `128a796d`, 192-sach-86n2-hb128 md5 `cb433015`); **V1-300 đối chứng: 4/5** (lỡ 183; 192-ket-84l10 KHÔNG cả hai phương án — 0 dòng HB128).
- **84l10 FAIL đợt này — chuỗi PASS 10 → 0 (ĐỨT). 86n2-P1 không kẹt: lần 14** (P1 PASS 16:50:20Z). **Số log sạch chuẩn (md5-unique): 29 → 31.**
- **KẸT #28 — BẰNG CHỨNG MỚI (§D4):** GStreamer-WARNING `External plugin loader failed... GST_PLUGIN_SCANNER` 16:31:57Z lúc pha kẹt khởi động — **0× trong log 191 + 0× trong log 85m4/86n2 đợt này**; `gst-plugin-scanner` + `gst-inspect-1.0` chỉ xuất hiện sau 16:48Z (replay host-side vẫn cài gói lúc pha chạy).
- **F-192-T8-1..5 mới (xem §8).** F-191-T8-1 ĐÃ SỬA (waiter kiểm cả t5 lẫn t56 ngay từ đầu — lần này cờ #115 nằm ở round192-t56, waiter thấy postboot=1 từ poll 11 đợt cũ); F-191-T8-2 ĐÃ SỬA (extract lấy LIMITS đợt trước động — kiểm chứng: "ovsize LIMITS 191 = 37.756 B"); F-191-T8-3 ĐÃ SỬA (extract lọc process theo scratch T8 — kiểm chứng: ps sót 0/0).

## 1. Dòng thời gian (gọn)

- 08:25:43Z **#114** (b0aab705, XÁC NHẬN). 14:23:56Z **#115** (ebc5a3b9, ỨNG VIÊN — T01-192, 9 nguồn tươi). 14:35:51Z Đợt 192 mở. 14:40–14:44Z T8 mở: đọc aggregate 191 §14.2 (bản parent, 81.567 B); copy driver 191→192 + đổi nhãn; **dọn `smoke/` (191 → `smoke/archive-191/`)**; **0 symlink Singleton\* stale** (F-186-T8-2 không tái diễn); probe S1 CÓ SẴN (md5 `453d1082`).
- 14:43:44Z Selfcheck #1 trên #115: libs 6/6 THIẾU, plugin dir 0, dpkg 2 dòng, balloon 765.016 kB, avail 5.094 MB. 14:47Z rebuild fixture lần 1 xong (md5 khớp đợt 125). Check-fresh offline B2: khớp hệt §C2 (3 TRIGGER @125 s; B2-4 OK maxspan=150 s không trigger — giới hạn đã biết; 2 ca sạch không FP).
- 14:45:24Z Waiter khởi động (deadline 16:30Z). 14:55:05Z **POSTBOOT_PASS #115 CÓ** (T56-192, repair-sớm-quyết-h, poll=1, CÓ caveat). 16:21:33Z **reboot → #116** (giết waiter + fixture /tmp). 16:22:48Z waiter khởi động lại (deadline 16:30:48Z). 16:26:22Z selfcheck #2 + fixture rebuild. 16:31:49–17:01:25Z **harness 5/6 (kẹt #28)**. 17:02:29–17:04:58Z O8 T8 3/3.
- **16:21:33Z REBOOT → #116 (4dda8234)** — giết waiter T8 (poll 97 lúc 16:21:47Z là poll cuối trong log cũ) + runtime restart; **waiter KHỞI ĐỘNG LẠI 16:22:48Z** trên boot mới (poll 1–9, WAIT-DEADLINE 16:30:48Z, GATE NOT MET). Fixture /tmp MẤT theo reboot → rebuild lần 2 (16:26:45Z, md5 khớp đợt 125).
- 16:26:22Z Selfcheck #2 trên #116: libs 6/6 CÓ, GST 269, dpkg 1.446 (→ 1.468 lúc 16:28:29Z, ổn định), cache 168, lists 39, balloon 5.447.308 kB, avail 1.272 MB. 16:30:48Z waiter hết hạn — **chạy harness theo thủ tục (i)-143** (T4 0 attempt hợp lệ, poller đã thoát, lock TRỐNG — không thể chồng lấn attempt nào; ghi rõ ở §7).
- **16:31:49–17:01:25Z HARNESS 5/6** (driver pid 70396, boot #116). **17:02:29–17:04:58Z O8 T8 3/3.** 17:05–17:10Z replay + extract + LIMITS + paths + cờ. **0 reboot sau 16:21:33Z trong phiên T8.**

## A. O8 — T8 3/3 TRÊN #116; T01 3/3 TRÊN #115 (KHÁC BOOT — XEM FULL PASS §0)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #116 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `bbe2e1fc`, S1 PASS 17:02:30Z |
| 2 | O8 T8 WebKit attempt2 trên #116 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `66e534ba`, S1 PASS 17:03:20Z |
| 3 | O8 T8 Chromium trên #116 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `81736056`, S1 PASS 17:04:09Z |
| 4 | O8 T01 WebKit attempt1 trên #115 | **21/21 PASS** (md5 9df451e1, 14:57:42Z) |
| 5 | O8 T01 WebKit attempt2 trên #115 | **21/21 PASS** (md5 c3df5c23, 14:59:00Z) |
| 6 | O8 T01 Chromium trên #115 | **21/21 PASS** (md5 d23ce495, 15:01:08Z) |

- O8 log T8: S1 PASS 6 (3 dòng PASS × 2 lần ghi), FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0. **Gate cho boot đo `4dda8234` (#116 ứng viên): (a) KHÔNG CÓ — POSTBOOT_PASS #116 chưa từng được viết (watcher chết theo reboot; T56 đã đóng).** O8 T01 + harness KHÔNG cùng boot; **FULL PASS KHÔNG THỂ (chuỗi 2 → 0, đề xuất).**
- **preview.tsx 50ad3faf** (ổn định từ 15:00Z — luồng sản phẩm xong sửa file trước harness; O8 T01 đo 3 md5 khác nhau trong cửa sổ O8 của họ, xem F-192-T01-6). `media.ts` 2c384ed1, `vite.config.ts` ee80d093 không đổi.

## 2. Kết quả harness — 5/6; WebKit 84l10 TIMEOUT (KẸT #28) + 2 PASS; Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 124 | 16:31:52–16:46:53 | **TIMEOUT — KẸT #28** — W2-setup, runEngine:423, 0 dòng HB128, WATCHDOG-137 ×3, probe 1+1 TIMEOUT 30 s, live_diags=2 |
| 2 | WebKit 85m4 | 0 | 16:47:09–16:49:30 | **PASS** — P1 PASS 16:47:44Z + P5 PASS, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 16:49:45–16:53:47 | **PASS** — P1 PASS 16:50:20Z + P5 PASS (0 restart) + P6 KHÔNG-KẸT, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 16:54:02–16:55:02 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 16:55:17–16:57:18 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 16:57:33–17:01:25 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn 27 → 28 — 1 kẹt mới (WebKit 84l10, W2-setup, boot #116).** **84l10 FAIL đợt này — chuỗi PASS 10 → 0 (ĐỨT).** **86n2-P1 không kẹt: lần 14** (P1 PASS 16:50:20Z).
- RAM sampler (n=60, suốt harness): balloon min 4.810.756 / max 6.171.056 kB (**95,8% trần, pinned=0**), avail min 273 MB (16:41:49Z — ĐANG KẸT) / max 1.599 MB. Balloon gần ghim trong lúc kẹt nhưng KHÔNG ghim trần lần nào (pinned=0).
- GATE-CHECK trước MỖI pha (mới đợt này — bài học F-191-T10-2): 6/6 lần ghi "T4 khong giu lock" (load5 0,91/0,46/0,97/0,83/0,86/1,26) — **0 chồng lấn với attempt T4** (poller T4 đã thoát 16:18:10Z; lock TRỐNG suốt harness). O8 cũng có GATE-CHECK trước acquire (T4 không giữ lock). **0 vi phạm phía T8.**

# §C — B2 LIVE LẦN 6: VÙNG MỚI SẠCH TIẾP; B1 BẮT KẸT THẬT #28 (QUA WATCHDOG, KHÔNG QUA V2)

## C1. Trạng thái B2 đợt này (KHÔNG đổi script — B2 đã trong 3 script từ đợt 186)

- 3 script harness giữ nguyên md5 đợt 186/187/188/189/191: 84l10 `16e5e957` (35.917 B), 85m4-hb128 `3fb2548b` (**38.737 B — VƯỢT giới hạn push, lúc push cần `ENABLE_PRIVSEP=0`**), 86n2-hb128 `de925614` (**43.653 B — VƯỢT, cần `ENABLE_PRIVSEP=0`**). `node --check` PASS cả 3 (kiểm lúc copy). Thiết kế §C4 LIMITS T8-180 + triển khai §C1 LIMITS T8-186 — không sửa đợt này.
- **Mẫu bọc + ngưỡng giữ nguyên:** ngưỡng 120 s, run_len ≥3, (e)/(f), ngân sách diag (≤2/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. **V2 (f'') vẫn là phương án chính.**

## C2. Kiểm chứng offline LẠI TRƯỚC harness (check-fresh-192t8.py trên 6 log tổng hợp đợt 186)

| Ca | Log tổng hợp | check-fresh-192t8.py (V2) |
|---|---|---|
| B2-1 setup treo 150 s | `planb-b2-setup-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-2 startPlaying treo 150 s | `planb-b2-startplaying-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-3 P6-wait treo 150 s + WATCHDOG-137 @60 s | `planb-b2-p6wait-150s-wd.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-4 P6 seeking-kẹt 150 s, KHÔNG watchdog | `planb-b2-p6wait-150s-nowd.log` | OK maxspan=150 s wd=0 — **KHÔNG trigger (giới hạn đã biết, §C5)** |
| B2-5 P6 sạch 90 s | `planb-b2-p6-clean-90s.log` | OK maxspan=85 s wd=0 — **không FP, dưới ngưỡng 120 s** |
| B2-6 setup sạch 60 s | `planb-b2-setup-clean-60s.log` | OK maxspan=55 s wd=0 — **không FP** |

- **Kết luận offline: ĐẠT (khớp hệt §C2 đợt 186/187/188/189/191).** Cả 3 vùng B2 mới đều trigger đúng @125 s khi treo thật; không FP trên 2 ca sạch.

## C3. Kiểm live (harness 5/6 đợt này — script B2 là script harness)

| Vùng B2 | WebKit 84l10 | WebKit 85m4 | WebKit 86n2 | Chromium 84l10 | Chromium 85m4 | Chromium 86n2 |
|---|---|---|---|---|---|---|
| `setupProject setup` | — (kẹt W2, 0 dòng HB128) | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `startPlaying start` | — | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `P6-wait wait` | — | — | **19 dòng** (elapsed 5→90 s) | — | — | **19 dòng** (elapsed 5→90 s) |
| check-fresh live | OK maxspan=0 s wd=3 | OK maxspan=5 s | OK maxspan=85 s | OK maxspan=0 s | OK maxspan=10 s | OK maxspan=85 s |

- **B2 VÙNG MỚI SẠCH LẦN 6** — chưa bắt kẹt thật ở vùng mới (setup/startPlaying/P6-wait 0 trigger; P6-wait tối đa elapsed=90 s — biên 30 s dưới ngưỡng 120 s).
- **P6-wait chạy tới elapsed=90 s cả hai engine, maxspan=90 s — biên còn 30 s** (đợt 191: WebKit 85 s, Chromium 95 s — biên 30–35 s). Vẫn dưới ngưỡng 120 s, KHÔNG FP.
- **Replay sau live (2 entry sạch mới, 1 entry kẹt mới):** 192-sach-85m4 22 dòng, max run span 5 s; 192-sach-86n2-hb128 39 dòng, max run span **85 s** (run_len=18, playhead=30 ct=30), KHÔNG kích hoạt mọi phương án — **P6-wait không gây FP ngay cả trong replay** (biên 35 s). 192-ket-84l10: 0 dòng HB128 — KHÔNG kích hoạt mọi phương án (lỗ hổng phủ sóng, §C4).

## C4. Replay V1/V2 sau O8 (replay-1c-192t8.py + replay-f-fix-192t8.py — đã thêm 3 entry `192-*`)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 31 log sạch duy nhất theo md5** (33 entry; 2 cặp trùng byte-identical 181/182 — xem dưới). Đợt 192 đóng góp 2 log sạch mới + 1 log kẹt mới.
- **Kẹt theo từng phương án: (c') V0: 164@125 s, 178@125 s, 188@125 s (3/5; lỡ 171, 183); V2 (f''): 164/171/178/183/188 @125 s (5/5, KỊCH BẢN CHÍNH); V1-300: 164/171/178/188 @125 s (4/5; lỡ 183); V1-60: 171/178/188 (3/5; lỡ 164, 183).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (5/5 kẹt @125 s, FP 0); **V1-300 ĐẠT** (4/5, FP 0) — V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 31 log sạch duy nhất (md5).**
- **F-184-T8-1: KHÔNG TÁI DIỄN:** 0 NO-FILE trong cả hai lần chạy replay.
- **Số log sạch chuẩn (md5-unique): 17/17/19/21/23/25/27/29/31 (183/184/185/186/187/188/189/191/192 — 190 VOID, không đóng góp).** Hai cặp trùng: 181/182-sach-85m4 (md5 `166b271d`) + 181/182-sach-86n2-hb128 (md5 `e11c62cb`) — byte-identical, đã biết từ đợt 187. 0 FP không đổi theo cả hai cách đếm.
- **Biên an toàn (không đổi sau B2):** log sạch max identical-run span **90 s** (run P6-wait — ngưỡng 120 s → biên 30 s). Đây là biên ĐÚNG THIẾT KẾ — không phải FP. Watchdog chỉ kích hoạt sau evaluate im lặng >60 s — tín hiệu ĐỘC LẬP, không vòng tròn.

## C5. Giới hạn B2 (trung thực — B2 không phải toàn năng)

- **B2-4 (offline): P6 seeking-kẹt mà evaluate vẫn trả về (không watchdog) → không trigger (giới hạn đã biết, đứng nguyên).**
- **192-ket-84l10 (mới): kẹt TRƯỚC heartbeat — 0 dòng HB128 → KHÔNG trigger cả hai phương án (V2 0/1, V1-300 0/1)** — lỗ hổng phủ sóng thứ 3 (sau kẹt-179 + 180-ket-86n2-std). Kẹt được bắt live qua WATCHDOG-137 ×3 + probe TIMEOUT → diag 2/2 (xem §D4).
- **B2 đã bắt kẹt thật đầu tiên đợt 188 (P5, vùng chung)** + kẹt #28 đợt này (84l10 W2, qua watchdog) — nhưng chưa bắt kẹt thật nào ở vùng mới (setup/startPlaying/P6-wait). Bằng chứng bắt thật ở vùng mới thuộc ca kẹt tới.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 17 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173) + KẸT #28 (§D4)

## D1–D2. Phạm vi + Q3: 84l10 qua 4 điểm kẹt cũ (157 E4 :457; 170 W2 :433; 171 W2-setup :425; 178 W2-setup :443; script `16e5e957` — B2) + ca 192 W2-setup :423 (§D4); 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 FAIL (exit 124), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 192: **CÓ dữ liệu mới về kẹt 84l10 (§D4)**. **Chuỗi 84l10 PASS: 10 → 0 (ĐỨT).** Tần suất: **5 ca / 33 đợt ≈ 15%** (157, 170, 171, 178, 192).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Ca 192 là setup W2 đóng băng (không phải chuyển trạng thái) — giống họ kẹt "vòng poll đóng băng", cùng họ với 170/171/178.
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (xem §D4):** `gst-plugin-scanner` thiếu lúc pha kẹt khởi động (GStreamer-WARNING 16:31:57Z, 0× trong log 191) → nghiêng **hệ thống (GStreamer chưa cài xong lúc chạy)**, khác các ca trước nghiêng engine. Chromium cùng pha PASS sạch trên cùng boot → WebKitGTK vẫn là phía treo, nhưng trigger lần này là phía hệ thống.
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 192: kẹt TRƯỚC khi media chạy** (setup W1 xong 16:32:03Z, chưa tới dòng HB128 nào; playhead/ct chưa có số đo — kẹt ở tầng setup, không phải giữa clip).
- **Q4 — Race evaluate/GStreamer?** **BẰNG CHỨNG MỚI:** probe 1+1 TIMEOUT 30 s sau WATCHDOG-137 (evaluate kẹt cứng) + GStreamer-WARNING plugin loader failed cùng phút → **ủng hộ race evaluate/GStreamer ở tầng setup** (lần đầu có bằng chứng trực tiếp cả hai phía trong cùng một ca).
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ sáu, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; kiểm `gst-plugin-scanner` CÓ/KHÔNG ngay trước khi chạy pha WebKit đầu tiên (nợ từ §D4).

## D4. KẸT #28 — WebKit 84l10 W2-setup TRÊN #116 (16:31:52–16:46:53Z) — ĐIỀU TRA SƠ BỘ, CÓ BẰNG CHỨNG MỚI

- **Kẹt #28 là gì (đọc từ đĩa):** WebKit 84l10 trên #116 (4dda8234): setup W1 xong 16:32:03Z (clip 30 s), rồi evaluate im lặng tại **runEngine:423** — **WATCHDOG-137 ×3** (16:33:08Z im lặng >60 s + probe 1+1 TIMEOUT 30 s 16:33:39Z — kênh evaluate kẹt cứng / page JS chết); **0 dòng HB128** (kẹt trước heartbeat đầu tiên); pha bị `timeout 900` giết → exit 124 lúc 16:46:53Z. Diag live 2/2 (stall-live-silence-…-1795624543 lúc 16:35:43Z + …-1795624783 lúc 16:39:43Z) + diag sau timeout (stall-webkit-84l10-timeout124-1795625214). 3 thư mục stall còn nguyên.
- **Bằng chứng lúc diag live (16:35:43Z): vite HTTP 200** (0,011 s); **WebKitWebProcess RSS 254.696 kB, MiniBrowser 158.136 kB** (process sống, kênh evaluate chết); load 0,03 (máy nhàn — không phải quá tải CPU); avail 669 MB, Balloon 5.630.004 kB (87% trần, chưa ghim); dmesg EPERM; journalctl-k trống. Sau timeout: vite HTTP 000 (đã kill theo driver — bình thường).
- **Bằng chứng mới — GStreamer plugin loader:** `(MiniBrowser:70572): GStreamer-WARNING **: 16:31:57.091: External plugin loader failed. ... set the GST_PLUGIN_SCANNER environment variable` — **5 s sau khi pha khởi động**, trước WATCHDOG-137 đầu tiên 71 s. **Đối chiếu: 0 lần trong cả 3 log WebKit đợt 191 + 0 lần trong log 85m4/86n2 đợt này** (cả hai đều PASS). `gst-inspect-1.0` VẮNG ở selfcheck #2 (16:26:22Z) nhưng CÓ lúc 16:48Z; `gst-plugin-scanner` CÓ lúc 16:48Z — **replay host-side vẫn đang cài gói GStreamer trong lúc pha 84l10 chạy** (dpkg.log 2 → 530 → 1.446 → 1.468 trong 16:22–16:28Z).
- **Kết luận cơ chế (sơ bộ): H3-thuần, trigger phía hệ thống** — process sống, kênh evaluate/JS chết, vite sống, không phải lỗi RAM tuyệt đối (avail 669 MB lúc diag, load 0,03); **plugin loader thiếu lúc setup W2** (Q2 nghiêng hệ thống lần đầu; Q4 ủng hộ race evaluate/GStreamer). **Cần xác minh:** các đợt sau kiểm `gst-plugin-scanner` + `gst-inspect-1.0` CÓ/KHÔNG ngay trước pha WebKit đầu tiên; nếu kẹt W2-setup tái diễn mà scanner đã CÓ từ đầu thì giả thuyết này bị bác.
- **Đối chiếu Q1–Q4 cho #28:** Q1 — vòng poll đóng băng (setup W2, không phải chuyển trạng thái); Q2 — nghiêng hệ thống (scanner thiếu, xem trên); Q3 — kẹt trước khi media chạy (chưa có playhead/ct); Q4 — ủng hộ race evaluate/GStreamer (probe TIMEOUT + warning cùng ca).
- **Tái diễn?** 85m4 + 86n2 WebKit sau đó PASS sạch trên cùng boot (scanner đã có lúc đó) — **ủng hộ giả thuyết "thiếu scanner lúc khởi động"**: cùng boot, cùng engine, chỉ khác thời điểm (trước/sau khi replay cài xong tools). Chromium 3/3 PASS (không dùng GStreamer của WebKitGTK).
- **Nợ đứng:** chỉ 1 ca có trigger đo được — chưa đủ dữ kiện khẳng định tuyệt đối (cần ≥2 ca hoặc 1 ca tái diễn có kiểm scanner trước). Nếu 84l10 kẹt lại, mở điều tra đầy đủ với 4 câu hỏi trên + call-site + log cuối + RSS + HB128 cuối + trạng thái scanner trước pha. H3 ỦNG HỘ (giữ mức đợt 188).

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 192 (1 KẸT MỚI — BẰNG CHỨNG MỚI, XEM §D4)

## B1. Trạng thái giả thuyết sau đợt 192

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — kẹt #28 xảy ra khi avail 669 MB, load 0,03, Balloon 87% (chưa ghim); 85m4/86n2 sau đó PASS trên cùng boot với RAM tương tự.
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH HƠN (tăng từ mức đợt 188)** — ca #28 có bằng chứng trực tiếp cả hai phía (evaluate kẹt cứng + GStreamer plugin loader failed) — lần đầu trigger phía hệ thống được đo trực tiếp thay vì suy luận.
- Đợt 192 T8: **1 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T01 PASS 3/3 trên #115). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS, lần thứ 14.**

# §E — CHECKLIST (o) ĐỢT 192 (gọn — chỉ mục đổi so với đợt 191)

- o1. F-186-T0-1 (#106 chưa xác minh) — ĐÃ QUYẾT (e) đợt 186: cea79500 = #107.
- o2. Run 193 kết cục thuộc T7-193 (T7-192 phán; run 192 FAILED 10:56:00Z, không phải timeout — T01-192).
- o3. F-185-T1-1 (prose §112) — ĐÃ SỬA XONG đợt 186.
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 273–1.599 MB trong harness; balloon max 95,8% trần, pinned=0.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; T4-192: (p) live #11 đề xuất KHÔNG ĐẠT; B2 dữ kiện thứ 4 LẪN LỘN.
- o6. F-181-T4-3 (X193) — ĐÃ ĐÍNH CHÍNH: X193 là Xvfb của chính probe T4. X11 lúc T8 đóng: **0 file**.
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-192 CHẾT theo reboot 16:21:33Z; POSTBOOT_PASS #116 CHƯA CÓ — thuộc T56-193/T10-192.
- o8–o10. F-181-T5-2 (ledger ts) + F-180-T5-3 (lệch btime 11 s; /proc/1 #116 = btime +13,03 s) + F-174-T5-6 — GHI NHẬN (#115 repair-sớm-quyết-h poll=1 CÓ caveat; #116 KHÔNG CÓ cờ).
- o11–o13. F-181-T6-1 + F-180-T6-4 + F-180-T6-5 — GHI NHẬN; T56-192 ĐÃ ĐÓNG CỜ ((A) 120/120 lần 41; #115 KHÔNG GIẾT HOLDER, chuỗi 18 → 19).
- o14–o16. F-181-T7-1 (OUTAGE 8.406 s — T7-194 phán cuối) + F-180-T7-4 + F-180-T7-5 — GHI NHẬN; T7-192 ĐÃ ĐÓNG CỜ.
- o17. F-185-T8-4 (stat sai marker) — **ĐÃ SỬA (T0-186)** — marker 67 reboot (#49–#115), 68 nếu #116.
- o18. Quyết (o) 191 — GHI NHẬN; số mới thuộc T7-192 (đã đóng).
- o19. Quyết (l) 152 — ĐÃ THỰC HIỆN: marker 67/68; **T8 đóng ~17:10Z, SAU hạn cờ ~17:00Z** (do reboot + waiter + harness sau gate — ghi rõ, không giấu).
- o20. Quyết (j) 191 — **ĐÃ THỰC HIỆN (§2, §C, §D4, §F, §B, §C4)** — B2 sạch lần 6; V2 replay 5/5 @125 s, V1-300 4/5; F-191-T8-1/2/3 ĐÃ SỬA (xem §8); **84l10 chuỗi 10 → 0 (ĐỨT — kẹt #28); B1 live sạch 2 → 0 (ĐỨT)**.
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T01-192/T9-192; T9-192 ĐÃ ĐÓNG CỜ).

# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 192 — DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup đợt này được bắt live bằng watchdog + diag-stall của driver, không cần diag riêng). **Mở lại nếu kẹt setup tái hiện mà diag live không đủ bằng chứng.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy). **Chi phí B2 giữ nguyên:** 85m4-hb128 38.737 B (VƯỢT, dư −969 B); 86n2-hb128 43.653 B (oversize — cần ENABLE_PRIVSEP=0); 84l10 35.917 B (dư 1.851 B).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 50ad3faf (ổn định từ 15:00Z); `media.ts` 2c384ed1; `vite.config.ts` ee80d093; `84l10` **16e5e957 (B2, KHÔNG ĐỔI)**; `85m4-hb128` **3fb2548b (B2, KHÔNG ĐỔI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` de925614 (B2, KHÔNG ĐỔI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). **T8 KHÔNG đổi file repo đợt này.**
- **Working dir `repo-1/hidden_files/round192-t8/`** — copy `cp -r` 191→192 (exit 0). **Đổi nhãn đúng** (191t8→192t8, waiter deadline → 16:30Z, lock ticket t8-round192) — grep: chỉ còn tham chiếu 191 trong khối LOGS đóng băng của replay (2 entry `191-*`) + nhãn lịch sử LIVE-DIAG-189/FRESH-CONTENT-189 (cố định). **F-191-T8-1/2/3 ĐÃ SỬA** (waiter kiểm cả t5 lẫn t56; extract nhãn động; extract lọc process theo scratch — kiểm chứng ps sót 0/0).
- Extract (dùng lại): trích ĐÚNG số harness (84l10=124 + 0/0/0/0/0) + O8 (webkit 21/21 md5 bbe2e1fc/66e534ba, chromium 21/21 md5 81736056) + sampler n=60 + WATCHDOG-137: 3. Nhãn "ovsize LIMITS 191" nay ĐÚNG (động).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN.** 0 symlink Singleton\* stale lúc copy.
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP)** — `o8-s1-probe-192t8.mjs` md5 `453d1082` (giống hệt 175–192; `node --check` PASS); O8 T8 chạy với probe này (S1 PASS 6, FAIL 0 — attempt1/2 PASS nên probe không cần chạy lại).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round192-t8). **F-181-T8-5: ÁP DỤNG CHO #115** (repair-sớm-quyết-h, poll=1, CÓ caveat; #116 KHÔNG CÓ cờ). **F-181-T8-6 (gst-inspect vắng): TÁI DIỄN TRÊN #116** (VẮNG lúc selfcheck #2 16:26:22Z, CÓ lúc 16:48Z — xem §D4). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 191 — tổng boot không cờ 25 → 26 (#113). F-181-T8-8 (log stale): VẪN CÒN — đợt này KHÔNG tái diễn.**

## 6. Dọn dẹp + kiểm cuối — sạch (trên #116, không reboot sau 16:21:33Z)

- Driver harness (pid 70396) đã thoát sau pha cuối (17:01:25Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng). O8 driver đã nhả lock 17:04:58Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 96 cooldown — extract xác nhận).
- Kiểm cuối ~17:08Z (trên #116): process Xvfb/MiniBrowser/WebKit sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` còn **0 file**. Extract (mới, F-191-T8-3): ps sót T8 0, clicktest T8 0.
- Fixture /tmp: **ĐÃ REBUILD 2 LẦN** (#115 14:47Z; #116 16:26:45Z — md5 khớp đợt 125 cả hai lần) — vẫn còn lúc đóng.
- **Reboot #116 (boot `4dda8234`, btime 16:21:33Z, gap 7.057 s):** xảy ra GIỮA đợt (sau khi T4 poller thoát, trước khi harness chạy); **0 reboot trong cửa sổ đo (16:31–17:04Z).** dpkg.log 1.468 dòng (ổn định sau replay host-side). #116 ỨNG VIÊN (parent quyết (e)); (m) #116 thô +43,986 s (T2-192 phán); POSTBOOT_PASS #116 CHƯA CÓ; #115 CÓ cờ (repair-sớm-quyết-h, poll=1, CÓ caveat).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l`.** Không chạy script nặng khi T4 attempt (harness chạy SAU khi poller T4 thoát + waiter hết hạn — theo (i)-143; GATE-CHECK 6/6 pha đều ghi T4 không giữ lock).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 5/6 — WebKit 84l10 TIMEOUT (KẸT #28) + 85m4/86n2 PASS; Chromium 3/3 PASS (trên #116 ứng viên).** **Kẹt cộng dồn 27 → 28 — 1 kẹt mới.**
2. **O8 T8 3/3 (WebKit 21/21 md5 bbe2e1fc/66e534ba; Chromium 21/21 md5 81736056 — trên #116).** O8 T01 PASS 3/3 trên #115 theo LIMITS T01 (md5 9df451e1/c3df5c23/d23ce495 — T01 ĐÃ ĐÓNG CỜ). **O8 chia đôi boot.**
3. **Chuỗi WebKit FULL PASS 2 → 0 (ĐỨT — KHÔNG THỂ: 5 chân không cùng boot; parent/T10 quyết cuối).** Gate (a) #116 KHÔNG CÓ cờ; O8 T01 trên #115; O8 T8 trên #116; lượt yên #60 0 lượt hợp lệ; harness 5/6.
4. **POSTBOOT_PASS #115 CÓ 14:55:05Z (T56-192, repair-sớm-quyết-h, poll=1, CÓ caveat — GST 269 symlink debroot ephemeral, dpkg 768)** — gate (a) #115 ĐẠT có caveat. **POSTBOOT_PASS #116 KHÔNG CÓ** (watcher chết theo reboot; T56 đã đóng). **#115 ỨNG VIÊN (T01-192 chưa đóng cờ lúc T8 mở — parent quyết (e)); #116 ỨNG VIÊN.**
5. **Balloon max 95,8% trần trong cửa sổ harness (n=60, avail min 273 MB, pinned=0)** — gần ghim trong lúc kẹt (16:41:49Z) nhưng KHÔNG ghim trần lần nào; KHÔNG có sampler T9 trong LIMITS này.
6. **85m4-hb128 38.737 B (VƯỢT giới hạn push 969 B) + 86n2-hb128 43.653 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 35.917 B (dư 1.851 B). **LIMITS này DƯỚI giới hạn push (xem stat lúc ghi cờ).**
7. **Chuỗi verdict: 84l10 FAIL (chuỗi PASS 10 → 0, ĐỨT); 86n2-P1 không kẹt lần 14; B2 vùng mới sạch lần 6; B1 BẮT kẹt thật #28 (chuỗi live sạch 2 → 0, ĐỨT); số chuẩn 29 → 31 (md5-unique).** H3 ỦNG HỘ MẠNH HƠN (giữ mức đợt 188 + bằng chứng trigger §D4).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') PHƯƠNG ÁN CHÍNH — replay V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 31 log sạch duy nhất (md5).** V1 chỉ còn đối chứng trong replay. Live đợt này: V2 KHÔNG trigger trên kẹt #28 (0 dòng HB128 — lỗ hổng phủ sóng); kẹt được bắt qua WATCHDOG-137 + probe TIMEOUT → diag 2/2.
10. **T4-192 ĐÃ ĐÓNG CỜ (16:42Z) với lượt yên #60 0 LƯỢT HỢP LỆ (chuỗi 2 → 0 đề xuất); (p) live #11 đề xuất KHÔNG ĐẠT; B2 dữ kiện thứ 4 LẪN LỘN; auto-trigger LIVE 0 FIRE trong cửa sổ attempt (T9-192 phán cuối).** T01/T2/T56/T7/T9-192 ĐÃ ĐÓNG CỜ lúc T8 đóng.
11. **#116 ỨNG VIÊN (T01-192 chưa đóng cờ lúc T8 mở; parent quyết (e)); marker 67 reboot (#49–#115), 68 nếu #116;** (m) #116 thô +43,986 s (T2-192 phán cuối); POSTBOOT_PASS #115 CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat); POSTBOOT_PASS #116 CHƯA CÓ.
12. **T8 ĐÓNG ~17:10Z, SAU hạn cờ ~17:00Z, TRONG hạn cứng ~17:35Z** (do reboot 16:21:33Z giết waiter + fixture, waiter hết hạn 16:30:48Z, harness 16:31–17:01Z, O8 17:02–17:04Z). 0 reboot trong cửa sổ đo (16:31–17:04Z).

## 8. Sai số mới (F-192-T8-N) + nợ cũ đã xử lý

- **F-192-T8-1 — WAITER CHẾT THEO REBOOT, KHỞI ĐỘNG LẠI LÀM MẤT LOG CŨ (T8 TỰ BẮT — LỊCH SỬ GIỮ TRONG LIMITS NÀY):** waiter bản đầu 14:45:24Z–16:21:47Z (poll 1–97, GATE-NOT-YET suốt; postboot=1 từ poll 11; t4attempt=LOCK-T4 ở poll 86–92) chết theo reboot 16:21:33Z + runtime restart. Khởi động lại 16:22:48Z; script làm `: > log` nên **97 poll cũ mất khỏi đĩa** (chỉ còn bản mới poll 1–9 + WAIT-DEADLINE 16:30:48Z). Lịch sử đầy đủ ghi ở §1. Không ảnh hưởng số harness/O8/replay. Nợ đợt 193: waiter append log thay vì truncate khi khởi động lại.
- **F-192-T8-2 — GATE-CHECK MỚI HOẠT ĐỘNG 6/6 PHA (BÀI HỌC F-191-T10-2 ĐÃ ÁP DỤNG):** driver + o8-driver nay kiểm lock T4 trước MỖI lần acquire (log "GATE-CHECK … T4 khong giu lock, load5=…" 6/6 pha harness + 1 lần O8); 0 lần phải tạm dừng (T4 poller đã thoát, lock trống suốt). Không có chồng lấn nào với attempt T4 đợt này.
- **F-192-T8-3 — GStreamer-WARNING PLUGIN LOADER FAILED LÚC PHA KẸT KHỞI ĐỘNG (BẰNG CHỨNG MỚI — XEM §D4):** warning 16:31:57Z trong log kẹt #28; 0× trong log 191 + 0× trong 85m4/86n2 đợt này; scanner + gst-inspect chỉ xuất hiện sau 16:48Z. Nợ đợt 193: kiểm `gst-plugin-scanner` + `gst-inspect-1.0` CÓ/KHÔNG ngay trước pha WebKit đầu tiên.
- **F-192-T8-4 — V2 MÙ VỚI KẸT TRƯỚC HEARTBEAT (LỖ HỔNG PHỦ SÓNG THỨ 3 — XEM §C5):** 192-ket-84l10 0 dòng HB128 → V2 KHÔNG trigger live lẫn replay (cùng họ kẹt-179 + 180-ket-86n2-std); kẹt được bắt qua watchdog (i) + probe TIMEOUT → diag 2/2. Không sửa V2 đợt này (diag theo mtime log đã bắt được ca này).
- **F-192-T8-5 — HARNESS CHẠY TRÊN BOOT KHÔNG CÓ POSTBOOT_PASS (GHI RÕ, KHÔNG GIẤU):** harness + O8 T8 chạy trên #116 khi chưa có cờ nào cho boot này (watcher chết, T56 đã đóng); selfcheck #2 xác minh libs 6/6 + GST 269 + dpkg 1.468 ổn định trước khi chạy — boot ở trạng thái chạy được, nhưng gate (a) KHÔNG ĐẠT theo hình thức. FULL PASS do đó KHÔNG THỂ; các verdict harness/O8/B2/V2 là số đo thật trên #116, không phải số đo trên boot đã xác minh đầy đủ. Parent/T10 quyết cách ghi.
- **F-191-T8-1 — ĐÃ SỬA** (waiter kiểm cả t5 lẫn t56). **F-191-T8-2 — ĐÃ SỬA** (nhãn extract động — kiểm chứng "ovsize LIMITS 191 = 37.756 B"). **F-191-T8-3 — ĐÃ SỬA** (extract lọc process theo scratch — kiểm chứng ps sót 0/0). **F-191-T8-4 — KHÔNG TÁI DIỄN** (86n2-P5 đợt này PASS 0 restart). **F-189-T8-1 — ĐÃ SỬA** (nhãn o8-driver "T8-192"). **F-189-T8-2 — KHÔNG TÁI DIỄN** (brief 192 lấy mốc §14.2-191). **F-188-T8-1 — KHÔNG TÁI DIỄN** (dpkg ổn định 1.468). **F-186-T8-2 — KHÔNG TÁI DIỄN** (0 symlink Singleton\* stale). **F-184-T8-1 — KHÔNG TÁI DIỄN** (0 NO-FILE). **F-183-T8-7 — KIỂM LẠI TRÊN #116: libevent-2.1.so.7 CÓ.**
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG.** Dọn `smoke/` khỏi bản copy (191 smoke → `smoke/archive-191/`); replay chạy sạch. **Lưu ý:** extract vẫn liệt kê cả báo cáo O8 stamp cũ đợt 189/191 trong `o8-webkit/`/`o8-chromium/` (copy kèm) — LIMITS này chỉ trích số 192 (md5 bbe2e1fc/66e534ba/81736056).
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-192t8.sh` (cả 6 pha).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS 2 → 0 (ĐỨT — KHÔNG THỂ: 5 chân không cùng boot)** — parent/T10 quyết (gate (a) #116 không có cờ, O8 chia đôi boot, lượt yên #60 0 lượt hợp lệ, harness 5/6).
2. **B2 vùng mới sạch lần 6; B1 BẮT kẹt thật #28 (chuỗi live sạch 2 → 0, ĐỨT)** — parent ghi nhận (giới hạn §C5 đã ghi rõ; biên P6-wait còn 30 s; V2 mù với kẹt trước heartbeat — lỗ hổng thứ 3).
3. **Chuỗi 84l10 PASS 10 → 0 (ĐỨT — kẹt #28) + chuỗi 86n2-P1 không kẹt 13 → 14** — parent/T10 quyết (84l10 kẹt W2-setup có trigger đo được §D4; 86n2-P1 PASS 16:50:20Z).
4. **F-192-T8-4 số chuẩn 29 → 31 (md5-unique)** — parent ghi nhận, không còn nợ.
5. **Reboot #116 (4dda8234, btime 16:21:33Z, gap #115→#116 = 7.057 s)** — ỨNG VIÊN (T01-192 chưa đóng cờ lúc T8 mở — parent quyết (e)); (m) #116 thô +43,986 s (T2-192 phán cuối); POSTBOOT_PASS #116 CHƯA CÓ (ai viết — T56-193?); #115 CÓ cờ (repair-sớm-quyết-h, poll=1, CÓ caveat).
6. **F-192-T8-1 (waiter mất log cũ khi khởi động lại) + F-192-T8-2 (GATE-CHECK 6/6 — đã áp dụng, giữ lại) + F-192-T8-3 (scanner thiếu lúc kẹt #28) + F-192-T8-4 (V2 mù kẹt trước heartbeat) + F-192-T8-5 (harness trên boot không cờ)** — parent ghi nhận; không đổi verdict. Nợ đợt 193: waiter append log khi khởi động lại; kiểm scanner trước pha WebKit đầu tiên.
7. **Lượt yên #60 0 LƯỢT HỢP LỆ (chuỗi 2 → 0 đề xuất); (p) live #11 đề xuất KHÔNG ĐẠT; B2 dữ kiện thứ 4 LẪN LỘN** — T4-192 chi tiết; auto-trigger LIVE 0 FIRE trong cửa sổ attempt (T9-192 phán cuối).
8. **Kẹt 84l10 #28 — ĐIỀU TRA SƠ BỘ XONG (§D4): H3-thuần, trigger GStreamer plugin loader thiếu lúc W2-setup** — nợ đợt sau: kiểm scanner trước pha WebKit đầu tiên; nếu kẹt W2-setup tái diễn mà scanner đã CÓ từ đầu thì giả thuyết trigger bị bác; nếu P5 kẹt lại (ca thứ 2), mở điều tra riêng đầy đủ như 84l10 (Q1–Q4 + call-site + log cuối + RSS + HB128 cuối); H3 ủng hộ mạnh hơn.
9. Mở từ trước, vẫn đứng: **#115 KHÔNG GIẾT HOLDER (T56-192; chuỗi 18 → 19; #116 thuộc T56-193); (A) 120/120 lần 41 (T56-192); (m) #103 DƯƠNG +37,543 s (parent 185 quyết cuối); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (T2-192); (m) #56 (T2-192); G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần chạy (T9-192 đã đóng); R9 (a); file oversize 6,4 MB chưa quyết; u2net là fallback; fixture /tmp đã rebuild 2 lần (md5 khớp đợt 125); KHÔNG PUSH — chờ push = đợt 191 (12/45/42/31) + batch đợt 192 (T10 đếm cuối).**
10. **F-192-T01-9 (reboot thứ hai giữa đợt) + F-192-T4-1 (lượt yên #60 0/3)** — thuộc T01/T4 (T8 chỉ ghi nhận).
