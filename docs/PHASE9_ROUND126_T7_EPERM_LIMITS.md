# PHASE9 ROUND126 T7 — EPERM: probe #45 + mù #45 (F ĐÓNG, G1 MỞ, G2 ĐÓNG) + mù #44 D KIỂM SÂU 1 LẦN VẪN MỞ → ĐỂ MỞ + gap #69→#70 CHỨNG NHẬN DẠNG ĐIỂM + WFS lần 32 chênh 0 + RAM max 2.240 MB

> Luồng T7, đợt 126 vòng lặp Phase 9 VCut Studio (lượt cron 06:35 +07,
> 17/11/2026; làm việc 23:41Z 16/11 → 00:0xZ 17/11/2026).
> Nhiệm vụ: probe #45 + mù #44 đoạn D kiểm sâu MỘT LẦN DUY NHẤT (góc mới)
> + mù #45 mô tả ban đầu + boot #71 ghi nhận + EPERM sweep + WFS lần 32
> + RAM (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard + quyết parent
> §12.7, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round126-t7/prereg-t7.md (định nghĩa probe #45, mốc đối
> chiếu, dự báo F ĐÓNG bằng độ dài < sàn / G1 KHÔNG ĐÓNG ĐƯỢC / G2 ĐÓNG /
> gap #69→#70 chứng nhận dạng điểm / gap #70→#71 SPAN + dự báo EPERM
> 0 sóng + WFS chênh 0 + RAM max < 4.576 MB).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #42 đoạn B / mù #43
> và mù #40 B** (quyết parent đợt 124 §12.3 + §12.4: CHẤP NHẬN ĐỂ MỞ —
> xem §5 mục 1). G1 + mù #22/#28/#29/#30/#31/#35/#37/#38 đoạn G chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (23:42:06Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.623 s, last #44 20:45:03Z, boot
  670c07f6, exit 1); `once` ngay sau đó là **probe #45, boot
  ff7afbbb, ok=2 fail=0**, exit 0, 23:42:06Z; `status` chạy lại
  **ALIVE** (age 2 s, n=45), exit 0. Log v2 tăng đúng **3 dòng**
  (124 → 127) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=45, ts 23:42:06Z, boot ff7afbbb.
- **Boot #71 (tạm) lúc 23:25:41Z, boot
  `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`** — xác minh bằng `uptime -s`
  + btime 1794871541 + `who -b` + journal 1 boot (xem §1). Clock VM hiện tại CHÍNH
  XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u`
  trong 0–2 s) → **F71 ≈ 0**.
- **Khoảng mù #45 (MỚI): 20:45:03Z → 23:42:06Z (2h57'03") — KHÔNG ĐÓNG
  HOÀN TOÀN (F đóng, G1 mở, G2 đóng; tối đa 4 ẩn).** Đoạn F **ĐÓNG**
  (556 s < sàn 1.147 s — đóng bằng độ dài, 104 mốc, tail 3 s); đoạn G1
  **MỞ** (đuôi 4.710 s sau mốc cuối 22:07:10Z, 0 session bắc qua cắt
  G1-hi, 0 file trong đuôi ở cả 4 phạm vi); đoạn G2 **ĐÓNG** (uptime
  trực tiếp lúc probe #45 + dấu boot tươi). **2 reboot đã chốt trong
  mù (#70 20:54:19Z — đã biết từ đợt 125; #71 23:25:41Z — mới, chính
  xác từng giây trên đĩa) + tối đa 4 ẩn danh nghĩa trong đuôi đoạn G1.**
- **Gap #69→#70 = 1.148 s (19'08") CHỨNG NHẬN DẠNG ĐIỂM — MỚI.**
  Đoạn F đóng bằng độ dài < sàn + F69 ≈ 0 + F70 ≈ 0 + cận nhảy tại #70
  |X| ≲ 6 s (xem §2.5). **CERT n=38 → 39, FULL n=53 → 54** (tái hiện
  100% bằng blind42-gaps.py verbatim + thêm gap mới — xem §2.5).
  Đây là gap chứng nhận ngắn nhất từ trước tới nay (chỉ hơn sàn 1 s).
- **Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN — KHÔNG chứng
  nhận được (mới, mù #45, đoạn G1 mở, xem §2.5).** Đoạn G1 mở, đuôi
  4.710 s, tối đa 4 ẩn. Còn thiếu gì để chứng nhận: đúng 1 quan sát
  trong đuôi sau cắt G1-hi 23:06:34Z (xem §2.6).
- **Mù #44 đoạn D: VẪN MỞ sau kiểm sâu MỘT LẦN DUY NHẤT với 5 góc
  mới (xem §2.4) — 0 quan sát mới thật.** Góc mới: (a) birth time
  trong đuôi D: 0 file (2 cây + /tmp + TOÀN HOME); (b) mtime đuôi D
  trên TOÀN HOME: 1 file = chính file mốc cuối (không phải quan sát
  mới); (c) ctime đuôi D: cùng 1 file mốc cuối, 0 nơi khác;
  (d) .git trong home: 0 thư mục (repo-1 không có .git); (e) nội dung
  log: 11 hit, TẤT CẢ đều tự tham chiếu (output điều tra đợt 125 nhắc
  lại giờ đuôi + 1 dòng nhắc btime #69), 0 quan sát mới thật.
  **→ ĐỂ MỞ theo quyết parent đợt 125 §12(h). KHÔNG kiểm lại nữa,
  KHÔNG giao kiểm lại vòng sau.** Gap #68→#69 giữ SPAN.
- **#71 tới TRONG dải cơ học:** dải từ #70 là [21:30:24Z, 23:48:49Z]
  (p10–p90 FULL53); #71 thật 23:25:41Z nằm trong dải — lần đầu sau 2
  lần ngoài dải liên tiếp (#69 muộn hơn p90, #70 sớm hơn p10), reboot
  trở lại trong dải p10–p90. Ghi nhận, không đổi dải chứng nhận
  (gap #70→#71 là SPAN, không vào FULL).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 158 file
  *.log có mtime trong mù #45 (0 file repo-1, 158 file hidden_files);
  4 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã biết**
  (T1 + T2 + 2× T10-O8 đợt 125). Quét mở rộng: **19 match / 14 dòng
  duy nhất — phân loại hết** (4 dòng launcher trên + 6 dòng test-pass
  hasEperm + 4 dòng tên file stage/oversize trong 2 log recount của
  T10). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7) —
  **~131h47'** trước probe #45. EPERM vẫn KHÔNG được tuyên bố là
  đã hết.
- **Quét writeFileSync lần 32: 844 dòng / 236 file** (phạm vi 3.013
  file); R7b đối chiếu 869 dòng / 253 file; copies 25 dòng / 17
  file — y hệt lần 31. Đối chiếu chéo 844+25=869=R7b, **chênh 0 —
  lần thứ ba mươi hai liên tiếp**. +6 dòng / +1 file so với lần 31,
  giải thích đúng hết bằng diff (xem §2.7). Async `.writeFile(`:
  vẫn đúng **2 vị trí helper đã biết** — 0 stray; mtime không đổi từ
  10/11.
- RAM: max biết được trong mù #45 **2.240 MB** (T4 gate0-wait,
  21:01:42Z, đoạn G1) = **37% ngưỡng guard**; đoạn F max 2.139 MB;
  đoạn G2 không có mẫu. **Birefnet KHÔNG chạy, vẫn 0 lần chạy thành
  công trong gói** — 2.240 MB vẫn dưới guard 6 GB; quyết parent
  §12.7 vẫn đứng (chỉ thử lại khi quan sát được available ≥ 6 GB).
- **Reboot #71 GIỮA đợt 125 đóng và lượt này (23:25:41Z) — ghi nhận
  giờ + bracket replay (xem §2.2).** Replay #71: 1.509 dòng,
  23:35:40–23:37:46Z, kết thúc gstreamer1.0-tools — cùng hình dạng
  chính xác như replay #68/#70 (baseline xác định, lặp lại giống nhau
  mỗi boot). **Số thứ tự TẠM THỜI** (mù #35 chưa đóng, tối đa +24 ẩn
  danh nghĩa, cộng thêm tối đa +29 từ mù #37, +6 từ mù #38 đoạn G,
  +2 từ mù #39 đoạn J, +1 từ mù #40 đoạn B, +3 từ mù #43 đoạn B,
  +5 từ mù #44 đoạn D và +4 từ mù #45 đoạn G1 → "thực tế #71" có thể
  tới #149; xem §2.2).
- **Đợt 126 lúc T7 đóng (~00:00Z):** T3 + T4 + T6 đã DONE (LIMITS/DEF
  trên đĩa, mtime trong G2); các luồng khác đang chạy; boot vẫn #71
  (kiểm 23:59:05Z). Hạn cứng đóng đợt 02:00Z 17/11 (lượt cron sau).
  T7 KHÔNG chạy quét toàn workspace lượt này (đúng giới hạn phối hợp).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 23:41:08Z | boot_id `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`; `who -b` Nov 16 23:25; `uptime -s` **2026-11-16 23:25:41**; btime **1794871541 = 2026-11-16T23:25:41Z**; journal chỉ 1 boot (ff7afbbb, first entry 23:25:52Z, last 23:40:54Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #70 đã mất theo reboot #71, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 23:42:06Z | **DEAD/STALE**, heartbeat n=44, ts 20:45:03Z, boot 670c07f6, age **10.623 s** (đúng 2h57'03"); last sample probe #44; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 23:42:06Z | **probe #45, boot=ff7afbbb, ok=2 fail=0**, exit 0; dòng `boot changed 670c07f6 -> ff7afbbb` (uptime since 2026-11-16 23:25:41) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 23:42:06Z | **ALIVE**, age 2 s, n=45, exit 0 |

Kiểm lại từ đĩa: log probe v2 **127 dòng** — 124 sau T7 đợt 125 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #44 +
dòng `boot changed` + dòng probe #45). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #44 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=45, ts 2026-11-16T23:42:06Z, boot
ff7afbbb-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (34 dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #71: driver mở đợt 126
(round-in-progress.md mtime 23:36:29Z) + 5 session đợt 126 trong
vùng G2 (birth 23:36:39Z, 23:40:54Z, 23:41:20Z, 23:41:32Z,
23:41:57Z — các luồng đợt 126) + 26 mốc mtime trong vùng G2
(mốc đầu 23:36:29Z — lúc mở đợt 126; mốc cuối 23:41:59Z — file của
luồng đợt 126). **Số thứ tự TẠM THỜI** (như #69/#70).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #45 (20:45:03Z → 23:42:06Z, 2h57'03")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #45: `uptime -s` = **2026-11-16 23:25:41Z**,
  boot_id `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69` — khác boot của
  probe #44 (670c07f6).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (23:41:08Z): chỉ **1 boot**
  (ff7afbbb, first entry 23:25:52Z, last 23:40:54Z). Journal/wtmp
  của boot 310f07e4 đã mất theo reboot #71 — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #71 — bracket replay ghi ngay trong lượt (bài học
  T7-125 §4 mục 4: kiểm boot trước MỖI lần đọc /var/log).** Lúc
  23:42:18Z file có **1.509 dòng** (đã chạy xong replay),
  birth/mtime 23:37Z, dòng đầu 23:35:40Z (startup packages
  configure, +9m59 sau boot), dòng cuối 23:37:46Z (status installed
  gstreamer1.0-tools), **`/var/log/apt/` đã xuất hiện** (eipp.log.xz
  + history.log + term.log). Kiểm lại 23:59:05Z (boot vẫn #71):
  vẫn 1.509 dòng, cùng bracket — không đổi. **Replay #71 cùng hình
  dạng chính xác như replay #68/#70** (1.509 dòng, kết thúc
  gstreamer1.0-tools): replay là baseline xác định, lặp lại giống
  nhau mỗi boot. history.log của #71 (chưa đọc chi tiết — T5 đợt
  126 là chủ quản replay) cho thấy cùng mẫu apt-get replay
  os-intent của host như #70.
- **dpkg.log của boot #70 đã MẤT** (file hiện tại chỉ còn bracket
  #71): /var/log reset mỗi boot. Bản ghi T7-125 (1.509 dòng,
  20:55:02–21:01:36Z) là bằng chứng duy nhất còn lại cho bracket
  #70 — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123). `btmp` cũng chỉ bắt đầu 23:25:52Z (boot hiện tại).

### 2.2 Reboot đã chốt trong mù — #70 (đã biết) + #71 (mới, 23:25:41Z) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 70 | **20:54:19Z** (chính xác từng giây) | 670c07f6 → 310f07e4 | Đã chốt đợt 125 (uptime -s + btime 1794862459 + who -b + journal 1 boot + F70 ≈ 0). Lượt này bổ sung: 12 session chạm đoạn F (birth/mtime trong F), 0 nhân chứng nhảy tại #70 (xem dưới). |
| 71 | **23:25:41Z** (chính xác từng giây) | 310f07e4 → ff7afbbb | Chốt từ lượt này: `uptime -s` đọc tươi (23:41:08Z) + btime 1794871541 + `who -b` 23:25 + boot_id ff7afbbb + journal first entry 23:25:52Z + probe #45 23:42:06Z boot ff7afbbb ok=2 fail=0 + driver mở đợt 126 23:36:29Z + 5 session đợt 126 trong vùng G2. **Số thứ tự TẠM THỜI.** |

**Clock:** F71 ≈ 0 (`date -u` 23:42:20Z vs HTTP `Date`
example.com 23:42:19Z, google.com 23:42:20Z, cloudflare.com
23:42:21Z — khớp trong 0–2 s, phần lệch là thời gian chạy tuần
tự 3 lệnh curl). F70 ≈ 0 (đã kiểm 21:02Z đợt 125, trên boot #70).
F69 ≈ 0 (đã kiểm 20:45Z đợt 125, trên boot #69).

**CẬN NHẢY CLOCK TẠI #70 — |X| ≲ 6 s (từ hai lần đo F, mới):**
- **0 nhân chứng nhảy tại #70:** **0 session** sinh trước
  20:54:19Z có mtime sau 20:54:19Z (quét 353 exec-log).
- **Cận trên từ quan sát cũ-clock muộn nhất:** session mtime muộn
  nhất trước #70 là **20:53:13Z** (exec-log, birth = mtime
  20:53:13Z) → X < 66 s (btime − quan sát = 66 s).
- **Cận từ hai lần đo F (chặt hơn, dùng để chứng nhận gap):**
  F69 ≈ 0 (±2 s, đo 20:45Z) và F70 ≈ 0 (±4 s, đo 21:02Z). Nếu độ
  lệch clock giữ nguyên tới lúc nhảy thì F70 = F69 + X → |X| ≲ 6 s.
  (Giả định "độ lệch giữ nguyên tới lúc nhảy" là cùng giả định đã
  dùng cho mọi gap chứng nhận dạng điểm trước đây; xem §2.5.)
- **Phiên sau #70 sớm nhất:** session birth 20:54:22Z (+3 s sau
  btime) — một lệnh ngắn của luồng đợt 125, khớp không có nhảy lớn.
- **Không có cận nhảy từ poll bị lỡ tại #70:** không có tiến trình
  cadence nào còn sống qua #70 để bị lỡ poll (các luồng đợt 125
  đang khởi động lại sau reboot; poller T10 đợt 124 đã dừng
  18:31:47Z theo thiết kế). Ghi rõ là KHÔNG CÓ cận này, không cố
  vẽ cận từ số khác.

**CẬN NHẢY CLOCK TẠI #71 — |X| ≲ 6 s (từ hai lần đo F, tương tự):**
- **0 nhân chứng nhảy tại #71:** **0 session** sinh trước
  23:25:41Z có mtime sau 23:25:41Z (quét 353 exec-log).
- **Không có quan sát cũ-clock muộn trong vòng 1 h trước #71:**
  session mtime muộn nhất trước #71 là 22:07:10Z (T10-125 LIMITS
  gộp) — cách btime tới 1h18'31" nên không đặt được cận có ý nghĩa
  từ phía này (tương tự #69 đợt 125).
- **Cận từ hai lần đo F:** F70 ≈ 0 (±4 s) và F71 ≈ 0 (±2 s) →
  |X| ≲ 6 s. Phiên sau #71 sớm nhất: session birth 23:36:39Z
  (+10m58 sau btime — driver mở đợt 126 lúc 23:35Z, không có phiên
  nào sinh ngay sau boot vì máy yên sau khi đợt 125 đóng xong).
- Gap #70→#71 là SPAN nên cận nhảy tại #71 không ảnh hưởng chứng
  nhận nào lượt này; ghi rõ để luồng sau khỏi mất công kiểm lại F71.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #69→#70 = **1.148 s (19'08")** — **CHỨNG NHẬN DẠNG ĐIỂM**
  (mới, xem §2.5). Chỉ hơn sàn 1.147 s đúng 1 s — gap chứng nhận
  ngắn nhất từ trước tới nay.
- Gap #70→#71 = **9.082 s (2h31'22")** — **VẪN CHỈ LÀ SPAN**
  (đoạn G1 mù #45 mở, xem §2.3).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo) — #71 ĐÃ
  VÀO DẢI:** #71 từ #70 dự kiến [21:30:24Z, 23:48:49Z] (p10–p90
  FULL53); thực tế **#71 23:25:41Z NẰM TRONG dải** (lần đầu sau 2
  lần ngoài dải liên tiếp: #69 muộn hơn p90 410 s, #70 sớm hơn p10).
  Dải cơ học cho #72 từ #71 (p10–p90 FULL54): [23:57:49Z,
  02:16:45Z]; hiệu dụng sau probe #45: [23:42:06Z, 02:16:45Z].
  Lưu ý: cận dưới p10 23:57:49Z đã qua lúc T7 viết LIMITS (~00:00Z)
  mà vẫn boot #71 (kiểm 23:59:05Z) — dải là cơ học, không phải dự
  báo nên không có gì sai; #72 vẫn có thể tới bất kỳ lúc nào trong
  dải.
- **#70 tới sớm hơn cả cận dưới p10 (đợt 125):** dải từ #69 là
  [21:11:16Z, 23:29:41Z]; #70 thật 20:54:19Z — ghi nhận đợt 125,
  không đổi lượt này.

**Reboot #71 — CHỈ GHI NHẬN giờ + bracket replay (mới, xảy ra
trước khi T7 mở):**
- Reboot này xảy ra TRƯỚC lượt cron 06:35 +07 (23:25Z) — đợt 126
  mở trên boot #71 (round-in-progress.md mtime 23:36:29Z, RAM lúc
  mở ~1.317 MB). Gap #70→#71 danh nghĩa 2h31'22" thuộc mù #45
  (đoạn G1), để điều tra tiếp — T7 mở điều tra lượt này, kết luận
  đoạn G1 MỞ (xem §2.3) và ĐỂ MỞ theo quyết parent §12(h).
- **Số thứ tự TẠM THỜI** (như #69/#70).

### 2.3 Hoạt động trong khoảng mù — vì sao F đóng, G1 mở, G2 đóng

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **18 file** +
hidden_files **445 file**; **463 file, 444 mốc giây phân biệt /
443 mốc float phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3 — "mốc" là mtime float phân biệt,
không phải giây tròn; xem §4 mục 6). Chia mù làm ba đoạn bởi #70
(20:54:19Z) và #71 (23:25:41Z):

- **Đoạn F: 20:45:03Z → 20:54:19Z (9'16" = 556 s, boot #69 670c07f6) —
  ĐÓNG bằng độ dài < sàn (MỚI — lần đầu một đoạn đóng bằng độ dài
  mà không cần uptime trực tiếp trong đoạn):**
  - F chỉ dài 556 s < sàn 1.147 s: reboot ẩn trong F cần ≥ 1.147 s
    từ cả #69 lẫn #70, tổng ≥ 2.294 s > 556 s — **không thể vừa**
    (cùng lập luận như đoạn A mù #42, gaps-script header). Cửa sổ
    sàn của F là RỖNG.
  - Củng cố bằng mật độ: **104 mốc**, lỗ lớn nhất **44 s**
    (20:51:54Z → 20:52:39Z); mốc đầu 20:45:03Z (head ~0–1 s — chính
    probe #44); mốc cuối **20:54:16Z** (tail 3 s). **12 session**
    chạm đoạn F.
  - **Kết luận đoạn F: ĐÓNG.**
- **Đoạn G1: 20:54:19Z → 23:25:41Z (2h31'22" = 9.082 s, boot #70
  310f07e4) — MỞ vì đuôi 4.710 s sau mốc cuối 22:07:10Z:**
  - **Đợt 125 đóng dần trong G1:** T5 postboot b70 (poll tới
    21:03:20Z) + T4 gate0-wait (poll tới 21:01:42Z) + T9 (lần ghi
    cuối trước #70 — xem LIMITS đợt 125) + T10 đóng đợt (recount
    21:54:32Z, phase1-summary 21:54:30Z, O8 driver 21:48:11Z) +
    **LIMITS gộp đợt 125 (docs/PHASE9_ROUND125_LIMITS.md, mtime
    22:07:10Z — mốc cuối đoạn G1)**. Sau 22:07:10Z máy yên hoàn
    toàn tới reboot #71.
  - Mật độ mtime: **314 mốc** (giây) / 313 (float), lỗ lớn nhất
    **4.710 s** — chính là đuôi (22:07:10Z → 23:25:41Z); các lỗ
    còn lại đều < 650 s (lớn thứ hai ~640 s, xem log). Mốc đầu
    20:54:19Z (= giờ #70, head 0 s); mốc cuối **22:07:10Z**.
    **22 session** chạm đoạn G1. Cửa sổ sàn [21:13:26Z, 23:06:34Z]
    có mốc — nhưng đuôi sau mốc cuối vẫn dài hơn sàn nhiều lần nên
    đoạn không đóng (bài học T7-125 §4 mục 1: mốc trong cửa sổ sàn
    chỉ loại trừ reboot ẩn CÓ im lặng bao phủ cắt; đuôi trống sau
    mốc cuối mới là điều kiện đóng).
  - **1 session bắc qua cắt G1-lo (21:13:26Z)** (birth 21:12:13Z
    mtime 21:14:13Z — một lệnh ngắn 2 phút của luồng đợt 125) — chỉ
    loại trừ reboot đúng tại thời điểm cắt, không thu hẹp cửa sổ sàn;
    **0 session bắc qua cắt G1-hi (23:06:34Z)** và **0 session chạm
    đuôi G1** (23:06:34Z, 23:25:41Z].
  - Đuôi: mốc cuối 22:07:10Z → #71 23:25:41Z = **4.710 s** >>
    sàn 1.147 s. File trong đuôi (sau cắt G1-hi) ở cả 4 phạm vi:
    repo-1 **0**, hidden_files **0**, ngoài cây **0**, /tmp **0**
    — đuôi HOÀN TOÀN TRỐNG. /tmp: **0 file** trong cả mù #45.
  - **Kết luận đoạn G1: MỞ — tối đa 4 ẩn danh nghĩa**
    (⌊4.710/1.147⌋ = 4, cùng cách đếm như mù #44 tối đa 5 ẩn với
    đuôi 5.899 s và mù #43 tối đa 3 ẩn với đuôi 4.503 s).
  - **ĐỂ MỞ theo quyết parent đợt 125 §12(h)** (đuôi trống thì để
    mở luôn — xem §2.4 + §5 mục 2). KHÔNG giao kiểm lại nữa.
- **Đoạn G2: 23:25:41Z → 23:42:06Z (16'25" = 985 s, boot #71 ff7afbbb) —
  ĐÓNG bằng đo uptime trực tiếp + probe #45 + dấu boot tươi:**
  - **`uptime -s` lúc 23:41:08Z = 23:25:41Z** chứng minh máy up
    liên tục từ #71 tới lúc đo; probe #45 23:42:06Z đọc boot_id
    ff7afbbb tươi — cùng boot_id với boot bắt đầu 23:25:41Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E.) Đoạn G2 dài 985 s < sàn nên không áp cắt; uptime
    trực tiếp là closer cho toàn đoạn.
  - **Chuỗi dấu boot tươi củng cố:** driver mở đợt 126
    (round-in-progress.md mtime 23:36:29Z) + 5 session đợt 126
    trong vùng G2 (birth 23:36:39Z, 23:40:54Z, 23:41:20Z,
    23:41:32Z, 23:41:57Z) + 26 mốc mtime (mốc đầu 23:36:29Z — lúc
    mở đợt 126; mốc cuối 23:41:59Z — file của luồng đợt 126). Lỗ
    mtime (23:25:41Z → 23:36:29Z] 649 s là máy yên sau boot (lượt
    cron 06:35 +07 mở đợt 126 lúc 23:35Z), không observer — nhưng
    uptime đóng đoạn này.
  - **Kết luận đoạn G2: ĐÓNG.**

**Kết luận trung thực: khoảng mù #45 KHÔNG ĐÓNG HOÀN TOÀN.**
Đoạn F đóng (độ dài < sàn), đoạn G1 mở (đuôi 4.710 s trống hoàn
toàn), đoạn G2 đóng; 2 reboot đã chốt giờ (#70 20:54:19Z — đã biết;
#71 23:25:41Z — chính xác từng giây trên đĩa) + **tối đa 4 ẩn danh
nghĩa**. Mù #45: **MỞ (đoạn G1)**.

Ngoài hai cây: **85 file** có mtime trong mù #45 (agents —
exec-log/tool-output chiếm đa số; chi tiết xem blind45-outside.txt);
**/tmp: 0 file** trong mù #45. Boot_id nhắc trong exec-log sinh/
viết trong mù: 670c07f6 8 file, 310f07e4 8 file, ff7afbbb 1 file
(session driver đợt 126).

**Lưu ý về độ trôi của ảnh chụp đoạn G1/G2:** quét lại hai cây lúc
~23:59Z cho 462 file / 443 mốc float (thay vì 463/444 lúc ~23:44Z) —
1 file log của luồng đợt 126 đang chạy đã được ghi thêm sau probe
#45 nên mtime của nó trôi khỏi cửa sổ (B1 = 23:42:06Z). Đoạn G1
KHÔNG ĐỔI (mốc cuối 22:07:10Z, đuôi 4.710 s) và đoạn F KHÔNG ĐỔI
(104 mốc) — verdict không bị ảnh hưởng. Số dùng trong LIMITS này
là ảnh chụp ~23:44Z (gần probe nhất), đối chiếu float ~23:59Z.

### 2.4 Mù #44 đoạn D — kiểm sâu MỘT LẦN DUY NHẤT, góc mới → VẪN MỞ → ĐỂ MỞ

Theo quyết parent đợt 125 §12(h): mù #44 D + #45 ĐIỀU TRA MỘT LẦN
RỒI ĐỂ MỞ. Lượt này là lần kiểm sâu DUY NHẤT của đoạn D (đợt 126);
sau lượt này KHÔNG kiểm lại nữa, KHÔNG giao kiểm lại vòng sau.

**Góc đã thử đợt 125 (KHÔNG lặp lại):** mtime 2 cây (389 file/379
mốc), ngoài cây (58 file), /tmp (3 file), session bắc qua cắt D-hi
(0), exec-log nhắc boot_id, dpkg bracket #69, journal/wtmp,
poller/gate observers, cận nhảy clock (0 nhân chứng).

**Góc MỚI đợt 126 (chưa thử bao giờ) — script blind44-deep126.py:**
| # | Góc mới | Kết quả |
|---|---|---|
| (a) | File **BIRTH time** trong đuôi D (18:56:52Z → 20:35:11Z) — `find -newerBt`, 2 cây + /tmp + **TOÀN HOME** | **0 file** ở cả 4 phạm vi |
| (b) | **mtime đuôi D trên TOÀN HOME** (`find ~ -newermt`) — không chỉ 4 phạm vi như đợt 125 | **1 file** = docs/PHASE9_ROUND124_LIMITS.md — **chính file mốc cuối** (float mtime 18:56:52.074Z, chỉ 0,074 s sau mốc giây 18:56:52 — find `-newermt "18:56:52"` bắt nó vì so sánh float; KHÔNG phải quan sát mới) |
| (c) | **ctime đuôi D** (`find -newerct`) — 2 cây + /tmp + TOÀN HOME | **1 file** = cùng file mốc cuối trên (ctime 18:56:52.075Z); 0 nơi khác |
| (d) | **.git trong home + git reflog/log** có entry trong đuôi D không | **0 thư mục .git** trong home (depth ≤ 5); repo-1 KHÔNG có .git — không phải git checkout local (push qua API) → góc này N/A, không có reflog nào để kiểm |
| (e) | **Nội dung log:** grep timestamp trong đuôi D trong exec-log/tool-output + shell history | **11 hit, TẤT CẢ đều tự tham chiếu — 0 quan sát mới thật:** 10 hit là output điều tra của chính T7-125 (file proc_312493426aa3.log — dòng `sessions touching zone D-tail ...: 0` v.v., nhắc lại giờ đuôi trong nhãn); 1 hit là dòng watcher của T7-125 nhắc `btime=2026-11-16T20:35:11Z` — chính thời điểm #69, đã biết |

**Caveat duy nhất:** 1 thư mục không đọc được trong quét toàn home
(`/home/hatch/.stagged-uploads`, permission denied) — không thể loại
trừ hoàn toàn nó là nơi ẩn một quan sát trong đuôi. Đây là thư mục
staging upload, không phải nơi log hoạt động của VM rơi vào; không có
bằng chứng nào chỉ về phía nó. Ghi rõ để parent biết, không phóng đại
thành "có thể đóng".

**Kết luận đoạn D: VẪN MỞ — tối đa 5 ẩn danh nghĩa (không đổi).**
Đuôi 5.899 s vẫn trống hoàn toàn sau 5 góc mới. **ĐỂ MỞ theo quyết
parent đợt 125 §12(h) — KHÔNG kiểm lại nữa, KHÔNG giao kiểm lại
vòng sau.** Gap #68→#69 giữ SPAN (xem §2.5). Đây là lần kiểm sâu
cuối cùng của đoạn D; mọi kênh timestamp trong VM đã quét hết
(mtime/birth/ctime × toàn home + nội dung log + session + dpkg +
journal/wtmp) — bằng chứng ngoài VM là con đường duy nhất còn lại
(nếu có), và đó không phải việc của luồng T7 trong VM.

### 2.5 Phân phối gap — CERT n=38 → 39, FULL n=53 → 54 (MỚI: gap #69→#70 chứng nhận dạng điểm)

**Gap #69→#70 = 1.148 s (19'08") CHỨNG NHẬN DẠNG ĐIỂM — MỚI:**
- Đoạn F đóng bằng độ dài < sàn (556 s < 1.147 s; cửa sổ sàn RỖNG)
  + 104 mốc, tail 3 s + 12 session chạm F (xem §2.3).
- Hai đầu chính xác từng giây trên đĩa: btime #69 1794861311
  (20:35:11Z), btime #70 1794862459 (20:54:19Z); hiệu đúng 1.148 s.
- Cận nhảy tại #70: |X| ≲ 6 s (F69 ≈ 0 ±2 s + F70 ≈ 0 ±4 s, xem
  §2.2); cận độc lập từ quan sát cũ-clock: X < 66 s; 0 nhân chứng
  nhảy. Không có cận từ poll bị lỡ (không có tiến trình cadence còn
  sống qua #70) — cận từ F đã bao phủ.
- Quy ước: btime được coi là thời điểm reboot, POST không tách
  riêng (như T4-121 cho #63 và T7-123 cho #65). Độ lệch dư ±6 s
  không làm đổi thống kê (xem sensitivity dưới: mean/median/p10/p90
  giữ nguyên tới từng giây).
- **Kiểm bền:** ngay cả ở cận dưới LO 1.142 s, sàn vẫn > 556 s nên
  lập luận đóng F bằng độ dài vẫn đứng (556 < 1.142) — chứng nhận
  không phụ thuộc vào ±6 s. Gap 1.148 s chỉ hơn sàn 1 s; nếu parent
  muốn thận trọng hơn thì có thể hạ xuống dạng khoảng [1.142 s,
  1.154 s] — T7 giữ dạng điểm theo tiền lệ (#58→#59 điểm với caveat
  F59; #60→#61 điểm với F61 caveat + cận nhảy X ≤ 36 s — trường hợp
  này mạnh hơn cả hai vì F đã kiểm cả hai đầu).

**Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN — KHÔNG đưa
vào FULL/CERT** — đoạn G1 mù #45 mở, đuôi 4.710 s, tối đa 4 ẩn
(xem §2.3). Cùng luật như #55→#56 / #56→#57 (T6-119 §2.5), span
#59→#60 (10.680 s, T5-120 §2.5), span #61→#62 (5.689 s, T4-121
§2.5), span #63→#64 (7.933 s, T7-122 §2.5), span #67→#68
(9.692 s, T7-124 §2.5) và span #68→#69 (10.880 s, T7-125 §2.5).

**Gap #68→#69 = 10.880 s (3h01'20") VẪN CHỈ LÀ SPAN** — đoạn D mù
#44 vẫn mở sau kiểm sâu 1 lần (xem §2.4). Không đưa vào FULL/CERT.

**Cross-check tái hiện T7(124) 100%:** chạy blind42-gaps.py
verbatim cho lại đúng CERT n=38 / FULL n=53 của T7 đợt 124 (xem
blind45-gaps.txt: CERT38 mean 1h44'25" median 1h58'05" p10
0h43'27" p90 2h25'04" sd 0h42'16"; FULL53 mean 1h50'40" median
1h57'56" p10 0h36'05" p90 2h54'30" sd 0h56'49" — khớp T7-124 §2.5
từng số). Sau đó thêm gap #69→#70 = 1.148 s (điểm):

- **CERT n=39: mean 1h42'14" median 1h57'56" p10 0h31'13" p90
  2h24'46" sd 0h43'53" min 0h19'07" max 3h14'08".**
- **FULL n=54: mean 1h48'58" median 1h56'28" p10 0h32'09" p90
  2h51'05" sd 0h57'39" min 0h19'07" max 5h43'18";** in 90–150' = 29,
  <60' = 10 (tăng từ 9 — gap mới 1.148 s < 60'), >180' = 6, >240' = 2.
- **Sensitivity ±6 s:** CERT39-LO (1.142 s) và CERT39-HI (1.154 s)
  cho cùng mean/median/p10/p90 tới từng giây (chỉ min đổi 19'02"
  ở LO — xem §4 mục 7); FULL54-LO/HI tương tự. Thống kê bền vững
  trước độ lệch dư.
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới 1.148 s
  nằm trong dải, chỉ hơn sàn 1 s).
- **Tốc độ reboot (đồng hồ ghi nhận):** 71 / 147,13 h = **1 reboot
  mỗi 124,3 phút** (từ #1 2026-11-10T20:18:10Z tới #71
  2026-11-16T23:25:41Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 75 / 147,13 h = **1 mỗi 117,7 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3), mù #44 đoạn D (+5) và mù #45 đoạn G1 (+4).
- **#71 đã vào dải cơ học (xem §2.2):** không còn "2 lần ngoài dải
  liên tiếp" — chuỗi đã reset.

### 2.6 Trạng thái các mù cũ — #40 B / #43 / #42 B KHÔNG KIỂM LẠI (quyết parent)

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #45 (mới) | **MỞ (mới, lượt này — đoạn G1; F+G2 đóng)** | Đuôi G1 4.710 s trống hoàn toàn, tối đa 4 ẩn; gap #70→#71 vẫn SPAN; **ĐỂ MỞ theo quyết parent §12(h)** — không kiểm lại |
| #44 | **MỞ (đoạn D, lượt này kiểm sâu 1 lần vẫn mở)** | **ĐỂ MỞ theo quyết parent §12(h)** — lần kiểm sâu cuối cùng đã xong (§2.4); gap #68→#69 vẫn SPAN |
| #43 | **MỞ (đoạn B mù #42)** | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.4) — T7 KHÔNG kiểm lại lượt này.** Đuôi 4.503 s, tối đa 3 ẩn; gap #67→#68 vẫn SPAN |
| #42 | **KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'50", tối đa 3 ẩn)** | Đoạn A đóng → gap #66→#67 chứng nhận dạng khoảng; đoạn B mở = mù #43 |
| #41 | ĐÓNG HOÀN TOÀN | T7-123 §2.3; gap #64→#65 chứng nhận dạng khoảng, #65→#66 chứng nhận dạng điểm |
| #40 | KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'04", tối đa 1 ẩn) | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.3) — T7 KHÔNG kiểm lại lượt này.** 3 lần kiểm tra sâu đều 0; gap #63→#64 vẫn SPAN |
| #39 | KHÔNG ĐÓNG HOÀN TOÀN (I+K đóng, J mở, 2h56'14", tối đa 2 ẩn) | **Parent đã chấp nhận ĐỂ MỞ** (quyết đợt 123 §12.2) — KHÔNG kiểm lại |
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | Thử cuối đã thất bại đợt 121 — KHÔNG thử lại lượt này (theo brief T7); cần parent quyết có chấp nhận để mở như mù #35/#37 hay không |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 §2.3 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#71 vẫn TẠM THỜI vì mù này |
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

**Còn thiếu gì để chứng nhận gap #70→#71:** đúng **1 quan sát sau
23:06:34Z** trong đuôi (22:07:10Z, 23:25:41Z]. Ngay cả khi G1 được
đóng, gap #70→#71 vẫn mang caveat F70/F71 ĐÃ KIỂM (≈ 0 cả hai đầu,
xem §2.2) nên có thể chứng nhận dạng điểm — nhưng chỉ khi G1 đóng
được; hiện tại G1 mở theo quyết §12(h) nên gap giữ SPAN. **Không
giao luồng sau kiểm lại G1** (quyết §12(h) đã bao phủ: đuôi trống
thì để mở luôn).

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 32 — chênh 0 (lần thứ 32 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T4 trong round121-t4, đổi OUT sang
  round126-t7) **23:54:52Z → 23:55:10Z 16/11 (18 s, có SCAN-END)**.
  Scan chạy trên boot #71, SAU khi mù #45 đã đóng bằng probe #45
  (23:42:06Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **844 dòng / 236 file** (phạm vi 3.013 file); R7b đối
  chiếu: **869 dòng / 253 file** (phạm vi 12.406 file); copies:
  **25 dòng / 17 file** — y hệt lần 31. Đối chiếu chéo:
  844+25=869=R7b, **chênh 0**.
- **+6 dòng / +1 file so với lần 31** (838/235 → 844/236), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND125_T7_EPERM_LIMITS.md | +6 (0 → 6) | 21:00:29Z 16/11 | Tài liệu T7 đợt 125 (nhắc `writeFileSync` 6 lần); viết SAU scan lần 31 (20:51:09Z) nên lần này mới vào |
- Phạm vi: 3.013 = 2.996 + 17 net (**17 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 0 dòng `<`; 17 file mới gồm 9
  LIMITS đợt 125 (gộp + T1/T2/T3/T4/T5/T7/T8/T9) + 3 LIMITS/DEF
  đợt 126 (T3 scheduler, T4 DEF v0.3, T6 lockhealth) + 1 vite
  config (apps/web/vite.n2.config.mjs) + 4 script benchmark T4
  (f2_startup_analyze/probe 125t4 + 126t4)). Copies y hệt lần 31
  (diff 0 dòng).
- **Kết luận: 32 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #45.

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
- Lưu ý phương pháp: pattern phải là `\.writeFile\(` (có dấu chấm).
  Pattern không dấu chấm còn bắt thêm các mock `async writeFile(`
  trong file test `apps/web/scripts/test_round83_k8_eperm_retry.mjs`
  (định nghĩa fake fs, mtime 10/11, không phải đường ghi thật) —
  không tính vào 2 helper; T7-125 §2.8 cũng dùng pattern có dấu
  chấm nên số 2 là nhất quán giữa các lượt.
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #45.

## 3. RAM trong mù #45 — max 2.240 MB (37% guard), birefnet KHÔNG chạy

- **3 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #45 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 23:42:18Z | **1.316.700 kB** | Sau probe #45 (boot #71) |
  | 23:57:10Z | **1.807.884 kB** | Trước khi viết LIMITS (boot #71) |
  | 23:59:05Z | **1.453.308 kB** | Trước khi viết LIMITS (boot #71) |
- **Max RAM biết được TRONG mù #45 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 126 mẫu RAM; **max 2.240 MB**
  (T4 gate0-wait-t4.log, 21:01:42Z, đoạn G1, dòng `RAMavail=2240MB`
  đã xác minh trực tiếp trong log — `gate0-wait-t4 #1 ... boot=
  2026-11-16 20:54:19 ... RAMavail=2240MB preview_md5=03bf029f`)
  = **37% ngưỡng guard** — thấp hơn max kỷ lục 4.576 MB mù #42 và
  thấp hơn max 3.431 MB mù #44; đoạn F max **2.139 MB** (T5 poll,
  20:49:38Z); đoạn G2 **không có mẫu** (máy yên sau boot #71 tới
  khi đợt 126 mở — không observer nào ghi RAM trong G2).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 2.240 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T7 đợt 125)

1. **Đoạn đóng bằng độ dài < sàn, không cần uptime (mới, §2.3 đoạn
   F):** lần đầu một đoạn đóng mà không cần đo uptime trực tiếp
   trong đoạn — F dài 556 s < sàn 1.147 s nên cửa sổ sàn RỖNG theo
   định nghĩa. Khác đoạn E mù #44 (592 s < sàn nhưng T7-125 vẫn
   dùng uptime trực tiếp làm closer chính): lập luận độ dài là đủ
   một mình khi đoạn < sàn, vì reboot ẩn cần ≥ sàn từ CẢ HAI đầu.
   Bài học: đoạn < sàn thì không cần tìm observer trong đoạn — chỉ
   cần chứng minh độ dài + hai đầu chính xác.
2. **Cận nhảy từ hai lần đo F (mới, §2.2):** khi F đã kiểm ở cả hai
   đầu của một reboot (F69 ≈ 0 và F70 ≈ 0), hiệu của chúng giới hạn
   bước nhảy |X| ≲ 6 s — chặt hơn cận từ quan sát cũ-clock muộn
   nhất (X < 66 s tại #70) và thay thế được cận từ poll bị lỡ khi
   không có tiến trình cadence nào còn sống. Điều kiện: hai lần đo
   F phải ở hai boot kề nhau, và giả định độ lệch giữ nguyên tới lúc
   nhảy (cùng giả định của mọi gap điểm trước đây).
3. **Kiểm sâu "một lần" phải liệt kê góc đã thử + góc mới, rồi DỪNG
   (mới, §2.4):** kiểm sâu đoạn D đợt này liệt kê rõ 9 góc đã thử
   đợt 125 + 5 góc mới, và kết luận bằng "để mở, không kiểm lại
   nữa" thay vì đề xuất góc tiếp theo. Bài học: một lần kiểm sâu
   có giá trị chỉ khi nó đóng sổ — nếu kết thúc bằng "còn góc X
   chưa thử" thì nó không phải lần cuối.
4. **Birth/ctime/mtime toàn home + nội dung log là bộ quét đầy đủ
   cuối cùng trong VM (mới, §2.4):** sau lượt này, mọi kênh
   timestamp trong VM đã quét hết cho đuôi D (mtime/birth/ctime ×
   toàn home + nội dung + session + dpkg + journal/wtmp). Bằng
   chứng ngoài VM là con đường duy nhất còn lại — ghi rõ để parent
   không giao thêm vòng quét trong VM.
5. **Caveat thư mục không đọc được (mới, §2.4):** quét toàn home
   gặp 1 thư mục permission-denied (`/home/hatch/.stagged-uploads`)
   — ghi rõ tên + lý do không đáng lo (staging upload, không phải
   nơi log VM rơi vào) thay vì im lặng hoặc phóng đại.
6. **"Mốc" = mtime float phân biệt, không phải giây tròn (làm rõ,
   §2.3):** investigate.py đếm distinct giây (444 mốc) còn đếm
   float cho 443 mốc — chênh 1 do 1 file log của luồng đợt 126 trôi
   mtime khỏi cửa sổ giữa hai lần quét (xem §2.3 cuối). Số dùng
   trong LIMITS là số giây của ảnh chụp gần probe nhất (như tiền lệ
   T7-123/T7-124/T7-125); lỗ/gap tính bằng float nên không đổi
   verdict. Ghi rõ để luồng sau khỏi tưởng lệch số.
7. **Sensitivity ±6 s đổi min của CERT/FULL ở cận dưới (mới, §2.5):**
   ở LO 1.142 s, min CERT/FULL thành 19'02" (thấp hơn sàn 19'07").
   Đây chỉ là cận dưới giả định của sensitivity — giá trị chứng
   nhận là điểm 1.148 s, min vẫn 19'07". Nếu parent hạ gap này
   xuống dạng khoảng [1.142 s, 1.154 s] thì sàn phải xét lại (min
   khoảng 1.142 s) — T7 giữ dạng điểm theo tiền lệ và ghi rõ điểm
   này để parent quyết nếu muốn thận trọng hơn.
8. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo probe #45 boot ff7afbbb ok=2 fail=0 ĐÚNG; dự báo
   đoạn F ĐÓNG bằng độ dài < sàn ĐÚNG; dự báo đoạn G2 ĐÓNG bằng
   uptime trực tiếp ĐÚNG; dự báo đoạn G1 KHÔNG ĐÓNG ĐƯỢC ĐÚNG
   (đuôi thật 4.710 s = 1h18'30", ngắn hơn dự báo ~1h30' vì mốc
   cuối là LIMITS gộp đợt 125 lúc 22:07:10Z chứ không phải ~21:56Z
   — dự báo đúng hướng, đuôi thật ngắn hơn vì T10 đóng muộn hơn
   dự kiến); dự báo gap #69→#70 chứng nhận dạng điểm ĐÚNG (CERT
   39 / FULL 54); dự báo gap #70→#71 SPAN ĐÚNG; dự báo EPERM 0
   sóng ĐÚNG; dự báo WFS chênh 0 ĐÚNG (844 dòng, trong khoảng dự
   báo ~845–895 — thực tế 844, thấp hơn cận dưới dự báo 1 dòng vì
   LIMITS đợt 125 nhắc `writeFileSync` ít hơn ước tính, không ảnh
   hưởng verdict); dự báo RAM max < 4.576 MB ĐÚNG (2.240 MB) —
   không sửa sau khi thấy số.
9. **Kiểm lại boot TRƯỚC (23:41:08Z) và SAU khi viết LIMITS
   (23:59:05Z):** cả hai lần đều boot ff7afbbb (#71), uptime-s
   23:25:41Z — KHÔNG có reboot giữa phiên T7 lượt này (khác đợt
   125 có reboot #70 giữa phiên). Probe #45 và mù #45 KHÔNG bị
   ảnh hưởng bởi reboot sau đó (chưa xảy ra tới lúc đóng).
10. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
    (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
    model đóng/nhạc bản quyền.**
11. **Không quét toàn workspace lượt này:** chỉ dùng góc hẹp/mục
    tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ repo-1/goals
    + /tmp + exec-logs + toàn home CHỈ cho quét đuôi D
    (birth/mtime/ctime — find có giới hạn, không quét v2 600k file
    kiểu T3). Quét toàn home cho đuôi D là ngoại lệ có mục đích
    (lần kiểm sâu duy nhất), không phải tiền lệ quét rộng.
12. **Stage batch:** chỉ 1 file text (LIMITS doc này),
    NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
    checkpoint + stage file).
13. **Ghi rõ:** số thứ tự reboot #47–#71 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
14. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F71 ĐÃ KIỂM (≈ 0) vào hồ sơ (xem
    §2.2 + §2.6).
15. **Cross-check tái hiện T7(124) 100%** (CERT n=38 / FULL n=53)
    trước khi kết luận số mới — chạy blind42-gaps.py verbatim qua
    exec (xem blind45-gaps.txt).
16. **md5 preview.tsx / media.ts KHÔNG ĐỔI trong lúc làm việc
    (ghi nhận):** preview.tsx 03bf029f (baseline), media.ts
    2c384ed1 — khớp baseline sau khi T3 gỡ H3f. T7 không sửa
    production file nào.
17. **T3 + T4 + T6 đợt 126 đã DONE trước khi T7 đóng** (LIMITS/DEF
    trên đĩa, mtime trong G2) — T7 chỉ ghi nhận trạng thái, không
    phụ thuộc kết quả các luồng đó.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Mù #44 đoạn D: VẪN MỞ — ĐÃ ĐỂ MỞ THEO QUYẾT §12(h) (mới, xem
   §2.4).** Lần kiểm sâu duy nhất đã xong (5 góc mới, 0 quan sát
   mới thật). **KHÔNG kiểm lại nữa, KHÔNG giao kiểm lại vòng sau.**
   Gap #68→#69 giữ SPAN. Nếu parent muốn đóng D thì cần bằng chứng
   NGOÀI VM (T7 không tự tìm được từ trong VM nữa).
2. **Khoảng mù #45 (đoạn G1): MỞ — ĐÃ ĐỂ MỞ THEO QUYẾT §12(h)
   (mới, xem §2.3 đoạn G1).** Đuôi 4.710 s trống hoàn toàn ở cả 4
   phạm vi; 0 session bắc qua cắt G1-hi; tối đa 4 ẩn. Gap #70→#71
   giữ SPAN cho tới khi có bằng chứng ngoài VM. **Không giao luồng
   sau kiểm lại G1** (quyết §12(h) đã bao phủ).
3. **Gap #69→#70 = 1.148 s CHỨNG NHẬN DẠNG ĐIỂM (mới — xem §2.5,
   CERT n=39, FULL n=54).** Điểm duy nhất cần parent lưu ý: nếu
   muốn thận trọng hơn thì hạ xuống dạng khoảng [1.142 s, 1.154 s]
   (xem §4 mục 7) — T7 giữ dạng điểm theo tiền lệ.
4. **Mù #43 (gap #67→#68): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ**
   (quyết đợt 124 §12.4). T7 không kiểm lại lượt này. Gap #67→#68
   giữ SPAN.
5. **Mù #40 đoạn B: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   124 §12.3). T7 không kiểm lại lượt này. Gap #63→#64 giữ SPAN.
6. **Gap #66→#67 = KHOẢNG [27'06", 28'28"] ĐÃ CHỨNG NHẬN DẠNG
   KHOẢNG (đợt 124) — parent ĐÃ CHẤP NHẬN cả ba điểm (§12.5).**
   Không đổi lượt này.
7. **Reboot #71 (23:25:41Z, boot ff7afbbb) — CHỈ GHI NHẬN giờ +
   bracket replay (mới, xem §2.2 cuối + §2.1).** Gap #70→#71 thuộc
   mù #45 đoạn G1, đã để mở. **Không tự đánh số thứ tự chắc chắn**
   — số #71 là tạm thời như #70. **Lưu ý replay:** bracket
   23:35:40Z đã ghi trong LIMITS này (sẽ mất theo reboot sau, như
   bracket #69/#70).
8. **RAM max 2.240 MB = 37% guard (mới — xem §3).** Thấp hơn max
   kỷ lục 4.576 MB mù #42 và max 3.431 MB mù #44. **Birefnet KHÔNG
   chạy** (vẫn dưới guard 6 GB; quyết parent §12.7 vẫn đứng). u2net
   vẫn là fallback chính thức.
9. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
   --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
   117, chưa trả lời — nhắc lần 12 ở đợt này). Watcher này sẽ
   lấp đúng loại lỗ như đuôi đoạn G1 của mù #45.
10. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
    parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
    117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
11. **EPERM không tuyên bố đã hết** (sóng gần nhất ~131h47'
    trước probe #45). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
12. **Mù #46 MỚI MỞ (từ probe #45 23:42:06Z) — việc của lượt sau:**
    probe #46 + điều tra đoạn từ #71 (dải cơ học cho #72:
    [23:57:49Z, 02:16:45Z], hiệu dụng sau probe #45: [23:42:06Z,
    02:16:45Z]). T7 KHÔNG tự chạy probe #46 lượt này (nhịp probe
    là 1/lượt).
