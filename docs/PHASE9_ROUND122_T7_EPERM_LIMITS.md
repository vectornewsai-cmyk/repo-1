# PHASE9 ROUND122 T7 — EPERM: probe #41 + mù #40 (A ĐÓNG, B MỞ, C ĐÓNG) + gap #62→#63 CHỨNG NHẬN DẠNG KHOẢNG + mù #39 J KIỂM LẠI VẪN MỞ

> Luồng T7, đợt 122 vòng lặp Phase 9 VCut Studio (lượt cron 18:35 +07,
> 16/11/2026; làm việc 11:37Z → 11:52Z 16/11/2026).
> Nhiệm vụ: probe #41 + mù #39 J (kiểm lại, có bằng chứng mới không) +
> mù #40 + quét sóng EPERM + quét writeFileSync lần thứ 28 + ghi RAM
> (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round122-t7/prereg-t7.md (định nghĩa probe #41, mốc đối
> chiếu, tiêu chí đóng mù #40, dự báo đoạn A ĐÓNG / B MỞ / C ĐÓNG).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG thử lại mù #38 G.** **KHÔNG tự đóng mù
> #37, #35, #31, #30, #29, #28, #26, #24, #21, hay reboot #16** — chỉ
> báo cáo "không thấy" vs "không có". G1 + mù #22/#28/#29/#30/#31/#35
> chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (11:38:49Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.684 s, last #40 08:40:45Z, boot
  9788ce28, exit 1); `once` ngay sau đó là **probe #41, boot
  3fe7e89e, ok=2 fail=0**, exit 0, 11:38:49Z; `status` chạy lại
  **ALIVE** (age 0 s, n=41), exit 0. Log v2 tăng đúng **3 dòng**
  (112 → 115) — **như R7/S7/T7/T6/T5/T4 (+3)**; prereg §1 đã dự báo
  đúng +3 trước khi đo. Heartbeat nay n=41, ts 11:38:49Z, boot
  3fe7e89e.
- **Boot #64 (tạm) lúc 11:05:18Z, boot
  `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`** — xác minh bằng `uptime -s`
  + btime 1794827118 + `who -b` + journal 1 boot + wtmp +
  `ps` systemd PID 1 START 11:05:28 (xem §1). Clock VM hiện tại CHÍNH
  XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u`
  trong 0–1 s) → **F_now ≈ 0**.
- **Khoảng mù #40: 08:40:45Z → 11:38:49Z (2h58'04") — KHÔNG ĐÓNG
  HOÀN TOÀN (mới, lượt này).** Đoạn A **ĐÓNG** (probe #40 uptime +
  poller T10 đợt 121 run 1 + scan WFS của T4 + 422 mốc mtime, lỗ
  lớn nhất chỉ 32 s + đuôi ≤ 189 s < sàn); đoạn B **KHÔNG ĐÓNG**
  (đuôi (10:42:19Z, 11:05:18Z] 1.379 s, 0 session bắc qua cắt B-hi,
  0 session chạm đuôi, 0 file trong cả 3 phạm vi + /tmp trong đuôi,
  tối đa 1 ẩn danh nghĩa); đoạn C **ĐÓNG** (uptime trực tiếp lúc
  probe #41 + dấu boot tươi sibling đợt 122). **2 reboot đã chốt
  trong mù (#63 08:53:05Z, #64 11:05:18Z — cả hai đều có giây chính
  xác trên đĩa) + tối đa 1 ẩn danh nghĩa (đuôi đoạn B).**
- **Gap #62→#63 = KHOẢNG [27'18", 30'33"] ([1.638, 1.833] s, mid
  28'55,5" = 1.735,5 s) ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG (mới, xem
  §2.5).** Điều kiện: đoạn A mù #40 đã đóng (xem §2.3). Dạng khoảng
  vì bước nhảy clock tại #63 đã CHỨNG MINH (X ∈ [6, 195] s,
  T4-121 §2.2) — lượt này thêm **nhân chứng thứ hai cho bước nhảy**
  (session birth 08:44:23Z mtime 08:53:08Z theo đồng hồ cũ, 3 s
  sau btime #63). CERT n=34 → **n=35**; FULL n=49 → **n=50**.
  Dải chứng nhận [19'07", 3h14'08"] không đổi.
- **Gap #63→#64 = 2h12'13" (7.933 s) CHỈ LÀ SPAN** (đoạn B mở) —
  KHÔNG vào FULL/CERT.
- **Mù #39 đoạn J: KIỂM LẠI — VẪN MỞ (xem §2.6).** Quét lại tươi
  đuôi (07:37:47Z, 08:25:47Z]: 0 file trong cả 3 phạm vi + /tmp,
  0 session chạm đuôi; 3 file viết sau 09:05Z nhắc 80a940d7 đều
  là trích dẫn hồi tưởng / chuỗi trong code, không có lần đọc tươi
  nào trong đuôi. Không có bằng chứng mới.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" (mẫu hoa O) trong
  504 file *.log có mtime trong mù #40 (0 file repo-1, 504 file
  hidden_files); 19 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả launcher đã biết** (2× T10-O8 + 17× T9 smoke). **Đính chính
  phân loại mới (xem §2.4):** 8 dòng "operation not permitted"
  (thường o) trong q5-bridge.log là **nội dung cũ từ sóng 11/11** —
  lần ghi thêm duy nhất trong mù #40 (09:09:03Z, T9 probe89q5)
  chỉ thêm banner khởi động sạch, bridge báo OK 09:09:04Z, 0 dòng
  EPERM sau banner cuối. Sóng gần nhất vẫn là **~11:55–12:11Z
  11/11** (R7) — **~119h27'49"** trước probe #41. EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- **Quét writeFileSync lần 28: 812 dòng / 228 file** (phạm vi 2.959
  file); R7b đối chiếu 837 dòng / 245 file; copies 25 dòng / 17
  file — y hệt lần 27 về copies; đối chiếu chéo 812+25=837=R7b,
  **chênh 0 — lần thứ hai mươi tám liên tiếp**. +24 dòng / +13
  file so với lần 27, giải thích đúng hết bằng diff (xem §2.7).
  Async `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** (+ 1
  bản build dist cũ của cùng helper) — 0 stray; mtime không đổi từ
  10–11/11.
- RAM: max biết được trong mù #40 **3.189 MB** (T8, 08:59:06Z,
  đoạn B) = 52% ngưỡng guard — cao hơn mù #39 (1.983 MB) nhưng
  vẫn dưới guard; đoạn A max 2.614 MB, đoạn C không có mẫu.
  Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong gói.
  Reboot #16 VẪN MỞ; cron riêng 10 phút vẫn chờ user quyết; R9 (a)
  vẫn chờ user.
- **Không có reboot nào khác trong lúc T7 làm việc** (boot vẫn
  3fe7e89e, uptime-s 11:05:18Z lúc 11:47:23Z — kiểm lại trước khi
  viết LIMITS).
- **dpkg.log boot #64: chỉ 2 dòng** (11:35:39Z); `/var/log/apt/`
  KHÔNG TỒN TẠI — không có bracket replay cho boot #64 (như #60,
  #62, #63, xem §2.1).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 11:38:47Z | boot_id `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`; `who -b` Nov 16 11:05; `uptime -s` **2026-11-16 11:05:18**; btime **1794827118 = 2026-11-16T11:05:18Z**; journal chỉ 1 boot (3fe7e89e, first entry 11:05:29Z, last 11:38:39Z lúc kiểm tra); `last -x reboot` 11:05 still running; wtmp begins 11:05:29Z; `ps` systemd PID 1 START 11:05:28 |
| `bash scripts/probe-eperm-v2.sh status` | 11:38:49Z | **DEAD/STALE**, heartbeat n=40, ts 08:40:45Z, boot 9788ce28, age **10.684 s** (đúng 2h58'04"); last sample probe #40; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 11:38:49Z | **probe #41, boot=3fe7e89e, ok=2 fail=0**, exit 0; dòng `boot changed 9788ce28 -> 3fe7e89e` (uptime since 2026-11-16 11:05:18) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 11:38:49Z | **ALIVE**, age 0 s, n=41, exit 0 |

Kiểm lại từ đĩa: log probe v2 **115 dòng** — 112 sau T4 đợt 121 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #40 +
dòng `boot changed` + dòng probe #41). **Như R7/S7/T7/T6/T5/T4
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #40 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=41, ts 2026-11-16T11:38:49Z, boot
3fe7e89e-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (34 dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #64: T5 đợt 122 t5-check122.sh 11:37:43Z
(/tmp) + T5/T6 đợt 122 file mtime 11:38:23Z/11:38:24Z trên boot
#64 + driver mở đợt 122 (round-in-progress.md mtime 11:35Z) +
2 session đợt 122 trong vùng C (birth 11:37:46Z, 11:38:14Z — xem
§2.3). **Số thứ tự TẠM THỜI** (mù #35 chưa đóng, tối đa +24 ẩn
danh nghĩa, cộng thêm tối đa +29 từ mù #37, +6 từ mù #38 đoạn G,
+2 từ mù #39 đoạn J và +1 từ mù #40 đoạn B → "thực tế #64" có
thể tới #131; xem §2.2).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #40 (08:40:45Z → 11:38:49Z, 2h58'04")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #41: `uptime -s` = **2026-11-16 11:05:18Z**,
  boot_id `3fe7e89e-ec8d-49d7-a7f0-2616bed14828` — khác boot của
  probe #40 (9788ce28).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (11:38Z): chỉ **1 boot**
  (3fe7e89e, first entry 11:05:29Z, last 11:38:39Z). `last -x
  reboot`: chỉ 1 dòng (11:05, still running). wtmp bắt đầu
  11:05:29Z. Journal/wtmp của boot 725453a2 đã mất theo reboot
  #64 — như mọi lần trước, chỉ giữ boot hiện tại.
- **dpkg.log KHÔNG có bracket replay cho boot #64 (như #60, #62,
  #63):** file `/var/log/dpkg.log` lúc kiểm tra chỉ có **2 dòng,
  cả hai là `2026-11-16 11:35:39 startup packages configure`** —
  tức 30'21" SAU boot, lúc driver mở đợt 122, không phải replay
  lúc boot. **`/var/log/apt/` KHÔNG TỒN TẠI** (như đợt 120/121).
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  lượt này). `btmp` cũng chỉ bắt đầu 11:05:29Z (boot hiện tại).

### 2.2 Hai reboot đã chốt trong mù — #63 (08:53:05Z), #64 (11:05:18Z) — và nhân chứng thứ hai cho bước nhảy tại #63

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 63 | **08:53:05Z** (chính xác từng giây theo đồng hồ mới — NHƯNG xem caveat bước nhảy clock dưới) | 9788ce28 → 725453a2 | Chốt từ T4-121 §2.2; **kiểm lại lượt này bằng bằng chứng độc lập:** poller T10 đợt 121 RESTART 08:54:30Z đọc boot=725453a2 tươi + run 2 START 08:54:31Z boot=725453a2 + T8 driver REBOOT-DETECT 08:56:39Z (boot 9788ce28 → 725453a2, uptime_s=2026-11-16 08:53:05) + T5 POSTBOOT_PASS (mtime 09:28:14Z, boot 725453a2, btime 08:53:05Z, check-only exit 0 lúc 09:27:19Z) + probe89q5 log "09:09:03 up 15 min" (khớp boot ~08:53–08:54Z). **Số thứ tự TẠM THỜI. Thuộc mù #40 — đoạn A đóng lượt này.** |
| 64 | **11:05:18Z** (chính xác từng giây) | 725453a2 → 3fe7e89e | Chốt từ lượt này: `uptime -s` đọc tươi (11:38:47Z) + btime 1794827118 + `who -b` 11:05 + boot_id 3fe7e89e + journal first entry 11:05:29Z + wtmp begins 11:05:29Z + `ps` systemd PID 1 START 11:05:28 + probe #41 11:38:49Z boot 3fe7e89e ok=2 fail=0 + T5/T6 đợt 122 file mtime 11:38:23Z/11:38:24Z trên boot #64 + driver mở đợt 122 11:35Z. **Số thứ tự TẠM THỜI.** |

**Clock:** F_now ≈ 0 (`date -u` 11:38:49Z vs HTTP `Date`
example.com 11:38:49Z, google.com 11:38:49Z, cloudflare.com
11:38:50Z — khớp trong 0–1 s). F62 ≈ 0 (đã kiểm 08:39Z đợt
121, trên boot #62). **F63/F64 KHÔNG BIẾT ĐẦY ĐỦ** — và bước nhảy
tại #63 đã CHỨNG MINH (xem dưới); F64 không có kiểm HTTP Date
nào trong boot #64. Mọi gap trong mù #40 đều là hiệu số đồng hồ
VM cho tới khi chứng minh F ổn định (xem caveat §2.5).

**BƯỚC NHẢY CLOCK TẠI #63 — NHÂN CHỨNG THỨ HAI (mới, lượt này):**
- T4-121 §2.2 đã chứng minh X ∈ [6, 195] s bằng SCAN-END
  08:53:11Z (đồng hồ cũ) vs btime #63 08:53:05Z.
- **Nhân chứng thứ hai, độc lập:** exec-log session
  `proc_0b4e78aa2632.log` — birth **08:44:23Z**, mtime
  **08:53:08Z** (xác minh trên đĩa, sessions-all.txt). Một tiến
  trình sinh ra trên boot #62 (08:44:23Z) đã ghi log ở 08:53:08Z
  theo đồng hồ cũ — **3 giây SAU btime của boot kế tiếp
  (08:53:05Z)**. Tiến trình này không thể sống sau reboot 3 giây.
  Kết luận độc lập, cùng chiều với T4: đồng hồ đã bước lùi tại
  #63. (Nhân chứng này cho cận dưới yếu hơn, X ≥ 3 s; cận chính
  vẫn X ∈ [6, 195] s từ SCAN-END của T4.)
- **Không có dấu nhảy clock tại #64 (cũng không có bằng chứng
  ngược):** không có observer nào sống trong đuôi đoạn B sau
  10:42:19Z; poller T10 đợt 121 dừng 10:15:00Z theo thiết kế
  (9/9 → exit, xem §2.3); không có cadence nào sau 10:15:00Z để
  đặt cận cho X tại #64. **F64 chưa kiểm, không có cận nhảy** —
  yếu hơn cả #61 (có cận X ≤ 36 s từ cadence poller). Vì gap
  #63→#64 chỉ là SPAN (đoạn B mở) nên thiếu cận này không ảnh
  hưởng chứng nhận lượt này; nếu sau này đoạn B được đóng bằng
  bằng chứng ngoài VM thì gap #63→#64 vẫn mang caveat F64.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #62→#63 = **KHOẢNG [27'18", 30'33"]** ([1.638, 1.833] s,
  mid 28'55,5" = 1.735,5 s) — **ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG
  lượt này** (đoạn A đóng, xem §2.5).
- Gap #63→#64 = **2h12'13"** (7.933 s) — CHỈ LÀ SPAN (đoạn B mở),
  KHÔNG chứng nhận, KHÔNG vào FULL.
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):** #64 từ
  #63: [09:12:12Z, 12:07:13Z] — #64 thật 11:05:18Z NẰM TRONG;
  #65 từ #64 (p10–p90 FULL50): [11:52:12Z, 14:06:58Z]. Hiệu dụng
  sau probe #41: [11:38:49Z, 14:19:26Z].

### 2.3 Hoạt động trong khoảng mù — vì sao A + C đóng, B mở

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **161 file** +
hidden_files **1.159 file**; **1.320 file, 1.254 mốc giây phân
biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 19/P6 §4 mục
20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/T6 đợt 118 §2.3/T6
đợt 119 §2.3/T5 §2.3/T4 §2.3). Chia mù làm ba đoạn bởi #63
(08:53:05Z) và #64 (11:05:18Z):

- **Đoạn A: 08:40:45Z → 08:53:05Z (12'20", boot #62 9788ce28) —
  ĐÓNG bằng đo uptime tại probe #40 + poller T10 đợt 121 run 1 +
  scan WFS của T4 + mật độ mtime dày:**
  - Probe #40 (08:40:45Z) đo uptime chứng minh up liên tục từ
    08:25:47Z tới 08:40:45Z — đóng tới 08:40:45Z (đầu đoạn = giờ
    probe, 0 s).
  - **Poller T10 đợt 121 run 1 là 1 tiến trình duy nhất (kiểm
    bằng code poll121-t10.sh: 1 vòng `for i in $(seq 1 30)`,
    `sleep 300`, exit khi 9/9, không có cơ chế restart; RESTART
    là lần chạy lại thủ công):** START 08:41:20Z boot 9788ce28;
    3 poll #1–#3, đúng số thứ tự, đúng **300 s** mỗi bước
    (08:41:20Z → 08:51:20Z). Đóng (08:41:20Z, 08:51:20Z] theo
    đồng hồ ghi.
  - **Scan WFS của T4 (observer độc lập thứ hai, 1 tiến trình
    duy nhất — script bash tuyến tính):** SCAN-START 08:52:51Z,
    SCAN-END **08:53:11Z** (đồng hồ cũ — chính là nhân chứng
    bước nhảy, xem §2.2).
  - Mật độ mtime củng cố: **422 mốc**, lỗ lớn nhất chỉ **32 s**
    (08:44:49Z → 08:45:21Z); mốc đầu 08:40:45Z (= giờ probe),
    mốc cuối 08:53:01Z; **15 session** chạm đoạn A (trong đó 1
    session birth 08:44:23Z mtime 08:53:08Z — nhân chứng nhảy
    thứ hai).
  - Đầu: probe #40 08:40:45Z → poller start 08:41:20Z = 35 s <
    sàn. Đuôi: quan sát cuối là SCAN-END 08:53:11Z (đồng hồ cũ);
    giờ reboot thật (đồng hồ cũ) ∈ (08:53:11Z, 08:56:20Z] (cận
    trên từ poll #4 due 08:56:20Z của poller run 1 không bao giờ
    ghi) → đuôi sau quan sát cuối ≤ **189 s** < sàn 19'07".
  - Đoạn A dài 740 s < sàn 1.147 s nên không áp cắt sàn — uptime
    + observer là closer.
  - **Kết luận đoạn A: ĐÓNG.**
- **Đoạn B: 08:53:05Z → 11:05:18Z (2h12'13", boot #63 725453a2) —
  KHÔNG ĐÓNG: đuôi (10:42:19Z, 11:05:18Z] 1.379 s (22'59"):**
  - Phủ tới 10:42:19Z: poller T10 đợt 121 run 2 (RESTART
    08:54:30Z sau #63; START 08:54:31Z boot 725453a2; 16 poll
    #1–#16, đúng số thứ tự, đúng **300 s** mỗi bước,
    08:54:31Z → 10:09:31Z; poll #16 9/9 → PHASE1-TRIGGERED
    10:09:31Z, ALL 9 DONE) + 2 lần WAITER RESTART (10:10:00Z,
    10:15:00Z, mỗi lần 1 poll, ALL 9 DONE) + phase-1 driver
    10:16:04Z (suite 27/27) + T10 đóng đợt 121 ~10:28Z +
    **2 session bắc qua cắt B-lo (09:12:12Z)** (08:55:09Z →
    10:20:00Z; 09:05:07Z → 09:13:52Z) + T5 repair 09:14–09:26Z
    + postboot PASS 09:27:19Z + T9 smoke probes 09:09–09:14Z +
    T8 H3f driver tới 08:59:06Z.
  - **Nhưng 0 session bắc qua cắt B-hi (10:46:11Z)** và **0
    session chạm vùng đuôi (10:31:11Z, 11:05:18Z]**.
  - Mốc cuối trong hai cây: **10:31:11Z**
    (docs/PHASE9_ROUND121_LIMITS.md — T10 viết lúc đóng đợt
    121). Đọc tốt nhất cho đuôi đến từ **ngoài hai cây**:
    7 file proactivity (goals/tracking/memory/conversation/
    scheduled-crons/sent/geofences.md) mtime **10:41:55Z** +
    1 file tool-output exec-call JSON mtime **10:42:19Z**
    (exec-call_01a1e3f3594a7605b199ba1842f919e3.json — output của
    một lệnh `ls` hidden_files, exit 0). Đây là hoạt động sống
    trên boot #63 (khớp phiên main-chat của parent ra quyết lúc
    ~10:3xZ); thư mục proactivity mang epoch 1794825715273 =
    10:41:55Z, khớp mtime. **Sau 10:42:19Z: KHÔNG CÒN GÌ cho tới
    #64 11:05:18Z.** 0 file trong cả 3 phạm vi + /tmp trong
    (10:42:19Z, 11:05:18Z]; 0 file repo-1/hidden_files//tmp trong
    (10:31:11Z, 11:05:18Z].
  - Đuôi 1.379 s > sàn 1.147 s; tối đa ẩn danh nghĩa =
    ⌊1.379/1.147⌋ = **1**. (Ngay cả khi bỏ qua 8 file ngoài hai
    cây, đuôi 2.046 s vẫn > sàn — verdict không phụ thuộc vào
    cách đọc ngoài cây.)
  - **Kết luận đoạn B: KHÔNG ĐÓNG.** (Prereg §2 đã dự báo đúng
    B mở vì đuôi dài.)
- **Đoạn C: 11:05:18Z → 11:38:49Z (33'31", boot #64 3fe7e89e) —
  ĐÓNG bằng đo uptime trực tiếp + probe #41 + dấu boot tươi:**
  - **`uptime -s` lúc 11:38:47Z = 11:05:18Z** chứng minh máy up
    liên tục từ #64 tới lúc đo; probe #41 11:38:49Z đọc boot_id
    3fe7e89e tươi — cùng boot_id với boot bắt đầu 11:05:18Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K.) Đoạn C
    dài 2.011 s > sàn nhưng uptime trực tiếp là closer duy nhất
    cho toàn đoạn — không cần mtime (như T6-119 đoạn D và T5-120
    đoạn H).
  - **Chuỗi dấu boot tươi củng cố:** T5/T6 đợt 122 file mtime
    11:38:23Z/11:38:24Z trên boot #64 + driver mở đợt 122
    (round-in-progress.md mtime 11:35Z) + 2 session đợt 122
    trong vùng C (birth 11:37:46Z, 11:38:14Z) + 15 mốc mtime
    (mốc đầu 11:36:34Z — lúc mở đợt 122; mốc cuối 11:38:46Z).
    Lỗ mtime (11:05:18Z → 11:36:34Z] 1.876 s là máy yên sau boot
    (lượt cron 18:35 +07 mở đợt 122 lúc 11:35Z), không observer
    — nhưng uptime đóng đoạn này.
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #40 KHÔNG ĐÓNG HOÀN TOÀN.** Đoạn
A + C đóng; đoạn B mở (1 cửa sổ mở ở đuôi, 22'59"); 2 reboot đã
chốt giờ (#63 08:53:05Z, #64 11:05:18Z — cả hai chính xác từng giây
trên đĩa) + tối đa **1 ẩn danh nghĩa** (đuôi đoạn B). Số thứ tự
#63/#64 vẫn TẠM THỜI.

### 2.4 Quét sóng EPERM trong mù #40 — 0 sóng thật (bằng chứng âm tính)

Quét toàn bộ file *.log có mtime trong mù #40 (bằng script
eperm-sweep.py; eperm-sweep*.log của chính mình bị loại theo bài
học T7 §4 mục 19):

| Phạm vi quét | "vẫn bật" | "CẢNH BÁO 10 phút" | "Operation not permitted" | "sóng EPERM đã tắt" |
|---|---|---|---|---|
| repo-1 (0 file) | 0 | 0 | 0 | 0 |
| hidden_files (504 file) | 0 | 0 | 0 | **19** (dương tính giả đã biết, xem dưới) |
| **Tổng 504 file** | **0** | **0** | **0** | **19 FP** |

19 dòng "đã tắt" đều là dương tính giả launcher đã biết — không
phải sóng thật:
- 2× t10-o8.log (10:14:18Z, 10:15:10Z — T10 đợt 121 O8 driver
  launcher, cùng mẫu như 4× đợt 119 và 2× đợt 120).
- 17× round121-t9/smoke/probe*.log (09:09:04Z–09:14:22Z — T9
  vite harness launcher, cùng mẫu "sóng EPERM đã tắt, khởi động
  vite").

Quét mở rộng `/eperm|not permitted/i`: **146 match thô / 44 dòng
duy nhất** — phân loại hết:
- 8 dòng duy nhất trong q5-bridge.log (round89-q5/probe-chromium)
  — **nội dung cũ từ sóng 11/11, KHÔNG phải sóng mới** (xem
  đính chính phân loại dưới).
- 6 dòng test-pass hasEperm trong round121-t10-suites.log (test tự
  kiểm "not permitted" như kết quả mong đợi).
- 2 dòng launcher T10-O8 trên + 17 dòng launcher T9 smoke trên.
- 11 dòng recount-push121.log (tên file LIMITS EPERM trong danh
  sách oversize + tên batch phase9-round121-t4-eperm).
**0 sóng EPERM thật.**

**Đính chính phân loại — q5-bridge.log (mới, lượt này):**
- File birth **11/11 11:41:16Z** (giữa sóng EPERM 11/11), mtime
  **16/11 09:09:03Z** (trong mù #40, đoạn B). Nội dung: 12 banner
  khởi động bridge server + các dòng EPERM retry ghi lỗi
  "operation not permitted, write" khi persist rate-limit state
  xuống /tmp/round89-q5/bridge-work/.
- Lần ghi thêm duy nhất trong mù #40 là **T9 probe89q5
  (09:09:03Z)**: script probe mở `q5-bridge.log` ở chế độ append
  (round121-t9/backup/...probe89q5-seek-latency.mjs:191) để ghi
  stdout/stderr của bridge mới khởi động. Banner cuối trong file
  là lần chạy này (work dir /tmp/round89-q5-11347/, PID 11347).
- **0 dòng EPERM nào sau banner cuối.** Probe log của chính lần
  chạy đó ghi "bridge OK: http://127.0.0.1:8871" lúc 09:09:04Z
  và vite lên bình thường — bridge khởi động sạch, không lỗi
  EPERM. Các dòng EPERM trong file gắn với các banner PID cũ
  (16700/18495/19483/19880/21435, thời sóng 11/11).
- Bài học: mẫu quét "Operation not permitted" hoa O cho 0, nhưng
  nội dung thường o trong file cũ vẫn phải đọc tay từng file để
  phân loại thời điểm — T7 đã làm vậy lượt này. Không có sóng mới.

- Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7 đợt 115) —
  **~119h27'49"** trước probe #41 (11:38:49Z).
- EPERM **không** được tuyên bố là đã hết — như R7/S7/T7/T6/T5/T4:
  1 lượt không sóng = bằng chứng âm tính cho lượt đó, không phải
  kết luận hệ thống.

### 2.5 Phân phối gap — CERT n=35, FULL n=50 (mới: +1 gap từ mù #40)

**Gap #62→#63 = KHOẢNG [27'18", 30'33"] ([1.638, 1.833] s, mid
28'55,5" = 1.735,5 s) ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG.** Điều kiện:
đoạn A mù #40 đã đóng (xem §2.3). **CAVEAT (đứng, khác các gap
điểm):** bước nhảy clock tại #63 đã CHỨNG MINH (X ∈ [6, 195] s)
nên gap này chỉ có thể là khoảng, không phải điểm — cùng cách xử
lý như #53→#54 và #57→#58. F63 chưa kiểm đầy đủ (không có kiểm
HTTP Date trong boot #63); nếu sau này parent cung cấp neo giờ
thật độc lập cho #63 thì khoảng này thu về điểm. Độ nhạy đầu mút:
CERT35-LO mean chỉ lệch −3 s, CERT35-HI +3 s so với mid; median
và p10/p90 không đổi (xem dưới).

**Gap #63→#64 = 2h12'13" (7.933 s) CHỈ LÀ SPAN — KHÔNG đưa vào
FULL/CERT** — đoạn B mù #40 mở (đuôi 1.379 s, tối đa 1 ẩn).
Cùng luật như #55→#56 / #56→#57 (T6-119 §2.5), span #59→#60
(10.680 s, T5-120 §2.5) và span #61→#62 (5.689 s, T4-121 §2.5).

**Cross-check tái hiện T4(121) 100%:** chạy blind39-gaps.py
verbatim cho lại đúng CERT n=34 / FULL n=49 của T4 đợt 121 (xem
blind40-gaps.txt: CERT34 mean 1h49'08" median 1h59'16" p10
0h58'25" p90 2h26'14" sd 0h40'18"; FULL49 mean 1h54'27" median
1h58'47" p10 0h49'41" p90 3h02'00" sd 0h56'30" — khớp T4 §2.5
từng số).

Bảng so sánh (CERT = gap đơn/khoảng đã chứng nhận, thống kê dùng
mid; FULL = CERT + gap chưa chứng nhận + gap khoảng):

| | CERT n=34 (T4-121) | **CERT n=35 (T7-122)** | FULL n=49 (T4-121) | **FULL n=50 (T7-122)** |
|---|---|---|---|---|
| mean | 1h49'08" | **1h46'51"** | 1h54'27" | **1h52'45"** |
| median | 1h59'16" | **1h58'47"** | 1h58'47" | **1h58'30"** |
| p10 | 0h58'25" | **0h50'43"** | 0h49'41" | **0h46'54"** |
| p90 | 2h26'14" | **2h25'57"** | 3h02'00" | **3h01'40"** |
| sd | 0h40'18" | **0h41'57"** | 0h56'30" | **0h57'13"** |
| min | 19'07" | **19'07"** | 19'07" | **19'07"** |
| max | 3h14'08" | **3h14'08"** | 5h43'18" | **5h43'18"** |

- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới nằm
  giữa; gap #62→#63 mid 28'55,5" là gap ngắn thứ hai trong CERT,
  sau sàn 19'07").
- **Độ nhạy đầu mút #62→#63:** CERT35-LO (1.638 s) mean
  1h46'48"; CERT35-HI (1.833 s) mean 1h46'54"; FULL50-LO mean
  1h52'43"; FULL50-HI mean 1h52'47" — lệch ±3 s / ±2 s so với
  mid; median và p10/p90 không đổi.
- **Tốc độ reboot (đồng hồ ghi nhận):** 64 / 134,79 h = **1 reboot
  mỗi 126,4 phút** (từ #1 2026-11-10T20:18:10Z tới #64
  2026-11-16T11:05:18Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 68 / 134,79 h = **1 mỗi 118,9 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2) và mù #40 đoạn B (+1).
- **Phân phối FULL50:** 27/50 trong 90–150 phút; 8 gap <60 phút;
  6 gap >180 phút; 2 gap >240 phút. Gap #62→#63 (mid 28'55,5")
  là gap ngắn thứ hai trong CERT — ngắn hơn p10 FULL50 (46'54")
  nhưng vẫn trong dải chứng nhận.
- **Lưu ý về #64:** gap danh nghĩa #63→#64 = 2h12'13" (7.933 s)
  nằm trong khối chính 90–150 phút, không phải outlier — nhưng
  vẫn chỉ là SPAN vì đoạn B mở.

### 2.6 Trạng thái các mù cũ — mù #39 đoạn J KIỂM LẠI: VẪN MỞ

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #40 | KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'04", tối đa 1 ẩn) | Mới, lượt này (§2.3); probe #42 đợt sau tiếp tục |
| #39 | KHÔNG ĐÓNG HOÀN TOÀN (I+K đóng, J mở, 2h56'14", tối đa 2 ẩn) | **Kiểm lại lượt này: J VẪN MỞ** (xem dưới); 2 reboot đã chốt + tối đa 2 ẩn |
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | **Thử cuối đã thất bại đợt 121 — KHÔNG thử lại lượt này** (theo brief T7); cần parent quyết có chấp nhận để mở như mù #35/#37 hay không |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 §2.3 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#64 vẫn TẠM THỜI vì mù này |
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

**Mù #39 đoạn J — kiểm lại lượt này (theo brief T7):**
- Quét lại TƯƠI đuôi (07:37:47Z, 08:25:47Z]: repo-1 = 0,
  hidden_files = 0, ngoài hai cây = 0, /tmp = 0 file có mtime
  trong đuôi; 0 session chạm đuôi (quét exec-log tươi, 218
  file).
- File viết sau 09:05Z (khi T4-121 xong) nhắc 80a940d7 (boot
  #61): 3 file — build-loop-log.md (4×: các mục đóng đợt 121
  lúc ~10:28Z + mở đợt 122 lúc ~11:40Z, đều là trích dẫn hồi
  tưởng boot #61, KHÔNG có lần đọc uptime/boot tươi nào trong
  đuôi) + prereg-t7.md của chính T7 (1×, chuỗi trong prereg) +
  blind40-sessions.py của chính T7 (5×, chuỗi trong code).
  Không có bằng chứng mới.
- **Kết luận: đoạn J VẪN MỞ. Không có gì mới để đóng — chỉ còn
  cách chờ parent cung cấp bằng chứng nếu có.** Mù #39 giữ
  nguyên trạng thái KHÔNG ĐÓNG HOÀN TOÀN; cần parent quyết có
  chấp nhận để mở như mù #35/#37 hay không (T4-121 đã đề xuất
  ĐỂ MỞ, xem §5 mục 1).

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 28 — chênh 0 (lần thứ 28 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T4 trong round121-t4, đổi OUT sang
  round122-t7) **11:47:38Z → 11:48:49Z 16/11 (71 s, có SCAN-END)**.
  Lưu ý: scan chạy trên boot #64, SAU khi mù #40 đã đóng bằng
  probe #41 (11:38:49Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code
  hiện tại, không phụ thuộc giờ mù.
- NEWSTD: **812 dòng / 228 file** (phạm vi 2.959 file); R7b đối
  chiếu: **837 dòng / 245 file** (phạm vi 12.352 file); copies:
  **25 dòng / 17 file** — y hệt lần 27. Đối chiếu chéo:
  812+25=837=R7b, **chênh 0**.
- **+24 dòng / +13 file so với lần 27** (788/215 → 812/228), giải
  thích đúng hết bằng diff (kiểm bằng đếm lại trực tiếp + mtime —
  mọi file đều về trước lúc scan bắt đầu 11:47:38Z 16/11; 0 file
  mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND121_T4_EPERM_LIMITS.md | +5 | 09:04:33Z 16/11 | Tài liệu T4 đợt 121 (chính nó nhắc `writeFileSync` 5 lần); viết sau scan lần 27 (08:52:51Z) nên lần này mới vào |
  | docs/PHASE9_ROUND121_T9_VITEHARNESS_LIMITS.md | +1 | 09:32:10Z 16/11 | Tài liệu T9 đợt 121 (nhắc `writeFileSync` 1 lần); viết sau scan lần 27 |
  | benchmarks/render/probe121t3-ghost-k7.webkit.mjs | +2 | 10:05:43Z 16/11 | Script probe T3 đợt 121 (ghi file kết quả — code probe bình thường); viết sau scan lần 27 |
  | apps/web/scripts/probe122t3-h3f-ab.mjs | +7 | 11:41:07Z 16/11 | Script probe T3 đợt 122 (ghi file kết quả/scratch — code probe bình thường); viết sau probe #41, trước scan lần 28 |
  | 10 file script đợt 122 (c3-round13 / check-proxy-auto / gopHeaded48D4 / gopHeaded49E2 / p5-round11 / probe-media-clock / r14-round14 / t5-round12 / v10-parity clicktest + 1) | +1 mỗi file | 11:44:06–11:44:07Z 16/11 | Script probe/clicktest của sibling đợt 122 (ghi file kết quả — code probe bình thường); viết sau probe #41, trước scan lần 28 |
- Phạm vi: 2.959 = 2.945 + 14 net (14 file mới, 0 file mất:
  13 file có hit trên + 1 file mới không có hit).
- **Kết luận: 28 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #40.

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
  né EPERM trong mù #40.

## 3. RAM trong mù #40 — max 3.189 MB (52% guard), birefnet KHÔNG chạy

- **1 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #40 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 11:47:23Z | **1.298.056 kB** | Trước khi viết LIMITS (boot #64) |
- **Max RAM biết được TRONG mù #40 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 208 mẫu RAM; **max 3.189 MB**
  (T8 H3f driver, 08:59:06Z, đoạn B) = **52% ngưỡng guard** —
  cao hơn mù #39 (1.983 MB) vì đợt 121 làm việc nặng (T5 repair,
  T2 pilot, T8 A/B) nhưng vẫn dưới guard; đoạn A max **2.614 MB**
  (gate0-wait T3, 08:52:39Z); đoạn C **không có mẫu nào**
  (máy yên sau boot, không observer ghi RAM).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 3,19 GB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Chỉ thử lại khi RAM đổi (xem §5 mục 7).

## 4. Ghi chú phương pháp (mới so với T4 đợt 121)

1. **Đuôi đoạn B đọc tốt nhất từ NGOÀI hai cây (mới, §2.3):**
   hai cây giám sát im từ 10:31:11Z, nhưng ngoài cây còn 8 file
   tới 10:42:19Z (7 file proactivity + 1 tool-output JSON). T7
   lấy 10:42:19Z làm mốc cuối (đuôi 1.379 s) thay vì 10:31:11Z
   (đuôi 2.046 s) — verdict B mở không đổi theo cả hai cách đọc,
   nhưng số ẩn tối đa (1) và độ dài đuôi phải ghi theo cách đọc
   tốt nhất, không ghi theo cách đọc xấu nhất. Bài học: quét
   ngoài cây không chỉ để khẳng định "0 file" mà còn để tìm mốc
   cuối thật — T4-121 §2.3 đoạn J đã làm đúng (116 file ngoài
   cây, 0 trong đuôi); lượt này ngoài cây CÓ file trong đuôi nên
   phải dùng chúng.
2. **Nhân chứng thứ hai cho bước nhảy clock tại #63 (mới, §2.2):**
   session exec-log birth 08:44:23Z mtime 08:53:08Z — cùng mẫu
   mâu thuẫn nội bộ như SCAN-END của T4 (ghi sau btime boot kế
   tiếp theo đồng hồ cũ). Bài học: khi quét session, luôn đối
   chiếu mtime của session sinh trước reboot với btime boot kế
   tiếp — đó là máy dò bước nhảy rẻ tiền, không cần poller.
3. **Phân loại dòng EPERM trong file cũ phải đọc tay theo thời
   điểm ghi (mới, §2.4):** mẫu quét hoa O cho 0 nhưng file
   q5-bridge.log chứa 8 dòng thường o từ sóng 11/11; chỉ đọc
   birth/mtime + banner cuối + log probe của lần chạy mới mới
   phân biệt được "nội dung cũ" với "sóng mới". Bài học: số 0
   của sweep chỉ có nghĩa sau khi mọi match thường o đã phân
   loại bằng thời điểm — T7 đã phân loại hết 44 dòng duy nhất
   lượt này.
4. **Caveat nhãn file re-check mù #39 J (mới, ghi rõ để khỏi
   hiểu nhầm):** file `blind39J-outside-recheck.txt` /
   `blind39J-tmp-recheck.txt` trên đĩa chứa bản quét NGOÀI CÂY
   theo cửa sổ mù #40 (do `scan_outside` ghi toàn bộ cửa sổ),
   còn kết quả J (0 file) là số đếm ĐÃ LỌC theo cửa sổ đuôi J
   in trong `blind40-sessions.log`. Số 0 của J là đúng (đếm bằng
   code từ cùng dữ liệu), chỉ tên file gây nhầm — luồng sau đổi
   tên file re-check cho đúng cửa sổ.
5. **Poller T10 đợt 121 dừng theo thiết kế, không phải chết
   (mới, §2.3):** run 2 dừng ở poll #16 10:09:31Z vì 9/9 →
   exit 0 (code `if [ "$n" -eq 9 ] ... exit 0`); 2 lần WAITER
   RESTART sau đó chỉ là poll xác nhận 9/9 (10:10:00Z,
   10:15:00Z). Không còn cadence nào sau 10:15:00Z nên KHÔNG có
   cận nhảy clock tại #64 — khác #61 (còn poll #14 due). Bài
   học: "poller dừng" phải đọc code xem dừng do trigger hay do
   reboot — T4 đã làm đúng với run 1 (reboot giết), lượt này làm
   đúng với run 2 (trigger dừng).
6. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo boot #64 (3fe7e89e, 11:05:18Z) ĐÚNG; dự báo đoạn
   A ĐÓNG / B MỞ / C ĐÓNG ĐÚNG cả ba; dự báo EPERM 0 sóng ĐÚNG;
   dự báo WFS chênh 0 ĐÚNG; dự báo RAM max < 4,81 MB ĐÚNG
   (3.189 MB) — không sửa sau khi thấy số. (Prereg dự báo đúng
   gap #62→#63 chứng nhận dạng khoảng, CERT n=35, FULL n=50.)
7. **Kiểm lại boot trước khi viết LIMITS (11:47:23Z):** boot
   3fe7e89e (#64), uptime-s 11:05:18Z — không reboot mới thêm
   trong lúc làm việc.
8. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard). **Không đụng cloud/collab/AI model
   đóng/nhạc bản quyền.**
9. **Stage batch:** chỉ 1 file text (LIMITS doc này),
   NUL-delimited, verify read-back (xem checkpoint3.txt + stage
   file).
10. **Ghi rõ:** số thứ tự reboot #47–#64 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
11. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat bước nhảy #63 (nhân chứng thứ
    hai) vào hồ sơ (xem §2.5).
12. **Cross-check tái hiện T4(121) 100%** (CERT n=34 / FULL n=49)
    trước khi tính số mới — chạy blind39-gaps.py verbatim qua exec.
13. **md5 preview.tsx ĐỔI trong lúc làm việc (ghi nhận, không
    phải lỗi):** 5be5a250 (baseline đợt 121) → 03bf029f lúc
    11:47Z — sibling đợt 122 đang sửa preview.tsx; media.ts giữ
    2c384ed1. T7 không sửa production file nào.
14. **Nhãn script poller đợt 121 sai (ghi nhận lại từ T4-121,
    không sửa):** poll121-t10.sh ghi header "T10 poller đợt 120"
    (copy-paste) dù chạy cho đợt 121 — chỉ là nhãn log, không
    ảnh hưởng số liệu.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #40 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** đoạn A + C đóng; đoạn B mở (đuôi 10:42:19Z →
   11:05:18Z, tối đa 1 ẩn). 2 reboot đã chốt (#63 08:53:05Z, #64
   11:05:18Z) + tối đa 1 ẩn danh nghĩa. Probe #42 đợt sau tiếp
   tục. **Cần parent quyết:** có chấp nhận để mù #40 mở như mù
   #35/#37/#38/#39 hay giao luồng điều tra thêm — T7 khuyến nghị
   ĐỂ MỞ (đuôi B là máy yên sau khi đợt 121 đóng xong + phiên
   main-chat của parent; không còn nguồn nào để đóng: 0 session,
   0 file trong đuôi; chỉ còn cách chờ parent cung cấp bằng
   chứng nếu có — ví dụ output `uptime -s` lúc parent ra quyết
   ~10:3xZ).
2. **Mù #39 đoạn J: KIỂM LẠI — VẪN MỞ (mới, §2.6).** Không còn
   nguồn nào để đóng J. **Cần parent quyết:** chấp nhận để mù
   #39 mở như mù #35/#37 (T7 khuyến nghị ĐỂ MỞ, cùng lý do như
   T4-121) hay giữ mở chờ bằng chứng từ bên ngoài VM.
3. **Mù #38 đoạn G: THỬ CUỐI ĐÃ THẤT BẠI đợt 121 — KHÔNG THỬ
   LẠI lượt này.** **Cần parent quyết:** chấp nhận để mù #38 mở
   như mù #35/#37 (T4-121 khuyến nghị ĐỂ MỞ) hay giữ mở chờ
   bằng chứng từ bên ngoài VM.
4. **Gap #62→#63 = KHOẢNG [1.638, 1.833] s ĐƯỢC CHỨNG NHẬN DẠNG
   KHOẢNG (mới — xem §2.5, CERT n=35, FULL n=50; caveat F63
   chưa kiểm đầy đủ + bước nhảy X ∈ [6, 195] s đã chứng minh,
   có nhân chứng thứ hai lượt này).** Cần parent xác nhận cách
   chứng nhận dạng khoảng (như đã làm với #53→#54 và #57→#58);
   nếu parent có neo giờ thật độc lập cho #63 thì khoảng thu về
   điểm.
5. **Bước nhảy clock tại #64: KHÔNG CÓ CẬN (mới, §2.2).** Không
   có observer nào sống trong đuôi đoạn B sau 10:42:19Z; poller
   dừng 10:15:00Z theo thiết kế nên không có cadence để đặt cận.
   **Cần parent biết:** nếu sau này đoạn B được đóng bằng bằng
   chứng ngoài VM thì gap #63→#64 vẫn mang caveat F64 chưa kiểm
   (yếu hơn cả gap #60→#61). T7 khuyến nghị lại **standing
   check mới (T4-121 đã đề xuất, T5-120 đã đề xuất, chưa thấy
   quyết): mỗi lượt EPERM đối chiếu giờ poll cuối của poller với
   btime boot kế tiếp** — cần parent duyệt vì đây là thay đổi
   quy trình chung.
6. **Đề xuất standing check (cần parent duyệt, nhắc lại từ
   T6-119 §5 mục 4, T5-120 §5 mục 4 và T4-121 §5 mục 5):** lượt
   cron BỎ QUA (vì chốt chặn) ghi thêm boot_id + `uptime -s`
   vào build-loop-log — lượt 18:35 +07 đã mở đợt 122 lúc 11:35Z,
   ngay sau #64; nếu có lượt cron nào chạy trong đuôi đoạn B thì
   đoạn B đã hẹp hơn nhiều. T7 KHÔNG tự đổi hành vi cron — chờ
   parent duyệt.
7. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
   --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
   117, chưa trả lời — nhắc lần 8). Watcher này sẽ lấp đúng loại
   lỗ như đuôi đoạn B của mù #40.
8. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
   parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
   117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
9. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi**
   (u2net là fallback chính thức). Max RAM trong mù #40 là
   3,19 GB (52% guard).
10. **EPERM không tuyên bố đã hết** (sóng gần nhất ~119h27'49"
    trước probe #41). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
