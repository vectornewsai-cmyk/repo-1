# LIMITS — Phase 9 đợt 193, T9: headroom MỞ LẦN ĐẦU kể từ đợt 185 (≥30.000 trong cửa sổ thoáng, bắt được) + balloon GHIM TRẦN episode mới trên boot #118 (13 mẫu CEIL, 2 sampler độc lập) + ENOSPC #117 96 + #118 25 (chuỗi đợt có lỗi thật 40 → 41) + auto-trigger live 129 mẫu 0 FIRE (tổng 481) + live-check #12 KHÔNG THỂ KIỂM

## 0. Tóm tắt

- **HEADROOM MỞ — LẦN ĐẦU TIÊN KỂ TỪ ĐỢT 185 (chuỗi "0 lần 51" ĐỨT).** Probe postboot-193 lúc 22:23:16Z (boot+81s, TRONG cửa sổ thoáng boot+61–92s) = **30.000 — CHẠM CAP PROBE, giá trị thật ≥30.000** (không đo được vì cap 30.000). **Cửa sổ thoáng QUAN SÁT ĐƯỢC LẦN ĐẦU TIÊN** (các đợt 189/191/192 đều trượt). 7 lần đo đợt này: 0, 0, 0, 0, **30.000**, 0, 0. Trần inotify **63.737 KHÔNG ĐỔI** (cả 7 lần đo, 2 boot).
- **BALLOON GHIM TRẦN — EPISODE MỚI TRÊN BOOT #118 (ứng viên).** **13 mẫu chính ở đúng trần 6.443.824 kB**, thành 2 đợt liên tiếp (8 mẫu 22:37:55–22:44:55Z + 5 mẫu 22:47:55–22:51:55Z, **VẪN GHIM lúc đóng**); live sampler độc lập bắt **cùng 13 mẫu, lệch 1 s** — không phải lỗi đọc. Balloon ≥6,0M: 19 mẫu trên #118. **E-247: CÓ episode ghim mới → MỞ LẠI (đề xuất parent quyết)** — kết cục KHÔNG XÁC ĐỊNH ĐƯỢC (quyết (h) §14.2-192) không còn đứng nguyên được nữa. Xem §2.2.
- **ENOSPC: #117 = 96 dòng đếm trực tiếp (CẬN DƯỚI, journal mất sau reboot; ngoại suy ~104 lúc reboot — GHI RÕ LÀ ƯỚC TÍNH) + #118 = 25 dòng lúc 22:51:47Z (vẫn tăng).** **Chuỗi đợt có lỗi thật 40 → 41.** Xem §4.
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 3.117.000 kB. **0 lần chạy birefnet — lần thứ 46 liên tiếp.**
- **Auto-trigger: LIVE 129 mẫu đợt này, tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **481 mẫu (97 đợt 189 + 125 đợt 191 + 130 đợt 192 + 129 đợt 193), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA (điểm yếu (b) đứng). Khoảng mù live: giữa đợt ~3h49m (16:53:26Z → 20:42:41Z) + 132 s do reboot (22:21:42Z → 22:23:54Z). Xem §3.
- **REBOOT GIỮA ĐỢT 22:21:55Z (F-193-T9-1):** #117 chết sau 7.158 s (1h59m18s); #118 sinh ra. Giết cả 4 daemon T9 + sleep nền của phiên (SIGTERM) — T9 phát hiện reboot 22:23:00Z, probe tay TRONG cửa sổ thoáng 22:23:16Z (boot+81s), khởi động lại 3 daemon 22:23:54Z. Gap đo: sampler 101 s (wall-clock), live 132 s, B2 ~3 phút.
- **RAM: 130 mẫu, 20:42:10–22:51:55Z, HAI boot (#117 n=101, #118 n=29).** Max **2.968.408 kB**; min **487.772 kB**; mean 1.247.974,8 kB; gate A **75/130**. Load1 <4,0: 122/130 mẫu chính (93,8%).
- **Lượt yên #61 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt** (attempt1 partial/wedged exit 2 + median 75,0 ms; attempt2 20/20 + B 5/5 nhưng median 61,0 ms > 60, thiếu 1,0 ms; attempt3 20/20 nhưng B1+B2 VI PHẠM + median 69,0 ms) — chuỗi lượt yên hợp lệ GIỮ 0. **Kiểm chứng live lần 12: KHÔNG THỂ KIỂM** (không có cửa sổ attempt hợp lệ nào để đối chiếu) — chuỗi live ĐẠT GIỮ 9 (đề xuất; tiền lệ đợt 188 + quyết (p)-192).
- **B2: 249 spike THẬT (tất cả trên #117; 0 spike trên #118)** — 2 spike trong attempt1, 0 spike trong attempt2, 24 spike trong attempt3 — KHỚP T4 từng số; load1 đỉnh watcher **9,44**. Xem §2.5.
- **0 VI PHẠM phía T9. T9 đóng 22:52:30Z (kill daemon), TRONG hạn cờ ~23:00Z.** Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–192 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Gate-check trong probe-loop.sh (bài học F-191-T10-2) vẫn chạy — không probe nào chạm cửa yên đợt này (xem §1.3).

### 1.2 Số đo đợt 193 (7 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 20:42:12Z | **0** | #117 1c0bcaad | 63.737 | probe-loop open-193 (boot+19m35s) |
| 21:12:13Z | **0** | #117 | 63.737 | probe-loop lan-2r (boot+49m36s) |
| 21:42:13Z | **0** | #117 | 63.737 | probe-loop lan-3r (boot+1h19m36s) |
| 22:12:14Z | **0** | #117 | 63.737 | probe-loop lan-4r (boot+1h49m37s) |
| **22:23:16Z** | **30.000 (cap)** | **#118 8a23277a** | 63.737 | **probe tay postboot-193 (boot+81s — TRONG cửa sổ thoáng)** |
| 22:30:13Z | **0** | #118 | 63.737 | probe tay mid-193 (boot+~8m18s) |
| 22:51:47Z | **0** | #118 | 63.737 | probe tay close-193 (boot+~30m) |

- **CỬA SỔ THOÁNG #117: KHÔNG QUAN SÁT ĐƯỢC.** Boot btime 20:22:37Z (T01-193 xác minh 9 nguồn tươi); cửa sổ boot+61–92s = 20:23:38–20:24:09Z đã đóng ~16 phút trước khi T9 mở phiên (~20:40Z). Như #115 đợt 192.
- **CỬA SỔ THOÁNG #118: QUAN SÁT ĐƯỢC — LẦN ĐẦU TIÊN.** Boot btime 22:21:55Z (/proc/stat btime 1795645315; uptime 2 lần đọc khớp — xem F-193-T9-2); cửa sổ = 22:22:56–22:23:27Z. T9 phát hiện reboot lúc 22:23:00Z (uptime 65 s) và probe tay lúc 22:23:16Z (**boot+81s, trong cửa sổ**) — **headroom = 30.000, chạm cap probe** (giá trị thật ≥30.000). Lần đầu tiên kể từ đợt 185 có một lần đo headroom khác 0, và là lần đầu tiên cửa sổ thoáng được quan sát trực tiếp thay vì suy từ ENOSPC.
- **Cửa sổ đóng nhanh:** ENOSPC đầu tiên trên #118 lúc 22:23:53Z (**boot+118s** — đúng mẫu ~110s); headroom đã về 0 lúc probe mid-193 22:30:13Z (boot+~8m18s). Khoảng mở thực tế nằm giữa +81s (mở, ≥30.000) và +118s (ENOSPC đầu tiên — watch đã đầy).
- **Headroom cuối phiên: 0.** Trần **KHÔNG ĐỔI trong đợt (63.737 cả 7 lần đo, 2 boot)**.
- **Probe-loop gốc chết theo reboot** (đã chạy open→lan-4r; lan-5r ~22:42Z không còn ý nghĩa sau khi đổi boot) — T9 KHÔNG khởi động lại probe-loop mà probe tay 3 lần trên boot mới (postboot + mid + close). Xem F-193-T9-1.

### 1.3 Chuỗi headroom dài hạn — ĐỨT

Giá trị đóng mỗi đợt gần nhất: 188 đóng 0 (6 lần 0); 189 đóng 0 (7 lần đo: 5 lần 0 + 1 lần 1 + 1 lần 2); 191 đóng 0 (6 lần đo: toàn 0); 192 đóng 0 (6 lần đo: toàn 0); **193 đóng 0 nhưng CÓ 1 lần đo 30.000 (chạm cap) trong phiên — chuỗi "6 lần đo toàn 0" ĐỨT, chuỗi "0 lần 51" ĐỨT ở lần đo thứ 5**. (Đợt 190 VOID — không có đo.)

- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (0)** — nhưng dữ kiện mới đổi bản chất theo dõi: headroom KHÔNG phải lúc nào cũng 0 — sau mỗi reboot có một cửa sổ thoáng ngắn (~1–2 phút) đo được trực tiếp lần đầu tiên. Quyết (l) §14.2-192 GIỮ "chỉ theo dõi" vẫn đứng cho giá trị đóng phiên; T9 đề xuất: **các đợt sau ưu tiên probe ngay khi phát hiện reboot** (như đợt này đã làm được).
- **Gate-check:** probe-loop.out TRỐNG (0 lần GATE-OPEN) — không probe nào phải chờ gate: lan-2r 21:12:13Z trước marker attempt1 21:14:40Z; lan-3r 21:42:13Z sau attempt-done attempt3 21:25:41Z; lan-4r 22:12:14Z sau khi poller T4 thoát 21:30Z; postboot/mid/close trên #118 sau khi T4 đã đóng cờ. 0 probe đè lên cửa yên đợt này.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 130 mẫu, 20:42:10–22:51:55Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 101 s** (reboot 22:21:55Z — xem §5.1; tính theo wall-clock giữa 2 mẫu; mẫu đầu boot mới 22:23:54Z = btime+119s); các gap còn lại **≤61 s** (jitter bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 20:42:10–21:04:11Z | #117 | 1.368.904–2.924.000 kB | Mở sampler; balloon 5,38M → 4,6–5,3M; **O8 T01 21:04:37–21:07:41Z** |
| 21:05:10–21:13:12Z | #117 | 1.100.000–2.968.408 kB | **O8 T01** (gate A 3/3, 30 spike B2); max phiên 2.968.408 kB 21:17:11Z |
| 21:14:12–21:25:12Z | #117 | 1.273.556–2.968.408 kB | **Attempt1/2/3 T4** (gate A 2/2 + 4/4 + 4/4 — xem §2.3); min phiên 487.772 kB 21:39:12Z (giai đoạn sau) |
| 21:26:12–22:21:13Z | #117 | 487.772–2.349.000 kB | **Harness T8 21:50:44–22:06:07Z 6/6** + O8 T8 22:08:14–22:11:07Z 3/3; **RAM <512.000 kB: 2 mẫu** (21:39:12Z + 22:21:13Z — 2 dải 1 mẫu); mẫu cuối #117 22:22:13Z (xem F-193-T9-2) |
| 22:21:55Z | — | — | **REBOOT → #118** (sampler chết; gap 101 s) |
| 22:23:54–22:51:55Z | #118 | 525.616–1.524.424 kB | Boot mới: balloon đã 5,22M từ mẫu đầu; ≥6,0M từ 22:33:55Z (19 mẫu); **GHIM TRẦN 13 mẫu** (22:37:55Z →, vẫn ghim lúc đóng — xem §2.2); gate A 8/29 |

- **Gate A ≥1024 MiB: 75/130 mẫu** (67/101 #117; 8/29 #118); **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **9,44** (#117 — trong O8/harness; #118: 2,12); load1 <4,0: **122/130 mẫu chính (93,8%)** — đợt 192 là 99/130 (76,2%), đợt này máy nhàn hơn hẳn trên #117; **RAM <512.000 kB: 2 mẫu** (1,5%); **RAM <300.000 kB: 0 mẫu**.
- Swap: #117 SwapFree 687.032 kB (mẫu đầu) → 587.356 kB (mẫu cuối) — giảm **99.676 kB**; #118 SwapFree 994.300 kB (mẫu đầu, boot tươi) → 668.312 kB (mẫu cuối) — giảm **325.988 kB chỉ trong 28 phút** (xả swap nhanh trên boot mới — như #116 đợt 192: −313.036 kB/29 phút; xem F-193-T9-5).
- Trũng RAM đợt này: min **487.772 kB (21:39:12Z, #117, balloon 5.153.460)** — nông hơn min 293.756 kB đợt 192. 2 mẫu <512.000 kB, 2 dải 1 mẫu: 21:39:12Z; 22:21:13Z.

**Bảng tổng hợp số RAM (từ script `t9-193-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 130 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #117 1c0bcaad | 101 | 487.772 | 2.968.408 | 1.376.516,1 | 67/101 | 0 | 9,44 | 2 |
| #118 8a23277a | 29 | 525.616 | 1.524.424 | 800.296,4 | 8/29 | 13 | 2,12 | 0 |
| **Toàn phiên** | **130** | **487.772** | **2.968.408** | **1.247.974,8** | **75/130** | **13/130 (10,0%)** | **9,44** | **2** |

- **Mean toàn phiên 1.247.974,8 kB — 2 cách độc lập: python `sum/n = 1.247.974,8` VÀ kiểm có trọng số của script (in `t9-193-analyze-output.txt`) — KHỚP CẢ HAI.** Mean thấp hơn đợt 192 (1.675.271,3 kB) vì #118 (29 mẫu) siết chặt suốt (mean chỉ 800.296,4 kB — balloon ghim trần).

### 2.2 Balloon virtio — GHIM TRẦN 13 MẪU TRÊN #118 (episode mới); #117 0 mẫu ghim

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — ĐƯỢC XÁC NHẬN LẠI** (13 mẫu đo đúng bằng trần này trên #118, cả 2 sampler độc lập).
- **Boot #117: GHIM 0/101 mẫu (0%) — KHÔNG CÓ episode nào. Boot #118: GHIM 13/29 mẫu (44,8%).**
- **Episode ghim #118 (mới — lần đầu tiên T9 bắt được balloon ghim trần):** balloon leo từ 22:33:55Z (6.115.396); **19 mẫu ≥6,0M** (22:33:55–22:51:55Z); **đợt ghim 1: 8 mẫu liên tiếp 22:37:55–22:44:55Z** (avail 527.248–585.916 kB, load1 0,01–0,47); hạ 2 mẫu (22:45:55Z 6.281.588; 22:46:55Z 6.380.480); **đợt ghim 2: 5 mẫu liên tiếp 22:47:55–22:51:55Z** (avail 525.616–558.644 kB, load1 0,08–0,28) — **VẪN GHIM lúc daemon bị kill 22:52:30Z** (mẫu cuối 22:51:55Z = trần). Tổng 13 mẫu CEIL trong 14 phút, 2 đợt ghim.
- **Xác minh độc lập 2 sampler:** live sampler bắt **cùng 13 mẫu CEIL** (22:37:54–22:44:54Z + 22:47:54–22:51:54Z, lệch đúng 1 s so với sampler chính — hai tiến trình lấy mẫu độc lập, cùng đọc `/proc/meminfo`) — loại trừ lỗi đọc/ghi của một sampler. Avail lúc ghim ~525–587 MB (không phải 0), load1 ~0,0–0,5 (máy NHÀN) — balloon ghim do host bơm, không phải do tải guest (xem F-193-T9-4).
- **Balloon = 0: 0 lần đợt này** (như đợt 192). Balloon min đợt này: 3.256.340 kB (21:17:11Z #117).
- **Sàn balloon 6.050.608 kB: 0 lần đợt này — CHUỖI GIỮ 11** (đợt 188: 1 lần, lần 11; đợt 189/191/192/193: 0 lần).
- **Giá trị sag 6.247.216 kB: 0 lần đợt này** (tổng giữ 3: đợt 187: 2 lần; đợt 188: 1 lần).
- **E-247 — CÓ EPISODE GHIM MỚI, MỞ LẠI (đề xuất parent quyết).** Kết cục KHÔNG XÁC ĐỊNH ĐƯỢC (quyết (h) §14.2-192) đứng nguyên với điều kiện "chỉ mở lại nếu có episode ghim mới" — nay điều kiện ĐÃ XẢY RA: 13 mẫu CEIL trên #118, 2 đợt ghim liên tiếp, vẫn ghim lúc đóng. T9 KHÔNG tự phán kết cục mới của E-247 (thuộc parent/T10); T9 chỉ báo episode + dữ kiện: episode bắt đầu 22:37:55Z (boot+16m00s), chưa kết thúc lúc đóng phiên (22:51:55Z, boot+30m00s); avail lúc ghim 525–587 MB; load1 ~0; 0 mẫu ≥ guard trong suốt episode nên auto-trigger 0 FIRE là đúng.

### 2.3 Lượt yên WebKit #61 (T4) — KHÔNG CÓ LƯỢT HỢP LỆ, 0/3 attempt (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#61 KHÔNG CÓ LƯỢT HỢP LỆ — T4 dùng hết 3/3 attempt, 0 hợp lệ.** Chuỗi lượt yên hợp lệ: **GIỮ 0** (đã ĐỨT ở #60, không có lượt hợp lệ mới).
- **Attempt1 (21:14:40–21:16:57Z): partial/wedged (exit 2, 7/20 pass) + lớp B ĐẠT 5/5 + tickCost median 75,0 ms — KHÔNG hợp lệ.** T9 đối chiếu độc lập: **2 spike B2** trong cửa sổ (21:15:09 load1 3,03; 21:15:25 load1 3,04 — KHỚP ĐÚNG số T4); sampler T9 trong cửa sổ n=2, gate A 2/2, load1 max 3,03.
- **Attempt2 (21:18:02–21:21:42Z): 20/20 + LỚP B ĐẠT 5/5 NHƯNG tickCost median 61,0 ms > 60 (thiếu 1,0 ms) — KHÔNG hợp lệ.** T9 đối chiếu: **0 spike B2** trong cửa sổ (KHỚP ĐÚNG số T4); sampler n=4, gate A 4/4, load1 max 1,00.
- **Attempt3 (21:22:04–21:25:41Z): 20/20 NHƯNG B1+B2 VI PHẠM (load1_max 5,67) + tickCost median 69,0 ms — KHÔNG hợp lệ.** T9 đối chiếu: **24 spike B2** trong cửa sổ (21:22:34–21:24:30Z, load1 3,22–5,67, đỉnh 5,67 lúc 21:23:40Z — KHỚP ĐÚNG số T4); sampler n=4, gate A 4/4, load1 max (cadence 60 s) 5,31.
- **Kiểm chứng live lần 12: KHÔNG THỂ KIỂM** (T9 đề xuất; parent quyết cuối — T4 đồng ý, F-193-T4-7) — không có cửa sổ attempt hợp lệ nào để đối chiếu 0-spike/0-FIRE; live autotrigger chạy suốt cả 3 cửa sổ attempt, 0 FIRE trong cả 3. **Chuỗi live ĐẠT GIỮ 9** (định nghĩa đứng quyết (p)-192: live-check CHỈ đối chiếu trên cửa sổ attempt HỢP LỆ).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 21:04:37–21:07:41Z | #117 | 0,95–4,20 (3 mẫu) | 1.100.000–2.300.000 kB — **gate A 3/3** | **O8 T01 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); **30 spike B2**; 0 mẫu ghim |
| T4 attempt1 21:14:40–21:16:57Z | #117 | 1,04–3,03 (2 mẫu) | 1.524.060–1.991.216 kB — **gate A 2/2** | **2 spike B2** (khớp T4); lớp B ĐẠT; 0 mẫu ghim |
| T4 attempt2 21:18:02–21:21:42Z | #117 | 0,39–1,09 (4 mẫu) | 1.972.208–2.396.672 kB — **gate A 4/4** | **0 spike B2**; median 61,0 ms > 60; 0 mẫu ghim |
| T4 attempt3 21:22:04–21:25:41Z | #117 | 2,88–5,67 (4 mẫu) | 1.273.556–1.831.732 kB — **gate A 4/4** | **24 spike B2** (khớp T4); B1+B2 vi phạm; 0 mẫu ghim |
| T8 O8 22:08:14–22:11:07Z | #117 | 0,40–0,90 (2 mẫu) | 1.400.000–1.600.000 kB — **gate A 2/2** | **0 spike B2**; O8 T8 PASS 3/3 |

- T01-193: **#117 XÁC NHẬN 9 nguồn TƯƠI** (btime 20:22:37Z, gap #116→#117 = 14.464 s); **#117 = ỨNG VIÊN** (parent quyết (e) ở aggregate 193); O8 PASS 3/3 trên #117; **POSTBOOT_PASS #117 CÓ 20:59:08Z** (repair-sớm-quyết-h, poll=1, CÓ caveat — GST 269 là thư mục THẬT, nhẹ hơn #115); **replay #117 KHÔNG CHẠY (dạng B)**; marker sống qua **69 reboot #49–#117** nếu #117 xác nhận; **(m) #117: 0 requeue** (T2-193 phán cuối); run 194/195 SUCCEEDED, run hiện tại (196) sched 20:35:51Z = btime +794 s.
- T8-193: **harness 6/6 trên #117** (21:50:44–22:06:07Z; WebKit 3/3 PASS + Chromium 3/3 PASS; live_diags=0; WATCHDOG-137 ×0); **84l10 PASS — chuỗi 0 → 1**; **86n2-P1 không kẹt: lần 15**; **O8 T8 3/3 trên #117** (22:08:14–22:11:07Z); **FULL PASS: KHÔNG THỂ — chuỗi GIỮ 0** (chân (b) gãy); **B1: 0 kẹt — chuỗi live sạch 0 → 1**; V4 bắt 3/3 kẹt mù, V2+V4 = 8/8, 0 FP trên 36 log sạch; số log sạch chuẩn 31 → 34. **Lưu ý đối chiếu (F-193-T9-3):** T8 LIMITS ghi "MỘT BOOT TRONG ĐỢT / 0 reboot trong phiên T8" nhưng LIMITS T8 mtime 22:28:02Z + .done 22:28:32Z — SAU reboot 22:21:55Z; T10/parent đối chiếu lại (xem §6).

### 2.5 B2 — 249 spike THẬT; 2/0/24 spike trong 3 attempt (khớp T4 từng số)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **249 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 249): tất cả trên #117, 0 trên #118** (load1 sau reboot ≤2,12, không chạm ngưỡng 3,0); **load1 đỉnh đợt (watcher, cadence 2 s): 9,44** (khớp load1 max sampler 9,44; đợt 192: 11,28).

| Nhóm (comm đứng đầu) | n | Ghi chú |
|---|---|---|
| chrome | 107 | Tải trình duyệt (O8/harness + luồng sản phẩm) |
| MainThread | 50 | comm `MainThread`, chưa xác định chắc là tiến trình nào (ghi theo comm) |
| grep | 25 | Lệnh shell ngắn (xem F-193-T9-6) |
| hatch | 25 | Tải nền tảng (cùng mẫu các đợt trước) |
| find | 14 | Lệnh shell ngắn (xem F-193-T9-6) |
| WebKitWebProces | 10 | Harness/O8 WebKit + attempt T4 |
| ffmpeg | 5 | Luồng sản phẩm (render/proxy) |
| bash | 3 | Lệnh shell ngắn |
| privsep-test-fu | 3 | Lẻ tẻ |
| python3 | 2 | Lẻ tẻ |
| dpkg | 2 | Repair POSTBOOT (apt-get update + install ~20:59Z) |
| npm | 2 | Lẻ tẻ |
| ps | 1 | Watcher tự bắt chính mình (xem F-193-T9-6) |

Tổng 107+50+25+25+14+10+5+3+3+2+2+2+1 = 249 — KHỚP. Phân theo giờ: 20:xx 97 spike; 21:xx 93 spike; 22:xx 59 spike. Spike đầu 20:42:10Z (load1 4,41 — ngay mẫu mở phiên); spike cuối 22:07:34Z (load1 3,20 — trước reboot).

- **2 spike trong attempt1** (21:14:40–21:16:57Z — load1max 3,04); **0 spike trong attempt2** (21:18:02–21:21:42Z); **24 spike trong attempt3** (21:22:04–21:25:41Z — load1max 5,67). **30 spike trong O8 T01** (21:04:37–21:07:41Z). **0 spike trong O8 T8** (22:08:14–22:11:07Z). Ngoài các cửa sổ trên: 193 spike.
- **Khoảng mù watcher: ~3 phút do reboot** (22:21:5x–22:23:5xZ — watcher chết theo reboot, 0 spike ghi trong gap vì KHÔNG CÓ watcher, không phải vì máy yên; xem F-193-T9-1). Ngoài gap đó watcher chạy liên tục, không reboot trong phiên đo của nó (trừ reboot 22:21:55Z).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-192; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 3.117.000 kB (live, #117); live log max 1.531.064 kB trên #118. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 46 liên tiếp (147–193).**
- **QUYẾT (o) §14.2-192: AUTO-TRIGGER GIỮ LIVE.** Parent kiểm độc lập lần thứ 119 (dedup python + kiểm chéo shell viết mới, KHỚP TỪNG SỐ; nguồn gốc §14.2-192 CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18). Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-193:** live đã bật từ đợt 189 nên đợt này là TIẾP TỤC, không flip mới — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 192 §14.2 (o) (99.871 B); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189/191/192; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 192 (test offline 17/17 PASS đợt 188, không chạy lại). Khởi động lần 1 BỊ TỪ CHỐI (thiếu env `T9_AUTOTRIGGER_LIVE=1` — xem F-193-T9-7); **khởi động lại 20:42:41Z (pid 4884, `dry_run=False guard=6291456 consec=2`)**; **khởi động LẠI 22:23:54Z (pid 3036) sau reboot** — cùng tham số, round_dir=autotrigger-live.
- **LIVE PHASE ĐỢT 193: 129 mẫu, 20:42:41–22:51:54Z (100 #117 + 29 #118), TẤT CẢ `trigger=watch consec=0`, max avail 3.117.000 kB (#117) / 1.531.064 kB (#118), load1 <4,0: 119/129 (92,2%) — #117 90/100, #118 29/29 — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `autotrigger-live/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Mẫu live đầu 20:42:41Z; live chạy suốt cả 3 cửa sổ attempt T4, 0 FIRE trong cả 3 (W1 3 mẫu, W2 4 mẫu, W3 3 mẫu — xem §2.3).
- **TỔNG LIVE TỪ 03:14Z 25/11: 481 mẫu (97 đợt 189 + 125 đợt 191 + 130 đợt 192 + 129 đợt 193), 0 FIRE.** Khoảng mù live: **(a) giữa đợt ~3h49m** (16:53:26Z → 20:42:41Z — live đợt 192 bị kill lúc T9-192 đóng sổ; không có mẫu live nào; cũng không thể có FIRE vì không có tiến trình live nào để fire); **(b) do reboot 132 s** (22:21:42Z → 22:23:54Z — live chết theo reboot, khởi động lại ngay khi T9 phát hiện). Trong cả hai khoảng mù, guard có mở hay không là KHÔNG BIẾT (không sampler nào chạy) — nhưng cũng không thể có FIRE (không có tiến trình live nào để fire; không có file trigger/flag nào trên đĩa từ các khoảng đó).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 481 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 46 đợt). **Lưu ý mới:** balloon GHIM TRẦN 13 mẫu NHƯNG avail lúc ghim chỉ 525–587 MB — guard đo bằng MemAvailable, không phải balloon; ghim balloon không mở guard. Auto-trigger 0 FIRE trong suốt episode ghim là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 192); không có thư mục `~/workspace/tmp-t9-193-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round193-t9/` (live chạy 129 mẫu, 0 sự kiện).

## 4. ENOSPC trong journal (đếm trực tiếp — #117 MẤT journal sau reboot; #118 vẫn tăng lúc đóng)

- **#117: đếm trực tiếp 96 dòng lúc 22:13:12Z (lần đếm cuối trước reboot) — CẬN DƯỚI** — dòng đầu **20:24:30Z (boot+113s)** — đúng mẫu ~110s các boot trước (#116: +106s; #115: +109s; #111: +117s; #110: +106s); dòng cuối lúc đếm **22:12:40Z**. Cả hai grep đều 96 lúc đó — KHỚP. **96 là CẬN DƯỚI** (journal mất sau reboot 22:21:55Z — `journalctl --list-boots` sau reboot chỉ còn boot #118; không đếm lại được #117). Ngoại suy theo nhịp đo được (~0,88 dòng/phút × ~9 phút từ 22:12:40Z tới reboot): **~104 dòng lúc reboot — GHI RÕ LÀ ƯỚC TÍNH, không phải số đếm** (phương pháp chuẩn điểm (5)).
- **Đếm giữa phiên #117 (bài học F-187-T9-5 — đếm ở MỖI lần kiểm):** 16 dòng lúc ~20:42Z → 42 lúc 21:11:25Z → 69 lúc 21:42:37Z → **96 lúc 22:13:12Z (VẪN TĂNG)**. Nhịp đều ~0,88 dòng/phút cả phiên — **KHÔNG dừng giữa boot** (như #114 đợt 191, #115 đợt 192).
- **#118: đếm trực tiếp 25 dòng lúc 22:51:47Z** — dòng đầu **22:23:53Z (boot+118s)** — về lại mẫu ~110s; dòng cuối **22:51:33Z**. Cả hai grep đều 25 — KHỚP. Vẫn tăng lúc đóng (6 lúc 22:30:13Z → 25 lúc 22:51:47Z). Nhịp ~0,9 dòng/phút, cùng nhịp #117.
- **Tổng phiên (2 boot, đếm trực tiếp): 96 + 25 = 121 dòng (96 là cận dưới).** **Chuỗi đợt có lỗi thật: 40 → 41** (cả 2 boot đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-193 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#117: 96=96; #118: 25=25 — KHỚP cả hai); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (#117 ~104 — ước tính, xem trên); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai boot trong phiên (T9 bắt trực tiếp: 1 reboot; 2 boot đợt này)

- **#117 (1c0bcaad-1f18-43b1-90f5-fc6319e63b29, btime 20:22:37Z; số hiệu ỨNG VIÊN — T01-193 XÁC MINH 9 nguồn TƯƠI; parent quyết (e) ở §14.2-193).** Sampler T9 trên #117: 20:42:10–22:22:13Z (101 mẫu). Gap #116→#117 = **14.464 s** (T01-193). #117 sống **7.158 s (1h59m18s)** rồi chết 22:21:55Z.
- **#118 (8a23277a-8f66-483b-b76b-be2cf157c2b1, btime 22:21:55Z; số hiệu ỨNG VIÊN — T01-193 đóng cờ TRƯỚC reboot nên chưa xác minh boot này; parent quyết (e)).** Sampler T9 trên #118: 22:23:54–22:51:55Z (29 mẫu). Gap #117→#118 = **7.158 s**. **(m) #118 thuộc T2-194** (T9 không phán). Marker sống qua **69 reboot #49–#117** nếu #117 xác nhận (T01-193); **70 nếu #118** (mtime không đổi — T9 không tự đếm marker, chỉ ghi nhận T01).
- **Khoảng mù giữa hai đợt: ~3h49m không sampler T9** (16:53:26Z → 20:42:10Z — chứa reboot #117 + cửa sổ thoáng #117 + toàn bộ khoảng mù live giữa đợt). **Khoảng mù trong phiên do reboot: 101 s sampler chính / 132 s live / ~3 phút B2 watcher** (22:21:42Z → 22:23:54Z).

### 5.2 Các luồng khác — P1/P2/P3/P4/T01/T2/T4/T56/T7/T8 đã đóng cờ

- T01-193 ĐÃ đóng: #117 XÁC NHẬN 9 nguồn TƯƠI; O8 PASS 3/3; (m) #117 0 requeue; POSTBOOT_PASS #117 CÓ 20:59:08Z. T2-193 ĐÃ đóng: xem LIMITS T2. T4-193 ĐÃ đóng: #61 0/3 hợp lệ (xem §2.3). T56-193 ĐÃ đóng: POSTBOOT_PASS #117; #118 CHƯA CÓ (đóng cờ trước reboot). T7-193 ĐÃ đóng (.done 22:53:19Z — sau reboot): kết cục run 196. T8-193 ĐÃ đóng (.done 22:28:32Z — sau reboot): xem §2.4 + F-193-T9-3.
- **POSTBOOT_PASS #118 CHƯA CÓ** (T56-193 đã đóng cờ trước reboot 22:21:55Z; watcher-193 chết theo reboot; replay/watcher trên boot mới thuộc T56-194; tổng boot không cờ 26 → 27 nếu #117 tính là có cờ — T56-193 ghi 26 → 27 do #116 không có cờ).

## 6. Sai số / caveat (F-193-T9-*)

- **F-193-T9-1 — REBOOT GIỮA ĐỢT 22:21:55Z GIẾT CẢ PHIÊN T9 (lần thứ hai liên tiếp reboot cắt ngang phiên T9 — đợt 192 cũng vậy).** Boot #117 chết sau 7.158 s; boot #118 btime 22:21:55Z. Hệ quả trực tiếp: (a) sleep nền của phiên T9 (đang chờ check-mid ~22:43Z) bị SIGTERM ~22:22Z — không có output, không phải lỗi script; (b) cả 4 daemon T9 chết giữa chừng (sampler mẫu cuối #117 22:22:13Z — xem F-193-T9-2, live 22:21:42Z, probe-loop đang chờ lan-5r, B2 watcher spike cuối #117 22:07:34Z); (c) T9 phát hiện reboot 22:23:00Z (uptime 65 s), probe tay TRONG cửa sổ thoáng 22:23:16Z (boot+81s, headroom ≥30.000), khởi động lại 3 daemon 22:23:54Z + probe tay mid/close — gap đo: sampler 101 s, live 132 s, B2 ~3 phút; (d) journal #117 mất hoàn toàn sau reboot — ENOSPC #117 chỉ còn 96 đếm trực tiếp (cận dưới, xem §4); (e) cửa sổ thoáng #118 bắt được nhờ phát hiện reboot trong 65 s và probe ngay — lần đầu tiên làm được. T9 KHÔNG khởi động lại probe-loop.sh mà probe tay 3 lần trên #118. **T10/parent lưu ý:** mọi số T9 đợt này chia 2 boot; các chuỗi "toàn phiên" phải đọc theo từng boot, không gộp mù.
- **F-193-T9-2 — BTIME #118: 2 NGUỒN KHỚP (22:21:55Z) NHƯNG MẪU SAMPLER CUỐI BOOT CŨ TIMESTAMP 22:22:13Z (btime+18s).** `/proc/stat` btime = 1795645315 (= 22:21:55Z); `/proc/uptime` 2 lần đọc độc lập (65,18 s lúc 22:23:00Z; 81,12 s lúc 22:23:16Z) đều cho btime 22:21:55Z. NHƯNG mẫu sampler chính cuối cùng mang boot_id cũ 1c0bcaad lại timestamp **22:22:13Z** (btime+18s) — một tiến trình không thể ghi sau reboot đã giết nó. Journal `--list-boots` sau reboot cũng chỉ còn boot mới với first entry **22:22:13Z** (= btime+18s; các boot trước first entry = btime+13s). Giải thích khả dĩ nhất: **đồng hồ wall-clock nhảy ~18 s lúc reboot** (host time sync). T9 ghi cả hai số + mâu thuẫn: btime dùng cho mọi phép tính cửa sổ là **22:21:55Z** (nguồn boot clock); gap sampler wall-clock 101 s, mẫu đầu boot mới = btime+119s. (m) #118 và số hiệu boot thuộc T2-194/T01-194 + parent.
- **F-193-T9-3 — T8-193 GHI "MỘT BOOT TRONG ĐỢT / 0 REBOOT TRONG PHIÊN T8" NHƯNG ĐÓNG CỜ SAU REBOOT (T9 phát hiện khi đối chiếu, không phán thay T8).** LIMITS T8 mtime 22:28:02Z, .done 22:28:32Z — SAU reboot 22:21:55Z 6–7 phút. Reboot rơi vào cửa sổ T8 tự ghi "22:11–22:40Z replay + extract + LIMITS + paths + cờ". Nếu phiên T8 không bị gián đoạn (session sống qua runtime restart như phiên T9), T8 có thể đã không kiểm lại boot_id lúc đóng. T10/parent đối chiếu: mọi verdict harness/O8/B2/V2 của T8 đều đo trên #117 TRƯỚC reboot (21:50–22:11Z) nên số đo không bị ảnh hưởng; chỉ câu "MỘT BOOT TRONG ĐỢT" là sai ở mức đợt (đợt 193 có 2 boot). T9 ghi nhận, không sửa LIMITS T8.
- **F-193-T9-4 — BALLOON GHIM TRẦN TRONG LÚC MÁY NHÀN (load1 ~0).** 13 mẫu CEIL trên #118 đều có load1 0,01–0,47, avail 525–587 MB; spike B2 0 trên #118; không attempt/harness nào chạy trên #118 trong lúc ghim (T4 xong 21:25Z, T8 xong 22:11Z — cả hai trên #117). Balloon ghim là hành vi host-side (host bơm balloon bất chấp guest nhàn), không phải do tải guest. Hệ quả đo được: avail guest bị ép xuống ~525 MB suốt 14 phút nhưng vẫn trên 0; guard (6.291.456 kB) không mở; live 0 FIRE là đúng. Theo dõi đợt 194 xem #118 (nếu còn sống) có ghim tiếp không, và ghim có kéo dài qua reboot không.
- **F-193-T9-5 — BOOT #118 XẢ SWAP NHANH + BALLOON LÊN NHANH (lặp lại mẫu #116 đợt 192).** Balloon đã 5.224.656 kB ở mẫu đầu (boot+119s), ≥6,0M từ 22:33:55Z (boot+12m00s), ghim trần từ 22:37:55Z (boot+16m00s); SwapFree −325.988 kB trong 28 phút (nhanh hơn #117: −99.676 kB trong 100 phút). So sánh: #117 balloon min 3.256.340 kB lúc 21:17:11Z (boot+54m34s) — boot mới thường bắt đầu thấp rồi leo dần; #118 bắt đầu đã cao (5,22M) và leo thẳng lên trần trong 16 phút. Đây là boot thứ hai liên tiếp có mẫu "lên nhanh" (#116 đợt 192 → #118 đợt 193); #117 ở giữa lại lên chậm — mẫu xen kẽ, chưa có quy luật.
- **F-193-T9-6 — B2: `ps` CHỈ 1/249 SPIKE (đảo ngược đợt 192: 185/512).** `ps` 1 + `find` 14 + `grep` 25 + `bash` 3 = 43 spike có process đứng đầu là lệnh shell ngắn (17% — đợt 192: 214/512 = 42%). Tải đợt này nhẹ hơn hẳn (249 spike so với 512; load1 đỉnh 9,44 so với 11,28; 0 spike trên #118) nên watcher bắn thưa hơn, tự-bắt ít hơn. Phần còn lại (chrome 107 + hatch 25 + MainThread 50 + WebKitWebProces 10 + ffmpeg 5 + lẻ tẻ = 206) là tải thật. 50 spike `MainThread` (chưa xác định chắc là tiến trình nào — ghi theo comm, như đợt 192).
- **F-193-T9-7 — LỖI KHỞI ĐỘNG LIVE LẦN ĐẦU (thiếu env, cổng hai lớp chặn đúng).** Lệnh khởi động live lần 1 (20:42:10Z) chỉ có `--live`, thiếu env `T9_AUTOTRIGGER_LIVE=1` → script từ chối (`LIVE refused`, exit 2). T9 phát hiện qua `ps` sau ~30 s và khởi động lại đúng (env + `--live`, round_dir=autotrigger-live) 20:42:41Z. Cổng hai lớp hoạt động đúng thiết kế (DESIGN §27). Hệ quả: live bắt đầu muộn 31 s so với sampler (mất ~1 mẫu đầu); không ảnh hưởng số đếm (129 mẫu live vs 130 mẫu chính — chênh đúng 1 mẫu mở phiên). Bài học: lệnh khởi động live PHẢI gồm cả env + `--live` trong cùng một lệnh (brief các đợt sau ghi rõ).
- **F-193-T9-8 — LỖI KILL DAEMON BẰNG `pkill -f` TỰ GIẾT PHIÊN EXEC.** Lệnh đóng phiên dùng `pkill -f "round193-t9/sampler.sh"` — pattern khớp luôn chính dòng lệnh exec đang chạy (chứa chuỗi đó) nên exec bị SIGTERM giữa chừng: sampler.sh đã chết nhưng b2watch + live còn sống, các lệnh `cp` freeze chưa chạy. T9 phát hiện qua `ps` sau đó, kill 2 daemon còn lại bằng PID (3035/3036), rồi freeze log thủ công — 0 mẫu mất (sampler chính dừng ở 130 dòng, live 129 dòng). Bài học: KHÔNG BAO GIỜ `pkill -f` bằng pattern xuất hiện trong chính dòng lệnh của mình — kill bằng PID đã ghi, hoặc pattern loại trừ chính mình.
- **F-193-T9-9 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; probe postboot-193 chạm cap 30.000 trong lúc máy nhàn, load1 2,04 lúc đó — không đè lên cửa yên nào vì T4 đã đóng cờ); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG TRONG HẠN CỜ ~23:00Z (kill daemon 22:52:30Z).** Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: parent (p)-192 đã tính lại từ 1; đợt 193 có nối lên 2 hay không thuộc T10/parent (cần verdict của TẤT CẢ luồng).

- **Caveat đứng:** probe cap 30.000 (giá trị mở là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 481 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #117 từ cell vì journal cũ mất sau reboot (chỉ còn 96, cận dưới); T10 không đếm lại độc lập B2 đợt 193 (chỉ đọc log đóng băng); lượt yên #61 / live-check #12 / FULL PASS thuộc T4/T8/T10 + parent; số hiệu #118 + (m) #118 + POSTBOOT_PASS #118 thuộc T01-194/T2-194/T56-194 + parent; E-247 mở lại hay không thuộc parent.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (130 mẫu, 20:42:10–22:51:55Z, hai boot #117/#118): `hidden_files/round193-t9/ram-sampler-FROZEN.log` — md5 `9bc43609b4b19c453d6961be0e86d3e1`. Log B2 đóng băng (249 spike): `hidden_files/round193-t9/b2-spikes-FROZEN.log` — md5 `4778f859e19bf4954fb01b02f98fba4c`. Log headroom đóng băng (7 lần đo): `hidden_files/round193-t9/headroom-log-FROZEN.txt` — md5 `90f692758a56cad33bf271b89af2cfb9`. Log live auto-trigger đóng băng (129 mẫu): `hidden_files/round193-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `836649caa07aa6df07b393cfbf8d5c54`. Phân tích: `t9-193-analyze.py` (output `t9-193-analyze-output.txt`) + `t9-193-b2-analyze.py` (output `t9-193-b2-analyze-output.txt` — lưu ý: script b2 còn chứa cửa sổ mẫu cứng đợt 192 ở cuối output; các số theo cửa sổ T4-193 trong LIMITS này đếm TRỰC TIẾP từ log đóng băng bằng awk). Baseline: `t9-193-baseline-notes.md`. Kiểm giữa phiên: `check-mid.sh` (4 lần hẹn, 3 lần chạy — lần 4 bị reboot giết). Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). T10 đọc log đóng băng trực tiếp khi cần.
