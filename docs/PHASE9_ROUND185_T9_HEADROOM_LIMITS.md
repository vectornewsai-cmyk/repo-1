# LIMITS — Phase 9 đợt 185, T9: headroom + RAM + birefnet (0 thử lần 39; reboot #105 mới; E-226/E-227/E-228 mới trên #104 + E-229 đang ghim trên #105; cửa sổ thoáng #105 MỞ 30.000; ENOSPC lần 34)

## 0. Tóm tắt

- **Headroom: 0 lúc đóng (7 lần đo: 0, 0, 0, 0, 30.000, 0, 0; trần 63.747)** — dưới ngưỡng < ~1.800 **lần thứ 45 liên tiếp**. Quyết "chỉ theo dõi" đứng.
- **CỬA SỔ THOÁNG #105: QUAN SÁT ĐƯỢC + MỞ — 30.000 (CHẠM CAP) lúc boot+62s, ĐÓNG trước boot+92s.** Lần mở thứ ba liên tiếp chạm cap (#102 @62s, #103 @61s, #105 @62s); rộng tối đa ~30 s (rộng hơn #103 ≤9 s, hẹp hơn #102 ≤80 s). **Cửa sổ #104: KHÔNG QUAN SÁT ĐƯỢC** (mở phiên boot+26m).
- **Balloon: E-226 (3) KẾT THÚC BỞI SAG 12:42:10Z (bal 6.050.608 = sàn, LẦN 9); E-227 (9) KẾT THÚC BỞI SAG 12:59:10Z (bal 6.281.776); E-228 (12) KẾT THÚC BỞI REBOOT #105; E-229 (15) MỚI trên #105, VẪN GHIM lúc đóng.** Tổng ghim **39/122 (32,0%)**.
- **RAM: 122 mẫu, 11:40:09Z–13:41:47Z, HAI boot (#104: 94; #105: 28).** Max **3.272.488 kB (52,0% guard)** lúc 12:05:09Z (#104); min **442.420 kB** lúc 12:34:10Z (#104); mean 1.122.138,5 kB; gate A **53/122**; **0 mẫu ≥ guard → birefnet 0 lần thử, lần thứ 39 liên tiếp**.
- **B2: 110 spike THẬT, 3 cụm, TẤT CẢ trên #104; 0 spike trên #105; 6 spike trong cửa sổ attempt1 T4 #54 (KHỚP T4); 0 spike trong span ghim E-226–E-229.**
- **Lượt yên #54 (T4): CÓ LƯỢT HỢP LỆ — attempt1-9161bfd1: 20/20 + lớp B 5/5, tickCost median 45,0 ms — CHUỖI LƯỢT YÊN HỢP LỆ 46 → 47.** T9 đối chiếu sampler trong cửa sổ attempt1: gate A 2/3, load1 0,31–3,08, 0 mẫu ghim. **F-184-T4-2 KHÔNG lặp lại** (0 mẫu RAM <500 MB trước khi cửa mở).
- **REBOOT #105 MỚI GIỮA PHIÊN** (boot `053a35c3`, btime 13:13:32Z, gap #104→#105 = 7.190 s — số hiệu + btime chờ T0-186 xác minh 9 nguồn); giết sampler/watcher/probe-loop T9 + sleep kiểm tra (SIGTERM); T9 khởi động lại, gap mẫu 95 s, bắt được cửa sổ thoáng #105 đang mở.
- **ENOSPC: đếm trực tiếp 28 dòng (4 #104 + 24 #105) — đợt thứ 34 liên tiếp có lỗi thật — lỗi KHÔNG dừng trên #105** (F-182-T9-6 KHÔNG lặp lại trên #105; #104 không kiểm lại được do journal mất). Ngoại suy ≈ **112 dòng** (#104 ≈ 88 + #105 24).
- **T7 CHƯA đóng lúc T9 đóng (~13:42Z)** — như T7-180/181/182/183/184. Không push, không sửa production, không thử birefnet.

## 1. Headroom inotify (probe K8, cap 30.000)

Phương pháp như đợt 183/184 (ctypes `libc.inotify_init`, mask `IN_ALL_EVENTS` 0xfff, mỗi watch một thư mục riêng). Trần `/proc/sys/fs/inotify/max_user_watches` = 63.747 suốt đợt, cả hai boot.

### 1.2 Số đo đợt 185 (7 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 11:40:19Z | **0** | #104 9161bfd1 | 63.747 | cặp mở (boot+26m37s) |
| 12:10:19Z | **0** | #104 | 63.747 | lan-2 (boot+56m37s) |
| 12:40:19Z | **0** | #104 | 63.747 | lan-3 (boot+1h26m37s) |
| 13:10:19Z | **0** | #104 | 63.747 | lan-4 (boot+1h56m37s) |
| 13:14:34Z | **30.000** | #105 053a35c3 | 63.747 | **TRONG cửa sổ thoáng (boot+62s) — CHẠM CAP** |
| 13:15:04Z | **0** | #105 | 63.747 | **TRONG cửa sổ thoáng (boot+92s)** |
| 13:41:49Z | **0** | #105 | 63.747 | cặp đóng (tay, boot+28m17s); E-229 đang ghim |

- **CỬA SỔ THOÁNG #105: QUAN SÁT ĐƯỢC + MỞ — LẦN THỨ BA LIÊN TIẾP CHẠM CAP.** Btime 13:13:32Z (`uptime -s`, chờ T0-186 xác minh 9 nguồn). Probe tay win105-open lúc boot+62s = **30.000 — CHẠM CAP, tức headroom thật ≥ 30.000** (probe dừng vì đủ cap, không phải vì hết watch — giá trị thật không đo được, chỉ biết ≥ 30.000). Probe-loop open-185 (sau khởi động lại daemon) lúc boot+92s = **0**. **Cửa sổ MỞ rồi ĐÓNG trong khoảng (62s, 92s] — rộng tối đa ~30 s** (rộng hơn #103 ≤9 s, hẹp hơn #102 ≤80 s). Ba lần mở liên tiếp đều chạm cap 30.000 và đều bắt đầu ở boot+61–62s — mẫu ổn định: cửa sổ thoáng mở ngay sau boot (~1 phút) rồi đóng trong vòng ~90 s. **Caveat:** probe cap 30.000 nên không biết headroom thật lúc mở là 30.0xx hay ~60.000 — chỉ khẳng định ≥ 30.000 và cửa sổ đã đóng trước boot+92s.
- **CỬA SỔ THOÁNG #104: KHÔNG QUAN SÁT ĐƯỢC** (T9-185 mở phiên 11:40Z = boot+26m, sau khi cửa sổ đóng; cùng mẫu #102 ở đợt 184).
- **Headroom cuối phiên: 0 — SỐ 0 GIỮ SANG ĐỢT NÀY.** 4 lần đo trên #104 đều = 0; 2/3 lần đo trên #105 sau cửa sổ đều = 0 (chỉ lần mở trong cửa sổ = 30.000). Số watch giữ ngoài cell lúc đóng: **63.747**. Tỉ lệ so với nhu cầu vite (~1.578): **~0** — một vite mới vẫn không khởi động được (như mọi đợt từ 152). **Trần KHÔNG ĐỔI trong boot** (63.747 trên #104 và #105).

### 1.3 Chuỗi headroom dài hạn

Giá trị đóng mỗi đợt: **… → 0 → 2 → 0 → 2 → 2 → 0 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0**. Gần nhất: 178 đóng 0; 179 đóng 0; 180 đóng 0 (1 lần đo giữa phiên 2.903); 181 đóng 0 (toàn 0, 7 lần đo); 182 đóng 2 (3 lần 0 đầu phiên + 4 lần 2); 183 đóng 0 (7 lần 0 + 1 lần 30.000 chạm cap giữa phiên); 184 đóng 0 (6 lần 0 + 1 lần 30.000 chạm cap giữa phiên); **185 đóng 0 (6 lần 0 + 1 lần 30.000 chạm cap giữa phiên)**.

- **Xu hướng: VẪN CHẠM SÀN — giá trị đóng phiên là 0.** Lần mở 30.000 trên #105 là sự kiện giữa phiên, không phải mức nền — headroom đóng 0 như 7/9 đợt gần nhất.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, lần thứ 45 liên tiếp.** Quyết parent đợt 183 (l) GIỮ "chỉ theo dõi" — T9 chỉ tiếp tục theo dõi, không báo riêng. Can thiệp host vẫn ngoài tầm cell. **Dữ kiện mới: journal đợt này có 28 dòng lỗi ENOSPC đếm trực tiếp (xem §4)** — đợt thứ 34 liên tiếp — và lỗi KHÔNG dừng trên #105. T9 chỉ nêu dữ kiện + tương quan, không đề xuất đổi quyết.

## 2. RAM khả dụng (tổng 8.124.900 kB; swap 1.048.572 kB) — sampler 122 mẫu, 11:40:09Z–13:41:47Z, HAI boot

`/proc/meminfo` MemTotal 8.124.900 kB; guard 6.291.456 kB = 6.144 MiB. Sampler mỗi 60 s một mẫu; **gap qua reboot #105: 95 s** (mẫu cuối #104 13:13:11Z → mẫu đầu #105 13:14:46Z); **gap giữa hai đợt: 59'07" không sampler T9** (mẫu cuối T9-184 10:41:02Z → mẫu đầu T9-185 11:40:09Z — chứa reboot #104 + cửa sổ thoáng #104); **0 gap >90 s khác ngoài gap reboot** (gap lớn thứ hai 61 s — jitter cadence bình thường).

| Giai đoạn (UTC) | Boot | RAM | Ghi chú |
|---|---|---|---|
| 11:40:09–11:52:09Z | #104 | 1.339.428–3.272.488 kB | Mở sampler; O8 T0 (11:42:47–11:46:41Z); **RAM max phiên 3.272.488 kB** |
| 11:52:20–11:55:49Z | #104 | 919.056–1.437.232 kB | **Lượt yên #54** (attempt1 hợp lệ, xem §2.3) |
| 11:56:10–12:26:10Z | #104 | 800.948–3.272.488 kB | Balloon leo/xả; T8 harness (12:03:46–12:18:56Z) + O8 T8 |
| 12:27:10–12:34:10Z | #104 | 442.420–1.016.692 kB | Balloon leo sát trần; **RAM min phiên 442.420 kB** (12:34:10Z) |
| 12:35:10–12:41:10Z | #104 | 519.564–836.340 kB | **E-226 3 mẫu ghim**; sag kết thúc (bal 6.050.608 = sàn, lần 9) |
| 12:42:10–12:49:10Z | #104 | 540.488–1.018.692 kB | Tách SẠCH 8 mẫu dưới trần; balloon leo lại |
| 12:50:10–12:58:10Z | #104 | 478.124–525.464 kB | **E-227 9 mẫu ghim**; sag kết thúc (bal 6.281.776) |
| 12:59:10–13:01:11Z | #104 | 515.512–712.316 kB | Tách 3 mẫu dưới trần (xem caveat §2.2); balloon leo lại |
| 13:02:11–13:13:11Z | #104 | 477.408–508.756 kB | **E-228 12 mẫu ghim**; **KẾT THÚC BỞI REBOOT #105** |
| 13:14:46–13:26:46Z | #105 | 522.404–1.762.356 kB | Boot #105 mới; balloon leo đơn điệu tới trần; load1 mẫu đầu 2,46 |
| 13:27:46–13:41:47Z | #105 | 530.020–650.148 kB | **E-229 15 mẫu ghim — VẪN GHIM lúc đóng** |

- **Gate A ≥1024 MiB: 53/122 mẫu** (45/94 trên #104 + 8/28 trên #105); **0 mẫu ≥ guard**; load1 max (sampler) **7,06** (11:46:09Z, #104 — trong O8 T0); **RAM <512.000 kB: 21 mẫu** (17,2% — tất cả trên #104, 3 dải — xem dưới); **RAM <500.000 kB: 16 mẫu**; **RAM <300.000 kB: 0 mẫu**.
- Swap: SwapFree 730.972 kB (mẫu đầu #104) → 620.368 kB (mẫu cuối #104) → **1.034.496 kB (mẫu đầu #105 — NHẢY +414.128 kB qua reboot #105)** → 688.428 kB (mẫu cuối, 13:41:47Z). Nhịp nhảy SwapFree qua reboot: #105 nhả ~414.128 kB (đợt 184: #103 nhả ~356.088 kB; #102 nhả ~438.432 kB; #100 nhả ~347.632 kB; #99 nhả ~372.324 kB; #96 nhả ~403.960 kB; #95 nhả ~331.952 kB; #93 nhả ~268.104 kB; #91 nhả ~376.948 kB).
- Trũng RAM đợt này: min **442.420 kB (12:34:10Z, #104 — balloon 6.405.900 kB, sát trần nhưng chưa ghim)** — sâu thứ hai trong các log T9 (kỷ lục 225.224 kB đợt 180; đợt 179: 333.672 kB; đợt 181: 363.464 kB; đợt 182: 391.344 kB; đợt 183: 403.492 kB; đợt 184: 404.144 kB — đợt này min THẤP HƠN mọi đợt kể từ 180 trừ 180). Lúc đó balloon chưa ghim, load1 0,24 — trũng sâu nhất phiên nằm TRƯỚC khi ghim (E-226 bắt đầu 5 phút sau). 21 mẫu <512.000 kB trong 122 mẫu (17,2%; đợt 184: 25/119 = 21,0% — tỉ lệ GIẢM NHẸ dù #104/#105 đều ghim nhiều: 39/122 mẫu CEIL).

**Bảng tổng hợp số RAM (từ script `t9-185-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 122 dòng — KHÔNG tính tay):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #104 9161bfd1 | 94 | 442.420 | 3.272.488 | 1.192.410,5 | 45/94 | 24 | 7,06 | 21 |
| #105 053a35c3 | 28 | 522.404 | 1.762.356 | 886.225,1 | 8/28 | 15 | 2,46 | 0 |
| **Toàn phiên** | **122** | **442.420** | **3.272.488** | **1.122.138,5** | **53/122** | **39/122 (32,0%)** | **7,06** | **21** |

- **Mean toàn phiên 1.122.138,5 kB — 2 cách độc lập: python `sum/n = 1.122.138,5` VÀ trung bình có trọng số ((94×1.192.410,5 + 28×886.225,1)/122 = 1.122.138,5) — KHỚP CẢ HAI.**
- 21 mẫu RAM <512.000 kB, 3 dải (từ script python trên log đóng băng): #104: 12:34:10Z (1); 12:50:10–12:57:10Z (8); 13:02:11–13:13:11Z (12). Tổng 1+8+12 = 21 — KHỚP số đếm toàn phiên. 16 mẫu <500.000 kB đều nằm trong 2 dải ghim E-227/E-228.

### 2.2 Balloon virtio — E-226/E-227/E-228 mới trên #104 + E-229 đang ghim trên #105

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Trần balloon **6.443.824 kB — KHẲNG ĐỊNH cho #104 và #105** (max bal trong log = đúng CEIL trên cả hai boot).
- **Boot #104: GHIM 24/94 mẫu (25,5%), 3 EPISODE MỚI (E-226–E-228).** Balloon leo trần lần đầu sau ~59 phút (E-226 bắt đầu boot+1h25m28s — muộn hơn nhiều so với #103: E-221 bắt đầu boot+14m05s) rồi ghim/xả theo chu kỳ ngắn (~3–12 phút/episode).
- **Boot #105: GHIM 15/28 mẫu (53,6%), 1 EPISODE MỚI (E-229), VẪN GHIM lúc đóng.** Balloon leo trần rất nhanh trên boot mới (E-229 bắt đầu boot+14m14s — khớp mẫu #103 E-221 boot+14m05s).

| Episode | Span (UTC) | n | Boot | RAM (kB) | Kết thúc |
|---|---|---|---|---|---|
| E-226 | 12:39:10–12:41:10Z | 3 | #104 | 519.564–553.400 | Sag 12:42:10Z bal **6.050.608 = sàn, LẦN 9** |
| E-227 | 12:50:10–12:58:10Z | 9 | #104 | 478.124–525.464 | Sag 12:59:10Z bal 6.281.776 |
| E-228 | 13:02:11–13:13:11Z | 12 | #104 | 477.408–508.756 | **KẾT THÚC BỞI REBOOT #105** (mẫu cuối #104 vẫn CEIL) |
| E-229 | 13:27:46–13:41:47Z | 15 | #105 | 530.020–650.148 | **VẪN GHIM lúc đóng** |

- **Tổng ghim trần đợt này: 39/122 mẫu (32,0%)** (đợt 184: 38/119 = 31,9% — GẦN NHƯ KHÔNG ĐỔI; đợt 183: 8/115 = 7,0%; đợt 182: 44/114 = 38,6%; đợt 181: 34/123 = 27,6%; đợt 180: 19/116 = 16,4%; đợt 179: 27/131 = 20,6%). Tỉ lệ ghim trên #105 (53,6%) cao nhất kể từ #100 đợt 182; trên #104 (25,5%) thấp hơn #103 (43,0%).
- **Phán theo quy tắc chuỗi cơ học (T9 phán, giao T10 xác nhận):** E-226/E-227/E-228/E-229 đều là EPISODE MỚI (≥2 mẫu CEIL liên tiếp, sag/reboot tách rõ ≥3 mẫu); E-226/E-227 kết thúc bởi sag, E-228 kết thúc bởi reboot #105, E-229 còn ghim lúc đóng. **Caveat tách E-227/E-228 (F-185-T9-2):** khoảng tách chỉ ĐÚNG 3 mẫu dưới trần (12:59:10Z bal 6.281.776; 13:00:10Z bal 6.348.236; 13:01:11Z bal 6.439.692 — mẫu cuối chỉ thiếu 4.132 kB là tới trần). Theo quy tắc đứng (≥3 mẫu dưới trần = tách SẠCH, tiền lệ đợt 184), T9 phán TÁCH thành E-227 (9) + E-228 (12). Nếu parent áp dung sai "sag phải sâu hơn" thì hai run gộp thành MỘT episode 24 mẫu 12:50:10–13:13:11Z — T9 ghi rõ phương án này để T10/parent quyết; số mẫu ghim tổng (39) KHÔNG đổi theo cả hai cách đếm.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate: balloon 6.443.824 kB = **6,14 GiB** khi ghim; RAM khả dụng lúc ghim E-228 chỉ ~477–509.000 kB trong khi tổng RAM − balloon = 1.681.076 kB. Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.

### 2.3 Lượt yên WebKit #54 (T4) — CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ 46 → 47 (T9 đối chiếu LIMITS T4, không phán thay T4)

- **#54 CÓ LƯỢT HỢP LỆ — attempt1-9161bfd1: 20/20 + lớp B ĐẠT 5/5, tickCost median 45,0 ms ≤ 60 — CHUỖI LƯỢT YÊN HỢP LỆ 46 → 47.** Cửa yên mở poll #15 (11:52:20Z): load1 0,23, load5 1,88, RAM 1350 MB, gate0=T5 (POSTBOOT_PASS #104, 11:42:15Z, replay-đầy-đủ, poll=0, KHÔNG caveat). Attempt1 chạy 11:52:20–11:55:49Z (3'29") — 20/20 pass, lớp B 5/5; analyzers chạy NGOÀI cửa sổ attempt 11:55:49–11:56:12Z (quyết (p) đợt 179). Poller thoát exit 0 lúc 11:56:12Z. Ngân sách dùng **1/3** (hợp lệ ngay attempt đầu — không retry). **0 reboot trong phiên đo.**
- **Đối chiếu sampler T9 (độc lập, cadence 60 s) trong cửa sổ attempt1 11:52:20–11:55:49Z:** 3 mẫu (11:53:09Z, 11:54:09Z, 11:55:09Z): RAM 919.056–1.437.232 kB — **gate A 2/3** (mẫu 11:53:09Z RAM 919.056 kB < 1024 MB — dưới gate A nhưng lớp B của T4 vẫn ĐẠT 5/5 theo tiêu chí riêng của T4; sampler T9 cadence 60 s không phán thay lớp B); balloon 4.968.244–5.143.040 kB, **0 mẫu ghim**; load1 **0,31–3,08**. **6 spike B2 trong cửa sổ attempt1** (xem §2.5) — KHỚP số T4 ghi (6 spike, load1 3,00–3,51).
- **F-184-T4-2 KHÔNG LẶP LẠI:** 13 mẫu sampler trước khi cửa mở (11:40:09–11:52:09Z) có RAM min **1.339.428 kB** — **0 mẫu RAM <500 MB** trước cửa; T4 ghi RAM 1.693 MB lúc 11:41:33Z + 1.350 MB lúc cửa mở — KHỚP. Labellag (b) đợt này: T4 ghi 8 occ / 1 event (seq 180–184, max +13f) — **lần thứ hai liên tiếp >0** (đợt 184: 6 occ / 1 event).
- **F-185-T2-9 (theo T2): watchdog v1 2 lỗi phương pháp, đã sửa v2 — tuân thủ KHÔNG VI PHẠM đợt này.** T4 phán 0 vi phạm phía T4; chuỗi 0 vi phạm GIỮ 0 — parent quyết cuối.

### 2.4 Dữ kiện sampler T9 trong cửa sổ T0/T4/T8 (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 | RAM | Ghi chú |
|---|---|---|---|---|
| T0 O8 11:42:47–11:46:41Z | #104 | 1,46–7,06 (4 mẫu) | 1.736.576–1.892.580 kB — **gate A 4/4** | **O8 T0 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); **34 spike B2** trong cửa sổ (xem §2.5); 0 mẫu ghim |
| T4 attempt1 #54 11:52:20–11:55:49Z | #104 | 0,31–3,08 (3 mẫu) | 919.056–1.437.232 kB — **gate A 2/3** | **#54 CÓ lượt hợp lệ 20/20 + B 5/5**; 0 mẫu ghim; **6 spike B2** |
| T8 harness 12:03:46–12:18:56Z | #104 | 0,40–4,46 (15 mẫu) | 920.800–3.272.488 kB — **gate A 13/15** | **HARNESS 6/6** (WebKit 3/3 + Chromium 3/3 PASS); **16 spike B2** trong cửa sổ; 0 mẫu ghim |
| T8 O8 12:20:27–12:22:57Z | #104 | 1,64–2,80 (2 mẫu) | 772.428–1.390.776 kB — **gate A 1/2** | **O8 T8 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21); 3 spike B2; 0 mẫu ghim |

- T1-185: verify 184 PASS (chuỗi khớp lần thứ 94; GAP §112 ĐÃ CẬP NHẬT — F-184-T1-1 ĐÓNG). T7-185 CHƯA đóng → không có cửa sổ T7 (kết cục run 184 + cửa slot thuộc T7-185/T10). T5-185: **POSTBOOT_PASS #104 ĐÃ CÓ 11:42:15Z** (replay-đầy-đủ, poll=0, KHÔNG caveat — đề xuất); **#103 KHÔNG CÓ — tổng boot không cờ 22 → 23 nếu parent chấp nhận** (T5 không thử repair — boot đã chết theo #104; tiền lệ #100/#83).
- T2-185: **(m) #103 DƯƠNG (CUỐI cấp T2) + INSIDE #103 TRUE (FULL149, chuỗi 4 → 5)** — theo cờ T2-185 (T9 không phán thay T2); mù hole-recheck lần 29 NEW=0 mọi hố; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 28. T6-185: **(A) 120/120 lần thứ 35** + **#103/#104 KHÔNG GIẾT HOLDER — chuỗi mới = 9 (#96–#104)** + prune lần 60 (xóa 2 file, queue 102 → 100).
- T8-185: **HARNESS 6/6 trên #104; V2 (f'') ĐÃ TRIỂN KHAI làm phương án chính** (replay V2 4/4 @125s, V1-300 đối chứng 3/4, 0 FP cả hai trên 18 log sạch); **FULL PASS 5/5 chân cùng boot #104 — chuỗi 0 → 1 (ĐỀ XUẤT, parent quyết)**; B1 live SẠCH LẦN THỨ BA; H3 chỉ giám sát thụ động (86n2-P1 PASS, không kẹt lần 8); WebKit launch-fail ĐÃ HEAL trên #104 (libevent 6/6 CÓ).

### 2.5 B2 — 110 spike THẬT, 3 cụm, TẤT CẢ trên #104; 0 spike trên #105; 6 spike trong attempt1 + 0 spike trong span ghim

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot. **110 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 110): TẤT CẢ trên #104, 3 cụm; 0 spike trên #105 (watcher khởi động lại 13:14:55Z, load1 #105 max sampler 2,46 < 3,0 — không có spike nào để bắt; khoảng mù qua reboot #105 ~95 s, load1 sampler trong gap 0,00 → 2,46 — không bằng chứng spike bị lỡ, nhưng không loại trừ hoàn toàn spike thoáng trong gap); 0 spike trong span ghim E-226/E-227/E-228/E-229 — như đợt 177–184; 6 spike trong cửa sổ attempt1 T4 #54 (11:52:20–11:55:49Z) — KHỚP T4; 0 spike trong span ghim.** 34 spike trong cửa sổ O8 T0 (11:42:47–11:46:41Z); 16 spike trong cửa sổ harness T8; 3 spike trong cửa sổ O8 T8.

| Cụm | Thời gian (UTC) | n | load1 max | Driver đứng đầu |
|---|---|---|---|---|
| 1. Mở phiên + O8 T0 | 11:40:15–11:46:59Z | 69 | 7,76 | WebKitWebProcess + hatch + chrome + MainThread + grep — driver đúng là trình duyệt đo (O8 T0) + runtime |
| 2. Sau O8 + attempt1 #54 | 11:47:04–11:56:12Z | 21 | 5,79 | MainThread + WebKitWebProcess + hatch + vite/esbuild — attempt T4 + poll-wait |
| 3. Harness + O8 T8 | 12:03:50–12:22:24Z | 20 | 4,46 | MiniBrowser + WebKitWebProcess + chrome + esbuild — driver đúng là harness T8 |

- **Tổng kết: 110/110 spike có process đứng đầu %CPU; load1 đỉnh đợt (watcher, cadence 2 s): 7,76** (đợt 184: 9,7 — đợt này THẤP HƠN; load1 max sampler cadence 60 s là 7,06 — cùng bậc, khác cadence). **34 spike trong cửa sổ O8 T0; 6 spike trong cửa sổ attempt1 (KHỚP T4 — toàn tải của chính attempt, B2 vẫn ĐẠT); 0 spike trong span ghim.** 34 spike ≥5,0.
- Cụm 1 tách nhỏ: 35 spike TRƯỚC O8 (11:40:15–11:42:4xZ — T0/T1/T5/T6 mở phiên + T4 poll-wait) + 34 spike TRONG O8. **Khoảng mù watcher đầu phiên: ~0 phút** (watcher khởi động 11:40:17Z; spike đầu bắt 11:40:15Z — b2watch chạy lại sau sampler 8 s; load1 sampler mẫu đầu 3,02 — spike đầu trùng mẫu đầu, không có gap phủ sóng đáng kể). **Khoảng mù qua reboot #105: ~95 s** (watcher chết ~13:13:32Z, chạy lại 13:14:55Z; 0 spike trên #105 sau đó). **0 gap phủ sóng watcher nào khác.** Top driver toàn phiên (đếm từ snapshot top-12): bash 213 + MainThread 135 + hatch 110 + hatch-execd 108 + chrome 66 + b2watch.sh 66 (watcher tự xuất hiện trong snapshot của chính nó — artifact tự quan sát, cùng họ với `ps` đã loại ở quyết (n) đợt 150; không đổi kết luận spike thật vì load1 đo độc lập) + grep 63 + systemd 59 + esbuild 57 + systemd-journal 52 + MiniBrowser 36 + WebKitWebProces 35.

## 3. Birefnet guard (cơ chế (a) — 0 lần thử, lần thứ 39)

- **Cơ chế (a) armed suốt phiên, không kích hoạt:** sampler `round185-t9/sampler.sh` chạy 11:40:09Z–13:41:47Z (2 instance: instance 1 sống 11:40:09Z–13:13:11Z trên #104 rồi **CHẾT theo reboot #105**; instance 2 khởi động lại 13:14:46Z trên #105, sống tới khi T9 dừng tay ~13:41Z — **1 gap qua reboot (95 s), 0 gap >90 s khác; max gap trong boot 61 s**), **122 mẫu**.
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **3.272.488 kB = 52,0% guard** (đợt 184: 42,9%; đợt 183: 46,8%; đợt 182: 79,9%; đợt 181: 42,6%; đợt 180: 38,83%; đợt 179: 40,52%; đợt 178: 66,35%; đợt 177: 41,78%; đợt 176: 48,52%; đợt 171: 98,69% — sát nhất từ trước tới nay). Khoảng cách tới guard lúc đỉnh: **3.018.968 kB (48,0%)**. **Caveat (F-179-T9-4 đợt 178): cadence 60 s không loại trừ được một lần vượt guard dưới 60 s giữa hai mẫu — T9 chỉ claim 0 MẪU đạt guard; cơ chế (a) KHÔNG kích hoạt vì không mẫu nào đạt guard.**
- **0 lần thử birefnet trong đợt 185 — lần thứ 39 liên tiếp** (đợt 147–185: 0 mỗi đợt). **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 39 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round185-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (tồn tại, symlink → /usr/bin/python3.12), `server/bgremove/bgremove.py` 23.500 B, `~/.u2net/birefnet-general.onnx` 972.666.916 B, `~/.u2net/u2net.onnx` 175.997.641 B (không đổi so với đợt 184); không có thư mục `~/workspace/tmp-t9-185-birefnet/` (không thử gì).

## 4. ENOSPC trong journal (đếm trực tiếp 28 dòng — đợt thứ 34 liên tiếp — lỗi KHÔNG dừng trên #105)

- **#104:** đếm trực tiếp **4 dòng lúc 11:40:28Z** (dòng đầu 11:36:35Z = boot+22m53s — PHÁ MẪU boot+~110s, xem F-185-T9-3; dòng cuối đếm được 11:39:51Z). Phần 11:40:28Z → reboot 13:13:32Z (~93,1 phút) **KHÔNG đếm được** (journal #104 mất sau reboot #105 — `--list-boots` lúc đóng chỉ còn idx 0 #105); ngoại suy theo nhịp đo được trên #105 (~0,92 dòng/phút) và #103 (~0,89): +~84 dòng → **#104 ≈ 88 dòng (ƯỚC TÍNH, ghi rõ)**.
- **#105:** **24 dòng** (đếm trực tiếp lúc đóng 13:42:xxZ — toàn bộ từ lúc mở boot tới lúc đóng; journal bắt đầu 13:13:44Z nên phủ sóng đầy đủ). Dòng đầu **13:15:20Z (boot+108s)** — TRỞ LẠI mẫu #103 (+111s), #102 (+112s), #101 (+108s), #100 (+110s), #99 (+109s), #93 (+114s), #91 (+~120s), #90 (+121s), #95 (+105s), #98 (+103s). Dòng cuối **13:41:24Z** — lỗi VẪN ĐANG XẢY RA lúc đóng (nhịp ~0,92 dòng/phút, đều).
- **Tổng đợt 185 đếm trực tiếp: 28 dòng** (4 #104 + 24 #105) — cận dưới; ngoại suy ≈ **112 dòng** (88 + 24). Dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. T9 chỉ ghi số đếm + thời gian, không phán service gây lỗi (ngoài phạm vi VCut).
- **Phương pháp chuẩn 6 điểm (parent CHỐT đợt 183, F-183-T9-4 — T9-185 áp dụng đầy đủ):** (1) đếm bằng `journalctl -b 0 | grep -c "No space left on device"`; (2) đối chiếu `journalctl -b 0 | grep -c inotify` — hai số PHẢI KHỚP (đợt này: #104 cả hai đều 4 lúc 11:40:28Z; #105 cả hai đều 24 lúc đóng); (3) ghi rõ **timestamp đếm + dòng đầu/cuối** (boot+giây); (4) đếm lại lúc đóng phiên; (5) phần journal mất sau reboot thì ngoại suy theo nhịp đo được, GHI RÕ là ước tính (không cộng vào số đếm trực tiếp); (6) số đếm của mỗi boot là lũy kế từ đầu boot tới lúc đếm — snapshot sớm luôn là cận dưới.
- **Caveat đếm:** `journalctl --since` / `--list-boots` sau reboot chỉ còn boot hiện tại — T10 không đếm lại được ENOSPC #104 từ cell (cùng mẫu F-171-T10-4 … F-184-T9-5). Số #104 (4) lấy từ đếm trực tiếp lúc 11:40:28Z — ghi trong baseline notes + §4 này. **Số #105 (24) đếm được lại đầy đủ từ cell** (journal #105 còn nguyên lúc đóng).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #105 mới giữa phiên (T9 bắt trực tiếp, khởi động lại 95 s gap mẫu) + #104 trước khi đợt mở

- **#105 (053a35c3, btime 13:13:32Z; số hiệu + btime chờ T0-186 xác minh 9 nguồn).** Btime: `uptime -s` 13:13:32Z; boot_id `053a35c3-5b54-4bcf-adf9-7d2eda54d26d`. Gap #104→#105 = **7.190 s (1h59m50s)**. Sampler + watcher B2 + probe-loop **CHẾT theo reboot** (mẫu cuối #104 13:13:11Z — 21 s TRƯỚC btime, trong khoảng bình thường); **exec service cũng restart cùng lúc** (sleep 1500 đang chạy bị SIGTERM — xem F-185-T9-5). T9 khởi động lại 3 daemon lúc 13:14:46–13:15:04Z (**gap mẫu 95 s**; probe headroom TRONG cửa sổ thoáng (boot+62s: 30.000 chạm cap) rồi mới đọc journal/uptime). Probe-loop mới chạy lan-2 ~13:45Z (KHÔNG chạy — T9 dừng daemon lúc đóng 13:41Z, thay bằng probe tay cặp đóng 13:41:49Z = 0). Daemon dừng lúc đóng bằng `kill` theo PID (không lặp lỗi `pkill -f` ở F-175-T9-2). **Điểm yếu (d) đợt 148 TÁI DIỄN lần 9 — nhưng T9 phát hiện + khởi động lại trong phiên.**
- **#104 (9161bfd1, btime 11:13:42Z):** TRƯỚC khi đợt mở 26m09s; **T0-185 XÁC MINH 9/9 nguồn tươi** (epoch 1795518822; gap #103→#104 = 7.127 s; O8 PASS 3/3 trên #104; run 184 SUCCEEDED 11:16:07Z, margin +1.184 s, viết lại ×2 — kết cục thuộc T7-185; (m) #104 thô: 0 requeue trong cửa hẹp). **#103 XÁC NHẬN 9 nguồn (T0-185)** — nợ đợt 184 đã trả (hạn chế: journal/wtmp #103 không đọc tươi lại được — đối chiếu hồ sơ lưu + DB tươi). **F-184-T2-11 ĐÃ TRẢ LỜI: KHÔNG nhảy lùi — đồng hồ nhanh trước #103, delta > 9 s** (poll cuối watcher-184 09:15:04Z trên boot cũ). **Không có reboot nào khác giữa phiên.**
- **Khoảng mù giữa hai đợt: 59'07" không sampler T9** (mẫu cuối đợt 184 10:41:02Z → mẫu đầu đợt 185 11:40:09Z) — chứa reboot #104 + cửa sổ thoáng #104 (không quan sát được). Marker: T0-185 đếm sống qua **56 reboot #49–#104** (đã xác nhận); **#105 chưa xác nhận** (thuộc T0-186) → sống qua 57 reboot nếu #105 được xác nhận.

### 5.2 T5-185 — POSTBOOT_PASS #104 CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat); #103 KHÔNG CÓ — tổng boot không cờ 22 → 23

- **POSTBOOT_PASS #104 ĐÃ CÓ lúc 11:42:15Z** (T5-185, mode **replay-đầy-đủ, poll=0, KHÔNG caveat**, tools CÀI, GST thư mục thật — KHÁC #98/#101 repair). T0 O8 bắt đầu 32 s sau cờ (11:42:47Z); T4 attempt #54 chạy trên #104 sau cờ.
- **POSTBOOT_PASS #103 KHÔNG CÓ — KHÔNG THỬ REPAIR** (boot đã chết theo #104; dpkg.log/history #103 mất theo rootfs rebuild; không watcher nào sống trên #103 sau 09:15:04Z; tiền lệ #100/#83); **tổng boot không cờ 22 → 23 nếu parent chấp nhận** (quyết (c) đợt 185). **#102/#99/#98/#96/#95 VẪN CÓ**; **#97/#100 VẪN KHÔNG CÓ**.
- **POSTBOOT_PASS #105 CHƯA CÓ** — T5-185 đã đóng cờ trước reboot #105 (13:13:32Z); watcher-185 đã chết theo #105. Thuộc T5-186.

### 5.3 Các luồng khác — T7 CHƯA đóng; (m)/INSIDE/mù thuộc T2-185; harness T8 6/6

- T7-185 CHƯA xuất bản LIMITS/cờ lúc T9 đóng (~13:42Z) — kết cục run 184 (SUCCEEDED 11:16:07Z, margin +1.184 s — theo T0-185) + run 185 + DR/HB + cửa slot thuộc T7-185/T10. T9 đóng đúng hạn cờ, không chờ T7 (cùng mẫu đợt 177–184, theo quyết (l) đợt 152).
- T0-185: #103 + #104 XÁC MINH 9/9 nguồn; O8 PASS 3/3 trên #104 (11:42:47–11:46:41Z); run 184 SUCCEEDED +1.184 s. T1-185: verify 184 PASS (chuỗi khớp lần thứ 94); GAP §112 ĐÃ CẬP NHẬT (F-184-T1-1 ĐÓNG). T2-185: (m) #103 DƯƠNG (CUỐI) + INSIDE #103 TRUE (FULL149, chuỗi 4 → 5) + mù (hole-recheck lần 29) + (m) #56 lần 28 — theo cờ T2-185 (T9 không phán thay T2). T5-185: POSTBOOT_PASS #104 CÓ (replay, poll=0, KHÔNG caveat); hướng (3) VẪN ĐỨNG lần 32 (theo T5-185). T6-185: (A) 120/120 lần 35; #103/#104 KHÔNG GIẾT HOLDER (chuỗi 9); prune lần 60 (xóa 2, queue 102 → 100).
- **F-184-T9-3 ĐÃ HẾT DẠNG CŨ (xem F-185-T9-3):** mẫu sampler cuối #104 (13:13:11Z) SỚM HƠN btime #105 (13:13:32Z) 21 s — trong khoảng bình thường (cadence 60 s); lệch đồng hồ trước #103 đã được T0-185 trả lời (F-184-T2-11: KHÔNG nhảy lùi, đồng hồ nhanh, delta > 9 s), không có lệch mới trước #105 mà T9 đo được (giao T0-186).

## 6. Sai số / caveat (F-185-T9-*)

- **F-185-T9-1 — CỬA SỔ THOÁNG #105 MỞ 30.000 (CHẠM CAP) — LẦN MỞ THỨ BA LIÊN TIẾP CHẠM CAP, ĐÓNG TRONG ≤30 S (MẪU MỚI — XEM §1).** Probe tay lúc boot+62s = 30.000 (cap — giá trị thật ≥ 30.000, không đo được); probe-loop lúc boot+92s = 0. Cửa sổ mở rồi đóng trong khoảng (62s, 92s] — rộng hơn #103 (≤9 s) nhưng hẹp hơn #102 (≤80 s). Ba lần mở liên tiếp đều chạm cap và đều bắt đầu ở boot+61–62s — mẫu ổn định cho T10/parent ghi nhận. T9 chỉ ghi nhận số + thời gian, không phán cơ chế (host-side).
- **F-185-T9-2 — TÁCH E-227/E-228: CHỈ ĐÚNG 3 MẪU DƯỚI TRẦN, MẪU CUỐI CHỈ THIẾU 4.132 kB (ghi nhận — T9 phán TÁCH theo quy tắc cơ học, T10/parent quyết cuối).** Khoảng tách 12:59:10Z (bal 6.281.776) → 13:00:10Z (6.348.236) → 13:01:11Z (6.439.692, chỉ thiếu 4.132 kB là tới trần) — đúng ngưỡng ≥3 mẫu của quy tắc đứng, nhưng mẫu cuối là near-miss. Phương án gộp (1 episode 24 mẫu 12:50:10–13:13:11Z) được ghi rõ ở §2.2; số mẫu ghim tổng 39 KHÔNG đổi theo cả hai cách. **Sàn balloon 6.050.608 kB LẶP LẠI LẦN 9** (sag kết thúc E-226, 12:42:10Z). Giá trị này còn xuất hiện 1 lần nữa trong log (12:35:10Z) — dip 1 mẫu xuống đúng sàn GIỮA LÚC LEO (trước đó bal 6.405.900, sau đó leo lại 6.170.648) — KHÔNG phải sag kết thúc episode, không tính vào số lần lặp lại; ghi nhận như hiện tượng riêng. **Giá trị sag 6.247.216 kB: 0 lần đợt này** (không lặp lại).
- **F-185-T9-3 — ENOSPC #104: DÒNG ĐẦU MUỘN boot+22m53s — PHÁ MẪU boot+~110s (ghi nhận).** Journal #104 bắt đầu 11:13:54Z (boot+12s) nên phủ sóng đầy đủ — lỗi xuất hiện MUỘN thật trên #104 (4 dòng tới 11:40:28Z, nhịp ~1,03 dòng/phút trong 4 dòng đầu). #105 trở lại mẫu boot+108s. T9 chỉ ghi nhận, không phán nguyên nhân (host-side; có thể service home-assistant-ensure khởi động muộn trên #104).
- **F-185-T9-4 — F-182-T9-1 KHÔNG TÁI DIỄN (KHỞI ĐỘNG DAEMON ĐÚNG NGAY LẦN 1, CẢ HAI LẦN).** T9-185 khởi động RIÊNG TỪNG daemon (`cd ... ;` tách lệnh, KHÔNG dùng `cd ... && setsid ... &`) lúc mở phiên (sampler 6565, b2watch 6789, probe-loop 6860) và lúc khởi động lại sau reboot #105 (sampler 2959, b2watch 2984, probe-loop 3014) — cả 6 lần chạy đúng ngay, 0 lỗi "No such file". Bài học đứng: khởi động daemon riêng từng cái, `cd` tách bằng `;`.
- **F-185-T9-5 — EXEC SERVICE RESTART GIẾT SLEEP KIỂM + REBOOT #105 GIẾT DAEMON (tái diễn F-184-T9-5 lần 8).** Sleep nền chờ lượt kiểm bị SIGTERM khi exec service restart đi kèm reboot #105 (~13:13Z); daemon cũ chết theo #105 nên lượt kiểm đó KHÔNG chạy bằng sleep cũ. T9 bắt được reboot #105 trong lượt kiểm tay ngay sau (boot_id đã đổi lúc 13:14:17Z), khởi động lại daemon 13:14:46–13:15:04Z (gap mẫu 95 s) + probe tay win105-open bắt được cửa sổ thoáng đang mở. KHÔNG mất số liệu sampler (log đóng băng đầy đủ 122 mẫu).
- **F-185-T9-6 — T7 CHƯA đóng cờ lúc T9 đóng (~13:42Z) + T9 ĐÓNG ĐÚNG HẠN CỜ.** T9 không chờ T7 (kết cục run 185 + cửa slot thuộc T7-185/T10; cùng mẫu đợt 177–184, theo quyết (l) đợt 152). Cờ T9 viết MỘT LẦN — giữ mẫu sửa F-175-T1-7 (đợt 178: hai bản md5 khớp).
- **F-185-T9-7 — 0 VI PHẠM F-175-T4-2 THEO T9 (chuỗi 0 vi phạm GIỮ 0 — CHỜ parent quyết cuối).** Không probe nào của T9 chạm dpkg; probe headroom là ctypes inotify nhẹ (với headroom 0 thì fail ngay ở watch đầu, không tạo tải; probe mở #105 chạm cap 30.000 chỉ tạo watch trong thư mục tạm rồi giải phóng ngay — không chạm dpkg, không chạy trong cửa sổ attempt T4); 6 spike B2 trong cửa sổ attempt1 #54 là tải của chính attempt (KHỚP T4 — WebKitWebProcess đứng đầu); 0 spike B2 trong span ghim. T4-185 phán 0 vi phạm phía T4; T2-185 phán tuân thủ KHÔNG VI PHẠM — parent quyết cuối về chuỗi.

- **Caveat đứng:** probe cap 30.000 (giá trị mở #105 là censored — chỉ biết ≥ 30.000); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC #104 từ cell vì journalctl chỉ còn boot hiện tại sau reboot; T10 không đếm lại độc lập B2 đợt 185 (chỉ đọc log đóng băng); T7-185 chưa đóng nên không có cửa sổ T7 để đối chiếu; #105 chưa xác minh 9 nguồn (thuộc T0-186); fixture /tmp mất theo #102 — rebuild SAU gate đợt 185 (T8-185 đã rebuild fixture 12:03Z, exit 0, md5 khớp đợt 125 — nợ này ĐÃ TRẢ, xem LIMITS T8); E-229 còn ghim lúc đóng — kết cục thuộc T9-186.

---

## Phụ lục — log đóng băng (không kèm nội dung đầy đủ — xem file, md5 dưới)

Log sampler đóng băng (122 mẫu, 11:40:09Z–13:41:47Z): `round185-t9/ram-sampler-FROZEN.log` — md5 `57675caac8baab71fa1917b63d6ea554`. Log B2 đóng băng (110 spike): `round185-t9/b2-spikes-FROZEN.log` — md5 `45889aeaf6ffb024059f1dc83d6bcabd`. Log headroom đóng băng (7 lần đo): `round185-t9/headroom-log-FROZEN.txt` — md5 `7100b6e14dc732a35977edb259a16575`. Phân tích bằng script: `round185-t9/t9-185-analyze.py` (output: `round185-t9/t9-185-analyze-output.txt`). Ghi chú baseline: `round185-t9/t9-185-baseline-notes.md`. Probe tay cửa sổ #105: `round185-t9/probe-once.py`. T10 đọc log đóng băng trực tiếp khi cần.
