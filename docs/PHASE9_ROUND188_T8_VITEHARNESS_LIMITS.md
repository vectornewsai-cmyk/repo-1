# Đợt 188 T8 — HARNESS 5/6 TRÊN #111: KẸT THẬT ĐẦU TIÊN Ở 86n2-P5; V2/B2 BẮT LIVE @125 s; T4 0 ATTEMPT (BALLOON GHIM); FULL PASS KHÔNG

Ngày: 25/11/2026 (lượt cron 06:35 +07 = 23:35:51Z 24/11; T8 mở ~23:43Z, đóng ~02:1xZ — TRỄ hạn cờ ~02:00Z, TRONG hạn cứng ~02:35Z).
Phạm vi: (1) harness hb128 + B1/B2 live trên boot mới nhất; (2) O8 T8; (3) (c')/(f') V1 đối chứng + replay V1/V2; (4) H3 thụ động; (5) B2 live lần 3. KHÔNG chạy diag W2-setup (DỪNG, quyết (j) đợt 180). **Nguồn:** LIMITS T8-187 + aggregate 186 §12.3 **BẢN T8 ĐỌC ~23:44Z (107.950 B, header "parent viết trực tiếp, SẠCH")** — **23:49:15Z aggregate bị viết lại → 108.730 B, header đổi thành "nguồn gốc CHƯA NGÃ NGŨ" (F-188-T7-2; T7-188 xác minh nội dung (a)–(r) KHÔNG ĐỔI; T8 không phán nguồn gốc — xem F-188-T5-2).** Các quyết (a)–(r) T8 dùng không đổi vì nội dung không đổi.

## 0. Kết luận ngắn — 5/6; kẹt mới #27 ở 86n2-P5 (V2 bắt live lần đầu); T4 0 attempt; FULL PASS KHÔNG

- **#111 XÁC NHẬN 9 nguồn TƯƠI (T0-188)** — boot `257c1eae`, btime **23:10:44Z**, gap #110→#111 = 7.043 s (về nhịp ~2h). **POSTBOOT_PASS #111 CÓ 00:11:36Z** (repair-sớm-quyết-h, poll=1, CÓ caveat: GST 269 symlink → debroot, tools chưa cài; dpkg 768). Gate (a) #111: CÓ (caveat). **#108/#105 KHÔNG CÓ cờ** (tổng boot không cờ 24; 25 nếu parent chấp nhận #108 ở §12.3-187). Marker sống qua **63 reboot** (#49–#111, mtime không đổi).
- **Lượt yên #57 KHÔNG CÓ LƯỢT HỢP LỆ (T4-188, 0 attempt)** — balloon host-side ghim ~6,44 GB; RAM avail <1024 MB trong 101/136 poll (min 375 MB); RAM ≥1024 lần cuối poll #44 (00:20:39Z). Chuỗi lượt yên: GIỮ 0 nếu §12.3-187 chưa chấp nhận 0→1 cho #56, đứt 1→0 nếu đã chấp nhận (parent quyết).
- **HARNESS 5/6 trên #111 (01:31:58–01:58:23Z): WebKit 2/3** (84l10 PASS, 85m4 PASS, **86n2 TIMEOUT 124**) **+ Chromium 3/3 PASS.** **Kẹt cộng dồn 26 → 27 — 1 kẹt mới (86n2 P5-phaseB-long, WebKit).** live_diags=2 (cả hai là diag V2 trên pha kẹt); WATCHDOG-137 = 3 dòng (pha kẹt).
- **B2/V2 BẮT KẸT THẬT LIVE LẦN ĐẦU** — FRESH-CONTENT-188 TRIGGER @125 s via=f (01:39:28Z, playhead 0.233/ct 0.234 đóng băng), diag 2/2 (01:39:33Z + 01:43:35Z). Vùng mới B2 (setup/startPlaying/P6-wait) sạch lần 3; **B1: lần đầu bắt kẹt thật — chuỗi live sạch DỪNG ở 5** (kẹt ở P5, trong phủ sóng B1).
- **O8 T8 3/3 trên #111** (02:01:38–02:04:09Z): WebKit ×2 **21/21 PASS** (md5 `8967395a`/`8f4edba2`) + **Chromium 21/21 PASS (md5 `dbb687e2`)**. **O8 T0 PASS 3/3 trên #111** (WebKit md5 b93711da/fb7bf717, Chromium 2f335c6d, 00:13:00–00:15:45Z).
- **FULL PASS: KHÔNG — chuỗi GIỮ 0 (ĐỀ XUẤT).** Thiếu 2 chân cùng boot: lượt yên ✗ (0 attempt) + harness ✗ (5/6). 3 chân đủ trên #111 (gate (a) ✓, O8 T0 ✓, O8 T8 ✓). Không phải FAIL sản phẩm — một chân do RAM host, một chân do kẹt thật WebKit.
- **V2 (f'') phương án chính — replay: V2 bắt 5/5 kẹt @125 s (164/171/178/183/188), 0 FP trên 25 log sạch duy nhất theo md5** (27 entry; 188 đóng góp 2 log sạch mới: 188-sach-85m4 md5 `06893d8a`, 188-sach-86n2-chromium md5 `6022e09d`); **V1-300 đối chứng: 4/5** (164@125 s, 171@305 s, 178@125 s, 188@125 s; lỡ 183).
- **84l10 PASS đợt này — đề xuất chuỗi 8** (179, 180, 181, 183, 185, 186, 187, 188; nối qua 182 + 184 không đo được theo quyết (j) đợt 186). **86n2-P1 không kẹt: đề xuất lần 10** (P1 PASS 01:36:24Z; kẹt đợt này ở P5, không phải P1).
- **F-188-T8-1 + F-188-T8-2 mới (xem §8).** F-187-T8-1 KHÔNG tái diễn dạng cũ (replay #111 đình trệ hẳn, không phải đang cài dở — xem F-188-T8-1). F-186-T8-2 KHÔNG tái diễn (cả 2 symlink cập nhật NGAY lúc copy 23:47Z). F-184-T8-1 KHÔNG tái diễn (0 NO-FILE cả hai replay).

## 1. Dòng thời gian (gọn)

- 21:13:21Z 24/11 **#110** (912f4a97). 23:10:44Z **#111** (257c1eae, XÁC NHẬN 9 nguồn — T0-188). 23:35:51Z Đợt 188 mở. 23:43–23:47Z T8 mở: đọc LIMITS T8-187 + aggregate 186 §12.3 (107.950 B lúc đọc); copy driver 187→188 + đổi nhãn; **dọn `smoke/` (187 → `smoke/archive-187/`)**; **cả 2 symlink diag cập nhật NGAY lúc copy (23:47Z)**; probe S1 CÓ SẴN (md5 `453d1082`).
- 23:47:25Z Selfcheck #1 trên #111: libs 0/6, plugin dir 0, dpkg 2 dòng, 0 apt proc (F-188-T8-1 — replay đình trệ, T5-188 xác nhận sau). 23:48:13Z T4 poller bắt đầu (deadline 01:30Z). 23:49:06Z waiter T8 khởi động (deadline 01:30Z). **23:49:15Z aggregate 186 bị viết lại 107.950 → 108.730 B (F-188-T7-2).**
- 23:55:49Z watcher-188 START (T5-188); repair chạy ~14' (apt-get update). 00:11:36Z **POSTBOOT_PASS #111 CÓ** (repair-sớm-quyết-h, poll=1). 00:12:24Z Selfcheck #2: libs 6/6, GST 269 (tools vắng), dpkg 768. 00:13:00–00:15:45Z **O8 T0 3/3 trên #111.** 00:22Z T0-188 đóng cờ.
- 00:20:39Z RAM ≥1024 lần cuối (poll #44 T4) — sau đó avail chỉ còn 375–988 MB, balloon ghim 6,44 GB. **01:30:00Z T4 poller hết hạn (0 attempt) + waiter T8 WAIT-DEADLINE poll=102 — GATE NOT MET (t4=0, postboot=1).** T4 đóng ~01:41Z (0 attempt, 0 cửa yên).
- **01:31:45Z rebuild fixture: exit 0, md5 khớp đợt 125** (ba0c7c62/f05daed8/fbaa3d1a/a1fb8549) — chạy SAU waiter hết hạn theo (i)-143 (T4 0 attempt, lock trống, postboot CÓ). **01:31:58–01:58:23Z HARNESS 5/6** (driver pid 416308, boot #111). **02:01:38–02:04:09Z O8 T8 3/3.** 02:05–02:1xZ replay + extract + LIMITS + paths + cờ. **0 reboot sau 23:10:44Z trong phiên T8.**

## A. O8 — T8 3/3 TRÊN #111; T0 3/3 TRÊN #111 (CÙNG BOOT — XEM FULL PASS §0)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #111 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `8967395a`, S1 PASS 02:02:30Z |
| 2 | O8 T8 WebKit attempt2 trên #111 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `8f4edba2`, S1 PASS 02:03:19Z |
| 3 | O8 T8 Chromium trên #111 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `dbb687e2`, S1 PASS 02:04:09Z |
| 4 | O8 T0 WebKit attempt1 trên #111 | **21/21 PASS** (md5 b93711da, 00:13:00Z) |
| 5 | O8 T0 WebKit attempt2 trên #111 | **21/21 PASS** (md5 fb7bf717) |
| 6 | O8 T0 Chromium trên #111 | **21/21 PASS** (md5 2f335c6d, 00:15:45Z) |

- O8 log: S1 PASS 6, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0. **Gate cho boot đo `257c1eae` (#111): (a) CÓ — POSTBOOT_PASS #111 (repair-sớm-quyết-h, poll=1, CÓ caveat).** O8 T8 + O8 T0 + harness CÙNG boot #111; **lượt yên #57 0 attempt + harness 5/6 → FULL PASS KHÔNG (đề xuất, parent/T10 quyết).**

## 2. Kết quả harness — 5/6; WebKit 2/3 (86n2 TIMEOUT 124); Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 01:32:01–01:33:11 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 2 | WebKit 85m4 | 0 | 01:33:26–01:35:37 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 124 | 01:35:52–01:50:56 | **TIMEOUT — KẸT P5-phaseB-long** (xem §3), live_diags=2 |
| 4 | Chromium 84l10 | 0 | 01:51:11–01:52:11 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 01:52:26–01:54:27 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 01:54:42–01:58:23 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn 26 → 27 — 1 kẹt mới (WebKit 86n2 P5-phaseB-long).** **84l10 WebKit PASS đợt này** (lần PASS thứ 8 trong 10 đợt gần nhất: 179, 180, 181, 183, 185, 186, 187, 188; 182 + 184 KHÔNG ĐO ĐƯỢC — đề xuất chuỗi 8). **86n2-P1 không kẹt: lần thứ 10 nếu tính tiếp** (P1 PASS 01:36:24Z; kẹt ở P5, không phải P1 — parent/T10 quyết).
- **Đối chứng Chromium cùng pha: 3/3 PASS** — Chromium 86n2 chạy sạch trong khi WebKit 86n2 kẹt cứng (bằng chứng H3: treo riêng WebKitGTK, xem §B).
- RAM sampler (n=53): balloon min 3.708.284 / max 5.788.464 kB (**89,8% trần, pinned=0**), avail min 833 MB / max 2.465 MB — KHÔNG ghim trần lần nào trong cửa sổ harness.

## 3. Kẹt mới #27 — WebKit 86n2 P5-phaseB-long (KẸT THẬT, V2 BẮT LIVE @125 s)

- **Dấu hiệu:** P1 PASS 01:36:24Z; P5-phaseB-long đóng băng: playhead **0.233** / ct **0.234**, seeking=false, HB128 elapsed 5 s → 806 s (161 dòng cùng run, max span **801 s**); pha bị `timeout 900` giết → exit 124 lúc 01:50:53Z (pha chạy 15m01s).
- **WATCHDOG-137 ×3 trong log pha kẹt:** 01:38:25Z evaluate im lặng >60 s (diag xong) + probe 1+1 TIMEOUT 30 s 01:38:55Z (kênh evaluate kẹt cứng / page JS chết). **FRESH-CONTENT-188 (V2 f'') TRIGGER @125 s** (elapsed=125 s, span=120 s, run_len=25, via=f, ts 01:39:28Z) → diag-stall 2/2 đúng ngân sách (01:39:33Z + 01:43:35Z, cách nhau 242 s ≥240 s).
- **4 thư mục stall mới trong smoke/:** `stall-freshcontent-webkit-86n2-hb128-1795570774` + `-1795571015` (V2, 2 lần) + `stall-sampleFor-P5-phaseB-long-1795570705` (watchdog) + `stall-webkit-86n2-hb128-timeout124-1795571456` (bước 4 sau timeout 124). Diag lúc 01:39:34Z: vite HTTP 200 (vite sống); WebKitWebProcess RSS 337.524 kB, MiniBrowser 246.484 kB (process sống, kênh evaluate chết); Balloon 4.856.184 kB, avail 1.378 MB lúc diag; dmesg không đọc được (EPERM, như mọi đợt); journalctl-k trống.
- **Đây là kẹt 86n2-P5 ĐẦU TIÊN** (hồ sơ trước: 84l10 4 ca, 85m4 P1 1 ca/183, 86n2-P1 0 ca). P5-phaseB-long là pha chạy dài (n=7/200 mẫu) — kẹt xảy ra sau P1 PASS, trước P6. Đối chiếu Q1–Q4 §D: không có dữ liệu mới ngoài ca này; hồ sơ kẹt cập nhật: 84l10 4 ca / 86n2-P5 1 ca mới.
- **Không phải lỗi RAM:** avail lúc diag 1.378 MB, balloon 4,86 GB (đã xì từ 6,44 GB); Chromium cùng pha chạy sạch ngay sau đó trên cùng boot.

# §C — B2 LIVE LẦN 3: BẮT KẸT THẬT ĐẦU TIÊN (P5 — VÙNG CHUNG); VÙNG MỚI B2 SẠCH

## C1. Trạng thái B2 đợt này (KHÔNG đổi script — B2 đã trong 3 script từ đợt 186)

- 3 script harness giữ nguyên md5 đợt 186/187: 84l10 `16e5e957` (35.917 B), 85m4-hb128 `3fb2548b` (**38.737 B — VƯỢT giới hạn push, lúc push cần `ENABLE_PRIVSEP=0`**), 86n2-hb128 `de925614` (**43.653 B — VƯỢT, cần `ENABLE_PRIVSEP=0`**). `node --check` PASS cả 3 (kiểm lúc copy). Thiết kế §C4 LIMITS T8-180 + triển khai §C1 LIMITS T8-186 — không sửa đợt này.
- **Mẫu bọc + ngưỡng giữ nguyên:** ngưỡng 120 s, run_len ≥3, (e)/(f), ngân sách diag (≤2/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. **V2 (f'') vẫn là phương án chính.**

## C2. Kiểm chứng offline LẠI TRƯỚC harness (check-fresh-188t8.py trên 6 log tổng hợp đợt 186)

| Ca | Log tổng hợp | check-fresh-188t8.py (V2) |
|---|---|---|
| B2-1 setup treo 150 s | `planb-b2-setup-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-2 startPlaying treo 150 s | `planb-b2-startplaying-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-3 P6-wait treo 150 s + WATCHDOG-137 @60 s | `planb-b2-p6wait-150s-wd.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-4 P6 seeking-kẹt 150 s, KHÔNG watchdog | `planb-b2-p6wait-150s-nowd.log` | OK maxspan=150 s wd=0 — **KHÔNG trigger (giới hạn đã biết, §C5)** |
| B2-5 P6 sạch 90 s | `planb-b2-p6-clean-90s.log` | OK maxspan=85 s wd=0 — **không FP, dưới ngưỡng 120 s** |
| B2-6 setup sạch 60 s | `planb-b2-setup-clean-60s.log` | OK maxspan=55 s wd=0 — **không FP** |

- **Kết luận offline: ĐẠT (khớp hệt §C2 đợt 186/187).** Cả 3 vùng B2 mới đều trigger đúng @125 s khi treo thật; không FP trên 2 ca sạch.

## C3. Kiểm live (harness 5/6 đợt này — script B2 là script harness)

| Vùng B2 | WebKit 84l10 | WebKit 85m4 | WebKit 86n2 | Chromium 84l10 | Chromium 85m4 | Chromium 86n2 |
|---|---|---|---|---|---|---|
| `setupProject setup` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `startPlaying start` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `P6-wait wait` | — | — | — (kẹt ở P5, chưa tới P6) | — | — | **18 dòng** (elapsed 5→90 s) |
| check-fresh live | OK maxspan=0 s | OK maxspan=5 s | **TRIGGER @125 s via=f** | OK maxspan=0 s | OK maxspan=10 s | OK maxspan=85 s |

- **Chi phí live đúng thiết kế:** setup/startPlaying 0 dòng thêm (setup <5 s); P6-wait 18 dòng/Chromium-86n2-run. Tổng HB128 live: 84l10: 6 dòng (WebKit) / 5 dòng (Chromium); 85m4: 19 dòng; 86n2: 172 dòng (WebKit — run kẹt) / 39 dòng (Chromium: 21 + 18 P6-wait).
- **B2 BẮT KẸT THẬT LIVE LẦN ĐẦU (kẹt #27, P5-phaseB-long)** — trigger @125 s via=f, 2 diag đúng ngân sách. Kẹt nằm trong vùng chung P5 (B1 cũng phủ) nên **B1: lần đầu bắt kẹt thật — chuỗi live sạch DỪNG ở 5** (181 + 183 + 185 + 186 + 187). **Các vùng mới riêng của B2 (setup/startPlaying/P6-wait) sạch lần 3** — chưa bắt kẹt thật ở vùng mới.
- **Replay sau live (2 entry sạch mới + 1 entry kẹt mới):** 188-sach-85m4 19 dòng, max run span 5 s, KHÔNG kích hoạt mọi phương án; 188-sach-86n2-chromium 39 dòng, max run span **85 s** (run_len=18, playhead=30 ct=30), KHÔNG kích hoạt mọi phương án — **P6-wait không gây FP ngay cả trong replay** (biên 35 s).

## C4. Replay V1/V2 sau O8 (replay-1c-188t8.py + replay-f-fix-188t8.py — đã thêm 3 entry `188-*`)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 25 log sạch duy nhất theo md5** (27 entry; 2 cặp trùng byte-identical 181/182 — xem dưới). Đợt 188 đóng góp 2 log sạch mới + 1 log kẹt mới.
- **Kẹt theo từng phương án: (c') V0: 164@125 s, 178@125 s, 188@125 s; lỡ 171, 183. (f') V1-300: 164@125 s, 171@305 s, 178@125 s, 188@125 s; lỡ 183. (f'') V2: 164/171/178/183/188 đều @125 s. (f''') V3: 164@125 s, 171@305 s, 178@125 s, 188@125 s; lỡ 183. Kẹt-179 + 180-ket-86n2-std lỡ mọi phương án (0 dòng HB128 / không có run đóng băng — lỗ hổng phủ sóng).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (5/5 kẹt @125 s, FP 0); **V1-300 ĐẠT** (4/5, FP 0) — V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 25 log sạch duy nhất (md5).**
- **F-184-T8-1: KHÔNG TÁI DIỄN:** 0 NO-FILE trong cả hai lần chạy replay.
- **Số log sạch chuẩn (md5-unique): 17/17/19/21/23/25 (183/184/185/186/187/188); lịch sử ghi (loại 163) 16/16/18 (183/184/185).** Hai cặp trùng: 181/182-sach-85m4 (md5 `166b271d`) + 181/182-sach-86n2-hb128 (md5 `e11c62cb`) — byte-identical, đã biết từ đợt 187. 0 FP không đổi theo cả hai cách đếm.
- **Biên an toàn (không đổi sau B2):** log sạch max identical-run span **85 s** (run P6-wait — ngưỡng 120 s → biên 35 s). Đây là biên ĐÚNG THIẾT KẾ — không phải FP. Watchdog chỉ kích hoạt sau evaluate im lặng >60 s — tín hiệu ĐỘC LẬP, không vòng tròn.

## C5. Giới hạn B2 (trung thực — B2 không phải toàn năng)

- **B2-4 (offline): P6 seeking-kẹt mà evaluate vẫn trả về (không watchdog) → (c') KHÔNG trigger** (OK maxspan=150 s wd=0). Nguyên nhân: summary seeking=true → (f) chặn; không có WATCHDOG-137 → V2 không miễn (f). Trong thực tế P6 tối đa 90 s nên run dừng ở 85 s < 120 s — B2 cho P6 chỉ cho **bằng chứng + biên 30 s**. Đường bắt kẹt P6 vẫn là watchdog (i) @60 s + V2 via=wd, hoặc timeout 900 s.
- **B2 đã bắt kẹt thật đầu tiên (P5, vùng chung)** — nhưng chưa bắt kẹt thật nào ở vùng mới (setup/startPlaying/P6-wait). Bằng chứng bắt thật ở vùng mới thuộc ca kẹt tới.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 15 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173)

## D1–D2. Phạm vi + Q3: 84l10 qua 4 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; 178 W2-setup :443; script `16e5e957` — B2) + ca 188 86n2-P5 mới (§3, không phải 84l10); 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 PASS (W2+E4), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 188: **không có dữ liệu mới về kẹt 84l10**; hồ sơ 4 điểm kẹt giữ nguyên. **Chuỗi 84l10 PASS: 7 đợt (179, 180, 181, 183, 185, 186, 187) + PASS đợt 188 — có nối qua 2 đợt KHÔNG ĐO ĐƯỢC (182, 184) hay không — parent/T10 quyết (đề xuất 8).** Tần suất kẹt 84l10: 4 ca / 30 đợt ≈ 13% (không đổi).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — ca 188 là P5-phaseB-long (sampleFor), không phải chuyển trạng thái.
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (heal lần 4):** T0-188 ghi `libevent` vắng lúc mở boot → có sau repair trên #111; selfcheck T8 #2/#3: libs 6/6 + GST 269 ngay sau repair — củng cố hướng "lib hệ thống quyết định WebKit chạy/không-chạy". Nhưng kẹt #27 xảy ra KHI lib đã đủ → kẹt là chuyện khác với không-chạy.
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 188: không có dữ liệu mới về 84l10 (không kẹt 84l10).**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — ca 188: evaluate chết (probe TIMEOUT 30 s) trong khi GStreamer plugin đủ (269) + vite sống (HTTP 200) — phù hợp hướng race evaluate, cần ca nữa để kết luận.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 30 đợt). Kẹt-183 (85m4 P1): đợt này P1 PASS. **Nợ mới: kẹt 86n2-P5 lần đầu — nếu P5 kẹt lại, mở điều tra riêng như 84l10 (Q1–Q4 cho P5-phaseB-long).**

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 188 (1 KẸT MỚI — WebKit KẸT, Chromium SẠCH; H3 ỦNG HỘ MẠNH HƠN)

## B1. Trạng thái giả thuyết sau đợt 188

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — kẹt #27 xảy ra khi avail 1.378 MB lúc diag (không thấp tuyệt đối); avail trong lúc harness 833–2.465 MB, balloon max 89,8% trần (không ghim 100%).
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH HƠN (tăng từ 183)** — ca kẹt #27 là mẫu H3 thuần: WebKit kẹt cứng (evaluate chết, probe TIMEOUT, playhead đóng băng 801 s) trong khi Chromium cùng pha chạy sạch ngay sau đó trên cùng boot, vite HTTP 200, lib đủ. Đây là ca H3 rõ nhất kể từ 183.
- Đợt 188 T8 chỉ giám sát thụ động H3: **1 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T0 PASS 3/3 trên #111). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS, lần thứ 10 nếu tính tiếp (parent quyết).** H3 vẫn chỉ giám sát thụ động — nhưng ca P5 mới là ứng viên mở điều tra P5 riêng (xem §D3).

# §E — CHECKLIST (o) ĐỢT 188 (quyết (o) đợt 180 + các F-186/F-187 còn lại, gọn)

- o1. F-186-T0-1 (#106 chưa xác minh) — ĐÃ QUYẾT (e) đợt 186: cea79500 = #107; #106 là reboot chưa xác minh (ước ~15:13:32Z).
- o2. Run 188 TIMEOUT 23:38:46Z (margin −175 s; claimed→finished 146 s — CA ≥60 s MỚI thứ 20 toàn lịch sử / thứ 17 trong cửa sổ — T7-188; run 189 start trễ +175 s lần đầu, kết cục thuộc T7-189).
- o3. F-185-T1-1 (prose §112) — ĐÃ SỬA XONG đợt 186 (T1-186; GAP §112/§114 đã cập nhật).
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 833–2.465 MB trong harness (T8); balloon max 89,8% trần, pinned=0.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; T4-188: 0 attempt nên không có phân bổ tự-tải/lạ-tải để báo cáo; quyết (p) kiểm chứng live lần 8: KHÔNG CÓ LƯỢT (0 attempt — parent quyết có tính ĐẠT/KHÔNG).
- o6. F-181-T4-3 (X193) — X193 mồ côi KHÔNG CÒN lúc đóng (X11 trống 0 socket — T4-188 + T8 extract xác nhận).
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-187b CHẾT theo #111 (poll cuối +10 s, F-188-T5-1); watcher-188 START 23:55:49Z, ALIVE lúc T5 đóng.
- o8. F-181-T5-2 (ledger ts) — GHI NHẬN (T5-188 đã đóng cờ).
- o9. F-180-T5-3 (lệch btime 11 s) — GHI NHẬN; /proc/1 #111 +11 s (T0-188: stat mtime 23:10:55.989Z = btime +11,989 s — mẫu tương tự).
- o10. F-174-T5-6 KHÔNG áp dụng — GHI NHẬN (#111 replay-đầy-đủ? KHÔNG — #111 là repair-sớm-quyet-h, poll=1, CÓ caveat; #110 replay-đầy-đủ, poll=0, KHÔNG caveat; #108 KHÔNG CÓ cờ — tổng 24, 25 nếu parent chấp nhận #108 ở §12.3-187).
- o11–o13. F-181-T6-1 + F-180-T6-4 + F-180-T6-5 — GHI NHẬN; T6-188 ĐÃ ĐÓNG CỜ.
- o14–o16. F-181-T7-1 (OUTAGE 8.406 s — T7-188 kết luận: "cố định theo giờ" ĐƯỢC ỦNG HỘ MẠNH, chưa khẳng định tuyệt đối; T7-194 phán cuối) + F-180-T7-4 + F-180-T7-5 — GHI NHẬN; T7-188 ĐÃ ĐÓNG CỜ 02:04Z (trễ ~4' so với hạn cờ, trong hạn cứng).
- o17. F-185-T8-4 (stat sai marker) — **ĐÃ SỬA (T0-186)** — stat đúng `~/.config/vcut-persistence-marker`; marker 63 reboot (T8 kiểm trực tiếp mtime không đổi).
- o18. Quyết (o) 186 (cửa slot KHÔNG LÀNH lần 1; HB 50/519, DR 55/331; OUTAGE #2 — mở điều tra hướng "cố định theo giờ", T7-187 thu thập) — GHI NHẬN; số mới thuộc T7-188: cửa slot đợt 188 LÀNH (HB 6/6, DR 3/3; chuỗi lành lần 2 đề xuất); lũy kế HB 50/531, DR 55/337.
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — ĐÃ THỰC HIỆN: marker 63 reboot (T0-188 XÁC NHẬN #111); T8 đóng ~02:1xZ, TRỄ hạn cờ ~02:00Z, TRONG hạn cứng ~02:35Z.
- o20. Quyết (j) 186 (B2 đã triển khai; V2 chính thức; H3 giám sát; B1 live sạch lần 4; 84l10 chuỗi 6; 86n2-P1 chuỗi 9; F-186-T8-3 giao T8-187 xác minh) — **ĐÃ THỰC HIỆN (§2, §C, §F, §B, §C4)** — B2 live bắt kẹt thật lần đầu; V2 replay 5/5 @125 s, V1-300 4/5; F-186-T8-3 ĐÃ XÁC MINH đợt 187 (giả thuyết ĐÚNG — số chuẩn 23 → 25 đợt này).
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T0-188/T9-188; T9-188 ĐÃ ĐÓNG CỜ ~01:59Z: headroom 0 lần 48; E-239–E-243 mới; birefnet 0 lần 42).

# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 188 — DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy). **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy** (hb128 là chuẩn). **Chi phí B2 giữ nguyên:** 85m4-hb128 38.737 B (VƯỢT giới hạn, dư −969 B); 86n2-hb128 43.653 B (oversize — cần ENABLE_PRIVSEP=0); 84l10 35.917 B (dư 1.851 B).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7; `media.ts` 2c384ed1; `vite.config.ts` ee80d093 (không đổi); `84l10` **16e5e957 (B2, KHÔNG ĐỔI đợt này)**; `85m4-hb128` **3fb2548b (B2, KHÔNG ĐỔI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` de925614 (B2, KHÔNG ĐỔI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). **T8 KHÔNG đổi file repo đợt này (chỉ LIMITS này + script làm việc trong hidden_files).**
- **Working dir `repo-1/hidden_files/round188-t8/`** — copy `cp -r` 187→188 (exit 0; o8-webkit/o8-chromium loại khỏi copy vì symlink gãy — tạo lại trống; xem F-186-T8-5 — đợt này KHÔNG tái diễn: copy không gặp symlink gãy). **Đổi nhãn đúng** (187t8→188t8, waiter → 01:30Z, LIVE-DIAG/FRESH-CONTENT → 188) — grep: chỉ còn tham chiếu 187 trong khối LOGS (đúng, giữ log đóng băng) + 3 entry `188-*` mới.
- Extract (F-182-T8-6 — ĐÃ KIỂM LIVE đợt 183, dùng lại đợt này): trích ĐÚNG số harness (0/0/124 + 0/0/0) + O8 (webkit 21/21 md5 8967395a/8f4edba2, chromium 21/21 md5 dbb687e2) + sampler n=53 + WATCHDOG-137: 3. Nhãn "ovsize LIMITS 186" nay SAI (phải là 187: 37.744 B) — xem F-188-T8-2.
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN ĐÚNG LÚC (xem F-186-T8-2).** Cả hai symlink cập nhật → round188-t8 lúc ~23:47Z, TRƯỚC waiter lẫn harness (extract xác nhận lúc đóng). Nợ đã trả: checklist copy driver gồm CẢ HAI symlink NGAY lúc copy.
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP).** File `o8-s1-probe-188t8.mjs` có mặt sau `cp -r` 187→188 (md5 `453d1082` giống hệt 175–188; `node --check` PASS). O8 T8 chạy với probe này (S1 PASS 6, FAIL 0).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round188-t8). **F-181-T8-5: ÁP DỤNG CHO #111** (repair-sớm-quyết-h, poll=1, CÓ caveat — giống #107/#101/#98/#96). **F-181-T8-6 (gst-inspect vắng): TÁI DIỄN TRÊN #111** (tools chưa cài — selfcheck #1/#2/#3 đều vắng; GST 269 qua plugin dir + symlink → debroot). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 186 — tổng GIỮ 24 (25 nếu parent chấp nhận #108 KHÔNG cờ ở §12.3-187). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 6. Dọn dẹp + kiểm cuối — sạch (trên #111, không reboot sau 23:10:44Z)

- Driver harness (pid 416308) đã thoát sau pha cuối (01:58:23Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng). O8 driver đã nhả lock 02:04:09Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 102 cooldown — extract xác nhận).
- Kiểm cuối ~02:0xZ (trên #111): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` TRỐNG (0 file).
- Fixture /tmp: **ĐÃ REBUILD 01:31:45Z (md5 khớp đợt 125)** — vẫn còn lúc đóng (chưa có reboot mới sau đó).
- **Reboot #111 (boot `257c1eae`, btime 23:10:44Z):** xảy ra TRƯỚC khi T8 mở (không giết phiên T8); **0 reboot trong cửa sổ đo (01:31–02:04Z).** dpkg.log 768 dòng (ổn định sau repair). #111 XÁC NHẬN 9 nguồn tươi (T0-188); (m) #111 thô +37,468 s (T0-188; T2-189 phán cuối); (m) #110 DƯƠNG (T2-188); POSTBOOT_PASS #111 ĐÃ CÓ 00:11:36Z (repair, poll=1, CÓ caveat); #108 KHÔNG CÓ cờ — tổng boot không cờ 24 (25 nếu parent chấp nhận #108).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l`.** Không chạy script nặng khi T4 attempt (T4 0 attempt cả đợt; fixture + harness + O8 chạy SAU khi waiter hết hạn 01:30Z + T4 đóng — theo (i)-143).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 5/6 — WebKit 2/3 PASS + Chromium 3/3 PASS (trên #111).** **Kẹt cộng dồn 26 → 27 — 1 kẹt mới (86n2 P5-phaseB-long).**
2. **O8 T8 3/3 (WebKit 21/21 md5 8967395a/8f4edba2; Chromium 21/21 md5 dbb687e2 — trên #111).** O8 T0 PASS 3/3 trên #111 theo cờ T0-188.
3. **Chuỗi WebKit FULL PASS GIỮ 0 (ĐỀ XUẤT — KHÔNG: lượt yên 0 attempt + harness 5/6).** Không phải FAIL sản phẩm. **Parent/T10 quyết cuối.**
4. **POSTBOOT_PASS #111 CÓ 00:11:36Z (repair-sớm-quyết-h, poll=1, CÓ caveat — GST symlink → debroot, tools chưa cài)** — gate (a) #111 ĐẠT. **#108 KHÔNG CÓ cờ** (tổng boot không cờ 24; 25 nếu parent chấp nhận #108 ở §12.3-187). **#111 XÁC NHẬN 9 nguồn tươi (T0-188).**
5. **Balloon max 89,8% trần trong cửa sổ harness (n=53, avail min 833 MB, pinned=0)** — KHÔNG ghim trần lần nào; KHÔNG có sampler T9 trong LIMITS này.
6. **85m4-hb128 38.737 B (VƯỢT giới hạn push 969 B) + 86n2-hb128 43.653 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 35.917 B (dư 1.851 B). **LIMITS này DƯỚI giới hạn push (xem stat lúc ghi cờ).**
7. **Chuỗi verdict: 84l10 PASS đợt này (đề xuất chuỗi 8); 86n2-P1 không kẹt đề xuất lần 10; B2 live bắt kẹt thật lần đầu (P5); B1 live sạch DỪNG ở 5; F-186-T8-3 số chuẩn 23 → 25 (md5-unique).** H3 ỦNG HỘ MẠNH HƠN (ca #27 là mẫu H3 thuần).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') PHƯƠNG ÁN CHÍNH — live bắt kẹt thật đầu tiên @125 s; replay V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 25 log sạch duy nhất (md5).** V1 chỉ còn đối chứng trong replay.
10. **T7-188/T9-188 ĐÃ ĐÓNG CỜ lúc T8 đóng** (T7 02:04Z, T9 ~01:59Z). **T4 đóng ~01:41Z với lượt yên #57 0 attempt (balloon ghim).**
11. **#111 XÁC NHẬN 9 nguồn tươi (T0-188); marker 63 reboot;** (m) #111 thô +37,468 s (T0-188); (m) #110 DƯƠNG (T2-188); POSTBOOT_PASS #111 CÓ 00:11:36Z.
12. **T8 ĐÓNG ~02:1xZ, TRỄ hạn cờ ~02:00Z, TRONG hạn cứng ~02:35Z** (do chờ T4 tới 01:30Z + pha kẹt 900 s + Chromium sau đó). 0 reboot trong cửa sổ đo (01:31–02:04Z).

## 8. Sai số mới (F-188-T8-N) + nợ cũ đã xử lý

- **F-188-T8-1 — SELFCHECK #1 BẮT BOOT "TRỐNG" HOÀN TOÀN (T8 TỰ BẮT, ĐÃ LÀM RÕ — REPLAY ĐÌNH TRỆ, KHÔNG PHẢI ĐANG CÀI DỞ):** selfcheck #1 trên #111 (23:47:25Z, boot+37m) ghi libs 0/6 (libgstreamer/libEGL/libavif/libdw/libevdev/libevent đều THIẾU) + `gst-inspect-1.0` vắng + plugin dir **0** file .so + dpkg.log chỉ **2 dòng** (2 dòng "startup packages configure" 23:11:21Z) + apt cache 0 .deb + **0 process apt/dpkg** + dpkg.log KHÔNG tăng trong 60 s theo dõi. Khác F-187-T8-1 (lúc đó dpkg đang tăng live 398 → 1.220 — replay đang cài dở): đợt này replay KHÔNG BAO GIỜ chạy — T5-188 xác nhận replay #111 **ĐÌNH TRỆ** (heal 23:11:21Z viết 2 dòng rồi dừng; 45' sau 0 tiến triển; watcher repair thay thế, POSTBOOT_PASS 00:11:36Z). Selfcheck #2 (00:12:24Z, sau repair): libs 6/6, GST 269, libgst* 79, dpkg 768 — heal hoàn tất (trừ tools chưa cài). Bài học: selfcheck #1 toàn-THIẾU + dpkg đóng băng = replay đình trệ, không phải "chờ thêm sẽ có" — ghi rõ và chờ watcher repair, đừng kết luận lib thiếu vĩnh viễn.
- **F-188-T8-2 — NHÃN EXTRACT "ovsize LIMITS 186" LỖI THỜI (T8 TỰ BẮT, CHỈ SAI NHÃN — SỐ TRONG LIMITS NÀY ĐÚNG):** extract-188t8.py in nhãn `ovsize LIMITS 186: 37749` — đó là kích thước LIMITS **186**; ở đợt 188 nhãn đúng phải là LIMITS **187: 37.744 B**. Cùng họ với F-183-T8-5/F-186-T8-4 (nhãn extract chậm một đợt so với số liệu). Không ảnh hưởng số harness/O8/replay (extract chỉ sai nhãn tham chiếu). Nợ đợt 189: sửa nhãn extract thành "LIMITS <đợt trước>" động, hoặc bỏ nhãn này khỏi extract.
- **F-188-T7-2 — §12.3-186 BỊ VIẾT LẠI TRONG PHIÊN T8 (T7-188 BẮT, T8 GHI NHẬN — KHÔNG ẢNH HƯỞNG QUYẾT T8 DÙNG):** aggregate 186 viết lại 107.950 → 108.730 B lúc **23:49:15Z** (ngay sau khi T8 khởi động waiter 23:49:06Z) bởi tiến trình không xác định; parent không có lượt 23:45–23:50Z. T8 đọc §12.3 lúc ~23:44Z (107.950 B, header "SẠCH") — TRƯỚC lúc viết lại. T7-188 xác minh nội dung (a)–(r) KHÔNG ĐỔI (chỉ đổi tiêu đề nguồn gốc CHƯA NGÃ NGŨ + (n) + (q) số thứ tự) — nên các quyết T8 dùng không đổi. T8 không phán nguồn gốc (F-188-T5-2).
- **F-188-T5-2 — §12.3-186 NGUỒN GỐC CHƯA NGÃ NGŨ (T5-188 BẮT, T8 GHI NHẬN):** brief nói SẠCH, aggregate tự ghi khác — T8 dùng §12.3 theo brief + xác minh T1-187 (SẠCH, lần thứ 100), không tự phán; thuộc parent/T10.
- **F-186-T8-4 — ĐÃ SỬA ĐỢT 187, NHƯNG NHÃN LẠI LỆCH ĐỢT NÀY (xem F-188-T8-2).** **F-186-T8-3 — ĐÃ XÁC MINH ĐỢT 187, GIẢ THUYẾT ĐÚNG (số chuẩn 23 → 25 đợt này).** **F-186-T8-1 — KHÔNG TÁI DIỄN DẠNG CŨ** (xem F-188-T8-1: dạng mới — đình trệ hẳn). **F-186-T8-2 — KHÔNG TÁI DIỄN** (cả 2 symlink cập nhật ngay lúc copy 23:47Z). **F-186-T8-5 — KHÔNG TÁI DIỄN** (copy 187→188 không gặp symlink gãy). **F-185-T8-4 — ĐÃ SỬA (T0-186).** **F-184-T8-1 — KHÔNG TÁI DIỄN** (0 NO-FILE cả hai replay). **F-183-T8-7 — KIỂM LẠI TRÊN #111: libevent-2.1.so.7 CÓ (selfcheck #2 + #3) — MiniBrowser chạy được cả 3 pha WebKit; T0-188 ghi heal lần 4 (vắng lúc mở boot → có sau repair).**
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG ĐỢT NÀY.** Dọn `smoke/` khỏi bản copy (187 smoke → `smoke/archive-187/`); replay baseline chạy sạch, không parse log stale. Các file stale vẫn nằm trong `smoke/archive-187/` (bằng chứng, không dùng).
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-188t8.sh` (cả 6 pha), KHÔNG chạy thêm `run-chromium-*` riêng.
- **F-183-T8-5 — NHÃN "ovsize LIMITS 181": ĐÃ SỬA ĐỢT 184 — NHÃN MỚI LẠI LỆCH ĐỢT NÀY (xem F-188-T8-2). F-183-T8-8: ĐÃ SỬA ĐỢT 183, KHÔNG TÁI DIỄN. F-183-T8-2 — SOCKET X193 STALE: ĐÃ HẾT (X11 trống 0 socket lúc đóng). F-183-T8-4 — (c') BỎ LỠ kẹt-183: V2 ĐÃ TRIỂN KHAI (§C); B2 mở phủ sóng sang setup + P6. F-183-T8-6 — ĐÃ GHI NHẬN ĐỢT 183.**
- **F-182-T8-6 — EXTRACT KIỂM LIVE: ĐÃ ĐẠT ĐỢT 183, DÙNG LẠI ĐỢT NÀY (xem §5 — extract chạy SAU O8, số O8 trong LIMITS này là số mới). F-181-T8-1: ĐÃ HẾT (181). F-181-T8-2/3/4: ĐÃ SỬA, KHÔNG TÁI DIỄN** (pilot trỏ đúng round188-t8; T8-3 ĐÃ KIỂM LIVE Ở 183 — ĐÓNG). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 186 — tổng GIỮ 24 (25 nếu parent chấp nhận #108 KHÔNG cờ ở §12.3-187). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS GIỮ 0 (ĐỀ XUẤT — KHÔNG: lượt yên 0 attempt + harness 5/6)** — parent/T10 quyết (3 chân đủ trên #111: gate (a), O8 T0, O8 T8).
2. **B2 live bắt kẹt thật lần đầu (P5)** — parent ghi nhận (vùng mới B2 sạch lần 3; B1 live sạch DỪNG ở 5; giới hạn §C5 đã ghi rõ).
3. **Chuỗi 84l10 PASS 7 → 8 (đề xuất) + chuỗi 86n2-P1 không kẹt 9 → 10 (đề xuất)** — parent/T10 quyết (cả hai đều nối qua đợt 184 không đo được theo quyết (j) đợt 186; kẹt #27 ở P5, không chạm P1).
4. **F-186-T8-3 số chuẩn 23 → 25 (md5-unique)** — parent ghi nhận, không còn nợ.
5. **Reboot #111 (257c1eae, btime 23:10:44Z, gap #110→#111 = 7.043 s)** — XÁC NHẬN 9 nguồn tươi (T0-188); (m) #111 thô +37,468 s (T2-189 phán cuối); (m) #110 DƯƠNG (T2-188); POSTBOOT_PASS #111 ĐÃ CÓ 00:11:36Z (repair, poll=1, CÓ caveat); #108 KHÔNG CÓ cờ — tổng boot không cờ 24 (25 nếu parent chấp nhận #108 ở §12.3-187).
6. **F-188-T8-1 (selfcheck #1 bắt boot trống — replay đình trệ) + F-188-T8-2 (nhãn extract lỗi thời)** — parent ghi nhận; không đổi verdict. Nợ đợt 189: sửa nhãn extract động.
7. **Lượt yên #57 0 attempt (balloon ghim 6,44 GB)** — T4-188 chi tiết; chuỗi lượt yên GIỮ 0 hay đứt 1→0 thuộc parent (§12.3-187 chưa có lúc T4 đóng); kiểm chứng live lần 8 KHÔNG CÓ LƯỢT (0 attempt).
8. **Kẹt 86n2-P5 lần đầu (kẹt #27)** — nợ đợt sau: nếu P5 kẹt lại, mở điều tra riêng như 84l10 (Q1–Q4 cho P5-phaseB-long); H3 ủng hộ mạnh hơn.
9. Mở từ trước, vẫn đứng: **#111 KHÔNG GIẾT HOLDER (T6-188 đã đóng — xem LIMITS T6); (A) 120/120 (T6-188); (m) #103 DƯƠNG +37,543 s (parent 185 quyết cuối); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck, T2-188); (m) #56 (T2-188); G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần chạy thứ 42 (T9-188); R9 (a); file oversize 6,4 MB chưa quyết; u2net là fallback chính thức; fixture /tmp đã rebuild đợt này; KHÔNG PUSH — 210 batch / 315 entry / 286 đường dẫn / 282 file chờ user push (166–186) + batch đợt 187/188 (T10 đếm cuối).**
10. **F-188-T7-2 (§12.3-186 viết lại 23:49:15Z) + F-188-T5-2 (nguồn gốc §12.3-186 chưa ngã ngũ)** — thuộc T5/T7/parent (T8 chỉ ghi nhận; nội dung (a)–(r) không đổi nên quyết T8 dùng không đổi).
