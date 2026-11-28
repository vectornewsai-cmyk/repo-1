# LIMITS — Phase 9 đợt 198, T9: headroom postboot #127 CHẠM CAP LẦN 2 LIÊN TIẾP (30.000) + REBOOT #127 00:34:26Z giữa đợt + E-247 VẪN MỞ (0 CEIL cả 2 sampler — #127 là boot không-pin thứ 1) + ENOSPC #126 75 (cận dưới) + #127 74 + auto-trigger live 119 mẫu 0 FIRE (tổng 1.094) + live-check #17 KHÔNG ĐẠT (xác nhận độc lập)

## 0. Tóm tắt

- **HEADROOM: 4 lần đo, 2 boot.** open 0 (#126, boot+1h27m48s) + **postboot 30.000 = CAP (#127, boot+78s — BẮT ĐƯỢC cửa sổ thoáng, lần thứ 2 liên tiếp chạm cap ở postboot sau #126 đợt 197)** + mid 0 (#127) + close 0 (#127, boot+1h25m52s). Trần inotify **63.737 KHÔNG ĐỔI**.
- **BALLOON — E-247 VẪN MỞ: 0 mẫu CEIL / 122 mẫu sampler chính (0/36 #126 + 0/86 #127) VÀ 0 / 119 mẫu live (0/33 #126 + 0/86 #127) — 2 sampler độc lập KHỚP TỪNG MẪU (0 CEIL cả hai).** #127 là boot KHÔNG-PIN thứ 1 liên tiếp (sau #126 có pin đợt 197) — điều kiện đóng (3 boot liên tiếp không pin) CHƯA ĐỦ → **GIỮ MỞ**.
- **Sàn 6.050.608 kB: 0 lần — tổng GIỮ 1** (chỉ 1 lần đợt 197). Sag 6.247.216 kB: 0 lần — tổng GIỮ 3. Balloon = 0: 0 lần.
- **ENOSPC: #126 = 75 dòng lúc 23:59:59Z (CẬN DƯỚI, journal mất sau reboot #127) + #127 = 74 dòng lúc 02:01:17Z (dòng đầu boot+111s — đúng mẫu ~110s). Chuỗi đợt có lỗi thật 44 → 45.**
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 3.169.696 kB (sampler chính) / 3.302.536 kB (live). **0 lần chạy birefnet — lần thứ 50 liên tiếp (147–198).**
- **Auto-trigger: LIVE 119 mẫu đợt này, tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **1.094 mẫu (975 tới hết đợt 197 + 119 đợt 198), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA.
- **REBOOT GIỮA ĐỢT 00:34:26Z:** #126 chết sau 7.305 s (2h01m45s); #127 sinh ra (6882f9a9, btime 00:34:26Z — T01-198 xác minh 9 nguồn tươi). Giết cả 3 daemon T9 + driver #1 + sleep-wake của agent (runtime restart, recovery 00:35:18Z) — T9 phát hiện reboot 00:35:18Z, probe tay + khởi động lại 3 daemon + driver 00:35:5xZ, probe postboot 00:35:44Z (boot+78s, = 30.000 CAP). Gap đo: sampler 62 s, live ~91 s, B2 ~61 s (guest-time, xem F-198-T9-8).
- **RAM: 122 mẫu, 23:59:51Z–02:00:58Z, HAI boot (#126 n=36, #127 n=86).** Max **3.169.696 kB**; min **339.212 kB** (#127, 01:36:57Z — chưa sâu bằng kỷ lục 253.436 kB đợt 197); mean 1.413.291,7 kB; gate A **84/122**. Load1 <4,0: 111/119 mẫu live (93,3%).
- **Lượt yên #66 (T4): CÓ LƯỢT HỢP LỆ (attempt2) — chuỗi 1 → 2. Kiểm chứng live lần 17: KHÔNG ĐẠT — T9 xác nhận độc lập (W2 4 mẫu watch/consec=0, 0 FIRE, max avail 1.396.348 kB < guard, NHƯNG 5 spike B2 trong W2 — đều tự-tải, probe chiếm 71–74% CPU) — chuỗi live ĐẠT 1 → 0.**
- **B2: 229 spike THẬT (#126: 177; #127: 52)** — W1 0 spike, W2 5 spike (khớp T4 từng số); load1 đỉnh watcher **7,7**.
- **0 VI PHẠM phía T9. T9 đóng ~02:10Z — QUÁ hạn cờ ~02:00Z nhưng TRONG hạn cứng 02:35:51Z** (reboot giữa đợt 00:34:26Z + runtime restart làm trễ đóng sổ; probe close vẫn chạy đúng 02:00:18Z nhờ driver). Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–197 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Probe-once.py bản 198 đã BỎ tự ghi file (chỉ print; driver redirect stdout) — sửa F-197-T9-5, log không còn dòng đúp. Cả 4 probe đều chạy ngoài mọi cửa sổ yên T4 (open 00:00:29Z trước khi poller T4 chạy 00:10:58Z; postboot 00:35:44Z trước khi poller khởi động lại 00:36:38Z; mid 01:00:16Z trước attempt1 01:01:29Z; close 02:00:18Z sau khi T4 đã đóng).

### 1.2 Số đo đợt 198 (4 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 00:00:29Z | **0** | #126 ba8ad21e | 63.737 | probe open-198 (boot+1h27m48s) |
| **00:35:44Z** | **30.000 = CAP** | **#127 6882f9a9** | 63.737 | **probe postboot-198 (boot+78s — TRONG cửa sổ 61–92s)** |
| 01:00:16Z | **0** | #127 | 63.737 | probe mid-198 (boot+25m50s; driver #2) |
| 02:00:18Z | **0** | #127 | 63.737 | probe close-198 (boot+1h25m52s; driver #2) |

- **CỬA SỔ THOÁNG #126: KHÔNG QUAN SÁT ĐƯỢC trong đợt 198.** Boot btime 22:32:41Z; cửa sổ boot+61–92s đã đóng ~1,5 giờ trước khi T9-198 mở phiên (~23:59Z). Đã được T9-197 đo = CAP 30.000 (xem (l)-197).
- **CỬA SỔ THOÁNG #127: BẮT ĐƯỢC — HEADROOM = 30.000 (CAP, CENSORED).** Boot btime 00:34:26Z (epoch 1795739666; T01-198 xác minh 9 nguồn tươi, xem F-198-T01-9); cửa sổ = 00:35:27–00:35:58Z. T9 phát hiện reboot lúc 00:35:18Z (uptime 0 phút) và probe tay chạy 00:35:44Z (**boot+78s, trong cửa sổ**) — **headroom = 30.000 = cap 30.000, tức chỉ biết ≥30.000 watch còn trống lúc đó**. Đây là lần thứ 2 liên tiếp một probe postboot chạm cap (#126 đợt 197 ở +81s, #127 đợt này ở +78s); các đợt 194/195/196 đều bắt được 0. Kết luận: cửa sổ thoáng sau reboot RỘNG và ỔN ĐỊNH (≥30.000 watch trống ở +78–81s trong 2 boot liên tiếp) — không đo được giá trị thật vì cap 30.000 (caveat đứng: giá trị mở là censored).
- **Headroom cuối phiên: 0** (close 02:00:18Z, #127 boot+1h25m52s — cửa sổ đã đóng từ lâu). Trần **KHÔNG ĐỔI trong đợt (63.737 cả 4 lần đo, 2 boot)**.
- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (0)** — nhưng dữ kiện 2 đợt liên tiếp củng cố: sau mỗi reboot có một cửa sổ thoáng ngắn (~1–2 phút) ĐỦ RỘNG để chạm cap ở +78–81s.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 122 mẫu, 23:59:51Z–02:00:58Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 62 s** (reboot 00:34:26Z — mẫu cuối #126 00:34:53Z guest-time → mẫu đầu #127 00:35:55Z; caveat lệch đồng hồ F-196-T9-4/F-197-T9-4 vẫn đứng); các gap còn lại **≤61 s** (jitter bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 23:59:51–00:34:53Z | #126 | 1.240.296–3.169.696 kB | Mở sampler; balloon 5,46M → 3,40M → 5,46M; **0 CEIL**; RAM <512k: 0 mẫu |
| 00:34:26Z | — | — | **REBOOT → #127** (sampler chết; gap 62 s) |
| 00:35:55–02:00:58Z | #127 | 339.212–2.421.996 kB | Boot mới: balloon đã 5,07M từ mẫu đầu; **0 CEIL**; RAM <512k: 7 mẫu |

- **Gate A ≥1024 MiB: 84/122 mẫu** (36/36 #126; 48/86 #127); **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **7,50** (#126 — lúc mở phiên, tải build song song; #127: 4,23); load1 <4,0: **111/119 mẫu live (93,3%)**; **RAM <512.000 kB: 7 mẫu** (cả 7 trên #127, thành 3 dải: 01:34:57–01:36:57Z n=3; 01:38:57–01:40:57Z n=3; 01:50:57Z n=1); **RAM <300.000 kB: 0 mẫu**.
- Swap: #126 SwapFree 697.976 kB (mẫu đầu) → 785.752 kB (mẫu cuối) — TĂNG 87.776 kB (ngược mẫu các đợt trước — swap được hồi lại trên #126 cuối đời); #127 SwapFree 1.016.052 kB (mẫu đầu, boot tươi) → 580.192 kB (mẫu cuối) — giảm **435.860 kB trong 85 phút** (xả swap nhanh trên boot mới — như #118/#120/#123/#124/#126 đợt 197).
- Trũng RAM đợt này: min **339.212 kB (01:36:57Z, #127, balloon 5.546.052)** — chưa sâu bằng kỷ lục 253.436 kB đợt 197. Live min 271.740 kB (cùng boot, khác giây) — cũng trên kỷ lục.

**Bảng tổng hợp số RAM (từ script `t9-198-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 122 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #126 ba8ad21e | 36 | 1.240.296 | 3.169.696 | 2.154.771,6 | 36/36 | 0 | 7,50 | 0 |
| #127 6882f9a9 | 86 | 339.212 | 2.421.996 | 1.102.904,8 | 48/86 | 0 | 4,23 | 7 |
| **Toàn phiên** | **122** | **339.212** | **3.169.696** | **1.413.291,7** | **84/122** | **0/122 (0%)** | **7,50** | **7** |

- **Mean toàn phiên 1.413.291,7 kB — 2 cách độc lập: python `sum/n = 1.413.291,7` VÀ kiểm có trọng số của script (in `t9-198-analyze-output.txt`) — KHỚP CẢ HAI.**

### 2.2 Balloon virtio — 0 CEIL CẢ 2 BOOT, CẢ 2 SAMPLER — E-247 VẪN MỞ (boot không-pin thứ 1)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB** (xác nhận đợt 194: 5 mẫu đúng bằng trần trên #120; đợt 197: 21 mẫu) — **đợt này 0 mẫu chạm trần nên KHÔNG xác nhận lại được** (balloon max đợt này 5.803.940 kB, dưới trần 639.884 kB).
- **Boot #126: GHIM 0/36 mẫu (sampler chính) + 0/33 mẫu (live).** Balloon #126 đợt 198 dao động 3.402.168–5.457.468 kB, không lần nào ≥6,0M. Lưu ý: #126 ĐÃ CÓ PIN đợt 197 (20 CEIL/41) — việc 0 CEIL trong 36 mẫu đợt 198 không đổi bản chất boot #126 là boot có pin; chuỗi boot không-pin KHÔNG tính #126.
- **Boot #127: GHIM 0/86 mẫu (sampler chính) + 0/86 mẫu (live).** Balloon #127 dao động 4.067.684–5.803.940 kB; ≥6,0M: 0 mẫu; gần trần nhất 5.803.940 kB (dưới trần 639.884 kB). Không có đợt ghim nào, không có mẫu đơn lẻ nào chạm trần.
- **E-247 — GIỮ MỞ.** Chuỗi boot: #120 ghim 5 mẫu (đợt 194) → #121 0 CEIL / 92 → #122 không dữ kiện → #123 0 CEIL / 107 → #124 0 CEIL / 21 → #125 1 CEIL / 112 → **#126 20 CEIL / 41 (đợt 197, 2 đợt ghim dài)** → **#127 0 CEIL / 86 (đợt này, 2 sampler khớp)**. Điều kiện đóng ở (h)-196/(h)-197 là pin vắng **3 boot liên tiếp** — #127 mới là boot không-pin thứ **1** liên tiếp. **CHƯA ĐỦ ĐIỀU KIỆN ĐÓNG — GIỮ MỞ, T9-199 theo dõi tiếp.** Nếu #128 + #129 cũng 0 CEIL thì đủ điều kiện đóng ở đợt 199.
- **Xác minh độc lập 2 sampler:** live sampler bắt **cùng 0 mẫu CEIL** trên cả 2 boot (live log 119 mẫu: #126 0 CEIL, #127 0 CEIL); live cũng bắt đúng **0 mẫu sàn** và **0 mẫu sag**. Hai tiến trình lấy mẫu độc lập, cùng đọc `/proc/meminfo`; balloon tại cùng timestamp KHỚP TỪNG SỐ (lệch ±1 s do thời điểm đọc khác nhau; ví dụ 02:00:56Z live vs 02:00:58Z chính: avail 861.968 vs 859.588 — cùng xu hướng, chênh do tải thay đổi trong 2 s).
- **Balloon = 0: 0 lần đợt này** (như đợt 192–197). Balloon min đợt này: 3.402.168 kB (#126, 00:22:52Z).
- **Sàn balloon 6.050.608 kB: 0 lần đợt này — tổng GIỮ 1** (chỉ 1 lần đợt 197, #126 22:56:13Z).
- **Giá trị sag 6.247.216 kB: 0 lần đợt này** (tổng giữ 3: đợt 187: 2 lần; đợt 188: 1 lần).

### 2.3 Lượt yên WebKit #66 (T4) — CÓ LƯỢT HỢP LỆ (attempt2) — chuỗi 1 → 2 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#66 CÓ LƯỢT HỢP LỆ — attempt2 hợp lệ (chuỗi lượt yên hợp lệ 1 → 2).** Attempt1: 13/20 PAGE-WEDGED sau pass 13, exit 2 — KHÔNG hợp lệ. Attempt2: 20/20 + lớp B ĐẠT 5/5 + tickCost median 55,0 ms — **LƯỢT HỢP LỆ**.
- **Kiểm chứng live lần 17: KHÔNG ĐẠT** (T9 xác nhận độc lập — xem §3.2). **Chuỗi live ĐẠT 1 → 0.**
- **Labellag (b): lượt hợp lệ #66 có 0 occurrence / 0 event (lag5) nên chuỗi 0 occ 0 → 1** (T4; quyết (m)-192: chỉ lượt hợp lệ mới tính).
- **FULL PASS: thuộc T8/T10 + parent** (chân O8 + harness — T9 không phán; T01-198 O8 trên #126 21/21 PASS theo T56-198 §1.2, O8 trên #127 thuộc T01-198).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 #126 ~00:12–00:16Z | #126 | ~0,9–2,5 (sampler) | 1,24–3,17 MB lúc mở | **O8 T01 21/21 PASS trên #126** (T56-198); 0 mẫu ghim |
| T4 attempt1 01:01:29–01:04:16Z | #127 | 0,42–1,25 (3 mẫu live) | 1.081.360–1.205.788 kB — **gate A 3/3** | **0 spike B2** (khớp T4); attempt1 PAGE-WEDGED 13/20, exit 2 |
| T4 attempt2 01:04:36–01:08:09Z | #127 | 0,86–3,00 (4 mẫu live) | 1.058.000–1.396.348 kB — **gate A 4/4** | **5 spike B2, đều tự-tải** (khớp T4); **LƯỢT HỢP LỆ**; 0 mẫu ghim |
| T8 kẹt #31? | — | — | — | T8-198 CHƯA đóng lúc T9 đóng — T9 không ghi số kẹt đợt này; thuộc T8-198/T10 |

- T01-198: **#126 XÁC NHẬN 9 nguồn TƯƠI** (survey 23:58:48Z; btime 22:32:41Z, gap #125→#126 = 7.493 s); **#127 XÁC NHẬN 9 nguồn TƯƠI** (survey 00:35:49Z; btime 00:34:26Z, gap #126→#127 = 7.305 s — F-198-T01-9); marker 75 → 78 nếu #126 xác nhận, 79 nếu #127 cũng xác nhận (parent quyết (e)-198).
- T2-198: **(m) #125 KHÔNG CÓ ĐIỂM (CUỐI); (m) #126 DƯƠNG (CUỐI, requeue eid 11445, btime +49,058 s)**; n ứng viên **55/56 → 56/57**; **(m) #127 RAW DƯƠNG** (requeue eid 11475, btime +42,661 s — phân loại CUỐI thuộc T2-199).
- T56-198: **POSTBOOT_PASS #126 ĐÃ CÓ 00:22:08Z + #127 ĐÃ CÓ 01:00:06Z** (cả hai repair-som-quyet-h, poll=1, GST symlink → debroot — T56 đề xuất caveat (b1) như #125); watcher-198 L2 ALIVE (pid 10882, START 00:38:46Z); **#126 KHÔNG GIẾT (1 → 2); #127 KHÔNG GIẾT (2 → 3)**; (A) 120/120 lần thứ 47; suite xanh 78 → 79; hướng (3) lần thứ 44.
- **(m) #127 + POSTBOOT_PASS #127 (caveat) + số hiệu #127 thuộc T2-199/T56-198/parent** — T9 chỉ ghi dữ kiện thô đã xác minh, không phán.

### 2.5 B2 — 229 spike THẬT (#126: 177; #127: 52); W1 0 / W2 5 spike (khớp T4 từng số)

Watcher cadence 2 s, ngưỡng load1 ≥ 3,0. **229 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 229): #126: 177, #127: 52** (phân theo timestamp, ranh giới là lúc watcher khởi động lại 00:35:55Z — KHÔNG phân theo btime 00:34:26Z vì đồng hồ guest chạy nhanh ~30 s cuối đời #126, xem F-198-T9-8: 6 spike mang timestamp guest 00:34:29–00:34:54Z vẫn thuộc #126); **load1 đỉnh đợt (watcher, cadence 2 s): 7,7** (khớp load1 max sampler 7,50 — watcher bắt đỉnh cao hơn do cadence 2 s; đợt 197: 8,29).

| Nhóm (comm đứng đầu, số thô) | n | Ghi chú |
|---|---|---|
| ps | 74 | **Artifact tự đo của watcher (xem F-198-T9-5)** — ps của chính watcher đứng đầu snapshot; không phải tải thật |
| MainThread | 34 | Tải trình duyệt/harness |
| bash | 30 | Lẻ tẻ (build song song) |
| chrome | 25 | Tải trình duyệt (O8/harness + luồng sản phẩm) |
| find | 17 | Lẻ tẻ (build/prune) |
| hatch | 14 | Tải nền tảng |
| WebKitWebProces | 10 | Harness/O8 WebKit + attempt T4 |
| ffmpeg | 7 | Luồng sản phẩm (render/proxy) |
| store | 5 | Lẻ tẻ |
| grep | 5 | Lẻ tẻ |
| python3 | 4 | Lẻ tẻ |
| dpkg | 3 | T56 repair (00:21–00:22Z #126, ~00:49–01:00Z #127) |
| privsep-test-fu | 1 | Lẻ tẻ |

Tổng thô 74+34+30+25+17+14+10+7+5+5+4+3+1 = 229 — KHỚP. **Bảng hiệu chỉnh (bỏ `ps`, lấy comm đứng sau nó):** MainThread 51, bash 37, find 31, chrome 25, WebKitWebProces 20, hatch 20, ffmpeg 12, grep 12, store 7, python3 5, dpkg 5, MiniBrowser 3, privsep-test-fu 1 — tổng 229 — KHỚP. Phân theo giờ: 00:xx 193 spike; 01:xx 36 spike. Spike đầu 00:04:52Z (load1 3,71); spike cuối 01:56:29Z.

- **0 spike trong attempt1** (01:01:29–01:04:16Z); **5 spike trong attempt2** (01:04:36–01:08:09Z: 01:05:32 load1 3,22; 01:05:37 3,04; 01:05:42 3,36; 01:05:47 3,17; 01:05:52 3,00 — đúng pass 12–15, bướu load1 theo T4). Cả 5 đều tự-tải: WebKitWebProces pid 168202 của chính probe (71,5–74,1% CPU) + MiniBrowser pid 168159 (~30%) đứng đầu; chỉ có `hatch` pid 706 (14,2%, runtime nền) ngoài ra. **KHỚP T4 từng số (timestamps + load1 + top process).**
- **Khoảng mù watcher: ~61 s do reboot** (00:34:54Z → 00:35:55Z guest-time — spike cuối #126 00:34:54Z, spike đầu #127 00:35:55Z; watcher chết theo reboot, 0 spike ghi trong gap vì KHÔNG CÓ watcher, không phải vì máy yên; xem F-198-T9-3/F-198-T9-8). Sau khi khởi động lại trên #127 (00:35:5xZ), watcher chạy liên tục tới lúc đóng với **52 spike** (load1 ≤4,23 — máy bận vừa phải sau reboot).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-197; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 3.169.696 kB (sampler chính, #126) / 3.302.536 kB (live, #126); live log max 2.423.976 kB trên #127. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 50 liên tiếp (147–198).**
- **QUYẾT (o) §14.2-197: AUTO-TRIGGER GIỮ LIVE.** Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-198:** live đã bật từ đợt 189 nên đợt này là TIẾP TỤC, không flip mới — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 197 §14.2 bản parent (37.953 B, 169 dòng, CHỈ CÓ MỘT §14.2 dòng 134 — xem F-198-T9-1); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189/191/192/193/194/195/196/197; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 197 (copy nguyên từ round197-t9). Khởi động lần 1 đúng ngay 23:59:5xZ (pid 119776, env + `--live`, round_dir=autotrigger-live) — **CHẠY SAI CWD nên log lồng `autotrigger-live/autotrigger-live/`** (xem F-198-T9-4); **khởi động LẠI 00:02:24Z (pid 120542) đúng cwd** — mất 2 mẫu live đầu; **khởi động LẠI 00:35:5xZ (pid 3196) sau reboot #127** — cùng tham số.
- **LIVE PHASE ĐỢT 198: 119 mẫu, 00:02:24–02:00:56Z (33 #126 + 86 #127), TẤT CẢ `trigger=watch consec=0`, max avail 3.302.536 kB (#126) / 2.423.976 kB (#127), load1 <4,0: 111/119 (93,3%) — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `autotrigger-live/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Mẫu live đầu 00:02:24Z; live chạy suốt cả 2 cửa sổ attempt T4, 0 FIRE trong cả 2.
- **TỔNG LIVE TỪ 03:14Z 25/11: 1.094 mẫu (975 tới hết đợt 197 + 119 đợt 198), 0 FIRE.** Khoảng mù live: **(a) giữa đợt ~48 phút** (23:14:13Z → 00:02:24Z — live 197 mẫu cuối → live 198 mẫu đầu); **(b) do reboot ~91 s** (00:34:24Z → 00:35:55Z — live chết theo reboot, khởi động lại ngay khi T9 phát hiện); **(c) đầu phiên ~2,5 phút** (23:59:51Z → 00:02:24Z — khởi động lại do sai cwd, xem F-198-T9-4). Trong các khoảng mù, guard có mở hay không là KHÔNG BIẾT (không sampler nào chạy) — nhưng cũng không thể có FIRE (không có tiến trình live nào để fire; không có file trigger/flag nào trên đĩa từ các khoảng đó).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 1.094 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 50 đợt). **Lưu ý mới:** balloon #127 leo tới 5,80M NHƯNG avail lúc đó chỉ 339–1.016 MB — guard đo bằng MemAvailable, không phải balloon; balloon cao không mở guard. Auto-trigger 0 FIRE trong suốt đợt là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 197); không có thư mục `~/workspace/tmp-t9-198-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round198-t9/` (live chạy 119 mẫu, 0 sự kiện).

### 3.2 Kiểm chứng live lần 17 (đợt 198) — T9 XÁC NHẬN ĐỘC LẬP: KHÔNG ĐẠT (đồng ý với T4)

- **LIVE-CHECK #17 (đợt 198): KHÔNG ĐẠT — T9-198 xác nhận độc lập từ log live + log B2 của mình, KHỚP T4 TỪNG SỐ.** Cửa sổ hợp lệ duy nhất W2 = attempt2 #66 (01:04:36–01:08:09Z): **4 mẫu live** trong W2 (01:04:55Z avail 1.396.348 / balloon 4.432.304 / load1 1,28; 01:05:55Z avail 1.058.000 / balloon 4.546.772 / load1 3,00; 01:06:55Z avail 1.373.360 / balloon 4.725.896 / load1 1,53; 01:07:55Z avail 1.304.748 / balloon 4.922.580 / load1 0,86) — tất cả `trigger=watch consec=0`, **0 FIRE** (đúng — không có kẹt trong W2 để bắt); max avail trong W2 1.396.348 kB < guard. **NHƯNG 5 spike B2 trong W2** (01:05:32/37/42/47/52Z, load1 3,22/3,04/3,36/3,17/3,00 — đếm trực tiếp từ `b2-spikes-FROZEN.log`, KHỚP T4 từng timestamp + load1 + top process) nên KHÔNG đủ điều kiện ĐẠT theo định nghĩa (p)-192 (0 spike B2 — tiền lệ #14/#16 ĐẠT đều 0 spike; tiền lệ #15: trigger 0 FIRE chỉ là dữ kiện). **Chuỗi live ĐẠT 1 → 0 — T9 ĐỒNG Ý với verdict T4.**
- W1 (không hợp lệ, PAGE-WEDGED) chỉ là dữ kiện: 3 mẫu watch/consec=0, 0 FIRE, 0 spike B2 (01:01:55–01:03:55Z, avail 1.081.360–1.205.788 kB).
- Toàn log live 198: 119 mẫu, 0 dòng trigger != watch consec=0.

## 4. ENOSPC trong journal (đếm trực tiếp — #126 MẤT journal sau reboot #127)

- **#126: đếm trực tiếp 75 dòng lúc 23:59:59Z (lần đếm cuối trước reboot) — CẬN DƯỚI** — dòng đầu **22:34:34Z (boot+113s)** — đúng mẫu ~110s (lệch mẫu thứ năm liên tiếp sau #119 +531s, #121 +871s, #123 +395s, #125 +527s; #120 +115s, #124 +109s, #127 +111s về mẫu — xem F-197-T9-2); dòng cuối lúc đếm **23:59:39Z**. Cả hai grep đều 75 lúc đó — KHỚP. **75 là CẬN DƯỚI** (journal mất sau reboot 00:34:26Z — `journalctl --list-boots` sau reboot chỉ còn boot #127; `-b -1` = 0 dòng; không đếm lại được #126).
- **Đếm giữa phiên #126 (bài học F-187-T9-5 — đếm ở MỖI lần kiểm):** 36 dòng lúc 23:15:00Z (T9-197 đóng) → 75 lúc 23:59:59Z → **mất journal sau reboot (không đếm tiếp được)**. Nhịp ~0,9 dòng/phút — **KHÔNG dừng giữa boot**.
- **#127: đếm trực tiếp 74 dòng lúc 02:01:17Z (lúc đóng)** — dòng đầu **00:36:17Z (boot+111s)** — đúng mẫu ~110s; dòng cuối **02:00:47Z**. Cả hai grep đều 74 — KHỚP. Đếm giữa phiên: 1 lúc 00:36:5xZ → 21 lúc 01:00:16Z → 73 lúc 02:00:18Z → **74 lúc 02:01:17Z**. Vẫn tăng lúc đóng. Nhịp ~0,9 dòng/phút, cùng nhịp #126.
- **Tổng phiên (2 boot, đếm trực tiếp): 75 + 74 = 149 dòng (75 là cận dưới).** **Chuỗi đợt có lỗi thật: 44 → 45** (cả 2 boot đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-198 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#126: 75=75; #127: 74=74 — KHỚP cả hai); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì KHÔNG ngoại suy đợt này (75 đã đủ lớn); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai boot trong phiên (T9 bắt trực tiếp: 1 reboot; 2 boot đợt này)

- **#126 (ba8ad21e-d1a1-489c-baa9-9e2dc52173f4, btime 22:32:41Z; số hiệu ỨNG VIÊN — T01-198 XÁC MINH 9 nguồn TƯƠI; parent quyết (e)-198).** Sampler T9 trên #126 đợt 198: 23:59:51–00:34:53Z (36 mẫu). Gap #125→#126 = **7.493 s** (T01-198/T9-197). #126 sống **7.305 s (2h01m45s)** rồi chết 00:34:26Z.
- **#127 (6882f9a9-59d0-41ea-bafc-1433b4f17e16, btime 00:34:26Z; số hiệu ỨNG VIÊN — T01-198 XÁC MINH 9 nguồn TƯƠI, F-198-T01-9; parent quyết (e)-198).** Sampler T9 trên #127: 00:35:55–02:00:58Z (86 mẫu). Gap #126→#127 = **7.305 s** (btime tới btime; lưu ý caveat lệch đồng hồ F-196-T9-4). **(m) #127 + POSTBOOT_PASS #127 (caveat) thuộc T2-199/T56-198 + parent** — T9 không phán.
- **Khoảng mù giữa hai đợt: ~45 phút không sampler T9** (23:14:13Z → 23:59:51Z 26/11 — live 197 mẫu cuối → sampler 198 mẫu đầu; chứa cửa sổ thoáng #126 đã được T9-197 đo). **Khoảng mù trong phiên do reboot: 62 s sampler chính / ~91 s live / ~61 s B2 watcher** (00:34:26Z → 00:35:55Z).

### 5.2 Các luồng khác — P1/P2/T01/T2/T4/T56/T7 đã đóng cờ lúc T9 đóng; P3/P4/T8 chưa đóng

- T01-198 ĐÃ đóng: #126/#127 XÁC NHẬN 9 nguồn TƯƠI; (m) #125 THÔ 0 + (m) #126 THÔ DƯƠNG; marker 75 → 78/79. T2-198 ĐÃ đóng: (m) #125 KHÔNG CÓ ĐIỂM (CUỐI), (m) #126 DƯƠNG (CUỐI), n 55/56 → 56/57; (m) #127 RAW DƯƠNG (T2-199). T4-198 ĐÃ đóng: #66 CÓ lượt hợp lệ; live-check #17 KHÔNG ĐẠT (T9 xác nhận §3.2). T56-198 ĐÃ đóng: POSTBOOT_PASS #126/#127 (repair, poll=1); watcher-198 L2 ALIVE; #126/#127 KHÔNG GIẾT (1 → 2, 2 → 3); (A) lần 47; suite 78 → 79; hướng (3) lần 44. T7-198 ĐÃ đóng (xem LIMITS T7 — run 205 thuộc T7/parent). P1-198 ĐÃ đóng: **sampleAt NaN sửa xong, đo thật 0 NaN/40 điểm** (F-197-P4-1 — đính chính (r)-196 của parent đã được thực hiện); hài 3 sửa xong. P2-198 ĐÃ đóng (xem LIMITS P2).
- **P3/P4/T8-198 CHƯA ĐÓNG lúc T9 đóng (~02:10Z)** — các điểm thuộc các luồng đó (N11b cửa sổ đầu, test N12a file 196, B1 trigger đồng hồ treo, kẹt #31?, FULL PASS) thuộc T10-198 + parent, T9 không phán.

## 6. Sai số / caveat (F-198-T9-*)

- **F-198-T9-1 — BRIEF GIAO VIỆC MÔ TẢ SAI TRẠNG THÁI AGGREGATE 197 (đã có T56 đính chính độc lập F-198-T56-8 — KHỚP).** Brief nói aggregate 197 có HAI mục §14.2, quyết parent thật ở dòng 160 ("lượt cron 06:35 +07") — trên đĩa CHỈ CÓ MỘT §14.2 (dòng 134, tiêu đề "lượt handoff 06:39 +07", 169 dòng, 37.953 B); block mạo danh "lượt cron 06:35" đã bị parent XÓA kèm ghi chú nguồn gốc dòng 136. Nội dung quyết (h)/(l)/(o)/(r) trong brief KHỚP quyết trên đĩa nên T9 làm theo brief + (k); (r) trên đĩa ghi "replay #124/#125" mâu thuẫn (k) ("replay #125/#126") — T9 theo (k) như T56. Bài học: brief đợt sau phải đối chiếu số dòng §14.2 trên đĩa trước khi ghi cứng.
- **F-198-T9-2 — DAEMON ĐỢT 197 VẪN CHẠY LÚC T9-198 MỞ PHIÊN (lần đầu ghi nhận).** Sampler pid 3010, b2watch pid 3023, live pid 3029 (đều start 22:34Z, T9-197) vẫn sống lúc 23:59:59Z — T9-197 đóng sổ ~23:20Z nhưng không dừng daemon. T9-198 KILL cả 3 lúc 00:00Z trước khi khởi động daemon mới (log 197 đã đóng băng; daemon cũ viết vào thư mục 197, không chạm log 198; 0 mẫu trùng). Bài học: T9 các đợt sau DỪNG daemon lúc đóng sổ (T9-198 đã dừng cả 3 lúc 02:01Z) và kiểm ps lúc mở phiên.
- **F-198-T9-3 — REBOOT #127 00:34:26Z GIẾT CẢ PHIÊN T9 + DRIVER #1 + LỆNH BÁO THỨC (lần thứ sáu liên tiếp reboot cắt ngang phiên T9 — đợt 192, 193, 194, 196, 197, 198).** Boot #126 chết sau 7.305 s; boot #127 btime 00:34:26Z. Hệ quả trực tiếp: (a) lệnh báo thức sleep của agent (đang chờ tới 01:05Z) bị cắt cùng runtime restart — recovery 00:35:18Z; (b) cả 3 daemon T9 chết giữa chừng (sampler mẫu cuối #126 00:34:53Z guest-time, live 00:34:24Z, B2 watcher spike cuối #126 00:34:54Z guest-time — xem F-198-T9-8); (c) driver gốc (chờ probe mid 01:00Z) chết theo reboot — T9 viết driver #2 (khởi động lại 00:35:55Z, cùng script `t9-198-driver.sh`) và khởi động lại 3 daemon 00:35:5xZ + probe tay postboot 00:35:44Z (boot+78s, = 30.000 CAP — BẮT ĐƯỢC cửa sổ, xem §1.2) + probe mid 01:00:16Z + probe close 02:00:18Z đều chạy đúng giờ; (d) journal #126 mất hoàn toàn sau reboot — ENOSPC #126 chỉ còn 75 đếm trực tiếp (cận dưới, xem §4). **T10/parent lưu ý:** mọi số T9 đợt này chia 2 boot; các chuỗi "toàn phiên" phải đọc theo từng boot, không gộp mù.
- **F-198-T9-4 — LIVE KHỞI ĐỘNG LẦN 1 SAI CWD, LOG LỒNG 2 CẤP (nhẹ, đã sửa ngay, mất 2 mẫu).** T9 chạy `sampler-autotrigger.py --round-dir autotrigger-live` từ BÊN TRONG thư mục `autotrigger-live/` nên log ghi vào `autotrigger-live/autotrigger-live/ram-sampler.log` (2 mẫu 23:59–00:01Z); phát hiện 00:01Z, kill + chạy lại đúng cwd 00:02:24Z (log đúng `autotrigger-live/ram-sampler.log`, 119 mẫu). Thư mục lồng đã xóa; 2 mẫu lạc không tính vào tổng live 119. Bài học: khởi động live LUÔN từ thư mục round, kiểm file log tồn tại đúng vị trí ngay sau khi start.
- **F-198-T9-5 — B2 WATCHER TỰ BẮT CHÍNH MÌNH BÙNG LẠI: `ps` ĐỨNG ĐẦU 74/229 SNAPSHOT (đợt 197: 1/149).** `ps -eo pid,comm,%cpu --sort=-%cpu` của chính watcher đứng đầu snapshot với %CPU 20–100% trong 74 spike — artifact đo: %CPU của tiến trình `ps` vừa khởi động tính trên thời gian sống rất ngắn nên vọt cao; càng nhiều tiến trình trên máy (đợt này 11 luồng build song song, 00:xx 193 spike) càng dễ đứng đầu. Quyết (n)-150 ("loại ps của chính watcher khỏi snapshot") KHÔNG có trong `b2watch.sh` bản sao từ đợt 197 — T9-197 chỉ ghi nhận 1 lần nên không lộ. Số liệu thật nằm ở comm đứng sau `ps` — bảng hiệu chỉnh §2.5 (MainThread 51, bash 37, find 31...) tổng 229 — KHỚP. Các verdict dùng spike (W1/W2, T4) KHÔNG bị ảnh hưởng (đếm theo timestamp, không theo comm). Giao T9-199: lọc `ps` khỏi snapshot lúc ghi (hoặc đếm comm sau `ps` làm chuẩn).
- **F-198-T9-6 — T4-198 §3 GHI NHÃN PID WATCHER CHƯA CHÍNH XÁC (nhẹ, không đổi số).** T4 ghi watcher "(pid 3194/3196, sống suốt phiên đo instance 2)" — thực tế instance 2: sampler pid 3192, b2watch pid 3194, live pid 3196 (khởi động lại 00:35:5xZ sau reboot). T4 gộp b2watch + live thành "watcher" — không đổi số đếm nào (W1/W2 + timestamps T4 ghi đều khớp log T9). T9 ghi nhận để tránh đính chính sai.
- **F-198-T9-8 — PHÂN BOOT CHO LOG B2 KHÔNG ĐƯỢC CẮT THEO BTIME (lệch đồng hồ guest ~30 s cuối đời #126).** Log B2 không ghi boot_id, chỉ timestamp guest. 6 spike mang timestamp 00:34:29–00:34:54Z (SAU btime #127 00:34:26Z) vẫn thuộc #126: đồng hồ guest chạy nhanh ~0,25 s/phút (F-196-T9-4/F-197-T9-4), tới cuối đời #126 đã nhanh ~30 s nên timestamp guest 00:34:54Z ≈ true ~00:34:24Z, trước reboot thật; watcher cũ chết theo reboot, watcher mới khởi động lại 00:35:55Z (spike đầu đúng 00:35:55Z). Phân đúng: **#126 = 177, #127 = 52** (không phải 171/58 nếu cắt mù theo btime). Sampler chính + live KHÔNG bị ảnh hưởng (mỗi mẫu ghi boot_id thật từ `/proc/sys/kernel/random/boot_id`). W1/W2 cũng không bị ảnh hưởng (cửa sổ T4 + timestamp spike cùng đồng hồ guest). Bài học: log B2 đợt sau ghi thêm boot_id vào mỗi spike như sampler.

- **F-198-T9-7 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; probe postboot chạm cap 30.000 nhưng chỉ tạo thư mục tạm rồi xóa ngay, không đè lên cửa yên nào — chạy 00:35:44Z, trước khi poller T4 khởi động lại 00:36:38Z; probe mid 01:00:16Z trước attempt1 01:01:29Z; probe close 02:00:18Z sau khi mọi luồng đo đã đóng); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG ~02:10Z — QUÁ hạn cờ ~02:00Z nhưng TRONG hạn cứng 02:35:51Z** (do reboot + runtime restart, xem F-198-T9-3). Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: parent (p)-197 đã quyết đợt 197 VI PHẠM (F-197-T2-1, chuỗi 1 → 0); đợt 198 có nối lên 1 hay không thuộc T10/parent (cần verdict của TẤT CẢ luồng).

- **Caveat đứng:** probe cap 30.000 (giá trị mở là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 1.094 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #126 từ cell vì journal cũ mất sau reboot (chỉ còn 75, cận dưới); script analyze RAM còn chứa cửa sổ mẫu cứng đợt 193 ở cuối output (n=0) — các số theo cửa sổ T4-198 trong LIMITS này đếm TRỰC TIẾP từ log đóng băng; script B2-analyze gán nhãn boot cứng theo đợt 197 (#125/#126) — số theo boot trong LIMITS này đếm TRỰC TIẾP từ log đóng băng (ranh giới lúc watcher khởi động lại 00:35:55Z); lượt yên #66 / live-check #17 / FULL PASS thuộc T4/T8/T10 + parent; số hiệu #127 + (m) #127 + POSTBOOT_PASS #127 (caveat) thuộc T01-198/T2-199/T56-198 + parent; E-247 GIỮ MỞ (T9 chỉ báo dữ kiện + đếm boot không-pin = 1).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (122 mẫu, 23:59:51Z–02:00:58Z, hai boot #126/#127): `hidden_files/round198-t9/ram-sampler-FROZEN.log` — md5 `ec6491beecb104c3cc6d227c72b5eead`. Log B2 đóng băng (229 spike): `hidden_files/round198-t9/b2-spikes-FROZEN.log` — md5 `31321690f45478f69cd9f3243f38e96c`. Log headroom đóng băng (4 lần đo): `hidden_files/round198-t9/headroom-log-FROZEN.txt` — md5 `c672efa591fbbc7be0d2cd5ee59a096f`. Log live auto-trigger đóng băng (119 mẫu): `hidden_files/round198-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `122256e6a20e94ccc2fc3b78961acb44`. Phân tích: `t9-198-analyze.py` (output `t9-198-analyze-output.txt`) + `t9-198-b2-analyze.py` (output `t9-198-b2-analyze-output.txt` — lưu ý: script analyze RAM còn chứa cửa sổ mẫu cứng đợt 193 ở cuối output (n=0); script B2-analyze gán nhãn boot cứng đợt 197; các số theo cửa sổ T4-198 + theo boot trong LIMITS này đếm TRỰC TIẾP từ log đóng băng bằng python). Baseline: `t9-198-baseline-notes.md` (gồm ghi chú reboot #127). Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). Driver: `t9-198-driver.sh` (driver #1 chết theo reboot #127; driver #2 khởi động lại 00:35:55Z, output `driver.out`). T10 đọc log đóng băng trực tiếp khi cần.
