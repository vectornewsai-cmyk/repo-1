# LIMITS — Phase 9 đợt 181, T9: headroom + RAM + birefnet (0 thử lần 35; reboot #99 mới; E-209/E-210/E-211/E-212 mới + E-213 đang ghim; cửa sổ thoáng #99 quan sát được nhưng 0; ENOSPC đợt 30; 100 spike B2)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (7 lần đo, TẤT CẢ 0; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 41 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG #98: KHÔNG QUAN SÁT ĐƯỢC** (đợt mở sau khi cửa sổ đóng). **CỬA SỔ THOÁNG #99: QUAN SÁT ĐƯỢC 2 probe trong cửa sổ (boot+102s, boot+184s) — CẢ HAI 0, KHÔNG lần mở** (hoặc không mở, hoặc đã đóng trước +102s — không phân biệt được).
- **Balloon — 4 EPISODE MỚI + 1 ĐANG GHIM: E-209 (9) / E-210 (5) trên #98; E-211 (7) / E-212 (8) trên #99; E-213 (5) ĐANG GHIM lúc đóng — kết cục thuộc T9-182.** Tổng ghim **34/123 (27,6%)** — cao hơn đợt 180 (19/116 = 16,4%). KHÔNG gộp episode nào (quyết (h) đợt 179: TÁCH theo quy tắc cơ học). **1 điểm CEIL đọc tay 23:54:13Z CHƯA ĐỦ chuỗi để phán episode — giao T10/parent quyết** (xem §2.2).
- **RAM: 123 mẫu, 23:54:51Z–01:57:51Z, HAI boot (#98: 78; #99: 45).** Max **2.679.792 kB (42,6% guard)** lúc 00:32:52Z; min **363.464 kB** lúc 01:06:53Z (#98, trong E-210 — KHÔNG phá kỷ lục trũng sâu 225.224 kB đợt 180). Gate A **41/123**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 35 liên tiếp**.
- **B2: 100 spike THẬT, 2 cụm — tất cả có driver đứng đầu; 0 spike trong cửa sổ attempt T4; 0 spike trong span ghim (34 mẫu ghim).**
- **Lượt yên #50 (T4): CÓ LƯỢT HỢP LỆ — attempt1 20/20 + B 5/5, median 50,0 ms — CHUỖI 43 → 44.** Sampler T9: gate A 3/4 trong cửa sổ attempt+analyzer; 0 spike B2.
- **REBOOT #99 MỚI GIỮA PHIÊN** (boot `9897d4b4`, btime 01:11:46Z, gap #98→#99 = 7.163 s — số hiệu + btime chờ T0-182 xác minh 9 nguồn); giết sampler/watcher/probe-loop T9; T9 khởi động lại, gap mẫu 117 s. **#98 XÁC NHẬN 9 nguồn (T0-181)** — nợ đợt 180 đã trả.
- **ENOSPC: đếm trực tiếp 117 dòng (90 #98 + 27 #99) — đợt thứ 30 liên tiếp.**
- **T7 CHƯA đóng lúc T9 đóng (~01:59Z)** — như T7-180. Không push, không sửa production, không chạy TTS 39, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 180 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả hai boot.

### 1.2 Số đo đợt 181 (7 lần đo, 2 boot — TẤT CẢ 0)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 23:55:56Z | **0** | #98 e62eef3f | 63.747 | cặp mở (boot+43m33s) |
| 00:25:56Z | **0** | #98 | 63.747 | lan-2 (boot+1h13m33s); sau attempt1 T4 |
| 00:55:56Z | **0** | #98 | 63.747 | lan-3 (boot+1h43m33s); sau harness T8 |
| 01:13:28Z | **0** | #99 9897d4b4 | 63.747 | **TRONG cửa sổ thoáng (boot+102s)** |
| 01:14:50Z | **0** | #99 | 63.747 | **TRONG cửa sổ thoáng (boot+184s)** |
| 01:44:20Z | **0** | #99 | 63.747 | lan-4 (boot+32m34s); E-212 ĐANG GHIM |
| 01:57:54Z | **0** | #99 | 63.747 | cặp đóng (tay); E-213 ĐANG GHIM |

- **CỬA SỔ THOÁNG #99: QUAN SÁT ĐƯỢC NHƯNG 0.** Btime 01:11:46Z (uptime-based, chờ T0-182 xác minh 9 nguồn); dải mẫu boot+53–245s ≈ 01:12:39–01:15:51Z. T9 khởi động lại daemon sau reboot và probe lúc boot+102s (01:13:28Z) = **0** và boot+184s (01:14:50Z) = **0** — không lần mở nào quan sát được. Không phân biệt được "không mở" với "mở rồi đóng trước +102s" (cửa sổ #96 đóng trong ~15 s — nếu #99 cũng đóng nhanh như vậy thì probe +102s đã muộn). Chuỗi "quan sát được lần mở" vẫn đứt từ #96 (chỉ #96 mở 2.903; #97/#98 không quan sát được; #99 quan sát được nhưng 0).
- **CỬA SỔ THOÁNG #98: KHÔNG QUAN SÁT ĐƯỢC trong đợt 181** (T9-181 mở phiên 23:54Z = boot+42m, sau khi cửa sổ đóng; dải mẫu boot+53–245s ≈ 23:13:16–23:16:28Z đã qua). Không luồng nào khác probe headroom trong cửa sổ #98 (T9-180 đã đóng 22:53Z; T7/T8 không probe headroom).
- **Headroom cuối phiên: 0.** Số watch giữ ngoài cell lúc đóng: **63.747**. Tỉ lệ so với nhu cầu vite (~1.578): **0** — một vite mới không khởi động được (như mọi đợt từ 152). **Trần KHÔNG ĐỔI trong boot** (63.747 trên #98 và #99).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt: **… → 0 → 2 → 0 → 2 → 2 → 0 → 2 → 0 → 2 → 2 → 0 → 0 → 0 → 0 → 0 → 0**. Gần nhất: 178 đóng 0; 179 đóng 0; 180 đóng 0 (1 lần đo giữa phiên 2.903); **181 đóng 0 (toàn 0, 7 lần đo)**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 0.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 41 liên tiếp.** Quyết parent đợt 180 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới: journal đợt này có 117 dòng lỗi ENOSPC đếm trực tiếp (xem §4)** — đợt thứ 30 liên tiếp. T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 123 mẫu, 23:54:51Z–01:57:51Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot #99: 117 s** (mẫu cuối #98 01:11:53Z → mẫu đầu #99 01:13:50Z); **gap giữa hai đợt: ~61 phút không sampler T9** (mẫu cuối T9-180 22:53:08Z → mẫu đầu T9-181 23:54:51Z — chứa reboot #97/#98); **0 gap >90 s khác trong phiên**.

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 23:54:51–00:05:51Z | #98 | 424.580–1.299.744 kB | Mở sampler; 1 điểm CEIL đọc tay 23:54:13Z (xem §2.2); balloon leo lại sau sag |
| 00:06:51–00:16:52Z | #98 | 363.464–505.836 kB | **E-209 9 mẫu ghim**; RAM <512k 11 mẫu; **chuỗi RAM<500 của T4 (14 poll)** |
| 00:17:29–00:20:58Z | #98 | 676.584–1.224.104 kB | **T0 O8 PASS 3/3**; gate A 1/3; 0 spike B2 |
| 00:20:12–00:24:06Z | #98 | 1.018.328–1.358.804 kB | **T4 attempt1 #50 HỢP LỆ**; gate A 3/4; 0 spike B2 (xem §2.3) |
| 00:25:38–00:26:58Z | #98 | 2.167.336–2.178.848 kB | **T2 walk mù** (sau attempt); gate A 2/2; 0 spike B2 |
| 00:33:45–00:36:16Z | #98 | 2.022.152–2.222.088 kB | **T8 O8 PASS 3/3**; gate A 3/3; 0 spike B2 |
| 00:37:35–00:52:56Z | #98 | 471.188–2.177.196 kB | **T8 harness hb128+B1 3/3 + 3/3 SẠCH**; gate A 5/16; **90 spike B2** (cụm 1) |
| 01:02:53–01:06:53Z | #98 | 363.464–438.396 kB | **E-210 5 mẫu ghim**; gate A 0/5; 0 spike B2; **RAM min phiên 363.464 kB** |
| 01:11:46Z | #99 | — | **REBOOT #99** (btime; gap #98→#99 = 7.163 s) |
| 01:13:50–01:23:50Z | #99 | 623.560–1.777.520 kB | Boot #99 mới; tải khởi động; **5 spike B2** (cụm 2, apt-get) |
| 01:24:50–01:30:50Z | #99 | 443.640–587.996 kB | **E-211 7 mẫu ghim**; gate A 0/7; 0 spike B2 |
| 01:41:51–01:48:51Z | #99 | 493.320–576.220 kB | **E-212 8 mẫu ghim**; gate A 0/8; 0 spike B2 |
| 01:53:51–01:57:51Z | #99 | 512.736–535.048 kB | **E-213 5 mẫu ĐANG GHIM lúc đóng**; gate A 0/5; 0 spike B2 |

- **Gate A ≥1024 MiB: 41/123 mẫu** (29/78 trên #98 + 12/45 trên #99); **0 mẫu ≥ guard**; load1 max (sampler) **4,66** (00:50:52Z — trong harness T8); **RAM <512.000 kB: 21 mẫu** (17,1% — 19 trên #98 + 2 trên #99, 6 dải — xem dưới); **RAM <300.000 kB: 0 mẫu** (đợt 180 có 3 mẫu, min 225.224 kB — đợt này KHÔNG trũng sâu như vậy).
- Swap: SwapFree 646.788 kB (mẫu đầu #98) → 570.520 kB (mẫu cuối #98) → **942.844 kB (mẫu đầu #99 — NHẢY +372.324 kB qua reboot #99)** → 665.644 kB (mẫu cuối, 01:57:51Z). Nhịp nhảy SwapFree qua reboot: #99 nhả ~372.324 kB (đợt 180: #96 nhả ~403.960 kB; #95 nhả ~331.952 kB; #93 nhả ~268.104 kB; #91 nhả ~376.948 kB).
- Trũng RAM đợt này: min **363.464 kB (01:06:53Z, #98, trong E-210)** — sâu thứ hai trong các log T9 (kỷ lục 225.224 kB đợt 180; đợt 179: 333.672 kB — đợt này min CAO HƠN đợt 179). Lúc đó balloon CEIL, load1 0,12 — balloon ghim trần nhưng sag ngay sau (01:07:53Z bal 6.050.608 kB), KHÔNG kẹt. 21 mẫu <512.000 kB trong 123 mẫu (17,1%; đợt 180: 25/116 = 21,6%).

**Bảng tổng hợp số RAM (từ script `t9-181-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 123 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #98 e62eef3f | 78 | 363.464 | 2.679.792 | 1.037.569,0 | 29/78 | 14 | 4,66 | 19 |
| #99 9897d4b4 | 45 | 443.640 | 1.777.520 | 809.346,0 | 12/45 | 20 | 3,59 | 2 |
| **Toàn phiên** | **123** | **363.464** | **2.679.792** | **954.072,8** | **41/123** | **34/123 (27,6%)** | **4,66** | **21** |

- **Mean toàn phiên 954.072,8 kB — 3 cách độc lập: python `sum/n = 954.072,8` VÀ awk `sum/n = 954.073` VÀ trung bình có trọng số ((78×1.037.569,0 + 45×809.346,0)/123 = 954.072,8) — KHỚP CẢ BA.**
- 21 mẫu RAM <512.000 kB, 6 dải (từ script python trên log đóng băng): #98: 00:06:51–00:16:52Z (11); 00:50:52Z (1); 01:01:53–01:06:53Z (6); 01:11:53Z (1). #99: 01:30:50Z (1); 01:45:51Z (1). Tổng 11+1+6+1+1+1 = 21 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-209/E-210/E-211/E-212 MỚI + E-213 ĐANG GHIM + 1 điểm CEIL đọc tay chưa đủ chuỗi

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #98 và #99** (max bal trong log = đúng CEIL trên cả hai boot).
- **1 ĐIỂM CEIL ĐỌC TAY 23:54:13Z — CHƯA ĐỦ CHUỖI ĐỂ PHÁN EPISODE (giao T10/parent quyết).** Đọc tay lúc mở phiên: MemAvailable 411.364 kB, Balloon **6.443.824 kB = ĐÚNG TRẦN**, load1 0,29. Mẫu sampler đầu tiên 23:54:51Z (38 s sau) bal đã **5.460.784 kB (84,7%)** — balloon ĐÃ SAG ~983.040 kB trong 38 s; T2-181 probe #99 lúc 23:54:29Z đọc MemAvailable 528.824 kB (giữa hai điểm trên — RAM đang hồi). Chỉ CÓ 1 điểm CEIL quan sát được (đọc tay, không nằm trong log sampler); khoảng mù 61 phút trước đó (22:53:08–23:54:51Z, chứa #97/#98) không cho biết ghim bắt đầu khi nào. **Theo quy tắc cơ học đứng (episode = chuỗi ≥2 mẫu CEIL liên tiếp trong log sampler), 1 điểm đơn lẻ KHÔNG đủ để phán episode** — T9 KHÔNG đánh số nó. **Nếu parent/T10 quyết tính 1 điểm này là episode thì nó là E-209 trên #98, và các số E-209..E-213 dưới đây phải +1 (E-210..E-214).** T9 nêu rõ rủi ro đánh số này để T10 không đếm nhầm.
- **Boot #98: GHIM 14/78 mẫu (17,9%), 2 EPISODE MỚI (E-209 + E-210).** **E-209 — 00:08:51–00:16:52Z, 9 mẫu** (RAM 374.648–496.468 kB; mẫu trước 00:07:51Z bal 6.416.104 kB = 99,58%), **KẾT THÚC bởi sag** (00:17:52Z bal 5.395.248 kB = 83,7%; RAM nhảy lên 823.600 kB). Trùng khít chuỗi RAM<500 của T4 (14 poll #15–#28, 00:06:38–00:16:24Z — dài nhất từ trước tới nay trong log T4) — balloon ghim trần trong lúc replay ngốn RAM. **E-210 — 01:02:53–01:06:53Z, 5 mẫu** (RAM 363.464–438.396 kB; mẫu trước 01:01:53Z bal 6.349.564 kB = 98,5%), **KẾT THÚC bởi sag** (01:07:53Z bal **6.050.608 kB = 93,9% — GIÁ TRỊ SÀN LẶP LẠI lần thứ 5**, xem F-181-T9-4).
- **Boot #99: GHIM 20/45 mẫu (44,4%), 2 EPISODE MỚI (E-211 + E-212) + 1 ĐANG GHIM (E-213).** Balloon leo đơn điệu từ 5,10M (01:13:50Z) tới trần. **E-211 — 01:24:50–01:30:50Z, 7 mẫu** (RAM 443.640–587.996 kB; mẫu trước 01:23:50Z bal 6.375.044 kB = 98,93%), **KẾT THÚC bởi sag** (01:31:50Z bal 5.709.240 kB = 88,6%). **E-212 — 01:41:51–01:48:51Z, 8 mẫu** (RAM 493.320–576.220 kB; mẫu trước 01:40:51Z bal 6.442.216 kB = 99,98%), **KẾT THÚC bởi dip** (01:49:51Z bal **6.050.608 kB = 93,9% — GIÁ TRỊ SÀN LẶP LẠI lần thứ 6**, xem F-181-T9-4). **E-213 — 01:53:51–01:57:51Z, 5 mẫu** (RAM 512.736–535.048 kB; mẫu trước 01:52:51Z bal 6.373.504 kB = 98,91%), **ĐANG GHIM lúc T9 đóng** — kết cục (sag/dip/reboot) thuộc T9-182.
- **Tổng ghim trần đợt này: 34/123 mẫu (27,6%)** (đợt 180: 19/116 = 16,4%; đợt 179: 27/131 = 20,6%; đợt 178: 53/137 = 38,7%). Tỉ lệ ghim trên #99 (44,4%) cao gấp ~2,5 lần trên #98 (17,9%) — balloon leo trần nhanh hơn trên boot mới (E-211 bắt đầu boot+13m04s; E-212 boot+30m05s; E-213 boot+42m05s).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-209/E-210/E-211/E-212 là 4 EPISODE MỚI (sag/dip tách chuỗi; quy tắc từ đợt 172; quyết (h) đợt 179: KHÔNG gộp qua sag dù nông — TÁCH). E-213 đang ghim — chưa phán kết cục. **Không có phương án gộp nào cần xét đợt này** (mỗi episode tách nhau bằng sag/dip rõ rệt, không có micro-dip 1 mẫu gây tranh cãi như E-204/E-205).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-210 chỉ ~363–438.000 kB trong khi tổng RAM − balloon = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #50 (T4) — CÓ LƯỢT HỢP LỆ, attempt1 20/20 + B 5/5, CHUỖI 43 → 44 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#50 CÓ LƯỢT HỢP LỆ — attempt1-e62eef3f (20/20 pass, lớp B ĐẠT 5/5, tickCost median 50,0 ms ≤60) — CHUỖI LƯỢT YÊN HỢP LỆ 43 → 44.** Ngân sách dùng 1/3 (attempt1 chạy 00:20:12–00:23:41Z trên #98; analyzers 00:23:41–00:24:06Z, NGOÀI cửa sổ attempt theo quyết (p)). POSTBOOT_PASS #98 ĐÃ CÓ (T5-181, 00:16:31Z, repair-sớm-quyết-h, poll=1, CÓ caveat repair). 0 reboot trong cửa sổ attempt.
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** cửa sổ attempt+analyzer (00:20:12–00:24:06Z): gate A MỞ **3/4 mẫu** (RAM 1.018.328–1.358.804 kB; mẫu 00:20:52Z 1.018.328 kB ≈ 995 MB — dưới gate A, khớp poll #33 của T4 đọc RAM 1910 MB lúc mở cửa 00:20:12Z — RAM hồi nhanh trong 40 s đầu attempt); load1 **0,54–1,65**; balloon 5,06–5,33M (78,5–82,8% trần), **0 mẫu ghim**. **0 spike B2 trong cửa sổ attempt** (xem §2.5). **0 vi phạm theo T4 — chuỗi 0 vi phạm 2 → 3.**

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T2/T6/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T6 suite+harness 23:56:12–00:05:28Z | #98 | 0,68–2,09 (9 mẫu) | 891.020–1.142.056 kB — **gate A 2/9** | **(A) 120/120 lần 31; suite 9/9 × 6**; 0 spike B2 |
| T0 O8 00:17:24–00:20:11Z | #98 | 1,33–2,38 (3 mẫu) | 676.584–1.224.104 kB — **gate A 1/3** | **O8 PASS 3/3; 0 spike B2** |
| T4 attempt1 00:20:12–00:24:06Z | #98 | 0,54–1,65 (4 mẫu) | 1.018.328–1.358.804 kB — **gate A 3/4** | **LƯỢT HỢP LỆ #50 — 0 spike B2**; 0 mẫu ghim |
| T2 walk mù 00:25:38–00:26:58Z | #98 | 1,03–1,58 (2 mẫu) | 2.167.336–2.178.848 kB — **gate A 2/2** | **Walk sau attempt; 0 spike B2** |
| T8 O8 00:33:45–00:36:16Z | #98 | 1,06–1,96 (3 mẫu) | 2.022.152–2.222.088 kB — **gate A 3/3** | **O8 T8 PASS 3/3; 0 spike B2** |
| T8 harness 00:37:35–00:52:56Z | #98 | 0,59–4,66 (16 mẫu) | 471.188–2.177.196 kB — **gate A 5/16** | **hb128+B1 WebKit 3/3 + Chromium 3/3 SẠCH; 90 spike B2** (cụm 1) |

- T1-181: verify 180 (không chạy lại suite 28 mục) → không có cửa sổ T1 để đối chiếu đợt này (như đợt 177/178/179/180). T7-181 CHƯA đóng lúc T9 đóng → không có cửa sổ T7 để đối chiếu (thuộc T9-182 nếu T7 đóng muộn). T8-181: sampler riêng n=31, balloon max 86,8% trần, 0 ghim, avail min 502 MB — đối chiếu: sampler T9 trong cùng cửa sổ harness max bal 5.519.460 kB = **85,7% trần**, avail min 471.188 kB — cùng bậc, khác giây đo/cadence — **KHÔNG mâu thuẫn trực tiếp** (cùng mẫu F-180-T9-7); giao T10 đối chiếu nếu cần.

### 2.5 B2 — 100 spike THẬT, 2 cụm, tất cả có driver đứng đầu; 0 spike trong cửa sổ attempt T4 và trong span ghim

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **100 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 100): 95 trên #98 (cụm 1) + 5 trên #99 (cụm 2); 0 spike trong cửa sổ attempt T4 (00:20:12–00:24:06Z); 0 spike trong span ghim E-209/E-210/E-211/E-212/E-213 (34 mẫu ghim, 0 spike — như đợt 177/178/179/180).** Watcher đợt này chỉ ghi top-%CPU process theo `ps` (không có số delta tick như LIMITS T9-180 mô tả — T9-181 chỉ báo cáo những gì log chứa: load1 + process đứng đầu %CPU).

| Cụm | Thời gian (UTC) | n | load1 max | Driver đứng đầu |
|---|---|---|---|---|
| 1. Harness T8 #98 | 00:44:36–00:53:18Z | 95 | 4,81 | chrome (70) + hatch (14) + WebKitWebProcess (9) + MainThread (2) — driver đúng là trình duyệt đo; 90 spike trong cửa sổ harness (11 trong WebKit 86n2-hb128 00:41:27–00:45:28Z, 76 trong các pha Chromium 00:45:43–00:52:56Z, 3 trong các pha đầu 00:37:35–00:41:27Z), 5 spike đuôi 00:52:57–00:53:18Z ngay sau harness |
| 2. Đầu boot #99 | 01:13:50–01:14:58Z | 5 | 3,59 | apt-get (5) — tải khởi động sau reboot (replay/repair hệ thống trên #99, không phải trình duyệt đo) |

- **Tổng kết: 100/100 spike có process đứng đầu %CPU; load1 đỉnh đợt: 4,81** (spike trong cụm 1; đợt 180: load1 max sampler 4,68). **0 spike trong cửa sổ attempt T4 và trong span ghim.**
- **Khoảng mù watcher đầu phiên: ~1 phút** (watcher khởi động 23:55Z, sampler 23:54:51Z; spike đầu bắt 00:44:36Z — trước đó load1 sampler max 2,62, không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng <3,0 trong gap). **Khoảng mù qua reboot #99: ~117 s** (watcher chết ~01:12Z, chạy lại 01:13:50Z — cùng gap sampler; spike ĐẦU TIÊN sau reboot bắt ngay 01:13:50Z, load1 3,59 — tải khởi động; không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng trong gap). **0 gap phủ sóng watcher nào khác.** `grep -c 'WebKit\|MiniBrowser'` trong log B2 đợt này = **nhiều dòng** (WebKit/Chromium harness của T8).

## 3. Birefnet guard (cơ chế (a) — 0 lần thử, lần thứ 35)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round181-t9/sampler.sh` chạy 23:54:51Z–01:57:51Z (2 instance: instance 1 sống 23:54:51Z–01:11:53Z trên #98 rồi **CHẾT theo reboot #99**; instance 2 khởi động lại 01:13:50Z trên #99, sống tới khi T9 dừng tay ~01:58Z — **1 gap qua reboot (117 s), 0 gap >90 s khác; max gap trong boot 61 s**), **123 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.679.792 kB = 42,6% guard** (đợt 180: 38,83%; đợt 179: 40,52%; đợt 178: 66,35%; đợt 177: 41,78%; đợt 176: 48,52%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **3.611.664 kB (57,4%)**. **Caveat (F-179-T9-4 đợt 178): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 181 — lần thứ 35 liên tiếp** (đợt 147–181: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 35 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round181-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại, symlink → /usr/bin/python3.12), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 180); không có thư mục `~/workspace/tmp-t9-181-birefnet/` (không thử gì). **Clip test 14.554 B đợt 180 T9 KHÔNG kiểm lại được vị trí đợt này** (tìm theo kích thước trong `server/bgremove/` không thấy file khớp — T9 chỉ ghi nhận, không claim số cũ); T9 sẵn sàng kích hoạt khi guard mở.

## 4. ENOSPC trong journal (đếm trực tiếp 117 dòng — đợt thứ 30 liên tiếp)

- **#98:** đếm trực tiếp **90 dòng** (lúc 00:56:13Z, khi #98 còn là boot hiện tại; dòng đầu 23:14:06Z = boot+103s; dòng cuối đếm được 00:56:13Z). Phần 00:56:13Z → reboot 01:11:46Z (~15,5 phút) **KHÔNG đếm được** (journal #98 mất sau reboot #99 — `--list-boots` lúc đóng chỉ còn idx 0 #99); ngoại suy theo nhịp ~0,88 dòng/phút ≈ **+13–14 dòng → #98 ≈ 103–104 dòng**.
- **#99:** **27 dòng** (đếm trực tiếp lúc đóng — toàn bộ từ lúc mở boot tới lúc đóng; journal bắt đầu 01:12:02Z nên phủ sóng đầy đủ). Dòng đầu **01:13:35Z (boot+109s)** — khớp mẫu #93 (boot+114s), #91 (boot+~120s), #90 (boot+121s), #95 (boot+105s), #98 (boot+103s). Dòng cuối 01:56:45Z. Nhịp ≈ 27 dòng/43,2 phút ≈ **0,63 dòng/phút** (thấp hơn #98 ~0,88 — nhịp tính trên cửa sổ ngắn, chưa ổn định).
- **Tổng đợt 181 đếm trực tiếp: 117 dòng** (90 #98 + 27 #99) — cận dưới; ngoại suy ≈ **130–131 dòng** (117 + ~13–14 phần #98 không đếm được). Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut). **Số 2 headroom KHÔNG còn là chỉ báo "ENOSPC sắp dừng" (F-178-T9-5 đã phá vỡ tương quan; đợt này headroom toàn 0 trong khi ENOSPC vẫn chạy 117 dòng trực tiếp).**
- **Caveat đếm:** `journalctl --since` / `--list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #98 từ cell (cùng mẫu F-171-T10-4, F-176-T9-5, F-177-T9-5, F-178-T9-5, F-179-T9-5, F-180-T9-5). Số #98 (90) lấy từ đếm trực tiếp lúc 00:56:13Z — ghi trong baseline notes + log đóng băng.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #99 mới giữa phiên (T9 bắt trực tiếp, khởi động lại 117 s gap mẫu) + #98 trước khi đợt mở

- **#99 (9897d4b4, btime 01:11:46Z uptime-based; số hiệu + btime chờ T0-182 xác minh 9 nguồn).** Btime từ uptime: 01:11:46Z (`uptime -s`; epoch `/proc/stat` btime 1795482706; journal idx 0 duy nhất, first entry 01:12:02Z = btime +16 s). Gap #98→#99 = **7.163 s (1h59m — TRỞ LẠI mẫu ~2 giờ)**. Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #98 01:11:53Z — xem F-181-T9-3 về lệch giờ). T9 khởi động lại sampler + watcher lúc 01:13:50Z (sampler pid 2838, watcher 2840) — **gap 117 s**; probe headroom TRONG cửa sổ thoáng (boot+102s: 0; boot+184s: 0) rồi mới đọc journal/uptime (bài học F-177-T9-1 đã áp dụng). Probe-loop cũ chết theo #99 (lan-4 lúc 01:25:56Z KHÔNG chạy — T9 probe tay win99/win99b/lan-4/close-181 thay thế, xem F-181-T9-2). Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 5 — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#98 (e62eef3f, btime 23:12:23Z):** TRƯỚC khi đợt mở 23 phút; **T0-181 XÁC MINH 9/9 nguồn** (epoch 1795475543; uptime bracket ×3 khớp cùng giây; boot_est btime +0,77 s; /proc/1 start_ticks btime +11,06 s; stat mtime btime+11,842 s; journal first btime+12 s; wtmp begins 23:12:35Z; CF ×4; DB: run 180/181 boot_gen mới 473f9460). Gap #97→#98 = **576 s (9m36s — NGẮN BẤT THƯỜNG, lần đầu gap <1.000 s trong chuỗi #93–#98)**. **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: ~61 phút không sampler T9** (mẫu cuối đợt 180 22:53:08Z → mẫu đầu đợt 181 23:54:51Z) — chứa reboot #97 (23:02:47Z) + #98 (23:12:23Z) và điểm CEIL đọc tay 23:54:13Z (xem §2.2). Marker: T0-181 đếm **50 reboot #49–#98**; **#99 chưa xác nhận** (thuộc T0-182) → sống qua 51 reboot nếu #99 được xác nhận.

### 5.2 T5-181 — POSTBOOT_PASS #98 CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat repair); POSTBOOT_PASS #97 KHÔNG CÓ; POSTBOOT_PASS #99 CHƯA CÓ

- **POSTBOOT_PASS #98 CÓ lúc 00:16:31Z** (T5-181, mode **repair-sớm-quyết-h, poll=1**, dpkg 804, cache 111, lists 75 — CÙNG profile #96; watcher-181 START 23:59:08Z, EARLY-REPAIR TRIGGER boot_age 2.805 s). T0 O8 bắt đầu 53 s sau cờ (00:17:24Z); T4 poller mở cửa poll #33 (00:20:12Z) sau cờ 221 s. Mode repair-sớm-quyết-h CÓ caveat — gate (a) cho #98 có caveat (tiền lệ #90/#94/#96); parent/T10 quyết.
- **POSTBOOT_PASS #97 KHÔNG CÓ — KHÔNG bù được** (chết ở boot+576 s, trước trigger repair boot+900 s; không watcher nào sống sau 23:03:16Z; dpkg.log/history #97 đã mất theo rootfs rebuild khi sang #98 — cùng quy tắc #93). **Tổng boot không cờ 20 → 21 theo T5-181** (T0-181 ghi GIỮ 20 — **F-181-T8-7: hai số lệch nhau, T9 chỉ ghi nhận, thuộc T10-181/parent**).
- **POSTBOOT_PASS #99 CHƯA CÓ** — T5-182 lo (watcher-181 pid 200203 hạn 02:35:00Z — nhiều khả năng đã chết theo #99; T5-181 đóng 00:24Z, trước #99). Hướng (3) VẪN ĐỨNG lần 28 (T5-181).
- **POSTBOOT_PASS #96 VẪN CÓ** (22:08:08Z, repair, poll=1, caveat — parent CHẤP NHẬN (c) đợt 180); **#95 VẪN CÓ** (20:59:47Z, replay-đầy-đủ, poll=0, KHÔNG caveat); **#93 KHÔNG CÓ — ĐÃ XÁC NHẬN, KHÔNG bù được**.

### 5.3 Các luồng khác — T7 CHƯA đóng; (m)/INSIDE/mù thuộc T2-181; harness T8 sạch 6/6

- T7-181 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~01:59Z) — kết cục run 180 (TIMEOUT 23:39:30Z, margin −219 s; claimed→finished 86 s — ca ≥60 s thứ mười NẾU T7-181 đồng ý, theo T2-181) + run 181 (started 23:39:30Z, jitter +219 s, đang running) + DR 01:00Z/02:00Z + HB 00:50:50Z/01:20:50Z thuộc T7-181/T10. T9 đóng đúng hạn cờ, không chờ T7 (cùng mẫu đợt 177/178/179/180, theo quyết (l) đợt 152).
- T0-181: #98 XÁC MINH 9/9 nguồn; O8 PASS 3/3 trên #98 (WebKit 21/21 ×2 + Chromium 21/21, 00:17:24–00:20:11Z); (m) #96/#97/#98 khớp T7 (+41,129 / +39,441 / +37,030 s — phân loại cuối thuộc T2-181 + parent 181); F-180-T9-3 XÁC NHẬN độc lập (delta 18–27 s trước #96) + F-181-T0-2 (delta ≥29 s trước #97). T1-181: verify 180 PASS, khớp lần thứ 82; F-181-T1-1 (aggregate 180 §10.3 "quét 1.335 file" → đúng 1.336 — giao parent quyết). T2-181: **(m) #96/#97/#98 DƯƠNG (CUỐI)**; **INSIDE #96 TRUE (chuỗi 1 → 2) / #97 TRUE (2 → 3) / #98 FALSE (3 → 0)**; mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck lần 25 NEW=0); (m) #56 VẪN CÓ ĐIỀU KIỆN lần 24; EPERM probe #99 ok=2 fail=0, 0 sóng thật. T6-181: **#96/#97/#98 KHÔNG GIẾT HOLDER — chuỗi mới = 3**; (A) 120/120 lần 31; prune lần 56 (xóa 2 file, queue 102→100); F-147-T6-1 chuỗi VẪN 0 (lần thứ ba liên tiếp). T8-181: **harness hb128+B1 sạch 6/6 trên #98** (B1 triển khai live lần đầu, 0 dòng HB mới); O8 T8 PASS 3/3 trên #98 (00:33:45–00:36:16Z); **5 CHÂN FULL PASS CÙNG BOOT #98 — parent/T10 quyết có lên 1 không**; (c')/(f') ĐƯỢC GIỮ; 86n2-P1 PASS lần thứ sáu liên tiếp; kẹt harness cộng dồn GIỮ 25; F-178-T8-6 diag W2-setup DỪNG (không chạy đợt này).

## 6. Sai số / caveat (F-181-T9-*)

- **F-181-T9-1 — B2WATCH + PROBE-LOOP KHÔNG CHẠY LẦN 1 DO `&& ... &` NUỐT CHUỖI (lỗi vận hành, đã khắc phục trong phiên, KHÔNG mất số liệu).** Lệnh khởi động đầu dùng `mkdir && cd && cp ... && nohup ./sampler.sh & echo ...; nohup ./b2watch.sh & ...` — `&` sau chuỗi `&&` nuốt cả AND-list thành một job nền, nên b2watch/probe-loop không chạy (chỉ sampler chạy, pid 167446). T9 khởi động lại b2watch (pid 183829) + probe-loop (pid 184030) bằng `setsid nohup` riêng từng daemon lúc 23:55Z. Gap phủ sóng B2 ~1 phút (23:54:51–23:55Z, trước mọi spike — spike đầu 00:44:36Z); probe mở chạy đúng 23:55:56Z. Bài học: KHÔNG dùng `A && B &` — khởi động daemon bằng `setsid nohup` riêng từng cái.
- **F-181-T9-2 — RUNTIME RESTART GIẾT SLEEP CHỜ LAN-4 + REBOOT #99 GIẾT PROBE-LOOP (tái diễn F-180-T9-2/F-179-T9-1 lần 4).** Sleep chờ lan-4 (bắt đầu ~00:56Z, hạn 01:25Z) bị gián đoạn bởi runtime restart lúc ~01:12Z — chính là reboot #99 giết runtime; probe-loop cũ (pid 184030) chết theo #99 nên lan-4 lúc 01:25:56Z KHÔNG chạy. T9 kiểm lại trực tiếp sau restart, bắt được reboot #99 trong cùng lượt kiểm (boot_id đã đổi lúc 01:12:43Z) và khởi động lại daemon 01:13:50Z (gap mẫu 117 s) + probe tay win99/win99b/lan-4/close-181 thay thế. Tất cả chỉ là bộ đếm giờ chờ + probe-loop, KHÔNG mất số liệu sampler (log đóng băng đầy đủ 123 mẫu).
- **F-181-T9-3 — MẪU SAMPLER CUỐI #98 GHI 01:11:53Z, MUỘN HƠN BTIME #99 (01:11:46Z) 7 GIÂY (tái diễn F-180-T9-3, đã được T0-181 XÁC NHẬN cho #96/#97).** Btime #99 từ 2 nguồn độc lập khớp nhau (uptime -s 01:11:46Z + /proc/stat btime epoch 1795482706 + journal first 01:12:02Z = btime +16 s); nhưng mẫu sampler cuối trên #98 mang timestamp 01:11:53Z (boot_id e62eef3f). Khả năng: **đồng hồ cell nhanh ~7 s (lần này) trước reboot, được chỉnh lại sau boot** (host-sync; các lần trước: +18–27 s trước #96, ≥29 s trước #97 — lần này delta NHỎ HƠN NHIỀU). T9 KHÔNG tự sửa btime — ghi nhận, giao T0-182 xác minh 9 nguồn. Không ảnh hưởng đếm episode (phân theo boot_id trong dòng mẫu, không theo timestamp tuyệt đối) và không ảnh hưởng gap danh nghĩa 117 s (ghi rõ là danh nghĩa).
- **F-181-T9-4 — GIÁ TRỊ SÀN BALLOON 6.050.608 kB (93,9%) LẶP LẠI LẦN THỨ 5 VÀ 6.** Sag kết thúc E-210 (01:07:53Z) = 6.050.608 kB; dip kết thúc E-212 (01:49:51Z) = 6.050.608 kB — trùng hệt đáy sag tách E-200/E-201 (đợt 178), E-203/E-204 (đợt 179), đáy sag kết thúc E-207 + mẫu đầu phiên (đợt 180, F-180-T9-4). Balloon có vẻ xả về mức sàn lặp lại 6.050.608 kB. T9 chỉ ghi nhận số, không phán cơ chế (host-side).
- **F-181-T9-5 — F-181-T4-5 SAI ĐƯỜNG DẪN: `b2-spikes.log` CỦA T9 CÓ TỒN TẠI LÚC T4 ĐÓNG (ghi nhận — kết luận 0 spike của T4 VẪN ĐÚNG).** T4-181 ghi "T9-181 CHƯA CÓ `b2-spikes.log` lúc T4 đóng" vì T4 tìm ở `hidden_files/round181-t9/` (thư mục không tồn tại — T9 làm việc ở `~/workspace/repo-1/round181-t9/`, cùng mẫu T9-180). Log thật `round181-t9/b2-spikes.log` đã tồn tại từ 23:55Z (watcher pid 183829) và ghi 0 spike trong cửa sổ attempt (spike đầu 00:44:36Z, sau attempt). Kết luận 0 spike của T4 được log đầy đủ của T9 corroborate — không phải lệch dữ liệu, chỉ sai đường dẫn tìm file.
- **F-181-T9-6 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm 2 → 3, theo T4).** Không probe nào của T9 trong cửa sổ attempt1 (00:20:12–00:24:06Z): probe-mở 23:55:56Z TRƯỚC attempt; lan-2 00:25:56Z SAU khi attempt kết thúc 00:24:06Z; lan-3/win99/win99b/lan-4/cặp đóng đều ngoài cửa sổ. T4-181 phán 0 VI PHẠM (LIMITS T4). Chuỗi 0 vi phạm đợt 181 thuộc T10/parent phán cuối.
- **F-181-T9-7 — SAMPLER T8 GHI 0 GHIM, SAMPLER T9 GHI 34 GHIM — KHÁC CỬA SỔ/CADENCE, KHÔNG MÂU THUẪN TRỰC TIẾP.** T8-181 LIMITS: "RAM sampler n=31: balloon max 86,8% trần, 0 ghim" — sampler riêng của T8 (cửa sổ làm việc T8 00:33–00:53Z, không phủ 00:08–00:16Z lúc E-209 ghim, 01:02–01:06Z lúc E-210 ghim, 01:24–01:30Z lúc E-211 ghim, 01:41–01:48Z lúc E-212 ghim, 01:53–01:57Z lúc E-213 ghim). Trong cửa sổ harness trùng nhau, sampler T9 max bal 5.519.460 kB = 85,7% trần (00:44:52Z) — cùng bậc với 86,8% của T8; avail min T8 502 MB @00:50:33Z vs T9 471.188 kB @00:50:52Z — khác 19 s, cùng bậc. Sampler T9: 123 mẫu cadence 60 s suốt phiên, log đóng băng md5 `66b67edfd0b377a8c6d6fd107e7b95ad` — căn cứ LIMITS này. Giao T10 đối chiếu hai sampler nếu cần; T9 không sửa số của mình theo sampler khác.
- **F-181-T9-8 — T7 CHƯA đóng cờ lúc T9 đóng (~01:59Z) + T9 ĐÓNG ĐÚNG HẠN CỜ.** T9 không chờ T7 (kết cục run 180/181 + DR/HB thuộc T7-181/T10; cùng mẫu đợt 177/178/179/180, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).

- **Caveat đứng:** probe cap 30.000; sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #98 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 181 (chỉ đọc log đóng băng); T1-181 không chạy lại suite nên không có cửa sổ T1 để đối chiếu; T7-181 chưa đóng nên không có cửa sổ T7 để đối chiếu; clip test birefnet 14.554 B đợt 180 chưa kiểm lại vị trí đợt này.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (123 mẫu, 23:54:51Z–01:57:51Z): `round181-t9/ram-sampler-FROZEN.log` — md5 `66b67edfd0b377a8c6d6fd107e7b95ad`. Log B2 đóng băng (100 spike): `round181-t9/b2-spikes-FROZEN.log` — md5 `766eaa502395224371b8705ffb7444bc`. Log headroom đóng băng (7 lần đo): `round181-t9/headroom-log-FROZEN.txt` — md5 `fa862de3906e1c13bcc246dbb19b876f`. Phân tích bằng script: `round181-t9/t9-181-analyze.py` (output: `round181-t9/t9-181-analyze-output.txt`). Ghi chú baseline: `round181-t9/t9-181-baseline-notes.md`. T10 đọc log đóng băng trực tiếp khi cần kiểm lại từng mẫu.
