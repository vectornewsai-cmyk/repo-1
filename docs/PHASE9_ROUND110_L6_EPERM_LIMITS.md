# PHASE9 ROUND110 L6 — EPERM: probe #29 + khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN

> Luồng L6, đợt 110 vòng lặp Phase 9 VCut Studio (lượt cron 09:35 +07,
> 14/11/2026; làm việc 02:40Z → 03:1xZ 14/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù
> #28 kể từ probe #28 (23:40:43Z 13/11) + quét sóng EPERM + quét
> writeFileSync lần thứ 16 + ghi RAM (birefnet: KHÔNG chạy — vẫn dưới
> ngưỡng guard, xem §3).
> **GIAO LẠI:** luồng L6 trước bị lỗi runtime ("restart drain in
> progress") lúc ~02:51Z — nguyên nhân là **reboot #39 lúc 02:50:48Z**
> (xem §2.6). Luồng trước đã làm xong probe #29 + phần lớn điều tra mù
> #28 + quét WFS dở dang (chết giữa R7b); luồng này (giao lại) kiểm
> tra đĩa trước, KHÔNG làm lại từ đầu những gì đã có — chỉ chạy nốt
> phần còn thiếu (quét WFS lại, kiểm chứng độc lập các đếm sóng/lỗ,
> xác nhận #37/#38, đóng verdict mù #28), rồi ghi LIMITS/batch ngay.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #28, mù #26, mù #24, mù #21,
> hay reboot #16** — chỉ báo cáo "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (luồng trước, 02:40:36Z):**
  `status` báo **DEAD/STALE** (heartbeat age 10.793 s, last #28
  23:40:43Z, boot ab33c58f, exit 1); `once` ngay sau đó là
  **probe #29, boot 2f001e9c (ĐỔI), ok=2 fail=0**, exit 0; `status`
  chạy lại **ALIVE** (age 0 s, n=29), exit 0. Log v2 tăng đúng 3
  dòng (76 → 79, đã kiểm lại từ đĩa); heartbeat nay n=29,
  ts 02:40:36Z, boot 2f001e9c. Luồng này KHÔNG chạy lại checklist
  (chỉ chạy đúng 1 lần mỗi lượt — chạy lại sẽ ghi thêm mẫu giả).
- **Reboot #38 = 02:24:45Z — XÁC NHẬN bằng 2 phép đo `uptime -s`
  trực tiếp** (02:40:35Z và 02:40:36Z, giống nhau từng giây, luồng
  trước) + `who -b` 02:24 + boot_id 2f001e9c + journal first entry
  02:25:00Z + wtmp begins 02:24:59Z + **nguồn độc lập thứ ba (mới,
  lượt này): `ps aux` của parent lúc 02:36Z ghi systemd PID 1
  START 02:24, journald 02:24, hatch daemon 02:24** (xem §2.2).
  Gap #37 → #38 = **1h29'03" — KHÔNG ĐƯỢC CHỨNG NHẬN** (mù #28
  chưa đóng, xem dưới) — ghi là **cận trên** trong toàn chuỗi.
- **Reboot #37 = 00:55:42Z — XÁC NHẬN bằng 2 tiến trình độc lập:**
  poller K9 đọc `uptime -s` đổi 22:53:56Z → 00:55:42Z lúc 00:57:04Z
  (poll.log) + K1 quiet-wait start 00:56:28Z trên boot mới
  a7bdedd2 (46 s sau reboot, wait-quiet-k1.log). Gap #36 → #37 =
  **2h01'46" — ĐƯỢC CHỨNG NHẬN** (khoảng (22:53:56Z, 00:55:42Z)
  phủ kín bởi mù #27 đã đóng + đoạn A, xem §2.3) → tập gap đơn đã
  chứng nhận tăng n=21 → **n=22**. **Số thứ tự #37/#38 vẫn là TẠM
  THỜI** (xem §2.2).
- **Khoảng mù #28: 23:40:43Z 13/11 → 02:40:36Z 14/11 (2h59'53") —
  KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này).** Lỗ thật **23'39"
  (02:01:06Z → 02:24:45Z)**: không poller/waiter nào còn chạy sau
  POLL#12 01:50:00Z; không file nào trong toàn ~/workspace + /tmp
  có mtime trong lỗ (đã tìm cả ngoài hai cây, xem §2.3 + §4 mục 1);
  parent idle (0 exec-log trong lỗ). Sàn 19'07" loại trừ reboot ẩn
  trong (02:05:38Z, 02:24:45Z), còn **khe 4'32" [02:01:06Z,
  02:05:38Z] không loại trừ được** — theo K6 §4.5 (không đóng mù
  chỉ bằng sàn), mù #28 KHÔNG đóng. Hậu quả: số reboot trong mù
  là 2 đã chốt + có thể 1 ẩn trong khe; số thứ tự #38 có thể thực
  ra là #39; gap #37 → #38 không chứng nhận được.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn
  bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật
  trong 120 file *.log có mtime trong mù #28 (0 file repo-1, 120
  file hidden_files — đếm lại độc lập từ đĩa, khớp số luồng
  trước); 19 dòng "sóng EPERM đã tắt" đều là **dương tính giả đã
  biết** (dòng launcher). Sóng gần nhất vẫn là **~11:55–12:11Z**
  (R7) — **~62h29'** trước probe #29. EPERM vẫn KHÔNG được tuyên
  bố là đã hết.
- **Quét writeFileSync chuẩn mới: 577 dòng / 174 file** (phạm vi
  2782 file); R7b đối chiếu 602 dòng / 191 file; copies 25 dòng /
  17 file; đối chiếu chéo 577+25=602=R7b, **chênh 0 — lần thứ mười
  sáu liên tiếp**. +20 dòng / +4 file so với K6, giải thích đúng
  hết bằng diff. Async `.writeFile(`: vẫn đúng **2 vị trí, cả hai
  trong helper retry đã biết** — 0 stray.
- **Dải chứng nhận [19'07", 3h14'08"] CÒN DÙNG ĐƯỢC** (min/max tập
  gap đơn đã chứng nhận không đổi sau khi thêm #36 → #37):
  n=22, trung bình 1h52'05", trung vị 1h59'16", p10–p90
  1h08'41"–2h57'18". Toàn chuỗi n=32 (thêm #36 → #37 exact +
  #37 → #38 cận trên): trung bình 2h01'58", trung vị 1h59'16" —
  xem §2.5.
- **Reboot #39 = 02:50:48Z (boot ce518c02) — quan sát được trong
  lúc giao lại** (uptime -s đo 4 lần: 02:52:10Z, 02:52:48Z,
  02:54:30Z, 03:02:18Z, đều 02:50:48Z; wtmp begins 02:50:59Z;
  journal first entry 02:51:00Z). Reboot này cắt ngang luồng L6
  trước (scan WFS chết giữa R7b + runtime "restart drain" 02:51Z)
  và cắt ngang lượt giao lại này ngay exec đầu tiên. Gap
  #38 → #39 = **26'03" — CHƯA đưa vào tập nào** (thuộc mù #29, chờ
  lượt sau đóng). Số thứ tự #39 là TẠM THỜI.
- RAM: 4 mẫu MemAvailable của lượt: **1.391.424 kB (02:40:25Z) /
  1.264.104 kB (02:40:36Z) / 1.711.320 kB (03:02:18Z) /
  3.583.852 kB (03:12:43Z)** — max **3,50 GB = 57% ngưỡng guard**.
  Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong gói.
  Reboot #16 VẪN MỞ (kẹp ~4', chờ parent/user quyết); cron riêng
  10 phút vẫn chờ user quyết.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

Luồng trước chạy checklist lúc 02:40:25–02:40:36Z trên boot
2f001e9c; luồng này (giao lại) KHÔNG chạy lại — chỉ kiểm chứng
lại từ đĩa (probe-notes.txt + log v2 + heartbeat):

| Lệnh (luồng trước) | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 02:40:25Z + 02:40:35Z | boot_id `2f001e9c-3b3a-40d1-b5e8-8bddf5120c68`; `who -b` Nov 14 02:24; `uptime -s` **2026-11-14 02:24:45Z** (2 lần, giống nhau từng giây); journal chỉ 1 boot (2f001e9c, first entry 02:25:00Z, last 02:40:11Z lúc kiểm tra); `last -x reboot` 02:24 still running; wtmp bắt đầu 02:24:59Z |
| `bash scripts/probe-eperm-v2.sh status` | 02:40:36Z | **DEAD/STALE**, exit 1 — heartbeat n=28, ts 23:40:43Z, boot ab33c58f, age **10.793 s** (đúng 2h59'53"); last sample probe #28; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 02:40:36Z | **probe #29, boot=2f001e9c, ok=2 fail=0**, exit 0; dòng `boot changed ab33c58f -> 2f001e9c` (uptime since 2026-11-14 02:24:45) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 02:40:36Z | **ALIVE**, age 0 s, n=29, exit 0 |

Kiểm lại từ đĩa (luồng giao lại, 03:14Z): log probe v2
**79 dòng** (76 sau K6 + đúng 3 dòng checklist này);
heartbeat **n=29, ts 2026-11-14T02:40:36Z, boot
2f001e9c-…** (pid=5701); log vẫn chỉ có **ĐÚNG 1 dòng
`probe start`** (08:49:50Z 11/11) và **0 dòng `=== probe end`**
— loop v2 chưa từng được start lại kể từ đợt 88.

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
(od: `x \n`) — không phải checklist P8 §2.3, như I7/J8/K6 đã đính
chính.

## 2. Điều tra khoảng mù #28 (23:40:43Z 13/11 → 02:40:36Z 14/11, 2h59'53")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #29: `uptime -s` = **2026-11-14 02:24:45Z**,
  boot_id `2f001e9c-3b3a-40d1-b5e8-8bddf5120c68` — khác boot của
  probe #28 (ab33c58f).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (luồng trước, 02:40Z): chỉ **1 boot**
  (2f001e9c, first entry 02:25:00Z, last 02:40:11Z). `last -x
  reboot`: chỉ 1 dòng (02:24, still running). wtmp bắt đầu
  02:24:59Z. Journal/wtmp của boot a7bdedd2 đã mất theo reboot
  #38 — như mọi lần trước, chỉ giữ boot hiện tại.
- Sau reboot #39 (02:50:48Z), journal/wtmp hiện tại chỉ còn boot
  ce518c02 (first entry 02:51:00Z, last 03:12:02Z lúc kiểm tra;
  wtmp begins 02:50:59Z) — bằng chứng boot 2f001e9c chỉ còn trong
  probe-notes.txt của luồng trước + file LIMITS này.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu.

### 2.2 Hai reboot đã chốt trong mù — #37 (00:55:42Z) và #38 (02:24:45Z)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 37 | **00:55:42Z (chính xác từng giây)** | ab33c58f → a7bdedd2 | **(1) Poller K9 đọc `uptime -s` trực tiếp:** poll.log dòng 16, 00:57:04Z: "uptime -s changed 2026-11-13 22:53:56Z -> 2026-11-14 00:55:42Z"; poller restart 00:57:13Z đọc lại boot=00:55:42 (POLL#1). **(2) K1 chạy trên boot mới:** wait-quiet-k1.log "k1 quiet-wait start 2026-11-14T00:56:28Z boot=a7bdedd2-…" (46 s sau reboot) + run-off-sequence-k1.sh cùng boot; K1 status: "k1off xong 00:55:13Z (trước reboot, HỢP LỆ). Reboot 00:55:42Z, boot mới a7bdedd2-1f2f-4eb0-8dc5-3898c2719b99". **(3)** build-loop-log (3 mục) + L7 prereg: "sau reboot #37 00:55:42Z". **Số thứ tự TẠM THỜI** (xem dưới). |
| 38 | **02:24:45Z (chính xác từng giây)** | a7bdedd2 → 2f001e9c | **2 phép đo `uptime -s` độc lập trên boot mới** (luồng trước, 02:40:35Z + 02:40:36Z, giống nhau từng giây) + `who -b` 02:24 + boot_id 2f001e9c + journal first entry 02:25:00Z + wtmp begins 02:24:59Z (đều ghi trong probe-notes.txt lúc 02:40Z). **Nguồn độc lập thứ ba (mới, lượt này):** exec-log của parent lúc 02:36:55Z (`ps aux`): systemd PID 1 START **02:24**, systemd-journald START 02:24, hatch daemon START 02:24 (minute-granularity, khớp 02:24:45Z). L7 prereg: "boot hiện tại 2026-11-14 02:24:45Z — sau reboot #37 00:55:42Z, nhiều khả năng là reboot #38, chưa xác nhận số thứ tự từ nguồn độc lập nên mọi ghi chép dùng boot time" — L7 đồng ý cách đánh số này. **Số thứ tự TẠM THỜI** (xem dưới). |

Gap #36 → #37 = **2h01'46" — ĐƯỢC CHỨNG NHẬN** (xem §2.3, đoạn
A + mù #27 đã đóng); gap #37 → #38 = **1h29'03" — KHÔNG ĐƯỢC
CHỨNG NHẬN** (chứa lỗ §2.3, ghi là cận trên trong toàn chuỗi).

**Tính tạm thời của số thứ tự (ghi rõ, không giấu):** #37/#38
đúng giờ nhưng số thứ tự kế thừa tính tạm thời từ mù #26 và mù
#24 chưa đóng hoàn toàn (J8 §2.3, §5 mục 1–2) **và từ chính mù
#28 chưa đóng (lỗ 23'39", xem §2.3)**: nếu khe 4'32"
[02:01:06Z, 02:05:38Z] chứa 1 reboot ẩn thì "reboot #38" thực tế
là #39, và "reboot #39" (02:50:48Z) thực tế là #40. **Giá trị
gap #36 → #37 không phụ thuộc số thứ tự** — chỉ phụ thuộc giờ đã
chốt — nên gap này vẫn được tính vào tập gap đơn đã chứng nhận
(n=22) bất kể số thứ tự có dịch chuyển sau này hay không. Gap
#37 → #38 thì KHÔNG được tính (khoảng của nó chứa lỗ).

### 2.3 Hoạt động trong khoảng mù — vì sao KHÔNG ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **18 file**
(không tính dist/node_modules) + hidden_files **493 file** (không
tính chrome-userdata); 506 mốc giây phân biệt trong cửa sổ
(đếm lại từ blind28-repo.txt + blind28-hf.txt của luồng trước,
gộp + sort — file blind28-all.txt). Chia mù làm ba đoạn bởi #37
(00:55:42Z) và #38 (02:24:45Z):

- **Đoạn A: 23:40:43Z → 00:55:42Z (1h14'59", boot ab33c58f) —
  ĐÓNG bằng loại trừ trực tiếp:**
  - **Poller K9 (10 phút) là kẹp trực tiếp:** POLL#0 23:40:25Z →
    POLL#8 00:52:23Z (**9 mục, đều boot 22:53:56Z, max gap
    10'01"** — đọc từ nội dung poll.log, không phải mtime).
    Một reboot ẩn trong đoạn này phải giết poller hoặc đổi
    `uptime -s` ở lần poll sau — không, nó poll đều suốt 72'.
  - Đuôi đoạn: K1 k1off xong **00:55:13Z trên boot cũ** (K1
    status) — tiến trình cũ sống tới 29 s trước #37.
  - **Khe 29 s [00:55:13Z, 00:55:42Z] đóng bằng sàn** (ghi rõ:
    đây là lập luận sàn, không phải quan sát trực tiếp): một
    reboot ẩn trong khe này phải đi kèm reboot #37 chỉ ≤29 s
    sau đó — phá sàn 19'07" (min trên 32 gap). Cùng mẫu K6 đã
    dùng cho #35 (khe 1 s: run21 G4-probe 21:42:40.391Z, 1 s
    trước #35).
  - Kết luận đoạn A: **ĐÓNG**. Khoảng (22:53:56Z, 00:55:42Z) phủ
    kín bởi mù #27 đã đóng (tới 23:40:43Z) + đoạn A → gap
    #36 → #37 = 2h01'46" **ĐƯỢC CHỨNG NHẬN**.
- **Đoạn B: 00:55:42Z → 02:24:45Z (1h29'03", boot a7bdedd2) —
  ĐÓNG MỘT PHẦN, còn lỗ 23'39":**
  - **Poller K9 restart 00:57:13Z sau #37:** POLL#1 00:57:13Z →
    POLL#4 01:27:13Z (10-phút) + POLL#9 01:13:00Z, POLL#10
    01:20:00Z, POLL#11 01:36:00Z, POLL#12 **01:50:00Z** (poller
    thứ hai, ~7–14 phút) — tất cả đều boot 00:55:42Z, "K9 DONE"
    ở POLL#12. Một reboot ẩn trước 01:50:00Z phải đổi boot đọc
    được — không.
  - Sau POLL#12: file hạ cánh 01:54:18Z (PHASE9_GAP_ANALYSIS.md
    + PHASE9_ROUND109_LIMITS.md — parent đóng đợt 109) +
    shim-count.log 01:59:18Z (1 byte, chỉ mtime, không nội dung
    timestamp) + **build-loop-log.md 02:01:06Z (mtime cuối cùng
    trong hai cây — parent viết closing đợt 109)**.
  - **LỖ 23'39" (02:01:06Z → 02:24:45Z): KHÔNG CÓ OBSERVER NÀO.**
    Đây là lỗ THẬT, không phải lỗ mtime ảo — đã kiểm chứng bằng
    4 cách (xem §4 mục 1): (a) đọc nội dung poll.log (mục cuối
    01:50:00Z, poller đã exit sau "ALL 8 FLAGS"); (b) find toàn
    ~/workspace ngoài hai cây trong [02:01:06Z, 02:40:36Z] chỉ
    ra đúng 1 file — exec-log của parent lúc **02:36:55Z** (SAU
    lỗ, trên boot 2f001e9c, không lấp lỗ); (c) /tmp: 0 file trong
    lỗ; (d) ~/workspace/agents/: 0 file trong lỗ (parent idle,
    không chạy exec nào 02:01–02:24Z; session dir của parent
    lượt này chỉ được tạo 02:36Z).
  - Các "lỗ mtime" nhỏ hơn trong đoạn B đều là ẢO (đã đọc nội
    dung, theo bài học K6): lỗ *.log 17'53" (00:55:17Z →
    01:13:10Z, không file *.log nào) được lấp bằng nội dung
    poller (POLL#1 00:57:13Z, POLL#2 01:07:13Z); 3 lỗ mtime
    >5' (366,7 s lúc 01:00:31→01:06:38Z; 313,5 s lúc
    01:21:01→01:26:15Z; 346,9 s lúc 01:27:08→01:32:55Z) đều
    được lấp bằng nội dung poller (POLL#2 01:07:13Z, POLL#9
    01:13:00Z, POLL#10 01:20:00Z, POLL#3 01:17:13Z, POLL#4
    01:27:13Z).
  - **Phân tích sàn cho lỗ 23'39":** reboot ẩn tại t trong
    (02:01:06Z, 02:24:45Z) cho gap1 = t − 00:55:42Z ∈
    (1h05'24", 1h29'03") — luôn > sàn 19'07" (không loại trừ
    được); gap2 = 02:24:45Z − t < 19'07" ⟺ t > 02:05:38Z. Nên
    sàn loại trừ reboot ẩn trong **(02:05:38Z, 02:24:45Z)**
    (19'07"), còn **khe [02:01:06Z, 02:05:38Z] (4'32") không
    loại trừ được** — trong khe này cả hai gap đều ≥ sàn
    (gap1 1h05'24"–1h09'56", gap2 19'07"–23'39").
  - Kết luận đoạn B: **KHÔNG ĐÓNG** — lỗ 23'39", trong đó
    19'07" loại trừ bằng sàn, 4'32" không loại trừ được bằng
    bất cứ bằng chứng nào còn tồn tại.
- **Đoạn C: 02:24:45Z → 02:40:36Z (15'51", boot 2f001e9c) — ĐÓNG
  bằng đo uptime trực tiếp:** `uptime -s` = 02:24:45Z đo lúc
  02:40:35Z + 02:40:36Z chứng minh máy up liên tục từ 02:24:45Z;
  cộng thêm ps aux của parent lúc 02:36Z (systemd PID 1 START
  02:24) + spawn đợt 110 02:35:51Z + L6 start 02:40:25Z, tất cả
  trên boot 2f001e9c. Không cần hoạt động lấp.

**Kết luận trung thực: khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN.**
Đúng 2 reboot đã chốt giờ (#37 00:55:42Z, #38 02:24:45Z) + có thể
1 reboot ẩn trong khe 4'32" [02:01:06Z, 02:05:38Z]. Đây là mù
thứ ba liên tiếp không đóng hoàn toàn sau #24 và #26 (chuỗi đóng
#25 → #27 bị cắt). **Điều kiện duy nhất để đóng là dữ liệu trong
khe 4'32" — không còn nguồn nào để tìm** (journal/wtmp volatile
chỉ giữ boot hiện tại; không syslog/kern.log; toàn workspace +
/tmp + agents/ đã tìm hết). K6 không tự quyết thêm — parent/user
quyết xem có chấp nhận "ít nhất 2 reboot, có thể 3" làm mức đóng
của mù #28 hay để mở như mù #24/#26.

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 109 + spawn đợt 110

Khoảng mù 23:40:43Z 13/11 → 02:40:36Z 14/11 (2h59'53") được phủ
bởi các luồng sibling đợt 109 (K1–K9, làm việc tới ~01:54Z) +
parent đóng đợt (tới 02:01:06Z) + spawn đợt 110 (02:35:51Z).
Đã đọc lại log thật — **đếm lại độc lập từ đĩa** (grep trên đúng
120 file *.log có mtime trong mù #28 — 0 file repo-1, 120 file
hidden_files, trừ chrome-userdata; khớp số luồng trước):

| Mẫu | Số dòng | Kết luận |
|---|---|---|
| `sóng EPERM vẫn bật` | **0** | Không có sóng đang bật trong log còn tồn tại |
| `CẢNH BÁO` (10-phút wave warning) | **0** | Không có cảnh báo nào |
| `Operation not permitted` | **0** | Không có lỗi EPERM thật nào |
| `sóng EPERM đã tắt` | **19** | Tất cả đều là dòng launcher — **dương tính giả đã biết** |

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5, J8
§2.4, K6 §2.4):** cả 19 dòng đều có dạng `[timestamp] sóng EPERM
đã tắt, khởi động vite` — in khi lần ghi thử ĐẦU TIÊN thành công
ngay (code launcher `waveOff=true` ở lần write đầu) — in mặc định
cả khi không có sóng. Bằng chứng phân biệt: **0 dòng "sóng EPERM
vẫn bật sau …s chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM 10
phút"** trong toàn bộ 120 log; **0 lần "Operation not permitted"
thật**. Các dòng "đã tắt" rải 23:48:19Z → 00:14:32Z (vite khởi
động thành công ngay của K2/K4/K5/K7).

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng lần này, khác mù #27, **có một lỗ quan
  sát về reboot** (23'39", §2.3) nên một sóng ngắn trong lỗ đó
  cũng không có nhân chứng vite nào. Ngoài lỗ đó: vite khởi động
  thành công ngay ở 23:48–00:14Z (nhiều lần), 00:43Z, 00:48Z,
  00:50Z, 00:53Z, 00:54Z, 01:13Z, 01:15Z, 01:17Z, 01:45–01:48Z
  (O8 của K9, 2 engine). Một sóng dài ~16' kiểu R7 chỉ có thể
  lọt vào khe 23'39" của lỗ (02:01:06–02:24:45Z) mà không để lại
  dấu — khả năng thấp, không loại trừ tuyệt đối được.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~62h29'** trước
  probe #29 (tính từ cuối sóng ~12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #29 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 02:40:36Z ghi được.

### 2.5 Phân phối gap cập nhật — dải chứng nhận CÒN DÙNG ĐƯỢC

Gap mới được chứng nhận: #36 → #37 = 2h01'46" (7306 s). Gap mới
chưa chứng nhận: #37 → #38 = 1h29'03" (5343 s) — ghi là **cận
trên** trong toàn chuỗi (mù #28 chưa đóng). Tính lại từ bảng J8
§2.5.3 + 2 gap K6 + 2 gap mới, bằng code (percentile tuyến tính,
index = p·(n−1) — cùng phương pháp J8/K6). **Kiểm tra chéo: tính
lại n=21 ra đúng 100% số K6** (trung bình 1h51'38", trung vị
1h58'47", p10 1h08'24", p90 3h01'21") **và tính lại toàn chuỗi
n=30 ra đúng 100% số K6** (trung bình 2h03'04", trung vị
1h59'16", p10 48'18", p90 3h06'06", sd 65,8') — nên số mới dưới
đây đáng tin ở cùng mức:

| Thống kê | Toàn bộ n=32 | Chỉ gap đơn đã chứng nhận n=22 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, CẬN TRÊN)** | **3h14'08" (#26 → #27)** |
| Trung bình | 2h01'58" | 1h52'05" |
| Trung vị | 1h59'16" | 1h59'16" |
| Độ lệch chuẩn (mẫu) | 1h03'55" (CV 0,53) | 43'58" |
| p10 | 51'50" | 1h08'41" |
| p90 | 3h05'08" | 2h57'18" |

Đọc thêm: 17/32 gap (53%) nằm trong 90'–150'; 4 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
**Dải chứng nhận [19'07", 3h14'08"] đứng vững trên tập gap đơn
đã chứng nhận (n=22)** — min/max không đổi sau khi thêm gap mới
(p10/p90 dịch nhẹ do nội suy: p10 1h08'24" → 1h08'41", p90
3h01'21" → 2h57'18"). Cảnh báo J8 vẫn đứng: dải này đã bị vượt
2 lần bởi các gap chưa chứng nhận (#11 → #12 4h10'33",
#33 → #34 5h43'18") — nó là phát biểu về các gap đơn đã biết,
không phải bảo đảm. (#31 → #32 3h05'12" cũng là cận trên nhưng
NẰM TRONG dải nên không tính là vượt.) **Không đưa dự báo điểm cho #39 hay reboot nào sau đó**
— chỉ dải cơ học áp lên #38 (02:24:45Z): **[02:43:52Z,
05:38:53Z 14/11]**; p10–p90 toàn chuỗi → [03:16'Z, 05:30'Z].
**Reboot #39 đã xảy ra 02:50:48Z — NẰM TRONG dải cơ học này**
(gap #38 → #39 = 26'03", cũng nằm trong dải chứng nhận; nhưng
gap này CHƯA chứng nhận vì thuộc mù #29 chưa đóng — xem §2.6).

### 2.6 Reboot #39 (02:50:48Z) — quan sát trong lúc giao lại, thuộc mù #29

- `uptime -s` = **2026-11-14 02:50:48Z**, đo **4 lần** (02:52:10Z,
  02:52:48Z, 02:54:30Z, 03:02:18Z — đều giống nhau từng giây);
  boot_id `ce518c02-0368-46f4-8416-d61e7d042d84`; `who -b` Nov 14
  02:50; journal first entry 02:51:00Z; wtmp begins 02:50:59Z.
- Reboot này cắt ngang **luồng L6 trước** (scan WFS lần 1 chết
  giữa R7b lúc ~02:51Z + runtime "restart drain in progress") và
  cắt ngang **chính lượt giao lại này** ngay exec đầu tiên
  (02:52:10Z đã thấy boot mới).
- Tiến trình cũ sống sót sau reboot: file của luồng trước có
  mtime tới 02:51Z (files-r7b.bin, wfs-r7b.txt, scan-meta.txt) —
  phù hợp bài học K6 (tiến trình cũ sống sót ~29 s sau reboot;
  02:50:48Z + ~29 s ≈ 02:51:17Z).
- Sau reboot, các luồng đợt 110 tự hồi phục trên boot mới (dir
  round110-* có mtime 02:52–02:59Z trên boot ce518c02).
- Gap #38 → #39 = **26'03"** (02:24:45Z → 02:50:48Z) — nằm trong
  dải chứng nhận nhưng **CHƯA đưa vào tập gap đơn đã chứng nhận**:
  nó thuộc mù #29 (02:40:36Z → probe #30), chờ lượt sau đóng mù
  #29 mới xét. Số thứ tự #39 là TẠM THỜI (kế thừa từ #38).
- Tốc độ reboot cập nhật: **39 reboot đã chốt giờ / 78,54h** (từ
  ~20:18:10Z 10/11 tới 02:50:48Z 14/11) = **1 lần / 120,8'
  (2,01h)**; nếu khe 4'32" chứa thêm 1 reboot ẩn thì 40 lần /
  78,54h = 1 lần / 117,8'.

### 2.7 Quét writeFileSync (snapshot 02:52:48–02:53:04Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round110-l6`. **Lưu ý:** lần chạy đầu của luồng trước
(02:50:06Z) bị reboot #39 giết giữa R7b (wfs-r7b.txt 0 byte,
không có SCAN-END); lần chạy lại này (02:52:48–02:53:04Z, 16 s)
chạy trọn vẹn trên boot mới. Kết quả NEWSTD của 2 lần chạy
**khớp nhau 100%** (174 file / 577 dòng) — số đếm không hỏng vì
reboot. Tính lại từ file wfs-*.txt + files-*.bin gốc, khớp 100%
scan-meta.txt.

- Chuẩn mới: **577 dòng / 174 file** (phạm vi 2782 file).
  K6: 557 dòng / 170 file (phạm vi 2765 file).
- R7b (đối chiếu): **602 dòng / 191 file**. K6: 582 / 187.
- Copies: **25 dòng / 17 file** — y hệt K6, J8, I7, H7, G8 và F7.
- Đối chiếu chéo 577+25=602=R7b, **chênh 0 — lần thứ mười sáu
  liên tiếp**. Tổng hit trên cả 3 bảng: 577+602+25 = **1.204 dòng**.
- **+20 dòng / +4 file so với K6, giải thích đúng hết bằng diff
  hit list** (không có dòng nào tăng trong file cũ ngoài
  GAP_ANALYSIS, không file nào giảm):
  - +1 `PHASE9_GAP_ANALYSIS.md` (18 → 19 — mục tóm tắt đợt 109
    mới thêm, 01:54:18Z)
  - +7 `apps/web/scripts/probe110l3-frame-parity.mjs` (L3 đợt 110
    — file mới, sibling đang chạy)
  - +5 `apps/web/scripts/probe110l4-frame-parity.mjs` (L4 đợt 110
    — file mới, sibling đang chạy)
  - +6 `docs/PHASE9_ROUND109_K6_EPERM_LIMITS.md` (file LIMITS của
    chính K6 — 00:07:07Z, sau snapshot K6 23:50:49Z)
  - +1 `docs/PHASE9_ROUND109_LIMITS.md` (closing đợt 109,
    01:54:18Z)
  - Tổng: 1+7+5+6+1 = **20** ✓, 4 file mới có hit ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets). Đếm lại trực tiếp sau scan: GAP_ANALYSIS đúng 19,
    probe110l3 đúng 7, probe110l4 đúng 5, K6 LIMITS đúng 6,
    round109 LIMITS đúng 1.
- **0 file biến mất khỏi hit list** (chỉ GAP_ANALYSIS đổi số đếm
  18 → 19).
- Scope: **+17 file mới / −0 file** so với K6 (2782 = 2765+17 ✓):
  17 file mới = 4 file hit trên + 13 file không hit (11 LIMITS
  đợt 108/109 — J9 addendum + K1–K9 + round109 LIMITS — +
  `apps/web/vite.config.l7-temp.ts` (L7) +
  `benchmarks/render/k2_offsets_109.py` +
  `benchmarks/render/l2_offsets_110.py` +
  `benchmarks/render/webkit_blob_flaky_110l2_2mib.mjs`).
  Comm hai chiều khớp đúng (17 = 4+13 ✓).
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt K6 — xem files-copies.txt).
- **Race trong cửa sổ scan (ghi rõ, không giấu):** các sibling
  đợt 110 vẫn đang chạy; 2 file probe110l3/l4 đã hạ cánh trước
  khi scan bắt đầu (đếm lại trực tiếp sau scan khớp số trong
  wfs-newstd.txt — không hỏng số đếm). Sibling đợt 110 vẫn đang
  chạy nên lượt sau cần đối chiếu lại.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2782 file), NUL-safe, chạy từ trong repo-1 — chỉ đúng 2 hit
trong code (đếm lại độc lập, không tin mù file cũ):

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z). Kết luận giữ nguyên
như K6: **2 async call site, cả 2 đều thuộc helper retry đã biết
với cùng hợp đồng EPERM-only + verify byte — không phải write
async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

4 mẫu MemAvailable của lượt: **1.391.424 kB (02:40:25Z, luồng
trước, trước probe #29) / 1.264.104 kB (02:40:36Z, sau probe #29)
 / 1.711.320 kB (03:02:18Z) / 3.583.852 kB (03:12:43Z)** —
~1,36 / 1,24 / 1,67 / **3,50 GB**. Mức max 3,50 GB bằng **57%
ngưỡng guard 6144 MB** — máy đã yên dần khi các luồng đợt 110
xong việc + sau reboot #39 (load hạ). Max RAM biết được trong mù
#28 từ log sibling: **1255 MB** (K5, ram-avail trong run-k5.log —
dòng không kèm timestamp; K5 chạy 23:51–00:19Z trong mù) và
617.964 kB (K6, lúc probe #28); không mẫu nào trong mù #28 tiến
gần ngưỡng. Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3
mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥
6 GB mới thử lại). Birefnet-general vẫn **0 lần chạy thành công**
trong gói.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Lỗ mù phải kiểm chứng 4 lớp trước khi tuyên bố (mới, lượt
   này — xem §2.3):** (a) mtime find trong hai cây để xác định
   lỗ; (b) **đọc NỘI DUNG** các file log append chạm biên lỗ
   (poll.log — mục cuối 01:50:00Z, poller đã exit); (c) **tìm
   ngoài hai cây**: find toàn ~/workspace (không prune) + /tmp +
   ~/workspace/agents/ + repo-1-push/user/goals trong đúng cửa
   sổ lỗ; (d) **số học sàn** để bound khe không loại trừ được
   (khe 4'32" — tính gap1/gap2 theo t). Lỗ 23'39" lần này qua
   cả 4 lớp vẫn là lỗ thật — ngược với lỗ mtime 53'48" của K6
   (chỉ qua lớp (a) thì tưởng là lỗ, đọc nội dung lớp (b) mới
   biết là ảo). **Quy tắc K6 giữ nguyên và mở rộng: mọi kết
   luận "lỗ" phải qua cả 4 lớp, và phải ghi rõ khe còn lại sau
   mỗi lớp.**
2. **`ps aux` của parent là nguồn độc lập thứ ba cho giờ reboot
   (mới, lượt này — xem §2.2):** exec-log của parent lúc 02:36:55Z
   chứa snapshot `ps aux` ghi systemd PID 1 START 02:24 —
   minute-granularity, khớp `uptime -s` 02:24:45Z. Exec-log của
   runtime (`~/workspace/agents/*/exec-logs/*.log`) là nguồn
   bằng chứng thường trực mà các lượt trước chưa khai thác: nó
   ghi cả lệnh + output + mtime của mọi exec — kể cả exec của
   parent/main-agent ngoài hai cây giám sát.
3. **Chốt giờ reboot bằng `uptime -s` trên boot mới, đo 2 lần —
   KHÔNG dùng mtime file cuối của boot cũ** (K6 §4 mục 2, nhắc
   lại): tiến trình boot cũ sống sót tới ~29 s sau reboot
   (file luồng trước có mtime 02:51Z sau reboot #39 02:50:48Z —
   trường hợp thật thứ hai sau run21 của J7).
4. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
   reboot** (J8 §4 mục 1, nhắc lại): đừng bao giờ đếm reboot chỉ
   bằng `grep "boot changed"` trên log probe; chuỗi đánh số chính
   thức nằm trong các file LIMITS EPERM theo đợt.
5. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (J8 §4 mục 2, nhắc
   lại): dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn
   đã chứng nhận (n=22) sau lượt này; trên toàn chuỗi vẫn có 2
   gap vượt (đều là cận trên).
6. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
   bằng sàn** (H7 §4 mục 1, nhắc lại + áp dụng mới): sàn 19'07"
   vẫn đứng sau lượt này, nhưng mù #28 KHÔNG đóng được chính vì
   khe 4'32" chỉ còn sàn làm chỗ dựa — sàn loại trừ được 19'07"
   của lỗ nhưng không loại trừ được 4'32" còn lại. Sàn là công cụ
   bound, không phải bằng chứng đóng.
7. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
   poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ 23'39",
   toàn ~/workspace ngoài hai cây chỉ có 0 file (1 file duy nhất
   trong cửa sổ rộng hơn là exec-log của parent lúc 02:36:55Z,
   SAU lỗ) — parent idle 02:01–02:35Z không để lại dấu nào;
   poller K9 đã exit lúc 01:27:13Z ("ALL 8 FLAGS") nên không còn
   observer thường trực nào sau 01:50:00Z.
8. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
   4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
   vị trí đã biết trước khi kết luận.
9. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8, nhắc lại):** lượt này 19 dòng "đã tắt" trong mù #28
   đều là dương tính giả (launcher); 0 dòng "vẫn bật", 0
   "Operation not permitted" thật.
10. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9 / J8 §4 mục 9):
    lượt này probe + quét xong là ghi LIMITS/batch ngay, không đợi
    luồng khác — reboot #39 (02:50:48Z) đã cắt ngang luồng trước
    giữa chừng; lượt giao lại cũng bị cắt ngay exec đầu tiên.
    File blind28-*.txt + scan-*.txt của luồng trước đã cứu lượt
    giao lại khỏi làm lại từ đầu — **ghi scratch sớm, ghi rõ cửa
    sổ/không ghi rõ thì lượt sau không dùng được** (file
    blind28-hole-outside-trees.txt 0 byte của luồng trước không
    ghi cửa sổ nên L6 phải tìm lại từ đầu — xem §4 mục 1).
11. **Đếm *.log sóng EPERM phải quét cả hai cây** (J8 §4 mục 10,
    nhắc lại): lần này 120 file đều nằm ở hidden_files (0 file
    repo-1). Quét một cây sẽ kết luận sai là "không có log".
12. **Scan writeFileSync có thể bị reboot cắt ngang giữa chừng
    (mới, lượt này):** lần chạy đầu chết giữa R7b (wfs-r7b.txt 0
    byte, không SCAN-END); chạy lại toàn bộ script trên boot mới
    cho kết quả NEWSTD khớp 100% lần chạy dở — số đếm không hỏng,
    nhưng các lượt sau nên kiểm tra SCAN-END trước khi tin
    scan-meta.txt.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** lỗ thật 23'39" (02:01:06Z → 02:24:45Z); sàn loại trừ
   được 19'07", còn khe 4'32" [02:01:06Z, 02:05:38Z] không loại
   trừ được — có thể chứa 1 reboot ẩn. Số reboot trong mù: 2 đã
   chốt (#37 00:55:42Z, #38 02:24:45Z) + có thể 1 ẩn. **Số thứ tự
   #37/#38 vẫn TẠM THỜI** — parent/user quyết xem có chấp nhận
   "ít nhất 2 reboot, có thể 3" làm mức đóng của mù #28 hay để mở
   như mù #24/#26. L6 không tự quyết. Gap #37 → #38 = 1h29'03"
   KHÔNG được chứng nhận (cận trên); gap #36 → #37 = 2h01'46"
   ĐƯỢC chứng nhận (n=22).
2. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
   1): lỗ 1h13'58" (19:20:19Z → 20:34:17Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#34), có thể nhiều hơn
   — không xác định được; số thứ tự #34 là TẠM THỜI. Không còn
   dữ liệu nào để thu hẹp thêm — parent/user quyết. L6 không tự
   quyết. Probe #29 không đóng được mù #26 hồi tố.
3. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1): lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#32), có thể nhiều hơn
   — không xác định được; số thứ tự #32/#33/#34/#35/#36/#37/#38
   là TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm —
   parent/user quyết. L6 không tự quyết.
4. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
   gian. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết. L6 không tự quyết.
5. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
   §6 mục 3): cửa sổ lý thuyết ≤78 s với sàn 19'07". L6 không thử
   lại, không tự quyết — parent/user quyết giữ "đóng", "đóng có
   điều kiện", hay mở lại. **Khoảng mù #23 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận G8). **Khoảng mù #25 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận I7). **Khoảng mù #27 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận K6). **Khoảng mù #28 nay KHÔNG ĐÓNG HOÀN
   TOÀN** (mới, lượt này).
6. **Khoảng mù #29 BẮT ĐẦU từ 02:40:36Z** (probe #29) — lượt sau
   (probe #30) đối chiếu từ mốc này, trên boot 2f001e9c (#38,
   từ 02:24:45Z, số thứ tự tạm thời). **Reboot #39 = 02:50:48Z
   (boot ce518c02) đã xảy ra trong mù #29** (gap #38 → #39 =
   26'03", chưa chứng nhận — chờ lượt sau đóng mù #29 mới xét;
   dải cơ học cho #39 từ #38 là [02:43:52Z, 05:38:53Z] — #39 nằm
   trong dải).
7. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3,
   F7 §6 mục 4, G8 §6 mục 5, H7 §6 mục 5, I7 §5 mục 6, J8 §5 mục
   5, K6 §5 mục 6): lệnh cron chỉ là `bash
   ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài giây,
   không giữ tiến trình nền). L6 KHÔNG tự tạo, KHÔNG start loop
   nền. Bằng chứng mới: mù #28 không đóng được LÀ VÌ poller K9
   đã exit lúc 01:27:13Z và không còn observer thường trực nào
   sau 01:50:00Z — trường hợp này khác mù #27 (đóng được NHỜ
   poller/waiter của sibling chạy xuyên suốt).
8. **Mô hình dự báo điểm ĐÃ BỎ — KHÔNG ĐỔI** (J8 §2.5, §5 mục 6):
   không đưa dự báo điểm cho #40 hay reboot nào sau đó; thay bằng
   dải chứng nhận [19'07", 3h14'08"] + p10–p90 thực nghiệm + đo
   uptime trực tiếp + poller. Dải cơ học cho #40 từ #39 (02:50:48Z):
   **[03:09:55Z, 06:04:56Z 14/11]** — là phép áp dải máy móc,
   không phải dự báo.
9. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
   và các lượt sau; log tăng đúng 3 dòng checklist, 76 → 79 —
   không thêm dòng lạ mới trong lượt này.)
10. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
    đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
    được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
    cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
11. **VM reboot ~1 lần / 2h00'50"** (39 lần đã chốt giờ / 78,54h từ
    ~20:18:10Z 10/11 tới 02:50:48Z 14/11, số thứ tự tạm thời — xem
    §2.2 + §2.6; nếu khe 4'32" chứa thêm 1 reboot ẩn thì 40 lần /
    78,54h = 1 lần / 117,8'): mọi probe nền đều chết theo reboot;
    v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi phục bằng
    1 mẫu mới.
12. **Birefnet: KHÔNG chạy trong lượt này** — RAM 4 mẫu MemAvailable
    **1.391.424 / 1.264.104 / 1.711.320 / 3.583.852 kB**
    (~1,36 / 1,24 / 1,67 / 3,50 GB); max 3,50 GB = 57% guard
    6144 MB. Birefnet-general vẫn 0 lần chạy thành công trong gói.
13. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
14. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
15. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    L6 không thử lại nguồn nào, theo đúng lệnh.
16. **Đính chính phương pháp (mới, lượt này):** (a) file
    blind28-hole-outside-trees.txt (0 byte) của luồng trước không
    ghi cửa sổ kiểm tra nên không dùng được làm bằng chứng — L6
    đã tìm lại độc lập với cửa sổ ghi rõ (blind28-hole-outside-
    trees-l6.txt); (b) dải cơ học K6 cho #37 [23:13:03Z,
    02:08:04Z] đã bao đúng #37 (00:55:42Z); (c) L7 prereg đồng ý
    cách đánh số #37 = 00:55:42Z, #38 = 02:24:45Z (tạm thời).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND110_L6_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round110-l6-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round110-l6/`
(probe-notes.txt, scan-meta.txt, scan-wfs.sh, scan-wfs-run.log,
files-newstd.bin, wfs-newstd.txt, files-r7b.bin, wfs-r7b.txt,
files-copies.txt, wfs-copies.txt, blind28-repo.txt, blind28-hf.txt,
blind28-all.txt, blind28-logfiles.txt, blind28-logfiles-hf.txt,
blind28-logfiles-repo.txt, blind28-wave-hits.txt,
blind28-hole-outside-trees.txt, blind28-hole-outside-trees-l6.txt,
blind28-gaps.txt) + log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

Tổng chờ push: chưa đếm lại trong lượt này (sibling đợt 110 vẫn
đang chạy; parent đếm lại khi đợt 110 đóng băng — K9 đếm đợt
106–109 là 38 batch / 74 entry / 72 file duy nhất + 1 file
oversize; đợt 110 cộng thêm sau).
