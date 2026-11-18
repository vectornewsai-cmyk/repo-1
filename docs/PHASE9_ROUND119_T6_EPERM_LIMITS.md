# PHASE9 ROUND119 T6 — EPERM: probe #38 + mù #37 KHÔNG ĐÓNG (B/C mở) + gap #54→#55 ĐƯỢC CHỨNG NHẬN

> Luồng T6, đợt 119 vòng lặp Phase 9 VCut Studio (lượt cron 06:35 +07,
> 16/11/2026; làm việc 23:41Z 15/11 → 00:1xZ 16/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + probe #38 cho mù
> #37 + quét sóng EPERM + quét writeFileSync lần thứ 25 + ghi RAM
> (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round119-t6/prereg-t6.md (định nghĩa probe #38, mốc đối
> chiếu, tiêu chí đóng mù #37, dự báo đoạn B/C KHÔNG đóng).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #31, #30, #29, #28, #26,
> #24, #21, hay reboot #16** — chỉ báo cáo "không thấy" vs "không
> có". Mù #31 KHÔNG thử lại. G1 + mù #22/#28/#29/#30 chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (23:45Z):** `status` báo
  **DEAD/STALE** (heartbeat age 43.527 s, last #37 11:39:50Z, boot
  48a82db1, exit 1); `once` ngay sau đó là **probe #38, boot
  27c8b1d9, ok=2 fail=0**, exit 0, 23:45:17Z; `status` chạy lại
  **ALIVE** (age 1 s, n=38), exit 0. Log v2 tăng đúng **3 dòng**
  (103 → 106) — **như R7/S7/T7/T6 (+3)**; prereg §1 đã dự báo đúng
  +3 trước khi đo. Heartbeat nay n=38, ts 23:45:17Z, boot 27c8b1d9.
- **Reboot #57 (tạm) lúc 23:33:34Z, boot
  `27c8b1d9-33dd-4c63-9989-f9254a66dbc2`** — xác minh bằng `uptime -s`
  ×2 + btime 1794785614 + `who -b` + journal 1 boot + wtmp + `ps`
  systemd PID 1 START 23:33:44 (xem §1). Clock VM hiện tại CHÍNH
  XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u`
  trong 1–4 s) → **F_now ≈ 0**; không có dấu hiệu giây nháy ở boot
  này (5 nguồn đồng ý trong ~23 s theo T7 đợt 119).
- **Khoảng mù #37: 11:39:50Z → 23:45:17Z (12h05'27") — KHÔNG ĐÓNG
  HOÀN TOÀN (mới, lượt này).** Đoạn A **ĐÓNG** (probe #37 uptime +
  poller T10 run 1 + T4 poll5m + T5 gate0 + 1 session bắc qua cắt
  A-hi + đuôi 125 s < sàn); đoạn B **KHÔNG ĐÓNG** (cửa sổ mở
  (13:20:29Z, ~20:17Z] ~6h56'31", tối đa 21 ẩn danh nghĩa — 0
  exec-log, 0 session, 0 file /tmp trong cửa sổ, xem §2.3);
  đoạn C **KHÔNG ĐÓNG** (cửa sổ mở (20:41:51Z, 23:33:34Z]
  2h51'43", tối đa 8 ẩn); đoạn D **ĐÓNG** (uptime trực tiếp lúc
  probe #38 + dấu boot tươi sibling đợt 119). **3 reboot đã chốt
  trong mù (#55 12:51:56Z, #56 ~20:17Z, #57 23:33:34Z) + tối đa 29
  ẩn danh nghĩa (21 + 8).**
- **Reboot #56 (tạm) ~20:17Z, boot 6805e92d — GIỜ CHỈ LÀ ƯỚC LƯỢNG
  CỦA PARENT, KHÔNG CÓ GIÂY NÀO TRÊN ĐĨA.** Không có file exec-log
  nào sinh trong (20:30Z, 21:10Z]; phiên đóng đợt 118 của parent
  viết LIMITS gộp bằng file tool (không qua exec) nên không để lại
  log chứa `uptime -s`. Lần đầu tiên một reboot chỉ có giờ ước
  lượng — hệ quả: gap #55→#56 và #56→#57 KHÔNG đưa vào FULL (xem
  §2.5).
- **Gap #54→#55 = 2h03'30" ĐƯỢC CHỨNG NHẬN (mới, lượt này — điểm,
  xem caveat F55 ở §2.5).** CERT n=30 → **n=31**; FULL n=45 →
  **n=46** (thống kê ở §2.5). Dải chứng nhận [19'07", 3h14'08"]
  không đổi.
- **Dấu hiệu mạnh có reboot ẩn trong đoạn B:** giờ #56 danh nghĩa
  (~20:17Z) nằm NGOÀI dải cơ học từ #55 ([13:11:03Z, 16:06:04Z])
  tới **4h10'56"** — hoặc gap thật dài bất thường, hoặc (khả năng
  cao hơn theo phân phối) có reboot ẩn trong cửa sổ mở. Ngược lại,
  #57 chỉ vượt dải cơ học từ #56 danh nghĩa **2'26"** — phù hợp
  với #56 thật muộn hơn ~20:17Z vài phút (nếu #56 ≥ 20:19:26Z thì
  gap #56→#57 nằm trong dải).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong 196
  file *.log có mtime trong mù #37 (0 file repo-1, 196 file
  hidden_files); 3 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả đã biết** (launcher T10 ×2 + T9 ×1). Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — **~107h34'** trước probe #38. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 25: 770 dòng / 211 file** (phạm vi 2.917
  file); R7b đối chiếu 795 dòng / 228 file; copies 25 dòng / 17
  file — y hệt lần 24 về copies; đối chiếu chéo 770+25=795=R7b,
  **chênh 0 — lần thứ hai mươi lăm liên tiếp**. +19 dòng / +3 file
  so với lần 24, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** (+ 1 bản
  build dist cũ của cùng helper) — 0 stray; mtime không đổi từ
  10–11/11.
- RAM: max biết được trong mù #37 **4.811 MB** (T4 poll5m,
  12:31:24Z, đoạn A) = 78% ngưỡng guard — cao nhất từ trước trong
  một mù nhưng vẫn dưới 6 GB. Birefnet KHÔNG chạy, vẫn 0 lần chạy
  thành công trong gói. Reboot #16 VẪN MỞ; cron riêng 10 phút vẫn
  chờ user quyết; R9 (a) vẫn chờ user.
- **Không có reboot mới trong lúc T6 làm việc** (boot vẫn 27c8b1d9,
  uptime-s 23:33:34Z lúc 00:10:54Z — kiểm lại trước khi viết LIMITS).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 23:45:07Z | boot_id `27c8b1d9-33dd-4c63-9989-f9254a66dbc2`; `who -b` Nov 15 23:33; `uptime -s` **2026-11-15 23:33:34** (2 lần, giống nhau từng giây); btime **1794785614 = 2026-11-15T23:33:34Z**; journal chỉ 1 boot (27c8b1d9, first entry 23:33:45Z, last 23:44:12Z lúc kiểm tra); `last -x reboot` 23:33 still running; wtmp bắt đầu 23:33:44Z; `ps` systemd PID 1 START 23:33:44 |
| `bash scripts/probe-eperm-v2.sh status` | 23:45Z | **DEAD/STALE**, heartbeat n=37, ts 11:39:50Z, boot 48a82db1, age **43.527 s** (đúng 12h05'27"); last sample probe #37; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 23:45:17Z | **probe #38, boot=27c8b1d9, ok=2 fail=0**, exit 0; dòng `boot changed 48a82db1 -> 27c8b1d9` (uptime since 2026-11-15 23:33:34) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 23:45Z | **ALIVE**, age 1 s, n=38, exit 0 |

Kiểm lại từ đĩa: log probe v2 **106 dòng** — 103 sau T6 đợt 118 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #37 +
dòng `boot changed` + dòng probe #38). **Như R7/S7/T7/T6 (+3):**
lượt này chưa có dòng DEAD nào cho heartbeat #37 nên `status`
ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3 trước khi
đo. Heartbeat **n=38, ts 2026-11-15T23:45:17Z, boot 27c8b1d9-…**;
log vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z 11/11) và
**0 dòng `=== probe end`** — loop v2 chưa từng được start lại kể
từ đợt 88.

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #57: T7 đợt 119 t7-initial-state.md (btime
1794785614 = 23:33:34Z, journal chỉ 1 boot, replay tới +2'05",
postboot exit 0, headroom exit 0, RAM 2124 MB) + t7-replay-done.md
(replay 23:35:39–23:41:08Z) + prereg T4 đợt 119 (uptime-s
23:33:34Z, boot 27c8b1d9) + T7 POSTBOOT_PASS (23:46Z). **Số thứ tự
TẠM THỜI** (mù #35 chưa đóng, tối đa +24 ẩn danh nghĩa, cộng thêm
tối đa +29 từ mù #37 này và +4 từ mù #29/#30/#31 → "thực tế #57" có thể tới #114; xem §2.2).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #37 (11:39:50Z → 23:45:17Z, 12h05'27")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #38: `uptime -s` = **2026-11-15 23:33:34Z**,
  boot_id `27c8b1d9-33dd-4c63-9989-f9254a66dbc2` — khác boot của
  probe #37 (48a82db1).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (23:45Z): chỉ **1 boot**
  (27c8b1d9, first entry 23:33:45Z, last 23:44:12Z). `last -x
  reboot`: chỉ 1 dòng (23:33, still running). wtmp bắt đầu
  23:33:44Z. Journal/wtmp của boot 6805e92d đã mất theo reboot
  #57 — như mọi lần trước, chỉ giữ boot hiện tại.
- **dpkg.log ĐÃ BỊ CẮT NGẮN theo boot (như đợt 118):** file
  `/var/log/dpkg.log` hiện chỉ có **1.509 dòng, dòng đầu tiên là
  2026-11-15 23:35:39Z** (replay boot #57). **`/var/log/apt/
  history.log` cũng vậy:** 50 Start-Date, tất cả trong boot hiện
  tại (đầu tiên 23:36:21Z). Không còn nguồn log hệ thống bền nào
  cho các boot cũ — điều tra mù chỉ dựa vào log agent trên đĩa.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  lượt này). `btmp` cũng chỉ bắt đầu 23:33:45Z (boot hiện tại).

### 2.2 Ba reboot đã chốt trong mù — #55 (12:51:56Z), #56 (~20:17Z, ƯỚC LƯỢNG), #57 (23:33:34Z)

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 55 | **12:51:56Z** (chính xác từng giây) | 48a82db1 → 52d799d4 | Chốt từ đợt 118 (T8 addendum, T4, T5): T5 gate0 try 12:56:32Z đọc boot=12:51:56 tươi + postboot_exit=0; T10 poller restart 13:05:16Z đọc boot tươi 52d799d4; O8-WebKit exit 13:13:10Z boot 52d799d4; replay #55 bracket (0'42", 2'46"] (dpkg đầu 12:52:38Z, cuối 12:54:42Z). **Số thứ tự TẠM THỜI.** |
| 56 | **~20:17Z** (ƯỚC LƯỢNG của parent — KHÔNG có giây trên đĩa) | 52d799d4 → 6805e92d | Chỉ có ghi chú parent đóng đợt 118 ("boot hiện tại 6805e92d, ~20:17Z 15/11") + lần đầu pin 6805e92d trên đĩa là nội dung LIMITS gộp (mtime 20:41:36Z — parent viết, nêu 6805e92d là boot hiện tại lúc đóng đợt) + GAP_ANALYSIS edit 20:41:51Z. **Không có file exec-log nào sinh trong (20:30Z, 21:10Z]** — phiên parent viết LIMITS gộp bằng file tool, không qua exec, nên không để lại log chứa `uptime -s`. **Số thứ tự TẠM THỜI; giờ TẠM THỜI.** |
| 57 | **23:33:34Z** (chính xác từng giây) | 6805e92d → 27c8b1d9 | Chốt từ lượt này: 2 phép đo `uptime -s` độc lập trên boot mới (23:45:07Z, giống nhau từng giây) + btime 1794785614 + `who -b` 23:33 + boot_id 27c8b1d9 + journal first entry 23:33:45Z + wtmp begins 23:33:44Z + `ps` systemd PID 1 START 23:33:44 + probe #38 23:45:17Z boot 27c8b1d9 ok=2 fail=0 + dấu boot tươi sibling đợt 119 (T7 initial-state + replay-done + POSTBOOT_PASS, prereg T4). **Số thứ tự TẠM THỜI.** |

**Clock:** F_now ≈ 0 (`date -u` 23:41:36Z vs HTTP `Date`
example.com 23:41:38Z, google.com 23:41:39Z, cloudflare.com
23:41:40Z — khớp trong 1–4 s, đúng độ trễ gọi nối tiếp). F54 ≈ 0
(đã kiểm đợt 118). **F55/F56 KHÔNG BIẾT** (không có kiểm HTTP Date
nào trong các boot đó) — mọi gap trong mù #37 đều là hiệu số đồng
hồ VM cho tới khi chứng minh F ổn định (xem caveat §2.5).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh giây nháy nếu có):**
- Gap #54→#55 = **2h03'30"** (7.410 s) — ĐƯỢC CHỨNG NHẬN (xem §2.5).
- Gap #55→#56 ≈ **7h25'04"** (26.704 s, dùng 20:17:00Z danh nghĩa)
  — KHÔNG chứng nhận (mù mở + giờ #56 ước lượng).
- Gap #56→#57 ≈ **3h16'34"** (11.794 s, dùng 20:17:00Z danh nghĩa)
  — KHÔNG chứng nhận (như trên).
- Span #55→#57 (trực tiếp, chứa #56) = **10h41'38"** (38.498 s)
  — không phải một gap, chỉ ghi làm span.
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):** #56 từ
  #55: [13:11:03Z, 16:06:04Z] — #56 danh nghĩa ~20:17Z nằm NGOÀI
  tới 4h10'56"; #57 từ #56 danh nghĩa: [20:36:07Z, 23:31:08Z] —
  #57 thật 23:33:34Z vượt max **2'26"** (phù hợp với #56 thật muộn
  hơn ~20:17Z vài phút: nếu #56 ≥ 20:19:26Z thì gap #56→#57 nằm
  trong dải); #58 từ #57: [23:52:41Z, 02:47:42Z]; hiệu dụng sau
  probe #38: [23:45:17Z, 02:47:42Z]; p10–p90 FULL46: [00:22:47Z,
  02:36:32Z].

### 2.3 Hoạt động trong khoảng mù — vì sao A + D đóng, B + C mở

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **24 file** +
hidden_files **512 file**; **536 file, 529 mốc giây phân biệt**
(theo cách đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 19/P6 §4 mục 20/Q6
§4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/T6 đợt 118 §2.3). Chia mù
làm bốn đoạn bởi #55 (12:51:56Z), #56 (~20:17Z), #57 (23:33:34Z):

- **Đoạn A: 11:39:50Z → 12:51:56Z (1h12'06", boot #54 48a82db1) —
  ĐÓNG bằng đo uptime tại probe #37 + poller T10 run 1 + T4 poll5m
  + T5 gate0 + session bắc qua cắt sàn + sàn đuôi:**
  - Probe #37 (11:39:50Z) đo uptime chứng minh up liên tục từ
    10:48:26Z tới 11:39:50Z — đóng tới 11:39:50Z.
  - **Poller T10 run 1 là 1 tiến trình duy nhất (kiểm bằng code):**
    START 11:39:50Z boot 48a82db1; 15 poll liên tiếp #1–#15, đúng
    số thứ tự, đúng 300/301 s mỗi bước (11:39:50Z → 12:49:51Z);
    script không có cơ chế restart. Đóng (11:39:50Z, 12:49:51Z].
  - **T4 poll5m (observer độc lập thứ hai):** 19 poll
    11:41:22Z → 13:17:33Z; 17 bước 300/301 s + 1 bước 669 s
    (12:51:24Z → 13:02:33Z — restart sau #55, không phải clock
    step). Phủ đoạn A tới 12:51:24Z.
  - **T5 gate0 (observer độc lập thứ ba):** try 1 11:44:45Z +
    12:31:25Z, đều đọc boot=10:48:26 tươi, postboot_exit=0.
  - **1 session bắc qua cắt sàn A-hi (12:32:49Z):** birth
    12:28:54Z, mtime 12:36:46Z (proc_ea0b40323a3b.log).
  - Đầu 0 s (poll đầu = giờ probe); đuôi (12:49:51Z, 12:51:56Z]
    125 s < sàn 19'07" → sàn đóng.
  - Mật độ mtime củng cố (336 mốc, lỗ lớn nhất chỉ 245 s) nhưng
    không dùng để đóng. **Kết luận đoạn A: ĐÓNG.**
- **Đoạn B: 12:51:56Z → ~20:17Z (~7h25', boot #55 52d799d4) —
  KHÔNG ĐÓNG: cửa sổ mở (13:20:29Z, ~20:17Z] ~6h56'31":**
  - Phủ tới 13:20:29Z: T5 attempt3 12:56–12:57Z (gate0 12:56:32Z
    boot=12:51:56 tươi; ps-before/after); T4 attempt8 13:03–13:1xZ
    (gateA poll 2 13:03:46Z, RAMavail 2319 MB); **poller T10 run 2
    là 1 tiến trình duy nhất (kiểm bằng code):** START 13:05:16Z
    boot 52d799d4; 4 poll #1–#4, đúng số thứ tự, đúng 300 s mỗi
    bước (13:05:16Z → 13:20:16Z); phase-1 summary 13:13:10Z +
    O8 exits 13:12:19Z/13:13:10Z boot 52d799d4; T4 LIMITS doc
    mtime 13:20:29Z (mốc cuối cùng).
  - **Sau 13:20:29Z: KHÔNG CÒN GÌ cho tới 20:41:36Z (đoạn C).**
    0 file exec-log nào sinh hay ghi trong (13:20:29Z,
    20:41:36Z]; 0 session chạm vùng B-tail; 0 session bắc qua
    cắt B-lo (13:11:03Z) hay B-hi (19:57:53Z); 0 file /tmp trong
    cửa sổ; ngoài hai cây chỉ có 10 file — 6 file bookkeeping
    proactivity 13:41:56Z + 3 file exec-call JSON 13:42:21Z /
    17:35:58Z / 20:36:00Z + 1 archive self-improvement 17:46:01Z
    — tất cả mtime-only, không chứa boot_id/uptime tươi (3 file
    JSON chỉ là output của lệnh `tail build-loop-log` — boot ID
    trong đó là TRÍCH DẪN từ log, không phải đọc tươi; đã kiểm
    nội dung từng file).
  - Cửa sổ mở (13:20:29Z, ~20:17Z] = 24.991 s; tối đa ẩn danh
    nghĩa = ⌊24.991/1.147⌋ = **21**. Lỗ mtime lớn nhất đoạn B
    24.991 s (13:20:29Z → 20:17:00Z danh nghĩa).
  - **Kết luận đoạn B: KHÔNG ĐÓNG.** (Prereg §2 đã dự báo đúng.)
- **Đoạn C: ~20:17Z → 23:33:34Z (~3h16', boot #56 6805e92d) —
  KHÔNG ĐÓNG: cửa sổ mở (20:41:51Z, 23:33:34Z] 2h51'43":**
  - Chỉ có 2 mốc: LIMITS gộp mtime 20:41:36Z (nội dung pin
    6805e92d là boot hiện tại lúc parent đóng đợt) +
    PHASE9_GAP_ANALYSIS.md edit 20:41:51Z (gap §48).
  - 0 session chạm vùng C-idle (20:41:36Z → 23:33:34Z); 0 session
    bắc qua cắt C-lo (20:36:07Z) hay C-hi (23:14:27Z).
  - Cửa sổ mở (20:41:51Z, 23:33:34Z] = 10.303 s; tối đa ẩn danh
    nghĩa = ⌊10.303/1.147⌋ = **8**.
  - **Kết luận đoạn C: KHÔNG ĐÓNG.** (Prereg §2 đã dự báo đúng.)
- **Đoạn D: 23:33:34Z → 23:45:17Z (11'43", boot #57 27c8b1d9) —
  ĐÓNG bằng đo uptime trực tiếp + probe #38 + dấu boot tươi:**
  - **`uptime -s` ×2 lúc 23:45:07Z = 23:33:34Z** chứng minh máy
    up liên tục từ #57 tới lúc đo; probe #38 23:45:17Z đọc
    boot_id 27c8b1d9 tươi — cùng boot_id với boot bắt đầu
    23:33:34Z. (Nguyên tắc như P6 §2.3 đoạn C mù #31 và Q6 §4
    mục 21.)
  - **Chuỗi dấu boot tươi củng cố:** T7 initial-state
    (23:41–23:44Z, btime/uptime/journal đồng ý) + T7 replay-done
    (replay 23:35:39–23:41:08Z, postboot exit=0, headroom exit=0)
    + prereg T4 (uptime-s 23:33:34Z, boot 27c8b1d9) + cờ
    POSTBOOT_PASS của T7 (23:46Z).
  - Replay #57 bracket: dpkg đầu 23:35:39Z = boot +2'05" → bracket
    (0, 2'05"]; xong 23:41:08Z (boot +7'34"). Chính sách repair
    15 phút KHÔNG kích hoạt (T7 đợt 119 — replay tới trong ~15').
  - Mật độ mtime củng cố (47 mốc, lỗ lớn nhất 300 s). **Kết luận
    đoạn D: ĐÓNG.**

**Kết luận trung thực: khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN.** Đoạn
A + D đóng; đoạn B + C mở (2 cửa sổ mở, tổng ~9h48'14"); 3 reboot
đã chốt giờ (#55 12:51:56Z, #57 23:33:34Z chính xác từng giây;
#56 ~20:17Z chỉ là ước lượng) + tối đa **29 ẩn danh nghĩa**
(21 đoạn B + 8 đoạn C). Số thứ tự #55/#56/#57 vẫn TẠM THỜI.

### 2.4 Quét sóng EPERM trong mù #37 — 0 sóng thật (bằng chứng âm tính)

Quét toàn bộ file *.log có mtime trong mù #37 (bằng script
eperm-sweep.py; eperm-sweep*.log của chính mình bị loại theo bài
học T7 §4 mục 19):

| Phạm vi quét | "vẫn bật" | "CẢNH BÁO 10 phút" | "Operation not permitted" | "sóng EPERM đã tắt" |
|---|---|---|---|---|
| repo-1 (0 file) | 0 | 0 | 0 | 0 |
| hidden_files (196 file) | 0 | 0 | 0 | **3** (dương tính giả đã biết, xem dưới) |
| **Tổng 196 file** | **0** | **0** | **0** | **3 FP** |

3 dòng "đã tắt" đều là dương tính giả launcher đã biết — không
phải sóng thật:
- 2× t10-o8.log (13:11:23Z, 13:12:20Z — T10 đợt 118 O8 driver
  launcher, dòng "không có /proc/sys/.../epoll_wait: Operation not
  permitted" bị in khi launcher kill/đóng kênh).
- 1× run-t9.log (11:42:29Z — T9 đợt 118 launcher, cùng mẫu).

Quét mở rộng `/eperm|not permitted/i`: 22 match → 18 dòng duy
nhất — 9 dòng recount oversize trong t10-phase1-driver.log (chỉ
nhắc tên file LIMITS EPERM) + 6 dòng test-pass hasEperm trong
round118-t10-suites.log (test tự kiểm "not permitted" như kết quả
mong đợi) + 3 dòng launcher trên. **0 sóng EPERM thật.**

- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7 đợt 115) — **~107h34'**
  trước probe #38 (23:45:17Z).
- EPERM **không** được tuyên bố là đã hết — như R7/S7/T7/T6: 1 lượt
  không sóng = bằng chứng âm tính cho lượt đó, không phải kết luận
  hệ thống.

### 2.5 Phân phối gap — CERT n=31, FULL n=46 (mới: +1 gap từ mù #37)

**Gap #54→#55 = 2h03'30" (7.410 s) ĐƯỢC CHỨNG NHẬN (điểm).** Điều
kiện: đuôi đoạn E mù #36 đã đóng (mù #36 đóng hoàn toàn) + đoạn A
mù #37 đóng (xem §2.3). **CAVEAT (đứng, như mọi gap trước #54):**
F55 CHƯA ĐƯỢC KIỂM — không có kiểm HTTP Date và không có neo
clock xuyên-boot nào trong boot #55 (F54≈0 đã kiểm 11:49Z đợt
118; F_now≈0 đã kiểm 23:41Z lượt này). Không tìm thấy bằng chứng
nhảy clock tại #55 (không có dòng O8-style nào bắc qua #55; T4
attempt7 partial JSON chỉ có 1 pass nhiễu 15.801 ms đúng biên
reboot). Nếu sau này chứng minh được nhảy clock tại #55 thì gap
này trở thành khoảng như #53→#54. Nếu parent không chấp nhận
chứng nhận điểm khi F chưa kiểm thì hạ gap này về cận trên, CERT
về n=30.

**Gap #55→#56 và #56→#57 KHÔNG đưa vào FULL** — giờ #56 chỉ là
ước lượng ~20:17Z (không có giây trên đĩa) và mù #37 chưa đóng.
Giá trị danh nghĩa chỉ để tham khảo: #55→#56 ~7h25'04",
#56→#57 ~3h16'34".

**Cross-check tái hiện T6(118) 100%:** chạy blind36-gaps.py
verbatim cho lại đúng CERT n=30 / FULL n=45 của T6 đợt 118 (xem
blind37-gaps.txt).

Bảng so sánh (CERT = gap đơn đã chứng nhận; FULL = CERT + gap chưa
chứng nhận + gap khoảng):

| | CERT n=30 (T6-118) | **CERT n=31 (T6-119)** | FULL n=45 (T6-118) | **FULL n=46 (T6-119)** |
|---|---|---|---|---|
| mean | 1h50'50" | **1h51'15"** | 1h56'03" | **1h56'13"** |
| median | 1h59'16" | **1h59'46"** | 1h58'47" | **1h59'16"** |
| p10 | 1h06'24" | **1h08'24"** | 0h49'04" | **0h49'14"** |
| p90 | 2h30'32" | **2h27'07"** | 3h03'17" | **3h02'58"** |
| sd | 0h41'14" | **0h40'37"** | 0h58'04" | **0h57'25"** |
| min | 19'07" | **19'07"** | 19'07" | **19'07"** |
| max | 3h14'08" | **3h14'08"** | 5h43'18" | **5h43'18"** |

- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới nằm
  giữa). Đáy sàn **19'07" (1147 s)** vẫn là gap đơn đã chứng nhận
  nhỏ nhất.
- **Tốc độ reboot (đồng hồ ghi nhận):** 57 / 123,26 h = **1 reboot
  mỗi 129,7 phút** (từ #1 2026-11-11T02:00:00Z tới #57
  2026-11-15T23:33:34Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 61 / 123,26 h = **1 mỗi 121,2 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24) và mù #37 (+29).
- **Phân phối FULL46:** 26/46 trong 90–150 phút; 6 gap <60 phút;
  6 gap >180 phút; 2 gap >240 phút. Gap mới (2h03'30") nằm trong
  khối chính 90–150 phút, không phải outlier.

### 2.6 Trạng thái các mù cũ — KHÔNG ĐỔI (chỉ ghi nhận, không thử lại)

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 §2.3 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#57 vẫn TẠM THỜI vì mù này |
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

### 2.7 Quét writeFileSync lần thứ 25 — chênh 0 (lần thứ 25 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T6 trong round118-t6, đổi OUT sang
  round119-t6) **00:03:09Z → 00:04:11Z 16/11 (1'02", có SCAN-END)**
  — nhanh hơn lần 24 (2'52") vì không có session scan song song.
- NEWSTD: **770 dòng / 211 file** (phạm vi 2.917 file); R7b đối
  chiếu: **795 dòng / 228 file** (phạm vi 12.310 file); copies:
  **25 dòng / 17 file** — y hệt lần 24. Đối chiếu chéo:
  770+25=795=R7b, **chênh 0**.
- **+19 dòng / +3 file so với lần 24** (751/208 → 770/211), giải
  thích đúng hết bằng diff (kiểm bằng đếm lại trực tiếp + mtime —
  cả 3 file đều về trước lúc scan bắt đầu 00:03:09Z 16/11):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | probe119t1-h3f-ab.mjs | +7 | 00:01:31Z 16/11 | T1 đợt 119 (H3f A/B) |
  | probe119t3-frame-parity.mjs | +8 | 23:42:27Z 15/11 | T3 đợt 119 |
  | PHASE9_ROUND118_T6_EPERM_LIMITS.md | +4 | 12:17:11Z 15/11 | Tài liệu T6 đợt 118 |
- Phạm vi: 2.917 = 2.903 + 14 net / −0 (14 file mới: 2 probe
  script + 2 benchmark T8 + 8 LIMITS đợt 118 (gộp + T2–T6/T8/T9)
  + 2 LIMITS đợt 119 (T7, T9 — sibling đã stage)).
  **0 file mất hit.**
- **Kết luận: 25 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #37.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 3 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md): vẫn đúng 2 helper đã biết + 1 bản build của cùng
  helper — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 không đổi; dist nằm
    ngoài phạm vi quét WFS nên không làm lệch số đếm.
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #37.

## 3. RAM trong mù #37 — max 4.811 MB (78% guard), birefnet KHÔNG chạy

- **5 mẫu MemAvailable của lượt (đo trực tiếp):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 23:45:07Z | **1.788.128 kB** | Lúc probe #38 |
  | 00:02:52Z | **2.708.556 kB** | Giữa lượt |
  | 00:03:09Z | **2.289.440 kB** | Lúc bắt đầu scan WFS |
  | 00:04:11Z | **1.815.696 kB** | Lúc scan xong |
  | 00:10:54Z | **1.233.952 kB** | Trước khi viết LIMITS |
- **Max RAM biết được TRONG mù #37 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 168 mẫu RAM; **max 4.811 MB**
  (T4 poll5m, 12:31:24Z, đoạn A) = **78% ngưỡng guard** — cao
  nhất từng thấy trong một mù (mù #36: 4.080 MB), vẫn dưới 6 GB;
  đoạn B max **2.319 MB** (T4 gateA poll 2, 13:03:46Z); đoạn C
  **không có mẫu nào** (máy yên, không observer); đoạn D max
  **2.340 MB** (sibling đợt 119, 23:44:08Z).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 4,81 GB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Chỉ thử lại khi RAM đổi (xem §5 mục 7).

## 4. Ghi chú phương pháp (mới so với T6 đợt 118)

1. **Grep NỘI DUNG exec-log theo boot_id (mới, lượt này — §2.3):**
   tìm 3 file exec-call JSON (13:42:21Z / 17:35:58Z / 20:36:00Z)
   chứa boot ID — kiểm nội dung cho thấy chúng chỉ là output của
   lệnh `tail build-loop-log` (boot ID là trích dẫn từ log, không
   phải đọc tươi từ /proc). Bài học: file tool-output chứa boot ID
   KHÔNG bằng đọc tươi — chỉ `cat /proc/sys/kernel/random/boot_id`
   (hoặc uptime/btime) tại thời điểm ghi mới tính.
2. **0 exec-log trong cửa sổ 7h21'07" (13:20:29Z → 20:41:36Z) — sự
   im lặng tự nó là dữ liệu:** không một observer nào sống trong
   cửa sổ đó; poller v2 loop foreground / watcher v2 vẫn thiếu
   (R9 (a) vẫn chờ user — xem §5 mục 5).
3. **#56 là reboot đầu tiên KHÔNG có giây trên đĩa:** giờ chỉ là
   ước lượng "~20:17Z" của parent; phiên parent viết LIMITS gộp
   bằng file tool nên không để lại exec-log. Hệ quả: gap
   #55→#56 / #56→#57 không đủ điều kiện vào FULL; số thứ tự
   #55/#56/#57 càng tạm thời hơn (tối đa "thực tế #114").
4. **Dải cơ học bắt chéo (mới, §2.2):** #56 danh nghĩa ngoài dải
   từ #55 tới 4h10'56" (tín hiệu reboot ẩn đoạn B); #57 chỉ vượt
   dải từ #56 danh nghĩa 2'26" (phù hợp #56 thật muộn hơn vài
   phút). Dải cơ học không chứng nhận gì — chỉ là kiểm nhất quán.
5. **HTTP Date standing check (đề xuất T6 §5 mục 2) đã chạy lượt
   này:** F_now ≈ 0 (3 server độc lập, khớp 1–4 s). Đề xuất giữ
   làm check đứng mỗi lượt EPERM (~5 s, phát hiện giây nháy sớm).
6. **dpkg.log + apt history.log đều cắt ngắn theo boot** (history
   Start-Date đầu 23:36:21Z, chỉ boot hiện tại) — không còn nguồn
   log hệ thống bền nào cho boot cũ; điều tra mù chỉ dựa vào log
   agent trên đĩa.
7. **Scan WFS nhanh (1'02")** vì không có session scan song song
   (bài học T6 §4 mục 10 đợt 118: scan 2'52" do chạy song song).
8. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo boot #57 ĐÚNG; dự báo đoạn B/C KHÔNG đóng ĐÚNG
   — không sửa sau khi thấy số.
9. **File exec-call 20:36:00Z là file gần nhất với đầu cửa sổ mở
   đoạn C** (lượt cron 03:35 bỏ qua) — nhưng stdout của nó chỉ là
   log tail, không đọc boot. Bài học: lượt cron bỏ qua nên ghi
   boot_id + uptime -s vào build-loop-log (xem §5 mục 4 — cần
   parent duyệt, T6 không tự đổi hành vi cron).
10. **Kiểm lại boot trước khi viết LIMITS (00:10:54Z):** vẫn
    27c8b1d9, uptime-s 23:33:34Z — không reboot mới trong lúc làm
    việc.
11. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
    (cấm — RAM < guard). **Không đụng cloud/collab/AI model
    đóng/nhạc bản quyền.**
12. **Stage batch:** chỉ 1 file text (LIMITS doc này),
    NUL-delimited, verify read-back (xem checkpoint3.txt + stage
    file).
13. **Ghi rõ:** số thứ tự reboot #47–#57 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
14. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F55 vào hồ sơ (xem §2.5).
15. **Cross-check tái hiện T6(118) 100%** (CERT n=30 / FULL n=45)
    trước khi tính số mới — chạy blind36-gaps.py verbatim qua exec.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** đoạn A + D đóng; đoạn B mở (13:20:29Z, ~20:17Z],
   tối đa 21 ẩn; đoạn C mở (20:41:51Z, 23:33:34Z], tối đa 8 ẩn.
   3 reboot đã chốt (#55 12:51:56Z, #56 ~20:17Z ước lượng, #57
   23:33:34Z) + tối đa 29 ẩn danh nghĩa. Probe #39 đợt 120 tiếp
   tục. **Cần parent quyết:** có chấp nhận để mù #37 mở như mù
   #35 (QUYẾT PARENT 7 đợt 117) hay giao luồng điều tra thêm —
   T6 khuyến nghị ĐỂ MỞ (không còn nguồn nào để đóng B/C: 0
   exec-log, 0 session, 0 file /tmp trong cửa sổ; chỉ còn cách
   chờ parent cung cấp giờ #56 chính xác nếu có).
2. **Gap #54→#55 = 2h03'30" ĐƯỢC CHỨNG NHẬN (mới — xem §2.5,
   CERT n=31, FULL n=46; caveat F55 chưa kiểm).** Cần parent xác
   nhận cách chứng nhận điểm khi F chưa kiểm; nếu không đồng ý
   thì hạ gap này về cận trên, CERT về n=30.
3. **Giờ #56 chính xác (mới):** parent có còn giữ output
   `uptime -s` / `uptime` lúc đóng đợt 118 không? Nếu parent
   cung cấp giờ từng giây (hoặc khoảng hẹp) thì T6 đợt 120 chạy
   lại số: gap #55→#56 / #56→#57 + tư cách vào FULL + dải cơ học.
   T6 không tự suy giờ #56 từ "~20:17Z".
4. **Đề xuất standing check mới (cần parent duyệt):** lượt cron
   BỎ QUA (vì chốt chặn) ghi thêm boot_id + `uptime -s` vào
   build-loop-log — lượt 03:35 đã chạy lúc 20:35Z, ngay trước
   cửa sổ mở đoạn C; nếu lúc đó có ghi boot thì đoạn C đã hẹp
   hơn nhiều. T6 KHÔNG tự đổi hành vi cron — chờ parent duyệt.
5. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
   --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
   117, chưa trả lời). Watcher này sẽ lấp đúng loại cửa sổ mở
   như đoạn B/C của mù #37.
6. **Khoảng mù #35 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T7 đợt
   117; parent đã chấp nhận để mở). Gap #49→#50, #50→#51,
   #51→#52 vẫn là cận trên.
7. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi**
   (u2net là fallback chính thức). Max RAM trong mù #37 là
   4,81 GB (78% guard) — gần guard nhất từ trước nhưng vẫn dưới.
8. **EPERM không tuyên bố đã hết** (sóng gần nhất ~107h34'
   trước probe #38). **Không kiểm lại TTS 39** (cấm).
   ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
   #31/#35 chờ user quyết** (không tự quyết).
