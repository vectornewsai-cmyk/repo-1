# LIMITS — Phase 9 đợt 171, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ hai mươi lăm liên tiếp; headroom 0 CẢ 12 LẦN ĐO — lần đầu toàn-0 kể từ đợt 159; CỬA SỔ THOÁNG SAU REBOOT KHÔNG QUAN SÁT ĐƯỢC LẦN THỨ TƯ LIÊN TIẾP; E-174 KẾT THÚC trong khoảng mù + E-175 MỚI 7 mẫu ĐANG GHIM; RAM ĐỈNH PHIÊN 98,69% GUARD — SÁT GUARD NHẤT TỪ TRƯỚC TỚI NAY; ENOSPC 111 dòng; REBOOT #80 TRƯỚC KHI ĐỢT MỞ)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 0 lúc đóng (12 lần đo hợp lệ: 12 lần 0, 0 lần 2), dưới ngưỡng < ~1.800 lần thứ ba mươi mốt liên tiếp** — lần đầu tiên kể từ đợt 159 cả 12 lần đo đều 0 (đợt 168/169/170 đều có 2; đợt 170 còn dao động 0→2→0→2). Trần **63.747 trên boot #80 duy nhất**. Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT KHÔNG QUAN SÁT ĐƯỢC LẦN THỨ TƯ LIÊN TIẾP (đợt 168 + 169 + 170 + 171).** Reboot #80 (btime 14:31:01Z) xảy ra **TRƯỚC KHI ĐỢT MỞ 4m50s** — đợt mở 14:35:51Z đã là boot+290s; probe mở 14:44:47Z (boot+826s) đã là **0, 0**; ENOSPC đầu tiên trên #80 lúc 14:36:14Z (boot+313s). Lần này cửa sổ KHÔNG THỂ quan sát được theo cấu trúc (T9 chỉ có mặt sau khi đợt mở, mà đợt mở đã muộn hơn boot) — cùng mẫu đợt 170 (#79 trước khi đợt mở 24m46s). Xem §1.2, F-171-T9-1.
- **Balloon — E-174 KẾT THÚC trong khoảng mù giữa hai đợt (GIỮ 47 mẫu) + E-175 MỚI (7 mẫu, 1 chuỗi, 0 sag, ĐANG GHIM lúc đóng):** mẫu ghim cuối E-174 13:38:07Z trên #79 (đợt 170); khoảng mù **3.980 s (13:38:07Z → 14:44:27Z)** có **MỘT reboot (#80 btime 14:31:01Z)**; mẫu đầu trên #80 (14:44:27Z) balloon đã 6.055.332 kB (94,0% trần), không ghim — thời điểm đứt thật nằm trong (13:38:07Z, 14:44:27Z], T9 không claim cụ thể. **E-175 MỚI trên #80: 16:38:30–16:44:30Z, 7 mẫu ghim, 1 chuỗi, 0 sag — ĐANG GHIM lúc đóng**, kết cục thuộc đợt sau. **E-174 GIỮ 47 mẫu, E-173 GIỮ 57 mẫu, E-172 GIỮ 3 mẫu, E-171 GIỮ 12 mẫu, E-170 GIỮ 48 mẫu, E-169 GIỮ 20 mẫu. Tổng ghim đợt này 7/121 mẫu (5,8%).** Xem §2.2.
- **RAM: sampler 121 mẫu, 14:44:27Z–16:44:30Z, MỘT boot duy nhất (#80).** Max **6.209.324 kB (6.062,8 MiB = 98,69% guard) lúc 15:12:28Z** — **SÁT GUARD NHẤT TỪ TRƯỚC TỚI NAY** (kỷ lục cũ: 69,93% đợt 166); chỉ còn cách guard **82.132 kB**. Balloon xả sâu nhất phiên cùng lúc: **544.840 kB (8,5% trần)** — xả sâu nhất từng ghi. Min **296.796 kB lúc 16:00:29Z** (trong lúc kẹt 85m4); mean toàn phiên **1.377.347,3 kB — tính bằng 3 cách (python + awk 1.377.347,3 + trung bình có trọng số) KHỚP NHAU**. Gate A **45/121 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ hai mươi lăm liên tiếp.** Caveat: cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu (điểm yếu (a) đợt 147) — T9 chỉ claim 0 MẪU đạt guard, không claim "không có lúc nào vượt guard". Xem §2, §3.
- **B2: 12 spike THẬT (grep '^=== SPIKE' = grep không neo = 12), 11/12 QUY ĐƯỢC DRIVER CỤ THỂ, 1 load1 dư.** Cụm 14:53–14:58Z (9 spike, load1 tới 9,06): T1 suite ffmpeg testsrc2 + T4 analyze attempt1 + T8/T0 O8 setup — **2 spike TRONG cửa sổ attempt1** (14:53:02Z + 14:53:38Z, đều ffmpeg T1) **và 2 spike TRONG cửa sổ attempt2** (15:03:53Z WebKit probe T4 + 15:04:28Z t5-stats) — khớp verdict NHIỄM của T4 cho attempt1/attempt2. **0 spike trong cửa sổ attempt3, 0 spike trong cửa sổ O8, 0 spike trong cửa sổ harness (kể cả trong 3 lúc kẹt WebKit).** 2 spike delta-miss (đều ffmpeg, quy bằng top -b tức thời). Delta tick lớn nhất 133 tick/s (ffmpeg testsrc2 1920x1080, 14:53:38Z). Xem §2.5.
- **Lượt yên WebKit #40 (T4): CÓ LƯỢT HỢP LỆ Ở ATTEMPT3 — CHUỖI LÊN 35.** Attempt1 + attempt2 NHIỄM TẢI (lớp B vi phạm) nên retry; attempt3-2acdd1ab (15:08:10–15:11:32Z): probe 20/20, lớp B 5/5, tickCost median 43,0 ms ≤ 60 — HỢP LỆ. Sampler T9 đối chiếu: gate A MỞ 4/4 mẫu trong cửa sổ; load1 1,55–3,04; **0 spike B2 trong cửa sổ attempt3**. **F-170-T9-9 ĐÃ ĐƯỢC SỬA (xem F-171-T9-7):** T4-171 dùng đúng wording mới "không chạy script nào trong lúc probe pass chạy" (F-171-T4-5); file output analyze attempt3 có mtime 15:11:36–15:12:00Z — 4 s SAU khi pass cuối kết thúc (15:11:32Z), không chồng lấn pass nào. **NHƯNG F-171-T2-1 MỚI: T2 chạy script nặng `m56-171.py` (grep -r, ~88 s) chồng ~61 s lên cửa sổ probe pass attempt3 — VI PHẠM luật đứng.** T9 phán (xem F-171-T9-6): vi phạm là thật, nhưng tác động đo được bị chặn — load1 max 3,04 (sampler T4 n=100 VÀ sampler T9 độc lập KHỚP NHAU TỪNG SỐ), B2 ĐẠT (≤4), 0 spike B2, tickCost median 43,0 — verdict attempt3 KHÔNG bị lật bởi dữ kiện T9; parent/T10 quyết cuối có chấp nhận hay không. Xem §2.3.
- **T8-171 (đối chiếu): O8 PASS 3/3 trên boot #80 (15:33:56–15:36:33Z) — T8 ĐỀ XUẤT chuỗi WebKit FULL PASS LÊN 23** (lượt yên #40 hợp lệ + O8 cùng boot #80 + gate (a) FOUND); **harness WebKit 0/3 + Chromium 3/3 — KẸT THẬT CẢ 3 PHA WEBKIT** (84l10 15:38:11–15:53:12Z, 85m4 15:53:27–16:08:34Z, 86n2 16:08:49–16:23:51Z) — kẹt cộng dồn 17 → 20; (1c') giữ nguyên, 0 kích hoạt, 0 FP — **NHƯNG BỎ LỠ 1 kẹt thật 85m4** (điều kiện (f) chặn vì paused+seeking — F-171-T8-7). T9 đối chiếu bằng sampler độc lập: RAM min phiên 296.796 kB @16:00:29Z trong lúc kẹt 85m4; số min của T8 (252 MB @16:01:08Z) và của T9 cùng một trũng, khác cadence — không mâu thuẫn (xem F-171-T9-9). Xem §2.4.
- **REBOOT #80 DUY NHẤT (2acdd1ab, btime 14:31:01Z; gap #79→#80 = 11.996 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ** (T0-171 xác minh 9/9 nguồn; T2-171 xác minh 8 nguồn). **KHÔNG có reboot giữa phiên đợt 171** — sampler + watcher + probe-loop sống suốt phiên; **0 gap >90 s trong log đóng băng (max 61 s)**. Run 170 SUCCEEDED 14:21:03Z (margin 888 s — theo T7-171/T2-171). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: #80 = 111 dòng (đếm được, toàn bộ thuộc về đợt 171 — dòng đầu tiên 14:36:14Z, SAU khi đợt mở 23 s; dòng cuối lúc đóng 16:43:53Z). Đợt thứ hai mươi liên tiếp bảng watch cạn gây lỗi thật thấy được.** Nhịp đều bất thường: **+26 dòng đúng mỗi khoảng 30 phút** (7 → 33 → 59 → 85 → 111). Journal vẫn tăng SAU khi T9 đóng (113 dòng lúc kiểm lại 16:47Z, dòng cuối 16:46:03Z) — 2 dòng sau-đóng KHÔNG tính vào số đóng băng 111. Xem §4.
- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc T9 đóng (8/9)** — T7 CHƯA đóng cờ lúc T9 đóng (chỉ có NOTES.md); kết cục run 171 thuộc T7-171. **(m) #80: KHÔNG PHẢI ĐIỂM** (0 requeue trong cửa — theo T2-171). **INSIDE: #79 INSIDE dải FULL125 → chuỗi MỚI từ #73 dài 6; #80 NGOÀI dải FULL126 → CHUỖI ĐỨT tại #80** (theo T2-171). Xem §5.3/§5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không mẫu nào đạt guard — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round171-t9/k8-headroom.py` (copy y nguyên từ đợt 170 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 171 (12 lần đo hợp lệ, 1 boot, 0 lần đo lỗi)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 14:44:47Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 1–2, cặp mở (boot+826s); ENOSPC-count=7 (dòng đầu tiên 14:36:14Z = boot+313s); balloon 6.095.192 kB (94,6% trần) |
| 14:44:47Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 2 (chênh **0**) |
| 15:14:27Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 3–4, probe-loop lan-2; ENOSPC-count=33 (dòng mới nhất 15:14:03Z); balloon 1.200.200 kB (xả sâu) |
| 15:14:27Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 4 (chênh **0**) |
| 15:44:27Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 5–6, probe-loop lan-3; ENOSPC-count=59 (dòng mới nhất 15:43:53Z); balloon 5.941.760 kB |
| 15:44:27Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 6 (chênh **0**) |
| 16:14:27Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 7–8, probe-loop lan-4; ENOSPC-count=85 (dòng mới nhất 16:14:03Z); balloon 5.971.488 kB |
| 16:14:27Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 8 (chênh **0**) |
| 16:44:27Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 9–10, probe-loop lan-5; ENOSPC-count=111 (dòng mới nhất 16:43:53Z); balloon ĐANG GHIM TRẦN (E-175), RAM 468.120 kB |
| 16:44:27Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 10 (chênh **0**) |
| 16:44:42Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 11–12, cặp đóng; balloon ĐANG GHIM TRẦN (E-175), RAM 463.156 kB; ENOSPC-count=111 |
| 16:44:42Z 22/11 | **0** | #80 2acdd1ab | 63.747 | lần đo 12 (chênh **0**) |

- Probe dừng ở `i=0` trong 12/12 lần đo hợp lệ. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi lần đo).
- **Cửa sổ thoáng sau reboot: KHÔNG QUAN SÁT ĐƯỢC — LẦN THỨ TƯ LIÊN TIẾP (đợt 168 + 169 + 170 + 171).** Reboot #80 btime 14:31:01Z (T0-171 xác minh 9 nguồn; `uptime -s` = 2026-11-22 14:31:01; journal first entry 14:31:13Z). Đợt mở 14:35:51Z = boot+290s; T9 nhận việc ~14:43Z; sampler khởi động 14:44:27Z (boot+806s); probe mở 14:44:47Z (boot+826s) đã là 0, 0. ENOSPC đầu tiên trên #80 lúc 14:36:14Z (boot+313s) — SAU khi đợt mở 23 s. T9 ghi đúng mốc đo, không claim cửa sổ có mở hay không (chỉ biết: nếu có mở thì đã đóng trước boot+313s). **Cùng mẫu đợt 170: lần này cửa sổ không thể quan sát được theo cấu trúc** — reboot xảy ra trước khi đợt mở 4m50s, T9 không có mặt trong cửa sổ boot+60–200s bằng bất cứ cách nào (xem F-171-T9-1). **Khoảng mù giữa hai đợt 3.980 s (13:38:07Z → 14:44:27Z)** — sampler đợt 170 dừng lúc đóng (13:38:07Z); sampler đợt 171 khởi động 14:44:27Z. Trong 3.980 s này có 1 reboot (#80 14:31:01Z) — E-174 đã kết thúc trong khoảng mù (xem §2.2); cửa sổ thoáng của #80 (nếu có, ~14:32–14:34Z) đã đóng trước khi T9 mở.
- **Headroom cuối phiên: 0 (cặp đóng 16:44:42Z, chênh 0).** ENOSPC trên #80 tăng đều +26 dòng mỗi 30 phút suốt phiên (xem §4) trong khi headroom giữ 0 — bảng watch cạn hoàn toàn, không có slot trống nào suốt 2 giờ. Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 0 = **63.747 watch** trên #80 (toàn bộ trần đã bị giữ).
- **TOÀN-0 (MỚI — xem F-171-T9-2):** lần đầu tiên kể từ đợt 159 cả 12 lần đo hợp lệ đều 0 (đợt 159: 8/10 lần 0 + 2 lần thoáng 23.503/18.447; đợt 160–170 đều có ít nhất một lần đo ≥1). Không có dao động như đợt 170 (0→2→0→2) — đợt này sàn 0 tuyệt đối, không một lần nào nhả được slot.
- **So sánh với đợt 170:** đợt 170 mở 0 trên #79 → dao động 0→2→0→2 → đóng 2 (12 lần đo, 4 lần 0, 8 lần 2). Đợt này KHÔNG reboot giữa phiên, mở 0 trên #80 → 0 suốt phiên → đóng 0 (12 lần đo, 12 lần 0). **Không lần nào chạm CAP 30.000 đợt này** (đợt 170: 0 lần chạm CAP; đợt 169: 0 lần; đợt 168: 0 lần; đợt 167: đỉnh cửa sổ 14.072, không chạm CAP; đợt 163–166: chạm CAP mỗi đợt).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** — một vite mới (~1.578 watch) không khởi động được (như mọi đợt từ 152).
- T5-171 KHÔNG probe lại headroom đợt này (như đợt 151–170) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 12 lần đo hợp lệ + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #80 đợt này có 111 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #80 suốt 12 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.
- Lưu ý: RAM lúc đóng (463.156 kB — mẫu ghim E-175) THẤP hơn RAM lúc mở (781.864 kB — mẫu đầu #80) trong khi headroom 0 → 0. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop chạy đủ 4 lan (lan-2 15:14:27Z, lan-3 15:44:27Z, lan-4 16:14:27Z, lan-5 16:44:27Z) rồi kết thúc bình thường ("probe-loop done 16:44:27Z"); cặp probe đóng 16:44:42Z do T9 đo tay ngay sau đó.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–170 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **171** | **0 → 0 (toàn-0)** | **mở 14:44:47Z boot #80 2acdd1ab btime 14:31:01Z (trần 63.747): 0 ×12 (14:44:47–16:44:42Z) → đóng 16:44:42Z cùng boot #80: 0, 0 (KHÔNG reboot giữa phiên; reboot #80 TRƯỚC khi đợt mở 4m50s; 12 lần đo hợp lệ, 12 lần 0; KHÔNG lần nào chạm CAP)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 6 → 0 → 2 → 2 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 0** (đợt 170 đóng 2; đợt 169 đóng 2; đợt 168 đóng 2; đợt 167 đóng 0). Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ ba mươi mốt liên tiếp** (tính theo giá trị ổn định lúc đóng; đợt này giá trị toàn-0 trong phiên, không dao động). Quyết parent đợt 168 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal boot #80 đợt này có 111 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ hai mươi liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng; đợt 165: ≥64 dòng; đợt 166: ≥56 dòng; đợt 167: ≥76 dòng; đợt 168: ≥102 dòng — T9 đếm trực tiếp; đợt 169: ≥54 dòng — T9 đếm trực tiếp; đợt 170: 39 dòng — T9 đếm trực tiếp; đợt 171: **111 dòng — T9 đếm trực tiếp, xem §4**). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #80 suốt 12 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên #80; swap 1.048.572 kB) — sampler 121 mẫu, 14:44:27Z–16:44:30Z, MỘT boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở cả mẫu đầu và lúc đóng trên #80 (mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: mở phiên balloon 94% trần + bão spike T1/T4/O8 (load1 tới 9,06) → attempt1/attempt2 NHIỄM → balloon XẢ SÂU NHẤT (544.840 kB, RAM 6.209.324 kB = 98,69% guard) ngay sau attempt3 hợp lệ → O8 PASS 3/3 → harness WebKit 0/3, 3 kẹt thật (RAM trũng 296.796 kB trong lúc kẹt 85m4) → balloon leo lại tới trần → E-175 ghim 7 mẫu tới lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log đóng băng 61 s; 0 gap >90 s** — xem §5.1). **121 mẫu, 14:44:27Z–16:44:30Z, MỘT boot (#80: 121 mẫu).** Tổng quan: **min 296.796 kB (289,8 MiB) lúc 16:00:29Z** (trong lúc kẹt 85m4); **max 6.209.324 kB (6.062,8 MiB) lúc 15:12:28Z — 98,69% guard** (balloon xả 544.840 kB, thấp nhất phiên); **mean toàn phiên 1.377.347,3 kB (1.345,1 MiB) — tính bằng 3 cách (python + awk 1.377.347,3 + trung bình có trọng số) KHỚP NHAU (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 14:44:27–14:49:28Z | #80 | 774.920–1.528.716 kB | Mở phiên: balloon 6.055.332 kB (94,0% trần) lúc 14:44:27Z, dao động 5.232.124–6.136.112 kB trong giai đoạn; **0 mẫu ghim**; **1 spike B2** (14:47:57Z load1 dư — xem §2.5); T1 verify suite đang chạy (binOrphan60Q7.test.ts); gate A MỞ 2/6 mẫu; load1 0,57–2,69 |
| 14:50:04–15:06:12Z | #80 | 964.816–3.319.728 kB | **T4 attempt1 (14:50:04–14:53:50Z) + attempt2 (15:02:43–15:06:12Z) — CẢ HAI NHIỄM TẢI, lớp B vi phạm (xem §2.3)**; **9 spike B2** (14:53:02–14:58:17Z — T1 ffmpeg testsrc2 + T4 analyze + T8/T0 O8 setup; load1 tới 9,06); balloon 3.395.108–5.159.756 kB; gate A MỞ 13/16 mẫu; load1 max sampler **9,03 lúc 14:54:27Z** |
| 15:07:28–15:12:28Z | #80 | 2.534.412–6.209.324 kB | **T4 attempt3 HỢP LỆ (15:08:10–15:11:32Z — xem §2.3)**; **RAM max phiên 6.209.324 kB lúc 15:12:28Z** (98,69% guard — balloon xả sâu nhất phiên 544.840 kB, 8,5% trần); gate A MỞ 6/6 mẫu; **0 spike B2 trong cửa sổ attempt3**; load1 1,36–3,04 |
| 15:13:28–15:36:33Z | #80 | 705.676–5.936.256 kB | Balloon leo lại 806.984 → 6.027.440 kB; **O8 PASS 3/3 (15:33:56–15:36:33Z — xem §2.4)**; **0 spike B2 trong cửa sổ O8**; gate A MỞ 19/24 mẫu; load1 0,05–3,03 |
| 15:37:33–16:31:28Z | #80 | 296.796–1.685.504 kB | **Harness WebKit 0/3 + Chromium 3/3 — 3 KẸT THẬT (xem §2.4)**; RAM trũng sâu nhất phiên 296.796 kB lúc 16:00:29Z (trong lúc kẹt 85m4); balloon leo 5.038.788 → 6.178.620 kB; **0 spike B2 trong cửa sổ harness**; gate A MỞ 1/53 mẫu; load1 0,02–2,14 |
| 16:32:30–16:44:30Z | #80 | 451.588–1.088.720 kB | Balloon leo lên trần lúc 16:38:30Z; **E-175: 1 chuỗi ghim 16:38:30–16:44:30Z (7 mẫu), ĐANG GHIM lúc đóng** (xem §2.2); **0 spike B2**; gate A MỞ 1/13 mẫu trong giai đoạn (16:32:30Z 1.088.720 kB — trước khi ghim); load1 0,08–0,31 |

- **Gate A ≥1024 MiB: 45/121 mẫu** (2+13+6+19+1+1 theo 6 giai đoạn = 42, cộng 3 mẫu nằm giữa các giai đoạn — 15:06:28Z 1.481.484 kB, 15:37:28Z 1.469.736 kB, 16:31:30Z 1.312.036 kB — cả 3 đều MỞ — khớp tổng 45); **0 mẫu ≥ guard**; load1 max (sampler) **9,03 lúc 14:54:27Z** (watcher bắt 9,06 lúc 14:54:50Z — khớp, khác cadence); **9/121 mẫu load1 ≥3,0** (6 mẫu trong cụm spike 14:53:27–14:58:28Z + 1 mẫu trong cửa sổ attempt2 15:04:28Z 3,79 + 1 mẫu trong cửa sổ attempt3 15:09:28Z 3,04 + 1 mẫu cuối cửa sổ O8 15:36:28Z 3,03; 0 mẫu sau 15:36:28Z). **RAM <512.000 kB: 34 mẫu** (28,1% — thấp hơn đợt 170: 37,2%, vì đợt này ghim chỉ 7 mẫu cuối phiên: 7/7 mẫu ghim dưới 512.000 kB + 27 mẫu trong harness/lúc kẹt); **RAM <300.000 kB: 1 mẫu** (16:00:29Z 296.796 kB — trong lúc kẹt 85m4; đợt 170: 2 mẫu; đợt 166–169: 0 mẫu).
- Swap: SwapFree 749.928 kB (mẫu đầu) → 562.096 kB (thấp nhất phiên, lúc 16:24:30Z — trong span leo balloon sau harness) → 672.000 kB (mẫu cuối, 16:44:30Z). Nhịp nhảy SwapFree trong phiên: không có reboot nên không có nhảy qua reboot (đợt 170: không nhảy qua reboot; đợt 169: nhả ~338.940 kB qua reboot #78).
- Mẫu 15:12:28Z (đỉnh phiên): RAM 6.209.324 kB, balloon xả 544.840 kB — balloon xả sâu nhất phiên đúng 28 s sau khi attempt3 kết thúc (15:12:00Z) và đúng lúc T4 bắt đầu phân tích attempt3. T9 ghi đúng số đo, không phán cơ chế (balloon xả là quyết định của host, ngoài tầm cell).
- Trũng RAM đợt này: min 296.796 kB (đợt 170: 263.132 kB; đợt 169: 437.868 kB; đợt 168: 414.364 kB; đợt 167: 383.116 kB; đợt 166: 372.732 kB; đợt 165: 248.768 kB; đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — **trũng NÔNG hơn đợt 170 đúng 33.664 kB** (296.796 − 263.132), **sâu thứ hai kể từ đợt 165**. 34 mẫu <512.000 kB trong 121 mẫu (28,1%); riêng trong span E-175 (7 mẫu ghim): **7/7 mẫu <512.000 kB (100%)**; trong span harness (53 mẫu): 27/53 mẫu <512.000 kB (50,9%).

**Bảng tổng hợp số RAM (từ script `t9-171-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 121 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #80 2acdd1ab | 121 | 296.796 | 6.209.324 | 1.377.347,3 | 45/121 | 7 | 9,03 | 34 |
| **Toàn phiên** | **121** | **296.796** | **6.209.324** | **1.377.347,3** | **45/121** | **7/121 (5,8%)** | **9,03** | **34** |

- **Mean toàn phiên 1.377.347,3 kB — tính bằng 3 cách độc lập: python `sum/n = 1.377.347,3` VÀ awk `sum/n = 1.377.347,3` VÀ trung bình có trọng số (một boot nên trùng python) — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163).
- 34 mẫu RAM <512.000 kB (từ script analyze trên log đóng băng — không tính tay): 27 mẫu trong span harness 15:38:07–16:31:28Z (6 mẫu trong lúc kẹt 84l10 + 11 mẫu trong lúc kẹt 85m4 — trong đó 1 mẫu <300.000 kB lúc 16:00:29Z — + 10 mẫu trong lúc kẹt 86n2) + 7 mẫu ghim E-175 (16:38:30–16:44:30Z). Tổng 27 + 7 = 34 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-174 KẾT THÚC trong khoảng mù (GIỮ 47 mẫu) + E-175 MỚI (7 mẫu, 1 chuỗi, 0 sag, ĐANG GHIM lúc đóng)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #80 (2acdd1ab): GHIM TRẦN 7/121 mẫu (5,8%), trong 1 chuỗi — 1 EPISODE MỚI (E-175).**
  - Leo lên trần trên boot #80: từ 14:44:27Z (6.055.332 kB, 94,0% trần) xả xuống 544.840 kB (8,5% trần) lúc 15:12:28Z rồi leo lại tới ghim lúc 16:38:30Z trong ~86 phút.
  - **E-175 — chuỗi duy nhất: 16:38:30–16:44:30Z, 7 mẫu** (RAM 451.588–489.520 kB; gate A ĐÓNG cả 7 mẫu). Mẫu ngay trước chuỗi (16:37:30Z): balloon 6.366.800 kB (98,8% trần), RAM 574.484 kB — leo đơn điệu 5.617.272 kB (16:31:30Z) → 6.443.824 kB (16:38:30Z) trong 7 phút, không có sag nào trước khi ghim.
  - **E-175 ĐANG GHIM lúc đóng — kết cục thuộc đợt sau (T9-172).** T9 không claim E-175 sẽ kéo dài bao lâu hay đứt lúc nào.
  - **Tổng E-175 tới lúc đóng: 7 mẫu ghim / 1 chuỗi / 0 sag / 1 boot (#80).**
- **E-174 — KẾT CỤC: GIỮ 47 mẫu, KHÔNG cộng thêm.** E-174 ghim cuối 13:38:07Z trên #79 (đợt 170); khoảng mù giữa hai đợt **3.980 s (13:38:07Z → 14:44:27Z)** có **MỘT reboot (#80 btime 14:31:01Z)**. Balloon trên #80 lúc T9 mở (14:44:27Z) đã 6.055.332 kB (94,0% trần) và **KHÔNG chạm trần lần nào cho tới 16:38:30Z** — E-174 đã kết thúc trong khoảng mù (xem §2.2 đợt 170: E-174 đang ghim lúc đóng đợt 170). Thời điểm đứt thật nằm trong (13:38:07Z, 14:44:27Z] — T9 không claim cụ thể.
- **Tổng ghim trần đợt này: 7/121 mẫu (5,8%)** (đợt 170: 47/121 = 38,8%; đợt 169: 60/132 = 45,5%; đợt 168: 60/135 = 44,4%; đợt 167: 20/128 = 15,6%; đợt 166: 55/123 = 44,7%; đợt 165: 58/134 = 43,3%; đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **Tỉ lệ ghim THẤP NHẤT kể từ đợt 167 (15,6%)** — vì balloon xả sâu giữa phiên (tới 8,5% trần) và chỉ leo lại tới trần ở 6 phút cuối. **1 episode mới trong đợt 171 (E-175: 7 mẫu, 1 chuỗi, 0 sag, đang ghim)** + E-174 GIỮ 47 mẫu (kết thúc trong khoảng mù).
- **Phán theo quy tắc quyết (e)/(g) + mẫu T10-166 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-175 là 1 EPISODE MỚI (7 mẫu / 1 chuỗi / 0 sag)** — không có sag nên không có câu hỏi tách episode. E-175 khác E-174 ở chỗ bắt đầu muộn trong phiên (16:38:30Z, 6 phút trước khi đóng) sau một nhịp leo đơn điệu từ 5.617.272 kB, không phải tiếp nối E-174 (E-174 ở boot #79, đã kết thúc trong khoảng mù có reboot #80 xen giữa).
  - **Đợt 171 = 1 EPISODE GHIM MỚI (E-175: 7 mẫu, 1 chuỗi, 0 sag, đang ghim)** + E-174 GIỮ 47 mẫu (kết cục trong khoảng mù).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-175 chỉ ~451–489.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối chuỗi ghim E-175 (16:44:30Z): tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 472.216 kB (log thật).

### 2.3 Lượt yên WebKit #40 (T4, đợt 171) — CÓ LƯỢT HỢP LỆ Ở ATTEMPT3, CHUỖI LÊN 35 (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4; riêng F-171-T2-1 T9 phán ở F-171-T9-6)

- **T4-171 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND171_T4_WEBKIT_QUIET40_LIMITS.md`) + cờ `round171-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **#40 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 35 (34 → 35).**
- **Attempt1-2acdd1ab (14:50:04–14:53:50Z): probe 20/20 NHƯNG lớp B VI PHẠM (B1 + B2: load1 max 5,29 > 4) — NHIỄM TẢI, retry.** Attempt2-2acdd1ab (15:02:43–15:06:12Z): probe 20/20 NHƯNG lớp B VI PHẠM SÁT BIÊN (B2: load1 max 4,02 — chỉ +0,02 trên ngưỡng 4) — NHIỄM, retry. **Attempt3-2acdd1ab (15:08:10–15:11:32Z): probe 20/20, lớp B 5/5 ĐẠT, tickCost median 43,0 ms ≤ 60 — HỢP LỆ.** Poller thoát ~15:12:00Z vì ĐẠT. Ngân sách dùng 3/3. Không reboot trong phiên.
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1-#80: gate A MỞ **2/4 mẫu** trong cửa sổ (14:50:27Z 1.012.600 — ĐÓNG; 14:51:27Z 1.047.516 — ĐÓNG, chỉ thiếu 1.060 kB; 14:52:27Z 1.549.452 — MỞ; 14:53:27Z 1.424.500 — MỞ); load1 0,75–4,95; **2 spike B2 trong cửa sổ attempt1** (14:53:02Z + 14:53:38Z — đều ffmpeg T1 suite, xem §2.5) — khớp verdict NHIỄM của T4.
  - Attempt2-#80: gate A MỞ **2/3 mẫu** trong cửa sổ (15:03:28Z 964.816 — ĐÓNG; 15:04:28Z 1.613.308 — MỞ; 15:05:28Z 1.563.108 — MỞ); load1 1,85–3,79; **2 spike B2 trong cửa sổ attempt2** (15:03:53Z WebKit probe T4 + 15:04:28Z t5-stats — xem §2.5) — khớp verdict NHIỄM SÁT BIÊN của T4.
  - Attempt3-#80: gate A MỞ **4/4 mẫu** trong cửa sổ (15:08:28Z 2.827.052; 15:09:28Z 2.534.412; 15:10:28Z 2.634.676; 15:11:28Z 3.365.336 — cả 4 đều ≥1024 MiB); load1 1,55–3,04; **0 spike B2 trong cửa sổ attempt3**; balloon trong cửa sổ attempt3: 3.181.512–3.637.180 kB (49,4–56,5% trần), **0 mẫu ghim**.
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cả 3 cửa sổ attempt** (khớp T4: attempt3 "RAM ≥1024: 17/17" poller).
  - **Load1 max trong cửa sổ attempt3: 3,04 — sampler T4 (n=100 dòng) VÀ sampler T9 độc lập KHỚP NHAU TỪNG SỐ** (xem F-171-T9-6: 3,04 này plausibly là đóng góp của script `m56-171.py` của T2 chồng lên cửa sổ — nhưng vẫn ≤ ngưỡng B2 = 4).
- **Cộng dồn (theo T4-171): chuỗi lượt yên hợp lệ LÊN 35.** T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- **F-170-T9-9 ĐÃ ĐƯỢC SỬA — wording T4 đợt này ĐÚNG (xem F-171-T9-7):** T4-171 dùng câu chữ mới "không chạy script nào trong lúc probe pass chạy" (§0b + F-171-T4-5); 9/10 file output analyze attempt3 có mtime 15:11:36–15:12:00Z — 4 s SAU khi pass cuối kết thúc (15:11:32Z), không chồng lấn pass nào; p1p3p7.txt mtime 15:17:17Z (sau cửa sổ). T9 kiểm tra độc lập bằng stat + B2 (0 spike trong cửa sổ attempt3).
- T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu. B4 attempt3: dpkg delta 0 theo T4 — baseline đã gồm replay #80 (dpkg 1545; replay xong trước khi T4 mở — xem §5.2).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 / O8 / harness (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| Attempt1 14:50:04–14:53:50Z | #80 | 0,75–4,95 (4 mẫu) | 1.012.600–1.549.452 kB — **gate A MỞ 2/4** | T4 attempt1 — **2 spike B2 trong cửa sổ** (ffmpeg T1 suite); attempt1 NHIỄM (B1+B2 vi phạm) |
| Attempt2 15:02:43–15:06:12Z | #80 | 1,85–3,79 (3 mẫu) | 964.816–1.613.308 kB — **gate A MỞ 2/3** | T4 attempt2 — **2 spike B2 trong cửa sổ** (WebKit probe T4 + t5-stats); attempt2 NHIỄM SÁT BIÊN (B2 4,02) |
| Attempt3 15:08:10–15:11:32Z | #80 | 1,55–3,04 (4 mẫu) | 2.534.412–3.365.336 kB — **gate A MỞ 4/4** | T4 attempt3 — **0 spike B2 trong cửa sổ**; attempt3 HỢP LỆ (lớp B 5/5 + tickCost median 43,0) |
| O8 15:33:56–15:36:33Z | #80 | 1,44–3,03 (3 mẫu) | 705.676–1.112.424 kB — **gate A MỞ 1/3** | T8 O8 — **0 spike B2 trong cửa sổ**; O8 PASS 3/3 |
| Harness 15:38:07–16:31:28Z | #80 | 0,02–2,14 (53 mẫu) | 296.796–1.685.504 kB — **gate A MỞ 1/53** | T8 harness — **0 spike B2 trong cửa sổ**; harness WebKit 0/3 + Chromium 3/3, 3 kẹt thật (xem dưới) |
| Kẹt 84l10 15:38:11–15:53:12Z | #80 | 0,02–1,28 (15 mẫu) | 350.508–910.304 kB — **gate A MỞ 0/15** | T8 kẹt thật WebKit 84l10 W2-setup runEngine:425 — **0 spike B2 trong cửa sổ kẹt**; balloon 5.331.276–6.068.844 kB; load1 max 1,28 — kẹt xảy ra khi tải THẤP |
| Kẹt 85m4 15:53:27–16:08:34Z | #80 | 0,06–1,43 (16 mẫu) | 296.796–846.256 kB — **gate A MỞ 0/16** | T8 kẹt thật WebKit 85m4 P4-lần1 waitForPlaySync — **0 spike B2 trong cửa sổ kẹt**; RAM min phiên 296.796 kB @16:00:29Z trong cửa sổ này; balloon 5.671.120–6.178.620 kB; **(1c') BỎ LỠ kẹt này (F-171-T8-7)** |
| Kẹt 86n2 16:08:49–16:23:51Z | #80 | 0,03–2,14 (15 mẫu) | 321.332–767.468 kB — **gate A MỞ 0/15** | T8 kẹt thật WebKit 86n2 P4-lần3 waitForPlaySync (điểm kẹt đợt 165 TÁI DIỄN) — **0 spike B2 trong cửa sổ kẹt**; balloon 5.471.152–6.099.668 kB |

### 2.5 B2 — 12 spike THẬT, 11/12 QUY ĐƯỢC DRIVER CỤ THỂ, 1 load1 dư (2 spike TRONG attempt1 + 2 spike TRONG attempt2 — khớp verdict NHIỄM của T4; 0 spike trong attempt3/O8/harness; 0 spike trong span ghim E-175)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-171-T9-8). **12 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 12, `grep '=== SPIKE'` không neo cũng = 12 — KHÔNG lặp F-166-T9-3): 1 spike mở phiên (14:47:57Z, load1 dư); 9 spike cụm 14:53:02–14:58:17Z (T1 suite + T4 analyze + T8/T0 O8 setup); 2 spike trong cửa sổ attempt2 (15:03:53–15:04:28Z); 0 spike sau 15:04:28Z tới đóng; 0 spike trong span ghim E-175 (16:38:30–16:44:30Z, 7 mẫu).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — mở phiên (1 spike) | 14:47:57Z | 3,33 | 1 | **load1 dư** (xem dưới) | Đuôi load-average của burst T1 suite (node binOrphan60Q7.test.ts delta 0 — đã thoát trước snapshot); hatch daemon delta 13 là lớn nhất |
| 2 — cụm T1/T4/O8 (9 spike) | 14:53:02–14:58:17Z | 3,46 → 9,06 → 3,27 | 9 | 14:53:02Z: ffmpeg testsrc2 854x480 **delta-miss** (127,3% tức thời); 14:53:38Z: ffmpeg testsrc2 1920x1080 delta **133**; 14:54:14Z: ffmpeg delta **92** + T4 analyze labellag delta 24 + O8 vite 14 + MiniBrowser 7; 14:54:50Z: WebKitWebProcess delta **32** + T4 analyze lag5 delta **33** + MiniBrowser 19; 14:55:25Z: WebKitWebProcess delta **62** + MiniBrowser 18 + find delta 12 + blind9696 delta 14 + daemon 34; 14:56:01Z: WebKitWebProcess delta **49** + MiniBrowser 54 + blind 9; 14:56:36Z: Chromium renderer delta **28** + chrome delta 27 (T0 O8 Chromium) + vite 15; 14:57:12Z: Chromium renderer delta **54** (T0 O8 Chromium); 14:58:17Z: python3 t5-stats-171.py delta **75** + hatch daemon delta 70 | **Cụm tải mở đợt 171: T1 verify suite (ffmpeg testsrc2/pixelate) + T4 analyze attempt1 + T8/T0 O8 setup (WebKit + Chromium) + T2 blind-investigate + T5 stats** — nhiều luồng mở cùng lúc trên boot #80. Load1 max đợt (sampler) **9,03 lúc 14:54:27Z** (watcher bắt 9,06 lúc 14:54:50Z). **2 spike TRONG cửa sổ attempt1** (14:53:02Z + 14:53:38Z — đều ffmpeg T1) → attempt1 NHIỄM (khớp T4) |
| 3 — trong cửa sổ attempt2 (2 spike) | 15:03:53–15:04:28Z | 3,44 → 3,79 | 2 | 15:03:53Z: WebKitWebProcess delta **68** + MiniBrowser 21 (T4 attempt2 probe) + t5-stats 9; 15:04:28Z: python3 t5-stats-171.py delta **78** + hatch daemon 68 (T4 attempt2 probe node delta 0) | **2 spike trong cửa sổ attempt2** — 1 do chính probe của T4, 1 do script stats của T5 → attempt2 NHIỄM SÁT BIÊN (khớp T4: B2 4,02) |

- **Tổng kết đếm: 11/12 spike có driver process cụ thể + 1 spike lớp "load1 dư"** (đợt 170: 18/19 quy được + 1 load1 dư; đợt 169: 9/9 quy được + 0 load1 dư; đợt 168: 12/15 quy được + 3 load1 dư; đợt 167: 16/22 quy được + 6 load1 dư; đợt 166: 13/16 quy được + 3 load1 dư; đợt 165: 15/18 quy được + 3 load1 dư; đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư). Đợt này tỉ lệ load1 dư 1/12 = 8,3%.
- **Spike load1 dư duy nhất — 14:47:57Z (load1 3,33):** top -b tức thời chỉ có hatch daemon 0,0% + mọi process 0,0%; CPU 60,5% idle; delta lớn nhất 13 tick (daemon); node test binOrphan60Q7.test.ts delta 0; D-state 0; nr_running 3/463. Đây là **đuôi load-average của burst T1 suite** (node test đã thoát trước snapshot nhưng load1 (trung bình trượt 1 phút) vẫn 3,33). T9 quy lớp load1 dư, không gán driver giả.
- **Caveat đếm (F-171-T9-8):** 2 spike delta-miss (spike 14:53:02Z: ffmpeg 32137; spike 14:54:50Z: ffmpeg 35741 — dòng delta in ra THIẾU pid này, chỉ có 4 dòng delta thay vì 5) — quy driver bằng ps-top tích lũy + top -b tức thời (ffmpeg 127,3% / 50,0%), như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164), F-165-T9-6 (2 spike đợt 165), F-166-T9-6 (4 spike đợt 166), F-167-T9-6 (6 spike đợt 167), F-168-T9-10 (1 spike đợt 168), F-169-T9-5 (4 pid / 3 spike đợt 169) và F-170-T9-5 (6 spike đợt 170). Đợt này 2 spike delta-miss — ít nhất kể từ đợt 164 (1 spike), vì replay #80 xong nhanh trước khi T9 mở (không có replay apt host-side trong phiên — khác đợt 170: 6 spike delta-miss do replay apt). `grep -c 'WebKit\|MiniBrowser'` = **28 dòng** (nhiều spike O8 WebKit: 14:54:14Z, 14:54:50Z, 14:55:25Z, 14:56:01Z, 15:03:53Z).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: 2 spike (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 11 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 11/12 spike — 1 spike lớp load1 dư đợt này.
- **Delta tick lớn nhất đợt: 133 tick/s** (ffmpeg testsrc2 1920x1080 geq, spike 14:53:38Z, load1 4,97). (Đợt 170: max 119 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 14:44:xxZ CÙNG lúc sampler — **0 khoảng mù đầu phiên đợt này** (spike đầu tiên watcher bắt được là 14:47:57Z, ~3 phút sau khi mở — trước đó load1 < 3,0; sampler load1 lúc mở 0,57). **KHÔNG có reboot giữa phiên nên KHÔNG có khoảng mù qua reboot** (khác đợt 169: gap 109 s qua reboot #78). **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg/testsrc2/pixelate xuất hiện trong 3 spike của cụm mở đợt** (testsrc2 854x480 + 1920x1080 geq + rawvideo pixelate probe — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 2 spike delta-miss — xem §2.5). **T4 analyze (labellag/lag5) xuất hiện trong 2 spike** (14:54:14Z delta 24; 14:54:50Z delta 33 — phân tích attempt1, chạy SAU khi attempt1 kết thúc 14:53:50Z). **T8/T0 O8 WebKit/Chromium xuất hiện trong 5 spike** (14:54:14–14:57:12Z — O8 setup + T0 O8 driver; T8 O8 chính thức 15:33:56–15:36:33Z có 0 spike — xem §2.4). **T2 blind9696-investigate.py xuất hiện trong 3 spike** (14:54:14Z; 14:55:25Z delta 14; 14:56:01Z delta 9 — điều tra mù, chỉ là tải phụ) + **find quét goals trong 1 spike** (14:55:25Z delta 12). **T5 t5-stats-171.py xuất hiện trong 3 spike** (14:58:17Z delta 75; 15:03:53Z delta 9; 15:04:28Z delta 78 — stats định kỳ của T5). **T1 tsc/binOrphan xuất hiện trong 1 spike load1 dư** (14:47:57Z — đuôi burst). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T4 analyze/probe + T2 điều tra/quét + T5 stats + T8/T0 O8 + hatch daemon; **28 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log — 5 spike, đã quy driver ở §2.5**).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ hai mươi lăm liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round171-t9/sampler.sh` chạy liên tục 14:44:27Z–16:44:30Z (1 instance, sống suốt phiên — KHÔNG chết theo reboot vì không có reboot giữa phiên), **121 mẫu, gap trong log đóng băng lớn nhất 61 s, 0 gap >90 s**; các gap còn lại max 61 s (đợt 170: max 61 s; đợt 169: gap 109 s qua reboot #78; đợt 168: gap 55 s qua reboot #76; đợt 167: gap 77 s qua reboot #74; đợt 166: gap 73 s qua reboot #71; đợt 165: gap 35 s qua reboot #70; đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **6.209.324 kB = 98,69% guard** (đợt 170: 54,25%; đợt 169: 49,84%; đợt 168: 52,03%; đợt 167: 40,10% — thấp nhất chuỗi; đợt 166: 69,93%; đợt 165: 58,05%; đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). Khoảng cách tới guard lúc đỉnh: **82.132 kB (1,31%)** — **SÁT NHẤT TỪ TRƯỚC TỚI NAY** (kỷ lục cũ 69,93% đợt 166, cách guard 1.891.000 kB). **Caveat (xem F-171-T9-4): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 171 — lần thứ hai mươi lăm liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0; đợt 166: 0; đợt 167: 0; đợt 168: 0; đợt 169: 0; đợt 170: 0; đợt 171: 0). **Chuỗi 0 lần thử: 25 đợt liên tiếp** (đợt 147–171).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 25 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round171-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `/usr/bin/python3.12` — giống đợt 170); `bgremove.py` **23.500 B** (không đổi so với đợt 170); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-171-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt.**
- **Không cần chạy lại birefnet trong đợt 171** (không mẫu nào đạt guard; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (boot #80 = 111 dòng; tổng 111 dòng, toàn bộ thuộc về đợt 171 — đợt thứ hai mươi liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#80** (2acdd1ab, btime 14:31:01Z): **111 dòng** (T9 đếm trực tiếp từ journal lúc đóng phiên; **không cộng số ước** — chỉ có một boot trong journal, `journalctl --list-boots` lúc đóng chỉ còn #80). Dòng đầu tiên trên #80: **14:36:14Z (boot+313s)** — SAU khi đợt mở 14:35:51Z đúng 23 s; dòng thứ hai 14:37:33Z. Dòng cuối cùng lúc đóng: **16:43:53Z** — 49 s trước cặp probe đóng (16:44:42Z).
- Nhịp đều bất thường (xem F-171-T9-5): 7 dòng lúc probe mở 14:44:47Z → 33 dòng lúc lan-2 15:14:27Z (+26 dòng, dòng cuối 15:14:03Z) → 59 dòng lúc lan-3 15:44:27Z (+26 dòng, dòng cuối 15:43:53Z) → 85 dòng lúc lan-4 16:14:27Z (+26 dòng, dòng cuối 16:14:03Z) → 111 dòng lúc lan-5 16:44:27Z (+26 dòng, dòng cuối 16:43:53Z) → 111 dòng lúc đóng 16:44:42Z (+0 dòng trong 15 s cuối). **ENOSPC tăng đúng +26 dòng mỗi khoảng 30 phút, 4 khoảng liên tiếp** — đều như đồng hồ (T9 ghi tương quan, không phán cơ chế — systemd retry theo chu kỳ cố định là giả thuyết, không phải kết luận).
- **Tổng đợt 171: 111 dòng đếm được — toàn bộ thuộc về đợt 171** (dòng đầu tiên 14:36:14Z đã SAU khi đợt mở 14:35:51Z; 0 dòng thuộc về khoảng trước khi đợt mở). **Không phải cận dưới theo nghĩa mất journal** (chỉ một boot, journal còn nguyên từ 14:31:13Z) — nhưng vẫn là số đếm được tại các mốc kiểm tra, không phải số tuyệt đối nếu journal xoay (T9 ghi rõ để T10 không đọc nhầm thành "chắc chắn chỉ có 111 dòng").
- **Journal vẫn tăng SAU khi T9 đóng:** kiểm lại 16:47Z (sau cặp probe đóng 16:44:42Z): **113 dòng, dòng cuối 16:46:03Z** — 2 dòng mới sau khi T9 đóng. 2 dòng này KHÔNG tính vào số đóng băng 111 (thuộc về sau phiên T9); T10 đếm lại từ journal sẽ thấy 113 — chênh 2 là do mốc đếm, không phải sai số (xem F-171-T9-5).
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 170: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 170:** đợt 170 có 39 dòng (boot #79 duy nhất). Đợt này **111 dòng** — cao hơn đợt 170 đúng 72 dòng, vì headroom toàn-0 suốt phiên (đợt 170 headroom về 2 và giữ 2 nên ENOSPC dừng sau 12:40:43Z; đợt này headroom 0 suốt nên ENOSPC tăng đều tới đóng). Đợt này là đợt có ENOSPC đếm được CAO NHẤT kể từ đợt 159 (đợt 159 ghi ≥134 dòng — cận dưới; đợt 155: ≥133; đợt 162: 132 — T10 đếm lại; đợt 157: ≥106; đợt 168: ≥102; đợt 153: ≥102).
- **Đối chiếu T5-171:** T5-171 ghi "ENOSPC #80: 19 dòng lúc stats 14:57:42Z" — số 19 là số đếm tại thời điểm T5 kiểm tra (giữa lan-2 33 dòng lúc 15:14:27Z và probe mở 7 dòng lúc 14:44:47Z — khớp nhịp +26/30 phút: 7 dòng lúc 14:44:47Z → ~19 dòng lúc 14:57:42Z → 33 dòng lúc 15:14:27Z); số đóng băng của T9 là 111 dòng. Không mâu thuẫn — chỉ khác mốc đếm.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #80 — 1 reboot TRƯỚC KHI đợt mở, 0 reboot giữa phiên (KHÁC đợt 169: 2 reboot; GIỐNG đợt 170: 1 reboot trước khi đợt mở)

- **Reboot #80 (2acdd1ab, btime 14:31:01Z; gap #79→#80 = 11.996 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ 4m50s** (đợt mở 14:35:51Z, boot+290s). T0-171 xác minh 9/9 nguồn; T2-171 xác minh 8 nguồn; số hiệu #80 theo đếm tuần tự — parent xác nhận. **KHÔNG có reboot giữa phiên đợt 171** — sampler + watcher + probe-loop **SỐNG SUỐT PHIÊN** (không chết theo reboot — lần thứ hai liên tiếp kể từ đợt 170 không có reboot giữa phiên làm chết loop; điểm yếu (d) đợt 148 KHÔNG tái diễn đợt này).
- **0 gap >90 s trong log đóng băng (max 61 s)** — gap lớn nhất 61,0 s (15:14:27Z → 15:15:28Z và 16:02:29Z → 16:03:30Z — T9 không liệt kê tay từng gap, số max từ script analyze). Lần thứ hai liên tiếp không có gap >90 s nào (đợt 170: max 61 s; đợt 169: 1 gap 109 s qua reboot #78).
- **Khoảng trống phủ sóng đầu phiên:** đợt mở 14:35:51Z (boot+290s), T9 nhận việc ~14:43Z (boot+~719s), sampler khởi động 14:44:27Z (boot+806s) — **gap 516 s từ lúc đợt mở tới khi sampler chạy** (đợt 170: gap 133 s; đợt 169: gap 388 s; đợt 168: gap 283 s; đợt 167: gap 162 s; đợt 166: gap 179 s; đợt 165: gap 1.760 s; đợt 164: gap 383 s; đợt 163: gap 113 s). Gap đầu phiên đợt này dài hơn đợt 170 (vì T9 nhận việc muộn hơn — subagent spawn 14:43:16Z) — nhưng vẫn đủ để cửa sổ thoáng (nếu có, ~boot+60–200s) đóng trước khi T9 mở (xem §1.2, F-171-T9-1).
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T7-171 đo 4 lần trong phiên: 14:44:30, 14:47:35, 15:13:27, 15:39:11Z — đều chênh ~1 s; T9 không đo lại).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T0-171 đếm 32 reboot #49–#80 — theo T0-171; T5-171 xác nhận marker còn, mtime 20/11 11:39:47Z không đổi).
- **X11 (T9 kiểm tra lúc đóng phiên 16:48Z):** `/tmp/.X11-unix/` **TRỐNG** (0 socket — T8-171 đã dọn X194/X195/X196 lúc 15:33:56Z sau khi xác minh mồ côi; socket của chính T8 driver tự unlink).

### 5.2 T5-171 (infra) — POSTBOOT_PASS #80 ĐÃ CÓ; watcher-171 ALIVE; replay #80 XONG NHANH NHẤT CHUỖI

- **POSTBOOT_PASS #80 ĐÃ CÓ lúc 14:52:09Z** (boot+41m08s — theo T5-171; replay-đầy-đủ, poll=0, verify độc lập exit 0; ledger 170/170 — T5 sở hữu số chi tiết).
- **POSTBOOT_PASS #79 vẫn có, còn hiệu lực. POSTBOOT_PASS #78 KHÔNG CÓ** (boot thứ 14 lọt — không bù được, theo T5-170).
- **Watcher-171: START 14:42:42Z? — T9 không trích số chi tiết (thuộc T5-171/T10); watcher-170 KẾT THÚC LẶNG TRƯỚC #80** (không có dòng END, pid đã mất — theo T2-171 F-171-T2-6; cách nói "chết theo #80" của T0-171 chưa chính xác — T9 chỉ ghi chú tham chiếu).
- **Replay #80 chạy nhanh nhất chuỗi:** installs ~2 phút, xong boot+402 s (14:37:43Z), dpkg 1545 dòng (theo T0-171). **Replay xong TRƯỚC khi T9 mở** — khác đợt 170 (replay #79 chạy trong phiên, là driver 5 spike B2): đợt này replay KHÔNG xuất hiện trong bất kỳ spike B2 nào (xem §2.5/§2.6 — 0 dòng nhắc apt-get/apt trong toàn bộ b2-spikes.log; T9 kiểm bằng grep: `grep -c apt-get b2-spikes-FROZEN.log` = 0).
- **F-171-T5-1 (nếu có — T9 không trích; thuộc T5-171/T10).**

### 5.3 T8-171 (vite harness + O8) — ĐÃ đóng cờ (~16:45Z); O8 PASS 3/3, ĐỀ XUẤT chuỗi LÊN 23; harness WebKit 0/3 + 3 KẸT THẬT

- **T8-171 ĐÃ xuất bản LIMITS + viết cờ `round171-t8.done`** — T9 chỉ đối chiếu bằng dữ kiện sampler + B2 độc lập, không phán thay T8.
- **O8 PASS 3/3 trên boot #80** (15:33:56–15:36:33Z — WebKit 21/21 ×2 + Chromium 21/21, exit 0/0/0): **0 spike B2 trong cửa sổ O8** (khác đợt 170: 3 spike trong cửa sổ O8 — đều do chính process trình duyệt của O8). **T8 đề xuất chuỗi WebKit FULL PASS LÊN 23 (22 → 23)** — vì lượt yên #40 hợp lệ ở attempt3 TRÊN BOOT ĐO #80 + O8 sau lượt hợp lệ TRÊN CÙNG BOOT #80 + gate (a) FOUND (poll 41 lúc 15:29:16Z) — chờ T10/parent phán. **Caveat lớn (T8 tự ghi): harness WebKit 0/3 (3 kẹt thật) — mức kẹt chưa từng có; T8 vẫn đề xuất theo đúng 3 điều kiện + tiền lệ 157, nhưng ghi rõ để parent cân nhắc.**
- **Đối chiếu sampler T9 trong cửa sổ O8 (15:33:56–15:36:33Z): 3 mẫu, gate A MỞ 1/3** (15:34:28Z 1.112.424 kB; 15:35:28Z 920.732 kB; 15:36:28Z 705.676 kB — chỉ 1 mẫu ≥1024 MiB), balloon 5.016.832–5.254.732 kB (77,9–81,5% trần, không ghim), load1 1,44–3,03 (sampler).
- **Harness WebKit 0/3 + Chromium 3/3 — 3 KẸT THẬT** (15:38:07–16:31:28Z): WebKit 84l10 exit 124 KẸT (15:38:11–15:53:12Z, W2-setup runEngine:425 — lần thứ 3 kẹt 84l10, **điều kiện mở điều tra riêng cho 84l10 ĐÃ ĐỦ theo quyết (i) đợt 170**); WebKit 85m4 exit 124 KẸT (15:53:27–16:08:34Z, P4-lần1 waitForPlaySync — chuỗi P4-lần3 PASS 11 lần DỨT); WebKit 86n2 exit 124 KẸT (16:08:49–16:23:51Z, P4-lần3 waitForPlaySync — điểm kẹt đợt 165 TÁI DIỄN sau 5 đợt sạch). Kẹt cộng dồn 17 → 20. Chuỗi "P3 không kẹt" vẫn 0. Đối chiếu sampler T9 trong cửa sổ harness: gate A MỞ 1/53; trong 3 cửa sổ kẹt: gate A MỞ 0/15 + 0/16 + 0/15, RAM min phiên 296.796 kB @16:00:29Z trong lúc kẹt 85m4, **0 spike B2** (xem §2.4).
- **(1c') (c') đã triển khai diag-only — 0 kích hoạt live, 0 FP, NHƯNG BỎ LỠ 1 kẹt thật 85m4** (T8-171 sở hữu; T9 không kiểm tra triển khai). Kẹt 85m4 P4-lần1 (đóng băng playhead=0.2, elapsed 5→816 s, 163 dòng, maxspan=811 s = 6,8× ngưỡng 120 s) KHÔNG kích hoạt vì toàn bộ 163 dòng đều có paused=true + seeking=true → điều kiện (f) chặn (F-171-T8-7). Watchdog (i) đã bắt được kẹt này (15:56:03Z) nên việc phát hiện không mất — nhưng kênh (c') mù đúng ca nó được thiết kế để bắt. **(c') ĐƯỢC GIỮ theo quyết (i) đợt 170 (không có FP → không cần quyết lại), NHƯNG T8 trình parent/T10 xem có sửa điều kiện (f) không** — T9 chỉ ghi chú tham chiếu (xem F-171-T9-10).
- **H3: VẪN MỞ, chỉ giám sát thụ động** (theo T8-171 — 3 kẹt mới cùng họ H3; điều kiện mở điều tra H3 theo quyết (i) đợt 158 vẫn KHÔNG đạt vì 85m4 P4-lần3 không có verdict — kẹt ở lần1). T9 đối chiếu: RAM rơi trong lúc kẹt NHƯNG T8-171 không báo RSS WebKit tăng trong lúc kẹt (T9 không trích số RSS — thuộc T8-171/T10); avail rơi do balloon host tăng (sampler T9: balloon 5.038.788 → 6.178.620 kB trong span harness).

### 5.4 T7-171 (scheduler) + T2-171 + T0-171 — T7 CHƯA đóng cờ lúc T9 đóng; run 170 SUCCEEDED, (m) #80 KHÔNG PHẢI ĐIỂM, INSIDE #79 → chuỗi dài 6 rồi ĐỨT tại #80

- **T7-171 CHƯA xuất bản LIMITS + CHƯA viết cờ `round171-t7.done` lúc T9 đóng (16:49Z)** — T9 chỉ đối chiếu bằng dữ kiện T0/T2 đã xuất bản + NOTES.md của T7, không phán thay T7. Theo T7 NOTES (đọc #5 ~16:25Z): run 171 vẫn RUNNING, started_at/claimed_at KHÔNG ĐỔI, 0 lần viết lại. Kết cục run 171 thuộc T7-171/T10.
- **Run 170 SUCCEEDED 14:21:03Z theo DB** (theo T2-171/T0-171/T7-171: wall gốc 9.912 s; margin 888 s tới hạn 14:35:51Z; claimed→finished 110 s — NGOÀI họ 6–11 s, ca thứ hai ≥100 s sau 108 s của run 167; 0 lần viết lại — lần đầu tiên kể từ đợt 166 không viết lại; 2 event); **#80 viết lại 0 lần run nào** (run 170 đã xong trước btime 598 s; run 171 dispatch sau btime 290,103 s).
- **(m) #80: KHÔNG PHẢI ĐIỂM** (theo T2-171, đối chiếu độc lập: 0 requeue trong cửa [14:31:01Z, 14:50:00Z] và cửa mở rộng [14:31:01Z, 15:00:00Z] (mọi job); 0 run sống tại btime (run 170 finished btime −598 s; run 171 dispatched btime +290,103 s). Chữ ký giống #52/#61/#67/#73/#75/#77 (btime rơi vào khoảng trống giữa hai run). **n không đổi vì #80.**
- **INSIDE (theo T2-171): #79 INSIDE dải FULL125** [09:40:47Z, 11:39:47Z] neo 09:14:38Z (biên dưới 5.418 s, biên trên 1.722 s) → **chuỗi MỚI từ #73 tiếp tục, dài 6.** Đối chiếu dải còn hiệu lực FULL124: NGOÀI (muộn 1.315 s) — cùng mẫu #71/#77. **#80 NGOÀI dải FULL126** [11:37:16Z, 13:37:32Z] neo 11:11:05Z (muộn 3.209 s) → **CHUỖI ĐỨT tại #80** (cả dải còn hiệu lực FULL125 cũng NGOÀI, muộn 10.274 s). **FULL123/FULL124 KIỂM LẠI ĐỘC LẬP: ĐẠT** (p10/p90 khớp T2-170 bằng hai cách tính mới + giá trị chuỗi — nợ F-170-T10-2 đã trả).
- **(m) #56 vẫn có điều kiện** (theo T2-171 — lần thứ mười bốn không thu hẹp được; T9 không trích số — thuộc T2-171/T10).
- **Mù #96? (theo T2-171 — T9 không trích số chi tiết):** cửa sổ tới B1 = 15:00:00Z; mù #88? VẪN MỞ (hole-recheck lần thứ 15: 337 hit, 0 mốc mới — y hệt lần 9–14); #95?/#94?/#77? giữ nguyên; CERT/FULL chính thức GIỮ 76/91.
- T7-171 đóng cờ sau T9 (nếu có) — T9 không chờ T7 (hạn cờ T9 ~17:00Z).

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc 16:49Z (8/9)** — T7 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T0-171:** reboot #80 xác minh 9/9 nguồn (btime 14:31:01Z, epoch 1795357861; gap #79→#80 = 11.996 s); marker sống qua 32 reboot #49–#80; **F-171-T0-6: T0 đồng ý (m) #80 "không phải ứng viên"**; T0-171 cũng chạy O8 độc lập PASS 3/3 trên boot #80 (xem §5.3). T9 không trích số khác — thuộc T0-171/T10.
- **T1-171:** verify đợt 170 (T9 không trích số — thuộc T1-171/T10).
- **T6-171:** prune lần 46 (T9 không trích số — thuộc T6-171/T10).
- **T4-171:** xem §2.3 (LIMITS đã xuất bản).
- **T2-171:** xem §5.4 (LIMITS đã xuất bản).

## 6. Sai số / caveat (F-171-T9-*)

- **F-171-T9-1 — Cửa sổ thoáng sau reboot KHÔNG quan sát được LẦN THỨ TƯ LIÊN TIẾP (đợt 168 + 169 + 170 + 171) — lần này KHÔNG THỂ quan sát được theo cấu trúc, không phải do T9 tới muộn trong phiên (dù T9 nhận việc muộn hơn đợt 170).** Reboot #80 btime 14:31:01Z; đợt mở 14:35:51Z = boot+290s (T9 nhận việc ~14:43Z, sampler 14:44:27Z = boot+806s, probe mở 14:44:47Z = boot+826s). ENOSPC đầu tiên 14:36:14Z = boot+313s (sau khi đợt mở 23 s). Nếu cửa sổ thoáng tồn tại thì nó nằm trong ~boot+60–200s (14:32–14:34Z) — trước khi đợt mở 2–4 phút; không một luồng nào của đợt 171 có mặt lúc đó. T9 ghi đúng mốc đo, không claim cửa sổ có mở hay không. Đây là dữ kiện mới (lần thứ hai liên tiếp reboot xảy ra TRƯỚC khi đợt mở), không phải lỗi đo. **Lưu ý:** gap đầu phiên đợt này dài (516 s từ lúc đợt mở tới khi sampler chạy, so với 133 s đợt 170) vì subagent T9 spawn muộn (14:43:16Z) — nhưng ngay cả khi T9 có mặt đúng lúc đợt mở (boot+290s) thì cửa sổ boot+60–200s cũng đã đóng; gap dài không đổi kết luận.
- **F-171-T9-2 — Headroom TOÀN-0 (12/12 lần đo đều 0) — lần đầu tiên kể từ đợt 159 không có lần đo nào ≥1.** Dãy đo: 0 ×12 (14:44:47–16:44:42Z). Đợt 159: 8/10 lần 0 + 2 lần thoáng 23.503/18.447 (sau reboot giữa phiên); đợt 160–170 đều có ít nhất một lần đo ≥1 (đợt 170: 8 lần 2 + dao động 0→2→0→2). Đợt này sàn 0 tuyệt đối, không một lần nào nhả được slot — bảng watch cạn hoàn toàn suốt 2 giờ, corroborate bằng ENOSPC tăng đều +26 dòng mỗi 30 phút (xem §4). T9 ghi đúng số đo, không phán cơ chế hay actor ngoài cell. Giá trị ĐÓNG vẫn là 0 → chuỗi dưới ngưỡng lên 31 (không đứt).
- **F-171-T9-3 — E-175 phán 1 EPISODE MỚI (7 mẫu / 1 chuỗi / 0 sag) — giao T10 xác nhận cách đếm.** E-175: 16:38:30–16:44:30Z, 7 mẫu ghim liên tiếp, không có sag nên không có câu hỏi tách episode. E-175 bắt đầu muộn trong phiên (6 phút trước khi đóng) sau nhịp leo đơn điệu 5.617.272 → 6.443.824 kB trong 7 phút (16:31:30–16:38:30Z); không phải tiếp nối E-174 (E-174 ở boot #79, đã kết thúc trong khoảng mù 3.980 s có reboot #80 xen giữa). Nếu T10/parent phán ngược (E-175 không tính là episode vì quá ngắn), tổng số episode đợt 171 đổi 1 → 0 nhưng tổng mẫu ghim 7 không đổi. **E-174 KẾT THÚC — GIỮ 47 mẫu** (đứt trong khoảng mù, không claim thời điểm cụ thể).
- **F-171-T9-4 — RAM ĐỈNH PHIÊN 98,69% GUARD — SÁT GUARD NHẤT TỪ TRƯỚC TỚI NAY, NHƯNG 0 MẪU ĐẠT GUARD.** Mẫu 15:12:28Z: RAM 6.209.324 kB, chỉ cách guard 82.132 kB (1,31%); balloon xả 544.840 kB (8,5% trần) — xả sâu nhất từng ghi. Kỷ lục cũ: 69,93% guard (đợt 166). **Caveat bắt buộc:** sampler cadence 60 s — một lần vượt guard dưới 60 s giữa hai mẫu liên tiếp KHÔNG loại trừ được (điểm yếu (a) đợt 147). Mẫu trước đỉnh (15:11:28Z): 2.827.052 kB; mẫu sau đỉnh (15:13:28Z): 5.936.256 kB — đỉnh là một mẫu đơn lẻ, RAM rơi 1.273.068 kB trong 60 s sau đó; không có mẫu nào khác trên 6.000.000 kB trong phiên. T9 claim đúng: **0 MẪU đạt guard → cơ chế (a) KHÔNG kích hoạt**; T9 KHÔNG claim "không có lúc nào vượt guard". Nếu parent/T10 muốn biết có vượt guard thật giữa hai mẫu không, cần sampler cadence dày hơn (ngoài phạm vi T9 đợt này — giao parent quyết).
- **F-171-T9-5 — ENOSPC tăng đúng +26 dòng mỗi 30 phút (7 → 33 → 59 → 85 → 111) + journal tăng thêm 2 dòng SAU khi T9 đóng.** Nhịp đều 4 khoảng liên tiếp là bất thường so với mọi đợt trước (đợt 170: +10 → +24 → +3 → +0 — chạy theo headroom dao động; đợt 169: tăng theo reboot). T9 ghi tương quan (systemd retry theo chu kỳ cố định là giả thuyết), không phán cơ chế. **Số đóng băng của T9 là 111 dòng lúc cặp probe đóng 16:44:42Z; kiểm lại 16:47Z journal đã 113 dòng (dòng cuối 16:46:03Z)** — 2 dòng sau-đóng thuộc về sau phiên T9, T10 đếm lại sẽ thấy 113; chênh 2 là do mốc đếm, không phải sai số. T9 trình cả dãy mốc để T10/parent không đếm trùng.
- **F-171-T9-6 — T2 CHẠY SCRIPT NẶNG TRONG CỬA SỔ PROBE PASS ATTEMPT3 (F-171-T2-1) — T9 PHÁN TÁC ĐỘNG ĐO ĐƯỢC BỊ CHẶN, VERDICT ATTEMPT3 KHÔNG BỊ LẬT BỞI DỮ KIỆN T9.** Dữ kiện: `m56-171.py` (grep -r, ~88 s) của T2 chồng ~61 s lên cửa sổ probe pass attempt3 (15:08:10–15:11:32Z); T2 KHÔNG kiểm chain-t4.log trước khi chạy — vi phạm luật đứng "không chạy script phân tích nặng trong cửa sổ attempt" (cùng họ F-169-T9-6/F-170-T9-9). Tác động đo được: (i) load1 max trong cửa sổ attempt3 = **3,04 — sampler T4 (n=100 dòng) VÀ sampler T9 độc lập KHỚP NHAU TỪNG SỐ** (T9: mẫu 15:09:28Z load1 3,04 — đúng trong khoảng chồng lấn với `m56-171.py`); (ii) B2 ĐẠT (3,04 ≤ 4 — còn cách ngưỡng 0,96); (iii) **0 spike B2** trong cửa sổ attempt3 (B2 poll mỗi 30 s — T9 ghi rõ giới hạn: một burst ngắn dưới 30 s có thể lọt qua B2, nhưng sampler 60 s đã bắt được 3,04); (iv) tickCost median attempt3 43,0 ms ≤ 60 (theo T4-171). **Phán của T9: vi phạm luật là thật (T2 đã tự nhận); tác động lên phép đo bị chặn ở mức load1 3,04 — không vượt ngưỡng B2, không spike, không ghim balloon; verdict attempt3 HỢP LỆ đứng trên các số đo.** T9 KHÔNG claim 3,04 là do `m56-171.py` gây ra (chỉ ghi: 3,04 nằm trong khoảng chồng lấn; cũng có thể là tải nền của chính probe) — và cũng KHÔNG claim script không ảnh hưởng gì (một script grep -r chạy 61 s trong lúc đo là ô nhiễm tiềm ẩn theo định nghĩa, dù số đo vẫn đạt). **Giao parent/T10 quyết cuối: chấp nhận attempt3 như hợp lệ, hay đánh dấu attempt3 "hợp lệ có caveat ô nhiễm T2".** T9 trình đủ dữ kiện để phán. Lưu ý thêm: `hole-recheck9696.py` chồng 4 s cuối attempt2 + `blind9696-sessions.py` chồng attempt2 ~2 s — attempt2 đã NHIỄM sẵn (B2 4,02) nên không đổi verdict attempt2.
- **F-171-T9-7 — F-170-T9-9 ĐÃ ĐƯỢC SỬA: T4-171 DÙNG ĐÚNG WORDING MỚI + HÀNH VI KHỚP WORDING.** T4-171 dùng câu "không chạy script nào trong lúc probe pass chạy" (§0b + F-171-T4-5 — theo đúng phán của T10-170 §10.5 (vi)). T9 kiểm tra độc lập: 9/10 file output analyze attempt3 có mtime 15:11:36–15:12:00Z — 4 s SAU khi pass cuối kết thúc (15:11:32Z), không chồng lấn pass nào; p1p3p7.txt mtime 15:17:17Z (sau cửa sổ); 0 spike B2 trong cửa sổ attempt3; sampler T9 load1 trong cửa sổ 1,55–3,04. **F-170-T9-9 ĐÓNG.** Caveat: T4 vẫn có 3 lần kiểm "chỉ đọc" trong cửa sổ attempt (15:04:17Z giữa attempt2, 15:11:06Z giữa attempt3 — `pgrep -x`, đọc không chạm — theo T4-171) — T9 không coi đó là chạy script phân tích (chỉ đọc, không ghi file output trong cửa sổ).
- **F-171-T9-8 — 2 spike delta-miss trong 12 spike (ít nhất kể từ đợt 164).** Các spike 14:53:02Z (ffmpeg 32137) và 14:54:50Z (ffmpeg 35741) — dòng delta in ra THIẾU pid này (chỉ 4 dòng delta thay vì 5). Driver quy bằng ps-top tích lũy + top -b tức thời (ffmpeg 127,3% / 50,0%). Nguyên nhân: ffmpeg testsrc2 ngắn — chết giữa chừng trong vòng delta 1 s. **Không lặp F-170-T9-5 về số lượng** (đợt 170: 6 spike delta-miss do replay apt host-side; đợt này: 2 spike — vì replay #80 xong nhanh TRƯỚC khi T9 mở, 0 dòng nhắc apt-get trong b2-spikes.log). T9 ghi rõ để T10 không đếm nhầm thành "2 spike không quy được driver" (cả 2 đều có driver cụ thể qua top -b).
- **F-171-T9-9 — Số RAM min của T8 (252 MB @16:01:08Z) và của T9 (296.796 kB @16:00:29Z) cùng một trũng, khác cadence lấy mẫu — không mâu thuẫn.** Sampler T9 cadence 60 s: mẫu 16:00:29Z = 296.796 kB (289,8 MiB); sampler T8 (n=107, cadence ~30 s trong harness) bắt được 252 MB @16:01:08Z — 39 s sau mẫu của T9, trong cùng nhịp rơi đơn điệu 15:38–16:01Z (sampler T9: 15:59:29Z 327.536 kB → 16:00:29Z 296.796 kB → 16:01:29Z 374.808 kB — hồi sau khi balloon xả). T9 không tranh số của T8; cả hai cùng chứng minh trũng RAM sâu thứ hai kể từ đợt 165 xảy ra trong lúc kẹt 85m4. (Cùng mẫu F-170-T9-10.)
- **F-171-T9-10 — (1c') BỎ LỠ 1 kẹt thật 85m4 — ĐIỂM MÙ MỚI CỦA (c'), T9 CHỈ GHI CHÚ THAM CHIẾU.** Kẹt 85m4 P4-lần1 (15:53:27–16:08:34Z, đóng băng playhead=0.2, elapsed 5→816 s, 163 dòng, maxspan=811 s = 6,8× ngưỡng 120 s) KHÔNG kích hoạt (c') vì toàn bộ 163 dòng đều có paused=true + seeking=true → điều kiện (f) chặn (F-171-T8-7). Watchdog (i) đã bắt được kẹt này (15:56:03Z) nên việc phát hiện không mất. **(c') ĐƯỢC GIỮ theo quyết (i) đợt 170** (0 FP → không cần quyết lại) — T9 không đề xuất sửa (f); T8 trình parent/T10 xem có sửa điều kiện (f) không. Sampler T9 đối chiếu: trong cửa sổ kẹt 85m4, gate A MỞ 0/16, RAM 296.796–846.256 kB, load1 0,06–1,43, 0 spike B2 — kẹt xảy ra khi tải THẤP, không phải do tải đo lường.
- **F-171-T9-11 — T7-171 CHƯA đóng cờ lúc T9 đóng (16:49Z) — kết cục run 171 thuộc T7-171/T10.** T9 không chờ T7 (hạn cờ T9 ~17:00Z). T7 NOTES.md đọc #5 ~16:25Z: run 171 vẫn RUNNING, 0 lần viết lại. T9 đóng cờ trong hạn cờ.
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được — đợt này không quan sát được cửa sổ nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — xem F-171-T9-4: lần đầu tiên guard suýt mở, caveat này trở nên thực chất); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC từ cell vì journalctl chỉ còn boot hiện tại sau reboot (cùng họ EPERM như `dmesg` — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 171 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).

---

## Phụ lục — log sampler đóng băng (121 mẫu, 14:44:27Z–16:44:30Z)

Nội dung dưới đây được tạo BẰNG SCRIPT từ `hidden_files/round171-t9/ram-sampler-FROZEN.log` (md5 `285a8f5edd186090112c0fc574297039`) — không gõ lại bằng tay (xem F-169-T9-9).

```
2026-11-22T14:44:27Z boot=2acdd1ab mem=803796 bal=6055332 swapfree=749928 load1=0.57
2026-11-22T14:45:27Z boot=2acdd1ab mem=774920 bal=6136112 swapfree=741368 load1=0.66
2026-11-22T14:46:27Z boot=2acdd1ab mem=905508 bal=6042212 swapfree=698700 load1=1.44
2026-11-22T14:47:27Z boot=2acdd1ab mem=1001836 bal=5300236 swapfree=684304 load1=2.52
2026-11-22T14:48:27Z boot=2acdd1ab mem=1528716 bal=5232124 swapfree=689484 load1=2.69
2026-11-22T14:49:27Z boot=2acdd1ab mem=1380296 bal=5410968 swapfree=691952 load1=2.50
2026-11-22T14:50:27Z boot=2acdd1ab mem=1012600 bal=4908228 swapfree=645132 load1=1.81
2026-11-22T14:51:27Z boot=2acdd1ab mem=1047516 bal=4829312 swapfree=656240 load1=0.75
2026-11-22T14:52:27Z boot=2acdd1ab mem=1549452 bal=4982228 swapfree=660088 load1=1.71
2026-11-22T14:53:27Z boot=2acdd1ab mem=1424500 bal=5159756 swapfree=660944 load1=4.95
2026-11-22T14:54:27Z boot=2acdd1ab mem=2028084 bal=4087188 swapfree=639332 load1=9.03
2026-11-22T14:55:27Z boot=2acdd1ab mem=1757556 bal=3971036 swapfree=658616 load1=8.20
2026-11-22T14:56:27Z boot=2acdd1ab mem=2792992 bal=3940344 swapfree=657920 load1=5.94
2026-11-22T14:57:27Z boot=2acdd1ab mem=3319728 bal=3395108 swapfree=660948 load1=3.56
2026-11-22T14:58:28Z boot=2acdd1ab mem=2900396 bal=3748620 swapfree=665392 load1=3.24
2026-11-22T14:59:28Z boot=2acdd1ab mem=2711580 bal=4067052 swapfree=665872 load1=1.22
2026-11-22T15:00:28Z boot=2acdd1ab mem=2452180 bal=4348312 swapfree=666952 load1=0.56
2026-11-22T15:01:28Z boot=2acdd1ab mem=2163588 bal=4614232 swapfree=666072 load1=0.25
2026-11-22T15:02:28Z boot=2acdd1ab mem=1902388 bal=4852948 swapfree=669628 load1=0.24
2026-11-22T15:03:28Z boot=2acdd1ab mem=964816 bal=5025808 swapfree=652900 load1=2.51
2026-11-22T15:04:28Z boot=2acdd1ab mem=1613308 bal=4752800 swapfree=633856 load1=3.79
2026-11-22T15:05:28Z boot=2acdd1ab mem=1563108 bal=4884880 swapfree=647140 load1=1.85
2026-11-22T15:06:28Z boot=2acdd1ab mem=1481484 bal=4676668 swapfree=652168 load1=1.40
2026-11-22T15:07:28Z boot=2acdd1ab mem=3021760 bal=3497020 swapfree=652840 load1=1.36
2026-11-22T15:08:28Z boot=2acdd1ab mem=2827052 bal=3181512 swapfree=658272 load1=1.55
2026-11-22T15:09:28Z boot=2acdd1ab mem=2534412 bal=3317036 swapfree=658416 load1=3.04
2026-11-22T15:10:28Z boot=2acdd1ab mem=2634676 bal=3637180 swapfree=660804 load1=1.55
2026-11-22T15:11:28Z boot=2acdd1ab mem=3365336 bal=3231816 swapfree=663068 load1=1.66
2026-11-22T15:12:28Z boot=2acdd1ab mem=6209324 bal=544840 swapfree=663332 load1=2.06
2026-11-22T15:13:28Z boot=2acdd1ab mem=5936256 bal=806984 swapfree=664940 load1=0.95
2026-11-22T15:14:28Z boot=2acdd1ab mem=5536188 bal=1200200 swapfree=666264 load1=0.48
2026-11-22T15:15:28Z boot=2acdd1ab mem=5387952 bal=1388032 swapfree=668488 load1=0.69
2026-11-22T15:16:28Z boot=2acdd1ab mem=5335700 bal=1453568 swapfree=669540 load1=0.45
2026-11-22T15:17:28Z boot=2acdd1ab mem=4929812 bal=1846784 swapfree=679744 load1=0.61
2026-11-22T15:18:28Z boot=2acdd1ab mem=4522432 bal=2240000 swapfree=679980 load1=0.33
2026-11-22T15:19:28Z boot=2acdd1ab mem=4123572 bal=2633216 swapfree=680084 load1=0.39
2026-11-22T15:20:28Z boot=2acdd1ab mem=3732220 bal=3026352 swapfree=680232 load1=0.14
2026-11-22T15:21:28Z boot=2acdd1ab mem=3334932 bal=3410764 swapfree=680548 load1=0.16
2026-11-22T15:22:28Z boot=2acdd1ab mem=2977328 bal=3760872 swapfree=680992 load1=0.11
2026-11-22T15:23:28Z boot=2acdd1ab mem=2647640 bal=4081276 swapfree=678400 load1=0.13
2026-11-22T15:24:28Z boot=2acdd1ab mem=2409280 bal=4370796 swapfree=678688 load1=0.11
2026-11-22T15:25:28Z boot=2acdd1ab mem=2174036 bal=4624100 swapfree=679960 load1=0.08
2026-11-22T15:26:28Z boot=2acdd1ab mem=1949776 bal=4866356 swapfree=680192 load1=0.12
2026-11-22T15:27:28Z boot=2acdd1ab mem=1710532 bal=5086480 swapfree=680368 load1=0.14
2026-11-22T15:28:28Z boot=2acdd1ab mem=1507076 bal=5282344 swapfree=689892 load1=0.05
2026-11-22T15:29:28Z boot=2acdd1ab mem=1292552 bal=5459444 swapfree=689976 load1=0.36
2026-11-22T15:30:28Z boot=2acdd1ab mem=1160060 bal=5620888 swapfree=691488 load1=0.27
2026-11-22T15:31:28Z boot=2acdd1ab mem=1028764 bal=5770144 swapfree=691808 load1=0.13
2026-11-22T15:32:28Z boot=2acdd1ab mem=826864 bal=5906664 swapfree=688288 load1=0.15
2026-11-22T15:33:28Z boot=2acdd1ab mem=774976 bal=6027440 swapfree=688708 load1=0.05
2026-11-22T15:34:28Z boot=2acdd1ab mem=1112424 bal=5016832 swapfree=604064 load1=1.44
2026-11-22T15:35:28Z boot=2acdd1ab mem=920732 bal=5131716 swapfree=625224 load1=1.97
2026-11-22T15:36:28Z boot=2acdd1ab mem=705676 bal=5254732 swapfree=728172 load1=3.03
2026-11-22T15:37:28Z boot=2acdd1ab mem=1469736 bal=5423000 swapfree=734568 load1=1.17
2026-11-22T15:38:28Z boot=2acdd1ab mem=910304 bal=5331276 swapfree=687472 load1=1.28
2026-11-22T15:39:28Z boot=2acdd1ab mem=859056 bal=5414296 swapfree=685520 load1=0.72
2026-11-22T15:40:28Z boot=2acdd1ab mem=829296 bal=5532392 swapfree=689956 load1=0.39
2026-11-22T15:41:28Z boot=2acdd1ab mem=721252 bal=5649612 swapfree=690120 load1=0.29
2026-11-22T15:42:28Z boot=2acdd1ab mem=605304 bal=5756440 swapfree=684400 load1=0.32
2026-11-22T15:43:28Z boot=2acdd1ab mem=538140 bal=5852724 swapfree=684360 load1=0.18
2026-11-22T15:44:28Z boot=2acdd1ab mem=474500 bal=5941760 swapfree=705020 load1=0.06
2026-11-22T15:45:29Z boot=2acdd1ab mem=382584 bal=6022208 swapfree=701732 load1=0.02
2026-11-22T15:46:29Z boot=2acdd1ab mem=508656 bal=5901376 swapfree=641144 load1=0.04
2026-11-22T15:47:29Z boot=2acdd1ab mem=669888 bal=5611760 swapfree=649264 load1=0.13
2026-11-22T15:48:29Z boot=2acdd1ab mem=644216 bal=5716944 swapfree=649920 load1=0.10
2026-11-22T15:49:29Z boot=2acdd1ab mem=561244 bal=5817084 swapfree=646472 load1=0.14
2026-11-22T15:50:29Z boot=2acdd1ab mem=426984 bal=5909044 swapfree=644468 load1=0.14
2026-11-22T15:51:29Z boot=2acdd1ab mem=411948 bal=5992408 swapfree=641560 load1=0.20
2026-11-22T15:52:29Z boot=2acdd1ab mem=350508 bal=6068844 swapfree=629376 load1=0.11
2026-11-22T15:53:29Z boot=2acdd1ab mem=679320 bal=6154604 swapfree=622892 load1=0.26
2026-11-22T15:54:29Z boot=2acdd1ab mem=611992 bal=5671120 swapfree=590920 load1=1.43
2026-11-22T15:55:29Z boot=2acdd1ab mem=619716 bal=5766036 swapfree=600068 load1=1.19
2026-11-22T15:56:29Z boot=2acdd1ab mem=539672 bal=5863708 swapfree=599324 load1=0.57
2026-11-22T15:57:29Z boot=2acdd1ab mem=465356 bal=5952560 swapfree=603432 load1=0.21
2026-11-22T15:58:29Z boot=2acdd1ab mem=374808 bal=6033380 swapfree=601584 load1=0.07
2026-11-22T15:59:29Z boot=2acdd1ab mem=327536 bal=6107096 swapfree=596004 load1=0.07
2026-11-22T16:00:29Z boot=2acdd1ab mem=296796 bal=6175156 swapfree=593160 load1=0.06
2026-11-22T16:01:29Z boot=2acdd1ab mem=445084 bal=5955192 swapfree=585216 load1=0.27
2026-11-22T16:02:29Z boot=2acdd1ab mem=408076 bal=6034732 swapfree=590344 load1=0.16
2026-11-22T16:03:29Z boot=2acdd1ab mem=330620 bal=6109304 swapfree=583096 load1=0.16
2026-11-22T16:04:29Z boot=2acdd1ab mem=308780 bal=6178620 swapfree=579936 load1=0.24
2026-11-22T16:05:29Z boot=2acdd1ab mem=452304 bal=5944740 swapfree=581832 load1=0.55
2026-11-22T16:06:29Z boot=2acdd1ab mem=401180 bal=6026372 swapfree=574656 load1=0.83
2026-11-22T16:07:29Z boot=2acdd1ab mem=414884 bal=6012764 swapfree=574612 load1=0.43
2026-11-22T16:08:29Z boot=2acdd1ab mem=846256 bal=6088144 swapfree=573176 load1=0.22
2026-11-22T16:09:29Z boot=2acdd1ab mem=767468 bal=5471152 swapfree=569784 load1=2.14
2026-11-22T16:10:29Z boot=2acdd1ab mem=674308 bal=5580076 swapfree=574812 load1=1.37
2026-11-22T16:11:29Z boot=2acdd1ab mem=707284 bal=5692096 swapfree=576620 load1=0.61
2026-11-22T16:12:29Z boot=2acdd1ab mem=594328 bal=5795204 swapfree=577320 load1=0.35
2026-11-22T16:13:29Z boot=2acdd1ab mem=486244 bal=5887588 swapfree=577296 load1=0.12
2026-11-22T16:14:29Z boot=2acdd1ab mem=423824 bal=5971488 swapfree=577588 load1=0.08
2026-11-22T16:15:29Z boot=2acdd1ab mem=425916 bal=5957784 swapfree=577160 load1=0.25
2026-11-22T16:16:29Z boot=2acdd1ab mem=378820 bal=6030252 swapfree=577280 load1=0.18
2026-11-22T16:17:29Z boot=2acdd1ab mem=569568 bal=5831216 swapfree=576300 load1=0.16
2026-11-22T16:18:29Z boot=2acdd1ab mem=476616 bal=5920404 swapfree=576404 load1=0.09
2026-11-22T16:19:29Z boot=2acdd1ab mem=400060 bal=6000200 swapfree=576496 load1=0.28
2026-11-22T16:20:29Z boot=2acdd1ab mem=336020 bal=6074072 swapfree=576260 load1=0.16
2026-11-22T16:21:30Z boot=2acdd1ab mem=374828 bal=6033536 swapfree=570600 load1=0.24
2026-11-22T16:22:30Z boot=2acdd1ab mem=321332 bal=6099668 swapfree=569968 load1=0.08
2026-11-22T16:23:30Z boot=2acdd1ab mem=428980 bal=5951672 swapfree=570296 load1=0.03
2026-11-22T16:24:30Z boot=2acdd1ab mem=677552 bal=5559940 swapfree=562392 load1=0.89
2026-11-22T16:25:30Z boot=2acdd1ab mem=638328 bal=5579608 swapfree=562096 load1=1.23
2026-11-22T16:26:30Z boot=2acdd1ab mem=916080 bal=5038788 swapfree=574352 load1=1.84
2026-11-22T16:27:30Z boot=2acdd1ab mem=1685504 bal=5187528 swapfree=577192 load1=1.35
2026-11-22T16:28:30Z boot=2acdd1ab mem=757780 bal=5231444 swapfree=571280 load1=1.28
2026-11-22T16:29:30Z boot=2acdd1ab mem=768060 bal=5357832 swapfree=571044 load1=1.43
2026-11-22T16:30:30Z boot=2acdd1ab mem=697628 bal=5493612 swapfree=573508 load1=0.58
2026-11-22T16:31:30Z boot=2acdd1ab mem=1312036 bal=5617272 swapfree=572172 load1=0.46
2026-11-22T16:32:30Z boot=2acdd1ab mem=1088720 bal=5771640 swapfree=580240 load1=0.31
2026-11-22T16:33:30Z boot=2acdd1ab mem=970572 bal=5908796 swapfree=583328 load1=0.19
2026-11-22T16:34:30Z boot=2acdd1ab mem=876068 bal=6036820 swapfree=584472 load1=0.12
2026-11-22T16:35:30Z boot=2acdd1ab mem=758476 bal=6153444 swapfree=584360 load1=0.10
2026-11-22T16:36:30Z boot=2acdd1ab mem=688888 bal=6266984 swapfree=673448 load1=0.16
2026-11-22T16:37:30Z boot=2acdd1ab mem=574484 bal=6366800 swapfree=676984 load1=0.31
2026-11-22T16:38:30Z boot=2acdd1ab mem=489520 bal=6443824 swapfree=675044 load1=0.21
2026-11-22T16:39:30Z boot=2acdd1ab mem=485460 bal=6443824 swapfree=675248 load1=0.08
2026-11-22T16:40:30Z boot=2acdd1ab mem=468032 bal=6443824 swapfree=677868 load1=0.25
2026-11-22T16:41:30Z boot=2acdd1ab mem=468924 bal=6443824 swapfree=680888 load1=0.13
2026-11-22T16:42:30Z boot=2acdd1ab mem=451588 bal=6443824 swapfree=668908 load1=0.14
2026-11-22T16:43:30Z boot=2acdd1ab mem=451824 bal=6443824 swapfree=672000 load1=0.14
2026-11-22T16:44:30Z boot=2acdd1ab mem=472216 bal=6443824 swapfree=672000 load1=0.09
```

---

## Phụ lục — headroom log (47 dòng, 12 lần đo hợp lệ)

Nội dung dưới đây được tạo BẰNG SCRIPT từ `hidden_files/round171-t9/headroom-log-FROZEN.txt` (md5 `87895d5633b42eec9019b510422c939b`) — không gõ lại bằng tay (xem F-169-T9-9).

```
=== probe-mo 2026-11-22T14:44:47Z boot=2acdd1ab tran=63747
2026-11-22T14:44:47Z
0
0
ENOSPC-count=7
ENOSPC-first: Nov 22 14:36:14 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last: Nov 22 14:44:13 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     781864 kB | Balloon:         6095192 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-2 2026-11-22T15:14:27Z boot=2acdd1ab tran=63747
0
0
ENOSPC-count=33
ENOSPC-last: Nov 22 15:14:03 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    5536492 kB | Balloon:         1200200 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-22T15:44:27Z boot=2acdd1ab tran=63747
0
0
ENOSPC-count=59
ENOSPC-last: Nov 22 15:43:53 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     473496 kB | Balloon:         5941760 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-4 2026-11-22T16:14:27Z boot=2acdd1ab tran=63747
0
0
ENOSPC-count=85
ENOSPC-last: Nov 22 16:14:03 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     423952 kB | Balloon:         5971488 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-5 2026-11-22T16:44:27Z boot=2acdd1ab tran=63747
0
0
ENOSPC-count=111
ENOSPC-last: Nov 22 16:43:53 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     468120 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
probe-loop done 2026-11-22T16:44:27Z
=== probe-close 2026-11-22T16:44:42Z boot=2acdd1ab tran=63747
2026-11-22T16:44:42Z
0
0
ENOSPC-count=111
ENOSPC-first: Nov 22 14:36:14 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last: Nov 22 16:43:53 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     463156 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```
