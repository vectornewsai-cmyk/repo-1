# LIMITS — Phase 9 đợt 199, T9: headroom 0 CẢ 4 PROBE (2 boot) + REBOOT #129 06:38:56Z giữa đợt + E-247 VẪN MỞ (#129 GHIM TRỞ LẠI 10 CEIL — chuỗi không-pin 2 → 0) + ENOSPC #128 ≥8 (cận dưới) + #129 73 + auto-trigger live 133 mẫu 0 FIRE (tổng 1.227) + live-check #18 KHÔNG ĐẠT (xác nhận độc lập)

## 0. Tóm tắt

- **HEADROOM: 4 lần đo, 2 boot, TẤT CẢ 0.** open 0 (#128, boot+46m40s) + postboot 0 (#129, boot+98s — TRỄ ~6s so với cửa sổ 61–92s, cửa sổ KHÔNG quan sát được) + mid 0 (#129) + close 0 (#129). Trần inotify **63.737 KHÔNG ĐỔI**. Không có probe nào chạm cap đợt này (khác #126/#127 đều CAP ở +78–81s).
- **BALLOON — E-247 VẪN MỞ: #129 GHIM TRỞ LẠI.** #128: **0 CEIL / 54 mẫu sampler + 0 / 51 mẫu live** → boot không-pin thứ **2** liên tiếp (sau #127). #129: **10 CEIL / 82 + 10 / 82 live** — đợt ghim 07:50:15–08:01:15Z (2 đợt ghim n=2 + n=8, 2 mẫu cận-trần ở giữa) → **#129 LÀ BOOT CÓ PIN — chuỗi không-pin 2 → 0. GIỮ MỞ.**
- **Sàn 6.050.608 kB: 0 lần — tổng GIỮ 1. Sag 6.247.216 kB: 3 lần (#129) — tổng 3 → 6. Balloon = 0: 0 lần.**
- **ENOSPC: #128 ≥ 8 dòng (CẬN DƯỚI, journal mất sau reboot #129) + #129 = 73 dòng lúc 08:03:20Z (vẫn tăng lúc đóng). Chuỗi đợt có lỗi thật 45 → 46.**
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 3.546.176 kB (sampler chính) / 3.549.688 kB (live). **0 lần chạy birefnet — lần thứ 51 liên tiếp (147–199).**
- **Auto-trigger: LIVE 133 mẫu đợt này (51 #128 + 82 #129), tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **1.227 mẫu (1.094 tới hết đợt 198 + 133 đợt 199), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA.
- **REBOOT GIỮA ĐỢT 06:38:56Z:** #128 chết sau 5.826 s (1h37m06s); #129 sinh ra (e6e070b8, btime 06:38:56Z — ứng viên, POSTBOOT + survey thuộc T01-200/T56-200). Giết cả 4 daemon T9 (driver #1 chết theo) + sleep chờ của agent (runtime restart, recovery 06:39:57Z) — T9 phát hiện reboot 06:39:57Z, probe tay postboot 06:40:34Z (boot+98s, TRỄ cửa sổ — xem §1.2) + khởi động lại 4 daemon 06:41:13Z. Gap đo: sampler 138 s, live 141 s, B2 ~169 s (guest-time).
- **RAM: 136 mẫu, 05:45:50Z–08:02:15Z, HAI boot (#128 n=54, #129 n=82).** Max **3.546.176 kB**; min **344.356 kB** (#129, 07:51:15Z — trong đợt ghim CEIL, chưa sâu bằng kỷ lục 253.436 kB đợt 197); mean 1.461.737,2 kB; gate A **88/136**. Load1 <4,0: 123/133 mẫu live (92,5%).
- **Lượt yên #67 (T4): KHÔNG CÓ LƯỢT HỢP LỆ (0/3 attempt hợp lệ — cả 3 đều 20/20 nhưng lớp B vi phạm B1+B2) — chuỗi 2 → 0 (ĐỀ XUẤT — parent quyết cuối). Kiểm chứng live lần 18: KHÔNG ĐẠT — T9 xác nhận độc lập (0 cửa sổ hợp lệ; 13 mẫu live trong 3 cửa sổ đều watch/consec=0, 0 FIRE, max avail 3.304.076 kB < guard, NHƯNG 43/33/39 spike B2 — xem §3.2) — chuỗi live ĐẠT GIỮ 0.**
- **B2: 311 spike THẬT (#128: 272; #129: 39)** — W1 43 / W2 33 / W3 39 (khớp T4 từng số: đếm + load1 đỉnh 14,60/4,88/8,73); `ps` 0 lần đứng đầu (bộ lọc F-198-T9-5 HOẠT ĐỘNG); load1 đỉnh watcher **14,6** (@06:12:20Z, W1).
- **ĐÍNH CHÍNH (r)-198 (nhiệm vụ 5): (r) trên aggregate 198 ghi "replay #124/#125" là SAI — đúng là 'replay #125/#126 (KHÔNG replay #124 post-hoc)'** (mâu thuẫn (k)-198; T9-198 đã theo (k); T56-198 F-198-T56-8 khớp). Ghi đính chính rõ tại §6 (F-199-T9-9).
- **0 VI PHẠM phía T9. T9 đóng ~08:03Z — TRONG hạn cờ ~08:00Z + hạn cứng 08:35:51Z** (probe close chạy đúng 08:00:15Z nhờ driver #2; daemon dừng 08:02:40–08:03:08Z). Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–198 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Probe-once.py bản 199 copy nguyên từ 198 (chỉ print; driver redirect stdout).

### 1.2 Số đo đợt 199 (4 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 05:48:30Z | **0** | #128 773743f2 | 63.737 | probe open-199 (boot+46m40s) |
| **06:40:34Z** | **0** | **#129 e6e070b8** | 63.737 | **probe postboot-199 (boot+98s — TRỄ cửa sổ 61–92s ~6s)** |
| 07:00:14Z | **0** | #129 | 63.737 | probe mid-199 (boot+21m18s; driver #2) |
| 08:00:15Z | **0** | #129 | 63.737 | probe close-199 (boot+1h21m19s; driver #2) |

- **CỬA SỔ THOÁNG #128: KHÔNG QUAN SÁT ĐƯỢC trong đợt 199.** Boot btime 05:01:50Z; cửa sổ boot+61–92s (05:02:51–05:03:22Z) đã đóng ~40 phút trước khi T9-199 mở phiên (05:43Z). T01-199 xác minh #128 bằng 9 nguồn tươi (survey 05:43:35Z) nhưng không đo headroom postboot.
- **CỬA SỔ THOÁNG #129: KHÔNG QUAN SÁT ĐƯỢC — probe TRỄ ~6s.** Boot btime 06:38:56Z (epoch 1795761536; journal first entry 06:39:09Z); cửa sổ = 06:39:57–06:40:28Z. T9 phát hiện reboot lúc 06:39:57Z (uptime 1 phút — đúng GIÂY ĐẦU cửa sổ) nhưng probe tay chỉ chạy được 06:40:34Z (**boot+98s, trễ 6s sau khi cửa sổ đóng**) — **headroom = 0**. Không kết luận được cửa sổ có thoáng hay không (khác #126/#127 đều CAP 30.000 ở +78–81s); chỉ biết ở +98s đã = 0. Nguyên nhân trễ: sleep nền của agent bị SIGTERM theo runtime restart; T9 chỉ khôi phục được lúc 06:39:57Z và cần ~37 s để kiểm trạng thái + chạy probe (xem F-199-T9-3).
- **Headroom cuối phiên: 0** (close 08:00:15Z, #129 boot+1h21m19s). Trần **KHÔNG ĐỔI trong đợt (63.737 cả 4 lần đo, 2 boot)**.
- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (0)** — và đợt này KHÔNG có dữ kiện cửa sổ thoáng mới (cả 2 cửa sổ đều không quan sát được).

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 136 mẫu, 05:45:50Z–08:02:15Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 138 s** (reboot 06:38:56Z — mẫu cuối #128 06:38:55Z → mẫu đầu #129 06:41:13Z); các gap còn lại **≤61 s** (jitter bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 05:45:50–06:38:55Z | #128 | 1.040.328–3.546.176 kB | Mở sampler; balloon 2,03M → 5,58M; **0 CEIL**; RAM <512k: 0 mẫu |
| 06:38:56Z | — | — | **REBOOT → #129** (sampler chết; gap 138 s) |
| 06:41:13–08:02:15Z | #129 | 344.356–2.454.480 kB | Boot mới: balloon đã 5,26M từ mẫu đầu; **10 CEIL** (07:50–08:01Z); RAM <512k: 23 mẫu |

- **Gate A ≥1024 MiB: 88/136 mẫu** (53/54 #128; 35/82 #129); **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **12,21** (#128, 06:11:53Z — trong W1); load1 <4,0: **123/133 mẫu live (92,5%)**; **RAM <512.000 kB: 23 mẫu** (cả 23 trên #129, thành 4 dải — xem bảng phân tích); **RAM <300.000 kB: 0 mẫu**.
- Swap: #128 SwapFree 731.592 kB (mẫu đầu) → 719.792 kB (mẫu cuối) — giảm nhẹ 11.800 kB; #129 SwapFree 976.384 kB (mẫu đầu, boot tươi) → 562.228 kB (mẫu cuối) — giảm **414.156 kB trong 81 phút** (xả swap nhanh trên boot mới — như #118/#120/#123/#124/#126 đợt 197 và #127 đợt 198).
- Trũng RAM đợt này: min **344.356 kB (07:51:15Z, #129, balloon CEIL 6.443.824)** — chưa sâu bằng kỷ lục 253.436 kB đợt 197. Live min 344.176 kB (cùng phút, khác giây) — cũng trên kỷ lục.

**Bảng tổng hợp số RAM (từ script `t9-199-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 136 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #128 773743f2 | 54 | 1.040.328 | 3.546.176 | 2.188.333,6 | 53/54 | 0 | 12,21 | 0 |
| #129 e6e070b8 | 82 | 344.356 | 2.454.480 | 983.246,9 | 35/82 | 10 | 3,53 | 23 |
| **Toàn phiên** | **136** | **344.356** | **3.546.176** | **1.461.737,2** | **88/136** | **10/136 (7,4%)** | **12,21** | **23** |

- **Mean toàn phiên 1.461.737,2 kB — script in `t9-199-analyze-output.txt` (weighted mean check KHỚP).**

### 2.2 Balloon virtio — #128 0 CEIL (không-pin thứ 2) — #129 GHIM 10 MẪU (CÓ PIN) — E-247 VẪN MỞ, chuỗi 2 → 0

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB** (xác nhận đợt 194: 5 mẫu đúng bằng trần; đợt 197: 21 mẫu; đợt này: 10 mẫu #129 + 10 mẫu live — XÁC NHẬN LẠI).
- **Boot #128: GHIM 0/54 mẫu (sampler chính) + 0/51 mẫu (live).** Balloon #128 dao động 2.028.256–5.580.632 kB, không lần nào ≥6,0M. **#128 là boot KHÔNG-PIN thứ 2 liên tiếp** (sau #127 đợt 198: 0/86 + 0/86).
- **Boot #129: GHIM 10/82 mẫu (sampler chính) + 10/82 mẫu (live) — HAI SAMPLER KHỚP TỪNG MẪU.** Balloon #129 dao động 4.086.608–6.443.824 kB; ≥6,0M: 26 mẫu. Đợt ghim: leo dần 07:37:15Z 6.043.912 → 07:46:15Z 6.101.632 → 07:47: 6.171.568 → 07:48: 6.271.796 → 07:49: 6.363.244 → **07:50:15Z CEIL**; 2 đợt ghim liên tiếp: **07:50:15–07:51:15Z n=2** và **07:54:15–08:01:15Z n=8** (xen giữa 2 mẫu cận-trần 07:52:15Z 6.378.288 và 07:53:15Z 6.430.236 — dưới trần 65.536 / 13.588 kB); mẫu cuối 08:02:15Z tụt về sag 6.247.216. Avail trong đợt ghim chỉ 344–425 MB. **Đợt ghim xảy ra khi máy GẦN NHƯ YÊN (load1 0,02–0,62)** — ghim KHÔNG do tải guest (xem F-199-T9-7).
- **E-247 — GIỮ MỞ, CHUỖI KHÔNG-PIN 2 → 0.** Chuỗi boot: #120 ghim 5 mẫu (đợt 194) → #121 0 CEIL / 92 → #122 không dữ kiện → #123 0 CEIL / 107 → #124 0 CEIL / 21 → #125 1 CEIL / 112 → **#126 20 CEIL / 41 (đợt 197)** → **#127 0 CEIL / 86 (đợt 198)** → **#128 0 CEIL / 54 (đợt này)** → **#129 10 CEIL / 82 (đợt này)**. Điều kiện đóng (3 boot liên tiếp không pin) ĐÃ GẦN ĐỦ (2/3) rồi ĐỨT ở #129. **Chuỗi đếm lại từ 0 — T9-200 theo dõi tiếp từ #130.** Đây là lần đầu pin quay lại sau 2 boot sạch liên tiếp (#127 + #128).
- **Xác minh độc lập 2 sampler:** live sampler bắt **cùng 10 mẫu CEIL** trên #129 (và cùng 0 trên #128); live cũng bắt đúng **3 mẫu sag** và **23 mẫu <512k** trên #129 (sampler chính: 3 sag, 23 <512k — KHỚP). Balloon tại cùng timestamp KHỚP TỪNG SỐ (lệch ±1 s; ví dụ 08:01:15Z chính vs 08:01:14Z live: avail 356.404 vs 357.188 — cùng xu hướng).
- **Balloon = 0: 0 lần đợt này** (như đợt 192–198).
- **Sàn balloon 6.050.608 kB: 0 lần đợt này — tổng GIỮ 1** (chỉ 1 lần đợt 197, #126 22:56:13Z).
- **Giá trị sag 6.247.216 kB: 3 lần đợt này** (07:42:15Z, 07:45:15Z, 08:02:15Z — cả 3 trên #129, live khớp từng mẫu) — **tổng 3 → 6** (đợt 187: 2 lần; đợt 188: 1 lần; đợt 199: 3 lần).

### 2.3 Lượt yên WebKit #67 (T4) — KHÔNG CÓ LƯỢT HỢP LỆ (0/3) — chuỗi 2 → 0 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#67 KHÔNG CÓ LƯỢT HỢP LỆ — ngân sách 3/3 đã dùng, cả 3 attempt đều 20/20 NHƯNG lớp B vi phạm B1+B2** (attempt1: tickCost median 102,0 ms, B1 load5 cuối 5,77, B2 load1 max 14,60; attempt2: median 70,0 ms, B1 2,70 sát bar, B2 4,88 sát bar; attempt3: median 94,0 ms, B1 3,44, B2 8,73). **Chuỗi lượt yên hợp lệ 2 → 0 (ĐỀ XUẤT — parent quyết cuối).**
- **Kiểm chứng live lần 18: KHÔNG ĐẠT** (T9 xác nhận độc lập — xem §3.2). **Chuỗi live ĐẠT GIỮ 0.**
- **Labellag (b): 3 attempt đều 0 occurrence / 0 event (lag5) NHƯNG không attempt nào hợp lệ nên chuỗi 0 occ 1 → 0 (ĐỀ XUẤT)** (T4; quyết (m)-192: chỉ lượt hợp lệ mới tính).
- **FULL PASS: KHÔNG CÓ** (T8-199: O8 3/3 trên #128 nhưng harness 6/6 trên #129 — khác boot nên chân O8 không gộp được; chân lượt yên KHÔNG có) — **chuỗi GIỮ 0.**

### 2.4 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 #128 05:48:31–05:54:24Z | #128 | ~1,7–6,1 (sampler) | 1,19–3,55 MB lúc mở | **O8 T01 21/21 ×3 PASS trên #128** (cùng cây 477a0eac); 0 mẫu ghim |
| T4 W1 06:09:34–06:14:02Z | #128 | 1,69–12,21 (5 mẫu) | 1,19–3,30 MB — **gate A 5/5** | **43 spike B2** (khớp T4); attempt1 20/20 nhưng B vi phạm |
| T4 W2 06:25:52–06:29:36Z | #128 | 0,72–3,74 (4 mẫu) | 1,14–2,04 MB — **gate A 4/4** | **33 spike B2** (khớp T4); attempt2 20/20 nhưng B vi phạm |
| T4 W3 06:34:10–06:38:20Z | #128 | 2,64–6,79 (4 mẫu) | 1,04–2,35 MB — **gate A 3/4** | **39 spike B2** (khớp T4); attempt3 20/20 nhưng B vi phạm |
| T8 harness #129 07:16:26–07:32:00Z | #129 | 0,50–2,88 (15 mẫu) | 0,50–1,73 MB — gate A 5/15 | **Harness 6/6 PASS** (84l10/85m4/86n2 × WebKit+Chromium); 0 mẫu ghim trong cửa sổ harness (ghim bắt đầu 07:50Z, SAU harness) |

- T01-199: **#128 XÁC NHẬN 9 nguồn TƯƠI** (survey 05:43:35Z; btime 05:01:50Z, gap #127→#128 = 16.044 s); **#129 là ứng viên mới — POSTBOOT #129 + survey thuộc T01-200/T56-200** (T01-199 đã đóng; T4 F-199-T4-8). Marker 79 **ĐÃ XÁC MINH** qua #127 (T56-199); **80 nếu #128 xác nhận** (parent quyết (e)-199).
- T2-199: **(m) #127 DƯƠNG (CUỐI); n ứng viên 56/57 → 57/58; (m) #128 THÔ 0** (phân loại CUỐI thuộc T2-200).
- T56-199: **POSTBOOT_PASS #128 CÓ 05:51:25Z** (poll=0, replay-đầy-đủ — khác #125/#126/#127 poll=1 repair); **POSTBOOT_PASS #129 CÓ 07:08:07Z** (poll=1, repair-som-quyet-h, dpkg 777); (A) 120/120 lần thứ 48; suite 9/9 × 6 (chuỗi 79 → 80); watcher-199 L2 pid 7194 (END 08:35:51Z).
- T7-199: **lặng mới S8 dài 8.407 s — DÀI NHẤT từ trước tới nay** (03:15:34Z → 05:35:40Z, 5 slot mất, reboot #128 bên trong, hồi phục đúng chữ ký S7; đề xuất OUTAGE #7); run 205 TIMEOUT nhưng KHÔNG phải CA (cf 14 s); **run 206 SUCCEEDED → CA MỚI #28, họ CA 27 → 28**; chuỗi SUCCEEDED 0 → 1; **cửa slot 199 KHÔNG LÀNH** (HB 9/12, DR 4/6) — chuỗi lành 1 → 0 (đề xuất); run 207 (lượt này) RUNNING, viết lại ×1 tại reboot 06:38:56Z ((m) THÔ 1, btime+40,934 s — thuộc T2-200); tổng lặng 27/11 = 8.407 s.
- T8-199: **harness 6/6 trên #129** (07:16:26–07:32:00Z); **84l10 PASS — chuỗi 0 → 1**; **86n2-P1 dữ kiện mới — chuỗi 19 → 20**; V2+V4+V5 = 11/11 kẹt, 0 FP trên 47 log sạch; V5 live 0 trigger.

### 2.5 B2 — 311 spike THẬT (#128: 272; #129: 39); W1 43 / W2 33 / W3 39 (khớp T4 từng số); `ps` 0 lần

Watcher cadence 2 s, ngưỡng load1 ≥ 3,0. **311 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 311): #128: 272, #129: 39** (phân theo header `boot=` — xem F-199-T9-6; KHÔNG cắt theo btime). **load1 đỉnh đợt (watcher, cadence 2 s): 14,6** (@06:12:20Z, W1 — khớp load1 max sampler T4 14,60 cả 3 cửa sổ).

| Nhóm (top comm, đã lọc `ps`) | n | Ghi chú |
|---|---|---|
| hatch | 70 | Tải nền tảng (runtime) |
| WebKitWebProces | 56 | Harness/O8 WebKit + attempt T4 (pid 68866 W1, 91744 W2, 96719 W3) |
| chrome | 52 | P1 Chrome headless (W1: 3 renderer ~74% — xem F-199-T4-4) |
| MainThread | 48 | Process node (tsc/test/vite P3 — xem F-199-T4-9: comm MainThread = process node, không phải process lạ) |
| find | 28 | Lẻ tẻ (build/prune) |
| ffmpeg | 19 | Luồng sản phẩm (render/proxy) |
| python3 | 15 | Lẻ tẻ |
| apt-get | 13 | Replay hệ thống (đầu boot #128) + dpkg |
| privsep-test-fu | 4 | Lẻ tẻ |
| npm | 3 | Lẻ tẻ |
| dpkg-deb / ffprobe / esbuild | 1 + 1 + 1 | Lẻ tẻ |

Tổng 70+56+52+48+28+19+15+13+4+3+1+1+1 = 311 — KHỚP. **`ps`: 0 lần đứng đầu** (bộ lọc F-198-T9-5 HOẠT ĐỘNG — đợt 198: 74/229; đợt này 0/311 — xem F-199-T9-5). Phân theo giờ: 05:xx 101 spike; 06:xx 191 spike; 07:xx 19 spike. Spike đầu 05:46:53Z (load1 5,26, top apt-get); spike cuối 07:22:44Z — **sau 07:22:44Z không còn spike nào tới lúc đóng** (máy yên dần, load1 0,02–0,85).

- **W1 (06:09:34–06:14:02Z): 43 spike, load1 max 14,60 @06:12:20Z** (đỉnh tăng đơn điệu 3,51 → 14,60 rồi giảm — khớp T4 từng timestamp + load1 + top process; top-3 comm: WebKitWebProces 22, chrome 11, hatch 8).
- **W2 (06:25:52–06:29:36Z): 33 spike, load1 max 4,88 @06:27:30Z** (khớp T4; top-3: hatch 14, WebKitWebProces 10, MainThread 9 — W2 chủ yếu ngoại-tải node, xem F-199-T4-5).
- **W3 (06:34:10–06:38:20Z): 39 spike, load1 max 8,73** (khớp T4; top-3: WebKitWebProces 16, hatch 16, MainThread 5).
- **Khoảng mù watcher do reboot: ~169 s (guest-time)** — spike cuối #128 06:39:18Z (load1 3,74 — header `boot=773743f2` dù timestamp guest đã sau btime #129 06:38:56Z, xem F-199-T9-6) → spike đầu #129 06:42:07Z (load1 3,32). Watcher chết theo reboot, 0 spike ghi trong gap vì KHÔNG CÓ watcher, không phải vì máy yên. Sau khi khởi động lại trên #129 (06:41:13Z), watcher chạy liên tục tới lúc đóng với **39 spike** (load1 ≤3,53 — máy yên dần sau reboot).
- **B2 dữ kiện thứ 13** cho quyết tách (T4 F-199-T4-5): W1 43 / W2 33 / W3 39. T9 chỉ báo số, KHÔNG tự quyết tách (luật B2 KHÔNG TÁCH vẫn đứng cho tới khi parent quyết).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-197; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 3.546.176 kB (sampler chính, #128) / 3.549.688 kB (live, #128); live log max 2.454.132 kB trên #129. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 51 liên tiếp (147–199).**
- **QUYẾT (o) §14.2-197: AUTO-TRIGGER GIỮ LIVE.** Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-199:** live TIẾP TỤC từ đợt 189 (không flip mới) — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 198 §14.2 bản parent (68.365 B — NGUỒN QUYẾT DUY NHẤT; file `hidden_files/round198-parent-decisions.md` là GIẢ, không dùng); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189..198; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 198 (copy nguyên từ round198-t9). Khởi động lần 1 chết "LIVE refused: T9_AUTOTRIGGER_LIVE=1 not set" (xem F-199-T9-2); **khởi động LẠI 05:48:52Z (pid 33593) với env đúng** — mất ~3 phút live đầu phiên; **khởi động LẠI 06:41:13Z (pid 3327) sau reboot #129** — cùng tham số.
- **LIVE PHASE ĐỢT 199: 133 mẫu, 05:48:52–08:02:14Z (51 #128 + 82 #129), TẤT CẢ `trigger=watch consec=0`, max avail 3.549.688 kB (#128) / 2.454.132 kB (#129), load1 <4,0: 123/133 (92,5%) — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `autotrigger-live/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Live chạy suốt cả 3 cửa sổ attempt T4, 0 FIRE trong cả 3.
- **TỔNG LIVE TỪ 03:14Z 25/11: 1.227 mẫu (1.094 tới hết đợt 198 + 133 đợt 199), 0 FIRE.** Khoảng mù live: **(a) đầu phiên ~3 phút** (05:45:50Z → 05:48:52Z — khởi động lại do thiếu env, xem F-199-T9-2); **(b) do reboot ~141 s** (06:38:52Z → 06:41:13Z — live chết theo reboot, khởi động lại ngay khi T9 phát hiện). Trong các khoảng mù, guard có mở hay không là KHÔNG BIẾT (không sampler nào chạy) — nhưng cũng không thể có FIRE (không có tiến trình live nào để fire; không có file trigger/flag nào trên đĩa từ các khoảng đó).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 1.227 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 51 đợt). **Lưu ý mới:** balloon #129 leo tới CEIL 6,44M NHƯNG avail lúc đó chỉ 344–425 MB — guard đo bằng MemAvailable, không phải balloon; balloon cao không mở guard. Auto-trigger 0 FIRE trong suốt đợt là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 198); không có thư mục `~/workspace/tmp-t9-199-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round199-t9/` (live chạy 133 mẫu, 0 sự kiện).

### 3.2 Kiểm chứng live lần 18 (đợt 199) — T9 XÁC NHẬN ĐỘC LẬP: KHÔNG ĐẠT (đồng ý với T4)

- **LIVE-CHECK #18 (đợt 199): KHÔNG ĐẠT — T9-199 xác nhận độc lập từ log live + log B2 của mình, KHỚP T4 TỪNG SỐ.** Không có cửa sổ hợp lệ nào (0/3 attempt hợp lệ — cả 3 đều nhiễm tải B1+B2). 13 mẫu live trong 3 cửa sổ (W1 5 mẫu 06:09:52–06:13:52Z avail 1.173.444–3.304.076 kB load1 1,69–12,21; W2 4 mẫu 06:25:52–06:28:52Z avail 1.173.184–2.067.984 kB load1 0,72–3,74 — gồm 1 mẫu biên 06:25:52Z cùng giây với marker, T4 không dùng verdict, T9 ghi nhận; W3 4 mẫu 06:34:52–06:37:52Z avail 1.163.924–2.346.848 kB load1 2,64–6,79) — tất cả `trigger=watch consec=0`, **0 FIRE** (đúng — không có kẹt trong các cửa sổ để bắt); max avail trong các cửa sổ 3.304.076 kB < guard. **NHƯNG 43/33/39 spike B2 trong W1/W2/W3** (đếm trực tiếp từ `b2-spikes-FROZEN.log`, KHỚP T4 từng số đếm + load1 đỉnh) nên KHÔNG đủ điều kiện ĐẠT theo định nghĩa (p)-192 (0 spike B2 — tiền lệ #14/#16 ĐẠT đều 0 spike; tiền lệ #15: trigger 0 FIRE chỉ là dữ kiện). **Chuỗi live ĐẠT GIỮ 0 — T9 ĐỒNG Ý với verdict T4.**
- Toàn log live 199: 133 mẫu, 0 dòng trigger != watch consec=0.

## 4. ENOSPC trong journal (đếm trực tiếp — #128 MẤT journal sau reboot #129)

- **#128: đếm trực tiếp ≥8 dòng lúc 05:45:05Z (lần đếm cuối trước reboot) — CẬN DƯỚI** — dòng đầu **05:36:36Z (boot+2.086s)** — PHÁ mẫu ~110s (lệch mẫu thứ năm liên tiếp sau #119 +531s, #121 +871s, #123 +395s, #125 +527s; #120 +115s, #124 +109s, #126 +113s, #127 +111s, #129 +109s về mẫu — xem F-199-T9-4); dòng cuối lúc đếm **05:44:39Z**. Cả hai grep đều 8 lúc đó — KHỚP. **8 là CẬN DƯỚI** (journal mất sau reboot 06:38:56Z — `journalctl --list-boots` sau reboot chỉ còn boot #129; `-b -1` = 0 dòng; không đếm lại được #128). Toàn bộ 8 dòng đều là `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`, nhịp ~70 s/dòng.
- **#129: đếm trực tiếp 73 dòng lúc 08:03:20Z (lúc đóng)** — dòng đầu **06:40:45Z (boot+109s)** — đúng mẫu ~110s; dòng cuối **08:03:07Z**. Cả hai grep đều 73 — KHỚP. Đếm giữa phiên: 1 lúc ~06:41Z → 18 lúc 07:00:14Z → 23 lúc 07:06:32Z → 70 lúc 08:00:15Z → **73 lúc 08:03:20Z**. Vẫn tăng lúc đóng. Nhịp ~0,9 dòng/phút, cùng nhịp #126/#127 đợt 198.
- **Tổng phiên (2 boot, đếm trực tiếp): ≥8 + 73 = ≥81 dòng (8 là cận dưới).** **Chuỗi đợt có lỗi thật: 45 → 46** (cả 2 boot đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-199 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#128: 8=8; #129: 73=73 — KHỚP cả hai); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì KHÔNG ngoại suy đợt này (8 đã đủ lớn để kết luận lỗi thật); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai boot trong phiên (T9 bắt trực tiếp: 1 reboot; 2 boot đợt này)

- **#128 (773743f2-8538-40ee-8ade-986a4e7e41c1, btime 05:01:50Z; số hiệu ỨNG VIÊN — T01-199 XÁC MINH 9 nguồn TƯƠI; parent quyết (e)-199).** Sampler T9 trên #128 đợt 199: 05:45:50–06:38:55Z (54 mẫu). Gap #127→#128 = **16.044 s** (T01-199/T9-199). #128 sống **5.826 s (1h37m06s)** rồi chết 06:38:56Z.
- **#129 (e6e070b8-0427-4607-a421-2de265a54fdd, btime 06:38:56Z; số hiệu ỨNG VIÊN — POSTBOOT + survey thuộc T01-200/T56-200; parent quyết (e)-199/(e)-200).** Sampler T9 trên #129: 06:41:13–08:02:15Z (82 mẫu). Gap #128→#129 = **5.826 s** (btime tới btime). **(m) #129 THÔ 1 requeue** (run 207 viết lại ×1 tại reboot, btime+40,934 s — T7-199; phân loại CUỐI thuộc T2-200). POSTBOOT_PASS #129 CÓ 07:08:07Z (T56-199, poll=1, repair).
- **Khoảng mù giữa hai đợt: ~45 phút không sampler T9** (23:14:13Z 26/11 → 23:59:51Z — đợt 198; và 02:35:51Z → 05:35:51Z giữa đợt 198/199: #127 chết 05:01:50Z, T9-199 mở 05:43Z — cửa sổ thoáng #128 không quan sát được). **Khoảng mù trong phiên do reboot: 138 s sampler chính / 141 s live / ~169 s B2 watcher** (06:38:52Z → 06:41:13Z).

### 5.2 Các luồng khác — 10/11 cờ đã đóng lúc T9 đóng (P1/P2/P3/P4/T01/T2/T4/T56/T7/T8); T9 là cờ cuối

- T01-199 ĐÃ đóng: #128 XÁC NHẬN 9 nguồn TƯƠI; O8 21/21 ×3 PASS trên #128 (cùng cây 477a0eac); (m) #128 THÔ 0; khoảng event 8.406,673 s (T7-199 phân loại → S8); POSTBOOT_PASS #128 CÓ (poll=0); GAP §127 đã viết.
- T2-199 ĐÃ đóng: **(m) #127 DƯƠNG (CUỐI)**, n 56/57 → 57/58; (m) #128 THÔ 0 (T2-200).
- T4-199 ĐÃ đóng: #67 KHÔNG CÓ lượt hợp lệ; live-check #18 KHÔNG ĐẠT (T9 xác nhận §3.2); B2 dữ kiện thứ 13.
- T56-199 ĐÃ đóng: POSTBOOT_PASS #128/#129 CÓ; (A) 120/120 lần thứ 48; suite 9/9 × 6 (79 → 80); marker 79 ĐÃ XÁC MINH; watcher-199 L2 pid 7194.
- T7-199 ĐÃ đóng: lặng S8 8.407 s (dài nhất); run 206 CA mới #28; cửa slot KHÔNG LÀNH; run 207 RUNNING (kết cục T7-200).
- T8-199 ĐÃ đóng: harness 6/6 trên #129; 84l10 PASS (chuỗi 0 → 1); 86n2-P1 dữ kiện mới (19 → 20); FULL PASS KHÔNG CÓ.
- P1/P2/P3/P4-199 ĐÃ đóng (xem LIMITS P1–P4 — T9 không phán chuyên môn sản phẩm).

## 6. Sai số / caveat (F-199-T9-*)

- **F-199-T9-1 — LỖI CÚ PHÁP SHELL LÚC KHỞI ĐỘNG: `cd DIR && A & B` ĂN CẢ CỤM cd VÀO NỀN (MỚI — ĐÃ SỬA NGAY, mất ~3 phút b2watch/live/driver).** `cd X && nohup ./sampler.sh ... &` làm `&` ăn cả cụm `cd && sampler`, còn `b2watch/live/driver` (sau `;`) chạy ở cwd cũ (/home/hatch) và chết "No such file" (3 file .out lạc ở /home/hatch — đã dọn). Sửa: mỗi daemon `setsid bash -c 'cd DIR && exec ...'` với redirect đường dẫn tuyệt đối (sampler pid 5949 sống sót nhờ nằm trong cụm nền đầu; b2watch pid 14367 + live 33593 + driver 31405 khởi động lại đúng 05:46–05:48Z). Bài học: KHÔNG BAO GIỜ `cd && A & B` trong một lệnh exec — cd phải nằm TRONG subshell của từng daemon.
- **F-199-T9-2 — LIVE LẦN 1 CHẾT VÌ THIẾU ENV `T9_AUTOTRIGGER_LIVE=1` (MỚI — ĐÃ SỬA NGAY, mất ~3 phút live đầu phiên).** `sampler-autotrigger.py --live` từ chối khi env không set ("LIVE refused: T9_AUTOTRIGGER_LIVE=1 not set"); khởi động lại 05:48:52Z với env đúng mới chạy (pid 33593). Sampler chính vẫn chạy suốt nên RAM không mất mẫu; live mất 05:45:50–05:48:52Z. Bài học: khởi động live LUÔN kèm env, kiểm file log tồn tại đúng vị trí ngay sau khi start (như F-198-T9-4).
- **F-199-T9-3 — REBOOT #129 06:38:56Z GIẾT CẢ PHIÊN T9 + DRIVER #1 + LỆNH NGỦ (lần thứ bảy liên tiếp reboot cắt ngang phiên T9 — đợt 192, 193, 194, 196, 197, 198, 199).** Boot #128 chết sau 5.826 s; boot #129 btime 06:38:56Z. Hệ quả trực tiếp: (a) lệnh sleep chờ của agent (đang chờ tới 07:05Z) bị SIGTERM cùng runtime restart — recovery 06:39:57Z; (b) cả 3 daemon T9 + driver #1 chết giữa chừng (sampler mẫu cuối #128 06:38:55Z, live 06:38:52Z, B2 watcher spike cuối #128 06:39:18Z guest-time — xem F-199-T9-6); (c) driver #1 (chờ probe mid 07:00Z) chết theo reboot — T9 viết driver #2 (khởi động lại 06:41:13Z) và khởi động lại 3 daemon 06:41:13Z + probe tay postboot 06:40:34Z (boot+98s, TRỄ cửa sổ ~6s — xem §1.2) + probe mid 07:00:14Z + probe close 08:00:15Z đều chạy đúng giờ; (d) journal #128 mất hoàn toàn sau reboot — ENOSPC #128 chỉ còn 8 đếm trực tiếp (cận dưới, xem §4). **T10/parent lưu ý:** mọi số T9 đợt này chia 2 boot; các chuỗi "toàn phiên" phải đọc theo từng boot, không gộp mù.
- **F-199-T9-4 — ENOSPC #128 PHÁ MẪU ~110s (MỚI).** Dòng đầu #128 05:36:36Z = boot+2.086s (34m46s), khác mọi boot trước (#120 +115s, #124 +109s, #126 +113s, #127 +111s, #129 +109s — và các ngoại lệ +395–871s của #119/#121/#123/#125). Giải thích khả dĩ: đợt 199 mở 05:35Z, các luồng build bắt đầu tạo watch ~05:36Z mới làm cạn pool; đầu boot #128 ít áp lực watch hơn. #129 trở lại mẫu (+109s) ngay đợt này nên #128 là ngoại lệ đơn lẻ, không phải mẫu mới. Ghi nhận, không ngoại suy.
- **F-199-T9-5 — BỘ LỌC `ps` HOẠT ĐỘNG: 0/311 SPIKE CÓ `ps` ĐỨNG ĐẦU (SỬA XONG F-198-T9-5).** `b2watch.sh` bản 199 lọc `comm == ps` lúc ghi (`awk '$2 != "ps"'`) — top comm đợt này là tải thật (hatch 70, WebKitWebProces 56, chrome 52, MainThread 48...). Đợt 198: 74/229. Không còn cần bảng hiệu chỉnh: số đếm trực tiếp từ log đã là số thật. Quyết (n)-150 ("loại ps của chính watcher") nay đã có trong code — T9-200 giữ nguyên bản này, không copy lại bản 197.
- **F-199-T9-6 — HEADER `boot=` XÁC NHẬN PHÂN BOOT ĐÚNG CHO LOG B2 (SỬA XONG F-198-T9-8 — CÓ BẰNG CHỨNG TRỰC TIẾP).** Spike cuối #128 mang timestamp guest 06:39:18Z (SAU btime #129 06:38:56Z) nhưng header ghi `boot=773743f2` — đúng #128 (đồng hồ guest chạy nhanh ~30 s cuối đời #128, xem F-198-T9-8). Không có header, cắt mù theo btime sẽ gán sai spike này cho #129 (272/39 sẽ thành 271/40). Phân đúng: **#128 = 272, #129 = 39**. Sampler chính + live KHÔNG bị ảnh hưởng (mỗi mẫu ghi boot_id thật). W1/W2/W3 cũng không bị ảnh hưởng (cửa sổ T4 + timestamp spike cùng đồng hồ guest).
- **F-199-T9-7 — #129 GHIM KHI MÁY YÊN: GHIM KHÔNG DO TẢI GUEST (MỚI).** Đợt ghim 07:50–08:01Z xảy ra khi load1 chỉ 0,02–0,62 (máy gần như không làm gì — các luồng build đã xong, harness xong 07:32Z) và avail chỉ 344–425 MB. Balloon leo đều 6,10M → CEIL trong 07:46–07:50Z rồi giữ trần 12 phút. Mẫu này khớp giả thuyết đứng: ghim là host-side balloon inflation (virtio), không phải do tải guest tạo ra. Cũng giải thích vì sao avail sụp (344 MB) mà load1 vẫn ~0: RAM bị balloon lấy đi, không phải bị process ăn.
- **F-199-T9-8 — T4-199 §3 GHI SỐ SPIKE T9 LÚC ĐÓNG LÀ 281, T9 ĐẾM CUỐI 311 (KHÔNG MÂU THUẪN — KHÁC THỜI ĐIỂM ĐẾM).** T4 đếm 281 spike (3.934 dòng) lúc T4 đóng (~06:45–06:50Z trên boot #129): 272 (#128) + 9 (#129, 06:41:13–06:45Z). T9 đếm cuối 311 = 272 + 39 (#129 tới 07:22:44Z). 30 spike #129 còn lại đến sau khi T4 đóng. W1/W2/W3 (43/33/39) KHỚP TUYỆT ĐỐI cả hai lần đếm.
- **F-199-T9-9 — ĐÍNH CHÍNH (r)-198: 'replay #125/#126 (KHÔNG replay #124 post-hoc)' (NHIỆM VỤ 5 — ĐÃ LÀM).** (r) trên aggregate 198 (68.365 B, §14.2 parent viết trực tiếp) ghi "replay #124/#125" — SAI, mâu thuẫn (k)-198 "replay #125/#126" và giao (r)-198 cho T01-199 ("GAP §126 + replay #125/#126"). T9-198 đã theo (k); T56-198 F-198-T56-8 khớp. Đính chính này ghi rõ tại §0 trên + đây; (k) là đúng, (r) là sai — KHÔNG replay #124 post-hoc (quyết (k) §12.3-183: không viết lại replay cho boot cũ).

- **F-199-T9-10 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; probe postboot 06:40:34Z cũng 0 — không tạo thư mục tạm đáng kể; probe mid 07:00:14Z trước mọi attempt (T4 đã đóng 06:57Z); probe close 08:00:15Z sau khi mọi luồng đo đã đóng); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG ~08:03Z — TRONG hạn cờ ~08:00Z + hạn cứng 08:35:51Z** (probe close chạy đúng 08:00:15Z nhờ driver #2; daemon dừng 08:02:40–08:03:08Z theo quy tắc đứng — đã dừng cả 3 lúc đóng sổ, xem F-198-T9-2). Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: parent (p)-198 đã quyết đợt 198 có 0 vi phạm mới (chuỗi GIỮ 0); đợt 199 có nối lên 1 hay không thuộc T10/parent (cần verdict của TẤT CẢ luồng).

- **Caveat đứng:** probe cap 30.000 (giá trị mở là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 1.227 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #128 từ cell vì journal cũ mất sau reboot (chỉ còn 8, cận dưới); cửa sổ thoáng #128/#129 đều KHÔNG quan sát được đợt này (mở phiên muộn / probe trễ 6s); số hiệu #129 + (m) #129 + POSTBOOT_PASS #129 (caveat) thuộc T01-200/T56-200 + parent; E-247 GIỮ MỞ (T9 chỉ báo dữ kiện + đếm boot không-pin: #127 1, #128 2, #129 GHIM → chuỗi VỀ 0).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (136 mẫu, 05:45:50Z–08:02:15Z, hai boot #128/#129): `hidden_files/round199-t9/ram-sampler-FROZEN.log` — md5 `f30b9e74d9a579b5841b7ffc7919f5a5`. Log B2 đóng băng (311 spike): `hidden_files/round199-t9/b2-spikes-FROZEN.log` — md5 `669ec1b932905789ff414f5e1f0f64b4`. Log headroom đóng băng (4 lần đo): `hidden_files/round199-t9/headroom-log-FROZEN.txt` — md5 `669a486e71d734e5b65089c65142f722`. Log live auto-trigger đóng băng (133 mẫu): `hidden_files/round199-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `f35f7cdea054256ad54771ec462e1883`. Phân tích: `t9-199-analyze.py` (output `t9-199-analyze-output.txt`) + `t9-199-b2-analyze.py` (output `t9-199-b2-analyze-output.txt` — cả hai đã cập nhật cửa sổ T4-199 W1/W2/W3, không còn cửa sổ cứng đợt cũ). Baseline: `t9-199-baseline-notes.md` (gồm ghi chú reboot #129 + 2 sự cố khởi động). Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). Driver: `t9-199-driver.sh` (driver #1 chết theo reboot #129; driver #2 khởi động lại 06:41:13Z, output `driver.out`). B2 watcher bản 199 (`b2watch.sh` — lọc `ps` + ghi `boot=` mỗi spike). T10 đọc log đóng băng trực tiếp khi cần.
