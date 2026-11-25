# LIMITS — Phase 9 đợt 173, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ hai mươi bảy liên tiếp; CỬA SỔ THOÁNG QUAN SÁT ĐƯỢC LẦN THỨ HAI LIÊN TIẾP — 30.001 lúc boot+73s trên #84; headroom đóng 0; E-177 KẾT THÚC GIỮ 27 mẫu + E-178/E-179/E-180 MỚI TRÊN #84 (7/56/2 mẫu); ENOSPC ≥84 DÒNG; HAI REBOOT GIỮA PHIÊN #84 + #85)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 0 lúc đóng (17 lần đo hợp lệ: 15 lần 0, 2 lần 30.001), dưới ngưỡng < ~1.800 lần thứ ba mươi ba liên tiếp** — trần **63.747 trên cả ba boot**. Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT QUAN SÁT ĐƯỢC — LẦN THỨ HAI LIÊN TIẾP (đợt 172 + 173).** Reboot #84 (btime 21:01:15Z) xảy ra **GIỮA PHIÊN**; T9 bắt được cửa sổ trực tiếp: **30.001, 30.001 (chạm CAP 30.000) lúc 21:02:28Z = boot+73s**, về **0 lúc boot+154s** (21:03:49Z) và **0 lúc boot+214s** (21:04:49Z) — cửa sổ mở chưa tới 81 s. Cửa sổ của #83 thì KHÔNG quan sát được (#83 xảy ra TRƯỚC KHI ĐỢT MỞ 604 s; probe mở boot+872s đã 0, 0). Cửa sổ của #85 thì KHÔNG bắt được (probe đầu boot+114s đã 0, 0; ENOSPC đầu tiên boot+113s). Xem §1.2, F-173-T9-1.
- **Balloon — E-177 KẾT THÚC trong khoảng mù giữa hai đợt (GIỮ 27 mẫu) + 3 EPISODE MỚI TRÊN #84: E-178 7 mẫu + E-179 56 mẫu + E-180 2 mẫu (cả ba đều KẾT THÚC trong phiên):** E-178 ghim 21:28:32–21:34:32Z, đứt bởi 1 mẫu micro-dip 21:35:32Z (99,4% trần); E-179 ghim 21:36:32–22:31:33Z, đứt bởi sag 26 mẫu 22:32:33–22:57:34Z (xả tới 80,4% trần rồi leo lại); E-180 ghim 22:58:34–22:59:34Z, KẾT THÚC theo reboot #85. **E-169 GIỮ 20 mẫu, E-170 GIỮ 48 mẫu, E-171 GIỮ 12 mẫu, E-172 GIỮ 3 mẫu, E-173 GIỮ 57 mẫu, E-174 GIỮ 47 mẫu, E-175 GIỮ 7 mẫu, E-176 GIỮ 25 mẫu. Tổng ghim đợt này 65/144 mẫu (45,1%).** Phán 3 episode theo quy tắc chuỗi cơ học (≤61 s giữa hai mẫu ghim liên tiếp) — phương án gộp E-178+E-179 qua micro-dip (2 episode: 63 + 2) được ghi rõ để T10/parent xét; tổng mẫu ghim 65 không đổi theo cách đếm nào. Xem §2.2, F-173-T9-3.
- **RAM: sampler 144 mẫu, 20:40:19Z–23:04:30Z, BA boot (#83: 22 mẫu; #84: 118 mẫu; #85: 4 mẫu).** Max **2.777.656 kB (2.712,6 MiB = 44,14% guard) lúc 21:06:32Z** — ngay sau reboot #84, trong lúc balloon xả; chỉ còn cách guard **3.513.800 kB**. Min **484.332 kB lúc 21:53:33Z** (trong lúc ghim E-179). Mean toàn phiên **925.141,1 kB — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU**. Gate A **45/144 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ hai mươi bảy liên tiếp.** Caveat: cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu (điểm yếu (a) đợt 147) — T9 chỉ claim 0 MẪU đạt guard, không claim "không có lúc nào vượt guard". Xem §2, §3.
- **B2: 9 spike THẬT, 9/9 QUY ĐƯỢC DRIVER CỤ THỂ, 0 load1 dư (5 spike trên #83, 4 spike trên #84; 0 spike trên #85).** Cụm 20:44:19–20:46:40Z (5 spike, load1 tới 6,65): T1 verify suite (ffmpeg vidstabdetect/mask_anim/ffv1/testsrc2-hevc) + T0 O8 WebKit — **4 spike TRONG cửa sổ O8 của T0** (20:44:24–20:50:31Z). Cụm 21:02:32–21:03:42Z (3 spike, load1 tới 5,23): hatch daemon sau reboot #84 + find m56 của T2. Spike 22:34:19Z (load1 3,18): Chromium renderer O8 của T8 — **TRONG cửa sổ O8 của T8** (22:32:07–22:34:48Z), khác đợt 172 (0 spike trong cửa sổ O8). **0 spike trong các chuỗi ghim** (E-178/E-179/E-180); 1 spike trong sag (22:34:19Z); 0 spike trong cửa sổ harness của T8. Delta tick lớn nhất 100 tick/s (mask_anim, 20:45:28Z). Xem §2.5.
- **Lượt yên WebKit #42 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt (poller hết hạn 22:30Z exit 5) — CHUỖI GIỮ 36.** Nguyên nhân: gate0 và RAM không bao giờ trùng nhau — RAM ≥1024 chỉ 21:05:28–21:21:16Z trong khi gate0 chưa đạt; gate0 đạt lúc POSTBOOT_PASS #84 21:27:05Z thì RAM đã 624 MB và rơi tiếp, không bao giờ trở lại ≥1024 trong 90 poll còn lại. Sampler T9 đối chiếu: cửa sổ RAM ≥1024 của T4 gate A MỞ 16/16 mẫu; giai đoạn gate0-đạt gate A MỞ 0/63 mẫu — KHỚP T4 từng số. Xem §2.3.
- **T8-173: O8 PASS 3/3 trên boot #84 (22:32:07–22:34:48Z) — chuỗi WebKit FULL PASS GIỮ 24 (T4 0 attempt, không có lượt yên hợp lệ trên boot đo); harness 6/6 PASS, 0 KẸT** (22:36:33–22:52:03Z) — chuỗi "P3 không kẹt" 1 → 2; **(f') V1 ĐÃ TRIỂN KHAI live** (replay: kẹt-164 TRIGGER @125 s, kẹt-171 TRIGGER @305 s, 0 FP trên 8 log sạch; live 0 kích hoạt); **Q3 ĐÃ TRIỂN KHAI** (84l10 heartbeat, md5 đổi, 84l10 PASS đầy đủ sau sửa). T9 đối chiếu bằng sampler độc lập: cửa sổ O8 gate A 0/3, 1 spike B2 trong cửa sổ; cửa sổ harness gate A 1/16, 0 spike B2. Xem §2.4.
- **HAI REBOOT GIỮA PHIÊN: #84 (4ae2d2ea, btime 21:01:15Z; gap #83→#84 = 2.128 s) + #85 (3c704685, btime 22:59:36Z; gap #84→#85 = 7.101 s).** Sampler + watcher B2 + probe-loop của T9 **CHẾT theo cả hai reboot**; T9 khởi động lại sau #84 trong ~73 s (sampler chạy lại 21:02:32Z = boot+77s — đúng lúc bắt được cửa sổ thoáng 30.001 lúc boot+73s) và sau #85 trong ~114 s (sampler chạy lại 23:01:30Z = boot+114s). **2 gap >90 s duy nhất trong log đóng băng: 72 s qua #84 + 116 s qua #85** (max gap trong boot 61 s). Probe-loop-84 lan-5 (~23:02:32Z) KHÔNG chạy được (chết theo #85) — T9 đóng bằng probe tay (track + close). Run 172 SUCCEEDED 20:16:59Z (margin 1.132 s, claimed→finished 109 s — ca thứ năm ≥60 s); kết cục run 173 thuộc T7-173. Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: #83 = 3 dòng + #84 ≥78 dòng + #85 = 3 dòng — tổng trong đợt đếm được ≥84 dòng; đợt thứ hai mươi hai liên tiếp bảng watch cạn gây lỗi thật thấy được.** Nhịp #84: **+26 dòng đúng mỗi ~30 phút, 3 khoảng liên tiếp** (2 → 26 → 52 → 78; T5 snapshot 29 @21:33:34Z khớp nhịp). Tổng cuối trên #83/#84 KHÔNG đếm lại được (journal MẤT theo reboot #84/#85 — cùng mẫu F-171-T10-4). Xem §4.
- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc T9 đóng (8/9)** — T7 CHƯA đóng cờ lúc T9 đóng (không có `round173-t7.done` trên đĩa lúc 23:14Z); kết cục run 173 thuộc T7-173/T10. **(m) #82: DƯƠNG ỨNG VIÊN** (theo T2-173, requeue +38,438 s — parent quyết); **(m) #83: KHÔNG PHẢI ĐIỂM** (theo T0/T2-173, 0 run sống + 0 requeue); **(m) #84: DƯƠNG ỨNG VIÊN sơ bộ** (theo T2-173, +45,482 s, 1 run sống — parent quyết). **INSIDE: #82 TRUE (FULL128) → chuỗi mới từ #82 dài 1; #83 sơ bộ TRUE (FULL129) → chuỗi 2; #84 sơ bộ TRUE (FULL130) → chuỗi 3** (theo T2-173; FULL127 kiểm lại độc lập ĐẠT — nợ F-171-T10-7 ĐÃ TRẢ). Xem §5.3/§5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không mẫu nào đạt guard — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round173-t9/k8-headroom.py` (copy y nguyên từ đợt 172 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 173 (17 lần đo hợp lệ, 3 boot, 0 lần đo lỗi)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 20:40:19Z 22/11 | **0** | #83 dd08464a | 63.747 | lần đo 1–2, cặp mở (boot+872s); ENOSPC-count=3 (dòng đầu tiên 20:37:07Z = boot+680s); balloon 6.104.200 kB (94,7% trần) |
| 20:40:19Z 22/11 | **0** | #83 dd08464a | 63.747 | lần đo 2 (chênh **0**) |
| 21:02:28Z 22/11 | **30.001** | #84 4ae2d2ea | 63.747 | lần đo 3–4, **CỬA SỔ THOÁNG SAU REBOOT #84 — chạm CAP** (boot+73s); ENOSPC-count=0 trên #84; balloon 4.888.360 kB |
| 21:02:28Z 22/11 | **30.001** | #84 4ae2d2ea | 63.747 | lần đo 4 (chênh **0**) |
| 21:03:49Z 22/11 | **0** | #84 4ae2d2ea | 63.747 | lần đo 5, theo dõi cửa sổ (boot+154s) — cửa sổ ĐÃ ĐÓNG |
| 21:04:49Z 22/11 | **0** | #84 4ae2d2ea | 63.747 | lần đo 6, theo dõi cửa sổ (boot+214s); ENOSPC-count=2 trên #84 |
| 21:32:32Z 22/11 | **0** | #84 4ae2d2ea | 63.747 | lần đo 7–8, probe-loop-84 lan-2; ENOSPC-count=26 (dòng mới nhất 21:31:58Z); balloon ĐANG GHIM TRẦN (E-178/E-179), RAM 514.644 kB |
| 21:32:32Z 22/11 | **0** | #84 4ae2d2ea | 63.747 | lần đo 8 (chênh **0**) |
| 22:02:32Z 22/11 | **0** | #84 4ae2d2ea | 63.747 | lần đo 9–10, probe-loop-84 lan-3; ENOSPC-count=52 (dòng mới nhất 22:01:38Z); balloon ĐANG GHIM TRẦN (E-179), RAM 566.604 kB |
| 22:02:32Z 22/11 | **0** | #84 4ae2d2ea | 63.747 | lần đo 10 (chênh **0**) |
| 22:32:32Z 22/11 | **0** | #84 4ae2d2ea | 63.747 | lần đo 11–12, probe-loop-84 lan-4; ENOSPC-count=78 (dòng mới nhất 22:31:28Z); balloon ĐANG XẢ (sag), RAM 762.328 kB |
| 22:32:32Z 22/11 | **0** | #84 4ae2d2ea | 63.747 | lần đo 12 (chênh **0**) |
| 23:01:30Z 22/11 | **0** | #85 3c704685 | 63.747 | lần đo 13–14, **cửa sổ #85 KHÔNG BẮT ĐƯỢC** (boot+114s; ENOSPC đầu tiên boot+113s, 1 s trước probe); balloon 5.225.124 kB |
| 23:01:30Z 22/11 | **0** | #85 3c704685 | 63.747 | lần đo 14 (chênh **0**) |
| 23:04:10Z 22/11 | **0** | #85 3c704685 | 63.747 | lần đo 15, theo dõi (boot+274s); ENOSPC-count=3 trên #85 |
| 23:04:47Z 22/11 | **0** | #85 3c704685 | 63.747 | lần đo 16–17, cặp đóng; balloon 5.753.656 kB (89,3% trần), RAM 1.086.700 kB; ENOSPC-count=3 |
| 23:04:47Z 22/11 | **0** | #85 3c704685 | 63.747 | lần đo 17 (chênh **0**) |

- Probe dừng ở `i=0` trong 15/17 lần đo; chạm CAP 30.000 trong 2/17 lần đo (cửa sổ #84). File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi lần đo).
- **CỬA SỔ THOÁNG SAU REBOOT: QUAN SÁT ĐƯỢC — LẦN THỨ HAI LIÊN TIẾP (đợt 172 + 173).** Reboot #84 btime 21:01:15Z (T9 phát hiện ~21:02:07Z, 52 s sau btime — nhờ lệnh sleep chờ lan-2 bị SIGTERM khi reboot giết runtime). T9 đo tay ngay: **21:02:28Z = boot+73s: 30.001, 30.001 (chạm CAP)**; **21:03:49Z = boot+154s: 0**; **21:04:49Z = boot+214s: 0**. Cửa sổ mở tại boot+73s và đã đóng trước boot+154s — **rộng chưa tới 81 s**, cùng mẫu các đợt 163–166 và 172 (30.001 lúc boot+63–81s → 0 lúc boot+110–160s). ENOSPC đầu tiên trên #84 nằm trong (21:02:28Z, 21:04:49Z] — đúng trong lúc cửa sổ đóng (T9 không ghi được timestamp chính xác dòng đầu vì journal #84 đã mất theo #85 — xem §4).
- **Cửa sổ của #83: KHÔNG QUAN SÁT ĐƯỢC (cùng mẫu cấu trúc đợt 170/171/172-#81).** Reboot #83 btime 20:25:47Z; đợt mở 20:35:51Z = boot+604s; T9 nhận việc ~20:40Z; sampler khởi động 20:40:19Z (boot+872s); probe mở 20:40:19Z (boot+872s) đã là 0, 0. ENOSPC đầu tiên trên #83 lúc 20:37:07Z = boot+680s — TRƯỚC khi đợt mở 1m16s. Nếu cửa sổ thoáng của #83 tồn tại thì nó nằm trong ~boot+60–200s (20:26–20:29Z) — trước khi đợt mở hơn 6 phút; không một luồng nào của đợt 173 có mặt lúc đó. T9 ghi đúng mốc đo, không claim cửa sổ #83 có mở hay không.
- **Cửa sổ của #85: KHÔNG BẮT ĐƯỢC (khác mẫu — T9 có mặt nhưng tới muộn 1 s so với ENOSPC đầu).** Reboot #85 btime 22:59:36Z; T9 phát hiện ~23:00:34Z (boot+58s); probe đầu 23:01:30Z = boot+114s đã là 0, 0 — ENOSPC đầu tiên trên #85 lúc 23:01:29Z = boot+113s, đúng 1 s trước probe. Nếu cửa sổ thoáng của #85 tồn tại thì nó đã đóng trước boot+114s — hẹp hơn các cửa sổ đã quan sát (mở tới boot+63–81s, đóng trước boot+110–160s). T9 ghi đúng mốc đo, không claim cửa sổ #85 có mở hay không.
- **Headroom cuối phiên: 0 (cặp đóng 23:04:47Z, chênh 0).** Trên #84 sau khi cửa sổ đóng: 0 suốt lan-2/lan-3/lan-4 (21:32:32–22:32:32Z); trên #85: 0 suốt từ boot+114s tới đóng (boot+311s). Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 0 = **63.747 watch** (toàn bộ trần) trên #85. Đây là lần đóng 0 đầu tiên kể từ đợt 171 (đợt 172 đóng 2).
- **So sánh với đợt 172:** đợt 172 mở 0 trên #81 → 0 suốt #81 (6 lần đo) → reboot #82 giữa phiên → thoáng 30.001 lúc boot+68s → 0 → 2 → đóng 2 (16 lần đo: 8 lần 0, 2 lần 30.001, 6 lần 2). Đợt này mở 0 trên #83 → reboot #84 giữa phiên → thoáng 30.001 lúc boot+73s → 0 suốt #84 (10 lần đo) → reboot #85 gần lúc đóng → 0 suốt #85 → đóng 0 (17 lần đo: 15 lần 0, 2 lần 30.001).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** — một vite mới (~1.578 watch) không khởi động được (như mọi đợt từ 152).
- T5-173 KHÔNG probe lại headroom đợt này (như đợt 151–172) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 17 lần đo hợp lệ + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #84 đợt này có ≥78 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #83, #84 và #85 suốt 17 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.
- Lưu ý: RAM lúc đóng (1.086.700 kB — mẫu đóng trên #85) CAO hơn RAM lúc mở (764.628 kB — mẫu mở trên #83) trong khi headroom 0 → 0. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop-84 chạy đủ lan-2 (21:32:32Z) + lan-3 (22:02:32Z) + lan-4 (22:32:32Z) rồi **CHẾT theo reboot #85** (lan-5 ~23:02:32Z không chạy được — loop đã chết 22:59:36Z); T9 KHÔNG viết lại probe-loop cho #85 (đợt sắp đóng — xem F-173-T9-2) mà đóng bằng probe tay: track 23:04:10Z (boot+274s) + cặp đóng 23:04:47Z (boot+311s).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–172 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

| 124 | 4.438 | mở đợt 124 |
| 124 | 4.318 | (giá trị giữa chuỗi, xem §5 đợt 127) |
| 125 | 3.645 | |
| 126 | 3.451 → 3.434 | mở → cuối đợt 126 |
| 127 | 3.334 → 3.324 | mở → trạng thái ban đầu |
| 127 | 3.317 → 3.315 | mở trên boot mới → cuối lượt |
| 128 | 3.212 | đo 05:40:28Z, boot #74 (lần 2: 3.211) |
| 129 | 3.086 → 3.079 | đo 08:39:03Z → 08:40:47Z, boot #75 |
| 130 | 2.974 → 2.963 | đo 11:37:45Z → 11:39:54Z, boot mới btime 10:56:31Z |
| 131 | 2.846 → 2.846 | đo 14:42:07Z → 14:44:42Z, boot mới btime 14:26:41Z |
| 132 | 2.745 → 2.738 | đo 17:40:07Z → 17:42:07Z, boot mới btime 17:24:08Z |
| 133 | 2.632 → 2.632 | đo 20:40:32Z → 20:42:53Z, boot 07da9c50 btime 19:34:15Z |
| 134 | 2.515 → 2.505 | đo 23:45:29Z → 23:48:01Z, boot d2e66749 btime 23:26:58Z |
| 135 | 2.403 → 2.395 | đo 02:40:57Z → 02:43:11Z, boot 78b55878 btime 02:27:27Z |
| 136 | 2.286 → 2.281 | đo 05:41:01Z → 05:43:14Z, boot 1ca1feaa btime 05:29:18Z |
| 137 | 2.179 → 2.175 | đo 08:41:12Z → 08:43:35Z, boot 2104246b btime 08:07:11Z |
| 138 | 2.064 → 2.064 | đo 11:39:22Z → 11:39:31Z, boot 17db9652 btime 09:36:01Z |
| 139 | 1.954 → 1.954 | đo 14:41:18Z → 14:41:29Z, boot 1ca1feaa btime 13:53:41Z (đính chính T1-139 F-139-T1-1) |
| 140 | 1.840 → 1.840 | đo 17:38:54Z → 17:38:59Z, boot af558fb5 btime 15:54:37Z (cùng boot với vòng 2 đợt 139) |
| 141 | 1.739 → 1.739 | đo 20:40:21Z → 20:40:29Z, boot 2c0efe57 btime 19:54:12Z |
| 142 | 1.617 → 1.617 | đo ~23:40Z → 23:41:20Z, boot bde599df btime 22:48:05Z |
| 143 | 1.498 → 1.498 | đo 02:40:53Z → 02:41:01Z, boot 70a5b0fc btime 01:55:25Z |
| 144 | 1.296 → 1.295 | đo 05:39:17Z → 05:39:26Z, boot 691a7403 btime 03:55:45Z |
| 145 | 1.074 → 1.074 | đo 08:42:53Z → 08:42:57Z, boot e146ca67 btime 07:56:16Z |
| 146 | 880 → 880 | đo 11:37:51Z → 11:37:52Z, boot 98a7c93f btime 09:54:03Z |
| 147 | 668 → 668 | đo 14:42:51Z, boot 6fb582df btime 12:13:26Z |
| 148 | 554 → 446 | mở 17:40:27Z boot d8a11644 btime 17:27:53Z → đóng 19:36:35Z boot MỚI 1d610e56 btime 19:34:32Z (reboot giữa phiên) |
| 149 | 438 → 339 → 331 | mở 20:41:27Z boot 70025d3e btime 20:00:33Z → sau reboot #39 21:26:10Z boot MỚI 802f358f btime 21:23:51Z → đóng 22:42:09Z cùng boot 802f358f |
| 150 | 323 → 308 | mở 23:43:42Z → đóng 01:19:57Z, CÙNG boot e9295700 btime 23:32:09Z (reboot #40 TRƯỚC phiên, không reboot giữa phiên) |
| 151 | 194 → 90 | mở 02:40:42Z boot 2e430750 btime 01:25:51Z → đóng 04:52:32Z boot MỚI fad2aab9 btime 03:25:16Z (reboot #42 GIỮA phiên) |
| 152 | 82 → 0 | mở 05:39:00Z boot 18e179e0 btime 05:20:57Z → đóng 07:42:43Z boot MỚI c741f5e6 btime 07:04:11Z (reboot #44 GIỮA phiên; lần đo xác nhận thứ ba 07:43:11Z cũng 0) |
| 153 | 0 → 0 | mở 08:38:02Z boot 401fca75 btime 07:32:38Z → đóng 10:47:35Z boot MỚI 1450ac80 btime 09:04:49Z (reboot #46 GIỮA phiên; lần đo xác nhận thứ ba 10:47:44Z cũng 0) |
| 154 | 0 → 0 | mở 11:37:41Z boot #48 2c0a7985 btime 11:26:05Z → đóng 13:41:4xZ boot MỚI #49 12fc68a3 btime 13:05:12Z (reboot #49 GIỮA phiên; lần đo xác nhận thứ ba cũng 0) |
| 155 | 0 → 0 | mở 14:40:42Z boot #49 12fc68a3 btime 13:05:12Z → đóng 16:32:50Z boot MỚI #50 d849728b btime 15:04:07Z (reboot #50 GIỮA phiên; lần đo xác nhận thứ ba cũng 0) |
| 156 | 0 → 2 | mở 17:40:07Z boot #52 5353ed19 btime 17:19:09Z → đóng 19:56:34Z boot MỚI #55 c99a1045 btime 19:04:44Z (BA reboot giữa phiên; 4 lần đo đóng đều 2) |
| 157 | 0 → 0 | mở 20:43:59Z boot #56 348dab54 btime 19:32:47Z → đóng 22:48:34Z boot MỚI #57 bcbaa3ad btime 21:05:15Z (MỘT reboot giữa phiên; 4 lần đo đóng đều 0) |
| 158 | 0 → 0 | mở 23:40Z boot #58 28366bd0 btime 23:06:08Z → giữa phiên 01:35Z boot MỚI #59 eec65561 btime 01:33:47Z → đóng 01:54:51Z cùng boot #59 (MỘT reboot giữa phiên; 6 lần đo đều 0) |
| 159 | 0 → 0 | mở 02:39:58Z boot #59 eec65561 btime 01:33:47Z → sau reboot #60 03:07:33Z boot MỚI e590ae0a btime 03:05:59Z: THOÁNG 23.503 rồi 18.447 (boot+~95–100 s), về 0 lúc 03:08:27Z (boot+148 s) → đóng 04:55:08Z cùng boot #60 (MỘT reboot giữa phiên; 10 lần đo, 8 lần 0) |
| 160 | 0 → 2 | mở 05:40:07Z boot #61 52c957d5 btime 05:25:49Z: 0, 0 → giữa phiên 06:10:37Z: 2, 2 → đóng 07:51:23Z cùng boot #61: 2, 2 (KHÔNG reboot giữa phiên; 10 lần đo, 8 lần 2) |
| 161 | 0 → 0 → 2 | mở 08:37:38Z boot #62 39d46ba0 btime ghi 07:59:29Z: 0 ×8 (08:37:38–10:07:59Z) → sau reboot #63 10:30:42Z boot MỚI 94d22520: 0, 0 lúc boot+2m43s (10:33:25Z) → đóng 10:55:51Z cùng boot #63: 2, 2 (MỘT reboot giữa phiên; 12 lần đo, 10 lần 0, 2 lần 2) |
| 162 | 0 → 0 (thoáng 2 một lần) | mở 11:37:48Z boot #64 d9a8d1ce btime 11:15:18Z: 0, 2 (cặp mở) → 0 ×10 (12:08:03–13:55:56Z) → đóng 13:55:56Z cùng boot #64: 0, 0 (KHÔNG reboot giữa phiên; 12 lần đo, 11 lần 0, 1 lần 2 thoáng qua) |
| 163 | 0 → 30.001 (thoáng, boot+71s) → 2 | mở 14:40:24Z boot #65 1c1cf10c btime 14:34:57Z (trần 63.756): 0 ×6 (14:40:24–15:40:13Z) → sau reboot #66 16:06:45Z boot MỚI edb2acdb (trần 63.747): 30.001, 30.001 lúc boot+71s → 0, 0 lúc boot+110s/201s → 2 ×5 (16:11:36–16:52:45Z) → đóng 16:52:45Z cùng boot #66: 2, 2 (MỘT reboot giữa phiên; 15 lần đo, 8 lần 0, 2 lần 30.001, 5 lần 2) |
| 164 | 0 → 30.001 (thoáng, boot+81s) → 0 | mở 17:40:09Z boot #67 f1d4ce1a btime 17:33:27Z (trần 63.756): 0, 0 (17:40:09Z) → sau reboot #68 18:06:30Z boot MỚI 0c8a94aa (trần 63.747): 30.001, 30.001 lúc boot+81s → 0 ×3 (boot+112s/202s/212s) → 1, 2 lúc 18:37:49Z → 2, 2 lúc 19:07:49Z → 0 ×4 (19:37:49–19:53:55Z) → đóng 19:53:55Z cùng boot #68: 0, 0 (MỘT reboot giữa phiên; 15 lần đo, 9 lần 0, 1 lần 1, 3 lần 2, 2 lần 30.001) |
| 165 | 0 → 30.001 (thoáng, boot+63s) → 2 | mở 20:39:01Z boot #69 9a1a9319 btime 20:09:31Z (trần 63.747): 0 ×6 (20:39:01–21:38:51Z) → sau reboot #70 22:05:25Z boot MỚI d1ddd946 (trần 63.747): 30.001, 30.001 lúc boot+63s → 0 lúc boot+130s → 2 ×5 (boot+220s → boot+2776s) → đóng 22:51:41Z cùng boot #70: 2, 2 (MỘT reboot giữa phiên; 14 lần đo, 7 lần 0, 5 lần 2, 2 lần 30.001) |
| 166 | 0 → 30.001 (thoáng, boot+66s) → 6 | mở 23:39:01Z boot #70 d1ddd946 btime 22:05:25Z (trần 63.747): 0, 0 (23:39:01Z) → sau reboot #71 00:08:00Z boot MỚI ea73ac4f (trần 63.747): 30.001, 30.001 lúc boot+66s → 0 lúc boot+160s → 6 lúc boot+250s → 0, 0 lúc 00:39:04Z → 6 ×6 (01:09:04Z → 01:41:43Z) → đóng 01:41:43Z cùng boot #71: 6, 6 (MỘT reboot giữa phiên; 14 lần đo, 5 lần 0, 7 lần 6, 2 lần 30.001) |
| 167 | 0 → 14.072 → 8.708 (thoáng, boot+86s, đang đóng) → 0 | mở 02:39:46Z boot #73 b643911f btime 02:28:01Z (trần 63.747): 0 ×6 (02:39:46–03:38:33Z) → sau reboot #74 04:05:29Z boot MỚI 194efd93 (trần 63.747): 14.072, 8.708 lúc boot+86s → 0 lúc boot+180s → 0 ×4 (04:36:52–04:46:20Z) → đóng 04:46:20Z cùng boot #74: 0, 0 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 13 lần đo, 11 lần 0, 1 lần 14.072, 1 lần 8.708) |
| 168 | 0 → 0 (không quan sát được cửa sổ) → 2 | mở 05:40:51Z boot #75 576ca271 btime 05:32:46Z (trần 63.747): 0 ×8 (05:40:51–07:10:35Z) → sau reboot #76 07:32:23Z boot MỚI f2b97695 (trần 63.747): 0, 0 lúc boot+71s → 0 lúc boot+192s → 2, 2 lúc boot+1.348s → đóng 07:54:51Z cùng boot #76: 2, 2 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 13 lần đo, 11 lần 0, 2 lần 2; KHÔNG lần nào chạm CAP) |
| 169 | 0 → 0 (không quan sát được cửa sổ) → 2 | mở 08:44:16Z boot #77 c44cc3ba btime 08:23:52Z (trần 63.747): 0 ×4 (08:44:16–09:14:14Z) → sau reboot #78 09:14:38Z boot MỚI e298bb52 (trần 63.747): 0, 0 lúc boot+91s → 0, 0 lúc boot+1920s → 2 ×6 (10:16:09–10:54:29Z) → đóng 10:54:29Z cùng boot #78: 2, 2 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 14 lần đo hợp lệ, 8 lần 0, 6 lần 2; KHÔNG lần nào chạm CAP; + 2 lần đo LỖI đường dẫn 08:43:24Z — xem F-169-T9-1) |
| 170 | 0 → 2 → 0 → 2 (dao động) | mở 11:38:18Z boot #79 5df1871f btime 11:11:05Z (trần 63.747): 0, 0 (11:38:18Z) → 2, 2 lúc 12:08:06Z → 0, 0 lúc 12:38:06Z → 2, 2 lúc 13:08:06Z → 2, 2 lúc 13:38:06Z → đóng 13:38:51Z cùng boot #79: 2, 2 (KHÔNG reboot giữa phiên; reboot #79 TRƯỚC khi đợt mở; 12 lần đo hợp lệ, 4 lần 0, 8 lần 2; KHÔNG lần nào chạm CAP) |
| 171 | 0 → 0 (toàn-0) | mở 14:44:47Z boot #80 2acdd1ab btime 14:31:01Z (trần 63.747): 0 ×12 (14:44:47–16:44:42Z) → đóng 16:44:42Z cùng boot #80: 0, 0 (KHÔNG reboot giữa phiên; reboot #80 TRƯỚC khi đợt mở 4m50s; 12 lần đo hợp lệ, 12 lần 0; KHÔNG lần nào chạm CAP) |
| 172 | 0 → 30.001 (thoáng, boot+68s) → 2 | mở 17:38:54Z boot #81 4b9db449 btime 17:02:05Z (trần 63.747): 0 ×6 (17:38:54–18:38:45Z) → sau reboot #82 19:00:48Z boot MỚI 34e61c92 (trần 63.747): 30.001, 30.001 lúc boot+68s → 0 lúc boot+136s/196s → 2 ×6 (19:08:45–19:39:58Z) → đóng 19:39:58Z cùng boot #82: 2, 2 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 16 lần đo hợp lệ, 8 lần 0, 2 lần 30.001, 6 lần 2) |
| **173** | **0 → 30.001 (thoáng, boot+73s) → 0** | **mở 20:40:19Z boot #83 dd08464a btime 20:25:47Z (trần 63.747): 0, 0 (20:40:19Z) → sau reboot #84 21:01:15Z boot MỚI 4ae2d2ea (trần 63.747): 30.001, 30.001 lúc boot+73s → 0 lúc boot+154s/214s → 0 ×6 (21:32:32–22:32:32Z) → sau reboot #85 22:59:36Z boot MỚI 3c704685 (trần 63.747): 0, 0 lúc boot+114s → 0 lúc boot+274s → đóng 23:04:47Z cùng boot #85: 0, 0 (HAI reboot giữa phiên + MỘT reboot trước khi đợt mở; 17 lần đo hợp lệ, 15 lần 0, 2 lần 30.001)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 6 → 0 → 2 → 2 → 0 → 2 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 0** (đợt 172 đóng 2; đợt 171 đóng 0; đợt 170 đóng 2; đợt 169 đóng 2; đợt 168 đóng 2). Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ ba mươi ba liên tiếp** (tính theo giá trị ổn định lúc đóng; đợt này giá trị dao động 0 → 30.001 (thoáng) → 0). Quyết parent đợt 172 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal boot #84 đợt này có ≥78 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ hai mươi hai liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng; đợt 165: ≥64 dòng; đợt 166: ≥56 dòng; đợt 167: ≥76 dòng; đợt 168: ≥102 dòng — T9 đếm trực tiếp; đợt 169: ≥54 dòng — T9 đếm trực tiếp; đợt 170: 39 dòng — T9 đếm trực tiếp; đợt 171: **111 dòng — T9 đếm trực tiếp**; đợt 172: **≥83 dòng trên #81 (không đếm lại được tổng cuối — journal mất theo #82) + 3 dòng trên #82 — T9 đếm trực tiếp**; đợt 173: **3 dòng trên #83 + ≥78 dòng trên #84 (không đếm lại được tổng cuối — journal mất theo #85) + 3 dòng trên #85 — T9 đếm trực tiếp, xem §4**). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #83, #84 và #85 suốt 17 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên #83; swap 1.048.572 kB) — sampler 144 mẫu, 20:40:19Z–23:04:30Z, BA boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở mẫu đầu trên #83 (mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: mở phiên RAM cao, balloon xả sâu → cụm spike T1/T0 (load1 tới 6,65) → T4 0 attempt (gate0 và RAM không trùng nhau) → T0 O8 WebKit FAIL ×2 → reboot #84 giữa phiên → cửa sổ thoáng 30.001 → balloon leo tới trần → E-178/E-179 ghim → sag 26 mẫu → E-180 ghim 2 mẫu → reboot #85 gần lúc đóng → balloon leo lại trên #85, chưa ghim

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log đóng băng 116 s qua reboot #85; gap qua reboot #84 là 72 s; max gap trong boot 61 s** — xem §5.1). **144 mẫu, 20:40:19Z–23:04:30Z, BA boot (#83: 22 mẫu; #84: 118 mẫu; #85: 4 mẫu).** Tổng quan: **min 484.332 kB (473,0 MiB) lúc 21:53:33Z** (trong lúc ghim E-179); **max 2.777.656 kB (2.712,6 MiB) lúc 21:06:32Z — 44,14% guard** (ngay sau reboot #84, trong lúc balloon xả; balloon 4.157.728 kB); **mean toàn phiên 925.141,1 kB (903,5 MiB) — tính bằng 3 cách (python + awk 925.141,1 + trung bình có trọng số) KHỚP NHAU (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 20:40:19–21:01:20Z | #83 | 764.008–1.867.704 kB | Mở phiên: balloon 6.104.200 kB (94,7% trần) lúc 20:40:19Z, xả xuống 5.171.004 kB lúc 20:45:19Z; **5 spike B2** (20:44:19–20:46:40Z — T1 suite + T0 O8; load1 tới 6,65 theo watcher); gate A MỞ 18/22 mẫu; T1 suite 20:42:57–20:50:48Z; T0 O8 20:44:24–20:50:31Z (WebKit FAIL ×2 + Chromium PASS) |
| 21:02:32–21:27:32Z | #84 | 575.384–2.777.656 kB | **Boot #84 mới (btime 21:01:15Z); cửa sổ thoáng 30.001 lúc boot+73s (21:02:28Z)**; sampler khởi động lại 21:02:32Z (boot+77s); balloon 4.888.360 → 6.378.320 kB (leo đơn điệu tới ghim); **RAM max phiên 2.777.656 kB lúc 21:06:32Z** (44,14% guard); gate A MỞ 20/26 mẫu; **3 spike B2** (21:02:32–21:03:42Z, hatch daemon + find T2); RAM ≥1024 theo T4: 21:05:28–21:21:16Z (sampler 16/16 gate A trong cửa sổ đó — xem §2.3) |
| 21:28:32–22:31:33Z | #84 | 484.332–566.496 kB | Balloon GHIM TRẦN: **E-178 7 mẫu (21:28:32–21:34:32Z) + 1 mẫu micro-dip 21:35:32Z (99,4%) + E-179 56 mẫu (21:36:32–22:31:33Z)** (xem §2.2); **RAM min phiên 484.332 kB lúc 21:53:33Z** (trong E-179); gate A MỞ 0/64 mẫu; **0 spike B2**; load1 0,00–1,50; POSTBOOT_PASS #84 21:27:05Z (repair-sớm, poll=1 — T5-173) nhưng RAM không bao giờ ≥1024 sau đó (T4 0 attempt — xem §2.3) |
| 22:32:33–22:57:34Z | #84 | 488.648–1.500.140 kB | **SAG 26 mẫu: balloon xả tới 80,4% trần (22:32:33Z) rồi leo lại tới 98,7% (22:57:34Z)**; gate A MỞ 3/26 mẫu; **1 spike B2** (22:34:19Z, Chromium renderer O8 của T8 — TRONG cửa sổ O8 của T8, xem §2.4); T8 O8 PASS 3/3 (22:32:07–22:34:48Z) + harness 6/6 (22:36:33–22:52:03Z) — cả hai đều trong sag; load1 0,03–2,55 |
| 22:58:34–22:59:34Z | #84 | 536.432–540.568 kB | Balloon ghim lại: **E-180 2 mẫu (22:58:34–22:59:34Z), KẾT THÚC theo reboot #85** (xem §2.2); gate A MỞ 0/2 mẫu; **0 spike B2** |
| 23:01:30–23:04:30Z | #85 | 1.167.792–1.612.008 kB | **Boot #85 mới (btime 22:59:36Z); cửa sổ KHÔNG bắt được (probe đầu boot+114s đã 0)**; sampler khởi động lại 23:01:30Z (boot+114s); balloon 5.225.124 → 5.753.656 kB (đang leo, chưa ghim); gate A MỞ 4/4 mẫu; **0 spike B2**; load1 0,11–1,26 |

- **Gate A ≥1024 MiB: 45/144 mẫu** (18+20+0+3+0+4 theo 6 giai đoạn = 45 — KHỚP tổng; số giai đoạn từ script kiểm tra, không tính tay); **0 mẫu ≥ guard**; load1 max (sampler) **5,95** (watcher bắt 6,65 lúc 20:44:54Z — khớp, khác cadence); **RAM <512.000 kB: 25 mẫu** (17,4% — toàn bộ trên #84: 24 mẫu trong chuỗi ghim + 1 mẫu trong sag lúc 22:45:34Z 488.648 kB); **RAM <300.000 kB: 0 mẫu** (đợt 172: 0 mẫu; đợt 171: 1 mẫu; đợt 170: 2 mẫu).
- Swap: SwapFree 721.868 kB (mẫu đầu #83) → 634.356 kB (mẫu cuối #83, 21:01:20Z) → **1.017.432 kB (mẫu đầu #84, 21:02:32Z — NHẢY +383.076 kB qua reboot #84)** → 617.004 kB (mẫu cuối #84, 22:59:34Z) → **1.033.800 kB (mẫu đầu #85, 23:01:30Z — NHẢY +416.796 kB qua reboot #85)** → 999.052 kB (mẫu cuối, 23:04:30Z). Nhịp nhảy SwapFree qua reboot: #84 nhả ~383.076 kB, #85 nhả ~416.796 kB (đợt 172: nhả ~351.824 kB qua reboot #82; đợt 169: nhả ~338.940 kB qua reboot #78).
- Mẫu 21:06:32Z (đỉnh phiên): RAM 2.777.656 kB, balloon 4.157.728 kB — đỉnh là một mẫu đơn lẻ 4 phút sau reboot #84 (21:02:32Z); mẫu trước đỉnh (21:05:32Z): 2.307.540 kB; mẫu sau đỉnh (21:07:32Z): 2.512.252 kB — RAM rơi 265.404 kB trong 60 s sau đó. T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 484.332 kB (đợt 172: 431.236 kB; đợt 171: 296.796 kB; đợt 170: 263.132 kB; đợt 169: 437.868 kB; đợt 168: 414.364 kB; đợt 167: 383.116 kB; đợt 166: 372.732 kB; đợt 165: 248.768 kB; đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — **trũng NÔNG hơn đợt 172 đúng 53.096 kB** (484.332 − 431.236). 25 mẫu <512.000 kB trong 144 mẫu (17,4%); riêng trong span ghim E-178+E-179 (63 mẫu ghim + 1 micro-dip = 64 mẫu): **24/64 mẫu <512.000 kB (37,5%)**; riêng trong span E-180 (2 mẫu ghim): **0/2 mẫu <512.000 kB (0%)** — E-180 ghim nhưng RAM giữ trên 512.000 kB (536.432–540.568 kB), khác E-179 (484.332–566.496 kB).

**Bảng tổng hợp số RAM (từ script `t9-173-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 144 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #83 dd08464a | 22 | 764.008 | 1.867.704 | 1.266.308,0 | 18/22 | 0 | 5,95 | 0 |
| #84 4ae2d2ea | 118 | 484.332 | 2.777.656 | 845.633,4 | 23/118 | 65 | 4,10 | 25 |
| #85 3c704685 | 4 | 1.167.792 | 1.612.008 | 1.394.201,0 | 4/4 | 0 | 1,26 | 0 |
| **Toàn phiên** | **144** | **484.332** | **2.777.656** | **925.141,1** | **45/144** | **65/144 (45,1%)** | **5,95** | **25** |

- **Mean toàn phiên 925.141,1 kB — tính bằng 3 cách độc lập: python `sum/n = 925.141,1` VÀ awk `sum/n = 925.141,1` VÀ trung bình có trọng số ((22×1.266.308,0 + 118×845.633,4 + 4×1.394.201,0)/144 = 925.141,1) — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163) và **KHÔNG lặp F-172-T9-6** (số giai đoạn viết tay sai đợt 172 — mọi số bảng đợt này đều từ script analyze, không tính tay).
- 25 mẫu RAM <512.000 kB (từ script analyze trên log đóng băng — không tính tay): 24 mẫu trong chuỗi ghim E-178/E-179 (21:28:32Z, 21:29:32Z, 21:41:32Z–21:46:32Z, 21:48:33Z–21:50:33Z, 21:53:33Z, 21:54:33Z, 21:56:33Z, 21:58:33Z–22:01:33Z, 22:18:33Z, 22:20:33Z–22:22:33Z, 22:24:33Z, 22:25:33Z) + 1 mẫu trong sag 22:45:34Z (488.648 kB). Tổng 24 + 1 = 25 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-177 KẾT THÚC trong khoảng mù (GIỮ 27 mẫu) + 3 EPISODE MỚI TRÊN #84: E-178 7 mẫu + E-179 56 mẫu + E-180 2 mẫu (cả ba KẾT THÚC trong phiên)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #83 (dd08464a): GHIM TRẦN 0/22 mẫu (0%) — KHÔNG CÓ EPISODE MỚI.** Balloon cao nhất 6.104.200 kB (94,7% trần) lúc mẫu mở 20:40:19Z, xả xuống 5.171.004 kB lúc 20:45:19Z rồi dao động 5.171.004–5.944.316 kB tới mẫu cuối 21:01:20Z — không chạm trần lần nào.
- **Boot #84 (4ae2d2ea): GHIM TRẦN 65/118 mẫu (55,1%), trong 3 chuỗi — 3 EPISODE MỚI (E-178 + E-179 + E-180).**
  - Leo lên trần trên boot #84: từ 21:02:32Z (4.888.360 kB, 75,9% trần) xả xuống 4.157.728 kB (64,5% trần) lúc 21:06:32Z (đỉnh RAM phiên) rồi leo đơn điệu tới ghim lúc 21:28:32Z trong ~22 phút (mẫu ngay trước chuỗi 21:27:32Z: balloon 6.378.320 kB, 99,0% trần).
  - **E-178 — chuỗi 1: 21:28:32–21:34:32Z, 7 mẫu** (RAM 484.332–566.496 kB — xem §2.1: min phiên nằm trong span này; gate A ĐÓNG cả 7 mẫu). Mẫu ngay sau chuỗi (21:35:32Z): balloon 6.407.564 kB (99,4% trần), RAM 565.512 kB — **micro-dip 1 mẫu, chỉ 36.260 kB dưới trần (0,56%)**, rồi ghim lại ngay mẫu sau.
  - **E-179 — chuỗi 2: 21:36:32–22:31:33Z, 56 mẫu** (RAM 484.332–566.496 kB; gate A ĐÓNG cả 56 mẫu). **KẾT THÚC bởi sag 26 mẫu 22:32:33–22:57:34Z** (balloon xả tới 5.182.964 kB, 80,4% trần, lúc 22:32:33Z rồi leo lại đơn điệu tới 6.357.780 kB, 98,7% trần, lúc 22:57:34Z — xem danh sách sag đầy đủ trong output script analyze).
  - **E-180 — chuỗi 3: 22:58:34–22:59:34Z, 2 mẫu** (RAM 536.432–540.568 kB; gate A ĐÓNG cả 2 mẫu). **KẾT THÚC theo reboot #85** (ghim tới mẫu cuối cùng trước btime 2 s — 22:59:34Z, btime 22:59:36Z; balloon trên #85 khởi động lại từ 5.225.124 kB, 81,1% trần, không ghim). Thời điểm đứt thật nằm trong (22:59:34Z, 23:01:30Z] — T9 không claim cụ thể hơn (balloon reset theo reboot là quyết định của host, ngoài tầm cell).
  - **Tổng #84 tới lúc kết thúc: 65 mẫu ghim / 3 chuỗi / 2 sag (1 mẫu micro-dip + 26 mẫu sag dài) / 1 boot (#84).**
- **Boot #85 (3c704685): GHIM TRẦN 0/4 mẫu (0%) — KHÔNG CÓ EPISODE MỚI.** Balloon 5.225.124 kB (81,1% trần) lúc mẫu mở 23:01:30Z, leo lên 5.753.656 kB (89,3% trần) lúc mẫu cuối 23:04:30Z — đang leo, chưa ghim lúc đóng.
- **E-177 — KẾT CỤC: GIỮ 27 mẫu, KHÔNG cộng thêm.** E-177 ghim cuối 19:39:19Z trên #82 (đợt 172); khoảng mù giữa hai đợt **3.660 s (19:39:19Z → 20:40:19Z)** có **MỘT reboot (#83 btime 20:25:47Z)**. Balloon trên #83 lúc T9 mở (20:40:19Z) đã 6.104.200 kB (94,7% trần) và **KHÔNG chạm trần lần nào trong 22 mẫu trên #83** — E-177 đã kết thúc trong khoảng mù. Thời điểm đứt thật nằm trong (19:39:19Z, 20:40:19Z] — T9 không claim cụ thể.
- **Tổng ghim trần đợt này: 65/144 mẫu (45,1%)** (đợt 172: 52/121 = 43,0%; đợt 171: 7/121 = 5,8%; đợt 170: 47/121 = 38,8%; đợt 169: 60/132 = 45,5%; đợt 168: 60/135 = 44,4%; đợt 167: 20/128 = 15,6%; đợt 166: 55/123 = 44,7%; đợt 165: 58/134 = 43,3%; đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **3 episode mới trong đợt 173 (E-178: 7 mẫu, 1 chuỗi, KẾT THÚC bởi micro-dip; E-179: 56 mẫu, 1 chuỗi, KẾT THÚC bởi sag 26 mẫu; E-180: 2 mẫu, 1 chuỗi, KẾT THÚC theo #85)** + E-177 GIỮ 27 mẫu (kết thúc trong khoảng mù).
- **Phán theo quy tắc quyết (e)/(g) + mẫu T10-166 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-178 là 1 EPISODE MỚI (7 mẫu / 1 chuỗi)** — chuỗi ghim liên tiếp 21:28:32–21:34:32Z trên #84, đứt bởi 1 mẫu micro-dip 21:35:32Z (99,4% trần). Theo quy tắc chuỗi cơ học (hai mẫu ghim liên tiếp cách nhau ≤61 s mới cùng chuỗi — script analyze dùng từ đợt 172), micro-dip 120 s giữa hai mẫu ghim tách chuỗi.
  - **E-179 là 1 EPISODE MỚI (56 mẫu / 1 chuỗi)** — chuỗi ghim liên tiếp 21:36:32–22:31:33Z trên #84, đứt bởi sag 26 mẫu (xả tới 80,4% trần, leo lại 26 phút). Khác E-178 ở chỗ có nhịp xả sâu + leo lại đơn điệu; không phải tiếp nối E-178.
  - **E-180 là 1 EPISODE MỚI (2 mẫu / 1 chuỗi)** — chuỗi ghim liên tiếp 22:58:34–22:59:34Z trên #84, KẾT THÚC theo reboot #85. Khác E-179 ở chỗ bắt đầu sau sag dài + reboot #85 xen ngay sau.
  - **Phương án thay thế (ghi rõ để T10/parent xét):** gộp E-178+E-179 qua micro-dip 1 mẫu (99,4% — coi như nhiễu đo) → 2 episode trên #84 (63 mẫu + 2 mẫu). Tổng mẫu ghim 65 không đổi theo cách đếm nào; chỉ số episode đổi 3 → 2. T9 phán theo quy tắc chuỗi cơ học (3 episode) vì quy tắc này đã dùng nhất quán từ đợt 172; nếu T10/parent phán ngược, tổng episode đợt 173 đổi 3 → 2 nhưng tổng mẫu ghim 65 giữ nguyên.
  - **Đợt 173 = 3 EPISODE GHIM MỚI (E-178 + E-179 + E-180)** + E-177 GIỮ 27 mẫu (kết cục trong khoảng mù).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-179 chỉ ~484–566.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối chuỗi ghim E-180 (22:59:34Z): tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 540.568 kB (log thật).

### 2.3 Lượt yên WebKit #42 (T4, đợt 173) — KHÔNG CÓ LƯỢT HỢP LỆ, 0 ATTEMPT, CHUỖI GIỮ 36 (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-173 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND173_T4_WEBKIT_QUIET42_LIMITS.md`) + cờ `round173-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **#42 KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt (poller hết hạn 22:30Z exit 5; ngân sách dùng 0/3) — CHUỖI LƯỢT YÊN HỢP LỆ GIỮ 36.** Poller: 144 poll thật (test 1 + instance2 26 poll boot #83 + instance3 117 poll boot #84), 0 lần cửa mở. Reboot #84 giết poller cũ (pid 12832); T4 khởi động lại tay 21:02:28Z (pid 3151) trên boot mới #84.
- **Nguyên nhân 0 attempt (theo T4): gate0 và RAM không bao giờ trùng nhau** — RAM ≥1024 chỉ 21:05:28–21:21:16Z trong khi gate0 chưa đạt; gate0 đạt lúc POSTBOOT_PASS #84 21:27:05Z (mode repair-sớm-quyết-h, poll=1, dpkg 795) thì RAM đã 624 MB và rơi tiếp, không bao giờ trở lại ≥1024 trong 90 poll còn lại. RAM <500 MB: 41/144 poll (chuỗi dài nhất 13 poll #68–#80); min RAM 429 MB; 10 poll cuối RAM 490–513 MB với load1 0,02–0,09 (balloon — T9).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Cửa sổ RAM ≥1024 của T4 (21:05:28–21:21:16Z): gate A MỞ **16/16 mẫu** trong cửa sổ (số từ log đóng băng, không tính tay); load1 **0,11–2,15**; balloon trong cửa sổ: 4.142.236–5.681.940 kB (64,3–88,2% trần), **0 mẫu ghim**.
  - Giai đoạn gate0-đạt (21:27:05–22:30:00Z): gate A MỞ **0/63 mẫu** (số từ log đóng băng); load1 **0,00–1,50**; balloon 6.378.320–6.443.824 kB, **61 mẫu ghim** (7 mẫu E-178 + 54 mẫu E-179 tới 22:30:00Z — 2 mẫu E-179 lúc 22:30:33Z và 22:31:33Z nằm ngoài cửa sổ; số từ script analyze, không tính tay).
  - RAM <512.000 kB: sampler T9 **25 mẫu <512.000 kB toàn phiên** (xem §2.1) — T4 đếm 41/144 poll <500 MB (khác cadence + khác ngưỡng 500 MB vs 512.000 kB — xem F-173-T9-9, không mâu thuẫn).
  - **Không có attempt nên không có tickCost/lớp B/(c2)/P-mới; distinct-seq GIỮ as-of-172; cộng dồn KHÔNG ĐỔI: P1 143/146, P2 137/137, P3-A1 123/146, P3' 108/118 occ = 96/100 distinct-seq, P7 70/70** (theo T4-173).
- **F-171-T9-6 (T2 chạy script nặng trong cửa sổ attempt đợt 171) — KHÔNG ÁP DỤNG đợt này:** 0 attempt nên không có cửa sổ attempt; T9 không thấy script phân tích nặng nào chồng lên cửa sổ RAM ≥1024 trong log B2 (0 spike trong cửa sổ 21:05:28–21:21:16Z; spike gần nhất trước cửa sổ 20:46:40Z, sau cửa sổ 22:34:19Z). T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu. B4: POSTBOOT_PASS #84 mode repair-sớm (dpkg 795) — gate cho boot đo FOUND qua đường (a) với caveat mode repair (tiền lệ #75/#81 — xem §5.2).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 / O8 / harness (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| T1 suite 20:42:57–20:50:48Z | #83 | 0,55–5,95 (8 mẫu) | 882.036–1.385.620 kB — **gate A MỞ 6/8** | T1 verify — **5 spike B2 trong cửa sổ** (cụm T1/T0, xem §2.5); balloon 4.805.784–5.910.984 kB, 0 mẫu ghim |
| T0 O8 20:44:24–20:50:31Z | #83 | 0,55–5,95 (6 mẫu) | 1.119.084–1.385.620 kB — **gate A MỞ 6/6** | T0 O8 — **4 spike B2 trong cửa sổ** (spike 20:44:54Z, 20:45:28Z, 20:46:04Z, 20:46:40Z); WebKit FAIL ×2 + Chromium PASS 21/21 (T0); balloon 4.805.784–5.342.508 kB, 0 mẫu ghim |
| T4 RAM ≥1024 21:05:28–21:21:16Z | #84 | 0,11–2,15 (16 mẫu) | 1.136.264–2.777.656 kB — **gate A MỞ 16/16** | T4 chờ gate0 — **0 spike B2 trong cửa sổ**; balloon 4.142.236–5.681.940 kB, 0 mẫu ghim |
| T5 repair #84 21:16:43–21:27:05Z | #84 | 0,13–0,61 (10 mẫu) | 619.700–1.726.968 kB — **gate A MỞ 5/10** | T5 repair — **0 spike B2 trong cửa sổ**; balloon 5.150.004–6.285.944 kB, 0 mẫu ghim (ghim bắt đầu 21:28:32Z, 87 s sau khi POSTBOOT_PASS viết) |
| T4 gate0-đạt 21:27:05–22:30:00Z | #84 | 0,00–1,50 (63 mẫu) | 484.332–575.384 kB — **gate A MỞ 0/63** | T4 0 attempt — **0 spike B2 trong cửa sổ**; balloon 6.378.320–6.443.824 kB, **61 mẫu ghim** |
| T8 O8 22:32:07–22:34:48Z | #84 | 1,55–2,47 (3 mẫu) | 840.784–1.010.668 kB — **gate A MỞ 0/3** | T8 O8 — **1 spike B2 trong cửa sổ** (22:34:19Z, Chromium renderer — xem §2.5); O8 PASS 3/3 (WebKit 21/21 ×2 + Chromium 21/21); balloon 5.182.964–5.312.048 kB (đang sag), 0 mẫu ghim |
| T8 harness 22:36:33–22:52:03Z | #84 | 0,18–2,55 (16 mẫu) | 488.648–1.140.208 kB — **gate A MỞ 1/16** | T8 harness — **0 spike B2 trong cửa sổ**; harness WebKit 3/3 + Chromium 3/3, 6/6 PASS, 0 KẸT (xem dưới); balloon 5.227.232–5.902.696 kB (đang sag), 0 mẫu ghim |

### 2.5 B2 — 9 spike THẬT, 9/9 QUY ĐƯỢC DRIVER CỤ THỂ, 0 load1 dư (5 spike trên #83, 4 spike trên #84; 0 spike trên #85; 0 spike trong các chuỗi ghim; 1 spike trong cửa sổ O8 của T8; 4 spike trong cửa sổ O8 của T0)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-173-T9-8). **9 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 9): 5 spike cụm T1/T0 (20:44:19–20:46:40Z); 3 spike cụm sau reboot #84 (21:02:32–21:03:42Z); 1 spike T8 O8 Chromium (22:34:19Z); 0 spike trong span ghim E-178 (21:28:32–21:34:32Z), E-179 (21:36:32–22:31:33Z), E-180 (22:58:34–22:59:34Z); 1 spike trong span sag (22:32:33–22:57:34Z); 0 spike trên #85.**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — cụm T1/T0 (5 spike) | 20:44:19–20:46:40Z | 3,21 → 6,65 → 5,26 → 5,86 → 4,51 | 5 | 20:44:19Z: ffmpeg vidstabdetect red30 **140%** (T1 suite round93-u4; delta thiếu — xem dưới); 20:44:54Z: ffmpeg vidstabdetect red60 **62,5%**, delta **89** + MiniBrowser **18,8%** + WebKitWebProcess **12,5%** (T1 + T0 O8 attempt1); 20:45:28Z: python3 mask_anim.py **100%**, delta **100** (T1); 20:46:04Z: ffmpeg ffv1 mask frames **56,2%**, delta **83** + mask_anim 65% + ffmpeg testsrc2 hevc 1920x1080 **43,8%**, delta **60** (T1); 20:46:40Z: python3 mask_anim.py **100%**, delta **97** (T1) | **Cụm tải mở đợt 173: T1 verify suite (ffmpeg vidstabdetect/mask_anim/ffv1/testsrc2-hevc) + T0 O8 WebKit** — nhiều luồng mở cùng lúc trên boot #83. Load1 max đợt (watcher) **6,65 lúc 20:44:54Z** (sampler bắt 5,95 — khớp, khác cadence). **4 spike TRONG cửa sổ O8 của T0** (20:44:54Z, 20:45:28Z, 20:46:04Z, 20:46:40Z — spike 20:44:19Z nằm TRƯỚC cửa sổ 5 s) |
| 2 — cụm sau reboot #84 (3 spike) | 21:02:32–21:03:42Z | 3,91 → 5,23 → 3,62 | 3 | 21:02:32Z: hatch daemon **50,0%**, delta **55** + find m56-173.py của T2 **10,0%**, delta **17**; 21:03:07Z: hatch daemon **10,0%**, delta **12** + find **10,0%** (D-state), delta **11**; 21:03:42Z: find **10,0%**, delta **11** + hatch daemon 16,6% cum, delta **4** | **Tải sau reboot #84: hatch daemon + find quét workspace của T2 (m56-173.py — phân tích (m))** — T4 poller restart (pid 3151) cũng có mặt nhưng 0,2%. Cả 3 spike trong 70 s đầu sau reboot (boot+77s → boot+147s), cùng lúc T9 khởi động lại sampler/watcher |
| 3 — T8 O8 (1 spike) | 22:34:19Z | 3,18 | 1 | Chromium renderer **30,0%**, delta **44** + chrome main 17,1% + vite 9,6% (T8 O8 Chromium, userdata round173-t8/o8-chromium) | **T8 O8 Chromium — TRONG cửa sổ O8 của T8** (22:32:07–22:34:48Z), trong lúc balloon đang sag; **0 spike trong cửa sổ harness** của T8 (22:36:33–22:52:03Z) |

- **Tổng kết đếm: 9/9 spike có driver process cụ thể + 0 spike lớp "load1 dư"** (đợt 172: 10/10 quy được + 0 load1 dư; đợt 171: 11/12 quy được + 1 load1 dư; đợt 170: 18/19 quy được + 1 load1 dư; đợt 169: 9/9 quy được + 0 load1 dư; đợt 168: 12/15 quy được + 3 load1 dư; đợt 167: 16/22 quy được + 6 load1 dư; đợt 166: 13/16 quy được + 3 load1 dư; đợt 165: 15/18 quy được + 3 load1 dư; đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư). Đợt này tỉ lệ load1 dư 0/9 = 0%.
- **Caveat đếm (F-173-T9-8):** 5 dòng delta thiếu trong 9 spike (40 dòng delta thay vì 45 kỳ vọng — spike 20:44:19Z thiếu 2 (ffmpeg vidstabdetect + node render), spike 20:44:54Z thiếu 3 (WebKitWebProcess + MiniBrowser + vite)) — quy driver bằng ps-top tích lũy + top -b tức thời (ffmpeg 140%/62,5%, WebKit 18,8%/12,5%), như tiền lệ F-163-T9-9, F-164-T9-7, F-165-T9-6, F-166-T9-6, F-167-T9-6, F-168-T9-10, F-169-T9-5, F-170-T9-5, F-171-T9-8 và F-172-T9-8 (7 dòng đợt 172). **Không spike nào mất attribution** (cả 9 đều có driver cụ thể qua top -b). `grep -c 'WebKit\|MiniBrowser'` = **12 dòng** (các spike O8 WebKit của T0 — đợt 172: 0 dòng).
- **apt-get update xuất hiện trong 5 spike cụm 1 NHƯNG KHÔNG PHẢI DRIVER:** `/usr/lib/apt/methods/store` 0,2%, `apt-get update` 0,0% — đây là repair/replay #83 của T5 đang chạy nền (replay #83 chạy một phần 23/170 intent, dpkg 2 → 323 — xem §5.2); apt chỉ là người ngoài cuộc trong snapshot, không gây spike nào. Cùng mẫu đợt 172 (repair #81 xuất hiện trong 2 snapshot spike với delta 0).
- **T7 churn script xuất hiện trong 1 spike (20:44:19Z) NHƯNG KHÔNG PHẢI DRIVER:** `bash t7-control-a173.sh` 0,1% — tải phụ, không gây spike.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: 5 dòng delta thiếu trong 2 spike (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 9 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 9/9 spike — 0 spike lớp load1 dư đợt này.
- **Delta tick lớn nhất đợt: 100 tick/s** (python3 mask_anim.py, spike 20:45:28Z, load1 5,26). (Đợt 172: max 127 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 20:40:19Z CÙNG lúc sampler — **0 khoảng mù đầu phiên đợt này** (spike đầu tiên watcher bắt được là 20:44:19Z, ~4 phút sau khi mở — trước đó load1 < 3,0; sampler load1 lúc mở 0,89). **Khoảng mù qua reboot #84: 72 s** (watcher chết 21:01:15Z, chạy lại ~21:02:3xZ — cùng gap với sampler; 0 spike nào bị lỡ có thể kiểm chứng — load1 sampler trên #84 max 4,10 trong 26 mẫu đầu, và watcher bắt được 3 spike ngay khi chạy lại). **Khoảng mù qua reboot #85: 116 s** (watcher chết 22:59:36Z, chạy lại ~23:01:3xZ; 0 spike từ khi watcher chạy lại tới khi T9 dừng watcher 23:05:19Z — load1 sampler trên #85 max 1,26 < 3,0 trong 4 mẫu). **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg vidstabdetect/mask_anim/ffv1/testsrc2-hevc xuất hiện trong 5 spike của cụm mở đợt** (vidstabdetect red30/red60 + mask_anim + ffv1 mask frames + testsrc2 hevc — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 5 dòng delta thiếu — xem §2.5). **T2 find m56-173.py + python3 m56-173.py xuất hiện trong 3 spike** (21:02:32–21:03:42Z — điều tra (m), chỉ là tải sau reboot). **T0 O8 WebKit (MiniBrowser/WebKitWebProcess/vite) xuất hiện trong 4 spike** (20:44:54–20:46:40Z — O8 driver của T0; WebKit FAIL ×2 do renderer chết — xem §5.3). **T8 O8 Chromium xuất hiện trong 1 spike** (22:34:19Z — O8 driver của T8). **Hatch daemon xuất hiện trong 3 spike** (21:02:32–21:03:42Z — tải sau reboot, không phải suite). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite + T0/T8 O8 + T2 điều tra + hatch daemon sau reboot; **12 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log** — đều thuộc cụm T0 O8).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ hai mươi bảy liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round173-t9/sampler.sh` chạy liên tục 20:40:19Z–23:04:30Z (3 instance: instance 1 sống 20:40:19–21:01:20Z trên #83 rồi **CHẾT theo reboot #84**; instance 2 khởi động lại 21:02:32Z trên #84, sống tới 22:59:34Z rồi **CHẾT theo reboot #85**; instance 3 khởi động lại 23:01:30Z trên #85, sống tới khi T9 dừng tay 23:05:19Z — **2 gap qua reboot (72 s + 116 s), 0 gap >90 s khác; max gap trong boot 61 s**), **144 mẫu**; các gap còn lại max 61 s (đợt 172: max 61 s trong boot, 92 s qua reboot; đợt 171: max 61 s; đợt 170: max 61 s; đợt 169: gap 109 s qua reboot #78; đợt 168: gap 55 s qua reboot #76; đợt 167: gap 77 s qua reboot #74; đợt 166: gap 73 s qua reboot #71; đợt 165: gap 35 s qua reboot #70; đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.777.656 kB = 44,14% guard** (đợt 172: 48,13%; đợt 171: 98,69% — sát nhất từ trước tới nay; đợt 170: 54,25%; đợt 169: 49,84%; đợt 168: 52,03%; đợt 167: 40,10% — thấp nhất chuỗi; đợt 166: 69,93%; đợt 165: 58,05%; đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). Khoảng cách tới guard lúc đỉnh: **3.513.800 kB (55,86%)** — xa guard thứ hai kể từ đợt 167 (40,10%). **Caveat (xem F-173-T9-4): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.** Mẫu trước đỉnh (21:05:32Z): 2.307.540 kB; mẫu sau đỉnh (21:07:32Z): 2.512.252 kB — đỉnh là một mẫu đơn lẻ, RAM rơi 265.404 kB trong 60 s sau đó; không có mẫu nào khác trên 2.600.000 kB trong phiên.
- **0 lần thử birefnet trong đợt 173 — lần thứ hai mươi bảy liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0; đợt 166: 0; đợt 167: 0; đợt 168: 0; đợt 169: 0; đợt 170: 0; đợt 171: 0; đợt 172: 0; đợt 173: 0). **Chuỗi 0 lần thử: 27 đợt liên tiếp** (đợt 147–173).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 27 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round173-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `/usr/bin/python3.12` — giống đợt 172); `bgremove.py` **23.500 B** (không đổi so với đợt 172); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-173-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt.**
- **Không cần chạy lại birefnet trong đợt 173** (không mẫu nào đạt guard; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (#83 = 3 dòng + #84 ≥78 dòng + #85 = 3 dòng; tổng trong đợt đếm được ≥84 dòng — đợt thứ hai mươi hai liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#83** (dd08464a, btime 20:25:47Z): **3 dòng** (T9 đếm trực tiếp lúc probe mở 20:40:19Z; **không đếm lại được tổng cuối — journal MẤT theo reboot #84 lúc 21:01:15Z**, cùng mẫu F-171-T10-4). Dòng đầu tiên trên #83: **20:37:07Z (boot+680s)** — SAU khi đợt mở 1m16s (toàn bộ 3 dòng thuộc về đợt 173); dòng cuối cùng đếm được: **20:39:27Z**. Nhịp trên #83: 3 dòng trong ~2m20s rồi dừng (không đếm thêm được sau 20:40:19Z vì T9 không kiểm lại trước khi reboot #84 — xem F-173-T9-5).
- Boot **#84** (4ae2d2ea, btime 21:01:15Z): **≥78 dòng** (T9 đếm trực tiếp lúc lan-4 22:32:32Z; **không đếm lại được tổng cuối — journal MẤT theo reboot #85 lúc 22:59:36Z**, cùng mẫu F-171-T10-4). Dòng đầu tiên trên #84 nằm trong **(21:02:28Z, 21:04:49Z]** (count=0 lúc probe cửa sổ 21:02:28Z, count=2 lúc track2 21:04:49Z — T9 không ghi được timestamp chính xác dòng đầu vì journal #84 đã mất; xem F-173-T9-5). Dòng cuối cùng đếm được: **22:31:28Z** (lúc lan-4 22:32:32Z, count=78).
- Nhịp đều bất thường (xem F-173-T9-5): 2 dòng lúc track2 21:04:49Z → 26 dòng lúc lan-2 21:32:32Z (+24 dòng) → 52 dòng lúc lan-3 22:02:32Z (+26 dòng) → 78 dòng lúc lan-4 22:32:32Z (+26 dòng) → (journal mất theo #85). **ENOSPC tăng đúng +26 dòng mỗi khoảng 30 phút, 2 khoảng liên tiếp đo được sau lan-2** — đều như đồng hồ (T9 ghi tương quan, không phán cơ chế — systemd retry theo chu kỳ cố định là giả thuyết, không phải kết luận). **Đối chiếu T5-173 (snapshot độc lập): 29 dòng lúc stats lan 2 21:33:34Z** — khớp nhịp +26/30 phút (26 lúc 21:32:32Z → ~29 lúc 21:33:34Z → 52 lúc 22:02:32Z).
- Boot **#85** (3c704685, btime 22:59:36Z): **3 dòng** (T9 đếm trực tiếp lúc đóng phiên; journal còn nguyên). Dòng đầu tiên trên #85: **23:01:29Z (boot+113s)**; dòng thứ hai 23:03:49Z; dòng cuối cùng: **23:03:49Z** — **0 dòng mới sau 23:03:49Z** trong 58 s còn lại tới đóng (23:04:47Z), trong khi headroom đã về 0 (xem §1.2). Toàn bộ 3 dòng thuộc về đợt 173.
- **Tổng đợt 173 đếm được: ≥84 dòng trong cửa sổ đợt** (3 dòng trên #83 + ≥78 dòng trên #84 lúc lan-4 + 3 dòng trên #85) — **cận dưới, không phải tổng tuyệt đối** (tổng cuối trên #83/#84 không đếm được vì journal mất; ngoại suy theo nhịp, tổng cuối trên #84 lúc reboot ~104 dòng, tức phần trong đợt ~104 dòng — NGOẠI SUY, KHÔNG PHẢI SỐ ĐẾM).
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 172: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 172:** đợt 172 có ≥83 dòng trên #81 + 3 dòng trên #82 (tổng đếm được ≥58 dòng trong đợt — cận dưới). Đợt này **3 dòng trên #83 + ≥78 dòng trên #84 + 3 dòng trên #85 (tổng đếm được ≥84 dòng)** — cao hơn đợt 172 vì headroom toàn-0 suốt phiên trên cả #84 lẫn #85 nên ENOSPC tăng đều tới khi journal mất (đợt 172 headroom về 2 trên #82 nên ENOSPC dừng ở 3 dòng). Đợt này là đợt có ENOSPC đếm được CAO NHẤT kể từ đợt 171 (111 dòng — nhưng đợt 171 đếm trọn boot; đợt này tổng cuối #83/#84 không đếm được nên không so hạng tuyệt đối được).
- **Đối chiếu T5-173:** T5-173 ghi "ENOSPC #84: 26→29 dòng" — số 26/29 là số đếm tại thời điểm T5 kiểm tra (26 lúc lan-2 21:32:32Z của T9, 29 lúc stats lan 2 21:33:34Z của T5 — khớp nhịp +26/30 phút); số đóng băng của T9 là ≥78 dòng trên #84. Không mâu thuẫn — chỉ khác mốc đếm.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai reboot GIỮA PHIÊN — #84 (T9 bắt trực tiếp, khởi động lại trong ~73 s) + #85 (T9 bắt trực tiếp, khởi động lại trong ~114 s) — cộng 1 reboot TRƯỚC KHI đợt mở (#83)

- **Reboot #84 (4ae2d2ea-a7d6-4869-8b32-2a142adaa586, btime 21:01:15Z; gap #83→#84 = 2.128 s):** xảy ra **GIỮA PHIÊN** lúc T9 đang đo (T9 phát hiện ~21:02:07Z, 52 s sau btime — khi lệnh sleep chờ lan-2 bị SIGTERM vì reboot giết runtime). **Sampler + watcher B2 + probe-loop-84 của T9 CHẾT theo reboot** (log dừng 21:01:20Z — mẫu cuối trên #83; probe-loop gốc chết trước lan-2). T9 **KHỞI ĐỘNG LẠI cả ba trong ~73 s** (sampler chạy lại 21:02:32Z = boot+77s; watcher B2 chạy lại cùng lúc; probe-loop-84 viết mới chạy lan-2/lan-3/lan-4 đúng lịch gốc). **Gap 72,0 s qua reboot #84** (21:01:20Z → 21:02:32Z); max gap trong boot 61,0 s. Số hiệu #84 theo đếm tuần tự — T0-174 xác minh 9 nguồn (T9 chỉ quan sát btime/boot_id/journal/uptime).
- **Reboot #85 (3c704685-a16c-4b61-8573-af6eb7cb48c6, btime 22:59:36Z; gap #84→#85 = 7.101 s):** xảy ra **GIỮA PHIÊN, gần lúc đóng** (T9 phát hiện ~23:00:34Z, 58 s sau btime — khi lệnh sleep chờ lan-5 bị SIGTERM vì reboot giết runtime). **Sampler + watcher B2 + probe-loop-84 của T9 CHẾT theo reboot** (log dừng 22:59:34Z — mẫu cuối trên #84, 2 s TRƯỚC btime; probe-loop-84 chết trước lan-5). T9 **KHỞI ĐỘNG LẠI sampler + watcher trong ~114 s** (sampler chạy lại 23:01:30Z = boot+114s; watcher B2 chạy lại cùng lúc) và **KHÔNG viết lại probe-loop** (đợt sắp đóng — đóng bằng probe tay track 23:04:10Z + cặp đóng 23:04:47Z). **Gap 116,0 s qua reboot #85** (22:59:34Z → 23:01:30Z); max gap trong boot 61,0 s. Số hiệu #85 theo đếm tuần tự — T0-174 xác minh 9 nguồn.
- **Reboot #83 (dd08464a, btime 20:25:47Z; gap #82→#83 = 5.099 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ 10m04s** (đợt mở 20:35:51Z, boot+604s). T0-173 xác minh 9/9 nguồn. **KHÔNG có reboot nào khác giữa phiên đợt 173** — chỉ #84 + #85 (giữa phiên) + #83 (trước khi đợt mở).
- **Khoảng trống phủ sóng đầu phiên:** đợt mở 20:35:51Z (boot+604s), T9 nhận việc ~20:40Z (boot+~872s), sampler khởi động 20:40:19Z (boot+872s) — **gap 268 s từ lúc đợt mở tới khi sampler chạy** (đợt 172: gap 174 s; đợt 171: gap 516 s; đợt 170: gap 133 s; đợt 169: gap 388 s; đợt 168: gap 283 s; đợt 167: gap 162 s; đợt 166: gap 179 s; đợt 165: gap 1.760 s; đợt 164: gap 383 s; đợt 163: gap 113 s). Gap đầu phiên đợt này NGẮN (T9 spawn nhanh) — nhưng vẫn đủ để cửa sổ thoáng của #83 (nếu có, ~boot+60–200s) đóng trước khi T9 mở (xem §1.2, F-173-T9-1).
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T7-172 đo trong phiên đợt 172: 19:39:46 vs local 19:39:45 — chênh 1 s; T5-173 đo trong phiên đợt này: CF nhanh hơn local ~0,2–1,4 s; T9 không đo lại).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T0-173 đếm 35 reboot #49–#83; T5-173 đếm 36 reboot #49–#84; T8-173 ghi marker sống qua 37 reboot #49–#85 nếu #85 được xác nhận — theo T0/T5/T8-173).
- **X11 (T9 kiểm tra lúc đóng phiên 23:14Z):** `/tmp/.X11-unix/` **TRỐNG** (0 socket — X193/X194/X195 biến mất theo reboot #84, theo T8-173; T0/T1-173 ghi 3 socket mồ côi X193–X195 mtime 20:47Z trong phiên trên #83; T4-173 ghi X188 còn lại lúc đóng 22:37Z — cả hai đều đã biến mất sau reboot #85 lúc T9 kiểm tra).

### 5.2 T5-173 (infra) — POSTBOOT_PASS #84 ĐÃ CÓ (mode repair-sớm); POSTBOOT_PASS #83 KHÔNG BAO GIỜ CÓ; replay host-side #84 KHÔNG CHẠY

- **POSTBOOT_PASS #84 ĐÃ CÓ lúc 21:27:05Z** (boot+25m50s — theo T5-173; repair-sớm-quyết-h, poll=1, verify độc lập exit 0 lúc 21:33:29Z; 11/11 gói + 5/5 lib, GST symlink→debroot 269=269; dpkg 795 dòng — breakdown Y HỆT #81; cache 110; lists 75; ledger literal 106/170 — theo T5-173; T5 sở hữu số chi tiết).
- **POSTBOOT_PASS #83 KHÔNG BAO GIỜ CÓ** (replay chạy nhưng CHỈ MỘT PHẦN: 23/170 intent, dpkg 2 → 323, thiếu 9/11 gói, poll0 exit=1; manual repair của T5 xong 21:01:47Z exit 0 nhưng reboot #84 btime 21:01:15Z rơi vào GIỮA LÚC repair (32 s trước khi xong) nên poll1 không kịp chạy; T5 KHÔNG tự viết cờ cho boot đã chết — PARENT QUYẾT §9(b) LIMITS T5-173). **POSTBOOT_PASS #82 KHÔNG CÓ** (boot thứ 15 không có, không bù được — theo T5-173).
- **Watcher-173: poll cuối 21:01:24Z — 9 s SAU btime #84** (F-173-T5-5, mẫu overlap thứ tư; T9 không kiểm lại — giao T5-173/T10). **Watcher-172: poll cuối 19:01:11Z, chết theo #82** (F-171-T5-1 KHÔNG lặp lại).
- **Khoảng không-watcher: 6.099 s** (19:01:11Z → 20:42:50Z) **+ 198 s** (21:01:24Z → 21:04:42Z) — theo T5-173.
- **Repair #84 chạy 10m22s** (trigger 21:16:43Z → POSTBOOT_PASS 21:27:05Z — theo T5-173). **Replay host-side #84 KHÔNG CHẠY** (theo T5-173). Hướng (3) đứng lần 20.
- **F-172-T6-5 ĐÃ ĐÓNG (T6-173/T5-173 xác nhận):** pid 17944 = replay-watch-172.sh (T5), pid 6126 = b2-watcher.sh (T9) — hai watcher khác nhau; watcher-172 thật chỉ có 1 pid 17944.
- **B4: 0 probe chạm dpkg** (theo T5-173).

### 5.3 T8-173 (vite harness + O8) — ĐÃ đóng cờ (~23:12Z); O8 PASS 3/3 trên #84, chuỗi GIỮ 24; harness 6/6 SẠCH, 0 KẸT; (f') V1 + Q3 ĐÃ TRIỂN KHAI

- **T8-173 ĐÃ xuất bản LIMITS + viết cờ `round173-t8.done`** — T9 chỉ đối chiếu bằng dữ kiện sampler + B2 độc lập, không phán thay T8.
- **O8 PASS 3/3 trên boot #84** (22:32:07–22:34:48Z — WebKit 21/21 ×2 pid28907 md5 03561009 + pid29392 md5 073ce61c; Chromium 21/21 pid29774 md5 428e80d4; exit 0/0/0): **1 spike B2 trong cửa sổ O8** (22:34:19Z, Chromium renderer — khác đợt 172: 0 spike trong cửa sổ O8; đợt này spike duy nhất là của chính process trình duyệt O8). **Chuỗi WebKit FULL PASS GIỮ 24 — KHÔNG TĂNG** (T4 0 attempt cả lượt, không có lượt yên hợp lệ trên boot đo; gate hết hạn 22:30:01Z poll 88 — theo T8-173). **T8 đóng trễ hạn cờ ~23:00Z ~13'** (do reboot #85 + sửa LIMITS; TRONG hạn cứng ~23:30Z — theo T8-173).
- **Đối chiếu sampler T9 trong cửa sổ O8 (22:32:07–22:34:48Z): 3 mẫu, gate A MỞ 0/3** (22:32:33Z 952.884 kB; 22:33:33Z 1.010.668 kB; 22:34:33Z 840.784 kB — cả 3 đều <1024 MiB; số từ log đóng băng), balloon 5.182.964–5.312.048 kB (80,4–82,4% trần, đang sag, không ghim), load1 1,55–2,47 (sampler; watcher bắt 3,18 lúc 22:34:19Z — khớp, khác cadence).
- **Harness WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (22:36:33–22:52:03Z): WebKit 84l10 **PASS đầy đủ sau sửa Q3**; WebKit 85m4 **PASS** (P4-lan3 PASS lần 2 liên tiếp, chuỗi mới = 2); WebKit 86n2 **PASS** (P4-lan2 verdict 23 → 24). Kẹt cộng dồn GIỮ 20. Chuỗi "P3 không kẹt" 1 → 2. Đối chiếu sampler T9 trong cửa sổ harness: gate A MỞ 1/16; RAM min trong cửa sổ harness 488.648 kB @22:45:34Z trong lúc sag — **0 spike B2** (xem §2.4).
- **(f') V1 ĐÃ TRIỂN KHAI live** (check-fresh-173t8.py): kiểm lại bằng chính helper — kẹt-164 TRIGGER @125 s, kẹt-171 TRIGGER @305 s, 0 FP trên 8 log sạch; replay độc lập khớp từng số; live 0 kích hoạt (0 kẹt thật). **(1c') (c') GIỮ NGUYÊN diag-only** (theo T8-173).
- **Q3 ĐÃ TRIỂN KHAI** (84l10 md5 b8c08a7c → baaa13c0, 34.880 B): heartbeat W2 6 tick WebKit / 5 tick Chromium, E4 0 tick (đúng thiết kế — vòng E4 khỏe ~4–5 s); 84l10 PASS đầy đủ sau sửa.
- **H3: VẪN MỞ, chỉ giám sát thụ động** (theo T8-173 — 0 kẹt mới). **ĐIỀU TRA RIÊNG 84l10 — ĐỢT 2 XONG** (Q3 xong, chưa có ca kẹt mới).

### 5.4 T7-173 (scheduler) + T2-173 + T0-173 — T7 CHƯA đóng cờ lúc T9 đóng; run 172 SUCCEEDED, (m) #82 DƯƠNG ỨNG VIÊN, (m) #83 KHÔNG PHẢI ĐIỂM, (m) #84 DƯƠNG ỨNG VIÊN sơ bộ, INSIDE #82 TRUE → CHUỖI MỚI dài 1

- **T7-173 CHƯA xuất bản LIMITS + CHƯA viết cờ `round173-t7.done` lúc T9 đóng (~23:2xZ)** — T9 chỉ đối chiếu bằng dữ kiện T0/T2 đã xuất bản, không phán thay T7. Kết cục run 173 thuộc T7-173/T10. T9 đóng cờ trong hạn cứng ~23:30Z (trễ hạn cờ ~23:00Z do reboot #85 — xem F-173-T9-10).
- **Run 172 SUCCEEDED 20:16:59Z theo DB** (theo T0-173/T2-173: wall gốc 9.668 s; margin 1.132 s tới hạn 20:35:51Z; claimed→finished 109 s — NGOÀI họ 6–11 s, ca thứ năm ≥60 s sau 66 s (164), 64 s (166), 108 s (167), 110 s (171); **1 lần viết lại** (tại #82); run 173 running, sched/started 20:35:51Z, boot_gen 1e836713 (#83), jitter 0 s — theo T0-173).
- **(m) #82: DƯƠNG ỨNG VIÊN** (theo T2-173: 1 requeue duy nhất trong cửa, eid 10167, 17:02:38.477Z = btime +38,438 s ∈ [33; 49,8] — cách biên dưới 5,438 s, KHÔNG sát biên; run 172 ĐANG CHẠY tại btime và BỊ VIẾT LẠI 1 lần. Chữ ký giống #68/#69/#71/#74/#78. **Nếu parent CHẤP NHẬN: n ứng viên 29→30 / 30→31.** T2-173 phán DƯƠNG ỨNG VIÊN — parent quyết cuối.
- **(m) #83: KHÔNG PHẢI ĐIỂM** (theo T0-173/T2-173: 0 run sống tại btime + 0 requeue trong cửa [btime83, btime83+900 s] — cùng mẫu #80).
- **(m) #84: DƯƠNG ỨNG VIÊN (sơ bộ)** (theo T2-173: +45,482 s, 1 run sống; reboot giữa phiên đợt này — T2-173 phán sơ bộ, parent quyết cuối; số hiệu #84 chờ T0-174 xác minh 9 nguồn).
- **(m) #85: thuộc T2-174 + parent** (T9 không kiểm — giao T2-174).
- **INSIDE (theo T2-173): #82 TRUE (FULL128)** [neo FULL127 + gap 7.123 s] → **CHUỖI MỚI từ #82 dài 1** (FULL127 nói NGOÀI — mâu thuẫn, FULL128 chi phối theo F-165-T2-1). **#83 sơ bộ TRUE (FULL129) → chuỗi 2 nếu xác nhận; #84 sơ bộ TRUE (FULL130) → chuỗi 3 nếu xác nhận** (T2-173 phán sơ bộ — T2-174 + parent xác nhận). **FULL127 KIỂM LẠI ĐỘC LẬP: ĐẠT** (nợ F-171-T10-7 ĐÃ TRẢ).
- **(m) #56 vẫn có điều kiện** (theo T2-173 — lần thứ mười sáu không thu hẹp được; 7 hướng mới đều âm tính; T9 không trích số — thuộc T2-173/T10).
- **Mù #96? (theo T2-173 — T9 không trích số chi tiết):** mù #88? VẪN MỞ (hole-recheck lần thứ 17: 337 hit, 0 mốc mới — lần thứ mười bảy liên tiếp 0); #95?/#94?/#77? giữ nguyên; CERT/FULL chính thức GIỮ 76/91 (theo T2-173).
- **Lệch khung #84: CÓ OVERLAP — OVERLAP thứ mười một** (theo T2-173: BA dòng nội dung boot cũ sau btime #84: +5 s / +9 s / +21 s — trong đó +5 s là mẫu sampler cuối của T9-173 lúc 21:01:20Z (xem F-173-T9-7) và +9 s là poll cuối watcher-173 của T5 lúc 21:01:24Z (theo T5-173); T9 không trích chi tiết dòng thứ ba (+21 s) — thuộc T2-173/T10). **Lệch khung #83: thuộc T2-173** (T9 không kiểm — giao T2-173). **Lệch khung #85: thuộc T2-174.**
- **#82/#83 KHÔNG giết holder** (theo T6-173 — chuỗi từ #69 tiếp tục, lên 15 reboot nếu T0-173 xác nhận số hiệu; T9 không trích số — thuộc T6-173/T10). **#84/#85 có giết holder không: thuộc T6-174.**

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc 23:14Z (8/9)** — T7 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T0-173:** reboot #83 xác minh 9/9 nguồn (btime 20:25:47Z, epoch 1795379147; gap #82→#83 = 5.099 s); marker sống qua 35 reboot #49–#83; **(m) #83 KHÔNG PHẢI ĐIỂM**; T0-173 cũng chạy O8 độc lập trên boot #83: WebKit FAIL ×2 (attempt1 pid19714 exit=2 S1 FAIL + Target crashed; attempt2 pid20320 exit=2 timeout S0) + Chromium PASS 21/21 (pid28601 exit=0, md5 58c9a64e) — probe S1 chạy lại đúng cách: (a) RENDERER CHẾT — PAGE-CRASH. T9 không trích số khác — thuộc T0-173/T10.
- **T1-173:** verify đợt 172 — verdict PASS, suite chạy lại **28/28 exit 0 trên boot #83** (20:42:57–20:50:48Z, 7m51s); `npm test` 12 pass; đợt 172 = 10 batch / 14 entry / 14 đường dẫn / 13 file mới (đếm khớp từng số quyết parent (a) §12.3 đợt 172 bằng script dedup toàn cục viết mới — **lần thứ 70 liên tiếp**); **10/10 cờ đợt 172 còn trên đĩa, đều có nội dung**. T9 không trích số khác — thuộc T1-173/T10.
- **T6-173:** (A) kiểm chứng lại **120/120 PASS dưới churn (lần thứ hai mươi ba liên tiếp)**; prune lần 48 (xóa 3 file); #82/#83 không giết holder. T9 không trích số — thuộc T6-173/T10.
- **T4-173:** xem §2.3 (LIMITS đã xuất bản).
- **T2-173:** xem §5.4 (LIMITS đã xuất bản).

## 6. Sai số / caveat (F-173-T9-*)

- **F-173-T9-1 — CỬA SỔ THOÁNG QUAN SÁT ĐƯỢC LẦN THỨ HAI LIÊN TIẾP (đợt 172 + 173) — NHƯNG CỬA SỔ #85 KHÔNG BẮT ĐƯỢC.** Reboot #84 btime 21:01:15Z xảy ra GIỮA PHIÊN lúc T9 đang đo; T9 bắt được cửa sổ trực tiếp: **30.001, 30.001 lúc 21:02:28Z = boot+73s** (chạm CAP 30.000), về **0 lúc boot+154s** (21:03:49Z) và **0 lúc boot+214s** (21:04:49Z). Cửa sổ mở tại boot+73s và đã đóng trước boot+154s — rộng chưa tới 81 s, cùng mẫu các đợt 163–166 và 172 (30.001 lúc boot+63–81s → 0 lúc boot+110–160s). ENOSPC đầu tiên trên #84 nằm trong (21:02:28Z, 21:04:49Z] — đúng trong lúc cửa sổ đóng. **Cửa sổ #83 KHÔNG quan sát được** (reboot TRƯỚC khi đợt mở 604 s — cùng mẫu cấu trúc đợt 170/171/172-#81). **Cửa sổ #85 KHÔNG bắt được** (T9 phát hiện reboot boot+58s nhưng probe đầu boot+114s đã 0, 0; ENOSPC đầu tiên boot+113s, đúng 1 s trước probe — cửa sổ #85 nếu có thì đã đóng trước boot+114s, hẹp hơn các cửa sổ đã quan sát). Lưu ý: T9 phát hiện #84 nhờ lệnh sleep chờ lan-2 bị SIGTERM khi reboot giết runtime (không phải nhờ watcher — watcher đã chết theo reboot); nếu T9 không kiểm tra đúng lúc đó thì cửa sổ đã trôi qua trước khi lan-2 (21:32:32Z) đo được 0.
- **F-173-T9-2 — HAI REBOOT GIỮA PHIÊN GIẾT SAMPLER + WATCHER B2 + PROBE-LOOP CỦA T9 — T9 KHỞI ĐỘNG LẠI TRONG PHIÊN, 0 SỐ LIỆU MẤT NGOÀI 2 GAP QUA REBOOT.** Sampler instance 1 dừng ở mẫu cuối 21:01:20Z (5 s SAU btime #84 — xem F-173-T9-7); instance 2 chạy lại 21:02:32Z (boot+77s). Gap 72,0 s qua #84. Sampler instance 2 dừng ở mẫu cuối 22:59:34Z (2 s TRƯỚC btime #85); instance 3 chạy lại 23:01:30Z (boot+114s). Gap 116,0 s qua #85. Probe-loop gốc chết trước lan-2; T9 viết lại `probe-loop-84.sh` chạy lan-2 (21:32:32Z) + lan-3 (22:02:32Z) + lan-4 (22:32:32Z) đúng lịch gốc; lan-5 (~23:02:32Z) KHÔNG chạy được vì probe-loop-84 chết theo #85 — T9 KHÔNG viết lại probe-loop cho #85 (đợt sắp đóng) mà đóng bằng probe tay (track 23:04:10Z + cặp đóng 23:04:47Z). **Điểm yếu (d) đợt 148 (loop chết theo reboot) TÁI DIỄN HAI LẦN — nhưng lần này T9 phát hiện + khởi động lại trong phiên cả hai lần, không để mất cả nửa phiên như đợt 148.** E-180 ghim tới mẫu cuối trước btime 2 s — thời điểm đứt thật nằm trong (22:59:34Z, 23:01:30Z]; T9 không claim cụ thể hơn.
- **F-173-T9-3 — E-178 + E-179 + E-180 PHÁN 3 EPISODE MỚI TRÊN #84 — giao T10 xác nhận cách đếm (CÓ PHƯƠNG ÁN THAY THẾ).** E-178: 21:28:32–21:34:32Z, 7 mẫu ghim liên tiếp trên #84, 1 chuỗi — KẾT THÚC bởi micro-dip 1 mẫu 21:35:32Z (99,4% trần). E-179: 21:36:32–22:31:33Z, 56 mẫu ghim liên tiếp trên #84, 1 chuỗi — KẾT THÚC bởi sag 26 mẫu 22:32:33–22:57:34Z (xả tới 80,4% trần, leo lại 26 phút). E-180: 22:58:34–22:59:34Z, 2 mẫu ghim liên tiếp trên #84, 1 chuỗi — KẾT THÚC theo reboot #85. Cả ba đều không có sag NỘI BỘ (micro-dip và sag dài nằm GIỮA các chuỗi, không nằm trong chuỗi). **Phương án thay thế:** gộp E-178+E-179 qua micro-dip 1 mẫu (99,4% — coi như nhiễu đo) → 2 episode trên #84 (63 mẫu + 2 mẫu). Nếu T10/parent phán ngược (gộp), tổng số episode đợt 173 đổi 3 → 2 nhưng tổng mẫu ghim 65 không đổi. **E-177 KẾT THÚC — GIỮ 27 mẫu** (đứt trong khoảng mù 3.660 s, không claim thời điểm cụ thể).
- **F-173-T9-4 — RAM ĐỈNH PHIÊN 44,14% GUARD — XA GUARD, 0 MẪU ĐẠT GUARD.** Mẫu 21:06:32Z: RAM 2.777.656 kB, cách guard 3.513.800 kB (55,86%); balloon 4.157.728 kB (64,5% trần). **Caveat bắt buộc:** sampler cadence 60 s — một lần vượt guard dưới 60 s giữa hai mẫu liên tiếp KHÔNG loại trừ được (điểm yếu (a) đợt 147). Mẫu trước đỉnh (21:05:32Z): 2.307.540 kB; mẫu sau đỉnh (21:07:32Z): 2.512.252 kB — đỉnh là một mẫu đơn lẻ, RAM rơi 265.404 kB trong 60 s sau đó; không có mẫu nào khác trên 2.600.000 kB trong phiên. T9 claim đúng: **0 MẪU đạt guard → cơ chế (a) KHÔNG kích hoạt**; T9 KHÔNG claim "không có lúc nào vượt guard". Đợt này caveat (a) ít thực chất hơn đợt 171 (đỉnh 98,69% guard) vì đỉnh chỉ 44,14%.
- **F-173-T9-5 — ENOSPC #84 ≥78 dòng (không đếm lại được tổng cuối — journal mất theo #85) + nhịp +26/30 phút + THIẾU TIMESTAMP DÒNG ĐẦU #84 VÀ SỐ ĐẾM CUỐI #83.** Nhịp #84: 2 → 26 → 52 → 78 (+26 đúng mỗi ~30 phút, 2 khoảng liên tiếp đo được sau lan-2; T5 snapshot 29 @21:33:34Z khớp nhịp). **Số đóng băng của T9 trên #84 là 78 dòng lúc lan-4 22:32:32Z; tổng cuối trên #84 KHÔNG đếm lại được** (journal chỉ còn boot #85 sau reboot — cùng mẫu F-171-T10-4); T10 đếm lại từ journal sẽ chỉ thấy 3 dòng của #85 — chênh lệch là do mất journal, không phải sai số. **Thiếu sót của T9 đợt này (ghi rõ để T10 không đọc nhầm):** (a) timestamp dòng ENOSPC đầu tiên trên #84 KHÔNG được ghi (chỉ biết nằm trong (21:02:28Z, 21:04:49Z] — count=0 lúc probe cửa sổ, count=2 lúc track2); (b) số đếm cuối trên #83 KHÔNG được kiểm lại sau probe mở (chỉ có count=3 lúc 20:40:19Z — lệnh kiểm tra sau đó bị SIGTERM khi reboot #84 giết runtime). Phần trong cửa sổ đợt trên #84: **toàn bộ ≥78 dòng** (dòng đầu nằm sau khi đợt mở — count=0 lúc 21:02:28Z); tổng trong đợt ≥84 dòng (3 + 78 + 3) là **cận dưới**. **ENOSPC #85 dừng ở 3 dòng lúc đóng** (dòng cuối 23:03:49Z) — T9 ghi đúng số đếm lúc đóng, không ngoại suy thêm.
- **F-173-T9-6 — BÀI HỌC PHƯƠNG PHÁP MỚI: `pkill -f` SUÝT GIẾT CHÍNH LỆNH EXEC CỦA T9 (ĐÃ SỬA BẰNG KILL THEO PID).** Lúc dừng sampler/watcher để đóng băng log, T9 chạy `pkill -f "round173-t9/sampler.sh"` — pattern khớp luôn dòng lệnh của chính shell exec đang chạy (vì dòng lệnh chứa chuỗi đó) nên exec bị SIGTERM giữa chừng. Sampler chết như ý muốn (đóng băng 144 mẫu), nhưng watcher B2 (pid 1941) SỐNG SÓT (pkill chết trước khi tới lượt nó hoặc signal tới không đều) — T9 phát hiện khi kiểm tra lại và kill trực tiếp theo PID (`kill 1941`), watcher dừng hẳn 23:05:19Z. Bài học: dừng loop bằng PID đã biết, KHÔNG dùng `pkill -f` với pattern trùng tên thư mục làm việc (cùng họ F-172-T9-2: loop chết theo reboot — lần này là loop chết do chính lệnh dừng của T9). Không mất số liệu (sampler đã ghi mẫu cuối 23:04:30Z trước khi chết; watcher không ghi thêm spike nào trong ~14 s từ khi sampler chết tới khi watcher dừng).
- **F-173-T9-7 — SAMPLER CỦA T9 LÀ 1 TRONG 3 DÒNG BOOT CŨ SAU BTIME #84 (OVERLAP THỨ MƯỜI MỘT — T2-173).** Mẫu sampler cuối trên #83 lúc 21:01:20Z — **5 s SAU btime #84 (21:01:15Z)** — boot_id cũ vẫn đọc được 5 s sau btime mới (cùng mẫu F-172-T5-1: poll cuối watcher-171 20 s sau btime #81; F-173-T5-1: poll cuối watcher-172 23 s sau btime #82; F-173-T5-5: poll cuối watcher-173 9 s sau btime #84). T2-173 ghi #84 có BA dòng boot cũ sau btime (+5 s / +9 s / +21 s) — OVERLAP thứ mười một; +5 s là mẫu sampler của T9, +9 s là poll cuối watcher-173 của T5. **Ở #85, sampler của T9 KHÔNG overlap** (mẫu cuối 22:59:34Z, 2 s TRƯỚC btime #85 22:59:36Z). T9 ghi đúng số đo, không phán cơ chế overlap (T2-173 đã giải thích: container stop/start overlap — xem T2-173).
- **F-173-T9-8 — 5 DÒNG DELTA THIẾU TRONG 9 SPIKE — NHƯNG 0 SPIKE MẤT ATTRIBUTION.** Các spike 20:44:19Z (thiếu 2: ffmpeg vidstabdetect + node render) và 20:44:54Z (thiếu 3: WebKitWebProcess + MiniBrowser + vite) — dòng delta in ra THIẾU pid (chỉ 3 và 2 dòng delta thay vì 5). Driver quy bằng ps-top tích lũy + top -b tức thời (ffmpeg 140%/62,5%, WebKit 18,8%/12,5%). Nguyên nhân: ffmpeg testsrc/vidstabdetect ngắn + process WebKit/vite — chết hoặc stat không đọc được trong vòng delta 1 s. **Không lặp F-172-T9-8 về số lượng** (đợt 172: 7 dòng delta thiếu; đợt này: 5 dòng). T9 ghi rõ để T10 không đếm nhầm thành "5 spike không quy được driver" (cả 9 spike đều có driver cụ thể qua top -b).
- **F-173-T9-9 — SỐ RAM MIN CỦA T4 (429 MB) VÀ CỦA T9 (484.332 kB) CÙNG MỘT TRŨNG, KHÁC CADENCE — KHÔNG MÂU THUẪN.** Sampler T9 cadence 60 s: min 484.332 kB (473,0 MiB) lúc 21:53:33Z trong lúc ghim E-179; poller T4 (n=144, cadence ~35 s) bắt được min 429 MB trong cùng nhịp RAM thấp sau gate0 (21:27–22:30Z, RAM 484–575 kB theo sampler). T9 không tranh số của T4; cả hai cùng chứng minh trũng RAM trong lúc balloon ghim — NHƯNG trũng RAM không gây kẹt (harness T8 6/6 PASS trong sag sau đó, xem §2.4) và không cho lượt yên hợp lệ (T4 0 attempt vì RAM không trùng gate0, xem §2.3). Cùng mẫu F-172-T9-9/F-171-T9-9/F-170-T9-10.
- **F-173-T9-10 — T7-173 CHƯA đóng cờ lúc T9 đóng (~23:2xZ) + T9 ĐÓNG TRỄ HẠN CỜ ~23:00Z (TRONG HẠN CỨNG ~23:30Z).** T9 không chờ T7 (kết cục run 173 thuộc T7-173/T10). T9 đóng trễ hạn cờ vì reboot #85 (22:59:36Z) giết sampler/watcher/probe-loop ngay trước hạn cờ, buộc T9 khởi động lại + đo tay cửa sổ #85 + track + cặp đóng — cùng tình huống T8-173 (trễ ~13' vì reboot #85 + sửa LIMITS). T9 ghi rõ theo quyết (l) đợt 152.
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được — đợt này quan sát được 30.001 lúc boot+73s trên #84, nhưng giá trị thật trên CAP không đo được; cửa sổ #85 không bắt được nên không biết đỉnh); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — xem F-173-T9-4); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #83/#84 từ cell vì journalctl chỉ còn boot hiện tại sau reboot (cùng họ EPERM như `dmesg` — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 173 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).

---

## Phụ lục — log sampler đóng băng (144 mẫu, 20:40:19Z–23:04:30Z)

Nội dung dưới đây được tạo BẰNG SCRIPT từ `hidden_files/round173-t9/ram-sampler-FROZEN.log` (md5 `5b5ea7ed64cb1d7ff462d5f8a5caef7a`) — không gõ lại bằng tay (xem F-169-T9-9).

```
2026-11-22T20:40:19Z boot=dd08464a mem=764008 bal=6104200 swapfree=721868 load1=0.89
2026-11-22T20:41:19Z boot=dd08464a mem=1276672 bal=5645448 swapfree=712924 load1=0.66
2026-11-22T20:42:19Z boot=dd08464a mem=1120540 bal=5794384 swapfree=716800 load1=0.61
2026-11-22T20:43:19Z boot=dd08464a mem=882036 bal=5910984 swapfree=669636 load1=1.03
2026-11-22T20:44:19Z boot=dd08464a mem=1013996 bal=5787196 swapfree=670320 load1=3.21
2026-11-22T20:45:19Z boot=dd08464a mem=1233440 bal=5171004 swapfree=658784 load1=5.95
2026-11-22T20:46:19Z boot=dd08464a mem=1385620 bal=4876864 swapfree=665600 load1=5.53
2026-11-22T20:47:19Z boot=dd08464a mem=1378244 bal=5048508 swapfree=668236 load1=2.67
2026-11-22T20:48:19Z boot=dd08464a mem=1119084 bal=5208316 swapfree=677180 load1=1.06
2026-11-22T20:49:19Z boot=dd08464a mem=1191508 bal=5342508 swapfree=697700 load1=0.55
2026-11-22T20:50:20Z boot=dd08464a mem=1183220 bal=4805784 swapfree=683164 load1=0.60
2026-11-22T20:51:20Z boot=dd08464a mem=1733808 bal=5003680 swapfree=696848 load1=1.09
2026-11-22T20:52:20Z boot=dd08464a mem=1604448 bal=5006600 swapfree=682036 load1=1.39
2026-11-22T20:53:20Z boot=dd08464a mem=1867704 bal=4887112 swapfree=657560 load1=1.62
2026-11-22T20:54:20Z boot=dd08464a mem=1666220 bal=5101844 swapfree=665020 load1=0.71
2026-11-22T20:55:20Z boot=dd08464a mem=1501036 bal=5297188 swapfree=662968 load1=1.09
2026-11-22T20:56:20Z boot=dd08464a mem=1342584 bal=5476384 swapfree=667800 load1=1.66
2026-11-22T20:57:20Z boot=dd08464a mem=1192608 bal=5635792 swapfree=666540 load1=1.15
2026-11-22T20:58:20Z boot=dd08464a mem=1323184 bal=5536492 swapfree=645904 load1=1.35
2026-11-22T20:59:20Z boot=dd08464a mem=1112300 bal=5694272 swapfree=633968 load1=0.76
2026-11-22T21:00:20Z boot=dd08464a mem=1067716 bal=5838056 swapfree=640764 load1=1.05
2026-11-22T21:01:20Z boot=dd08464a mem=898800 bal=5944316 swapfree=634356 load1=1.41
2026-11-22T21:02:32Z boot=4ae2d2ea mem=1985980 bal=4888360 swapfree=1017432 load1=3.91
2026-11-22T21:03:32Z boot=4ae2d2ea mem=2307540 bal=4519676 swapfree=914660 load1=4.10
2026-11-22T21:04:32Z boot=4ae2d2ea mem=2512252 bal=4310956 swapfree=853248 load1=2.25
2026-11-22T21:05:32Z boot=4ae2d2ea mem=2226944 bal=4580552 swapfree=858020 load1=2.00
2026-11-22T21:06:32Z boot=4ae2d2ea mem=2777656 bal=4157728 swapfree=855764 load1=1.31
2026-11-22T21:07:32Z boot=4ae2d2ea mem=2519012 bal=4336844 swapfree=856040 load1=2.15
2026-11-22T21:08:32Z boot=4ae2d2ea mem=2276676 bal=4593952 swapfree=856296 load1=1.47
2026-11-22T21:09:32Z boot=4ae2d2ea mem=2049496 bal=4843084 swapfree=856832 load1=0.82
2026-11-22T21:10:32Z boot=4ae2d2ea mem=1818172 bal=5064236 swapfree=856996 load1=0.47
2026-11-22T21:11:32Z boot=4ae2d2ea mem=1908204 bal=5046752 swapfree=775932 load1=1.11
2026-11-22T21:12:32Z boot=4ae2d2ea mem=1864380 bal=5052976 swapfree=746120 load1=0.82
2026-11-22T21:13:32Z boot=4ae2d2ea mem=2569168 bal=4142236 swapfree=731744 load1=0.91
2026-11-22T21:14:32Z boot=4ae2d2ea mem=2217556 bal=4432864 swapfree=736984 load1=0.33
2026-11-22T21:15:32Z boot=4ae2d2ea mem=1985880 bal=4695124 swapfree=737292 load1=0.12
2026-11-22T21:16:32Z boot=4ae2d2ea mem=1979620 bal=4934880 swapfree=734844 load1=0.11
2026-11-22T21:17:32Z boot=4ae2d2ea mem=1726968 bal=5150004 swapfree=739096 load1=0.61
2026-11-22T21:18:32Z boot=4ae2d2ea mem=1536328 bal=5343656 swapfree=739084 load1=0.36
2026-11-22T21:19:32Z boot=4ae2d2ea mem=1355868 bal=5520140 swapfree=739772 load1=0.13
2026-11-22T21:20:32Z boot=4ae2d2ea mem=1136264 bal=5681940 swapfree=737840 load1=0.54
2026-11-22T21:21:32Z boot=4ae2d2ea mem=1058360 bal=5823508 swapfree=733996 load1=0.36
2026-11-22T21:22:32Z boot=4ae2d2ea mem=930180 bal=5955932 swapfree=724304 load1=0.51
2026-11-22T21:23:32Z boot=4ae2d2ea mem=826760 bal=6075376 swapfree=721156 load1=0.23
2026-11-22T21:24:32Z boot=4ae2d2ea mem=728796 bal=6183876 swapfree=720336 load1=0.43
2026-11-22T21:25:32Z boot=4ae2d2ea mem=619700 bal=6282840 swapfree=707384 load1=0.16
2026-11-22T21:26:32Z boot=4ae2d2ea mem=642996 bal=6285944 swapfree=704436 load1=0.13
2026-11-22T21:27:32Z boot=4ae2d2ea mem=575384 bal=6378320 swapfree=688412 load1=0.50
2026-11-22T21:28:32Z boot=4ae2d2ea mem=507584 bal=6443824 swapfree=689388 load1=0.31
2026-11-22T21:29:32Z boot=4ae2d2ea mem=508260 bal=6443824 swapfree=689336 load1=0.32
2026-11-22T21:30:32Z boot=4ae2d2ea mem=520900 bal=6443824 swapfree=683288 load1=0.94
2026-11-22T21:31:32Z boot=4ae2d2ea mem=538764 bal=6443824 swapfree=639872 load1=1.18
2026-11-22T21:32:32Z boot=4ae2d2ea mem=514500 bal=6443824 swapfree=639040 load1=1.14
2026-11-22T21:33:32Z boot=4ae2d2ea mem=516756 bal=6443824 swapfree=643904 load1=0.55
2026-11-22T21:34:32Z boot=4ae2d2ea mem=565612 bal=6443824 swapfree=636168 load1=1.50
2026-11-22T21:35:32Z boot=4ae2d2ea mem=565512 bal=6407564 swapfree=620340 load1=1.25
2026-11-22T21:36:32Z boot=4ae2d2ea mem=520924 bal=6443824 swapfree=628424 load1=0.65
2026-11-22T21:37:32Z boot=4ae2d2ea mem=519788 bal=6443824 swapfree=630084 load1=0.32
2026-11-22T21:38:32Z boot=4ae2d2ea mem=528488 bal=6443824 swapfree=633600 load1=0.26
2026-11-22T21:39:32Z boot=4ae2d2ea mem=531440 bal=6443824 swapfree=634468 load1=0.22
2026-11-22T21:40:32Z boot=4ae2d2ea mem=526268 bal=6443824 swapfree=638836 load1=0.63
2026-11-22T21:41:32Z boot=4ae2d2ea mem=498340 bal=6443824 swapfree=640256 load1=0.34
2026-11-22T21:42:32Z boot=4ae2d2ea mem=497584 bal=6443824 swapfree=652780 load1=0.17
2026-11-22T21:43:32Z boot=4ae2d2ea mem=505240 bal=6443824 swapfree=652840 load1=0.11
2026-11-22T21:44:32Z boot=4ae2d2ea mem=505016 bal=6443824 swapfree=652976 load1=0.04
2026-11-22T21:45:32Z boot=4ae2d2ea mem=507264 bal=6443824 swapfree=653532 load1=0.01
2026-11-22T21:46:32Z boot=4ae2d2ea mem=492996 bal=6443824 swapfree=656076 load1=0.00
2026-11-22T21:47:33Z boot=4ae2d2ea mem=513436 bal=6443824 swapfree=656456 load1=0.05
2026-11-22T21:48:33Z boot=4ae2d2ea mem=496984 bal=6443824 swapfree=655168 load1=0.02
2026-11-22T21:49:33Z boot=4ae2d2ea mem=505028 bal=6443824 swapfree=657496 load1=0.11
2026-11-22T21:50:33Z boot=4ae2d2ea mem=498092 bal=6443824 swapfree=657580 load1=0.14
2026-11-22T21:51:33Z boot=4ae2d2ea mem=518852 bal=6443824 swapfree=657068 load1=0.08
2026-11-22T21:52:33Z boot=4ae2d2ea mem=513896 bal=6443824 swapfree=657380 load1=0.39
2026-11-22T21:53:33Z boot=4ae2d2ea mem=484332 bal=6443824 swapfree=659360 load1=0.14
2026-11-22T21:54:33Z boot=4ae2d2ea mem=493104 bal=6443824 swapfree=659392 load1=0.12
2026-11-22T21:55:33Z boot=4ae2d2ea mem=515120 bal=6443824 swapfree=657648 load1=0.17
2026-11-22T21:56:33Z boot=4ae2d2ea mem=486308 bal=6443824 swapfree=657880 load1=0.14
2026-11-22T21:57:33Z boot=4ae2d2ea mem=513408 bal=6443824 swapfree=655968 load1=0.10
2026-11-22T21:58:33Z boot=4ae2d2ea mem=499492 bal=6443824 swapfree=655868 load1=0.08
2026-11-22T21:59:33Z boot=4ae2d2ea mem=494928 bal=6443824 swapfree=655816 load1=0.03
2026-11-22T22:00:33Z boot=4ae2d2ea mem=503648 bal=6443824 swapfree=660436 load1=0.09
2026-11-22T22:01:33Z boot=4ae2d2ea mem=500240 bal=6443824 swapfree=660568 load1=0.10
2026-11-22T22:02:33Z boot=4ae2d2ea mem=566496 bal=6443824 swapfree=761940 load1=0.35
2026-11-22T22:03:33Z boot=4ae2d2ea mem=562652 bal=6443824 swapfree=778688 load1=0.20
2026-11-22T22:04:33Z boot=4ae2d2ea mem=553476 bal=6443824 swapfree=778804 load1=0.26
2026-11-22T22:05:33Z boot=4ae2d2ea mem=545500 bal=6443824 swapfree=778856 load1=0.09
2026-11-22T22:06:33Z boot=4ae2d2ea mem=528812 bal=6443824 swapfree=778908 load1=0.03
2026-11-22T22:07:33Z boot=4ae2d2ea mem=533204 bal=6443824 swapfree=779416 load1=0.01
2026-11-22T22:08:33Z boot=4ae2d2ea mem=512944 bal=6443824 swapfree=779540 load1=0.11
2026-11-22T22:09:33Z boot=4ae2d2ea mem=551196 bal=6443824 swapfree=779604 load1=0.14
2026-11-22T22:10:33Z boot=4ae2d2ea mem=536168 bal=6443824 swapfree=779720 load1=0.05
2026-11-22T22:11:33Z boot=4ae2d2ea mem=534396 bal=6443824 swapfree=779796 load1=0.02
2026-11-22T22:12:33Z boot=4ae2d2ea mem=520968 bal=6443824 swapfree=781144 load1=0.28
2026-11-22T22:13:33Z boot=4ae2d2ea mem=523128 bal=6443824 swapfree=781264 load1=0.10
2026-11-22T22:14:33Z boot=4ae2d2ea mem=525936 bal=6443824 swapfree=779272 load1=0.25
2026-11-22T22:15:33Z boot=4ae2d2ea mem=514620 bal=6443824 swapfree=779292 load1=0.09
2026-11-22T22:16:33Z boot=4ae2d2ea mem=517644 bal=6443824 swapfree=778768 load1=0.11
2026-11-22T22:17:33Z boot=4ae2d2ea mem=513336 bal=6443824 swapfree=779032 load1=0.19
2026-11-22T22:18:33Z boot=4ae2d2ea mem=500876 bal=6443824 swapfree=779448 load1=0.35
2026-11-22T22:19:33Z boot=4ae2d2ea mem=512740 bal=6443824 swapfree=779640 load1=0.18
2026-11-22T22:20:33Z boot=4ae2d2ea mem=499868 bal=6443824 swapfree=779684 load1=0.06
2026-11-22T22:21:33Z boot=4ae2d2ea mem=510152 bal=6443824 swapfree=779780 load1=0.02
2026-11-22T22:22:33Z boot=4ae2d2ea mem=506176 bal=6443824 swapfree=780100 load1=0.05
2026-11-22T22:23:33Z boot=4ae2d2ea mem=522128 bal=6443824 swapfree=780132 load1=0.02
2026-11-22T22:24:33Z boot=4ae2d2ea mem=506100 bal=6443824 swapfree=780176 load1=0.00
2026-11-22T22:25:33Z boot=4ae2d2ea mem=491728 bal=6443824 swapfree=780200 load1=0.00
2026-11-22T22:26:33Z boot=4ae2d2ea mem=531084 bal=6443824 swapfree=774524 load1=0.09
2026-11-22T22:27:33Z boot=4ae2d2ea mem=530708 bal=6443824 swapfree=774552 load1=0.03
2026-11-22T22:28:33Z boot=4ae2d2ea mem=512972 bal=6443824 swapfree=774612 load1=0.01
2026-11-22T22:29:33Z boot=4ae2d2ea mem=517248 bal=6443824 swapfree=774800 load1=0.04
2026-11-22T22:30:33Z boot=4ae2d2ea mem=523124 bal=6443824 swapfree=775596 load1=0.10
2026-11-22T22:31:33Z boot=4ae2d2ea mem=516500 bal=6443824 swapfree=776044 load1=0.15
2026-11-22T22:32:33Z boot=4ae2d2ea mem=952884 bal=5264176 swapfree=580384 load1=1.82
2026-11-22T22:33:33Z boot=4ae2d2ea mem=1010668 bal=5182964 swapfree=609860 load1=1.55
2026-11-22T22:34:33Z boot=4ae2d2ea mem=840784 bal=5312048 swapfree=605912 load1=2.47
2026-11-22T22:35:33Z boot=4ae2d2ea mem=1500140 bal=5480956 swapfree=607628 load1=0.98
2026-11-22T22:36:33Z boot=4ae2d2ea mem=1140208 bal=5653332 swapfree=611580 load1=0.36
2026-11-22T22:37:33Z boot=4ae2d2ea mem=859320 bal=5454292 swapfree=605048 load1=1.89
2026-11-22T22:38:33Z boot=4ae2d2ea mem=692304 bal=5583772 swapfree=607456 load1=2.55
2026-11-22T22:39:34Z boot=4ae2d2ea mem=625352 bal=5677572 swapfree=613092 load1=1.84
2026-11-22T22:40:34Z boot=4ae2d2ea mem=702028 bal=5595884 swapfree=604852 load1=1.92
2026-11-22T22:41:34Z boot=4ae2d2ea mem=676396 bal=5600500 swapfree=603604 load1=1.65
2026-11-22T22:42:34Z boot=4ae2d2ea mem=725604 bal=5699440 swapfree=607692 load1=1.12
2026-11-22T22:43:34Z boot=4ae2d2ea mem=623496 bal=5798716 swapfree=609044 load1=0.49
2026-11-22T22:44:34Z boot=4ae2d2ea mem=1023860 bal=5902696 swapfree=607072 load1=0.18
2026-11-22T22:45:34Z boot=4ae2d2ea mem=488648 bal=5674904 swapfree=590688 load1=1.21
2026-11-22T22:46:34Z boot=4ae2d2ea mem=762024 bal=5412760 swapfree=593916 load1=1.11
2026-11-22T22:47:34Z boot=4ae2d2ea mem=518820 bal=5530324 swapfree=597492 load1=1.42
2026-11-22T22:48:34Z boot=4ae2d2ea mem=982208 bal=5227232 swapfree=600096 load1=1.79
2026-11-22T22:49:34Z boot=4ae2d2ea mem=693204 bal=5358624 swapfree=601960 load1=1.76
2026-11-22T22:50:34Z boot=4ae2d2ea mem=769944 bal=5487608 swapfree=604372 load1=0.95
2026-11-22T22:51:34Z boot=4ae2d2ea mem=638416 bal=5615660 swapfree=605200 load1=0.35
2026-11-22T22:52:34Z boot=4ae2d2ea mem=1184308 bal=5761160 swapfree=610212 load1=0.40
2026-11-22T22:53:34Z boot=4ae2d2ea mem=975472 bal=5903448 swapfree=611084 load1=0.15
2026-11-22T22:54:34Z boot=4ae2d2ea mem=927768 bal=6033244 swapfree=611480 load1=0.05
2026-11-22T22:55:34Z boot=4ae2d2ea mem=783320 bal=6150320 swapfree=611840 load1=0.08
2026-11-22T22:56:34Z boot=4ae2d2ea mem=710316 bal=6258480 swapfree=612064 load1=0.03
2026-11-22T22:57:34Z boot=4ae2d2ea mem=634124 bal=6357780 swapfree=611768 load1=0.01
2026-11-22T22:58:34Z boot=4ae2d2ea mem=536432 bal=6443824 swapfree=614384 load1=0.03
2026-11-22T22:59:34Z boot=4ae2d2ea mem=540568 bal=6443824 swapfree=617004 load1=0.01
2026-11-22T23:01:30Z boot=3c704685 mem=1612008 bal=5225124 swapfree=1033800 load1=1.26
2026-11-22T23:02:30Z boot=3c704685 mem=1469868 bal=5417888 swapfree=1010172 load1=0.55
2026-11-22T23:03:30Z boot=3c704685 mem=1327136 bal=5593272 swapfree=1005628 load1=0.30
2026-11-22T23:04:30Z boot=3c704685 mem=1167792 bal=5753656 swapfree=999052 load1=0.11
```

---

## Phụ lục — headroom log (67 dòng, 17 lần đo hợp lệ)

Nội dung dưới đây được tạo BẰNG SCRIPT từ `hidden_files/round173-t9/headroom-log-FROZEN.txt` (md5 `c4a8742dd689beb9b65667623d9d280e`) — không gõ lại bằng tay (xem F-169-T9-9).

```
=== probe-mo 2026-11-22T20:40:19Z boot=dd08464a tran=63747
2026-11-22T20:40:19Z
0
0
ENOSPC-count=3
ENOSPC-first: Nov 22 20:37:07 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last: Nov 22 20:39:27 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     764628 kB | Balloon:         6104200 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-boot84-window 2026-11-22T21:02:28Z boot=4ae2d2ea tran=63747
2026-11-22T21:02:28Z
30001
30001
ENOSPC-count=0
ENOSPC-first: 
ENOSPC-last: 
mem: MemAvailable:    1985708 kB | Balloon:         4888360 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-boot84-track1 2026-11-22T21:03:49Z boot=4ae2d2ea tran=63747
0
=== probe-boot84-track2 2026-11-22T21:04:49Z boot=4ae2d2ea tran=63747
0
ENOSPC-count=2
mem: MemAvailable:    2352892 kB | Balloon:         4404260 kB
=== probe-84-lan-2 2026-11-22T21:32:32Z boot=4ae2d2ea tran=63747
0
0
ENOSPC-count=26
ENOSPC-last: Nov 22 21:31:58 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     514644 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-84-lan-3 2026-11-22T22:02:32Z boot=4ae2d2ea tran=63747
0
0
ENOSPC-count=52
ENOSPC-last: Nov 22 22:01:38 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     566604 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-84-lan-4 2026-11-22T22:32:32Z boot=4ae2d2ea tran=63747
0
0
ENOSPC-count=78
ENOSPC-last: Nov 22 22:31:28 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     762328 kB | Balloon:         5460784 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-boot85-window 2026-11-22T23:01:30Z boot=3c704685 tran=63747
2026-11-22T23:01:30Z
0
0
ENOSPC-count=1
ENOSPC-first: Nov 22 23:01:29 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last: Nov 22 23:01:29 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1614148 kB | Balloon:         5225124 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-boot85-track 2026-11-22T23:04:10Z boot=3c704685 tran=63747
0
ENOSPC-count=3
mem: MemAvailable:    1201624 kB | Balloon:         5701604 kB
=== probe-close 2026-11-22T23:04:47Z boot=3c704685 tran=63747
2026-11-22T23:04:47Z
0
0
ENOSPC-count-boot85=3
ENOSPC-first-boot85: Nov 22 23:01:29 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last-boot85: Nov 22 23:03:49 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1086700 kB | Balloon:         5753656 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```
