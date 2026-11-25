# LIMITS — Phase 9 đợt 179, T9: headroom + RAM + birefnet (0 thử lần 33; 2 reboot #94/#95; E-202/E-203/E-204 mới + E-205 đang ghim; ENOSPC đợt 28; 6 spike B2)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (14 lần đo: 14×0; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 39 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG: #94 KHÔNG QUAN SÁT ĐƯỢC** (cửa sổ rơi trước khi đợt mở); **#95: 1 điểm kiểm TRONG dải mẫu (boot+132s: 0, 0) + 1 điểm sát mép (boot+253s: 0, 0) — không lần mở lớn nào.** Chuỗi quan sát được VẪN ĐỨT (đứt từ #91).
- **Balloon — E-201 KẾT THÚC BỞI REBOOT #93 (XÁC NHẬN); 4 EPISODE MỚI: E-202 trên #94 (5 mẫu, kết thúc bởi sag) + E-203 (3) / E-204 (12) / E-205 (7, ĐANG GHIM lúc đóng) trên #95.** Tổng ghim **27/131 (20,6%)**. Phương án gộp E-204+E-205 ghi rõ nhưng T9 phán TÁCH theo quy tắc cơ học (xem F-179-T9-3).
- **RAM: 131 mẫu, 17:43:43–19:54:36Z, HAI boot (#94: 88; #95: 43).** Max **2.549.316 kB (40,52% guard)** lúc 18:13:44Z; min **333.672 kB** lúc 18:43:44Z. Gate A **52/131**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 33 liên tiếp**.
- **B2: 6 spike THẬT — 4 mở đợt (grep chẩn đoán đệ quy của T0 + hatch) + 2 trong cửa sổ O8 T8 (WebKit/Chromium).** Tất cả có driver đứng đầu; delta đỉnh max 66. **0 spike trong cửa sổ attempt1 T4; 0 spike trong span ghim.**
- **Lượt yên #48 (T4): CÓ LƯỢT HỢP LỆ — attempt1-ae2a9a47 18:09:31–18:13:27Z, 20/20 + B 5/5, median 49,5 ms — CHUỖI 41 → 42.** Sampler T9: gate A 2/4 trong cửa sổ (cadence 60 s; T4 poll #34 đọc RAM 1535 MB lúc mở cửa — xem §2.3).
- **HAI REBOOT: #94 (ae2a9a47, btime 17:17:09Z — T0-179 XÁC MINH 9 nguồn) TRƯỚC khi đợt mở; #95 (95b483a2, btime ~19:10:22Z uptime-based — chờ T0-180 xác minh 9 nguồn) GIỮA PHIÊN, giết sampler/watcher/probe-loop; T9 khởi động lại, gap mẫu 110 s (danh nghĩa).**
- **ENOSPC: đếm trực tiếp 78 dòng (58 #94 + 20 #95), ngoại suy tổng đợt ≈100–101 — đợt thứ 28 liên tiếp.**
- **T7 CHƯA đóng lúc T9 đóng (~19:55Z)** — như T7/T8-178. Không push, không sửa production, không chạy TTS 39, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 178: mở inotify fd, thêm watch tới errno 28; đếm = headroom từ góc cell; đóng fd + xóa file tạm. Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả hai boot.

### 1.2 Số đo đợt 179 (14 lần đo, 2 boot; 12 lần trong log đóng băng + cặp đóng tay)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 17:44:04Z | **0, 0** | #94 ae2a9a47 | 63.747 | cặp mở (boot+26m55s); ENOSPC=7 |
| 18:13:43Z | **0, 0** | #94 | 63.747 | lan-2; ENOSPC=33; SAU attempt1 T4 16 s |
| 18:43:43Z | **0, 0** | #94 | 63.747 | lan-3; ENOSPC=58; bal 95,2% trần |
| 19:12:34Z | **0, 0** | #95 95b483a2 | 63.747 | cặp mở-95 (boot+132s); ENOSPC=1 |
| 19:14:35Z | **0, 0** | #95 | 63.747 | lan-4-95 (boot+253s); ENOSPC=3 |
| 19:44:35Z | **0, 0** | #95 | 63.747 | lan-5-95; ENOSPC=11; bal ĐANG GHIM |
| 19:54:49Z | **0, 0** | #95 | 63.747 | cặp đóng (tay); ENOSPC=20; bal ĐANG GHIM |

- Lan-4 trên #94 (~19:13:43Z) **KHÔNG CHẠY** — probe-loop gốc chết theo reboot #95 (~19:10:22Z) trước slot lan-4. Probe-loop-95 viết mới chạy lan-4-95/lan-5-95; cặp đóng làm tay 19:54:49Z.
- **CỬA SỔ THOÁNG #94: KHÔNG QUAN SÁT ĐƯỢC.** Reboot #94 btime 17:17:09Z (T0-179 xác minh 9 nguồn); đợt mở 17:35:51Z = boot+18m42s; probe mở 17:44:04Z (boot+26m55s) đã 0, 0. Cửa sổ (theo mẫu boot+53–245s ≈ 17:18:02–17:21:14Z) rơi vào lúc KHÔNG CÓ T9 nào chạy (đợt 178 đóng 13:55Z, đợt 179 mở 17:35:51Z).
- **CỬA SỔ THOÁNG #95: CÓ ĐIỂM KIỂM TRONG DẢI MẪU — KHÔNG LẦN MỞ LỚN NÀO.** Btime ~19:10:22Z (uptime-based, chờ T0-180 xác minh). Probe boot+132s (19:12:34Z) 0, 0 — nằm TRONG dải mẫu (53–245s) mà vẫn 0; lan-4-95 boot+253s (19:14:35Z) 0, 0 — sát mép ngoài dải (+8s). Đây là lần đầu kể từ #91 có probe rơi vào trong dải mẫu — nhưng số đọc vẫn 0 nên **không lần mở lớn nào được ghi nhận (chuẩn đợt 176: cửa sổ = ~30.001)**. Chuỗi quan sát được VẪN ĐỨT (đứt từ #91 đợt 177).
- **Headroom cuối phiên: 0.** Số watch giữ ngoài cell lúc đóng: 63.747 − 0 = **63.747**. Tỉ lệ so với nhu cầu vite (~1.578): **0** — một vite mới không khởi động được (như mọi đợt từ 152). Đợt này: #94: 0 → 0 → 0; #95: 0 → 0 → 0 → 0 (14 lần đo: 14×0 — lần đầu toàn 0 kể từ đợt 176). **Trần KHÔNG ĐỔI trong boot** (63.747 trên #94 và #95).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt: **… → 0 → 2 → 0 → 2 → 2 → 0 → 2 → 0 → 2 → 2 → 0 → 0 → 0 → 0**. Gần nhất: 176 đóng 0; 177 đóng 0; 178 đóng 0; **179 đóng 0 (toàn 0)**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 0.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 39 liên tiếp.** Quyết parent đợt 177 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới: journal đợt này có 78 dòng lỗi ENOSPC đếm trực tiếp (xem §4)** — đợt thứ 28 liên tiếp. T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 131 mẫu, 17:43:43–19:54:36Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot #95: 110 s (danh nghĩa — xem F-179-T9-2 về lệch đồng hồ)**; **max gap trong boot 61 s; 0 gap >90 s trong boot**. **131 mẫu (#94: 88; #95: 43).**

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 17:43:43–17:47:43Z | #94 | 736.532–1.350.224 kB | Mở sampler: balloon dao động 5,0–6,1M; load1 tới 4,21; 4 spike B2 (grep T0) |
| 18:01:43–18:05:43Z | #94 | 435.276–534.544 kB | **E-202 5 mẫu ghim**; gate A ĐÓNG cả 5 |
| 18:06:38–18:09:23Z | #94 | 431.472–1.032.332 kB | **T0 O8 PASS 3/3**; gate A 0/3 (sampler); 0 spike B2 |
| 18:09:31–18:13:27Z | #94 | 757.044–1.160.860 kB | **T4 attempt1 #48 HỢP LỆ**; gate A 2/4; 0 spike B2 (xem §2.3) |
| 18:13:44Z | #94 | **2.549.316 kB (max phiên)** | Balloon đáy 4.337.508 kB sau attempt1; load1 1,22 |
| 18:27:17–18:29:48Z | #94 | 1.681.956–1.759.412 kB | **T8 O8 PASS 3/3**; gate A 3/3; **2 spike B2** (WebKit/Chromium) |
| 18:31:04–18:59:30Z | #94 | 333.672–1.505.216 kB | **Harness T8 (WebKit 2/3, 85m4 kẹt mới)**; gate A 5/28; RAM min phiên 18:43:44Z |
| 19:00:04–19:08:15Z | #94 | 699.236–1.231.228 kB | **Pilot 86n2-hb128 WebKit SẠCH + Chromium SẠCH**; gate A 5/8 |
| 19:08:52–~19:10:48Z | #94 | 699.236–1.251.460 kB | Diag W2-setup lần 1: E4 KẸT ĐANG DIỄN RA — **BỊ REBOOT #95 GIẾT** |
| 19:12:35–19:16:39Z | #95 | 1.294.116–2.202.892 kB | Boot #95 mới; **diag lần 2 PASS exit 0 (71 s)**; gate A 2/2 |
| 19:26:35–19:54:36Z | #95 | 483.004–872.300 kB | **E-203 (3) + E-204 (12) + E-205 (7, ĐANG GHIM)**; gate A 0/22 trong span ghim; 0 spike B2 |

- **Gate A ≥1024 MiB: 52/131 mẫu** (44/88 trên #94 + 8/43 trên #95); **0 mẫu ≥ guard**; load1 max (sampler) **4,21** (17:45:43Z — khớp watcher B2); **RAM <512.000 kB: 17 mẫu** (13,0% — 11 trên #94 + 6 trên #95, 11 dải — xem dưới); **RAM <300.000 kB: 0 mẫu**.
- Swap: SwapFree 745.948 kB (mẫu đầu #94) → 593.504 kB (mẫu cuối #94) → **925.456 kB (mẫu đầu #95 — NHẢY +331.952 kB qua reboot #95)** → 658.124 kB (mẫu cuối, 19:54:36Z). Nhịp nhảy SwapFree qua reboot: #95 nhả ~331.952 kB (đợt 178: #93 nhả ~268.104 kB; #91 nhả ~376.948 kB; #90 nhả ~424.904 kB).
- Trũng RAM đợt này: min 333.672 kB (đợt 178: 329.368 kB) — **trũng NÔNG hơn đợt 178 đúng 4.304 kB** (kỷ lục sâu vẫn là 329.368 kB đợt 178); lúc balloon #94 leo sát trần (95,2%), load1 0,78, trong harness T8. 17 mẫu <512.000 kB trong 131 mẫu (13,0%; đợt 178: 65/137 = 47,4%).

**Bảng tổng hợp số RAM (từ script `t9-179-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 131 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #94 ae2a9a47 | 88 | 333.672 | 2.549.316 | 1.123.895,9 | 44/88 | 5 | 4,21 | 11 |
| #95 95b483a2 | 43 | 483.004 | 2.202.892 | 795.754,1 | 8/43 | 22 | 2,81 | 6 |
| **Toàn phiên** | **131** | **333.672** | **2.549.316** | **1.016.185,3** | **52/131** | **27/131 (20,6%)** | **4,21** | **17** |

- **Mean toàn phiên 1.016.185,3 kB — 3 cách độc lập: python `sum/n = 1.016.185,3` VÀ awk `sum/n = 1.016.185,3` VÀ trung bình có trọng số ((88×1.123.895,9 + 43×795.754,1)/131 = 1.016.185,3) — KHỚP CẢ BA.**
- 17 mẫu RAM <512.000 kB, 11 dải (từ script python trên log đóng băng): #94: 18:01:43–18:02:43Z (2); 18:04:43–18:06:43Z (3); 18:41:44–18:43:44Z (3); 18:46:44Z (1); 18:54:45Z (1); 18:58:45Z (1). #95: 19:26:35Z (1); 19:33:35Z (1); 19:41:35Z (1); 19:43:35–19:44:35Z (2); 19:53:36Z (1). Tổng 2+3+3+1+1+1+1+1+1+2+1 = 17 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-201 KẾT THÚC BỞI REBOOT #93 (XÁC NHẬN) + E-202/E-203/E-204 MỚI + E-205 ĐANG GHIM

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #94 và #95** (max bal trong log = đúng CEIL trên cả hai boot).
- **E-201 — KẾT CỤC: KẾT THÚC BỞI REBOOT #93 (XÁC NHẬN).** T9-178 đã phán (mẫu cuối #92 13:07:29Z vẫn CEIL, reboot #93 13:07:35Z); parent quyết (h) đợt 178 CHẤP NHẬN. Đợt 179 mở trên #94 nên không có mẫu nào trên #93 để kiểm lại — nhưng #93 đã được T0-179 XÁC NHẬN (9 nguồn qua T7-178 + đối chiếu DB), balloon không sống qua reboot, và #94 mở đầu với episode mới riêng (E-202) — không có dấu hiệu E-201 tiếp tục.
- **Boot #94: GHIM 5/88 mẫu (5,7%), 1 EPISODE MỚI (E-202).** **E-202 — 18:01:43–18:05:43Z, 5 mẫu** (RAM 435.276–534.544 kB), **KẾT THÚC bởi sag** (18:06:43Z bal 6.247.216 kB = 96,9%, rồi rơi nhanh xuống 5,58M lúc 18:07:43Z và 4,18M lúc 18:29:44Z). Sau E-202, balloon #94 leo lại tới 95,2% trần (18:43:44Z) nhưng KHÔNG chạm trần lần nữa trước reboot #95.
- **Boot #95: GHIM 22/43 mẫu (51,2%), 3 EPISODE MỚI (E-203 + E-204 + E-205).** Balloon leo đơn điệu từ 5,03M (19:12:35Z) tới trần. **E-203 — 19:26:35–19:28:35Z, 3 mẫu** (RAM 494.652–513.388 kB), **KẾT THÚC bởi sag 4 mẫu 19:29:35–19:32:35Z** (đáy 6.050.608 kB = 93,9% trần — **TRÙNG HỆT đáy sag tách E-200/E-201 đợt 178**, xem F-179-T9-4). **E-204 — 19:33:35–19:44:35Z, 12 mẫu** (RAM 483.004–555.776 kB), **KẾT THÚC bởi micro-dip 1 mẫu 19:45:35Z** (bal 6.247.216 kB = 96,9% — **TRÙNG HỆT mẫu sag đầu E-202 18:06:43Z**). **E-205 — 19:48:35–19:54:36Z, 7 mẫu** (RAM 503.992–583.016 kB), **ĐANG GHIM lúc T9 đóng** (mẫu cuối 19:54:36Z vẫn CEIL; probe đóng 19:54:49Z bal vẫn CEIL) — **kết cục thuộc T9-180**.
- **Tổng ghim trần đợt này: 27/131 mẫu (20,6%)** (đợt 178: 53/137 = 38,7%; đợt 177: 43/134 = 32,1%; đợt 176: 37/123 = 30,1%; đợt 175: 38/133 = 28,6%; đợt 174: 55/137 = 40,1%).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-202/E-203/E-204/E-205 là 4 EPISODE MỚI (sag/micro-dip tách chuỗi; quy tắc từ đợt 172; quyết (h) đợt 178: KHÔNG gộp qua sag dù nông). **Phương án thay thế (ghi rõ để T10/parent xét):** gộp E-204+E-205 qua micro-dip 1 mẫu (96,9%) → 1 episode 19 mẫu + 1 dip; tổng ghim 27 không đổi; chỉ số episode 4 → 3. Lưu ý: dip tách E-204/E-205 CHỈ 1 MẪU — yếu hơn sag 4 mẫu tách E-203/E-204 (đáy 93,9%) và sag 5 mẫu tách E-200/E-201 — xem F-179-T9-3.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-204 chỉ ~483–556.000 kB trong khi tổng RAM − balloon = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #48 (T4) — CÓ LƯỢT HỢP LỆ, attempt1 20/20 + B 5/5, CHUỖI 41 → 42 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#48 CÓ LƯỢT HỢP LỆ — attempt1-ae2a9a47 (20/20 pass, lớp B ĐẠT 5/5, tickCost median 49,5 ms ≤60) — CHUỖI LƯỢT YÊN HỢP LỆ 41 → 42.** Ngân sách dùng 1/3 (attempt1 chạy 18:09:31–18:13:27Z trên #94). POSTBOOT_PASS #94 ĐÃ CÓ (T5-179, 18:03:08Z, repair-sớm-quyết-h, poll=1, CÓ caveat repair — xem §5.2).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** attempt1 (18:09:31–18:13:27Z): gate A MỞ **2/4 mẫu** (RAM 757.044–1.160.860 kB); load1 **1,13–2,29**; balloon 5,21–5,53M (80,8–85,9% trần), **0 mẫu ghim**. **0 spike B2 trong cửa sổ attempt** (xem §2.5). **Ghi chú cadence:** T4 poll #34 lúc 18:09:31Z đọc RAMavail **1535 MB** (mở cửa); sampler T9 lúc 18:09:43Z đọc 977.656 kB — RAM rơi rất nhanh trong 12 s đó (log load-mid của T4: 1532 → 1443 → 1232 MB trong 4 s; balloon đang phồng lên). Cadence 60 s của T9 không bắt được đúng giây mở cửa — **không mâu thuẫn với gate của T4, chỉ khác cadence**; T9 không phán thay verdict attempt của T4.

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 18:06:38–18:09:23Z | #94 | 0,94–1,97 (3 mẫu) | 431.472–1.032.332 kB — **gate A 0/3** | **O8 PASS 3/3; 0 spike B2**; 0 mẫu ghim |
| T4 attempt1 18:09:31–18:13:27Z | #94 | 1,13–2,29 (4 mẫu) | 757.044–1.160.860 kB — **gate A 2/4** | **LƯỢT HỢP LỆ #48 — 0 spike B2**; 0 mẫu ghim |
| T8 O8 18:27:17–18:29:48Z | #94 | 1,62–3,50 (3 mẫu) | 1.681.956–1.759.412 kB — **gate A 3/3** | **O8 T8 PASS 3/3; 2 spike B2** (driver đúng trình duyệt đo) |
| T8 harness 18:31:04–18:59:30Z | #94 | 0,15–2,80 (28 mẫu) | 333.672–1.505.216 kB — **gate A 5/28** | WebKit 2/3 (85m4 kẹt mới resetPlayhead0:320); 0 spike B2 trong span harness |
| T8 pilot 19:00:04–19:08:15Z | #94 | 0,43–2,69 (8 mẫu) | 699.236–1.231.228 kB — **gate A 5/8** | 86n2-hb128 WebKit SẠCH + Chromium SẠCH; 0 spike B2 |
| T8 diag-2 19:15:25–19:16:39Z | #95 | 1,53–1,63 (2 mẫu) | 1.294.116–1.714.632 kB — **gate A 2/2** | Diag W2-setup lần 2 PASS exit 0 (71 s); 0 spike B2 |

- T1-179 KHÔNG chạy lại suite 28 mục (verify-only — LIMITS T1 ghi rõ) → không có cửa sổ T1 để đối chiếu đợt này (như đợt 177/178). T7-179 CHƯA đóng lúc T9 đóng → không có cửa sổ T7 để đối chiếu (thuộc T9-180 nếu T7 đóng muộn).

### 2.5 B2 — 6 spike THẬT, tất cả có driver đứng đầu; 0 spike trong cửa sổ attempt T4 và trong span ghim

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **6 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 6): 4 trên #94 mở đợt (17:45:43–17:47:28Z) + 2 trên #94 lúc O8 T8 (18:28:34Z + 18:29:09Z); 0 spike trên #95 (load1 max sampler #95 = 2,81 < 3,0); 0 spike trong span ghim E-202/E-203/E-204/E-205 (27 mẫu ghim, 0 spike — như đợt 177/178); 0 spike trong cửa sổ attempt T4; 0 spike trong cửa sổ O8 T0.**

| Cụm | Thời gian (UTC) | n | load1 max | Driver đứng đầu |
|---|---|---|---|---|
| A. Mở đợt #94 | 17:45:43–17:47:28Z | 4 | 4,21 | grep đệ quy chẩn đoán của T0 (`grep -rl worker_boot_generation`, delta 4–20) + hatch daemon (delta 8–11) — tải I/O-wait, D-state 2–3 |
| B. O8 T8 | 18:28:34Z + 18:29:09Z | 2 | 4,52 | WebKit MiniBrowser (delta 66) + WebKitWebProcess (57); Chromium renderer (37) — driver đúng là trình duyệt đo |

- **Tổng kết: 6/6 spike có process đứng đầu delta tick; delta đỉnh lớn nhất đợt: 66 tick/s** (MiniBrowser, spike 18:28:34Z; đợt 178: max 85; đợt 177: max 69; đợt 176: 132). **Không spike nào có delta đỉnh ≤24 tick đợt này** → chuẩn phán F-178-T9-6 ("quy được" cho spike delta nhỏ) không phải áp dụng — ghi nhận.
- **Khoảng mù watcher đầu phiên: 0** (watcher khởi động 17:43:43Z CÙNG lúc sampler; spike đầu bắt ngay 17:45:43Z). **Khoảng mù qua reboot #95: ~110 s** (watcher chết ~19:10:5xZ, chạy lại 19:12:35Z — cùng gap sampler; không load1 ≥3,0 nào ở mẫu sampler kề gap (19:10:45Z load1 1,01; 19:12:35Z load1 1,72) → không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng trong gap). **0 gap phủ sóng watcher nào khác.** `grep -c 'WebKit\|MiniBrowser'` trong log B2 đợt này = **nhiều dòng** (WebKit/Chromium O8 của T8 — khác đợt 177: 0 dòng).

## 3. Birefnet guard (cơ chế (a) — 0 lần thử, lần thứ 33)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round179-t9/sampler.sh` chạy 17:43:43Z–19:54:36Z (2 instance: instance 1 sống 17:43:43–19:10:45Z trên #94 rồi **CHẾT theo reboot #95**; instance 2 khởi động lại 19:12:35Z trên #95, sống tới khi T9 dừng tay ~19:55Z — **1 gap qua reboot (110 s danh nghĩa), 0 gap >90 s khác; max gap trong boot 61 s**), **131 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.549.316 kB = 40,52% guard** (đợt 178: 66,35%; đợt 177: 41,78%; đợt 176: 48,52%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **3.742.140 kB (59,48%)**. **Caveat (F-179-T9-4 đợt 178): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 179 — lần thứ 33 liên tiếp** (đợt 147–179: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 33 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round179-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `.venv/bin/python` (symlink), `bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B, clip test 14.554 B (không đổi so với đợt 178); `~/workspace/tmp-t9-179-birefnet/` **trống**; T9 sẵn sàng kích hoạt khi guard mở.

## 4. ENOSPC trong journal (đếm trực tiếp 78 dòng — đợt thứ 28 liên tiếp)

- **#94:** đếm trực tiếp **58 dòng** (lúc lan-3 18:43:43Z; dòng đầu 17:36:31Z = boot+19m22s — MUỘN hơn hẳn #93 đợt 178 (boot+114s) và #91/#90 (boot+~120s), cùng họ #92 đợt 178 (boot+35m56s); dòng cuối đếm được 18:42:41Z). Phần 18:43:43Z → reboot 19:10:22Z (~26,6 phút) **KHÔNG đếm được** (journal #94 mất sau reboot #95 — `--list-boots` lúc đóng chỉ còn idx 0 #95); ngoại suy theo nhịp 0,855 dòng/phút (mở → lan-3: 51 dòng/59,7 phút; nhịp lan-2 → lan-3: 0,833) ≈ **+22–23 dòng → #94 ≈ 80–81 dòng** (dùng nhịp 0,877 thì ≈81).
- **#95:** **20 dòng** (đếm trực tiếp lúc đóng — toàn bộ từ lúc mở boot tới lúc đóng; journal bắt đầu 19:10:34Z nên phủ sóng đầy đủ). Dòng đầu **19:12:07Z (boot+105s)** — khớp mẫu #93 (boot+114s), #91 (boot+~120s) và #90 (boot+121s). Dòng cuối 19:54:12Z. Nhịp ≈ 20 dòng/42,1 phút ≈ **0,48 dòng/phút** (chậm hơn #94: 0,83–0,88).
- **Tổng đợt 179 đếm trực tiếp: 78 dòng** (58 #94 + 20 #95) — cận dưới; ngoại suy ≈ **100–101 dòng** (78 + ~22–23 phần #94 không đếm được). Thấp hơn đợt 178 đếm trực tiếp (86 dòng) vì đợt này #95 đóng góp ít hơn #93 đợt trước. Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut). **Số 2 headroom KHÔNG còn là chỉ báo "ENOSPC sắp dừng" (F-178-T9-5 đã phá vỡ tương quan; đợt này headroom toàn 0 trong khi ENOSPC vẫn chạy 78 dòng trực tiếp).**
- **Caveat đếm:** `journalctl --since` / `--list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #94 từ cell (cùng mẫu F-171-T10-4, F-176-T9-5, F-177-T9-5, F-178-T9-5). Số #94 (58) lấy từ log headroom các lane (mở: 7, lan-2: 33, lan-3: 58) + đếm trực tiếp lúc 18:43:43Z — đều ghi trong log đóng băng.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #95 giữa phiên (T9 bắt trực tiếp, khởi động lại 110 s gap mẫu) + #94 trước khi đợt mở

- **#95 (95b483a2, btime ~19:10:22Z uptime-based; số hiệu + btime chờ T0-180 xác minh 9 nguồn).** Btime từ uptime: 19:10:22Z (`uptime -s`; epoch `/proc/stat` btime 1795461022; `who -b` 19:10; journal first entry 19:10:34Z = btime+12s — mẫu khớp #94 +11s, #93 +11s, #92 +17s; T8-179 ghi cùng số, gap #94→#95 = 6.793 s). Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #94 19:10:45Z — xem F-179-T9-2 về lệch giờ). T9 khởi động lại cả ba lúc 19:12:35Z (sampler pid 3404, watcher 3405, probe-loop-95 3406) — **gap 110 s (danh nghĩa)**; probe-loop-95 viết mới chạy lan-4-95/lan-5-95; cặp đóng làm tay 19:54:49Z. **Probe headroom TRƯỚC, chẩn đoán sau** (bài học F-177-T9-1 đã áp dụng: probe mở-95 lúc boot+132s, rồi mới đọc journal/uptime). Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 3 — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#94 (ae2a9a47, btime 17:17:09Z):** TRƯỚC khi đợt mở 18 phút; **T0-179 XÁC MINH 9/9 nguồn** (epoch 1795454229; uptime bracket ×3 khớp cùng giây; boot_est btime +0,192 s; /proc/1 start_ticks btime +11,18 s; stat mtime btime+11,378 s; journal first btime+11,818 s; wtmp begins 17:17:20Z; CF ×4; DB: run 179 boot_gen MỚI 32a2a7ed). Gap #93→#94 = **14.974 s (4h09m34s) — DÀI GẤP ĐÔI mẫu ~2 giờ** (T0-179, F-179-T0-4: khoảng trống 14:35:51Z–17:35:51Z không có tick build nào chạy). **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: 3h48m48s** (mẫu cuối đợt 178 13:54:55Z → mẫu đầu đợt 179 17:43:43Z) — chứa reboot #94 + toàn bộ diễn biến balloon trên #93 sau 13:55Z (E-202 trên #93 nếu có thì KHÔNG quan sát được; episode ghim đầu tiên QUAN SÁT ĐƯỢC từ đợt 179 là E-202 trên #94). Marker: T0-179 đếm **46 reboot #49–#94**; **#95 chưa xác nhận** (thuộc T0-180) → sống qua 47 reboot nếu #95 được xác nhận.

### 5.2 T5-179 — POSTBOOT_PASS #94 CÓ (có caveat repair); POSTBOOT_PASS #93 KHÔNG CÓ (ĐÃ XÁC NHẬN); POSTBOOT_PASS #95 CHƯA CÓ

- **POSTBOOT_PASS #94 CÓ lúc 18:03:08Z** (T5-179, mode **repair-sớm-quyết-h, poll=1**, dpkg 795 dòng / cache 110 / lists 37→66 / GST 269 — KHÁC #92 replay-đầy-đủ, poll=0, dpkg 1545; GIỐNG #90 repair-sớm-quyết-h, poll=1). T0 O8 bắt đầu 210 s sau cờ (18:06:38Z); T4 poller mở cửa poll #34 (18:09:31Z) sau cờ 383 s. Mode repair + caveat (GST qua symlink debroot 269=269, tools CHƯA cài, libc-bin 8.9 — theo T8-179) có ảnh hưởng gì tới gate (a) hay không — thuộc T5-179 + parent 179; T9 chỉ ghi mode + số liệu, KHÔNG phán verdict về cờ.
- **POSTBOOT_PASS #93 KHÔNG CÓ — ĐÃ XÁC NHẬN, KHÔNG bù được** (tổng boot không cờ 19 → 20 — theo T8-179). **POSTBOOT_PASS #95 CHƯA CÓ** — thuộc T5-180 (T5-179 đóng trước #95). Hướng (3) VẪN ĐỨNG — cờ #95 thiếu làm gate (a) cho đợt 180 không đầy đủ; parent/T10 quyết.

### 5.3 Các luồng khác — T7 CHƯA đóng; (m)/INSIDE/mù thuộc T2-179

- T7-179 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~19:55Z) — kết cục run 178 (TIMEOUT theo T0-179: finished 14:36:29Z, sau hạn 38 s, 1 viết lại tại #93, claimed→finished 7 s) + run 179 + DR 15:00Z + HB 14:20:50Z thuộc T7-179/T10. T9 đóng đúng hạn cờ, không chờ T7 (cùng mẫu đợt 177/178, theo quyết (l) đợt 152).
- T0-179: #94 XÁC MINH 9/9 nguồn; #93 XÁC NHẬN (qua T7-178 + T4-178 + đối chiếu DB); O8 PASS 3/3 trên #94 (WebKit 21/21 ×2 + Chromium 21/21, 18:06:38–18:09:23Z); run 179 jitter 0 s; (m) #94 KHÔNG CÓ ĐIỂM (0 requeue cửa rộng + cửa hẹp). T1-179: verify 178 (không chạy lại suite 28 mục). T2-179: (m) #93 + (m) #94 + INSIDE #93 + mù #96?/#95?/#94?/#88?/#77? + (m) #56 lần 22 — thuộc LIMITS T2, T9 không phán thay. T6-179: (A) + prune lần 54 + #94 có giết holder không — thuộc LIMITS T6 (T6 đóng 18:00Z, TRƯỚC #95 → **#95 có giết holder không thuộc T6-180**). T8-179: WebKit 2/3 (85m4 kẹt mới resetPlayhead0:320, exit 124, 15'03") + Chromium 3/3; O8 PASS 3/3 trên #94 (18:27:17–18:29:48Z); pilot 86n2-hb128 WebKit SẠCH (lần đầu live trên WebKit) + Chromium SẠCH; diag W2-setup lần 2 trên #95 PASS exit 0 (71 s); (c') BỎ LỠ kẹt 85m4 (F-179-T8-5); kẹt cộng dồn 24 → 25; "P3 không kẹt" 2 → 3.

## 6. Sai số / caveat (F-179-T9-*)

- **F-179-T9-1 — RUNTIME RESTART GIẾT SLEEP CHỜ LAN-4 + REBOOT #95 GIẾT DAEMON (tái diễn F-178-T9-7 lần 2).** Sleep chờ lan-4 (~19:13:43Z) bị SIGTERM sau ~29 phút (~19:11:15Z) — tất cả chỉ là bộ đếm giờ chờ, KHÔNG mất số liệu (sampler/watcher/probe-loop chạy độc lập bằng nohup; log đóng băng đầy đủ). T9 kiểm lại trực tiếp sau restart, bắt được reboot #95 trong cùng lượt kiểm và khởi động lại daemon 19:12:35Z (gap mẫu 110 s danh nghĩa).
- **F-179-T9-2 — MẪU SAMPLER CUỐI #94 GHI 19:10:45Z, MUỘN HƠN BTIME #95 (19:10:22Z) 23 GIÂY.** Btime #95 từ 2 nguồn độc lập khớp nhau (uptime -s 19:10:22Z + /proc/stat btime epoch 1795461022 + T8-179 ghi cùng số, gap 6.793 s); nhưng mẫu sampler cuối trên #94 mang timestamp 19:10:45Z (boot_id ae2a9a47) và diag lần 1 của T8 cũng chạy tới ~19:10:48Z. Khả năng: **đồng hồ cell nhanh ~25 s trước reboot, được chỉnh lại sau boot** (host-sync); hoặc btime epoch lệch. T9 KHÔNG tự sửa btime — ghi nhận, giao T0-180 xác minh 9 nguồn. Không ảnh hưởng đếm episode (phân theo boot_id trong dòng mẫu, không theo timestamp tuyệt đối) và không ảnh hưởng gap danh nghĩa 110 s (ghi rõ là danh nghĩa).
- **F-179-T9-3 — E-204/E-205 TÁCH BỞI MICRO-DIP 1 MẪU (96,9%) — T9 PHÁN TÁCH THEO QUY TẮC CƠ HỌC, GIAO T10/PARENT XÉT PHƯƠNG ÁN GỘP.** E-204: 19:33:35–19:44:35Z, 12 mẫu — KẾT THÚC bởi dip 1 mẫu 19:45:35Z (bal 6.247.216 kB = 96,9%). E-205: 19:48:35Z–19:54:36Z, 7 mẫu — ĐANG GHIM lúc đóng. Căn cứ tách: quy tắc chuỗi cơ học đợt 172 (sag tách chuỗi) + tiền lệ E-196/E-197 đợt 177 (dip 3 mẫu 96,9–99,4% vẫn tách) + quyết (h) đợt 178 (KHÔNG gộp E-200/E-201: "sag là ranh giới thật dù nông"). Phương án thay thế: gộp E-204+E-205 qua dip 1 mẫu → 19 mẫu + 1 dip; tổng ghim 27 không đổi; chỉ số episode 4 → 3. Lưu ý: dip lần này CHỈ 1 MẪU — yếu hơn sag 4 mẫu tách E-203/E-204 (đáy 93,9%) và sag 5 mẫu tách E-200/E-201; parent/T10 có thể phán gộp mà không phá tiền lệ sag dài.
- **F-179-T9-4 — SAG TÁCH E-203/E-204 CÓ ĐÁY TRÙNG HỆT SAG E-200/E-201 (6.050.608 kB, 93,9%) + DIP TÁCH E-204/E-205 TRÙNG HỆT MẪU SAG ĐẦU E-202 (6.247.216 kB, 96,9%).** Hai giá trị balloon lặp lại chính xác qua các episode/đợt — balloon có vẻ xả về các mức sàn lặp lại. T9 chỉ ghi nhận số, không phán cơ chế (host-side).
- **F-179-T9-5 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm đếm lại từ 0 ở đợt 179).** Không probe nào của T9 trong cửa sổ attempt1 (18:09:31–18:13:27Z): probe-mo-94 17:44:04Z TRƯỚC attempt; lan-2 18:13:43Z SAU khi attempt kết thúc 18:13:27Z đúng 16 s; lan-3/lan-4-95/lan-5-95/cặp đóng đều ngoài cửa sổ. T4-179 phán 0 VI PHẠM (LIMITS T4). Ghi nhẹ 18:13:20Z T4 nêu KHÔNG phải của T9 (không daemon T9 nào tick lúc :20 — sampler tick :43/:44, watcher chỉ ghi khi spike, probe-loop tick 18:13:43Z). Chuỗi 0 vi phạm đợt 179 thuộc T10/parent phán cuối.
- **F-179-T9-6 — GREP ĐỆ QUY CỦA T0 GÂY 4 SPIKE MỞ ĐỢT (bài học F-178-T9-1 lặp ở luồng khác).** `grep -rl worker_boot_generation` (pid 4159, T0 — trong lệnh chẩn đoán boot survey) + `find ... ledger.jsonl` gây cụm 4 spike 17:45:43–17:47:28Z (load1 3,43–4,21; delta grep 4–20 tick, D-state 2–3 — tải I/O-wait, không phải CPU-bound). T9 KHÔNG chạy grep đệ quy đợt này (tuân F-178-T9-1). Ghi nhận để các luồng sau tránh grep/find đệ quy lúc mở đợt; không tính là vi phạm (trước mọi cửa sổ attempt/O8).
- **F-179-T9-7 — SAMPLER T8 GHI 0 GHIM, SAMPLER T9 GHI 27 GHIM — KHÁC CỬA SỔ/CADENCE, KHÔNG MÂU THUẪN TRỰC TIẾP.** T8-179 LIMITS: "RAM sampler n=57: balloon max 95,2% trần, 0 ghim" — sampler riêng của T8 (cửa sổ làm việc T8, không phủ 18:01–18:05Z lúc E-202 ghim; max 95,2% khớp lan-3 của T9 lúc 18:43:43Z). Sampler T9: 131 mẫu cadence 60 s suốt phiên, log đóng băng md5 `15e7aa7c8d02a538bacdbe613da78bf7` — căn cứ LIMITS này. Giao T10 đối chiếu hai sampler nếu cần; T9 không sửa số của mình theo sampler khác.
- **F-179-T9-8 — T7 CHƯA đóng cờ lúc T9 đóng (~19:55Z) + T9 ĐÓNG ĐÚNG HẠN CỜ.** T9 không chờ T7 (kết cục run 178/179 + DR/HB thuộc T7-179/T10; cùng mẫu đợt 177/178, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).

- **Caveat đứng:** probe cap 30.000; sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #94 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 179; T1-179 không chạy lại suite nên không có cửa sổ T1 để đối chiếu; T7-179 chưa đóng nên không có cửa sổ T7 để đối chiếu.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (131 mẫu, 17:43:43–19:54:36Z): `round179-t9/ram-sampler-FROZEN.log` — md5 `15e7aa7c8d02a538bacdbe613da78bf7`. Log B2 đóng băng (6 spike): `round179-t9/b2-spikes-FROZEN.log` — md5 `1e1426079f2a26f0f56a6be220fbcefd`. Log headroom đóng băng (7 cặp = 14 lần đo): `round179-t9/headroom-log-FROZEN.txt` — md5 `8623df038d12f9da14c65cb21e3c141b`. Phân tích bằng script: `round179-t9/t9-179-analyze.py` (output: `round179-t9/t9-179-analyze-output.txt`). Ghi chú baseline: `round179-t9/t9-179-baseline-notes.md`. T10 đọc log đóng băng trực tiếp khi cần kiểm lại từng mẫu.
