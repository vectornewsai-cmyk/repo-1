# PHASE9 ROUND140 T2 — EPERM: probe #59 ok=2 fail=0 + mù #59 ĐÓNG HOÀN TOÀN (2 đoạn, 1 reboot) + gap #96?→#97? CHỨNG NHẬN [7.246, 7.266] s → CERT 58 / FULL 73 + khung chết #96? ứng viên merged 21 s + #98? INSIDE dải chuẩn (reboot 17:52:56Z sau khi đo xong) + WFS #46 chênh 0

> Luồng T2, đợt 140 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07
> 19/11/2026; làm việc 17:38Z → ~17:55Z 18/11/2026).
> Nhiệm vụ: probe #59 theo lịch thường lệ + mù #59 (từ probe #58) +
> boot #97? + WFS lần 46 (đối chiếu bằng SỐ TỔNG KẾT theo quyết parent
> đợt 138 §12.3(h) — file thô scan #43 đã mất, chấp nhận mất).
> Quyết parent đợt 139 §12.2: (a) CHẤP NHẬN đóng đợt 139 (9/9, T10 đóng
> 17:01Z — quá hạn cứng ~1 phút); (b) **Khung chết #94?: GIỮ chuẩn
> (11:52:12Z, 11:52:20Z] (8 s)**, không đổi sang ứng viên 2 s (caveat dị
> thường đồng hồ F-139-T2-6); (c) **Khung chết #96?: HOÃN QUYẾT — giao
> T2-140 chứng nhận bằng merged mù #59** (hai khung không giao nhau, ghi
> cả hai kèm nguồn); (d) **Balloon: điều kiện can thiệp host ĐÃ THỎA
> nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A
> ≥1024 MB**, tiếp tục chờ; (e) **Birefnet: GIỮ NGUYÊN quy trình +
> guard 6.144 MiB**; (f) **Dải dự báo chuẩn cho #98?: dải T2 (FULL72)**;
> (g) **CHẤP NHẬN watchdog diag path mới là đường ổn định chính thức**;
> (h) **PHÊ DUYỆT poller T4 retry tối đa 2 lần khi lỗi setup** (từ đợt
> 140); (i) **Headroom: vẫn chỉ theo dõi** (nếu đợt 140 chạm <1.800 thì
> báo user lúc đó); (j) **XÁC NHẬN btime 13:53:41Z làm chuẩn cho boot
> 541524e2**; (k) **G1: ĐỂ YÊN, không nhắc lại**; (l) **R9 (a): ĐỂ YÊN,
> không nhắc lại; số đếm VẪN LÀ 16**.
> Prereg viết TRƯỚC khi đo: hidden_files/round140-t2/prereg-t2.md.
> **KHÔNG có mâu thuẫn BTO lần này:** marker round-in-progress.md đợt
> 140 ghi đúng btime 15:54:37Z cho boot af558fb5 (khác đợt 139, brief ghi
> sai +566 s — xem F-139-T2-1).
> **REBOOT MỚI SAU KHI ĐO XONG (xem §6):** boot **#98? 90392aa5, btime
> 17:52:56Z** — giữa lần kiểm cuối của T2 trên #97? (17:52:29Z) và lần
> kiểm sau đó (17:54:18Z). Reboot này KHÔNG nằm trong mù #59 (đóng
> 17:40:41Z) và KHÔNG đổi bất kỳ verdict nào dưới đây; **#98? NẰM
> TRONG dải chuẩn [16:22:31Z, 18:20:15Z] (FULL72)** và trong biến thể
> FULL73 [16:22:37Z, 18:20:05Z]. **Mù #60 MỚI MỞ** từ probe #59.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (17:39:47Z–17:40:41Z):**
  `status` báo **DEAD/STALE** (heartbeat age 10.585 s, last #58
  14:44:16Z, boot 541524e2, exit 1); `once` ngay sau đó là **probe
  #59, boot af558fb5, ok=2 fail=0**, exit 0, 17:40:41Z; `status`
  chạy lại **ALIVE** (age 0 s, n=59), exit 0. Log v2 tăng đúng **3
  dòng** (166 → 169) — **như mọi lượt trước**; prereg §3 đã dự báo
  đúng +3 trước khi đo. Heartbeat nay n=59, ts 17:40:41Z, boot
  af558fb5.
- **Boot #97? lúc 15:54:37Z, boot
  `af558fb5-e964-4116-a69b-ec784f3defab`** — xác minh bằng `uptime
  -s` + btime 1795017277 + `who -b` + journal 1 boot (xem §1). Clock
  VM hiện tại: HTTP `Date` 3 server hơn local **+1 s / +2 s / +2 s**
  → **F97? ≈ −1 s tới −2 s (±~1 s)** — lần đầu tiên 3 server không
  đồng nhất (xem F-140-T2-5).
- **Khoảng mù #59 (14:44:16Z → 17:40:41Z 18/11, 2h56'25" =
  10.585 s) — ĐÓNG HOÀN TOÀN. Mù đóng hoàn toàn thứ ba liên tiếp
  (#57, #58, #59).**
  Đoạn A ĐÓNG bằng luật lỗ (merged 154 mốc, lỗ lớn nhất **505 s** ≪
  sàn 1.147 s, tối đa **0 ẩn**); đoạn B ĐÓNG bằng uptime trực tiếp
  (merged 133 mốc, lỗ lớn nhất 1.722 s — vượt sàn nhưng uptime loại
  bỏ reboot ẩn). Merged 288 mốc giây.
  **Chuỗi mù đóng hoàn toàn: #50 đóng, #51 hở, #52 đóng, #53 hở,
  #54 đóng, #55 hở, #56 hở, #57 đóng, #58 đóng, #59 đóng.**
- **Gap #96?→#97? = [7.246 s, 7.266 s] (2h00'56" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn A mù #59 đóng, tối đa 0 ẩn; đoạn B đóng
  bằng uptime). **CERT 57→58 / FULL 72→73**: CERT58 mean 1h34'28"
  median 1h48'59" p10 0h27'21" p90 2h17'40" sd 0h45'27"; FULL73 mean
  1h41'03" median 1h50'39" p10 0h28'01" p90 2h25'29" sd 0h56'05";
  in 90–150' = 37, <60' = 17, >180' = 6, >240' = 2. Dải chứng nhận
  [0h00'55", 3h14'08"] không đổi.
- **Boot af558fb5 = #97? — XÁC NHẬN theo quy ước VÀ được củng cố bởi
  merged** (đoạn A mù #59 đóng, tối đa 0 ẩn — không có reboot ẩn
  giữa #96? và boot này) **+ T6-140 chốt chuỗi tương đối #57→#97?**
  (T6-140 §8.2, công bố TRƯỚC khi T2 đóng — khác đợt 139). Số tuyệt
  đối vẫn tạm theo thông lệ. Reboot #96?→#97? là **sự kiện gộp #21**
  (giữa lượt 139, theo T10-139; parent đã chấp nhận §12.2(a)).
- **Khung chết #96? ứng viên MERGED: (15:54:16Z, 15:54:37Z] (21 s)**
  — mốc cuối là ram-139t8.log của T8 (15:54:16Z). Hẹp hơn khung T9
  (15:54:02Z, 15:54:37Z] (35 s) — khung T9 là biên ngoài, mốc cuối
  của nó (sampler 15:54:02Z) KHÔNG phải mốc muộn nhất (merged có
  15:54:16Z, muộn hơn 14 s). Khung T8 (15:54:42Z, 15:55:24Z] là
  cách dựng KHÁC (driver còn sống 15:54:42Z → boot mới thấy
  15:55:24Z, quan sát trực tiếp, không neo btime) và mốc dưới của
  nó là nhân chứng nhảy (+5 s) — không giao với khung merged.
  **T2 ĐỀ XUẤT 21 s làm chuẩn mới** (cùng quy ước đồng hồ đọc như
  chuẩn #94? 8 s / #93? 14 s), kèm caveat đồng hồ cũ chạy nhanh
  (+5 s chắc chắn, tới +25 s có thể — xem F-140-T2-6); **parent
  quyết khi đóng sổ** theo quyết (c).
- **Khung chết #95?: (13:47:01Z, 13:53:41Z] (400 s) — GIỮ NGUYÊN**
  (T6-140 quét lại: 3 file, cùng một sự kiện; không có bằng chứng
  mới). Khung chết #94? GIỮ chuẩn (11:52:12Z, 11:52:20Z] (8 s) theo
  quyết (b). Khung chết #93? GIỮ chuẩn (09:35:47Z, 09:36:01Z]
  (14 s).
- **#97? INSIDE dải dự báo:** dải T2-139 (FULL72, neo tại #96?
  13:53:41Z) [14:21:34Z, 16:19:19Z] — thực tế 15:54:37Z **NẰM
  TRONG dải**. Chuỗi INSIDE theo dải cơ học kéo dài thành 4 lần
  liên tiếp (#94?, #95?, #96?, #97?).
- **Dải dự báo #98? — CHUẨN theo quyết parent (f): [16:22:31Z,
  18:20:15Z] (FULL72, neo tại #97? 15:54:37Z)** — khớp đúng dải
  T6-140 tính độc lập; dải hiệu dụng sau probe #59: [17:40:41Z,
  18:20:15Z]. Biến thể FULL73 (phân phối sau khi chứng nhận gap
  mới): [16:22:37Z, 18:20:05Z] — chênh ≤10 s, không đổi verdict
  nào (xem F-140-T2-7). **Reboot #98? 17:52:56Z NẰM TRONG cả hai
  dải** (xem §6).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 75 file
  *.log có mtime trong mù #59 (0 file repo-1, 75 file
  hidden_files); 2 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả launcher đã biết** (T10-O8, xem §2.7). Quét mở rộng: **8 match
  thô / 8 dòng duy nhất — phân loại hết** (6 dòng test-pass hasEperm
  + 2 dòng launcher). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** —
  **~173,7h** trước probe #59. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 46: 935 dòng / 261 file** (phạm vi 3.164
  file); R7b đối chiếu 960 dòng / 278 file; copies 25 dòng / 17
  file — y hệt lần 43, 44 và 45 về copies. Đối chiếu chéo 935+25=960=R7b,
  **chênh 0 — lần thứ bốn mươi sáu liên tiếp**. +9 dòng / +2 file so
  với lần 45, giải thích đúng hết bằng diff (xem §2.7). Đây là đối
  chiếu bằng **SỐ TỔNG KẾT** theo quyết (h) — file thô scan #43 đã
  mất, chấp nhận mất. Async `.writeFile(`: vẫn đúng **2 vị trí helper
  đã biết** — 0 stray.
- RAM: max biết được trong mù #59 **2.669.952 kB ≈ 2.607,4 MiB
  (T9-139, 15:13:59Z, đoạn A) — 42,44% guard 6.144 MiB, THIẾU
  3.621.504 kB (~3.536,6 MiB), KHÔNG vượt**; birefnet KHÔNG chạy bởi
  T2 (thuộc T9-140 theo quyết (e)). Đoạn B max 1.565.676 kB
  (24,9% guard). MemAvailable lúc đóng phiên T2 trên #97? chỉ
  693.556 kB (17:52:29Z, dưới gate A) — balloon phồng lại; sau
  reboot #98? MemAvailable vọt lên 1.714.084 kB (trên gate A, vẫn
  xa guard).
- **dpkg.log boot #97? — replay XONG: 1.545 dòng / 221 installs / 462
  configure**, lần ghi cuối 16:11:16Z (gstreamer1.0-tools), gói đầu
  libaspell15 16:08:45Z; replay bắt đầu 15:55:19Z (boot +42 s) —
  **KHỚP HOÀN TOÀN hình dạng replay của boot #94?/#96?**
  (1.545/221/462).
- **preview.tsx 530e10a7** (fix GIỮ VĨNH VIỄN theo quyết parent đợt
  137 §12.3(a)); media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts KHÔNG
  ĐỔI ee80d093. T2 không sửa production file nào.
- **Đợt 140 lúc T2 đóng (~17:55Z 18/11):** T1 + T6 đã có cờ `.done`
  (T1 17:40:10Z, T6 17:45:xxZ); các luồng khác (T4/T5/T7/T8/T9/T10)
  đang chạy; boot hiện tại **#98? 90392aa5** (reboot 17:52:56Z, sau
  khi T2 đo xong — xem §6). T2 KHÔNG mở Xvfb (không cần) nên không
  có gì để kill.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 17:38:57Z | boot_id `af558fb5-e964-4116-a69b-ec784f3defab`; `who -b` Nov 18 15:54; `uptime -s` **2026-11-18 15:54:37**; btime **1795017277 = 2026-11-18T15:54:37Z**; journal chỉ 1 boot (af558fb5, first entry 15:54:53Z, last 17:38:28Z lúc kiểm tra). MemAvailable 913.408 kB lúc 17:38:57Z. |
| Đo F97? (HTTP Date, 3 server) | 17:39:47–17:39:52Z | example.com Date 17:39:50Z vs local_after 17:39:49Z (+1 s); google.com Date 17:39:51Z vs local_after 17:39:49Z (+2 s); cloudflare.com Date 17:39:52Z vs local_after 17:39:50Z (+2 s) → **F97? ≈ −1 s tới −2 s (±~1 s)**. Đo trực tiếp đầu tiên trên boot mới (xem F-140-T2-5: lần đầu 3 server không đồng nhất). |
| Đọc dpkg.log bracket #97? | ~17:39Z | **1.545 dòng / 221 installs / 462 configure** — replay XONG (lần ghi cuối 16:11:16Z, lặng ~1h28' lúc đọc đầu — **chứng minh xong**). Gói đầu libaspell15 install 16:08:45Z; 98 dòng gstreamer; replay bắt đầu 15:55:19Z (boot +42 s). Khớp hình dạng replay boot #94?/#96?. |
| `bash scripts/probe-eperm-v2.sh status` | 17:40:41Z | **DEAD/STALE**, heartbeat n=58, ts 14:44:16Z, boot 541524e2, age **10.585 s** (đúng 2h56'25"); last sample probe #58; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 17:40:41Z | **probe #59, boot=af558fb5, ok=2 fail=0**, exit 0; dòng `boot changed 541524e2 -> af558fb5` (uptime since 2026-11-18 15:54:37) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~17:40:41Z | **ALIVE**, age 0 s, n=59, exit 0 |
| Xác minh boot lại (sau probe) | 17:40:41Z | Cùng boot af558fb5, `uptime -s` 15:54:37Z, btime 1795017277. MemAvailable 975.456 kB. |
| Xác minh boot lần 3 (lần kiểm cuối trên #97?) | 17:52:29Z | Cùng boot af558fb5 — **KHÔNG reboot tới thời điểm này**. MemAvailable 693.556 kB. (Reboot #98? xảy ra SAU lần kiểm này, xem §6 — câu "không reboot giữa phiên" chỉ viết sau lần kiểm cuối, bài học F-138-T2-8; lần này câu đó chỉ đúng tới 17:52:29Z.) |

Kiểm lại từ đĩa: log probe v2 **169 dòng** — 166 sau T2-139 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #58 +
dòng `boot changed` + dòng probe #59). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #58 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §3 đã dự báo đúng +3
trước khi đo. Heartbeat **n=59, ts 2026-11-18T17:40:41Z, boot
af558fb5-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

**Về btime và journal first entry:**
btime thật là **15:54:37Z** (/proc/stat 1795017277 + `uptime -s` +
`who -b`). Journal first entry là **15:54:53Z** — chậm hơn btime
16 s (journald khởi động sau kernel boot ~16 s; đúng mẫu của
#92?/#93?/#94? — boot #96? là 12 s, xem T2-139 §1). **Marker
round-in-progress.md đợt 140 ghi đúng 15:54:37Z — KHÔNG có mâu
thuẫn BTO lần này** (khác đợt 139, brief ghi 14:03:07Z sai +566 s).

Nguồn độc lập cho boot #97?: 2 session T2 trong vùng B (xem §2.3)
+ 133 mốc merged gộp trong vùng B (mốc đầu 15:54:40Z — xem §2.4;
mốc cuối 17:40:40Z — probe #59) + 3 exec-log nhắc af558fb5 trong
mù (xem §2.3) + **T6-140 chốt chuỗi tương đối #57→#97?** (T6-140
§8.2). **Số thứ tự #97? ĐÃ XÁC NHẬN theo quy ước (merged + T6)**
— số tuyệt đối vẫn tạm theo thông lệ; giá trị gap không phụ thuộc
số thứ tự.

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #59 (14:44:16Z → 17:40:41Z 18/11, 2h56'25" = 10.585 s)

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #59: `uptime -s` = **2026-11-18 15:54:37Z**,
  boot_id `af558fb5-e964-4116-a69b-ec784f3defab` — khác boot của
  probe #58 (541524e2).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (17:38:57Z): chỉ **1 boot**
  (af558fb5, first entry 15:54:53Z, last 17:38:28Z). Journal/wtmp
  của các boot trước đã mất theo reboot #97? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #97? — replay XONG, khớp hình dạng boot #94?/#96?.**
  Đọc lúc ~17:39Z: **1.545 dòng / 221 installs / 462 configure**
  (installs = số dòng `status installed`; configure = số dòng chứa
  `configure` — cùng phương pháp đếm với T2-136/137/138/139; lưu ý
  pattern `' configure '` có khoảng trắng chỉ cho 178 dòng vì các
  dòng `status half-configured` cũng chứa `configure` — số 462 là
  grep `configure` trần, như mọi đợt trước); lần ghi cuối
  **16:11:16Z** (gstreamer1.0-tools installed), lặng ~1h28' lúc
  đọc đầu — **chứng minh xong**. Gói đầu libaspell15 install
  16:08:45Z; 98 dòng gstreamer; startup packages configure
  15:55:19Z (×2) → startup archives unpack 16:08:44Z. Replay bắt
  đầu **boot +42 s** — chậm hơn #96? (boot +31 s) 11 s nhưng cùng
  hình dạng (cache apt SỐNG QUA REBOOT, cùng mẫu T5-137).
  **Hình dạng KHỚP baseline 1.545 dòng / 221 installs của
  #82?/#83?/#84?/#90?/#92?/#94?/#96?** — cùng một replay
  configure khô. **T5-140 là chủ quản postboot — bracket chính
  thức thuộc về T5; số của T2 là đọc độc lập đối chiếu.**
  **dpkg.log của boot #96? (541524e2) đã MẤT** (file lúc T2 kiểm
  chỉ còn log của boot mới): /var/log reset mỗi boot. Bản ghi
  T2-139 (1.545/221/462, lần ghi cuối 13:57:33Z) là bằng chứng còn
  lại cho boot đó — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**KHÔNG có reboot giữa phiên T2 lượt này — tới lần kiểm cuối
17:52:29Z:** boot af558fb5 xác minh lúc 17:38:57Z (mở lượt),
17:40:41Z (sau probe #59) và 17:52:29Z (lần kiểm cuối) — cùng
boot_id + btime 15:54:37Z. **Reboot #98? xảy ra SAU lần kiểm
cuối (giữa 17:52:29Z và 17:54:18Z) — xem §6.** Câu "không reboot
giữa phiên" chỉ đúng tới 17:52:29Z; lần này T2 ghi rõ ranh giới
thay vì viết câu tuyệt đối (bài học F-138-T2-8, áp dụng chặt hơn).

### 2.2 Reboot đã chốt trong mù — #97? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 97? | **15:54:37Z** (chính xác từng giây) | 541524e2 → af558fb5 | Chốt từ lượt này: `uptime -s` đọc tươi (17:38:57Z + kiểm lại 17:40:41Z + 17:52:29Z) + btime 1795017277 + `who -b` 15:54 + boot_id af558fb5 + journal first entry 15:54:53Z + probe #59 17:40:41Z boot af558fb5 ok=2 fail=0 + merged đoạn A đóng (tối đa 0 ẩn) + **T6-140 chốt chuỗi tương đối #57→#97?**. **Số thứ tự ĐÃ XÁC NHẬN theo quy ước và được củng cố bởi merged + T6.** |

**Clock:** F97? ≈ **−1 s tới −2 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` 3 server: example.com
+1 s, google.com +2 s, cloudflare.com +2 s (độ chi tiết 1 s của HTTP
Date). **F97? là lần đo trực tiếp đầu tiên trên boot #97?** — không
dùng cận hai lần đo. F96? ≈ −1 s (±~1 s, đã đo đợt 139). Hai đầu
chuỗi đo được (F96?, F97?) đều ≈ −1 s (F97? có thể −2 s) — đồng hồ
local ổn định ở mức chậm ~1–2 s ở cả hai đầu; xem §2.5 về cách caveat
này được xử lý. F98? ≈ −1 s (đo sau khi reboot #98?, xem §6 — cả 3
server đồng nhất +1 s).

**CẬN NHẢY CLOCK TẠI REBOOT:**
- **2 nhân chứng nhảy tại #97?:** **2 session** sinh trước btime
  có mtime sau btime (quét 279 exec-log):
  - proc_25be51a43185.log, birth 14:41:57Z, mtime **15:55:02Z**
    (btime +25 s) — **session sampler của T9-139** (vòng 1 bắt đầu
    14:41:57Z; mẫu cuối vòng 1 mang timestamp 15:55:02Z — cùng lớp
    F-139-T9-3: boot của mẫu chưa rõ, xếp theo quỹ đạo giá trị).
  - proc_d03e19ec3e58.log, birth 15:46:52Z, mtime **15:54:42Z**
    (btime +5 s) — **session driver của T8-139** (nguồn khung T8).
  Đồng hồ boot cũ chạy nhanh — cùng lớp F-137-T8-7 / F-138-T8-6 /
  F-138-T9-3 / F-139-T8-3. Mức nhảy: **chắc chắn ≥ +5 s** (driver
  T8), **tới +25 s có thể** (log sampler).
- Cận session: **|X97?| < 96 s** (session muộn nhất 15:53:01Z —
  session sinh 15:53:01Z, mtime = birth; session sớm nhất sau btime
  15:55:38Z).
- **Ranh giới (merged 4 phạm vi):** 0 file trong
  [btime −10 s, btime] (mốc cuối 15:54:16Z, −21 s — chính mốc chốt
  khung chết); **11 file trong (btime +0 s, +10 s]** — 10 file T8
  đợt 139 (15:54:40/41Z: n2-chromium-p6.png, n2-webkit-w7-report.json,
  n2-run.log, smoke logs, cooldown-t8-round139) + 1 exec-log nhân
  chứng nhảy (15:54:42Z). Các file T8 15:54:40/41Z là file của
  harness chạy trên boot cũ với đồng hồ chạy nhanh (ghi theo đồng
  hồ đọc), KHÔNG phải bằng chứng boot mới đã ghi đĩa trước
  15:54:42Z — dpkg replay của boot mới chỉ bắt đầu 15:55:19Z.
  Không có file +s kiểu mù #54 (#88? +8 s, #89? +3 s) hay mù #50
  ngoài các file T8 này (các file đó đều là hoạt động của harness
  cũ, không phải file hệ thống boot mới).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #96?→#97? = **[7.246 s, 7.266 s] (2h00'56" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn A mù #59 đóng, tối đa 0 ẩn; đoạn B đóng
  bằng uptime trong logic gộp — xem §2.3). **CERT 57→58 / FULL
  72→73** (xem §2.5).
- Gap #95?→#96? = [7.271 s, 7.291 s] — đã chứng nhận đợt 139, không đổi.
- Gap #94?→#95? = [8.169 s, 8.189 s] — đã chứng nhận đợt 139, không đổi.
- Gap #93?→#94? = [5.320 s, 5.340 s] — đã chứng nhận đợt 138, không đổi.
- Gap #92?→#93? = 9.473 s — **VẪN CHỈ LÀ SPAN** (đoạn A mù #56 mở,
  tối đa 1 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại đợt này — xem
  §2.6). **CERT/FULL không tính gap này.**
- Gap #91?→#92? = 6.838 s — **VẪN CHỈ LÀ SPAN** (đoạn B mù #55 mở,
  tối đa 2 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại đợt này — xem
  §2.6). **CERT/FULL không tính gap này.**
- **Dải cho #97? (T2-139, p10–p90 FULL72 neo tại #96? 13:53:41Z):
  [14:21:34Z, 16:19:19Z]** — thực tế 15:54:37Z **NẰM TRONG dải**.
  Chuỗi INSIDE theo dải cơ học kéo dài thành 4 lần liên tiếp (#94?,
  #95?, #96?, #97?).
- **Dải CHUẨN cho #98? theo quyết parent (f): [16:22:31Z,
  18:20:15Z] (FULL72, neo tại #97? 15:54:37Z)** — khớp đúng dải
  T6-140 tính độc lập; dải hiệu dụng sau probe #59: [17:40:41Z,
  18:20:15Z]. Biến thể FULL73 (phân phối sau khi chứng nhận gap
  mới): [16:22:37Z, 18:20:05Z] — chênh ≤10 s (xem F-140-T2-7).
  **Reboot #98? 17:52:56Z NẰM TRONG cả hai dải** (xem §6).

**Khung chết các boot (từ merged — xem §2.4):**
- **Khung chết #96? (ứng viên MERGED — T2 ĐỀ XUẤT làm chuẩn mới):
  (15:54:16Z, 15:54:37Z] (21 s)** — mốc muộn nhất là
  round139-t8/smoke/ram-139t8.log 15:54:16Z (log RAM của T8 trên
  boot cũ). Hẹp hơn khung T9 (15:54:02Z, 15:54:37Z] (35 s) — mốc
  cuối của T9 là sampler 15:54:02Z, KHÔNG phải mốc muộn nhất
  (merged có 15:54:16Z, muộn hơn 14 s) nên khung T9 chỉ còn là
  biên ngoài. Khung T8 (15:54:42Z, 15:55:24Z] là cách dựng khác
  (driver còn sống 15:54:42Z → boot mới thấy 15:55:24Z, quan sát
  trực tiếp, không neo btime) và mốc dưới của nó là nhân chứng
  nhảy (+5 s) — không giao với khung merged. **T2 đề xuất 21 s
  làm chuẩn mới; parent quyết khi đóng sổ** (quyết (c)). Caveat
  đồng hồ: khung 21 s là khung theo đồng hồ đọc; nhân chứng nhảy
  +5 s / +25 s cho thấy đồng hồ boot cũ chạy nhanh — khung thật
  theo giờ thực có thể rộng hơn 21 s (xem F-140-T2-6). Cùng caveat
  với khung #94? 8 s (T10-138 đã chấp nhận logic tương tự; parent
  đợt 139 §12.2(b) GIỮ chuẩn 8 s cho #94? với cùng caveat).
- **Khung chết #95?: (13:47:01Z, 13:53:41Z] (400 s) — GIỮ NGUYÊN**
  — mốc muộn nhất là T10-138 O8 logs + vite.lock.queue cooldown
  13:47:01Z; phạm vi thứ 5 có 0 mốc trong đuôi này nên khung đứng.
  T6-140 quét lại toàn hidden_files/ + docs/ trong cửa sổ
  (13:47:01Z, 13:53:41Z]: **3 file, tất cả cùng một sự kiện**
  (release T10-138, mtime 13:47:01.57–13:47:01.62Z) — không có bằng
  chứng mới. Mốc ~13:50Z của T1-139 (bản nháp aggregate đợt 138
  soạn ~13:50Z trên boot 914964c3) vẫn chỉ là mốc suy ra, không có
  file mtime cứng — T2 ghi nhận, không tự thu hẹp khung 400 s.
  Merged mù #59 không phủ cửa sổ này (mù #59 bắt đầu 14:44:16Z).
- **Khung chết #94?: (11:52:12Z, 11:52:20Z] (8 s) — CHUẨN PARENT
  VẪN ĐỨNG** (§12.2(b) đợt 139). Khung chết #93?: (09:35:47Z,
  09:36:01Z] (14 s) — CHUẨN PARENT VẪN ĐỨNG. Khung chết #92?:
  (08:05:05Z, 08:07:11Z] (126 s) — CHUẨN PARENT VẪN ĐỨNG. Khung
  chết #91?: (04:42:27Z, 05:29:18Z] (2.811 s) — CHUẨN PARENT VẪN
  ĐỨNG.

**Chuỗi gộp (định nghĩa duy nhất từ đợt 134):** reboot #96?→#97?
là **sự kiện thứ 21** (giữa lượt 139, theo T10-139; parent đã chấp
nhận §12.2(a) đợt 139); reboot #95?→#96? là sự kiện thứ 20 (đã
XÁC NHẬN nhờ merged mù #58 đóng, T2-139). **Số thứ tự #97? ĐÃ
XÁC NHẬN theo quy ước** (merged lần này + T6-140 chốt chuỗi tương
đối #57→#97?); chuỗi tương đối do T6-140 chốt, số tuyệt đối vẫn
tạm theo thông lệ; giá trị gap không phụ thuộc số thứ tự.

### 2.3 Hoạt động trong khoảng mù — ĐÓNG HOÀN TOÀN (merged 4 phạm vi)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **16 file** +
hidden_files **411 file**; **427 file, 411 mốc float phân biệt /
225 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3/T2-133 §2.3/
T2-134 §2.3/T2-135 §2.3/T2-136 §2.3/T2-137 §2.3/T2-138 §2.3/
T2-139 §2.3 — "mốc" là mtime float phân biệt, không phải giây tròn).
Ngoài hai cây: **80 file** (agents — exec-log/tool-output chiếm đa
số + repo-1-push paths; chi tiết xem blind59-outside.txt);
**/tmp: 676 file** trong mù #59 (xem blind59-tmp.txt + caveat §2.4
— cả 676 đều trong đoạn B).
Gộp cả 4 phạm vi: **288 mốc giây phân biệt**. Chia mù làm hai
đoạn bởi 1 reboot:

- **Đoạn A: 14:44:16Z → 15:54:37Z (1h10'21" = 4.221 s, boot #96?
  541524e2) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **222 mốc** (hai cây), lỗ lớn nhất hai cây **561 s**
    (15:29:55Z → 15:39:15Z); lỗ lớn thứ hai 258 s; lỗ lớn thứ ba
    248 s. Mốc đầu 14:44:16Z (head 0 s — chính probe #58); mốc
    cuối hai cây **15:54:16Z** (đuôi hai cây **21 s**).
    **26 session** chạm đoạn A; **9 session** chạm A-tail
    (15:35:30Z, 15:54:37Z].
  - **Merged 4 phạm vi: 154 mốc, lỗ lớn nhất 505 s**
    (15:29:55Z → 15:38:20Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 14:44:17Z (head 1 s), mốc cuối gộp **15:54:16Z**
    (đuôi 21 s — ram-139t8.log). Lỗ lớn thứ hai gộp **216 s**
    (15:14:09Z → 15:17:45Z) và lỗ lớn thứ ba **179 s**
    (15:02:46Z → 15:05:45Z) — **cả hai đều NHỎ HƠN NHIỀU so với
    sàn**.
    **Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): 2 file**
    trong đoạn A (memory bank reflections.md + world.md,
    14:52:24Z — xem §2.4).
  - Cửa sổ sàn [A-lo=15:03:23Z, A-hi=15:35:30Z] (rộng 1.927 s):
    **9 session bắc qua cắt A-lo; 5 session bắc qua cắt A-hi** —
    nhưng luật lỗ đã đủ để đóng (lỗ lớn nhất chỉ 505 s ≪ sàn
    1.147 s); **9 session chạm A-tail** — mốc merged trong A-tail
    dày đặc tới 15:54:16Z rồi yên 21 s tới reboot (T8 harness xong
    15:54:41Z theo đồng hồ cũ — xem §2.2).
  - Hoạt động trên 541524e2: các luồng đợt 139 làm việc tới
    ~15:54Z (T4 attempt3 lượt yên #16 ~15:24Z; T5/T6/T7/T8/T9
    làm việc tới 15:54Z; T9 sampler tới 15:54:02Z + mẫu cuối
    15:55:02Z theo đồng hồ cũ) — máy KHÔNG yên trong đoạn A.
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn (merged + hai cây
    đồng thuận).**
- **Đoạn B: 15:54:37Z → 17:40:41Z (1h46'04" = 6.364 s, boot #97?
  af558fb5) — ĐÓNG bằng đo uptime trực tiếp + luật lỗ:**
  - **`uptime -s` lúc 17:38:57Z = 15:54:37Z** chứng minh máy up
    liên tục từ #97? tới lúc đo; probe #59 17:40:41Z đọc boot_id
    af558fb5 tươi — cùng boot_id với boot bắt đầu 15:54:37Z;
    kiểm lại 17:40:41Z + 17:52:29Z cùng boot.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C, T2-132 §2.3 đoạn C, T2-133 §2.3 đoạn B,
    T2-134 §2.3 đoạn C, T2-135 §2.3 đoạn G, T2-136 §2.3 đoạn C
    mù #55, T2-137 §2.3 đoạn B mù #56, T2-138 §2.3 đoạn B mù #57,
    T2-139 §2.3 đoạn C mù #58.)
  - **189 mốc** (hai cây), lỗ lớn nhất **1.809 s** (16:02:05Z →
    16:32:13Z — khoảng yên sau khi T10-139 O8 xong tới khi T9
    đóng sampler vòng 2); mốc cuối **17:40:40Z** (đuôi hai cây
    **1 s**).
  - **Merged 4 phạm vi: 133 mốc, lỗ lớn nhất 1.722 s**
    (17:07:24Z → 17:36:06Z), floor=1 theo luật lỗ thuần túy —
    **nhưng uptime trực tiếp loại bỏ khả năng reboot ẩn trong
    lỗ** (máy up liên tục từ 15:54:37Z tới lúc đo 17:38:57Z;
    journal chỉ 1 boot). Mốc đầu gộp 15:54:40Z (head 3 s), mốc
    cuối gộp 17:40:40Z (đuôi 1 s).
  - Đoạn B dài hơn 2×sàn 2.294 s nên có cửa sổ sàn rộng
    [B-lo=16:13:44Z, B-hi=17:21:34Z]; 5 session bắc qua cắt B-lo,
    **0 session bắc qua cắt B-hi** — uptime là closer, luật lỗ chỉ
    là kiểm chứng thêm. Khoảng yên 17:07:24Z → 17:36:06Z là lúc
    máy thật sự không có tiến trình nào ghi đĩa (T10-139 đã đóng
    aggregate 17:06:36Z; đợt 140 mở 17:36:38Z; mốc đầu sau khoảng
    yên là /tmp jarvis-tool-output 17:36:06Z).
  - **Kết luận đoạn B: ĐÓNG.**

**Kết luận trung thực: khoảng mù #59 ĐÓNG HOÀN TOÀN.** Đoạn A đóng
(luật lỗ, tối đa 0 ẩn), đoạn B đóng (uptime). 1 reboot đã chốt
(#97? 15:54:37Z — chính xác từng giây trên đĩa, số đã xác nhận
theo quy ước + T6) + **tối đa 0 ẩn**. Chuỗi mù đóng hoàn toàn:
#50 đóng, #51 hở, #52 đóng, #53 hở, #54 đóng, #55 hở, #56 hở,
**#57 đóng, #58 đóng, #59 đóng** — mù đóng hoàn toàn thứ ba liên
tiếp, lần đầu tiên chuỗi 3 mù đóng liên tiếp.

Ngoài hai cây: **80 file** có mtime trong mù #59 (agents —
exec-log/tool-output chiếm đa số + repo-1-push paths;
chi tiết xem blind59-outside.txt); **/tmp: 676 file** trong mù #59
(xem blind59-tmp.txt + caveat §2.4 — cả 676 đều trong đoạn B).
Boot_id nhắc trong exec-log sinh/viết trong mù: 914964c3 1 file,
541524e2 6 file, af558fb5 3 file.

### 2.4 Gộp 4 phạm vi + 4 phát hiện mới (phương pháp nối tiếp T2-139 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind59-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 154 mốc, lỗ lớn nhất **505 s** (15:29:55Z →
  15:38:20Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**. Lỗ lớn thứ hai
  **216 s** (15:14:09Z → 15:17:45Z); lỗ lớn thứ ba **179 s**
  (15:02:46Z → 15:05:45Z) — cả hai cũng nhỏ hơn nhiều so với sàn.
- Đoạn B gộp: 133 mốc, lỗ lớn nhất **1.722 s** (17:07:24Z →
  17:36:06Z), floor=1 theo luật lỗ thuần túy — **nhưng uptime
  trực tiếp đóng đoạn B** (xem §2.3). Lỗ lớn thứ hai 1.113 s;
  lỗ lớn thứ ba 494 s.
- Tổng gộp 288 mốc giây. Không có file nào trong
  `~/workspace/goals` ngoài hidden_files có mtime trong mù (kiểm
  bằng find riêng — vùng duy nhất hai lần quét chính không phủ,
  đã kiểm bổ sung, 0 file).

**Phát hiện 1 — /tmp CÓ 676 file trong mù #59, TẤT CẢ trong đoạn
B (mới, nối tiếp phát hiện 1 của T2-139):** /tmp trên VM này là
tmpfs — reboot #97? (15:54:37Z) xóa mọi file /tmp viết trước đó.
Kiểm trực tiếp từ blind59-tmp.txt: **0 file có mtime < 15:54:37Z
(đoạn A), 676 file có mtime ≥ 15:54:37Z (đoạn B)**; file sớm nhất
16:42:29Z (T10-139 suite/O8), muộn nhất 17:39:52Z (t4-verify16.txt).
676 mốc giây /tmp của merged đều nằm trong đoạn B. **Verdict
không đổi:** đoạn A đóng không phụ thuộc /tmp (A đóng vì lỗ lớn
nhất chỉ 505 s trên cả 4 phạm vi, B đóng nhờ uptime). Ghi rõ để
luồng sau khỏi hiểu "676 file /tmp" là bằng chứng cho cả mù — chúng
chỉ phủ đoạn B. Trong A-tail: **0 file**; trong B-tail: **3 file**.

**Phát hiện 2 — Đoạn A có lỗ 505 s giữa hai lần ghi của T4/T8
(mới):** lỗ lớn nhất đoạn A (15:29:55Z → 15:38:20Z) là khoảng yên
trong lúc T4 chạy attempt3 lượt yên #16 (browser test chạy, ít ghi
đĩa) — không phải lỗ giữa hai lần poll. Lỗ lớn thứ hai/thứ ba
(216 s, 179 s) đều là khoảng giữa hai lần ghi liên tiếp của các
luồng đợt 139. Cả ba đều ≪ sàn 1.147 s (lỗ lớn nhất chỉ bằng 44%
sàn).

**Phát hiện 3 — Mốc cuối đoạn A 15:54:16Z hẹp khung chết #96?
xuống 21 s (mới):** round139-t8/smoke/ram-139t8.log 15:54:16Z là
log RAM của T8 trên boot #96? trước reboot. Mốc này muộn hơn mốc
sampler của T9 (15:54:02Z) 14 s — khung chết #96? thành
(15:54:16Z, 15:54:37Z] = 21 s theo nguồn của T2 (merged). T2 đề
xuất 21 s làm chuẩn mới; parent quyết khi đóng sổ (cùng mẫu khung
#94? 8 s vs 2 s và khung #93? 14 s vs 13 s). Caveat đồng hồ xem
F-140-T2-6.

**Phát hiện 4 — Phạm vi thứ 5 không lấp đuôi khung chết nào (mới,
kiểm theo bài học F-136-T2-8):** quét ~/memory + ~/dreams +
~/side-chats cho cả mù #59: 4 file (2 file 14:52:24Z — memory bank
reflections.md + world.md, đoạn A; 2 file 17:04:07Z + 17:09:37Z —
daily log 18/11 + 19/11, đoạn B). **0 mốc trong (15:54:16Z,
15:54:37Z]** (đuôi khung chết #96?) và **0 mốc trong (15:54:02Z,
15:54:37Z]** (đuôi khung T9 35 s) — verdict khung không đổi.

### 2.5 Phân phối gap — CERT n=57 → n=58 / FULL n=72 → n=73 (MỘT gap mới chứng nhận)

**Gap mới (xem blind59-gaps.py + blind59-gaps.txt):**
- **Gap #96?→#97? = [7.246 s, 7.266 s] (2h00'56" ±10 s) CHỨNG
  NHẬN DẠNG KHOẢNG** — đoạn A mù #59 đóng (merged, tối đa 0 ẩn)
  + đoạn B đóng bằng uptime trong logic gộp (xem §2.3).
  **CERT/FULL tính gap này (mid 7.256 s).** Caveat: F97? ≈ −1 s
  tới −2 s (đo trực tiếp lượt này, 3 server không đồng nhất lần
  đầu — xem F-140-T2-5); F96? ≈ −1 s đo trực tiếp đợt 139 —
  btime gaps là RTC nên không bị ảnh hưởng bởi drift đồng hồ guest.
- **Gap #95?→#96? = [7.271 s, 7.291 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 139. Không đổi lượt này.
- **Gap #94?→#95? = [8.169 s, 8.189 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 139. Không đổi lượt này.
- **Gap #93?→#94? = [5.320 s, 5.340 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 138. Không đổi lượt này.
- **Gap #92?→#93? = 9.473 s (2h37'53") VẪN CHỈ LÀ SPAN** — đoạn A
  mù #56 mở (tối đa 1 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại
  đợt này — xem §2.6). **CERT/FULL không tính gap này.**
- **Gap #91?→#92? = 6.838 s (1h53'58") VẪN CHỈ LÀ SPAN** — đoạn B
  mù #55 mở (tối đa 2 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại
  đợt này — xem §2.6). **CERT/FULL không tính gap này.**
- **Gap #90?→#91? = [4.063 s, 4.083 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 136 (đoạn A mù #55 đóng). Không đổi lượt này.
- **Gap #81?→#82? = [7.797 s, 7.817 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 133 (đoạn A mù #52 đóng). Không đổi lượt này.
- **Gap #80?→#81? = 8.558 s (2h22'38") VẪN CHỈ LÀ SPAN** — đoạn B
  mù #51 mở (tối đa 3 ẩn; KHÔNG kiểm lại đợt này — xem §2.6).
  **CERT/FULL không tính gap này.**
- **Gap #79?→#80? = [2.079 s, 2.099 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 132 (đoạn A mù #51 đóng). Không đổi lượt này.
- **Gap #78?→#79? = [5.030 s, 5.050 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 131 (đoạn B mù #50 đóng). Không đổi lượt này.
- **Gap #77→#78? = [7.560 s, 7.580 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 131 (đoạn A mù #50 đóng). Không đổi lượt này.
- **Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
  #49 mở (T2-131 §2.3; KHÔNG kiểm lại lượt này theo quyết parent
  đợt 132 §12.3(d) — xem §2.6). **CERT/FULL không tính gap này.**
- **Gap #75→#76 = [6.511 s, 6.531 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 130 (đoạn A mù #49 đóng). Không đổi lượt này.
- **Gap #74→#75 = 8.307 s (2h18'27") VẪN CHỈ LÀ SPAN** — đoạn A mù
  #48 mở (T2-129 §2.3). Không đưa vào FULL/CERT.
- **Gap #73→#74 = 6.639 s (1h50'39") VẪN LÀ KHOẢNG [6.629 s,
  6.649 s]** — đã chứng nhận đợt 128 (đoạn B mù #47 đóng). Không
  đổi lượt này.
- **Gap #72→#73 = 3.248 s (54'08") VẪN LÀ KHOẢNG [3.238 s,
  3.258 s]** — đã chứng nhận đợt 128 (đoạn A mù #47 đóng). Không
  đổi lượt này.
- **Gap #71→#72 = 9.876 s (2h44'36") VẪN CHỈ LÀ SPAN** — đoạn A mù
  #46 mở (T4-127 §2.3). Không đưa vào FULL/CERT.
- **Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN** — đoạn G1 mù
  #45 mở (T7-126 §2.3). Không đưa vào FULL/CERT.
- **Gap #68→#69 = 10.880 s (3h01'20") VẪN CHỈ LÀ SPAN** — đoạn D mù
  #44 mở (T7-126 §2.4). Không đưa vào FULL/CERT.

**Cross-check tái hiện T2(139) 100%:** chạy
blind59-gaps.py verbatim cho lại đúng CERT n=57 / FULL n=72 của
T2 đợt 139 (xem blind59-gaps.txt: CERT57 mean 1h34'00" median
1h48'41" p10 0h27'12" p90 2h18'07" sd 0h45'42" min 0h00'55" max
3h14'08"; FULL72 mean 1h40'46" median 1h49'58" p10 0h27'54" p90
2h25'38" sd 0h56'26" min 0h00'55" max 5h43'18"; in 90–150' = 36,
<60' = 17, >180' = 6, >240' = 2 — khớp T2-139 §2.5 từng số, và
chuỗi exec lồng nhau tái hiện cả CERT55/FULL70 của T2-138).
Gap mới vào nên CERT 57→58 / FULL 72→73.

- **CERT n=58 (mới):** mean 1h34'28" median 1h48'59" p10
  0h27'21" p90 2h17'40" sd 0h45'27" min 0h00'55" max 3h14'08".
- **FULL n=73 (mới):** mean 1h41'03" median 1h50'39" p10
  0h28'01" p90 2h25'29" sd 0h56'05" min 0h00'55" max 5h43'18";
  in 90–150' = 37, <60' = 17, >180' = 6, >240' = 2.
- Độ nhạy LO/HI (gap mới ở cận dưới/trên của khoảng):
  CERT58-LO sd 0h45'26" vs CERT58-HI sd 0h45'27" (dịch 1 s —
  nhỏ, ghi rõ); FULL73-LO = FULL73-HI ở p10/p90 (mean dịch 0 s
  ở độ chính xác hiển thị).
- **Dải chứng nhận [0h00'55", 3h14'08"] — không đổi** (gap mới
  7.256 s nằm trong dải).
- **Dải CHUẨN cho #98? (FULL72, quyết (f)): [16:22:31Z,
  18:20:15Z]** — từ btime #97? 15:54:37Z; dải hiệu dụng sau probe
  #59: [17:40:41Z, 18:20:15Z]. Biến thể FULL73: [16:22:37Z,
  18:20:05Z] (chênh ≤10 s — xem F-140-T2-7). **Reboot #98?
  17:52:56Z NẰM TRONG cả hai dải** (xem §6).
- **Dải cho #97? — VERDICT: INSIDE.** Dải T2-139 (FULL72, neo
  tại #96? 13:53:41Z) [14:21:34Z, 16:19:19Z]: thực tế 15:54:37Z
  **NẰM TRONG dải**. Chuỗi INSIDE theo dải cơ học kéo dài thành
  4 lần liên tiếp (#94?, #95?, #96?, #97?).
- **Tốc độ reboot (đồng hồ ghi nhận):** 97 / 187,61 h = **1 reboot
  mỗi 116,0 phút** (từ #1 2026-11-10T20:18:10Z tới #97?
  2026-11-18T15:54:37Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 101 / 187,61 h = **1 mỗi 111,5 phút**; +3 nữa
  (mù #53 đoạn B tối đa 3) → 104 / 187,61 h = **1 mỗi 108,2
  phút**; +2 nữa (mù #55 đoạn B tối đa 2, quy ước) → 106 /
  187,61 h = **1 mỗi 106,2 phút**; +1 nữa (mù #56 đoạn A tối đa 1,
  quy ước) → 107 / 187,61 h = **1 mỗi 105,2 phút**; **+0 nữa
  (mù #57 ĐÓNG, tối đa 0) → 107 / 187,61 h = 1 mỗi 105,2 phút**;
  **+0 nữa (mù #58 ĐÓNG, tối đa 0) → 107 / 187,61 h = 1 mỗi
  105,2 phút**; **+0 nữa (mù #59 ĐÓNG, tối đa 0) → 107 / 187,61 h
  = 1 mỗi 105,2 phút** (đọc cộng dồn: mù #55 đoạn B tối đa 3 →
  108 / 187,61 h = **1 mỗi 104,2 phút**; mù #56 đoạn A tối đa 3 →
  109 / 187,61 h = **1 mỗi 103,3 phút**). Chưa tính ẩn danh nghĩa
  tối đa của mù #35 (+24), mù #37 (+29), mù #38 đoạn G (+6), mù
  #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43 đoạn B (+3), mù #44
  đoạn D (+5), mù #45 đoạn G1 (+4), mù #46 đoạn A (+4), mù #48
  đoạn A (+2), mù #49 đoạn B (+1), mù #51 đoạn B (+3).
  Mù #50: **+0** (đóng hoàn toàn). Mù #52: **+0** (đóng hoàn
  toàn). Mù #53: **+3** (đoạn B mở — recheck đợt 137 xác nhận).
  Mù #54: **+0** (đóng hoàn toàn). Mù #55: **+2 (quy ước) / +3
  (cộng dồn)**. Mù #56: **+1 (quy ước) / +3 (cộng dồn)**.
  Mù #57: **+0 (đóng hoàn toàn)**. Mù #58: **+0 (đóng hoàn
  toàn)**. **Mù #59: +0 (đóng hoàn toàn) — mới.**

### 2.6 Mù #56 A + mù #55 B + mù #53 B + mù #51 B + mù #49 B: KHÔNG kiểm lại đợt này

- **Mù #56 A: KHÔNG kiểm lại đợt này.** Đã recheck đợt 138 (0 mốc
  mới trong lỗ, 9 hit đều là file biên phải đã biết); hồ sơ đã ổn
  định; brief đợt 140 không giao recheck; T2 đợt này không thấy
  bằng chứng mới nào về mù #56 A. Gap #92?→#93? = 9.473 s GIỮ
  SPAN.
- **Mù #55 B: KHÔNG kiểm lại đợt này.** Đã recheck đợt 138 (0 mốc
  mới); hồ sơ đã ổn định; brief đợt 140 không giao recheck; T2 đợt
  này không thấy bằng chứng mới nào về mù #55 B. Gap #91?→#92? =
  6.838 s GIỮ SPAN.
- **Mù #53 B: KHÔNG kiểm lại đợt này.** Đã recheck đợt 137 (0 mốc
  giây mới, 1 hit float là file biên đã biết); hồ sơ đã ổn định.
  T2 đợt này không thấy bằng chứng mới nào về mù #53 B. Gap
  #83?→#84? = 6.318 s giữ SPAN.
- **Mù #51 B: KHÔNG kiểm lại đợt này.** Đã kiểm lại 3 lần (đợt
  131, 132, 133) với cùng verdict (lỗ lớn nhất 4.393 s, tối đa
  3 ẩn); hồ sơ đã ổn định. T2 đợt này không thấy bằng chứng mới
  nào về mù #51 B. Gap #80?→#81? = 8.558 s giữ SPAN. (Tiền lệ:
  không giao luồng sau kiểm lại B mù #51 — quyết đợt 126 §12(h)
  + quyết đợt 130 §12.3(e).)
- **Mù #49 B: KHÔNG kiểm lại đợt này.** Quyết parent đợt 132
  §12.3(d) đã phê duyệt bỏ mục kiểm lại thường lệ khỏi brief T2;
  chỉ kiểm lại khi có bằng chứng mới cụ thể. T2 đợt này không thấy
  bằng chứng mới nào về mù #49 B. Gap #76→#77 = 6.859 s giữ SPAN.
  Ghi rõ đã bỏ mục này theo quyết parent.

### 2.7 Quét writeFileSync lần thứ 46 — chênh 0 (lần thứ 46 liên tiếp) — ĐỐI CHIẾU BẰNG SỐ TỔNG KẾT

- Chạy script `scan-wfs.sh` (bản T2 trong round140-t2, đã đổi OUT
  sang round140-t2) **17:50:03Z → 17:50:33Z 18/11 (30 s, có
  SCAN-END)**. **Scan chạy trên boot #97?** — kết quả vẫn hợp lệ
  vì scan chỉ đếm code hiện tại trên đĩa, không phụ thuộc boot hay
  giờ mù.
- NEWSTD: **935 dòng / 261 file** (phạm vi 3.164 file); R7b đối
  chiếu: **960 dòng / 278 file** (phạm vi 12.557 file); copies:
  **25 dòng / 17 file** — y hệt lần 43, 44 và 45 về copies. Đối
  chiếu chéo: 935+25=960=R7b, **chênh 0**.
- **Đối chiếu bằng SỐ TỔNG KẾT (quyết parent đợt 138 §12.3(h)):**
  file thô scan #43 đã mất (F-138-T5-1 — T5 ghi đè 7 file thô #43
  trước khi phát hiện; chấp nhận mất, không khôi phục được). Số
  tổng kết #43 còn nguyên trong LIMITS T2-137 §2.7 (**907 dòng /
  253 file**, R7b **932/270**, copies **25/17** — T2 đã đọc lại trực
  tiếp từ file LIMITS đợt này), số #44 trong LIMITS T2-138 §2.7
  (**915/256**, R7b **940/273**, copies **25/17** — file thô #44
  còn nguyên trong round138-t2, T2 đối chiếu chéo được) và số #45
  trong LIMITS T2-139 §2.7 (**926/259**, R7b **951/276**, copies
  **25/17** — file thô #45 còn nguyên trong round139-t2, T2 đối
  chiếu chéo được). Chuỗi: #43 907/253 → #44 915/256 (+8/+3) →
  #45 926/259 (+11/+3) → **#46 935/261 (+9/+2)**.
- **+9 dòng / +2 file so với lần 45** (926/259 → 935/261), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + diff
  từng dòng — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND139_T2_EPERM_LIMITS.md | +7 (0 → 7) | sau scan #45 | Tài liệu T2 đợt 139 (nhắc `writeFileSync` 7 lần); viết SAU scan lần 45 (17:50:03Z? — scan #45 chạy 14:57:34Z; T2-139 LIMITS viết xong ~15:06Z) nên lần này mới vào |
  | docs/PHASE9_ROUND139_LIMITS.md | +1 (0 → 1) | sau scan #45 | LIMITS gộp đợt 139 (nhắc `writeFileSync` 1 lần); viết SAU scan lần 45 nên lần này mới vào |
  | docs/PHASE9_ROUND139_T5_INFRA_LIMITS.md | +1 (2 → 3) | sau scan #45 | LIMITS T5 đợt 139, viết thêm 1 mention `writeFileSync` sau khi T2-139 quét (scan #45 chạy 14:57:34Z; T5 xong ~15:2xZ) |
  7+1+1 = 9 dòng. ✓ (Phạm vi: 3.164 = 3.155 + 9 net (**9 file
  mới, 0 file mất**: kiểm bằng diff danh sách file — 9 file mới
  gồm 6 LIMITS đợt 139 (T2/T4/T7/T8/T9 + gộp) + 3 LIMITS đợt 140
  đã viết trước scan (T1/T6/T9); trong 9 file mới có 2 file mang
  hit (+2 file) là T2-139 + gộp 139; 7 file còn lại không mang hit.
  Copies y hệt lần 45 (diff 0 dòng).)
- **Kết luận: 46 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #59. Verdict
  "chênh 0 lần 46" đứng trên đối chiếu bằng số tổng kết (#43) +
  file thô (#44, #45, #46) + hai lần quét độc lập #45 (T2 vs T5 khớp
  sau khi giải thích delta +2/+1) — xem aggregate đợt 138 §10.1(f).

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 2 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md, không tính dist): vẫn đúng 2 helper đã biết — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 12:13:59Z không đổi;
    dist nằm ngoài phạm vi quét WFS nên không làm lệch số đếm.
- Lưu ý phương pháp: pattern phải là `\.writeFile\(` (có dấu chấm).
  Pattern không dấu chấm còn bắt thêm các mock `async writeFile(`
  trong file test `apps/web/scripts/test_round83_k8_eperm_retry.mjs`
  (định nghĩa fake fs, mtime 10/11, không phải đường ghi thật) —
  không tính vào 2 helper; T7-126 §2.8 cũng dùng pattern có dấu
  chấm nên số 2 là nhất quán giữa các lượt.
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #59.

## 3. RAM trong mù #59 — max 2.607,4 MiB (42,44% guard, KHÔNG vượt), birefnet KHÔNG chạy bởi T2

- **5 mẫu MemAvailable trực tiếp của lượt (đoạn B + lúc đóng trên #97?):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 17:38:57Z | **913.408 kB** (892 MB) | Lúc mở phiên (boot #97?, đoạn B) — dưới gate A 1.024 MB, balloon vẫn kẹt/phồng lại sau xả đợt 139 |
  | 17:39:47Z | **855.900 kB** (836 MB) | Trong lúc đo F97? (boot #97?, đoạn B) — đang siết |
  | 17:40:41Z | **975.456 kB** (953 MB) | Sau probe #59 (boot #97?, đoạn B) |
  | 17:40:41Z+ | **1.029.456 kB** (1.005 MB) | Xác minh boot lại sau probe (boot #97?, đoạn B) — vừa chạm gate A |
  | 17:52:29Z | **693.556 kB** (677 MB) | Lúc đóng phiên T2 (boot #97?, đoạn B) — NGOÀI mù #59 (mù đóng 17:40:41Z); balloon phồng lại, RAM về dưới gate A |
- **Max RAM biết được TRONG mù #59: 2.669.952 kB ≈ 2.607,4 MiB
  (T9-139, 15:13:59Z, đoạn A, Balloon 4.280.860 kB) — 42,44% guard
  6.144 MiB, THIẾU 3.621.504 kB (~3.536,6 MiB), KHÔNG VƯỢT.** Nguồn:
  T9-139 LIMITS §3 (đo trực tiếp theo MemAvailable; sampler 109 mẫu
  hai vòng: vòng 1 14:41:57–15:55:02Z boot cũ, vòng 2 15:57:11–
  16:32:13Z boot mới). Đỉnh này là **thấp nhất từ đợt 135** (đợt
  138: 99,07%; đợt 137: vượt guard; đợt 136: 98,99%) — đợt hồi RAM
  giữa lượt không ổn định theo đợt (đỉnh các đợt 133→139: 512 MB,
  2.438 MB, 1.734 MB, 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB).
- **Corroboration độc lập từ T4-139 + T5-139 (đếm bằng code — xem
  ram-max.txt):** ram-max59.py bắt 453 mẫu; đoạn A max theo
  ram-max: **2.106 MB** (T4 attempt2 start, 15:01:56Z); T4 poll #7
  2.081 MB (14:47:07Z); T4 poll #8 2.049 MB (14:47:53Z). Đoạn B
  **không có mẫu nào theo ram-max** — xem F-140-T2-2 (script mù
  với format log sampler của T9). Đoạn B max theo T9-139 LIMITS
  §3: **1.565.676 kB = 1.529,0 MiB (vòng 2, 16:00:11Z, 24,9%
  guard)**. Hai sampler độc lập (T9/T4) đều đỉnh trong cùng cửa
  sổ ~14:47–15:13Z và **không sampler nào quan sát được ≥
  6.144 MiB** — quyết "thử ngay khi quan sát được" đã được trực
  đúng (T9 ở lại muộn, sampler chạy tới 16:32:13Z), cửa sổ chỉ
  không mở.
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Cửa sổ vượt guard KHÔNG XUẤT HIỆN trong mù #59 (đỉnh cao nhất
  42,44% < 100%) và T2 KHÔNG thử (không thuộc brief T2; việc thử
  thuộc T9-140 theo quyết parent đợt 139 §12.2(e): "GIỮ NGUYÊN quy
  trình + guard 6.144 MiB"). u2net là fallback chính thức.
  **Lưu ý cho T9-140:** sau reboot #98? (17:52:56Z) MemAvailable
  vọt lên **1.714.084 kB** (17:54:18Z) rồi 1.600.968 kB (17:54:41Z)
  — trên gate A 1.024 MB nhưng vẫn chỉ ~26% guard; nếu một lượt
  sau quan sát được ≥ 6.144 MiB thì đủ điều kiện thử birefnet theo
  quyết §12.2(e); lượt này T2 chưa thử.
- Caveat phương pháp (F-140-T2-2): ram-max59.py chỉ bắt được mẫu
  cao nhất 2.106 MB — mẫu cao hơn của T9 (2.669.952 kB) không vào
  danh sách vì dòng log sampler của T9 mang số trần không đơn vị
  (`2026-11-18T15:13:59Z 2669952 2607.4 ...` — không có `MB`/`kB`
  trên dòng, regex nào của script cũng trượt); đoạn B "không có
  mẫu" cũng vì cùng lý do (log vòng 2 cùng format). T2 tìm ra bằng
  cách đối chiếu LIMITS của T9. **ram-max là cận dưới, không phải
  max tuyệt đối** — luôn đối chiếu LIMITS sibling trước khi chốt
  max RAM.

## 4. Ghi chú phương pháp + kiểm prereg

1. **Prereg đợt này KHÔNG có dự báo sai lớn — các dự báo chính đều
   đúng, 1 điểm tốt hơn dự báo:** probe #59 ok=2 fail=0 + log +3
   (đúng); đoạn A "CHƯA BIẾT" (thực tế ĐÓNG — tốt hơn dự báo dè
   dặt, lỗ lớn nhất chỉ 505 s); đoạn B đóng bằng uptime (đúng);
   khung chết #96? kỳ vọng mốc cuối ≈ 15:54:02Z (thực tế 15:54:16Z
   — hẹp hơn 14 s nữa, khung 21 s thay vì 35 s); gap chứng nhận
   [7.246, 7.266] s (đúng); EPERM 0 sóng thật + WFS chênh 0 (đúng);
   dpkg 1.545/221/462 (đúng); RAM max 42,44% guard (đúng).
   Lệch nhỏ: WFS +9 dòng (prereg đoán ~+10/+3 — lệch +1 dòng / +1
   file do T4-139 LIMITS mang 0 mention, xem F-140-T2-4); dải
   chuẩn #98? prereg [16:22:31Z, 18:20:15Z] (FULL72) — script cho
   thêm biến thể FULL73 [16:22:37Z, 18:20:05Z] (xem F-140-T2-7).
2. **F-140-T2-1 — prereg dải #97? cận dưới 14:21:35Z, script cho
   14:21:34Z (mới, đính chính làm tròn):** prereg cộng p10 hiển thị
   0h27'54" (= 1.674 s) vào btime #96? được 14:21:35Z; p10 nội suy
   chính xác của FULL72 là 1.673,x s nên cận dưới thật là 14:21:34Z
   (khớp đúng số T2-139 đã công bố). Verdict INSIDE không đổi
   (15:54:37Z nằm sâu trong dải cả hai cách tính). Cùng lớp
   F-139-T2-4.
3. **F-140-T2-2 — ram-max59.py mù với toàn bộ mẫu sampler của T9
   (mới, cùng lớp F-139-T2-5 — nặng hơn):** mẫu cao nhất
   2.669.952 kB (15:13:59Z) không vào danh sách vì dòng log sampler
   của T9 mang số trần không đơn vị (không có `MB`/`kB` trên dòng);
   đoạn B "không có mẫu" cũng vì cùng lý do (log vòng 2 cùng
   format). T2 tìm ra max thật bằng cách đối chiếu LIMITS T9-139
   §3 (đoạn A 2.669.952 kB; đoạn B 1.565.676 kB). Bài học: ram-max
   chỉ là cận dưới; luôn đối chiếu LIMITS sibling trước khi chốt
   max RAM. (Đợt 139 ram-max chỉ bỏ sót 1 mẫu cao nhất; đợt này
   bỏ sót toàn bộ mẫu T9 — format log T9 đổi sang số trần.)
4. **F-140-T2-3 — file observer T10-139 sha256 không tồn tại (mới,
   cùng lớp F-139-T2-7):** `round139-t10/t10-closing-sha256.txt`
   UNREADABLE — tên file trong script investigate kế thừa từ đợt
   trước không khớp tên thật của T10-139 (T10-139 không tạo file
   này). Không ảnh hưởng verdict (chỉ là kiểm observer phụ; các
   observer khác đọc được: LIMITS gộp 139 17:06:36Z, T2-139
   LIMITS 15:06:08Z, cờ t10.done 17:01:05Z, GAP_ANALYSIS 17:02:04Z,
   build-loop-log 17:06:51Z).
5. **F-140-T2-4 — prereg WFS đoán +10/+3, thực tế +9/+2 (mới,
   đính chính dự báo):** prereg đếm 9 file LIMITS mới (6 đợt 139 +
   3 đợt 140) và đoán ~+10 dòng / +3 file mang hit; thực tế chỉ
   T2-139 (+7) + gộp 139 (+1) mang hit mới và T5-139 (+1, file cũ)
   — T4/T7/T8/T9-139 + T1/T6/T9-140 mang 0 mention `writeFileSync`.
   Chênh 0 không đổi; chỉ là dự báo delta lệch 1 dòng / 1 file.
6. **F-140-T2-5 — F97? 3 server không đồng nhất lần đầu (mới):
   example +1 s, google +2 s, cloudflare +2 s** (các đợt trước
   đều +1 s cả 3 server: F94? 0s/+1s/+1s đợt 138, F96? +1/+1/+1
   đợt 139). F97? ≈ **−1 s tới −2 s (±~1 s)** — T2 ghi khoảng thay
   vì một số. Không đổi verdict gap nào (btime gaps là RTC, không
   phụ thuộc drift guest). F98? đo sau reboot (xem §6) lại đồng
   nhất +1 s cả 3 server — F97? có thể là nhiễu đo một lần (fetch
   google/cloudflare chạm biên giây).
7. **F-140-T2-6 — khung chết #96? 21 s là khung theo đồng hồ đọc
   (mới, §2.2):** 2 nhân chứng nhảy (sampler +25 s, driver T8 +5 s)
   cho thấy đồng hồ boot cũ chạy nhanh — mốc 15:54:16Z là mốc đọc
   theo đồng hồ đó nên khung thật theo giờ thực có thể rộng hơn
   21 s. Cùng caveat với khung #94? 8 s (T10-138 đã chấp nhận logic
   tương tự; parent đợt 139 §12.2(b) GIỮ chuẩn 8 s cho #94? với
   cùng caveat — và bác ứng viên 2 s vì "độ chính xác 2 s vượt độ
   tin cậy đồng hồ"). **T2 đề xuất 21 s làm chuẩn mới** (hẹp hơn
   khung T9 35 s, cùng quy ước đồng hồ đọc như chuẩn #94?/#93?);
   parent quyết khi đóng sổ theo quyết (c). Nếu parent thấy 21 s
   vẫn vượt độ tin cậy đồng hồ (dị thường tới +25 s), khung T9
   35 s là biên ngoài sẵn có.
8. **F-140-T2-7 — dải #98? có hai bản: FULL72 (chuẩn) vs FULL73
   (biến thể) (mới):** quyết parent (f) gọi tên FULL72; T6-140
   tính độc lập dải FULL72 **[16:22:31Z, 18:20:15Z]** — khớp đúng
   prereg T2-140 §2. T2 tính thêm biến thể FULL73 (phân phối sau
   khi chứng nhận gap #96?→#97?) **[16:22:37Z, 18:20:05Z]** — chênh
   ≤10 s. **Chuẩn là dải FULL72** (quyết text + T6 đồng thuận);
   biến thể FULL73 chỉ ghi kèm. Cả hai dải đều chứa reboot #98?
   17:52:56Z (xem §6) nên verdict INSIDE không phụ thuộc bản nào.
9. **F-140-T2-8 — reboot #98? 17:52:56Z trong lúc T2 viết LIMITS
   (mới, xem §6):** reboot xảy ra SAU lần kiểm cuối của T2 trên
   #97? (17:52:29Z), TRƯỚC lần kiểm sau đó (17:54:18Z). Mù #59 đã
   đóng 17:40:41Z nên không verdict nào đổi; câu "không reboot
   giữa phiên" trong LIMITS này chỉ đúng tới 17:52:29Z (ghi rõ
   ranh giới thay vì viết tuyệt đối — bài học F-138-T2-8). Mù #60
   MỚI MỞ từ probe #59; gap danh nghĩa #97?→#98? = 7.099 s CHƯA
   chứng nhận (việc của T2-141).
10. **F-140-T2-9 — /tmp 676 file TẤT CẢ trong đoạn B (mới, §2.4):**
    tmpfs bị reboot #97? xóa sạch nên 0 file /tmp có mtime trong
    đoạn A; 676 file đều từ 16:42:29Z trở đi (T10-139 suite/O8 +
    đợt 140 mở). Số 676 KHÔNG phải bằng chứng cho đoạn A — đoạn A
    đóng nhờ lỗ merged 505 s, đoạn B đóng nhờ uptime. (Nối tiếp
    phát hiện 1 của T2-139: mù #58 chỉ có 3 file /tmp, tất cả đoạn C.)
11. **Docstring các script blind59 đã kiểm cửa sổ (mới):**
    investigate/sessions/merged/gaps/fifthscope/sweep/ram-max đều
    ghi đúng cửa sổ (14:44:16Z → 17:40:41Z 18/11) + SEGS 2 đoạn
    viết mới — đã kiểm bằng grep trước khi chạy (bài học T2-133 §4
    mục 6: kiểm SEGS sau khi adapt; F-139-T2-2/3 là hai lỗi adapt
    đã bắt bằng chính bước kiểm này). Lần này adapt59.py gặp thêm
    2 lỗi suýt mắc (ghi trong §4 mục 12).
12. **T6-140 công bố TRƯỚC khi T2 đóng (mới, khác đợt 139):**
    T6-140 LIMITS + cờ `.done` đã có lúc T2 kiểm (17:4xZ) — chuỗi
    tương đối #57→#97? đã chốt độc lập, dải FULL72 khớp đúng prereg
    T2. Số #97? vững hơn mọi lần trước (merged + T6 đồng thuận).
    T1-140 cũng đã xong (cờ 17:40:10Z).
13. **preview.tsx 530e10a7 GIỮ VĨNH VIỄN — theo quyết parent, không
    phải sai số (nhắc lại, §0):** md5 530e10a7 — fix instrumentation
    của T3-134 theo quyết parent đợt 137 §12.3(a) (GIỮ VĨNH VIỄN,
    từ đợt 138 chỉ giám sát thụ động điều tra (c2)). media.ts
    KHÔNG ĐỔI 2c384ed1; vite.config.ts (apps/web/) KHÔNG ĐỔI
    ee80d093. T2 không sửa production file nào.
14. **R9 (a): SỐ ĐẾM VẪN LÀ 16 — KHÔNG tăng (nhắc lại, §0):**
    quyết parent đợt 139 §12.2(l) đã đính chính: để yên, không nhắc
    lại. File LIMITS này KHÔNG viết số 17 ở bất cứ đâu cho R9 (a).

## 5. Hồ sơ + stage

- **LIMITS này:** `docs/PHASE9_ROUND140_T2_EPERM_LIMITS.md`
  (oversize >37.768 B — chỉ stage paths, không push, như các
  LIMITS oversize đợt 134–139).
- **Thư mục làm việc:** `hidden_files/round140-t2/` — prereg-t2.md,
  boot-verify.txt, f97.txt (đo F97? — xem §1), dpkg97.txt, status1/
  once/status2 + .exit, adapt59.py, blind59-investigate.py + .log,
  blind59-sessions.py + .log, blind59-merged.py + .log,
  blind59-gaps.py + .txt, blind59-fifthscope.py + .log,
  blind59-repo-1.txt, blind59-hidden_files.txt, blind59-outside.txt,
  blind59-tmp.txt, sessions-all.txt, eperm-sweep59.py +
  eperm-sweep-run.log, ram-max59.py + ram-max.txt, scan-wfs.sh +
  scan-meta.txt + files-*.bin + wfs-*.txt, boot98-verify.txt (reboot
  #98? sau khi đo xong — xem §6).
- **Stage (KHÔNG push):** `phase9-round140-t2-eperm.txt`
  (NUL-delimited, 1 entry: LIMITS này; verify read-back trước khi
  đóng cờ).
- **Cờ:** `hidden_files/round140-t2.done`.
- **Mù #60 MỚI MỞ** từ probe #59 (17:40:41Z 18/11) — việc của T2
  đợt 141. Reboot #98? (17:52:56Z) đã nằm trong mù #60 (735 s sau
  probe #59). Dải chuẩn cho #99?: chờ FULL73 + gap #97?→#98?
  chứng nhận ở đợt 141 (dải cơ học tạm từ #98?: [18:20:57Z,
  20:18:25Z] theo p10–p90 FULL73 — chỉ để tham khảo, T2-141 tính
  lại sau khi chứng nhận).

## 6. Hậu kỳ — REBOOT #98? SAU KHI ĐO XONG (ghi thêm lúc viết LIMITS)

> Ghi thêm khi phát hiện reboot mới trong lúc viết LIMITS (17:54:18Z).
> Mọi số liệu trong §0–§5 đều đo trên boot #97? (af558fb5) TRƯỚC
> reboot này; không có số liệu nào phải đo lại. Mù #59 đã đóng
> 17:40:41Z nên reboot không đổi verdict nào.

- **Boot mới 90392aa5-f13b-4048-9c57-e4defc8e74d9, btime 17:52:56Z
  (epoch 1795024376)** — xác minh độc lập bằng 4 nguồn:
  /proc/stat btime 1795024376, `uptime -s` 2026-11-18 17:52:56,
  `who -b` Nov 18 17:53, journal first entry 17:53:12Z (btime
  +16 s — đúng mẫu 16 s). Reboot xảy ra giữa lần kiểm cuối của T2
  trên #97? (17:52:29Z) và lần kiểm sau đó (17:54:18Z).
- **F98? ≈ −1 s (±~1 s)** — đo trực tiếp 17:54:41–17:54:44Z:
  example +1 s, google +1 s, cloudflare +1 s (cả 3 đồng nhất —
  khác F97? +1/+2/+2, xem F-140-T2-5).
- **#98? NẰM TRONG dải chuẩn:** btime 17:52:56Z trong [16:22:31Z,
  18:20:15Z] (FULL72, quyết (f)) VÀ trong [16:22:37Z, 18:20:05Z]
  (biến thể FULL73) VÀ trong dải hiệu dụng sau probe #59
  [17:40:41Z, 18:20:15Z]. **INSIDE cả hai bản dải.**
- **Gap danh nghĩa #97?→#98? = 7.099 s (1h58'19")** — trong dải
  chứng nhận [0h00'55", 3h14'08"]. **CHƯA chứng nhận** (cần merged
  mù #60 — việc của T2-141).
- **dpkg.log boot #98?: replay MỚI BẮT ĐẦU** (lúc kiểm 17:54:41Z
  chỉ có 2 dòng: startup packages configure 17:53:47Z/17:53:48Z
  = boot +51 s/+52 s). Bracket chính thức thuộc về T5-140.
- **MemAvailable sau reboot: 1.714.084 kB (17:54:18Z) → 1.600.968
  kB (17:54:41Z)** — trên gate A 1.024 MB (lần đầu trên boot
  #98?), vẫn chỉ ~26% guard 6.144 MiB. Balloon reset theo reboot.
- **Tác động tới đợt 140:** reboot xảy ra lúc các luồng T4/T5/T7/
  T8/T9/T10 đang chạy (T1 + T6 đã xong). Có thể đã giết tiến
  trình đang chạy của các luồng đó (cùng mẫu reboot giữa lượt
  15:54:37Z giết lệnh kiểm sau-chạy của T8-139) — **T10-140 đánh
  giá khi đóng sổ**; T2 chỉ ghi nhận thời điểm + boot mới.
- **Mù #60:** 17:40:41Z → probe #60 (đợt 141); reboot #98? nằm
  735 s sau đầu mù. Khung chết #97? chờ merged mù #60.
