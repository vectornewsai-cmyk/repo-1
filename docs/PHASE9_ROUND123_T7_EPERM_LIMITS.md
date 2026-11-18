# PHASE9 ROUND123 T7 — EPERM: probe #42 + mù #41 ĐÓNG HOÀN TOÀN + gap #64→#65 CHỨNG NHẬN DẠNG KHOẢNG + gap #65→#66 CHỨNG NHẬN ĐIỂM + gap #63→#64 VẪN SPAN (mù #40 B kiểm lại VẪN MỞ) + mù #39 J (T3-123: VẪN MỞ, đề nghị ĐỂ MỞ)

> Luồng T7, đợt 123 vòng lặp Phase 9 VCut Studio (lượt cron 21:35 +07,
> 16/11/2026; làm việc 14:41Z → 14:57Z 16/11/2026).
> Nhiệm vụ: probe #42 + chứng nhận gap #63→#64 (SPAN 2h12'13", chưa
> chứng nhận đợt 122) + theo dõi mù #40 B + mù #39 J (ghi nhận kết
> quả T3 đợt 123 nếu có trên đĩa lúc đóng, KHÔNG điều tra lại) +
> EPERM sweep + WFS lần 29 + RAM (birefnet: KHÔNG chạy — vẫn dưới
> ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round123-t7/prereg-t7.md (định nghĩa probe #42, mốc đối
> chiếu, tiêu chí đóng mù #41, dự báo gap #63→#64 KHÔNG chứng nhận
> được + dự báo mù #41 A ĐÓNG / B CÓ THỂ ĐÓNG / C ĐÓNG + chẩn đoán
> nhảy clock tại #65).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG thử lại mù #38 G.** **KHÔNG tự đóng mù
> #37, #35, #31, #30, #29, #28, #26, #24, #21, hay reboot #16** — chỉ
> báo cáo "không thấy" vs "không có". G1 + mù #22/#28/#29/#30/#31/#35
> chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (14:44:29Z):** `status` báo
  **DEAD/STALE** (heartbeat age 11.140 s, last #41 11:38:49Z, boot
  3fe7e89e, exit 1); `once` ngay sau đó là **probe #42, boot
  9bbda390, ok=2 fail=0**, exit 0, 14:44:29Z; `status` chạy lại
  **ALIVE** (age 0 s, n=42), exit 0. Log v2 tăng đúng **3 dòng**
  (115 → 118) — **như R7/S7/T7/T6/T5/T4 (+3)**; prereg §1 đã dự báo
  đúng +3 trước khi đo. Heartbeat nay n=42, ts 14:44:29Z, boot
  9bbda390.
- **Boot #66 (tạm) lúc 14:24:43Z, boot
  `9bbda390-bd64-4679-a1ff-3619899cee7d`** — xác minh bằng `uptime -s`
  + btime 1794839083 + `who -b` + journal 1 boot (xem §1). Clock VM hiện tại CHÍNH
  XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u`
  trong 0–2 s) → **F_now ≈ 0**.
- **Khoảng mù #41: 11:38:49Z → 14:44:29Z (3h05'40") — ĐÓNG HOÀN
  TOÀN (mới, lượt này).** Đoạn A **ĐÓNG** (probe #41 là đầu đoạn
  + poller T10 đợt 122 run 2 + gate0-wait T9 b64/b64b + 338 mốc
  mtime, lỗ lớn nhất chỉ 126 s + đuôi sau quan sát cuối ≤ 120 s);
  đoạn B **ĐÓNG** (poller T10 run 3 + gate0-wait b65 + driver T2
  att3 + T10 đóng đợt 122 + 144 mốc mtime, đuôi 538 s < sàn +
  1 session bắc qua cắt B-hi); đoạn C **ĐÓNG** (uptime trực tiếp
  lúc probe #42 + dấu boot tươi sibling đợt 123). **2 reboot đã
  chốt trong mù (#65 12:53:25Z, #66 14:24:43Z — cả hai đều có giây
  chính xác trên đĩa) + 0 ẩn danh nghĩa.**
- **Gap #64→#65 = KHOẢNG [1h48'17", 1h50'17"] ([6.497, 6.617] s, mid
  1h49'17" = 6.557 s) ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG (mới, xem
  §2.5).** Điều kiện: đoạn A mù #41 đã đóng (xem §2.3). Dạng khoảng
  vì bước nhảy clock tại #65 đã CHỨNG MINH (X ∈ [10, 130] s,
  HAI nhân chứng độc lập — xem §2.2). CERT n=35 → **n=37**; FULL
  n=50 → **n=52** (cùng với gap dưới). Dải chứng nhận
  [19'07", 3h14'08"] không đổi.
- **Gap #65→#66 = 1h31'18" (5.478 s) ĐƯỢC CHỨNG NHẬN DẠNG ĐIỂM
  (mới, xem §2.5).** Điều kiện: đoạn B mù #41 đã đóng (xem §2.3).
  Không có nhân chứng nhảy clock nào tại #66 (0 session) và F66 ≈
  0 đã kiểm bằng HTTP Date TRONG boot #66.
- **Gap #63→#64 = 2h12'13" (7.933 s) VẪN CHỈ LÀ SPAN — KHÔNG
  chứng nhận được (mới, kiểm lại lượt này).** Đoạn B mù #40 kiểm
  lại TƯƠI: **0 file** trong đuôi (10:42:19Z, 11:05:18Z] ở cả 4
  phạm vi (repo-1, hidden_files, ngoài cây, /tmp), **0 session**
  chạm đuôi, 8 file viết sau 11:52Z nhắc 725453a2 đều là trích dẫn
  hồi tưởng — **không có bằng chứng mới**. B VẪN MỞ, tối đa 1 ẩn.
  Còn thiếu gì để chứng nhận: đúng 1 quan sát trong đuôi (xem §2.6).
- **Mù #39 đoạn J: VẪN MỞ (ghi nhận kết quả T3 đợt 123 — xem
  §2.6).** T3 điều tra sâu lần 3 (10 góc mới, 605.910 file, cả
  mtime/birth/atime/ctime/dir-mtime/.git/system log/lịch sử cron
  scheduler): tất cả đều 0 trong đuôi J; 2 lượt cron rơi vào đuôi
  nhưng là skip phía scheduler, không để lại dấu trên VM; repo-1
  KHÔNG có .git; system log boot #61 đã mất hoàn toàn. T3 khuyến
  nghị **ĐỂ MỞ như mù #35/#37, KHÔNG giao kiểm lại J từ trong VM
  nữa**.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" (mẫu hoa O) trong
  171 file *.log có mtime trong mù #41 (0 file repo-1, 171 file
  hidden_files); 2 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả launcher đã biết** (2× T10-O8). Quét mở rộng: **50 match /
  44 dòng duy nhất — phân loại hết** (36 dòng tên file/bản oversize
  trong 3 log recount/driver + 6 dòng test-pass hasEperm + 2 dòng
  launcher trên). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11**
  (R7) — **~122h41'** trước probe #42. EPERM vẫn KHÔNG được tuyên
  bố là đã hết.
- **Quét writeFileSync lần 29: 821 dòng / 231 file** (phạm vi 2.973
  file); R7b đối chiếu 846 dòng / 248 file; copies 25 dòng / 17
  file — y hệt lần 28 về copies; đối chiếu chéo 821+25=846=R7b,
  **chênh 0 — lần thứ hai mươi chín liên tiếp**. +9 dòng / +3
  file so với lần 28, giải thích đúng hết bằng diff (xem §2.7).
  Async `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** (+ 1
  bản build dist cũ của cùng helper) — 0 stray; mtime không đổi từ
  10–11/11.
- RAM: max biết được trong mù #41 **2.787 MB** (T3, 11:44:49Z,
  đoạn A) = 46% ngưỡng guard — thấp hơn mù #40 (3.189 MB); đoạn B
  max 1.490 MB, đoạn C không có mẫu. Birefnet KHÔNG chạy, vẫn 0
  lần chạy thành công trong gói. Reboot #16 VẪN MỞ; cron riêng 10
  phút vẫn chờ user quyết; R9 (a) vẫn chờ user.
- **Reboot #67 (tạm) lúc 14:52:19Z, boot `94e29be5-…` — CHỈ GHI
  NHẬN, KHÔNG chứng nhận (xem §2.2 cuối).** Reboot này xảy ra
  TRONG LÚC T7 làm việc (giết phiên exec của T7 — service restart
  ~14:52Z; phát hiện lúc kiểm lại 14:53:11Z) và được T3 đợt 123
  xác nhận độc lập (phát hiện 14:54:32Z). Gap #66→#67 danh nghĩa
  27'36" (1.656 s) thuộc mù #42 (probe #42 → probe #43), để luồng
  EPERM đợt sau điều tra. Nằm trong dải chứng nhận cơ học
  [14:43:50Z, 17:38:51Z] nhưng TRƯỚC p10 FULL52 (15:13:19Z).
- **dpkg.log boot #66: chỉ 2 dòng** (14:35:39Z); `/var/log/apt/`
  KHÔNG TỒN TẠI — không có bracket replay cho boot #66 (như #60,
  #62, #63, #64, xem §2.1). Boot #67: dpkg.log cũng chỉ 2 dòng
  (14:52:59Z, configure +40 s).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 14:41:49Z | boot_id `9bbda390-bd64-4679-a1ff-3619899cee7d`; `who -b` Nov 16 14:24; `uptime -s` **2026-11-16 14:24:43**; btime **1794839083 = 2026-11-16T14:24:43Z**; journal chỉ 1 boot (9bbda390, first entry 14:24:54Z, last 14:40:43Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #66 đã mất theo reboot #67, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 14:44:29Z | **DEAD/STALE**, heartbeat n=41, ts 11:38:49Z, boot 3fe7e89e, age **11.140 s** (đúng 3h05'40"); last sample probe #41; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 14:44:29Z | **probe #42, boot=9bbda390, ok=2 fail=0**, exit 0; dòng `boot changed 3fe7e89e -> 9bbda390` (uptime since 2026-11-16 14:24:43) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 14:44:29Z | **ALIVE**, age 0 s, n=42, exit 0 |

Kiểm lại từ đĩa: log probe v2 **118 dòng** — 115 sau T7 đợt 122 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #41 +
dòng `boot changed` + dòng probe #42). **Như R7/S7/T7/T6/T5/T4
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #41 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=42, ts 2026-11-16T14:44:29Z, boot
9bbda390-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (34 dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #66: T5/T6 đợt 123 chưa có file trên đĩa lúc
probe (thư mục round123-t5/t6 mới tạo/rỗng lúc 14:41Z), nhưng driver
mở đợt 123 (round-in-progress.md mtime 14:35Z) + 7 session đợt 123
trong vùng C (birth 14:37:26Z–14:43:59Z — xem §2.3) + 42 mốc mtime
trong vùng C (mốc đầu 14:38:58Z — lúc mở đợt 123; mốc cuối
14:44:28Z). **Số thứ tự TẠM THỜI** (mù #35 chưa đóng, tối đa +24 ẩn
danh nghĩa, cộng thêm tối đa +29 từ mù #37, +6 từ mù #38 đoạn G,
+2 từ mù #39 đoạn J và +1 từ mù #40 đoạn B → "thực tế #66" có
thể tới #133; xem §2.2).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #41 (11:38:49Z → 14:44:29Z, 3h05'40")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #42: `uptime -s` = **2026-11-16 14:24:43Z**,
  boot_id `9bbda390-bd64-4679-a1ff-3619899cee7d` — khác boot của
  probe #41 (3fe7e89e).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (14:41Z): chỉ **1 boot**
  (9bbda390, first entry 14:24:54Z, last 14:40:43Z). Journal/wtmp
  của boot fbc42445 đã mất theo reboot #66 — như mọi lần trước,
  chỉ giữ boot hiện tại (wtmp/`last` của boot #66 không còn kiểm
  được sau reboot #67 — xem §4 mục 4).
- **dpkg.log KHÔNG có bracket replay cho boot #66 (như #60, #62,
  #63, #64):** file `/var/log/dpkg.log` lúc kiểm tra chỉ có **2
  dòng, cả hai là `2026-11-16 14:35:39 startup packages
  configure`** — tức 10'56" SAU boot, lúc driver mở đợt 123,
  không phải replay lúc boot. **`/var/log/apt/` KHÔNG TỒN TẠI**
  (như đợt 120/121/122).
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  lượt này). `btmp` cũng chỉ bắt đầu 14:24:54Z (boot hiện tại).

### 2.2 Hai reboot đã chốt trong mù — #65 (12:53:25Z), #66 (14:24:43Z) — và bước nhảy clock tại #65 ĐÃ CHỨNG MINH

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 65 | **12:53:25Z** (chính xác từng giây theo đồng hồ mới — NHƯNG xem caveat bước nhảy clock dưới) | 3fe7e89e → fbc42445 | Chốt từ T10 đóng đợt 122 (RESTART 12:54:31Z, boot fbc42445, btime ~12:53Z) + T9 prereg phụ lục 3 (gate0-wait b65 start 12:56:15Z boot fbc42445-8967-473e-bab7-d690d49ce13a) + T2 att2 STOP-md5 trên boot fbc42445 (12:56:03Z). **Kiểm lại lượt này bằng bằng chứng độc lập:** poller T10 đợt 122 run 3 START 12:54:51Z boot fbc42445 + gate0-wait b65 header boot fbc42445 + 7 exec-log nhắc fbc42445 sinh/viết trong mù. **Số thứ tự TẠM THỜI. Thuộc mù #41 — đoạn A đóng lượt này.** |
| 66 | **14:24:43Z** (chính xác từng giây) | fbc42445 → 9bbda390 | Chốt từ lượt này: `uptime -s` đọc tươi (14:41:49Z) + btime 1794839083 + `who -b` 14:24 + boot_id 9bbda390 + journal first entry 14:24:54Z + probe #42 14:44:29Z boot 9bbda390 ok=2 fail=0 + driver mở đợt 123 14:35Z + 7 session đợt 123 trong vùng C (birth 14:37:26Z–14:43:59Z). **Số thứ tự TẠM THỜI.** |

**Clock:** F_now ≈ 0 (`date -u` 14:41:49Z vs HTTP `Date`
example.com 14:41:51Z, google.com 14:41:52Z, cloudflare.com
14:41:53Z — khớp trong 0–2 s, phần lệch là thời gian chạy tuần
tự 3 lệnh curl). F64 ≈ 0 (đã kiểm 11:38Z đợt 122, trên boot #64).
**F65 KHÔNG BIẾT ĐẦY ĐỦ** — và bước nhảy tại #65 đã CHỨNG MINH
(xem dưới); **F66 ≈ 0** (kiểm HTTP Date TRONG boot #66 lúc
14:41Z — xem §2.5, gap #65→#66 chứng nhận dạng điểm). Mọi gap
trong mù #41 đều là hiệu số đồng hồ VM cho tới khi chứng minh F
ổn định (xem caveat §2.5).

**BƯỚC NHẢY CLOCK TẠI #65 — ĐÃ CHỨNG MINH, HAI NHÂN CHỨNG ĐỘC
LẬP (mới, lượt này):**
- **Nhân chứng 1 — gate0-wait b64b poll #37 (T9 đã nêu dấu hiệu ở
  prereg phụ lục 3, T7 xác minh lại trên đĩa lượt này):** cùng
  một tiến trình script (gate0-wait-t9-b64b.sh, 1 tiến trình duy
  nhất, cadence 120 s) đã ghi poll #36 lúc 12:51:34Z trên boot
  #64, rồi ghi poll #37 lúc **12:53:35Z** (đồng hồ cũ) — **10
  giây SAU btime của boot kế tiếp (12:53:25Z)**. Tiến trình này
  không thể sống sau reboot để ghi #37 sau giờ boot mới. Kết luận:
  đồng hồ đã bước lùi tại #65, X > 10 s. (T9 cũng xác nhận reboot
  đã giết cả gate0-wait b64b lẫn poller 5 phút của T9, DEAD lúc
  kiểm 12:54Z.)
- **Nhân chứng 2, độc lập — exec-log session
  `proc_e55782614b7a.log`:** birth **12:48:43Z**, mtime
  **12:53:33Z** (xác minh trên đĩa, sessions-all.txt). Một tiến
  trình sinh ra trên boot #64 (12:48:43Z) đã ghi log ở 12:53:33Z
  theo đồng hồ cũ — **8 giây SAU btime của boot kế tiếp
  (12:53:25Z)**. Cùng mẫu mâu thuẫn nội bộ như nhân chứng 1 và
  như nhân chứng thứ hai tại #63 (T7-122 §2.2). Kết luận độc lập,
  cùng chiều: đồng hồ đã bước lùi tại #65. (Nhân chứng này cho
  cận dưới yếu hơn, X > 8 s; cận chính vẫn X > 10 s từ poll #37.)
- **Cận trên X ≤ 130 s (theo đúng quy ước T4-121 đã dùng cho
  #63):** poll #38 của gate0-wait b64b tới hạn ~12:55:35Z
  (cadence 120–121 s sau #37; các bước #31→#37 là 121, 120, 120,
  120, 120, 121 s) nhưng KHÔNG BAO GIỜ được ghi — reboot đã xảy
  ra trước đó. Theo cùng cách tính như T4-121 (X ≤ giờ tới hạn
  của poll bị lỡ − btime = 195 s tại #63): X ≤ 12:55:35Z −
  12:53:25Z = **130 s**. **Quy ước này coi btime ≈ thời điểm
  reboot, không tách riêng POST** (thời gian từ lúc khởi động
  lại tới khi kernel bắt đầu) — nếu parent không chấp nhận quy
  ước này thì gap #64→#65 rơi về khoảng nửa-mở [6.497 s, ∞) và
  phải HỦY chứng nhận (xem §5 mục 4).
- **Không có dấu nhảy clock tại #66 (cũng là bằng chứng âm tính
  có kiểm chứng, khác #64):** **0 session** sinh trước 14:24:43Z
  có mtime sau 14:24:43Z (quét 262 exec-log); F66 ≈ 0 đã kiểm
  bằng HTTP Date trong boot #66. Không có cadence nào bắc qua
  #66 để đặt cận (poller run 3 dừng 13:49:51Z theo thiết kế 9/9
  → exit; driver T2 att3 dừng 14:04:55Z theo thiết kế DEFER →
  exit) — nhưng khác #64 ở chỗ F66 đã kiểm trực tiếp, nên điểm
  #65→#66 vẫn đứng (xem §2.5).
- **Cận trên phụ (yếu hơn, không dùng):** poller T10 #16 tới hạn
  ~12:56:14Z (300 s sau #15 12:51:14Z) không ghi → X ≤ 169 s;
  monitor T2 tới hạn ~12:57:43Z → X ≤ 258 s. Gate0-wait cho cận
  chặt nhất (130 s).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #64→#65 = **KHOẢNG [1h48'17", 1h50'17"]** ([6.497, 6.617]
  s, mid 1h49'17" = 6.557 s) — **ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG
  lượt này** (đoạn A đóng, xem §2.5).
- Gap #65→#66 = **1h31'18"** (5.478 s) — **ĐƯỢC CHỨNG NHẬN DẠNG
  ĐIỂM lượt này** (đoạn B đóng + 0 nhân chứng nhảy tại #66 +
  F66 ≈ 0, xem §2.5).
- Gap #63→#64 = **2h12'13"** (7.933 s) — VẪN CHỈ LÀ SPAN (đoạn B
  mù #40 mở, kiểm lại lượt này — xem §2.6).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):** #67 từ
  #66: [14:43:50Z, 17:38:51Z] — #67 thật 14:52:19Z NẰM TRONG
  (xem cuối §2.2); #68 từ #67 (p10–p90 FULL52): [15:40:55Z,
  17:50:15Z]. Hiệu dụng sau probe #42: [14:44:29Z, 17:50:15Z].

**Reboot #67 — CHỈ GHI NHẬN, KHÔNG chứng nhận (mới, xảy ra trong
lúc T7 làm việc):**
- Phát hiện: phiên exec của T7 bị giết bởi reboot (service
  restart ~14:52Z, lệnh đang chạy bị gián đoạn); kiểm lại lúc
  14:53:11Z: boot_id `94e29be5-a52c-4840-9ca9-4e896482e4a2`,
  `uptime -s` = **2026-11-16 14:52:19**, btime **1794840739 =
  14:52:19Z**, journal chỉ 1 boot (94e29be5, first entry
  14:52:30Z). dpkg.log lúc kiểm chỉ có 2 dòng (14:52:59Z,
  configure +40 s) — không có bracket replay.
- **Xác nhận độc lập:** T3 đợt 123 cũng phát hiện reboot này lúc
  14:54:32Z (uptime-s 14:52:19Z, boot_id 94e29be5-…; lần kiểm
  14:52:08Z của T3 vẫn là boot 9bbda390) — xem LIMITS T3-123 §0.
  Hai luồng độc lập, cùng giờ, cùng boot_id.
- Gap #66→#67 danh nghĩa = **27'36" (1.656 s)** — thuộc mù #42
  (probe #42 14:44:29Z → probe #43 đợt sau), **để luồng EPERM
  đợt sau điều tra**; T7 không tự chứng nhận. Nằm trong dải cơ
  học nhưng TRƯỚC p10 FULL52 (15:13:19Z) — gap ngắn thứ hai
  trong các gap đã biết, sau #62→#63 (mid 28'55,5").
- **Số thứ tự TẠM THỜI** (như #65/#66).

### 2.3 Hoạt động trong khoảng mù — vì sao A + B + C đều đóng

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **44 file** +
hidden_files **510 file**; **554 file, 524 mốc giây phân
biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 19/P6 §4 mục
20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/T6 đợt 118 §2.3/T6
đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3). Chia mù làm ba đoạn bởi
#65 (12:53:25Z) và #66 (14:24:43Z):

- **Đoạn A: 11:38:49Z → 12:53:25Z (1h14'36", boot #64 3fe7e89e) —
  ĐÓNG bằng probe #41 là đầu đoạn + poller T10 đợt 122 run 2 +
  gate0-wait T9 b64/b64b + mật độ mtime dày + session bắc qua
  cắt:**
  - Probe #41 (11:38:49Z) LÀ đầu đoạn (0 s) — mốc đầu tiên trong
    hai cây cũng là 11:38:49Z.
  - **Poller T10 đợt 122 run 2 là 1 tiến trình duy nhất (kiểm
    bằng code poll-t10.log: 1 dòng START 11:41:13Z boot
    3fe7e89e):** 15 poll #1–#15, đúng số thứ tự, đúng **300 s**
    mỗi bước (301 s ở bước đầu do false-trigger restart, các
    bước sau đúng 300 s), 11:41:13Z → 12:51:14Z (poll #15, 6/9).
    Đóng (11:41:13Z, 12:51:14Z] theo đồng hồ ghi. (Run 1 chỉ 1
    poll 11:40:20Z — false-trigger ngưỡng 1015, T10 kill SIGTERM
    cả process-group rồi khởi động lại 11:41:13Z; xem closing
    đợt 122.)
  - **Gate0-wait T9 b64 (observer độc lập thứ hai, 1 tiến trình
    duy nhất — script bash tuyến tính):** 30 poll #1–#30, đúng
    số thứ tự, bước 120–122 s, 11:40:31Z → 12:38:47Z. **b64b nối
    tiếp:** 7 poll #31–#37, bước 120–121 s, 12:41:33Z →
    12:53:35Z (poll #37 chính là nhân chứng nhảy clock, xem
    §2.2).
  - Mật độ mtime củng cố: **338 mốc**, lỗ lớn nhất chỉ **126 s**
    (12:39:28Z → 12:41:33Z); mốc đầu 11:38:49Z (= giờ probe),
    mốc cuối 12:52:43Z (monitor-t2.out); **61 session** chạm
    đoạn A (trong đó 12 session chạm đuôi A).
  - **6 session bắc qua cắt A-lo (11:57:56Z), 5 session bắc qua
    cắt A-hi (12:34:18Z)** — cả hai cắt sàn đều có session bắc
    qua.
  - Đầu: probe #41 11:38:49Z → poller run 2 START 11:41:13Z =
    144 s < sàn (và gate0-wait b64 poll #1 11:40:31Z còn sớm
    hơn: 102 s). Đuôi: quan sát cuối là poll #37 12:53:35Z
    (đồng hồ cũ); giờ reboot thật (đồng hồ cũ) ∈ (12:53:35Z,
    12:55:35Z] (cận trên từ poll #38 tới hạn không bao giờ ghi)
    → đuôi sau quan sát cuối ≤ **120 s** < sàn 19'07".
  - **Kết luận đoạn A: ĐÓNG.**
- **Đoạn B: 12:53:25Z → 14:24:43Z (1h31'18", boot #65 fbc42445) —
  ĐÓNG bằng poller T10 run 3 + gate0-wait b65 + driver T2 att3 +
  T10 đóng đợt 122 + session bắc qua cắt B-hi + đuôi < sàn:**
  - **Poller T10 đợt 122 run 3 là 1 tiến trình duy nhất:** START
    12:54:51Z boot fbc42445 (sau dòng RESTART 12:54:31Z ghi rõ
    reboot #65 giết poller + phiên chờ); 12 poll #1–#12, đúng
    số thứ tự, đúng **300 s** mỗi bước, 12:54:51Z → 13:49:51Z
    (ALL 9 DONE). Đóng (12:54:51Z, 13:49:51Z] theo đồng hồ ghi.
  - **Gate0-wait T9 b65 (observer độc lập thứ hai, 1 tiến trình
    duy nhất):** 10 poll #1–#10, đúng số thứ tự, bước 120–121
    s, 12:56:16Z → 13:14:18Z.
  - **Driver T2 att3 (observer thứ ba):** chạy 13:04:52Z →
    14:04:55Z trên boot #65 (DEFER-POSTBOOT, exit 3 — dừng theo
    thiết kế vì không có cờ T5, không phải chết do reboot).
  - **T10 đóng đợt 122 (observer thứ tư):** phase 1 kích hoạt
    tay 13:42:10Z, suite 27/27, T4 về 13:46Z, recount gộp đủ
    9/9 13:49:51Z; file đóng đợt tới **14:15:45Z**
    (docs/PHASE9_ROUND122_LIMITS.md).
  - Mật độ mtime: **144 mốc**, lỗ lớn nhất **538 s** — chính là
    đuôi (14:15:45Z → 14:24:43Z); các lỗ còn lại đều < 300 s.
    Mốc đầu 12:53:35Z (poll #37, đồng hồ cũ — 10 s sau đầu đoạn
    theo đồng hồ mới); mốc cuối **14:15:45Z**. **29 session**
    chạm đoạn B.
  - **4 session bắc qua cắt B-lo (13:12:32Z), 1 session bắc qua
    cắt B-hi (14:05:36Z)** — birth 14:00:52Z, mtime 14:05:42Z
    (proc_99e7faab64ab.log; bắc qua đúng 6 s). Cả hai cắt sàn
    đều có session bắc qua.
  - Đuôi: mốc cuối 14:15:45Z → #66 14:24:43Z = **538 s** <
    sàn 1.147 s. File trong đuôi (sau cắt B-hi) ở cả 3 phạm vi +
    ngoài cây: repo-1 3 file (14:11:48Z GAP_ANALYSIS, 14:12:05Z
    ROUND122_T2_LIMITS, 14:15:45Z ROUND122_LIMITS), hidden_files
    5 file (14:08:51Z e4batch-ledger, 14:09:13Z prereg T2,
    14:12:05Z recount + round122-t10.done, 14:12:15Z
    round122-t2.done), ngoài cây 2 file (14:05:42Z exec-log,
    14:12:05Z closing batch); /tmp 0 file — /tmp không có file
    nào trong cả mù #41 (xem §2.3 cuối).
  - **Kết luận đoạn B: ĐÓNG.** (Prereg §2 dự báo "có thể đóng"
    với đuôi ~11–12' từ ~14:13Z; đo thật đuôi 8'58" từ 14:15:45Z
    — verdict như dự báo, đuôi ngắn hơn dự báo.)
- **Đoạn C: 14:24:43Z → 14:44:29Z (19'46", boot #66 9bbda390) —
  ĐÓNG bằng đo uptime trực tiếp + probe #42 + dấu boot tươi:**
  - **`uptime -s` lúc 14:41:49Z = 14:24:43Z** chứng minh máy up
    liên tục từ #66 tới lúc đo; probe #42 14:44:29Z đọc boot_id
    9bbda390 tươi — cùng boot_id với boot bắt đầu 14:24:43Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C.) Đoạn C dài 1.186 s > sàn nhưng uptime trực
    tiếp là closer duy nhất cho toàn đoạn — không cần mtime (như
    T6-119 đoạn D và T5-120 đoạn H và T7-122 đoạn C).
  - **Chuỗi dấu boot tươi củng cố:** driver mở đợt 123
    (round-in-progress.md mtime 14:35Z) + 7 session đợt 123
    trong vùng C (birth 14:37:26Z, 14:41:36Z, 14:42:33Z,
    14:43:12Z, 14:43:34Z, 14:43:39Z, 14:43:59Z) + 42 mốc mtime
    (mốc đầu 14:38:58Z — lúc mở đợt 123; mốc cuối 14:44:28Z).
    Lỗ mtime (14:24:43Z → 14:38:58Z] 855 s là máy yên sau boot
    (lượt cron 21:35 +07 mở đợt 123 lúc 14:35Z), không observer
    — nhưng uptime đóng đoạn này.
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #41 ĐÓNG HOÀN TOÀN.** Đoạn A +
B + C đều đóng; 2 reboot đã chốt giờ (#65 12:53:25Z, #66
14:24:43Z — cả hai chính xác từng giây trên đĩa) + **0 ẩn danh
nghĩa**. Số thứ tự #65/#66 vẫn TẠM THỜI.

Ngoài hai cây: **152 file** có mtime trong mù #41 (chủ yếu là
exec-log của các agent + batch stage repo-1-push + file
proactivity/memory); **/tmp: 0 file** có mtime trong mù #41.
Boot_id nhắc trong exec-log sinh/viết trong mù: 3fe7e89e 32 file,
fbc42445 7 file, 9bbda390 1 file.

### 2.4 Quét sóng EPERM trong mù #41 — 0 sóng thật (bằng chứng âm tính)

Quét toàn bộ file *.log có mtime trong mù #41 (bằng script
eperm-sweep.py; eperm-sweep*.log của chính mình bị loại theo bài
học T7 §4 mục 19):

| Phạm vi quét | "vẫn bật" | "CẢNH BÁO 10 phút" | "Operation not permitted" | "sóng EPERM đã tắt" |
|---|---|---|---|---|
| repo-1 (0 file) | 0 | 0 | 0 | 0 |
| hidden_files (171 file) | 0 | 0 | 0 | **2** (dương tính giả đã biết, xem dưới) |
| **Tổng 171 file** | **0** | **0** | **0** | **2 FP** |

2 dòng "đã tắt" đều là dương tính giả launcher đã biết — không
phải sóng thật:
- 2× t10-o8.log (13:55:04Z, 13:56:07Z — T10 đợt 122 O8 driver
  launcher, cùng mẫu như 2× đợt 122 và 4× đợt 119).

Quét mở rộng `/eperm|not permitted/i`: **50 match / 44 dòng
duy nhất** — phân loại hết (50 match vì 6 dòng suites chứa cả
"hasEperm" lẫn "EPERM" nên mỗi dòng đếm 2 match):
- 36 dòng tên file/bản oversize trong 3 log recount/driver của
  T10 (12 dòng mỗi file: 1 dòng tên batch
  `phase9-round122-t7-eperm.txt` + 11 dòng `oversize:
  docs/PHASE9_ROUND1xx_*_EPERM_LIMITS.md <size>`) — chỉ là tên
  file LIMITS EPERM trong danh sách, không phải sự kiện EPERM.
- 6 dòng test-pass hasEperm trong round122-t10-suites.log (test tự
  kiểm "not permitted" như kết quả mong đợi).
- 2 dòng launcher T10-O8 trên.
**0 sóng EPERM thật.**

- Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7 đợt 115) —
  **~122h41'** trước probe #42 (14:44:29Z).
- EPERM **không** được tuyên bố là đã hết — như R7/S7/T7/T6/T5/T4:
  1 lượt không sóng = bằng chứng âm tính cho lượt đó, không phải
  kết luận hệ thống.

### 2.5 Phân phối gap — CERT n=37, FULL n=52 (mới: +2 gap từ mù #41)

**Gap #64→#65 = KHOẢNG [1h48'17", 1h50'17"] ([6.497, 6.617] s, mid
1h49'17" = 6.557 s) ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG.** Điều kiện:
đoạn A mù #41 đã đóng (xem §2.3). **CAVEAT (đứng, khác các gap
điểm):** bước nhảy clock tại #65 đã CHỨNG MINH (X ∈ [10, 130] s,
hai nhân chứng độc lập — xem §2.2) nên gap này chỉ có thể là
khoảng, không phải điểm — cùng cách xử lý như #53→#54, #57→#58
và #62→#63. Cận trên X ≤ 130 s dùng quy ước T4-121 (btime ≈ thời
điểm reboot, POST không tách riêng); nếu parent bác quy ước này
thì gap rơi về khoảng nửa-mở và phải hủy chứng nhận (xem §5 mục
4). F65 chưa kiểm đầy đủ (không có kiểm HTTP Date trong boot
#65); nếu sau này parent cung cấp neo giờ thật độc lập cho #65
thì khoảng này thu về điểm. Độ nhạy đầu mút: CERT37-LO mean chỉ
lệch −2 s, CERT37-HI +1 s so với mid; median và p10/p90 không
đổi (xem dưới).

**Gap #65→#66 = 1h31'18" (5.478 s) ĐƯỢC CHỨNG NHẬN DẠNG ĐIỂM.**
Điều kiện: đoạn B mù #41 đã đóng (xem §2.3). Không có nhân chứng
nhảy clock nào tại #66 (0 session sinh trước 14:24:43Z có mtime
sau 14:24:43Z) và F66 ≈ 0 đã kiểm bằng HTTP Date TRONG boot #66
(3 server, 0–2 s lúc 14:41Z) — mạnh hơn cả gap #60→#61 (chỉ có
cận X ≤ 36 s từ cadence poller, F61 chưa kiểm đầy đủ).

**Gap #63→#64 = 2h12'13" (7.933 s) VẪN CHỈ LÀ SPAN — KHÔNG đưa
vào FULL/CERT** — đoạn B mù #40 mở, kiểm lại lượt này vẫn mở
(đuôi 1.379 s, tối đa 1 ẩn; xem §2.6). Cùng luật như #55→#56 /
#56→#57 (T6-119 §2.5), span #59→#60 (10.680 s, T5-120 §2.5),
span #61→#62 (5.689 s, T4-121 §2.5) và span #63→#64 đợt 122.

**Cross-check tái hiện T7(122) 100%:** chạy blind40-gaps.py
verbatim cho lại đúng CERT n=35 / FULL n=50 của T7 đợt 122 (xem
blind41-gaps.txt: CERT35 mean 1h46'51" median 1h58'47" p10
0h50'43" p90 2h25'57" sd 0h41'57"; FULL50 mean 1h52'45" median
1h58'30" p10 0h46'54" p90 3h01'40" sd 0h57'13" — khớp T7-122 §2.5
từng số).

Bảng so sánh (CERT = gap đơn/khoảng đã chứng nhận, thống kê dùng
mid; FULL = CERT + gap chưa chứng nhận + gap khoảng):

| | CERT n=35 (T7-122) | **CERT n=37 (T7-123)** | FULL n=50 (T7-122) | **FULL n=52 (T7-123)** |
|---|---|---|---|---|
| mean | 1h46'51" | **1h46'30"** | 1h52'45" | **1h52'16"** |
| median | 1h58'47" | **1h58'14"** | 1h58'30" | **1h58'05"** |
| p10 | 0h50'43" | **0h51'52"** | 0h46'54" | **0h48'36"** |
| p90 | 2h25'57" | **2h25'21"** | 3h01'40" | **2h57'56"** |
| sd | 0h41'57" | **0h40'51"** | 0h57'13" | **0h56'10"** |
| min | 19'07" | **19'07"** | 19'07" | **19'07"** |
| max | 3h14'08" | **3h14'08"** | 5h43'18" | **5h43'18"** |

- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (2 gap mới đều
  nằm giữa).
- **Độ nhạy đầu mút #64→#65:** CERT37-LO (6.497 s) mean
  1h46'28"; CERT37-HI (6.617 s) mean 1h46'31"; FULL52-LO mean
  1h52'15"; FULL52-HI mean 1h52'17" — lệch ±2 s / ±1 s so với
  mid; median và p10/p90 không đổi.
- **Tốc độ reboot (đồng hồ ghi nhận):** 66 / 138,11 h = **1 reboot
  mỗi 125,6 phút** (từ #1 2026-11-10T20:18:10Z tới #66
  2026-11-16T14:24:43Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 70 / 138,11 h = **1 mỗi 118,4 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2) và mù #40 đoạn B (+1).
- **Phân phối FULL52:** 29/52 trong 90–150 phút; 8 gap <60 phút;
  6 gap >180 phút; 2 gap >240 phút. Gap #65→#66 (1h31'18") nằm
  trong khối chính 90–150 phút; gap #64→#65 (mid 1h49'17") cũng
  vậy.
- **Lưu ý về #67:** gap danh nghĩa #66→#67 = 27'36" (1.656 s)
  nằm NGOÀI khối chính (ngắn hơn p10 FULL52 48'36") — nhưng vẫn
  chỉ là SPAN trong mù #42, chưa chứng nhận, để đợt sau điều tra.

### 2.6 Trạng thái các mù cũ — mù #40 B KIỂM LẠI: VẪN MỞ; mù #39 J (T3-123): VẪN MỞ, đề nghị ĐỂ MỞ

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #41 | **ĐÓNG HOÀN TOÀN (mới, lượt này, §2.3)** | A+B+C đóng; 2 reboot đã chốt + 0 ẩn; gap #64→#65 chứng nhận dạng khoảng, #65→#66 chứng nhận dạng điểm |
| #40 | KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'04", tối đa 1 ẩn) | **Kiểm lại lượt này: B VẪN MỞ** (xem dưới); 2 reboot đã chốt + tối đa 1 ẩn; gap #63→#64 vẫn SPAN |
| #39 | KHÔNG ĐÓNG HOÀN TOÀN (I+K đóng, J mở, 2h56'14", tối đa 2 ẩn) | **T3 đợt 123 điều tra sâu lần 3: J VẪN MỞ, đề nghị ĐỂ MỞ** (xem dưới); 2 reboot đã chốt + tối đa 2 ẩn |
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | **Thử cuối đã thất bại đợt 121 — KHÔNG thử lại lượt này** (theo brief T7); cần parent quyết có chấp nhận để mở như mù #35/#37 hay không |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 §2.3 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#66 vẫn TẠM THỜI vì mù này |
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

**Mù #40 đoạn B — kiểm lại lượt này (theo brief T7):**
- Quét lại TƯƠI đuôi (10:42:19Z, 11:05:18Z]: repo-1 = 0,
  hidden_files = 0, ngoài hai cây = 0, /tmp = 0 file có mtime
  trong đuôi; 0 session chạm đuôi (quét exec-log tươi, 262
  file).
- File viết sau 11:52Z (khi T7-122 xong) nhắc 725453a2 (boot
  #63): 8 file — build-loop-log.md (4×, các mục đóng đợt 122 +
  mở đợt 123, đều là trích dẫn hồi tưởng boot #63, KHÔNG có lần
  đọc uptime/boot tươi nào trong đuôi) + e4batch-ledger.md 2×
  (round118-t9 + round122-t1, trích dẫn) + prereg-t4.md 1× +
  prereg-legb.md 1× (round123-t4, chuỗi trong prereg) + 2 script
  của chính T7 (blind40-sessions.py 1×, blind40-investigate.py
  4×, chuỗi trong code). Không có bằng chứng mới.
- **Kết luận: đoạn B VẪN MỞ. Không có gì mới để đóng — chỉ còn
  cách chờ parent cung cấp bằng chứng nếu có.** Mù #40 giữ
  nguyên trạng thái KHÔNG ĐÓNG HOÀN TOÀN; cần parent quyết có
  chấp nhận để mở như mù #35/#37 hay không (T7 khuyến nghị ĐỂ
  MỞ, cùng lý do như T4-121/T7-122 — xem §5 mục 1).
- **Còn thiếu gì để chứng nhận gap #63→#64 (ghi rõ theo brief):**
  đúng **1 quan sát** trong đuôi (10:42:19Z, 11:05:18Z] — bất kỳ
  1 file nào có mtime trong đuôi (kể cả file ghi sau với
  timestamp bảo toàn — git/tar/download) HOẶC 1 session chạm
  đuôi HOẶC bằng chứng ngoài VM (ví dụ output `uptime -s` của
  parent lúc ~10:3xZ). Quan sát đó phải nằm SAU 10:46:11Z (cắt
  B-hi) thì đuôi sau nó mới < sàn 1.147 s. Ngay cả khi B được
  đóng, gap #63→#64 vẫn mang caveat F64 chưa kiểm (không có cận
  nhảy clock tại #64 — T7-122 §2.2) nên chỉ chứng nhận được dạng
  ĐIỂM CÓ CAVEAT hoặc KHOẢNG nếu tìm được cận nhảy; không chứng
  nhận điểm sạch.

**Mù #39 đoạn J — ghi nhận kết quả T3 đợt 123 (T7 KHÔNG điều tra
lại, theo brief):**
- T3 đã viết LIMITS trên đĩa lúc T7 đóng:
  docs/PHASE9_ROUND123_T3_BLIND39J_LIMITS.md (làm việc ~14:43Z →
  ~14:55Z). Kết luận headline: **J VẪN MỞ — lần kiểm tra sâu thứ
  ba liên tiếp (T4-121, T7-122, T3-123) đều cho 0 bằng chứng
  mới.**
- Đợt này T3 thử **10 góc chưa từng thử**: mtime tươi phạm vi
  rộng hơn, birth time, atime, ctime, directory-mtime, .git,
  system log, lịch sử chạy cron của scheduler, đối chiếu mù đã
  đóng. Quét v2 (đã sửa lỗi script v1 — biến `in_tail` bị shadow
  thành list): **605.910 file** — mtime trong đuôi J: **0**;
  atime trong đuôi: **0**; ctime trong đuôi: **0**; birth trong
  đuôi: **0**; thư mục có mtime trong đuôi: **0**; session chạm
  đuôi: **0/264** (T7 đếm 218, nay 264); session bắc qua cắt
  J-hi (08:06:40Z): **0**.
- **Lịch sử chạy cron của scheduler (nguồn MỚI, chưa luồng nào
  kiểm):** có 2 lượt chạy rơi vào đuôi J — feed-pulse-14 lúc
  07:41:54Z và heartbeat lúc 08:20:50Z — nhưng cả hai đều là
  **skip phía scheduler, không để lại dấu vết nào trên VM**
  (chứng minh bằng control: feed-pulse-15 lúc 08:41:54Z cũng
  không để lại session nào). **Không dùng được để đóng J.** Hai
  lượt chạy bị thiếu trong đuôi (heartbeat 14:50:50+07,
  deterministic-doctor 15:00+07) cũng **không dùng được làm
  bằng chứng reboot ẩn** — cùng mẫu thiếu lượt xảy ra trên boot
  khỏe đã biết (09:50:50+07 trong boot #59, 17:50:50+07 trong
  boot #63).
- **repo-1 KHÔNG có .git** — khảo cổ git là không thể, không phải
  chưa thử. **System log của boot #61 đã mất hoàn toàn**
  (journal/wtmp/dpkg chỉ còn boot hiện tại) — cùng lý do reboot
  #16 không chốt được giờ.
- **Khuyến nghị của T3 (T7 ghi nhận, không tự quyết): ĐỂ MỞ như
  mù #35/#37, KHÔNG giao kiểm lại J từ trong VM nữa** — 3 lần
  điều tra sâu với phạm vi mở rộng dần đều cho 0; con đường duy
  nhất còn lại là bằng chứng NGOÀI VM do parent cung cấp (ví dụ
  output `uptime -s` của chính parent trong phiên main-chat
  ~07:3x–08:2xZ 16/11). Cần parent quyết (xem §5 mục 2).
- T3 cũng xác nhận độc lập reboot #67 (xem §2.2 cuối).

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 29 — chênh 0 (lần thứ 29 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T4 trong round121-t4, đổi OUT sang
  round123-t7) **14:54:01Z → 14:54:29Z 16/11 (28 s, có SCAN-END)**.
  Lưu ý: scan chạy trên boot #67, SAU khi mù #41 đã đóng bằng
  probe #42 (14:44:29Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code
  hiện tại, không phụ thuộc giờ mù. (Scan lần đầu bị gián đoạn bởi
  chính reboot #67 ~14:52Z — không có file output nào được tạo;
  chạy lại từ đầu 14:54:01Z, không dùng kết quả dở dang.)
- NEWSTD: **821 dòng / 231 file** (phạm vi 2.973 file); R7b đối
  chiếu: **846 dòng / 248 file** (phạm vi 12.366 file); copies:
  **25 dòng / 17 file** — y hệt lần 28. Đối chiếu chéo:
  821+25=846=R7b, **chênh 0**.
- **+9 dòng / +3 file so với lần 28** (812/228 → 821/231), giải
  thích đúng hết bằng diff (kiểm bằng đếm lại trực tiếp + mtime —
  mọi file đều về trước lúc scan bắt đầu 14:54:01Z 16/11; 0 file
  mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | PHASE9_GAP_ANALYSIS.md | +1 (22 → 23) | 14:11:48Z 16/11 | T10 đóng đợt 122 cập nhật §51 (nhắc `writeFileSync` thêm 1 lần); viết sau scan lần 28 (11:47:38Z) nên lần này mới vào |
  | docs/PHASE9_ROUND122_LIMITS.md | +1 | 14:15:45Z 16/11 | Tài liệu gộp T10 đợt 122 (nhắc `writeFileSync` 1 lần); viết sau scan lần 28 |
  | docs/PHASE9_ROUND122_T7_EPERM_LIMITS.md | +6 | 11:52:31Z 16/11 | Tài liệu T7 đợt 122 (nhắc `writeFileSync` 6 lần); viết sau scan lần 28 |
  | docs/PHASE9_ROUND122_T8_VITEHARNESS_LIMITS.md | +1 | 11:53:11Z 16/11 | Tài liệu T8 đợt 122 (nhắc `writeFileSync` 1 lần); viết sau scan lần 28 |
- Phạm vi: 2.973 = 2.959 + 14 net (14 file mới, **0 file mất**:
  kiểm bằng diff danh sách file — 0 dòng `<`; 14 file mới gồm 9
  LIMITS đợt 122/123 + 2 script probe T3/T4 đợt 123 + 2 file
  script probe/clicktest đợt 122 + 1 file khác).
- **Kết luận: 29 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #41.

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
  né EPERM trong mù #41.

## 3. RAM trong mù #41 — max 2.787 MB (46% guard), birefnet KHÔNG chạy

- **1 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #41 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 14:55:38Z | **1.600.216 kB** | Trước khi viết LIMITS (boot #67) |
- **Max RAM biết được TRONG mù #41 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 253 mẫu RAM; **max 2.787 MB**
  (T3 H3f driver, 11:44:49Z, đoạn A, dòng `free=2787MB` đã xác
  minh trực tiếp trong driver-t3.log) = **46% ngưỡng guard** —
  thấp hơn mù #40 (3.189 MB); đoạn B max **1.490 MB**
  (T4 gate0-wait #1, 12:55:52Z, `RAMavail=1490MB` — đã xác minh
  trực tiếp trong gate0-wait-t4.log); đoạn C **không có mẫu nào**
  (máy yên sau boot, không observer ghi RAM).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 2,79 GB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Chỉ thử lại khi RAM đổi (xem §5 mục 7).

## 4. Ghi chú phương pháp (mới so với T7 đợt 122)

1. **Nhân chứng nhảy clock từ session exec-log rẻ hơn poller
   (mới, §2.2):** tại #65 có HAI nhân chứng độc lập — poll #37
   của gate0-wait (X > 10 s) VÀ session exec-log birth 12:48:43Z
   mtime 12:53:33Z (X > 8 s). Bài học đứng từ T7-122 §4 mục 2
   (đối chiếu mtime session sinh trước reboot với btime boot kế
   tiếp) đã cho quả ngay lượt sau — quét session nào cũng phải
   chạy bước "jump witness" này, không chỉ quét cắt sàn.
2. **Cận trên X từ poll bị lỡ — quy ước cần parent xác nhận
   (mới, §2.2):** cận X ≤ 130 s tại #65 dùng đúng quy ước T4-121
   đã dùng cho #63 (btime ≈ thời điểm reboot). Quy ước này chưa
   từng được parent xác nhận tường minh — T7 đã ghi rõ giả thiết
   và đường lui (hủy chứng nhận nếu parent bác). Bài học: mọi
   chứng nhận dạng khoảng đều phải ghi kèm quy ước cận trên, không
   để ngầm.
3. **F66 kiểm trực tiếp trong boot mới (mới, §2.5):** gap
   #65→#66 chứng nhận dạng điểm mạnh hơn các gap điểm trước
   (vd #60→#61 chỉ có cận X ≤ 36 s, F61 chưa kiểm) vì HTTP Date
   đã kiểm TRONG boot #66 lúc 14:41Z. Bài học: lượt nào cũng nên
   kiểm HTTP Date ngay sau probe, trong boot hiện tại — T7 đã
   làm vậy lượt này (14:41Z) và lượt trước (11:38Z).
4. **Reboot trong lúc làm việc là dữ liệu, không phải sự cố
   (mới, §2.2 cuối):** reboot #67 giết phiên exec của T7 giữa
   lúc chạy WFS scan — scan chạy lại từ đầu, không dùng kết quả
   dở dang; T3 xác nhận độc lập cùng boot_id/giờ. Bài học: sau
   mỗi lần service restart giữa chừng, kiểm tra boot trước khi
   tin bất kỳ số nào đo trước đó — T7 đã làm vậy (probe log +
   heartbeat + file round123-t7 đều nguyên vẹn, 118 dòng, n=42).
5. **Lỗi in nhỏ trong blind41-investigate.py (ghi nhận, không
   ảnh hưởng số liệu):** dòng in "seg A floor window" ghi
   [11:24:25 .. 12:34:18] — đầu mút trái dùng nhầm btime #64
   (11:05:18Z) thay vì đầu đoạn A (11:38:49Z); cắt đúng là A-lo
   11:57:56Z như trong ngoặc đơn và như script sessions đã dùng.
   Mọi số trong LIMITS này dùng cắt đúng (11:57:56Z /
   12:34:18Z / 13:12:32Z / 14:05:36Z).
6. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo probe #42 boot 9bbda390 ĐÚNG; dự báo gap
   #63→#64 KHÔNG chứng nhận được ĐÚNG (B kiểm lại vẫn mở);
   dự báo đoạn A ĐÓNG / C ĐÓNG ĐÚNG; dự báo đoạn B "có thể đóng"
   ĐÚNG (đuôi thật 538 s, ngắn hơn dự báo ~11–12'); dự báo
   EPERM 0 sóng ĐÚNG; dự báo WFS chênh 0 ĐÚNG (821 dòng, trong
   khoảng dự báo ~812–840); dự báo RAM max < 4,81 MB ĐÚNG
   (2.787 MB) — không sửa sau khi thấy số. (Prereg dự báo đúng
   gap #64→#65 chứng nhận dạng khoảng + #65→#66 chứng nhận dạng
   điểm, CERT n=35→37, FULL n=50→52 — với điều kiện A/B đóng,
   đã xảy ra đúng như dự báo.)
7. **Kiểm lại boot trước khi viết LIMITS (14:55:38Z):** boot
   94e29be5 (#67), uptime-s 14:52:19Z — có reboot mới thêm trong
   lúc làm việc (xem §2.2 cuối); probe #42 và mù #41 không bị
   ảnh hưởng vì đã đóng trước reboot này.
8. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard). **Không đụng cloud/collab/AI model
   đóng/nhạc bản quyền.**
9. **Stage batch:** chỉ 1 file text (LIMITS doc này),
   NUL-delimited, verify read-back (xem checkpoint3.txt + stage
   file).
10. **Ghi rõ:** số thứ tự reboot #47–#67 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
11. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat bước nhảy #65 (hai nhân chứng) vào
    hồ sơ (xem §2.5).
12. **Cross-check tái hiện T7(122) 100%** (CERT n=35 / FULL n=50)
    trước khi tính số mới — chạy blind40-gaps.py verbatim qua exec.
13. **md5 preview.tsx / media.ts KHÔNG ĐỔI trong lúc làm việc
    (ghi nhận):** preview.tsx 03bf029f (baseline đợt 122), media.ts
    2c384ed1 — khớp baseline sau khi T3 gỡ H3f. T7 không sửa
    production file nào.
14. **Nhãn script poller đợt 122 (ghi nhận lại, không sửa):**
    poll-t10.log run 1 là false-trigger ngưỡng 1015 (đã sửa thành
    1345 ở run 2) — chỉ là vận hành T10, không ảnh hưởng số liệu
    mù #41 vì run 2/3 đã phủ liên tục.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #40 đoạn B: KIỂM LẠI — VẪN MỞ (mới, lượt này, xem
   §2.6).** Không còn nguồn nào để đóng B từ trong VM. **Cần
   parent quyết:** có chấp nhận để mù #40 mở như mù #35/#37/#38/
   #39 hay giao luồng điều tra thêm — T7 khuyến nghị **ĐỂ MỞ**
   (đuôi B là máy yên sau khi đợt 121 đóng xong + phiên main-chat
   của parent; 0 session, 0 file trong đuôi; chỉ còn cách chờ
   parent cung cấp bằng chứng nếu có — ví dụ output `uptime -s`
   lúc parent ra quyết ~10:3xZ). Gap #63→#64 giữ SPAN cho tới
   khi đó.
2. **Mù #39 đoạn J: VẪN MỞ — T3 đợt 123 đề nghị ĐỂ MỞ (mới,
   §2.6).** 3 lần điều tra sâu đều 0 bằng chứng mới; T3 đã thử
   10 góc mới kể cả lịch sử cron scheduler và kết luận không còn
   kênh timestamp nào trên VM chưa quét. **Cần parent quyết:**
   chấp nhận để mù #39 mở như mù #35/#37 (T7 đồng ý với khuyến
   nghị ĐỂ MỞ của T3) hay giữ mở chờ bằng chứng từ bên ngoài VM.
3. **Mù #38 đoạn G: THỬ CUỐI ĐÃ THẤT BẠI đợt 121 — KHÔNG THỬ
   LẠI lượt này.** **Cần parent quyết:** chấp nhận để mù #38 mở
   như mù #35/#37 (T4-121 khuyến nghị ĐỂ MỞ) hay giữ mở chờ
   bằng chứng từ bên ngoài VM.
4. **Gap #64→#65 = KHOẢNG [6.497, 6.617] s ĐƯỢC CHỨNG NHẬN DẠNG
   KHOẢNG (mới — xem §2.5, CERT n=37, FULL n=52; caveat F65
   chưa kiểm đầy đủ + bước nhảy X ∈ [10, 130] s đã chứng minh
   bằng hai nhân chứng độc lập, cận trên dùng quy ước T4-121).**
   Cần parent xác nhận (a) cách chứng nhận dạng khoảng (như đã
   làm với #53→#54, #57→#58 và #62→#63); (b) **quy ước cận trên
   X** (btime ≈ thời điểm reboot, POST không tách riêng) — nếu
   parent bác quy ước này thì gap #64→#65 phải HỦY chứng nhận,
   rơi về khoảng nửa-mở [6.497 s, ∞). Nếu parent có neo giờ thật
   độc lập cho #65 thì khoảng thu về điểm.
5. **Gap #65→#66 = 1h31'18" ĐƯỢC CHỨNG NHẬN DẠNG ĐIỂM (mới — xem
   §2.5, CERT n=37, FULL n=52).** 0 nhân chứng nhảy tại #66 +
   F66 ≈ 0 đã kiểm bằng HTTP Date trong boot #66. Cần parent
   xác nhận cách chứng nhận điểm khi không có cadence bắc qua
   reboot (không có poll bị lỡ để đặt cận) — T7 cho rằng 0 nhân
   chứng + F66 ≈ 0 là đủ theo chuẩn các gap điểm trước.
6. **Reboot #67 (14:52:19Z, boot 94e29be5) — CHỈ GHI NHẬN (mới,
   §2.2 cuối).** Gap #66→#67 danh nghĩa 27'36" thuộc mù #42,
   để luồng EPERM đợt sau điều tra + chứng nhận (nếu đủ điều
   kiện). **Không tự đánh số thứ tự chắc chắn** — số #67 là tạm
   thời như #65/#66.
7. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
   --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
   117, chưa trả lời — nhắc lần 9). Watcher này sẽ lấp đúng loại
   lỗ như đuôi đoạn B của mù #40.
8. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
   parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
   117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
9. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi**
   (u2net là fallback chính thức). Max RAM trong mù #41 là
   2,79 GB (46% guard).
10. **EPERM không tuyên bố đã hết** (sóng gần nhất ~122h41'
    trước probe #42). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
