# PHASE9 ROUND121 T4 — EPERM: probe #40 + mù #39 (I ĐÓNG, J MỞ, K ĐÓNG) + mù #38 G VẪN MỞ (thử cuối) + BƯỚC NHẢY CLOCK tại #63

> Luồng T4, đợt 121 vòng lặp Phase 9 VCut Studio (lượt cron 15:35 +07,
> 16/11/2026; làm việc 08:39Z → 09:0xZ 16/11/2026).
> Nhiệm vụ: probe #40 + mù #38 thử đóng lần cuối + mù #39 + quét sóng
> EPERM + quét writeFileSync lần thứ 27 + ghi RAM (birefnet: KHÔNG
> chạy — vẫn dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round121-t4/prereg-t4.md (định nghĩa probe #40, mốc đối
> chiếu, tiêu chí đóng mù #39, dự báo đoạn J KHÔNG đóng).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #37, #35, #31, #30, #29, #28,
> #26, #24, #21, hay reboot #16** — chỉ báo cáo "không thấy" vs "không
> có". Mù #38 đoạn G thử đóng LẦN CUỐI lượt này (theo brief T4) —
> vẫn mở, không thử lại nữa. G1 + mù #22/#28/#29/#30/#31/#35 chờ user
> quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (08:40Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.574 s, last #39 05:44:31Z, boot
  0260101b, exit 1); `once` ngay sau đó là **probe #40, boot
  9788ce28, ok=2 fail=0**, exit 0, 08:40:45Z; `status` chạy lại
  **ALIVE** (age 0 s, n=40), exit 0. Log v2 tăng đúng **3 dòng**
  (109 → 112) — **như R7/S7/T7/T6/T5 (+3)**; prereg §1 đã dự báo đúng
  +3 trước khi đo. Heartbeat nay n=40, ts 08:40:45Z, boot 9788ce28.
- **Boot #62 (tạm) lúc 08:25:47Z, boot
  `9788ce28-c334-40f4-bc21-e93d298b0f9b`** — xác minh bằng `uptime -s`
  + btime 1794817547 + `who -b` + journal 1 boot + wtmp +
  `ps` systemd PID 1 START 08:25:57 (xem §1). Clock VM hiện tại CHÍNH
  XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u`
  trong 0–1 s) → **F_now ≈ 0**.
- **PHÁT HIỆN MỚI — BƯỚC NHẢY CLOCK TẠI REBOOT #63 (xem §2.2):**
  scan WFS của T4 (1 tiến trình duy nhất) ghi SCAN-END **08:53:11Z
  trên boot #62**, nhưng btime của boot mới #63 là **08:53:05Z** —
  một tiến trình sống đã ghi log **6 giây SAU giờ boot của boot kế
  tiếp**. Đồng hồ đã bước LÙI tại #63 một lượng X ∈ **[6, 195] giây**
  (cận trên: poll #4 của poller T10 đợt 121 due 08:56:20Z không bao
  giờ ghi). Đây là lần thứ ba chứng minh được nhảy clock tại một
  reboot trên VM này (lần 1: #54, lần 2: #58). Reboot #63 KHÔNG ảnh
  hưởng mù #39 (kết thúc ở probe #40 08:40:45Z) và KHÔNG làm mất
  hiệu lực scan WFS #27 (chạy xong 08:52:51–08:53:11Z trên boot
  #62). Gap #62→#63 danh nghĩa 27'18" (1.638 s) thành **KHOẢNG
  [1.638, 1.833] s** — KHÔNG chứng nhận, thuộc mù #40, luồng EPERM
  đợt sau (probe #41) phân tích.
- **Khoảng mù #39: 05:44:31Z → 08:40:45Z (2h56'14") — KHÔNG ĐÓNG
  HOÀN TOÀN (mới, lượt này).** Đoạn I **ĐÓNG** (probe #39 uptime +
  poller T10 run 1 + T7 watcher 60 poll + T4 gate0-wait 30 poll +
  5 session bắc qua cắt I-lo + 5 session bắc qua cắt I-hi + đầu
  123 s + đuôi 102 s < sàn); đoạn J **KHÔNG ĐÓNG** (đuôi
  (07:37:47Z, 08:25:47Z] 2.880 s, 0 session bắc qua cắt J-hi,
  0 session chạm đuôi, 0 file trong cả 3 phạm vi + /tmp trong đuôi,
  tối đa 2 ẩn danh nghĩa); đoạn K **ĐÓNG** (uptime trực tiếp lúc
  probe #40 + dấu boot tươi sibling đợt 121). **2 reboot đã chốt
  trong mù (#61 06:50:58Z, #62 08:25:47Z — cả hai đều có giây chính
  xác trên đĩa) + tối đa 2 ẩn danh nghĩa (đuôi đoạn J).**
- **Gap #60→#61 = 2h05'09" (7.509 s) ĐƯỢC CHỨNG NHẬN (điểm, caveat
  F61 chưa kiểm + cận nhảy X ≤ 36 s, xem §2.5).** **Gap #61→#62 =
  1h34'49" (5.689 s) CHỈ LÀ SPAN** (đoạn J mở) — KHÔNG vào FULL/CERT.
  CERT n=33 → **n=34**; FULL n=48 → **n=49**. Dải chứng nhận
  [19'07", 3h14'08"] không đổi.
- **Mù #38 đoạn G: THỬ ĐÓNG LẦN CUỐI — VẪN MỞ (xem §2.6).** Quét
  lại tươi lỗ (02:41:59Z, 04:45:49Z]: 0 file trong cả 3 phạm vi +
  /tmp, 0 session chạm lỗ; 2 file viết sau 06:16Z nhắc fc62a4b7 đều
  là trích dẫn hồi tưởng, không có lần đọc tươi nào trong lỗ.
  **Kết luận cuối: G không đóng được — không thử lại nữa.**
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong 162
  file *.log có mtime trong mù #39 (0 file repo-1, 162 file
  hidden_files); 2 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả đã biết** (T10-O8 launcher ×2). Sóng gần nhất vẫn là
  **~11:55–12:11Z 11/11** (R7) — **~116h29'45"** trước probe #40.
  EPERM vẫn KHÔNG được tuyên bố là đã hết. **Đính chính:** T5-120
  ghi nhầm ngày sóng là "15/11" — đúng là **11/11** (R7 §, "tính
  từ cuối sóng ~12:11Z 11/11"); số ~113h33' của T5 là đúng cho
  11/11, chỉ sai ngày viết.
- **Quét writeFileSync lần 27: 788 dòng / 215 file** (phạm vi 2.945
  file); R7b đối chiếu 813 dòng / 232 file; copies 25 dòng / 17
  file — y hệt lần 26 về copies; đối chiếu chéo 788+25=813=R7b,
  **chênh 0 — lần thứ hai mươi bảy liên tiếp**. +14 dòng / +3 file
  so với lần 26, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** (+ 1 bản
  build dist cũ của cùng helper) — 0 stray; mtime không đổi từ
  10–11/11.
- RAM: max biết được trong mù #39 **1.983 MB** (T8 E1 run2,
  06:07:28Z, đoạn I) = 32% ngưỡng guard — thấp hơn nhiều so với mù
  #38 (4.796 MB); đoạn J max 1.565 MB, đoạn K không có mẫu.
  Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong gói.
  Reboot #16 VẪN MỞ; cron riêng 10 phút vẫn chờ user quyết; R9 (a)
  vẫn chờ user.
- **Reboot #63 trong lúc T4 làm việc** (boot 725453a2, btime
  08:53:05Z — xem §2.2; T10 poller đợt 121 đã RESTART 08:54:30Z).
  Không có reboot nào khác trong lúc T4 làm việc (boot vẫn
  725453a2, uptime-s 08:53:05Z lúc 09:00:35Z — kiểm lại trước khi
  viết LIMITS).
- **dpkg.log boot #62 và #63: mỗi boot chỉ 2 dòng** (08:35:39Z /
  08:53:53Z); `/var/log/apt/` KHÔNG TỒN TẠI — không có bracket
  replay cho cả hai boot (như #60, xem §2.1).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 08:39:42Z | boot_id `9788ce28-c334-40f4-bc21-e93d298b0f9b`; `who -b` Nov 16 08:25; `uptime -s` **2026-11-16 08:25:47**; btime **1794817547 = 2026-11-16T08:25:47Z**; journal chỉ 1 boot (9788ce28, first entry 08:25:58Z, last 08:39:15Z lúc kiểm tra); `last -x reboot` 08:25 still running; wtmp begins 08:25:57Z; `ps` systemd PID 1 START 08:25:57 |
| `bash scripts/probe-eperm-v2.sh status` | 08:40:45Z | **DEAD/STALE**, heartbeat n=39, ts 05:44:31Z, boot 0260101b, age **10.574 s** (đúng 2h56'14"); last sample probe #39; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 08:40:45Z | **probe #40, boot=9788ce28, ok=2 fail=0**, exit 0; dòng `boot changed 0260101b -> 9788ce28` (uptime since 2026-11-16 08:25:47) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 08:40:45Z | **ALIVE**, age 0 s, n=40, exit 0 |

Kiểm lại từ đĩa: log probe v2 **112 dòng** — 109 sau T5 đợt 120 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #39 +
dòng `boot changed` + dòng probe #40). **Như R7/S7/T7/T6/T5 (+3):**
lượt này chưa có dòng DEAD nào cho heartbeat #39 nên `status`
ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3 trước khi
đo. Heartbeat **n=40, ts 2026-11-16T08:40:45Z, boot 9788ce28-…**;
log vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z 11/11) và
**0 dòng `=== probe end`** — loop v2 chưa từng được start lại kể
từ đợt 88. (34 dòng chứa chuỗi "probe end" đều là dòng `probe DEAD
detected ... no probe end since last start` — kiểm bằng pattern
chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #62: T10 poller đợt 121 START 08:41:20Z
boot=9788ce28 tươi + driver mở đợt 121 (round-in-progress.md mtime
08:37Z, boot #62 btime ~08:25:47Z) + 2 file round-121 T2/T8 mtime
08:41:52Z/08:42:32Z trên boot #62. **Số thứ tự TẠM THỜI** (mù #35
chưa đóng, tối đa +24 ẩn danh nghĩa, cộng thêm tối đa +29 từ mù
#37, +6 từ mù #38 đoạn G, +2 từ mù #39 đoạn J và +4 từ mù
#29/#30/#31 → "thực tế #62" có thể tới #128; xem §2.2).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #39 (05:44:31Z → 08:40:45Z, 2h56'14")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #40: `uptime -s` = **2026-11-16 08:25:47Z**,
  boot_id `9788ce28-c334-40f4-bc21-e93d298b0f9b` — khác boot của
  probe #39 (0260101b).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (08:39Z): chỉ **1 boot**
  (9788ce28, first entry 08:25:58Z, last 08:39:15Z). `last -x
  reboot`: chỉ 1 dòng (08:25, still running). wtmp bắt đầu
  08:25:57Z. Journal/wtmp của boot 0260101b đã mất theo reboot
  #62 — như mọi lần trước, chỉ giữ boot hiện tại.
- **dpkg.log KHÔNG có bracket replay cho boot #62 (như #60):**
  file `/var/log/dpkg.log` lúc kiểm tra chỉ có **2 dòng, cả hai
  là `2026-11-16 08:35:39 startup packages configure`** — tức
  9'52" SAU boot, lúc driver mở đợt 121, không phải replay lúc
  boot. **`/var/log/apt/` KHÔNG TỒN TẠI** (như đợt 120).
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  lượt này). `btmp` cũng chỉ bắt đầu 08:25:57Z (boot hiện tại).

### 2.2 Hai reboot đã chốt trong mù — #61 (06:50:58Z), #62 (08:25:47Z) — và reboot #63 phát hiện trong lúc làm việc

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 61 | **06:50:58Z** (chính xác từng giây) | 0260101b → 80a940d7 | Chốt từ lượt này: poller T10 RESTART 06:52:14Z đọc `uptime=2026-11-16 06:50:58` tươi + T4 gate0-wait-b61 start 06:55:13Z đọc `boot=2026-11-16 06:50:58 boot_id=80a940d7-…` tươi + t10-postboot-80a940d7.log (postboot PASS, GST 269 plugin) + build-loop-log (đóng đợt 120). **Số thứ tự TẠM THỜI.** |
| 62 | **08:25:47Z** (chính xác từng giây) | 80a940d7 → 9788ce28 | Chốt từ lượt này: `uptime -s` đọc tươi (08:39:42Z) + btime 1794817547 + `who -b` 08:25 + boot_id 9788ce28 + journal first entry 08:25:58Z + wtmp begins 08:25:57Z + `ps` systemd PID 1 START 08:25:57 + probe #40 08:40:45Z boot 9788ce28 ok=2 fail=0 + T10 poller đợt 121 START 08:41:20Z boot=9788ce28 tươi + driver mở đợt 121 08:35Z. **Số thứ tự TẠM THỜI.** |
| 63 | **08:53:05Z** (chính xác từng giây theo đồng hồ mới — NHƯNG xem caveat bước nhảy clock dưới) | 9788ce28 → 725453a2 | Phát hiện TRONG LÚC T4 làm việc (không thuộc mù #39): lúc 08:52:13Z boot vẫn 9788ce28; lúc 08:55:22Z boot đã là 725453a2, `uptime -s` ×2 = 08:53:05Z, btime 1794819185, `who -b` Nov 16 08:53, systemd PID 1 START 08:53:19, journal 1 boot (725453a2, first 08:53:20Z), wtmp begins 08:53, `last -x reboot` 08:53 still running; T10 poller đợt 121 RESTART 08:54:30Z (đồng hồ mới) ghi reboot #63, poll cuối #3 08:51:20Z; poller mới start 08:54:31Z boot 725453a2. dpkg.log 2 dòng @08:53:53Z (không bracket replay). **Số thứ tự TẠM THỜI. Thuộc mù #40 — luồng EPERM đợt sau phân tích.** |

**Clock:** F_now ≈ 0 (`date -u` 08:39:44Z vs HTTP `Date`
example.com 08:39:44Z, google.com 08:39:44Z, cloudflare.com
08:39:45Z — khớp trong 0–1 s). F60 ≈ 0 (đã kiểm 05:41Z đợt
120). **F61/F62/F63 KHÔNG BIẾT ĐẦY ĐỦ** — và lượt này CHỨNG
MINH được có bước nhảy tại #63 (xem dưới); F61/F62 không có
kiểm HTTP Date nào trong các boot đó. Mọi gap trong mù #39 đều
là hiệu số đồng hồ VM cho tới khi chứng minh F ổn định (xem
caveat §2.5).

**BƯỚC NHẢY CLOCK TẠI #63 (mới — bằng chứng trực tiếp, lần thứ ba):**
- Scan WFS của T4 là 1 tiến trình duy nhất (script bash tuyến
  tính, không có cơ chế restart): SCAN-START 08:52:51Z,
  SCAN-END **08:53:11Z**, cả hai ghi trên boot #62 — tính lại
  bằng datetime đầy đủ, xem scan-meta.txt.
- SCAN-END ghi lúc **08:53:11Z** — tức là tiến trình scan còn
  sống và ghi log ở 08:53:11Z theo đồng hồ lúc đó. Nhưng btime
  của boot kế tiếp #63 là **08:53:05Z**. Một tiến trình không thể
  sống sau reboot 6 giây. Kết luận duy nhất: **đồng hồ đã bước
  lùi tại reboot #63**.
- Cận của bước nhảy X (lùi, theo đồng hồ trước reboot so với sau):
  - Cận dưới: **X ≥ 6 s** (08:53:11 − 08:53:05).
  - Cận trên: **X ≤ 195 s** (poll #4 của poller T10 đợt 121 due
    08:56:20Z không bao giờ ghi — nếu reboot (theo đồng hồ
    trước) muộn hơn 08:56:20Z thì poll #4 đã ghi; giả định
    cadence 300 s giữ, như 3 poll trước đó 08:41:20Z →
    08:51:20Z).
  - Vậy **X ∈ [6, 195] s**. True gap #62→#63 = 1.638 + X ∈
    [1.644, 1.833] s theo giả thuyết (a) dưới.
- **Điều kiện (không dùng làm cận chính):** file blind39-gaps.py
  (mtime 08:55:07Z) + blind39-gaps.txt (mtime 08:55:11Z) của T4 —
  NẾU hai file này được ghi trên boot #62 (đồng hồ cũ) thì
  X ∈ (126, 195] s. T4 KHÔNG khẳng định được hai file này ghi
  bằng đồng hồ nào (lệnh ghi file và lệnh chạy script trả về bình
  thường, có thể chạy trước hoặc sau reboot) nên chỉ ghi làm điều
  kiện, không thu hẹp cận chính.
- **Hai giả thuyết (chỉ (a) là chính; (d) là dự phòng không loại
  được — như #58):**
  - (a) **Bước nhảy NGAY tại reboot #63** — tiền lệ đã có (#54,
    #58): đồng hồ trước reboot ≈ giờ thật, đồng hồ sau reboot
    lùi X. Gap thật #62→#63 = 1.638 + X.
  - (d) **Bước nhảy xảy ra TRƯỚC reboot, trong cửa sổ
    (08:40:45Z, 08:41:20Z]** — 35 giây duy nhất chưa bị loại:
    poller T10 đợt 121 các bước đều đúng 300 s trong 08:41:20Z →
    08:51:20Z (loại nhảy trong cửa sổ đó); scan WFS các bước
    find/grep không có cadence cố định nên không loại được nhảy
    trong (08:40:45Z, 08:41:20Z]. Nếu (d) đúng thì btime #63 là
    giờ thật và gap #62→#63 = 1.638 s đúng từng giây. Cửa sổ 35 s
    này không còn dấu vết nào khác để kiểm — T4 không tự chọn (d)
    vì tiền lệ bước nhảy tại reboot mạnh hơn hẳn một bước nhảy NTP
    6 s+ trong 35 s ngẫu nhiên.
- **Khoảng gap dùng cho thống kê bao cả hai giả thuyết:
  [1.638, 1.833] s, mid 1.735,5 s** (quy ước T6-118 cho gap
  khoảng). Gap này KHÔNG vào CERT/FULL lượt này (thuộc mù #40).
- **Không có dấu nhảy clock tại #61:** poller run 1 không có poll
  nào ghi sau btime 06:50:58Z (poll cuối #13 06:46:34Z);
  gate0-wait #30 06:49:16Z trên boot #60, 102 s trước #61; T7
  watcher poll 60 06:44:09Z. Không có dòng nào bắc qua #61.
  Cận NẾU có nhảy tại #61: X ≤ 36 s (poll #14 due 06:51:34Z
  không bao giờ ghi) — xem §2.5.
- **Không có dấu nhảy clock tại #62:** không có observer nào
  sống trong đuôi đoạn J (mtime cuối 07:37:47Z); poller run 2
  dừng ở ALL 9 DONE 07:32:14Z; driver mở đợt 121 08:35Z đọc
  uptime 08:25:47Z tươi. Không có bằng chứng nhảy theo cả hai
  chiều — F62 chưa kiểm, như F61.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #60→#61 = **2h05'09"** (7.509 s) — ĐƯỢC CHỨNG NHẬN (xem §2.5).
- Gap #61→#62 = **1h34'49"** (5.689 s) — CHỈ LÀ SPAN (đoạn J mở),
  KHÔNG chứng nhận, KHÔNG vào FULL.
- Gap #62→#63 = **KHOẢNG [27'18", 30'33"]** ([1.638, 1.833] s,
  mid 28'55,5" = 1.735,5 s) — CHƯA chứng nhận (thuộc mù #40).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):** #62 từ
  #61: [07:10:05Z, 10:05:06Z] — #62 thật 08:25:47Z NẰM TRONG;
  #63 từ #62 (p10–p90 FULL49): [09:15:28Z, 11:27:46Z] — #63 thật
  08:53:05Z NẰM NGOÀI (sớm hơn p10 22'23" — gap 27'18" ngắn hơn
  khối chính nhưng trong dải chứng nhận [19'07", 3h14'08"]; xem
  §2.5). Hiệu dụng sau probe #40: [08:40:45Z, 11:39:55Z].

### 2.3 Hoạt động trong khoảng mù — vì sao I + K đóng, J mở

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **17 file** +
hidden_files **392 file**; **409 file, 396 mốc giây phân biệt**
(theo cách đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 19/P6 §4 mục 20/Q6
§4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/T6 đợt 118 §2.3/T6 đợt
119 §2.3/T5 §2.3). Chia mù làm ba đoạn bởi #61 (06:50:58Z) và
#62 (08:25:47Z):

- **Đoạn I: 05:44:31Z → 06:50:58Z (1h06'27", boot #60 0260101b) —
  ĐÓNG bằng đo uptime tại probe #39 + poller T10 run 1 + T7 watcher
  + T4 gate0-wait + session bắc qua cắt sàn + đầu/đuôi < sàn:**
  - Probe #39 (05:44:31Z) đo uptime chứng minh up liên tục từ
    04:45:49Z tới 05:44:31Z — đóng tới 05:44:31Z (đầu đoạn = giờ
    probe, 0 s).
  - **Poller T10 run 1 là 1 tiến trình duy nhất (kiểm bằng code
    poll120-t10.sh: 1 vòng for, `sleep 300`, không có cơ chế
    restart; RESTART là lần chạy lại thủ công):** START 05:46:34Z
    boot 0260101b; 13 poll #1–#13, đúng số thứ tự, đúng **300 s**
    mỗi bước (05:46:34Z → 06:46:34Z); script không có cơ chế
    restart. Đóng (05:46:34Z, 06:46:34Z] theo đồng hồ ghi.
  - **T7 watcher (observer độc lập thứ hai):** start 05:45:04Z
    boot 0260101b (#60 tạm) 04:45:49Z; 60 poll #1–#60, đúng số
    thứ tự, 05:45:04Z → 06:44:09Z; các bước 60 s ×54 + 61 s ×5
    (61 s ở poll 10/20/30/40/53 — check-only postboot mỗi 10
    poll + jitter 1 s, không phải clock step).
  - **T4 gate0-wait (observer độc lập thứ ba):** start 05:51:06Z
    boot=04:45:49 boot_id=0260101b tươi; 30 poll #1–#30, đúng
    số thứ tự, các bước 120/121 s tới 06:49:16Z — đều đọc
    boot=04:45:49 tươi.
  - **5 session bắc qua cắt I-lo (06:03:38Z)** (birth 05:54:26Z
    → mtime 06:06:23Z; 05:56:48Z → 06:11:38Z; 06:01:00Z →
    06:07:59Z; 06:01:37Z → 06:04:22Z; 06:01:58Z → 06:15:48Z);
    **5 session bắc qua cắt I-hi (06:31:51Z)** (06:27:12Z →
    06:42:01Z; 06:27:22Z → 06:45:22Z; 06:28:24Z → 06:35:22Z;
    06:29:06Z → 06:45:05Z; 06:30:36Z → 06:44:26Z).
  - Đầu: probe #39 05:44:31Z → observer đầu tiên (T7 watcher
    05:45:04Z) = 33 s < sàn; poller start 05:46:34Z = 123 s <
    sàn. Đuôi: mốc quan sát cuối trước #61 là gate0-wait #30
    06:49:16Z — cửa sổ (06:49:16Z, 06:50:58Z] = 102 s < sàn
    19'07". Mật độ mtime củng cố (219 mốc, lỗ lớn nhất chỉ
    120 s) nhưng không dùng để đóng.
  - **Kết luận đoạn I: ĐÓNG.**
- **Đoạn J: 06:50:58Z → 08:25:47Z (1h34'49", boot #61 80a940d7) —
  KHÔNG ĐÓNG: đuôi (07:37:47Z, 08:25:47Z] 2.880 s (48'00"):**
  - Phủ tới 07:37:47Z: poller T10 run 2 polls #1–#9
    06:52:14Z → 07:32:14Z, ALL 9 DONE 07:32:14Z (1 tiến trình
    duy nhất, bước 300 s); T4 gate0-wait-b61 #1–#2 06:55:13Z +
    06:57:14Z (đọc boot 06:50:58Z tươi); phase-1 driver
    07:02:14Z + suite 27/27 07:20:50Z + O8 check-only 07:14:05Z
    (WebKit xanh lại) + O8 Chromium/WebKit 21/21; parent đóng đợt
    120 ~07:3xZ; build-loop-log.md mtime 07:37:47Z (mốc cuối cùng).
  - **2 session bắc qua cắt J-lo (07:10:05Z)** (07:03:04Z →
    07:14:54Z; 07:09:01Z → 07:12:51Z) — nhưng **0 session bắc
    qua cắt J-hi (08:06:40Z)** và **0 session chạm vùng đuôi
    (07:37:47Z, 08:25:47Z]**.
  - **Sau 07:37:47Z: KHÔNG CÒN GÌ cho tới #62 08:25:47Z.** 0 file
    exec-log nào sinh hay ghi trong (07:37:47Z, 08:25:47Z]; 0
    file trong cả 3 phạm vi (repo-1, hidden_files, ngoài hai
    cây — 116 file ngoài cây đều nằm ngoài đuôi) và 0 file /tmp
    trong đuôi; lượt cron 15:35 +07 (08:35Z) mở đợt 121 SAU #62
    nên không để lại mẫu nào trong đuôi (cùng mẫu như lượt cron
    09:35 trong mù #38 — đề xuất standing check vẫn chờ parent
    duyệt).
  - Đuôi 2.880 s; tối đa ẩn danh nghĩa = ⌊2.880/1.147⌋ = **2**.
  - **Kết luận đoạn J: KHÔNG ĐÓNG.** (Prereg §2 đã dự báo đúng
    ít nhất 1 trong 2 gap KHÔNG đủ điều kiện chứng nhận.)
- **Đoạn K: 08:25:47Z → 08:40:45Z (14'58", boot #62 9788ce28) —
  ĐÓNG bằng đo uptime trực tiếp + probe #40 + dấu boot tươi:**
  - **`uptime -s` lúc 08:39:42Z = 08:25:47Z** chứng minh máy up
    liên tục từ #62 tới lúc đo; probe #40 08:40:45Z đọc boot_id
    9788ce28 tươi — cùng boot_id với boot bắt đầu 08:25:47Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H.) Đoạn K dài 898 s < sàn
    1.147 s nên không áp cắt sàn — uptime là closer duy nhất.
  - **Chuỗi dấu boot tươi củng cố:** T10 poller đợt 121 START
    08:41:20Z boot=9788ce28 + 3 poll 08:41:20Z → 08:51:20Z +
    driver mở đợt 121 (round-in-progress.md mtime 08:37Z) +
    2 file round-121 T2/T8 mtime 08:41:52Z/08:42:32Z trên boot
    #62 + 1 session đợt 121 trong vùng K (birth 08:36:40Z,
    mtime 08:36:44Z).
  - Lỗ mtime (08:25:47Z → 08:37:05Z] 678 s là máy yên sau boot,
    không observer — nhưng uptime đóng đoạn này, không cần mtime
    (như T6-119 đoạn D và T5-120 đoạn H: uptime trực tiếp là
    closer, mtime chỉ củng cố).
  - **Kết luận đoạn K: ĐÓNG.**

**Kết luận trung thực: khoảng mù #39 KHÔNG ĐÓNG HOÀN TOÀN.** Đoạn
I + K đóng; đoạn J mở (1 cửa sổ mở ở đuôi, 48'00"); 2 reboot đã
chốt giờ (#61 06:50:58Z, #62 08:25:47Z — cả hai chính xác từng giây
trên đĩa) + tối đa **2 ẩn danh nghĩa** (đuôi đoạn J). Số thứ tự
#61/#62 vẫn TẠM THỜI.

### 2.4 Quét sóng EPERM trong mù #39 — 0 sóng thật (bằng chứng âm tính)

Quét toàn bộ file *.log có mtime trong mù #39 (bằng script
eperm-sweep.py; eperm-sweep*.log của chính mình bị loại theo bài
học T7 §4 mục 19):

| Phạm vi quét | "vẫn bật" | "CẢNH BÁO 10 phút" | "Operation not permitted" | "sóng EPERM đã tắt" |
|---|---|---|---|---|
| repo-1 (0 file) | 0 | 0 | 0 | 0 |
| hidden_files (162 file) | 0 | 0 | 0 | **2** (dương tính giả đã biết, xem dưới) |
| **Tổng 162 file** | **0** | **0** | **0** | **2 FP** |

2 dòng "đã tắt" đều là dương tính giả launcher đã biết — không
phải sóng thật:
- 2× t10-o8.log (07:14:07Z, 07:15:00Z — T10 đợt 120 O8 driver
  launcher, cùng mẫu như 4× đợt 119).

Quét mở rộng `/eperm|not permitted/i`: 38 match thô / 33 dòng
duy nhất — 20 dòng recount tên file LIMITS EPERM (oversize) trong
t10-phase1-driver.log (10) + recount-push120.log (10) + 6 dòng
test-pass hasEperm trong round120-t10-suites.log (test tự kiểm
"not permitted" như kết quả mong đợi) + 2 dòng launcher trên +
5 dòng T8 harness lỗi (round120-t8/runs.log 05:46:35Z–05:47:49Z:
vite dev + media probe không lên sau 3 lần thử — chẩn đoán ghi
rõ "không thấy dấu EPERM hay EADDRINUSE", nguyên nhân chưa rõ).
**0 sóng EPERM thật.**

- Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7 đợt 115) —
  **~116h29'45"** trước probe #40 (08:40:45Z). (Đính chính ngày:
  xem §0.)
- EPERM **không** được tuyên bố là đã hết — như R7/S7/T7/T6/T5:
  1 lượt không sóng = bằng chứng âm tính cho lượt đó, không phải
  kết luận hệ thống.

### 2.5 Phân phối gap — CERT n=34, FULL n=49 (mới: +1 gap từ mù #39)

**Gap #60→#61 = 2h05'09" (7.509 s) ĐƯỢC CHỨNG NHẬN (điểm).** Điều
kiện: đoạn I mù #39 đã đóng (xem §2.3). **CAVEAT (đứng, như mọi
gap trước #54 và #54→#55 và #58→#59):** F61 CHƯA ĐƯỢC KIỂM —
không có kiểm HTTP Date và không có neo clock xuyên-boot nào
trong boot #61. Không tìm thấy bằng chứng nhảy clock tại #61
(không có poll nào ghi sau btime 06:50:58Z; gate0-wait #30
06:49:16Z đi trước 102 s). **Cận nhạy:** NẾU có bước nhảy lùi
tại #61 thì X ≤ 36 s (poll #14 due 06:51:34Z không bao giờ ghi)
→ gap tối đa 7.545 s; độ nhạy thống kê: CERT34-HI mean chỉ lệch
+2 s so với điểm (xem dưới). Nếu sau này chứng minh được nhảy
clock tại #61 thì gap này trở thành khoảng như #53→#54 và
#57→#58. Nếu parent không chấp nhận chứng nhận điểm khi F chưa
kiểm thì hạ gap này về cận trên, CERT về n=33 (và FULL về n=48).

**Gap #61→#62 = 1h34'49" (5.689 s) CHỈ LÀ SPAN — KHÔNG đưa vào
FULL/CERT** — đoạn J mù #39 mở (đuôi 2.880 s, tối đa 2 ẩn).
Cùng luật như #55→#56 / #56→#57 (T6-119 §2.5) và span #59→#60
(10.680 s, T5-120 §2.5).

**Gap #62→#63 = KHOẢNG [27'18", 30'33"] ([1.638, 1.833] s, mid
28'55,5" = 1.735,5 s) CHƯA CHỨNG NHẬN** — thuộc mù #40 (bước
nhảy clock tại #63, X ∈ [6, 195] s, xem §2.2). Luồng EPERM đợt
sau chứng nhận khi đoạn tương ứng của mù #40 đóng.

**Cross-check tái hiện T5(120) 100%:** chạy blind38-gaps.py
verbatim cho lại đúng CERT n=33 / FULL n=48 của T5 đợt 120 (xem
blind39-gaps.txt).

Bảng so sánh (CERT = gap đơn/khoảng đã chứng nhận, thống kê dùng
mid; FULL = CERT + gap chưa chứng nhận + gap khoảng):

| | CERT n=33 (T5-120) | **CERT n=34 (T4-121)** | FULL n=48 (T5-120) | **FULL n=49 (T4-121)** |
|---|---|---|---|---|
| mean | 1h48'39" | **1h49'08"** | 1h54'14" | **1h54'27"** |
| median | 1h58'47" | **1h59'16"** | 1h58'30" | **1h58'47"** |
| p10 | 0h56'59" | **0h58'25"** | 0h49'32" | **0h49'41"** |
| p90 | 2h26'32" | **2h26'14"** | 3h02'19" | **3h02'00"** |
| sd | 0h40'49" | **0h40'18"** | 0h57'05" | **0h56'30"** |
| min | 19'07" | **19'07"** | 19'07" | **19'07"** |
| max | 3h14'08" | **3h14'08"** | 5h43'18" | **5h43'18"** |

- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới nằm
  giữa; gap #60→#61 = 2h05'09" nằm trong khối chính).
- **Độ nhạy đầu mút #60→#61:** CERT34-HI (7.545 s) mean
  1h49'10"; FULL49-HI mean 1h54'28" — lệch +2 s / +1 s so với
  điểm; median và p10/p90 không đổi.
- **Tốc độ reboot (đồng hồ ghi nhận):** 62 / 132,13 h = **1 reboot
  mỗi 127,9 phút** (từ #1 2026-11-10T20:18:10Z tới #62
  2026-11-16T08:25:47Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 66 / 132,13 h = **1 mỗi 120,1 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6) và mù #39 đoạn J (+2).
- **Phân phối FULL49:** 27/49 trong 90–150 phút; 7 gap <60 phút;
  6 gap >180 phút; 2 gap >240 phút. Gap #60→#61 (2h05'09") nằm
  trong khối chính 90–150 phút, không phải outlier.
- **Lưu ý về #63:** gap danh nghĩa #62→#63 = 27'18" (1.638 s)
  ngắn hơn p10 FULL49 (49'41") nhưng vẫn trong dải chứng nhận;
  nếu được chứng nhận ở mid 1.735,5 s thì nó là gap ngắn thứ hai
  trong CERT (sau sàn 19'07").

### 2.6 Trạng thái các mù cũ — mù #38 đoạn G THỬ CUỐI: VẪN MỞ (không thử lại)

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #39 | KHÔNG ĐÓNG HOÀN TOÀN (I+K đóng, J mở, 2h56'14", tối đa 2 ẩn) | Mới, lượt này (§2.3); probe #41 đợt sau tiếp tục |
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | **Thử đóng G lần cuối lượt này: VẪN MỞ** (xem dưới); 3 reboot đã chốt + tối đa 6 ẩn |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 §2.3 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#62 vẫn TẠM THỜI vì mù này |
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

**Mù #38 đoạn G — thử đóng lần cuối (theo brief T4):**
- Quét lại TƯƠI lỗ (02:41:59Z, 04:45:49Z] bằng blind39-sessions.py:
  repo-1 = 0, hidden_files = 0, ngoài hai cây = 0, /tmp = 0 file
  có mtime trong lỗ; 0 session chạm lỗ (quét exec-log tươi, 235
  file).
- File viết sau 06:16Z (khi T5-120 xong) nhắc fc62a4b7: 2 file —
  build-loop-log.md (4×: các mục đóng đợt 119 lúc ~02:38Z +
  đóng đợt 120 lúc ~07:37Z, đều là trích dẫn hồi tưởng boot #59,
  KHÔNG có lần đọc uptime/boot tươi nào trong lỗ) +
  blind39-sessions.py của chính T4 (5×, chuỗi trong code).
  Không có bằng chứng mới.
- **Kết luận cuối: đoạn G KHÔNG đóng được. Không thử lại nữa —
  chỉ còn cách chờ parent cung cấp bằng chứng nếu có (ví dụ
  output `uptime -s` lúc đóng đợt 119).** Mù #38 giữ nguyên trạng
  thái KHÔNG ĐÓNG HOÀN TOÀN; cần parent quyết có chấp nhận để mở
  như mù #35/#37 hay không (T5 đã đề xuất ĐỂ MỞ, xem §5 mục 1).

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 27 — chênh 0 (lần thứ 27 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T5 trong round120-t5, đổi OUT sang
  round121-t4) **08:52:51Z → 08:53:11Z 16/11 (20 s, có SCAN-END)**.
  Lưu ý: scan chạy trên boot #62, kết thúc trước reboot #63 theo
  đồng hồ cũ (xem §2.2) — kết quả vẫn hợp lệ.
- NEWSTD: **788 dòng / 215 file** (phạm vi 2.945 file); R7b đối
  chiếu: **813 dòng / 232 file** (phạm vi 12.338 file); copies:
  **25 dòng / 17 file** — y hệt lần 26. Đối chiếu chéo:
  788+25=813=R7b, **chênh 0**.
- **+14 dòng / +3 file so với lần 26** (774/212 → 788/215), giải
  thích đúng hết bằng diff (kiểm bằng đếm lại trực tiếp + mtime —
  cả 3 file đều về trước lúc scan bắt đầu 08:52:51Z 16/11):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND120_T5_EPERM_LIMITS.md | +5 | 06:15:53Z 16/11 | Tài liệu T5 đợt 120 (chính nó nhắc `writeFileSync` 5 lần); viết sau scan lần 26 (06:05:49Z) nên lần này mới vào |
  | apps/web/scripts/probe121t8-h3fext-ab.mjs | +7 | 08:42:32Z 16/11 | Script probe T8 đợt 121 (ghi file kết quả/scratch — code probe bình thường, không phải né EPERM); viết sau probe #40 |
  | benchmarks/render/psi-axis-pilot-121t2.sh | +2 | 08:41:52Z 16/11 | Script pilot T2 đợt 121 (import + ghi state file); viết sau probe #40 |
- Phạm vi: 2.945 = 2.931 + 14 net / −0 (14 file mới, 0 file mất:
  2 file round-121 trên + LIMITS T5-120 + 11 file sibling đợt
  120/121 khác). **0 file mất hit.**
- **Kết luận: 27 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #39.

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
  né EPERM trong mù #39.

## 3. RAM trong mù #39 — max 1.983 MB (32% guard), birefnet KHÔNG chạy

- **2 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #39 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 08:52:13Z | **1.210.124 kB** | Lúc scan WFS (boot #62) |
  | 09:00:35Z | **2.294.428 kB** | Trước khi viết LIMITS (boot #63) |
- **Max RAM biết được TRONG mù #39 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 188 mẫu RAM; **max 1.983 MB**
  (T8 E1 run2, 06:07:28Z, đoạn I) = **32% ngưỡng guard** — thấp
  hơn nhiều so với mù #38 (4.796 MB); đoạn J max **1.565 MB**
  (gate0-wait-b61 #1, 06:55:13Z); đoạn K **không có mẫu nào**
  (máy yên, không observer ghi RAM).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 1,98 GB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Chỉ thử lại khi RAM đổi (xem §5 mục 7).

## 4. Ghi chú phương pháp (mới so với T5 đợt 120)

1. **Lỗi in cửa sổ sàn đoạn I trong blind39-investigate.py (mới,
   đã đính chính trong LIMITS, không ảnh hưởng dữ liệu):** script
   in "seg I floor window [05:04:56 .. 06:31:51]" — 05:04:56Z là
   b60+flooor (04:45:49Z + 1.147 s), không phải cắt I-lo. Cắt đúng
   là I-lo = 06:03:38Z (probe #39 + sàn) và I-hi = 06:31:51Z
   (#61 − sàn) — blind39-sessions.py dùng đúng hai cắt này (5
   session bắc qua mỗi cắt). Bài học: cửa sổ sàn của một đoạn
   tính từ ĐẦU ĐOẠN (giờ probe), không phải từ giờ boot.
2. **Bước nhảy clock tại #63 — phát hiện bằng mâu thuẫn nội bộ
   (mới, §2.2):** SCAN-END 08:53:11Z vs btime #63 08:53:05Z.
   T10-STATUS/poller đợt 121 ghi "poller dừng ở poll #3" mà không
   nhận ra mâu thuẫn giờ — bài học (nhắc lại từ §4.2 của T5-120):
   khi ghi "poller dừng ở poll #N" phải đối chiếu giờ poll cuối
   với btime của boot kế tiếp. Cận X dùng cadence poller (poll #4
   due) — cùng phương pháp đã dùng cho #58.
3. **Đồng hồ ghi file mtime sau reboot là mơ hồ (mới):**
   blind39-gaps.py (mtime 08:55:07Z) + blind39-gaps.txt (mtime
   08:55:11Z) không xác định được ghi bằng đồng hồ cũ hay mới —
   T4 chỉ ghi làm điều kiện cho cận X, không dùng làm cận chính.
   Bài học: sau một reboot, mtime của file ghi trong ~3 phút quanh
   reboot không dùng được làm bằng chứng giờ trừ khi có neo độc
   lập (ví dụ log poller có số thứ tự + cadence).
4. **Grep NỘI DUNG exec-log theo boot_id (kế thừa T6-119 §4 mục
   1):** 50 exec-log sinh/ghi trong mù #39; boot 0260101b nhắc
   trong 10 file, 80a940d7 trong 3, 9788ce28 trong 0 (không có
   exec-log nào nhắc boot #62 — K đóng bằng uptime, không bằng
   exec-log). Đọc nội dung từng file tiêu biểu để phân loại đọc
   tươi vs trích dẫn: T10 poller RESTART 06:52:14Z boot=80a940d7
   tươi; gate0-wait-b61 start 06:55:13Z boot=06:50:58 tươi.
5. **0 file trong đuôi đoạn J ở cả 3 phạm vi + /tmp:** ngoài hai
   cây có 116 file mtime trong mù #39 nhưng KHÔNG file nào nằm
   trong (07:37:47Z, 08:25:47Z]; /tmp có 0 file trong toàn bộ mù
   #39. Sự im lặng 48'00" là toàn diện, không chỉ trong hai cây.
6. **HTTP Date standing check giữ làm check đứng mỗi lượt:**
   F_now ≈ 0 (3 server, khớp 0–1 s lúc 08:39:44Z).
7. **dpkg.log + /var/log/apt/ đã mất hoàn toàn dạng replay:**
   dpkg chỉ còn 2 dòng cho mỗi boot (#62 @08:35:39Z, #63
   @08:53:53Z — đều là lúc driver/poller chạy lại, không phải
   replay lúc boot); thư mục apt không tồn tại — không còn bracket
   replay cho boot #62 hay #63 (như #60).
8. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo boot #62 ĐÚNG (9788ce28, 08:25:47Z); dự báo "ít
   nhất 1 trong 2 gap KHÔNG đủ điều kiện chứng nhận" ĐÚNG
   (#61→#62 chỉ là span); dự báo EPERM 0 sóng ĐÚNG; dự báo WFS
   chênh 0 ĐÚNG; dự báo RAM max < 4,81 MB ĐÚNG (1.983 MB) — không
   sửa sau khi thấy số. (Prereg dự báo đoạn J mở vì đuôi dài —
   đúng; prereg KHÔNG dự báo được reboot #63 + bước nhảy tại #63
   vì xảy ra sau probe #40.)
9. **Kiểm lại boot trước khi viết LIMITS (09:00:35Z):** boot
   725453a2 (#63), uptime-s 08:53:05Z — reboot #63 đã ghi nhận,
   không reboot mới thêm trong lúc làm việc.
10. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
    (cấm — RAM < guard). **Không đụng cloud/collab/AI model
    đóng/nhạc bản quyền.**
11. **Stage batch:** chỉ 1 file text (LIMITS doc này),
    NUL-delimited, verify read-back (xem checkpoint3.txt + stage
    file).
12. **Ghi rõ:** số thứ tự reboot #47–#63 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
13. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat bước nhảy #63 vào hồ sơ (xem
    §2.5). **Đính chính ngày sóng EPERM gần nhất:** 11/11, không
    phải 15/11 như T5-120 đã ghi (số giờ ~113h33' của T5 là đúng
    cho 11/11).
14. **Cross-check tái hiện T5(120) 100%** (CERT n=33 / FULL n=48)
    trước khi tính số mới — chạy blind38-gaps.py verbatim qua exec.
15. **Nhãn script poller đợt 121 sai (ghi nhận, không sửa):**
    poll121-t10.sh ghi header "T10 poller đợt 120" (copy-paste)
    dù chạy cho đợt 121 — chỉ là nhãn log, không ảnh hưởng số
    liệu; luồng T10 đợt sau sửa nếu muốn.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #39 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** đoạn I + K đóng; đoạn J mở (đuôi 07:37:47Z →
   08:25:47Z, tối đa 2 ẩn). 2 reboot đã chốt (#61 06:50:58Z, #62
   08:25:47Z) + tối đa 2 ẩn danh nghĩa. Probe #41 đợt sau tiếp
   tục. **Cần parent quyết:** có chấp nhận để mù #39 mở như mù
   #35/#37/#38 hay giao luồng điều tra thêm — T4 khuyến nghị
   ĐỂ MỞ (đuôi J là máy yên toàn diện sau khi đợt 120 đóng xong;
   không còn nguồn nào để đóng: 0 exec-log, 0 session, 0 file
   /tmp trong đuôi; chỉ còn cách chờ parent cung cấp bằng chứng
   nếu có).
2. **Mù #38 đoạn G: THỬ CUỐI — VẪN MỞ (mới, §2.6).** Không còn
   nguồn nào để đóng G. **Cần parent quyết:** chấp nhận để mù
   #38 mở như mù #35/#37 (T4 khuyến nghị ĐỂ MỞ) hay giữ mở chờ
   bằng chứng từ bên ngoài VM.
3. **Bước nhảy clock tại #63 (mới, §2.2):** X ∈ [6, 195] s, giả
   thuyết chính (a) nhảy ngay tại reboot. **Cần parent biết:**
   gap #62→#63 chỉ còn là khoảng [1.638, 1.833] s (mid
   1.735,5 s); nếu parent có bằng chứng độc lập về giờ thật của
   #63 (ví dụ log bên ngoài VM) thì luồng EPERM đợt sau chạy lại
   số. T4 khuyến nghị thêm **standing check mới: mỗi lượt EPERM
   đối chiếu giờ poll cuối của poller với btime boot kế tiếp**
   (phát hiện bước nhảy sớm — đã phát hiện #58 và #63 bằng cách
   này; xem §4.2) — cần parent duyệt vì đây là thay đổi quy
   trình chung. (T5-120 đã đề xuất, chưa thấy quyết.)
4. **Gap #60→#61 = 2h05'09" ĐƯỢC CHỨNG NHẬN (mới — xem §2.5,
   CERT n=34, FULL n=49; caveat F61 chưa kiểm + cận nhảy X ≤
   36 s).** Cần parent xác nhận cách chứng nhận điểm khi F chưa
   kiểm (như đã làm với #54→#55 và #58→#59); nếu không đồng ý
   thì hạ gap này về cận trên, CERT về n=33 (FULL về n=48).
5. **Đề xuất standing check (cần parent duyệt, nhắc lại từ
   T6-119 §5 mục 4 và T5-120 §5 mục 4):** lượt cron BỎ QUA (vì
   chốt chặn) ghi thêm boot_id + `uptime -s` vào build-loop-log
   — lượt 15:35 đã mở đợt 121 lúc 08:35Z, ngay sau #62; nếu có
   lượt cron nào chạy trong đuôi đoạn J thì đoạn J đã hẹp hơn
   nhiều. T5/T4 KHÔNG tự đổi hành vi cron — chờ parent duyệt.
6. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
   --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
   117, chưa trả lời). Watcher này sẽ lấp đúng loại lỗ như đuôi
   đoạn J của mù #39.
7. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
   parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
   117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
8. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi**
   (u2net là fallback chính thức). Max RAM trong mù #39 là
   1,98 GB (32% guard).
9. **EPERM không tuyên bố đã hết** (sóng gần nhất ~116h29'45"
   trước probe #40). **Không kiểm lại TTS 39** (cấm).
   ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
   #31/#35 chờ user quyết** (không tự quyết).
