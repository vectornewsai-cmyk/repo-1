# PHASE9 ROUND139 T2 — EPERM: probe #58 ok=2 fail=0 + mù #58 ĐÓNG HOÀN TOÀN (3 đoạn, 2 reboot) + HAI gap CHỨNG NHẬN → CERT 57 / FULL 72 + khung chết #94? ứng viên 2 s + #96? OUTSIDE dải chuẩn (INSIDE dải cơ học) + WFS #45 chênh 0

> Luồng T2, đợt 139 vòng lặp Phase 9 VCut Studio (lượt cron 21:35 +07
> 18/11/2026; làm việc 14:40Z → ~15:01Z 18/11/2026).
> Nhiệm vụ: probe #58 theo lịch thường lệ + mù #58 (từ probe #57) +
> boot #96? + WFS lần 45 (đối chiếu bằng SỐ TỔNG KẾT theo quyết parent
> đợt 138 §12.3(h) — file thô scan #43 đã mất, chấp nhận mất).
> Quyết parent đợt 138 §12.3: (a) CHẤP NHẬN đóng đợt 138 (9/9, T10 đóng
> 14:01Z — quá hạn cứng ~1 phút); (b) GIỮ NGUYÊN kế hoạch đo lại lượt yên
> #16, KHÔNG đổi cách đo; (c) GIỮ NGUYÊN ngưỡng gate A, chờ balloon tự xả;
> (d) Birefnet GIỮ NGUYÊN quy trình + guard 6.144 MiB (KHÔNG thử ở ~99%);
> (e) Boot 914964c3 = **#95? TẠM** (quy ước — chờ merged mù #58 của T2-139);
> khung chết #94? 8 s ứng viên chuẩn / 44 s biên ngoài; khung chết #93?
> **GIỮ chuẩn (09:35:47Z, 09:36:01Z] (14 s)**; sự kiện gộp #94?→#95? =
> **#19 XÁC NHẬN**; (f) **Dải T2 [10:03:39Z, 12:01:56Z] (FULL70) làm chuẩn
> cho #96?**; (g) watchdog diag path ĐỔI sang đợt hiện tại ở đợt 139 (T8);
> (h) **F-138-T5-1: CHẤP NHẬN mất file thô scan #43; T2-139 đối chiếu WFS
> #45 với số tổng kết trong LIMITS**; (i) đợt 138 KHÔNG ĐẾM vào số đợt
> 0-kẹt; (j) headroom 2.064 VẪN CHỈ THEO DÕI; (k) Gap #93?→#94? [5.320,
> 5.340] s → CERT 55 / FULL 70: **XÁC NHẬN**.
> Prereg viết TRƯỚC khi đo: hidden_files/round139-t2/prereg-t2.md.
> **ĐÍNH CHÍNH BTO (F-139-T2-1, nguồn T1-139 F-139-T1-1 + xác minh độc lập
> của T2): btime boot hiện tại 541524e2 là 13:53:41Z, KHÔNG phải 14:03:07Z
> như brief/marker đợt 139 đang ghi (lệch +566 s). Mọi gap/khung/dải trong
> LIMITS này đều dùng 13:53:41Z.** Reboot này xảy ra TRƯỚC cờ đóng đợt 138
> (14:01:14Z), giữa lần ghi cuối của T10 13:47:01Z và cờ.
> **KHÔNG có reboot giữa phiên T2 lượt này** — boot 541524e2 từ lúc mở
> (14:40:15Z) tới lần kiểm cuối 15:00:35Z (xem §1; câu này chỉ viết SAU
> lần kiểm boot cuối — bài học F-138-T2-8).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (14:43:59Z–14:44:16Z):**
  `status` báo **DEAD/STALE** (heartbeat age 11.108 s, last #57
  11:39:07Z, boot 17db9652, exit 1); `once` ngay sau đó là **probe
  #58, boot 541524e2, ok=2 fail=0**, exit 0, 14:44:16Z; `status`
  chạy lại **ALIVE** (age 1 s, n=58), exit 0. Log v2 tăng đúng **3
  dòng** (163 → 166) — **như mọi lượt trước**; prereg §3 đã dự báo
  đúng +3 trước khi đo. Heartbeat nay n=58, ts 14:44:16Z, boot
  541524e2.
- **Boot #96? lúc 13:53:41Z, boot
  `541524e2-c789-420b-a27b-9287d68c63a3`** — xác minh bằng `uptime
  -s` + btime 1795010021 + `who -b` + journal 1 boot (xem §1). Clock
  VM hiện tại: HTTP `Date` 3 server hơn local **+1 s / +1 s / +1 s**
  → **F96? ≈ −1 s (±~1 s)** — đo trực tiếp đầu tiên trên boot mới.
- **Khoảng mù #58 (11:39:07Z → 14:44:16Z 18/11, 3h05'09" =
  11.109 s) — ĐÓNG HOÀN TOÀN. Mù đầu tiên có HAI reboot và BA đoạn,
  và là mù đóng hoàn toàn thứ hai liên tiếp (#57, #58).**
  Đoạn A ĐÓNG bằng luật lỗ (merged 77 mốc, lỗ lớn nhất **112 s** ≪
  sàn 1.147 s, tối đa **0 ẩn**); đoạn B ĐÓNG bằng luật lỗ (merged
  155 mốc, lỗ lớn nhất **400 s** ≪ sàn, tối đa **0 ẩn**); đoạn C
  ĐÓNG bằng uptime trực tiếp (merged 27 mốc, lỗ lớn nhất 1.515 s —
  vượt sàn nhưng uptime loại bỏ reboot ẩn). Merged 260 mốc giây.
  **Chuỗi mù đóng hoàn toàn: #50 đóng, #51 hở, #52 đóng, #53 hở,
  #54 đóng, #55 hở, #56 hở, #57 đóng, #58 đóng.**
- **HAI gap CHỨNG NHẬN một lượt (lần đầu tiên):**
  **Gap #94?→#95? = [8.169 s, 8.189 s] (2h16'19" ±10 s)** và
  **Gap #95?→#96? = [7.271 s, 7.291 s] (2h01'21" ±10 s)**.
  **CERT 55→57 / FULL 70→72**: CERT57 mean 1h34'00" median 1h48'41"
  p10 0h27'12" p90 2h18'07" sd 0h45'42"; FULL72 mean 1h40'46" median
  1h49'58" p10 0h27'54" p90 2h25'38" sd 0h56'26"; in 90–150' = 36,
  <60' = 17, >180' = 6, >240' = 2. Dải chứng nhận [0h00'55",
  3h14'08"] không đổi.
- **Boot 914964c3 = #95? — XÁC NHẬN theo quy ước VÀ được củng cố bởi
  merged** (đoạn A mù #58 đóng, tối đa 0 ẩn — không có reboot ẩn
  giữa #94? và boot này; đoạn B đóng nên 541524e2 là #96? theo cùng
  cách đọc). Số tuyệt đối vẫn tạm theo thông lệ, chờ T6-139 chốt
  chuỗi tương đối (T6-139 đã có cờ `.done` lúc T2 đóng nhưng chưa
  công bố LIMITS — xem §4 mục 10).
- **Khung chết #94? ứng viên MỚI HẸP HƠN: (11:52:18Z, 11:52:20Z]
  (2 s)** — mốc cuối là exec-log proc_6fd13900651b.log (birth=mtime
  11:52:18Z). Hẹp hơn cả bản 8 s (T4 poll #13 11:52:12Z, ứng viên
  chuẩn theo quyết (e)) lẫn bản 44 s (biên ngoài). T2 đề xuất 2 s
  làm ứng viên chuẩn mới; parent quyết khi đóng sổ (caveat đồng hồ
  xem F-139-T2-6).
- **Khung chết #95?: (13:47:01Z, 13:53:41Z] (400 s)** — mốc cuối là
  T10-138 O8 logs + vite.lock.queue cooldown 13:47:01Z; phạm vi thứ 5
  có 0 mốc trong đuôi này nên khung đứng. Khung chết #93? GIỮ chuẩn
  (09:35:47Z, 09:36:01Z] (14 s) theo quyết (e) — không đổi.
- **DẢI DỰ BÁO #96? — HAI CÁCH ĐỌC MÂU THUẪN, T2 báo cả hai, không tự
  chọn:** dải CHUẨN theo quyết parent (f) [10:03:39Z, 12:01:56Z]
  (FULL70, neo tại #94?): thực tế 13:53:41Z **NGOÀI dải, muộn hơn
  cận trên 6.705 s (1h51'45")** — chuỗi INSIDE (2 liên tiếp: #94?,
  #95?) ĐỨT ở #96? theo dải này. Dải CƠ HỌC neo tại #95?
  [12:19:58Z, 14:18:15Z] (p10–p90 FULL70): thực tế **NẰM TRONG dải**.
  Dải cơ học mới cho #97? (p10–p90 FULL72): [14:21:34Z, 16:19:19Z];
  dải hiệu dụng sau probe #58: [14:44:16Z, 16:19:19Z].
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 97 file
  *.log có mtime trong mù #58 (0 file repo-1, 97 file
  hidden_files); 2 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả launcher đã biết** (T10-O8, xem §2.7). Quét mở rộng: **8 match
  thô / 8 dòng duy nhất — phân loại hết** (6 dòng test-pass hasEperm
  + 2 dòng launcher). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** —
  **~170,5h** trước probe #58. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 45: 926 dòng / 259 file** (phạm vi 3.155
  file); R7b đối chiếu 951 dòng / 276 file; copies 25 dòng / 17
  file — y hệt lần 43 và 44 về copies. Đối chiếu chéo 926+25=951=R7b,
  **chênh 0 — lần thứ bốn mươi lăm liên tiếp**. +11 dòng / +3 file so
  với lần 44, giải thích đúng hết bằng diff (xem §2.7). Đây là đối
  chiếu bằng **SỐ TỔNG KẾT** theo quyết (h) — file thô scan #43 đã
  mất, chấp nhận mất. Async `.writeFile(`: vẫn đúng **2 vị trí helper
  đã biết** — 0 stray.
- RAM: max biết được trong mù #58 **6.232.924 kB ≈ 6.086,8 MiB
  (T9-138, 11:51:51Z, đoạn A) — 99,07% guard 6.144 MiB, THIẾU
  58.532 kB (~57,2 MiB), KHÔNG vượt**; birefnet KHÔNG chạy bởi T2
  (thuộc T9-139 theo quyết (d)). Đoạn B max 1.345 MB; đoạn C max
  1.502 MB. Balloon ĐANG XẢ trên boot #96?: MemAvailable trực tiếp
  617 MB (14:40:15Z) → 2.504.192 kB (15:00:35Z, ngoài mù).
- **dpkg.log boot #96? — replay XONG: 1.545 dòng / 221 installs / 462
  configure**, lần ghi cuối 13:57:33Z (gstreamer1.0-tools), gói đầu
  libaspell15 13:54:39Z; replay bắt đầu 13:54:12Z (boot +31 s) —
  **KHỚP HOÀN TOÀN hình dạng replay của boot #94?** (1.545/221/462).
- **preview.tsx 530e10a7** (fix GIỮ VĨNH VIỄN theo quyết parent đợt
  137 §12.3(a)); media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts KHÔNG
  ĐỔI ee80d093. T2 không sửa production file nào.
- **Đợt 139 lúc T2 đóng (~15:01Z 18/11):** các luồng khác đang chạy
  (T4/T5/T7/T8/T9/T10 chưa có cờ; T1/T6 đã xong — T6 có cờ nhưng chưa
  công bố LIMITS); boot hiện tại #96? (kiểm 15:00:35Z). T2 KHÔNG mở
  Xvfb (không cần) nên không có gì để kill.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 14:40:15Z | boot_id `541524e2-c789-420b-a27b-9287d68c63a3`; `who -b` Nov 18 13:53; `uptime -s` **2026-11-18 13:53:41**; btime **1795010021 = 2026-11-18T13:53:41Z**; journal chỉ 1 boot (541524e2, first entry 13:53:53Z, last 14:43:23Z lúc kiểm tra). MemAvailable 617.352 kB lúc 14:40:15Z. |
| Đo F96? (HTTP Date, 3 server) | 14:43:59–14:44:02Z | example.com Date 14:44:01Z vs local_after 14:44:00Z (+1 s); google.com Date 14:44:02Z vs local_after 14:44:01Z (+1 s); cloudflare.com Date 14:44:02Z vs local_after 14:44:01Z (+1 s) → **F96? ≈ −1 s (±~1 s)**. Đo trực tiếp đầu tiên trên boot mới. |
| Đọc dpkg.log bracket #96? | ~14:44Z | **1.545 dòng / 221 installs / 462 configure** — replay XONG (lần ghi cuối 13:57:33Z, lặng ~47' lúc đọc đầu — **chứng minh xong**). Gói đầu libaspell15 install 13:54:39Z; 98 dòng gstreamer; replay bắt đầu 13:54:12Z (boot +31 s). Khớp hình dạng replay boot #94?. |
| `bash scripts/probe-eperm-v2.sh status` | 14:44:0xZ | **DEAD/STALE**, heartbeat n=57, ts 11:39:07Z, boot 17db9652, age **11.108 s** (đúng 3h05'08"); last sample probe #57; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 14:44:16Z | **probe #58, boot=541524e2, ok=2 fail=0**, exit 0; dòng `boot changed 17db9652 -> 541524e2` (uptime since 2026-11-18 13:53:41) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~14:44:17Z | **ALIVE**, age 1 s, n=58, exit 0 |
| Xác minh boot lại (sau probe) | 14:44:17Z | Cùng boot 541524e2, `uptime -s` 13:53:41Z, btime 1795010021. MemAvailable 1.219.328 kB. |
| Xác minh boot lần 3 (lần kiểm cuối) | 15:00:35Z | Cùng boot 541524e2 — **KHÔNG reboot tới thời điểm này**. MemAvailable 2.504.192 kB. (Câu "không reboot giữa phiên" chỉ viết sau lần kiểm này — bài học F-138-T2-8.) |

Kiểm lại từ đĩa: log probe v2 **166 dòng** — 163 sau T2-138 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #57 +
dòng `boot changed` + dòng probe #58). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #57 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §3 đã dự báo đúng +3
trước khi đo. Heartbeat **n=58, ts 2026-11-18T14:44:16Z, boot
541524e2-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

**Về btime và journal first entry (nối tiếp T2-138):**
btime thật là **13:53:41Z** (/proc/stat 1795010021 + `uptime -s` +
`who -b`). Journal first entry là **13:53:53Z** — chậm hơn btime
12 s (journald khởi động sau kernel boot ~12 s; các boot trước
đều 16 s: #92?/#93?/#94?/#95? — lần này 12 s, chênh 4 s so với
mẫu cũ, không đổi verdict nào). **Số 14:03:07Z trong brief/marker
đợt 139 là SAI — xem F-139-T2-1 (§4 mục 1 + §6).**

Nguồn độc lập cho boot #96?: 2 session T2 trong vùng C (xem §2.3)
+ 27 mốc merged gộp trong vùng C (mốc đầu 13:54:13Z — xem §2.4;
mốc cuối 14:43:59Z — boot-verify.txt của T2) + 2 exec-log nhắc
541524e2 trong mù (xem §2.3). **Số thứ tự #96? ĐÃ XÁC NHẬN theo
quy ước (quyết (e) đợt 138 cho #95? + merged lần này) và được củng
cố bởi merged**: đoạn A mù #58 đóng với tối đa 0 ẩn nên không có
reboot ẩn giữa #94? và #95?; đoạn B đóng nên không có reboot ẩn
giữa #95? và boot này — T6-139 chốt chuỗi tương đối, số tuyệt đối
vẫn tạm theo thông lệ.

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #58 (11:39:07Z → 14:44:16Z 18/11, 3h05'09" = 11.109 s)

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #58: `uptime -s` = **2026-11-18 13:53:41Z**,
  boot_id `541524e2-c789-420b-a27b-9287d68c63a3` — khác boot của
  probe #57 (17db9652).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (14:40:15Z): chỉ **1 boot**
  (541524e2, first entry 13:53:53Z, last 14:43:23Z). Journal/wtmp
  của các boot trước đã mất theo reboot #96? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #96? — replay XONG, khớp hình dạng boot #94?.**
  Đọc lúc ~14:44Z: **1.545 dòng / 221 installs / 462 configure**
  (installs = số dòng `status installed`; configure = số dòng chứa
  `configure` — cùng phương pháp đếm với T2-136/137/138); lần ghi
  cuối **13:57:33Z** (gstreamer1.0-tools installed), lặng ~47' lúc
  đọc đầu — **chứng minh xong**. Gói đầu libaspell15 install
  13:54:39Z; 98 dòng gstreamer; startup packages configure
  13:54:12Z (×2) → startup archives unpack 13:54:38Z. Replay bắt
  đầu **boot +31 s** — nhanh như #94? (boot +49 s) vì cache apt
  SỐNG QUA REBOOT (cùng mẫu T5-137). **Hình dạng KHỚP baseline
  1.545 dòng / 221 installs của #82?/#83?/#84?/#90?/#92?/#94?** —
  cùng một replay configure khô. **T5-139 là chủ quản postboot —
  bracket chính thức thuộc về T5; số của T2 là đọc độc lập đối
  chiếu.** **dpkg.log của boot #95? (914964c3) đã MẤT** (file lúc
  T2 kiểm chỉ còn log của boot mới): /var/log reset mỗi boot. Bản
  ghi T5-138 (795 dòng / 113 installs — replay `--repair` 1 lần,
  KHÔNG phải replay đầy đủ) + T2-138 §6 (2 dòng lúc 11:55:49Z,
  replay mới bắt đầu boot +51 s) là bằng chứng còn lại cho boot đó
  — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**KHÔNG có reboot giữa phiên T2 lượt này — tới lần kiểm cuối
15:00:35Z:** boot 541524e2 xác minh lúc 14:40:15Z (mở lượt),
14:44:17Z (sau probe #58) và 15:00:35Z (lần kiểm cuối) — cùng
boot_id + btime 13:53:41Z.

### 2.2 Reboot đã chốt trong mù — #95? + #96? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 95? | **11:52:20Z** (chính xác từng giây) | 17db9652 → 914964c3 | Chốt từ lượt này: merged mù #58 đoạn A đóng (tối đa 0 ẩn) + T2-138 §6 đã đọc trực tiếp boot mới lúc 11:55:20Z (`uptime -s` 11:52:20 + btime 1795002740 + `who -b` 11:52 + journal first entry 11:52:36Z). **Số thứ tự ĐÃ XÁC NHẬN theo quy ước (quyết (e) đợt 138) và được củng cố bởi merged.** |
| 96? | **13:53:41Z** (chính xác từng giây) | 914964c3 → 541524e2 | Chốt từ lượt này: `uptime -s` đọc tươi (14:40:15Z + kiểm lại 14:44:17Z + 15:00:35Z) + btime 1795010021 + `who -b` 13:53 + boot_id 541524e2 + journal first entry 13:53:53Z + probe #58 14:44:16Z boot 541524e2 ok=2 fail=0 + merged đoạn B đóng (tối đa 0 ẩn). **Số thứ tự ĐÃ XÁC NHẬN theo quy ước và được củng cố bởi merged.** Btime 14:03:07Z trong brief/marker là SAI (F-139-T2-1). |

**Clock:** F96? ≈ **−1 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` 3 server: example.com
+1 s, google.com +1 s, cloudflare.com +1 s (độ chi tiết 1 s của HTTP
Date). **F96? là lần đo trực tiếp đầu tiên trên boot #96?** — không
dùng cận hai lần đo. F94? ≈ −1 s (±~1 s, đã đo đợt 138). **F95?
KHÔNG đo được** — boot 914964c3 chết trước khi T2 có phiên nào trên
nó (T2-138 chỉ thấy nó lúc đóng phiên 11:55:20Z, không chạy HTTP
Date); hai gap mới mang caveat F một đầu (xem §2.5). Hai đầu chuỗi
đo được (F94?, F96?) đều ≈ −1 s — đồng hồ local ổn định ở mức
chậm ~1 s ở cả hai đầu; xem §2.5 về cách caveat này được xử lý.

**CẬN NHẢY CLOCK TẠI REBOOT:**
- **1 nhân chứng nhảy tại #95?:** **1 session** sinh trước btime
  có mtime sau btime (quét 260 exec-log): proc_76715b8b6c3e.log,
  birth 11:39:55Z, mtime **11:52:51Z** (btime +31 s — đồng hồ boot
  cũ chạy nhanh, cùng lớp F-137-T8-7 / F-138-T8-6 / F-138-T9-3).
- **0 nhân chứng nhảy tại #96?:** **0 session** sinh trước btime
  có mtime sau btime (quét 260 exec-log).
- Cận session: **|X95?| < 2 s** (session muộn nhất 11:52:18Z —
  cận CHẶT NHẤT từ trước tới nay; session sớm nhất sau btime
  11:53:37Z); **|X96?| < 522 s** (session muộn nhất 13:44:59Z;
  session sớm nhất sau btime 14:40:22Z — phiên agent đợt 139).
- **Ranh giới sạch hoàn toàn tại #95?:** 0 file trong
  (btime +0 s, +10 s] (merged 4 phạm vi); 1 file trong [btime −10 s,
  btime] (exec-log 11:52:18Z, −2 s — chính mốc chốt khung chết).
  **Ranh giới sạch hoàn toàn tại #96?:** 0 file trong
  (btime +0 s, +10 s] và 0 file trong [btime −10 s, btime] (merged
  4 phạm vi); file đầu tiên sau btime là dpkg replay 13:54:12Z
  (boot +31 s, ngoài phạm vi merged) và mốc merged đầu tiên
  13:54:13Z (+32 s). Không có file +s kiểu mù #54 (#88? +8 s,
  #89? +3 s) hay mù #50.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #94?→#95? = **[8.169 s, 8.189 s] (2h16'19" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn A mù #58 đóng, tối đa 0 ẩn; đoạn B đóng
  bằng uptime trong logic gộp — xem §2.3). **CERT 55→57 / FULL
  70→72** (xem §2.5).
- Gap #95?→#96? = **[7.271 s, 7.291 s] (2h01'21" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn B mù #58 đóng, tối đa 0 ẩn; đoạn C đóng
  bằng uptime). **CERT 55→57 / FULL 70→72** (xem §2.5).
- Gap #93?→#94? = [5.320 s, 5.340 s] — đã chứng nhận đợt 138, không đổi.
- Gap #92?→#93? = 9.473 s — **VẪN CHỈ LÀ SPAN** (đoạn A mù #56 mở,
  tối đa 1 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại đợt này — xem
  §2.6). **CERT/FULL không tính gap này.**
- Gap #91?→#92? = 6.838 s — **VẪN CHỈ LÀ SPAN** (đoạn B mù #55 mở,
  tối đa 2 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại đợt này — xem
  §2.6). **CERT/FULL không tính gap này.**
- **Dải cơ học cho #96? — HAI CÁCH ĐỌC (xem §0):** dải CHUẨN theo
  quyết parent (f) [10:03:39Z, 12:01:56Z] (FULL70, neo tại #94?):
  thực tế 13:53:41Z — **NGOÀI dải, muộn hơn cận trên 6.705 s**.
  Chuỗi INSIDE (2 liên tiếp: #94?, #95?) ĐỨT ở #96? theo dải này.
  Dải CƠ HỌC neo tại #95? [12:19:58Z, 14:18:15Z] (p10–p90 FULL70):
  thực tế **NẰM TRONG dải**. T2 báo cả hai, parent quyết.
- **Dải cơ học mới cho #97? (p10–p90 FULL72): [14:21:34Z,
  16:19:19Z]** — từ btime #96? 13:53:41Z; dải hiệu dụng sau probe
  #58: [14:44:16Z, 16:19:19Z].

**Khung chết các boot (từ merged — xem §2.4):**
- **Khung chết #94? (ứng viên MỚI HẸP NHẤT): (11:52:18Z,
  11:52:20Z] (2 s)** — mốc muộn nhất là exec-log
  proc_6fd13900651b.log 11:52:18Z (birth=mtime 11:52:18Z — session
  sinh 2 s trước reboot). Hẹp hơn bản 8 s (T4 poll #13 11:52:12Z,
  ứng viên chuẩn theo quyết (e)) và bản 44 s (biên ngoài, mốc kiểm
  cuối của T2-138 11:51:36Z). T2 đề xuất 2 s làm ứng viên chuẩn
  mới; parent quyết khi đóng sổ. Caveat đồng hồ: khung 2 s là khung
  theo đồng hồ đọc; nhân chứng nhảy +31 s cho thấy đồng hồ boot cũ
  có thể chạy nhanh (xem F-139-T2-6) — khung thật theo giờ thực có
  thể rộng hơn 2 s. Cùng caveat với khung 8 s (T10-138 đã chấp nhận
  logic tương tự cho khung 8 s).
- **Khung chết #95?: (13:47:01Z, 13:53:41Z] (400 s)** — mốc muộn
  nhất là T10-138 O8 logs + vite.lock.queue cooldown 13:47:01Z
  (hidden_files); phạm vi thứ 5 có 0 mốc trong (13:47:01Z,
  13:53:41Z] nên khung đứng. Đây là khung rộng vì máy yên sau khi
  T10-138 xong O8 (13:47:01Z) tới khi reboot — T1-139 (F-139-T1-1)
  xác nhận độc lập: reboot xảy ra giữa lần ghi cuối của T10
  13:47:01Z và cờ đóng đợt 138 (14:01:14Z).
- **Khung chết #93?: (09:35:47Z, 09:36:01Z] (14 s) — CHUẨN PARENT
  VẪN ĐỨNG** (§12.3(e) đợt 138). Khung chết #92?: (08:05:05Z,
  08:07:11Z] (126 s) — CHUẨN PARENT VẪN ĐỨNG. Khung chết #91?:
  (04:42:27Z, 05:29:18Z] (2.811 s) — CHUẨN PARENT VẪN ĐỨNG.

**Chuỗi gộp (định nghĩa duy nhất từ đợt 134):** reboot #94?→#95?
là **sự kiện thứ 19** (giữa lượt 138, đã XÁC NHẬN theo quyết (e));
reboot #95?→#96? là **sự kiện thứ 20** — với điều kiện không có
reboot ẩn trong đoạn B mù #58; đoạn B ĐÓNG (tối đa 0 ẩn) nên điều
kiện này ĐƯỢC CHỨNG MINH, không còn là giả định. **Số thứ tự #95?
và #96? ĐÃ XÁC NHẬN theo quy ước** (quyết (e) đợt 138 cho #95? +
merged lần này cho cả hai); chuỗi tương đối do T6-139 chốt, số
tuyệt đối vẫn tạm theo thông lệ; giá trị gap không phụ thuộc số
thứ tự.

### 2.3 Hoạt động trong khoảng mù — ĐÓNG HOÀN TOÀN (merged 4 phạm vi)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **12 file** +
hidden_files **325 file**; **337 file, 333 mốc float phân biệt /
220 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3/T2-133 §2.3/
T2-134 §2.3/T2-135 §2.3/T2-136 §2.3/T2-137 §2.3/T2-138 §2.3 —
"mốc" là mtime float phân biệt, không phải giây tròn). Ngoài hai
cây: **91 file** (agents — exec-log/tool-output chiếm đa số +
avatars + voice + proactivity; chi tiết xem blind58-outside.txt);
**/tmp: 3 file** trong mù #58 (xem blind58-tmp.txt — cả 3 đều
trong đoạn C-tail, xem caveat §2.4).
Gộp cả 4 phạm vi: **260 mốc giây phân biệt**. Chia mù làm ba
đoạn bởi 2 reboot:

- **Đoạn A: 11:39:07Z → 11:52:20Z (13'13" = 793 s, boot #94?
  17db9652) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **105 mốc** (hai cây), lỗ lớn nhất hai cây **166 s**
    (11:49:13Z → 11:51:59Z); lỗ lớn thứ hai 51 s; lỗ lớn thứ ba
    49 s. Mốc đầu 11:39:07Z (head 0 s — chính probe #57); mốc
    cuối hai cây **11:51:59Z** (đuôi hai cây **21 s**).
    **9 session** chạm đoạn A (= A-tail — cả đoạn là tail, xem
    F-139-T2-8).
  - **Merged 4 phạm vi: 77 mốc, lỗ lớn nhất 112 s**
    (11:50:07Z → 11:51:59Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 11:39:11Z (head 4 s), mốc cuối gộp **11:52:18Z**
    (đuôi 2 s — exec-log proc_6fd13900651b.log). Lỗ lớn thứ hai
    gộp **54 s** (11:49:13Z → 11:50:07Z) và lỗ lớn thứ ba **47 s**
    (11:44:54Z → 11:45:41Z) — **cả hai đều NHỎ HƠN NHIỀU so với
    sàn**.
    **Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): 7 file**
    trong đoạn A (alignment nightly run 11:47:19Z — xem §2.4).
  - Đoạn A không có cửa sổ sàn (793 s < 2×sàn 2.294 s) nên toàn bộ
    đoạn là tail; 9 session chạm đoạn, trong đó 1 session sinh
    11:52:18Z (mốc chốt khung chết #94?).
  - Hoạt động trên 17db9652: các luồng đợt 138 làm việc tới
    ~11:52Z (T4 poll #12 11:51:27Z RAM 6.062 MB; T4 poll #13
    11:52:12Z RAM 5.975 MB; T5 ram-sampler 11:51:59Z; T9 sampler
    đỉnh 99,07% guard 11:51:51Z) + T2-138 quét WFS/sweep tới
    11:49:13Z — máy KHÔNG yên trong đoạn A.
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn (merged + hai cây
    đồng thuận).**
- **Đoạn B: 11:52:20Z → 13:53:41Z (2h01'21" = 7.281 s, boot #95?
  914964c3) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **191 mốc** (hai cây), lỗ lớn nhất hai cây **399 s**
    (13:47:01Z → 13:53:41Z — khoảng yên sau khi T10-138 xong O8
    tới khi reboot); mốc cuối **13:47:01Z** (đuôi hai cây
    **400 s**). **17 session** chạm đoạn B.
  - **Merged 4 phạm vi: 155 mốc, lỗ lớn nhất 400 s**
    (13:47:01Z → 13:53:41Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 11:52:51Z (head 31 s — exec-log nhân chứng nhảy,
    đồng hồ boot cũ), mốc cuối gộp **13:47:01Z** (đuôi 400 s).
    Lỗ lớn thứ hai gộp **184 s** (13:36:59Z → 13:40:03Z) và lỗ
    lớn thứ ba **181 s** (13:27:09Z → 13:30:10Z).
    **Phạm vi thứ 5: 0 mốc** trong đoạn B.
  - Cửa sổ sàn [B-lo=12:11:27Z, B-hi=13:34:34Z]: 4 session bắc qua
    cắt B-lo; **0 session bắc qua cắt B-hi** — nhưng luật lỗ đã
    đủ để đóng (lỗ lớn nhất chỉ 400 s ≪ sàn 1.147 s); **3 session
    chạm B-tail** (13:34:34Z, 13:53:41Z] — mốc merged trong B-tail
    dày đặc tới 13:47:01Z rồi yên 400 s tới reboot (T10-138 đã
    xong O8 13:47:01Z; aggregate viết 14:10:43Z — đã sang đoạn C).
  - **Kết luận đoạn B: ĐÓNG — tối đa 0 ẩn (merged + hai cây
    đồng thuận).**
- **Đoạn C: 13:53:41Z → 14:44:16Z (50'35" = 3.035 s, boot #96?
  541524e2) — ĐÓNG bằng đo uptime trực tiếp + luật lỗ:**
  - **`uptime -s` lúc 14:40:15Z = 13:53:41Z** chứng minh máy up
    liên tục từ #96? tới lúc đo; probe #58 14:44:16Z đọc boot_id
    541524e2 tươi — cùng boot_id với boot bắt đầu 13:53:41Z;
    kiểm lại 14:44:17Z + 15:00:35Z cùng boot.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C, T2-132 §2.3 đoạn C, T2-133 §2.3 đoạn B,
    T2-134 §2.3 đoạn C, T2-135 §2.3 đoạn G, T2-136 §2.3 đoạn C
    mù #55, T2-137 §2.3 đoạn B mù #56, T2-138 §2.3 đoạn B mù #57.)
  - **37 mốc** (hai cây), lỗ lớn nhất **1.586 s** (14:11:06Z →
    14:37:32Z — khoảng yên sau khi T10-138 đóng aggregate tới khi
    đợt 139 mở); mốc cuối **14:43:59Z** (đuôi hai cây **17 s**).
  - **Merged 4 phạm vi: 27 mốc, lỗ lớn nhất 1.515 s**
    (14:11:06Z → 14:36:21Z), floor=1 theo luật lỗ thuần túy —
    **nhưng uptime trực tiếp loại bỏ khả năng reboot ẩn trong
    lỗ** (máy up liên tục từ 13:53:41Z tới lúc đo 14:40:15Z;
    journal chỉ 1 boot). Mốc đầu gộp 13:54:13Z (head 32 s), mốc
    cuối gộp 14:43:59Z (đuôi 17 s).
  - Đoạn C dài hơn 2×sàn 2.294 s nên có cửa sổ sàn rộng
    [C-lo=14:12:48Z, C-hi=14:25:09Z]; 0 session bắc qua cắt C-lo,
    **0 session bắc qua cắt C-hi** — uptime là closer, luật lỗ chỉ
    là kiểm chứng thêm. Khoảng yên 14:11:06Z → 14:36:21Z là lúc
    máy thật sự không có tiến trình nào ghi đĩa (T10-138 đã đóng
    14:01Z; đợt 139 dispatch 14:35Z; mốc đầu sau khoảng yên là
    /tmp jarvis-tool-output 14:36:21Z).
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #58 ĐÓNG HOÀN TOÀN.** Đoạn A đóng
(luật lỗ, tối đa 0 ẩn), đoạn B đóng (luật lỗ, tối đa 0 ẩn), đoạn C
đóng (uptime). 2 reboot đã chốt (#95? 11:52:20Z + #96? 13:53:41Z —
chính xác từng giây trên đĩa, số đã xác nhận theo quy ước) +
**tối đa 0 ẩn**. Chuỗi mù đóng hoàn toàn: #50 đóng, #51 hở,
#52 đóng, #53 hở, #54 đóng, #55 hở, #56 hở, **#57 đóng, #58
đóng** — mù đóng hoàn toàn thứ hai liên tiếp, lần đầu tiên một mù
có 2 reboot được đóng hoàn toàn.

Ngoài hai cây: **91 file** có mtime trong mù #58 (agents —
exec-log/tool-output chiếm đa số + avatars + voice/s2s-context;
chi tiết xem blind58-outside.txt); **/tmp: 3 file** trong mù #58
(xem blind58-tmp.txt + caveat §2.4 — cả 3 đều trong đoạn C-tail).
Boot_id nhắc trong exec-log sinh/viết trong mù: 17db9652 5 file,
914964c3 11 file, 541524e2 2 file.

### 2.4 Gộp 4 phạm vi + 4 phát hiện mới (phương pháp nối tiếp T2-138 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind58-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 77 mốc, lỗ lớn nhất **112 s** (11:50:07Z →
  11:51:59Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**. Lỗ lớn thứ hai
  **54 s** (11:49:13Z → 11:50:07Z); lỗ lớn thứ ba **47 s**
  (11:44:54Z → 11:45:41Z) — cả hai cũng nhỏ hơn nhiều so với sàn.
- Đoạn B gộp: 155 mốc, lỗ lớn nhất **400 s** (13:47:01Z →
  13:53:41Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**. Lỗ lớn thứ hai
  184 s; lỗ lớn thứ ba 181 s.
- Đoạn C gộp: 27 mốc, lỗ lớn nhất **1.515 s** (14:11:06Z →
  14:36:21Z — khoảng yên), floor=1 theo luật lỗ thuần túy —
  **nhưng uptime trực tiếp đóng đoạn C** (xem §2.3). Lỗ lớn thứ hai
  412 s; lỗ lớn thứ ba 275 s.
- Tổng gộp 260 mốc giây. Không có file nào trong
  `~/workspace/goals` ngoài hidden_files có mtime trong mù (kiểm
  bằng find riêng — vùng duy nhất hai lần quét chính không phủ,
  đã kiểm bổ sung, 0 file).

**Phát hiện 1 — /tmp CHỈ CÓ 3 file trong mù #58, TẤT CẢ trong đoạn
C (mới, nối tiếp phát hiện 1 của T2-138):** /tmp trên VM này là
tmpfs — reboot #95? (11:52:20Z) xóa mọi file /tmp viết trước đó,
rồi reboot #96? (13:53:41Z) xóa lần nữa. Kiểm trực tiếp từ
blind58-tmp.txt: **0 file có mtime < 13:53:41Z (đoạn A + B), 3 file
có mtime ≥ 13:53:41Z (đoạn C)**; file sớm nhất 14:36:21Z
(jarvis-tool-output), muộn nhất 14:43:23Z (t1-139-count.py). 3 mốc
giây /tmp của merged đều nằm trong đoạn C. **Verdict không đổi:**
đoạn A và B đóng đều không phụ thuộc /tmp (A/B đóng vì lỗ lớn nhất
chỉ 112 s / 400 s trên cả 4 phạm vi, C đóng nhờ uptime). Ghi rõ để
luồng sau khỏi hiểu "3 file /tmp" là bằng chứng cho cả mù — chúng
chỉ phủ đoạn C. Trong A-tail: **0 file**; trong B-tail: **0 file**;
trong C-tail (14:25:09Z, 14:44:16Z]: **3 file**.

**Phát hiện 2 — Đoạn B có nhịp poll ~180 s đều đặn, lỗ lớn nhất chỉ
400 s (mới):** các lỗ lớn thứ hai/thứ ba đoạn B (184 s, 181 s)
đều là khoảng giữa hai lần poll liên tiếp của T4/T5/T8/T9 trong
lúc chờ lượt yên #15 trên boot #95?. Nhịp ~180 s này là "lưới an
toàn" tự nhiên: bất kỳ reboot ẩn nào cũng phải ngồi trong một lỗ
≤400 s — nhỏ hơn sàn 1.147 s tới 2,9 lần. Lỗ 400 s duy nhất là
đuôi yên sau khi T10-138 xong O8 (13:47:01Z) — không phải lỗ giữa
hai lần poll.

**Phát hiện 3 — Mốc cuối đoạn A 11:52:18Z hẹp khung chết #94?
xuống 2 s (mới):** exec-log proc_6fd13900651b.log 11:52:18Z là
session sinh đúng giây đó trên boot #94? trước reboot (birth =
mtime = 11:52:18Z). Mốc này muộn hơn mốc T4 poll #13 11:52:12Z
6 s — khung chết #94? thành (11:52:18Z, 11:52:20Z] = 2 s theo
nguồn của T2. T2 KHÔNG tự đổi chuẩn parent (8 s vẫn đứng);
parent quyết khi đóng sổ (cùng mẫu khung #90? 29 s vs 177 s và
khung #93? 13 s vs 14 s). Caveat đồng hồ xem F-139-T2-6.

**Phát hiện 4 — Phạm vi thứ 5 không lấp đuôi khung chết nào (mới,
kiểm theo bài học F-136-T2-8):** quét ~/memory + ~/dreams +
~/side-chats cho cả mù #58: 7 file (đều 11:47:19Z — alignment
nightly run, đoạn A). **0 mốc trong (11:52:18Z, 11:52:20Z]**
(đuôi khung chết #94?) và **0 mốc trong (13:47:01Z, 13:53:41Z]**
(đuôi khung chết #95?) — verdict hai khung không đổi.

### 2.5 Phân phối gap — CERT n=55 → n=57 / FULL n=70 → n=72 (HAI gap mới chứng nhận)

**Hai gap mới (xem blind58-gaps.py + blind58-gaps.txt):**
- **Gap #94?→#95? = [8.169 s, 8.189 s] (2h16'19" ±10 s) CHỨNG
  NHẬN DẠNG KHOẢNG** — đoạn A mù #58 đóng (merged, tối đa 0 ẩn)
  + đoạn B đóng bằng uptime trong logic gộp (xem §2.3).
  **CERT/FULL tính gap này (mid 8.179 s).** Caveat: F95? không đo
  được (boot 914964c3 chết trước khi T2 có phiên trên nó) — btime
  gaps là RTC nên không bị ảnh hưởng bởi drift đồng hồ guest.
- **Gap #95?→#96? = [7.271 s, 7.291 s] (2h01'21" ±10 s) CHỨNG
  NHẬN DẠNG KHOẢNG** — đoạn B mù #58 đóng (merged, tối đa 0 ẩn)
  + đoạn C đóng bằng uptime. **CERT/FULL tính gap này (mid
  7.281 s).** Caveat: F95? không đo được (xem trên); F96? ≈ −1 s
  đo trực tiếp lượt này.
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

**Cross-check tái hiện T2(137) + T2(138) 100%:** chạy
blind58-gaps.py verbatim cho lại đúng CERT n=54 / FULL n=69 của
T2 đợt 136/137 và CERT n=55 / FULL n=70 của T2 đợt 138 (xem
blind58-gaps.txt: CERT55 mean 1h32'44" median 1h46'28" p10
0h26'54" p90 2h17'50" sd 0h46'01" min 0h00'55" max 3h14'08";
FULL70 mean 1h39'58" median 1h48'59" p10 0h27'38" p90 2h25'56" sd
0h57'01" min 0h00'55" max 5h43'18"; in 90–150' = 34, <60' = 17,
>180' = 6, >240' = 2 — khớp T2-138 §2.5 từng số, và chuỗi exec
lồng nhau tái hiện cả T2-136/137). 2 gap mới vào nên CERT 55→57 /
FULL 70→72.

- **CERT n=57 (mới):** mean 1h34'00" median 1h48'41" p10
  0h27'12" p90 2h18'07" sd 0h45'42" min 0h00'55" max 3h14'08".
- **FULL n=72 (mới):** mean 1h40'46" median 1h49'58" p10
  0h27'54" p90 2h25'38" sd 0h56'26" min 0h00'55" max 5h43'18";
  in 90–150' = 36, <60' = 17, >180' = 6, >240' = 2.
- Độ nhạy LO/HI (2 gap mới ở cận dưới/trên của khoảng):
  CERT57-LO p90 2h18'01" vs CERT57-HI p90 2h18'13" (dịch 12 s —
  nhỏ, ghi rõ); FULL72-LO = FULL72-HI ở p10/p90 (mean dịch 1 s).
  Không giống các đợt trước (LO = HI hoàn toàn) vì lần này có 2
  gap mới cùng lúc; độ nhạy vẫn nhỏ ở độ chính xác này.
- **Dải chứng nhận [0h00'55", 3h14'08"] — không đổi** (2 gap mới
  8.179 s và 7.281 s đều nằm trong dải).
- **Dải cơ học cho #97? (p10–p90 FULL72): [14:21:34Z,
  16:19:19Z 18/11]** — từ btime #96? 13:53:41Z; dải hiệu dụng sau
  probe #58: [14:44:16Z, 16:19:19Z].
- **Dải cơ học cho #96? — HAI VERDICT (xem §0/§2.2):**
  dải chuẩn parent (f) [10:03:39Z, 12:01:56Z] → **OUTSIDE**
  (muộn hơn cận trên 6.705 s); dải cơ học neo tại #95?
  [12:19:58Z, 14:18:15Z] (p10–p90 FULL70) → **INSIDE**.
  Chuỗi INSIDE theo dải chuẩn đứt ở 2 lần liên tiếp (#94?, #95?);
  theo dải cơ học chuỗi INSIDE kéo dài thành 3 lần liên tiếp.
  T2 không tự chọn — parent quyết khi đóng sổ.
- **Tốc độ reboot (đồng hồ ghi nhận):** 96 / 185,59 h = **1 reboot
  mỗi 116,0 phút** (từ #1 2026-11-10T20:18:10Z tới #96?
  2026-11-18T13:53:41Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 100 / 185,59 h = **1 mỗi 111,4 phút**; +3 nữa
  (mù #53 đoạn B tối đa 3) → 103 / 185,59 h = **1 mỗi 108,1
  phút**; +2 nữa (mù #55 đoạn B tối đa 2, quy ước) → 105 /
  185,59 h = **1 mỗi 106,1 phút**; +1 nữa (mù #56 đoạn A tối đa 1,
  quy ước) → 106 / 185,59 h = **1 mỗi 105,1 phút**; **+0 nữa
  (mù #57 ĐÓNG, tối đa 0) → 106 / 185,59 h = 1 mỗi 105,1 phút**;
  **+0 nữa (mù #58 ĐÓNG, tối đa 0) → 106 / 185,59 h = 1 mỗi
  105,1 phút** (đọc cộng dồn: mù #55 đoạn B tối đa 3 → 107 /
  185,59 h = **1 mỗi 104,1 phút**; mù #56 đoạn A tối đa 3 → 108 /
  185,59 h = **1 mỗi 103,1 phút**). Chưa tính ẩn danh nghĩa tối đa
  của mù #35 (+24), mù #37 (+29), mù #38 đoạn G (+6), mù #39 đoạn
  J (+2), mù #40 đoạn B (+1), mù #43 đoạn B (+3), mù #44 đoạn D
  (+5), mù #45 đoạn G1 (+4), mù #46 đoạn A (+4), mù #48 đoạn A
  (+2), mù #49 đoạn B (+1), mù #51 đoạn B (+3).
  Mù #50: **+0** (đóng hoàn toàn). Mù #52: **+0** (đóng hoàn
  toàn). Mù #53: **+3** (đoạn B mở — recheck đợt 137 xác nhận).
  Mù #54: **+0** (đóng hoàn toàn). Mù #55: **+2 (quy ước) / +3
  (cộng dồn)**. Mù #56: **+1 (quy ước) / +3 (cộng dồn)**.
  Mù #57: **+0 (đóng hoàn toàn)**. **Mù #58: +0 (đóng hoàn
  toàn) — mới.**

### 2.6 Mù #56 A + mù #55 B + mù #53 B + mù #51 B + mù #49 B: KHÔNG kiểm lại đợt này

- **Mù #56 A: KHÔNG kiểm lại đợt này.** Đã recheck đợt 138 (0 mốc
  mới trong lỗ, 9 hit đều là file biên phải đã biết); hồ sơ đã ổn
  định; brief đợt 139 không giao recheck; T2 đợt này không thấy
  bằng chứng mới nào về mù #56 A. Gap #92?→#93? = 9.473 s GIỮ
  SPAN.
- **Mù #55 B: KHÔNG kiểm lại đợt này.** Đã recheck đợt 138 (0 mốc
  mới); hồ sơ đã ổn định; brief đợt 139 không giao recheck; T2 đợt
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

### 2.7 Quét writeFileSync lần thứ 45 — chênh 0 (lần thứ 45 liên tiếp) — ĐỐI CHIẾU BẰNG SỐ TỔNG KẾT

- Chạy script `scan-wfs.sh` (bản T2 trong round139-t2, đã đổi OUT
  sang round139-t2) **14:57:34Z → 14:58:00Z 18/11 (26 s, có
  SCAN-END)**. **Scan chạy trên boot #96?** — kết quả vẫn hợp lệ
  vì scan chỉ đếm code hiện tại trên đĩa, không phụ thuộc boot hay
  giờ mù.
- NEWSTD: **926 dòng / 259 file** (phạm vi 3.155 file); R7b đối
  chiếu: **951 dòng / 276 file** (phạm vi 12.548 file); copies:
  **25 dòng / 17 file** — y hệt lần 43 và 44 về copies. Đối chiếu
  chéo: 926+25=951=R7b, **chênh 0**.
- **Đối chiếu bằng SỐ TỔNG KẾT (quyết parent đợt 138 §12.3(h)):**
  file thô scan #43 đã mất (F-138-T5-1 — T5 ghi đè 7 file thô #43
  trước khi phát hiện; chấp nhận mất, không khôi phục được). Số
  tổng kết #43 còn nguyên trong LIMITS T2-137 §2.7 (**907 dòng /
  253 file**, R7b **932/270**, copies **25/17** — T2 đã đọc lại trực
  tiếp từ file LIMITS đợt này) và số #44 trong LIMITS T2-138 §2.7
  (**915/256**, R7b **940/273**, copies **25/17** — file thô #44
  còn nguyên trong round138-t2, T2 đối chiếu chéo được). Chuỗi:
  #43 907/253 → #44 915/256 (+8/+3) → **#45 926/259 (+11/+3)**.
- **+11 dòng / +3 file so với lần 44** (915/256 → 926/259), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + diff
  từng dòng — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND138_T5_INFRA_LIMITS.md | +1 (2 → 3) | sau scan #44 | LIMITS T5 đợt 138, viết thêm 1 mention `writeFileSync` sau khi T2-138 quét (scan #44 chạy 11:48:37Z; T5 xong ~12:36Z) |
  | docs/PHASE9_ROUND138_T2_EPERM_LIMITS.md | +6 (0 → 6) | 11:56:39Z 18/11 | Tài liệu T2 đợt 138 (nhắc `writeFileSync` 6 lần); viết SAU scan lần 44 (11:48:37Z) nên lần này mới vào |
  | docs/PHASE9_ROUND138_LIMITS.md | +2 (0 → 2) | 14:10:43Z 18/11 | LIMITS gộp đợt 138 (nhắc `writeFileSync` 2 lần); viết SAU scan lần 44 nên lần này mới vào |
  | docs/PHASE9_ROUND139_T5_INFRA_LIMITS.md | +2 (0 → 2) | trước scan #45 | Tài liệu T5 đợt 139 (đã viết trước scan lần 45); nhắc `writeFileSync` 2 lần |
  1+6+2+2 = 11 dòng. ✓ (Phạm vi: 3.155 = 3.146 + 9 net (**9 file
  mới, 0 file mất**: kiểm bằng diff danh sách file — 9 file mới
  gồm 6 LIMITS đợt 138 (T4/T7/T8/T9 + T2 + gộp) + 3 LIMITS đợt 139
  đã viết trước scan (T1/T5/T6); trong 9 file mới có 3 file mang
  hit (+3 file) là T2-138 + gộp 138 + T5-139; 6 file còn lại không
  mang hit. Copies y hệt lần 44 (diff 0 dòng).)
- **Kết luận: 45 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #58. Verdict
  "chênh 0 lần 45" đứng trên đối chiếu bằng số tổng kết (#43) +
  file thô (#44, #45) + hai lần quét độc lập #44 (T2 vs T5 khớp
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
  né EPERM trong mù #58.

## 3. RAM trong mù #58 — max 6.086,8 MiB (99,07% guard, KHÔNG vượt), birefnet KHÔNG chạy bởi T2

- **5 mẫu MemAvailable trực tiếp của lượt (đoạn C + lúc đóng):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 14:40:15Z | **617.352 kB** (603 MB) | Lúc mở phiên (boot #96?, đoạn C) — THẤP, balloon còn kẹt từ boot #95? |
  | 14:43:29Z | **1.351.712 kB** (1.320 MB) | Trong lúc đo F96? (boot #96?, đoạn C) — đang hồi nhanh |
  | 14:43:59Z | **1.270.048 kB** (1.240 MB) | Xác minh boot (boot #96?, đoạn C) |
  | 14:44:17Z | **1.219.328 kB** (1.191 MB) | Sau probe #58 (boot #96?, đoạn C) |
  | 15:00:35Z | **2.504.192 kB** (2.446 MB) | Lúc đóng phiên T2 (boot #96?, đoạn C) — NGOÀI mù #58; balloon ĐANG XẢ MẠNH, đã vượt xa gate A 1.024 MB; **để T9-139 biết: RAM đang hồi nhanh trên boot #96?, cửa sổ đo lượt yên #16 có thể đang mở ra** |
- **Max RAM biết được TRONG mù #58: 6.232.924 kB ≈ 6.086,8 MiB
  (T9-138, 11:51:51Z, đoạn A, Balloon 585.796 kB) — 99,07% guard
  6.144 MiB, THIẾU 58.532 kB (~57,2 MiB), KHÔNG VƯỢT.** Nguồn:
  T9-138 LIMITS §3 (đo trực tiếp theo MemAvailable; chuỗi T9:
  5.700.224 kB (11:50:51Z) → **6.232.924 kB (11:51:51Z)** →
  5.863.552 kB (11:52:51Z) — đỉnh chỉ tồn tại trong một mẫu 60
  giây rồi lùi 369.372 kB; reboot 11:52:20Z cắt đứt đợt hồi ngay
  sau đó). Đợt 138 max 99,07% là kỷ lục T9 mới (vượt đỉnh đợt 136:
  6.081 MB = 98,99%).
- **Corroboration độc lập từ T4-138 + T5-138 (đếm bằng code — xem
  ram-max.txt):** ram-max58.py bắt 235 mẫu; đoạn A max theo
  ram-max: **6.062 MB** (T4 poll #12, 11:51:27Z); T4 poll #13
  5.975 MB (11:52:12Z); T5 ram-sampler 5.969 MB (11:51:59Z).
  Đoạn B max **1.345 MB** (11:56:48Z — ngay sau reboot #95?,
  balloon siết mạnh); đoạn C max **1.502 MB** (14:42:36Z).
  Ba sampler độc lập (T9/T4/T5) đều đỉnh trong cùng cửa sổ
  ~11:51:27–11:51:59Z và **không sampler nào quan sát được ≥
  6.144 MiB** — quyết "thử ngay khi quan sát được" đã được trực
  đúng (T9 ở lại muộn, sampler chạy tới 13:30Z), cửa sổ chỉ
  không mở.
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Cửa sổ vượt guard KHÔNG XUẤT HIỆN trong mù #58 (đỉnh cao nhất
  99,07% < 100%) và T2 KHÔNG thử (không thuộc brief T2; việc thử
  thuộc T9-139 theo quyết parent đợt 138 §12.3(d): "GIỮ NGUYÊN
  quy trình + guard 6.144 MiB; KHÔNG thử ở ~99%"). u2net là
  fallback chính thức. **Lưu ý cho T9:** mẫu trực tiếp 2.504.192
  kB lúc 15:00:35Z (ngoài mù) cho thấy balloon đang xả mạnh trên
  boot #96? — nếu một lượt sau (hoặc chính T9 đợt này) quan sát
  được ≥ 6.144 MiB thì đủ điều kiện thử birefnet theo quyết
  §12.3(d); lượt này T2 chưa thử.
- Caveat phương pháp (F-139-T2-5): ram-max58.py chỉ bắt được mẫu
  cao nhất 6.062 MB — mẫu cao hơn của T9 (6.232.924 kB) không vào
  danh sách vì dòng log gốc không mang timestamp ISO-T trên cùng
  dòng (regex của script yêu cầu `2026-11-18T…`); T2 tìm ra bằng
  cách đối chiếu LIMITS của T9. **ram-max là cận dưới, không phải
  max tuyệt đối** — luôn đối chiếu LIMITS sibling.

## 4. Ghi chú phương pháp + kiểm prereg

1. **Prereg đợt này KHÔNG có dự báo sai lớn — các dự báo chính đều
   đúng, 2 điểm tốt hơn dự báo:** probe #58 ok=2 fail=0 + log +3
   (đúng); đoạn A "ĐÓNG được" (đúng — đóng với tối đa 0 ẩn); đoạn B
   "CHƯA BIẾT" (thực tế ĐÓNG — tốt hơn dự báo dè dặt, lỗ lớn nhất
   chỉ 400 s); đoạn C đóng bằng uptime (đúng); khung chết #94? kỳ
   vọng mốc cuối ≈ 11:52:12Z (thực tế 11:52:18Z — hẹp hơn 6 s nữa);
   EPERM 0 sóng thật + WFS chênh 0 (đúng). Lệch nhỏ: WFS +11 dòng
   (prereg đoán ~+8/+3 — lệch +3 dòng do T5-138 LIMITS tăng 2→3 sau
   scan #44, xem §2.7); dải cơ học cận trên 14:18:16Z (thực tế
   14:18:15Z — xem F-139-T2-4).
2. **F-139-T2-1 — btime 14:03:07Z trong brief/marker đợt 139 là SAI
   (mới, đính chính theo T1-139 F-139-T1-1 + xác minh độc lập của
   T2):** brief giao cho T2-139 và round-in-progress.md đều ghi
   boot 541524e2 btime 14:03:07Z. Bốn nguồn độc lập của T2 đều cho
   **13:53:41Z**: /proc/stat btime 1795010021, `uptime -s`
   2026-11-18 13:53:41, `who -b` Nov 18 13:53, journal first entry
   13:53:53Z (btime +12 s). T1-139 (F-139-T1-1) xác minh độc lập
   bằng 4 nguồn (gồm /proc/1 birth) và kết luận 14:03:07Z lệch
   +566 s, nhiều khả năng là giờ parent quan sát. Reboot xảy ra
   TRƯỚC cờ đóng đợt 138 (14:01:14Z), giữa lần ghi cuối của T10
   13:47:01Z và cờ. **Mọi gap/khung/dải trong LIMITS này đều dùng
   13:53:41Z.** Nếu dùng 14:03:07Z thì gap #95?→#96? thành 7.847 s
   và khung chết #95? thành (13:47:01Z, 14:03:07Z] = 966 s — verdict
   hai dải cho #96? KHÔNG đổi (vẫn OUTSIDE theo dải chuẩn, INSIDE
   theo dải cơ học). Marker round-in-progress.md vẫn ghi 14:03:07Z
   — cần main chat/T10 sửa khi đóng sổ (T2 không sửa file của luồng
   khác).
3. **F-139-T2-2 — adapt58.py assert abort giữa chừng, để lại 0 file
   đã adapt (mới, cùng lớp F-138-T2-2):** assert `"round138-t2" in
   src` thất bại ở blind58-gaps.py (file chỉ có `"round137-t2"`,
   không có `"round138-t2"` trần) — script abort TRƯỚC khi ghi file
   nào. Đã sửa adapt58.py thành replace không assert + verify bằng
   grep sau adapt (bài học F-138-T2-2). **KHÔNG có file nào bị adapt
   nửa vời** (grep sau lần chạy lỗi cho thấy mọi file vẫn ở trạng
   thái gốc).
4. **F-139-T2-3 — gaps.py exec path tự trỏ chính nó sau adapt (mới,
   cùng lớp F-138-T2-1):** adapt đổi `"round137-t2/blind56-gaps.py"`
   → `"round138-t2/blind57-gaps.py"` rồi bước `blind57`→`blind58`
   bắt luôn chuỗi vừa viết, thành `round138-t2/blind58-gaps.py`
   (tự exec chính nó). Đã phát hiện bằng grep verify TRƯỚC khi chạy
   và viết lại toàn bộ blind58-gaps.py. **KHÔNG dùng số nào từ bản
   lỗi.**
5. **F-139-T2-4 — prereg dải cơ học cận trên 14:18:16Z, script cho
   14:18:15Z (mới, đính chính làm tròn):** prereg cộng p90 hiển thị
   2h25'56" (= 8.756 s) vào btime #95? được 14:18:16Z; p90 nội suy
   chính xác của FULL70 là 8.755,x s nên cận trên thật là 14:18:15Z.
   Verdict INSIDE không đổi (13:53:41Z nằm sâu trong dải cả hai
   cách tính).
6. **F-139-T2-5 — ram-max58.py bỏ sót mẫu RAM cao nhất của T9
   (mới, cùng lớp F-138-T2-6):** mẫu 6.232.924 kB (11:51:51Z) không
   vào danh sách vì dòng log gốc không mang timestamp ISO-T trên
   cùng dòng (regex yêu cầu `2026-11-18T…`). T2 tìm ra bằng cách
   đối chiếu LIMITS T9-138 §3. Bài học: ram-max chỉ là cận dưới;
   luôn đối chiếu LIMITS sibling trước khi chốt max RAM.
7. **F-139-T2-6 — khung chết #94? 2 s là khung theo đồng hồ đọc
   (mới, §2.2):** nhân chứng nhảy 1 session mtime 11:52:51Z
   (btime +31 s) cho thấy đồng hồ boot cũ có thể chạy nhanh ~30 s
   (cùng hiện tượng đợt 137/138); mốc 11:52:18Z là mốc đọc theo
   đồng hồ đó nên khung thật theo giờ thực có thể rộng hơn 2 s.
   Cùng caveat với khung 8 s (T4 poll #13 cũng là mốc đọc theo
   đồng hồ boot cũ; T10-138 đã chấp nhận logic tương tự cho khung
   8 s). T2 đề xuất 2 s làm ứng viên chuẩn mới; parent quyết.
8. **F-139-T2-7 — file observer T10-138 sha256 không tồn tại (mới):**
   `round138-t10/t10-closing-sha256.txt` UNREADABLE — tên file
   trong script investigate kế thừa từ đợt trước không khớp tên thật
   của T10-138. Không ảnh hưởng verdict (chỉ là kiểm observer phụ;
   các observer khác đọc được: LIMITS gộp 138 14:10:43Z, T2-138
   LIMITS 11:56:39Z, cờ t10.done 14:01:14Z, GAP_ANALYSIS 14:03:51Z,
   build-loop-log 14:11:06Z).
9. **F-139-T2-8 — sessions.py zone "A-tail" = toàn bộ đoạn A (mới):**
   đoạn A chỉ 793 s < sàn 1.147 s nên không có cửa sổ sàn; T2 định
   nghĩa A-tail = (11:39:07Z, 11:52:20Z] (toàn bộ đoạn). Ghi rõ để
   luồng sau khỏi hiểu nhầm A-tail là 1.147 s cuối như các đợt
   trước.
10. **F-139-T2-9 — F95? KHÔNG đo được (mới, §2.2):** boot 914964c3
    chết trước khi T2 có phiên nào trên nó (T2-138 chỉ thấy nó lúc
    đóng phiên 11:55:20Z, không chạy HTTP Date). Hai gap mới mang
    caveat F một đầu; btime gaps là RTC nên không bị ảnh hưởng bởi
    drift đồng hồ guest.
11. **Docstring các script blind58 đã kiểm cửa sổ (mới):**
    investigate/sessions/merged/gaps/fifthscope/sweep/ram-max đều
    ghi đúng cửa sổ (11:39:07Z → 14:44:16Z 18/11) + SEGS 3 đoạn
    viết mới — đã kiểm bằng grep trước khi chạy (bài học T2-133 §4
    mục 6: kiểm SEGS sau khi adapt; F-139-T2-2/3 là hai lỗi adapt
    đã bắt bằng chính bước kiểm này).
12. **T6-139 chưa công bố chuỗi lúc T2 đóng (mới):** thư mục
    round139-t6 lúc T2 đóng chỉ có file mở/đóng phiên (status-open,
    analyze-log, ps-full-open/close, ss-open/close, vite-lock-v2
    cleaned) + cờ round139-t6.done — chưa có LIMITS. Số #95?/#96?
    vẫn chờ T6 chốt chuỗi tương đối #58→#96?. T10 đối chiếu khi
    đóng sổ. (Tiền lệ: các đợt trước T6 thường công bố sau T2;
    không phải sai số. Lần này merged đã loại bỏ khả năng reboot ẩn
    nên số #95?/#96? vững hơn mọi lần trước.)
13. **preview.tsx 530e10a7 GIỮ VĨNH VIỄN — theo quyết parent, không
    phải sai số (mới, §0):** md5 530e10a7 — fix instrumentation
    của T3-134 theo quyết parent đợt 137 §12.3(a) (GIỮ VĨNH VIỄN,
    từ đợt 138 chỉ giám sát thụ động điều tra (c2)). media.ts
    KHÔNG ĐỔI 2c384ed1; vite.config.ts (apps/web/) KHÔNG ĐỔI
    ee80d093. T2 không sửa production file nào.
14. **R9 (a): SỐ ĐẾM VẪN LÀ 16 — KHÔNG tăng (nhắc lại, §0):**
    quyết parent đợt 134 §12.3(d) đã đính chính T5-134 viết
    "nhắc lần 17" là sai; số đếm giữ 16. File LIMITS này KHÔNG
    viết số 17 ở bất cứ đâu cho R9 (a).

## 5. Hồ sơ + stage

- **LIMITS này:** `docs/PHASE9_ROUND139_T2_EPERM_LIMITS.md`
  (oversize >37.768 B — chỉ stage paths, không push, như các
  LIMITS oversize đợt 134–138).
- **Thư mục làm việc:** `hidden_files/round139-t2/` — prereg-t2.md,
  boot-verify.txt, f96.txt (đo F96? — xem §1), status1/once/status2
  + .exit, adapt58.py, blind58-investigate.py + .log,
  blind58-sessions.py + .log, blind58-merged.py + .log,
  blind58-gaps.py + .txt, blind58-fifthscope.py + .log,
  blind58-repo-1.txt, blind58-hidden_files.txt, blind58-outside.txt,
  blind58-tmp.txt, sessions-all.txt, eperm-sweep58.py +
  eperm-sweep-run.log, ram-max58.py + ram-max.txt, scan-wfs.sh +
  scan-meta.txt + files-*.bin + wfs-*.txt.
- **Stage (KHÔNG push):** `phase9-round139-t2-eperm.txt`
  (NUL-delimited, 1 entry: LIMITS này; verify read-back trước khi
  đóng cờ).
- **Cờ:** `hidden_files/round139-t2.done`.
- **Mù #59 MỚI MỞ** từ probe #58 (14:44:16Z 18/11) — việc của T2
  đợt 140. Dải cơ học cho #97?: [14:21:34Z, 16:19:19Z]; dải hiệu
  dụng sau probe #58: [14:44:16Z, 16:19:19Z].

## 6. Hậu kỳ — ĐÍNH CHÍNH BTO 14:03:07Z (ghi thêm sau khi T1-139 xác minh độc lập)

> Ghi thêm khi nhận bổ sung từ T1-139 (F-139-T1-1) trong lúc viết
> LIMITS. Mọi số liệu trong §0–§5 đã dùng btime đúng 13:53:41Z từ
> đầu (prereg đã ghi mâu thuẫn +566 s trước khi đo); không có số
> liệu nào phải đo lại.

- **Btime thật của boot 541524e2 là 13:53:41Z (epoch 1795010021),
  KHÔNG phải 14:03:07Z như brief/marker đợt 139 đang ghi.**
  T1-139 xác minh độc lập bằng 4 nguồn (/proc/stat, journal first
  entry 13:53:53Z, who -b/uptime, /proc/1 birth) — T2 xác minh
  độc lập bằng 4 nguồn của mình (/proc/stat 1795010021, `uptime -s`
  13:53:41Z, `who -b` Nov 18 13:53, journal first entry 13:53:53Z)
  và khớp hoàn toàn với T1. Số 14:03:07Z lệch **+566 s**, nhiều
  khả năng là giờ parent quan sát (khi mở đợt 139, main chat ghi
  boot lúc mở kèm giờ quan sát thay vì btime).
- **Hệ quả:** gap #95?→#96? = 7.281 s (không phải 7.847 s nếu dùng
  14:03:07Z); khung chết #95? = (13:47:01Z, 13:53:41Z] = 400 s
  (không phải 966 s); reboot xảy ra TRƯỚC cờ đóng đợt 138
  (14:01:14Z) — tức reboot #96? là reboot GIỮA RANH GIỚI hai đợt
  (sau lần ghi cuối của T10 13:47:01Z, trước khi T10 đóng cờ),
  không phải reboot giữa lượt 139. Verdict hai dải cho #96?
  KHÔNG đổi nếu dùng số sai (vẫn OUTSIDE theo dải chuẩn, INSIDE
  theo dải cơ học).
- **Marker round-in-progress.md vẫn ghi 14:03:07Z** — T2 không sửa
  file của luồng khác; main chat/T10 sửa khi đóng sổ đợt 139.
