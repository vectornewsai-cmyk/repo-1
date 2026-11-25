# LIMITS — Phase 9 đợt 178, T9: headroom + RAM + birefnet (0 thử lần 32; 2 reboot #92/#93; E-199 kết thúc bởi reboot; E-200/E-201 mới; ENOSPC đợt 27; 44 spike B2)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (18 lần đo: 12×0, 6×2; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 38 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG: KHÔNG QUAN SÁT ĐƯỢC trên cả #92 lẫn #93.** #92: không probe nào trong cửa sổ (reboot trước khi đợt mở; probe mở boot+37m đọc 0). #93: 3 điểm kiểm boot+81s (0,0), boot+216s (2,2), boot+335s (0,0) — không lần mở lớn nào. Chuỗi quan sát được VẪN ĐỨT (đứt từ #91 đợt 177).
- **Balloon — E-199 KẾT THÚC BỞI REBOOT #92 (2 mẫu, cận dưới, trong khoảng mù); 2 EPISODE MỚI TRÊN #92: E-200 (35) + E-201 (18), tách bởi sag nông 5 mẫu.** Tổng ghim **53/137 (38,7%)**. Phương án gộp ghi rõ nhưng KHÔNG dùng. #93: 0 mẫu ghim (max 95,5% trần).
- **RAM: 137 mẫu, 11:38:25–13:54:55Z, HAI boot (#92: 90; #93: 47).** Max **4.174.452 kB (66,35% guard)** lúc 11:41:25Z; min **329.368 kB** lúc 13:53:55Z — trũng SÂU nhất từ trước tới nay (sâu hơn đợt 177 đúng 125.344 kB). Gate A **42/137**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 32 liên tiếp**.
- **B2: 44 spike THẬT (đợt 177 chỉ 2) — bão tải mở đợt + replay/apt + O8.** Tất cả có driver đứng đầu; 6 spike delta đỉnh ≤24 tick (tải phân tán, xem §2.5). **0 spike trong cửa sổ attempt1 T4.**
- **Lượt yên #47 (T4): CÓ LƯỢT HỢP LỆ — attempt1-97054ac6 13:12:16–13:16:08Z, 20/20 + B 5/5, median 45,0 ms — CHUỖI 40 → 41.** Sampler T9: gate A 4/4, load1 0,57–1,55, 0 mẫu ghim trong cửa sổ.
- **HAI REBOOT GIỮA PHIÊN: #92 (985bc2a3, btime 11:01:27Z — T0-178 XÁC MINH 9 nguồn) TRƯỚC khi đợt mở; #93 (97054ac6, btime 13:07:35Z uptime-based — chờ T0-179 xác minh 9 nguồn) GIỮA PHIÊN, giết sampler/watcher/probe-loop; T9 khởi động lại trong 85 s gap mẫu.** Lan-4 KHÔNG CHẠY (probe-loop chết đúng hạn lan-4).
- **ENOSPC: đếm trực tiếp 86 dòng (50 #92 + 36 #93), ngoại suy tổng đợt ≈108–109 — đợt thứ 27 liên tiếp.** Journal #92 MẤT sau reboot #93 nên phần 12:38–13:07Z của #92 không đếm được (ngoại suy +22–23).
- **F-177-T4-4 ĐÃ HẾT:** `b2-spikes.log` đợt 178 đã có từ 11:38:25Z (T4-178 đối chiếu được live); bổ sung kiểm lại log đóng băng 177: 0 spike trong cửa sổ attempt1 #46 (xem §6).
- T7/T8 CHƯA đóng lúc T9 đóng (~14:00Z) — như T7-177. Không push, không sửa production, không chạy TTS 39, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 177: mở inotify fd, thêm watch tới errno 28; đếm = headroom từ góc cell; đóng fd + xóa file tạm. Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả hai boot.

### 1.2 Số đo đợt 178 (18 lần đo, 2 boot; 16 lần trong log đóng băng + cặp đóng tay)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 11:38:28Z | **0, 0** | #92 985bc2a3 | 63.747 | cặp mở (boot+37m); ENOSPC=1 |
| 12:08:25Z | **2, 2** | #92 | 63.747 | lan-2; ENOSPC=27; bal 98,2% trần |
| 12:38:25Z | **2, 2** | #92 | 63.747 | lan-3; ENOSPC=50; bal ĐANG Ở TRẦN |
| 13:08:56Z | **0, 0** | #93 97054ac6 | 63.747 | cặp mở-93 (boot+81s); ENOSPC=0 |
| 13:11:11Z | **2, 2** | #93 | 63.747 | boot+216s; ENOSPC=0 |
| 13:13:10Z | **0, 0** | #93 | 63.747 | boot+335s; ENOSPC=0; TRONG cửa sổ attempt1 T4 (xem F-178-T9-2) |
| 13:38:54Z | **0, 0** | #93 | 63.747 | lan-5-93; ENOSPC=21 |
| 13:55:44Z | **0, 0** | #93 | 63.747 | cặp đóng (tay) + cặp log 13:55:45Z cũng 0, 0; ENOSPC=35 |

- Lan-4 (~13:08:25Z) **KHÔNG CHẠY** — probe-loop gốc chết theo reboot #93 đúng lúc lan-4 đến hạn (reboot 13:07:35Z). Probe-loop-93 viết mới chỉ chạy lan-5.
- **CỬA SỔ THOÁNG #92: KHÔNG QUAN SÁT ĐƯỢC.** Reboot #92 btime 11:01:27Z (T0-178 xác minh 9 nguồn); đợt mở 11:35:51Z = boot+34m; probe mở 11:38:28Z (boot+37m) đã 0, 0. Cửa sổ (nếu có, theo mẫu boot+53–245s ≈ 11:02:20–11:05:32Z) rơi vào lúc KHÔNG CÓ T9 nào chạy (đợt 177 đóng 10:55Z, đợt 178 mở 11:35:51Z).
- **CỬA SỔ THOÁNG #93: KHÔNG QUAN SÁT ĐƯỢC (3 điểm kiểm).** Btime 13:07:35Z (uptime-based, chờ T0-179 xác minh). Probe boot+81s (13:08:56Z) 0, 0 — đúng giữa dải mở mẫu (53–87s) mà vẫn 0; boot+216s (13:11:11Z) 2, 2; boot+335s (13:13:10Z) 0, 0. Không lần mở lớn nào (chuẩn đợt 176: cửa sổ = ~30.001). Số 2 lúc boot+216s cùng họ "2" ở lan-2/lan-3 trên #92 — hiện tượng nhỏ lẻ, không đủ cho 1 vite (~1.578 watch), KHÔNG tính là cửa sổ (cùng chuẩn T9-177).
- **Headroom cuối phiên: 0.** Số watch giữ ngoài cell lúc đóng: 63.747 − 0 = **63.747**. Tỉ lệ so với nhu cầu vite (~1.578): **0** — một vite mới không khởi động được (như mọi đợt từ 152). Đợt này: mở 0 → lan-2 2 → lan-3 2 → #93: 0 → 2 → 0 → 0 → đóng 0 (18 lần đo: 12×0, 6×2; cả hai boot trong đợt đều đọc 2 ở giữa phiên). **Trần KHÔNG ĐỔI trong boot** (63.747 trên #92 và #93).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt: **… → 0 → 2 → 0 → 2 → 2 → 0 → 2 → 0 → 2 → 2 → 0 → 0 → 0**. Gần nhất: 175 đóng 2; 176 đóng 0; 177 đóng 0; **178 đóng 0 (lan-2/lan-3/bt+216s đọc 2)**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 0.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 38 liên tiếp.** Quyết parent đợt 177 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới: journal đợt này có 86 dòng lỗi ENOSPC đếm trực tiếp (xem §4)** — đợt thứ 27 liên tiếp. T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 137 mẫu, 11:38:25–13:54:55Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot #93: 85 s** (13:07:29Z → 13:08:54Z); **max gap trong boot 61 s; 0 gap >90 s trong boot**. **137 mẫu (#92: 90; #93: 47).**

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 11:38:25–11:39:25Z | #92 | 2.309.120–3.800.208 kB | Mở sampler: balloon RƠI NHANH 6,07M → 3,06M (sag sau boot #92); load1 4,75–5,12 |
| 11:41:25Z | #92 | **4.174.452 kB (max phiên)** | Balloon đáy 2.639.956 kB; load1 10,26 — đỉnh đơn lẻ giữa bão tải mở đợt |
| 11:50:34–12:01:48Z | #92 | 415.340–1.107.892 kB | Bão tải đợt 2 (apt/dpkg + O8 T0); balloon leo lại tới trần |
| 12:10:27–12:44:28Z | #92 | 415.340–540.848 kB | **E-200 35 mẫu ghim**; gate A ĐÓNG cả 35 mẫu; 0 spike B2 trong span ghim |
| 12:45:28–12:49:28Z | #92 | 473.216–540.848 kB | Sag nông 5 mẫu (đáy 93,9% trần) tách E-200/E-201 |
| 12:50:28–13:07:29Z | #92 | 446.412–500.036 kB | **E-201 18 mẫu ghim**; gate A ĐÓNG cả 18; mẫu cuối 13:07:29Z vẫn CEIL |
| 13:08:54–13:12:54Z | #93 | 1.212.412–1.888.116 kB | Boot #93 mới; balloon 5,08–5,43M dao động; load1 1,55–3,62 |
| 13:12:16–13:16:08Z | #93 | 1.228.388–1.519.228 kB | **T4 attempt1 #47 HỢP LỆ**; gate A 4/4; 0 spike B2 (xem §2.3) |
| 13:28:34–13:30:18Z | #93 | 926.216–1.477.136 kB | 4 spike B2 (WebKit/Chromium — chờ T8-178 xác nhận cửa sổ) |
| 13:35:54–13:54:55Z | #93 | 329.368–520.948 kB | Balloon leo 5,9–6,16M (91–95,5% trần), CHƯA ghim; **RAM min phiên 329.368 kB lúc 13:53:55Z**; 5 spike B2 lúc đóng (13:52:54–13:55:15Z) |

- **Gate A ≥1024 MiB: 42/137 mẫu** (22/90 trên #92 + 20/47 trên #93); **0 mẫu ≥ guard**; load1 max (sampler) **10,26** (11:41:25Z — watcher bắt 10,20 lúc 11:41:21Z, khớp cadence); **RAM <512.000 kB: 65 mẫu** (47,4% — 50 trên #92 + 15 trên #93, tất cả trong lúc ghim/sát trần, 7 dải — xem dưới); **RAM <300.000 kB: 0 mẫu**.
- Swap: SwapFree 830.272 kB (mẫu đầu #92) → 707.400 kB (mẫu cuối #92) → **975.504 kB (mẫu đầu #93 — NHẢY +268.104 kB qua reboot #93)** → 587.632 kB (mẫu cuối, 13:54:55Z). Nhịp nhảy SwapFree qua reboot: #93 nhả ~268.104 kB (đợt 177: #91 nhả ~376.948 kB; đợt 176: #90 nhả ~424.904 kB).
- Trũng RAM đợt này: min 329.368 kB (đợt 177: 454.712 kB) — **trũng SÂU hơn đợt 177 đúng 125.344 kB**; lúc balloon #93 leo sát trần (94,7%), load1 3,14, trong cụm 5 spike lúc đóng. 65 mẫu <512.000 kB trong 137 mẫu (47,4%; đợt 177 chỉ 13/134 = 9,7%).

**Bảng tổng hợp số RAM (từ script `t9-178-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 137 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #92 985bc2a3 | 90 | 415.340 | 4.174.452 | 944.692,1 | 22/90 | 53 | 10,26 | 50 |
| #93 97054ac6 | 47 | 329.368 | 2.335.516 | 1.010.639,0 | 20/47 | 0 | 5,18 | 15 |
| **Toàn phiên** | **137** | **329.368** | **4.174.452** | **967.316,2** | **42/137** | **53/137 (38,7%)** | **10,26** | **65** |

- **Mean toàn phiên 967.316,2 kB — 3 cách độc lập: python `sum/n = 967.316,2` VÀ awk `sum/n = 967.316` VÀ trung bình có trọng số ((90×944.692,1 + 47×1.010.639,0)/137 = 967.316,23) — KHỚP CẢ BA.**
- 65 mẫu RAM <512.000 kB, 7 dải (từ script analyze trên log đóng băng): #92: 12:10:27–12:35:28Z (26); 12:38:28–12:39:28Z (2); 12:41:28–12:44:28Z (4); 12:50:28–13:07:29Z (18). #93: 13:35:54–13:37:54Z (3); 13:39:54–13:43:54Z (5); 13:48:55–13:54:55Z (7). Tổng 26+2+4+18+3+5+7 = 65 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-199 KẾT THÚC BỞI REBOOT #92 + E-200 (35) / E-201 (18) MỚI TRÊN #92

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #92** (max bal trong log = đúng CEIL); #93 max 6.156.960 kB (95,5% trần, chưa chạm).
- **E-199 — KẾT CỤC: KẾT THÚC BỞI REBOOT #92 (2 mẫu, cận dưới).** E-199 ghim 10:53:32–10:54:32Z đợt 177 (2 mẫu, ĐANG GHIM lúc T9-177 đóng); khoảng mù giữa hai đợt 10:54:32Z→11:01:27Z (6m55s, không mẫu nào, chứa reboot #92). Balloon không sống qua reboot nên #92 là điểm kết thúc chắc chắn (tiền lệ E-190 đợt 176: "kết thúc theo reboot trong khoảng mù"); sag trước reboot không quan sát được, không loại trừ.
- **Boot #92: GHIM 53/90 mẫu (58,9%), 2 EPISODE MỚI (E-200 + E-201).** Từ 12:10:27Z (mẫu 33) balloon chạm trần và ghim. **E-200 — 12:10:27–12:44:28Z, 35 mẫu** (RAM 415.340–540.848 kB), **KẾT THÚC bởi sag nông 5 mẫu 12:45:28–12:49:28Z** (đáy 6.050.608 kB, 93,9% trần). **E-201 — 12:50:28–13:07:29Z, 18 mẫu** (RAM 446.412–500.036 kB), **KẾT THÚC bởi reboot #93** (mẫu cuối 13:07:29Z vẫn CEIL; reboot 13:07:35Z, 6 s sau). **Tổng #92: 53 mẫu ghim / 2 chuỗi / 1 sag (5 mẫu).**
- **Boot #93: GHIM 0/47 mẫu (0%), 0 EPISODE MỚI.** Balloon dao động 4,86–5,43M đầu phiên rồi leo đơn điệu 5,9–6,16M cuối phiên (91–95,5% trần), chưa chạm trần lúc đóng — E-202 chưa có (nếu ghim tiếp, thuộc T9-179).
- **Tổng ghim trần đợt này: 53/137 mẫu (38,7%)** (đợt 177: 43/134 = 32,1%; đợt 176: 37/123 = 30,1%; đợt 175: 38/133 = 28,6%; đợt 174: 55/137 = 40,1%).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-200/E-201 là 2 EPISODE MỚI (sag tách chuỗi; quy tắc từ đợt 172). **Phương án thay thế (ghi rõ để T10/parent xét):** gộp E-200+E-201 qua sag nông 5 mẫu (93,9–99,4%) → 1 episode 53 mẫu; tổng ghim 53 không đổi; chỉ số episode 2 → 1. Lưu ý: sag tách E-200/E-201 nông (đáy 93,9%) — cùng họ micro-dip tách E-196/E-197 đợt 177 (96,9–99,4%, 3 mẫu), nên phương án gộp lần này MẠNH HƠN phương án gộp E-198/E-199 đợt 177 (sag tách sâu 29 mẫu, đáy 79,5%).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-201 chỉ ~446–500.000 kB trong khi tổng RAM − balloon = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #47 (T4) — CÓ LƯỢT HỢP LỆ, attempt1 20/20 + B 5/5, CHUỖI 40 → 41 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#47 CÓ LƯỢT HỢP LỆ — attempt1-97054ac6 (20/20 pass, lớp B ĐẠT 5/5, tickCost median 45,0 ms ≤60) — CHUỖI LƯỢT YÊN HỢP LỆ 40 → 41.** Ngân sách dùng 1/3 (attempt1 chạy 13:12:16–13:16:08Z trên #93). POSTBOOT_PASS #92 ĐÃ CÓ (T5-178, 11:53:41Z, replay-đầy-đủ); **POSTBOOT_PASS #93 CHƯA CÓ** (T4 §4; T5-178 không resume sau #93 — watcher-178 pid 92180 hạn 14:35:00Z, T5-179 tiếp quản).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** attempt1 (13:12:16–13:16:08Z): gate A MỞ **4/4 mẫu** (RAM 1.228.388–1.519.228 kB); load1 **0,57–1,55**; balloon 4,86–5,26M (75,5–81,7% trần), **0 mẫu ghim**. **0 spike B2 trong cửa sổ attempt** (b2-spikes.log: spike cuối trước cửa sổ 13:10:29Z; xem §2.5). **Tick probe-mo-93c của T9 lúc 13:13:10Z rơi vào cửa sổ attempt — probe NHẸ, T4 phán KHÔNG vi phạm F-175-T4-2 (xem F-178-T9-2).**

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T4 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 11:55:45–11:59:08Z | #92 | 4,58–10,15 (3 mẫu) | 822.604–1.107.892 kB — **gate A 1/3** | **6 spike B2 trong cửa sổ** (WebKit/Chromium O8); O8 PASS 3/3; 0 mẫu ghim |
| T4 attempt1 13:12:16–13:16:08Z | #93 | 0,57–1,55 (4 mẫu) | 1.228.388–1.519.228 kB — **gate A 4/4** | **LƯỢT HỢP LỆ #47 — 0 spike B2**; 0 mẫu ghim |

- T1-178 KHÔNG chạy lại suite 28 mục (verify-only — LIMITS T1 ghi rõ) → không có cửa sổ T1 để đối chiếu đợt này (như đợt 177). T8-178 CHƯA đóng lúc T9 đóng → không có cửa sổ T8 để đối chiếu (thuộc T9-179 nếu T8 đóng muộn).

### 2.5 B2 — 44 spike THẬT, tất cả có driver đứng đầu; 6 spike delta đỉnh ≤24 tick (đợt 177 chỉ 2 spike)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **44 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 44): 33 trên #92 (11:38:25–12:01:48Z) + 11 trên #93 (13:09:54–13:55:15Z); 0 spike trong span ghim E-200/E-201 (53 mẫu ghim, 0 spike — như đợt 177); 0 spike trong cửa sổ attempt T4; 6 spike trong cửa sổ O8 T0.**

| Cụm | Thời gian (UTC) | n | load1 max | Driver đứng đầu |
|---|---|---|---|---|
| A. Mở đợt #92 | 11:38:25–11:45:29Z | 13 | 10,20 | grep/find chẩn đoán các luồng (T9 grep đệ quy delta 45; grep -rl 8c0ec92d delta 66) + hatch daemon (delta tới 63) |
| B. Replay/apt + O8 T0 | 11:50:34–12:01:48Z | 20 | 9,80 | apt-get (delta 85) + dpkg (69) + WebKit/Chromium O8 (delta tới 65) + hatch |
| C. Mở #93 | 13:09:54–13:10:29Z | 2 | 3,62 | apt-get (71) + python3 blind9696-investigate.py của T2 (16) |
| D. #93 13:28–13:30Z | 13:28:34–13:30:18Z | 4 | 4,40 | WebKit (39) + Chromium (32) + hatch — chờ T8-178 xác nhận cửa sổ |
| E. Lúc đóng #93 | 13:52:54–13:55:15Z | 5 | 4,23 | hatch (delta 6–24) + vết WebKit — tải phân tán, delta nhỏ (xem F-178-T9-6) |

- **Tổng kết: 44/44 spike có process đứng đầu delta tick; delta đỉnh lớn nhất đợt: 85 tick/s** (apt-get, spike 11:50:34Z; đợt 177: max 69; đợt 176: 132). 6 spike có delta đỉnh chỉ 6–24 tick (13:29:43Z + 5 spike cụm E, D-state 0, nr_running 1–3 — spike đang tắt dần lúc snapshot, tải phân tán; giao T10 phán "quy được" hay "dư", xem F-178-T9-6).
- **Khoảng mù watcher đầu phiên: 0** (watcher khởi động 11:38:25Z CÙNG lúc sampler; 3 spike đầu bắt ngay). **Khoảng mù qua reboot #93: 85 s** (watcher chết ~13:07:35Z, chạy lại 13:08:54Z — cùng gap sampler; 2 spike đầu trên #93 bắt lúc 13:09:54Z, ~2 phút sau khi watcher chạy lại). **0 gap phủ sóng watcher nào khác.** `grep -c 'WebKit\|MiniBrowser'` trong log B2 đợt này = **nhiều dòng** (WebKit/Chromium O8 của T0 + vết WebKit cụm D/E — khác đợt 177: 0 dòng).

## 3. Birefnet guard (cơ chế (a) — 0 lần thử, lần thứ 32)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round178-t9/sampler.sh` chạy 11:38:25Z–13:55:xxZ (2 instance: instance 1 sống 11:38:25–13:07:29Z trên #92 rồi **CHẾT theo reboot #93**; instance 2 khởi động lại 13:08:54Z trên #93, sống tới khi T9 dừng tay ~13:56Z — **1 gap qua reboot (85 s), 0 gap >90 s khác; max gap trong boot 61 s**), **137 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **4.174.452 kB = 66,35% guard** (đợt 177: 41,78%; đợt 176: 48,52%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **2.117.004 kB (33,65%)**. **Caveat (F-178-T9-4): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 178 — lần thứ 32 liên tiếp** (đợt 147–178: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 32 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round178-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `.venv/bin/python` (symlink), `bgremove.py` 23.500 B, `birefnet-general.onnx` 972.666.916 B, `u2net.onnx` 175.997.641 B, clip test 14.554 B (không đổi so với đợt 177); `~/workspace/tmp-t9-178-birefnet/` **trống**; T9 sẵn sàng kích hoạt khi guard mở.

## 4. ENOSPC trong journal (đếm trực tiếp 86 dòng — đợt thứ 27 liên tiếp)

- **#92:** đếm trực tiếp **50 dòng** (lúc 12:38:32Z; dòng đầu 11:37:23Z = boot+35m56s — MUỘN hơn hẳn #91 đợt 177 (boot+~120s) và #90 đợt 176 (boot+121s); dòng cuối đếm được 12:37:43Z). Phần 12:38:32Z → reboot 13:07:35Z (~29 phút) **KHÔNG đếm được** (journal #92 mất sau reboot #93 — `--list-boots` lúc đóng chỉ còn idx 0 #93); ngoại suy theo nhịp 0,77 dòng/phút (lan-2 → lan-3: 23 dòng/30 phút) ≈ **+22 dòng → #92 ≈ 72 dòng** (dùng nhịp toàn đợt 0,82 thì ≈74).
- **#93:** **36 dòng** (đếm trực tiếp lúc đóng — toàn bộ từ lúc mở boot tới lúc đóng). Dòng đầu **13:09:29Z (boot+114s)** — khớp mẫu #91 (boot+~120s) và #90 (boot+121s). Dòng cuối 13:55:45Z. Nhịp ≈ 36 dòng/46 phút ≈ **0,78 dòng/phút** (khớp #92: 0,77–0,82).
- **Tổng đợt 178 đếm trực tiếp: 86 dòng** (50 #92 + 36 #93) — cận dưới; ngoại suy ≈ **108–109 dòng** (86 + ~22–23 phần #92 không đếm được). Cao hơn đợt 177 đếm trực tiếp (72 dòng) vì đợt này có 2 boot đóng góp. Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut).
- **Caveat đếm:** `journalctl --since` / `--list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #92 từ cell (cùng mẫu F-171-T10-4, F-176-T9-5, F-177-T9-5). Số #92 (50) lấy từ log headroom các lane (lan-2: 27, lan-3: 50) + đếm trực tiếp lúc 12:38:32Z — đều ghi trong log đóng băng.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #93 giữa phiên (T9 bắt trực tiếp, khởi động lại 85 s gap mẫu) + #92 trước khi đợt mở

- **#93 (97054ac6, btime 13:07:35Z uptime-based; số hiệu + btime chờ T0-179 xác minh 9 nguồn).** Btime từ uptime: 13:07:35Z (`uptime -s`; `who -b` 13:07; journal first entry 13:07:46Z = btime+11s — mẫu khớp #91 +16s, #92 +17s). Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #92 13:07:29Z vẫn CEIL — E-201 đang ghim). T9 khởi động lại cả ba lúc 13:08:54Z (sampler pid 2321, watcher 2322, probe-loop-93 2323) — **gap 85 s**; probe-loop-93 viết mới chỉ 1 lane (lan-5 ~13:38:54Z); cặp đóng làm tay 13:55:44Z. **Probe headroom TRƯỚC, chẩn đoán sau** (bài học F-177-T9-1 đã áp dụng: probe mở-93 lúc boot+81s, rồi mới đọc journal/uptime). Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 2 — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#92 (985bc2a3, btime 11:01:27Z):** TRƯỚC khi đợt mở 34 phút; **T0-178 XÁC MINH 9/9 nguồn** (epoch 1795431687; uptime bracket ×3 khớp cùng giây; stat mtime btime+17,266s; journal first btime+17,958s; wtmp begins 11:01:44Z). Gap #91→#92 chưa có trong LIMITS T0-178 (T0 ghi requeue eid 10396 = btime92 +459,816 s; (m) #92 thuộc T2-178). **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: 43m53s** (mẫu cuối đợt 177 10:54:32Z → mẫu đầu đợt 178 11:38:25Z) — chứa reboot #92 + kết cục E-199 (xem §2.2). Marker: T0-178 đếm **44 reboot #49–#92**; **#93 chưa xác nhận** (thuộc T0-179) → sống qua 45 reboot nếu #93 được xác nhận.

### 5.2 T5-178 — POSTBOOT_PASS #92 CÓ; POSTBOOT_PASS #93 CHƯA CÓ

- **POSTBOOT_PASS #92 CÓ lúc 11:53:41Z** (T5-178, mode replay-đầy-đủ, poll=0, dpkg 1545 dòng / 221 installs — theo LIMITS T0/T4-178). T0 O8 bắt đầu 124 s sau cờ (11:55:45Z); T4 poller instance 2 chờ gate0 trên #92 từ 11:39:24Z tới 13:07:43Z (118 poll, gate0 không đạt tới khi cờ có — xem LIMITS T4).
- **POSTBOOT_PASS #93 CHƯA CÓ — T5-178 KHÔNG resume sau #93** (watcher-178 pid 92180 hạn 14:35:00Z, T5-179 tiếp quản; LIMITS T5-178 không ghi cờ #93). T4 attempt1 #47 chạy trên #93 theo fallback check-only của T4 (5 poll, 1 cửa mở — xem LIMITS T4 §4) — **CẦN PARENT/T10 XÁC NHẬN LẠI; T9 không phán thay.** Hướng (3) VẪN ĐỨNG — cờ #93 thiếu làm gate (a) cho đợt 178 không đầy đủ; parent/T10 quyết.

### 5.3 Các luồng khác — T7/T8 CHƯA đóng; (m)/INSIDE/mù thuộc T2-178

- T7-178 + T8-178 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~14:00Z) — kết cục run 177 (T7-178: run 177 SUCCEEDED theo T0-178 đọc DB tươi, finished 11:09:57Z, 2 lần viết lại #91+#92, claimed→finished 7 s) + DR 12:00Z + HB 11:20:50Z thuộc T7-178/T10; O8/harness T8 trên #93 (4 spike B2 cụm D 13:28–13:30Z có vết WebKit/Chromium — chờ T8 xác nhận) thuộc T8-178/T10. T9 đóng đúng hạn cờ, không chờ T7/T8 (cùng mẫu đợt 177, theo quyết (l) đợt 152).
- T0-178: #92 XÁC MINH 9/9 nguồn; O8 PASS 3/3 trên #92 (WebKit 21/21 ×2 + Chromium 21/21, 11:55:45–11:59:08Z); run 178 jitter 0 s. T1-178: verify 177 (không chạy lại suite 28 mục); tái kiểm khớp lần 76? — thuộc LIMITS T1. T2-178: (m) #92 + INSIDE #92 + mù #96?/#95?/#94?/#88?/#77? + (m) #56 lần 21 — thuộc LIMITS T2, T9 không phán thay. T6-178: (A) + prune lần 53 + #93 có giết holder không — thuộc LIMITS T6.

## 6. Sai số / caveat (F-178-T9-*)

- **F-178-T9-1 — LỆNH GREP ĐỆ QUY CỦA CHÍNH T9 GÂY SPIKE 1 (load1 4,75, delta 45 tick) + BÀI HỌC.** Lúc mở đợt, T9 chạy `grep -rn F-177-T4-4` đệ quy toàn bộ `docs/` + `hidden_files/` để tìm F-177-T4-4 — lệnh nặng, chạy ~66 s, lọt top-1 snapshot spike 11:38:25Z (delta 45) và góp phần vào bão tải cụm A (13 spike). T9 kill lệnh sau ~66 s, chuyển sang grep đích danh file. Bài học: KHÔNG grep đệ quy toàn cây sau khi đợt mở; chỉ grep file đích danh. Spike này KHÔNG nằm trong cửa sổ attempt của T4 (T4-178 chưa chạy attempt lúc đó) nên không ảnh hưởng verdict lượt yên.
- **F-178-T9-2 — TICK probe-mo-93c CỦA T9 LÚC 13:13:10Z TRONG CỬA SỔ ATTEMPT1 T4 + TIMESTAMP SAI TRONG GHI CHÚ (ĐÃ SỬA).** (a) Tick kiểm cửa sổ #93 (boot+335s, đọc 0, 0) rơi vào cửa sổ attempt1 #47 (13:12:16–13:16:08Z): probe NHẸ (k8-headroom.py trả ngay, không thêm watch, không tạo file tạm) — T4 phán KHÔNG vi phạm F-175-T4-2; T9 ghi nhận đề nghị dời tick tránh cửa sổ attempt khi có thể. (b) Ghi chú T9 viết "2 spike mới lúc 13:13Z" là SAI GIỜ — đúng là **13:09:54Z (load1 3,10) + 13:10:29Z (load1 3,62)**, cả hai TRƯỚC cửa sổ attempt; không có spike nào lúc 13:13Z. Đã đính chính trong ghi chú + ghi đúng ở LIMITS này (§2.5 cụm C). Không ảnh hưởng verdict attempt (0 spike trong cửa sổ theo cả 3 nguồn).
- **F-178-T9-3 — E-199 KẾT THÚC BỞI REBOOT #92 (TRONG KHOẢNG MÙ) + E-200/E-201 PHÁN 2 EPISODE MỚI — giao T10 xác nhận (CÓ PHƯƠNG ÁN THAY THẾ).** E-199: 2 mẫu đợt 177 — kết thúc trong khoảng mù 10:54:32Z→11:01:27Z; reboot #92 là điểm kết thúc chắc chắn (balloon không sống qua reboot), sag trước reboot không quan sát được (tiền lệ E-190 đợt 176). E-200: 12:10:27–12:44:28Z, 35 mẫu — KẾT THÚC bởi sag nông 5 mẫu (đáy 93,9%). E-201: 12:50:28–13:07:29Z, 18 mẫu — KẾT THÚC bởi reboot #93 (mẫu cuối vẫn CEIL, reboot 6 s sau). Phương án thay thế: gộp E-200+E-201 qua sag nông → 53 mẫu; tổng ghim 53 không đổi; chỉ số episode 2 → 1. Lần này sag tách NÔNG (93,9%) nên phương án gộp mạnh hơn đợt 177.
- **F-178-T9-4 — RAM ĐỈNH 66,35% GUARD — 0 MẪU ĐẠT GUARD, CAO HƠN ĐỈNH ĐỢT 177 (41,78%).** Mẫu 11:41:25Z: RAM 4.174.452 kB, cách guard 2.117.004 kB (33,65%); balloon 2.639.956 kB (41,0% trần — đáy sag sau boot #92). Caveat: sampler cadence 60 s — vượt guard dưới 60 s giữa hai mẫu KHÔNG loại trừ được (điểm yếu (a) đợt 147). T9 claim đúng: **0 MẪU đạt guard → cơ chế (a) KHÔNG kích hoạt**. Trũng 329.368 kB lúc 13:53:55Z SÂU hơn đợt 177 (454.712 kB) đúng 125.344 kB — lúc balloon #93 leo sát trần (94,7%), load1 3,14, trong cụm 5 spike lúc đóng.
- **F-178-T9-5 — TƯƠNG QUAN ENOSPC–HEADROOM ĐỢT 177 BỊ PHÁ VỠ (2 LẦN).** Đợt 177 (F-177-T9-5): ENOSPC im lặng lúc headroom đọc 2. Đợt này: lan-2 đọc 2, 2 lúc 12:08:25Z trong khi ENOSPC-count=27 (dòng cuối 12:06:53Z, ~90 s trước lan-2); lan-3 đọc 2, 2 lúc 12:38:25Z trong khi ENOSPC-count=50 (dòng cuối 12:37:43Z). **Headroom = 2 KHÔNG đồng nghĩa ENOSPC dừng.** T9 chỉ ghi tương quan vỡ (headroom là số đo từ góc cell, ENOSPC là lỗi của systemd ngoài cell) — không phán cơ chế. Hệ quả: số 2 không còn là chỉ báo "ENOSPC sắp dừng" như gợi ý đợt 177.
- **F-178-T9-6 — 44 SPIKE — BÃO TẢI NẶNG NHẤT KỂ TỪ ĐỢT 173 (đợt 177 chỉ 2 spike).** Cụm A (13 spike, mở đợt): grep/find chẩn đoán + hatch. Cụm B (20 spike): apt/dpkg replay T5 + WebKit/Chromium O8 T0 (6 spike trong cửa sổ O8, driver đúng là trình duyệt đo). Cụm C (2): apt + script mù T2. Cụm D (4, 13:28–13:30Z): vết WebKit/Chromium — chờ T8-178 xác nhận cửa sổ (T8 chưa đóng). Cụm E (5, lúc đóng): hatch delta 6–24, D-state 0, nr_running 1–3 — spike đang tắt dần lúc snapshot (load1 trung bình 1 phút còn ≥3,0 trong khi process chạy tức thời đã tụt). 0 spike trong span ghim E-200/E-201 và trong cửa sổ attempt T4. Delta đỉnh max 85 (apt-get) — cao nhất kể từ đợt 173 (đợt 177: 69; đợt 176: 132).
- **F-178-T9-7 — RUNTIME RESTART GIỮA PHIÊN (~13:07Z) KHIẾN 4 LỆNH SLEEP CHỜ LAN-4 MẤT KẾT QUẢ XÁC NHẬN.** 4 session sleep (chờ lan-4) báo "no confirmed final result after a runtime restart" — tất cả chỉ là bộ đếm giờ chờ, KHÔNG mất số liệu (sampler/watcher/probe-loop chạy độc lập bằng nohup; log đóng băng đầy đủ). T9 kiểm lại trực tiếp sau restart và bắt được reboot #93 trong cùng lượt kiểm.
- **F-178-T9-8 — T7/T8 CHƯA đóng cờ lúc T9 đóng (~14:00Z) + T9 ĐÓNG ĐÚNG HẠN CỜ.** T9 không chờ T7/T8 (kết cục run 177 + DR/HB thuộc T7-178/T10; O8/harness T8 thuộc T8-178/T10; cùng mẫu đợt 177, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 177: hai bản md5 khớp).
- **F-177-T4-4 — ĐÃ HẾT (bổ sung trong đợt này).** (a) `round177-t9/b2-spikes.log` HIỆN CÓ (8.274 B, md5 `dec286e49814a98a391ebeac0ca508a7`, khớp bản đóng băng): đúng 2 spike (09:09:28Z + 10:26:36Z), cả hai SAU cửa sổ attempt1 T4-177 (08:56:40–09:00:35Z) → **0 spike trong cửa sổ attempt1 — khẳng định độc lập từ log B2** (sampler đóng băng trong cửa sổ: 4 mẫu, load1 max 1,16). Verdict T4-177 được khẳng định, chỉ đến muộn. (b) `round178-t9/b2-spikes.log` ĐÃ TỒN TẠI từ 11:38:25Z (spike đầu ghi ngay lúc watcher khởi động) — T4-178 đối chiếu được live (T4-178 §3 xác nhận F-177-T4-4 ĐÃ HẾT). Ghi trong `round178-t9/f-177-t4-4-supplement.md`.

- **Caveat đứng:** probe cap 30.000; sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #92 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 178; T1-178 không chạy lại suite nên không có cửa sổ T1 để đối chiếu; T8-178 chưa đóng nên không có cửa sổ T8 để đối chiếu.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (137 mẫu, 11:38:25–13:54:55Z): `round178-t9/ram-sampler-FROZEN.log` — md5 `2af8f2cdeda4ea4e34b6545614fcb425`. Log B2 đóng băng (44 spike): `round178-t9/b2-spikes-FROZEN.log` — md5 `2648758cf29762d7032b51c21c312bc9`. Log headroom đóng băng (8 cặp = 16 lần đo + cặp đóng tay 2 lần): `round178-t9/headroom-log-FROZEN.txt` — md5 `ed7955d0d9168e42b213e1e7bafc5f0d`. Phân tích bằng script: `round178-t9/t9-178-analyze.py` (output: `round178-t9/t9-178-analyze-output.txt`). T10 đọc log đóng băng trực tiếp khi cần kiểm lại từng mẫu.
