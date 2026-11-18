# PHASE9 ROUND124 T7 — EPERM: probe #43 + mù #42 đoạn A ĐÓNG + gap #66→#67 CHỨNG NHẬN DẠNG KHOẢNG + mù #43 MỚI MỞ (gap #67→#68 SPAN) + mù #40 B (T3-124: VẪN MỞ) + RAM max 4.576 MB (76% guard, cao nhất từ trước)

> Luồng T7, đợt 124 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07,
> 17/11/2026; làm việc 17:41Z → 17:58Z 16/11/2026).
> Nhiệm vụ: probe #43 + mù #42 (gap #66→#67 danh nghĩa 27'36") điều
> tra/đóng + mù #43 MỚI (gap #67→#68 danh nghĩa 2h41'32") mở điều
> tra + EPERM sweep + WFS lần 30 + RAM (birefnet: KHÔNG chạy — vẫn
> dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round124-t7/prereg-t7.md (định nghĩa probe #43, mốc đối
> chiếu, tiêu chí đóng mù #42, dự báo gap #66→#67 chứng nhận dạng
> khoảng + gap #67→#68 KHÔNG chứng nhận được + dự báo mù #43 MỞ).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #39 J** (parent
> chấp nhận ĐỂ MỞ, quyết đợt 123 §12.2) **và KHÔNG kiểm lại mù #40
> B** (việc của T3 đợt này — T7 chỉ ghi nhận kết quả T3 trên đĩa,
> xem §2.6). G1 + mù #22/#28/#29/#30/#31/#35 chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (17:43:19Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.730 s, last #42 14:44:29Z, boot
  9bbda390, exit 1); `once` ngay sau đó là **probe #43, boot
  69359761, ok=2 fail=0**, exit 0, 17:43:19Z; `status` chạy lại
  **ALIVE** (age 0 s, n=43), exit 0. Log v2 tăng đúng **3 dòng**
  (118 → 121) — **như R7/S7/T7/T6/T5/T4 (+3)**; prereg §1 đã dự báo
  đúng +3 trước khi đo. Heartbeat nay n=43, ts 17:43:19Z, boot
  69359761.
- **Boot #68 (tạm) lúc 17:33:51Z, boot
  `69359761-1650-4956-b3cb-481410689a9b`** — xác minh bằng `uptime -s`
  + btime 1794850431 + `who -b` + journal 1 boot (xem §1). Clock VM hiện tại CHÍNH
  XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u`
  trong 0–1 s) → **F68 ≈ 0**.
- **Khoảng mù #42: 14:44:29Z → 17:43:19Z (2h58'50") — KHÔNG ĐÓNG
  HOÀN TOÀN (A + C đóng, B mở, tối đa 3 ẩn).** Đoạn A **ĐÓNG** (probe
  #42 là đầu đoạn + poller T10 run 1 + gate0-wait T9 b66 + 67 mốc
  mtime, lỗ lớn nhất chỉ 38 s + đuôi 29 s + cửa sổ sàn RỖNG vì đoạn
  chỉ dài 470 s < sàn 1.147 s); đoạn B **MỞ** (đuôi 4.503 s sau mốc
  cuối 16:18:47Z, 0 session bắc qua cắt B-hi, 0 file trong đuôi ở cả
  4 phạm vi); đoạn C **ĐÓNG** (uptime trực tiếp lúc probe #43 +
  dấu boot tươi). **2 reboot đã chốt trong mù (#67 14:52:19Z, #68
  17:33:51Z — cả hai đều có giây chính xác trên đĩa) + tối đa 3 ẩn
  danh nghĩa trong đuôi đoạn B.**
- **Gap #66→#67 = KHOẢNG [27'06", 28'28"] ([1.626, 1.708] s, mid
  27'47" = 1.667 s) ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG (mới, xem
  §2.5).** Điều kiện: đoạn A mù #42 đã đóng (xem §2.3). Dạng khoảng
  vì F67 CHƯA BAO GIỜ được kiểm trực tiếp (0 kiểm HTTP Date trong
  boot #67) nên chỉ có cận nhảy X ∈ (−30, +52) s từ quan sát (0
  nhân chứng nhảy — xem §2.2), không chứng nhận điểm sạch. CERT
  n=37 → **n=38**; FULL n=52 → **n=53** (cùng với gap này). Dải
  chứng nhận [19'07", 3h14'08"] không đổi.
- **Gap #67→#68 = 2h41'32" (9.692 s) VẪN CHỈ LÀ SPAN — KHÔNG
  chứng nhận được (mới, mù #43, xem §2.5).** Đoạn B mù #42 mở,
  đuôi 4.503 s, tối đa 3 ẩn. Còn thiếu gì để chứng nhận: đúng 1
  quan sát trong đuôi sau cắt B-hi 17:14:44Z (xem §2.6).
- **Mù #40 đoạn B: VẪN MỞ (ghi nhận kết quả T3 đợt 124 — xem
  §2.6).** T3 kiểm lại lần 3 với 9 góc mới, 606.207 file: 0 bằng
  chứng mới; quan sát cuối dời +0,37 s lên 10:42:19.788Z (2 thư
  mục tool-output rỗng); đuôi còn 1.378,2 s > sàn. Gap #63→#64
  VẪN SPAN.
- **Mù #39 đoạn J: KHÔNG KIỂM LẠI lượt này** (parent chấp nhận
  ĐỂ MỞ, quyết đợt 123 §12.2 — T7 tuân thủ brief, không đụng).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" (mẫu hoa O) trong
  109 file *.log có mtime trong mù #42 (0 file repo-1, 109 file
  hidden_files); 4 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả launcher đã biết** (T1 + T2 + 2× T10-O8). Quét mở rộng: **56
  match / 50 dòng duy nhất — phân loại hết** (39 dòng tên file/bản
  oversize trong 3 log recount/driver + 6 dòng test-pass hasEperm +
  4 dòng launcher trên + 1 dòng trích dẫn tên file LIMITS trong log
  T3). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7) —
  **~125h48'** trước probe #43. EPERM vẫn KHÔNG được tuyên bố là
  đã hết.
- **Quét writeFileSync lần 30: 830 dòng / 233 file** (phạm vi 2.988
  file); R7b đối chiếu 855 dòng / 250 file; copies 25 dòng / 17
  file — y hệt lần 29 về copies; đối chiếu chéo 830+25=855=R7b,
  **chênh 0 — lần thứ ba mươi liên tiếp**. +9 dòng / +2 file so
  với lần 29, giải thích đúng hết bằng diff (xem §2.7).
  Async `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** (+ 1
  bản build dist cũ của cùng helper) — 0 stray; mtime không đổi từ
  10–11/11.
- RAM: max biết được trong mù #42 **4.576 MB** (T9 poll, 14:50:09Z,
  đoạn A) = **76% ngưỡng guard — CAO NHẤT TỪ TRƯỚC TỚI NAY**
  (vượt max cũ 3.189 MB mù #40); đoạn B max 1.824 MB, đoạn C không
  có mẫu. **Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong
  gói** — 4.576 MB vẫn dưới guard 6 GB; RAM đã đổi mạnh (2,79 →
  4,58 GB) nên T7 ghi rõ để parent quyết có thử lại birefnet
  không (xem §3 + §5 mục 7). MemTotal VM 7,93 GB — guard 6 GB về
  nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.
- **Reboot #68 — ghi nhận MỚI về replay:** dpkg.log CHỈ CÒN bracket
  boot #68 (configure 17:35:42Z +1m51 → gstreamer1.0-tools
  17:38:42Z +4m51, 1.509 dòng — replay đầy đủ); **`/var/log/apt/`
  TỒN TẠI lần đầu** (tạo 17:38:42Z, history.log kết thúc
  17:38:42Z). dpkg.log của boot #67 đã mất theo reboot (như
  journal/wtmp — /var/log reset mỗi boot); bản ghi T7-123 (2 dòng
  14:52:59Z) là bằng chứng duy nhất còn lại.
- **Đợt 124 lúc T7 đóng (17:58Z):** T1/T3/T5/T6/T8 đã DONE (LIMITS
  trên đĩa); T2/T4/T9/T10 còn chạy. Hạn cứng đóng đợt 20:15Z.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 17:41:11Z | boot_id `69359761-1650-4956-b3cb-481410689a9b`; `who -b` Nov 16 17:34; `uptime -s` **2026-11-16 17:33:51**; btime **1794850431 = 2026-11-16T17:33:51Z**; journal chỉ 1 boot (69359761, first entry 17:34:06Z, last 17:42:21Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #67 đã mất theo reboot #68, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 17:43:19Z | **DEAD/STALE**, heartbeat n=42, ts 14:44:29Z, boot 9bbda390, age **10.730 s** (đúng 2h58'50"); last sample probe #42; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 17:43:19Z | **probe #43, boot=69359761, ok=2 fail=0**, exit 0; dòng `boot changed 9bbda390 -> 69359761` (uptime since 2026-11-16 17:33:51) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 17:43:19Z | **ALIVE**, age 0 s, n=43, exit 0 |

Kiểm lại từ đĩa: log probe v2 **121 dòng** — 118 sau T7 đợt 123 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #42 +
dòng `boot changed` + dòng probe #43). **Như R7/S7/T7/T6/T5/T4
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #42 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=43, ts 2026-11-16T17:43:19Z, boot
69359761-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (34 dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #68: T5 đợt 124 đã có file trên đĩa lúc
probe (t5-postboot-b68-try1.log trong round124-t5) + T6 đợt 124
đang làm việc (round124-t6 có file analyze...) + driver mở đợt
124 (round-in-progress.md mtime 17:37:46Z) + 2 session đợt 124
trong vùng C (birth 17:37:24Z, 17:42:59Z — xem §2.3) + 28 mốc
mtime trong vùng C (mốc đầu 17:37:46Z — lúc mở đợt 124; mốc cuối
17:43:10Z). **Số thứ tự TẠM THỜI** (mù #35 chưa đóng, tối đa +24 ẩn
danh nghĩa, cộng thêm tối đa +29 từ mù #37, +6 từ mù #38 đoạn G,
+2 từ mù #39 đoạn J, +1 từ mù #40 đoạn B và +3 từ mù #43 đoạn B →
"thực tế #68" có thể tới #138; xem §2.2).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #42 (14:44:29Z → 17:43:19Z, 2h58'50")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #43: `uptime -s` = **2026-11-16 17:33:51Z**,
  boot_id `69359761-1650-4956-b3cb-481410689a9b` — khác boot của
  probe #42 (9bbda390).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (17:41Z): chỉ **1 boot**
  (69359761, first entry 17:34:06Z, last 17:42:21Z). Journal/wtmp
  của boot 94e29be5 đã mất theo reboot #68 — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #68: bracket replay ĐẦY ĐỦ (MỚI — khác các boot
  trước):** file `/var/log/dpkg.log` lúc kiểm tra có **1.509 dòng,
  tất cả trong cửa sổ boot #68** — dòng đầu `2026-11-16 17:35:42
  startup packages configure` (+1m51 sau boot), dòng cuối
  gstreamer1.0-tools 17:38:42Z (+4m51). **`/var/log/apt/` TỒN TẠI
  lần đầu** (eipp.log.xz + history.log + term.log, đều mtime
  17:38:42Z; history.log kết thúc `End-Date: 2026-11-16 17:38:42`).
  Trước đây /var/log/apt/ KHÔNG TỒN TẠI (đợt 120/121/122/123).
  T7 ghi nhận hiện tượng, không tự giải thích nguyên nhân (có thể
  do replay đợt 124 chạy `apt-get update` — việc của T5).
- **dpkg.log của boot #67 đã MẤT** (0 dòng 14:5xZ còn lại — file
  hiện tại bắt đầu 17:35:42Z): /var/log reset mỗi boot. Bản ghi
  T7-123 (2 dòng 14:52:59Z, configure +40 s) là bằng chứng duy
  nhất còn lại cho bracket #67.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123). `btmp` cũng chỉ bắt đầu 17:34:06Z (boot hiện tại).

### 2.2 Hai reboot đã chốt trong mù — #67 (14:52:19Z), #68 (17:33:51Z) — và cận nhảy clock tại #67

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 67 | **14:52:19Z** (chính xác từng giây) | 9bbda390 → 94e29be5 | Chốt từ T7-123 (uptime -s đọc tươi 14:53:11Z + btime 1794840739 + journal 1 boot + dpkg 2 dòng 14:52:59Z) + T3-123 xác nhận độc lập (phát hiện 14:54:32Z, uptime-s 14:52:19Z, boot_id 94e29be5-…). **Số thứ tự TẠM THỜI. Thuộc mù #42 — đoạn A đóng lượt này.** |
| 68 | **17:33:51Z** (chính xác từng giây) | 94e29be5 → 69359761 | Chốt từ lượt này: `uptime -s` đọc tươi (17:41:11Z) + btime 1794850431 + `who -b` 17:34 + boot_id 69359761 + journal first entry 17:34:06Z + probe #43 17:43:19Z boot 69359761 ok=2 fail=0 + driver mở đợt 124 17:35Z + 2 session đợt 124 trong vùng C (birth 17:37:24Z, 17:42:59Z). **Số thứ tự TẠM THỜI.** |

**Clock:** F68 ≈ 0 (`date -u` 17:43:31Z vs HTTP `Date`
example.com 17:43:33Z, google.com 17:43:33Z, cloudflare.com
17:43:34Z — khớp trong 0–1 s, phần lệch là thời gian chạy tuần
tự 3 lệnh curl). F66 ≈ 0 (đã kiểm 14:41Z đợt 123, trên boot #66).
**F67 CHƯA BAO GIỜ ĐƯỢC KIỂM** — grep toàn bộ log round123 (T1–T10):
**0 kiểm HTTP Date nào trong boot #67** (14:52:19Z–17:33:51Z).
Đây là lý do gap #66→#67 chỉ chứng nhận được DẠNG KHOẢNG, không
phải điểm (xem §2.5).

**CẬN NHẢY CLOCK TẠI #67 — X ∈ (−30, +52) s, 0 NHÂN CHỨNG (mới,
lượt này):**
- **0 nhân chứng nhảy tại #67:** **0 session** sinh trước
  14:52:19Z có mtime sau 14:52:19Z (quét 296 exec-log — tăng từ
  262 đợt 123 vì đợt 124 đã tạo thêm log). Không có tiến trình
  nào viết qua reboot như poll #37 tại #65.
- **Cận TRÊN X < 52 s (nhảy lùi):** gate0-wait T9 b66 poll #5 tới
  hạn ~14:53:11Z không bao giờ ghi. Tiến trình này CÒN SỐNG tới
  poll #4 (14:51:11Z ghi rõ `apt_procs=1` nên gate CHƯA đạt —
  script chỉ exit khi đủ 4 điều kiện gồm apt=0; đọc code
  gate0-wait-t9-b66.sh đã xác minh) rồi sleep 120 s và sẽ poll
  tiếp — reboot đã giết nó trước. Theo cùng cách tính như T4-121
  (X ≤ giờ tới hạn của poll bị lỡ − btime): X < 14:53:11Z −
  14:52:19Z = **52 s**. (Cận phụ độc lập yếu hơn: T10 poller run 1
  poll #3 tới hạn ~14:56:02Z không ghi → X < 223 s.)
- **Cận DƯỚI X > −30 s (nhảy tới):** quan sát cũ-clock muộn nhất
  trước #67 là **14:51:49Z** (4 file probe của T1 đợt 123:
  r2-bridge.log, r2-vite-attempt1.log, probe-results.json,
  probe-log.txt — đều mtime 14:51:49Z trên boot #66). Reboot thật
  (đồng hồ cũ) phải SAU quan sát này → X > 14:51:49Z − 14:52:19Z
  = **−30 s**. (Cận phụ từ session: mtime muộn nhất 14:51:46Z →
  X > −33 s; lấy cận chặt −30 s từ file mtime.)
- **Quy ước đứng:** cận trên dùng quy ước T4-121 (btime ≈ thời
  điểm reboot, POST không tách riêng) — nếu parent bác quy ước
  này thì gap #66→#67 rơi về khoảng nửa-mở [1.626 s, ∞) và phải
  HỦY chứng nhận (xem §5 mục 4). Cận dưới −30 s không phụ thuộc
  quy ước này (chỉ dùng quan sát cũ-clock + F66 ≈ 0). Caveat nhỏ:
  poll #5 ghi lúc echo, chậm ~1 s sau giờ tới hạn 14:53:11Z —
  cận trên an toàn thực tế là X < 53 s; T7 giữ 52 s theo giờ tới
  hạn như tiền lệ T4-121/T7-123, chênh 1 s không đổi verdict.
- **Không có dấu nhảy clock tại #68 (bằng chứng âm tính có kiểm
  chứng):** **0 session** sinh trước 17:33:51Z có mtime sau
  17:33:51Z (quét 296 exec-log); F68 ≈ 0 đã kiểm bằng HTTP Date
  trong boot #68. Không có cadence nào bắc qua #68 để đặt cận
  (poller đợt 123 dừng 15:43:21Z theo thiết kế trigger 9/9; đợt
  123 đóng 16:12Z; máy yên sau đó) — nhưng khác #64 ở chỗ F68
  đã kiểm trực tiếp.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #66→#67 = **KHOẢNG [27'06", 28'28"]** ([1.626, 1.708] s, mid
  27'47" = 1.667 s) — **ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG lượt này**
  (đoạn A đóng, xem §2.5).
- Gap #67→#68 = **2h41'32"** (9.692 s) — **VẪN CHỈ LÀ SPAN** (đoạn B
  mù #42 mở, xem §2.6).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):** #69 từ
  #68: [18:09:56Z, 20:28:21Z] (p10–p90 FULL53); hiệu dụng sau probe
  #43: [17:43:19Z, 20:28:21Z].

**Reboot #68 — CHỈ GHI NHẬN giờ + bracket replay (mới, xảy ra
trước khi T7 mở):**
- Reboot này xảy ra TRƯỚC lượt cron 00:35 +07 (17:35Z) — đợt 124
  mở trên boot #68 (round-in-progress.md mtime 17:37:46Z, RAM lúc
  mở 1.627 MB). Gap #67→#68 danh nghĩa 2h41'32" thuộc mù #43
  (đoạn B mù #42), để điều tra tiếp — T7 mở điều tra lượt này,
  kết luận đoạn B MỞ (xem §2.3).
- **Số thứ tự TẠM THỜI** (như #67).

### 2.3 Hoạt động trong khoảng mù — vì sao A + C đóng, B mở

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **14 file** +
hidden_files **313 file**; **327 file, 317 mốc giây phân
biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 19/P6 §4 mục
20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/T6 đợt 118 §2.3/T6
đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123 §2.3). Chia mù làm ba đoạn bởi
#67 (14:52:19Z) và #68 (17:33:51Z):

- **Đoạn A: 14:44:29Z → 14:52:19Z (7'50", boot #66 9bbda390) —
  ĐÓNG bằng probe #42 là đầu đoạn + poller T10 run 1 +
  gate0-wait T9 b66 + mật độ mtime dày + cửa sổ sàn RỖNG:**
  - Probe #42 (14:44:29Z) LÀ đầu đoạn (0 s) — mốc đầu tiên trong
    hai cây cũng là 14:44:29Z.
  - **Đoạn A dài 470 s < sàn 1.147 s — cửa sổ sàn RỖNG**
    (A-lo = 14:44:29Z + 1.147 s = 15:03:36Z > A-hi = 14:52:19Z −
    1.147 s = 14:33:12Z). Không reboot ẩn nào vừa được dưới luật
    sàn: ẩn cần ≥1.147 s từ cả #66 và #67, tổng ≥2.294 s >
    1.656 s = gap #66→#67 (tính bằng code, xem blind42-gaps.py).
    Đây là lần đầu một đoạn đóng bằng cửa sổ sàn rỗng (các đoạn
    trước đều dài hơn sàn).
  - **Poller T10 đợt 123 run 1 là 1 tiến trình duy nhất (kiểm
    bằng code poll-t10.log: 1 dòng START 14:46:02Z boot
    9bbda390):** 2 poll #1–#2, đúng số thứ tự, đúng **300 s**
    mỗi bước, 14:46:02Z → 14:51:02Z. Poll #3 tới hạn ~14:56:02Z
    không bao giờ ghi — reboot #67 đã giết poller (T10 đóng đợt
    123 xác nhận).
  - **Gate0-wait T9 b66 (observer độc lập thứ hai, 1 tiến trình
    duy nhất — script bash tuyến tính):** 4 poll #1–#4, đúng
    số thứ tự, bước 120–121 s, 14:45:10Z → 14:51:11Z. Poll #5
    tới hạn ~14:53:11Z không ghi — chính là cận trên nhảy X <
    52 s (xem §2.2).
  - Mật độ mtime củng cố: **67 mốc**, lỗ lớn nhất chỉ **38 s**
    (14:51:11Z → 14:51:49Z); mốc đầu 14:44:29Z (= giờ probe),
    mốc cuối 14:51:49Z (4 file probe T1 đợt 123); **11 session**
    chạm đoạn A (trong đó T4 gate #66 đạt 14:50:01Z, T2 att4
    driver 14:43:43Z–14:43:44Z, T5 watcher b66 7 poll).
  - Đầu: probe #42 14:44:29Z (0 s). Đuôi: quan sát cuối
    14:51:49Z → #67 14:52:19Z = **29 s** < sàn 1.147 s.
  - **Kết luận đoạn A: ĐÓNG.**
- **Đoạn B: 14:52:19Z → 17:33:51Z (2h41'32", boot #67 94e29be5) —
  MỞ vì đuôi 4.503 s sau mốc cuối 16:18:47Z:**
  - **Poller T10 đợt 123 run 2 là 1 tiến trình duy nhất:**
    RESTART 14:53:21Z boot 94e29be5; 11 poll #1–#11, đúng số
    thứ tự, đúng **300 s** mỗi bước, 14:53:21Z → 15:43:21Z
    (trigger 9/9, phase 1 kích hoạt). Đóng (14:53:21Z,
    15:43:21Z] theo đồng hồ ghi.
  - **Gate0-wait T9 b67 (observer độc lập thứ hai, 1 tiến trình
    duy nhất):** 6 poll #1–#6, đúng số thứ tự, bước 120–121
    s, 14:54:11Z → 15:04:13Z.
  - **Driver T2 att5 (observer thứ ba):** chạy 14:56:27Z →
    15:01:18Z trên boot #67 (probe exit 0 15:00:28Z–15:01:03Z).
  - **T4 leg B (observer thứ tư):** driver 14:59:38Z →
    15:05:55Z trên boot #67 (6/6 VALID).
  - **T9 lượt yên (observer thứ năm):** 3 attempt, 30 poll,
    15:05Z → 15:36Z (gate A không mở vì RAM ghim).
  - **T10 đóng đợt 123 (observer thứ sáu):** phase 1
    15:43:21Z–15:47:08Z, O8 Chromium 21/21 + WebKit 21/21,
    closing tới **16:18:47Z** (docs/PHASE9_ROUND123_LIMITS.md).
  - Mật độ mtime: **222 mốc**, lỗ lớn nhất **4.503 s** — chính
    là đuôi (16:18:47Z → 17:33:51Z); các lỗ còn lại đều < 300 s.
    Mốc đầu 14:52:44Z (26 s sau đầu đoạn); mốc cuối
    **16:18:47Z**. **20 session** chạm đoạn B.
  - **2 session bắc qua cắt B-lo (15:11:26Z)** (birth
    15:08:45Z mtime 15:11:44Z; birth 15:08:58Z mtime
    15:28:58Z) — nhưng **0 session bắc qua cắt B-hi
    (17:14:44Z)** và **0 session chạm đuôi B**
    (17:14:44Z, 17:33:51Z].
  - Đuôi: mốc cuối 16:18:47Z → #68 17:33:51Z = **4.503 s** >>
    sàn 1.147 s. File trong đuôi (sau cắt B-hi) ở cả 4 phạm vi:
    repo-1 **0**, hidden_files **0**, ngoài cây **0**, /tmp **0**
    — đuôi HOÀN TOÀN TRỐNG. /tmp: 0 file trong cả mù #42.
  - **Kết luận đoạn B: MỞ — tối đa 3 ẩn danh nghĩa**
    (⌊4.503/1.147⌋ = 3, cùng cách đếm như mù #40 B tối đa 1 ẩn
    với đuôi 1.379 s và mù #39 J tối đa 2 ẩn với đuôi 2.880 s).
- **Đoạn C: 17:33:51Z → 17:43:19Z (9'28", boot #68 69359761) —
  ĐÓNG bằng đo uptime trực tiếp + probe #43 + dấu boot tươi:**
  - **`uptime -s` lúc 17:41:11Z = 17:33:51Z** chứng minh máy up
    liên tục từ #68 tới lúc đo; probe #43 17:43:19Z đọc boot_id
    69359761 tươi — cùng boot_id với boot bắt đầu 17:33:51Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C.) Đoạn C dài 568 s < sàn nên
    không áp cắt; uptime trực tiếp là closer cho toàn đoạn.
  - **Chuỗi dấu boot tươi củng cố:** driver mở đợt 124
    (round-in-progress.md mtime 17:37:46Z) + 2 session đợt 124
    trong vùng C (birth 17:37:24Z, 17:42:59Z) + 28 mốc mtime
    (mốc đầu 17:37:46Z — lúc mở đợt 124; mốc cuối 17:43:10Z —
    prereg của chính T7). Lỗ mtime (17:33:51Z → 17:37:46Z] 236 s
    là máy yên sau boot (lượt cron 00:35 +07 mở đợt 124 lúc
    17:35Z), không observer — nhưng uptime đóng đoạn này.
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #42 KHÔNG ĐÓNG HOÀN TOÀN.**
Đoạn A + C đóng; đoạn B mở (đuôi 4.503 s trống hoàn toàn);
2 reboot đã chốt giờ (#67 14:52:19Z, #68 17:33:51Z — cả hai
chính xác từng giây trên đĩa) + **tối đa 3 ẩn danh nghĩa**.
Mù #43 (brief đặt tên cho gap #67→#68 = đoạn B này): **MỞ**.

Ngoài hai cây: **82 file** có mtime trong mù #42 (chủ yếu là
exec-log của các agent + batch stage repo-1-push + file
proactivity/memory); **/tmp: 0 file** có mtime trong mù #42.
Boot_id nhắc trong exec-log sinh/viết trong mù: 9bbda390 4 file,
94e29be5 10 file, 69359761 1 file.

### 2.4 Quét sóng EPERM trong mù #42 — 0 sóng thật (bằng chứng âm tính)

Quét toàn bộ file *.log có mtime trong mù #42 (bằng script
eperm-sweep.py; eperm-sweep*.log của chính mình bị loại theo bài
học T7 §4 mục 19). **Lưu ý vận hành:** lần chạy sweep đầu tiên
cho 0 file do lỗi sed khi chuyển cửa sổ (B0 bị ghi đè thành B1);
T7 phát hiện ngay (0 file là bất thường so với 171 file đợt
123), viết lại script bằng placeholder và chạy lại — kết quả
dưới đây là của lần chạy đã sửa cửa sổ, window
[14:44:29Z, 17:43:19Z] đã xác minh trong code:

| Phạm vi quét | "vẫn bật" | "CẢNH BÁO 10 phút" | "Operation not permitted" | "sóng EPERM đã tắt" |
|---|---|---|---|---|
| repo-1 (0 file) | 0 | 0 | 0 | 0 |
| hidden_files (109 file) | 0 | 0 | 0 | **4** (dương tính giả đã biết, xem dưới) |
| **Tổng 109 file** | **0** | **0** | **0** | **4 FP** |

4 dòng "đã tắt" đều là dương tính giả launcher đã biết — không
phải sóng thật:
- 1× run-t1.log (14:50:15Z — T1 đợt 123, launcher vite).
- 1× run-t2.log (15:00:29Z — T2 đợt 123, launcher vite).
- 2× t10-o8.log (15:47:25Z, 15:48:19Z — T10 đợt 123 O8 driver
  launcher, cùng mẫu như 2× đợt 123 và 4× đợt 119).

Quét mở rộng `/eperm|not permitted/i`: **56 match / 50 dòng
duy nhất** — phân loại hết (56 match vì 6 dòng suites chứa cả
"hasEperm" lẫn "EPERM" nên mỗi dòng đếm 2 match — cùng mẫu như
T7-123: 50 match / 44 dòng):
- 39 dòng tên file/bản oversize trong 3 log recount/driver/phase1
  của T10 (13 dòng mỗi file: 1 dòng tên batch
  `phase9-round123-t7-eperm.txt` + 12 dòng `oversize:
  docs/PHASE9_ROUND1xx_*_EPERM_LIMITS.md <size>`) — chỉ là tên
  file LIMITS EPERM trong danh sách, không phải sự kiện EPERM.
- 6 dòng test-pass hasEperm trong round123-t10-suites.log (test tự
  kiểm "not permitted" như kết quả mong đợi).
- 4 dòng launcher T1/T2/T10-O8 trên.
- 1 dòng trích dẫn tên file trong round123-t3/blind39J-t3v2.log
  (dòng `H 2026-11-16T11:52:31 2x .../PHASE9_ROUND122_T7_EPERM_LIMITS.md`
  — output quét của T3, không phải sự kiện EPERM).
**0 sóng EPERM thật.**

- Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7 đợt 115) —
  **~125h48'** trước probe #43 (17:43:19Z).
- EPERM **không** được tuyên bố là đã hết — như R7/S7/T7/T6/T5/T4:
  1 lượt không sóng = bằng chứng âm tính cho lượt đó, không phải
  kết luận hệ thống.

### 2.5 Phân phối gap — CERT n=38, FULL n=53 (mới: +1 gap từ mù #42)

**Gap #66→#67 = KHOẢNG [27'06", 28'28"] ([1.626, 1.708] s, mid
27'47" = 1.667 s) ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG.** Điều kiện:
đoạn A mù #42 đã đóng (xem §2.3). **CAVEAT (đứng, khác các gap
điểm):** F67 chưa bao giờ được kiểm trực tiếp nên gap này chỉ có
thể là khoảng, không phải điểm — cùng cách xử lý như #53→#54,
#57→#58, #62→#63 và #64→#65. Cận nhảy X ∈ (−30, +52) s từ quan
sát (0 nhân chứng nhảy + cận poll bị lỡ + cận quan sát cũ-clock
muộn nhất — xem §2.2); cận trên dùng quy ước T4-121 (btime ≈ thời
điểm reboot, POST không tách riêng); nếu parent bác quy ước này
thì gap rơi về khoảng nửa-mở [1.626 s, ∞) và phải hủy chứng nhận
(xem §5 mục 4). F66 ≈ 0 (±2 s, không gộp vào khoảng — cùng quy
ước như #64→#65). Độ nhạy đầu mút: CERT38-LO mean chỉ lệch −1 s,
CERT38-HI +1 s so với mid; median và p10/p90 không đổi (xem dưới).

**Gap #67→#68 = 2h41'32" (9.692 s) VẪN CHỈ LÀ SPAN — KHÔNG đưa
vào FULL/CERT** — đoạn B mù #42 mở, đuôi 4.503 s, tối đa 3 ẩn
(xem §2.3). Cùng luật như #55→#56 / #56→#57 (T6-119 §2.5), span
#59→#60 (10.680 s, T5-120 §2.5), span #61→#62 (5.689 s, T4-121
§2.5), span #63→#64 (7.933 s, T7-122 §2.5) và span #63→#64 đợt
123/124.

**Cross-check tái hiện T7(123) 100%:** chạy blind41-gaps.py
verbatim cho lại đúng CERT n=37 / FULL n=52 của T7 đợt 123 (xem
blind42-gaps.txt: CERT37 mean 1h46'30" median 1h58'14" p10
0h51'52" p90 2h25'21" sd 0h40'51"; FULL52 mean 1h52'16" median
1h58'05" p10 0h48'36" p90 2h57'56" sd 0h56'10" — khớp T7-123 §2.5
từng số).

Bảng so sánh (CERT = gap đơn/khoảng đã chứng nhận, thống kê dùng
mid; FULL = CERT + gap chưa chứng nhận + gap khoảng):

| | CERT n=37 (T7-123) | **CERT n=38 (T7-124)** | FULL n=52 (T7-123) | **FULL n=53 (T7-124)** |
|---|---|---|---|---|
| mean | 1h46'30" | **1h44'25"** | 1h52'16" | **1h50'40"** |
| median | 1h58'14" | **1h58'05"** | 1h58'05" | **1h57'56"** |
| p10 | 0h51'52" | **0h43'27"** | 0h48'36" | **0h36'05"** |
| p90 | 2h25'21" | **2h25'04"** | 2h57'56" | **2h54'30"** |
| sd | 0h40'51" | **0h42'16"** | 0h56'10" | **0h56'49"** |
| min | 19'07" | **19'07"** | 19'07" | **19'07"** |
| max | 3h14'08" | **3h14'08"** | 5h43'18" | **5h43'18"** |

- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới nằm
  giữa).
- **Độ nhạy đầu mút #66→#67:** CERT38-LO (1.626 s) mean
  1h44'24"; CERT38-HI (1.708 s) mean 1h44'26"; FULL53-LO mean
  1h50'39"; FULL53-HI mean 1h50'41" — lệch ±1 s so với mid;
  median và p10/p90 không đổi.
- **p10 tụt vì gap mới NGẮN:** gap #66→#67 (mid 27'47") là gap
  ngắn thứ hai trong các gap đã chứng nhận — chỉ sau gap 19'07"
  (min của dải, cũng là sàn); nó ngắn hơn #62→#63 (mid 28'55,5"),
  vốn là gap ngắn thứ hai trước đây. p10 CERT 51'52" → 43'27",
  p10 FULL 48'36" → 36'05". Gap ngắn không làm đổi sàn (min vẫn
  19'07") nhưng kéo p10 xuống — ghi rõ để parent khỏi ngạc nhiên
  khi thấy p10 đổi mạnh sau 1 gap.
- **Tốc độ reboot (đồng hồ ghi nhận):** 68 / 141,26 h = **1 reboot
  mỗi 124,6 phút** (từ #1 2026-11-10T20:18:10Z tới #68
  2026-11-16T17:33:51Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 72 / 141,26 h = **1 mỗi 117,7 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1) và mù #43
  đoạn B (+3).
- **Phân phối FULL53:** 29/53 trong 90–150 phút; 9 gap <60 phút;
  6 gap >180 phút; 2 gap >240 phút. Gap #66→#67 (mid 27'47") nằm
  NGOÀI khối chính (ngắn hơn p10 FULL53 36'05") — gap ngắn thứ
  hai đã chứng nhận (sau gap 19'07").
- **Lưu ý về #69:** gap danh nghĩa chưa biết; dải cơ học từ #68
  (p10–p90 FULL53): [18:09:56Z, 20:28:21Z]; hiệu dụng sau probe
  #43: [17:43:19Z, 20:28:21Z].

### 2.6 Trạng thái các mù cũ — mù #40 B (T3-124): VẪN MỞ; mù #39 J: KHÔNG KIỂM LẠI

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #43 (mới) | **MỞ (mới, lượt này, §2.3 đoạn B)** | Đuôi 4.503 s trống hoàn toàn, tối đa 3 ẩn; gap #67→#68 vẫn SPAN; 2 reboot đã chốt (#67, #68) |
| #42 | **KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'50", tối đa 3 ẩn)** | Đoạn A đóng → gap #66→#67 chứng nhận dạng khoảng; đoạn B mở = mù #43 |
| #41 | ĐÓNG HOÀN TOÀN | T7-123 §2.3; gap #64→#65 chứng nhận dạng khoảng, #65→#66 chứng nhận dạng điểm |
| #40 | KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'04", tối đa 1 ẩn) | **T3 đợt 124 kiểm lại lần 3: B VẪN MỞ** (xem dưới); 2 reboot đã chốt + tối đa 1 ẩn; gap #63→#64 vẫn SPAN |
| #39 | KHÔNG ĐÓNG HOÀN TOÀN (I+K đóng, J mở, 2h56'14", tối đa 2 ẩn) | **KHÔNG KIỂM LẠI lượt này — parent chấp nhận ĐỂ MỞ** (quyết đợt 123 §12.2) |
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | **Thử cuối đã thất bại đợt 121 — KHÔNG thử lại lượt này** (theo brief T7); cần parent quyết có chấp nhận để mở như mù #35/#37 hay không |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 §2.3 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#68 vẫn TẠM THỜI vì mù này |
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

**Mù #40 đoạn B — ghi nhận kết quả T3 đợt 124 (T7 KHÔNG điều tra
lại, theo brief):**
- T3 đã viết LIMITS trên đĩa lúc T7 đóng:
  docs/PHASE9_ROUND124_T3_BLIND40B_LIMITS.md (làm việc 17:41Z →
  17:52Z, 22.384 B). Kết luận headline: **B VẪN MỞ — lần kiểm tra
  thứ ba (T7-122, T7-123, T3-124) đều cho 0 bằng chứng mới.**
- Đợt này T3 thử **9 góc CHƯA TỪNG thử cho B**: birth, atime,
  ctime, directory-mtime, lịch sử cron scheduler cho cửa sổ đuôi,
  đọc sâu nội dung file JSON 10:42:19Z, 2 thư mục tool-output chạm
  đuôi, log probe v2, nhật ký memory ngày 16/11, đối chiếu danh
  sách đông lạnh blind40 đợt 122. Quét v2: **606.207 file** —
  mtime trong đuôi: **1** (file JSON đã biết, 10:42:19Z, biên trái
  đuôi); atime: **1** (cùng file); ctime: **1** (cùng file);
  birth: **0**; thư mục có mtime trong đuôi: **4** (đều
  10:42:19Z); session chạm đuôi: **0/294** (tăng từ 262); session
  bắc qua cắt B-hi (10:46:11Z): **0**.
- **Chi tiết mới duy nhất (không đổi verdict):** 2 thư mục
  tool-output rỗng của 2 session cũ (21482c1e, b501a4e2) có dirmtime
  **10:42:19.785Z / .788Z** — cùng một đợt gọi exec của phiên
  main-chat của parent lúc ~10:42:19Z (3 lệnh cùng lúc: 1 cho file
  JSON, 2 không để lại file). Quan sát cuối dời 0,37 s lên
  **10:42:19.788Z**; đuôi sau nó còn **1.378,2 s > sàn 1.147 s** —
  verdict không đổi.
- **Lịch sử cron scheduler cho cửa sổ đuôi (góc mới):** 2 lượt hẹn
  rơi vào đuôi sau cắt B-hi đều **THIẾU bản ghi chạy** — heartbeat
  17:50:50+07 (= 10:50:50Z) và deterministic-doctor 18:00+07 (=
  11:00:00Z); feed-pulse-18 không có lượt nào trong đuôi. 2 lượt
  thiếu là **mẫu drop đã biết của scheduler, cũng xảy ra trên boot
  khỏe** (T3-123 đã nêu đúng lượt heartbeat 17:50:50+07 trong boot
  #63 làm control) — **không dùng được theo chiều nào**.
- **Kết luận: B VẪN MỞ, gap #63→#64 VẪN SPAN.** T3 ghi "CERT giữ
  n=37, FULL giữ n=52 theo T7-123" — T3 không tính lại phân phối
  vì không có gap mới từ B; **T7 lượt này CÓ gap mới (#66→#67)
  nên CERT n=38, FULL n=53 (xem §2.5)** — T10 đóng đợt cần lấy số
  của T7, không lấy số T3.
- **Còn thiếu gì để chứng nhận gap #63→#64 (không đổi):** đúng
  **1 quan sát sau 10:46:11Z** trong đuôi (10:42:19Z, 11:05:18Z]
  (xem §2.7). Ngay cả khi B được đóng, gap #63→#64 vẫn mang caveat
  F64 chưa kiểm nên chỉ chứng nhận được dạng ĐIỂM CÓ CAVEAT hoặc
  KHOẢNG nếu tìm được cận nhảy; không chứng nhận điểm sạch.

**Mù #39 đoạn J — KHÔNG kiểm lại lượt này (theo brief + quyết
parent đợt 123 §12.2: CHẤP NHẬN ĐỂ MỞ).** T7 không quét lại J,
không ghi nhận gì thêm ngoài trạng thái đã biết (I+K đóng, J mở,
tối đa 2 ẩn).

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 30 — chênh 0 (lần thứ 30 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T4 trong round121-t4, đổi OUT sang
  round124-t7) **17:52:17Z → 17:52:47Z 16/11 (30 s, có SCAN-END)**.
  Scan chạy trên boot #68, SAU khi mù #42 đã đóng bằng probe #43
  (17:43:19Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **830 dòng / 233 file** (phạm vi 2.988 file); R7b đối
  chiếu: **855 dòng / 250 file** (phạm vi 12.381 file); copies:
  **25 dòng / 17 file** — y hệt lần 29. Đối chiếu chéo:
  830+25=855=R7b, **chênh 0**.
- **+9 dòng / +2 file so với lần 29** (821/231 → 830/233), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — mọi file đều về trước lúc scan bắt đầu 17:52:17Z 16/11; 0 file
  mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND123_T7_EPERM_LIMITS.md | +7 (0 → 7) | 11:52:31Z 16/11 | Tài liệu T7 đợt 123 (nhắc `writeFileSync` 7 lần); viết SAU scan lần 29 (14:54:01Z) nên lần này mới vào |
  | docs/PHASE9_ROUND123_LIMITS.md | +1 (0 → 1) | ~16:03Z 16/11 | Tài liệu gộp T10 đợt 123 (nhắc `writeFileSync` 1 lần); viết sau scan lần 29 |
  | PHASE9_GAP_ANALYSIS.md | +1 (23 → 24) | 16:11:10Z 16/11 | T10 đóng đợt 123 cập nhật §52 (nhắc `writeFileSync` thêm 1 lần); viết sau scan lần 29 |
- Phạm vi: 2.988 = 2.973 + 15 net (15 file mới, **0 file mất**:
  kiểm bằng diff danh sách file — 0 dòng `<`; 15 file mới gồm 9
  LIMITS đợt 123 (T1/T2/T3/T4/T5/T7/T8/T9 + gộp) + 4 LIMITS đợt
  124 (T1/T5/T6/T8) + 2 script probe F2 đợt 124 (T4)).
- **Kết luận: 30 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #42.

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
  né EPERM trong mù #42.

## 3. RAM trong mù #42 — max 4.576 MB (76% guard, CAO NHẤT TỪ TRƯỚC), birefnet KHÔNG chạy

- **2 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #42 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 17:54:50Z | **2.665.208 kB** | Trước khi viết LIMITS (boot #68) |
  | 17:57:08Z | **2.431.232 kB** | Trước khi viết LIMITS (boot #68) |
- **Max RAM biết được TRONG mù #42 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 114 mẫu RAM; **max 4.576 MB**
  (T9 poll-t9.log, 14:50:09Z, đoạn A, dòng `RAMavail=4576MB` đã
  xác minh trực tiếp trong log) = **76% ngưỡng guard** — **cao
  nhất từ trước tới nay** (vượt max cũ 3.189 MB mù #40 và 2.787 MB
  mù #41); đoạn B max **1.824 MB** (T9 poll-t9.log, 14:54:10Z,
  `RAMavail=1824MB`); đoạn C **không có mẫu nào** (máy yên sau
  boot, không observer ghi RAM).
- **Xác minh độc lập max đoạn A:** T4 gate0-wait-t4 #3 ghi
  **4.520 MB lúc 14:50:01Z** — hai observer độc lập (T9 poll +
  T4 gate0-wait) cùng ~4,5 GB trong vòng 8 s. Chuỗi tăng của
  gate0-wait b66 củng cố: 1.418 MB (14:45:10Z) → 2.948 MB
  (14:47:10Z) → 4.027 MB (14:49:11Z) → 4.239 MB (14:51:11Z) —
  RAM tăng dần khi replay boot #66 kết thúc (dpkg_lines 133 →
  1.509).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 4,58 GB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. **NHƯNG RAM ĐÃ ĐỔI MẠNH:** 2,79 GB (mù #41) → 4,58 GB
  (mù #42), từ 46% lên 76% guard. MemTotal VM là 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn
  (available tối đa < tổng, nhưng 6 GB < 7,93 GB nên không phải
  trần cứng). **T7 KHÔNG tự chạy birefnet** (brief cấm chạy lượt
  này; vẫn dưới guard nên chạy cũng bị guard từ chối) — ghi rõ
  để parent quyết có thử lại khi RAM đổi tiếp không (xem §5 mục
  7). Nếu một boot sau cho available ≥ 6 GB thì đó là lúc thử.

## 4. Ghi chú phương pháp (mới so với T7 đợt 123)

1. **Đoạn ngắn hơn sàn thì cửa sổ sàn RỖNG — đóng không cần
   poller phủ giữa (mới, §2.3 đoạn A):** đoạn A mù #42 chỉ dài
   470 s < sàn 1.147 s nên không có "cửa sổ sàn" để ẩn reboot —
   chứng minh bằng code (cần ≥2.294 s cho 1 ẩn, gap chỉ 1.656 s).
   Bài học: với gap ngắn (< 2× sàn), đoạn tương ứng tự đóng về
   mặt sàn; vẫn cần poller + mtime để đóng đầu/đuôi và đặt cận
   nhảy.
2. **Cận nhảy hai chiều từ quan sát (mới, §2.2):** tại #67 có cả
   cận trên (poll bị lỡ: X < 52 s) VÀ cận dưới (quan sát cũ-clock
   muộn nhất: X > −30 s) — không chỉ cận trên như #63/#65. Cận
   dưới dùng file mtime (không chỉ session) vì file mtime cũng là
   quan sát cũ-clock hợp lệ; lấy cận chặt nhất trong các nguồn.
   Bài học: lượt nào cũng phải quét cả hai chiều, không chỉ tìm
   nhân chứng nhảy.
3. **Kiểm tra code script trước khi dùng poll bị lỡ làm cận
   (mới, §2.2):** gate0-wait b66 poll #4 ghi `t5flag=PASS` —
   thoạt nhìn tưởng script đã exit (cận 52 s sẽ vô hiệu). Đọc code
   mới rõ: script chỉ exit khi đủ 4 điều kiện gồm apt=0, mà poll
   #4 có apt_procs=1 nên còn sống và sẽ poll #5. Bài học: đừng
   tin log một dòng — đọc điều kiện exit của script trước khi
   dùng sự vắng mặt của poll làm bằng chứng.
4. **Lỗi sed chuyển cửa sổ làm sweep ra 0 file (mới, §2.4):**
   sed thay `11:38:49Z→14:44:29Z` rồi `14:44:29Z→17:43:19Z` đã ghi
   đè B0 thành B1 (cửa sổ sụp thành 1 điểm). Phát hiện ngay vì 0
   file là bất thường (đợt 123 có 171 file); viết lại bằng
   placeholder @@B0@@/@@B1@@ rồi thay 1 lần. Bài học đứng: mọi
   script chuyển thể bằng sed hai lượt trên cùng chuỗi thời gian
   đều phải dùng placeholder — và mọi kết quả 0 đều phải đối
   chiếu với kỳ vọng trước khi tin.
5. **dpkg.log reset mỗi boot + /var/log/apt/ xuất hiện lần đầu
   (mới, §2.1):** dpkg.log hiện tại chỉ còn bracket boot #68
   (1.509 dòng); bracket #67 (2 dòng 14:52:59Z) đã mất — cùng mẫu
   như journal/wtmp (chỉ giữ boot hiện tại). /var/log/apt/ TỒN
   TẠI lần đầu (tạo 17:38:42Z). Bài học: bằng chứng /var/log của
   boot cũ chỉ tồn tại trong chính boot đó — luồng EPERM phải ghi
   bracket ngay trong lượt, không để đợt sau kiểm lại.
6. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo probe #43 boot 69359761 ĐÚNG; dự báo đoạn A ĐÓNG
   / C ĐÓNG ĐÚNG; dự báo đoạn B KHÔNG ĐÓNG ĐƯỢC ĐÚNG (đuôi thật
   4.503 s, dài hơn dự báo ~81' — dự báo đúng hướng, đuôi thật
   ngắn hơn vì mốc cuối là 16:18:47Z chứ không phải ~16:12Z);
   dự báo gap #66→#67 chứng nhận dạng khoảng + #67→#68 KHÔNG
   chứng nhận được ĐÚNG; dự báo EPERM 0 sóng ĐÚNG; dự báo WFS
   chênh 0 ĐÚNG (830 dòng, trong khoảng dự báo ~821–850); dự báo
   RAM max < 4,81 MB ĐÚNG (4.576 MB) — không sửa sau khi thấy số.
   (Prereg dự báo đúng CERT n=37→38, FULL n=52→53.)
7. **Kiểm lại boot trước khi viết LIMITS (17:57:08Z):** boot
   69359761 (#68), uptime-s 17:33:51Z — không có reboot mới thêm
   trong lúc làm việc; probe #43 và mù #42 không bị ảnh hưởng.
8. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
   model đóng/nhạc bản quyền.**
9. **Stage batch:** chỉ 1 file text (LIMITS doc này),
   NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
   checkpoint3.txt + stage file).
10. **Ghi rõ:** số thứ tự reboot #47–#68 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
11. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F67 chưa kiểm (0 kiểm HTTP Date
    trong boot #67) vào hồ sơ (xem §2.5).
12. **Cross-check tái hiện T7(123) 100%** (CERT n=37 / FULL n=52)
    trước khi tính số mới — chạy blind41-gaps.py verbatim qua exec.
13. **md5 preview.tsx / media.ts KHÔNG ĐỔI trong lúc làm việc
    (ghi nhận):** preview.tsx 03bf029f (baseline), media.ts
    2c384ed1 — khớp baseline sau khi T3 gỡ H3f. T7 không sửa
    production file nào.
14. **T3 đợt 124 đã DONE trước khi T7 đóng** (round124-t3.done
    đã tạo; LIMITS T3 22.384 B trên đĩa) — T7 ghi nhận kết quả
    mù #40 B từ LIMITS T3, không kiểm lại (xem §2.6).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #43 (gap #67→#68): MỞ (mới, lượt này, xem §2.3
   đoạn B).** Đuôi 4.503 s trống hoàn toàn ở cả 4 phạm vi; 0
   session bắc qua cắt B-hi; tối đa 3 ẩn. **Cần parent quyết:**
   có chấp nhận để mù #43 mở như mù #35/#37/#39 (chờ bằng chứng
   ngoài VM) hay giao luồng điều tra thêm — T7 khuyến nghị
   **ĐỂ MỞ** (đuôi B là máy yên sau khi đợt 123 đóng xong + chờ
   lượt cron 00:35 +07; không còn kênh timestamp nào chưa quét
   trong đuôi — 0 file ở cả 4 phạm vi + 0 session). Gap #67→#68
   giữ SPAN cho tới khi đó.
2. **Mù #40 đoạn B: VẪN MỞ (ghi nhận T3 đợt 124, xem §2.6).**
   Lần kiểm tra thứ ba vẫn 0 bằng chứng mới; quan sát cuối chỉ
   dời +0,37 s. **Cần parent quyết:** có chấp nhận để mù #40 mở
   như mù #35/#37/#38/#39 hay giao luồng điều tra thêm — T7 đồng
   ý với hướng ĐỂ MỞ (3 lần kiểm tra sâu đều 0; chỉ còn cách chờ
   parent cung cấp bằng chứng nếu có — ví dụ output `uptime -s`
   lúc parent ra quyết ~10:3xZ). Gap #63→#64 giữ SPAN.
3. **Mù #39 đoạn J: KHÔNG KIỂM LẠI lượt này — parent đã chấp
   nhận ĐỂ MỞ** (quyết đợt 123 §12.2). Không còn gì để T7 làm
   cho J từ trong VM.
4. **Gap #66→#67 = KHOẢNG [1.626, 1.708] s ĐƯỢC CHỨNG NHẬN DẠNG
   KHOẢNG (mới — xem §2.5, CERT n=38, FULL n=53; caveat F67
   chưa kiểm + cận nhảy X ∈ (−30, +52) s từ quan sát, 0 nhân
   chứng nhảy).** Cần parent xác nhận (a) cách chứng nhận dạng
   khoảng (như đã làm với #53→#54, #57→#58, #62→#63 và
   #64→#65); (b) **quy ước cận trên X** (btime ≈ thời điểm
   reboot, POST không tách riêng) — nếu parent bác quy ước này
   thì gap #66→#67 phải HỦY chứng nhận, rơi về khoảng nửa-mở
   [1.626 s, ∞). (c) Cách đặt cận dưới X > −30 s từ quan sát
   cũ-clock muộn nhất (mới — lần đầu dùng cận hai chiều).
5. **Gap #67→#68 = 2h41'32" VẪN CHỈ LÀ SPAN (mới — xem §2.5,
   CERT n=38, FULL n=53).** Đoạn B mù #42 mở, đuôi 4.503 s.
   Cần đúng 1 quan sát trong đuôi sau cắt B-hi 17:14:44Z để
   chứng nhận (xem §2.6 mục còn thiếu).
6. **Reboot #68 (17:33:51Z, boot 69359761) — CHỈ GHI NHẬN giờ +
   bracket replay (mới, xem §2.2 cuối).** Gap #67→#68 thuộc mù
   #43, để điều tra tiếp. **Không tự đánh số thứ tự chắc chắn**
   — số #68 là tạm thời như #67.
7. **RAM max 4.576 MB = 76% guard (mới — xem §3).** Cao nhất từ
   trước (vượt 3.189 MB mù #40). **Birefnet KHÔNG chạy** (vẫn
   dưới guard 6 GB; brief cấm chạy lượt này). **Cần parent
   quyết:** RAM đã đổi mạnh (2,79 → 4,58 GB) — có coi "RAM đổi"
   là đã thỏa để thử lại birefnet ở đợt sau không, hay vẫn chờ
   available ≥ 6 GB mới thử? MemTotal 7,93 GB nên guard về
   nguyên tắc đạt được. T7 không tự chạy.
8. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
   --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
   117, chưa trả lời — nhắc lần 10 ở đợt này). Watcher này sẽ
   lấp đúng loại lỗ như đuôi đoạn B của mù #42/#43.
9. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
   parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
   117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
10. **EPERM không tuyên bố đã hết** (sóng gần nhất ~125h48'
    trước probe #43). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
