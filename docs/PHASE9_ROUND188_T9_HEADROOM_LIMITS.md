# LIMITS — Phase 9 đợt 188, T9: headroom + RAM + birefnet (0 mẫu ≥ guard; E-238 kết thúc bởi reboot #111; 5 episode mới E-239–E-243; 6 spike yếu trong span ghim E-243; auto-trigger: 3 câu hỏi đã trả lời + kiểm offline 17/17; KHÔNG bật live theo quyết (o) §12.3-187)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (6/6 lần đo = 0; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 48 liên tiếp**. Quyết "chỉ theo dõi" đứng (parent (l) §12.3-187).
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** (max avail 2.544.216 kB) — guard KHÔNG mở lại. **0 lần chạy birefnet — lần thứ 42 liên tiếp** (147–188). Xem §3.
- **Auto-trigger: KHÔNG BẬT LIVE** (quyết (o) §12.3-187: live từ đợt 189 nếu dry-run đạt). **3 câu hỏi mở ĐÃ TRẢ LỜI bằng số liệu + code**: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames — đã chọn, ghi rõ); (ii) **CÓ giới hạn load1 < 4,0** (đề xuất theo số đo đợt 188); (iii) **KHÔNG "hẹn chạy sau attempt"** (chỉ chạy khi guard còn mở; lỡ thì ghi MISSED-WINDOW). Prototype cập nhật + kiểm offline **17/17 PASS**; dry-run song song 118 mẫu, 0 WOULD-FIRE. Xem §3.
- **CỬA SỔ THOÁNG #111: KHÔNG QUAN SÁT ĐƯỢC** — boot trước khi đợt mở (lần thứ năm liên tiếp tính theo boot).
- **Balloon: E-238 KẾT THÚC BỞI REBOOT #111; 5 EPISODE MỚI trên #111: E-239 (4) + E-240 (11) + E-241 (9) + E-242 (13) + E-243 (5), tất cả kết thúc bởi sag.** Tổng ghim **42/123 (34,1%)**. Sàn 6.050.608 kB lặp lại **LẦN 11**.
- **RAM: 123 mẫu, 23:45:17Z–01:47:20Z, MỘT boot (#111).** Max **2.544.216 kB**; min **411.260 kB**; mean 907.585,4 kB; gate A **42/123**. 0 gap >61 s; 0 reboot trong phiên.
- **Lượt yên #57 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt** (T4 đóng ~01:41Z). Nguyên nhân duy nhất: balloon ghim, RAM <1.024 MB trong 101/136 poll T4 (74%). Chuỗi lượt yên hợp lệ 1 → 0 (parent quyết §12.3-188 — vì parent (m)-187 đã chấp nhận #56 0 → 1). T9 đối chiếu: **0 spike trong attempt** (không có attempt nào).
- **B2: 224 spike THẬT, 5 cụm; 0 spike trong span ghim E-239–E-242; 6 spike YẾU trong span ghim E-243 (load1 3,00–3,37, leader `hatch` nền tảng — lần đầu kể từ đợt 177, xem F-188-T9-2).** 13 spike trong O8 T0; 53 spike trong cụm WebKit/ffmpeg 01:31:38–01:35:59Z (khớp mẫu harness T8 — T8-188 chưa đóng cờ lúc T9 đóng).
- **ENOSPC: đếm trực tiếp 136 dòng trên #111 (lúc đóng) — đợt thứ 37 liên tiếp có lỗi thật**; dòng đầu boot+117s (đúng mẫu ~110s); đếm lại 6 lần trong phiên (bài học F-187-T9-5 đã áp dụng).
- **0 REBOOT trong phiên; 0 khoảng tối T9** (F-187-T9-1 KHÔNG tái diễn). **T9 đóng ~01:58Z, TRONG hạn cờ ~02:00Z** (khác đợt 187 trễ ~24'). Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–187 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, một boot duy nhất.

### 1.2 Số đo đợt 188 (6 lần đo, 1 boot #111)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 23:45:48Z | **0** | #111 257c1eae | 63.747 | cặp mở (boot+35m04s) |
| 00:15:48Z | **0** | #111 | 63.747 | lan-2r (boot+1h05m04s) |
| 00:45:48Z | **0** | #111 | 63.747 | lan-3r (boot+1h35m04s) |
| 01:15:48Z | **0** | #111 | 63.747 | lan-4r (boot+2h05m04s) |
| 01:45:48Z | **0** | #111 | 63.747 | lan-5r (boot+2h35m04s) |
| 01:47:57Z | **0** | #111 | 63.747 | probe tay close-188 (boot+2h37m13s) |

- **CỬA SỔ THOÁNG #111: KHÔNG QUAN SÁT ĐƯỢC** (boot btime 23:10:44Z TRƯỚC khi đợt mở 23:35:51Z; cửa sổ mẫu boot+61–92s đã đóng ~23:12:16Z, ~33 phút trước probe đầu của T9). **Lần thứ năm liên tiếp tính theo boot không quan sát được** (2 boot đợt 186 + 3 boot đợt 187 + 1 boot đợt này — không kết luận cửa sổ có mở hay không, chỉ kết luận không đo được). Bài học F-187-T9-4 chưa khắc phục được về mặt cấu trúc: đợt này chỉ có 1 boot và boot đó đã chạy trước khi đợt mở.
- **Headroom cuối phiên: 0.** 6/6 lần đo = 0; số watch giữ ngoài cell lúc đóng: **63.747**. **Trần KHÔNG ĐỔI trong boot.**

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt gần nhất: 179 đóng 0; 180 đóng 0 (1 lần đo giữa phiên 2.903); 181 đóng 0 (toàn 0, 7 lần đo); 182 đóng 2; 183 đóng 0 (7 lần 0 + 1 lần 30.000 chạm cap giữa phiên); 184 đóng 0 (6 lần 0 + 1 lần 30.000); 185 đóng 0 (6 lần 0 + 1 lần 30.000); 186 đóng 0 (7 lần 0 — KHÔNG có lần mở chạm cap nào); 187 đóng 0 (7 lần 0 — KHÔNG có lần mở chạm cap nào); **188 đóng 0 (6 lần 0 — KHÔNG có lần mở chạm cap nào)**.

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 0.** Đợt này không có sự kiện mở 30.000 nào (cửa sổ thoáng #111 không quan sát được nên không kết luận "không mở", chỉ kết luận "không đo được lần mở nào").
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 48 liên tiếp.** Quyết parent (l) §12.3-187 GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Dữ kiện mới: 136 dòng ENOSPC đếm trực tiếp (xem §4) — đợt thứ 37 liên tiếp.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 123 mẫu, 23:45:17Z–01:47:20Z, MỘT boot #111

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **0 gap >61 s** (lớn nhất 61 s — jitter bình thường); **0 reboot trong phiên** (cùng boot_id 257c1eae suốt 123 mẫu); **gap giữa hai đợt: 34m31s không sampler T9** (23:10:46Z → 23:45:17Z — chứa reboot #111 + cửa sổ thoáng #111).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 23:45:17–00:30:18Z | #111 | 1.178.548–2.093.244 kB | Mở sampler; balloon leo 4,7M → 6,44M; **B2 cụm mở 125 spike** |
| 00:31:18–00:34:18Z | #111 | 416.772–569.388 kB | **E-239 4 mẫu ghim**; min đợt gần chạm (411.260 kB ở 00:58:19Z, trong E-241) |
| 00:39:18–00:49:19Z | #111 | 413.928–484.324 kB | **E-240 11 mẫu ghim**; sag sàn 6.050.608 |
| 00:57:19–01:05:19Z | #111 | 411.260–439.732 kB | **E-241 9 mẫu ghim**; min phiên 411.260 kB |
| 01:10:19–01:22:19Z | #111 | 414.708–526.212 kB | **E-242 13 mẫu ghim** (dài nhất đợt) |
| 01:27:19–01:31:19Z | #111 | 457.424–471.464 kB | **E-243 5 mẫu ghim; 6 spike B2 YẾU trong span** (xem F-188-T9-2) |
| 01:32:19–01:47:20Z | #111 | 980.984–2.544.216 kB | Balloon xả 5,26M → 3,71M; **cụm WebKit/ffmpeg 53 spike** 01:31:38–01:35:59Z |

- **Gate A ≥1024 MiB: 42/123 mẫu**; **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **7,88** (23:52:18Z — trong cụm mở); **RAM <512.000 kB: 45 mẫu** (36,6%; đợt 187: 11/148 = 7,4% — tỉ lệ TĂNG MẠNH vì #111 ghim nhiều); **RAM <500.000 kB: 42 mẫu**; **RAM <300.000 kB: 0 mẫu**.
- Swap: SwapFree 699.072 kB (mẫu đầu) → 574.192 kB (mẫu cuối) — giảm 124.880 kB trong phiên (không có bước nhảy qua reboot vì chỉ 1 boot).
- Trũng RAM đợt này: min **411.260 kB (00:58:19Z, #111 — trong E-241)** — sâu thứ hai trong các log T9 (kỷ lục 225.224 kB đợt 180; đợt 187: 440.232 kB). 45 mẫu <512.000 kB, 5 dải (từ script python trên log đóng băng): 00:29:18–00:33:18Z (5); 00:38:18–00:49:19Z (12); 00:55:19–01:05:19Z (11); 01:10:19–01:21:19Z (12); 01:27:19–01:31:19Z (5). Tổng 5+12+11+12+5 = 45 — KHỚP số đếm toàn phiên.

**Bảng tổng hợp số RAM (từ script `t9-188-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 123 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #111 257c1eae | 123 | 411.260 | 2.544.216 | 907.585,4 | 42/123 | 42 | 7,88 | 45 |
| **Toàn phiên** | **123** | **411.260** | **2.544.216** | **907.585,4** | **42/123** | **42/123 (34,1%)** | **7,88** | **45** |

- **Mean toàn phiên 907.585,4 kB — 2 cách độc lập: python `sum/n = 907.585,4` VÀ kiểm có trọng số của script (in `t9-188-analyze-output.txt`) — KHỚP CẢ HAI** (một boot nên hai cách trùng nhau theo thiết kế).

### 2.2 Balloon virtio — E-238 kết thúc bởi reboot #111 + 5 EPISODE MỚI E-239–E-243 trên #111

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #111** (max bal trong log = đúng CEIL; đã khẳng định từ các đợt trước).
- **E-238 (đợt 187) — KẾT THÚC BỞI REBOOT #111 (T9 phán, T10/parent quyết cuối):** 12 mẫu trên #110, vẫn ghim lúc T9-187 đóng (mẫu cuối 23:10:46Z, avail 527.692 kB, balloon CEIL); reboot #111 xảy ra 23:10:44Z (parent (e) §12.3-187 xác nhận 257c1eae = #111). **Caveat:** mù 23:10:46Z–23:45:17Z không có sampler — sag trong mù không loại trừ được (cùng caveat như E-229/E-233); đồng hồ nhanh F-187-T9-3 (T0-188 xác minh độc lập δ > 10 s trước #111 — parent (p) §12.3-187). Balloon trên boot mới lúc 23:44:11Z là 6.050.608 kB (= sàn) rồi 4.706.584 kB lúc 23:45:17Z — boot mới bắt đầu với balloon thấp, ủng hộ kết thúc bởi reboot. 12 mẫu đã tính trong tổng ghim đợt 187 — KHÔNG cộng lại đợt 188.
- **Boot #111: GHIM 42/123 mẫu (34,1%), 5 EPISODE MỚI (E-239–E-243).** Balloon leo trần lần đầu boot+80m34s (00:31:18Z).

| Episode | Span (UTC) | n | Boot | RAM (kB) | Kết thúc |
|---|---|---|---|---|---|
| E-239 | 00:31:18–00:34:18Z | 4 | #111 | 416.772–569.388 | Sag 00:35:18Z bal **6.127.480** |
| E-240 | 00:39:18–00:49:19Z | 11 | #111 | 413.928–484.324 | Sag 00:50:19Z bal **6.050.608 = SÀN** |
| E-241 | 00:57:19–01:05:19Z | 9 | #111 | 411.260–439.732 | Sag 01:06:19Z bal **6.247.216** |
| E-242 | 01:10:19–01:22:19Z | 13 | #111 | 414.708–526.212 | Sag 01:23:19Z bal **6.128.604** |
| E-243 | 01:27:19–01:31:19Z | 5 | #111 | 457.424–471.464 | Sag 01:32:19Z bal **5.264.176** |

- **Tổng ghim trần đợt này: 42/123 mẫu (34,1%)** (đợt 187: 56/148 = 37,8%; đợt 186: 21/130 = 16,2%; đợt 185: 39/122 = 32,0% — đợt này gần bằng đợt 187).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-239–E-243 đều là EPISODE MỚI (≥2 mẫu CEIL liên tiếp, sag tách rõ ≥4 mẫu). **Khoảng tách: 4, 7, 4, 4 mẫu — TẤT CẢ ≥4, TÁCH SẠCH, không có caveat đúng-3-mẫu như đợt 187** (F-187-T9-2 không tái diễn). Mẫu cuối mỗi khoảng tách chỉ thiếu 32.720 kB (gap1: 6.411.104), 29.964 kB (gap4: 6.413.860) là tới trần — gần trần nhưng vẫn dưới, theo quy tắc đứng vẫn tính là tách.
- **Sàn balloon 6.050.608 kB: GIỮ 10 → 11 lần lặp lại theo nghĩa sag-ending.** Giá trị này xuất hiện ĐÚNG 1 lần đợt này (00:50:19Z — sag kết thúc E-240, tính); 0 lần dip giữa-lúc-leo. (Ghi chú: balloon trên boot mới lúc mở phiên cũng là 6.050.608 kB lúc 23:44:11Z — đó là giá trị đo tay ngoài sampler, KHÔNG tính vào chuỗi.)
- **Giá trị sag 6.247.216 kB: xuất hiện 1 lần đợt này, là sag kết thúc episode** (01:06:19Z kết thúc E-241 — tính). Đợt 187: 2 lần (cả hai đều sag-ending).
- **Parent (h) §12.3-187: E-235/E-236 + E-237/E-238 GIỮ TÁCH** theo quy tắc cơ học đứng — phán TÁCH của T9-187 đã được parent chấp nhận; tổng ghim đợt 187 giữ 56.

### 2.3 Lượt yên WebKit #57 (T4) — KHÔNG CÓ LƯỢT HỢP LỆ — 0 ATTEMPT (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#57 KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt, 0 lần cửa yên mở** (T4 đóng ~01:41Z, trong hạn cờ). Poller chạy 138 poll thật (2 test + 136), hết hạn cắt 01:30Z, exit theo thiết kế. Nguyên nhân duy nhất: **balloon host-side ghim ~6,44 GB — RAM avail <1.024 MB trong 101/136 poll thật (74%), <500 MB trong 60/136 (min 375 MB); RAM ≥1.024 MB lần cuối ở poll #44 (00:20:39Z).** Mọi điều kiện khác đều từng xanh cùng lúc (gate0=T5 từ poll #33, apt=0, lock trống, load1/load5 <2) — chỉ thiếu RAM. Gần mở nhất: poll #33 (RAM 612, còn lại xanh), poll #45 (RAM 972 — thiếu 52 MB), poll #84 (RAM 988).
- **Chuỗi lượt yên hợp lệ: 1 → 0 (T9 đề xuất, parent quyết cuối ở §12.3-188).** Parent (m) §12.3-187 đã chấp nhận #56 0 → 1 (chuỗi KHỞI ĐỘNG LẠI, tiền lệ đợt 179); #57 0 attempt nên chuỗi đứt về 0. P3' cộng dồn GIỮ NGUYÊN 48 lượt (sổ distinct-seq giữ as-of-187, md5 ea978f23, KHÔNG thăng cấp — theo T4-188).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** gate A 42/123 (34%) — cùng hướng với T4 (101/136 poll dưới gate); 0 mẫu ghim không đúng — ngược lại, 42/123 mẫu GHIM (T4 đo theo poll 45 s nên tỉ lệ khác, cùng kết luận: RAM là nút thắt duy nhất). **0 spike B2 trong attempt** (không có attempt nào — mệnh đề rỗng, ghi rõ để T10 không hiểu lầm là "attempt yên thật"). **F-184-T4-2 KHÔNG KIỂM ĐƯỢC** (không có cửa attempt để đối chiếu RAM trước cửa).
- **Kiểm chứng live lần 8: KHÔNG ÁP DỤNG** (không có attempt hợp lệ để kiểm chứng — khác "ĐẠT" các đợt trước; parent quyết cách tính chuỗi kiểm chứng ở §12.3-188).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 00:13:00–00:15:45Z | #111 | 1,10–5,04 (3 mẫu) | 699.924–1.147.724 kB — **gate A 2/3** | **O8 T0 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); **13 spike B2**; 0 mẫu ghim |
| Cụm WebKit/ffmpeg 01:31:38–01:35:59Z | #111 | 3,56–4,66 (4 mẫu) | 980.984–1.578.928 kB — **gate A 2/4** | **53 spike B2** (ffmpeg tới 141% CPU, WebKit tới 91,6%); balloon xả 5,26M → 4,71M; T8-188 chưa đóng cờ — T10 đối chiếu |
| E-243 span 01:27:19–01:31:19Z | #111 | 0,69–3,00 (3 mẫu) | 457.424–471.464 kB — **gate A 0/3** | **6 spike B2 YẾU** (xem F-188-T9-2); 0 mẫu ghim ngoài span |

- T1-188: verify 187 PASS (chuỗi khớp lần thứ 102 — đính chính F-188-T1-2: số SAU closing 10/23/22/21 làm số cuối; lũy kế 111–187 = 758/1.317/1.145/967; chờ push 166–187 = 220/338/307/303; 0 file thiếu). T2-188: LIMITS đã có trên đĩa lúc T9 đóng (T9 không phán thay T2; T2 cũng ghi cảnh báo viết lại aggregate 186 — xem F-188-T9-6). T5-188: **POSTBOOT_PASS #111 CÓ 00:11:36Z** (repair-sớm, poll=1, CÓ caveat — GST symlink, tools chưa cài, dpkg 768); **replay #111 ĐÌNH TRỆ** (heal 23:11:21Z chỉ viết 2 dòng dpkg rồi dừng; 44' sau 0 tiến triển — thuộc §12.3-188). T6-188: **(A) 120/120 lần 38** + **#110/#111 KHÔNG GIẾT HOLDER — chuỗi 14 → 15** + prune lần 63 (xóa 2, queue 102 → 100, KHÔNG PHẢI CHỜ).
- T0-188: **#111 XÁC NHẬN 9 nguồn TƯƠI**; O8 PASS 3/3 trên #111 (00:13:00–00:15:45Z); libevent MISSING lúc survey (heal sau repair, lần 4); **F-187-T9-3 ĐÃ KIỂM LẠI ĐỘC LẬP: XÁC NHẬN cả (a)+(b)** — đồng hồ NHANH δ > 22 s trước #110 và δ > 10 s trước #111; đồng hồ boot mới ĐÚNG ~+1 s vs Cloudflare. (m) #111 (thô): 1 requeue eid 10875 tại btime +37,468 s; **run 188 TIMEOUT 23:38:46Z (cf 146 s — T7-188 phán cuối)**.
- T7-188/T8-188: **CHƯA ĐÓNG CỜ lúc T9 đóng** (~01:58Z) — run 188 + harness/B2 live thuộc §12.3-188 theo cờ của họ; T9 không phán thay.

### 2.5 B2 — 224 spike THẬT, 5 cụm; 0 spike trong span ghim E-239–E-242; 6 spike YẾU trong E-243

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **224 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 224): tất cả trên #111** (một boot duy nhất); **86 spike ≥5,0**; load1 đỉnh đợt (watcher, cadence 2 s): **7,88** (23:52:18Z, trong cụm mở — KHỚP load1 max sampler cadence 60 s, cùng mẫu).

| Cụm | Thời gian (UTC) | n | load1 max | Leader chính |
|---|---|---|---|---|
| 1. Mở phiên (T0/T4/T5 song song) | 23:45:39–23:56:12Z | 125 | 7,88 | grep 82, bash 25 |
| 2. O8 T0 + sau O8 | 00:14:41–00:18:18Z | 34 | 5,35 | grep 13, chrome 9, bash 8 |
| 3. Trong E-243 (YẾU) | 01:28:57–01:29:23Z | 6 | 3,37 | hatch 6 (nền tảng) |
| 4. Cụm WebKit/ffmpeg | 01:31:38–01:35:59Z | 53 | 4,66 | WebKit 38, hatch 7 |
| 5. Đuôi cụm WebKit | 01:38:37–01:39:02Z | 6 | 3,35 | WebKit 6 |

- **Tổng kết: 224/224 spike có process đứng đầu %CPU; 0 spike trong span ghim E-239–E-242** (như đợt 177–187); **6 spike trong span ghim E-243** (xem F-188-T9-2 — YẾU, leader nền tảng); **0 spike trong attempt** (không có attempt); **13 spike trong cửa O8 T0** (00:13:00–00:15:45Z; cụm 2 gồm 34 spike bắt đầu trong O8 và kéo dài tới 00:18:18Z; WebKit đứng đầu 3 snapshot cụm 2); **53 spike trong cụm WebKit/ffmpeg** (khớp mẫu harness T8 — T8-188 chưa đóng cờ). Top leader toàn phiên: grep 95 + WebKitWebProces 47 + bash 33 + hatch 18 + chrome 9 + privsep-test-fu 5 + python3 4 + store 4 + MainThread 3 + find 2 + ffmpeg 2 + esbuild 1 + Xvfb 1 (= 224 — KHỚP). `grep` đứng đầu 95/224 snapshot là tải từ các script poll/analyzer của luồng khác (T0/T4/T8 grep nhiều lúc O8/harness), không phải của watcher.
- **Khoảng mù watcher đầu phiên: ~0 s** (watcher khởi động 23:45:xxZ; spike đầu bắt 23:45:39Z, ngay khi chạy lại — khác đợt 187 mù ~6 phút). **Khoảng lặng watcher giữa phiên: 00:18:18Z → 01:28:57Z (~70 phút) KHÔNG CÓ spike** — mẫu sampler ngay tại 00:18:18Z ghi load1 3,06 (trùng spike cuối cụm 2), sau đó mọi mẫu sampler tới 01:28:19Z đều có load1 < 3,0 — không bằng chứng spike bị lỡ; đây là khoảng lặng thật (balloon ghim, tải thấp). **0 gap phủ sóng watcher nào khác.** Watcher chết theo lệnh kill của T9 lúc đóng sổ (01:48Z), không phải theo reboot.
- **Cụm 1 (125 spike, 23:45:39–23:56:12Z) lớn nhất kể từ đợt 187** (187: 50 spike) — 4 luồng khởi động song song + dọn dẹp sau run 188 TIMEOUT; load1 tới 7,88.

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; 3 CÂU HỎI ĐÃ TRẢ LỜI; KIỂM OFFLINE 17/17; KHÔNG BẬT LIVE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 2.544.216 kB (01:46:20Z, #111, lúc balloon xả sau E-243); trên #111 max avail chỉ 2.544.216 kB. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 42 liên tiếp (147–188).** Chuỗi "guard mở lần đầu" đợt 186 tới nay chỉ xảy ra 1 đợt.
- **QUYẾT (o) §12.3-187: AUTO-TRIGGER CHƯA BẬT LIVE đợt này.** Parent viết trực tiếp, SẠCH (xem F-188-T9-6). Ba điểm parent quyết: (i) fixture do T9-188 chọn + ghi rõ trong LIMITS này trước khi live (parent xem lại ở §12.3-188); (ii) CÓ giới hạn load1 (thiết kế cũ không giới hạn load là thiếu — ngưỡng do T9-188 đề xuất theo số đo đợt 188); (iii) KHÔNG cho "hẹn chạy sau attempt" trong đợt đầu live — chỉ chạy khi guard còn mở tại thời điểm kiểm. Dry-run song song đợt 188 để đối chiếu, bật live từ đợt 189 nếu dry-run đạt. **T9-188 LÀM THEO ĐÚNG QUYẾT NÀY — không bật live.**
- **(i) FIXTURE ĐÃ CHỌN: `server/render/examples/media/clip1.mp4` — 104.028 B, md5 `5dfbd51551392d2a6773d61b7087409b`, 8,0 s, 1280×720, h264, 30 fps, 240 frames** (ffprobe 23:52Z 24/11). Lý do: clip ngắn nhất có nội dung thật trong repo (clip2.mp4 2.672.559 B cũng 8 s nhưng nặng gấp ~26 lần; stripes-static.mp4 7.753 B là pattern tổng hợp, không có chủ thể để tách nền). 240 frames @ max-side 960 là khối lượng vừa cho lần FIRE đầu (timeout exec 1.800 s vẫn đứng). Code: hằng `FIXTURE` trong `sampler-autotrigger.py` (thay "FIXTURE-TBD"); ca kiểm 15 xác minh lệnh fire chứa đúng clip1.mp4 + session birefnet-general.
- **(ii) GIỚI HẠN LOAD1: < 4,0 lúc kiểm lại trước exec — T9-188 ĐỀ XUẤT, chờ parent duyệt ở §12.3-188.** Số liệu: cửa sổ guard 186 (duy nhất từng quan sát): load1 5,16 / 3,21 / 1,87 — quyết định fire rơi vào mẫu thứ 2 (17:49:05Z, load1 **3,21**). Log sampler đợt 188 (123 mẫu): load1 <2,0: 94/123 (76%); <3,0: 105/123 (85%); **<4,0: 110/123 (89%)**; p50 0,69; max 7,88 (cụm mở). Log 187: <4,0 là 145/148 (98%). Ngưỡng 3,0 sẽ CHẶN MẤT cửa sổ 186 (3,21) — quá chặt; ngưỡng 6,0 gần như không bao giờ chặn (chỉ chặn O8) — quá lỏng; **4,0 CHO PHÉP cửa sổ 186 thật (3,21 < 4,0) nhưng CHẶN fire trong tải O8 (7,5–7,88) và replay nặng (5,98)** — điểm cân bằng có căn cứ. Cơ chế: kiểm lại load1 TƯƠI ngay trước exec (sau lock + kiểm lại guard); nếu ≥ 4,0 → **DEFER-load1** (giữ bộ đếm consec, KHÔNG tiêu ngân sách 1 lần chạy/boot, thử lại mẫu sau). Kiểm offline: ca 12 (load 5,16 → defer, rồi 1,50 → would-fire), ca 13 (ranh giới: 4,00 defer; 3,99 fire) — đều PASS.
- **(iii) "HẸN CHẠY SAU ATTEMPT": KHÔNG — T9-188 ĐỒNG Ý với quyết (o).** Guard là sàn an toàn — fire dưới guard là chạy đúng lúc RAM đã tụt, ngược mục đích của guard (bgremove nạp model ~973 MB + frame; đợt 186 guard mở 3 mẫu rồi tụt 6.671.932 → 5.975.992 chỉ trong 60 s — fire muộn là fire vào RAM đang rơi). Thay vào đó: ghi sự kiện **MISSED-WINDOW** vào `birefnet-trigger.log` (đếm được, giữ ngân sách 1 lần chạy/boot cho cửa sổ sau trên cùng boot). Trường hợp guard VẪN MỞ khi attempt xong đã được thiết kế cũ xử lý (ca 4: attempt-done + guard còn mở → WOULD-FIRE ở mẫu sau) — "hẹn" chỉ còn ý nghĩa khi guard đã đóng, và đáp án cho trường hợp đó là không. Kiểm offline: ca 14 (defer-attempt rồi guard tụt → MISSED-WINDOW đúng 1 lần, 0 lần fire, không ghi cờ fired) — PASS.
- **KIỂM OFFLINE MỞ RỘNG: 17/17 PASS** (`test-autotrigger-offline.py`, log `test-autotrigger-offline-output.txt`): 13 ca cũ (T9-187) + 4 ca mới 12/13/14/15 (load1 defer + boundary 4,00 + MISSED-WINDOW + lệnh fire dùng clip1). Thay đổi code so với T9-187: + `FIXTURE` (clip1.mp4), + `LOAD1_MAX = 4.0`, + `load_reader` (đọc tươi lúc kiểm lại), + trạng thái `deferred_tag`/`deferred_consec` và log `MISSED-WINDOW`. Tài liệu `birefnet-autotrigger-DESIGN.md` đã thêm §8 ghi đầy đủ 3 câu trả lời.
- **DRY-RUN SONG SONG ĐỢT 188 (theo quyết (o)): ĐẠT — 0 WOULD-FIRE, 0 DEFER, 0 MISSED-WINDOW.** Prototype chạy song song sampler thường từ 23:51:34Z (118 mẫu, thư mục riêng `autotrigger-dryrun/`, log riêng, KHÔNG exec): mọi mẫu đều `trigger=watch consec=0` (avail max 2.502.272 kB — không mẫu nào tới guard nên không có quyết định nào để đối chiếu lệch); không có file `birefnet-trigger.log` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Đối chiếu chéo: max avail dry-run (2.502.272 kB) vs max avail sampler chính (2.544.216 kB) — cùng bậc, chênh do cadence lệch pha (~1 mẫu); 0 mâu thuẫn. **Đề xuất: bật live từ đợt 189 theo quyết (o) nếu parent duyệt fixture + ngưỡng load1 4,0 + không-hẹn ở §12.3-188.**
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) sampler cũ không có code trigger — nay đã có prototype + kiểm offline 17/17 + dry-run song song 1 đợt; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (0 lần chạy trong 42 đợt).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 187); không có thư mục `~/workspace/tmp-t9-188-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round188-t9/` (chỉ có log WOULD-FIRE trong output kiểm offline — file test, không phải trigger thật; dry-run cũng không ghi `birefnet-trigger.log` vì 0 sự kiện).

## 4. ENOSPC trong journal (đếm trực tiếp 136 dòng — đợt thứ 37 liên tiếp — lỗi vẫn đang xảy ra trên boot duy nhất)

- **#111:** đếm trực tiếp **136 dòng lúc đóng 01:47:57Z** (cả hai grep đều 136 — KHỚP). Dòng đầu **23:12:41Z (boot+117s)** — đúng mẫu ~110s (trở lại mẫu #103 (+111s), #102 (+112s), #101 (+108s), #100 (+110s), #99 (+109s), #93 (+114s), #91 (+~120s), #90 (+121s), #95 (+105s), #98 (+103s), #110 (+106s)). Dòng cuối **01:47:31Z**. Journal bắt đầu 23:10:56Z (boot+12s) nên phủ sóng đầy đủ.
- **Đếm giữa phiên (bài học F-187-T9-5 — đếm ở MỖI lần kiểm, không để mất tổng cuối boot):** 30 dòng lúc 23:46:10Z → 54 lúc ~00:14Z → 76 lúc ~00:39Z → 102 lúc ~01:09Z → 130 lúc ~01:40Z → **136 lúc đóng 01:47:57Z**. Nhịp ổn định ~0,88 dòng/phút suốt phiên (24/28 phút = 0,86; 22/25 = 0,88; 26/30 = 0,87; 28/31 = 0,90; 6/7 = 0,86) — lỗi xảy ra ĐỀU, không theo đợt.
- **Tổng đợt 188 đếm trực tiếp: 136 dòng** — là tổng cuối boot #111 tính tới lúc đóng (không cần ngoại suy: journal #111 còn nguyên lúc đóng; đợt này chỉ 1 boot nên không mất journal qua reboot). Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`.
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-188 áp dụng ĐẦY ĐỦ, kể cả đếm lại lúc đóng):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (đợt này: cả hai đều 136 lúc đóng — KHỚP); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (đợt này KHÔNG cần — 1 boot); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.
- **Caveat đếm:** đợt này chỉ 1 boot nên không có journal mất qua reboot; số 136 là tổng cuối boot #111 tính tới lúc đóng — nếu boot #111 sống tiếp sau khi T9 đóng, lỗi sẽ tăng thêm ngoài phạm vi đợt (thuộc T9-189).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Không có reboot mới trong phiên (T9 bắt trực tiếp: 0 reboot; 1 boot duy nhất #111 cả đợt)

- **#111 (257c1eae-1c20-4bd4-a710-548adb1d34d5, btime 23:10:44Z; số hiệu parent quyết (e) §12.3-187; T0-188 XÁC MINH 9 nguồn TƯƠI).** Gap #110→#111 = **7.043 s (1h57m23s)** — trở lại mẫu ~2h. Sampler + watcher B2 + probe-loop + autotrigger-dry-run **CHẾT theo lệnh kill của T9 lúc đóng sổ** (01:48Z), không phải theo reboot. **Điểm yếu (d) đợt 148 KHÔNG tái diễn đợt này (0 reboot giữa phiên).**
- **Marker:** T0-188 đếm sống qua **63 reboot #49–#111** (mtime không đổi). **#111 → 64 nếu parent tính tiếp.**
- **Khoảng mù giữa hai đợt: 34m31s không sampler T9** (23:10:46Z → 23:45:17Z — chứa reboot #111 + cửa sổ thoáng #111).

### 5.2 T5-188 — POSTBOOT_PASS #111 CÓ (CÓ caveat); replay #111 ĐÌNH TRỆ — thuộc §12.3-188

- **POSTBOOT_PASS #111 ĐÃ CÓ lúc 00:11:36Z** (boot+1h00m52s, repair-sớm, poll=1, **CÓ caveat** — GST symlink → debroot ephemeral + tools chưa cài + dpkg 768/1 transaction; verify độc lập exit 0). **Gate (a): CÓ (có caveat — parent quyết mức caveat ở §12.3-188).**
- **Replay #111 ĐÌNH TRỆ** (heal 23:11:21Z, boot+37s, chỉ viết 2 dòng dpkg rồi DỪNG; 44' sau 0 tiến triển — dpkg 2 dòng, 0 proc, /var/log/apt vắng, cache 0, GST 0, journal 0 entry apt/dpkg; T5 kết luận replay host KHÔNG BAO GIỜ chạy — watcher repair thay thế đúng quy tắc (h)). Chuỗi đình trệ xen kẽ (#102 không, #103 có, #104 không, #111 có) — nợ host-side VẪN MỞ theo quyết (k) §12.3-187.
- **Run 188 TIMEOUT 23:38:46Z (cf 146 s — số thô T0-188; T7-188 phán cuối).** T7-188 chưa đóng cờ lúc T9 đóng.

### 5.3 Các luồng khác — T0/T1/T4/T5/T6 đã đóng; T2 LIMITS đã có; T7/T8 chưa đóng

- T0-188 ĐÃ đóng (00:22Z): #111 XÁC NHẬN 9 nguồn TƯƠI; O8 PASS 3/3 trên #111; libevent MISSING lúc survey (heal sau repair, lần 4). T1-188 ĐÃ đóng (00:04Z): verify 187 PASS (chuỗi khớp lần thứ 102). T4-188 ĐÃ đóng (~01:41Z): #57 0 attempt (xem §2.3). T5-188 ĐÃ đóng (00:22Z): POSTBOOT_PASS #111 CÓ (caveat) + replay #111 ĐÌNH TRỆ. T6-188 ĐÃ đóng: (A) 120/120 lần 38; #110/#111 KHÔNG GIẾT HOLDER (chuỗi 14 → 15); prune lần 63.
- T2-188: LIMITS đã có trên đĩa lúc T9 đóng (~01:50Z); (m)/INSIDE/mù thuộc T2-188 + parent — T9 không phán thay T2. T7-188/T8-188: CHƯA ĐÓNG CỜ lúc T9 đóng — run 188 + harness/B2 live thuộc §12.3-188 theo cờ của họ.

## 6. Sai số / caveat (F-188-T9-*)

- **F-188-T9-1 — E-238 KẾT THÚC BỞI REBOOT #111 (T9 phán, T10/parent quyết cuối — xem §2.2).** 12 mẫu trên #110, vẫn ghim lúc T9-187 đóng; reboot #111 btime 23:10:44Z (parent (e) §12.3-187). Caveat: mù sampler 34m31s (23:10:46Z–23:45:17Z) — sag trong mù không loại trừ được (cùng caveat như E-229/E-233); đồng hồ nhanh F-187-T9-3 (T0-188 xác minh độc lập δ > 10 s trước #111). Balloon boot mới bắt đầu thấp (6.050.608 kB lúc 23:44:11Z → 4.706.584 kB lúc 23:45:17Z) ủng hộ kết thúc bởi reboot.
- **F-188-T9-2 — 6 SPIKE TRONG SPAN GHIM E-243 — LẦN ĐẦU KỂ TỪ ĐỢT 177 (T9 phán, T10/parent quyết cuối).** 01:28:57–01:29:23Z, 6 spike, load1 3,00–3,37 — TẤT CẢ đều sát ngưỡng 3,0 (thấp nhất 3,00 đúng ngưỡng); process đứng đầu cả 6 snapshot là **`hatch` (nền tảng, 10,8–10,9% CPU)**, không phải tải sản phẩm; sampler cùng lúc ghi load1 3,00 (01:29:19Z) — khớp, là bump tải thật nhưng YẾU. E-239–E-242 vẫn 0 spike. So sánh: đợt 177–187 giữ 0 spike trong span ghim (11 đợt); đợt này phá mẫu ở episode cuối cùng, với tải nền tảng. T9 KHÔNG gộp/bỏ 6 spike này (đếm đủ 224); parent quyết có tính là "spike trong span ghim" theo nghĩa B2 hay chỉ là nhiễu ngưỡng.
- **F-188-T9-3 — LƯỢT YÊN #57: 0 ATTEMPT — CHUỖI 1 → 0 (xem §2.3).** T4 đóng ~01:41Z với 0 attempt (hết hạn cắt 01:30Z); nguyên nhân duy nhất là balloon ghim (RAM <1.024 MB trong 101/136 poll). Parent (m) §12.3-187 đã chấp nhận #56 0 → 1 nên #57 đứt 1 → 0 (parent quyết cuối). Kiểm chứng live lần 8 KHÔNG ÁP DỤNG (không có attempt để kiểm chứng). F-184-T4-2 KHÔNG KIỂM ĐƯỢC (không có cửa attempt).
- **F-188-T9-4 — F-187-T9-1 (RUNTIME RESTART) KHÔNG TÁI DIỄN; F-187-T9-3 (ĐỒNG HỒ NHANH) KHÔNG TÁI DIỄN TRONG PHIÊN.** T9 sáng suốt phiên (0 khoảng tối, 0 lần mất kiểm); 3 daemon + dry-run chạy liên tục 23:45Z–01:48Z. Không có reboot trong phiên nên đồng hồ trước reboot không kiểm được đợt này; T0-188 đã xác minh độc lập F-187-T9-3 (XÁC NHẬN cả (a)+(b) — parent (p) §12.3-187). F-187-T9-6 (lỗi `&`-chain) KHÔNG tái diễn — cả 4 daemon khởi động bằng exec riêng, chạy đúng ngay lần đầu.
- **F-188-T9-5 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm 3 → 4 — CHỜ parent quyết cuối).** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail ngay ở watch đầu, không tạo tải; không probe nào chạy trong cửa sổ attempt T4 — không có attempt nào cả đợt); 0 spike B2 trong attempt (không có attempt); 6 spike yếu trong E-243 là tải nền tảng `hatch` (xem F-188-T9-2), không phải do probe T9; 53 spike trong cụm WebKit/ffmpeg là tải harness (khớp mẫu T8). T4-188 phán 0 vi phạm phía T4 (0 attempt); T2-188 phán tuân thủ (theo LIMITS T2 — T9 không phán thay T2). **T9 ĐÓNG TRONG HẠN CỜ ~02:00Z (đóng ~01:58Z)** — khác đợt 187 trễ ~24' do runtime restart. Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).
- **F-188-T9-6 — §12.3 AGGREGATE 186 BỊ VIẾT LẠI TRONG LƯỢT NÀY — NGUỒN GỐC CHƯA NGÃ NGŨ, TỔNG ĐIỀN SẴN GIỮ 18.** Aggregate 186 đổi 107.950 → 108.730 B lúc 23:49:15Z, SAU khi parent giao brief 23:43:44Z gọi nó là "BẢN PARENT, SẠCH" (ghi chú nguồn gốc §12.3-187, parent kiểm trực tiếp trên đĩa). Bản viết lại tự ghi nguồn gốc CHƯA NGÃ NGŨ (cùng trạng thái 180/181) — KHÔNG ghi là điền sẵn lần thứ 19, KHÔNG ghi là sạch; **tổng điền sẵn GIỮ 18**. Nội dung (a)–(r) KHÔNG ĐỔI theo đối chiếu trực tiếp của T6-188 với trích dẫn trong aggregate 187 — các luồng đợt 188 đã dùng quyết §12.3-186 theo NỘI DUNG (không đổi) nên brief không sai về nội dung; chỉ tiền đề "SẠCH" về nguồn gốc là sai. Hai đính chính trong bản viết lại: (n) run 185 là CA thứ 14 trong cửa sổ (không phải 15) — ĐÚNG; (q) số thứ tự kiểm đếm SAI (parent lượt này kiểm lần thứ 103, không phải 101). **§12.3 aggregate 187 LÀ SẠCH THẬT** (T9 kiểm độc lập: aggregate 58.035 B lúc T10-187b đóng 00:21Z; parent viết trực tiếp 00:27Z; 66.836 B lúc 00:31Z; KHÔNG ĐỔI sau đó — mtime vẫn 00:31Z lúc T9 kiểm 01:10Z và 01:51Z). Giữ cả hai bản ghi làm bằng chứng; không viết lại aggregate nào.

- **Caveat đứng:** probe cap 30.000 (giá trị mở các boot trước là censored — chỉ biết ≥ 30.000; đợt này không đo được lần mở nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có prototype auto-trigger + kiểm offline 17/17 + dry-run song song 1 đợt, xem §3); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #110 từ cell vì journalctl chỉ còn boot hiện tại sau reboot (đợt này chỉ 1 boot nên không mất journal); T10 không đếm lại độc lập B2 đợt 188 (chỉ đọc log đóng băng); T7-188/T8-188 chưa đóng cờ lúc T9 đóng (run 188 + harness thuộc §12.3-188); E-243 còn 6 spike yếu trong span — kết cục phán thuộc T10/parent (xem F-188-T9-2); fixture clip1.mp4 + ngưỡng load1 4,0 + không-hẹn chờ parent duyệt ở §12.3-188 trước khi bật live đợt 189.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (123 mẫu, 23:45:17Z–01:47:20Z, một boot #111): `hidden_files/round188-t9/ram-sampler-FROZEN.log` — md5 `5ae8e8fd90710b84e54ce578c7bd9bc8`. Log B2 đóng băng (224 spike): `hidden_files/round188-t9/b2-spikes-FROZEN.log` — md5 `307d879106c38d6c0ee2eac78b6dcad3`. Log headroom đóng băng (6 lần đo): `hidden_files/round188-t9/headroom-log-FROZEN.txt` — md5 `65103c52d8e8813b59bcc5afc8d067fa`. Log dry-run auto-trigger đóng băng (118 mẫu): `hidden_files/round188-t9/autotrigger-dryrun/ram-sampler-FROZEN.log` — md5 `1630bda963612ac27d983820caee7124`. Phân tích bằng script: `hidden_files/round188-t9/t9-188-analyze.py` (output: `hidden_files/round188-t9/t9-188-analyze-output.txt`). Ghi chú baseline: `hidden_files/round188-t9/t9-188-baseline-notes.md`. Auto-trigger: `hidden_files/round188-t9/sampler-autotrigger.py` + `hidden_files/round188-t9/birefnet-autotrigger-DESIGN.md` (đã thêm §8) + `hidden_files/round188-t9/test-autotrigger-offline.py` (output: `hidden_files/round188-t9/test-autotrigger-offline-output.txt` — 17/17 PASS). T10 đọc log đóng băng trực tiếp khi cần.
