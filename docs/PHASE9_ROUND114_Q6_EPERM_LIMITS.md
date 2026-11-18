# PHASE9 ROUND114 Q6 — EPERM: probe #33 + mù #32 ĐÓNG HOÀN TOÀN + mù #31 vẫn mở 8'55"

> Luồng Q6, đợt 114 vòng lặp Phase 9 VCut Studio (lượt cron 21:35 +07,
> 14/11/2026; làm việc 14:43Z → 15:0xZ 14/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + xác định reboot
> #45 trong mù #32 kể từ probe #32 (11:37:14Z) + thử đóng cửa sổ mở
> 8'55" của mù #31 bằng nguồn log còn lại + quét sóng EPERM +
> quét writeFileSync lần thứ 20 + ghi RAM (birefnet: KHÔNG chạy —
> vẫn dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round114-q6/prereg-q6.md (định nghĩa probe #33, mốc đối
> chiếu, tiêu chí đóng mù #32, cách xử lý cửa sổ 8'55" của mù #31).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #31, mù #30, mù #29, mù #28,
> mù #26, mù #24, mù #21, hay reboot #16** — chỉ báo cáo "không thấy"
> vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (14:49:02–14:49:23Z):**
  `status` báo **DEAD/STALE** (heartbeat age 11.529 s, last #32
  11:37:14Z, boot 6ad1ef9e, exit 1 theo quy định script — exit lấy
  từ `$?` trực tiếp, không qua pipe, xem §1); `once` ngay sau đó là
  **probe #33, boot cd4cac0b (ĐỔI), ok=2 fail=0**, exit 0; `status`
  chạy lại **ALIVE** (age 0 s, n=33), exit 0. Log v2 tăng đúng **3
  dòng** checklist (88 → 91): dòng DEAD mới cho heartbeat #32 +
  dòng `boot changed` + dòng probe #33 — **khác P6 (+2) vì lượt này
  chưa có dòng DEAD nào cho #32** (dòng DEAD cuối trước đó là cho
  #31, 08:56:42Z); prereg §1 đã dự báo đúng +3 trước khi đo.
  Heartbeat nay n=33, ts 14:49:23Z, boot cd4cac0b.
- **Khoảng mù #32: 11:37:14Z → 14:49:23Z (3h12'09") — ĐÓNG HOÀN TOÀN
  (mới, lượt này).** Đoạn A (tới #45) **ĐÓNG** bằng đo uptime trực
  tiếp của P6 (11:37:09Z) + poller P8 MỘT tiến trình duy nhất (pid
  12630, 18 poll mỗi 300 s, 11:37:08Z → 13:02:10Z) + session waiter
  độc lập (birth 11:37:30Z → mtime 13:02:17Z, "poller exited after
  ~85 min") + sàn đuôi (xem §2.3). Đoạn B (sau #45) **ĐÓNG** bằng
  đo uptime trực tiếp ×2 lúc 14:49:02Z (= 13:17:42Z) + probe #33 +
  dấu boot tươi của P8/Q7 (13:17:42Z → 14:48:39Z). Không còn cửa
  sổ mở nào.
- **Gap #44 → #45 = 2h24'11" — ĐƯỢC CHỨNG NHẬN (mới, lượt này).**
  Khoảng (10:53:31Z, 13:17:42Z) không chứa cửa sổ mở nào (mù #32
  đã đóng kín — chứng nhận theo khoảng như #42 → #43, P6 §2.5).
  Tập gap đơn đã chứng nhận tăng **n=23 → n=24**; toàn chuỗi
  **n=38 → n=39** (xem §2.5). Dải chứng nhận [19'07", 3h14'08"]
  không đổi (gap mới nằm giữa).
- **Cửa sổ mở 8'55" của mù #31 (10:23:54Z → 10:32:49Z): KHÔNG ĐÓNG
  ĐƯỢC — đã thử hết nguồn còn lại.** Đọc lại nội dung 2 proc log
  trong cửa sổ: không có boot_id/uptime (grep output + đếm batch);
  quét lại toàn ~/workspace trong đúng cửa sổ: **8 file** (P6 đếm
  9 — file thứ 9 là GAP_ANALYSIS, đã bị ghi đè sau cửa sổ, mtime
  dời sang 14:18:34Z, nội dung 10:31:14 đã mất); /tmp 0 file;
  chrome-userdata 0 file (thư mục không tồn tại ở hai vị trí đã
  kiểm); **0 session bắc qua cửa sổ** (U4-dry sinh đúng tại mép
  phải 10:32:49Z, không phủ trong cửa sổ); journal chỉ giữ boot
  #45; không có /var/log/syslog hay kern.log; log sibling đợt 113
  không có dấu boot tươi nào với timestamp trong cửa sổ. **Mù #31
  giữ nguyên KHÔNG ĐÓNG HOÀN TOÀN — 2 reboot đã chốt + tối đa 1 ẩn.**
  Không còn nguồn nào để thử (xem §2.6).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn
  bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật
  trong 98 file *.log có mtime trong mù #32 (0 file repo-1,
  98 file hidden_files — đếm lại độc lập từ đĩa); 15 dòng "sóng
  EPERM đã tắt" đều là **dương tính giả đã biết** (dòng launcher:
  P1 run-p1.log 11× 11:46–12:40Z, P7 o8-chromium 1×, P8 o8.log
  3× 13:18–14:07Z). Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) —
  **~74h38'** trước probe #33. EPERM vẫn KHÔNG được tuyên bố là
  đã hết.
- **Quét writeFileSync lần 20: 656 dòng / 191 file** (phạm vi
  2842 file); R7b đối chiếu 681 dòng / 208 file; copies 25 dòng /
  17 file — y hệt lần 19; đối chiếu chéo 656+25=681=R7b, **chênh 0
  — lần thứ hai mươi liên tiếp**. +19 dòng / +4 file so với lần
  19, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí, cả hai trong helper retry
  đã biết** — 0 stray; mtime 2 helper không đổi từ 10/11.
- **Dải chứng nhận [19'07", 3h14'08"] CÒN DÙNG ĐƯỢC** (tập gap đơn
  đã chứng nhận nay n=24 — thêm #44 → #45). Toàn chuỗi n=39:
  trung bình 1h56'49", trung vị 1h58'47" — xem §2.5.
- RAM: 2 mẫu MemAvailable của lượt: **828.412 kB (14:49:02Z, lúc
  probe #33) / 1.860.444 kB (15:00:06Z, lúc scan xong)** — ~0,81 GB
  rồi ~1,82 GB. Max RAM biết được **trong** mù #32 từ log sibling:
  **2.872.556 kB ≈ 2,74 GB** (P1 dial, 11:50:25Z) = 45% ngưỡng
  guard — vẫn xa guard. Birefnet KHÔNG chạy, vẫn 0 lần chạy thành
  công trong gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ parent/user
  quyết); cron riêng 10 phút vẫn chờ user quyết.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 14:49:02Z | boot_id `cd4cac0b-17a6-408d-8c4e-be163f96dc61`; `who -b` Nov 14 13:17; `uptime -s` **2026-11-14 13:17:42Z** (2 lần, giống nhau từng giây); btime **1794662262 = 2026-11-14T13:17:42Z**; journal chỉ 1 boot (cd4cac0b, first entry 13:17:53Z, last 14:48:25Z lúc kiểm tra); `last -x reboot` 13:17 still running; wtmp bắt đầu 13:17:53Z; `ps` systemd PID 1 START 13:17:52, hatch 13:17:53, hatch-execd 13:18:17 |
| `bash scripts/probe-eperm-v2.sh status` | 14:49:23Z | **DEAD/STALE**, heartbeat n=32, ts 11:37:14Z, boot 6ad1ef9e, age **11.529 s** (đúng 3h12'09"); last sample probe #32; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp, ghi trong status1.txt — không qua pipe) |
| `bash scripts/probe-eperm-v2.sh once` | 14:49:23Z | **probe #33, boot=cd4cac0b, ok=2 fail=0**, exit 0; dòng `boot changed 6ad1ef9e -> cd4cac0b` (uptime since 2026-11-14 13:17:42) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 14:49:23Z | **ALIVE**, age 0 s, n=33, exit 0 |

Kiểm lại từ đĩa (14:49Z): log probe v2 **91 dòng** — 88 sau P6 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #32 +
dòng `boot changed` + dòng probe #33). **Khác P6 (+2):** P6 có
dòng DEAD cho #31 sẵn nên `status` đầu của P6 bị dedupe chặn;
lượt này chưa có dòng DEAD nào cho heartbeat #32 nên `status`
14:49:23Z ghi thêm đúng 1 dòng DEAD
("probe DEAD detected by status (last #32 at 2026-11-14T11:37:14Z,
age 11529s, no probe end since last start)"). Prereg §1 đã dự
báo đúng +3 trước khi đo (ghi cả hai khả năng 90/91 và lý do).
Heartbeat **n=33, ts 2026-11-14T14:49:23Z, boot cd4cac0b-…**;
log vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z 11/11)
và **0 dòng `=== probe end`** — loop v2 chưa từng được start lại
kể từ đợt 88.

**Ghi rõ phương pháp exit code (áp dụng đính chính của N6 §1):**
cả 3 lệnh checklist đều ghi output ra file riêng (status1.txt,
once.txt, status2.txt) rồi đọc `$?` trực tiếp, KHÔNG qua `| tee`
— số exit trên là exit thật của script (status 1 STALE / once 0 /
status 0 ALIVE), đúng quy định header script. File
`probe-notes.txt` chỉ chứa phần xác minh boot độc lập, không chứa
exit code.

Nguồn độc lập cho boot #45: không có sibling đợt 113 nào đo boot
#45 trước Q6 bằng `uptime -s` độc lập (P8 đo bằng postboot-check +
O8 driver đọc boot_id tươi — Q6 dùng làm dấu tươi phụ, xem §2.3;
xác nhận chính của Q6 là 2 lần đo `uptime -s` + btime +
journal/wtmp/ps như bảng trên). Reboot #45 đã được chốt giờ từ
đợt 113 (13:17:42Z); Q6 xác nhận lại boot hiện tại vẫn là #45
(chưa có reboot #46 tính tới 14:49:23Z).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như I7/J8/K6/L6/M4/N6/P6 đã đính
chính.

## 2. Điều tra khoảng mù #32 (11:37:14Z → 14:49:23Z, 3h12'09")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #33: `uptime -s` = **2026-11-14 13:17:42Z**,
  boot_id `cd4cac0b-17a6-408d-8c4e-be163f96dc61` — khác boot của
  probe #32 (6ad1ef9e).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (14:49Z): chỉ **1 boot**
  (cd4cac0b, first entry 13:17:53Z, last 14:48:25Z). `last -x
  reboot`: chỉ 1 dòng (13:17, still running). wtmp bắt đầu
  13:17:53Z. Journal/wtmp của boot 6ad1ef9e đã mất theo reboot
  #45 — như mọi lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu.

### 2.2 Một reboot đã chốt trong mù — #45 (13:17:42Z)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 45 | **13:17:42Z (chính xác từng giây)** | 6ad1ef9e → cd4cac0b | Chốt từ đợt 113 (P8 postboot-b45 + O8 driver đọc boot tươi 13:18:25Z). **Xác nhận lại lượt này:** 2 phép đo `uptime -s` độc lập trên boot mới (14:49:02Z, giống nhau từng giây) + btime 1794662262 + `who -b` 13:17 + boot_id cd4cac0b + journal first entry 13:17:53Z + wtmp begins 13:17:53Z + `ps` systemd PID 1 START 13:17:52 (đều ghi trong probe-notes.txt lúc 14:49Z) + probe #33 14:49:23Z boot cd4cac0b ok=2 fail=0. **Số thứ tự TẠM THỜI** (xem dưới). |

Gap #44 → #45 = **2h24'11" — ĐƯỢC CHỨNG NHẬN (mới, lượt này, xem
§2.3 + §2.5)**. **Tính tạm thời của số thứ tự (ghi rõ, không
giấu):** #45 kế thừa tính tạm thời từ mù #29 chưa đóng (khe 79 s,
M4 §2.3), mù #30 chưa đóng (3 cửa sổ mở, N6 §2.3) **và từ mù #31
chưa đóng (1 cửa sổ mở 8'55", xem §2.6)**: nếu mù #29 chứa 1
reboot ẩn, mù #30 chứa tối đa 2 và mù #31 chứa tối đa 1 thì
"reboot #45" thực tế có thể là **#49**. **Giá trị các gap không
phụ thuộc số thứ tự** — chỉ phụ thuộc giờ đã chốt.

### 2.3 Hoạt động trong khoảng mù — vì sao ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **18 file**
(không tính dist/node_modules) + hidden_files **395 file** (không
tính chrome-userdata); **413 mốc mtime, 408 mốc phân biệt** (độ
chính xác đầy đủ — theo cách đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục
19/P6 §4 mục 20). Chia mù làm hai đoạn bởi #45 (13:17:42Z):

- **Đoạn A: 11:37:14Z → 13:17:42Z (1h40'28", boot 6ad1ef9e) —
  ĐÓNG bằng uptime + poller + waiter + sàn (4 lớp, không lớp nào
  thừa):**
  - **Đo uptime trực tiếp của P6 đóng đầu đoạn (10:53:31Z →
    11:37:09Z):** P6 đo `uptime -s` = 10:53:31Z HAI lần lúc
    11:37:09Z (probe-notes.txt đợt 113-P6, đã đọc lại) — chứng
    minh máy up liên tục từ #44 tới 11:37:09Z; không reboot nào
    trong (10:53:31Z, 11:37:09Z]. Phủ kín đầu khoảng sàn-cho-phép
    [11:12:38Z, …] (xem sàn dưới).
  - **Poller P8 (5 phút) là kẹp trực tiếp tới 13:02:10Z — ĐÃ
    CHỨNG MINH LÀ MỘT TIẾN TRÌNH DUY NHẤT (mới, lượt này):**
    (i) chỉ ĐÚNG 1 lần launch trong toàn bộ exec-log của agent
    P8: "poller pid 12630 started at 2026-11-14 11:37:08 UTC"
    (proc_ad9dd0808501.log, birth 11:37:08Z, 52 byte); (ii) log
    poll-p8.log: START 11:37:08Z → poll #1 11:37:08Z → poll #18
    13:02:10Z + "ALL 7/7 DONE" — **18 poll liên tiếp, đúng
    300/301 s mỗi bước, không trùng, không thiếu số, không có
    START thứ hai** (tính bằng code từ nội dung log — xem
    recount-q6.txt); một lần chạy mới sẽ bắt đầu lại từ poll #1
    và ghi START mới — không có; (iii) không có cơ chế restart
    nào (không cron/systemd user service). Reboot sẽ giết tiến
    trình poller → không còn poll sau đó; poll tồn tại tới
    13:02:10Z nên **không reboot nào trong (11:37:08Z,
    13:02:10Z]**.
  - **Session waiter độc lập là kẹp thứ hai (mới, lượt này):**
    proc_e2377a7918bb.log, birth **11:37:30Z** → mtime
    **13:02:17Z** (dur ~85'), nội dung "poller exited after
    ~85 min" + toàn bộ tail poll log + 7/7 cờ DONE. Session này
    sống xuyên suốt (11:37:30Z, 13:02:17Z] trên VM — reboot
    trong khoảng đó sẽ giết nó trước khi nó ghi được dòng cuối.
    Độc lập với poller (tiến trình khác) nhưng cùng kết luận:
    **không reboot nào trong (11:37:30Z, 13:02:17Z]**.
  - **Sàn đóng đuôi (13:02:10Z → 13:17:42Z, 15'32"):** t trong
    khoảng này cho gap2 = 13:17:42Z − t < 15'32" < sàn 19'07" →
    loại trừ mọi t trong đuôi. Sàn-cho-phép tổng quát cho đoạn
    A: t ∈ [11:12:38Z, 12:58:35Z] (gap1 = t − 10:53:31Z ≥ sàn ⟺
    t ≥ 11:12:38Z; gap2 = 13:17:42Z − t ≥ sàn ⟺ t ≤ 12:58:35Z —
    kiểm bằng code, xem recount-q6.txt). Uptime P6 phủ tới
    11:37:09Z (> 11:12:38Z ✓); poller + waiter phủ tới 13:02:10Z
    / 13:02:17Z (> 12:58:35Z ✓); sàn phủ phần còn lại. **Hợp
    ba lớp: không còn t nào chưa loại → đoạn A ĐÓNG.**
  - Lỗ mtime lớn nhất đoạn A: **552 s (13:02:10Z → 13:11:21Z)**
    — nằm hoàn toàn sau 12:58:35Z nên đã loại bằng sàn; các lỗ
    còn lại ≤ 350 s đều nằm trong vùng poller phủ.
  - Kết luận đoạn A: **ĐÓNG**.
- **Đoạn B: 13:17:42Z → 14:49:23Z (1h31'41", boot cd4cac0b) —
  ĐÓNG bằng đo uptime trực tiếp + probe #33 + dấu boot tươi:**
  - **`uptime -s` ×2 lúc 14:49:02Z = 13:17:42Z** chứng minh máy
    up liên tục từ #45 tới lúc đo; probe #33 14:49:23Z đọc
    boot_id cd4cac0b tươi — cùng boot_id với boot bắt đầu
    13:17:42Z. (Nguyên tắc như P6 §2.3 đoạn C mù #31: đo uptime
    tại thời điểm probe ĐÓNG toàn bộ đoạn từ reboot cuối tới lúc
    đo — sàn chỉ áp dụng GIỮA hai reboot đã biết, không áp cho
    đuôi sau reboot cuối. Đính chính prereg §2(c): Q6 đã lo
    thừa về "cửa sổ (14:07:59Z, ~14:30:16Z)" — lo này sai vì
    phép đo uptime đã phủ toàn đoạn B; xem §4 mục 21.)
  - **Chuỗi dấu boot tươi củng cố (đọc boot_id/uptime trực tiếp
    từ /proc tại thời điểm ghi):** postboot-b45-1.log 13:17:42Z
    (script đọc `uptime -s` tươi, boot=2026-11-14 13:17:42);
    P8 O8 driver start 13:18:25Z boot=cd4cac0b; O8-WebKit driver
    14:01:39Z boot=cd4cac0b; O8-WebKit-only driver 14:07:00Z
    boot=cd4cac0b + exit 14:07:59Z; Q7 postboot-b45-check1.log
    **14:48:39Z** (script đọc `uptime -s` tươi lúc chạy,
    boot=2026-11-14 13:17:42, boot_id cd4cac0b) — dấu tươi cuối
    chỉ 44 s trước probe #33.
  - Lỗ mtime lớn nhất đoạn B: **1124 s (14:24:56Z → 14:43:41Z)**
    — nằm trong đoạn đã đóng bằng uptime trực tiếp nên không tạo
    cửa sổ mở (quy tắc N6 §4 mục 2: khe được bound bằng số học
    sàn + đo trực tiếp, không bằng mật độ quan sát; lỗ này chứa
    spawn đợt 114 14:35:51Z + hoạt động của parent, đều là mtime
    — không cần tới chúng).
  - Kết luận đoạn B: **ĐÓNG**.

**Kết luận trung thực: khoảng mù #32 ĐÓNG HOÀN TOÀN.** Đúng 1
reboot đã chốt giờ trong mù (#45 13:17:42Z) + **0 reboot ẩn**
(không còn cửa sổ mở nào). Đây là mù đầu tiên đóng hoàn toàn kể
từ mù #27 (K6) — cắt chuỗi 4 mù không đóng liên tiếp #28, #29,
#30, #31. Gap #44 → #45 = 2h24'11" được chứng nhận theo khoảng
(xem §2.5). Số thứ tự #45 vẫn TẠM THỜI (kế thừa mù #29/#30/#31
chưa đóng — xem §2.2).

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 113

Khoảng mù 11:37:14Z → 14:49:23Z (3h12'09") được phủ bởi các luồng
sibling đợt 113 (P1–P8, làm việc tới ~14:15Z; parent đóng đợt tới
14:18:34Z) + spawn đợt 114 (14:35:51Z). Đã đọc lại log thật — **đếm
lại độc lập từ đĩa** (grep trên đúng 98 file *.log có mtime trong
mù #32 — 0 file repo-1, 98 file hidden_files, trừ chrome-userdata):

| Mẫu | Số dòng | Kết luận |
|---|---|---|
| `sóng EPERM vẫn bật` | **0** | Không có sóng đang bật trong log còn tồn tại |
| `CẢNH BÁO` (10-phút wave warning) | **0** | Không có cảnh báo nào |
| `Operation not permitted` | **0** | Không có lỗi EPERM thật nào |
| `sóng EPERM đã tắt` | **15** | Tất cả đều là dòng launcher — **dương tính giả đã biết** |

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5, J8
§2.4, K6 §2.4, L6 §2.4, M4 §2.4, N6 §2.4, P6 §2.4):** cả 15 dòng
đều có dạng `[timestamp] sóng EPERM đã tắt, khởi động vite` — in
khi lần ghi thử ĐẦU TIÊN thành công ngay (code launcher
`waveOff=true` ở lần write đầu) — in mặc định cả khi không có
sóng. Phân bố: P1 run-p1.log 11 dòng (11:46:46–12:40:29Z, các lần
launch vite của P1) + P7 p7-o8-chromium.log 1 dòng + P8 p8-o8.log
3 dòng (13:18:26Z, 14:01:41Z, 14:07:02Z, O8 Chromium/WebKit).
Bằng chứng phân biệt: **0 dòng "sóng EPERM vẫn bật sau …s chờ"**
và **0 dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"** trong toàn bộ
98 log; **0 lần "Operation not permitted" thật**. Đếm này là
whole-file (không chỉ dòng trong cửa sổ mù) nên còn mạnh hơn:
không có dòng sóng thật nào trong toàn bộ nội dung 98 file.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — và lần này, KHÁC mù #29/#30/#31, **mù #32 đã
  đóng hoàn toàn** nên không còn lỗ quan sát về reboot nào để một
  sóng ngắn ẩn náu: vite khởi động thành công ngay ở 11:46–12:40Z
  (P1, 11 lần), 13:18–14:07Z (P8 O8, 3 lần), cộng probe #33
  ok=2 fail=0 lúc 14:49:23Z. Một sóng dài ~16' kiểu R7 không thể
  lọt vào mù #32 mà không để lại dấu — khả năng rất thấp.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~74h38'** trước
  probe #33 (tính từ cuối sóng ~12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #33 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 14:49:23Z ghi được.

### 2.5 Phân phối gap cập nhật — CERT n=24 (mới) + dải chứng nhận CÒN DÙNG ĐƯỢC

Gap mới **#44 → #45 = 2h24'11" ĐƯỢC CHỨNG NHẬN**: khoảng
(10:53:31Z, 13:17:42Z) không chứa cửa sổ mở nào — mù #32 đóng
hoàn toàn (§2.3). Đây là chứng nhận theo khoảng (interval), không
theo nhãn mù (P6 §4 mục 8): khoảng đã đóng kín thì gap được chứng
nhận. Tập gap đơn đã chứng nhận **n=23 → n=24**; toàn chuỗi tăng
n=38 → **n=39** (thêm 1 gap). Tính lại từ bảng J8 §2.5.3 + 2 gap
K6 + 2 gap L6 + 2 gap M4 + 2 gap N6 + 2 gap P6 + 1 gap mới, bằng
code (percentile tuyến tính, index = p·(n−1) — cùng phương pháp
J8/K6/L6/L9/M4/N6/P6). **Kiểm tra chéo: tính lại CERT n=22 ra đúng
100% số N6** (trung bình 1h52'05", trung vị 1h59'16", p10
1h08'41", p90 2h57'18", sd 43'58"), **tính lại CERT n=23 ra đúng
100% số P6** (trung bình 1h49'19", trung vị 1h58'47", p10
0h52'26", p90 2h53'15", sd 0h44'58") **và tính lại toàn chuỗi
n=38 ra đúng 100% số P6** (trung bình 1h56'06", trung vị
1h58'30", p10 0h43'49", p90 3h04'46", sd 1h02'19") — nên số mới
dưới đây đáng tin ở cùng mức (script `recount-q6.py`, output
`recount-q6.txt`):

| Thống kê | Toàn bộ n=39 | Chỉ gap đơn đã chứng nhận n=24 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, CẬN TRÊN)** | **3h14'08" (#26 → #27)** |
| Trung bình | 1h56'49" | 1h50'46" |
| Trung vị | 1h58'47" | 1h59'16" |
| Độ lệch chuẩn (mẫu) | 1h01'40" (CV 0,53) | 44'33" |
| p10 | 0h45'22" | 0h54'26" |
| p90 | 3h04'42" | 2h50'12" |

Đọc thêm: 21/39 gap (54%) nằm trong 90'–150'; 6 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
**Dải chứng nhận [19'07", 3h14'08"] đứng vững trên tập gap đơn
đã chứng nhận (n=24)** — min/max không đổi (gap mới 2h24'11" nằm
giữa). Cảnh báo J8 vẫn đứng: dải này đã bị vượt 2 lần bởi các gap
chưa chứng nhận (#11 → #12 4h10'33",
#33 → #34 5h43'18") — nó là phát biểu về các gap đơn đã biết,
không phải bảo đảm. **Không đưa dự báo điểm cho #46 hay reboot
nào sau đó** — chỉ dải cơ học áp lên #45 (13:17:42Z):
**[13:36:49Z, 16:31:50Z]**; probe #33 (14:49:23Z, boot #45) đã
loại trừ phần trước 14:49:23Z → dải hiệu dụng
**[14:49:23Z, 16:31:50Z]**; p10–p90 toàn chuỗi →
[14:03:03Z, 16:22:24Z].

### 2.6 Thử đóng cửa sổ mở 8'55" của mù #31 — KHÔNG ĐÓNG ĐƯỢC (nguồn đã cạn)

Cửa sổ mở duy nhất của mù #31: **(10:23:54Z, 10:32:49Z), 535 s**.
Q6 thử lại theo đúng prereg §4, từng nguồn một:

- **(a) Đọc lại NỘI DUNG 2 proc log trong cửa sổ — không có boot:**
  proc_416f63de5dce.log (birth 10:26:08Z → mtime 10:26:41Z, 33 s,
  1168 byte): toàn bộ là output grep code playheadHold90R2.ts
  (dòng 605–6772) — không chuỗi boot_id/uptime/btime nào.
  proc_a558d84b438c.log (birth 10:30:42Z → mtime 10:30:46Z, 4 s,
  1117 byte): đếm batch 111+112 + trích LIMITS gộp — các lần xuất
  hiện chữ "boot" chỉ là trích dẫn "postboot PASS 5/5" và "boot
  #41" trong văn bản cũ, không phải đo boot tươi. Cả hai session
  đều ngắn hơn ngưỡng sống sót 38 s nên không loại trừ được gì
  (P6 §2.3 đã kết luận; Q6 đọc lại độc lập, khớp).
- **(b) Quét lại toàn ~/workspace trong ĐÚNG cửa sổ (stat %W/%Y,
  không dùng `find -newerBt`): 8 file** — O8 log biên 10:23:54Z
  + proc_6ea55a7edc7f.log biên 10:23:54Z (session O8, birth
  10:21:04Z → mtime 10:23:54Z, 39 byte: chỉ "O8 DONE
  2026-11-14T10:23:54Z / O8-EXIT=0", không đọc boot) + 2 proc log
  trên + LIMITS gộp đợt 112 10:28:38Z + batch n8-verify
  10:29:26Z + cờ round112-n8-done 10:29:29Z + batch closing
  10:31:15Z. **P6 đếm 9 — Q6 đếm 8: file thứ 9 là
  PHASE9_GAP_ANALYSIS.md, đã bị ghi đè SAU cửa sổ** (mtime nay
  14:18:34Z — parent cập nhật lúc đóng đợt 113); nội dung nó có
  lúc 10:31:14Z đã mất, không khôi phục được. /tmp: **0 file**.
  chrome-userdata: **0 file** (thư mục không tồn tại ở cả hai vị
  trí `~/workspace/repo-1/chrome-userdata` và
  `~/workspace/goals/.../hidden_files/chrome-userdata`).
  Không file nào trong cửa sổ ghi boot_id/uptime; không session
  nào bắc qua cửa sổ.
- **(c) Quét session bắc qua cửa sổ (birth < 10:23:54Z, mtime >
  10:32:49Z, trên toàn bộ `~/workspace/agents/*/exec-logs/`):
  0 session.** Session sinh trong cửa sổ: đúng 3 — 2 proc log
  trên (33 s, 4 s) + proc_0f9ff074d81a.log (U4-dry, birth
  **10:32:49Z** → mtime 10:36:12Z, 203 s) — sinh ĐÚNG tại mép
  phải của cửa sổ, không phủ phần trong nào (P6 §2.3 đã dùng nó
  để đóng phần sau 10:32:49Z).
- **(d) Journal/wtmp/syslog:** journal chỉ giữ boot hiện tại
  (#45, first entry 13:17:53Z); wtmp chỉ giữ boot hiện tại;
  **không có /var/log/syslog hay kern.log** trên VM này.
  Journal/wtmp của boot 1af50bdb đã mất theo reboot #44 — như
  mọi lần trước, chỉ giữ boot hiện tại.
- **(e) Log sibling đợt 113 (P1–P8, chạy 11:37Z→14:07Z):** grep
  toàn bộ `round113-p*/` tìm dấu boot tươi với timestamp trong
  cửa sổ 10:23:54–10:32:49Z — **0 kết quả**. Chúng chạy SAU cửa
  sổ nên không thể chứa đo tươi trong cửa sổ; Q6 kiểm chứng bằng
  grep thay vì đoán.

**Kết luận: cửa sổ 8'55" của mù #31 KHÔNG ĐÓNG ĐƯỢC. Mù #31 giữ
nguyên KHÔNG ĐÓNG HOÀN TOÀN** (2 reboot đã chốt + tối đa 1 ẩn;
cửa sổ 535 s < 2× sàn nên tối đa 1 reboot ẩn — không đổi).
**Không còn nguồn nào để thử** — Q6 đã cạn đúng 5 nguồn prereg
§4 liệt kê, cộng thêm bài học mới: file mtime-only trong cửa sổ
có thể bị ghi đè sau đó và mất nội dung gốc (GAP_ANALYSIS là ví
dụ — xem §4 mục 22). Q6 không tự quyết "chấp nhận 2 reboot, có
thể 3" — parent/user quyết như P6 đã ghi.

### 2.7 Quét writeFileSync (snapshot 14:58:57–15:00:06Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round114-q6`. Chạy trọn vẹn (69 s, SCAN-END có đủ). Kết quả
NEWSTD khớp 100% scan-meta.txt (tính lại từ file wfs-*.txt +
files-*.bin gốc).

- Chuẩn mới: **656 dòng / 191 file** (phạm vi 2842 file).
  Lần 19 (P6): 637 dòng / 187 file (phạm vi 2827 file).
- R7b (đối chiếu): **681 dòng / 208 file**. Lần 19: 662 / 204.
- Copies: **25 dòng / 17 file** — y hệt lần 19, 18, 17, J8, I7, H7, G8
  và F7.
- Đối chiếu chéo 656+25=681=R7b, **chênh 0 — lần thứ hai mươi
  liên tiếp**. Tổng hit trên cả 3 bảng: 656+681+25 = **1.362 dòng**.
- **+19 dòng / +4 file so với lần 19, giải thích đúng hết bằng
  diff hit list** (đã đọc nội dung từng dòng mới; không có dòng
  nào tăng trong file cũ ngoại trừ GAP_ANALYSIS +1, không file
  nào giảm):
  - +7 `docs/PHASE9_ROUND113_P6_EPERM_LIMITS.md` (file LIMITS của
    chính P6 — 7 hit đều là trích dẫn "writeFileSync" trong văn
    bản, đã đọc nội dung từng dòng)
  - +2 `docs/PHASE9_ROUND113_LIMITS.md` (LIMITS gộp đợt 113 —
    2 hit đều là trích dẫn trong văn bản, đã đọc)
  - +8 `apps/web/scripts/probe114q3-frame-parity.mjs` (Q3 đợt 114
    — script probe frame-parity: ghi vite config tạm + kết quả/
    log vào scratch; mtime 14:51:01Z; đã đọc 8 dòng)
  - +1 `apps/web/scripts/probe114q1.mjs` (Q1 đợt 114 — dòng 215:
    `fs.writeFileSync(waveProbeFile, "x")`, lệnh ghi probe sóng
    EPERM thật trong script đo, không phải production; mtime
    14:57:00Z)
  - +1 `PHASE9_GAP_ANALYSIS.md` (21 → 22: parent thêm dòng tóm
    tắt P6 đợt 113 vào gap §41 lúc 14:18:34Z — trích dẫn
    "writeFileSync" trong văn bản, đã đọc)
  - Tổng: 7+2+8+1+1 = **19** ✓, 4 file mới có hit ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets). Đếm lại trực tiếp sau scan: P6 LIMITS đúng 7,
    ROUND113_LIMITS đúng 2, probe114q3 đúng 8, probe114q1 đúng 1,
    GAP_ANALYSIS đúng 22.
- **0 file biến mất khỏi hit list.**
- Scope: **+15 file ròng / −0 file** so với lần 19 (2842 =
  2827+15−0 ✓): 15 file mới = 4 file hit trên + 11 file không
  hit (3 script lock vite v2 — `test-vite-lock-v2.sh`,
  `vcut-poll-quiet-v2.sh`, `vcut-vite-lock-v2.sh` — + 2 script
  benchmark — `benchmarks/render/p2_equiv_113.py`,
  `benchmarks/render/webkit_blob_flaky_113p2_2mib.mjs` — + 6 file
  LIMITS — P1/P2/P3/P4/P5 đợt 113 + Q4 đợt 114). Comm hai chiều
  khớp đúng (15 = 4+11 ✓).
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt lần 19 — xem files-copies.txt;
  diff wfs-copies.txt với lần 19: IDENTICAL).
- **Race trong cửa sổ scan (ghi rõ, không giấu):** các sibling
  đợt 114 vẫn đang chạy; 2 file probe114q1/q3 đã hạ cánh trước
  khi scan bắt đầu (mtime 14:51:01Z / 14:57:00Z, scan bắt đầu
  14:58:57Z — đếm lại trực tiếp sau scan khớp số trong
  wfs-newstd.txt — không hỏng số đếm). Sibling đợt 114 vẫn đang
  chạy nên lượt sau cần đối chiếu lại.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2842 file), NUL-safe, chạy từ trong repo-1 — chỉ đúng 2 hit
trong code (đếm lại độc lập, không tin mù file cũ; các hit còn
lại đều nằm trong file `.md` trích dẫn code — tổng 117 dòng
`.writeFile(` trong phạm vi, 115 dòng nằm trong `.md`, 2 dòng
trong code):

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z — kiểm lại trực tiếp
lượt này). Kết luận giữ nguyên như M4/N6/P6: **2 async call site, cả
2 đều thuộc helper retry đã biết với cùng hợp đồng EPERM-only +
verify byte — không phải write async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

2 mẫu MemAvailable của lượt: **828.412 kB (14:49:02Z, lúc probe
#33) / 1.860.444 kB (15:00:06Z, lúc scan xong)** — ~0,81 GB rồi
~1,82 GB. **Dao động mạnh trong 11 phút** (từ ~0,8 GB lên
~1,8 GB — có thể do tiến trình sibling/vite giải phóng sau khi
xong; Q6 không đo được nguyên nhân chính xác, chỉ ghi số). Max
RAM biết được **trong** mù #32 từ log sibling: **2.872.556 kB ≈
2,74 GB** (P1 dial, 11:50:25Z, boot #44) = **45% ngưỡng guard
6144 MB**; các mẫu RAMavail khác trong mù: 437 MB (P8 verify
start, 13:13:11Z, boot #44), 686 MB (Q5 gate poll, 14:48:24Z,
boot #45). Lưu ý: mẫu RAMavail=1406MB trong log Q5 có timestamp
15:02:01Z — SAU khi mù #32 đóng (probe #33 14:49:23Z) nên KHÔNG
tính vào max trong mù (nó lọt vào grep whole-file vì file log
có mtime trong mù). Birefnet KHÔNG chạy, đúng quy tắc parent đợt
92 §3 mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC;
chạm ≥ 6 GB mới thử lại). Birefnet-general vẫn **0 lần chạy thành
công** trong gói. Mẫu RAM lúc probe (0,81 GB) vẫn xa ngưỡng guard;
máy chưa từng tiến gần ngưỡng guard trong mù #32.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Lỗ mù phải kiểm chứng 4 lớp trước khi tuyên bố (L6 §4 mục 1,
   M4 §4 mục 1, N6 §4 mục 1, P6 §4 mục 1, áp dụng lượt này — xem
   §2.3):** (a) mtime find trong hai cây để xác định lỗ; (b)
   **đọc NỘI DUNG** các file log append chạm biên lỗ (poll-p8.log
   — 18 mục, 300 s đều; proc log waiter — "poller exited after
   ~85 min"; postboot/O8 log — boot tươi đầu/cuối; Q7 postboot
   check — boot tươi 14:48:39Z); (c) **tìm ngoài hai cây**: find
   toàn ~/workspace (không prune) + /tmp + agents/ +
   chrome-userdata trong đúng cửa sổ lỗ; (d) **số học sàn** để
   bound khe không loại trừ được (mù #32: 0 cửa sổ còn lại).
   **Quy tắc giữ nguyên: mọi kết luận "lỗ" phải qua cả 4 lớp, và
   phải ghi rõ khe còn lại sau mỗi lớp.**
2. **Dấu boot TƯƠI (đọc /proc tại thời điểm ghi) miễn nhiễm với lỗ
   "tiến trình cũ sống sót" (P6 §4 mục 2, áp dụng lượt này — xem
   §2.3):** postboot-check và O8 log đọc `boot_id` bằng command
   substitution NGAY lúc echo — sau reboot, /proc cho boot_id mới
   nên dấu này chứng minh không reboot trước thời điểm đó, bất kể
   tiến trình có sống sót hay không. Ngược lại, một session chỉ
   ghi file (không đọc boot) thì vẫn phải trừ 38 s sống sót ở
   đuôi. Khi đánh giá session, phân biệt rõ: session có đọc boot
   tươi trong nội dung thì đóng tới đúng thời điểm đọc; session
   chỉ ghi file thì trừ 38 s.
3. **Quan sát ngoài cây KHÔNG tự động thu hẹp khe (N6 §4 mục 2,
   P6 §4 mục 3, áp dụng lượt này — xem §2.3):** build-loop-log
   14:43:41Z + file sibling đợt 114 từ 14:45:35Z nằm trong lỗ lớn
   14:24:56Z → 14:43:41Z nhưng chỉ là mtime — khe được bound bằng
   số học sàn + đo uptime trực tiếp, không bằng mật độ quan sát.
   Chỉ quan sát nào **xác định boot** (boot_id/uptime trong nội
   dung, hoặc session bắc qua) mới thu hẹp được khe. Đừng đếm "có
   file trong lỗ" thành "lỗ đã lấp".
4. **`find -newerBt` với chuỗi thời gian là SAI (N6 §4 mục 3, nhắc
   lại — lượt này KHÔNG mắc):** dùng `stat -c '%W %Y'` lấy
   birth/mtime epoch rồi so sánh bằng code (Q6 đã làm đúng: toàn
   workspace + /tmp + chrome-userdata trong cửa sổ mù #31; 52+
   proc log session-spanning check).
5. **`status` STALE chỉ ghi 1 dòng DEAD cho mỗi heartbeat (N6 §4
   mục 4, P6 §4 mục 5, xác nhận lại lượt này — xem §1):** log tăng
   88 → 91 (+3: DEAD mới cho #32 + boot-changed + probe) vì chưa
   có dòng DEAD nào cho heartbeat #32. Khi đếm dòng log lượt sau
   phải tính cả cơ chế dedupe này (baseline mới là **91**, không
   phải 90 hay 92).
6. **Exit code lấy từ `$?` trực tiếp, không qua pipe (N6 §4 mục
   5, P6 §4 mục 6, áp dụng lượt này — xem §1):** cả 3 lệnh
   checklist ghi ra file riêng rồi đọc `$?`; probe-notes.txt (ghi
   trực tiếp, không qua `| tee`) chỉ chứa phần xác minh boot,
   không chứa exit code. Quy định script: status 0 ALIVE / 1
   STALE-DEAD / 2 never-run; once 0.
7. **Session exec bắc qua là kẹp mạnh nhất sau poller (N6 §4 mục
   6, P6 §4 mục 7, áp dụng lượt này — xem §2.3):** session waiter
   của P8 (birth 11:37:30Z → mtime 13:02:17Z, ~85') là kẹp độc
   lập thứ hai cho đoạn A — hai tiến trình khác nhau cùng sống
   xuyên suốt khoảng. **Bổ sung lượt này:** khi một poller có
   session waiter riêng, waiter chính là bằng chứng độc lập cho
   tính liên tục của poller — kiểm tra cả hai, không chỉ log
   poll.
8. **Chứng nhận gap theo KHOẢNG, không theo nhãn mù (P6 §4 mục 8,
   áp dụng lượt này — xem §2.5):** #44 → #45 được chứng nhận vì
   khoảng (10:53:31Z, 13:17:42Z) không chứa cửa sổ mở nào (mù #32
   đóng kín). Ghi rõ cơ sở để parent quyết (nếu không đồng ý thì
   hạ về cận trên, CERT về n=23).
9. **`ps aux` / `ps -eo lstart` là nguồn độc lập cho giờ reboot
   (L6 §4 mục 2, M4 §4 mục 3, N6 §4 mục 8, P6 §4 mục 9, áp dụng
   lượt này — xem §2.2):** systemd PID 1 START 13:17:52, hatch
   13:17:53, hatch-execd 13:18:17 — khớp `uptime -s` 13:17:42Z ở
   mức phút.
10. **Chốt giờ reboot bằng `uptime -s` trên boot mới, đo 2 lần —
    KHÔNG dùng mtime file cuối của boot cũ** (K6 §4 mục 2, nhắc
    lại): lần này #45 giữ giờ đợt 113 chốt (13:17:42Z); Q6 xác
    nhận lại bằng 2 lần đo trực tiếp + btime trên boot #45; ghi rõ
    nguồn gốc giờ, đừng giả vờ đo lại được.
11. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
    reboot** (J8 §4 mục 1, nhắc lại): đừng bao giờ đếm reboot chỉ
    bằng `grep "boot changed"` trên log probe; chuỗi đánh số chính
    thức nằm trong các file LIMITS EPERM theo đợt.
12. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (J8 §4 mục 2, nhắc
    lại): dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn
    đã chứng nhận (n=24) sau lượt này; trên toàn chuỗi vẫn có 2
    gap vượt (đều là cận trên). **Nằm trong dải không đồng nghĩa
    được chứng nhận** (M4 §4 mục 6, nhắc lại): gap #44 → #45
    (2h24'11") được chứng nhận vì khoảng đã đóng kín, không phải
    vì nó nằm trong dải.
13. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
    bằng sàn** (H7 §4 mục 1, nhắc lại): sàn 19'07" vẫn đứng sau
    lượt này; mù #32 đóng được là nhờ uptime + poller + waiter,
    sàn chỉ đóng đuôi 15'32" — sàn là công cụ bound, không phải
    bằng chứng đóng duy nhất.
14. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
    poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ lớn
    14:24:56Z → 14:43:41Z, toàn ~/workspace ngoài hai cây chỉ có
    runtime-internal writes — không session nào bắc qua, không
    boot_id nào; đoạn B đóng được là nhờ ĐO UPTIME TRỰC TIẾP lúc
    probe, không nhờ các ghi rời rạc này.
15. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
    4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
    vị trí đã biết trước khi kết luận.
16. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
    §4 mục 8, nhắc lại):** lượt này 15 dòng "đã tắt" trong mù #32
    đều là dương tính giả (launcher); 0 dòng "vẫn bật", 0
    "Operation not permitted" thật. Đếm whole-file (không chỉ
    dòng trong cửa sổ) nên 0 còn mạnh hơn.
17. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9 / J8 §4 mục 9
    / L6 §4 mục 10 / M4 §4 mục 11 / N6 §4 mục 16 / P6 §4 mục 17):
    lượt này probe + quét xong là ghi LIMITS/ batch ngay, không
    đợi luồng khác — reboot #45 (13:17:42Z) đã xảy ra giữa đợt 113
    và đợt 114; lượt sau có thể bị reboot giết bất cứ lúc nào.
18. **Đếm *.log sóng EPERM phải quét cả hai cây** (J8 §4 mục 10,
    nhắc lại): lần này 98 file đều nằm ở hidden_files (0 file
    repo-1). Quét một cây sẽ kết luận sai là "không có log".
19. **Scan writeFileSync có thể bị reboot cắt ngang giữa chừng**
    (L6 §4 mục 12, nhắc lại): lần này scan chạy trọn vẹn 69 s
    trên boot mới, SCAN-END có đủ; kiểm tra SCAN-END trước khi
    tin scan-meta.txt.
20. **Đếm mốc mtime (L9 §6.1, áp dụng lượt này):** mù #32 có
    **413 mốc mtime** (độ chính xác đầy đủ) nhưng chỉ **408 giây
    nguyên phân biệt** — ghi cả hai số, không ghi một số mập mờ.
21. **Đo uptime tại thời điểm probe ĐÓNG đoạn đuôi sau reboot cuối
    — sàn chỉ áp dụng GIỮA hai reboot đã biết (mới, lượt này —
    xem §2.3, đính chính prereg §2(c)):** prereg lo thừa về "cửa
    sổ (14:07:59Z, ~14:30:16Z)" vì đã áp sàn cho đoạn B như thể
    có reboot kế tiếp chưa biết; thực tế `uptime -s` đo lúc probe
    (= 13:17:42Z) chứng minh không reboot nào sau #45, nên đoạn B
    đóng toàn bộ không cần sàn. Lượt sau: khi đoạn cuối mù được
    đóng bằng đo uptime trực tiếp, KHÔNG tự tạo cửa sổ mở giả
    bằng sàn.
22. **File mtime-only trong cửa sổ có thể bị ghi đè sau đó và mất
    nội dung gốc (mới, lượt này — xem §2.6):** GAP_ANALYSIS lúc
    10:31:14Z nằm trong cửa sổ mù #31 nhưng đã bị ghi đè lúc
    14:18:34Z — đếm file trong cửa sổ tụt 9 → 8 và nội dung gốc
    không khôi phục được. Khi đếm lại cửa sổ cũ, đối chiếu số
    file với lượt trước và giải thích mọi chênh lệch bằng mtime
    hiện tại; đừng kết luận "P6 đếm sai" khi file đã dời mtime.
23. **Prereg phải ghi cả hai khả năng khi cơ chế dedupe chưa chắc
    chắn (mới, lượt này — xem §1):** Q6 dự báo đúng log +3 (không
    phải +2) vì đã kiểm tra trước rằng chưa có dòng DEAD nào cho
    heartbeat #32. Lượt sau: kiểm tra dòng DEAD cuối log trước
    khi dự báo số dòng tăng.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #32 ĐÓNG HOÀN TOÀN (mới, lượt này, xem §2.3):**
   1 reboot đã chốt (#45 13:17:42Z) + 0 reboot ẩn. Gap #44 → #45
   = 2h24'11" ĐƯỢC CHỨNG NHẬN (mới — xem §2.5, chờ parent xác nhận
   cách chứng nhận xuyên mù như #42 → #43). Số thứ tự #45 vẫn
   TẠM THỜI (kế thừa mù #29/#30/#31 chưa đóng — tối đa "thực tế
   #49"). Dải cơ học cho #46 từ #45: [13:36:49Z, 16:31:50Z] —
   hiệu dụng [14:49:23Z, 16:31:50Z] sau probe #33; là phép áp dải
   máy móc, không phải dự báo.
2. **Khoảng mù #31 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI, ĐÃ THỬ HẾT
   NGUỒN CÒN LẠI (mới, lượt này, xem §2.6):** 1 cửa sổ mở —
   8'55" (10:23:54Z → 10:32:49Z). Số reboot trong mù: 2 đã chốt
   (#43 08:53:37Z — giờ do N8 chốt; #44 10:53:31Z — P6 đo trực
   tiếp) + có thể tối đa 1 ẩn. **Số thứ tự #43/#44 vẫn TẠM THỜI**
   — parent/user quyết xem có chấp nhận "ít nhất 2 reboot, có thể
   3" làm mức đóng của mù #31 hay để mở như mù #24/#26/#28/#29/
   #30. Q6 không tự quyết. Gap #43 → #44 = 1h59'54" KHÔNG được
   chứng nhận (cận trên); không còn nguồn nào để thử thêm.
3. **Khoảng mù #30 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (N6 §5 mục
   1, P6 §5 mục 2): 3 cửa sổ mở, tổng 30'50"; số reboot trong mù:
   2 đã chốt + có thể tối đa 2 ẩn. Số thứ tự #41/#42 vẫn TẠM
   THỜI. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết. Q6 không tự quyết. Probe #33 không đóng được mù #30
   hồi tố (chỉ chứng nhận được gap #44 → #45 qua mù #32 đã đóng).
4. **Khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (M4 §5 mục
   1, P6 §5 mục 3): lỗ thật 14'31" theo M4 / 13'33" theo M9
   birth-time, khe 79 s không loại trừ được; số reboot trong mù:
   2 đã chốt + có thể 1 ẩn. Số thứ tự #39/#40 vẫn TẠM THỜI.
   Không còn dữ liệu nào để thu hẹp thêm — parent/user quyết.
   Q6 không tự quyết. Probe #33 không đóng được mù #29 hồi tố.
5. **Khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục
   1, P6 §5 mục 4): lỗ 23'39" (02:01:06Z → 02:24:45Z), khe 4'32"
   không loại trừ được; số reboot trong mù: 2 đã chốt + có thể
   1 ẩn. Số thứ tự #37/#38 vẫn TẠM THỜI. Không còn dữ liệu nào
   để thu hẹp thêm — parent/user quyết. Q6 không tự quyết.
6. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
   1, P6 §5 mục 5): lỗ 1h13'58" (19:20:19Z → 20:34:17Z) có thể
   chứa thêm reboot; số reboot trong mù: ít nhất 1 (#34), có thể
   nhiều hơn — không xác định được; số thứ tự #34 là TẠM THỜI.
   Không còn dữ liệu nào để thu hẹp thêm — parent/user quyết.
   Q6 không tự quyết.
7. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1, P6 §5 mục 6): lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể
   chứa thêm reboot; số reboot trong mù: ít nhất 1 (#32), có thể
   nhiều hơn — không xác định được; số thứ tự #32/#33/#34/#35/
   #36/#37/#38/#39/#40/#41/#42/#43/#44/#45 là TẠM THỜI. Không còn
   dữ liệu nào để thu hẹp thêm — parent/user quyết. Q6 không tự
   quyết.
8. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1,
   P6 §5 mục 7): lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa
   đúng 1 reboot trung gian. Không còn dữ liệu nào để thu hẹp
   thêm — parent/user quyết. Q6 không tự quyết.
9. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
   §6 mục 3, P6 §5 mục 8): cửa sổ lý thuyết ≤78 s với sàn 19'07".
   Q6 không thử lại, không tự quyết — parent/user quyết giữ "đóng",
   "đóng có điều kiện", hay mở lại. **Khoảng mù #23 VẪN ĐÓNG HOÀN
   TOÀN** (không đổi kết luận G8). **Khoảng mù #25 VẪN ĐÓNG HOÀN
   TOÀN** (không đổi kết luận I7). **Khoảng mù #27 VẪN ĐÓNG HOÀN
   TOÀN** (không đổi kết luận K6). **Khoảng mù #28 nay KHÔNG ĐÓNG
   HOÀN TOÀN** (L6). **Khoảng mù #29 nay KHÔNG ĐÓNG HOÀN TOÀN**
   (M4). **Khoảng mù #30 nay KHÔNG ĐÓNG HOÀN TOÀN** (N6).
   **Khoảng mù #31 nay KHÔNG ĐÓNG HOÀN TOÀN** (P6, Q6 thử lại
   không đóng được). **Khoảng mù #32 nay ĐÓNG HOÀN TOÀN** (mới,
   lượt này).
10. **Khoảng mù #33 BẮT ĐẦU từ 14:49:23Z** (probe #33) — lượt sau
    (probe #34) đối chiếu từ mốc này, trên boot cd4cac0b (#45,
    từ 13:17:42Z, số thứ tự tạm thời). Dải cơ học cho #46 từ #45
    là [13:36:49Z, 16:31:50Z] — hiệu dụng [14:49:23Z, 16:31:50Z]
    sau probe #33; là phép áp dải máy móc, không phải dự báo.
    Baseline log probe cho lượt sau là **91 dòng** (không phải 88
    hay 90 — xem §1).
11. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
    mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
    LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
    8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
    2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
    mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3,
    F7 §6 mục 4, G8 §6 mục 5, H7 §6 mục 5, I7 §5 mục 6, J8 §5 mục
    5, K6 §5 mục 6, L6 §5 mục 7, M4 §5 mục 8, N6 §5 mục 9, P6 §5
    mục 10): lệnh cron chỉ là `bash ~/workspace/repo-1/scripts/
    probe-eperm-v2.sh once` (vài giây, không giữ tiến trình nền).
    Q6 KHÔNG tự tạo, KHÔNG start loop nền. Bằng chứng mới: mù #32
    đóng được LÀ NHỜ poller P8 chạy xuyên suốt + waiter — cùng mẫu
    với mù #31 không đóng được vì poller N8 đã exit lúc 10:15:01Z
    và không còn observer thường trực nào sau đó. Lần này cửa sổ
    mở của mù #32 là 0 (không còn cửa sổ nào) vì poller + waiter
    phủ kín đoạn A và đo uptime phủ kín đoạn B.
12. **Mô hình dự báo điểm ĐÃ BỎ — KHÔNG ĐỔI** (J8 §2.5, §5 mục 6,
    P6 §5 mục 11): không đưa dự báo điểm cho #46 hay reboot nào
    sau đó; thay bằng dải chứng nhận [19'07", 3h14'08"] + p10–p90
    thực nghiệm + đo uptime trực tiếp + poller.
13. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
    và các lượt sau; log tăng đúng 3 dòng checklist, 88 → 91 —
    dòng DEAD mới cho #32 + boot-changed + probe, xem §1 — không
    thêm dòng lạ mới trong lượt này.)
14. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
    đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
    được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
    cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
15. **VM reboot ~1 lần / 1h58'42"** (45 lần đã chốt giờ / 88,99h từ
    ~20:18:10Z 10/11 tới 13:17:42Z 14/11, số thứ tự tạm thời — xem
    §2.2 + §2.5; nếu mù #29 chứa thêm 1, mù #30 chứa thêm tối đa 2
    và mù #31 chứa thêm tối đa 1 reboot ẩn thì 49 lần / 88,99h =
    1 lần / 109,0'): mọi probe nền đều chết theo reboot; v2 chỉ
    đảm bảo cái chết được ghi nhận + lượt sau hồi phục bằng 1 mẫu
    mới.
16. **Birefnet: KHÔNG chạy trong lượt này** — RAM 2 mẫu MemAvailable
    **828.412 / 1.860.444 kB** (~0,81 / ~1,82 GB); max trong mù #32
    từ log sibling **2.872.556 kB ≈ 2,74 GB** = 45% guard 6144 MB.
    Birefnet-general vẫn 0 lần chạy thành công trong gói.
17. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
18. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
19. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    Q6 không thử lại nguồn nào, theo đúng lệnh.
20. **Đính chính nhỏ (mới, lượt này):** (a) Log probe v2 tăng 88 →
    91 (+3, không phải +2) vì chưa có dòng DEAD nào cho heartbeat
    #32 — prereg đã dự báo đúng; baseline lượt sau là 91 dòng.
    (b) Gap #44 → #45 = 2h24'11" ĐƯỢC CHỨNG NHẬN theo khoảng (mù
    #32 đóng kín) — lần đầu chứng nhận 2 gap liên tiếp (#42 → #43
    rồi #44 → #45); chờ parent xác nhận cách chứng nhận xuyên mù
    (xem §2.5). (c) Dải cơ học cho #46 phải cắt phần trước
    14:49:23Z (probe #33 đã loại trừ) → hiệu dụng [14:49:23Z,
    16:31:50Z]. (d) Prereg §2(c) lo thừa về cửa sổ (14:07:59Z,
    ~14:30:16Z] — đo uptime trực tiếp đã đóng toàn đoạn B; xem §4
    mục 21. (e) Đếm file trong cửa sổ mù #31 tụt 9 → 8 vì
    GAP_ANALYSIS bị ghi đè sau cửa sổ (mtime dời sang 14:18:34Z)
    — không phải P6 đếm sai; xem §4 mục 22.
