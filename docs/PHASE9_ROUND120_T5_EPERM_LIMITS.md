# PHASE9 ROUND120 T5 — EPERM: probe #39 + mù #38 KHÔNG ĐÓNG (G mở) + BƯỚC NHẢY CLOCK tại #58

> Luồng T5, đợt 120 vòng lặp Phase 9 VCut Studio (lượt cron 12:35 +07,
> 16/11/2026; làm việc 05:41Z → 06:1xZ 16/11/2026).
> Nhiệm vụ: mù #37 tiếp + probe #39 + quét sóng EPERM + quét writeFileSync
> lần thứ 26 + ghi RAM (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round120-t5/prereg-t5.md (định nghĩa probe #39, mốc đối
> chiếu, tiêu chí đóng mù #38, dự báo đoạn G KHÔNG đóng).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #37, #35, #31, #30, #29, #28,
> #26, #24, #21, hay reboot #16** — chỉ báo cáo "không thấy" vs "không
> có". Mù #37 KHÔNG thử đóng lại (parent đã chấp nhận để mở, QUYẾT
> PARENT 7 đợt 119). G1 + mù #22/#28/#29/#30/#31/#35 chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (05:44Z):** `status` báo
  **DEAD/STALE** (heartbeat age 21.553 s, last #38 23:45:17Z, boot
  27c8b1d9, exit 1); `once` ngay sau đó là **probe #39, boot
  0260101b, ok=2 fail=0**, exit 0, 05:44:31Z; `status` chạy lại
  **ALIVE** (age 0 s, n=39), exit 0. Log v2 tăng đúng **3 dòng**
  (106 → 109) — **như R7/S7/T7/T6 (+3)**; prereg §1 đã dự báo đúng
  +3 trước khi đo. Heartbeat nay n=39, ts 05:44:31Z, boot 0260101b.
- **Boot #60 (tạm) lúc 04:45:49Z, boot
  `0260101b-acd3-43f4-91d2-670c1960fb7d`** — xác minh bằng `uptime -s`
  ×3 + btime 1794804349 + `who -b` + journal 1 boot + wtmp +
  `ps` systemd PID 1 START 04:45:59 (xem §1). Clock VM hiện tại CHÍNH
  XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u`
  trong 0–1 s) → **F_now ≈ 0**.
- **PHÁT HIỆN MỚI — BƯỚC NHẢY CLOCK TẠI REBOOT #58 (xem §2.2):**
  poller T10 run 1 poll **#14 ghi lúc 00:54:13Z trên boot 27c8b1d9**,
  nhưng btime của boot mới #58 là **00:53:41Z** — một tiến trình sống
  đã ghi log **32 giây SAU giờ boot của boot kế tiếp**. Đồng hồ đã
  bước LÙI tại #58 một lượng X ∈ **[32, 332] giây** (cận trên: poll
  #15 due ~00:59:13Z không bao giờ ghi). Hệ quả: gap #57→#58 trở
  thành **KHOẢNG [1h20'07", 1h25'39"]** (mid 1h22'53"), không còn là
  điểm. Đây là lần thứ hai chứng minh được nhảy clock tại một reboot
  trên VM này (lần đầu: #54, bài học "giây nháy").
- **Khoảng mù #38: 23:45:17Z → 05:44:31Z (5h59'14") — KHÔNG ĐÓNG
  HOÀN TOÀN (mới, lượt này).** Đoạn E **ĐÓNG** (probe #38 uptime +
  poller T10 run 1 + T4 poll5m + gate0-wait + T4 attempt5 gateA poll
  00:53:31Z + 2 session bắc qua cắt E-hi + đuôi ≤300 s < sàn); đoạn
  F **ĐÓNG** (poller T10 run 2 + T4 poll5m + gate0-wait #22–#25 +
  suite + O8-WebKit exit 01:47:08Z, đuôi 41 s < sàn); đoạn G
  **KHÔNG ĐÓNG** (lỗ (02:41:59Z, 04:45:49Z] 2h03'49", 0 session,
  0 file trong cả 3 phạm vi + /tmp, tối đa 6 ẩn danh nghĩa); đoạn H
  **ĐÓNG** (uptime trực tiếp lúc probe #39 + dấu boot tươi sibling
  đợt 120). **3 reboot đã chốt trong mù (#58 00:53:41Z, #59
  01:47:49Z, #60 04:45:49Z — cả ba đều có giây chính xác trên đĩa)
  + tối đa 6 ẩn danh nghĩa (đoạn G).**
- **Gap #57→#58 = KHOẢNG [4807, 5139]s ĐƯỢC CHỨNG NHẬN (mới — điểm
  giữa 4973s dùng cho thống kê, xem §2.5).** **Gap #58→#59 = 54'08"
  (3.248 s) ĐƯỢC CHỨNG NHẬN (điểm, caveat F59 chưa kiểm).**
  CERT n=31 → **n=33**; FULL n=46 → **n=48**. Dải chứng nhận
  [19'07", 3h14'08"] không đổi. **Gap #59→#60 = 2h58'00" chỉ là
  SPAN** (đoạn G mở) — KHÔNG vào FULL/CERT.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong 116
  file *.log có mtime trong mù #38 (0 file repo-1, 116 file
  hidden_files); 5 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả đã biết** (launcher T2 ×1 + T10-O8 ×4). Sóng gần nhất vẫn là
  **~11:55–12:11Z 15/11** (R7) — **~113h33'** trước probe #39.
  EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 26: 774 dòng / 212 file** (phạm vi 2.931
  file); R7b đối chiếu 799 dòng / 229 file; copies 25 dòng / 17
  file — y hệt lần 25 về copies; đối chiếu chéo 774+25=799=R7b,
  **chênh 0 — lần thứ hai mươi sáu liên tiếp**. +4 dòng / +1 file
  so với lần 25, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** (+ 1 bản
  build dist cũ của cùng helper) — 0 stray; mtime không đổi từ
  10–11/11.
- RAM: max biết được trong mù #38 **4.796 MB** (T4 poll5m,
  23:55:57Z, đoạn E) = 78% ngưỡng guard — thấp hơn mù #37 (4.811
  MB) 15 MB; đoạn F max 4.025 MB, đoạn G max 1.634 MB, đoạn H
  không có mẫu. Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công
  trong gói. Reboot #16 VẪN MỞ; cron riêng 10 phút vẫn chờ user
  quyết; R9 (a) vẫn chờ user.
- **Không có reboot mới trong lúc T5 làm việc** (boot vẫn 0260101b,
  uptime-s 04:45:49Z lúc 06:10:14Z — kiểm lại trước khi viết LIMITS).
- **dpkg.log boot #60: chỉ 2 dòng @05:35:40Z; /var/log/apt/ KHÔNG
  TỒN TẠI** — không có bracket replay cho #60 (khác #57, xem §2.1).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 05:41:10Z | boot_id `0260101b-acd3-43f4-91d2-670c1960fb7d`; `who -b` Nov 16 04:46; `uptime -s` **2026-11-16 04:45:49** (3 lần tổng cộng, giống nhau từng giây: 05:41:10Z, 05:44:30Z, 06:10:14Z); btime **1794804349 = 2026-11-16T04:45:49Z**; journal chỉ 1 boot (0260101b, first entry 04:46:00Z, last 05:40:04Z lúc kiểm tra); `last -x reboot` 04:46 still running; wtmp bắt đầu 04:46:00Z; `ps` systemd PID 1 START 04:45:59 |
| `bash scripts/probe-eperm-v2.sh status` | 05:44:30Z | **DEAD/STALE**, heartbeat n=38, ts 23:45:17Z, boot 27c8b1d9, age **21.553 s** (đúng 5h59'13"); last sample probe #38; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 05:44:31Z | **probe #39, boot=0260101b, ok=2 fail=0**, exit 0; dòng `boot changed 27c8b1d9 -> 0260101b` (uptime since 2026-11-16 04:45:49) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 05:44:31Z | **ALIVE**, age 0 s, n=39, exit 0 |

Kiểm lại từ đĩa: log probe v2 **109 dòng** — 106 sau T6 đợt 119 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #38 +
dòng `boot changed` + dòng probe #39). **Như R7/S7/T7/T6 (+3):**
lượt này chưa có dòng DEAD nào cho heartbeat #38 nên `status`
ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3 trước khi
đo. Heartbeat **n=39, ts 2026-11-16T05:44:31Z, boot 0260101b-…**;
log vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z 11/11) và
**0 dòng `=== probe end`** — loop v2 chưa từng được start lại kể
từ đợt 88.

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #60: T7 đợt 120 t7-initial-state.md (boot
0260101b #60 tạm 04:45:49Z, dpkg 2 dòng @05:35:40Z, postboot FAIL
try1 05:41Z, headroom 545) + t7-postboot-b60-try1.log (05:41:42Z)
+ t7-headroom-b60-now.log (05:44:05Z) + driver mở đợt 120
(round-in-progress.md mtime 05:37:50Z). **Số thứ tự TẠM THỜI**
(mù #35 chưa đóng, tối đa +24 ẩn danh nghĩa, cộng thêm tối đa
+29 từ mù #37 và +6 từ mù #38 này và +4 từ mù #29/#30/#31 →
"thực tế #60" có thể tới #123; xem §2.2).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #38 (23:45:17Z 15/11 → 05:44:31Z 16/11, 5h59'14")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #39: `uptime -s` = **2026-11-16 04:45:49Z**,
  boot_id `0260101b-acd3-43f4-91d2-670c1960fb7d` — khác boot của
  probe #38 (27c8b1d9).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (05:41Z): chỉ **1 boot**
  (0260101b, first entry 04:46:00Z, last 05:40:04Z). `last -x
  reboot`: chỉ 1 dòng (04:46, still running). wtmp bắt đầu
  04:46:00Z. Journal/wtmp của boot fc62a4b7 đã mất theo reboot
  #60 — như mọi lần trước, chỉ giữ boot hiện tại.
- **dpkg.log KHÔNG còn bracket replay cho boot #60 (mới, khác
  #57):** file `/var/log/dpkg.log` hiện chỉ có **2 dòng, cả hai
  là `2026-11-16 05:35:40 startup packages configure`** — tức
  49'51" SAU boot, không phải replay lúc boot (+2'05" như #57).
  **`/var/log/apt/` KHÔNG TỒN TẠI** (cả thư mục đã mất — đợt 119
  còn 50 Start-Date). T7 đợt 120 xác nhận: watcher poll
  05:45–05:54Z thấy dpkg_lines=2, apt_running=no, không có replay
  nào tới. Không còn nguồn log hệ thống bền nào cho các boot cũ —
  điều tra mù chỉ dựa vào log agent trên đĩa (như đợt 119).
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  lượt này). `btmp` cũng chỉ bắt đầu 04:46:00Z (boot hiện tại).

### 2.2 Ba reboot đã chốt trong mù — #58 (00:53:41Z), #59 (01:47:49Z), #60 (04:45:49Z)

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 58 | **00:53:41Z** (chính xác từng giây, theo `uptime -s` đọc tươi — NHƯNG xem caveat bước nhảy clock dưới) | 27c8b1d9 → 622b3a92 | Chốt từ lượt này: poller T10 đợt 119 RESTART 00:56:04Z đọc `uptime=2026-11-16 00:53:41` tươi + T4 poll-t4.log dòng 193 (ghi 00:58:14Z: "boot cu 27c8b1d9 (btime 23:33:34Z) -> boot moi 622b3a92 (btime 2026-11-16 00:53:41)") + T10 waiter start 00:59:54Z boot=622b3a92 tươi + T10-STATUS.md cập nhật 00:56Z + phase-1 driver start 01:41:05Z boot 622b3a92 + suite log 01:41:05Z–01:45:46Z boot 622b3a92. **Số thứ tự TẠM THỜI.** |
| 59 | **01:47:49Z** (chính xác từng giây) | 622b3a92 → fc62a4b7 | Chốt từ lượt này: poller T10 RESTART 01:54:33Z đọc `uptime=2026-11-16 01:47:49` tươi + gate0-wait boot C start 01:51:11Z đọc `boot=2026-11-16 01:47:49 boot_id=fc62a4b7-…` tươi + T10-STATUS.md cập nhật 01:54Z + phase-1 driver relaunch 01:54:19Z boot fc62a4b7 + O8 driver start 02:14:21Z boot fc62a4b7. **Số thứ tự TẠM THỜI.** |
| 60 | **04:45:49Z** (chính xác từng giây) | fc62a4b7 → 0260101b | Chốt từ lượt này: 3 phép đo `uptime -s` độc lập trên boot mới (05:41:10Z, 05:44:30Z, 06:10:14Z, giống nhau từng giây) + btime 1794804349 + `who -b` 04:46 + boot_id 0260101b + journal first entry 04:46:00Z + wtmp begins 04:46:00Z + `ps` systemd PID 1 START 04:45:59 + probe #39 05:44:31Z boot 0260101b ok=2 fail=0 + dấu boot tươi sibling đợt 120 (T7 initial-state + postboot try1 + headroom, driver mở đợt 05:37:50Z). **Số thứ tự TẠM THỜI.** |

**Clock:** F_now ≈ 0 (`date -u` 05:41:26Z vs HTTP `Date`
example.com 05:41:26Z, google.com 05:41:26Z, cloudflare.com
05:41:27Z — khớp trong 0–1 s). F57 ≈ 0 (đã kiểm 23:41Z đợt
119). **F58/F59/F60 KHÔNG BIẾT ĐẦY ĐỦ** — và lượt này CHỨNG
MINH được có bước nhảy tại #58 (xem dưới); F59/F60 không có
kiểm HTTP Date nào trong các boot đó. Mọi gap trong mù #38 đều
là hiệu số đồng hồ VM cho tới khi chứng minh F ổn định (xem
caveat §2.5).

**BƯỚC NHẢY CLOCK TẠI #58 (mới — bằng chứng trực tiếp):**
- Poller T10 đợt 119 run 1 là 1 tiến trình duy nhất (kiểm bằng
  code poll119-t10.sh: echo poll rồi `sleep 300`): START
  23:49:12Z boot 27c8b1d9; 14 poll #1–#14, đúng số thứ tự, đúng
  300/301 s mỗi bước (23:49:12Z → 00:54:13Z — tính lại bằng
  datetime đầy đủ, xem §4 mục 1).
- Poll **#14 ghi lúc 00:54:13Z** — tức là tiến trình poller còn
  sống và ghi log ở 00:54:13Z theo đồng hồ lúc đó. Nhưng btime
  của boot kế tiếp #58 là **00:53:41Z**. Một tiến trình không thể
  sống sau reboot 32 giây. Kết luận duy nhất: **đồng hồ đã bước
  lùi tại reboot #58**.
- Cận của bước nhảy X (lùi, theo đồng hồ trước reboot so với sau):
  - Cận dưới: **X ≥ 32 s** (00:54:13 − 00:53:41).
  - Cận trên: **X ≤ 332 s** (poll #15 due ~00:59:13Z không bao
    giờ ghi — nếu reboot (theo đồng hồ trước) muộn hơn 00:59:13Z
    thì poll #15 đã ghi; giả định cadence 300 s giữ, như 13 bước
    trước đó).
  - Vậy **X ∈ [32, 332] s**. True gap #57→#58 = 4807 + X ∈
    [4839, 5139] s theo giả thuyết (a) dưới.
- **Hai giả thuyết (chỉ (a) là chính; (d) là dự phòng không loại
  được):**
  - (a) **Bước nhảy NGAY tại reboot #58** — tiền lệ đã có (#54,
    bài học "giây nháy"): đồng hồ trước reboot ≈ giờ thật, đồng
    hồ sau reboot lùi X. Gap thật #57→#58 = 4807 + X.
  - (b→d) **Bước nhảy xảy ra TRƯỚC reboot, trong cửa sổ
    (23:45:17Z, 23:45:57Z]** — 40 giây duy nhất chưa bị loại:
    T4 poll5m các bước đều đúng 300 s trong 23:45:57Z →
    00:50:59Z (loại nhảy trong cửa sổ đó); gate0-wait các bước
    ~120 s trong 23:45:58Z → 01:46:46Z (loại nhảy trong cửa sổ
    đó); tuổi probe #38 lúc T6-119 `status` khớp đúng từng giây
    43.527 s (loại nhảy trong (23:41:36Z, 23:45:17Z]). Nếu (d)
    đúng thì btime #58 là giờ thật và gap #57→#58 = 4807 s đúng
    từng giây. Cửa sổ 40 s này không còn dấu vết nào khác để
    kiểm — T5 không tự chọn (d) vì tiền lệ bước nhảy tại reboot
    mạnh hơn hẳn một bước nhảy NTP 32 s+ trong 40 s ngẫu nhiên.
- **Khoảng gap dùng cho thống kê bao cả hai giả thuyết:
  [4807, 5139] s, mid 4973 s** (xem §2.5). Độ nhạy: LO/HI chỉ
  làm mean CERT/FULL lệch ±5 s.
- **Không có dấu nhảy clock tại #59:** poller run 2 không có poll
  nào ghi sau btime 01:47:49Z (poll cuối #11 01:46:05Z); O8-WebKit
  exit 01:47:08Z trên boot #58, 41 s trước #59; gate0-wait #25
  01:46:46Z trên boot #58, 63 s trước #59. Không có dòng O8-style
  nào bắc qua #59.
- **Không có dấu nhảy clock tại #60:** btime 04:45:49Z nhất quán
  với journal first entry 04:46:00Z (+11 s, bình thường), wtmp
  04:46:00Z, systemd PID 1 04:45:59; không có poll nào ghi sau
  btime trên boot cũ (lỗ mtime 02:41:59Z → 04:45:49Z là máy yên,
  không phải clock).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #57→#58 = **KHOẢNG [1h20'07", 1h25'39"]** ([4807, 5139] s,
  mid 1h22'53" = 4973 s) — ĐƯỢC CHỨNG NHẬN (xem §2.5).
- Gap #58→#59 = **54'08"** (3.248 s) — ĐƯỢC CHỨNG NHẬN (xem §2.5).
- Gap #59→#60 = **2h58'00"** (10.680 s) — CHỈ LÀ SPAN (đoạn G mở),
  KHÔNG chứng nhận, KHÔNG vào FULL.
- Span #58→#60 (trực tiếp, chứa #59) = **3h52'08"** (13.928 s) —
  không phải một gap, chỉ ghi làm span.
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):** #58 từ
  #57: [23:52:41Z, 02:47:42Z] — #58 thật 00:53:41Z NẰM TRONG (kể cả
  với bước nhảy X ≤ 332 s); #59 từ #58: [01:12:48Z, 04:07:49Z] —
  #59 thật 01:47:49Z NẰM TRONG; #60 từ #59: [02:06:56Z, 05:01:57Z]
  — #60 thật 04:45:49Z NẰM TRONG (span, không phải gap); #61 từ
  #60 (p10–p90 FULL48): [05:35:21Z, 07:48:08Z]; hiệu dụng sau
  probe #39: [05:44:31Z, 07:59:57Z].

### 2.3 Hoạt động trong khoảng mù — vì sao E + F + H đóng, G mở

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **21 file** +
hidden_files **400 file**; **421 file, 415 mốc giây phân biệt**
(theo cách đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 19/P6 §4 mục 20/Q6
§4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/T6 đợt 118 §2.3/T6 đợt
119 §2.3). Chia mù làm bốn đoạn bởi #58 (00:53:41Z), #59
(01:47:49Z), #60 (04:45:49Z):

- **Đoạn E: 23:45:17Z → 00:53:41Z (1h08'24", boot #57 27c8b1d9) —
  ĐÓNG bằng đo uptime tại probe #38 + poller T10 run 1 + T4 poll5m
  + gate0-wait + session bắc qua cắt sàn + sàn đuôi:**
  - Probe #38 (23:45:17Z) đo uptime chứng minh up liên tục từ
    23:33:34Z tới 23:45:17Z — đóng tới 23:45:17Z (đầu đoạn = giờ
    probe, 0 s).
  - **Poller T10 run 1 là 1 tiến trình duy nhất (kiểm bằng code):**
    START 23:49:12Z boot 27c8b1d9; 14 poll #1–#14, đúng số thứ
    tự, đúng 300/301 s mỗi bước (23:49:12Z → 00:54:13Z — tính
    lại bằng datetime đầy đủ, xem §4 mục 1); script không có cơ
    chế restart. Đóng (23:49:12Z, 00:54:13Z] theo đồng hồ ghi.
  - **T4 poll5m (observer độc lập thứ hai):** 31 poll tổng cộng
    đợt 119; trong đoạn E: 23:45:57Z → 00:50:59Z, các bước
    300/301 s; bước 435 s 00:50:59Z → 00:58:14Z là restart sau
    #58, không phải clock step.
  - **Gate0-wait (observer độc lập thứ ba):** start 23:45:57Z
    boot=23:33:34 boot_id=27c8b1d9 tươi; các poll #1–#7 cách nhau
    ~120 s tới 23:58:02Z; STALE-LOCK-CHECK + gate0 try 1 lúc
    00:06:56Z, 00:18:05Z, 00:28:35Z, 00:39:03Z, 00:50:29Z — đều
    đọc boot=23:33:34 tươi.
  - **T4 attempt5 gateA poll 4 lúc 00:53:31Z** (poll-t4.log dòng
    193, ghi hồi tưởng lúc restart 00:58:14Z) — tiến trình sống
    trên boot #57 10 s trước btime #58.
  - **2 session bắc qua cắt sàn E-hi (00:34:34Z):** birth
    00:28:20Z, mtime 00:46:14Z (proc_8e72555a4d19.log); birth
    00:30:42Z, mtime 00:38:40Z (proc_b8f0ebdf7f9d.log).
  - Đuôi: mốc quan sát cuối trước #58 là poll #14 00:54:13Z
    (theo đồng hồ trước reboot) — cửa sổ (00:54:13Z,
    ~00:59:13Z] ≤ 300 s < sàn 19'07" theo cả hai giả thuyết
    (a)/(d) (xem §2.2). Mật độ mtime củng cố (237 mốc, lỗ lớn
    nhất chỉ 496 s) nhưng không dùng để đóng.
  - **Kết luận đoạn E: ĐÓNG.**
- **Đoạn F: 00:53:41Z → 01:47:49Z (54'08", boot #58 622b3a92) —
  ĐÓNG bằng poller T10 run 2 + T4 poll5m + gate0-wait + suite/O8
  + session bắc qua cắt sàn:**
  - **Poller T10 run 2 là 1 tiến trình duy nhất (kiểm bằng code):**
    START 00:56:04Z boot 622b3a92 (RESTART sau #58, uptime tươi);
    11 poll #1–#11, đúng số thứ tự, đúng 300/301 s mỗi bước
    (00:56:04Z → 01:46:05Z).
  - **T4 poll5m:** 00:58:14Z → 01:43:16Z (sau restart), các bước
    300/301 s.
  - **Gate0-wait #22–#25:** 01:40:43Z → 01:46:46Z, cách nhau
    ~120 s, trên boot #58.
  - **Phase-1 driver start 01:41:05Z + suite 27/27
    01:41:05Z–01:45:46Z + O8 driver start 01:45:46Z + O8-WebKit
    exit 01:47:08Z** — mốc cuối cùng trước #59 chỉ 41 s.
  - **T10 waiter start 00:59:54Z boot=622b3a92 tươi** (đọc boot
    mới 6'13" sau #58).
  - **3 session bắc qua cắt F-lo (01:12:48Z)** (birth 01:01:04Z
    → mtime 01:18:57Z; 01:11:06Z → 01:19:00Z; 01:00:50Z →
    01:45:52Z); **2 session bắc qua cắt F-hi (01:28:42Z)**
    (01:21:25Z → 01:29:15Z; 01:00:50Z → 01:45:52Z).
  - Đầu: #58 00:53:41Z → observer đầu tiên 00:56:04Z = 143 s <
    sàn. Đuôi: observer cuối 01:47:08Z → #59 01:47:49Z = 41 s <
    sàn. Mật độ mtime củng cố (96 mốc, lỗ lớn nhất 904 s) nhưng
    không dùng để đóng.
  - **Kết luận đoạn F: ĐÓNG.**
- **Đoạn G: 01:47:49Z → 04:45:49Z (2h58'00", boot #59 fc62a4b7) —
  KHÔNG ĐÓNG: lỗ (02:41:59Z, 04:45:49Z] 2h03'49" (7.429 s):**
  - Phủ tới 02:41:59Z: poller T10 run 3 polls #1–#8
    01:54:33Z → 02:29:33Z, ALL 9 DONE 02:29:33Z; T4 poll5m tới
    02:16:11Z; gate0-wait boot C tới 02:19:16Z (#15); parent đóng
    đợt 119: session exec birth 01:55:26Z, mtime 02:27:26Z
    (proc_e24e39643c31.log — chạy tsc + vite build, nhắc cả hai
    boot 622b3a92 và fc62a4b7); LIMITS gộp mtime 02:41:46Z +
    PHASE9_GAP_ANALYSIS.md edit 02:41:59Z (mốc cuối cùng) +
    proactivity prepared.md 02:41:57Z (mtime-only, boot ID trong
    đó là trích dẫn từ log, không phải đọc tươi — đã kiểm nội
    dung theo bài học T6-119 §4 mục 1).
  - **2 session bắc qua cắt G-lo (02:06:56Z)** (02:03:05Z →
    02:10:04Z; 01:55:26Z → 02:27:26Z) — nhưng **0 session bắc
    qua cắt G-hi (04:26:42Z)** và **0 session chạm vùng lỗ
    (02:41:59Z, 04:45:49Z]**.
  - **Sau 02:41:59Z: KHÔNG CÒN GÌ cho tới #60 04:45:49Z.** 0 file
    exec-log nào sinh hay ghi trong (02:41:59Z, 04:45:49Z]; 0
    file trong cả 3 phạm vi (repo-1, hidden_files, ngoài hai
    cây — 118 file ngoài cây đều nằm ngoài lỗ) và 0 file /tmp
    trong lỗ; lượt cron 09:35 +07 (02:35Z) bỏ qua theo chốt chặn
    nên không để lại mẫu nào (đúng như T6-119 §4 mục 9 đã cảnh
    báo — đề xuất standing check vẫn chờ parent duyệt).
  - Lỗ 7.429 s; tối đa ẩn danh nghĩa = ⌊7.429/1.147⌋ = **6**.
  - **Kết luận đoạn G: KHÔNG ĐÓNG.** (Prereg §2 đã dự báo đúng
    ít nhất 1 gap không đủ điều kiện chứng nhận.)
- **Đoạn H: 04:45:49Z → 05:44:31Z (58'42", boot #60 0260101b) —
  ĐÓNG bằng đo uptime trực tiếp + probe #39 + dấu boot tươi:**
  - **`uptime -s` ×3 lúc 05:41:10Z, 05:44:30Z, 06:10:14Z =
    04:45:49Z** chứng minh máy up liên tục từ #60 tới lúc đo;
    probe #39 05:44:31Z đọc boot_id 0260101b tươi — cùng boot_id
    với boot bắt đầu 04:45:49Z. (Nguyên tắc như P6 §2.3 đoạn C
    mù #31, Q6 §4 mục 21, T6-119 §2.3 đoạn D.)
  - **Chuỗi dấu boot tươi củng cố:** T7 initial-state (boot
    0260101b #60 tạm 04:45:49Z, headroom 545) +
    t7-postboot-b60-try1.log 05:41:42Z + t7-headroom-b60-now.log
    05:44:05Z + driver mở đợt 120 (round-in-progress.md mtime
    05:37:50Z) + 8 session đợt 120 trong vùng H (05:41:34Z →
    05:44:03Z).
  - Lỗ mtime (04:45:49Z → 05:37:50Z] 3.121 s là máy yên, không
    observer — nhưng uptime đóng đoạn này, không cần mtime
    (như T6-119 đoạn D: uptime trực tiếp là closer, mtime chỉ
    củng cố).
  - **Kết luận đoạn H: ĐÓNG.**

**Kết luận trung thực: khoảng mù #38 KHÔNG ĐÓNG HOÀN TOÀN.** Đoạn
E + F + H đóng; đoạn G mở (1 cửa sổ mở, 2h03'49"); 3 reboot đã
chốt giờ (#58 00:53:41Z, #59 01:47:49Z, #60 04:45:49Z — cả ba
chính xác từng giây trên đĩa, KHÔNG như #56 đợt trước) + tối đa
**6 ẩn danh nghĩa** (đoạn G). Số thứ tự #58/#59/#60 vẫn TẠM THỜI.

### 2.4 Quét sóng EPERM trong mù #38 — 0 sóng thật (bằng chứng âm tính)

Quét toàn bộ file *.log có mtime trong mù #38 (bằng script
eperm-sweep.py; eperm-sweep*.log của chính mình bị loại theo bài
học T7 §4 mục 19):

| Phạm vi quét | "vẫn bật" | "CẢNH BÁO 10 phút" | "Operation not permitted" | "sóng EPERM đã tắt" |
|---|---|---|---|---|
| repo-1 (0 file) | 0 | 0 | 0 | 0 |
| hidden_files (116 file) | 0 | 0 | 0 | **5** (dương tính giả đã biết, xem dưới) |
| **Tổng 116 file** | **0** | **0** | **0** | **5 FP** |

5 dòng "đã tắt" đều là dương tính giả launcher đã biết — không
phải sóng thật:
- 1× run-t2.log (23:58:04Z — T2 đợt 119 launcher, dòng "sóng
  EPERM đã tắt, khởi động vite").
- 4× t10-o8.log (01:46:02Z, 01:46:58Z, 02:14:22Z, 02:15:22Z —
  T10 đợt 119 O8 driver launcher, cùng mẫu).

Quét mở rộng `/eperm|not permitted/i`: 34 match thô / 29 dòng
duy nhất — 16 dòng recount oversize tên file LIMITS EPERM
(t10-phase1-driver.log ×8 + recount-push119.log ×8) + 6 dòng
test-pass hasEperm trong round119-t10-suites.log (test tự kiểm
"not permitted" như kết quả mong đợi) + 2 dòng recount tên batch
phase9-round119-t6-eperm.txt + 5 dòng launcher trên. **0 sóng
EPERM thật.**

- Sóng gần nhất vẫn là **~11:55–12:11Z 15/11** (R7 đợt 115) —
  **~113h33'** trước probe #39 (05:44:31Z).
- EPERM **không** được tuyên bố là đã hết — như R7/S7/T7/T6: 1 lượt
  không sóng = bằng chứng âm tính cho lượt đó, không phải kết luận
  hệ thống.

### 2.5 Phân phối gap — CERT n=33, FULL n=48 (mới: +2 gap từ mù #38)

**Gap #57→#58 = KHOẢNG [1h20'07", 1h25'39"] ([4807, 5139] s)
ĐƯỢC CHỨNG NHẬN (mid 4973 s dùng cho thống kê, theo quy ước
T6-118 cho gap khoảng).** Điều kiện: đoạn E mù #38 đã đóng (xem
§2.3). **CAVEAT (mới, đứng):** bước nhảy clock tại #58, X ∈
[32, 332] s — đầu mút dưới 4807 s ứng với giả thuyết (d) (nhảy
trước khi poller start), [4839, 5139] s ứng với giả thuyết (a)
(nhảy ngay tại reboot, được ưu tiên theo tiền lệ #54). Độ nhạy
thống kê: LO/HI chỉ làm mean lệch ±5 s (xem dưới). Nếu sau này
chứng minh được (d) đúng thì gap này thu về điểm 4807 s; nếu
chứng minh được X chính xác thì thu về điểm 4807+X.

**Gap #58→#59 = 54'08" (3.248 s) ĐƯỢC CHỨNG NHẬN (điểm).** Điều
kiện: đoạn F mù #38 đóng (xem §2.3). **CAVEAT (đứng, như mọi gap
trước #54 và #54→#55):** F59 CHƯA ĐƯỢC KIỂM — không có kiểm HTTP
Date và không có neo clock xuyên-boot nào trong boot #59. Bước
nhảy tại #58 KHÔNG ảnh hưởng gap này (cả hai đầu đều trên đồng
hồ sau bước nhảy, ổn định suốt run 2 — các bước đều 300/301 s,
không có slew ≥1 s/bước trong 00:56:04Z → 01:46:05Z). Không tìm
thấy bằng chứng nhảy clock tại #59 (không có poll nào ghi sau
btime 01:47:49Z; O8 exit 01:47:08Z đi trước). Nếu sau này chứng
minh được nhảy clock tại #59 thì gap này trở thành khoảng như
#53→#54. Nếu parent không chấp nhận chứng nhận điểm khi F chưa
kiểm thì hạ gap này về cận trên, CERT về n=32 (và FULL về n=47).

**Gap #59→#60 = 2h58'00" (10.680 s) CHỈ LÀ SPAN — KHÔNG đưa vào
FULL/CERT** — đoạn G mù #38 mở (lỗ 7.429 s, tối đa 6 ẩn). Cùng
luật như #55→#56 / #56→#57 (T6-119 §2.5) và span #55→#57
(38.498 s, T6-119 §2.2).

**Cross-check tái hiện T6(119) 100%:** chạy blind37-gaps.py
verbatim cho lại đúng CERT n=31 / FULL n=46 của T6 đợt 119 (xem
blind38-gaps.txt).

Bảng so sánh (CERT = gap đơn/khoảng đã chứng nhận, thống kê dùng
mid; FULL = CERT + gap chưa chứng nhận + gap khoảng):

| | CERT n=31 (T6-119) | **CERT n=33 (T5-120)** | FULL n=46 (T6-119) | **FULL n=48 (T5-120)** |
|---|---|---|---|---|
| mean | 1h51'15" | **1h48'39"** | 1h56'13" | **1h54'14"** |
| median | 1h59'46" | **1h58'47"** | 1h59'16" | **1h58'30"** |
| p10 | 1h08'24" | **0h56'59"** | 0h49'14" | **0h49'32"** |
| p90 | 2h27'07" | **2h26'32"** | 3h02'58" | **3h02'19"** |
| sd | 0h40'37" | **0h40'49"** | 0h57'25" | **0h57'05"** |
| min | 19'07" | **19'07"** | 19'07" | **19'07"** |
| max | 3h14'08" | **3h14'08"** | 5h43'18" | **5h43'18"** |

- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (cả hai gap mới
  đều nằm giữa; gap #58→#59 = 54'08" là gap đã chứng nhận ngắn
  thứ hai sau sàn 19'07").
- **Độ nhạy đầu mút #57→#58:** CERT33-LO (4807 s) mean 1h48'34";
  CERT33-HI (5139 s) mean 1h48'44" — lệch ±5 s so với mid; median
  và p10/p90 không đổi. FULL48-LO mean 1h54'10"; FULL48-HI mean
  1h54'17".
- **Tốc độ reboot (đồng hồ ghi nhận):** 60 / 128,46 h = **1 reboot
  mỗi 128,5 phút** (từ #1 2026-11-11T02:00:00Z tới #60
  2026-11-16T04:45:49Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 64 / 128,46 h = **1 mỗi 120,4 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29) và mù #38
  đoạn G (+6).
- **Phân phối FULL48:** 26/48 trong 90–150 phút; 7 gap <60 phút
  (tăng 1 — gap #58→#59 mới); 6 gap >180 phút; 2 gap >240 phút.
  Gap #58→#59 (54'08") nằm dưới khối chính nhưng trong dải; gap
  #57→#58 mid (1h22'53") nằm trong khối chính 90–150 phút, không
  phải outlier.

### 2.6 Trạng thái các mù cũ — KHÔNG ĐỔI (chỉ ghi nhận, không thử lại)

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | Mới, lượt này (§2.3); probe #40 đợt sau tiếp tục |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại lượt này |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 §2.3 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#60 vẫn TẠM THỜI vì mù này |
| #34 | ĐÓNG HOÀN TOÀN | S7 §2.3; parent đã chấp nhận — QUYẾT PARENT 7 đợt 117 |
| #33 | ĐÓNG HOÀN TOÀN | R7 §2.3 |
| #32 | ĐÓNG HOÀN TOÀN | Q6 §2.3 |
| #31 | KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG THỬ LẠI LƯỢT NÀY | 1 cửa sổ mở 8'55"; 2 reboot đã chốt + tối đa 1 ẩn |
| #30 | KHÔNG ĐÓNG HOÀN TOÀN | 3 cửa sổ mở, tổng 30'50"; 2 reboot đã chốt + tối đa 2 ẩn |
| #29 | KHÔNG ĐÓNG HOÀN TOÀN | Khe 79 s không loại trừ được; 2 reboot đã chốt + tối đa 1 ẩn |
| #28 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ 23'39", khe 4'32" không loại trừ được; 2 reboot đã chốt + tối đa 1 ẩn |
| #26 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ 1h13'58" có thể chứa thêm reboot |
| #24 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ 2h03'11" có thể chứa thêm reboot |
| #22 | ĐÃ ĐÓNG — MỨC TIN CẬY HẠ | Cửa sổ lý thuyết ≤78 s với sàn 19'07"; chờ parent/user quyết |
| #21 | CHƯA ĐÓNG HOÀN TOÀN | Lỗ ~17'23" có thể chứa đúng 1 reboot trung gian |

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 26 — chênh 0 (lần thứ 26 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T6 trong round119-t6, đổi OUT sang
  round120-t5) **06:05:49Z → 06:06:29Z 16/11 (40 s, có SCAN-END)**.
- NEWSTD: **774 dòng / 212 file** (phạm vi 2.931 file); R7b đối
  chiếu: **799 dòng / 229 file** (phạm vi 12.324 file); copies:
  **25 dòng / 17 file** — y hệt lần 25. Đối chiếu chéo:
  774+25=799=R7b, **chênh 0**.
- **+4 dòng / +1 file so với lần 25** (770/211 → 774/212), giải
  thích đúng hết bằng diff (kiểm bằng đếm lại trực tiếp + mtime —
  file này về trước lúc scan bắt đầu 06:05:49Z 16/11):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND119_T6_EPERM_LIMITS.md | +4 | 00:16:42Z 16/11 | Tài liệu T6 đợt 119 (chính nó nhắc `writeFileSync` 4 lần); viết sau scan lần 25 (00:03:09Z) nên lần này mới vào |
- Phạm vi: 2.931 = 2.917 + 14 net / −0 (14 file mới, 0 file mất:
  2 probe/benchmark T3 đợt 120 + 8 LIMITS đợt 119 (gộp + T1–T6/T8)
  + 4 LIMITS đợt 120 (T2, T6, T7, T9 — sibling đã stage)).
  **0 file mất hit.**
- **Kết luận: 26 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #38.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 2 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md, không tính dist): vẫn đúng 2 helper đã biết — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 không đổi; dist nằm
    ngoài phạm vi quét WFS nên không làm lệch số đếm.
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #38.

## 3. RAM trong mù #38 — max 4.796 MB (78% guard), birefnet KHÔNG chạy

- **2 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #38 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 06:05:13Z | **1.320.800 kB** | Lúc scan WFS |
  | 06:10:14Z | **555.120 kB** | Trước khi viết LIMITS |
- **Max RAM biết được TRONG mù #38 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 223 mẫu RAM; **max 4.796 MB**
  (T4 poll5m, 23:55:57Z, đoạn E) = **78% ngưỡng guard** — thấp
  hơn mù #37 (4.811 MB) 15 MB, vẫn là mức cao thứ hai từng thấy
  trong một mù; đoạn F max **4.025 MB** (01:24:41Z); đoạn G max
  **1.634 MB** (T4 poll5m, 01:48:16Z — ngay sau #59, rồi máy yên);
  đoạn H **không có mẫu nào** (máy yên, không observer ghi RAM).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 4,80 GB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Chỉ thử lại khi RAM đổi (xem §5 mục 7).

## 4. Ghi chú phương pháp (mới so với T6 đợt 119)

1. **Lỗi tính bước qua nửa đêm (mới, đã sửa trong lượt):** bản đầu
   của blind38-investigate.py tính bước poller bằng HH:MM:SS
   trong ngày nên bước 23:59:12Z → 00:04:12Z ra −86.100 s. Tính
   lại bằng datetime đầy đủ: 13 bước run 1 đều 300/301 s. Bài học:
   mọi phép tính bước qua nửa đêm phải dùng datetime đầy đủ, không
   dùng giờ-trong-ngày.
2. **Bước nhảy clock tại #58 — phát hiện bằng mâu thuẫn nội bộ
   (mới, §2.2):** poll #14 (00:54:13Z) vs btime #58 (00:53:41Z).
   T10-STATUS.md ghi "poller dừng ở poll #14" mà không nhận ra
   mâu thuẫn giờ — bài học: khi ghi "poller dừng ở poll #N" phải
   đối chiếu giờ poll cuối với btime của boot kế tiếp. Cận X dùng
   cadence poller (poll #15 due) + các bước T4/gate0-wait để loại
   các cửa sổ nhảy khác.
3. **Grep NỘI DUNG exec-log theo boot_id (kế thừa T6-119 §4 mục
   1):** 55 exec-log sinh/ghi trong mù #38; boot 27c8b1d9 nhắc
   trong 13 file, 622b3a92 trong 5, fc62a4b7 trong 4, 0260101b
   trong 1. Đọc nội dung từng file tiêu biểu để phân loại đọc
   tươi vs trích dẫn: T10 waiter start 00:59:54Z boot=622b3a92
   tươi; gate0-wait boot C start 01:51:11Z boot=01:47:49
   boot_id=fc62a4b7 tươi; gate0-wait #25 01:46:46Z trên boot #58
   (63 s trước #59); session proc_f3dd45096b6d 00:52:44Z log
   TRỐNG — chỉ là mốc tiến trình, không pin boot.
4. **0 file trong lỗ đoạn G ở cả 3 phạm vi + /tmp:** ngoài hai cây
   có 118 file mtime trong mù #38 nhưng KHÔNG file nào nằm trong
   (02:41:59Z, 04:45:49Z]; /tmp có 0 file trong toàn bộ mù #38.
   Sự im lặng 2h03'49" là toàn diện, không chỉ trong hai cây.
5. **HTTP Date standing check giữ làm check đứng mỗi lượt:**
   F_now ≈ 0 (3 server, khớp 0–1 s lúc 05:41:26Z).
6. **dpkg.log + /var/log/apt/ đã mất hoàn toàn dạng replay:**
   dpkg chỉ còn 2 dòng @05:35:40Z (lúc driver mở đợt 120), thư
   mục apt không tồn tại — không còn bracket replay cho boot #60
   (khác #57 có bracket (0, 2'05"]). T7 đợt 120 xác nhận độc lập
   (watcher dpkg_lines=2, apt_running=no; postboot FAIL try1).
7. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo boot #60 ĐÚNG (0260101b, 04:45:49Z); dự báo "ít
   nhất 1 trong 3 gap KHÔNG đủ điều kiện chứng nhận" ĐÚNG
   (#59→#60 chỉ là span); dự báo EPERM 0 sóng ĐÚNG; dự báo WFS
   chênh 0 ĐÚNG; dự báo RAM max < 4,81 MB ĐÚNG (4.796 MB) — không
   sửa sau khi thấy số. (Prereg dự báo giờ #59 "~01:47:49Z" cần
   kiểm nguồn gốc — đã kiểm: 01:47:49Z CÓ giây chính xác trên đĩa
   từ 2 lần đọc tươi độc lập, không phải ước lượng như #56.)
8. **Kiểm lại boot trước khi viết LIMITS (06:10:14Z):** vẫn
   0260101b, uptime-s 04:45:49Z — không reboot mới trong lúc làm
   việc.
9. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard). **Không đụng cloud/collab/AI model
   đóng/nhạc bản quyền.**
10. **Stage batch:** chỉ 1 file text (LIMITS doc này),
    NUL-delimited, verify read-back (xem checkpoint3.txt + stage
    file).
11. **Ghi rõ:** số thứ tự reboot #47–#60 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
12. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat bước nhảy #58 vào hồ sơ (xem §2.5).
13. **Cross-check tái hiện T6(119) 100%** (CERT n=31 / FULL n=46)
    trước khi tính số mới — chạy blind37-gaps.py verbatim qua exec.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #38 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** đoạn E + F + H đóng; đoạn G mở (02:41:59Z,
   04:45:49Z], tối đa 6 ẩn. 3 reboot đã chốt (#58 00:53:41Z, #59
   01:47:49Z, #60 04:45:49Z) + tối đa 6 ẩn danh nghĩa. Probe #40
   đợt sau tiếp tục. **Cần parent quyết:** có chấp nhận để mù #38
   mở như mù #35/#37 hay giao luồng điều tra thêm — T5 khuyến nghị
   ĐỂ MỞ (không còn nguồn nào để đóng G: 0 exec-log, 0 session,
   0 file /tmp trong lỗ; chỉ còn cách chờ parent cung cấp bằng
   chứng nếu có — ví dụ output `uptime -s` lúc đóng đợt 119).
2. **Bước nhảy clock tại #58 (mới, §2.2):** X ∈ [32, 332] s, giả
   thuyết chính (a) nhảy ngay tại reboot. **Cần parent biết:**
   gap #57→#58 chỉ còn là khoảng [4807, 5139] s (mid 4973 s);
   nếu parent có bằng chứng độc lập về giờ thật của #58 (ví dụ
   log bên ngoài VM) thì T5 đợt sau chạy lại số. T5 khuyến nghị
   thêm **standing check mới: mỗi lượt EPERM đối chiếu giờ poll
   cuối của poller với btime boot kế tiếp** (phát hiện bước nhảy
   sớm, như mục §4.2) — cần parent duyệt vì đây là thay đổi quy
   trình chung.
3. **Gap #58→#59 = 54'08" ĐƯỢC CHỨNG NHẬN (mới — xem §2.5,
   CERT n=33, FULL n=48; caveat F59 chưa kiểm).** Cần parent xác
   nhận cách chứng nhận điểm khi F chưa kiểm (như đã làm với
   #54→#55); nếu không đồng ý thì hạ gap này về cận trên, CERT
   về n=32 (FULL về n=47).
4. **Đề xuất standing check (cần parent duyệt, nhắc lại từ
   T6-119 §5 mục 4):** lượt cron BỎ QUA (vì chốt chặn) ghi thêm
   boot_id + `uptime -s` vào build-loop-log — lượt 09:35 đã chạy
   lúc 02:35Z, ngay trước lỗ đoạn G; nếu lúc đó có ghi boot thì
   đoạn G đã hẹp hơn nhiều. T5 KHÔNG tự đổi hành vi cron — chờ
   parent duyệt.
5. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
   --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
   117, chưa trả lời). Watcher này sẽ lấp đúng loại lỗ như đoạn
   G của mù #38.
6. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
   parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
   117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
7. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi**
   (u2net là fallback chính thức). Max RAM trong mù #38 là
   4,80 GB (78% guard).
8. **EPERM không tuyên bố đã hết** (sóng gần nhất ~113h33'
   trước probe #39). **Không kiểm lại TTS 39** (cấm).
   ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
   #31/#35 chờ user quyết** (không tự quyết).
