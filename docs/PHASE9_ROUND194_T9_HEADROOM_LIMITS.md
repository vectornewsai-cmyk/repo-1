# LIMITS — Phase 9 đợt 194, T9: headroom toàn 0 (4 probe, 2 boot) + balloon GHIM TRẦN TRỞ LẠI trên #120 (5 mẫu CEIL liên tiếp, ghim qua reboot) + sàn 6.050.608 kB trúng 1 lần (đầu tiên kể từ đợt 188) + ENOSPC #119 88 (cận dưới, ~93 ước tính) + #120 23 (chuỗi đợt có lỗi thật 41 → 42) + auto-trigger live 123 mẫu 0 FIRE (tổng 604) + live-check #13 KHÔNG THỂ KIỂM

## 0. Tóm tắt

- **HEADROOM: 4 lần đo, toàn 0.** open/mid trên #119 + postboot/close trên #120, trần inotify **63.737 KHÔNG ĐỔI**. Cửa sổ thoáng #119 KHÔNG QUAN SÁT ĐƯỢC (đã qua trước khi mở phiên); cửa sổ #120 KHÔNG BẮT ĐƯỢC (probe +98s = 0, trễ ~6s so với mốc +92s giả định).
- **BALLOON GHIM TRẦN TRỞ LẠI — TRÊN BOOT #120 (E-247: ghim CÓ kéo dài qua reboot).** #119: 0 mẫu CEIL (balloon tụt dần 6,25M → 2,76M). #120: **5 mẫu CEIL liên tiếp 04:37:03–04:41:03Z** (boot+13m38s–17m38s); sau đợt ghim, balloon hạ 1 mẫu đúng sàn rồi leo lại ≥6,0M tới lúc đóng (chưa ghim lại trần lúc đóng). **Sàn 6.050.608 kB: 1 lần đúng bằng giá trị sàn (04:42:03Z) — lần đầu kể từ đợt 188; chuỗi 0 lần GIỮ 11 ĐỨT** (số chuỗi mới thuộc T10/parent). Sag 6.247.216 kB: 0 lần — tổng GIỮ 3. Balloon = 0: 0 lần.
- **ENOSPC: #119 = 88 dòng đếm trực tiếp lúc 04:17:24Z (CẬN DƯỚI, journal mất sau reboot; ngoại suy ~93 lúc reboot — GHI RÕ LÀ ƯỚC TÍNH) + #120 = 23 dòng lúc 04:50:58Z (vẫn tăng). Chuỗi đợt có lỗi thật 41 → 42.**
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 3.086.752 kB. **0 lần chạy birefnet — lần thứ 47 liên tiếp.**
- **Auto-trigger: LIVE 123 mẫu đợt này, tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **604 mẫu (481 tới hết đợt 193 + 123 đợt 194), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA.
- **REBOOT GIỮA ĐỢT 04:23:25Z (F-194-T9-3):** #119 chết sau 5.717 s (1h35m17s); #120 sinh ra. Giết cả 3 daemon T9 + lệnh đóng sổ nền đang sleep (SIGTERM) — T9 phát hiện reboot 04:24:27Z, probe tay TRONG/MÉM cửa sổ thoáng 04:25:03Z (boot+98s, = 0), khởi động lại 3 daemon 04:25:03Z. Gap đo: sampler 103 s, live 111 s, B2 ~3 phút.
- **RAM: 123 mẫu, 02:47:11–04:50:03Z, HAI boot (#119 n=97, #120 n=26).** Max **3.086.752 kB**; min **475.204 kB**; mean 1.517.789,7 kB; gate A **94/123**. Load1 <4,0: 105/123 mẫu chính (85,4%).
- **Lượt yên #62 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt** (attempt1 20/20 nhưng B1+B2 VI PHẠM + median 220,0 ms; attempt2 20/20 nhưng B1+B2 VI PHẠM + median 75,0 ms; attempt3 20/20 + B 5/5 nhưng median 61,0 ms > 60, thiếu 1,0 ms — đúng bằng mức thiếu attempt2-193) — chuỗi lượt yên hợp lệ GIỮ 0. **Kiểm chứng live lần 13: KHÔNG THỂ KIỂM** (không có cửa sổ attempt hợp lệ nào để đối chiếu) — chuỗi live ĐẠT GIỮ 9 (đề xuất; tiền lệ đợt 188 + quyết (p)-192).
- **B2: 342 spike THẬT (tất cả trên #119; 0 spike trên #120)** — 68 spike trong attempt1, 37 spike trong attempt2, 0 spike trong attempt3 — KHỚP T4 từng số; load1 đỉnh watcher **15,11**. Xem §2.5.
- **0 VI PHẠM phía T9. T9 đóng 04:50:58Z (probe close), TRONG hạn cờ ~05:00Z.** Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–193 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Gate-check trong probe-loop.sh (bài học F-191-T10-2) vẫn chạy — probe mid-194 trùng đuôi attempt2 ~4 s (xem F-194-T9-2); probe close-194 qua gate-check sạch (cả 3 attempt đều có attempt-done).

### 1.2 Số đo đợt 194 (4 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 02:47:24Z | **0** | #119 55c9e0b7 | 63.737 | probe open-194 (boot+19m16s) |
| 03:33:16Z | **0** | #119 | 63.737 | probe mid-194 (boot+1h05m08s; trùng đuôi attempt2 — xem F-194-T9-2) |
| **04:25:03Z** | **0** | **#120 ac8a88aa** | 63.737 | **probe postboot-194 (boot+98s — TRỄ ~6s so với mốc +92s)** |
| 04:50:58Z | **0** | #120 | 63.737 | probe close-194 (boot+27m33s) |

- **CỬA SỔ THOÁNG #119: KHÔNG QUAN SÁT ĐƯỢC.** Boot btime 02:28:08Z (T01-194 xác minh 9 nguồn tươi); cửa sổ boot+61–92s = 02:29:09–02:29:40Z đã đóng ~18 phút trước khi T9 mở phiên (~02:47Z). Như #117 đợt 193.
- **CỬA SỔ THOÁNG #120: KHÔNG BẮT ĐƯỢC — TRỄ ~6 GIÂY.** Boot btime 04:23:25Z (/proc/stat btime 1795667005; uptime 61,70 s lúc 04:24:27Z; journal first entry 04:23:38Z = btime+13s); cửa sổ giả định = 04:24:26–04:24:57Z. T9 phát hiện reboot lúc 04:24:27Z (uptime 62 s) nhưng probe tay chạy lúc 04:25:03Z (**boot+98s, trễ 6 s sau mốc +92s**) — **headroom = 0**. Cửa sổ đóng trong khoảng +92–98s (mốc +92s là giả định theo đợt 193; ENOSPC đầu tiên trên #120 lúc +115s — xem §4 — phù hợp: watch đầy trước +98s, lần thử add-watch thất bại đầu tiên ghi log lúc +115s). Khác đợt 193 (#118 bắt được ở +81s): lần này T9 phát hiện reboot chậm hơn ~1 phút do lệnh đóng sổ nền đang sleep bị SIGTERM (F-194-T9-3) — bài học: tiến trình phát hiện reboot phải là daemon/poll riêng, không ngủ trong cùng phiên exec.
- **Headroom cuối phiên: 0.** Trần **KHÔNG ĐỔI trong đợt (63.737 cả 4 lần đo, 2 boot)**.
- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (0)** — nhưng dữ kiện đợt 193 đứng nguyên: headroom KHÔNG phải lúc nào cũng 0 — sau mỗi reboot có một cửa sổ thoáng ngắn (~1–2 phút). Đề xuất T9 đợt 193 (probe ngay khi phát hiện reboot) đã làm được ở #120 nhưng trễ 6 s — các đợt sau cần phát hiện reboot trong <60 s.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 123 mẫu, 02:47:11–04:50:03Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 103 s** (reboot 04:23:25Z — mẫu cuối #119 04:23:20Z → mẫu đầu #120 04:25:03Z); các gap còn lại **≤61 s** (jitter bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 02:47:11–03:33:20Z | #119 | 669.028–3.086.752 kB | Mở sampler; balloon 6,15M → 2,76M (tụt dần); **attempt1/2 T4**; O8 T01 03:12:26–03:17:31Z |
| 03:33:20–04:23:20Z | #119 | 669.028–2.400.000 kB | **Attempt3 T4 03:36:52–03:40:34Z (0 spike B2)**; harness T8 (xem LIMITS T8-194); RAM <512k: 0 mẫu |
| 04:23:25Z | — | — | **REBOOT → #120** (sampler chết; gap 103 s) |
| 04:25:03–04:50:03Z | #120 | 475.204–1.665.396 kB | Boot mới: balloon đã 5,16M từ mẫu đầu; ≥6,0M từ 04:32:03Z (17 mẫu); **GHIM TRẦN 5 mẫu** (04:37:03–04:41:03Z — xem §2.2); gate A 6/26; **RAM <512k: 6 mẫu** |

- **Gate A ≥1024 MiB: 94/123 mẫu** (88/97 #119; 6/26 #120); **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **14,84** (#119 — trong attempt1; #120: 2,50); load1 <4,0: **105/123 mẫu chính (85,4%)** — đợt 193 là 122/130 (93,8%), đợt này máy bận hơn hẳn trên #119 (attempt1 lạ-tải, load1 đỉnh 15,11); **RAM <512.000 kB: 6 mẫu** (tất cả trên #120, 1 dải 6 mẫu 04:36:03–04:41:03Z, trùng đợt ghim trần); **RAM <300.000 kB: 0 mẫu**.
- Swap: #119 SwapFree 710.040 kB (mẫu đầu) → 597.008 kB (mẫu cuối) — giảm **113.032 kB**; #120 SwapFree 1.017.820 kB (mẫu đầu, boot tươi) → 635.056 kB (mẫu cuối) — giảm **382.764 kB chỉ trong 25 phút** (xả swap nhanh trên boot mới — như #118 đợt 193: −325.988 kB/28 phút; xem F-194-T9-5).
- Trũng RAM đợt này: min **475.204 kB (04:40:03Z, #120, balloon ghim trần 6.443.824)** — sâu hơn min 487.772 kB đợt 193. 6 mẫu <512.000 kB, 1 dải 6 mẫu: 04:36:03–04:41:03Z.

**Bảng tổng hợp số RAM (từ script `t9-194-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 123 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #119 55c9e0b7 | 97 | 669.028 | 3.086.752 | 1.694.224,0 | 88/97 | 0 | 14,84 | 0 |
| #120 ac8a88aa | 26 | 475.204 | 1.665.396 | 859.553,7 | 6/26 | 5 | 2,50 | 6 |
| **Toàn phiên** | **123** | **475.204** | **3.086.752** | **1.517.789,7** | **94/123** | **5/123 (4,1%)** | **14,84** | **6** |

- **Mean toàn phiên 1.517.789,7 kB — 2 cách độc lập: python `sum/n = 1.517.789,7` VÀ kiểm có trọng số của script (in `t9-194-analyze-output.txt`) — KHỚP CẢ HAI.** Mean cao hơn đợt 193 (1.247.974,8 kB) vì #119 (97 mẫu) thoáng hơn #118 đợt trước (mean 800.296,4 kB).

### 2.2 Balloon virtio — GHIM TRẦN TRỞ LẠI TRÊN #120 (5 mẫu CEIL liên tiếp); #119 0 mẫu ghim

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — ĐƯỢC XÁC NHẬN LẠI** (5 mẫu đo đúng bằng trần này trên #120, cả 2 sampler độc lập — live sampler bắt cùng 5 mẫu, lệch 1 s).
- **Boot #119: GHIM 0/97 mẫu (0%) — KHÔNG CÓ episode nào. Boot #120: GHIM 5/26 mẫu (19,2%).**
- **Episode ghim #120 (mới — ghim kéo dài qua reboot so với #118):** balloon leo từ mẫu đầu 5.157.956 kB (boot+98s); **17 mẫu ≥6,0M** (04:32:03–04:50:03Z); **đợt ghim: 5 mẫu liên tiếp 04:37:03–04:41:03Z** (avail 475.204–660.000 kB, load1 0,34–1,20 — máy NHÀN lúc ghim); hạ 1 mẫu đúng sàn (04:42:03Z 6.050.608 — xem dưới); leo lại ≥6,0M từ 04:44:03Z tới lúc đóng (04:50:03Z 6.324.884, chưa ghim lại trần lúc đóng). Tổng 5 mẫu CEIL trong 4 phút, 1 đợt ghim.
- **E-247 — GHIM CÓ KÉO DÀI QUA REBOOT (trả lời câu hỏi (1) của T9-194).** Episode #118 (13 mẫu CEIL, 2 đợt ghim, vẫn ghim lúc T9-193 đóng 22:51:55Z) → #119 KHÔNG ghim (0/97 mẫu, balloon tụt về 2,76M) → **#120 ghim trở lại (5 mẫu CEIL, 1 đợt ghim)**. Ghim không liên tục qua từng boot (có 1 boot "nghỉ" #119 ở giữa), nhưng mẫu ghim quay lại ngay boot sau — host bơm balloon theo chu kỳ, không phải sự kiện một lần. T9 KHÔNG tự phán kết cục mới của E-247 (thuộc parent/T10); T9 chỉ báo dữ kiện: episode #120 bắt đầu 04:37:03Z (boot+13m38s), dài 5 mẫu; avail lúc ghim 475–660 MB; load1 ~0,3–1,2; 0 mẫu ≥ guard trong suốt episode nên auto-trigger 0 FIRE là đúng.
- **Xác minh độc lập 2 sampler:** live sampler bắt **cùng 5 mẫu CEIL** (04:37:03–04:41:03Z, lệch 1 s so với sampler chính — hai tiến trình lấy mẫu độc lập, cùng đọc `/proc/meminfo`) — loại trừ lỗi đọc/ghi của một sampler. Avail lúc ghim ~475–660 MB, load1 ~0,3–1,2 (máy NHÀN) — balloon ghim do host bơm, không phải do tải guest (xem F-194-T9-4).
- **Balloon = 0: 0 lần đợt này** (như đợt 192/193). Balloon min đợt này: 2.764.932 kB (#119).
- **Sàn balloon 6.050.608 kB: 1 lần đợt này — CHUỖI 0 LẦN GIỮ 11 ĐỨT.** Mẫu 04:42:03Z trên #120 đúng bằng 6.050.608 kB (ngay sau đợt ghim 5 mẫu CEIL, balloon hạ từ trần về đúng sàn rồi leo lại). Lần đầu trúng sàn kể từ đợt 188 (1 lần, "lần 11" theo ghi chú đợt 193).
- **Giá trị sag 6.247.216 kB: 0 lần đợt này** (tổng giữ 3: đợt 187: 2 lần; đợt 188: 1 lần). Lưu ý: giá trị balloon đọc tay lúc mở phiên 02:45Z là 6.247.216 kB — đúng bằng sag — nhưng đó KHÔNG phải mẫu sampler (đọc tay ngoài sampler, không tính vào chuỗi; mẫu sampler đầu tiên 02:47:11Z đã là 6.148.736 kB trở xuống).

### 2.3 Lượt yên WebKit #62 (T4) — KHÔNG CÓ LƯỢT HỢP LỆ, 0/3 attempt (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#62 KHÔNG CÓ LƯỢT HỢP LỆ — T4 dùng hết 3/3 attempt, 0 hợp lệ.** Chuỗi lượt yên hợp lệ: **GIỮ 0** (đã ĐỨT ở #60, không có lượt hợp lệ mới).
- **Attempt1 (02:54:12–03:00:46Z): 20/20 NHƯNG B1+B2 VI PHẠM (load1_max 15,11) + tickCost median 220,0 ms — KHÔNG hợp lệ.** T9 đối chiếu độc lập: **68 spike B2** trong cửa sổ (KHỚP ĐÚNG số T4 — T4 ghi "68 spike", load1_max 15,11); sampler T9 trong cửa sổ n=7, gate A 7/7.
- **Attempt2 (03:29:23–03:33:20Z): 20/20 NHƯNG B1+B2 VI PHẠM (load1_max 5,64) + tickCost median 75,0 ms — KHÔNG hợp lệ.** T9 đối chiếu: **37 spike B2** trong cửa sổ (KHỚP ĐÚNG số T4); sampler n=4, gate A 4/4. T4 ghi attempt2 tự-tải là chính (probe chiếm ~77% CPU).
- **Attempt3 (03:36:52–03:40:34Z): 20/20 + LỚP B ĐẠT 5/5 NHƯNG tickCost median 61,0 ms > 60 (thiếu 1,0 ms — đúng bằng mức thiếu attempt2-193) — KHÔNG hợp lệ.** T9 đối chiếu: **0 spike B2** trong cửa sổ (KHỚP ĐÚNG số T4); sampler n=4, gate A 4/4.
- **Kiểm chứng live lần 13: KHÔNG THỂ KIỂM** (T9 đề xuất; parent quyết cuối — T4 đồng ý mẫu đợt 193) — không có cửa sổ attempt hợp lệ nào để đối chiếu 0-spike/0-FIRE; live autotrigger chạy suốt cả 3 cửa sổ attempt, 0 FIRE trong cả 3. **Chuỗi live ĐẠT GIỮ 9** (định nghĩa đứng quyết (p)-192: live-check CHỈ đối chiếu trên cửa sổ attempt HỢP LỆ).
- **Labellag (b): attempt1 4 occ / 1 event; attempt2/3: 0 occurrence / 0 event** (T4) — nhưng không có lượt hợp lệ nên chuỗi GIỮ 0 (quyết (m)-192: tính theo LƯỢT HỢP LỆ).

### 2.4 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 03:12:26–03:17:31Z | #119 | 0,64–4,46 (5 mẫu) | 1.100.000–2.900.000 kB — **gate A 5/5** | **O8 T01** (xem LIMITS T01-194); 0 mẫu ghim |
| T4 attempt1 02:54:12–03:00:46Z | #119 | 1,52–15,11 (7 mẫu) | 1.300.000–2.400.000 kB — **gate A 7/7** | **68 spike B2** (khớp T4); B1+B2 vi phạm; 0 mẫu ghim |
| T4 attempt2 03:29:23–03:33:20Z | #119 | 0,39–5,64 (4 mẫu) | 1.900.000–2.400.000 kB — **gate A 4/4** | **37 spike B2** (khớp T4); B1+B2 vi phạm; 0 mẫu ghim |
| T4 attempt3 03:36:52–03:40:34Z | #119 | 0,64–1,89 (4 mẫu) | 1.900.000–2.200.000 kB — **gate A 4/4** | **0 spike B2**; median 61,0 ms > 60; 0 mẫu ghim |

- T01-194: **#119 XÁC NHẬN 9 nguồn TƯƠI** (btime 02:28:08Z, gap #118→#119 = 14.773 s — dài thứ hai chuỗi gần đây); O8 03:12:26–03:17:31Z trên #119; **POSTBOOT_PASS #119 CÓ 02:50:55Z** (T56-194; GST #119 là SYMLINK → debroot, 269 file — giống #115, caveat NẶNG HƠN #117); marker sống qua **70 reboot #49–#118** (71 nếu #119 xác nhận); (m) #118 THÔ +43,80 s (T2-194 phán cuối); run 197 SUCCEEDED, run hiện tại 8256daf7 = run 198 (sched 02:35:51Z = btime +463 s).
- T8-194: xem LIMITS T8-194 (harness/O8/B2/V2/V4 trên #119 — T9 không phán thay).
- **(m) #119 + POSTBOOT_PASS #120 thuộc T2-195/T56-195** (ghi chú giữa đợt của parent) — T9 KHÔNG tính, KHÔNG phán; chỉ ghi số thô nếu chạm tới (đợt này T9 không chạm tới cái nào).

### 2.5 B2 — 342 spike THẬT; 68/37/0 spike trong 3 attempt (khớp T4 từng số)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **342 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 342): tất cả trên #119, 0 trên #120** (load1 sau reboot ≤2,50, không chạm ngưỡng 3,0); **load1 đỉnh đợt (watcher, cadence 2 s): 15,11** (khớp load1 max sampler 14,84 — watcher bắt đỉnh cao hơn do cadence 2 s; đợt 193: 9,44).

| Nhóm (comm đứng đầu) | n | Ghi chú |
|---|---|---|
| ps | 179 | Watcher tự bắt chính mình (xem F-194-T9-5 — đảo ngược đợt 193: 1/249) |
| WebKitWebProces | 48 | Harness/O8 WebKit + attempt T4 |
| MainThread | 44 | comm `MainThread`, chưa xác định chắc là tiến trình nào (ghi theo comm) |
| chrome | 31 | Tải trình duyệt (O8/harness + luồng sản phẩm) |
| hatch | 23 | Tải nền tảng (cùng mẫu các đợt trước) |
| find | 4 | Lệnh shell ngắn |
| ffmpeg | 4 | Luồng sản phẩm (render/proxy) |
| bash | 2 | Lệnh shell ngắn |
| privsep-test-fu | 2 | Lẻ tẻ |
| npm | 2 | Lẻ tẻ |
| esbuild | 2 | Lẻ tẻ |
| python3 | 1 | Lẻ tẻ |

Tổng 179+48+44+31+23+4+4+2+2+2+2+1 = 342 — KHỚP. Phân theo giờ: 02:xx 67 spike; 03:xx 242 spike; 04:xx 33 spike. Spike đầu 02:47:49Z (load1 4,41 — ngay mẫu mở phiên); spike cuối 04:16:28Z (load1 3,20 — trước reboot).

- **68 spike trong attempt1** (02:54:12–03:00:46Z — load1max 15,11); **37 spike trong attempt2** (03:29:23–03:33:20Z — load1max 5,64); **0 spike trong attempt3** (03:36:52–03:40:34Z). Ngoài các cửa sổ trên: 237 spike.
- **Khoảng mù watcher: ~103 s do reboot** (04:23:20Z–04:25:03Z — watcher chết theo reboot, 0 spike ghi trong gap vì KHÔNG CÓ watcher, không phải vì máy yên; xem F-194-T9-3). Ngoài gap đó watcher chạy liên tục, không reboot trong phiên đo của nó (trừ reboot 04:23:25Z).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-193; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 3.086.752 kB (live, #119); live log max 1.665.396 kB trên #120. **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 47 liên tiếp (147–194).**
- **QUYẾT (o) §14.2-193: AUTO-TRIGGER GIỮ LIVE.** Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-194:** live đã bật từ đợt 189 nên đợt này là TIẾP TỤC, không flip mới — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 193 §14.2 (o) (56.830 B); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189/191/192/193; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 193 (test offline 17/17 PASS đợt 188, không chạy lại). Khởi động lần 1 đúng ngay 02:47:41Z (pid 4607, env + `--live`, round_dir=autotrigger-live — rút kinh nghiệm F-193-T9-7); **khởi động LẠI 04:25:03Z (pid 1903) sau reboot** — cùng tham số (xem F-194-T9-7).
- **LIVE PHASE ĐỢT 194: 123 mẫu, 02:47:11–04:50:03Z (97 #119 + 26 #120), TẤT CẢ `trigger=watch consec=0`, max avail 3.086.752 kB (#119) / 1.665.396 kB (#120), load1 <4,0: 105/123 (85,4%) — #119 79/97, #120 26/26 — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `autotrigger-live/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Mẫu live đầu 02:47:11Z; live chạy suốt cả 3 cửa sổ attempt T4, 0 FIRE trong cả 3.
- **TỔNG LIVE TỪ 03:14Z 25/11: 604 mẫu (481 tới hết đợt 193 + 123 đợt 194), 0 FIRE.** Khoảng mù live: **(a) giữa đợt ~3h55m** (22:51:54Z 25/11 → 02:47:11Z 26/11 — live đợt 193 bị kill lúc T9-193 đóng sổ; không có mẫu live nào; cũng không thể có FIRE vì không có tiến trình live nào để fire); **(b) do reboot 111 s** (04:23:12Z → 04:25:03Z — live chết theo reboot, khởi động lại ngay khi T9 phát hiện). Trong cả hai khoảng mù, guard có mở hay không là KHÔNG BIẾT (không sampler nào chạy) — nhưng cũng không thể có FIRE (không có tiến trình live nào để fire; không có file trigger/flag nào trên đĩa từ các khoảng đó).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 604 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 47 đợt). **Lưu ý mới:** balloon GHIM TRẦN 5 mẫu trên #120 NHƯNG avail lúc ghim chỉ 475–660 MB — guard đo bằng MemAvailable, không phải balloon; ghim balloon không mở guard. Auto-trigger 0 FIRE trong suốt episode ghim là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 193); không có thư mục `~/workspace/tmp-t9-194-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round194-t9/` (live chạy 123 mẫu, 0 sự kiện).

## 4. ENOSPC trong journal (đếm trực tiếp — #119 MẤT journal sau reboot; #120 vẫn tăng lúc đóng)

- **#119: đếm trực tiếp 88 dòng lúc 04:17:24Z (lần đếm cuối trước reboot) — CẬN DƯỚI** — dòng đầu **02:36:59Z (boot+531s)** — CHẬM HẲN mẫu ~110s các boot trước (#118: +118s; #117: +113s; #116: +106s; #115: +109s; #111: +117s; #110: +106s; xem F-194-T9-1); dòng cuối lúc đếm **04:17:09Z**. Cả hai grep đều 88 lúc đó — KHỚP. **88 là CẬN DƯỚI** (journal mất sau reboot 04:23:25Z — `journalctl --list-boots` sau reboot chỉ còn boot #120; không đếm lại được #119). Ngoại suy theo nhịp đo được (~0,88 dòng/phút × ~6 phút từ 04:17:24Z tới reboot): **~93 dòng lúc reboot — GHI RÕ LÀ ƯỚC TÍNH, không phải số đếm** (phương pháp chuẩn điểm (5)).
- **Đếm giữa phiên #119 (bài học F-187-T9-5 — đếm ở MỖI lần kiểm):** 9 dòng lúc ~02:47Z → 50 lúc 03:33:16Z → 88 lúc 04:17:24Z → **mất journal sau reboot (không đếm tiếp được)**. Nhịp đều ~0,88 dòng/phút cả phiên — **KHÔNG dừng giữa boot** (như #114 đợt 191, #115 đợt 192, #117/#118 đợt 193).
- **#120: đếm trực tiếp 23 dòng lúc 04:50:58Z** — dòng đầu **04:25:20Z (boot+115s)** — về lại mẫu ~110s; dòng cuối **04:50:32Z**. Cả hai grep đều 23 — KHỚP. Vẫn tăng lúc đóng (18 lúc 04:46:05Z → 23 lúc 04:50:58Z). Nhịp ~0,9 dòng/phút, cùng nhịp #119.
- **Tổng phiên (2 boot, đếm trực tiếp): 88 + 23 = 111 dòng (88 là cận dưới).** **Chuỗi đợt có lỗi thật: 41 → 42** (cả 2 boot đều có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-194 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#119: 88=88; #120: 23=23 — KHỚP cả hai); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (#119 ~93 — ước tính, xem trên); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Hai boot trong phiên (T9 bắt trực tiếp: 1 reboot; 2 boot đợt này)

- **#119 (55c9e0b7-2d97-4260-a6ca-45538e24b6c1, btime 02:28:08Z; số hiệu ỨNG VIÊN — T01-194 XÁC MINH 9 nguồn TƯƠI; parent quyết (e) ở aggregate 194).** Sampler T9 trên #119: 02:47:11–04:23:20Z (97 mẫu). Gap #118→#119 = **14.773 s** (T01-194). #119 sống **5.717 s (1h35m17s)** rồi chết 04:23:25Z.
- **#120 (ac8a88aa-273d-42ef-a100-fc02ad143df4, btime 04:23:25Z; số hiệu ỨNG VIÊN — T01-194 đóng cờ TRƯỚC reboot nên chưa xác minh boot này; parent quyết (e)).** Sampler T9 trên #120: 04:25:03–04:50:03Z (26 mẫu). Gap #119→#120 = **6.917 s** (T8-194; parent tự kiểm who -b 04:23). **(m) #119 + POSTBOOT_PASS #120 thuộc T2-195/T56-195** (ghi chú giữa đợt của parent) — T9 không phán.
- **Khoảng mù giữa hai đợt: ~3h55m không sampler T9** (22:51:54Z 25/11 → 02:47:11Z 26/11 — chứa reboot #119 + cửa sổ thoáng #119 + toàn bộ khoảng mù live giữa đợt). **Khoảng mù trong phiên do reboot: 103 s sampler chính / 111 s live / ~3 phút B2 watcher** (04:23:12Z → 04:25:03Z).

### 5.2 Các luồng khác — P1/P2/P3/P4/T01/T2/T4/T56/T7/T8 đã đóng cờ

- T01-194 ĐÃ đóng: #119 XÁC NHẬN 9 nguồn TƯƠI; O8 03:12:26–03:17:31Z; (m) #118 THÔ +43,80 s (T2-194 phán cuối); POSTBOOT_PASS #119 CÓ 02:50:55Z. T2-194 ĐÃ đóng: xem LIMITS T2. T4-194 ĐÃ đóng: #62 0/3 hợp lệ (xem §2.3). T56-194 ĐÃ đóng: POSTBOOT_PASS #119; #120 CHƯA CÓ (đóng cờ trước reboot). T7-194 ĐÃ đóng: xem LIMITS T7 (kết cục run 198). T8-194 ĐÃ đóng: xem LIMITS T8.
- **POSTBOOT_PASS #120 CHƯA CÓ** (T56-194 đã đóng cờ trước reboot 04:23:25Z; watcher-194 chết theo reboot; replay/watcher trên boot mới thuộc T56-195).

## 6. Sai số / caveat (F-194-T9-*)

- **F-194-T9-1 — ENOSPC ĐẦU TIÊN TRÊN #119 CHẬM HẲN: boot+531s (02:36:59Z), phá mẫu ~110s của 7 boot trước.** Journal first entry 02:28:27Z (btime+19s) — không có dòng ENOSPC nào trong 8m51s đầu boot. Cả 8 dòng đầu đều từ `home-assistant-ensure.service` (thử add-watch định kỳ ~70 s). Giải thích khả dĩ nhất: boot này ít tiến trình xin watch sớm (watch table đầy muộn hơn) — hoặc host-side watch accounting khác đi. T9 ghi nhận là lệch mẫu, không suy ra nguyên nhân chắc chắn. #120 về lại mẫu ~110s (dòng đầu boot+115s) nên lệch này chỉ xảy ra trên #119.
- **F-194-T9-2 — PROBE mid-194 TRÙNG ĐUÔI ATTEMPT2 T4 ~4 GIÂY.** Probe mid-194 chạy 03:33:16Z; attempt-done-attempt2 mtime 03:33:20Z (attempt2 03:29:23–03:33:20Z). T9 chạy probe-once.py trực tiếp mà KHÔNG qua gate-check (chỉ kiểm gate trước probe open-194). Tác động: KHÔNG — probe là ctypes inotify nhẹ, headroom 0 nên fail gần như ngay ở watch đầu, không tạo tải; attempt2 vốn đã RETRY do B1+B2 vi phạm nhiễm tải (load1_max 5,64; T4 ghi tự-tải là chính, probe T4 chiếm ~77% CPU) — probe T9 không đóng góp. Bài học: MỌI probe đều phải qua `wait_gate` (probe-loop.sh), không chỉ probe mở phiên; probe close-194 đã qua gate-check sạch.
- **F-194-T9-3 — REBOOT 04:23:25Z GIẾT CẢ PHIÊN T9 + LỆNH ĐÓNG SỔ NỀN (lần thứ ba liên tiếp reboot cắt ngang phiên T9 — đợt 192, 193, 194).** Boot #119 chết sau 5.717 s; boot #120 btime 04:23:25Z (parent tự kiểm who -b 04:23, uptime 22 phút lúc 04:45Z — KHỚP). Hệ quả trực tiếp: (a) lệnh đóng sổ nền (đang sleep chờ 04:50Z) bị SIGTERM giữa chừng — không có output, không phải lỗi script; (b) cả 3 daemon T9 chết giữa chừng (sampler mẫu cuối #119 04:23:20Z, live 04:23:12Z, B2 watcher spike cuối #119 04:16:28Z); (c) T9 phát hiện reboot 04:24:27Z (uptime 62 s), probe tay 04:25:03Z (boot+98s, = 0 — TRỄ 6 s so với mốc cửa sổ, xem §1.2), khởi động lại 3 daemon 04:25:03Z + đóng sổ lần 2 thành công 04:50:58Z; (d) journal #119 mất hoàn toàn sau reboot — ENOSPC #119 chỉ còn 88 đếm trực tiếp (cận dưới, xem §4); (e) cửa sổ thoáng #120 trượt do phát hiện reboot chậm ~1 phút (lệnh đóng sổ nền đang sleep bị giết — tiến trình phát hiện reboot phải là daemon/poll riêng). **T10/parent lưu ý:** mọi số T9 đợt này chia 2 boot; các chuỗi "toàn phiên" phải đọc theo từng boot, không gộp mù.
- **F-194-T9-4 — BALLOON GHIM TRẦN TRONG LÚC MÁY NHÀN (load1 ~0,3–1,2).** 5 mẫu CEIL trên #120 đều có load1 0,34–1,20, avail 475–660 MB; spike B2 0 trên #120; không attempt/harness nào chạy trên #120 trong lúc ghim (T4 xong 03:40Z trên #119; T8 mọi phép đo trên #119, chỉ viết LIMITS sau reboot — xem LIMITS T8-194 §6). Balloon ghim là hành vi host-side (host bơm balloon bất chấp guest nhàn), không phải do tải guest. Hệ quả đo được: avail guest bị ép xuống ~475 MB lúc sâu nhất nhưng vẫn trên 0; guard (6.291.456 kB) không mở; live 0 FIRE là đúng. Ghim quay lại chỉ 1 boot sau khi "nghỉ" (#119) — mẫu host bơm theo chu kỳ.
- **F-194-T9-5 — BOOT #120 XẢ SWAP NHANH + BALLOON LÊN NHANH (lặp lại mẫu #118 đợt 193).** Balloon đã 5.157.956 kB ở mẫu đầu (boot+98s), ≥6,0M từ 04:32:03Z (boot+8m38s), ghim trần từ 04:37:03Z (boot+13m38s); SwapFree −382.764 kB trong 25 phút (nhanh hơn #119: −113.032 kB trong 96 phút). So sánh: #119 balloon min 2.764.932 kB — boot mới thường bắt đầu thấp rồi leo dần; #120 bắt đầu đã cao (5,16M) và leo thẳng lên trần trong 14 phút. Đây là boot thứ ba có mẫu "lên nhanh" (#116 đợt 192 → #118 đợt 193 → #120 đợt 194); #117/#119 ở giữa lại lên chậm — mẫu xen kẽ, chưa có quy luật.
- **F-194-T9-6 — B2: `ps` 179/342 SPIKE (đảo ngược đợt 193: 1/249; gần đợt 192: 185/512).** `ps` 179 + `find` 4 + `grep` 0 + `bash` 2 = 185 spike có process đứng đầu là lệnh shell ngắn (54% — đợt 193: 43/249 = 17%). Tải đợt này nặng hơn hẳn (342 spike; load1 đỉnh 15,11 so với 9,44; 03:xx 242 spike) nên watcher bắn dày, tự-bắt nhiều hơn. Phần còn lại (WebKitWebProces 48 + MainThread 44 + chrome 31 + hatch 23 + ffmpeg 4 + lẻ tẻ = 154) là tải thật. 44 spike `MainThread` (chưa xác định chắc là tiến trình nào — ghi theo comm, như đợt 192/193).
- **F-194-T9-7 — KHỞI ĐỘNG LẠI LIVE SAU REBOOT ĐÚNG NGAY LẦN ĐẦU.** Khởi động lại 04:25:03Z với cả env `T9_AUTOTRIGGER_LIVE=1` + `--live` trong cùng một lệnh (rút kinh nghiệm F-193-T9-7) — live nhận ngay (`dry_run=False guard=6291456 consec=2`), không bị từ chối. Gap live do reboot chỉ 111 s (04:23:12Z → 04:25:03Z). Bài học đứng: lệnh khởi động live PHẢI gồm cả env + `--live` trong cùng một lệnh.
- **F-194-T9-8 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; probe postboot-194 chạm cap 30.000? KHÔNG — cả 4 probe đều 0, không probe nào chạm cap; không đè lên cửa yên nào vì T4 đã đóng cờ trước reboot, gate-check sạch); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG TRONG HẠN CỜ ~05:00Z (probe close 04:50:58Z).** Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: parent (p)-193 đã quyết VI PHẠM NHẸ (chuỗi 1 → 0 ĐỨT); đợt 194 có nối lên 1 hay không thuộc T10/parent (cần verdict của TẤT CẢ luồng).

- **Caveat đứng:** probe cap 30.000 (giá trị mở là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 604 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #119 từ cell vì journal cũ mất sau reboot (chỉ còn 88, cận dưới); T10 không đếm lại độc lập B2 đợt 194 (chỉ đọc log đóng băng); lượt yên #62 / live-check #13 / FULL PASS thuộc T4/T8/T10 + parent; số hiệu #120 + (m) #119 + POSTBOOT_PASS #120 thuộc T01-195/T2-195/T56-195 + parent; E-247 mở lại hay không thuộc parent (đã MỞ LẠI theo quyết (h)-193 — T9 chỉ báo episode mới trên #120).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (123 mẫu, 02:47:11–04:50:03Z, hai boot #119/#120): `hidden_files/round194-t9/ram-sampler-FROZEN.log` — md5 `9d20d1b4b6cfa409a5ebc86844b02d96`. Log B2 đóng băng (342 spike): `hidden_files/round194-t9/b2-spikes-FROZEN.log` — md5 `b31560c360504b42193aad6739005977`. Log headroom đóng băng (4 lần đo): `hidden_files/round194-t9/headroom-log-FROZEN.txt` — md5 `da0f288c5344747a60ab3bb5c2e8b43d`. Log live auto-trigger đóng băng (123 mẫu): `hidden_files/round194-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `69c5dcd5cbdbec06eab67b4dd51cd4b8`. Phân tích: `t9-194-analyze.py` (output `t9-194-analyze-output.txt`) + `t9-194-b2-analyze.py` (output `t9-194-b2-analyze-output.txt` — lưu ý: script b2 còn chứa cửa sổ mẫu cứng đợt 193 ở cuối output (n=0); các số theo cửa sổ T4-194 trong LIMITS này đếm TRỰC TIẾP từ log đóng băng bằng grep header-only). Baseline: `t9-194-baseline-notes.md`. Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). T10 đọc log đóng băng trực tiếp khi cần.
