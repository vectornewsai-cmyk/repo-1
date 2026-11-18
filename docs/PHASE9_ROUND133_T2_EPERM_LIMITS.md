# PHASE9 ROUND133 T2 — EPERM: probe #52 ok=2 fail=0 + mù #52 ĐÓNG HOÀN TOÀN (A đóng, B đóng) + gap #81?→#82? CHỨNG NHẬN DẠNG KHOẢNG + CERT n=46 / FULL n=61 + mù #51 B kiểm lại KHÔNG ĐỔI

> Luồng T2, đợt 133 vòng lặp Phase 9 VCut Studio (lượt cron 03:35 +07
> 18/11/2026; làm việc 20:40Z → ~21:05Z 17/11/2026).
> Nhiệm vụ: probe #52 theo lịch thường lệ + mù #52 MỚI MỞ từ probe #51 —
> điều tra đoạn từ #81? + kiểm lại mù #51 B nếu có bằng chứng mới +
> quét sóng EPERM. Quyết parent đợt 132 §12.3(d): ĐÃ PHÊ DUYỆT BỎ MỤC
> KIỂM LẠI MÙ #49 B THƯỜNG LỆ khỏi brief T2 — đợt này KHÔNG kiểm lại
> mù #49 B (không có bằng chứng mới cụ thể; xem §2.6).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round133-t2/prereg-t2.md. **Prereg có 2 SAI SỐ SỐ HỌC
> (xem §4 mục 1–2: gap #81?→#82? ghi 6.445 s — sai, đó là độ dài
> đoạn A, gap btime đúng là 7.807 s; dải cơ học cho #82? ghi
> [18:19:43Z, 20:16:42Z] — sai mốc cộng, đúng là [17:57:00Z,
> 19:54:40Z]); verdict không đổi (vẫn trong dải, vẫn chứng nhận).
> Dự báo RAM cũng sai (max thật 3.111 MB, trên band dự báo — xem
> §4 mục 3).** Các dự báo verdict còn lại ĐÚNG HẾT (probe #52,
> log +3, A đóng, B đóng, EPERM 0, WFS chênh 0).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #47 (ĐÃ ĐÓNG HOÀN
> TOÀN đợt 128) / mù #46 đoạn A / mù #45 đoạn G1 / mù #44 đoạn D /
> mù #40 đoạn B / mù #43 / mù #42 đoạn B** (quyết parent đợt 124 §12.3
> + §12.4, đợt 125 §12(h), đợt 126 §12(h), đợt 127 §12(c)). **Mù #50
> ĐÃ ĐÓNG HOÀN TOÀN đợt 131 — KHÔNG kiểm lại.**
> **KHÔNG có reboot giữa phiên T2 lượt này** (boot 07da9c50 xác minh
> 20:40Z, 20:42Z, 21:03Z — cùng một boot).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (20:42:52Z → 20:42:56Z):** `status`
  báo **DEAD/STALE** (heartbeat age 10.562 s, last #51 17:46:50Z, boot
  b379ecd7, exit 1); `once` ngay sau đó là **probe #52, boot
  07da9c50, ok=2 fail=0**, exit 0, 20:42:56Z; `status` chạy lại
  **ALIVE** (age 11 s, n=52), exit 0. Log v2 tăng đúng **3 dòng**
  (145 → 148) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=52, ts 20:42:56Z, boot 07da9c50.
- **Boot #82? (tạm) lúc 19:34:15Z, boot
  `07da9c50-5836-4481-a4a4-7e22c6260325`** — xác minh bằng `uptime -s`
  + btime 1794944055 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại: HTTP `Date` cả 3 server đều khớp **+1 tới +2 s** (server hơn
  local 1–2 s cả ba: example.com, google.com, cloudflare.com) →
  **F82? ≈ −1 s (±~1 s)** — đo trực tiếp đầu tiên trên boot mới.
  T6-133 sẽ chốt chuỗi tương đối, số tuyệt đối VẪN TẠM (giữ "?").
- **#82? tới TRONG dải cơ học từ #81?** [17:57:00Z, 19:54:40Z]
  (p10–p90 FULL60); #82? thật 19:34:15Z — **lần thứ mười hai liên
  tiếp trong dải**. (Prereg ghi sai dải [18:19:43Z, 20:16:42Z] do
  cộng nhầm từ giờ probe #51 thay vì btime #81? — xem §4 mục 2;
  verdict "trong dải" không đổi.)
- **Khoảng mù #52 (17:46:50Z → 20:42:56Z 17/11, 2h56'06") —
  ĐÓNG HOÀN TOÀN (A đóng, B đóng).** Đoạn A **ĐÓNG** (merged 4 phạm vi:
  162 mốc, lỗ lớn nhất 419 s, đuôi 15 s; hai cây riêng cho lỗ đuôi
  2.934 s — đó là artifact mtime ghi-đè-cuối, được session ngoài cây
  lấp đầy, xem §2.3 + §2.4); đoạn B **ĐÓNG** (merged: 113 mốc, lỗ lớn
  nhất 469 s, đuôi 3 s; đồng thời đóng bằng uptime trực tiếp lúc
  probe #52). **1 reboot đã chốt giờ trong mù (#82? 19:34:15Z —
  chính xác từng giây trên đĩa) + 0 ẩn.** Chuỗi mù đóng hoàn toàn
  nối lại sau một mù hở (#51, đợt 132).
- **Gap #81?→#82? = [7.797 s, 7.817 s] (mid 7.807 s) CHỨNG NHẬN DẠNG
  KHOẢNG (mới)** — đoạn A mù #52 đóng (merged) + đoạn C mù #51 đóng
  bằng uptime (đợt 132); biên ±10 s của T5; **F81? VÀ F82? đều đo
  trực tiếp** (caveat nhẹ hơn các gap khoảng trước) + cận nhảy clock
  |X82?| < 15 s từ session (xem §2.2 + §2.5 + §4 mục 1).
  **CERT n=45 → n=46 / FULL n=60 → n=61.**
  **Gap #80?→#81? = 8.558 s VẪN CHỈ LÀ SPAN** (đoạn B mù #51 mở —
  kiểm lại lần thứ ba, verdict không đổi, xem §2.6).
- **Mù #51 đoạn B kiểm lại trên đĩa hiện tại: VERDICT KHÔNG ĐỔI —
  lần thứ ba** (mới, xem §2.6): merged lỗ lớn nhất vẫn đúng
  **4.393 s** (16:10:55Z → 17:24:08Z), tối đa 3 ẩn; 0 session chạm
  đuôi B, 0 file trong đuôi B ở cả 4 phạm vi. Gap #80?→#81? giữ SPAN.
  (Tổng mốc gộp 222 so với 246 đợt 132 — file rời cửa sổ do ghi đè/
  xóa; các lỗ quyết định không đổi. Đoạn C đầu lỗ trôi 689 s → 710 s
  do system_prompt.md bị viết lại lúc mở đợt 133 — không đổi verdict.)
- **Mù #49 B: KHÔNG kiểm lại đợt này** — theo quyết parent đợt 132
  §12.3(d) (đã phê duyệt bỏ mục kiểm lại thường lệ; chỉ kiểm lại khi
  có bằng chứng mới cụ thể). T2 đợt này không thấy bằng chứng mới nào
  về mù #49 B. Gap #76→#77 giữ SPAN.
- **Khung chết boot #81?: (19:33:56Z, 19:34:15Z] (19 s)** — bốn nguồn
  T4/T5/T5b/T8 khớp (LIMITS gộp 132 §10.1b); bằng chứng session của
  T2 thu hẹp thêm thành (19:34:00Z, 19:34:15Z] (15 s) — ghi cả hai,
  khung 19 s vẫn là chuẩn đã thỏa thuận (xem §2.2).
- **Replay boot #82? ĐÃ XONG (theo T5b-132, chủ quản replay):**
  1.545 dòng / 221 installs (đếm lại lượt này: 1.545 dòng, 221 dòng
  "status installed" — khớp); configure 19:34:46Z (boot +31 s), gói
  cuối gstreamer1.0-tools 19:36:48Z (boot +2m33s); gstreamer1.0-gl
  đã cài bởi replay 19:35:28Z. T2 chỉ ghi bracket (kiểm boot trước
  MỖI lần đọc /var/log).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 124 file
  *.log có mtime trong mù #52 (0 file repo-1, 124 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8, xem §2.7). Quét mở rộng: **11 match thô / 8 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher trên; 3 match thô thừa là lần xuất hiện "EPERM" thứ hai
  trong 3 dòng hasEperm). Sóng gần nhất vẫn là
  **~11:55–12:11Z 11/11** (R7) — **~152h48'** trước probe #52. EPERM
  vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 39: 887 dòng / 247 file** (phạm vi 3.094
  file); R7b đối chiếu 912 dòng / 264 file; copies 25 dòng / 17
  file — y hệt lần 38 về copies. Đối chiếu chéo 887+25=912=R7b,
  **chênh 0 — lần thứ ba mươi chín liên tiếp**. +4 dòng / +1 file so
  với lần 38, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray;
  mtime không đổi từ 10/11 (dist copy 11/11 không đổi).
- RAM: max biết được trong mù #52 **3.111 MB** (T5 watcher b81 poll 5,
  17:51:35Z, đoạn A) = **50,7% ngưỡng guard**; đoạn B max **1.424 MB**
  (19:36:47Z). **Birefnet KHÔNG chạy, vẫn
  0 lần chạy thành công trong gói** — 3.111 MB vẫn dưới guard 6 GB;
  quyết parent §12.7 vẫn đứng (chỉ thử lại khi quan sát được
  available ≥ 6 GB).
- **preview.tsx KHÔNG ĐỔI trong đợt 133:** md5 805409f0, mtime
  không đổi; media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts ee80d093.
  T2 không sửa production file nào.
- **Reboot #81?→#82? là reboot giữa lượt lần thứ 7 liên tiếp**
  (chuỗi T2-132 §2.2: #79?→#80? giữa lượt 131, #80?→#81? quanh ranh
  giới đợt, thêm #81?→#82? giữa lượt 132 — T4/T5/T5b/T8 đều ghi
  cùng khung chết 19 s). **Mù #53 MỚI MỞ** từ probe #52 (việc của
  T2 đợt 134).
- **Đợt 133 lúc T2 đóng (~21:05Z):** T1/T7/T9 đã có LIMITS trên đĩa
  (thấy qua diff phạm vi WFS); các luồng khác đang chạy; boot hiện
  tại #82? (kiểm 21:03:56Z). Hạn cứng đóng đợt 23:35Z 17/11 (theo
  brief T2). T2 KHÔNG mở Xvfb (không cần) nên không có gì để kill —
  luật đứng đợt 127 §12.1.3 không phát sinh việc.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 20:40:52Z | boot_id `07da9c50-5836-4481-a4a4-7e22c6260325`; `who -b` Nov 17 19:34; `uptime -s` **2026-11-17 19:34:15**; btime **1794944055 = 2026-11-17T19:34:15Z**; journal chỉ 1 boot (07da9c50, first entry 19:34:26Z, last 20:40:20Z lúc kiểm tra). MemAvailable 465.304 kB lúc 20:40:52Z (thấp — gate A kẹt, phù hợp T4-132). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot b379ecd7 đã mất theo reboot #82?, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 20:42:52Z | **DEAD/STALE**, heartbeat n=51, ts 17:46:50Z, boot b379ecd7, age **10.562 s** (đúng 2h56'02"); last sample probe #51; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 20:42:56Z | **probe #52, boot=07da9c50, ok=2 fail=0**, exit 0; dòng `boot changed b379ecd7 -> 07da9c50` (uptime since 2026-11-17 19:34:15) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~20:43:07Z | **ALIVE**, age 11 s, n=52, exit 0 |

Kiểm lại từ đĩa: log probe v2 **148 dòng** — 145 sau T2-132 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #51 +
dòng `boot changed` + dòng probe #52). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #51 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=52, ts 2026-11-17T20:42:56Z, boot
07da9c50-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.
(Lưu ý: một lệnh exec báo exit 1 sau khi chạy `status` lần 2 là do
`grep -c "=== probe end"` trả 0 match — exit của grep, không phải
của checklist.)

Nguồn độc lập cho boot #82?: 16 session T2 trong vùng B (xem §2.3)
+ 113 mốc mtime gộp trong vùng B (mốc đầu 19:34:46Z — dpkg configure;
mốc cuối 20:42:53Z — file của luồng đợt 133) + 6 exec-log nhắc
07da9c50. **Số thứ tự TẠM THỜI** (như
#69/#70/#71/#72/#73/#74/#75/#76/#77/#78?/#79?/#80?/#81?; T6-133
sẽ chốt chuỗi tương đối, số tuyệt đối vẫn tạm).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #52 (17:46:50Z → 20:42:56Z 17/11, 2h56'06")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #52: `uptime -s` = **2026-11-17 19:34:15Z**,
  boot_id `07da9c50-5836-4481-a4a4-7e22c6260325` — khác boot của
  probe #51 (b379ecd7).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (20:40:52Z): chỉ **1 boot**
  (07da9c50, first entry 19:34:26Z, last 20:40:20Z). Journal/wtmp
  của boot b379ecd7 đã mất theo reboot #82? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #82? — bracket ghi trong lượt (bài học
  T7-125 §4 mục 4: kiểm boot trước MỖI lần đọc /var/log).** Lúc
  21:01Z file có **1.545 dòng, 221 dòng "status installed"** —
  khớp T5b-132 (1.545 dòng / 221 installs); configure 19:34:46Z
  (boot +31 s), gói cuối gstreamer1.0-tools 19:36:48Z (boot
  +2m33s); **gstreamer1.0-gl đã cài bởi replay 19:35:28Z** —
  khác boot #81? (thiếu gói, phải --repair). **Replay ĐÃ XONG,
  đóng băng.** **Hồ sơ đầy đủ thuộc về T5b-132 (chủ quản replay)**
  — snapshot của T2 chỉ là xác nhận lại. **Lưu ý:** replay #82?
  khởi động nhanh (+31 s) — nhanh nhất trong các boot gần đây
  (#81? +11'31", #80? +49 s, #79? +8'58"); T5 phân loại.
- **dpkg.log của boot #81? đã MẤT** (file lúc T2 kiểm chỉ còn
  bracket #82?): /var/log reset mỗi boot. Bản ghi T5-132 (replay
  #81? 1.551 dòng / 222 installs + --repair gstreamer1.0-gl, cờ
  POSTBOOT_PASS 18:35:45Z) là bằng chứng duy nhất còn lại cho
  bracket #81? — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**KHÔNG có reboot giữa phiên T2 lượt này:** boot 07da9c50 xác minh
lúc 20:40Z (mở lượt), 20:42:56Z (probe #52) và 21:03:56Z (trước khi
viết LIMITS) — cùng boot_id + btime 19:34:15Z cả ba lần. (Khác đợt
131: T2-131 gặp reboot #80? giữa phiên, sau khi đo xong.)

### 2.2 Reboot đã chốt trong mù — #82? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 82? | **19:34:15Z** (chính xác từng giây) | b379ecd7 → 07da9c50 | Chốt từ lượt này: `uptime -s` đọc tươi (20:40:52Z + kiểm lại 21:03:56Z) + btime 1794944055 + `who -b` 19:34 + boot_id 07da9c50 + journal first entry 19:34:26Z + probe #52 20:42:56Z boot 07da9c50 ok=2 fail=0 + 16 session trong vùng B. **Số thứ tự TẠM THỜI.** |

**Clock:** F82? ≈ **−1 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` cả 3 server đều
khớp **+1 tới +2 s** (server hơn local 1–2 s cả ba: example.com,
google.com, cloudflare.com — local epoch đọc ngay sau mỗi lần
fetch nên độ lệch thật ~−1 s; cả ba server đều cho Date =
local_after + 1 s). **F82? là lần đo trực tiếp đầu tiên trên boot
#82?** — không dùng cận hai lần đo. F81? ≈ −1 s (±~1 s, đã kiểm
14:47Z… — đính chính: đã kiểm 17:47Z đợt 132, 3/3 nguồn +1 s).
Hai boot liên tiếp cùng F ≈ −1 s — đồng hồ local ổn định ở mức
chậm ~1 s; ghi đúng số đo, không ép về "≈ 0". **F81? và F82?
đều đã đo trực tiếp — gap #81?→#82? không mang caveat "F chưa đo"
như 4 gap khoảng trước (xem §2.5).**

**CẬN NHẢY CLOCK TẠI #82? — 0 nhân chứng nhảy:**
- **0 nhân chứng nhảy tại #82?:** **0 session** sinh trước
  19:34:15Z có mtime sau 19:34:15Z (quét 229 exec-log). Quan sát
  cũ-clock muộn nhất trước #82?: session mtime **19:34:00Z** — cách
  btime chỉ 15 s nên cho cận **|X82?| < 15 s** (session
  proc_100af6842157.log, birth 17:41:59Z mtime 19:34:00Z — phiên
  dài của luồng đợt 132, nhiều khả năng là watcher/poll của T4/T5;
  nội dung file nhắc b379ecd7). Cận này lỏng hơn |X80?| < 6 s đợt
  132 (do máy yên 15 s cuối trước reboot) nhưng vẫn lớn hơn biên
  ±10 s? Không: 15 s > 10 s — lệch clock tại #82? (nếu có) có thể
  vượt biên chứng nhận gap ±10 s một chút. Tuy nhiên F82? đo trực
  tiếp (±~1 s) là bằng chứng chính về lệch đồng hồ tại #82? —
  cận session 15 s chỉ là cận trên lỏng từ "dấu sống cuối", không
  phải bằng chứng lệch thật. Ghi rõ cả hai, không giấu.
- Session sớm nhất sau #82?: birth **19:36:35Z** (mtime 20:10:35Z
  — waiter #2 của T8 chạy lại trên boot mới).
- **Không có file lệch ranh giới kiểu mù #50:** 0 file có mtime
  trong (btime +0 s, +10 s] và 0 file trong [btime −10 s, btime]
  ở #82? (xem §2.4). File cuối đoạn A là session 19:34:00Z
  (−15 s), file đầu đoạn B là 19:34:46Z (+31 s — dpkg configure).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #81?→#82? = **7.807 s (2h10'07")** — **CHỨNG NHẬN DẠNG
  KHOẢNG [7.797 s, 7.817 s]** (đoạn A mù #52 đóng + đoạn C mù #51
  đóng bằng uptime, xem §2.3 + §2.5). (Prereg ghi 6.445 s là SAI —
  đó là độ dài đoạn A của mù, không phải gap btime; xem §4 mục 1.)
- Gap #80?→#81? = **8.558 s (2h22'38")** — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #51 mở, tối đa 3 ẩn, kiểm lại lần thứ ba không đổi —
  xem §2.3 + §2.6).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):**
  #82? từ #81? dự kiến [17:57:00Z, 19:54:40Z] (p10–p90 FULL60:
  p10 0h32'53" = 1.973 s, p90 2h30'32" = 9.032 s; cộng từ btime
  #81? 17:24:08Z); thực tế **#82? 19:34:15Z NẰM TRONG dải** (lần
  thứ mười hai liên tiếp trong dải). (Prereg ghi [18:19:43Z,
  20:16:42Z] là SAI — cộng nhầm từ giờ probe #51 17:46:50Z thay vì
  btime #81?; code cho [17:57:00Z, 19:54:40Z] — chênh 1 s so với
  phép cộng tay 17:57:01Z do p10 float bị cắt khi đổi sang
  datetime, không đổi verdict.)
- Dải cơ học cho #83? từ #82? (p10–p90 FULL61): [20:07:15Z,
  22:01:22Z]; hiệu dụng sau probe #52: [20:42:56Z, 22:01:22Z].
- **#70 tới sớm hơn cả cận dưới p10 (đợt 125):** dải từ #69 là
  [21:11:16Z, 23:29:41Z]; #70 thật 20:54:19Z — ghi nhận đợt 125,
  không đổi lượt này.

**Reboot #81?→#82? — CHỈ GHI NHẬN giờ + bracket replay:**
- #82? xảy ra GIỮA LUỘT đợt 132 (lần thứ bảy liên tiếp reboot rơi
  giữa lượt/quanh ranh giới đợt theo cách đếm của cờ đợt 132/T7-132
  — T4 đang chờ gate A lần thứ 6 thì bị giết; T5 mất timer chờ).
- **Số thứ tự TẠM THỜI** (như #69/#70/#71/#72/#73/#74/#75/#76/#77/
  #78?/#79?/#80?/#81?; chuỗi tương đối #57→#81 đã chốt theo T6-132,
  T6-133 chốt tiếp).
- Tuổi thọ boot #81?: 17:24:08Z → 19:34:15Z = **7.807 s (2h10'07")**
  (chết trong khung (19:33:56Z, 19:34:15Z] theo đĩa — xem dưới;
  hoặc (19:34:00Z, 19:34:15Z] theo session — ghi cả hai, khung hẹp
  nhất làm chuẩn). Tuổi thọ boot gần đây cập nhật: #74?
  2h18'27", #75? 1h48'41", #76? 1h54'19", #77? 2h06'10", #78?
  1h24'00", #79? 34'49", #80? 2h22'38", #81? 2h10'07".

### 2.3 Hoạt động trong khoảng mù — A đóng, B đóng (ĐÓNG HOÀN TOÀN)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **10 file** +
hidden_files **301 file**; **311 file, 302 mốc float phân biệt /
206 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3 — "mốc" là mtime
float phân biệt, không phải giây tròn).
Ngoài hai cây: **92 file** (agents — exec-log/tool-output chiếm đa
số + stage files + system/memory; chi tiết xem
blind52-outside.txt); **/tmp: 669 file** trong mù #52 (622 file
node-compile-cache từ suite T10 20:16–20:20Z + 22 file out của
test-preview-engine.sh + còn lại rải rác; xem blind52-tmp.txt).
Gộp cả 4 phạm vi: **276 mốc giây phân biệt** (275 trong hai đoạn +
1 mốc đúng tại B0 17:46:50Z — 6 file T2-132 ghi lúc probe #51,
float 17:46:50.xxx, bị loại khỏi đoạn A vì đoạn A mở ở (B0, …]
theo giây tròn; xem §2.4). Chia mù làm hai
đoạn bởi #82? (19:34:15Z):

- **Đoạn A: 17:46:50Z → 19:34:15Z (1h47'25" = 6.445 s, boot #81?
  b379ecd7) — ĐÓNG (merged 4 phạm vi; hai cây riêng có lỗ đuôi
  lớn — xem phân tích dưới):**
  - **150 mốc** (hai cây), lỗ lớn nhất hai cây **2.934 s**
    (18:45:21Z → 19:34:15Z — chính là đuôi A); lỗ lớn thứ hai
    chỉ 384 s. Mốc đầu 17:46:50Z (head 0 s — chính probe #51);
    mốc cuối hai cây **18:45:21Z** (đuôi hai cây **2.934 s** >
    sàn 1.147 s). **43 session** chạm đoạn A.
  - **Merged 4 phạm vi mới là phán quyết (xem §2.4): 162 mốc,
    lỗ lớn nhất chỉ 419 s** (18:48:31Z → 18:55:30Z), floor=0 →
    **ĐÓNG, tối đa 0 ẩn**. Mốc cuối gộp **19:34:00Z** (đuôi gộp
    **15 s** << sàn).
  - **Vì sao hai cây im 2.934 s mà máy vẫn sống — giải thích bằng
    chứng (mới, quan trọng cho phương pháp):** mtime là thời gian
    ghi CUỐI. File nào còn được ghi lại ở đoạn B (vd poll-t4.log
    của T4 — mtime cuối 20:11Z) thì mốc đoạn A của nó bị "nuốt"
    vào đoạn B; hai cây chỉ giữ lại file nào KHÔNG bị ghi lại sau
    18:45:21Z. Trong khi đó exec-log ngoài cây là file theo phiên
    (mỗi session một file, kết thúc ở đoạn A thì giữ nguyên mtime
    đoạn A): **11 session chạm đuôi A** (mtime 19:15:56Z,
    19:19:05Z, 19:20:12Z, 19:21:19Z, 19:26:05Z, 19:28:16Z,
    19:29:28Z, 19:30:36Z, 19:31:45Z, 19:31:56Z, 19:34:00Z) +
    **3 session bắc qua cắt A-hi (19:15:08Z)** — trong đó session
    proc_100af6842157.log (birth 17:41:59Z, mtime 19:34:00Z) bắc
    qua CẢ A-lo lẫn A-hi. **4 session bắc qua cắt A-lo
    (18:05:57Z).** Đuôi A trên đĩa ngoài cây dày đặc, không có
    khoảng trống nào > 348 s sau 18:55:30Z.
  - Cửa sổ sàn [A-lo=18:05:57Z, A-hi=19:15:08Z] có mốc dày đặc ở
    cả 4 phạm vi (T2-132 viết LIMITS tới ~18:09Z, T5 watcher b81
    poll tới 17:58Z, T4 gate-A poll + T8 waiter #2 chạy tới khi
    reboot giết).
  - Quan sát cuối đoạn A: session exec-log 19:34:00Z (T4/T5 —
    phiên dài từ 17:41:59Z) + mốc gộp cuối 19:34:00Z. Sau 19:34:00Z
    máy yên 15 s tới reboot #82? (đuôi gộp 15 s — << sàn).
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn** (lỗ lớn nhất gộp
    419 s < sàn; hai cây riêng không phải phán quyết cuối — tiền
    lệ merged quyết định ở T2-132 §2.4).
- **Đoạn B: 19:34:15Z → 20:42:56Z (1h08'41" = 4.121 s, boot #82?
  07da9c50) — ĐÓNG bằng đo uptime trực tiếp + probe #52 + luật lỗ:**
  - **`uptime -s` lúc 20:40:52Z = 19:34:15Z** chứng minh máy up
    liên tục từ #82? tới lúc đo; probe #52 20:42:56Z đọc boot_id
    07da9c50 tươi — cùng boot_id với boot bắt đầu 19:34:15Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C, T2-132 §2.3 đoạn C.)
  - **152 mốc** (hai cây), lỗ lớn nhất **675 s** (19:48:04Z →
    19:59:19Z), các lỗ còn lại đều < 675 s. Mốc đầu 19:36:28Z
    (head 134 s — T8 waiter chạy lại trên boot mới); mốc cuối
    **20:42:53Z** (đuôi **2 s** < sàn). **16 session** chạm đoạn B,
    **1 session** chạm đuôi B (birth 20:40:20Z — phiên T2 này).
  - **Merged 4 phạm vi: 113 mốc, lỗ lớn nhất 469 s** (20:00:40Z →
    20:08:29Z), floor=0 → **ĐÓNG cả theo luật lỗ** (không chỉ
    uptime). Mốc đầu gộp 19:34:46Z (head 31 s — dpkg configure),
    mốc cuối gộp 20:42:53Z (đuôi 3 s).
  - **0 session bắc qua cắt B-hi (20:23:49Z)** — không cần vì
    uptime là closer + luật lỗ đã đủ (lỗ lớn nhất gộp 469 s <
    sàn). **3 session bắc qua cắt B-lo (19:53:22Z)** (trong đó
    waiter #2 của T8 birth 19:36:35Z mtime 20:10:35Z).
  - Đuôi B (20:23:49Z, 20:42:56Z] dày đặc ở cả 4 phạm vi: repo-1
    **2** (GAP_ANALYSIS.md 20:28:30Z, LIMITS gộp 132 20:34:49Z),
    hidden_files **20** (t10-closing-sha256.txt + closing-copy
    20:28:41Z, t10.done 20:29:04Z, round-in-progress.md 20:36:41Z,
    file T9/T6/T1/T2 đợt 133 20:40–20:42Z), ngoài cây **2**
    (paths-loop closing 20:28:41Z, exec-log 20:40:20Z), /tmp **0**
    (xem blind52-sessions.log).
  - **Kết luận đoạn B: ĐÓNG.**

**Kết luận trung thực: khoảng mù #52 ĐÓNG HOÀN TOÀN.**
Đoạn A đóng (merged), đoạn B đóng (uptime + luật lỗ).
1 reboot đã chốt giờ (#82? 19:34:15Z — chính xác từng giây trên đĩa)
+ **tối đa 0 ẩn**. Chuỗi mù đóng hoàn toàn nối lại sau đúng một mù
hở (#51, đợt 132); đây là mù đóng hoàn toàn thứ hai trong ba mù
gần nhất (#50 đóng, #51 hở, #52 đóng).

Ngoài hai cây: **92 file** có mtime trong mù #52 (agents —
exec-log/tool-output chiếm đa số + stage files đợt 132 + system/
memory; chi tiết xem blind52-outside.txt); **/tmp: 669 file** trong
mù #52 (622 node-compile-cache + 22 test-preview-engine out +
còn lại; xem blind52-tmp.txt). Boot_id nhắc trong
exec-log sinh/viết trong mù: b379ecd7 6 file, 07da9c50 6 file (phiên
T2 này nằm trong số đó).

### 2.4 Gộp 4 phạm vi + 2 phát hiện mới (phương pháp nối tiếp T2-132 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind52-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 162 mốc, lỗ lớn nhất **419 s** (18:48:31Z →
  18:55:30Z), floor=0 → **ĐÓNG** (khớp verdict hai cây về mặt
  "đóng" nhưng lỗ quyết định khác hẳn: hai cây 2.934 s — ngoài
  cây + /tmp chẻ lỗ đuôi hai cây nhờ 11 session chạm đuôi A;
  không đổi verdict nhưng đổi bằng chứng).
- Đoạn B gộp: 113 mốc, lỗ lớn nhất **469 s** (20:00:40Z →
  20:08:29Z), floor=0; lỗ lớn thứ hai 450 s, thứ ba 355 s →
  **ĐÓNG, tối đa 0 ẩn**.
- Tổng gộp 276 mốc giây = 275 trong hai đoạn + 1 mốc đúng tại B0
  (17:46:50Z — 6 file T2-132 ghi lúc probe #51, float
  17:46:50.xxx, bị loại khỏi đoạn A vì đoạn A mở ở (B0, …] theo
  giây tròn).
- Không có file nào trong `~/workspace/goals` ngoài hidden_files
  có mtime trong mù (kiểm bằng find riêng — vùng duy nhất hai
  lần quét chính không phủ, đã kiểm bổ sung, 0 file).

**Phát hiện 1 — Hai cây riêng "hở đuôi" nhưng merged đóng: mtime
ghi-đè-cuối làm hai cây thiếu mốc đoạn A (mới):** hai cây cho lỗ
đuôi A 2.934 s (18:45:21Z → 19:34:15Z) — nếu chỉ nhìn hai cây thì
đoạn A MỞ tối đa 2 ẩn. Nhưng 11 session ngoài cây chạm đuôi A với
mtime rải 19:15:56Z → 19:34:00Z (lỗ lớn nhất giữa các mốc ngoài cây
trong đuôi chỉ 348 s) chứng minh máy vẫn hoạt động — T4/T5/T8 vẫn
chạy poll/waiter tới sát reboot, chỉ là log của họ không nằm trong
hai cây (exec-log) hoặc bị ghi đè mtime sang đoạn B (poll-t4.log).
Bài học phương pháp: **mtime là thời gian ghi cuối, không phải lịch
sử hoạt động** — một file hoạt động ở cả hai đoạn chỉ để lại mốc ở
đoạn sau; phán quyết đóng/mở phải dựa vào merged 4 phạm vi (có
file-phiên kết thúc trong đoạn), không dựa vào hai cây riêng. Tiền
lệ: merged đã là phán quyết ở T2-132 §2.4 (ngoài cây chẻ lỗ lớn
nhất hai cây từ 96 s xuống 60 s) — lần này merged đảo verdict hai
cây từ MỞ thành ĐÓNG, trường hợp đầu tiên.

**Phát hiện 2 — Ranh giới #82? sạch, không có file lệch kiểu mù #50
(mới):** 0 file có mtime trong (btime +0 s, +10 s] và 0 file trong
[btime −10 s, btime] (kiểm bằng code trong blind52-merged.py).
File cuối đoạn A là session exec-log 19:34:00Z (−15 s) và file đầu
đoạn B là dpkg configure 19:34:46Z (+31 s). Khác mù #50 (4 file
T4-attempt3 ở 13:02:42Z, +1 s sau btime #78?, lệch đồng hồ cũ
~1 s): lần này không có bằng chứng lệch đồng hồ cũ nào ở ranh giới
— cận nhảy clock |X82?| < 15 s từ session (§2.2) là bằng chứng tốt
nhất, và F82? đo trực tiếp (±~1 s) là bằng chứng chính. Không đổi
verdict nào (đoạn A đóng cả khi tính lệch vài giây).

### 2.5 Phân phối gap — CERT n=45 → n=46 / FULL n=60 → n=61 (1 gap mới CHỨNG NHẬN DẠNG KHOẢNG)

**Gap #81?→#82? = [7.797 s, 7.817 s] (mid 7.807 s) CHỨNG NHẬN DẠNG
KHOẢNG (mới)** — đoạn A mù #52 đóng (merged, §2.3) + đoạn C mù #51
đóng bằng uptime (T2-132 §2.3). Biên ±10 s của T5 dùng nguyên văn;
mid không dịch chuyển (thực hành của T5). Caveat NHẸ HƠN các gap
khoảng trước: **F81? ≈ −1 s VÀ F82? ≈ −1 s đều đo trực tiếp** (xem
§2.2); cận nhảy clock tại #82? |X82?| < 15 s từ session (0 nhân
chứng nhảy, quan sát muộn nhất 19:34:00Z) — cận này lỏng hơn biên
±10 s nhưng F82? đo trực tiếp là bằng chứng chính, không phải cận
session. Tiền lệ: gap #72→#73 chứng nhận dạng khoảng đợt 128 trong
khi F73 cũng chưa từng đo; gap #75→#76 chứng nhận dạng khoảng đợt
130 trong khi F76 cũng chưa đo; gap #77→#78? chứng nhận dạng khoảng
đợt 131 trong khi F78 cũng chưa đo; gap #79?→#80? chứng nhận dạng
khoảng đợt 132 trong khi F80? cũng chưa đo — cả bốn đã được parent
chấp nhận. Không áp hint hướng nào.

**Gap #80?→#81? = 8.558 s (2h22'38") VẪN CHỈ LÀ SPAN** — đoạn B mù
#51 mở (tối đa 3 ẩn, kiểm lại lần thứ ba không đổi — xem §2.6).
**CERT/FULL không tính gap này.**

**Gap #79?→#80? = [2.079 s, 2.099 s] VẪN LÀ KHOẢNG** — đã chứng nhận
đợt 132 (đoạn A mù #51 đóng). Không đổi lượt này.

**Gap #78?→#79? = [5.030 s, 5.050 s] VẪN LÀ KHOẢNG** — đã chứng nhận
đợt 131 (đoạn B mù #50 đóng). Không đổi lượt này.

**Gap #77→#78? = [7.560 s, 7.580 s] VẪN LÀ KHOẢNG** — đã chứng nhận
đợt 131 (đoạn A mù #50 đóng). Không đổi lượt này.

**Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
#49 mở (T2-131 §2.3; KHÔNG kiểm lại lượt này theo quyết parent
đợt 132 §12.3(d) — xem §2.6). **CERT/FULL không tính gap này.**

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

**Cross-check tái hiện T2(132) 100%:** chạy blind51-gaps.py
verbatim cho lại đúng CERT n=45 / FULL n=60 của T2 đợt 132 (xem
blind52-gaps.txt: CERT45 mean 1h40'08" median 1h50'39" p10
0h33'00" p90 2h22'50" sd 0h42'52" min 0h19'07" max 3h14'08";
FULL60 mean 1h46'43" median 1h53'38" p10 0h32'53" p90 2h30'32"
sd 0h55'42" min 0h19'07" max 5h43'18"; in 90–150' = 32, <60' = 12,
>180' = 6, >240' = 2 — khớp T2-132 §2.5 từng số). Gap mới vào
(A đóng) nên cả CERT lẫn FULL đều +1.

- **CERT n=46 (mới):** mean 1h40'47" median 1h52'28" p10 0h33'18"
  p90 2h22'30" sd 0h42'37" min 0h19'07" max 3h14'08".
- **FULL n=61 (mới):** mean 1h47'06" median 1h54'16" p10 0h33'00"
  p90 2h27'07" sd 0h55'39" min 0h19'07" max 5h43'18"; in 90–150'
  = 33, <60' = 12, >180' = 6, >240' = 2.
- Độ nhạy biên LO/HI của gap mới: CERT46 mean chỉ dao động ±1 s
  (1h40'46"–1h40'47"), FULL61 mean không đổi (1h47'06" cả hai
  biên) — biên ±10 s không làm lệch phân phối.
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới 7.807 s
  = 2h10'07" nằm trong dải; gap #80?→#81? 8.558 s cũng nằm trong dải
  nhưng chưa chứng nhận nên không vào).
- **Tốc độ reboot (đồng hồ ghi nhận):** 82 / 167,27 h = **1 reboot
  mỗi 122,4 phút** (từ #1 2026-11-10T20:18:10Z tới #82?
  2026-11-17T19:34:15Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 86 / 167,27 h = **1 mỗi 116,7 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn G1 (+4), mù #46
  đoạn A (+4), mù #48 đoạn A (+2), mù #49 đoạn B (+1) và mù #51
  đoạn B (+3). Mù #50: **+0** (đóng hoàn toàn). Mù #52: **+0**
  (đóng hoàn toàn — mới).
- **#81? vào dải cơ học (xem §2.2):** lần thứ mười một liên tiếp
  trong dải (ghi nhận T2-132). **#82? vào dải cơ học:** lần thứ
  mười hai liên tiếp trong dải.

### 2.6 Mù #51 đoạn B kiểm lại trên đĩa hiện tại — VERDICT KHÔNG ĐỔI (lần thứ ba) + mù #49 B KHÔNG kiểm lại (quyết parent)

Theo brief đợt 133 (kiểm lại mù #51 B nếu có bằng chứng mới), T2
chạy lại code tính gộp blind#51 trên đĩa hiện tại (không chỉ đọc
lại snapshot đóng băng đợt 132) để xác nhận verdict trong hồ sơ
vẫn đúng — xem blind51-recheck3.py / blind51-recheck3.log (chạy
lại cả investigate + sessions + merged cho cửa sổ mù #51):
- Số file có mtime trong cửa sổ #51 lúc kiểm lại: repo-1 **10**
  (đợt 132: 12 — giảm 2 do ghi đè/xóa), hidden_files **309** (đợt
  132: 339 — giảm 30; riêng mốc giây hidden_files 183 so với 203), ngoài cây
  **44** (đợt 132: 48 — giảm 4), /tmp **0** (đợt 132: 1 — giảm 1).
  Tổng mốc gộp **222** (đợt 132: 246 — giảm 24 do file rời cửa sổ;
  riêng mốc giây hidden_files 183 so với 203, repo-1 10 so với 12,
  ngoài cây 41 so với 43, /tmp 0 so với 1).
- **Các lỗ quyết định KHÔNG ĐỔI:**
  - Đoạn A gộp: lỗ lớn nhất **60 s** (14:54:11Z → 14:55:11Z) —
    **ĐÓNG**, đúng số T2-132.
  - Đoạn B gộp: lỗ lớn nhất **4.393 s** (16:10:55Z → 17:24:08Z) —
    **MỞ, tối đa 3 ẩn**, đúng số T2-132; lỗ lớn thứ hai 403 s
    (đợt 132: 383 s — tăng 20 s do mốc 16:06:11Z rời cửa sổ vì
    GAP_ANALYSIS.md bị viết lại lúc T10-132 đóng đợt, mtime nay
    20:28:30Z), thứ ba 279 s (đúng số). 0 session chạm đuôi B, 0 file trong
    đuôi B ở cả 4 phạm vi.
  - Đoạn C gộp: lỗ lớn nhất **710 s** (17:24:08Z → 17:35:58Z)
    — **vẫn ĐÓNG bằng uptime** (đợt 132 là 689 s; +21 s do mốc
    17:35:37Z rời cửa sổ vì system_prompt.md bị viết lại lúc mở
    đợt 133 — mốc đầu đoạn C dời sang 17:35:58Z; vẫn < sàn, không
    đổi verdict).
  - Ranh giới #80?/#81? vẫn sạch: 0 file trong (btime, +10 s];
    mốc −8 s (rebuild-fixtures 15:01:22Z) và −6 s (session
    15:01:24Z) vẫn nguyên.
- **Kết luận: mù #51 KHÔNG ĐÓNG HOÀN TOÀN — không đổi** (A đóng,
  B mở tối đa 3 ẩn, C đóng). Gap #80?→#81? = 8.558 s **giữ SPAN**.
  Không giao luồng sau kiểm lại B mù #51 (tiền lệ quyết đợt 126
  §12(h) + quyết đợt 130 §12.3(e)) — chờ bằng chứng ngoài VM.
  Đây là lần kiểm lại thứ ba cho cùng verdict (đợt 131, 132, 133)
  — hồ sơ mù #51 B đã ổn định.
- **Mù #49 B: KHÔNG kiểm lại đợt này.** Quyết parent đợt 132
  §12.3(d) đã phê duyệt bỏ mục kiểm lại thường lệ khỏi brief T2;
  chỉ kiểm lại khi có bằng chứng mới cụ thể. T2 đợt này không thấy
  bằng chứng mới nào về mù #49 B (không file/session nào chạm cửa
  sổ #49 trong lúc làm việc; không chạy recheck mù #49 B). Gap
  #76→#77 = 6.859 s giữ SPAN. Ghi rõ đã bỏ mục này theo quyết parent.
- Lưu ý kỹ thuật (mới): script blind51-recheck3-sessions.py lỗi
  FileNotFoundError ở bước in cuối (tham chiếu blind51-repo-1.txt
  chưa đổi tên sang blind51-recheck3-repo-1.txt) — các số ngoài
  cây + /tmp + session đã in đủ trước khi lỗi; số quyết định
  (merged B 4.393 s) lấy từ blind51-recheck3.py chạy exit 0 sau đó.
  Không dùng số nào từ phần lỗi (phần lỗi không in số nào).

### 2.7 Quét writeFileSync lần thứ 39 — chênh 0 (lần thứ 39 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round133-t2, đã đổi OUT sang
  round133-t2) **20:59:52Z → 21:00:07Z 17/11 (15 s, có SCAN-END)**.
  Scan chạy trên boot #82?, SAU khi mù #52 đã đóng bằng probe #52
  (20:42:56Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **887 dòng / 247 file** (phạm vi 3.094 file); R7b đối
  chiếu: **912 dòng / 264 file** (phạm vi 12.487 file); copies:
  **25 dòng / 17 file** — y hệt lần 38 về copies. Đối chiếu chéo:
  887+25=912=R7b, **chênh 0**.
- **+4 dòng / +1 file so với lần 38** (883/246 → 887/247), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND132_T2_EPERM_LIMITS.md | +4 (0 → 4) | 18:08:54Z 17/11 | Tài liệu T2 đợt 132 (nhắc `writeFileSync` 4 lần); viết SAU scan lần 38 (17:56:04–17:56:24Z 17/11) nên lần này mới vào |
- Phạm vi: 3.094 = 3.085 + 9 net (**9 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 9 file mới gồm 6 LIMITS đợt
  132 (gộp + T2/T4/T5/T5B/T8, viết sau scan lần 38) + 3 LIMITS đợt
  133 (T1/T7/T9, viết trước scan 21:00Z); 0 file mất).
  Copies y hệt lần 38 (diff 0 dòng).
- **Kết luận: 39 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #52.

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
  né EPERM trong mù #52.

## 3. RAM trong mù #52 — max 3.111 MB (50,7% guard), birefnet KHÔNG chạy

- **1 mẫu MemAvailable trực tiếp của lượt (đo trực tiếp, trong
  đoạn B):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 20:40:52Z | **465.304 kB** | Trước probe #52 (boot #82?) |
- **Max RAM biết được TRONG mù #52 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 305 mẫu RAM; **max 3.111 MB**
  (T5 watcher b81 poll 5, 17:51:35Z, đoạn A — đã xác minh trực
  tiếp dòng log; cùng giá trị xuất hiện 2 lần do file .log +
  .nohup.log trùng nội dung) = **50,7% ngưỡng guard** — thấp hơn
  max 3.145 MB mù #51 và thấp hơn max kỷ lục 4.576 MB mù #42;
  đoạn A max **3.111 MB**; đoạn B max **1.424 MB** (19:36:47Z,
  T5 watcher b83 — RAM vọt lên ngay sau boot mới rồi rơi nhanh).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 3.111 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T2 đợt 132)

1. **Prereg có 2 SAI SỐ SỐ HỌC — ghi rõ, không giấu (mới, §0):**
   (a) Prereg §2 ghi gap #81?→#82? = 6.445 s — SAI: 6.445 s là độ
   dài đoạn A của mù (probe #51 → btime #82?), không phải gap
   btime. Gap btime đúng = 19:34:15Z − 17:24:08Z = **7.807 s**
   (code tính, blind52-investigate.log + blind52-gaps.txt).
   (b) Prereg §2 ghi dải cơ học cho #82? là [18:19:43Z,
   20:16:42Z] — SAI: cộng p10/p90 FULL60 từ giờ probe #51
   (17:46:50Z) thay vì btime #81? (17:24:08Z). Dải đúng theo code:
   **[17:57:00Z, 19:54:40Z]** (chênh 1 s so với phép cộng tay
   17:57:01Z do p10 float bị cắt — cùng mẫu T2-132 §4 mục 1).
   Cả hai sai số đều là nhầm mốc cộng trong prereg (viết tay trước
   khi chạy code); **verdict không đổi** (#82? 19:34:15Z vẫn nằm
   trong dải đúng với biên lớn; gap vẫn chứng nhận dạng khoảng
   [7.797 s, 7.817 s]). Bài học: prereg chỉ ghi số gap/dải sau khi
   đã chạy code tính — hoặc ghi rõ "chưa tính bằng code, kiểm lại
   sau". (Tiền lệ: T2-129 §4 mục 2 đã dặn không nhẩm số gap trong
   prereg — lần này vẫn nhẩm sai; ghi nhận để đợt sau khỏi lặp.)
2. **Prereg dự báo RAM sai (mới, §0):** prereg §4 dự báo đoạn A
   max ~1.000–1.700 MB, đoạn B max ~1.234 MB. Thực tế: A **3.111 MB**
   (17:51:35Z — đầu đoạn A, RAM còn cao trước khi replay/balloon
   kéo xuống), B **1.424 MB**. Dự báo sai vì chỉ nhìn RAM cuối
   đợt 132 (thấp) mà quên đầu mù RAM còn cao (T5 watcher b81 poll
   5). Không đổi verdict nào (vẫn < guard 6 GB); ghi rõ để luồng
   sau khỏi tưởng RAM trong mù luôn thấp.
3. **Hai cây riêng không phải phán quyết cuối — merged 4 phạm vi
   mới là phán quyết (mới, §2.3–§2.4):** đoạn A hai cây cho lỗ đuôi
   2.934 s > sàn (tưởng MỞ, tối đa 2 ẩn) nhưng merged cho lỗ lớn
   nhất 419 s (ĐÓNG, 0 ẩn). Nguyên nhân: mtime là thời gian ghi
   cuối — file hoạt động ở cả hai đoạn chỉ để lại mốc ở đoạn sau
   (poll-t4.log mtime cuối 20:11Z). Phán quyết đóng/mở từ nay phải
   nêu rõ "merged" khi hai cây và merged khác nhau — không được
   kết luận MỞ chỉ từ hai cây khi ngoài cây còn session chạm đuôi.
   Tiền lệ merged quyết định đã có (T2-132 §2.4) nhưng đây là lần
   đầu merged ĐẢO verdict hai cây.
4. **Khung chết #81? hai bản ghi hẹp (mới, §2.2):** đĩa + 4 nguồn
   T4/T5/T5b/T8: (19:33:56Z, 19:34:15Z] (19 s); session của T2 thu
   hẹp thêm: (19:34:00Z, 19:34:15Z] (15 s — mốc session cuối
   19:34:00Z). Ghi cả hai, khung hẹp nhất làm chuẩn (tiền lệ
   F-130-6, quyết parent đợt 130 §12.3(f) + đợt 131 §12.3(c) +
   đợt 132 §12.3(c)). T2 không tự chốt một chuẩn duy nhất.
5. **Lỗi adapt script — đã bắt trước khi chạy (mới):** bản adapt
   v1 (heredoc) lỗi SyntaxError do đóng chuỗi `'''` thiếu — KHÔNG
   chạy, file copy vẫn nguyên bản; viết lại adapt52.py bằng file
   (v2) với thay thế cả khối (SEG, floor, CUTS) TRƯỚC mọi thay thế
   thời gian — tránh lỗi ánh xạ đoạn rỗng (đoạn B cũ (15:01:30Z,
   17:24:08Z) ánh xạ thành (19:34:15Z, 19:34:15Z) nếu thay thời
   gian trước). Đã kiểm bằng grep B0/B1/SEGS + py_compile trước khi
   chạy. Bài học: khi adapt script bằng thay thế hàng loạt, thay
   cả khối hằng số trước, thay chuỗi thời gian sau — như đã làm
   với blind52 scripts viết tay (không lỗi).
6. **ram-max52.py SEGS stale — đã sửa trước khi chạy (mới):** bản
   copy từ ram-max51.py vẫn giữ ranh giới đoạn mù #51
   (14:46:56Z/15:01:30Z/17:24:08Z) nên lần chạy đầu in "seg A/B/C:
   no RAM samples" (đúng là không có mẫu nào trong cửa sổ cũ — cửa
   sổ cũ nằm ngoài mù #52). Phát hiện bằng đọc output; sửa SEGS
   thành A=[17:46:50Z, 19:34:15Z], B=[19:34:15Z, 20:42:56Z] rồi
   chạy lại exit 0 (A max 3.111 MB, B max 1.424 MB). Danh sách
   top-15 của lần chạy lỗi vẫn đúng (bộ lọc cửa sổ B0/B1 đã đúng)
   nhưng số theo đoạn lấy từ lần chạy lại. Bài học: sau khi adapt
   bằng regex B0/B1, grep cả SEGS/CUTS/zones — không chỉ B0/B1.
7. **eperm-sweep52.py docstring kế thừa lỗi typo của T2-132 (mới):**
   docstring ghi "(17:46:50Z -> 17:46:50Z 17/11)" — di chứng lỗi
   sed đúp của T2-132 §4 mục 6 (bản gốc eperm-sweep51.py cũng ghi
   vậy). Chỉ là chữ trong docstring; hằng số code B0/B1 đã kiểm
   bằng grep trước khi chạy (17:46:50Z → 20:42:56Z đúng). Không sửa
   docstring đợt này để khỏi chạm code đã chạy — ghi nhận để đợt
   sau sửa cùng lúc adapt.
8. **blind52-investigate.py nhãn in còn "blind#51" (mới, cosmetic):**
   các dòng in "repo-1 files with mtime in blind#51" — chuỗi
   "blind#51" (có dấu #) không khớp phép thay "blind51"→"blind52"
   trong adapt. Số đếm là của cửa sổ mù #52 (B0/B1 đã kiểm). Không
   ảnh hưởng số liệu; sửa nhãn ở đợt sau.
9. **Kiểm lại boot TRƯỚC (20:40Z), LÚC probe (20:42:56Z) và SAU
   khi đo xong (21:03:56Z):** cả ba lần cùng boot 07da9c50
   (#82?) — **KHÔNG có reboot giữa phiên T2 lượt này** (xem §2.1
   cuối). Probe #52 và mù #52 KHÔNG bị ảnh hưởng bởi reboot nào
   trong phiên; mù #53 mở từ probe #52 — việc của T2 đợt 134.
10. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
    (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
    model đóng/nhạc bản quyền.**
11. **Không quét toàn workspace lượt này:** chỉ dùng góc hẹp/mục
    tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ repo-1/goals
    + /tmp + exec-logs + kiểm bổ sung goals-ngoài-hidden_files).
12. **Stage batch:** chỉ 1 file text (LIMITS doc này),
    NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
    checkpoint + stage file).
13. **Ghi rõ:** số thứ tự reboot #48–#82? vẫn TẠM THỜI (T6-132
    chốt chuỗi tương đối #57→#81, số tuyệt đối vẫn tạm; T6-133
    chốt tiếp); giá trị gap không phụ thuộc số thứ tự.
14. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F81?/F82? đều đo trực tiếp + cận
    nhảy clock |X82?| < 15 s vào hồ sơ (xem §2.2 + §2.5).
15. **Cross-check tái hiện T2(132) 100%** (CERT n=45 / FULL n=60)
    trước khi kết luận số mới — chạy blind51-gaps.py verbatim
    qua exec trong blind52-gaps.py (xem blind52-gaps.txt). Không
    dùng số nào từ lần chạy lỗi (lần chạy lỗi là ram-max52 SEGS
    stale ở mục 6 — đã sửa trước khi chạy lại exit 0).
16. **md5 preview.tsx KHÔNG ĐỔI trong đợt 133 (ghi nhận):**
    preview.tsx 805409f0, media.ts không đổi 2c384ed1,
    vite.config.ts ee80d093. T2 không sửa production file nào.
17. **Các luồng đợt 133 khác đang chạy lúc T2 đóng** — T2 chỉ ghi
    nhận trạng thái (T1/T7/T9 đã có LIMITS trên đĩa; các luồng
    khác đang chạy), không phụ thuộc kết quả các luồng đó. Verdict
    mù #52 là của riêng T2, tính bằng code riêng.
18. **T2 KHÔNG mở Xvfb** (luồng probe không cần browser) nên
    không có Xvfb nào để kill — luật đứng đợt 127 §12.1.3 (mỗi
    driver tự kill Xvfb của mình) không phát sinh việc lượt này.
19. **Replay #82? đã xong theo T5b-132 (mới, §2.1):**
    1.545 dòng / 221 installs, gstreamer1.0-gl đã cài bởi replay
    (19:35:28Z) — snapshot của T2 chỉ là xác nhận lại bracket;
    T5b là chủ quản replay, T2 chỉ ghi bracket. Replay #81? đầy
    đủ thuộc về T5-132 (1.551 dòng / 222 installs + --repair).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #52: ĐÓNG HOÀN TOÀN (mới — xem §2.3).** Đoạn A đóng
   (merged), đoạn B đóng (uptime + luật lỗ). 1 reboot đã chốt giờ
   (#82? 19:34:15Z) + tối đa 0 ẩn. Gap #81?→#82? chứng nhận dạng
   khoảng [7.797 s, 7.817 s]; gap #80?→#81? = 8.558 s giữ SPAN.
   **CERT n=46 / FULL n=61 (mới).**
2. **Mù #53 MỚI MỞ (từ probe #52 20:42:56Z) — việc của lượt sau:**
   probe #53 + điều tra đoạn từ #82? ở đợt 134. Dải cơ học cho
   #83? (p10–p90 FULL61): [20:07:15Z, 22:01:22Z]; hiệu dụng sau
   probe #52: [20:42:56Z, 22:01:22Z].
3. **Gap #80?→#81? = 8.558 s VẪN CHỈ LÀ SPAN (mới — kiểm lại lần
   thứ ba, xem §2.6).** Đoạn B mù #51 vẫn mở tối đa 3 ẩn; cần bằng
   chứng ngoài đĩa mới đóng được. Gap #76→#77 = 6.859 s giữ SPAN
   (mù #49 B không kiểm lại thường lệ nữa theo quyết parent đợt
   132 §12.3(d)).
4. **Khung chết #81? hai bản ghi** (T4/T5/T5b/T8 + đĩa
   (19:33:56Z, 19:34:15Z] vs session T2 (19:34:00Z, 19:34:15Z]) —
   T2 ghi cả hai, khung hẹp nhất làm chuẩn (tiền lệ quyết parent
   đợt 130 §12.3(f) / 131 §12.3(c) / 132 §12.3(c)).
5. **Số boot vẫn tạm (giữ "?")** — chuỗi tương đối #57→#81 đã chốt
   theo T6-132, T6-133 chốt tiếp (mù #52 đóng hoàn toàn, 0 ẩn —
   không thêm ẩn danh nghĩa nào vào chuỗi).
6. **EPERM vẫn KHÔNG được tuyên bố là đã hết** — sóng gần nhất
   ~11:55–12:11Z 11/11 (~152h48' trước probe #52); 0 sóng thật
   trong mù #52. Probe thường lệ tiếp tục đợt sau.
7. **Headroom / RAM / birefnet:** T9-133 chủ quản; T2 chỉ ghi RAM
   trong mù (max 3.111 MB, 50,7% guard). Birefnet chỉ thử lại khi
   quan sát được available ≥ 6 GB; u2net là fallback chính thức.
   **TTS 39 cấm kiểm lại.** **ci-security.yml vẫn 403 chờ user.**
   **Release gate không đổi** (không release/tag cho đến khi ngang
   hoặc hơn CapCut thật). **KHÔNG push khi user chưa nhắn "push đi".**
8. **Lượt yên WebKit #10 + T3 bước 2 + T5 pha 2:** T4/T3/T5 đợt 133
   chủ quản (cơ chế chờ RAM theo quyết parent đợt 132 §12.3(a));
   T2 không phụ thuộc kết quả các luồng đó.
9. **R9 (a): VẪN CHỜ user (nhắc lần 16 — KHÔNG tăng số đếm).**
   Không thay đổi, không hỏi lại user.
10. **G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã hỏi
    13:44 16/11, chưa trả lời). Không thay đổi.
