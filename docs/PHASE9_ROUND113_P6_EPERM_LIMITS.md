# PHASE9 ROUND113 P6 — EPERM: probe #32 + reboot #44 + khoảng mù #31 KHÔNG ĐÓNG HOÀN TOÀN

> Luồng P6, đợt 113 vòng lặp Phase 9 VCut Studio (lượt cron 18:35 +07,
> 14/11/2026; làm việc 11:37Z → 11:5xZ 14/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + xác định reboot
> #44 + điều tra khoảng mù #31 kể từ probe #31 (08:40:59Z) + quét sóng
> EPERM + quét writeFileSync lần thứ 19 + ghi RAM (birefnet: KHÔNG
> chạy — vẫn dưới ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #31, mù #30, mù #29, mù #28,
> mù #26, mù #24, mù #21, hay reboot #16** — chỉ báo cáo "không thấy"
> vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (11:37:14Z):**
  `status` báo **DEAD/STALE** (heartbeat age 10.575 s, last #31
  08:40:59Z, boot cc39f151, exit 1 theo quy định script — exit lấy
  từ `$?` trực tiếp, không qua pipe, xem §1); `once` ngay sau đó là
  **probe #32, boot 6ad1ef9e (ĐỔI), ok=2 fail=0**, exit 0; `status`
  chạy lại **ALIVE** (age 0 s, n=32), exit 0. Log v2 tăng đúng **2
  dòng** checklist (86 → 88) — không phải 3: dòng DEAD của `status`
  bị dedupe chặn (dòng cuối log đã là DEAD cho cùng heartbeat #31
  từ 08:56:42Z, xem §1); heartbeat nay n=32, ts 11:37:14Z,
  boot 6ad1ef9e.
- **Reboot #44 = 10:53:31Z — XÁC NHẬN bằng 2 phép đo `uptime -s`
  trực tiếp** (11:37:09Z, giống nhau từng giây) + btime 1794653611
  = 10:53:31Z + `who -b` Nov 14 10:53 + boot_id 6ad1ef9e + journal
  first entry 10:53:42Z + wtmp begins 10:53:42Z + `ps` systemd PID 1
  START 10:53:41, hatch 10:53:42. Gap #43 → #44 = **1h59'54" —
  CHƯA ĐƯỢC CHỨNG NHẬN** (mù #31 chưa đóng, xem dưới) — ghi là
  **cận trên** trong toàn chuỗi; **KHÔNG phá sàn** (1h59'54" >
  19'07").
- **Gap #42 → #43 = 48'27" — ĐƯỢC CHỨNG NHẬN (mới, lượt này).**
  Khoảng (08:05:10Z, 08:53:37Z) không chứa cửa sổ mở nào: đoạn C
  của mù #30 đã đóng bằng đo uptime trực tiếp (N6 §2.3) + đoạn A
  của mù #31 đóng bằng poller N8 + sàn đuôi 2'22" (xem §2.3).
  Tập gap đơn đã chứng nhận tăng **n=22 → n=23** (xem §2.5) —
  lần đầu tiên một gap được chứng nhận kể từ L6 (#36 → #37, đợt
  110). Dải chứng nhận [19'07", 3h14'08"] không đổi (min/max
  không đổi).
- **Khoảng mù #31: 08:40:59Z → 11:37:14Z (2h56'15") — KHÔNG ĐÓNG
  HOÀN TOÀN (mới, lượt này).** Đoạn A (tới #43) **ĐÓNG** bằng
  poller N8 (POLL#0–#2, uptime 2165/2465/2765 s khớp từng giây
  với boot 08:05:10Z) + sàn đuôi 2'22". Đoạn B (tới #44) **KHÔNG
  ĐÓNG**: còn **1 cửa sổ mở 8'55" (10:23:54Z → 10:32:49Z)** —
  sau dấu boot cuối cùng (O8 done 10:23:54Z, đọc boot_id tươi)
  và trước session U4-dry (birth 10:32:49Z); hai session ngắn
  trong cửa sổ (33 s + 4 s) đều ngắn hơn ngưỡng sống sót 38 s
  nên không loại trừ được gì; tìm ngoài hai cây trong cửa sổ
  chỉ ra 4 quan sát mtime-only (LIMITS gộp, cờ done, GAP_ANALYSIS,
  2 batch file) — không thu hẹp khe (xem §2.3). Đoạn C (sau #44)
  **ĐÓNG** bằng đo uptime trực tiếp + probe #32.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn
  bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật
  trong 89 file *.log có mtime trong mù #31 (0 file repo-1,
  89 file hidden_files — đếm lại độc lập từ đĩa); 10 dòng "sóng
  EPERM đã tắt" đều là **dương tính giả đã biết** (dòng
  launcher: N1 4× trong 2 file trùng nội dung 09:31:39–09:32:44Z,
  N8 O8 2× 10:21:05 + 10:23:01Z). Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — **~71h26'** trước probe #32. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 19: 637 dòng / 187 file** (phạm vi
  2827 file); R7b đối chiếu 662 dòng / 204 file; copies 25 dòng /
  17 file — y hệt lần 18; đối chiếu chéo 637+25=662=R7b, **chênh 0
  — lần thứ mười chín liên tiếp**. +24 dòng / +5 file so với lần
  18, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí, cả hai trong helper retry
  đã biết** — 0 stray; mtime 2 helper không đổi từ 10/11.
- **Dải chứng nhận [19'07", 3h14'08"] CÒN DÙNG ĐƯỢC** (tập gap đơn
  đã chứng nhận nay n=23 — thêm #42 → #43). Toàn chuỗi n=36 →
  **n=38** (thêm #42 → #43 chứng nhận + #43 → #44 cận trên):
  trung bình 1h56'06", trung vị 1h58'30" — xem §2.5.
- RAM: 2 mẫu MemAvailable của lượt: **506.972 kB (11:37:14Z, lúc
  probe #32) / 2.915.720 kB (11:47:37Z)** — ~0,49 GB rồi ~2,85 GB
  (dao động mạnh sau probe, xem §3). Max RAM biết được **trong**
  mù #31 từ log sibling: **1182 MB** (N8 verify start, 10:16:39Z)
  = 19% ngưỡng guard — chỉ 1 mẫu RAMavail tìm thấy trong toàn bộ
  89 log của mù #31. Birefnet KHÔNG chạy, vẫn 0 lần chạy thành
  công trong gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ parent/user
  quyết); cron riêng 10 phút vẫn chờ user quyết.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 11:37:09Z | boot_id `6ad1ef9e-3e7f-4c9f-852b-7c64c156c3c0`; `who -b` Nov 14 10:53; `uptime -s` **2026-11-14 10:53:31Z** (2 lần, giống nhau từng giây); btime **1794653611 = 2026-11-14T10:53:31Z**; journal chỉ 1 boot (6ad1ef9e, first entry 10:53:42Z, last 11:36:11Z lúc kiểm tra); `last -x reboot` 10:53 still running; wtmp bắt đầu 10:53:42Z; `ps` systemd PID 1 START 10:53:41, hatch 10:53:42, hatch-execd 10:53:59 |
| `bash scripts/probe-eperm-v2.sh status` | 11:37:14Z | **DEAD/STALE**, heartbeat n=31, ts 08:40:59Z, boot cc39f151, age **10.575 s** (đúng 2h56'15"); last sample probe #31; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp, ghi trong status1.txt — không qua pipe) |
| `bash scripts/probe-eperm-v2.sh once` | 11:37:14Z | **probe #32, boot=6ad1ef9e, ok=2 fail=0**, exit 0; dòng `boot changed cc39f151 -> 6ad1ef9e` (uptime since 2026-11-14 10:53:31) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 11:37:14Z | **ALIVE**, age 0 s, n=32, exit 0 |

Kiểm lại từ đĩa (11:37Z): log probe v2 **88 dòng** — 86 sau N6 +
đúng 2 dòng checklist này (dòng `boot changed` + dòng probe #32).
**Không có dòng DEAD mới nào** từ `status` đầu: script chỉ ghi 1
dòng DEAD cho mỗi heartbeat (dedupe — N6 §4 mục 4), và dòng cuối
log lúc đó đã là dòng DEAD 08:56:42Z cho cùng heartbeat #31 nên
`status` 11:37:14Z không ghi thêm. Heartbeat **n=32, ts
2026-11-14T11:37:14Z, boot 6ad1ef9e-…** (pid=12736); log vẫn chỉ
có **ĐÚNG 1 dòng `probe start`** (08:49:50Z 11/11) và **0 dòng
`=== probe end`** — loop v2 chưa từng được start lại kể từ đợt 88.

**Ghi rõ phương pháp exit code (áp dụng đính chính của N6 §1):**
cả 3 lệnh checklist đều ghi output ra file riêng (status1.txt,
once.txt, status2.txt) rồi đọc `$?` trực tiếp, KHÔNG qua `| tee`
— số exit trên là exit thật của script (status 1 STALE / once 0 /
status 0 ALIVE), đúng quy định header script. File
`probe-notes.txt` (ghi qua `| tee`) chỉ chứa phần xác minh boot
độc lập, không chứa exit code.

Nguồn độc lập cho boot #44: không có sibling đợt 113 nào đo boot
#44 trước P6 (P8 chạy poller trên cùng boot #44 từ 11:37:05Z —
file poll-p8.log mtime 11:37:08Z, sau probe #32; P6 không dùng
log P8 làm nguồn xác nhận vì nó bắt đầu sau probe). Xác nhận #44
dựa vào 2 lần đo `uptime -s` + btime + journal/wtmp/ps như bảng
trên — đủ mạnh theo tiền lệ N6 (§2.2, #42 cũng chỉ có 2 lần đo +
N7; ở đây không có N7 thứ hai, ghi rõ).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như I7/J8/K6/L6/M4/N6 đã đính chính.

## 2. Điều tra khoảng mù #31 (08:40:59Z → 11:37:14Z, 2h56'15")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #32: `uptime -s` = **2026-11-14 10:53:31Z**,
  boot_id `6ad1ef9e-3e7f-4c9f-852b-7c64c156c3c0` — khác boot của
  probe #31 (cc39f151).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (11:37Z): chỉ **1 boot**
  (6ad1ef9e, first entry 10:53:42Z, last 11:36:11Z). `last -x
  reboot`: chỉ 1 dòng (10:53, still running). wtmp bắt đầu
  10:53:42Z. Journal/wtmp của boot 1af50bdb đã mất theo reboot
  #44 — như mọi lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu.

### 2.2 Hai reboot đã chốt trong mù — #43 (08:53:37Z) và #44 (10:53:31Z)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 43 | **08:53:37Z (giờ do N8 chốt — P6 KHÔNG đo lại được)** | cc39f151 → 1af50bdb | LIMITS gộp đợt 112 §0.1 ("`uptime -s` trực tiếp trên boot mới = 2026-11-14 08:53:37Z"). **Củng cố lượt này:** poller N8 restart 08:54:49Z ghi "newboot=1af50bdb prevboot=cc39f151"; POLL#3 08:54:53Z uptime 75 s → boot ≈ 08:53:38Z (khớp 08:53:37Z trong 1 s làm tròn); N8 postboot-check-b43 + suites/O8 đều ghi boot 1af50bdb xuyên suốt tới 10:23:54Z. **Số thứ tự TẠM THỜI** (xem dưới). |
| 44 | **10:53:31Z (chính xác từng giây)** | 1af50bdb → 6ad1ef9e | **2 phép đo `uptime -s` độc lập trên boot mới** (11:37:09Z, giống nhau từng giây) + btime 1794653611 + `who -b` 10:53 + boot_id 6ad1ef9e + journal first entry 10:53:42Z + wtmp begins 10:53:42Z + `ps` systemd PID 1 START 10:53:41 (đều ghi trong probe-notes.txt lúc 11:37Z). **Số thứ tự TẠM THỜI** (xem dưới). |

Gap #42 → #43 = **48'27" — ĐƯỢC CHỨNG NHẬN (mới, lượt này, xem
§2.3 + §2.5)**. Gap #43 → #44 = **1h59'54" — CHƯA ĐƯỢC CHỨNG NHẬN**
(thuộc mù #31 chưa đóng, ghi là cận trên trong toàn chuỗi).
Cả hai gap đều nằm trong dải chứng nhận [19'07", 3h14'08"] nhưng
nằm trong dải không đồng nghĩa được chứng nhận — chứng nhận đòi
khoảng chứa nó phải đóng kín (M4 §4 mục 6).

**Tính tạm thời của số thứ tự (ghi rõ, không giấu):** #43/#44
kế thừa tính tạm thời từ mù #29 chưa đóng (khe 79 s, M4 §2.3),
mù #30 chưa đóng (3 cửa sổ mở, N6 §2.3) **và từ chính mù #31
chưa đóng (1 cửa sổ mở 8'55", xem §2.3)**: nếu mù #29 chứa 1
reboot ẩn, mù #30 chứa tối đa 2 và mù #31 chứa tối đa 1 thì
"reboot #44" thực tế có thể là **#48**. **Giá trị các gap không
phụ thuộc số thứ tự** — chỉ phụ thuộc giờ đã chốt.

### 2.3 Hoạt động trong khoảng mù — vì sao KHÔNG ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **21 file**
(không tính dist/node_modules) + hidden_files **314 file** (không
tính chrome-userdata); **335 mốc mtime, 333 mốc phân biệt** (độ
chính xác đầy đủ; 224 giây nguyên phân biệt — theo cách đếm
L9 §6.1/M4 §4 mục 14/N6 §4 mục 19). Chia mù làm ba đoạn bởi #43
(08:53:37Z) và #44 (10:53:31Z):

- **Đoạn A: 08:40:59Z → 08:53:37Z (12'38", boot cc39f151) —
  ĐÓNG bằng poller + sàn:**
  - **Poller N8 (5 phút) là kẹp trực tiếp:** POLL-START 08:41:15Z
    → POLL#0 08:41:15Z → POLL#2 08:51:15Z (**3 mục, đều boot
    cc39f151, uptime 2165 s → 2465 s → 2765 s đơn điệu, max gap
    300 s** — đọc từ nội dung poll-n8.log, không phải mtime;
    uptime kiểm chéo khớp từng giây: 08:41:15Z − 08:05:10Z =
    2165 s ✓; 08:46:15Z − 08:05:10Z = 2465 s ✓; 08:51:15Z −
    08:05:10Z = 2765 s ✓). Poller bị #43 giết sau POLL#2
    (restart 08:54:49Z ghi rõ "reboot #43 suspected ~08:53Z,
    poller killed at POLL#2").
  - **Sàn đóng đuôi 2'22" (08:51:15Z → 08:53:37Z):** reboot ẩn
    tại t trong khoảng này cho gap2 = 08:53:37Z − t < 2'22" <
    sàn 19'07" → loại trừ mọi t trong đuôi.
  - Kết luận đoạn A: **ĐÓNG**.
- **Đoạn B: 08:53:37Z → 10:53:31Z (1h59'54", boot 1af50bdb) —
  KHÔNG ĐÓNG, còn 1 cửa sổ mở 8'55":**
  - **Poller N8 khởi động lại (5 phút) là kẹp trực tiếp tới
    10:15:01Z:** POLL#3 08:54:53Z (uptime 75 s → boot ≈ 08:53:38Z,
    khớp 08:53:37Z trong 1 s làm tròn) → POLL#19 10:15:01Z
    (uptime 4883 s; 10:15:01Z − 08:53:37Z = 4884 s, lệch 1 s do
    cắt ngọn — khớp) — **17 mục, đều boot 1af50bdb, uptime đơn
    điệu +300/+301 s mỗi bước**. Poller là MỘT tiến trình duy
    nhất (proc log birth 08:54:53Z, mtime 10:15:01Z, dur 4808 s)
    và exit BÌNH THƯỜNG lúc 10:15:01Z ("ALL 7 DONE at POLL#19").
    Các lần đọc uptime tươi mỗi 300 s loại trừ mọi reboot trong
    (08:54:53Z, 10:15:01Z].
  - **Chuỗi dấu boot tươi sau poller (đọc boot_id trực tiếp từ
    /proc tại thời điểm ghi — miễn nhiễm với lỗ "tiến trình cũ
    sống sót", xem §4 mục 2):** postboot-check-b43-n8.log
    (mtime 10:16:26Z, nội dung ghi `boot=2026-11-14 08:53:37` —
    script đọc `uptime -s` tươi lúc chạy); suites log
    "verify start 10:16:39Z boot 1af50bdb" (script đọc
    `/proc/sys/kernel/random/boot_id` tươi — đã đọc code
    round112-n8-verify.sh:5,32, cả start lẫn end đều đọc tươi) +
    "ALL DONE 10:20:33Z boot 1af50bdb"; O8 log "Chromium start
    10:21:04Z boot 1af50bdb" + "O8 done 10:23:54Z boot 1af50bdb"
    (round112-n8-o8.sh:15,24, đọc tươi). **Dấu boot cuối cùng:
    10:23:54Z.** Không có reboot nào trong (08:53:37Z, 10:23:54Z].
  - **CỬA SỔ MỞ duy nhất (10:23:54Z → 10:32:49Z, 8'55" = 535 s).**
    Sàn chỉ cho phép t trong [09:12:44Z, 10:34:24Z] (gap1 ≥ sàn
    ⟺ t ≥ 09:12:44Z; gap2 ≥ sàn ⟺ t ≤ 10:34:24Z — kiểm bằng code,
    xem recount-p6.txt: tại 10:23:54 gap1 1h30'17", gap2 29'37";
    tại 10:32:49 gap1 1h39'12", gap2 20'42" — cả hai đầu đều ≥
    sàn nên sàn không loại trừ được). Hoạt động trong cửa sổ
    DÀY nhưng đều là mtime, không xác định boot: session N8
    proc_416f63de5dce birth 10:26:08Z → mtime 10:26:41Z (33 s,
    grep playheadHold90R2.ts — nội dung không ghi boot); LIMITS
    gộp đợt 112 **10:28:38Z**; batch n8-verify **10:29:26Z**
    (repo-1-push, ngoài hai cây); cờ round112-n8-done
    **10:29:29Z**; session parent proc_a558d84b438c birth
    10:30:42Z → mtime 10:30:46Z (4 s, đếm batch 111+112 — không
    ghi boot); GAP_ANALYSIS **10:31:14Z**; batch closing
    **10:31:15Z** (repo-1-push, ngoài hai cây). **Cả hai session
    trong cửa sổ đều ngắn hơn ngưỡng sống sót 38 s đã biết
    (33 s và 4 s) nên không loại trừ được reboot nào** — một
    reboot tại bất kỳ t nào trong cửa sổ cũng tương thích với
    toàn bộ quan sát (session sinh sau t, hoặc sống sót ≤38 s
    rồi ghi nốt). **Tìm ngoài hai cây trong đúng cửa sổ (lớp
    (c)):** toàn ~/workspace (không prune) chỉ ra đúng 9 file —
    2 file biên O8 (10:23:54Z) + 2 proc log trên + LIMITS gộp +
    cờ done + GAP_ANALYSIS + 2 batch file repo-1-push; /tmp: 0
    file; chrome-userdata: 0 file. **Không file nào trong cửa
    sổ ghi boot_id/uptime; không session nào bắc qua cửa sổ.**
    Kết luận cửa sổ: **MỞ**.
  - **Session U4-dry bắc qua (10:32:49Z → 10:36:12Z):** exec
    parent proc_0f9ff074d81a, birth **10:32:49Z**, last write
    10:36:12Z, nội dung là output tuần tự đầy đủ (tsc 0/0, r6
    PASS, vite build 6,43 s, E4 5/5, preview-engine 354,
    U4 failfast 141/141 ở cuối). Một reboot tại t trong
    (10:32:49Z, 10:36:12Z) sẽ giết session — trừ 38 s "sống sót"
    đã biết: session loại trừ reboot trong **(10:32:49Z,
    10:35:34Z)**. Phần còn lại (10:35:34Z, 10:36:44Z] (tới
    build-loop-log 10:36:44Z) **loại bằng sàn** (t > 10:34:24Z
    → gap2 < 19'07").
  - **LỖ LỚN 60'21" (10:36:44Z → 11:37:05Z): KHÔNG có cửa sổ mở
    thêm — toàn bộ lỗ sau 10:34:24Z đã loại bằng sàn** (mọi t
    trong (10:36:44Z, 10:53:31Z) cho gap2 < 16'47" < 19'07").
    Lỗ chứa reboot #44 (10:53:31Z). **Tìm ngoài hai cây trong
    lỗ (lớp (c)):** toàn ~/workspace (không prune) chỉ ra đúng
    17 file — build-loop-log 10:36:44Z (biên) + **6 file
    proactivity 10:41:55–56Z** (goals/tracking/conversation/
    scheduled-crons/sent/geofences, run 1794652915200) +
    **memory reconciliation 10:48:14–10:49:09Z** (1 file
    reconciliation_attempts + 3 file staging sirun_7f38e3a2…
    (MEMORY.pinned/numbered + reconciliation_state) + 1 file
    reconciliation_state.json ở memory/ + 2 file CURRENT.md
    (archive + hiện tại)) + **2 file memory_get-call
    10:48:19Z + 10:48:35Z** (tool-output của 2 agent) +
    **system_prompt.md 10:54:00Z** (29 s SAU #44 — ghi hệ thống
    sau reboot); /tmp: 0 file; chrome-userdata: 0 file. Tất cả
    đều là mtime (ghi file), không chứa boot_id/uptime, không
    session nào bắc qua — **không thu hẹp khe** (quy tắc N6 §4
    mục 2: khe được bound bằng số học sàn, không bằng mật độ
    quan sát). Dù sao phần lỗ này đã loại bằng sàn nên chúng
    không ảnh hưởng verdict.
  - Kết luận đoạn B: **KHÔNG ĐÓNG** — 1 cửa sổ mở 8'55".
- **Đoạn C: 10:53:31Z → 11:37:14Z (43'43", boot 6ad1ef9e) — ĐÓNG
  bằng đo uptime trực tiếp + probe #32:** `uptime -s` =
  10:53:31Z đo lúc 11:37:09Z (2 lần) chứng minh máy up liên tục
  từ 10:53:31Z; probe #32 11:37:14Z boot 6ad1ef9e ok=2 fail=0.
  Ghi chú phụ (không đổi verdict): poller P8 đợt 113 bắt đầu
  11:37:05Z (file poller-p8.sh/poll-p8.log mtime 11:37:05–08Z,
  sau probe #32 9 s trở xuống — spawn đợt 113 lúc 11:35:51Z)
  nên không phải nguồn xác nhận cho #44.

**Kết luận trung thực: khoảng mù #31 KHÔNG ĐÓNG HOÀN TOÀN.**
Đúng 2 reboot đã chốt giờ (#43 08:53:37Z — giờ do N8 chốt, P6
không đo lại được; #44 10:53:31Z — P6 đo trực tiếp) + có thể tối
đa **1 reboot ẩn** trong mù (trong cửa sổ 8'55" duy nhất; cửa sổ
ngắn hơn 2× sàn nên không thể chứa 2 reboot). Đây là mù thứ sáu
liên tiếp không đóng hoàn toàn sau #24, #26, #28, #29 và #30
(chuỗi đóng #25 → #27 đã cắt từ #28). **Điều kiện duy nhất để
đóng là dữ liệu trong cửa sổ 8'55" — không còn nguồn nào để tìm**
(journal/wtmp volatile chỉ giữ boot hiện tại; không syslog/
kern.log; toàn workspace + /tmp + agents/ + chrome-userdata đã
tìm hết; không session nào bắc qua cửa sổ; không file nào trong
cửa sổ ghi boot_id). P6 không tự quyết — parent/user quyết xem có
chấp nhận "ít nhất 2 reboot, có thể 3" làm mức đóng của mù #31
hay để mở như mù #24/#26/#28/#29/#30.

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 112

Khoảng mù 08:40:59Z → 11:37:14Z (2h56'15") được phủ bởi các luồng
sibling đợt 112 (N1–N8, làm việc tới ~10:36Z; parent đóng đợt tới
10:36:44Z) + spawn đợt 113 (11:35:51Z). Đã đọc lại log thật — **đếm
lại độc lập từ đĩa** (grep trên đúng 89 file *.log có mtime trong
mù #31 — 0 file repo-1, 89 file hidden_files, trừ chrome-userdata):

| Mẫu | Số dòng | Kết luận |
|---|---|---|
| `sóng EPERM vẫn bật` | **0** | Không có sóng đang bật trong log còn tồn tại |
| `CẢNH BÁO` (10-phút wave warning) | **0** | Không có cảnh báo nào |
| `Operation not permitted` | **0** | Không có lỗi EPERM thật nào |
| `sóng EPERM đã tắt` | **10** | Tất cả đều là dòng launcher — **dương tính giả đã biết** |

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5, J8
§2.4, K6 §2.4, L6 §2.4, M4 §2.4, N6 §2.4):** cả 10 dòng đều có
dạng `[timestamp] sóng EPERM đã tắt, khởi động vite` — in khi lần
ghi thử ĐẦU TIÊN thành công ngay (code launcher `waveOff=true` ở
lần write đầu) — in mặc định cả khi không có sóng. Phân bố: N1
run-m1.log 4 dòng + run-n1.log 4 dòng (cùng 4 lần launch vite
09:31:39–09:32:44Z, nội dung trùng nhau trong 2 file log) +
N8 round112-n8-o8.log 2 dòng (10:21:05Z + 10:23:01Z, O8 WebKit).
Bằng chứng phân biệt: **0 dòng "sóng EPERM vẫn bật sau …s chờ"**
và **0 dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"** trong toàn bộ
89 log; **0 lần "Operation not permitted" thật**. Kiểm tra thêm:
chuỗi `EPERM` xuất hiện trong 4 file — 10 dòng launcher trên +
6 dòng tên test `hasEperm` trong suites.log (không phải sóng).
Đếm này là whole-file (không chỉ dòng trong cửa sổ mù) nên còn
mạnh hơn: không có dòng sóng thật nào trong toàn bộ nội dung 89
file.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng lần này, như mù #29/#30, **có lỗ quan sát
  về reboot** (1 cửa sổ mở 8'55", §2.3) nên một sóng ngắn trong
  cửa sổ đó cũng không có nhân chứng vite nào. Ngoài cửa sổ đó:
  vite khởi động thành công ngay ở 09:31–09:32Z (N1, 4 lần),
  10:21–10:23Z (N8 O8, 2 lần). Một sóng dài ~16' kiểu R7 không
  thể lọt vào cửa sổ 8'55" mà không để lại dấu — khả năng thấp,
  không loại trừ tuyệt đối được.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~71h26'** trước
  probe #32 (tính từ cuối sóng ~12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #32 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 11:37:14Z ghi được.

### 2.5 Phân phối gap cập nhật — CERT n=23 (mới) + dải chứng nhận CÒN DÙNG ĐƯỢC

Gap mới **#42 → #43 = 48'27" ĐƯỢC CHỨNG NHẬN**: khoảng
(08:05:10Z, 08:53:37Z) không chứa cửa sổ mở nào — đoạn C mù #30
đóng bằng đo uptime trực tiếp (N6 §2.3) + đoạn A mù #31 đóng
bằng poller N8 + sàn đuôi 2'22" (§2.3). Đây là chứng nhận theo
khoảng (interval), không theo nhãn mù: N6 không chứng nhận
#40 → #41 / #41 → #42 vì khoảng của chúng CHỨA cửa sổ mở; khoảng
của #42 → #43 thì không chứa cửa sổ mở nào. Nếu parent không
đồng ý chứng nhận xuyên mù thì hạ #42 → #43 về cận trên và CERT
về n=22 — P6 ghi rõ cơ sở để parent quyết. Gap #43 → #44 =
1h59'54" là **cận trên** (khoảng chứa cửa sổ mở 8'55").
Tập gap đơn đã chứng nhận **n=22 → n=23**; toàn chuỗi tăng n=36 →
**n=38** (thêm 2 gap). Tính lại từ bảng J8 §2.5.3 + 2 gap K6 +
2 gap L6 + 2 gap M4 + 2 gap N6 + 2 gap mới, bằng code (percentile
tuyến tính, index = p·(n−1) — cùng phương pháp J8/K6/L6/L9/M4/N6).
**Kiểm tra chéo: tính lại CERT n=22 ra đúng 100% số N6** (trung
bình 1h52'05", trung vị 1h59'16", p10 1h08'41", p90 2h57'18", sd
43'58") **và tính lại toàn chuỗi n=36 ra đúng 100% số N6**
(trung bình 1h57'52", trung vị 1h58'30", p10 41'30", p90 3h04'54",
sd 1h03'01") — nên số mới dưới đây đáng tin ở cùng mức (script
`recount-p6.py`, output `recount-p6.txt`):

| Thống kê | Toàn bộ n=38 | Chỉ gap đơn đã chứng nhận n=23 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, CẬN TRÊN)** | **3h14'08" (#26 → #27)** |
| Trung bình | 1h56'06" | 1h49'19" |
| Trung vị | 1h58'30" | 1h58'47" |
| Độ lệch chuẩn (mẫu) | 1h02'19" (CV 0,53) | 44'58" |
| p10 | 43'49" | 52'26" |
| p90 | 3h04'46" | 2h53'15" |

Đọc thêm: 20/38 gap (53%) nằm trong 90'–150'; 6 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
**Dải chứng nhận [19'07", 3h14'08"] đứng vững trên tập gap đơn
đã chứng nhận (n=23)** — min/max không đổi (gap mới 48'27" nằm
giữa). Cảnh báo J8 vẫn đứng: dải này đã bị vượt 2 lần bởi các gap
chưa chứng nhận (#11 → #12 4h10'33",
#33 → #34 5h43'18") — nó là phát biểu về các gap đơn đã biết,
không phải bảo đảm. **Không đưa dự báo điểm cho #45 hay reboot
nào sau đó** — chỉ dải cơ học áp lên #44 (10:53:31Z):
**[11:12:38Z, 14:07:39Z]**; probe #32 (11:37:14Z, boot #44) đã
loại trừ phần trước 11:37:14Z → dải hiệu dụng
**[11:37:14Z, 14:07:39Z]**; p10–p90 toàn chuỗi →
[11:37:19Z, 13:58:17Z].

### 2.6 Reboot #44 (10:53:31Z) — thuộc mù #31, đã xác nhận ở §2.2

- `uptime -s` = **2026-11-14 10:53:31Z**, đo **2 lần** (11:37:09Z,
  giống nhau từng giây); btime 1794653611; boot_id
  `6ad1ef9e-3e7f-4c9f-852b-7c64c156c3c0`; `who -b` Nov 14 10:53;
  journal first entry 10:53:42Z; wtmp begins 10:53:42Z; systemd
  PID 1 START 10:53:41.
- Reboot này xảy ra sau khi parent đóng đợt 112 (build-loop-log
  10:36:44Z) và trước khi spawn đợt 113 (11:35:51Z) — không cắt
  ngang luồng đợt 112 nào đang chạy (đợt 112 đã xong hết lúc
  10:29:29Z; parent chỉ còn kiểm chứng + đóng đợt, xong 10:36:44Z).
  Nó cắt khoảng idle 10:36:44Z → 11:35:51Z của parent.
- Gap #43 → #44 = **1h59'54"** (08:53:37Z → 10:53:31Z) — nằm trong
  dải chứng nhận nhưng **CHƯA đưa vào tập gap đơn đã chứng nhận**:
  nó thuộc mù #31 chưa đóng, chờ lượt sau đóng mù #31 mới xét.
  Số thứ tự #44 là TẠM THỜI (kế thừa từ #43 và cửa sổ mở 8'55").
- Tốc độ reboot cập nhật: **44 reboot đã chốt giờ / 86,59h** (từ
  ~20:18:10Z 10/11 tới 10:53:31Z 14/11) = **1 lần / 118,1'
  (1,97h)**; nếu mù #29 chứa thêm 1, mù #30 chứa thêm tối đa 2
  và mù #31 chứa thêm tối đa 1 reboot ẩn thì 48 lần / 86,59h =
  1 lần / 108,2'.

### 2.7 Quét writeFileSync (snapshot 11:46:30–11:46:46Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round113-p6`. Chạy trọn vẹn (16 s, SCAN-END có đủ). Kết quả
NEWSTD khớp 100% scan-meta.txt (tính lại từ file wfs-*.txt +
files-*.bin gốc).

- Chuẩn mới: **637 dòng / 187 file** (phạm vi 2827 file).
  Lần 18 (N6): 613 dòng / 182 file (phạm vi 2814 file).
- R7b (đối chiếu): **662 dòng / 204 file**. Lần 18: 638 / 199.
- Copies: **25 dòng / 17 file** — y hệt lần 18, 17, J8, I7, H7, G8
  và F7.
- Đối chiếu chéo 637+25=662=R7b, **chênh 0 — lần thứ mười chín
  liên tiếp**. Tổng hit trên cả 3 bảng: 637+662+25 = **1.324 dòng**.
- **+24 dòng / +5 file so với lần 18, giải thích đúng hết bằng
  diff hit list** (đã đọc nội dung từng dòng mới; không có dòng
  nào tăng trong file cũ ngoại trừ GAP_ANALYSIS +1, không file
  nào giảm):
  - +1 `PHASE9_GAP_ANALYSIS.md` (20 → 21: parent thêm dòng tóm
    tắt N6 đợt 112 vào gap §41 lúc 10:31:14Z — trích dẫn
    "writeFileSync" trong văn bản, đã đọc)
  - +1 `apps/web/scripts/probe112n1.mjs` (N1 đợt 112 — dòng 212:
    `fs.writeFileSync(waveProbeFile, "x")`, lệnh ghi probe sóng
    EPERM thật trong script đo, không phải production; file hạ
    cánh 09:14:14Z, sau scan lần 18)
  - +1 `apps/web/scripts/probe113p1.mjs` (P1 đợt 113 — dòng 215:
    cùng mẫu wave-probe "x"; mtime 11:41:25Z)
  - +7 `apps/web/scripts/probe113p3-frame-parity.mjs` (P3 đợt 113
    — script probe frame-parity: ghi vite config tạm + kết quả/
    log vào scratch; mtime 11:38:29Z)
  - +8 `apps/web/scripts/probe113p5-frame-parity.mjs` (P5 đợt 113
    — cùng mẫu P3; mtime 11:41:01Z)
  - +6 `docs/PHASE9_ROUND112_N6_EPERM_LIMITS.md` (file LIMITS của
    chính N6 — 6 hit đều là trích dẫn "writeFileSync" trong văn
    bản, đã đọc nội dung từng dòng)
  - Tổng: 1+1+1+7+8+6 = **24** ✓, 5 file mới có hit ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets). Đếm lại trực tiếp sau scan: probe112n1 đúng 1,
    probe113p1 đúng 1, probe113p3 đúng 7, probe113p5 đúng 8,
    N6 LIMITS đúng 6, GAP_ANALYSIS đúng 21.
- **0 file biến mất khỏi hit list.**
- Scope: **+13 file ròng / −0 file** so với lần 18 (2827 =
  2814+13−0 ✓): 13 file mới = 5 file hit trên + 8 file không
  hit (2 script recount/lag — `benchmarks/render/n2_recount_112.py`,
  `benchmarks/render/p2_lag_113.py` — + 6 file LIMITS —
  `docs/PHASE9_ROUND112_LIMITS.md`, N1/N2/N3/N5, `docs/
  PHASE9_ROUND113_P7_INFRA_LIMITS.md`). Comm hai chiều khớp đúng
  (13 = 5+8 ✓).
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt lần 18 — xem files-copies.txt;
  diff wfs-copies.txt với lần 18: IDENTICAL).
- **Race trong cửa sổ scan (ghi rõ, không giấu):** các sibling
  đợt 113 vẫn đang chạy; 3 file probe113p1/p3/p5 đã hạ cánh trước
  khi scan bắt đầu (mtime 11:38:29Z / 11:41:01Z / 11:41:25Z, scan
  bắt đầu 11:46:30Z — đếm lại trực tiếp sau scan khớp số trong
  wfs-newstd.txt — không hỏng số đếm). Sibling đợt 113 vẫn đang
  chạy nên lượt sau cần đối chiếu lại.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2827 file), NUL-safe, chạy từ trong repo-1 — chỉ đúng 2 hit
trong code (đếm lại độc lập, không tin mù file cũ; các hit còn
lại đều nằm trong file `.md` trích dẫn code):

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z — kiểm lại trực tiếp
lượt này). Kết luận giữ nguyên như M4/N6: **2 async call site, cả
2 đều thuộc helper retry đã biết với cùng hợp đồng EPERM-only +
verify byte — không phải write async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

2 mẫu MemAvailable của lượt: **506.972 kB (11:37:14Z, lúc probe
#32) / 2.915.720 kB (11:47:37Z)** — ~0,49 GB rồi ~2,85 GB.
**Dao động mạnh trong 10 phút** (từ ~0,5 GB lên ~2,85 GB — có
thể do tiến trình sibling/vite giải phóng sau khi xong; P6 không
đo được nguyên nhân chính xác, chỉ ghi số). Max RAM biết được
**trong** mù #31 từ log sibling: **1182 MB** (N8 verify start,
10:16:39Z, boot #43) = **19% ngưỡng guard 6144 MB** — chỉ 1 mẫu
RAMavail tìm thấy trong toàn bộ 89 log của mù #31 (grep cả
`RAMavail`/`MemAvailable`/`load1` — không có mẫu nào khác); max
thật có thể cao hơn mẫu này, nhưng không có nguồn nào khác.
Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3 mục 7 (chỉ thử
lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥ 6 GB mới thử
lại). Birefnet-general vẫn **0 lần chạy thành công** trong gói.
Mẫu RAM lúc probe (0,49 GB) là mẫu thấp nhất trong chuỗi N6/P6
(737.988 / 741.604 kB ở N6) — máy chưa từng tiến gần ngưỡng guard
trong mù #31.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Lỗ mù phải kiểm chứng 4 lớp trước khi tuyên bố (L6 §4 mục 1,
   M4 §4 mục 1, N6 §4 mục 1, áp dụng lượt này — xem §2.3):** (a)
   mtime find trong hai cây để xác định lỗ; (b) **đọc NỘI DUNG**
   các file log append chạm biên lỗ (poll-n8.log — 20 mục, boot +
   uptime đơn điệu; suites log — boot tươi đầu/cuối; O8 log —
   boot tươi đầu/cuối; exec-log U4-dry — output tuần tự đầy đủ);
   (c) **tìm ngoài hai cây**: find toàn ~/workspace (không prune)
   + /tmp + ~/workspace/agents/ + chrome-userdata trong đúng cửa
   sổ lỗ; (d) **số học sàn** để bound khe không loại trừ được
   (1 cửa sổ: 8'55"). **Quy tắc giữ nguyên: mọi kết luận "lỗ"
   phải qua cả 4 lớp, và phải ghi rõ khe còn lại sau mỗi lớp.**
2. **Dấu boot TƯƠI (đọc /proc tại thời điểm ghi) miễn nhiễm với lỗ
   "tiến trình cũ sống sót" (mới, lượt này — xem §2.3):** suites
   log và O8 log đọc `boot_id` bằng command substitution NGAY
   lúc echo (đã đọc code round112-n8-verify.sh:5,32 và
   round112-n8-o8.sh:15,24) — sau reboot, /proc cho boot_id mới
   nên dấu này chứng minh không reboot trước thời điểm đó, bất kể
   tiến trình có sống sót hay không. Ngược lại, một session chỉ
   ghi file (không đọc boot) thì vẫn phải trừ 38 s sống sót ở
   đuôi. Khi đánh giá session, phân biệt rõ: session có đọc boot
   tươi trong nội dung thì đóng tới đúng thời điểm đọc; session
   chỉ ghi file thì trừ 38 s.
3. **Quan sát ngoài cây KHÔNG tự động thu hẹp khe (N6 §4 mục 2,
   áp dụng lượt này — xem §2.3):** proactivity 10:41:55Z +
   memory reconciliation 10:48:14–10:49:09Z + system_prompt.md
   10:54:00Z nằm trong lỗ lớn nhưng chỉ là mtime — khe được
   bound bằng số học sàn, không bằng mật độ quan sát. Chỉ quan
   sát nào **xác định boot** (boot_id/uptime trong nội dung, hoặc
   session bắc qua) mới thu hẹp được khe. Đừng đếm "có file trong
   lỗ" thành "lỗ đã lấp".
4. **`find -newerBt` với chuỗi thời gian là SAI (N6 §4 mục 3, nhắc
   lại — lượt này KHÔNG mắc):** dùng `stat -c '%W %Y'` lấy
   birth/mtime epoch rồi so sánh bằng code (P6 đã làm đúng: 52
   proc log mtime trong mù, birth tính bằng stat %W; 2 session
   ngắn 33 s / 4 s trong cửa sổ, không session nào bắc qua).
5. **`status` STALE chỉ ghi 1 dòng DEAD cho mỗi heartbeat (N6 §4
   mục 4, xác nhận lại lượt này — xem §1):** log tăng 86 → 88
   (chỉ +2: boot-changed + probe) vì dòng cuối đã là DEAD cho
   cùng heartbeat #31. Khi đếm dòng log lượt sau phải tính cả
   cơ chế dedupe này (baseline mới là **88**, không phải 89).
6. **Exit code lấy từ `$?` trực tiếp, không qua pipe (N6 §4 mục
   5, áp dụng lượt này — xem §1):** cả 3 lệnh checklist ghi ra
   file riêng rồi đọc `$?`; probe-notes.txt (qua `| tee`) chỉ
   chứa phần xác minh boot, không chứa exit code. Quy định
   script: status 0 ALIVE / 1 STALE-DEAD / 2 never-run; once 0.
7. **Session exec bắc qua là kẹp mạnh nhất sau poller (N6 §4 mục
   6, áp dụng lượt này — xem §2.3):** session U4-dry birth
   10:32:49Z → last write 10:36:12Z với output tuần tự đầy đủ đã
   loại trừ reboot trong (10:32:49Z, 10:35:34Z) — chỉ trừ 38 s
   "sống sót" đã biết ở đuôi. **Bổ sung lượt này:** session ngắn
   hơn 38 s (33 s, 4 s) không loại trừ được gì — đừng tính session
   ngắn thành kẹp.
8. **Chứng nhận gap theo KHOẢNG, không theo nhãn mù (mới, lượt
   này — xem §2.5):** #42 → #43 được chứng nhận vì khoảng
   (08:05:10Z, 08:53:37Z) không chứa cửa sổ mở nào, dù hai đầu
   mút thuộc hai mù chưa đóng khác nhau (đoạn C mù #30 đóng +
   đoạn A mù #31 đóng). N6 không chứng nhận #40 → #41 / #41 →
   #42 vì khoảng của chúng CHỨA cửa sổ mở — tiêu chí là khoảng,
   không phải nhãn. Ghi rõ cơ sở để parent quyết (nếu không đồng
   ý thì hạ về cận trên, CERT về n=22).
9. **`ps aux` / `ps -eo lstart` là nguồn độc lập cho giờ reboot
   (L6 §4 mục 2, M4 §4 mục 3, N6 §4 mục 8, áp dụng lượt này —
   xem §2.2):** systemd PID 1 START 10:53:41, hatch 10:53:42,
   hatch-execd 10:53:59 — khớp `uptime -s` 10:53:31Z ở mức phút.
10. **Chốt giờ reboot bằng `uptime -s` trên boot mới, đo 2 lần —
    KHÔNG dùng mtime file cuối của boot cũ** (K6 §4 mục 2, nhắc
    lại): lần này #44 chốt bằng 2 lần đo trực tiếp + btime;
    #43 giữ giờ N8 chốt vì journal/wtmp của boot đó đã mất — ghi
    rõ nguồn gốc giờ, đừng giả vờ đo lại được.
11. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
    reboot** (J8 §4 mục 1, nhắc lại): đừng bao giờ đếm reboot chỉ
    bằng `grep "boot changed"` trên log probe; chuỗi đánh số chính
    thức nằm trong các file LIMITS EPERM theo đợt.
12. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (J8 §4 mục 2, nhắc
    lại): dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn
    đã chứng nhận (n=23) sau lượt này; trên toàn chuỗi vẫn có 2
    gap vượt (đều là cận trên). **Nằm trong dải không đồng nghĩa
    được chứng nhận** (M4 §4 mục 6, nhắc lại): gap #43 → #44
    (1h59'54") nằm trong dải nhưng vẫn là cận trên vì mù #31 chưa
    đóng; ngược lại #42 → #43 (48'27") được chứng nhận vì khoảng
    đã đóng kín.
13. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
    bằng sàn** (H7 §4 mục 1, nhắc lại + áp dụng mới): sàn 19'07"
    vẫn đứng sau lượt này, nhưng mù #31 KHÔNG đóng được chính vì
    cửa sổ 8'55" chỉ còn sàn làm chỗ dựa ở hai biên — sàn loại trừ
    được phần lớn lỗ nhưng không loại trừ được 8'55" còn lại. Sàn
    là công cụ bound, không phải bằng chứng đóng.
14. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
    poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ lớn, toàn
    ~/workspace ngoài hai cây chỉ có runtime-internal writes
    (proactivity + memory reconciliation + system_prompt) — không
    session nào bắc qua, không boot_id nào; parent idle
    10:36:44–11:35:51Z không để lại dấu nào khác; poller N8 đã
    exit lúc 10:15:01Z nên không còn observer thường trực nào sau
    đó. **Lưu ý mới lượt này:** agent N8 vẫn "sống" (viết LIMITS
    10:28:38Z) sau khi VM reboot giả định — nhưng agent chạy ở
    runtime/cell, không phải trên VM, nên sự sống của agent
    KHÔNG chứng minh VM không reboot; chỉ exec session trên VM
    mới có giá trị kẹp.
15. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
    4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
    vị trí đã biết trước khi kết luận.
16. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
    §4 mục 8, nhắc lại):** lượt này 10 dòng "đã tắt" trong mù #31
    đều là dương tính giả (launcher); 0 dòng "vẫn bật", 0
    "Operation not permitted" thật. Đếm whole-file (không chỉ
    dòng trong cửa sổ) nên 0 còn mạnh hơn.
17. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9 / J8 §4 mục 9
    / L6 §4 mục 10 / M4 §4 mục 11 / N6 §4 mục 16): lượt này probe
    + quét xong là ghi LIMITS/ batch ngay, không đợi luồng khác —
    reboot #44 (10:53:31Z) đã xảy ra giữa đợt 112 và đợt 113; lượt
    sau có thể bị reboot giết bất cứ lúc nào.
18. **Đếm *.log sóng EPERM phải quét cả hai cây** (J8 §4 mục 10,
    nhắc lại): lần này 89 file đều nằm ở hidden_files (0 file
    repo-1). Quét một cây sẽ kết luận sai là "không có log".
19. **Scan writeFileSync có thể bị reboot cắt ngang giữa chừng**
    (L6 §4 mục 12, nhắc lại): lần này scan chạy trọn vẹn 16 s
    trên boot mới, SCAN-END có đủ; kiểm tra SCAN-END trước khi
    tin scan-meta.txt.
20. **Đếm mốc mtime (L9 §6.1, áp dụng lượt này):** mù #31 có
    **335 mốc mtime** (độ chính xác đầy đủ) nhưng chỉ **224 giây
    nguyên phân biệt** — ghi cả hai số, không ghi một số mập mờ.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #31 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** 1 cửa sổ mở — 8'55" (10:23:54Z → 10:32:49Z). Số
   reboot trong mù: 2 đã chốt (#43 08:53:37Z — giờ do N8 chốt;
   #44 10:53:31Z — P6 đo trực tiếp) + có thể tối đa 1 ẩn.
   **Số thứ tự #43/#44 vẫn TẠM THỜI** — parent/user quyết xem có
   chấp nhận "ít nhất 2 reboot, có thể 3" làm mức đóng của mù #31
   hay để mở như mù #24/#26/#28/#29/#30. P6 không tự quyết. Gap
   #43 → #44 = 1h59'54" KHÔNG được chứng nhận (cận trên); gap
   #42 → #43 = 48'27" ĐƯỢC chứng nhận (mới — xem §2.5, chờ
   parent xác nhận cách chứng nhận xuyên mù).
2. **Khoảng mù #30 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (N6 §5 mục
   1): 3 cửa sổ mở, tổng 30'50"; số reboot trong mù: 2 đã chốt +
   có thể tối đa 2 ẩn. Số thứ tự #41/#42 vẫn TẠM THỜI. Không còn
   dữ liệu nào để thu hẹp thêm — parent/user quyết. P6 không tự
   quyết. Probe #32 không đóng được mù #30 hồi tố (chỉ chứng
   nhận được gap #42 → #43 qua đoạn C đã đóng của nó).
3. **Khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (M4 §5 mục
   1): lỗ thật 14'31" theo M4 / 13'33" theo M9 birth-time, khe
   79 s không loại trừ được; số reboot trong mù: 2 đã chốt + có
   thể 1 ẩn. Số thứ tự #39/#40 vẫn TẠM THỜI. Không còn dữ liệu
   nào để thu hẹp thêm — parent/user quyết. P6 không tự quyết.
   Probe #32 không đóng được mù #29 hồi tố.
4. **Khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục
   1): lỗ 23'39" (02:01:06Z → 02:24:45Z), khe 4'32" không loại
   trừ được; số reboot trong mù: 2 đã chốt + có thể 1 ẩn. Số thứ
   tự #37/#38 vẫn TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm
   — parent/user quyết. P6 không tự quyết. Probe #32 không đóng
   được mù #28 hồi tố.
5. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
   1): lỗ 1h13'58" (19:20:19Z → 20:34:17Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#34), có thể nhiều hơn
   — không xác định được; số thứ tự #34 là TẠM THỜI. Không còn
   dữ liệu nào để thu hẹp thêm — parent/user quyết. P6 không tự
   quyết.
6. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1): lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#32), có thể nhiều hơn
   — không xác định được; số thứ tự #32/#33/#34/#35/#36/#37/#38/
   #39/#40/#41/#42/#43/#44 là TẠM THỜI. Không còn dữ liệu nào để
   thu hẹp thêm — parent/user quyết. P6 không tự quyết.
7. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
   gian. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết. P6 không tự quyết.
8. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
   §6 mục 3): cửa sổ lý thuyết ≤78 s với sàn 19'07". P6 không thử
   lại, không tự quyết — parent/user quyết giữ "đóng", "đóng có
   điều kiện", hay mở lại. **Khoảng mù #23 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận G8). **Khoảng mù #25 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận I7). **Khoảng mù #27 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận K6). **Khoảng mù #28 nay KHÔNG ĐÓNG HOÀN
   TOÀN** (L6). **Khoảng mù #29 nay KHÔNG ĐÓNG HOÀN TOÀN** (M4).
   **Khoảng mù #30 nay KHÔNG ĐÓNG HOÀN TOÀN** (N6).
   **Khoảng mù #31 nay KHÔNG ĐÓNG HOÀN TOÀN** (mới, lượt này).
9. **Khoảng mù #32 BẮT ĐẦU từ 11:37:14Z** (probe #32) — lượt sau
   (probe #33) đối chiếu từ mốc này, trên boot 6ad1ef9e (#44,
   từ 10:53:31Z, số thứ tự tạm thời). Dải cơ học cho #45 từ #44
   là [11:12:38Z, 14:07:39Z] — hiệu dụng [11:37:14Z, 14:07:39Z]
   sau probe #32; là phép áp dải máy móc, không phải dự báo.
   Baseline log probe cho lượt sau là **88 dòng** (không phải 86
   hay 89 — xem §1).
10. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
    mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
    LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
    8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
    2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
    mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3,
    F7 §6 mục 4, G8 §6 mục 5, H7 §6 mục 5, I7 §5 mục 6, J8 §5 mục
    5, K6 §5 mục 6, L6 §5 mục 7, M4 §5 mục 8, N6 §5 mục 9): lệnh
    cron chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh
    once` (vài giây, không giữ tiến trình nền). P6 KHÔNG tự tạo,
    KHÔNG start loop nền. Bằng chứng mới: mù #31 không đóng được
    LÀ VÌ poller N8 đã exit lúc 10:15:01Z và không còn observer
    thường trực nào sau đó — cùng mẫu với mù #28 (poller K9 exit
    01:27:13Z), mù #29 (poller L9 exit 04:12:24Z) và mù #30
    (poller M9 exit 06:49:11Z). Lần này cửa sổ mở chỉ 8'55" (nhỏ
    nhất trong chuỗi mù không đóng) vì các dấu boot tươi của N8
    kéo dài tới 10:23:54Z.
11. **Mô hình dự báo điểm ĐÃ BỎ — KHÔNG ĐỔI** (J8 §2.5, §5 mục 6):
    không đưa dự báo điểm cho #45 hay reboot nào sau đó; thay bằng
    dải chứng nhận [19'07", 3h14'08"] + p10–p90 thực nghiệm + đo
    uptime trực tiếp + poller.
12. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
    và các lượt sau; log tăng đúng 2 dòng checklist, 86 → 88 —
    dòng DEAD bị dedupe chặn, xem §1 — không thêm dòng lạ mới
    trong lượt này.)
13. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
    đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
    được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
    cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
14. **VM reboot ~1 lần / 1h58'06"** (44 lần đã chốt giờ / 86,59h từ
    ~20:18:10Z 10/11 tới 10:53:31Z 14/11, số thứ tự tạm thời — xem
    §2.2 + §2.6; nếu mù #29 chứa thêm 1, mù #30 chứa thêm tối đa 2
    và mù #31 chứa thêm tối đa 1 reboot ẩn thì 48 lần / 86,59h =
    1 lần / 108,2'): mọi probe nền đều chết theo reboot; v2 chỉ
    đảm bảo cái chết được ghi nhận + lượt sau hồi phục bằng 1 mẫu
    mới.
15. **Birefnet: KHÔNG chạy trong lượt này** — RAM 2 mẫu MemAvailable
    **506.972 / 2.915.720 kB** (~0,49 / ~2,85 GB); max trong mù #31
    từ log sibling **1182 MB** = 19% guard 6144 MB. Birefnet-general
    vẫn 0 lần chạy thành công trong gói.
16. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
17. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
18. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    P6 không thử lại nguồn nào, theo đúng lệnh.
19. **Đính chính nhỏ (mới, lượt này):** (a) Log probe v2 tăng 86 →
    88 (chỉ +2, không phải +3) vì dòng DEAD của `status` bị dedupe
    chặn — xác nhận lại cơ chế N6 §4 mục 4; baseline lượt sau là
    88 dòng. (b) Gap #42 → #43 = 48'27" ĐƯỢC CHỨNG NHẬN theo
    khoảng (đoạn C mù #30 + đoạn A mù #31 đều đóng) — lần đầu
    chứng nhận kể từ L6; chờ parent xác nhận cách chứng nhận xuyên
    mù (xem §2.5). (c) Dải cơ học cho #45 phải cắt phần trước
    probe #32: hiệu dụng [11:37:14Z, 14:07:39Z], không phải
    [11:12:38Z, 14:07:39Z]. (d) RAM lúc probe chỉ ~0,49 GB — mẫu
    thấp nhất trong chuỗi N6/P6 — nhưng 10 phút sau đã lên ~2,85
    GB; RAM dao động mạnh, đừng lấy 1 mẫu làm mức RAM của máy.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND113_P6_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round113-p6-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: entry tồn tại và là text). File này **52.726 byte >
37.768 byte** — cần `ENABLE_PRIVSEP=0` khi push.

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round113-p6/`
(probe-notes.txt, p6-progress.log, status1.txt, once.txt, status2.txt,
scan-meta.txt, scan-wfs.sh, scan-wfs-run.log, files-newstd.bin,
wfs-newstd.txt, files-r7b.bin, wfs-r7b.txt, files-copies.txt,
wfs-copies.txt, recount-p6.py, recount-p6.txt, blind31-repo.txt,
blind31-hf.txt, blind31-gaps.py, blind31-gaps.txt, blind31-sessions.txt,
blind31-births.txt, blind31-logfiles.txt, blind31-logfiles-hf.txt,
blind31-logfiles-repo.txt, blind31-window-outside.txt) + log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

Tổng chờ push: chưa đếm lại trong lượt này (sibling đợt 113 vẫn
đang chạy; parent đếm lại khi đợt 113 đóng băng — lũy kế đợt
111+112 theo kiểm chứng parent 10:36Z 14/11: 19 batch / 42 entry /
37 file duy nhất + 1 file oversize).
