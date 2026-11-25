# LIMITS — Phase 9 đợt 189, T9: headroom + RAM + birefnet (trần inotify giảm 63.747 → 63.737; headroom nhích 0→1→2; REBOOT 04:36:24Z giữa phiên; E-244–E-248, E-248 vẫn ghim lúc đóng; ENOSPC #112 DỪNG giữa boot; auto-trigger BẬT LIVE 03:14Z, 0 FIRE)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (7 lần đo: 0, 0, 1, 0, 2, 0, 0; trần 63.737)** — dưới ngưỡng < ~1.800 **lần thứ 49 liên tiếp**. Quyết "chỉ theo dõi" đứng (parent (l) §12.3-188: lần 48).
- **Trần inotify GIẢM 63.747 → 63.737 (−10)** so với đợt 188; đứng cả 7 lần đo (xem F-189-T9-1).
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** (128 mẫu chính + 97 live + 30 dry-run) — guard KHÔNG mở lại. **0 lần chạy birefnet — lần thứ 43 liên tiếp** (147–189). Xem §3.
- **Auto-trigger: BẬT LIVE 03:14Z** (quyết (o) §12.3-188 — DUYỆT fixture clip1.mp4 + load1 < 4,0 + không-hẹn; xem §3). Live 97 mẫu, tất cả consec=0, **0 FIRE / 0 DEFER / 0 MISSED-WINDOW**. Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA (điểm yếu (b) đứng).
- **CỬA SỔ THOÁNG boot mới: ĐO ĐƯỢC 1 điểm trong cửa sổ** (probe boot+78s = 0) — lần đầu đo được sau 5 boot không quan sát được; không thấy mở tại điểm đo (caveat: 1 điểm, không phủ cả cửa sổ 61–92s).
- **Balloon: 5 EPISODE MỚI E-244 (3) + E-245 (4) + E-246 (13) + E-247 (12) trên #112, tất cả kết thúc bởi sag; E-248 (2) trên boot mới, VẪN GHIM lúc đóng.** Tổng ghim #112 **34/114 (29,8%)**; toàn phiên 36/128 (28,1%). Sàn 6.050.608 kB: **0 lần** (chuỗi dừng ở 11).
- **RAM: 128 mẫu, 02:43:24–04:51:14Z, HAI boot (#112 + boot mới).** Max **2.705.136 kB**; min **434.488 kB**; mean 1.023.420,5 kB; gate A **51/128**. **1 REBOOT trong phiên (04:36:24Z)** — gap sampler 107 s; 0 gap >61 s ngoài reboot.
- **Lượt yên #58 (T4): CÓ LƯỢT HỢP LỆ** (attempt1 03:12:48–03:16:16Z, 20/20 + lớp B 5/5, median 42,0 ms) — chuỗi 0 → 1 (đề xuất; parent quyết). **(p) kiểm chứng live lần 9: ĐẠT** (0 file analyzer trong cửa sổ; T9 đối chiếu: 0 spike B2 trong cửa sổ; live autotrigger khởi động 03:14:10Z trong cửa sổ, 0 FIRE) — chuỗi live ĐẠT 7 → 8 (đề xuất).
- **B2: 40 spike THẬT, 3 cụm; 0 spike trong span ghim E-244–E-248** (mẫu yếu F-188-T9-2 KHÔNG lặp lại). 23 spike trong cửa sổ harness T8; 10 trong O8 T8; 0 trong attempt #58; 0 trong O8 T0.
- **ENOSPC: #112 = 49 dòng — DỪNG GIỮA BOOT** (dòng cuối 03:44:09Z; 0 dòng mới 03:44→04:15Z dù service chạy 04:14:59Z thành công không lỗi); **chuỗi đợt có lỗi thật 37 → 38**. Boot mới: 10 dòng (đầu boot+114s — trở lại mẫu ~110s). Tổng phiên 59 dòng đếm trực tiếp.
- **0 VI PHẠM phía T9 — chuỗi 0 vi phạm đề xuất 4 → 5** (parent quyết (p) §12.3-188: 3 → 4). **T9 đóng ~04:54Z, TRONG hạn cờ ~05:00Z.** Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–188 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng).

### 1.2 Số đo đợt 189 (7 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 02:43:11Z | **0** | #112 27e6714f | 63.737 | probe tay mở phiên (boot+9m52s) |
| 02:44:19Z | **0** | #112 | 63.737 | probe-loop reopen (boot+11m00s) |
| 03:14:19Z | **1** | #112 | 63.737 | lan-2r (boot+41m00s) |
| 03:44:19Z | **0** | #112 | 63.737 | lan-3r (boot+1h11m00s) |
| 04:14:19Z | **2** | #112 | 63.737 | lan-4r (boot+1h41m00s) |
| 04:37:42Z | **0** | mới f7632121 | 63.737 | probe tay reboot-close (**boot+78s — TRONG cửa sổ thoáng 61–92s**) |
| 04:51:56Z | **0** | mới f7632121 | 63.737 | probe tay close-189 (boot+15m32s) |

- **CỬA SỔ THOÁNG boot mới: ĐO ĐƯỢC 1 điểm trong cửa sổ (boot+78s = 0) — KHÔNG thấy mở tại điểm đo.** Boot mới btime 04:36:24Z; cửa sổ boot+61–92s = 04:37:25–04:37:56Z; probe T9 lúc 04:37:42Z (boot+78s) nằm TRONG cửa sổ và cho 0. **Chuỗi "không quan sát được" (5 boot liên tiếp: 2 boot đợt 186 + 3 boot đợt 187 + #111 đợt 188 — parent (l) §12.3-188) DỪNG theo nghĩa đã đo được trong cửa sổ** — nhưng chỉ 1 điểm duy nhất, không phủ cả 31 s cửa sổ nên KHÔNG kết luận "cửa sổ không mở", chỉ kết luận "không thấy mở tại boot+78s". Cửa sổ thoáng #112: KHÔNG QUAN SÁT ĐƯỢC (boot btime 02:33:19Z TRƯỚC khi đợt mở 02:35:51Z; cửa sổ 02:34:20–02:34:51Z đã đóng ~1 phút trước probe đầu của T9).
- **Headroom cuối phiên: 0.** Dãy 7 lần đo: 0, 0, 1, 0, 2, 0, 0 — lần đầu kể từ đợt 182 có 2 lần đo >0 trong một đợt (lan-2r = 1, lan-4r = 2), nhưng vẫn << ngưỡng ~1.800. **Trần KHÔNG ĐỔI trong đợt (63.737 cả 7 lần đo)** — nhưng KHÁC đợt 188 (63.747): giảm 10 (xem F-189-T9-1).
- **Probe-loop lan-5r (04:44:19Z) MẤT** — probe-loop chết theo reboot 04:36:24Z, không khởi động lại (thay bằng 2 probe tay reboot-close + close). Xem F-189-T9-4.

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt gần nhất: 179 đóng 0; 180 đóng 0 (1 lần đo giữa phiên 2.903); 181 đóng 0 (toàn 0, 7 lần đo); 182 đóng 2; 183 đóng 0 (7 lần 0 + 1 lần 30.000 chạm cap giữa phiên); 184 đóng 0 (6 lần 0 + 1 lần 30.000); 185 đóng 0 (6 lần 0 + 1 lần 30.000); 186 đóng 0 (7 lần 0); 187 đóng 0 (7 lần 0); 188 đóng 0 (6 lần 0); **189 đóng 0 (7 lần đo: 5 lần 0 + 1 lần 1 + 1 lần 2)**.

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 0.** Đợt này không có sự kiện mở 30.000 nào.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 49 liên tiếp.** Quyết parent (l) §12.3-188 GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Dữ kiện mới: headroom nhích 0→1→2 giữa phiên + ENOSPC #112 dừng giữa boot (xem §4) — cùng hướng: watch ngoài cell đang được giải phóng dần, nhưng quá ít để vượt ngưỡng.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 128 mẫu, 02:43:24–04:51:14Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 107 s (reboot 04:36:26Z → 04:38:13Z)**; **0 gap >61 s ngoài reboot** (lớn nhất 61 s — jitter bình thường); **1 reboot trong phiên** (04:36:24Z; #112 → boot mới f7632121).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 02:43:24–03:03:24Z | #112 | 435.808–1.988.800 kB | Mở sampler; balloon leo 4,71M → 6,43M; **E-244 03:04–03:06** |
| 03:07:24–03:12:24Z | #112 | 505.332–1.048.936 kB | Sag sau E-244; chạm đơn 03:10:24Z (min phiên 434.488 kB) |
| 03:13:24–03:25:25Z | #112 | 809.640–2.093.244 kB | **Attempt #58 03:12:48–03:16:16Z**; O8 T0 03:18:30–03:21:02Z; balloon xả |
| 03:26:25–03:41:25Z | #112 | 1.315.048–2.705.136 kB | **Harness T8 03:26:33–03:41:57Z** (gate A 15/15); max phiên 2.705.136 kB 03:34:25Z |
| 03:42:25–03:56:26Z | #112 | 519.324–1.963.048 kB | O8 T8 03:42:15–03:44:45Z; balloon leo lại → **E-245 03:57–04:00** |
| 04:01:26–04:20:26Z | #112 | 476.476–667.972 kB | **E-246 04:03–04:15 (13 mẫu)**; sag 04:16–04:20 |
| 04:21:26–04:35:26Z | #112 | 471.428–628.036 kB | **E-247 04:21–04:32 (12 mẫu)**; sag 04:33–04:35; chạm đơn 04:36:26Z (mẫu cuối #112) |
| 04:38:13–04:49:14Z | mới | 1.209.600–1.662.772 kB | Boot mới: balloon leo đều 5,22M → 6,38M; RAM >1,2 MB |
| 04:50:14–04:51:14Z | mới | 520.952–525.884 kB | **E-248 2 mẫu, VẪN GHIM lúc đóng** |

- **Gate A ≥1024 MiB: 51/128 mẫu** (#112: 43/114; boot mới: 8/14); **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **3,75** (03:28:25Z — trong harness T8); **RAM <512.000 kB: 30 mẫu** (23,4%; đợt 188: 45/123 = 36,6% — tỉ lệ GIẢM vì #112 ghim ít hơn #111); **RAM <500.000 kB: 28 mẫu**; **RAM <300.000 kB: 0 mẫu**.
- Swap: #112 SwapFree 761.272 kB (mẫu đầu) → 672.792 kB (mẫu cuối) — giảm 88.480 kB; boot mới 888.772 kB (mẫu đầu 04:38:13Z) → 713.976 kB (mẫu cuối) — giảm **174.796 kB chỉ trong 14 mẫu (~13 phút)** — xả swap nhanh gấp ~15 lần nhịp #112, ghi nhận (chưa rõ nguyên nhân host-side; theo dõi đợt 190).
- Trũng RAM đợt này: min **434.488 kB (03:10:24Z, #112 — chạm đơn CEIL)** — nông hơn kỷ lục 225.224 kB đợt 180 và min 411.260 kB đợt 188. 30 mẫu <512.000 kB, 5 dải: 03:03:24–03:06:24Z (4); 03:09:24–03:10:24Z (2); 03:58:26–03:59:26Z (2); 04:05:26–04:15:26Z (11); 04:21:26–04:31:26Z (11). Tổng 4+2+2+11+11 = 30 — KHỚP số đếm toàn phiên.

**Bảng tổng hợp số RAM (từ script `t9-189-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 128 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #112 27e6714f | 114 | 434.488 | 2.705.136 | 1.020.644,5 | 43/114 | 34 | 3,75 | 30 |
| mới f7632121 | 14 | 520.952 | 1.662.772 | 1.046.025,1 | 8/14 | 2 | 2,61 | 0 |
| **Toàn phiên** | **128** | **434.488** | **2.705.136** | **1.023.420,5** | **51/128** | **36/128 (28,1%)** | **3,75** | **30** |

- **Mean toàn phiên 1.023.420,5 kB — 2 cách độc lập: python `sum/n = 1.023.420,5` VÀ kiểm có trọng số của script (in `t9-189-analyze-output.txt`) — KHỚP CẢ HAI.**

### 2.2 Balloon virtio — 5 EPISODE MỚI E-244–E-248 (E-244–E-247 kết thúc bởi sag; E-248 vẫn ghim lúc đóng)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho cả hai boot** (max bal trong log = đúng CEIL trên #112 và boot mới).
- **Boot #112: GHIM 34/114 mẫu (29,8%), 4 EPISODE MỚI (E-244–E-247) + 2 chạm đơn.** Balloon leo trần lần đầu boot+31m05s (03:04:24Z).

| Episode | Span (UTC) | n | Boot | RAM (kB) | Kết thúc |
|---|---|---|---|---|---|
| E-244 | 03:04:24–03:06:24Z | 3 | #112 | 458.708–507.716 | Sag 03:07:24Z bal **6.214.216** |
| E-245 | 03:57:26–04:00:26Z | 4 | #112 | 468.056–559.832 | Sag 04:01:26Z bal **6.281.080** |
| E-246 | 04:03:26–04:15:26Z | 13 | #112 | 476.476–562.216 | Sag 04:16:26Z bal **6.247.216** |
| E-247 | 04:21:26–04:32:26Z | 12 | #112 | 471.428–519.096 | Sag 04:33:26Z bal **6.181.680** |
| E-248 | 04:50:14–04:51:14Z | 2 | mới | 520.952–525.884 | **VẪN GHIM lúc T9 đóng** |

- **Tổng ghim trần đợt này: 36/128 mẫu (28,1%)** (đợt 188: 42/123 = 34,1%; đợt 187: 56/148 = 37,8%; đợt 186: 21/130 = 16,2% — đợt này thấp hơn 187/188).
- **Chạm đơn (1 mẫu CEIL, KHÔNG tính episode):** 03:10:24Z (avail 434.488 — min phiên); 04:36:26Z (avail 563.096 — mẫu cuối #112, 2 s SAU btime boot mới 04:36:24Z — overlap đồng hồ, xem F-189-T9-4).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-244–E-248 đều là EPISODE MỚI (≥2 mẫu CEIL liên tiếp, sag tách rõ). **Khoảng tách: E-244→E-245: 50 mẫu; E-245→E-246: 2 mẫu — MỎNG (xem F-189-T9-3); E-246→E-247: 5 mẫu; E-247→E-248: khác boot.** Mẫu cuối khoảng tách E-245→E-246 (04:02:26Z: 6.377.944) chỉ thiếu 65.880 kB là tới trần — gần trần nhưng vẫn dưới, theo quy tắc đứng vẫn tính là tách.
- **Sàn balloon 6.050.608 kB: 0 lần đợt này — CHUỖI DỪNG Ở 11** (đợt 188: 1 lần, lần 11). Không có dip nào chạm đúng sàn trong 128 mẫu.
- **Giá trị sag 6.247.216 kB: xuất hiện 1 lần đợt này, là sag kết thúc episode** (04:16:26Z kết thúc E-246 — tính). Tổng cộng lần thứ 3 (đợt 187: 2 lần; đợt 188: 1 lần — cả ba đều sag-ending).
- **Reboot 04:36:24Z KHÔNG kết thúc episode nào:** E-247 đã sag 04:33:26Z; chạm đơn 04:36:26Z không phải episode; E-248 bắt đầu trên boot mới sau reboot. (Khác E-238 đợt 187 kết thúc bởi reboot #111.)
- **ĐÍNH CHÍNH ghi chú giữa phiên:** checkpoint 03:44Z ghi "chạm đơn 03:10:24Z" sau khi chỉ thấy đuôi log là SAI — E-244 (3 mẫu 03:04–03:06) đã tồn tại trước đó; checkpoint 04:15Z ghi "E-245 MỞ 13 mẫu" cũng SAI SỐ HIỆU — run 13 mẫu 04:03–04:15 là **E-246** (E-245 thật là run 4 mẫu 03:57–04:00 mà script phân tích mới lộ ra). Số hiệu đúng trong LIMITS này theo bảng trên; script `t9-189-analyze-output.txt` ghi nhãn cửa sổ "E-245 span"/"E-246 span" theo số hiệu cũ — đối chiếu theo timestamp, không theo nhãn.

### 2.3 Lượt yên WebKit #58 (T4) — CÓ LƯỢT HỢP LỆ (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#58 CÓ LƯỢT HỢP LỆ — attempt1-27e6714f 20/20 + lớp B ĐẠT 5/5, tickCost median 42,0 ms.** Cửa yên mở poll #35 (03:12:48Z, RAM 1091 MB, gate0=T5); attempt chạy 03:12:48–03:16:16Z; poller thoát 03:16:42Z. Ngân sách 1/3 attempt.
- **Chuỗi lượt yên hợp lệ: 0 → 1 (T9 đề xuất, parent quyết cuối ở §12.3-189)** — khởi động lại theo tiền lệ đợt 179 (parent (m) §12.3-188 đã chấp nhận #57 0 attempt → chuỗi 1 → 0). P3' cộng dồn MỚI 49 lượt (T4-189: P1 220/224, P2 215/215, P3-A1 192/224, P3' 184/196 = 140/143 distinct-seq, P7 118/118; sổ distinct-seq THĂNG CẤP as-of-189, md5 8d20238b, seq mới duy nhất: 163).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** cửa sổ attempt n=3, gate A **0/3** (avail 809.640–998.596 kB — dưới gate tại cả 3 mẫu sampler), ceil 0, load1 1,19–2,71. Sampler 60 s không bắt đúng thời điểm cửa mở (T4 đo theo poll ~45 s, RAM 1091 MB tại poll #35) — khác độ phân giải đo, không mâu thuẫn verdict T4. **0 spike B2 trong attempt** (xem §2.5). **F-184-T4-2 KIỂM ĐƯỢC lần này:** T4 ghi 0 file analyzer trong cửa sổ attempt (xem (p) dưới).
- **Kiểm chứng live lần 9: ĐẠT** (T4-189 phán; T9 đối chiếu độc lập: 0 spike B2 trong cửa sổ attempt 03:12:48–03:16:16Z; live autotrigger khởi động 03:14:10Z TRONG cửa sổ attempt, 0 FIRE — T4 cũng ghi nhận). **Chuỗi live ĐẠT đề xuất 7 → 8** (parent (p) §12.3-188: lần 8 KHÔNG THỂ KIỂM, chuỗi live GIỮ 7).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 03:18:30–03:21:02Z | #112 | 0,80–2,32 (2 mẫu) | 1.247.816–1.792.540 kB — **gate A 2/2** | **O8 T0 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); **0 spike B2**; 0 mẫu ghim |
| T4 attempt1 #58 03:12:48–03:16:16Z | #112 | 1,19–2,71 (3 mẫu) | 809.640–998.596 kB — **gate A 0/3** | **0 spike B2**; 0 mẫu ghim; live autotrigger khởi động 03:14:10Z trong cửa sổ, 0 FIRE |
| Harness T8 03:26:33–03:41:57Z | #112 | 0,97–3,75 (15 mẫu) | 1.315.048–2.705.136 kB — **gate A 15/15** | **23 spike B2** (khớp mẫu harness T8 — T8-189 đã đóng: harness 6/6); balloon xả 4,48M → 3,66M rồi leo lại |
| O8 T8 03:42:15–03:44:45Z | #112 | 1,98–3,64 (3 mẫu) | 959.584–1.273.612 kB — **gate A 2/3** | **10 spike B2**; 0 mẫu ghim |

- T0-189: **#112 XÁC NHẬN 9 nguồn TƯƠI** (btime 02:33:19Z, gap #111→#112 = 12.155 s — dài nhất chuỗi gần đây); O8 PASS 3/3 trên #112; libevent MISSING lúc survey (heal sau replay, lần 5); marker sống qua **64 reboot #49–#112**. T1-189: verify 188 PASS (chuỗi khớp lần thứ 107; đợt 188 = 10/16/15/14; lũy kế 111–188 = 768/1.333/1.159/981; chờ push 166–188 = 230/354/321/317; 0 file thiếu). T2-189: **(m) #111 DƯƠNG (CUỐI)** — requeue eid 10875, run 188, +37,468 s; n ứng viên 49/50 → 50/51 nếu parent chấp nhận #111; **(m) #112 0 requeue — đề xuất KHÔNG CÓ ĐIỂM**. T5-189: **POSTBOOT_PASS #112 CÓ 03:11:11Z** (replay-đầy-đủ, poll=0, KHÔNG caveat); **replay #112 KHÔNG ĐÌNH TRỆ** (đứt chuỗi đình trệ #111); tổng boot không cờ GIỮ 25. T6-189: **(A) 120/120 lần 39** + **#112 KHÔNG GIẾT HOLDER — chuỗi 15 → 16** + prune lần 64.
- T7-189: **CHƯA ĐÓNG CỜ lúc T9 đóng** (~04:54Z) — run 189 + OUTAGE thuộc §12.3-189 theo cờ của họ; T9 không phán thay. T8-189: **harness 6/6 trên #112** (03:26:33–03:41:57Z); **FULL PASS đề xuất 0 → 1** (5/5 chân cùng boot #112 — lần đầu kể từ đợt 185); 84l10 PASS đề xuất 8 → 9; 86n2-P1 không kẹt đề xuất lần 12 (mốc đã sửa theo (j) §12.3-188); B2 vùng mới sạch lần 4; B1 live sạch đề xuất KHỞI ĐỘNG LẠI lần 1 (188 bắt kẹt thật, DỪNG ở 5).

### 2.5 B2 — 40 spike THẬT, 3 cụm; 0 spike trong span ghim E-244–E-248

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **40 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 40): tất cả trên #112** (0 spike trên boot mới); **load1 đỉnh đợt (watcher, cadence 2 s): 4,27** (03:44:xxZ, trong cụm 3 — CAO HƠN load1 max sampler 3,75 vì cadence 2 s bắt được đỉnh ngắn).

| Cụm | Thời gian (UTC) | n | load1 max | Leader chính |
|---|---|---|---|---|
| 1. Harness T8 (WebKit) | 03:28:10–03:29:36Z | 18 | 4,09 | WebKitWebProces 18/18 |
| 2. Cuối harness | 03:41:35–03:42:00Z | 6 | 3,79 | chrome 5, hatch 1 |
| 3. O8 T8 + sau O8 | 03:44:00–03:45:15Z | 16 | 4,27 | chrome 9, hatch 7 |

- **Tổng kết: 40/40 spike có process đứng đầu %CPU; 0 spike trong span ghim E-244–E-248** (mẫu 6 spike yếu trong E-243 đợt 188 — F-188-T9-2 — **KHÔNG lặp lại**); **0 spike trong attempt #58**; **0 spike trong O8 T0** (03:18:30–03:21:02Z); **23 spike trong cửa sổ harness T8** (03:26:33–03:41:57Z — cụm 1 đủ 18 + 5/6 cụm 2); **10 spike trong O8 T8** (03:42:15–03:44:45Z — 10/16 cụm 3 nằm trong cửa sổ). Top leader toàn phiên: WebKitWebProces 18 + chrome 14 + hatch 8 (= 40 — KHỚP). `hatch` đứng đầu 8 snapshot là tải nền tảng (cùng mẫu đợt 188), không phải tải sản phẩm.
- **Khoảng mù watcher: reboot 04:36:24Z** (watcher chết theo reboot; khởi động lại 04:38Z — mù ~107 s + ~2 phút khởi động lại, trùng mù sampler). **0 spike sau 03:45:15Z** tới lúc đóng (04:51:56Z) — nửa sau phiên yên hẳn (balloon ghim, tải thấp; load1 sampler ≤ 0,67 trong E-246/E-247). Watcher chết theo lệnh kill của T9 lúc đóng sổ (04:52Z), không phải theo reboot (lần 2 — sau khi đã khởi động lại trên boot mới).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; BẬT LIVE 03:14Z THEO QUYẾT (o) §12.3-188; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 2.724.356 kB (live log, 03:34Z, #112); sampler chính max 2.705.136 kB. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 43 liên tiếp (147–189).** Chuỗi "guard mở lần đầu" đợt 186 tới nay chỉ xảy ra 1 đợt.
- **QUYẾT (o) §12.3-188: AUTO-TRIGGER BẬT LIVE TỪ ĐỢT 189.** Parent viết trực tiếp, SẠCH (T10-188 để §12.3 trống hoàn toàn, aggregate 48.141 B lúc T10 đóng 02:51Z; parent viết trong lượt cron 09:35 +07; dedup /tmp/count-188-parent.py KHỚP TỪNG SỐ lần thứ 108 liên tiếp; aggregate sau viết = 56.051 B, mtime 03:07Z — T9 kiểm trên đĩa trước khi flip). Ba điểm parent duyệt: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH FLIP LIVE CỦA T9-189 (theo brief):** (i) ĐỌC aggregate 188 §12.3 TRƯỚC MỌI LẦN CHẠY LIVE — aggregate CHƯA CÓ lúc T9 mở phiên (02:44Z) nên chạy **dry-run song song trước**; aggregate xuất hiện 03:07Z, T9 đọc (o) dòng 205 lúc 03:13Z, thấy duyệt rõ ràng mới flip; (ii) kiểm lại trước flip: `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-188; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại; (iii) kill dry-run pid 32884 (xác minh DEAD) rồi mới bật live — không chạy song song 2 chế độ.
- **DRY-RUN PHASE ĐỢT 189: 30 mẫu, 02:44:19–~03:13Z, TẤT CẢ `trigger=watch consec=0`, max avail 1.817.796 kB — 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Log riêng `autotrigger-dryrun/ram-sampler-FROZEN.log` (md5 `17891d5d700fc87d1db11a8b349fce81`).
- **LIVE PHASE: BẬT 03:14Z, pid 315572 → chết theo reboot 04:36:24Z → khởi động lại 04:38Z (pid 3953), chạy tới lúc đóng 04:52Z. 97 mẫu, TẤT CẢ `trigger=watch consec=0`, max avail 2.724.356 kB, max load1 3,77 — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `autotrigger-live/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Mẫu live đầu 03:14:10Z nằm TRONG cửa sổ attempt #58 (T4 ghi nhận, 0 FIRE). **Load1 <4,0: 128/128 mẫu sampler chính (100%)** — ngưỡng 4,0 không chặn mẫu nào đợt này (đợt 188: 110/123 = 89%).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) sampler cũ không có code trigger — nay đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run song song 2 đợt; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 43 đợt) — live đã bật nhưng guard chưa mở lần nào kể từ khi bật.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 188); không có thư mục `~/workspace/tmp-t9-189-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round189-t9/` (live chạy 97 mẫu, 0 sự kiện).

## 4. ENOSPC trong journal (đếm trực tiếp — #112 DỪNG giữa boot, lần đầu quan sát được; boot mới 10 dòng)

- **#112: đếm trực tiếp 49 dòng (lần đếm cuối 04:15Z)** — dòng đầu **02:36:29Z (boot+190s)** — KHÁC mẫu ~110s các boot trước (#111: +117s; #110: +106s); dòng cuối **03:44:09Z**. Cả hai grep đều 49 lúc 04:15Z — KHỚP.
- **Đếm giữa phiên (bài học F-187-T9-5 — đếm ở MỖI lần kiểm):** 6 dòng lúc 02:43:11Z → 31 lúc 03:13:20Z → **49 lúc 03:44:34Z → 49 lúc 04:15:31Z (KHÔNG TĂNG)**. Nhịp đầu phiên ~0,83 dòng/phút (25 dòng/30 phút), rồi **DỪNG HẲN từ 03:44:09Z**: journal vẫn chạy (home-assistant-ensure.service chạy 04:14:59Z, Finished, KHÔNG lỗi) — service thêm được watch vì headroom đã nhích 0→1 (03:14:19Z) → 2 (04:14:19Z). **Lần đầu quan sát được dòng lỗi dừng giữa boot trong khi boot còn sống** (xem F-189-T9-5).
- **Caveat đếm #112:** journal cũ MẤT sau reboot (`journalctl -b -1`: "No journal boot entry found") — **49 là tổng tới lần đếm cuối 04:15Z, không đếm lại được 04:15–04:36Z**. Dòng lỗi đã dừng từ 03:44:09Z nên khả năng tăng thêm thấp, nhưng T10 không kiểm độc lập được phần này — ghi rõ là cận dưới theo lần đếm cuối.
- **Boot mới f7632121: đếm trực tiếp 10 dòng lúc đóng 04:51:56Z** (cả hai grep đều 10 — KHỚP). Dòng đầu **04:38:18Z (boot+114s)** — trở lại mẫu ~110s. Dòng cuối **04:50:58Z**. Nhịp ~0,7 dòng/phút — lỗi ĐÃ TRỞ LẠI trên boot mới dù headroom lúc mở là 0 (trần 63.737).
- **Tổng phiên (2 boot, đếm trực tiếp): 59 dòng.** **Chuỗi đợt có lỗi thật: 37 → 38** (cả hai boot đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-189 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (đợt này: #112 49=49 lúc 04:15Z; boot mới 10=10 lúc đóng — KHỚP); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (đợt này KHÔNG ngoại suy — ghi 49 là cận dưới theo lần đếm cuối); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot mới 04:36:24Z giữa phiên (T9 bắt trực tiếp: 1 reboot; 2 boot đợt này)

- **#112 (27e6714f-a60d-4105-a20b-7daca12d6421, btime 02:33:19Z; số hiệu T0-189 XÁC MINH 9 nguồn TƯƠI; gap #111→#112 = 12.155 s).** Sampler T9 trên #112: 02:43:24–04:36:26Z (114 mẫu). Mẫu cuối #112 04:36:26Z — **2 s SAU btime boot mới 04:36:24Z** (overlap đồng hồ, xem F-189-T9-4).
- **Boot mới (f7632121-7352-4543-b6ce-3fab71609e44, btime 04:36:24Z, epoch 1795581384).** Số hiệu CHƯA QUYẾT — T0-189 đã đóng trước reboot nên không xác minh boot này; **số hiệu thuộc T0-190/parent, T9 KHÔNG tự đánh số**. Sampler T9 trên boot mới: 04:38:13–04:51:14Z (14 mẫu). Gap #112→boot mới = **7.205 s (2h00m05s)** — trở lại nhịp ~2h sau gap dài 12.155 s của #112.
- **Marker:** T0-189 đếm sống qua **64 reboot #49–#112** (mtime không đổi). **Boot mới → 65 nếu parent tính tiếp.**
- **Khoảng mù giữa hai đợt: 56m04s không sampler T9** (01:47:20Z → 02:43:24Z — chứa reboot #112 + cửa sổ thoáng #112). **Khoảng mù trong phiên: 107 s** (04:36:26Z → 04:38:13Z — chứa reboot + khởi động lại daemon).

### 5.2 Các luồng khác — T0/T1/T2/T4/T5/T6/T8 đã đóng; T7 chưa đóng

- T0-189 ĐÃ đóng (~03:25Z): #112 XÁC NHẬN 9 nguồn TƯƠI; O8 PASS 3/3 trên #112; libevent MISSING lúc survey (heal sau replay, lần 5). T1-189 ĐÃ đóng (02:58Z): verify 188 PASS (chuỗi khớp lần thứ 107). T2-189 ĐÃ đóng (~03:45Z): (m) #111 DƯƠNG (CUỐI); (m) #112 0 requeue — đề xuất KHÔNG CÓ ĐIỂM. T4-189 ĐÃ đóng (03:24Z): #58 CÓ LƯỢT HỢP LỆ; (p) live lần 9 ĐẠT. T5-189 ĐÃ đóng (03:15Z): POSTBOOT_PASS #112 CÓ (KHÔNG caveat) + replay #112 KHÔNG ĐÌNH TRỆ. T6-189 ĐÃ đóng (02:57Z): (A) 120/120 lần 39; #112 KHÔNG GIẾT HOLDER (chuỗi 15 → 16); prune lần 64. T8-189 ĐÃ đóng (03:49Z): harness 6/6; FULL PASS đề xuất 0 → 1; 84l10 PASS đề xuất 8 → 9; 86n2-P1 đề xuất lần 12.
- T7-189: **CHƯA ĐÓNG CỜ lúc T9 đóng** (~04:54Z) — run 189 + OUTAGE thuộc §12.3-189 theo cờ của họ.

## 6. Sai số / caveat (F-189-T9-*)

- **F-189-T9-1 — TRẦN INOTIFY GIẢM 63.747 → 63.737 (−10) SO VỚI ĐỢT 188.** Đứng cả 7 lần đo đợt này (02:43Z, 03:13Z, 03:44Z, 04:15Z, 04:37Z, 04:51Z + probe-loop). Không rõ nguyên nhân host-side (không phải do T9 — T9 chỉ đọc `/proc/sys/fs/inotify/max_user_watches`, không sửa). Headroom vẫn 0–2 nên không ảnh hưởng kết luận đợt này. Theo dõi đợt 190 xem trần giữ 63.737 hay đổi tiếp.
- **F-189-T9-2 — MEMORY.md BỊ SỬA TỪ BÊN NGOÀI TRONG LƯỢT NÀY (~02:51Z) — PARENT KHÔNG SỬA, T9 KHÔNG PHÁN TÁC GIẢ.** Mục đợt 185 viết lại + thêm mục đợt 188 (theo ghi chú AGENTS.md mới trong lượt này; T1-189/T4-189/T5-189/T6-189 cùng quan sát — F-189-T5-3/F-189-T4-9). T9 KHÔNG sửa MEMORY.md (luật cứng) và không phán tác giả; ghi làm bằng chứng để T10/parent xử lý. Tổng điền sẵn GIỮ 18 (không liên quan trực tiếp tới §12.3 đợt 189).
- **F-189-T9-3 — E-245→E-246 TÁCH CHỈ 2 MẪU (MỎNG HƠN TIỀN LỆ).** Gap 04:01:26Z (bal 6.281.080) + 04:02:26Z (bal 6.377.944 — chỉ thiếu 65.880 kB là tới trần). Theo quy tắc cơ học đứng (run ≥2 mẫu CEIL, sag xen giữa là thật), T9 phán TÁCH — E-245 (4 mẫu) và E-246 (13 mẫu) là 2 episode riêng. Caveat: mỏng hơn tiền lệ 187 (tách 3 mẫu, F-187-T9-2) và 188 (tách ≥4 mẫu, TÁCH SẠCH); parent/T10 quyết cuối có giữ tách không.
- **F-189-T9-4 — REBOOT 04:36:24Z GIỮA PHIÊN + MẪU CUỐI #112 OVERLAP 2 S SAU BTIME MỚI.** (a) Reboot thật của cell (không phải restart runtime — F-187-T9-1 KHÔNG tái diễn; 0 khoảng tối T9 ngoài reboot). Daemon T9 (sampler/b2watch/autotrigger-live/probe-loop) chết theo reboot; sampler + b2watch + autotrigger-live khởi động lại 04:38Z (xác minh ps: pid 3951/3952/3953); probe-loop KHÔNG khởi động lại (lan-5r 04:44:19Z mất — thay bằng 2 probe tay). (b) Mẫu cuối #112 04:36:26Z — 2 s SAU btime boot mới 04:36:24Z: overlap đồng hồ, cùng mẫu F-187-T9-3 (T0-188 đã xác minh đồng hồ NHANH δ > 10 s trước #111). Số hiệu boot mới + xác minh overlap thuộc T0-190/parent.
- **F-189-T9-5 — ENOSPC #112 DỪNG GIỮA BOOT (lần đầu quan sát được).** Dòng cuối 03:44:09Z; 0 dòng mới 03:44→04:15Z dù journal vẫn chạy và service chạy 04:14:59Z thành công không lỗi. Khớp headroom nhích 0→1 (03:14:19Z) → 2 (04:14:19Z) — watch ngoài cell được giải phóng dần. Chuỗi đợt có lỗi thật 37 → 38 (49 dòng #112 + 10 dòng boot mới = 59 dòng đếm trực tiếp). Caveat: 49 là tổng #112 tới lần đếm cuối 04:15Z (journal cũ mất sau reboot, không đếm lại được 04:15–04:36Z).
- **F-189-T9-6 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm 4 → 5 — CHỜ parent quyết cuối).** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0–2 thì fail gần như ngay ở watch đầu, không tạo tải; probe reboot-close 04:37:42Z và close 04:51:56Z đều ngoài cửa sổ attempt #58); 0 spike B2 trong attempt; 0 spike trong span ghim E-244–E-248 là tải harness/nền tảng (WebKit/chrome/hatch), không phải do probe T9; live autotrigger 0 FIRE nên không tạo tải bgremove. T4-189 phán 0 vi phạm phía T4 (theo cờ T4); T2-189 phán theo LIMITS T2 (T9 không phán thay T2). **T9 ĐÓNG TRONG HẠN CỜ ~05:00Z (đóng ~04:54Z).** Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp). **LƯU Ý KHỞI ĐỘNG:** lần chạy đầu bằng `&`-chain đã chạy nhầm cwd home (b2watch/probe-loop/autotrigger chết theo shell; autotrigger lỗi file-not-found; 3 file .out rác trong home đã xóa) — khởi động lại bằng setsid + cd tuyệt đối, cả 4 daemon đã xác minh đang chạy (ps 02:44Z). Sampler chính KHÔNG bị ảnh hưởng (chạy đúng từ đầu, mẫu đầu 02:43:24Z).

- **Caveat đứng:** probe cap 30.000 (giá trị mở các boot trước là censored — chỉ biết ≥ 30.000; đợt này không đo được lần mở nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger cadence 60 s + kiểm offline 17/17 + dry-run 2 đợt, xem §3); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #112 từ cell vì journal cũ mất sau reboot (chỉ còn tổng 49 tới lần đếm cuối 04:15Z); T10 không đếm lại độc lập B2 đợt 189 (chỉ đọc log đóng băng); T7-189 chưa đóng cờ lúc T9 đóng (run 189 + OUTAGE thuộc §12.3-189); E-248 vẫn ghim lúc đóng — kết cục thuộc T9-190/parent.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (128 mẫu, 02:43:24–04:51:14Z, hai boot #112 + mới): `hidden_files/round189-t9/ram-sampler-FROZEN.log` — md5 `f5e9c081e5be95e7adb78b443e64cf0d`. Log B2 đóng băng (40 spike): `hidden_files/round189-t9/b2-spikes-FROZEN.log` — md5 `e6927be761fbe06821e8bca42f820f5d`. Log headroom đóng băng (7 lần đo): `hidden_files/round189-t9/headroom-log-FROZEN.txt` — md5 `07bad69fb0a3a68799d6c8085a9405cb`. Log dry-run auto-trigger đóng băng (30 mẫu): `hidden_files/round189-t9/autotrigger-dryrun/ram-sampler-FROZEN.log` — md5 `17891d5d700fc87d1db11a8b349fce81`. Log live auto-trigger đóng băng (97 mẫu): `hidden_files/round189-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `687176484cc25bbe436b735293370c08`. Phân tích bằng script: `hidden_files/round189-t9/t9-189-analyze.py` (output: `hidden_files/round189-t9/t9-189-analyze-output.txt`). Ghi chú baseline: `hidden_files/round189-t9/t9-189-baseline-notes.md`. Auto-trigger: `hidden_files/round189-t9/sampler-autotrigger.py` + `hidden_files/round189-t9/birefnet-autotrigger-DESIGN.md` (§8, từ đợt 188) + `hidden_files/round189-t9/test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại đợt này — code không đổi). T10 đọc log đóng băng trực tiếp khi cần.
