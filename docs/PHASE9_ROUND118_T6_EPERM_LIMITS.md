# PHASE9 ROUND118 T6 — EPERM: probe #37 + mù #36 ĐÓNG HOÀN TOÀN + GIÂY NHÁY (clock discontinuity) tại #54 + WFS lần 24 chênh 0

> Luồng T6, đợt 118 vòng lặp Phase 9 VCut Studio (lượt cron 18:35 +07,
> 15/11/2026; làm việc 11:38Z → 12:1xZ 15/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + probe #37 cho mù
> #36 + quét sóng EPERM + quét writeFileSync lần thứ 24 + ghi RAM
> (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round118-t6/prereg-t6.md (định nghĩa probe #37, mốc đối
> chiếu, tiêu chí đóng mù #36, cách xử lý sàn đoạn A/B/C).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #31, mù #30, mù #29, mù #28,
> mù #26, mù #24, mù #21, hay reboot #16** — chỉ báo cáo "không thấy"
> vs "không có". Mù #31 KHÔNG thử lại (đã thử hết nguồn ở đợt 114).
> G1 + mù #22/#28/#29/#30 chờ user quyết — chỉ ghi nhận trạng thái.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (11:39:40Z → 11:39:54Z):**
  `status` báo **DEAD/STALE** (heartbeat age 10.619 s, last #36
  08:42:46Z, boot 22536366, exit 1 theo quy định script — exit lấy từ
  `$?` trực tiếp, không qua pipe, xem §1); `once` ngay sau đó là
  **probe #37, boot 48a82db1, ok=2 fail=0**, exit 0, 11:39:50Z;
  `status` chạy lại **ALIVE** (age 4 s, n=37), exit 0. Log v2 tăng đúng
  **3 dòng** checklist (100 → 103): dòng DEAD mới cho heartbeat #36 +
  dòng `boot changed` + dòng probe #37 — **như R7/S7/T7 (+3) vì lượt
  này chưa có dòng DEAD nào cho #36**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=37, ts 11:39:50Z, boot 48a82db1.
- **Reboot #54 lúc 10:48:26Z (post-clock, chính xác từng giây),
  boot `48a82db1-a8e4-41fe-9c9d-08719ce19250`** — xác minh bằng
  `uptime -s` ×2 + btime 1794739706 + `who -b` + journal 1 boot +
  wtmp + `ps` systemd PID 1 START 10:48:36 (xem §1). Gap #53→#54
  theo đồng hồ VM = **1h01'18" — SAI, xem phát hiện giây nhảy dưới**.
- **PHÁT HIỆN MỚI — GIÂY NHÁY (clock discontinuity) tại reboot #54
  (xem §2.2): đồng hồ VM NHẢY LÙI 17–21 phút tại #54.** Bằng chứng
  quyết định: dòng `O8-WebKit exit=2 2026-11-15T10:51:49Z boot
  574e3d6b` trong t10-o8.log — script driver đọc boot_id TƯƠI từ
  /proc NGAY lúc ghi (dòng 44: `boot $(cat
  /proc/sys/kernel/random/boot_id)`) — nếu viết sau reboot thì /proc
  phải trả 48a82db1; nó trả 574e3d6b nên dòng này viết TRƯỚC reboot,
  ở mốc clock 10:51:49Z — LỚN HƠN clock boot mới 10:48:26Z. Đồng hồ
  đã lùi. Độ lệch thay đổi **Δ ∈ (16'30", 21'30"]**: poller 5 phút
  của T5 (vòng `while true`, file break `round117-t5-done` KHÔNG BAO
  GIỜ tồn tại do sai tên — xem §4 mục 32) còn sống ở poll cuối
  11:04:56Z (pre-clock) và chết trước poll kế 11:09:56Z → reboot ở
  pre-clock (11:04:56Z, 11:09:56Z]. **Kiểm độc lập: clock VM hiện
  tại CHÍNH XÁC so với UTC thật** (HTTP `Date` của 3 server độc lập
  example.com / google.com / cloudflare.com khớp `date -u` trong
  1–4 s, xem §2.2) → F54 ≈ 0, clock trong boot #53 NHANH ~17–21
  phút so với UTC thật. Hệ quả: **gap #53→#54 THẬT = 1h01'18" + Δ
  ∈ (1h17'48", 1h22'48"]** (khoảng, không phải điểm); gap #52→#53
  THẬT ∈ [1h14'44", 1h19'44") (xem §2.2). **Scheduler KHÔNG độc lập
  với clock VM** (nếu độc lập thì F52 ≤ 3'16", mâu thuẫn F52 >
  13'18" suy từ chuỗi — xem §2.2): mọi mốc giờ trước #54 đều nằm
  trong epoch clock nhanh, chỉ khoảng cách giữa các reboot kề mới
  đáng tin khi độ lệch ổn định.
- **Khoảng mù #36: 08:42:46Z → 11:39:50Z (2h57'04") — ĐÓNG HOÀN
  TOÀN (mới, lượt này).** Đoạn A **ĐÓNG** (poller T10 #1 + sàn
  đầu/đuôi); đoạn B **ĐÓNG** (poller T10 #2 #1–#14 + gate0-poll #1–#6
  + poll5m tới 11:04:56Z + sàn đuôi — đuôi (thật) = Δ − 5'31" ∈
  (10'59", 15'59"] < sàn 19'07" ở cả hai đầu Δ); đoạn C **ĐÓNG**
  (đo uptime trực tiếp lúc probe #37 + dấu boot tươi sibling đợt
  118 + replay #54 + postboot #54 PASS). **0 cửa sổ mở, 0 reboot
  ẩn.** Chuỗi mù đóng khởi động lại sau mù #35 (mở): #32/#33/#34
  đóng → #35 mở → **#36 đóng**.
- **Gap #52 → #53 ∈ [1h14'44", 1h19'44") và gap #53 → #54 ∈
  (1h17'48", 1h22'48"] — CẢ HAI ĐƯỢC CHỨNG NHẬN (mới, lượt này,
  theo khoảng; xem §2.5).** Tập gap đơn đã chứng nhận tăng
  **n=28 → n=30**; toàn chuỗi **n=43 → n=45** (tính ở điểm giữa
  1h17'14" và 1h20'18"; độ nhạy đầu mút chỉ ±10 s trên trung bình
  — xem §2.5). Dải chứng nhận [19'07", 3h14'08"] không đổi (cả hai
  gap mới nằm giữa). **Số thứ tự #47–#54 vẫn TẠM THỜI** (mù #35
  chưa đóng, tối đa +24 ẩn danh nghĩa → "thực tế #54" có thể tới
  #82; xem §2.2).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong 125
  file *.log có mtime trong mù #36 (0 file repo-1, 125 file
  hidden_files — đếm lại độc lập từ đĩa, đã loại
  eperm-sweep*.log theo bài học T7); 5 dòng "sóng EPERM đã tắt" đều
  là **dương tính giả đã biết** (dòng launcher T10 O8 ×2 + T1 ×3).
  Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~95h29'** trước
  probe #37. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 24: 751 dòng / 208 file** (phạm vi 2903
  file); R7b đối chiếu 776 dòng / 225 file; copies 25 dòng / 17 file
  — y hệt lần 23; đối chiếu chéo 751+25=776=R7b, **chênh 0 — lần
  thứ hai mươi tư liên tiếp**. +29 dòng / +5 file so với lần 23,
  giải thích đúng hết bằng diff (xem §2.7). Async `.writeFile(`:
  vẫn đúng **2 vị trí, cả hai trong helper retry đã biết** — 0 stray;
  mtime 2 helper không đổi từ 10/11.
- RAM: 4 mẫu MemAvailable của lượt: **1.117.676 kB (11:38:08Z) /
  1.103.492 kB (11:39:40Z, lúc probe #37) / 553.276 kB (11:56:33Z,
  lúc bắt đầu scan — thấp nhất lượt) / 1.419.420 kB (11:59:25Z, lúc
  scan xong)**. Max RAM biết được **trong** mù #36 từ log sibling:
  **4.080 MB** (free=, T3 driver, 09:38:22Z, đoạn A) = 66% ngưỡng
  guard; max RAMavail rõ ràng **3.626 MB** (T6 gateA poll 12,
  09:38:45Z, đoạn A) = 59% guard; đoạn B max **3.122 MB** (T3 s80b,
  10:27:34Z). Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong
  gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ parent/user quyết); cron
  riêng 10 phút vẫn chờ user quyết.
- **Không có reboot mới trong lúc T6 làm việc** (boot vẫn 48a82db1,
  uptime-s 10:48:26Z lúc 12:08:46Z — kiểm lại trước khi viết LIMITS).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 11:39:40Z | boot_id `48a82db1-a8e4-41fe-9c9d-08719ce19250`; `who -b` Nov 15 10:48; `uptime -s` **2026-11-15 10:48:26** (2 lần, giống nhau từng giây); btime **1794739706 = 2026-11-15T10:48:26Z**; journal chỉ 1 boot (48a82db1, first entry 10:48:38Z, last 11:38:56Z lúc kiểm tra); `last -x reboot` 10:48 still running; wtmp bắt đầu 10:48:37Z; `ps` systemd PID 1 START 10:48:36, hatch 10:48:37, hatch-execd 11:35:38 |
| `bash scripts/probe-eperm-v2.sh status` | 11:39:45Z | **DEAD/STALE**, heartbeat n=36, ts 08:42:46Z, boot 22536366, age **10.619 s** (đúng 2h56'59"); last sample probe #36; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp, ghi trong status1.txt — không qua pipe) |
| `bash scripts/probe-eperm-v2.sh once` | 11:39:50Z | **probe #37, boot=48a82db1, ok=2 fail=0**, exit 0; dòng `boot changed 22536366 -> 48a82db1` (uptime since 2026-11-15 10:48:26) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 11:39:54Z | **ALIVE**, age 4 s, n=37, exit 0 |

Kiểm lại từ đĩa (11:39Z): log probe v2 **103 dòng** — 100 sau T7 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #36 +
dòng `boot changed` + dòng probe #37). **Như R7/S7/T7 (+3):** lượt này
chưa có dòng DEAD nào cho heartbeat #36 nên `status` 11:39:45Z
ghi thêm đúng 1 dòng DEAD ("probe DEAD detected by status (last
#36 at 2026-11-15T08:42:46Z, age 10619s, no probe end since last
start)"). Prereg §1 đã dự báo đúng +3 trước khi đo (ghi rõ cơ sở:
chưa có dòng DEAD nào cho #36). Heartbeat **n=37, ts
2026-11-15T11:39:50Z, boot 48a82db1-…**; log vẫn chỉ có **ĐÚNG 1
dòng `probe start`** (08:49:50Z 11/11) và **0 dòng `=== probe
end`** — loop v2 chưa từng được start lại kể từ đợt 88 (đếm bằng
grep chính xác `=== probe end`, không dùng substring — xem T7 §4
mục 24).

**Ghi rõ phương pháp exit code (áp dụng đính chính của N6 §1):**
cả 3 lệnh checklist đều ghi output ra file riêng (status1.txt,
once.txt, status2.txt) rồi đọc `$?` trực tiếp, KHÔNG qua `| tee`
— số exit trên là exit thật của script (status 1 STALE / once 0 /
status 0 ALIVE), đúng quy định header script. File
`probe-notes.txt` chỉ chứa phần xác minh boot độc lập, không chứa
exit code.

Nguồn độc lập cho boot #54: prereg T2/T3 đợt 118 (boot 48a82db1,
uptime-s 10:48:26Z, ~11:36–11:38Z) + T7-infra t7-initial-state.md
(btime 1794739706 = 10:48:26Z; journal 1 boot; wtmp/log cũ đã mất)
+ t7-replay-done.md (replay #54 11:35:40–11:40:56Z, postboot
check-only exit=0 PASS, headroom exit=0, RAM 1303 MB, ghi
11:41:29Z) + vite-lock tickets của T1/T2/T3/T4/T5 đợt 118 (started
11:39:24Z, 11:41:38Z, 11:41:42Z, 11:41:52Z, 11:41:55Z — đều
boot=48a82db1, đọc tươi từ /proc lúc lấy ticket). **Số thứ tự TẠM
THỜI** (xem §0).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như I7/J8/K6/L6/M4/N6/P6/Q6/R7/S7/T7
đã đính chính.

## 2. Điều tra khoảng mù #36 (08:42:46Z → 11:39:50Z, 2h57'04")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #37: `uptime -s` = **2026-11-15 10:48:26Z**,
  boot_id `48a82db1-a8e4-41fe-9c9d-08719ce19250` — khác boot của
  probe #36 (22536366).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (11:39Z): chỉ **1 boot**
  (48a82db1, first entry 10:48:38Z, last 11:38:56Z). `last -x
  reboot`: chỉ 1 dòng (10:48, still running). wtmp bắt đầu
  10:48:37Z. Journal/wtmp của boot 574e3d6b đã mất theo reboot
  #54 — như mọi lần trước, chỉ giữ boot hiện tại.
- **dpkg.log ĐÃ BỊ CẮT NGẮN theo boot (mới, lượt này):** file
  `/var/log/dpkg.log` hiện chỉ có **1.509 dòng, dòng đầu tiên là
  2026-11-15 11:35:40Z** (replay #54) — 2 dòng replay #53
  09:48:02–03Z mà T10 thấy ở đợt 117 đã BIẾN MẤT. Không có file
  dpkg.log.1 hay rotation nào. T7-infra xác nhận: tổng 1.509 dòng,
  replay #54 11:35:40–11:40:56Z. **Hệ quả phương pháp:** sau mỗi
  reboot, log hệ thống (journal/wtmp/dpkg) chỉ giữ boot hiện tại —
  điều tra mù chỉ còn dựa vào log của các luồng agent trên đĩa
  (chúng sống sót qua reboot vì nằm trên volume bền), không dựa
  vào log hệ thống của boot cũ. T7 đã ghi nhận điều này cho
  journal/wtmp; lượt này bổ sung dpkg.log cũng vậy.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu (kiểm lại lượt này).
  `btmp` cũng chỉ bắt đầu 10:48:38Z (boot hiện tại).

### 2.2 Hai reboot đã chốt trong mù — #53 (09:47:08Z, VM53 clock), #54 (10:48:26Z, VM54 clock) + GIÂY NHÁY Δ ∈ (16'30", 21'30"]

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 53 | **09:47:08Z** (chính xác từng giây, theo đồng hồ VM53 — epoch nhanh, xem dưới) | 22536366 → 574e3d6b | Chốt từ T10 đợt 117 (poller #2 RESTART đọc `uptime -s`/`boot_id` tươi 09:48:56Z). **Xác nhận lại lượt này:** poller T10 #1 poll #14 09:43:56Z (boot #52 còn sống) + marker RESTART 09:48:56Z đọc boot tươi 574e3d6b + uptime-s 09:47:08Z + poller T5 gate0-poll start 10:25:44Z đọc boot=09:47:08 + 6 postboot run 10:25:46–10:50:47Z đều cite boot 09:47:08. **Số thứ tự TẠM THỜI** (xem dưới). Giờ thật của #53 = 09:47:08Z − F53, F53 ∈ (16'30", 21'30"] → thật ∈ (09:25:38Z, 09:30:38Z]. |
| 54 | **10:48:26Z** (chính xác từng giây, theo đồng hồ VM54 — đã kiểm là chính xác so với UTC thật, xem dưới) | 574e3d6b → 48a82db1 | Chốt từ lượt này: 2 phép đo `uptime -s` độc lập trên boot mới (11:39:40Z, giống nhau từng giây) + btime 1794739706 + `who -b` 10:48 + boot_id 48a82db1 + journal first entry 10:48:38Z + wtmp begins 10:48:37Z + `ps` systemd PID 1 START 10:48:36 (đều ghi trong probe-notes.txt lúc 11:39Z) + probe #37 11:39:50Z boot 48a82db1 ok=2 fail=0 + dấu boot tươi sibling đợt 118 (T2/T3 prereg, T7-infra initial-state + replay-done, vite-lock tickets 11:39–11:41Z). **Số thứ tự TẠM THỜI** (xem dưới). Giờ thật của #54 = 10:48:26Z (F54 ≈ 0). |

**Bằng chứng giây nháy (PROOF, không phải suy diễn):**

1. **Dòng O8-WebKit exit (quyết định):** file
   `hidden_files/round117-t10/t10-o8.log` dòng cuối:
   `O8-WebKit exit=2 2026-11-15T10:51:49Z boot
   574e3d6b-4a99-4b6b-b6e4-307148232a98`. Script driver
   `t10-o8-driver.sh` dòng 44 viết dòng này bằng:
   `echo "O8-WebKit exit=$? $(date -u +%FT%TZ) boot $(cat
   /proc/sys/kernel/random/boot_id)" >> "$LOG"` — `$(cat
   /proc/...)` được đánh giá NGAY lúc ghi (không phải biến cache
   từ lúc start; dòng start ở dòng 16 mới cache boot vào chuỗi
   khác). Nếu dòng này viết sau reboot #54, /proc phải trả
   48a82db1. Nó trả 574e3d6b → **dòng này viết TRƯỚC reboot, ở mốc
   clock 10:51:49Z**. Boot mới có clock 10:48:26Z < 10:51:49Z →
   **đồng hồ đã lùi ít nhất 3'23" tại #54**. Không có cách nào một
   tiến trình chết bởi reboot lại viết được dòng này sau reboot —
   và không có tiến trình nào khác viết vào file này (driver chạy
   một lần duy nhất, xem t10-o8-driver.out: 1 dòng start
   10:46:41Z boot 574e3d6b + 1 dòng `O8 DONE 10:51:49Z`).
2. **Poller T10 #2 "sống qua" #54 theo clock (giải thích được nhờ
   giây nháy, KHÔNG còn là dị thường):** poll #13 10:48:57Z và #14
   10:53:57Z nằm SAU 10:48:26Z theo clock-reading, nhưng script
   `poll-t10.sh` là vòng `for i in $(seq 1 35)` + `sleep 300`,
   không có cơ chế restart, in header `=== T10 poller start ===`
   mỗi lần chạy — log chỉ có ĐÚNG 1 header cho poller #2
   (09:48:56Z) và số thứ tự liên tiếp #1–#14, bước 300/301 s
   (kiểm bằng code, xem §2.3). Dưới giả thuyết không giây nháy,
   #13/#14 là không thể (tiến trình đã chết). Dưới giây nháy,
   #13/#14 viết TRƯỚC reboot ở pre-clock — hoàn toàn nhất quán.
   Tương tự driver O8 (chạy 10:46:41–10:51:49Z, pre-clock) và T10
   recount (recount-push.py mtime 10:55:38Z, T10.done 11:02:12Z).
   **Kết luận: không có tiến trình nào sống qua reboot; chính
   đồng hồ đã nhảy.** Việc T10/LIMITS gộp đợt 117 KHÔNG nhắc #54
   cũng được giải thích: T10 xong việc (done 11:02:12Z pre-clock)
   và parent đóng đợt (LIMITS gộp 11:05:20Z pre-clock) TRƯỚC khi
   reboot xảy ra (pre-clock ~11:06–11:09Z); parent chỉ biết #54 ở
   lượt spawn đợt 118 (11:35:51Z post-clock).
3. **Cận của độ lệch Δ = F53 − F54 (F = clock − UTC thật):**
   - **Cận dưới Δ > 16'30":** poller 5 phút của T5
     (`poll-t5.sh`: vòng `while true`, `sleep 300`, poll cuối
     11:04:56Z pre-clock) còn sống ở 11:04:56Z → reboot ở pre-clock
     SAU 11:04:56Z → Δ > 11:04:56Z − 10:48:26Z = 16'30".
   - **Cận trên Δ ≤ 21'30":** poller đó KHÔNG viết poll kế lúc
     11:09:56Z pre-clock (poll5m: 30 dòng, bước 300/301 s trừ 1
     bước restart 216 s; 0 dòng "poller dung" = chết do bị giết,
     không thoát sạch — kiểm bằng code). Vòng lặp là vô hạn: điều
     kiện break `[ -f "$H/round117-t5-done" ]` KHÔNG BAO GIỜ đúng
     vì file thật tên `round117-t5.done` (dấu chấm), còn script
     kiểm `round117-t5-done` (dấu gạch ngang) — file gạch ngang
     KHÔNG TỒN TẠI (kiểm trực tiếp; xem §4 mục 32 — bug này vô tình
     giữ poller sống làm observer). Poller chỉ có thể chết do
     reboot → reboot ở pre-clock ≤ 11:09:56Z → Δ ≤ 21'30".
   - **F54 ≈ 0 (kiểm độc lập):** `date -u` 11:49:04Z vs HTTP
     `Date` của example.com 11:49:06Z, google.com 11:49:07Z,
     cloudflare.com 11:49:08Z (3 server độc lập, gọi nối tiếp mỗi
     cái cách nhau ~1 s) — khớp trong 1–4 s, đúng độ trễ gọi. Clock
     VM hiện tại chính xác so với UTC thật. (worldtimeapi.org
     không trả về gì trong 10 s — không dùng, không cần.)
   - Suy ra **F53 ∈ (16'30", 21'30"]** (clock boot #53 NHANH
     ~17–21 phút so với UTC thật) và **F52 ∈ (13'18", 21'30"]**
     (từ F53 − F52 < 3'12" — xem dưới).
4. **F53 − F52 < 3'12" (độ lệch ổn định qua #53):** poller T10 #1
   (boot #52) poll cuối 09:43:56Z (clock VM52) còn sống → reboot
   #53 (thật) SAU thời điểm đó: 09:43:56Z − F52 < 09:47:08Z − F53
   ⟹ F53 − F52 < 3'12". Và **F52 − F53 < 1'48"**: poll kế của
   poller #1 đến hạn 09:48:56Z (clock VM52) nhưng KHÔNG BAO GIỜ
   viết (poller chết theo #53) → reboot #53 (thật) TRƯỚC thời điểm
   đó: 09:47:08Z − F53 < 09:48:56Z − F52 ⟹ F52 − F53 < 1'48".
   Vậy **F52 − F53 ∈ [−3'12", 1'48")** — độ lệch gần như không đổi
   qua #53.
5. **Scheduler KHÔNG độc lập với clock VM (suy ra, mới):** nếu
   scheduler chạy bằng UTC thật độc lập thì T7 (đợt 117) đọc clock
   VM52 lần đầu 08:39:07Z sau lượt spawn 08:35:51Z (scheduler) →
   F52 ≤ 3'16". Nhưng chuỗi trên cho F52 > 13'18". Mâu thuẫn →
   scheduler chia sẻ epoch clock lệch với VM (cùng host clock).
   **Hệ quả: mọi mốc giờ tuyệt đối trước #54 trong toàn bộ hồ sơ
   đều nằm trong epoch nhanh (lệch F ≈ 13–21 phút so với UTC
   thật); nhịp 3h/lượt không đổi (khoảng cách không ảnh hưởng);
   các gap giữa hai reboot kề chỉ đúng khi F ổn định qua reboot
   đó** — đã chứng minh F ổn định qua #53 (trong 3'12") nhưng
   KHÔNG chứng minh được cho các reboot trước #52 (không có kiểm
   HTTP Date nào trước đây). Đây là caveat phương pháp mới cho
   toàn bộ chuỗi gap — xem §4 mục 33 và §5 mục 17. T6 KHÔNG viết
   lại lịch sử: các gap đã chứng nhận trước đây giữ nguyên (không
   có bằng chứng độ lệch từng thay đổi trước #54; phân phối gap
   CERT chặt, sd 42', không có outlier kiểu ±20 phút — xem §2.5).

**Gap thật (sau hiệu chỉnh giây nháy):**
- Gap #52 → #53 (thật) = 1h17'56" + (F52 − F53), F52 − F53 ∈
  [−3'12", 1'48") → **[1h14'44", 1h19'44")**, điểm giữa 1h17'14"
  (4634 s). ĐƯỢC CHỨNG NHẬN (xem §2.3 + §2.5).
- Gap #53 → #54 (thật) = 1h01'18" + Δ, Δ ∈ (16'30", 21'30"] →
  **(1h17'48", 1h22'48"]**, điểm giữa 1h20'18" (4818 s). ĐƯỢC
  CHỨNG NHẬN (xem §2.3 + §2.5). **Số 1h01'18" trong brief và
  build-loop-log chỉ là hiệu số đồng hồ VM chưa hiệu chỉnh — KHÔNG
  phải gap thật; T6 đính chính tại đây.**
- **Tính tạm thời của số thứ tự (ghi rõ, không giấu):** #53/#54 kế
  thừa tính tạm thời từ mù #29 chưa đóng (khe 79 s, M4 §2.3), mù
  #30 chưa đóng (3 cửa sổ mở, N6 §2.3), **mù #31 chưa đóng (1 cửa
  sổ mở 8'55", xem §2.6)** và **mù #35 chưa đóng (3 cửa sổ mở,
  tổng 6h49'50", tối đa +24 ẩn danh nghĩa — xem T7 §2.3)**: nếu mù
  #29 chứa 1 reboot ẩn, mù #30 chứa tối đa 2, mù #31 chứa tối đa 1
  và mù #35 chứa tối đa 24 thì "reboot #54" thực tế có thể là
  **#82**. **Giá trị các gap không phụ thuộc số thứ tự** — chỉ phụ
  thuộc giờ đã chốt (và nay thêm hiệu chỉnh giây nháy).

### 2.3 Hoạt động trong khoảng mù — vì sao ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **21 file** +
hidden_files **457 file** (không tính chrome-userdata); **478
file, 469 mốc giây phân biệt** (độ chính xác đầy đủ — theo cách
đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 19/P6 §4 mục 20/Q6 §4 mục
20/R7 §4 mục 20/S7 §2.3/T7 §2.3). Chia mù làm ba đoạn bởi #53
(09:47:08Z, VM53 clock), #54 (10:48:26Z, VM54 clock):

- **Đoạn A: 08:42:46Z → 09:47:08Z (1h04'22", boot #52 22536366) —
  ĐÓNG bằng đo uptime tại probe #36 + poller T10 #1 đơn nhất + sàn
  đầu/đuôi:**
  - Probe #36 (08:42:46Z) đo uptime chứng minh up liên tục từ
    08:29:12Z tới 08:42:46Z — đóng tới 08:42:46Z.
  - **Poller T10 #1 là 1 tiến trình duy nhất (kiểm bằng code từ
    nội dung log — xem blind36-investigate.log):** START
    08:38:55Z, 14 poll liên tiếp #1–#14, đúng số thứ tự, đúng
    300/301 s mỗi bước (08:38:55Z → 09:43:56Z), không trùng,
    không thiếu số, không có #1 thứ hai; script `poll-t10.sh` là
    vòng `for i in $(seq 1 35)` + `sleep 300` foreground, **không
    có cơ chế restart nào**. Reboot sẽ giết tiến trình poller →
    không còn poll sau đó; poll tồn tại tới 09:43:56Z nên **không
    reboot nào trong (08:38:55Z, 09:43:56Z]** (cùng epoch VM52).
  - Đầu (08:42:46Z, 08:43:55Z] 69 s: t trong đó thỏa t − #52 ≤
    14'43" < sàn 19'07" → sàn đóng (vi phạm sàn so với #52; cùng
    epoch VM52). Đuôi (09:43:56Z, 09:47:08Z] 3'12" theo clock
    (thật ∈ [0, 5'00") sau hiệu chỉnh F52−F53 ∈ [−3'12", 1'48"))
    < sàn 19'07" → sàn đóng (vi phạm sàn so với #53). Kiểm cả hai
    bất đẳng thức sàn trước khi kết luận (bài học T7 §4 mục 30).
  - **Dấu boot tươi củng cố (đọc /proc tại thời điểm ghi):**
    prereg T1/T2/T3/T5/T6 đợt 117 (boot 22536366, uptime-s
    08:29:12Z, ~08:40–08:44Z) + session c0670ea8
    proc_61d4eb724807.log (boot=22536366, uptime 08:44:02Z) + T7
    đợt 117 làm việc 08:38–08:57Z trên boot #52 + T8 postboot #52
    PASS + replay #52 (dpkg.log 08:37:56Z — dòng này nay đã mất
    theo dpkg.log bị cắt, chỉ còn trong LIMITS T7/T8 đương thời).
  - **Session bắc qua cắt sàn:** 6 session bắc qua cắt A-lo
    (08:48:19Z) — trong đó c0670ea8 (birth 08:44:02Z, mtime
    09:17:40Z, đọc boot tươi 08:44:02Z); 2 session bắc qua cắt
    A-hi (09:28:01Z) — 973ced34 proc_98c3dc811a4e (birth 09:05:45Z,
    mtime 09:30:35Z) + 473c1e2d proc_4bfd0190beba (birth 09:25:56Z,
    mtime 09:28:28Z). Chỉ củng cố (poller đã phủ).
  - Mật độ mtime củng cố (243 mốc, lỗ lớn nhất chỉ 293 s) nhưng
    không dùng để đóng. **Kết luận đoạn A: ĐÓNG.**
- **Đoạn B: 09:47:08Z → T54 pre-clock (11:04:56Z, 11:09:56Z]
  (thật 1h17'48"–1h22'48", boot #53 574e3d6b) — ĐÓNG bằng poller
  T10 #2 + gate0-poll + poll5m + sàn đuôi:**
  - **Poller T10 #2 là 1 tiến trình duy nhất (kiểm bằng code):**
    marker RESTART 09:48:56Z đọc boot tươi 574e3d6b + uptime-s
    09:47:08Z; START 09:48:56Z; 14 poll liên tiếp #1–#14, đúng số
    thứ tự, đúng 300/301 s mỗi bước (09:48:56Z → 10:53:57Z);
    script không có cơ chế restart. Đóng (09:48:56Z, 10:53:57Z]
    (cùng epoch VM53). Poll #13/#14 (10:48:57Z, 10:53:57Z) viết
    TRƯỚC reboot ở pre-clock (xem §2.2 — không còn là dị thường).
  - **Gate0-poll của T5 (observer độc lập thứ hai):** start
    10:25:44Z đọc boot=09:47:08; 6 poll #1–#6, 300/301 s đều
    (10:25:46Z → 10:50:47Z), mỗi lần chạy postboot check tươi
    (6 file postboot-t5-gate0poll-*.log đều cite boot 09:47:08),
    đều postboot_exit=1, apt_procs=0. Đóng (10:25:46Z, 10:50:47Z]
    bằng đo boot tươi lặp lại. Session chứa output này
    (proc_73c250618b6c.log, birth 10:49:05Z, mtime 10:52:03Z) bắc
    qua cắt B-hi-max (10:50:49Z) — 1 session duy nhất bắc qua cắt
    này.
  - **Poller 5 phút của T5 (observer độc lập thứ ba, phủ đuôi
    đoạn B):** restart sau #53 (bước 216 s ở 09:46:18Z → 09:49:54Z
    — relaunch, không phải clock step: các bước còn lại đều
    300/301 s); poll liên tiếp 09:49:54Z → 11:04:56Z (30 poll
    tổng, 28 bước 300/301 s + 1 bước restart); vòng `while true`
    vô hạn, break không bao giờ đúng (sai tên file, xem §2.2),
    0 dòng "poller dung" → chết do reboot. Đóng (09:49:54Z,
    11:04:56Z] (cùng epoch VM53).
  - Đầu (09:47:08Z, 09:48:56Z] 1'48" — t trong đó thỏa t − #53 ≤
    1'48" < sàn → sàn đóng (vi phạm sàn so với #53; cùng epoch
    VM53); đồng thời đóng bằng đọc boot tươi lúc RESTART.
  - Đuôi sau quan sát cuối 11:04:56Z (VM53) tới T54 pre-clock ∈
    (11:04:56Z, 11:09:56Z]: ≤ 5'00" < sàn → sàn đóng. Kể cả chỉ
    dùng poller #2 (tới 10:53:57Z): đuôi (thật) = Δ − 5'31" ∈
    (10'59", 15'59"] < sàn 19'07" ở CẢ hai đầu Δ (tính bằng code,
    xem blind36-gaps.txt) → sàn đóng. **Đoạn B đóng vững cả khi
    bỏ qua poll5m.**
  - **Session bắc qua cắt sàn:** 3 session bắc qua cắt B-lo
    (10:06:15Z) — 973ced34 proc_37bffb9ec302 (birth 09:50:06Z,
    mtime 10:14:56Z), 20f963cd proc_0d13ac725e40 (10:01:19Z →
    10:08:16Z), 3d15bc10 proc_5deecd6f9bf0 (10:02:31Z →
    10:12:30Z); 1 session bắc qua cắt B-hi-max (10:50:49Z, xem
    trên). Chỉ củng cố.
  - Mật độ mtime củng cố (189 mốc, lỗ lớn nhất 604 s) nhưng không
    dùng để đóng. Quét ngoài hai cây: 53 file (22 tmp-q6r3-debroot,
    19 proactivity, 10 repo-1-push/paths-loop, 1 proactive_messages,
    1 system_prompt) — **0 file chứa boot_id/uptime** (grep trực
    tiếp), tất cả mtime-only, không thu hẹp được khe (quy tắc N6 §4
    mục 2). /tmp: 0 file trong mù #36. **Kết luận đoạn B: ĐÓNG.**
- **Đoạn C: 10:48:26Z → 11:39:50Z (51'24", boot #54 48a82db1) —
  ĐÓNG bằng đo uptime trực tiếp + probe #37 + dấu boot tươi:**
  - **`uptime -s` ×2 lúc 11:39:40Z = 10:48:26Z** chứng minh máy
    up liên tục từ #54 tới lúc đo; probe #37 11:39:50Z đọc
    boot_id 48a82db1 tươi — cùng boot_id với boot bắt đầu
    10:48:26Z. (Nguyên tắc như P6 §2.3 đoạn C mù #31 và Q6 §4
    mục 21: đo uptime tại thời điểm probe ĐÓNG toàn bộ đoạn từ
    reboot cuối tới lúc đo — sàn chỉ áp dụng GIỮA hai reboot đã
    biết, không áp cho đuôi sau reboot cuối.)
  - **Chuỗi dấu boot tươi củng cố (đọc boot_id/uptime trực tiếp
    từ /proc tại thời điểm ghi — đều sau probe #37 hoặc quanh đó,
    chỉ củng cố):** prereg T2/T3 đợt 118 (boot 48a82db1, uptime-s
    10:48:26Z, ~11:36–11:38Z) + T7-infra t7-initial-state.md (btime
    1794739706 = 10:48:26Z) + t7-replay-done.md (replay #54
    11:35:40–11:40:56Z, postboot exit=0 PASS, ghi 11:41:29Z) +
    vite-lock tickets T1/T2/T3/T4/T5 (started 11:39:24Z, 11:41:38Z,
    11:41:42Z, 11:41:52Z, 11:41:55Z — boot=48a82db1) + T10 đợt 118
    poll log (boot 48a82db1) + T6 tự kiểm lại lúc 12:08:46Z (boot
    vẫn 48a82db1, uptime-s 10:48:26Z — không reboot mới trong lúc
    làm việc).
  - Lỗ mtime lớn nhất đoạn C theo clock-reading: **1.997 s
    (11:05:20Z → 11:38:36Z)** — đây là khoảng máy yên sau khi
    parent đóng đợt 117 (LIMITS gộp 11:05:20Z, pre-clock) tới khi
    đợt 118 spawn (11:35:51Z) + T6 đo; lỗ này TRỘN HAI EPOCH
    (pre-clock 11:05:20Z thuộc boot #53, post-clock 11:38:36Z
    thuộc boot #54) nên không phải một lỗ quan sát thuần — nó chứa
    reboot #54 + giây nháy. Nằm trong đoạn đã đóng bằng uptime
    trực tiếp nên không tạo cửa sổ mở (quy tắc N6 §4 mục 2).
  - 0 session exec bắc qua vùng B-tail/C-idle theo clock-reading
    (10:53:57Z–11:35:40Z) — không có foreground exec session nào
    trong khoảng đó; observer ở đó là các tiến trình detached
    (poll5m tới 11:04:56Z) + ghi file (recount-push.py 10:55:38Z,
    T10.done 11:02:12Z, LIMITS gộp 11:05:20Z).
  - Kết luận đoạn C: **ĐÓNG**.

**Kết luận trung thực: khoảng mù #36 ĐÓNG HOÀN TOÀN.** 2 reboot đã
chốt giờ trong mù (#53 09:47:08Z VM53-clock, #54 10:48:26Z VM54-clock)
+ **0 cửa sổ mở, 0 reboot ẩn**. Gap #52→#53 ∈ [1h14'44",
1h19'44") và gap #53→#54 ∈ (1h17'48", 1h22'48"] được chứng nhận
theo khoảng (xem §2.5); cả hai đều nằm trong dải chứng nhận. Chuỗi
mù đóng khởi động lại: #32/#33/#34 đóng → #35 mở → **#36 đóng**.
Số thứ tự #53/#54 vẫn TẠM THỜI (xem §2.2 — "thực tế #54" có thể
tới #82 do mù #35 chưa đóng).

### 2.4 Quét sóng EPERM trong mù #36 — 0 sóng thật (bằng chứng âm tính)

Quét toàn bộ file *.log trong mù #36 (bằng script eperm-sweep.py,
chạy 12:0xZ; eperm-sweep*.log của chính mình bị loại theo bài học
T7 §4 mục 19):

| Phạm vi quét | "vẫn bật" | "CẢNH BÁO 10 phút" | "Operation not permitted" | "sóng EPERM đã tắt" |
|---|---|---|---|---|
| repo-1 (0 file) | 0 | 0 | 0 | 0 |
| hidden_files (125 file) | 0 | 0 | 0 | **5** (dương tính giả đã biết, xem dưới) |
| **Tổng 125 file** | **0** | **0** | **0** | **5 FP** |

5 dòng "đã tắt" đều là dương tính giả launcher đã biết — không
phải sóng thật (xem chi tiết eperm-sweep-run.log):
- 2× t10-o8.log (10:46:43Z, 10:47:38Z — T10 đợt 117 O8 driver
  launcher, dòng "không có /proc/sys/.../epoll_wait: Operation not
  permitted" bị in khi launcher kill/đóng kênh).
- 3× run-t1.log (08:40:22Z, 08:55:08Z, 09:01:26Z — T1 đợt 117
  launcher, cùng mẫu).

Quét mở rộng `/eperm|not permitted/i`: 14 dòng — 6 dòng kiểm tra
pass trong round117-t10-suites.log (test tự kiểm "not permitted"
như kết quả mong đợi, không phải sóng) + 5 dòng launcher trên +
3 dòng trùng đếm (1 dòng vừa chứa "eperm" vừa "not permitted").
**0 sóng EPERM thật.**

- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7 đợt 115) — **~95h29'**
  trước probe #37 (11:39:50Z).
- EPERM **không** được tuyên bố là đã hết — như R7/S7/T7: 1 lượt
  không sóng = bằng chứng âm tính cho lượt đó, không phải kết luận
  hệ thống. Sóng EPERM đã xuất hiện rải rác từ đợt 92–115 với
  khoảng cách hàng chục giờ; 1 lượt âm tính không thay đổi phân
  phối đó.
- Bài học áp dụng (T7 §4 mục 19, S7 §4 mục 19, R7 §4 mục 19):
  quét 2 lần độc lập (đếm theo file + đếm theo dòng), loại
  eperm-sweep*.log của chính mình, kiểm tra bằng grep trực tiếp
  trước khi kết luận số 0.

### 2.5 Phân phối gap — CERT n=30, FULL n=45 (mới: +2 gap từ mù #36)

**Ghi rõ phương pháp mới (xem §4 mục 35):** hai gap mới là
KHOẢNG, không phải điểm. Thống kê tính ở **điểm giữa** của mỗi
khoảng: #52→#53 = 1h17'14" (4634 s), #53→#54 = 1h20'18" (4818 s).
Độ nhạy đầu mút: thay điểm giữa bằng đầu dưới hoặc đầu trên của
cả hai khoảng chỉ dịch chuyển mean ±10 s (CERT) / ±7 s (FULL);
median/p10/p90 KHÔNG đổi (xem blind36-gaps.txt). KẾT LUẬN: việc
dùng điểm giữa không làm thay đổi bất kỳ số nào ở mức báo cáo
(±10 s là dưới độ phân giải báo cáo 1 phút). Nếu parent không
chấp nhận chứng nhận theo khoảng thì hạ cả hai về cận trên (CERT
về n=28).

Bảng so sánh (CERT = gap đơn đã chứng nhận; FULL = CERT + gap chưa
chứng nhận + gap khoảng):

| | CERT n=28 (T7) | **CERT n=30 (T6)** | FULL n=43 (T7) | **FULL n=45 (T6)** |
|---|---|---|---|---|
| mean | 1h53'08" | **1h50'50"** | 1h57'47" | **1h56'03"** |
| median | 1h59'50" | **1h59'16"** | 1h59'46" | **1h58'47"** |
| p10 | 1h02'25" | **1h06'24"** | 0h48'46" | **0h49'04"** |
| p90 | 2h37'23" | **2h30'32"** | 3h03'56" | **3h03'17"** |
| sd | 0h41'46" | **0h41'14"** | 0h58'50" | **0h58'04"** |
| min | 19'07" | **19'07"** | 19'07" | **19'07"** |
| max | 3h14'08" | **3h14'08"** | 5h43'18" | **5h43'18"** |

- **Cross-check tái hiện T7 100%:** chạy blind35-gaps.py verbatim
  cho lại đúng CERT n=28 / FULL n=43 của T7 (xem blind36-gaps.txt).
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (cả hai gap mới
  nằm giữa). Đáy sàn **19'07" (1147 s)** vẫn là gap đơn đã chứng
  nhận nhỏ nhất (N6 §2.6). **Dải cơ học cho #55 từ #54:
  [11:07:33Z, 14:02:34Z]; hiệu dụng sau probe #37: [11:39:50Z,
  14:02:34Z]; p10–p90 FULL45: [11:37:30Z, 13:51:43Z]** — đây là
  phép áp dải máy móc, không phải dự báo; không dùng để khẳng định
  #55 đã/sẽ xảy ra trong cửa sổ đó.
- **Tốc độ reboot (đồng hồ ghi nhận):** 54 / 110,50 h = **1 reboot
  mỗi 122,8 phút** (từ #1 2026-11-11T02:00:00Z tới #54
  2026-11-15T10:48:26Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 58 / 110,50 h = **1 mỗi 114,3 phút**. Tốc độ
  này tính trên đồng hồ ghi nhận (epoch nhanh) — sai số tuyệt đối
  do giây nháy không làm thay đổi thứ tự độ lớn.
- **Phân phối FULL45:** 25/45 trong 90–150 phút; 6 gap <60 phút;
  6 gap >180 phút; 2 gap >240 phút. Hai gap mới (77'14" và 80'18"
  ở điểm giữa) đều nằm trong khối 90–150 phút (cận dưới 74'44" và
  77'48" đều <90' — nằm ở biên dưới của khối chính, không phải
  outlier).
- **Không có outlier mới:** cả hai gap mới đều nằm trong [19'07",
  3h14'08"] ở mọi đầu mút của khoảng (cận trên lớn nhất 1h22'48"
  < 3h14'08"; cận dưới nhỏ nhất 1h14'44" > 19'07").

### 2.6 Trạng thái các mù cũ — KHÔNG ĐỔI (chỉ ghi nhận, không thử lại)

| Mù | Trạng thái (T6 đợt 118) | Ghi chú |
|---|---|---|
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#54 vẫn TẠM THỜI vì mù này |
| #34 | ĐÓNG HOÀN TOÀN | S7 §2.3; parent đã chấp nhận — QUYẾT PARENT 7; gap #46→#47 = 2h01'01", #47→#48 = 1h57'56" ĐÃ ĐƯỢC CHỨNG NHẬN (parent chấp nhận) |
| #33 | ĐÓNG HOÀN TOÀN | R7 §2.3; gap #45→#46 = 2h27'07" ĐÃ ĐƯỢC CHỨNG NHẬN (R7; parent đã chứng nhận gap #44→#45, quyết parent 15/11) |
| #32 | ĐÓNG HOÀN TOÀN | Q6 §2.3 |
| #31 | KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG THỬ LẠI LƯỢT NÀY | 1 cửa sổ mở 8'55" (10:23:54Z → 10:32:49Z); 2 reboot đã chốt (#43 08:53:37Z; #44 10:53:31Z) + có thể tối đa 1 ẩn; gap #43→#44 = 1h59'54" KHÔNG được chứng nhận (cận trên) |
| #30 | KHÔNG ĐÓNG HOÀN TOÀN | 3 cửa sổ mở, tổng 30'50"; 2 reboot đã chốt + có thể tối đa 2 ẩn; số thứ tự #41/#42 TẠM THỜI |
| #29 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ thật 14'31" (M4) / 13'33" (M9 birth-time), khe 79 s không loại trừ được; 2 reboot đã chốt + có thể 1 ẩn; số thứ tự #39/#40 TẠM THỜI |
| #28 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ 23'39" (02:01:06Z → 02:24:45Z), khe 4'32" không loại trừ được; 2 reboot đã chốt + có thể 1 ẩn; số thứ tự #37/#38 TẠM THỜI |
| #26 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ 1h13'58" (19:20:19Z → 20:34:17Z) có thể chứa thêm reboot; ít nhất 1 (#34), có thể nhiều hơn — không xác định được |
| #24 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm reboot; ít nhất 1 (#32), có thể nhiều hơn — không xác định được |
| #22 | ĐÃ ĐÓNG — MỨC TIN CẬY HẠ | Cửa sổ lý thuyết ≤78 s với sàn 19'07"; T6 không thử lại, không tự quyết — parent/user quyết giữ "đóng", "đóng có điều kiện", hay mở lại |
| #21 | CHƯA ĐÓNG HOÀN TOÀN | Lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung gian |

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết. **Dị thường gateA poll 3 (R5,
19:44:10Z) vẫn CHƯA GIẢI THÍCH ĐƯỢC** — nhưng giây nháy tại #54
là một ứng cử viên cơ chế cho các dị thường thời gian kiểu này
(xem §4 mục 33); T6 không tự kết luận, chỉ ghi nhận.

### 2.7 Quét writeFileSync lần thứ 24 — chênh 0 (lần thứ 24 liên tiếp)

- Chạy script `scan-wfs.sh` (sao từ round117-t7, đổi OUT sang
  round118-t6) **11:56:33Z → 11:59:25Z (2'52", có SCAN-END)** —
  chậm hơn các lần trước (lần 23: 1'27") do session scan đồng thời
  trên cell 1,5 CPU (xem §4 mục 35); không ảnh hưởng kết quả.
- NEWSTD: **751 dòng / 208 file** (phạm vi 2.903 file); R7b đối
  chiếu: **776 dòng / 225 file**; copies: **25 dòng / 17 file** —
  y hệt lần 23. Đối chiếu chéo: 751+25=776=R7b, **chênh 0**.
- **+29 dòng / +5 file so với lần 23** (722/203 → 751/208), giải
  thích đúng hết bằng diff (kiểm bằng đếm lại trực tiếp + mtime —
  cả 5 file đều về trước lúc scan bắt đầu 11:56:33Z):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | LIMITS gộp đợt 117 (T7) | +6 | 09:01:27Z | Mốc T7 |
  | LIMITS gộp đợt 117 (phụ) | +1 | 11:05:20Z | Dòng T6, pre-clock |
  | probe117t2-frame-parity.mjs | +7 | 09:01:51Z | T2 đợt 117 |
  | probe118t3-frame-parity.mjs | +8 | 11:38:40Z | T3 đợt 118 (mới) |
  | probe118t2-storeheld-diag.mjs | +7 | 11:43:53Z | T2 đợt 118 (mới) |
- Phạm vi: 2.903 = 2.887 + 16 net / −0 (16 = 5 file hit + 11 file
  non-hit). **0 file mất hit.**
- **Kết luận: 24 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #36.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 144 dòng chứa `.writeFile(` trong phạm vi quét; 2 dòng trong
  code — vẫn đúng 2 helper đã biết, mtime không đổi từ 10/11:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`)
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`)
- 142 dòng còn lại trong file .md (tài liệu, không phải code).
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #36.

## 3. RAM trong mù #36 — max 4.080 MB (66% guard), birefnet KHÔNG chạy

- **4 mẫu MemAvailable của lượt (đo trực tiếp):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 11:38:08Z | **1.117.676 kB** | Đầu lượt |
  | 11:39:40Z | **1.103.492 kB** | Lúc probe #37 |
  | 11:56:33Z | **553.276 kB** | Lúc bắt đầu scan (thấp nhất lượt, ~0,53 GB) |
  | 11:59:25Z | **1.419.420 kB** | Lúc scan xong |
- **Max RAM biết được TRONG mù #36 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 127 mẫu RAM trong mù; **max 4.080 MB**
  (free=, T3 driver, 09:38:22Z, đoạn A) = **66% ngưỡng guard**;
  **max RAMavail rõ ràng 3.626 MB** (T6 gateA poll 12, 09:38:45Z,
  đoạn A) = **59% guard**; đoạn B max **3.122 MB** (T3 s80b,
  10:27:34Z). Max theo clock-window đoạn C 1.425 MB thực ra là mẫu
  poll5m pre-reboot (10:49:56Z, clock VM53); đoạn C thật sau reboot
  ≈ 1.103–1.118 MB (mẫu của T6).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 4,08 GB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Chỉ thử lại khi RAM đổi (xem §5 mục 18).
- **Đồng hồ đo:** RAM đo trong mù #36 không bị ảnh hưởng bởi giây
  nháy ở mức báo cáo (mẫu nào cũng là số đo tại thời điểm đo; thứ
  tự các mẫu trong cùng epoch không đổi).

## 4. Ghi chú phương pháp (mới so với T7)

1. **Giây nháy (mới, lượt này — §2.2):** đồng hồ VM lùi 17–21
   phút tại reboot #54. Bằng chứng quyết định là dòng O8-WebKit
   exit đọc boot_id tươi từ /proc lúc ghi; cận Δ từ poller T5
   sống/chết; F54 ≈ 0 từ HTTP Date 3 server độc lập. **Caveat
   mới:** mọi mốc giờ tuyệt đối trước #54 đều trong epoch nhanh;
   chỉ khoảng cách giữa hai reboot kề mới đáng tin khi F ổn định
   qua reboot đó (đã chứng minh qua #53 trong 3'12", chưa chứng
   minh cho các reboot trước #52). Các gap đã chứng nhận trước đây
   GIỮ NGUYÊN (không có bằng chứng độ lệch từng thay đổi trước
   #54; phân phối CERT chặt, sd 42', không outlier kiểu ±20').
2. **Scheduler chia sẻ clock VM (mới, §2.2 mục 5):** F52 ≤ 3'16"
   (nếu scheduler độc lập) mâu thuẫn F52 > 13'18" (từ chuỗi) →
   scheduler dùng cùng epoch clock lệch. Nhịp 3h/lượt không đổi.
3. **dpkg.log bị cắt ngắn theo boot (mới, §2.1):** sau mỗi reboot
   chỉ giữ boot hiện tại (1.509 dòng từ 11:35:40Z; 2 dòng replay
   #53 đã mất). Điều tra mù chỉ còn dựa vào log agent trên đĩa.
4. **Bug tên file break của poll-t5.sh (mới, §2.2 mục 3):** script
   kiểm `round117-t5-done` (gạch ngang) nhưng file thật là
   `round117-t5.done` (chấm) → break không bao giờ đúng → poller
   vô tình sống làm observer tới khi bị reboot giết. Sửa hay giữ
   có chủ ý — chờ parent/T5-infra quyết (xem §5 mục 17).
5. **Chứng nhận gap theo KHOẢNG (mới, §2.5):** hai gap mới là
   khoảng do giây nháy; thống kê dùng điểm giữa; độ nhạy đầu mút
   ±10 s (CERT) / ±7 s (FULL); median/p10/p90 không đổi. Nếu parent
   không chấp nhận thì hạ về cận trên (CERT về n=28).
6. **Điểm giữa không làm thay đổi số báo cáo:** ±10 s < độ phân
   giải báo cáo 1 phút (xem §2.5).
7. **Sàn đuôi đoạn B đóng ở cả hai đầu Δ** (Δ − 5'31" ∈ (10'59",
   15'59"] < 19'07") — kiểm cả hai đầu trước khi kết luận (bài học
   T7 §4 mục 30).
8. **Lỗ mtime đoạn C 1.997 s trộn hai epoch** (11:05:20Z pre-clock
   → 11:38:36Z post-clock) — không phải lỗ quan sát thuần; đã
   đóng bằng uptime trực tiếp.
9. **0 session exec trong vùng B-tail/C-idle theo clock-reading**
   (10:53:57Z–11:35:40Z); observer ở đó là tiến trình detached +
   ghi file.
10. **Scan WFS chậm (2'52") do session scan đồng thời trên cell
    1,5 CPU** — không ảnh hưởng kết quả; ghi nhận để đợt sau tránh
    chạy song song nặng.
11. **RAM thấp nhất lượt 553 MB lúc bắt đầu scan** — scan WFS tốn
    RAM; không ảnh hưởng kết quả.
12. **Kiểm lại boot trước khi viết LIMITS (12:08:46Z):** vẫn
    48a82db1, uptime-s 10:48:26Z — không reboot mới trong lúc làm
    việc.
13. **Prereg viết trước khi đo** (prereg-t6.md): dự báo +3 dòng
    log checklist ĐÚNG; dự báo boot #54 ĐÚNG; tiêu chí đóng mù #36
    viết trước — không sửa sau khi thấy số.
14. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
    (cấm — RAM < guard). **Không đụng cloud/collab/AI model
    đóng/nhạc bản quyền.**
15. **Stage batch:** chỉ 1 file text (LIMITS doc này), NUL-delimited,
    verify read-back (xem checkpoint3.txt + stage file).
16. **Ghi rõ:** số thứ tự reboot #47–#54 vẫn TẠM THỜI; giá trị gap
    không phụ thuộc số thứ tự.
17. **Đính chính brief:** gap #53→#54 "≈1h01'" trong brief là hiệu
    số đồng hồ VM chưa hiệu chỉnh, KHÔNG phải gap thật (thật ∈
    (1h17'48", 1h22'48"]).
18. **Không có /var/log/syslog hay kern.log** trên VM — không còn
    nguồn log hệ thống bền nào khác.
19. **Quét ngoài hai cây: 53 file, 0 chứa boot_id/uptime** — mtime-
    only, không thu hẹp khe (quy tắc N6 §4 mục 2).
20. **Poller T10 #1/#2 đều kiểm bằng code từ nội dung log** (số thứ
    tự liên tiếp, bước 300/301 s, 1 header START duy nhất, script
    không restart) — không kết luận "đơn nhất" bằng mắt.
21. **Gate0-poll là observer độc lập thứ hai** (6 poll, postboot
    tươi mỗi lần, đều cite boot 09:47:08).
22. **Poll5m là observer độc lập thứ ba** (phủ đuôi đoạn B tới
    11:04:56Z pre-clock; bước restart 216 s là relaunch, không
    phải clock step).
23. **Dòng O8-WebKit exit là bằng chứng quyết định giây nháy** —
    script đọc boot_id tươi tại thời điểm ghi (dòng 44), không
    cache.
24. **T10 xong việc trước #54** (done 11:02:12Z pre-clock) và
    parent đóng đợt 117 (LIMITS gộp 11:05:20Z pre-clock) TRƯỚC khi
    reboot xảy ra — giải thích vì sao T10/LIMITS gộp không nhắc
    #54.
25. **HTTP Date check là standing check mới đề xuất** (xem §5 mục
    2): so clock VM với HTTP `Date` mỗi lượt EPERM, ~5 s, phát
    hiện giây nháy sớm.
26. **F52 − F53 ∈ [−3'12", 1'48")** — độ lệch gần như không đổi
    qua #53 (từ poller #1 poll cuối + poll kế không viết).
27. **Tốc độ reboot:** 54 / 110,50 h = 1 mỗi 122,8 phút (đồng hồ
    ghi nhận); +4 ẩn → 58 / 110,50 h = 1 mỗi 114,3 phút.
28. **Dải cơ học #55:** [11:07:33Z, 14:02:34Z] từ #54; hiệu dụng
    [11:39:50Z, 14:02:34Z]; p10–p90 FULL45 [11:37:30Z,
    13:51:43Z] — phép áp dải máy móc, không phải dự báo.
29. **WFS +29 dòng / +5 file giải thích đúng hết** bằng diff +
    mtime; 0 file mất hit; phạm vi +16 net / −0.
30. **Async `.writeFile(`:** 2 helper đã biết, mtime không đổi từ
    10/11; 0 stray.
31. **Bài học cho đợt sau:** khi phát hiện reboot mới bằng đọc
    uptime, ghi output `uptime -s` + boot_id đầy đủ vào file ngay
    — nếu không giờ reboot đó mãi chỉ là khoảng.
32. **Poller v2 loop foreground trong phiên đang sống, hoặc watcher
    v2 của infra chạy sớm sau mỗi reboot** — cần observer sống độc
    lập với phiên agent nếu muốn đóng được mù sau.
33. **Giây nháy là ứng cử viên cơ chế cho dị thường gateA poll 3
    (R5)** — parent có thể giao luồng hạ tầng điều tra chung cơ
    chế đồng hồ; T6 không tự kết luận.
34. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat §4 mục 1 vào hồ sơ.
35. **Cross-check tái hiện T7 100%** (CERT n=28 / FULL n=43) trước
    khi tính số mới — chạy blind35-gaps.py verbatim.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #36 ĐÓNG HOÀN TOÀN (mới, lượt này, xem §2.3):**
   2 reboot đã chốt (#53 09:47:08Z VM53-clock, #54 10:48:26Z
   VM54-clock) + **0 cửa sổ mở, 0 reboot ẩn**. Gap #52→#53 ∈
   [1h14'44", 1h19'44") và gap #53→#54 ∈ (1h17'48", 1h22'48"]
   ĐƯỢC CHỨNG NHẬN (mới — xem §2.5; cả hai là KHOẢNG do giây nháy,
   thống kê dùng điểm giữa 1h17'14" / 1h20'18" — chờ parent xác
   nhận cách chứng nhận theo khoảng + dùng điểm giữa; nếu không
   đồng ý thì hạ cả hai về cận trên, CERT về n=28). Số thứ tự
   #53/#54 vẫn TẠM THỜI (tối đa "thực tế #82" do mù #35 chưa đóng).
   Dải cơ học cho #55 từ #54: [11:07:33Z, 14:02:34Z] — hiệu dụng
   [11:39:50Z, 14:02:34Z] sau probe #37; là phép áp dải máy móc,
   không phải dự báo.
2. **GIÂY NHÁY tại #54 (mới, lượt này, xem §2.2) — cần parent
   quyết:** (a) chấp nhận phát hiện + hai khoảng gap (CERT n=30)
   hay hạ về cận trên; (b) duyệt standing check mới (so clock VM
   với HTTP `Date` mỗi lượt EPERM, ~5 s); (c) có cho rà soát lại
   các gap đã chứng nhận trước đây dưới góc giây nháy không (T6
   khuyến nghị KHÔNG rà soát toàn bộ ngay — không có bằng chứng
   độ lệch từng thay đổi trước #54; chỉ ghi caveat §4 mục 1 vào
   hồ sơ); (d) cơ chế gây giây nháy (host clock? migration? NTP?)
   có cần luồng hạ tầng điều tra không — T6 không tự kết luận.
   **Đính chính brief:** gap #53→#54 "≈1h01'" trong brief/build-
   loop-log là hiệu số đồng hồ VM chưa hiệu chỉnh, KHÔNG phải gap
   thật (thật ∈ (1h17'48", 1h22'48"]).
3. **Khoảng mù #35 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T7 đợt
   117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117). Gap
   #48 → #49 = 2h03'00" ĐÃ ĐƯỢC CHỨNG NHẬN (parent chấp nhận).
4. **Khoảng mù #34 VẪN ĐÓNG HOÀN TOÀN** (S7 đợt 116; parent đã
   chấp nhận — QUYẾT PARENT 7). Gap #46 → #47 = 2h01'01" và gap
   #47 → #48 = 1h57'56" ĐÃ ĐƯỢC CHỨNG NHẬN (parent chấp nhận).
5. **Khoảng mù #33 ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (R7 đợt 115).
   Gap #45 → #46 = 2h27'07" ĐÃ ĐƯỢC CHỨNG NHẬN (R7; parent đã
   chứng nhận gap #44 → #45, quyết parent 15/11).
6. **Khoảng mù #32 ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (Q6 đợt 114).
7. **Khoảng mù #31 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI, KHÔNG THỬ
   LẠI LƯỢT NÀY** (Q6 §2.6, R7 §2.6, S7 §2.6, T7 §2.6): 1 cửa sổ
   mở — 8'55" (10:23:54Z → 10:32:49Z). Số reboot trong mù: 2 đã chốt
   (#43 08:53:37Z; #44 10:53:31Z) + có thể tối đa 1 ẩn. **Số thứ
   tự #43/#44 vẫn TẠM THỜI** — parent/user quyết xem có chấp nhận
   "ít nhất 2 reboot, có thể 3" làm mức đóng của mù #31 hay để mở
   như mù #24/#26/#28/#29/#30. T6 không tự quyết. Gap #43 → #44
   = 1h59'54" KHÔNG được chứng nhận (cận trên); không còn nguồn
   nào để thử thêm (trừ khi có nguồn mới thật sự).
8. **Khoảng mù #30 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (N6 §5 mục
   1, P6 §5 mục 2, Q6 §5 mục 3, R7 §5 mục 4, S7 §5 mục 5, T7 §5
   mục 6): 3 cửa sổ mở, tổng 30'50"; số reboot trong mù: 2 đã chốt
   + có thể tối đa 2 ẩn. Số thứ tự #41/#42 vẫn TẠM THỜI. Không còn
   dữ liệu nào để thu hẹp thêm — parent/user quyết.
9. **Khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (M4 §5 mục
   1, P6 §5 mục 3, Q6 §5 mục 4, R7 §5 mục 5, S7 §5 mục 6, T7 §5
   mục 7): lỗ thật 14'31" theo M4 / 13'33" theo M9 birth-time, khe
   79 s không loại trừ được; số reboot trong mù: 2 đã chốt + có
   thể 1 ẩn. Số thứ tự #39/#40 vẫn TẠM THỜI.
10. **Khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục
    1, P6 §5 mục 4, Q6 §5 mục 5, R7 §5 mục 6, S7 §5 mục 7, T7 §5
    mục 8): lỗ 23'39" (02:01:06Z → 02:24:45Z), khe 4'32" không loại
    trừ được; số reboot trong mù: 2 đã chốt + có thể 1 ẩn. Số thứ
    tự #37/#38 vẫn TẠM THỜI.
11. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
    1, P6 §5 mục 5, Q6 §5 mục 6, R7 §5 mục 7, S7 §5 mục 8, T7 §5
    mục 9): lỗ 1h13'58" (19:20:19Z → 20:34:17Z) có thể chứa thêm
    reboot; số reboot trong mù: ít nhất 1 (#34), có thể nhiều hơn
    — không xác định được; số thứ tự #34 là TẠM THỜI.
12. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
    1, P6 §5 mục 6, Q6 §5 mục 7, R7 §5 mục 8, S7 §5 mục 9, T7 §5
    mục 10): lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm
    reboot; ít nhất 1 (#32), có thể nhiều hơn — không xác định
    được; số thứ tự #32 → #54 là TẠM THỜI.
13. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục
    1, P6 §5 mục 7, Q6 §5 mục 8, R7 §5 mục 9, S7 §5 mục 10, T7 §5
    mục 11): lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1
    reboot trung gian. Không còn dữ liệu nào để thu hẹp thêm —
    parent/user quyết.
14. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
    §6 mục 3, P6 §5 mục 8, Q6 §5 mục 9, R7 §5 mục 10, S7 §5 mục
    11, T7 §5 mục 12): cửa sổ lý thuyết ≤78 s với sàn 19'07". T6
    không thử lại, không tự quyết — parent/user quyết giữ "đóng",
    "đóng có điều kiện", hay mở lại.
15. **Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
    riêng 10 phút vẫn chờ user quyết.
16. **Dị thường gateA poll 3 (R5, 19:44:10Z) vẫn CHƯA GIẢI THÍCH
    ĐƯỢC** (R5 LIMITS §1.4; S7 §2.2; T7 không gặp thêm dòng dị
    thường kiểu này trong mù #35; T6 cũng không gặp thêm trong mù
    #36 — nhưng giây nháy tại #54 là một ứng cử viên cơ chế cho
    các dị thường thời gian kiểu này: parent có thể giao luồng hạ
    tầng điều tra chung cơ chế đồng hồ, xem §4 mục 33). T6 không
    tự kết luận.
17. **Poller T10 #2 + poll5m của T5 chết theo #54 là điểm gãy quan
    sát (xem §4 mục 32):** mù #36 đóng được là nhờ poller phủ kín
    đoạn B tới 11:04:56Z (pre-clock) + đo uptime trực tiếp lúc
    probe; mù sau vẫn cần observer sống độc lập với phiên agent
    (poller v2 loop foreground trong phiên đang sống, hoặc watcher
    v2 của infra chạy sớm sau mỗi reboot) nếu muốn đóng được; và
    khi phát hiện reboot mới bằng đọc uptime, ghi output
    `uptime -s` + boot_id đầy đủ vào file ngay (xem §4 mục 31) —
    nếu không giờ reboot đó mãi chỉ là khoảng. **Bug tên file
    break của poll-t5.sh (xem §4 mục 4):** sửa tên cho đúng HOẶC
    giữ nguyên có chủ ý (poller quan sát dài) — chờ parent/T5-
    infra quyết.
18. **Nợ mở đợt 118 (kế thừa LIMITS gộp đợt 117 §10 + T6 §5):**
    E4 lô đo lớn (T9); zombie H3f sau chẩn đoán storeHeldFrame
    (T2); điểm gãy (T3, GIỮ 19,63, luật dial 5/5 thành luật đứng);
    lock v2 đổi spec (T1); WebKit ≤60 ms (T4, postboot #54 PASS —
    lượt yên chờ T4); ghost seek ≥80 (T5); mù #36 đóng + giây
    nháy (T6 — lượt này); hạ tầng #54 + repair policy đã duyệt
    (T7); tách max-size 4MiB khỏi ring 8MiB (T8); G1 + mù
    #22/#28/#29/#30/#31 chờ user quyết, birefnet 0 lần thành công
    — chỉ thử lại khi RAM đổi (RAM khả dụng ~0,5–4,1 GB < ngưỡng
    6 GB, u2net là fallback chính thức; max RAM trong mù #36 là
    4,08 GB = 66% guard); ci-security.yml vẫn 403 chờ user; TTS 39
    CẤM kiểm lại.
