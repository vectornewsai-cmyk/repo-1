# Đợt 187 T8 — HARNESS 6/6 TRÊN #110 (SAU REBOOT GIỮA PHIÊN); B2 LIVE SẠCH LẦN 2; F-186-T8-3 ĐÃ XÁC MINH — GIẢ THUYẾT ĐÚNG; FULL PASS KHÔNG (CHÂN CHIA 2 BOOT)

Ngày: 24/11/2026 (lượt cron 03:35 +07 = 20:35:51Z; T8 mở ~20:41Z, đóng ~21:55Z — TRONG hạn cờ ~23:00Z và hạn cứng ~23:35Z). Máy đo: VM này (CPU-only).
Phạm vi: (1) B2 live đợt 2 (§C LIMITS T8-180/186 — kiểm offline lại + kiểm live); (2) harness hb128 + B1/B2 live trên boot mới nhất; (3) O8 T8; (4) (c')/(f') V1 đối chứng + replay V1/V2; (5) H3 thụ động; (6) xác minh giả thuyết F-186-T8-3 (giao parent (j) đợt 186). KHÔNG chạy diag W2-setup (DỪNG, quyết (j) đợt 180). **Nguồn:** LIMITS T8-186 + aggregate 186 §12.3 **BẢN PARENT (SẠCH — parent viết trực tiếp 21:07Z, §12.3 TRỐNG khi parent đọc; dedup python viết mới, lần thứ 99 khớp)** + GAP §114/§115.

## 0. Kết luận ngắn — 6/6 trên #110; B2 live sạch lần 2; FULL PASS KHÔNG (chia 2 boot)

- **#109 XÁC NHẬN 9 nguồn TƯƠI (T0-187)** — boot `6f1d9f87`, btime **20:30:33Z**, gap #108→#109 = 4.841 s. **#110 MỚI GIỮA PHIÊN (T2-187, cách đếm A parent-186 (e))** — boot `912f4a97`, btime **21:13:21Z**, gap #109→#110 = 2.568 s. **#108 XÁC NHẬN** (7ea9d047, btime 19:09:52Z — parent-186 (e)). **POSTBOOT_PASS #109 CÓ 20:50:24Z** (replay-đầy-đủ, poll=0, KHÔNG caveat). **POSTBOOT_PASS #110 CÓ 21:22:15Z** (replay-đầy-đủ, poll=0, watcher-187b — viết SAU khi T5-187 đóng cờ; xem §1). Gate (a) #110: CÓ. **#105/#108 KHÔNG CÓ cờ** (tổng boot không cờ 24 → 25 nếu parent chấp nhận #108 — T5-187; #105 đã xác nhận đợt 186). Marker sống qua **61 reboot** (#49–#109, mtime `~/.config/vcut-persistence-marker` 2026-11-20 11:39:47.272154981Z KHÔNG ĐỔI (T8 kiểm trực tiếp); #110 → 62 nếu parent tính tiếp).
- **Lượt yên #56 CÓ LƯỢT HỢP LỆ trên #109 (T4-187, đóng cờ 21:28Z — HỒI PHỤC SAU REBOOT)** — attempt1 20/20 + B 5/5, tickCost median 39,0 ms ≤ 60; **chuỗi lượt yên 0 → 1 (KHỞI ĐỘNG LẠI, đề xuất)**; quyết (p) kiểm chứng live lần 7: ĐẠT; 0 vi phạm phía T4 (chuỗi đợt sạch đề xuất 2 → 3).
- **HARNESS 6/6 trên #110 (21:30:22–21:45:33Z): WebKit 3/3 PASS** (84l10 W2+E4, 85m4 P1+P5, 86n2-hb128 P1+P5+P6) **+ Chromium 3/3 PASS** (cùng 3 pha). **Kẹt cộng dồn GIỮ 26 — 0 kẹt mới.** live_diags=0 cả 6 pha; WATCHDOG-137 = 0; FRESH-CONTENT-187 = 0 kích hoạt live.
- **B2 LIVE SẠCH LẦN THỨ HAI** — setup/startPlaying 0 dòng thêm cả 6 pha; P6-wait 18 dòng/86n2-run (maxspan 85 s < 120 s); check-fresh live OK cả 6 pha; **B2 chưa bắt kẹt thật live** (không có kẹt thật đợt này). Offline kiểm lại: 3 vùng trigger @125 s, 2 ca sạch OK (khớp §C2 đợt 186).
- **O8 T8 3/3 trên #110** (21:46:15–21:48:49Z): WebKit ×2 **21/21 PASS** (md5 `585dbca9`/`c261a6b8`) + **Chromium 21/21 PASS (md5 `c6dd6e33`)** — JSON đếm lại bằng python. **O8 T0 PASS 3/3 trên #109** (WebKit md5 a1716bb3/f300052b, Chromium 3143f956, 20:58–21:01Z).
- **FULL PASS: KHÔNG — chuỗi GIỮ 0 (ĐỀ XUẤT, parent quyết).** 3 chân trên #109 (lượt yên ✓, gate (a) #109 ✓ KHÔNG caveat, O8 T0 ✓ 3/3) + 2 chân trên #110 (O8 T8 ✓ 3/3, harness ✓ 6/6) — **không đủ 5/5 cùng boot** (reboot 21:13:21Z chia đôi đợt). Không phải FAIL sản phẩm.
- **V2 (f'') phương án chính — replay: V2 bắt 4/4 kẹt có HB128 @125 s, 0 FP trên 23 log sạch duy nhất theo md5** (25 entry; 187 đóng góp 2 log sạch mới: 187-sach-85m4 md5 `731ac747`, 187-sach-86n2-hb128 md5 `7b1a3ad5`); **V1-300 đối chứng: 3/4** (164@125 s, 171@305 s, 178@125 s; lỡ 183).
- **F-186-T8-3: ĐÃ XÁC MINH — GIẢ THUYẾT ĐÚNG (giao parent (j) đợt 186).** Cả hai script replay: md5-unique 17/17/19/21 ở mốc 183/184/185/186; lịch sử ghi 16/16/18 = unique − 1 đúng cả 3 mốc; `163-sach-85m4` có mặt trong LOGS, md5 duy nhất, là log chuẩn C5.1 — quy tắc cũ loại đúng entry này. Số chuẩn parent đã quyết: **21 ở đợt 186 → 23 ở đợt 187** (xem §C4).
- **F-187-T8-1 + F-187-T8-2 mới (xem §8).** F-186-T8-4 ĐÃ SỬA (nhãn extract nay đúng "ovsize LIMITS 186: 37749"). F-186-T8-2 KHÔNG tái diễn (cả 2 symlink cập nhật NGAY lúc copy). F-186-T8-5 KHÔNG tái diễn (copy không gặp symlink gãy). F-184-T8-1 KHÔNG tái diễn (0 NO-FILE cả hai replay).
- **Waiter: GATE-FOUND poll=11 21:29:01Z** (t4=OK, postboot đường (a) cho #110; t4attempt=no-lock). Waiter v1 chết theo reboot (xem F-187-T8-2).

## 1. Dòng thời gian (gọn)

- 19:09:52Z **#108** (7ea9d047, XÁC NHẬN — parent-186 (e)). 20:30:33Z **#109** (6f1d9f87, XÁC NHẬN 9 nguồn tươi — T0-187). 20:35:51Z Đợt 187 mở. 20:41–20:47Z T8 mở: đọc LIMITS T8-186 + aggregate 186 §12.3 (bản parent SẠCH); md5 cây khớp 186; copy driver 186→187 + đổi nhãn; **dọn `smoke/` (186 → `smoke/archive-186/`)**; **cả 2 symlink diag cập nhật NGAY lúc copy (20:45Z)**; probe S1 CÓ SẴN (md5 `453d1082`).
- 20:46:20Z Selfcheck #1 trên #109: libs 6/6 CÓ — NHƯNG plugin dir chỉ 32 .so, dpkg đang tăng live (F-187-T8-1). 20:48:23Z gst_sys 32 → 269 (replay host-side cài xong). 20:50:24Z **POSTBOOT_PASS #109 CÓ** (replay-đầy-đủ, poll=0, KHÔNG caveat). 20:58–21:01Z **O8 T0 3/3 trên #109.** 21:05:39–21:09:04Z **T4 attempt1 #109 HỢP LỆ** (20/20, B 5/5, median 39,0 ms).
- **21:13:21Z REBOOT → #110 (912f4a97)** — giết waiter v1 (poll 27), vòng chờ gate của T8 (SIGTERM), T4 đang đóng cờ; fixture /tmp MẤT lần 2 trong đợt. 21:19:00Z waiter v2 khởi động lại (log cũ lưu `smoke/wait-t4-t5-boot6f1d9f87.log`). 21:20:05Z Selfcheck #2 trên #110: libs 6/6, **GST 1624 (tools CÓ)**, plugin dir 269, dpkg 1468 ổn định. 21:22:15Z **POSTBOOT_PASS #110 CÓ** (replay-đầy-đủ, poll=0, watcher-187b — T5-187 đã đóng cờ 21:12Z nên cờ này do watcher viết sau, không qua LIMITS T5). 21:28Z **T4 ĐÓNG CỜ** (#56 HỢP LỆ trên #109). **21:29:01Z GATE-FOUND poll=11.**
- **21:29–21:30Z rebuild fixture: exit 0, md5 khớp đợt 125** (ba0c7c62/f05daed8/fbaa3d1a/a1fb8549) — chạy SAU gate. **21:30:22–21:45:33Z HARNESS 6/6** (driver pid 102100, boot #110). **21:46:15–21:48:49Z O8 T8 3/3.** 21:50–21:55Z replay + verify-163 + extract + LIMITS + paths + cờ. **0 reboot sau 21:13:21Z trong phiên T8.**

## A. O8 — T8 3/3 TRÊN #110; T0 3/3 TRÊN #109 (KHÁC BOOT — XEM FULL PASS §0)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #110 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `585dbca9`, S1 PASS 21:46:15Z |
| 2 | O8 T8 WebKit attempt2 trên #110 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `c261a6b8`, S1 PASS 21:47:08Z |
| 3 | O8 T8 Chromium trên #110 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `c6dd6e33`, S1 PASS 21:47:59Z |
| 4 | O8 T0 WebKit attempt1 trên #109 | **21/21 PASS** (md5 a1716bb3, 20:58:11Z) |
| 5 | O8 T0 WebKit attempt2 trên #109 | **21/21 PASS** (md5 f300052b, 20:59:18Z) |
| 6 | O8 T0 Chromium trên #109 | **21/21 PASS** (md5 3143f956, 21:00:21Z) |

- O8 T8 chạy 21:46:15–21:48:49Z trên #110 (SAU POSTBOOT_PASS #110 24'). O8 log: S1 PASS 6, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0. **Gate cho boot đo `912f4a97` (#110): (a) CÓ — POSTBOOT_PASS #110 (replay-đầy-đủ, poll=0).** O8 T8 + harness CÙNG boot #110; **lượt yên #56 + O8 T0 trên #109 → FULL PASS KHÔNG (đề xuất, parent/T10 quyết).**

## 2. Kết quả harness — 6/6; WebKit 3/3 PASS; Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 21:30:22–21:31:33 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 2 | WebKit 85m4 | 0 | 21:31:48–21:33:59 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 21:34:14–21:38:05 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 21:38:20–21:39:21 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 21:39:36–21:41:37 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 21:41:52–21:45:33 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 26 — 0 kẹt mới.** **84l10 WebKit PASS đợt này** (lần PASS thứ 7 trong 9 đợt gần nhất: 179, 180, 181, 183, 185, 186, 187; 182 + 184 KHÔNG ĐO ĐƯỢC — parent-186 (j) quyết chuỗi = 6; đợt này PASS nữa — đề xuất 7). **86n2-P1 không kẹt: lần thứ 10 nếu tính tiếp** (chuỗi 9 tới đợt 186; 184 KHÔNG ĐO ĐƯỢC — parent/T10 quyết).
- **Đối chứng Chromium cùng pha: 3/3 PASS** — cùng kết quả WebKit.
- **B2 live: SẠCH (đợt thứ hai)** — 86n2-hb128 WebKit PASS live (P6-wait 18 dòng HB128, P1/P5/P6 PASS); B2 chưa bắt kẹt thật live. Xem §C.
- RAM sampler (n=31): balloon min 4.037.376 / max 5.514.368 kB (**85,6% trần, pinned=0**), avail min 542 MB / max 2.378 MB — KHÔNG ghim trần lần nào trong cửa sổ harness.

## 3. Watchdog + 4 bước kiểm — 0 WATCHDOG-137; 0 LIVE-DIAG; V2 0 kích hoạt live

- **Watchdog (i): 0 dòng** (cả 6 pha — không có evaluate im lặng >60 s). Live-diag (1b): **0** (log chảy đều, không im lặng >120 s). **V2 (f''): 0 kích hoạt live** (check-fresh trên 6 log live: 84l10 OK maxspan=0 s; 85m4 OK 5 s (WebKit) / 10 s (Chromium); 86n2 OK 85 s — run P6-wait hợp lệ, dưới ngưỡng 120 s).
- **(1)** Watchdog trong 3 script (VÁ 142, GIỮ NGUYÊN 143–187) + `t8-diag-stall.sh` → 187; **(1b)** live_diags=0 cả 6 pha; **(1c')/(f'') V2: 0 kích hoạt live; replay §C.**
- **(2)** Balloon sampler: n=31 (xem §2); avail thấp nhất 542 MB.
- **(3)** Đối chứng Chromium cùng pha: 3/3 PASS (xem §2). **(4)** dmesg + journalctl -k sau mỗi lần kẹt: **0 lần kẹt → 0 snapshot mới** (journalctl-k trống, như mọi đợt).
- **0 snapshot stall mới.** 0 thư mục stall mới trong smoke/ (extract: `stall dirs: []`). Cả hai symlink → round187-t8 từ lúc copy (20:45Z), TRƯỚC harness — F-186-T8-2 không tái diễn.

# §C — B2 LIVE ĐỢT 2 (MỞ TỪ ĐỢT 186): OFFLINE KIỂM LẠI ĐẠT + LIVE SẠCH

## C1. Trạng thái B2 đợt này (KHÔNG đổi script — B2 đã trong 3 script từ đợt 186)

- 3 script harness giữ nguyên md5 đợt 186: 84l10 `16e5e957` (35.917 B), 85m4-hb128 `3fb2548b` (**38.737 B — VƯỢT giới hạn push, lúc push cần `ENABLE_PRIVSEP=0`**), 86n2-hb128 `de925614` (**43.653 B — VƯỢT, cần `ENABLE_PRIVSEP=0`**). `node --check` PASS cả 3. Thiết kế §C4 LIMITS T8-180 + triển khai §C1 LIMITS T8-186 — không sửa đợt này (không có bằng chứng mới đòi đổi ngưỡng/phủ sóng).
- **Mẫu bọc + ngưỡng giữ nguyên:** ngưỡng 120 s, run_len ≥3, (e)/(f), ngân sách diag (≤2/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. **V2 (f'') vẫn là phương án chính** — B2 chỉ mở rộng PHỦ SÓNG, không đổi điều kiện kích hoạt.

## C2. Kiểm chứng offline LẠI TRƯỚC harness (check-fresh-187t8.py trên 6 log tổng hợp đợt 186)

| Ca | Log tổng hợp | check-fresh-187t8.py (V2) |
|---|---|---|
| B2-1 setup treo 150 s | `planb-b2-setup-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-2 startPlaying treo 150 s | `planb-b2-startplaying-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-3 P6-wait treo 150 s + WATCHDOG-137 @60 s | `planb-b2-p6wait-150s-wd.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-4 P6 seeking-kẹt 150 s, KHÔNG watchdog | `planb-b2-p6wait-150s-nowd.log` | OK maxspan=150 s wd=0 — **KHÔNG trigger (giới hạn đã biết, §C5)** |
| B2-5 P6 sạch 90 s | `planb-b2-p6-clean-90s.log` | OK maxspan=85 s wd=0 — **không FP, dưới ngưỡng 120 s** |
| B2-6 setup sạch 60 s | `planb-b2-setup-clean-60s.log` | OK maxspan=55 s wd=0 — **không FP** |

- **Kết luận offline: ĐẠT (khớp hệt §C2 đợt 186).** Cả 3 vùng B2 mới đều trigger đúng @125 s khi treo thật; không FP trên 2 ca sạch (biên P6: 85 s < 120 s, dư 35 s).

## C3. Kiểm live (harness 6/6 đợt này — script B2 là script harness)

| Vùng B2 | WebKit 84l10 | WebKit 85m4 | WebKit 86n2 | Chromium 84l10 | Chromium 85m4 | Chromium 86n2 |
|---|---|---|---|---|---|---|
| `setupProject setup` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `startPlaying start` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `P6-wait wait` | — | — | **18 dòng** (elapsed 5→90 s) | — | — | **18 dòng** (elapsed 5→90 s) |
| check-fresh live | OK maxspan=0 s | OK maxspan=5 s | OK maxspan=85 s | OK maxspan=0 s | OK maxspan=10 s | OK maxspan=85 s |

- **Chi phí live đúng thiết kế:** setup/startPlaying 0 dòng thêm (setup <5 s); P6-wait 18 dòng/86n2-run. Tổng HB128 live: 84l10: 6 dòng (WebKit) / 5 dòng (Chromium — dao động theo setup, đợt 186: 7); 85m4: 19 dòng; 86n2: 39 dòng (21 + 18 P6-wait).
- **B2 chưa bắt kẹt thật live** — không có kẹt thật đợt này (harness 6/6 sạch, 0 WATCHDOG-137). **B1 live sạch lần thứ năm nếu tính tiếp** (181 + 183 + 185 + 186 + 187 — B1 vẫn chạy trong B2; parent quyết).
- **Replay sau live (2 entry mới `187-sach-*`):** 187-sach-85m4 19 dòng, max run span 5 s, KHÔNG kích hoạt mọi phương án; 187-sach-86n2-hb128 39 dòng, max run span **85 s** (run_len=18, playhead=30 ct=30), KHÔNG kích hoạt mọi phương án — **P6-wait không gây FP ngay cả trong replay** (biên 35 s).

## C4. Replay V1/V2 sau O8 (replay-1c-187t8.py + replay-f-fix-187t8.py — đã thêm 2 entry `187-sach-*`)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 23 log sạch duy nhất theo md5** (25 entry; 2 cặp trùng byte-identical 181/182 — xem F-186-T8-3 dưới đây). Đợt 187 đóng góp 2 log sạch mới.
- **Kẹt theo từng phương án (xác nhận lại đợt này): (c') V0: 164@125 s, 178@125 s; lỡ 171, 183. (f') V1-300: 164@125 s, 171@305 s, 178@125 s; lỡ 183. (f'') V2: 164/171/178/183 đều @125 s. (f''') V3: 164@125 s, 171@305 s, 178@125 s; lỡ 183. Kẹt-179 lỡ mọi phương án (0 dòng HB128 — lỗ hổng phủ sóng).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (164@125 s, 171@125 s, FP 0); **V1-300 ĐẠT** (164@125 s, 171@305 s, FP 0) — V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 4/4 @125 s, V1-300 3/4, 0 FP cả hai trên 23 log sạch duy nhất (md5).**
- **F-184-T8-1: KHÔNG TÁI DIỄN:** 0 NO-FILE trong cả hai lần chạy replay.
- **F-186-T8-3 — ĐÃ XÁC MINH (giao parent (j) đợt 186 — GIẢ THUYẾT ĐÚNG):** script `verify-163-187t8.py` (trong round187-t8/) parse LOGS cả hai script replay, md5 file thật từng entry: **mốc 183: 19 entry → 17 unique; mốc 184: 19 → 17; mốc 185: 21 → 19; mốc 186: 23 → 21** — khớp số T8-186 nêu (17/17/19/21). Lịch sử ghi 16/16/18 = unique − 1 đúng cả 3 mốc. `163-sach-85m4` có mặt trong LOGS cả hai script, md5 duy nhất (không trùng entry nào), và là **log chuẩn C5.1** (dùng làm reference `replay_literal` trong replay-1c) — quy tắc cũ loại đúng entry này khỏi đếm "log sạch của các đợt". **Kết luận: lệch +1 đã giải thích xong — không phải lỗi đếm của T8-186.** Ghi cả hai dãy số: **md5-unique 17/17/19/21/23 (183/184/185/186/187); lịch sử ghi (loại 163) 16/16/18 (183/184/185).** Số chuẩn parent đã quyết ở (j) đợt 186: **21 ở đợt 186 → 23 ở đợt 187** (2 log mới 187 đều khác biệt: md5 `731ac747`/`7b1a3ad5`). 0 FP không đổi theo cả hai cách đếm.
- **Biên an toàn (không đổi sau B2):** log sạch max identical-run span **85 s** (run P6-wait — ngưỡng 120 s → biên 35 s). Đây là biên ĐÚNG THIẾT KẾ (§C4: run P6 hợp lệ đã 90 s) — không phải FP. Watchdog chỉ kích hoạt sau evaluate im lặng >60 s — tín hiệu ĐỘC LẬP, không vòng tròn.

## C5. Giới hạn B2 (trung thực — B2 không phải toàn năng)

- **B2-4 (offline): P6 seeking-kẹt mà evaluate vẫn trả về (không watchdog) → (c') KHÔNG trigger** (OK maxspan=150 s wd=0). Nguyên nhân: summary seeking=true → (f) chặn; không có WATCHDOG-137 → V2 không miễn (f). Trong thực tế P6 tối đa 90 s nên run dừng ở 85 s < 120 s — B2 cho P6 chỉ cho **bằng chứng + biên 30 s**. Đường bắt kẹt P6 vẫn là watchdog (i) @60 s + V2 via=wd, hoặc timeout 900 s.
- **B2 chưa bắt kẹt thật nào** (offline synthetic + live sạch 2 đợt). Bằng chứng bắt thật đầu tiên thuộc ca kẹt tới.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 15 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173)

## D1–D2. Phạm vi + Q3: 84l10 qua 3 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; script `16e5e957` — B2) + ca 178 W2-setup :443; 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 PASS (W2+E4), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 187: **không có dữ liệu mới về kẹt**; hồ sơ 4 điểm kẹt giữ nguyên. **Chuỗi 84l10 PASS: 6 đợt (179, 180, 181, 183, 185, 186) + PASS đợt 187 — có nối qua 2 đợt KHÔNG ĐO ĐƯỢC (182, 184) hay không — parent/T10 quyết (đề xuất 7).** Tần suất kẹt 84l10: 4 ca / 29 đợt ≈ 14% (không đổi).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — không có ca mới đợt này.
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (heal lần 3):** T0-187 ghi `libevent` vắng 20:43Z → có 20:46Z sau replay trên #109; selfcheck T8 #2 trên #110: libs 6/6 + GST 1624 ngay từ đầu — củng cố hướng "lib hệ thống quyết định WebKit chạy/không-chạy".
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 187: không có dữ liệu mới (không kẹt).**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — không có ca mới đợt này (0 probe evaluate TIMEOUT).
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 29 đợt). Kẹt-183 (85m4 P1): đợt này P1 PASS.

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 187 (0 KẸT MỚI — WebKit + Chromium ĐỀU PASS; KHÔNG MỞ ĐIỀU TRA)

## B1. Trạng thái giả thuyết sau đợt 187 (KHÔNG ĐỔI — không có ca kẹt mới để đối chiếu)

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — không có ca kẹt nào đợt này; avail trong lúc harness 542–2.378 MB, balloon max 85,6% trần (không ghim 100%).
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ MẠNH HƠN (đứng nguyên từ 183)** — không có bằng chứng mới đợt này (0 kẹt cả hai engine); WebKit heal khi lib đủ (lần 3, T0-187) cho thấy tầng lib hệ thống quyết định WebKit chạy/không-chạy, khác với treo-kẹt.
- Đợt 187 T8 chỉ giám sát thụ động H3: **0 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T0 PASS 3/3 trên #109). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS, lần thứ 10 nếu tính tiếp (parent quyết).** H3 vẫn chỉ giám sát thụ động.

# §E — CHECKLIST (o) ĐỢT 187 (quyết (o) đợt 180 + các F-186 còn lại)

- o1. F-186-T0-1 (#106 chưa xác minh) — ĐÃ QUYẾT (e) đợt 186: cea79500 = #107 (cách đếm T0); #106 là reboot chưa xác minh (ước ~15:13:32Z).
- o2. Run 187 FAILED 20:17:06Z (KHÔNG phải timeout — worker báo chưa xong, T10-186 chưa spawn; margin +1.125 s; claimed→finished 202 s — ỨNG VIÊN CA mới, T7-187 phán cuối); run 188 vẫn running lúc T0-187 đóng.
- o3. F-185-T1-1 (prose §112) — ĐÃ SỬA XONG đợt 186 (T1-186; GAP §112/§114 đã cập nhật).
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 542–2.378 MB trong harness (T8); balloon max 85,6% trần, pinned=0.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; quyết (p) kiểm chứng live lần 7: ĐẠT (T4-187); **0 vi phạm phía T4; chuỗi đợt sạch đề xuất 2 → 3 (parent quyết)**.
- o6. F-181-T4-3 (X193) — X193 mồ côi KHÔNG CÒN lúc đóng (X11 trống 0 socket — T4-187 xác nhận; reboot 21:13:21Z đã dọn).
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-187 sống trên #109; watcher-187b viết POSTBOOT_PASS #110 21:22:15Z (SAU khi T5-187 đóng cờ — xem §1).
- o8. F-181-T5-2 (ledger ts) — GHI NHẬN (T5-187 đã đóng cờ).
- o9. F-180-T5-3 (lệch btime 11 s) — GHI NHẬN; /proc/1 #110 +11 s (T0-187: /proc/1 #109 +11,228 s — mẫu tương tự).
- o10. F-174-T5-6 KHÔNG áp dụng — GHI NHẬN (#110 replay-đầy-đủ, poll=0, KHÔNG caveat; #109 replay-đầy-đủ, poll=0, KHÔNG caveat; #108 KHÔNG CÓ cờ — tổng 24 → 25 nếu parent chấp nhận).
- o11–o13. F-181-T6-1 (chồng pha) + F-180-T6-4 (mâu thuẫn poll=0) + F-180-T6-5 (watcher chưa chạy lúc snapshot) — GHI NHẬN; T6-187 ĐÃ ĐÓNG CỜ.
- o14–o16. F-181-T7-1 (sleep SIGTERM) + F-180-T7-4 (lỗi nhãn) + F-180-T7-5 (tuổi run cộng thừa 600 s) — GHI NHẬN; T7-187 chưa đóng cờ lúc T8 đóng.
- o17. F-185-T8-4 (stat sai marker) — **ĐÃ SỬA (T0-186)** — stat đúng `~/.config/vcut-persistence-marker`; marker 61 reboot (T8 kiểm trực tiếp mtime không đổi).
- o18. Quyết (o) 186 (cửa slot KHÔNG LÀNH lần 1; HB 50/519, DR 55/331; OUTAGE #2 — mở điều tra hướng "cố định theo giờ", T7-187 thu thập) — GHI NHẬN; số mới thuộc T7-187.
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — ĐÃ THỰC HIỆN: marker 61 reboot (T0-187 XÁC NHẬN #109); T8 đóng ~21:55Z, TRONG hạn cờ ~23:00Z và hạn cứng ~23:35Z.
- o20. Quyết (j) 186 (B2 đã triển khai; V2 chính thức; H3 giám sát; B1 live sạch lần 4; 84l10 chuỗi 6; 86n2-P1 chuỗi 9; F-186-T8-3 giao T8-187 xác minh) — **ĐÃ THỰC HIỆN (§2, §C, §F, §B, §C4)** — B2 live sạch lần 2; V2 replay 4/4 @125 s, V1-300 3/4; F-186-T8-3 ĐÃ XÁC MINH (giả thuyết ĐÚNG).
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T0-187/T9-187; T9-187 chưa đóng cờ lúc T8 đóng).

# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 187 — DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy). **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy** (hb128 là chuẩn). **Chi phí B2 giữ nguyên:** 85m4-hb128 38.737 B (VƯỢT giới hạn, dư −969 B); 86n2-hb128 43.653 B (oversize — cần ENABLE_PRIVSEP=0); 84l10 35.917 B (dưới giới hạn, dư 1.851 B).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7; `media.ts` 2c384ed1; `vite.config.ts` ee80d093 (không đổi); `84l10` **16e5e957 (B2, KHÔNG ĐỔI đợt này)**; `85m4-hb128` **3fb2548b (B2, KHÔNG ĐỔI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` de925614 (B2, KHÔNG ĐỔI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). **T8 KHÔNG đổi file repo đợt này (chỉ LIMITS này + script làm việc trong hidden_files).**
- **Working dir `repo-1/hidden_files/round187-t8/`** — copy `cp -r` 186→187 (exit 0; o8-webkit/o8-chromium loại khỏi copy vì symlink gãy — tạo lại trống; xem F-186-T8-5 — đợt này KHÔNG tái diễn). **Đổi nhãn đúng** (186t8→187t8, waiter → 22:30Z, LIVE-DIAG/FRESH-CONTENT → 187) — grep: chỉ còn tham chiếu 186 trong khối LOGS (đúng, giữ log đóng băng) + 2 entry `186-sach-*`.
- Extract (F-182-T8-6 — ĐÃ KIỂM LIVE đợt 183, dùng lại đợt này): trích ĐÚNG số harness (exit=0 ×6) + O8 (webkit 21/21 md5 585dbca9/c261a6b8, chromium 21/21 md5 c6dd6e33) + sampler n=31 + WATCHDOG-137: 0. Nhãn "ovsize LIMITS 186" nay ĐÚNG (37749 B) — F-186-T8-4 ĐÃ SỬA.
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN ĐÚNG LÚC (xem F-186-T8-2).** Cả hai symlink cập nhật → round187-t8 lúc ~20:45Z, TRƯỚC waiter lẫn harness (extract xác nhận lúc đóng). Nợ đã trả: checklist copy driver gồm CẢ HAI symlink NGAY lúc copy.
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP).** File `o8-s1-probe-187t8.mjs` có mặt sau `cp -r` 186→187 (md5 `453d1082` giống hệt 175–187; `node --check` PASS). O8 T8 chạy với probe này (S1 PASS 6, FAIL 0).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round187-t8). **F-181-T8-5: ÁP DỤNG CHO #109 + #110** (cả hai replay-đầy-đủ, poll=0, KHÔNG caveat — giống #104/#102/#99/#95). **F-181-T8-6 (gst-inspect vắng): KHÔNG TÁI DIỄN TRÊN #110 — gst-inspect CÓ, GST 1624 (xem F-187-T8-1); VẪN TÁI DIỄN TRÊN #109 lúc selfcheck #1 (tools vắng, plugin dir 32 mid-replay).** **F-181-T8-7: ĐÃ QUYẾT (c) đợt 186 — tổng GIỮ 24 (25 nếu parent chấp nhận #108 KHÔNG cờ — T5-187). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 6. Dọn dẹp + kiểm cuối — sạch (trên #110, không reboot sau 21:13:21Z)

- Driver harness (pid 102100) đã thoát sau pha cuối (21:45:33Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng). O8 driver đã nhả lock 21:48:49Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 102 cooldown — extract xác nhận).
- Kiểm cuối ~21:52Z (trên #110): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` TRỐNG (0 file — reboot đã dọn X193 của T4).
- Fixture /tmp: **ĐÃ REBUILD 21:29Z (md5 khớp đợt 125)** — vẫn còn lúc đóng (chưa có reboot mới sau đó).
- **Reboot #110 (boot `912f4a97`, btime 21:13:21Z):** xảy ra GIỮA phiên T8 (giết waiter v1 + vòng chờ gate + T4 đang đóng cờ — xem F-187-T8-2); **0 reboot trong cửa sổ đo (21:30–21:48Z).** dpkg.log 1468 dòng (ổn định sau replay). #110 XÁC MINH THEO CÁCH ĐẾM A (T2-187; T0-187 đóng trước reboot nên không xác minh 9 nguồn — số hiệu chờ parent/T10); #109 XÁC NHẬN 9 nguồn tươi (T0-187); (m) #108 DƯƠNG +39,438 s; (m) #56 lần 30 (T2-187).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l`.** Không chạy script nặng khi T4 gate0wait/attempt (B2 offline + verify-163 TRƯỚC cửa yên mở 21:05Z; fixture + harness + O8 SAU khi T4 đóng cờ 21:28Z + GATE-FOUND 21:29:01Z).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 6/6 — WebKit 3/3 PASS + Chromium 3/3 PASS (trên #110).** **Kẹt cộng dồn GIỮ 26 — 0 kẹt mới.**
2. **O8 T8 3/3 (WebKit 21/21 md5 585dbca9/c261a6b8; Chromium 21/21 md5 c6dd6e33 — trên #110).** O8 T0 PASS 3/3 trên #109 theo cờ T0-187.
3. **Chuỗi WebKit FULL PASS GIỮ 0 (ĐỀ XUẤT — KHÔNG, do chân chia 2 boot).** Không phải FAIL sản phẩm. **Parent/T10 quyết cuối.**
4. **POSTBOOT_PASS #110 CÓ 21:22:15Z (replay-đầy-đủ, poll=0 — viết bởi watcher-187b SAU khi T5-187 đóng cờ)** — gate (a) #110 ĐẠT. **#108 KHÔNG CÓ cờ** (tổng boot không cờ 24 → 25 nếu parent chấp nhận). **#109 XÁC NHẬN 9 nguồn tươi (T0-187).**
5. **Balloon max 85,6% trần trong cửa sổ harness (n=31, avail min 542 MB, pinned=0)** — KHÔNG ghim trần lần nào; KHÔNG có sampler T9 trong LIMITS này.
6. **85m4-hb128 38.737 B (VƯỢT giới hạn push 969 B) + 86n2-hb128 43.653 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 35.917 B (dư 1.851 B). **LIMITS này DƯỚI giới hạn push (xem stat lúc ghi cờ).**
7. **Chuỗi verdict: 84l10 PASS đợt này (đề xuất chuỗi 7); 86n2-P1 không kẹt đề xuất lần 10; B2 live sạch lần 2; B1 live sạch lần thứ năm nếu tính tiếp (parent/T10 quyết); F-186-T8-3 ĐÃ XÁC MINH (giả thuyết ĐÚNG — số chuẩn 21 → 23).** H3 ỦNG HỘ MẠNH HƠN (đứng nguyên từ 183).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') PHƯƠNG ÁN CHÍNH — live 0 kích hoạt (không có kẹt thật); replay V2 4/4 @125 s, V1-300 3/4, 0 FP cả hai trên 23 log sạch duy nhất (md5).** V1 chỉ còn đối chứng trong replay.
10. **T7-187/T9-187 CHƯA ĐÓNG CỜ lúc T8 đóng** — số T7/T9 thuộc các luồng đó + T10-187. **T4 đóng 21:28Z với lượt yên #56 HỢP LỆ trên #109 (có cờ `.done`).**
11. **#110 XÁC MINH THEO CÁCH ĐẾM A (T2-187); #109 XÁC MINH 9 nguồn tươi (T0-187); marker 61 reboot;** (m) #108 DƯƠNG +39,438 s (T2-187); (m) #56 lần 30 (T2-187).
12. **T8 ĐÓNG ~21:55Z, TRONG hạn cờ ~23:00Z và hạn cứng ~23:35Z** (dù reboot giữa phiên + chờ T4 tới 21:28Z + GATE-FOUND 21:29:01Z). 0 reboot trong cửa sổ đo (21:30–21:48Z).

## 8. Sai số mới (F-187-T8-N) + nợ cũ đã xử lý

- **F-187-T8-1 — SELFCHECK #1 BẮT GIỮA LÚC REPLAY ĐANG CÀI (T8 TỰ BẮT, ĐÃ LÀM RÕ — KHÔNG PHẢI LIB THIẾU):** selfcheck #1 trên #109 (20:46:20Z) ghi plugin dir chỉ **32 file .so** (thư mục THẬT, không phải symlink) + `gst-inspect-1.0` vắng + dpkg.log đang tăng live (398 → 1.220 dòng trong ~2 phút; `apt-get` pid 149577 đang cài `fonts-urw-base35`). Nguyên nhân: host os-intent replay đang cài lại gói sau reboot — selfcheck chạy đúng lúc replay chưa tới gói gstreamer. Bằng chứng hồi phục: replay-watch-187 ghi gst_sys 32 → 256 (20:47:53Z) → **269 (20:48:23Z)**; selfcheck #2 trên #110 (21:20:05Z) ghi **GST 1624 (tools CÓ)**, plugin dir 269, libgst* 79, dpkg 1468 ổn định; selfcheck #3 sau O8 khớp hệt (269/79/1468, GST 1624). Bài học: khi plugin-dir count thấp BẤT THƯỜNG thì kiểm ngay dpkg.log có đang tăng không (replay đang chạy) trước khi kết luận lib thiếu; con số 269 trên #107 đợt 186 là symlink → debroot, còn 32 → 269 đợt này là thư mục thật đang được lấp đầy — hai cơ chế khác nhau, đừng đồng nhất.
- **F-187-T8-2 — REBOOT 21:13:21Z GIẾT WAITER + VÒNG CHỜ GATE + T4 ĐANG ĐÓNG CỜ (T8 TỰ BẮT, ĐÃ KHÔI PHỤC TRONG PHIÊN):** reboot xảy ra sau khi T4 poller thoát (21:09:27Z) nhưng trước khi T4 viết xong cờ; waiter v1 chết ở poll 27, vòng chờ gate của T8 chết vì SIGTERM, T4 chết lúc đang đóng cờ. **Không mất dữ liệu:** log waiter v1 lưu thành `smoke/wait-t4-t5-boot6f1d9f87.log` (28 dòng); waiter v2 khởi động lại 21:19:00Z (deadline 22:30Z giữ nguyên); T4 hồi phục và đóng cờ 21:28Z (#56 HỢP LỆ trên #109); watcher-187b viết POSTBOOT_PASS #110 21:22:15Z (sau khi T5-187 đóng cờ 21:12Z); GATE-FOUND poll=11 21:29:01Z. **Không ảnh hưởng đo đạc:** mọi đo T8 (selfcheck #2, fixture, harness, O8) đều trên #110 sau gate; mọi đo T4/T0 đều trên #109 trước reboot — chỉ FULL PASS bị chia 2 boot (§0). Bài học: sau reboot giữa phiên, lưu log waiter cũ TRƯỚC khi khởi động lại waiter (đã làm) và ghi rõ cờ nào do watcher viết sau khi luồng chủ đóng (POSTBOOT_PASS #110).
- **F-186-T8-4 — ĐÃ SỬA:** nhãn extract nay "ovsize LIMITS 186: 37749" (đúng số, đúng đợt).
- **F-186-T8-3 — ĐÃ XÁC MINH, GIẢ THUYẾT ĐÚNG (xem §C4).** **F-186-T8-1 — KHÔNG TÁI DIỄN TRÊN #110** (GST 1624, tools có); **VẪN TÁI DIỄN DẠNG MỚI TRÊN #109** (xem F-187-T8-1: plugin dir 32 mid-replay, không phải tools vắng đơn thuần). **F-186-T8-2 — KHÔNG TÁI DIỄN** (cả 2 symlink cập nhật ngay lúc copy 20:45Z). **F-186-T8-5 — KHÔNG TÁI DIỄN** (copy 186→187 không gặp symlink gãy; o8-webkit/o8-chromium tạo lại trống, O8 3/3 PASS). **F-185-T8-4 — ĐÃ SỬA (T0-186).** **F-184-T8-1 — KHÔNG TÁI DIỄN** (0 NO-FILE cả hai replay). **F-183-T8-7 — KIỂM LẠI TRÊN #110: libevent-2.1.so.7 CÓ (selfcheck #2 + #3) — MiniBrowser chạy được cả 3 pha; T0-187 ghi heal lần 3 (vắng 20:43Z → có 20:46Z sau replay trên #109).**
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG ĐỢT NÀY.** Dọn `smoke/` khỏi bản copy (186 smoke → `smoke/archive-186/`); replay baseline chạy sạch, không parse log stale. Các file stale vẫn nằm trong `smoke/archive-186/` (bằng chứng, không dùng).
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-187t8.sh` (cả 6 pha), KHÔNG chạy thêm `run-chromium-*` riêng.
- **F-183-T8-5 — NHÃN "ovsize LIMITS 181": ĐÃ SỬA ĐỢT 184 — NHÃN MỚI ĐÃ ĐÚNG ĐỢT NÀY (xem F-186-T8-4). F-183-T8-8: ĐÃ SỬA ĐỢT 183, KHÔNG TÁI DIỄN. F-183-T8-2 — SOCKET X193 STALE: ĐÃ HẾT (X11 trống 0 socket lúc đóng). F-183-T8-4 — (c') BỎ LỠ kẹt-183: V2 ĐÃ TRIỂN KHAI (§C); B2 mở phủ sóng sang setup + P6. F-183-T8-6 — REBOOT #102: ĐÃ GHI NHẬN ĐỢT 183; #110 XÁC MINH THEO CÁCH ĐẾM A (T2-187).**
- **F-182-T8-6 — EXTRACT KIỂM LIVE: ĐÃ ĐẠT ĐỢT 183, DÙNG LẠI ĐỢT NÀY (xem §5 — extract chạy SAU O8, số O8 trong LIMITS này là số mới). F-181-T8-1: ĐÃ HẾT (181). F-181-T8-2/3/4: ĐÃ SỬA, KHÔNG TÁI DIỄN** (pilot trỏ đúng round187-t8; T8-3 ĐÃ KIỂM LIVE Ở 183 — ĐÓNG). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 186 — tổng GIỮ 24 (25 nếu parent chấp nhận #108 KHÔNG cờ). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS GIỮ 0 (ĐỀ XUẤT — KHÔNG, do chân chia 2 boot)** — parent/T10 quyết (3 chân #109 + 2 chân #110; reboot 21:13:21Z là nguyên nhân, không phải FAIL sản phẩm).
2. **B2 live sạch lần 2 — parent ghi nhận** (offline kiểm lại ĐẠT; live sạch — P6-wait 18 dòng/run, maxspan 85 s; chưa bắt kẹt thật; giới hạn §C5 đã ghi rõ).
3. **Chuỗi 84l10 PASS 6 → 7 (đề xuất) + chuỗi 86n2-P1 không kẹt 9 → 10 (đề xuất) + B1 live sạch lần thứ năm nếu tính tiếp** — parent/T10 quyết (cả ba đều nối qua đợt 184 không đo được theo quyết (j) đợt 186).
4. **F-186-T8-3 ĐÃ XÁC MINH — giả thuyết ĐÚNG** (số chuẩn 21 → 23; ghi cả hai dãy số §C4) — parent ghi nhận, không còn nợ.
5. **Reboot #110 (912f4a97, btime 21:13:21Z, gap #109→#110 = 2.568 s — NGẮN hơn nhiều so với mẫu ~2h)** — XÁC MINH THEO CÁCH ĐẾM A (T2-187); T0-187 đóng trước reboot nên không xác minh 9 nguồn; **số hiệu #110 chờ parent/T10 quyết cuối** (T4-187 ghi "số hiệu chờ T0-188"). (m) #108 DƯƠNG +39,438 s + INSIDE #108 (FULL154) thuộc T2-187 (parent-186 (e)); (m) #107 KHÔNG CÓ ĐIỂM (T2-187); POSTBOOT_PASS #110 ĐÃ CÓ 21:22:15Z (watcher-187b, sau khi T5 đóng cờ); #108 KHÔNG CÓ cờ — tổng boot không cờ 24 → 25 nếu parent chấp nhận (T5-187).
6. **F-187-T8-1 (selfcheck bắt giữa replay) + F-187-T8-2 (reboot giết waiter/T4/gate-wait)** — parent ghi nhận; không đổi verdict.
7. **T7-187/T9-187 chưa đóng cờ lúc T8 đóng** (run 187 FAILED 20:17:06Z — ứng viên CA mới, T7-187 phán; cửa slot + headroom/ENOSPC/E-233 — thuộc các luồng đó + T10-187).
8. Mở từ trước, vẫn đứng: **#109/#110 KHÔNG GIẾT HOLDER (T6-187 đã đóng — xem LIMITS T6); (A) 120/120 lần 37 (T6-187); (m) #103 DƯƠNG +37,543 s (parent 185 quyết cuối); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck lần 31, T2-187); (m) #56 lần 30 (T2-187); G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử lần 41 (T9-187); R9 (a) lần 22; file oversize 6,4 MB chưa quyết; u2net là fallback chính thức; fixture /tmp đã rebuild đợt này; KHÔNG PUSH — 210 batch / 315 entry / 286 đường dẫn / 282 file chờ user push (166–186) + batch đợt 187 (T10-187 đếm cuối).**
9. **F-187-T4-2 (RAM trong attempt sát ngưỡng 1024, min 1030 MB) + F-187-T0-8 (T0 chạy O8 TRƯỚC attempt T4 — đảo thứ tự so với đợt 186)** — thuộc T4-187/T0-187 + parent/T10 (T8 chỉ ghi nhận).
