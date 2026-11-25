# LIMITS — Phase 9 đợt 182, T9: headroom + RAM + birefnet (0 thử lần 36; reboot #100 mới; E-213 kết thúc bởi sag; E-214/E-215/E-216/E-217 mới + E-218 đang ghim; ENOSPC đợt 31 nhưng DỪNG giữa boot #100; headroom đóng 2)

## 0. Tóm tắt

- **Headroom: 2 lúc đóng (7 lần đo: 0, 0, 0, 2, 2, 2, 2; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 42 liên tiếp**. Giá trị đóng 2 — lần đầu khác 0 trong 5 đợt gần nhất (178–181 đều đóng 0). Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG #99: KHÔNG QUAN SÁT ĐƯỢC** (đợt mở sau khi cửa sổ đóng). **CỬA SỔ THOÁNG #100: QUAN SÁT ĐƯỢC 2 probe trong cửa sổ (boot+88s, boot+102s) — CẢ HAI 0, KHÔNG lần mở** (giống #99 đợt 181).
- **Balloon — E-213 KẾT THÚC BỞI SAG + 4 EPISODE MỚI + 1 ĐANG GHIM: E-213 (5) kết thúc bởi sag (mẫu sag đầu 02:52:01Z); E-214 (7) / E-215 (7) / E-216 (14) / E-217 (9) mới trên #100; E-218 (7) ĐANG GHIM lúc đóng — kết cục thuộc T9-183.** Tổng ghim **44/114 (38,6%)** — cao nhất kể từ đợt 178 (38,7%); trên #100: 44/96 (45,8%); trên #99: 0/18. KHÔNG gộp episode nào (quyết (h) đợt 179: TÁCH theo quy tắc cơ học).
- **RAM: 114 mẫu, 02:52:01Z–04:45:17Z, HAI boot (#99: 18; #100: 96).** Max **5.030.996 kB (79,9% guard)** lúc 03:03:03Z (#99); min **391.344 kB** lúc 04:00:16Z (#100, trong E-215 — KHÔNG phá kỷ lục trũng sâu 225.224 kB đợt 180; CAO HƠN min đợt 181 là 363.464 kB). Gate A **37/114**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 36 liên tiếp**.
- **B2: 125 spike THẬT, 1 cụm duy nhất trên #99 (02:53:15–03:06:46Z) — tất cả có driver đứng đầu; 0 spike trên #100; 0 spike trong span ghim (44 mẫu ghim). KHÔNG CÓ cửa sổ attempt T4 để đối chiếu (T4 0 attempt) — không kết luận "0 spike trong cửa sổ attempt" đợt này.**
- **Lượt yên #51 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt — CHUỖI LƯỢT YÊN HỢP LỆ GIỮ 44** (không tăng, không đứt). T4 đóng 04:30Z (hạn cắt), 0 vi phạm — chuỗi 0 vi phạm 3 → 4.
- **REBOOT #100 MỚI GIỮA PHIÊN** (boot `7a83ab15`, btime 03:09:07Z, gap #99→#100 = 7.041 s — số hiệu + btime chờ T0-183 xác minh 9 nguồn); giết sampler/watcher/probe-loop T9; T9 khởi động lại, gap mẫu 72 s. **#99 XÁC NHẬN 9 nguồn (T0-182)** — nợ đợt 181 đã trả.
- **ENOSPC: đếm trực tiếp 86 dòng (76 #99 + 10 #100) — đợt thứ 31 liên tiếp có lỗi thật — NHƯNG lỗi trên #100 DỪNG HẲN sau 03:31:17Z** (mẫu mới lần đầu: journal còn chạy nhưng 0 dòng lỗi mới sau đó; tương quan với headroom 0 → 2 — xem §4/F-182-T9-6).
- **T7 CHƯA đóng lúc T9 đóng (~04:47Z)** — như T7-180/T7-181. Không push, không sửa production, không chạy TTS 39, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 181 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả hai boot.

### 1.2 Số đo đợt 182 (7 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 02:53:25Z | **0** | #99 9897d4b4 | 63.747 | cặp mở (boot+1h41m39s) |
| 03:10:35Z | **0** | #100 7a83ab15 | 63.747 | **TRONG cửa sổ thoáng (boot+88s)** |
| 03:10:49Z | **0** | #100 | 63.747 | **TRONG cửa sổ thoáng (boot+102s)** |
| 03:40:35Z | **2** | #100 | 63.747 | lan-2 (boot+31m28s) |
| 04:10:35Z | **2** | #100 | 63.747 | lan-3 (boot+1h01m28s); E-216 ĐANG GHIM |
| 04:40:35Z | **2** | #100 | 63.747 | lan-4 (boot+1h31m28s); E-218 ĐANG GHIM |
| 04:45:45Z | **2** | #100 | 63.747 | cặp đóng (tay); E-218 ĐANG GHIM |

- **CỬA SỔ THOÁNG #100: QUAN SÁT ĐƯỢC NHƯNG 0.** Btime 03:09:07Z (uptime-based, chờ T0-183 xác minh 9 nguồn); dải mẫu boot+53–245s ≈ 03:10:00–03:13:12Z. T9 khởi động lại daemon sau reboot và probe lúc boot+88s (03:10:35Z) = **0** và boot+102s (03:10:49Z) = **0** — không lần mở nào quan sát được. Không phân biệt được "không mở" với "mở rồi đóng trước +88s" (cửa sổ #96 đóng trong ~15 s — nếu #100 cũng đóng nhanh như vậy thì probe +88s đã muộn). Chuỗi "quan sát được lần mở" vẫn đứt từ #96 (chỉ #96 mở 2.903; #97/#98 không quan sát được; #99/#100 quan sát được nhưng 0).
- **CỬA SỔ THOÁNG #99: KHÔNG QUAN SÁT ĐƯỢC trong đợt 182** (T9-182 mở phiên 02:51Z = boot+1h39m, sau khi cửa sổ đóng; dải mẫu boot+53–245s ≈ 01:12:39–01:15:51Z đã qua). Không luồng nào khác probe headroom trong cửa sổ #99 (T9-181 đã đóng 01:58Z; T7/T8 không probe headroom).
- **Headroom cuối phiên: 2 — LẦN ĐẦU KHÁC 0 trong 5 đợt gần nhất (178–181 đều đóng 0).** 4 lần đo liên tiếp đều = 2 (lan-2/lan-3/lan-4/cặp đóng, 03:40–04:45Z) — ổn định, không phải nhiễu một lần. Số watch giữ ngoài cell lúc đóng: **63.745**. Tỉ lệ so với nhu cầu vite (~1.578): **~0** — một vite mới vẫn không khởi động được (như mọi đợt từ 152). **Trần KHÔNG ĐỔI trong boot** (63.747 trên #99 và #100).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt: **… → 0 → 2 → 0 → 2 → 2 → 0 → 2 → 0 → 2 → 2 → 0 → 0 → 0 → 0 → 0 → 2**. Gần nhất: 178 đóng 0; 179 đóng 0; 180 đóng 0 (1 lần đo giữa phiên 2.903); 181 đóng 0 (toàn 0, 7 lần đo); **182 đóng 2 (3 lần 0 đầu phiên + 4 lần 2)**.

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 2, thực chất vẫn ~0.** Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, lần thứ 42 liên tiếp.** Quyết parent đợt 181 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới: journal đợt này có 86 dòng lỗi ENOSPC đếm trực tiếp (xem §4)** — đợt thứ 31 liên tiếp — NHƯNG lỗi trên #100 đã DỪNG sau 03:31:17Z, trùng thời điểm headroom nhích 0 → 2 (xem F-182-T9-6). T9 chỉ nêu dữ kiện + tương quan, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 114 mẫu, 02:52:01Z–04:45:17Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot #100: 72 s** (mẫu cuối #99 03:09:03Z → mẫu đầu #100 03:10:15Z); **gap giữa hai đợt: 54'10" không sampler T9** (mẫu cuối T9-181 01:57:51Z → mẫu đầu T9-182 02:52:01Z — chứa khoảng mù E-213, xem §2.2); **0 gap >90 s khác trong phiên** (gap lớn thứ hai 61 s — jitter cadence bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 02:52:01–03:09:03Z | #99 | 527.032–5.030.996 kB | Mở sampler; E-213 kết thúc bởi sag (mẫu đầu 02:52:01Z); balloon xả sâu tới 1.365.816 kB rồi leo lại; **125 spike B2** |
| 03:10:15–03:23:15Z | #100 | 496.856–1.729.524 kB | Boot #100 mới; balloon leo đơn điệu tới trần; T4 poller inst2 bắt đầu 03:12:41Z |
| 03:24:15–03:30:15Z | #100 | 447.788–530.600 kB | **E-214 7 mẫu ghim**; gate A 0/7; 0 spike B2 |
| 03:31:15–03:55:16Z | #100 | 482.704–2.419.824 kB | Sag sâu sau E-214 (avail lên 2.419.824 kB lúc 03:41:16Z); balloon leo lại; **ENOSPC #100 dừng sau 03:31:17Z** |
| 03:56:16–04:02:16Z | #100 | 391.344–509.628 kB | **E-215 7 mẫu ghim**; gate A 0/7; **RAM min phiên 391.344 kB** |
| 04:03:16–04:04:16Z | #100 | 557.996–662.532 kB | Sag tách E-215/E-216 (2 mẫu dưới trần) |
| 04:05:16–04:18:16Z | #100 | 460.132–572.376 kB | **E-216 14 mẫu ghim** (dài nhất đợt); gate A 0/14; 0 spike B2 |
| 04:19:16–04:24:17Z | #100 | 504.152–1.029.428 kB | Sag SÂU sau E-216 (bal 5.899.868 = 91,6%); balloon leo lại |
| 04:25:17–04:33:17Z | #100 | 480.616–520.320 kB | **E-217 9 mẫu ghim**; gate A 0/9; 0 spike B2 |
| 04:34:17–04:38:17Z | #100 | 573.648–666.880 kB | Sag tách E-217/E-218 (5 mẫu dưới trần) |
| 04:39:17–04:45:17Z | #100 | 479.224–513.516 kB | **E-218 7 mẫu ĐANG GHIM lúc đóng**; gate A 0/7; 0 spike B2 |

- **Gate A ≥1024 MiB: 37/114 mẫu** (16/18 trên #99 + 21/96 trên #100); **0 mẫu ≥ guard**; load1 max (sampler) **9,91** (02:58:02Z, #99 — trong O8 T0); **RAM <512.000 kB: 36 mẫu** (31,6% — 0 trên #99 + 36 trên #100, 12 dải — xem dưới); **RAM <300.000 kB: 0 mẫu** (đợt 181: 0 mẫu, min 363.464 kB — đợt này min CAO HƠN đợt 181).
- Swap: SwapFree 667.328 kB (mẫu đầu #99) → 692.724 kB (mẫu cuối #99) → **1.040.356 kB (mẫu đầu #100 — NHẢY +347.632 kB qua reboot #100)** → 671.368 kB (mẫu cuối, 04:45:17Z). Nhịp nhảy SwapFree qua reboot: #100 nhả ~347.632 kB (đợt 181: #99 nhả ~372.324 kB; #96 nhả ~403.960 kB; #95 nhả ~331.952 kB; #93 nhả ~268.104 kB; #91 nhả ~376.948 kB).
- Trũng RAM đợt này: min **391.344 kB (04:00:16Z, #100, trong E-215)** — sâu thứ ba trong các log T9 (kỷ lục 225.224 kB đợt 180; đợt 179: 333.672 kB; đợt 181: 363.464 kB — đợt này min CAO HƠN cả hai đợt trước). Lúc đó balloon CEIL, load1 0,21 — balloon ghim trần nhưng sag ngay sau (04:03:16Z bal 6.280.140 kB), KHÔNG kẹt. 36 mẫu <512.000 kB trong 114 mẫu (31,6%; đợt 181: 21/123 = 17,1% — tỉ lệ TĂNG MẠNH do #100 ghim nhiều).

**Bảng tổng hợp số RAM (từ script `t9-182-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 114 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #99 9897d4b4 | 18 | 527.032 | 5.030.996 | 3.418.747,1 | 16/18 | 0 | 9,91 | 0 |
| #100 7a83ab15 | 96 | 391.344 | 2.419.824 | 783.133,8 | 21/96 | 44 | 2,63 | 36 |
| **Toàn phiên** | **114** | **391.344** | **5.030.996** | **1.199.283,3** | **37/114** | **44/114 (38,6%)** | **9,91** | **36** |

- **Mean toàn phiên 1.199.283,3 kB — 3 cách độc lập: python `sum/n = 1.199.283,3` VÀ awk `sum/n = 1.199.283` VÀ trung bình có trọng số ((18×3.418.747,1 + 96×783.133,8)/114 = 1.199.283,3) — KHỚP CẢ BA.**
- 36 mẫu RAM <512.000 kB, 12 dải (từ script python trên log đóng băng): #100: 03:23:15–03:29:15Z (7); 03:52:16Z (1); 03:56:16–04:02:16Z (7); 04:05:16Z (1); 04:07:16–04:09:16Z (3); 04:13:16–04:14:16Z (2); 04:17:16Z (1); 04:24:17–04:25:17Z (2); 04:27:17Z (1); 04:29:17–04:33:17Z (5); 04:39:17–04:40:17Z (2); 04:42:17–04:45:17Z (4). Tổng 7+1+7+1+3+2+1+2+1+5+2+4 = 36 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-213 KẾT THÚC BỞI SAG + E-214/E-215/E-216/E-217 MỚI + E-218 ĐANG GHIM

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #99 và #100** (max bal trong log = đúng CEIL trên cả hai boot).
- **E-213 — KẾT THÚC BỞI SAG (nợ đợt 181 đã trả).** 5 mẫu trong log đóng băng đợt 181 (01:53:51–01:57:51Z, #99); mẫu sampler đầu tiên đợt 182 (02:52:01Z) bal đã **6.247.216 kB = 96,95%** — ĐÃ SAG khỏi trần. **Khoảng mù 54'10" giữa hai đợt (01:57:51Z → 02:52:01Z) không cho biết ghim bắt đầu/kết thúc khi nào trong khoảng mù** — không khẳng định được ghim liên tục hay sag rồi leo lại. Điểm CEIL đọc tay 02:51:23Z (MemAvailable 356.252 kB, Balloon **6.443.824 kB = ĐÚNG TRẦN**, 38 s trước mẫu sag) cho thấy balloon VẪN ở trần ngay trước khi sag — nhưng theo quyết parent (h) đợt 181, điểm đọc tay đơn lẻ KHÔNG TÍNH vào đánh số E. **E-213 = 5 mẫu, KẾT THÚC bởi sag — không cộng điểm đọc tay.**
- **Boot #99: GHIM 0/18 mẫu (0%) trong phiên T9-182, 0 EPISODE MỚI.** Balloon xả sâu sau sag E-213 (xuống 1.365.816 kB lúc 03:00:02Z, avail lên 4.723.120 kB) rồi leo lại tới 3.727.004 kB lúc 03:09:03Z (chưa tới trần thì reboot #100 giết sampler).
- **Boot #100: GHIM 44/96 mẫu (45,8%), 4 EPISODE MỚI (E-214 + E-215 + E-216 + E-217) + 1 ĐANG GHIM (E-218).** Balloon leo đơn điệu từ 5,09M (03:10:15Z) tới trần. **E-214 — 03:24:15–03:30:15Z, 7 mẫu** (RAM 447.788–530.600 kB; mẫu trước 03:23:15Z bal 6.398.680 kB = 99,29%), **KẾT THÚC bởi sag** (03:31:15Z bal 6.282.668 kB = 97,5%; RAM nhảy lên 662.112 kB). **E-215 — 03:56:16–04:02:16Z, 7 mẫu** (RAM 391.344–509.628 kB; mẫu trước 03:55:16Z bal 6.378.288 kB = 98,99%), **KẾT THÚC bởi sag** (04:03:16Z bal 6.280.140 kB = 97,5%). **E-216 — 04:05:16–04:18:16Z, 14 mẫu — DÀI NHẤT ĐỢT** (RAM 460.132–572.376 kB; mẫu trước 04:04:16Z bal 6.374.044 kB = 98,9%), **KẾT THÚC bởi sag SÂU** (04:19:16Z bal **5.899.868 kB = 91,6%** — sag sâu nhất đợt; RAM nhảy lên 1.029.428 kB). **E-217 — 04:25:17–04:33:17Z, 9 mẫu** (RAM 480.616–520.320 kB; mẫu trước 04:24:17Z bal 6.430.284 kB = 99,8%), **KẾT THÚC bởi sag** (04:34:17Z bal **6.247.216 kB = 96,95% — TRÙNG HỆT giá trị sag kết thúc E-213 lúc 02:52:01Z**, xem F-182-T9-4). **E-218 — 04:39:17–04:45:17Z, 7 mẫu** (RAM 479.224–513.516 kB; mẫu trước 04:38:17Z bal 6.375.940 kB = 98,9%), **ĐANG GHIM lúc T9 đóng** — kết cục (sag/dip/reboot) thuộc T9-183.
- **Tổng ghim trần đợt này: 44/114 mẫu (38,6%)** (đợt 181: 34/123 = 27,6%; đợt 180: 19/116 = 16,4%; đợt 179: 27/131 = 20,6%; đợt 178: 53/137 = 38,7% — đợt này CAO THỨ HAI trong chuỗi, chỉ sau 178). Tỉ lệ ghim trên #100 (45,8%) cao gấp ~2,5 lần tỉ lệ ghim trên #99 đợt 181 (17,9%) — balloon leo trần nhanh hơn trên boot mới (E-214 bắt đầu boot+15m08s; E-215 boot+47m09s; E-216 boot+56m09s; E-217 boot+1h16m10s; E-218 boot+1h30m10s).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-214/E-215/E-216/E-217 là 4 EPISODE MỚI (sag/dip tách chuỗi; quy tắc từ đợt 172; quyết (h) đợt 179: KHÔNG gộp qua sag dù nông — TÁCH). Các khoảng tách đều ≥2 mẫu dưới trần (E-214/E-215 tách bởi 6 mẫu; E-215/E-216 tách bởi 2 mẫu 04:03–04:04Z; E-216/E-217 tách bởi 6 mẫu; E-217/E-218 tách bởi 5 mẫu) — KHÔNG có micro-dip 1 mẫu gây tranh cãi như E-204/E-205. E-218 đang ghim — chưa phán kết cục. **Không có phương án gộp nào cần xét đợt này.**
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-215 chỉ ~391–510.000 kB trong khi tổng RAM − balloon = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #51 (T4) — KHÔNG CÓ LƯỢT HỢP LỆ, 0 attempt — CHUỖI GIỮ 44 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#51 KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt, ngân sách dùng 0/3 — CHUỖI LƯỢT YÊN HỢP LỆ GIỮ 44.** Poller instance 1 (20 poll trên #99, 02:55:02–03:09:29Z): gate0 ĐẠT từ poll #2 (POSTBOOT_PASS #99, 02:55:07Z, replay-đầy-đủ, poll=0, KHÔNG caveat) nhưng gate A (load1<2 + load5<2) không bao giờ đủ đồng thời. Poller instance 2 (103 poll trên #100, 03:12:41–04:29:24Z): load + RAM đủ trên 23 poll nhưng gate0 KHÔNG BAO GIỜ đạt (POSTBOOT_PASS #100 CHƯA CÓ). Hạn cắt 04:30Z tới → poller thoát exit 5, 0 attempt. **KHÔNG CÓ cửa sổ attempt nào đợt này** → không có cửa sổ attempt để đối chiếu B2 (xem §2.5) và không có kiểm chứng live lần 3 quyết (p) (F-182-T4-5 — dời sang đợt có attempt đầu tiên).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** poller instance 1: gate A MỞ **14/14 mẫu** (RAM 2.869.892–5.030.996 kB; balloon 1,37–3,87M, **0 mẫu ghim**); load1 **1,09–9,91** (đỉnh 9,91 lúc 02:58:02Z — trong O8 T0). Poller instance 2: gate A MỞ **18/77 mẫu**; **33 mẫu ghim**; load1 **0,03–1,87**. **0 vi phạm theo T4 — chuỗi 0 vi phạm 3 → 4.**

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 02:56:57–03:00:18Z | #99 | 5,35–9,91 (4 mẫu) | 3.701.880–4.723.120 kB — **gate A 4/4** | **O8 T0 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); **39 spike B2** trong cửa sổ (xem §2.5); 0 mẫu ghim |
| T4 poller inst1 02:55:02–03:09:29Z | #99 | 1,09–9,91 (14 mẫu) | 2.869.892–5.030.996 kB — **gate A 14/14** | **0 attempt** (gate A load không đủ đồng thời); 0 mẫu ghim; **108 spike B2** |
| T4 poller inst2 03:12:41–04:29:24Z | #100 | 0,03–1,87 (77 mẫu) | 391.344–2.419.824 kB — **gate A 18/77** | **0 attempt** (gate0 không đạt); **33 mẫu ghim**; 0 spike B2 |
| T8 waiter-2 03:10:46–04:30:50Z | #100 | 0,03–1,87 (80 mẫu) | 391.344–2.419.824 kB — **gate A 20/80** | **Harness 0/6 KHÔNG ĐO ĐƯỢC** (thiếu 3 lib); **34 mẫu ghim**; 0 spike B2 |

- T1-182: verify 181, không chạy lại suite → không có cửa sổ T1 để đối chiếu (như đợt 177–181). T7-182 CHƯA đóng → không có cửa sổ T7 (thuộc T9-183 nếu T7 đóng muộn). T4-182: RAM <500 MB 32/125 poll (chuỗi dài nhất 8 poll #16–#23 inst2, 03:23:58–03:29:14Z) — trùng khít E-214 (03:24:15–03:30:15Z); sampler T9 cùng dải: 7 mẫu <512k — KHỚP.
- T8-182: **harness 0/6 KHÔNG ĐO ĐƯỢC** (WebKitWebProcess thiếu libavif.so.16 + libEGL.so.1 + libevdev.so.2 trên #100; replay host dừng ở dpkg 309); O8 T8 KHÔNG CHẠY; **chuỗi FULL PASS GIỮ 1** (đề xuất, parent quyết). T8 điểm đo trực tiếp: balloon CEIL lúc 04:11Z (trong E-216) + 04:31Z (trong E-217) — KHỚP sampler T9; avail T8 429 MB lúc 04:31Z vs T9 499.508 kB lúc 04:31:17Z — khác giây đo, cùng bậc, **KHÔNG mâu thuẫn trực tiếp** (cùng mẫu F-181-T9-7); giao T10 đối chiếu nếu cần.

### 2.5 B2 — 125 spike THẬT, 1 cụm duy nhất trên #99; 0 spike trên #100; 0 spike trong span ghim

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **125 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 125): TẤT CẢ trên #99, 1 cụm duy nhất 02:53:15–03:06:46Z; 0 spike trên #100 (watcher khởi động lại 03:10:31Z, load1 #100 max 2,63 — dưới ngưỡng 3,0 suốt); 0 spike trong span ghim E-214/E-215/E-216/E-217/E-218 (44 mẫu ghim, 0 spike — như đợt 177/178/179/180/181).** KHÔNG CÓ cửa sổ attempt T4 để đối chiếu (0 attempt) — T4-182 ghi rõ "KHÔNG ÁP DỤNG".

| Cụm | Thời gian (UTC) | n | load1 max | Driver đứng đầu |
|---|---|---|---|---|
| 1. Mở phiên + O8 T0 #99 | 02:53:15–03:06:46Z | 125 | 10,44 | hatch (35) + WebKitWebProcess (29) + grep (29) + chrome (11) + bash (10) + MainThread (4) + python3 (3) + privsep-test-fu (3) + esbuild (1) — driver đúng là trình duyệt đo (O8 T0) + sweep/grep các luồng khác + hatch |

- **Tổng kết: 125/125 spike có process đứng đầu %CPU; load1 đỉnh đợt (watcher, cadence 2 s): 10,44** (đợt 181: 4,81 — đợt này CAO HƠN NHIỀU do O8 T0 + T4 poller + T2 sweep chồng nhau trên #99; load1 max sampler cadence 60 s là 9,91 — cùng bậc, khác cadence). **39 spike trong cửa sổ O8 T0 (02:56:57–03:00:18Z); 108 spike trong cửa sổ poller T4 instance 1 (02:55:02–03:09:29Z); 17 spike trước khi poller T4 mở (02:53:15–02:55:01Z).**
- **Khoảng mù watcher đầu phiên: ~1 phút** (watcher khởi động 02:53Z, sampler 02:52:01Z; spike đầu bắt 02:53:15Z — trước đó load1 sampler max 2,09, không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng <3,0 trong gap). **Khoảng mù qua reboot #100: ~88 s** (watcher chết ~03:09Z, chạy lại 03:10:31Z; 0 spike trên #100; load1 sampler trong gap 1,09 → 2,63 — dưới ngưỡng 3,0, không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng trong gap). **0 gap phủ sóng watcher nào khác.**

## 3. Birefnet guard (cơ chế (a) — 0 lần thử, lần thứ 36)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round182-t9/sampler.sh` chạy 02:52:01Z–04:45:17Z (2 instance: instance 1 sống 02:52:01Z–03:09:03Z trên #99 rồi **CHẾT theo reboot #100**; instance 2 khởi động lại 03:10:15Z trên #100, sống tới khi T9 dừng tay ~04:46Z — **1 gap qua reboot (72 s), 0 gap >90 s khác; max gap trong boot 61 s**), **114 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **5.030.996 kB = 79,9% guard** (đợt 181: 42,6%; đợt 180: 38,83%; đợt 179: 40,52%; đợt 178: 66,35%; đợt 177: 41,78%; đợt 176: 48,52%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **1.260.460 kB (20,0%)** — GẦN NHẤT kể từ đợt 171 (đỉnh trên #99 lúc balloon xả sâu, không phải lúc ghim). **Caveat (F-179-T9-4 đợt 178): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 182 — lần thứ 36 liên tiếp** (đợt 147–182: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 36 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round182-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại, symlink → /usr/bin/python3.12), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 181); không có thư mục `~/workspace/tmp-t9-182-birefnet/` (không thử gì). T9 sẵn sàng kích hoạt khi guard mở.

## 4. ENOSPC trong journal (đếm trực tiếp 86 dòng — đợt thứ 31 liên tiếp — NHƯNG lỗi trên #100 DỪNG sau 03:31:17Z)

- **#99:** đếm trực tiếp **76 dòng** (lúc 02:53:42Z, khi #99 còn là boot hiện tại; dòng đầu 01:13:35Z = boot+109s; dòng cuối đếm được 02:53:15Z). Phần 02:53:42Z → reboot 03:09:07Z (~15,4 phút) **KHÔNG đếm được** (journal #99 mất sau reboot #100 — `--list-boots` lúc đóng chỉ còn idx 0 #100); ngoại suy theo nhịp ~0,63 dòng/phút ≈ **+9–10 dòng → #99 ≈ 85–86 dòng**.
- **#100:** **10 dòng** (đếm trực tiếp lúc đóng — toàn bộ từ lúc mở boot tới lúc đóng; journal bắt đầu 03:09:18Z nên phủ sóng đầy đủ). Dòng đầu **03:10:57Z (boot+110s)** — khớp mẫu #93 (boot+114s), #91 (boot+~120s), #90 (boot+121s), #95 (boot+105s), #98 (boot+103s), #99 (boot+109s). Dòng cuối **03:31:17Z**. Nhịp 9 dòng đầu ≈ 1 dòng/65–70 s (03:10:57–03:20:03Z), rồi 1 dòng 03:31:17Z (cách 11 phút), **rồi KHÔNG CÓ DÒNG NÀO NỮA tới lúc đóng (04:46Z — 75 phút)**.
- **Tổng đợt 182 đếm trực tiếp: 86 dòng** (76 #99 + 10 #100) — cận dưới; ngoại suy ≈ **95–96 dòng** (86 + ~9–10 phần #99 không đếm được). Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut). **MẪU MỚI (F-182-T9-6): lỗi ENOSPC trên #100 DỪNG HẲN sau 03:31:17Z trong khi journal vẫn chạy (dòng service 04:45:47Z `Starting home-assistant-ensure.service ... Deactivated successfully` — service vẫn chạy nhưng KHÔNG còn lỗi inotify). Tương quan: headroom nhích 0 → 2 trong khoảng (03:31:17Z, 03:40:35Z] — 2 watch được giải phóng có thể đã đủ cho service lấy được watch nó cần, lỗi dừng. T9 chỉ nêu tương quan, không khẳng định nhân quả (host-side).**
- **Caveat đếm:** `journalctl --since` / `--list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #99 từ cell (cùng mẫu F-171-T10-4, F-176-T9-5, F-177-T9-5, F-178-T9-5, F-179-T9-5, F-180-T9-5, F-181-T9-5). Số #99 (76) lấy từ đếm trực tiếp lúc 02:53:42Z — ghi trong baseline notes. **Số #100 (10) đếm được lại đầy đủ từ cell** (journal #100 còn nguyên lúc đóng).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #100 mới giữa phiên (T9 bắt trực tiếp, khởi động lại 72 s gap mẫu) + #99 trước khi đợt mở

- **#100 (7a83ab15, btime 03:09:07Z; số hiệu + btime chờ T0-183 xác minh 9 nguồn).** Btime: `uptime -s` 03:09:07Z; epoch `/proc/stat` btime 1795489747; journal idx 0 duy nhất, first entry 03:09:18Z = btime +11 s. Gap #99→#100 = **7.041 s (1h57m21s — TRỞ LẠI mẫu ~2 giờ)**. Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #99 03:09:03Z — 4 s TRƯỚC btime, trong khoảng bình thường — xem F-182-T4-1). T9 khởi động lại 3 daemon lúc 03:10:15–03:10:37Z (**gap mẫu 72 s**; probe headroom TRONG cửa sổ thoáng (boot+88s: 0; boot+102s: 0) rồi mới đọc journal/uptime. Probe-loop mới chạy lan-2/lan-3/lan-4 đúng giờ (đều = 2); lan-5 (~05:10Z) ngoài hạn cờ nên T9 probe tay cặp đóng 04:45:45Z (= 2) thay thế. Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 6 — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#99 (9897d4b4, btime 01:11:46Z):** TRƯỚC khi đợt mở 1h24m; **T0-182 XÁC MINH 9/9 nguồn** (epoch 1795475543; uptime bracket ×3 khớp cùng giây; boot_est btime +0,07 s; /proc/1 start_ticks btime +16,05 s; stat mtime btime +16,118 s; journal first btime +16 s; wtmp begins 01:12:02Z; CF ×4; DB: run 182 boot_gen mới; marker mtime không đổi). Gap #98→#99 = **7.163 s (1h59m23s)**. **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: 54'10" không sampler T9** (mẫu cuối đợt 181 01:57:51Z → mẫu đầu đợt 182 02:52:01Z) — chứa điểm CEIL đọc tay 02:51:23Z + sag kết thúc E-213 (xem §2.2). Marker: T0-182 đếm **51 reboot #49–#99**; **#100 chưa xác nhận** (thuộc T0-183) → sống qua 52 reboot nếu #100 được xác nhận.

### 5.2 T5-182 — POSTBOOT_PASS #99 CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat); #100 CHƯA CÓ

- **POSTBOOT_PASS #99 ĐÃ CÓ lúc 02:55:07Z** (T5-182, mode **replay-đầy-đủ, poll=0, KHÔNG caveat**, dpkg 1.468, cache 174, lists 37 — MẠNH HƠN #98/#96/#94 repair-sớm-quyết-h, poll=1). T0 O8 bắt đầu 89 s sau cờ (02:56:57Z); T4 poll #2 (02:55:47Z) đã thấy gate0=T5.
- **POSTBOOT_PASS #100 CHƯA CÓ — KHÔNG AI LÀM** (T5-182 đã đóng cờ 03:01Z, TRƯỚC reboot #100 8 phút; watcher-182 pid 236906 START 02:55:07Z, hạn 05:35:00Z — **CHẾT theo #100**, poll cuối 03:09:13Z = btime +6 s biểu kiến — lệch đồng hồ, xem F-182-T4-1; replay-watch-182.log dừng ở 03:09:13Z; **không có file T5 nào nhắc 7a83ab15**; host os-intent replay chỉ cài gstreamer1.0-tools 03:20:44Z (dpkg 2 → 309) rồi DỪNG HẲN 70+ phút). Hướng (3) VẪN ĐỨNG lần 29 (T5-182). **#100 không có cờ là nguyên nhân gốc khiến T4 0 attempt + T8 harness 0/6** (F-182-T4-4/F-182-T8-2) — giao parent/T10 quyết có giao T5-183 làm lại cờ #100 hay không.
- **POSTBOOT_PASS #98 VẪN CÓ** (repair-sớm-quyết-h, poll=1, caveat — parent CHẤP NHẬN (c) đợt 181); **#96 VẪN CÓ** (repair, poll=1, caveat); **#95 VẪN CÓ** (replay, poll=0, KHÔNG caveat).

### 5.3 Các luồng khác — T7 CHƯA đóng; (m)/INSIDE/mù thuộc T2-182; harness T8 0/6 không đo được

- T7-182 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~04:47Z) — kết cục run 181 (TIMEOUT hay xong? viết lại ×1 tại #99) + run 182 + DR 03:00Z/04:00Z/05:00Z + HB 02:50:50Z/03:20:50Z/03:50:50Z/04:20:50Z thuộc T7-182/T10. T9 đóng đúng hạn cờ, không chờ T7 (cùng mẫu đợt 177/178/179/180/181, theo quyết (l) đợt 152).
- T0-182: #99 XÁC MINH 9/9 nguồn; O8 PASS 3/3 trên #99 (02:56:57–03:00:18Z); (m) #99 ứng viên DƯƠNG sơ bộ +40,109 s (eid 10580 — phân loại cuối thuộc T2-182 + parent 182). T1-182: verify 181 PASS, khớp lần thứ 84. T2-182: (m) #99 phân loại cuối + INSIDE #99 (FULL145) + mù (hole-recheck lần 26) + (m) #56 lần 25 — theo cờ T2-182 (T9 không phán thay T2). T5-182: POSTBOOT_PASS #99 CÓ (replay, poll=0, KHÔNG caveat); hướng (3) VẪN ĐỨNG lần 29. T6-182: #99/#100 có giết holder không + prune lần 57 — theo cờ T6-182. T8-182: **harness 0/6 KHÔNG ĐO ĐƯỢC**; O8 T8 KHÔNG CHẠY; **chuỗi FULL PASS GIỮ 1** (đề xuất); kẹt harness cộng dồn GIỮ 25; 86n2-P1 "không kẹt lần thứ sáu" GIỮ NGUYÊN (không tăng lên 7 — không đo được); (c')/(f') ĐƯỢC GIỮ (replay C5.1 ĐẠT, 0 log mới); B1 0 dòng HB mới; B2 VẪN HOÃN.
- **F-181-T9-3 ĐÃ HẾT DẠNG CŨ (xem F-182-T9-2):** mẫu sampler cuối #99 (03:09:03Z) SỚM HƠN btime #100 (03:09:07Z) 4 s — trong khoảng bình thường; lệch đồng hồ trước #100 được T4 ghi nhận qua poll #20 (+22 s) + watcher-182 (+6 s) — giao T0-183.

## 6. Sai số / caveat (F-182-T9-*)

- **F-182-T9-1 — B2WATCH + PROBE-LOOP KHÔNG CHẠY LẦN 1 DO `cd ... && setsid ... &` NUỐT CHUỖI (tái diễn F-181-T9-1, lỗi vận hành, đã khắc phục trong phiên, KHÔNG mất số liệu sampler).** Lệnh khởi động đầu dùng `cd ... && setsid nohup ./sampler.sh ... & ...; setsid nohup ./b2watch.sh ...` — `&` nuốt cả AND-list, nên b2watch/probe-loop chạy sai cwd (~) và lỗi "No such file or directory". T9 khởi động lại riêng từng daemon bằng `setsid nohup` với `cd ... ;` tách lệnh lúc 02:53Z. Gap phủ sóng B2 ~1 phút (02:52:01–02:53:15Z, trước mọi spike); probe mở chạy đúng 02:53:25Z. Bài học (nhắc lại): KHÔNG dùng `A && B &` — khởi động daemon riêng từng cái, `cd` tách bằng `;`.
- **F-182-T9-2 — RUNTIME RESTART GIẾT SLEEP CHỜ LAN-2 + REBOOT #100 GIẾT DAEMON (tái diễn F-181-T9-2/F-180-T9-2/F-179-T9-1 lần 5).** Hai sleep nền chờ lan-2 (bắt đầu ~02:57Z, hạn ~03:23Z) bị SIGTERM lúc ~03:0xZ — chính là runtime restart đi kèm reboot #100; sampler/watcher/probe-loop cũ chết theo #100 nên lan-2 KHÔNG chạy bằng probe-loop cũ. T9 kiểm lại trực tiếp sau restart, bắt được reboot #100 trong cùng lượt kiểm (boot_id đã đổi lúc 03:09:57Z) và khởi động lại daemon 03:10:15–03:10:37Z (gap mẫu 72 s) + probe tay win100b thay thế. Tất cả chỉ là bộ đếm giờ chờ + probe-loop, KHÔNG mất số liệu sampler (log đóng băng đầy đủ 114 mẫu).
- **F-182-T9-3 — E-213: KHOẢNG MÙ 54'10" GIỮA HAI ĐỢT + ĐIỂM CEIL ĐỌC TAY 02:51:23Z KHÔNG TÍNH (ghi nhận — kết cục E-213 đã phán: kết thúc bởi sag).** E-213 = 5 mẫu trong log đóng băng 181 (01:53:51–01:57:51Z); mẫu sag đầu tiên quan sát được 02:52:01Z (bal 6.247.216 = 96,95%). Khoảng mù 01:57:51Z → 02:52:01Z không cho biết balloon ghim liên tục hay sag rồi leo lại — T9 KHÔNG khẳng định. Điểm CEIL đọc tay 02:51:23Z (38 s trước mẫu sag) KHÔNG cộng vào E-213 theo quyết parent (h) đợt 181 (1 điểm đơn lẻ không đủ chuỗi). Rủi ro đánh số: nếu parent quyết tính điểm đọc tay là một phần của E-213 thì E-213 vẫn là 5 mẫu log + 1 điểm tay — KHÔNG đổi số E nào sau đó (E-214..E-218 giữ nguyên).
- **F-182-T9-4 — GIÁ TRỊ SÀN BALLOON 6.050.608 kB (93,9%) KHÔNG LẶP LẠI LẦN 7 — NHƯNG GIÁ TRỊ SAG 6.247.216 kB LẶP LẠI 2 LẦN.** `grep balloon_kB=6050608` trong log đóng băng đợt 182 = **0 lần** — sàn balloon đợt 178/179/180/181 KHÔNG xuất hiện đợt này (F-181-T9-4 dừng ở lần 6). Ngược lại, giá trị sag **6.247.216 kB** xuất hiện ĐÚNG 2 lần: 02:52:01Z (sag kết thúc E-213) và 04:34:17Z (sag kết thúc E-217). T9 chỉ ghi nhận số, không phán cơ chế (host-side).
- **F-182-T9-5 — HEADROOM 2 ỔN ĐỊNH ×4 LẦN ĐO (lan-2/lan-3/lan-4/cặp đóng) — KHÔNG PHẢI NHIỄU.** Từ 03:40:35Z tới 04:45:45Z, headroom luôn = 2 (trần 63.747). So với đợt 181 (toàn 0) và đợt 180 (1 lần 2.903 giữa phiên): đây là lần đầu headroom đóng ≠ 0 trong 5 đợt gần nhất. Giá trị vẫn ~0 so với ngưỡng ~1.800 — không đổi verdict "chỉ theo dõi". Ghi nhận để T10/T9-183 theo dõi xem 2 có giữ sang đợt sau không.
- **F-182-T9-6 — ENOSPC TRÊN #100 DỪNG HẲN SAU 03:31:17Z (MẪU MỚI — XEM §4).** 10 dòng #100: 9 dòng nhịp ~65–70 s (03:10:57–03:20:03Z) + 1 dòng 03:31:17Z, rồi 0 dòng mới trong 75 phút tới lúc đóng dù journal vẫn chạy (service chạy lại 04:45:47Z không lỗi). Tương quan duy nhất quan sát được: headroom nhích 0 → 2 trong khoảng (03:31:17Z, 03:40:35Z] — 2 watch được giải phóng có thể đã đủ cho service. T9 KHÔNG khẳng định nhân quả; giao T10/parent ghi nhận mẫu mới (lần đầu lỗi dừng giữa boot trong chuỗi 31 đợt).
- **F-182-T9-7 — SAMPLER T8 KHÔNG CÓ ĐỢT NÀY, SAMPLER T9 GHI 44 GHIM — KHÔNG MÂU THUẪN.** T8-182 không chạy sampler riêng (harness 0/6 không chạy được — sampler chạy trong run-webkit); T8 chỉ có 2 điểm đo trực tiếp balloon CEIL (04:11Z trong E-216 + 04:31Z trong E-217) — KHỚP sampler T9. Avail T8 429 MB lúc 04:31Z vs T9 499.508 kB lúc 04:31:17Z — khác giây đo, cùng bậc. Sampler T9: 114 mẫu cadence 60 s suốt phiên, log đóng băng md5 `b4ee6fa7c8a5927c52c50583b34a581d` — căn cứ LIMITS này. Giao T10 đối chiếu nếu cần; T9 không sửa số của mình theo điểm đo khác.
- **F-182-T9-8 — T7 CHƯA đóng cờ lúc T9 đóng (~04:47Z) + T9 ĐÓNG ĐÚNG HẠN CỜ.** T9 không chờ T7 (kết cục run 181/182 + DR/HB thuộc T7-182/T10; cùng mẫu đợt 177/178/179/180/181, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).
- **F-182-T9-9 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm 3 → 4, theo T4).** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0–2 thì fail ngay ở watch đầu, không tạo tải); không có cửa sổ attempt T4 nào tồn tại đợt này nên không có cửa sổ nào để vi phạm. T4-182 phán 0 VI PHẠM (LIMITS T4). Chuỗi 0 vi phạm đợt 182 thuộc T10/parent phán cuối.

- **Caveat đứng:** probe cap 30.000; sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #99 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 182 (chỉ đọc log đóng băng); T1-182 không chạy lại suite nên không có cửa sổ T1 để đối chiếu; T7-182 chưa đóng nên không có cửa sổ T7 để đối chiếu; T8-182 không có sampler riêng (harness 0/6).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (114 mẫu, 02:52:01Z–04:45:17Z): `round182-t9/ram-sampler-FROZEN.log` — md5 `b4ee6fa7c8a5927c52c50583b34a581d`. Log B2 đóng băng (125 spike): `round182-t9/b2-spikes-FROZEN.log` — md5 `37050e8c2a3d718db8778227fa48b494`. Log headroom đóng băng (7 lần đo): `round182-t9/headroom-log-FROZEN.txt` — md5 `9834ce37e53a7a4a88cd5e3c28064683`. Phân tích bằng script: `round182-t9/t9-182-analyze.py` (output: `round182-t9/t9-182-analyze-output.txt`). Ghi chú baseline: `round182-t9/t9-182-baseline-notes.md`. T10 đọc log đóng băng trực tiếp khi cần kiểm lại từng mẫu.
