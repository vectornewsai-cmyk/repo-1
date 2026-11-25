# LIMITS — Phase 9 đợt 183, T9: headroom + RAM + birefnet (0 thử lần 37; reboot #102 mới; E-218 kết thúc bởi reboot #101; E-219 mới + E-220 đang ghim; cửa sổ thoáng #102 MỞ 30.000; ENOSPC lần 32, phương pháp đếm ĐÃ LÀM RÕ)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (8 lần đo: 0, 0, 0, 30.000, 0, 0, 0, 0; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 43 liên tiếp**. Số 2 đợt 182 KHÔNG giữ sang đợt này (0, 0, 0 trên #101). Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG #102: QUAN SÁT ĐƯỢC + MỞ — 30.000 (CHẠM CAP) lúc boot+62s, ĐÓNG trước boot+142s.** Lần mở đầu tiên kể từ #96 (2.903); lớn nhất từng đo. Cửa sổ rộng tối đa ~80 s. **#101: KHÔNG QUAN SÁT ĐƯỢC** (đợt mở sau khi cửa sổ đóng).
- **Balloon: E-218 (7) KẾT THÚC BỞI REBOOT #101; E-219 (2) mới trên #101, kết thúc bởi sag; E-220 (6) ĐANG GHIM trên #102 lúc đóng — kết cục thuộc T9-184.** Tổng ghim **8/115 (7,0%)** — thấp nhất kể từ đợt 180 (16,4%).
- **RAM: 115 mẫu, 05:41:41Z–07:37:05Z, HAI boot (#101: 86; #102: 29).** Max **2.943.660 kB (46,8% guard)** lúc 06:08:42Z (#101); min **403.492 kB** lúc 06:43:43Z (#101); mean 1.126.608,7 kB; gate A **50/115**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 37 liên tiếp**.
- **B2: 93 spike THẬT, 3 cụm, TẤT CẢ trên #101; 0 spike trên #102; 0 spike trong cửa sổ attempt T4 #52; 0 spike trong span ghim E-219/E-220; 26 spike trong cửa sổ O8 T0.**
- **Lượt yên #52 (T4): CÓ LƯỢT HỢP LỆ — attempt1-51745634: 20/20 + lớp B 5/5, tickCost median 44,0 ms — CHUỖI LƯỢT YÊN HỢP LỆ 44 → 45.** T9 đối chiếu sampler trong cửa sổ attempt: gate A 4/4, load1 0,33–0,81, 0 mẫu ghim. **0 vi phạm — chuỗi 0 vi phạm 4 → 5** (theo T4).
- **REBOOT #102 MỚI GIỮA PHIÊN** (boot `6ecd948e`, btime 07:07:05Z, gap #101→#102 = 6.878 s — số hiệu + btime chờ T0-184 xác minh 9 nguồn); giết sampler/watcher/probe-loop T9; T9 khởi động lại, gap mẫu 141 s. **#101 XÁC NHẬN 9 nguồn (T0-183)** — nợ đợt 182 đã trả.
- **ENOSPC: đếm trực tiếp 92 dòng (66 #101 + 26 #102) — đợt thứ 32 liên tiếp có lỗi thật — lỗi KHÔNG dừng trên cả hai boot** (F-182-T9-6 KHÔNG lặp lại). Ngoại suy #101 ≈ 99 → tổng đợt ≈ 125 dòng.
- **ĐÃ LÀM RÕ chênh ENOSPC #99 T5 (80) vs T9 (76): chỉ khác THỜI ĐIỂM đếm, không phải phương pháp** — xem §4 (phương pháp chuẩn từ đợt 183).
- **ĐÍNH CHÍNH NGUỒN (F-183-T9-1): §12.3 aggregate 182 đã bị ĐIỀN SẴN lần thứ 16 lúc 05:27Z; parent đã đính chính aggregate lúc 05:44:21Z (nay 79.228 B). T9-183 dùng BẢN ĐÃ ĐÍNH CHÍNH (dòng 194–200, mtime 05:44:21Z): (a) CHẤP NHẬN 182; (b) chuỗi FULL PASS VỀ 0 (không phải GIỮ 1); (c) #100 KHÔNG cờ, tổng boot không cờ GIỮ 22; (q) số thứ tự đếm là 87.** Mọi đánh giá chuỗi trong LIMITS này theo bản đã đính chính.
- **T7 CHƯA đóng lúc T9 đóng (~07:38Z)** — như T7-180/181/182. Không push, không sửa production, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 182 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả hai boot.

### 1.2 Số đo đợt 183 (8 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 05:42:04Z | **0** | #101 51745634 | 63.747 | cặp mở (boot+29m37s) |
| 06:12:04Z | **0** | #101 | 63.747 | lan-2 (boot+59m37s) |
| 06:42:04Z | **0** | #101 | 63.747 | lan-3 (boot+1h29m37s) |
| 07:08:07Z | **30.000** | #102 6ecd948e | 63.747 | **TRONG cửa sổ thoáng (boot+62s) — CHẠM CAP** |
| 07:09:27Z | **0** | #102 | 63.747 | **TRONG cửa sổ thoáng (boot+142s)** |
| 07:10:24Z | **0** | #102 | 63.747 | **TRONG cửa sổ thoáng (boot+199s)** |
| 07:11:18Z | **0** | #102 | 63.747 | **TRONG cửa sổ thoáng (boot+247s)** |
| 07:37:21Z | **0** | #102 | 63.747 | cặp đóng (tay, boot+30m16s); E-220 ĐANG GHIM |

- **CỬA SỔ THOÁNG #102: QUAN SÁT ĐƯỢC + MỞ — LẦN ĐẦU KỂ TỪ #96.** Btime 07:07:05Z (uptime-based, chờ T0-184 xác minh 9 nguồn); dải mẫu boot+53–245s ≈ 07:07:58–07:11:10Z. Probe mở của probe-loop (khởi động lại sau reboot) lúc boot+62s = **30.000 — CHẠM CAP 30.000, tức headroom thật ≥ 30.000** (probe dừng vì đủ cap, không phải vì hết watch — giá trị thật không đo được, chỉ biết ≥ 30.000). Probe tay win142 lúc boot+142s = **0**; win187 (boot+199s) = **0**; win247 (boot+247s) = **0**. **Cửa sổ MỞ rồi ĐÓNG trong khoảng (62s, 142s] — rộng tối đa ~80 s** (có thể hẹp hơn nhiều; không probe nào rơi vào giữa +62s và +142s). Chuỗi "quan sát được lần mở" NỐI LẠI ở #102 sau khi đứt từ #96 (chỉ #96 mở 2.903; #97/#98 không quan sát được; #99/#100/#101 quan sát được nhưng 0 hoặc không quan sát được). Giá trị 30.000 (censored, ≥ 30.000) vượt mọi lần mở từng đo (đỉnh chuỗi cũ 4.438; #96 2.903). **Caveat:** probe cap 30.000 nên không biết headroom thật lúc mở là 30.0xx hay ~60.000 — chỉ khẳng định ≥ 30.000 và cửa sổ đã đóng trước boot+142s.
- **CỬA SỔ THOÁNG #101: KHÔNG QUAN SÁT ĐƯỢC** (T9-183 mở phiên 05:41Z = boot+28m35s, sau khi cửa sổ đóng; dải mẫu boot+53–245s ≈ 05:13:20–05:16:32Z đã qua). Không luồng nào khác probe headroom trong cửa sổ #101.
- **Headroom cuối phiên: 0 — SỐ 2 ĐỢT 182 KHÔNG GIỮ.** 3 lần đo trên #101 đều = 0 (mở/lan-2/lan-3); 3/4 lần đo trên #102 sau cửa sổ đều = 0 (win142/win187/win247/cặp đóng). Số watch giữ ngoài cell lúc đóng: **63.747**. Tỉ lệ so với nhu cầu vite (~1.578): **~0** — một vite mới vẫn không khởi động được (như mọi đợt từ 152). **Trần KHÔNG ĐỔI trong boot** (63.747 trên #101 và #102).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt: **… → 0 → 2 → 0 → 2 → 2 → 0 → 2 → 0 → 2 → 2 → 0 → 0 → 0 → 0 → 0 → 2 → 0**. Gần nhất: 178 đóng 0; 179 đóng 0; 180 đóng 0 (1 lần đo giữa phiên 2.903); 181 đóng 0 (toàn 0, 7 lần đo); 182 đóng 2 (3 lần 0 đầu phiên + 4 lần 2); **183 đóng 0 (7 lần 0 + 1 lần 30.000 chạm cap giữa phiên)**.

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 0.** Lần mở 30.000 trên #102 là sự kiện giữa phiên, không phải mức nền — headroom đóng 0 như 5/7 đợt gần nhất.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 43 liên tiếp.** Quyết parent đợt 182 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới: journal đợt này có 92 dòng lỗi ENOSPC đếm trực tiếp (xem §4)** — đợt thứ 32 liên tiếp — và lỗi KHÔNG dừng trên cả hai boot (khác #100 đợt 182). T9 chỉ nêu dữ kiện + tương quan, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 115 mẫu, 05:41:41Z–07:37:05Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot #102: 141 s** (mẫu cuối #101 07:06:43Z → mẫu đầu #102 07:09:04Z); **gap giữa hai đợt: 56'24" không sampler T9** (mẫu cuối T9-182 04:45:17Z → mẫu đầu T9-183 05:41:41Z — chứa reboot #101 05:12:27Z + khoảng mù E-218, xem §2.2); **0 gap >90 s khác trong phiên** (gap lớn thứ hai 61 s — jitter cadence bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 05:41:41–06:08:42Z | #101 | 818.520–2.943.660 kB | Mở sampler; balloon leo/xả; **80 spike B2**; O8 T0 PASS 3/3 |
| 06:09:42–06:27:42Z | #101 | 489.596–2.899.212 kB | Balloon leo đơn điệu tới trần; **lượt yên #52 CÓ lượt hợp lệ** (attempt 06:04:34–06:07:58Z — xem §2.3) |
| 06:28:42–06:29:42Z | #101 | 504.768–512.404 kB | **E-219 2 mẫu ghim**; gate A 0/2; 0 spike B2 |
| 06:30:42–06:43:43Z | #101 | 403.492–1.698.556 kB | Sag kết thúc E-219 (bal 6.050.608 = sàn, lần 7); **RAM min phiên 403.492 kB** |
| 06:44:43–07:06:43Z | #101 | 512.404–2.869.892 kB | Balloon leo/xả; **13 spike B2** (06:55–06:56Z); reboot #102 giết sampler |
| 07:09:04–07:31:04Z | #102 | 544.444–1.609.248 kB | Boot #102 mới; balloon leo đơn điệu tới trần; 2 lần chạm giá trị sag 6.247.216 (07:26:04Z + 07:29:04Z — xem F-183-T9-3) |
| 07:32:05–07:37:05Z | #102 | 536.476–580.672 kB | **E-220 6 mẫu ĐANG GHIM lúc đóng**; gate A 0/6; 0 spike B2 |

- **Gate A ≥1024 MiB: 50/115 mẫu** (42/86 trên #101 + 8/29 trên #102); **0 mẫu ≥ guard**; load1 max (sampler) **5,05** (05:59:42Z, #101 — trong O8 T0); **RAM <512.000 kB: 7 mẫu** (6,1% — tất cả trên #101, 3 dải — xem dưới); **RAM <300.000 kB: 0 mẫu**.
- Swap: SwapFree 628.848 kB (mẫu đầu #101) → 570.016 kB (mẫu cuối #101) → **1.008.448 kB (mẫu đầu #102 — NHẢY +438.432 kB qua reboot #102)** → 636.000 kB (mẫu cuối, 07:37:05Z). Nhịp nhảy SwapFree qua reboot: #102 nhả ~438.432 kB (đợt 182: #100 nhả ~347.632 kB; #99 nhả ~372.324 kB; #96 nhả ~403.960 kB; #95 nhả ~331.952 kB; #93 nhả ~268.104 kB; #91 nhả ~376.948 kB).
- Trũng RAM đợt này: min **403.492 kB (06:43:43Z, #101, sau E-219)** — sâu thứ tư trong các log T9 (kỷ lục 225.224 kB đợt 180; đợt 179: 333.672 kB; đợt 181: 363.464 kB; đợt 182: 391.344 kB — đợt này min THẤP HƠN đợt 182 nhưng CAO HƠN đợt 180/181). Lúc đó balloon 5.976.048 kB, load1 0,31 — balloon chưa ghim trần nhưng RAM trũng sâu; sag ngay sau (bal 5.622.548 kB lúc 06:44:43Z), KHÔNG kẹt. 7 mẫu <512.000 kB trong 115 mẫu (6,1%; đợt 182: 36/114 = 31,6% — tỉ lệ GIẢM MẠNH do #101 ghim ít).

**Bảng tổng hợp số RAM (từ script `t9-183-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 115 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #101 51745634 | 86 | 403.492 | 2.943.660 | 1.213.921,7 | 42/86 | 2 | 5,05 | 7 |
| #102 6ecd948e | 29 | 536.476 | 1.609.248 | 867.680,3 | 8/29 | 6 | 3,04 | 0 |
| **Toàn phiên** | **115** | **403.492** | **2.943.660** | **1.126.608,7** | **50/115** | **8/115 (7,0%)** | **5,05** | **7** |

- **Mean toàn phiên 1.126.608,7 kB — 2 cách độc lập: python `sum/n = 1.126.608,7` VÀ trung bình có trọng số ((86×1.213.921,7 + 29×867.680,3)/115 = 1.126.608,7) — KHỚP CẢ HAI.**
- 7 mẫu RAM <512.000 kB, 3 dải (từ script python trên log đóng băng): #101: 06:29:42–06:30:42Z (2); 06:37:43–06:38:43Z (2); 06:42:43–06:44:43Z (3). Tổng 2+2+3 = 7 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-218 KẾT THÚC BỞI REBOOT #101 + E-219 MỚI + E-220 ĐANG GHIM

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #101 và #102** (max bal trong log = đúng CEIL trên cả hai boot).
- **E-218 — KẾT THÚC BỞI REBOOT #101 (nợ đợt 182 đã trả).** 7 mẫu trong log đóng băng đợt 182 (04:39:17–04:45:17Z, #100); reboot #101 (05:12:27Z) kết thúc mọi trạng thái ghim trên #100 — balloon reset trên boot mới (mẫu đầu #101 05:41:41Z bal 4.674.352 kB = 72,5%). **Khoảng mù 27'10" giữa hai đợt (04:45:17Z → 05:12:27Z) không cho biết balloon có sag trước reboot hay ghim tới lúc reboot** — grep Balloon/MemAvailable trong round182-t7 + round182-t8 = **0 dòng**: KHÔNG luồng nào khác có số liệu RAM trong khoảng mù. T9 chỉ phán kết cục quan sát được: kết thúc bởi reboot #101. **E-218 = 7 mẫu — không cộng điểm đọc tay** (điểm CEIL đọc tay 23:54:13Z parent 181 đã quyết KHÔNG TÍNH).
- **Boot #101: GHIM 2/86 mẫu (2,3%), 1 EPISODE MỚI (E-219).** Balloon leo/xả nhiều chu kỳ, chỉ chạm trần 1 lần. **E-219 — 06:28:42–06:29:42Z, 2 mẫu** (RAM 504.768–512.404 kB; mẫu trước 06:27:42Z bal 6.397.412 kB = 99,29%), **KẾT THÚC bởi sag** (06:30:42Z bal **6.050.608 kB = 93,9% — GIÁ TRỊ SÀN, LẦN THỨ 7**, xem F-183-T9-3). E-219 là episode NGẮN NHẤT kể từ E-213 (2 mẫu là tối thiểu theo quy tắc cơ học ≥2 mẫu CEIL liên tiếp).
- **Boot #102: GHIM 6/29 mẫu (20,7%), 1 EPISODE ĐANG GHIM (E-220).** Balloon leo đơn điệu từ 5,23M (07:09:04Z) tới trần, với 2 lần chạm giá trị sag 6.247.216 kB giữa đường leo (07:26:04Z + 07:29:04Z — micro-sag, KHÔNG tách episode vì chưa có mẫu CEIL nào trước đó trên #102, xem F-183-T9-3). **E-220 — 07:32:05–07:37:05Z, 6 mẫu** (RAM 536.476–580.672 kB; mẫu trước 07:31:04Z bal 6.442.564 kB = 99,98% — chỉ thiếu 1.260 kB là tới trần), **ĐANG GHIM lúc T9 đóng** — kết cục (sag/dip/reboot) thuộc T9-184.
- **Tổng ghim trần đợt này: 8/115 mẫu (7,0%)** (đợt 182: 44/114 = 38,6%; đợt 181: 34/123 = 27,6%; đợt 180: 19/116 = 16,4%; đợt 179: 27/131 = 20,6%; đợt 178: 53/137 = 38,7% — đợt này THẤP NHẤT trong chuỗi 6 đợt). Tỉ lệ ghim trên #101 (2,3%) thấp nhất kể từ #99 đợt 181 (17,9% — nhưng đó là tỉ lệ trên boot cũ); trên #102 (20,7%) cao hơn hẳn — balloon leo trần nhanh hơn trên boot mới (E-220 bắt đầu boot+25m00s).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-219 là EPISODE MỚI (2 mẫu CEIL liên tiếp, sag tách rõ); E-220 đang ghim — chưa phán kết cục. Các khoảng tách đều ≥2 mẫu dưới trần — KHÔNG có micro-dip 1 mẫu gây tranh cãi. **Không có phương án gộp nào cần xét đợt này.**
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-220 chỉ ~536–581.000 kB trong khi tổng RAM − balloon = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #52 (T4) — CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ 44 → 45 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#52 CÓ LƯỢT HỢP LỆ — attempt1-51745634: 20/20 + lớp B ĐẠT 5/5, tickCost median 44,0 ms ≤ 60 — CHUỖI LƯỢT YÊN HỢP LỆ 44 → 45.** Attempt chạy 06:04:34–06:07:58Z trên #101; analyzers chạy NGOÀI cửa sổ attempt 06:07:58–06:08:24Z (quyết (p) đợt 179 — kiểm chứng live lần 3, xem F-183-T4-*). **0 vi phạm theo T4 — chuỗi 0 vi phạm 4 → 5.**
- **Đối chiếu sampler T9 (độc lập, cadence 60 s) trong cửa sổ attempt 06:04:34–06:07:58Z:** 4 mẫu (06:04:42Z, 06:05:42Z, 06:06:42Z, 06:07:42Z): RAM 912.200–1.343.236 kB — **gate A 4/4**; balloon 4.865.840–5.314.912 kB, **0 mẫu ghim**; load1 **0,33–0,81**. **0 spike B2 trong cửa sổ attempt** (xem §2.5).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 05:57:41–06:00:17Z | #101 | 1,08–5,05 (3 mẫu) | 912.200–2.943.660 kB — **gate A 3/3** | **O8 T0 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); **26 spike B2** trong cửa sổ (xem §2.5); 0 mẫu ghim |
| T4 attempt #52 06:04:34–06:07:58Z | #101 | 0,33–0,81 (4 mẫu) | 912.200–1.343.236 kB — **gate A 4/4** | **#52 CÓ lượt hợp lệ 20/20 + B 5/5**; 0 mẫu ghim; **0 spike B2** |
| T8 harness #101 (giờ T8) | #101 | — | — | **Harness 5/6 — 85m4 KẸT THẬT** (exit 124, P1); O8 T8 PASS 3/3; chuỗi FULL PASS GIỮ 0 (đề xuất T8 — parent quyết; mốc 0 theo quyết (b) đã đính chính) |

- T1-183: verify 182 (không chạy lại suite) → không có cửa sổ T1 để đối chiếu (như đợt 177–182). T7-183 CHƯA đóng → không có cửa sổ T7 (thuộc T9-184 nếu T7 đóng muộn). T4-183: attempt #52 hợp lệ (xem §2.3). T8-183: harness 5/6 — 85m4 kẹt thật (P1); kẹt cộng dồn 25 → 26; 86n2-P1 không kẹt 6 → 7 lần; (c')/(f') theo T8.
- T5-183: **POSTBOOT_PASS #101 ĐÃ CÓ 05:56:42Z** (repair-sớm-quyết-h, poll=1, CÓ caveat; tools KHÔNG CÀI; GST symlink → debroot); **#100 KHÔNG CÓ cờ — KHÔNG bù được** (boot đã chết; tổng boot không cờ GIỮ 22 — theo quyết (c) đã đính chính). O8 T0 bắt đầu 05:57:41Z — 59 s sau cờ #101.

### 2.5 B2 — 93 spike THẬT, 3 cụm, TẤT CẢ trên #101; 0 spike trên #102; 0 spike trong cửa sổ attempt + 0 spike trong span ghim

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **93 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 93): TẤT CẢ trên #101, 3 cụm; 0 spike trên #102 (watcher khởi động lại 07:09Z, load1 #102 max 3,04 — chỉ 1 mẫu sampler ≥3,0, không spike nào bắt được trong cadence 2 s; không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng trong gap reboot 141 s); 0 spike trong span ghim E-219 (06:28:42–06:29:42Z) + E-220 (07:32:05–07:37:05Z) — như đợt 177–182; 0 spike trong cửa sổ attempt T4 #52 (06:04:34–06:07:58Z).** 26 spike trong cửa sổ O8 T0 (05:57:41–06:00:17Z).

| Cụm | Thời gian (UTC) | n | load1 max | Driver đứng đầu |
|---|---|---|---|---|
| 1. Mở phiên + T1 crosscheck | 05:42:03–05:45:xxZ | 41 | 3,69 | crosscheck-183-* (22) + store (10) + grep (9) — T1 verify + sweep/grep |
| 2. O8 T0 + replay host | 05:51:xx–06:00:20Z | 39 | 5,49 | WebKitWebProcess (15) + chrome (9) + find (7) + ps (3) + dpkg (2) + esbuild (2) + hatch (1) — driver đúng là trình duyệt đo (O8 T0) + replay host |
| 3. Chrome | 06:55:39–06:56:39Z | 13 | 3,86 | chrome (12) + MainThread (1) — trình duyệt (T8 harness/O8 cửa sổ lân cận) |

- **Tổng kết: 93/93 spike có process đứng đầu %CPU; load1 đỉnh đợt (watcher, cadence 2 s): 5,49** (đợt 182: 10,44 — đợt này THẤP HƠN NHIỀU; load1 max sampler cadence 60 s là 5,05 — cùng bậc, khác cadence). **26 spike trong cửa sổ O8 T0; 0 spike trong cửa sổ attempt T4 #52; 0 spike trong span ghim.**
- **Khoảng mù watcher đầu phiên: ~1 phút** (watcher khởi động 05:41Z; spike đầu bắt 05:42:03Z — trước đó load1 sampler 2,09, không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng <3,0 trong gap). **Khoảng mù qua reboot #102: ~141 s** (watcher chết ~07:07Z, chạy lại 07:09Z; 0 spike trên #102; load1 sampler trong gap 0,19 → 3,04 — 1 mẫu ≥3,0 lúc 07:09:04Z nhưng watcher chưa chạy lại kịp). **0 gap phủ sóng watcher nào khác.**

## 3. Birefnet guard (cơ chế (a) — 0 lần thử, lần thứ 37)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round183-t9/sampler.sh` chạy 05:41:41Z–07:37:05Z (2 instance: instance 1 sống 05:41:41Z–07:06:43Z trên #101 rồi **CHẾT theo reboot #102**; instance 2 khởi động lại 07:09:04Z trên #102, sống tới khi T9 dừng tay ~07:37Z — **1 gap qua reboot (141 s), 0 gap >90 s khác; max gap trong boot 61 s**), **115 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.943.660 kB = 46,8% guard** (đợt 182: 79,9%; đợt 181: 42,6%; đợt 180: 38,83%; đợt 179: 40,52%; đợt 178: 66,35%; đợt 177: 41,78%; đợt 176: 48,52%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **3.347.796 kB (53,2%)**. **Caveat (F-179-T9-4 đợt 178): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 183 — lần thứ 37 liên tiếp** (đợt 147–183: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 37 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round183-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 182); không có thư mục `~/workspace/tmp-t9-183-birefnet/` (không thử gì).

## 4. ENOSPC trong journal (đếm trực tiếp 92 dòng — đợt thứ 32 liên tiếp — lỗi KHÔNG dừng trên cả hai boot) + PHƯƠNG PHÁP ĐẾM ĐÃ LÀM RÕ

- **#101:** đếm trực tiếp **66 dòng lúc 06:29:27Z** (dòng đầu 05:14:15Z = boot+108s; dòng cuối đếm được 06:28:45Z). Phần 06:29:27Z → reboot 07:07:05Z (~37,6 phút) **KHÔNG đếm được** (journal #101 mất sau reboot #102 — `--list-boots` lúc đóng chỉ còn idx 0 #102); ngoại suy theo nhịp ~0,88 dòng/phút ≈ **+33 dòng → #101 ≈ 99 dòng**.
- **#102:** **26 dòng** (đếm trực tiếp lúc đóng 07:37:37Z — toàn bộ từ lúc mở boot tới lúc đóng; journal bắt đầu 07:07:16Z nên phủ sóng đầy đủ). Dòng đầu **07:08:57Z (boot+112s)** — khớp mẫu #101 (boot+108s), #100 (boot+110s), #99 (boot+109s), #93 (boot+114s), #91 (boot+~120s), #90 (boot+121s), #95 (boot+105s), #98 (boot+103s). Dòng cuối **07:37:34Z** — lỗi VẪN ĐANG XẢY RA lúc đóng (nhịp ~0,91 dòng/phút, đều). **F-182-T9-6 KHÔNG LẶP LẠI: lỗi không dừng trên #101 (tới 06:28:45Z) lẫn #102 (tới 07:37:34Z)** — mẫu dừng giữa boot trên #100 đợt 182 là ca đơn lẻ, chưa thành mẫu mới.
- **Tổng đợt 183 đếm trực tiếp: 92 dòng** (66 #101 + 26 #102) — cận dưới; ngoại suy ≈ **125 dòng** (92 + ~33 phần #101 không đếm được). Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut).
- **Caveat đếm:** `journalctl --since` / `--list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #101 từ cell (cùng mẫu F-171-T10-4, F-176-T9-5, F-177-T9-5, F-178-T9-5, F-179-T9-5, F-180-T9-5, F-181-T9-5, F-182-T9-5). Số #101 (66) lấy từ đếm trực tiếp lúc 06:29:27Z — ghi trong baseline notes + §4 này. **Số #102 (26) đếm được lại đầy đủ từ cell** (journal #102 còn nguyên lúc đóng).

### 4.1 LÀM RÕ chênh ENOSPC #99: T5 (80) vs T9 (76) — CHỈ KHÁC THỜI ĐIỂM ĐẾM (giao T9-183, quyết (l) đợt 182)

- **Kết luận: KHÔNG phải lệch phương pháp.** Cả hai lần đếm dùng CÙNG phương pháp: `journalctl` trên journal boot hiện tại (#99), đếm dòng chứa `No space left on device`; đối chiếu `grep inotify` cho cùng số (T5-182 §7: grep "inotify" cũng 80 — đều là inotify_add_watch của home-assistant-ensure.service).
- **Bằng chứng chênh 4 dòng = thời gian:** T9-182 đếm **76 dòng lúc 02:53:42Z** (ghi trong baseline notes T9-182); T5-182 đếm lại **80 dòng lúc 02:58:11Z** — và T5 TỰ GHI chuỗi tăng trong Phụ lục LIMITS T5-182: **76 (02:53Z) → 78 (02:55:51Z) → 79 (02:57:16Z) → 80 (02:58:11Z)**, nhịp ≈0,85 dòng/phút, đều qua các khung 10'. +4 dòng trong 4m29s ≈ 0,89 dòng/phút — KHỚP nhịp đo được. Hai con số là hai snapshot cùng một dòng lỗi đang tăng, không phải hai phương pháp đếm khác nhau.
- **Phương pháp chuẩn từ đợt 183 (đề xuất T9, giao T10/parent chốt):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `journalctl -b 0 | grep -c inotify` — hai số PHẢI KHỚP nhau (đợt 183: #102 cả hai đều 26 lúc đóng); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (không cộng vào số đếm trực tiếp); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới (cùng mẫu F-182-T5-3: số 27 #99 của T9-181 là snapshot sớm). Tổng đợt 181 GIỮ 117 theo quyết (l) đợt 181 (không đếm lại được #98) — không đổi.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #102 mới giữa phiên (T9 bắt trực tiếp, khởi động lại 141 s gap mẫu) + #101 trước khi đợt mở

- **#102 (6ecd948e, btime 07:07:05Z; số hiệu + btime chờ T0-184 xác minh 9 nguồn).** Btime: `uptime -s` 07:07:05Z; epoch `/proc/stat` btime 1795504025; journal idx 0 duy nhất, first entry 07:07:16Z = btime +11 s. Gap #101→#102 = **6.878 s (1h54m38s — TRỞ LẠI mẫu ~2 giờ)**. Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #101 07:06:43Z — 22 s TRƯỚC btime, trong khoảng bình thường). T9 khởi động lại 3 daemon lúc 07:08:07–07:09:04Z (**gap mẫu 141 s**; probe headroom TRONG cửa sổ thoáng (boot+62s: 30.000 chạm cap) rồi mới đọc journal/uptime. Probe-loop mới chạy lan-2 ~07:38Z (ngoài hạn cờ nên T9 probe tay cặp đóng 07:37:21Z = 0 thay thế). Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 7 — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#101 (51745634, btime 05:12:27Z):** TRƯỚC khi đợt mở 23m24s; **T0-183 XÁC MINH 9/9 nguồn** (epoch 1795497147; uptime bracket ×3 khớp cùng giây; boot_est btime +0,07 s; /proc/1 start_ticks 1605 = btime +16,05 s; stat mtime btime +16,118 s; journal first btime +16 s; wtmp begins 01:12:02Z — theo T0-183; DB: run 182/183 boot_gen mới 166cf7f5, requeue #101 = 1; marker mtime không đổi). Gap #100→#101 = **7.400 s (2h03m20s)**. **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: 56'24" không sampler T9** (mẫu cuối đợt 182 04:45:17Z → mẫu đầu đợt 183 05:41:41Z) — chứa reboot #101 + khoảng mù E-218 (xem §2.2). Marker: T0-183 đếm sống qua **52 reboot #49–#101** (nếu #101 xác nhận — theo T0-183); **#102 chưa xác nhận** (thuộc T0-184) → sống qua 53 reboot nếu #102 được xác nhận.

### 5.2 T5-183 — POSTBOOT_PASS #101 CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat); #100 KHÔNG CÓ — KHÔNG bù được

- **POSTBOOT_PASS #101 ĐÃ CÓ lúc 05:56:42Z** (T5-183, mode **repair-sớm-quyết-h, poll=1, CÓ caveat**, tools KHÔNG CÀI, GST symlink → debroot — giống #98). T0 O8 bắt đầu 59 s sau cờ (05:57:41Z); T4 attempt #52 chạy trên #101 sau cờ.
- **POSTBOOT_PASS #100 KHÔNG CÓ — KHÔNG BÙ ĐƯỢC** (boot #100 đã chết — reboot sang #101 lúc 05:12:27Z; dpkg.log/history mất theo rootfs rebuild; không watcher nào sống trên #100 sau 03:01Z) — **tổng boot không cờ GIỮ 22** (theo quyết (c) đã đính chính). **#99/#98/#96/#95 VẪN CÓ** (replay/repair/repair/replay — parent CHẤP NHẬN (c) đợt 181/182); **#97 KHÔNG CÓ**.
- **POSTBOOT_PASS #102 CHƯA CÓ** — T5-183 đã đóng cờ trước reboot #102 (07:07:05Z); watcher-183 đã chết theo #102. Thuộc T5-184 (giao parent/T10 quyết có giao T5-184 làm cờ #102 hay không — cùng mẫu #100 đợt 182).

### 5.3 Các luồng khác — T7 CHƯA đóng; (m)/INSIDE/mù thuộc T2-183; harness T8 5/6 (85m4 kẹt thật)

- T7-183 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~07:38Z) — kết cục run 182 (TIMEOUT hay xong? viết lại ×1 tại #100, nhiều khả năng ×2 tại #101) + run 183 + DR 06:00Z/07:00Z + HB 05:20:50Z/05:50:50Z/06:20:50Z/06:50:50Z/07:20:50Z thuộc T7-183/T10. T9 đóng đúng hạn cờ, không chờ T7 (cùng mẫu đợt 177–182, theo quyết (l) đợt 152).
- T0-183: #101 XÁC MINH 9/9 nguồn; O8 PASS 3/3 trên #101 (05:57:41–06:00:17Z); (m) #100 DƯƠNG (CUỐI cấp T2) + (m) #101 DƯƠNG (CUỐI cấp T2) — theo T2-183; lệch đồng hồ trước #100 XÁC NHẬN, delta ≥ 22 s. T1-183: verify 182 PASS (theo cờ T1-183 — T9 không phán thay T1). T2-183: (m) #100 DƯƠNG (CUỐI) + (m) #101 DƯƠNG (CUỐI) + INSIDE #100 TRUE (FULL146, chuỗi 1 → 2) + INSIDE #101 TRUE (FULL147, chuỗi 2 → 3) + mù (hole-recheck lần 27) + (m) #56 lần 26 — theo cờ T2-183 (T9 không phán thay T2). T5-183: POSTBOOT_PASS #101 CÓ (repair-sớm-quyết-h, poll=1, caveat); hướng (3) VẪN ĐỨNG lần 30. T6-183: #101/#102 có giết holder không + prune lần 58 — theo cờ T6-183. T8-183: **harness 5/6 — 85m4 KẸT THẬT** (exit 124, P1; kẹt cộng dồn 25 → 26); O8 T8 PASS 3/3; **chuỗi FULL PASS GIỮ 0** (đề xuất T8 — parent quyết).
- **F-182-T9-3 ĐÃ HẾT DẠNG CŨ (xem F-183-T9-7):** mẫu sampler cuối #101 (07:06:43Z) SỚM HƠN btime #102 (07:07:05Z) 22 s — trong khoảng bình thường (cadence 60 s); không có lệch đồng hồ mới trước #102 (giao T0-184).

## 6. Sai số / caveat (F-183-T9-*)

- **F-183-T9-1 — §12.3 AGGREGATE 182 ĐÃ ĐIỀN SẴN LẦN THỨ 16 — T9-183 DÙNG BẢN ĐÃ ĐÍNH CHÍNH (mtime 05:44:21Z).** Brief ban đầu trích §12.3 aggregate 182 là SAI (bản điền sẵn lúc 05:27Z, tiêu đề mạo danh "(parent viết trực tiếp...)"; parent KHÔNG có lượt nào lúc 05:27Z). Parent đã kiểm lại bằng dedup viết mới trong lượt này (khớp từng số, lần 87) và đính chính aggregate lúc 05:44:21Z (nay 79.228 B). T9-183 đã đọc lại §12.3 BẢN ĐÃ ĐÍNH CHÍNH (dòng 194–200, kiểm trực tiếp bằng `stat` lúc 05:51Z) và dùng các quyết THẬT: (a) CHẤP NHẬN 182; **(b) chuỗi FULL PASS VỀ 0 (không phải GIỮ 1)**; (c) #100 KHÔNG cờ, tổng boot không cờ GIỮ 22; (q) số thứ tự đếm là 87. Mọi đánh giá chuỗi trong LIMITS này theo bản đã đính chính. (T8-183 cũng dùng bản đã đính chính — cùng ghi chú trong LIMITS T8.)
- **F-183-T9-2 — CỬA SỔ THOÁNG #102 MỞ 30.000 (CHẠM CAP) — LỚN NHẤT TỪNG ĐO, ĐÓNG TRONG ≤80 S (MẪU MỚI — XEM §1).** Probe mở lúc boot+62s = 30.000 (cap — giá trị thật ≥ 30.000, không đo được); probe tay boot+142s/+199s/+247s đều = 0. Cửa sổ mở rồi đóng trong khoảng (62s, 142s]. T9 chỉ ghi nhận số + thời gian, không phán cơ chế (host-side). Giao T10/parent ghi nhận: lần mở quan sát được đầu tiên kể từ #96; giá trị vượt đỉnh chuỗi cũ 4.438.
- **F-183-T9-3 — GIÁ TRỊ SÀN BALLOON 6.050.608 kB LẶP LẠI LẦN 7 — VÀ GIÁ TRỊ SAG 6.247.216 kB LẶP LẠI 2 LẦN NỮA.** `grep balloon_kB=6050608` trong log đóng băng đợt 183 = **1 lần** (06:30:42Z — sag kết thúc E-219) → sàn balloon đợt 178–181 (6 lần) **LẶP LẠI LẦN 7** (F-182-T9-4 nói dừng ở lần 6 là SAI về tương lai — giá trị quay lại đợt này). Giá trị sag **6.247.216 kB** xuất hiện ĐÚNG 2 lần nữa: 07:26:04Z + 07:29:04Z (micro-sag giữa đường leo trên #102: 6.411.528 → 6.247.216 → 6.346.100 và 6.437.140 → 6.247.216 → 6.349.680 — balloon leo lại tới CEIL rồi ghim thành E-220). Hai lần chạm này KHÔNG tách episode (chưa có mẫu CEIL nào trước đó trên #102 — E-220 bắt đầu 07:32:05Z). T9 chỉ ghi nhận số, không phán cơ chế (host-side).
- **F-183-T9-4 — CHÊNH ENOSPC #99 T5 (80) vs T9 (76) ĐÃ LÀM RÕ (XEM §4.1).** Chỉ khác thời điểm đếm (02:53:42Z vs 02:58:11Z), cùng phương pháp; chuỗi tăng 76 → 78 → 79 → 80 của T5 khớp nhịp 0,85 dòng/phút. Phương pháp chuẩn 6 điểm từ đợt 183 (xem §4.1) — giao T10/parent chốt.
- **F-183-T9-5 — F-182-T9-1 KHÔNG TÁI DIỄN (KHỞI ĐỘNG DAEMON ĐÚNG NGAY LẦN 1, CẢ HAI LẦN).** T9-183 khởi động RIÊNG TỪNG daemon (`cd ... ;` tách lệnh, KHÔNG dùng `cd ... && setsid ... &`) lúc mở phiên (sampler 331520, b2watch 334496, probe-loop 344078) và lúc khởi động lại sau reboot #102 (probe-loop 1790, sampler 1944, b2watch 1971) — cả 6 lần chạy đúng ngay, 0 lỗi "No such file". Bài học đứng: khởi động daemon riêng từng cái, `cd` tách bằng `;`.
- **F-183-T9-6 — RUNTIME RESTART GIẾT SLEEP CHỜ LAN-4 + REBOOT #102 GIẾT DAEMON (tái diễn F-182-T9-2 lần 6).** Sleep nền chờ lan-4 bị SIGTERM ~07:07Z — runtime restart đi kèm reboot #102; daemon cũ chết theo #102 nên lan-4 KHÔNG chạy bằng probe-loop cũ. T9 bắt được reboot #102 trong cùng lượt kiểm (boot_id đã đổi lúc 07:07:52Z), khởi động lại daemon 07:08:07–07:09:04Z (gap mẫu 141 s) + probe tay win142/win187/win247 thay thế. KHÔNG mất số liệu sampler (log đóng băng đầy đủ 115 mẫu).
- **F-183-T9-7 — E-218: KẾT THÚC BỞI REBOOT #101 + KHOẢNG MÙ 27'10" (ghi nhận — kết cục E-218 đã phán: kết thúc bởi reboot #101).** E-218 = 7 mẫu trong log đóng băng 182 (04:39:17–04:45:17Z); reboot #101 05:12:27Z kết thúc trạng thái ghim trên #100. Khoảng mù 04:45:17Z → 05:12:27Z không cho biết balloon sag trước reboot hay ghim tới lúc reboot — T9 KHÔNG khẳng định; grep Balloon/MemAvailable trong round182-t7 + round182-t8 = 0 dòng. Điểm CEIL đọc tay 23:54:13Z KHÔNG TÍNH theo quyết parent 181 — ghi nhận, không đánh số lại. Rủi ro đánh số: KHÔNG có — E-218 kết thúc bởi reboot là kết cục duy nhất quan sát được; E-219/E-220 giữ nguyên số.
- **F-183-T9-8 — T7 CHƯA đóng cờ lúc T9 đóng (~07:38Z) + T9 ĐÓNG ĐÚNG HẠN CỜ.** T9 không chờ T7 (kết cục run 182/183 + DR/HB thuộc T7-183/T10; cùng mẫu đợt 177–182, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).
- **F-183-T9-9 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm 4 → 5, theo T4).** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail ngay ở watch đầu, không tạo tải; probe mở #102 chạm cap 30.000 chỉ tạo watch trong thư mục tạm rồi giải phóng ngay — không chạm dpkg, không chạy trong cửa sổ attempt T4); không có cửa sổ attempt nào bị xâm phạm (0 spike B2 trong cửa sổ attempt #52). T4-183 phán 0 VI PHẠM (LIMITS T4). Chuỗi 0 vi phạm đợt 183 thuộc T10/parent phán cuối.

- **Caveat đứng:** probe cap 30.000 (giá trị mở #102 là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #101 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 183 (chỉ đọc log đóng băng); T1-183 không chạy lại suite nên không có cửa sổ T1 để đối chiếu; T7-183 chưa đóng nên không có cửa sổ T7 để đối chiếu; E-220 đang ghim — kết cục thuộc T9-184.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (115 mẫu, 05:41:41Z–07:37:05Z): `round183-t9/ram-sampler-FROZEN.log` — md5 `0dbe7810678093c636d4a145578bb75e`. Log B2 đóng băng (93 spike): `round183-t9/b2-spikes-FROZEN.log` — md5 `83c720e11d1b542adf6b32998ba2bc29`. Log headroom đóng băng (8 lần đo): `round183-t9/headroom-log-FROZEN.txt` — md5 `df4445abc51bc3b857a9e89856805d71`. Phân tích bằng script: `round183-t9/t9-183-analyze.py` (output: `round183-t9/t9-183-analyze-output.txt`). Ghi chú baseline: `round183-t9/t9-183-baseline-notes.md`. Probe tay cửa sổ #102: `round183-t9/probe-once.py`. T10 đọc log đóng băng trực tiếp khi cần.
