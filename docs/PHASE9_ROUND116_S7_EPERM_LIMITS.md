# PHASE9 ROUND116 S7 — EPERM: probe #35 + mù #34 ĐÓNG HOÀN TOÀN + WFS lần 22 chênh 0

> Luồng S7, đợt 116 vòng lặp Phase 9 VCut Studio (lượt cron 03:35 +07,
> 15/11/2026; làm việc 21:03Z → 21:19Z 14/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + xác định reboot
> #47/#48 trong mù #34 kể từ probe #34 (17:45:02Z) + quét sóng EPERM +
> quét writeFileSync lần thứ 22 + ghi RAM (birefnet: KHÔNG chạy —
> vẫn dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round116-s7/prereg-s7.md (định nghĩa probe #35, mốc đối
> chiếu, tiêu chí đóng mù #34, cách xử lý sàn đoạn A/B/C).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #31, mù #30, mù #29, mù #28,
> mù #26, mù #24, mù #21, hay reboot #16** — chỉ báo cáo "không thấy"
> vs "không có". Mù #31 KHÔNG thử lại (đã thử hết nguồn ở đợt 114).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (21:04:38Z → 21:04:50Z):**
  `status` báo **DEAD/STALE** (heartbeat age 11.982 s, last #34
  17:45:02Z, boot 7a0638c4, exit 1 theo quy định script — exit lấy từ
  `$?` trực tiếp, không qua pipe, xem §1); `once` ngay sau đó là
  **probe #35, boot 0c2a9f2f (ĐỔI), ok=2 fail=0**, exit 0; `status`
  chạy lại **ALIVE** (age 9 s, n=35), exit 0. Log v2 tăng đúng **3
  dòng** checklist (94 → 97): dòng DEAD mới cho heartbeat #34 +
  dòng `boot changed` + dòng probe #35 — **như R7 (+3) vì lượt này
  chưa có dòng DEAD nào cho #34** (dòng DEAD cuối trước đó là cho
  #33, 17:45:02Z); prereg §1 đã dự báo đúng +3 trước khi đo.
  Heartbeat nay n=35, ts 21:04:50Z, boot 0c2a9f2f.
- **Khoảng mù #34: 17:45:02Z → 21:04:50Z (3h19'48") — ĐÓNG HOÀN TOÀN
  (mới, lượt này).** Đoạn A (48 s tới #47) **ĐÓNG** bằng số học sàn +
  đoạn B của mù #33 đã đóng (xem §2.3). Đoạn B (1h57'56", boot #47)
  **ĐÓNG** bằng poller R5 v2 MỘT tiến trình duy nhất (21 poll,
  300/301 s đều, 18:03:35Z → 19:43:40Z) + dấu boot tươi R9/R3/R2 +
  6 session bắc qua cắt sàn 18:04:57Z + 4 session bắc qua cắt sàn
  19:24:39Z + sàn đóng đầu/đuôi. Đoạn C (sau #48) **ĐÓNG** bằng đo
  uptime trực tiếp ×2 lúc 21:04:38Z (= 19:43:46Z) + probe #35 +
  dấu boot tươi của S3/S5/S8/S10. Không còn cửa sổ mở nào. **Đây là
  mù thứ ba liên tiếp đóng hoàn toàn** (#32, #33, #34) — lần đầu có
  3 mù đóng liên tiếp kể từ #27.
- **Gap #46 → #47 = 2h01'01" — ĐƯỢC CHỨNG NHẬN (mới, lượt này).**
  Khoảng (15:44:49Z, 17:45:50Z) không chứa cửa sổ mở nào (phần
  (15:44:49Z, 17:45:02Z] đã đóng bởi mù #33 đoạn B ở R7; đuôi 48 s
  đóng bằng số học sàn — xem §2.5).
- **Gap #47 → #48 = 1h57'56" — ĐƯỢC CHỨNG NHẬN (mới, lượt này).**
  Khoảng (17:45:50Z, 19:43:46Z) không chứa cửa sổ mở nào (mù #34
  đoạn B đã đóng kín — chứng nhận theo khoảng như #44 → #45,
  #45 → #46). Tập gap đơn đã chứng nhận tăng **n=25 → n=27**;
  toàn chuỗi **n=40 → n=42** (xem §2.5). Dải chứng nhận
  [19'07", 3h14'08"] không đổi (cả hai gap mới đều nằm giữa).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn
  bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật
  trong 137 file *.log có mtime trong mù #34 (0 file repo-1,
  137 file hidden_files — đếm lại độc lập từ đĩa); 8 dòng "sóng
  EPERM đã tắt" đều là **dương tính giả đã biết** (dòng launcher:
  R1 run-r1.log 6× đoạn B, R10 r10-o8.log 2× đoạn C). Quét mở rộng
  `/eperm|not permitted/i`: 14 dòng, 6 dòng còn lại đều là tên
  test "hasEperm phân biệt EPERM với port conflict" (pass) — không
  phải lỗi thật. Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) —
  **~80h54'** trước probe #35. EPERM vẫn KHÔNG được tuyên bố là
  đã hết.
- **Quét writeFileSync lần 22: 708 dòng / 200 file** (phạm vi
  2874 file); R7b đối chiếu 733 dòng / 217 file; copies 25 dòng /
  17 file — y hệt lần 21; đối chiếu chéo 708+25=733=R7b, **chênh 0
  — lần thứ hai mươi hai liên tiếp**. +28 dòng / +4 file so với lần
  21, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí, cả hai trong helper retry
  đã biết** — 0 stray; mtime 2 helper không đổi từ 10/11.
- **Dải chứng nhận [19'07", 3h14'08"] CÒN DÙNG ĐƯỢC** (tập gap đơn
  đã chứng nhận nay n=27 — thêm #46 → #47 và #47 → #48). Toàn chuỗi
  n=42: trung bình 1h57'40", trung vị 1h59'16" — xem §2.5.
- RAM: 5 mẫu MemAvailable của lượt: **1.272.776 kB (21:04:38Z, lúc
  probe #35) / 1.281.612 kB (21:16:45Z, lúc scan bắt đầu) /
  1.239.600 kB (21:17:08Z, lúc scan xong) / 734.540 kB (21:17:55Z)
  / 520.288 kB (21:18:16Z, lúc viết LIMITS)** — ~1,21 GB rồi
  ~1,22 GB rồi ~1,18 GB rồi ~0,70 GB rồi ~0,50 GB. Max RAM biết
  được **trong** mù #34 từ log sibling: **3.899 MB ≈ 3,81 GB**
  (R5 poll#4, 18:18:37Z, boot #47) = 63% ngưỡng guard — vẫn xa
  guard. Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong gói.
  Reboot #16 VẪN MỞ (kẹp ~4', chờ parent/user quyết); cron riêng
  10 phút vẫn chờ user quyết.
- **Dị thường đã biết, không ảnh hưởng kết luận (xem §2.2):** dòng
  gateA poll 3 của R5 ghi 19:44:10Z — 24 s SAU reboot #48
  (19:43:46Z) — R5 đã ghi rõ là chưa giải thích được trong LIMITS
  đợt 115 §1.4; S7 loại dòng này khỏi mọi bằng chứng, không dùng
  để kết luận gì thêm (giống R5). Giờ #48 vẫn đứng trên 5 nguồn
  độc lập (uptime ×2, btime, journal, wtmp, ps).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 21:04:38Z | boot_id `0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0`; `who -b` Nov 14 19:43; `uptime -s` **2026-11-14 19:43:46Z** (2 lần, giống nhau từng giây); btime **1794685426 = 2026-11-14T19:43:46Z**; journal chỉ 1 boot (0c2a9f2f, first entry 19:43:57Z, last 21:04:37Z lúc kiểm tra); `last -x reboot` 19:43 still running; wtmp bắt đầu 19:43:57Z; `ps` systemd PID 1 START 19:43:56, hatch 19:43:57, hatch-execd 19:44:24 |
| `bash scripts/probe-eperm-v2.sh status` | 21:04:44Z | **DEAD/STALE**, heartbeat n=34, ts 17:45:02Z, boot 7a0638c4, age **11.982 s** (đúng 3h19'42"); last sample probe #34; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp, ghi trong status1.txt — không qua pipe) |
| `bash scripts/probe-eperm-v2.sh once` | 21:04:50Z | **probe #35, boot=0c2a9f2f, ok=2 fail=0**, exit 0; dòng `boot changed 7a0638c4 -> 0c2a9f2f` (uptime since 2026-11-14 19:43:46) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 21:04:59Z | **ALIVE**, age 9 s, n=35, exit 0 |

Kiểm lại từ đĩa (21:04Z): log probe v2 **97 dòng** — 94 sau R7 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #34 +
dòng `boot changed` + dòng probe #35). **Như R7 (+3):** lượt này
chưa có dòng DEAD nào cho heartbeat #34 nên `status` 21:04:44Z
ghi thêm đúng 1 dòng DEAD ("probe DEAD detected by status (last
#34 at 2026-11-14T17:45:02Z, age 11982s, no probe end since last
start)"). Prereg §1 đã dự báo đúng +3 trước khi đo (ghi rõ cơ sở:
chưa có dòng DEAD nào cho #34). Heartbeat **n=35, ts
2026-11-14T21:04:50Z, boot 0c2a9f2f-…**; log vẫn chỉ có **ĐÚNG 1
dòng `probe start`** (08:49:50Z 11/11) và **0 dòng `=== probe
end`** — loop v2 chưa từng được start lại kể từ đợt 88.

**Ghi rõ phương pháp exit code (áp dụng đính chính của N6 §1):**
cả 3 lệnh checklist đều ghi output ra file riêng (status1.txt,
once.txt, status2.txt) rồi đọc `$?` trực tiếp, KHÔNG qua `| tee`
— số exit trên là exit thật của script (status 1 STALE / once 0 /
status 0 ALIVE), đúng quy định header script. File
`probe-notes.txt` chỉ chứa phần xác minh boot độc lập, không chứa
exit code.

Nguồn độc lập cho boot #48: S3 driver116s3.log 21:10:33Z (boot
0c2a9f2f, uptime_s 19:43:46, đọc tươi) + S8 early-watch try1
21:07:02Z (boot 83,3' tuổi) + S5 poll 21:09:06Z / gate0 21:09:32Z
(boot=19:43:46) + S10 poller START 21:06:42Z (boot 0c2a9f2f,
uptime-s 19:43:46) — tất cả đều đọc boot_id/uptime trực tiếp từ
/proc tại thời điểm ghi (đều sau probe #35, chỉ củng cố — đoạn C
đóng chính bằng đo uptime tại probe, xem §2.3). Reboot #48 đã
được chốt giờ từ R5 đợt 115 (19:43:46Z); S7 xác nhận lại bằng 2
lần đo trực tiếp + btime trên boot #48.

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như I7/J8/K6/L6/M4/N6/P6/Q6/R7 đã
đính chính.

## 2. Điều tra khoảng mù #34 (17:45:02Z → 21:04:50Z, 3h19'48")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #35: `uptime -s` = **2026-11-14 19:43:46Z**,
  boot_id `0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0` — khác boot của
  probe #34 (7a0638c4).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (21:04Z): chỉ **1 boot**
  (0c2a9f2f, first entry 19:43:57Z, last 21:04:37Z). `last -x
  reboot`: chỉ 1 dòng (19:43, still running). wtmp bắt đầu
  19:43:57Z. Journal/wtmp của boot 5578af38 đã mất theo reboot
  #48 — như mọi lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu (kiểm lại lượt này).

### 2.2 Hai reboot đã chốt trong mù — #47 (17:45:50Z) và #48 (19:43:46Z)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 47 | **17:45:50Z (chính xác từng giây)** | 7a0638c4 → 5578af38 | Chốt từ R5/R9 đợt 115 (postboot-b47-try1 + early-watch try2–6, đều đọc `uptime -s`/`boot_id` tươi). **Xác nhận lại lượt này từ 3 nguồn độc lập:** R5 postboot-r5-b47-try1.log (boot_id 5578af38-911d-4f3b-93b0-383a1664f225, uptime_s 17:45:50); R9 r9-early-watch-try2..6.log (cùng boot_id, 17:53:22Z → 18:13:29Z); R3 driver115r3.log 17:51:31Z (boot=5578af38, uptime_s=17:45:50, free=3205MB). btime 1794678350 = 17:45:50Z (tính lại bằng code). **Số thứ tự TẠM THỜI** (xem dưới). |
| 48 | **19:43:46Z (chính xác từng giây)** | 5578af38 → 0c2a9f2f | Chốt từ R5 đợt 115. **Xác nhận lại lượt này:** 2 phép đo `uptime -s` độc lập trên boot mới (21:04:38Z, giống nhau từng giây) + btime 1794685426 + `who -b` 19:43 + boot_id 0c2a9f2f + journal first entry 19:43:57Z + wtmp begins 19:43:57Z + `ps` systemd PID 1 START 19:43:56 (đều ghi trong probe-notes.txt lúc 21:04Z) + probe #35 21:04:50Z boot 0c2a9f2f ok=2 fail=0. **Số thứ tự TẠM THỜI** (xem dưới). |

Gap #46 → #47 = **2h01'01" — ĐƯỢC CHỨNG NHẬN (mới, lượt này, xem
§2.3 + §2.5)**. Gap #47 → #48 = **1h57'56" — ĐƯỢC CHỨNG NHẬN
(mới, lượt này, xem §2.3 + §2.5)**. **Tính tạm thời của số thứ tự
(ghi rõ, không giấu):** #47/#48 kế thừa tính tạm thời từ mù #29
chưa đóng (khe 79 s, M4 §2.3), mù #30 chưa đóng (3 cửa sổ mở, N6
§2.3) **và từ mù #31 chưa đóng (1 cửa sổ mở 8'55", xem §2.6)**:
nếu mù #29 chứa 1 reboot ẩn, mù #30 chứa tối đa 2 và mù #31 chứa
tối đa 1 thì "reboot #48" thực tế có thể là **#52**. **Giá trị các
gap không phụ thuộc số thứ tự** — chỉ phụ thuộc giờ đã chốt.

**Dị thường gateA poll 3 của R5 (ghi rõ, không ảnh hưởng kết
luận — đã được R5 ghi nhận trước, LIMITS đợt 115 §1.4):** dòng
"gateA poll 3 2026-11-14T19:44:10Z" trong poll-r5.log và
run-r5-attempt4.nohup.log (mtime cả hai file = 19:44:10.81Z, cùng
từng nano-giây — một lần ghi `tee` duy nhất) nằm 24 s SAU reboot
#48, trong khi tiến trình gate (bắt đầu 19:42:09Z trên boot #47)
không thể sống qua reboot. R5 đã kết luận: "chưa giải thích được
chắc chắn (có thể đồng hồ nhảy sau reboot, hoặc script còn sống
qua lúc restart của exec service); không dùng dòng này để kết luận
gì thêm". S7 xác nhận lại: `started=2026-11-14T1` bị cắt là do
`head -c 60` trên nội dung lock owner (không phải ghi dở do bị
giết — các dòng 20/26 có giá trị đầy đủ); nội dung lock R3
(pid 105555, port 5590) trong dòng poll 3 là **stale trên đĩa**
sau reboot (R5 §1.4 đã ghi). S7 **loại dòng gateA poll 3 khỏi
mọi bằng chứng** (không dùng để kẹp đoạn B hay đoạn C) và không
đưa thêm giả thuyết mới. Đóng mù #34 không phụ thuộc dòng này:
poller v2 + R9 early-watch + session bắc qua + sàn đã đủ 4 lớp
độc lập; giờ #48 đứng trên 5 nguồn độc lập (§1).

### 2.3 Hoạt động trong khoảng mù — vì sao ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **18 file** +
hidden_files **483 file** (không tính chrome-userdata); **501
file, 492 mốc giây phân biệt** (độ chính xác đầy đủ — theo cách
đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 19/P6 §4 mục 20/Q6 §4 mục
20/R7 §2.3). Chia mù làm ba đoạn bởi #47 (17:45:50Z) và #48
(19:43:46Z):

- **Đoạn A: 17:45:02Z → 17:45:50Z (48 s, boot 7a0638c4 #46) —
  ĐÓNG bằng số học sàn + đoạn B của mù #33 đã đóng:** đo uptime
  tại probe #34 chứng minh up liên tục từ 15:44:49Z tới
  17:45:02Z (R7 §2.3 đoạn B); reboot ẩn t trong (17:45:02Z,
  17:45:50Z) phải thỏa gap2 = 17:45:50Z − t ≥ 19'07" ⟺
  t ≤ 17:26:43Z — không thể vì t > 17:45:02Z. Nên sàn ĐÓNG đoạn
  A một mình (48 s < sàn). Mật độ mtime củng cố (10 mốc, lỗ lớn
  nhất chỉ 16 s) nhưng không dùng để đóng.
- **Đoạn B: 17:45:50Z → 19:43:46Z (1h57'56", boot 5578af38 #47) —
  ĐÓNG bằng poller + dấu boot tươi + session bắc qua + sàn
  (4 lớp, không lớp nào thừa):**
  - **Poller R5 v2 (5 phút) là kẹp trực tiếp tới 19:43:40Z —
    ĐÃ CHỨNG MINH LÀ MỘT TIẾN TRÌNH DUY NHẤT (mới, lượt này,
    theo mẫu R7 §4 mục 25):** (i) script poll-r5.sh là vòng
    `for i in $(seq 1 30)` + `sleep 300` foreground, **không có
    cơ chế restart nào** (đã đọc script — không cron/systemd user
    service, không vòng tự khởi động lại); mỗi poll đọc
    `BOOT=$(uptime -s)` tươi; (ii) log poll-r5.log: poller v1
    poll#1 17:45:47Z boot=15:44:49 (3 s trước #47 — chết theo
    reboot, ghi chú đương thời r5-note 18:04:33Z: "poller v1
    chet theo reboot; poller v2 (setsid) chay lai 18:03:35Z");
    poller v2 poll#1 18:03:35Z → poll#21 19:43:40Z — **21 poll
    liên tiếp, đúng số thứ tự #1–#21, đúng 300 s ×19 + 301 s
    ×2 mỗi bước, không trùng, không thiếu số, không có #1 thứ
    hai** (tính bằng code từ nội dung log — xem
    blind34-gaps.txt); một lần chạy mới sẽ bắt đầu lại từ poll
    #1 — không có; (iii) mọi poll đều boot=17:45:50 (đọc tươi
    qua `uptime -s` mỗi lần). Reboot sẽ giết tiến trình poller
    → không còn poll sau đó; poll tồn tại tới 19:43:40Z nên
    **không reboot nào trong (18:03:35Z, 19:43:40Z]**.
  - **Dấu boot TƯƠI củng cố trong đoạn B (đọc /proc tại thời
    điểm ghi — miễn nhiễm lỗ "tiến trình cũ sống sót", P6 §4
    mục 2):** R9 early-watch try#1–#6 17:48:22Z → 18:13:29Z
    (boot 2,5' → 27,7' tuổi; try2–6 ghi boot_id 5578af38 trong
    header postboot); R3 driver115r3.log 17:51:31Z (boot
    5578af38, uptime_s 17:45:50) + 18:03:54Z + 18:18:15Z; R2
    driver-r2.log 18:03:48Z + 18:24:38Z (uptime_s 17:45:50);
    R5 gate0 try 1 18:50:47Z / 19:03:32Z / 19:30:40Z / 19:42:09Z
    (boot=17:45:50, postboot_exit=0). Dấu tươi cuối trong đoạn
    B: **19:42:09Z** (R5 gate0 attempt4) — chỉ 1'37" trước #48.
  - **Session exec bắc qua 2 cắt sàn là kẹp độc lập thứ hai
    (mới, lượt này — mạnh hơn mù #33, nơi quét này trả 0):**
    quét 467 file exec-log dưới `~/workspace/agents/*/exec-logs/`
    (birth qua `stat %W`, mtime qua `%Y` — xem §4 mục mới về
    `find %w`): **6 session bắc qua cắt 18:04:57Z** (birth
    17:54:13Z → 18:04:43Z, mtime 18:07:08Z → 18:25:08Z) và **4
    session bắc qua cắt 19:24:39Z** (birth 19:19:09Z →
    19:21:41Z, mtime 19:28:40Z → 19:34:09Z) — xem
    sessions-spanning.txt. Một reboot tại cắt sẽ giết các
    session này → log ngừng ghi; log còn ghi sau cắt nên không
    reboot tại cắt.
  - **Sàn đóng đầu và đuôi đoạn B:** cửa sổ sàn-cho-phép là
    t ∈ [18:04:57Z, 19:24:39Z] (gap1 = t − 17:45:50Z ≥ 19'07"
    ⟺ t ≥ 18:04:57Z; gap2 = 19:43:46Z − t ≥ 19'07" ⟺
    t ≤ 19:24:39Z — kiểm bằng code, xem blind34-gaps.txt).
    Poller v2 phủ (18:03:35Z, 19:43:40Z] — bao trọn cửa sổ
    sàn-cho-phép; session bắc qua phủ đúng 2 cắt sàn; dấu tươi
    phủ tới 19:42:09Z. Đầu (17:45:50Z, 18:03:35Z] 17'45" < sàn
    19'07" → sàn đóng (bất kỳ t nào trong đó cũng < 19'07" sau
    #47). Đuôi (19:43:40Z, 19:43:46Z] 6 s < sàn → sàn đóng
    (bất kỳ t nào trong đó cũng < 19'07" trước #48). **Hợp các
    lớp: không còn t nào chưa loại → đoạn B ĐÓNG.**
  - Lỗ mtime lớn nhất đoạn B: **446 s (19:11:33Z → 19:19:00Z,
    cả hai cây)** và **1240 s (19:23:06Z → 19:43:46Z, repo-1)**
    — cả hai đều nằm hoàn toàn trong vùng poller v2 phủ (poll
    #15–#21 lúc 19:13:39Z–19:43:40Z) nên đã loại bằng poller,
    không tạo cửa sổ mở (quy tắc N6 §4 mục 2 + R7 §4 mục 23:
    `find` chỉ thấy mtime CUỐI — các lần ghi append trung gian
    của poller mỗi 300 s không tạo mốc mtime riêng; lỗ này chỉ
    lấp được bằng NỘI DUNG log).
  - Tìm ngoài hai cây trong đoạn B: 117 file dưới ~/workspace
    (trừ 2 cây) + 0 file /tmp có mtime trong đoạn B — hầu hết
    là agents exec-logs (đã dùng cho quét session bắc qua) và
    file memory reconciliation (mtime-only, không chứa
    boot_id/uptime — không dùng để thu hẹp khe, theo N6 §4
    mục 2). Không có file nào ngoài hai cây chứa dấu boot tươi
    mới.
  - Kết luận đoạn B: **ĐÓNG**.
- **Đoạn C: 19:43:46Z → 21:04:50Z (1h21'04", boot 0c2a9f2f #48) —
  ĐÓNG bằng đo uptime trực tiếp + probe #35 + dấu boot tươi:**
  - **`uptime -s` ×2 lúc 21:04:38Z = 19:43:46Z** chứng minh máy
    up liên tục từ #48 tới lúc đo; probe #35 21:04:50Z đọc
    boot_id 0c2a9f2f tươi — cùng boot_id với boot bắt đầu
    19:43:46Z. (Nguyên tắc như P6 §2.3 đoạn C mù #31 và Q6 §4
    mục 21: đo uptime tại thời điểm probe ĐÓNG toàn bộ đoạn từ
    reboot cuối tới lúc đo — sàn chỉ áp dụng GIỮA hai reboot đã
    biết, không áp cho đuôi sau reboot cuối.)
  - **Chuỗi dấu boot tươi củng cố (đọc boot_id/uptime trực tiếp
    từ /proc tại thời điểm ghi — đều sau probe #35, chỉ củng
    cố):** S10 poller START 21:06:42Z (boot 0c2a9f2f, uptime-s
    19:43:46) + S8 early-watch try1 21:07:02Z (boot 83,3' tuổi)
    + S5 poll 21:09:06Z / gate0 21:09:32Z (boot=19:43:46) + S3
    driver 21:10:33Z (boot 0c2a9f2f, uptime_s 19:43:46,
    free=541MB). Dấu tươi cuối 21:10:33Z, chỉ 5'43" sau probe
    #35.
  - Lỗ mtime lớn nhất đoạn C: **830 s (20:19:40Z → 20:33:30Z,
    hidden_files)** và **2826 s (20:17:44Z → 21:04:50Z,
    repo-1)** — nằm trong đoạn đã đóng bằng uptime trực tiếp
    nên không tạo cửa sổ mở (quy tắc N6 §4 mục 2). Lỗ 2826 s
    của repo-1 kết thúc đúng lúc probe #35 ghi log — không phải
    lỗ quan sát.
  - Kết luận đoạn C: **ĐÓNG**.

**Kết luận trung thực: khoảng mù #34 ĐÓNG HOÀN TOÀN.** Đúng 2
reboot đã chốt giờ trong mù (#47 17:45:50Z, #48 19:43:46Z) + **0
reboot ẩn** (không còn cửa sổ mở nào). Đây là mù thứ ba liên tiếp
đóng hoàn toàn sau mù #32 (Q6) và mù #33 (R7) — lần đầu có 3 mù
đóng liên tiếp kể từ #27. Gap #46 → #47 = 2h01'01" và gap #47 →
#48 = 1h57'56" được chứng nhận theo khoảng (xem §2.5). Số thứ tự
#47/#48 vẫn TẠM THỜI (kế thừa mù #29/#30/#31 chưa đóng — xem §2.2).

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 115/116

Khoảng mù 17:45:02Z → 21:04:50Z (3h19'48") được phủ bởi các luồng
sibling đợt 115 (R1–R10, làm việc tới ~20:xxZ) + spawn đợt 116
(20:35:51Z). Đã đọc lại log thật — **đếm lại độc lập từ đĩa**
(python, đọc toàn bộ nội dung 137 file *.log có mtime trong mù
#34 — 0 file repo-1, 137 file hidden_files, trừ chrome-userdata):

| Mẫu | Số dòng | Kết luận |
|---|---|---|
| `sóng EPERM vẫn bật` | **0** | Không có sóng đang bật trong log còn tồn tại |
| `CẢNH BÁO` (10-phút wave warning) | **0** | Không có cảnh báo nào |
| `Operation not permitted` | **0** | Không có lỗi EPERM thật nào |
| `sóng EPERM đã tắt` | **8** | Tất cả đều là dòng launcher — **dương tính giả đã biết** |

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5, J8
§2.4, K6 §2.4, L6 §2.4, M4 §2.4, N6 §2.4, P6 §2.4, Q6 §2.4, R7
§2.4):** cả 8 dòng đều có dạng `[timestamp] sóng EPERM đã tắt,
khởi động vite` — in khi lần ghi thử ĐẦU TIÊN thành công ngay
(code launcher `waveOff=true` ở lần write đầu) — in mặc định cả
khi không có sóng. Phân bố: R1 run-r1.log 6 dòng (18:37:09Z →
18:54:26Z, đoạn B) + R10 r10-o8.log 2 dòng (20:51:24Z, 20:52:23Z,
đoạn C). **Quét mở rộng (mới, lượt này):** grep
`/eperm|not permitted/i` trên cùng 137 file trả 14 dòng — 8 dòng
"đã tắt" trên + 6 dòng còn lại đều là tên test trong
round115-r10-suites.log ("✔ … hasEperm phân biệt EPERM với port
conflict", "thứ tự chẩn đoán — EPERM được ưu tiên trước port
conflict") — test pass, không phải lỗi thật.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — và lần này, NHƯ mù #32/#33, **mù #34 đã đóng
  hoàn toàn** nên không còn lỗ quan sát về reboot nào để một sóng
  ngắn ẩn náu: vite khởi động thành công ngay ở 18:37–18:54Z (R1,
  6 lần) và 20:51–20:52Z (R10, 2 lần), cộng probe #35 ok=2 fail=0
  lúc 21:04:50Z. Một sóng dài ~16' kiểu R7 không thể lọt vào mù
  #34 mà không để lại dấu — khả năng rất thấp.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~80h54'** trước
  probe #35 (tính từ cuối sóng ~12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #35 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 21:04:50Z ghi được.

### 2.5 Phân phối gap cập nhật — CERT n=27 (mới) + dải chứng nhận CÒN DÙNG ĐƯỢC

Gap mới **#46 → #47 = 2h01'01" ĐƯỢC CHỨNG NHẬN**: khoảng
(15:44:49Z, 17:45:50Z) không chứa cửa sổ mở nào — phần
(15:44:49Z, 17:45:02Z] đã đóng bởi mù #33 đoạn B (R7 §2.3); đuôi
48 s (17:45:02Z, 17:45:50Z) đóng bằng số học sàn (§2.3 đoạn A).
Đây là chứng nhận theo khoảng (interval), không theo nhãn mù (P6
§4 mục 8). Gap mới **#47 → #48 = 1h57'56" ĐƯỢC CHỨNG NHẬN**:
khoảng (17:45:50Z, 19:43:46Z) không chứa cửa sổ mở nào — mù #34
đoạn B đóng kín (§2.3). Tập gap đơn đã chứng nhận **n=25 →
n=27**; toàn chuỗi tăng n=40 → **n=42** (thêm 2 gap). Tính lại
từ bảng R7 (exec lại blind33-gaps.py nguyên văn — không gõ lại
số, tránh sai sót chép tay) + 2 gap mới, bằng code (percentile
tuyến tính, index = p·(n−1) — cùng phương pháp
J8/K6/L6/L9/M4/N6/P6/Q6/R7). **Kiểm tra chéo: tính lại CERT n=25
ra đúng 100% số R7** (trung bình 1h52'14", trung vị 1h59'46",
p10 0h56'26", p90 2h47'39", sd 0h44'13"), **tính lại toàn chuỗi
n=40 ra đúng 100% số R7** (trung bình 1h57'35", trung vị
1h59'16", p10 0h46'54", p90 3h04'39", sd 1h01'03") — nên số mới
dưới đây đáng tin ở cùng mức (script `blind34-gaps.py`, output
`blind34-gaps.txt`):

| Thống kê | Toàn bộ n=42 | Chỉ gap đơn đã chứng nhận n=27 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, CẬN TRÊN)** | **3h14'08" (#26 → #27)** |
| Trung bình | 1h57'40" | 1h52'46" |
| Trung vị | 1h59'16" | 1h59'46" |
| Độ lệch chuẩn (mẫu) | 0h59'33" (CV 0,50) | 0h42'31" |
| p10 | 0h48'36" | 1h00'25" |
| p90 | 3h04'16" | 2h40'49" |

Đọc thêm: 24/42 gap (57%) nằm trong 90'–150'; 6 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
**Dải chứng nhận [19'07", 3h14'08"] đứng vững trên tập gap đơn
đã chứng nhận (n=27)** — min/max không đổi (2 gap mới đều nằm
giữa). Cảnh báo J8 vẫn đứng: dải này đã bị vượt 2 lần bởi các gap
chưa chứng nhận (#11 → #12 4h10'33",
#33 → #34 5h43'18") — nó là phát biểu về các gap đơn đã biết,
không phải bảo đảm. **Không đưa dự báo điểm cho #49 hay reboot
nào sau đó** — chỉ dải cơ học áp lên #48 (19:43:46Z):
**[20:02:53Z, 22:57:54Z]**; probe #35 (21:04:50Z, boot #48) đã
loại trừ phần trước 21:04:50Z → dải hiệu dụng
**[21:04:50Z, 22:57:54Z]**; p10–p90 toàn chuỗi →
[20:32:22Z, 22:48:01Z].

### 2.6 Mù cũ — KHÔNG ĐỔI, KHÔNG THỬ LẠI (không có nguồn mới thật sự)

- **Mù #31 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (Q6 §2.6, R7 §2.6):
  1 cửa sổ mở — 8'55" (10:23:54Z → 10:32:49Z); 2 reboot đã chốt
  (#43 08:53:37Z, #44 10:53:31Z) + tối đa 1 ẩn. Không có nguồn
  mới thật sự nào cho cửa sổ này lượt này (mọi log mới đều sau
  cửa sổ; journal/wtmp vẫn chỉ giữ boot hiện tại #48), nên S7
  không thử lại. Parent/user quyết xem có chấp nhận "ít nhất 2
  reboot, có thể 3" làm mức đóng của mù #31 hay để mở như mù
  #24/#26/#28/#29/#30. S7 không tự quyết. Gap #43 → #44 =
  1h59'54" KHÔNG được chứng nhận (cận trên).
- **Mù #30 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (N6 §5 mục 1, P6 §5
  mục 2, Q6 §5 mục 3, R7 §5 mục 4): 3 cửa sổ mở, tổng 30'50"; 2
  reboot đã chốt + có thể tối đa 2 ẩn. Số thứ tự #41/#42 vẫn TẠM
  THỜI. Không còn dữ liệu nào để thu hẹp thêm — parent/user quyết.
- **Mù #29 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (M4 §5 mục 1, P6 §5
  mục 3, Q6 §5 mục 4, R7 §5 mục 5): lỗ thật 14'31" theo M4 /
  13'33" theo M9 birth-time, khe 79 s không loại trừ được; 2
  reboot đã chốt + có thể 1 ẩn. Số thứ tự #39/#40 vẫn TẠM THỜI.
- **Mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục 1, P6 §5
  mục 4, Q6 §5 mục 5, R7 §5 mục 6): lỗ 23'39" (02:01:06Z →
  02:24:45Z), khe 4'32" không loại trừ được; 2 reboot đã chốt +
  có thể 1 ẩn. Số thứ tự #37/#38 vẫn TẠM THỜI.
- **Mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục 1, P6 §5
  mục 5, Q6 §5 mục 6, R7 §5 mục 7): lỗ 1h13'58" (19:20:19Z →
  20:34:17Z) có thể chứa thêm reboot; ít nhất 1 (#34), có thể
  nhiều hơn — không xác định được; số thứ tự #34 là TẠM THỜI.
- **Mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục 1, P6 §5
  mục 6, Q6 §5 mục 7, R7 §5 mục 8): lỗ 2h03'11" (12:28:41Z →
  14:31:52Z) có thể chứa thêm reboot; ít nhất 1 (#32), có thể
  nhiều hơn — không xác định được; số thứ tự #32 → #48 là TẠM
  THỜI.
- **Mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1, P6 §5
  mục 7, Q6 §5 mục 8, R7 §5 mục 9): lỗ ~17'23" (03:57:19Z–
  04:14:42Z) có thể chứa đúng 1 reboot trung gian.
- **Mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8, §6 mục
  3, P6 §5 mục 8, Q6 §5 mục 9, R7 §5 mục 10): cửa sổ lý thuyết
  ≤78 s với sàn 19'07". Parent/user quyết giữ "đóng", "đóng có
  điều kiện", hay mở lại. **Mù #23 VẪN ĐÓNG HOÀN TOÀN** (G8).
  **Mù #25 VẪN ĐÓNG HOÀN TOÀN** (I7). **Mù #27 VẪN ĐÓNG HOÀN
  TOÀN** (K6). **Mù #32 VẪN ĐÓNG HOÀN TOÀN** (Q6). **Mù #33 VẪN
  ĐÓNG HOÀN TOÀN** (R7). **Mù #34 ĐÃ ĐÓNG HOÀN TOÀN** (mới, lượt
  này).

### 2.7 Quét writeFileSync (snapshot 21:16:45–21:17:08Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round116-s7`. Chạy trọn vẹn (23 s, SCAN-END có đủ). Kết quả
NEWSTD khớp 100% scan-meta.txt (tính lại từ file wfs-*.txt +
files-*.bin gốc).

- Chuẩn mới: **708 dòng / 200 file** (phạm vi 2874 file).
  Lần 21 (R7): 680 dòng / 196 file (phạm vi 2857 file).
- R7b (đối chiếu): **733 dòng / 217 file**. Lần 21: 705 / 213.
- Copies: **25 dòng / 17 file** — y hệt lần 21, 20, 19, 18, 17,
  J8, I7, H7, G8 và F7.
- Đối chiếu chéo 708+25=733=R7b, **chênh 0 — lần thứ hai mươi
  hai liên tiếp**. Tổng hit trên cả 3 bảng: 708+733+25 =
  **1.466 dòng**.
- **+28 dòng / +4 file so với lần 21, giải thích đúng hết bằng
  diff hit list** (đã đọc nội dung từng dòng mới; 0 file cũ tăng,
  không file nào giảm):
  - +6 `docs/PHASE9_ROUND115_R7_EPERM_LIMITS.md` (file LIMITS của
    chính R7 — 6 hit đều là trích dẫn "writeFileSync" trong văn
    bản, đã đọc nội dung từng dòng)
  - +7 `apps/web/scripts/probe115r2-frame-parity.mjs` (R2 đợt 115
    — script probe frame-parity: ghi vite config tạm + kết quả/
    log vào scratch; đã đọc 7 dòng)
  - +8 `apps/web/scripts/probe116s3-frame-parity.mjs` (S3 đợt 116
    — script probe frame-parity: ghi vite config tạm + kết quả/
    log vào scratch; đã đọc 8 dòng)
  - +7 `apps/web/scripts/probe116s2-frame-parity.mjs` (S2 đợt 116
    — script probe frame-parity: ghi vite config tạm + kết quả/
    log vào scratch; đã đọc 7 dòng)
  - Tổng: 6+7+8+7 = **28** ✓, 4 file mới có hit ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets). Đếm lại trực tiếp sau scan: R7 LIMITS đúng 6,
    probe115r2 đúng 7, probe116s3 đúng 8, probe116s2 đúng 7.
- **0 file biến mất khỏi hit list.**
- Scope: **+17 file ròng / −0 file** so với lần 21 (2874 =
  2857+17−0 ✓): 17 file mới = 4 file hit trên + 13 file không
  hit (2 script benchmark — `benchmarks/render/q8_analyze_116s9.py`,
  `benchmarks/render/webkit_blob_flaky_116s9_2mib.mjs` — + 11 file
  LIMITS — ROUND115_LIMITS + R1/R2/R3/R4/R5/R6/R7/R8/R9 đợt 115 +
  S4/S8 đợt 116). Comm hai chiều khớp đúng (17 = 4+13 ✓).
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt lần 21 — xem files-copies.txt;
  diff wfs-copies.txt với lần 21: IDENTICAL).
- **Race trong cửa sổ scan (ghi rõ, không giấu):** các sibling
  đợt 116 vẫn đang chạy (S2 đã sửa preview.tsx 21:13:59Z, trước
  khi scan bắt đầu 21:16:45Z — file .tsx không nằm trong phạm vi
  quét nên không ảnh hưởng số đếm; các file mới trong diff đều đã
  hạ cánh trước khi scan bắt đầu — đếm lại trực tiếp sau scan khớp
  số trong wfs-newstd.txt — không hỏng số đếm). Sibling đợt 116
  vẫn đang chạy nên lượt sau cần đối chiếu lại.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2874 file), NUL-safe, chạy từ trong repo-1 — chỉ đúng 2 hit
trong code (đếm lại bằng python từ files-*.bin gốc, không tin mù
file cũ; tổng 133 dòng `.writeFile(` trong phạm vi, 131 dòng nằm
trong `.md`, 2 dòng trong code — lần 21 là 127 dòng, 125 trong
`.md`, 2 trong code; +6 dòng đều nằm trong `.md` trích dẫn mới):

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z — kiểm lại trực tiếp
lượt này). Kết luận giữ nguyên như M4/N6/P6/Q6/R7: **2 async call
site, cả 2 đều thuộc helper retry đã biết với cùng hợp đồng
EPERM-only + verify byte — không phải write async stray, không
cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

5 mẫu MemAvailable của lượt: **1.272.776 kB (21:04:38Z, lúc probe
#35) / 1.281.612 kB (21:16:45Z, lúc scan bắt đầu) / 1.239.600 kB
(21:17:08Z, lúc scan xong) / 734.540 kB (21:17:55Z) / 520.288 kB
(21:18:16Z, lúc viết LIMITS)** — ~1,21 GB rồi ~1,22 GB rồi
~1,18 GB rồi ~0,70 GB rồi ~0,50 GB. **Dao động mạnh trong 14
phút** (từ ~1,2 GB xuống ~0,5 GB — có thể do tiến trình sibling
vite/browser lên sau khi S7 đo; S7 không đo được nguyên nhân chính
xác, chỉ ghi số — cùng mẫu dao động như R7: 0,42 GB → 2,27 GB
trong 13 phút). Max RAM biết được **trong** mù #34 từ log
sibling: **3.899 MB ≈ 3,81 GB** (R5 poll#4, 18:18:37Z, boot #47)
= **63% ngưỡng guard 6144 MB**; max trong đoạn A: **450 MB**
(R5 poll#1, 17:45:47Z, boot #46); max trong đoạn C: **2.523 MB**
(R3 driver115r3c, 20:12:56Z, boot #48); các mẫu RAMavail khác
trong mù: 3205 MB (R3, 17:51:31Z), 3052 MB (R3, 18:18:15Z),
2269 MB (R2, 18:24:38Z). Các số max đều là `free -m` cột 7
(MemAvailable) hoặc `free=` trong driver log — cùng công thức.
Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3 mục 7 (chỉ thử
lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥ 6 GB mới thử
lại). Birefnet-general vẫn **0 lần chạy thành công** trong gói.
Mẫu RAM lúc probe (1,21 GB) vẫn xa ngưỡng guard; máy chưa từng
tiến gần ngưỡng guard trong mù #34 (max 63%).

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Lỗ mù phải kiểm chứng 4 lớp trước khi tuyên bố (L6 §4 mục 1,
   M4 §4 mục 1, N6 §4 mục 1, P6 §4 mục 1, Q6 §4 mục 1, R7 §4 mục
   1, áp dụng lượt này — xem §2.3):** (a) mtime find trong hai cây
   để xác định lỗ; (b) **đọc NỘI DUNG** các file log append chạm
   biên lỗ (poll-r5.log — 21 mục, 300/301 s đều; R9 early-watch —
   6 mục; R3/R2 driver — boot tươi; S3/S5/S8/S10 — boot tươi đoạn
   C); (c) **tìm ngoài hai cây**: find toàn ~/workspace (không
   prune) + /tmp + agents/ + chrome-userdata trong đúng cửa sổ lỗ;
   (d) **số học sàn** để bound khe không loại trừ được (mù #34: 0
   cửa sổ còn lại).
2. **Dấu boot TƯƠI (đọc /proc tại thời điểm ghi) miễn nhiễm với lỗ
   "tiến trình cũ sống sót" (P6 §4 mục 2, áp dụng lượt này — xem
   §2.3):** postboot-check và R5/R9/R3/R2/S3/S5/S8/S10 log đọc
   `boot_id`/`uptime -s` bằng command substitution NGAY lúc echo
   — sau reboot, /proc cho boot_id mới nên dấu này chứng minh
   không reboot trước thời điểm đó, bất kể tiến trình có sống sót
   hay không. Ngược lại, một session chỉ ghi file (không đọc boot)
   thì vẫn phải trừ 38 s sống sót ở đuôi. Khi đánh giá session,
   phân biệt rõ: session có đọc boot tươi trong nội dung thì đóng
   tới đúng thời điểm đọc; session chỉ ghi file thì trừ 38 s.
3. **Quan sát ngoài cây KHÔNG tự động thu hẹp khe (N6 §4 mục 2,
   P6 §4 mục 3, áp dụng lượt này — xem §2.3):** 117 file
   ~/workspace ngoài hai cây có mtime trong đoạn B nhưng chỉ là
   mtime — khe được bound bằng số học sàn + poller + đo boot tươi
   + session bắc qua, không bằng mật độ quan sát. Chỉ quan sát nào
   **xác định boot** (boot_id/uptime trong nội dung, hoặc session
   bắc qua) mới thu hẹp được khe. Đừng đếm "có file trong lỗ"
   thành "lỗ đã lấp".
4. **`find -newerBt` với chuỗi thời gian là SAI (N6 §4 mục 3, nhắc
   lại — lượt này KHÔNG mắc):** dùng `find -printf '%T@'` / python
   `os.stat().st_mtime` lấy mtime epoch rồi so sánh bằng code
   (S7 đã làm đúng: toàn workspace + /tmp trong đoạn B; 467 file
   exec-log cho quét session-spanning).
5. **`status` STALE chỉ ghi 1 dòng DEAD cho mỗi heartbeat (N6 §4
   mục 4, P6 §4 mục 5, Q6 §4 mục 5, R7 §4 mục 5, xác nhận lại lượt
   này — xem §1):** log tăng 94 → 97 (+3: DEAD mới cho #34 +
   boot-changed + probe) vì chưa có dòng DEAD nào cho heartbeat
   #34. Khi đếm dòng log lượt sau phải tính cả cơ chế dedupe này
   (baseline mới là **97**, không phải 94 hay 95).
6. **Exit code lấy từ `$?` trực tiếp, không qua pipe (N6 §4 mục
   5, P6 §4 mục 6, Q6 §4 mục 6, R7 §4 mục 6, áp dụng lượt này —
   xem §1):** cả 3 lệnh checklist ghi ra file riêng rồi đọc `$?`;
   probe-notes.txt (ghi trực tiếp, không qua `| tee`) chỉ chứa
   phần xác minh boot, không chứa exit code. Quy định script:
   status 0 ALIVE / 1 STALE-DEAD / 2 never-run; once 0.
7. **Session exec bắc qua là kẹp mạnh sau poller (N6 §4 mục 6,
   P6 §4 mục 7, Q6 §4 mục 7, R7 §4 mục 7, áp dụng lượt này —
   xem §2.3):** lượt này quét session-spanning trả **6 session
   bắc qua cắt 18:04:57Z + 4 session bắc qua cắt 19:24:39Z** —
   mạnh hơn mù #33 (0 session); poller R5 v2 vẫn là observer
   chính, session là kẹp độc lập thứ hai.
8. **Chứng nhận gap theo KHOẢNG, không theo nhãn mù (P6 §4 mục 8,
   Q6 §4 mục 8, R7 §4 mục 8, áp dụng lượt này — xem §2.5):**
   #46 → #47 được chứng nhận vì khoảng (15:44:49Z, 17:45:50Z)
   không chứa cửa sổ mở (đuôi 48 s đóng bằng sàn); #47 → #48
   được chứng nhận vì khoảng (17:45:50Z, 19:43:46Z) không chứa
   cửa sổ mở (mù #34 đoạn B đóng kín). Ghi rõ cơ sở để parent
   quyết (nếu không đồng ý với chứng nhận #46 → #47 qua sàn
   đuôi 48 s thì hạ về cận trên, CERT về n=26).
9. **`ps aux` / `ps -eo lstart` là nguồn độc lập cho giờ reboot
   (L6 §4 mục 2, M4 §4 mục 3, N6 §4 mục 8, P6 §4 mục 9, Q6 §4
   mục 9, R7 §4 mục 9, áp dụng lượt này — xem §2.2):** systemd
   PID 1 START 19:43:56, hatch 19:43:57, hatch-execd 19:44:24 —
   khớp `uptime -s` 19:43:46Z ở mức phút.
10. **Chốt giờ reboot bằng `uptime -s` trên boot mới, đo 2 lần —
    KHÔNG dùng mtime file cuối của boot cũ** (K6 §4 mục 2, nhắc
    lại): lần này #48 giữ giờ R5 chốt (19:43:46Z); S7 xác nhận
    lại bằng 2 lần đo trực tiếp + btime trên boot #48; #47 giữ
    giờ R5/R9 chốt (17:45:50Z), S7 xác nhận lại bằng 3 nguồn
    độc lập đọc tươi; ghi rõ nguồn gốc giờ, đừng giả vờ đo lại
    được.
11. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
    reboot** (J8 §4 mục 1, nhắc lại): đừng bao giờ đếm reboot chỉ
    bằng `grep "boot changed"` trên log probe; chuỗi đánh số chính
    thức nằm trong các file LIMITS EPERM theo đợt.
12. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (J8 §4 mục 2, nhắc
    lại): dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn
    đã chứng nhận (n=27) sau lượt này; trên toàn chuỗi vẫn có 2
    gap vượt (đều là cận trên). **Nằm trong dải không đồng nghĩa
    được chứng nhận** (M4 §4 mục 6, nhắc lại): gap #46 → #47
    (2h01'01") và #47 → #48 (1h57'56") được chứng nhận vì khoảng
    đã đóng kín, không phải vì chúng nằm trong dải.
13. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
    bằng sàn** (H7 §4 mục 1, nhắc lại): sàn 19'07" vẫn đứng sau
    lượt này; mù #34 đóng được là nhờ poller + dấu tươi + session
    bắc qua, sàn chỉ đóng đầu/đuôi đoạn B (17'45" + 6 s) và toàn
    bộ đoạn A (48 s) — sàn là công cụ bound, không phải bằng
    chứng đóng duy nhất. Riêng chứng nhận #46 → #47 dựa vào sàn
    cho đuôi 48 s — ghi rõ để parent quyết (xem mục 8).
14. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
    poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ lớn
    19:11:33Z → 19:19:00Z, toàn ~/workspace ngoài hai cây chỉ có
    ghi rời rạc — không session nào bắc qua lỗ này một mình;
    đoạn B đóng được là nhờ POLLER R5 v2 + dấu boot tươi +
    session bắc qua 2 cắt sàn, không nhờ các ghi rời rạc này.
15. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
    4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
    vị trí đã biết trước khi kết luận.
16. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
    §4 mục 8, nhắc lại):** lượt này 8 dòng "đã tắt" trong mù #34
    đều là dương tính giả (launcher); 0 dòng "vẫn bật", 0
    "Operation not permitted" thật. Đếm whole-file (không chỉ
    dòng trong cửa sổ) nên 0 còn mạnh hơn. Quét mở rộng
    `/eperm|not permitted/i` (mới) chỉ thêm 6 tên test pass.
17. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9 / J8 §4 mục 9
    / L6 §4 mục 10 / M4 §4 mục 11 / N6 §4 mục 16 / P6 §4 mục 17 /
    Q6 §4 mục 17 / R7 §4 mục 17): lượt này probe + quét xong là
    ghi LIMITS/batch ngay, không đợi luồng khác — reboot #47
    (17:45:50Z) đã xảy ra 48 s sau probe #34; lượt sau có thể bị
    reboot giết bất cứ lúc nào.
18. **Đếm *.log sóng EPERM phải quét cả hai cây** (J8 §4 mục 10,
    nhắc lại): lần này 137 file đều nằm ở hidden_files (0 file
    repo-1). Quét một cây sẽ kết luận sai là "không có log".
19. **Scan writeFileSync có thể bị reboot cắt ngang giữa chừng**
    (L6 §4 mục 12, nhắc lại): lần này scan chạy trọn vẹn 23 s
    trên boot mới, SCAN-END có đủ; kiểm tra SCAN-END trước khi
    tin scan-meta.txt.
20. **Đếm mốc mtime (L9 §6.1, áp dụng lượt này):** mù #34 có
    **501 file** (độ chính xác đầy đủ) nhưng chỉ **492 giây
    nguyên phân biệt** — ghi cả hai số, không ghi một số mập mờ.
21. **Đo uptime tại thời điểm probe ĐÓNG đoạn đuôi sau reboot cuối
    — sàn chỉ áp dụng GIỮA hai reboot đã biết (Q6 §4 mục 21,
    R7 §4 mục 21, áp dụng lượt này — xem §2.3):** đoạn C đóng
    toàn bộ bằng đo uptime trực tiếp, KHÔNG tự tạo cửa sổ mở giả
    bằng sàn.
22. **File mtime-only trong cửa sổ có thể bị ghi đè sau đó và mất
    nội dung gốc (Q6 §4 mục 22, nhắc lại):** khi đếm lại cửa sổ
    cũ, đối chiếu số file với lượt trước và giải thích mọi chênh
    lệch bằng mtime hiện tại; đừng kết luận "lượt trước đếm sai"
    khi file đã dời mtime.
23. **Mtime của file chỉ là lần ghi CUỐI — append trung gian không
    thấy được bằng `find` (R7 §4 mục 23, áp dụng lượt này — xem
    §2.3):** poller R5 v2 ghi append mỗi 300 s nhưng file
    poll-r5.log chỉ có 1 mtime cuối (19:44:10Z); lỗ mtime 446 s
    trong đoạn B chỉ lấp được bằng cách ĐỌC NỘI DUNG log
    (timestamp trong từng dòng), không bằng mật độ mốc mtime.
    Lượt sau: khi thấy lỗ mtime lớn, đọc nội dung các log append
    trong lỗ trước khi kết luận "lỗ".
24. **Bẫy grep substring khi đếm dòng probe (R7 §4 mục 24, nhắc
    lại — lượt này KHÔNG mắc):** `grep -c "probe end"` trả 28+
    vì mọi dòng DEAD đều chứa "no probe end since last start" —
    phải dùng mẫu chính xác `=== probe end` (đúng 0 dòng). Tương
    tự, đếm "boot changed" là đếm bước nhảy ròng, không phải số
    reboot (xem mục 11).
25. **Chứng minh poller là 1 tiến trình từ NỘI DUNG log, không cần
    session launch (R7 §4 mục 25, áp dụng lượt này — xem §2.3):**
    1 lần bắt đầu lại #1 duy nhất + chuỗi poll liên tiếp đúng số
    thứ tự + đúng khoảng 300 s + script không có cơ chế restart
    + ghi chú đương thời của R5 (v1 chết theo reboot, v2 chạy
    lại 18:03:35Z) — hợp lại đã đủ chứng minh tính đơn nhất;
    không cần tìm proc log của session đã launch nó (session đó
    đã thoát ngay sau launch).
26. **Prereg phải ghi cả hai khả năng khi cơ chế dedupe chưa chắc
    chắn (Q6 §4 mục 23, nhắc lại):** S7 dự báo đúng log +3 vì đã
    kiểm tra trước rằng chưa có dòng DEAD nào cho heartbeat #34.
    Lượt sau: kiểm tra dòng DEAD cuối log trước khi dự báo số dòng
    tăng.
27. **Tái dùng bảng gap bằng exec nguyên văn, không gõ lại (R7 §4
    mục 27, áp dụng lượt này — xem §2.5):** blind34-gaps.py exec
    blind33-gaps.py nguyên văn rồi cộng 2 gap mới — các kiểm tra
    chéo CERT25 và FULL40 đều khớp 100% số R7 đã công bố. Gõ lại
    bảng gap bằng tay rất dễ sai số.
28. **`find %w` (birth time) KHÔNG được hỗ trợ bởi findutils trên
    VM này (mới, lượt này — xem §2.3):** `find -printf '%w'`
    in ra chuỗi literal "%w" kèm cảnh báo "unrecognized format
    directive" — lần chạy đầu của blind34-investigate.py vì thế
    đếm 0 file và báo 0 session bắc qua (SAI). S7 đã chạy lại
    bằng `stat -c '%W %Y %n'` (btime hoạt động — kiểm chứng
    trực tiếp: btime file exec-log = 17:45:51.86Z) trên 467 file:
    **6 session bắc qua cắt 18:04:57Z + 4 session bắc qua cắt
    19:24:39Z**. Lượt sau: ĐỪNG dùng `find %w` — dùng `stat %W`
    (hoặc `stat -c %w` cho 1 file). Đã sửa sessions-spanning.txt
    bằng kết quả chạy lại; file sessions-spanning2.log giữ log
    chạy lại.
29. **Dòng log sau reboot không tự động là bằng chứng sống sót
    (mới, lượt này — xem §2.2):** dòng gateA poll 3 của R5 ghi
    19:44:10Z, sau reboot #48 (19:43:46Z), mà tiến trình ghi nó
    không thể sống qua reboot — R5 đã ghi là chưa giải thích
    được; S7 loại dòng này khỏi mọi bằng chứng. Lượt sau: khi
    gặp dòng log có timestamp sau một reboot mà tiến trình ghi
    không thể sống qua, ghi rõ là dị thường, loại khỏi bằng
    chứng, KHÔNG dùng để kẹp bất kỳ đoạn nào — đừng cố "giải
    thích cho xong" bằng giả thuyết chưa kiểm chứng.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #34 ĐÓNG HOÀN TOÀN (mới, lượt này, xem §2.3):**
   2 reboot đã chốt (#47 17:45:50Z, #48 19:43:46Z) + 0 reboot ẩn.
   Gap #46 → #47 = 2h01'01" và gap #47 → #48 = 1h57'56" ĐƯỢC
   CHỨNG NHẬN (mới — xem §2.5; chứng nhận #46 → #47 dựa một
   phần vào sàn cho đuôi 48 s — chờ parent xác nhận, nếu không
   đồng ý thì hạ về cận trên, CERT về n=26). Số thứ tự #47/#48
   vẫn TẠM THỜI (kế thừa mù #29/#30/#31 chưa đóng — tối đa "thực
   tế #52"). Dải cơ học cho #49 từ #48: [20:02:53Z, 22:57:54Z] —
   hiệu dụng [21:04:50Z, 22:57:54Z] sau probe #35; là phép áp dải
   máy móc, không phải dự báo.
2. **Khoảng mù #33 ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (R7 đợt 115).
   Gap #45 → #46 = 2h27'07" ĐÃ ĐƯỢC CHỨNG NHẬN (R7; parent đã
   chứng nhận gap #44 → #45, quyết parent 15/11).
3. **Khoảng mù #32 ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (Q6 đợt 114).
4. **Khoảng mù #31 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI, KHÔNG THỬ
   LẠI LƯỢT NÀY** (Q6 §2.6, R7 §2.6, S7 §2.6): 1 cửa sổ mở —
   8'55" (10:23:54Z → 10:32:49Z). Số reboot trong mù: 2 đã chốt
   (#43 08:53:37Z; #44 10:53:31Z) + có thể tối đa 1 ẩn. **Số thứ
   tự #43/#44 vẫn TẠM THỜI** — parent/user quyết xem có chấp nhận
   "ít nhất 2 reboot, có thể 3" làm mức đóng của mù #31 hay để mở
   như mù #24/#26/#28/#29/#30. S7 không tự quyết. Gap #43 → #44
   = 1h59'54" KHÔNG được chứng nhận (cận trên); không còn nguồn
   nào để thử thêm (trừ khi có nguồn mới thật sự).
5. **Khoảng mù #30 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (N6 §5 mục
   1, P6 §5 mục 2, Q6 §5 mục 3, R7 §5 mục 4): 3 cửa sổ mở, tổng
   30'50"; số reboot trong mù: 2 đã chốt + có thể tối đa 2 ẩn.
   Số thứ tự #41/#42 vẫn TẠM THỜI. Không còn dữ liệu nào để thu
   hẹp thêm — parent/user quyết. S7 không tự quyết.
6. **Khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (M4 §5 mục
   1, P6 §5 mục 3, Q6 §5 mục 4, R7 §5 mục 5): lỗ thật 14'31"
   theo M4 / 13'33" theo M9 birth-time, khe 79 s không loại trừ
   được; số reboot trong mù: 2 đã chốt + có thể 1 ẩn. Số thứ tự
   #39/#40 vẫn TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm —
   parent/user quyết. S7 không tự quyết.
7. **Khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục
   1, P6 §5 mục 4, Q6 §5 mục 5, R7 §5 mục 6): lỗ 23'39"
   (02:01:06Z → 02:24:45Z), khe 4'32" không loại trừ được; số
   reboot trong mù: 2 đã chốt + có thể 1 ẩn. Số thứ tự #37/#38
   vẫn TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm —
   parent/user quyết. S7 không tự quyết.
8. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
   1, P6 §5 mục 5, Q6 §5 mục 6, R7 §5 mục 7): lỗ 1h13'58"
   (19:20:19Z → 20:34:17Z) có thể chứa thêm reboot; số reboot
   trong mù: ít nhất 1 (#34), có thể nhiều hơn — không xác định
   được; số thứ tự #34 là TẠM THỜI. Không còn dữ liệu nào để thu
   hẹp thêm — parent/user quyết. S7 không tự quyết.
9. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1, P6 §5 mục 6, Q6 §5 mục 7, R7 §5 mục 8): lỗ 2h03'11"
   (12:28:41Z → 14:31:52Z) có thể chứa thêm reboot; số reboot
   trong mù: ít nhất 1 (#32), có thể nhiều hơn — không xác định
   được; số thứ tự #32 → #48 là TẠM THỜI. Không còn dữ liệu nào
   để thu hẹp thêm — parent/user quyết. S7 không tự quyết.
10. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục
    1, P6 §5 mục 7, Q6 §5 mục 8, R7 §5 mục 9): lỗ ~17'23"
    (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung gian.
    Không còn dữ liệu nào để thu hẹp thêm — parent/user quyết.
    S7 không tự quyết.
11. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
    §6 mục 3, P6 §5 mục 8, Q6 §5 mục 9, R7 §5 mục 10): cửa sổ lý
    thuyết ≤78 s với sàn 19'07". S7 không thử lại, không tự quyết
    — parent/user quyết giữ "đóng", "đóng có điều kiện", hay mở
    lại.
12. **Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
    riêng 10 phút vẫn chờ user quyết.
13. **Dị thường gateA poll 3 (R5, 19:44:10Z) vẫn CHƯA GIẢI THÍCH
    ĐƯỢC** (R5 LIMITS §1.4; S7 §2.2): dòng log ghi sau reboot #48
    bởi tiến trình không thể sống qua reboot. S7 loại khỏi bằng
    chứng; không ảnh hưởng kết luận mù #34. Parent có thể giao
    luồng hạ tầng điều tra cơ chế (đồng hồ nhảy sau reboot? exec
    service restart?) — S7 không tự kết luận.
14. **Nợ mở đợt 117 (kế thừa LIMITS gộp đợt 115 §10 + R7 §5):**
    E4 đã đóng đầy đủ (caveat gộp ghi rõ), zombie chuyển sang
    hướng sửa, điểm gãy tải (s76 thiếu 3 tick), migration lock v2
    (S4 đợt 116 đã làm), ngưỡng WebKit ≤60 ms cần lượt yên xác
    nhận, ghost stale seq 282–285, mù #33 đã mở (chứa #46 — nay
    ĐÃ ĐÓNG bởi R7, không còn mở), postboot + apt replay,
    headroom rơi liên tục, seek/preload UX, G1 + mù #22 + mù #28
    + mù #29 + mù #30 chờ user quyết, birefnet 0 lần thành công
    — chỉ thử lại khi RAM đổi (RAM khả dụng ~0,5–3,8 GB <
    ngưỡng 6 GB, u2net là fallback chính thức; max RAM trong mù
    #34 là 3,81 GB); ci-security.yml vẫn 403 chờ user; TTS 39
    CẤM kiểm lại; WebKit clip D, pre-pass keyframes, motion blur
    + mask, trackgeq, fallback, harness O8. **Đính chính:** mù
    #33 nay ĐÃ ĐÓNG HOÀN TOÀN (R7) và mù #34 nay ĐÃ ĐÓNG HOÀN
    TOÀN (S7) — không còn mù mở nào chứa #46/#47/#48.
