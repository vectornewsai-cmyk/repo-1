# LIMITS — Phase 9 đợt 177, T9: headroom + RAM + birefnet (0 thử lần 31; cửa sổ #91 KHÔNG quan sát được; E-195 kết thúc bởi sag; E-196–E-199 mới; ENOSPC 2 pha; reboot #91)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (12 lần đo: 11×0, 1×2; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 37 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG #91: KHÔNG QUAN SÁT ĐƯỢC — CHUỖI 5 LẦN LIÊN TIẾP (172–176) ĐỨT.** Probe lúc boot+~108s đọc 0, 0 (phát hiện reboot lúc boot+59s nhưng exec chẩn đoán trước khi probe tốn ~50s; theo mẫu cửa sổ thường rộng ~180s thì lúc boot+108s vẫn phải mở — đọc 0 gợi ý #91 KHÔNG CÓ cửa sổ hoặc cửa sổ rất ngắn; xem F-177-T9-1).
- **Balloon — E-195 KẾT THÚC BỞI SAG (11 mẫu, cận dưới); 4 EPISODE MỚI TRÊN #91: E-196 (1) + E-197 (4) + E-198 (36) + E-199 (2, ĐANG GHIM).** Tổng ghim **43/134 (32,1%)**. Phương án gộp ghi rõ nhưng KHÔNG dùng.
- **RAM: 134 mẫu, 08:40:54–10:54:32Z, HAI boot (#90: 28; #91: 106).** Max **2.628.608 kB (41,78% guard)** lúc 09:12:28Z; min **454.712 kB** lúc 08:49:54Z; mean **928.110,0 kB (python + awk + trọng số KHỚP)**. Gate A **42/134**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 31 liên tiếp**.
- **B2: 2 spike THẬT, 2/2 QUY ĐƯỢC DRIVER, 0 load1 dư.** Spike 1 (09:09:28Z, load1 3,52): find hole-recheck của T2 + hatch. Spike 2 (10:26:36Z, load1 3,16): Chromium O8 của T8 (delta 69 — max đợt). **0 spike trong cửa sổ attempt T4 và harness T8; 1 spike trong cửa sổ O8 T8.**
- **Lượt yên #46 (T4): CÓ LƯỢT HỢP LỆ — attempt1 20/20 + B 5/5, median 50,0 ms — CHUỖI 39 → 40.** Ngân sách 1/3. Sampler: gate A 3/4 trong cửa sổ attempt; **0 spike B2; 0 vi phạm luật script nặng**.
- **T8: harness 6/6 SẠCH trên #91, 0 kẹt**; kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 1 → 2; O8 T8 PASS 3/3 trên #91; **POSTBOOT_PASS #91 KHÔNG CÓ** — gate T8-check-only, cần parent/T10 xác nhận lại; 4 chân TÁCH BOOT — T8 KHÔNG đề xuất lên 27.
- **MỘT REBOOT GIỮA PHIÊN: #91 (8c0ec92d, btime ~09:07:40Z uptime-based — chờ T0-178 xác minh 9 nguồn; gap #90→#91 ~7.031 s).** Sampler + watcher B2 + probe-loop **CHẾT theo reboot**; T9 khởi động lại trong **~93 s gap mẫu** (sampler lại 09:09:28Z). **Mẫu cuối trên #90 lúc 09:07:55Z — OVERLAP BIỂU KIẾN +15 s so với btime ước lượng** (cùng họ F-175-T9-2 +16 s; mốc sleep chết lệch ~26 s — 3 mốc không khớp trọn vẹn, xem F-177-T9-2).
- **ENOSPC: đếm trực tiếp 72 dòng (27 trên #90 + 45 trên #91; ngoại suy ≈73) — đợt thứ 26 liên tiếp.** Trên #91: **2 PHA — chạy 30 dòng (09:09:40–09:43:00Z), IM LẶNG 42m50s, chạy lại 15 dòng (10:25:50–10:54:50Z)**; lan-3 đo headroom 2 trong lúc im lặng (xem §4, F-177-T9-5).
- **#90 XÁC NHẬN 9 nguồn (T0-177)**; #91 chờ T0-178. T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc T9 đóng (7/9 + T9 = 8/9) — T7 CHƯA đóng (kết cục run 176 thuộc T7-177/T10).
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp: script `round177-t9/k8-headroom.py` (copy y nguyên từ đợt 176, cap 30.000): mở một inotify fd, thêm watch từng file tạm tới khi `inotify_add_watch` trả errno 28 (ENOSPC); đếm = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 177 (12 lần đo, 2 boot, 0 lỗi)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 08:41:02Z | **0, 0** | #90 94247dfa | 63.747 | cặp mở; ENOSPC=77 (5 dòng từ lúc mở đợt) |
| 09:09:28Z | **0, 0** | #91 8c0ec92d | 63.747 | cặp mở-91 (boot+~108s); ENOSPC=0 trên #91 |
| 09:39:28Z | **0, 0** | #91 8c0ec92d | 63.747 | lan-2; ENOSPC=26 |
| 10:09:28Z | **2, 2** | #91 8c0ec92d | 63.747 | lan-3; ENOSPC=30 (ĐANG IM LẶNG); balloon ĐANG GHIM (E-198) |
| 10:39:29Z | **0, 0** | #91 8c0ec92d | 63.747 | lan-4; ENOSPC=39 (đã chạy lại); balloon ĐANG SAG |
| 10:55:04Z | **0, 0** | #91 8c0ec92d | 63.747 | cặp đóng; ENOSPC=45; balloon ĐANG GHIM (E-199) |

- Probe dừng ở `i=0` trong 10/12 lần đo; `i=2` trong 2/12 lần đo (cặp lan-3). File tạm dọn sạch sau mỗi lần đo (0 thư mục sót).
- **CỬA SỔ THOÁNG #91: KHÔNG QUAN SÁT ĐƯỢC — CHUỖI 5 LẦN LIÊN TIẾP (172–176) ĐỨT.** Reboot #91 btime ~09:07:40Z (uptime-based, chờ T0-178 xác minh). T9 phát hiện reboot lúc 09:08:39Z (boot+59s) nhưng exec chẩn đoán chạy TRƯỚC khi probe tốn ~50s; probe lúc 09:09:28Z (boot+108s) đọc 0, 0. Theo mẫu các đợt 163–166, 172–176, cửa sổ thường mở tại boot+53–87s và đóng tại boot+181–245s (rộng ~180s) — lúc boot+108s vẫn phải mở nếu cửa sổ tồn tại. Đọc 0 gợi ý #91 KHÔNG CÓ cửa sổ hoặc cửa sổ rất ngắn (xem F-177-T9-1).
- **Cửa sổ #90: KHÔNG QUAN SÁT ĐƯỢC** (cùng mẫu cấu trúc đợt 175/#86, 176/#89). Reboot #90 btime 07:10:29Z (T0-176 xác minh 9 nguồn); đợt mở 08:35:51Z = boot+1h25m; probe mở 08:41:02Z (boot+1h30m) đã 0, 0. ENOSPC trên #90 đã có 72 dòng lúc mở đợt.
- **Headroom cuối phiên: 0 (cặp đóng 10:55:04Z, chênh 0).** Trên #90: 0 suốt phiên. Trên #91: 0 ở mọi lần đo trừ lan-3 (2, 2 lúc 10:09:28Z — lần duy nhất trong đợt headroom ≠ 0; xem §4). Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 0 = **63.747 watch** trên #91 (toàn bộ trần đã giữ). Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** — một vite mới không khởi động được (như mọi đợt từ 152). So với đợt 176 (mở 0 → thoáng 30.001/30.001 boot+53s → 0 boot+243s → đóng 0; 14 lần đo): đợt này mở 0 → KHÔNG thoáng → lan-3 2 → đóng 0 (12 lần đo: 11×0, 1×2). T5-177 KHÔNG probe lại headroom (như đợt 151–176); số T9 đứng trên 12 lần đo hợp lệ + phương pháp không đổi từ đợt 109. **Trần KHÔNG ĐỔI trong boot** (63.747 trên #90 và #91 suốt 12 lần đo). Probe-loop gốc **CHẾT theo reboot #91** (trước lan-2 ~09:39:28Z); T9 viết lại `probe-loop-91.sh` chạy lan-91-2 đúng lịch 30 phút; lan-91-5 (~11:09Z) không chạy vì đợt đóng trước — đóng bằng probe tay. Cùng mẫu đợt 173/174/175/176.

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt (trần 63.747; chi tiết xem LIMITS T9 các đợt 129–176 §1.3): **… → 0 → 2 → 0 → 2 → 2 → 0 → 2 → 0 → 2 → 2 → 0 → 0**. Gần nhất: 172 đóng 2; 173 đóng 0; 174 đóng 2; 175 đóng 2; 176 đóng 0; **177 đóng 0 (KHÔNG thoáng; lan-3 2)**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 0.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 37 liên tiếp** (tính theo giá trị ổn định lúc đóng). Quyết parent đợt 175 (l) GIỮ quyết (k) "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal đợt này có 72 dòng lỗi ENOSPC thật đếm trực tiếp (xem §4)** — đợt thứ 26 liên tiếp. T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 134 mẫu, 08:40:54–10:54:32Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB (mọi tỉ lệ guard dùng guard 6.291.456 kB = 6.144 MiB). Sampler mỗi 60 s một mẫu MemAvailable + Balloon + SwapFree + load1; **gap lớn nhất trong log đóng băng 61 s trong boot; gap 93 s qua reboot #91** (xem §5.1). **134 mẫu (#90: 28; #91: 106).**

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 08:40:54Z | #90 | 1.325.512 kB | Mở sampler: balloon 5.460.784 kB (84,7% trần) — ĐANG SAG (E-195 kết thúc); gate A MỞ |
| 08:49:54Z | #90 | 454.712 kB | **RAM min phiên** (bal 6.355.380 kB, 98,6% trần) — trong lúc sag E-195 hồi lên trần |
| 08:53:54–08:56:34Z | #90 | 1.060.540–1.476.280 kB | **T0 O8 PASS 3/3**; gate A 3/3; **0 spike B2**; 0 mẫu ghim |
| 08:56:40–09:00:35Z | #90 | 774.756–1.175.856 kB | **T4 attempt1 LƯỢT HỢP LỆ #46** (20/20 + B 5/5, median 50,0 ms); gate A 3/4; **0 spike B2**; 0 mẫu ghim |
| 09:00:54–09:07:55Z | #90 | 1.159.724–2.488.636 kB | Balloon hồi 5,36–5,68M (83–88% trần), CHƯA ghim lại; gate A 7/8; mẫu cuối 09:07:55Z **OVERLAP +15 s** |
| 09:09:28–09:12:28Z | #91 | 1.668.196–2.628.608 kB | **Boot #91 mới**; balloon RƠI 5.159.492 → 4.197.600 kB; **RAM max phiên 2.628.608 kB lúc 09:12:28Z**; gate A 4/4; **1 spike B2** |
| 09:13:28–09:29:29Z | #91 | 577.476–2.285.264 kB | Balloon leo gần đơn điệu tới trần; gate A 8/17; **0 spike B2**; 0 mẫu ghim |
| 09:30:29–09:37:29Z | #91 | 504.548–662.716 kB | **E-196 1 mẫu** (09:30:29Z) → sag 3 mẫu → **E-197 4 mẫu** (09:34:29–09:37:29Z); gate A ĐÓNG cả 8 mẫu |
| 09:38:29–09:47:29Z | #91 | 540.336–1.071.112 kB | Sag 10 mẫu (đáy 5.848.944 kB lúc 09:42:29Z), leo lại tới trần; gate A 1/10; **0 spike B2** |
| 09:48:29–10:23:30Z | #91 | 496.568–615.100 kB | **E-198 36 mẫu**; gate A ĐÓNG cả 36 mẫu; **0 spike B2**; RAM <512.000 kB: 10 mẫu |
| 10:24:30–10:52:32Z | #91 | 507.612–1.878.920 kB | Sag 29 mẫu sau E-198 (đáy 5.125.284 kB lúc 10:37:31Z, 79,5% trần); gate A 6/29; **1 spike B2** (10:26:36Z, Chromium O8 T8); ENOSPC chạy lại từ 10:25:50Z |
| 10:53:32–10:54:32Z | #91 | 508.464–520.452 kB | **E-199 2 mẫu, ĐANG GHIM**; gate A ĐÓNG cả 2; probe đóng 10:55:04Z vẫn CEIL |

- **Gate A ≥1024 MiB: 42/134 mẫu** (19/28 trên #90 + 23/106 trên #91 — KHỚP tổng; số giai đoạn từ script kiểm tra, không tính tay); **0 mẫu ≥ guard**; load1 max (sampler) **3,52** (watcher bắt 3,52 lúc 09:09:28Z — khớp, khác cadence); **RAM <512.000 kB: 13 mẫu** (9,7% — 1 trên #90 + 12 trên #91, tất cả trong lúc ghim/chạm trần, liệt kê từng mẫu bằng script — xem dưới); **RAM <300.000 kB: 0 mẫu** (đợt 176: 0; đợt 175: 1).
- Swap: SwapFree 634.972 kB (mẫu đầu #90) → 595.396 kB (mẫu cuối #90, 09:07:55Z) → **972.344 kB (mẫu đầu #91, 09:09:28Z — NHẢY +376.948 kB qua reboot #91)** → 606.752 kB (mẫu cuối, 10:54:32Z). Nhịp nhảy SwapFree qua reboot: #91 nhả ~376.948 kB (đợt 176: ~424.904 kB qua #90; đợt 175: ~280.484 kB qua #87).

- Mẫu 09:12:28Z (đỉnh phiên): RAM 2.628.608 kB, balloon 4.197.600 kB — đỉnh đơn lẻ 2 phút sau khi sampler chạy lại trên #91; mẫu trước 2.439.004 kB, mẫu sau 2.285.264 kB. (Đỉnh đợt 176: 3.052.340 kB — đỉnh đợt này thấp hơn 423.732 kB.)

- Trũng RAM đợt này: min 454.712 kB (đợt 176: 407.580 kB; đợt 175: 270.084 kB) — **trũng NÔNG hơn đợt 176 đúng 47.132 kB** (min cao hơn). 13 mẫu <512.000 kB trong 134 mẫu (9,7%); tất cả 13 mẫu đều lúc ghim/chạm trần (1 trên #90 lúc sag E-195 hồi, 12 trên #91 trong E-196/E-198/E-199).

**Bảng tổng hợp số RAM (từ script `t9-177-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 134 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #90 94247dfa | 28 | 454.712 | 2.488.636 | 1.207.502,1 | 19/28 | 0 | 2,71 | 1 |
| #91 8c0ec92d | 106 | 496.568 | 2.628.608 | 854.308,3 | 23/106 | 43 | 3,52 | 12 |
| **Toàn phiên** | **134** | **454.712** | **2.628.608** | **928.110,0** | **42/134** | **43/134 (32,1%)** | **3,52** | **13** |

- **Mean toàn phiên 928.110,0 kB — 3 cách độc lập: python `sum/n = 928.110,0` VÀ awk `sum/n = 928.110` VÀ trung bình có trọng số ((28×1.207.502,1 + 106×854.308,3)/134 = 928.109,99) — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai đợt 163) và **KHÔNG lặp F-172-T9-6** (số giai đoạn viết tay sai đợt 172 — mọi số bảng đợt này đều từ script analyze, không tính tay).
- 13 mẫu RAM <512.000 kB (từ script analyze trên log đóng băng — không tính tay): #90: 08:49:54Z (454.712). #91 (12): 09:30:29Z; 09:52:30–10:02:30Z (7 mẫu); 10:21:30–10:22:30Z (2); 10:52:32Z; 10:54:32Z — xem analyze-output để kiểm từng mẫu. Tổng 1 + 12 = 13 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-195 KẾT THÚC BỞI SAG (11 mẫu) + 4 EPISODE MỚI TRÊN #91 (E-196 1 + E-197 4 + E-198 36 + E-199 2)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **E-195 — KẾT CỤC: KẾT THÚC bởi sag sâu, 11 mẫu quan sát được (cận dưới).** E-195 ghim 07:34:21–07:44:21Z đợt 176 (11 mẫu, ĐANG GHIM lúc T9-176 đóng); khoảng mù giữa hai đợt 07:44:21Z→08:40:54Z (56m33s, không mẫu nào, KHÔNG reboot — vẫn #90). Balloon vẫn ở CEIL lúc T9 đọc tay 08:39:14Z (6.443.824 kB); **sag bắt đầu trong (08:39:14Z, 08:40:13Z]** (6.247.216 kB lúc 08:40:13Z — đúng giá trị sàn micro-dip E-194), rơi tiếp 5.460.784 kB lúc 08:40:54Z, đáy **5.180.948 kB lúc 09:04:54Z (80,4% trần)**, hồi lên 5.677.748 kB lúc 09:07:55Z (mẫu cuối trên #90) — **chưa ghim lại thì gặp reboot #91**. 11 là cận dưới (số mẫu cuối cùng không biết được vì khoảng mù — nhưng sag kết thúc nó ĐÃ quan sát được trong đợt 177, khác E-190 đợt 176 kết thúc theo reboot trong khoảng mù).
- **Boot #90: GHIM 0/28 mẫu (0%), 0 EPISODE MỚI.** Balloon trong đợt 177 trên #90 chỉ sag + hồi (5.180.948–6.355.380 kB), không chạm CEIL lần nào. E-195 là episode duy nhất liên quan #90 trong đợt này, và nó kết thúc bởi sag ngay đầu đợt.
- **Boot #91: GHIM 43/106 mẫu (40,6%), 4 EPISODE MỚI (E-196 + E-197 + E-198 + E-199).** Từ 09:09:28Z (5.159.492 kB, 80,1% trần) RƠI xuống 4.197.600 kB lúc 09:12:28Z rồi leo gần đơn điệu tới trần. **E-196 — 09:30:29Z, 1 mẫu** (RAM 504.548 kB) — chạm trần đơn lẻ, **KẾT THÚC bởi sag 3 mẫu 09:31:29–09:33:29Z** (6.247.216–6.406.396 kB, 96,9–99,4% trần — cùng họ micro-dip E-194). **E-197 — 09:34:29–09:37:29Z, 4 mẫu** (RAM 534.168–561.960 kB), **KẾT THÚC bởi sag 10 mẫu 09:38:29–09:47:29Z** (đáy 5.848.944 kB lúc 09:42:29Z, 90,8% trần — đúng giá trị sàn sag E-191). **E-198 — 09:48:29–10:23:30Z, 36 mẫu** (RAM 496.568–615.100 kB) — **episode DÀI NHẤT kể từ đợt 175**, **KẾT THÚC bởi sag 29 mẫu 10:24:30–10:52:32Z** (đáy 5.125.284 kB lúc 10:37:31Z, **79,5% trần — SAG SÂU NHẤT đợt**). **E-199 — 10:53:32–10:54:32Z, 2 mẫu** (RAM 508.464–520.452 kB), **ĐANG GHIM lúc T9 đóng** (mẫu cuối 10:54:32Z vẫn CEIL; probe đóng 10:55:04Z vẫn CEIL) — kết cục thuộc T9-178 (2 là cận dưới). **Tổng #91: 43 mẫu ghim / 4 chuỗi / 3 sag (3 + 10 + 29 mẫu).**
- **Tổng ghim trần đợt này: 43/134 mẫu (32,1%)** (đợt 176: 37/123 = 30,1%; đợt 175: 38/133 = 28,6%; đợt 174: 55/137 = 40,1%; các đợt 152–169: 21,8–52,0%). **4 episode mới trong đợt 177 (E-196: 1, KẾT THÚC bởi sag 3 mẫu; E-197: 4, KẾT THÚC bởi sag 10 mẫu; E-198: 36, KẾT THÚC bởi sag 29 mẫu; E-199: 2, ĐANG GHIM)** + E-195 KẾT THÚC 11 mẫu.
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-196–E-199 là 4 EPISODE MỚI (hai mẫu ghim liên tiếp cách nhau ≤61 s mới cùng chuỗi — script analyze dùng từ đợt 172; sag tách chuỗi; mẫu ghim đơn lẻ vẫn tính 1 chain kích thước 1). **Phương án thay thế (ghi rõ để T10/parent xét):** gộp E-196+E-197 qua sag 3 mẫu (96,9–99,4%) → 1 episode 5 mẫu; gộp E-196+E-197+E-198 qua 2 sag → 41 mẫu; gộp E-198+E-199 qua sag dài 29 mẫu → 38 mẫu; tổng ghim 43 không đổi; chỉ số episode đổi 4 → 3 / 2 / 3. Lưu ý: sag tách E-198/E-199 dài 29 mẫu và sâu (xuống 79,5%) — khác hẳn micro-dip 3 mẫu tách E-194/E-195 đợt 176, nên phương án gộp E-198+E-199 yếu hơn hẳn.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-199 chỉ ~508–520.000 kB trong khi tổng RAM − balloon = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #46 (T4) — CÓ LƯỢT HỢP LỆ, attempt1 20/20 + B 5/5, CHUỖI 39 → 40 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#46 CÓ LƯỢT HỢP LỆ — attempt1-94247dfa (20/20 pass, lớp B ĐẠT 5/5, tickCost median 50,0 ms ≤60) — CHUỖI LƯỢT YÊN HỢP LỆ 39 → 40.** Ngân sách dùng 1/3 (attempt1 chạy 08:56:40–09:00:35Z, poller thoát ngay sau đó — không cần attempt2). POSTBOOT_PASS #90 ĐÃ CÓ (T5-177, ~08:59Z — xem §5.2).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** attempt1 (08:56:40–09:00:35Z): gate A MỞ **3/4 mẫu** (RAM 774.756–1.175.856 kB — 1 mẫu dưới gate: 774.756 kB lúc 08:57:54Z); load1 **0,60–1,16**; balloon 79,0–84,8% trần, **0 mẫu ghim**. **0 spike B2 trong cửa sổ attempt** (như đợt 176). **0 vi phạm luật script nặng** (T4 đóng cờ 09:10Z — chuỗi vi phạm đứt từ đợt 176 giữ nguyên).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 08:53:54–08:56:34Z | #90 | 0,67–1,16 (3 mẫu) | 1.060.540–1.476.280 kB — **gate A 3/3** | **0 spike B2**; WebKit 21/21 ×2 + Chromium 21/21 (T0); 0 mẫu ghim |
| T4 attempt1 08:56:40–09:00:35Z | #90 | 0,60–1,16 (4 mẫu) | 774.756–1.175.856 kB — **gate A 3/4** | **LƯỢT HỢP LỆ #46 — 0 spike B2**; 0 mẫu ghim |
| T8 O8 10:24:32–10:27:26Z | #91 | 1,61–2,65 (2 mẫu) | 1.511.320–1.738.324 kB — **gate A 2/2** | **1 spike B2** (10:26:36Z, Chromium O8 T8, delta 69); O8 PASS 3/3; 0 mẫu ghim |
| T8 harness 10:28:52–10:45:08Z | #91 | 0,69–2,41 (16 mẫu) | 514.132–1.430.424 kB — **gate A 2/16** | **0 spike B2**; harness 6/6 PASS, 0 KẸT; **0 mẫu ghim** (khớp T8) |

- T1-177 KHÔNG chạy lại suite 28 mục (verify-only — LIMITS T1 ghi rõ) → không có cửa sổ T1 để đối chiếu đợt này (khác đợt 176 có suite 28/28).

### 2.5 B2 — 2 spike THẬT, 2/2 QUY ĐƯỢC DRIVER, 0 load1 dư (1 trên #90, 1 trên #91; 0 spike trong chuỗi ghim)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **2 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 2): 1 spike ngay khi watcher chạy lại trên #91 (09:09:28Z); 1 spike trong cửa sổ O8 T8 (10:26:36Z); 0 spike trong span ghim E-196/E-197/E-198/E-199; 0 spike trong cửa sổ attempt T4 và harness T8.**

| # | Thời điểm (UTC) | load1 | Driver (quy được) |
|---|---|---|---|
| 1 | 09:09:28Z | 3,52 | find hole-recheck của T2 (30,8% tích lũy, delta 22) + hatch daemon (27,9%, delta 3) — ngay khi watcher chạy lại trên #91 |
| 2 | 10:26:36Z | 3,16 | Chromium O8 của T8 (49,6% tích lũy, delta 69) + vite (30,2%) + esbuild (24,3%) + hatch (delta 13) — trong cửa sổ O8 T8 |

- **Tổng kết: 2/2 spike có driver process cụ thể + 0 spike lớp "load1 dư"** (đợt 176: 13/15 + 2 dư; đợt 175: 34/38 + 4 dư; đợt 174: 8/10 + 2 dư; đợt 173: 9/9 + 0 dư). **Delta tick lớn nhất đợt: 69 tick/s** (Chromium O8, spike 10:26:36Z; đợt 176: max 132). **Khoảng mù watcher đầu phiên: 0** (watcher khởi động 08:40:5xZ CÙNG lúc sampler; load1 sampler max 2,71 trên #90). **Khoảng mù qua reboot #91: 93 s** (watcher chết ~09:07:40Z, chạy lại 09:09:28Z — cùng gap sampler; load1 sampler trên #91 max 3,52 trong 12 mẫu đầu, watcher bắt được 1 spike ngay khi chạy lại). **0 gap phủ sóng watcher nào khác.** `grep -c 'WebKit\|MiniBrowser'` = **0 dòng** (đợt 176: 26). **T2 find trong spike 1** (hole-recheck); không T7 churn nào lọt top-5 delta đợt này.

## 3. Birefnet guard (cơ chế (a) — 0 lần thử, lần thứ 31)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round177-t9/sampler.sh` chạy liên tục 08:40:54Z–10:54:32Z (2 instance: instance 1 sống 08:40:54–09:07:55Z trên #90 rồi **CHẾT theo reboot #91**; instance 2 khởi động lại 09:09:28Z trên #91, sống tới khi T9 dừng tay ~10:55:0xZ — **1 gap qua reboot (93 s), 0 gap >90 s khác; max gap trong boot 61 s**), **134 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.628.608 kB = 41,78% guard** (đợt 176: 48,52%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **3.662.848 kB (58,22%)**. **Caveat (F-177-T9-4): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 177 — lần thứ 31 liên tiếp** (đợt 147–177: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 31 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round177-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `.venv/bin/python` (symlink), `bgremove.py` 23.500 B, `birefnet-general.onnx` 972.666.916 B, `u2net.onnx` 175.997.641 B, clip test 14.554 B (không đổi so với đợt 176); `~/workspace/tmp-t9-177-birefnet/` **trống**; T9 sẵn sàng kích hoạt khi guard mở.

## 4. ENOSPC trong journal (đếm trực tiếp 72 dòng — đợt thứ 26 liên tiếp)

- **#90:** đếm trực tiếp **27 dòng trong đợt** (tổng trên #90 lúc mở đợt ~= 72 — tính 3 cách khớp: 75−3 lúc 08:39:14Z, 76−4 lúc 08:40:13Z, 77−5 lúc 08:41:02Z; tổng 99 dòng lúc 09:06:41Z; 99−72 = 27). Đuôi #90 09:06:41Z→reboot (~09:07:40Z, ~1 phút): ngoại suy ≈ **+1 dòng** (theo nhịp ~0,88 dòng/phút). Tổng #90 trong đợt ngoại suy ≈ **28 dòng**. Nhịp trên #90 trong đợt ≈ **0,87 dòng/phút** (khớp đợt 176: 0,885).
- **#91:** **45 dòng** (đếm trực tiếp lúc đóng — toàn bộ từ lúc mở boot tới lúc đóng). Dòng đầu **09:09:40Z (boot+~120s)** — khớp #90 đợt 176 (boot+121s). **HAI PHA:** pha 1: **30 dòng 09:09:40–09:43:00Z** (~67 s/dòng); **IM LẶNG 42m50s (09:43:00–10:25:50Z)**; pha 2: **15 dòng 10:25:50–10:54:50Z** (~124 s/dòng — chậm hơn pha 1). **Im lặng là THẬT:** journal còn sống (service home-assistant-ensure vẫn chạy, log 10:09:40Z không kèm dòng lỗi); lan-3 đo headroom **2, 2 lúc 10:09:28Z** — trong lúc im lặng (xem F-177-T9-5).
- **Tổng đợt 177 đếm trực tiếp: 72 dòng** (27 #90 + 45 #91) — cận dưới; ngoại suy ≈ **73 dòng**. Thấp hơn đợt 176 (86 dòng) vì #90 chỉ đóng góp 27 dòng trong đợt và #91 im lặng 43 phút. Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut).
- **Caveat `journalctl --since`:** lệnh `--since "2026-11-23 08:35:51"` lúc đóng chỉ trả **45 dòng** (chỉ còn journal #91). **45 KHÔNG phải tổng đợt** (tổng đợt đếm trực tiếp 72 dòng). `journalctl --list-boots` lúc đóng chỉ còn idx 0 (#91) — journal #90 đã mất (cùng mẫu F-171-T10-4, F-176-T9-5).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #91 giữa phiên (T9 bắt trực tiếp, khởi động lại ~93 s gap mẫu) + #90 trước khi đợt mở

- **#91 (8c0ec92d, btime ~09:07:40Z uptime-based; gap #90→#91 ~7.031 s — số hiệu + btime chờ T0-178 xác minh 9 nguồn).** Btime từ uptime: 09:07:40,6Z (58,36 s lúc 09:08:39Z) và 09:07:40,2Z (107,78 s lúc 09:09:28Z); journal first entry #91 lúc 09:07:56Z (sau btime-uptime 16 s; trên #90 cùng chỉ số là 12 s — mẫu khớp). Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối 09:07:55Z — **OVERLAP BIỂU KIẾN +15 s**, xem F-177-T9-2). T9 khởi động lại cả ba trong **~93 s gap mẫu** (sampler lại 09:09:28Z = boot+~108s; probe-loop-91 viết mới, lan-91-2 đúng lịch; lan-91-5 ~11:09Z không chạy vì đợt đóng trước — đóng bằng probe tay). **Gap 93 s qua #91** (đợt 176: 57 s — dài hơn vì T9 chạy exec chẩn đoán trước khi probe; xem F-177-T9-1); max gap trong boot 61 s. Lệnh `sleep 1750` chờ lan-3 **bị SIGTERM lúc ~09:08:0xZ** theo reboot — chính cú SIGTERM này đánh thức T9 (phát hiện #91 lúc 09:08:39Z, boot+59s). Không mất số liệu ngoài 1 gap. Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#90 (94247dfa, btime 07:10:29Z; gap #89→#90 = 6.243 s):** TRƯỚC khi đợt mở 1h25m; **T0-177 XÁC MINH 9/9 nguồn** (khớp T7-176 xác minh 9 nguồn kiểu T0, phát hiện 07:11:06Z = btime +37 s; boot lúc T0 đóng vẫn 94247dfa, kiểm cuối 08:57:25Z). **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: 56m33s** (mẫu cuối đợt 176 07:44:21Z → mẫu đầu đợt 177 08:40:54Z) — chứa sag kết thúc E-195 (bắt đầu trong khoảng mù, quan sát được phần đuôi từ 08:39:14Z); E-195 phán kết thúc bởi sag qua khoảng mù (xem §2.2). Gap đợt mở → sampler chạy: 303 s. Marker: T0-176 đếm **41 reboot #49–#89**; **#90 XÁC MINH** → sống qua 42 reboot nếu tính #90; #91 chưa xác nhận (thuộc T0-178).

### 5.2 T5-177 — POSTBOOT_PASS #90 CÓ; POSTBOOT_PASS #91 KHÔNG CÓ

- **POSTBOOT_PASS #90 CÓ lúc ~08:59Z** (T5-177 đóng cờ #90 ~08:59Z — theo LIMITS T8-177; gate0wait T4 chỉ cho #90). T4 attempt1 dùng gate này, lượt yên #46 hợp lệ.
- **POSTBOOT_PASS #91 KHÔNG CÓ — T5-177 KHÔNG resume sau #91** (0 file mới từ 09:07Z, 76+ phút tới lúc T8 đóng; watcher-176 pid 7604 hạn 08:30:00Z đã hết trước khi #91 xảy ra). **T8 chạy O8 + harness trên #91 theo fallback T8-check-only** (selfcheck #2 trên #91: libs 6/6 + GST 1624 + dpkg 1.523, replay xong, 0 apt process) — **CẦN PARENT/T10 XÁC NHẬN LẠI; T8 KHÔNG tự chốt.** Hướng (3) VẪN ĐỨNG lần 24 — cờ #91 thiếu làm gate (a) cho đợt 177 không đầy đủ; parent/T10 quyết.

### 5.3 T8-177 — harness 6/6, O8 PASS 3/3, 4 chân TÁCH BOOT — KHÔNG đề xuất lên 27

- O8 PASS 3/3 trên #91 (10:24:32–10:27:26Z); 1 spike B2 (10:26:36Z, Chromium O8); sampler: gate A 2/2.
- Harness 6/6 (10:28:52–10:45:08Z): 84l10 PASS; 85m4 PASS (P4-lần3, chuỗi 6); 86n2 PASS — KHÔNG kẹt lại P1 (lần thứ 2 liên tiếp). Kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 1 → 2. Sampler: gate A 2/16; 0 spike B2; 0 mẫu ghim.
- (f') V1 live 0 kích hoạt; (1c') (c') diag-only; Q3 đúng thiết kế; H3 mở, giám sát thụ động; checklist (o) 21/21; F-177-T8-7 ((c')/(f') mù với 86n2 — T8 đề xuất phương án mở rộng, parent quyết sau).
- **4 chân TÁCH BOOT** (yên #46 + O8 T0 trên #90; O8 T8 + harness trên #91; gate (a) thiếu cờ #91) — **T8 KHÔNG đề xuất chuỗi WebKit FULL PASS lên 27** (khác đợt 176 đề xuất lên 26 với 4 chân cùng boot #89 + gate (a) có cờ thật).

### 5.4 Các luồng khác — T7 CHƯA đóng; (m)/INSIDE/mù thuộc T2-177

- T7-177 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~10:55Z) — kết cục run 176 + DR 09:00Z + HB 08:20:50Z thuộc T7-177/T10. T9 đóng đúng hạn cờ, không chờ T7 (cùng mẫu đợt 176).
- T1-177: verify 176 (không chạy lại suite 28 mục); 9/9 cờ đợt 176 có nội dung (gộp muộn T7-176). T2-177: (m) #90 + INSIDE #89/#90 + mù #96?/#95?/#94?/#88?/#77? + (m) #56 lần 20 — thuộc LIMITS T2, T9 không phán thay. T6-177: (A) + prune lần 52 + #91 có giết holder không — thuộc LIMITS T6.
- T0: #90 XÁC MINH 9/9 nguồn; O8 PASS 3/3 trên #90; boot lúc T0 đóng vẫn #90 (kiểm cuối 08:57:25Z) — #91 xảy ra sau khi T0 đóng, số hiệu chờ T0-178.

## 6. Sai số / caveat (F-177-T9-*)

- **F-177-T9-1 — CỬA SỔ THOÁNG #91 KHÔNG QUAN SÁT ĐƯỢC; T9 CHẬM PROBE ~50 s SAU KHI PHÁT HIỆN REBOOT.** #91 btime ~09:07:40Z; T9 phát hiện lúc 09:08:39Z (boot+59s, qua SIGTERM giết `sleep 1750`), nhưng chạy exec chẩn đoán TRƯỚC khi probe — probe lúc 09:09:28Z (boot+108s) đọc 0, 0. Đợt 176: phát hiện boot+39s → probe boot+53s, bắt được. Bài học: sau reboot, PROBE HEADROOM TRƯỚC, chẩn đoán sau. Tuy nhiên, theo mẫu cửa sổ rộng ~180s (mở boot+53–87s, đóng boot+181–245s) thì lúc boot+108s vẫn phải mở nếu cửa sổ tồn tại — đọc 0 gợi ý #91 KHÔNG CÓ cửa sổ hoặc cửa sổ rất ngắn; T9 không loại trừ đã lỡ một cửa sổ ngắn vì chậm probe. Chuỗi 5 lần liên tiếp (172–176) ĐỨT tại #91 theo nghĩa "không quan sát được" — T10/parent quyết có tính là đứt chuỗi hay chỉ là "không quan sát được".

- **F-177-T9-2 — MẪU CUỐI TRÊN #90 OVERLAP BIỂU KIẾN +15 s + 3 MỐC THỜI GIAN KHÔNG KHỚP NHAU — T9 KHÔNG CHỐT btime #91.** Mẫu cuối #90 lúc 09:07:55Z (mem=1.159.724 bal=5.677.748, boot=94247dfa) — ~+15 s SAU btime ước lượng từ uptime (~09:07:40Z; 2 lần đọc uptime khớp nhau 0,4 s). Journal first entry #91 lúc 09:07:56Z (sau btime-uptime 16 s; trên #90 cùng chỉ số là 12 s — mẫu khớp, ủng hộ btime-uptime). Nhưng lệnh `sleep 1750` (spawn ~09:06:50Z) bị SIGTERM sau 76,2 s (~09:08:06Z) — ~26 s SAU btime-uptime. Ba mốc không khớp trọn vẹn (lệch ~20–30 s), gợi ý đồng hồ VM lệch/nhảy quanh reboot, hoặc đồng hồ runtime lệch đồng hồ VM. T9 ghi đúng 3 mốc, KHÔNG chốt btime #91; giao T0-178 xác minh 9 nguồn. T2 lưu ý khi neo requeue quanh btime #91 (mẫu overlap +15 s cùng họ F-175-T9-2 +16 s, F-174-T9-2 +2 s, F-173-T9-7 +5 s — mẫu overlap thứ tư của sampler T9).

- **F-177-T9-3 — E-195 KẾT THÚC BỞI SAG (11 MẪU, CẬN DƯỚI) + E-196–E-199 PHÁN 4 EPISODE MỚI — giao T10 xác nhận (CÓ PHƯƠNG ÁN THAY THẾ).** E-195: 07:34:21–07:44:21Z đợt 176, 11 mẫu — KẾT THÚC bởi sag bắt đầu trong (08:39:14Z, 08:40:13Z] (đọc tay 08:39:14Z vẫn CEIL; 08:40:13Z đã 6.247.216 kB); đáy sag 5.180.948 kB lúc 09:04:54Z; hồi lên 5.677.748 kB lúc 09:07:55Z, chưa ghim lại thì gặp #91. 11 là cận dưới (khoảng mù giữa hai đợt 56m33s không mẫu nào — nhưng sag kết thúc nó ĐÃ quan sát được trong đợt 177). E-196: 09:30:29Z, 1 mẫu — chạm trần đơn lẻ (chain kích thước 1; các đợt trước không có episode 1 mẫu được nêu tên riêng — T9 vẫn đặt tên để đếm đủ 43 mẫu ghim, giao T10 quyết có tính E-196 là episode hay chỉ là "chạm trần"). E-197: 09:34:29–09:37:29Z, 4 mẫu — KẾT THÚC bởi sag 10 mẫu (đáy 90,8%). E-198: 09:48:29–10:23:30Z, **36 mẫu — episode dài nhất kể từ đợt 175** (đợt 176 dài nhất E-192 10 mẫu; đợt 175 dài nhất E-189 13 mẫu) — KẾT THÚC bởi sag 29 mẫu (đáy 79,5%, sâu nhất đợt). E-199: 10:53:32–10:54:32Z, 2 mẫu — **ĐANG GHIM lúc đóng** (kết cục thuộc T9-178). Phương án thay thế: gộp E-196+E-197 → 5 mẫu; gộp E-196+E-197+E-198 → 41 mẫu; gộp E-198+E-199 → 38 mẫu; tổng ghim 43 không đổi; chỉ số episode 4 → 3 / 2 / 3.

- **F-177-T9-4 — RAM ĐỈNH 41,78% GUARD — 0 MẪU ĐẠT GUARD, THẤP HƠN ĐỈNH ĐỢT 176 (48,52%).** Mẫu 09:12:28Z: RAM 2.628.608 kB, cách guard 3.662.848 kB (58,22%); balloon 4.197.600 kB (65,1% trần). Caveat: sampler cadence 60 s — vượt guard dưới 60 s giữa hai mẫu KHÔNG loại trừ được (điểm yếu (a) đợt 147). T9 claim đúng: **0 MẪU đạt guard → cơ chế (a) KHÔNG kích hoạt**. Trũng 454.712 kB lúc 08:49:54Z NÔNG hơn đợt 176 (407.580 kB) đúng 47.132 kB — lúc balloon hồi lên trần sau sag E-195, không trong cửa sổ kẹt nào (harness 6/6, 0 kẹt).

- **F-177-T9-5 — ENOSPC 2 PHA TRÊN #91 (CHẠY 30 → IM 42m50s → CHẠY 15) + HEADROOM 2 LÚC LAN-3 — TƯƠNG QUAN, KHÔNG PHÁN CƠ CHẾ.** Pha 1: 30 dòng 09:09:40–09:43:00Z (~67 s/dòng). Im lặng 09:43:00–10:25:50Z (42m50s, 0 dòng) — journal còn sống, service vẫn chạy (log 10:09:40Z không lỗi). Lan-3 đo headroom **2, 2 lúc 10:09:28Z** — trong lúc im lặng, lần duy nhất headroom ≠ 0. Pha 2: 15 dòng 10:25:50–10:54:50Z (~124 s/dòng — chậm hơn pha 1). Headroom về 0 lúc lan-4 (10:39:29Z). Tương quan ghi nhận: ENOSPC im lặng trong lúc headroom đo được 2; ENOSPC chạy lại sau khi headroom về 0 — cùng chiều mẫu đợt 175 (#87 dừng khi headroom về 2) nhưng ngược mẫu đợt 176 (#90 chạy đều khi headroom 0 — ở đây pha 1 cũng headroom 0 mà chạy). T9 chỉ ghi tương quan (headroom là số đo từ góc cell, ENOSPC là lỗi của systemd ngoài cell) — không phán cơ chế. Caveat đếm: `journalctl --since` lúc đóng chỉ trả 45 dòng (chỉ #91) — T10 không được đọc 45 là tổng đợt (tổng đợt đếm trực tiếp 72 dòng).

- **F-177-T9-6 — 2 SPIKE ĐỀU QUY ĐƯỢC DRIVER + 0 LOAD1 DƯ — SẠCH NHẤT KỂ TỪ ĐỢT 173.** Spike 1 (09:09:28Z): find hole-recheck T2 (delta 22) + hatch (delta 3) — watcher bắt ngay khi chạy lại trên #91, trong cửa sổ snapshot có cả replay apt/dpkg (apt-get update pid 806 trong top — T5 replay #91, xem LIMITS T8-177 selfcheck #2). Spike 2 (10:26:36Z): Chromium O8 T8 (delta 69) + vite/esbuild (delta 0 — đã qua đỉnh CPU lúc snapshot) + hatch (delta 13). Delta max 69 — thấp nhất kể từ đợt 173 (đợt 176: 132; đợt 175: 139). 0 spike trong chuỗi ghim (43 mẫu ghim, 0 spike — như đợt 176). `grep -c 'WebKit\|MiniBrowser'` = **0 dòng** (đợt 176: 26) — đợt này O8 WebKit của T0/T4 chạy trên #90 trước khi watcher kịp bắt spike nào (watcher khởi động 08:40:5xZ, O8 T0 08:53:54Z — load1 sampler trong cửa sổ O8 max 1,16, dưới ngưỡng spike 3,0).

- **F-177-T9-7 — T7-177 CHƯA đóng cờ lúc T9 đóng (~10:55Z) + T9 ĐÓNG ĐÚNG HẠN CỜ (KHÔNG TRỄ).** T9 không chờ T7 (kết cục run 176 thuộc T7-177/T10; cùng mẫu đợt 176, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN rồi `cp` sang vị trí thứ hai — hai bản giống nhau từng byte (md5 khớp) — giữ mẫu sửa F-175-T1-7.

- **Caveat đứng:** probe cap 30.000; sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #90 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 177; T1-177 không chạy lại suite nên không có cửa sổ T1 để đối chiếu.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (134 mẫu, 08:40:54–10:54:32Z): `round177-t9/ram-sampler-FROZEN.log` — md5 `f643f681fd58c9bd9b25722aac1ff186`. Log B2 đóng băng (2 spike): `round177-t9/b2-spikes-FROZEN.log` — md5 `dec286e49814a98a391ebeac0ca508a7`. Log headroom đóng băng (12 lần đo): `round177-t9/headroom-log-FROZEN.txt` — md5 `2e27abc5311f0edef06ce476761b6eb3`. Phân tích bằng script: `round177-t9/t9-177-analyze.py` (output: `round177-t9/t9-177-analyze-output.txt`). T10 đọc log đóng băng trực tiếp khi cần kiểm lại từng mẫu.
