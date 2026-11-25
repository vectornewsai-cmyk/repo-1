# LIMITS — Phase 9 đợt 172, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ hai mươi sáu liên tiếp; CỬA SỔ THOÁNG SAU REBOOT QUAN SÁT ĐƯỢC LẦN ĐẦU TỪ ĐỢT 167 — 30.001 lúc boot+68s trên #82; headroom đóng 2; E-175 KẾT THÚC + E-176 MỚI 25 mẫu KẾT THÚC theo #82 + E-177 MỚI 27 mẫu ĐANG GHIM; ENOSPC ≥83 trên #81 + 3 trên #82; REBOOT #82 GIỮA PHIÊN)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 2 lúc đóng (16 lần đo hợp lệ: 8 lần 0, 6 lần 2, 2 lần 30.001), dưới ngưỡng < ~1.800 lần thứ ba mươi hai liên tiếp** — trần **63.747 trên cả hai boot**. Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT QUAN SÁT ĐƯỢC — LẦN ĐẦU TIÊN TỪ ĐỢT 167 (chuỗi "không quan sát được" 4 đợt 168 + 169 + 170 + 171 DỨT).** Reboot #82 (btime 19:00:48Z) xảy ra **GIỮA PHIÊN** lúc T9 đang đo; T9 bắt được cửa sổ trực tiếp: **30.001, 30.001 (chạm CAP 30.000) lúc 19:01:56Z = boot+68s**, về **0 lúc boot+136s** (19:03:04Z) và **0 lúc boot+196s** (19:04:04Z) — cửa sổ mở chưa tới 68 s. (Cửa sổ của #81 thì KHÔNG quan sát được: #81 xảy ra TRƯỚC KHI ĐỢT MỞ 33m46s; probe mở boot+2.209s đã 0, 0; ENOSPC đầu tiên trên #81 lúc 17:04:00Z = boot+115s, trước khi đợt mở.) Xem §1.2, F-172-T9-1.
- **Balloon — E-175 KẾT THÚC trong khoảng mù giữa hai đợt (GIỮ 7 mẫu) + E-176 MỚI 25 mẫu KẾT THÚC theo reboot #82 + E-177 MỚI 27 mẫu ĐANG GHIM:** E-175 ghim cuối 16:44:30Z trên #80 (đợt 171); khoảng mù **3.255 s (16:44:30Z → 17:38:45Z)** có **MỘT reboot (#81 btime 17:02:05Z)**; mẫu đầu trên #81 (17:38:45Z) balloon 5.985.072 kB (92,9% trần), không ghim. **E-176 MỚI trên #81: 18:36:47–19:00:47Z, 25 mẫu ghim, 1 chuỗi, 0 sag — KẾT THÚC theo reboot #82** (ghim tới mẫu cuối trước btime 1 s). **E-177 MỚI trên #82: 19:13:19–19:39:19Z, 27 mẫu ghim, 1 chuỗi, 0 sag — ĐANG GHIM lúc đóng**, kết cục thuộc đợt sau. **E-174 GIỮ 47 mẫu, E-173 GIỮ 57 mẫu, E-172 GIỮ 3 mẫu, E-171 GIỮ 12 mẫu, E-170 GIỮ 48 mẫu, E-169 GIỮ 20 mẫu. Tổng ghim đợt này 52/121 mẫu (43,0%).** Xem §2.2.
- **RAM: sampler 121 mẫu, 17:38:45Z–19:39:19Z, HAI boot (#81: 83 mẫu; #82: 38 mẫu).** Max **3.027.892 kB (2.956,9 MiB = 48,13% guard) lúc 18:03:46Z** — ngay sau khi poller attempt1 thoát (18:03:19Z); chỉ còn cách guard **3.263.564 kB**. Min **431.236 kB lúc 18:38:47Z** (trong lúc ghim E-176). Mean toàn phiên **954.877,9 kB — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU**. Gate A **40/121 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ hai mươi sáu liên tiếp.** Caveat: cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu (điểm yếu (a) đợt 147) — T9 chỉ claim 0 MẪU đạt guard, không claim "không có lúc nào vượt guard". Xem §2, §3.
- **B2: 10 spike THẬT, 10/10 QUY ĐƯỢC DRIVER CỤ THỂ, 0 load1 dư (cả 10 đều trên #81; 0 spike trên #82).** Cụm 17:44:19–17:47:50Z (7 spike, load1 tới 5,06): T1 verify suite (ffmpeg testsrc2/geq/lut/xfade + mask_anim) + T2 blind/hole-recheck — **0 spike TRONG cửa sổ attempt1** (17:59:31–18:02:50Z), **0 spike trong cửa sổ O8** (18:11:20–18:13:52Z), **0 spike trong cửa sổ harness** (18:14:06–18:29:39Z). Spike 17:39:15Z do grep của main agent + find của T5; spike 17:54:55Z do t5-stats-172.py; spike 18:09:01Z do Chromium renderer O8 của T0. Delta tick lớn nhất 127 tick/s (ffmpeg testsrc2 1280x720 geq, 17:46:38Z). Xem §2.5.
- **Lượt yên WebKit #41 (T4): CÓ LƯỢT HỢP LỆ NGAY ATTEMPT1 — CHUỖI LÊN 36.** Attempt1-4b9db449 (17:59:31–18:02:50Z): probe 20/20, lớp B 5/5, tickCost median 46,0 ms ≤ 60 — HỢP LỆ. Sampler T9 đối chiếu: gate A MỞ 4/4 mẫu trong cửa sổ; load1 0,83–2,35 (T4: max 2,47 trên n=100 — KHỚP trong sai số cadence); **0 spike B2 trong cửa sổ attempt1**; balloon 4.546.616–5.032.284 kB, 0 mẫu ghim. Xem §2.3.
- **T8-172 (đối chiếu): O8 PASS 3/3 trên boot #81 (18:11:20–18:13:52Z) — T8 ĐỀ XUẤT chuỗi WebKit FULL PASS LÊN 24 (CÓ CAVEAT gate (a) mode repair-sớm); harness WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (18:14:06–18:29:39Z) — đợt sạch đầu tiên kể từ đợt 169; (1c') giữ nguyên, 0 kích hoạt, 0 FP, 0 bỏ lỡ đợt này. T9 đối chiếu bằng sampler độc lập: 0 spike B2 trong cả hai cửa sổ; gate A 0/3 (O8) và 2/15 (harness). Xem §2.4.
- **REBOOT #82 GIỮA PHIÊN (34e61c92, btime 19:00:48Z; gap #81→#82 = 7.123 s):** sampler + watcher B2 + probe-loop của T9 **CHẾT theo reboot** (log dừng 19:00:47Z); T9 **KHỞI ĐỘNG LẠI cả ba trong ~92 s** (sampler chạy lại 19:02:19Z = boot+91s — đúng lúc bắt được cửa sổ thoáng 30.001 lúc boot+68s bằng probe tay). **1 gap >90 s duy nhất trong log đóng băng: 92 s qua reboot #82** (max gap trong boot 61 s). Run 172 bị viết lại 1 lần (theo T7-172 NOTES); kết cục run 172 + (m) #82 + INSIDE #82 thuộc T7/T2-173 + parent. Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: #81 ≥83 dòng (đếm được lúc lan-3 18:38:45Z — journal MẤT theo reboot #82 nên KHÔNG đếm lại được tổng cuối, cùng mẫu F-171-T10-4) + #82 = 3 dòng (19:02:35Z, 19:03:37Z, 19:04:39Z — toàn bộ trong đợt, 0 dòng mới sau 19:04:39Z). Đợt thứ hai mươi mốt liên tiếp bảng watch cạn gây lỗi thật thấy được.** Nhịp #81: **+26 dòng đúng mỗi ~30 phút** (31 → 57 → 83; T5 snapshot 46 @17:53:56Z + 48 @17:57:01Z khớp nhịp). Xem §4.
- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc T9 đóng (8/9)** — T7 CHƯA đóng cờ lúc T9 đóng (chỉ có NOTES.md, đọc #6 ~19:39Z: run 172 vẫn running); kết cục run 172 thuộc T7-172. **(m) #81: DƯƠNG ỨNG VIÊN** (theo T2-172, requeue +33,477 s — sát biên dưới 0,477 s); **INSIDE: #81 NGOÀI dải FULL127 → CHUỖI VẪN ĐỨT, dài 0** (theo T2-172). Xem §5.3/§5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không mẫu nào đạt guard — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round172-t9/k8-headroom.py` (copy y nguyên từ đợt 171 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 172 (16 lần đo hợp lệ, 2 boot, 0 lần đo lỗi)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 17:38:54Z 22/11 | **0** | #81 4b9db449 | 63.747 | lần đo 1–2, cặp mở (boot+2.209s); ENOSPC-count=31 (dòng đầu tiên 17:04:00Z = boot+115s, TRƯỚC khi đợt mở); balloon 5.591.856 kB (86,8% trần) |
| 17:38:54Z 22/11 | **0** | #81 4b9db449 | 63.747 | lần đo 2 (chênh **0**) |
| 18:08:45Z 22/11 | **0** | #81 4b9db449 | 63.747 | lần đo 3–4, probe-loop lan-2; ENOSPC-count=57 (dòng mới nhất 18:08:30Z); balloon 4.952.580 kB |
| 18:08:45Z 22/11 | **0** | #81 4b9db449 | 63.747 | lần đo 4 (chênh **0**) |
| 18:38:45Z 22/11 | **0** | #81 4b9db449 | 63.747 | lần đo 5–6, probe-loop lan-3; ENOSPC-count=83 (dòng mới nhất 18:37:50Z); balloon ĐANG GHIM TRẦN (E-176), RAM 439.864 kB |
| 18:38:45Z 22/11 | **0** | #81 4b9db449 | 63.747 | lần đo 6 (chênh **0**) |
| 19:01:56Z 22/11 | **30.001** | #82 34e61c92 | 63.747 | lần đo 7–8, **CỬA SỔ THOÁNG SAU REBOOT #82 — chạm CAP** (boot+68s); ENOSPC-count=0 trên #82; balloon 4.890.660 kB |
| 19:01:56Z 22/11 | **30.001** | #82 34e61c92 | 63.747 | lần đo 8 (chênh **0**) |
| 19:03:04Z 22/11 | **0** | #82 34e61c92 | 63.747 | lần đo 9, theo dõi cửa sổ (boot+136s) — cửa sổ ĐÃ ĐÓNG |
| 19:04:04Z 22/11 | **0** | #82 34e61c92 | 63.747 | lần đo 10, theo dõi cửa sổ (boot+196s); ENOSPC-count=2 trên #82 |
| 19:08:45Z 22/11 | **2** | #82 34e61c92 | 63.747 | lần đo 11–12, probe-loop-82 lan-4; ENOSPC-count=3 (dòng mới nhất 19:04:39Z); balloon 6.017.872 kB |
| 19:08:45Z 22/11 | **2** | #82 34e61c92 | 63.747 | lần đo 12 (chênh **0**) |
| 19:38:45Z 22/11 | **2** | #82 34e61c92 | 63.747 | lần đo 13–14, probe-loop-82 lan-5; ENOSPC-count=3 (không tăng); balloon ĐANG GHIM TRẦN (E-177), RAM 588.356 kB |
| 19:38:45Z 22/11 | **2** | #82 34e61c92 | 63.747 | lần đo 14 (chênh **0**) |
| 19:39:58Z 22/11 | **2** | #82 34e61c92 | 63.747 | lần đo 15–16, cặp đóng; balloon ĐANG GHIM TRẦN (E-177), RAM 524.608 kB; ENOSPC-count=3 |
| 19:39:58Z 22/11 | **2** | #82 34e61c92 | 63.747 | lần đo 16 (chênh **0**) |

- Probe dừng ở `i=0` trong 8/16 lần đo; chạm CAP 30.000 trong 2/16 lần đo (cửa sổ #82); dừng ở `i=2` trong 6/16 lần đo. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi lần đo).
- **CỬA SỔ THOÁNG SAU REBOOT: QUAN SÁT ĐƯỢC — LẦN ĐẦU TIÊN TỪ ĐỢT 167 (xem F-172-T9-1).** Reboot #82 btime 19:00:48Z (T9 phát hiện ~19:01:32Z, 44 s sau btime — sampler/watcher/probe-loop đều đã chết theo reboot). T9 đo tay ngay: **19:01:56Z = boot+68s: 30.001, 30.001 (chạm CAP)**; **19:03:04Z = boot+136s: 0**; **19:04:04Z = boot+196s: 0**. Cửa sổ mở tại boot+68s và đã đóng trước boot+136s — **rộng chưa tới 68 s**, cùng mẫu các đợt 163–166 (30.001 lúc boot+63–81s → 0 lúc boot+110–160s) và đợt 167 (14.072/8.708 lúc boot+86s, đang đóng). ENOSPC đầu tiên trên #82 lúc 19:02:35Z = boot+107s — SAU lần đo 30.001 (boot+68s) và TRƯỚC lần đo 0 (boot+136s): ENOSPC bắt đầu đúng trong lúc cửa sổ đóng. **Chuỗi "không quan sát được" 4 đợt (168 + 169 + 170 + 171) DỨT tại đợt này.**
- **Cửa sổ của #81: KHÔNG QUAN SÁT ĐƯỢC (cùng mẫu cấu trúc đợt 170/171).** Reboot #81 btime 17:02:05Z; đợt mở 17:35:51Z = boot+2.026s; T9 nhận việc ~17:38Z; sampler khởi động 17:38:45Z (boot+2.200s); probe mở 17:38:54Z (boot+2.209s) đã là 0, 0. ENOSPC đầu tiên trên #81 lúc 17:04:00Z = boot+115s — TRƯỚC khi đợt mở 31m51s. Nếu cửa sổ thoáng của #81 tồn tại thì nó nằm trong ~boot+60–200s (17:03–17:05Z) — trước khi đợt mở hơn nửa giờ; không một luồng nào của đợt 172 có mặt lúc đó. T9 ghi đúng mốc đo, không claim cửa sổ #81 có mở hay không.
- **Headroom cuối phiên: 2 (cặp đóng 19:39:58Z, chênh 0).** Trên #82 sau khi cửa sổ đóng: 0 lúc boot+136s/196s → **2 lúc lan-4 (boot+477s) và giữ 2 tới đóng (boot+2.350s)** — cùng mức ổn định 2 như các boot #76/#77/#78/#79/#80 (đợt 168–171 đều đóng 2, trừ đợt 171 toàn-0). ENOSPC trên #82 dừng ở 3 dòng sau 19:04:39Z (không tăng thêm trong 35 phút còn lại) trong khi headroom giữ 2 — systemd thêm được watch trở lại khi có slot trống (xem §4). Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 2 = **63.745 watch** trên #82.
- **So sánh với đợt 171:** đợt 171 mở 0 trên #80 → 0 suốt phiên → đóng 0 (12 lần đo, 12 lần 0, không reboot giữa phiên). Đợt này mở 0 trên #81 → 0 suốt #81 (6 lần đo) → reboot #82 giữa phiên → thoáng 30.001 lúc boot+68s → 0 → 2 → đóng 2 (16 lần đo: 8 lần 0, 2 lần 30.001, 6 lần 2).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **2 / 1.578 ≈ 0,001** — một vite mới (~1.578 watch) không khởi động được (như mọi đợt từ 152).
- T5-172 KHÔNG probe lại headroom đợt này (như đợt 151–171) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 16 lần đo hợp lệ + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #81 đợt này có ≥83 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #81 và #82 suốt 16 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.
- Lưu ý: RAM lúc đóng (524.608 kB — mẫu ghim E-177) THẤP hơn RAM lúc mở (841.420 kB — mẫu đầu #81) trong khi headroom 0 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop gốc chạy đủ lan-2 (18:08:45Z) + lan-3 (18:38:45Z) rồi **CHẾT theo reboot #82** (lan-4 gốc ~19:08:45Z không chạy được — loop đã chết 19:00:48Z); T9 viết lại `probe-loop-82.sh` chạy lan-4 (19:08:45Z) + lan-5 (19:38:45Z) đúng lịch gốc rồi kết thúc bình thường ("probe-loop-82 done 19:38:45Z"); cặp probe đóng 19:39:58Z do T9 đo tay ngay sau đó.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–171 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **172** | **0 → 30.001 (thoáng, boot+68s) → 2** | **mở 17:38:54Z boot #81 4b9db449 btime 17:02:05Z (trần 63.747): 0 ×6 (17:38:54–18:38:45Z) → sau reboot #82 19:00:48Z boot MỚI 34e61c92 (trần 63.747): 30.001, 30.001 lúc boot+68s → 0 lúc boot+136s/196s → 2 ×6 (19:08:45–19:39:58Z) → đóng 19:39:58Z cùng boot #82: 2, 2 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 16 lần đo hợp lệ, 8 lần 0, 2 lần 30.001, 6 lần 2)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 6 → 0 → 2 → 2 → 0 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 2** (đợt 171 đóng 0; đợt 170 đóng 2; đợt 169 đóng 2; đợt 168 đóng 2; đợt 167 đóng 0). Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ ba mươi hai liên tiếp** (tính theo giá trị ổn định lúc đóng; đợt này giá trị dao động 0 → 30.001 (thoáng) → 0 → 2). Quyết parent đợt 171 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal boot #81 đợt này có ≥83 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ hai mươi mốt liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng; đợt 165: ≥64 dòng; đợt 166: ≥56 dòng; đợt 167: ≥76 dòng; đợt 168: ≥102 dòng — T9 đếm trực tiếp; đợt 169: ≥54 dòng — T9 đếm trực tiếp; đợt 170: 39 dòng — T9 đếm trực tiếp; đợt 171: **111 dòng — T9 đếm trực tiếp**; đợt 172: **≥83 dòng trên #81 (không đếm lại được tổng cuối — journal mất theo #82) + 3 dòng trên #82 — T9 đếm trực tiếp, xem §4**). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #81 và #82 suốt 16 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên #81; swap 1.048.572 kB) — sampler 121 mẫu, 17:38:45Z–19:39:19Z, HAI boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở mẫu đầu trên #81 (mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: mở phiên balloon 92,9% trần + cụm spike T1/T2 (load1 tới 5,06) → attempt1 HỢP LỆ ngay → O8 PASS 3/3 → harness 6/6 sạch → balloon leo tới trần → E-176 ghim 25 mẫu tới reboot #82 → cửa sổ thoáng 30.001 → balloon leo lại → E-177 ghim 27 mẫu tới lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log đóng băng 92 s qua reboot #82; max gap trong boot 61 s** — xem §5.1). **121 mẫu, 17:38:45Z–19:39:19Z, HAI boot (#81: 83 mẫu; #82: 38 mẫu).** Tổng quan: **min 431.236 kB (421,1 MiB) lúc 18:38:47Z** (trong lúc ghim E-176); **max 3.027.892 kB (2.954,0 MiB) lúc 18:03:46Z — 48,12% guard** (ngay sau khi poller attempt1 thoát 18:03:19Z; balloon 3.803.968 kB); **mean toàn phiên 954.877,9 kB (932,5 MiB) — tính bằng 3 cách (python + awk 954.877,9 + trung bình có trọng số) KHỚP NHAU (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 17:38:45–17:58:45Z | #81 | 841.420–2.547.228 kB | Mở phiên: balloon 5.985.072 kB (92,9% trần) lúc 17:38:45Z; **9 spike B2** (17:39:15–17:54:55Z — T1 suite + T2 blind/hole + T5 stats; load1 tới 5,06 theo watcher); gate A MỞ 18/20 mẫu; T4 chờ gate0 (poll #1–#25) |
| 17:59:46–18:03:46Z | #81 | 1.164.436–3.027.892 kB | **T4 attempt1 HỢP LỆ (17:59:31–18:02:50Z — xem §2.3)**; **RAM max phiên 3.027.892 kB lúc 18:03:46Z** (48,13% guard); gate A MỞ 5/5 mẫu; **0 spike B2 trong cửa sổ attempt1**; load1 0,83–2,35 |
| 18:04:46–18:13:46Z | #81 | 848.680–2.795.856 kB | **O8 PASS 3/3 (18:11:20–18:13:52Z — xem §2.4)**; **1 spike B2** (18:09:01Z, Chromium renderer O8 của T0 — TRƯỚC cửa sổ O8 của T8); **0 spike B2 trong cửa sổ O8**; gate A MỞ 7/10 mẫu; load1 0,21–2,93 |
| 18:14:46–18:29:46Z | #81 | 487.984–1.351.824 kB | **Harness WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT (xem §2.4)**; **0 spike B2 trong cửa sổ harness**; gate A MỞ 2/15 mẫu; RAM <512.000 kB: 1 mẫu (18:21:46Z 487.984 kB, trong lúc WebKit 86n2 — KHÔNG kẹt); load1 0,42–2,72 |
| 18:30:47–19:00:47Z | #81 | 431.236–1.001.988 kB | Balloon leo lên trần lúc 18:36:47Z; **E-176: 1 chuỗi ghim 18:36:47–19:00:47Z (25 mẫu), KẾT THÚC theo reboot #82** (xem §2.2); **0 spike B2**; gate A MỞ 0/31 mẫu; load1 0,00–0,45 |
| 19:02:19–19:12:19Z | #82 | 601.080–1.921.712 kB | **Boot #82 mới (btime 19:00:48Z); cửa sổ thoáng 30.001 lúc boot+68s (19:01:56Z)**; sampler khởi động lại 19:02:19Z (boot+91s); balloon 4.890.660 → 6.429.668 kB; **0 spike B2**; gate A MỞ 6/11 mẫu; load1 0,18–2,71 |
| 19:13:19–19:39:19Z | #82 | 566.624–600.400 kB | Balloon leo lên trần lúc 19:13:19Z; **E-177: 1 chuỗi ghim 19:13:19–19:39:19Z (27 mẫu), ĐANG GHIM lúc đóng** (xem §2.2); **0 spike B2**; gate A MỞ 0/27 mẫu trong span ghim; load1 0,00–0,38 |

- **Gate A ≥1024 MiB: 40/121 mẫu** (18+5+7+2+0+6+0 theo 7 giai đoạn = 38, cộng 2 mẫu nằm ngoài các giai đoạn — 17:58:46Z 1.882.416 kB, 18:29:47Z 1.141.792 kB — cả 2 đều MỞ — khớp tổng 40; số giai đoạn từ script kiểm tra, không tính tay); **0 mẫu ≥ guard**; load1 max (sampler) **4,28** (watcher bắt 5,06 lúc 17:47:14Z — khớp, khác cadence); **RAM <512.000 kB: 27 mẫu** (22,3% — toàn bộ trên #81: 25 mẫu ghim E-176 + 18:21:46Z 487.984 kB trong lúc harness + 18:35:47Z 463.284 kB ngay trước khi ghim); **RAM <300.000 kB: 0 mẫu** (đợt 171: 1 mẫu; đợt 170: 2 mẫu; đợt 166–169: 0 mẫu).
- Swap: SwapFree 715.384 kB (mẫu đầu #81) → 638.620 kB (mẫu cuối #81, 19:00:47Z) → **990.444 kB (mẫu đầu #82, 19:02:19Z — NHẢY +351.824 kB qua reboot #82)** → 771.544 kB (mẫu cuối, 19:39:19Z). Nhịp nhảy SwapFree qua reboot: #82 nhả ~351.824 kB (đợt 171: không nhảy qua reboot vì không có reboot giữa phiên; đợt 169: nhả ~338.940 kB qua reboot #78).
- Mẫu 18:03:46Z (đỉnh phiên): RAM 3.027.892 kB, balloon 3.803.968 kB — đỉnh là một mẫu đơn lẻ 27 s sau khi poller attempt1 thoát (18:03:19Z); mẫu trước đỉnh (18:02:46Z): 1.581.836 kB; mẫu sau đỉnh (18:04:46Z): 2.795.856 kB — RAM rơi 232.036 kB trong 60 s sau đó. T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 431.236 kB (đợt 171: 296.796 kB; đợt 170: 263.132 kB; đợt 169: 437.868 kB; đợt 168: 414.364 kB; đợt 167: 383.116 kB; đợt 166: 372.732 kB; đợt 165: 248.768 kB; đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — **trũng NÔNG hơn đợt 171 đúng 134.440 kB** (431.236 − 296.796). 27 mẫu <512.000 kB trong 121 mẫu (22,3%); riêng trong span E-176 (25 mẫu ghim): **25/25 mẫu <512.000 kB (100%)**; riêng trong span E-177 (27 mẫu ghim): **0/27 mẫu <512.000 kB (0%)** — E-177 ghim nhưng RAM giữ trên 512.000 kB (566.624–596.332 kB), khác E-176 (431.236–469.652 kB).

**Bảng tổng hợp số RAM (từ script `t9-172-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 121 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #81 4b9db449 | 83 | 431.236 | 3.027.892 | 1.041.823,0 | 34/83 | 25 | 4,28 | 27 |
| #82 34e61c92 | 38 | 566.624 | 1.921.712 | 764.971,3 | 6/38 | 27 | 2,71 | 0 |
| **Toàn phiên** | **121** | **431.236** | **3.027.892** | **954.877,9** | **40/121** | **52/121 (43,0%)** | **4,28** | **27** |

- **Mean toàn phiên 954.877,9 kB — tính bằng 3 cách độc lập: python `sum/n = 954.877,9` VÀ awk `sum/n = 954.877,9` VÀ trung bình có trọng số ((83×1.041.823,0 + 38×764.971,3)/121 = 954.877,9) — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163).
- 27 mẫu RAM <512.000 kB (từ script analyze trên log đóng băng — không tính tay): 1 mẫu trong span harness 18:21:46Z (487.984 kB, WebKit 86n2 — không kẹt) + 1 mẫu ngay trước khi ghim E-176 18:35:47Z (463.284 kB) + 25 mẫu ghim E-176 (18:36:47–19:00:47Z). Tổng 1 + 1 + 25 = 27 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-175 KẾT THÚC trong khoảng mù (GIỮ 7 mẫu) + E-176 MỚI 25 mẫu KẾT THÚC theo #82 + E-177 MỚI 27 mẫu ĐANG GHIM

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #81 (4b9db449): GHIM TRẦN 25/83 mẫu (30,1%), trong 1 chuỗi — 1 EPISODE MỚI (E-176).**
  - Leo lên trần trên boot #81: từ 17:38:45Z (5.985.072 kB, 92,9% trần) xả xuống 3.803.968 kB (59,0% trần) lúc 18:03:46Z (ngay sau attempt1 hợp lệ) rồi leo lại tới ghim lúc 18:36:47Z trong ~33 phút.
  - **E-176 — chuỗi duy nhất: 18:36:47–19:00:47Z, 25 mẫu** (RAM 431.236–469.652 kB; gate A ĐÓNG cả 25 mẫu). Mẫu ngay trước chuỗi (18:35:47Z): balloon 6.414.992 kB (99,6% trần), RAM 463.284 kB — leo đơn điệu 5.617.272 kB? Không — leo từ 5.896.528 kB (18:21:46Z) → 6.443.824 kB (18:36:47Z) trong 15 phút, không có sag nào trước khi ghim.
  - **E-176 KẾT THÚC theo reboot #82 — GIỮ 25 mẫu.** Ghim tới mẫu cuối cùng trước btime #82 đúng 1 s (19:00:47Z, btime 19:00:48Z); balloon trên #82 khởi động lại từ 4.890.660 kB (75,9% trần), không ghim. Thời điểm đứt thật nằm trong (19:00:47Z, 19:02:19Z] — T9 không claim cụ thể hơn (balloon reset theo reboot là quyết định của host, ngoài tầm cell).
  - **Tổng E-176 tới lúc kết thúc: 25 mẫu ghim / 1 chuỗi / 0 sag / 1 boot (#81).**
- **Boot #82 (34e61c92): GHIM TRẦN 27/38 mẫu (71,1%), trong 1 chuỗi — 1 EPISODE MỚI (E-177).**
  - Leo lên trần trên boot #82: từ 19:02:19Z (4.890.660 kB, 75,9% trần) leo đơn điệu tới ghim lúc 19:13:19Z trong 11 phút (mẫu ngay trước chuỗi 19:12:19Z: balloon 6.429.668 kB, 99,8% trần).
  - **E-177 — chuỗi duy nhất: 19:13:19–19:39:19Z, 27 mẫu** (RAM 566.624–600.400 kB — đều TRÊN 512.000 kB; gate A ĐÓNG cả 27 mẫu). **ĐANG GHIM lúc đóng — kết cục thuộc đợt sau (T9-173).** T9 không claim E-177 sẽ kéo dài bao lâu hay đứt lúc nào.
  - **Tổng E-177 tới lúc đóng: 27 mẫu ghim / 1 chuỗi / 0 sag / 1 boot (#82).**
- **E-175 — KẾT CỤC: GIỮ 7 mẫu, KHÔNG cộng thêm.** E-175 ghim cuối 16:44:30Z trên #80 (đợt 171); khoảng mù giữa hai đợt **3.255 s (16:44:30Z → 17:38:45Z)** có **MỘT reboot (#81 btime 17:02:05Z)**. Balloon trên #81 lúc T9 mở (17:38:45Z) đã 5.985.072 kB (92,9% trần) và **KHÔNG chạm trần lần nào cho tới 18:36:47Z** (E-176) — E-175 đã kết thúc trong khoảng mù. Thời điểm đứt thật nằm trong (16:44:30Z, 17:38:45Z] — T9 không claim cụ thể.
- **Tổng ghim trần đợt này: 52/121 mẫu (43,0%)** (đợt 171: 7/121 = 5,8%; đợt 170: 47/121 = 38,8%; đợt 169: 60/132 = 45,5%; đợt 168: 60/135 = 44,4%; đợt 167: 20/128 = 15,6%; đợt 166: 55/123 = 44,7%; đợt 165: 58/134 = 43,3%; đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **2 episode mới trong đợt 172 (E-176: 25 mẫu, 1 chuỗi, 0 sag, KẾT THÚC theo #82; E-177: 27 mẫu, 1 chuỗi, 0 sag, đang ghim)** + E-175 GIỮ 7 mẫu (kết thúc trong khoảng mù).
- **Phán theo quy tắc quyết (e)/(g) + mẫu T10-166 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-176 là 1 EPISODE MỚI (25 mẫu / 1 chuỗi / 0 sag)** — không có sag nên không có câu hỏi tách episode. E-176 khác E-175 ở chỗ ở boot khác (#81 vs #80), bắt đầu sau một nhịp xả sâu (tới 59,0% trần) và leo lại đơn điệu; không phải tiếp nối E-175 (E-175 đã kết thúc trong khoảng mù có reboot #81 xen giữa).
  - **E-177 là 1 EPISODE MỚI (27 mẫu / 1 chuỗi / 0 sag)** — ở boot khác (#82), bắt đầu sau reboot #82 + nhịp leo đơn điệu 11 phút từ 75,9% trần; không phải tiếp nối E-176 (E-176 đã kết thúc theo reboot #82).
  - **Đợt 172 = 2 EPISODE GHIM MỚI (E-176 + E-177)** + E-175 GIỮ 7 mẫu (kết cục trong khoảng mù).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-176 chỉ ~431–470.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối chuỗi ghim E-177 (19:39:19Z): tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 575.948 kB (log thật).

### 2.3 Lượt yên WebKit #41 (T4, đợt 172) — CÓ LƯỢT HỢP LỆ NGAY ATTEMPT1, CHUỖI LÊN 36 (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-172 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND172_T4_WEBKIT_QUIET41_LIMITS.md`) + cờ `round172-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **#41 CÓ LƯỢT HỢP LỆ NGAY ATTEMPT1 — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 36 (35 → 36).**
- **Attempt1-4b9db449 (17:59:31–18:02:50Z): probe 20/20, lớp B 5/5 ĐẠT, tickCost median 46,0 ms ≤ 60 — HỢP LỆ.** Poller thoát 18:03:19Z vì ĐẠT. Ngân sách dùng 1/3. Không cần retry. Không reboot trong cửa sổ attempt (reboot #82 xảy ra sau đó gần 1 giờ).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1-#81: gate A MỞ **4/4 mẫu** trong cửa sổ (17:59:46Z 1.410.792; 18:00:46Z 1.164.436; 18:01:46Z 1.500.112; 18:02:46Z 1.581.836 — cả 4 đều ≥1024 MiB; số từ log đóng băng, không tính tay); load1 **0,83–2,35**; **0 spike B2 trong cửa sổ attempt1**; balloon trong cửa sổ attempt1: 4.546.616–5.032.284 kB (70,6–78,1% trần), **0 mẫu ghim**.
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cửa sổ attempt1** (khớp T4: "RAM ≥1024: 26/26" poller, "RAM <500 MB: 0/26").
  - **Load1 max trong cửa sổ attempt1: T4 (n=100 mẫu) = 2,47; T9 (n=4 mẫu) = 2,35 — KHỚP NHAU trong sai số cadence** (chênh 0,12; cả hai đều ≤ ngưỡng B2 = 4 với biên an toàn ≥1,53). T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- **F-171-T9-6 (T2 chạy script nặng trong cửa sổ attempt3 đợt 171) — KHÔNG tái diễn đợt này:** attempt1 hợp lệ ngay nên chỉ có 1 cửa sổ attempt; T9 không thấy script phân tích nặng nào chồng lên cửa sổ attempt1 trong log B2 (0 spike trong cửa sổ; spike gần nhất 17:54:55Z — TRƯỚC cửa sổ 4m36s — và 18:09:01Z — SAU cửa sổ 6m11s). T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu. B4 attempt1: dpkg delta 0 theo T4 — baseline đã gồm repair #81 (dpkg 795; POSTBOOT_PASS #81 17:50:32Z mode repair-sớm — xem §5.2).
- Caveat gate (a) mode repair-sớm (xem §2.4/T8-172): gate cho boot đo FOUND qua POSTBOOT_PASS #81 viết 17:50:32Z, poll=1, mode repair-sớm-quyết-h (dpkg 795 dòng thay vì 1.545 của replay đầy đủ) — T9 chỉ ghi chú tham chiếu, không phán chuẩn gate (thuộc T8/T10/parent).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 / O8 / harness (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| Attempt1 17:59:31–18:02:50Z | #81 | 0,83–2,35 (4 mẫu) | 1.164.436–1.581.836 kB — **gate A MỞ 4/4** | T4 attempt1 — **0 spike B2 trong cửa sổ**; attempt1 HỢP LỆ (lớp B 5/5 + tickCost median 46,0) |
| O8 18:11:20–18:13:52Z | #81 | 1,28–2,93 (3 mẫu) | 848.680–947.728 kB — **gate A MỞ 0/3** | T8 O8 — **0 spike B2 trong cửa sổ**; O8 PASS 3/3 |
| Harness 18:14:06–18:29:39Z | #81 | 0,42–2,72 (15 mẫu) | 487.984–1.351.824 kB — **gate A MỞ 2/15** | T8 harness — **0 spike B2 trong cửa sổ**; harness WebKit 3/3 + Chromium 3/3, 6/6 PASS, 0 KẸT (xem dưới) |
| WebKit 86n2 18:18:01–18:22:01Z | #81 | 0,55–2,60 (4 mẫu) | 487.984–627.208 kB — **gate A MỞ 0/4** | T8 harness pha 86n2 PASS — RAM min trong cửa sổ harness 487.984 kB @18:21:46Z trong pha này — **KHÔNG kẹt: avail thấp một mình không gây kẹt** (xem F-172-T8-4) |

### 2.5 B2 — 10 spike THẬT, 10/10 QUY ĐƯỢC DRIVER CỤ THỂ, 0 load1 dư (cả 10 trên #81; 0 spike trên #82; 0 spike trong attempt1/O8/harness; 0 spike trong span ghim E-176/E-177)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-172-T9-8). **10 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 10, `grep '=== SPIKE'` không neo cũng = 10 — KHÔNG lặp F-166-T9-3): 1 spike mở phiên (17:39:15Z, grep main agent + find T5); 7 spike cụm 17:44:19–17:47:50Z (T1 suite + T2 blind/hole); 1 spike T5 stats (17:54:55Z); 1 spike T0 O8 Chromium (18:09:01Z); 0 spike sau 18:09:01Z tới đóng (kể cả trên #82 sau reboot); 0 spike trong span ghim E-176 (18:36:47–19:00:47Z) và E-177 (19:13:19–19:39:19Z).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — mở phiên (1 spike) | 17:39:15Z | 3,45 | 1 | **grep -rln "12.3" của main agent (34,6%) + find POSTBOOT_PASS của T5 (21,4%)** | Main agent tìm aggregate 171 §12.3 + T5 kiểm POSTBOOT_PASS — tải mở đợt, không phải suite |
| 2 — cụm T1/T2 (7 spike) | 17:44:19–17:47:50Z | 3,29 → 5,06 → 3,52 | 7 | 17:44:19Z: python3 mask_anim.py **92,5%** + node render.js (T1 mask render); 17:44:55Z: ffmpeg ffv1 **124%** + mask_anim 72,7% + blind9696-content.py 23,8% (T1 + T2); 17:45:30Z: ffmpeg testsrc2 lut **119%** (T1 demo_lut); 17:46:04Z: ffmpeg xfade **125%** (T1 demo_transitions); 17:46:38Z: ffmpeg testsrc2 geq 1280x720 **131%**, delta **127** (T1 pixelate); 17:47:14Z: ffmpeg testsrc2 geq 1920x1080 **129%** (150,0% tức thời), delta **110** (T1 pixelate); 17:47:50Z: node test_v19_pixelate_probe + hole-recheck9696.py + ffmpeg 71,4% (T1 + T2) | **Cụm tải mở đợt 172: T1 verify suite (ffmpeg testsrc2/geq/lut/xfade + mask_anim/render) + T2 blind-investigate/hole-recheck** — nhiều luồng mở cùng lúc trên boot #81. Load1 max đợt (watcher) **5,06 lúc 17:47:14Z** (sampler bắt 4,28 — khớp, khác cadence). **0 spike TRONG cửa sổ attempt1** (spike gần nhất trước cửa sổ 17:54:55Z, sau cửa sổ 18:09:01Z) |
| 3 — T5 stats (1 spike) | 17:54:55Z | 3,03 | 1 | python3 t5-stats-172.py **49,4%** | Stats định kỳ của T5 — sát ngưỡng (3,03, chỉ +0,03 trên ngưỡng 3,0) |
| 4 — T0 O8 (1 spike) | 18:09:01Z | 3,66 | 1 | Chromium renderer **35,1%** + chrome 20,5% + vite (T0 O8 Chromium, userdata round172-t0/o8-chromium) | **T0 O8 Chromium setup** — TRƯỚC cửa sổ O8 của T8 (18:11:20Z) 2m19s; **0 spike trong cửa sổ O8 của T8** |

- **Tổng kết đếm: 10/10 spike có driver process cụ thể + 0 spike lớp "load1 dư"** (đợt 171: 11/12 quy được + 1 load1 dư; đợt 170: 18/19 quy được + 1 load1 dư; đợt 169: 9/9 quy được + 0 load1 dư; đợt 168: 12/15 quy được + 3 load1 dư; đợt 167: 16/22 quy được + 6 load1 dư; đợt 166: 13/16 quy được + 3 load1 dư; đợt 165: 15/18 quy được + 3 load1 dư; đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư). Đợt này tỉ lệ load1 dư 0/10 = 0%.
- **Caveat đếm (F-172-T9-8):** 7 dòng delta thiếu trong 10 spike (43 dòng delta thay vì 50 kỳ vọng — các spike 17:39:15Z thiếu 1, 17:44:55Z thiếu 1, 17:45:30Z thiếu 2, 17:46:04Z thiếu 2, 17:54:55Z thiếu 1) — quy driver bằng ps-top tích lũy + top -b tức thời (ffmpeg 119–150%), như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164), F-165-T9-6 (2 spike đợt 165), F-166-T9-6 (4 spike đợt 166), F-167-T9-6 (6 spike đợt 167), F-168-T9-10 (1 spike đợt 168), F-169-T9-5 (4 pid / 3 spike đợt 169), F-170-T9-5 (6 spike đợt 170) và F-171-T9-8 (2 spike đợt 171). Đợt này 7 dòng delta thiếu — nhiều nhất kể từ đợt 167 (6 spike), vì cụm T1 suite chạy nhiều ffmpeg testsrc2 ngắn (chết giữa chừng trong vòng delta 1 s). **Không spike nào mất attribution** (cả 10 đều có driver cụ thể qua top -b). `grep -c 'WebKit\|MiniBrowser'` = **0 dòng** (không có spike O8 WebKit nào đợt này — O8 WebKit của T8 chạy 18:11:20–18:13:52Z với 0 spike; khác đợt 171: 28 dòng).
- **apt-get update xuất hiện trong 2 spike (17:44:19Z + 17:44:55Z) NHƯNG KHÔNG PHẢI DRIVER:** `/usr/lib/apt/methods/store` 4,3%/3,5%, delta_ticks_1s=0; `apt-get update` 0,0% — đây là repair #81 của T5 đang chạy nền (POSTBOOT_PASS #81 viết 17:50:32Z); apt chỉ là người ngoài cuộc trong snapshot, không gây spike nào. Khác đợt 170 (replay apt gây 6 spike delta-miss): đợt này replay #81 chạy ở chế độ repair sớm, nhẹ hơn.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: 7 dòng delta thiếu trong 5 spike (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 10 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 10/10 spike — 0 spike lớp load1 dư đợt này.
- **Delta tick lớn nhất đợt: 127 tick/s** (ffmpeg testsrc2 1280x720 geq, spike 17:46:38Z, load1 4,05). (Đợt 171: max 133 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 17:38:48Z CÙNG lúc sampler — **0 khoảng mù đầu phiên đợt này** (spike đầu tiên watcher bắt được là 17:39:15Z, ~27 s sau khi mở — trước đó load1 < 3,0; sampler load1 lúc mở 2,35). **Khoảng mù qua reboot #82: 92 s** (watcher chết 19:00:48Z, chạy lại ~19:02:2xZ — cùng gap với sampler; 0 spike nào bị lỡ có thể kiểm chứng — load1 sampler trên #82 max 2,71 < 3,0 trong 11 mẫu đầu, và 0 spike từ khi watcher chạy lại tới đóng). **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg/testsrc2/geq/lut/xfade xuất hiện trong 6 spike của cụm mở đợt** (ffv1 mask + testsrc2 lut + xfade + geq 1280x720 + geq 1920x1080 + pixelate probe — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 7 dòng delta thiếu — xem §2.5). **T2 blind9696-content.py + hole-recheck9696.py xuất hiện trong 2 spike** (17:44:55Z 23,8%; 17:47:50Z — điều tra mù, chỉ là tải phụ). **T5 t5-stats-172.py xuất hiện trong 1 spike** (17:54:55Z 49,4% — stats định kỳ của T5). **T0 O8 Chromium xuất hiện trong 1 spike** (18:09:01Z — O8 driver của T0). **Main agent grep + T5 find xuất hiện trong 1 spike mở phiên** (17:39:15Z). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T2 điều tra + T5 stats + T0 O8 + main agent grep + hatch daemon; **0 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log**).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ hai mươi sáu liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round172-t9/sampler.sh` chạy liên tục 17:38:45Z–19:39:19Z (2 instance: instance 1 sống 17:38:45–19:00:47Z trên #81 rồi **CHẾT theo reboot #82**; instance 2 khởi động lại 19:02:19Z trên #82, sống tới đóng — **1 gap 92 s qua reboot**, 0 gap >90 s khác; max gap trong boot 61 s), **121 mẫu**; các gap còn lại max 61 s (đợt 171: max 61 s; đợt 170: max 61 s; đợt 169: gap 109 s qua reboot #78; đợt 168: gap 55 s qua reboot #76; đợt 167: gap 77 s qua reboot #74; đợt 166: gap 73 s qua reboot #71; đợt 165: gap 35 s qua reboot #70; đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **3.027.892 kB = 48,13% guard** (đợt 171: 98,69% — sát nhất từ trước tới nay; đợt 170: 54,25%; đợt 169: 49,84%; đợt 168: 52,03%; đợt 167: 40,10% — thấp nhất chuỗi; đợt 166: 69,93%; đợt 165: 58,05%; đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). Khoảng cách tới guard lúc đỉnh: **3.263.564 kB (51,87%)** — xa guard nhất kể từ đợt 167 (40,10%). **Caveat (xem F-172-T9-4): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.** Mẫu trước đỉnh (18:02:46Z): 1.581.836 kB; mẫu sau đỉnh (18:04:46Z): 2.795.856 kB — đỉnh là một mẫu đơn lẻ, RAM rơi 232.036 kB trong 60 s sau đó; không có mẫu nào khác trên 3.000.000 kB trong phiên.
- **0 lần thử birefnet trong đợt 172 — lần thứ hai mươi sáu liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0; đợt 166: 0; đợt 167: 0; đợt 168: 0; đợt 169: 0; đợt 170: 0; đợt 171: 0; đợt 172: 0). **Chuỗi 0 lần thử: 26 đợt liên tiếp** (đợt 147–172).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 26 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round172-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `/usr/bin/python3.12` — giống đợt 171); `bgremove.py` **23.500 B** (không đổi so với đợt 171); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-172-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt.**
- **Không cần chạy lại birefnet trong đợt 172** (không mẫu nào đạt guard; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (#81 ≥83 dòng + #82 = 3 dòng; tổng trong đợt ≥58 dòng đếm được — đợt thứ hai mươi mốt liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#81** (4b9db449, btime 17:02:05Z): **≥83 dòng** (T9 đếm trực tiếp từ journal lúc lan-3 18:38:45Z; **không đếm lại được tổng cuối — journal MẤT theo reboot #82 lúc 19:00:48Z**, cùng mẫu F-171-T10-4). Dòng đầu tiên trên #81: **17:04:00Z (boot+115s)** — TRƯỚC khi đợt mở 31m51s (T9 chỉ ghi dòng đầu/cuối tại các mốc kiểm tra, không ghi tay từng dòng giữa). Dòng cuối cùng đếm được: **18:37:50Z** (lúc lan-3 18:38:45Z, count=83).
- Nhịp đều bất thường (xem F-172-T9-5): 31 dòng lúc probe mở 17:38:54Z → 57 dòng lúc lan-2 18:08:45Z (+26 dòng) → 83 dòng lúc lan-3 18:38:45Z (+26 dòng) → (journal mất theo #82). **ENOSPC tăng đúng +26 dòng mỗi khoảng 30 phút, 2 khoảng liên tiếp đo được** — đều như đồng hồ (T9 ghi tương quan, không phán cơ chế — systemd retry theo chu kỳ cố định là giả thuyết, không phải kết luận). **Đối chiếu T5-172 (snapshot độc lập): 46 dòng lúc stats lần 1 17:53:56Z → 48 dòng lúc stats lần 2 17:57:01Z** — khớp nhịp +26/30 phút (31 lúc 17:38:54Z → ~46 lúc 17:53:56Z → 57 lúc 18:08:45Z).
- **Phần trong cửa sổ đợt trên #81 (ước tính, ghi rõ phương pháp):** 31 dòng lúc 17:38:54Z, trong đó ~28 dòng trước khi đợt mở 17:35:51Z (nhịp +26/30 phút tính ngược từ dòng đầu 17:04:00Z: 1.911 s ≈ 27,7 nhịp ~69 s/dòng → ~28 dòng; sai số ±2). **Phần trong đợt trên #81 đếm được lúc lan-3: 83 − 28 = 55 dòng** (cận dưới cho tổng trong đợt trên #81 — tổng cuối không đếm được vì journal mất; ngoại suy theo nhịp, tổng cuối lúc reboot ~102 dòng, tức phần trong đợt ~74 dòng — NGOẠI SUY, KHÔNG PHẢI SỐ ĐẾM).
- Boot **#82** (34e61c92, btime 19:00:48Z): **3 dòng** (T9 đếm trực tiếp lúc đóng phiên; journal còn nguyên). Dòng đầu tiên trên #82: **19:02:35Z (boot+107s)**; dòng thứ hai 19:03:37Z; dòng cuối cùng: **19:04:39Z** — **0 dòng mới sau 19:04:39Z** trong 35 phút còn lại tới đóng (19:39:58Z), trong khi headroom đã về 2 (xem §1.2). Toàn bộ 3 dòng thuộc về đợt 172.
- **Tổng đợt 172 đếm được: ≥58 dòng trong cửa sổ đợt** (55 dòng trên #81 lúc lan-3 + 3 dòng trên #82) — **cận dưới, không phải tổng tuyệt đối** (tổng cuối trên #81 không đếm được). **Không phải cận dưới theo nghĩa mất journal trên #82** (journal #82 còn nguyên từ 19:01:00Z) — nhưng vẫn là số đếm được tại các mốc kiểm tra, không phải số tuyệt đối nếu journal xoay (T9 ghi rõ để T10 không đọc nhầm thành "chắc chắn chỉ có 58 dòng").
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 171: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 171:** đợt 171 có 111 dòng (boot #80 duy nhất, toàn bộ trong đợt). Đợt này **≥83 dòng trên #81 + 3 dòng trên #82** — thấp hơn đợt 171 vì headroom về 2 trên #82 nên ENOSPC dừng sau 19:04:39Z (đợt 171 headroom toàn-0 suốt phiên nên ENOSPC tăng đều tới đóng). Đợt này là đợt có ENOSPC đếm được THẤP NHẤT kể từ đợt 170 (39 dòng — nhưng đợt 170 đếm trọn boot; đợt này tổng cuối #81 không đếm được nên không so hạng tuyệt đối được).
- **Đối chiếu T5-172:** T5-172 ghi "ENOSPC #81: 46 dòng lúc stats 17:53:56Z → 48 dòng lúc stats 17:57:01Z" — số 46/48 là số đếm tại thời điểm T5 kiểm tra (giữa probe mở 31 dòng lúc 17:38:54Z và lan-2 57 dòng lúc 18:08:45Z — khớp nhịp +26/30 phút); số đóng băng của T9 là ≥83 dòng trên #81. Không mâu thuẫn — chỉ khác mốc đếm.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #82 — 1 reboot GIỮA PHIÊN (T9 bắt trực tiếp) + 1 reboot TRƯỚC KHI đợt mở (#81)

- **Reboot #82 (34e61c92-4b99-4487-85a7-e77d545d6d92, btime 19:00:48Z; gap #81→#82 = 7.123 s):** xảy ra **GIỮA PHIÊN** lúc T9 đang đo (T9 phát hiện ~19:01:32Z, 44 s sau btime — khi kiểm tra định kỳ sau khi runtime restart làm gián đoạn lệnh sleep chờ lan-4; T7-172 phát hiện độc lập ~19:01:29Z, 41 s sau btime). **Sampler + watcher B2 + probe-loop gốc của T9 CHẾT theo reboot** (log dừng 19:00:47Z — mẫu cuối trên #81; probe-loop gốc chết trước lan-4). T9 **KHỞI ĐỘNG LẠI cả ba trong ~92 s** (sampler chạy lại 19:02:19Z = boot+91s; watcher B2 chạy lại cùng lúc; probe-loop-82 viết mới chạy lan-4/lan-5 đúng lịch gốc). **1 gap >90 s duy nhất trong log đóng băng: 92,0 s qua reboot #82** (19:00:47Z → 19:02:19Z); max gap trong boot 61,0 s. Số hiệu #82 theo đếm tuần tự — T0-173 xác minh 9 nguồn (T9 chỉ quan sát btime/boot_id/journal/uptime).
- **Reboot #81 (4b9db449, btime 17:02:05Z; gap #80→#81 = 9.064 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ 33m46s** (đợt mở 17:35:51Z, boot+2.026s). T0-172 xác minh 9/9 nguồn; T2-172 xác minh 8 nguồn. **KHÔNG có reboot nào khác giữa phiên đợt 172** — chỉ #82 (giữa phiên) + #81 (trước khi đợt mở).
- **Khoảng trống phủ sóng đầu phiên:** đợt mở 17:35:51Z (boot+2.026s), T9 nhận việc ~17:38Z (boot+~2.155s), sampler khởi động 17:38:45Z (boot+2.200s) — **gap 174 s từ lúc đợt mở tới khi sampler chạy** (đợt 171: gap 516 s; đợt 170: gap 133 s; đợt 169: gap 388 s; đợt 168: gap 283 s; đợt 167: gap 162 s; đợt 166: gap 179 s; đợt 165: gap 1.760 s; đợt 164: gap 383 s; đợt 163: gap 113 s). Gap đầu phiên đợt này NGẮN (T9 spawn nhanh) — nhưng vẫn đủ để cửa sổ thoáng của #81 (nếu có, ~boot+60–200s) đóng trước khi T9 mở (xem §1.2, F-172-T9-1).
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T7-172 đo trong phiên: 19:39:46 vs local 19:39:45 — chênh 1 s; T9 không đo lại).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T0-172 đếm 33 reboot #49–#81 — theo T0-172; marker sống qua #82 chưa đếm — giao T0-173).
- **X11 (T9 kiểm tra lúc đóng phiên 19:44Z):** `/tmp/.X11-unix/` **TRỐNG** (0 socket — T8-172 đã dọn X193/X194/X195 theo checklist (o) đợt 171; T1-172 ghi 3 socket mồ côi X193–X195 mtime 17:45:11Z lúc đóng suite).

### 5.2 T5-172 (infra) — POSTBOOT_PASS #81 ĐÃ CÓ (mode repair-sớm); watcher-172 ALIVE; replay host-side #81 KHÔNG CHẠY

- **POSTBOOT_PASS #81 ĐÃ CÓ lúc 17:50:32Z** (boot+48m27s — theo T5-172; repair-sớm-quyết-h, poll=1, verify độc lập exit 0 lúc 17:53:46Z; 11/11 gói + 5/5 lib, GST symlink→debroot 269=269; dpkg 795 dòng — theo T5-172; T5 sở hữu số chi tiết).
- **POSTBOOT_PASS #80 vẫn có, còn hiệu lực** (replay-đầy-đủ, poll=0 — quyết (j) đợt 171). **POSTBOOT_PASS #78 KHÔNG CÓ** (boot thứ 14 lọt — không bù được, theo T5-172).
- **Watcher-172: START 17:41:39Z, pid 17944, boot 4b9db449 — VẪN ĐANG CHẠY lúc T5 đóng** (poll 18:00:03Z; 20 poll lúc kiểm cuối 18:00:17Z — theo T5-172; watcher-172 CHẾT theo #82 sau đó — T9 không kiểm lại, giao T5-173). **Khoảng không-watcher 2.354 s** (poll cuối watcher-171 17:02:25Z → START watcher-172 17:41:39Z).
- **Repair #81 chạy đầy đủ 8m52s (17:41:40–17:50:32Z)** — apt-get update ~8,5 phút (mirror chậm) + 1 transaction install 17:50:20–17:50:32Z; dpkg 2 → 795 dòng. **Replay host-side #81 KHÔNG CHẠY** (tới lúc watcher spawn dpkg chỉ 2 dòng reconcile, cache 0, lists 5, 0 hoạt động apt trong journal — theo T5-172). **apt-get update của repair xuất hiện trong 2 snapshot spike B2 của T9 (17:44:19Z + 17:44:55Z) với delta 0 — người ngoài cuộc, không phải driver** (xem §2.5).
- **Watcher-171 CHẾT theo #81** (pid 28156 mất; log 266 dòng, 261 poll, 0 proc apt/dpkg trong 261/261 poll; **poll cuối 17:02:25Z — 20 s SAU btime #81** — F-172-T5-1, cùng dị thường timestamp T10-171 đã ghi; KHÔNG có dòng END/STOP — chết theo reboot, KHÔNG dừng sớm — F-171-T5-1 KHÔNG lặp lại).
- **F-172-T5-1 (nếu có — T9 không trích; thuộc T5-172/T10).**

### 5.3 T8-172 (vite harness + O8) — ĐÃ đóng cờ (~18:40Z); O8 PASS 3/3, ĐỀ XUẤT chuỗi LÊN 24 (CÓ CAVEAT); harness 6/6 SẠCH, 0 KẸT

- **T8-172 ĐÃ xuất bản LIMITS + viết cờ `round172-t8.done`** — T9 chỉ đối chiếu bằng dữ kiện sampler + B2 độc lập, không phán thay T8.
- **O8 PASS 3/3 trên boot #81** (18:11:20–18:13:52Z — WebKit 21/21 ×2 + Chromium 21/21, exit 0/0/0): **0 spike B2 trong cửa sổ O8** (khác đợt 171: 3 spike trong cửa sổ O8 — đều do chính process trình duyệt của O8; đợt này spike O8 duy nhất 18:09:01Z là của T0, TRƯỚC cửa sổ O8 của T8). **T8 đề xuất chuỗi WebKit FULL PASS LÊN 24 (23 → 24)** — vì lượt yên #41 hợp lệ ở attempt1 TRÊN BOOT ĐO #81 + O8 sau lượt hợp lệ TRÊN CÙNG BOOT #81 + gate (a) FOUND — **NHƯNG POSTBOOT_PASS mode repair-sớm, KHÔNG phải replay-đầy-đủ: caveat F-172-T8-5** — chờ T10/parent phán (nếu parent cho rằng mode repair-sớm không đủ chuẩn cho chân gate thì chuỗi GIỮ 23).
- **Đối chiếu sampler T9 trong cửa sổ O8 (18:11:20–18:13:52Z): 3 mẫu, gate A MỞ 0/3** (18:11:46Z 947.728 kB; 18:12:46Z 848.680 kB; 18:13:46Z 934.616 kB — cả 3 đều <1024 MiB; số từ log đóng băng), balloon 5.075.196–5.210.212 kB (78,8–80,9% trần, không ghim), load1 1,28–2,93 (sampler).
- **Harness WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (18:14:06–18:29:39Z, 15'33"): WebKit 84l10 **PASS đầy đủ** (lần đầu kể từ đợt 169); WebKit 85m4 **PASS** (P4-lần3 PASS trở lại, chuỗi mới từ 1); WebKit 86n2 **PASS** (điểm kẹt đợt 165 sạch trở lại sau tái diễn đợt 171). Kẹt cộng dồn GIỮ 20. Chuỗi "P3 không kẹt" 0 → 1 (đợt sạch đầu tiên sau khi ĐỨT ở đợt 170). Đối chiếu sampler T9 trong cửa sổ harness: gate A MỞ 2/15; trong cửa sổ pha 86n2: gate A MỞ 0/4, RAM min trong cửa sổ harness 487.984 kB @18:21:46Z trong pha này, **0 spike B2** (xem §2.4).
- **(1c') (c') đã triển khai diag-only — 0 kích hoạt live, 0 FP, 0 BỎ LỠ đợt này** (T8-172 sở hữu; T9 không kiểm tra triển khai). **(c') ĐƯỢC GIỮ theo quyết (i) đợt 171** — T8 đã trình đề xuất sửa điều kiện (f) theo giao quyết (i) đợt 171 (phương án (f') miễn (f) khi run paused+seeking liên tục ≥300 s — replay bắt được kẹt-171 ở elapsed=305 s, 0 FP trên 8 log sạch thật; T8 TRÌNH, KHÔNG TỰ SỬA — parent quyết). T9 chỉ ghi chú tham chiếu.
- **H3: VẪN MỞ, chỉ giám sát thụ động** (theo T8-172 — 0 kẹt mới). **MỞ ĐIỀU TRA RIÊNG 84l10 — ĐỢT ĐẦU, T8 chủ trì** (theo quyết (i) đợt 171; đợt này 84l10 PASS đầy đủ nên chưa có điểm dữ liệu kẹt mới).

### 5.4 T7-172 (scheduler) + T2-172 + T0-172 — T7 CHƯA đóng cờ lúc T9 đóng; run 171 SUCCEEDED, (m) #81 DƯƠNG ỨNG VIÊN, INSIDE #81 NGOÀI → CHUỖI VẪN ĐỨT

- **T7-172 CHƯA xuất bản LIMITS + CHƯA viết cờ `round172-t7.done` lúc T9 đóng (19:44Z)** — T9 chỉ đối chiếu bằng dữ kiện T0/T2 đã xuất bản + NOTES.md của T7, không phán thay T7. Theo T7 NOTES (đọc #6 ~19:39Z): run 172 vẫn RUNNING, started_at/claimed_at/boot_gen KHÔNG ĐỔI, **1 lần viết lại** (tại #82); tuổi gốc lúc 19:39:44Z: 7.433 s; còn 3.367 s tới hạn 20:35:51Z; requeue của #82 kiểm lại: đúng 1 dòng (run 172). Kết cục run 172 thuộc T7-172/T10. T7 dự kiến đóng cờ ~19:55–20:00Z, trong hạn cờ ~20:00Z.
- **Run 171 SUCCEEDED 17:29:26Z theo DB** (theo T2-172/T0-172/T7-172: wall gốc 10.415 s; margin 385 s tới hạn 17:35:51Z; claimed→finished 82 s — NGOÀI họ 6–11 s, ca thứ tư ≥60 s sau 66 s (164), 64 s (166), 108 s (167); **1 lần viết lại** (tại #81 +33,477 s); 5 event đầy đủ, 0 event sau succeeded).
- **(m) #81: DƯƠNG ỨNG VIÊN** (theo T2-172, đối chiếu độc lập từ DB đọc tươi: 1 requeue duy nhất trong cửa [17:02:05Z, 18:00:00Z] (mọi job): eid 10137, 17:02:38.477Z = btime +33,477 s ∈ [33; 49,8] — chỉ hơn biên dưới **0,477 s** (sát biên nhất trong mọi điểm (m) DƯƠNG từng ghi); run 171 ĐANG CHẠY tại btime và BỊ VIẾT LẠI 1 lần. Chữ ký giống #68/#69/#71/#74/#78. **Nếu parent CHẤP NHẬN: n ứng viên 28→29 / 29→30.** T2-172 phán DƯƠNG ỨNG VIÊN — parent quyết cuối. **(m) #82: thuộc T2-173 + parent** (T7 NOTES: requeue của #82 đúng 1 dòng, run 172 — T2-173 đối chiếu độc lập + parent quyết; gap #81→#82 = 7.123 s — dữ kiện mới cho FULL128, T2-172 ghi FULL128 KHÔNG TÍNH ĐƯỢC vì #82 chưa xảy ra lúc T2 đóng).
- **INSIDE (theo T2-172): #81 NGOÀI dải FULL127** [14:57:13Z, 16:58:20Z] neo 14:31:01Z (muộn 225 s; chính xác 224,2 s) → **CHUỖI KHÔNG BẮT ĐẦU LẠI** (đã đứt tại #80 theo quyết (c) đợt 171; chuỗi vẫn dài 0). Đối chiếu dải còn hiệu lực FULL126: cũng NGOÀI (muộn 12.273 s) — **hai dải ĐỒNG THUẬN cùng NGOÀI** (khác #79, nơi hai dải mâu thuẫn). **FULL125/FULL126 KIỂM LẠI ĐỘC LẬP: ĐẠT** (p10/p90 khớp T2-171 bằng hai cách tính mới + giá trị chuỗi — nợ F-171-T10-7 ĐÃ TRẢ). **INSIDE #82: thuộc T2-173** (cần FULL128 = FULL127 + [7.123] — T2-173 tính).
- **(m) #56 vẫn có điều kiện** (theo T2-172 — lần thứ mười lăm không thu hẹp được; T9 không trích số — thuộc T2-172/T10).
- **Mù #96? (theo T2-172 — T9 không trích số chi tiết):** mù #88? VẪN MỞ (hole-recheck lần thứ 16: 337 hit, 0 mốc mới — y hệt lần 9–15); #95?/#94?/#77? giữ nguyên; CERT/FULL chính thức GIỮ 76/91.
- **Lệch khung #81: CÓ OVERLAP** (theo T2-172 — một dòng nội dung boot cũ duy nhất, poll watcher-171 17:02:25Z, nằm SAU btime #81 tới 20 s — OVERLAP thứ tám; T10-171 phán nó KHÔNG đủ lật 5 nguồn xác nhận reboot, T2-172 đồng ý). **Lệch khung #82: thuộc T2-173** (T9 không kiểm — giao T2-173).
- **#80/#81 KHÔNG giết holder** (theo T6-172 — chuỗi từ #69 tiếp tục; T9 không trích số — thuộc T6-172/T10). **#82 có giết holder không: thuộc T6-173.**

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc 19:44Z (8/9)** — T7 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T0-172:** reboot #81 xác minh 9/9 nguồn (btime 17:02:05Z, epoch 1795366925; gap #80→#81 = 9.064 s); marker sống qua 33 reboot #49–#81; **(m) #81 ỨNG VIÊN DƯƠNG** (số liệu thô cho T2-172); T0-172 cũng chạy O8 độc lập PASS 3/3 trên boot #81 (xem §5.3). T9 không trích số khác — thuộc T0-172/T10.
- **T1-172:** verify đợt 171 — verdict PASS, suite chạy lại **28/28 exit 0 trên boot #81** (17:40:39–17:47:57Z, 7m18s); `npm test` 12 pass; đợt 171 = 10 batch / 14 entry / 14 đường dẫn / 13 file mới (đếm khớp từng số quyết parent (a) §12.3 đợt 171 bằng script dedup toàn cục viết mới); **10/10 cờ đợt 171 còn trên đĩa, đều có nội dung**. T9 không trích số khác — thuộc T1-172/T10.
- **T6-172:** (A) kiểm chứng lại **120/120 PASS dưới churn (lần thứ hai mươi hai liên tiếp)**; prune lần 47 (xóa 1 file); #80/#81 không giết holder. T9 không trích số — thuộc T6-172/T10.
- **T4-172:** xem §2.3 (LIMITS đã xuất bản).
- **T2-172:** xem §5.4 (LIMITS đã xuất bản).

## 6. Sai số / caveat (F-172-T9-*)

- **F-172-T9-1 — CỬA SỔ THOÁNG SAU REBOOT QUAN SÁT ĐƯỢC LẦN ĐẦU TỪ ĐỢT 167 — chuỗi "không quan sát được" 4 đợt (168 + 169 + 170 + 171) DỨT.** Reboot #82 btime 19:00:48Z xảy ra GIỮA PHIÊN lúc T9 đang đo; T9 bắt được cửa sổ trực tiếp: **30.001, 30.001 lúc 19:01:56Z = boot+68s** (chạm CAP 30.000), về **0 lúc boot+136s** (19:03:04Z) và **0 lúc boot+196s** (19:04:04Z). Cửa sổ mở tại boot+68s và đã đóng trước boot+136s — rộng chưa tới 68 s, cùng mẫu các đợt 163–166 (30.001 lúc boot+63–81s → 0 lúc boot+110–160s). ENOSPC đầu tiên trên #82 lúc 19:02:35Z = boot+107s — đúng trong lúc cửa sổ đóng. **Khác đợt 168–171 (reboot xảy ra TRƯỚC khi đợt mở nên không thể quan sát): lần này reboot xảy ra GIỮA PHIÊN nên T9 có mặt.** Lưu ý: T9 phát hiện #82 nhờ kiểm tra định kỳ sau khi runtime restart làm gián đoạn lệnh sleep chờ lan-4 (không phải nhờ watcher — watcher đã chết theo reboot); nếu T9 không kiểm tra đúng lúc đó thì cửa sổ đã trôi qua trước khi lan-4 (19:08:45Z) đo được 2. **Cửa sổ của #81 thì KHÔNG quan sát được** (cùng mẫu cấu trúc đợt 170/171 — xem §1.2).
- **F-172-T9-2 — REBOOT #82 GIỮA PHIÊN GIẾT SAMPLER + WATCHER B2 + PROBE-LOOP CỦA T9 — T9 KHỞI ĐỘNG LẠI TRONG ~92 S, 0 SỐ LIỆU MẤT NGOÀI GAP 92 S.** Sampler instance 1 dừng ở mẫu cuối 19:00:47Z (1 s trước btime); instance 2 chạy lại 19:02:19Z (boot+91s). Gap duy nhất >90 s trong log đóng băng: **92,0 s qua reboot** (max gap trong boot 61,0 s). Probe-loop gốc chết trước lan-4; T9 viết lại `probe-loop-82.sh` chạy lan-4 (19:08:45Z) + lan-5 (19:38:45Z) đúng lịch gốc. **Điểm yếu (d) đợt 148 (loop chết theo reboot) TÁI DIỄN — nhưng lần này T9 phát hiện + khởi động lại trong phiên, không để mất cả nửa phiên như đợt 148.** E-176 ghim tới mẫu cuối trước btime 1 s — thời điểm đứt thật nằm trong (19:00:47Z, 19:02:19Z]; T9 không claim cụ thể hơn.
- **F-172-T9-3 — E-176 + E-177 PHÁN 2 EPISODE MỚI — giao T10 xác nhận cách đếm.** E-176: 18:36:47–19:00:47Z, 25 mẫu ghim liên tiếp trên #81, 1 chuỗi, 0 sag — KẾT THÚC theo reboot #82. E-177: 19:13:19–19:39:19Z, 27 mẫu ghim liên tiếp trên #82, 1 chuỗi, 0 sag — ĐANG GHIM lúc đóng. Cả hai đều không có sag nên không có câu hỏi tách episode. E-176 khác E-175 (boot khác, có nhịp xả sâu + leo lại); E-177 khác E-176 (boot khác, reboot #82 xen giữa). Nếu T10/parent phán ngược (một trong hai không tính là episode), tổng số episode đợt 172 đổi 2 → 1 nhưng tổng mẫu ghim 52 không đổi. **E-175 KẾT THÚC — GIỮ 7 mẫu** (đứt trong khoảng mù 3.255 s, không claim thời điểm cụ thể).
- **F-172-T9-4 — RAM ĐỈNH PHIÊN 48,13% GUARD — XA GUARD NHẤT KỂ TỪ ĐỢT 167, 0 MẪU ĐẠT GUARD.** Mẫu 18:03:46Z: RAM 3.027.892 kB, cách guard 3.263.564 kB (51,87%); balloon 3.803.968 kB (59,0% trần). **Caveat bắt buộc:** sampler cadence 60 s — một lần vượt guard dưới 60 s giữa hai mẫu liên tiếp KHÔNG loại trừ được (điểm yếu (a) đợt 147). Mẫu trước đỉnh (18:02:46Z): 1.581.836 kB; mẫu sau đỉnh (18:04:46Z): 2.795.856 kB — đỉnh là một mẫu đơn lẻ, RAM rơi 232.036 kB trong 60 s sau đó; không có mẫu nào khác trên 3.000.000 kB trong phiên. T9 claim đúng: **0 MẪU đạt guard → cơ chế (a) KHÔNG kích hoạt**; T9 KHÔNG claim "không có lúc nào vượt guard". Đợt này caveat (a) ít thực chất hơn đợt 171 (đỉnh 98,69% guard) vì đỉnh chỉ 48,13%.
- **F-172-T9-5 — ENOSPC #81 ≥83 dòng (không đếm lại được tổng cuối — journal mất theo #82) + nhịp +26/30 phút + ENOSPC #82 DỪNG Ở 3 DÒNG KHI HEADROOM VỀ 2.** Nhịp #81: 31 → 57 → 83 (+26 đúng mỗi ~30 phút, 2 khoảng liên tiếp đo được; T5 snapshot 46 @17:53:56Z + 48 @17:57:01Z khớp nhịp). **Số đóng băng của T9 trên #81 là 83 dòng lúc lan-3 18:38:45Z; tổng cuối trên #81 KHÔNG đếm lại được** (journal chỉ còn boot #82 sau reboot — cùng mẫu F-171-T10-4); T10 đếm lại từ journal sẽ chỉ thấy 3 dòng của #82 — chênh lệch là do mất journal, không phải sai số. Phần trong cửa sổ đợt trên #81: **55 dòng đếm được lúc lan-3 (83 − ~28 dòng trước khi đợt mở — ước tính từ nhịp, ±2)**; tổng trong đợt ≥58 dòng (55 + 3 trên #82) là **cận dưới**. **ENOSPC #82 dừng ở 3 dòng sau 19:04:39Z** trong khi headroom giữ 2 tới đóng — T9 ghi tương quan (có slot trống thì systemd thêm được watch), không phán cơ chế.
- **F-172-T9-6 — T9 SUÝT MẮC LỖI TÍNH TAY Ở BẢN NHÁP §2.1 (ĐÃ SỬA TRƯỚC KHI ĐÓNG — BÀI HỌC CHO CHÍNH T9).** Bản nháp đầu viết tay các số giai đoạn (gate A 9/20, 1/10, 1/31; mem 743.924–1.742.016, 487.984–1.685.504, 431.236–1.312.036, 566.624–1.088.720; mẫu sau đỉnh 1.742.016 kB) — T9 kiểm lại bằng script trên log đóng băng và phát hiện **8 số sai** (gate A đúng là 18/20, 7/10, 0/31; mem đúng là 848.680–2.795.856, 487.984–1.351.824, 431.236–1.001.988, 566.624–600.400; mẫu sau đỉnh đúng là 2.795.856 kB) — **đã sửa toàn bộ trước khi đóng cờ**. Bài học: KHÔNG viết số giai đoạn bằng tay từ trí nhớ — mọi số bảng phải chạy script kiểm tra trước khi ghi LIMITS (cùng họ F-163-T9-1). Các số còn lại trong file này đều từ script analyze (`t9-172-analyze.py`) hoặc trích trực tiếp từ log đóng băng, không tính tay.
- **F-172-T9-7 — BÀI HỌC F-171-T10-2 ĐÃ ĐƯỢC ÁP DỤNG: KIỂM BOOT LẦN CUỐI SÁT NGAY TRƯỚC KHI VIẾT .done/LIMITS.** T9-171 đóng cờ trên boot mới (#81) mà không phát hiện vì kiểm cuối ~16:47Z. Đợt này T9 kiểm boot_id + btime **ngay trước khi viết .done** (19:44:17Z — boot 34e61c92, btime 19:00:48Z, journal chỉ còn #82) và kiểm lại lần nữa sát lúc viết .done — **boot lúc đóng vẫn #82, không có reboot mới sau #82**. Các claim "0 reboot sau #82" trong file này đúng tới lần kiểm cuối đó.
- **F-172-T9-8 — 7 DÒNG DELTA THIẾU TRONG 10 SPIKE (NHIỀU NHẤT KỂ TỪ ĐỢT 167) — NHƯNG 0 SPIKE MẤT ATTRIBUTION.** Các spike 17:39:15Z (thiếu 1), 17:44:55Z (thiếu 1), 17:45:30Z (thiếu 2), 17:46:04Z (thiếu 2), 17:54:55Z (thiếu 1) — dòng delta in ra THIẾU pid (chỉ 3–4 dòng delta thay vì 5). Driver quy bằng ps-top tích lũy + top -b tức thời (ffmpeg 119–150%). Nguyên nhân: ffmpeg testsrc2 ngắn + grep/find ngắn — chết giữa chừng trong vòng delta 1 s. **Không lặp F-171-T9-8 về số lượng** (đợt 171: 2 dòng delta thiếu; đợt này: 7 dòng — vì cụm T1 suite chạy nhiều ffmpeg ngắn liên tiếp). T9 ghi rõ để T10 không đếm nhầm thành "7 spike không quy được driver" (cả 10 spike đều có driver cụ thể qua top -b).
- **F-172-T9-9 — SỐ RAM MIN CỦA T8 (478 MB @18:21:36Z) VÀ CỦA T9 (487.984 kB @18:21:46Z) CÙNG MỘT TRŨNG, KHÁC CADENCE — KHÔNG MÂU THUẪN.** Sampler T9 cadence 60 s: mẫu 18:21:46Z = 487.984 kB (476,5 MiB); sampler T8 (n=32, cadence ~30 s trong harness) bắt được 478 MB @18:21:36Z — 10 s trước mẫu của T9, trong cùng nhịp rơi đơn điệu 18:14–18:21Z (sampler T9: 18:20:46Z 575.100 kB → 18:21:46Z 487.984 kB → 18:22:46Z — T9 không liệt kê tay mẫu sau, số từ log đóng băng). T9 không tranh số của T8; cả hai cùng chứng minh trũng RAM trong lúc harness WebKit 86n2 — NHƯNG pha này PASS (không kẹt), nên trũng RAM không gây kẹt (cùng mẫu F-171-T9-9/F-170-T9-10).
- **F-172-T9-10 — T7-172 CHƯA đóng cờ lúc T9 đóng (19:44Z) — kết cục run 172 thuộc T7-172/T10.** T9 không chờ T7 (hạn cờ T9 ~20:00Z). T7 NOTES.md đọc #6 ~19:39Z: run 172 vẫn RUNNING, 1 lần viết lại (tại #82), tuổi gốc 7.433 s lúc 19:39:44Z. T9 đóng cờ trong hạn cờ.
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được — đợt này quan sát được 30.001 lúc boot+68s, nhưng giá trị thật trên CAP không đo được); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — xem F-172-T9-4); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #81 từ cell vì journalctl chỉ còn boot hiện tại sau reboot (cùng họ EPERM như `dmesg` — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 172 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).

---

## Phụ lục — log sampler đóng băng (121 mẫu, 17:38:45Z–19:39:19Z)

Nội dung dưới đây được tạo BẰNG SCRIPT từ `hidden_files/round172-t9/ram-sampler-FROZEN.log` (md5 `044cf3619b911aa5b1a34b4e96dad0d4`) — không gõ lại bằng tay (xem F-169-T9-9).

```
2026-11-22T17:38:45Z boot=4b9db449 mem=841420 bal=5985072 swapfree=715384 load1=2.35
2026-11-22T17:39:45Z boot=4b9db449 mem=1769928 bal=5002032 swapfree=760272 load1=2.89
2026-11-22T17:40:45Z boot=4b9db449 mem=1210488 bal=5203900 swapfree=772396 load1=1.94
2026-11-22T17:41:45Z boot=4b9db449 mem=1635236 bal=5071012 swapfree=752964 load1=1.13
2026-11-22T17:42:45Z boot=4b9db449 mem=1450772 bal=5251664 swapfree=757120 load1=1.15
2026-11-22T17:43:45Z boot=4b9db449 mem=1675924 bal=4985936 swapfree=751008 load1=1.92
2026-11-22T17:44:45Z boot=4b9db449 mem=1456780 bal=5173164 swapfree=751632 load1=3.00
2026-11-22T17:45:45Z boot=4b9db449 mem=1233852 bal=5334560 swapfree=750852 load1=4.14
2026-11-22T17:46:45Z boot=4b9db449 mem=1299140 bal=5372300 swapfree=709476 load1=4.28
2026-11-22T17:47:46Z boot=4b9db449 mem=1009352 bal=5504732 swapfree=700336 load1=3.30
2026-11-22T17:48:46Z boot=4b9db449 mem=1145840 bal=5636276 swapfree=699676 load1=2.31
2026-11-22T17:49:46Z boot=4b9db449 mem=1630596 bal=5091372 swapfree=704232 load1=2.54
2026-11-22T17:50:46Z boot=4b9db449 mem=1333224 bal=5282848 swapfree=707628 load1=1.43
2026-11-22T17:51:46Z boot=4b9db449 mem=1299660 bal=5460128 swapfree=710632 load1=1.36
2026-11-22T17:52:46Z boot=4b9db449 mem=1156688 bal=5620412 swapfree=712716 load1=1.85
2026-11-22T17:53:46Z boot=4b9db449 mem=1436724 bal=5279580 swapfree=684912 load1=1.76
2026-11-22T17:54:46Z boot=4b9db449 mem=1908768 bal=4886364 swapfree=667540 load1=2.68
2026-11-22T17:55:46Z boot=4b9db449 mem=2547228 bal=4108344 swapfree=642572 load1=2.52
2026-11-22T17:56:46Z boot=4b9db449 mem=2386164 bal=4296592 swapfree=644864 load1=1.60
2026-11-22T17:57:46Z boot=4b9db449 mem=2154512 bal=4561892 swapfree=642924 load1=1.82
2026-11-22T17:58:46Z boot=4b9db449 mem=1882416 bal=4797448 swapfree=643440 load1=1.38
2026-11-22T17:59:46Z boot=4b9db449 mem=1410792 bal=4546616 swapfree=639732 load1=0.83
2026-11-22T18:00:46Z boot=4b9db449 mem=1164436 bal=4655828 swapfree=652700 load1=2.35
2026-11-22T18:01:46Z boot=4b9db449 mem=1500112 bal=4851492 swapfree=659048 load1=1.23
2026-11-22T18:02:46Z boot=4b9db449 mem=1581836 bal=5032284 swapfree=776188 load1=0.92
2026-11-22T18:03:46Z boot=4b9db449 mem=3027892 bal=3803968 swapfree=784236 load1=0.89
2026-11-22T18:04:46Z boot=4b9db449 mem=2795856 bal=4022064 swapfree=788900 load1=0.39
2026-11-22T18:05:46Z boot=4b9db449 mem=2427756 bal=4321508 swapfree=790008 load1=0.47
2026-11-22T18:06:46Z boot=4b9db449 mem=2227352 bal=4591976 swapfree=791740 load1=0.21
2026-11-22T18:07:46Z boot=4b9db449 mem=1143448 bal=4798260 swapfree=792040 load1=0.35
2026-11-22T18:08:46Z boot=4b9db449 mem=1623740 bal=4952580 swapfree=778020 load1=2.84
2026-11-22T18:09:46Z boot=4b9db449 mem=2183888 bal=4673748 swapfree=703372 load1=2.22
2026-11-22T18:10:46Z boot=4b9db449 mem=1843608 bal=4913012 swapfree=708912 load1=0.91
2026-11-22T18:11:46Z boot=4b9db449 mem=947728 bal=5089484 swapfree=702856 load1=1.28
2026-11-22T18:12:46Z boot=4b9db449 mem=848680 bal=5210212 swapfree=684048 load1=2.93
2026-11-22T18:13:46Z boot=4b9db449 mem=934616 bal=5075196 swapfree=655700 load1=1.70
2026-11-22T18:14:46Z boot=4b9db449 mem=972140 bal=5235092 swapfree=654624 load1=1.57
2026-11-22T18:15:46Z boot=4b9db449 mem=824620 bal=5384968 swapfree=653724 load1=1.03
2026-11-22T18:16:46Z boot=4b9db449 mem=697028 bal=5499480 swapfree=649104 load1=1.29
2026-11-22T18:17:46Z boot=4b9db449 mem=1282432 bal=5599764 swapfree=662792 load1=2.72
2026-11-22T18:18:46Z boot=4b9db449 mem=627208 bal=5613136 swapfree=635612 load1=2.05
2026-11-22T18:19:46Z boot=4b9db449 mem=546120 bal=5708292 swapfree=644220 load1=2.60
2026-11-22T18:20:46Z boot=4b9db449 mem=575100 bal=5805264 swapfree=644972 load1=1.12
2026-11-22T18:21:46Z boot=4b9db449 mem=487984 bal=5896528 swapfree=645388 load1=0.55
2026-11-22T18:22:46Z boot=4b9db449 mem=894640 bal=5203860 swapfree=612412 load1=2.04
2026-11-22T18:23:46Z boot=4b9db449 mem=867912 bal=5311632 swapfree=612764 load1=1.31
2026-11-22T18:24:46Z boot=4b9db449 mem=577144 bal=5433976 swapfree=616168 load1=1.56
2026-11-22T18:25:46Z boot=4b9db449 mem=1351824 bal=5550776 swapfree=617512 load1=0.89
2026-11-22T18:26:47Z boot=4b9db449 mem=602936 bal=5381952 swapfree=613732 load1=1.84
2026-11-22T18:27:47Z boot=4b9db449 mem=688216 bal=5496336 swapfree=613224 load1=1.16
2026-11-22T18:28:47Z boot=4b9db449 mem=590392 bal=5621092 swapfree=613920 load1=0.42
2026-11-22T18:29:47Z boot=4b9db449 mem=1141792 bal=5732420 swapfree=614656 load1=0.33
2026-11-22T18:30:47Z boot=4b9db449 mem=1001988 bal=5875656 swapfree=624964 load1=0.43
2026-11-22T18:31:47Z boot=4b9db449 mem=865216 bal=6004884 swapfree=631428 load1=0.29
2026-11-22T18:32:47Z boot=4b9db449 mem=776420 bal=6121984 swapfree=632980 load1=0.45
2026-11-22T18:33:47Z boot=4b9db449 mem=661300 bal=6229760 swapfree=630104 load1=0.16
2026-11-22T18:34:47Z boot=4b9db449 mem=543912 bal=6327176 swapfree=629788 load1=0.06
2026-11-22T18:35:47Z boot=4b9db449 mem=463284 bal=6414992 swapfree=630216 load1=0.13
2026-11-22T18:36:47Z boot=4b9db449 mem=433272 bal=6443824 swapfree=621384 load1=0.23
2026-11-22T18:37:47Z boot=4b9db449 mem=443940 bal=6443824 swapfree=625584 load1=0.25
2026-11-22T18:38:47Z boot=4b9db449 mem=431236 bal=6443824 swapfree=624572 load1=0.12
2026-11-22T18:39:47Z boot=4b9db449 mem=452976 bal=6443824 swapfree=626052 load1=0.19
2026-11-22T18:40:47Z boot=4b9db449 mem=441204 bal=6443824 swapfree=629144 load1=0.17
2026-11-22T18:41:47Z boot=4b9db449 mem=441736 bal=6443824 swapfree=629280 load1=0.18
2026-11-22T18:42:47Z boot=4b9db449 mem=469652 bal=6443824 swapfree=632576 load1=0.13
2026-11-22T18:43:47Z boot=4b9db449 mem=464240 bal=6443824 swapfree=631056 load1=0.04
2026-11-22T18:44:47Z boot=4b9db449 mem=444000 bal=6443824 swapfree=629468 load1=0.09
2026-11-22T18:45:47Z boot=4b9db449 mem=457940 bal=6443824 swapfree=628900 load1=0.03
2026-11-22T18:46:47Z boot=4b9db449 mem=460312 bal=6443824 swapfree=628664 load1=0.01
2026-11-22T18:47:47Z boot=4b9db449 mem=468776 bal=6443824 swapfree=627160 load1=0.00
2026-11-22T18:48:47Z boot=4b9db449 mem=452836 bal=6443824 swapfree=623972 load1=0.07
2026-11-22T18:49:47Z boot=4b9db449 mem=456744 bal=6443824 swapfree=628372 load1=0.02
2026-11-22T18:50:47Z boot=4b9db449 mem=441288 bal=6443824 swapfree=628432 load1=0.09
2026-11-22T18:51:47Z boot=4b9db449 mem=459724 bal=6443824 swapfree=628596 load1=0.08
2026-11-22T18:52:47Z boot=4b9db449 mem=459072 bal=6443824 swapfree=627656 load1=0.03
2026-11-22T18:53:47Z boot=4b9db449 mem=459716 bal=6443824 swapfree=626792 load1=0.01
2026-11-22T18:54:47Z boot=4b9db449 mem=461180 bal=6443824 swapfree=626772 load1=0.10
2026-11-22T18:55:47Z boot=4b9db449 mem=444868 bal=6443824 swapfree=624144 load1=0.44
2026-11-22T18:56:47Z boot=4b9db449 mem=459324 bal=6443824 swapfree=626564 load1=0.24
2026-11-22T18:57:47Z boot=4b9db449 mem=454392 bal=6443824 swapfree=626576 load1=0.12
2026-11-22T18:58:47Z boot=4b9db449 mem=447644 bal=6443824 swapfree=627364 load1=0.04
2026-11-22T18:59:47Z boot=4b9db449 mem=454144 bal=6443824 swapfree=629932 load1=0.26
2026-11-22T19:00:47Z boot=4b9db449 mem=445036 bal=6443824 swapfree=638620 load1=0.32
2026-11-22T19:02:19Z boot=34e61c92 mem=1921712 bal=4890660 swapfree=990444 load1=2.71
2026-11-22T19:03:19Z boot=34e61c92 mem=1814924 bal=5108688 swapfree=918580 load1=1.76
2026-11-22T19:04:19Z boot=34e61c92 mem=1596340 bal=5313976 swapfree=900412 load1=1.36
2026-11-22T19:05:19Z boot=34e61c92 mem=1479232 bal=5499644 swapfree=852920 load1=1.25
2026-11-22T19:06:19Z boot=34e61c92 mem=1310772 bal=5672808 swapfree=854052 load1=0.45
2026-11-22T19:07:19Z boot=34e61c92 mem=1169944 bal=5830476 swapfree=837284 load1=0.43
2026-11-22T19:08:19Z boot=34e61c92 mem=1038972 bal=5972972 swapfree=831128 load1=0.33
2026-11-22T19:09:19Z boot=34e61c92 mem=904404 bal=6103120 swapfree=815516 load1=0.18
2026-11-22T19:10:19Z boot=34e61c92 mem=800712 bal=6221076 swapfree=810600 load1=0.29
2026-11-22T19:11:19Z boot=34e61c92 mem=680764 bal=6329880 swapfree=793752 load1=0.27
2026-11-22T19:12:19Z boot=34e61c92 mem=601080 bal=6429668 swapfree=776456 load1=0.28
2026-11-22T19:13:19Z boot=34e61c92 mem=566624 bal=6443824 swapfree=776560 load1=0.27
2026-11-22T19:14:19Z boot=34e61c92 mem=592056 bal=6443824 swapfree=776388 load1=0.14
2026-11-22T19:15:19Z boot=34e61c92 mem=596332 bal=6443824 swapfree=776428 load1=0.05
2026-11-22T19:16:19Z boot=34e61c92 mem=579148 bal=6443824 swapfree=776888 load1=0.38
2026-11-22T19:17:19Z boot=34e61c92 mem=600400 bal=6443824 swapfree=767944 load1=0.22
2026-11-22T19:18:19Z boot=34e61c92 mem=584028 bal=6443824 swapfree=765340 load1=0.11
2026-11-22T19:19:19Z boot=34e61c92 mem=598284 bal=6443824 swapfree=765452 load1=0.08
2026-11-22T19:20:19Z boot=34e61c92 mem=589264 bal=6443824 swapfree=764812 load1=0.38
2026-11-22T19:21:19Z boot=34e61c92 mem=588016 bal=6443824 swapfree=764872 load1=0.14
2026-11-22T19:22:19Z boot=34e61c92 mem=575420 bal=6443824 swapfree=772280 load1=0.05
2026-11-22T19:23:19Z boot=34e61c92 mem=588532 bal=6443824 swapfree=772296 load1=0.02
2026-11-22T19:24:19Z boot=34e61c92 mem=577516 bal=6443824 swapfree=772348 load1=0.04
2026-11-22T19:25:19Z boot=34e61c92 mem=590788 bal=6443824 swapfree=772404 load1=0.01
2026-11-22T19:26:19Z boot=34e61c92 mem=595460 bal=6443824 swapfree=772496 load1=0.00
2026-11-22T19:27:19Z boot=34e61c92 mem=570764 bal=6443824 swapfree=772512 load1=0.04
2026-11-22T19:28:19Z boot=34e61c92 mem=591220 bal=6443824 swapfree=772528 load1=0.01
2026-11-22T19:29:19Z boot=34e61c92 mem=572700 bal=6443824 swapfree=772536 load1=0.00
2026-11-22T19:30:19Z boot=34e61c92 mem=595396 bal=6443824 swapfree=770904 load1=0.00
2026-11-22T19:31:19Z boot=34e61c92 mem=590488 bal=6443824 swapfree=773012 load1=0.09
2026-11-22T19:32:19Z boot=34e61c92 mem=575248 bal=6443824 swapfree=775208 load1=0.21
2026-11-22T19:33:19Z boot=34e61c92 mem=591476 bal=6443824 swapfree=775064 load1=0.08
2026-11-22T19:34:19Z boot=34e61c92 mem=570364 bal=6443824 swapfree=775612 load1=0.03
2026-11-22T19:35:19Z boot=34e61c92 mem=570596 bal=6443824 swapfree=775668 load1=0.14
2026-11-22T19:36:19Z boot=34e61c92 mem=567600 bal=6443824 swapfree=774764 load1=0.05
2026-11-22T19:37:19Z boot=34e61c92 mem=582672 bal=6443824 swapfree=771516 load1=0.02
2026-11-22T19:38:19Z boot=34e61c92 mem=573712 bal=6443824 swapfree=771496 load1=0.00
2026-11-22T19:39:19Z boot=34e61c92 mem=575948 bal=6443824 swapfree=771544 load1=0.06
```

---

## Phụ lục — headroom log (62 dòng, 16 lần đo hợp lệ)

Nội dung dưới đây được tạo BẰNG SCRIPT từ `hidden_files/round172-t9/headroom-log-FROZEN.txt` (md5 `e551c519b8ef0e8ac9898a0b63ed27e5`) — không gõ lại bằng tay (xem F-169-T9-9).

```
=== probe-mo 2026-11-22T17:38:54Z boot=4b9db449 tran=63747
2026-11-22T17:38:54Z
0
0
ENOSPC-count=31
ENOSPC-first: Nov 22 17:04:00 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last: Nov 22 17:38:30 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1159924 kB | Balloon:         5591856 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-2 2026-11-22T18:08:45Z boot=4b9db449 tran=63747
0
0
ENOSPC-count=57
ENOSPC-last: Nov 22 18:08:30 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1735320 kB | Balloon:         4952580 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-22T18:38:45Z boot=4b9db449 tran=63747
0
0
ENOSPC-count=83
ENOSPC-last: Nov 22 18:37:50 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     439864 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-boot82-window 2026-11-22T19:01:56Z boot=34e61c92 tran=63747
2026-11-22T19:01:56Z
30001
30001
ENOSPC-count=0
ENOSPC-first: (none on boot 34e61c92 yet)
ENOSPC-last: (none on boot 34e61c92 yet)
mem: MemAvailable:    1974236 kB | Balloon:         4890660 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-boot82-track1 2026-11-22T19:03:04Z boot=34e61c92 tran=63747
0
=== probe-boot82-track2 2026-11-22T19:04:04Z boot=34e61c92 tran=63747
0
ENOSPC-count=2
mem: MemAvailable:    1686836 kB | Balloon:         5247256 kB
=== probe-lan-4 2026-11-22T19:08:45Z boot=34e61c92 tran=63747
2
2
ENOSPC-count-boot82=3
ENOSPC-last: Nov 22 19:04:39 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1006556 kB | Balloon:         6017872 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-5 2026-11-22T19:38:45Z boot=34e61c92 tran=63747
2
2
ENOSPC-count-boot82=3
ENOSPC-last: Nov 22 19:04:39 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     588356 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
probe-loop-82 done 2026-11-22T19:38:45Z
=== probe-close 2026-11-22T19:39:58Z boot=34e61c92 tran=63747
2026-11-22T19:39:58Z
2
2
ENOSPC-count-boot82=3
ENOSPC-first-boot82: Nov 22 19:02:35 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last-boot82: Nov 22 19:04:39 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     524608 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```
