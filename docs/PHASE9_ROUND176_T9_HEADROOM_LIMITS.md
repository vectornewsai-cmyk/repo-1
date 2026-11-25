# LIMITS — Phase 9 đợt 176, T9: headroom + RAM + birefnet (0 lần thử lần thứ 30; CỬA SỔ THOÁNG #90 LẦN THỨ 5 LIÊN TIẾP; E-191–E-195 MỚI, E-195 ĐANG GHIM; ENOSPC lần thứ 25; MỘT REBOOT GIỮA PHIÊN #90)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (14 lần đo: 12×0, 2×30.001; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 36 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG QUAN SÁT ĐƯỢC — LẦN THỨ 5 LIÊN TIẾP (172–176).** Reboot #90 giữa phiên (btime ~07:10:29Z, chờ T0-176 xác minh): **30.001, 30.001 lúc 07:11:22Z = boot+53s** (chênh 0), về **0 lúc boot+243s** — rộng <190 s; ENOSPC đầu tiên trên #90 lúc boot+121s, trong lúc cửa sổ đóng. Cửa sổ #89 KHÔNG quan sát được (đợt mở boot+9m25s).
- **Balloon — E-188/E-189/E-190 ĐỀU ĐÃ KẾT THÚC; 5 EPISODE MỚI E-191–E-195 (E-195 ĐANG GHIM).** E-190 kết thúc theo #88, 10 mẫu (cận dưới). #89: E-191 4 (sag 7, xuống 90,8%) → E-192 10 (sag 6, 96,5–99,4%) → E-193 4 (theo #90). #90: E-194 8 (micro-dip 3, 96,9–99,5%) → E-195 11 **ĐANG GHIM**. **Tổng ghim 37/123 (30,1%).** Phương án gộp ghi rõ nhưng KHÔNG dùng.
- **RAM: 123 mẫu, 05:42:20–07:44:21Z, HAI boot (#89: 89; #90: 34).** Max **3.052.340 kB (48,52% guard) lúc 05:47:21Z**; cách guard **3.239.116 kB**. Min **407.580 kB lúc 06:39:22Z** (nông hơn đợt 175 đúng 137.496 kB). Mean **1.022.359,4 kB — python + awk + trung bình có trọng số KHỚP**. Gate A **46/123**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 30 liên tiếp**.
- **B2: 15 spike THẬT, 13/15 QUY ĐƯỢC DRIVER, 2 load1 dư (13 trên #89, 2 trên #90; 0 spike trong chuỗi ghim).** Load1 max **10,44 lúc 05:46:23Z**. Cụm mở 05:42–05:53Z (12 spike); 1 spike trong harness T8 (06:16:57Z, WebKit 84l10, delta 103); 2 spike sau #90 (hatch + replay + chính probe K8 của T9). **0 spike trong cửa sổ attempt T4 và O8 T8.** Delta max 132 (ffmpeg).
- **Lượt yên #45 (T4): CÓ LƯỢT HỢP LỆ — attempt2 20/20 + B 5/5, median 46,0 ms — CHUỖI 38 → 39.** Attempt1 wedged pass 15; attempt2 sạch 06:02:57–06:06:26Z; ngân sách 2/3. Sampler: attempt1 gate A 0/5, attempt2 4/4; **0 spike B2 trong cả hai attempt; 0 vi phạm luật script nặng**.
- **T8: harness 6/6 SẠCH (86n2 KHÔNG kẹt lại P1); kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 0 → 1; O8 T8 PASS 3/3 trên #89; ĐỀ XUẤT chuỗi FULL PASS LÊN 26**.
- **MỘT REBOOT GIỮA PHIÊN: #90 (94247dfa, btime ~07:10:29Z; gap #89→#90 = 6.243 s).** Sampler + B2 + probe-loop **CHẾT theo reboot**; T9 khởi động lại trong **~51 s** (sampler lại 07:11:20Z = boot+51s — bắt được cửa sổ thoáng boot+53s). **Gap 57 s qua reboot.** Mẫu cuối trên #89 lúc 07:10:23Z — **6 s TRƯỚC btime #90** (KHÔNG overlap).
- **ENOSPC: đếm trực tiếp 86 dòng (58 trên #89 tới 06:42:21Z + 28 trên #90; ngoại suy ≈ 111) — đợt thứ 25 liên tiếp.** Trên #90: 28 dòng nhịp ~70 s đều đặn, không im lặng.
- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc T9 đóng (7/9 + T9 = 8/9)** — T7 CHƯA đóng (run 175 SUCCEEDED 05:24:21Z theo T0-176). **(m) #88: DƯƠNG (T2, CUỐI); (m) #89: ÂM; INSIDE #88: TRUE (FULL134) — chuỗi dài 7; INSIDE #89 (sơ bộ): FALSE. #87/#88/#89 XÁC NHẬN 9 nguồn (T0); marker 41 reboot.**
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp: script `hidden_files/round176-t9/k8-headroom.py` (copy y nguyên từ đợt 175 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 176 (14 lần đo hợp lệ, 2 boot, 0 lần đo lỗi)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 05:42:29Z | **0, 0** | #89 15618ce8 | 63.747 | cặp mở; ENOSPC=5 (mới nhất 05:42:06Z) |
| 06:12:20Z | **0, 0** | #89 15618ce8 | 63.747 | lan-2; ENOSPC=31 (mới nhất 06:11:16Z) |
| 06:42:21Z | **0, 0** | #89 15618ce8 | 63.747 | lan-3; ENOSPC=58 (mới nhất 06:41:41Z); balloon CHẠM TRẦN |
| 07:11:22Z | **30.001, 30.001** | #90 94247dfa | 63.747 | **CỬA SỔ THOÁNG #90 — chạm CAP** (boot+53s); ENOSPC=0 trên #90 |
| 07:14:32Z | **0, 0** | #90 94247dfa | 63.747 | theo dõi cửa sổ (boot+243s) — ĐÃ ĐÓNG; ENOSPC=2 (đầu 07:12:30Z = boot+121s) |
| 07:41:20Z | **0, 0** | #90 94247dfa | 63.747 | lan-90-2; ENOSPC=25 (mới nhất 07:40:20Z); balloon CHẠM TRẦN |
| 07:44:32Z | **0, 0** | #90 94247dfa | 63.747 | cặp đóng; balloon ĐANG GHIM (E-195); ENOSPC=28 |

- Probe dừng ở `i=0` trong 12/14 lần đo; chạm CAP trong 2/14 lần đo (cặp cửa sổ #90). File tạm dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót).
- **CỬA SỔ THOÁNG: QUAN SÁT ĐƯỢC — LẦN THỨ 5 LIÊN TIẾP (172–176).** Reboot #90 btime ~07:10:29Z (ước lượng uptime của T9: 07:10:28,4–29,2Z; số hiệu chờ T0-176 xác minh 9 nguồn). T9 đo tay ngay sau khi khởi động lại: **07:11:22Z = boot+53s: 30.001, 30.001 (chênh 0)**; **07:14:32Z = boot+243s: 0, 0**. Cửa sổ mở tại boot+53s, đóng trước boot+243s — **rộng chưa tới 190 s**, cùng mẫu các đợt 163–166, 172–175 (30.001 lúc boot+53–87s → 0 lúc boot+181–245s). ENOSPC đầu tiên trên #90 lúc 07:12:30Z = boot+121s — trong (07:11:22Z, 07:14:32Z], đúng lúc cửa sổ đóng.

- **Cửa sổ #89: KHÔNG QUAN SÁT ĐƯỢC** (cùng mẫu cấu trúc đợt 175/#86). Reboot #89 btime 05:26:26Z (T0-176 xác minh 9 nguồn); đợt mở 05:35:51Z = boot+9m25s; probe mở 05:42:29Z (boot+16m03s) đã 0, 0. ENOSPC trên #89 đã có 5 dòng lúc mở (dòng đầu 05:36:26Z = boot+10m00s). Nếu cửa sổ thoáng của #89 tồn tại thì nó nằm trong ~boot+60–200s (05:27–05:30Z) — trước khi đợt mở ~6 phút; không luồng nào của đợt 176 có mặt lúc đó. T9 ghi đúng mốc đo, không claim cửa sổ #89 có mở hay không. Chuỗi 5 lần liên tiếp tính theo đợt có cửa sổ quan sát được (mỗi đợt đều qua một reboot giữa phiên: #87 đợt 175, #90 đợt 176).
- **Headroom cuối phiên: 0 (cặp đóng 07:44:32Z, chênh 0).** Trên #89: 0 suốt phiên. Trên #90 sau khi cửa sổ đóng: 0 lúc boot+243s, lan-90-2 và đóng. Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 0 = **63.747 watch** trên #90 (toàn bộ trần đã giữ). **ENOSPC trên #90 KHÔNG dừng** (28 dòng nhịp ~70 s đều đặn tới 07:43:50Z) — khác #87 đợt 175 (dừng sau 04:05:00Z khi headroom về 2); đợt này headroom 0 nên ENOSPC chạy đều (xem §4, F-176-T9-9). Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** — một vite mới không khởi động được (như mọi đợt từ 152). So với đợt 175 (mở 0 → thoáng 30.001/30.001 boot+57s → 0 boot+245s → đóng 2; 14 lần đo): đợt này mở 0 → thoáng 30.001/30.001 boot+53s → 0 boot+243s → đóng 0 (14 lần đo: 12×0, 2×30.001). T5-176 KHÔNG probe lại headroom (như đợt 151–175); số T9 đứng trên 14 lần đo hợp lệ + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #90 có 28 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác. **Trần KHÔNG ĐỔI trong boot** (63.747 trên #89 và #90 suốt 14 lần đo). Probe-loop gốc **CHẾT theo reboot #90** (trước lan-4 ~07:12:21Z); T9 viết lại `probe-loop-90.sh` chạy lan-90-2 đúng lịch 30 phút; lan-90-3 (~08:11Z) không chạy vì đợt đóng trước — đóng bằng probe tay. Cùng mẫu đợt 173/174/175.

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt (trần 63.747; chi tiết xem LIMITS T9 các đợt 129–175 §1.3): **… → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 6 → 0 → 2 → 2 → 0 → 2 → 0 → 2 → 2 → 0**. Gần nhất: 171 đóng 0; 172 đóng 2 (thoáng 30.001 boot+68s); 173 đóng 0 (thoáng 30.001 boot+73s); 174 đóng 2 (thoáng 30.001/29.052 boot+87s); 175 đóng 2 (thoáng 30.001/30.001 boot+57s); **176 đóng 0 (thoáng 30.001/30.001 boot+53s)**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 0** (175: 2; 174: 2; 173: 0; 172: 2; 171: 0). Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 36 liên tiếp** (tính theo giá trị ổn định lúc đóng). Quyết parent đợt 175 (l) GIỮ quyết (k) "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal đợt này có 86 dòng lỗi ENOSPC thật đếm trực tiếp (xem §4)** — đợt thứ 25 liên tiếp cạn watch gây lỗi thấy được. T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 123 mẫu, 05:42:20Z–07:44:21Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB (mọi tỉ lệ guard dùng guard 6.291.456 kB = 6.144 MiB). Sampler mỗi 60 s một mẫu MemAvailable + Balloon + SwapFree + load1; **gap lớn nhất trong log đóng băng 61 s trong boot; gap 57 s qua reboot #90** (xem §5.1). **123 mẫu (#89: 89; #90: 34).**

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 05:42:20Z | #89 | 882.280 kB | Mở phiên: balloon 5.929.076 kB (92,0% trần); gate A ĐÓNG; ENOSPC=5 |
| 05:43:33–05:47:10Z | #89 | 1.490.132–1.962.592 kB | **T0 O8 PASS 3/3**; gate A 3/3; **6 spike B2**; **RAM max phiên 3.052.340 kB lúc 05:47:21Z** (11 s sau O8) |
| 05:45:30–05:52:53Z | #89 | 1.547.908–3.052.340 kB | **T1 suite 28/28 exit 0**; gate A 7/7; **6 spike B2** (ffmpeg/tsc; delta max 132) |
| 05:57:48–06:02:31Z | #89 | 570.052–855.220 kB | **T4 attempt1 WEDGED pass 15**; gate A 0/5; **0 spike B2** |
| 06:02:57–06:06:26Z | #89 | 1.386.460–1.819.740 kB | **T4 attempt2 LƯỢT HỢP LỆ #45** (20/20 + B 5/5, median 46,0 ms); gate A 4/4; **0 spike B2** |
| 06:13:08–06:15:46Z | #89 | 1.438.176–1.865.312 kB | **T8 O8 PASS 3/3**; gate A 3/3; **0 spike B2** |
| 06:16:15–06:31:34Z | #89 | 689.464–2.997.812 kB | **T8 harness 6/6 SẠCH**; gate A 9/16; **1 spike B2** (06:16:57Z, WebKit 84l10, delta 103); 0 mẫu ghim |
| 06:39:22Z | #89 | 407.580 kB | **RAM min phiên** (bal 6.418.244 kB, 99,6% trần; load1 0,07) — ngay trước E-191 |
| 06:40:22–07:10:23Z | #89 | 449.616–627.100 kB | Balloon GHIM: **E-191 4 + E-192 10 + E-193 4 mẫu** (2 sag xen giữa); gate A ĐÓNG cả 30 mẫu; **0 spike B2**; mẫu cuối 07:10:23Z **6 s TRƯỚC btime #90** |
| 07:11:20–07:22:21Z | #90 | 1.598.364–2.002.764 kB | **Boot #90 mới; cửa sổ thoáng 30.001/30.001 lúc boot+53s**; sampler lại 07:11:20Z (boot+51s); gate A 7/12; **2 spike B2**; SwapFree NHẢY +424.904 kB |
| 07:23:21–07:44:21Z | #90 | 538.424–627.100 kB | Balloon GHIM: **E-194 8 mẫu** → micro-dip 3 mẫu → **E-195 11 mẫu, ĐANG GHIM**; gate A ĐÓNG cả 22 mẫu; **0 spike B2**; ENOSPC 28 dòng nhịp ~70 s |

- **Gate A ≥1024 MiB: 46/123 mẫu** (39/89 trên #89 + 7/34 trên #90 — KHỚP tổng; số giai đoạn từ script kiểm tra, không tính tay); **0 mẫu ≥ guard**; load1 max (sampler) **9,69** (watcher bắt 10,44 lúc 05:46:23Z — khớp, khác cadence); **RAM <512.000 kB: 21 mẫu** (17,1% — tất cả 21 trên #89, tất cả trong span ghim 06:39–07:10Z, liệt kê từng mẫu bằng script — xem dưới); **RAM <300.000 kB: 0 mẫu** (đợt 175: 1; đợt 174: 0).
- Swap: SwapFree 737.072 kB (mẫu đầu #89) → 615.824 kB (mẫu cuối #89, 07:10:23Z) → **1.040.728 kB (mẫu đầu #90, 07:11:20Z — NHẢY +424.904 kB qua reboot #90)** → 674.112 kB (mẫu cuối, 07:44:21Z). Nhịp nhảy SwapFree qua reboot: #90 nhả ~424.904 kB (đợt 175: ~280.484 kB qua #87; đợt 174: ~294.600 kB qua #86; đợt 173: ~383.076 kB qua #84, ~416.796 kB qua #85; đợt 172: ~351.824 kB qua #82).

- Mẫu 05:47:21Z (đỉnh phiên): RAM 3.052.340 kB, balloon 3.716.368 kB — đỉnh là một mẫu đơn lẻ 11 s sau khi O8 của T0 kết thúc (05:47:10Z); mẫu trước đỉnh (05:46:21Z): 1.962.592 kB; mẫu sau đỉnh (05:48:21Z): 1.547.908 kB — RAM rơi 1.504.432 kB trong 60 s sau đó. T9 ghi đúng số đo, không phán cơ chế. (Đỉnh đợt 175: 2.681.400 kB — đỉnh đợt này cao hơn 370.940 kB, và là đỉnh cao nhất kể từ đợt 171.)

- Trũng RAM đợt này: min 407.580 kB (đợt 175: 270.084 kB; đợt 174: 402.460 kB; đợt 173: 484.332 kB; đợt 172: 431.236 kB; đợt 171: 296.796 kB; đợt 170: 263.132 kB) — **trũng NÔNG hơn đợt 175 đúng 137.496 kB**. 21 mẫu <512.000 kB trong 123 mẫu (17,1%); tất cả 21 mẫu đều trong span ghim/sag 06:39–07:10Z trên #89 (0 mẫu <512.000 kB trên #90 — dù #90 có 19 mẫu ghim, RAM lúc ghim trên #90 là 538.424–627.100 kB, cao hơn hẳn #89 lúc ghim 449.616–507.008 kB).

**Bảng tổng hợp số RAM (từ script `t9-176-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 123 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #89 15618ce8 | 89 | 407.580 | 3.052.340 | 1.099.675,5 | 39/89 | 18 | 9,69 | 21 |
| #90 94247dfa | 34 | 538.424 | 2.002.764 | 819.973,4 | 7/34 | 19 | 3,90 | 0 |
| **Toàn phiên** | **123** | **407.580** | **3.052.340** | **1.022.359,4** | **46/123** | **37/123 (30,1%)** | **9,69** | **21** |

- **Mean toàn phiên 1.022.359,4 kB — 3 cách độc lập: python `sum/n = 1.022.359,4` VÀ awk `sum/n = 1.022.359,4` VÀ trung bình có trọng số ((89×1.099.675,5 + 34×819.973,4)/123 = 1.022.359,45) — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai đợt 163) và **KHÔNG lặp F-172-T9-6** (số giai đoạn viết tay sai đợt 172 — mọi số bảng đợt này đều từ script analyze, không tính tay).
- 21 mẫu RAM <512.000 kB (từ script analyze trên log đóng băng — không tính tay): #89: 06:39:22Z, 06:40:22Z, 06:41:22Z, 06:42:22Z, 06:43:22Z, 06:50:23Z, 06:51:23Z, 06:52:23Z, 06:53:23Z, 06:54:23Z, 06:55:23Z, 06:56:23Z, 06:57:23Z, 06:58:23Z, 06:59:23Z, 07:00:23Z, 07:03:23Z, 07:07:23Z, 07:08:23Z, 07:09:23Z, 07:10:23Z. Tổng 21 + 0 = 21 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-190 KẾT THÚC (10 mẫu) + 5 EPISODE MỚI (E-191 4 + E-192 10 + E-193 4 + E-194 8 + E-195 11 ĐANG GHIM)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **E-190 — KẾT CỤC: KẾT THÚC theo reboot #88, 10 mẫu quan sát được (cận dưới).** E-190 ghim 04:42:02–04:51:02Z đợt 175 (10 mẫu, ĐANG GHIM lúc T9-175 đóng); reboot #88 btime 05:04:17Z nằm trong khoảng mù 04:51:02–05:04:17Z (không mẫu nào) — balloon trên #89 khởi động lại từ 5.929.076 kB (mẫu mở đợt 176), không ghim. Thời điểm đứt thật nằm trong (04:51:02Z, 05:04:17Z]; 10 là cận dưới, số mẫu cuối cùng không biết được. **E-188 (7 mẫu) + E-189 (13 mẫu) đã kết thúc trong đợt 175** — cả ba episode đợt 175 đều đã có kết cục, không episode nào mang sang đợt 176.
- **Boot #89: GHIM 18/89 mẫu (20,2%), 3 EPISODE MỚI (E-191 + E-192 + E-193).** Leo lên trần: từ 05:42:20Z (5.929.076 kB, 92,0% trần) xả xuống ~4,0–5,2M trong lúc O8/suite/attempt/harness, rồi leo lại tới ghim lúc 06:40:22Z (mẫu ngay trước chuỗi 06:39:22Z: balloon 6.418.244 kB, 99,6% trần). **E-191 — 06:40:22–06:43:22Z, 4 mẫu** (RAM 449.616–488.376 kB; gate A ĐÓNG cả 4). **KẾT THÚC bởi sag 7 mẫu 06:44:22–06:50:23Z** (balloon 5.854.000–6.407.308 kB, 90,8–99,4% trần). **E-192 — 06:51:23–07:00:23Z, 10 mẫu** (RAM 436.592–507.008 kB; gate A ĐÓNG cả 10). **KẾT THÚC bởi sag 6 mẫu 07:01:23–07:06:23Z** (balloon 6.218.012–6.406.484 kB, 96,5–99,4% trần). **E-193 — 07:07:23–07:10:23Z, 4 mẫu** (RAM 468.668–477.468 kB; gate A ĐÓNG cả 4). **KẾT THÚC theo reboot #90** (ghim tới mẫu cuối cùng trên #89 — 07:10:23Z, **6 s TRƯỚC btime #90** — mẫu không-overlap, xem §5.1; balloon trên #90 khởi động lại từ 4.898.468 kB, 76,0% trần, không ghim). Thời điểm đứt thật nằm trong (07:10:23Z, 07:11:20Z]. **Tổng #89: 18 mẫu ghim / 3 chuỗi / 2 sag (7 + 6 mẫu).**
- **Boot #90: GHIM 19/34 mẫu (55,9%), 2 EPISODE MỚI (E-194 + E-195).** Leo lên trần: từ 07:11:20Z (4.898.468 kB, 76,0% trần) leo gần đơn điệu tới ghim lúc 07:23:21Z trong ~12 phút (mẫu ngay trước chuỗi 07:22:21Z: balloon 6.385.872 kB, 99,1% trần). **E-194 — 07:23:21–07:30:21Z, 8 mẫu** (RAM 542.188–627.100 kB; gate A ĐÓNG cả 8). **KẾT THÚC bởi micro-dip 3 mẫu 07:31:21–07:33:21Z** (balloon 6.247.216–6.410.084 kB, 96,9–99,5% trần). **E-195 — 07:34:21–07:44:21Z, 11 mẫu** (RAM 538.424–569.336 kB; gate A ĐÓNG cả 11). **ĐANG GHIM lúc T9 đóng** (mẫu cuối 07:44:21Z vẫn 6.443.824 kB) — kết cục thuộc T9-177 (số mẫu cuối cùng chưa biết; 11 là cận dưới). **Tổng #90: 19 mẫu ghim / 2 chuỗi / 1 micro-dip (3 mẫu).**
- **Tổng ghim trần đợt này: 37/123 mẫu (30,1%)** (đợt 175: 38/133 = 28,6%; đợt 174: 55/137 = 40,1%; đợt 173: 65/144 = 45,1%; đợt 172: 52/121 = 43,0%; đợt 171: 7/121 = 5,8%; đợt 170: 47/121 = 38,8%; các đợt 152–169: 21,8–52,0%). **5 episode mới trong đợt 176 (E-191: 4 mẫu, KẾT THÚC bởi sag 7 mẫu; E-192: 10 mẫu, KẾT THÚC bởi sag 6 mẫu; E-193: 4 mẫu, KẾT THÚC theo #90; E-194: 8 mẫu, KẾT THÚC bởi micro-dip 3 mẫu; E-195: 11 mẫu, ĐANG GHIM)** + E-190 KẾT THÚC 10 mẫu + E-188/E-189 GIỮ 7/13 mẫu.
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-191–E-195 là 5 EPISODE MỚI (hai mẫu ghim liên tiếp cách nhau ≤61 s mới cùng chuỗi — script analyze dùng từ đợt 172; sag/micro-dip tách chuỗi). **Phương án thay thế (ghi rõ để T10/parent xét):** gộp E-191+E-192+E-193 qua 2 sag → 1 episode 18 mẫu trên #89; gộp E-194+E-195 qua micro-dip 3 mẫu (96,9–99,5%) → 1 episode 19 mẫu trên #90; tổng mẫu ghim 37 không đổi; chỉ số episode đổi 5 → 2. Lưu ý: sag kết thúc E-192 nông (96,5–99,4% trần — cùng họ micro-dip như E-188/E-189 đợt 175), trong khi sag kết thúc E-191 sâu (xuống 90,8% trần — cùng họ E-189 đợt 175).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-195 chỉ ~538–569.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #45 (T4, đợt 176) — CÓ LƯỢT HỢP LỆ, attempt2 20/20 + B 5/5, CHUỖI 38 → 39 (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **#45 CÓ LƯỢT HỢP LỆ — attempt2-15618ce8 (20/20 pass, lớp B ĐẠT 5/5, tickCost median 46,0 ms ≤60) — CHUỖI LƯỢT YÊN HỢP LỆ 38 → 39.** Ngân sách dùng 2/3 (attempt1 wedged ở pass 15, 05:57:48–06:02:31Z; attempt2 chạy sạch 06:02:57–06:06:26Z). Poller: 23 poll thật, 1 boot (15618ce8), không reboot trong phiên T4. POSTBOOT_PASS #89 ĐÃ CÓ (05:42:19Z, replay-đầy-đủ, poll=0 — xem §5.2).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** attempt1 (05:57:48–06:02:31Z): gate A MỞ **0/5 mẫu** (RAM 570.052–855.220 kB — attempt1 chạy trong lúc RAM thấp); load1 **0,27–1,50**; balloon 73,5–80,6% trần, **0 mẫu ghim**. Attempt2 (06:02:57–06:06:26Z): gate A MỞ **4/4 mẫu** (RAM 1.386.460–1.819.740 kB); load1 **0,51–1,71**; **0 mẫu ghim**. RAM nhảy từ ≤855.220 kB (mẫu 06:02:22Z) lên ≥1.386.460 kB (mẫu 06:03:22Z) — T4 ghi RAM 2.100 MB lúc attempt1 wedged (06:02:57Z), nằm giữa hai mẫu sampler — khác cadence, không mâu thuẫn (cùng mẫu F-173-T9-9). **0 spike B2 trong cả hai cửa sổ attempt** (khác đợt 175: 1 spike trong attempt1). **0 vi phạm luật script nặng** (T4: ps-before/after cả hai attempt sạch — khác đợt 174/175 có vi phạm F-174-T4-2/F-175-T4-2).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T1/T0/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T1 suite 05:45:30–05:52:53Z | #89 | 1,17–9,69 (7 mẫu) | 1.547.908–3.052.340 kB — **gate A 7/7** | **6 spike B2** (ffmpeg/tsc); T1 suite 28/28 exit 0; 0 mẫu ghim |
| T0 O8 05:43:33–05:47:10Z | #89 | 6,98–9,69 (3 mẫu) | 1.490.132–1.962.592 kB — **gate A 3/3** | **6 spike B2**; WebKit 21/21 ×2 + Chromium 21/21 (T0); 0 mẫu ghim |
| T4 attempt1 05:57:48–06:02:31Z | #89 | 0,27–1,50 (5 mẫu) | 570.052–855.220 kB — **gate A 0/5** | **WEDGED pass 15 — 0 spike B2**; 0 mẫu ghim |
| T4 attempt2 06:02:57–06:06:26Z | #89 | 0,51–1,71 (4 mẫu) | 1.386.460–1.819.740 kB — **gate A 4/4** | **LƯỢT HỢP LỆ — 0 spike B2**; 0 mẫu ghim |
| T8 O8 06:13:08–06:15:46Z | #89 | 1,73–2,78 (3 mẫu) | 1.438.176–1.865.312 kB — **gate A 3/3** | **0 spike B2**; O8 PASS 3/3; 0 mẫu ghim |
| T8 harness 06:16:15–06:31:34Z | #89 | 0,38–2,88 (16 mẫu) | 689.464–2.997.812 kB — **gate A 9/16** | **1 spike B2** (06:16:57Z, WebKit 84l10, delta 103); harness 6/6 PASS, 0 KẸT; **0 mẫu ghim** (khớp T8) |

### 2.5 B2 — 15 spike THẬT, 13/15 QUY ĐƯỢC DRIVER, 2 load1 dư (13 trên #89, 2 trên #90; 0 spike trong chuỗi ghim)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **15 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 15): 12 spike cụm mở (05:42:20–05:53:22Z); 1 spike trong cửa sổ harness T8 (06:16:57Z); 2 spike sau reboot #90 (07:11:20Z/07:11:56Z); 0 spike trong span ghim E-191 (06:40:22–07:10:23Z), E-194 (07:23:21–07:30:21Z), E-195 (07:34:21–07:44:21Z).**

| # | Thời điểm (UTC) | load1 | Driver (quy được) |
|---|---|---|---|
| 1 | 05:42:20Z | 3,62 | find kiểm file O8-175 (17,2%) + hatch daemon (delta 34, 18,2% tức thời) |
| 2 | 05:42:56Z | 3,10 | find ×2 (o8-clicktest ca31fac1 30% + find -type l 10% tức thời) + hatch (delta 23) |
| 3 | 05:44:01Z | 5,55 | ffmpeg testsrc2 (delta 56) + WebKit (delta 34) + MiniBrowser (36,4% tức thời) — T0 O8 + T1 crosscheck |
| 4 | 05:44:37Z | 7,15 | WebKit (delta 28) + MiniBrowser (delta 42) + hatch (delta 23) — T0 O8 WebKit |
| 5 | 05:45:12Z | 8,54 | WebKit (delta 51, 130% tức thời) + MiniBrowser (delta 45, 50% tức thời) — T0 O8 WebKit |
| 6 | 05:45:47Z | 8,47 | WebKit (delta 47) + tsc apps/web (delta 62) + MiniBrowser (delta 31) + grep T2 (delta 16) — T0 O8 + T1 tsc + T2 grep |
| 7 | 05:46:23Z | **10,44** | tsc apps/desktop (delta 45) + Chromium renderer (delta 23, 42,9% tức thời) + grep T2 (delta 27) + hatch (delta 14) — **load1 max watcher** |
| 8 | 05:46:59Z | 7,70 | Chromium renderer (delta 64) + node /tmp/p7-176t1.test.mjs (60% tức thời, T1) + hatch (delta 26) |
| 9 | 05:47:35Z | 4,29 | ffmpeg vidstabdetect (delta 128, 136,4% tức thời) — T1 suite U4 |
| 10 | 05:52:10Z | 4,47 | ffmpeg testsrc2-1920x1080 geq (delta 132, 110% tức thời) — T1 suite pixelate — **delta max đợt** |
| 11 | 05:52:46Z | 6,33 | ffmpeg rawvideo geq (128% tích lũy, 100% tức thời; pid chết trước vòng delta) — T1 suite v19 pixelate probe |
| 12 | 05:53:22Z | 4,14 | **load1 dư** — không process nào trên ~0% ngoài hatch (60% tức thời, delta 9); load5 3,71; tàn dư T1 suite vừa kết thúc (05:52:53Z) + hatch |
| 13 | 06:16:57Z | 3,44 | WebKitWebProcess (delta 103, 120% tức thời) + MiniBrowser (delta 29) — **T8 harness 84l10 WebKit**, trong cửa sổ harness |
| 14 | 07:11:20Z | 3,90 | hatch daemon (delta 20) + python3 60% tức thời (pid 2365) + replay apt/dpkg (sh 772 + apt-get 2399 + dpkg 2400) — **rất có thể chính probe K8 của T9** (probe-open-90 chạy 07:11:22Z, trong cửa sổ snapshot — xem F-176-T9-6) |
| 15 | 07:11:56Z | 3,80 | **load1 dư** — top -b không process nào trên 0% tức thời; hatch delta 2; load5 1,38; tàn dư replay #90 + hatch |

- **Tổng kết: 13/15 spike có driver process cụ thể + 2 spike lớp "load1 dư"** (đợt 175: 34/38 + 4 dư; đợt 174: 8/10 + 2 dư; đợt 173: 9/9 + 0 dư). Tỉ lệ load1 dư 2/15 = 13,3%. Phương án thay thế — quy cả hai load1 dư về "tàn dư suite/replay vừa xong" — ghi rõ để T10/parent xét (nếu chấp nhận thì 15/15 quy được, 0 load1 dư).

- **Caveat đếm (F-176-T9-6):** 4 spike có dưới 5 dòng delta (spike 2, 4, 8, 14 — pid chết giữa vòng delta 1 s, hoặc process vừa khởi động không lọt top-5 %CPU tích lũy) — quy driver bằng top -b tức thời và/hoặc ps-top tích lũy (tiền lệ F-163-T9-9). **Không spike nào trong 13 spike quy được mất attribution.** `grep -c 'WebKit\|MiniBrowser'` = **26 dòng** (đợt 175: 48). **T7 churn xuất hiện trong spike 9 NHƯNG KHÔNG PHẢI DRIVER** (0,1% tích lũy, không lọt top-5 delta). **T2 find/grep trong 4 spike** (1, 2, 6, 7 — khác đợt 175: 0; cùng mẫu đợt 174). **Delta tick lớn nhất đợt: 132 tick/s** (ffmpeg, spike 05:52:10Z, load1 4,47; đợt 175: max 139). **Khoảng mù watcher đầu phiên: 0** (watcher khởi động 05:42:2xZ CÙNG lúc sampler; spike đầu 05:42:20Z). **Khoảng mù qua reboot #90: 57 s** (watcher chết ~07:10:29Z, chạy lại 07:11:20Z — cùng gap sampler; 0 spike nào bị lỡ có thể kiểm chứng — load1 sampler trên #90 max 3,90 trong 12 mẫu đầu, watcher bắt được 2 spike ngay khi chạy lại). **0 gap phủ sóng watcher nào khác.** Truy chủ ffmpeg: họ F-147/148/149-T9-3 ĐÓNG đợt 150 — đợt này không spike nào ngoài họ T1 suite + T0 O8 + T4 attempt + T8 O8/harness + T5 replay/apt + T2 find/grep + T7 churn + hatch daemon (ffmpeg trong 5 spike cụm mở; T0 O8 WebKit trong 5 spike; T0 O8 Chromium trong 2 spike; T8 harness WebKit trong 1 spike; hatch daemon trong 15 spike, driver chính chỉ ở spike 14–15 cùng replay).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ 30 liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round176-t9/sampler.sh` chạy liên tục 05:42:20Z–07:44:21Z (2 instance: instance 1 sống 05:42:20–07:10:23Z trên #89 rồi **CHẾT theo reboot #90**; instance 2 khởi động lại 07:11:20Z trên #90, sống tới khi T9 dừng tay ~07:44:3xZ — **1 gap qua reboot (57 s), 0 gap >90 s khác; max gap trong boot 61 s**), **123 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **3.052.340 kB = 48,52% guard** (đợt 175: 42,62%; đợt 174: 33,17%; đợt 173: 44,14%; đợt 172: 48,13%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **3.239.116 kB (51,48%)**. **Caveat (F-176-T9-4): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.** Mẫu trước đỉnh (05:46:21Z): 1.962.592 kB; mẫu sau đỉnh (05:48:21Z): 1.547.908 kB — đỉnh là một mẫu đơn lẻ, RAM rơi 1.504.432 kB trong 60 s sau đó; không có mẫu nào khác trên 2.400.000 kB trong phiên.
- **0 lần thử birefnet trong đợt 176 — lần thứ 30 liên tiếp** (đợt 147–176: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 30 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round176-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink → `/usr/bin/python3.12`); `bgremove.py` **23.500 B**; `~/.u2net/birefnet-general.onnx` **972.666.916 B**; `~/.u2net/u2net.onnx` **175.997.641 B**; clip test **14.554 B** (tất cả không đổi so với đợt 175). `~/workspace/tmp-t9-176-birefnet/` **trống**. **T9 sẵn sàng kích hoạt khi guard mở.** Không cần chạy lại birefnet trong đợt 176 (không mẫu nào đạt guard; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (trong đợt đếm trực tiếp 86 dòng — đợt thứ 25 liên tiếp)

- **#89:** đếm trực tiếp tới **58 dòng lúc 06:42:21Z** (lan-3); **tổng cuối KHÔNG đếm lại được — journal MẤT theo reboot #90** (cùng mẫu F-171-T10-4). Dòng đầu trong đợt **05:36:26Z = boot+10m00s** (sau mốc mở 05:35:51Z 35 s — toàn bộ 58 dòng đều trong đợt). Nhịp: 5 dòng tới 05:42:29Z → 31 dòng tới 06:12:20Z (+26 dòng / 29m51s) → 58 dòng tới 06:42:21Z (+27 dòng / 30m01s) — **~0,885 dòng/phút ổn định**. Đuôi #89 06:42:21Z→reboot (~07:10:29Z, 28m08s): ngoại suy ≈ **+25 dòng** (NGOẠI SUY, KHÔNG PHẢI SỐ ĐẾM — theo nhịp 0,885 dòng/phút; nhịp #90 đo trực tiếp 0,894 dòng/phút corroborate). Tổng #89 ngoại suy ≈ **83 dòng**.
- **#90:** **28 dòng** (đếm trực tiếp lúc đóng). Dòng đầu **07:12:30Z (boot+121s)** — trong lúc cửa sổ thoáng đóng; nhịp **~70 s đều đặn, không im lặng** (07:12:30–07:43:50Z, 28 dòng) — **KHÔNG DỪNG** tới lúc đóng (khác #87 đợt 175 dừng sau 04:05:00Z khi headroom về 2; đợt này headroom 0 nên ENOSPC chạy đều — xem F-176-T9-9).
- **Tổng đợt 176 đếm trực tiếp: 86 dòng** (58 #89 + 28 #90) — cận dưới; ngoại suy ≈ **111 dòng** (83 + 28). Cao hơn đợt 175 (60 dòng đếm trực tiếp) vì đợt này có 2 boot đều chạy ENOSPC + đuôi #89 ngoại suy dài. Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut).
- **Caveat `journalctl --since`:** lệnh lúc đóng chỉ trả **28 dòng** (chỉ còn journal #90). **28 KHÔNG phải tổng đợt** (tổng đợt đếm trực tiếp 86 dòng). `journalctl --list-boots` lúc đóng chỉ còn idx 0 (#90) — journal #89 đã mất.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #90 giữa phiên (T9 bắt trực tiếp, khởi động lại ~51 s) + #89 trước khi đợt mở

- **#90 (94247dfa, btime ~07:10:29Z; gap #89→#90 = 6.243 s — số hiệu chờ T0-176 xác minh 9 nguồn).** Btime ước lượng từ uptime của T9: 07:10:28,4Z (uptime 53,59 s lúc 07:11:22Z) và 07:10:29,2Z (uptime 38,81 s lúc 07:11:08Z) — T9 dùng ~07:10:29Z ±1 s; T0-176 xác minh 9 nguồn sẽ chốt. Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối 07:10:23Z = **btime−6 s, KHÔNG OVERLAP** — T2 có neo sampler âm 6 s nếu dùng; khác F-175-T9-2 (+16 s) và F-174-T9-2 (+2 s)). T9 khởi động lại cả ba trong **~51 s** (sampler chạy lại 07:11:20Z = boot+51s; probe-loop-90 viết mới, lan-90-2 đúng lịch 30 phút; lan-90-3 ~08:11Z không chạy vì đợt đóng trước — đóng bằng probe tay). **Gap 57 s qua #90**; max gap trong boot 61 s. Lệnh `sleep 1750` chờ lan-4 của T9 **bị SIGTERM lúc ~07:10:2xZ** theo reboot — chính cú SIGTERM này đánh thức T9 (phát hiện #90 lúc 07:11:08Z, boot+39s), probe cửa sổ lúc 07:11:22Z (boot+53s) — cửa sổ vẫn bắt được. Không mất số liệu. Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` khớp shell mình ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN — nhưng T9 phát hiện + khởi động lại trong phiên, không để mất cả nửa phiên như đợt 148.** E-193 ghim tới mẫu cuối trên #89 — thời điểm đứt thật nằm trong (07:10:23Z, 07:11:20Z]; T9 không claim cụ thể hơn.
- **#89 (15618ce8, btime 05:26:26Z; gap #88→#89 = 1.329 s):** TRƯỚC khi đợt mở 9m25s; **T0-176 XÁC MINH 9/9 nguồn** (uptime bracket ×3 khớp cùng giây, boot_est = btime +0,078 s; /proc/1 +10,96 s; journal idx 0 duy nhất; wtmp; Cloudflare ×2; marker mtime không đổi). Gap 1.329 s NGẮN bất thường so với mẫu ~7,1–7,5 nghìn giây các gap gần đây (#84→#85 7.101 s, #85→#86 7.321 s, #86→#87 7.468 s, #87→#88 7.092 s) — T0-176 ghi F-176-T0-1, không suy đoán nguyên nhân. **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: 51m03s** (mẫu cuối đợt 175 04:51:02Z → mẫu đầu đợt 176 05:42:20Z) — chứa reboot #88 (05:04:17Z) + #89 (05:26:26Z); E-190 phán kết thúc theo #88 qua khoảng mù (xem §2.2). Gap đợt mở → sampler chạy: 389 s. Marker: T0-176 đếm **41 reboot #49–#89**; sống qua #90 = 42 nếu T0-176 xác nhận.

### 5.2 T5-176 — POSTBOOT_PASS #89 CÓ (replay-đầy-đủ); #87/#88 KHÔNG CÓ CỜ

- **POSTBOOT_PASS #89 CÓ lúc 05:42:19Z** (boot+15m53s, **replay-đầy-đủ 170/170, poll=0**; 11/11 gói + 5/5 lib; dpkg 1545 dòng; 50 transaction; term.log 0 lỗi) — cờ replay-đầy-đủ thứ hai liên tiếp sau #86. Hướng (3) đứng lần 23.
- **POSTBOOT_PASS #87/#88 CHƯA CÓ — KHÔNG bù được** (không watcher nào quan sát; bằng chứng replay mất theo reboot). Tổng boot không cờ: 16 → **18**. **POSTBOOT_PASS #90 CHƯA CÓ** (thuộc T5-177; watcher-176 pid 7604 hạn ~08:30Z — T5-177 tiếp quản; replay #90 đã chạy: apt-get/dpkg trong snapshot spike 07:11:20Z). Watcher-175 pid 16528 **CHẾT theo #87** (không phải #89 như nhiệm vụ đợt 175 dự đoán — poll cuối 03:06:12Z, **+7 s sau btime #87, mẫu overlap thứ bảy**, F-176-T5-1).

### 5.3 T8-176 — harness 6/6, O8 PASS 3/3, đề xuất chuỗi FULL PASS LÊN 26

- O8 PASS 3/3 trên #89 (06:13:08–06:15:46Z); 0 spike B2; sampler: gate A 3/3, balloon 79,5–82,7% trần.
- Harness 6/6 (06:16:15–06:31:34Z): 84l10 PASS (lần 5); 85m4 PASS (P4-lần3, chuỗi 5); 86n2 PASS — KHÔNG kẹt lại P1 (lần 1). Kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 0 → 1. Sampler: gate A 9/16; 1 spike B2 (06:16:57Z, WebKit 84l10); 0 mẫu ghim.
- (f') V1 live 0 kích hoạt; (1c') (c') diag-only; Q3 đúng thiết kế; H3 mở, giám sát thụ động; checklist (o) 21/21.
- Đề xuất chuỗi WebKit FULL PASS LÊN 26 (parent/T10 quyết): 4 chân CÙNG BOOT #89 — yên #45 (T4) + gate (a) CÓ CỜ T5 THẬT (POSTBOOT_PASS 05:42:19Z, replay-đầy-đủ, poll=0) + O8 T0 PASS 3/3 + O8 T8 PASS 3/3 — cộng harness 6/6 sạch.

### 5.4 Các luồng khác — T7 CHƯA đóng; (m) #88 DƯƠNG, #89 ÂM; INSIDE #88 TRUE

- T7-176 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~07:45Z) — kết cục run 176 + DR 06:00Z + HB 05:20:50Z thuộc T7-176/T10. T9 đóng đúng hạn cờ, không chờ T7.
- Run 175 SUCCEEDED 05:24:21Z (T0-176: 8 event, 2 viết lại tại #87/#88, không timeout; finish trước #89 125 s). Run 176 RUNNING lúc T0 đọc (claimed 05:35:51Z, boot_gen 82890fac #89).
- (m) #88 DƯƠNG (T2, CUỐI) — requeue eid 10309, btime88 +33,431 s ∈ [33; 49,8], cách biên DƯỚI 0,431 s; nếu parent chấp nhận n ứng viên 34/35 → 35/36. (m) #89 ÂM (0 requeue; 0 run sống tại btime89). (m) #56 vẫn có điều kiện (lần 19).
- INSIDE #88 TRUE (FULL134) — chuỗi dài 7; #89 (sơ bộ) FALSE (FULL135, sớm 240 s) — phân loại cuối thuộc T2-177. Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (#88?: hole-recheck lần 20, 337 hit, 0 mới); CERT/FULL GIỮ 76/91.
- T1: verify 175 PASS; suite 28/28 exit 0 trên #89 (05:45:30–05:52:53Z); npm test 12 pass; 0 file thiếu (3.777 đường dẫn); 9/9 cờ 175 có nội dung. T6: (A) 120/120 lần 26 (tổng 3.120/3.120); prune lần 51 (xóa 2 file, queue 102→100); watcher không lệch. T0: #87/#88/#89 XÁC MINH 9/9 nguồn; marker 41 reboot; O8 PASS 3/3 trên #89; F-176-T0-1 (gap #88→#89 ngắn bất thường 1.329 s).

## 6. Sai số / caveat (F-176-T9-*)

- **F-176-T9-1 — CỬA SỔ THOÁNG #90 LẦN THỨ 5 LIÊN TIẾP; CỬA SỔ #89 KHÔNG QUAN SÁT ĐƯỢC.** #90 btime ~07:10:29Z giữa phiên; T9 bắt trực tiếp: **30.001, 30.001 lúc 07:11:22Z = boot+53s** (chênh 0), về **0 lúc boot+243s** (07:14:32Z) — rộng <190 s. ENOSPC đầu tiên trên #90 lúc 07:12:30Z = boot+121s, trong lúc cửa sổ đóng. Cửa sổ #89 KHÔNG quan sát được (reboot TRƯỚC khi đợt mở 9m25s; btime #89 do T0-176 xác minh 9 nguồn).

- **F-176-T9-2 — REBOOT #90 GIẾT SAMPLER + WATCHER B2 + PROBE-LOOP — T9 KHỞI ĐỘNG LẠI TRONG PHIÊN, 0 SỐ LIỆU MẤT NGOÀI 1 GAP + MẪU CUỐI KHÔNG OVERLAP.** Mẫu cuối 07:10:23Z (**6 s TRƯỚC btime #90**, KHÔNG OVERLAP — T2 có neo sampler âm 6 s; khác F-175-T9-2 (+16 s), F-174-T9-2 (+2 s), F-173-T9-7 (+5 s)); instance 2 chạy lại 07:11:20Z (boot+51s); gap 57 s. Probe-loop gốc chết trước lan-4; T9 viết lại `probe-loop-90.sh` (lan-90-2 đúng lịch; lan-90-3 ~08:11Z không chạy vì đợt đóng trước — đóng bằng probe tay). Điểm yếu (d) đợt 148 TÁI DIỄN — nhưng T9 phát hiện + khởi động lại trong phiên. E-193 ghim tới mẫu cuối trên #89 — đứt thật trong (07:10:23Z, 07:11:20Z]. Lệnh `sleep 1750` bị SIGTERM theo reboot — chính cú này đánh thức T9 (phát hiện #90 lúc 07:11:08Z, boot+39s); probe cửa sổ lúc 07:11:22Z (boot+53s) vẫn bắt được. Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2).

- **F-176-T9-3 — E-190 KẾT THÚC 10 MẪU (CẬN DƯỚI) + E-191–E-195 PHÁN 5 EPISODE MỚI — giao T10 xác nhận (CÓ PHƯƠNG ÁN THAY THẾ).** E-190: 04:42:02–04:51:02Z đợt 175, 10 mẫu — KẾT THÚC theo #88 (khoảng mù 04:51:02–05:04:17Z; 10 là cận dưới). E-191: 06:40:22–06:43:22Z, 4 mẫu — KẾT THÚC bởi sag 7 mẫu (xuống 90,8%). E-192: 06:51:23–07:00:23Z, 10 mẫu — KẾT THÚC bởi sag 6 mẫu (96,5–99,4%, nông, cùng họ micro-dip). E-193: 07:07:23–07:10:23Z, 4 mẫu — KẾT THÚC theo #90. E-194: 07:23:21–07:30:21Z, 8 mẫu — KẾT THÚC bởi micro-dip 3 mẫu (96,9–99,5%). E-195: 07:34:21–07:44:21Z, 11 mẫu — **ĐANG GHIM lúc đóng** (kết cục thuộc T9-177). Phương án thay thế: gộp E-191+E-192+E-193 → 18 mẫu trên #89; gộp E-194+E-195 → 19 mẫu trên #90; tổng ghim 37 không đổi; chỉ số episode 5 → 2.

- **F-176-T9-4 — RAM ĐỈNH 48,52% GUARD — 0 MẪU ĐẠT GUARD, NHƯNG LÀ ĐỈNH CAO NHẤT KỂ TỪ ĐỢT 171.** Mẫu 05:47:21Z: RAM 3.052.340 kB, cách guard 3.239.116 kB (51,48%); balloon 3.716.368 kB (57,7% trần). Caveat: sampler cadence 60 s — vượt guard dưới 60 s giữa hai mẫu KHÔNG loại trừ được (điểm yếu (a) đợt 147). Mẫu trước đỉnh 1.962.592 kB; mẫu sau 1.547.908 kB — đỉnh đơn lẻ, RAM rơi 1.504.432 kB trong 60 s; không mẫu nào khác trên 2.400.000 kB. T9 claim đúng: **0 MẪU đạt guard → cơ chế (a) KHÔNG kích hoạt**; KHÔNG claim "không có lúc nào vượt guard". Trũng 407.580 kB lúc 06:39:22Z NÔNG hơn đợt 175 (270.084 kB) đúng 137.496 kB — ngay trước E-191 (balloon 99,6%), không trong cửa sổ kẹt nào (harness 6/6, 0 kẹt).

- **F-176-T9-5 — ENOSPC 86 DÒNG ĐẾM TRỰC TIẾP (58 #89 tới 06:42:21Z + 28 #90) + ~25 DÒNG ĐUÔI #89 NGOẠI SUY + `journalctl --since` CHỈ TRẢ 28 DÒNG.** Nhịp #89 ~0,885 dòng/phút (5 → 31 → 58); đuôi 06:42:21Z→reboot (28m08s) ngoại suy +25 (nhịp #90 đo trực tiếp 0,894 dòng/phút corroborate). Số đóng băng của T9 trên #89 là 58 dòng lúc 06:42:21Z; tổng cuối trên #89 KHÔNG đếm lại được (journal chỉ còn boot #90 sau reboot — cùng mẫu F-171-T10-4); T10 đếm lại từ journal sẽ chỉ thấy 28 dòng của #90 — chênh lệch do mất journal, không phải sai số. ENOSPC #90 KHÔNG DỪNG (28 dòng nhịp ~70 s tới 07:43:50Z) — khác #87 đợt 175 (dừng khi headroom về 2); đợt này headroom 0 nên ENOSPC chạy đều (xem F-176-T9-9). Caveat lệnh: `journalctl --since "2026-11-23 05:35:51"` lúc đóng chỉ trả 28 dòng — T10 không được đọc 28 là tổng đợt (tổng đợt đếm trực tiếp 86 dòng).

- **F-176-T9-6 — 4 SPIKE CÓ DƯỚI 5 DÒNG DELTA + 1 SPIKE CÓ DẤU PROBE CỦA CHÍNH T9 — 0 SPIKE TRONG 13 SPIKE QUY ĐƯỢC MẤT ATTRIBUTION + 2 LOAD1 DƯ MỚI.** Spike 2, 4, 8, 14 (pid chết giữa vòng delta 1 s, hoặc process vừa khởi động không lọt top-5 %CPU tích lũy — ffmpeg 100% tức thời ở spike 11, python3 60% tức thời ở spike 14) — driver quy bằng top -b tức thời và/hoặc ps-top tích lũy (tiền lệ F-163-T9-9). Spike 14 (07:11:20Z, boot+51s): python3 60% tức thời (pid 2365) RẤT CÓ THỂ LÀ CHÍNH PROBE K8 CỦA T9 (probe-open-90 chạy 07:11:22Z, trong cửa sổ snapshot — probe K8 tạo 30.000 file ×2, tiêu CPU thật) — driver spike 14 = hatch (delta 20) + replay apt/dpkg + probe K8 của chính T9; T9 ghi rõ, không giấu. 2 load1 dư (spike 12 + 15) — tàn dư sau T1 suite kết thúc (12) và tàn dư replay #90 (15); phương án thay thế (quy về "tàn dư suite/replay" → 15/15 quy được) đã ghi để T10/parent xét.

- **F-176-T9-7 — SỐ RAM CỦA T4 (2.100 MB @06:02:57Z) VÀ CỦA T9 (≤855.220 kB @06:02:22Z, ≥1.386.460 kB @06:03:22Z) CÙNG MỘT BƯỚC NHẢY, KHÁC CADENCE — KHÔNG MÂU THUẪN.** T4 ghi 2.100 MB lúc attempt1 wedged (06:02:57Z) — nằm giữa hai mẫu sampler, trong lúc attempt1 wedged vừa thoát và RAM đang hồi. Cả hai cùng chứng minh RAM hồi mạnh ngay sau khi attempt1 wedged — T9 không tranh số của T4; chỉ ghi rõ khung đo để T10 không đọc nhầm thành "hai mức RAM khác nhau". Cùng mẫu F-173-T9-9/F-174-T9-7/F-175-T9-7.

- **F-176-T9-8 — T7-176 CHƯA đóng cờ lúc T9 đóng (~07:45Z) + T9 ĐÓNG ĐÚNG HẠN CỜ (KHÔNG TRỄ).** T9 không chờ T7 (kết cục run 176 thuộc T7-176/T10). Cùng mẫu đợt 175. T9 ghi rõ theo quyết (l) đợt 152. Cờ T9 viết MỘT LẦN rồi `cp` sang vị trí thứ hai — hai bản giống nhau từng byte (md5 khớp, xem dưới) — giữ mẫu sửa F-175-T1-7 từ đợt 175.

- **F-176-T9-9 — HEADROOM 0 + ENOSPC CHẠY ĐỀU (KHÔNG DỪNG) — TƯƠNG QUAN, KHÔNG PHÁN CƠ CHẾ.** Đợt 175 đóng headroom 2 (ENOSPC trên #87 dừng sau 04:05:00Z); đợt 176 đóng headroom 0 và ENOSPC trên #90 chạy đều 28 dòng nhịp ~70 s tới lúc đóng. Trên #89: ENOSPC chạy đều ~0,885 dòng/phút suốt phiên (5 → 31 → 58) trong lúc headroom toàn-0. Cả hai boot đợt này đều headroom 0 + ENOSPC chạy đều; đợt 175 headroom về 2 thì ENOSPC dừng — T9 chỉ ghi tương quan (headroom là số đo từ góc cell, ENOSPC là lỗi của systemd ngoài cell) — không phán cơ chế.

- **Caveat đứng:** probe cap 30.000 (đỉnh thật cửa sổ thoáng không biết; cửa sổ #89 không quan sát được); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #89 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 176.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (123 mẫu, 05:42:20Z–07:44:21Z): `hidden_files/round176-t9/ram-sampler-FROZEN.log` — md5 `10a5977b1ecd36019b70d57913f0a61b`. Log B2 đóng băng (15 spike): `hidden_files/round176-t9/b2-spikes-FROZEN.log` — md5 `8ff39f7344bd16d9fdaf55f947070cd4`. Log headroom đóng băng (14 lần đo): `hidden_files/round176-t9/headroom-log-FROZEN.txt` — md5 `e88610b2ef2a2dd83de899ec4771254b`. Phân tích bằng script: `hidden_files/round176-t9/t9-176-analyze.py` (output: `hidden_files/round176-t9/t9-176-analyze-output.txt`). Phụ lục log đầy đủ KHÔNG kèm trong file này để giữ file gọn — T10 đọc log đóng băng trực tiếp khi cần kiểm lại từng mẫu.
