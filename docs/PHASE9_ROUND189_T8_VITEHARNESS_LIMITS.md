# Đợt 189 T8 — HARNESS 6/6 TRÊN #112: FULL PASS (ĐỀ XUẤT 0 → 1); 0 KẸT MỚI; B2 VÙNG MỚI SẠCH LẦN 4

Ngày: 25/11/2026 (lượt cron 09:35 +07 = 02:35:51Z; T8 mở ~02:43Z, đóng ~03:5xZ — TRONG hạn cờ ~05:00Z).
Phạm vi: (1) harness hb128 + B1/B2 live trên boot mới nhất; (2) O8 T8; (3) (c')/(f') V1 đối chứng + replay V1/V2; (4) H3 thụ động; (5) B2 live lần 4. KHÔNG chạy diag W2-setup (DỪNG, quyết (j) đợt 180). **Nguồn:** LIMITS T8-188 + aggregate 188 §12.3 **BẢN PARENT, SẠCH** (lần sạch thứ ba kể từ đợt 179 — 179, 183, 188; tổng điền sẵn GIỮ 18; parent kiểm dedup python viết mới /tmp/count-188-parent.py KHỚP TỪNG SỐ lần thứ 108; aggregate sau viết 56.051 B).

## 0. Kết luận ngắn — 6/6; 0 kẹt mới; FULL PASS (đề xuất 0 → 1)

- **#112 XÁC NHẬN 9 nguồn TƯƠI (T0-189)** — boot `27e6714f`, btime **02:33:19Z**, gap #111→#112 = 12.155 s (3h22m35s, dài nhất chuỗi gần đây). **POSTBOOT_PASS #112 CÓ 03:11:11Z** (replay-đầy-đủ, poll=0, KHÔNG caveat; dpkg 1.461, cache 169, lists 37, md5 ca79a6b2). Gate (a) #112: CÓ (không caveat). **#108 KHÔNG CÓ cờ** (tổng boot không cờ GIỮ 25). Marker sống qua **64 reboot** (#49–#112, mtime không đổi).
- **Lượt yên #58 CÓ LƯỢT HỢP LỆ (T4-189)** — attempt1 20/20 + lớp B ĐẠT 5/5 + tickCost median 42,0 ms. Chuỗi lượt yên: đề xuất 0 → 1 (khởi động lại).
- **HARNESS 6/6 trên #112 (03:26:33–03:41:57Z): WebKit 3/3** (84l10 PASS, 85m4 PASS, 86n2 PASS) **+ Chromium 3/3 PASS.** **Kẹt cộng dồn GIỮ 27 — 0 kẹt mới.** live_diags=0; WATCHDOG-137 = 0.
- **B2 VÙNG MỚI SẠCH LẦN 4** (setup/startPlaying/P6-wait 0 trigger; check-fresh live 0/5/85/0/10/85). **B1: không bắt kẹt (không có kẹt) — chuỗi live sạch đề xuất KHỞI ĐỘNG LẠI lần 1** (188 bắt kẹt thật, DỪNG ở 5; đợt này sạch).
- **O8 T8 3/3 trên #112** (03:42:15–03:44:45Z): WebKit ×2 **21/21 PASS** (md5 `b6a09a7d`/`df40bc11`) + **Chromium 21/21 PASS (md5 `ffee4948`)**. **O8 T0 PASS 3/3 trên #112** (WebKit md5 54345489/1882c83e, Chromium 299b1010, 03:18:30–03:21:02Z).
- **FULL PASS: CÓ — đề xuất chuỗi 0 → 1.** 5/5 chân cùng boot #112 (gate (a) ✓, O8 T0 ✓, O8 T8 ✓, lượt yên #58 ✓, harness 6/6 ✓). Lần đầu kể từ đợt 185.
- **V2 (f'') phương án chính — replay: V2 bắt 5/5 kẹt @125 s (164/171/178/183/188), 0 FP trên 27 log sạch duy nhất theo md5** (29 entry; 189 đóng góp 2 log sạch mới: 189-sach-85m4 md5 `5b79177c`, 189-sach-86n2-hb128 md5 `c48941f1`); **V1-300 đối chứng: 4/5** (lỡ 183).
- **84l10 PASS đợt này — đề xuất chuỗi 8 → 9** (179, 180, 181, 183, 185, 186, 187, 188, 189; nối qua 182 + 184 không đo được theo quyết (j) đợt 186). **86n2-P1 không kẹt: đề xuất chuỗi 11 → 12** (P1 PASS 03:31:01Z; mốc đã sửa theo §12.3-188 (j) — xem F-189-T8-2).
- **F-189-T8-1 + F-189-T8-2 mới (xem §8).** F-188-T8-1 KHÔNG tái diễn (replay #112 chạy bình thường, dpkg tăng live tới 1.461). F-188-T8-2 ĐÃ SỬA (nhãn extract nay động — "LIMITS 188: 37694", extract xác nhận). F-186-T8-2 KHÔNG tái diễn (cả 2 symlink cập nhật NGAY lúc copy 02:44Z). F-184-T8-1 KHÔNG tái diễn (0 NO-FILE cả hai replay).

## 1. Dòng thời gian (gọn)

- 23:10:44Z 24/11 **#111** (257c1eae). 02:33:19Z **#112** (27e6714f, XÁC NHẬN 9 nguồn — T0-189). 02:35:51Z Đợt 189 mở. 02:43–02:47Z T8 mở: đọc LIMITS T8-188 + aggregate 188 §12.3 (bản parent SẠCH, 56.051 B); copy driver 188→189 + đổi nhãn; **dọn `smoke/` (188 → `smoke/archive-188/`)**; **cả 2 symlink diag cập nhật NGAY lúc copy (02:44Z)**; probe S1 CÓ SẴN (md5 `453d1082`).
- 02:46:02Z Selfcheck #1 trên #112: libs 6/6, plugin dir 32, dpkg 309 → 397 đang tăng (replay ĐANG CÀI — khác hẳn 188 đình trệ). 02:47:07Z waiter T8 khởi động (deadline 04:30Z). 03:11:11Z **POSTBOOT_PASS #112 CÓ** (replay-đầy-đủ, poll=0). 03:12:48–03:16:42Z T4 attempt1 (lượt yên #58 HỢP LỆ). 03:14:10Z auto-trigger LIVE khởi động trong cửa attempt, 0 FIRE (T4-189). 03:18:30–03:21:02Z **O8 T0 3/3 trên #112.** 03:25:12Z **GATE-FOUND poll=39** (t4=OK, postboot đường (a)).
- 03:26:21Z rebuild fixture: exit 0, md5 khớp đợt 125 (ba0c7c62/f05daed8/fbaa3d1a/a1fb8549) — /tmp mất theo reboot #112. 03:26:33–03:41:57Z **HARNESS 6/6** (driver pid 320940, boot #112). **03:42:15–03:44:45Z O8 T8 3/3.** 03:46–03:5xZ replay + extract + LIMITS + paths + cờ. **0 reboot sau 02:33:19Z trong phiên T8.**

## A. O8 — T8 3/3 TRÊN #112; T0 3/3 TRÊN #112 (CÙNG BOOT — XEM FULL PASS §0)

| # | Pha | Kết quả |
|---|---|---|
| 1 | O8 T8 WebKit attempt1 trên #112 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `b6a09a7d`, S1 PASS 03:42:27Z |
| 2 | O8 T8 WebKit attempt2 trên #112 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `df40bc11`, S1 PASS 03:43:17Z |
| 3 | O8 T8 Chromium trên #112 | **21/21 PASS** — exit=0, JSON n=21 ok=21, md5 `ffee4948`, S1 PASS 03:44:14Z |
| 4 | O8 T0 WebKit attempt1 trên #112 | **21/21 PASS** (md5 54345489, 03:18:30Z) |
| 5 | O8 T0 WebKit attempt2 trên #112 | **21/21 PASS** (md5 1882c83e) |
| 6 | O8 T0 Chromium trên #112 | **21/21 PASS** (md5 299b1010, 03:21:02Z) |

- O8 log: S1 PASS 6, FAIL 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0. **Gate cho boot đo `27e6714f` (#112): (a) CÓ — POSTBOOT_PASS #112 (replay-đầy-đủ, poll=0, KHÔNG caveat).** O8 T8 + O8 T0 + harness + lượt yên CÙNG boot #112; **FULL PASS CÓ (đề xuất 0 → 1 — parent/T10 quyết).**

## 2. Kết quả harness — 6/6; WebKit 3/3 + Chromium 3/3 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 03:26:37–03:27:47 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 2 | WebKit 85m4 | 0 | 03:28:02–03:30:13 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 3 | WebKit 86n2-hb128 | 0 | 03:30:28–03:34:29 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |
| 4 | Chromium 84l10 | 0 | 03:34:45–03:35:45 | **PASS** — W2 PASS + E4 PASS, live_diags=0 |
| 5 | Chromium 85m4 | 0 | 03:36:00–03:38:01 | **PASS** — P1 PASS + P5 PASS, live_diags=0 |
| 6 | Chromium 86n2-hb128 | 0 | 03:38:16–03:41:57 | **PASS** — P1 PASS + P5 PASS + P6 KHÔNG-KẸT, live_diags=0 |

- **Kẹt harness cộng dồn GIỮ 27 — 0 kẹt mới.** **84l10 WebKit PASS đợt này** (lần PASS thứ 9 trong 11 đợt gần nhất: 179, 180, 181, 183, 185, 186, 187, 188, 189; 182 + 184 KHÔNG ĐO ĐƯỢC — đề xuất chuỗi 9). **86n2-P1 không kẹt: đề xuất lần 12** (P1 PASS 03:31:01Z; mốc đã sửa — xem F-189-T8-2).
- RAM sampler (n=31): balloon min 3.566.716 / max 5.226.796 kB (**81,1% trần, pinned=0**), avail min 1.212 MB / max 2.691 MB — KHÔNG ghim trần lần nào trong cửa sổ harness.

# §C — B2 LIVE LẦN 4: VÙNG MỚI SẠCH TIẾP; B1 KHÔNG BẮT KẸT (KHÔNG CÓ KẸT)

## C1. Trạng thái B2 đợt này (KHÔNG đổi script — B2 đã trong 3 script từ đợt 186)

- 3 script harness giữ nguyên md5 đợt 186/187/188: 84l10 `16e5e957` (35.917 B), 85m4-hb128 `3fb2548b` (**38.737 B — VƯỢT giới hạn push, lúc push cần `ENABLE_PRIVSEP=0`**), 86n2-hb128 `de925614` (**43.653 B — VƯỢT, cần `ENABLE_PRIVSEP=0`**). `node --check` PASS cả 3 (kiểm lúc copy). Thiết kế §C4 LIMITS T8-180 + triển khai §C1 LIMITS T8-186 — không sửa đợt này.
- **Mẫu bọc + ngưỡng giữ nguyên:** ngưỡng 120 s, run_len ≥3, (e)/(f), ngân sách diag (≤2/lần chạy, ≥240 s, diag-only), timeout 900 s, verdict. **V2 (f'') vẫn là phương án chính.**

## C2. Kiểm chứng offline LẠI TRƯỚC harness (check-fresh-189t8.py trên 6 log tổng hợp đợt 186)

| Ca | Log tổng hợp | check-fresh-189t8.py (V2) |
|---|---|---|
| B2-1 setup treo 150 s | `planb-b2-setup-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-2 startPlaying treo 150 s | `planb-b2-startplaying-150s.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=f** |
| B2-3 P6-wait treo 150 s + WATCHDOG-137 @60 s | `planb-b2-p6wait-150s-wd.log` | **TRIGGER elapsed=125 s span=120 s run_len=25 via=wd** |
| B2-4 P6 seeking-kẹt 150 s, KHÔNG watchdog | `planb-b2-p6wait-150s-nowd.log` | OK maxspan=150 s wd=0 — **KHÔNG trigger (giới hạn đã biết, §C5)** |
| B2-5 P6 sạch 90 s | `planb-b2-p6-clean-90s.log` | OK maxspan=85 s wd=0 — **không FP, dưới ngưỡng 120 s** |
| B2-6 setup sạch 60 s | `planb-b2-setup-clean-60s.log` | OK maxspan=55 s wd=0 — **không FP** |

- **Kết luận offline: ĐẠT (khớp hệt §C2 đợt 186/187/188).** Cả 3 vùng B2 mới đều trigger đúng @125 s khi treo thật; không FP trên 2 ca sạch.

## C3. Kiểm live (harness 6/6 đợt này — script B2 là script harness)

| Vùng B2 | WebKit 84l10 | WebKit 85m4 | WebKit 86n2 | Chromium 84l10 | Chromium 85m4 | Chromium 86n2 |
|---|---|---|---|---|---|---|
| `setupProject setup` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `startPlaying start` | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng | 0 dòng |
| `P6-wait wait` | — | — | **18 dòng** (elapsed 5→90 s) | — | — | **18 dòng** (elapsed 5→90 s) |
| check-fresh live | OK maxspan=0 s | OK maxspan=5 s | OK maxspan=85 s | OK maxspan=0 s | OK maxspan=10 s | OK maxspan=85 s |

- **Chi phí live đúng thiết kế:** setup/startPlaying 0 dòng thêm (setup <5 s); P6-wait 18 dòng/86n2-run. Tổng HB128 live: 84l10: 6 dòng (WebKit) / 5 dòng (Chromium); 85m4: 19 dòng; 86n2: 39 dòng (WebKit) / 39 dòng (Chromium).
- **B2 VÙNG MỚI SẠCH LẦN 4** — chưa bắt kẹt thật ở vùng mới (setup/startPlaying/P6-wait). **B1: không bắt kẹt đợt này (không có kẹt để bắt) — chuỗi live sạch đề xuất KHỞI ĐỘNG LẠI lần 1** (188 bắt kẹt thật đầu tiên, DỪNG ở 5; tiền lệ chuỗi tính lại từ 1 sau khi đứt — đợt 179 lượt yên).
- **Replay sau live (2 entry sạch mới, 0 entry kẹt mới):** 189-sach-85m4 19 dòng, max run span 5 s, KHÔNG kích hoạt mọi phương án; 189-sach-86n2-hb128 39 dòng, max run span **85 s** (run_len=18, playhead=30 ct=30), KHÔNG kích hoạt mọi phương án — **P6-wait không gây FP ngay cả trong replay** (biên 35 s).

## C4. Replay V1/V2 sau O8 (replay-1c-189t8.py + replay-f-fix-189t8.py — đã thêm 2 entry `189-*`)

- **(c') V1: replay C5.1 ĐẠT, 0 FP trên 27 log sạch duy nhất theo md5** (29 entry; 2 cặp trùng byte-identical 181/182 — xem dưới). Đợt 189 đóng góp 2 log sạch mới, 0 log kẹt mới.
- **Kẹt theo từng phương án: (c') V0: 164@125 s, 178@125 s, 188@125 s; lỡ 171, 183. (f') V1-300: 164@125 s, 171@305 s, 178@125 s, 188@125 s; lỡ 183. (f'') V2: 164/171/178/183/188 đều @125 s. (f''') V3: 164@125 s, 171@305 s, 178@125 s, 188@125 s; lỡ 183. Kẹt-179 + 180-ket-86n2-std lỡ mọi phương án (0 dòng HB128 / không có run đóng băng — lỗ hổng phủ sóng).**
- **Đánh giá tiêu chí (bắt cả 2 kẹt + 0 FP): V2 ĐẠT** (5/5 kẹt @125 s, FP 0); **V1-300 ĐẠT** (4/5, FP 0) — V1 lỡ 183, V2 bắt được. **GHI CẢ HAI SỐ: V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 27 log sạch duy nhất (md5).**
- **F-184-T8-1: KHÔNG TÁI DIỄN:** 0 NO-FILE trong cả hai lần chạy replay.
- **Số log sạch chuẩn (md5-unique): 17/17/19/21/23/25/27 (183/184/185/186/187/188/189); lịch sử ghi (loại 163) 16/16/18 (183/184/185).** Hai cặp trùng: 181/182-sach-85m4 (md5 `166b271d`) + 181/182-sach-86n2-hb128 (md5 `e11c62cb`) — byte-identical, đã biết từ đợt 187. 0 FP không đổi theo cả hai cách đếm.
- **Biên an toàn (không đổi sau B2):** log sạch max identical-run span **85 s** (run P6-wait — ngưỡng 120 s → biên 35 s). Đây là biên ĐÚNG THIẾT KẾ — không phải FP. Watchdog chỉ kích hoạt sau evaluate im lặng >60 s — tín hiệu ĐỘC LẬP, không vòng tròn.

## C5. Giới hạn B2 (trung thực — B2 không phải toàn năng)

- **B2-4 (offline): P6 seeking-kẹt mà evaluate vẫn trả về (không watchdog) → (c') KHÔNG trigger** (OK maxspan=150 s wd=0). Nguyên nhân: summary seeking=true → (f) chặn; không có WATCHDOG-137 → V2 không miễn (f). Trong thực tế P6 tối đa 90 s nên run dừng ở 85 s < 120 s — B2 cho P6 chỉ cho **bằng chứng + biên 30 s**. Đường bắt kẹt P6 vẫn là watchdog (i) @60 s + V2 via=wd, hoặc timeout 900 s.
- **B2 đã bắt kẹt thật đầu tiên đợt 188 (P5, vùng chung)** — nhưng chưa bắt kẹt thật nào ở vùng mới (setup/startPlaying/P6-wait). Bằng chứng bắt thật ở vùng mới thuộc ca kẹt tới.

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 16 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173)

## D1–D2. Phạm vi + Q3: 84l10 qua 4 điểm kẹt (157 E4 :457; 170 W2 :433; 171 W2-setup :425; 178 W2-setup :443; script `16e5e957` — B2) + ca 188 86n2-P5 (§3 LIMITS T8-188, không phải 84l10); 86n2-P1 theo dõi riêng — **ĐO ĐƯỢC đợt này: WebKit 84l10 PASS (W2+E4), Chromium 84l10 PASS.** Q3 ĐÃ TRIỂN KHAI XONG đợt 173; kiểm lại đợt 189: **không có dữ liệu mới về kẹt 84l10**; hồ sơ 4 điểm kẹt giữ nguyên. **Chuỗi 84l10 PASS: 8 đợt (179, 180, 181, 183, 185, 186, 187, 188) + PASS đợt 189 — có nối qua 2 đợt KHÔNG ĐO ĐƯỢC (182, 184) hay không — parent/T10 quyết (đề xuất 9).** Tần suất kẹt 84l10: 4 ca / 31 đợt ≈ 13% (không đổi).

## D3. Câu hỏi mở (giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Chuyển trạng thái hay vòng poll?** Vẫn mở — đợt này không kẹt, không có dữ liệu mới.
- **Q2 — Lib hệ thống hay engine?** **BẰNG CHỨNG MỚI (heal lần 5):** T0-189 ghi `libevent` vắng lúc survey → có sau replay trên #112; selfcheck T8 #1/#2/#3: libs 6/6 + GST 269 ngay sau replay — củng cố hướng "lib hệ thống quyết định WebKit chạy/không-chạy".
- **Q3 — Trạng thái media lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; KIỂM LẠI ĐỢT 189: không có dữ liệu mới về 84l10 (không kẹt 84l10).**
- **Q4 — Race evaluate/GStreamer?** Vẫn mở — đợt này không kẹt, không có dữ liệu mới.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ năm, ghi call-site + log cuối + RSS + HB128 cuối + đối chiếu Q1; nếu PASS lại, hồ sơ giữ nguyên (4 ca / 31 đợt). Kẹt-183 (85m4 P1): đợt này P1 PASS. **Nợ mới từ đợt 188: kẹt 86n2-P5 lần đầu — nếu P5 kẹt lại, mở điều tra riêng như 84l10 (Q1–Q4 cho P5-phaseB-long); đợt này P5 PASS cả hai engine.**

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 189 (0 KẸT — KHÔNG CÓ BẰNG CHỨNG MỚI)

## B1. Trạng thái giả thuyết sau đợt 189

- **H1 "RAM tuyệt đối thấp gây kẹt": BÁC BỎ (đứng nguyên)** — đợt này 0 kẹt; avail trong lúc harness 1.212–2.691 MB, balloon max 81,1% trần (không ghim 100%).
- **H3 "WebKitGTK treo (deadlock/IPC/GStreamer)": ỦNG HỘ (giữ mức đợt 188)** — đợt này không có ca kẹt mới để củng cố hay bác bỏ; WebKit 3/3 + Chromium 3/3 đều sạch trên cùng boot. H3 vẫn chỉ giám sát thụ động.
- Đợt 189 T8 chỉ giám sát thụ động H3: **0 kẹt trong 3 lần chạy harness WebKit + 0 kẹt trong 3 lần chạy Chromium + 0 kẹt trong 3 lần chạy O8 T8** (O8 T0 PASS 3/3 trên #112). Không mở giả thuyết mới. **Điều kiện mở điều tra H3 theo (j) đợt 179 (86n2 kẹt lại ở P1) KHÔNG ĐẠT — 86n2-P1 PASS, lần thứ 12 nếu tính tiếp (parent quyết).**

# §E — CHECKLIST (o) ĐỢT 189 (quyết (o) đợt 180 + các F-187/F-188 còn lại, gọn)

- o1. F-186-T0-1 (#106 chưa xác minh) — ĐÃ QUYẾT (e) đợt 186: cea79500 = #107; #106 là reboot chưa xác minh (ước ~15:13:32Z).
- o2. Run 189 kết cục thuộc T7-189 (T0-189: run 189 finished btime −842 s, run 190 sched btime +152 s — số thô, T7-189 phán); run 190 kết cục thuộc T7-190.
- o3. F-185-T1-1 (prose §112) — ĐÃ SỬA XONG đợt 186 (T1-186; GAP §112/§114 đã cập nhật).
- o4. F-179-T1-4 (RAM dao động) — GHI NHẬN; avail 1.212–2.691 MB trong harness (T8); balloon max 81,1% trần, pinned=0.
- o5. F-181-T4-2/F-180-T4-2 (check-classb) — GHI NHẬN; T4-189: (p) kiểm chứng live lần 9 ĐẠT (0 file analyzer ghi trong cửa sổ attempt); B2 load1_max 2,94 ĐẠT (dư 1,06); phân bổ tự-tải/lạ-tải DỰ KIẾN THỨ 2 cho quyết tách (cần ≥3).
- o6. F-181-T4-3 (X193) — X193 của T4 VẪN CÒN lúc đóng (X11 1 file — T0-189 F-189-T0-3; T8 extract xác nhận).
- o7. F-181-T5-1 + F-182-T5-1 (watcher overlap) — GHI NHẬN; watcher-189 ALIVE (POSTBOOT_PASS 03:11:11Z, poll=0); T5-189 ĐÃ ĐÓNG CỜ.
- o8. F-181-T5-2 (ledger ts) — GHI NHẬN (T5-189 đã đóng cờ).
- o9. F-180-T5-3 (lệch btime 11 s) — GHI NHẬN; /proc/1 #112 = btime +11 s (stat mtime 1795574010, btime 1795573999 — mẫu tương tự).
- o10. F-174-T5-6 KHÔNG áp dụng — GHI NHẬN (#112 replay-đầy-đủ, poll=0, KHÔNG caveat; #111 repair-sớm-quyết-h, poll=1, CÓ caveat; #108 KHÔNG CÓ cờ — tổng 25).
- o11–o13. F-181-T6-1 + F-180-T6-4 + F-180-T6-5 — GHI NHẬN; T6-189 ĐÃ ĐÓNG CỜ.
- o14–o16. F-181-T7-1 (OUTAGE 8.406 s — T7-188 kết luận: "cố định theo giờ" ĐƯỢC ỦNG HỘ MẠNH, chưa khẳng định tuyệt đối; T7-194 phán cuối) + F-180-T7-4 + F-180-T7-5 — GHI NHẬN; T7-189 CHƯA ĐÓNG CỜ lúc T8 đóng.
- o17. F-185-T8-4 (stat sai marker) — **ĐÃ SỬA (T0-186)** — stat đúng `~/.config/vcut-persistence-marker`; marker 64 reboot (T0-189 XÁC NHẬN #112).
- o18. Quyết (o) 188 (cửa slot LÀNH lần 2; HB 50/531, DR 55/337; OUTAGE #2 — mở điều tra hướng "cố định theo giờ", T7-188 kết luận) — GHI NHẬN; số mới thuộc T7-189: run 189 kết cục + cửa slot đợt 189 (T7-189 chưa đóng).
- o19. Quyết (l) 152 (hạn cờ; marker; gap) — ĐÃ THỰC HIỆN: marker 64 reboot (T0-189 XÁC NHẬN #112); T8 đóng ~03:5xZ, TRONG hạn cờ ~05:00Z (sớm nhờ GATE-FOUND 03:25Z).
- o20. Quyết (j) 188 (B2 bắt kẹt thật live lần đầu; V2 chính thức; H3 giám sát; B1 live sạch DỪNG ở 5; 84l10 chuỗi 8; 86n2-P1 chuỗi 11 — ĐÃ SỬA từ 'lần 10'; F-188-T8-2 giao T8-189 sửa nhãn) — **ĐÃ THỰC HIỆN (§2, §C, §F, §B, §C4)** — B2 vùng mới sạch lần 4; V2 replay 5/5 @125 s, V1-300 4/5; F-188-T8-2 ĐÃ SỬA (nhãn extract động, extract xác nhận "LIMITS 188: 37694").
- o21. F-181-T0-2 + F-182-T0-2 + F-182-T9-3 — GHI NHẬN (thuộc T0-189/T9-189; T9-189 CHƯA ĐÓNG CỜ lúc T8 đóng; T0-189: F-189-T0-1/F-189-T0-2/F-189-T0-3 mới).

# §F — F-178-T8-6 (DIAG W2-SETUP): DỪNG — KHÔNG CHẠY ĐỢT NÀY (QUYẾT (j) ĐỢT 180)

- **Diag W2-setup KHÔNG chạy đợt 189 — DỪNG** (đã PASS 3 lần liên tiếp 179-lần2/180 + 179-lần1 bị #95 giết; ca kẹt setup chưa tái hiện). **Mở lại nếu kẹt setup tái hiện live.** File `clicktest-84l10-webkit-w2setup-hb128.mjs` KHÔNG đổi (md5 `3d41b015`, không chạy). **Đối chứng bản chuẩn cũ 86n2 KHÔNG chạy** (hb128 là chuẩn). **Chi phí B2 giữ nguyên:** 85m4-hb128 38.737 B (VƯỢT giới hạn, dư −969 B); 86n2-hb128 43.653 B (oversize — cần ENABLE_PRIVSEP=0); 84l10 35.917 B (dư 1.851 B).

## 5. Cây + md5 — mở / cuối

- `preview.tsx` 530e10a7; `media.ts` 2c384ed1; `vite.config.ts` ee80d093 (không đổi); `84l10` **16e5e957 (B2, KHÔNG ĐỔI đợt này)**; `85m4-hb128` **3fb2548b (B2, KHÔNG ĐỔI)**; `86n2` **628088bd (backup, không chạy)**; **`86n2-hb128` de925614 (B2, KHÔNG ĐỔI)**; `87o8-webkit` 4994b4fc; `87o8-headed` c8acd72e; `84l10-w2setup-hb128` 3d41b015 (không đổi, không chạy). **T8 KHÔNG đổi file repo đợt này (chỉ LIMITS này + script làm việc trong hidden_files).**
- **Working dir `repo-1/hidden_files/round189-t8/`** — copy `cp -r` 188→189 (exit 0; o8-webkit/o8-chromium loại khỏi copy vì symlink gãy — tạo lại trống; xem F-186-T8-5 — đợt này KHÔNG tái diễn: copy không gặp symlink gãy). **Đổi nhãn đúng** (188t8→189t8, waiter → 04:30Z, LIVE-DIAG/FRESH-CONTENT → 189) — grep: chỉ còn tham chiếu 188 trong khối LOGS của replay (đúng, giữ log đóng băng) + 2 entry `189-*` mới.
- Extract (F-182-T8-6 — ĐÃ KIỂM LIVE đợt 183, dùng lại đợt này): trích ĐÚNG số harness (0/0/0 + 0/0/0) + O8 (webkit 21/21 md5 b6a09a7d/df40bc11, chromium 21/21 md5 ffee4948) + sampler n=31 + WATCHDOG-137: 0. Nhãn "ovsize LIMITS 186" nay ĐÃ SỬA thành động ("LIMITS 188: 37694" — xem F-188-T8-2).
- **F-178-T8-8 (symlink): ĐÃ THỰC HIỆN ĐÚNG LÚC (xem F-186-T8-2).** Cả hai symlink cập nhật → round189-t8 lúc ~02:44Z, TRƯỚC waiter lẫn harness (extract xác nhận lúc đóng). Nợ đã trả: checklist copy driver gồm CẢ HAI symlink NGAY lúc copy.
- **Probe S1: CÓ SẴN TRONG COPY (F-180-T8-5 VẪN KHÉP).** File `o8-s1-probe-189t8.mjs` có mặt sau `cp -r` 188→189 (md5 `453d1082` giống hệt 175–189; `node --check` PASS). O8 T8 chạy với probe này (S1 PASS 6, FAIL 0).
- **F-181-T8-4 (script pilot stale): KHÔNG TÁI DIỄN** (pilot trỏ đúng round189-t8). **F-181-T8-5: ÁP DỤNG CHO #112** (replay-đầy-đủ, poll=0, KHÔNG caveat — khác #111/#107/#101/#98/#96). **F-181-T8-6 (gst-inspect vắng): KHÔNG TÁI DIỄN TRÊN #112** (tools đã cài sau replay — gst-inspect CÓ, 1.624 dòng ở selfcheck #2/#3). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 187 — tổng GIỮ 25 (đã chấp nhận #108 KHÔNG cờ ở §12.3-187). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 6. Dọn dẹp + kiểm cuối — sạch (trên #112, không reboot sau 02:33:19Z)

- Driver harness (pid 320940) đã thoát sau pha cuối (03:41:57Z), Xvfb :199 tự kill + unlink socket (X199 mất lúc đóng). O8 driver đã nhả lock 03:44:45Z. **Không lock stale nào** (vite TRỐNG, 0 ticket + 102 cooldown — extract xác nhận).
- Kiểm cuối ~03:5xZ (trên #112): process Xvfb/MiniBrowser/WebKit/Chromium sót: **0**; lock vite TRỐNG; `/tmp/.X11-unix/` còn **1 file (X193 — của T4, xem F-189-T0-3)**.
- Fixture /tmp: **ĐÃ REBUILD 03:26:21Z (md5 khớp đợt 125)** — vẫn còn lúc đóng (chưa có reboot mới sau đó).
- **Reboot #112 (boot `27e6714f`, btime 02:33:19Z):** xảy ra TRƯỚC khi T8 mở (không giết phiên T8); **0 reboot trong cửa sổ đo (03:26–03:44Z).** dpkg.log 1.461 dòng (ổn định sau replay). #112 XÁC NHẬN 9 nguồn tươi (T0-189); (m) #112 thô 0 requeue (T0-189; T2-189 phán cuối); POSTBOOT_PASS #112 ĐÃ CÓ 03:11:11Z (replay, poll=0, KHÔNG caveat); #108 KHÔNG CÓ cờ — tổng boot không cờ 25.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback); không tự cài apt ngoài watcher T5; không push. **Không probe dpkg ngoài `wc -l`.** Không chạy script nặng khi T4 attempt (T4 attempt1 xong 03:16:42Z, harness chạy SAU GATE-FOUND 03:25:12Z — theo (i)-143).

## 7. Giới hạn — đọc trước khi trích số

1. **HARNESS 6/6 — WebKit 3/3 PASS + Chromium 3/3 PASS (trên #112).** **Kẹt cộng dồn GIỮ 27 — 0 kẹt mới.**
2. **O8 T8 3/3 (WebKit 21/21 md5 b6a09a7d/df40bc11; Chromium 21/21 md5 ffee4948 — trên #112).** O8 T0 PASS 3/3 trên #112 theo cờ T0-189.
3. **Chuỗi WebKit FULL PASS 0 → 1 (ĐỀ XUẤT — CÓ: 5/5 chân cùng boot #112).** Lần đầu kể từ đợt 185. **Parent/T10 quyết cuối.**
4. **POSTBOOT_PASS #112 CÓ 03:11:11Z (replay-đầy-đủ, poll=0, KHÔNG caveat — GST 269, tools đã cài, dpkg 1.461)** — gate (a) #112 ĐẠT. **#108 KHÔNG CÓ cờ** (tổng boot không cờ GIỮ 25). **#112 XÁC NHẬN 9 nguồn tươi (T0-189).**
5. **Balloon max 81,1% trần trong cửa sổ harness (n=31, avail min 1.212 MB, pinned=0)** — KHÔNG ghim trần lần nào; KHÔNG có sampler T9 trong LIMITS này.
6. **85m4-hb128 38.737 B (VƯỢT giới hạn push 969 B) + 86n2-hb128 43.653 B (oversize — cần `ENABLE_PRIVSEP=0`).** 84l10 35.917 B (dư 1.851 B). **LIMITS này DƯỚI giới hạn push (xem stat lúc ghi cờ).**
7. **Chuỗi verdict: 84l10 PASS đợt này (đề xuất chuỗi 9); 86n2-P1 không kẹt đề xuất lần 12; B2 vùng mới sạch lần 4; B1 live sạch đề xuất khởi động lại lần 1; F-188-T8-2 số chuẩn 25 → 27 (md5-unique).** H3 ỦNG HỘ (giữ mức đợt 188 — không có ca mới).
8. **Diag w2setup KHÔNG chạy đợt này (DỪNG theo quyết (j) đợt 180).** Không có bằng chứng diag mới.
9. **V2 (f'') PHƯƠNG ÁN CHÍNH — replay V2 5/5 @125 s, V1-300 4/5, 0 FP cả hai trên 27 log sạch duy nhất (md5).** V1 chỉ còn đối chứng trong replay. Live đợt này 0 trigger (không có kẹt).
10. **T7-189/T9-189 CHƯA ĐÓNG CỜ lúc T8 đóng** (T0/T1/T2/T4/T5/T6 đã đóng). **T4 đóng 03:24Z với lượt yên #58 HỢP LỆ (median 42,0 ms); auto-trigger LIVE khởi động 03:14:10Z, 0 FIRE.**
11. **#112 XÁC NHẬN 9 nguồn tươi (T0-189); marker 64 reboot;** (m) #112 thô 0 requeue (T0-189); (m) #111 DƯƠNG (T2-188); POSTBOOT_PASS #112 CÓ 03:11:11Z.
12. **T8 ĐÓNG ~03:5xZ, TRONG hạn cờ ~05:00Z** (sớm nhờ GATE-FOUND 03:25:12Z + harness 6/6 không pha timeout). 0 reboot trong cửa sổ đo (03:26–03:44Z).

## 8. Sai số mới (F-189-T8-N) + nợ cũ đã xử lý

- **F-189-T8-1 — NHÃN LOG O8 DRIVER VẪN GHI "T8-186" (T8 TỰ BẮT, CHỈ SAI NHÃN — SỐ TRONG LIMITS NÀY ĐÚNG):** `o8-189t8.log` mở đầu `=== T8-186 O8 driver start ...` + `=== T8-186 O8 release lock ...` — nhãn này đi theo script từ đợt 186, các lần đổi tên 187/188/189 đều không sửa. Cùng họ với F-188-T8-2 (nhãn extract chậm một đợt). Không ảnh hưởng số harness/O8/replay (chỉ sai nhãn trong log). Nợ đợt 190: sửa nhãn header o8-driver thành "T8-<đợt hiện tại>" động.
- **F-189-T8-2 — BRIEF T8-189 GHI MỐC 86n2-P1 CŨ (T8 TỰ BẮT, ĐÃ DÙNG MỐC ĐÃ SỬA — SỐ TRONG LIMITS NÀY ĐÚNG):** brief giao "chuỗi 10 → 11 nếu P1 PASS đợt này (đợt 188 P1 PASS...)" — mốc 10 là SAI: parent §12.3-188 (j) đã sửa "lần 10" → 11 (T8-188 dùng mốc cũ 9 từ đợt 186, bỏ qua việc parent (j)-187 đã chấp nhận 9 → 10; §11 aggregate 188 ghi "lần 11?" cho đợt 189 là SAI 1, đúng là 12). T8-189 dùng mốc đã sửa (11 → 12) theo bài học AGENTS.md đợt 188 — khi T8 ghi chuỗi, luôn đối chiếu mốc parent quyết đợt trước, không copy dòng đề xuất của chính mình đợt trước. Nợ đứng: brief các đợt sau cần lấy mốc từ §12.3 mới nhất, không từ LIMITS T8 đợt trước.
- **F-188-T8-1 — KHÔNG TÁI DIỄN DẠNG CŨ** (selfcheck #1 bắt replay ĐANG CÀI — dpkg 309 → 397 → 1.461, apt sống; POSTBOOT_PASS poll=0 sau đó). **F-188-T8-2 — ĐÃ SỬA** (nhãn extract động, extract xác nhận). **F-186-T8-4 — ĐÃ SỬA ĐỢT 187, NHÃN MỚI KHÔNG LỆCH ĐỢT NÀY** (extract "LIMITS 188: 37694" đúng). **F-186-T8-3 — ĐÃ XÁC MINH ĐỢT 187, GIẢ THUYẾT ĐÚNG (số chuẩn 25 → 27 đợt này).** **F-186-T8-1 — KHÔNG TÁI DIỄN DẠNG CŨ** (xem F-188-T8-1: dạng mới đợt 188 là đình trệ hẳn; đợt này replay chạy bình thường). **F-186-T8-2 — KHÔNG TÁI DIỄN** (cả 2 symlink cập nhật ngay lúc copy 02:44Z). **F-186-T8-5 — KHÔNG TÁI DIỄN** (copy 188→189 không gặp symlink gãy). **F-185-T8-4 — ĐÃ SỬA (T0-186).** **F-184-T8-1 — KHÔNG TÁI DIỄN** (0 NO-FILE cả hai replay). **F-183-T8-7 — KIỂM LẠI TRÊN #112: libevent-2.1.so.7 CÓ (selfcheck #1/#2/#3) — MiniBrowser chạy được cả 3 pha WebKit; T0-189 ghi heal lần 5 (vắng lúc survey → có sau replay).**
- **F-183-T8-1 — BẪY LOG STALE: ĐÃ ÁP DỤNG ĐỢT NÀY.** Dọn `smoke/` khỏi bản copy (188 smoke → `smoke/archive-188/`); replay baseline chạy sạch, không parse log stale. Các file stale vẫn nằm trong `smoke/archive-188/` (bằng chứng, không dùng).
- **F-183-T8-3 — CHẠY THỪA DRIVER: KHÔNG TÁI DIỄN.** T8 chỉ chạy `run-webkit-189t8.sh` (cả 6 pha), KHÔNG chạy thêm `run-chromium-*` riêng.
- **F-183-T8-5 — NHÃN "ovsize LIMITS 181": ĐÃ SỬA ĐỢT 184 — NHÃN MỚI ĐÃ SỬA ĐỢT NÀY (xem F-188-T8-2). F-183-T8-8: ĐÃ SỬA ĐỢT 183, KHÔNG TÁI DIỄN. F-183-T8-2 — SOCKET X193 STALE: CHƯA HẾT (X193 của T4 vẫn còn lúc đóng — xem F-189-T0-3). F-183-T8-4 — (c') BỎ LỠ kẹt-183: V2 ĐÃ TRIỂN KHAI (§C); B2 mở phủ sóng sang setup + P6. F-183-T8-6 — ĐÃ GHI NHẬN ĐỢT 183.**
- **F-182-T8-6 — EXTRACT KIỂM LIVE: ĐÃ ĐẠT ĐỢT 183, DÙNG LẠI ĐỢT NÀY (xem §5 — extract chạy SAU O8, số O8 trong LIMITS này là số mới). F-181-T8-1: ĐÃ HẾT (181). F-181-T8-2/3/4: ĐÃ SỬA, KHÔNG TÁI DIỄN** (pilot trỏ đúng round189-t8; T8-3 ĐÃ KIỂM LIVE Ở 183 — ĐÓNG). **F-181-T8-7: ĐÃ QUYẾT (c) đợt 187 — tổng GIỮ 25 (đã chấp nhận #108 KHÔNG cờ ở §12.3-187). F-181-T8-8 (log stale): VẪN CÒN — F-184-T8-1 là biểu hiện mới nhất (đợt này KHÔNG tái diễn).**

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS 0 → 1 (ĐỀ XUẤT — CÓ: 5/5 chân cùng boot #112)** — parent/T10 quyết (gate (a), O8 T0, O8 T8, lượt yên #58, harness 6/6 — lần đầu kể từ đợt 185).
2. **B2 vùng mới sạch lần 4; B1 live sạch đề xuất khởi động lại lần 1** — parent ghi nhận (giới hạn §C5 đã ghi rõ).
3. **Chuỗi 84l10 PASS 8 → 9 (đề xuất) + chuỗi 86n2-P1 không kẹt 11 → 12 (đề xuất)** — parent/T10 quyết (cả hai đều nối qua đợt 184 không đo được theo quyết (j) đợt 186; mốc 86n2-P1 đã sửa theo §12.3-188 (j)).
4. **F-188-T8-2 số chuẩn 25 → 27 (md5-unique)** — parent ghi nhận, không còn nợ.
5. **Reboot #112 (27e6714f, btime 02:33:19Z, gap #111→#112 = 12.155 s)** — XÁC NHẬN 9 nguồn tươi (T0-189); (m) #112 thô 0 requeue (T2-189 phán cuối); (m) #111 DƯƠNG (T2-188); POSTBOOT_PASS #112 ĐÃ CÓ 03:11:11Z (replay, poll=0, KHÔNG caveat); #108 KHÔNG CÓ cờ — tổng boot không cờ 25.
6. **F-189-T8-1 (nhãn log O8 driver "T8-186" lỗi thời) + F-189-T8-2 (brief ghi mốc 86n2-P1 cũ)** — parent ghi nhận; không đổi verdict. Nợ đợt 190: sửa nhãn o8-driver động; brief lấy mốc từ §12.3 mới nhất.
7. **Lượt yên #58 CÓ LƯỢT HỢP LỆ (median 42,0 ms)** — T4-189 chi tiết; chuỗi lượt yên 0 → 1 (đề xuất); kiểm chứng live lần 9 ĐẠT (chuỗi 7 → 8 đề xuất); auto-trigger LIVE khởi động 03:14:10Z, 0 FIRE (T9-189 phán cuối).
8. **Kẹt 86n2-P5 đợt 188 (kẹt #27) — đợt này P5 PASS cả hai engine** — nợ đợt sau: nếu P5 kẹt lại, mở điều tra riêng như 84l10 (Q1–Q4 cho P5-phaseB-long); H3 ủng hộ (giữ mức đợt 188).
9. Mở từ trước, vẫn đứng: **#112 KHÔNG GIẾT HOLDER (T6-189 đã đóng — xem LIMITS T6); (A) 120/120 (T6-189); (m) #103 DƯƠNG +37,543 s (parent 185 quyết cuối); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck, T2-189); (m) #56 (T2-189); G1 chờ user; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần chạy (T9-189 chưa đóng); R9 (a); file oversize 6,4 MB chưa quyết; u2net là fallback chính thức; fixture /tmp đã rebuild đợt này; KHÔNG PUSH — 220 batch / 338 entry / 307 đường dẫn / 303 file chờ user push (166–187) + batch đợt 188/189 (T10 đếm cuối).**
10. **F-189-T0-1 (boot #112 rơi vào cửa sổ đóng sổ đợt 188) + F-189-T0-2 (dấu chênh Cloudflare ở T0-188 bị đảo) + F-189-T0-3 (socket X193 của T4 còn sót)** — thuộc T0/T4 (T8 chỉ ghi nhận; X193 vẫn còn lúc T8 đóng).
