# LIMITS — Phase 9 đợt 200, T9: headroom 0 CẢ 3 PROBE (1 boot, KHÔNG reboot giữa phiên) + E-247 VẪN MỞ (#130 GHIM 30 CEIL — chuỗi không-pin GIỮ 0) + ENOSPC #130 122 dòng + auto-trigger live 136 mẫu 0 FIRE (tổng 1.363) + live-check #19 ĐẠT (xác nhận độc lập)

## 0. Tóm tắt

- **HEADROOM: 3 lần đo, 1 boot, TẤT CẢ 0.** open 0 (#130, boot+18m09s) + mid 0 (boot+1h18m21s) + close 0 (boot+2h28m22s). Trần inotify **63.737 KHÔNG ĐỔI**. Cửa sổ thoáng postboot #130 (11:22:42–11:23:13Z) **KHÔNG QUAN SÁT ĐƯỢC** — T9 mở phiên lúc boot+~17m, cửa sổ đã đóng trước khi T9 có mặt (khác đợt 199: phát hiện đúng giây đầu cửa sổ nhưng probe trễ 6s).
- **BALLOON — E-247 VẪN MỞ: #130 GHIM 30 CEIL / 136 mẫu sampler + 30 / 136 mẫu live — HAI SAMPLER KHỚP TỪNG MẪU.** 6 đợt ghim (n=5+4+1+7+6+7), 12:51:41–13:45:42Z, khi máy GẦN NHƯ YÊN (load1 ≤0,20 ở 29/30 mẫu CEIL) — ghim host-side, như #129. **#130 LÀ BOOT CÓ PIN — chuỗi không-pin GIỮ 0 (đã 0 sau #129). GIỮ MỞ.**
- **Sàn 6.050.608 kB: 1 lần — tổng 1 → 2** (13:34:41Z). **Sag 6.247.216 kB: 1 lần — tổng 6 → 7** (13:17:41Z). Balloon = 0: 0 lần.
- **ENOSPC: #130 = 122 dòng lúc đóng 13:55:03Z (hai grep KHỚP 122=122), vẫn tăng lúc đóng. Chuỗi đợt có lỗi thật 46 → 47.** Dòng đầu 11:36:34Z = boot+893s — PHÁ mẫu ~110s lần thứ 2 (sau #128).
- **Guard: 0 mẫu ≥ guard 6.291.456 kB cả đợt** — max avail 3.312.644 kB (sampler chính) / 3.295.720 kB (live). **0 lần chạy birefnet — lần thứ 52 liên tiếp (147–200).**
- **Auto-trigger: LIVE 136 mẫu đợt này, tất cả consec=0, 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Tổng live từ 03:14Z 25/11: **1.363 mẫu (1.227 tới hết đợt 199 + 136 đợt 200), 0 FIRE.** Lần FIRE thật đầu tiên VẪN CHƯA XẢY RA.
- **KHÔNG REBOOT GIỮA PHIÊN — lần đầu sau 7 đợt liên tiếp reboot cắt ngang phiên T9 (192, 193, 194, 196, 197, 198, 199).** Một boot duy nhất #130 (c073c8bb) suốt phiên 11:39:38–13:54:42Z; gap đo lớn nhất 61 s (jitter bình thường); 0 daemon chết.
- **RAM: 136 mẫu chính + 136 mẫu live, 11:39:38–13:54:42Z, MỘT boot.** Max **3.312.644 kB**; min **271.976 kB** (13:29:41Z, CEIL, load1 0,08 — sâu thứ 2 từ trước tới nay, sau kỷ lục 253.436 kB đợt 197); mean 1.052.143,2 kB; gate A **56/136**. Load1 <4,0: 127/136 mẫu live (93,4%).
- **Lượt yên #68 (T4): HỢP LỆ (attempt1 20/20, lớp B ĐẠT 5/5, tickCost median 55,0 ms) — chuỗi lượt yên hợp lệ 0 → 1 (ĐỀ XUẤT). Kiểm chứng live lần 19: ĐẠT — T9 xác nhận độc lập (1 cửa sổ hợp lệ + 0 spike B2 + 3 mẫu live đều watch/consec=0, 0 FIRE, max avail 1.457.360 kB < guard) — chuỗi live ĐẠT 0 → 1 (ĐỀ XUẤT).**
- **B2: 162 spike THẬT (tất cả trên #130)** — W1 0 spike (khớp T4 từng số: tổng log lúc T4 đóng 99 spike — T9 đếm lại 99 spike ≤12:05:10Z); `ps` 0 lần đứng đầu (bộ lọc F-198-T9-5 HOẠT ĐỘNG); load1 đỉnh watcher **11,47**. Spike cuối 12:28:24Z — **sau 12:28:24Z không còn spike nào tới lúc đóng** (máy yên dần).
- **0 VI PHẠM phía T9. T9 đóng ~13:58Z — TRONG hạn cờ ~14:00Z + hạn cứng 14:35:51Z** (probe close chạy đúng 13:50:03Z nhờ driver; daemon dừng 13:54:5x–13:55:0xZ theo quy tắc đứng). Không push, không sửa production, không chạy birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183–199 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Probe-once.py bản 200 copy nguyên từ 199.

### 1.1 Số đo đợt 200 (3 lần đo, 1 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 11:39:50Z | **0** | #130 c073c8bb | 63.737 | probe open-200 (boot+18m09s) |
| 12:40:02Z | **0** | #130 | 63.737 | probe mid-200 (boot+1h18m21s; driver) |
| 13:50:03Z | **0** | #130 | 63.737 | probe close-200 (boot+2h28m22s; driver) |

- **CỬA SỔ THOÁNG #130: KHÔNG QUAN SÁT ĐƯỢC trong đợt 200.** Boot btime 11:21:41Z; cửa sổ boot+61–92s (11:22:42–11:23:13Z) đã đóng ~16 phút trước khi T9-200 mở phiên (11:38Z, boot+~17m). T01-200 xác minh #130 bằng 9 nguồn tươi (survey 11:39:01Z) nhưng không đo headroom postboot. Khác đợt 199 (T9 có mặt đúng giây đầu cửa sổ #129 nhưng probe trễ 6s) — đợt này T9 không có mặt trong cửa sổ, không phải trễ probe.
- **Headroom cuối phiên: 0** (close 13:50:03Z, #130 boot+2h28m22s). Trần **KHÔNG ĐỔI trong đợt (63.737 cả 3 lần đo)**.
- **Ngưỡng báo user < ~1.800: VẪN DƯỚI NGƯỠNG lúc đóng (0)** — và đợt này KHÔNG có dữ kiện cửa sổ thoáng mới (cửa sổ duy nhất không quan sát được).

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 136 mẫu chính + 136 mẫu live, 11:39:38–13:54:42Z, MỘT boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap lớn nhất 61 s** (jitter bình thường — KHÔNG có gap reboot; khác đợt 199: gap 138 s do reboot #129). **CAVEAT GHI LOG (F-200-T9-1):** live sampler đợt này ghi CHUNG vào `ram-sampler.log` với sampler chính (136+136 dòng xen kẽ) — xem §6. Số dưới đây tách theo định dạng dòng (chính: có `swapfree_kB`; live: có `trigger=`), script `t9-200-analyze.py` chạy trên bản tách chính + script live riêng.

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 11:39:38–13:54:42Z | #130 | 271.976–3.312.644 kB | Phiên T9 đầy đủ; balloon 2,80M → CEIL 6,44M; **30 CEIL**; RAM <512k: 56 mẫu chính / 53 mẫu live |

- **Gate A ≥1024 MiB: 56/136 mẫu chính (55/136 live)**; **0 mẫu ≥ guard** (xem §3); load1 max (sampler) **10,15** (11:46:39Z — trong giờ build đầu); load1 <4,0: **127/136 mẫu live (93,4%)**; **RAM <512.000 kB: 56 mẫu chính** (8 dải: 12:43:40–12:44:40Z n=2; 12:48:41–13:00:41Z n=13; 13:04:41–13:17:41Z n=14; 13:20:41–13:21:41Z n=2; 13:23:41–13:33:41Z n=11; 13:36:41–13:45:42Z n=10; 13:47:42–13:48:42Z n=2; 13:53:42–13:54:42Z n=2); **RAM <300.000 kB: 14 mẫu** (cả hai sampler khớp).
- Swap: SwapFree 773.076 kB (mẫu đầu) → 588.420 kB (mẫu cuối) — giảm **184.656 kB trong 135 phút** (xả swap trên boot mới — như #129 đợt 199: −414.156 kB/81 phút; đợt này chậm hơn).
- Trũng RAM đợt này: min **271.976 kB (13:29:41Z, #130, balloon CEIL 6.443.824, load1 0,08)** — sâu thứ 2 từ trước tới nay, sau kỷ lục 253.436 kB đợt 197; live min 274.084 kB (13:13:39Z, cũng CEIL) — cùng xu hướng.

**Bảng tổng hợp số RAM (từ script `t9-200-analyze.py` chạy trên `ram-sampler-main-FROZEN.log`, 136 dòng — KHÔNG tính tay; live từ script riêng trên `autotrigger-live/ram-sampler-FROZEN.log`, 136 dòng):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #130 chính | 136 | 271.976 | 3.312.644 | 1.052.143,2 | 56/136 | 30 | 10,15 | 56 |
| #130 live | 136 | 274.084 | 3.295.720 | 1.045.605,5 | 55/136 | 30 | 10,15 | 53 |
| **Toàn phiên** | **136+136** | **271.976** | **3.312.644** | — | — | **30/136 (22,1%)** | **10,15** | **56/53** |

- **Mean chính 1.052.143,2 kB — script in `t9-200-analyze-output.txt` (weighted mean check KHỚP).**

### 2.1 Balloon virtio — #130 GHIM 30 MẪU (CÓ PIN) — E-247 VẪN MỞ, chuỗi không-pin GIỮ 0

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB** (xác nhận lại: 30 mẫu chính + 30 mẫu live đúng bằng trần).
- **Boot #130: GHIM 30/136 mẫu (sampler chính) + 30/136 mẫu (live) — HAI SAMPLER KHỚP TỪNG MẪU (cùng 6 đợt ghim, lệch ±1 s).** Balloon #130 dao động 2.802.256–6.443.824 kB; ≥6,0M: 72 mẫu. Đợt ghim (chính): **12:51:41–12:55:41Z n=5** + **12:57:41–13:00:41Z n=4** + **13:07:41Z n=1** + **13:09:41–13:15:41Z n=7** + **13:28:41–13:33:41Z n=6** + **13:39:41–13:45:42Z n=7** (xen giữa các mẫu cận-trần 6.378.288 kB — dưới trần 65.536 kB — và các mẫu sag/floor, xem dưới). Avail trong đợt ghim chỉ 274–317 MB. **Đợt ghim xảy ra khi máy GẦN NHƯ YÊN (load1 0,00–1,26 trong các mẫu CEIL, 29/30 mẫu ≤0,20)** — ghim KHÔNG do tải guest (xem F-200-T9-2, cùng mẫu F-199-T9-7 của #129).
- **SUÝT GHIM RỒI MỚI GHIM (F-200-T9-2):** balloon leo lần đầu 12:39:40Z 6.026.160 → đỉnh 12:44:40Z 6.267.028 (còn cách trần 176.796 kB) → tụt về 6.012.172 lúc 12:46:40Z → leo lại và **GHIM LẦN ĐẦU 12:51:41Z**. Mẫu leo–tụt–leo này khớp giả thuyết đứng: ghim là host-side balloon inflation (virtio), không phải do tải guest tạo ra.
- **E-247 — GIỮ MỞ, CHUỖI KHÔNG-PIN GIỮ 0.** Chuỗi boot: #127 0 CEIL / 86 (đợt 198) → #128 0 CEIL / 54 (đợt 199) → **#129 10 CEIL / 82 (đợt 199, GHIM — chuỗi 2 → 0)** → **#130 30 CEIL / 136 (đợt này, GHIM — chuỗi GIỮ 0)**. Điều kiện đóng (3 boot liên tiếp không pin) CHƯA ĐỦ (0/3) — **T9-201 theo dõi tiếp từ #131.** Đây là đợt ghim nặng nhất kể từ #126 (20 CEIL / 41, đợt 197) — 30 mẫu, 6 đợt ghim, 22,1% mẫu.
- **Xác minh độc lập 2 sampler:** live sampler bắt **cùng 30 mẫu CEIL** trên #130 (cùng 6 đợt ghim); live cũng bắt đúng **1 mẫu sag + 1 mẫu floor + 14 mẫu <300k** (sampler chính: 1 sag, 1 floor, 14 <300k — KHỚP). Balloon tại cùng timestamp KHỚP TỪNG SỐ (lệch ±1 s; ví dụ 12:51:39Z live vs 12:51:41Z chính: cùng CEIL).
- **Balloon = 0: 0 lần đợt này** (như đợt 192–199).
- **Sàn balloon 6.050.608 kB: 1 lần đợt này (13:34:41Z chính / 13:34:40Z live) — tổng 1 → 2** (lần đầu: #126 đợt 197).
- **Giá trị sag 6.247.216 kB: 1 lần đợt này (13:17:41Z chính / 13:17:40Z live) — tổng 6 → 7** (đợt 187: 2 lần; đợt 188: 1 lần; đợt 199: 3 lần; đợt 200: 1 lần).

### 2.2 Lượt yên WebKit #68 (T4) — HỢP LỆ (1/1) — chuỗi 0 → 1 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#68 HỢP LỆ — attempt1 20/20 + lớp B ĐẠT 5/5 + tickCost median 55,0 ms ≤ 60** (W1 12:01:09–12:04:36Z; poller thoát 12:05:10Z sau lượt hợp lệ — ngân sách dùng 1/3; W2/W3 KHÔNG CHẠY). **Chuỗi lượt yên hợp lệ 0 → 1 (ĐỀ XUẤT — parent quyết cuối)** — lượt hợp lệ đầu tiên kể từ #66 (đợt 198); #67 có 0 lượt.
- **Kiểm chứng live lần 19: ĐẠT** (T9 xác nhận độc lập — xem §3.2). **Chuỗi live ĐẠT 0 → 1 (ĐỀ XUẤT).**
- **Labellag (b): 0 occ / 0 event ≥5f → chuỗi 0 occ 0 → 1 (ĐỀ XUẤT)** (T4; quyết (m)-192: chỉ lượt hợp lệ mới tính).
- **P3' cộng dồn mới (54 lượt hợp lệ): P1 238/242, P2 233/233, P3-A1 202/242, P3' 200/214 occ = 148/151 distinct-seq, P7 136/136.** Seq MỚI: 332 (357 đã thấy). Sổ md5 `2d3ee86c` (cơ sở as-of-198 `c8792589` giữ nguyên).
- **FULL PASS: KHÔNG CÓ** (T8-200: chân O8 KHÔNG đạt 2/3 + chân harness THIẾU 51/53 — dù chân lượt yên #68 CÓ) — **chuỗi GIỮ 0.**

### 2.3 Dữ kiện sampler T9 trong cửa sổ T01/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T01 O8 #130 11:43:23–11:50:36Z | #130 | 0,63–10,15 (sampler) | 2,16–3,31 MB — **gate A 7/7** | **O8 T01 attempt1 FAIL (S1, exit=2) + probe FAIL; attempt2 PASS 21/21 + Chromium PASS 21/21 — chân FULL PASS O8 KHÔNG ĐẠT (2/3)** |
| T4 W1 12:01:09–12:04:36Z | #130 | 1,49–1,99 (3 mẫu live) | 0,93–1,46 MB — **gate A 3/3 (chính) / 2/3 (live — mẫu 12:02:39Z 934.876 kB)** | **0 spike B2** (khớp T4); attempt1 20/20 HỢP LỆ |
| T8 harness #130 12:13:13–12:28:21Z | #130 | 0,47–7,38 (15 mẫu) | 1,00–3,08 MB — gate A 13/15 | **Harness 6/6 PASS** (84l10/85m4/86n2 × WebKit+Chromium); 0 mẫu ghim trong cửa sổ harness (ghim bắt đầu 12:51Z, SAU harness) |

- T01-200: **#130 XÁC NHẬN 9 nguồn TƯƠI CÓ ĐIỀU KIỆN** (survey 11:39:01Z; btime 11:21:41Z, gap #129→#130 = 16.965 s) — điều kiện: nếu daemon restart 08:41:43Z là reboot thì boot này = #131 (F-200-T01-9, 0 witness — parent quyết (e)-200). Marker 80 **ĐÃ XÁC MINH** qua #129 (T56-200); **81 nếu #130 xác nhận** (parent quyết (e)-200).
- T2-200: **(m) #128 KHÔNG CÓ ĐIỂM (CUỐI); (m) #129 DƯƠNG (CUỐI, +40,934 s); n 58/60; B-#128 FALSE — chuỗi B 2 → 0.** (m) #56 lần 42, VẪN CÓ ĐIỀU KIỆN. Nguồn node tsc/test W2/W3 đợt 199 ĐÃ XÁC ĐỊNH (§8): W2 tsc = P1-199 → **VI PHẠM**; W3 test = P3-199 → **VI PHẠM NHẸ** (phán bổ sung (p)(iii)-199). Mâu thuẫn -check/-recheck **GIẢI QUYẾT: script thật là `/tmp/count-197-check.py` + `.sh`**.
- T56-200: **POSTBOOT_PASS #130 CÓ 12:01:06Z** (poll=1, repair-som-quyet-h, dpkg 777, cache 108, lists 75 — cùng hồ sơ #125/#126/#127/#129); (A) 120/120 lần thứ 49; suite 9/9 × 6 (chuỗi 80 → 81); watcher-200 pid 7406 (START 11:39:46Z, END 14:35:51Z); #130 KHÔNG GIẾT holder (chuỗi 5 → 6 nếu parent xác nhận).
- T7-200: **lặng mới S9 5.135 s + S10 3.005 s** (reboot 11:21:41Z ĐÃ XÁC MINH bên trong S10); run 207 TIMEOUT cf 119 s → **CA MỚI #29**; run 208 SUCCEEDED cf 70 s → **CA MỚI #30**; họ CA 28 → 30; **cửa slot KHÔNG LÀNH** (HB 11/12, DR 4/6) — chuỗi lành GIỮ 0; tổng lặng 27/11 = **16.546 s** (S8 8.407 + S9 5.135 + S10 3.005); S9 đề xuất OUTAGE #8, S10 đề xuất OUTAGE #9.
- T8-200: **harness 6/6 trên #130** (12:13:13–12:28:21Z); **84l10 PASS — chuỗi 1 → 2**; **86n2-P1 dữ kiện mới — chuỗi 20 → 21**; V2+V4+V5 = 11/11 kẹt, 0 FP trên 47 log sạch; V5 live 0 trigger; B2 vùng mới sạch lần 14.
- P1/P2/P3/P4-200: P1 **GIỮ cờ** (KHÔNG FLIP — hài 3 trội THẬT trên giọng thật, two-stage nâng H3 +13–15 dB); P2 **R_rel hình chữ U theo σ** (bar 0,15 chỉ đạt σ ∈ [10,20]); P3 **drift chirp ĐẠT + 6 transient longB đã xác định vị trí + longB đo lại ĐẠT + N11b GIỮ ĐẠT**; P4 **harness FINAL 51/53** (CHƯA: N2a, N11a-longB); N12a ĐẠT theo thước mới; test 28/28; tsc 0 lỗi.

### 2.4 B2 — 162 spike THẬT (tất cả #130); W1 0 spike (khớp T4 từng số); `ps` 0 lần

Watcher cadence 2 s, ngưỡng load1 ≥ 3,0. **162 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 162): #130: 162** (một boot duy nhất — không reboot giữa phiên; phân theo header `boot=`). **load1 đỉnh đợt (watcher, cadence 2 s): 11,47.**

| Nhóm (top comm, đã lọc `ps`) | n | Ghi chú |
|---|---|---|
| MainThread | 48 | Process node (tsc/test/vite các luồng P — xem §5) |
| hatch | 35 | Tải nền tảng (runtime) |
| WebKitWebProces | 30 | Harness/O8 WebKit + attempt T4 |
| chrome | 24 | P1 Chrome headless (đo timbre) + Chrome khác |
| python | 13 | Lẻ tẻ (bgremove? đo lường) |
| store | 4 | Lẻ tẻ |
| find | 3 | Lẻ tẻ (build/prune) |
| npm | 3 | Lẻ tẻ |
| ffprobe | 1 | Lẻ tẻ |
| privsep-test-fu | 1 | Lẻ tẻ |

Tổng 48+35+30+24+13+4+3+3+1+1 = 162 — KHỚP. **`ps`: 0 lần đứng đầu** (bộ lọc F-198-T9-5 HOẠT ĐỘNG — đợt 199: 0/311; đợt này 0/162). Phân theo giờ: 11:xx 99 spike; 12:xx 63 spike. Spike đầu 11:40:03Z (load1 ≥3,0, ngay sau khi watcher khởi động 11:39:38Z); spike cuối 12:28:24Z — **sau 12:28:24Z không còn spike nào tới lúc đóng** (máy yên dần: T4 đóng 12:11Z, T8 đóng ~12:35Z, các luồng P đóng trước đó).

- **W1 (12:01:09–12:04:36Z): 0 spike, load1 max (T4 sampler) 2,62 < 3,0** (khớp T4; T9 đếm lại từ `b2-spikes-FROZEN.log`: 0 dòng trong W1; tổng log lúc T4 đóng (poller thoát 12:05:10Z): **99 spike — T9 đếm lại 99 spike ≤12:05:10Z, KHỚP**; cũng 99 spike ≤12:11:00Z — 0 spike 12:05–12:11Z).
- **63 spike 12:xx đều NGOÀI W1** (12:11–12:28Z — sau khi T4 đóng, trong lúc T8 harness + các luồng P còn chạy).
- **B2 dữ kiện #12** cho quyết tách (cách đếm (j)-199: mỗi đợt = 1 dữ kiện): W1 0 spike. T9 chỉ báo số, KHÔNG tự quyết tách (luật B2 KHÔNG TÁCH vẫn đứng cho tới khi parent quyết).

## 3. Birefnet guard + auto-trigger (cơ chế (a) — GUARD KHÔNG MỞ LẠI; LIVE TIẾP TỤC THEO QUYẾT (o) §14.2-199; 0 FIRE)

- **GUARD KHÔNG MỞ: 0 mẫu ≥ guard (6.291.456 kB) cả đợt** — max avail 3.312.644 kB (sampler chính, #130) / 3.295.720 kB (live, #130). **KHÔNG có lần chạy birefnet nào** — đúng, vì guard không mở. **0 lần chạy birefnet — lần thứ 52 liên tiếp (147–200).**
- **QUYẾT (o) §14.2-199: AUTO-TRIGGER GIỮ LIVE.** Ba điểm đứng từ (o) §12.3-188: (i) fixture **clip1.mp4** (104.028 B, 8,0 s, 240 frames, md5 5dfbd515...); (ii) **CÓ giới hạn load1 < 4,0**; (iii) **KHÔNG "hẹn chạy sau attempt"** (ghi MISSED-WINDOW).
- **QUY TRÌNH KHỞI ĐỘNG LIVE CỦA T9-200:** live TIẾP TỤC từ đợt 199 (không flip mới) — nhưng T9 kiểm lại đầy đủ trước khi khởi động: đọc aggregate 199 §14.2 bản parent (86.880 B — NGUỒN QUYẾT DUY NHẤT; file `hidden_files/round199-parent-decisions.md` là GIẢ, không dùng); `FIXTURE`=clip1.mp4, `LOAD1_MAX`=4.0, `GUARD_KB`=6291456, `CONSEC_NEEDED`=2 trong code; clip1.mp4 104.028 B md5 `5dfbd51551392d2a6773d61b7087409b` KHỚP T9-189..199; `server/bgremove/.venv/bin/python` + `bgremove.py` 23.500 B + `~/.u2net/birefnet-general.onnx` 972.666.916 B + `~/.u2net/u2net.onnx` 175.997.641 B đều tồn tại, không đổi. Code sampler-autotrigger.py KHÔNG ĐỔI so với đợt 199 (copy nguyên từ round199-t9). Khởi động 11:39:39Z (pid 5860) với env đúng ngay lần đầu (tránh F-199-T9-2 — KHÔNG mất mẫu live đầu phiên).
- **LIVE PHASE ĐỢT 200: 136 mẫu, 11:39:39–13:54:40Z (tất cả #130), TẤT CẢ `trigger=watch consec=0`, max avail 3.295.720 kB, load1 <4,0: 127/136 (93,4%) — 0 FIRE / 0 WOULD-FIRE / 0 DEFER / 0 MISSED-WINDOW.** Không có file `birefnet-trigger.log` trong `round200-t9/` (không sự kiện nào để ghi — đúng kỳ vọng khi guard không mở). Live chạy suốt cửa sổ attempt T4, 0 FIRE trong W1.
- **TỔNG LIVE TỪ 03:14Z 25/11: 1.363 mẫu (1.227 tới hết đợt 199 + 136 đợt 200), 0 FIRE.** Khoảng mù live: **KHÔNG CÓ** đợt này (live chạy liên tục 11:39:39–13:54:40Z; gap lớn nhất giữa 2 mẫu live liên tiếp 61 s — jitter bình thường; KHÔNG có reboot, KHÔNG có khởi động lại — khác đợt 199: mù ~3 phút đầu phiên + ~141 s do reboot).
- **Điểm yếu đứng (a)/(b) đợt 147:** (a) đã có prototype LIVE + kiểm offline 17/17 (đợt 188) + dry-run 2 đợt + live 1.363 mẫu; (b) lần FIRE thật đầu tiên **vẫn chưa verify end-to-end** (0 lần chạy trong 52 đợt). **Lưu ý mới:** balloon #130 leo tới CEIL 6,44M NHƯNG avail lúc đó chỉ 274–317 MB — guard đo bằng MemAvailable, không phải balloon; balloon cao không mở guard. Auto-trigger 0 FIRE trong suốt đợt là ĐÚNG theo thiết kế.
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 199); không có thư mục `~/workspace/tmp-t9-200-birefnet/` (không thử gì); **không có file `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` nào** trong `hidden_files/round200-t9/` (live chạy 136 mẫu, 0 sự kiện).

### 3.2 Kiểm chứng live lần 19 (đợt 200) — T9 XÁC NHẬN ĐỘC LẬP: ĐẠT (đồng ý với T4)

- **LIVE-CHECK #19 (đợt 200): ĐẠT — T9-200 xác nhận độc lập từ log live + log B2 của mình, KHỚP T4 TỪNG SỐ.** Có 1 cửa sổ hợp lệ (W1 12:01:09–12:04:36Z — attempt1 20/20, lớp B ĐẠT 5/5). 3 mẫu live trong W1 (12:01:39Z avail 1.231.984 load1 1,99; 12:02:39Z avail 934.876 load1 1,98; 12:03:39Z avail 1.422.104 load1 1,49 — luồng live; luồng chính cùng các timestamp: 1.227.644 / 1.131.884 / **1.457.360** kB) — tất cả `trigger=watch consec=0`, **0 FIRE**; max avail trong W1 1.457.360 kB < guard. **VÀ 0 spike B2 trong W1** (đếm trực tiếp từ `b2-spikes-FROZEN.log`, KHỚP T4) nên đủ điều kiện ĐẠT theo định nghĩa (p)-192 (0 spike B2 — tiền lệ #14/#16 ĐẠT đều 0 spike + 1 cửa sổ hợp lệ). **Chuỗi live ĐẠT 0 → 1 (ĐỀ XUẤT) — T9 ĐỒNG Ý với verdict T4.**
- CAVEAT số (F-200-T9-4): T4 ghi max avail W1 là 1.457.360 kB — đó là giá trị LUỒNG CHÍNH lúc 12:03:39Z; luồng live cùng timestamp là 1.422.104 kB (chênh 35.256 kB, ~1 s lệch pha lấy mẫu). Không mâu thuẫn — cả hai đều < guard; T4 đọc log gộp (xem F-200-T9-1).
- Toàn log live 200: 136 mẫu, 0 dòng trigger != watch consec=0.

## 4. ENOSPC trong journal (đếm trực tiếp — 1 boot, journal ĐẦY ĐỦ)

- **#130: đếm trực tiếp 122 dòng lúc đóng 13:55:03Z (vẫn tăng lúc đóng)** — dòng đầu **11:36:34Z (boot+893s)** — PHÁ mẫu ~110s lần thứ 2 (sau #128 +2.086s; các boot về mẫu: #120 +115s, #124 +109s, #126 +113s, #127 +111s, #129 +109s — xem F-200-T9-3); dòng cuối lúc đếm **13:54:14Z**. Cả hai grep đều 122 — KHỚP. Đếm giữa phiên: 3 lúc 11:39:04Z → 56 lúc 12:40:02Z → 60 lúc 12:45:02Z → 62 lúc 12:47:17Z → 118 lúc 13:50:03Z → **122 lúc 13:55:03Z**. Nhịp ~0,9 dòng/phút, cùng nhịp #126/#127/#129. Toàn bộ các dòng đều là `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`.
- **Tổng phiên (1 boot, đếm trực tiếp): 122 dòng.** **Chuỗi đợt có lỗi thật: 46 → 47** (boot #130 có lỗi thật).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-200 áp dụng ĐẦY ĐỦ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `grep -c inotify` — hai số PHẢI KHỚP (#130: 122=122 — KHỚP); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì KHÔNG ngoại suy — đợt này KHÔNG CÓ reboot giữa phiên nên journal đầy đủ, không cần ngoại suy; (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Một boot trong phiên (T9 bắt trực tiếp: 0 reboot; 1 boot đợt này)

- **#130 (c073c8bb-26f3-41e8-a4b5-3d56ce3564f8, btime 11:21:41Z; số hiệu ỨNG VIÊN CÓ ĐIỀU KIỆN — T01-200 XÁC MINH 9 nguồn TƯƠI; parent quyết (e)-200).** Sampler T9 trên #130 đợt 200: 11:39:38–13:54:42Z (136 mẫu chính + 136 mẫu live). Gap #129→#130 = **16.965 s** (4h42m45s). #130 sống tới lúc T9 đóng (13:55Z) — chưa chết trong phiên.
- **CAVEAT SỐ HIỆU (F-200-T01-9):** daemon restart 08:41:43Z (eid 11570, run 9cd50793 requeue 08:41:43.720Z) — CHƯA GIẢI QUYẾT; nếu là reboot thì boot này = **#131** (0 witness — T01-200; parent quyết (e)-200). T01-200 coi là daemon restart (không phải reboot), đánh số #130 — T9 theo số hiệu này trong toàn bộ file này, ghi rõ điều kiện.
- **Khoảng không-watcher:** 08:35:51Z (watcher-199 hết hạn) → 11:39:46Z (watcher-200 START pid 7406) = **11.035 s** (T56-200). **Khoảng mù giữa hai đợt: ~3h03m không sampler T9** (08:02:15Z 27/11 → 11:39:38Z — cửa sổ thoáng #130 không quan sát được, xem §1).
- **(m) #130 THÔ: chưa tính** — thuộc T2-201 (cần FULL174, neo #128); T2-200 đã đóng với (m) #128 KHÔNG CÓ ĐIỂM (CUỐI) + (m) #129 DƯƠNG (CUỐI).

### 5.2 Các luồng khác — 11/11 cờ đã đóng lúc T9 đóng (P1/P2/P3/P4/T01/T2/T4/T56/T7/T8); T9 là cờ cuối

- T01-200 ĐÃ đóng: #130 XÁC NHẬN 9 nguồn TƯƠI CÓ ĐIỀU KIỆN; O8 attempt1 FAIL + attempt2/Chromium PASS (2/3); GAP §128 đã viết.
- T2-200 ĐÃ đóng: **(m) #128 KHÔNG CÓ ĐIỂM (CUỐI); (m) #129 DƯƠNG (CUỐI)**; n 58/60; B-#128 FALSE (chuỗi B 2 → 0); nguồn node W2/W3 đợt 199 ĐÃ XÁC ĐỊNH (W2 tsc = P1 → VI PHẠM; W3 test = P3 → VI PHẠM NHẸ); -check/-recheck GIẢI QUYẾT (script thật `-check`).
- T4-200 ĐÃ đóng: #68 HỢP LỆ; live-check #19 ĐẠT (T9 xác nhận §3.2); B2 dữ kiện #12 (W1 0 spike).
- T56-200 ĐÃ đóng: POSTBOOT_PASS #130 CÓ; (A) 120/120 lần thứ 49; suite 9/9 × 6 (80 → 81); marker 80 ĐÃ XÁC MINH; watcher-200 pid 7406.
- T7-200 ĐÃ đóng: lặng S9 5.135 s + S10 3.005 s; run 207 CA #29; run 208 CA #30; cửa slot KHÔNG LÀNH; tổng lặng 27/11 = 16.546 s.
- T8-200 ĐÃ đóng: harness 6/6 trên #130; 84l10 PASS (chuỗi 1 → 2); 86n2-P1 dữ kiện mới (20 → 21); FULL PASS KHÔNG CÓ.
- P1/P2/P3/P4-200 ĐÃ đóng (xem LIMITS P1–P4 — T9 không phán chuyên môn sản phẩm).

## 6. Sai số / caveat (F-200-T9-*)

- **F-200-T9-1 — LIVE SAMPLER GHI CHUNG VÀO `ram-sampler.log` VỚI SAMPLER CHÍNH (MỚI — KHÔNG MẤT DỮ KIỆN, ĐÃ TÁCH LÚC PHÂN TÍCH).** `sampler-autotrigger.py` dòng 257 ghi vào `os.path.join(round_dir, "ram-sampler.log")` — code KHÔNG ĐỔI so với đợt 199 (diff IDENTICAL). Đợt 199 T9 truyền `--round-dir .../round199-t9/autotrigger-live` nên live ghi riêng; đợt 200 T9 truyền `--round-dir .../round200-t9` (thư mục đợt) nên live ghi chung vào log chính: 272 dòng = 136 chính + 136 live xen kẽ (chính: `swapfree_kB`, đầy đủ boot_id; live: `trigger=watch consec=0`, boot_id rút gọn). Hai luồng tách được hoàn toàn theo định dạng dòng (grep `swapfree` = 136, grep `trigger=` = 136, KHÔNG dòng nào lẫn lộn); phân tích chạy trên bản tách; log đóng băng giữ cả bản gộp (`ram-sampler-FROZEN.log`, md5 `89291106…`) + bản tách chính (`ram-sampler-main-FROZEN.log`) + bản tách live (`autotrigger-live/ram-sampler-FROZEN.log`). Bài học: T9-201 chọn MỘT trong hai — (a) truyền `--round-dir <đợt>/autotrigger-live` như 199 (log tách sẵn), hoặc (b) giữ log gộp + tách lúc phân tích như 200 — và GHI RÕ lựa chọn trong baseline notes ngay lúc mở phiên.
- **F-200-T9-2 — #130 SUÝT GHIM RỒI MỚI GHIM + GHIM KHI MÁY YÊN (MỚI).** Balloon leo lần đầu 12:39:40Z 6.026.160 → đỉnh 12:44:40Z 6.267.028 (còn cách trần 176.796 kB) → tụt về 6.012.172 lúc 12:46:40Z → leo lại và GHIM LẦN ĐẦU 12:51:41Z; sau đó ghim 6 đợt (n=5+4+1+7+6+7 = 30 mẫu). Trong 30 mẫu CEIL, load1 0,00–1,26 (29/30 mẫu ≤0,20) và avail chỉ 274–317 MB — máy gần như không làm gì trong lúc ghim (các luồng build đã xong từ ~12:35Z; spike B2 cuối 12:28:24Z). Mẫu này khớp giả thuyết đứng: ghim là host-side balloon inflation (virtio), không phải do tải guest tạo ra (như F-199-T9-7 của #129). Cũng giải thích vì sao avail sụp (272 MB) mà load1 vẫn ~0: RAM bị balloon lấy đi, không phải bị process ăn.
- **F-200-T9-3 — ENOSPC #130 PHÁ MẪU ~110s LẦN THỨ 2 (MỚI).** Dòng đầu #130 11:36:34Z = boot+893s (14m53s), khác mọi boot về mẫu (#120 +115s, #124 +109s, #126 +113s, #127 +111s, #129 +109s) và các ngoại lệ +395–871s của #119/#121/#123/#125; ngoại lệ trước là #128 (+2.086s). Giải thích khả dĩ (như F-199-T9-4): đợt 200 mở 11:35:51Z, các luồng build bắt đầu tạo watch ~11:36Z mới làm cạn pool; dòng đầu 11:36:34Z chỉ 43 s sau khi đợt mở; đầu boot #130 ít áp lực watch hơn. #128 + #130 đều là các boot mà đợt mở MUỘN trong đời boot (mở lúc boot+34m / boot+14m) — hai ngoại lệ cùng một cơ chế. Ghi nhận, không ngoại suy.
- **F-200-T9-4 — SỐ AVAIL TỐI ĐA W1 CỦA T4 LÀ GIÁ TRỊ LUỒNG CHÍNH (GHI NHẬN — KHÔNG MÂU THUẪN).** T4 ghi max avail W1 = 1.457.360 kB lúc 12:03:39Z — đó là giá trị luồng CHÍNH; luồng live cùng timestamp là 1.422.104 kB (chênh 35.256 kB, ~1 s lệch pha lấy mẫu giữa hai sampler). Cả hai đều < guard 6.291.456 kB; verdict ĐẠT không đổi. Bài học: khi đối chiếu số avail, ghi rõ luồng (chính/live) — T9 đã ghi cả hai ở §3.2.
- **F-200-T9-5 — 0 VI PHẠM F-175-T4-2 THEO T9.** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail gần như ngay ở watch đầu, không tạo tải; probe open 11:39:50Z trước mọi attempt (T4 mở W1 12:01:09Z); probe mid 12:40:02Z sau khi T4 đã đóng (poller thoát 12:05:10Z); probe close 13:50:03Z sau khi mọi luồng đo đã đóng); live autotrigger 0 FIRE nên không tạo tải bgremove; sampler/B2 watcher chỉ đọc /proc. **T9 ĐÓNG ~13:58Z — TRONG hạn cờ ~14:00Z + hạn cứng 14:35:51Z** (probe close chạy đúng 13:50:03Z nhờ driver; daemon dừng 13:54:5x–13:55:0xZ theo quy tắc đứng — đã dừng cả 3 lúc đóng sổ). Cờ T9 viết MỘT LẦN (mẫu F-175-T1-7). Chuỗi 0 vi phạm chung: parent (p)-199 đã quyết đợt 199 có vi phạm (i)/(ii) + (iii) chờ T2-200 phán bổ sung (nay đã phán: W2 VI PHẠM, W3 VI PHẠM NHẸ — xem §5.2); đợt 200 có vi phạm mới hay không thuộc T10/parent (cần verdict của TẤT CẢ luồng — T4 ghi nhận chồng lấn waiter T8 + sampler live T9 trong W1, giao T2/parent phán (p)-200).
- **F-200-T9-6 — KHÔNG REBOOT GIỮA PHIÊN: CHUỖI 7 ĐỢT REBOOT CẮT NGANG PHIÊN T9 ĐÃ ĐỨT.** F-199-T9-3 đếm 7 đợt liên tiếp có reboot giữa phiên T9 (192, 193, 194, 196, 197, 198, 199); đợt 200: 0 reboot trong phiên 11:39:38–13:54:42Z (gap đo lớn nhất 61 s; 3 daemon sống suốt phiên; driver tự kết thúc sau probe close). Lưu ý: boot #130 bản thân nó là boot MỚI (reboot 11:21:41Z, 14 phút trước khi đợt mở) — reboot xảy ra TRƯỚC phiên, không phải trong phiên.

- **Caveat đứng:** probe cap 30.000 (giá trị mở là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147 — nay đã có live autotrigger + kiểm offline 17/17 + live 1.363 mẫu); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); cửa sổ thoáng #130 KHÔNG quan sát được đợt này (mở phiên muộn — boot+~17m); số hiệu #130 CÓ ĐIỀU KIỆN (F-200-T01-9: nếu daemon restart 08:41:43Z là reboot thì = #131 — parent quyết (e)-200); E-247 GIỮ MỞ (T9 chỉ báo dữ kiện + đếm boot không-pin: #129 0, #130 0 — chuỗi GIỮ 0).

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (272 dòng gộp: 136 chính + 136 live, 11:39:38–13:54:42Z, một boot #130): `hidden_files/round200-t9/ram-sampler-FROZEN.log` — md5 `892911061ccc757aa99595ee640fddb1`. Bản tách chính (136 mẫu): `hidden_files/round200-t9/ram-sampler-main-FROZEN.log` — md5 `ed235285e7e2710a2c4ac5df1aca89fe`. Bản tách live (136 mẫu): `hidden_files/round200-t9/autotrigger-live/ram-sampler-FROZEN.log` — md5 `05fa897b4d96c38496fae940165ae737`. Log B2 đóng băng (162 spike): `hidden_files/round200-t9/b2-spikes-FROZEN.log` — md5 `3ada9eef68f0fef5c97fa28295cde2bb`. Log headroom đóng băng (3 lần đo): `hidden_files/round200-t9/headroom-log-FROZEN.txt` — md5 `6d10aa31fa3c3a31633cba37846997f8`. Phân tích: `t9-200-analyze.py` (output `t9-200-analyze-output.txt`) + `t9-200-b2-analyze.py` (output `t9-200-b2-analyze-output.txt`) + script live riêng (chạy tay, output không lưu file riêng — các số đã ghi ở §2/§3 trên). Baseline: `t9-200-baseline-notes.md` (gồm ghi chú cửa sổ thoáng không quan sát được + ENOSPC phá mẫu + log gộp). Auto-trigger: `sampler-autotrigger.py` + `birefnet-autotrigger-DESIGN.md` + `test-autotrigger-offline.py` (17/17 PASS đợt 188, không chạy lại — code không đổi). Driver: `t9-200-driver.sh` (mid 12:40Z, close 13:50Z, reboot watch — tự kết thúc 13:50:03Z sau probe close; KHÔNG chết theo reboot vì không có reboot giữa phiên). B2 watcher bản 200 (`b2watch.sh` — lọc `ps` + ghi `boot=` mỗi spike). T10 đọc log đóng băng trực tiếp khi cần.
