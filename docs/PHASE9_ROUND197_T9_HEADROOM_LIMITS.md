# LIMITS — Phase 9 đợt 197, T9: headroom postboot #126 BẮT ĐƯỢC CỬA SỔ THOÁNG (30.000 = CAP) + REBOOT 22:32:41Z giữa đợt (#125 chết sau 7.493 s, #126 sinh ra) + BALLOON GHIM TRỞ LẠI — E-247 PIN QUAY LẠI (21 mẫu CEIL, 2 đợt ghim dài trên #126) + ENOSPC #125 74 + #126 36 + auto-trigger live 151 mẫu 0 FIRE (tổng 975) + live-check #16 ĐẠT (xác nhận độc lập)

## 0. Tóm tắt

- **HEADROOM: 4 lần đo, 2 boot.** open 0 (#125, boot+15m39s) + mid 0 (#125) + **postboot 30.000 = CAP (#126, boot+81s — BẮT ĐƯỢC cửa sổ thoáng, lần đầu chạm cap kể từ đợt 193)** + close2 0 (#126, boot+42m19s). Trần inotify **63.737 KHÔNG ĐỔI**.
- **BALLOON — E-247 PIN QUAY LẠI: 21 mẫu CEIL / 153 mẫu (2 sampler độc lập KHỚP TỪNG MẪU).** #125: **1 CEIL** (mẫu cuối 22:32:47Z, trước reboot vài giây) / 112 mẫu. **#126: 20 CEIL / 41 mẫu, thành 2 đợt ghim dài liên tiếp: 7 mẫu (22:49:13–22:55:13Z) + 13 mẫu (23:00:13–23:12:13Z).** **ĐỀ XUẤT MỞ LẠI E-247** (theo điều kiện (h)-196).
- **Sàn 6.050.608 kB: 1 lần (#126, 22:56:13Z — giữa 2 đợt ghim) — tổng 0 → 1** (chuỗi đã đứt đợt 194; đây là lần trúng sàn đầu tiên kể từ đó). Sag 6.247.216 kB: 0 lần — tổng GIỮ 3. Balloon = 0: 0 lần.
- **ENOSPC: #125 = 74 dòng lúc 22:00:01Z (CẬN DƯỚI, journal mất sau reboot) + #126 = 36 dòng lúc 23:15:00Z (dòng đầu boot+113s — về lại mẫu ~110s). Chuỗi đợt có lỗi thật 43 → 44.**
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 3.181.992 kB (sampler chính) / 3.126.396 kB (live). **0 lần chạy birefnet — lần thứ 49 liên tiếp (147–197).**
- **Auto-trigger: LIVE 151 mẫu đợt này, tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **975 mẫu (824 tới hết đợt 196 + 151 đợt 197), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA.
- **REBOOT GIỮA ĐỢT 22:32:41Z:** #125 chết sau 7.493 s (2h04m53s); #126 sinh ra. Giết cả 3 daemon T9 + driver #1 + sleep-wake của agent (runtime restart, recovery 22:33:38Z) — T9 phát hiện reboot 22:33:44Z, probe tay + khởi động lại 3 daemon 22:34:12Z, driver close #2 chạy probe close2 23:15:00Z. Gap đo: sampler 85 s (guest-time), live ~116 s, B2 ~100 s.
- **RAM: 153 mẫu, 20:41:43–23:14:13Z, HAI boot (#125 n=112, #126 n=41).** Max **3.181.992 kB**; min **253.436 kB**; mean 1.137.851,0 kB; gate A **67/153**. Load1 <4,0: 145/151 mẫu live.
- **Lượt yên #65 (T4): CÓ LƯỢT HỢP LỆ (attempt2) — chuỗi 0 → 1. Kiểm chứng live lần 16: ĐẠT — T9 xác nhận độc lập (W2 4 mẫu watch/consec=0, 0 FIRE, 0 spike B2, max avail 2.343.548 kB < guard) — chuỗi live ĐẠT 0 → 1.**
- **B2: 149 spike THẬT (tất cả trên #125; 0 spike trên #126)** — W1/W2 0/0 spike (dữ kiện thứ 9, KHỚP T4); cửa sổ kẹt #30 (T8) 0 spike (máy NHÀN lúc kẹt); load1 đỉnh watcher **8,29**.
- **0 VI PHẠM phía T9. T9 đóng ~23:20Z — QUÁ hạn cờ ~23:00Z nhưng TRONG hạn cứng 23:35:51Z** (reboot giữa đợt 22:32:41Z + runtime restart cắt sleep-wake làm trễ đóng sổ; probe close2 vẫn chạy đúng 23:15:00Z). Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–196 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Gate-check trong probe-loop.sh (bài học F-191-T10-2) vẫn chạy — probe open/mid/close2 đều qua gate-check sạch (T4 đã đóng cờ trước mid; không marker T4 cùng boot8 nào lúc probe).

### 1.2 Số đo đợt 197 (4 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 20:43:27Z | **0** | #125 8304fcd1 | 63.737 | probe open-197 (boot+15m39s) |
| 22:00:01Z | **0** | #125 | 63.737 | probe mid-197 (boot+1h32m13s; T4 đã đóng cờ) |
| **22:34:02Z** | **30.000 = CAP** | **#126 ba8ad21e** | 63.737 | **probe postboot-197 (boot+81s — TRONG cửa sổ 61–92s)** |
| 23:15:00Z | **0** | #126 | 63.737 | probe close2-197 (boot+42m19s; driver #2) |

- **CỬA SỔ THOÁNG #125: KHÔNG QUAN SÁT ĐƯỢC.** Boot btime 20:27:48Z; cửa sổ boot+61–92s = 20:28:49–20:29:20Z đã đóng ~14 phút trước khi T9 mở phiên (~20:41Z). Như #119/#121/#123.
- **CỬA SỔ THOÁNG #126: BẮT ĐƯỢC — HEADROOM = 30.000 (CAP, CENSORED).** Boot btime 22:32:41Z (/proc/stat btime 1795732361; uptime 1 phút lúc 22:33:44Z → implied btime đúng, offset ~0); cửa sổ giả định = 22:33:42–22:34:13Z. T9 phát hiện reboot lúc 22:33:44Z (uptime 1 phút) và probe tay chạy 22:33:58–22:34:02Z (**boot+77–81s, trong cửa sổ**) — **headroom = 30.000 = cap 30.000, tức chỉ biết ≥30.000 watch còn trống lúc đó**. Đây là lần đầu tiên kể từ đợt 193 (#118 bắt được ở +81s) một probe postboot chạm cap; các đợt 194/195/196 đều bắt được 0 (trễ 6–9 s hoặc cửa sổ đã qua). Kết luận: cửa sổ thoáng trên #126 RỘNG (≥30.000 watch trống ở +81s) — không đo được giá trị thật vì cap 30.000 (caveat đứng: giá trị mở là censored).
- **Headroom cuối phiên: 0** (close2 23:15:00Z, #126 boot+42m19s — cửa sổ đã đóng từ lâu). Trần **KHÔNG ĐỔI trong đợt (63.737 cả 4 lần đo, 2 boot)**.
- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (0)** — nhưng dữ kiện đợt này củng cố: sau mỗi reboot có một cửa sổ thoáng ngắn (~1–2 phút), và lần này cửa sổ ĐỦ RỘNG để chạm cap ở +81s. Đề xuất T9 đợt 193 (probe ngay khi phát hiện reboot) đã làm được ở #118/#120/#124 (trễ) và nay ở #126 (kịp, +81s).

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 153 mẫu, 20:41:43–23:14:13Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 85 s** (reboot 22:32:41Z — mẫu cuối #125 22:32:47Z guest-time → mẫu đầu #126 22:34:12Z; caveat lệch đồng hồ F-196-T9-4, xem §6); các gap còn lại **≤61 s** (jitter bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 20:41:43–22:32:47Z | #125 | 253.436–3.181.992 kB | Mở sampler; balloon 6,05M → 3,34M → leo dần tới CEIL 6.443.824 lúc 22:32:47Z; **attempt1/2 T4 21:26–21:34Z**; **kẹt #30 (T8) 21:51:12–22:05:41Z**; RAM <512k: 14 mẫu |
| 22:32:41Z | — | — | **REBOOT → #126** (sampler chết; gap 85 s guest-time) |
| 22:34:12–23:14:13Z | #126 | 545.528–1.820.472 kB | Boot mới: balloon đã 5,09M từ mẫu đầu; **20 mẫu CEIL, 2 đợt ghim dài**; RAM <512k: 0 mẫu |

- **Gate A ≥1024 MiB: 67/153 mẫu** (59/112 #125; 8/41 #126); **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **7,79** (#125 — trong lúc mở phiên; #126: 2,63); load1 <4,0: **145/151 mẫu live (96,0%)**; **RAM <512.000 kB: 14 mẫu** (cả 14 trên #125, thành 3 dải: 21:55:46–22:02:46Z n=8; 22:23:47–22:24:47Z n=2; 22:29:47–22:32:47Z n=4); **RAM <300.000 kB: 2 mẫu** (#125, 22:31:47Z 253.436 + 22:32:47Z 296.188 — 2 mẫu cuối trước reboot).
- Swap: #125 SwapFree 751.844 kB (mẫu đầu) → 566.712 kB (mẫu cuối) — giảm **185.132 kB**; #126 SwapFree 1.039.760 kB (mẫu đầu, boot tươi) → 657.836 kB (mẫu cuối) — giảm **381.924 kB chỉ trong 40 phút** (xả swap nhanh trên boot mới — như #118/#120/#123/#124).
- Trũng RAM đợt này: min **253.436 kB (22:31:47Z, #125, balloon 6.439.440)** — sâu nhất kể từ khi T9 theo dõi (đợt 196: 499.420 kB; đợt 195: 503.928 kB; đợt 194: 475.204 kB). 2 mẫu <300.000 kB, đều trong 2 phút cuối của #125.

**Bảng tổng hợp số RAM (từ script `t9-197-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 153 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #125 8304fcd1 | 112 | 253.436 | 3.181.992 | 1.254.588,0 | 59/112 | 1 | 7,79 | 14 |
| #126 ba8ad21e | 41 | 545.528 | 1.820.472 | 818.959,9 | 8/41 | 20 | 2,63 | 0 |
| **Toàn phiên** | **153** | **253.436** | **3.181.992** | **1.137.851,0** | **67/153** | **21/153 (13,7%)** | **7,79** | **14** |

- **Mean toàn phiên 1.137.851,0 kB — 2 cách độc lập: python `sum/n = 1.137.851,0` VÀ kiểm có trọng số của script (in `t9-197-analyze-output.txt`) — KHỚP CẢ HAI.**

### 2.2 Balloon virtio — #125 GHIM 1 MẪU CUỐI; #126 GHIM 20 MẪU, 2 ĐỢT DÀI — E-247 PIN QUAY LẠI

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB** (xác nhận đợt 194: 5 mẫu đúng bằng trần trên #120) — **đợt này 21 mẫu chạm trần nên xác nhận lại được**.
- **Boot #125: GHIM 1/112 mẫu (0,9%) — đúng mẫu CUỐI CÙNG trước reboot (22:32:47Z, avail 296.188, load1 0,00).** Mẫu trước đó 22:31:47Z đã 6.439.440 kB (chỉ dưới trần 4.384) — balloon leo vào trần trong ~1 phút cuối đời boot. Trước đó balloon đã ≥6,0M từ mẫu mở phiên (6.052.828) rồi xả xuống 3,34M (min 21:34:46Z) và leo lại từ 22:22:47Z (9 mẫu ≥6,0M trong đợt leo cuối; tổng #125 11 mẫu).
- **Boot #126: GHIM 20/41 mẫu (48,8%) — HAI ĐỢT GHIM DÀI LIÊN TIẾP: 7 mẫu 22:49:13–22:55:13Z + 13 mẫu 23:00:13–23:12:13Z.** Giữa 2 đợt: 22:56:13Z balloon tụt đúng **sàn 6.050.608 kB** (xem dưới) rồi leo lại; sau đợt 2: 23:13:13Z 6.092.876 → 23:14:13Z 6.212.384 (vẫn ≥6,0M lúc đóng, dưới trần 231.440 kB). Balloon #126 bắt đầu 5.093.444 (mẫu đầu boot+91s) → ≥6,0M từ 22:45:12Z (boot+751s) → ghim từ 22:49:13Z (boot+992s).
- **E-247 — PIN QUAY LẠI, ĐỀ XUẤT MỞ LẠI.** Chuỗi boot: #120 ghim 5 mẫu (đợt 194) → #121 0 CEIL / 92 mẫu → #122 không dữ kiện → #123 0 CEIL / 107 mẫu → #124 0 CEIL / 21 mẫu → **#125 1 CEIL / 112 mẫu (mẫu cuối) → #126 20 CEIL / 41 mẫu (2 đợt ghim dài)**. Ghim không chỉ quay lại mà quay lại MẠNH (48,8% mẫu trên #126, 2 đợt liên tiếp dài 7 + 13 phút). T9 chỉ báo dữ kiện + đề xuất; quyết mở lại thuộc parent/T10.
- **Xác minh độc lập 2 sampler:** live sampler bắt **cùng 21 mẫu CEIL** trên cả 2 boot (live log 151 mẫu: #125 1 CEIL 22:32:18Z; #126 20 CEIL 22:49:14–22:55:14Z 7 mẫu + 23:00:14–23:12:14Z 13 mẫu — lệch ±1 s so với sampler chính do thời điểm đọc khác nhau); live cũng bắt đúng **1 mẫu sàn** và **0 mẫu sag**. Hai tiến trình lấy mẫu độc lập, cùng đọc `/proc/meminfo`; balloon tại cùng timestamp KHỚP TỪNG SỐ.
- **Balloon = 0: 0 lần đợt này** (như đợt 192/193/194/195/196). Balloon min đợt này: 3.340.660 kB (#125, 21:34:46Z).
- **Sàn balloon 6.050.608 kB: 1 lần đợt này (#126, 22:56:13Z, avail 958.344, load1 0,78) — tổng 0 → 1** (chuỗi đã ĐỨT đợt 194, quyết (h)-194; đây là lần trúng sàn đầu tiên kể từ đó). Lưu ý: mẫu #125 22:32:47Z là CEIL, không phải sàn.
- **Giá trị sag 6.247.216 kB: 0 lần đợt này** (tổng giữ 3: đợt 187: 2 lần; đợt 188: 1 lần).

### 2.3 Lượt yên WebKit #65 (T4) — CÓ LƯỢT HỢP LỆ (attempt2) — chuỗi 0 → 1 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#65 CÓ LƯỢT HỢP LỆ — attempt2 hợp lệ (chuỗi lượt yên hợp lệ 0 → 1).** Attempt1: 20/20 NHƯNG B4 VI PHẠM (T56 cài `libwebkitgtk-6.0-4` trong cửa sổ, dpkg delta 110) + tickCost median 49,0 ms — KHÔNG hợp lệ. Attempt2: 20/20 + lớp B ĐẠT 5/5 + tickCost median 47,0 ms — **LƯỢT HỢP LỆ**.
- **Kiểm chứng live lần 16: ĐẠT** (T9 xác nhận độc lập — xem §3.2). **Chuỗi live ĐẠT 0 → 1.**
- **Labellag (b): lượt hợp lệ #65 có 6 occ / 1 event (lag5) nên chuỗi 0 occ GIỮ 0** (T4; quyết (m)-192: chỉ lượt hợp lệ mới tính).
- **FULL PASS: KHÔNG CÓ — chân O8 VẮNG** (T01-197: WebKit attempt1 FAIL harness timeout, attempt2 PASS 21/21, Chromium PASS 21/21 — 2/3) + chân harness kẹt #30 (T8-197).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 20:43:41–20:50:33Z | #125 | ~0,9–1,7 (mở phiên) | 578–754 MB lúc mở (T4) | **O8 T01 2/3** (WebKit a1 FAIL, a2 PASS 21/21, Chromium PASS 21/21); 0 mẫu ghim |
| T4 attempt1 21:26:51–21:30:24Z | #125 | 0,56–2,52 (4 mẫu live) | 1.476.576–1.869.060 kB — **gate A 4/4** | **0 spike B2** (khớp T4); B4 vi phạm (T56 cài lib); 0 mẫu ghim |
| T4 attempt2 21:30:48–21:34:18Z | #125 | 0,39–2,00 (4 mẫu live) | 1.906.060–2.343.548 kB — **gate A 4/4** | **0 spike B2** (khớp T4); **LƯỢT HỢP LỆ**; 0 mẫu ghim |
| T8 kẹt #30 21:51:12–22:05:41Z | #125 | <3,0 suốt (0 spike B2) | avail min 247 MB (T8, 22:01:59Z) | **Kẹt #30: 0 spike B2 — máy NHÀN lúc kẹt** (xem §2.5) |

- T01-197: **#125 XÁC NHẬN 9 nguồn TƯƠI** (btime 20:27:48Z, gap #124→#125 = 14.370 s — T4 ghi 11.970 s là SAI, xem F-197-T9-1); O8 2/3; **POSTBOOT_PASS #125 CÓ 21:28:14Z** (T56-197, poll=1, viết tay sau repair; GST là SYMLINK → debroot, caveat như #119); (m) #124 THÔ 1 requeue DƯƠNG; (m) #125 THÔ 0 requeue (phân loại CUỐI thuộc T2-197); n ứng viên GIỮ 54/55.
- T8-197: **KẸT #30 MỚI** (85m4 P2, đóng băng playhead 0.167 từ 21:51:12Z, timeout 124 lúc 22:05:41Z); **B1 BỎ LỠ kẹt live LẦN ĐẦU** (V2+V4 đều không trigger live; V4 bắt được ở replay, gap=760s); 84l10 PASS chuỗi 4 → 5; 86n2-P1 chuỗi 17 → 18; B2 vùng mới sạch lần 11; harness 5/6.
- **(m) #126 + POSTBOOT_PASS #126 thuộc T2-198/T56-198** — T9 KHÔNG tính, KHÔNG phán; chỉ ghi số thô nếu chạm tới (đợt này T9 không chạm tới cái nào).

### 2.5 B2 — 149 spike THẬT (tất cả trên #125; 0 trên #126); 0/0 spike trong 2 attempt (khớp T4 từng số); 0 spike trong cửa sổ kẹt #30

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **149 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 149): tất cả trên #125, 0 trên #126** (load1 sau reboot ≤2,63, không chạm ngưỡng 3,0); **load1 đỉnh đợt (watcher, cadence 2 s): 8,29** (khớp load1 max sampler 7,79 — watcher bắt đỉnh cao hơn do cadence 2 s; đợt 196: 12,42).

| Nhóm (comm đứng đầu) | n | Ghi chú |
|---|---|---|
| chrome | 54 | Tải trình duyệt (O8/harness + luồng sản phẩm) |
| MainThread | 51 | comm `MainThread`, chưa xác định chắc là tiến trình nào (ghi theo comm) |
| hatch | 18 | Tải nền tảng |
| ffmpeg | 8 | Luồng sản phẩm (render/proxy) |
| bash | 6 | Lẻ tẻ |
| WebKitWebProces | 4 | Harness/O8 WebKit + attempt T4 |
| store | 3 | Lẻ tẻ |
| find | 2 | Lẻ tẻ |
| exe | 1 | Lẻ tẻ |
| ps | 1 | Watcher tự bắt chính mình 1 lần (đã sửa theo quyết (n)-150 — còn sót 1) |
| npm | 1 | Lẻ tẻ |

Tổng 54+51+18+8+6+4+3+2+1+1+1 = 149 — KHỚP. Phân theo giờ: 20:xx 97 spike; 21:xx 38 spike; 22:xx 14 spike. Spike đầu 20:43:20Z (load1 8,29 — ngay mẫu mở phiên, đỉnh đợt); spike cuối 22:13:42Z (load1 3,15).

- **0 spike trong attempt1** (21:26:51–21:30:24Z); **0 spike trong attempt2** (21:30:48–21:34:18Z). Ngoài các cửa sổ trên: 149 spike.
- **0 spike trong cửa sổ kẹt #30** (21:51:12–22:05:41Z) — kẹt xảy ra trong lúc máy NHÀN (load1 <3,0 suốt cửa sổ; avail min 247 MB lúc 22:01:59Z theo T8). B2 (dựa trên load) KHÔNG THỂ thấy kẹt này — cùng mẫu B1 bỏ lỡ live (T8-197). 14 spike sau khi T4 đóng (21:34:44–22:13:42Z), đều trước reboot.
- **Khoảng mù watcher: ~100 s do reboot** (22:32:41Z → 22:34:12Z — watcher chết theo reboot, 0 spike ghi trong gap vì KHÔNG CÓ watcher, không phải vì máy yên; xem F-197-T9-3). Sau khi khởi động lại trên #126 (22:34:12Z), watcher chạy liên tục tới lúc đóng với **0 spike** (load1 ≤2,63 — máy yên sau reboot, dù balloon ghim).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-188; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 3.181.992 kB (sampler chính, #125) / 3.126.396 kB (live, #125); live log max 1.820.472 kB trên #126. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 49 liên tiếp (147–197).**
- **QUYẾT (o) §14.2-188/§14.2-193: AUTO-TRIGGER GIỮ LIVE.** Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-197:** live đã bật từ đợt 189 nên đợt này là TIẾP TỤC, không flip mới — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 196 §14.2 (84.800 B, bản parent-đã-đính-chính); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189/191/192/193/194/195/196; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 196 (copy nguyên từ round196-t9). Khởi động lần 1 đúng ngay 20:41:43Z (pid 4797, env + `--live`, round_dir=autotrigger-live); **khởi động LẠI 22:34:12Z (pid 3029) sau reboot** — cùng tham số (xem F-197-T9-3).
- **LIVE PHASE ĐỢT 197: 151 mẫu, 20:41:43–23:14:13Z (110 #125 + 41 #126), TẤT CẢ `trigger=watch consec=0`, max avail 3.126.396 kB (#125) / 1.820.472 kB (#126), load1 <4,0: 145/151 (96,0%) — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `autotrigger-live/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Mẫu live đầu 20:41:43Z; live chạy suốt cả 2 cửa sổ attempt T4, 0 FIRE trong cả 2.
- **TỔNG LIVE TỪ 03:14Z 25/11: 975 mẫu (824 tới hết đợt 196 + 151 đợt 197), 0 FIRE.** Khoảng mù live: **(a) giữa đợt ~3h52m** (16:49:56Z → 20:41:43Z 26/11 — live đợt 196 chết cùng phiên agent ~16:50Z; không có mẫu live nào; cũng không thể có FIRE vì không có tiến trình live nào để fire); **(b) do reboot ~116 s** (22:32:18Z → 22:34:14Z — live chết theo reboot, khởi động lại ngay khi T9 phát hiện). Trong cả hai khoảng mù, guard có mở hay không là KHÔNG BIẾT (không sampler nào chạy) — nhưng cũng không thể có FIRE (không có tiến trình live nào để fire; không có file trigger/flag nào trên đĩa từ các khoảng đó).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 975 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 49 đợt). **Lưu ý mới:** balloon #126 GHIM TRẦN 20 mẫu NHƯNG avail lúc ghim chỉ 545–958 MB — guard đo bằng MemAvailable, không phải balloon; balloon ghim không mở guard. Auto-trigger 0 FIRE trong suốt đợt là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 196); không có thư mục `~/workspace/tmp-t9-197-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round197-t9/` (live chạy 151 mẫu, 0 sự kiện).

### 3.2 Kiểm chứng live lần 16 (đợt 197) — T9 XÁC NHẬN ĐỘC LẬP: ĐẠT

- **LIVE-CHECK #16 (đợt 197): ĐẠT — T9-197 xác nhận độc lập từ log live của mình.** Cửa sổ hợp lệ duy nhất W2 = attempt2 #65 (21:30:48–21:34:18Z): **4 mẫu live** trong W2 (21:31:17Z avail 2.197.160 / balloon 3.393.888 / load1 1,90; 21:32:17Z avail 1.906.060 / balloon 3.648.804 / load1 2,00; 21:33:17Z avail 2.168.996 / balloon 3.928.640 / load1 0,73; 21:34:17Z avail 2.343.548 / balloon 4.192.628 / load1 0,39) — tất cả `trigger=watch consec=0`, **0 FIRE** (đúng — không có kẹt trong W2 để bắt); **0 spike B2** trong W2 (đếm header từ `b2-spikes.log` T9-197); max avail trong W2 2.343.548 kB < guard. Toàn log live 197: 151 mẫu, 0 dòng trigger != watch consec=0. **Chuỗi live ĐẠT 0 → 1 — ĐÃ CÓ xác nhận T9** (T4 phán ĐẠT, T9 xác nhận; KHỚP T4 từng mẫu).
- W1 (không hợp lệ, B4 vi phạm) chỉ là dữ kiện: 4 mẫu watch/consec=0, 0 FIRE, 0 spike B2 (21:27:17–21:30:17Z, avail 1.476.576–1.869.060 kB).

## 4. ENOSPC trong journal (đếm trực tiếp — #125 MẤT journal sau reboot; #126 đếm tới lúc đóng)

- **#125: đếm trực tiếp 74 dòng lúc 22:00:01Z (lần đếm cuối trước reboot) — CẬN DƯỚI** — dòng đầu **20:36:35Z (boot+527s)** — CHẬM HƠN mẫu ~110s (lệch mẫu thứ tư liên tiếp sau #119 +531s, #121 +871s, #123 +395s; #120 +115s, #124 +109s, #126 +113s về mẫu — xem F-197-T9-2); dòng cuối lúc đếm **21:59:15Z**. Cả hai grep đều 74 lúc đó — KHỚP. **74 là CẬN DƯỚI** (journal mất sau reboot 22:32:41Z — `journalctl --list-boots` sau reboot chỉ còn boot #126; không đếm lại được #125).
- **Đếm giữa phiên #125 (bài học F-187-T9-5 — đếm ở MỖI lần kiểm):** 7 dòng lúc 20:43:27Z → 74 lúc 22:00:01Z → **mất journal sau reboot (không đếm tiếp được)**. Nhịp ~0,9 dòng/phút — **KHÔNG dừng giữa boot** (như #114/#115/#117/#118/#119/#120/#123/#124).
- **#126: đếm trực tiếp 36 dòng lúc 23:15:00Z** — dòng đầu **22:34:34Z (boot+113s)** — về lại mẫu ~110s; dòng cuối **23:14:39Z**. Cả hai grep đều 36 — KHỚP. Vẫn tăng lúc đóng (0 lúc 22:34Z → 36 lúc 23:15:00Z). Nhịp ~0,9 dòng/phút, cùng nhịp #125.
- **Tổng phiên (2 boot, đếm trực tiếp): 74 + 36 = 110 dòng (74 là cận dưới).** **Chuỗi đợt có lỗi thật: 43 → 44** (cả 2 boot đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-197 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#125: 74=74; #126: 36=36 — KHỚP cả hai); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì KHÔNG ngoại suy đợt này (74 đã đủ lớn; ngoại suy ~97 đợt 196 chỉ làm khi cần — xem §4 đợt 196); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai boot trong phiên (T9 bắt trực tiếp: 1 reboot; 2 boot đợt này)

- **#125 (8304fcd1-6390-4f7d-a9fe-814a29dd100d, btime 20:27:48Z; số hiệu ỨNG VIÊN — T01-197 XÁC MINH 9 nguồn TƯƠI; parent quyết (e)).** Sampler T9 trên #125: 20:41:43–22:32:47Z (112 mẫu). Gap #124→#125 = **14.370 s** (T4 ghi 11.970 s là SAI — xem F-197-T9-1). #125 sống **7.493 s (2h04m53s)** rồi chết 22:32:41Z.
- **#126 (ba8ad21e-d1a1-489c-baa9-9e2dc52173f4, btime 22:32:41Z; số hiệu ỨNG VIÊN — T01-197 đóng cờ TRƯỚC reboot nên chưa xác minh boot này; parent quyết (e)).** Sampler T9 trên #126: 22:34:12–23:14:13Z (41 mẫu). Gap #125→#126 = **7.493 s** (btime tới btime; lưu ý caveat lệch đồng hồ F-196-T9-4). **(m) #126 + POSTBOOT_PASS #126 thuộc T2-198/T56-198** — T9 không phán.
- **Khoảng mù giữa hai đợt: ~3h52m không sampler T9** (16:49:56Z → 20:41:43Z 26/11 — chứa reboot #125 + cửa sổ thoáng #125 + toàn bộ khoảng mù live giữa đợt). **Khoảng mù trong phiên do reboot: 85 s sampler chính (guest-time) / ~116 s live / ~100 s B2 watcher** (22:32:41Z → 22:34:12Z).

### 5.2 Các luồng khác — P1/P2/P3/P4/T01/T2/T4/T56/T7/T8 đã đóng cờ; chỉ T9/T10 còn lại

- T01-197 ĐÃ đóng: #125 XÁC NHẬN 9 nguồn TƯƠI; O8 2/3; (m) #124 THÔ 1 requeue DƯƠNG; (m) #125 THÔ 0 requeue; POSTBOOT_PASS #125 CÓ 21:28:14Z. T2-197 ĐÃ đóng: xem LIMITS T2 ((m) phán CUỐI thuộc T2). T4-197 ĐÃ đóng: #65 CÓ lượt hợp lệ; live-check #16 ĐẠT (T9 xác nhận §3.2). T56-197 ĐÃ đóng: POSTBOOT_PASS #125 (viết tay, poll=1); watcher-197 START 20:45:21Z — **CHẾT theo reboot 22:32:41Z** (T56-197 đóng cờ trước reboot nên chưa ghi; watcher-198 PHẢI kiểm ps trước khi spawn — tiền lệ đợt 196). T7-197 ĐÃ đóng: xem LIMITS T7 (lặng #C 8.404 s, OUTAGE phán cuối thuộc T7/parent). T8-197 ĐÃ đóng: kẹt #30; B1 bỏ lỡ live lần đầu; V4 bắt được ở replay; 84l10 chuỗi 4 → 5; 86n2-P1 chuỗi 17 → 18.
- **POSTBOOT_PASS #126 CHƯA CÓ** (T56-197 đã đóng cờ trước reboot 22:32:41Z; watcher-197 chết theo reboot; replay/watcher trên boot mới thuộc T56-198).

## 6. Sai số / caveat (F-197-T9-*)

- **F-197-T9-1 — T4-197 GHI SAI GAP #124→#125 (11.970 s, ĐÚNG LÀ 14.370 s).** T4-197 §4 ghi "Gap #124→#125 = 11.970 s (btime #124 = 16:28:18Z…; btime #125 = 20:27:48Z)" — sai số học thuần túy: 20:27:48 − 16:28:18 = 3h59m30s = **14.370 s** (1795724868 − 1795710498 = 14370, T9 tính lại bằng python). Thiếu 2.400 s (40 phút). Không đổi verdict nào của T4 (gap chỉ là dữ kiện), nhưng T10/parent dùng 14.370 s. Bài học: gap btime-btime luôn tính lại bằng máy, không tính nhẩm.
- **F-197-T9-2 — ENOSPC ĐẦU TIÊN TRÊN #125 CHẬM HẲN: boot+527s (20:36:35Z), lệch mẫu ~110s lần thứ tư liên tiếp (sau #119 +531s, #121 +871s, #123 +395s).** Journal first entry 22:32:59Z trên #126 (btime+18s) — không có dòng ENOSPC nào trong 6m35s đầu boot #125. Cả 7 dòng đầu #125 đều từ `home-assistant-ensure.service` (thử add-watch định kỳ). #126 về lại mẫu ~110s (dòng đầu boot+113s) nên lệch này chỉ xảy ra trên #125 (và #119/#121/#123 trước đó). T9 ghi nhận là lệch mẫu, không suy ra nguyên nhân chắc chắn.
- **F-197-T9-3 — REBOOT 22:32:41Z GIẾT CẢ PHIÊN T9 + DRIVER GỐC + LỆNH BÁO THỨC (lần thứ năm liên tiếp reboot cắt ngang phiên T9 — đợt 192, 193, 194, 196, 197).** Boot #125 chết sau 7.493 s; boot #126 btime 22:32:41Z. Hệ quả trực tiếp: (a) lệnh báo thức sleep của agent (đang chờ tới 23:15Z) bị cắt cùng runtime restart — recovery 22:33:38Z; (b) cả 3 daemon T9 chết giữa chừng (sampler mẫu cuối #125 22:32:47Z guest-time, live 22:32:18Z, B2 watcher spike cuối #125 22:13:42Z); (c) driver gốc (chờ probe close 22:50Z) chết theo reboot — T9 viết driver close #2 (`t9-197-close2.sh`) và khởi động lại 3 daemon 22:34:12Z + probe tay 22:34:02Z (boot+81s, = 30.000 CAP — BẮT ĐƯỢC cửa sổ, xem §1.2) + đóng sổ lần 2 thành công 23:15:00Z; (d) journal #125 mất hoàn toàn sau reboot — ENOSPC #125 chỉ còn 74 đếm trực tiếp (cận dưới, xem §4); (e) probe close gốc 22:50Z KHÔNG chạy (driver chết) — thay bằng probe close2 23:15:00Z, TRỄ hơn kế hoạch 25 phút nhưng vẫn trong hạn cứng. **T10/parent lưu ý:** mọi số T9 đợt này chia 2 boot; các chuỗi "toàn phiên" phải đọc theo từng boot, không gộp mù.
- **F-197-T9-4 — LỆCH ĐỒNG HỒ GUEST TIẾP DIỄN (nối F-196-T9-4).** Mẫu sampler cuối #125 ghi 22:32:47Z — SAU btime boot mới 22:32:41Z. Đồng hồ guest chạy nhanh dần (~0,25 s/phút, không NTP hiệu chỉnh): offset về 0 sau reboot (T9 kiểm 22:36Z trên #126: guest_epoch − uptime − btime = −0,22 s, tức offset ~0). Hệ quả đo được: (i) gap sampler qua reboot tính bằng guest-time = 85 s, tính bằng true-time ~55–60 s (chênh lệch không ảnh hưởng kết luận nào khác); (ii) probe postboot 22:34:02Z (đồng hồ mới, offset 0) = boot+81s — kết luận bắt được cửa sổ ĐỨNG; (iii) 2 mẫu CEIL trên #125 (sampler 22:32:47Z, live 22:32:18Z guest-time) có true-time sớm hơn ~6–30 s, vẫn trong đời #125 — kết luận pin quay lại trên #125 ĐỨNG. T9 ghi nhận là lệch mẫu đồng hồ, không suy ra nguyên nhân chắc chắn (cần kiểm NTP/chrony đợt sau).
- **F-197-T9-5 — DÒNG HEADROOM MID-197 GHI ĐÚP TRONG LOG (nhẹ, không đổi số).** `headroom-log.txt` có dòng `mid-197 … headroom=0` HAI lần (22:00:01Z): probe-once.py tự ghi vào file VÀ driver redirect stdout của nó vào cùng file. Chỉ là trùng lặp trình bày — số đo chỉ tính 1 lần. Đợt sau sửa probe-once.py KHÔNG tự ghi file khi driver đã redirect (hoặc driver không redirect stdout).
- **F-197-T9-6 — T4-197 ĐẾM B2 ĐÚNG (KHÔNG PHẢI LỖI — GHI NHẬN ĐỂ TRÁNH ĐÍNH CHÍNH SAI).** T4 ghi "Tổng spike trong log T9: 135 … log dừng ở 21:15:40Z" — T9 kiểm lại: đúng 135 spike có ts ≤ 21:34:44Z (lúc poller T4 thoát) và đúng 0 spike trong 21:15:40–21:34:44Z. 14 spike còn lại (tổng 149) xảy ra SAU khi T4 đóng (21:34:44–22:13:42Z). T4 đếm ĐÚNG theo thời điểm đóng cờ — KHÔNG đính chính.
- **F-197-T9-7 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; probe postboot chạm cap 30.000 nhưng chỉ tạo thư mục tạm rồi xóa ngay, không đè lên cửa yên nào — T4 đã đóng cờ từ 21:34Z, probe chạy 22:34:02Z; probe close2 chạy 23:15:00Z khi mọi luồng đã đóng); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG ~23:20Z — QUÁ hạn cờ ~23:00Z nhưng TRONG hạn cứng 23:35:51Z** (do reboot + runtime restart, xem F-197-T9-3). Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: parent (p)-196 đã quyết đợt 196 0 vi phạm (chuỗi 0 → 1); đợt 197 có nối lên 2 hay không thuộc T10/parent (cần verdict của TẤT CẢ luồng).

- **Caveat đứng:** probe cap 30.000 (giá trị mở là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 975 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #125 từ cell vì journal cũ mất sau reboot (chỉ còn 74, cận dưới); T10 không đếm lại độc lập B2 đợt 197 (chỉ đọc log đóng băng); lượt yên #65 / live-check #16 / FULL PASS thuộc T4/T8/T10 + parent; số hiệu #126 + (m) #126 + POSTBOOT_PASS #126 thuộc T01-198/T2-198/T56-198 + parent; E-247 mở lại hay không thuộc parent (T9 chỉ đề xuất theo điều kiện (h)-196).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (153 mẫu, 20:41:43–23:14:13Z, hai boot #125/#126): `hidden_files/round197-t9/ram-sampler-FROZEN.log` — md5 `f44810b5e94f22ef0ebcf46b16177f98`. Log B2 đóng băng (149 spike): `hidden_files/round197-t9/b2-spikes-FROZEN.log` — md5 `f3d1dd5448db5514bf3432691a8f90dc`. Log headroom đóng băng (4 lần đo): `hidden_files/round197-t9/headroom-log-FROZEN.txt` — md5 `12ab34c30c24a21ccecad2ae64b49ed1`. Log live auto-trigger đóng băng (151 mẫu): `hidden_files/round197-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `700f7c2f441ca6aca1363d9c6dfbf8f1`. Phân tích: `t9-197-analyze.py` (output `t9-197-analyze-output.txt`) + `t9-197-b2-analyze.py` (output `t9-197-b2-analyze-output.txt` — lưu ý: script analyze RAM còn chứa cửa sổ mẫu cứng đợt 193 ở cuối output (n=0); các số theo cửa sổ T4-197 trong LIMITS này đếm TRỰC TIẾP từ log đóng băng). Baseline: `t9-197-baseline-notes.md`. Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). Driver gốc: `t9-197-driver.sh` (chết theo reboot 22:32:41Z); driver close #2: `t9-197-close2.sh` (output `close2-driver.out`). T10 đọc log đóng băng trực tiếp khi cần.
