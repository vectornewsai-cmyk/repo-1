# LIMITS — Phase 9 đợt 186, T9: headroom + RAM + birefnet (GUARD BỊ VƯỢT lần đầu sau 39 đợt; reboot mới; E-230/E-231/E-232 kết thúc + E-233 đang ghim; 2 cửa sổ thoáng đều KHÔNG QUAN SÁT ĐƯỢC; ENOSPC lần 35)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (7 lần đo toàn 0; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 46 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **⚠️ GUARD BỊ VƯỢT — LẦN ĐẦU SAU 39 ĐỢT: 3 mẫu liên tiếp ≥ guard 6.291.456 kB trên #107 (17:48:05–17:50:05Z, max 6.671.932 kB = 106,0% guard; balloon xả về 0). KHÔNG có lần chạy birefnet nào kích hoạt** (sampler.sh không có code trigger; T9 chỉ phát hiện khi phân tích lúc 19:37Z — cửa sổ đã đóng từ lâu). **0 lần chạy birefnet — nhưng KHÔNG còn là "guard chặn đúng".** Xem §3 + F-186-T9-1.
- **CỬA SỔ THOÁNG: CẢ HAI BOOT ĐỀU KHÔNG QUAN SÁT ĐƯỢC** — #107 (mở phiên boot+23m); boot mới (probe đầu boot+118s = 0 — lần đầu tiên 2 boot liên tiếp không quan sát được).
- **Balloon: E-230 (3) KẾT THÚC BỞI REBOOT; E-231 (5) + E-232 (10) KẾT THÚC BỞI SAG; E-233 (2) VẪN GHIM lúc đóng; + 1 lần chạm-trần-1-mẫu (không đánh số E).** Tổng ghim **21/130 (16,2%)**.
- **RAM: 130 mẫu, 17:43:05–19:53:26Z, HAI boot (#107: 88; boot mới: 42).** Max **6.671.932 kB** (cửa sổ guard); min **482.392 kB**; mean 1.867.064,4 kB; gate A **69/130**.
- **Lượt yên #55 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — chuỗi 46 → 47 ĐỨT VỀ 0** (3 attempt đều 20/20 nhưng bị loại: median vượt bar / B2 vi phạm). T9 đối chiếu: **0 mẫu RAM <500 MB trước cửa yên** — F-184-T4-2 KHÔNG lặp lại.
- **B2: 183 spike THẬT, TẤT CẢ trên #107, 5 cụm; 0 spike trên boot mới; 0 spike trong span ghim E-230–E-233.** 17 spike trong attempt1 (KHỚP T4, load1_max 5,04) + 31 spike trong attempt3 (KHỚP T4, 6,24); attempt2 0 spike.
- **REBOOT MỚI giữa phiên** (boot `7ea9d047`, btime 19:09:52Z, gap #107→mới = 6.602 s — số hiệu chờ T0 xác minh, ứng viên #108); **E-229 (đợt 185) kết thúc bởi reboot #106** (theo T0-186, kèm caveat mù).
- **ENOSPC: đếm trực tiếp 105 dòng (74 #107 + 31 boot mới) — đợt thứ 35 liên tiếp có lỗi thật**; ngoại suy ≈ **113 dòng**. Dòng đầu boot mới boot+111s (trở lại mẫu ~110s); dòng cuối 19:45:33Z — 0 dòng mới ~10 phút cuối.
- **T7 CHƯA đóng lúc T9 đóng (~19:54Z)** — như T7-180/181/182/183/184/185. Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183/184/185 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả hai boot.

### 1.2 Số đo đợt 186 (7 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 17:43:23Z | **0** | #107 cea79500 | 63.747 | cặp mở (boot+23m33s) |
| 18:13:23Z | **0** | #107 | 63.747 | lan-2 (boot+53m33s) |
| 18:43:23Z | **0** | #107 | 63.747 | lan-3 (boot+1h23m33s) |
| 19:11:50Z | **0** | mới 7ea9d047 | 63.747 | probe tay win-new-open (boot+118s) |
| 19:12:57Z | **0** | mới | 63.747 | probe-loop khởi động lại (boot+185s) |
| 19:42:57Z | **0** | mới | 63.747 | lan-2 sau reboot (boot+33m05s) |
| 19:54:17Z | **0** | mới | 63.747 | cặp đóng (tay, boot+44m25s); E-233 đang ghim |

- **CỬA SỔ THOÁNG #107: KHÔNG QUAN SÁT ĐƯỢC** (mở phiên boot+23m, sau khi cửa sổ đóng; cùng mẫu #104 đợt 185).
- **CỬA SỔ THOÁNG boot mới: KHÔNG QUAN SÁT ĐƯỢC.** T9 phát hiện reboot lúc 19:10:46Z (boot+54s) nhưng probe tay đầu tiên chạy lúc 19:11:50Z (boot+118s) = 0 — độ trễ exec ~64 s nuốt mất cửa sổ (mẫu trước: mở ~boot+61–62s, đóng trước ~boot+92s). **Lần đầu 2 boot liên tiếp không quan sát được** (F-186-T9-4).
- **Headroom cuối phiên: 0 — SỐ 0 GIỮ SANG ĐỢT NÀY.** 7/7 lần đo = 0; số watch giữ ngoài cell lúc đóng: **63.747**. Tỉ lệ so với nhu cầu vite (~1.578): **~0** — một vite mới vẫn không khởi động được (như mọi đợt từ 152). **Trần KHÔNG ĐỔI trong boot** (63.747 trên cả hai boot).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt gần nhất: 179 đóng 0; 180 đóng 0 (1 lần đo giữa phiên 2.903); 181 đóng 0 (toàn 0, 7 lần đo); 182 đóng 2; 183 đóng 0 (7 lần 0 + 1 lần 30.000 chạm cap giữa phiên); 184 đóng 0 (6 lần 0 + 1 lần 30.000); 185 đóng 0 (6 lần 0 + 1 lần 30.000); **186 đóng 0 (7 lần 0 — KHÔNG có lần mở chạm cap nào)**.

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 0.** Đợt này không có sự kiện mở 30.000 nào (khác 183/184/185 — nhưng cả hai cửa sổ đều không quan sát được nên không kết luận "không mở", chỉ kết luận "không đo được lần mở nào").
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 46 liên tiếp.** Quyết parent đợt 183 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới: journal đợt này có 105 dòng lỗi ENOSPC đếm trực tiếp (xem §4)** — đợt thứ 35 liên tiếp. T9 chỉ nêu dữ kiện + tương quan, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 130 mẫu, 17:43:05–19:53:26Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot: 137 s** (19:10:08Z → 19:12:25Z — gồm clock-skew ~16–30 s, xem F-186-T9-3; gap thật ≈ 107–121 s); **gap giữa hai đợt: 4h01m18s không sampler T9** (13:41:47Z → 17:43:05Z — chứa reboot #106 + boot #107 + cửa sổ thoáng #107); **0 gap >90 s khác** (lớn thứ hai 61 s — jitter bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 17:43:05–17:52:05Z | #107 | 4.590.764–6.671.932 kB | Mở sampler; balloon XẢ về 0; **3 mẫu ≥ guard** (xem §3); load1 max 5,98 |
| 17:53:23–18:11:49Z | #107 | 2.380.816–4.002.808 kB | **Lượt yên #55: 3 attempt, KHÔNG lượt hợp lệ** (xem §2.3); O8 T0 PASS 3/3 trong dải |
| 18:12:06–18:44:18Z | #107 | 542.636–2.833.000 kB | Balloon leo đơn điệu; **HARNESS 6/6 (T8)** 18:28:15–18:44:18Z; O8 T8 PASS 3/3 18:46:51–18:49:45Z |
| 18:50:07–19:01:07Z | #107 | 568.500–1.160.000 kB | Balloon leo sát trần; **chạm-trần-1-mẫu 19:02:07Z** |
| 19:02:07Z | #107 | 493.556 kB | **Chạm trần 1 mẫu** (bal CEIL, không đánh số E) |
| 19:03:07–19:07:08Z | #107 | 506.268–775.540 kB | Tách 5 mẫu dưới trần; balloon leo lại |
| 19:08:08–19:10:08Z | #107 | 482.392–495.048 kB | **E-230 3 mẫu ghim; KẾT THÚC BỞI REBOOT** |
| 19:12:25–19:22:25Z | mới | 549.000–1.505.480 kB | Boot mới; balloon leo rất nhanh từ 5,35M |
| 19:23:25–19:27:25Z | mới | 508.860–556.372 kB | **E-231 5 mẫu ghim**; sag kết thúc (bal 6.217.940) |
| 19:28:25–19:38:26Z | mới | 496.676–938.092 kB | Tách 11 mẫu; **dip sàn 19:31:25Z** (bal 6.050.608, xem §2.2) |
| 19:39:26–19:48:26Z | mới | 526.216–576.488 kB | **E-232 10 mẫu ghim**; sag kết thúc (bal 6.247.216) |
| 19:49:26–19:51:26Z | mới | 604.272–749.448 kB | Tách ĐÚNG 3 mẫu (xem caveat §2.2) |
| 19:52:26–19:53:26Z | mới | 559.520–568.932 kB | **E-233 2 mẫu ghim — VẪN GHIM lúc đóng** |

- **Gate A ≥1024 MiB: 69/130 mẫu** (64/88 trên #107 + 5/42 trên boot mới); **3 mẫu ≥ guard** (xem §3); load1 max (sampler) **5,98** (17:46:05Z, #107 — trong cửa sổ guard, lúc POSTBOOT replay); **RAM <512.000 kB: 7 mẫu** (5,4% — xem dưới); **RAM <500.000 kB: 5 mẫu**; **RAM <300.000 kB: 0 mẫu**.
- Swap: SwapFree 771.380 kB (mẫu đầu #107) → 628.640 kB (mẫu cuối #107) → **992.068 kB (mẫu đầu boot mới — NHẢY +363.428 kB qua reboot)** → 626.932 kB (mẫu cuối, 19:53:26Z) — cùng bậc các đợt trước (#105 +414.128 kB; #103 +356.088 kB; #102 +438.432 kB).
- Trũng RAM đợt này: min **482.392 kB (19:09:08Z, #107 — trong E-230)** — sâu thứ ba trong các log T9 (kỷ lục 225.224 kB đợt 180; đợt 185: 442.420 kB). 7 mẫu <512.000 kB trong 130 mẫu (5,4%; đợt 185: 21/122 = 17,2% — tỉ lệ GIẢM MẠNH vì #107 ghim ít: chỉ 4/88 mẫu CEIL).

**Bảng tổng hợp số RAM (từ script `t9-186-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 130 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #107 cea79500 | 88 | 482.392 | 6.671.932 | 2.415.040,7 | 64/88 | 4 | 5,98 | 5 |
| mới 7ea9d047 | 42 | 496.676 | 1.505.480 | 718.923,6 | 5/42 | 17 | 1,12 | 2 |
| **Toàn phiên** | **130** | **482.392** | **6.671.932** | **1.867.064,4** | **69/130** | **21/130 (16,2%)** | **5,98** | **7** |

- **Mean toàn phiên 1.867.064,4 kB — 2 cách độc lập: python `sum/n = 1.867.064,4` VÀ trung bình có trọng số ((88×2.415.040,7 + 42×718.923,6)/130 = 1.867.064,4) — KHỚP CẢ HAI.**
- 7 mẫu RAM <512.000 kB, 4 dải (từ script python trên log đóng băng): #107: 19:02:07Z (1); 19:07:08–19:10:08Z (4); boot mới: 19:27:25Z (1); 19:36:26Z (1). Tổng 1+4+1+1 = 7 — KHỚP số đếm toàn phiên. 5 mẫu <500.000 kB: 19:02:07Z (493.556), 19:08:08Z (492.956), 19:09:08Z (482.392), 19:10:08Z (495.048), 19:36:26Z (496.676).

### 2.2 Balloon virtio — E-230/E-231/E-232 mới + E-233 đang ghim + chạm-trần-1-mẫu

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #107 và boot mới** (max bal trong log = đúng CEIL trên cả hai boot).
- **Boot #107: GHIM 4/88 mẫu (4,5%)** — thấp nhất kể từ đợt 183; balloon XẢ VỀ 0 lúc 17:49:05Z (xem §3), rồi leo đơn điệu tới trần trong ~1h20m.
- **Boot mới: GHIM 17/42 mẫu (40,5%), 3 EPISODE MỚI (E-231–E-233).** Balloon leo trần rất nhanh (E-231 bắt đầu boot+13m33s — khớp mẫu #103/#105 boot+14m).

| Episode | Span (UTC) | n | Boot | RAM (kB) | Kết thúc |
|---|---|---|---|---|---|
| (chạm 1 mẫu) | 19:02:07Z | 1 | #107 | 493.556 | Sag 19:03:07Z bal 6.247.216 — KHÔNG đánh số E |
| E-230 | 19:08:08–19:10:08Z | 3 | #107 | 482.392–495.048 | **KẾT THÚC BỞI REBOOT** (mẫu cuối #107 vẫn CEIL) |
| E-231 | 19:23:25–19:27:25Z | 5 | mới | 508.860–556.372 | Sag 19:28:25Z bal 6.217.940 |
| E-232 | 19:39:26–19:48:26Z | 10 | mới | 526.216–576.488 | Sag 19:49:26Z bal **6.247.216** |
| E-233 | 19:52:26–19:53:26Z | 2 | mới | 559.520–568.932 | **VẪN GHIM lúc đóng** |

- **Tổng ghim trần đợt này: 21/130 mẫu (16,2%)** (đợt 185: 39/122 = 32,0% — GIẢM MỘT NỬA; đợt 184: 31,9%; đợt 183: 7,0%; đợt 182: 38,6%; đợt 181: 27,6%; đợt 180: 16,4% — đợt này gần như bằng đợt 180). Tỉ lệ ghim trên boot mới (40,5%) cao; trên #107 (4,5%) thấp nhất kể từ đợt 183.
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-230/E-231/E-232/E-233 đều là EPISODE MỚI (≥2 mẫu CEIL liên tiếp, sag/reboot tách rõ ≥3 mẫu); E-230 kết thúc bởi reboot, E-231/E-232 kết thúc bởi sag, E-233 còn ghim lúc đóng. **Chạm-trần-1-mẫu 19:02:07Z KHÔNG đánh số E** (1 mẫu CEIL đơn lẻ, tách 5 mẫu dưới trần với E-230 — tiền lệ: mọi episode từ trước tới nay đều ≥3 mẫu; 1 mẫu có thể là ghim dưới 60 s giữa hai lần đo).
- **Caveat tách E-232/E-233 (F-186-T9-2):** khoảng tách chỉ ĐÚNG 3 mẫu dưới trần (19:49:26Z bal 6.247.216; 19:50:26Z bal 6.316.892; 19:51:26Z bal 6.411.152 — mẫu cuối chỉ thiếu 32.672 kB là tới trần). Theo quy tắc đứng (≥3 mẫu dưới trần = tách SẠCH, tiền lệ đợt 184/185), T9 phán TÁCH thành E-232 (10) + E-233 (2). Nếu parent áp dụng sai "sag phải sâu hơn" thì hai run gộp thành MỘT episode 14 mẫu 19:39:26–19:53:26Z (chưa kết thúc) — T9 ghi rõ phương án này để T10/parent quyết; số mẫu ghim tổng (21) KHÔNG đổi theo cả hai cách đếm.
- **Sàn balloon 6.050.608 kB: GIỮ 9 lần lặp lại theo nghĩa sag-ending.** Giá trị này xuất hiện 1 lần đợt này (19:31:25Z) — dip 1 mẫu xuống đúng sàn GIỮA LÚC LEO (trước đó bal 6.410.568, sau đó leo lại 6.167.384) — đúng mẫu 12:35:10Z đợt 185 → theo tiền lệ F-185-T9-2, KHÔNG tính vào số lần lặp lại; ghi nhận như hiện tượng riêng (lần dip giữa-lúc-leo thứ hai liên tiếp).
- **Giá trị sag 6.247.216 kB: xuất hiện 2 lần đợt này** — 19:03:07Z (sau chạm-trần-1-mẫu — ghi nhận, KHÔNG tính vào đếm sag-ending vì không kết thúc episode) + **19:49:26Z (sag kết thúc E-232 — tính)**. Đợt 184: 1 lần; đợt 185: 0 lần.
- **E-229 (đợt 185) — KẾT THÚC BỞI REBOOT #106 (T9 phán, T10/parent quyết cuối):** 15 mẫu trên #105, vẫn ghim lúc T9-185 đóng (13:41:47Z); T0-186 xác nhận #106 tồn tại trong khung (14:52:42Z, 17:19:50Z). **Caveat:** mù 13:41:47Z–14:52:42Z không có sampler — sag trong mù không loại trừ được. 15 mẫu đã tính trong tổng ghim đợt 185 — KHÔNG cộng lại đợt 186.

### 2.3 Lượt yên WebKit #55 (T4) — KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI 47 → 0 (ĐỨT) (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#55 KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ 47 → 0 (ĐỨT).** 3 attempt trên #107, ngân sách dùng 3/3 — cả 3 đều 20/20 nhưng đều bị loại: attempt1 (17:53:23–17:57:03Z, median 60,0 ms đúng bar, B2 VI PHẠM load1_max 5,04); attempt2 (18:03:45–18:07:23Z, B ĐẠT 5/5, median 68,0 ms > 60); attempt3 (18:08:04–18:11:49Z, median 79,0 ms, B1 VI PHẠM load5 cuối 2,52 + B2 VI PHẠM load1_max 6,24). Median leo dần 60,0 → 68,0 → 79,0 (F-186-T4-3). Labellag (b): **0 occ / 0 event cả 3 attempt** — F-185-T4-4 KHÔNG tái diễn.
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** attempt1: 3 mẫu, RAM 3.659.780–3.970.232 kB — **gate A 3/3**, 0 mẫu ghim, load1 **1,83–4,49**; attempt2: 4 mẫu, RAM 2.380.816–2.800.912 kB — **gate A 4/4**, 0 mẫu ghim, load1 **1,21–2,25**; attempt3: 4 mẫu, RAM 3.209.588–4.002.808 kB — **gate A 4/4**, 0 mẫu ghim, load1 **1,52–5,23** (mẫu 18:09:06Z load1 5,23 — cùng burst tự-tải mà T4 ghi). **B2 watcher: 17 spike trong attempt1 (KHỚP T4, max 5,04) + 31 spike trong attempt3 (KHỚP T4, max 6,24); attempt2 0 spike.**
- **F-184-T4-2 KHÔNG LẶP LẠI:** 11 mẫu sampler trước khi cửa mở (17:43:05–17:53:05Z) có RAM min **4.590.764 kB** — **0 mẫu RAM <500 MB** trước cửa (cửa sổ guard 17:48–17:50Z nằm trong dải này, xem §3). **F-185-T4-4 KHÔNG tái diễn** (labellag (b) 0 occ). Quyết (p) kiểm chứng live LẦN 6: **ĐẠT** (theo T4-186). T4 phán 0 vi phạm phía T4 — đề xuất chuỗi đợt sạch 1 → 2 (parent quyết).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 17:58:21–18:01:22Z | #107 | 1,42–3,84 (3 mẫu) | 3.832.644–4.528.528 kB — **gate A 3/3** | **O8 T0 PASS 3/3**; **16 spike B2**; 0 mẫu ghim |
| T4 attempt1 #55 17:53:23–17:57:03Z | #107 | 1,83–4,49 (3 mẫu) | 3.659.780–3.970.232 kB — **gate A 3/3** | 20/20, B2 VI PHẠM; 0 mẫu ghim; **17 spike B2** |
| T4 attempt2 #55 18:03:45–18:07:23Z | #107 | 1,21–2,25 (4 mẫu) | 2.380.816–2.800.912 kB — **gate A 4/4** | 20/20, median 68,0 > 60; 0 mẫu ghim; **0 spike B2** |
| T4 attempt3 #55 18:08:04–18:11:49Z | #107 | 1,52–5,23 (4 mẫu) | 3.209.588–4.002.808 kB — **gate A 4/4** | 20/20, B1+B2 VI PHẠM; 0 mẫu ghim; **31 spike B2** |
| T8 harness 18:28:15–18:44:18Z | #107 | 0,70–3,62 (16 mẫu) | 542.636–2.550.880 kB — **gate A 11/16** | **HARNESS 6/6**; **37 spike B2**; 0 mẫu ghim |
| T8 O8 18:46:51–18:49:45Z | #107 | 1,71–2,75 (3 mẫu) | 975.456–1.211.504 kB — **gate A 2/3** | **O8 T8 PASS 3/3**; 0 spike B2; 0 mẫu ghim |

- T1-186: verify 185 PASS (chuỗi khớp lần thứ 97); GAP §112 prose ĐÃ CẬP NHẬT (F-185-T1-1 ĐÓNG). T7-186 CHƯA đóng → không có cửa sổ T7 (kết cục run 185/186 + cửa slot thuộc T7-186/T10). T5-186: **POSTBOOT_PASS #107 ĐÃ CÓ 17:48:46Z** (repair-sớm-quyết-h, poll=1, CÓ caveat); **#105 KHÔNG CÓ** (tổng boot không cờ 23 → 24 nếu parent chấp nhận); hướng (3) VẪN ĐỨNG lần 33.
- T2-186: **(m) #104 KHÔNG CÓ ĐIỂM; (m) #105 DƯƠNG +34,931 s (TRONG dải, SÁT biên dưới 1,931 s)**; **INSIDE #104 TRUE (FULL150, chuỗi 5 → 6); INSIDE #105 TRUE (FULL151, chuỗi 6 → 7)**; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 29; mù hole-recheck lần 30 NEW=0 (U union-B max 7,861 → 8,643 s — hố lặng giữa hai đợt, chứa #106); CERT/FULL GIỮ 76/91; tuân thủ KHÔNG VI PHẠM — chuỗi 0 vi phạm 1 → 2 (parent quyết). Lưu ý: T2 ghi probe EPERM "boot cea79500 #106" — SAI số hiệu theo T0-186 (cea79500 = #107 đã xác nhận 9 nguồn); T9 dùng số #107.
- T6-186: **(A) 120/120 lần 36** + **#105/#107 KHÔNG GIẾT HOLDER — chuỗi mới = 10 → 11** + prune lần 61 (xóa 2, queue 102 → 100); F-147-T6-1 chuỗi VẪN 0 (lần thứ tám liên tiếp).
- T8-186: **HARNESS 6/6 trên #107; B2 ĐÃ MỞ** (offline ĐẠT, live SẠCH — chưa bắt kẹt thật live); V2 (f'') 4/4 kẹt @125s, V1-300 đối chứng 3/4, 0 FP trên 21 log sạch; **FULL PASS đề xuất 1 → 0 (ĐỨT, thiếu chân lượt yên)**; 84l10 PASS chuỗi 6 đề xuất; 86n2-P1 không kẹt lần 9 đề xuất; B1 live sạch lần thứ tư nếu tính tiếp.

### 2.5 B2 — 183 spike THẬT, 5 cụm, TẤT CẢ trên #107; 0 spike trên boot mới; 0 spike trong span ghim

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **183 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 183): TẤT CẢ trên #107, 5 cụm; 0 spike trên boot mới** (watcher khởi động lại 19:12:xxZ, load1 boot mới max sampler 1,12 < 3,0 — không có spike nào để bắt; khoảng mù qua reboot ~137 s, load1 sampler trong gap 0,03 → 0,75 — không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng trong gap); **0 spike trong span ghim E-230–E-233** — như đợt 177–185; **17 spike trong attempt1 (KHỚP T4, max 5,04) + 31 spike trong attempt3 (KHỚP T4, max 6,24)**; attempt2 0 spike; **14 spike trong cửa sổ guard** (xem §3). 46 spike ≥5,0.

| Cụm | Thời gian (UTC) | n | load1 max |
|---|---|---|---|
| 1. Mở phiên + guard + replay | 17:43:15–17:49:10Z | 71 | 6,16 |
| 2. Attempt1 #55 | 17:54:06–17:55:28Z | 17 | 5,04 |
| 3. Đuôi O8 T0 | 18:00:02–18:01:47Z | 21 | 4,76 |
| 4. Attempt3 #55 | 18:08:32–18:11:04Z | 31 | 6,24 |
| 5. Harness T8 | 18:27:47–18:34:08Z | 43 | 4,06 |

- **Tổng kết: 183/183 spike có process đứng đầu %CPU; load1 đỉnh đợt (watcher, cadence 2 s): 6,24** (đợt 185: 7,76 — đợt này THẤP HƠN; load1 max sampler cadence 60 s là 5,98 — cùng bậc, khác cadence). **0 spike trong span ghim; 0 spike trong cửa sổ O8 T8; 0 spike trong attempt2.** Top driver toàn phiên (đếm từ snapshot top-3): hatch 101 + grep 76 + ps 76 (watcher tự xuất hiện trong snapshot của chính nó — artifact tự quan sát, cùng họ với `ps` đã loại ở quyết (n) đợt 150; không đổi kết luận spike thật vì load1 đo độc lập) + WebKitWebProces 68 + MiniBrowser 66 + bash 43 + hatch-execd 32 + chrome 22 + MainThread 18.
- **Khoảng mù watcher đầu phiên: ~0 phút** (watcher khởi động 17:43:xxZ; spike đầu bắt 17:43:15Z — trùng mẫu sampler đầu). **Khoảng mù qua reboot: ~137 s** (watcher chết ~19:09:52Z, chạy lại 19:12:xxZ; 0 spike trên boot mới sau đó). **0 gap phủ sóng watcher nào khác.**

## 3. Birefnet guard (cơ chế (a) — ⚠️ GUARD BỊ VƯỢT LẦN ĐẦU, 0 lần chạy — F-186-T9-1)

- **⚠️ GUARD BỊ VƯỢT: 3 mẫu liên tiếp ≥ guard (6.291.456 kB = 6.144 MiB) trên #107: 17:48:05Z avail 6.466.904 (bal 164.404, load1 5,16); 17:49:05Z avail 6.671.932 = 106,0% guard (bal 0 — balloon xả hết, load1 3,21); 17:50:05Z avail 6.384.376 (bal 376.468, load1 1,87).** Cửa sổ guard mở 17:48:05–17:50:05Z — balloon chưa phồng lại sau boot nên RAM khả dụng thật ~6,4–6,7M. Vượt guard tối đa **380.476 kB** (17:49:05Z). Đây là **lần đầu tiên sau 39 đợt (147–185) có mẫu đạt guard** — chuỗi "0 mẫu ≥ guard" ĐỨT ở đợt 186.
- **KHÔNG có lần chạy birefnet nào kích hoạt.** `sampler.sh` chỉ ghi log, KHÔNG có code trigger — cơ chế (a) "armed" thực chất chỉ là quy ước "T9 phát hiện mẫu ≥ guard thì chạy birefnet", chưa từng có lần nào để thực thi. T9 chỉ phát hiện 3 mẫu này khi phân tích lúc 19:37Z — cửa sổ guard đã đóng từ 17:50:05Z. **`birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` đều KHÔNG tồn tại** trong `round186-t9/`.
- **T9 KHÔNG chạy birefnet đợt này** — đúng brief (e) (KHÔNG chạy birefnet, đừng lách guard): lúc phát hiện (19:37Z) RAM chỉ ~0,5M, xa dưới guard — chạy lúc đó sẽ là chạy KHÔNG đủ điều kiện guard, tức lách guard. **Số lần thử birefnet: 0 — nhưng KHÔNG được đọc là "lần thứ 40 guard chặn đúng".** Chuỗi đếm đúng: **0 lần CHẠY trong 40 đợt (147–186); 0 mẫu ≥ guard trong 39 đợt (147–185) — ĐỨT ở đợt 186 với 3 mẫu.**
- **Bối cảnh cửa sổ guard:** trùng POSTBOOT_PASS #107 (17:48:46Z, repair-sớm-quyết-h, poll=1, CÓ caveat — T5-186) và lúc T4 đang chờ gate0; load1 trong cửa sổ 1,87–5,16 (14 spike B2 — máy đang bận replay); T4 attempt1 bắt đầu 17:53:23Z — SAU khi cửa sổ guard đóng. Một lần chạy birefnet lúc đó (nếu đã kích hoạt kịp) sẽ tranh RAM/CPU với replay + attempt1 — ghi nhận, không phán.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 185); không có thư mục `~/workspace/tmp-t9-186-birefnet/` (không thử gì).
- **Điểm yếu đứng (a)/(b) từ đợt 147 — (a) ĐÃ ĐỔI DẠNG:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s — VẪN ĐÚNG, và nay thêm: sampler không có code trigger nên crossing có bắt được cũng không kích hoạt kịp trong cửa sổ 3 phút; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào chạy birefnet trong 40 đợt). **Đề xuất parent/T10 (F-186-T9-1):** (i) có tính 3 mẫu này là "guard mở lần đầu" không (hay chỉ tính crossing bền ngoài transient đầu boot)? (ii) có thêm auto-trigger vào sampler cho các đợt sau không (kèm lock + cấm chạy trong cửa attempt)? T9 không tự quyết, không tự sửa sampler.

## 4. ENOSPC trong journal (đếm trực tiếp 105 dòng — đợt thứ 35 liên tiếp — lỗi vẫn đang xảy ra trên boot mới tới 19:45:33Z)

- **#107:** đếm trực tiếp **74 dòng lúc 19:01Z** (cả hai grep KHỚP). Dòng đầu **17:36:55Z (boot+17m05s)** — MUỘN, phá mẫu boot+~110s lần thứ hai (sau #104 boot+22m53s, F-182-T9-6); journal bắt đầu 17:20:05Z (boot+15s) nên phủ sóng đầy đủ — lỗi xuất hiện MUỘN thật. Dòng cuối #107 KHÔNG ghi timestamp (chỉ đếm 74 lúc 19:01Z — thiếu sót của T9, xem F-186-T9-6). Phần 19:01Z → reboot 19:09:52Z (~8,9 phút) **KHÔNG đếm được** (journal #107 mất sau reboot); ngoại suy theo nhịp ~0,88 dòng/phút → +~8 dòng → **#107 ≈ 82 dòng (ƯỚC TÍNH)**.
- **Boot mới:** **31 dòng** (đếm trực tiếp lúc đóng 19:54:xxZ — toàn bộ từ lúc mở boot tới lúc đóng; journal bắt đầu 19:10:03Z nên phủ sóng đầy đủ). Dòng đầu **19:11:43Z (boot+111s)** — TRỞ LẠI mẫu #103 (+111s), #102 (+112s), #101 (+108s), #100 (+110s), #99 (+109s), #93 (+114s), #91 (+~120s), #90 (+121s), #95 (+105s), #98 (+103s). Dòng cuối **19:45:33Z** — **0 dòng mới trong ~10 phút cuối phiên (19:45:33–19:55:39Z)** dù nhịp trước đó ~0,88 dòng/phút đều. T9 CHƯA kết luận lỗi đã dừng (có thể service tạm ngừng retry; cần theo dõi đợt 187) — ghi nhận như quan sát (F-186-T9-6).
- **Tổng đợt 186 đếm trực tiếp: 105 dòng** (74 #107 + 31 boot mới) — cận dưới; ngoại suy ≈ **113 dòng** (82 + 31). Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`.
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-186 áp dụng đầy đủ, trừ thiếu sót dòng cuối #107):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (đợt này: #107 cả hai đều 74 lúc 19:01Z; boot mới cả hai đều 31 lúc đóng); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính; (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.
- **Caveat đếm:** `journalctl --list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #107 từ cell (cùng mẫu F-171-T10-4 … F-185-T9-5). Số #107 (74) lấy từ đếm trực tiếp lúc 19:01Z. **Số boot mới (31) đếm được lại đầy đủ từ cell** (journal boot mới còn nguyên lúc đóng).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot mới giữa phiên (T9 bắt trực tiếp, khởi động lại, gap mẫu 137 s) + #107 trước khi đợt mở

- **Boot mới (7ea9d047-963a-4dec-a864-643cf2f01c47, btime 19:09:52Z; số hiệu chờ T0-187 xác minh 9 nguồn — ứng viên #108 theo T8-186).** Btime: `uptime -s` 19:09:52Z. Gap #107→mới = **6.602 s (1h50m02s)** — ngắn hơn mẫu ~7.200 s nhưng cùng bậc. Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #107 19:10:08Z — xem caveat đồng hồ F-186-T9-3); **exec service cũng restart cùng lúc** (sleep kiểm tra bị SIGTERM sau ~460 s — xem F-186-T9-5). T9 khởi động lại 3 daemon lúc 19:12:25–19:12:57Z (**gap mẫu 137 s**; probe tay win-new-open 19:11:50Z = 0 rồi mới đọc journal/uptime). Probe-loop mới chạy lan-2 sau reboot ~19:42:57Z = 0. Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 10 — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#107 (cea79500, btime 17:19:50Z):** TRƯỚC khi đợt mở 23m15s; **T0-186 XÁC MINH 9/9 nguồn tươi** (epoch 1795540790; gap #105→#107 = 14.778 s — chứa #106; O8 PASS 3/3 trên #107; run 185 SUCCEEDED 14:31:59Z + run 186 SUCCEEDED 14:52:42Z — kết cục thuộc T7-186; (m) #105 DƯƠNG +34,931 s). **#105 XÁC NHẬN** (đối chiếu hồ sơ lưu + DB tươi; gap #104→#105 = 7.190 s); **#106 CHƯA XÁC MINH** (F-186-T0-1 — không có btime đo được; khung cứng 14:52:42Z–17:19:50Z; ước tính mẫu ~15:13:32Z, KHÔNG khẳng định; 0 requeue). **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: 4h01m18s không sampler T9** (mẫu cuối đợt 185 13:41:47Z → mẫu đầu đợt 186 17:43:05Z) — chứa reboot #106 + boot #107 + cửa sổ thoáng #107 (không quan sát được). Marker: T0-186 đếm sống qua **59 reboot #49–#107** (đã xác nhận); **boot mới chưa xác nhận** (thuộc T0-187) → sống qua 60 reboot nếu được xác nhận.

### 5.2 T5-186 — POSTBOOT_PASS #107 CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat); #105 KHÔNG CÓ — tổng boot không cờ 23 → 24

- **POSTBOOT_PASS #107 ĐÃ CÓ lúc 17:48:46Z** (T5-186, mode **repair-sớm-quyết-h, poll=1, CÓ caveat** — GST symlink, tools chưa cài, dpkg 768; verify độc lập exit 0). T0 O8 bắt đầu 9m35s sau cờ (17:58:21Z). **Cửa sổ guard 17:48:05–17:50:05Z ôm lấy thời điểm cờ** (xem §3).
- **POSTBOOT_PASS #105 KHÔNG CÓ — KHÔNG THỬ REPAIR** (boot đã chết theo #106; tiền lệ #100/#83); **tổng boot không cờ 23 → 24 nếu parent chấp nhận** (quyết (c) đợt 186). **#106 CHƯA XÁC MINH** (thuộc T0-186/T10).
- **POSTBOOT_PASS boot mới CHƯA CÓ** — T5-186 đã đóng cờ trước reboot (19:09:52Z); watcher-186 hạn 20:35:00Z. Thuộc T5-187.

### 5.3 Các luồng khác — T7 CHƯA đóng; (m)/INSIDE/mù thuộc T2-186; harness T8 6/6; B2 đã mở

- T7-186 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~19:54Z) — kết cục run 185/186 + DR/HB + cửa slot thuộc T7-186/T10. T9 đóng đúng hạn cờ, không chờ T7 (cùng mẫu đợt 177–185, theo quyết (l) đợt 152). T0-186 ghi: scheduler gap 15:15:34Z–17:35:40Z = 8.406 s, tái diễn giống hệt OUTAGE 179 — T7-186 phán cuối; run 185 SUCCEEDED 14:31:59Z (+232 s) + run 186 SUCCEEDED 14:52:42Z, claimed→finished 94 s / 128 s — 2 ỨNG VIÊN CA ≥60 s mới (T7 phán).
- T0-186: #105 XÁC NHẬN (đối chiếu hồ sơ lưu); #106 CHƯA XÁC MINH (F-186-T0-1); #107 XÁC NHẬN 9/9 nguồn tươi; O8 PASS 3/3 trên #107 (17:58:21–18:01:22Z); libevent heal lần 2 (vắng 17:41Z → có 17:50Z sau replay). T1-186: verify 185 PASS (chuỗi khớp lần thứ 97); GAP §112 prose ĐÃ CẬP NHẬT (F-185-T1-1 ĐÓNG). T2-186: (m) #104 KHÔNG CÓ ĐIỂM + (m) #105 DƯƠNG + INSIDE #104/#105 TRUE (FULL150/FULL151, chuỗi 5 → 6 → 7) + mù (hole-recheck lần 30) + (m) #56 lần 29 — theo cờ T2-186 (T9 không phán thay T2). T5-186: POSTBOOT_PASS #107 CÓ (repair, poll=1, caveat); hướng (3) VẪN ĐỨNG lần 33. T6-186: (A) 120/120 lần 36; #105/#107 KHÔNG GIẾT HOLDER (chuỗi 10 → 11); prune lần 61 (xóa 2, queue 102 → 100).

## 6. Sai số / caveat (F-186-T9-*)

- **F-186-T9-1 — GUARD BỊ VƯỢT LẦN ĐẦU SAU 39 ĐỢT: 3 MẪU LIÊN TIẾP ≥ GUARD, 0 LẦN CHẠY BIREFNET (PHÁT HIỆN LỚN NHẤT ĐỢT — XEM §3).** 17:48:05Z (6.466.904) → 17:49:05Z (6.671.932 = 106,0% guard, bal 0) → 17:50:05Z (6.384.376) — balloon xả về 0 đầu boot #107, quanh POSTBOOT_PASS #107 (17:48:46Z). Sampler không có code trigger nên không kích hoạt kịp; T9 phát hiện lúc phân tích 19:37Z khi cửa sổ đã đóng. **0 lần chạy birefnet — KHÔNG được đọc là "lần thứ 40 guard chặn đúng"** (chuỗi 0 mẫu ≥ guard ĐỨT; chuỗi 0 lần chạy vẫn 40 đợt). Parent/T10 quyết: (i) có tính là "guard mở lần đầu" không; (ii) có thêm auto-trigger vào sampler cho đợt sau không (kèm lock + cấm chạy trong cửa attempt).
- **F-186-T9-2 — TÁCH E-232/E-233: CHỈ ĐÚNG 3 MẪU DƯỚI TRẦN, MẪU CUỐI THIẾU 32.672 kB (T9 phán TÁCH, T10/parent quyết cuối).** Tách 19:49:26Z (6.247.216) → 19:50:26Z (6.316.892) → 19:51:26Z (6.411.152) — đúng ngưỡng ≥3 mẫu, mẫu cuối near-miss (nhẹ hơn F-185-T9-2: thiếu 4.132 kB). Phương án gộp (1 episode 14 mẫu, vẫn ghim) ghi ở §2.2; tổng ghim 21 KHÔNG đổi. **Sàn 6.050.608 kB GIỮ 9 lần** (dip 19:31:25Z giữa lúc leo KHÔNG tính); **sag 6.247.216 kB 2 lần** (19:03:07Z sau chạm-trần-1-mẫu — không tính; 19:49:26Z sag kết thúc E-232 — tính).
- **F-186-T9-3 — ĐỒNG HỒ CELL NHANH TRƯỚC REBOOT BOOT MỚI (~16–30 s) — GIAO T0-187.** Mẫu sampler cuối trên #107 ghi 19:10:08Z — SAU btime boot mới (19:09:52Z) 16 s và SAU /proc/1 mtime boot mới (19:10:03Z) 5 s, dù mẫu mang boot_id cũ. Giải thích đứng (tiền lệ #103/#99): đồng hồ cell nhanh trước reboot; thời gian thật của mẫu cuối ≈ 19:09:38–48Z. /proc/1 mtime boot mới (19:10:03Z = btime +11s) khớp mẫu #102/#104 — ủng hộ btime 19:09:52Z. T9 không tự sửa timestamp log; E-230 vẫn tính 3 mẫu (19:08:08–19:10:08Z theo log).
- **F-186-T9-4 — CẢ HAI CỬA SỔ THOÁNG ĐỀU KHÔNG QUAN SÁT ĐƯỢC — LẦN ĐẦU 2 BOOT LIÊN TIẾP (XEM §1).** #107: mở phiên boot+23m; boot mới: probe đầu boot+118s = 0 (độ trễ exec ~64 s sau khi phát hiện reboot lúc boot+54s nuốt mất cửa sổ). Không kết luận cửa sổ có mở hay không — chỉ kết luận không đo được. Bài học: sau khi phát hiện reboot, probe tay phải chạy trong cùng một lượt exec với lệnh kiểm tra.
- **F-186-T9-5 — EXEC SERVICE RESTART GIẾT SLEEP KIỂM + REBOOT GIẾT DAEMON (tái diễn F-185-T9-5 lần 9).** Sleep nền chờ lượt kiểm bị SIGTERM khi exec service restart đi kèm reboot (~19:09:52Z). T9 bắt được reboot trong lượt kiểm tay ngay sau (boot_id đã đổi lúc 19:10:46Z), khởi động lại daemon 19:12:25–19:12:57Z (gap mẫu 137 s) + probe tay win-new-open (boot+118s = 0, xem F-186-T9-4). KHÔNG mất số liệu sampler (log đóng băng đầy đủ 130 mẫu).
- **F-186-T9-6 — ENOSPC: (a) DÒNG ĐẦU #107 MUỘN boot+17m05s — F-182-T9-6 LẶP LẠI (lần thứ hai); DÒNG ĐẦU BOOT MỚI TRỞ LẠI boot+111s (ghi nhận). (b) T9 KHÔNG ghi timestamp dòng cuối #107** (chỉ đếm 74 lúc 19:01Z) — journal #107 đã mất, không bù được; rút kinh nghiệm: đợt sau ghi đủ 6 điểm (cả dòng cuối) ở MỖI lần đếm giữa phiên. **(c) Dòng ENOSPC boot mới NGỪNG ~10 phút cuối** (dòng cuối 19:45:33Z, 0 dòng mới tới 19:55:39Z) — CHƯA kết luận lỗi đã dừng; theo dõi đợt 187.
- **F-186-T9-7 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm 1 → 2 — CHỜ parent quyết cuối).** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail ngay ở watch đầu, không tạo tải; không chạy trong cửa sổ attempt T4); 17/31 spike B2 trong cửa sổ attempt1/attempt3 là tải của chính attempt (KHỚP T4 — WebKitWebProcess đứng đầu); 0 spike B2 trong span ghim. T4-186 phán 0 vi phạm phía T4; T2-186 phán tuân thủ KHÔNG VI PHẠM — parent quyết cuối về chuỗi. **T7 CHƯA đóng cờ lúc T9 đóng (~19:54Z) + T9 ĐÓNG ĐÚNG HẠN CỜ** (không chờ T7; cùng mẫu đợt 177–185, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).

- **Caveat đứng:** probe cap 30.000 (giá trị mở các boot trước là censored — chỉ biết ≥ 30.000; đợt này không đo được lần mở nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay thêm: không có code trigger, xem F-186-T9-1); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #107 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 186 (chỉ đọc log đóng băng); T7-186 chưa đóng nên không có cửa sổ T7 để đối chiếu; boot mới chưa xác minh 9 nguồn (thuộc T0-187); fixture /tmp mất theo reboot boot mới — T8-186 đã rebuild 18:28Z trước reboot, sau reboot CHƯA rebuild lại (thuộc T8-187); E-233 còn ghim lúc đóng — kết cục thuộc T9-187.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (130 mẫu, 17:43:05–19:53:26Z): `round186-t9/ram-sampler-FROZEN.log` — md5 `8103e547ed19611578f43326d2b3d0b1`. Log B2 đóng băng (183 spike): `round186-t9/b2-spikes-FROZEN.log` — md5 `0669a02382179de42f3e6ad701db6485`. Log headroom đóng băng (7 lần đo): `round186-t9/headroom-log-FROZEN.txt` — md5 `27cebfbed20a7e99f0d819a9aeadf0ad`. Phân tích bằng script: `round186-t9/t9-186-analyze.py` (output: `round186-t9/t9-186-analyze-output.txt`). Ghi chú baseline: `round186-t9/t9-186-baseline-notes.md`. Probe tay cửa sổ boot mới: `round186-t9/probe-once.py`. T10 đọc log đóng băng trực tiếp khi cần.
