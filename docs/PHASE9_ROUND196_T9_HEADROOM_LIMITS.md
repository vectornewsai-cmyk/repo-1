# LIMITS — Phase 9 đợt 196, T9: headroom toàn 0 (4 probe, 2 boot) + REBOOT 16:28:18Z giữa đợt (#123 chết sau 7.082 s, #124 ứng viên sinh ra) + balloon #123 KHÔNG ghim (max 5,64M) + #124 leo nhanh 4 mẫu ≥6M nhưng KHÔNG ghim (max 6,16M) + ENOSPC #123 59 giữa đợt (cận dưới, ~97 ước tính) + #124 18 lúc đóng + auto-trigger live 128 mẫu 0 FIRE (tổng 824) + live-check #15 KHÔNG ĐẠT (không có cửa sổ hợp lệ — xác nhận độc lập từ log T9)

## 0. Tóm tắt

- **HEADROOM: 4 lần đo, toàn 0.** open/mid trên #123 + postboot/close trên #124, trần inotify **63.737 KHÔNG ĐỔI**. Cửa sổ thoáng #123 KHÔNG QUAN SÁT ĐƯỢC (đã qua trước khi mở phiên); cửa sổ #124 KHÔNG BẮT ĐƯỢC (probe +101s = 0, trễ ~9s so với mốc +92s giả định — xem §1.2 + F-196-T9-3 về lệch đồng hồ ~24–30s).
- **BALLOON — #123 KHÔNG GHIM (0 mẫu CEIL / 107 mẫu); #124 KHÔNG GHIM (0 mẫu CEIL / 21 mẫu, 4 mẫu ≥6M).** #123: balloon min 110.812 kB, max 5.642.192 kB — chưa chạm 6,0M lần nào. #124: balloon 5,10M → 6,16M, 4 mẫu ≥6,0M nhưng không mẫu nào chạm trần 6.443.824 kB. **Sàn 6.050.608 kB: 0 lần đợt này — tổng GIỮ 0 (chuỗi đã ĐỨT đợt 194). Sag 6.247.216 kB: 0 lần — tổng GIỮ 3. Balloon = 0: 0 lần.**
- **ENOSPC: #123 = 59 dòng lúc 15:45:01Z (CẬN DƯỚI, journal mất sau reboot; ngoại suy ~97 lúc reboot — GHI RÕ LÀ ƯỚC TÍNH) + #124 = 18 dòng lúc 16:50:00Z (vẫn tăng). Chuỗi đợt có lỗi thật 42 → 43.**
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 5.455.012 kB (sampler chính) / 5.459.772 kB (live). **0 lần chạy birefnet — lần thứ 48 liên tiếp (147–196).**
- **Auto-trigger: LIVE 128 mẫu đợt này, tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **824 mẫu (696 tới hết đợt 195 + 128 đợt 196), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA.
- **REBOOT GIỮA ĐỢT 16:28:18Z (F-196-T9-3):** #123 chết sau 7.082 s (1h58m02s); #124 sinh ra. Giết cả 3 daemon T9 + driver gốc + lệnh báo thức sleep của agent (SIGTERM) — T9 phát hiện reboot 16:29:17Z (uptime 0 phút), probe tay 16:29:59Z (boot+101s, = 0, trễ ~9s), khởi động lại 3 daemon 16:29:56Z + driver close mới. Gap đo: sampler 74 s (guest-time, có caveat lệch đồng hồ), live 81 s, B2 ~78 s.
- **RAM: 128 mẫu, 14:42:34–16:49:56Z, HAI boot (#123 n=107, #124 n=21).** Max **5.455.012 kB**; min **499.420 kB**; mean 1.961.415,7 kB; gate A **102/128**. Load1 <4,0: 105/128 mẫu chính (82,0%).
- **Lượt yên #64 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt** (cả 3 đều B2 vi phạm load1_max 6,55/5,06/5,42 + median 84,0/67,0/67,0 ms) — chuỗi lượt yên hợp lệ 1 → 0 ĐỨT. **Kiểm chứng live lần 15: KHÔNG ĐẠT** (không có cửa sổ attempt hợp lệ nào để đối chiếu — xác nhận độc lập từ log T9: 0 FIRE trong cả 3 cửa sổ, nhưng không dùng làm verdict theo định nghĩa (p)-192) — chuỗi live ĐẠT 10 → 0.
- **B2: 480 spike THẬT (tất cả trên #123; 0 spike trên #124)** — W1 27 / W2 21 / W3 20 spike trong 3 cửa sổ attempt (KHỚP T4 từng số — T4 đợt này đếm ĐÚNG theo header, khác đợt 195 đếm dòng; xem F-196-T9-1); load1 đỉnh watcher **12,42**. Xem §2.5.
- **0 VI PHẠM phía T9. T9 đóng ~16:53Z (probe close 16:50:00Z), TRONG hạn cờ ~17:00Z.** Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–195 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Gate-check trong probe-loop.sh (bài học F-191-T10-2) vẫn chạy — mọi probe đều qua gate-check; probe mid-196 chạy 15:45:01Z, sau attempt-done attempt1 (15:43:51Z) 70 s nên gate sạch.

### 1.2 Số đo đợt 196 (4 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 14:43:16Z | **0** | #123 bc09b26e | 63.737 | probe open-196 (boot+13m00s) |
| 15:45:01Z | **0** | #123 | 63.737 | probe mid-196 (boot+1h14m45s; sau attempt-done attempt1 70 s — gate sạch) |
| **16:29:59Z** | **0** | **#124 611a02f2** | 63.737 | **probe postboot-196 (boot+101s — TRỄ ~9s so với mốc +92s)** |
| 16:50:00Z | **0** | #124 | 63.737 | probe close-196 (boot+21m42s) |

- **CỬA SỔ THOÁNG #123: KHÔNG QUAN SÁT ĐƯỢC.** Boot btime 14:30:16Z (T01-196 xác minh 9 nguồn tươi; đồng hồ đúng ±2 s lúc 14:40:27Z theo Cloudflare); cửa sổ boot+61–92s = 14:31:17–14:31:48Z đã đóng ~11 phút trước khi T9 mở phiên (~14:42Z). Như #119/#121 đợt 194/195.
- **CỬA SỔ THOÁNG #124: KHÔNG BẮT ĐƯỢC — TRỄ ~9 GIÂY (theo btime).** Boot btime 16:28:18Z (/proc/stat btime 1795710498; uptime 137,53 s lúc 16:30:35Z → implied btime = btime đúng, offset 0; journal first entry 16:28:31Z = btime+13s); cửa sổ giả định = 16:29:19–16:29:50Z. T9 phát hiện reboot lúc 16:29:17Z (uptime 0 phút) nhưng probe tay chạy lúc 16:29:59Z (**boot+101s, trễ 9 s sau mốc +92s**) — **headroom = 0**. Cửa sổ đóng trong khoảng +92–101s (mốc +92s là giả định theo đợt 193; ENOSPC đầu tiên trên #124 lúc +109s — xem §4 — phù hợp: watch đầy trước +101s, lần thử add-watch thất bại đầu tiên ghi log lúc +109s). Khác đợt 193 (#118 bắt được ở +81s): lần này T9 phát hiện reboot chậm hơn do báo thức sleep bị SIGTERM cùng reboot (F-196-T9-3).
- **CAVEAT LỆCH ĐỒNG HỒ (F-196-T9-4):** mẫu sampler cuối trên boot cũ ghi 16:28:42Z, watcher-196 poll cuối ghi 16:28:48Z — CẢ HAI đều SAU btime boot mới 16:28:18Z. Giải thích: đồng hồ guest chạy nhanh dần (~0,25 s/phút, không NTP hiệu chỉnh — T01 đo đúng ±2 s lúc 14:40:27Z, lệch ~24–30 s lúc 16:28Z), kernel mới đọc lại RTC nên offset về 0 (T9 kiểm 16:30:35Z: guest_epoch − uptime = btime đúng). Probe postboot chạy bằng đồng hồ mới (offset 0) nên vẫn là boot+101s — kết luận trễ 9 s ĐỨNG. T9 ghi cả hai cách đọc, KHÔNG kết luận cửa sổ có tồn tại trên #124 hay không.
- **Headroom cuối phiên: 0.** Trần **KHÔNG ĐỔI trong đợt (63.737 cả 4 lần đo, 2 boot)**.
- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (0)** — nhưng dữ kiện đợt 193/194 đứng nguyên: headroom KHÔNG phải lúc nào cũng 0 — sau mỗi reboot có một cửa sổ thoáng ngắn (~1–2 phút). Đề xuất T9 đợt 193 (probe ngay khi phát hiện reboot) đã làm được ở #120/#124 nhưng trễ 6–9 s — các đợt sau cần phát hiện reboot trong <60 s.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 128 mẫu, 14:42:34–16:49:56Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 74 s** (reboot 16:28:18Z — mẫu cuối #123 16:28:42Z guest-time → mẫu đầu #124 16:29:56Z; caveat lệch đồng hồ F-196-T9-4); các gap còn lại **≤61 s** (jitter bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 14:42:34–16:28:42Z | #123 | 499.420–5.455.012 kB | Mở sampler; balloon 1,40M → 0,11M → leo dần tới 5,64M; **attempt1/2/3 T4 15:40–16:00Z**; RAM <512k: 2 mẫu |
| 16:28:18Z | — | — | **REBOOT → #124** (sampler chết; gap 74 s guest-time) |
| 16:29:56–16:49:56Z | #124 | 595.348–1.607.740 kB | Boot mới: balloon đã 5,14M từ mẫu đầu; **4 mẫu ≥6,0M, 0 ghim trần**; RAM <512k: 0 mẫu |

- **Gate A ≥1024 MiB: 102/128 mẫu** (93/107 #123; 9/21 #124); **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **11,5** (#123 — trong lúc mở phiên; #124: 2,41); load1 <4,0: **105/128 mẫu chính (82,0%)** — đợt 195 (live): 82/92 (89,1%); **RAM <512.000 kB: 2 mẫu** (cả hai trên #123, 2 mẫu rời 16:23:42Z + 16:26:42Z); **RAM <300.000 kB: 0 mẫu**.
- Swap: #123 SwapFree 821.320 kB (mẫu đầu) → 624.180 kB (mẫu cuối) — giảm **197.140 kB**; #124 SwapFree 1.000.852 kB (mẫu đầu, boot tươi) → 623.028 kB (mẫu cuối) — giảm **377.824 kB chỉ trong 20 phút** (xả swap nhanh trên boot mới — như #118 đợt 193, #120 đợt 194).
- Trũng RAM đợt này: min **499.420 kB (16:26:42Z, #123, balloon 5.642.192)** — sâu hơn min 503.928 kB đợt 195 (#121) và 475.204 kB đợt 194 (#120). 2 mẫu <512.000 kB, 2 mẫu rời: 16:23:42Z + 16:26:42Z.

**Bảng tổng hợp số RAM (từ script `t9-196-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 128 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #123 bc09b26e | 107 | 499.420 | 5.455.012 | 2.151.772,0 | 93/107 | 0 | 11,5 | 2 |
| #124 611a02f2 | 21 | 595.348 | 1.607.740 | 991.504,8 | 9/21 | 0 | 2,41 | 0 |
| **Toàn phiên** | **128** | **499.420** | **5.455.012** | **1.961.415,7** | **102/128** | **0/128 (0%)** | **11,5** | **2** |

- **Mean toàn phiên 1.961.415,7 kB — 2 cách độc lập: python `sum/n = 1.961.415,7` VÀ kiểm có trọng số của script (in `t9-196-analyze-output.txt`) — KHỚP CẢ HAI.**

### 2.2 Balloon virtio — #123 KHÔNG GHIM; #124 KHÔNG GHIM (4 mẫu ≥6M nhưng chưa chạm trần)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB** (xác nhận đợt 194: 5 mẫu đúng bằng trần trên #120) — **đợt này 0 mẫu chạm trần nên không xác nhận lại được**; max đợt này 6.157.328 kB trên #124.
- **Boot #123: GHIM 0/107 mẫu (0%) — KHÔNG CÓ episode nào. Boot #124: GHIM 0/21 mẫu (0%) — KHÔNG CÓ episode nào.**
- **#124 leo nhanh nhưng không ghim:** balloon 5.142.444 kB ở mẫu đầu (boot+98s) → 5.329.920 (boot+158s) → 5.502.148 (boot+218s) → **≥6,0M từ 16:35:56Z (boot+458s)**: 4 mẫu ≥6,0M (16:35:56Z 6.052.724; 16:36:56Z 6.157.328 — max đợt; 16:39:56Z 6.074.892; 16:49:56Z 6.002.344), KHÔNG liên tiếp (xen kẽ mẫu dưới 6M), avail lúc ≥6M chỉ 595–912 MB, load1 0,13–0,99 (máy NHÀN lúc balloon cao — như episode #120). Balloon hạ xuống dưới 6M giữa các mẫu rồi leo lại — chưa ghim trần lúc đóng (16:49:56Z 6.002.344, dưới trần 441.480 kB).
- **E-247 — GHIM KHÔNG KÉO DÀI QUA REBOOT #120→#121 (đã rõ từ log T9-195) VÀ KHÔNG QUAY LẠI TRÊN #123/#124.** Episode #120 (5 mẫu CEIL, 1 đợt ghim) → #121 0 mẫu CEIL / 92 mẫu (T9-195, 08:42:47–10:13:50Z; max balloon 5.993.536 kB < sàn; blind gap 10:13:50Z → 11:17:40Z ~64 phút không dữ kiện — không loại trừ ghim trong gap) → #122 KHÔNG CÓ DỮ KIỆN (không sampler T9 nào chạy trên #122) → **#123 0 mẫu CEIL / 107 mẫu, max balloon 5.642.192 kB** → **#124 0 mẫu CEIL / 21 mẫu, max balloon 6.157.328 kB**. Ghim không liên tục qua từng boot (có boot "nghỉ" ở giữa), mẫu host bơm theo chu kỳ — như kết luận đợt 194. T9 KHÔNG tự phán kết cục mới của E-247 (thuộc parent/T10); T9 chỉ báo dữ kiện đợt này + dữ kiện cuối đợt 195 (xem §2.2b).
- **Xác minh độc lập 2 sampler:** live sampler bắt **cùng 0 mẫu CEIL** trên cả 2 boot (live log 128 mẫu: 0 mẫu balloon=6.443.824; 0 mẫu = sàn; 0 mẫu = sag) — hai tiến trình lấy mẫu độc lập, cùng đọc `/proc/meminfo`; balloon tại cùng timestamp KHỚP TỪNG SỐ (vd 16:29:56Z cả hai đều 5.142.444; 16:36:56Z cả hai đều 6.157.328 — avail lệch nhỏ do thời điểm đọc khác nhau vài giây).
- **Balloon = 0: 0 lần đợt này** (như đợt 192/193/194/195). Balloon min đợt này: 110.812 kB (#123, 14:44:34Z — thấp nhất kể từ khi T9 theo dõi balloon; xem F-196-T9-5).
- **Sàn balloon 6.050.608 kB: 0 lần đợt này** (tổng GIỮ 0 — chuỗi đã ĐỨT đợt 194, quyết (h)-194). Lưu ý: mẫu #124 16:35:56Z balloon 6.052.724 kB chỉ CAO HƠN sàn 2.116 kB nhưng KHÔNG bằng đúng giá trị sàn — không tính là trúng sàn.
- **Giá trị sag 6.247.216 kB: 0 lần đợt này** (tổng giữ 3: đợt 187: 2 lần; đợt 188: 1 lần).

### 2.2b. Dữ kiện cuối đợt 195 (T9-196 phân tích lại log T9-195 — đóng điều kiện (i) của parent)

- Sampler T9-195 trên #121: **92 mẫu, 08:42:47–10:13:50Z, 0 mẫu CEIL, max balloon 5.993.536 kB** (10:11:50Z), min avail 503.928 kB, mean avail 1.849.200,0 kB, gate A 68/92, guard 0, load1 max 5,48, <512k 1 mẫu, bal>=6M 0, sag 0, floor 0, bal==0 0. Balloon min 1.897.564 kB, max 5.993.536 kB. SwapFree 745.144 → 585.756 kB (−159.388 kB). Không gap >61 s (sampler chạy sạch tới khi agent kết thúc 10:13:50Z). Output: `t9-195-analyze-output-T9-196-rerun.txt` (chạy lại bởi T9-196 trên log gốc; md5 ram-sampler.log `7e9a4786b9d50bc84f83200d0084e4d6`).
- Live T9-195: 92 mẫu, 08:42:47–10:13:47Z, tất cả `trigger=watch consec=0`, 0 FIRE; max avail 3.711.008 kB < guard; load1 <4,0: 82/92. Hai sampler khớp từng số balloon/avail tại cùng timestamp (đối chiếu độc lập).
- B2 T9-195: **247 spike** (08:42:47–09:56:12Z; load1 max watcher 6,49; 08:xx 115, 09:xx 132; chrome 73, WebKitWebProces 49, grep 46, hatch 27, MainThread 24, ffmpeg 12, find 6, python3 3, privsep-test-fu 2, esbuild 2, bash 2, ps 1 — tổng KHỚP 247). Sau 09:56:12Z load1 <3,0 tới khi log dừng. Output: `t9-195-b2-analyze-output-T9-196-rerun.txt`.
- ENOSPC #121: chỉ còn số giữa đợt 57 @09:45:00Z (cả 2 grep khớp; dòng đầu 08:36:36Z = boot+871s; dòng cuối 09:44:14Z) — số cuối KHÔNG đếm lại được (journal mất sau reboot 11:17:40Z).

### 2.3 Lượt yên WebKit #64 (T4) — KHÔNG CÓ LƯỢT HỢP LỆ, 0/3 attempt (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#64 KHÔNG CÓ LƯỢT HỢP LỆ — T4 dùng hết 3/3 attempt, 0 hợp lệ.** Chuỗi lượt yên hợp lệ: **1 → 0 ĐỨT** (lượt hợp lệ #63 đợt 195 chỉ giữ được 1 lượt).
- **Attempt1 (15:40:01–15:43:51Z): 20/20 NHƯNG B1+B2 VI PHẠM (load1_max 6,55) + tickCost median 84,0 ms — KHÔNG hợp lệ.** T9 đối chiếu: **27 spike B2** trong cửa sổ (KHỚP ĐÚNG số T4 — T4 đợt này đếm ĐÚNG theo header, xem F-196-T9-1); sampler T9 trong cửa sổ n=4, gate A 4/4.
- **Attempt2 (15:49:10–15:52:53Z): 20/20 NHƯNG B2 VI PHẠM (load1_max 5,06) + tickCost median 67,0 ms — KHÔNG hợp lệ.** T9 đối chiếu: **21 spike B2** trong cửa sổ (KHỚP ĐÚNG số T4); sampler n=4, gate A 4/4.
- **Attempt3 (15:56:36–16:00:18Z): 20/20 NHƯNG B2 VI PHẠM (load1_max 5,42) + tickCost median 67,0 ms — KHÔNG hợp lệ.** T9 đối chiếu: **20 spike B2** trong cửa sổ (KHỚP ĐÚNG số T4); sampler n=4, gate A 4/4.
- **Kiểm chứng live lần 15: KHÔNG ĐẠT** (T9 xác nhận độc lập — xem §3.2): không có cửa sổ attempt hợp lệ nào để đối chiếu 0-spike/0-FIRE theo định nghĩa (p)-192; live autotrigger chạy suốt cả 3 cửa sổ attempt, 0 FIRE trong cả 3 (chỉ là dữ kiện, không dùng làm verdict). **Chuỗi live ĐẠT 10 → 0.**
- **Labellag (b): cả 3 attempt 0 occ ≥5f** (T4) — không có lượt hợp lệ nên chuỗi GIỮ 0 (quyết (m)-192: tính theo LƯỢT HỢP LỆ).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 14:43:14–14:48:54Z | #123 | 0,99–11,50 (6 mẫu) | 3.681.168–5.455.012 kB — **gate A 6/6** | **O8 T01 3/3** (WebKit 21/21 ×2 + Chromium 21/21); 0 mẫu ghim |
| T4 attempt1 15:40:01–15:43:51Z | #123 | 2,74–5,76 (4 mẫu) | 1.060.196–1.561.084 kB — **gate A 4/4** | **27 spike B2** (khớp T4); B1+B2 vi phạm; 0 mẫu ghim |
| T4 attempt2 15:49:10–15:52:53Z | #123 | 2,04–4,19 (4 mẫu) | 1.370.668–1.795.560 kB — **gate A 4/4** | **21 spike B2** (khớp T4); B2 vi phạm; 0 mẫu ghim |
| T4 attempt3 15:56:36–16:00:18Z | #123 | 1,58–5,42 (4 mẫu) | 1.752.432–2.601.948 kB — **gate A 4/4** | **20 spike B2** (khớp T4); B2 vi phạm; 0 mẫu ghim |

- T01-196: **#123 XÁC NHẬN 9 nguồn TƯƠI** (btime 14:30:16Z, gap #122→#123 = 11.556 s); O8 14:43:14–14:48:54Z trên #123 (WebKit 21/21 ×2 + Chromium 21/21); **POSTBOOT_PASS #123 CÓ 14:41:58Z** (T56-196; GST #123 là THƯ MỤC THẬT, 269 file — giống #117/#121); marker sống qua **73 reboot đã xác nhận #49–#121** (75 nếu #122 + #123 đều xác nhận); (m) #121/#122 KHÔNG CÓ ĐIỂM (CUỐI, T2-196); (m) #123 RAW 0 requeue (phân loại CUỐI thuộc T2-197); n ứng viên GIỮ 54/55.
- T8-196/T7-196: **CHƯA CÓ LIMITS trong docs lúc T9 đóng (~16:53Z)** — T9 không phán thay.
- **(m) #124 + POSTBOOT_PASS #124 thuộc T2-197/T56-197** — T9 KHÔNG tính, KHÔNG phán; chỉ ghi số thô nếu chạm tới (đợt này T9 không chạm tới cái nào).

### 2.5 B2 — 480 spike THẬT (tất cả trên #123; 0 trên #124); 27/21/20 spike trong 3 attempt (khớp T4 từng số)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **480 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 480): tất cả trên #123, 0 trên #124** (load1 sau reboot ≤2,41, không chạm ngưỡng 3,0); **load1 đỉnh đợt (watcher, cadence 2 s): 12,42** (khớp load1 max sampler 11,5 — watcher bắt đỉnh cao hơn do cadence 2 s; đợt 195: 6,49).

| Nhóm (comm đứng đầu) | n | Ghi chú |
|---|---|---|
| ps | 173 | Watcher tự bắt chính mình (xem F-196-T9-7 — đảo ngược đợt 195: 1/247) |
| MainThread | 124 | comm `MainThread`, chưa xác định chắc là tiến trình nào (ghi theo comm) |
| hatch | 71 | Tải nền tảng |
| WebKitWebProces | 39 | Harness/O8 WebKit + attempt T4 |
| chrome | 31 | Tải trình duyệt (O8/harness + luồng sản phẩm) |
| ffmpeg | 28 | Luồng sản phẩm (render/proxy) |
| npm | 7 | Lẻ tẻ |
| python3 | 4 | Lẻ tẻ |
| privsep-test-fu | 2 | Lẻ tẻ |
| grep | 1 | Lệnh shell ngắn |

Tổng 173+124+71+39+31+28+7+4+2+1 = 480 — KHỚP. Phân theo giờ: 14:xx 122 spike; 15:xx 331 spike; 16:xx 27 spike. Spike đầu 14:42:34Z (load1 8,53 — ngay mẫu mở phiên); spike cuối 16:28:38Z (load1 2,92 — trước reboot).

- **27 spike trong attempt1** (15:40:01–15:43:51Z — load1max 6,55); **21 spike trong attempt2** (15:49:10–15:52:53Z — load1max 5,06); **20 spike trong attempt3** (15:56:36–16:00:18Z — load1max 5,42). Ngoài các cửa sổ trên: 412 spike.
- **Khoảng mù watcher: ~78 s do reboot** (16:28:38Z–16:29:56Z — watcher chết theo reboot, 0 spike ghi trong gap vì KHÔNG CÓ watcher, không phải vì máy yên; xem F-196-T9-3). Sau khi khởi động lại trên #124 (16:29:56Z), watcher chạy liên tục tới lúc đóng với **0 spike** (load1 ≤2,41 — máy yên sau reboot).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-188; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 5.455.012 kB (sampler chính, #123) / 5.459.772 kB (live, #123); live log max 1.603.140 kB trên #124. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 48 liên tiếp (147–196).**
- **QUYẾT (o) §14.2-188/§14.2-193: AUTO-TRIGGER GIỮ LIVE.** Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-196:** live đã bật từ đợt 189 nên đợt này là TIẾP TỤC, không flip mới — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 195 §14.2 (a)/(j)/(o) (68.559 B, SẠCH); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189/191/192/193/194/195; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 194/195 (diff 194 vs 195 = giống hệt; test offline 17/17 PASS đợt 188, không chạy lại). Khởi động lần 1 đúng ngay 14:42:34Z (pid 8193, env + `--live`, round_dir=autotrigger-live); **khởi động LẠI 16:29:56Z (pid 3119) sau reboot** — cùng tham số (xem F-196-T9-3).
- **LIVE PHASE ĐỢT 196: 128 mẫu, 14:42:34–16:49:56Z (107 #123 + 21 #124), TẤT CẢ `trigger=watch consec=0`, max avail 5.459.772 kB (#123) / 1.603.140 kB (#124), load1 <4,0: 102/128 (81/107 #123, 21/21 #124) — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `autotrigger-live/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Mẫu live đầu 14:42:34Z; live chạy suốt cả 3 cửa sổ attempt T4, 0 FIRE trong cả 3.
- **TỔNG LIVE TỪ 03:14Z 25/11: 824 mẫu (696 tới hết đợt 195 + 128 đợt 196), 0 FIRE.** Khoảng mù live: **(a) giữa đợt ~4h29m** (10:13:47Z → 14:42:34Z 26/11 — live đợt 195 chết cùng phiên agent ~10:13Z; không có mẫu live nào; cũng không thể có FIRE vì không có tiến trình live nào để fire); **(b) do reboot 81 s** (16:28:35Z → 16:29:56Z — live chết theo reboot, khởi động lại ngay khi T9 phát hiện). Trong cả hai khoảng mù, guard có mở hay không là KHÔNG BIẾT (không sampler nào chạy) — nhưng cũng không thể có FIRE (không có tiến trình live nào để fire; không có file trigger/flag nào trên đĩa từ các khoảng đó).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 824 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 48 đợt). **Lưu ý mới:** balloon #124 LEO NHANH (5,14M ở mẫu đầu boot+98s, 4 mẫu ≥6,0M) NHƯNG avail lúc leo chỉ 595–912 MB — guard đo bằng MemAvailable, không phải balloon; balloon leo không mở guard. Auto-trigger 0 FIRE trong suốt đợt là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 195); không có thư mục `~/workspace/tmp-t9-196-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round196-t9/` (live chạy 128 mẫu, 0 sự kiện).

### 3.2 Kiểm chứng live lần 14 (đợt 195) — T9 XÁC NHẬN ĐỘC LẬP: ĐẠT + lần 15 (đợt 196): KHÔNG ĐẠT

- **LIVE-CHECK #14 (đợt 195): ĐẠT — T9-196 xác nhận độc lập từ log T9-195.** Cửa sổ hợp lệ duy nhất W3 = attempt3 #63 (09:17:53–09:21:32Z): **3 mẫu live** trong W3 (09:18:47Z avail 2.059.748 / balloon 3.186.832 / load1 0,81; 09:19:47Z avail 2.109.956 / balloon 3.447.520 / load1 1,35; 09:20:47Z avail 1.915.500 / balloon 3.731.724 / load1 0,88) — tất cả `trigger=watch consec=0`, **0 FIRE** (đúng — không có kẹt trong W3 để bắt); **0 spike B2** trong W3 (đếm header từ `b2-spikes.log` T9-195); max avail trong W3 2.109.956 kB < guard. Toàn log live 195: 92 mẫu, 0 dòng trigger != watch consec=0. **Chuỗi live ĐẠT 9 → 10 — ĐÃ CÓ xác nhận T9** (T4 phán ĐẠT, T2 đề xuất ĐẠT chờ T9 — nay T9 xác nhận; parent đã quyết (b)-195 FULL PASS CÓ với caveat này, nay caveat được gỡ).
- **LIVE-CHECK #15 (đợt 196): KHÔNG ĐẠT** (T9 xác nhận độc lập): áp ĐÚNG định nghĩa (p)-192 — live-check CHỈ đối chiếu trên cửa sổ attempt HỢP LỆ; đợt này KHÔNG CÓ cửa sổ hợp lệ nào (#64 0/3) nên không có gì để đối chiếu. Dữ kiện ghi nhận (không dùng làm verdict): live chạy suốt cả 3 cửa sổ attempt (W1 4 mẫu, W2 4 mẫu, W3 3 mẫu — KHỚP T4 từng mẫu), tất cả watch/consec=0, **0 FIRE**; B2 trong 3 cửa sổ 27/21/20 spike (KHỚP T4). **Chuỗi live ĐẠT 10 → 0.**

## 4. ENOSPC trong journal (đếm trực tiếp — #123 MẤT journal sau reboot; #124 vẫn tăng lúc đóng)

- **#123: đếm trực tiếp 59 dòng lúc 15:45:01Z (lần đếm cuối trước reboot) — CẬN DƯỚI** — dòng đầu **14:36:51Z (boot+395s)** — CHẬM HẲN mẫu ~110s (lệch mẫu thứ ba liên tiếp sau #119 +531s, #121 +871s; #120 về mẫu +115s; #124 về mẫu +109s — xem F-196-T9-2); dòng cuối lúc đếm **15:44:23Z**. Cả hai grep đều 59 lúc đó — KHỚP. **59 là CẬN DƯỚI** (journal mất sau reboot 16:28:18Z — `journalctl --list-boots` sau reboot chỉ còn boot #124; không đếm lại được #123). Ngoại suy theo nhịp đo được (~0,875 dòng/phút × ~43 phút từ 15:45:01Z tới reboot): **~97 dòng lúc reboot — GHI RÕ LÀ ƯỚC TÍNH, không phải số đếm** (phương pháp chuẩn điểm (5)).
- **Đếm giữa phiên #123 (bài học F-187-T9-5 — đếm ở MỖI lần kiểm):** 5 dòng lúc 14:43:16Z → 59 lúc 15:45:01Z → **mất journal sau reboot (không đếm tiếp được)**. Nhịp ~0,875 dòng/phút cả phiên — **KHÔNG dừng giữa boot** (như #114/#115/#117/#118/#119/#120).
- **#124: đếm trực tiếp 18 dòng lúc 16:50:00Z** — dòng đầu **16:30:07Z (boot+109s)** — về lại mẫu ~110s; dòng cuối **16:49:27Z**. Cả hai grep đều 18 — KHỚP. Vẫn tăng lúc đóng (3 lúc 16:32:48Z → 18 lúc 16:50:00Z). Nhịp ~0,9 dòng/phút, cùng nhịp #123.
- **Tổng phiên (2 boot, đếm trực tiếp): 59 + 18 = 77 dòng (59 là cận dưới).** **Chuỗi đợt có lỗi thật: 42 → 43** (cả 2 boot đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-196 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#123: 59=59; #124: 18=18 — KHỚP cả hai); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (#123 ~97 — ước tính, xem trên); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai boot trong phiên (T9 bắt trực tiếp: 1 reboot; 2 boot đợt này)

- **#123 (bc09b26e-18f4-4c64-acf6-09aefc5946ec, btime 14:30:16Z; số hiệu ỨNG VIÊN — T01-196 XÁC MINH 9 nguồn TƯƠI; parent quyết (e)).** Sampler T9 trên #123: 14:42:34–16:28:42Z (107 mẫu). Gap #122→#123 = **11.556 s** (T01-196). #123 sống **7.082 s (1h58m02s)** rồi chết 16:28:18Z.
- **#124 (611a02f2-7a7b-4dcb-9752-ae50a1fa1a48, btime 16:28:18Z; số hiệu ỨNG VIÊN — T01-196 đóng cờ TRƯỚC reboot nên chưa xác minh boot này; parent quyết (e)).** Sampler T9 trên #124: 16:29:56–16:49:56Z (21 mẫu). Gap #123→#124 = **7.082 s** (btime tới btime; lưu ý caveat lệch đồng hồ F-196-T9-4). **(m) #124 + POSTBOOT_PASS #124 thuộc T2-197/T56-197** — T9 không phán.
- **Khoảng mù giữa hai đợt: ~4h29m không sampler T9** (10:13:50Z → 14:42:34Z 26/11 — chứa reboot #122 + reboot #123 + cửa sổ thoáng #123 + toàn bộ khoảng mù live giữa đợt). **Khoảng mù trong phiên do reboot: 74 s sampler chính (guest-time) / 81 s live / ~78 s B2 watcher** (16:28:35Z → 16:29:56Z).

### 5.2 Các luồng khác — P1/P2/P3/P4/T01/T2/T4/T56 đã đóng cờ; T7/T8 chưa có LIMITS lúc T9 đóng

- T01-196 ĐÃ đóng: #123 XÁC NHẬN 9 nguồn TƯƠI; O8 14:43:14–14:48:54Z; (m) #121/#122 KHÔNG CÓ ĐIỂM (CUỐI, T2-196); POSTBOOT_PASS #123 CÓ 14:41:58Z. T2-196 ĐÃ đóng: xem LIMITS T2 ((m) #121/#122 CUỐI KHÔNG CÓ ĐIỂM; (m) #123 RAW 0 requeue; n GIỮ 54/55; 0 vi phạm luồng khác). T4-196 ĐÃ đóng: #64 0/3 hợp lệ (xem §2.3). T56-196 ĐÃ đóng: POSTBOOT_PASS #123; watcher-196 START 14:41:56Z pid 7775 — **CHẾT theo reboot 16:28:18Z** (poll cuối 16:28:48Z guest-time; T9 quan sát độc lập — T56-196 đóng cờ trước reboot nên chưa ghi; watcher-197 PHẢI kiểm ps trước khi spawn). T7-196/T8-196: CHƯA CÓ LIMITS trong docs lúc T9 đóng (~16:53Z).
- **POSTBOOT_PASS #124 CHƯA CÓ** (T56-196 đã đóng cờ trước reboot 16:28:18Z; watcher-196 chết theo reboot; replay/watcher trên boot mới thuộc T56-197).

## 6. Sai số / caveat (F-196-T9-*)

- **F-196-T9-1 — T4-195 ĐẾM DÒNG LOG THAY VÌ ĐẾM SPIKE (phát hiện khi T9-196 đối chiếu lại).** T4-195 ghi "84 spike" trong cửa sổ attempt2 #63 (09:14:16–09:17:20Z); log `b2-spikes.log` T9-195 chỉ có **6 spike header** trong cửa sổ đó (09:14:52, 09:15:17, 09:15:22, 09:15:27, 09:15:32, 09:15:37Z — khớp mô tả cao nguyên 3,03→3,40 của T4). 84 = đúng số DÒNG log trong 6 khối spike (mỗi khối 14 dòng: 1 header + 12 ps + 1 loadavg). Số spike thật attempt2 = **6**, không phải 84. Không đổi verdict attempt2 (đã PAGE-WEDGED, không lấy) và không đổi B2 tổng đợt 195 (T10-195 dùng đúng 247 header). **T4-196 ĐÃ SỬA CÁCH ĐẾM:** W1/W2/W3 = 27/21/20 spike — T9-196 đếm header độc lập KHỚP TỪNG SỐ (27/21/20; đếm dòng sẽ ra 287/281/280). Bài học đứng: đối chiếu B2 LUÔN đếm header `^=== SPIKE`, không đếm dòng.
- **F-196-T9-2 — ENOSPC ĐẦU TIÊN TRÊN #123 CHẬM HẲN: boot+395s (14:36:51Z), lệch mẫu ~110s lần thứ ba liên tiếp (sau #119 +531s, #121 +871s).** Journal first entry 14:30:34Z (btime+18s) — không có dòng ENOSPC nào trong 6m35s đầu boot. Cả 5 dòng đầu đều từ `home-assistant-ensure.service` (thử add-watch định kỳ). Giải thích khả dĩ nhất: boot này ít tiến trình xin watch sớm (watch table đầy muộn hơn) — hoặc host-side watch accounting khác đi. T9 ghi nhận là lệch mẫu, không suy ra nguyên nhân chắc chắn. #124 về lại mẫu ~110s (dòng đầu boot+109s) nên lệch này chỉ xảy ra trên #123 (và #119/#121 trước đó).
- **F-196-T9-3 — REBOOT 16:28:18Z GIẾT CẢ PHIÊN T9 + DRIVER GỐC + LỆNH BÁO THỨC (lần thứ tư liên tiếp reboot cắt ngang phiên T9 — đợt 192, 193, 194, 196).** Boot #123 chết sau 7.082 s; boot #124 btime 16:28:18Z. Hệ quả trực tiếp: (a) lệnh báo thức sleep của agent (đang chờ tới 16:51Z) bị SIGTERM giữa chừng — không có output, không phải lỗi script; (b) cả 3 daemon T9 chết giữa chừng (sampler mẫu cuối #123 16:28:42Z guest-time, live 16:28:35Z, B2 watcher spike cuối #123 16:28:38Z); (c) driver gốc (chờ probe close 16:50Z) chết theo reboot — T9 viết driver close mới (`t9-196-close.sh`) và khởi động lại 3 daemon 16:29:56Z + probe tay 16:29:59Z (boot+101s, = 0 — TRỄ 9 s so với mốc cửa sổ, xem §1.2) + đóng sổ lần 2 thành công 16:50:00Z; (d) journal #123 mất hoàn toàn sau reboot — ENOSPC #123 chỉ còn 59 đếm trực tiếp (cận dưới, xem §4); (e) cửa sổ thoáng #124 trượt do phát hiện reboot chậm (báo thức bị giết — tiến trình phát hiện reboot phải là daemon/poll riêng, bài học từ F-194-T9-3 CHƯA được áp dụng triệt để: lần này T9 ĐÃ dùng driver setsid nhưng driver chỉ chờ probe close, không poll reboot). **T10/parent lưu ý:** mọi số T9 đợt này chia 2 boot; các chuỗi "toàn phiên" phải đọc theo từng boot, không gộp mù.
- **F-196-T9-4 — LỆCH ĐỒNG HỒ GUEST ~24–30s TRƯỚC REBOOT (phát hiện mới).** Mẫu sampler cuối #123 ghi 16:28:42Z + watcher-196 poll cuối ghi 16:28:48Z — cả hai SAU btime boot mới 16:28:18Z. Đồng hồ guest chạy nhanh dần (~0,25 s/phút, không NTP hiệu chỉnh): T01 đo đúng ±2 s lúc 14:40:27Z (Cloudflare), lệch ~24–30 s lúc 16:28Z; kernel mới đọc lại RTC nên offset về 0 (T9 kiểm 16:30:35Z: guest_epoch − uptime = btime đúng, offset 0; journal first entry 16:28:31Z = btime+13s). Hệ quả đo được: (i) gap sampler qua reboot tính bằng guest-time = 74 s, tính bằng true-time ~44–50 s (chênh lệch không ảnh hưởng kết luận nào khác); (ii) probe postboot 16:29:59Z (đồng hồ mới, offset 0) = boot+101s — kết luận trễ 9 s ĐỨNG; (iii) mọi timestamp guest-time trong khoảng 14:40–16:28Z có thể nhanh dần tới ~30 s — các cửa sổ attempt T4 (15:40–16:00Z) có thể lệch thực ~+10–20 s so với true-time, nhưng marker/done đều dùng cùng đồng hồ nên độ dài cửa sổ KHÔNG đổi. T9 ghi nhận là lệch mẫu đồng hồ, không suy ra nguyên nhân chắc chắn (cần kiểm NTP/chrony đợt sau).
- **F-196-T9-5 — BALLOON #123 XẢ SÂU NHẤT TỪ TRƯỚC TỚI NAY (min 110.812 kB).** Balloon mở phiên 1.403.516 kB (14:42:34Z) → 186.884 kB (14:43:34Z) → 110.812 kB (14:44:34Z, load1 11,50 lúc đó) rồi leo dần tới 5.642.192 kB lúc 16:28:42Z. Min các đợt trước: #119 2.764.932 kB; #121 1.897.564 kB. Boot mới thường bắt đầu thấp rồi leo dần; #123 bắt đầu thấp NHẤT và xả sâu nhất — host thu balloon mạnh ngay sau boot. Đây là boot thứ hai liên tiếp KHÔNG ghim (#121, #123) xen giữa các boot ghim (#120) — mẫu xen kẽ, chưa có quy luật. #124 leo nhanh ngay từ đầu (5,14M ở boot+98s, 4 mẫu ≥6M) nhưng cũng KHÔNG ghim — mẫu "leo nhanh nhưng không ghim" mới (khác #120 leo nhanh + ghim).
- **F-196-T9-6 — B2: `ps` 173/480 SPIKE (đảo ngược đợt 195: 1/247; gần đợt 194: 179/342).** `ps` 173 + `grep` 1 = 174 spike có process đứng đầu là lệnh shell ngắn (36% — đợt 195: 47/247 = 19%). Tải đợt này nặng hơn hẳn (480 spike; load1 đỉnh 12,42 so với 6,49; 15:xx 331 spike) nên watcher bắn dày, tự-bắt nhiều hơn. Phần còn lại (MainThread 124 + hatch 71 + WebKitWebProces 39 + chrome 31 + ffmpeg 28 + lẻ tẻ = 306) là tải thật. 124 spike `MainThread` (chưa xác định chắc là tiến trình nào — ghi theo comm, như đợt 192/193/194/195).
- **F-196-T9-7 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; không probe nào chạm cap 30.000; không đè lên cửa yên nào — probe mid-196 chạy 15:45:01Z, sau attempt-done attempt1 15:43:51Z 70 s, gate-check sạch; probe postboot/close chạy khi T4 đã đóng cờ); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG TRONG HẠN CỜ ~17:00Z (probe close 16:50:00Z).** Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: parent (p)-195 đã quyết F-195-P4-3 VI PHẠM NHẸ (chuỗi 0); đợt 196 có nối lên 1 hay không thuộc T10/parent (cần verdict của TẤT CẢ luồng — T2-196: 0 vi phạm bởi luồng khác).

- **Caveat đứng:** probe cap 30.000 (giá trị mở là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 824 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #123 từ cell vì journal cũ mất sau reboot (chỉ còn 59, cận dưới); T10 không đếm lại độc lập B2 đợt 196 (chỉ đọc log đóng băng); lượt yên #64 / live-check #15 / FULL PASS thuộc T4/T8/T10 + parent; số hiệu #124 + (m) #124 + POSTBOOT_PASS #124 thuộc T01-197/T2-197/T56-197 + parent; E-247 mở lại hay không thuộc parent (đã MỞ theo quyết (h)-193 — T9 chỉ báo dữ kiện: #121 0 CEIL (log 195), #122 không dữ kiện, #123 0 CEIL, #124 0 CEIL).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (128 mẫu, 14:42:34–16:49:56Z, hai boot #123/#124): `hidden_files/round196-t9/ram-sampler-FROZEN.log` — md5 `f57754499128c07fed38fbb4bf470708`. Log B2 đóng băng (480 spike): `hidden_files/round196-t9/b2-spikes-FROZEN.log` — md5 `1c3547e5f2bb48ab6a0cbf7dcac9d819`. Log headroom đóng băng (4 lần đo): `hidden_files/round196-t9/headroom-log-FROZEN.txt` — md5 `e0875f8a028a131faec1c6796f0de458`. Log live auto-trigger đóng băng (128 mẫu): `hidden_files/round196-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `4cbf1cb49b8d53e1e80c9703be934a7f`. Phân tích: `t9-196-analyze.py` (output `t9-196-analyze-output.txt`) + `t9-196-b2-analyze.py` (output `t9-196-b2-analyze-output.txt` — lưu ý: script b2 còn chứa cửa sổ mẫu cứng đợt 193 ở cuối output (n=0); các số theo cửa sổ T4-196 trong LIMITS này đếm TRỰC TIẾP từ log đóng băng bằng grep header-only). Baseline: `t9-196-baseline-notes.md`. Dữ kiện cuối đợt 195 (phân tích lại bởi T9-196): `t9-195-analyze-output-T9-196-rerun.txt` + `t9-195-b2-analyze-output-T9-196-rerun.txt` + bản nháp LIMITS `t9-196-limits-DRAFT.md`. Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). Driver close: `t9-196-close.sh` (output `close-driver.out`). T10 đọc log đóng băng trực tiếp khi cần.
