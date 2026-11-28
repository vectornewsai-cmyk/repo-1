# LIMITS — Phase 9 đợt 192, T9: headroom + RAM + birefnet (6 lần đo toàn 0, 2 boot; reboot giữa đợt 16:21:33Z; balloon 0 CEIL nhưng suýt ghim 2 boot; ENOSPC #115 94 + #116 30; auto-trigger live 130 mẫu, 0 FIRE — tổng live 352 mẫu; lượt yên #60 0/3 hợp lệ — live-check #11 KHÔNG THỂ KIỂM)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (6 lần đo: 0, 0, 0, 0, 0, 0; trần 63.737)** — dưới ngưỡng < ~1.800 **lần thứ 51 liên tiếp**. Quyết "chỉ theo dõi" đứng (parent (l) §12.3-189: lần 49).
- **Trần inotify KHÔNG ĐỔI trong đợt (63.737 cả 6 lần đo, 2 boot)** — đứng yên sau khi giảm −10 ở đợt 189 (F-189-T9-1).
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** (130 mẫu chính + 130 live) — guard KHÔNG mở lại. **0 lần chạy birefnet — lần thứ 45 liên tiếp** (147–192). Xem §3.
- **Auto-trigger: LIVE 130 mẫu đợt này, tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **352 mẫu (97 đợt 189 + 125 đợt 191 + 130 đợt 192), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA (điểm yếu (b) đứng). Khoảng mù live: giữa đợt ~3h52m (10:50:05Z → 14:42:29Z) + 2m50s do reboot (16:21:30Z → 16:24:20Z). Xem §3.
- **CỬA SỔ THOÁNG: CẢ HAI BOOT ĐỀU KHÔNG QUAN SÁT ĐƯỢC.** #115: cửa 14:24:57–14:25:28Z đóng trước khi T9 mở phiên. #116: cửa 16:22:34–16:23:05Z đóng ~28 s trước khi T9 xác nhận được btime (16:23:33Z) — suýt bắt được sau khi phát hiện reboot 16:22:41Z nhưng chưa biết btime chính xác lúc đó.
- **Balloon: 0 EPISODE MỚI trên cả 2 boot (0 mẫu CEIL trong 130 mẫu chính + 130 live).** Max **6.234.424 kB** (live, 16:03:30Z #115 — chỉ thiếu 209.400 kB là tới trần); 8 mẫu chính ≥6,0M (5 #115 + 3 #116). **Balloon = 0: 0 lần** (lần 0 đầu tiên đợt 191 KHÔNG lặp lại). Sàn 6.050.608 kB: **0 lần** (chuỗi GIỮ 11). Giá trị sag 6.247.216 kB: **0 lần** (tổng giữ 3).
- **E-247: KHÔNG CÓ episode ghim mới để theo dõi** (0 mẫu CEIL cả 2 boot) — kết cục KHÔNG XÁC ĐỊNH ĐƯỢC (quyết (h) §14.2-191) đứng nguyên, không mở lại.
- **RAM: 130 mẫu, 14:42:08–16:53:21Z, HAI boot (#115 n=100, #116 n=30).** Max **5.055.828 kB**; min **293.756 kB** (mẫu <300k đầu tiên kể từ đợt 190); mean 1.675.271,3 kB; gate A **78/130**. **1 reboot giữa đợt 16:21:33Z** (gap sampler 183 s); các gap còn lại ≤61 s.
- **Lượt yên #60 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt** (attempt1 lớp B vi phạm + median 96,0 ms; attempt2 exit=3 partial + B5 vi phạm; attempt3 median 63,0 ms > 60) — chuỗi 2 → 0 (ĐỨT, đề xuất; parent quyết). **Kiểm chứng live lần 11: KHÔNG THỂ KIỂM** (không có cửa sổ attempt hợp lệ để đối chiếu) — chuỗi live ĐẠT GIỮ 9 (đề xuất; tiền lệ đợt 188).
- **B2: 512 spike THẬT (505 #115 + 7 #116)** — tải đợt này nặng và kéo dài (351 spike chỉ trong 15:xx); 22 spike trong attempt1 (load1max 6,09 — KHỚP đúng số T4 ghi), 0 spike trong attempt2, 4 spike trong attempt3; load1 đỉnh watcher **11,28**. Xem §2.5.
- **ENOSPC: #115 = 94 dòng (đếm trực tiếp lúc 16:12:05Z — cận dưới, journal mất sau reboot); #116 = 30 dòng lúc 16:57:40Z (vẫn tăng).** **Chuỗi đợt có lỗi thật 39 → 40.** Xem §4.
- **REBOOT GIỮA ĐỢT (F-192-T9-1):** #115 chết 16:21:33Z (sống 7.057 s), #116 sinh ra; giết check-4 nền (SIGTERM) + cả 4 daemon T9 giữa chừng — T9 khởi động lại 3 daemon + probe tay trên boot mới, không mất phiên. **Gate-check trong probe-loop ĐÃ CHẠY ĐÚNG lần đầu (F-192-T9-2):** lan-4r chờ attempt2 xong mới probe.
- **0 VI PHẠM phía T9. T9 đóng 16:53:26Z (kill daemon), TRONG hạn cờ ~17:00Z.** Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–191 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). MỚI đợt này: **gate-check trong probe-loop.sh** (bài học F-191-T10-2) — trước mỗi probe, kiểm marker-t4-* cùng boot8 chưa có attempt-done, mtime ≤600 s; nếu gate xanh thì chờ 60 s/lần, tối đa 20 phút, quá hạn BỎ probe (xem F-192-T9-2).

### 1.2 Số đo đợt 192 (6 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 14:42:29Z | **0** | #115 ebc5a3b9 | 63.737 | probe-loop open-192 (boot+18m33s) |
| 15:12:30Z | **0** | #115 | 63.737 | probe-loop lan-2r (boot+48m34s) |
| 15:42:30Z | **0** | #115 | 63.737 | probe-loop lan-3r (boot+1h18m34s) |
| 16:13:31Z | **0** | #115 | 63.737 | probe-loop lan-4r — SAU KHI CHỜ GATE (xem dưới) |
| 16:24:20Z | **0** | #116 4dda8234 | 63.737 | probe tay postboot-192 (boot+167s) |
| 16:52:48Z | **0** | #116 | 63.737 | probe tay close-192 (boot+31m15s) |

- **CỬA SỔ THOÁNG #115: KHÔNG QUAN SÁT ĐƯỢC.** Boot btime 14:23:56Z (T01-192 xác minh 9 nguồn tươi); cửa sổ boot+61–92s = 14:24:57–14:25:28Z đã đóng ~15 phút trước khi T9 mở phiên (~14:40Z). Như #112 đợt 189, #114 đợt 191.
- **CỬA SỔ THOÁNG #116: KHÔNG QUAN SÁT ĐƯỢC — SUÝT BẮT ĐƯỢC.** Boot btime 16:21:33Z (T01-192 xác minh 9 nguồn tươi lúc 16:22:46Z); cửa sổ = 16:22:34–16:23:05Z. T9 phát hiện reboot lúc 16:22:41Z (uptime 1 phút) nhưng chỉ xác nhận được btime lúc 16:23:33Z — cửa đã đóng ~28 s trước đó. Probe đầu trên boot mới lúc 16:24:20Z (boot+167s) đã ngoài cửa. Lần suýt soát nhất kể từ đợt 189 (đo được 1 điểm boot+78s).
- **Headroom cuối phiên: 0.** Dãy 6 lần đo toàn 0 — lần thứ hai liên tiếp toàn 0 cả phiên (đợt 191 cũng toàn 0). **Trần KHÔNG ĐỔI trong đợt (63.737 cả 6 lần đo, 2 boot).**
- **Probe-loop gốc chết theo reboot** (đã chạy open→lan-4r; lan-5r ~16:43Z không còn ý nghĩa sau khi đổi boot) — T9 KHÔNG khởi động lại probe-loop mà probe tay 2 lần trên boot mới (postboot + close). Xem F-192-T9-1.

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt gần nhất: 186 đóng 0 (7 lần 0); 187 đóng 0 (7 lần 0); 188 đóng 0 (6 lần 0); 189 đóng 0 (7 lần đo: 5 lần 0 + 1 lần 1 + 1 lần 2); 191 đóng 0 (6 lần đo: toàn 0); **192 đóng 0 (6 lần đo: toàn 0)**. (Đợt 190 VOID — không có đo.)

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 0.** Đợt này không có sự kiện mở 30.000 nào (lần mở gần nhất: đợt 185).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 51 liên tiếp.** Quyết parent (l) §12.3-189 GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Dữ kiện mới: ENOSPC tăng đều cả 2 boot (§4) + balloon suýt ghim cả 2 boot (§2.2) — cùng hướng: watch ngoài cell vẫn chiếm gần hết trần, không có dấu hiệu giải phóng bền.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 130 mẫu, 14:42:08–16:53:21Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 183 s** (reboot 16:21:33Z — xem §5.1); các gap còn lại **≤61 s** (jitter bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 14:42:08–14:56:09Z | #115 | 2.881.568–5.055.828 kB | Mở sampler; balloon xả 5,66M → 0,77M; **O8 T01 14:57:20–15:01:08Z** (đầu giai đoạn sau) |
| 14:57:10–15:14:12Z | #115 | 1.434.500–3.781.388 kB | **O8 T01** (gate A 3/3, load1 5,44–8,2); balloon leo lại 2,6M → 4,3M |
| 15:15:12–15:47:16Z | #115 | 547.088–2.923.028 kB | **Attempt1 T4 15:15:22–15:20:19Z** (gate A 4/5); balloon ≥6,0M lần đầu 15:48:16Z (cuối giai đoạn) |
| 15:48:16–16:07:16Z | #115 | 308.236–1.835.000 kB | Balloon ≥6,0M (5 mẫu); **RAM <512.000 kB: 6 mẫu**; min #115 308.236 kB 16:03:16Z |
| 16:08:17–16:21:17Z | #115 | 688.096–2.349.000 kB | **Attempt2 16:08:51–16:13:59Z** (gate A 1/5 — RAM siết) + **attempt3 16:13:59–16:18:10Z** (gate A 4/4); mẫu cuối #115 16:21:17Z |
| 16:21:33Z | — | — | **REBOOT → #116** (sampler chết; gap 183 s) |
| 16:24:20–16:53:21Z | #116 | 293.756–1.646.920 kB | Boot mới: balloon đã 5,09M từ mẫu đầu; ≥6,0M từ 16:40:20Z (3 mẫu); **RAM <512.000 kB: 7 mẫu**; min phiên 293.756 kB 16:42:20Z |

- **Gate A ≥1024 MiB: 78/130 mẫu** (71/100 #115; 7/30 #116); **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **10,72** (#115 — trong O8/harness; #116: 3,20); load1 <4,0: **99/130 mẫu chính (76,2%)** — đợt 191 là 111/125 (88,8%), đợt này tải nặng hơn hẳn; **RAM <512.000 kB: 13 mẫu** (10,0%); **RAM <300.000 kB: 1 mẫu** (16:42:20Z #116, 293.756 kB — mẫu <300k đầu tiên kể từ đợt 190; đợt 191: 0 mẫu).
- Swap: #115 SwapFree 745.892 kB (mẫu đầu) → 567.768 kB (mẫu cuối) — giảm **178.124 kB**; #116 SwapFree 918.444 kB (mẫu đầu, boot tươi) → 605.408 kB (mẫu cuối) — giảm **313.036 kB chỉ trong 29 phút** (xả swap nhanh trên boot mới — xem F-192-T9-5).
- Trũng RAM đợt này: min **293.756 kB (16:42:20Z, #116, balloon 6.171.056 — suýt ghim)** — sâu hơn min 338.008 kB đợt 191. 13 mẫu <512.000 kB, 6 dải: 15:49:16Z (1); 15:54:16Z (1); 16:01:16–16:04:16Z (4); 16:38:20–16:42:20Z (5); 16:51:21Z (1); 16:53:21Z (1). Tổng 1+1+4+5+1+1 = 13 — KHỚP số đếm toàn phiên.

**Bảng tổng hợp số RAM (từ script `t9-192-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 130 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #115 ebc5a3b9 | 100 | 308.236 | 5.055.828 | 1.937.975,4 | 71/100 | 0 | 10,72 | 6 |
| #116 4dda8234 | 30 | 293.756 | 1.646.920 | 799.590,8 | 7/30 | 0 | 3,20 | 7 |
| **Toàn phiên** | **130** | **293.756** | **5.055.828** | **1.675.271,3** | **78/130** | **0/130 (0%)** | **10,72** | **13** |

- **Mean toàn phiên 1.675.271,3 kB — 2 cách độc lập: python `sum/n = 1.675.271,3` VÀ kiểm có trọng số của script (in `t9-192-analyze-output.txt`) — KHỚP CẢ HAI.** Mean thấp hơn đợt 191 (1.832.896,7 kB) vì #116 (30 mẫu) siết chặt suốt (mean chỉ 799.590,8 kB).

### 2.2 Balloon virtio — 0 EPISODE MỚI trên cả 2 boot; suýt ghim cả 2 boot

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH** (mốc các đợt trước; đợt này balloon max 6.234.424, chưa chạm trần nên trần không được xác nhận lại từ dữ liệu đợt này — giữ mốc cũ).
- **Boot #115: GHIM 0/100 mẫu (0%) — KHÔNG CÓ episode nào. Boot #116: GHIM 0/30 mẫu (0%).** Lần thứ hai liên tiếp một đợt có 0 mẫu ghim (đợt 191: 0/125 trên #114).
- **Suýt ghim #115:** balloon leo từ 15:48:16Z (6.006.612); **5 mẫu ≥6,0M** (15:48:16Z, 15:49:16Z, 16:01:16Z, 16:02:16Z, 16:03:16Z); max chính **6.200.804 (16:03:16Z)**; live sampler bắt được cao hơn: **6.234.424 (16:03:30Z, avail 298.084 kB) — chỉ thiếu 209.400 kB = 3,2% trần**, là lần suýt ghim sát nhất đợt này. Sau đó balloon hạ về 4,6–5,3M — KHÔNG chạm trần, không hình thành episode.
- **Suýt ghim #116:** balloon đã **5.092.088 kB ngay mẫu đầu (16:24:20Z, boot+167s)**; **3 mẫu ≥6,0M** (16:40:20Z 6.041.824; 16:41:20Z 6.109.568; 16:42:20Z 6.171.056 — cùng mẫu với min RAM phiên 293.756 kB); sau đó hạ về 5,86–5,94M — KHÔNG chạm trần. Boot mới balloon lên nhanh (xem F-192-T9-5).
- **Balloon = 0: 0 lần đợt này** (đợt 191 ghi 0 lần đầu — KHÔNG lặp lại đợt này). Balloon min đợt này: 765.016 kB (14:44:08Z #115).
- **Sàn balloon 6.050.608 kB: 0 lần đợt này — CHUỖI GIỮ 11** (đợt 188: 1 lần, lần 11; đợt 189/191/192: 0 lần).
- **Giá trị sag 6.247.216 kB: 0 lần đợt này** (tổng giữ 3: đợt 187: 2 lần; đợt 188: 1 lần).
- **E-247 — KHÔNG CÓ GÌ MỚI ĐỂ THEO DÕI.** 0 mẫu CEIL trên cả 2 boot nên không có episode ghim mới nào; kết cục KHÔNG XÁC ĐỊNH ĐƯỢC (quyết (h) §14.2-191) đứng nguyên. T9 KHÔNG mở lại kết cục đã quyết, đúng nhiệm vụ "chỉ theo dõi".

### 2.3 Lượt yên WebKit #60 (T4) — KHÔNG CÓ LƯỢT HỢP LỆ, 0/3 attempt (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#60 KHÔNG CÓ LƯỢT HỢP LỆ — T4 dùng hết 3/3 attempt, 0 hợp lệ.** Chuỗi lượt yên hợp lệ: **2 → 0 (ĐỨT, T4 đề xuất, parent quyết cuối)** — #58 hợp lệ (0→1, (m)-189), #59 hợp lệ (1→2, (m)-191), #60 không có lượt hợp lệ.
- **Attempt1 (15:15:22–15:20:19Z): 20/20 NHƯNG LỚP B VI PHẠM + tickCost median 96,0 ms — KHÔNG hợp lệ.** T4 ghi B2 VI PHẠM, load1_max 6,09. **T9 đối chiếu độc lập: 22 spike B2 trong cửa sổ, load1max watcher 6,09 — KHỚP ĐÚNG số T4** (xem §2.5); sampler T9 trong cửa sổ n=5, gate A 4/5, load1 1,59–4,74 (mẫu 15:17:12Z avail 716.348 kB dưới gate).
- **Attempt2 (16:08:51–16:13:59Z): exit=3 partial (wedged/timeout) + B5 VI PHẠM + tickCost median 64,0 ms — KHÔNG tính verdict.** T9 đối chiếu: **0 spike B2** trong cửa sổ; sampler n=5, gate A **1/5** (avail 688.096–1.171.412 kB — RAM siết suốt cửa sổ), load1 0,43–1,73.
- **Attempt3 (16:13:59–16:18:10Z): 20/20 + LỚP B ĐẠT 5/5 NHƯNG tickCost median 63,0 ms > 60 (thiếu 3,0 ms) — KHÔNG hợp lệ.** T9 đối chiếu: **4 spike B2** trong cửa sổ (load1max 3,31); sampler n=4, gate A 4/4, load1 0,91–3,18.
- **Kiểm chứng live lần 11: KHÔNG THỂ KIỂM** (T9 đề xuất; parent quyết cuối) — không có cửa sổ attempt hợp lệ nào để đối chiếu 0-spike/0-FIRE; live autotrigger chạy suốt cả 3 cửa sổ attempt, 0 FIRE trong cả 3. **Chuỗi live ĐẠT GIỮ 9** (tiền lệ đợt 188: T4 0 attempt → live lần 8 KHÔNG THỂ KIỂM, chuỗi GIỮ 7).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T01/T4 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 14:57:20–15:01:08Z | #115 | 5,44–8,20 (3 mẫu) | 2.885.756–2.939.548 kB — **gate A 3/3** | **O8 T01 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); **45 spike B2**; 0 mẫu ghim |
| T4 attempt1 15:15:22–15:20:19Z | #115 | 1,59–4,74 (5 mẫu) | 716.348–2.923.028 kB — **gate A 4/5** | **22 spike B2** (load1max 6,09 — khớp T4); lớp B vi phạm; 0 mẫu ghim |
| T4 attempt2 16:08:51–16:13:59Z | #115 | 0,43–1,73 (5 mẫu) | 688.096–1.171.412 kB — **gate A 1/5** | **0 spike B2**; exit=3 partial; 0 mẫu ghim |
| T4 attempt3 16:13:59–16:18:10Z | #115 | 0,91–3,18 (4 mẫu) | 1.834.052–2.300.540 kB — **gate A 4/4** | **4 spike B2**; median 63,0 ms > 60; 0 mẫu ghim |

- T01-192: **#115 XÁC NHẬN 9 nguồn TƯƠI** (btime 14:23:56Z, gap #114→#115 = 21.493 s — dài nhất chuỗi gần đây); **#116 XÁC NHẬN 9 nguồn TƯƠI** (btime 16:21:33Z, gap 7.057 s); O8 PASS 3/3 trên #115; **POSTBOOT_PASS #115 CÓ 14:55:05Z** (repair-sớm-quyết-h, poll=1, dpkg 768 — mode/caveat thuộc T56-192 + parent); **POSTBOOT_PASS #116 CHƯA CÓ** (T56-192 làm lại); marker sống qua **67 reboot #49–#115** (68 nếu #116); **(m) #116 THÔ +43,986 s** (requeue run 193 eid 11103, TRONG [33; 49,8] — T2-192 phân loại CUỐI); run 192 FAILED 10:56:00Z (không phải timeout — kết cục thuộc T7-192).
- T01-192 đếm TẠM (16:23–16:25Z, T4/T7/T8/T9 chưa stage): đợt 192 = **6/27/24/13**; lũy kế 111–192 = 796/1.421/1.228/1.039; chờ push (191+192, TẠM) = 18/72/57/44; chuỗi khớp lần thứ 117. **T10-192 chạy lại hai phương pháp sau closing và chốt số cuối (cộng batch T01 + T4 + T7 + T8 + T9 + closing).**

### 2.5 B2 — 512 spike THẬT; 22 spike trong attempt1 (khớp T4); 0 spike trong attempt2

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **512 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 512): 505 trên #115 + 7 trên #116**; **load1 đỉnh đợt (watcher, cadence 2 s): 11,28** (cao hơn load1 max sampler 10,72 vì cadence 2 s bắt được đỉnh ngắn; đợt 191: 12,01).

| Nhóm (comm đứng đầu) | n | Ghi chú |
|---|---|---|
| ps | 185 | Lệnh shell ngắn — watcher tự bắt chính mình (xem F-192-T9-4) |
| chrome | 106 | Tải trình duyệt (O8/harness + luồng sản phẩm) |
| hatch | 81 | Tải nền tảng (cùng mẫu các đợt trước) |
| MainThread | 62 | comm `MainThread`, chưa xác định chắc là tiến trình nào (ghi theo comm) |
| WebKitWebProces | 28 | Harness/O8 WebKit + attempt T4 |
| find | 25 | Lệnh shell ngắn (xem F-192-T9-4) |
| ffmpeg | 9 | Luồng sản phẩm (render/proxy) |
| apt-get | 7 | Repair POSTBOOT (apt-get update + install ~14:55Z) |
| grep | 4 | Lệnh shell ngắn (xem F-192-T9-4) |
| privsep-test-fu | 2 | Lẻ tẻ |
| python3 / bash | 2 + 1 | Lẻ tẻ |

Tổng 185+106+81+62+28+25+9+7+4+2+2+1 = 512 — KHỚP. Phân theo giờ: 14:xx 140 spike; 15:xx **351 spike**; 16:xx 21 spike. Spike đầu 14:42:29Z (load1 4,09 — ngay mẫu mở phiên); spike cuối 16:25:20Z (load1 3,20 — trên #116).

- **22 spike trong attempt1** (15:15:22–15:20:19Z — WebKitWebProces 11, ps 9, hatch 2; load1max 6,09); **0 spike trong attempt2** (16:08:51–16:13:59Z); **4 spike trong attempt3** (16:13:59–16:18:10Z — WebKitWebProces 3, ps 1; load1max 3,31). **45 spike trong O8 T01** (14:57:20–15:01:08Z — ps 24, WebKitWebProces 14, chrome 3; load1max 9,32). Ngoài các cửa sổ trên: 441 spike (chủ yếu 15:xx lúc tải sản phẩm nặng kéo dài + 14:4x lúc mở phiên).
- **Khoảng mù watcher: ~3 phút do reboot** (16:21:3x–16:24:2xZ — watcher chết theo reboot, 0 spike ghi trong gap vì KHÔNG CÓ watcher, không phải vì máy yên; xem F-192-T9-1). Ngoài gap đó watcher chạy liên tục, không reboot trong phiên đo của nó.

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-191; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 5.156.992 kB (live, #115); live log max 1.645.976 kB trên #116. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 45 liên tiếp (147–192).**
- **QUYẾT (o) §14.2-191: AUTO-TRIGGER GIỮ LIVE.** Parent kiểm độc lập lần thứ 115 (dedup python + kiểm chéo shell viết mới, KHỚP TỪNG SỐ; nguồn gốc §14.2-191 SẠCH — lần sạch thứ ba kể từ đợt 179). Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-192:** live đã bật từ đợt 189 nên đợt này là TIẾP TỤC, không flip mới — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 191 §14.2 (o) (81.567 B); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189/191; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 191 (copy nguyên; test offline 17/17 PASS đợt 188, không chạy lại — code không đổi). Khởi động 14:42:29Z (pid 6581, `dry_run=False guard=6291456 consec=2`); **khởi động LẠI 16:24:20Z (pid 31357) sau reboot** — cùng lệnh, cùng tham số.
- **LIVE PHASE ĐỢT 192: 130 mẫu, 14:42:29–16:53:20Z (100 #115 + 30 #116), TẤT CẢ `trigger=watch consec=0`, max avail 5.156.992 kB (#115) / 1.645.976 kB (#116), load1 <4,0: 99/130 (76,2%) — #115 69/100, #116 30/30 — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `autotrigger-live/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Mẫu live đầu 14:42:29Z; live chạy suốt cả 3 cửa sổ attempt T4, 0 FIRE trong cả 3.
- **TỔNG LIVE TỪ 03:14Z 25/11: 352 mẫu (97 đợt 189 + 125 đợt 191 + 130 đợt 192), 0 FIRE.** Khoảng mù live: **(a) giữa đợt ~3h52m** (10:50:05Z → 14:42:29Z — live đợt 191 bị kill lúc T9-191 đóng sổ; không có mẫu live nào; cũng không thể có FIRE vì không có tiến trình live nào để fire); **(b) do reboot 2m50s** (16:21:30Z → 16:24:20Z — live chết theo reboot, khởi động lại ngay khi T9 phát hiện). Trong cả hai khoảng mù, guard có mở hay không là KHÔNG BIẾT (không sampler nào chạy) — nhưng cũng không thể có FIRE (không có tiến trình live nào để fire; không có file trigger/flag nào trên đĩa từ các khoảng đó).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) sampler cũ không có code trigger — nay đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 352 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 45 đợt) — live đã bật nhưng guard chưa mở lần nào kể từ khi bật.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 191); không có thư mục `~/workspace/tmp-t9-192-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round192-t9/` (live chạy 130 mẫu, 0 sự kiện).

## 4. ENOSPC trong journal (đếm trực tiếp — CẢ 2 BOOT ĐỀU TĂNG, #115 mất journal sau reboot)

- **#115: đếm trực tiếp 94 dòng (lần đếm cuối trước reboot 16:12:05Z)** — dòng đầu **14:25:45Z (boot+109s)** — đúng mẫu ~110s các boot trước (#114: +674s là ngoại lệ muộn; #111: +117s; #110: +106s); dòng cuối lúc đếm **16:12:05Z**. Cả hai grep đều 94 lúc đó — KHỚP. **94 là CẬN DƯỚI** (journal mất sau reboot 16:21:33Z — `journalctl --list-boots` sau reboot chỉ còn boot #116; không đếm lại được #115). Ngoại suy theo nhịp đo được (~0,87 dòng/phút × ~9 phút từ 16:12Z tới reboot): **~102 dòng lúc reboot — GHI RÕ LÀ ƯỚC TÍNH, không phải số đếm** (phương pháp chuẩn điểm (5)).
- **Đếm giữa phiên #115 (bài học F-187-T9-5 — đếm ở MỖI lần kiểm):** 14 dòng lúc ~14:40Z → 41 lúc 15:12:14Z → 67 lúc 15:42:14Z → **94 lúc 16:12:14Z (VẪN TĂNG)**. Nhịp đều ~0,87 dòng/phút cả phiên — **KHÔNG dừng giữa boot** (như #114 đợt 191).
- **#116: đếm trực tiếp 30 dòng lúc 16:57:40Z** — dòng đầu **16:23:19Z (boot+106s)** — về lại mẫu ~110s; dòng cuối **16:57:17Z**. Cả hai grep đều 30 — KHỚP. Vẫn tăng lúc đóng (26 lúc 16:53:26Z → 30 lúc 16:57:40Z).
- **Tổng phiên (2 boot, đếm trực tiếp): 94 + 30 = 124 dòng (94 là cận dưới).** **Chuỗi đợt có lỗi thật: 39 → 40** (cả 2 boot đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-192 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#115: 94=94; #116: 30=30 — KHỚP cả hai); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (#115 ~102 — ước tính, xem trên); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai boot trong phiên (T9 bắt trực tiếp: 1 reboot; 2 boot đợt này)

- **#115 (ebc5a3b9-230f-4ea5-926f-c3a62c96fbf5, btime 14:23:56Z; số hiệu ỨNG VIÊN — T01-192 XÁC MINH 9 nguồn TƯƠI; parent quyết (e) ở §14.2-192).** Sampler T9 trên #115: 14:42:08–16:21:17Z (100 mẫu). Gap #114→#115 = **21.493 s (5h58m13s)** — dài nhất chuỗi gần đây (T01-192). #115 sống **7.057 s (1h57m37s)** rồi chết 16:21:33Z.
- **#116 (4dda8234-2f0f-4414-8a51-25ab2e7e5d6a, btime 16:21:33Z; số hiệu ỨNG VIÊN — T01-192 XÁC MINH 9 nguồn TƯƠI lúc 16:22:46Z; parent quyết (e)).** Sampler T9 trên #116: 16:24:20–16:53:21Z (30 mẫu). Gap #115→#116 = **7.057 s**. **(m) #116 THÔ +43,986 s** (requeue run 193 eid 11103, TRONG [33; 49,8] — T2-192 phân loại CUỐI; T01-192 F-192-T01-9).
- **Marker:** T01-192 đếm sống qua **67 reboot #49–#115** (68 nếu #116 — mtime không đổi).
- **Khoảng mù giữa hai đợt: ~3h52m không sampler T9** (10:50:05Z → 14:42:08Z — chứa reboot #115 + cửa sổ thoáng #115 + toàn bộ khoảng mù live giữa đợt). **Khoảng mù trong phiên do reboot: 183 s sampler chính / 170 s live / ~3 phút B2 watcher** (16:21:17Z → 16:24:20Z).

### 5.2 Các luồng khác — P1–P4/T01/T2/T4/T56/T7 đã đóng; T8 chưa đóng; T10 do lượt cron 00:35 +07 spawn

- T01-192 ĐÃ đóng: #115/#116 XÁC NHẬN 9 nguồn TƯƠI; O8 PASS 3/3; (m) #116 THÔ +43,986 s; đếm TẠM 6/27/24/13, chuỗi khớp 117. T2-192 ĐÃ đóng: xem LIMITS T2 (T9 không phán thay T2). T4-192 ĐÃ đóng: #60 KHÔNG CÓ LƯỢT HỢP LỆ (0/3 attempt — xem §2.3). T56-192 ĐÃ đóng: xem LIMITS T56 (POSTBOOT_PASS #115 repair-sớm-quyết-h poll=1; #116 CHƯA CÓ). T7-192 ĐÃ đóng: xem LIMITS T7 (kết cục run 192 FAILED + run 193).
- T8-192 CHƯA đóng lúc T9 đóng (16:53Z): không có LIMITS T8 / cờ .done — harness + O8 bộ thứ hai + FULL PASS đợt 192 thuộc T8/T10 + parent. T10-192 do lượt cron 00:35 +07 spawn để đóng sổ — §14.2-192 thuộc lượt sau.

## 6. Sai số / caveat (F-192-T9-*)

- **F-192-T9-1 — REBOOT GIỮA ĐỢT 16:21:33Z GIẾT CẢ PHIÊN T9 (lần đầu reboot cắt ngang phiên T9 kể từ đợt 190 void).** Boot #115 chết sau 7.057 s; boot #116 btime 16:21:33Z (T01-192 xác minh 9 nguồn tươi 16:22:46Z). Hệ quả trực tiếp: (a) check-4 nền của T9 (sleep tới ~16:42Z) bị SIGTERM ~16:22Z — không có output, không phải lỗi script; (b) cả 4 daemon T9 chết giữa chừng (sampler mẫu cuối #115 16:21:17Z, live 16:21:30Z, probe-loop đang chờ lan-5r, B2 watcher spike cuối #115 16:21:2xZ); (c) T9 phát hiện reboot 16:22:41Z (uptime 1 phút), xác nhận btime 16:23:33Z, khởi động lại sampler + B2 watcher + live autotrigger 16:24:20Z (cùng tham số) + probe tay postboot-192 16:24:20Z — gap đo: sampler 183 s, live 170 s, B2 ~3 phút; (d) journal #115 mất hoàn toàn sau reboot — ENOSPC #115 chỉ còn 94 đếm trực tiếp (cận dưới, xem §4); (e) cửa sổ thoáng #116 suýt bắt được nhưng trượt ~28 s (xem §1.2). T9 KHÔNG khởi động lại probe-loop.sh (lanes trên #115 đã xong; lan-5r không còn ý nghĩa sau đổi boot) mà probe tay 2 lần trên #116. **T10/parent lưu ý:** mọi số T9 đợt này chia 2 boot; các chuỗi "toàn phiên" (balloon, ENOSPC) phải đọc theo từng boot, không gộp mù.
- **F-192-T9-2 — GATE-CHECK TRONG PROBE-LOOP ĐÃ CHẠY ĐÚNG LẦN ĐẦU (bài học F-191-T10-2 được sửa thật).** Probe lan-4r tới hạn 16:12:30Z đúng lúc attempt2 của T4 đang chạy (marker 16:08:51Z, chưa có attempt-done) → probe-loop ghi `GATE-OPEN attempt2-ebc5a3b9` + `GATE-OPEN wait 0m (probe lan-4r hoan)`, chờ 60 s, probe lúc 16:13:31Z — sau attempt-done 16:13:22Z 9 giây, trước marker attempt3 16:13:59Z 28 giây (khe hẹp nhưng hợp lệ — gate đã đóng). Không có probe nào của T9 đè lên cửa yên đợt này (lan-2r 15:12:30Z trước attempt1 15:15:22Z; lan-3r 15:42:30Z sau attempt1 xong 15:20:19Z; postboot/close trên #116 sau khi T4 đã hết attempt). Đây là lần đầu tiên cơ chế kiểm-gate-trong-script-dài được kiểm chứng bằng dữ liệu thật (không chỉ code review).
- **F-192-T9-3 — LỖI KHỞI ĐỘNG CWD LẦN ĐẦU (chỉ sampler chạy, 3 daemon kia fail "No such file").** Lệnh khởi động đầu dùng `cd DIR && chmod ... && setsid ... & setsid ... & ...` — `&` tách lệnh SAU chuỗi `cd &&`, nên 3 lệnh sau chạy ở cwd gốc (/home/hatch) thay vì round192-t9 (probe-loop.sh/b2watch.sh/sampler-autotrigger.py không có ở đó). T9 phát hiện qua `ps` sau 8 s (chỉ pid 5704 sampler.sh) và khởi động lại cả 3 bằng đường dẫn tuyệt đối + `bash -c 'cd "$1" && exec ...'` — cả 4 daemon chạy đúng từ 14:42:29Z. Bài học: KHÔNG BAO GIỜ tách nhiều lần khởi động bằng `&` sau một chuỗi `cd &&` — mỗi daemon một lệnh với đường dẫn tuyệt đối. (Cùng họ lỗi F-189-T9-6 nhưng khác dạng: lần này không phải output-drain-timeout mà là cwd sai.)
- **F-192-T9-4 — B2: `ps` ĐỨNG ĐẦU 185/512 SPIKE (36%) — watcher tự bắt chính mình, nặng hơn đợt 191 (27/286).** `ps` 185 + `find` 25 + `grep` 4 = 214 spike có process đứng đầu là lệnh shell ngắn — đây là lệnh chẩn đoán/thu thập của các luồng (T01 survey, T4 analyzer, T8 replay...) + chính watcher (`ps -eo` mỗi lần spike). Tải đợt này ≥3,0 gần như liên tục (351 spike chỉ trong 15:xx) nên watcher bắn liên tục, mỗi lần bắn lại tự bắt `ps` của mình vào snapshot — tỷ lệ tự-bắt tăng theo mật độ spike. T9 KHÔNG quy cho luồng cụ thể từ snapshot (snapshot chỉ có comm + %CPU, không có parent). Phần còn lại (chrome 106 + hatch 81 + MainThread 62 + WebKitWebProces 28 + ffmpeg 9 + apt-get 7 + lẻ tẻ = 298) là tải thật. 62 spike `MainThread` (chưa xác định chắc là tiến trình nào — ghi theo comm, như đợt 191).
- **F-192-T9-5 — BOOT #116 BALLOON LÊN NHANH BẤT THƯỜNG + XẢ SWAP NHANH.** Balloon đã 5.092.088 kB ở mẫu đầu (boot+167s), ≥6,0M từ 16:40:20Z (boot+18m47s, 3 mẫu), max 6.171.056 kB; SwapFree −313.036 kB trong 29 phút (nhanh hơn #115: −178.124 kB trong 99 phút). So sánh: #115 balloon min 765.016 kB lúc 14:44:08Z (boot+20m12s) — boot mới thường bắt đầu thấp rồi leo dần; #116 bắt đầu đã cao. Chưa rõ host balloon #116 từ đầu hay do tải sau boot (T56 replay/watcher trên boot mới?) — T9 chỉ ghi số, không suy diễn nguyên nhân. Theo dõi đợt 193 xem #116 (nếu còn sống) có ghim thật không.
- **F-192-T9-6 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải); lan-4r chờ gate xong mới probe (F-192-T9-2); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG TRONG HẠN CỜ ~17:00Z (kill daemon 16:53:26Z).** Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp). Chuỗi 0 vi phạm chung: parent (p)-191 đã reset về 0 sau F-191-T10-2; đợt 192 có nối lại từ 1 hay không thuộc T10/parent (cần verdict vi phạm của TẤT CẢ luồng, không chỉ T9).

- **Caveat đứng:** probe cap 30.000 (giá trị mở các boot trước là censored — chỉ biết ≥ 30.000; đợt này không đo được lần mở nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger cadence 60 s + kiểm offline 17/17 + dry-run 2 đợt + live 352 mẫu, xem §3); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #115 từ cell vì journal cũ mất sau reboot (chỉ còn 94 đếm trực tiếp, cận dưới); T10 không đếm lại độc lập B2 đợt 192 (chỉ đọc log đóng băng); lượt yên #60 / live-check #11 / FULL PASS thuộc T4/T8/T10 + parent; T10-192 do lượt cron 00:35 +07 spawn để đóng sổ.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (130 mẫu, 14:42:08–16:53:21Z, hai boot #115/#116): `hidden_files/round192-t9/ram-sampler-FROZEN.log` — md5 `ae056ca633ac9d3812da63b0ed9b94dd`. Log B2 đóng băng (512 spike): `hidden_files/round192-t9/b2-spikes-FROZEN.log` — md5 `75a2df37a3eb0591522e5ca826887f97`. Log headroom đóng băng (6 lần đo): `hidden_files/round192-t9/headroom-log-FROZEN.txt` — md5 `840ae906ad0d0597cd096cfdad7230a4`. Log live auto-trigger đóng băng (130 mẫu): `hidden_files/round192-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `7fee8090bd0323c2ea4d04bb65ba126f`. Phân tích bằng script: `hidden_files/round192-t9/t9-192-analyze.py` (output: `hidden_files/round192-t9/t9-192-analyze-output.txt`) + `hidden_files/round192-t9/t9-192-b2-analyze.py` (output: `hidden_files/round192-t9/t9-192-b2-analyze-output.txt`). Ghi chú baseline: `hidden_files/round192-t9/t9-192-baseline-notes.md`. Kiểm giữa phiên: `hidden_files/round192-t9/check-mid.sh` (4 lần hẹn, 3 lần chạy — lần 4 bị reboot giết). Auto-trigger: `hidden_files/round192-t9/sampler-autotrigger.py` + `hidden_files/round192-t9/birefnet-autotrigger-DESIGN.md` (§8, từ đợt 188) + `hidden_files/round192-t9/test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại đợt này — code không đổi). T10 đọc log đóng băng trực tiếp khi cần.
