# LIMITS — Phase 9 đợt 201, T9: headroom 0 CẢ 4 PROBE (2 boot, reboot #131 giữa phiên + reboot #132 sau close) + E-247 VẪN MỞ (#131 GHIM 27 CEIL — chuỗi không-pin GIỮ 0) + ENOSPC #131 95 dòng + auto-trigger live 134 mẫu 0 FIRE (tổng 1.497) + live-check #20 KHÔNG ĐẠT (xác nhận độc lập)

## 0. Tóm tắt

- **HEADROOM: 4 lần đo, 2 boot, TẤT CẢ 0.** open 0 (#130, boot+3h28m31s) + postboot-late 0 (#131, boot+263s) + mid 0 (#131, boot+45m35s) + close 0 (#131, boot+1h55m38s). Trần inotify **63.737 KHÔNG ĐỔI**. Cửa sổ thoáng postboot #131 **KHÔNG QUAN SÁT ĐƯỢC** — T9 tỉnh sau reboot lúc boot+88s (trong cửa sổ) nhưng exec đầu chạy kiểm tra trạng thái thay vì probe; cửa sổ đóng 4s sau đó (F-201-T9-1).
- **BALLOON — E-247 VẪN MỞ: #131 GHIM 27 CEIL / 117 mẫu chính (live 28/117 — lệch pha ±1 mẫu, cùng 3 đợt ghim).** Ghim khi máy yên (load1 CEIL 0,02–0,64; 12/27 mẫu ≤0,20) — ghim host-side, như #129/#130. **#131 LÀ BOOT CÓ PIN — chuỗi không-pin GIỮ 0 (đã 0 sau #129). GIỮ MỞ.**
- **Sàn 6.050.608 kB: 2 lần đợt này — tổng 2 → 4** (16:30:41Z, 17:02:43Z). **Sag 6.247.216 kB: 1 lần — tổng 7 → 8** (16:20:41Z). Balloon = 0: 0 lần.
- **ENOSPC: #131 = 95 dòng lúc close 17:00:03Z (hai grep KHỚP 95=95), vẫn tăng lúc đóng. Chuỗi đợt có lỗi thật 47 → 48.** Dòng đầu #131 15:07:26Z = boot+181s. #130 trong đợt: ≥168 dòng lúc 14:47:48Z (không đếm lại trước reboot — journal mất sau reboot, KHÔNG ngoại suy). **#132 (mới, btime 17:03:20Z): dòng đầu boot+117s — VỀ LẠI mẫu ~110s (cho T9-202).**
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 3.480.900 kB (chính) / 3.476.872 kB (live). **0 lần chạy birefnet — lần thứ 53 liên tiếp (147–201).**
- **Auto-trigger: LIVE 134 mẫu đợt này, tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **1.497 mẫu (1.363 tới hết đợt 200 + 134 đợt 201), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA.
- **HAI REBOOT TRONG PHIÊN — chuỗi 1 đợt không reboot (đợt 200) đã đứt.** #131 15:04:25Z giữa phiên (giết toàn bộ daemon T9 + exec sleep của T9; gap đo 165 s) và #132 17:03:20Z SAU probe close (giết exec dừng daemon của T9; log kết 17:03:39/43Z). Daemon khởi động lại tay 15:07:37Z sau #131; sau #132 KHÔNG khởi động lại (phiên đã đóng).
- **RAM: 134 mẫu chính + 134 mẫu live, 14:48:51–17:03:43Z, HAI boot.** Max **3.480.900 kB**; min **361.072 kB** (live 16:57:38Z, #131, CEIL, load1 0,04 — nông hơn kỷ lục 253.436 kB đợt 197 và 271.976 kB đợt 200); mean chính 1.177.056,4 kB; gate A **57/134** (chính) / 59/134 (live). Load1 <4,0: 127/134 mẫu (94,8%) cả hai luồng.
- **Lượt yên #69 (T4): HỢP LỆ (attempt1 20/20 trên #130, lớp B ĐẠT 5/5, tickCost median 50,5 ms) — chuỗi lượt yên hợp lệ 1 → 2 (ĐỀ XUẤT). Kiểm chứng live lần 20: KHÔNG ĐẠT — T9 xác nhận độc lập (24 spike B2 trong W1, khớp T4 từng số; 4 mẫu live đều watch/consec=0, 0 FIRE, max avail 3.262.344 kB < guard) — chuỗi live ĐẠT 1 → 0 (ĐỀ XUẤT).**
- **B2: 179 spike THẬT (41 trên #130 + 138 trên #131)** — W1 24 spike (dữ kiện #13 theo cách đếm (j)-200); `ps` 0 lần đứng đầu; spike cuối 15:43:42Z — **sau 15:43:42Z không còn spike nào tới lúc đóng** (79 phút yên).
- **0 VI PHẠM phía T9. Probe close chạy đúng 17:00:03Z; T9 đóng ~17:12Z — TRONG hạn cứng 17:35:51Z** (trễ cờ ~17:00Z do reboot #132 giết exec dừng daemon lúc ~17:04Z; tiền lệ T9-200 về muộn vẫn trong hạn cứng — ghi nhận, không phạt). Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–200 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Probe-once.py bản 201 copy nguyên từ 200.

### 1.1 Số đo đợt 201 (4 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 14:50:12Z | **0** | #130 c073c8bb | 63.737 | probe open-201 (boot+3h28m31s) |
| 15:08:48Z | **0** | #131 7d642f2a | 63.737 | probe postboot-201-late (boot+263s) |
| 15:50:00Z | **0** | #131 | 63.737 | probe mid-201 (boot+45m35s; driver) |
| 17:00:03Z | **0** | #131 | 63.737 | probe close-201 (boot+1h55m38s; driver) |

- **CỬA SỔ THOÁNG #131: KHÔNG QUAN SÁT ĐƯỢC trong đợt 201.** Boot btime 15:04:25Z; cửa sổ boot+61–92s (15:05:26–15:05:57Z). Reboot giết phiên exec của T9; T9 tỉnh lúc 15:05:53Z = boot+88s (TRONG cửa sổ) nhưng exec đầu tiên chạy kiểm tra trạng thái thay vì probe; cửa sổ đóng 4s sau đó. Khác đợt 199 (phát hiện đúng giây đầu cửa sổ nhưng probe trễ 6s) và đợt 200 (không có mặt trong cửa sổ) — đợt này T9 có mặt trong cửa sổ nhưng probe không chạy kịp (F-201-T9-1). Probe muộn postboot-201-late 15:08:48Z (boot+263s) không thay thế được cửa sổ thoáng.
- **Cửa sổ thoáng #130: KHÔNG ÁP DỤNG đợt này** (đã đóng từ đợt 200; đợt 201 mở lúc boot+3h26m).
- **Headroom cuối phiên: 0** (close 17:00:03Z, #131 boot+1h55m38s). Trần **KHÔNG ĐỔI trong đợt (63.737 cả 4 lần đo)**.
- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (0)** — và đợt này KHÔNG có dữ kiện cửa sổ thoáng mới (cửa sổ duy nhất không quan sát được).

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 134 mẫu chính + 134 mẫu live, 14:48:51–17:03:43Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 165 s (chính) / 167 s (live)** — reboot #131 15:04:25Z + khởi động lại tay 15:07:37Z; các gap còn lại ≤61 s (jitter bình thường). **Log live TÁCH RIÊNG đợt này** (lựa chọn (a) F-200-T9-1 — xem §6): `autotrigger-live/ram-sampler.log` 134 dòng, không ghi chung với log chính.

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 14:48:51–15:04:52Z | #130 | 609.748–3.480.900 kB | 17 mẫu chính + 17 live; **0 CEIL**; gate A 15/17 |
| 15:07:37–17:03:43Z | #131 | 361.072–2.879.068 kB | 117 mẫu chính + 117 live; **27 CEIL (chính) / 28 (live)**; gate A 42/117 (chính) / 44/117 (live) |

- **Gate A ≥1024 MiB: 57/134 mẫu chính (59/134 live)**; **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **8,96** (trong cửa sổ harness T8, 15:28–15:46Z); load1 <4,0: **127/134 mẫu (94,8%)** cả hai luồng; **RAM <512.000 kB: 34 mẫu chính** (36 live) — 4 dải trên #131: 16:18:41–16:19:41Z n=2; 16:22:41–16:29:41Z n=8; 16:33:42–16:45:42Z n=13; 16:51:42–17:01:43Z n=11; **RAM <300.000 kB: 0 mẫu** (khác đợt 200: 14 mẫu).
- Swap: #130 SwapFree 571.020 → 581.216 kB (+10.196 kB — tăng nhẹ); #131 SwapFree 935.048 → 610.984 kB — giảm **324.064 kB trong ~116 phút** (xả swap trên boot mới — nhanh hơn #130 đợt 200: −184.656 kB/135 phút).
- Trũng RAM đợt này: min **361.072 kB (live 16:57:38Z, #131, balloon CEIL 6.443.824, load1 0,04)**; chính min 373.572 kB (16:24:41Z, #131, CEIL, load1 0,23) — nông hơn kỷ lục 253.436 kB đợt 197 và 271.976 kB đợt 200.

**Bảng tổng hợp số RAM (từ script `t9-201-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 134 dòng — KHÔNG tính tay; live từ `t9-201-live-analyze.py` trên `autotrigger-live/ram-sampler-FROZEN.log`, 134 dòng):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #130 chính | 17 | 609.748 | 3.480.900 | 2.474.578,1 | 15/17 | 0 | 4,61 | 0 |
| #130 live | 17 | 609.820 | 3.476.872 | 2.476.009,6 | 15/17 | 0 | 4,61 | 0 |
| #131 chính | 117 | 373.572 | 2.842.176 | 988.527,6 | 42/117 | 27 | 8,96 | 34 |
| #131 live | 117 | 361.072 | 2.879.068 | 985.906,5 | 44/117 | 28 | 8,96 | 36 |
| **Toàn phiên** | **134+134** | **361.072** | **3.480.900** | **1.177.056,4 / 1.174.949,5** | — | **27 / 28** | **8,96** | **34 / 36** |

- **Mean chính 1.177.056,4 kB / live 1.174.949,5 kB — weighted mean check KHỚP cả hai script.**

### 2.1 Balloon virtio — #131 GHIM 27 MẪU (CÓ PIN) — E-247 VẪN MỞ, chuỗi không-pin GIỮ 0

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB** (xác nhận lại: 27 mẫu chính + 28 mẫu live đúng bằng trần).
- **Boot #131: GHIM 27/117 mẫu (sampler chính) + 28/117 mẫu (live) — HAI SAMPLER KHỚP 3 ĐỢT GHIM (lệch pha ±1 mẫu ở biên).** Balloon #131 dao động 2.957.376–6.443.824 kB; ≥6,0M: 52 mẫu (chính) / 54 (live). Đợt ghim (chính): **16:23:41–16:28:41Z n=6** + **16:35:42–16:45:42Z n=11** + **16:52:42–17:01:43Z n=10** (live: n=7+11+10, cùng cửa sổ ±3 s — live bắt thêm 16:29:38Z vì balloon tụt khỏi trần lúc 16:29:41Z ở luồng chính, 6.359.856 kB, dưới trần 83.968 kB). Avail trong đợt ghim chỉ 361–~500 MB. **Đợt ghim xảy ra khi máy YÊN (load1 CEIL 0,02–0,64; 12/27 mẫu chính ≤0,20)** — ghim KHÔNG do tải guest (xem F-200-T9-2/F-199-T9-7, cùng mẫu). Ghim bắt đầu 16:23:41Z — SAU khi T4 (15:23Z), T2 (15:55Z), T56 (16:00Z) đã đóng và T8 đóng 16:23Z — máy gần như không còn luồng đo/build lúc ghim.
- **E-247 — GIỮ MỞ, CHUỖI KHÔNG-PIN GIỮ 0.** Chuỗi boot: #127 0 CEIL / 86 (đợt 198) → #128 0 CEIL / 54 (đợt 199) → **#129 10 CEIL / 82 (đợt 199, GHIM — chuỗi 2 → 0)** → **#130 30 CEIL / 136 (đợt 200, GHIM — chuỗi GIỮ 0)** → **#131 27 CEIL / 117 (đợt này, GHIM — chuỗi GIỮ 0)**. Điều kiện đóng (3 boot liên tiếp không pin) CHƯA ĐỦ (0/3) — **T9-202 theo dõi tiếp từ #132.** #130 trong cửa sổ đợt 201 (17 mẫu, 14:48–15:04Z): 0 CEIL — nhưng #130 ĐÃ GHIM ở đợt 200 nên không tính là boot sạch; chuỗi không-pin chỉ tính boot chưa từng ghim.
- **Xác minh độc lập 2 sampler:** live bắt **cùng 3 đợt ghim** trên #131 (n=7+11+10 vs chính n=6+11+10 — chênh 1 mẫu do lệch pha lấy mẫu 3 s ở biên tụt trần, KHÔNG phải mâu thuẫn); live cũng bắt đúng **sag 16:20:38Z + floor 16:30:38Z** (chính: sag 16:20:41Z, floor 16:30:41Z — KHỚP từng sự kiện). Balloon tại cùng timestamp KHỚP TỪNG SỐ (lệch ±1–3 s).
- **Balloon = 0: 0 lần đợt này** (như đợt 192–200).
- **Sàn balloon 6.050.608 kB: 2 lần đợt này (16:30:41Z + 17:02:43Z chính) — tổng 2 → 4** (live bắt 1 lần 16:30:38Z; mẫu 17:02:38Z live là sag 6.247.216 — balloon tụt từ sag xuống sàn trong 5 s giữa hai lần lấy mẫu; tổng tính theo luồng chính như mọi đợt).
- **Giá trị sag 6.247.216 kB: 1 lần đợt này (16:20:41Z chính) — tổng 7 → 8** (live bắt 2 lần: 16:20:38Z + 17:02:38Z — cùng cơ chế lệch pha như trên; tổng tính theo luồng chính).

### 2.2 Lượt yên WebKit #69 (T4) — HỢP LỆ (1/1) — chuỗi 1 → 2 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#69 HỢP LỆ — attempt1 20/20 + lớp B ĐẠT 5/5 + tickCost median 50,5 ms ≤ 60** (W1 14:56:50Z → inner-end 15:00:21Z; poller thoát 15:00:58Z sau lượt hợp lệ — ngân sách dùng 1/3; W2/W3 KHÔNG CHẠY). **Chuỗi lượt yên hợp lệ 1 → 2 (ĐỀ XUẤT — parent quyết cuối)** — lượt hợp lệ thứ hai liên tiếp (#68 đợt 200, #69 đợt 201).
- **Kiểm chứng live lần 20: KHÔNG ĐẠT** (T9 xác nhận độc lập — xem §3.2). **Chuỗi live ĐẠT 1 → 0 (ĐỀ XUẤT).**
- **Labellag (b): 0 occ / 0 event ≥5f → chuỗi 0 occ 1 → 2 (ĐỀ XUẤT)** (T4; quyết (m)-192: chỉ lượt hợp lệ mới tính).
- **P3' cộng dồn mới (55 lượt hợp lệ): P1 240/244, P2 235/235, P3-A1 204/244, P3' 202/216 occ = 148/151 distinct-seq, P7 138/138.** Seq MỚI: 0 (274, 304 đều đã thấy). Sổ md5 `ad243797` (cơ sở as-of-200 `2d3ee86c` giữ nguyên).
- **FULL PASS: KHÔNG CÓ** (T8-201: harness 5/6 trên #131 — 84l10 FAIL E4 flake, chạy lại PASS 16:03:54Z; chân yên #69 CÓ, chân O8 3/3 ĐẠT — nhưng chân harness KHÔNG đạt) — **chuỗi GIỮ 0.**

### 2.3 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 #130 14:53:25–14:56:10Z | #130 | 1,52–4,61 (sampler) | 2,95–3,07 MB — **gate A 3/3** | **O8 3/3 PASS 21/21 (WebKit ×2 + Chromium) — chân FULL PASS O8 ĐẠT** |
| T4 W1 14:56:50–15:00:21Z | #130 | 1,48–3,28 (4 mẫu live) | 2,34–3,26 MB — **gate A 4/4 (cả hai luồng)** | **24 spike B2** (khớp T4); attempt1 20/20 HỢP LỆ; live-check #20 KHÔNG ĐẠT |
| T8 harness #131 15:28:28–15:46:45Z | #131 | 0,64–8,96 (19 mẫu) | 0,85–2,88 MB — gate A 15/19 (chính) / 16/19 (live) | **Harness 5/6** (84l10 FAIL E4 flake + 85m4/86n2 PASS; Chromium 3/3 PASS); 0 mẫu ghim trong cửa sổ harness (ghim bắt đầu 16:23Z, SAU harness) |

- T01-201: **#130 XÁC NHẬN 9 nguồn TƯƠI (survey 14:48:24Z, TRƯỚC reboot)**; O8 3/3 PASS; GAP §129 đã viết + §128 đã sửa. **CAVEAT (F-201-T9-2): T01-201 .done/LIMITS viết SAU reboot (15:15:25Z/15:17:47Z) nhưng khẳng định "KHÔNG CÓ REBOOT MỚI" — STALE, SAI tại thời điểm viết** (T56-201 phát hiện độc lập); số hiệu #131 cần survey mới, parent quyết (e)-201.
- T2-201: **(m) #130 KHÔNG CÓ ĐIỂM (CUỐI); B-#129 TRUE (FULL174, neo #128) — chuỗi B 0 → 1 (đề xuất)**; n 58/60 → 58/61; (m) #56 lần 43, VẪN CÓ ĐIỀU KIỆN. **(m) #131 THÔ (handoff T2-202, T2-201 KHÔNG phán): eid 11652 requeued 15:05:14,89Z = btime +49,89s — NGOÀI biên trên 0,09s trên số thô (DAO ĐỘNG, caveat đồng hồ ~2 s có thể lật vào trong).** Gap #130→#131 = 13.364 s.
- T56-201: **POSTBOOT_PASS #131 CÓ 15:12:20Z** (replay ĐẦY ĐỦ thật, poll=0, dpkg 1.510 — đề xuất KHÔNG caveat (b2) như #128); watcher-201 spawn 14:48:33Z pid 369613 (chết cùng reboot; respawn 15:07:17Z pid 7520); (A) 120/120 lần thứ 50; suite 9/9 × 6 (chuỗi 81 → 82); #131 KHÔNG GIẾT holder (chuỗi 6 → 7 nếu parent xác nhận #131); marker 81 → 82 nếu xác nhận.
- T7-201: ĐÃ đóng lúc T9 đóng (xem .done T7 — T9 không phán chuyên môn scheduler).
- T8-201: **harness 5/6 trên #131** (15:28:28–15:46:45Z); **84l10 FAIL — chuỗi PASS 2 → 0**; **86n2-P1 dữ kiện mới — chuỗi 21 → 22**; V2+V4+V5 = 11/11 kẹt, 0 FP trên 49 log sạch; B2 vùng mới sạch lần 15; FULL PASS KHÔNG CÓ.
- P1/P2/P3/P4-201: ĐÃ đóng (xem LIMITS P1–P4 — T9 không phán chuyên môn sản phẩm).

### 2.4 B2 — 179 spike THẬT (41 #130 + 138 #131); W1 24 spike (khớp T4 từng số); `ps` 0 lần

Watcher cadence 2 s, ngưỡng load1 ≥ 3,0. **179 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 179): #130: 41** (14:54:21–15:04:52Z) **+ #131: 138** (15:07:xx–15:43:42Z). **load1 đỉnh đợt (watcher, cadence 2 s): 9,49.**

| Nhóm (top comm, đã lọc `ps`) | n | Ghi chú |
|---|---|---|
| WebKitWebProces | 77 | Harness/O8 WebKit + attempt T4 |
| chrome | 38 | P1 Chrome headless + Chrome khác |
| MainThread | 24 | Process node (tsc/test/vite các luồng P) |
| apt-get | 11 | T56 replay/postboot (dpkg 292 → 1.510) |
| find | 9 | Lẻ tẻ (build/prune) |
| hatch | 6 | Tải nền tảng (runtime) |
| ffmpeg | 5 | Lẻ tẻ (P3/render) |
| dpkg-preconfigu | 3 | T56 replay |
| dpkg | 3 | T56 replay |
| MiniBrowser | 1 | Lẻ tẻ |
| fc-cache | 1 | Lẻ tẻ |
| privsep-test-fu | 1 | Lẻ tẻ |

Tổng 77+38+24+11+9+6+5+3+3+1+1+1 = 179 — KHỚP. **`ps`: 0 lần đứng đầu** (bộ lọc F-198-T9-5 HOẠT ĐỘNG — đợt 200: 0/162; đợt này 0/179). Phân theo giờ: 14:xx 41 spike; 15:xx 138 spike; **16:xx–17:xx 0 spike**. Spike đầu 14:54:21Z; spike cuối 15:43:42Z — **sau 15:43:42Z không còn spike nào tới lúc đóng** (79 phút yên: T4/T2/T56/T8 đã đóng, các luồng P đóng trước đó).

- **W1 (14:56:50–15:00:21Z): 24 spike, load1 3,01–3,66 (max 3,66), 14:57:01–14:59:01Z, tất cả boot c073c8bb** (khớp T4 từng số; T9 đếm lại từ `b2-spikes-FROZEN.log`). Tổng log lúc poller T4 thoát (15:00:58Z): **41 spike — T9 đếm lại 41 spike ≤15:00:58Z, KHỚP** (cả 41 đều trên #130).
- **106 spike trong cửa sổ harness T8** (15:28:28–15:46:45Z — tải do chính harness tạo); **17 spike trong cửa sổ O8 T01** (14:53:25–14:56:10Z).
- **B2 dữ kiện #13** cho quyết tách (cách đếm (j)-200: mỗi đợt = 1 dữ kiện): W1 24 spike. T9 chỉ báo số, KHÔNG tự quyết tách (luật B2 KHÔNG TÁCH vẫn đứng cho tới khi parent quyết).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-200; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 3.480.900 kB (sampler chính, #130) / 3.476.872 kB (live, #130). **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 53 liên tiếp (147–201).**
- **QUYẾT (o) §14.2-200: AUTO-TRIGGER GIỮ LIVE.** Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-201:** live TIẾP TỤC từ đợt 200 (không flip mới) — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 200 §14.2 bản parent (83.680 B — NGUỒN QUYẾT DUY NHẤT); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189..200; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 200 (copy nguyên từ round200-t9). Khởi động 14:48:51Z (pid 369776) với env đúng ngay lần đầu. **LỰA CHỌN (a) F-200-T9-1 — ÁP DỤNG: `--round-dir .../round201-t9/autotrigger-live`** (log live tách riêng — xem §6).
- **LIVE PHASE ĐỢT 201: 134 mẫu, 14:48:51–17:03:39Z (17 mẫu #130 + 117 mẫu #131), TẤT CẢ `trigger=watch consec=0`, max avail 3.476.872 kB, load1 <4,0: 127/134 (94,8%) — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `round201-t9/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Live chạy suốt cửa sổ attempt T4, 0 FIRE trong W1. **Khoảng mù live: 167 s do reboot #131** (mẫu live cuối #130 15:04:51Z → mẫu đầu #131 15:07:38Z; daemon chết cùng reboot, khởi động lại tay — KHÔNG có mù nào khác; khác đợt 200: không có khoảng mù).
- **TỔNG LIVE TỪ 03:14Z 25/11: 1.497 mẫu (1.363 tới hết đợt 200 + 134 đợt 201), 0 FIRE.**
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 1.497 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 53 đợt). **Lưu ý mới:** balloon #131 leo tới CEIL 6,44M NHƯNG avail lúc đó chỉ 361–500 MB — guard đo bằng MemAvailable, không phải balloon; balloon cao không mở guard. Auto-trigger 0 FIRE trong suốt đợt là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 200); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round201-t9/` (live chạy 134 mẫu, 0 sự kiện).

### 3.2 Kiểm chứng live lần 20 (đợt 201) — T9 XÁC NHẬN ĐỘC LẬP: KHÔNG ĐẠT (đồng ý với T4)

- **LIVE-CHECK #20 (đợt 201): KHÔNG ĐẠT — T9-201 xác nhận độc lập từ log live + log B2 của mình, KHỚP T4 TỪNG SỐ.** Có 1 cửa sổ hợp lệ (W1 14:56:50–15:00:21Z — attempt1 20/20, lớp B ĐẠT 5/5). 4 mẫu live trong W1 (14:56:51Z avail 3.262.344 load1 1,48; 14:57:51Z avail 2.336.940 load1 3,19; 14:58:51Z avail 2.984.860 load1 3,28; 14:59:51Z avail 2.942.576 load1 2,32 — luồng live; luồng chính cùng các timestamp: 3.248.244 / 2.331.684 / 2.986.020 / 2.963.848 kB) — tất cả `trigger=watch consec=0`, **0 FIRE**; max avail trong W1 3.262.344 kB < guard. **NHƯNG 24 spike B2 trong W1** (đếm trực tiếp từ `b2-spikes-FROZEN.log`, KHỚP T4: 14:57:01–14:59:01Z, load1 max 3,66) nên KHÔNG đủ điều kiện ĐẠT theo định nghĩa (p)-192 (đòi 0 spike B2). **Chuỗi live ĐẠT 1 → 0 (ĐỀ XUẤT) — T9 ĐỒNG Ý với verdict T4.**
- CAVEAT số: T4 ghi max avail W1 là 3.262.344 kB — đó là giá trị LUỒNG LIVE lúc 14:56:51Z; luồng chính cùng timestamp là 3.248.244 kB (chênh 14.100 kB, ~1 s lệch pha lấy mẫu). Không mâu thuẫn — cả hai đều < guard (cùng lớp với F-200-T9-4).
- Toàn log live 201: 134 mẫu, 0 dòng trigger != watch consec=0.

## 4. ENOSPC trong journal (đếm trực tiếp — 2 boot, journal MẤT SAU MỖI REBOOT)

- **#130 trong đợt 201: ≥168 dòng lúc 14:47:48Z (cả hai grep KHỚP 168=168)** — dòng đầu 11:36:34Z = boot+893s (như đợt 200); **KHÔNG đếm lại trước reboot 15:04:25Z** (thiếu sót ghi nhận — T9 không chạy lệnh đếm trong khoảng 14:47–15:04Z; journal #130 đã mất sau reboot, KHÔNG ngoại suy — phương pháp chuẩn điểm (5)).
- **#131: đếm trực tiếp 95 dòng lúc close 17:00:03Z (vẫn tăng lúc đóng)** — dòng đầu **15:07:26Z (boot+181s)**; dòng cuối lúc đếm **17:00:0xZ**. Cả hai grep đều 95 — KHỚP. Đếm giữa phiên: 1 lúc 15:07:45Z → 35 lúc 15:50:00Z → 88 lúc 16:52:10Z → **95 lúc 17:00:03Z**. Nhịp ~0,9 dòng/phút, cùng nhịp #126/#127/#129/#130. Toàn bộ các dòng đều là `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. **Số cuối 95 là cận dưới** — journal #131 đã mất sau reboot #132 (17:03:20Z), không đếm thêm được; không ngoại suy.
- **#132 (mới, cho T9-202): 1 dòng lúc 17:05:17Z = boot+117s** — VỀ LẠI mẫu ~110s (#120 +115s, #124 +109s, #126 +113s, #127 +111s, #129 +109s); khác #130 (+893s) và #131 (+181s).
- **Tổng phiên (2 boot, đếm trực tiếp): #130 ≥168 (lúc mở) + #131 95 (lúc close). Chuỗi đợt có lỗi thật: 47 → 48** (cả hai boot đợt này đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-201 áp dụng ĐẦY ĐỦ, trừ điểm (4) cho #130):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#131: 95=95; #130: 168=168 — KHỚP); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên (#131: 95 lúc 17:00:03Z; #130: KHÔNG đếm lại được — ghi rõ ở trên); (5) phần journal mất sau reboot thì KHÔNG ngoại suy — đợt này CÓ 2 reboot giữa phiên nên journal #130/#131 đều mất sau đó; (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai reboot trong phiên (T9 bắt trực tiếp: gap đo 165 s + exec bị giết)

- **#130 (c073c8bb-26f3-41e8-a4b5-3d56ce3564f8, btime 11:21:41Z; XÁC NHẬN (e)-200).** Sampler T9 trên #130 đợt 201: 14:48:51–15:04:52Z (17 mẫu chính + 17 mẫu live). #130 chết 15:04:25Z. Gap #129→#130 = 16.965 s (đợt 200).
- **#131 (7d642f2a-da03-44ab-a2a1-f55b8010063f, btime 15:04:25Z, epoch 1795791865; số hiệu ỨNG VIÊN — T01-201 survey trước reboot + T2/T56/T7/T8 đồng thuận, parent quyết (e)-201).** Sampler T9 trên #131: 15:07:37–17:03:43Z (117 mẫu chính + 117 mẫu live). Gap #130→#131 = **13.364 s** (3h42m44s). #131 chết lúc reboot #132 (btime 17:03:20Z); mẫu sampler cuối 17:03:43Z vẫn mang boot_id #131 (xem F-201-T9-3).
- **#132 (9a30eb2a-ffb3-4c42-9406-ebdecafdf2a6, btime 17:03:20Z, epoch 1795799000; số hiệu ỨNG VIÊN — T9-202 survey + parent quyết).** Gap #131→#132 = **7.135 s** (1h58m55s). T9-201 KHÔNG đo trên #132 (phiên đã đóng; chỉ ghi btime + ENOSPC dòng đầu boot+117s cho T9-202).
- **Khoảng không-watcher:** 14:35:51Z (hạn mở đợt 201) → 14:48:51Z (sampler-201 mẫu đầu) = **780 s**; reboot #131 gây thêm khoảng không-sampler 165 s (15:04:52Z → 15:07:37Z). **Khoảng mù giữa hai đợt: ~3h03m không sampler T9** (08:02:15Z 27/11 → 11:39:38Z đợt 200 — đứng từ đợt 200; đợt 201 mở ngay sau đợt 200 đóng nên không thêm mù liên đợt).
- **(m) #131 THÔ: eid 11652 requeued 15:05:14,89Z = btime +49,89s — NGOÀI biên trên 0,09s (T2-201, handoff T2-202).** (m) #130 THÔ: 0 requeue (T2-201: phân loại CUỐI KHÔNG CÓ ĐIỂM).

### 5.2 Các luồng khác — 11/11 cờ đã đóng lúc T9 đóng (P1/P2/P3/P4/T01/T2/T4/T56/T7/T8); T9 là cờ cuối (trừ T10 tổng hợp)

- T01-201 ĐÃ đóng: #130 XÁC NHẬN 9 nguồn TƯƠI (survey TRƯỚC reboot); O8 3/3 PASS (chân FULL PASS O8 ĐẠT); GAP §129 đã viết + §128 đã sửa. **CAVEAT F-201-T9-2: .done/LIMITS STALE về reboot #131.**
- T2-201 ĐÃ đóng: **(m) #130 KHÔNG CÓ ĐIỂM (CUỐI); B-#129 TRUE (chuỗi B 0 → 1 đề xuất)**; n 58/61; (m) #56 lần 43, VẪN CÓ ĐIỀU KIỆN; EPERM probe #120 ok=2 fail=0; 0 sóng thật.
- T4-201 ĐÃ đóng: #69 HỢP LỆ; live-check #20 KHÔNG ĐẠT (T9 xác nhận §3.2); B2 dữ kiện #13 (W1 24 spike).
- T56-201 ĐÃ đóng: POSTBOOT_PASS #131 CÓ (replay đầy đủ, poll=0, đề xuất không caveat b2); (A) 120/120 lần thứ 50; suite 9/9 × 6 (81 → 82); marker 81 → 82 nếu #131 xác nhận.
- T7-201 ĐÃ đóng (~16:57Z): run 209 SUCCEEDED 14:35:13Z → **CA MỚI #31** (họ CA 30 → 31); chuỗi SUCCEEDED 1 → 2 (đề xuất); **cửa slot đợt 201 LÀNH** (HB 6/6, DR 3/3 đúng giờ — chuỗi lành 0 → 1, đề xuất); reboot #131 xác nhận độc lập (btime 1795791865); 0 lặng mới, 0 OUTAGE mới; tổng lặng 27/11 GIỮ 16.546 s; run 210 RUNNING — kết cục thuộc T7-202.
- T8-201 ĐÃ đóng: harness 5/6 trên #131; 84l10 FAIL (chuỗi 2 → 0); 86n2-P1 dữ kiện mới (21 → 22); FULL PASS KHÔNG CÓ.
- P1/P2/P3/P4-201 ĐÃ đóng (xem LIMITS P1–P4 — T9 không phán chuyên môn sản phẩm).

## 6. Sai số / caveat (F-201-T9-*)

- **F-201-T9-1 — CỬA SỔ THOÁNG #131 KHÔNG QUAN SÁT ĐƯỢC: PHÁT HIỆN TRONG CỬA SỔ NHƯNG PROBE KHÔNG CHẠY KỊP (MỚI).** Reboot #131 15:04:25Z giết phiên exec sleep của T9; T9 tỉnh lúc 15:05:53Z = boot+88s, TRONG cửa sổ thoáng (15:05:26–15:05:57Z), nhưng exec đầu tiên chạy kiểm tra trạng thái (ps/log/boot_id) thay vì probe; cửa sổ đóng 4s sau đó. Probe muộn 15:08:48Z (boot+263s) không thay thế được. Bài học: **sau khi tỉnh vì reboot, chạy probe headroom TRƯỚC, kiểm tra trạng thái sau** — T9-202 áp dụng. (Tiền lệ: đợt 199 phát hiện đúng giây đầu cửa sổ nhưng probe trễ 6s; đợt 200 không có mặt trong cửa sổ.)
- **F-201-T9-2 — T01-201 .done/LIMITS STALE VỀ REBOOT #131 (MỚI — T9 GHI NHẬN, KHÔNG PHÁN THAY T01/T10).** `round201-t01.done` mtime 15:17:47Z + `PHASE9_ROUND201_T01_BOOT_LIMITS.md` mtime 15:15:25Z — CẢ HAI SAU reboot 15:04:25Z — nhưng khẳng định "KHÔNG CÓ REBOOT MỚI — vẫn boot #130" và "Không có boot #131"; LIMITS không nhắc tới `7d642f2a`/`15:04:25Z` lần nào (grep 0 kết quả). Nội dung là survey 14:48:24Z + O8 14:53–14:56Z (TRƯỚC reboot) trình bày như hiện trạng. T56-201 phát hiện độc lập cùng điểm này. Hệ quả: công việc O8/GAP của T01 trên #130 vẫn đứng (làm trước reboot); chỉ khẳng định "không reboot mới" + số hiệu boot sau đó là stale — T10-201/parent xử lý, T9 không sửa file của T01.
- **F-201-T9-3 — REBOOT #132 GIẾT EXEC DỪNG DAEMON + MẪU SAMPLER CUỐI NGOÀI BTIME #131 (MỚI).** Reboot #132 btime 17:03:20Z; exec sleep-180 + pkill của T9 bị service restart giết giữa chừng (~17:04–17:05Z); daemon T9 chết cùng reboot (log kết 17:03:39Z live / 17:03:43Z chính — 19/23 s SAU btime #132). Mẫu 17:03:43Z mang boot_id `7d642f2a` (#131) dù btime #132 là 17:03:20Z — vì sampler đọc `/proc/sys/kernel/random/boot_id` TRƯỚC khi reboot hoàn tất ghi đè (hoặc boot_id chưa kịp đổi trong ~20 s đầu boot mới — cùng lớp với "guest clock runs fast" F-198-T9-8: không tin timestamp tuyệt đối quanh reboot). T9 giữ nguyên log (không sửa mẫu), ghi rõ: **mẫu cuối 17:03:39/43Z thuộc phiên #131 về mặt boot_id nhưng nằm sau btime #132 19/23 s** — phân tích theo boot_id như mọi đợt (analyzer đếm theo boot= trong log). Hệ quả thực tế: 0 — close probe 17:00:03Z đã xong trước reboot; ENOSPC #131 chốt ở 95 (17:00:03Z).
- **F-201-T9-4 — LỰA CHỌN (a) F-200-T9-1: QUYẾT VÀ ÁP DỤNG (a) --round-dir autotrigger-live (ĐÃ QUYẾT — ĐÓNG).** Live sampler chạy với `--round-dir .../round201-t9/autotrigger-live` (như đợt 199): log live tách riêng 134 dòng, KHÔNG ghi chung với sampler chính — phân tích chạy trực tiếp, không cần bước tách, 0 dòng lẫn lộn (grep `trigger=` trên log chính = 0; grep `swapfree` trên log live = 0). Lý do: (1) tránh nhập nhằng 272 dòng gộp đợt 200; (2) đã chứng minh ở đợt 199 (tách sạch, khớp chính từng mẫu); (3) chi phí bằng 0 (chỉ đổi tham số lúc khởi động). Lựa chọn (b) (log gộp + tách lúc phân tích) BỊ LOẠI — không dùng nữa trừ khi (a) gặp lỗi kỹ thuật. F-200-T9-1 ĐÓNG.
- **F-201-T9-5 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; probe open 14:50:12Z trước mọi attempt (T4 mở W1 14:56:50Z); probe postboot-late 15:08:48Z sau khi T4 đã đóng (poller thoát 15:00:58Z); probe mid 15:50:00Z không chồng lấn cửa sổ yên nào (W1 đã kết thúc 15:00:21Z; T2/T56/T7/T8 lúc đó không chạy attempt yên); probe close 17:00:03Z sau khi mọi luồng đo đã đóng); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG ~17:12Z — TRONG hạn cứng 17:35:51Z** (probe close chạy đúng 17:00:03Z nhờ driver; daemon dừng do reboot #132 ~17:04Z — tương đương dừng tay theo quy tắc đứng). Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: đợt 200: 0 vi phạm (chuỗi 0 → 1, quyết (p)-200); đợt 201 có vi phạm mới hay không thuộc T10/parent (cần verdict của TẤT CẢ luồng — T4 ghi nhận chồng lấn trong W1: T2 ghi 3 file + eperm-probe ghi log/heartbeat trong W1, giao T2/parent phán (p)-201; waiter T8 + sampler live T9 trong W1 là daemon đo lường/tuân thủ — theo (p)-200 KHÔNG VI PHẠM).
- **F-201-T9-6 — KHÔNG ĐẾM LẠI ENOSPC #130 TRƯỚC REBOOT (THIẾU SÓT GHI NHẬN).** T9 đếm ENOSPC #130 lúc mở phiên (168, 14:47:48Z) rồi không đếm lại trong khoảng 14:47–15:04Z; reboot #131 xóa journal #130. Số #130 đợt 201 chỉ còn cận dưới 168. Bài học: đếm ENOSPC mỗi lần kiểm tra trạng thái giữa phiên (không chỉ lúc mở/đóng) — T9-202 áp dụng.

- **Caveat đứng:** probe cap 30.000 (giá trị mở là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 1.497 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); cửa sổ thoáng #131 KHÔNG quan sát được đợt này (F-201-T9-1); số hiệu #131/#132 là ỨNG VIÊN (parent quyết (e)-201); E-247 GIỮ MỞ (T9 chỉ báo dữ kiện + đếm boot không-pin: chuỗi GIỮ 0).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (134 dòng chính: 17 #130 + 117 #131, 14:48:51–17:03:43Z): `hidden_files/round201-t9/ram-sampler-FROZEN.log` — md5 `8cfa4a339f3a17aff029ef91d3fd3913`. Log live đóng băng (134 dòng, tách riêng): `hidden_files/round201-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `68619846cacb7e8a9a63c6655ca19b4e`. Log B2 đóng băng (179 spike): `hidden_files/round201-t9/b2-spikes-FROZEN.log` — md5 `6864a618dcaf12cd63ce6cb8dbeceb01`. Log headroom đóng băng (4 lần đo): `hidden_files/round201-t9/headroom-log-FROZEN.txt` — md5 `c33a382c3d73695db6eeb71c6bc07eca`. Phân tích: `t9-201-analyze.py` (output `t9-201-analyze-output.txt`) + `t9-201-live-analyze.py` (output `t9-201-live-analyze-output.txt`) + `t9-201-b2-analyze.py` (output `t9-201-b2-analyze-output.txt`). Baseline: `t9-201-baseline-notes.md` (gồm lựa chọn (a) F-200-T9-1 + reboot #131 + đóng phiên). Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). Driver: `t9-201-driver.sh` (mid 15:50Z, close 17:00Z, reboot watch — tự kết thúc 17:00:03Z sau probe close; KHÔNG sống qua reboot #132 vì reboot giết mọi process). B2 watcher bản 201 (`b2watch.sh` — lọc `ps` + ghi `boot=` mỗi spike). T10 đọc log đóng băng trực tiếp khi cần.
