# LIMITS — Phase 9 đợt 174, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ hai mươi tám liên tiếp; CỬA SỔ THOÁNG QUAN SÁT ĐƯỢC LẦN THỨ BA LIÊN TIẾP — 30.001 lúc boot+87s trên #86; headroom đóng 2; E-181–E-186 MỚI, E-186 ĐANG GHIM; ENOSPC đợt thứ 23; MỘT REBOOT GIỮA PHIÊN #86)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 2 lúc đóng (16 lần đo hợp lệ: 10 lần 0, 1 lần 30.001, 1 lần 29.052, 4 lần 2), dưới ngưỡng < ~1.800 lần thứ ba mươi tư liên tiếp** — trần **63.747 trên cả hai boot**. Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT QUAN SÁT ĐƯỢC — LẦN THỨ BA LIÊN TIẾP (đợt 172 + 173 + 174).** Reboot #86 (btime 01:01:37Z) xảy ra **GIỮA PHIÊN**; T9 bắt được cửa sổ trực tiếp: **30.001, 29.052 lúc 01:03:04Z = boot+87s** (probe thứ hai trong cặp đã tụt 949 — cửa sổ hẹp dần ngay trong cặp đo), về **0 lúc boot+181s** (01:04:38Z) và **0 lúc boot+241s** (01:05:38Z) — cửa sổ mở tại boot+87s và đã đóng trước boot+181s, **rộng chưa tới 94 s**. Cửa sổ của #85 thì KHÔNG quan sát được (#85 xảy ra TRƯỚC KHI ĐỢT MỞ 36m15s; probe mở boot+39m đã 0, 0). Xem §1.2, F-174-T9-1.
- **Balloon — 6 EPISODE MỚI (E-181 2 mẫu + E-182 1 mẫu + E-183 1 mẫu + E-184 8 mẫu trên #85; E-185 7 mẫu + E-186 36 mẫu ĐANG GHIM trên #86):** E-181 ghim lúc mở phiên (bắt đầu trong khoảng mù, đứt bởi sag 23:40:36Z); E-182/E-183 là hai lần chạm trần 1 mẫu rồi xả ngay; E-184 ghim 00:54:38–01:01:39Z, KẾT THÚC theo reboot #86; E-185 ghim 01:12:13–01:18:13Z, đứt bởi micro-dip 1 mẫu 01:19:13Z (99,5% trần); E-186 ghim 01:20:13Z tới lúc đóng (01:55:14Z), **ĐANG GHIM — chưa kết thúc**. **E-180 GIỮ 2 mẫu** (kết thúc theo #85 — đã phán đợt 173; không cộng thêm). **Tổng ghim đợt này 55/137 mẫu (40,1%).** Phán 6 episode theo quy tắc chuỗi cơ học (≤61 s giữa hai mẫu ghim liên tiếp) — phương án gộp E-185+E-186 qua micro-dip (5 episode: 43 mẫu gộp) được ghi rõ để T10/parent xét; tổng mẫu ghim 55 không đổi theo cách đếm nào. Xem §2.2, F-174-T9-3.
- **RAM: sampler 137 mẫu, 23:38:36Z–01:55:14Z, HAI boot (#85: 84 mẫu; #86: 53 mẫu).** Max **2.087.224 kB (2.038,3 MiB = 33,17% guard) lúc 00:14:37Z** — ngay sau lượt yên #43 của T4; chỉ còn cách guard **4.204.232 kB**. Min **402.460 kB lúc 00:03:37Z** (ngay trước E-182, balloon 99,94% trần) — **trũng SÂU hơn đợt 173 đúng 81.872 kB**. Mean toàn phiên **853.555,3 kB — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU**. Gate A **37/137 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ hai mươi tám liên tiếp.** Caveat: cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu (điểm yếu (a) đợt 147) — T9 chỉ claim 0 MẪU đạt guard, không claim "không có lúc nào vượt guard". Xem §2, §3.
- **B2: 10 spike THẬT, 8/10 QUY ĐƯỢC DRIVER CỤ THỂ, 2 load1 dư (9 spike trên #85, 1 spike trên #86; 0 spike trong các chuỗi ghim).** Cụm 23:42:06–23:49:49Z (9 spike, load1 tới 7,03): T1 verify suite (ffmpeg testsrc2/mask_anim/render.js) + T0 O8 WebKit + T5 repair — **2 spike TRONG cửa sổ O8 của T0** (23:43:50Z, 23:44:26Z). Spike 01:03:13Z (load1 4,92): hatch daemon sau reboot #86. **0 spike trong cửa sổ attempt của T4 (cả hai), O8 của T8 và harness của T8.** Delta tick lớn nhất 129 tick/s (ffmpeg testsrc2, 23:48:02Z). Xem §2.5.
- **Lượt yên WebKit #43 (T4): CÓ LƯỢT HỢP LỆ — attempt2 20/20 + lớp B 5/5, tickCost median 44,5 ms — CHUỖI LƯỢT YÊN HỢP LỆ 36 → 37.** Attempt1 PAGE-WEDGED sau pass 3 (00:07:44–00:09:49Z); attempt2 chạy 00:09:49–00:13:52Z và PASS sạch. Sampler T9 đối chiếu: attempt1 gate A 2/2, load1 1,58–2,88; attempt2 gate A 4/4, load1 0,40–1,55; **0 spike B2 trong cả hai cửa sổ**. Xem §2.3.
- **T8-174: O8 PASS 3/3 trên boot #85 (00:26:57–00:29:33Z) + harness 6/6 PASS, 0 KẸT** (00:31:13–00:46:56Z) — chuỗi "P3 không kẹt" 2 → 3 (đợt sạch thứ ba liên tiếp 172–174); **T8 đề xuất chuỗi WebKit FULL PASS 24 → 25** (T0 O8 cùng boot #85 PASS 3/3 độc lập: WebKit 21/21 ×2 + Chromium 21/21, 23:43:42–23:47:50Z — hai bộ độc lập đồng thuận PASS). T9 đối chiếu bằng sampler độc lập: cửa sổ O8 của T8 gate A 0/2, 0 spike B2; cửa sổ harness gate A 2/16, 0 spike B2. Xem §2.4.
- **MỘT REBOOT GIỮA PHIÊN: #86 (70b7f7ee, btime 01:01:37Z; gap #85→#86 = 7.321 s).** Sampler + watcher B2 + probe-loop của T9 **CHẾT theo reboot**; T9 khởi động lại trong ~96 s (sampler chạy lại 01:03:13Z = boot+96s — đúng lúc bắt được cửa sổ thoáng 30.001 lúc boot+87s). **Gap 94 s qua reboot** (01:01:39Z → 01:03:13Z); max gap trong boot 61 s. Mẫu sampler cuối trên #85 lúc 01:01:39Z — **2 s SAU btime #86** (boot_id cũ vẫn đọc được — OVERLAP, T2-175 đếm). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: #85 đếm trực tiếp tới 84 dòng lúc lan-3 (00:38:36Z) + #86 = 17 dòng — tổng trong đợt đếm trực tiếp ≥72 dòng (55 trên #85 sau mốc mở + 17 trên #86); đợt thứ hai mươi ba liên tiếp bảng watch cạn gây lỗi thật thấy được.** Nhịp #85: **+26 dòng đúng mỗi ~30 phút, 2 khoảng liên tiếp** (32 → 58 → 84; cùng nhịp #84 đợt 173). Trên #86 ENOSPC **DỪNG sau 01:21:59Z** (0 dòng mới trong 33 phút cuối — trùng lúc headroom về 2). Tổng cuối trên #85 KHÔNG đếm lại được (journal MẤT theo reboot #86 — cùng mẫu F-171-T10-4); ngoại suy theo nhịp, tổng trong đợt ≈ 92 dòng (NGOẠI SUY, KHÔNG PHẢI SỐ ĐẾM). Xem §4.
- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc T9 đóng (8/9)** — T7 CHƯA đóng cờ lúc T9 đóng (không có `round174-t7.done` trên đĩa lúc 02:00Z); kết cục run 174 thuộc T7-174/T10. **(m) #84: DƯƠNG (CUỐI, T2) + (m) #85: DƯƠNG (CUỐI, T2)** — parent quyết; **INSIDE: #83 TRUE (FULL129) → chuỗi dài 2; #84 TRUE (FULL130) → chuỗi 3; #85 TRUE (FULL131) → chuỗi 4** (theo T2-174). **Run 173 TIMEOUT** (theo T0-174: finished 23:36:04Z, wall 10.813 s, sau hạn 13 s, 2 lần viết lại). Xem §5.3/§5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không mẫu nào đạt guard — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round174-t9/k8-headroom.py` (copy y nguyên từ đợt 173 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 174 (16 lần đo hợp lệ, 2 boot, 0 lần đo lỗi)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 23:38:36Z 22/11 | **0** | #85 3c704685 | 63.747 | lần đo 1–2, cặp mở (boot+39m); ENOSPC-count=32 (dòng đầu tiên 23:01:29Z = boot+113s); balloon 6.443.824 kB (GHIM TRẦN — E-181) |
| 23:38:36Z 22/11 | **0** | #85 3c704685 | 63.747 | lần đo 2 (chênh **0**) |
| 00:08:36Z 23/11 | **0** | #85 3c704685 | 63.747 | lần đo 3–4, probe-loop lan-2; ENOSPC-count=58 (dòng mới nhất 00:07:29Z); balloon ĐANG SAG (4.582.412 kB) |
| 00:08:36Z 23/11 | **0** | #85 3c704685 | 63.747 | lần đo 4 (chênh **0**) |
| 00:38:36Z 23/11 | **0** | #85 3c704685 | 63.747 | lần đo 5–6, probe-loop lan-3; ENOSPC-count=84 (dòng mới nhất 00:37:29Z); balloon ĐANG LEO LẠI (5.902.940 kB, 91,6% trần) |
| 00:38:36Z 23/11 | **0** | #85 3c704685 | 63.747 | lần đo 6 (chênh **0**) |
| 01:03:04Z 23/11 | **30.001** | #86 70b7f7ee | 63.747 | lần đo 7–8, **CỬA SỔ THOÁNG SAU REBOOT #86 — chạm CAP** (boot+87s); ENOSPC-count=0 trên #86; balloon 5.170.788 kB |
| 01:03:04Z 23/11 | **29.052** | #86 70b7f7ee | 63.747 | lần đo 8 — **probe thứ hai trong cặp đã tụt 949** (cửa sổ hẹp dần ngay trong cặp đo; xem F-174-T9-1) |
| 01:04:38Z 23/11 | **0** | #86 70b7f7ee | 63.747 | lần đo 9–10, theo dõi cửa sổ (boot+181s) — cửa sổ ĐÃ ĐÓNG; ENOSPC-count=1 (dòng đầu 01:03:39Z = boot+122s) |
| 01:04:38Z 23/11 | **0** | #86 70b7f7ee | 63.747 | lần đo 10 (chênh **0**) |
| 01:05:38Z 23/11 | **0** | #86 70b7f7ee | 63.747 | lần đo 11–12, theo dõi cửa sổ (boot+241s); ENOSPC-count=2 (dòng mới nhất 01:04:49Z) |
| 01:05:38Z 23/11 | **0** | #86 70b7f7ee | 63.747 | lần đo 12 (chênh **0**) |
| 01:33:13Z 23/11 | **2** | #86 70b7f7ee | 63.747 | lần đo 13–14, probe-loop-86 lan-2; ENOSPC-count=17 (dòng mới nhất 01:21:59Z); balloon ĐANG GHIM TRẦN (E-186), RAM 572.712 kB |
| 01:33:13Z 23/11 | **2** | #86 70b7f7ee | 63.747 | lần đo 14 (chênh **0**) |
| 01:55:19Z 23/11 | **2** | #86 70b7f7ee | 63.747 | lần đo 15–16, cặp đóng; balloon ĐANG GHIM TRẦN (E-186), RAM 523.324 kB; ENOSPC-count=17 (0 dòng mới sau 01:21:59Z) |
| 01:55:19Z 23/11 | **2** | #86 70b7f7ee | 63.747 | lần đo 16 (chênh **0**) |

- Probe dừng ở `i=0` trong 10/16 lần đo; chạm CAP 30.000 trong 1/16 lần đo (cửa sổ #86); 29.052 trong 1/16 lần đo (cùng cặp cửa sổ); 2 trong 4/16 lần đo (lan-2-86 + cặp đóng). File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi lần đo).
- **CỬA SỔ THOÁNG SAU REBOOT: QUAN SÁT ĐƯỢC — LẦN THỨ BA LIÊN TIẾP (đợt 172 + 173 + 174).** Reboot #86 btime 01:01:37Z (T9 phát hiện ~01:02:44Z, 67 s sau btime — khi kiểm tra lại sau khi lệnh sleep chờ lan-3 bị gián đoạn do runtime restart; xem F-174-T9-2). T9 đo tay ngay: **01:03:04Z = boot+87s: 30.001, 29.052**; **01:04:38Z = boot+181s: 0, 0**; **01:05:38Z = boot+241s: 0, 0**. Cửa sổ mở tại boot+87s và đã đóng trước boot+181s — **rộng chưa tới 94 s**, cùng mẫu các đợt 163–166, 172 và 173 (30.001 lúc boot+63–87s → 0 lúc boot+110–241s). ENOSPC đầu tiên trên #86 lúc 01:03:39Z = boot+122s — nằm trong (01:03:04Z, 01:04:38Z], đúng trong lúc cửa sổ đóng. **Điểm mới đợt này: probe thứ hai trong cặp cửa sổ đã tụt 949 (30.001 → 29.052)** — lần đầu tiên hai probe trong cùng một cặp cửa sổ chênh nhau (các đợt 163–166/172/173: cặp cửa sổ đều 30.001, 30.001, chênh 0); watch ngoài cell đang được thêm vào NGAY trong lúc T9 đo (xem F-174-T9-1).
- **Cửa sổ của #85: KHÔNG QUAN SÁT ĐƯỢC (cùng mẫu cấu trúc đợt 170/171/172-#81/173-#83).** Reboot #85 btime 22:59:36Z; đợt mở 23:35:51Z = boot+36m15s; T9 nhận việc ~23:38Z; sampler khởi động 23:38:36Z (boot+39m); probe mở 23:38:36Z (boot+39m) đã là 0, 0. ENOSPC đầu tiên trên #85 lúc 23:01:29Z = boot+113s — TRƯỚC khi đợt mở 34m22s. Nếu cửa sổ thoáng của #85 tồn tại thì nó nằm trong ~boot+60–200s (23:00–23:03Z) — trước khi đợt mở hơn nửa giờ; không một luồng nào của đợt 174 có mặt lúc đó. T9 ghi đúng mốc đo, không claim cửa sổ #85 có mở hay không.
- **Headroom cuối phiên: 2 (cặp đóng 01:55:19Z, chênh 0).** Trên #85: 0 suốt từ mở tới lan-3 (23:38:36–00:38:36Z); trên #86 sau khi cửa sổ đóng: 0 lúc boot+181s/241s → **2 lúc lan-2-86 (01:33:13Z) và giữ 2 tới đóng**. Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 2 = **63.745 watch** trên #86. Đây là lần đóng 2 đầu tiên kể từ đợt 172 (đợt 173 đóng 0). **ENOSPC trên #86 DỪNG sau 01:21:59Z** (0 dòng mới trong 33 phút cuối) — trùng lúc headroom về 2 (tương quan, không phán cơ chế; xem §4, F-174-T9-5).
- **So sánh với đợt 173:** đợt 173 mở 0 trên #83 → reboot #84 giữa phiên → thoáng 30.001 lúc boot+73s → 0 suốt #84 (10 lần đo) → reboot #85 gần lúc đóng → 0 suốt #85 → đóng 0 (17 lần đo: 15 lần 0, 2 lần 30.001). Đợt này mở 0 trên #85 → 0 suốt #85 (6 lần đo) → reboot #86 giữa phiên → thoáng 30.001/29.052 lúc boot+87s → 0 lúc boot+181s/241s → 2 lúc lan-2-86 → đóng 2 (16 lần đo: 10 lần 0, 1 lần 30.001, 1 lần 29.052, 4 lần 2).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **2 / 1.578 ≈ 0,001** — một vite mới (~1.578 watch) không khởi động được (như mọi đợt từ 152).
- T5-174 KHÔNG probe lại headroom đợt này (như đợt 151–173) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 16 lần đo hợp lệ + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #85 đợt này có ≥84 dòng systemd không thêm được inotify watch do ENOSPC lúc lan-3 (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #85 và #86 suốt 16 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.
- Lưu ý: RAM lúc đóng (555.672 kB — mẫu đóng trên #86) CAO hơn RAM lúc mở (431.348 kB — mẫu mở trên #85) trong khi headroom 0 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop gốc chạy đủ lan-2 (00:08:36Z) + lan-3 (00:38:36Z) rồi **CHẾT theo reboot #86** (lan-4 ~01:08:36Z không chạy được — loop đã chết 01:01:37Z); T9 viết lại `probe-loop-86.sh` chạy lan-2 (01:33:13Z) đúng lịch 30 phút; lan-3-86 (~02:03:13Z) KHÔNG chạy được vì đợt đóng trước đó — T9 đóng bằng probe tay (cặp đóng 01:55:19Z). Cùng mẫu đợt 173 (lan-5 không chạy được vì reboot #85 — xem F-173-T9-2).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–173 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 173 | 0 → 30.001 (thoáng, boot+73s) → 0 | mở 20:40:19Z boot #83 dd08464a btime 20:25:47Z (trần 63.747): 0, 0 (20:40:19Z) → sau reboot #84 21:01:15Z boot MỚI 4ae2d2ea (trần 63.747): 30.001, 30.001 lúc boot+73s → 0 lúc boot+154s/214s → 0 ×6 (21:32:32–22:32:32Z) → sau reboot #85 22:59:36Z boot MỚI 3c704685 (trần 63.747): 0, 0 lúc boot+114s → 0 lúc boot+274s → đóng 23:04:47Z cùng boot #85: 0, 0 (HAI reboot giữa phiên + MỘT reboot trước khi đợt mở; 17 lần đo hợp lệ, 15 lần 0, 2 lần 30.001) |
| **174** | **0 → 30.001/29.052 (thoáng, boot+87s) → 2** | **mở 23:38:36Z boot #85 3c704685 btime 22:59:36Z (trần 63.747): 0, 0 (23:38:36Z) → 0 ×4 (00:08:36–00:38:36Z) → sau reboot #86 01:01:37Z boot MỚI 70b7f7ee (trần 63.747): 30.001, 29.052 lúc boot+87s → 0 lúc boot+181s/241s → 2, 2 lúc lan-2-86 (01:33:13Z) → đóng 01:55:19Z cùng boot #86: 2, 2 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 16 lần đo hợp lệ, 10 lần 0, 1 lần 30.001, 1 lần 29.052, 4 lần 2)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 6 → 0 → 2 → 2 → 0 → 2 → 0 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 2** (đợt 173 đóng 0; đợt 172 đóng 2; đợt 171 đóng 0; đợt 170 đóng 2; đợt 169 đóng 2; đợt 168 đóng 2). Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ ba mươi tư liên tiếp** (tính theo giá trị ổn định lúc đóng; đợt này giá trị dao động 0 → 30.001/29.052 (thoáng) → 0 → 2). Quyết parent đợt 173 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal boot #85 đợt này có ≥84 dòng lỗi ENOSPC thật của systemd lúc lan-3 (xem §4)** — đợt thứ hai mươi ba liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng; đợt 165: ≥64 dòng; đợt 166: ≥56 dòng; đợt 167: ≥76 dòng; đợt 168: ≥102 dòng — T9 đếm trực tiếp; đợt 169: ≥54 dòng — T9 đếm trực tiếp; đợt 170: 39 dòng — T9 đếm trực tiếp; đợt 171: **111 dòng — T9 đếm trực tiếp**; đợt 172: **≥83 dòng trên #81 (không đếm lại được tổng cuối — journal mất theo #82) + 3 dòng trên #82 — T9 đếm trực tiếp**; đợt 173: **3 dòng trên #83 + ≥78 dòng trên #84 (không đếm lại được tổng cuối — journal mất theo #85) + 3 dòng trên #85 — T9 đếm trực tiếp, xem §4**; đợt 174: **≥72 dòng trong đợt đếm trực tiếp (55 trên #85 sau mốc mở + 17 trên #86; tổng cuối #85 không đếm được — journal mất theo #86) — T9 đếm trực tiếp, xem §4**). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #85 và #86 suốt 16 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên #85; swap 1.048.572 kB) — sampler 137 mẫu, 23:38:36Z–01:55:14Z, HAI boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở mẫu đầu trên #85 (mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: mở phiên balloon ghim (E-181) → sag dài → cụm spike T1/T0 (load1 tới 7,03) → T4 #43 CÓ lượt hợp lệ → T8 O8 PASS 3/3 + harness 6/6 → reboot #86 giữa phiên → cửa sổ thoáng 30.001/29.052 → balloon leo tới trần → E-185/E-186 ghim tới lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log đóng băng 94 s qua reboot #86; max gap trong boot 61 s** — xem §5.1). **137 mẫu, 23:38:36Z–01:55:14Z, HAI boot (#85: 84 mẫu; #86: 53 mẫu).** Tổng quan: **min 402.460 kB (393,0 MiB) lúc 00:03:37Z** (ngay trước E-182, balloon 99,94% trần); **max 2.087.224 kB (2.038,3 MiB) lúc 00:14:37Z — 33,17% guard** (ngay sau lượt yên #43 của T4; balloon 4.780.184 kB); **mean toàn phiên 853.555,3 kB (833,6 MiB) — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 23:38:36–23:39:36Z | #85 | 431.348–449.036 kB | Mở phiên: balloon GHIM TRẦN (E-181, 2 mẫu); gate A ĐÓNG cả 2 mẫu; headroom 0, 0; ENOSPC-count=32 |
| 23:40:36–00:03:37Z | #85 | 402.460–1.853.320 kB | **SAG 24 mẫu: balloon xả tới 67,6% trần (23:44:36Z) rồi leo lại tới 99,94% (00:03:37Z)**; **RAM min phiên 402.460 kB lúc 00:03:37Z**; gate A MỞ 14/24 mẫu; **9 spike B2** (23:42:06–23:49:49Z — T1 suite + T0 O8; load1 tới 7,03 theo watcher); T1 suite 23:40:11–23:49:01Z; T0 O8 23:43:42–23:47:50Z (WebKit PASS ×2 + Chromium PASS); T5 replay poll0 exit=1 23:42:00Z, POSTBOOT_PASS #85 23:46:57Z |
| 00:04:37Z | #85 | 404.552 kB | **E-182 — 1 mẫu chạm trần** (00:04:37Z), gate A ĐÓNG; sag ngay sau (00:05:37Z, 90,8% trần) |
| 00:05:37–00:25:37Z | #85 | 496.052–2.087.224 kB | **SAG 21 mẫu: balloon xả tới 71,1% trần (00:08:37Z) rồi leo lại tới 99,3% (00:25:37Z)**; **RAM max phiên 2.087.224 kB lúc 00:14:37Z** (33,17% guard); gate A MỞ 13/21 mẫu; **0 spike B2**; T4 attempt1 00:07:44–00:09:49Z (PAGE-WEDGED) + attempt2 00:09:49–00:13:52Z (**LƯỢT HỢP LỆ 20/20 + B 5/5** — xem §2.3); T8 O8 00:26:57Z bắt đầu cuối giai đoạn |
| 00:26:37Z | #85 | 417.532 kB | **E-183 — 1 mẫu chạm trần** (00:26:37Z), gate A ĐÓNG; sag ngay sau (00:27:37Z, 82,7% trần) |
| 00:27:37–00:53:38Z | #85 | 496.052–1.661.316 kB | **SAG 27 mẫu: balloon xả tới 79,0% trần (00:43:38Z) rồi leo lại tới 98,9% (00:53:38Z)**; gate A MỞ 5/27 mẫu; **0 spike B2**; T8 O8 PASS 3/3 (00:26:57–00:29:33Z) + harness 6/6 PASS, 0 kẹt (00:31:13–00:46:56Z — xem §2.4) |
| 00:54:38–01:01:39Z | #85 | 419.740–542.380 kB | Balloon GHIM TRẦN: **E-184 8 mẫu (00:54:38–01:01:39Z)** (xem §2.2); gate A ĐÓNG cả 8 mẫu; **0 spike B2**; mẫu cuối 01:01:39Z **2 s SAU btime #86** (OVERLAP — xem §5.1) |
| 01:03:13–01:11:13Z | #86 | 634.312–1.733.908 kB | **Boot #86 mới (btime 01:01:37Z); cửa sổ thoáng 30.001/29.052 lúc boot+87s (01:03:04Z)**; sampler khởi động lại 01:03:13Z (boot+96s); balloon 5.170.788 → 6.284.320 kB (đang leo, chưa ghim); **RAM max #86 1.733.908 kB lúc 01:03:13Z** (27,56% guard); gate A MỞ 5/9 mẫu; **1 spike B2** (01:03:13Z, hatch daemon sau reboot — xem §2.5); SwapFree NHẢY +294.600 kB qua reboot |
| 01:12:13–01:18:13Z | #86 | 531.132–623.920 kB | Balloon GHIM TRẦN: **E-185 7 mẫu (01:12:13–01:18:13Z)** (xem §2.2); gate A ĐÓNG cả 7 mẫu; **0 spike B2** |
| 01:19:13Z | #86 | 610.456 kB | **Micro-dip 1 mẫu** (balloon 6.411.208 kB, 99,5% trần), RAM 610.456 kB — tách E-185 khỏi E-186 theo quy tắc chuỗi cơ học |
| 01:20:13–01:55:14Z | #86 | 555.672–631.616 kB | Balloon GHIM TRẦN: **E-186 36 mẫu (01:20:13–01:55:14Z), ĐANG GHIM lúc đóng** (xem §2.2); gate A ĐÓNG cả 36 mẫu; **0 spike B2**; headroom 2, 2 lúc lan-2-86 (01:33:13Z) + cặp đóng (01:55:19Z); ENOSPC DỪNG sau 01:21:59Z |

- **Gate A ≥1024 MiB: 37/137 mẫu** (32/84 trên #85 + 5/53 trên #86 — KHỚP tổng; số giai đoạn từ script kiểm tra, không tính tay); **0 mẫu ≥ guard**; load1 max (sampler) **5,97** (watcher bắt 7,03 lúc 23:43:15Z — khớp, khác cadence); **RAM <512.000 kB: 15 mẫu** (10,9% — toàn bộ trên #85: 2 mẫu trong E-181 + 1 mẫu E-182 + 1 mẫu E-183 + 8 mẫu E-184 + 3 mẫu trong sag); **RAM <300.000 kB: 0 mẫu** (đợt 173: 0 mẫu; đợt 172: 0 mẫu; đợt 171: 1 mẫu).
- Swap: SwapFree 679.744 kB (mẫu đầu #85) → 731.712 kB (mẫu cuối #85, 01:01:39Z) → **1.026.312 kB (mẫu đầu #86, 01:03:13Z — NHẢY +294.600 kB qua reboot #86)** → 712.616 kB (mẫu cuối, 01:55:14Z). Nhịp nhảy SwapFree qua reboot: #86 nhả ~294.600 kB (đợt 173: nhả ~383.076 kB qua #84, ~416.796 kB qua #85; đợt 172: nhả ~351.824 kB qua #82).
- Mẫu 00:14:37Z (đỉnh phiên): RAM 2.087.224 kB, balloon 4.780.184 kB — đỉnh là một mẫu đơn lẻ 1 phút sau khi attempt2 của T4 kết thúc (00:13:52Z); mẫu trước đỉnh (00:13:37Z): 1.609.460 kB; mẫu sau đỉnh (00:15:37Z): 1.839.644 kB — RAM rơi 247.580 kB trong 60 s sau đó. T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 402.460 kB (đợt 173: 484.332 kB; đợt 172: 431.236 kB; đợt 171: 296.796 kB; đợt 170: 263.132 kB; đợt 169: 437.868 kB; đợt 168: 414.364 kB; đợt 167: 383.116 kB; đợt 166: 372.732 kB; đợt 165: 248.768 kB; đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — **trũng SÂU hơn đợt 173 đúng 81.872 kB** (484.332 − 402.460). 15 mẫu <512.000 kB trong 137 mẫu (10,9%); riêng trong span ghim E-184 (8 mẫu ghim): **6/8 mẫu <512.000 kB (75%)** — 2 mẫu cuối chuỗi trên 512.000 kB (01:00:39Z 542.380 kB, 01:01:39Z 514.836 kB); riêng trong span E-185+E-186 (43 mẫu ghim + 1 micro-dip = 44 mẫu): **0/44 mẫu <512.000 kB (0%)** — E-185/E-186 ghim nhưng RAM giữ trên 512.000 kB (531.132–631.616 kB), khác E-184.

**Bảng tổng hợp số RAM (từ script `t9-174-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 137 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #85 3c704685 | 84 | 402.460 | 2.087.224 | 970.160,3 | 32/84 | 12 | 5,97 | 15 |
| #86 70b7f7ee | 53 | 531.132 | 1.733.908 | 668.747,5 | 5/53 | 43 | 4,92 | 0 |
| **Toàn phiên** | **137** | **402.460** | **2.087.224** | **853.555,3** | **37/137** | **55/137 (40,1%)** | **5,97** | **15** |

- **Mean toàn phiên 853.555,3 kB — tính bằng 3 cách độc lập: python `sum/n = 853.555,3` VÀ awk `sum/n = 853.555` (awk in 6 chữ số có nghĩa) VÀ trung bình có trọng số ((84×970.160,3 + 53×668.747,5)/137 = 853.555,35) — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163) và **KHÔNG lặp F-172-T9-6** (số giai đoạn viết tay sai đợt 172 — mọi số bảng đợt này đều từ script analyze, không tính tay).
- 15 mẫu RAM <512.000 kB (từ script analyze trên log đóng băng — không tính tay): 2 mẫu E-181 (23:38:36Z, 23:39:36Z) + 1 mẫu trong sag 00:03:37Z (402.460 kB) + 1 mẫu E-182 (00:04:37Z) + 1 mẫu trong sag 00:25:37Z (496.052 kB) + 1 mẫu E-183 (00:26:37Z) + 3 mẫu trong sag (00:36:38Z 510.348 kB, 00:38:38Z 508.760 kB, 00:41:38Z 504.700 kB) + 6 mẫu E-184 (00:54:38Z–00:59:39Z). Tổng 2 + 1 + 1 + 1 + 1 + 3 + 6 = 15 — KHỚP số đếm toàn phiên (đã kiểm lại bằng script liệt kê từng mẫu sau khi viết nháp — xem F-174-T9-9).

### 2.2 Balloon virtio — 6 EPISODE MỚI (E-181 2 mẫu + E-182 1 mẫu + E-183 1 mẫu + E-184 8 mẫu trên #85; E-185 7 mẫu + E-186 36 mẫu ĐANG GHIM trên #86)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #85 (3c704685): GHIM TRẦN 12/84 mẫu (14,3%), trong 4 chuỗi — 4 EPISODE MỚI (E-181 + E-182 + E-183 + E-184).**
  - **E-181 — chuỗi 1: 23:38:36–23:39:36Z, 2 mẫu** (RAM 431.348–449.036 kB; gate A ĐÓNG cả 2 mẫu). **BẮT ĐẦU TRONG KHOẢNG MÙ** (mẫu cuối đợt 173 trên #85 lúc 23:04:30Z balloon 5.753.656 kB, 89,3% trần, đang leo; khoảng mù 23:04:30Z → 23:38:36Z = 2.046 s; balloon leo tới trần và ghim trong khoảng mù — thời điểm ghim thật nằm trong (23:04:30Z, 23:38:36Z], T9 không claim cụ thể). **KẾT THÚC bởi sag 24 mẫu 23:40:36–00:03:37Z** (balloon xả tới 4.357.144 kB, 67,6% trần, lúc 23:44:36Z rồi leo lại — có nhấp nhô: dip xuống 4.902.632 kB lúc 23:42:36Z và 5.791.484 kB lúc 23:57:37Z — tới 6.439.968 kB, 99,94% trần, lúc 00:03:37Z).
  - **E-182 — chuỗi 2: 00:04:37Z, 1 mẫu** (RAM 404.552 kB; gate A ĐÓNG). **KẾT THÚC bởi sag 21 mẫu 00:05:37–00:25:37Z** (balloon xả tới 4.582.412 kB, 71,1% trần, lúc 00:08:37Z rồi leo lại tới 6.402.824 kB, 99,3% trần, lúc 00:25:37Z).
  - **E-183 — chuỗi 3: 00:26:37Z, 1 mẫu** (RAM 417.532 kB; gate A ĐÓNG). **KẾT THÚC bởi sag 27 mẫu 00:27:37–00:53:38Z** (balloon xả tới 5.093.600 kB, 79,0% trần, lúc 00:43:38Z rồi leo lại tới 6.376.688 kB, 98,9% trần, lúc 00:53:38Z).
  - **E-184 — chuỗi 4: 00:54:38–01:01:39Z, 8 mẫu** (RAM 419.740–542.380 kB; gate A ĐÓNG cả 8 mẫu). **KẾT THÚC theo reboot #86** (ghim tới mẫu cuối cùng trên #85 — 01:01:39Z, **2 s SAU btime #86** (01:01:37Z) — mẫu overlap, xem §5.1; balloon trên #86 khởi động lại từ 5.170.788 kB, 80,2% trần, không ghim). Thời điểm đứt thật nằm trong (01:01:39Z, 01:03:13Z] — T9 không claim cụ thể hơn (balloon reset theo reboot là quyết định của host, ngoài tầm cell).
  - **Tổng #85 tới lúc kết thúc: 12 mẫu ghim / 4 chuỗi / 3 sag (24 + 21 + 27 mẫu) / 1 boot (#85).**
- **Boot #86 (70b7f7ee): GHIM TRẦN 43/53 mẫu (81,1%), trong 2 chuỗi — 2 EPISODE MỚI (E-185 + E-186).**
  - Leo lên trần trên boot #86: từ 01:03:13Z (5.170.788 kB, 80,2% trần) leo đơn điệu tới ghim lúc 01:12:13Z trong ~9 phút (mẫu ngay trước chuỗi 01:11:13Z: balloon 6.351.392 kB, 98,6% trần).
  - **E-185 — chuỗi 1: 01:12:13–01:18:13Z, 7 mẫu** (RAM 531.132–623.920 kB; gate A ĐÓNG cả 7 mẫu). Mẫu ngay sau chuỗi (01:19:13Z): balloon 6.411.208 kB (99,5% trần), RAM 610.456 kB — **micro-dip 1 mẫu, chỉ 32.616 kB dưới trần (0,51%)**, rồi ghim lại ngay mẫu sau.
  - **E-186 — chuỗi 2: 01:20:13–01:55:14Z, 36 mẫu** (RAM 555.672–631.616 kB; gate A ĐÓNG cả 36 mẫu). **ĐANG GHIM lúc T9 đóng** (mẫu cuối 01:55:14Z vẫn 6.443.824 kB) — kết cục thuộc T9-175 (số mẫu cuối cùng chưa biết; 36 là cận dưới).
  - **Tổng #86 tới lúc đóng: 43 mẫu ghim / 2 chuỗi / 1 micro-dip (1 mẫu) / 1 boot (#86).**
- **E-180 — KẾT CỤC: GIỮ 2 mẫu, KHÔNG cộng thêm.** E-180 ghim cuối 22:59:34Z trên #84 (đợt 173); khoảng mù giữa hai đợt **2.342 s (22:59:34Z → 23:38:36Z)** có **MỘT reboot (#85 btime 22:59:36Z)**. Balloon reset theo reboot (5.225.124 kB lúc 23:01:30Z trên #85 — đợt 173) nên mẫu ghim đầu tiên trên #85 trong đợt 174 (23:38:36Z) là episode MỚI E-181, không phải tiếp nối E-180. E-180 đã kết thúc theo #85 như phán đợt 173.
- **Tổng ghim trần đợt này: 55/137 mẫu (40,1%)** (đợt 173: 65/144 = 45,1%; đợt 172: 52/121 = 43,0%; đợt 171: 7/121 = 5,8%; đợt 170: 47/121 = 38,8%; đợt 169: 60/132 = 45,5%; đợt 168: 60/135 = 44,4%; đợt 167: 20/128 = 15,6%; đợt 166: 55/123 = 44,7%; đợt 165: 58/134 = 43,3%; đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **6 episode mới trong đợt 174 (E-181: 2 mẫu, 1 chuỗi, KẾT THÚC bởi sag 24 mẫu; E-182: 1 mẫu, 1 chuỗi, KẾT THÚC bởi sag 21 mẫu; E-183: 1 mẫu, 1 chuỗi, KẾT THÚC bởi sag 27 mẫu; E-184: 8 mẫu, 1 chuỗi, KẾT THÚC theo #86; E-185: 7 mẫu, 1 chuỗi, KẾT THÚC bởi micro-dip; E-186: 36 mẫu, 1 chuỗi, ĐANG GHIM)** + E-180 GIỮ 2 mẫu.
- **Phán theo quy tắc quyết (e)/(g) + mẫu T10-166 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-181 là 1 EPISODE MỚI (2 mẫu / 1 chuỗi)** — chuỗi ghim liên tiếp 23:38:36–23:39:36Z trên #85 (quan sát được trong đợt 174; bắt đầu trong khoảng mù), đứt bởi sag 24 mẫu. Theo quy tắc chuỗi cơ học (hai mẫu ghim liên tiếp cách nhau ≤61 s mới cùng chuỗi — script analyze dùng từ đợt 172), sag 24 mẫu tách chuỗi.
  - **E-182 là 1 EPISODE MỚI (1 mẫu / 1 chuỗi)** — mẫu ghim đơn lẻ 00:04:37Z trên #85, đứt bởi sag 21 mẫu hai bên. Đây là mẫu episode 1-mẫu đầu tiên kể từ khi T9 đếm episode (các episode trước đều ≥2 mẫu).
  - **E-183 là 1 EPISODE MỚI (1 mẫu / 1 chuỗi)** — mẫu ghim đơn lẻ 00:26:37Z trên #85, đứt bởi sag 27 mẫu hai bên. Cùng mẫu E-182 (chạm trần 1 mẫu rồi xả ngay).
  - **E-184 là 1 EPISODE MỚI (8 mẫu / 1 chuỗi)** — chuỗi ghim liên tiếp 00:54:38–01:01:39Z trên #85, KẾT THÚC theo reboot #86.
  - **E-185 là 1 EPISODE MỚI (7 mẫu / 1 chuỗi)** — chuỗi ghim liên tiếp 01:12:13–01:18:13Z trên #86, đứt bởi 1 mẫu micro-dip 01:19:13Z (99,5% trần).
  - **E-186 là 1 EPISODE MỚI (36 mẫu / 1 chuỗi, ĐANG GHIM)** — chuỗi ghim liên tiếp 01:20:13–01:55:14Z trên #86, chưa kết thúc lúc đóng (số mẫu cuối cùng thuộc T9-175).
  - **Phương án thay thế (ghi rõ để T10/parent xét):** gộp E-185+E-186 qua micro-dip 1 mẫu (99,5% — coi như nhiễu đo) → 5 episode trong đợt (E-181 2 + E-182 1 + E-183 1 + E-184 8 + E-185/186 gộp 43 mẫu). Tổng mẫu ghim 55 không đổi theo cách đếm nào; chỉ số episode đổi 6 → 5. T9 phán theo quy tắc chuỗi cơ học (6 episode) vì quy tắc này đã dùng nhất quán từ đợt 172; nếu T10/parent phán ngược, tổng episode đợt 174 đổi 6 → 5 nhưng tổng mẫu ghim 55 giữ nguyên.
  - **Đợt 174 = 6 EPISODE GHIM MỚI (E-181 + E-182 + E-183 + E-184 + E-185 + E-186)** + E-180 GIỮ 2 mẫu (kết cục theo #85, đã phán đợt 173).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-186 chỉ ~555–632.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối chuỗi ghim E-186 (01:55:14Z): tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 555.672 kB (log thật).

### 2.3 Lượt yên WebKit #43 (T4, đợt 174) — CÓ LƯỢT HỢP LỆ, attempt2 20/20 + B 5/5, CHUỖI 36 → 37 (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-174 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND174_T4_WEBKIT_QUIET43_LIMITS.md`) + cờ `round174-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **#43 CÓ LƯỢT HỢP LỆ — attempt2-3c704685 (20/20 + lớp B 5/5 + tickCost median 44,5 ms ≤60) — CHUỖI LƯỢT YÊN HỢP LỆ 36 → 37.** Attempt1 PAGE-WEDGED sau pass 3 (00:07:44–00:09:49Z, probe exit 2 — partial, KHÔNG tính verdict, retry đúng luật); attempt2 chạy ngay sau retry-wait (cửa mở lại poll #37, RAM 1969 MB) 00:09:49–00:13:52Z và PASS sạch. Ngân sách dùng 2/3. Poller: 38 poll thật, 2 lần cửa mở (#36/#37), 0 reboot. POSTBOOT_PASS 3c704685 CÓ 23:46:57Z (mode repair-tay-T5, poll=1 — caveat: không phải replay-đầy-đủ).
- **Cộng dồn MỚI (37 lượt hợp lệ): P1 150/153, P2 144/144, P3-A1 126/153, P3' 113/125 occ = 99/104 distinct-seq, P7 71/71** (theo T4-174; sổ distinct-seq đã thăng cấp as-of-174).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Cửa mở lần đầu poll #36 (00:07:44Z, RAM 1068 MB theo T4): sampler T9 mẫu 00:07:37Z RAM 1.063.332 kB (gate A MỞ — khớp, khác cadence 7 s); mẫu 00:08:37Z RAM 1.410.520 kB (gate A MỞ).
  - Cửa sổ attempt1 (00:07:44–00:09:49Z): gate A MỞ **2/2 mẫu** (số từ log đóng băng); load1 **1,58–2,88**; balloon 4.582.412–4.762.284 kB (71,1–73,9% trần), **0 mẫu ghim**.
  - Cửa sổ attempt2 (00:09:49–00:13:52Z): gate A MỞ **4/4 mẫu**; load1 **0,40–1,55**; balloon 4.691.036–5.156.240 kB (72,8–80,0% trần), **0 mẫu ghim**. (Xem F-174-T9-7: T4 ghi "load1 1,58 → 0,40" — 1,58 là mẫu 00:09:37Z thuộc cửa sổ attempt1; cùng số liệu, khác khung cửa sổ.)
  - RAM <500 MB: T4 đếm 3/38 poll; sampler T9 **15 mẫu <512.000 kB toàn phiên** (xem §2.1) — khác cadence + khác ngưỡng 500 MB vs 512.000 kB, không mâu thuẫn (cùng mẫu F-173-T9-9).
  - **0 spike B2 trong cả hai cửa sổ attempt** (xem §2.5) — khớp T4.
- **F-171-T9-6 (T2 chạy script nặng trong cửa sổ attempt đợt 171) — KHÔNG ÁP DỤNG đợt này:** 0 spike trong cả hai cửa sổ attempt; T9 không thấy script phân tích nặng nào chồng lên cửa sổ attempt trong log B2 (find của T2 xuất hiện trong spike 23:42:39Z + 23:43:15Z — TRƯỚC cửa sổ attempt 00:07:44Z hơn 24 phút). T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu. B4: POSTBOOT_PASS #85 mode repair-tay-T5 (dpkg 1731) — gate cho boot đo FOUND qua đường (a) với caveat mode repair (tiền lệ #75/#81/#84 — xem §5.2).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 / O8 / harness (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| T1 suite 23:40:11–23:49:01Z | #85 | 0,88–5,97 (9 mẫu) | 1.116.944–1.853.320 kB — **gate A MỞ 9/9** | T1 verify — **9 spike B2 trong cửa sổ** (cụm T1/T0, xem §2.5); balloon 4.357.144–5.440.244 kB, 0 mẫu ghim |
| T0 O8 23:43:42–23:47:50Z | #85 | 0,88–2,55 (4 mẫu) | 1.116.944–1.853.320 kB — **gate A MỞ 4/4** | T0 O8 — **2 spike B2 trong cửa sổ** (spike 23:43:50Z, 23:44:26Z); WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (T0); balloon 4.357.144–4.706.404 kB, 0 mẫu ghim |
| T5 repair #85 23:42:00–23:46:57Z | #85 | 0,88–5,87 (5 mẫu) | 1.116.944–1.853.320 kB — **gate A MỞ 5/5** | T5 repair — **5 spike B2 trong cửa sổ** (cùng cụm T1/T0; apt store xuất hiện trong spike 23:43:15Z với delta 0 — người ngoài cuộc, xem §2.5); balloon 4.357.144–5.036.368 kB, 0 mẫu ghim |
| T4 attempt1 00:07:44–00:09:49Z | #85 | 1,58–2,88 (2 mẫu) | 1.391.496–1.410.520 kB — **gate A MỞ 2/2** | T4 attempt1 PAGE-WEDGED — **0 spike B2 trong cửa sổ**; balloon 4.582.412–4.762.284 kB, 0 mẫu ghim |
| T4 attempt2 00:09:49–00:13:52Z | #85 | 0,40–1,55 (4 mẫu) | 1.347.424–1.609.460 kB — **gate A MỞ 4/4** | T4 attempt2 **LƯỢT HỢP LỆ** — **0 spike B2 trong cửa sổ**; balloon 4.691.036–5.156.240 kB, 0 mẫu ghim |
| T8 O8 00:26:57–00:29:33Z | #85 | 0,57–0,95 (2 mẫu) | 699.608–825.788 kB — **gate A MỞ 0/2** | T8 O8 — **0 spike B2 trong cửa sổ**; O8 PASS 3/3 (WebKit 21/21 ×2 + Chromium 21/21); balloon 5.329.712–5.421.464 kB (đang sag), 0 mẫu ghim |
| T8 harness 00:31:13–00:46:56Z | #85 | 0,57–2,54 (16 mẫu) | 504.700–1.455.068 kB — **gate A MỞ 2/16** | T8 harness — **0 spike B2 trong cửa sổ**; harness WebKit 3/3 + Chromium 3/3, 6/6 PASS, 0 KẸT (xem dưới); balloon 5.093.600–5.902.940 kB (đang sag), 0 mẫu ghim |

### 2.5 B2 — 10 spike THẬT, 8/10 QUY ĐƯỢC DRIVER CỤ THỂ, 2 load1 dư (9 spike trên #85, 1 spike trên #86; 0 spike trong các chuỗi ghim; 0 spike trong cửa sổ attempt của T4 / O8 của T8 / harness của T8; 2 spike trong cửa sổ O8 của T0)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-174-T9-8). **10 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 10): 9 spike cụm T1/T0 (23:42:06–23:49:49Z); 1 spike sau reboot #86 (01:03:13Z); 0 spike trong span ghim E-181 (23:38:36–23:39:36Z), E-182 (00:04:37Z), E-183 (00:26:37Z), E-184 (00:54:38–01:01:39Z), E-185 (01:12:13–01:18:13Z), E-186 (01:20:13–01:55:14Z); 10 spike trong span sag (9 trên #85 + 1 trên #86); 0 spike trên #86 sau 01:03:13Z.**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — cụm T1/T0 (9 spike) | 23:42:06–23:49:49Z | 5,02 → 4,41 → 7,03 → 5,41 → 3,01 → 4,33 → 5,89 → 5,50 → 3,55 | 9 | 23:42:06Z: node render.js **100% tích lũy** (T1 suite round93-u4; delta thiếu — xem dưới); 23:42:39Z: python3 mask_anim.py **80%**, delta **83** + find **20%**, delta **14** (T1 + T2); 23:43:15Z: python3 mask_anim.py **54,5%**, delta **80** + apt store 63,6%, delta **0** (T5 repair — người ngoài cuộc) + find delta **8**; 23:43:50Z: python3 mask_anim.py **45,5%**, delta **62** + MiniBrowser **36,4%**, delta **12** + WebKitWebProcess **18,2%**, delta **32** + vite delta **25** (T1 + T0 O8); 23:44:26Z: ffmpeg **70%**, delta **62** + ffmpeg testsrc2 **40%**, delta **28** + WebKitWebProcess **30%**, delta **22** + MiniBrowser delta **23** (T1 + T0 O8); 23:48:02Z: ffmpeg testsrc2 **118,2%**, delta **129** (T1); 23:48:38Z: ffmpeg testsrc2 **109,1%**, delta **127** (T1); 23:49:14Z: hatch 10% + find delta **9** — **KHÔNG process nào giải thích được load1 5,50 → load1 dư** (xem dưới); 23:49:49Z: hatch 20% + hatch-execd 10%, delta hatch **28** — **KHÔNG process nào giải thích được load1 3,55 → load1 dư** (xem dưới) | **Cụm tải mở đợt 174: T1 verify suite (ffmpeg testsrc2/mask_anim/render.js) + T0 O8 WebKit + T5 repair** — nhiều luồng mở cùng lúc trên boot #85. Load1 max đợt (watcher) **7,03 lúc 23:43:15Z** (sampler bắt 5,97 — khớp, khác cadence). **2 spike TRONG cửa sổ O8 của T0** (23:43:50Z, 23:44:26Z — spike 23:43:15Z nằm TRƯỚC cửa sổ 27 s) |
| 2 — sau reboot #86 (1 spike) | 01:03:13Z | 4,92 | 1 | hatch daemon **63,6%**, delta **71** + apt-get/http/https/gpgv 0,0% (T5 repair — người ngoài cuộc) | **Tải sau reboot #86: hatch daemon** — T9 khởi động lại sampler/watcher cùng lúc; apt-get của T5 đang chạy nền nhưng 0,0% |

- **Tổng kết đếm: 8/10 spike có driver process cụ thể + 2 spike lớp "load1 dư"** (đợt 173: 9/9 quy được + 0 load1 dư; đợt 172: 10/10 quy được + 0 load1 dư; đợt 171: 11/12 quy được + 1 load1 dư; đợt 170: 18/19 quy được + 1 load1 dư; đợt 169: 9/9 quy được + 0 load1 dư; đợt 168: 12/15 quy được + 3 load1 dư; đợt 167: 16/22 quy được + 6 load1 dư; đợt 166: 13/16 quy được + 3 load1 dư; đợt 165: 15/18 quy được + 3 load1 dư; đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư). Đợt này tỉ lệ load1 dư 2/10 = 20%.
- **2 load1 dư — spike 8 (23:49:14Z, load1 5,50) + spike 9 (23:49:49Z, load1 3,55):** cả hai xảy ra SAU khi suite T1 kết thúc (23:49:01Z) — 13 s và 48 s sau khi suite xong. Snapshot tức thời + ps tích lũy đều không có process nào trên 6% (spike 8: hatch 5,6% tích lũy, find 4,9%; spike 9: hatch 5,7%, hatch-execd 0,8%); nr_running 1/474 và 6/471; D-state 1 và 0. Load5 3,46/3,20 + load15 1,97/1,94 cho thấy tải đang decay — **tàn dư 1-phút-trung-bình của suite T1 vừa kết thúc, không còn process sống nào gây ra**. T9 phán 2 spike này là load1 dư theo đúng định nghĩa lớp (không process trong snapshot giải thích được load1); phương án thay thế — quy về "tàn dư suite T1" — được ghi rõ để T10/parent xét (nếu chấp nhận phương án thay thế thì 10/10 quy được, 0 load1 dư).
- **Caveat đếm (F-174-T9-6):** 4 dòng delta thiếu trong spike 1 (23:42:06Z — chỉ 1 dòng delta thay vì 5: node render.js 100% tích lũy đã thành zombie MainThread trước khi vòng delta chạy) — quy driver bằng ps-top tích lũy (node render.js 100%), như tiền lệ F-163-T9-9, F-164-T9-7, F-165-T9-6, F-166-T9-6, F-167-T9-6, F-168-T9-10, F-169-T9-5, F-170-T9-5, F-171-T9-8, F-172-T9-8 và F-173-T9-8 (5 dòng đợt 173). **Không spike nào trong 8 spike quy được mất attribution** (cả 8 đều có driver cụ thể qua top -b và/hoặc ps tích lũy). `grep -c 'WebKit\|MiniBrowser'` = **11 dòng** (các spike O8 WebKit của T0 — đợt 173: 12 dòng).
- **apt-get update xuất hiện trong spike 3 (23:43:15Z) NHƯNG KHÔNG PHẢI DRIVER:** `/usr/lib/apt/methods/store` 63,6% tức thời nhưng delta **0** — đây là repair #85 của T5 đang chạy nền (replay #85 chạy một phần 159/170 intent, poll0 exit=1 23:42:00Z — xem §5.2); apt chỉ là người ngoài cuộc trong snapshot, không gây spike nào. Cùng mẫu đợt 173 (repair #83 xuất hiện trong 5 snapshot spike với delta 0) và đợt 172.
- **T7 churn script xuất hiện trong spike 8 + 9 NHƯNG KHÔNG PHẢI DRIVER:** `bash t7-control-a174.sh` 0,1%, delta **1** và **0** — tải phụ, không gây spike. Cùng mẫu đợt 173.
- **T2 find xuất hiện trong spike 2 + 3 (delta 14 + 8) và spike 6 + 7 (delta 4 + 6) NHƯNG KHÔNG PHẢI DRIVER CHÍNH:** find quét workspace của T2 (m56-174.py / *.log — điều tra (m) + hole-recheck) — tải phụ sau mask_anim/ffmpeg, không gây spike nào. Cùng mẫu đợt 173 (find m56 của T2 trong 3 spike sau reboot #84).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: 4 dòng delta thiếu trong spike 1 (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 8 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 8/10 spike — 2 spike còn lại là load1 dư theo định nghĩa (xem trên).
- **Delta tick lớn nhất đợt: 129 tick/s** (ffmpeg testsrc2, spike 23:48:02Z, load1 4,33). (Đợt 173: max 100 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 23:38:36Z CÙNG lúc sampler — **0 khoảng mù đầu phiên đợt này** (spike đầu tiên watcher bắt được là 23:42:06Z, ~3,5 phút sau khi mở — trước đó load1 < 3,0; sampler load1 lúc mở 1,08). **Khoảng mù qua reboot #86: 94 s** (watcher chết 01:01:37Z, chạy lại ~01:03:13Z — cùng gap với sampler; 0 spike nào bị lỡ có thể kiểm chứng — load1 sampler trên #86 max 4,92 trong 9 mẫu đầu, và watcher bắt được 1 spike ngay khi chạy lại). **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg testsrc2/mask_anim/render.js xuất hiện trong 7 spike của cụm mở đợt** (testsrc2 1920x1080 + mask_anim + ffv1 mask frames + render.js round93-u4 — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 4 dòng delta thiếu — xem §2.5). **T2 find + python3 eperm-sweep9696.py xuất hiện trong 4 spike** (23:42:39–23:49:14Z — điều tra (m) + EPERM probe, chỉ là tải phụ). **T0 O8 WebKit (MiniBrowser/WebKitWebProcess/vite) xuất hiện trong 2 spike** (23:43:50–23:44:26Z — O8 driver của T0; WebKit PASS ×2 — xem §5.3). **T7 churn (t7-control-a174.sh) xuất hiện trong 2 spike** (23:49:14–23:49:49Z — tải phụ, delta 0–1). **Hatch daemon xuất hiện trong 6 spike** (23:42:06–23:49:49Z + 01:03:13Z — tải nền + tải sau reboot, driver chính chỉ ở spike 01:03:13Z). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite + T0 O8 + T2 điều tra + T5 repair + T7 churn + hatch daemon; **11 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log** — đều thuộc cụm T0 O8).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ hai mươi tám liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round174-t9/sampler.sh` chạy liên tục 23:38:36Z–01:55:14Z (2 instance: instance 1 sống 23:38:36–01:01:39Z trên #85 rồi **CHẾT theo reboot #86**; instance 2 khởi động lại 01:03:13Z trên #86, sống tới khi T9 dừng tay 01:55:19Z — **1 gap qua reboot (94 s), 0 gap >90 s khác; max gap trong boot 61 s**), **137 mẫu**; các gap còn lại max 61 s (đợt 173: max 61 s trong boot, 116 s qua reboot; đợt 172: max 61 s trong boot, 92 s qua reboot; đợt 171: max 61 s; đợt 170: max 61 s; đợt 169: gap 109 s qua reboot #78; đợt 168: gap 55 s qua reboot #76; đợt 167: gap 77 s qua reboot #74; đợt 166: gap 73 s qua reboot #71; đợt 165: gap 35 s qua reboot #70; đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.087.224 kB = 33,17% guard** (đợt 173: 44,14%; đợt 172: 48,13%; đợt 171: 98,69% — sát nhất từ trước tới nay; đợt 170: 54,25%; đợt 169: 49,84%; đợt 168: 52,03%; đợt 167: 40,10% — thấp nhất chuỗi; đợt 166: 69,93%; đợt 165: 58,05%; đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). Khoảng cách tới guard lúc đỉnh: **4.204.232 kB (66,83%)** — xa guard nhất kể từ đợt 167 (40,10%). **Caveat (xem F-174-T9-4): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.** Mẫu trước đỉnh (00:13:37Z): 1.609.460 kB; mẫu sau đỉnh (00:15:37Z): 1.839.644 kB — đỉnh là một mẫu đơn lẻ, RAM rơi 247.580 kB trong 60 s sau đó; không có mẫu nào khác trên 2.000.000 kB trong phiên.
- **0 lần thử birefnet trong đợt 174 — lần thứ hai mươi tám liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0; đợt 166: 0; đợt 167: 0; đợt 168: 0; đợt 169: 0; đợt 170: 0; đợt 171: 0; đợt 172: 0; đợt 173: 0; đợt 174: 0). **Chuỗi 0 lần thử: 28 đợt liên tiếp** (đợt 147–174).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 28 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round174-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `/usr/bin/python3.12` — giống đợt 173); `bgremove.py` **23.500 B** (không đổi so với đợt 173); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-174-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt.**
- **Không cần chạy lại birefnet trong đợt 174** (không mẫu nào đạt guard; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (#85 đếm tới 84 dòng lúc lan-3 + #86 = 17 dòng; tổng trong đợt đếm trực tiếp ≥72 dòng — đợt thứ hai mươi ba liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#85** (3c704685, btime 22:59:36Z): **đếm trực tiếp tới 84 dòng lúc lan-3 00:38:36Z** (T9 đếm trực tiếp; **không đếm lại được tổng cuối — journal MẤT theo reboot #86 lúc 01:01:37Z**, cùng mẫu F-171-T10-4). Dòng đầu tiên trên #85: **23:01:29Z (boot+113s)** — TRƯỚC khi đợt mở 34m22s (toàn bộ 3 dòng đầu thuộc về đợt 173 — xem dưới); dòng cuối cùng đếm được: **00:37:29Z** (lúc lan-3 00:38:36Z, count=84).
- Nhịp đều bất thường (cùng mẫu đợt 173 trên #84): 32 dòng lúc probe mở 23:38:36Z → 58 dòng lúc lan-2 00:08:36Z (+26 dòng) → 84 dòng lúc lan-3 00:38:36Z (+26 dòng) → (journal mất theo #86). **ENOSPC tăng đúng +26 dòng mỗi khoảng 30 phút, 2 khoảng liên tiếp đo được** — đều như đồng hồ (T9 ghi tương quan, không phán cơ chế — systemd retry theo chu kỳ cố định là giả thuyết, không phải kết luận).
- **Phần trong cửa sổ đợt trên #85: 55 dòng đếm trực tiếp.** Số dòng TRƯỚC khi đợt mở (23:35:51Z) trên #85 ước lượng ≈ 29 dòng: 3 dòng lúc đợt 173 đóng (23:04:47Z) + ~26 dòng theo nhịp ~70 s tới 23:35:51Z; kiểm chứng chéo: count=32 lúc 23:38:36Z − ~3 dòng trong 23:35:51–23:38:36Z ≈ 29. Vậy phần trong đợt tới lan-3 = 84 − 29 = **55 dòng (đếm trực tiếp, sai số ước lượng ±2 dòng do mốc 29 là ước lượng)**. Phần đuôi #85 từ lan-3 (00:38:36Z) tới reboot #86 (01:01:37Z, 23 phút): **ngoại suy theo nhịp +26/30 phút ≈ +20 dòng — NGOẠI SUY, KHÔNG PHẢI SỐ ĐẾM** (tổng trong đợt trên #85 ước tính ≈ 75 dòng).
- Boot **#86** (70b7f7ee, btime 01:01:37Z): **17 dòng** (T9 đếm trực tiếp lúc đóng phiên; journal còn nguyên). Dòng đầu tiên trên #86: **01:03:39Z (boot+122s)** — đúng trong lúc cửa sổ thoáng đóng (xem §1.2); dòng thứ hai 01:04:49Z; dòng cuối cùng: **01:21:59Z** — **0 dòng mới sau 01:21:59Z** trong 33 phút còn lại tới đóng (01:55:19Z), trong khi headroom đã về 2 (xem §1.2). Toàn bộ 17 dòng thuộc về đợt 174.
- **Tổng đợt 174 đếm được trực tiếp: ≥72 dòng trong cửa sổ đợt** (55 dòng trên #85 sau mốc mở + 17 dòng trên #86) — **cận dưới, không phải tổng tuyệt đối** (tổng cuối trên #85 không đếm được vì journal mất; ngoại suy theo nhịp, tổng trong đợt ≈ 92 dòng, tức phần trong đợt ~92 dòng — NGOẠI SUY, KHÔNG PHẢI SỐ ĐẾM).
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 173: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 173:** đợt 173 có 3 dòng trên #83 + ≥78 dòng trên #84 + 3 dòng trên #85 (tổng đếm được ≥84 dòng). Đợt này **55 dòng trên #85 sau mốc mở (đếm trực tiếp tới lan-3) + 17 dòng trên #86 (đếm trực tiếp tới đóng) = ≥72 dòng đếm trực tiếp** — thấp hơn đợt 173 vì headroom về 2 trên #86 nên ENOSPC dừng ở 17 dòng (đợt 173 headroom toàn-0 suốt phiên trên cả #84 lẫn #85 nên ENOSPC tăng đều tới khi journal mất). Đợt này là đợt thứ 23 liên tiếp có lỗi thật (chuỗi không đứt — ≥72 dòng đếm trực tiếp đã đủ).
- **Caveat `journalctl --since` (xem F-174-T9-5):** lệnh `journalctl --since "2026-11-22 23:35:00"` lúc đóng chỉ trả **17 dòng** — vì journal của #85 đã mất theo reboot #86, chỉ còn journal #86. **17 KHÔNG phải tổng đợt** (tổng đợt đếm trực tiếp ≥72 dòng — xem trên). T10 không được đọc 17 là tổng đợt.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 MỘT reboot GIỮA PHIÊN — #86 (T9 bắt trực tiếp, khởi động lại trong ~96 s) — cộng 1 reboot TRƯỚC KHI đợt mở (#85)

- **Reboot #86 (70b7f7ee, btime 01:01:37Z 23/11; gap #85→#86 = 7.321 s):** xảy ra **GIỮA PHIÊN** lúc T9 đang đo (T9 phát hiện ~01:02:44Z, 67 s sau btime — khi kiểm tra lại sau khi lệnh sleep chờ lan-3 bị gián đoạn do runtime restart; xem F-174-T9-2). **Sampler + watcher B2 + probe-loop của T9 CHẾT theo reboot** (log dừng 01:01:39Z — mẫu cuối trên #85, 2 s SAU btime; probe-loop gốc chết trước lan-4). T9 **KHỞI ĐỘNG LẠI cả ba trong ~96 s** (sampler chạy lại 01:03:13Z = boot+96s; watcher B2 chạy lại cùng lúc; probe-loop-86 viết mới chạy lan-2 đúng lịch 30 phút). **Gap 94,0 s qua reboot #86** (01:01:39Z → 01:03:13Z); max gap trong boot 61,0 s. Số hiệu #86 theo đếm tuần tự — T0-175 xác minh 9 nguồn (T9 chỉ quan sát btime/boot_id/journal/uptime).
- **Reboot #85 (3c704685, btime 22:59:36Z; gap #84→#85 = 7.101 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ 36m15s** (đợt mở 23:35:51Z, boot+36m15s). T0-174 xác minh 9/9 nguồn. **KHÔNG có reboot nào khác giữa phiên đợt 174** — chỉ #86 (giữa phiên) + #85 (trước khi đợt mở).
- **Khoảng trống phủ sóng đầu phiên:** đợt mở 23:35:51Z (boot+36m15s), T9 nhận việc ~23:38Z (boot+~39m), sampler khởi động 23:38:36Z (boot+39m) — **gap 165 s từ lúc đợt mở tới khi sampler chạy** (đợt 173: gap 268 s; đợt 172: gap 174 s; đợt 171: gap 516 s; đợt 170: gap 133 s; đợt 169: gap 388 s; đợt 168: gap 283 s; đợt 167: gap 162 s; đợt 166: gap 179 s; đợt 165: gap 1.760 s; đợt 164: gap 383 s; đợt 163: gap 113 s). Gap đầu phiên đợt này NGẮN (T9 spawn nhanh) — nhưng vẫn đủ để cửa sổ thoáng của #85 (nếu có, ~boot+60–200s) đóng trước khi T9 mở (xem §1.2, F-174-T9-1).
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T7-172 đo trong phiên đợt 172: 19:39:46 vs local 19:39:45 — chênh 1 s; T5-173 đo trong phiên đợt 173: CF nhanh hơn local ~0,2–1,4 s; T9 không đo lại).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T0-174 đếm 37 reboot #49–#85; T5-174 đếm 37 reboot #49–#85; marker sống qua #86 = 38 reboot nếu T0-175 xác nhận — theo T0/T5-174).
- **X11 (T9 kiểm tra lúc đóng phiên 02:00Z):** `/tmp/.X11-unix/` **TRỐNG** (0 socket — X188/X193–X195 đã biến mất theo reboot #85/#86; T4-173 ghi X188 còn lại lúc đóng 22:37Z; T0/T1-173 ghi 3 socket mồ côi X193–X195 mtime 20:47Z trong phiên trên #83 — cả hai đều đã biến mất sau reboot #86 lúc T9 kiểm tra).

### 5.2 T5-174 (infra) — POSTBOOT_PASS #85 ĐÃ CÓ (mode repair-tay-T5); replay host-side #85 CHẠY MỘT PHẦN

- **POSTBOOT_PASS #85 ĐÃ CÓ lúc 23:46:57Z** (boot+47m21s — theo T5-174; repair-tay-T5, poll=1, verify độc lập exit 0 lúc 23:46:25Z; 11/11 gói + 5/5 lib, GST symlink→debroot 269=269; dpkg 1731 dòng; cache 110; lists 75 — theo T5-174; T5 sở hữu số chi tiết). **Replay host-side #85 CHẠY NHƯNG CHỈ MỘT PHẦN: 159/170 intent** (thiếu plugins-bad + -gl + libEGL), poll0 exit=1 23:42:00Z; manual --repair exit=0 (3m10s) — cờ thứ năm liên tiếp có caveat "không replay-đầy-đủ" (#75/#81/#84 + #85). Hướng (3) đứng lần 21.
- **POSTBOOT_PASS #84 VẪN CÓ** (theo T5-174). **POSTBOOT_PASS #83 KHÔNG CÓ** (boot thứ 16 không cờ — parent chọn (b2) đợt 173). **POSTBOOT_PASS #82 KHÔNG CÓ** (boot thứ 15 không cờ).
- **Watcher-174: pid 12991 đang chạy (hạn 02:30:00Z)** — theo T5-174.
- **B4: 0 probe chạm dpkg** (theo T5-174).

### 5.3 T8-174 (vite harness + O8) — ĐÃ đóng cờ (~00:57Z); O8 PASS 3/3 trên #85, đề xuất chuỗi WebKit FULL PASS 24 → 25; harness 6/6 SẠCH, 0 KẸT; (f') V1 live 0 kích hoạt; Q3 kiểm lại PASS

- **T8-174 ĐÃ xuất bản LIMITS + viết cờ `round174-t8.done`** — T9 chỉ đối chiếu bằng dữ kiện sampler + B2 độc lập, không phán thay T8.
- **O8 PASS 3/3 trên boot #85** (00:26:57–00:29:33Z — WebKit 21/21 ×2 pid52401 md5 18340611 + pid52799 md5 bcc11471; Chromium 21/21 pid53193 md5 97d9308e; exit 0/0/0): **0 spike B2 trong cửa sổ O8** (khác đợt 173: 1 spike trong cửa sổ O8 của T8). **T8 ĐỀ XUẤT chuỗi WebKit FULL PASS 24 → 25** — T0 O8 cùng boot #85 PASS 3/3 độc lập (23:43:42–23:47:50Z) + T4 #43 CÓ lượt hợp lệ (attempt2 20/20 + B 5/5) — hai bộ O8 độc lập đồng thuận PASS + lượt yên hợp lệ trên boot đo (parent quyết cuối — xem §5.4). **T8 đóng sớm hạn cờ ~1h03m** (00:57Z).
- **Đối chiếu sampler T9 trong cửa sổ O8 (00:26:57–00:29:33Z): 2 mẫu, gate A MỞ 0/2** (00:27:37Z 825.788 kB; 00:28:38Z 699.608 kB — cả 2 đều <1024 MiB; số từ log đóng băng), balloon 5.329.712–5.421.464 kB (82,7–84,1% trần, đang sag, không ghim), load1 0,57–0,95 (sampler; watcher không bắt spike nào trong cửa sổ — khớp).
- **Harness WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (00:31:13–00:46:56Z): WebKit 84l10 **PASS** (Q3 kiểm lại: W2 6 tick + W2/E4 PASS); WebKit 85m4 **PASS**; WebKit 86n2 **PASS**. Kẹt cộng dồn GIỮ 20. Chuỗi "P3 không kẹt" 2 → 3 (đợt sạch thứ ba liên tiếp 172–174). Đối chiếu sampler T9 trong cửa sổ harness: gate A MỞ 2/16; RAM min trong cửa sổ harness 504.700 kB @00:41:38Z trong lúc sag — **0 spike B2** (xem §2.4).
- **(f') V1 live: 0 kích hoạt** (0 kẹt thật, 0 FP); check-fresh: 84l10 OK maxspan=0s, 85m4 OK maxspan=5s; replay C5.1 ĐẠT (kẹt-164 @125s, 0 FP trên 10 log sạch). **(1c') (c') GIỮ NGUYÊN diag-only** (theo T8-174).
- **Q3 ĐÃ KIỂM LẠI** (84l10 heartbeat: WebKit W2 6 tick + W2/E4 PASS; Chromium W2 5 tick + W2/E4 PASS; E4 0 tick cả hai — đúng thiết kế).
- **H3: VẪN MỞ, chỉ giám sát thụ động** (theo T8-174 — 0 kẹt mới). **ĐIỀU TRA RIÊNG 84l10 — ĐỢT 3 XONG** (Q3 kiểm lại xong, chưa có ca kẹt mới).

### 5.4 T7-174 (scheduler) + T2-174 + T0-174 — T7 CHƯA đóng cờ lúc T9 đóng; run 173 TIMEOUT, (m) #84/#85 DƯƠNG (CUỐI), INSIDE #83/#84/#85 TRUE → CHUỖI dài 4

- **T7-174 CHƯA xuất bản LIMITS + CHƯA viết cờ `round174-t7.done` lúc T9 đóng (~02:00Z)** — T9 chỉ đối chiếu bằng dữ kiện T0/T2 đã xuất bản, không phán thay T7. Kết cục run 174 thuộc T7-174/T10. T9 đóng cờ ĐÚNG hạn cờ ~02:00Z (không trễ như đợt 173 — xem F-174-T9-8).
- **Run 173 TIMEOUT** (theo T0-174: finished 23:36:04Z theo DB, wall 10.813 s, sau hạn 13 s, 2 lần viết lại tại #84 + #85; run 174 sched/started 23:35:51Z — theo T0-174).
- **(m) #84: DƯƠNG (CUỐI, T2)** (theo T2-174: 1 requeue duy nhất eid 10197, run 173, 21:02:00.482Z = btime +45,482 s ∈ [33; 49,8] — cách biên dưới 12,482 s, biên trên 4,318 s; 1 run sống tại btime; đối chiếu độc lập từ DB tươi + neo frame-drift kiểm lại từ file gốc. **Nếu parent CHẤP NHẬN: n ứng viên 30/31 → 31/32.** T2-174 phán DƯƠNG CUỐI — parent quyết cuối.
- **(m) #85: DƯƠNG (CUỐI, T2)** (theo T2-174: 1 requeue duy nhất eid 10222, run 173, 23:00:10.397Z = btime +34,397 s ∈ [33; 49,8] — cách biên dưới 1,397 s, sát biên thứ hai sau #81; biên trên 15,403 s; 1 run sống tại btime. Caveat: verdict KHÔNG bền với neo watcher +8 s (counterfactual +26,397 s dưới dải); caveat phân số F-174-T0-4 (+33,668 s, vẫn trong dải). **Nếu #84 và #85 cùng được chấp nhận: n ứng viên 30/31 → 32/33.** n chính thức GIỮ 14. T2-174 phán DƯƠNG CUỐI — parent quyết cuối.
- **(m) #86: thuộc T2-175 + parent** (T9 không kiểm — giao T2-175).
- **INSIDE (theo T2-174): #83 TRUE (FULL129) — FINAL, chuỗi dài 2; #84 TRUE (FULL130) — chuỗi dài 3; #85 TRUE (FULL131) — chuỗi dài 4.** Hai dải mâu thuẫn ở #83 (FULL128 NGOÀI, muộn 3.386 s) và #85 (FULL130 NGOÀI, muộn 399 s); hai dải đồng thuận ở #84 (FULL129 + FULL130) — T2-174 phán FINAL (T2-174 + parent xác nhận). **INSIDE #86: thuộc T2-175** (FULL132).
- **(m) #56 vẫn có điều kiện** (theo T2-174 — lần thứ mười bảy không thu hẹp được; T9 không trích số — thuộc T2-174/T10).
- **Mù #96? (theo T2-174 — T9 không trích số chi tiết):** mù #88? VẪN MỞ (hole-recheck lần thứ 18: 337 hit, 0 mốc mới — lần thứ mười tám liên tiếp 0); #95?/#94?/#77? giữ nguyên; CERT/FULL GIỮ 76/91 (theo T2-174).
- **Lệch khung #86: thuộc T2-175** (T9 ghi: mẫu sampler cuối trên #85 lúc 01:01:39Z, **2 s SAU btime #86** — boot_id cũ vẫn đọc được 2 s sau btime mới; xem F-174-T9-2). **Lệch khung #85: thuộc T2-174** (T9 không kiểm — giao T2-174).
- **#84/#85 KHÔNG giết holder** (theo T6-174 — chuỗi từ #69 tiếp tục; T9 không trích số — thuộc T6-174/T10). **#86 có giết holder không: thuộc T6-175.**

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc 02:00Z (8/9)** — T7 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T0-174:** reboot #85 XÁC MINH 9/9 nguồn (btime 22:59:36Z, epoch 1795388376; gap #84→#85 = 7.101 s); reboot #84 XÁC MINH 9/9 nguồn (nợ đợt 173 — btime 21:01:15Z, gap 2.128 s); marker sống qua 37 reboot #49–#85; **(m) #84/#85 DƯƠNG (CUỐI, T2)**; T0-174 cũng chạy O8 độc lập trên boot #85: WebKit PASS 21/21 ×2 (pid18668, pid25983, exit 0) + Chromium PASS 21/21 (pid32439, exit 0) — 23:43:42–23:47:50Z, attempt1 hoàn toàn tiền-postboot mà vẫn PASS (FAIL WebKit #83 là timing môi trường, không phải hồi quy code). T9 không trích số khác — thuộc T0-174/T10.
- **T1-174:** verify đợt 173 — verdict PASS, suite chạy lại **28/28 exit 0 trên boot #85** (23:40:11–23:49:01Z, 8m50s); `npm test` 12 pass; đợt 173 = 10 batch / 15 entry / 15 đường dẫn / 13 file mới (đếm khớp từng số quyết parent (p) §12.3 đợt 173 bằng script dedup toàn cục viết mới — **lần thứ 72 liên tiếp**); **lũy kế 111–173 = 618/1.092/946/768; chờ push 166–173 = 80/113/106/104**; **10/10 cờ đợt 173 có nội dung**. T9 không trích số khác — thuộc T1-174/T10.
- **T6-174:** (A) kiểm chứng lại **120/120 PASS dưới churn (lần thứ hai mươi tư liên tiếp)**; prune lần 49 (xóa 3 file — theo T6-174, T9 không trích số chi tiết); #84/#85 không giết holder. T9 không trích số — thuộc T6-174/T10.
- **T4-174:** xem §2.3 (LIMITS đã xuất bản).
- **T2-174:** xem §5.4 (LIMITS đã xuất bản).

## 6. Sai số / caveat (F-174-T9-*)

- **F-174-T9-1 — CỬA SỔ THOÁNG QUAN SÁT ĐƯỢC LẦN THỨ BA LIÊN TIẾP (đợt 172 + 173 + 174) — NHƯNG CẶP CỬA SỔ CHÊNH NHAU LẦN ĐẦU TIÊN.** Reboot #86 btime 01:01:37Z xảy ra GIỮA PHIÊN lúc T9 đang đo; T9 bắt được cửa sổ trực tiếp: **30.001, 29.052 lúc 01:03:04Z = boot+87s** (probe thứ hai trong cặp đã tụt 949 so với probe thứ nhất — lần đầu tiên hai probe trong cùng một cặp cửa sổ chênh nhau; các đợt 163–166/172/173: cặp cửa sổ đều 30.001, 30.001, chênh 0), về **0 lúc boot+181s** (01:04:38Z) và **0 lúc boot+241s** (01:05:38Z). Cửa sổ mở tại boot+87s và đã đóng trước boot+181s — rộng chưa tới 94 s, cùng mẫu các đợt 163–166, 172 và 173 (30.001 lúc boot+63–87s → 0 lúc boot+110–241s). ENOSPC đầu tiên trên #86 lúc 01:03:39Z = boot+122s — nằm trong (01:03:04Z, 01:04:38Z], đúng trong lúc cửa sổ đóng. **Cửa sổ #85 KHÔNG quan sát được** (reboot TRƯỚC khi đợt mở 36m15s — cùng mẫu cấu trúc đợt 170/171/172-#81/173-#83). Lưu ý: probe thứ hai tụt 949 cho thấy watch ngoài cell đang được thêm vào NGAY trong lúc T9 đo (giữa hai probe cách nhau vài giây) — T9 ghi đúng số đo, không phán cơ chế (ai thêm watch, tốc độ bao nhiêu — ngoài tầm cell).
- **F-174-T9-2 — REBOOT #86 GIỮA PHIÊN GIẾT SAMPLER + WATCHER B2 + PROBE-LOOP CỦA T9 — T9 KHỞI ĐỘNG LẠI TRONG PHIÊN, 0 SỐ LIỆU MẤT NGOÀI 1 GAP QUA REBOOT + 1 LỆNH CHỜ BỊ RUNTIME RESTART GIÁN ĐOẠN.** Sampler instance 1 dừng ở mẫu cuối 01:01:39Z (**2 s SAU btime #86** — boot_id cũ vẫn đọc được 2 s sau btime mới, OVERLAP — T2-175 đếm dòng boot cũ sau btime; cùng mẫu F-173-T9-7: mẫu sampler cuối trên #83 lúc 21:01:20Z, +5 s sau btime #84); instance 2 chạy lại 01:03:13Z (boot+96s). Gap 94,0 s qua #86. Probe-loop gốc chết trước lan-4; T9 viết lại `probe-loop-86.sh` chạy lan-2 (01:33:13Z) đúng lịch 30 phút; lan-3-86 (~02:03:13Z) KHÔNG chạy được vì đợt đóng trước đó — T9 đóng bằng probe tay (cặp đóng 01:55:19Z). **Điểm yếu (d) đợt 148 (loop chết theo reboot) TÁI DIỄN — nhưng lần này T9 phát hiện + khởi động lại trong phiên, không để mất cả nửa phiên như đợt 148.** E-184 ghim tới mẫu cuối trên #85 — thời điểm đứt thật nằm trong (01:01:39Z, 01:03:13Z]; T9 không claim cụ thể hơn. **Sự cố phụ trong phiên:** lệnh `sleep 1500` chờ lan-3 của T9 bị gián đoạn khi runtime restart (không có kết quả cuối được xác nhận) — sampler/probe-loop/B2-watcher KHÔNG bị ảnh hưởng (chúng là process nền riêng, chỉ chết do reboot #86); T9 kiểm tra lại trực tiếp bằng lệnh mới và phát hiện #86 lúc 01:02:44Z (boot+67s), probe cửa sổ lúc 01:03:04Z (boot+87s) — cửa sổ vẫn bắt được. Không mất số liệu (sampler đã ghi mẫu cuối 01:01:39Z trước khi chết; watcher không ghi thêm spike nào trong khoảng gián đoạn ngoài spike 01:03:13Z đã bắt được sau khi chạy lại).
- **F-174-T9-3 — E-181 + E-182 + E-183 + E-184 + E-185 + E-186 PHÁN 6 EPISODE MỚI — giao T10 xác nhận cách đếm (CÓ PHƯƠNG ÁN THAY THẾ + MẪU MỚI: EPISODE 1-MẪU).** E-181: 23:38:36–23:39:36Z, 2 mẫu ghim liên tiếp trên #85, 1 chuỗi — KẾT THÚC bởi sag 24 mẫu (xả tới 67,6% trần); bắt đầu trong khoảng mù 2.046 s (không claim thời điểm ghim thật). E-182: 00:04:37Z, 1 mẫu ghim đơn lẻ trên #85, 1 chuỗi — KẾT THÚC bởi sag 21 mẫu (xả tới 90,8% trần). E-183: 00:26:37Z, 1 mẫu ghim đơn lẻ trên #85, 1 chuỗi — KẾT THÚC bởi sag 27 mẫu (xả tới 79,0% trần). E-184: 00:54:38–01:01:39Z, 8 mẫu ghim liên tiếp trên #85, 1 chuỗi — KẾT THÚC theo reboot #86. E-185: 01:12:13–01:18:13Z, 7 mẫu ghim liên tiếp trên #86, 1 chuỗi — KẾT THÚC bởi micro-dip 1 mẫu 01:19:13Z (99,5% trần). E-186: 01:20:13–01:55:14Z, 36 mẫu ghim liên tiếp trên #86, 1 chuỗi — ĐANG GHIM lúc đóng (số mẫu cuối cùng thuộc T9-175). **Mẫu mới đợt này: E-182 + E-183 là hai episode 1-mẫu đầu tiên** (chạm trần 1 mẫu rồi xả ngay — khác mọi episode trước đều ≥2 mẫu; T9 vẫn phán là episode riêng theo quy tắc chuỗi cơ học vì mỗi mẫu ghim cách mẫu ghim gần nhất >61 s). **Phương án thay thế:** gộp E-185+E-186 qua micro-dip 1 mẫu (99,5% — coi như nhiễu đo) → 5 episode trong đợt (E-181 2 + E-182 1 + E-183 1 + E-184 8 + E-185/186 gộp 43 mẫu). Nếu T10/parent phán ngược (gộp), tổng số episode đợt 174 đổi 6 → 5 nhưng tổng mẫu ghim 55 không đổi. **E-180 KẾT THÚC — GIỮ 2 mẫu** (đứt theo #85 — đã phán đợt 173; mẫu ghim đầu trên #85 trong đợt 174 là E-181 mới vì balloon reset theo reboot).
- **F-174-T9-4 — RAM ĐỈNH PHIÊN 33,17% GUARD — XA GUARD NHẤT KỂ TỪ ĐỢT 167, 0 MẪU ĐẠT GUARD.** Mẫu 00:14:37Z: RAM 2.087.224 kB, cách guard 4.204.232 kB (66,83%); balloon 4.780.184 kB (74,2% trần). **Caveat bắt buộc:** sampler cadence 60 s — một lần vượt guard dưới 60 s giữa hai mẫu liên tiếp KHÔNG loại trừ được (điểm yếu (a) đợt 147). Mẫu trước đỉnh (00:13:37Z): 1.609.460 kB; mẫu sau đỉnh (00:15:37Z): 1.839.644 kB — đỉnh là một mẫu đơn lẻ, RAM rơi 247.580 kB trong 60 s sau đó; không có mẫu nào khác trên 2.000.000 kB trong phiên. T9 claim đúng: **0 MẪU đạt guard → cơ chế (a) KHÔNG kích hoạt**; T9 KHÔNG claim "không có lúc nào vượt guard". Đợt này caveat (a) ít thực chất hơn đợt 171 (đỉnh 98,69% guard) vì đỉnh chỉ 33,17% — thấp nhất kể từ đợt 167 (40,10%).
- **F-174-T9-5 — ENOSPC TRONG ĐỢT ≥72 DÒNG ĐẾM TRỰC TIẾP (55 trên #85 sau mốc mở + 17 trên #86) + ~20 DÒNG ĐUÔI #85 NGOẠI SUY + `journalctl --since` CHỈ TRẢ 17 DÒNG.** Nhịp #85: 32 → 58 → 84 (+26 đúng mỗi ~30 phút, 2 khoảng liên tiếp đo được; cùng nhịp #84 đợt 173). **Số đóng băng của T9 trên #85 là 84 dòng lúc lan-3 00:38:36Z; tổng cuối trên #85 KHÔNG đếm lại được** (journal chỉ còn boot #86 sau reboot — cùng mẫu F-171-T10-4); T10 đếm lại từ journal sẽ chỉ thấy 17 dòng của #86 — chênh lệch là do mất journal, không phải sai số. **Số dòng TRƯỚC khi đợt mở trên #85 (≈ 29 dòng) là ƯỚC LƯỢNG** (3 dòng lúc đợt 173 đóng + ~26 dòng theo nhịp ~70 s tới 23:35:51Z; kiểm chứng chéo bằng 32 − ~3 = 29) — phần trong đợt trên #85 (55 dòng) có sai số ước lượng ±2 dòng. **ENOSPC #86 DỪNG sau 01:21:59Z** (0 dòng mới trong 33 phút cuối) — trùng lúc headroom về 2; T9 ghi tương quan, không phán cơ chế. **Caveat lệnh:** `journalctl --no-pager --since "2026-11-22 23:35:00"` lúc đóng chỉ trả 17 dòng (chỉ còn journal #86) — T10 không được đọc 17 là tổng đợt (tổng đợt đếm trực tiếp ≥72 dòng).
- **F-174-T9-6 — 4 DÒNG DELTA THIẾU TRONG SPIKE 1 — NHƯNG 0 SPIKE TRONG 8 SPIKE QUY ĐƯỢC MẤT ATTRIBUTION + 2 LOAD1 DƯ MỚI.** Spike 23:42:06Z (chỉ 1 dòng delta thay vì 5: node render.js 100% tích lũy đã thành zombie MainThread trước khi vòng delta chạy) — driver quy bằng ps-top tích lũy (node render.js 100% — T1 suite). **Không lặp F-173-T9-8 về số lượng** (đợt 173: 5 dòng delta thiếu; đợt này: 4 dòng). T9 ghi rõ để T10 không đếm nhầm thành "spike không quy được driver" (8/10 spike đều có driver cụ thể qua top -b và/hoặc ps tích lũy). **2 load1 dư (spike 8 + 9, 23:49:14Z + 23:49:49Z)** — tàn dư sau khi suite T1 kết thúc 23:49:01Z, không process nào trong snapshot giải thích được load1 5,50/3,55 (xem §2.5); phương án thay thế (quy về "tàn dư suite T1" → 10/10 quy được) đã ghi rõ để T10/parent xét.
- **F-174-T9-7 — SỐ RAM CỦA T4 ("load1 1,58 → 0,40") VÀ CỦA T9 (attempt2: 0,40–1,55) CÙNG BỘ MẪU, KHÁC KHUNG CỬA SỔ — KHÔNG MÂU THUẪN.** Sampler T9 cadence 60 s: attempt2 (00:09:49–00:13:52Z) 4 mẫu, load1 0,40–1,55; T4 ghi "load1 1,58 → 0,40" trong cửa sổ attempt2 — 1,58 là mẫu 00:09:37Z, thuộc cửa sổ attempt1 (00:07:44–00:09:49Z), không thuộc attempt2. Cả hai cùng chứng minh load1 hạ trong lúc attempt2 chạy — NHƯNG T9 không tranh số của T4; chỉ ghi rõ khung cửa sổ để T10 không đọc nhầm thành "sampler T9 bắt 1,58 trong attempt2". Cùng mẫu F-173-T9-9 (số RAM min của T4 và T9 cùng một trũng, khác cadence).
- **F-174-T9-8 — T7-174 CHƯA đóng cờ lúc T9 đóng (~02:00Z) + T9 ĐÓNG ĐÚNG HẠN CỜ (KHÔNG TRỄ NHƯ ĐỢT 173).** T9 không chờ T7 (kết cục run 174 thuộc T7-174/T10). Khác đợt 173 (T9 trễ hạn cờ ~26' do reboot #85 sát hạn cờ), đợt này T9 đóng đúng hạn cờ vì reboot #86 (01:01:37Z) xảy ra giữa phiên, đủ thời gian khởi động lại + đo tay cửa sổ + track + cặp đóng trước hạn cờ. T9 ghi rõ theo quyết (l) đợt 152.
- **F-174-T9-9 — BÀI HỌC PHƯƠNG PHÁP: LIỆT KÊ TAY <512k SUÝT SAI 1 MẪU — ĐÃ SỬA BẰNG SCRIPT LIỆT KÊ TỪNG MẪU.** Bản nháp §2.1 liệt kê tay 14 mẫu <512.000 kB (7 mẫu E-184 + 3 mẫu sag gồm 00:51:38Z) trong khi script analyze đếm 15 mẫu — T9 kiểm lại bằng script liệt kê từng mẫu: E-184 chỉ 6/8 mẫu <512.000 kB (01:00:39Z 542.380 kB và 01:01:39Z 514.836 kB trên ngưỡng) và 3 mẫu sag là 00:36:38Z/00:38:38Z/00:41:38Z (mẫu 00:51:38Z có mem=701.676 kB, trên ngưỡng — con số 492.448 kB trong bản nháp là số đọc probe lan-3 lúc 00:38:36Z, T9 đã gán nhầm mốc). Bản cuối §2.1 đã sửa theo script (2 + 1 + 1 + 1 + 1 + 3 + 6 = 15 — KHỚP). Bài học: mọi liệt kê mẫu theo nhóm PHẢI chạy script liệt kê, không đếm tay từ bảng giai đoạn (cùng họ F-172-T9-6/F-163-T9-1).
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được — đợt này quan sát được 30.001 lúc boot+87s trên #86 và 29.052 ngay sau đó, nhưng giá trị thật trên CAP không đo được; cửa sổ #85 không quan sát được nên không biết đỉnh); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — xem F-174-T9-4); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #85 từ cell vì journalctl chỉ còn boot hiện tại sau reboot (cùng họ EPERM như `dmesg` — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 174 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).

---

## Phụ lục — log sampler đóng băng (137 mẫu, 23:38:36Z–01:55:14Z)

Nội dung dưới đây được tạo BẰNG SCRIPT từ `hidden_files/round174-t9/ram-sampler-FROZEN.log` (md5 `09d07dcc3d772c9d711bec6d006bb9bf`) — không gõ lại bằng tay (xem F-169-T9-9).

```
2026-11-22T23:38:36Z boot=3c704685 mem=431348 bal=6443824 swapfree=679744 load1=1.08
2026-11-22T23:39:36Z boot=3c704685 mem=449036 bal=6443824 swapfree=650596 load1=0.88
2026-11-22T23:40:36Z boot=3c704685 mem=1337576 bal=5395248 swapfree=621512 load1=2.02
2026-11-22T23:41:36Z boot=3c704685 mem=1335196 bal=5440244 swapfree=631004 load1=2.89
2026-11-22T23:42:36Z boot=3c704685 mem=1786124 bal=4902632 swapfree=656376 load1=4.62
2026-11-22T23:43:36Z boot=3c704685 mem=1705028 bal=5036368 swapfree=674976 load1=5.87
2026-11-22T23:44:36Z boot=3c704685 mem=1116944 bal=4357144 swapfree=653952 load1=2.55
2026-11-22T23:45:36Z boot=3c704685 mem=1351104 bal=4550340 swapfree=648564 load1=1.11
2026-11-22T23:46:36Z boot=3c704685 mem=1853320 bal=4706404 swapfree=650552 load1=0.88
2026-11-22T23:47:37Z boot=3c704685 mem=1255128 bal=4611176 swapfree=647224 load1=1.24
2026-11-22T23:48:37Z boot=3c704685 mem=1749420 bal=4831296 swapfree=647720 load1=5.97
2026-11-22T23:49:37Z boot=3c704685 mem=1740264 bal=5043456 swapfree=646672 load1=4.46
2026-11-22T23:50:37Z boot=3c704685 mem=1568716 bal=5244676 swapfree=662840 load1=2.16
2026-11-22T23:51:37Z boot=3c704685 mem=1323164 bal=5425468 swapfree=663044 load1=0.98
2026-11-22T23:52:37Z boot=3c704685 mem=1164968 bal=5588652 swapfree=660604 load1=1.71
2026-11-22T23:53:37Z boot=3c704685 mem=1013660 bal=5735536 swapfree=662040 load1=1.81
2026-11-22T23:54:37Z boot=3c704685 mem=928604 bal=5868148 swapfree=656196 load1=0.93
2026-11-22T23:55:37Z boot=3c704685 mem=814064 bal=5992328 swapfree=633700 load1=1.21
2026-11-22T23:56:37Z boot=3c704685 mem=774728 bal=6103608 swapfree=602116 load1=1.73
2026-11-22T23:57:37Z boot=3c704685 mem=1101052 bal=5791484 swapfree=596208 load1=1.84
2026-11-22T23:58:37Z boot=3c704685 mem=892396 bal=5923980 swapfree=599376 load1=0.78
2026-11-22T23:59:37Z boot=3c704685 mem=799888 bal=6042588 swapfree=604376 load1=0.57
2026-11-23T00:00:37Z boot=3c704685 mem=752052 bal=6156708 swapfree=748120 load1=0.39
2026-11-23T00:01:37Z boot=3c704685 mem=614796 bal=6261196 swapfree=740980 load1=0.59
2026-11-23T00:02:37Z boot=3c704685 mem=527448 bal=6355772 swapfree=724852 load1=0.38
2026-11-23T00:03:37Z boot=3c704685 mem=402460 bal=6439968 swapfree=719556 load1=0.45
2026-11-23T00:04:37Z boot=3c704685 mem=404552 bal=6443824 swapfree=697328 load1=0.21
2026-11-23T00:05:37Z boot=3c704685 mem=997272 bal=5854000 swapfree=668188 load1=0.75
2026-11-23T00:06:37Z boot=3c704685 mem=953808 bal=5940680 swapfree=665236 load1=1.37
2026-11-23T00:07:37Z boot=3c704685 mem=1063332 bal=5762060 swapfree=664160 load1=1.42
2026-11-23T00:08:37Z boot=3c704685 mem=1410520 bal=4582412 swapfree=626588 load1=2.88
2026-11-23T00:09:37Z boot=3c704685 mem=1391496 bal=4762284 swapfree=629528 load1=1.58
2026-11-23T00:10:37Z boot=3c704685 mem=1347424 bal=4691036 swapfree=629516 load1=1.55
2026-11-23T00:11:37Z boot=3c704685 mem=1542920 bal=4846856 swapfree=631096 load1=1.09
2026-11-23T00:12:37Z boot=3c704685 mem=1435180 bal=5032124 swapfree=632404 load1=0.55
2026-11-23T00:13:37Z boot=3c704685 mem=1609460 bal=5156240 swapfree=630956 load1=0.40
2026-11-23T00:14:37Z boot=3c704685 mem=2087224 bal=4780184 swapfree=631460 load1=0.51
2026-11-23T00:15:37Z boot=3c704685 mem=1839644 bal=5009048 swapfree=634228 load1=0.23
2026-11-23T00:16:37Z boot=3c704685 mem=1598964 bal=5213752 swapfree=638904 load1=0.21
2026-11-23T00:17:37Z boot=3c704685 mem=1392008 bal=5401868 swapfree=656820 load1=0.16
2026-11-23T00:18:37Z boot=3c704685 mem=1238620 bal=5567800 swapfree=658052 load1=0.32
2026-11-23T00:19:37Z boot=3c704685 mem=1106728 bal=5721708 swapfree=658420 load1=0.12
2026-11-23T00:20:37Z boot=3c704685 mem=1012508 bal=5861472 swapfree=667364 load1=0.18
2026-11-23T00:21:37Z boot=3c704685 mem=841236 bal=5992080 swapfree=668084 load1=0.24
2026-11-23T00:22:37Z boot=3c704685 mem=762776 bal=6109912 swapfree=668700 load1=0.14
2026-11-23T00:23:37Z boot=3c704685 mem=612948 bal=6216356 swapfree=668840 load1=0.26
2026-11-23T00:24:37Z boot=3c704685 mem=534684 bal=6311568 swapfree=670004 load1=0.22
2026-11-23T00:25:37Z boot=3c704685 mem=496052 bal=6402824 swapfree=670820 load1=0.13
2026-11-23T00:26:37Z boot=3c704685 mem=417532 bal=6443824 swapfree=665788 load1=0.09
2026-11-23T00:27:37Z boot=3c704685 mem=825788 bal=5329712 swapfree=584056 load1=0.95
2026-11-23T00:28:38Z boot=3c704685 mem=699608 bal=5421464 swapfree=587824 load1=0.57
2026-11-23T00:29:38Z boot=3c704685 mem=1661316 bal=5302032 swapfree=586156 load1=1.31
2026-11-23T00:30:38Z boot=3c704685 mem=1386216 bal=5487936 swapfree=594788 load1=0.58
2026-11-23T00:31:38Z boot=3c704685 mem=874540 bal=5335456 swapfree=577212 load1=1.86
2026-11-23T00:32:38Z boot=3c704685 mem=1455068 bal=5437152 swapfree=588272 load1=1.52
2026-11-23T00:33:38Z boot=3c704685 mem=678328 bal=5541368 swapfree=587780 load1=1.71
2026-11-23T00:34:38Z boot=3c704685 mem=674780 bal=5645396 swapfree=589456 load1=1.62
2026-11-23T00:35:38Z boot=3c704685 mem=617924 bal=5666504 swapfree=584820 load1=1.17
2026-11-23T00:36:38Z boot=3c704685 mem=510348 bal=5728316 swapfree=586308 load1=2.54
2026-11-23T00:37:38Z boot=3c704685 mem=533288 bal=5814672 swapfree=587332 load1=1.67
2026-11-23T00:38:38Z boot=3c704685 mem=508760 bal=5902940 swapfree=586728 load1=0.65
2026-11-23T00:39:38Z boot=3c704685 mem=750152 bal=5805620 swapfree=579560 load1=1.13
2026-11-23T00:40:38Z boot=3c704685 mem=1386484 bal=5512604 swapfree=584716 load1=1.51
2026-11-23T00:41:38Z boot=3c704685 mem=504700 bal=5539200 swapfree=580816 load1=2.04
2026-11-23T00:42:38Z boot=3c704685 mem=796648 bal=5245932 swapfree=597752 load1=2.00
2026-11-23T00:43:38Z boot=3c704685 mem=981168 bal=5093600 swapfree=605488 load1=1.42
2026-11-23T00:44:38Z boot=3c704685 mem=786556 bal=5232232 swapfree=583668 load1=1.66
2026-11-23T00:45:38Z boot=3c704685 mem=815924 bal=5372192 swapfree=587104 load1=0.95
2026-11-23T00:46:38Z boot=3c704685 mem=679568 bal=5507784 swapfree=589604 load1=0.57
2026-11-23T00:47:38Z boot=3c704685 mem=1182872 bal=5673236 swapfree=590704 load1=0.29
2026-11-23T00:48:38Z boot=3c704685 mem=1031452 bal=5820660 swapfree=595268 load1=0.17
2026-11-23T00:49:38Z boot=3c704685 mem=911876 bal=5954432 swapfree=594728 load1=0.06
2026-11-23T00:50:38Z boot=3c704685 mem=787440 bal=6071196 swapfree=593640 load1=0.36
2026-11-23T00:51:38Z boot=3c704685 mem=701676 bal=6182720 swapfree=595696 load1=0.13
2026-11-23T00:52:38Z boot=3c704685 mem=607592 bal=6284324 swapfree=592200 load1=0.18
2026-11-23T00:53:38Z boot=3c704685 mem=529320 bal=6376688 swapfree=592276 load1=0.11
2026-11-23T00:54:38Z boot=3c704685 mem=460628 bal=6443824 swapfree=591720 load1=0.04
2026-11-23T00:55:38Z boot=3c704685 mem=457268 bal=6443824 swapfree=591036 load1=0.17
2026-11-23T00:56:38Z boot=3c704685 mem=451040 bal=6443824 swapfree=590720 load1=0.14
2026-11-23T00:57:38Z boot=3c704685 mem=419740 bal=6443824 swapfree=592752 load1=0.36
2026-11-23T00:58:38Z boot=3c704685 mem=443504 bal=6443824 swapfree=595456 load1=0.54
2026-11-23T00:59:39Z boot=3c704685 mem=439304 bal=6443824 swapfree=594992 load1=0.20
2026-11-23T01:00:39Z boot=3c704685 mem=542380 bal=6443824 swapfree=728180 load1=0.20
2026-11-23T01:01:39Z boot=3c704685 mem=514836 bal=6443824 swapfree=731712 load1=0.07
2026-11-23T01:03:13Z boot=70b7f7ee mem=1733908 bal=5170788 swapfree=1026312 load1=4.92
2026-11-23T01:04:13Z boot=70b7f7ee mem=1539812 bal=5370304 swapfree=1005900 load1=2.28
2026-11-23T01:05:13Z boot=70b7f7ee mem=1372788 bal=5550936 swapfree=984544 load1=0.98
2026-11-23T01:06:13Z boot=70b7f7ee mem=1184864 bal=5718008 swapfree=960044 load1=0.50
2026-11-23T01:07:13Z boot=70b7f7ee mem=1093356 bal=5869948 swapfree=936348 load1=0.18
2026-11-23T01:08:13Z boot=70b7f7ee mem=955744 bal=6008756 swapfree=933988 load1=0.11
2026-11-23T01:09:13Z boot=70b7f7ee mem=809344 bal=6134776 swapfree=934460 load1=0.16
2026-11-23T01:10:13Z boot=70b7f7ee mem=715436 bal=6248516 swapfree=925652 load1=0.35
2026-11-23T01:11:13Z boot=70b7f7ee mem=634312 bal=6351392 swapfree=896128 load1=0.17
2026-11-23T01:12:13Z boot=70b7f7ee mem=554564 bal=6443824 swapfree=846408 load1=0.14
2026-11-23T01:13:13Z boot=70b7f7ee mem=555112 bal=6443824 swapfree=845776 load1=0.32
2026-11-23T01:14:13Z boot=70b7f7ee mem=531132 bal=6443824 swapfree=798956 load1=0.48
2026-11-23T01:15:13Z boot=70b7f7ee mem=571412 bal=6443824 swapfree=767268 load1=0.79
2026-11-23T01:16:13Z boot=70b7f7ee mem=578428 bal=6443824 swapfree=768320 load1=0.40
2026-11-23T01:17:13Z boot=70b7f7ee mem=575268 bal=6443824 swapfree=768396 load1=0.35
2026-11-23T01:18:13Z boot=70b7f7ee mem=623920 bal=6443824 swapfree=741052 load1=0.46
2026-11-23T01:19:13Z boot=70b7f7ee mem=605848 bal=6411208 swapfree=682820 load1=0.96
2026-11-23T01:20:13Z boot=70b7f7ee mem=610456 bal=6443824 swapfree=672532 load1=1.51
2026-11-23T01:21:13Z boot=70b7f7ee mem=587156 bal=6443824 swapfree=673728 load1=0.99
2026-11-23T01:22:13Z boot=70b7f7ee mem=631616 bal=6443824 swapfree=673100 load1=0.71
2026-11-23T01:23:13Z boot=70b7f7ee mem=620188 bal=6443824 swapfree=679540 load1=0.41
2026-11-23T01:24:14Z boot=70b7f7ee mem=589728 bal=6443824 swapfree=684844 load1=0.15
2026-11-23T01:25:14Z boot=70b7f7ee mem=587252 bal=6443824 swapfree=688716 load1=0.24
2026-11-23T01:26:14Z boot=70b7f7ee mem=576372 bal=6443824 swapfree=689032 load1=0.26
2026-11-23T01:27:14Z boot=70b7f7ee mem=581568 bal=6443824 swapfree=689368 load1=0.15
2026-11-23T01:28:14Z boot=70b7f7ee mem=595368 bal=6443824 swapfree=689944 load1=0.12
2026-11-23T01:29:14Z boot=70b7f7ee mem=588564 bal=6443824 swapfree=690124 load1=0.56
2026-11-23T01:30:14Z boot=70b7f7ee mem=597496 bal=6443824 swapfree=690312 load1=0.32
2026-11-23T01:31:14Z boot=70b7f7ee mem=579672 bal=6443824 swapfree=691636 load1=0.25
2026-11-23T01:32:14Z boot=70b7f7ee mem=571436 bal=6443824 swapfree=693616 load1=0.09
2026-11-23T01:33:14Z boot=70b7f7ee mem=572712 bal=6443824 swapfree=697676 load1=0.32
2026-11-23T01:34:14Z boot=70b7f7ee mem=584564 bal=6443824 swapfree=697712 load1=0.11
2026-11-23T01:35:14Z boot=70b7f7ee mem=576176 bal=6443824 swapfree=697796 load1=0.04
2026-11-23T01:36:14Z boot=70b7f7ee mem=574092 bal=6443824 swapfree=698008 load1=0.29
2026-11-23T01:37:14Z boot=70b7f7ee mem=559016 bal=6443824 swapfree=698340 load1=0.15
2026-11-23T01:38:14Z boot=70b7f7ee mem=574916 bal=6443824 swapfree=698540 load1=0.20
2026-11-23T01:39:14Z boot=70b7f7ee mem=562260 bal=6443824 swapfree=698576 load1=0.11
2026-11-23T01:40:14Z boot=70b7f7ee mem=566208 bal=6443824 swapfree=699172 load1=0.12
2026-11-23T01:41:14Z boot=70b7f7ee mem=565560 bal=6443824 swapfree=700528 load1=0.20
2026-11-23T01:42:14Z boot=70b7f7ee mem=572836 bal=6443824 swapfree=708700 load1=0.07
2026-11-23T01:43:14Z boot=70b7f7ee mem=565900 bal=6443824 swapfree=708724 load1=0.09
2026-11-23T01:44:14Z boot=70b7f7ee mem=567544 bal=6443824 swapfree=708728 load1=0.10
2026-11-23T01:45:14Z boot=70b7f7ee mem=576488 bal=6443824 swapfree=708744 load1=0.03
2026-11-23T01:46:14Z boot=70b7f7ee mem=566364 bal=6443824 swapfree=709476 load1=0.10
2026-11-23T01:47:14Z boot=70b7f7ee mem=571796 bal=6443824 swapfree=709692 load1=0.11
2026-11-23T01:48:14Z boot=70b7f7ee mem=571092 bal=6443824 swapfree=710688 load1=0.12
2026-11-23T01:49:14Z boot=70b7f7ee mem=581720 bal=6443824 swapfree=710604 load1=0.07
2026-11-23T01:50:14Z boot=70b7f7ee mem=565964 bal=6443824 swapfree=711556 load1=0.48
2026-11-23T01:51:14Z boot=70b7f7ee mem=562600 bal=6443824 swapfree=711724 load1=0.45
2026-11-23T01:52:14Z boot=70b7f7ee mem=569592 bal=6443824 swapfree=711828 load1=0.27
2026-11-23T01:53:14Z boot=70b7f7ee mem=559732 bal=6443824 swapfree=711968 load1=0.10
2026-11-23T01:54:14Z boot=70b7f7ee mem=568692 bal=6443824 swapfree=712184 load1=0.10
2026-11-23T01:55:14Z boot=70b7f7ee mem=555672 bal=6443824 swapfree=712616 load1=0.18
```
