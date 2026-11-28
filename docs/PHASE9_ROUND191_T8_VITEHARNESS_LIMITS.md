# Đợt 191 T8 — HARNESS 6/6 TRÊN #114 (ỨNG VIÊN): FULL PASS (ĐỀ XUẤT 1 → 2); 0 KẸT MỚI; P5-188 ĐIỀU TRA XONG

Ngày: 25/11/2026 (lượt cron 15:35 +07 = 08:35:51Z; T8 mở ~08:40Z, đóng ~10:01Z — TRONG hạn cờ ~11:00Z).
Phạm vi: (1) harness hb128 + B1/B2 live trên boot mới nhất; (2) O8 T8; (3) (c')/(f') V1 đối chứng + replay V1/V2; (4) H3 thụ động; (5) B1 ĐIỀU TRA KẸT P5 ĐỢT 188 (nợ mở từ đợt 189/190 — xem §D4). KHÔNG chạy diag W2-setup (DỪNG, quyết (j) đợt 180). **Nguồn:** LIMITS T8-189 + aggregate 189 §12.3 **BẢN PARENT-KIỂM** (78.048 B; parent kiểm độc lập lần thứ 112, KHỚP TỪNG SỐ; (b) FULL PASS 0 → 1, (j) 84l10 chuỗi 9, 86n2-P1 lần 12, B1 khởi động lại lần 1, B2 sạch lần 4, log sạch chuẩn 27, kẹt GIỮ 27). Đợt 190 VOID (T8-190 chưa từng chạy).

## 0. Kết luận ngắn — 6/6; 0 kẹt mới; FULL PASS (đề xuất 1 → 2); P5-188: H3-thuần, KHÔNG tái diễn

- **#114 ỨNG VIÊN (T01 xác minh số hiệu; T01 CHƯA ĐÓNG CỜ lúc T8 đóng — parent quyết (e) ở §12.3-191)** — boot `b0aab705`, btime **08:25:43Z**, gap #113→#114 = 13.759 s (3h49m19s; #113 btime 04:36:24Z theo T7-189). **POSTBOOT_PASS #114 CÓ 08:45:57Z** (t56, replay-đầy-đủ, poll=0, KHÔNG caveat; dpkg 1.468, cache 170, lists 37). Gate (a) #114: CÓ (không caveat). **#108 KHÔNG CÓ cờ** (tổng boot không cờ GIỮ 25). Marker sống qua **66 reboot** (#49–#114, mtime không đổi 2026-11-20).
- **Lượt yên #59 CÓ LƯỢT HỢP LỆ (T4-191, cờ 09:25Z)** — attempt1 20/20 + lớp B ĐẠT 5/5 + tickCost median 42,0 ms (n=587). Chuỗi lượt yên: đề xuất 1 → 2. Kiểm chứng live lần 10 ĐẠT (chuỗi 8 → 9 đề xuất); B2 DỮ KIỆN THỨ 3 cho quyết tách (load1_max 2,91, tự-tải nguồn chính — parent quyết, T4 KHÔNG tự quyết).
- **HARNESS 6/6 trên #114 (09:27:11–09:43:53Z): WebKit 3/3** (84l10 PASS, 85m4 PASS, 86n2 PASS — P1 PASS 09:32:12Z, P5 CÓ-RESTART (+3) ended-at-duration, P6 KHÔNG-KẸT) **+ Chromium 3/3 PASS.** **Kẹt cộng dồn GIỮ 27 — 0 kẹt mới.** live_diags=0; WATCHDOG-137 = 0.
- **B2 VÙNG MỚI SẠCH LẦN 5** (setup/startPlaying/P6-wait 0 trigger; check-fresh live 0/10/85/0/10/90). **B1: không bắt kẹt (không có kẹt) — chuỗi live sạch đề xuất 1 → 2** (189 khởi động lại lần 1; đợt này sạch).
- **O8 T8 3/3 trên #114** (09:46:04–09:48:44Z): WebKit ×2 **21/21 PASS** (md5 `7dad1c5b`/`dd7ddcc2`) + **Chromium 21/21 PASS (md5 `8072df60`)**. **O8 T01 PASS 3/3 trên #114** (WebKit eb0d54dd/1331ea11, Chromium 8f025b46, DONE 08:51:44Z).
- **FULL PASS: CÓ — đề xuất chuỗi 1 → 2.** 5/5 chân cùng boot #114 (gate (a) ✓, O8 T01 ✓, O8 T8 ✓, lượt yên #59 ✓, harness 6/6 ✓). Lần thứ hai liên tiếp (189: 0 → 1).
- **V2 (f'') phương án chính — replay: V2 bắt 5/5 kẹt @125 s (164/171/178/183/188), 0 FP trên 29 log sạch duy nhất theo md5** (31 entry; 191 đóng góp 2 log sạch mới: 191-sach-85m4 md5 `73087dd2`, 191-sach-86n2-hb128 md5 `90ef06c3`); **V1-300 đối chứng: 4/5** (lỡ 183).
- **84l10 PASS đợt này — đề xuất chuỗi 9 → 10** (179, 180, 181, 183, 185, 186, 187, 188, 189, 191; nối qua 182 + 184 không đo được theo quyết (j) đợt 186; 190 VOID). **86n2-P1 không kẹt: đề xuất lần 13** (P1 PASS 09:32:12Z).
- **P5-188 ĐIỀU TRA XONG (§D4):** kẹt #27 là H3-thuần (process sống, kênh evaluate chết — vite HTTP 200, WebKitWebProcess RSS 337.524 kB, probe 1+1 TIMEOUT 30 s); **KHÔNG tái diễn đợt 191** (WebKit P5 qua, playhead tới 30, frozen seek dài nhất 2 mẫu ~0,4 s; Chromium P5 PASS sạch). Hồ sơ kẹt: 84l10 4 ca / 86n2-P5 1 ca — giữ nguyên, chưa đủ dữ kiện mở điều tra P5 riêng đầy đủ.
- **F-191-T8-1 + F-191-T8-2 + F-191-T8-3 + F-191-T8-4 mới (xem §8).** F-189-T8-1 ĐÃ SỬA (nhãn o8-driver nay "T8-191"). F-188-T8-1 KHÔNG tái diễn (dpkg ổn định 1.468). F-186-T8-2 KHÔNG tái diễn (không còn symlink stale nào trong bản copy). F-184-T8-1 KHÔNG tái diễn (0 NO-FILE cả hai replay).

## 1. Dòng thời gian (gọn)

- 04:36:24Z **#113** (reboot trong đợt 189, sau khi T8-189 đóng — T7-189). 08:25:43Z **#114** (b0aab705, ỨNG VIÊN). 08:35:51Z Đợt 191 mở. 08:40–08:44Z T8 mở: đọc LIMITS T8-189 + aggregate 189 §12.3 (bản parent-kiểm, 78.048 B); copy driver 189→191 + đổi nhãn; **dọn `smoke/` (189 → `smoke/archive-189/`, 19 file)**; **xóa 3 symlink Singleton* stale của Chromium**; probe S1 CÓ SẴN (md5 `453d1082`).
- 08:43:24Z Selfcheck #1 trên #114: libs 6/6, plugin dir 269, dpkg 1.468, cache 170, lists 37, balloon 4.419 GB, avail 2.155 MB. 08:43:39Z waiter T8 khởi động (deadline 10:30Z). **09:03:40–09:07:10Z T4 attempt1** (lượt yên #59 HỢP LỆ — poll #21 mở cửa, RAM 1.286 MB). **09:20:20Z waiter KHỞI ĐỘNG LẠI (sau khi sửa F-191-T8-1). 09:25Z T4 đóng cờ. 09:26:21Z GATE-FOUND poll=7** (t4=OK, postboot đường (a) qua t56).
- 09:27:03Z Selfcheck #2: libs 6/6, dpkg 1.468, balloon 3.795 GB, avail 1.580 MB. 09:27:11Z rebuild fixture xong (md5 khớp đợt 125). 09:27:15–09:43:53Z **HARNESS 6/6** (driver pid 55188, boot #114). **09:46:04–09:48:44Z O8 T8 3/3.** 09:48–10:0xZ replay + extract + LIMITS + paths + cờ. **0 reboot sau 08:25:43Z trong phiên T8.**

## A. O8 — T8 3/3 TRÊN #114; T01 3/3 TRÊN #114 (CÙNG BOOT — XEM FULL PASS §0)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #114 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `7dad1c5b`, S1 PASS 09:46:16Z |
| 2 | O8 T8 WebKit attempt2 trên #114 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `dd7ddcc2`, S1 PASS 09:47:09Z |
| 3 | O8 T8 Chromium trên #114 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `8072df60`, S1 PASS 09:48:13Z |
| 4 | O8 T01 WebKit attempt1 trên #114 | **21/21 PASS** (md5 eb0d54dd, 08:48:15Z) |
| 5 | O8 T01 WebKit attempt2 trên #114 | **21/21 PASS** (md5 1331ea11, 08:49:14Z) |
| 6 | O8 T01 Chromium trên #114 | **21/21 PASS** (md5 8f025b46, 08:50:37Z) |

- O8 log T8: S1 PASS 6 (3 dòng PASS × 2 lần ghi), FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0. **Gate cho boot đo `b0aab705` (#114 ứng viên): (a) CÓ — POSTBOOT_PASS #114 (t56, replay-đầy-đủ, poll=0, KHÔNG caveat).** O8 T01 + O8 T8 + harness + lượt yên CÙNG boot #114; **FULL PASS CÓ (đề xuất 1 → 2 — parent/T10 quyết).**
- **preview.tsx đổi giữa chừng:** `530e10a7` (lúc T4 mở poller) → `043a0ef5` (lúc O8 T8) — luồng sản phẩm P2 (enhance preview) sửa file trong lúc vòng lặp chạy; harness + O8 chạy trên cây mới `043a0ef5`. `media.ts` 2c384ed1, `vite.config.ts` ee80d093 không đổi.

## 2. Kết quả harness — 6/6; WebKit 3/3 + Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 09:27:15–09:28:35 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 2 | WebKit 85m4 | 0 | 09:28:51–09:31:22 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 09:31:38–09:35:39 | **PASS** — P1 PASS 09:32:12Z + P5 CÓ-RESTART (+3) ended-at-duration + P6 KHÔNG-KẸT, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 09:35:55–09:37:06 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 09:37:22–09:39:44 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 09:39:59–09:43:53 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 27 — 0 kẹt mới.** **84l10 WebKit PASS đợt này** (lần PASS thứ 10 trong 12 đợt gần nhất có đo: 179, 180, 181, 183, 185, 186, 187, 188, 189, 191; 182 + 184 KHÔNG ĐO ĐƯỢC, 190 VOID — đề xuất chuỗi 10). **86n2-P1 không kẹt: đề xuất lần 13** (P1 PASS 09:32:12Z).
- RAM sampler (n=34): balloon min 0 / max 3.795.196 kB (**58,9% trần, pinned=0** — thấp hẳn so với 81,1% đợt 189; balloon XÌ trong lúc harness, avail tăng 1.566 → 4.687 MB), avail min 1.566 MB / max 4.687 MB — KHÔNG ghim trần lần nào.

# §C — B2 LIVE LẦN 5: VÙNG MỚI SẠCH TIẾP; B1 KHÔNG BẮT KẸT (KHÔNG CÓ KẸT)

## C1. Trạng thái B2 đợt này (KHÔNG đổi script — B2 đã trong 3 script từ đợt 186)

- 3 script harness giữ nguyên md5 đợt 186/187/188/189: 84l10 `16e5e957` (35.917 B), 85m4-hb128 `3fb2548b` (**38.737 B — VƯỢT giới hạn push, lúc push cần `ENABLE_PRIVSEP=0`**), 86n2-hb128 `de925614` (**43.653 B — VƯỢT, cần `ENABLE_PRIVSEP=0`**). `node --check` PASS cả 3 (kiểm lúc copy). Thiết kế §C4 LIMITS T8-180 + triển khai §C1 LIMITS T8-186 — không sửa đợt này.
- **Mẫu bọc + ngưỡng giữ nguyên:** ngưỡng 120 s, run_len ≥3, (e)/(f), ngân sách diag (≤2/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. **V2 (f'') vẫn là phương án chính.**

## C2. Kiểm chứng offline LẠI TRƯỚC harness (check-fresh-191t8.py trên 6 log tổng hợp đợt 186)

| Ca | Log tổng hợp | check-fresh-191t8.py (V2) |
|---|---|---|
| B2-1 setup treo 150 s | `planb-b2-setup-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-2 startPlaying treo 150 s | `planb-b2-startplaying-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-3 P6-wait treo 150 s + WATCHDOG-137 @60 s | `planb-b2-p6wait-150s-wd.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-4 P6 seeking-kẹt 150 s, KHÔNG watchdog | `planb-b2-p6wait-150s-nowd.log` | OK maxspan=150 s wd=0 — **KHÔNG trigger (giới hạn đã biết, §C5)** |
| B2-5 P6 sạch 90 s | `planb-b2-p6-clean-90s.log` | OK maxspan=85 s wd=0 — **không FP, dưới ngưỡng 120 s** |
| B2-6 setup sạch 60 s | `planb-b2-setup-clean-60s.log` | OK maxspan=55 s wd=0 — **không FP** |

- **Kết luận offline: ĐẠT (khớp hệt §C2 đợt 186/187/188/189).** Cả 3 vùng B2 mới đều trigger đúng @125 s khi treo thật; không FP trên 2 ca sạch.

## C3. Kiểm live (harness 6/6 đợt này — script B2 là script harness)

| Vùng B2 | WebKit 84l10 | WebKit 85m4 | WebKit 86n2 | Chromium 84l10 | Chromium 85m4 | Chromium 86n2 |
|---|---|---|---|---|---|---|
| `setupProject setup` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `startPlaying start` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `P6-wait wait` | — | — | **18 dòng** (elapsed 5→90 s) | — | — | **19 dòng** (elapsed 5→95 s) |
| check-fresh live | OK maxspan=0 s | OK maxspan=10 s | OK maxspan=85 s | OK maxspan=0 s | OK maxspan=10 s | OK maxspan=90 s |

- **Chi phí live đúng thiết kế:** setup/startPlaying 0 dòng thêm (setup <5 s); P6-wait 18 dòng (WebKit) / 19 dòng (Chromium). Tổng HB128 live: 84l10: 6 dòng (WebKit) / 5 dòng (Chromium); 85m4: 22 dòng; 86n2: 39 dòng (WebKit) / 40 dòng (Chromium).
- **B2 VÙNG MỚI SẠCH LẦN 5** — chưa bắt kẹt thật ở vùng mới (setup/startPlaying/P6-wait). **B1: không bắt kẹt đợt này (không có kẹt để bắt) — chuỗi live sạch đề xuất 1 → 2** (189 khởi động lại lần 1; tiền lệ chuỗi tính lại từ 1 sau khi đứt — đợt 179 lượt yên).
- **Chromium P6-wait chạy tới elapsed=95 s (19 dòng), maxspan=90 s — biên còn 30 s** (đợt 189: 85 s, biên 35 s). Vẫn dưới ngưỡng 120 s, KHÔNG FP.
- **Replay sau live (2 entry sạch mới, 0 entry kẹt mới):** 191-sach-85m4 22 dòng, max run span 10 s, KHÔNG kích hoạt mọi phương án; 191-sach-86n2-hb128 39 dòng, max run span **85 s** (run_len=18, playhead=30 ct=30), KHÔNG kích hoạt mọi phương án — **P6-wait không gây FP ngay cả trong replay** (biên 35 s).

## C4. Replay V1/V2 sau O8 (replay-1c-191t8.py + replay-f-fix-191t8.py — đã thêm 2 entry `191-*`)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 29 log sạch duy nhất theo md5** (31 entry; 2 cặp trùng byte-identical 181/182 — xem dưới). Đợt 191 đóng góp 2 log sạch mới, 0 log kẹt mới.
- **Kẹt theo từng phương án: (c') V0: 164@125 s, 178@125 s, 188@125 s; lỡ 171, 183. (f') V1-300: 164@125 s, 171@305 s, 178@125 s, 188@125 s; lỡ 183. (f'') V2: 164/171/178/183/188 đều @125 s. (f''') V3: 164@125 s, 171@305 s, 178@125 s, 188@125 s; lỡ 183. Kẹt-179 + 180-ket-86n2-std lỡ mọi phương án (0 dòng HB128 / không có run đóng băng — lỗ hổng phủ sóng).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (5/5 kẹt @125 s, FP 0); **V1-300 ĐẠT** (4/5, FP 0) — V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 29 log sạch duy nhất (md5).**
- **F-184-T8-1: KHÔNG TÁI DIỄN:** 0 NO-FILE trong cả hai lần chạy replay.
- **Số log sạch chuẩn (md5-unique): 17/17/19/21/23/25/27/29 (183/184/185/186/187/188/189/191 — 190 VOID, không đóng góp).** Hai cặp trùng: 181/182-sach-85m4 (md5 `166b271d`) + 181/182-sach-86n2-hb128 (md5 `e11c62cb`) — byte-identical, đã biết từ đợt 187. 0 FP không đổi theo cả hai cách đếm.
- **Biên an toàn (không đổi sau B2):** log sạch max identical-run span **90 s** (run P6-wait Chromium — ngưỡng 120 s → biên 30 s; đợt 189: 85 s, biên 35 s). Đây là biên ĐÚNG THIẾT KẾ — không phải FP. Watchdog chỉ kích hoạt sau evaluate im lặng >60 s — tín hiệu ĐỘC LẬP, không vòng tròn.

## C5. Giới hạn B2 (trung thực — B2 không phải toàn năng)

- **B2-4 (offline): P6 seeking-kẹt mà evaluate vẫn trả về (không watchdog) → (c') KHÔNG trigger** (OK maxspan=150 s wd=0). Nguyên nhân: summary seeking=true → (f) chặn; không có WATCHDOG-137 → V2 không miễn (f). Trong thực tế P6 tối đa 90–95 s nên run dừng ở 85–90 s < 120 s — B2 cho P6 chỉ cho **bằng chứng + biên 30 s**. Đường bắt kẹt P6 vẫn là watchdog (i) @60 s + V2 via=wd, hoặc timeout 900 s.
- **B2 đã bắt kẹt thật đầu tiên đợt 188 (P5, vùng chung)** — nhưng chưa bắt kẹt thật nào ở vùng mới (setup/startPlaying/P6-wait). Bằng chứng bắt thật ở vùng mới thuộc ca kẹt tới.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 16 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173) + P5-188 (§D4)

## D1–D2. Phạm vi + Q3: 84l10 qua 4 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; 178 W2-setup :443; script `16e5e957` — B2) + ca 188 86n2-P5 (§D4); 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 PASS (W2+E4), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 191: **không có dữ liệu mới về kẹt 84l10**; hồ sơ 4 điểm kẹt giữ nguyên. **Chuỗi 84l10 PASS: 9 đợt (179, 180, 181, 183, 185, 186, 187, 188, 189) + PASS đợt 191 — có nối qua 2 đợt KHÔNG ĐO ĐƯỢC (182, 184) + 1 đợt VOID (190) hay không — parent/T10 quyết (đề xuất 10).** Tần suất kẹt 84l10: 4 ca / 32 đợt ≈ 13% (không đổi).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — đợt này không kẹt, không có dữ liệu mới.
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (heal lần 5):** T0-189 ghi `libevent` vắng lúc survey → có sau replay trên #112; selfcheck T8 #1/#2/#3 đợt này: libs 6/6 + GST 269 ngay từ đầu trên #114 — củng cố hướng "lib hệ thống quyết định WebKit chạy/không-chạy".
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 191: không có dữ liệu mới về 84l10 (không kẹt 84l10).**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — đợt này không kẹt, không có dữ liệu mới.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 32 đợt). **Nợ P5: xem §D4.**

## D4. B1 ĐIỀU TRA KẸT P5 ĐỢT 188 (kẹt #27) — XONG, KHÔNG TÁI DIỄN ĐỢT 191

- **Kẹt #27 là gì (đọc lại từ đĩa):** WebKit 86n2 P5-phaseB-long trên #111 (01:35:52–01:50:56Z đợt 188): P1 PASS 01:36:24Z, rồi sampleFor đóng băng ở **n=7/200, playhead 0.233 / ct 0.234, seeking=false**, HB128 elapsed 5 s → 806 s (161 dòng cùng run, max span **801 s**); pha bị `timeout 900` giết → exit 124 lúc 01:50:53Z. **WATCHDOG-137 ×3** (01:38:25Z evaluate im lặng >60 s + probe 1+1 TIMEOUT 30 s 01:38:55Z — kênh evaluate kẹt cứng / page JS chết). **V2 TRIGGER @125 s via=f** (01:39:28Z) → diag 2/2 đúng ngân sách. Diag 01:39:34Z (đọc lại `stall-freshcontent-webkit-86n2-hb128-1795570774`): **vite HTTP 200**; **WebKitWebProcess RSS 337.524 kB, MiniBrowser 246.484 kB** (process sống, kênh evaluate chết); Balloon 4.856.184 kB, avail 1.378 MB; dmesg EPERM; journalctl-k trống. 4 thư mục stall còn nguyên trên đĩa.
- **Kết luận cơ chế: H3-thuần** — process sống, kênh evaluate/JS chết, vite sống, không phải lỗi RAM (avail 1.378 MB lúc diag, balloon đã xì từ 6,44 GB; Chromium cùng pha chạy sạch ngay sau đó trên cùng boot). Cùng chữ ký với các kẹt 84l10/85m4 trước, chỉ khác vị trí: **đây là kẹt 86n2-P5 ĐẦU TIÊN** (hồ sơ trước: 84l10 4 ca, 85m4 P1 1 ca/183, 86n2-P1 0 ca).
- **Đối chiếu Q1–Q4 cho P5-phaseB-long (mở điều tra riêng như 84l10 — nợ từ đợt 188):**
  - **Q1 — Chuyển trạng thái hay vòng poll?** Ca 188 là sampleFor đóng băng giữa chừng (n=7/200), không phải chuyển trạng thái — giống họ kẹt "vòng poll đóng băng", khác họ kẹt setup (W2-setup).
  - **Q2 — Lib hệ thống hay engine?** Chromium cùng pha PASS sạch trên cùng boot #111 → nghiêng **engine (WebKitGTK)**, không phải lib hệ thống.
  - **Q3 — Trạng thái media lúc chết?** Playhead 0.233 / ct 0.234 (đầu clip, chưa tới 1 s), seeking=false, n=7/200 — kẹt NGAY ĐẦU pha dài, không phải cuối clip (khác 3 restart ended-at-duration đợt 191 — F-191-T8-4).
  - **Q4 — Race evaluate/GStreamer?** Probe 1+1 TIMEOUT 30 s sau WATCHDOG-137 → evaluate kẹt cứng; GStreamer không có bằng chứng trực tiếp (không đọc được dmesg/journal). Vẫn mở.
- **Tái diễn đợt 191? KHÔNG.** WebKit 86n2-P5 đợt này QUA (P1 PASS 09:32:12Z → P5 xong 09:33:48Z, playhead tới 30, frozen seek dài nhất 2 mẫu ~0,4 s; 3 restart là ended-at-duration tự nhiên — F-191-T8-4); Chromium P5 PASS sạch (0 restart). **B1 live sạch đề xuất 1 → 2; kẹt cộng dồn GIỮ 27.**
- **Nợ đứng:** chỉ 1 ca P5 — chưa đủ dữ kiện mở điều tra P5 riêng đầy đủ (cần ≥2 ca). Nếu P5 kẹt lại, mở điều tra riêng như 84l10 với 4 câu hỏi trên + call-site + log cuối + RSS + HB128 cuối. H3 ỦNG HỘ (giữ mức đợt 188 — ca #27 là mẫu H3 thuần, đợt này không có ca mới).

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 191 (0 KẸT — KHÔNG CÓ BẰNG CHỨNG MỚI)

## B1. Trạng thái giả thuyết sau đợt 191

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — đợt này 0 kẹt; avail trong lúc harness 1.566–4.687 MB, balloon max 58,9% trần (không ghim 100%).
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ (giữ mức đợt 188)** — đợt này không có ca kẹt mới để củng cố hay bác bỏ; WebKit 3/3 + Chromium 3/3 đều sạch trên cùng boot. H3 vẫn chỉ giám sát thụ động.
- Đợt 191 T8 chỉ giám sát thụ động H3: **0 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T01 PASS 3/3 trên #114). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS, lần thứ 13 nếu tính tiếp (parent quyết).**

# §E — CHECKLIST (o) ĐỢT 191 (quyết (o) đợt 180 + các F-189/F-190 còn lại, gọn)

- o1. F-186-T0-1 (#106 chưa xác minh) — ĐÃ QUYẾT (e) đợt 186: cea79500 = #107; #106 là reboot chưa xác minh (ước ~15:13:32Z).
- o2. Run 191 kết cục thuộc T7-191 (T7-191 phán; run 190 VOID — không tồn tại).
- o3. F-185-T1-1 (prose §112) — ĐÃ SỬA XONG đợt 186.
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 1.566–4.687 MB trong harness; balloon max 58,9% trần, pinned=0.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; T4-191: (p) live lần 10 ĐẠT; B2 dữ kiện thứ 3 cho quyết tách (load1_max 2,91 — parent quyết).
- o6. F-181-T4-3 (X193) — **ĐÍNH CHÍNH: X193 là Xvfb của chính probe T4** (T4-191 .done; F-189-T4-7 đã đính chính). X93/X94 còn lúc T8 đóng — không phải của T8 (Xvfb T8 là :199, tự kill + unlink).
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-191 ALIVE (POSTBOOT_PASS 08:45:57Z, poll=0); T56-191 ĐÃ ĐÓNG CỜ.
- o8. F-181-T5-2 (ledger ts) — GHI NHẬN (T56-191 đã đóng cờ).
- o9. F-180-T5-3 (lệch btime 11 s) — GHI NHẬN; /proc/1 #114 = btime +12 s.
- o10. F-174-T5-6 KHÔNG áp dụng — GHI NHẬN (#114 replay-đầy-đủ, poll=0, KHÔNG caveat; #108 KHÔNG CÓ cờ — tổng 25).
- o11–o13. F-181-T6-1 + F-180-T6-4 + F-180-T6-5 — GHI NHẬN; T56-191 ĐÃ ĐÓNG CỜ.
- o14–o16. F-181-T7-1 (OUTAGE 8.406 s — "cố định theo giờ" ĐƯỢC ỦNG HỘ MẠNH, T7-194 phán cuối) + F-180-T7-4 + F-180-T7-5 — GHI NHẬN; T7-191 CHƯA ĐÓNG CỜ lúc T8 đóng.
- o17. F-185-T8-4 (stat sai marker) — **ĐÃ SỬA (T0-186)** — stat đúng `~/.config/vcut-persistence-marker`; marker 66 reboot (T8-191 XÁC NHẬN #114).
- o18. Quyết (o) 189 (cửa slot LÀNH lần 3; OUTAGE #2 — T7-188 kết luận) — GHI NHẬN; số mới thuộc T7-191 (chưa đóng).
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — ĐÃ THỰC HIỆN: marker 66 reboot; T8 đóng ~10:01Z, TRONG hạn cờ ~11:00Z (GATE-FOUND 09:26:21Z).
- o20. Quyết (j) 189 (B2 sạch lần 4; V2 chính thức; H3 giám sát; B1 khởi động lại lần 1; 84l10 chuỗi 9; 86n2-P1 lần 12; F-189-T8-1/F-189-T8-2 giao T8-190/191) — **ĐÃ THỰC HIỆN (§2, §C, §D4, §F, §B, §C4)** — B2 sạch lần 5; V2 replay 5/5 @125 s, V1-300 4/5; F-189-T8-1 ĐÃ SỬA (nhãn o8-driver "T8-191"); F-189-T8-2 KHÔNG tái diễn (brief 191 lấy mốc từ §12.3-189 parent).
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T01-191/T9-191; T9-191 CHƯA ĐÓNG CỜ lúc T8 đóng; T01-191: O8 PASS 3/3 trên #114, 08:51:44Z, CHƯA ĐÓNG CỜ).

# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 191 — DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy). **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy** (hb128 là chuẩn). **Chi phí B2 giữ nguyên:** 85m4-hb128 38.737 B (VƯỢT, dư −969 B); 86n2-hb128 43.653 B (oversize — cần ENABLE_PRIVSEP=0); 84l10 35.917 B (dư 1.851 B).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7 → **043a0ef5** (đổi giữa chừng — P2 enhance preview; harness + O8 chạy trên cây mới); `media.ts` 2c384ed1; `vite.config.ts` ee80d093 (không đổi); `84l10` **16e5e957 (B2, KHÔNG ĐỔI đợt này)**; `85m4-hb128` **3fb2548b (B2, KHÔNG ĐỔI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` de925614 (B2, KHÔNG ĐỔI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). **T8 KHÔNG đổi file repo đợt này (chỉ LIMITS này + script làm việc trong hidden_files).**
- **Working dir `repo-1/hidden_files/round191-t8/`** — copy `cp -r` 189→191 (exit 0). **Đổi nhãn đúng** (189t8→191t8, waiter deadline → 10:30Z) — grep: chỉ còn tham chiếu 189 trong khối LOGS đóng băng của replay + 2 entry `191-*` mới. **F-189-T8-1 ĐÃ SỬA:** nhãn header o8-driver nay "T8-191" (log xác nhận). **F-191-T8-1 (waiter): xem §8.**
- Extract (F-182-T8-6 — ĐÃ KIỂM LIVE đợt 183, dùng lại đợt này): trích ĐÚNG số harness (0/0/0 + 0/0/0) + O8 (webkit 21/21 md5 7dad1c5b/dd7ddcc2, chromium 21/21 md5 8072df60) + sampler n=34 + WATCHDOG-137: 0. Nhãn "ovsize LIMITS 188" nay LẠI SAI MỘT ĐỢT (xem F-191-T8-2).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN ĐÚNG LÚC.** 3 symlink Singleton* stale của Chromium đã xóa lúc copy 08:41Z (F-186-T8-2 KHÔNG tái diễn — không còn symlink stale nào trong bản copy).
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP).** File `o8-s1-probe-191t8.mjs` có mặt sau `cp -r` 189→191 (md5 `453d1082` giống hệt 175–191; `node --check` PASS). O8 T8 chạy với probe này (S1 PASS 6, FAIL 0 — attempt1/2 PASS nên probe không cần chạy lại).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round191-t8). **F-181-T8-5: ÁP DỤNG CHO #114** (replay-đầy-đủ, poll=0, KHÔNG caveat — khác #111/#107/#101/#98/#96). **F-181-T8-6 (gst-inspect vắng): KHÔNG TÁI DIỄN TRÊN #114** (tools đã cài sau replay — gst-inspect CÓ, 1.624 dòng ở selfcheck #1/#2/#3). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 187 — tổng GIỮ 25 (đã chấp nhận #108 KHÔNG cờ ở §12.3-187). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 6. Dọn dẹp + kiểm cuối — sạch (trên #114, không reboot sau 08:25:43Z)

- Driver harness (pid 55188) đã thoát sau pha cuối (09:43:53Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng). O8 driver đã nhả lock 09:48:44Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 99 cooldown — extract xác nhận).
- Kiểm cuối ~09:52Z (trên #114): process Xvfb/MiniBrowser/WebKit sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` còn **3 file (X193 — của T4; X93/X94 — không phải của T8)**. **Extract báo "ps sót: 134" là SAI PHƯƠNG PHÁP (xem F-191-T8-3 — 134 process Chromium của luồng voicefx; T8 sót 0).**
- Fixture /tmp: **ĐÃ REBUILD 09:27:03Z (md5 khớp đợt 125)** — vẫn còn lúc đóng (chưa có reboot mới sau đó).
- **Reboot #114 (boot `b0aab705`, btime 08:25:43Z, gap #113→#114 = 13.759 s):** xảy ra TRƯỚC khi T8 mở; **0 reboot trong cửa sổ đo (09:27–09:48Z).** dpkg.log 1.468 dòng (ổn định sau replay). #114 ỨNG VIÊN (T01 chưa đóng cờ — parent quyết (e)); (m) #113 thô +35,149 s sát biên (T2-191 phán); POSTBOOT_PASS #114 ĐÃ CÓ 08:45:57Z (replay, poll=0, KHÔNG caveat); #108 KHÔNG CÓ cờ — tổng 25.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l`.** Không chạy script nặng khi T4 attempt (harness chạy SAU GATE-FOUND 09:26:21Z — theo (i)-143).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 6/6 — WebKit 3/3 PASS + Chromium 3/3 PASS (trên #114 ứng viên).** **Kẹt cộng dồn GIỮ 27 — 0 kẹt mới.**
2. **O8 T8 3/3 (WebKit 21/21 md5 7dad1c5b/dd7ddcc2; Chromium 21/21 md5 8072df60 — trên #114).** O8 T01 PASS 3/3 trên #114 theo log T01 (md5 eb0d54dd/1331ea11/8f025b46, DONE 08:51:44Z — T01 CHƯA ĐÓNG CỜ).
3. **Chuỗi WebKit FULL PASS 1 → 2 (ĐỀ XUẤT — CÓ: 5/5 chân cùng boot #114).** Lần thứ hai liên tiếp (189: 0 → 1). **Parent/T10 quyết cuối.**
4. **POSTBOOT_PASS #114 CÓ 08:45:57Z (t56, replay-đầy-đủ, poll=0, KHÔNG caveat — GST 269, tools đã cài, dpkg 1.468)** — gate (a) #114 ĐẠT. **#108 KHÔNG CÓ cờ** (tổng boot không cờ GIỮ 25). **#114 ỨNG VIÊN (T01 chưa đóng cờ).**
5. **Balloon max 58,9% trần trong cửa sổ harness (n=34, avail min 1.566 MB, pinned=0)** — KHÔNG ghim trần lần nào; KHÔNG có sampler T9 trong LIMITS này.
6. **85m4-hb128 38.737 B (VƯỢT giới hạn push 969 B) + 86n2-hb128 43.653 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 35.917 B (dư 1.851 B). **LIMITS này DƯỚI giới hạn push (xem stat lúc ghi cờ).**
7. **Chuỗi verdict: 84l10 PASS (đề xuất chuỗi 10); 86n2-P1 không kẹt đề xuất lần 13; B2 vùng mới sạch lần 5; B1 live sạch đề xuất 1 → 2; số chuẩn 27 → 29 (md5-unique).** H3 ỦNG HỘ (giữ mức đợt 188).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') PHƯƠNG ÁN CHÍNH — replay V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 29 log sạch duy nhất (md5).** V1 chỉ còn đối chứng trong replay. Live đợt này 0 trigger (không có kẹt).
10. **T7-191/T9-191/T01-191 CHƯA ĐÓNG CỜ lúc T8 đóng** (T4/T56/P2/P3/P4 đã đóng). **T4 đóng 09:25Z với lượt yên #59 HỢP LỆ (median 42,0 ms); auto-trigger LIVE 0 FIRE trong cửa sổ attempt (T9-191 phán cuối).**
11. **#114 ỨNG VIÊN (T01 chưa đóng cờ); marker 66 reboot;** (m) #113 thô +35,149 s sát biên (T2-191 phán cuối); POSTBOOT_PASS #114 ĐÃ CÓ 08:45:57Z.
12. **T8 ĐÓNG ~10:0xZ, TRONG hạn cờ ~11:00Z** (GATE-FOUND 09:26:21Z + harness 6/6 không pha timeout). 0 reboot trong cửa sổ đo (09:27–09:48Z).

## 8. Sai số mới (F-191-T8-N) + nợ cũ đã xử lý

- **F-191-T8-1 — WAITER CHỈ KIỂM round191-t5, BỎ SÓT POSTBOOT_PASS Ở round191-t56 (T8 TỰ BẮT + ĐÃ SỬA LÚC 09:20Z):** waiter bản đầu chỉ kiểm `$HF/round191-t5/POSTBOOT_PASS`; đợt 191 T5+T6 gộp thành round191-t56 nên cờ nằm ở đó (ghi 08:45:57Z, poll=0, replay-đầy-đủ). Hậu quả: postboot đường (b) hết hạn 900 s lúc poll 36 (09:18:46Z) trong khi đường (a) vẫn CÓ — waiter kẹt ở postboot=0 tới khi T8 sửa. T8 sửa waiter (kiểm cả hai thư mục), khởi động lại 09:20:20Z, GATE-FOUND poll=7 09:26:21Z đường (a). Không ảnh hưởng số harness/O8/replay (chỉ chậm gate ~7 phút). Nợ đợt 192: waiter kiểm cả `round<N>-t5` lẫn `round<N>-t56` ngay từ đầu.
- **F-191-T8-2 — NHÃN EXTRACT "ovsize LIMITS 188" HARD-CODE (T8 TỰ BẮT — SỐ ĐÚNG, NHÃN SAI MỘT ĐỢT):** `extract-191t8.py` dòng 119 ghi cứng đường dẫn `PHASE9_ROUND188_T8_VITEHARNESS_LIMITS.md` (37.694 B) — F-188-T8-2 tưởng đã sửa thành động, thực ra chỉ đổi từ 186 → 188 bằng tay mỗi đợt. Đợt này nhãn đúng ra phải là "LIMITS 189: 32.857 B". Không ảnh hưởng số harness/O8/replay (chỉ sai nhãn trong output extract). Nợ đợt 192: sửa extract lấy LIMITS đợt trước theo số đợt hiện tại.
- **F-191-T8-3 — EXTRACT "ps sót: 134" ĐẾM NHẦM PROCESS CỦA LUỒNG KHÁC (T8 TỰ BẮT — T8 SÓT 0):** extract đếm `ps aux | grep -E 'Xvfb :199|MiniBrowser|WebKitWebProcess|chromium'` — 134 process Chromium thuộc luồng voicefx-profile3 (luồng sản phẩm khác, start 09:26Z, remote-debugging-port=9223). Kiểm lại lúc đóng: **0** MiniBrowser/WebKitWebProcess/Xvfb :199/:189 sót; Xvfb :199 tự kill + unlink. T8 KHÔNG giết 134 process đó (không phải của T8). Nợ đợt 192: extract lọc process theo user-data-dir/scratch của chính T8, không grep rộng "chromium".
- **F-191-T8-4 — WEBKIT 86n2-P5 CÓ-RESTART (+3) ENDED-AT-DURATION, LẦN ĐẦU (QUAN SÁT — KHÔNG PHẢI KẸT):** P5 WebKit 86n2 đợt này ghi `CÓ-RESTART (+3)` (3 restart, causeTag ended-at-duration, ct=30=dur — video tới cuối clip rồi loop lại); đợt 189 cùng pha ghi `P5 PASS` (0 restart). Không phải kẹt: playhead tới 30, frozen seek dài nhất 2 mẫu (~0,4 s), HB128 tiến bình thường, 0 WATCHDOG-137, 0 FRESH-CONTENT trigger; `out.ok` của 86n2 chỉ tính P1/P2/P3 nên phase vẫn KHÔNG FAIL (exit 0). Chromium cùng pha: 0 restart (P5 PASS). Ghi nhận để theo dõi: nếu WebKit P5 restart tăng, xem có phải hành vi loop-restart khác Chromium không.
- **F-189-T8-1 — ĐÃ SỬA** (nhãn o8-driver "T8-191"). **F-189-T8-2 — KHÔNG TÁI DIỄN** (brief 191 lấy mốc từ §12.3-189 parent). **F-188-T8-1 — KHÔNG TÁI DIỄN** (dpkg ổn định 1.468). **F-188-T8-2 — ĐÃ SỬA ĐỢT 189, NHÃN MỚI LẠI LỆCH (xem F-191-T8-2).** **F-186-T8-2 — KHÔNG TÁI DIỄN** (3 symlink Singleton* stale đã xóa lúc copy). **F-186-T8-4 — ĐÃ SỬA ĐỢT 187. F-186-T8-3 — ĐÃ XÁC MINH ĐỢT 187 (số chuẩn 27 → 29 đợt này). F-186-T8-1/-T8-5 — KHÔNG TÁI DIỄN. F-185-T8-4 — ĐÃ SỬA (T0-186). F-184-T8-1 — KHÔNG TÁI DIỄN (0 NO-FILE). F-183-T8-7 — KIỂM LẠI TRÊN #114: libevent-2.1.so.7 CÓ (selfcheck #1/#2/#3).**
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG.** Dọn `smoke/` khỏi bản copy (189 smoke → `smoke/archive-189/`, 19 file); replay chạy sạch. **Lưu ý:** extract vẫn liệt kê cả báo cáo O8 stamp cũ đợt 189 trong `o8-webkit/`/`o8-chromium/` (copy kèm) — LIMITS này chỉ trích số 191 (md5 7dad1c5b/dd7ddcc2/8072df60).
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-191t8.sh` (cả 6 pha).
- **F-183-T8-5 — NHÃN "ovsize LIMITS 181": ĐÃ SỬA ĐỢT 184 — NHÃN MỚI LẠI LỆCH (xem F-191-T8-2). F-183-T8-8: ĐÃ SỬA ĐỢT 183. F-183-T8-2 — SOCKET X193: ĐÃ ĐÍNH CHÍNH (X193 là Xvfb của chính probe T4). F-183-T8-4 — (c') BỎ LỠ kẹt-183: V2 ĐÃ TRIỂN KHAI (§C). F-183-T8-6 — ĐÃ GHI NHẬN ĐỢT 183.**
- **F-182-T8-6 — EXTRACT KIỂM LIVE: ĐÃ ĐẠT ĐỢT 183, DÙNG LẠI ĐỢT NÀY (số O8 trong LIMITS này là số mới). F-181-T8-1: ĐÃ HẾT (181). F-181-T8-2/3/4: ĐÃ SỬA, KHÔNG TÁI DIỄN. F-181-T8-7: ĐÃ QUYẾT (c) đợt 187 — tổng GIỮ 25. F-181-T8-8 (log stale): VẪN CÒN — đợt này KHÔNG tái diễn.**

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS 1 → 2 (ĐỀ XUẤT — CÓ: 5/5 chân cùng boot #114)** — parent/T10 quyết (gate (a), O8 T01, O8 T8, lượt yên #59, harness 6/6 — lần thứ hai liên tiếp).
2. **B2 vùng mới sạch lần 5; B1 live sạch đề xuất 1 → 2** — parent ghi nhận (giới hạn §C5 đã ghi rõ; biên P6-wait Chromium còn 30 s).
3. **Chuỗi 84l10 PASS 9 → 10 (đề xuất) + chuỗi 86n2-P1 không kẹt 12 → 13 (đề xuất)** — parent/T10 quyết (cả hai đều nối qua đợt 184 không đo được theo quyết (j) đợt 186 + đợt 190 VOID; mốc 86n2-P1 lấy từ §12.3-189 (j)).
4. **F-191-T8-4 số chuẩn 27 → 29 (md5-unique)** — parent ghi nhận, không còn nợ.
5. **Reboot #114 (b0aab705, btime 08:25:43Z, gap #113→#114 = 13.759 s)** — ỨNG VIÊN (T01 chưa đóng cờ — parent quyết (e)); (m) #113 thô +35,149 s sát biên (T2-191 phán cuối); POSTBOOT_PASS #114 ĐÃ CÓ 08:45:57Z (replay, poll=0, KHÔNG caveat); #108 KHÔNG CÓ cờ — tổng boot không cờ 25.
6. **F-191-T8-1 (waiter bỏ sót POSTBOOT_PASS ở t56) + F-191-T8-2 (nhãn extract hard-code) + F-191-T8-3 (extract đếm nhầm process luồng khác) + F-191-T8-4 (WebKit P5 CÓ-RESTART (+3))** — parent ghi nhận; không đổi verdict. Nợ đợt 192: waiter kiểm cả t5 lẫn t56; extract lấy LIMITS đợt trước động + lọc process theo scratch T8.
7. **Lượt yên #59 CÓ LƯỢT HỢP LỆ (median 42,0 ms)** — T4-191 chi tiết; chuỗi lượt yên 1 → 2 (đề xuất); kiểm chứng live lần 10 ĐẠT (chuỗi 8 → 9 đề xuất); B2 dữ kiện thứ 3 cho quyết tách (load1_max 2,91 — parent quyết); auto-trigger LIVE 0 FIRE trong cửa sổ attempt (T9-191 phán cuối).
8. **Kẹt 86n2-P5 đợt 188 (kẹt #27) — ĐIỀU TRA XONG (§D4): H3-thuần, KHÔNG tái diễn đợt 191** — nợ đợt sau: nếu P5 kẹt lại (ca thứ 2), mở điều tra riêng đầy đủ như 84l10 (Q1–Q4 + call-site + log cuối + RSS + HB128 cuối); H3 ủng hộ (giữ mức đợt 188).
9. Mở từ trước, vẫn đứng: **#114 KHÔNG GIẾT HOLDER (T56-191 đã đóng); (A) 120/120 (T56-191); (m) #103 DƯƠNG +37,543 s (parent 185 quyết cuối); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck, T2-191); (m) #56 (T2-191); G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần chạy (T9-191 chưa đóng); R9 (a); file oversize 6,4 MB chưa quyết; u2net là fallback; fixture /tmp đã rebuild; KHÔNG PUSH — 240/370/335/331 chờ push (166–189) + batch đợt 191 (T10 đếm cuối).**
10. **F-191-T0-1 (T01 chưa đóng cờ lúc T8 đóng — số hiệu #114 ứng viên, parent quyết (e)) + F-191-T4-1 (T4 LIMITS 37.760 B — dưới giới hạn push chỉ 8 B, sát nhất từ trước tới nay)** — thuộc T01/T4 (T8 chỉ ghi nhận).
