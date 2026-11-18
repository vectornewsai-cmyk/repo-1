# PHASE9 ROUND132 T2 — EPERM: probe #51 ok=2 fail=0 + mù #51 A ĐÓNG / B MỞ (tối đa 3 ẩn) / C ĐÓNG + gap #79?→#80? CHỨNG NHẬN DẠNG KHOẢNG + CERT n=45 / FULL n=60 + mù #49 B kiểm lại KHÔNG ĐỔI (lần thứ hai giống hệt)

> Luồng T2, đợt 132 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07
> 18/11/2026; làm việc 17:40Z → ~18:00Z 17/11/2026).
> Nhiệm vụ: probe #51 theo lịch thường lệ + mù #51 MỚI MỞ từ probe #50 —
> điều tra đoạn từ #79? (dải cơ học cho #81?: [15:34:15Z, 17:35:27Z]) +
> mù #49 đoạn B còn mở (kiểm lại bằng code trên đĩa hiện tại, lần thứ
> hai) + quét sóng EPERM. Quyết parent đợt 131 §12.3(f): GIỮ LỊCH PROBE
> THƯỜNG LỆ ở đợt 132.
> Prereg viết TRƯỚC khi đo:
> hidden_files/round132-t2/prereg-t2.md. **Dự báo chắc ĐÚNG HẾT; đoạn B
> chỉ dự báo "KHÔNG CHẮC, nghiêng MỞ" (không dự báo sai — verdict MỞ
> nằm trong vùng không chắc đã ghi).** Prereg KHÔNG đặt điều kiện chặt
> hơn tiền lệ (bài học T2-130 §4 mục 1 đã áp dụng trước khi đo).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #47 (ĐÃ ĐÓNG HOÀN
> TOÀN đợt 128) / mù #46 đoạn A / mù #45 đoạn G1 / mù #44 đoạn D /
> mù #40 đoạn B / mù #43 / mù #42 đoạn B** (quyết parent đợt 124 §12.3
> + §12.4, đợt 125 §12(h), đợt 126 §12(h), đợt 127 §12(c)). **Mù #50
> ĐÃ ĐÓNG HOÀN TOÀN đợt 131 — KHÔNG kiểm lại.** G1 + mù
> #22/#28/#29/#30/#31/#35/#37/#38 đoạn G chờ user quyết.
> **KHÔNG có reboot giữa phiên T2 lượt này** (boot b379ecd7 xác minh
> 17:40Z, 17:46Z, 17:58Z — cùng một boot; khác đợt 131 có reboot giữa
> phiên T2).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (17:46:50Z):** `status`
  báo **DEAD/STALE** (heartbeat age 10.794 s, last #50 14:46:56Z, boot
  f868abad, exit 1); `once` ngay sau đó là **probe #51, boot
  b379ecd7, ok=2 fail=0**, exit 0, 17:46:50Z; `status` chạy lại
  **ALIVE** (age 0 s, n=51), exit 0. Log v2 tăng đúng **3 dòng**
  (142 → 145) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=51, ts 17:46:50Z, boot b379ecd7.
- **Boot #81? (tạm) lúc 17:24:08Z, boot
  `b379ecd7-311c-4053-a43f-507d21432ecc`** — xác minh bằng `uptime -s`
  + btime 1794936248 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại: HTTP `Date` cả 3 server đều khớp **+1,0 s** (server hơn
  local 1 s cả ba: example.com, google.com, cloudflare.com) →
  **F81? ≈ −1 s (±~1 s)** — đo trực tiếp đầu tiên trên boot mới.
  T6-132 đã chốt chuỗi tương đối #57→#81, số tuyệt đối VẪN TẠM
  (giữ "?").
- **#81? tới TRONG dải cơ học từ #80?** [15:34:15Z, 17:35:27Z]
  (p10–p90 FULL59); #81? thật 17:24:08Z — **lần thứ mười một liên
  tiếp trong dải**. **#80? tới TRONG dải cơ học từ #79?**
  [14:59:26Z, 17:00:38Z]; #80? thật 15:01:30Z — **lần thứ mười liên
  tiếp trong dải** (ghi nhận lượt này từ số T2-131).
- **Khoảng mù #51 (14:46:56Z → 17:46:50Z 17/11, 2h59'54") —
  KHÔNG ĐÓNG HOÀN TOÀN (A đóng, B mở, C đóng).** Đoạn A **ĐÓNG**
  (85 mốc, lỗ lớn nhất 96 s, đuôi 8 s — toàn đoạn chỉ 874 s < sàn
  1.147 s nên lỗ lớn nhất không thể vượt sàn theo cấu trúc); đoạn B
  **MỞ** (194 mốc, lỗ lớn nhất 4.392 s — chính là đuôi 16:10:55Z →
  17:24:08Z, **tối đa 3 ẩn**; 0 session chạm đuôi B, 0 file trong
  đuôi B ở cả 4 phạm vi); đoạn C **ĐÓNG** (uptime trực tiếp lúc
  probe #51 + dấu boot tươi). **1 reboot đã chốt giờ trong mù
  (#81? 17:24:08Z — chính xác từng giây trên đĩa) + reboot #80?
  15:01:30Z đã chốt từ đợt 131 + tối đa 3 ẩn (đều trong đoạn B).**
- **Gap #79?→#80? = [2.079 s, 2.099 s] (mid 2.089 s) CHỨNG NHẬN DẠNG
  KHOẢNG (mới)** — đoạn A mù #51 đóng + đoạn C mù #50 đóng bằng
  uptime (đợt 131); biên ±10 s của T5, F80? chưa đo trực tiếp +
  cận nhảy clock chặt |X80?| < 6 s từ session (xem §2.2 + §2.5 +
  §4 mục 1). **CERT n=44 → n=45 / FULL n=59 → n=60.**
  **Gap #80?→#81? = 8.558 s VẪN CHỈ LÀ SPAN** (đoạn B mù #51 mở).
- **Mù #49 đoạn B kiểm lại trên đĩa hiện tại: VERDICT KHÔNG ĐỔI —
  lần thứ hai giống hệt** (mới, xem §2.6): số file theo phạm vi
  (11/309/37/0) và mọi lỗ quyết định (A 116 s đóng, B 2.252 s mở
  tối đa 1 ẩn, C đầu lỗ 2.363 s đóng bằng uptime) tái hiện đúng
  từng giây so với lần kiểm đợt 131; **0 file thay đổi** kể từ lần
  kiểm đó. Gap #76→#77 giữ SPAN.
- **Khung chết boot #80? thu hẹp: (16:10:55Z, 17:24:08Z] (4.393 s)**
  — quan sát cuối trên #80? là LIMITS gộp 131 mtime 16:10:55Z
  (§12.3 quyết parent); T6-132 độc lập cho cùng khung hẹp này;
  T7-132 cho khung scheduler (16:00:00Z, 17:24:08Z] (DR 23:00
  started 16:00:00Z) — khung đĩa hẹp hơn và nằm trong khung
  scheduler, không mâu thuẫn. **3 slot scheduler thiếu mới đều
  rơi vào khung chết này** (HB 16:20:50Z, HB 16:50:50Z, DR 17:00Z
  — T7-132), phù hợp máy đã chết trong đuôi B; HB 00:20:50
  (giờ hẹn 17:20:50Z) dispatch muộn 17:35:37Z (+887 s) sau boot mới.
- **Replay boot #81? ĐANG CHẠY (theo T5-132, chủ quản replay):**
  configure 17:35:39Z (boot +11'31"), 537 dòng / 79 installs lúc
  17:58:47Z, vẫn chạy; T2 chỉ ghi bracket (kiểm boot trước MỖI lần
  đọc /var/log). Cờ POSTBOOT_PASS trên đĩa STALE (của boot2
  ad1327ef, 15:31:20Z).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 101 file
  *.log có mtime trong mù #51 (0 file repo-1, 101 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8, xem §2.7). Quét mở rộng: **11 match thô / 8 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher trên; 3 match thô thừa là lần xuất hiện "EPERM" thứ hai
  trong 3 dòng hasEperm). Sóng gần nhất vẫn là
  **~11:55–12:11Z 11/11** (R7) — **~149h52'** trước probe #51. EPERM
  vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 38: 883 dòng / 246 file** (phạm vi 3.085
  file); R7b đối chiếu 908 dòng / 263 file; copies 25 dòng / 17
  file — y hệt lần 37 về copies. Đối chiếu chéo 883+25=908=R7b,
  **chênh 0 — lần thứ ba mươi tám liên tiếp**. +5 dòng / +1 file so
  với lần 37, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray;
  mtime không đổi từ 10/11 (dist copy 11/11 không đổi).
- RAM: max biết được trong mù #51 **3.145 MB** (T5 watcher b80 poll 1,
  15:07:10Z, đoạn B) = **52% ngưỡng guard**; đoạn A max **2.431 MB**;
  đoạn C không có mẫu log sibling (mẫu trực tiếp của T2 max
  1.647 MB). **Birefnet KHÔNG chạy, vẫn
  0 lần chạy thành công trong gói** — 3.145 MB vẫn dưới guard 6 GB;
  quyết parent §12.7 vẫn đứng (chỉ thử lại khi quan sát được
  available ≥ 6 GB).
- **preview.tsx KHÔNG ĐỔI trong đợt 132:** md5 805409f0, mtime
  không đổi; media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts ee80d093.
  T2 không sửa production file nào.
- **Reboot #80?→#81? là reboot thứ 5 liên tiếp quanh ranh giới đợt
  theo cách đếm của cờ đợt 132/T7-132** (chỉ tính reboot rơi vào
  khoảng đóng đợt → mở lượt sau: #73→#74, #74→#75, #76→#77,
  #78?→#79?, #80?→#81?); tính cả reboot giữa lượt thì chuỗi dài
  hơn (T2-131 §2.2 liệt kê 7 reboot liên tiếp tới #78?→#79?, thêm
  #79?→#80? giữa lượt 131 và #80?→#81? này). **Mù #52 MỚI MỞ** từ
  probe #51 (việc của T2 đợt 133).
- **Đợt 132 lúc T2 đóng (~18:00Z):** T1/T6/T7/T9 đã có cờ .done
  trên đĩa; T3/T4/T5/T8 đang chạy; boot hiện tại #81? (kiểm
  17:58:25Z). Hạn cứng đóng đợt 20:35Z 17/11 (theo brief T2). T2
  KHÔNG mở Xvfb (không cần) nên không có gì để kill — luật đứng đợt
  127 §12.1.3 không phát sinh việc.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 17:45:40Z | boot_id `b379ecd7-311c-4053-a43f-507d21432ecc`; `who -b` Nov 17 17:24; `uptime -s` **2026-11-17 17:24:08**; btime **1794936248 = 2026-11-17T17:24:08Z**; journal chỉ 1 boot (b379ecd7, first entry 17:24:19Z, last 17:44:45Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #80? đã mất theo reboot #81?, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 17:46:50Z | **DEAD/STALE**, heartbeat n=50, ts 14:46:56Z, boot f868abad, age **10.794 s** (đúng 2h59'54"); last sample probe #50; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 17:46:50Z | **probe #51, boot=b379ecd7, ok=2 fail=0**, exit 0; dòng `boot changed f868abad -> b379ecd7` (uptime since 2026-11-17 17:24:08) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 17:46:50Z | **ALIVE**, age 0 s, n=51, exit 0 |

Kiểm lại từ đĩa: log probe v2 **145 dòng** — 142 sau T2-131 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #50 +
dòng `boot changed` + dòng probe #51). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #50 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=51, ts 2026-11-17T17:46:50Z, boot
b379ecd7-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #81?: 6 session T2 trong vùng C (birth
17:41:59Z, 17:42:49Z ×2, 17:44:26Z, 17:44:30Z, 17:45:19Z — các luồng
đợt 132) + 62 mốc mtime trong vùng C (mốc đầu 17:35:37Z — file
system_prompt.md ghi lúc mở đợt; mốc cuối 17:46:46Z — file của luồng
đợt 132) + 42 mốc gộp 4 phạm vi. **Số thứ tự TẠM THỜI** (như
#69/#70/#71/#72/#73/#74/#75/#76/#77/#78?/#79?/#80?; T6-132 đã chốt
chuỗi tương đối #57→#81, số tuyệt đối vẫn tạm).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #51 (14:46:56Z → 17:46:50Z 17/11, 2h59'54")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #51: `uptime -s` = **2026-11-17 17:24:08Z**,
  boot_id `b379ecd7-311c-4053-a43f-507d21432ecc` — khác boot của
  probe #50 (f868abad).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (17:45:40Z): chỉ **1 boot**
  (b379ecd7, first entry 17:24:19Z, last 17:44:45Z). Journal/wtmp
  của boot ad1327ef đã mất theo reboot #81? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #81? — bracket ghi trong lượt (bài học
  T7-125 §4 mục 4: kiểm boot trước MỖI lần đọc /var/log).** Lúc
  17:45Z file có **2 dòng** 17:35:39Z ("startup packages configure",
  boot +11'31"); lúc 17:58:47Z file có **537 dòng, 79 installs**,
  dòng cuối 17:58:22Z — **VẪN CHẠY, chưa đóng băng**. **Hồ sơ đầy
  đủ thuộc về T5-132 (chủ quản replay)** — snapshot của T2 chỉ là
  giữa chừng; T5 theo dõi tiếp. **Lưu ý:** replay #81? khởi động
  muộn (+11'31", đúng lúc lượt cron 00:35 +07 mở đợt 132 lúc
  17:35Z) — khác #80? (+49 s) và #79? (+8'58"); T5 phân loại.
- **dpkg.log của boot #80? đã MẤT** (file lúc T2 kiểm chỉ còn
  bracket #81?): /var/log reset mỗi boot. Bản ghi T5-131 (replay
  #80? dạng (B) thuần + --repair 1 lần, 759 dòng / 109 installs,
  cờ POSTBOOT_PASS boot2 15:31:20Z) là bằng chứng duy nhất còn lại
  cho bracket #80? — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**KHÔNG có reboot giữa phiên T2 lượt này:** boot b379ecd7 xác minh
lúc 17:40Z (mở lượt), 17:46:50Z (probe #51) và 17:58:25Z (trước khi
viết LIMITS) — cùng boot_id + btime 17:24:08Z cả ba lần. (Khác đợt
131: T2-131 gặp reboot #80? giữa phiên, sau khi đo xong.)

### 2.2 Reboot đã chốt trong mù — #80? (mới, đã biết từ đợt 131) + #81? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 80? | **15:01:30Z** (chính xác từng giây) | f868abad → ad1327ef | Chốt từ T2-131: `uptime -s` đọc tươi + btime 1794927690 + `who -b` 15:01 + boot_id ad1327ef + journal first entry 15:01:45Z + probe #50 boot f868abad khác ad1327ef. T2 lượt này xác nhận gián tiếp: probe #51 boot b379ecd7 khác f868abad, và mọi quan sát đoạn B đều mang dấu boot #80? (5 exec-log nhắc ad1327ef). **Số thứ tự TẠM THỜI** (chuỗi tương đối #57→#81 đã chốt theo T6-132). |
| 81? | **17:24:08Z** (chính xác từng giây) | ad1327ef → b379ecd7 | Chốt từ lượt này: `uptime -s` đọc tươi (17:45:40Z + kiểm lại 17:58:25Z) + btime 1794936248 + `who -b` 17:24 + boot_id b379ecd7 + journal first entry 17:24:19Z + probe #51 17:46:50Z boot b379ecd7 ok=2 fail=0 + 6 session trong vùng C. **Số thứ tự TẠM THỜI.** |

**Clock:** F81? ≈ **−1 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` cả 3 server đều
khớp **+1,0 s** (server hơn local đúng 1 s cả ba: example.com,
google.com, cloudflare.com — local epoch đọc ngay sau mỗi lần
fetch nên độ lệch thật ~−1 s). **F81? là lần đo trực tiếp đầu
tiên trên boot #81?** — không dùng cận hai lần đo. Khác F79?
(−2 s, đợt 131) và F77 (+1,0 s, đợt 130): đồng hồ local lần này
chậm hơn ~1 s so với lượt trước — ghi đúng số đo, không ép về
"≈ 0". F79? ≈ −2 s (±~1 s, đã kiểm 14:47Z đợt 131, 3/3 nguồn).
**F80? CHƯA ĐO** (đã kiểm bằng grep "HTTP Date" trong T5-131/
T8-131 docs — 0 match; xem §2.5 + §4 mục 1).

**CẬN NHẢY CLOCK TẠI #80? VÀ #81? — 0 nhân chứng nhảy ở cả hai:**
- **0 nhân chứng nhảy tại #80?:** **0 session** sinh trước
  15:01:30Z có mtime sau 15:01:30Z (quét 194 exec-log). Quan sát
  cũ-clock muộn nhất trước #80?: session mtime **15:01:24Z** — cách
  btime chỉ 6 s nên cho cận **chặt |X80?| < 6 s** (chặt nhất từ
  trước tới nay cho một cận nhảy clock: #78? < 75 s, #79? <
  1.582 s). Cận này tới từ session (exec-log proc_1bdcb3c529b7.log,
  birth = mtime = 15:01:24Z — T8 rebuild fixture) + file
  rebuild-fixtures-bf868abad.log 15:01:22Z (−8 s). F80? chưa đo
  trực tiếp nên cận session 6 s này là bằng chứng tốt nhất về
  lệch đồng hồ tại #80? — vẫn lớn hơn biên ±10 s? Không: 6 s <
  10 s, nên lệch clock tại #80? (nếu có) nằm trong biên chứng
  nhận gap ±10 s của T5 (xem §2.5).
- **0 nhân chứng nhảy tại #81?:** **0 session** sinh trước
  17:24:08Z có mtime sau 17:24:08Z. Quan sát cũ-clock muộn nhất
  trước #81?: **không có session nào** có mtime trong 1 giờ trước
  btime (session muộn nhất trước đó là 15:59:23Z — cách btime tới
  5.085 s, ngoài cửa sổ 1 giờ của code quét) nên **không có cận
  session** cho |X81?| — máy yên dài trước reboot (đuôi B), cận
  lỏng là đúng bản chất; F81? đo trực tiếp (±~1 s) là bằng chứng
  chính. Hai cây mtime đi tới 16:10:55Z (LIMITS gộp 131) — vẫn
  cách btime 4.393 s.
- **Không có file lệch ranh giới kiểu mù #50:** 0 file có mtime
  trong (btime +0 s, +10 s] ở cả #80? lẫn #81? (xem §2.4) — khác
  mù #50 có 4 file T4-attempt3 ở 13:02:42Z (+1 s sau btime #78?,
  lệch đồng hồ cũ ~1 s). Lần này ranh giới sạch: file cuối đoạn A
  là 15:01:24Z (−6 s), file đầu đoạn B là 15:01:57Z (+27 s).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #79?→#80? = **2.089 s (34'49")** — **CHỨNG NHẬN DẠNG
  KHOẢNG [2.079 s, 2.099 s]** (đoạn A mù #51 đóng + đoạn C mù #50
  đóng bằng uptime, xem §2.3 + §2.5).
- Gap #80?→#81? = **8.558 s (2h22'38")** — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #51 mở, tối đa 3 ẩn, xem §2.3 + §2.5).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):**
  #80? từ #79? dự kiến [14:59:26Z, 17:00:38Z] (p10–p90 FULL59); thực
  tế **#80? 15:01:30Z NẰM TRONG dải** (lần thứ mười liên tiếp trong
  dải). #81? từ #80? dự kiến [15:34:15Z, 17:35:27Z] (p10–p90 FULL59);
  thực tế **#81? 17:24:08Z NẰM TRONG dải** (lần thứ mười một liên
  tiếp trong dải). (Prereg ghi đầu trên dải là 17:35:28Z theo phép
  cộng số làm tròn p90 = 9.238 s; code cho 17:35:27Z vì p90 float
  bị cắt khi đổi sang datetime — chênh 1 s do làm tròn, không đổi
  verdict.)
- Dải cơ học cho #82? từ #81? (p10–p90 FULL60): [17:57:00Z,
  19:54:40Z]; hiệu dụng sau probe #51: [17:46:50Z, 19:54:40Z].
- **#70 tới sớm hơn cả cận dưới p10 (đợt 125):** dải từ #69 là
  [21:11:16Z, 23:29:41Z]; #70 thật 20:54:19Z — ghi nhận đợt 125,
  không đổi lượt này.

**Reboot #80? + #81? — CHỈ GHI NHẬN giờ + bracket replay:**
- #80? xảy ra GIỮA LUỘT đợt 131 (lần thứ tư liên tiếp reboot rơi
  giữa lượt — T4 xong lượt yên #9 lúc 14:59Z, trước reboot; T8 gốc
  chặn 0/3 do reboot xóa /tmp, chạy lại 3/3 trên #80? sau cờ
  POSTBOOT_PASS mới 15:31:20Z).
- #81? xảy ra GIỮA đợt 131 đóng (16:07Z) và lượt 132 mở (17:35Z)
  — **reboot thứ 5 liên tiếp quanh ranh giới đợt theo cách đếm của
  cờ đợt 132/T7-132** (chỉ tính reboot rơi vào khoảng đóng đợt →
  mở lượt sau: #73→#74, #74→#75, #76→#77, #78?→#79?, #80?→#81?);
  tính cả reboot giữa lượt thì chuỗi dài hơn (T2-131 §2.2 liệt kê
  7 reboot liên tiếp tới #78?→#79?, thêm #79?→#80? giữa lượt 131
  và #80?→#81? này). Mẫu lặp lại đã ghi ở LIMITS gộp đợt 127
  §12.1 mục 4 + đợt 128 §12.1 mục 4 + đợt 129 + đợt 130 + đợt 131.
- **Số thứ tự TẠM THỜI** (như #69/#70/#71/#72/#73/#74/#75/#76/#77/
  #78?/#79?/#80?; chuỗi tương đối #57→#81 đã chốt theo T6-132).
- Tuổi thọ boot #79?: 14:26:41Z → 15:01:30Z = **2.089 s (34'49")**
  (chết trong khung (15:01:07Z, 15:01:30Z] theo T2-131 — 23 s, hẹp
  nhất từ trước; hoặc (15:00:06Z, 15:01:30Z] theo T4 /
  (15:01:22Z, 15:01:30Z] theo T8 — parent chấp nhận ghi cả hai,
  quyết đợt 131 §12.3(c)). Tuổi thọ boot #80?: 15:01:30Z →
  17:24:08Z = **8.558 s (2h22'38")** (chết trong khung (16:10:55Z,
  17:24:08Z] theo đĩa — xem dưới; hoặc (16:00:00Z, 17:24:08Z]
  theo scheduler T7-132 — ghi cả hai, khung đĩa hẹp hơn và nằm
  trong khung scheduler). Tuổi thọ boot gần đây cập nhật: #74?
  2h18'27", #75? 1h48'41", #76? 1h54'19", #77? 2h06'10", #78?
  1h24'00", #79? 34'49", #80? 2h22'38".

### 2.3 Hoạt động trong khoảng mù — A đóng, B mở, C đóng

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **12 file** +
hidden_files **339 file**; **351 file, 341 mốc float phân biệt /
213 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3 — "mốc" là mtime float phân biệt,
không phải giây tròn; lần này giây (213) < float (341) vì nhiều file
chia sẻ cùng giây nhưng khác phần lẻ giây — ghi cả hai số, không
ép bằng nhau).
Ngoài hai cây: **48 file** (agents — exec-log/tool-output chiếm đa
số + stage files + system/memory; chi tiết xem
blind51-outside.txt); **/tmp: 1 file** trong mù #51 (xem
blind51-tmp.txt). Gộp cả 4 phạm vi: **246 mốc giây phân biệt**
(245 trong ba đoạn + 1 mốc đúng tại B0 14:46:56Z — file ghi lúc
probe #50, xem §2.4). Chia mù làm ba
đoạn bởi #80? (15:01:30Z) và #81? (17:24:08Z):

- **Đoạn A: 14:46:56Z → 15:01:30Z (14'34" = 874 s, boot #79?
  f868abad) — ĐÓNG (mọi lỗ << sàn, theo cấu trúc):**
  - **85 mốc** (hai cây), lỗ lớn nhất **96 s** (14:54:11Z →
    14:55:47Z), các lỗ còn lại đều < 96 s — thân đoạn A dày đặc.
    Mốc đầu 14:46:56Z (head 1 s — chính probe #50, float
    14:46:56.xxx); mốc cuối **15:01:22Z** (đuôi **8 s** < sàn
    1.147 s). **8 session** chạm đoạn A.
  - Toàn đoạn chỉ 874 s < sàn 1.147 s nên **không có cửa sổ sàn**
    (A-lo=15:06:03Z > A-hi=14:42:23Z, rỗng) — điều kiện đóng không
    cần cắt sàn: lỗ lớn nhất 96 s < sàn theo cấu trúc (bất kỳ lỗ
    nào trong đoạn 874 s cũng < 874 s < 1.147 s). Không cần session
    bắc qua cắt nào — và cũng không có cắt nào để bắc qua.
  - Quan sát cuối đoạn A: file rebuild-fixtures-bf868abad.log
    (15:01:22Z — T8 rebuild fixture xong, khớp khung chết T8
    (15:01:22Z, 15:01:30Z]) + session exec-log 15:01:24Z + lần
    ghi blind49-recheck.log của chính T2-131 (15:01:07Z). Sau
    15:01:24Z máy yên tới reboot #80? (đuôi gộp 6 s — << sàn).
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn** (lỗ lớn nhất 96 s <
    sàn; gộp 4 phạm vi lỗ lớn nhất chỉ 60 s, xem §2.4).
- **Đoạn B: 15:01:30Z → 17:24:08Z (2h22'38" = 8.558 s, boot #80?
  ad1327ef) — MỞ (đuôi dài hơn sàn, tối đa 3 ẩn):**
  - **194 mốc** (hai cây), lỗ lớn nhất hai cây **4.392 s**
    (16:10:55Z → 17:24:08Z — chính là đuôi B); lỗ lớn thứ hai
    chỉ 383 s. Mốc đầu 15:01:57Z (head 28 s — file đầu sau reboot,
    replay #80? + T5 watcher); mốc cuối **16:10:55Z**
    (đuôi hai cây **4.392 s** > sàn 1.147 s). **10 session** chạm
    đoạn B, **0 session** chạm đuôi B.
  - Cửa sổ sàn [B-lo=15:20:37Z, B-hi=17:05:01Z] có mốc dày đặc
    (replay #80? 15:02–15:31Z; T5 đóng 15:33–15:39Z; T8b chạy lại
    15:35–15:43Z; T10 đóng đợt 15:50–16:07Z + LIMITS gộp 131
    16:10:55Z).
  - **1 session bắc qua cắt B-lo (15:20:37Z)** (birth 15:09:17Z
    mtime 15:34:17Z — session watcher b80 của T5). **0 session
    bắc qua cắt B-hi (17:05:01Z)** — và đuôi B cũng trống: điều
    kiện đóng không thỏa (lỗ đuôi 4.392 s > sàn).
  - Đuôi B (17:05:01Z, 17:24:08Z] TRỐNG ở cả 4 phạm vi: repo-1
    **0**, hidden_files **0**, ngoài cây **0**, /tmp **0**
    (xem blind51-sessions.log). 0 session chạm đuôi B.
  - Quan sát cuối đoạn B: LIMITS gộp đợt 131 (16:10:55Z) — file
    đóng đợt bị sửa sau khi T10 đóng (cờ round131-t10.done
    16:07:20Z) để thêm §12.3 quyết parent — mẫu F-129-3/F-130-1/
    F-131-1 lần thứ tư liên tiếp (T1-132 đối chiếu; sha256 lúc
    đóng 680e00fe… khớp bản lúc đóng — parent chỉ thêm §12.3 sau
    đó). Trước đó t10.done 16:07:20Z, t10-closing-sha256.txt
    16:06:31Z, GAP_ANALYSIS.md 16:06:11Z, session exec-log
    15:59:23Z. Sau 16:10:55Z máy yên tới reboot #81? (đuôi gộp
    4.393 s > sàn).
  - **Kết luận đoạn B: MỞ — tối đa 3 ẩn** (lỗ lớn nhất 4.393 s;
    floor(4.393/1.147) = 3; gộp 4 phạm vi lỗ lớn nhất cũng
    4.393 s, xem §2.4).
- **Đoạn C: 17:24:08Z → 17:46:50Z (22'42" = 1.362 s, boot #81?
  b379ecd7) — ĐÓNG bằng đo uptime trực tiếp + probe #51 + dấu
  boot tươi:**
  - **`uptime -s` lúc 17:45:40Z = 17:24:08Z** chứng minh máy up
    liên tục từ #81? tới lúc đo; probe #51 17:46:50Z đọc boot_id
    b379ecd7 tươi — cùng boot_id với boot bắt đầu 17:24:08Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C.) Đoạn C dài 1.362 s > sàn nên không áp cắt độ dài;
    uptime trực tiếp là closer cho toàn đoạn.
  - **Chuỗi dấu boot tươi củng cố:** 6 session chạm vùng C
    (birth 17:41:59Z, 17:42:49Z ×2, 17:44:26Z, 17:44:30Z, 17:45:19Z
    — các luồng đợt 132) + 62 mốc mtime (mốc đầu 17:35:37Z — file
    system_prompt.md ghi lúc mở đợt; mốc cuối 17:46:46Z — file của
    luồng đợt 132). Lỗ mtime (17:24:08Z → 17:35:37Z] 689 s là máy
    yên sau boot (replay khởi động 17:35:39Z, lượt cron 00:35 +07
    mở đợt 132 lúc 17:35Z, luồng bắt đầu ghi ~17:35–17:37Z), không
    observer — nhưng uptime đóng đoạn này. 0 session bắc qua
    cắt C-lo (17:43:15Z) / C-hi (17:27:43Z) — không cần vì
    uptime là closer.
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #51 KHÔNG ĐÓNG HOÀN TOÀN.**
Đoạn A đóng, đoạn B mở (tối đa 3 ẩn), đoạn C đóng.
2 reboot đã chốt giờ (#80? 15:01:30Z + #81? 17:24:08Z — chính xác
từng giây trên đĩa) + **tối đa 3 ẩn (đều trong đoạn B)**. Chuỗi mù
đóng hoàn toàn đã dứt sau đúng một mù (#50, đợt 131).

Ngoài hai cây: **48 file** có mtime trong mù #51 (agents —
exec-log/tool-output chiếm đa số + stage files đợt 131 + system/
memory; chi tiết xem blind51-outside.txt); **/tmp: 1 file** trong
mù #51 (xem blind51-tmp.txt). Boot_id nhắc trong
exec-log sinh/viết trong mù: f868abad 4 file, ad1327ef 5 file,
b379ecd7 2 file (phiên T2 này nằm trong số đó).

### 2.4 Gộp 4 phạm vi + 2 phát hiện mới (phương pháp nối tiếp T2-131 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind51-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 63 mốc, lỗ lớn nhất **60 s** (14:54:11Z →
  14:55:11Z), floor=0 → **ĐÓNG** (khớp verdict hai cây: lỗ lớn
  nhất 96 s — ngoài cây chẻ lỗ lớn nhất hai cây nhờ session
  exec-log; không đổi verdict).
- Đoạn B gộp: 140 mốc, lỗ lớn nhất **4.393 s** (16:10:55Z →
  17:24:08Z, đuôi), floor=3; lỗ lớn thứ hai 383 s, thứ ba 279 s →
  **MỞ, tối đa 3 ẩn**.
- Đoạn C gộp: 42 mốc, lỗ lớn nhất 689 s (đầu đoạn, máy yên sau
  boot) — **ĐÓNG bằng uptime** (không áp luật lỗ cho đoạn C).
- Tổng gộp 246 mốc giây = 245 trong ba đoạn + 1 mốc đúng tại B0
  (14:46:56Z — file ghi lúc probe #50, float 14:46:56.xxx, bị
  loại khỏi đoạn A vì đoạn A mở ở (B0, …] theo giây tròn).
- Không có file nào trong `~/workspace/goals` ngoài hidden_files
  có mtime trong mù (kiểm bằng find riêng — vùng duy nhất hai
  lần quét chính không phủ, đã kiểm bổ sung, 0 file).

**Phát hiện 1 — Ranh giới #80?/#81? sạch, không có file lệch
kiểu mù #50 (mới):** 0 file có mtime trong (btime +0 s, +10 s]
ở cả hai reboot (kiểm bằng code trong blind51-merged.py). File
cuối đoạn A là rebuild-fixtures-bf868abad.log 15:01:22Z (−8 s)
và session exec-log 15:01:24Z (−6 s) — cả hai đều là file T8
ghi lúc kết thúc rebuild fixture TRƯỚC reboot, khớp khung chết
T8 (15:01:22Z, 15:01:30Z]. Khác mù #50 (4 file T4-attempt3 ở
13:02:42Z, +1 s sau btime #78?, lệch đồng hồ cũ ~1 s): lần này
không có bằng chứng lệch đồng hồ cũ nào ở ranh giới — cận nhảy
clock chặt |X80?| < 6 s từ session (§2.2) là bằng chứng tốt nhất.
Không đổi verdict nào (đoạn A đóng cả khi tính lệch vài giây).

**Phát hiện 2 — LIMITS gộp 131 sửa sau khi đóng, lần thứ tư liên
tiếp (mới, nối tiếp F-129-3/F-130-1/F-131-1):** file mtime
16:10:55Z, sau cờ `round131-t10.done` (16:07:20Z) 3'35" — nội
dung thêm là §12.3 quyết parent (khớp brief parent giao đợt 132).
Lần này T10-131 ĐÃ lưu sha256 lúc đóng (680e00fe…, 53.291 B,
mtime 16:05:17Z) nên phần thêm sau đóng đối chiếu được: file hiện
57.139 B (+3.848 B vs lúc đóng — T1-132 đối chiếu). T2 chỉ ghi
nhận mtime + vai trò của file này (quan sát cuối đoạn B,
16:10:55Z — mốc neo hẹp nhất cho khung chết #80?) — việc đối
chiếu kích thước thuộc T1. Bài học F-131-1 đã phát huy: sha256
lúc đóng khiến lần sửa sau đóng này là lần đầu tiên đối chiếu
được đầy đủ, không còn "33 B chưa đối chiếu" như đợt 131.

### 2.5 Phân phối gap — CERT n=44 → n=45 / FULL n=59 → n=60 (1 gap mới CHỨNG NHẬN DẠNG KHOẢNG)

**Gap #79?→#80? = [2.079 s, 2.099 s] (mid 2.089 s) CHỨNG NHẬN DẠNG
KHOẢNG (mới)** — đoạn A mù #51 đóng (§2.3) + đoạn C mù #50 đóng
bằng uptime (T2-131 §2.3). Biên ±10 s của T5 dùng nguyên văn; mid
không dịch chuyển (thực hành của T5). Caveat: F80? chưa đo trực
tiếp (xem §2.2); cận nhảy clock tại #80? chặt |X80?| < 6 s từ
session (0 nhân chứng nhảy, quan sát muộn nhất 15:01:24Z) — lệch
(nếu có) nằm trong biên ±10 s; F79? ≈ −2 s đã đo trực tiếp đợt 131.
Tiền lệ: gap #72→#73 chứng nhận dạng khoảng đợt 128 trong khi F73
cũng chưa từng đo; gap #75→#76 chứng nhận dạng khoảng đợt 130
trong khi F76 cũng chưa đo; gap #77→#78? chứng nhận dạng khoảng
đợt 131 trong khi F78 cũng chưa đo — cả ba đã được parent chấp
nhận. Không áp hint hướng nào.

**Gap #80?→#81? = 8.558 s (2h22'38") VẪN CHỈ LÀ SPAN** — đoạn B mù
#51 mở (tối đa 3 ẩn, T2-132 §2.3). **CERT/FULL không tính gap này.**

**Gap #78?→#79? = [5.030 s, 5.050 s] VẪN LÀ KHOẢNG** — đã chứng nhận
đợt 131 (đoạn B mù #50 đóng). Không đổi lượt này.

**Gap #77→#78? = [7.560 s, 7.580 s] VẪN LÀ KHOẢNG** — đã chứng nhận
đợt 131 (đoạn A mù #50 đóng). Không đổi lượt này.

**Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
#49 mở (T2-131 §2.3; kiểm lại lượt này, verdict không đổi — xem
§2.6). **CERT/FULL không tính gap này.**

**Gap #75→#76 = [6.511 s, 6.531 s] VẪN LÀ KHOẢNG** — đã chứng nhận
đợt 130 (đoạn A mù #49 đóng). Không đổi lượt này.

**Gap #74→#75 = 8.307 s (2h18'27") VẪN CHỈ LÀ SPAN** — đoạn A mù
#48 mở (T2-129 §2.3). Không đưa vào FULL/CERT.

**Gap #73→#74 = 6.639 s (1h50'39") VẪN LÀ KHOẢNG [6.629 s,
6.649 s]** — đã chứng nhận đợt 128 (đoạn B mù #47 đóng). Không
đổi lượt này.

**Gap #72→#73 = 3.248 s (54'08") VẪN LÀ KHOẢNG [3.238 s,
3.258 s]** — đã chứng nhận đợt 128 (đoạn A mù #47 đóng). Không
đổi lượt này.

**Gap #71→#72 = 9.876 s (2h44'36") VẪN CHỈ LÀ SPAN** — đoạn A mù
#46 mở (T4-127 §2.3). Không đưa vào FULL/CERT.

**Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN** — đoạn G1 mù
#45 mở (T7-126 §2.3). Không đưa vào FULL/CERT.

**Gap #68→#69 = 10.880 s (3h01'20") VẪN CHỈ LÀ SPAN** — đoạn D mù
#44 mở (T7-126 §2.4). Không đưa vào FULL/CERT.

**Cross-check tái hiện T2(131) 100%:** chạy blind50-gaps.py
verbatim cho lại đúng CERT n=44 / FULL n=59 của T2 đợt 131 (xem
blind51-gaps.txt: CERT44 mean 1h41'37" median 1h52'28" p10
0h36'47" p90 2h23'10" sd 0h42'11" min 0h19'07" max 3h14'08";
FULL59 mean 1h47'56" median 1h54'16" p10 0h32'45" p90 2h33'58"
sd 0h55'42" min 0h19'07" max 5h43'18"; in 90–150' = 32, <60' = 11,
>180' = 6, >240' = 2 — khớp T2-131 §2.5 từng số). Gap mới vào
(A đóng) nên cả CERT lẫn FULL đều +1.

- **CERT n=45 (mới):** mean 1h40'08" median 1h50'39" p10 0h33'00"
  p90 2h22'50" sd 0h42'52" min 0h19'07" max 3h14'08".
- **FULL n=60 (mới):** mean 1h46'43" median 1h53'38" p10 0h32'53"
  p90 2h30'32" sd 0h56'02" min 0h19'07" max 5h43'18"; in 90–150'
  = 32, <60' = 12, >180' = 6, >240' = 2.
- Độ nhạy biên LO/HI của gap mới: CERT45 mean chỉ dao động ±1 s
  (1h40'07"–1h40'08"), FULL60 mean không đổi (1h46'43" cả hai
  biên) — biên ±10 s không làm lệch phân phối.
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới 2.089 s
  = 34'49" nằm trong dải; gap #80?→#81? 8.558 s cũng nằm trong dải
  nhưng chưa chứng nhận nên không vào).
- **Tốc độ reboot (đồng hồ ghi nhận):** 81 / 165,10 h = **1 reboot
  mỗi 122,3 phút** (từ #1 2026-11-10T20:18:10Z tới #81?
  2026-11-17T17:24:08Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 85 / 165,10 h = **1 mỗi 116,5 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn G1 (+4), mù #46
  đoạn A (+4), mù #48 đoạn A (+2), mù #49 đoạn B (+1) và mù #51
  đoạn B (+3, mới). Mù #50: **+0** (đóng hoàn toàn).
- **#80? vào dải cơ học (xem §2.2):** lần thứ mười liên tiếp trong
  dải. **#81? vào dải cơ học:** lần thứ mười một liên tiếp trong
  dải.

### 2.6 Mù #49 đoạn B kiểm lại trên đĩa hiện tại — VERDICT KHÔNG ĐỔI (lần thứ hai giống hệt)

Theo brief đợt 132 (điều tra mù #49 đoạn B còn mở) + quyết parent
đợt 130 §12.3(e) (gap #76→#77 giữ SPAN, không giao kiểm sâu lại),
T2 chạy lại code tính gộp blind#49 trên đĩa hiện tại (không chỉ
đọc lại snapshot đóng băng đợt 130/131) để xác nhận verdict trong
hồ sơ vẫn đúng — xem blind49-recheck2.py / blind49-recheck2.log:
- Số file có mtime trong cửa sổ #49 lúc kiểm lại: repo-1 **11**
  (đợt 131: 11 — giống hệt), hidden_files **309** (đợt 131: 309 —
  giống hệt), ngoài cây **37** (đợt 131: 37 — giống hệt), /tmp **0**
  (đợt 131: 0 — giống hệt). **0 file thay đổi** kể từ lần kiểm đợt
  131 (so với đợt 130: 52 file đã rời cửa sổ do xóa/ghi đè — xem
  T2-131 §2.6; từ đợt 131 tới nay không còn file nào rời cửa sổ).
- **Tái hiện đúng từng giây các lỗ quyết định (lần thứ hai liên
  tiếp giống hệt):**
  - Đoạn A gộp: lỗ lớn nhất **116 s** (08:59:20Z → 09:01:16Z) —
    **ĐÓNG**, đúng số T2-130/T2-131.
  - Đoạn B gộp: lỗ lớn nhất **2.252 s** (10:04:23Z → 10:41:55Z) —
    **MỞ, tối đa 1 ẩn**, đúng số T2-130/T2-131; lỗ lớn thứ hai 876 s
    (đuôi) cũng đúng số.
  - Đoạn C gộp: lỗ lớn nhất **2.363 s** (10:56:31Z → 11:35:54Z)
    — **vẫn ĐÓNG bằng uptime**, đúng số T2-131 (đợt 130 là 2.347 s;
    +16 s từ đợt 131 do mốc ngoài cây bị ghi đè, không đổi từ đó).
  - Tổng mốc gộp 219 (đợt 130: 245 — giảm do 52 file rời cửa sổ
    trước đợt 131; không đổi từ đợt 131).
- **Kết luận: mù #49 KHÔNG ĐÓNG HOÀN TOÀN — không đổi** (A đóng,
  B mở tối đa 1 ẩn, C đóng). Gap #76→#77 = 6.859 s **giữ SPAN**.
  Không giao luồng sau kiểm lại B mù #49 (tiền lệ quyết đợt 126
  §12(h) + quyết đợt 130 §12.3(e)) — chờ bằng chứng ngoài VM.
  Lần kiểm này là lần thứ hai liên tiếp cho kết quả giống hệt lần
  trước — hồ sơ mù #49 đã ổn định, không cần kiểm lại mỗi đợt
  trừ khi có bằng chứng mới (đề nghị parent xem xét bỏ mục kiểm
  lại thường lệ này khỏi brief T2 các đợt sau).

### 2.7 Quét writeFileSync lần thứ 38 — chênh 0 (lần thứ 38 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round132-t2, đổi OUT sang
  round132-t2) **17:56:04Z → 17:56:24Z 17/11 (20 s, có SCAN-END)**.
  Scan chạy trên boot #81?, SAU khi mù #51 đã đóng bằng probe #51
  (17:46:50Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **883 dòng / 246 file** (phạm vi 3.085 file); R7b đối
  chiếu: **908 dòng / 263 file** (phạm vi 12.478 file); copies:
  **25 dòng / 17 file** — y hệt lần 37 về copies. Đối chiếu chéo:
  883+25=908=R7b, **chênh 0**.
- **+5 dòng / +1 file so với lần 37** (878/245 → 883/246), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND131_T2_EPERM_LIMITS.md | +5 (0 → 5) | 15:17:33Z 17/11 | Tài liệu T2 đợt 131 (nhắc `writeFileSync` 5 lần); viết SAU scan lần 37 (14:59:07–14:59:24Z 17/11) nên lần này mới vào |
- Phạm vi: 3.085 = 3.075 + 10 net (**10 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 10 file mới gồm 6 LIMITS đợt
  131 (gộp + T1/T2/T4/T6/T8, viết sau scan lần 37) + 4 LIMITS đợt
  132 (T1/T6/T7/T9, viết trước scan 17:56Z); T3/T5/T7/T9 đợt 131 đã
  có trong phạm vi lần 37 (tạo file trước 14:59Z); 0 file mất).
  Copies y hệt lần 37 (diff 0 dòng).
- **Kết luận: 38 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #51.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 2 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md, không tính dist): vẫn đúng 2 helper đã biết — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 12:13:59Z không đổi;
    dist nằm ngoài phạm vi quét WFS nên không làm lệch số đếm.
- Lưu ý phương pháp: pattern phải là `\.writeFile\(` (có dấu chấm).
  Pattern không dấu chấm còn bắt thêm các mock `async writeFile(`
  trong file test `apps/web/scripts/test_round83_k8_eperm_retry.mjs`
  (định nghĩa fake fs, mtime 10/11, không phải đường ghi thật) —
  không tính vào 2 helper; T7-126 §2.8 cũng dùng pattern có dấu
  chấm nên số 2 là nhất quán giữa các lượt.
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #51.

## 3. RAM trong mù #51 — max 3.145 MB (52% guard), birefnet KHÔNG chạy

- **3 mẫu MemAvailable trực tiếp của lượt (đo trực tiếp, đều trong
  đoạn C):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 17:45:40Z | **1.647.136 kB** | Trước probe #51 (boot #81?) |
  | 17:46:50Z | **1.441.600 kB** | Lúc probe #51 (boot #81?) |
  | 17:47:01Z | **1.367.872 kB** | Sau probe #51, lúc đo F81? (boot #81?) |
- **Max RAM biết được TRONG mù #51 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 88 mẫu RAM; **max 3.145 MB**
  (T5 watcher b80 poll 1, 15:07:10Z, đoạn B — đã xác minh trực
  tiếp dòng log; cùng giá trị xuất hiện 2 lần do file .log +
  .nohup.log trùng nội dung) = **52% ngưỡng guard** — thấp hơn
  max 3.317 MB mù #50 và thấp hơn max kỷ lục 4.576 MB mù #42;
  đoạn A max **2.431 MB** (T4 poll, 14:58:26Z); đoạn B max
  **3.145 MB**; đoạn C **không có mẫu log sibling** (mẫu trực tiếp
  của T2 max 1.647 MB, xem bảng trên).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 3.145 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T2 đợt 131)

1. **Prereg dự báo ĐÚNG HẾT các verdict có dự báo chắc (mới, §0):**
   probe #51 boot b379ecd7 ok=2 fail=0 ĐÚNG; log +3 ĐÚNG; #81?
   trong dải cơ học ĐÚNG (lần thứ mười một liên tiếp); đoạn A ĐÓNG
   ĐÚNG; đoạn C ĐÓNG bằng uptime ĐÚNG; EPERM 0 sóng ĐÚNG; WFS
   chênh 0 ĐÚNG (883 dòng — trong khoảng dự báo ~878–885); RAM
   max < 4.576 MB ĐÚNG (3.145 MB). Đoạn B prereg chỉ ghi "KHÔNG
   CHẮC, nghiêng MỞ" (không dự báo chắc) — verdict MỞ nằm trong
   vùng không chắc đã ghi, không tính là dự báo sai. Gap #79?→#80?
   chứng nhận đúng điều kiện prereg đã viết (A đóng → chứng nhận
   với biên ±10 s + caveat F80? chưa đo). **Chênh 1 s duy nhất:**
   prereg ghi đầu trên dải cơ học cho #81? là 17:35:28Z theo phép
   cộng số làm tròn (p90 = 9.238 s); code cho 17:35:27Z vì p90
   float bị cắt khi đổi sang datetime — không đổi verdict (17:24:08Z
   vẫn nằm trong dải với biên lớn).
2. **Đoạn A ngắn hơn sàn — đóng bằng luật lỗ, không cần cắt sàn
   (mới):** đoạn A chỉ 874 s < sàn 1.147 s nên không có cửa sổ sàn
   (A-lo > A-hi, rỗng). Khác đoạn C mù #50 (1.215 s, đóng bằng
   uptime): đoạn A đóng bằng luật lỗ vì lỗ lớn nhất 96 s < sàn
   theo cấu trúc — bất kỳ lỗ nào trong đoạn 874 s cũng < 874 s <
   1.147 s. Không cần session bắc qua cắt (không có cắt nào).
   Tiền lệ cho đoạn ngắn đóng bằng uptime đã có; đoạn ngắn đóng
   bằng luật lỗ là trường hợp đầu tiên — ghi rõ để luồng sau khỏi
   tưởng thiếu cắt sàn là thiếu chứng cứ.
3. **Khung chết #80? ba nguồn đồng thuận (mới, §2.2 cuối):** đĩa
   (16:10:55Z, 17:24:08Z] (T2 lượt này, quan sát cuối LIMITS gộp
   131) = khung T6-132 (độc lập, cùng mốc); scheduler T7-132
   (16:00:00Z, 17:24:08Z] (DR 23:00 started 16:00:00Z) rộng hơn
   và chứa khung đĩa — không mâu thuẫn, chỉ khác mốc dấu sống
   cuối (mtime file vs dấu vết scheduler). Lấy khung hẹp nhất làm
   chuẩn, ghi cả hai (tiền lệ F-130-6, quyết parent đợt 130
   §12.3(f) + đợt 131 §12.3(c)).
4. **Kiểm lại mù #49 bằng quét lại trên đĩa hiện tại, lần thứ hai
   giống hệt (mới, §2.6):** recheck-2 cho số liệu Y HỆT lần kiểm
   đợt 131 (11/309/37/0; A 116 s, B 2.252 s, C 2.363 s) — 0 file
   thay đổi kể từ đợt 131. Hồ sơ mù #49 đã ổn định; T2 đề nghị
   parent xem xét bỏ mục kiểm lại thường lệ này khỏi brief T2 các
   đợt sau (chỉ kiểm lại khi có bằng chứng mới ngoài VM).
5. **Đếm match thô vs dòng duy nhất trong quét EPERM (mới, §0):**
   sweep báo 11 match thô / 8 dòng duy nhất — 3 match thừa là lần
   xuất hiện "EPERM" thứ hai trong 3 dòng hasEperm ("hasEperm
   phân biệt EPERM với port conflict" chứa 2 match mỗi dòng). Đợt
   131 cũng có 3 match thừa cùng nguyên nhân (15 thô / 12 duy
   nhất). Ghi rõ để luồng sau khỏi tưởng 3 match thừa là 3 dòng
   chưa phân loại.
6. **Lỗi sed thay đúp khi tạo script sweep/ram — đã bắt trước khi
   chạy (mới):** lệnh sed `s/11:38:21Z/14:46:56Z/; s/14:46:56Z/
   17:46:50Z/` thay cả B0 lẫn B1 thành 17:46:50Z trong
   eperm-sweep51.py và ram-max51.py (B0=B1). Phát hiện bằng grep
   kiểm tra trước khi chạy; sửa bằng thay thế có đích (B0 =
   14:46:56Z, B1 = 17:46:50Z; SEGS A/B/C đúng) rồi mới chạy. Không
   dùng số nào từ bản lỗi (bản lỗi không được chạy lần nào). Bài
   học: khi adapt script bằng sed nối tiếp, kiểm tra hằng số
   B0/B1/SEGS bằng grep trước khi chạy — như đã làm với blind51
   scripts viết tay (không lỗi).
7. **F81? ≈ −1 s, khác F79? ≈ −2 s (mới, §2.2):** đồng hồ local
   trôi ~1 s giữa hai boot — ghi đúng số đo (+1 s cả ba server)
   thay vì ép về "≈ 0". Với dung sai ±~1 s quen thuộc thì F81?
   vẫn trong dung sai, nhưng con số thô được ghi rõ để luồng sau
   khỏi tưởng đồng hồ không trôi.
8. **Kiểm lại boot TRƯỚC (17:40Z), LÚC probe (17:46:50Z) và SAU
   khi đo xong (17:58:25Z):** cả ba lần cùng boot b379ecd7
   (#81?) — **KHÔNG có reboot giữa phiên T2 lượt này** (xem §2.1
   cuối). Probe #51 và mù #51 KHÔNG bị ảnh hưởng bởi reboot nào
   trong phiên; mù #52 mở từ probe #51 — việc của T2 đợt 133.
9. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
   model đóng/nhạc bản quyền.**
10. **Không quét toàn workspace lượt này:** chỉ dùng góc hẹp/mục
    tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ repo-1/goals
    + /tmp + exec-logs + kiểm bổ sung goals-ngoài-hidden_files).
11. **Stage batch:** chỉ 1 file text (LIMITS doc này),
    NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
    checkpoint + stage file).
12. **Ghi rõ:** số thứ tự reboot #48–#81? vẫn TẠM THỜI (T6-132
    chốt chuỗi tương đối #57→#81, số tuyệt đối vẫn tạm); giá trị
    gap không phụ thuộc số thứ tự.
13. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F80? CHƯA ĐO + cận nhảy clock chặt
    |X80?| < 6 s vào hồ sơ (xem §2.2 + §2.5).
14. **Cross-check tái hiện T2(131) 100%** (CERT n=44 / FULL n=59)
    trước khi kết luận số mới — chạy blind50-gaps.py verbatim
    qua exec trong blind51-gaps.py (xem blind51-gaps.txt). Không
    dùng số nào từ lần chạy lỗi (lần chạy lỗi là bản sweep/ram
    sed đúp ở mục 6 — đã sửa trước khi chạy lại exit 0).
15. **md5 preview.tsx KHÔNG ĐỔI trong đợt 132 (ghi nhận):**
    preview.tsx 805409f0, media.ts không đổi 2c384ed1,
    vite.config.ts ee80d093. T2 không sửa production file nào.
16. **Các luồng đợt 132 khác đang chạy lúc T2 đóng** — T2 chỉ ghi
    nhận trạng thái (T1/T6/T7/T9 đã có cờ .done; T3/T4/T5/T8 đang
    chạy), không phụ thuộc kết quả các luồng đó. T7-132 và T6-132
    đã xong trước T2 — T2 chỉ đối chiếu khung chết #80? và số boot
    với hai luồng này (cả hai đều khớp bằng chứng đĩa độc lập của
    T2); verdict mù #51 là của riêng T2, tính bằng code riêng.
17. **T2 KHÔNG mở Xvfb** (luồng probe không cần browser) nên
    không có Xvfb nào để kill — luật đứng đợt 127 §12.1.3 (mỗi
    driver tự kill Xvfb của mình) không phát sinh việc lượt này.
18. **Replay #81? đã bắt đầu theo T5-132 (mới, §2.1):**
    configure 17:35:39Z (boot +11'31"), 537 dòng / 79 installs lúc
    17:58:47Z, vẫn chạy — snapshot của T2 chỉ là giữa chừng; T5 là
    chủ quản replay, T2 chỉ ghi bracket. Replay #80? đầy đủ thuộc
    về T5-131 (759 dòng / 109 installs, POSTBOOT_PASS 15:31:20Z).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #51: KHÔNG ĐÓNG HOÀN TOÀN (mới — xem §2.3).** Đoạn A
   đóng, đoạn B mở (tối đa 3 ẩn), đoạn C đóng. 2 reboot đã chốt
   giờ (#80? 15:01:30Z + #81? 17:24:08Z) + tối đa 3 ẩn (đều trong
   đoạn B). Gap #79?→#80? chứng nhận dạng khoảng [2.079 s,
   2.099 s]; gap #80?→#81? = 8.558 s giữ SPAN. **CERT n=45 /
   FULL n=60 (mới).**
2. **Mù #52 MỚI MỞ (từ probe #51 17:46:50Z) — việc của lượt sau:**
   probe #52 + điều tra đoạn từ #81? ở đợt 133. Gap #80?→#81?
   giữ SPAN cho tới khi đoạn B mù #51 đóng (cần bằng chứng ngoài
   đĩa — 3 slot scheduler thiếu trong khung chết phù hợp máy đã
   chết, nhưng không lấp được đuôi đĩa 4.393 s).
3. **Gap #79?→#80? = [2.079 s, 2.099 s] CHỨNG NHẬN DẠNG KHOẢNG
   (mới — xem §2.5).** Caveat: F80? chưa đo trực tiếp; cận nhảy
   clock tại #80? chặt |X80?| < 6 s từ session (0 nhân chứng
   nhảy); F79? ≈ −2 s đã đo trực tiếp đợt 131. Tiền lệ #72→#73
   (F73 chưa đo) + #75→#76 (F76 chưa đo) + #77→#78? (F78 chưa đo)
   đã được parent chấp nhận.
4. **Gap #80?→#81? = 8.558 s VẪN CHỈ LÀ SPAN (mới — xem §2.5).**
   Đoạn B mù #51 mở, tối đa 3 ẩn. Không đưa vào CERT/FULL.
5. **Mù #49 đoạn B: MỞ — kiểm lại lượt này lần thứ hai, VERDICT
   KHÔNG ĐỔI (mới — xem §2.6).** Gap #76→#77 giữ SPAN theo quyết
   parent đợt 130 §12.3(e). Không giao luồng sau kiểm lại B mù #49
   (đề nghị parent xem xét bỏ mục kiểm lại thường lệ — hồ sơ đã
   ổn định hai lần kiểm giống hệt).
6. **Mù #48 (đoạn A): MỞ — parent CHƯA quyết có chấp nhận để mở
   hay không.** T2 không kiểm lại lượt này. Gap #74→#75 giữ SPAN.
7. **Mù #47: ĐÓNG HOÀN TOÀN (đợt 128) — KHÔNG đổi lượt này.**
   T2 không kiểm lại.
8. **Mù #46 (đoạn A): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (tiền lệ
   quyết đợt 126 §12(h), đính chính đợt 127 §12(c)). T2 không
   kiểm lại lượt này. Gap #71→#72 giữ SPAN.
9. **Mù #45 (đoạn G1): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h)). T2 không kiểm lại lượt này. Gap #70→#71 giữ SPAN.
10. **Mù #44 đoạn D: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
    125 §12(h), kiểm sâu 1 lần đã xong đợt 126). T2 không kiểm lại
    lượt này. Gap #68→#69 giữ SPAN.
11. **Mù #43 (gap #67→#68): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ**
    (quyết đợt 124 §12.4). T2 không kiểm lại lượt này. Gap #67→#68
    giữ SPAN.
12. **Mù #40 đoạn B: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
    124 §12.3). T2 không kiểm lại lượt này. Gap #63→#64 giữ SPAN.
13. **Gap #66→#67 = KHOẢNG [27'06", 28'28"] ĐÃ CHỨNG NHẬN DẠNG
    KHOẢNG (đợt 124) — parent ĐÃ CHẤP NHẬN cả ba điểm (§12.5).**
    Không đổi lượt này.
14. **Reboot #80? (15:01:30Z, boot ad1327ef) + #81? (17:24:08Z,
    boot b379ecd7) — CHỈ GHI NHẬN giờ + bracket replay (mới, xem
    §2.2 cuối + §2.1).** Gap #79?→#80? thuộc mù #51 đoạn A, ĐÓNG;
    gap #80?→#81? thuộc mù #51 đoạn B, MỞ. **Không tự đánh số
    thứ tự chắc chắn** — số #80?/#81? là tạm thời như #79? (chuỗi
    tương đối #57→#81 đã chốt theo T6-132, số tuyệt đối vẫn tạm).
    **Lưu ý replay:** bracket #81? thuộc về T5-132 (configure
    17:35:39Z, 537 dòng / 79 installs lúc 17:58:47Z, vẫn chạy);
    bracket #80? thuộc về T5-131 (759 dòng / 109 installs,
    POSTBOOT_PASS 15:31:20Z). File dpkg.log gốc của #80? đã mất
    theo reboot sau (như bracket #71/#72/#73/#74/#75/#76/#77/#79?).
15. **Khung chết #80? ba nguồn đồng thuận (mới, xem §2.2 cuối +
    §4 mục 3):** đĩa (16:10:55Z, 17:24:08Z] (T2 + T6-132 độc lập)
    hẹp nhất; scheduler T7-132 (16:00:00Z, 17:24:08Z] rộng hơn và
    chứa khung đĩa. 3 slot scheduler thiếu mới (HB 16:20:50Z, HB
    16:50:50Z, DR 17:00Z) đều rơi vào khung chết — phù hợp máy đã
    chết trong đuôi B (T7-132 là chủ quản scheduler; T2 chỉ ghi
    nhận tương quan, không tự kết luận nguyên nhân).
16. **RAM max 3.145 MB = 52% guard (mới — xem §3).** Thấp hơn max
    3.317 MB mù #50 và thấp hơn max kỷ lục 4.576 MB
    mù #42. **Birefnet KHÔNG chạy** (vẫn dưới guard 6 GB; quyết
    parent §12.7 vẫn đứng). u2net vẫn là fallback chính thức.
17. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
    --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
    117, chưa trả lời — nhắc lần 16 ở đợt 130/131 theo LIMITS gộp;
    T5-131 cũng nhắc lần 16). Watcher này sẽ lấp đúng loại lỗ
    như lỗ đoạn B của mù #51 (4.393 s — lần này lỗ đuôi B chính
    là loại lỗ watcher v2 nhắm tới, nhưng mù #51 đã mở và chứa
    reboot #81? giữa đợt).
18. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
    parent đã chấp nhận để mở; ngày đúng 15/11 theo F-131-T6-1).
    Khoảng mù #35 cũng vậy (T7 đợt 117). Gap #49→#50, #50→#51,
    #51→#52 vẫn là cận trên.
19. **EPERM không tuyên bố đã hết** (sóng gần nhất ~149h52'
    trước probe #51). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
20. **Mù #52 MỚI MỞ (từ probe #51 17:46:50Z) — việc của lượt sau:**
    probe #52 + điều tra đoạn từ #81? (xem mục 2 + §2.1 cuối).
    T2 KHÔNG tự chạy probe #52 lượt này (nhịp probe là 1/lượt).
