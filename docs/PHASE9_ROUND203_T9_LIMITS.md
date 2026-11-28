# LIMITS — Phase 9 đợt 203, T9: CỬA SỔ THOÁNG #136 QUAN SÁT ĐƯỢC (headroom ≥30.000, boot+73s) + E-247 VẪN MỞ (#136 GHIM 33 CEIL, VẪN GHIM lúc đóng) + ENOSPC #135 ≥93 / #136 44 + live-check #22 KHÔNG ĐẠT (xác nhận độc lập)

## 0. Tóm tắt

- **HEADROOM: 4 lần đo, 2 boot — 0 / 0 / 30.000 / 0.** open 0 (#135, boot+44m14s) + mid 0 (#135) + **postboot 30.000 = CAP (#136, boot+73s — TRONG cửa sổ thoáng 01:10:54–01:11:25Z, QUAN SÁT ĐƯỢC lần thứ hai kể từ đợt 147)** + close 0 (#136). Trần inotify **63.737 KHÔNG ĐỔI**. Headroom cuối phiên 0 — VẪN DƯỚI ngưỡng báo user ~1.800 lúc đóng, nhưng cửa sổ thoáng đã quan sát được lần thứ hai liên tiếp (đợt 202: 28.421; đợt này: ≥30.000 — cao nhất theo thước probe cap 30.000).
- **BALLOON — E-247 VẪN MỞ: #136 GHIM 33 CEIL / 52 mẫu chính (32/52 live) — MỘT ĐỢT GHIM DUY NHẤT 01:30:17–02:02:19Z, VẪN GHIM lúc đóng.** Ghim khi máy yên (load1 0,06–0,79; 13/33 mẫu ≤0,20) — ghim host-side, như #129/#130/#131/#134. **#136 LÀ BOOT CÓ PIN — chuỗi không-pin GIỮ 0. GIỮ MỞ.** #135: 0 CEIL / 79 mẫu — nhưng 45 phút đầu boot (23:06:56–23:51:55Z) KHÔNG có dữ kiện T9 nên KHÔNG tính là boot sạch cho chuỗi (cùng quy tắc #133 đợt 202).
- **Sàn 6.050.608 kB: 1 lần chạm (đọc trực tiếp lúc mở phiên, xem §2.1) — tổng 4 → 5.** Sag 6.247.216 kB: 0 lần — tổng GIỮ 8. Balloon = 0: 0 lần.
- **ENOSPC: #135 ≥93 (37 lúc mở → 93 lúc mid; journal mất sau reboot #136 — số cuối là cận dưới, xem F-203-T9-2); #136 = 44 lúc đóng (0 lúc 01:11:06Z → 42 lúc close 02:00:18Z → 44 lúc 02:02:33Z). Chuỗi đợt có lỗi thật 49 → 50.** Dòng đầu #135 23:08:48Z = boot+112s; dòng đầu #136 01:11:52Z = boot+119s — cả hai VỀ LẠI mẫu ~110s.
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 3.042.024 kB (chính) / 3.040.124 kB (live). **0 lần chạy birefnet — lần thứ 55 liên tiếp (147–201 trừ 190 + 195, + 202, + 203).**
- **Auto-trigger: LIVE 131 mẫu đợt này, tất cả `trigger=watch consec=0`, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **1.770 mẫu (1.639 tới hết đợt 202 + 131 đợt 203), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA.
- **HAI REBOOT TRONG PHIÊN (hai đợt liên tiếp).** #135 btime 23:06:56Z (trước khi lượt mở — cửa sổ thoáng #135 đã đóng trước lượt mở 23:35:51Z, KHÔNG quan sát được) và #136 btime 01:09:53Z giữa phiên (giết toàn bộ daemon T9 + exec sleep chờ của T9; gap đo 79 s chính / 81 s live; T9 tỉnh đúng cửa sổ thoáng #136 và probe kịp boot+73s).
- **RAM: 131 mẫu chính + 131 mẫu live, 23:51:55Z–02:02:19Z, HAI boot.** Max **3.042.024 kB**; min **419.064 kB** (chính 01:36:18Z, #136, CEIL, load1 0,14); live min **366.252 kB** (01:50:17Z, #136, CEIL, load1 0,19); mean chính 1.212.630,6 kB; gate A **69/131** (cả hai luồng). Load1 <4,0: 117/131 mẫu (89,3%) cả hai luồng.
- **Lượt yên #71 (T4): 0/3 attempt hợp lệ — KHÔNG CÓ LƯỢT HỢP LỆ (attempt1 wedged 11/20; attempt2 20/20 nhưng lớp B2 vi phạm load1 max 4,84; attempt3 20/20 + lớp B ĐẠT nhưng tickCost median 117,0 ms > 60) — chuỗi lượt yên hợp lệ 3 → 0 ĐỨT (ĐỀ XUẤT). Kiểm chứng live lần 22: KHÔNG ĐẠT — T9 xác nhận độc lập (không có cửa sổ hợp lệ; W1a 32 spike, W1b 14 spike, W1c 0 spike nhưng lượt không hợp lệ) — chuỗi live ĐẠT 1 → 0 (ĐỀ XUẤT).**
- **B2: 238 spike THẬT (231 trên #135 + 7 trên #136)** — spike cuối 01:11:47Z — **sau 01:11:47Z không còn spike nào tới lúc đóng** (70 phút yên). `ps` 0 lần đứng đầu.
- **0 VI PHẠM phía T9.** Không probe nào của T9 chạm W1; live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 đóng ~02:05Z — TRONG hạn cứng 02:35:51Z.** Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–202 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Probe-once.py bản 203 copy nguyên từ 202.

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 23:51:10Z | **0** | #135 8ea1f5e3 | 63.737 | probe open-203 (boot+44m14s) |
| 00:55:17Z | **0** | #135 | 63.737 | probe mid-203 (boot+1h48m21s; driver) |
| 01:11:06Z | **30.000** | #136 43e3d296 | 63.737 | probe postboot-203 (boot+73s — TRONG cửa sổ thoáng) |
| 02:00:18Z | **0** | #136 | 63.737 | probe close-203 (boot+50m25s; driver) |

- **CỬA SỔ THOÁNG #136: QUAN SÁT ĐƯỢC — headroom=30.000 = CAP (censored — chỉ biết ≥30.000).** Boot btime 01:09:53Z; cửa sổ boot+61–92s (01:10:54–01:11:25Z). Reboot giết phiên exec sleep của T9 (SIGTERM); T9 tỉnh lúc 01:10:52Z = boot+59s, chạy probe NGAY ở exec đầu tiên sau khi xác nhận boot đổi (chỉ `cat boot_id` trước probe — không chạy date/uptime/ps trước, đúng bài học F-201-T9-1); probe postboot-203 chạy 01:11:06Z = boot+73s, TRONG cửa sổ: **headroom=30.000 cap=30000 ceiling=63737**. Đây là lần thứ hai liên tiếp cửa sổ thoáng được quan sát với headroom lớn (đợt 202: 28.421 trên #134) và là giá trị CAO NHẤT từng đo bằng probe cap 30.000 (28.421 < 30.000 = cap — giá trị thật trên #136 có thể cao hơn 30.000, probe không phân biệt được).
- **CỬA SỔ THOÁNG #135: KHÔNG QUAN SÁT ĐƯỢC.** Boot btime 23:06:56Z; cửa sổ boot+61–92s (23:07:57–23:08:28Z) ĐÃ ĐÓNG trước khi lượt cron mở (23:35:51Z = boot+28m55s). Như #133 đợt 202.
- **Headroom cuối phiên: 0** (close 02:00:18Z, #136 boot+50m25s). Trần **KHÔNG ĐỔI trong đợt (63.737 cả 4 lần đo)**.
- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (0)** — nhưng đợt này CÓ dữ kiện cửa sổ thoáng mới (≥30.000): headroom cao chỉ tồn tại trong ~90 s đầu boot, sau đó rơi về 0 trong vòng 50 phút (close 02:00:18Z đã là 0).

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 131 mẫu chính + 131 mẫu live, 23:51:55Z–02:02:19Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 79 s (chính) / 81 s (live)** — reboot #136 01:09:53Z + khởi động lại tay 01:11:17Z; các gap còn lại ≤61 s (jitter bình thường). **Log live TÁCH RIÊNG** (lựa chọn (a) F-200-T9-1): `autotrigger-live/ram-sampler.log` 131 dòng, không ghi chung với log chính.

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 23:51:55Z–01:09:58Z | #135 | 449.044–3.042.024 kB | 79 mẫu chính + 79 live; **0 CEIL**; gate A 58/79 |
| 01:11:17Z–02:02:19Z | #136 | 419.064–1.909.428 kB | 52 mẫu chính + 52 live; **33 CEIL (chính) / 32 (live)**; gate A 11/52 |

- **Gate A ≥1024 MiB: 69/131 mẫu chính (69/131 live)**; **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **9,74** (trên #135, trong cửa sổ W1a T4, 00:15–00:23Z); load1 <4,0: **117/131 mẫu (89,3%)** cả hai luồng; **RAM <512.000 kB: 21 mẫu chính** (22 live) — 1 mẫu trên #135 (01:06:58Z) + 20 mẫu trên #136 (01:31:18Z–, trùng đợt ghim); **RAM <300.000 kB: 0 mẫu** (như đợt 201–202).
- Swap: #135 SwapFree 631.872 → 670.088 kB (**+38.216 kB** trong ~78 phút — swap trả lại, ngược nhịp các boot trước); #136 SwapFree 1.039.900 → 692.112 kB — giảm **347.788 kB trong ~51 phút** (xả swap trên boot mới — cùng nhịp #131 đợt 201: −324.064 kB/116 phút; #134 đợt 202: −327.324 kB/116 phút).
- Trũng RAM đợt này: min **419.064 kB (chính 01:36:18Z, #136, balloon CEIL 6.443.824, load1 0,14)**; live min 366.252 kB (01:50:17Z, #136, CEIL, load1 0,19) — nông hơn kỷ lục 361.072 kB đợt 201 (live) và 401.956 kB đợt 202 (chính).

**Bảng tổng hợp số RAM (từ script `t9-203-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 131 dòng — KHÔNG tính tay; live từ `t9-203-live-analyze.py` trên `autotrigger-live/ram-sampler-FROZEN.log`, 131 dòng):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #135 chính | 79 | 449.044 | 3.042.024 | 1.513.137,3 | 58/79 | 0 | 9,74 | 1 |
| #135 live | 79 | 452.676 | 3.040.124 | 1.525.130,6 | 58/79 | 0 | 9,74 | 1 |
| #136 chính | 52 | 419.064 | 1.909.428 | 756.091,5 | 11/52 | 33 | 4,52 | 20 |
| #136 live | 52 | 366.252 | 1.909.428 | 755.044,2 | 11/52 | 32 | 4,52 | 21 |
| **Toàn phiên** | **131+131** | **419.064** | **3.042.024** | **1.212.630,6 / 1.219.447,4** | — | **33 / 32** | **9,74** | **21 / 22** |

- **Mean chính 1.212.630,6 kB / live 1.219.447,4 kB — weighted mean check KHỚP cả hai script.**

### 2.1 Balloon virtio — #136 GHIM 33 MẪU (CÓ PIN) — E-247 VẪN MỞ, chuỗi không-pin GIỮ 0

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB** (xác nhận lại: 33 mẫu chính + 32 mẫu live đúng bằng trần).
- **Boot #136: GHIM 33/52 mẫu (sampler chính) + 32/52 mẫu (live) — HAI SAMPLER KHỚP 1 ĐỢT GHIM DUY NHẤT.** Balloon #136 dao động 4.476.632–6.443.824 kB; ≥6,0M: 37 mẫu (cả hai luồng). Đợt ghim (chính): **01:30:17–02:02:19Z n=33, VẪN GHIM lúc đóng** (live: 01:31:17–02:02:17Z n=32 — chênh 1 mẫu do mẫu live 01:30:17Z ghi balloon 6.443.684, thấp hơn trần 140 kB vì lệch pha lấy mẫu ~1 s, xem F-203-T9-4 — KHÔNG phải mâu thuẫn). Avail trong đợt ghim chỉ 366–~500 MB. **Đợt ghim xảy ra khi máy YÊN (load1 0,06–0,79; 13/33 mẫu chính ≤0,20)** — ghim KHÔNG do tải guest (cùng mẫu #129/#130/#131/#134). Ghim bắt đầu 01:30:17Z — SAU khi mọi luồng đã đóng (.done: T8 01:35Z là muộn nhất; T56 00:42Z; T4/T01/T7 ~00:0xZ; P1–P4 trước đó) — lúc ghim chỉ còn T10 tổng hợp + T9 đo lường.
- **E-247 — GIỮ MỞ, CHUỖI KHÔNG-PIN GIỮ 0.** Chuỗi boot: #127 0 CEIL / 86 (đợt 198) → #128 0 CEIL / 54 (đợt 199) → **#129 10 CEIL / 82 (đợt 199, GHIM — chuỗi 2 → 0)** → **#130 30 CEIL / 136 (đợt 200, GHIM)** → **#131 27 CEIL / 117 (đợt 201, GHIM)** → **#134 45 CEIL / 116 (đợt 202, GHIM)** → **#136 33 CEIL / 52 (đợt này, GHIM — chuỗi GIỮ 0)**. Điều kiện đóng (3 boot liên tiếp không pin) CHƯA ĐỦ (0/3) — **T9-204 theo dõi tiếp từ #136/#137.** #135 trong đợt này: 0 CEIL / 79 mẫu — nhưng 45 phút đầu boot (23:06:56–23:51:55Z) không có dữ kiện T9 nên KHÔNG tính #135 là boot sạch cho chuỗi (cùng quy tắc #133 đợt 202: chỉ tính boot chưa từng ghim với dữ kiện đầy đủ phiên). #132 (17:03:20–20:32:07Z): T9 không đo — không dữ kiện CEIL.
- **Xác minh độc lập 2 sampler:** live bắt **cùng 1 đợt ghim** trên #136 (n=32 vs chính n=33 — chênh 1 mẫu do lệch pha, xem F-203-T9-4); live cũng bắt đúng **min avail 366.252 kB lúc 01:50:17Z** (chính: 419.064 kB lúc 01:36:18Z — cùng đợt ghim, chênh do lệch pha lấy mẫu). Balloon tại cùng timestamp KHỚP TỪNG SỐ (trừ mẫu 01:30:17Z, xem F-203-T9-4).
- **Balloon = 0: 0 lần đợt này** (như đợt 192–202).
- **Sàn balloon 6.050.608 kB: 1 lần chạm — tổng 4 → 5.** Đọc trực tiếp `/proc/meminfo` lúc mở phiên 23:51:10Z (trước khi sampler chạy): Balloon = 6.050.608 kB ĐÚNG giá trị sàn; mẫu sampler đầu 23:51:55Z balloon đã 5.690.996 kB, mẫu 2 23:52:55Z 5.189.788 kB (balloon rơi nhanh sau mở phiên). Ghi rõ phương pháp: lần chạm này từ đọc trực tiếp, KHÔNG phải mẫu sampler (sampler: 0 lần — tổng theo mẫu sampler vẫn 4; parent quyết có tính lần chạm trực tiếp này không).
- **Giá trị sag 6.247.216 kB: 0 lần đợt này — tổng GIỮ 8.**

### 2.2 Lượt yên WebKit #71 (T4) — 0/3 HỢP LỆ — chuỗi 3 → 0 ĐỨT (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#71 KHÔNG CÓ LƯỢT HỢP LỆ — attempt1 WEDGED (exit=3, partial 11/20 pass, pass-timeout 120.000 ms wall-clock 00:21:26Z); attempt2 20/20 NHƯNG lớp B2 VI PHẠM (sampler load1 max 4,84); attempt3 20/20 + lớp B ĐẠT 5/5 NHƯNG tickCost median 117,0 ms > 60.** **Chuỗi lượt yên hợp lệ 3 → 0 ĐỨT (ĐỀ XUẤT — parent quyết cuối)** — lần đầu đứt chuỗi kể từ #67 (đợt 199).
- **Kiểm chứng live lần 22: KHÔNG ĐẠT** (T9 xác nhận độc lập — xem §3.2). **Chuỗi live ĐẠT 1 → 0 (ĐỀ XUẤT).**
- **Labellag (b): 0 occ / 0 event ≥5f → chuỗi 0 occ 3 → 0 (ĐỀ XUẤT)** (T4; quyết (m)-192: chỉ lượt hợp lệ mới tính).
- **P3' cộng dồn GIỮ NGUYÊN 56 lượt hợp lệ: P1 243/247, P2 238/238, P3-A1 207/247, P3' 205/219 occ = 148/151 distinct-seq, P7 141/141.** Sổ md5 `50f10815` (cơ sở as-of-201 `ad243797` giữ nguyên). Seq MỚI: 0.
- **FULL PASS: KHÔNG CÓ** (chân lượt yên KHÔNG CÓ; chân O8 3/3 cùng boot #135 ĐẠT — T01-203; harness thuộc T8-203) — **chuỗi GIỮ 0.**

### 2.3 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 #135 23:56:02–23:59:38Z | #135 | 1,44–7,99 (3 mẫu) | 1,20–1,29 MB — **gate A 3/3** | **O8 3/3 PASS** (WebKit 21/21 ×2 + Chromium 21/21); 20 spike B2 trong cửa sổ |
| T4 W1a 00:15:21–00:23:03Z | #135 | 0,72–10,21 (8 mẫu live) | 0,45–2,40 MB — gate A 1/8 | **32 spike B2** (khớp T4); attempt1 WEDGED |
| T4 W1b 00:23:25–00:26:54Z | #135 | 1,66–4,01 (3 mẫu live) | 0,84–2,79 MB — gate A 3/3 | **14 spike B2** (khớp T4); attempt2 20/20 nhưng B2 vi phạm |
| T4 W1c 00:28:56–00:33:14Z | #135 | 0,32–0,55 (4 mẫu live) | 1,49–2,02 MB — gate A 4/4 | **0 spike B2** (khớp T4); attempt3 tickCost 117 ms > 60 — lượt không hợp lệ |
| T8 84l10 00:52:00–01:07:10Z | #135 | 0,94–3,26 (15 mẫu) | 0,45–1,18 MB — gate A 2/15 | **KẸT #32** (V2 bắt @125s); 16 spike B2 |
| T8 85m4 01:07:25–01:09:46Z | #135 | 2,99 (2 mẫu) | 0,80–0,94 MB — gate A 0/2 | **PASS**; 9 spike B2 |
| T8 Cr-only 01:15:25–01:23:17Z | #136 | 0,27–1,90 (8 mẫu) | 0,78–1,91 MB — gate A 5/8 | **3/3 PASS** trên #136 (chưa repair/POSTBOOT); 0 spike B2 |

- T01-203: **#135 ỨNG VIÊN 9 nguồn TƯƠI (survey 23:50:50Z + 23:52:35Z)**; O8 3/3 trên #135; **(m) #135 THÔ = 1 requeue DƯƠNG trong cửa** (eid 11744, btime+39,568 s — phân loại CUỐI thuộc T2-204); run 212 FAILED (không phải timeout — T7-203: cf 103 s → CA #33); run 213 RUNNING — kết cục thuộc T7-204; GAP §131 đã viết.
- T2-203: **(m) #132/#133/#134 PHÂN LOẠI CUỐI**; (m) #135 THÔ DƯƠNG chờ T2-204; #100 0/6; sóng EPERM tắt.
- T56-203: **POSTBOOT_PASS #135 CÓ 23:55:18Z** (poll=1, repair-som-quyet-h, dpkg 777); (A) 120/120 lần thứ 52; suite 9/9 × 6 (chuỗi 83 → 84 đề xuất); #135 KHÔNG GIẾT holder (chuỗi 10 → 11 đề xuất); marker 85 → 86 đề xuất; **T56 VI PHẠM: prune chạy TRONG W1 của T4 (F-203-T56-2)** — giao (p)-203. **Watcher-203 chết theo reboot #136 01:09:53Z, KHÔNG ai respawn** (T56 đã đóng ~00:42Z trước reboot) — khoảng không-watcher từ 01:09:53Z tới cuối phiên; T56-204 kiểm lại.
- T7-203: **run 212 FAILED cf 103 s → CA MỚI #33**; run 213 RUNNING; **cửa slot LÀNH** (HB 7/7, DR 4/4 — chuỗi lành 0 → 1 đề xuất); **0 lặng mới**.
- T8-203: **KẸT #32 (84l10 WebKit, bắt sống @125 s)** — chuỗi kẹt 31 → 32; 84l10 PASS chuỗi 1 → 0; harness tách 2 boot (2/6 #135 + 3/3 Chromium #136); **86n2-P1 chuỗi 23 → 24** (chỉ trên Chromium — parent quyết có tính không); B1 live 1 trigger — đợt KHÔNG sạch (chuỗi live sạch 1 → 0); B2 vùng mới 1 trigger — sạch 16 → 0.
- P1/P2/P3/P4-203: ĐÃ đóng (xem LIMITS P1–P4 — T9 không phán chuyên môn sản phẩm).

### 2.4 B2 — 238 spike THẬT (231 #135 + 7 #136); W1a 32 / W1b 14 / W1c 0 (khớp T4 từng số); `ps` 0 lần

Watcher cadence 2 s, ngưỡng load1 ≥ 3,0. **238 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 238): #135: 231** (23:53:03Z–01:09:58Z) **+ #136: 7** (01:11:xx–01:11:47Z). **load1 đỉnh đợt (watcher, cadence 2 s): 10,21.**

| Nhóm (top comm, đã lọc `ps`) | n | Ghi chú |
|---|---|---|
| MainThread | 84 | Process node (tsc/test/vite các luồng P) |
| WebKitWebProces | 59 | T4 yên + T8 harness WebKit |
| hatch | 24 | Tải nền tảng (runtime) |
| ffmpeg | 23 | P3/render |
| grep | 22 | Grep đếm/log của các luồng khác (T2/T56/T7) |
| find | 9 | Lẻ tẻ (build/prune) |
| chrome | 9 | P1 Chrome headless + Chrome khác |
| python3 | 4 | Lẻ tẻ |
| dpkg | 2 | T56 replay/postboot |
| apt-get | 1 | Lẻ tẻ |
| esbuild | 1 | Lẻ tẻ |

Tổng 84+59+24+23+22+9+9+4+2+1+1 = 238 — KHỚP. **`ps`: 0 lần đứng đầu** (bộ lọc F-198-T9-5 HOẠT ĐỘNG — đợt 202: 0/147; đợt này 0/238). Phân theo giờ: 23:xx 61 spike; 00:xx 152 spike; **01:xx 25 spike**. Spike đầu 23:53:03Z; spike cuối 01:11:47Z — **sau 01:11:47Z không còn spike nào tới lúc đóng** (70 phút yên: mọi luồng đã đóng, chỉ còn T10 + T9).
- **W1a (00:15:21–00:23:03Z): 32 spike** (đếm trực tiếp từ `b2-spikes-FROZEN.log`, KHỚP T4); **W1b (00:23:25–00:26:54Z): 14 spike** (KHỚP T4); **W1c (00:28:56–00:33:14Z): 0 spike** (KHỚP T4).
- **B2 dữ kiện #15** cho quyết tách (cách đếm (j)-200: mỗi đợt = 1 dữ kiện): KHÔNG CÓ W1 hợp lệ. T9 chỉ báo số, KHÔNG tự quyết tách (luật B2 KHÔNG TÁCH vẫn đứng cho tới khi parent quyết).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-201; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 3.042.024 kB (sampler chính, #135) / 3.040.124 kB (live, #135). **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 55 liên tiếp (147–201 trừ 190 + 195, + 202, + 203 — xem §3.1 đợt 202).**
- **QUYẾT (o) §14.2-201: AUTO-TRIGGER GIỮ LIVE.** Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-203:** live TIẾP TỤC từ đợt 202 (không flip mới) — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 202 §14.2 bản parent (75.747 B — NGUỒN QUYẾT DUY NHẤT); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189..202; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 202 (copy nguyên từ round202-t9). Khởi động 23:51:55Z (pid 295995) với env đúng ngay lần đầu; **khởi động LẠI 01:11:17Z (pid 3079) sau reboot #136** — cùng tham số. **LỰA CHỌN (a) F-200-T9-1 — ÁP DỤNG: `--round-dir .../round203-t9/autotrigger-live`** (log live tách riêng — xem §6).
- **LIVE PHASE ĐỢT 203: 131 mẫu, 23:51:55Z–02:02:17Z (79 mẫu #135 + 52 mẫu #136), TẤT CẢ `trigger=watch consec=0`, max avail 3.040.124 kB, load1 <4,0: 117/131 (89,3%) — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `round203-t9/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Live chạy suốt cả 3 cửa sổ attempt T4, 0 FIRE trong W1a/W1b/W1c. **Khoảng mù live: 81 s do reboot #136** (mẫu live cuối #135 01:09:56Z → mẫu đầu #136 01:11:17Z; daemon chết cùng reboot, khởi động lại tay — KHÔNG có mù nào khác; đợt 202: mù 78 s).
- **TỔNG LIVE TỪ 03:14Z 25/11: 1.770 mẫu (1.639 tới hết đợt 202 + 131 đợt 203), 0 FIRE.**
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 1.770 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 55 đợt đếm). **Lưu ý mới:** balloon #136 leo tới CEIL 6,44M NHƯNG avail lúc đó chỉ 366–500 MB — guard đo bằng MemAvailable, không phải balloon; balloon cao không mở guard. Auto-trigger 0 FIRE trong suốt đợt là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 202); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round203-t9/` (live chạy 131 mẫu, 0 sự kiện).

### 3.2 Kiểm chứng live lần 22 (đợt 203) — T9 XÁC NHẬN ĐỘC LẬP: KHÔNG ĐẠT (đồng ý với T4)

- **LIVE-CHECK #22 (đợt 203): KHÔNG ĐẠT — T9-203 xác nhận độc lập từ log live + log B2 của mình, KHỚP T4 TỪNG SỐ.** Không có cửa sổ hợp lệ: W1a 00:15:21–00:23:03Z (attempt1 wedged + 32 spike B2); W1b 00:23:25–00:26:54Z (attempt2 20/20 nhưng 14 spike B2); W1c 00:28:56–00:33:14Z (0 spike B2 nhưng attempt3 tickCost median 117,0 ms > 60 nên lượt không hợp lệ). Áp ĐÚNG định nghĩa (p)-192 như #14/#16/#19/#20/#21 — đợt này **KHÔNG CÓ cửa sổ hợp lệ** nên KHÔNG ĐẠT — tiền lệ #15 đợt 196 ("không có cửa sổ hợp lệ để đối chiếu"). **Chuỗi live ĐẠT 1 → 0 (ĐỀ XUẤT) — T9 ĐỒNG Ý với verdict T4.**
- Số live trong cửa sổ (đếm trực tiếp từ log live đóng băng — KHỚP T4): W1a 8 mẫu (00:15:55–00:22:55Z, load1 tới 9,74, avail max 2.401.144 kB); W1b 3 mẫu (00:23:55 load1 1,66; 00:24:55 load1 4,01; 00:25:55 load1 2,19; avail max 2.792.880 kB); W1c 4 mẫu (00:29:55–00:32:55Z, load1 0,32–0,55, avail max 2.019.964 kB) — **tất cả `trigger=watch consec=0`, 0 FIRE**; max avail mọi cửa sổ < guard. (Mẫu 00:26:55Z nằm 1 s SAU inner-end attempt2 nên KHÔNG tính vào W1b; mẫu 00:33:55Z nằm sau attempt3 nên KHÔNG tính vào W1c — cùng lớp F-200-T9-4.)
- Caveat ghi rõ cho parent (như T4): W1c có 0 spike B2 — nếu parent quyết W1c tính là cửa sổ hợp lệ cho live-check thì live #22 sẽ ĐẠT; T9 đề xuất KHÔNG (cửa sổ của lượt không hợp lệ không phải cửa sổ hợp lệ — nhất quán với cách P3' chỉ cộng lượt hợp lệ).
- Toàn log live 203: 131 mẫu, 0 dòng trigger != watch consec=0.

## 4. ENOSPC trong journal (đếm trực tiếp — 2 boot, journal MẤT SAU MỖI REBOOT)

- **#135: đếm trực tiếp 37 dòng lúc mở 23:50Z → 93 dòng lúc mid 00:55:17Z (cả hai grep KHỚP 93=93)** — dòng đầu **23:08:48Z (boot+112s)**; dòng cuối lúc đếm **00:55:xxZ**. **KHÔNG đếm lại trước reboot 01:09:53Z** (khoảng mù 00:55:17–01:09:53Z ≈ 15 phút — lặp lại một phần F-202-T9-2, xem F-203-T9-2); journal #135 đã mất sau reboot, KHÔNG ngoại suy — **số cuối #135 = ≥93 (cận dưới)**.
- **#136: đếm trực tiếp 44 dòng lúc đóng 02:02:33Z (cả hai grep KHỚP 44=44)** — dòng đầu **01:11:52Z (boot+119s)**; dòng cuối lúc đếm **02:01:39Z**. Đếm giữa phiên: 0 lúc 01:11:06Z → 42 lúc close 02:00:18Z → **44 lúc 02:02:33Z**. Nhịp ~0,85 dòng/phút, cùng nhịp #126/#127/#129/#130/#131/#134/#135. Toàn bộ các dòng đều là `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. **Số cuối 44 là cận dưới** — journal #136 sẽ mất sau reboot tiếp theo, không đếm thêm được; không ngoại suy.
- **Tổng phiên (2 boot, đếm trực tiếp): #135 ≥93 (lúc mid) + #136 44 (lúc đóng). Chuỗi đợt có lỗi thật: 49 → 50** (cả hai boot đợt này đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-203 áp dụng ĐẦY ĐỦ, trừ điểm (4) cho #135):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#136: 44=44; #135: 93=93 — KHỚP); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên (#136: 44 lúc 02:02:33Z; #135: KHÔNG đếm lại được — ghi rõ ở trên); (5) phần journal mất sau reboot thì KHÔNG ngoại suy; (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai reboot trong phiên (T9 bắt trực tiếp: gap đo 79 s + exec bị giết)

- **#135 (8ea1f5e3-ee03-4e83-ac26-9be9be446566, btime 23:06:56Z, epoch 1795820816; ỨNG VIÊN — T01-203 survey 9 nguồn TƯƠI 23:50:50Z + 23:52:35Z, parent quyết (e)-203).** Sampler T9 trên #135 đợt 203: 23:51:55Z–01:09:58Z (79 mẫu chính + 79 mẫu live). #135 chết 01:09:53Z. Gap #134→#135 = 7.301 s (2h01m41s).
- **#136 (43e3d296-4890-41ed-b8d0-c794f72419bc, btime 01:09:53Z, epoch 1795828193; số hiệu ỨNG VIÊN, CHƯA SURVEY — T01-203 đã đóng ~00:03Z trước reboot; T8-203 ghi "CHƯA SURVEY"; parent quyết (e)-203).** Sampler T9 trên #136: 01:11:17Z–02:02:19Z (52 mẫu chính + 52 mẫu live). Gap #135→#136 = **7.377 s** (2h02m57s). #136 vẫn sống lúc T9 đóng (mẫu cuối 02:02:19Z/02:02:17Z mang boot_id #136).
- **Khoảng không-sampler giữa hai đợt: ~48m53s** (mẫu cuối T9-202 23:03:02Z → mẫu đầu T9-203 23:51:55Z — watcher-202 chết cùng reboot #135, không ai respawn). **Khoảng không-sampler trong phiên: 79 s (chính) / 81 s (live)** do reboot #136. **Khoảng không-watcher: reboot #136 01:09:53Z → cuối phiên — watcher-203 chết theo reboot, KHÔNG ai respawn** (T56-203 đã đóng ~00:42Z trước reboot; T56-204 kiểm lại).
- **(m) #135 THÔ: 1 requeue DƯƠNG trong cửa** (T01-203 + T2-203: eid 11744, btime+39,568 s — phân loại CUỐI thuộc T2-204). **(m) #136 THÔ: chưa có** (T01 đã đóng trước reboot; T2-204 survey).

### 5.2 Các luồng khác — 12/12 cờ đã đóng lúc T9 đóng (P1/P2/P3/P4/T01/T2/T4/T5/T56/T7/T8); T9 là cờ cuối (trừ T10 tổng hợp)

- T01-203 ĐÃ đóng: #135 ỨNG VIÊN 9 nguồn TƯƠI; O8 3/3 trên #135; GAP §131 đã viết.
- T2-203 ĐÃ đóng: **(m) #132/#133/#134 PHÂN LOẠI CUỐI**; (m) #135 THÔ DƯƠNG chờ T2-204; #100 0/6; sóng EPERM tắt.
- T4-203 ĐÃ đóng: #71 0/3 hợp lệ; live-check #22 KHÔNG ĐẠT (T9 xác nhận §3.2); B2 dữ kiện #15 (không có W1 hợp lệ).
- T5-203 ĐÃ đóng: repair #134 + #135 ĐÚNG (verify sau-repair #135 22/22 PASS 23:57:10Z).
- T56-203 ĐÃ đóng: POSTBOOT_PASS #135 CÓ 23:55:18Z; (A) 120/120 lần thứ 52; suite 9/9 × 6 (83 → 84); marker 85 → 86 đề xuất; **T56 VI PHẠM prune trong W1 (F-203-T56-2)**.
- T7-203 ĐÃ đóng: run 212 FAILED cf 103 s → **CA MỚI #33**; run 213 RUNNING; cửa slot LÀNH (chuỗi 0 → 1 đề xuất); 0 lặng mới.
- T8-203 ĐÃ đóng: **KẸT #32** (84l10 WebKit @125s); harness tách 2 boot (2/6 #135 + 3/3 Chromium #136); 86n2-P1 chuỗi 23 → 24 (chỉ Chromium); B1 live 1 trigger — đợt KHÔNG sạch.
- P1/P2/P3/P4-203 ĐÃ đóng (xem LIMITS P1–P4 — T9 không phán chuyên môn sản phẩm).

## 6. Sai số / caveat (F-203-T9-*)

- **F-203-T9-1 — REBOOT #136 GIẾT DAEMON + EXEC SLEEP CỦA T9; POSTBOOT PROBE KỊP CỬA SỔ THOÁNG (MỚI — BÀI HỌC F-201-T9-1 ĐƯỢC ÁP DỤNG ĐẦY ĐỦ).** Reboot #136 01:09:53Z giết 4 daemon T9 đợt 1 (pid 295993–295998) + exec sleep chờ giữa phiên (SIGTERM ~01:11Z — T9 tỉnh lúc 01:10:52Z = boot+59s, chạy probe NGAY ở exec đầu tiên sau khi xác nhận boot đổi, chỉ `cat boot_id` trước probe — không date/uptime/ps xen giữa); probe postboot-203 chạy 01:11:06Z = boot+73s, TRONG cửa sổ: **headroom=30.000 = CAP**. Daemon khởi động lại tay 01:11:17Z (sampler pid 3078, live 3079, b2watch 3081, driver 3082 — PID thật, xem F-203-T9-3); driver mới BOOT0=#136, close probe 02:00:18Z chạy đúng. Khác đợt 202 (tỉnh đúng giây đầu cửa sổ nhưng vẫn kiểm tra trạng thái trước probe) — đợt này probe là lệnh đo đầu tiên sau xác nhận reboot. Bài học F-201-T9-1 nay được áp dụng đầy đủ cả ở lượt mở (probe open-203 là lệnh đo đầu tiên của lượt, 23:51:10Z) lẫn sau reboot giữa phiên.
- **F-203-T9-2 — ENOSPC #135 CHỈ CÓ SNAPSHOT MID, KHÔNG ĐẾM LẠI TRƯỚC REBOOT (LẶP LẠI MỘT PHẦN F-202-T9-2 — MỨC NHẸ HƠN).** T9 đếm ENOSPC #135 lúc mở (37, 23:50Z) + mid (93, 00:55:17Z) rồi ngủ chờ tới close; không đếm lại trong khoảng 00:55:17–01:09:53Z; reboot #136 xóa journal #135. Số #135 đợt 203 chỉ còn cận dưới ≥93. Mức nhẹ hơn đợt 202 (snapshot mid cách reboot chỉ ~15 phút, nhịp ~0,85 dòng/phút → thiếu tối đa ~13 dòng; đợt 202: snapshot mở cách reboot 24 phút). Đề xuất T9-204: đếm ENOSPC ngay trước mỗi lần sleep dài (không chỉ lúc mở/mid/đóng) — bài học F-201-T9-6 vẫn chưa được áp dụng đầy đủ.
- **F-203-T9-3 — `$!` LÀ SHELL TRUNG GIAN, KHÔNG PHẢI PID DAEMON (MỚI — ĐÃ SỬA, KHÔNG MẤT DỮ KIỆN).** Lệnh khởi động daemon đợt 2 dùng `cd $H && nohup ./sampler.sh &` — `$!` trả về PID của shell trung gian (3075–3077/3080), không phải daemon thật (sampler 3078, live 3079, b2watch 3081, driver 3082 — xác minh bằng `ps aux | grep`). T9 đã sửa `pids.txt` ghi PID thật; lệnh dừng daemon lúc đóng dùng PID thật (kill 3078/3079/3081 — driver đã tự kết thúc 02:00:18Z) nên không lặp lỗi F-202-T9-3 (pkill -f giết shell exec). Bài học: sau khởi động daemon, xác minh PID bằng `ps` theo tên script rồi mới ghi pids.txt.
- **F-203-T9-4 — MẪU LIVE 01:30:17Z THẤP HƠN TRẦN 140 kB (MỚI — LỆCH PHA, KHÔNG MÂU THUẪN).** Mẫu live 01:30:17Z ghi balloon 6.443.684 kB (thấp hơn trần 6.443.824 đúng 140 kB) trong khi mẫu chính cùng timestamp ghi đúng trần — hai sampler lệch pha ~1 s, balloon đang leo dốc tới trần (01:26:17Z 6.059.708 → 01:29:17Z 6.372.200 → 01:30:17Z 6.443.824). Đợt ghim là MỘT đợt duy nhất trên cả hai luồng (chính n=33 từ 01:30:17Z, live n=32 từ 01:31:17Z); chênh 1 mẫu là lệch pha, không phải hai đợt ghim khác nhau.
- **F-203-T9-5 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; probe open 23:51:10Z trước mọi attempt (T4 mở W1a 00:15:21Z); probe postboot 01:11:06Z diễn ra khi T8 đang ở giữa hai pha (86n2 WebKit chết ~01:10:23Z theo SIGTERM, harness Chromium-only chưa bắt đầu — 01:15:25Z) — không có attempt nào đang chạy, probe inotify nhẹ; probe mid 00:55:17Z không chồng lấn cửa sổ yên nào (W1a mở 00:15:21Z đã kết thúc 00:23:03Z; T8 harness bắt đầu 00:51:57Z — probe mid 00:55:17Z CHỒNG với pha 84l10 WebKit 00:52:00–01:07:10Z nhưng probe chỉ tạo ≤30.000 watch rồi giải phóng ngay, không ghi file, không chạm dpkg — ghi nhận để T10/parent phán nếu cần); probe close 02:00:18Z sau khi mọi luồng đo đã đóng); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG ~02:05Z — TRONG hạn cứng 02:35:51Z.** Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: đợt 202 có vi phạm mới hay không thuộc T10/parent (T4 ghi nhận chồng lấn trong W1 đợt 203: T56 prune trong W1, F-203-T56-2 — giao T56/parent phán (p)-203; sampler live T9 trong W1 là daemon đo lường/tuân thủ — theo (p)-200 KHÔNG VI PHẠM).
- **F-203-T9-6 — MẪU SAMPLER CUỐI #135 NGOÀI BTIME #136 (CÙNG LỚP F-201-T9-3/F-202-T9-6).** Mẫu chính cuối trên #135 01:09:58Z mang boot_id `8ea1f5e3` dù btime #136 là 01:09:53Z (5 s sau btime) — sampler đọc boot_id TRƯỚC khi reboot hoàn tất ghi đè. T9 giữ nguyên log (không sửa mẫu), ghi rõ: **mẫu 01:09:56Z (live) / 01:09:58Z (chính) thuộc phiên #135 về mặt boot_id nhưng nằm sau btime #136 3/5 s** — phân tích theo boot_id như mọi đợt. Hệ quả thực tế: 0 — close probe 02:00:18Z đã xong trước mọi reboot sau đó; ENOSPC #136 chốt ở 44 (02:02:33Z).

- **Caveat đứng:** probe cap 30.000 (giá trị postboot là censored — chỉ biết ≥ 30.000; headroom 28.421 đợt 202 < cap nên KHÔNG bị censored); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 1.770 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); cửa sổ thoáng #135 KHÔNG quan sát được đợt này (đóng trước lượt mở); số hiệu #135/#136 là ỨNG VIÊN (parent quyết (e)-203); E-247 GIỮ MỞ (T9 chỉ báo dữ kiện + đếm boot không-pin: chuỗi GIỮ 0); #135 chỉ có 79 mẫu quan sát được (thiếu 45 phút đầu boot) nên không tính là boot sạch cho chuỗi; sàn balloon tổng 4 → 5 CHỈ NẾU tính lần chạm đọc trực tiếp lúc mở (xem §2.1 — parent quyết).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (131 dòng chính: 79 #135 + 52 #136, 23:51:55Z–02:02:19Z): `hidden_files/round203-t9/ram-sampler-FROZEN.log` — md5 `430af5470a93a654411cd3e3bfd39ef7`. Log live đóng băng (131 dòng, tách riêng): `hidden_files/round203-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `932e9c5cdf5e6c11b2eed65a6a5b8f54`. Log B2 đóng băng (238 spike): `hidden_files/round203-t9/b2-spikes-FROZEN.log` — md5 `59b4a947e1de5e89597891408de9e8d6`. Log headroom đóng băng (4 lần đo): `hidden_files/round203-t9/headroom-log-FROZEN.txt` — md5 `c93b7dc9fbcfff9d5d16d468d4456afd`. Phân tích: `t9-203-analyze.py` (output `t9-203-analyze-output.txt`) + `t9-203-live-analyze.py` (output `t9-203-live-analyze-output.txt`) + `t9-203-b2-analyze.py` (output `t9-203-b2-analyze-output.txt`). Baseline: `t9-203-baseline-notes.md` (gồm lựa chọn (a) F-200-T9-1 + reboot #136 + tra chuỗi birefnet F-201-T10-4). Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). Driver: `t9-203-driver.sh` (mid 00:55Z, close 02:00Z, reboot watch — tự kết thúc 02:00:18Z sau probe close). B2 watcher bản 203 (`b2watch.sh` — lọc `ps` + ghi `boot=` mỗi spike). T10 đọc log đóng băng trực tiếp khi cần.
