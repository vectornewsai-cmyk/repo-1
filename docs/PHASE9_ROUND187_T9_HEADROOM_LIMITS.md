# LIMITS — Phase 9 đợt 187, T9: headroom + RAM + birefnet (0 mẫu ≥ guard; 5 episode balloon mới E-234–E-238; 2 reboot giữa phiên; auto-trigger đã thiết kế + kiểm offline 13/13; ENOSPC lần 36)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (7 lần đo toàn 0; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 47 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** (max avail 2.870.396 kB) — guard KHÔNG mở lại sau lần đầu đợt 186. **0 lần chạy birefnet — lần thứ 41 liên tiếp** (147–187). Xem §3.
- **Auto-trigger (quyết (p) aggregate 186): ĐÃ THIẾT KẾ + KIỂM OFFLINE 13/13 PASS** — prototype `sampler-autotrigger.py` (lock riêng + cấm chạy trong cửa attempt T4 + ngưỡng ≥2 mẫu liên tiếp ≥ guard) + tài liệu `birefnet-autotrigger-DESIGN.md`. **KHÔNG bật live đợt này** (live từ đợt 188 nếu parent duyệt ở §12.3-187). Xem §3.
- **CỬA SỔ THOÁNG: CẢ BA BOOT ĐỀU KHÔNG QUAN SÁT ĐƯỢC** — #109 (boot trước khi đợt mở); #110 (trễ handoff ~47 s); boot mới 257c1eae (trễ khôi phục ~66 s). Lần thứ tư liên tiếp tính theo boot.
- **Balloon: E-233 KẾT THÚC BỞI REBOOT #109; 5 EPISODE MỚI trên #110: E-234 (6) + E-235 (12) + E-236 (14) + E-237 (12) kết thúc bởi sag; E-238 (12) VẪN GHIM lúc sampler chết theo reboot.** Tổng ghim **56/148 (37,8%)**. Sàn 6.050.608 kB lặp lại **LẦN 10**.
- **RAM: 148 mẫu, 20:42:42–23:10:46Z, HAI boot (#109: 32; #110: 116).** Max **2.870.396 kB**; min **440.232 kB**; mean 1.070.807,1 kB; gate A **60/148**.
- **Lượt yên #56 (T4): CÓ LƯỢT HỢP LỆ ngay attempt đầu** (21:05:39–21:09:04Z, 20/20, median 39,0 ms, B 5/5 — chuỗi tính lại từ 1, parent quyết). T9 đối chiếu: **0 mẫu RAM <500 MB trước cửa yên** — F-184-T4-2 KHÔNG lặp lại.
- **B2: 116 spike THẬT, 4 cụm; 0 spike trong attempt1 #56 (KHỚP T4); 0 spike trong span ghim E-234–E-238; 0 spike trong harness T8.** 30 spike trong O8 T0 + 15 spike trong O8 T8.
- **2 REBOOT giữa phiên:** #110 (912f4a97, btime 21:13:21Z, gap #109→#110 = 2.568 s — ngắn nhất chuỗi) + boot mới 257c1eae (btime 23:10:44Z, gap #110→mới = 7.043 s — ứng viên #111, chờ T0-188). **Runtime restart** của nền tảng làm T9 tối 55 phút (22:16–23:11Z) — xem F-187-T9-1.
- **ENOSPC: đếm trực tiếp 60 dòng (8 #109 + 51 #110 + 1 boot mới) — đợt thứ 36 liên tiếp có lỗi thật**; ngoại suy ≈ **130 dòng**. Dòng đầu #110 boot+106s (trở lại mẫu ~110s); dòng đầu #109 boot+399s (MUỘN); dòng đầu boot mới boot+117s.
- **T7 ĐÃ đóng (22:54Z); T8 ĐÃ đóng. T9 đóng trễ hạn cờ ~23:00Z (runtime restart), trong hạn cứng ~23:35Z.** Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–186 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả ba boot.

### 1.2 Số đo đợt 187 (7 lần đo, 3 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 20:44:33Z | **0** | #109 6f1d9f87 | 63.747 | cặp mở (boot+14m00s) |
| 21:15:15Z | **0** | #110 912f4a97 | 63.747 | probe tay win-new2 (boot+114s) |
| 21:16:11Z | **0** | #110 | 63.747 | probe-loop khởi động lại (boot+170s) |
| 21:46:11Z | **0** | #110 | 63.747 | lan-2r (boot+32m50s) |
| 22:16:11Z | **0** | #110 | 63.747 | lan-3r (boot+1h02m50s) |
| 22:46:11Z | **0** | #110 | 63.747 | lan-4r (boot+1h32m50s) |
| 23:12:57Z | **0** | mới 257c1eae | 63.747 | probe tay close-187 (boot+133s) |

- **CỬA SỔ THOÁNG #109: KHÔNG QUAN SÁT ĐƯỢC** (boot btime 20:30:33Z TRƯỚC khi đợt mở 20:35:51Z; cửa sổ mẫu boot+61–92s đã đóng ~20:32:05Z, ~12 phút trước probe đầu của T9).
- **CỬA SỔ THOÁNG #110: KHÔNG QUAN SÁT ĐƯỢC.** T9 phát hiện reboot lúc 21:14:28Z (boot+67s — ĐANG TRONG cửa sổ mẫu) nhưng probe tay chạy lúc 21:15:15Z (boot+114s) = 0 — độ trễ giao handoff + khởi động exec ~47 s nuốt mất cửa sổ (bài học F-186-T9-4 chưa khắc phục được: handoff nền vẫn chậm hơn cửa sổ ~30 s).
- **CỬA SỔ THOÁNG boot mới 257c1eae: KHÔNG QUAN SÁT ĐƯỢC.** T9 phát hiện reboot lúc 23:11:51Z (boot+67s — ĐANG TRONG cửa sổ) nhưng probe tay chạy lúc 23:12:57Z (boot+133s) = 0 — độ trễ khôi phục sau runtime restart ~66 s (xem F-187-T9-1).
- **Lần thứ tư liên tiếp tính theo boot không quan sát được** (2 boot đợt 186 + 3 boot đợt này; không kết luận cửa sổ có mở hay không — chỉ kết luận không đo được).
- **Headroom cuối phiên: 0 — SỐ 0 GIỮ SANG ĐỢT NÀY.** 7/7 lần đo = 0; số watch giữ ngoài cell lúc đóng: **63.747**. **Trần KHÔNG ĐỔI trong boot** (63.747 trên cả ba boot).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt gần nhất: 179 đóng 0; 180 đóng 0 (1 lần đo giữa phiên 2.903); 181 đóng 0 (toàn 0, 7 lần đo); 182 đóng 2; 183 đóng 0 (7 lần 0 + 1 lần 30.000 chạm cap giữa phiên); 184 đóng 0 (6 lần 0 + 1 lần 30.000); 185 đóng 0 (6 lần 0 + 1 lần 30.000); 186 đóng 0 (7 lần 0 — KHÔNG có lần mở chạm cap nào); **187 đóng 0 (7 lần 0 — KHÔNG có lần mở chạm cap nào)**.

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 0.** Đợt này không có sự kiện mở 30.000 nào (nhưng cả ba cửa sổ đều không quan sát được nên không kết luận "không mở", chỉ kết luận "không đo được lần mở nào").
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 47 liên tiếp.** Quyết parent đợt 183 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Dữ kiện mới: 60 dòng ENOSPC đếm trực tiếp (xem §4) — đợt thứ 36 liên tiếp.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 148 mẫu, 20:42:42–23:10:46Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot #110: 121 s** (21:13:43Z → 21:15:44Z — gồm clock-skew, xem F-187-T9-3); **gap giữa hai đợt: 48m56s không sampler T9** (19:53:26Z → 20:42:42Z — chứa reboot #109 + cửa sổ thoáng #109); **gap qua runtime restart: 0 s mất mẫu** (log đủ 148 mẫu); **0 gap >90 s khác ngoài gap reboot** (lớn thứ hai 61 s — jitter bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 20:42:42–21:00:43Z | #109 | 898.208–2.870.396 kB | Mở sampler; balloon 4,0–5,9M; **O8 T0 3/3** 20:58:09–21:01:19Z (load1 tới 7,5) |
| 21:01:43–21:13:43Z | #109 | 1.153.008–2.870.396 kB | **Lượt yên #56: attempt1 HỢP LỆ** 21:05:39–21:09:04Z; 0 mẫu ghim |
| 21:15:44–21:29:44Z | #110 | 1.013.132–2.635.096 kB | Boot mới; balloon leo từ 4,0M; **0 spike B2** 21:15:57–21:16:37Z |
| 21:30:44–21:45:45Z | #110 | 654.184–2.635.096 kB | **HARNESS 6/6 (T8)** 21:30:22–21:45:33Z; gate A 9/15 |
| 21:46:45–22:00:45Z | #110 | 524.792–1.388.540 kB | **O8 T8 3/3** 21:46:15–21:48:49Z; balloon leo tới trần |
| 22:01:45–22:06:45Z | #110 | 440.232–506.356 kB | **E-234 6 mẫu ghim**; min phiên 440.232 kB |
| 22:07:45–22:10:45Z | #110 | 624.384–838.148 kB | Tách 4 mẫu; **sag sàn 6.050.608** (xem §2.2) |
| 22:11:45–23:10:46Z | #110 | 440.232–588.508 kB | **E-235 (12) + E-236 (14) + E-237 (12) + E-238 (12, VẪN GHIM)** |

- **Gate A ≥1024 MiB: 60/148 mẫu** (29/32 trên #109 + 31/116 trên #110); **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **7,5** (21:00:43Z, #109 — trong O8 T0); **RAM <512.000 kB: 11 mẫu** (7,4% — xem dưới); **RAM <500.000 kB: 5 mẫu**; **RAM <300.000 kB: 0 mẫu**.
- Swap: SwapFree 772.328 kB (mẫu đầu #109) → 658.184 kB (mẫu cuối #109) → **869.488 kB (mẫu đầu #110 — NHẢY +211.304 kB qua reboot)** → 634.368 kB (mẫu cuối, 23:10:46Z) — cùng bậc các đợt trước (#108 +363.428 kB; #105 +414.128 kB; #103 +356.088 kB).
- Trũng RAM đợt này: min **440.232 kB (22:01:45Z, #110 — trong E-234)** — sâu thứ hai trong các log T9 (kỷ lục 225.224 kB đợt 180; đợt 186: 482.392 kB). 11 mẫu <512.000 kB trong 148 mẫu (7,4%; đợt 186: 7/130 = 5,4% — tỉ lệ TĂNG vì #110 ghim nhiều: 56/116 mẫu CEIL).

**Bảng tổng hợp số RAM (từ script `t9-187-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 148 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #109 6f1d9f87 | 32 | 898.208 | 2.870.396 | 1.709.856,8 | 29/32 | 0 | 7,5 | 0 |
| #110 912f4a97 | 116 | 440.232 | 2.635.096 | 894.517,5 | 31/116 | 56 | 4,26 | 11 |
| **Toàn phiên** | **148** | **440.232** | **2.870.396** | **1.070.807,1** | **60/148** | **56/148 (37,8%)** | **7,5** | **11** |

- **Mean toàn phiên 1.070.807,1 kB — 2 cách độc lập: python `sum/n = 1.070.807,1` VÀ trung bình có trọng số ((32×1.709.856,8 + 116×894.517,5)/148 = 1.070.807,1) — KHỚP CẢ HAI.**
- 11 mẫu RAM <512.000 kB, 6 dải (từ script python trên log đóng băng): #110: 22:01:45–22:06:45Z (6, = E-234); 22:13:45Z (1); 22:16:45Z (1); 22:47:46Z (1); 22:54:46Z (1); 23:02:46Z (1). Tổng 6+1+1+1+1+1 = 11 — KHỚP số đếm toàn phiên. 5 mẫu <500.000 kB: 22:01:45Z (440.232), 22:02:45Z (491.640), 22:04:45Z (470.168), 22:05:45Z (490.240), 22:47:46Z (474.144).

### 2.2 Balloon virtio — 5 EPISODE MỚI E-234–E-238 trên #110 + E-233 kết thúc

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #109 và #110** (max bal trong log = đúng CEIL trên #110; #109 chưa tới trần nhưng trần đã khẳng định từ các đợt trước).
- **Boot #109: GHIM 0/32 mẫu (0%)** — balloon max 5.906.568 kB, chưa tới trần trong 43 phút sống của đợt.
- **Boot #110: GHIM 56/116 mẫu (48,3%), 5 EPISODE MỚI (E-234–E-238).** Balloon leo trần lần đầu boot+48m12s (22:01:45Z).

| Episode | Span (UTC) | n | Boot | RAM (kB) | Kết thúc |
|---|---|---|---|---|---|
| E-234 | 22:01:45–22:06:45Z | 6 | #110 | 440.232–506.356 | Sag 22:07:45Z bal **6.050.608 = SÀN** |
| E-235 | 22:11:45–22:22:46Z | 12 | #110 | 501.012–567.020 | Sag 22:23:46Z bal 6.247.216 |
| E-236 | 22:26:46–22:39:46Z | 14 | #110 | 522.048–588.508 | Sag 22:40:46Z bal 6.126.724 |
| E-237 | 22:44:46–22:55:46Z | 12 | #110 | 474.144–562.112 | Sag 22:56:46Z bal 6.247.216 |
| E-238 | 22:59:46–23:10:46Z | 12 | #110 | 510.420–535.092 | **VẪN GHIM lúc sampler chết theo reboot** |

- **Tổng ghim trần đợt này: 56/148 mẫu (37,8%)** (đợt 186: 21/130 = 16,2% — TĂNG GẤP ĐÔI; đợt 185: 39/122 = 32,0%; đợt 184: 31,9%; đợt 183: 7,0%; đợt 182: 38,6% — đợt này gần bằng đợt 182). Tỉ lệ ghim trên #110 (48,3%) cao nhất kể từ đợt 182; trên #109 (0%) thấp nhất kể từ đợt 183.
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-234–E-238 đều là EPISODE MỚI (≥2 mẫu CEIL liên tiếp, sag/reboot tách rõ ≥3 mẫu); E-234–E-237 kết thúc bởi sag, E-238 còn ghim lúc đóng (kết cục thuộc T9-188; T9 phán kết thúc bởi reboot #111-ứng-viên, kèm caveat đồng hồ F-187-T9-3).
- **Caveat tách E-235/E-236 + E-237/E-238 (F-187-T9-2):** khoảng tách E-235/E-236 chỉ ĐÚNG 3 mẫu dưới trần (22:23:46Z bal 6.247.216; 22:24:46Z bal 6.346.252; 22:25:46Z bal 6.442.948 — mẫu cuối chỉ thiếu **876 kB** là tới trần, chặt nhất từ trước tới nay: F-186-T9-2 thiếu 32.672 kB, F-185-T9-2 thiếu 4.132 kB). Khoảng tách E-237/E-238 cũng ĐÚNG 3 mẫu (22:56:46Z bal 6.247.216; 22:57:46Z bal 6.347.900; 22:58:46Z bal 6.436.708 — mẫu cuối thiếu 7.116 kB). Theo quy tắc đứng (≥3 mẫu dưới trần = tách SẠCH, tiền lệ parent-185 (h) + parent-186 (h)), T9 phán TÁCH cả hai. Phương án gộp: E-235+E-236 thành 1 episode 26 mẫu; E-237+E-238 thành 1 episode 24 mẫu (vẫn ghim) — T9 ghi rõ để T10/parent quyết; **số mẫu ghim tổng (56) KHÔNG đổi theo cả hai cách đếm**. Khoảng tách E-234/E-235 là 4 mẫu (sạch, không caveat).
- **Sàn balloon 6.050.608 kB: GIỮ 9 → 10 lần lặp lại theo nghĩa sag-ending.** Giá trị này xuất hiện ĐÚNG 1 lần đợt này (22:07:45Z — sag kết thúc E-234, tính); 0 lần dip giữa-lúc-leo.
- **Giá trị sag 6.247.216 kB: xuất hiện 2 lần đợt này, CẢ HAI đều là sag kết thúc episode** (22:23:46Z kết thúc E-235; 22:56:46Z kết thúc E-237 — tính cả hai). Đợt 186: 2 lần (1 tính + 1 không); đợt 184: 1 lần.
- **E-233 (đợt 186) — KẾT THÚC BỞI REBOOT #109 (T9 phán, T10/parent quyết cuối):** 2 mẫu trên #108, vẫn ghim lúc T9-186 đóng (19:53:26Z); reboot #109 xảy ra 20:30:33Z. **Caveat:** mù 19:53:26Z–20:42:42Z không có sampler — sag trong mù không loại trừ được (cùng caveat như E-229). 2 mẫu đã tính trong tổng ghim đợt 186 — KHÔNG cộng lại đợt 187.

### 2.3 Lượt yên WebKit #56 (T4) — CÓ LƯỢT HỢP LỆ NGAY ATTEMPT ĐẦU — CHUỖI TÍNH LẠI TỪ 1 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#56 CÓ LƯỢT HỢP LỆ ngay attempt đầu — CHUỖI LƯỢT YÊN HỢP LỆ TÍNH LẠI TỪ 1** (đã đứt về 0 đợt 186 theo quyết (m) parent; parent quyết cuối ở §12.3-187). Attempt1-6f1d9f87 (21:05:39–21:09:04Z, 20/20 + B 5/5, tickCost median 39,0 ms ≤ 60; ngân sách 1/3).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** attempt1: 4 mẫu, RAM 1.153.008–1.638.444 kB — **gate A 4/4**, 0 mẫu ghim, load1 **0,39–1,62**; **B2 watcher: 0 spike trong attempt1** (KHỚP T4 — attempt yên thật, tải thấp).
- **F-184-T4-2 KHÔNG LẶP LẠI:** 23 mẫu sampler trước khi cửa mở (20:42:42–21:05:38Z) có RAM min **898.208 kB** — **0 mẫu RAM <500 MB** trước cửa. Quyết (p) kiểm chứng live lần 7: **ĐẠT** (theo T4-187). T4 phán 0 vi phạm phía T4 — chuỗi đợt sạch 2 → 3 (parent quyết).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 20:58:09–21:01:19Z | #109 | 2,40–7,50 (3 mẫu) | 1.440.508–1.944.860 kB — **gate A 3/3** | **O8 T0 PASS 3/3**; **30 spike B2**; 0 mẫu ghim |
| T4 attempt1 #56 21:05:39–21:09:04Z | #109 | 0,39–1,62 (4 mẫu) | 1.153.008–1.638.444 kB — **gate A 4/4** | 20/20, B ĐẠT 5/5; 0 mẫu ghim; **0 spike B2** |
| T8 harness 21:30:22–21:45:33Z | #110 | 0,42–1,82 (15 mẫu) | 654.184–2.635.096 kB — **gate A 9/15** | **HARNESS 6/6**; **0 spike B2**; 0 mẫu ghim |
| T8 O8 21:46:15–21:48:49Z | #110 | 1,46–4,26 (3 mẫu) | 864.552–1.013.132 kB — **gate A 0/3** | **O8 T8 PASS 3/3**; **15 spike B2**; 0 mẫu ghim |

- T1-187: verify 186 PASS (chuỗi khớp lần thứ 100); GAP §115 đã có (đợt 186). T7-187: **run 187 FAILED 20:17:06Z** (margin +1.125 s; claimed→finished 202 s — **CA ≥60 s MỚI thứ 19** toàn lịch sử / thứ 16 trong cửa sổ; chuỗi SUCCEEDED 182→186 (5 lượt) ĐỨT); **cửa slot LÀNH trở lại** (HB 6/6 toàn −316 s; DR 3/3 toàn 0 s; lũy kế HB 50/525, DR 55/334; muộn HB GIỮ 11); run 188 vẫn RUNNING (kết cục thuộc T7-188); OUTAGE #2: 23/11 xác minh lại KHỚP, 20–22/11 SẠCH — stall chỉ xảy ra 23/11 + 24/11 cùng khung giờ.
- T0-187: **#109 XÁC NHẬN 9 nguồn TƯƠI**; O8 PASS 3/3 trên #109; libevent MISSING lúc survey 20:43:19Z (heal sau replay). T2-187: **(m) #108 DƯƠNG** (n ứng viên 48/49 nếu parent chấp nhận); **(m) #107 KHÔNG CÓ ĐIỂM**; INSIDE #107/#108/#109 KHÔNG TÍNH ĐƯỢC (thiếu gap #107); **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 30**; mù hole-recheck lần 31 NEW=0; CERT/FULL GIỮ 76/91; tuân thủ KHÔNG VI PHẠM — chuỗi 0 vi phạm 2 → 3 (parent quyết). T5-187: **POSTBOOT_PASS #109 CÓ 20:50:24Z + #110 CÓ 21:22:15Z** (replay, poll=0, KHÔNG caveat); **#108 KHÔNG CÓ** — tổng boot không cờ 24 → 25 nếu parent chấp nhận; hướng (3) VẪN ĐỨNG lần 34. T6-187: **(A) 120/120 lần 37** + **#108/#109 KHÔNG GIẾT HOLDER — chuỗi mới = 13** + prune lần 62 (xóa 1, queue 101 → 100, KHÔNG PHẢI CHỜ).
- T8-187: **HARNESS 6/6 trên #110; O8 T8 3/3 trên #110; O8 T0 3/3 trên #109 — FULL PASS KHÔNG** (5 chân chia đôi 2 boot vì reboot 21:13:21Z; chuỗi FULL PASS GIỮ 0, parent quyết); **B2 live đợt 2** (xem T8-187 phán cuối); V2 (f'') vẫn là phương án chính; 84l10 PASS chuỗi 7 đề xuất; 86n2-P1 không kẹt lần 10 đề xuất; marker sống qua 61 reboot (#49–#109; #110 → 62 nếu parent tính tiếp).

### 2.5 B2 — 116 spike THẬT, 4 cụm; 0 spike trong attempt1 + harness + span ghim

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **116 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 116): #109: 94; #110: 22; 0 spike trên boot mới 257c1eae** (watcher đã chết theo reboot — khoảng mù, không phải 0 thật); **0 spike trong span ghim E-234–E-238** — như đợt 177–186; **0 spike trong attempt1 #56 (KHỚP T4 — attempt yên thật)**; **0 spike trong harness T8**; **30 spike trong O8 T0 + 15 spike trong O8 T8**. 49 spike ≥5,0.

| Cụm | Thời gian (UTC) | n | load1 max |
|---|---|---|---|
| 1. Mở phiên + replay | 20:48:25–20:52:32Z | 50 | 6,74 |
| 2. O8 T0 | 20:58:50–21:02:27Z | 44 | 7,50 |
| 3. Boot mới #110 | 21:15:57–21:16:37Z | 7 | 3,42 |
| 4. O8 T8 | 21:47:23–21:48:33Z | 15 | 4,26 |

- **Tổng kết: 116/116 spike có process đứng đầu %CPU; load1 đỉnh đợt (watcher, cadence 2 s): 7,5** (đợt 186: 6,24 — đợt này CAO HƠN; load1 max sampler cadence 60 s cũng là 7,5 — KHỚP, cùng mẫu O8 T0 21:00:43Z). **0 spike trong span ghim; 0 spike trong attempt1; 0 spike trong harness.** Top leader toàn phiên (process đứng đầu %CPU mỗi snapshot): grep 51 + WebKitWebProces 22 + chrome 17 + apt-get 15 + MainThread 3 + hatch 2 + esbuild 2 + dpkg 1 + dpkg-preconfigure 1 + fc-cache 1 (= 116 — KHỚP). `grep` đứng đầu 51/116 snapshot là tải từ các script poll/analyzer của luồng khác (T0/T4/T8 grep nhiều lúc O8/harness), không phải của watcher (watcher chỉ chạy `ps`/head).
- **Khoảng mù watcher đầu phiên: ~6 phút** (watcher khởi động 20:43:xxZ; spike đầu bắt 20:48:25Z — trùng lúc replay bắt đầu cài tools; 0 spike 20:42–20:48Z theo sampler load1 max 2,68 < 3,0 — không bằng chứng spike bị lỡ). **Khoảng mù qua reboot #110: ~137 s** (watcher chết ~21:13:21Z, chạy lại 21:15:57Z — spike đầu trên #110 bắt 21:15:57Z, ngay khi chạy lại; load1 sampler trong gap 0,29 → 0,75 — không bằng chứng spike bị lỡ). **Khoảng mù qua reboot boot mới: TỪ 23:10:44Z tới lúc đóng (watcher chết, KHÔNG khởi động lại — T9 đóng sổ)**. **Khoảng mù do runtime restart: 0 mẫu sampler mất** (log đủ 148 mẫu — sampler vẫn chạy; chỉ T9 không kiểm được 22:16–23:11Z). **0 gap phủ sóng watcher nào khác.**

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; THIẾT KẾ XONG, KIỂM OFFLINE 13/13)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 2.870.396 kB (21:09:43Z, #109, lúc balloon xả sau attempt1); trên #110 max chỉ 2.635.096 kB. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở (khác đợt 186: guard mở nhưng không kích hoạt được). **0 lần chạy birefnet — lần thứ 41 liên tiếp (147–187).** Chuỗi "guard mở lần đầu" đợt 186 tới nay chỉ xảy ra 1 đợt.
- **AUTO-TRIGGER — THIẾT KẾ + KIỂM OFFLINE XONG (quyết (p) aggregate 186 (ii)):** prototype `sampler-autotrigger.py` + tài liệu `birefnet-autotrigger-DESIGN.md` + kiểm `test-autotrigger-offline.py` (**13/13 PASS**, log `test-autotrigger-offline-output.txt`). Quy tắc: ngưỡng **≥2 mẫu liên tiếp ≥ guard**; **lock riêng** (`birefnet-trigger.lock/`, mkdir nguyên tử, stale >3.600 s thì phá); tối đa **1 lần chạy / boot** (cờ `birefnet-fired-<boot8>.flag`); **CẤM chạy trong cửa attempt T4** (tín hiệu: `marker-t4-<TAG>` có mà `attempt-done-<TAG>` chưa có, cùng boot8, mtime ≤600 s — dùng đúng file T4 đã ghi từ đợt 145; marker cũ boot/mốc thời gian bị loại nên attempt chết không bao giờ cấm vĩnh viễn); kiểm lại /proc/meminfo ngay trước exec, hủy nếu avail < guard; đổi boot → reset bộ đếm. **Mặc định `--dry-run`** (chỉ ghi WOULD-FIRE, không exec); live cần CẢ `--live` VÀ env `T9_AUTOTRIGGER_LIVE=1` — **T9-187 KHÔNG bật live**.
- **Kiểm offline bao gồm replay cửa sổ 186 thật** (6.466.904/6.671.932/6.384.376 kB): WOULD-FIRE ở mẫu thứ 2 (17:49:05Z — TRƯỚC attempt1 17:53:23Z); và DEFER cả 3 mẫu nếu đang attempt. Các ca khác: 1 mẫu đơn không chạy; dip dưới guard reset bộ đếm; đổi boot reset; lock đã giữ thì skip; đã chạy 1 lần trên boot thì không chạy lại; marker cũ boot/mốc thời gian bị bỏ qua; chế độ live (stub) gọi fire đúng 1 lần.
- **Chưa làm (đề xuất parent xem ở §12.3-187):** fixture cho lần chạy đầu CHƯA CHỌN (cần clip ngắn có sẵn trên đĩa, ghi rõ đường dẫn/kích thước trước khi live); có giới hạn load1 khi chạy không (thiết kế hiện tại KHÔNG giới hạn load, chỉ cấm trong cửa attempt); nếu guard mở đúng lúc attempt rồi đóng trước khi attempt xong thì chỉ chạy khi guard còn mở (không hẹn chạy sau). **Triển khai live từ đợt 188 nếu parent duyệt** (dry-run song song 1 đợt để đối chiếu, rồi mới bật live).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) sampler cũ không có code trigger — nay đã có prototype + kiểm offline; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (0 lần chạy trong 41 đợt).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 186); không có thư mục `~/workspace/tmp-t9-187-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `round187-t9/` (chỉ có log WOULD-FIRE trong output kiểm offline — file test, không phải trigger thật).

## 4. ENOSPC trong journal (đếm trực tiếp 60 dòng — đợt thứ 36 liên tiếp — lỗi vẫn đang xảy ra trên cả ba boot)

- **#109:** đếm trực tiếp **8 dòng lúc 20:45:27Z**. Dòng đầu **20:37:12Z (boot+399s = boot+6m39s)** — MUỘN, phá mẫu boot+~110s lần thứ ba (#104 boot+22m53s, #107 boot+17m05s, #109 boot+6m39s); journal bắt đầu 20:30:44Z (boot+11s) nên phủ sóng đầy đủ — lỗi xuất hiện MUỘN thật. Dòng cuối #109 KHÔNG đếm được trước reboot (thiếu sót của T9, xem F-187-T9-5); ngoại suy theo nhịp ~0,85 dòng/phút trên 36,15 phút (dòng đầu → reboot) → **#109 ≈ 32 dòng (ƯỚC TÍNH)**.
- **#110:** **51 dòng** (đếm trực tiếp lúc 22:16:06Z). Dòng đầu **21:15:07Z (boot+106s)** — TRỞ LẠI mẫu #103 (+111s), #102 (+112s), #101 (+108s), #100 (+110s), #99 (+109s), #93 (+114s), #91 (+~120s), #90 (+121s), #95 (+105s), #98 (+103s). Dòng cuối đếm trực tiếp **22:15:06Z** — phần 22:16:06Z → reboot 23:10:44Z (~54,6 phút) **KHÔNG đếm được** (journal #110 mất sau reboot; xem F-187-T9-5); ngoại suy theo nhịp ~0,84 dòng/phút → +~46 dòng → **#110 ≈ 97 dòng (ƯỚC TÍNH)**.
- **Boot mới 257c1eae:** **1 dòng** (đếm trực tiếp lúc đóng 23:12:57Z). Dòng đầu **23:12:41Z (boot+117s)** — đúng mẫu ~110s; journal bắt đầu 23:10:56Z (boot+12s) nên phủ sóng đầy đủ.
- **Tổng đợt 187 đếm trực tiếp: 60 dòng** (8 #109 + 51 #110 + 1 boot mới) — cận dưới; ngoại suy ≈ **130 dòng** (32 + 97 + 1). Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`.
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-187 áp dụng, trừ thiếu sót F-187-T9-5):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (đợt này: #109 cả hai đều 8 lúc 20:45:27Z; #110 cả hai đều 51 lúc 22:16:06Z; boot mới cả hai đều 1 lúc đóng — KHỚP); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính; (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.
- **Caveat đếm:** `journalctl --list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #109/#110 từ cell (cùng mẫu F-171-T10-4 … F-186-T9-5). Số #109 (8) và #110 (51) lấy từ đếm trực tiếp giữa phiên. **Số boot mới (1) đếm được lại đầy đủ từ cell** (journal boot mới còn nguyên lúc đóng).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai reboot mới giữa phiên (T9 bắt trực tiếp cả hai, khởi động lại daemon 1 lần; lần 2 đóng sổ luôn) + #109 trước khi đợt mở

- **#110 (912f4a97-0841-47eb-805f-d7bbccaecd17, btime 21:13:21Z; số hiệu theo cách đếm A parent-186 (e); T0-188 xác minh 9 nguồn).** Gap #109→#110 = **2.568 s (42m48s)** — ngắn nhất trong chuỗi gần đây (mẫu ~7.200 s). Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #109 21:13:43Z — xem F-187-T9-3); **2 sleep chờ lan-2 của T9 bị SIGTERM**. T9 khởi động lại 3 daemon lúc 21:15:45–21:16:11Z (**gap mẫu 121 s**; probe tay win-new2 21:15:15Z = 0 rồi mới đọc journal/uptime). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 11 — nhưng T9 phát hiện + khởi động lại trong phiên (lần 1).**
- **Boot mới (257c1eae-1c20-4bd4-a710-548adb1d34d5, btime 23:10:44Z; số hiệu chờ T0-188 — ứng viên #111 theo cách đếm A).** Gap #110→mới = **7.043 s (1h57m23s)** — trở lại mẫu ~2h. Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #110 23:10:46Z — xem F-187-T9-3). T9 phát hiện lúc 23:11:51Z (boot+67s, trong cửa sổ thoáng mẫu) nhưng probe tay chạy lúc 23:12:57Z (boot+133s) = 0 — trễ khôi phục sau runtime restart (xem F-187-T9-1). T9 KHÔNG khởi động lại daemon (đóng sổ luôn, trong hạn cứng). **Không có reboot nào khác giữa phiên.**
- **#109 (6f1d9f87, btime 20:30:33Z):** TRƯỚC khi đợt mở 5m18s; **T0-187 XÁC MINH 9/9 nguồn tươi** (epoch 1795552233; gap #108→#109 = 4.841 s; O8 PASS 3/3 trên #109; run 187 FAILED 20:17:06Z — kết cục thuộc T7-187); **#108 XÁC NHẬN** (quyết (e) parent-186); **#110 CHƯA XÁC MINH 9 nguồn** (T0-187 đã đóng trước reboot 21:13:21Z — thuộc T0-188). Marker: T8-187 đếm sống qua **61 reboot #49–#109** (đã xác nhận); **#110 → 62 nếu parent tính tiếp**.
- **Khoảng mù giữa hai đợt: 48m56s không sampler T9** (19:53:26Z → 20:42:42Z — chứa reboot #109 + cửa sổ thoáng #109). **Khoảng mù T9 do runtime restart: 22:16–23:11Z (~55 phút) không kiểm** (sampler vẫn chạy, log đủ — chỉ T9 không đọc được; xem F-187-T9-1).

### 5.2 T5-187 — POSTBOOT_PASS #109 + #110 ĐỀU CÓ (replay, poll=0, KHÔNG caveat); #108 KHÔNG CÓ — tổng boot không cờ 24 → 25

- **POSTBOOT_PASS #109 ĐÃ CÓ lúc 20:50:24Z** (replay-đầy-đủ, poll=0, KHÔNG caveat; T5-187 — GST thư mục thật, tools cài, dpkg 1468; verify độc lập exit 0). **POSTBOOT_PASS #110 ĐÃ CÓ lúc 21:22:15Z** (replay-đầy-đủ, poll=0, KHÔNG caveat — watcher-187b, viết SAU khi T5-187 đóng cờ). **Gate (a) cả hai boot: CÓ.**
- **POSTBOOT_PASS #108 KHÔNG CÓ — KHÔNG THỬ REPAIR** (boot đã chết theo #109; tiền lệ #100/#83 (b2)); **tổng boot không cờ 24 → 25 nếu parent chấp nhận** (quyết (c) đợt 187). **#111-ứng-viên CHƯA CÓ** — thuộc T5-188. Replay #109 KHÔNG ĐÌNH TRỆ; replay #108 KHÔNG XÁC ĐỊNH ĐƯỢC (chuỗi đình trệ xen kẽ không nối tiếp được qua #108).
- **Watcher-187 CHẾT theo #110** (poll cuối 21:13:27Z, +6 s — mẫu overlap 20, F-187-T5-3); watcher-186 CHẾT theo #108 (poll cuối 19:10:05Z, +13 s — mẫu overlap 19, F-187-T5-1).

### 5.3 Các luồng khác — T7/T8 đã đóng; (m)/INSIDE/mù thuộc T2-187; harness T8 6/6; B2 live đợt 2

- T7-187 ĐÃ đóng (22:54Z): run 187 FAILED 20:17:06Z (CA #19, 202 s — chuỗi SUCCEEDED 182→186 ĐỨT); cửa slot LÀNH trở lại (chuỗi lành khởi động lại lần 1 — parent quyết); run 188 vẫn RUNNING (viết lại ×1 tại #110, kết cục thuộc T7-188); OUTAGE #2: 23/11 xác minh lại KHỚP, 20–22/11 SẠCH.
- T0-187: #109 XÁC NHẬN 9 nguồn TƯƠI; O8 PASS 3/3 trên #109 (20:58:09–21:01:19Z); libevent MISSING lúc survey (heal sau replay). T1-187: verify 186 PASS (chuỗi khớp lần thứ 100). T2-187: (m) #108 DƯƠNG + (m) #107 KHÔNG CÓ ĐIỂM + INSIDE #107/#108/#109 KHÔNG TÍNH ĐƯỢC + (m) #56 lần 30 + mù (hole-recheck lần 31) + 0 VI PHẠM — theo cờ T2-187 (T9 không phán thay T2). T5-187: POSTBOOT_PASS #109/#110 CÓ (replay, poll=0, KHÔNG caveat); hướng (3) VẪN ĐỨNG lần 34. T6-187: (A) 120/120 lần 37; #108/#109 KHÔNG GIẾT HOLDER (chuỗi 13); prune lần 62 (xóa 1, queue 101 → 100, KHÔNG PHẢI CHỜ).

## 6. Sai số / caveat (F-187-T9-*)

- **F-187-T9-1 — RUNTIME RESTART LÀM T9 TỐI ~55 PHÚT (22:16–23:11Z) — LẦN ĐẦU.** Lệnh kiểm lan-3r của T9 (sleep nền tới ~22:16Z) bị gián đoạn khi nền tảng restart runtime; T9 chỉ khôi phục được lúc 23:11:51Z qua thông báo recovery — lúc đó đã xảy ra reboot boot mới 23:10:44Z. Hậu quả: (a) mất lần kiểm giữa phiên ~22:16Z (lan-3r vẫn chạy đúng giờ nhờ probe-loop — không mất số liệu); (b) mất cửa sổ thoáng boot mới (phát hiện lúc boot+67s nhưng probe lúc boot+133s); (c) T9 đóng TRỄ so với hạn cờ ~23:00Z (trong hạn cứng ~23:35Z). Sampler/b2watch/probe-loop vẫn chạy trong lúc T9 tối (log đủ 148 mẫu / 116 spike) — chỉ có T9 không đọc được. Không mất số liệu nào ngoài ENOSPC cuối boot (xem F-187-T9-5).
- **F-187-T9-2 — TÁCH E-235/E-236 VÀ E-237/E-238: ĐÚNG 3 MẪU DƯỚI TRẦN, MẪU CUỐI SUÝT CHẠM TRẦN (T9 phán TÁCH, T10/parent quyết cuối).** Tách E-235/E-236: 22:23:46Z (6.247.216) → 22:24:46Z (6.346.252) → 22:25:46Z (6.442.948 — chỉ thiếu **876 kB**, chặt nhất từ trước tới nay). Tách E-237/E-238: 22:56:46Z (6.247.216) → 22:57:46Z (6.347.900) → 22:58:46Z (6.436.708 — thiếu 7.116 kB). Phương án gộp (E-235+E-236 = 26 mẫu; E-237+E-238 = 24 mẫu, vẫn ghim) ghi ở §2.2; tổng ghim 56 KHÔNG đổi. **Sàn 6.050.608 kB GIỮ 9 → 10 lần** (sag kết thúc E-234 22:07:45Z); **sag 6.247.216 kB 2 lần, cả hai đều sag-ending** (E-235, E-237).
- **F-187-T9-3 — ĐỒNG HỒ CELL NHANH TRƯỚC CẢ HAI REBOOT (giao T0-188).** (a) Trước #110: mẫu sampler cuối trên #109 ghi 21:13:43Z — SAU btime #110 (21:13:21Z) 22 s, dù mẫu mang boot_id cũ (cùng mẫu F-186-T9-3: ~16–30 s). (b) Trước boot mới: mẫu cuối trên #110 ghi 23:10:46Z — SAU btime boot mới (23:10:44Z) 2 s (δ > 2 s; ước ~16–30 s theo tiền lệ, không đo trực tiếp được). /proc/1 mtime #109 (20:30:44Z = btime +11s) khớp mẫu — ủng hộ btime #109. T9 không tự sửa timestamp log; E-238 vẫn tính 12 mẫu (22:59:46–23:10:46Z theo log).
- **F-187-T9-4 — CẢ BA CỬA SỔ THOÁNG ĐỀU KHÔNG QUAN SÁT ĐƯỢC — LẦN ĐẦU 3 BOOT TRONG MỘT ĐỢT (XEM §1).** #109: boot trước khi đợt mở; #110: trễ handoff ~47 s; boot mới: trễ khôi phục sau runtime restart ~66 s. Không kết luận cửa sổ có mở hay không — chỉ kết luận không đo được. Bài học: sau khi phát hiện reboot, probe tay phải chạy trong cùng một lượt exec với lệnh kiểm tra — nhưng handoff nền vẫn chậm hơn cửa sổ ~30 s (2/3 boot đợt này phát hiện được trong cửa sổ nhưng probe vẫn trễ).
- **F-187-T9-5 — ENOSPC: KHÔNG ĐẾM ĐƯỢC TỔNG CUỐI BOOT #109/#110 (lỗi của T9, cùng lớp F-186-T9-6b).** T9 chỉ đếm giữa phiên (8 dòng #109 lúc 20:45:27Z; 51 dòng #110 lúc 22:16:06Z) mà không đếm lại ngay trước mỗi reboot — journal mất sau reboot, không bù được; tổng cuối mỗi boot chỉ còn ngoại suy theo nhịp (≈32 / ≈97). Rút kinh nghiệm: đợt sau đếm ENOSPC ở MỖI lần kiểm giữa phiên, và đếm ngay khi phát hiện reboot mới.
- **F-187-T9-6 — KHỞI ĐỘNG DAEMON GẶP LỖI `&`-CHAIN (2 LẦN) LÚC MỞ PHIÊN.** Lệnh nối nhiều `setsid ... &` trong một dòng exec làm daemon thứ 2–3 chạy sai cwd/chết (probe-loop chạy ở /home/hatch, lỗi `probe-loop.sh: No such file or directory`). Đã sửa bằng cách khởi động MỖI daemon bằng MỘT exec riêng — cả 3 daemon chạy lại đúng 21:15:45–21:16:11Z. Bài học: không nối `&` nhiều lệnh nền trong cùng một dòng exec.
- **F-187-T9-7 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm 2 → 3 — CHỜ parent quyết cuối).** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail ngay ở watch đầu, không tạo tải; không probe nào chạy trong cửa sổ attempt T4 — probe gần nhất trước attempt là 20:44:33Z, sau attempt là 21:15:15Z); 0 spike B2 trong attempt1; 30/15 spike B2 trong cửa sổ O8 T0/T8 là tải của chính O8 (KHỚP T0/T8 — WebKitWebProcess đứng đầu 22 snapshot); 0 spike B2 trong span ghim. T4-187 phán 0 vi phạm phía T4; T2-187 phán tuân thủ KHÔNG VI PHẠM — parent quyết cuối về chuỗi. **T9 ĐÓNG TRỄ SO VỚI HẠN CỜ ~23:00Z (do runtime restart, xem F-187-T9-1) nhưng TRONG HẠN CỨNG ~23:35Z.** Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).

- **Caveat đứng:** probe cap 30.000 (giá trị mở các boot trước là censored — chỉ biết ≥ 30.000; đợt này không đo được lần mở nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có prototype auto-trigger + kiểm offline, xem §3); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #109/#110 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 187 (chỉ đọc log đóng băng); boot mới 257c1eae chưa xác minh 9 nguồn (thuộc T0-188); fixture /tmp mất theo reboot boot mới — T8-187 đã rebuild 21:29–21:30Z trước reboot, sau reboot CHƯA rebuild lại (thuộc T8-188); E-238 còn ghim lúc sampler chết — kết cục thuộc T9-188.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (148 mẫu, 20:42:42–23:10:46Z): `round187-t9/ram-sampler-FROZEN.log` — md5 `51f78d2ea328f6412a4c7486580705ef`. Log B2 đóng băng (116 spike): `round187-t9/b2-spikes-FROZEN.log` — md5 `5f6e7c3448845d0bf86bc0fb12f62db4`. Log headroom đóng băng (7 lần đo): `round187-t9/headroom-log-FROZEN.txt` — md5 `64632fc7474e99ff2b59df606a42d422`. Phân tích bằng script: `round187-t9/t9-187-analyze.py` (output: `round187-t9/t9-187-analyze-output.txt`). Ghi chú baseline: `round187-t9/t9-187-baseline-notes.md`. Probe tay cửa sổ boot mới + đóng phiên: `round187-t9/probe-once.py`. Auto-trigger: `round187-t9/sampler-autotrigger.py` + `round187-t9/birefnet-autotrigger-DESIGN.md` + `round187-t9/test-autotrigger-offline.py` (output: `round187-t9/test-autotrigger-offline-output.txt` — 13/13 PASS). T10 đọc log đóng băng trực tiếp khi cần.
