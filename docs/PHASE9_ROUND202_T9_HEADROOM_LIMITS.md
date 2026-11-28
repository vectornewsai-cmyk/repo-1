# LIMITS — Phase 9 đợt 202, T9: CỬA SỔ THOÁNG #134 QUAN SÁT ĐƯỢC — headroom 28.421 (boot+80s) + E-247 VẪN MỞ (#134 GHIM 45 CEIL — chuỗi không-pin GIỮ 0) + ENOSPC #134 27 dòng + auto-trigger live 142 mẫu 0 FIRE (tổng 1.639) + live-check #21 ĐẠT (xác nhận độc lập)

## 0. Tóm tắt

- **HEADROOM: 4 lần đo, 2 boot — 0 / 28.421 / 2 / 2.** open 0 (#133, boot+543s) + **postboot 28.421 (#134, boot+80s — TRONG cửa sổ thoáng 21:06:16–21:06:47Z, QUAN SÁT ĐƯỢC lần đầu kể từ đợt 147)** + mid 2 (#134) + close 2 (#134). Trần inotify **63.737 KHÔNG ĐỔI**. Headroom cuối phiên 2 — VẪN DƯỚI ngưỡng báo user ~1.800 lúc đóng, nhưng cửa sổ thoáng đã được quan sát với headroom lớn (F-202-T9-1).
- **BALLOON — E-247 VẪN MỞ: #134 GHIM 45 CEIL / 116 mẫu chính (46/117 live) — MỘT ĐỢT GHIM DUY NHẤT 22:18:04–23:02:05Z, VẪN GHIM lúc đóng.** Ghim khi máy yên (load1 CEIL 0,00–0,14; 45/45 mẫu ≤0,20) — ghim host-side, như #129/#130/#131. **#134 LÀ BOOT CÓ PIN — chuỗi không-pin GIỮ 0. GIỮ MỞ.** #133: 0 CEIL / 25 mẫu quan sát được (chỉ 25 mẫu, boot sống 33 phút trong phiên).
- **Sàn 6.050.608 kB: 0 lần đợt này — tổng GIỮ 4. Sag 6.247.216 kB: 0 lần — tổng GIỮ 8.** Balloon = 0: 0 lần.
- **ENOSPC: #133 = 4 dòng lúc mở 20:41Z (KHÔNG đếm lại trước reboot — F-202-T9-2); #134 = 27 dòng lúc close 23:00:05Z (1 lúc 21:07:19Z → 15 lúc mid 21:50:03Z → 27 lúc close, vẫn tăng lúc đóng). Chuỗi đợt có lỗi thật 48 → 49.** Dòng đầu #134 21:07:02Z = boot+107s — VỀ LẠI mẫu ~110s; dòng đầu #133 20:37:39Z = boot+332s.
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 3.448.292 kB (chính) / 3.446.652 kB (live). **0 lần chạy birefnet — lần thứ 54 liên tiếp (đếm đúng: 147–201 trừ 190 + 195, + 202 — xem §3.1, F-201-T10-4 ĐÓNG).**
- **Auto-trigger: LIVE 142 mẫu đợt này, tất cả `trigger=watch consec=0`, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **1.639 mẫu (1.497 tới hết đợt 201 + 142 đợt 202), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA.
- **HAI REBOOT TRONG PHIÊN.** #133 btime 20:32:07Z (trước khi lượt mở — cửa sổ thoáng #133 đã đóng trước lượt mở 20:35:51Z, KHÔNG quan sát được) và #134 btime 21:05:15Z giữa phiên (giết toàn bộ daemon T9 + exec sleep chờ của T9; gap đo 76 s chính / 78 s live; T9 tỉnh đúng giây đầu cửa sổ thoáng #134 và probe kịp boot+80s).
- **RAM: 141 mẫu chính + 142 mẫu live, 20:41:44–23:03:02Z, HAI boot.** Max **3.448.292 kB**; min **401.956 kB** (chính 22:51:04Z, #134, CEIL, load1 0,02 — nông hơn kỷ lục 361.072 kB đợt 201); mean chính 1.033.592,1 kB; gate A **60/141** (chính) / 61/142 (live). Load1 <4,0: 132/141 mẫu (93,6%) chính / 133/142 (93,7%) live.
- **Lượt yên #70 (T4): HỢP LỆ (attempt1-bd22dffd 20/20 trên #134, lớp B ĐẠT 5/5, tickCost median 52,0 ms) — chuỗi lượt yên hợp lệ 2 → 3 (ĐỀ XUẤT). Kiểm chứng live lần 21: ĐẠT — T9 xác nhận độc lập (0 spike B2 trong W1, khớp T4 từng số; 3 mẫu live trong W1 đều watch/consec=0, 0 FIRE, max avail 1.124.316 kB < guard) — chuỗi live ĐẠT 0 → 1 (ĐỀ XUẤT, lần đầu ĐẠT kể từ #19 đợt 200).**
- **B2: 147 spike THẬT (126 trên #133 + 21 trên #134)** — W1 0 spike (dữ kiện #14 theo cách đếm (j)-200); `ps` 0 lần đứng đầu; spike cuối 22:02:56Z — **sau 22:02:56Z không còn spike nào tới lúc đóng** (60 phút yên).
- **0 VI PHẠM phía T9.** Không probe nào của T9 chạm W1 (21:33:13–21:36:42Z); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 đóng ~23:10Z — TRONG hạn cứng 23:35:51Z** (trễ cờ ~23:00Z do phân tích sau probe close; tiền lệ T9-201 về muộn vẫn trong hạn cứng — ghi nhận, không phạt). Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–201 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Probe-once.py bản 202 copy nguyên từ 201.

### 1.1 Số đo đợt 202 (4 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 20:41:10Z | **0** | #133 05bda90d | 63.737 | probe open-202 (boot+543s; F-201-T9-1: chạy TRƯỚC mọi kiểm tra trạng thái) |
| 21:06:35Z | **28.421** | #134 bd22dffd | 63.737 | probe postboot-202 (boot+80s — TRONG cửa sổ thoáng) |
| 21:50:03Z | **2** | #134 | 63.737 | probe mid-202 (boot+44m48s; driver) |
| 23:00:05Z | **2** | #134 | 63.737 | probe close-202 (boot+1h54m50s; driver) |

- **CỬA SỔ THOÁNG #134: QUAN SÁT ĐƯỢC — headroom 28.421.** Boot btime 21:05:15Z; cửa sổ boot+61–92s (21:06:16–21:06:47Z). Reboot giết phiên exec sleep chờ giữa phiên của T9 (SIGTERM); T9 tỉnh lúc 21:06:16Z = boot+61s (ĐÚNG GIÂY ĐẦU cửa sổ); probe postboot-202 chạy 21:06:35Z = boot+80s, TRONG cửa sổ: **headroom=28.421 cap=30000 ceiling=63737**. Đây là lần đầu tiên cửa sổ thoáng được quan sát với headroom lớn kể từ đợt 146/147 (các đợt 183–201: 0 hoặc không quan sát được — đợt 199 phát hiện đúng giây đầu nhưng probe trễ 6s; đợt 200 không có mặt trong cửa sổ; đợt 201 có mặt trong cửa sổ nhưng probe không chạy kịp — F-201-T9-1). Caveat: exec tỉnh dậy đầu tiên vẫn chạy kiểm tra trạng thái (date/uptime/boot_id/ps) trước probe — nhưng probe vẫn kịp trong cửa sổ vì T9 tỉnh đúng giây đầu cửa sổ (xem F-202-T9-1).
- **CỬA SỔ THOÁNG #133: KHÔNG QUAN SÁT ĐƯỢC.** Boot btime 20:32:07Z; cửa sổ boot+61–92s (20:33:08–20:33:39Z) ĐÃ ĐÓNG trước khi lượt cron mở (20:35:51Z = boot+224s). Khác đợt 201 (T9 có mặt trong cửa sổ nhưng probe trễ) — đợt này lượt mở SAU khi cửa sổ đóng, không có cơ hội quan sát.
- **Headroom cuối phiên: 2** (close 23:00:05Z, #134 boot+1h54m50s). Trần **KHÔNG ĐỔI trong đợt (63.737 cả 4 lần đo)**.
- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (2)** — nhưng đợt này CÓ dữ kiện cửa sổ thoáng mới (28.421): headroom cao chỉ tồn tại trong ~90 s đầu boot, sau đó rơi về ~0–2 trong vòng 45 phút (mid 21:50:03Z đã là 2).

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 141 mẫu chính + 142 mẫu live, 20:41:44–23:03:02Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 76 s (chính) / 78 s (live)** — reboot #134 21:05:15Z + khởi động lại tay 21:07:02Z; các gap còn lại ≤61 s (jitter bình thường). **Log live TÁCH RIÊNG** (lựa chọn (a) F-200-T9-1): `autotrigger-live/ram-sampler.log` 142 dòng, không ghi chung với log chính. Live có 1 mẫu thừa 23:03:02Z (sampler chính dừng 23:02:05Z trước khi T9 kill live — xem F-202-T9-3).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 20:41:44–21:05:46Z | #133 | 445.452–1.986.608 kB | 25 mẫu chính + 25 live; **0 CEIL**; gate A 21/25 |
| 21:07:02–23:03:02Z | #134 | 401.956–3.448.292 kB | 116 mẫu chính + 117 live; **45 CEIL (chính) / 46 (live)**; gate A 39/116 (chính) / 40/117 (live) |

- **Gate A ≥1024 MiB: 60/141 mẫu chính (61/142 live)**; **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **8,38** (trên #133, trong cửa sổ O8 T01, 20:47–20:48Z); load1 <4,0: **132/141 mẫu (93,6%)** chính / 133/142 (93,7%) live; **RAM <512.000 kB: 47 mẫu chính** (47 live) — 1 mẫu lẻ trên #133 (20:52:45Z) + 46 mẫu trên #134 (22:18:04–23:02:05Z, trùng đợt ghim); **RAM <300.000 kB: 0 mẫu** (như đợt 201).
- Swap: #133 SwapFree 793.344 → 666.520 kB (−126.824 kB trong ~24 phút); #134 SwapFree 980.652 → 653.328 kB — giảm **327.324 kB trong ~116 phút** (xả swap trên boot mới — cùng nhịp #131 đợt 201: −324.064 kB/116 phút).
- Trũng RAM đợt này: min **401.956 kB (chính 22:51:04Z, #134, balloon CEIL 6.443.824, load1 0,02)**; live min 405.240 kB (22:49:02Z, #134, CEIL, load1 0,00) — nông hơn kỷ lục 361.072 kB đợt 201 và 253.436 kB đợt 197.

**Bảng tổng hợp số RAM (từ script `t9-202-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 141 dòng — KHÔNG tính tay; live từ `t9-202-live-analyze.py` trên `autotrigger-live/ram-sampler-FROZEN.log`, 142 dòng):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #133 chính | 25 | 445.452 | 1.986.608 | 1.364.751,2 | 21/25 | 0 | 8,38 | 1 |
| #133 live | 25 | 444.548 | 1.988.640 | 1.365.511,4 | 21/25 | 0 | 8,38 | 1 |
| #134 chính | 116 | 401.956 | 3.448.292 | 962.221,7 | 39/116 | 45 | 3,18 | 46 |
| #134 live | 117 | 405.240 | 3.446.652 | 957.598,6 | 40/117 | 46 | 3,18 | 46 |
| **Toàn phiên** | **141+142** | **401.956** | **3.448.292** | **1.033.592,1 / 1.029.414,2** | — | **45 / 46** | **8,38** | **47 / 47** |

- **Mean chính 1.033.592,1 kB / live 1.029.414,2 kB — weighted mean check KHỚP cả hai script.**

### 2.1 Balloon virtio — #134 GHIM 45 MẪU (CÓ PIN) — E-247 VẪN MỞ, chuỗi không-pin GIỮ 0

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB** (xác nhận lại: 45 mẫu chính + 46 mẫu live đúng bằng trần).
- **Boot #134: GHIM 45/116 mẫu (sampler chính) + 46/117 mẫu (live) — HAI SAMPLER KHỚP 1 ĐỢT GHIM DUY NHẤT.** Balloon #134 dao động 2.986.228–6.443.824 kB; ≥6,0M: 58 mẫu (chính) / 59 (live). Đợt ghim (chính): **22:18:04–23:02:05Z n=45, VẪN GHIM lúc đóng** (live: 22:18:02–23:03:02Z n=46 — chênh 1 mẫu do live có thêm mẫu 23:03:02Z sau khi sampler chính dừng). Avail trong đợt ghim chỉ 401–~500 MB. **Đợt ghim xảy ra khi máy YÊN (load1 CEIL 0,00–0,14; 45/45 mẫu chính ≤0,20)** — ghim KHÔNG do tải guest (cùng mẫu #129/#130/#131). Ghim bắt đầu 22:18:04Z — SAU khi mọi luồng đã đóng (.done: T8 22:15:36Z cuối cùng; T2 22:02:56Z; T56 22:04:14Z; P1–P4 20:59–21:32Z) — lúc ghim chỉ còn T10 tổng hợp + T9 đo lường.
- **E-247 — GIỮ MỞ, CHUỖI KHÔNG-PIN GIỮ 0.** Chuỗi boot: #127 0 CEIL / 86 (đợt 198) → #128 0 CEIL / 54 (đợt 199) → **#129 10 CEIL / 82 (đợt 199, GHIM — chuỗi 2 → 0)** → **#130 30 CEIL / 136 (đợt 200, GHIM — chuỗi GIỮ 0)** → **#131 27 CEIL / 117 (đợt 201, GHIM — chuỗi GIỮ 0)** → **#134 45 CEIL / 116 (đợt này, GHIM — chuỗi GIỮ 0)**. Điều kiện đóng (3 boot liên tiếp không pin) CHƯA ĐỦ (0/3) — **T9-203 theo dõi tiếp từ #135.** #133 trong đợt này: 0 CEIL / 25 mẫu — nhưng chỉ 25 mẫu quan sát được (boot sống 33 phút trong phiên; khoảng 20:32:07–20:41:44Z không có dữ kiện T9) nên KHÔNG tính #133 là boot sạch cho chuỗi; chuỗi không-pin chỉ tính boot chưa từng ghim với dữ kiện đầy đủ phiên. #132 (17:03:20–20:32:07Z): T9 không đo (phiên 201 đã đóng; chỉ có ENOSPC dòng đầu boot+117s) — không dữ kiện CEIL.
- **Xác minh độc lập 2 sampler:** live bắt **cùng 1 đợt ghim** trên #134 (n=46 vs chính n=45 — chênh 1 mẫu do live có thêm mẫu 23:03:02Z, KHÔNG phải mâu thuẫn); live cũng bắt đúng **min avail 405.240 kB lúc 22:49:02Z** (chính: 401.956 kB lúc 22:51:04Z — cùng đợt ghim, chênh 3.284 kB do lệch pha lấy mẫu 2–3 s). Balloon tại cùng timestamp KHỚP TỪNG SỐ.
- **Balloon = 0: 0 lần đợt này** (như đợt 192–201).
- **Sàn balloon 6.050.608 kB: 0 lần đợt này — tổng GIỮ 4.**
- **Giá trị sag 6.247.216 kB: 0 lần đợt này — tổng GIỮ 8.**

### 2.2 Lượt yên WebKit #70 (T4) — HỢP LỆ (1/1) — chuỗi 2 → 3 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#70 HỢP LỆ — attempt1-bd22dffd 20/20 + lớp B ĐẠT 5/5 + tickCost median 52,0 ms ≤ 60** (W1 21:33:13Z → inner-end 21:36:42Z; poller thoát 21:37:13Z sau lượt hợp lệ — ngân sách dùng 1/3; W2/W3 KHÔNG CHẠY). **Chuỗi lượt yên hợp lệ 2 → 3 (ĐỀ XUẤT — parent quyết cuối)** — lượt hợp lệ thứ ba liên tiếp (#68 đợt 200, #69 đợt 201, #70 đợt 202).
- **Kiểm chứng live lần 21: ĐẠT** (T9 xác nhận độc lập — xem §3.2). **Chuỗi live ĐẠT 0 → 1 (ĐỀ XUẤT)** — lần đầu ĐẠT kể từ #19 (đợt 200).
- **Labellag (b): 0 occ / 0 event ≥5f → chuỗi 0 occ 2 → 3 (ĐỀ XUẤT)** (T4; quyết (m)-192: chỉ lượt hợp lệ mới tính).
- **P3' cộng dồn mới (56 lượt hợp lệ): P1 243/247, P2 238/238, P3-A1 207/247, P3' 205/219 occ = 148/151 distinct-seq, P7 141/141.** Seq MỚI: 0 (174, 212, 433 đều đã thấy). Sổ md5 `50f10815` (cơ sở as-of-201 `ad243797` giữ nguyên).
- **FULL PASS: KHÔNG CÓ** (T8-202: harness 6/6 trên #134 + chân yên #70 CÓ — nhưng chân O8 1/3 KHÔNG đạt: WebKit FAIL ×2 trên #133) — **chuỗi GIỮ 0.**

### 2.3 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 #133 20:46:27–20:48:49Z | #133 | 1,42–8,38 (sampler) | 1,04–1,46 MB — **gate A 2/3** | **O8 1/3 (WebKit FAIL ×2 + Chromium 21/21 PASS) — chân FULL PASS O8 KHÔNG ĐẠT**; 14 spike B2 trong cửa sổ |
| T4 W1 21:33:13–21:36:42Z | #134 | 0,72–2,49 (3 mẫu live) | 0,84–1,12 MB — **gate A 1/3 (cả hai luồng)** | **0 spike B2** (khớp T4); attempt1 20/20 HỢP LỆ; live-check #21 ĐẠT |
| T8 harness #134 21:50:18–22:06:04Z | #134 | 0,39–3,18 (16 mẫu) | 1,49–3,45 MB — gate A 16/16 (cả hai luồng) | **Harness 6/6** (84l10/85m4/86n2 PASS; Chromium 3/3 PASS); 0 mẫu ghim trong cửa sổ harness (ghim bắt đầu 22:18Z, SAU harness) |

- T01-202: **#133 XÁC NHẬN 9 nguồn TƯƠI (survey 20:42:50Z)**; **#134 survey 9 nguồn TƯƠI 21:10:07Z** (bổ sung sau .done lần đầu — F-202-T01-9: reboot trong lúc đóng cờ, T01 đã cập nhật thay vì để stale như F-201-T9-2); O8 1/3 trên #133; GAP §130 đã viết. **(m) #133 THÔ = 0 event; (m) #134 THÔ = 1 requeue DƯƠNG trong cửa (+47,360 s / +47,513 s — hai số thô khác nhau 0,153 s, xem T2-202 §(m)) — phân loại CUỐI thuộc T2-203.**
- T2-202: **(m) #132/#133/#134 THÔ (cho T2-203 phân loại CUỐI)**; B-#130 FALSE (FULL175 cả hai biến thể); n 58/61 GIỮ; (m) #56 lần 44, VẪN CÓ ĐIỀU KIỆN. **(m) #132 THÔ: eid 11679 requeued 17:04:09,208Z = btime+49,208 s — NGOÀI biên trên 0,592 s (T2-202: phân loại CUỐI; lưu ý biên — cửa sổ [btime+33; btime+49,8] là quy ước).** Gap #131→#132 GIỮ 7.135 s; #132→#133 = 12.527 s; #133→#134 = 1.988 s.
- T56-202: **POSTBOOT_PASS #133 CÓ 20:50:33Z + #134 CÓ 21:28:09Z** (cả hai repair-som-quyet-h, poll=1, verify độc lập byte-identical — đề xuất KHÔNG caveat như #128/#131); watcher-202 respawn 21:07:12Z pid 2113 (chết cùng reboot #134 lần đầu; khoảng không-watcher 17:03:47Z → 20:42:59Z = 13.152 s — DÀI NHẤT từ trước tới nay); (A) 120/120 lần thứ 51; suite 9/9 × 6 (chuỗi 82 → 83); #132/#133/#134 KHÔNG GIẾT holder (chuỗi 7 → 10 nếu parent xác nhận cả ba); marker 82 → 85 nếu #132+#133+#134 đều xác nhận.
- T7-202: **run 210 TIMEOUT → CA MỚI #32** (cf 169 s); **lặng mới S11 8.406 s (18:15:34Z → 20:35:40Z — reboot #133 20:32:07Z nằm BÊN TRONG lặng; đề xuất OUTAGE #9, parent quyết)**; run 211 SUCCEEDED (cf 6 s, KHÔNG phải CA); run 212 RUNNING — kết cục thuộc T7-203; **cửa slot đợt 202 KHÔNG LÀNH** (HB 3/7 đúng giờ, 3 thiếu, 1 muộn +890 s; DR 2/4 đúng giờ, 2 thiếu — chuỗi lành 1 → 0, đề xuất); tổng lặng 27/11 = 24.952 s.
- T8-202: **harness 6/6 trên #134** (21:50:18–22:06:04Z); **84l10 PASS TRỞ LẠI — chuỗi PASS 0 → 1** (flake E4 đợt 201 KHÔNG tái hiện); **86n2-P1 dữ kiện mới — chuỗi 22 → 23**; V5 live 0 trigger; B2 vùng mới sạch lần 16; FULL PASS KHÔNG CÓ.
- P1/P2/P3/P4-202: ĐÃ đóng (xem LIMITS P1–P4 — T9 không phán chuyên môn sản phẩm). P3-202: **C3-loop ĐÃ TRIỂN KHAI + ĐO LẠI THẬT — IM LẶNG DÀI HẾT** (hướng sửa (a6)-201).

### 2.4 B2 — 147 spike THẬT (126 #133 + 21 #134); W1 0 spike (khớp T4 từng số); `ps` 0 lần

Watcher cadence 2 s, ngưỡng load1 ≥ 3,0. **147 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 147): #133: 126** (20:47:39–21:03:45Z) **+ #134: 21** (21:07:xx–22:02:56Z). **load1 đỉnh đợt (watcher, cadence 2 s): 8,85.**

| Nhóm (top comm, đã lọc `ps`) | n | Ghi chú |
|---|---|---|
| MainThread | 68 | Process node (tsc/test/vite các luồng P) |
| hatch | 32 | Tải nền tảng (runtime) |
| chrome | 21 | P1 Chrome headless + Chrome khác |
| ffmpeg | 17 | P3/render |
| store | 2 | Lẻ tẻ |
| dpkg | 2 | T56 replay/postboot |
| find | 1 | Lẻ tẻ (build/prune) |
| python3 | 1 | Lẻ tẻ |
| ldconfig.real | 1 | Lẻ tẻ |
| npm | 1 | Lẻ tẻ |
| WebKitWebProces | 1 | Lẻ tẻ |

Tổng 68+32+21+17+2+2+1+1+1+1+1 = 147 — KHỚP. **`ps`: 0 lần đứng đầu** (bộ lọc F-198-T9-5 HOẠT ĐỘNG — đợt 201: 0/179; đợt này 0/147). Phân theo giờ: 20:xx 104 spike; 21:xx 34 spike; **22:xx 9 spike**. Spike đầu 20:47:39Z; spike cuối 22:02:56Z — **sau 22:02:56Z không còn spike nào tới lúc đóng** (60 phút yên: T4/T2/T56/T7/T8 đã đóng, các luồng P đóng trước đó).

- **W1 (21:33:13–21:36:42Z): 0 spike** (đếm trực tiếp từ `b2-spikes-FROZEN.log`, KHỚP T4: sampler T4 load1 max 2,98 < 3,0).
- **10 spike trong cửa sổ harness T8** (21:50:18–22:06:04Z — tải do chính harness tạo); **14 spike trong cửa sổ O8 T01** (20:46:27–20:48:49Z — tải O8 + P-luồng).
- **B2 dữ kiện #14** cho quyết tách (cách đếm (j)-200: mỗi đợt = 1 dữ kiện): W1 0 spike. T9 chỉ báo số, KHÔNG tự quyết tách (luật B2 KHÔNG TÁCH vẫn đứng cho tới khi parent quyết).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-201; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 3.448.292 kB (sampler chính, #134) / 3.446.652 kB (live, #134). **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 54 liên tiếp (147–201 trừ 190 + 195, + 202 — xem §3.1).**
- **QUYẾT (o) §14.2-201: AUTO-TRIGGER GIỮ LIVE.** Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-202:** live TIẾP TỤC từ đợt 201 (không flip mới) — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 201 §14.2 bản parent (92.112 B — NGUỒN QUYẾT DUY NHẤT); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189..201; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 201 (copy nguyên từ round201-t9). Khởi động 20:41:44Z (pid 3993) với env đúng ngay lần đầu; **khởi động LẠI 21:07:02Z (pid 2048) sau reboot #134** — cùng tham số. **LỰA CHỌN (a) F-200-T9-1 — ÁP DỤNG: `--round-dir .../round202-t9/autotrigger-live`** (log live tách riêng — xem §6).
- **LIVE PHASE ĐỢT 202: 142 mẫu, 20:41:44–23:03:02Z (25 mẫu #133 + 117 mẫu #134), TẤT CẢ `trigger=watch consec=0`, max avail 3.446.652 kB, load1 <4,0: 133/142 (93,7%) — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `round202-t9/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Live chạy suốt cửa sổ attempt T4, 0 FIRE trong W1. **Khoảng mù live: 78 s do reboot #134** (mẫu live cuối #133 21:05:44Z → mẫu đầu #134 21:07:02Z; daemon chết cùng reboot, khởi động lại tay — KHÔNG có mù nào khác; khác đợt 201: mù 167 s).
- **TỔNG LIVE TỪ 03:14Z 25/11: 1.639 mẫu (1.497 tới hết đợt 201 + 142 đợt 202), 0 FIRE.**
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 1.639 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 54 đợt đếm). **Lưu ý mới:** balloon #134 leo tới CEIL 6,44M NHƯNG avail lúc đó chỉ 401–500 MB — guard đo bằng MemAvailable, không phải balloon; balloon cao không mở guard. Auto-trigger 0 FIRE trong suốt đợt là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 201); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round202-t9/` (live chạy 142 mẫu, 0 sự kiện).

### 3.1 Tra lại đợt đầu tiên của chuỗi birefnet 0 lần (F-201-T10-4 — ĐÓNG)

- **Nhãn "(147–201)" trong LIMITS T9-201 SAI — bao hàm 55 đợt trong khi số đếm đứng là 53.** Tra lại toàn bộ LIMITS T9 đợt 146–201 (đọc trực tiếp từng file):
  - Đợt 146: 0 lần thử (cửa sổ guard mở nhưng T9 phát hiện muộn ~9–10 phút) — KHÔNG thuộc chuỗi đếm (chuỗi bắt đầu từ 147 khi cơ chế tự động (a) nối).
  - Đợt 147 = lần 1 (suy ra từ 148 = "lần thứ hai liên tiếp"); 148=2, 149=3, 150=4, 160=14, 165=19, 175=29, 180=34, 185=39, 187=41, 188=42, 189=43, 191=44, 192=45, 193=46, 194=47, 196=48, 197=49, 198=50, 199=51, 200=52, 201=53 — KHỚP chuỗi số học 147→201 trừ 2 đợt KHÔNG ĐẾM.
  - **Đợt 190 KHÔNG ĐẾM: đợt 190 KHÔNG TỒN TẠI** (không có `hidden_files/round190-t9`, không có LIMITS T9-190 — 189=43 → 191=44).
  - **Đợt 195 KHÔNG ĐẾM: T9-195 CÓ CHẠY nhưng KHÔNG VIẾT LIMITS** — `hidden_files/round195-t9` có 92 mẫu chính + 92 live, tất cả `watch consec=0`, 0 FIRE, không có `birefnet-trigger.log`; aggregate 195 ghi rõ "T9-195 THIẾU — nợ lớn nhất đợt này: ... birefnet ..." và giao T9-196; T9-196 đếm 48 (không phải 49) — xác nhận 195 không được đếm. Sự thật 0 lần chạy ở đợt 195 là ĐÚNG theo log, chỉ số đếm chuỗi không ghi nhận đợt này.
- **Nhãn ĐÚNG: "53 đợt có đếm (147–201, trừ 190 + 195)". Đợt 202 = lần thứ 54.** F-201-T10-4 ĐÓNG.

### 3.2 Kiểm chứng live lần 21 (đợt 202) — T9 XÁC NHẬN ĐỘC LẬP: ĐẠT (đồng ý với T4)

- **LIVE-CHECK #21 (đợt 202): ĐẠT — T9-202 xác nhận độc lập từ log live + log B2 của mình, KHỚP T4 TỪNG SỐ.** Có 1 cửa sổ hợp lệ (W1 21:33:13–21:36:42Z — attempt1 20/20, lớp B ĐẠT 5/5). 3 mẫu live trong W1 (21:34:02Z avail 838.156 load1 2,49; 21:35:02Z avail 979.752 load1 1,82; 21:36:02Z avail 1.124.316 load1 0,72 — luồng live; luồng chính cùng các timestamp: 842.924 / 940.448 / 1.170.432 kB) — tất cả `trigger=watch consec=0`, **0 FIRE**; max avail trong W1 1.124.316 kB < guard. **VÀ 0 spike B2 trong W1** (đếm trực tiếp từ `b2-spikes-FROZEN.log`, KHỚP T4: sampler T4 load1 max 2,98 < 3,0) nên ĐỦ điều kiện ĐẠT theo định nghĩa (p)-192 (đòi 0 spike B2). **Chuỗi live ĐẠT 0 → 1 (ĐỀ XUẤT) — T9 ĐỒNG Ý với verdict T4 (lần đầu ĐẠT kể từ #19 đợt 200).**
- Caveat số: T4 ghi "3 mẫu autotrigger" — đó là 3 mẫu TRONG cửa sổ W1 (21:34:02/21:35:02/21:36:02Z); mẫu live 21:33:02Z nằm TRƯỚC marker W1 (21:33:13Z) nên không tính (cùng lớp với F-200-T9-4). Max avail W1 T4 ghi 1.124.316 kB = giá trị LUỒNG LIVE lúc 21:36:02Z; luồng chính cùng timestamp là 1.170.432 kB (chênh 46.116 kB, ~1 s lệch pha lấy mẫu). Không mâu thuẫn — cả hai đều < guard.
- Toàn log live 202: 142 mẫu, 0 dòng trigger != watch consec=0.

## 4. ENOSPC trong journal (đếm trực tiếp — 2 boot, journal MẤT SAU MỖI REBOOT)

- **#133: đếm trực tiếp 4 dòng lúc mở 20:41Z (cả hai grep KHỚP 4=4)** — dòng đầu **20:37:39Z (boot+332s)**; dòng cuối lúc đếm **20:41:09Z**. **KHÔNG đếm lại trước reboot 21:05:15Z** (thiếu sót ghi nhận — T9 ngủ chờ giữa phiên 20:45–21:05Z; journal #133 đã mất sau reboot, KHÔNG ngoại suy — phương pháp chuẩn điểm (5), xem F-202-T9-2).
- **#134: đếm trực tiếp 27 dòng lúc close 23:00:05Z (vẫn tăng lúc đóng)** — dòng đầu **21:07:02Z (boot+107s)**; dòng cuối lúc đếm **23:00:0xZ**. Cả hai grep đều 27 — KHỚP. Đếm giữa phiên: 1 lúc 21:07:19Z → 15 lúc 21:50:03Z → **27 lúc 23:00:05Z**. Nhịp ~0,9 dòng/phút, cùng nhịp #126/#127/#129/#130/#131. Toàn bộ các dòng đều là `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. **Số cuối 27 là cận dưới** — journal #134 sẽ mất sau reboot tiếp theo, không đếm thêm được; không ngoại suy.
- **Tổng phiên (2 boot, đếm trực tiếp): #133 4 (lúc mở) + #134 27 (lúc close). Chuỗi đợt có lỗi thật: 48 → 49** (cả hai boot đợt này đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-202 áp dụng ĐẦY ĐỦ, trừ điểm (4) cho #133):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#134: 27=27; #133: 4=4 — KHỚP); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên (#134: 27 lúc 23:00:05Z; #133: KHÔNG đếm lại được — ghi rõ ở trên); (5) phần journal mất sau reboot thì KHÔNG ngoại suy — đợt này CÓ 2 reboot trong phiên nên journal #133 đã mất sau #134; (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai reboot trong phiên (T9 bắt trực tiếp: gap đo 76 s + exec bị giết)

- **#133 (05bda90d-6988-4925-97f7-71317d569aca, btime 20:32:07Z, epoch 1795811527; XÁC NHẬN (T01-202, 9 nguồn TƯƠI survey 20:42:50Z)).** Sampler T9 trên #133 đợt 202: 20:41:44–21:05:46Z (25 mẫu chính + 25 mẫu live). #133 chết 21:05:15Z. Gap #132→#133 = 12.527 s (3h28m47s).
- **#134 (bd22dffd-4949-4ac2-8e57-a6d3fb2868e2, btime 21:05:15Z, epoch 1795813515; số hiệu ỨNG VIÊN — T01-202 survey 9 nguồn TƯƠI 21:10:07Z + T2/T56/T7/T8 đồng thuận, parent quyết (e)-202).** Sampler T9 trên #134: 21:07:02–23:03:02Z (116 mẫu chính + 117 mẫu live). Gap #133→#134 = **1.988 s** (33m08s — rất ngắn, ngắn nhất kể từ #131→#132 7.135 s). #134 vẫn sống lúc T9 đóng (mẫu cuối 23:02:05Z/23:03:02Z mang boot_id #134).
- **Khoảng không-sampler giữa hai đợt: ~3h38m** (mẫu cuối T9-201 17:03:43Z → mẫu đầu T9-202 20:41:44Z — watcher-201 chết cùng reboot #132, không ai respawn; khoảng không-watcher 13.152 s theo T56-202). **Khoảng không-sampler trong phiên: 76 s (chính) / 78 s (live)** do reboot #134.
- **(m) #133 THÔ: 0 event trong cửa (T01-202 + T2-202). (m) #134 THÔ: 1 requeue DƯƠNG trong cửa (+47,360 s theo T2-202 / +47,513 s theo T01-202 — chênh 0,153 s, phân loại CUỐI thuộc T2-203).** (m) #132 THÔ: eid 11679 requeued 17:04:09,208Z = btime+49,208 s — NGOÀI biên trên 0,592 s (T2-202, phân loại CUỐI thuộc T2-203).

### 5.2 Các luồng khác — 11/11 cờ đã đóng lúc T9 đóng (P1/P2/P3/P4/T01/T2/T4/T5/T56/T7/T8); T9 là cờ cuối (trừ T10 tổng hợp)

- T01-202 ĐÃ đóng: #133 XÁC NHẬN 9 nguồn TƯƠI; #134 survey 9 nguồn TƯƠI (bổ sung sau .done lần đầu — F-202-T01-9); O8 1/3 trên #133 (WebKit FAIL ×2, Chromium 21/21 PASS); GAP §130 đã viết.
- T2-202 ĐÃ đóng: **(m) #132/#133/#134 THÔ (cho T2-203 phân loại CUỐI)**; B-#130 FALSE; n 58/61 GIỮ; (m) #56 lần 44, VẪN CÓ ĐIỀU KIỆN; EPERM probe #120 ok=2 fail=0; 0 sóng thật.
- T4-202 ĐÃ đóng: #70 HỢP LỆ; live-check #21 ĐẠT (T9 xác nhận §3.2); B2 dữ kiện #14 (W1 0 spike).
- T5-202 ĐÃ đóng (xem LIMITS T5 — T9 không phán chuyên môn recorder).
- T56-202 ĐÃ đóng: POSTBOOT_PASS #133 + #134 CÓ (đề xuất không caveat); (A) 120/120 lần thứ 51; suite 9/9 × 6 (82 → 83); marker 82 → 85 nếu #132+#133+#134 xác nhận.
- T7-202 ĐÃ đóng: run 210 TIMEOUT → **CA MỚI #32**; lặng S11 8.406 s → đề xuất OUTAGE #9; cửa slot KHÔNG LÀNH (chuỗi 1 → 0, đề xuất); run 211 SUCCEEDED; run 212 RUNNING — kết cục thuộc T7-203.
- T8-202 ĐÃ đóng: harness 6/6 trên #134; 84l10 PASS (chuỗi 0 → 1); 86n2-P1 dữ kiện mới (22 → 23); FULL PASS KHÔNG CÓ.
- P1/P2/P3/P4-202 ĐÃ đóng (xem LIMITS P1–P4 — T9 không phán chuyên môn sản phẩm). P3-202: C3-loop triển khai + đo lại thật.

## 6. Sai số / caveat (F-202-T9-*)

- **F-202-T9-1 — CỬA SỔ THOÁNG #134 QUAN SÁT ĐƯỢC — BÀI HỌC F-201-T9-1 ĐƯỢC ÁP DỤNG VỀ MẶT KẾT QUẢ (MỚI — ĐÓNG BÀI HỌC).** Reboot #134 21:05:15Z giết phiên exec sleep của T9; T9 tỉnh lúc 21:06:16Z = boot+61s, ĐÚNG GIÂY ĐẦU cửa sổ thoáng (21:06:16–21:06:47Z); probe postboot-202 chạy 21:06:35Z = boot+80s, TRONG cửa sổ: **headroom=28.421**. Caveat trung thực: exec tỉnh dậy đầu tiên vẫn chạy kiểm tra trạng thái (date/uptime/boot_id/ps/wc log) trước probe — nhưng probe vẫn kịp trong cửa sổ vì T9 tỉnh đúng giây đầu cửa sổ, và probe là lệnh đo đầu tiên sau khi xác nhận reboot (không kiểm tra trạng thái nào khác xen giữa). Khác đợt 201 (tỉnh boot+88s, cửa sổ đóng 4s sau khi exec đầu chạy xong — probe không kịp). Bài học F-201-T9-1 ("chạy probe TRƯỚC, kiểm tra trạng thái sau") được áp dụng đầy đủ ở lượt MỞ (probe open-202 là lệnh đo đầu tiên của lượt, 20:41:10Z) và về mặt kết quả ở reboot giữa phiên. Đề xuất cho T9-203: khi tỉnh vì reboot, probe headroom là LỆNH ĐẦU TIÊN của exec đầu tiên — không chạy date/uptime/ps trước (lần này may mắn vì tỉnh đúng giây đầu cửa sổ; nếu tỉnh ở boot+85s thì kiểm tra trạng thái trước sẽ giết cửa sổ như đợt 201).
- **F-202-T9-2 — KHÔNG ĐẾM LẠI ENOSPC #133 TRƯỚC REBOOT (LẶP LẠI F-201-T9-6 — BÀI HỌC CHƯA ĐƯỢC ÁP DỤNG).** T9 đếm ENOSPC #133 lúc mở phiên (4, 20:41Z) rồi ngủ chờ giữa phiên (sleep 3300 bị reboot giết); không đếm lại trong khoảng 20:41–21:05Z; reboot #134 xóa journal #133. Số #133 đợt 202 chỉ còn cận dưới 4. Bài học F-201-T9-6 ("đếm ENOSPC mỗi lần kiểm tra trạng thái giữa phiên") chưa được áp dụng vì T9 không có lần kiểm tra trạng thái nào giữa phiên cho #133 — lần kiểm tra đầu tiên sau mở phiên đã là sau reboot #134. Đề xuất T9-203: đếm ENOSPC ngay trước mỗi lần sleep dài (không chỉ lúc mở/đóng), để snapshot cuối luôn ≤30 phút trước reboot.
- **F-202-T9-3 — `pkill -f` GIẾT LUÔN SHELL EXEC CỦA T9 LÚC DỪNG DAEMON (MỚI — KHÔNG MẤT DỮ KIỆN).** Lệnh dừng daemon lúc đóng dùng `pkill -f "sampler.sh"` — chuỗi lệnh của chính exec chứa "sampler.sh" nên pkill giết luôn shell exec (SIGTERM) sau khi đã giết sampler.sh (pid 2047); các lệnh sau (pkill live/b2watch + freeze) KHÔNG chạy trong lượt đó. T9 dừng live (pid 2048) + b2watch (pid 2049) bằng `kill <pid>` ở exec sau, rồi freeze. Hệ quả: live sampler viết thêm 1 mẫu 23:03:02Z (sau khi sampler chính dừng 23:02:05Z) — live 142 mẫu vs chính 141 mẫu; phân tích chạy trên log đóng băng, số liệu đã đối chiếu cả hai luồng (CEIL 45/46 cùng 1 đợt ghim). Bài học: dừng daemon bằng PID (ghi pids.txt lúc khởi động), không dùng `pkill -f` với pattern trùng chuỗi lệnh của chính mình.
- **F-202-T9-4 — HEADROOM-LOG NHIỄM TRACEBACK LÚC MỞ PHIÊN (MỚI — ĐÃ DỌN, KHÔNG MẤT DỮ KIỆN).** Exec đầu tiên chạy `python3 probe-once.py` KHÔNG có tag (thiếu đối số) rồi `tee -a` stderr vào headroom-log.txt — traceback IndexError ghi vào log trước dòng open-202. T9 đã dọn bằng grep chỉ giữ dòng đúng định dạng probe (`^[a-z0-9-]+-202 ...`), kiểm lại: log chỉ còn 4 dòng probe (open/postboot/mid/close), md5 `84d1188741413bb2adcf4f7b16b4ca35`. Bài học: không bao giờ `tee` stderr chưa kiểm vào log đo; probe lỗi đối số thì chạy lại, không ghi đè log.
- **F-202-T9-5 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; probe open 20:41:10Z trước mọi attempt (T4 mở W1 21:33:13Z); probe postboot 21:06:35Z sau khi T4 restart poller trên boot mới nhưng TRƯỚC khi cửa yên mở (21:28:09Z) và KHÔNG trong W1; probe mid 21:50:03Z không chồng lấn cửa sổ yên nào (W1 đã kết thúc 21:36:42Z; T2/T56/T7/T8 lúc đó không chạy attempt yên); probe close 23:00:05Z sau khi mọi luồng đo đã đóng); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG ~23:10Z — TRONG hạn cứng 23:35:51Z.** Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: đợt 201 có vi phạm mới hay không thuộc T10/parent (T4 ghi nhận chồng lấn trong W1 đợt 202: T2 ghi 3 file + T56 ghi 2 file trong W1, F-202-T4-3 — giao T2/T56/parent phán (p)-202; waiter T8 + sampler live T9 trong W1 là daemon đo lường/tuân thủ — theo (p)-200 KHÔNG VI PHẠM).
- **F-202-T9-6 — MẪU SAMPLER CUỐI #133 NGOÀI BTIME #134 (CÙNG LỚP F-201-T9-3).** Mẫu chính cuối trên #133 21:05:46Z mang boot_id `05bda90d` dù btime #134 là 21:05:15Z (31 s sau btime) — sampler đọc boot_id TRƯỚC khi reboot hoàn tất ghi đè. T9 giữ nguyên log (không sửa mẫu), ghi rõ: **mẫu 21:05:44Z (live) / 21:05:46Z (chính) thuộc phiên #133 về mặt boot_id nhưng nằm sau btime #134 29/31 s** — phân tích theo boot_id như mọi đợt. Hệ quả thực tế: 0 — close probe 23:00:05Z đã xong trước mọi reboot sau đó; ENOSPC #134 chốt ở 27 (23:00:05Z).

- **Caveat đứng:** probe cap 30.000 (giá trị mở là censored — chỉ biết ≥ 30.000; headroom 28.421 < cap nên KHÔNG bị censored); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 1.639 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); cửa sổ thoáng #133 KHÔNG quan sát được đợt này (đóng trước lượt mở); số hiệu #134 là ỨNG VIÊN (parent quyết (e)-202); E-247 GIỮ MỞ (T9 chỉ báo dữ kiện + đếm boot không-pin: chuỗi GIỮ 0); #133 chỉ có 25 mẫu quan sát được nên không tính là boot sạch cho chuỗi.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (141 dòng chính: 25 #133 + 116 #134, 20:41:44–23:02:05Z): `hidden_files/round202-t9/ram-sampler-FROZEN.log` — md5 `af0827bf861e71f4af7e59e7a13f43e2`. Log live đóng băng (142 dòng, tách riêng): `hidden_files/round202-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `20637704482bc0fb5fc311530c6b6d7f`. Log B2 đóng băng (147 spike): `hidden_files/round202-t9/b2-spikes-FROZEN.log` — md5 `53db6b9beaffe7d678c70828fc3001ce`. Log headroom đóng băng (4 lần đo): `hidden_files/round202-t9/headroom-log-FROZEN.txt` — md5 `84d1188741413bb2adcf4f7b16b4ca35`. Phân tích: `t9-202-analyze.py` (output `t9-202-analyze-output.txt`) + `t9-202-live-analyze.py` (output `t9-202-live-analyze-output.txt`) + `t9-202-b2-analyze.py` (output `t9-202-b2-analyze-output.txt`). Baseline: `t9-202-baseline-notes.md` (gồm lựa chọn (a) F-200-T9-1 + reboot #134 + tra chuỗi birefnet F-201-T10-4). Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). Driver: `t9-202-driver.sh` (mid 21:50Z, close 23:00Z, reboot watch — tự kết thúc 23:00:05Z sau probe close). B2 watcher bản 202 (`b2watch.sh` — lọc `ps` + ghi `boot=` mỗi spike). T10 đọc log đóng băng trực tiếp khi cần.
