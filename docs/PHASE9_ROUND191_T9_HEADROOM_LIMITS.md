# LIMITS — Phase 9 đợt 191, T9: headroom + RAM + birefnet (6 lần đo toàn 0; trần 63.737; balloon = 0 lần đầu; E-247 kết cục KHÔNG XÁC ĐỊNH ĐƯỢC; ENOSPC #114 = 114 dòng; auto-trigger live 125 mẫu, 0 FIRE — tổng live 222 mẫu)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (6 lần đo: 0, 0, 0, 0, 0, 0; trần 63.737)** — dưới ngưỡng < ~1.800 **lần thứ 50 liên tiếp**. Quyết "chỉ theo dõi" đứng (parent (l) §12.3-189: lần 49).
- **Trần inotify KHÔNG ĐỔI trong đợt (63.737 cả 6 lần đo)** — đứng yên sau khi giảm −10 ở đợt 189 (F-189-T9-1).
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** (125 mẫu chính + 125 live) — guard KHÔNG mở lại. **0 lần chạy birefnet — lần thứ 44 liên tiếp** (147–191). Xem §3.
- **Auto-trigger: LIVE 125 mẫu đợt này, tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **222 mẫu (97 đợt 189 + 125 đợt 191), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA (điểm yếu (b) đứng). Khoảng mù live 04:52–08:46Z (~3h54m, đợt 190 void — không có mẫu live nào). Xem §3.
- **CỬA SỔ THOÁNG boot #114: KHÔNG QUAN SÁT ĐƯỢC** (đã đóng ~14 phút trước khi T9 mở phiên — như #112 đợt 189).
- **Balloon: 0 EPISODE MỚI trên #114 (0 mẫu CEIL trong 125 mẫu).** Balloon max **6.410.612 kB** (10:41:05Z — chỉ thiếu 33.212 kB là tới trần); 33 mẫu ≥6,0M (từ 10:12:04Z). **Balloon = 0 một mẫu 09:38:03Z — lần đầu quan sát được** (T8-191 cũng ghi min 0 trong harness). Sàn 6.050.608 kB: **0 lần** (chuỗi dừng ở 11). Giá trị sag 6.247.216 kB: **0 lần** (tổng giữ 3).
- **E-247 (số mới = E-248 cũ): KẾT CỤC KHÔNG XÁC ĐỊNH ĐƯỢC.** Last seen ghim 04:51:14Z trên #113; #113 đã hết (reboot → #114 08:25:43Z); sag trước reboot hay vẫn ghim tới lúc reboot không xác định được vì không có sampler nào trong khoảng mù 04:52–08:35Z (đợt 190 void). Tổng ghim #112 **34/114 KHỚP** quyết (h) §12.3-189 (kiểm lại từ log đóng băng 189). Xem §2.2.
- **RAM: 125 mẫu, 08:46:01–10:50:05Z, MỘT boot (#114).** Max **4.776.568 kB**; min **338.008 kB**; mean 1.832.896,7 kB; gate A **79/125**. **0 reboot trong phiên; 0 gap >61 s** (lớn nhất 61 s — jitter bình thường).
- **Lượt yên #59 (T4): CÓ LƯỢT HỢP LỆ** (attempt1 09:03:40–09:07:10Z, 20/20 + lớp B 5/5, median 42,0 ms) — chuỗi 1 → 2 (đề xuất; parent quyết). **(p) kiểm chứng live lần 10: ĐẠT** (0 file analyzer trong cửa sổ; T9 đối chiếu: 0 spike B2 trong cửa sổ) — chuỗi live ĐẠT 8 → 9 (đề xuất).
- **B2: 286 spike THẬT, tăng vọt so với đợt 189 (40)** — tải đợt này nặng (luồng sản phẩm build/test); 0 spike trong attempt #59; 38 trong O8 T01; 140 trong harness T8; 19 trong O8 T8; load1 đỉnh watcher **12,01**. Xem §2.5.
- **ENOSPC: #114 = 114 dòng — TĂNG ĐỀU CẢ PHIÊN, KHÔNG dừng giữa boot** (dòng đầu 08:36:57Z; dòng cuối 10:49:55Z; nhịp ~0,86 dòng/phút); **chuỗi đợt có lỗi thật 38 → 39**. Xem §4.
- **0 VI PHẠM phía T9 — chuỗi 0 vi phạm đề xuất 5 → 6** (parent quyết (p) §12.3-189: 4 → 5). **T9 đóng ~10:55Z, TRONG hạn cờ ~11:00Z.** Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–190 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng).

### 1.2 Số đo đợt 191 (6 lần đo, 1 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 08:46:01Z | **0** | #114 b0aab705 | 63.737 | probe-loop open-191 (boot+20m18s) |
| 09:16:01Z | **0** | #114 | 63.737 | probe-loop lan-2r (boot+50m18s) |
| 09:46:01Z | **0** | #114 | 63.737 | probe-loop lan-3r (boot+1h20m18s) |
| 10:16:01Z | **0** | #114 | 63.737 | probe-loop lan-4r (boot+1h50m18s) |
| 10:46:01Z | **0** | #114 | 63.737 | probe-loop lan-5r (boot+2h20m18s) |
| 10:50:48Z | **0** | #114 | 63.737 | probe tay close-191 (boot+2h25m05s) |

- **CỬA SỔ THOÁNG boot #114: KHÔNG QUAN SÁT ĐƯỢC.** Boot btime 08:25:43Z (T01-191 xác minh 9 nguồn tươi); cửa sổ boot+61–92s = 08:26:44–08:27:15Z đã đóng ~14 phút trước khi T9 mở phiên (~08:40Z) và ~19 phút trước probe đầu (08:46:01Z). Chuỗi "đo được trong cửa sổ" đợt 189 (1 điểm boot+78s) KHÔNG nối tiếp — đợt này trở lại mẫu không quan sát được (như #112 đợt 189).
- **Headroom cuối phiên: 0.** Dãy 6 lần đo toàn 0 — lần đầu kể từ đợt 187 toàn 0 cả phiên (đợt 189 có 2 lần nhích 1–2). **Trần KHÔNG ĐỔI trong đợt (63.737 cả 6 lần đo)** và bằng đợt 189 — F-189-T9-1 (giảm −10) không diễn tiếp.
- **Probe-loop tự kết thúc sau lan-5r** (pid 9317 thoát sau probe 10:46:01Z — đúng thiết kế script: 5 lane rồi dừng; không phải chết bất thường).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt gần nhất: 186 đóng 0 (7 lần 0); 187 đóng 0 (7 lần 0); 188 đóng 0 (6 lần 0); 189 đóng 0 (7 lần đo: 5 lần 0 + 1 lần 1 + 1 lần 2); **191 đóng 0 (6 lần đo: toàn 0)**. (Đợt 190 VOID — không có đo.)

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 0.** Đợt này không có sự kiện mở 30.000 nào (lần mở gần nhất: đợt 185).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 50 liên tiếp.** Quyết parent (l) §12.3-189 GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Dữ kiện mới: ENOSPC #114 tăng đều cả phiên (xem §4) + balloon suýt ghim cuối phiên (§2.2) — cùng hướng: watch ngoài cell vẫn chiếm gần hết trần, không có dấu hiệu giải phóng bền như đợt 189.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 125 mẫu, 08:46:01–10:50:05Z, MỘT boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 61 s** (jitter bình thường); **0 reboot trong phiên** (cả 125 mẫu cùng boot b0aab705).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 08:46:01–09:03:01Z | #114 | 1.410.964–3.781.388 kB | Mở sampler; balloon leo 3,68M → 5,27M; **O8 T01 08:48:14–08:51:44Z** |
| 09:04:01–09:26:03Z | #114 | 996.284–3.448.112 kB | **Attempt #59 09:03:40–09:07:10Z**; balloon dao động 4,78M → 5,11M rồi xả |
| 09:27:03–09:43:04Z | #114 | 2.297.204–4.776.568 kB | **Harness T8 09:27:11–09:43:53Z** (gate A 16/16); balloon XÌ 3,21M → **0** rồi leo lại; max phiên 4.776.568 kB 09:37:03Z |
| 09:44:03–10:11:04Z | #114 | 1.566.000–4.244.808 kB | **O8 T8 09:46:04–09:48:44Z**; balloon leo đều 1,34M → 5,71M |
| 10:12:04–10:50:05Z | #114 | 338.008–1.835.000 kB | Balloon ≥6,0M (33 mẫu), suýt ghim 10:41:05Z; **RAM <512.000 kB: 24 mẫu** (tất cả trong giai đoạn này); min phiên 338.008 kB 10:41:05Z |

- **Gate A ≥1024 MiB: 79/125 mẫu**; **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **11,10** (09:39:03Z — trong harness Chromium); load1 <4,0: **111/125 mẫu chính (88,8%)** — đợt 189 là 128/128 (100%); **RAM <512.000 kB: 24 mẫu** (19,2%; đợt 189: 30/128 = 23,4%); **RAM <300.000 kB: 0 mẫu**.
- Swap: SwapFree 767.260 kB (mẫu đầu) → 600.848 kB (mẫu cuối) — giảm **166.412 kB** trong phiên (đợt 189: boot mới giảm 174.796 kB/14 mẫu; nhịp này chậm hơn nhiều — xả swap đều, không còn cú xả nhanh như 189).
- Trũng RAM đợt này: min **338.008 kB (10:41:05Z, balloon 6.410.612 — suýt ghim)** — nông hơn kỷ lục 225.224 kB đợt 180 nhưng sâu hơn min 434.488 kB đợt 189. 24 mẫu <512.000 kB, 7 dải: 10:13:04Z (1); 10:18:05–10:23:05Z (6); 10:25:05–10:27:05Z (3); 10:29:05–10:30:05Z (2); 10:32:05–10:36:05Z (5); 10:38:05–10:41:05Z (4); 10:44:05–10:46:05Z (3). Tổng 1+6+3+2+5+4+3 = 24 — KHỚP số đếm toàn phiên.

**Bảng tổng hợp số RAM (từ script `t9-191-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 125 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #114 b0aab705 | 125 | 338.008 | 4.776.568 | 1.832.896,7 | 79/125 | 0 | 11,10 | 24 |
| **Toàn phiên** | **125** | **338.008** | **4.776.568** | **1.832.896,7** | **79/125** | **0/125 (0%)** | **11,10** | **24** |

- **Mean toàn phiên 1.832.896,7 kB — 2 cách độc lập: python `sum/n = 1.832.896,7` VÀ kiểm có trọng số của script (in `t9-191-analyze-output.txt`) — KHỚP CẢ HAI.** Mean cao hẳn đợt 189 (1.023.420,5 kB) vì nửa đầu phiên balloon xả sâu (RAM 2–4,7M), chỉ cuối phiên mới siết lại.

### 2.2 Balloon virtio — 0 EPISODE MỚI; suýt ghim cuối phiên; balloon = 0 lần đầu

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH** (mốc các đợt trước; đợt này balloon max 6.410.612, chưa chạm trần nên trần không được xác nhận lại từ dữ liệu đợt này — giữ mốc cũ).
- **Boot #114: GHIM 0/125 mẫu (0%) — KHÔNG CÓ episode nào.** Lần đầu tiên kể từ khi T9 đếm episode (đợt 186: 21/130; 187: 56/148; 188: 42/123; 189: 36/128) một đợt có 0 mẫu ghim.
- **Suýt ghim cuối phiên:** balloon leo lại từ 10:12:04Z (6.027.280); **33 mẫu ≥6,0M** (10:12:04–10:50:05Z); chỉ **1 mẫu ≥6,4M: 10:41:05Z balloon 6.410.612 (thiếu 33.212 kB = 0,5% trần)** — cùng mẫu với min RAM phiên 338.008 kB. Sau đó balloon hạ về 5,57–5,84M (10:47–10:50Z) — KHÔNG chạm trần, không hình thành episode.
- **Balloon = 0 (F-191-T9-2):** mẫu **09:38:03Z avail 4.634.224, balloon 0, load1 10,29** (sampler chính) và **09:38:01Z avail 4.608.348, balloon 0, load1 10,29** (live autotrigger, lệch 2 s) — hai sampler độc lập cùng ghi 0 nên KHÔNG phải lỗi đọc. **T8-191 cũng ghi balloon min 0 trong harness** (sampler riêng của T8, n=34) — xác nhận độc lập lần thứ ba. Balloon xả HẾT về 0 giữa lúc harness Chromium chạy (09:37–09:39Z, load1 7,99–11,10) — host trả lại toàn bộ RAM balloon đúng lúc tải cao nhất. Min nonzero khác trong phiên: 260.412 kB (09:39:03Z).
- **Sàn balloon 6.050.608 kB: 0 lần đợt này — CHUỖI DỪNG Ở 11** (đợt 188: 1 lần, lần 11; đợt 189: 0 lần).
- **Giá trị sag 6.247.216 kB: 0 lần đợt này** (tổng giữ 3: đợt 187: 2 lần; đợt 188: 1 lần).
- **E-247 (số mới) — KẾT CỤC KHÔNG XÁC ĐỊNH ĐƯỢC (F-191-T9-4).** Sau đính chính (h) §12.3-189: E-248 cũ (2 mẫu CEIL 04:50:14Z + 04:51:14Z trên boot #113 f7632121, vẫn ghim lúc T9-189 đóng) → E-247 mới. T9-191 kiểm lại từ log đóng băng 189: tổng CEIL toàn log = 36 (34 trên #112 + 2 trên #113) — KHỚP LIMITS 189; tổng ghim #112 = **34/114 KHỚP** quyết (h). Kết cục: #113 đã hết — boot hiện tại #114 b0aab705 btime 08:25:43Z (T01-191 xác minh 9 nguồn tươi; gap #113→#114 = 13.759 s). **Không có sampler nào chạy 04:52Z→08:35Z (đợt 190 void)** nên không biết E-247 sag trước reboot hay vẫn ghim tới lúc reboot — T9 KHÔNG phán "kết thúc bởi reboot" như tiền lệ E-238 (đợt 187, quan sát được), chỉ ghi: episode kết thúc cùng boot #113, cơ chế kết thúc KHÔNG XÁC ĐỊNH ĐƯỢC. Thuộc T10/parent quyết cách ghi. **E-247 KHÔNG xuất hiện trong log đợt 191** (0 mẫu CEIL trên #114) — đúng, vì episode thuộc boot #113 đã hết.

### 2.3 Lượt yên WebKit #59 (T4) — CÓ LƯỢT HỢP LỆ (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#59 CÓ LƯỢT HỢP LỆ — attempt1-b0aab705 20/20 + lớp B ĐẠT 5/5, tickCost median 42,0 ms.** Cửa yên mở poll #21 (09:03:40Z, RAM 1286 MB, gate0=T4); attempt chạy 09:03:40–09:07:10Z; poller thoát 09:07:37Z. Ngân sách 1/3 attempt.
- **Chuỗi lượt yên hợp lệ: 1 → 2 (T9 đề xuất, parent quyết cuối ở §12.3-191)** — #58 hợp lệ (0→1 đã chấp nhận ở (m)-189); #59 hợp lệ ngay attempt đầu, median 42,0 ms bằng hệt #58. P3' cộng dồn MỚI 50 lượt (T4-191: P1 223/227, P2 218/218, P3-A1 192/227, P3' 187/199 = 142/145 distinct-seq, P7 121/121; sổ distinct-seq THĂNG CẤP as-of-191, md5 b7ed5791, seq mới: 146, 464).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** cửa sổ attempt n=4, gate A **3/4** (avail 996.284–1.385.916 kB — mẫu 09:05:01Z 996.284 kB dưới gate 1.048.576 kB một chút), ceil 0, load1 0,85–2,34. Sampler 60 s không bắt đúng thời điểm cửa mở (T4 đo theo poll ~45 s, RAM 1286 MB tại poll #21) — khác độ phân giải đo, không mâu thuẫn verdict T4. **0 spike B2 trong attempt** (xem §2.5). **F-184-T4-2 KIỂM ĐƯỢC lần này:** T4 ghi 0 file analyzer trong cửa sổ attempt (xem (p) dưới).
- **Kiểm chứng live lần 10: ĐẠT** (T4-191 phán; T9 đối chiếu độc lập: 0 spike B2 trong cửa sổ attempt 09:03:40–09:07:10Z; live autotrigger chạy suốt cửa sổ, 0 FIRE). **Chuỗi live ĐẠT đề xuất 8 → 9** (parent (p) §12.3-189: lần 9 ĐẠT, chuỗi 7 → 8).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T01/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 08:48:14–08:51:44Z | #114 | 4,60–5,65 (3 mẫu) | 2.071.220–2.791.344 kB — **gate A 3/3** | **O8 T01 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); **38 spike B2**; 0 mẫu ghim |
| T4 attempt1 #59 09:03:40–09:07:10Z | #114 | 0,85–2,34 (4 mẫu) | 996.284–1.385.916 kB — **gate A 3/4** | **0 spike B2**; 0 mẫu ghim; live autotrigger chạy trong cửa sổ, 0 FIRE |
| Harness T8 09:27:11–09:43:53Z | #114 | 2,28–11,10 (16 mẫu) | 2.297.204–4.776.568 kB — **gate A 16/16** | **140 spike B2**; balloon XÌ 3,21M → 0 (09:38:03Z) rồi leo lại; harness 6/6 |
| O8 T8 09:46:04–09:48:44Z | #114 | 0,97–4,19 (3 mẫu) | 2.835.740–3.511.204 kB — **gate A 3/3** | **19 spike B2**; 0 mẫu ghim; O8 T8 PASS 3/3 |

- T01-191: **#114 XÁC NHẬN 9 nguồn TƯƠI** (btime 08:25:43Z, gap #113→#114 = 13.759 s — dài nhất chuỗi gần đây); O8 PASS 3/3 trên #114; marker sống qua **66 reboot #49–#114**. T2-191: **(m) #113 DƯƠNG (CUỐI ở cấp T2)** — requeue eid 10947, run 190, +35,149752 s; n ứng viên 50/51 → 51/52 nếu parent chấp nhận; **INSIDE #112/#113 KHÔNG TÍNH ĐƯỢC** (thiếu btime #106) — chuỗi GIỮ 7; (m) #56 VẪN CÓ ĐIỀU KIỆN, lần 33. T56-191: **POSTBOOT_PASS #114 CÓ 08:45:57Z** (replay-đầy-đủ, poll=0, KHÔNG caveat); **#113 KHÔNG CÓ cờ** — tổng boot không cờ 25 → 26 (đề xuất); **(A) 120/120 lần 40**; **#113 + #114 KHÔNG GIẾT HOLDER — chuỗi 16 → 18**; prune lần 65.
- T8-191: **harness 6/6 trên #114** (09:27:11–09:43:53Z); **FULL PASS đề xuất 1 → 2** (5/5 chân cùng boot #114 — lần thứ hai liên tiếp); 84l10 PASS đề xuất 9 → 10; 86n2-P1 không kẹt đề xuất lần 13; B2 vùng mới sạch lần 5; B1 live sạch đề xuất 1 → 2; **P5-188 ĐIỀU TRA XONG: kẹt #27 là H3-thuần, KHÔNG tái diễn đợt 191.**
- T7-191: **F-191-T7-1 — nhãn "run 190" MƠ HỒ** (hai run khác nhau cùng mang nhãn: eb18559f sched 1795574151 và 814be71a sched 1795584951 — parent quyết cách đếm ở §12.3-191; nội dung số KHÔNG tranh chấp); chuỗi SUCCEEDED: run 189 → eb18559f (lần 2) → 814be71a (lần 3); run hiện tại d3d9408b (sched 1795595751) vẫn RUNNING lúc T7 đóng ~10:48Z — kết cục thuộc T7-192; OUTAGE bàn giao nguyên vẹn (T7-193 kiểm onset + daemon chết lặng 3 khoảng sáng nay).

### 2.5 B2 — 286 spike THẬT; 0 spike trong attempt #59; 140 trong harness

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **286 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 286): tất cả trên #114**; **load1 đỉnh đợt (watcher, cadence 2 s): 12,01** (CAO HƠN load1 max sampler 11,10 vì cadence 2 s bắt được đỉnh ngắn; đợt 189: 4,27).

| Nhóm | n | Ghi chú |
|---|---|---|
| chrome | 69 | Tải trình duyệt (O8/harness + luồng sản phẩm) |
| WebKitWebProces | 63 | Harness/O8 WebKit |
| hatch | 47 | Tải nền tảng (cùng mẫu các đợt trước) |
| MainThread | 37 | pid 12062/13419 — comm `MainThread`, chưa xác định chắc là tiến trình nào (ghi theo comm) |
| ps | 27 | Lệnh shell ngắn (xem F-191-T9-5) |
| ffmpeg | 14 | Luồng sản phẩm (render/proxy) |
| grep | 13 | Lệnh shell ngắn (xem F-191-T9-5) |
| ffprobe | 9 | Luồng sản phẩm (media) |
| find | 4 | Lệnh shell ngắn (xem F-191-T9-5) |
| esbuild / bash / Xvfb | 1 + 1 + 1 | Lẻ tẻ |

Tổng 69+63+47+37+27+14+13+9+4+1+1+1 = 286 — KHỚP. Phân theo giờ: 08:xx 74 spike; 09:xx 189 spike; 10:xx 23 spike. Spike đầu 08:46:01Z (load1 3,18 — ngay mẫu mở phiên); spike cuối 10:47:36Z (load1 3,11).

- **0 spike trong attempt #59** (09:03:40–09:07:10Z); **38 spike trong O8 T01** (08:48:14–08:51:44Z — load1 ≥3,0 gần như liên tục trong cửa sổ, sampler load1 4,60–5,65); **140 spike trong cửa sổ harness T8** (09:27:11–09:43:53Z); **19 spike trong O8 T8** (09:46:04–09:48:44Z). Ngoài các cửa sổ trên: 89 spike (chủ yếu 08:46–09:03Z lúc luồng sản phẩm mở phiên + 10:13–10:47Z lúc RAM siết).
- **0 spike trong span ghim** — không áp dụng được đợt này (0 mẫu ghim; không có span ghim để đối chiếu — khác F-188-T9-2/F-189-T9-2).
- **Khoảng mù watcher: 0** — watcher chạy liên tục 08:46–10:50Z trên cùng boot, không reboot; chết theo lệnh kill của T9 lúc đóng sổ (10:50:52Z).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §12.3-189; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 4.776.568 kB (sampler chính, 09:37:03Z, #114); live log max 4.608.348 kB. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 44 liên tiếp (147–191).**
- **QUYẾT (o) §12.3-189: AUTO-TRIGGER GIỮ LIVE.** Parent kiểm độc lập lần thứ 112 (dedup python viết mới /tmp/count-189-parent.py KHỚP TỪNG SỐ; nguồn gốc §12.3-189 CHƯA NGÃ NGŨ — T9 dùng nội dung, không phán nguồn gốc). Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH FLIP LIVE CỦA T9-191:** live đã bật từ đợt 189 nên đợt này là TIẾP TỤC, không flip mới — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 189 §12.3 (o) dòng 205 (78.048 B, mtime 06:00Z); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Khởi động 08:46:01Z (pid 9322, `dry_run=False guard=6291456 consec=2`).
- **LIVE PHASE ĐỢT 191: 125 mẫu, 08:46:01–10:50:05Z, TẤT CẢ `trigger=watch consec=0`, max avail 4.608.348 kB, load1 <4,0: 111/125 (88,8%) — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `autotrigger-live/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Mẫu live đầu 08:46:01Z; live chạy suốt cửa sổ attempt #59 (09:03:40–09:07:10Z), 0 FIRE — T4 cũng ghi nhận (kiểm chứng live lần 10 ĐẠT).
- **TỔNG LIVE TỪ 03:14Z 25/11: 222 mẫu (97 đợt 189 + 125 đợt 191), 0 FIRE.** Khoảng mù live **04:52–08:46Z (~3h54m)**: live đợt 189 bị T9-189 kill lúc đóng sổ 04:52Z; đợt 190 VOID nên không ai khởi động lại; T9-191 khởi động lại 08:46:01Z. Trong khoảng mù này guard có mở hay không là KHÔNG BIẾT (không sampler nào chạy) — nhưng cũng không thể có FIRE (không có tiến trình live nào để fire; không có file trigger/flag nào trên đĩa từ khoảng đó).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) sampler cũ không có code trigger — nay đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 222 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 44 đợt) — live đã bật nhưng guard chưa mở lần nào kể từ khi bật.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 189); không có thư mục `~/workspace/tmp-t9-191-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round191-t9/` (live chạy 125 mẫu, 0 sự kiện).

## 4. ENOSPC trong journal (đếm trực tiếp — #114 TĂNG ĐỀU CẢ PHIÊN, lần đầu không dừng giữa boot kể từ đợt 188)

- **#114: đếm trực tiếp 114 dòng (lần đếm cuối 10:50:52Z)** — dòng đầu **08:36:57Z (boot+674s)** — MUỘN HƠN HẲN mẫu ~110s các boot trước (#111: +117s; #110: +106s; boot mới đợt 189: +114s); dòng cuối **10:49:55Z**. Cả hai grep đều 114 lúc đóng — KHỚP.
- **Đếm giữa phiên (bài học F-187-T9-5 — đếm ở MỖI lần kiểm):** 4 dòng lúc 08:42:37Z → 7 lúc 08:47:07Z → **55 lúc 09:42:42Z → 114 lúc 10:50:52Z (VẪN TĂNG)**. Nhịp đều ~0,86 dòng/phút cả phiên (48 dòng/55 phút đầu; 59 dòng/68 phút sau) — **KHÔNG dừng giữa boot** như #112 đợt 189 (dừng từ 03:44:09Z). Lần đầu tiên kể từ đợt 188 lỗi tăng đều suốt phiên đo (đợt 189: #112 dừng giữa boot).
- **Caveat đếm #114:** journal chỉ còn boot hiện tại (`journalctl -b -1`: "No journal boot entry found") — **không đếm lại được ENOSPC #113** (journal mất sau reboot; E-247 cũng không đối chiếu được từ journal). Số đếm #114 là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới (4 dòng lúc 08:42Z chỉ là cận dưới lúc đó).
- **Tổng phiên (1 boot, đếm trực tiếp): 114 dòng.** **Chuỗi đợt có lỗi thật: 38 → 39** (boot #114 có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-191 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (đợt này: 114=114 lúc đóng — KHỚP); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (đợt này KHÔNG ngoại suy — chỉ ghi #114 đếm trực tiếp; #113 không có số); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Boot #114 trong phiên (T9 bắt trực tiếp: 0 reboot; 1 boot đợt này)

- **#114 (b0aab705-7ef5-47fd-95e0-e97910fbfa88, btime 08:25:43Z; số hiệu ỨNG VIÊN — T01-191 XÁC MINH 9 nguồn TƯƠI; parent quyết (e) ở §12.3-191).** Sampler T9 trên #114: 08:46:01–10:50:05Z (125 mẫu, liên tục, 0 gap >61 s). Gap #113→#114 = **13.759 s (3h49m19s)** — dài nhất chuỗi gần đây (T01-191).
- **Marker:** T01-191 đếm sống qua **66 reboot #49–#114** (mtime không đổi). **Boot #114 là boot thứ 66.**
- **Khoảng mù giữa hai đợt: ~3h43m không sampler T9** (04:52Z → 08:46:01Z — chứa reboot #114 + cửa sổ thoáng #114 + toàn bộ khoảng mù live). **Khoảng mù trong phiên: 0** (không reboot, không gap).

### 5.2 Các luồng khác — P1–P4/T01/T2/T4/T56/T7/T8 đã đóng; T10 dời sang lượt sau

- T01-191 ĐÃ đóng (~10:47Z): #114 XÁC NHẬN 9 nguồn TƯƠI; O8 PASS 3/3; (m) #113 thô +35,150 s. T2-191 ĐÃ đóng: (m) #113 DƯƠNG (CUỐI ở cấp T2), n 51/52; INSIDE KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7. T4-191 ĐÃ đóng (09:25Z): #59 CÓ LƯỢT HỢP LỆ; (p) live lần 10 ĐẠT. T56-191 ĐÃ đóng: POSTBOOT_PASS #114 CÓ (KHÔNG caveat) + #113 KHÔNG CÓ cờ (tổng boot không cờ 25 → 26 đề xuất) + (A) lần 40 + holder chuỗi 16 → 18 + prune 65. T7-191 ĐÃ đóng (~10:48Z): F-191-T7-1 (nhãn "run 190" mơ hồ); chuỗi SUCCEEDED lần 3; run hiện tại RUNNING — kết cục thuộc T7-192. T8-191 ĐÃ đóng (~10:01Z): harness 6/6; FULL PASS đề xuất 1 → 2; 84l10 đề xuất chuỗi 10; 86n2-P1 đề xuất lần 13; P5-188 H3-thuần.
- T10-191: **dời sang lượt cron 18:35 +07** (theo mẫu 188/189 — build-loop-log) — §12.3-191 thuộc lượt sau.

## 6. Sai số / caveat (F-191-T9-*)

- **F-191-T9-1 — MEMORY.md BỊ SỬA TỪ BÊN NGOÀI TRONG LÚC T9 MỞ PHIÊN (~08:45Z) — T9 KHÔNG SỬA, KHÔNG PHÁN TÁC GIẢ.** System watcher báo file đổi trong lúc T9 đang khởi động daemon: dòng "Chưa lên" đổi thành "đợt 190 chưa từng chạy — không tồn tại; đợt 191 đang chạy". T9 KHÔNG sửa MEMORY.md (luật cứng) và không phán tác giả; ghi làm bằng chứng để T10/parent xử lý. Tổng điền sẵn GIỮ 18 (không liên quan trực tiếp tới §12.3 đợt 191). Cùng mẫu F-189-T9-2 (sửa ~02:51Z đợt 189).
- **F-191-T9-2 — BALLOON = 0 LẦN ĐẦU QUAN SÁT ĐƯỢC (09:38:01–03Z).** Hai sampler độc lập của T9 (chính 09:38:03Z + live 09:38:01Z, cùng load1 10,29) + sampler riêng của T8-191 (min 0 trong harness) đều ghi balloon 0 — KHÔNG phải lỗi đọc. Host trả lại toàn bộ RAM balloon đúng lúc tải cao nhất (harness Chromium, load1 7,99–11,10). Trước đây balloon chưa từng về 0 trong bất kỳ log T9 nào (min các đợt trước ≥ ~260 kB trong phiên này, trừ mẫu này). Theo dõi đợt 192 xem 0 có lặp lại không.
- **F-191-T9-3 — BALLOON SUÝT GHIM CUỐI PHIÊN NHƯNG 0 MẪU CEIL.** Max 6.410.612 kB (10:41:05Z, thiếu 33.212 kB = 0,5% trần); 33 mẫu ≥6,0M từ 10:12:04Z; sau đó hạ về 5,57–5,84M. Không hình thành episode — đợt đầu tiên 0 mẫu ghim kể từ khi T9 đếm episode. Caveat: sampler cadence 60 s — có thể có chạm trần dưới 60 s mà sampler không bắt được (điểm yếu (a) đợt 147 — nay đã có live autotrigger cadence 60 s cùng nhịp, cũng không ghi consec>0 nào; vẫn không loại trừ chạm <60 s).
- **F-191-T9-4 — E-247 KẾT CỤC KHÔNG XÁC ĐỊNH ĐƯỢC (khoảng mù sampler đợt 190 void).** Last seen ghim 04:51:14Z trên #113; #113 đã hết (reboot → #114 08:25:43Z). T9 KHÔNG phán "kết thúc bởi reboot" — khác E-238 đợt 187 (quan sát được). Thuộc T10/parent quyết cách ghi. Tổng ghim #112 34/114 đã kiểm lại KHỚP (h) từ log đóng băng 189 (36 CEIL toàn log = 34 #112 + 2 #113).
- **F-191-T9-5 — B2 TĂNG VỌT 286 SPIKE (đợt 189: 40) — 44 SPIKE DO LỆNH SHELL NGẮN ĐỨNG ĐẦU.** `ps` 27 + `grep` 13 + `find` 4 = 44 spike có process đứng đầu là lệnh shell ngắn (cụm 08:46–08:52Z grep, 09:29–09:36Z ps) — đây là lệnh chẩn đoán/thu thập của các luồng (T01 survey, T4 analyzer, T8 replay...), không phải tải bền; T9 KHÔNG quy cho luồng cụ thể từ snapshot (snapshot chỉ có comm + %CPU, không có parent). 37 spike `MainThread` (pid 12062/13419) chưa xác định chắc là tiến trình nào — ghi theo comm. Phần còn lại (chrome 69 + WebKitWebProces 63 + hatch 47 + ffmpeg 14 + ffprobe 9 + lẻ tẻ) là tải thật (harness/O8/sản phẩm). 0 spike trong attempt #59 nên lượt yên không bị nhiễu bởi B2.
- **F-191-T9-6 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm 5 → 6 — CHỜ parent quyết cuối).** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải); các probe lúc 08:46/09:16/09:46/10:16/10:46/10:50Z đều NGOÀI cửa sổ attempt #59 (09:03:40–09:07:10Z); 0 spike B2 trong attempt; live autotrigger 0 FIRE nên không tạo tải bgremove. T4-191 phán 0 vi phạm phía T4 (theo cờ T4); T2-191 phán theo LIMITS T2 (T9 không phán thay T2). **T9 ĐÓNG TRONG HẠN CỜ ~11:00Z (đóng ~10:55Z).** Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp). **LƯU Ý KHỞI ĐỘNG:** lần chạy đầu bằng `&`-chain báo output-drain-timeout (shell thoát nhưng output chưa đóng — do daemon setsid giữ stdout) — daemon đã chạy đúng cả 4 (xác minh ps 08:47Z: pid 9317/9319/9320/9322), không khởi động lại, không chạy nhầm cwd (bài học F-189-T9-6 đã áp dụng: setsid + cd tuyệt đối).

- **Caveat đứng:** probe cap 30.000 (giá trị mở các boot trước là censored — chỉ biết ≥ 30.000; đợt này không đo được lần mở nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger cadence 60 s + kiểm offline 17/17 + dry-run 2 đợt + live 222 mẫu, xem §3); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #113 từ cell vì journal cũ mất sau reboot (chỉ còn tổng #114 = 114 đếm trực tiếp); T10 không đếm lại độc lập B2 đợt 191 (chỉ đọc log đóng băng); E-247 kết cục thuộc T10/parent (F-191-T9-4); T10-191 dời sang lượt cron 18:35 +07.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (125 mẫu, 08:46:01–10:50:05Z, một boot #114): `hidden_files/round191-t9/ram-sampler-FROZEN.log` — md5 `353b10826d5d4b2803fae14a973c9b63`. Log B2 đóng băng (286 spike): `hidden_files/round191-t9/b2-spikes-FROZEN.log` — md5 `fcc993e40e118b32f7c580c5584ca819`. Log headroom đóng băng (6 lần đo): `hidden_files/round191-t9/headroom-log-FROZEN.txt` — md5 `72db5a4253a4bf8bd1f8bbd32fd4ec72`. Log live auto-trigger đóng băng (125 mẫu): `hidden_files/round191-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `6e7154c0f26343b0b097d836c123a467`. Phân tích bằng script: `hidden_files/round191-t9/t9-191-analyze.py` (output: `hidden_files/round191-t9/t9-191-analyze-output.txt`). Ghi chú baseline: `hidden_files/round191-t9/t9-191-baseline-notes.md`. Auto-trigger: `hidden_files/round191-t9/sampler-autotrigger.py` + `hidden_files/round191-t9/birefnet-autotrigger-DESIGN.md` (§8, từ đợt 188) + `hidden_files/round191-t9/test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại đợt này — code không đổi). T10 đọc log đóng băng trực tiếp khi cần.
