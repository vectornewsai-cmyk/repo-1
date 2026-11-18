# PHASE9 ROUND134 T2 — EPERM: probe #53 ok=2 fail=0 + mù #53 KHÔNG ĐÓNG HOÀN TOÀN (A đóng, B MỞ tối đa 3 ẩn, C đóng) + gap #82?→#83? CHỨNG NHẬN DẠNG KHOẢNG + CERT n=47 / FULL n=62 + reboot #84?→#85? GIỮA PHIÊN T2 (ngoài dải, sớm 412 s — đứt chuỗi 14 lần INSIDE)

> Luồng T2, đợt 134 vòng lặp Phase 9 VCut Studio (lượt cron 06:35 +07
> 18/11/2026; làm việc 23:45Z 17/11 → ~00:05Z 18/11/2026).
> Nhiệm vụ: probe #53 theo lịch thường lệ + mù #53 (từ probe #52) +
> chuỗi reboot (reboot #83?→#84? mới giữa hai đợt + khung chết #83? +
> quyết khung chết #82? hẹp) + quét sóng EPERM. Quyết parent đợt 133
> §12.1(a): ĐÃ PHÊ DUYỆT SỬA instrumentation log draw (T3 đợt 134) —
> preview.tsx ĐÃ ĐỔI trong đợt này (xem §3 cuối + §4 mục 8).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round134-t2/prereg-t2.md. **Prereg có 2 DỰ BÁO VERDICT
> SAI (xem §4 mục 1–2: dự báo đoạn B mù #53 đóng — SAI, B MỞ tối đa
> 3 ẩn; dự báo gap #83?→#84? chứng nhận được — SAI, giữ SPAN) +
> dự báo RAM hẹp sai (max thật 1.903 MB, xem §4 mục 3).** Các số
> gap/dải trong prereg đều tính bằng code nên ĐÚNG HẾT (gap 7.645 s /
> 6.318 s, dải [22:14:40Z, 00:08:47Z], chuỗi sự kiện thứ 8).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #47 (ĐÃ ĐÓNG HOÀN
> TOÀN đợt 128) / mù #46 đoạn A / mù #45 đoạn G1 / mù #44 đoạn D /
> mù #40 đoạn B / mù #43 / mù #42 đoạn B** (quyết parent đợt 124 §12.3
> + §12.4, đợt 125 §12(h), đợt 126 §12(h), đợt 127 §12(c)). **Mù #50
> ĐÃ ĐÓNG HOÀN TOÀN đợt 131 — KHÔNG kiểm lại. Mù #49 B: KHÔNG kiểm
> lại thường lệ** theo quyết parent đợt 132 §12.3(d). **Mù #51 B:
> KHÔNG kiểm lại đợt này** (đã kiểm 3 lần, verdict ổn định, không có
> bằng chứng mới — xem §2.6).
> **CÓ reboot giữa phiên T2 lượt này** — #84?→#85? (btime 23:53:17Z),
> xảy ra sau probe #53 (23:46:54Z) và sau lần xác minh boot cuối
> 23:47:11Z, TRƯỚC khi quét WFS (23:56:25Z). Probe #53 + mù #53
> KHÔNG bị ảnh hưởng (cửa sổ mù đóng trước reboot); quét WFS chạy
> trên boot mới #85? (xem §2.7 + §4 mục 5). Mù #54 MỚI MỞ từ probe
> #53 — việc của T2 đợt 135.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (23:46:54Z):** `status`
  báo **DEAD/STALE** (heartbeat age 11.038 s, last #52 20:42:56Z, boot
  07da9c50, exit 1); `once` ngay sau đó là **probe #53, boot
  d2e66749, ok=2 fail=0**, exit 0, 23:46:54Z; `status` chạy lại
  **ALIVE** (age 0 s, n=53), exit 0. Log v2 tăng đúng **3 dòng**
  (148 → 151) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=53, ts 23:46:54Z, boot d2e66749.
- **Boot #84? (tạm) lúc 23:26:58Z, boot
  `d2e66749-2840-49f8-930d-7e54c9554b96`** — xác minh bằng `uptime -s`
  + btime 1794958018 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại: HTTP `Date` cả 3 server đều khớp **+1 tới +2 s** (server hơn
  local 1–2 s cả ba) → **F84? ≈ −1 s (±~1 s)** — đo trực tiếp đầu tiên
  trên boot mới. T6-134 sẽ chốt chuỗi tương đối, số tuyệt đối VẪN TẠM
  (giữ "?").
- **#84? tới TRONG dải cơ học từ #83?** [22:14:40Z, 00:08:47Z 18/11]
  (p10–p90 FULL61); #84? thật 23:26:58Z — **lần thứ mười bốn liên
  tiếp trong dải**.
- **Khoảng mù #53 (20:42:56Z → 23:46:54Z 17/11, 3h03'58") —
  KHÔNG ĐÓNG HOÀN TOÀN (A đóng, B MỞ tối đa 3 ẩn, C đóng).** Đoạn A
  **ĐÓNG** (merged 4 phạm vi: 120 mốc, lỗ lớn nhất 822 s, đuôi 822 s;
  hai cây riêng cho cùng lỗ 822 s — lần này merged KHÔNG đảo verdict
  hai cây); đoạn B **MỞ** (merged: 59 mốc, lỗ lớn nhất 4.227 s
  (22:16:31Z → 23:26:58Z), đuôi 4.227 s; 0 session chạm đuôi B, 0 file
  trong đuôi B ở cả 4 phạm vi; /tmp 0 file trong toàn bộ mù); đoạn C
  **ĐÓNG** bằng uptime trực tiếp + luật lỗ (28 mốc gộp, lỗ lớn nhất
  518 s). **2 reboot đã chốt giờ trong mù (#83? 21:41:40Z +
  #84? 23:26:58Z — chính xác từng giây trên đĩa) + tối đa 3 ẩn
  (đoạn B).**
- **Gap #82?→#83? = [7.635 s, 7.655 s] (mid 7.645 s) CHỨNG NHẬN DẠNG
  KHOẢNG (mới)** — đoạn A mù #53 đóng (merged) + đoạn B mù #52 đóng
  bằng uptime (đợt 133); biên ±10 s của T5; **F83? CHƯA TỪNG đo trực
  tiếp** (caveat cùng lớp với các gap khoảng trước #72→#73 /
  #75→#76 / #77→#78? / #79?→#80? — xem §2.2 + §2.5); cận nhảy clock
  |X83?| < 822 s từ mốc đĩa cuối (LỎNG — máy yên sau 21:27:58Z) nhưng
  F82? và F84? đều ≈ −1 s đo trực tiếp. **CERT n=46 → n=47 /
  FULL n=61 → n=62.**
  **Gap #83?→#84? = 6.318 s (1h45'18") VẪN CHỈ LÀ SPAN** (đoạn B mù
  #53 mở, tối đa 3 ẩn).
- **Khung chết #83? (mới): (22:16:31Z, 23:26:58Z] (4.227 s =
  1h10'27")** — mốc muộn nhất trên đĩa trước btime #84? là LIMITS
  gộp 133 (22:16:31Z); không có hoạt động nào trong bất kỳ phạm vi
  nào sau đó tới reboot. Máy nhàn sau khi T10 đóng đợt 133.
- **Khung chết #82? — T2 QUYẾT: NHẬN bản hẹp (21:29:47Z, 21:41:40Z]
  (713 s) làm chuẩn** (xem §2.2): mtime thư mục exec-logs là mốc
  filesystem thật do T10 quan sát trực tiếp 21:55Z, sớm hơn btime
  11m53s (ngoài xa sai số đồng hồ); tiền lệ "khung hẹp nhất làm
  chuẩn" (quyết parent đợt 130 §12.3(f) / 131 §12.3(c) / 132 §12.3(c)).
  Bản chính (21:28:35Z, 21:41:40Z] (785 s) vẫn ghi đầy đủ; hoạt động
  21:29:47Z KHÔNG quy trách nhiệm được cho luồng nào (thư mục trống).
- **REBOOT #84?→#85? GIỮA PHIÊN T2 (mới, §2.2 cuối): btime 23:53:17Z,
  boot `81335571-099d-4896-b180-620577ac8140`.** Gap #84?→#85? danh
  nghĩa = **1.579 s (26'19")** — boot #84? sống ngắn nhất trong chuỗi
  gần đây (#79? 2.089 s). **#85? tới NGOÀI dải cơ học từ #84?**
  (p10–p90 FULL62: [00:00:09Z, 01:53:57Z 18/11]) — sớm hơn cận dưới
  **412 s** — **đứt chuỗi 14 lần INSIDE liên tiếp** (lần ngoài dải
  đầu tiên kể từ #70, đợt 125 — cũng tới sớm). Chuỗi gộp §10.2
  LIMITS-133: reboot này là **sự kiện thứ 9**; các đợt 129–134 đều
  có ≥1 reboot (6 đợt liên tiếp).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 53 file
  *.log có mtime trong mù #53 (0 file repo-1, 53 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8, xem §2.7). Quét mở rộng: **8 match thô / 8 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher trên). Sóng gần nhất vẫn là
  **~11:55–12:11Z 11/11** (R7) — **~155h36'** trước probe #53. EPERM
  vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 40: 891 dòng / 248 file** (phạm vi 3.102
  file); R7b đối chiếu 916 dòng / 265 file; copies 25 dòng / 17
  file — y hệt lần 39 về copies. Đối chiếu chéo 891+25=916=R7b,
  **chênh 0 — lần thứ bốn mươi liên tiếp**. +4 dòng / +1 file so
  với lần 39, giải thích đúng hết bằng diff (xem §2.7). **Quét chạy
  trên boot mới #85?** (23:56:25–23:57:01Z, sau reboot giữa phiên)
  — đếm code trên đĩa, không phụ thuộc boot. Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray;
  mtime không đổi từ 10/11 (dist copy 11/11 không đổi).
- RAM: max biết được trong mù #53 **1.903 MB** (T3 wait-t4 poll,
  20:57:35Z, đoạn A) = **31,0% ngưỡng guard**; đoạn B và C: **0 mẫu
  RAM** trong log sibling (máy nhàn / không ai ghi mẫu). **Birefnet
  KHÔNG chạy, vẫn 0 lần chạy thành công trong gói** — 1.903 MB vẫn
  dưới guard 6 GB; quyết parent §12.7 vẫn đứng (chỉ thử lại khi quan
  sát được available ≥ 6 GB). MemAvailable trực tiếp lượt này:
  527.476 kB lúc 23:45:05Z (đoạn C, trước probe); sau reboot #85?
  hồi lên 1.682.728 kB (23:57:48Z) rồi 1.351.580 kB (00:00:02Z).
- **preview.tsx ĐÃ ĐỔI trong đợt 134:** md5 530e10a7 (trước:
  805409f0), mtime 23:47:42Z — sửa instrumentation của T3-134 theo
  quyết parent đợt 133 §12.1(a) (có backup orig + diff + cờ
  round134-t3-fix.done); media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts
  KHÔNG ĐỔI ee80d093. T2 không sửa production file nào.
- **Replay boot #84? (bracket của T2, đọc 23:47Z — TRƯỚC reboot
  #85?): 1.545 dòng / 221 installs**, gói cuối gstreamer1.0-tools
  23:37:47Z (boot +10m49s) — cùng hình dạng baseline #82?/#83?.
  **Hạn chế (xem §4 mục 4):** T2 KHÔNG kịp ghi giờ configure /
  kiểm gstreamer1.0-gl của #84? trước khi dpkg.log bị reset bởi
  reboot #85? — bracket #84? chỉ có 1.545/221 + dòng cuối. Replay
  boot #85? lúc 00:00:31Z mới 2 dòng / 0 installs, chưa thấy
  tiến trình apt chạy — T5-134 chủ quản postboot, T2 chỉ ghi bracket.
- **Đợt 134 lúc T2 đóng (~00:05Z 18/11):** T7 đã có LIMITS trên đĩa
  (cửa BẨN — 2 slot thiếu mới trong khung chết reboot #83?→#84?);
  các luồng khác đang chạy; boot hiện tại #85? (kiểm 00:02:08Z).
  Hạn cứng đóng đợt 02:35Z 18/11 (theo brief T2). T2 KHÔNG mở Xvfb
  (không cần) nên không có gì để kill — luật đứng đợt 127 §12.1.3
  không phát sinh việc.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 23:45:05Z | boot_id `d2e66749-2840-49f8-930d-7e54c9554b96`; `who -b` Nov 17 23:27; `uptime -s` **2026-11-17 23:26:58**; btime **1794958018 = 2026-11-17T23:26:58Z**; journal chỉ 1 boot (d2e66749, first entry 23:27:09Z, last 23:44:54Z lúc kiểm tra). MemAvailable 527.476 kB lúc 23:45:05Z. (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot 3e7a7b51 đã mất theo reboot #84?, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 23:46:54Z | **DEAD/STALE**, heartbeat n=52, ts 20:42:56Z, boot 07da9c50, age **11.038 s** (đúng 3h03'58"); last sample probe #52; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 23:46:54Z | **probe #53, boot=d2e66749, ok=2 fail=0**, exit 0; dòng `boot changed 07da9c50 -> d2e66749` (uptime since 2026-11-17 23:26:58) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~23:46:54Z | **ALIVE**, age 0 s, n=53, exit 0 |
| Xác minh boot lại (sau probe) | 23:47:11Z | Cùng boot d2e66749, `uptime -s` 23:26:58Z, journal first entry 23:27:09Z, last 23:46:04Z |
| **Reboot giữa phiên — xác minh boot lần 3** | 23:57:48Z + 23:59:02Z + 00:00:02Z + 00:02:08Z | **Boot MỚI `81335571-099d-4896-b180-620577ac8140`, `uptime -s` 2026-11-17 23:53:17, btime 1794959597** (khớp /proc/stat btime); `who -b` Nov 17 23:53; journal chỉ 1 boot (81335571, first entry 23:53:34Z). Reboot #84?→#85? xảy ra giữa 23:47:11Z và 23:53:17Z — TRONG phiên T2, SAU probe #53. |

Kiểm lại từ đĩa: log probe v2 **151 dòng** — 148 sau T2-133 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #52 +
dòng `boot changed` + dòng probe #53). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #52 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=53, ts 2026-11-17T23:46:54Z, boot
d2e66749-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #84?: 6 session T2 trong vùng C (xem §2.3)
+ 28 mốc mtime gộp trong vùng C (mốc đầu 23:35:36Z — system_prompt.md
của parent; mốc cuối 23:46:50Z — file của luồng đợt 134) + 2 exec-log
nhắc d2e66749. **Số thứ tự TẠM THỜI** (như
#69/#70/#71/#72/#73/#74/#75/#76/#77/#78?/#79?/#80?/#81?/#82?/#83?;
T6-134 sẽ chốt chuỗi tương đối, số tuyệt đối vẫn tạm).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #53 (20:42:56Z → 23:46:54Z 17/11, 3h03'58")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #53: `uptime -s` = **2026-11-17 23:26:58Z**,
  boot_id `d2e66749-2840-49f8-930d-7e54c9554b96` — khác boot của
  probe #52 (07da9c50).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (23:45:05Z): chỉ **1 boot**
  (d2e66749, first entry 23:27:09Z, last 23:44:54Z). Journal/wtmp
  của boot 3e7a7b51 đã mất theo reboot #84? — như mọi lần trước,
  chỉ giữ boot hiện tại. (Sau reboot #85? giữa phiên, journal chỉ
  còn boot 81335571 — xem §2.2 cuối.)
- **dpkg.log boot #84? — bracket ghi trong lượt, TRƯỚC reboot
  #85? (bài học T7-125 §4 mục 4: kiểm boot trước MỖI lần đọc
  /var/log).** Lúc 23:47Z file có **1.545 dòng, 221 dòng "status
  installed"** — khớp hình dạng #82?/#83? (1.545/221); gói cuối
  gstreamer1.0-tools 23:37:47Z (boot +10m49s). **Hạn chế: T2
  KHÔNG kịp ghi giờ configure / kiểm gstreamer1.0-gl của #84?**
  trước khi dpkg.log bị reset bởi reboot #85? 23:53:17Z (xem §4
  mục 4) — bracket #84? của T2 chỉ có 1.545/221 + dòng cuối.
  **Hồ sơ đầy đủ thuộc về T5-134 (chủ quản postboot)** — T5 xác
  nhận chính thức cho boot #85?; bracket #84? của T2 chỉ là xác
  nhận hình dạng.
- **dpkg.log của boot #83? đã MẤT** (file lúc T2 kiểm chỉ còn
  bracket #84? rồi #85?): /var/log reset mỗi boot. Bản ghi T10-133
  (replay #83? 1.545 dòng / 221 installs, xong 21:56:14Z) là bằng
  chứng duy nhất còn lại cho bracket #83? — cùng mẫu như
  journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**CÓ reboot giữa phiên T2 lượt này:** boot d2e66749 xác minh lúc
23:45:05Z (mở lượt) và 23:47:11Z (sau probe #53) — cùng boot_id +
btime 23:26:58Z; tới 23:57:48Z đã là boot mới 81335571 (#85?,
btime 23:53:17Z). Reboot xảy ra giữa 23:47:11Z và 23:53:17Z, sau
khi probe #53 xong, trước khi quét WFS bắt đầu (23:56:25Z).
Probe #53 và mù #53 KHÔNG bị ảnh hưởng (cửa sổ mù đóng 23:46:54Z,
trước reboot); quét WFS + EPERM sweep + RAM-max chạy trên boot
#85? nhưng đều đếm dữ liệu trên đĩa (code / log / mtime) nên
không đổi kết quả — ghi rõ để khỏi hiểu lầm (xem §4 mục 5).
(Tiền lệ: T2-131 cũng gặp reboot giữa phiên, sau khi đo xong.)

### 2.2 Reboot đã chốt trong mù — #83? + #84? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 83? | **21:41:40Z** (chính xác từng giây) | 07da9c50 → 3e7a7b51 | Chốt từ đợt 133 (T10-133 §10.2): `uptime -s` + btime + `who -b` + journal 1 boot + 4 session trong vùng B mù #53 + 59 mốc mtime gộp vùng B (mốc đầu 21:42:44Z, mốc cuối 22:16:31Z). **Số thứ tự TẠM THỜI.** |
| 84? | **23:26:58Z** (chính xác từng giây) | 3e7a7b51 → d2e66749 | Chốt từ lượt này: `uptime -s` đọc tươi (23:45:05Z + kiểm lại 23:47:11Z) + btime 1794958018 + `who -b` 23:27 + boot_id d2e66749 + journal first entry 23:27:09Z + probe #53 23:46:54Z boot d2e66749 ok=2 fail=0 + 6 session trong vùng C. **Số thứ tự TẠM THỜI.** |

**Clock:** F84? ≈ **−1 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` cả 3 server đều
khớp **+1 tới +2 s** (server hơn local 1–2 s cả ba: example.com,
google.com, cloudflare.com — local epoch đọc ngay sau mỗi lần
fetch nên độ lệch thật ~−1 s; cả ba server đều cho Date =
local_after + 1 s). **F84? là lần đo trực tiếp đầu tiên trên boot
#84?** — không dùng cận hai lần đo. F82? ≈ −1 s (±~1 s, đã kiểm
đợt 133). **F83? CHƯA TỪNG đo trực tiếp** — không có phiên T2 nào
trên boot #83? trước khi nó chết (T10 đóng đợt 133 trên boot đó
nhưng không đo F). Hai boot kề đều F ≈ −1 s — đồng hồ local ổn
định ở mức chậm ~1 s; ghi đúng số đo, không ép về "≈ 0".

**CẬN NHẢY CLOCK TẠI #83? — 0 nhân chứng nhảy (cận LỎNG):**
- **0 nhân chứng nhảy tại #83?:** **0 session** sinh trước
  21:41:40Z có mtime sau 21:41:40Z (quét 213 exec-log).
- Quan sát cuối trước #83? theo session: mtime **21:25:45Z** —
  cách btime 955 s nên cho cận session **|X83?| < 955 s**.
  Quan sát cuối theo mốc đĩa gộp: **21:27:58Z** — cách btime
  822 s nên cho cận đĩa **|X83?| < 822 s**. Cả hai đều LỎNG
  (máy yên sau khi các luồng đợt 133 xong ~21:28Z; T10 chỉ spawn
  lại 21:52Z, đã sang boot mới). Cận này lỏng hơn nhiều so với
  |X82?| < 15 s đợt 133 — ghi rõ, không giấu. Tuy nhiên F82? và
  F84? đều đo trực tiếp ≈ −1 s: một bước nhảy >10 s tại #83?
  (nếu có) sẽ đòi thêm một bước nhảy ngược tại #84? để quay về
  −1 s — xem §2.5 về cách caveat này được xử lý theo tiền lệ.
- Session sớm nhất sau #83?: birth **21:43:56Z** (mtime 21:43:56Z
  — phiên T10 spawn sau reboot).
- **Không có file lệch ranh giới kiểu mù #50:** 0 file có mtime
  trong (btime +0 s, +10 s] và 0 file trong [btime −10 s, btime]
  ở #83? (xem §2.4). File cuối đoạn A là round133-t8.done
  21:27:58Z (−822 s), file đầu đoạn B là 21:42:44Z (+64 s).

**CẬN NHẢY CLOCK TẠI #84? — 0 nhân chứng nhảy:**
- **0 nhân chứng nhảy tại #84?:** **0 session** sinh trước
  23:26:58Z có mtime sau 23:26:58Z (quét 213 exec-log).
- Quan sát cuối trước #84? theo session: **KHÔNG CÓ** session nào
  có mtime trong 1h trước btime #84? (máy yên từ 22:16:31Z; session
  muộn nhất trong vùng B là 22:04:37Z) — không tính được cận session
  cho |X84?|; F84? đo trực tiếp (±~1 s) là bằng chứng chính.
- Session sớm nhất sau #84?: birth **23:36:47Z** (mtime 23:36:48Z
  — phiên main agent 567fb595, spawn lượt cron đợt 134).
- **Không có file lệch ranh giới kiểu mù #50:** 0 file có mtime
  trong (btime +0 s, +10 s] và 0 file trong [btime −10 s, btime]
  ở #84? (xem §2.4). File cuối đoạn B là LIMITS gộp 133 22:16:31Z
  (−4.227 s), file đầu đoạn C là system_prompt.md 23:35:36Z
  (+518 s).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #82?→#83? = **7.645 s (2h07'25")** — **CHỨNG NHẬN DẠNG
  KHOẢNG [7.635 s, 7.655 s]** (đoạn A mù #53 đóng + đoạn B mù #52
  đóng bằng uptime, xem §2.3 + §2.5).
- Gap #83?→#84? = **6.318 s (1h45'18")** — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #53 mở, tối đa 3 ẩn, xem §2.3).
- Gap #84?→#85? = **1.579 s (26'19")** — **danh nghĩa, SPAN**
  (mù #54 chưa điều tra; việc của T2 đợt 135).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):**
  #84? từ #83? dự kiến [22:14:40Z, 00:08:47Z 18/11] (p10–p90 FULL61:
  p10 0h33'00" = 1.980 s, p90 2h27'07" = 8.827 s; cộng từ btime
  #83? 21:41:40Z); thực tế **#84? 23:26:58Z NẰM TRONG dải** (lần
  thứ mười bốn liên tiếp trong dải). **#85? từ #84? dự kiến
  [00:00:09Z, 01:53:57Z 18/11] (p10–p90 FULL62: p10 0h33'11" =
  1.991 s, p90 2h26'59" = 8.819 s; cộng từ btime #84? 23:26:58Z);
  thực tế #85? 23:53:17Z NẰM NGOÀI dải — sớm hơn cận dưới 412 s
  (lần ngoài dải đầu tiên kể từ #70, đợt 125 — cũng tới sớm).**
  (Chênh 1 s so với bản in của blind53-gaps.py [00:00:08Z] do p10
  float bị cắt khi đổi sang datetime — cùng mẫu T2-133 §4 mục 1;
  không đổi verdict: #85? sớm hơn cận dưới 411–412 s theo cả hai
  cách tính.)
- **#70 tới sớm hơn cả cận dưới p10 (đợt 125):** dải từ #69 là
  [21:11:16Z, 23:29:41Z]; #70 thật 20:54:19Z — ghi nhận đợt 125,
  không đổi lượt này. #85? là trường hợp sớm thứ hai trong chuỗi.

**Khung chết #83? (mới): (22:16:31Z, 23:26:58Z] (4.227 s =
1h10'27")** — mốc muộn nhất trên đĩa trước btime #84? là LIMITS
gộp 133 (22:16:31Z); không có hoạt động nào trong bất kỳ phạm vi
nào (repo-1 + hidden_files + ngoài cây + /tmp + goals-ngoài-
hidden_files) sau đó tới reboot. T7-134 độc lập ghi nhận khung im
lặng scheduler (22:15:34Z, 23:35:37Z] — mốc 22:15:34Z của T7 nằm
sát mốc 22:16:31Z của T2 (chênh 57 s), hai nguồn khớp nhau về
khoảng máy yên. Tuổi thọ boot #83? theo khung này: 34'51"–1h45'18".

**Khung chết #82? — T2 QUYẾT: NHẬN bản hẹp làm chuẩn (mới, §0):**
ghi cả hai — chính (21:28:35Z, 21:41:40Z] (785 s, mtime
build-loop-log — nay chỉ còn trong hồ sơ T6, file đã bị viết lại)
và hẹp **(21:29:47Z, 21:41:40Z] (713 s, mtime thư mục exec-logs
của agent 9e39f4db-…)**. **T2 NHẬN bản hẹp làm chuẩn**, lý do:
(a) mtime thư mục là mốc filesystem thật — T10 quan sát trực tiếp
lúc 21:55Z và kiểm lại (vẫn 21:29:47Z, thư mục trống); một file
tạm đã được tạo rồi xóa trong đó lúc 21:29:47Z, tức có hoạt động
ghi đĩa thật trên boot cũ tại thời điểm đó; (b) 21:29:47Z sớm hơn
btime 11m53s — ngoài xa mọi sai số đồng hồ (±~1 s), nên không thể
là hoạt động của boot mới; (c) tiền lệ quyết parent đợt 130
§12.3(f) / 131 §12.3(c) / 132 §12.3(c): **khung hẹp nhất làm
chuẩn**. **Caveat giữ nguyên:** hoạt động 21:29:47Z KHÔNG quy
trách nhiệm được cho luồng nào (thư mục trống, không còn dấu vết
file) — khung hẹp thu hẹp cửa sổ chết nhưng không cho biết ai đã
hoạt động lúc đó. Tuổi thọ #82? theo khung hẹp: 1h55'32"–2h07'25";
theo khung chính: 1h54'20"–2h07'25".

**Reboot #84?→#85? GIỮA PHIÊN T2 (mới) — và chuỗi gộp:**
- #85? xảy ra GIỮA PHIÊN T2 (sau probe #53 23:46:54Z, trước quét
  WFS 23:56:25Z) — reboot giữa lượt/quanh đợt **lần thứ 9 liên
  tiếp** theo định nghĩa gộp của T10 (LIMITS gộp 133 §10.2: mọi
  reboot quanh đợt, cả giữa lượt lẫn ranh giới). Chuỗi gộp:
  đợt 129 giữa lượt (#75→#76), đợt 130 ranh giới (#76?→#77?) +
  giữa lượt (#77→#78?), đợt 131 giữa lượt (#79?→#80?), đợt 132
  ranh giới (#80?→#81?) + giữa lượt (#81?→#82?), đợt 133 giữa
  lượt (#82?→#83?), giữa đợt 133/134 (#83?→#84?, sự kiện thứ 8),
  đợt 134 giữa lượt (#84?→#85?, **sự kiện thứ 9**). **Các đợt
  129–134 đều có ≥1 reboot (6 đợt liên tiếp).** Từ đợt 134, mọi
  luồng dùng MỘT định nghĩa duy nhất này (F-133-6 đã chốt).
- Tuổi thọ boot #84?: 23:26:58Z → 23:53:17Z = **1.579 s (26'19")**
  — ngắn nhất trong chuỗi gần đây (#79? 2.089 s, #83? 6.318 s,
  #82? 7.645 s, #81? 7.807 s, #80? 8.558 s). Boot #84? chết khi
  đợt 134 vừa mở (cron 23:35:51Z) — các luồng đợt 134 spawn trên
  #84? đã bị giết và phải chạy lại trên #85? (T7-134 ghi nhận
  slot HB/DR thiếu trong khung chết này).
- **Số thứ tự TẠM THỜI** (như #69–#84?; chuỗi tương đối #57→#84
  do T6-134 chốt, số tuyệt đối vẫn tạm; giá trị gap không phụ thuộc
  số thứ tự).

### 2.3 Hoạt động trong khoảng mù — A đóng, B MỞ tối đa 3 ẩn, C đóng (KHÔNG ĐÓNG HOÀN TOÀN)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **11 file** +
hidden_files **316 file**; **327 file, 317 mốc float phân biệt /
176 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3/T2-133 §2.3 —
"mốc" là mtime float phân biệt, không phải giây tròn).
Ngoài hai cây: **78 file** (agents — exec-log/tool-output chiếm đa
số + system/memory/proactivity/feed; chi tiết xem
blind53-outside.txt); **/tmp: 0 file** trong mù #53 (xem
blind53-tmp.txt — tmpfs bị xóa bởi reboot #84?; xem caveat §2.4).
Gộp cả 4 phạm vi: **208 mốc giây phân biệt**. Chia mù làm ba
đoạn bởi #83? (21:41:40Z) và #84? (23:26:58Z):

- **Đoạn A: 20:42:56Z → 21:41:40Z (58'44" = 3.524 s, boot #82?
  07da9c50) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả — xem phân tích dưới):**
  - **182 mốc** (hai cây), lỗ lớn nhất hai cây **822 s**
    (21:27:58Z → 21:41:40Z — chính là đuôi A); lỗ lớn thứ hai
    chỉ 275 s. Mốc đầu 20:42:56Z (head 1 s — chính probe #52);
    mốc cuối hai cây **21:27:58Z** (đuôi hai cây **822 s** <
    sàn 1.147 s). **10 session** chạm đoạn A.
  - **Merged 4 phạm vi: 120 mốc, lỗ lớn nhất 822 s** (cùng đuôi
    21:27:58Z → 21:41:40Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc cuối gộp **21:27:58Z** (đuôi gộp **822 s** < sàn); mốc
    đầu gộp 20:43:04Z (head 8 s).
  - Lần này merged KHÔNG đảo verdict hai cây (khác mù #52, nơi
    merged đảo MỞ→ĐÓNG): hai cây đã cho lỗ đuôi 822 s < sàn;
    ngoài cây chỉ thêm 2 mốc đuôi A (session 21:25:45Z +
    paths-loop t8 21:27:58Z) mà không đổi lỗ quyết định.
  - Cửa sổ sàn [A-lo=21:02:03Z, A-hi=21:22:33Z] có mốc dày đặc ở
    cả 4 phạm vi (T5 watcher b84 poll tới 21:04:29Z, T8 waiter
    chạy tới 21:23:09Z, T6/T1/T2 đợt 133 viết LIMITS tới ~21:12Z).
    2 session bắc qua cắt A-lo, 1 session bắc qua cắt A-hi.
  - Quan sát cuối đoạn A: round133-t8.done + paths-loop
    phase9-round133-t8-viteharness.txt 21:27:58Z. Sau 21:27:58Z
    máy yên 13'42" tới reboot #83? (đuôi gộp 822 s — < sàn nhưng
    là đuôi dài nhất trong các đoạn đóng gần đây).
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn** (lỗ lớn nhất gộp
    822 s < sàn).
- **Đoạn B: 21:41:40Z → 23:26:58Z (1h45'18" = 6.318 s, boot #83?
  3e7a7b51) — MỞ, tối đa 3 ẩn:**
  - **97 mốc** (hai cây), lỗ lớn nhất hai cây **4.226 s**
    (22:16:31Z → 23:26:58Z — chính là đuôi B); lỗ lớn thứ hai
    chỉ 384 s. Mốc đầu 21:42:44Z (head 64 s — T10 spawn sau
    reboot); mốc cuối hai cây **22:16:31Z** (đuôi hai cây
    **4.226 s** > sàn 1.147 s). **4 session** chạm đoạn B.
  - **Merged 4 phạm vi: 59 mốc, lỗ lớn nhất 4.227 s** (cùng đuôi
    22:16:31Z → 23:26:58Z), floor=3 → **MỞ, tối đa 3 ẩn**.
    Mốc đầu gộp 21:42:44Z (head 64 s), mốc cuối gộp 22:16:31Z
    (đuôi 4.227 s).
  - **0 session chạm đuôi B** (23:07:51Z, 23:26:58Z], **0 file
    trong đuôi B ở cả 4 phạm vi** (repo-1 0, hidden_files 0,
    ngoài cây 0, /tmp 0). 1 session bắc qua cắt B-lo (T10 suite
    21:57:12Z–22:02:06Z); **0 session bắc qua cắt B-hi.**
  - Đuôi B là khoảng máy yên thật: T10 đóng đợt 133 xong 22:12Z
    (LIMITS gộp viết lần cuối 22:16:31Z — muộn hơn mốc đóng
    22:12Z mà T10 báo cáo 4'19"; ghi nhận, không suy diễn), sau
    đó không còn luồng nào chạy cho tới khi cron đợt 134 mở
    23:35:51Z (đã sang boot mới). Không có bằng chứng nào — kể
    cả ngoài cây — về hoạt động trong (22:16:31Z, 23:26:58Z].
  - **Kết luận đoạn B: MỞ — tối đa 3 ẩn** (lỗ lớn nhất gộp
    4.227 s; floor(4.227/1.147)=3). Gap #83?→#84? giữ SPAN.
- **Đoạn C: 23:26:58Z → 23:46:54Z (19'56" = 1.196 s, boot #84?
  d2e66749) — ĐÓNG bằng đo uptime trực tiếp + luật lỗ:**
  - **`uptime -s` lúc 23:45:05Z = 23:26:58Z** chứng minh máy up
    liên tục từ #84? tới lúc đo; probe #53 23:46:54Z đọc boot_id
    d2e66749 tươi — cùng boot_id với boot bắt đầu 23:26:58Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C, T2-132 §2.3 đoạn C, T2-133 §2.3 đoạn B.)
  - **38 mốc** (hai cây), lỗ lớn nhất **673 s** (23:26:58Z →
    23:38:10Z — head, do cron đợt 134 chỉ mở 23:35:51Z);
    mốc cuối **23:46:50Z** (đuôi **3 s** < sàn). **6 session**
    chạm đoạn C (đều là phiên đợt 134 / main agent).
  - **Merged 4 phạm vi: 28 mốc, lỗ lớn nhất 518 s** (23:26:58Z →
    23:35:36Z — head), floor=0 → **ĐÓNG cả theo luật lỗ**
    (không chỉ uptime). Mốc đầu gộp 23:35:36Z (head 518 s —
    system_prompt.md của parent), mốc cuối gộp 23:46:50Z
    (đuôi 4 s).
  - Đoạn C ngắn hơn 2×sàn (1.196 s < 2.294 s) nên không có cửa
    sổ sàn / cắt floor — uptime là closer, luật lỗ chỉ là kiểm
    chứng thêm.
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #53 KHÔNG ĐÓNG HOÀN TOÀN.**
Đoạn A đóng (merged), đoạn B MỞ tối đa 3 ẩn, đoạn C đóng (uptime +
luật lỗ). 2 reboot đã chốt giờ (#83? 21:41:40Z + #84? 23:26:58Z —
chính xác từng giây trên đĩa) + **tối đa 3 ẩn** (đoạn B). Chuỗi mù
đóng hoàn toàn đứt sau một mù đóng (#52): #50 đóng, #51 hở, #52
đóng, #53 hở.

Ngoài hai cây: **78 file** có mtime trong mù #53 (agents —
exec-log/tool-output chiếm đa số + system/memory/proactivity/feed;
chi tiết xem blind53-outside.txt); **/tmp: 0 file** trong mù #53
(xem blind53-tmp.txt + caveat §2.4). Boot_id nhắc trong
exec-log sinh/viết trong mù: 07da9c50 5 file, 3e7a7b51 2 file,
d2e66749 2 file (phiên T2 này nằm trong số đó).

### 2.4 Gộp 4 phạm vi + 2 phát hiện mới (phương pháp nối tiếp T2-133 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind53-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 120 mốc, lỗ lớn nhất **822 s** (21:27:58Z →
  21:41:40Z), floor=0 → **ĐÓNG** (khớp verdict hai cây; ngoài
  cây + /tmp không đổi lỗ quyết định — khác mù #52).
- Đoạn B gộp: 59 mốc, lỗ lớn nhất **4.227 s** (22:16:31Z →
  23:26:58Z), floor=3 → **MỞ, tối đa 3 ẩn**.
- Đoạn C gộp: 28 mốc, lỗ lớn nhất **518 s** (23:26:58Z →
  23:35:36Z), floor=0 → **ĐÓNG**.
- Tổng gộp 208 mốc giây. Không có file nào trong
  `~/workspace/goals` ngoài hidden_files có mtime trong mù (kiểm
  bằng find riêng — vùng duy nhất hai lần quét chính không phủ,
  đã kiểm bổ sung, 0 file).

**Phát hiện 1 — /tmp 0 file trong toàn bộ mù #53: tmpfs bị xóa
bởi reboot, không phải bằng chứng máy yên (mới):** /tmp trên VM
này là tmpfs — reboot #84? (23:26:58Z) xóa mọi file /tmp viết
trước đó, và reboot #85? (23:53:17Z) xóa tiếp phần còn lại trước
khi T2 quét. Vì vậy merged cho đoạn A/B **không có đóng góp /tmp**
— khác mù #52 (669 file /tmp, chủ yếu node-compile-cache của
suite T10 viết sau reboot #82?, còn sống tới lúc T2 quét).
**Verdict không đổi:** đoạn A đóng với lỗ 822 s < sàn ngay cả
khi không có /tmp; đoạn B mở vì đuôi 4.227 s là khoảng máy yên
thật — mọi file /tmp của suite T10 (21:57–22:04Z) nếu có cũng
chỉ nằm giữa đoạn B, không chạm đuôi B (23:07:51Z, 23:26:58Z]
nơi không còn luồng nào chạy. Ghi rõ caveat để luồng sau khỏi
hiểu "0 file /tmp" là máy chết.

**Phát hiện 2 — Ranh giới #83?/#84? sạch, không có file lệch
kiểu mù #50 (mới):** 0 file có mtime trong (btime +0 s, +10 s]
và 0 file trong [btime −10 s, btime] ở CẢ HAI reboot (kiểm bằng
code trong blind53-merged.py). File cuối đoạn A là round133-t8.done
21:27:58Z (−822 s) và file đầu đoạn B là 21:42:44Z (+64 s);
file cuối đoạn B là LIMITS gộp 133 22:16:31Z (−4.227 s) và file
đầu đoạn C là system_prompt.md 23:35:36Z (+518 s). Khác mù #50
(4 file T4-attempt3 ở 13:02:42Z, +1 s sau btime #78?, lệch đồng hồ
cũ ~1 s): lần này không có bằng chứng lệch đồng hồ cũ nào ở ranh
giới — cận nhảy clock |X83?| < 822 s từ mốc đĩa (§2.2) là bằng
chứng tốt nhất, và F84? đo trực tiếp (±~1 s) là bằng chứng chính.
Không đổi verdict nào (đoạn A đóng cả khi tính lệch vài giây;
đoạn B mở vì đuôi 4.227 s, không vì lệch vài giây).

### 2.5 Phân phối gap — CERT n=46 → n=47 / FULL n=61 → n=62 (1 gap mới CHỨNG NHẬN DẠNG KHOẢNG)

**Gap #82?→#83? = [7.635 s, 7.655 s] (mid 7.645 s) CHỨNG NHẬN DẠNG
KHOẢNG (mới)** — đoạn A mù #53 đóng (merged, §2.3) + đoạn B mù
#52 đóng bằng uptime (T2-133 §2.3). Biên ±10 s của T5 dùng nguyên
văn; mid không dịch chuyển (thực hành của T5). Caveat: **F83?
CHƯA TỪNG đo trực tiếp** (không có phiên T2 nào trên boot #83?);
cận nhảy clock tại #83? |X83?| < 822 s từ mốc đĩa cuối (LỎNG —
máy yên sau 21:27:58Z) và |X83?| < 955 s từ session. Tuy nhiên
**F82? ≈ −1 s VÀ F84? ≈ −1 s đều đo trực tiếp** — đồng hồ local
ổn định ở −1 s ở cả hai boot kề; một bước nhảy >10 s tại #83?
sẽ đòi thêm một bước nhảy ngược tại #84?. Tiền lệ: gap #72→#73
chứng nhận dạng khoảng đợt 128 trong khi F73 cũng chưa từng đo;
gap #75→#76 chứng nhận dạng khoảng đợt 130 trong khi F76 cũng
chưa đo; gap #77→#78? chứng nhận dạng khoảng đợt 131 trong khi
F78 cũng chưa đo; gap #79?→#80? chứng nhận dạng khoảng đợt 132
trong khi F80? cũng chưa đo — cả bốn đã được parent chấp nhận.
Không áp hint hướng nào.

**Gap #83?→#84? = 6.318 s (1h45'18") VẪN CHỈ LÀ SPAN** — đoạn B
mù #53 mở (tối đa 3 ẩn). **CERT/FULL không tính gap này.**

**Gap #81?→#82? = [7.797 s, 7.817 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 133 (đoạn A mù #52 đóng). Không đổi lượt này.

**Gap #80?→#81? = 8.558 s (2h22'38") VẪN CHỈ LÀ SPAN** — đoạn B
mù #51 mở (tối đa 3 ẩn; KHÔNG kiểm lại đợt này — xem §2.6).
**CERT/FULL không tính gap này.**

**Gap #79?→#80? = [2.079 s, 2.099 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 132 (đoạn A mù #51 đóng). Không đổi lượt này.

**Gap #78?→#79? = [5.030 s, 5.050 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 131 (đoạn B mù #50 đóng). Không đổi lượt này.

**Gap #77→#78? = [7.560 s, 7.580 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 131 (đoạn A mù #50 đóng). Không đổi lượt này.

**Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
#49 mở (T2-131 §2.3; KHÔNG kiểm lại lượt này theo quyết parent
đợt 132 §12.3(d) — xem §2.6). **CERT/FULL không tính gap này.**

**Gap #75→#76 = [6.511 s, 6.531 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 130 (đoạn A mù #49 đóng). Không đổi lượt này.

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

**Cross-check tái hiện T2(133) 100%:** chạy blind52-gaps.py
verbatim cho lại đúng CERT n=46 / FULL n=61 của T2 đợt 133 (xem
blind53-gaps.txt: CERT46 mean 1h40'47" median 1h52'28" p10
0h33'18" p90 2h22'30" sd 0h42'37" min 0h19'07" max 3h14'08";
FULL61 mean 1h47'06" median 1h54'16" p10 0h33'00" p90 2h27'07"
sd 0h55'39" min 0h19'07" max 5h43'18"; in 90–150' = 33, <60' = 12,
>180' = 6, >240' = 2 — khớp T2-133 §2.5 từng số). Gap mới vào
(A đóng) nên cả CERT lẫn FULL đều +1.

- **CERT n=47 (mới):** mean 1h41'21" median 1h54'16" p10 0h33'36"
  p90 2h22'10" sd 0h42'20" min 0h19'07" max 3h14'08".
- **FULL n=62 (mới):** mean 1h47'26" median 1h54'38" p10 0h33'11"
  p90 2h26'59" sd 0h55'15" min 0h19'07" max 5h43'18"; in 90–150'
  = 34, <60' = 12, >180' = 6, >240' = 2.
- Độ nhạy biên LO/HI của gap mới: CERT47 mean chỉ dao động ±1 s
  (1h41'20"–1h41'21"), FULL62 mean không đổi (1h47'26" cả hai
  biên) — biên ±10 s không làm lệch phân phối.
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới 7.645 s
  = 2h07'25" nằm trong dải; gap #83?→#84? 6.318 s cũng nằm trong
  dải nhưng chưa chứng nhận nên không vào).
- **Tốc độ reboot (đồng hồ ghi nhận):** 84 / 171,15 h = **1 reboot
  mỗi 122,2 phút** (từ #1 2026-11-10T20:18:10Z tới #84?
  2026-11-17T23:26:58Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 88 / 171,15 h = **1 mỗi 116,7 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn G1 (+4), mù #46
  đoạn A (+4), mù #48 đoạn A (+2), mù #49 đoạn B (+1), mù #51
  đoạn B (+3) và mù #53 đoạn B (+3). Mù #50: **+0** (đóng hoàn
  toàn). Mù #52: **+0** (đóng hoàn toàn). Mù #53: **+3** (đoạn B
  mở — mới).
- **#83? vào dải cơ học (xem §2.2):** lần thứ mười ba liên tiếp
  trong dải (ghi nhận T6-133). **#84? vào dải cơ học:** lần thứ
  mười bốn liên tiếp trong dải. **#85? NGOÀI dải cơ học** (sớm hơn
  cận dưới 412 s) — **đứt chuỗi 14 lần INSIDE** (lần ngoài dải
  đầu tiên kể từ #70).

### 2.6 Mù #51 B + mù #49 B: KHÔNG kiểm lại đợt này (ghi rõ lý do)

- **Mù #51 B: KHÔNG kiểm lại đợt này.** Đã kiểm lại 3 lần (đợt
  131, 132, 133) với cùng verdict (lỗ lớn nhất 4.393 s, tối đa
  3 ẩn); hồ sơ đã ổn định. T2 đợt này không thấy bằng chứng mới
  nào về mù #51 B (không file/session nào chạm cửa sổ #51 trong
  lúc làm việc; không chạy recheck mù #51 B). Gap #80?→#81? =
  8.558 s giữ SPAN. (Tiền lệ: không giao luồng sau kiểm lại B mù
  #51 — quyết đợt 126 §12(h) + quyết đợt 130 §12.3(e).)
- **Mù #49 B: KHÔNG kiểm lại đợt này.** Quyết parent đợt 132
  §12.3(d) đã phê duyệt bỏ mục kiểm lại thường lệ khỏi brief T2;
  chỉ kiểm lại khi có bằng chứng mới cụ thể. T2 đợt này không thấy
  bằng chứng mới nào về mù #49 B. Gap #76→#77 = 6.859 s giữ SPAN.
  Ghi rõ đã bỏ mục này theo quyết parent.

### 2.7 Quét writeFileSync lần thứ 40 — chênh 0 (lần thứ 40 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round134-t2, đã đổi OUT sang
  round134-t2) **23:56:25Z → 23:57:01Z 17/11 (36 s, có SCAN-END)**.
  **Scan chạy trên boot #85?, SAU reboot giữa phiên #84?→#85?**
  (23:53:17Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại
  trên đĩa, không phụ thuộc boot hay giờ mù (xem §4 mục 5).
- NEWSTD: **891 dòng / 248 file** (phạm vi 3.102 file); R7b đối
  chiếu: **916 dòng / 265 file** (phạm vi 12.495 file); copies:
  **25 dòng / 17 file** — y hệt lần 39 về copies. Đối chiếu chéo:
  891+25=916=R7b, **chênh 0**.
- **+4 dòng / +1 file so với lần 39** (887/247 → 891/248), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + diff
  từng dòng — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND133_T2_EPERM_LIMITS.md | +4 (0 → 4) | 21:11:11Z 17/11 | Tài liệu T2 đợt 133 (nhắc `writeFileSync` 4 lần); viết SAU scan lần 39 (21:00:07Z 17/11) nên lần này mới vào |
- Phạm vi: 3.102 = 3.094 + 8 net (**8 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 8 file mới gồm LIMITS đợt 133
  (gộp + T2, viết sau scan lần 39) + LIMITS đợt 134 đã viết trước
  scan (T7 + prereg? — prereg không nhắc writeFileSync; các file
  mới khác là LIMITS/scrips đợt 134 của luồng khác); 0 file mất).
  Copies y hệt lần 39 (diff 0 dòng).
- **Kết luận: 40 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #53.

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
  né EPERM trong mù #53.

## 3. RAM trong mù #53 — max 1.903 MB (31,0% guard), birefnet KHÔNG chạy

- **2 mẫu MemAvailable trực tiếp của lượt:**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 23:45:05Z | **527.476 kB** (515 MB) | Trước probe #53 (boot #84?, đoạn C) |
  | 23:57:48Z | **1.682.728 kB** (1.643 MB) | Sau reboot #85? — NGOÀI mù #53, chỉ ghi để thấy RAM hồi sau reboot |
  | 00:00:02Z | **1.351.580 kB** (1.320 MB) | Sau reboot #85? — NGOÀI mù #53 |
- **Max RAM biết được TRONG mù #53 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 32 mẫu RAM; **max 1.903 MB**
  (T3 wait-t4 poll, 20:57:35Z, đoạn A — đã xác minh trực tiếp dòng
  log; cùng giá trị xuất hiện 1 lần) = **31,0% ngưỡng guard** —
  thấp hơn max 3.111 MB mù #52 và thấp hơn max kỷ lục 4.576 MB
  mù #42; đoạn A max **1.903 MB**; đoạn B **0 mẫu**; đoạn C
  **0 mẫu** (không ai ghi mẫu RAM trong hai đoạn này — máy nhàn
  sau khi đợt 133 đóng; mẫu trực tiếp duy nhất trong mù của T2 là
  527.476 kB lúc 23:45:05Z, đoạn C — xem bảng trên).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 1.903 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T2 đợt 133)

1. **Prereg dự báo verdict đoạn B SAI — ghi rõ, không giấu (mới,
   §0):** prereg §2 dự báo "B đóng (merged — có hoạt động T10 đóng
   sổ + parent 22:12Z + luồng đợt 134 mở? chưa rõ; nếu B có lỗ lớn
   thì giữ mở)". Thực tế: **B MỞ, tối đa 3 ẩn** (lỗ lớn nhất gộp
   4.227 s, đuôi 4.227 s; 0 session chạm đuôi B, 0 file trong đuôi
   B ở cả 4 phạm vi). Sai vì prereg viết khi chưa quét đĩa — hoạt
   động T10 chỉ tới 22:16:31Z, sau đó máy yên hoàn toàn 1h10'27"
   tới reboot #84?. Bài học: prereg chỉ dự báo verdict sau khi đã
   quét nhanh mốc muộn nhất của đoạn — hoặc ghi rõ "chưa quét,
   kiểm lại sau". (Tiền lệ: T2-133 §4 mục 1–2 đã dặn không nhẩm số
   gap trong prereg — lần này số gap/dải tính bằng code nên đúng
   hết; chỉ verdict B là dự báo mò.)
2. **Prereg dự báo gap #83?→#84? chứng nhận được — SAI theo (mới,
   §0):** prereg §2 ghi "CHỨNG NHẬN DẠNG KHOẢNG nếu B đóng (merged)
   + C đóng bằng uptime". Vì B mở nên gap giữ SPAN. Verdict gap
   đi theo verdict đoạn B — không có gì thêm.
3. **Prereg dự báo RAM hẹp sai (mới, §0):** prereg §2 dự báo đoạn
   A max ~1.000–1.700 MB. Thực tế: A **1.903 MB** (20:57:35Z —
   đợt hồi RAM giữa lượt yên #10, T3 poll ghi 1.903 MB). Dự báo sai
   vì chỉ nhìn RAM cuối đợt 133 (thấp, ~500 MB) mà quên đợt hồi
   RAM 20:49–20:57Z (T4 gate A mở khi RAM 1.168 MB, T3 poll lên
   tới 1.903 MB). Không đổi verdict nào (vẫn < guard 6 GB); ghi rõ
   để luồng sau khỏi tưởng RAM trong mù luôn thấp. (Cùng mẫu sai
   như T2-133 §4 mục 2.)
4. **Bracket dpkg boot #84? KHÔNG ĐẦY ĐỦ — lỗi thu thập của T2
   (mới, §2.1):** lúc 23:47Z T2 chỉ ghi 1.545 dòng / 221 installs
   + dòng cuối gstreamer1.0-tools 23:37:47Z, KHÔNG ghi giờ configure
   đầu / kiểm gstreamer1.0-gl — rồi reboot #85? 23:53:17Z reset
   /var/log trước khi T2 quay lại kiểm. Bracket #84? của T2 vì vậy
   chỉ có hình dạng (1.545/221 + dòng cuối), thiếu 2 chi tiết mà
   các đợt trước đều có (configure + gstreamer1.0-gl). Bài học:
   đọc dpkg.log thì ghi ĐỦ 3 chi tiết (tổng dòng/installs + giờ
   configure đầu + gstreamer1.0-gl) trong CÙNG một lần đọc — không
   để lại lần sau, vì /var/log reset mỗi boot. T5-134 là chủ quản
   postboot cho boot #85?; bracket #84? thiếu 2 chi tiết vẫn đủ
   để kết luận "cùng hình dạng baseline" (1.545/221 khớp #82?/#83?).
5. **Quét WFS + EPERM sweep + RAM-max chạy trên boot mới #85?
   (mới, §2.7):** reboot giữa phiên #84?→#85? xảy ra 23:53:17Z,
   giữa lần xác minh boot 23:47:11Z và quét WFS 23:56:25Z. Cả ba
   phép quét đều đếm dữ liệu trên đĩa (code / log / mtime) nên
   kết quả không phụ thuộc boot — nhưng ghi rõ boot lúc quét để
   khỏi hiểu lầm là quét chạy trên #84?. Probe #53 + mù #53 không
   bị ảnh hưởng (cửa sổ đóng trước reboot).
6. **Lỗi heredoc tính cắt floor — đã bắt trước khi dùng (mới):**
   lệnh heredoc đầu tiên tính A-lo/A-hi/B-lo/B-hi lỗi ValueError
   (định dạng `%Y-%m-%dT%H:%M:%S` nhưng chuỗi dùng khoảng trắng)
   — KHÔNG dùng số nào từ đó; các cắt trong blind53-sessions.py
   viết tay và kiểm lại bằng phép cộng tay (A-lo 21:02:03Z, A-hi
   21:22:33Z, B-lo 22:00:47Z, B-hi 23:07:51Z — đều khớp code
   trong blind53-investigate.py in ra). Bài học: kiểm định dạng
   chuỗi ngày trong heredoc trước khi chạy — như T2-133 §4 mục 5
   (adapt script lỗi SyntaxError đã bắt trước khi chạy).
7. **Docstring eperm-sweep53.py ĐÃ SỬA typo kế thừa (mới):**
   T2-133 §4 mục 7 ghi docstring eperm-sweep52.py sai cửa sổ
   "(17:46:50Z -> 17:46:50Z)" — bản 53 viết đúng cửa sổ
   "(20:42:56Z -> 23:46:54Z 17/11)"; hằng số code B0/B1 đã kiểm
   bằng grep trước khi chạy.
8. **preview.tsx ĐÃ ĐỔI trong đợt 134 — theo quyết parent, không
   phải sai số (mới, §0 + §3 cuối):** md5 805409f0 → 530e10a7,
   mtime 23:47:42Z — sửa instrumentation log draw của T3-134 theo
   quyết parent đợt 133 §12.1(a) (loop-gate dòng 705 + reset mảng
   dòng 700). Có backup orig + diff + cờ round134-t3-fix.done.
   media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts KHÔNG ĐỔI ee80d093.
   T2 không sửa production file nào; T2 chỉ ghi nhận md5 mới.
9. **Dải cơ học cho #85? in 00:00:08Z vs tính tay 00:00:09Z —
   chênh 1 s do float (mới, §2.2):** blind53-gaps.py in cận dưới
   [00:00:08Z, 01:53:57Z] (p10 float bị cắt khi đổi sang datetime);
   tính tay từ p10 1.991 s cho 00:00:09Z. Cùng mẫu T2-133 §4 mục 1.
   Không đổi verdict (#85? sớm hơn cận dưới 411–412 s theo cả hai
   cách tính — NGOÀI dải).
10. **/tmp 0 file — caveat tmpfs (mới, §2.4 phát hiện 1):** merged
    đoạn A/B không có đóng góp /tmp vì reboot #84?/#85? xóa tmpfs.
    Verdict không đổi (A đóng với lỗ 822 s < sàn ngay cả khi không
    có /tmp; B mở vì đuôi 4.227 s là khoảng máy yên thật).
11. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
    (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
    model đóng/nhạc bản quyền.**
12. **Không quét toàn workspace lượt này:** chỉ dùng góc hẹp/mục
    tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ repo-1/goals
    + /tmp + exec-logs + kiểm bổ sung goals-ngoài-hidden_files).
13. **Stage batch:** chỉ 1 file text (LIMITS doc này),
    NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
    checkpoint + stage file).
14. **Ghi rõ:** số thứ tự reboot #48–#84? vẫn TẠM THỜI (T6-133
    chốt chuỗi tương đối #57→#83, số tuyệt đối vẫn tạm; T6-134
    chốt tiếp); giá trị gap không phụ thuộc số thứ tự.
15. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F83? chưa đo + cận nhảy clock
    |X83?| < 822 s (lỏng) vào hồ sơ (xem §2.2 + §2.5).
16. **Cross-check tái hiện T2(133) 100%** (CERT n=46 / FULL n=61)
    trước khi kết luận số mới — chạy blind52-gaps.py verbatim
    qua exec trong blind53-gaps.py (xem blind53-gaps.txt). Không
    dùng số nào từ lần chạy lỗi (lần chạy lỗi là heredoc tính cắt
    ở mục 6 — đã bỏ, không dùng số).
17. **Các luồng đợt 134 khác đang chạy lúc T2 đóng** — T2 chỉ ghi
    nhận trạng thái (T7 đã có LIMITS trên đĩa — cửa BẨN, 2 slot
    thiếu mới trong khung chết reboot #83?→#84?; các luồng khác
    đang chạy), không phụ thuộc kết quả các luồng đó. Verdict
    mù #53 là của riêng T2, tính bằng code riêng.
18. **T2 KHÔNG mở Xvfb** (luồng probe không cần browser) nên
    không có Xvfb nào để kill — luật đứng đợt 127 §12.1.3 (mỗi
    driver tự kill Xvfb của mình) không phát sinh việc lượt này.
19. **Replay #84? đã xong theo bracket của T2 (mới, §2.1):**
    1.545 dòng / 221 installs, gói cuối gstreamer1.0-tools
    23:37:47Z (boot +10m49s) — cùng hình dạng baseline #82?/#83?;
    T5-134 là chủ quản postboot chính thức, T2 chỉ ghi bracket
    (thiếu 2 chi tiết — xem mục 4). Replay #85? lúc 00:00:31Z mới
    2 dòng / 0 installs, chưa thấy tiến trình apt chạy — T5-134
    chủ quản, T2 chỉ ghi bracket.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #53: KHÔNG ĐÓNG HOÀN TOÀN (mới — xem §2.3).**
   Đoạn A đóng (merged), đoạn B MỞ tối đa 3 ẩn, đoạn C đóng
   (uptime + luật lỗ). 2 reboot đã chốt giờ (#83? 21:41:40Z +
   #84? 23:26:58Z) + tối đa 3 ẩn. Gap #82?→#83? chứng nhận dạng
   khoảng [7.635 s, 7.655 s]; gap #83?→#84? = 6.318 s giữ SPAN.
   **CERT n=47 / FULL n=62 (mới).**
2. **Mù #54 MỚI MỞ (từ probe #53 23:46:54Z) — việc của lượt sau:**
   probe #54 + điều tra đoạn từ #84? ở đợt 135. Dải cơ học cho
   #85? (p10–p90 FULL62): [00:00:09Z, 01:53:57Z 18/11] — #85?
   thật 23:53:17Z đã NGOÀI dải (sớm 412 s); gap #84?→#85? =
   1.579 s danh nghĩa, SPAN — chờ T2-135 kiểm mù #54.
3. **Reboot #84?→#85? GIỮA PHIÊN T2 (mới):** sự kiện thứ 9 trong
   chuỗi gộp §10.2 LIMITS-133; các đợt 129–134 đều có ≥1 reboot
   (6 đợt liên tiếp). Boot #84? sống 1.579 s — ngắn nhất chuỗi
   gần đây. **#85? NGOÀI dải cơ học** — đứt chuỗi 14 lần INSIDE.
4. **Khung chết #83? rộng (22:16:31Z, 23:26:58Z] (4.227 s)** —
   máy yên sau khi T10 đóng đợt 133; không thu hẹp được thêm từ
   đĩa (đã quét cả 4 phạm vi + goals). T7-134 ghi khung im lặng
   scheduler (22:15:34Z, 23:35:37Z] khớp sát mốc 22:16:31Z.
5. **Khung chết #82? — T2 đã quyết nhận bản hẹp (21:29:47Z,
   21:41:40Z] (713 s) làm chuẩn** (xem §2.2); hoạt động 21:29:47Z
   không quy trách nhiệm được (thư mục exec-logs trống). Ghi cả
   hai bản; parent có thể bác quyết này.
6. **Gap #80?→#81? = 8.558 s VẪN CHỈ LÀ SPAN** (đoạn B mù #51 vẫn
   mở tối đa 3 ẩn; không kiểm lại đợt này, xem §2.6). Gap
   #76→#77 = 6.859 s giữ SPAN (mù #49 B không kiểm lại thường lệ
   nữa theo quyết parent đợt 132 §12.3(d)).
7. **Khung chết #82? hai bản ghi** — T2 đã quyết nhận bản hẹp
   (mục 5 trên); bản chính vẫn ghi đầy đủ.
8. **Số boot vẫn tạm (giữ "?")** — chuỗi tương đối #57→#83 đã
   chốt theo T6-133, T6-134 chốt tiếp (#84? + #85?); mù #53 mở
   tối đa 3 ẩn — không thêm ẩn danh nghĩa nào mới ngoài 3 ẩn
   đoạn B (đã tính vào tốc độ reboot ở §2.5).
9. **EPERM vẫn KHÔNG được tuyên bố là đã hết** — sóng gần nhất
   ~11:55–12:11Z 11/11 (~155h36' trước probe #53); 0 sóng thật
   trong mù #53. Probe thường lệ tiếp tục đợt sau.
10. **Headroom / RAM / birefnet:** T9-134 chủ quản; T2 chỉ ghi RAM
    trong mù (max 1.903 MB, 31,0% guard; đoạn B/C 0 mẫu).
    Birefnet chỉ thử lại khi quan sát được available ≥ 6 GB;
    u2net là fallback chính thức. **TTS 39 cấm kiểm lại.**
    **ci-security.yml vẫn 403 chờ user.** **Release gate không
    đổi** (không release/tag cho đến khi ngang hoặc hơn CapCut
    thật). **KHÔNG push khi user chưa nhắn "push đi".**
11. **Lượt yên WebKit #11 + T3 bước 2 (logger đã nới) + T5 pha 2:**
    T4/T3/T5 đợt 134 chủ quản (sửa instrumentation theo quyết
    parent đợt 133 §12.1(a) — preview.tsx đã đổi md5 530e10a7);
    T2 không phụ thuộc kết quả các luồng đó.
12. **R9 (a): VẪN CHỜ user (nhắc lần 16 — KHÔNG tăng số đếm).**
    Không thay đổi, không hỏi lại user.
13. **G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã hỏi
    13:44 16/11, chưa trả lời). Không thay đổi.
