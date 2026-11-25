# LIMITS — Phase 9 đợt 184, T9: headroom + RAM + birefnet (0 thử lần 38; reboot #103 mới; E-220 kết thúc bởi sag; E-221–E-225 mới trên #103; cửa sổ thoáng #103 MỞ 30.000; ENOSPC lần 33)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (7 lần đo: 0, 0, 30.000, 0, 0, 0, 0; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 44 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG #103: QUAN SÁT ĐƯỢC + MỞ — 30.000 (CHẠM CAP) lúc boot+61s, ĐÓNG trước boot+70s.** Lần mở thứ hai liên tiếp chạm cap (sau #102 boot+62s); cửa sổ hẹp hơn nhiều (≤9 s so với ≤80 s của #102).
- **Balloon: E-220 (7) KẾT THÚC BỞI SAG 08:43:23Z trên #102; E-221 (5) + E-222 (12) + E-223 (5) + E-224 (9) + E-225 (6) MỚI trên #103, tất cả kết thúc bởi sag.** Tổng ghim **38/119 (31,9%)**.
- **RAM: 119 mẫu, 08:42:23Z–10:41:02Z, HAI boot (#102: 33; #103: 86).** Max **2.697.548 kB (42,9% guard)** lúc 09:12:24Z (#102); min **404.144 kB** lúc 08:42:23Z (#102); mean 880.976,2 kB; gate A **33/119**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 38 liên tiếp**.
- **B2: 88 spike THẬT, 3 cụm, TẤT CẢ trên #102; 0 spike trên #103; 10 spike trong cửa sổ attempt1 T4 #53 (nhiễm tải — F-184-T2-8); 0 spike trong cửa sổ attempt2; 0 spike trong span ghim E-220–E-225; 44 spike trong cửa sổ O8 T0.**
- **Lượt yên #53 (T4): CÓ LƯỢT HỢP LỆ — attempt2-6ecd948e: 20/20 + lớp B 5/5, tickCost median 43,5 ms — CHUỖI LƯỢT YÊN HỢP LỆ 45 → 46.** T9 đối chiếu sampler trong cửa sổ attempt2: gate A 4/4, load1 0,66–1,62, 0 mẫu ghim. **F-184-T2-8: VI PHẠM NẶNG về tuân thủ (T2 hole-recheck chồng attempt1 thật, làm hỏng attempt1) — chuỗi 0 vi phạm GIỮ 0** (theo T4).
- **REBOOT #103 MỚI GIỮA PHIÊN** (boot `e0921bda`, btime 09:14:55Z, gap #102→#103 = 7.670 s — số hiệu + btime chờ T0-185 xác minh 9 nguồn); giết sampler/watcher/probe-loop T9 + exec service restart; T9 khởi động lại, gap mẫu 96 s. **#102 XÁC NHẬN 9 nguồn (T0-184)** — nợ đợt 183 đã trả.
- **ENOSPC: đếm trực tiếp 148 dòng (73 #102 + 75 #103) — đợt thứ 33 liên tiếp có lỗi thật — lỗi KHÔNG dừng trên cả hai boot.** Ngoại suy #102 ≈ 96 → tổng đợt ≈ 171 dòng.
- **T7/T8 CHƯA đóng lúc T9 đóng (~10:41Z)** — như T7-180/181/182/183. Không push, không sửa production, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả hai boot.

### 1.2 Số đo đợt 184 (7 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 08:42:28Z | **0** | #102 6ecd948e | 63.747 | cặp mở (boot+1h35m23s) |
| 09:12:28Z | **0** | #102 | 63.747 | lan-2 (boot+2h05m23s) |
| 09:15:56Z | **30.000** | #103 e0921bda | 63.747 | **TRONG cửa sổ thoáng (boot+61s) — CHẠM CAP** |
| 09:16:05Z | **0** | #103 | 63.747 | **TRONG cửa sổ thoáng (boot+70s)** |
| 09:46:05Z | **0** | #103 | 63.747 | lan-2 (boot+31m10s) |
| 10:16:05Z | **0** | #103 | 63.747 | lan-3 (boot+1h01m10s) |
| 10:41:15Z | **0** | #103 | 63.747 | cặp đóng (tay, boot+1h26m20s); E-225 đã sag |

- **CỬA SỔ THOÁNG #103: QUAN SÁT ĐƯỢC + MỞ — LẦN THỨ HAI LIÊN TIẾP CHẠM CAP.** Btime 09:14:55Z (uptime-based, chờ T0-185 xác minh 9 nguồn); dải mẫu boot+53–245s ≈ 09:15:48–09:19:00Z. Probe tay win103-open lúc boot+61s = **30.000 — CHẠM CAP, tức headroom thật ≥ 30.000** (probe dừng vì đủ cap, không phải vì hết watch — giá trị thật không đo được, chỉ biết ≥ 30.000). Probe-loop open-184 lúc boot+70s = **0**. **Cửa sổ MỞ rồi ĐÓNG trong khoảng (61s, 70s] — rộng tối đa ~9 s** (hẹp hơn nhiều so với #102: (62s, 142s], ≤80 s). Hai lần mở liên tiếp đều chạm cap 30.000 và đều đóng trong vòng ~80 s sau boot — mẫu mới: cửa sổ thoáng mở rất sớm sau boot rồi đóng rất nhanh. **Caveat:** probe cap 30.000 nên không biết headroom thật lúc mở là 30.0xx hay ~60.000 — chỉ khẳng định ≥ 30.000 và cửa sổ đã đóng trước boot+70s.
- **CỬA SỔ THOÁNG #102: KHÔNG QUAN SÁT ĐƯỢC** (T9-184 mở phiên 08:41Z = boot+1h34m, sau khi cửa sổ đóng; đợt 183 đã quan sát #102 mở 30.000 lúc boot+62s).
- **Headroom cuối phiên: 0 — SỐ 0 GIỮ SANG ĐỢT NÀY.** 2 lần đo trên #102 đều = 0; 3/4 lần đo trên #103 sau cửa sổ đều = 0 (chỉ lần mở trong cửa sổ = 30.000). Số watch giữ ngoài cell lúc đóng: **63.747**. Tỉ lệ so với nhu cầu vite (~1.578): **~0** — một vite mới vẫn không khởi động được (như mọi đợt từ 152). **Trần KHÔNG ĐỔI trong boot** (63.747 trên #102 và #103).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt: **… → 0 → 2 → 0 → 2 → 2 → 0 → 0 → 0 → 0 → 0 → 2 → 0 → 0**. Gần nhất: 178 đóng 0; 179 đóng 0; 180 đóng 0 (1 lần đo giữa phiên 2.903); 181 đóng 0 (toàn 0, 7 lần đo); 182 đóng 2 (3 lần 0 đầu phiên + 4 lần 2); 183 đóng 0 (7 lần 0 + 1 lần 30.000 chạm cap giữa phiên); **184 đóng 0 (6 lần 0 + 1 lần 30.000 chạm cap giữa phiên)**.

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 0.** Lần mở 30.000 trên #103 là sự kiện giữa phiên, không phải mức nền — headroom đóng 0 như 6/8 đợt gần nhất.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 44 liên tiếp.** Quyết parent đợt 183 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới: journal đợt này có 148 dòng lỗi ENOSPC đếm trực tiếp (xem §4)** — đợt thứ 33 liên tiếp — và lỗi KHÔNG dừng trên cả hai boot. T9 chỉ nêu dữ kiện + tương quan, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 119 mẫu, 08:42:23Z–10:41:02Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot #103: 96 s** (mẫu cuối #102 09:14:24Z → mẫu đầu #103 09:16:00Z); **gap giữa hai đợt: 65'18" không sampler T9** (mẫu cuối T9-183 07:37:05Z → mẫu đầu T9-184 08:42:23Z — chứa khoảng mù E-220, xem §2.2); **0 gap >90 s khác ngoài gap reboot** (gap lớn thứ hai 61 s — jitter cadence bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 08:42:23–08:44:24Z | #102 | 404.144–790.848 kB | Mở sampler; **E-220 mẫu cuối CEIL rồi sag 08:43:23Z**; O8 T0 bắt đầu 08:45:16Z |
| 08:45:24–09:14:24Z | #102 | 445.396–2.697.548 kB | Balloon leo/xả; **lượt yên #53** (attempt1 nhiễm tải, attempt2 hợp lệ); **RAM max phiên 2.697.548 kB** |
| 09:16:00–09:28:00Z | #103 | 556.100–1.796.640 kB | Boot #103 mới; balloon leo đơn điệu tới trần; load1 mẫu đầu 3,77 |
| 09:29:00–09:33:00Z | #103 | 462.708–512.596 kB | **E-221 5 mẫu ghim**; gate A 0/5; 0 spike B2 |
| 09:34:01–09:38:01Z | #103 | 500.856–819.500 kB | Sag kết thúc E-221 (bal 6.050.608 = sàn, lần 8); balloon leo lại |
| 09:39:01–09:50:01Z | #103 | 471.052–563.256 kB | **E-222 12 mẫu ghim**; gate A 0/12; 0 spike B2 |
| 09:51:01–09:56:01Z | #103 | 527.712–962.120 kB | Sag kết thúc E-222 (bal 5.900.216); balloon leo lại, mẫu 09:56:01Z bal 6.443.256 — chỉ thiếu 568 kB là tới trần |
| 09:57:01–10:01:01Z | #103 | 447.588–507.036 kB | **E-223 5 mẫu ghim**; gate A 0/5; 0 spike B2; **RAM min #103 447.588 kB** (09:57:01Z) |
| 10:02:01–10:13:01Z | #103 | 542.692–1.252.392 kB | Sag kết thúc E-223 (bal 6.181.680); balloon leo lại |
| 10:14:01–10:22:01Z | #103 | 480.056–584.000 kB | **E-224 9 mẫu ghim**; gate A 0/9; 0 spike B2 |
| 10:23:01–10:25:01Z | #103 | 537.840–807.316 kB | Sag kết thúc E-224 (bal **6.247.216 = giá trị sag, lần 1 đợt này**); balloon leo lại |
| 10:26:01–10:31:01Z | #103 | 521.744–529.728 kB | **E-225 6 mẫu ghim**; gate A 0/6; 0 spike B2 |
| 10:32:01–10:41:02Z | #103 | 547.116–1.467.572 kB | Sag kết thúc E-225 (bal 6.280.148); balloon leo/xả; T9 đóng |

- **Gate A ≥1024 MiB: 33/119 mẫu** (20/33 trên #102 + 13/86 trên #103); **0 mẫu ≥ guard**; load1 max (sampler) **9,44** (08:47:24Z, #102 — trong O8 T0); **RAM <512.000 kB: 25 mẫu** (21,0% — 3 trên #102, 22 trên #103, 8 dải — xem dưới); **RAM <300.000 kB: 0 mẫu**.
- Swap: SwapFree 606.412 kB (mẫu đầu #102) → 684.512 kB (mẫu cuối #102) → **1.040.600 kB (mẫu đầu #103 — NHẢY +356.088 kB qua reboot #103)** → 591.212 kB (mẫu cuối, 10:41:02Z). Nhịp nhảy SwapFree qua reboot: #103 nhả ~356.088 kB (đợt 183: #102 nhả ~438.432 kB; #100 nhả ~347.632 kB; #99 nhả ~372.324 kB; #96 nhả ~403.960 kB; #95 nhả ~331.952 kB; #93 nhả ~268.104 kB; #91 nhả ~376.948 kB).
- Trũng RAM đợt này: min **404.144 kB (08:42:23Z, #102, mẫu đầu phiên — E-220 đang ghim)** — sâu thứ ba trong các log T9 (kỷ lục 225.224 kB đợt 180; đợt 179: 333.672 kB; đợt 181: 363.464 kB; đợt 182: 391.344 kB; đợt 183: 403.492 kB — đợt này min THẤP HƠN đợt 183 nhưng CAO HƠN đợt 180/181). Lúc đó balloon CEIL, load1 0,34 — balloon ghim trần nhưng RAM trũng sâu nhất phiên; sag ngay sau (bal 6.082.348 kB lúc 08:43:23Z), KHÔNG kẹt. 25 mẫu <512.000 kB trong 119 mẫu (21,0%; đợt 183: 7/115 = 6,1% — tỉ lệ TĂNG MẠNH do #103 ghim nhiều: 37/86 mẫu CEIL).

**Bảng tổng hợp số RAM (từ script `t9-184-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 119 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #102 6ecd948e | 33 | 404.144 | 2.697.548 | 1.239.178,1 | 20/33 | 1 | 9,44 | 3 |
| #103 e0921bda | 86 | 447.588 | 1.796.640 | 743.526,7 | 13/86 | 37 | 3,77 | 22 |
| **Toàn phiên** | **119** | **404.144** | **2.697.548** | **880.976,2** | **33/119** | **38/119 (31,9%)** | **9,44** | **25** |

- **Mean toàn phiên 880.976,2 kB — 2 cách độc lập: python `sum/n = 880.976,2` VÀ trung bình có trọng số ((33×1.239.178,1 + 86×743.526,7)/119 = 880.976,2) — KHỚP CẢ HAI.**
- 25 mẫu RAM <512.000 kB, 8 dải (từ script python trên log đóng băng): #102: 08:42:23Z (1); 09:01:24–09:02:24Z (2). #103: 09:29:00–09:30:00Z (2); 09:32:00–09:33:00Z (2); 09:38:01–09:39:01Z (2); 09:41:01–09:49:01Z (9); 09:57:01–10:01:01Z (5); 10:14:01–10:15:01Z (2). Tổng 1+2+2+2+2+9+5+2 = 25 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-220 KẾT THÚC BỞI SAG + E-221–E-225 MỚI TRÊN #103

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #102 và #103** (max bal trong log = đúng CEIL trên cả hai boot).
- **E-220 — KẾT THÚC BỞI SAG (nợ đợt 183 đã trả).** 6 mẫu trong log đóng băng đợt 183 (07:32:05–07:37:05Z, #102) + **1 mẫu đợt này (08:42:23Z, #102)** = **7 mẫu**; sag 08:43:23Z bal **6.082.348 kB** (không phải giá trị sàn). **Caveat khoảng mù 65'18" giữa hai đợt (07:37:05Z → 08:42:23Z):** balloon CEIL ở cả hai đầu khoảng mù, cùng boot #102, không reboot xen giữa — T9 phán E-220 là MỘT episode liên tục 7 mẫu, nhưng KHÔNG loại trừ được một lần sag + ghim lại trong khoảng mù (không sampler nào đo trong khoảng đó). Nếu áp dụng quy tắc cứng "chỉ đếm mẫu quan sát được liên tiếp", E-220 vẫn = 7 mẫu quan sát được; khoảng mù chỉ ảnh hưởng tới khẳng định "liên tục", không đổi số mẫu.
- **Boot #102: GHIM 1/33 mẫu (3,0%), 0 EPISODE MỚI** (chỉ mẫu đuôi E-220). Balloon leo/xả nhiều chu kỳ sau sag, không chạm trần lại trước reboot #103 (max sau sag 6.392.404 kB lúc 09:02:24Z — chỉ thiếu 51.420 kB là tới trần).
- **Boot #103: GHIM 37/86 mẫu (43,0%), 5 EPISODE MỚI (E-221–E-225), TẤT CẢ kết thúc bởi sag.** Balloon leo trần rất nhanh trên boot mới (E-221 bắt đầu boot+14m05s) và ghim/xả theo chu kỳ ngắn (~5–12 phút/episode, tách nhau 3–12 mẫu dưới trần — tách SẠCH, không có micro-dip 1 mẫu gây tranh cãi: các khoảng tách đều ≥3 mẫu dưới trần).

| Episode | Span (UTC) | n | RAM (kB) | Kết thúc |
|---|---|---|---|---|
| E-221 | 09:29:00–09:33:00Z | 5 | 462.708–512.596 | Sag 09:34:01Z bal **6.050.608 = sàn, LẦN 8** |
| E-222 | 09:39:01–09:50:01Z | 12 | 471.052–563.256 | Sag 09:51:01Z bal 5.900.216 |
| E-223 | 09:57:01–10:01:01Z | 5 | 447.588–507.036 | Sag 10:02:01Z bal 6.181.680 |
| E-224 | 10:14:01–10:22:01Z | 9 | 480.056–584.000 | Sag 10:23:01Z bal **6.247.216 = giá trị sag, lần 1 đợt này** |
| E-225 | 10:26:01–10:31:01Z | 6 | 521.744–529.728 | Sag 10:32:01Z bal 6.280.148 |

- **Tổng ghim trần đợt này: 38/119 mẫu (31,9%)** (đợt 183: 8/115 = 7,0%; đợt 182: 44/114 = 38,6%; đợt 181: 34/123 = 27,6%; đợt 180: 19/116 = 16,4%; đợt 179: 27/131 = 20,6% — đợt này CAO THỨ HAI trong chuỗi 6 đợt, chỉ sau 182). Tỉ lệ ghim trên #103 (43,0%) cao nhất kể từ #100 đợt 182; trên #102 (3,0%) thấp nhất kể từ #101 đợt 183 (2,3%).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-221–E-225 đều là EPISODE MỚI (≥2 mẫu CEIL liên tiếp, sag tách rõ ≥3 mẫu); E-220 kết thúc bởi sag. **Không có phương án gộp nào cần xét đợt này** (mọi khoảng tách đều ≥3 mẫu; mẫu 09:56:01Z bal 6.443.256 — chỉ thiếu 568 kB là tới trần — nằm TRONG khoảng tách 6 mẫu giữa E-222 và E-223, không phải micro-dip trong episode).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-223 chỉ ~448–507.000 kB trong khi tổng RAM − balloon = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #53 (T4) — CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ 45 → 46 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#53 CÓ LƯỢT HỢP LỆ — attempt2-6ecd948e: 20/20 + lớp B ĐẠT 5/5, tickCost median 43,5 ms ≤ 60 — CHUỖI LƯỢT YÊN HỢP LỆ 45 → 46.** Attempt1 chạy 09:04:22–09:07:51Z trên #102: 20/20 nhưng **B2 VI PHẠM (load1_max 4,48)** do hole-recheck của T2 chồng lên cửa sổ attempt (F-184-T2-8) → NHIỄM TẢI, retry. Attempt2 chạy 09:08:13–09:11:40Z: 20/20 + B 5/5; analyzers chạy NGOÀI cửa sổ attempt 09:11:40–09:12:01Z (quyết (p) đợt 179). Poller thoát exit 0 lúc 09:12:01Z. Ngân sách dùng **2/3**. Reboot #103 (09:14:55Z) xảy ra SAU khi poller thoát — KHÔNG ảnh hưởng #53.
- **Đối chiếu sampler T9 (độc lập, cadence 60 s) trong cửa sổ attempt2 09:08:13–09:11:40Z:** 4 mẫu (09:08:24Z, 09:09:24Z, 09:10:24Z, 09:11:24Z): RAM 1.416.556–1.674.664 kB — **gate A 4/4**; balloon 4.448.136–4.969.856 kB, **0 mẫu ghim**; load1 **0,66–1,62**. **0 spike B2 trong cửa sổ attempt2** (xem §2.5).
- **Đối chiếu sampler T9 trong cửa sổ attempt1 09:04:22–09:07:51Z:** 4 mẫu: RAM 1.400.596–1.705.548 kB — **gate A 4/4**; balloon 4.531.804–5.325.444 kB, **0 mẫu ghim**; load1 **1,53–2,99** (cao hơn attempt2 — phù hợp với nhiễm tải T4 ghi nhận). **10 spike B2 trong cửa sổ attempt1** (xem §2.5) — khớp F-184-T2-8.
- **F-184-T2-8: VI PHẠM NẶNG VỀ TUÂN THỦ (theo T2/T4) — chuỗi 0 vi phạm GIỮ 0** (chuỗi đã đứt về 0 đợt 183 theo quyết (p) đợt 183; đợt này có vi phạm mới nên KHÔNG lên 1). T4 phán 0 vi phạm phía T4; chuỗi tính cả đợt — parent quyết cuối.

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 08:45:16–08:48:57Z | #102 | 5,37–9,44 (4 mẫu) | 705.044–1.087.284 kB — **gate A 1/4** | **O8 T0 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); **44 spike B2** trong cửa sổ (xem §2.5); 0 mẫu ghim |
| T4 attempt1 #53 09:04:22–09:07:51Z | #102 | 1,53–2,99 (4 mẫu) | 1.400.596–1.705.548 kB — **gate A 4/4** | **NHIỄM TẢI — B2 vi phạm** (load1_max 4,48); 0 mẫu ghim; **10 spike B2** |
| T4 attempt2 #53 09:08:13–09:11:40Z | #102 | 0,66–1,62 (4 mẫu) | 1.416.556–1.674.664 kB — **gate A 4/4** | **#53 CÓ lượt hợp lệ 20/20 + B 5/5**; 0 mẫu ghim; **0 spike B2** |
| T8 harness #102/#103 (giờ T8) | #102/#103 | — | — | **T8 CHƯA đóng cờ lúc T9 đóng (~10:41Z)** — không có cửa sổ T8 để đối chiếu; kết quả harness + chuỗi FULL PASS thuộc T8-184/T10 |

- T1-184: verify 183 PASS (chuỗi khớp lần thứ 91) → không có cửa sổ T1 để đối chiếu (như đợt 177–183). T7-184 CHƯA đóng → không có cửa sổ T7 (kết cục run 183 + cửa slot thuộc T7-184/T10). T5-184: **POSTBOOT_PASS #102 ĐÃ CÓ 08:43:59Z** (replay-đầy-đủ, poll=0, KHÔNG caveat — tools CÀI, GST thư mục thật; replay #102 KHÔNG đình trệ — chấm dứt chuỗi 2 boot đình trệ #100/#101); **#100 VẪN KHÔNG CÓ cờ** (tổng boot không cờ GIỮ 22). O8 T0 bắt đầu 08:45:16Z — 77 s sau cờ #102.
- T2-184: **(m) #102 DƯƠNG (CUỐI cấp T2) + INSIDE #102 TRUE (FULL148, chuỗi 3 → 4)** — theo cờ T2-184 (T9 không phán thay T2); mù hole-recheck lần 28 NEW=0 mọi hố. T6-184: **(A) 120/120 lần thứ 34** + **#102 KHÔNG GIẾT HOLDER — chuỗi mới = 7 (#96–#102)** + prune lần 59 (xóa 3 file, queue 103 → 100).

### 2.5 B2 — 88 spike THẬT, 3 cụm, TẤT CẢ trên #102; 0 spike trên #103; 10 spike trong attempt1 + 0 spike trong attempt2 + 0 spike trong span ghim

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **88 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 88): TẤT CẢ trên #102, 3 cụm; 0 spike trên #103 (watcher khởi động lại 09:16:0xZ, load1 #103 max sampler 3,77 — chỉ mẫu đầu boot 09:16:00Z ≥3,0, watcher chưa chạy lại kịp lúc đó; không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng trong gap reboot 96 s); 0 spike trong span ghim E-220 (08:42:23–08:43:23Z) + E-221/E-222/E-223/E-224/E-225 — như đợt 177–183; 10 spike trong cửa sổ attempt1 T4 #53 (09:04:22–09:07:51Z); 0 spike trong cửa sổ attempt2 (09:08:13–09:11:40Z).** 44 spike trong cửa sổ O8 T0 (08:45:16–08:48:57Z).

| Cụm | Thời gian (UTC) | n | load1 max | Driver đứng đầu |
|---|---|---|---|---|
| 1. Mở phiên + O8 T0 + T1 crosscheck | 08:44:22–08:50:35Z | 75 | 9,7 | WebKitWebProcess (25) + hatch (18) + grep (12) + chrome (11) + MainThread (7) + privsep-test-fu (2) — driver đúng là trình duyệt đo (O8 T0) + T1 verify/grep + runtime |
| 2. Attempt1 #53 + hole-recheck T2 | 09:05:18–09:06:18Z | 10 | 4,48 | MainThread (5) + WebKitWebProcess (3) + ps (1) + hatch (1) — hole-recheck T2 chồng attempt1 (F-184-T2-8) |
| 3. Sau reboot #103 | 09:16:02–09:16:12Z | 3 | 3,55 | hatch (3) — boot mới + T9 khởi động lại daemon/probe cửa sổ |

- **Tổng kết: 88/88 spike có process đứng đầu %CPU; load1 đỉnh đợt (watcher, cadence 2 s): 9,7** (đợt 183: 5,49 — đợt này CAO HƠN NHIỀU, do O8 T0 tải nặng trên #102; load1 max sampler cadence 60 s là 9,44 — cùng bậc, khác cadence). **44 spike trong cửa sổ O8 T0; 10 spike trong cửa sổ attempt1 (nhiễm tải); 0 spike trong cửa sổ attempt2; 0 spike trong span ghim.**
- Cụm 1 tách nhỏ: 11 spike TRƯỚC O8 (08:44:22–08:45:12Z — T0 setup + T1 crosscheck/grep) + 44 spike TRONG O8 + 20 spike SAU O8 (08:49:00–08:50:35Z — T1/T5/T6 mở phiên + replay host). **Khoảng mù watcher đầu phiên: ~2 phút** (watcher khởi động 08:42:2xZ; spike đầu bắt 08:44:22Z — trước đó load1 sampler 0,34–0,99, không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng <3,0 trong gap). **Khoảng mù qua reboot #103: ~96 s** (watcher chết ~09:14:55Z, chạy lại 09:16:0xZ; 0 spike trên #103 sau đó; load1 sampler trong gap 1,01 → 3,77 — 1 mẫu ≥3,0 lúc 09:16:00Z nhưng watcher chưa chạy lại kịp). **0 gap phủ sóng watcher nào khác.**

## 3. Birefnet guard (cơ chế (a) — 0 lần thử, lần thứ 38)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round184-t9/sampler.sh` chạy 08:42:23Z–10:41:02Z (2 instance: instance 1 sống 08:42:23Z–09:14:24Z trên #102 rồi **CHẾT theo reboot #103**; instance 2 khởi động lại 09:16:00Z trên #103, sống tới khi T9 dừng tay ~10:41Z — **1 gap qua reboot (96 s), 0 gap >90 s khác; max gap trong boot 61 s**), **119 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.697.548 kB = 42,9% guard** (đợt 183: 46,8%; đợt 182: 79,9%; đợt 181: 42,6%; đợt 180: 38,83%; đợt 179: 40,52%; đợt 178: 66,35%; đợt 177: 41,78%; đợt 176: 48,52%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **3.593.908 kB (57,1%)**. **Caveat (F-179-T9-4 đợt 178): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 184 — lần thứ 38 liên tiếp** (đợt 147–184: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 38 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round184-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 183); không có thư mục `~/workspace/tmp-t9-184-birefnet/` (không thử gì).

## 4. ENOSPC trong journal (đếm trực tiếp 148 dòng — đợt thứ 33 liên tiếp — lỗi KHÔNG dừng trên cả hai boot)

- **#102:** đếm trực tiếp **73 dòng lúc 08:43:01Z** (dòng đầu 07:08:57Z = boot+112s; dòng cuối đếm được 08:41:57Z). Phần 08:43:01Z → reboot 09:14:55Z (~31,9 phút) **KHÔNG đếm được** (journal #102 mất sau reboot #103 — `--list-boots` lúc đóng chỉ còn idx 0 #103); ngoại suy theo nhịp đo được: (73−26)/(08:43:01Z−07:37:37Z) = 47 dòng / 3.924 s ≈ 0,72 dòng/phút → +23 dòng → **#102 ≈ 96 dòng (ƯỚC TÍNH, ghi rõ)**.
- **#103:** **75 dòng** (đếm trực tiếp lúc đóng 10:41:27Z — toàn bộ từ lúc mở boot tới lúc đóng; journal bắt đầu 09:15:0xZ nên phủ sóng đầy đủ). Dòng đầu **09:16:46Z (boot+111s)** — khớp mẫu #102 (boot+112s), #101 (boot+108s), #100 (boot+110s), #99 (boot+109s), #93 (boot+114s), #91 (boot+~120s), #90 (boot+121s), #95 (boot+105s), #98 (boot+103s). Dòng cuối **10:41:13Z** — lỗi VẪN ĐANG XẢY RA lúc đóng (nhịp ~0,89 dòng/phút, đều).
- **Tổng đợt 184 đếm trực tiếp: 148 dòng** (73 #102 + 75 #103) — cận dưới; ngoại suy ≈ **171 dòng** (148 + ~23 phần #102 không đếm được). Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-184 áp dụng đầy đủ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `journalctl -b 0 | grep -c inotify` — hai số PHẢI KHỚP (đợt này: #102 cả hai đều 73 lúc 08:43:01Z; #103 cả hai đều 75 lúc đóng 10:41:27Z); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (không cộng vào số đếm trực tiếp); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.
- **Caveat đếm:** `journalctl --since` / `--list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #102 từ cell (cùng mẫu F-171-T10-4 … F-183-T9-5). Số #102 (73) lấy từ đếm trực tiếp lúc 08:43:01Z — ghi trong baseline notes + §4 này. **Số #103 (75) đếm được lại đầy đủ từ cell** (journal #103 còn nguyên lúc đóng).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #103 mới giữa phiên (T9 bắt trực tiếp, khởi động lại 96 s gap mẫu) + #102 trước khi đợt mở

- **#103 (e0921bda, btime 09:14:55Z; số hiệu + btime chờ T0-185 xác minh 9 nguồn).** Btime: `uptime -s` 09:14:55Z; boot_id `e0921bda-b0da-4445-b83f-e494f4e52182`. Gap #102→#103 = **7.670 s (2h07m50s)**. Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #102 09:14:24Z — 31 s TRƯỚC btime, trong khoảng bình thường); **exec service cũng restart cùng lúc** (sleep 600 đang chạy bị giết — xem F-184-T9-6). T9 khởi động lại 3 daemon lúc 09:15:56–09:16:0xZ (**gap mẫu 96 s**; probe headroom TRONG cửa sổ thoáng (boot+61s: 30.000 chạm cap) rồi mới đọc journal/uptime). Probe-loop mới chạy lan-2 ~09:46Z, lan-3 ~10:16Z (đều 0); lan-4 (~10:46Z) không chạy vì T9 dừng daemon lúc đóng 10:41Z, thay bằng probe tay cặp đóng 10:41:15Z = 0. Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 8 — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#102 (6ecd948e, btime 07:07:05Z):** TRƯỚC khi đợt mở 1h28m46s; **T0-184 XÁC MINH 9/9 nguồn** (epoch 1795504025; uptime bracket ×3 khớp cùng giây; boot_est btime +0,21 s; /proc/1 start_ticks 1092 = btime +10,92 s; stat mtime btime +11,145 s; journal first btime +11 s; wtmp begins 07:07:16Z; last reboot 07:07 still running; Cloudflare ×4; DB: run 183/184 boot_gen mới; marker mtime không đổi). Gap #101→#102 = **6.878 s (1h54m38s)**. **Lệch đồng hồ trước #102: XÁC NHẬN, delta ≥ 17 s** (watcher-183 poll cuối 07:07:22Z = btime102 +17 s — F-184-T0-1/F-184-T5-1, mẫu overlap thứ 16). **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: 65'18" không sampler T9** (mẫu cuối đợt 183 07:37:05Z → mẫu đầu đợt 184 08:42:23Z) — chứa khoảng mù E-220 (xem §2.2). Marker: T0-184 đếm sống qua **54 reboot #49–#102** (đã xác nhận); **#103 chưa xác nhận** (thuộc T0-185) → sống qua 55 reboot nếu #103 được xác nhận.

### 5.2 T5-184 — POSTBOOT_PASS #102 CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat); #100 KHÔNG CÓ — nợ ĐÃ ĐÓNG

- **POSTBOOT_PASS #102 ĐÃ CÓ lúc 08:43:59Z** (T5-184, mode **replay-đầy-đủ, poll=0, KHÔNG caveat**, tools CÀI, GST thư mục thật — KHÁC #98/#101 repair). T0 O8 bắt đầu 77 s sau cờ (08:45:16Z); T4 attempt #53 chạy trên #102 sau cờ.
- **POSTBOOT_PASS #100 KHÔNG CÓ — nợ repair ĐÃ ĐÓNG đợt 183** (quyết (c) đợt 183; T5-184 KHÔNG thử repair); **tổng boot không cờ GIỮ 22**. **#99/#98/#96/#95 VẪN CÓ**; **#97 VẪN KHÔNG CÓ**.
- **POSTBOOT_PASS #103 CHƯA CÓ** — T5-184 đã đóng cờ trước reboot #103 (09:14:55Z); watcher-184 đã chết theo #103 (hạn 11:35:00Z). Thuộc T5-185 (giao parent/T10 quyết có giao T5-185 làm cờ #103 hay không — cùng mẫu #100 đợt 182, #102 đợt 183).

### 5.3 Các luồng khác — T7/T8 CHƯA đóng; (m)/INSIDE/mù thuộc T2-184; harness T8 chưa biết

- T7-184/T8-184 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~10:41Z) — kết cục run 183 (hạn 08:35:51Z — đã qua lúc T9 mở phiên; T7-183 ghi vẫn running lúc đóng 08:08Z, viết lại ×1 tại #102) + run 184 + DR/HB + cửa slot + harness 184 thuộc T7-184/T8-184/T10. T9 đóng đúng hạn cờ, không chờ T7/T8 (cùng mẫu đợt 177–183, theo quyết (l) đợt 152).
- T0-184: #102 XÁC MINH 9/9 nguồn; O8 PASS 3/3 trên #102 (08:45:16–08:48:57Z); lệch đồng hồ trước #102 XÁC NHẬN, delta ≥ 17 s. T1-184: verify 183 PASS (chuỗi khớp lần thứ 91). T2-184: (m) #102 DƯƠNG (CUỐI) + INSIDE #102 TRUE (FULL148, chuỗi 3 → 4) + mù (hole-recheck lần 28) + F-184-T2-8 (vi phạm nặng) — theo cờ T2-184 (T9 không phán thay T2). T5-184: POSTBOOT_PASS #102 CÓ (replay, poll=0, KHÔNG caveat); hướng (3) VẪN ĐỨNG lần 31. T6-184: (A) 120/120 lần 34; #102 KHÔNG GIẾT HOLDER (chuỗi 7); prune lần 59 (xóa 3, queue 103 → 100).
- **F-183-T9-3 ĐÃ HẾT DẠNG CŨ (xem F-184-T9-3):** mẫu sampler cuối #102 (09:14:24Z) SỚM HƠN btime #103 (09:14:55Z) 31 s — trong khoảng bình thường (cadence 60 s); lệch đồng hồ trước #102 đã được T0-184 xác nhận (delta ≥ 17 s), không có lệch mới trước #103 mà T9 đo được (giao T0-185).

## 6. Sai số / caveat (F-184-T9-*)

- **F-184-T9-1 — CỬA SỔ THOÁNG #103 MỞ 30.000 (CHẠM CAP) — LẦN MỞ THỨ HAI LIÊN TIẾP CHẠM CAP, ĐÓNG TRONG ≤9 S (MẪU MỚI — XEM §1).** Probe tay lúc boot+61s = 30.000 (cap — giá trị thật ≥ 30.000, không đo được); probe-loop lúc boot+70s = 0. Cửa sổ mở rồi đóng trong khoảng (61s, 70s] — hẹp hơn nhiều so với #102 (≤80 s). Hai lần mở liên tiếp đều chạm cap và đều đóng trong vòng ~80 s sau boot — mẫu mới cho T10/parent ghi nhận. T9 chỉ ghi nhận số + thời gian, không phán cơ chế (host-side).
- **F-184-T9-2 — GIÁ TRỊ SÀN BALLOON 6.050.608 kB LẶP LẠI LẦN 8 — VÀ GIÁ TRỊ SAG 6.247.216 kB LẶP LẠI 1 LẦN NỮA.** `grep balloon_kB=6050608` trong log đóng băng đợt 184 = **1 lần** (09:34:01Z — sag kết thúc E-221) → sàn balloon đợt 178–183 (7 lần) **LẶP LẠI LẦN 8**. Giá trị sag **6.247.216 kB** xuất hiện 1 lần nữa: 10:23:01Z (sag kết thúc E-224). T9 chỉ ghi nhận số, không phán cơ chế (host-side).
- **F-184-T9-3 — E-220: KẾT THÚC BỞI SAG + KHOẢNG MÙ 65'18" GIỮA HAI ĐỢT (ghi nhận — kết cục E-220 đã phán: kết thúc bởi sag 08:43:23Z).** E-220 = 7 mẫu quan sát được (6 đợt 183 + 1 đợt 184); khoảng mù 07:37:05Z → 08:42:23Z không cho biết balloon có sag + ghim lại trong khoảng đó hay ghim liên tục — T9 KHÔNG khẳng định tính liên tục, chỉ khẳng định số mẫu quan sát được + kết cục sag. Rủi ro đánh số: KHÔNG có — E-221–E-225 giữ nguyên số; nếu parent áp quy tắc cứng "chỉ đếm mẫu liên tiếp trong một phiên", E-220 đợt 183 = 6 mẫu + E-220 đợt 184 = 1 mẫu vẫn là cùng episode theo boot (không reboot xen giữa) — T10/parent quyết.
- **F-184-T9-4 — F-182-T9-1 KHÔNG TÁI DIỄN (KHỞI ĐỘNG DAEMON ĐÚNG NGAY LẦN 1, CẢ HAI LẦN).** T9-184 khởi động RIÊNG TỪNG daemon (`cd ... ;` tách lệnh, KHÔNG dùng `cd ... && setsid ... &`) lúc mở phiên (sampler 187371, b2watch 187421, probe-loop 187436) và lúc khởi động lại sau reboot #103 (sampler 3027, b2watch 3037, probe-loop 3050) — cả 6 lần chạy đúng ngay, 0 lỗi "No such file". Bài học đứng: khởi động daemon riêng từng cái, `cd` tách bằng `;`.
- **F-184-T9-5 — EXEC SERVICE RESTART GIẾT SLEEP CHỜ KIỂM + REBOOT #103 GIẾT DAEMON (tái diễn F-183-T9-6 lần 7).** Sleep nền chờ lượt kiểm bị giết khi exec service restart đi kèm reboot #103 (~09:15Z); daemon cũ chết theo #103 nên lượt kiểm đó KHÔNG chạy bằng sleep cũ. T9 bắt được reboot #103 trong cùng lượt kiểm lại (boot_id đã đổi lúc 09:15:39Z), khởi động lại daemon 09:15:56–09:16:0xZ (gap mẫu 96 s) + probe tay win103-open bắt được cửa sổ thoáng đang mở. KHÔNG mất số liệu sampler (log đóng băng đầy đủ 119 mẫu).
- **F-184-T9-6 — T7/T8 CHƯA đóng cờ lúc T9 đóng (~10:41Z) + T9 ĐÓNG ĐÚNG HẠN CỜ.** T9 không chờ T7/T8 (kết cục run 183/184 + cửa slot + harness thuộc T7-184/T8-184/T10; cùng mẫu đợt 177–183, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).
- **F-184-T9-7 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm GIỮ 0 — CÓ VI PHẠM MỚI F-184-T2-8 THUỘC T2).** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail ngay ở watch đầu, không tạo tải; probe mở #103 chạm cap 30.000 chỉ tạo watch trong thư mục tạm rồi giải phóng ngay — không chạm dpkg, không chạy trong cửa sổ attempt T4); 0 spike B2 trong cửa sổ attempt2 #53 (10 spike trong attempt1 là do hole-recheck T2 — F-184-T2-8, không phải T9). T4-184 phán 0 vi phạm phía T4; chuỗi 0 vi phạm GIỮ 0 do vi phạm mới của T2 — parent quyết cuối.

- **Caveat đứng:** probe cap 30.000 (giá trị mở #103 là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #102 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 184 (chỉ đọc log đóng băng); T1-184 không chạy lại suite nên không có cửa sổ T1 để đối chiếu; T7-184/T8-184 chưa đóng nên không có cửa sổ T7/T8 để đối chiếu; #103 chưa xác minh 9 nguồn (thuộc T0-185); fixture /tmp mất theo #102 — rebuild sau gate đợt 184 (ghi nhận; chỉ rebuild khi gate đã qua, không rebuild trong cửa sổ attempt).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (119 mẫu, 08:42:23Z–10:41:02Z): `round184-t9/ram-sampler-FROZEN.log` — md5 `98b951ce7fd5c6ac77522131a9f6d842`. Log B2 đóng băng (88 spike): `round184-t9/b2-spikes-FROZEN.log` — md5 `426b7b428284e7e6a94fb093d4317a80`. Log headroom đóng băng (7 lần đo): `round184-t9/headroom-log-FROZEN.txt` — md5 `7c17f377abd8fb38945b09225ae52abe`. Phân tích bằng script: `round184-t9/t9-184-analyze.py` (output: `round184-t9/t9-184-analyze-output.txt`). Ghi chú baseline: `round184-t9/t9-184-baseline-notes.md`. Probe tay cửa sổ #103: `round184-t9/probe-once.py`. T10 đọc log đóng băng trực tiếp khi cần.
