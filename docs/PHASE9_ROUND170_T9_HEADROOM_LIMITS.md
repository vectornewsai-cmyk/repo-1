# LIMITS — Phase 9 đợt 170, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ hai mươi bốn liên tiếp; headroom 2 lúc đóng, dưới ngưỡng lần thứ ba mươi liên tiếp — NHƯNG dao động 0→2→0→2 trong phiên; CỬA SỔ THOÁNG SAU REBOOT KHÔNG QUAN SÁT ĐƯỢC LẦN THỨ BA LIÊN TIẾP; balloon E-173 KẾT THÚC trong khoảng mù + E-174 MỚI 47 mẫu ĐANG GHIM — 1 episode, 2 chuỗi, 1 sag NÔNG; ENOSPC 39 dòng; REBOOT #79 TRƯỚC KHI ĐỢT MỞ)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 2 lúc đóng (12 lần đo hợp lệ: 4 lần 0, 8 lần 2), dưới ngưỡng < ~1.800 lần thứ ba mươi liên tiếp** — giá trị ổn định cuối phiên là **2** (đợt 169: 2; đợt 168: 2; đợt 167: 0). Trần **63.747 trên boot #79 duy nhất**. **MỚI: headroom DAO ĐỘNG 0→2→0→2 trong phiên** (0,0 lúc mở 11:38:18Z → 2,2 lúc 12:08:06Z → 0,0 lúc 12:38:06Z → 2,2 lúc 13:08:06Z → 2,2 lúc 13:38:06Z → 2,2 lúc đóng 13:38:51Z) — lần đầu tiên headroom quay lại 0 sau khi đã lên 2 (đợt 168/169: lên 2 rồi giữ 2). ENOSPC chạy theo đúng nhịp dao động (24 dòng mới trong lúc 0, 0 dòng mới trong lúc 2 — xem §1, §4). Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT KHÔNG QUAN SÁT ĐƯỢC LẦN THỨ BA LIÊN TIẾP (đợt 168 + 169 + 170).** Reboot #79 (btime 11:11:05Z) xảy ra **TRƯỚC KHI ĐỢT MỞ 24m46s** — đợt mở 11:35:51Z đã là boot+1486s; probe mở 11:38:18Z (boot+1633s) đã là **0, 0**; ENOSPC đầu tiên trên #79 lúc 11:36:23Z (boot+1518s). Lần này cửa sổ KHÔNG THỂ quan sát được theo cấu trúc (T9 chỉ có mặt sau khi đợt mở, mà đợt mở đã muộn hơn boot 24 phút) — khác 168/169 (reboot giữa phiên, T9 có mặt từ boot+71s/+91s mà vẫn 0). Xem §1.2, F-170-T9-1.
- **Balloon — E-173 KẾT THÚC trong khoảng mù giữa hai đợt + E-174 MỚI (47 mẫu, 2 chuỗi, 1 sag NÔNG, ĐANG GHIM lúc đóng):** **E-173 GIỮ 57 mẫu, KHÔNG cộng thêm** — mẫu ghim cuối 10:54:11Z trên #78 (đợt 169); khoảng mù 2.633 s (10:54:11Z → 11:38:04Z) có **MỘT reboot (#79 btime 11:11:05Z)**; mẫu đầu trên #79 (11:38:04Z) balloon đã 5.681.512 kB (88,2% trần), không ghim — thời điểm đứt thật nằm trong (10:54:11Z, 11:38:04Z], T9 không claim cụ thể. **E-174 MỚI trên #79: 12:48:06–13:38:07Z, 47 mẫu ghim, 2 chuỗi (11 + 36), 1 sag 4 mẫu (12:59:06–13:02:06Z) — LÀ 1 EPISODE (không tách): sag NÔNG (balloon tối thiểu 6.050.608 kB = 93,9% trần) + gate A ĐÓNG cả 4 mẫu trong sag** — cả hai điều kiện của quy tắc mẫu T10-166 đều THỎA (đối chiếu E-172/E-173 đợt 169: sag sâu 78,3% + gate A mở 10/27 → tách; E-169 đợt 167: sag 89,9% + gate A đóng → 1 episode — E-174 còn nông hơn: 93,9%). **E-174 ĐANG GHIM lúc đóng** — kết cục thuộc đợt sau. **E-172 GIỮ 3 mẫu, E-171 GIỮ 12 mẫu, E-170 GIỮ 48 mẫu, E-169 GIỮ 20 mẫu. Tổng ghim đợt này 47/121 mẫu (38,8%).** Xem §2.2.
- **RAM:** sampler **121 mẫu, 11:38:04Z–13:38:07Z, MỘT boot duy nhất (#79)**. Max **3.413.092 kB (3.333,1 MiB = 54,25% guard) lúc 12:00:04Z** — **cao hơn đợt 169 (49,84%)**; min **263.132 kB lúc 12:25:05Z** (trong lúc kẹt 84l10) — **sâu hơn đợt 169 đúng 174.736 kB, sâu nhất kể từ đợt 165 (248.768 kB)**; mean toàn phiên **1.003.597,4 kB — tính bằng 3 cách (python + awk 1.003.597,4 + trung bình có trọng số) KHỚP NHAU**. Gate A **41/121 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ hai mươi bốn liên tiếp.** Xem §2, §3.
- **B2: 19 spike THẬT (grep '^=== SPIKE' = grep không neo = 19), 18/19 QUY ĐƯỢC DRIVER CỤ THỂ, 1 load1 dư.** Bão mở đợt #79: 16 spike (11:39:05–11:48:47Z — grep/find quét file + tsc + mask_anim/ffmpeg testsrc2 + **replay apt host-side (os-intent, 50 transaction, dpkg 2→1545, cài đặt 11:44:37–11:48:15Z)** + T2 hole-recheck). **3 spike TRONG cửa sổ O8 (12:09:53–12:11:04Z)** — đều do chính process trình duyệt của O8 (WebKit attempt2 + Chromium clicktest-headed); O8 vẫn PASS 3/3. **0 spike trong cửa sổ attempt1, 0 spike trong cửa sổ harness (kể cả lúc kẹt 84l10 — kẹt xảy ra khi load1 ≤1,34).** 6 spike delta-miss (đều quy được bằng ps-top + top -b tức thời). Delta tick lớn nhất 119 tick/s (ffmpeg testsrc2 1920x1080, 11:47:02Z). Xem §2.5.
- **Lượt yên WebKit #39 (T4): CÓ LƯỢT HỢP LỆ — CHUỖI LÊN 34.** Attempt1-5df1871f (11:55:26–11:59:18Z): probe 20/20, lớp B 5/5, tickCost median 40,0 ms ≤ 60 — HỢP LỆ ngay lần thử đầu trên boot #79. Sampler T9 đối chiếu: gate A MỞ 4/4 mẫu trong cửa sổ; load1 0,6–1,92; **0 spike B2 trong cửa sổ attempt1**. **Lưu ý (F-170-T9-9): 9 file output analyze của T4 có mtime 11:58:53–11:59:18Z (trong cửa sổ poller) NHƯNG 2m03s SAU khi probe pass cuối kết thúc (11:56:50Z) — phân tích chạy sau khi đo xong, không chồng lấn pass nào; 0 spike + load1 ≤2,28 → không có dấu hiệu ô nhiễm đo. Wording "không chạy script nào" của T4 cần sửa thành "không chạy script nào trong lúc probe pass chạy" — giao T4/T10 phán.** Xem §2.3.
- **T8-170 (đối chiếu): O8 PASS 3/3 trên boot #79 (12:08:45–12:11:21Z) — T8 ĐỀ XUẤT chuỗi WebKit FULL PASS LÊN 22** (lượt yên #39 hợp lệ + O8 cùng boot #79 + gate (a) FOUND); **harness 5/6 + 1 KẸT THẬT WebKit 84l10** (12:12:02–12:27:03Z, W2-setup) — chuỗi "P3 không kẹt" 4 → 0 (ĐỨT); (1c') giữ nguyên, 0 FP. T9 đối chiếu bằng sampler độc lập: RAM rơi đơn điệu 1.823.680 → 263.132 kB trong lúc kẹt rồi hồi 632.540 kB lúc 12:26:05Z; balloon 4.807.460 → 6.227.012 kB (96,6% trần); load1 0,12–1,34; **0 spike B2 trong cửa sổ kẹt**. Số RAM min của T8 (247 MB @12:25:29Z) và của T9 (263.132 kB @12:25:05Z) cùng một trũng, khác cadence lấy mẫu — không mâu thuẫn (xem F-170-T9-10). Xem §2.4.
- **REBOOT #79 DUY NHẤT (5df1871f, btime 11:11:05Z; gap #78→#79 = 6.987 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ** (T0-170 xác minh 9/9 nguồn; T2-170 xác minh 7 nguồn). **KHÔNG có reboot giữa phiên đợt 170** — sampler + watcher + probe-loop sống suốt phiên; **0 gap >90 s trong log đóng băng (max 61 s)**. Run 169 SUCCEEDED 11:17:44Z (margin 1.087 s — theo T2-170/T0-170). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: #79 = 39 dòng (đếm được, toàn bộ thuộc về đợt 170 — dòng đầu tiên 11:36:23Z, SAU khi đợt mở 11:35:51Z). Đợt thứ mười chín liên tiếp bảng watch cạn gây lỗi thật thấy được.** ENOSPC chạy theo nhịp headroom: 10 dòng mới lúc headroom 0 (11:38–12:08Z) → 24 dòng mới lúc headroom 0 (12:08–12:38Z) → 3 dòng mới (12:38–13:08Z) → 0 dòng mới sau 12:40:43Z khi headroom về 2 và giữ 2. Xem §4.
- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc T9 đóng (7/9)** — T7 CHƯA đóng cờ lúc T9 đóng (chỉ có NOTES.md); kết cục run 170 thuộc T7-170. **(m) #78: DƯƠNG theo đối chiếu độc lập của T2-170** (requeue +40,693 s trong dải; nếu parent chấp nhận: n 27→28 / 28→29) — **nhưng F-170-T5-1 nêu mâu thuẫn: poll cuối watcher-169 09:14:49Z MUỘN HƠN btime #78 (09:14:38Z) 11 s** — giao parent/T2 phán (T9 chỉ ghi chú tham chiếu). **(m) #79: KHÔNG PHẢI ĐIỂM** (requeue +251,007 s, ngoài dải — theo T2-170). Xem §5.3/§5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round170-t9/k8-headroom.py` (copy y nguyên từ đợt 169 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 170 (12 lần đo hợp lệ, 1 boot, 0 lần đo lỗi)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 11:38:18Z 22/11 | **0** | #79 5df1871f | 63.747 | lần đo 1–2, cặp mở (boot+1633s); ENOSPC-count=2 (dòng đầu tiên 11:36:23Z = boot+1518s); balloon 5.731.736 kB (89,0% trần) |
| 11:38:18Z 22/11 | **0** | #79 5df1871f | 63.747 | lần đo 2 (chênh **0**) |
| 12:08:06Z 22/11 | **2** | #79 5df1871f | 63.747 | lần đo 3–4, probe-loop lan-2; ENOSPC-count=12 (dòng mới nhất 11:56:13Z); balloon 5.467.780 kB |
| 12:08:06Z 22/11 | **2** | #79 5df1871f | 63.747 | lần đo 4 (chênh **0**) |
| 12:38:06Z 22/11 | **0** | #79 5df1871f | 63.747 | lần đo 5–6, probe-loop lan-3; ENOSPC-count=36 (dòng mới nhất 12:37:13Z); balloon 5.475.940 kB |
| 12:38:06Z 22/11 | **0** | #79 5df1871f | 63.747 | lần đo 6 (chênh **0**) |
| 13:08:06Z 22/11 | **2** | #79 5df1871f | 63.747 | lần đo 7–8, probe-loop lan-4; ENOSPC-count=39 (dòng mới nhất 12:40:43Z — ENOSPC đã dừng); balloon ĐANG GHIM TRẦN (E-174), RAM 478.444 kB |
| 13:08:06Z 22/11 | **2** | #79 5df1871f | 63.747 | lần đo 8 (chênh **0**) |
| 13:38:06Z 22/11 | **2** | #79 5df1871f | 63.747 | lần đo 9–10, probe-loop lan-5; ENOSPC-count=39; balloon ĐANG GHIM TRẦN (E-174), RAM 447.392 kB |
| 13:38:06Z 22/11 | **2** | #79 5df1871f | 63.747 | lần đo 10 (chênh **0**) |
| 13:38:51Z 22/11 | **2** | #79 5df1871f | 63.747 | lần đo 11–12, cặp đóng; balloon ĐANG GHIM TRẦN (E-174), RAM 481.036 kB; ENOSPC-count=39 |
| 13:38:51Z 22/11 | **2** | #79 5df1871f | 63.747 | lần đo 12 (chênh **0**) |

- Probe dừng ở `i=0` trong 4/12 lần đo hợp lệ; dừng ở `i=2` trong 8 lần đo còn lại. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi lần đo).
- **Cửa sổ thoáng sau reboot: KHÔNG QUAN SÁT ĐƯỢC — LẦN THỨ BA LIÊN TIẾP (đợt 168 + 169 + 170).** Reboot #79 btime 11:11:05Z (T0-170 xác minh 9 nguồn; `uptime -s` = 2026-11-22 11:11:05; journal first entry 11:11:16Z). Đợt mở 11:35:51Z = boot+1486s; T9 nhận việc ~11:37:3xZ; sampler khởi động 11:38:04Z (boot+1619s); probe mở 11:38:18Z (boot+1633s) đã là 0, 0. ENOSPC đầu tiên trên #79 lúc 11:36:23Z (boot+1518s) — SAU khi đợt mở 32 s. T9 ghi đúng mốc đo, không claim cửa sổ có mở hay không (chỉ biết: nếu có mở thì đã đóng trước boot+1518s). **Khác 168/169: lần này cửa sổ không thể quan sát được theo cấu trúc** — reboot xảy ra trước khi đợt mở 24m46s, T9 không có mặt trong cửa sổ boot+60–200s bằng bất cứ cách nào (xem F-170-T9-1). **Khoảng mù giữa hai đợt 2.633 s (10:54:11Z → 11:38:04Z)** — sampler đợt 169 dừng lúc đóng (10:54:11Z); sampler đợt 170 khởi động 11:38:04Z. Trong 2.633 s này có 1 reboot (#79 11:11:05Z) — E-173 đã kết thúc trong khoảng mù (xem §2.2); cửa sổ thoáng của #79 (nếu có, ~11:12–11:15Z) đã đóng trước khi T9 mở.
- **Headroom cuối phiên: 2 (cặp đóng 13:38:51Z, chênh 0).** ENOSPC trên #79 dừng sau 12:40:43Z (39 dòng rồi im tới đóng) trong khi headroom về 2 và giữ 2 — 2 slot trống có thể là lý do systemd ngừng lỗi (T9 ghi tương quan, không phán nhân quả — cùng mẫu đợt 168/169). Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 2 = **63.745 watch** trên #79.
- **DAO ĐỘNG 0→2→0→2 (MỚI — xem F-170-T9-2):** lần đầu tiên headroom quay lại 0 sau khi đã lên 2. Dãy đo: 0,0 (11:38:18Z) → 2,2 (12:08:06Z) → 0,0 (12:38:06Z) → 2,2 (13:08:06Z) → 2,2 (13:38:06Z) → 2,2 (13:38:51Z). ENOSPC chạy đúng nhịp: +10 dòng trong khoảng 11:38–12:08Z (lúc headroom 0→2), +24 dòng trong khoảng 12:08–12:38Z (lúc headroom 2→0, dòng cuối 12:37:13Z — 53 s trước probe lan-3), +3 dòng trong khoảng 12:38–13:08Z (dòng cuối 12:40:43Z), +0 dòng sau đó (lúc headroom giữ 2). T9 ghi tương quan, không phán cơ chế (ai ngoài cell nhả/lấy lại 2 watch — ngoài tầm cell).
- **So sánh với đợt 169:** đợt 169 mở 0 trên #77 (4 lần đo) → reboot #78 giữa phiên → 0 ngay từ boot+91s → 2 lúc đóng (14 lần đo hợp lệ, 8 lần 0, 6 lần 2). Đợt này KHÔNG reboot giữa phiên: mở 0 trên #79 (2 lần đo) → 2 lúc 12:08:06Z → **0 trở lại lúc 12:38:06Z** → 2 lúc đóng (12 lần đo hợp lệ, 4 lần 0, 8 lần 2). **Không lần nào chạm CAP 30.000 đợt này** (đợt 169: 0 lần chạm CAP; đợt 168: 0 lần; đợt 167: đỉnh cửa sổ 14.072, không chạm CAP; đợt 163–166: chạm CAP mỗi đợt).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **2 / 1.578 ≈ 0,001** — một vite mới (~1.578 watch) vẫn không khởi động được.
- T5-170 KHÔNG probe lại headroom đợt này (như đợt 151–169) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 12 lần đo hợp lệ + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #79 đợt này có 39 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #79 suốt 12 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.
- Lưu ý: RAM lúc đóng (481.036 kB — mẫu ghim E-174) THẤP hơn RAM lúc mở (1.197.148 kB — mẫu đầu #79) trong khi headroom 0 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop chạy đủ 4 lan (lan-2 12:08:06Z, lan-3 12:38:06Z, lan-4 13:08:06Z, lan-5 13:38:06Z) rồi kết thúc bình thường ("probe-loop done 13:38:06Z"); cặp probe đóng 13:38:51Z do T9 đo tay ngay sau đó.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–169 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **170** | **0 → 2 → 0 → 2 (dao động)** | **mở 11:38:18Z boot #79 5df1871f btime 11:11:05Z (trần 63.747): 0, 0 (11:38:18Z) → 2, 2 lúc 12:08:06Z → 0, 0 lúc 12:38:06Z → 2, 2 lúc 13:08:06Z → 2, 2 lúc 13:38:06Z → đóng 13:38:51Z cùng boot #79: 2, 2 (KHÔNG reboot giữa phiên; reboot #79 TRƯỚC khi đợt mở; 12 lần đo hợp lệ, 4 lần 0, 8 lần 2; KHÔNG lần nào chạm CAP)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 6 → 0 → 2 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 2** (đợt 169 đóng 2; đợt 168 đóng 2; đợt 167 đóng 0). Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ ba mươi liên tiếp** (tính theo giá trị ổn định lúc đóng; đợt này giá trị dao động 0↔2 trong phiên nhưng giá trị đóng vẫn là 2). Quyết parent đợt 168 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal boot #79 đợt này có 39 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười chín liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng; đợt 165: ≥64 dòng; đợt 166: ≥56 dòng; đợt 167: ≥76 dòng; đợt 168: ≥102 dòng — T9 đếm trực tiếp; đợt 169: ≥54 dòng — T9 đếm trực tiếp; đợt 170: **39 dòng — T9 đếm trực tiếp, xem §4**). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong boot** (63.747 trên #79 suốt 12 lần đo hợp lệ). T9 ghi đúng số đo, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên #79; swap 1.048.572 kB) — sampler 121 mẫu, 11:38:04Z–13:38:07Z, MỘT boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở cả mẫu đầu và lúc đóng trên #79 (mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: mở phiên RAM cao + balloon xả sâu → bão mở đợt (16 spike B2, load1 tới 8,61) + replay apt host-side → T4 attempt1 HỢP LỆ ngay lần đầu → RAM đỉnh phiên 3.413.092 kB lúc 12:00:04Z → O8 PASS 3/3 → harness 5/6 + kẹt thật 84l10 (RAM trũng sâu nhất kể từ đợt 165) → balloon leo lại tới trần → E-174 ghim 47 mẫu tới lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log đóng băng 61 s; 0 gap >90 s** — xem §5.1). **121 mẫu, 11:38:04Z–13:38:07Z, MỘT boot (#79: 121 mẫu).** Tổng quan: **min 263.132 kB (257,0 MiB) lúc 12:25:05Z** (trong lúc kẹt 84l10); **max 3.413.092 kB (3.333,1 MiB) lúc 12:00:04Z — 54,25% guard** (balloon xả 3.405.348 kB, thấp nhất phiên); **mean toàn phiên 1.003.597,4 kB (980,1 MiB) — tính bằng 3 cách (python + awk 1.003.597,4 + trung bình có trọng số) KHỚP NHAU (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 11:38:04–11:54:04Z | #79 | 1.197.148–2.725.184 kB | Mở phiên: balloon 5.681.512 kB (88,2% trần) lúc 11:38:04Z, dao động 3.788.396–5.681.512 kB trong giai đoạn; **0 mẫu ghim**; **BÃO MỞ ĐỢT (16 spike B2, load1 tới 8,61 — xem §2.5)** gồm replay apt host-side (os-intent) cài 50 transaction 11:44:37–11:48:15Z; T4 poller chờ gate (poll #1–21, 11:40:20–11:55:26Z); gate A MỞ 17/17 mẫu; load1 ≥3,0 ở 10/17 mẫu (sampler) |
| 11:55:04–12:07:05Z | #79 | 1.502.944–3.413.092 kB | **T4 attempt1 HỢP LỆ (11:55:26–11:59:18Z — xem §2.3)**; **RAM max phiên 3.413.092 kB lúc 12:00:04Z** (54,25% guard — balloon xả sâu nhất phiên 3.405.348 kB); gate A MỞ 13/13 mẫu; **0 spike B2 trong cửa sổ attempt1**; load1 0,05–1,92 |
| 12:08:05–12:11:05Z | #79 | 1.094.084–1.532.732 kB | **O8 PASS 3/3 (12:08:45–12:11:21Z — xem §2.4)**; **3 spike B2 trong cửa sổ O8** (đều do chính process trình duyệt của O8 — xem §2.5); gate A MỞ 4/4 mẫu trong giai đoạn (3/3 mẫu trong cửa sổ O8); load1 0,16–3,99 |
| 12:12:05–12:41:06Z | #79 | 263.132–1.823.680 kB | **Harness 5/6 + KẸT THẬT WebKit 84l10 (12:12:02–12:27:03Z — xem §2.4)**; RAM rơi đơn điệu 1.823.680 → 263.132 kB (12:12–12:25Z) rồi hồi 632.540 kB lúc 12:26:05Z; balloon leo 4.807.460 → 6.227.012 kB (96,6% trần); **0 spike B2 trong cửa sổ harness**; gate A MỞ 6/30 mẫu; load1 0,12–2,74 |
| 12:42:06–13:38:07Z | #79 | 445.712–1.112.980 kB | Balloon leo lên trần lúc 12:48:06Z; **E-174: chuỗi 1 ghim 12:48:06–12:58:06Z (11 mẫu) → sag nông 4 mẫu 12:59:06–13:02:06Z → chuỗi 2 ghim 13:03:06–13:38:07Z (36 mẫu), ĐANG GHIM lúc đóng** (xem §2.2); **0 spike B2**; gate A MỞ 1/57 mẫu trong giai đoạn (0/47 mẫu ghim); load1 0,00–1,25 |

- **Gate A ≥1024 MiB: 41/121 mẫu** (17+13+4+6+1 theo 5 giai đoạn — khớp tổng); **0 mẫu ≥ guard**; load1 max (sampler) **8,61 lúc 11:47:04Z** (bão mở đợt; watcher bắt 8,61 lúc 11:47:02Z — khớp); **12/121 mẫu load1 ≥3,0** (10 mẫu trong bão mở đợt 11:39:04–11:49:04Z + 2 mẫu trong cửa sổ O8 12:10:05Z/12:11:05Z; 0 mẫu sau 12:11:05Z). **RAM <512.000 kB: 45 mẫu** (37,2% — cao hẳn đợt 169: 3,0%, vì đợt này ghim tập trung cuối phiên trên #79: E-174 47 mẫu ghim lúc RAM 445–570.000 kB, 45/47 mẫu ghim dưới 512.000 kB + 7 mẫu trong harness); **RAM <300.000 kB: 2 mẫu** (12:24:05Z 277.196 kB; 12:25:05Z 263.132 kB — cả hai trong lúc kẹt 84l10; **lần đầu có mẫu <300.000 kB kể từ đợt 165** — đợt 166–169 đều 0 mẫu).
- Swap: SwapFree 923.068 kB (mẫu đầu) → 572.088 kB (thấp nhất phiên, lúc 12:33:06Z — trong harness, sau kẹt) → 661.372 kB (mẫu cuối, 13:38:07Z). Nhịp nhảy SwapFree trong phiên: không có reboot nên không có nhảy qua reboot (đợt 169: nhả ~338.940 kB qua reboot #78).
- Mẫu 12:00:04Z (đỉnh phiên): RAM 3.413.092 kB, balloon xả 3.405.348 kB — balloon xả sâu nhất phiên đúng lúc T4 vừa kết thúc attempt1 hợp lệ (11:59:18Z). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 263.132 kB (đợt 169: 437.868 kB; đợt 168: 414.364 kB; đợt 167: 383.116 kB; đợt 166: 372.732 kB; đợt 165: 248.768 kB; đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — **trũng SÂU hơn đợt 169 đúng 174.736 kB** (437.868 − 263.132), **sâu nhất kể từ đợt 165 (248.768 kB)**. 45 mẫu <512.000 kB trong 121 mẫu (37,2% — cao nhất kể từ đợt 168: 37,0% — ngang nhau); riêng trong span E-174 (47 mẫu ghim): **38/47 mẫu <512.000 kB (80,9% — chuỗi 1: 11/11; chuỗi 2: 27/36)**; trong span harness (30 mẫu): 7/30 mẫu <512.000 kB (23,3%).

**Bảng tổng hợp số RAM (từ script `t9-170-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 121 dòng — KHÔNG tính tay, đã đối chiếu lại từ log đóng băng bằng script `t9-170-recheck.py` — RECHECK OK):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #79 5df1871f | 121 | 263.132 | 3.413.092 | 1.003.597,4 | 41/121 | 47 | 8,61 | 45 |
| **Toàn phiên** | **121** | **263.132** | **3.413.092** | **1.003.597,4** | **41/121** | **47/121 (38,8%)** | **8,61** | **45** |

- **Mean toàn phiên 1.003.597,4 kB — tính bằng 3 cách độc lập: python `sum/n = 1.003.597,4` VÀ awk `sum/n = 1.003.597,4` VÀ trung bình có trọng số (một boot nên trùng python) — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163).
- 45 mẫu RAM <512.000 kB (từ script analyze trên log đóng băng — không tính tay): 5 mẫu trong lúc kẹt 84l10 (12:21:05Z 472.592; 12:22:05Z 367.340; 12:23:05Z 314.872; 12:24:05Z 277.196; 12:25:05Z 263.132) + 2 mẫu trong harness sau kẹt (12:36:05Z 473.252; 12:37:06Z 455.784) + 38 mẫu ghim E-174 (chuỗi 1: 11/11; chuỗi 2: 27/36). 9 mẫu ghim trong chuỗi 2 ≥512.000 kB (xem phụ lục log gốc — T9 không liệt kê tay 27 mốc để tránh sai như F-169-T9-9).

### 2.2 Balloon virtio — E-173 KẾT THÚC trong khoảng mù (GIỮ 57 mẫu) + E-174 MỚI (47 mẫu, 2 chuỗi, 1 sag NÔNG, ĐANG GHIM lúc đóng)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #79 (5df1871f): GHIM TRẦN 47/121 mẫu (38,8%), trong 2 chuỗi — 1 EPISODE MỚI (E-174, KHÔNG tách — xem phán dưới).**
  - Leo lên trần trên boot #79: từ 11:38:04Z (5.681.512 kB, 88,2% trần) xả xuống 3.405.348 kB (52,8% trần) lúc 12:00:04Z rồi leo lại tới ghim lúc 12:48:06Z trong ~48 phút.
  - **E-174 — chuỗi 1: 12:48:06–12:58:06Z, 11 mẫu** (RAM 449.220–510.452 kB; gate A ĐÓNG cả 11 mẫu).
  - **Sag 12:59:06–13:02:06Z, 4 mẫu — NÔNG:** balloon tụt khỏi trần xuống tối thiểu **6.050.608 kB (93,9% trần)** lúc 12:59:06Z rồi leo lại tới 6.372.292 kB (98,9% trần) lúc 13:02:06Z; **gate A ĐÓNG cả 4 mẫu** (RAM cao nhất trong sag 867.720 kB < 1.048.576 kB — 4 mốc: 12:59:06Z 867.720; 13:00:06Z 818.368; 13:01:06Z 684.816; 13:02:06Z 587.572 — T9 liệt kê đủ 4 mốc để T10 kiểm lại).
  - **E-174 — chuỗi 2: 13:03:06–13:38:07Z, 36 mẫu** (RAM 445.712–569.996 kB; gate A ĐÓNG cả 36 mẫu) — **vẫn ghim lúc T9 đóng cờ**.
  - **E-174 ĐANG GHIM lúc đóng — kết cục thuộc đợt sau (T9-171).** T9 không claim E-174 sẽ kéo dài bao lâu hay đứt lúc nào.
  - **Tổng E-174 tới lúc đóng: 47 mẫu ghim / 2 chuỗi / 1 sag / 1 boot (#79).**
- **E-173 — KẾT CỤC: GIỮ 57 mẫu, KHÔNG cộng thêm.** E-173 ghim cuối 10:54:11Z trên #78 (đợt 169); khoảng mù giữa hai đợt **2.633 s (10:54:11Z → 11:38:04Z)** có **MỘT reboot (#79 btime 11:11:05Z)**. Balloon trên #79 lúc T9 mở (11:38:04Z) đã 5.681.512 kB (88,2% trần) và **KHÔNG chạm trần lần nào cho tới 12:48:06Z** — E-173 đã kết thúc trong khoảng mù (xem §2.2 đợt 169: E-173 đang ghim lúc đóng đợt 169). Thời điểm đứt thật nằm trong (10:54:11Z, 11:38:04Z] — T9 không claim cụ thể.
- **Tổng ghim trần đợt này: 47/121 mẫu (38,8%)** (đợt 169: 60/132 = 45,5%; đợt 168: 60/135 = 44,4%; đợt 167: 20/128 = 15,6%; đợt 166: 55/123 = 44,7%; đợt 165: 58/134 = 43,3%; đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **1 episode mới trong đợt 170 (E-174: 47 mẫu, 2 chuỗi, 1 sag, đang ghim)** + E-173 GIỮ 57 mẫu (kết thúc trong khoảng mù) + E-172 GIỮ 3 mẫu + E-171 GIỮ 12 mẫu + E-170 GIỮ 48 mẫu + E-169 GIỮ 20 mẫu.
- **Phán theo quy tắc quyết (e)/(g) + mẫu T10-166 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-174 là 1 EPISODE DUY NHẤT (47 mẫu / 2 chuỗi / 1 sag), KHÔNG tách thành 2 episode (11 + 36 mẫu).** Căn cứ: sag giữa hai chuỗi **NÔNG** (balloon tối thiểu 93,9% trần — nông hơn cả sag của E-169 đợt 167: 89,9% trần, vốn đã được phán là 1 episode) **VÀ gate A ĐÓNG cả 4 mẫu trong sag** (E-169: gate A ĐÓNG suốt span 50 mẫu → 1 episode). Quy tắc mẫu T10-166 ("dip nông + gate A không mở trong dip → KHÔNG tách") yêu cầu CẢ HAI điều kiện — đợt này cả hai đều THỎA, nên KHÔNG tách. Đối chiếu ngược: E-172/E-173 đợt 169 bị tách vì sag SÂU (78,3%) + gate A MỞ 10/27 — cả hai điều kiện đều KHÔNG thỏa ở đó. T9 trình đủ dữ kiện sag (4 mốc, balloon min 6.050.608 kB, gate A 0/4) để T10/parent kiểm lại hoặc phán ngược.
  - **Đợt 170 = 1 EPISODE GHIM MỚI (E-174: 47 mẫu, 2 chuỗi, 1 sag, đang ghim)** + E-173 GIỮ 57 mẫu (kết cục trong khoảng mù).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-174 chỉ ~445–570.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối chuỗi ghim E-174 (13:38:07Z): tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 449.464 kB (log thật).

### 2.3 Lượt yên WebKit #39 (T4, đợt 170) — CÓ LƯỢT HỢP LỆ, CHUỖI LÊN 34 (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-170 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND170_T4_WEBKIT_QUIET39_LIMITS.md`) + cờ `round170-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **#39 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 34 (33 → 34).**
- **Attempt1-5df1871f (11:55:26–11:59:18Z): probe 20/20, lớp B 5/5 SẠCH, tickCost median 40,0 ms ≤ 60 — HỢP LỆ ngay lần thử đầu trên boot #79.** Poller thoát 11:59:18Z vì LUOT HOP LE (trước hạn cắt poller 13:30Z 1h30m42s). Ngân sách dùng 1/3. Không reboot trong phiên. Không có attempt2/attempt3.
- **Poller — 22 poll thật (1 test + 21), RAM ≥1024: 22/22, RAM <500: 0/22** — gate0 đường (a) chuẩn (cờ T5-170 POSTBOOT_PASS viết 11:49:14Z, replay-đầy-đủ, poll=0); gate0 đường dự phòng T4-check-only đạt từ poll #9 (11:46:23Z) nhưng load5 chặn cửa tới poll #21.
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1-#79: gate A MỞ **4/4 mẫu** trong cửa sổ (11:56:04Z 1.714.612; 11:57:04Z 1.884.924; 11:58:04Z 1.771.568; 11:59:04Z 1.810.444 — cả 4 đều ≥1024 MiB; load1 1,92 / 1,63 / 0,60 / 0,72 — xem script analyze — window() đếm 4 mẫu trong [11:55:26, 11:59:18Z]).
  - Tải: sampler load1 trong cửa sổ attempt1 **0,60–1,92**; **0 spike B2 trong cửa sổ attempt1** (khác đợt 169: 6 spike B2 trong cửa sổ attempt1 — lượt nhiễm).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cửa sổ attempt1** (khớp T4: "RAM <500 MB: 0/22 poll — SẠCH").
  - Balloon trong cửa sổ attempt1: 4.219.320–4.642.540 kB (65,5–72,0% trần), **0 mẫu ghim**.
- **Cộng dồn (theo T4-170): chuỗi lượt yên hợp lệ LÊN 34; cộng dồn 34 lượt hợp lệ: P1 132/135, P2 126/126, P3-A1 114/135, P3' 99/107 occ = 91/94 distinct-seq, P7 68/68.** T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- **Lưu ý F-170-T9-9 (phân tích T4 trong cửa sổ attempt — xem §6):** 9/10 file output analyze của T4 có mtime 11:58:53–11:59:18Z (trong cửa sổ poller 11:55:26–11:59:18Z) NHƯNG probe pass cuối (pass 20/20) đã kết thúc 11:56:50Z — phân tích chạy 2m03s SAU khi đo xong, trong giai đoạn tính verdict (class B 11:58:53Z → poller thoát 11:59:18Z). Không có spike B2 nào trong cửa sổ; load1 sampler trong cửa sổ 0,60–1,92; T4 sampler load1 max 2,28. T9 chỉ trình dữ kiện + mốc giờ để T4/T10 phán wording — không phán verdict attempt1 đúng/sai.
- T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu. B4 attempt1: dpkg delta 0 (1545→1545) theo T4 — baseline đã gồm replay apt host-side (xem §2.5, F-170-T9-4).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 / O8 / harness (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| Attempt1 11:55:26–11:59:18Z | #79 | 0,60–1,92 (4 mẫu) | 1.714.612–1.884.924 kB — **gate A MỞ 4/4** | T4 attempt1 — **0 spike B2 trong cửa sổ**; attempt1 HỢP LỆ (lớp B 5/5 + tickCost median 40,0) |
| O8 12:08:45–12:11:21Z | #79 | 2,10–3,99 (3 mẫu) | 1.094.084–1.532.732 kB — **gate A MỞ 3/3** | T8 O8 — **3 spike B2 trong cửa sổ** (12:09:53Z WebKit attempt2; 12:10:28Z Chromium clicktest-headed; 12:11:04Z Chromium renderer — đều là process của chính O8, xem §2.5); O8 PASS 3/3 |
| Harness 12:11:59–12:41:23Z | #79 | 0,12–2,74 (30 mẫu) | 263.132–1.823.680 kB — **gate A MỞ 6/30** | T8 harness — **0 spike B2 trong cửa sổ**; harness 5/6 + kẹt thật 84l10 (xem dưới) |
| Kẹt 84l10 12:12:02–12:27:03Z | #79 | 0,12–1,34 (15 mẫu) | 263.132–1.823.680 kB — **gate A MỞ 4/15** | T8 kẹt thật WebKit 84l10 W2-setup — **0 spike B2 trong cửa sổ kẹt**; RAM rơi đơn điệu 1.823.680 → 263.132 kB (12:12–12:25Z) rồi hồi 632.540 kB lúc 12:26:05Z; balloon 4.807.460 → 6.227.012 kB (96,6% trần); load1 max 1,34 — kẹt xảy ra khi tải THẤP |

### 2.5 B2 — 19 spike THẬT, 18/19 QUY ĐƯỢC DRIVER CỤ THỂ, 1 load1 dư (3 spike TRONG cửa sổ O8 — đều do process của chính O8; 0 spike trong attempt1/harness; 0 spike trong span ghim E-174)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-170-T9-8). **19 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 19, `grep '=== SPIKE'` không neo cũng = 19 — KHÔNG lặp F-166-T9-3): 16 spike bão mở đợt #79 (11:39:05–11:48:47Z); 3 spike trong cửa sổ O8 (12:09:53–12:11:04Z); 0 spike sau 12:11:04Z tới đóng; 0 spike trong span ghim E-174 (12:48:06–13:38:07Z, 47 mẫu).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — bão mở đợt #79 (16 spike) | 11:39:05–11:48:47Z | 3,36 → 8,61 → 3,51 | 16 | 11:39:05Z: grep -rl e298bb52 delta **20** + find delta **15** + hatch daemon 22; 11:39:40Z: grep 4896 delta **24** + daemon 28; 11:40:14Z: grep 4896 delta **17** + daemon 9; 11:40:50Z: tsc node delta **97**; 11:41:25Z: **load1 dư** (xem dưới); 11:43:00Z: mask_anim delta **92** + blind9696-investigate delta 19; 11:43:36Z: **ffmpeg delta-miss** (127,3% tức thời) + mask_anim 82,8% tích lũy — delta-miss ×2; 11:44:09Z: mask_anim delta **95** + blind9696 16; 11:44:44Z: **apt-get delta-miss** (100% tích lũy, 40,0% tức thời — replay os-intent host-side); 11:45:18Z: **ffmpeg delta-miss** (64,7% tức thời) + apt-get delta 13; 11:45:53Z: **ffmpeg delta-miss** (100,0% tức thời, testsrc2 red) + apt-get delta 0; 11:46:28Z: ffmpeg testsrc2 geq 1280x720 delta **102**; 11:47:02Z: ffmpeg testsrc2 1920x1080 delta **119**; 11:47:38Z: ffmpeg testsrc2 1920x1080 delta **108**; 11:48:13Z: **apt-get delta-miss** (98,5% tích lũy — replay os-intent); 11:48:47Z: find hole-recheck **delta-miss** (dòng delta không có giá trị — xem F-170-T9-6) + daemon 12 | **Bão mở đợt 170: T2/T0 quét file tìm boot cũ (grep e298bb52 + find) + T1 verify suite (tsc + mask_anim + ffmpeg testsrc2) + replay apt host-side (os-intent, 50 transaction) + T2 blind-investigate/hole-recheck** — nhiều luồng mở cùng lúc trên boot #79. Load1 max đợt (sampler) **8,61 lúc 11:47:04Z** (watcher bắt 8,61 lúc 11:47:02Z). **0 spike TRONG cửa sổ attempt1** (attempt1 bắt đầu 11:55:26Z, sau khi bão tan 11:48:47Z) |
| 2 — trong cửa sổ O8 (3 spike) | 12:09:53–12:11:04Z | 4,53 → 5,08 → 3,45 | 3 | 12:09:53Z: MiniBrowser delta **75** + WebKitWebProcess delta **36** (O8 WebKit attempt2, pid 41917 clicktest-webkit); 12:10:28Z: bridge node delta **26** + clicktest-headed node 100% tích lũy (delta 3 — O8 Chromium, pid 42357); 12:11:04Z: Chromium renderer delta **30** (con của clicktest-headed 42357) | **3 spike trong cửa sổ O8, đều do chính process trình duyệt của O8** (khác đợt 169: 0 spike trong cửa sổ O8). O8 vẫn PASS 3/3 (theo T8-170) — spike là tải đo lường của chính O8, không phải ô nhiễm ngoài |

- **Tổng kết đếm: 18/19 spike có driver process cụ thể + 1 spike lớp "load1 dư"** (đợt 169: 9/9 quy được + 0 load1 dư; đợt 168: 12/15 quy được + 3 load1 dư; đợt 167: 16/22 quy được + 6 load1 dư; đợt 166: 13/16 quy được + 3 load1 dư; đợt 165: 15/18 quy được + 3 load1 dư; đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư). Đợt này tỉ lệ load1 dư 1/19 = 5,3%.
- **Spike load1 dư duy nhất — 11:41:25Z (load1 3,78):** top -b tức thời chỉ có hatch daemon 40,0% + privsep+ 10,0%; CPU 92,9% idle; delta lớn nhất 8 tick (daemon); node test binOrphan60Q7.test.ts delta 1; D-state 0. Đây là **đuôi load-average của burst tsc** (spike trước 11:40:50Z: tsc delta 97, top -b 81,8%) — tsc đã thoát trước 11:41:25Z nhưng load1 (trung bình trượt 1 phút) vẫn 3,78. T9 quy lớp load1 dư, không gán driver giả.
- **Caveat đếm (F-170-T9-5):** 6 spike delta-miss (spike 11:43:36Z: ffmpeg 21290 + mask_anim 21270; spike 11:44:44Z: apt-get 22737; spike 11:45:18Z: ffmpeg 24562; spike 11:45:53Z: ffmpeg 26787; spike 11:48:13Z: apt-get 33524; spike 11:48:47Z: find 33805 — dòng delta in ra KHÔNG có giá trị, xem F-170-T9-6) — quy driver bằng ps top tích lũy + top -b tức thời, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164), F-165-T9-6 (2 spike đợt 165), F-166-T9-6 (4 spike đợt 166), F-167-T9-6 (6 spike đợt 167), F-168-T9-10 (1 spike đợt 168) và F-169-T9-5 (4 pid / 3 spike đợt 169). Đợt này 6 spike delta-miss — nhiều nhất kể từ đợt 167 (6 spike), vì replay apt host-side chạy nhiều tiến trình apt-get ngắn ngủi (chết giữa chừng trong vòng delta 1 s). `grep -c 'WebKit\|MiniBrowser'` = **6 dòng** (1 spike: 12:09:53Z — O8 WebKit attempt2; WebKit xuất hiện trong 1/19 spike).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: 6 spike (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 18 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 18/19 spike — 1 spike lớp load1 dư đợt này.
- **Delta tick lớn nhất đợt: 119 tick/s** (ffmpeg testsrc2 1920x1080 geq, spike 11:47:02Z, load1 8,61). (Đợt 169: max 135 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 11:38:0xZ CÙNG lúc sampler — **0 khoảng mù đầu phiên đợt này** (spike đầu tiên watcher bắt được là 11:39:05Z, ~1 phút sau khi mở — trước đó load1 < 3,0; sampler load1 lúc mở 2,23). **KHÔNG có reboot giữa phiên nên KHÔNG có khoảng mù qua reboot** (khác đợt 169: gap 109 s qua reboot #78). **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg/mask_anim.py/testsrc2 xuất hiện trong 7 spike của bão mở đợt** (mask_anim ellipse + ffmpeg ffv1/testsrc2 lutrgb/geq/red — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 4 spike delta-miss — xem §2.5). **Replay apt host-side (os-intent, ppid 822) xuất hiện trong 5 spike** (11:44:44Z + 11:45:18Z + 11:45:53Z + 11:48:13Z + apt methods store/http trong 3 spike đầu 11:39:05–11:40:14Z — xem F-170-T9-4). **T2 blind9696-investigate.py xuất hiện trong 3 spike** (11:43:00Z delta 19; 11:43:36Z delta 11; 11:44:09Z delta 16 — điều tra mù, chỉ là tải phụ). **T2 hole-recheck9696.py xuất hiện trong 1 spike** (11:48:47Z — find quét /var/log). **grep -rl e298bb52 + find quét file xuất hiện trong 3 spike đầu** (11:39:05–11:40:14Z — quét tìm boot cũ #78, thuộc T2/T0). **T1 tsc xuất hiện trong 1 spike** (11:40:50Z delta 97) + đuôi load1 dư 11:41:25Z. **O8 WebKit/Chromium xuất hiện trong 3 spike** (12:09:53–12:11:04Z — chính O8, xem §2.5). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T2 điều tra/quét + T0 boot-verify + replay apt host-side + T8 O8 + hatch daemon; **6 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log — 1 spike, đã quy driver ở §2.5**).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ hai mươi bốn liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round170-t9/sampler.sh` chạy liên tục 11:38:04Z–13:38:07Z (1 instance, sống suốt phiên — KHÔNG chết theo reboot vì không có reboot giữa phiên), **121 mẫu, gap trong log đóng băng lớn nhất 61 s, 0 gap >90 s**; các gap còn lại max 61 s (đợt 169: gap 109 s qua reboot #78; đợt 168: gap 55 s qua reboot #76; đợt 167: gap 77 s qua reboot #74; đợt 166: gap 73 s qua reboot #71; đợt 165: gap 35 s qua reboot #70; đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **3.413.092 kB = 54,25% guard** (đợt 169: 49,84%; đợt 168: 52,03%; đợt 167: 40,10% — thấp nhất chuỗi; đợt 166: 69,93%; đợt 165: 58,05%; đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). Khoảng cách tới guard lúc đỉnh: **2.878.364 kB (45,75%)**.
- **Guard giữ nguyên: 6.291.456 kB (6.144 MiB).** Không mẫu nào chạm 6.144 MiB — cơ chế (a) **armed** (sampler chạy liên tục) và **KHÔNG kích hoạt** suốt 2h00m.
- **0 lần thử birefnet trong đợt 170 — lần thứ hai mươi bốn liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0; đợt 166: 0; đợt 167: 0; đợt 168: 0; đợt 169: 0; đợt 170: 0). **Chuỗi 0 lần thử: 24 đợt liên tiếp** (đợt 147–170).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 24 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round170-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `/usr/bin/python3.12` — giống đợt 169); `bgremove.py` **23.500 B** (không đổi so với đợt 169); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-170-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt.**
- **Không cần chạy lại birefnet trong đợt 170** (guard chưa từng mở; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (boot #79 = 39 dòng; tổng 39 dòng, toàn bộ thuộc về đợt 170 — đợt thứ mười chín liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#79** (5df1871f, btime 11:11:05Z): **39 dòng** (T9 đếm trực tiếp từ journal lúc đóng phiên; **không cộng số ước** — chỉ có một boot trong journal, `journalctl --list-boots` lúc đóng chỉ còn #79). Dòng đầu tiên trên #79: **11:36:23Z (boot+1518s)** — SAU khi đợt mở 11:35:51Z đúng 32 s; dòng thứ hai 11:37:33Z. Dòng cuối cùng: **12:40:43Z** — sau đó IM tới đóng (13:38:51Z) trong khi headroom về 2 và giữ 2 (xem §1.2).
- Nhịp theo headroom (xem F-170-T9-2): 2 dòng lúc probe mở 11:38:18Z → 12 dòng lúc lan-2 12:08:06Z (+10 dòng, dòng cuối 11:56:13Z) → 36 dòng lúc lan-3 12:38:06Z (+24 dòng, dòng cuối 12:37:13Z) → 39 dòng lúc lan-4 13:08:06Z (+3 dòng, dòng cuối 12:40:43Z) → 39 dòng lúc lan-5 13:38:06Z và lúc đóng 13:38:51Z (+0 dòng). **ENOSPC chạy đúng nhịp headroom dao động: tăng mạnh trong lúc headroom 0, im hẳn khi headroom giữ 2.**
- **Tổng đợt 170: 39 dòng đếm được — toàn bộ thuộc về đợt 170** (dòng đầu tiên 11:36:23Z đã SAU khi đợt mở 11:35:51Z; 0 dòng thuộc về khoảng trước khi đợt mở). **Không phải cận dưới theo nghĩa mất journal** (chỉ một boot, journal còn nguyên từ 11:11:16Z) — nhưng vẫn là số đếm được tại các mốc kiểm tra, không phải số tuyệt đối nếu journal xoay (T9 ghi rõ để T10 không đọc nhầm thành "chắc chắn chỉ có 39 dòng").
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 169: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 169:** đợt 169 có ≥54 dòng (boot #77 ≥30 + boot #78 24). Đợt này **39 dòng** — thấp hơn đợt 169 đúng 15 dòng, vì chỉ có MỘT boot #79 và ENOSPC dừng sau 12:40:43Z trong khi headroom về 2 (cùng mẫu đợt 168/169: ENOSPC dừng, headroom 2). Đợt này là đợt có ENOSPC đếm được THẤP NHẤT kể từ đợt 156 (đợt 156 ghi ≥39 dòng — cận dưới; đợt 157: ≥106; đợt 158: ≥50; đợt 169: ≥54).
- **Điểm mới (giao parent/T10 xem lại quyết (g) — T9 chỉ nêu dữ kiện):** đợt này là đợt đầu tiên headroom DAO ĐỘNG 0→2→0→2 trong phiên (xem F-170-T9-2) — ENOSPC tăng vọt (+24 dòng) đúng trong khoảng headroom quay lại 0, rồi im hẳn khi headroom giữ 2. Đây là bằng chứng độc lập (ngoài probe) rằng headroom 0 là thật VÀ rằng 2 slot trống đủ để systemd ngừng lỗi.
- **Đối chiếu T5-170:** T5-170 ghi "ENOSPC #79: 11 dòng (T9 đếm chính thức)" — số 11 là số đếm tại thời điểm T5 kiểm tra (trước dòng thứ 12 lúc 11:56:13Z); số đóng băng của T9 là 39 dòng (xem F-170-T9-8). Không mâu thuẫn — chỉ khác mốc đếm.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #79 — 1 reboot TRƯỚC KHI đợt mở, 0 reboot giữa phiên (KHÁC đợt 169: 2 reboot)

- **Reboot #79 (5df1871f, btime 11:11:05Z; gap #78→#79 = 6.987 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ 24m46s** (đợt mở 11:35:51Z, boot+1486s). T0-170 xác minh 9/9 nguồn; T2-170 xác minh 7 nguồn; số hiệu #79 theo đếm tuần tự — parent xác nhận. **KHÔNG có reboot giữa phiên đợt 170** — sampler + watcher + probe-loop **SỐNG SUỐT PHIÊN** (không chết theo reboot — lần đầu tiên kể từ đợt 162 không có reboot giữa phiên làm chết loop; điểm yếu (d) đợt 148 KHÔNG tái diễn đợt này).
- **0 gap >90 s trong log đóng băng (max 61 s)** — gap lớn nhất 61,0 s (13:18:06Z → 13:19:07Z và 12:36:05Z → 12:37:06Z và 12:02:04Z → 12:03:05Z). Lần đầu tiên kể từ đợt 168 không có gap >90 s nào (đợt 169: 1 gap 109 s qua reboot #78).
- **Khoảng trống phủ sóng đầu phiên:** đợt mở 11:35:51Z (boot+1486s), T9 nhận việc ~11:37:3xZ (boot+~1590s), sampler khởi động 11:38:04Z (boot+1619s) — **gap 133 s từ lúc đợt mở tới khi sampler chạy** (đợt 169: gap 388 s; đợt 168: gap 283 s; đợt 167: gap 162 s; đợt 166: gap 179 s; đợt 165: gap 1.760 s; đợt 164: gap 383 s; đợt 163: gap 113 s). Gap đầu phiên đợt này ngắn hơn mọi đợt 164–169 (chỉ dài hơn đợt 163: 113 s) — nhưng vẫn đủ để cửa sổ thoáng (nếu có, ~boot+60–200s) đóng trước khi T9 mở (xem §1.2, F-170-T9-1).
- **Đồng hồ lúc mở ≈ Cloudflare −1 s — chuẩn** (T5-170 đo; T9 không đo lại).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T0-170 đếm 31 reboot #49–#79 — theo T0-170; T5-170 xác nhận marker còn, mtime 20/11 11:39:47Z không đổi).
- **X11 (T9 kiểm tra lúc đóng phiên 13:39Z):** `/tmp/.X11-unix/` **TRỐNG** (0 socket — T8-170 đã dọn X194/X195 lúc 12:08:43Z sau khi xác minh mồ côi; socket của chính T8 driver tự unlink; T4 đã dọn X193).

### 5.2 T5-170 (infra) — POSTBOOT_PASS #79 ĐÃ CÓ; watcher-170 ĐANG CHẠY; replay #79 CHẠY ĐẦY ĐỦ

- **POSTBOOT_PASS #79 ĐÃ CÓ lúc 11:49:14Z** (boot+38m09s — theo T5-170; replay-đầy-đủ, poll=0, verify độc lập exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269; ledger 170/170).
- **POSTBOOT_PASS #78 KHÔNG CÓ** (boot thứ 14 lọt — không bù được, theo T5-170). **POSTBOOT_PASS #77/#75 vẫn có, còn hiệu lực.**
- **Watcher-170: START 11:42:42Z, pid 20516, ALIVE lúc T5 đóng cờ (11:53Z)** — khoảng không-watcher **8.873 s = 2h27m53s** (poll cuối watcher-169 09:14:49Z → START watcher-170 11:42:42Z — theo T5-170). **Watcher-169 CHẾT theo #78** (pid 25426, 57 poll — theo T5-170). T9 xác minh lúc đóng: watcher-170 pid 20516 vẫn trong ps (thấy trong snapshot B2 lúc 11:48:47Z — bash replay-watch-170.sh pid 20516).
- **Replay #79 chạy đầy đủ 12m37s:** hoạt động đầu 11:35:39Z (boot+24m34s — muộn nhất từng kẹp, theo T5-170); update ~8m56s; installs 11:44:37–11:48:15Z; **50 transaction; dpkg 2 → 1545 dòng** (trước replay dpkg.log trên #79 chỉ có 2 dòng — /var/log ephemeral theo boot, xem F-170-T0-2). **Replay này là driver của 5 spike B2 đợt này (xem §2.5, F-170-T9-4).**
- **F-170-T5-1 (T5 sở hữu — T9 chỉ ghi chú tham chiếu):** poll cuối watcher-169 09:14:49Z MUỘN HƠN btime #78 (09:14:38Z) 11 s — mâu thuẫn trực tiếp; /proc/1 mtime trên #78 09:14:49.824Z cùng giây với poll cuối. Giả thuyết mạnh nhất (CHƯA CHỨNG MINH): shutdown container cũ chồng lấp. Hệ quả: poll cuối watcher KHÔNG còn là cận trên chắc chắn cho "boot cũ chết"; có thể ảnh hưởng (m) #78 (nếu btime dịch +11 s thì requeue +40,693 s → +29,7 s, NGOÀI dải 33–49,8 s) — giao T2-170 + parent đối chiếu.
- **Điều tra replay #75: ĐÃ GHI NHẬN ĐÓNG** theo quyết parent (j) đợt 169 ở mức CHƯA XÁC ĐỊNH nguyên nhân gốc + leo thang kiểm journal host-side; T5-170 KHÔNG mở lại điều tra trong cell (theo T5-170).

### 5.3 T8-170 (vite harness + O8) — ĐÃ đóng cờ (~12:52Z); O8 PASS 3/3, ĐỀ XUẤT chuỗi LÊN 22; harness 5/6 + 1 KẸT THẬT 84l10

- **T8-170 ĐÃ xuất bản LIMITS + viết cờ `round170-t8.done` (~12:52Z)** — T9 chỉ đối chiếu bằng dữ kiện sampler + B2 độc lập, không phán thay T8.
- **O8 PASS 3/3 trên boot #79** (12:08:45–12:11:21Z — WebKit 21/21 ×2 + Chromium 21/21): **3 spike B2 trong cửa sổ O8** (khác đợt 169: 0 spike trong cửa sổ O8 — xem §2.5: cả 3 đều do process của chính O8). **T8 đề xuất chuỗi WebKit FULL PASS LÊN 22 (21 → 22)** — vì lượt yên #39 hợp lệ ở attempt1 TRÊN BOOT ĐO #79 + O8 sau lượt hợp lệ TRÊN CÙNG BOOT #79 + gate (a) FOUND (poll 27 lúc 12:05:49Z) — chờ T10/parent phán.
- **Đối chiếu sampler T9 trong cửa sổ O8 (12:08:45–12:11:21Z): 3 mẫu, gate A MỞ 3/3** (12:09:05Z 1.139.860 kB; 12:10:05Z 1.094.084 kB; 12:11:05Z 1.532.732 kB), balloon 4.578.476–5.037.228 kB (71,1–78,2% trần, không ghim), load1 2,10–3,99 (sampler).
- **Harness 5/6 PASS + 1 KẸT THẬT** (12:11:59–12:41:23Z): WebKit 84l10 exit 124 KẸT (12:12:02–12:27:03Z, W2-setup runEngine:433) — **chuỗi "P3 không kẹt" 4 → 0 (ĐỨT — kẹt đầu tiên kể từ đợt 157)**; WebKit 85m4 PASS (P4-lần3 PASS lần thứ 11 liên tiếp); WebKit 86n2 PASS (P4-lần3 PASS, điểm kẹt 165 sạch đợt thứ 5; chuỗi verdict 20 → 21); Chromium 84l10/85m4/86n2 PASS. Kẹt cộng dồn 16 → 17. Đối chiếu sampler T9 trong cửa sổ harness: gate A MỞ 6/30; trong cửa sổ kẹt: gate A MỞ 4/15, RAM rơi đơn điệu 1.823.680 → 263.132 kB, balloon 4.807.460 → 6.227.012 kB, load1 0,12–1,34, **0 spike B2** (xem §2.4).
- **(1c') (c') đã triển khai diag-only — 0 kích hoạt, 0 FP (T8-170 sở hữu; T9 không kiểm tra triển khai).** Replay sau harness: C5.1 ĐẠT — TRIGGER 125 s trên log kẹt 164; 0 FP trên 7 log sạch 163/165/166/167/168/169/170. (c') ĐƯỢC GIỮ. Lưu ý phạm vi: (c') chỉ giám sát 85m4 — kẹt 84l10 ngoài phạm vi, 0 kích hoạt không phải false-negative (F-170-T8-7).
- **H3: VẪN MỞ, chỉ giám sát thụ động** (theo T8-170 — kẹt mới 84l10 W2-setup cùng họ H3; điều kiện mở điều tra H3 theo quyết (i) đợt 158 KHÔNG đạt vì 85m4 P4-lần3 PASS lần thứ 11). T9 đối chiếu: RAM rơi trong lúc kẹt NHƯNG WebKitWebProcess RSS GIẢM 348.676 → 291.372 KB (theo T8-170) — H3-D1 vẫn BÁC BỎ; avail rơi do balloon host tăng (sampler T9: balloon 4.807.460 → 6.227.012 kB trong lúc kẹt).

### 5.4 T7-170 (scheduler) + T2-170 + T0-170 — T7 CHƯA đóng cờ lúc T9 đóng; run 169 SUCCEEDED, (m) #78 DƯƠNG, (m) #79 KHÔNG PHẢI ĐIỂM

- **T7-170 CHƯA xuất bản LIMITS + CHƯA viết cờ `round170-t7.done` lúc T9 đóng (13:39Z)** — T9 chỉ đối chiếu bằng dữ kiện T0/T2 đã xuất bản, không phán thay T7. Theo T7 NOTES: run 170 đang chạy (T9 không trích số — thuộc T7-170/T10).
- **Run 169 SUCCEEDED 11:17:44Z theo DB** (theo T2-170/T0-170: wall gốc 9.713 s; margin 1.087 s tới hạn 11:35:51Z; claimed→finished 35 s — NGOÀI họ 6–11 s; ca đầu tiên kể từ 108 s của run 167; 2 lần viết lại — lần 1 tại #78, lần 2 tại #79); **#79 viết lại run 169 lần 2** (started_at 1795338919 → 1795346116, delta 7.197 s — theo T2-170).
- **(m) #78: DƯƠNG (theo T2-170, đối chiếu độc lập):** requeue duy nhất trong cửa [09:14:38Z, 09:30:00Z] eid 10027, 09:15:18.693Z = btime +40,693 s ∈ [33; 49,8]; runs live tại btime: đúng 1 — run 169. **Nếu parent CHẤP NHẬN DƯƠNG: n 27→28 / 28→29.** Caveat lệch khung (theo T2-170): các neo trái chiều (btime 40,693 s TRONG; /proc/1 28,869 s + poll cuối 29,693 s DƯỚI; sampler cuối 58,693 s TRÊN) — verdict theo quy tắc đứng + tiền lệ #71, parent quyết. **Cộng thêm F-170-T5-1 (xem §5.2): nếu btime #78 dịch +11 s thì requeue +40,693 s → +29,7 s, NGOÀI dải** — T9 chỉ ghi chú, không phán (m).
- **(m) #79: KHÔNG PHẢI ĐIỂM** (theo T2-170: requeue duy nhất trong cửa [11:11:05Z, 11:30:00Z] eid 10054, 11:15:16.007Z = btime +251,007 s — NGOÀI dải 201,207 s trên biên; runs live tại btime: đúng 1 — run 169). **n không đổi vì #79.**
- **(m) #56 vẫn có điều kiện** (theo T2-169 — thuộc T2-170; T9 không trích số — thuộc T2-170/T10).
- T7-170 đóng cờ sau T9 (nếu có) — T9 không chờ T7 (hạn cờ T9 ~14:00Z).

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc 13:39Z (7/9)** — T7 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T0-170:** reboot #79 xác minh 9/9 nguồn (btime 11:11:05Z, epoch 1795345865.03; gap #78→#79 = 6.987 s); marker sống qua 31 reboot #49–#79; **F-170-T0-1: T10-169 khẳng định sai "boot lúc đóng e298bb52, không reboot mới" — reboot #79 xảy ra 226 s TRƯỚC khi file .done/GAP của T10 được viết (11:14:51Z); GAP §98 cần đính chính.** T9 không trích số khác — thuộc T0-170/T10.
- **T1-170:** verify đợt 169 (T9 không trích số — thuộc T1-170/T10).
- **T6-170:** prune lần 45 (T9 không trích số — thuộc T6-170/T10).
- **T4-170:** xem §2.3 (LIMITS đã xuất bản).
- **T2-170:** xem §5.4 (LIMITS đã xuất bản).

## 6. Sai số / caveat (F-170-T9-*)

- **F-170-T9-1 — Cửa sổ thoáng sau reboot KHÔNG quan sát được LẦN THỨ BA LIÊN TIẾP (đợt 168 + 169 + 170) — nhưng lần này KHÔNG THỂ quan sát được theo cấu trúc, không phải do T9 tới muộn trong phiên.** Reboot #79 btime 11:11:05Z; đợt mở 11:35:51Z = boot+1486s (T9 nhận việc ~11:37:3xZ, sampler 11:38:04Z = boot+1619s, probe mở 11:38:18Z = boot+1633s). ENOSPC đầu tiên 11:36:23Z = boot+1518s (sau khi đợt mở 32 s). Nếu cửa sổ thoáng tồn tại thì nó nằm trong ~boot+60–200s (11:12–11:15Z) — trước khi đợt mở 21–24 phút; không một luồng nào của đợt 170 có mặt lúc đó (T0-170 ghi "cửa sổ chết #78 = (11:08:54Z, 11:11:05Z] = 131 s" cho khoảng trước #79; cửa sổ #79 tương tự nằm trong khoảng mù giữa hai đợt). T9 ghi đúng mốc đo, không claim cửa sổ có mở hay không. Đây là dữ kiện mới (lần đầu tiên trong 3 đợt không quan sát được mà reboot xảy ra TRƯỚC khi đợt mở), không phải lỗi đo.
- **F-170-T9-2 — Headroom DAO ĐỘNG 0→2→0→2 trong phiên — lần đầu tiên headroom quay lại 0 sau khi đã lên 2.** Dãy đo: 0,0 (11:38:18Z) → 2,2 (12:08:06Z) → 0,0 (12:38:06Z) → 2,2 (13:08:06Z) → 2,2 (13:38:06Z) → 2,2 (13:38:51Z). ENOSPC chạy đúng nhịp: +10 dòng (11:38–12:08Z) → +24 dòng (12:08–12:38Z, dòng cuối 12:37:13Z — 53 s trước probe lan-3) → +3 dòng (12:38–13:08Z, dòng cuối 12:40:43Z) → +0 dòng (sau 12:40:43Z). T9 ghi tương quan (2 slot ngoài cell được nhả rồi lấy lại), không phán cơ chế hay actor ngoài cell. Giá trị ĐÓNG vẫn là 2 → chuỗi dưới ngưỡng lên 30 (không đứt). T10/parent lưu ý khi đọc "chuỗi 30 lần": trong phiên có 2 lần đo về 0 sau khi đã lên 2 — sàn 0–2 không còn là "lên 2 rồi giữ" như đợt 168/169.
- **F-170-T9-3 — E-174 phán 1 EPISODE (47 mẫu / 2 chuỗi / 1 sag) theo quy tắc mẫu T10-166 — giao T10 xác nhận cách đếm.** Sag 12:59:06–13:02:06Z, 4 mẫu: balloon tối thiểu 6.050.608 kB = 93,9% trần; gate A ĐÓNG cả 4 mẫu (RAM cao nhất trong sag 867.720 kB). Cả hai điều kiện "không tách" đều THỎA (sag nông + gate A đóng) — nông hơn cả E-169 đợt 167 (89,9% trần, gate A đóng → 1 episode). Đối chiếu ngược: E-172/E-173 đợt 169 bị tách vì sag SÂU (78,3%) + gate A MỞ 10/27. Nếu T10/parent phán ngược (tách thành E-174 11 mẫu + E-175 36 mẫu), tổng số episode đợt 170 đổi 1 → 2 nhưng tổng mẫu ghim 47 không đổi.
- **F-170-T9-4 — Replay apt host-side (os-intent) chạy TRONG phiên đợt 170 và là driver của 5 spike B2 + viết 1.543 dòng dpkg.log — NHƯNG attempt1 KHÔNG bị ô nhiễm.** Replay #79 (theo T5-170): chạy đầy đủ 12m37s, hoạt động đầu 11:35:39Z, update ~8m56s, installs 11:44:37–11:48:15Z, 50 transaction, dpkg 2 → 1545 dòng. B2: apt-get (ppid 822, os-intent) xuất hiện trong 5 spike (11:44:44Z 100% tích lũy; 11:45:18Z delta 13; 11:45:53Z delta 0; 11:48:13Z 98,5% tích lũy; + apt methods store/http trong 3 spike đầu 11:39:05–11:40:14Z). T4 attempt1 bắt đầu 11:55:26Z — SAU khi replay kết thúc 11:48:15Z (7m11s sau); B4-baseline của T4 (1545 dòng) đã gồm toàn bộ dòng replay viết; dpkg delta trong cửa sổ attempt1 = 0 (theo T4-170). T9 xác minh độc lập: 0 spike B2 trong cửa sổ attempt1; sampler load1 trong cửa sổ 0,60–1,92. Replay là hoạt động host-side (hatch os-intent), không phải probe của bất kỳ luồng nào — T9 không chạy probe chạm dpkg (0 lần). Khác F-169-T9-6 (script analyze của T4 trong cửa sổ attempt1 đợt 169): lần này actor là host, quy mô lớn hơn (1.543 dòng dpkg), nhưng thời điểm nằm ngoài cửa sổ attempt nên không ảnh hưởng verdict.
- **F-170-T9-5 — 6 spike delta-miss trong 19 spike (nhiều nhất kể từ đợt 167).** Các spike 11:43:36Z (ffmpeg 21290 + mask_anim 21270), 11:44:44Z (apt-get 22737), 11:45:18Z (ffmpeg 24562), 11:45:53Z (ffmpeg 26787), 11:48:13Z (apt-get 33524) — driver quy bằng ps-top tích lũy + top -b tức thời (ffmpeg 127,3% / 64,7% / 100,0%; apt-get 40,0% tức thời). Nguyên nhân: replay apt chạy nhiều tiến trình apt-get ngắn ngủi + ffmpeg testsrc2 ngắn — chết giữa chừng trong vòng delta 1 s. **Không lặp F-169-T9-5 về số lượng** (đợt 169: 4 pid / 3 spike; đợt này: 6 spike) — T9 ghi rõ để T10 không đếm nhầm thành "6 spike không quy được driver" (cả 6 đều có driver cụ thể qua top -b).
- **F-170-T9-6 — Dòng delta của find pid 33805 (spike 11:48:47Z) in ra KHÔNG có giá trị delta_ticks_1s (biến thể delta-miss mới).** Dòng log verbatim: `pid=33805 comm=find /home/hatch /var/log -type f -newermt @1795203179 ! -newermt @1795348500 -p` — không có hậu tố `delta_ticks_1s=`. Driver vẫn quy được: ps-top 10,7% tích lũy + top -b D-state 9,1% tức thời + parent python3 hole-recheck9696.py (T2). Giả thuyết: find chết giữa hai lần đọc /proc/<pid>/stat trong vòng delta 1 s (cùng họ delta-miss) — nhưng watcher script có guard `[ -n "$a" ] && [ -n "$b" ]` lẽ ra phải bỏ qua cả dòng; dòng vẫn in ra không có giá trị là bất thường nhỏ của script, T9 ghi lại để T10 biết (không ảnh hưởng attribution — driver đã rõ).
- **F-170-T9-7 — Lệnh đóng phiên của T9 tự giết shell của chính mình bằng `pkill -f 'bash sampler.sh'` (SIGTERM) — 0 mất dữ liệu, đóng băng phải làm lại bằng PID chính xác.** Lệnh `pkill -f 'bash sampler.sh'` khớp cả dòng lệnh của chính exec wrapper (vì wrapper chứa chuỗi "bash sampler.sh" trong `-c`), nên shell bị SIGTERM ngay sau khi pkill giết sampler (mẫu cuối sampler 13:38:07Z đã có; cặp probe đóng 13:38:51Z đã ghi xong vào headroom-log.txt TRƯỚC lệnh pkill). T9 phát hiện ngay sau đó, kiểm tra lại từ disk: sampler đã dừng, probe-loop đã kết thúc bình thường ("probe-loop done 13:38:06Z"), chỉ còn b2-watcher (pid 2339) — giết bằng PID chính xác rồi đóng băng 3 log (md5 ở phụ lục). Bài học: không bao giờ `pkill -f` với pattern xuất hiện trong chính dòng lệnh của mình — giết bằng PID chính xác (lấy qua `pgrep -f 'sampler[.]sh'` với bracket-trick) hoặc `kill %1` trong shell sở hữu job.
- **F-170-T9-8 — T5-170 ghi "ENOSPC #79: 11 dòng" trong khi số đóng băng của T9 là 39 dòng — đã đối chiếu, KHÔNG mâu thuẫn.** T5 đếm tại thời điểm kiểm tra của T5 (trước dòng thứ 12 lúc 11:56:13Z); số đếm của T9 theo mốc probe: 2 (11:38:18Z) → 12 (12:08:06Z, dòng cuối 11:56:13Z) → 36 (12:38:06Z, dòng cuối 12:37:13Z) → 39 (13:08:06Z, dòng cuối 12:40:43Z) → 39 (13:38:06Z + đóng 13:38:51Z). Số 39 là số đếm được tại lúc đóng; T9 trình cả dãy mốc để T10/parent không đếm trùng.
- **F-170-T9-9 — 9/10 file output analyze của T4 có mtime 11:58:53–11:59:18Z (trong cửa sổ poller 11:55:26–11:59:18Z) NHƯNG probe pass cuối đã kết thúc 11:56:50Z — phân tích chạy SAU khi đo xong, không chồng lấn pass nào.** Mốc giờ (từ log + stat, T9 kiểm tra độc lập): pass 20/20 kết thúc 11:56:50Z ("partial JSON đã ghi: 20/20 pass"); class B đánh giá 11:58:53Z; 9 file analyze (c2coverage, c2drawlog, labellag, lag5, perpass, skiplatest, stall, tickcost, wallbands) mtime 11:58:53–11:59:18Z; p1p3p7.txt mtime 12:00:55Z (sau cửa sổ); poller thoát 11:59:18Z vì LUOT HOP LE. Bằng chứng tải: 0 spike B2 trong cửa sổ attempt1; sampler T9 load1 trong cửa sổ 0,60–1,92 (max lúc 11:56:04Z — trong lúc pass chạy); T4 sampler load1 max 2,28. Kết luận của T9: **không có dấu hiệu ô nhiễm đo** (khác F-169-T9-6: script analyze đợt 169 chạy TRONG lúc pass attempt1 còn chạy, 12–47 s trước khi attempt1 hết). Wording "không chạy script nào" trong F-170-T4-5 của T4 là chưa chính xác theo nghĩa đen (file output được viết trong cửa sổ poller) — câu chính xác là "không chạy script nào TRONG LÚC probe pass chạy". Giao T4/T10 phán wording vs verdict attempt1; T9 không phán verdict đúng/sai.
- **F-170-T9-10 — Số RAM min của T8 (247 MB @12:25:29Z) và của T9 (263.132 kB @12:25:05Z) cùng một trũng, khác cadence lấy mẫu — không mâu thuẫn.** Sampler T9 cadence 60 s: mẫu 12:25:05Z = 263.132 kB (257,0 MiB); sampler T8 (n=59, cadence ~30 s trong harness) bắt được 247 MB @12:25:29Z — 24 s sau mẫu của T9, trong cùng nhịp rơi đơn điệu 12:12–12:25Z (sampler T9: 12:24:05Z 277.196 kB → 12:25:05Z 263.132 kB → 12:26:05Z 632.540 kB — hồi sau khi balloon xả). T9 không tranh số của T8; cả hai cùng chứng minh trũng RAM sâu nhất kể từ đợt 165 xảy ra trong lúc kẹt 84l10.
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được — đợt này không quan sát được cửa sổ nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC từ cell vì journalctl chỉ còn boot hiện tại sau reboot (cùng họ EPERM như `dmesg` — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 170 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).

---

## Phụ lục — log sampler đóng băng (121 mẫu, 11:38:04Z–13:38:07Z)

Nội dung dưới đây được tạo BẰNG SCRIPT từ `hidden_files/round170-t9/ram-sampler-FROZEN.log` (md5 `3a463b5bac04e08a59f5d109e5989d22`) — không gõ lại bằng tay (xem F-169-T9-9).

```
2026-11-22T11:38:04Z boot=5df1871f mem=1197148 bal=5681512 swapfree=923068 load1=2.23
2026-11-22T11:39:04Z boot=5df1871f mem=1600128 bal=5189588 swapfree=873220 load1=3.36
2026-11-22T11:40:04Z boot=5df1871f mem=2175064 bal=4599764 swapfree=874748 load1=4.67
2026-11-22T11:41:04Z boot=5df1871f mem=1492456 bal=4826392 swapfree=869792 load1=3.85
2026-11-22T11:42:04Z boot=5df1871f mem=1619060 bal=5035280 swapfree=873204 load1=2.95
2026-11-22T11:43:04Z boot=5df1871f mem=1856496 bal=4771436 swapfree=853480 load1=3.99
2026-11-22T11:44:04Z boot=5df1871f mem=2492376 bal=4181612 swapfree=854408 load1=7.08
2026-11-22T11:45:04Z boot=5df1871f mem=2725184 bal=3788396 swapfree=851468 load1=6.45
2026-11-22T11:46:04Z boot=5df1871f mem=2460212 bal=4016736 swapfree=847304 load1=7.34
2026-11-22T11:47:04Z boot=5df1871f mem=2244224 bal=4243620 swapfree=842804 load1=8.61
2026-11-22T11:48:04Z boot=5df1871f mem=1985288 bal=4483136 swapfree=835920 load1=4.74
2026-11-22T11:49:04Z boot=5df1871f mem=1986588 bal=4728596 swapfree=835356 load1=3.02
2026-11-22T11:50:04Z boot=5df1871f mem=1806324 bal=4958224 swapfree=803788 load1=2.00
2026-11-22T11:51:04Z boot=5df1871f mem=1853624 bal=4898732 swapfree=772552 load1=2.06
2026-11-22T11:52:04Z boot=5df1871f mem=1999620 bal=4844984 swapfree=751732 load1=2.44
2026-11-22T11:53:04Z boot=5df1871f mem=2406708 bal=4124088 swapfree=715724 load1=1.25
2026-11-22T11:54:04Z boot=5df1871f mem=2362748 bal=4404008 swapfree=719820 load1=0.84
2026-11-22T11:55:04Z boot=5df1871f mem=2149452 bal=4662700 swapfree=713912 load1=0.31
2026-11-22T11:56:04Z boot=5df1871f mem=1714612 bal=4219320 swapfree=703880 load1=1.92
2026-11-22T11:57:04Z boot=5df1871f mem=1884924 bal=4422504 swapfree=708124 load1=1.63
2026-11-22T11:58:04Z boot=5df1871f mem=1771568 bal=4642540 swapfree=715672 load1=0.60
2026-11-22T11:59:04Z boot=5df1871f mem=1810444 bal=4523532 swapfree=706316 load1=0.72
2026-11-22T12:00:04Z boot=5df1871f mem=3413092 bal=3405348 swapfree=714088 load1=0.47
2026-11-22T12:01:04Z boot=5df1871f mem=3052444 bal=3758784 swapfree=714716 load1=0.24
2026-11-22T12:02:04Z boot=5df1871f mem=2741008 bal=4082260 swapfree=715000 load1=0.14
2026-11-22T12:03:05Z boot=5df1871f mem=2437900 bal=4374588 swapfree=715248 load1=0.05
2026-11-22T12:04:05Z boot=5df1871f mem=2125204 bal=4638760 swapfree=716932 load1=0.14
2026-11-22T12:05:05Z boot=5df1871f mem=1912892 bal=4875968 swapfree=718304 load1=0.37
2026-11-22T12:06:05Z boot=5df1871f mem=1719496 bal=5090772 swapfree=726144 load1=0.17
2026-11-22T12:07:05Z boot=5df1871f mem=1502944 bal=5286240 swapfree=729808 load1=0.06
2026-11-22T12:08:05Z boot=5df1871f mem=1347604 bal=5467780 swapfree=732908 load1=0.16
2026-11-22T12:09:05Z boot=5df1871f mem=1139860 bal=4988236 swapfree=649280 load1=2.10
2026-11-22T12:10:05Z boot=5df1871f mem=1094084 bal=5037228 swapfree=650376 load1=3.99
2026-11-22T12:11:05Z boot=5df1871f mem=1532732 bal=4578476 swapfree=617932 load1=3.45
2026-11-22T12:12:05Z boot=5df1871f mem=1823680 bal=4807460 swapfree=621288 load1=1.34
2026-11-22T12:13:05Z boot=5df1871f mem=1278560 bal=4976888 swapfree=621376 load1=1.01
2026-11-22T12:14:05Z boot=5df1871f mem=1210800 bal=5136264 swapfree=621616 load1=0.51
2026-11-22T12:15:05Z boot=5df1871f mem=1091744 bal=5287444 swapfree=620972 load1=0.23
2026-11-22T12:16:05Z boot=5df1871f mem=982144 bal=5427492 swapfree=623636 load1=0.45
2026-11-22T12:17:05Z boot=5df1871f mem=845776 bal=5553632 swapfree=626016 load1=0.16
2026-11-22T12:18:05Z boot=5df1871f mem=744540 bal=5669328 swapfree=638840 load1=0.12
2026-11-22T12:19:05Z boot=5df1871f mem=639632 bal=5775388 swapfree=636692 load1=0.33
2026-11-22T12:20:05Z boot=5df1871f mem=566836 bal=5872364 swapfree=620560 load1=0.53
2026-11-22T12:21:05Z boot=5df1871f mem=472592 bal=5960420 swapfree=617824 load1=0.62
2026-11-22T12:22:05Z boot=5df1871f mem=367340 bal=6032640 swapfree=614488 load1=0.57
2026-11-22T12:23:05Z boot=5df1871f mem=314872 bal=6105320 swapfree=614204 load1=0.50
2026-11-22T12:24:05Z boot=5df1871f mem=277196 bal=6167240 swapfree=609124 load1=0.55
2026-11-22T12:25:05Z boot=5df1871f mem=263132 bal=6227012 swapfree=592424 load1=0.28
2026-11-22T12:26:05Z boot=5df1871f mem=632540 bal=5846408 swapfree=577116 load1=0.93
2026-11-22T12:27:05Z boot=5df1871f mem=1210028 bal=5715360 swapfree=578332 load1=0.62
2026-11-22T12:28:05Z boot=5df1871f mem=568956 bal=5715012 swapfree=573792 load1=1.01
2026-11-22T12:29:05Z boot=5df1871f mem=524780 bal=5799820 swapfree=573972 load1=1.13
2026-11-22T12:30:05Z boot=5df1871f mem=901604 bal=5286348 swapfree=572088 load1=1.14
2026-11-22T12:31:05Z boot=5df1871f mem=834176 bal=5370116 swapfree=577104 load1=1.59
2026-11-22T12:32:05Z boot=5df1871f mem=848228 bal=5493032 swapfree=579260 load1=0.93
2026-11-22T12:33:05Z boot=5df1871f mem=757852 bal=5610488 swapfree=580716 load1=0.49
2026-11-22T12:34:05Z boot=5df1871f mem=805804 bal=5734924 swapfree=576176 load1=0.34
2026-11-22T12:35:05Z boot=5df1871f mem=1322032 bal=5564412 swapfree=573420 load1=1.04
2026-11-22T12:36:05Z boot=5df1871f mem=473252 bal=5656588 swapfree=679460 load1=1.51
2026-11-22T12:37:06Z boot=5df1871f mem=455784 bal=5751656 swapfree=656820 load1=1.93
2026-11-22T12:38:06Z boot=5df1871f mem=738044 bal=5475940 swapfree=660996 load1=2.00
2026-11-22T12:39:06Z boot=5df1871f mem=613128 bal=5381300 swapfree=658040 load1=2.74
2026-11-22T12:40:06Z boot=5df1871f mem=701912 bal=5515676 swapfree=662736 load1=1.22
2026-11-22T12:41:06Z boot=5df1871f mem=611380 bal=5643632 swapfree=688368 load1=0.50
2026-11-22T12:42:06Z boot=5df1871f mem=1112980 bal=5799436 swapfree=696408 load1=1.25
2026-11-22T12:43:06Z boot=5df1871f mem=1009220 bal=5937900 swapfree=665864 load1=1.24
2026-11-22T12:44:06Z boot=5df1871f mem=892416 bal=6068360 swapfree=661532 load1=0.45
2026-11-22T12:45:06Z boot=5df1871f mem=699608 bal=6179696 swapfree=657716 load1=0.25
2026-11-22T12:46:06Z boot=5df1871f mem=610776 bal=6283676 swapfree=657912 load1=0.15
2026-11-22T12:47:06Z boot=5df1871f mem=542984 bal=6380852 swapfree=655324 load1=0.05
2026-11-22T12:48:06Z boot=5df1871f mem=483176 bal=6443824 swapfree=656624 load1=0.02
2026-11-22T12:49:06Z boot=5df1871f mem=467928 bal=6443824 swapfree=655712 load1=0.25
2026-11-22T12:50:06Z boot=5df1871f mem=468456 bal=6443824 swapfree=656320 load1=0.13
2026-11-22T12:51:06Z boot=5df1871f mem=489844 bal=6443824 swapfree=656608 load1=0.10
2026-11-22T12:52:06Z boot=5df1871f mem=474556 bal=6443824 swapfree=653812 load1=0.15
2026-11-22T12:53:06Z boot=5df1871f mem=473164 bal=6443824 swapfree=652172 load1=0.09
2026-11-22T12:54:06Z boot=5df1871f mem=465620 bal=6443824 swapfree=652844 load1=0.09
2026-11-22T12:55:06Z boot=5df1871f mem=449220 bal=6443824 swapfree=653364 load1=0.08
2026-11-22T12:56:06Z boot=5df1871f mem=461164 bal=6443824 swapfree=653696 load1=0.16
2026-11-22T12:57:06Z boot=5df1871f mem=464544 bal=6443824 swapfree=653112 load1=0.06
2026-11-22T12:58:06Z boot=5df1871f mem=510452 bal=6443824 swapfree=642996 load1=0.36
2026-11-22T12:59:06Z boot=5df1871f mem=867720 bal=6050608 swapfree=608924 load1=0.59
2026-11-22T13:00:06Z boot=5df1871f mem=818368 bal=6168136 swapfree=616656 load1=0.21
2026-11-22T13:01:06Z boot=5df1871f mem=684816 bal=6272392 swapfree=616376 load1=0.13
2026-11-22T13:02:06Z boot=5df1871f mem=587572 bal=6372292 swapfree=616188 load1=0.18
2026-11-22T13:03:06Z boot=5df1871f mem=502144 bal=6443824 swapfree=614260 load1=0.06
2026-11-22T13:04:06Z boot=5df1871f mem=488352 bal=6443824 swapfree=617308 load1=0.11
2026-11-22T13:05:06Z boot=5df1871f mem=487076 bal=6443824 swapfree=618180 load1=0.09
2026-11-22T13:06:06Z boot=5df1871f mem=491088 bal=6443824 swapfree=618980 load1=0.08
2026-11-22T13:07:06Z boot=5df1871f mem=494752 bal=6443824 swapfree=619176 load1=0.03
2026-11-22T13:08:06Z boot=5df1871f mem=478444 bal=6443824 swapfree=623852 load1=0.08
2026-11-22T13:09:06Z boot=5df1871f mem=489144 bal=6443824 swapfree=624752 load1=0.03
2026-11-22T13:10:06Z boot=5df1871f mem=483624 bal=6443824 swapfree=625264 load1=0.01
2026-11-22T13:11:06Z boot=5df1871f mem=445712 bal=6443824 swapfree=625608 load1=0.05
2026-11-22T13:12:06Z boot=5df1871f mem=493428 bal=6443824 swapfree=625448 load1=0.02
2026-11-22T13:13:06Z boot=5df1871f mem=461484 bal=6443824 swapfree=625836 load1=0.00
2026-11-22T13:14:06Z boot=5df1871f mem=519108 bal=6443824 swapfree=615508 load1=0.29
2026-11-22T13:15:06Z boot=5df1871f mem=556464 bal=6443824 swapfree=597004 load1=0.65
2026-11-22T13:16:06Z boot=5df1871f mem=533032 bal=6443824 swapfree=600068 load1=0.24
2026-11-22T13:17:06Z boot=5df1871f mem=493556 bal=6443824 swapfree=599784 load1=0.09
2026-11-22T13:18:06Z boot=5df1871f mem=506664 bal=6443824 swapfree=599984 load1=0.06
2026-11-22T13:19:07Z boot=5df1871f mem=493292 bal=6443824 swapfree=600608 load1=0.02
2026-11-22T13:20:07Z boot=5df1871f mem=486148 bal=6443824 swapfree=609020 load1=0.01
2026-11-22T13:21:07Z boot=5df1871f mem=499040 bal=6443824 swapfree=609308 load1=0.05
2026-11-22T13:22:07Z boot=5df1871f mem=487808 bal=6443824 swapfree=610136 load1=0.02
2026-11-22T13:23:07Z boot=5df1871f mem=478508 bal=6443824 swapfree=610220 load1=0.04
2026-11-22T13:24:07Z boot=5df1871f mem=493892 bal=6443824 swapfree=610912 load1=0.01
2026-11-22T13:25:07Z boot=5df1871f mem=464652 bal=6443824 swapfree=610668 load1=0.00
2026-11-22T13:26:07Z boot=5df1871f mem=487860 bal=6443824 swapfree=611552 load1=0.05
2026-11-22T13:27:07Z boot=5df1871f mem=472024 bal=6443824 swapfree=611688 load1=0.02
2026-11-22T13:28:07Z boot=5df1871f mem=475700 bal=6443824 swapfree=611640 load1=0.00
2026-11-22T13:29:07Z boot=5df1871f mem=480380 bal=6443824 swapfree=611624 load1=0.00
2026-11-22T13:30:07Z boot=5df1871f mem=509476 bal=6443824 swapfree=611264 load1=0.27
2026-11-22T13:31:07Z boot=5df1871f mem=569996 bal=6443824 swapfree=591848 load1=0.52
2026-11-22T13:32:07Z boot=5df1871f mem=537600 bal=6443824 swapfree=595628 load1=0.22
2026-11-22T13:33:07Z boot=5df1871f mem=532044 bal=6443824 swapfree=597464 load1=0.22
2026-11-22T13:34:07Z boot=5df1871f mem=522880 bal=6443824 swapfree=597860 load1=0.08
2026-11-22T13:35:07Z boot=5df1871f mem=478916 bal=6443824 swapfree=598192 load1=0.03
2026-11-22T13:36:07Z boot=5df1871f mem=541624 bal=6443824 swapfree=650016 load1=0.63
2026-11-22T13:37:07Z boot=5df1871f mem=523472 bal=6443824 swapfree=657316 load1=0.27
2026-11-22T13:38:07Z boot=5df1871f mem=449464 bal=6443824 swapfree=661372 load1=0.17
```

---

## Phụ lục — headroom log (46 dòng, 12 lần đo hợp lệ)

Nội dung dưới đây được tạo BẰNG SCRIPT từ `hidden_files/round170-t9/headroom-log-FROZEN.txt` (md5 `387d1897aaf8daaffac0a19544827531`) — không gõ lại bằng tay (xem F-169-T9-9).

```
=== probe-mo 11:38Z boot=5df1871f tran=63747
2026-11-22T11:38:18Z
0
0
ENOSPC-count=2
ENOSPC-first: Nov 22 11:36:23 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last: Nov 22 11:37:33 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1064484 kB | Balloon:         5731736 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-2 2026-11-22T12:08:06Z boot=5df1871f tran=63747
2
2
ENOSPC-count=12
ENOSPC-last: Nov 22 11:56:13 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1357200 kB | Balloon:         5467780 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-22T12:38:06Z boot=5df1871f tran=63747
0
0
ENOSPC-count=36
ENOSPC-last: Nov 22 12:37:13 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     730652 kB | Balloon:         5475940 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-4 2026-11-22T13:08:06Z boot=5df1871f tran=63747
2
2
ENOSPC-count=39
ENOSPC-last: Nov 22 12:40:43 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     478796 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-5 2026-11-22T13:38:06Z boot=5df1871f tran=63747
2
2
ENOSPC-count=39
ENOSPC-last: Nov 22 12:40:43 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     447392 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
probe-loop done 2026-11-22T13:38:06Z
=== probe-close 2026-11-22T13:38:51Z boot=5df1871f tran=63747
2
2
ENOSPC-count=39
ENOSPC-first: Nov 22 11:36:23 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last: Nov 22 12:40:43 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     481036 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```
