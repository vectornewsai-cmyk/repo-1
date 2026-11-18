# PHASE9 ROUND115 R7 — EPERM: probe #34 + mù #33 ĐÓNG HOÀN TOÀN + WFS lần 21 chênh 0

> Luồng R7, đợt 115 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07,
> 15/11/2026; làm việc 17:43Z → 17:58Z 14/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + xác định reboot
> #46 trong mù #33 kể từ probe #33 (14:49:23Z) + quét sóng EPERM +
> quét writeFileSync lần thứ 21 + ghi RAM (birefnet: KHÔNG chạy —
> vẫn dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round115-r7/prereg-r7.md (định nghĩa probe #34, mốc đối
> chiếu, tiêu chí đóng mù #33, cách xử lý sàn đoạn A).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #31, mù #30, mù #29, mù #28,
> mù #26, mù #24, mù #21, hay reboot #16** — chỉ báo cáo "không thấy"
> vs "không có". Mù #31 KHÔNG thử lại lượt này (đã thử hết nguồn ở
> đợt 114, theo đúng lệnh task).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (17:45:02Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.539 s, last #33 14:49:23Z, boot
  cd4cac0b, exit 1 theo quy định script — exit lấy từ `$?` trực
  tiếp, không qua pipe, xem §1); `once` ngay sau đó là **probe #34,
  boot 7a0638c4 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=34), exit 0. Log v2 tăng đúng **3 dòng**
  checklist (91 → 94): dòng DEAD mới cho heartbeat #33 + dòng
  `boot changed` + dòng probe #34 — **như Q6 (+3) vì lượt này chưa
  có dòng DEAD nào cho #33** (dòng DEAD cuối trước đó là cho #32,
  14:49:23Z); prereg §1 đã dự báo đúng +3 trước khi đo. Heartbeat
  nay n=34, ts 17:45:02Z, boot 7a0638c4.
- **Khoảng mù #33: 14:49:23Z → 17:45:02Z (2h55'39") — ĐÓNG HOÀN TOÀN
  (mới, lượt này).** Đoạn A (tới #46) **ĐÓNG** bằng poller Q9 MỘT
  tiến trình duy nhất (12 poll, 300/301 s đều, 14:45:53Z →
  15:40:54Z) + dấu boot tươi của Q7/Q3/Q5 (15:01:17Z, 15:03:20Z,
  15:05:09Z, 14:55:33Z, 14:56:18Z, gate poll 15:02:01Z →
  15:11:02Z) + sàn đuôi (xem §2.3). Đoạn B (sau #46) **ĐÓNG** bằng
  đo uptime trực tiếp ×2 lúc 17:45:02Z (= 15:44:49Z) + probe #34 +
  dấu boot tươi của Q7/Q1/Q2/Q9 (15:46:12Z → 17:07:58Z). Không còn
  cửa sổ mở nào. **Đây là mù thứ hai liên tiếp đóng hoàn toàn**
  (#32 rồi #33) — lần đầu có 2 mù đóng liên tiếp kể từ #27.
- **Gap #45 → #46 = 2h27'07" — ĐƯỢC CHỨNG NHẬN (mới, lượt này).**
  Khoảng (13:17:42Z, 15:44:49Z) không chứa cửa sổ mở nào (mù #33
  đã đóng kín — chứng nhận theo khoảng như #42 → #43, #44 → #45).
  Tập gap đơn đã chứng nhận tăng **n=24 → n=25**; toàn chuỗi
  **n=39 → n=40** (xem §2.5). Dải chứng nhận [19'07", 3h14'08"]
  không đổi (gap mới nằm giữa).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn
  bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật
  trong 88 file *.log có mtime trong mù #33 (0 file repo-1,
  88 file hidden_files — đếm lại độc lập từ đĩa); 10 dòng "sóng
  EPERM đã tắt" đều là **dương tính giả đã biết** (dòng launcher:
  Q7 o8.log 2×, Q9 o8.log 2×, Q1 run-q1.log 6× — tất cả ở đoạn B).
  Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~77h34'** trước
  probe #34. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 21: 680 dòng / 196 file** (phạm vi
  2857 file); R7b đối chiếu 705 dòng / 213 file; copies 25 dòng /
  17 file — y hệt lần 20; đối chiếu chéo 680+25=705=R7b, **chênh 0
  — lần thứ hai mươi mốt liên tiếp**. +24 dòng / +5 file so với lần
  20, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí, cả hai trong helper retry
  đã biết** — 0 stray; mtime 2 helper không đổi từ 10/11.
- **Dải chứng nhận [19'07", 3h14'08"] CÒN DÙNG ĐƯỢC** (tập gap đơn
  đã chứng nhận nay n=25 — thêm #45 → #46). Toàn chuỗi n=40:
  trung bình 1h57'35", trung vị 1h59'16" — xem §2.5.
- RAM: 4 mẫu MemAvailable của lượt: **434.660 kB (17:45:02Z, lúc
  probe #34) / 2.008.556 kB (17:52:07Z, lúc scan bắt đầu) /
  2.320.368 kB (17:52:28Z, lúc scan xong) / 1.171.744 kB
  (17:58:21Z, lúc viết LIMITS)** — ~0,42 GB rồi ~1,96 GB rồi
  ~2,27 GB rồi ~1,14 GB. Max RAM biết được **trong** mù #33 từ log
  sibling: **3.378 MB ≈ 3,30 GB** (Q2, 15:56:12Z, boot #46) = 55%
  ngưỡng guard — vẫn xa guard. Birefnet KHÔNG chạy, vẫn 0 lần chạy
  thành công trong gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ parent/user
  quyết); cron riêng 10 phút vẫn chờ user quyết.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 17:45:02Z | boot_id `7a0638c4-950a-45a0-a068-c290310fc0de`; `who -b` Nov 14 15:45; `uptime -s` **2026-11-14 15:44:49Z** (2 lần, giống nhau từng giây); btime **1794671089 = 2026-11-14T15:44:49Z**; journal chỉ 1 boot (7a0638c4, first entry 15:45:01Z, last 17:44:19Z lúc kiểm tra); `last -x reboot` 15:45 still running; wtmp bắt đầu 15:45:01Z; `ps` systemd PID 1 START 15:44:59, hatch 15:45:00, hatch-execd 15:45:22 |
| `bash scripts/probe-eperm-v2.sh status` | 17:45:02Z | **DEAD/STALE**, heartbeat n=33, ts 14:49:23Z, boot cd4cac0b, age **10.539 s** (đúng 2h55'39"); last sample probe #33; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp, ghi trong status1.txt — không qua pipe) |
| `bash scripts/probe-eperm-v2.sh once` | 17:45:02Z | **probe #34, boot=7a0638c4, ok=2 fail=0**, exit 0; dòng `boot changed cd4cac0b -> 7a0638c4` (uptime since 2026-11-14 15:44:49) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 17:45:02Z | **ALIVE**, age 0 s, n=34, exit 0 |

Kiểm lại từ đĩa (17:45Z): log probe v2 **94 dòng** — 91 sau Q6 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #33 +
dòng `boot changed` + dòng probe #34). **Như Q6 (+3):** lượt này
chưa có dòng DEAD nào cho heartbeat #33 nên `status` 17:45:02Z
ghi thêm đúng 1 dòng DEAD ("probe DEAD detected by status (last
#33 at 2026-11-14T14:49:23Z, age 10539s, no probe end since last
start)"). Prereg §1 đã dự báo đúng +3 trước khi đo (ghi rõ cơ sở:
chưa có dòng DEAD nào cho #33). Heartbeat **n=34, ts
2026-11-14T17:45:02Z, boot 7a0638c4-…**; log vẫn chỉ có **ĐÚNG 1
dòng `probe start`** (08:49:50Z 11/11) và **0 dòng `=== probe
end`** — loop v2 chưa từng được start lại kể từ đợt 88.
**Bẫy grep (mới, xem §4 mục 24):** `grep -c "probe end"` trả 28 —
đó là 28 dòng DEAD chứa cụm "no probe end since last start",
KHÔNG phải dòng `=== probe end` (đúng 0 dòng).

**Ghi rõ phương pháp exit code (áp dụng đính chính của N6 §1):**
cả 3 lệnh checklist đều ghi output ra file riêng (status1.txt,
once.txt, status2.txt) rồi đọc `$?` trực tiếp, KHÔNG qua `| tee`
— số exit trên là exit thật của script (status 1 STALE / once 0 /
status 0 ALIVE), đúng quy định header script. File
`probe-notes.txt` chỉ chứa phần xác minh boot độc lập, không chứa
exit code.

Nguồn độc lập cho boot #46: Q7 early-watch-b46 (try1 15:46:12Z,
try2 15:51:57Z — đọc boot tươi, xem §2.3) + Q2 run-q2-r1.stdout
15:56:12Z (boot 7a0638c4, uptime_s 15:44:49, đọc tươi) + Q1 FIXED
16:23:51Z + Q9 O8 driver 17:06:15Z — tất cả đều đọc boot_id/uptime
trực tiếp từ /proc tại thời điểm ghi. Reboot #46 đã được chốt giờ
từ đợt 114 (15:44:49Z); R7 xác nhận lại boot hiện tại vẫn là #46
(chưa có reboot #47 tính tới 17:45:02Z).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như I7/J8/K6/L6/M4/N6/P6/Q6 đã
đính chính.

## 2. Điều tra khoảng mù #33 (14:49:23Z → 17:45:02Z, 2h55'39")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #34: `uptime -s` = **2026-11-14 15:44:49Z**,
  boot_id `7a0638c4-950a-45a0-a068-c290310fc0de` — khác boot của
  probe #33 (cd4cac0b).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (17:45Z): chỉ **1 boot**
  (7a0638c4, first entry 15:45:01Z, last 17:44:19Z). `last -x
  reboot`: chỉ 1 dòng (15:45, still running). wtmp bắt đầu
  15:45:01Z. Journal/wtmp của boot cd4cac0b đã mất theo reboot
  #46 — như mọi lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu.

### 2.2 Một reboot đã chốt trong mù — #46 (15:44:49Z)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 46 | **15:44:49Z (chính xác từng giây)** | cd4cac0b → 7a0638c4 | Chốt từ đợt 114 (Q7 postboot #46 PASS + O8 boot #46 21/21 cả 2 engine + parent kiểm chứng). **Xác nhận lại lượt này:** 2 phép đo `uptime -s` độc lập trên boot mới (17:45:02Z, giống nhau từng giây) + btime 1794671089 + `who -b` 15:45 + boot_id 7a0638c4 + journal first entry 15:45:01Z + wtmp begins 15:45:01Z + `ps` systemd PID 1 START 15:44:59 (đều ghi trong probe-notes.txt lúc 17:45Z) + probe #34 17:45:02Z boot 7a0638c4 ok=2 fail=0. **Số thứ tự TẠM THỜI** (xem dưới). |

Gap #45 → #46 = **2h27'07" — ĐƯỢC CHỨNG NHẬN (mới, lượt này, xem
§2.3 + §2.5)**. **Tính tạm thời của số thứ tự (ghi rõ, không
giấu):** #46 kế thừa tính tạm thời từ mù #29 chưa đóng (khe 79 s,
M4 §2.3), mù #30 chưa đóng (3 cửa sổ mở, N6 §2.3) **và từ mù #31
chưa đóng (1 cửa sổ mở 8'55", xem §2.6)**: nếu mù #29 chứa 1
reboot ẩn, mù #30 chứa tối đa 2 và mù #31 chứa tối đa 1 thì
"reboot #46" thực tế có thể là **#50**. **Giá trị các gap không
phụ thuộc số thứ tự** — chỉ phụ thuộc giờ đã chốt.

### 2.3 Hoạt động trong khoảng mù — vì sao ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **21 file**
(không tính dist/node_modules) + hidden_files **346 file** (không
tính chrome-userdata); **367 mốc mtime, 255 mốc phân biệt** (độ
chính xác đầy đủ — theo cách đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục
19/P6 §4 mục 20/Q6 §2.3). Chia mù làm hai đoạn bởi #46 (15:44:49Z):

- **Đoạn A: 14:49:23Z → 15:44:49Z (55'26", boot cd4cac0b #45) —
  ĐÓNG bằng poller + dấu boot tươi + sàn (3 lớp, không lớp nào
  thừa):**
  - **Poller Q9 (5 phút) là kẹp trực tiếp tới 15:40:54Z — ĐÃ
    CHỨNG MINH LÀ MỘT TIẾN TRÌNH DUY NHẤT (mới, lượt này):**
    (i) chỉ ĐÚNG 1 dòng `Q9 poller START` trong toàn bộ
    poll-q9.log (14:45:53Z, deadline +3h); (ii) log poll-q9.log:
    START 14:45:53Z → poll #1 14:45:53Z → poll #12 15:40:54Z —
    **12 poll liên tiếp, đúng 300 s ×10 + 301 s ×1 mỗi bước,
    đúng thứ tự #1–#12, không trùng, không thiếu số, không có
    START thứ hai** (tính bằng code từ nội dung log — xem
    blind33-gaps.txt); một lần chạy mới sẽ bắt đầu lại từ poll #1
    và ghi START mới — không có; (iii) script poller-q9.sh là
    vòng `sleep 300` foreground, **không có cơ chế restart nào**
    (không cron/systemd user service, không vòng tự khởi động
    lại); (iv) 2 dòng RESTART chỉ xuất hiện SAU reboot #46
    (15:45:56Z + 15:46:20Z, poller-q9b.sh) — không có lần restart
    nào trước đó. Reboot sẽ giết tiến trình poller → không còn
    poll sau đó; poll tồn tại tới 15:40:54Z nên **không reboot
    nào trong (14:45:53Z, 15:40:54Z]**.
  - **Dấu boot TƯƠI củng cố trong đoạn A (đọc /proc tại thời
    điểm ghi — miễn nhiễm lỗ "tiến trình cũ sống sót", P6 §4
    mục 2):** Q3 driver114q3.log 14:55:33Z (start,
    boot=cd4cac0b, uptime_s=13:17:42) + 14:56:18Z (exit,
    boot=cd4cac0b); Q7 postboot-b45-repair.log 15:01:17Z,
    check2.log 15:03:20Z, repair2.log 15:05:09Z (script đọc
    `uptime -s` tươi — dòng 45 của
    vcut-webkit-postboot-check.sh: `BOOT=$(uptime -s …)` — R7
    đã đọc script, không tin mù; log in boot=13:17:42 +
    boot_id cd4cac0b); Q7 early-watch-state.md 15:05:32Z
    (boot cd4cac0b, watch bắt đầu 15:05:00Z). Dấu tươi cuối
    trong đoạn A: **15:05:09Z** (repair2, PASS sau repair).
  - **Gate poller Q5 là kẹp độc lập thứ hai (mới, lượt này):**
    run-q5.sh vòng `sleep 60` — lượt 2: poll #1–#10 liên tiếp
    15:02:01Z → 15:11:02Z, đúng 60 s ×9 + 61 s ×1, không thiếu
    số — một tiến trình duy nhất sống xuyên suốt
    (15:02:01Z, 15:11:02Z]. (Lượt 1 chỉ 1 poll 14:48:24Z —
    TRƯỚC mù, cửa yên mở ngay nên break; không tính vào kẹp.)
  - **Sàn đóng đuôi (15:40:54Z → 15:44:49Z, 3'55"):** t trong
    khoảng này cho gap2 = 15:44:49Z − t < 3'55" < sàn 19'07" →
    loại trừ mọi t trong đuôi. Sàn-cho-phép tổng quát cho đoạn
    A: t ∈ [13:36:49Z, 15:25:42Z] (gap1 = t − 13:17:42Z ≥ sàn ⟺
    t ≥ 13:36:49Z; gap2 = 15:44:49Z − t ≥ sàn ⟺ t ≤ 15:25:42Z —
    kiểm bằng code, xem blind33-gaps.txt). Poller Q9 phủ tới
    15:40:54Z (> 15:25:42Z ✓); dấu tươi + gate poller phủ tới
    15:11:02Z; sàn phủ phần còn lại. **Hợp các lớp: không còn t
    nào chưa loại → đoạn A ĐÓNG.**
  - Lỗ mtime lớn nhất đoạn A: **1426 s (15:17:52Z → 15:41:38Z,
    hidden_files)** và **2173 s (15:08:36Z → 15:44:49Z,
    repo-1)** — cả hai đều nằm hoàn toàn trong vùng poller Q9
    phủ (poll #7–#12 lúc 15:15:53Z–15:40:54Z) nên đã loại bằng
    poller, không tạo cửa sổ mở. **Lưu ý phương pháp (mới, xem
    §4 mục 23):** `find` chỉ thấy mtime CUỐI của mỗi file — các
    lần ghi append trung gian của poller (mỗi 300 s) không tạo
    mốc mtime riêng; lỗ mtime này chỉ lấp được bằng NỘI DUNG
    log, không bằng mật độ mtime (quy tắc N6 §4 mục 2 giữ
    nguyên).
  - Quét session bắc qua cắt sàn 15:25:42Z (birth < cắt, mtime >
    cắt, trên toàn bộ `~/workspace/agents/*/exec-logs/`, birth
    qua `find %w`): **0 session** — không có session exec nào
    bắc qua cắt; poller Q9 (không phải session exec) mới là
    observer bắc qua. Khác mù #32 (có cả poller + waiter
    session); lượt này poller + dấu tươi + gate poller là đủ 3
    lớp độc lập.
  - Kết luận đoạn A: **ĐÓNG**.
- **Đoạn B: 15:44:49Z → 17:45:02Z (2h00'13", boot 7a0638c4) —
  ĐÓNG bằng đo uptime trực tiếp + probe #34 + dấu boot tươi:**
  - **`uptime -s` ×2 lúc 17:45:02Z = 15:44:49Z** chứng minh máy
    up liên tục từ #46 tới lúc đo; probe #34 17:45:02Z đọc
    boot_id 7a0638c4 tươi — cùng boot_id với boot bắt đầu
    15:44:49Z. (Nguyên tắc như P6 §2.3 đoạn C mù #31 và Q6 §4
    mục 21: đo uptime tại thời điểm probe ĐÓNG toàn bộ đoạn từ
    reboot cuối tới lúc đo — sàn chỉ áp dụng GIỮA hai reboot đã
    biết, không áp cho đuôi sau reboot cuối.)
  - **Chuỗi dấu boot tươi củng cố (đọc boot_id/uptime trực tiếp
    từ /proc tại thời điểm ghi):** Q7 early-watch-b46 try1
    15:46:12Z (boot 1'23" tuổi) + try2 15:51:57Z PASS (boot
    7'08" tuổi) — kẹp khoảng replay #46 (1'23", 7'08"]; Q2
    run-q2-r1.stdout 15:56:12Z (exit, boot=7a0638c4,
    uptime_s=15:44:49, free=3378MB); Q2 last-boot.txt 16:16:19Z
    (boot 7a0638c4); Q1 run-q1.log 16:23:51Z (Q1 FIXED start,
    boot=7a0638c4); Q9 O8 driver start 17:06:15Z boot=7a0638c4 +
    O8-WebKit exit 17:07:58Z boot 7a0638c4. Dấu tươi cuối
    17:07:58Z, chỉ 37'04" trước probe #34 — phần còn lại đóng
    bằng đo uptime trực tiếp.
  - Lỗ mtime lớn nhất đoạn B: **1717 s (16:43:51Z → 17:12:28Z,
    repo-1)** và **890 s (17:28:43Z → 17:43:33Z, hidden_files)**
    — nằm trong đoạn đã đóng bằng uptime trực tiếp nên không tạo
    cửa sổ mở (quy tắc N6 §4 mục 2).
  - Kết luận đoạn B: **ĐÓNG**.

**Kết luận trung thực: khoảng mù #33 ĐÓNG HOÀN TOÀN.** Đúng 1
reboot đã chốt giờ trong mù (#46 15:44:49Z) + **0 reboot ẩn**
(không còn cửa sổ mở nào). Đây là mù thứ hai liên tiếp đóng hoàn
toàn sau mù #32 (Q6) — cắt chuỗi 4 mù không đóng liên tiếp #28,
#29, #30, #31 nay đã có 2 mù đóng liên tiếp. Gap #45 → #46 =
2h27'07" được chứng nhận theo khoảng (xem §2.5). Số thứ tự #46
vẫn TẠM THỜI (kế thừa mù #29/#30/#31 chưa đóng — xem §2.2).

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 114

Khoảng mù 14:49:23Z → 17:45:02Z (2h55'39") được phủ bởi các luồng
sibling đợt 114 (Q1–Q9, làm việc tới ~17:0xZ) + spawn đợt 115
(17:35:51Z — sau probe #34, không tính vào mù). Đã đọc lại log
thật — **đếm lại độc lập từ đĩa** (grep trên đúng 88 file *.log
có mtime trong mù #33 — 0 file repo-1, 88 file hidden_files, trừ
chrome-userdata):

| Mẫu | Số dòng | Kết luận |
|---|---|---|
| `sóng EPERM vẫn bật` | **0** | Không có sóng đang bật trong log còn tồn tại |
| `CẢNH BÁO` (10-phút wave warning) | **0** | Không có cảnh báo nào |
| `Operation not permitted` | **0** | Không có lỗi EPERM thật nào |
| `sóng EPERM đã tắt` | **10** | Tất cả đều là dòng launcher — **dương tính giả đã biết** |

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5, J8
§2.4, K6 §2.4, L6 §2.4, M4 §2.4, N6 §2.4, P6 §2.4, Q6 §2.4):**
cả 10 dòng đều có dạng `[timestamp] sóng EPERM đã tắt, khởi động
vite` — in khi lần ghi thử ĐẦU TIÊN thành công ngay (code launcher
`waveOff=true` ở lần write đầu) — in mặc định cả khi không có
sóng. Phân bố: Q7 q7-o8.log 2 dòng (15:56:20Z, 15:57:10Z) + Q9
q9-o8.log 2 dòng (17:06:16Z, 17:07:08Z) + Q1 run-q1.log 6 dòng
(16:25:32Z–16:34:32Z, các lần launch vite của Q1). **Cả 10 dòng
đều ở đoạn B; đoạn A có 0 dòng "đã tắt".** Bằng chứng phân biệt:
**0 dòng "sóng EPERM vẫn bật sau …s chờ"** và **0 dòng "CẢNH BÁO:
chờ sóng EPERM 10 phút"** trong toàn bộ 88 log; **0 lần
"Operation not permitted" thật**. Đếm này là whole-file (không
chỉ dòng trong cửa sổ mù) nên còn mạnh hơn: không có dòng sóng
thật nào trong toàn bộ nội dung 88 file.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — và lần này, NHƯ mù #32, **mù #33 đã đóng hoàn
  toàn** nên không còn lỗ quan sát về reboot nào để một sóng ngắn
  ẩn náu: vite khởi động thành công ngay ở 15:56–17:07Z (Q7/Q9
  O8, 4 lần), 16:25–16:34Z (Q1, 6 lần), cộng probe #34 ok=2 fail=0
  lúc 17:45:02Z. Một sóng dài ~16' kiểu R7 không thể lọt vào mù
  #33 mà không để lại dấu — khả năng rất thấp.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~77h34'** trước
  probe #34 (tính từ cuối sóng ~12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #34 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 17:45:02Z ghi được.

### 2.5 Phân phối gap cập nhật — CERT n=25 (mới) + dải chứng nhận CÒN DÙNG ĐƯỢC

Gap mới **#45 → #46 = 2h27'07" ĐƯỢC CHỨNG NHẬN**: khoảng
(13:17:42Z, 15:44:49Z) không chứa cửa sổ mở nào — mù #33 đóng
hoàn toàn (§2.3). Đây là chứng nhận theo khoảng (interval), không
theo nhãn mù (P6 §4 mục 8): khoảng đã đóng kín thì gap được chứng
nhận. Tập gap đơn đã chứng nhận **n=24 → n=25**; toàn chuỗi tăng
n=39 → **n=40** (thêm 1 gap). Tính lại từ bảng Q6 (exec lại
recount-q6.py nguyên văn — không gõ lại số, tránh sai sót chép
tay) + 1 gap mới, bằng code (percentile tuyến tính, index =
p·(n−1) — cùng phương pháp J8/K6/L6/L9/M4/N6/P6/Q6). **Kiểm tra
chéo: tính lại CERT n=22 ra đúng 100% số N6** (trung bình
1h52'05", trung vị 1h59'16", p10 1h08'41", p90 2h57'18", sd
43'58"), **tính lại CERT n=23 ra đúng 100% số P6** (trung bình
1h49'19", trung vị 1h58'47", p10 0h52'26", p90 2h53'15", sd
0h44'58"), **tính lại CERT n=24 ra đúng 100% số Q6** (trung bình
1h50'46", trung vị 1h59'16", p10 0h54'26", p90 2h50'12", sd
0h44'33") **và tính lại toàn chuỗi n=39 ra đúng 100% số Q6**
(trung bình 1h56'49", trung vị 1h58'47", p10 0h45'22", p90
3h04'42", sd 1h01'40") — nên số mới dưới đây đáng tin ở cùng mức
(script `blind33-gaps.py`, output `blind33-gaps.txt`):

| Thống kê | Toàn bộ n=40 | Chỉ gap đơn đã chứng nhận n=25 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, CẬN TRÊN)** | **3h14'08" (#26 → #27)** |
| Trung bình | 1h57'35" | 1h52'14" |
| Trung vị | 1h59'16" | 1h59'46" |
| Độ lệch chuẩn (mẫu) | 1h01'03" (CV 0,52) | 44'13" |
| p10 | 0h46'54" | 0h56'26" |
| p90 | 3h04'39" | 2h47'39" |

Đọc thêm: 22/40 gap (55%) nằm trong 90'–150'; 6 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
**Dải chứng nhận [19'07", 3h14'08"] đứng vững trên tập gap đơn
đã chứng nhận (n=25)** — min/max không đổi (gap mới 2h27'07" nằm
giữa). Cảnh báo J8 vẫn đứng: dải này đã bị vượt 2 lần bởi các gap
chưa chứng nhận (#11 → #12 4h10'33",
#33 → #34 5h43'18") — nó là phát biểu về các gap đơn đã biết,
không phải bảo đảm. **Không đưa dự báo điểm cho #47 hay reboot
nào sau đó** — chỉ dải cơ học áp lên #46 (15:44:49Z):
**[16:03:56Z, 18:58:57Z]**; probe #34 (17:45:02Z, boot #46) đã
loại trừ phần trước 17:45:02Z → dải hiệu dụng
**[17:45:02Z, 18:58:57Z]**; p10–p90 toàn chuỗi →
[16:31:43Z, 18:49:27Z].

### 2.6 Mù #31 — KHÔNG THỬ LẠI lượt này (giữ nguyên, theo lệnh task)

Mù #31 giữ nguyên **KHÔNG ĐÓNG HOÀN TOÀN** (Q6 §2.6): 1 cửa sổ
mở — 8'55" (10:23:54Z → 10:32:49Z); 2 reboot đã chốt (#43
08:53:37Z, #44 10:53:31Z) + tối đa 1 ẩn. Q6 đã thử hết 5 nguồn
prereg §4; task đợt 115 dặn rõ "giữ nguyên, không thử lại vô ích
trừ khi có nguồn mới thật sự" — lượt này **không có nguồn mới
thật sự** nào cho cửa sổ 10:23:54Z–10:32:49Z (mọi log mới đều sau
cửa sổ; journal/wtmp vẫn chỉ giữ boot hiện tại #46), nên R7
không thử lại. Parent/user quyết xem có chấp nhận "ít nhất 2
reboot, có thể 3" làm mức đóng của mù #31 hay để mở như mù
#24/#26/#28/#29/#30. R7 không tự quyết. Gap #43 → #44 = 1h59'54"
KHÔNG được chứng nhận (cận trên).

### 2.7 Quét writeFileSync (snapshot 17:52:07–17:52:28Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round115-r7`. Chạy trọn vẹn (21 s, SCAN-END có đủ). Kết quả
NEWSTD khớp 100% scan-meta.txt (tính lại từ file wfs-*.txt +
files-*.bin gốc).

- Chuẩn mới: **680 dòng / 196 file** (phạm vi 2857 file).
  Lần 20 (Q6): 656 dòng / 191 file (phạm vi 2842 file).
- R7b (đối chiếu): **705 dòng / 213 file**. Lần 20: 681 / 208.
- Copies: **25 dòng / 17 file** — y hệt lần 20, 19, 18, 17, J8,
  I7, H7, G8 và F7.
- Đối chiếu chéo 680+25=705=R7b, **chênh 0 — lần thứ hai mươi
  mốt liên tiếp**. Tổng hit trên cả 3 bảng: 680+705+25 =
  **1.410 dòng**.
- **+24 dòng / +5 file so với lần 20, giải thích đúng hết bằng
  diff hit list** (đã đọc nội dung từng dòng mới; không có dòng
  nào tăng trong file cũ ngoại trừ không có — 0 file cũ tăng,
  không file nào giảm):
  - +7 `docs/PHASE9_ROUND114_Q6_EPERM_LIMITS.md` (file LIMITS của
    chính Q6 — 7 hit đều là trích dẫn "writeFileSync" trong văn
    bản, đã đọc nội dung từng dòng)
  - +1 `docs/PHASE9_ROUND114_LIMITS.md` (LIMITS gộp đợt 114 —
    1 hit là trích dẫn trong văn bản, đã đọc)
  - +7 `apps/web/scripts/probe114q2-frame-parity.mjs` (Q2 đợt 114
    — script probe frame-parity: ghi vite config tạm + kết quả/
    log vào scratch; đã đọc 7 dòng)
  - +1 `apps/web/scripts/probe115r1.mjs` (R1 đợt 115 — dòng 215:
    `fs.writeFileSync(waveProbeFile, "x")`, lệnh ghi probe sóng
    EPERM thật trong script đo, không phải production; cùng mẫu
    với probe114q1 của Q6)
  - +8 `apps/web/scripts/probe115r3-frame-parity.mjs` (R3 đợt 115
    — script probe frame-parity: ghi vite config tạm + kết quả/
    log vào scratch; đã đọc 8 dòng)
  - Tổng: 7+1+7+1+8 = **24** ✓, 5 file mới có hit ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets). Đếm lại trực tiếp sau scan: Q6 LIMITS đúng 7,
    ROUND114_LIMITS đúng 1, probe114q2 đúng 7, probe115r1 đúng 1,
    probe115r3 đúng 8.
- **0 file biến mất khỏi hit list.**
- Scope: **+15 file ròng / −0 file** so với lần 20 (2857 =
  2842+15−0 ✓): 15 file mới = 5 file hit trên + 10 file không
  hit (2 script benchmark — `benchmarks/render/q8_analyze_114.py`,
  `benchmarks/render/q8_analyze_115r8.py` — + 2 script
  benchmark — `benchmarks/render/webkit_blob_flaky_114q8_2mib.mjs`,
  `benchmarks/render/webkit_blob_flaky_115r8_2mib.mjs` — + 6 file
  LIMITS — Q1/Q2/Q3/Q5/Q7/Q8 đợt 114). Comm hai chiều khớp đúng
  (15 = 5+10 ✓).
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt lần 20 — xem files-copies.txt;
  diff wfs-copies.txt với lần 20: IDENTICAL).
- **Race trong cửa sổ scan (ghi rõ, không giấu):** các sibling
  đợt 115 vẫn đang chạy (R1/R2/R3/R4/R5/R6/R8/R9/R10 spawn
  17:35:51Z); 2 file probe115r1/r3 đã hạ cánh trước khi scan bắt
  đầu (scan bắt đầu 17:52:07Z — đếm lại trực tiếp sau scan khớp
  số trong wfs-newstd.txt — không hỏng số đếm). Sibling đợt 115
  vẫn đang chạy nên lượt sau cần đối chiếu lại.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2857 file), NUL-safe, chạy từ trong repo-1 — chỉ đúng 2 hit
trong code (đếm lại bằng python từ files-*.bin gốc, không tin mù
file cũ; tổng 127 dòng `.writeFile(` trong phạm vi, 125 dòng nằm
trong `.md`, 2 dòng trong code — lần 20 là 117 dòng, 115 trong
`.md`, 2 trong code; +10 dòng đều nằm trong `.md` trích dẫn mới):

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z — kiểm lại trực tiếp
lượt này). Kết luận giữ nguyên như M4/N6/P6/Q6: **2 async call
site, cả 2 đều thuộc helper retry đã biết với cùng hợp đồng
EPERM-only + verify byte — không phải write async stray, không
cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

4 mẫu MemAvailable của lượt: **434.660 kB (17:45:02Z, lúc probe
#34) / 2.008.556 kB (17:52:07Z, lúc scan bắt đầu) / 2.320.368 kB
(17:52:28Z, lúc scan xong) / 1.171.744 kB (17:58:21Z, lúc viết
LIMITS)** — ~0,42 GB rồi ~1,96 GB rồi ~2,27 GB rồi ~1,14 GB.
**Dao động mạnh trong 13 phút** (từ ~0,4 GB lên ~2,3 GB rồi
xuống ~1,1 GB — có thể do tiến trình sibling/vite giải phóng sau
khi xong; R7 không đo được nguyên nhân chính xác, chỉ ghi số —
cùng mẫu dao động như Q6: 0,81 GB → 1,82 GB trong 11 phút). Max
RAM biết được **trong** mù #33 từ log sibling: **3.378 MB ≈
3,30 GB** (Q2 chr-mixedalt-q2r1-fr4 exit, 15:56:12Z, boot #46) =
**55% ngưỡng guard 6144 MB**; max trong đoạn A: **2.326 MB**
(Q3, 14:56:18Z, boot #45) = 38% guard; các mẫu RAMavail khác
trong mù: 686 MB (Q5 gate poll, 14:48:24Z — TRƯỚC mù 59 s, không
tính), 1406 MB (Q5, 15:02:01Z), 2372 MB (Q3 dial, 15:57:18Z),
2125 MB (Q3 s76 exit, 16:16:08Z). Cả hai số max đều là
`free -m` cột 7 (MemAvailable) — đã đọc script Q2/Q3 xác nhận
(run-q2.sh dòng 67, driver114q3.sh dòng 28 dùng cùng công thức).
Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3 mục 7 (chỉ thử
lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥ 6 GB mới thử
lại). Birefnet-general vẫn **0 lần chạy thành công** trong gói.
Mẫu RAM lúc probe (0,42 GB) vẫn xa ngưỡng guard; máy chưa từng
tiến gần ngưỡng guard trong mù #33 (max 55%).

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Lỗ mù phải kiểm chứng 4 lớp trước khi tuyên bố (L6 §4 mục 1,
   M4 §4 mục 1, N6 §4 mục 1, P6 §4 mục 1, Q6 §4 mục 1, áp dụng
   lượt này — xem §2.3):** (a) mtime find trong hai cây để xác
   định lỗ; (b) **đọc NỘI DUNG** các file log append chạm biên lỗ
   (poll-q9.log — 12 mục, 300/301 s đều; poll-q5.log — 10 mục,
   60/61 s đều; postboot/Q3 log — boot tươi đầu/cuối; Q7
   early-watch — boot tươi 15:46:12Z/15:51:57Z); (c) **tìm ngoài
   hai cây**: find toàn ~/workspace (không prune) + /tmp +
   agents/ + chrome-userdata trong đúng cửa sổ lỗ; (d) **số học
   sàn** để bound khe không loại trừ được (mù #33: 0 cửa sổ còn
   lại).
2. **Dấu boot TƯƠI (đọc /proc tại thời điểm ghi) miễn nhiễm với lỗ
   "tiến trình cũ sống sót" (P6 §4 mục 2, áp dụng lượt này — xem
   §2.3):** postboot-check và O8/Q-driver log đọc `boot_id` bằng
   command substitution NGAY lúc echo — sau reboot, /proc cho
   boot_id mới nên dấu này chứng minh không reboot trước thời
   điểm đó, bất kể tiến trình có sống sót hay không. Ngược lại,
   một session chỉ ghi file (không đọc boot) thì vẫn phải trừ 38 s
   sống sót ở đuôi. Khi đánh giá session, phân biệt rõ: session
   có đọc boot tươi trong nội dung thì đóng tới đúng thời điểm
   đọc; session chỉ ghi file thì trừ 38 s.
3. **Quan sát ngoài cây KHÔNG tự động thu hẹp khe (N6 §4 mục 2,
   P6 §4 mục 3, áp dụng lượt này — xem §2.3):** 116 file
   ~/workspace có mtime trong đoạn A nhưng chỉ là mtime — khe
   được bound bằng số học sàn + poller + đo boot tươi, không bằng
   mật độ quan sát. Chỉ quan sát nào **xác định boot**
   (boot_id/uptime trong nội dung, hoặc session bắc qua) mới thu
   hẹp được khe. Đừng đếm "có file trong lỗ" thành "lỗ đã lấp".
4. **`find -newerBt` với chuỗi thời gian là SAI (N6 §4 mục 3, nhắc
   lại — lượt này KHÔNG mắc):** dùng `find -printf '%T@'` lấy
   mtime epoch rồi so sánh bằng code (R7 đã làm đúng: toàn
   workspace + /tmp trong đoạn A; 52+ proc log session-spanning
   check).
5. **`status` STALE chỉ ghi 1 dòng DEAD cho mỗi heartbeat (N6 §4
   mục 4, P6 §4 mục 5, Q6 §4 mục 5, xác nhận lại lượt này — xem
   §1):** log tăng 91 → 94 (+3: DEAD mới cho #33 + boot-changed
   + probe) vì chưa có dòng DEAD nào cho heartbeat #33. Khi đếm
   dòng log lượt sau phải tính cả cơ chế dedupe này (baseline mới
   là **94**, không phải 91 hay 92).
6. **Exit code lấy từ `$?` trực tiếp, không qua pipe (N6 §4 mục
   5, P6 §4 mục 6, Q6 §4 mục 6, áp dụng lượt này — xem §1):** cả
   3 lệnh checklist ghi ra file riêng rồi đọc `$?`; probe-notes.txt
   (ghi trực tiếp, không qua `| tee`) chỉ chứa phần xác minh boot,
   không chứa exit code. Quy định script: status 0 ALIVE / 1
   STALE-DEAD / 2 never-run; once 0.
7. **Session exec bắc qua là kẹp mạnh nhất sau poller (N6 §4 mục
   6, P6 §4 mục 7, Q6 §4 mục 7, áp dụng lượt này — xem §2.3):**
   lượt này quét session-spanning trả **0 session** bắc qua cắt
   sàn 15:25:42Z — poller Q9 (không phải session exec) mới là
   observer bắc qua. Khi poller chạy nền (nohup/&), session khởi
   động nó đã thoát ngay sau khi launch nên không bắc qua được —
   đừng mong đợi luôn có waiter session; kiểm tra cả hai, ghi rõ
   cái nào có, cái nào không.
8. **Chứng nhận gap theo KHOẢNG, không theo nhãn mù (P6 §4 mục 8,
   Q6 §4 mục 8, áp dụng lượt này — xem §2.5):** #45 → #46 được
   chứng nhận vì khoảng (13:17:42Z, 15:44:49Z) không chứa cửa sổ
   mở (mù #33 đóng kín). Ghi rõ cơ sở để parent quyết (nếu không
   đồng ý thì hạ về cận trên, CERT về n=24).
9. **`ps aux` / `ps -eo lstart` là nguồn độc lập cho giờ reboot
   (L6 §4 mục 2, M4 §4 mục 3, N6 §4 mục 8, P6 §4 mục 9, Q6 §4
   mục 9, áp dụng lượt này — xem §2.2):** systemd PID 1 START
   15:44:59, hatch 15:45:00, hatch-execd 15:45:22 — khớp
   `uptime -s` 15:44:49Z ở mức phút.
10. **Chốt giờ reboot bằng `uptime -s` trên boot mới, đo 2 lần —
    KHÔNG dùng mtime file cuối của boot cũ** (K6 §4 mục 2, nhắc
    lại): lần này #46 giữ giờ đợt 114 chốt (15:44:49Z); R7 xác
    nhận lại bằng 2 lần đo trực tiếp + btime trên boot #46; ghi rõ
    nguồn gốc giờ, đừng giả vờ đo lại được.
11. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
    reboot** (J8 §4 mục 1, nhắc lại): đừng bao giờ đếm reboot chỉ
    bằng `grep "boot changed"` trên log probe; chuỗi đánh số chính
    thức nằm trong các file LIMITS EPERM theo đợt.
12. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (J8 §4 mục 2, nhắc
    lại): dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn
    đã chứng nhận (n=25) sau lượt này; trên toàn chuỗi vẫn có 2
    gap vượt (đều là cận trên). **Nằm trong dải không đồng nghĩa
    được chứng nhận** (M4 §4 mục 6, nhắc lại): gap #45 → #46
    (2h27'07") được chứng nhận vì khoảng đã đóng kín, không phải
    vì nó nằm trong dải.
13. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
    bằng sàn** (H7 §4 mục 1, nhắc lại): sàn 19'07" vẫn đứng sau
    lượt này; mù #33 đóng được là nhờ poller + dấu tươi + gate
    poller, sàn chỉ đóng đuôi 3'55" — sàn là công cụ bound, không
    phải bằng chứng đóng duy nhất.
14. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
    poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ lớn
    15:17:52Z → 15:41:38Z, toàn ~/workspace ngoài hai cây chỉ có
    ghi rời rạc — không session nào bắc qua, không boot_id nào;
    đoạn A đóng được là nhờ POLLER Q9 + dấu boot tươi, không nhờ
    các ghi rời rạc này.
15. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
    4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
    vị trí đã biết trước khi kết luận.
16. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
    §4 mục 8, nhắc lại):** lượt này 10 dòng "đã tắt" trong mù #33
    đều là dương tính giả (launcher); 0 dòng "vẫn bật", 0
    "Operation not permitted" thật. Đếm whole-file (không chỉ
    dòng trong cửa sổ) nên 0 còn mạnh hơn.
17. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9 / J8 §4 mục 9
    / L6 §4 mục 10 / M4 §4 mục 11 / N6 §4 mục 16 / P6 §4 mục 17 /
    Q6 §4 mục 17): lượt này probe + quét xong là ghi LIMITS/
    batch ngay, không đợi luồng khác — reboot #46 (15:44:49Z) đã
    xảy ra giữa đợt 114 và đợt 115; lượt sau có thể bị reboot
    giết bất cứ lúc nào.
18. **Đếm *.log sóng EPERM phải quét cả hai cây** (J8 §4 mục 10,
    nhắc lại): lần này 88 file đều nằm ở hidden_files (0 file
    repo-1). Quét một cây sẽ kết luận sai là "không có log".
19. **Scan writeFileSync có thể bị reboot cắt ngang giữa chừng**
    (L6 §4 mục 12, nhắc lại): lần này scan chạy trọn vẹn 21 s
    trên boot mới, SCAN-END có đủ; kiểm tra SCAN-END trước khi
    tin scan-meta.txt.
20. **Đếm mốc mtime (L9 §6.1, áp dụng lượt này):** mù #33 có
    **367 mốc mtime** (độ chính xác đầy đủ) nhưng chỉ **255 giây
    nguyên phân biệt** — ghi cả hai số, không ghi một số mập mờ.
21. **Đo uptime tại thời điểm probe ĐÓNG đoạn đuôi sau reboot cuối
    — sàn chỉ áp dụng GIỮA hai reboot đã biết (Q6 §4 mục 21,
    áp dụng lượt này — xem §2.3):** đoạn B đóng toàn bộ bằng đo
    uptime trực tiếp, KHÔNG tự tạo cửa sổ mở giả bằng sàn.
22. **File mtime-only trong cửa sổ có thể bị ghi đè sau đó và mất
    nội dung gốc (Q6 §4 mục 22, nhắc lại):** khi đếm lại cửa sổ
    cũ, đối chiếu số file với lượt trước và giải thích mọi chênh
    lệch bằng mtime hiện tại; đừng kết luận "lượt trước đếm sai"
    khi file đã dời mtime.
23. **Mtime của file chỉ là lần ghi CUỐI — append trung gian không
    thấy được bằng `find` (mới, lượt này — xem §2.3):** poller Q9
    ghi append mỗi 300 s nhưng file poll-q9.log chỉ có 1 mtime
    cuối (16:46:22Z); lỗ mtime 1426 s trong đoạn A chỉ lấp được
    bằng cách ĐỌC NỘI DUNG log (timestamp trong từng dòng), không
    bằng mật độ mốc mtime. Lượt sau: khi thấy lỗ mtime lớn, đọc
    nội dung các log append trong lỗ trước khi kết luận "lỗ".
24. **Bẫy grep substring khi đếm dòng probe (mới, lượt này — xem
    §1):** `grep -c "probe end"` trả 28 vì mọi dòng DEAD đều chứa
    "no probe end since last start" — phải dùng mẫu chính xác
    `=== probe end` (đúng 0 dòng). Tương tự, đếm "boot changed"
    (28 dòng) là đếm bước nhảy ròng, không phải số reboot (xem
    mục 11).
25. **Chứng minh poller là 1 tiến trình từ NỘI DUNG log, không cần
    session launch (mới, lượt này — xem §2.3):** 1 dòng START +
    chuỗi poll liên tiếp đúng số thứ tự + đúng khoảng 300 s + script
    không có cơ chế restart + mọi dòng RESTART đều sau reboot —
    hợp lại đã đủ chứng minh tính đơn nhất; không cần tìm proc log
    của session đã launch nó (session đó đã thoát ngay sau launch).
    Lượt sau: kiểm tra script poller có vòng tự restart không
    trước khi tin chuỗi poll.
26. **Prereg phải ghi cả hai khả năng khi cơ chế dedupe chưa chắc
    chắn (Q6 §4 mục 23, nhắc lại):** R7 dự báo đúng log +3 vì đã
    kiểm tra trước rằng chưa có dòng DEAD nào cho heartbeat #33.
    Lượt sau: kiểm tra dòng DEAD cuối log trước khi dự báo số dòng
    tăng.
27. **Tái dùng bảng gap bằng exec nguyên văn, không gõ lại (mới,
    lượt này — xem §2.5):** blind33-gaps.py exec recount-q6.py
    nguyên văn rồi cộng gap mới — các kiểm tra chéo CERT22/23/24
    và FULL36/38/39 đều khớp 100% số đã công bố. Gõ lại bảng gap
    bằng tay rất dễ sai số (R7 đã suýt gõ sai FULL39 ở bản nháp
    đầu — đã bỏ, dùng exec thay thế).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #33 ĐÓNG HOÀN TOÀN (mới, lượt này, xem §2.3):**
   1 reboot đã chốt (#46 15:44:49Z) + 0 reboot ẩn. Gap #45 → #46
   = 2h27'07" ĐƯỢC CHỨNG NHẬN (mới — xem §2.5, chờ parent xác nhận
   cách chứng nhận xuyên mù như #42 → #43 và #44 → #45). Số thứ
   tự #46 vẫn TẠM THỜI (kế thừa mù #29/#30/#31 chưa đóng — tối đa
   "thực tế #50"). Dải cơ học cho #47 từ #46: [16:03:56Z,
   18:58:57Z] — hiệu dụng [17:45:02Z, 18:58:57Z] sau probe #34; là
   phép áp dải máy móc, không phải dự báo.
2. **Khoảng mù #32 ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (Q6 đợt 114; Q9
   đã đính chính lỗi viết ngược của Q2 — R7 không lặp lại lỗi
   này). Gap #44 → #45 = 2h24'11" ĐÃ ĐƯỢC parent CHỨNG NHẬN
   (quyết parent 15/11).
3. **Khoảng mù #31 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI, KHÔNG THỬ
   LẠI LƯỢT NÀY** (Q6 §2.6, R7 §2.6): 1 cửa sổ mở — 8'55"
   (10:23:54Z → 10:32:49Z). Số reboot trong mù: 2 đã chốt
   (#43 08:53:37Z; #44 10:53:31Z) + có thể tối đa 1 ẩn. **Số thứ
   tự #43/#44 vẫn TẠM THỜI** — parent/user quyết xem có chấp nhận
   "ít nhất 2 reboot, có thể 3" làm mức đóng của mù #31 hay để mở
   như mù #24/#26/#28/#29/#30. R7 không tự quyết. Gap #43 → #44
   = 1h59'54" KHÔNG được chứng nhận (cận trên); không còn nguồn
   nào để thử thêm (trừ khi có nguồn mới thật sự).
4. **Khoảng mù #30 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (N6 §5 mục
   1, P6 §5 mục 2, Q6 §5 mục 3): 3 cửa sổ mở, tổng 30'50"; số
   reboot trong mù: 2 đã chốt + có thể tối đa 2 ẩn. Số thứ tự
   #41/#42 vẫn TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm —
   parent/user quyết. R7 không tự quyết.
5. **Khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (M4 §5 mục
   1, P6 §5 mục 3, Q6 §5 mục 4): lỗ thật 14'31" theo M4 / 13'33"
   theo M9 birth-time, khe 79 s không loại trừ được; số reboot
   trong mù: 2 đã chốt + có thể 1 ẩn. Số thứ tự #39/#40 vẫn TẠM
   THỜI. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết. R7 không tự quyết.
6. **Khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục
   1, P6 §5 mục 4, Q6 §5 mục 5): lỗ 23'39" (02:01:06Z →
   02:24:45Z), khe 4'32" không loại trừ được; số reboot trong mù:
   2 đã chốt + có thể 1 ẩn. Số thứ tự #37/#38 vẫn TẠM THỜI.
   Không còn dữ liệu nào để thu hẹp thêm — parent/user quyết. R7
   không tự quyết.
7. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
   1, P6 §5 mục 5, Q6 §5 mục 6): lỗ 1h13'58" (19:20:19Z →
   20:34:17Z) có thể chứa thêm reboot; số reboot trong mù: ít
   nhất 1 (#34), có thể nhiều hơn — không xác định được; số thứ
   tự #34 là TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm —
   parent/user quyết. R7 không tự quyết.
8. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1, P6 §5 mục 6, Q6 §5 mục 7): lỗ 2h03'11" (12:28:41Z →
   14:31:52Z) có thể chứa thêm reboot; số reboot trong mù: ít
   nhất 1 (#32), có thể nhiều hơn — không xác định được; số thứ
   tự #32/#33/#34/#35/#36/#37/#38/#39/#40/#41/#42/#43/#44/#45/#46
   là TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm —
   parent/user quyết. R7 không tự quyết.
9. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1,
   P6 §5 mục 7, Q6 §5 mục 8): lỗ ~17'23" (03:57:19Z–04:14:42Z)
   có thể chứa đúng 1 reboot trung gian. Không còn dữ liệu nào
   để thu hẹp thêm — parent/user quyết. R7 không tự quyết.
10. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
    §6 mục 3, P6 §5 mục 8, Q6 §5 mục 9): cửa sổ lý thuyết ≤78 s
    với sàn 19'07". R7 không thử lại, không tự quyết — parent/user
    quyết giữ "đóng", "đóng có điều kiện", hay mở lại.
    **Khoảng mù #23 VẪN ĐÓNG HOÀN TOÀN** (không đổi kết luận G8).
    **Khoảng mù #25 VẪN ĐÓNG HOÀN TOÀN** (không đổi kết luận I7).
    **Khoảng mù #27 VẪN ĐÓNG HOÀN TOÀN** (không đổi kết luận K6).
    **Khoảng mù #28 nay KHÔNG ĐÓNG HOÀN TOÀN** (L6).
    **Khoảng mù #29 nay KHÔNG ĐÓNG HOÀN TOÀN** (M4).
    **Khoảng mù #30 nay KHÔNG ĐÓNG HOÀN TOÀN** (N6).
    **Khoảng mù #31 nay KHÔNG ĐÓNG HOÀN TOÀN** (P6, Q6 thử lại
    không đóng được, R7 không thử lại).
    **Khoảng mù #32 nay ĐÓNG HOÀN TOÀN** (Q6).
    **Khoảng mù #33 nay ĐÓNG HOÀN TOÀN** (mới, lượt này).
11. **Khoảng mù #34 BẮT ĐẦU từ 17:45:02Z** (probe #34) — lượt sau
    (probe #35, đợt 116) đối chiếu từ mốc này, trên boot 7a0638c4
    (#46, từ 15:44:49Z, số thứ tự tạm thời). Dải cơ học cho #47
    từ #46 là [16:03:56Z, 18:58:57Z] — hiệu dụng [17:45:02Z,
    18:58:57Z] sau probe #34; là phép áp dải máy móc, không phải
    dự báo. Baseline log probe cho lượt sau là **94 dòng** (không
    phải 91 hay 92 — xem §1).
12. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
    mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
    LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3
    mục 8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6
    §5 mục 2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2,
    A8 §5 mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục
    3, F7 §6 mục 4, G8 §6 mục 5, H7 §6 mục 5, I7 §5 mục 6, J8 §5
    mục 5, K6 §5 mục 6, L6 §5 mục 7, M4 §5 mục 8, N6 §5 mục 9, P6
    §5 mục 10, Q6 §5 mục 11): lệnh cron chỉ là `bash
    ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài giây,
    không giữ tiến trình nền). R7 KHÔNG tự tạo, KHÔNG start loop
    nền. Bằng chứng mới: mù #33 đóng được LÀ NHỜ poller Q9 chạy
    xuyên suốt + dấu boot tươi — cùng mẫu với mù #32 (poller P8)
    và ngược với mù #31 (poller N8 đã exit lúc 10:15:01Z và không
    còn observer thường trực nào sau đó). Lần này cửa sổ mở của
    mù #33 là 0 (không còn cửa sổ nào) vì poller + dấu tươi phủ
    kín đoạn A và đo uptime phủ kín đoạn B.
13. **Mô hình dự báo điểm ĐÃ BỎ — KHÔNG ĐỔI** (J8 §2.5, §5 mục 6,
    P6 §5 mục 11, Q6 §5 mục 12): không đưa dự báo điểm cho #47
    hay reboot nào sau đó; thay bằng dải chứng nhận [19'07",
    3h14'08"] + p10–p90 thực nghiệm + đo uptime trực tiếp +
    poller.
14. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
    và các lượt sau; log tăng đúng 3 dòng checklist, 91 → 94 —
    dòng DEAD mới cho #33 + boot-changed + probe, xem §1 — không
    thêm dòng lạ mới trong lượt này.)
15. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
    đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
    được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
    cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
16. **VM reboot ~1 lần / 119,3'** (46 lần đã chốt giờ / 91,44h từ
    ~20:18:10Z 10/11 tới 15:44:49Z 14/11, số thứ tự tạm thời — xem
    §2.2 + §2.5; nếu mù #29 chứa thêm 1, mù #30 chứa thêm tối đa 2
    và mù #31 chứa thêm tối đa 1 reboot ẩn thì 50 lần / 91,44h =
    1 lần / 109,7'): mọi probe nền đều chết theo reboot; v2 chỉ
    đảm bảo cái chết được ghi nhận + lượt sau hồi phục bằng 1 mẫu
    mới.
17. **Birefnet: KHÔNG chạy trong lượt này** — RAM 4 mẫu MemAvailable
    **434.660 / 2.008.556 / 2.320.368 / 1.171.744 kB** (~0,42 /
    ~1,96 / ~2,27 / ~1,14 GB); max trong mù #33 từ log sibling
    **3.378 MB ≈ 3,30 GB** = 55% guard 6144 MB. Birefnet-general
    vẫn 0 lần chạy thành công trong gói.
18. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
19. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
20. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    R7 không thử lại nguồn nào, theo đúng lệnh.
21. **Đính chính nhỏ (mới, lượt này):** (a) Log probe v2 tăng 91 →
    94 (+3, không phải +2) vì chưa có dòng DEAD nào cho heartbeat
    #33 — prereg đã dự báo đúng; baseline lượt sau là 94 dòng.
    (b) Gap #45 → #46 = 2h27'07" ĐƯỢC CHỨNG NHẬN theo khoảng (mù
    #33 đóng kín) — lần thứ hai chứng nhận 2 gap liên tiếp
    (#44 → #45 rồi #45 → #46); chờ parent xác nhận cách chứng
    nhận xuyên mù (xem §2.5). (c) Dải cơ học cho #47 phải cắt phần
    trước 17:45:02Z (probe #34 đã loại trừ) → hiệu dụng
    [17:45:02Z, 18:58:57Z]. (d) `grep -c "probe end"` trả 28 là
    bẫy substring (28 dòng DEAD chứa "no probe end since last
    start") — số dòng `=== probe end` thật là 0; xem §4 mục 24.
    (e) Người viết 2 dòng "KILLED by reboot"/"RESTART" lúc
    15:45:56Z trong poll-q9.log chưa xác định được (grep có mục
    tiêu trong thư mục Q9 trống — script poller-q9b.sh không chứa
    các dòng này; nhiều khả năng là lệnh session của Q9 sau
    reboot) — không ảnh hưởng kết luận vì 2 dòng này chỉ là củng
    cố, kẹp chính là chuỗi poll #1–#12 + sàn đuôi.
