# LIMITS — Phase 9 đợt 180, T9: headroom + RAM + birefnet (0 thử lần 34; reboot #96 mới; E-205 kết thúc bởi sag + E-206/E-207/E-208 mới; cửa sổ thoáng #96 QUAN SÁT ĐƯỢC lần đầu kể từ #91; ENOSPC đợt 29; 69 spike B2)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (7 lần đo: 6×0 + 1×2.903; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 40 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG #96: QUAN SÁT ĐƯỢC — LẦN ĐẦU KỂ TỪ #91.** Probe boot+70s (21:22:06Z) = **2.903** (mở thật, nhưng dưới chuẩn "mở lớn" ~30.001 đợt 176); boot+85s (21:22:21Z) đã **0** — cửa sổ đóng trong ~15 s. Chuỗi quan sát được NỐI LẠI (đứt từ #91 qua #95).
- **Balloon — E-205 KẾT THÚC BỞI SAG** (trong khoảng mù 19:54:36–20:57:28Z, không quan sát được thời điểm chính xác — xem §2.2); **3 EPISODE MỚI: E-206 trên #95 (2 mẫu, kết thúc bởi sag sâu) + E-207 (11) / E-208 (6) trên #96.** Tổng ghim **19/116 (16,4%)**. KHÔNG gộp episode nào (quyết (h) đợt 179: TÁCH theo quy tắc cơ học).
- **RAM: 116 mẫu, 20:58:13–22:53:08Z, HAI boot (#95: 24; #96: 92).** Max **2.443.388 kB (38,83% guard)** lúc 21:24:06Z; min **225.224 kB** lúc 22:41:07Z (#96 — trũng SÂU nhất từ trước tới nay trong log T9). Gate A **30/116**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 34 liên tiếp**.
- **B2: 69 spike THẬT, 4 cụm — tất cả có driver đứng đầu; delta đỉnh 95,4.** **0 spike trong cửa sổ attempt T4; 0 spike trong span ghim E-206/E-207/E-208.**
- **Lượt yên #49 (T4): CÓ LƯỢT HỢP LỆ — attempt1-95b483a2 21:17:29–21:20:58Z, 20/20 + B 5/5, median 44,0 ms — CHUỖI 42 → 43.** Sampler T9: gate A 1/4 trong cửa sổ (cadence 60 s); 0 spike B2.
- **REBOOT #96 MỚI GIỮA PHIÊN** (boot `8d2a69df`, btime 21:20:56Z, gap #95→#96 = 7.834 s — số hiệu + btime chờ T0-181 xác minh 9 nguồn); giết sampler/watcher/probe-loop T9; T9 khởi động lại, gap mẫu 52 s. **#95 XÁC NHẬN 9 nguồn (T0-180)** — nợ đợt 179 đã trả.
- **ENOSPC: đếm trực tiếp 157 dòng (78 #95 + 79 #96) — đợt thứ 29 liên tiếp.**
- **T7/T10 CHƯA đóng lúc T9 đóng (~22:55Z)** — như T7/T8-179. Không push, không sửa production, không chạy TTS 39, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 179, có 2 sửa kỹ thuật (xem F-180-T9-1): ctypes `libc.inotify_init` (module `os` không có `inotify_init`), mask `IN_ALL_EVENTS` (0xfff — mask 0 → EINVAL), mỗi watch một thư mục riêng. Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả hai boot.

### 1.2 Số đo đợt 180 (7 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 21:00:00Z | **0** | #95 95b483a2 | 63.747 | cặp mở (boot+109m38s); ENOSPC #95 lúc đó ~70 |
| 21:22:06Z | **2.903** | #96 8d2a69df | 63.747 | **TRONG cửa sổ thoáng (boot+70s)** |
| 21:22:21Z | **0** | #96 | 63.747 | boot+85s — cửa sổ ĐÃ ĐÓNG |
| 21:52:21Z | **0** | #96 | 63.747 | lan-2 (boot+31m25s); E-207 ĐANG GHIM |
| 22:22:21Z | **0** | #96 | 63.747 | lan-3 (boot+1h01m25s) |
| 22:52:21Z | **0** | #96 | 63.747 | lan-4 (boot+1h31m25s) |
| 22:53:45Z | **0** | #96 | 63.747 | cặp đóng (tay); ENOSPC #96 = 79 |

- **CỬA SỔ THOÁNG #96: QUAN SÁT ĐƯỢC — CÓ LẦN MỞ 2.903.** Btime 21:20:56Z (uptime-based, chờ T0-181 xác minh 9 nguồn); dải mẫu boot+53–245s ≈ 21:21:49–21:25:01Z. T9 khởi động lại daemon sau reboot và probe lúc boot+70s (21:22:06Z) được **2.903** — lần đầu có số đọc khác 0 trong cửa sổ kể từ #91. Probe tiếp boot+85s (21:22:21Z) đã **0** — cửa sổ đóng trong khoảng **~15 s** (giữa 21:22:06Z và 21:22:21Z). Mở 2.903 < chuẩn "mở lớn" ~30.001 (đợt 176) nên **không ghi nhận lần mở lớn** — nhưng đây là lần đầu tiên chuỗi quan sát được NỐI LẠI: các boot #91–#95 đều 0 trong cửa sổ (hoặc không quan sát được). Số watch giữ ngoài cell lúc mở: 63.747 − 2.903 = **60.844**.
- **CỬA SỔ THOÁNG #95: KHÔNG QUAN SÁT ĐƯỢC trong đợt 180** (đợt mở 20:35:51Z = boot+85m29s, sau khi cửa sổ đóng; probe đầu tiên 21:00:00Z đã 0). Cửa sổ #95 đã được T9-179 quan sát (điểm kiểm trong dải mẫu, 0 — không lần mở).
- **Headroom cuối phiên: 0.** Số watch giữ ngoài cell lúc đóng: **63.747**. Tỉ lệ so với nhu cầu vite (~1.578): **0** — một vite mới không khởi động được (như mọi đợt từ 152). Đợt này: #95: 0; #96: 2.903 → 0 → 0 → 0 → 0 → 0. **Trần KHÔNG ĐỔI trong boot** (63.747 trên #95 và #96).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt: **… → 0 → 2 → 0 → 2 → 2 → 0 → 2 → 0 → 2 → 2 → 0 → 0 → 0 → 0 → 0**. Gần nhất: 177 đóng 0; 178 đóng 0; 179 đóng 0 (toàn 0); **180 đóng 0 (1 lần đo giữa phiên 2.903)**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — giá trị đóng phiên là 0.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 40 liên tiếp.** Quyết parent đợt 179 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới: journal đợt này có 157 dòng lỗi ENOSPC đếm trực tiếp (xem §4)** — đợt thứ 29 liên tiếp. T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.892 kB; swap 1.048.572 kB) — sampler 116 mẫu, 20:58:13–22:53:08Z, HAI boot

`/proc/meminfo` MemTotal 8.124.892 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot #96: 52 s** (mẫu cuối #95 21:21:14Z → mẫu đầu #96 21:22:06Z); **0 gap >90 s trong toàn phiên**; **116 mẫu (#95: 24; #96: 92)**.

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 20:58:13–21:08:13Z | #95 | 446.564–1.696.448 kB | Mở sampler; E-205 ĐÃ KẾT THÚC (xem §2.2); balloon dao động 5,0–6,3M |
| 21:12:14–21:13:14Z | #95 | 416.060–478.416 kB | **E-206 2 mẫu ghim**; gate A ĐÓNG cả 2 |
| 21:13:23–21:16:02Z | #95 | 416.060–1.696.448 kB | **T0 O8 PASS 3/3**; gate A 2/4; **13 spike B2** (cụm A) |
| 21:17:29–21:20:58Z | #95 | 814.184–1.383.016 kB | **T4 attempt1 #49 HỢP LỆ**; gate A 1/4; 0 spike B2 (xem §2.3) |
| 21:22:06–21:24:06Z | #96 | 1.753.196–2.443.388 kB | Boot #96 mới; **headroom mở 2.903**; gate A 3/3; **27 spike B2** (cụm B) |
| 21:45:06–21:55:06Z | #96 | 430.316–533.272 kB | **E-207 11 mẫu ghim**; gate A 0/11; 0 spike B2 |
| 22:03:06–22:08:07Z | #96 | 457.772–508.276 kB | **E-208 6 mẫu ghim**; gate A 0/6; 0 spike B2 |
| 22:09:22–22:11:59Z | #96 | 724.144–1.286.896 kB | **T8 O8 PASS 3/3**; gate A 1/3; **23 spike B2** (cụm C) |
| 22:13:03–22:28:37Z | #96 | 489.428–1.627.832 kB | **T8 harness hb128 3/3 + 3/3**; gate A 4/16; **2 spike B2** (cụm D, delta 95,4) |
| 22:29:04–22:48:11Z | #96 | 225.224–1.447.656 kB | **Đối chứng chuẩn cũ: WebKit KẸT exit 124** (ngoài harness); gate A 3/20; 0 spike B2 |
| 22:49:28–22:50:38Z | #96 | 914.252–1.233.988 kB | **Diag W2-setup PASS**; gate A 1/2; 0 spike B2 |

- **Gate A ≥1024 MiB: 30/116 mẫu** (3/24 trên #95 + 27/92 trên #96); **0 mẫu ≥ guard**; load1 max (sampler) **4,68** (22:11:07Z — trong cụm C); **RAM <512.000 kB: 25 mẫu** (21,6% — 3 trên #95 + 22 trên #96, 8 dải — xem dưới); **RAM <300.000 kB: 3 mẫu** (22:39:07–22:41:07Z, min 225.224 kB).
- Swap: SwapFree 631.512 kB (mẫu đầu #95) → 620.328 kB (mẫu cuối #95) → **1.024.288 kB (mẫu đầu #96 — NHẢY +403.960 kB qua reboot #96)** → 615.272 kB (mẫu cuối, 22:53:08Z). Nhịp nhảy SwapFree qua reboot: #96 nhả ~403.960 kB (đợt 179: #95 nhả ~331.952 kB; #93 nhả ~268.104 kB; #91 nhả ~376.948 kB).
- Trũng RAM đợt này: min **225.224 kB (22:41:07Z, #96)** — **trũng SÂU nhất trong các log T9 từ trước tới nay** (kỷ lục cũ 329.368 kB đợt 178; đợt 179: 333.672 kB). Lúc đó balloon 6.260.716 kB (97,2% trần), load1 0,14 — balloon leo sát trần nhưng sag ngay sau (22:42:07Z bal 5.911.280 kB), KHÔNG ghim. 25 mẫu <512.000 kB trong 116 mẫu (21,6%; đợt 179: 17/131 = 13,0%).

**Bảng tổng hợp số RAM (từ script `t9-180-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 116 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #95 95b483a2 | 24 | 416.060 | 1.696.448 | 785.446,0 | 3/24 | 2 | 3,04 | 3 |
| #96 8d2a69df | 92 | 225.224 | 2.443.388 | 917.947,4 | 27/92 | 17 | 4,68 | 22 |
| **Toàn phiên** | **116** | **225.224** | **2.443.388** | **890.533,3** | **30/116** | **19/116 (16,4%)** | **4,68** | **25** |

- **Mean toàn phiên 890.533,3 kB — 3 cách độc lập: python `sum/n = 890.533,3` VÀ awk `sum/n = 890.533` VÀ trung bình có trọng số ((24×785.446,0 + 92×917.947,4)/116 = 890.533,3) — KHỚP CẢ BA.**
- 25 mẫu RAM <512.000 kB, 8 dải (từ script python trên log đóng băng): #95: 21:01:13Z (1); 21:12:14–21:13:14Z (2). #96: 21:48:06–21:51:06Z (4); 21:53:06–21:55:06Z (3); 22:02:06–22:08:07Z (7); 22:26:07Z (1); 22:36:07–22:41:07Z (6); 22:43:07Z (1). Tổng 1+2+4+3+7+1+6+1 = 25 — KHỚP số đếm toàn phiên.

### 2.2 Balloon virtio — E-205 KẾT THÚC BỞI SAG + E-206/E-207/E-208 MỚI

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #95 và #96** (max bal trong log = đúng CEIL trên cả hai boot).
- **E-205 — KẾT CỤC: KẾT THÚC BỞI SAG (trong khoảng mù 19:54:36–20:57:28Z).** Mẫu cuối T9-179 19:54:36Z vẫn CEIL; lần quan sát đầu tiên của T9-180 20:57:28Z bal 6.247.216 kB (96,9%), 20:58:13Z bal 6.050.608 kB (93,9% — **TRÙNG HỆT đáy sag tách E-200/E-201/E-203**, xem F-180-T9-4). **Khoảng mù 63 phút** (19:54:36–20:57:28Z) không có sampler T9 nào chạy (T9-179 đã đóng; T9-180 chưa mở) — thời điểm sag chính xác KHÔNG quan sát được; T9 chỉ phán kết cục (sag), không phán thời điểm. Không có sampler luồng khác nào phủ khoảng này (các thư mục round180-t* khác đều trống lúc T9 mở; T4 poller mở 21:04:13Z).
- **Boot #95: GHIM 2/24 mẫu (8,3%), 1 EPISODE MỚI (E-206).** **E-206 — 21:12:14–21:13:14Z, 2 mẫu** (RAM 416.060–478.416 kB; mẫu trước 21:11:14Z bal 6.417.904 kB = 99,6%), **KẾT THÚC bởi sag SÂU** (21:14:14Z bal 5.198.640 kB = 80,7%; RAM nhảy lên 846.636 kB). Episode ngắn nhất từ trước tới nay (kỷ lục cũ E-203: 3 mẫu) — nhưng 2 mẫu CEIL liên tiếp vẫn là một chuỗi ghim theo quy tắc cơ học; T9 phán là episode mới, giao T10/parent xác nhận.
- **Boot #96: GHIM 17/92 mẫu (18,5%), 2 EPISODE MỚI (E-207 + E-208).** Balloon leo đơn điệu từ 5,02M (21:22:06Z) tới trần. **E-207 — 21:45:06–21:55:06Z, 11 mẫu** (RAM 430.316–533.272 kB), **KẾT THÚC bởi sag** (21:56:06Z bal 6.050.608 kB = 93,9% — **TRÙNG HỆT đáy sag tách E-200/E-201/E-203**, lần thứ tư giá trị này xuất hiện). **E-208 — 22:03:06–22:08:07Z, 6 mẫu** (RAM 457.772–508.276 kB; mẫu trước 22:02:06Z bal 6.434.236 kB = 99,85%), **KẾT THÚC bởi dip** (22:09:07Z bal 6.181.680 kB = 95,9%). Sau E-208, balloon #96 leo lại tới 97,2% trần (22:41:07Z) nhưng KHÔNG chạm trần lần nữa trước khi T9 đóng.
- **Tổng ghim trần đợt này: 19/116 mẫu (16,4%)** (đợt 179: 27/131 = 20,6%; đợt 178: 53/137 = 38,7%; đợt 177: 43/134 = 32,1%).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-206/E-207/E-208 là 3 EPISODE MỚI (sag/dip tách chuỗi; quy tắc từ đợt 172; quyết (h) đợt 179: KHÔNG gộp qua sag dù nông — TÁCH). **Không có phương án gộp nào cần xét đợt này** (mỗi episode tách nhau bằng sag rõ rệt, không có micro-dip 1 mẫu gây tranh cãi như E-204/E-205).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-207 chỉ ~430–533.000 kB trong khi tổng RAM − balloon = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #49 (T4) — CÓ LƯỢT HỢP LỆ, attempt1 20/20 + B 5/5, CHUỖI 42 → 43 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#49 CÓ LƯỢT HỢP LỆ — attempt1-95b483a2 (20/20 pass, lớp B ĐẠT 5/5, tickCost median 44,0 ms ≤60) — CHUỖI LƯỢT YÊN HỢP LỆ 42 → 43.** Ngân sách dùng 1/3 (attempt1 chạy 21:17:29–21:20:58Z trên #95). POSTBOOT_PASS #95 ĐÃ CÓ (T5-180, 20:59:47Z, replay-đầy-đủ, poll=0 — xem §5.2). Reboot #96 xảy ra SAU khi attempt xong (btime 21:20:56Z, poller T4 thoát 0 lúc 21:21:23Z).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):** attempt1 (21:17:29–21:20:58Z): gate A MỞ **1/4 mẫu** (RAM 814.184–1.383.016 kB; mẫu 21:17:14Z 1.383.016 kB ≈ 1.350 MB — khớp poll #18 của T4 đọc RAM 1280 MB lúc mở cửa 21:17:29Z, chỉ khác giây đo); load1 **0,67–0,78**; balloon 4,99–5,49M (77,4–85,2% trần), **0 mẫu ghim**. **0 spike B2 trong cửa sổ attempt** (xem §2.5). **0 vi phạm theo T4 — chuỗi 0 vi phạm 1 → 2.**

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 21:13:23–21:16:02Z | #95 | 0,30–3,04 (4 mẫu) | 416.060–1.696.448 kB — **gate A 2/4** | **O8 PASS 3/3; 13 spike B2** (cụm A, driver đúng trình duyệt đo) |
| T4 attempt1 21:17:29–21:20:58Z | #95 | 0,67–0,78 (4 mẫu) | 814.184–1.383.016 kB — **gate A 1/4** | **LƯỢT HỢP LỆ #49 — 0 spike B2**; 0 mẫu ghim |
| T8 O8 22:09:22–22:11:59Z | #96 | 0,18–4,68 (3 mẫu) | 724.144–1.286.896 kB — **gate A 1/3** | **O8 T8 PASS 3/3; 23 spike B2** (cụm C, driver đúng trình duyệt đo) |
| T8 harness 22:13:03–22:28:37Z | #96 | 0,14–2,71 (16 mẫu) | 489.428–1.627.832 kB — **gate A 4/16** | **hb128 WebKit 3/3 + Chromium 3/3 SẠCH; 2 spike B2** (cụm D, delta 95,4) |
| T8 đối chứng 22:29:04–22:48:11Z | #96 | 0,14–2,71 (20 mẫu) | 225.224–1.447.656 kB — **gate A 3/20** | **WebKit chuẩn cũ KẸT exit 124** (ngoài harness); 0 spike B2 — kẹt chờ, không đốt CPU |
| T8 diag 22:49:28–22:50:38Z | #96 | 0,56–1,25 (2 mẫu) | 914.252–1.233.988 kB — **gate A 1/2** | **Diag W2-setup PASS**; 0 spike B2 |

- T1-180: verify 179 (không chạy lại suite 28 mục) → không có cửa sổ T1 để đối chiếu đợt này (như đợt 177/178/179). T7-180 CHƯA đóng lúc T9 đóng → không có cửa sổ T7 để đối chiếu (thuộc T9-181 nếu T7 đóng muộn). T8-180: sampler riêng n=32, balloon max 88,5% trần, 0 ghim, avail min 458 MB — khác cửa sổ/cadence với sampler T9 (116 mẫu suốt phiên, 19 ghim) — KHÔNG mâu thuẫn trực tiếp (cùng mẫu F-179-T9-7); giao T10 đối chiếu nếu cần.

### 2.5 B2 — 69 spike THẬT, 4 cụm, tất cả có driver đứng đầu; 0 spike trong cửa sổ attempt T4 và trong span ghim

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **69 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 69): 14 trên #95 (cụm A) + 55 trên #96 (cụm B 27 + cụm C 26 + cụm D 2); 0 spike trong cửa sổ attempt T4; 0 spike trong span ghim E-206/E-207/E-208 (19 mẫu ghim, 0 spike — như đợt 177/178/179).**

| Cụm | Thời gian (UTC) | n | load1 max | Driver đứng đầu |
|---|---|---|---|---|
| A. O8 T0 #95 | 21:15:00–21:16:05Z | 14 | 5,00 | chrome (9) + WebKitWebProcess (2) + MainThread (1) — driver đúng là trình duyệt đo; delta đỉnh 69,2 (MainThread) |
| B. Đầu boot #96 | 21:22:06–21:24:16Z | 27 | 4,75 | hatch (16) + python3 chưa định danh (11) — tải khởi động sau reboot; delta đỉnh 23,7 |
| C. O8 T8 #96 | 22:10:07–22:12:13Z | 26 | 4,87 | WebKitWebProcess (13) + chrome (10) + MainThread (2) + hatch (3) — driver đúng là trình duyệt đo; 23 spike trong cửa sổ O8 (22:09:22–22:11:59Z), 3 spike ngay sau |
| D. Harness #96 | 22:18:23–22:18:28Z | 2 | 3,33 | WebKitWebProcess (2) — trong run WebKit 86n2-hb128 (22:16:58–22:20:59Z); **delta đỉnh đợt 95,4** |

- **Tổng kết: 69/69 spike có process đứng đầu delta tick; delta đỉnh lớn nhất đợt: 95,4 tick/s** (WebKitWebProcess, spike 22:18:23Z; đợt 179: max 66; đợt 178: max 85; đợt 177: max 69; đợt 176: 132). **31/69 spike có delta đỉnh ≤24 tick** (chủ yếu cụm B — 27 spike) → chuẩn phán F-178-T9-6 ("quy được" cho spike delta nhỏ) áp dụng cho cụm B.
- **Khoảng mù watcher đầu phiên: 0** (watcher khởi động 20:58:13Z CÙNG lúc sampler; spike đầu bắt ngay 21:15:00Z). **Khoảng mù qua reboot #96: ~52 s** (watcher chết ~21:21:2xZ, chạy lại 21:22:06Z — cùng gap sampler; không load1 ≥3,0 nào ở mẫu sampler kề gap (21:21:14Z load1 0,67; 21:22:06Z load1 3,15 — spike ĐẦU TIÊN sau reboot bắt ngay 21:22:06Z) → không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng trong gap). **0 gap phủ sóng watcher nào khác.** `grep -c 'WebKit\|MiniBrowser'` trong log B2 đợt này = **nhiều dòng** (WebKit/Chromium O8 + harness của T8).

## 3. Birefnet guard (cơ chế (a) — 0 lần thử, lần thứ 34)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round180-t9/sampler.sh` chạy 20:58:13Z–22:53:08Z (2 instance: instance 1 sống 20:58:13–21:21:14Z trên #95 rồi **CHẾT theo reboot #96**; instance 2 khởi động lại 21:22:06Z trên #96, sống tới khi T9 dừng tay ~22:54Z — **1 gap qua reboot (52 s), 0 gap >90 s khác; max gap trong boot 61 s**), **116 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.443.388 kB = 38,83% guard** (đợt 179: 40,52%; đợt 178: 66,35%; đợt 177: 41,78%; đợt 176: 48,52%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **3.848.068 kB (61,17%)**. **Caveat (F-179-T9-4 đợt 178): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 180 — lần thứ 34 liên tiếp** (đợt 147–180: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 34 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round180-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B, clip test 14.554 B (không đổi so với đợt 179); không có thư mục `~/workspace/tmp-t9-180-birefnet/` (không thử gì); T9 sẵn sàng kích hoạt khi guard mở.

## 4. ENOSPC trong journal (đếm trực tiếp 157 dòng — đợt thứ 29 liên tiếp)

- **#95:** đếm trực tiếp **78 dòng** (lúc 21:02Z, khi #95 còn là boot hiện tại; dòng đầu 19:12:07Z = boot+105s theo T9-179; dòng cuối đếm được 21:01:xxZ). Phần 21:02Z → reboot 21:20:56Z (~19 phút) **KHÔNG đếm được** (journal #95 mất sau reboot #96 — `--list-boots` lúc đóng chỉ còn idx 0 #96); ngoại suy theo nhịp 0,70–0,86 dòng/phút ≈ **+13–16 dòng → #95 ≈ 91–94 dòng**.
- **#96:** **79 dòng** (đếm trực tiếp lúc đóng — toàn bộ từ lúc mở boot tới lúc đóng; journal bắt đầu 21:20:xxZ nên phủ sóng đầy đủ). Dòng đầu **21:22:47Z (boot+111s)** — khớp mẫu #93 (boot+114s), #91 (boot+~120s), #90 (boot+121s) và #95 (boot+105s). Dòng cuối 22:52:47Z. Nhịp ≈ 79 dòng/91,7 phút ≈ **0,86 dòng/phút** (khớp #95: 0,70–0,86).
- **Tổng đợt 180 đếm trực tiếp: 157 dòng** (78 #95 + 79 #96) — cận dưới; ngoại suy ≈ **170–173 dòng** (157 + ~13–16 phần #95 không đếm được). Cao hơn đợt 179 đếm trực tiếp (78 dòng) vì đợt này đếm được cả hai boot gần như đầy đủ. Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut). **Số 2 headroom KHÔNG còn là chỉ báo "ENOSPC sắp dừng" (F-178-T9-5 đã phá vỡ tương quan; đợt này headroom có lần mở 2.903 trong khi ENOSPC vẫn chạy 157 dòng trực tiếp).**
- **Caveat đếm:** `journalctl --since` / `--list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #95 từ cell (cùng mẫu F-171-T10-4, F-176-T9-5, F-177-T9-5, F-178-T9-5, F-179-T9-5). Số #95 (78) lấy từ đếm trực tiếp lúc 21:02Z — ghi trong baseline notes + log đóng băng.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #96 mới giữa phiên (T9 bắt trực tiếp, khởi động lại 52 s gap mẫu) + #95 trước khi đợt mở

- **#96 (8d2a69df, btime 21:20:56Z uptime-based; số hiệu + btime chờ T0-181 xác minh 9 nguồn).** Btime từ uptime: 21:20:56Z (`uptime -s`; epoch `/proc/stat` btime 1795468856; `who -b` 21:21; T4-180 ghi cùng số btime danh nghĩa, T8-180 ghi cùng số, gap #95→#96 = 7.834 s). Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #95 21:21:14Z — xem F-180-T9-3 về lệch giờ). T9 khởi động lại cả ba lúc 21:22:06Z (sampler pid 3056, watcher 3058, probe-loop 3139) — **gap 52 s**; probe headroom TRONG cửa sổ thoáng (boot+70s: 2.903) rồi mới đọc journal/uptime (bài học F-177-T9-1 đã áp dụng). Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2 — xem F-180-T9-1). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 4 — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#95 (95b483a2, btime 19:10:22Z):** TRƯỚC khi đợt mở 85 phút; **T0-180 XÁC MINH 9/9 nguồn** (epoch 1795461022; uptime bracket ×3 khớp cùng giây; boot_est btime +0,99 s; /proc/1 start_ticks btime +11,11 s; stat mtime btime+12,106 s; journal first btime+12 s; wtmp begins 19:10:34Z; CF ×4; DB: run 180 boot_gen d67600a2). Gap #94→#95 = **6.793 s (1h53m13s) — TRỞ LẠI mẫu ~2 giờ**. **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: ~63 phút không sampler T9** (mẫu cuối đợt 179 19:54:36Z → mẫu đầu đợt 180 20:58:13Z) — chứa phần cuối E-205 (kết cục sag, thời điểm không quan sát được). Marker: T0-180 đếm **47 reboot #49–#95**; **#96 chưa xác nhận** (thuộc T0-181) → sống qua 48 reboot nếu #96 được xác nhận.

### 5.2 T5-180 — POSTBOOT_PASS #95 CÓ (replay-đầy-đủ, không caveat); POSTBOOT_PASS #96 CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat repair)

- **POSTBOOT_PASS #95 CÓ lúc 20:59:47Z** (T5-180, mode **replay-đầy-đủ, poll=0**, dpkg 1545, cache 178, lists 71, GST 269 — KHÁC #94 repair-sớm-quyết-h, poll=1, dpkg 795; GIỐNG #92 replay-đầy-đủ, poll=0, dpkg 1545). T0 O8 bắt đầu 673 s sau cờ (21:13:23Z); T4 poller mở cửa poll #18 (21:17:29Z) sau cờ 1.062 s. Mode replay-đầy-đủ KHÔNG caveat — gate (a) cho #95 sạch (khác #94 có caveat repair).
- **POSTBOOT_PASS #96 CÓ lúc 22:08:08Z** (T5-180, mode **repair-sớm-quyết-h, poll=1**, dpkg 804, cache 111, lists 75 — CÓ caveat repair: tools CHƯA cài, `gst-inspect-1.0: command not found`, GST .so 269). T8 O8 bắt đầu 74 s sau cờ (22:09:22Z). Root KHÔNG bền sau #96 (libs 1/6, GST 0, dpkg 2 — về mẫu #92/#93/#94; theo T8-180). Hướng (3) VẪN ĐỨNG — cờ #96 repair-caveat làm gate (a) cho đợt 180 có caveat (tiền lệ #90/#94); parent/T10 quyết.
- **POSTBOOT_PASS #93 KHÔNG CÓ — ĐÃ XÁC NHẬN, KHÔNG bù được** (tổng boot không cờ 20 — theo T8-179).

### 5.3 Các luồng khác — T7 CHƯA đóng; (m)/INSIDE/mù thuộc T2-180

- T7-180 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~22:55Z) — kết cục run 179 (TIMEOUT theo T0-180: finished 20:36:19Z, margin −28 s, claimed→finished 7 s — chuỗi succeeded run đợt ĐỨT lần 2 liên tiếp, sau run 178 −38 s) + run 180 (vẫn RUNNING lúc T0 đọc, boot_gen #95 — chuỗi jitter 0 s run đợt (175–179) ĐỨT tại run 180) + DR 21:00Z + HB 20:50:50Z thuộc T7-180/T10. T9 đóng đúng hạn cờ, không chờ T7 (cùng mẫu đợt 177/178/179, theo quyết (l) đợt 152).
- T0-180: #95 XÁC MINH 9/9 nguồn; O8 PASS 3/3 trên #95 (WebKit 21/21 ×2 + Chromium 21/21, 21:13:23–21:16:02Z); run 180 jitter 0 s ĐỨT; (m) #95 KHỚP T7-179 (+38,743 s, TRONG dải — phân loại cuối thuộc T2-180 + parent 180). T1-180: verify 179 (không chạy lại suite 28 mục). T2-180: (m) #95 + INSIDE #94/#95 + mù #96?/#95?/#94?/#88?/#77? + (m) #56 lần 23 — thuộc LIMITS T2, T9 không phán thay. T6-180: **#95 CÓ GIẾT HOLDER — chuỗi "không giết holder" từ #69 DỪNG Ở 26 reboot (#69–#94)** (diag attempt 1 của T8-179 giữ lock từ 19:08:55Z, bị #95 giết lúc btime 19:10:22Z, mới giữ 87 s; T8 nhả tay 19:14:36Z); (A) 120/120 lần thứ 30; prune lần 55 (xóa 2 file, queue 102→100); **#96 có giết holder không thuộc T6-181** (T6-180 chỉ lo #95). T8-180: hb128 làm chuẩn — WebKit 3/3 + Chromium 3/3 SẠCH trên #96; O8 PASS 3/3 trên #96 (22:09:22–22:11:59Z); đối chứng chuẩn cũ WebKit KẸT exit 124 (ngoài harness, waitForPlaySync-P4-lần1); (c')/(f') ĐƯỢC GIỮ; H3 chỉ giám sát thụ động; kẹt cộng dồn GIỮ 25.

## 6. Sai số / caveat (F-180-T9-*)

- **F-180-T9-1 — PROBE-LOOP CŨ CHẠY BẢN LỖI + pkill TỰ GIẾT EXEC (2 lỗi vận hành, đã khắc phục trong phiên, KHÔNG mất số liệu).** (a) Probe-loop đầu (pid 108443) dùng `os.inotify_init` (không tồn tại) — probe mở lỗi; lúc sửa, `pkill -f probe-loop.sh` trong cùng lệnh exec giết luôn chính exec (SIGTERM) — probe-loop cũ chết theo, không còn chạy ngầm. (b) Bản ctypes đầu dùng mask 0 → EINVAL; sửa thành mask 0xfff + mỗi watch một thư mục riêng mới đo đúng. Probe-loop chạy lại (pid 109243) đo mở 21:00:00Z = 0; sau reboot #96, probe-loop mới (pid 3139) chạy đúng. Bài học: KHÔNG dùng `pkill -f` với tên script trong cùng lệnh exec — kill theo PID chính xác; kiểm tra API inotify của Python trước khi chạy lane đầu.
- **F-180-T9-2 — RUNTIME RESTART GIẾT SLEEP CHỜ LAN-2 (tái diễn F-179-T9-1 lần 3).** Sleep chờ lan-2 (~21:52Z) bị SIGTERM sau ~19 phút (~21:20:36Z) — chính là reboot #96 giết runtime; tất cả chỉ là bộ đếm giờ chờ, KHÔNG mất số liệu (sampler/watcher/probe-loop chạy độc lập bằng nohup; log đóng băng đầy đủ). T9 kiểm lại trực tiếp sau restart, bắt được reboot #96 trong cùng lượt kiểm và khởi động lại daemon 21:22:06Z (gap mẫu 52 s).
- **F-180-T9-3 — MẪU SAMPLER CUỐI #95 GHI 21:21:14Z, MUỘN HƠN BTIME #96 (21:20:56Z) 18 GIÂY (tái diễn F-179-T9-2, đã được T0-180 XÁC NHẬN cho #95).** Btime #96 từ 2 nguồn độc lập khớp nhau (uptime -s 21:20:56Z + /proc/stat btime epoch 1795468856 + T4-180/T8-180 ghi cùng số, gap 7.834 s); nhưng mẫu sampler cuối trên #95 mang timestamp 21:21:14Z (boot_id 95b483a2) và poller T4 thoát 0 lúc 21:21:23Z. Khả năng: **đồng hồ cell nhanh ~18–27 s trước reboot, được chỉnh lại sau boot** (host-sync; T0-180 đã xác nhận ~26 s cho #95). T9 KHÔNG tự sửa btime — ghi nhận, giao T0-181 xác minh 9 nguồn. Không ảnh hưởng đếm episode (phân theo boot_id trong dòng mẫu, không theo timestamp tuyệt đối) và không ảnh hưởng gap danh nghĩa 52 s (ghi rõ là danh nghĩa).
- **F-180-T9-4 — GIÁ TRỊ SÀN BALLOON 6.050.608 kB (93,9%) LẶP LẠI LẦN THỨ 3 VÀ 4 + GIÁ TRỊ 6.247.216 kB (96,9%) LẶP LẠI.** Đáy sag kết thúc E-207 (21:56:06Z) = 6.050.608 kB — trùng hệt đáy sag tách E-200/E-201 (đợt 178) và E-203/E-204 (đợt 179, F-179-T9-4); mẫu đầu phiên T9-180 (20:58:13Z) cũng đúng 6.050.608 kB. Mẫu 20:57:28Z = 6.247.216 kB — trùng hệt dip tách E-204/E-205 (đợt 179) và mẫu sag đầu E-202. Balloon có vẻ xả về các mức sàn lặp lại (6.050.608 và 6.247.216 kB). T9 chỉ ghi nhận số, không phán cơ chế (host-side).
- **F-180-T9-5 — PYTHON3 CHƯA ĐỊNH DANH ĐỨNG ĐẦU 11/27 SPIKE CỤM B (đầu boot #96).** Cụm B (21:22:06–21:24:16Z, 27 spike): hatch đứng đầu 16, python3 đứng đầu 11 — nhưng snapshot `ps` chỉ ghi comm `python3`, không ghi argv nên không xác định được process nào (KHÔNG phải probe T9: probe chỉ chạy 2 lần ngắn 21:22:06Z và 21:22:21Z, trong khi python3 đứng đầu 11 spike rải 21:22–21:24Z; cũng KHÔNG phải sampler/watcher T9 — đều là bash). Tất cả delta đỉnh cụm B ≤23,7 (nhỏ, theo chuẩn F-178-T9-6 "quy được"). Ghi nhận để các luồng sau ghi argv khi chẩn đoán spike đầu boot; không tính là vi phạm (trước mọi cửa sổ attempt/O8/harness).
- **F-180-T9-6 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm 1 → 2, theo T4).** Không probe nào của T9 trong cửa sổ attempt1 (21:17:29–21:20:58Z): probe-mở 21:00:00Z TRƯỚC attempt; win-96 21:22:06Z + open-2 21:22:21Z SAU khi attempt kết thúc 21:20:58Z; lan-2/lan-3/lan-4/cặp đóng đều ngoài cửa sổ. T4-180 phán 0 VI PHẠM (LIMITS T4). Chuỗi 0 vi phạm đợt 180 thuộc T10/parent phán cuối.
- **F-180-T9-7 — SAMPLER T8 GHI 0 GHIM, SAMPLER T9 GHI 19 GHIM — KHÁC CỬA SỔ/CADENCE, KHÔNG MÂU THUẪN TRỰC TIẾP.** T8-180 LIMITS: "RAM sampler n=32: balloon max 88,5% trần, 0 ghim" — sampler riêng của T8 (cửa sổ làm việc T8, không phủ 21:12–21:13Z lúc E-206 ghim, 21:45–21:55Z lúc E-207 ghim, 22:03–22:08Z lúc E-208 ghim). Sampler T9: 116 mẫu cadence 60 s suốt phiên, log đóng băng md5 `400294685e57c524f3aea6ceba12e508` — căn cứ LIMITS này. Giao T10 đối chiếu hai sampler nếu cần; T9 không sửa số của mình theo sampler khác.
- **F-180-T9-8 — T7 CHƯA đóng cờ lúc T9 đóng (~22:55Z) + T9 ĐÓNG ĐÚNG HẠN CỜ.** T9 không chờ T7 (kết cục run 179/180 + DR/HB thuộc T7-180/T10; cùng mẫu đợt 177/178/179, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).

- **Caveat đứng:** probe cap 30.000; sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #95 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 180; T1-180 không chạy lại suite nên không có cửa sổ T1 để đối chiếu; T7-180 chưa đóng nên không có cửa sổ T7 để đối chiếu.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (116 mẫu, 20:58:13–22:53:08Z): `round180-t9/ram-sampler-FROZEN.log` — md5 `400294685e57c524f3aea6ceba12e508`. Log B2 đóng băng (69 spike): `round180-t9/b2-spikes-FROZEN.log` — md5 `80228bfb019593edd0cd4ebc52e101ad`. Log headroom đóng băng (7 lần đo): `round180-t9/headroom-log-FROZEN.txt` — md5 `c4295ef8b0cebc91373e01aefcbf5a3d`. Phân tích bằng script: `round180-t9/t9-180-analyze.py` (output: `round180-t9/t9-180-analyze-output.txt`). Ghi chú baseline: `round180-t9/t9-180-baseline-notes.md`. T10 đọc log đóng băng trực tiếp khi cần kiểm lại từng mẫu.
