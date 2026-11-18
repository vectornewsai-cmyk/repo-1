# PHASE9 ROUND125 T7 — EPERM: probe #44 + mù #44 MỚI (đoạn D MỞ, E ĐÓNG) + boot #69 + REBOOT #70 GIỮA PHIÊN (20:54:19Z — đính chính §2.1) + WFS lần 31 chênh 0 + RAM max 3.431 MB

> Luồng T7, đợt 125 vòng lặp Phase 9 VCut Studio (lượt cron 03:35 +07,
> 17/11/2026; làm việc 20:41Z → 21:03Z 16/11/2026).
> Nhiệm vụ: probe #44 + mù #44 (MỚI — cửa sổ từ probe #43 tới probe #44)
> điều tra + boot #69 ghi nhận + EPERM sweep + WFS lần 31 + RAM (birefnet:
> KHÔNG chạy — vẫn dưới ngưỡng guard + quyết parent §12.7, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round125-t7/prereg-t7.md (định nghĩa probe #44, mốc đối
> chiếu, dự báo đoạn D KHÔNG ĐÓNG ĐƯỢC / E ĐÓNG / gap #68→#69 SPAN +
> dự báo EPERM 0 sóng + WFS chênh 0 + RAM max < 4.576 MB).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #42 đoạn B / mù #43
> và mù #40 B** (quyết parent đợt 124 §12.3 + §12.4: CHẤP NHẬN ĐỂ MỞ —
> xem §0 mục MÂU THUẪN BRIEF và §5 mục 1). G1 + mù #22/#28/#29/#30/#31/
> #35/#37/#38 đoạn G chờ user quyết.

## 0. Kết quả headline + MÂU THUẪN TRONG BRIEF (đọc trước)

**MÂU THUẪN BRIEF — T7 tuân LUẬT CỨNG, không làm nhiệm vụ (1) theo chữ:**
- Brief giao (1) "Mù #42 đoạn B: kiểm tra sâu với góc mới (chưa thử ở đợt 124)".
- Nhưng mù #42 đoạn B CHÍNH LÀ mù #43 (T7-124 §2.3: "Mù #43 (brief đặt
  tên cho gap #67→#68 = đoạn B này)"), và quyết parent đợt 124 §12.4 đã
  CHẤP NHẬN ĐỂ MỞ mù #43 + LUẬT CỨNG của chính brief đợt 125 cấm "KHÔNG
  kiểm lại mù #40 B / #43". Nhiệm vụ (1) và LUẬT CỨNG mâu thuẫn trực tiếp
  vì cùng một cửa sổ.
- Quyết định của T7: TUÂN LUẬT CỨNG + quyết parent §12.4 (quyết ghi trong
  main chat, có hiệu lực cao hơn một dòng trong brief lượt) — **KHÔNG kiểm
  lại mù #42 B / #43 từ trong VM lượt này, không có ngoại lệ "góc mới"**
  (mọi góc mới vẫn là kiểm lại từ trong VM — đúng điều §12.4 cấm).
- Việc T7 làm thay: probe #44 + điều tra cửa sổ mù MỚI #44 + boot #69 —
  đây là công việc mới, không phải kiểm lại mù cũ, không vi phạm §12.4.
- **Cần parent quyết:** nếu thật sự muốn kiểm lại đoạn B mù #42 bằng góc
  mới thì phải ban hành quyết mới ghi đè §12.4 (nêu rõ góc + lý do vì sao
  góc đó không nằm trong phạm vi "kiểm lại từ trong VM" đã cấm). T7 không
  tự suy diễn quyết ghi đè.

**Kết quả headline:**
- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (20:45:03Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.904 s, last #43 17:43:19Z, boot
  69359761, exit 1); `once` ngay sau đó là **probe #44, boot
  670c07f6, ok=2 fail=0**, exit 0, 20:45:03Z; `status` chạy lại
  **ALIVE** (age 0 s, n=44), exit 0. Log v2 tăng đúng **3 dòng**
  (121 → 124) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=44, ts 20:45:03Z, boot 670c07f6.
- **Boot #69 (tạm) lúc 20:35:11Z, boot
  `670c07f6-2299-43f6-951c-0cf1116afd6d`** — xác minh bằng `uptime -s`
  + btime 1794861311 + `who -b` + journal 1 boot (xem §1). Clock VM hiện tại CHÍNH
  XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u`
  trong 0–2 s) → **F69 ≈ 0 — lần đầu kiểm được F ngay trong boot mới
  (khác F67 không bao giờ kiểm được)**.
- **Khoảng mù #44 (MỚI): 17:43:19Z → 20:45:03Z (3h01'44") — KHÔNG ĐÓNG
  HOÀN TOÀN (D mở, E đóng, tối đa 5 ẩn).** Đoạn D **MỞ** (đuôi 5.899 s
  sau mốc cuối 18:56:52Z, 0 session bắc qua cắt D-hi, 0 file trong đuôi
  ở cả 4 phạm vi); đoạn E **ĐÓNG** (uptime trực tiếp lúc probe #44 +
  dấu boot tươi). **1 reboot đã chốt trong mù (#69 20:35:11Z — chính
  xác từng giây trên đĩa) + tối đa 5 ẩn danh nghĩa trong đuôi đoạn D.**
- **Gap #68→#69 = 3h01'20" (10.880 s) VẪN CHỈ LÀ SPAN — KHÔNG chứng
  nhận được (mới, mù #44, xem §2.5).** Đoạn D mở, đuôi 5.899 s, tối đa
  5 ẩn. Còn thiếu gì để chứng nhận: đúng 1 quan sát trong đuôi sau cắt
  D-hi 20:16:04Z (xem §2.6). CERT giữ n=38, FULL giữ n=53 (tái hiện
  100% bằng blind42-gaps.py verbatim — xem §2.5).
- **#69 tới MUỘN hơn dải cơ học:** 20:35:11Z nằm ngoài [18:09:56Z,
  20:28:21Z] (p10–p90 FULL53) — vượt cận trên p90 đúng 410 s (gap danh
  nghĩa 10.880 s > p90 10.470 s, vẫn < max 5h43'18"). Ghi nhận, không
  đổi dải chứng nhận (gap này là SPAN, không vào FULL).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút" trong 131 file *.log có mtime trong mù #44 (0
  file repo-1, 131 file hidden_files); 5 dòng "Operation not permitted"
  đều là **1 dòng dmesg đã biết ×5 lần** (ram-probe-t9.log: đọc kernel
  buffer bị từ chối — không phải sóng vite/write, xem §2.4); 5 dòng
  "sóng EPERM đã tắt" đều là **dương tính giả launcher đã biết** (T1
  + T2 + 2× T10-O8). Quét mở rộng: **65 match / 55 dòng duy nhất —
  phân loại hết** (42 dòng tên file/bản oversize trong 3 log
  recount/driver/phase1 của T10 + 6 dòng test-pass hasEperm + 5 dòng
  launcher trên + 1 dòng dmesg + 1 dòng trích dẫn tên file LIMITS
  trong log T3). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7) —
  **~128h50'** trước probe #44. EPERM vẫn KHÔNG được tuyên bố là
  đã hết.
- **Quét writeFileSync lần 31: 838 dòng / 235 file** (phạm vi 2.996
  file); R7b đối chiếu 863 dòng / 252 file; copies 25 dòng / 17
  file — y hệt lần 30. Đối chiếu chéo 838+25=863=R7b, **chênh 0 —
  lần thứ ba mươi mốt liên tiếp**. +8 dòng / +2 file so với lần 30,
  giải thích đúng hết bằng diff (xem §2.7). Async `.writeFile(`:
  vẫn đúng **2 vị trí helper đã biết** — 0 stray; mtime không đổi từ
  10–11/11.
- RAM: max biết được trong mù #44 **3.431 MB** (T9 poll, 17:51:40Z,
  đoạn D) = **57% ngưỡng guard** (thấp hơn max kỷ lục 4.576 MB mù
  #42); đoạn E max 1.863 MB. **Birefnet KHÔNG chạy, vẫn 0 lần chạy
  thành công trong gói** — 3.431 MB vẫn dưới guard 6 GB; quyết parent
  §12.7 vẫn đứng (chỉ thử lại khi quan sát được available ≥ 6 GB).
- **Reboot #70 GIỮA PHIÊN (20:54:19Z) — ĐÍNH CHÍNH §2.1 (xem §4 mục 5).**
  Sau lần kiểm boot cuối 20:52:20Z (vẫn #69), VM reboot lần nữa lúc
  **20:54:19Z, boot `310f07e4-f789-427a-bee8-a9aefd5a1f02`** (xác minh
  21:02:44Z: uptime -s + btime 1794862459 + who -b + journal 1 boot;
  F70 ≈ 0). **#70 KHÔNG ảnh hưởng kết quả mù #44** (cửa sổ đóng
  20:45:03Z, trước #70) — nhưng nó giải thích đúng quan sát dpkg lúc
  20:55:48Z mà bản nháp đầu của LIMITS này đã diễn giải SAI là
  "reset giữa boot": thực ra /var/log bị xóa theo reboot #70 (mẫu
  reset mỗi boot đã biết), và file 73 dòng + `/var/log/apt/` lúc
  20:55:48Z là **replay của boot #70** (bắt đầu 20:55:02Z, +43 s sau
  #70; chạy xong 1.509 dòng, kết thúc 21:01:36Z gstreamer1.0-tools —
  cùng hình dạng 1.509 dòng như replay #68). Bản ghi 20:45Z của T7
  (2 dòng configure 20:35:38Z) vẫn là bằng chứng duy nhất còn lại
  cho bracket đầu boot #69. **Mù #45 MỚI MỞ** (từ probe #44
  20:45:03Z) — việc của lượt sau (xem §5 mục 12).
- **Đợt 125 lúc T7 đóng (21:03Z):** T3 + T6 đã DONE (LIMITS trên
  đĩa); T1/T2/T4/T5/T8 còn viết file sau #70 (đang chạy); T9 lần
  ghi cuối 20:53:55Z — TRƯỚC #70 (có thể bị reboot cắt — việc của
  driver/T10, T7 chỉ ghi nhận). T5 đang chờ replay b70
  (t5-wait-replay-b70.stdout.log 20:59:22Z). Hạn cứng đóng đợt
  23:00Z. Cờ round125-e4a7-done và round125-e4b8-done CHƯA tồn tại
  lúc T7 đóng — T7 KHÔNG chạy quét toàn workspace lượt này (đúng
  giới hạn phối hợp).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 20:44:55Z | boot_id `670c07f6-2299-43f6-951c-0cf1116afd6d`; `who -b` Nov 16 20:35; `uptime -s` **2026-11-16 20:35:11**; btime **1794861311 = 2026-11-16T20:35:11Z**; journal chỉ 1 boot (670c07f6, first entry 20:35:22Z, last 20:44:02Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #68 đã mất theo reboot #69, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 20:45:03Z | **DEAD/STALE**, heartbeat n=43, ts 17:43:19Z, boot 69359761, age **10.904 s** (đúng 3h01'44"); last sample probe #43; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 20:45:03Z | **probe #44, boot=670c07f6, ok=2 fail=0**, exit 0; dòng `boot changed 69359761 -> 670c07f6` (uptime since 2026-11-16 20:35:11) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 20:45:03Z | **ALIVE**, age 0 s, n=44, exit 0 |

Kiểm lại từ đĩa: log probe v2 **124 dòng** — 121 sau T7 đợt 124 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #43 +
dòng `boot changed` + dòng probe #44). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #43 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=44, ts 2026-11-16T20:45:03Z, boot
670c07f6-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (34 dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #69: T5 đợt 125 đã có file trên đĩa lúc
probe (t5-postboot-b69-*.log trong round125-t5, poll 20:44:12Z–
20:44:36Z) + T6 đợt 125 đang làm việc (round125-t6 có file
test-v2-t6-run1.log 20:44:23Z) + driver mở đợt 125
(round-in-progress.md mtime 20:38:10Z) + 2 session đợt 125 trong
vùng E (birth 20:41:30Z, 20:43:00Z — đều là session của chính T7)
+ 44 mốc mtime trong vùng E (mốc đầu 20:38:10Z — round-in-progress;
mốc cuối 20:45:01Z — prereg của T2). **Số thứ tự TẠM THỜI** (mù #35
chưa đóng, tối đa +24 ẩn danh nghĩa, cộng thêm tối đa +29 từ mù
#37, +6 từ mù #38 đoạn G, +2 từ mù #39 đoạn J, +1 từ mù #40 đoạn B,
+3 từ mù #43 đoạn B và +5 từ mù #44 đoạn D → "thực tế #69" có thể
tới #143; xem §2.2).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #44 (17:43:19Z → 20:45:03Z, 3h01'44")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #44: `uptime -s` = **2026-11-16 20:35:11Z**,
  boot_id `670c07f6-2299-43f6-951c-0cf1116afd6d` — khác boot của
  probe #43 (69359761).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (20:44:55Z): chỉ **1 boot**
  (670c07f6, first entry 20:35:22Z, last 20:44:02Z). Journal/wtmp
  của boot 69359761 đã mất theo reboot #69 — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #69 — ĐÍNH CHÍNH: KHÔNG có reset giữa boot
  (xem §4 mục 5).** Lúc 20:45Z file có **2 dòng** (startup packages
  configure 20:35:38Z + 20:35:39Z, +3m27/+3m28 sau boot). Lúc kiểm
  lại 20:55:48Z file đã có **73 dòng, birth 20:55:02Z**, dòng đầu
  20:55:02Z, dòng cuối 20:55:47Z (libc-bin, modify 20:56:10Z),
  **0 dòng 20:35 còn lại**, và **`/var/log/apt/` đã xuất hiện**
  (không tồn tại lúc 20:45Z; lúc 20:55:48Z có eipp.log.xz +
  history.log + term.log). **Giải thích đúng (xác minh 21:02:44Z):
  reboot #70 lúc 20:54:19Z đã xóa /var/log theo mẫu reset mỗi boot
  (đã biết) — file 73 dòng + `/var/log/apt/` là replay của boot
  #70, không phải reset giữa boot #69.** history.log của #70 cho
  thấy **apt-get replay os-intent của host**
  (`/var/lib/hatch/os-intent`, `HATCH_OS_INTENT_SEED_BASELINE`):
  các lượt cài 20:55:40Z+ (emacsen-common, aspell, enchant-2,
  glib-networking…). Replay #70 chạy xong lúc 21:01:36Z với
  **1.509 dòng, kết thúc gstreamer1.0-tools — cùng hình dạng chính
  xác như replay #68** (1.509 dòng, 17:35:42–17:38:42Z): replay là
  baseline xác định, lặp lại giống nhau mỗi boot. T5 đợt 125 ghi
  trong postboot log (boot #69): "CHUA DU — chờ apt replay xong
  rồi chạy lại" — khớp việc replay #69 mới chạy được 2 dòng tới
  20:45Z (chậm hơn #68 +1m51 và #70 +43 s). **Bản ghi 20:45Z của
  T7 (2 dòng 20:35:38Z) là bằng chứng duy nhất còn lại cho bracket
  đầu boot #69** — /var/log của #69 đã mất theo reboot #70.
  **Đối chiếu độc lập (T5 đợt 125, log vòng lặp):** dpkg.log của
  #69 đóng băng đúng 2 dòng configure suốt đời boot (~19–20 phút),
  postboot FAIL 14/14 — chế độ lỗi giống #60? ("chạm mà không cài"),
  lần thứ 2; replay #70 chạy và PASS +5m02 (khớp quan sát của T7:
  1.509 dòng, kết thúc 21:01:36Z).
- **dpkg.log của boot #68 đã MẤT** (file hiện tại chỉ còn bracket
  #69): /var/log reset mỗi boot. Bản ghi T7-124 (1.509 dòng,
  17:35:42–17:38:42Z) là bằng chứng duy nhất còn lại cho bracket
  #68 — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123). `btmp` cũng chỉ bắt đầu 20:35:22Z (boot hiện tại).

### 2.2 Reboot đã chốt trong mù — #69 (20:35:11Z) — và cận nhảy clock tại #69

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 69 | **20:35:11Z** (chính xác từng giây) | 69359761 → 670c07f6 | Chốt từ lượt này: `uptime -s` đọc tươi (20:44:55Z) + btime 1794861311 + `who -b` 20:35 + boot_id 670c07f6 + journal first entry 20:35:22Z + probe #44 20:45:03Z boot 670c07f6 ok=2 fail=0 + driver mở đợt 125 20:35Z + 2 session đợt 125 trong vùng E (birth 20:41:30Z, 20:43:00Z). **Số thứ tự TẠM THỜI.** |
| 70 | **20:54:19Z** (chính xác từng giây) | 670c07f6 → 310f07e4 | **MỚI — xảy ra GIỮA PHIÊN T7, sau probe #44:** phát hiện lúc stage file 21:01:33Z (boot_id khác + uptime -s 20:54:19Z); xác minh 21:02:44Z: btime 1794862459 + `who -b` 20:54 + journal 1 boot (first 20:54:30Z) + F70 ≈ 0 (HTTP Date 2 server 21:02:48Z vs `date -u` 21:02:44Z — lệch 4 s là thời gian chạy tuần tự 2 lệnh curl). **Số thứ tự TẠM THỜI.** Gap #69→#70 danh nghĩa = **1.148 s (19'08")** — chỉ hơn sàn 1.147 s đúng 1 s. **Mù #45 MỞ** (từ probe #44 20:45:03Z) — việc của lượt sau (xem §5 mục 12). |

**Clock:** F69 ≈ 0 (`date -u` 20:45:22Z vs HTTP `Date`
example.com 20:45:24Z, google.com 20:45:24Z, cloudflare.com
20:45:25Z — khớp trong 0–2 s, phần lệch là thời gian chạy tuần
tự 3 lệnh curl). F68 ≈ 0 (đã kiểm 17:43Z đợt 124, trên boot #68).
**F69 là lần đầu kiểm được F ngay trong boot mới** (khác F67
không bao giờ kiểm được vì boot đã mất trước khi có lượt kiểm).

**CẬN NHẢY CLOCK TẠI #69 — KHÔNG CÓ CẬN DÙNG ĐƯỢC (0 nhân chứng,
0 poll bị lỡ, quan sát cũ-clock muộn nhất quá xa):**
- **0 nhân chứng nhảy tại #69:** **0 session** sinh trước
  20:35:11Z có mtime sau 20:35:11Z (quét 315 exec-log — tăng từ
  296 đợt 124 vì đợt 125 đã tạo thêm log). Không có tiến trình
  nào viết qua reboot.
- **KHÔNG có cận trên từ poll bị lỡ:** không có tiến trình cadence
  nào còn sống tới #69 để bị lỡ poll — poller T10 đợt 124 dừng
  18:31:47Z theo thiết kế (trigger 9/9, xem §2.3); các attempt T9
  đợt 124 kết thúc 18:19:41Z; máy yên sau đó. Không có poll nào
  tới hạn sau #69 mà không ghi.
- **Cận dưới YẾU, không dùng được:** quan sát cũ-clock muộn nhất
  trước #69 là **18:56:52Z** (docs/PHASE9_ROUND124_LIMITS.md, mtime
  — cũng là mốc cuối đoạn D, xem §2.3) → chỉ cho |X| < 5.899 s
  (tức X > −5.899 s) — quá lỏng, không đặt được cận có ý nghĩa
  (so với X ∈ (−30, +52) s tại #67). T7 ghi rõ là KHÔNG CÓ cận
  nhảy dùng được tại #69, không cố vẽ cận từ số này.
- **Không có dấu nhảy clock tại #69 (bằng chứng âm tính có kiểm
  chứng):** 0 session bắc qua + F69 ≈ 0 đã kiểm bằng HTTP Date
  trong boot #69. Khác #67 ở chỗ F69 đã kiểm trực tiếp (như #68).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #68→#69 = **3h01'20"** (10.880 s) — **VẪN CHỈ LÀ SPAN** (đoạn D
  mù #44 mở, xem §2.3).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo) — ĐÃ XẢY RA:**
  #70 từ #69 dự kiến [21:11:16Z, 23:29:41Z] (p10–p90 FULL53); thực tế
  **#70 tới SỚM hơn cả cận dưới p10: 20:54:19Z** (gap danh nghĩa chỉ
  1.148 s = 19'08", vừa đúng bằng sàn 1.147 s + 1 s — gap ngắn nhất
  kể từ khi có sàn, và là lần thứ hai liên tiếp reboot nằm ngoài dải
  p10–p90, lần này ở phía dưới). Dải cơ học cho #71 từ #70:
  [21:30:24Z, 23:48:49Z] (p10–p90 FULL53); hiệu dụng sau probe #44:
  [20:45:03Z, 23:48:49Z].
- **#69 tới muộn hơn dải cơ học cũ:** dải từ #68 là [18:09:56Z,
  20:28:21Z]; #69 thật 20:35:11Z vượt cận trên p90 đúng 410 s. Gap
  danh nghĩa 10.880 s > p90 FULL53 (10.470 s) nhưng < max
  5h43'18" — ghi nhận, không đổi dải chứng nhận vì gap này là
  SPAN (không vào FULL).

**Reboot #69 — CHỈ GHI NHẬN giờ + bracket replay (mới, xảy ra
trước khi T7 mở):**
- Reboot này xảy ra TRƯỚC lượt cron 03:35 +07 (20:35Z) — đợt 125
  mở trên boot #69 (round-in-progress.md mtime 20:38:10Z, RAM lúc
  mở ~1.981 MB). Gap #68→#69 danh nghĩa 3h01'20" thuộc mù #44
  (đoạn D), để điều tra tiếp — T7 mở điều tra lượt này, kết luận
  đoạn D MỞ (xem §2.3).
- **Số thứ tự TẠM THỜI** (như #68).

### 2.3 Hoạt động trong khoảng mù — vì sao D mở, E đóng

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **17 file** +
hidden_files **372 file**; **389 file, 379 mốc float phân biệt**
(theo cách đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 20/P6 §4 mục 20/Q6
§4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/T6 đợt 118 §2.3/T6 đợt 119
§2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123 §2.3/T7-124 §2.3 — "mốc"
là mtime float phân biệt, không phải giây tròn; xem §4 mục 6).
Chia mù làm hai đoạn bởi #69 (20:35:11Z):

- **Đoạn D: 17:43:19Z → 20:35:11Z (2h51'52", boot #68 69359761) —
  MỞ vì đuôi 5.899 s sau mốc cuối 18:56:52Z:**
  - **Poller T10 đợt 124 là 1 tiến trình duy nhất (kiểm bằng code
    poll-t10.log: 1 dòng START 17:46:46Z boot 69359761):** 10 poll
    #1–#10, đúng số thứ tự, đúng **300 s** mỗi bước (1 bước
    301 s), 17:46:46Z → 18:31:47Z (trigger 9/9, phase 1 kích
    hoạt). KHÔNG có poll #11 — poller dừng theo thiết kế sau
    trigger (dòng `ALL 9 DONE 18:31:47Z`). Đóng (17:46:46Z,
    18:31:47Z] theo đồng hồ ghi.
  - **Gate0-wait T9 b68 (observer độc lập thứ hai, 1 tiến trình
    duy nhất):** chỉ **1 poll #1, 17:44:41Z** — gate ĐẠT ngay poll
    đầu (t5flag=PASS + check-only PASS + apt=0) nên script exit
    luôn; không có poll #2 để làm cận.
  - **T9 đợt 124 (observer thứ ba):** 3 attempt, gateA poll tới
    **18:19:41Z** (attempt3 poll #10); probe attempt2 18:00–
    18:02Z (20/20 pass, nhiễm tải).
  - **T10 đóng đợt 124 (observer thứ tư):** suite 27/27 + O8
    Chromium 21/21 + WebKit 21/21 tới **18:38:49Z** (session
    poller-driver mtime 18:38:49Z), LIMITS gộp viết tới
    **18:56:52Z** (docs/PHASE9_ROUND124_LIMITS.md — mốc cuối đoạn D).
  - Mật độ mtime: **335 mốc**, lỗ lớn nhất **5.899 s** — chính
    là đuôi (18:56:52Z → 20:35:11Z); các lỗ còn lại đều < 650 s
    (lớn thứ hai 648 s: 18:38:49Z → 18:49:37Z; thứ ba 332 s:
    18:51:20Z → 18:56:52Z). Mốc đầu 17:43:19Z (= giờ probe #43,
    head ~0–1 s); mốc cuối **18:56:52Z**. **22 session** chạm
    đoạn D. Cửa sổ sàn [18:02:26Z, 20:16:04Z] có **169 mốc** —
    cửa sổ không trống, nhưng đuôi sau mốc cuối vẫn dài hơn sàn
    nhiều lần nên đoạn không đóng (xem §4 mục 1).
  - **2 session bắc qua cắt D-lo (18:02:26Z)** (birth 17:46:46Z
    mtime 18:38:49Z — chính poller T10 đợt 124; birth 18:00:31Z
    mtime 18:03:01Z) — nhưng **0 session bắc qua cắt D-hi
    (20:16:04Z)** và **0 session chạm đuôi D**
    (20:16:04Z, 20:35:11Z].
  - Đuôi: mốc cuối 18:56:52Z → #69 20:35:11Z = **5.899 s** >>
    sàn 1.147 s. File trong đuôi (sau cắt D-hi) ở cả 4 phạm vi:
    repo-1 **0**, hidden_files **0**, ngoài cây **0**, /tmp **0**
    — đuôi HOÀN TOÀN TRỐNG. /tmp: 3 file trong cả mù #44, tất cả
    đều ở đoạn E (xem dưới).
  - **Kết luận đoạn D: MỞ — tối đa 5 ẩn danh nghĩa**
    (⌊5.899/1.147⌋ = 5, cùng cách đếm như mù #43 tối đa 3 ẩn với
    đuôi 4.503 s và mù #40 B tối đa 1 ẩn với đuôi 1.379 s).
- **Đoạn E: 20:35:11Z → 20:45:03Z (9'52", boot #69 670c07f6) —
  ĐÓNG bằng đo uptime trực tiếp + probe #44 + dấu boot tươi:**
  - **`uptime -s` lúc 20:44:55Z = 20:35:11Z** chứng minh máy up
    liên tục từ #69 tới lúc đo; probe #44 20:45:03Z đọc boot_id
    670c07f6 tươi — cùng boot_id với boot bắt đầu 20:35:11Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C.) Đoạn E
    dài 592 s < sàn nên không áp cắt; uptime trực tiếp là closer
    cho toàn đoạn.
  - **Chuỗi dấu boot tươi củng cố:** driver mở đợt 125
    (round-in-progress.md mtime 20:38:10Z) + 2 session đợt 125
    trong vùng E (birth 20:41:30Z, 20:43:00Z — đều là session của
    chính T7) + 44 mốc mtime (mốc đầu 20:38:10Z — lúc mở đợt 125;
    mốc cuối 20:45:01Z — prereg của T2). Lỗ mtime (20:35:11Z →
    20:38:10Z] 179 s là máy yên sau boot (lượt cron 03:35 +07 mở
    đợt 125 lúc 20:35Z), không observer — nhưng uptime đóng đoạn
    này.
  - **Kết luận đoạn E: ĐÓNG.**

**Kết luận trung thực: khoảng mù #44 KHÔNG ĐÓNG HOÀN TOÀN.**
Đoạn D mở (đuôi 5.899 s trống hoàn toàn); đoạn E đóng; 1 reboot
đã chốt giờ (#69 20:35:11Z — chính xác từng giây trên đĩa) +
**tối đa 5 ẩn danh nghĩa**. Mù #44: **MỞ**.

Ngoài hai cây: **58 file** có mtime trong mù #44 (34 file
agents — exec-log/tool-output, 10 file repo-1-push — stage đợt
124, 7 self_improvement, 3 tmp-round53-j5, 2 memory, 1
tmp-round51-h6, 1 system); **/tmp: 3 file** trong mù #44, tất cả
ở đoạn E (t9-sampler-test/log.txt 20:43:23Z + stop 20:43:28Z —
T9 đợt 125; jarvis-tool-output-Vob9FP.json 20:44:34Z — output
một lệnh của phiên main-chat). Boot_id nhắc trong exec-log sinh/
viết trong mù: 69359761 6 file, 670c07f6 0 file.

**Lưu ý về độ trôi của ảnh chụp đoạn E:** quét lại hai cây lúc
~20:53Z cho 386 dòng / 377 mốc (thay vì 389/379 lúc ~20:47Z) —
3 file log của luồng đợt 125 đang chạy (T5/T6) vẫn được ghi thêm
sau probe #44 nên mtime của chúng trôi khỏi cửa sổ (B1 =
20:45:03Z). Đoạn D KHÔNG ĐỔI (335 mốc, cùng 3 lỗ lớn nhất, cùng
mốc cuối 18:56:52Z) — verdict không bị ảnh hưởng. Số dùng trong
LIMITS này là ảnh chụp ~20:47Z (gần probe nhất).

### 2.4 Quét sóng EPERM trong mù #44 — 0 sóng thật (bằng chứng âm tính)

Quét toàn bộ file *.log có mtime trong mù #44 (bằng script
eperm-sweep44.py; eperm-sweep*.log của chính mình bị loại theo bài
học T7 §4 mục 19). Window [17:43:19Z, 20:45:03Z] đã xác minh trong
code (viết mới, không dùng sed chuyển cửa sổ — xem §4 mục 6):

| Phạm vi quét | "vẫn bật" | "CẢNH BÁO 10 phút" | "Operation not permitted" | "sóng EPERM đã tắt" |
|---|---|---|---|---|
| repo-1 (0 file) | 0 | 0 | 0 | 0 |
| hidden_files (131 file) | 0 | 0 | **5** (1 dòng dmesg đã biết ×5, xem dưới) | **5** (dương tính giả đã biết, xem dưới) |
| **Tổng 131 file** | **0** | **0** | **5 (1 dòng duy nhất)** | **5 FP** |

5 dòng "Operation not permitted" đều là **cùng 1 dòng duy nhất**
trong round124-t9/ram-probe-t9.log, xuất hiện 5 lần:
`dmesg: read kernel buffer failed: Operation not permitted` — T9
đợt 124 thử đọc kernel buffer bằng `dmesg` trong lúc điều tra RAM
ghim và bị từ chối (VM không cho đọc dmesg — đã biết từ đợt 124
§9: "Không đọc được … dmesg (Operation not permitted)"). Đây là
**từ chối đọc dmesg, không phải sóng EPERM** (không liên quan vite
khởi động, không liên quan ghi file, không có tiến trình nào fail
vì EPERM theo sau). T7 phân loại là bằng chứng âm tính có giải
thích, KHÔNG đếm là sóng. (Nếu parent muốn đếm chặt hơn thì con số
vẫn là 0 sóng vite/write — dòng dmesg này không đổi verdict.)

5 dòng "đã tắt" đều là dương tính giả launcher đã biết — không
phải sóng thật:
- 2× run-t1.log (17:44:55Z, 17:48:39Z — T1 đợt 124, launcher vite).
- 1× run-t2.log (17:53:55Z — T2 đợt 124, launcher vite).
- 2× t10-o8.log (18:36:32Z, 18:37:30Z — T10 đợt 124 O8 driver
  launcher, cùng mẫu như 2× đợt 123 và 4× đợt 119).

Quét mở rộng `/eperm|not permitted/i`: **65 match / 55 dòng
duy nhất** — phân loại hết (65 = 55 dòng + 6 dòng đếm 2 match
(3 dòng tên stage-file chứa "eperm" 2 lần + 3 dòng suites hasEperm
chứa cả "hasEperm" lẫn "EPERM") + 4 match thừa từ 1 dòng dmesg
xuất hiện 5 lần trong file (đếm 5 match, in 1 dòng); xem §4 mục 6):
- 42 dòng tên file/bản oversize trong 3 log recount/driver/phase1
  của T10 (3 dòng tên batch `phase9-round124-t7-eperm.txt` + 39
  dòng `oversize: docs/PHASE9_ROUND1xx_*_EPERM_LIMITS.md <size>`,
  13 dòng mỗi file) — chỉ là tên file LIMITS EPERM trong danh
  sách, không phải sự kiện EPERM.
- 6 dòng test-pass hasEperm trong round124-t10-suites.log (test tự
  kiểm "not permitted" như kết quả mong đợi).
- 5 dòng launcher T1/T2/T10-O8 trên.
- 1 dòng dmesg trong ram-probe-t9.log (trên).
- 1 dòng trích dẫn tên file trong round124-t3/blind40B-t3v2.log
  (dòng `H 2026-11-16T14:59:10 2x .../PHASE9_ROUND123_T7_EPERM_LIMITS.md`
  — output quét của T3, không phải sự kiện EPERM).
**0 sóng EPERM thật.**

- Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7 đợt 115) —
  **~128h50'** trước probe #44 (20:45:03Z, tính từ đầu sóng
  ~11:55Z).
- EPERM **không** được tuyên bố là đã hết — như R7/S7/T7/T6/T5/T4:
  1 lượt không sóng = bằng chứng âm tính cho lượt đó, không phải
  kết luận hệ thống.

### 2.5 Phân phối gap — CERT n=38, FULL n=53 (KHÔNG ĐỔI — tái hiện 100%)

**Gap #68→#69 = 3h01'20" (10.880 s) VẪN CHỈ LÀ SPAN — KHÔNG đưa
vào FULL/CERT** — đoạn D mù #44 mở, đuôi 5.899 s, tối đa 5 ẩn
(xem §2.3). Cùng luật như #55→#56 / #56→#57 (T6-119 §2.5), span
#59→#60 (10.680 s, T5-120 §2.5), span #61→#62 (5.689 s, T4-121
§2.5), span #63→#64 (7.933 s, T7-122 §2.5) và span #67→#68
(9.692 s, T7-124 §2.5).

**Cross-check tái hiện T7(124) 100%:** chạy blind42-gaps.py
verbatim cho lại đúng CERT n=38 / FULL n=53 của T7 đợt 124 (xem
blind44-gaps.txt: CERT38 mean 1h44'25" median 1h58'05" p10
0h43'27" p90 2h25'04" sd 0h42'16"; FULL53 mean 1h50'40" median
1h57'56" p10 0h36'05" p90 2h54'30" sd 0h56'49" — khớp T7-124 §2.5
từng số). Không có gap mới chứng nhận được lượt này nên CERT/FULL
giữ nguyên.

- **Dải chứng nhận [19'07", 3h14'08"] không đổi.**
- **Tốc độ reboot (đồng hồ ghi nhận):** 69 / 144,28 h = **1 reboot
  mỗi 125,5 phút** (từ #1 2026-11-10T20:18:10Z tới #69
  2026-11-16T20:35:11Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 73 / 144,28 h = **1 mỗi 118,6 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3) và mù #44 đoạn D (+5).
- **Lưu ý về #70 — ĐÃ XẢY RA GIỮA PHIÊN (xem §2.2):** gap #69→#70
  danh nghĩa = **1.148 s (19'08")** — chỉ hơn sàn 1 s; là SPAN
  (mù #45, chưa điều tra — việc của lượt sau). Dải cơ học cho #71 từ
  #70 (p10–p90 FULL53): [21:30:24Z, 23:48:49Z]; hiệu dụng sau probe
  #44: [20:45:03Z, 23:48:49Z].

### 2.6 Trạng thái các mù cũ — #40 B / #43 KHÔNG KIỂM LẠI (quyết parent)

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #44 (mới) | **MỞ (mới, lượt này, §2.3 đoạn D)** | Đuôi 5.899 s trống hoàn toàn, tối đa 5 ẩn; gap #68→#69 vẫn SPAN; 1 reboot đã chốt (#69) |
| #45 (mới) | **MỞ (mới, từ probe #44 20:45:03Z)** | Reboot #70 (20:54:19Z) xảy ra giữa phiên T7 — **CHƯA điều tra** (việc của lượt sau: probe #45 + điều tra đoạn F 20:45:03Z→20:54:19Z + đoạn G từ #70). Gap #69→#70 danh nghĩa 1.148 s (19'08") — chỉ hơn sàn 1 s; đoạn F chỉ dài 556 s < sàn |
| #43 | **MỞ (đoạn B mù #42)** | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.4) — T7 KHÔNG kiểm lại lượt này** (xem §0 MÂU THUẪN BRIEF). Đuôi 4.503 s, tối đa 3 ẩn; gap #67→#68 vẫn SPAN |
| #42 | **KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'50", tối đa 3 ẩn)** | Đoạn A đóng → gap #66→#67 chứng nhận dạng khoảng; đoạn B mở = mù #43 |
| #41 | ĐÓNG HOÀN TOÀN | T7-123 §2.3; gap #64→#65 chứng nhận dạng khoảng, #65→#66 chứng nhận dạng điểm |
| #40 | KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'04", tối đa 1 ẩn) | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.3) — T7 KHÔNG kiểm lại lượt này.** 3 lần kiểm tra sâu đều 0; gap #63→#64 vẫn SPAN |
| #39 | KHÔNG ĐÓNG HOÀN TOÀN (I+K đóng, J mở, 2h56'14", tối đa 2 ẩn) | **Parent đã chấp nhận ĐỂ MỞ** (quyết đợt 123 §12.2) — KHÔNG kiểm lại |
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | Thử cuối đã thất bại đợt 121 — KHÔNG thử lại lượt này (theo brief T7); cần parent quyết có chấp nhận để mở như mù #35/#37 hay không |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 §2.3 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#69 vẫn TẠM THỜI vì mù này |
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

**Còn thiếu gì để chứng nhận gap #68→#69 (không đổi — như #67→#68
đợt trước):** đúng **1 quan sát sau 20:16:04Z** trong đuôi
(18:56:52Z, 20:35:11Z]. Ngay cả khi D được đóng, gap #68→#69 vẫn
mang caveat F69 ĐÃ KIỂM (≈ 0, khác F67) nên có thể chứng nhận dạng
điểm — nhưng chỉ khi D đóng được; hiện tại D mở nên gap giữ SPAN.

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 31 — chênh 0 (lần thứ 31 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T4 trong round121-t4, đổi OUT sang
  round125-t7) **20:51:09Z → 20:51:27Z 16/11 (18 s, có SCAN-END)**.
  Scan chạy trên boot #69, SAU khi mù #44 đã đóng bằng probe #44
  (20:45:03Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **838 dòng / 235 file** (phạm vi 2.996 file); R7b đối
  chiếu: **863 dòng / 252 file** (phạm vi 12.389 file); copies:
  **25 dòng / 17 file** — y hệt lần 30. Đối chiếu chéo:
  838+25=863=R7b, **chênh 0**.
- **+8 dòng / +2 file so với lần 30** (830/233 → 838/235), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — mọi file đều về trước lúc scan bắt đầu 20:51:09Z 16/11; 0 file
  mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND124_T7_EPERM_LIMITS.md | +6 (0 → 6) | 18:03:13Z 16/11 | Tài liệu T7 đợt 124 (nhắc `writeFileSync` 6 lần); viết SAU scan lần 30 (17:52:17Z) nên lần này mới vào |
  | docs/PHASE9_ROUND124_LIMITS.md | +1 (0 → 1) | 18:56:52Z 16/11 | Tài liệu gộp T10 đợt 124 (nhắc `writeFileSync` 1 lần); viết sau scan lần 30 |
  | PHASE9_GAP_ANALYSIS.md | +1 (24 → 25) | 18:49:37Z 16/11 | T10 đóng đợt 124 cập nhật (nhắc `writeFileSync` thêm 1 lần); viết sau scan lần 30 |
- Phạm vi: 2.996 = 2.988 + 8 net (8 file mới, **0 file mất**:
  kiểm bằng diff danh sách file — 0 dòng `<`; 8 file mới gồm 6
  LIMITS đợt 124 (gộp + T2/T3/T4/T7/T9) + 2 LIMITS/DEF đợt 125
  (T4 DEF v0.2 + T6 lockhealth)).
- **Kết luận: 31 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #44.

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
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #44.

## 3. RAM trong mù #44 — max 3.431 MB (57% guard), birefnet KHÔNG chạy

- **3 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #44 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 20:49:05Z | **1.200.656 kB** | Trước khi quét WFS (boot #69) |
  | 20:52:20Z | **1.471.192 kB** | Trước khi viết LIMITS (boot #69) |
  | 20:55:48Z | **1.650.144 kB** | Trước khi viết LIMITS — **thuộc boot #70** (reboot 20:54:19Z; xem §4 mục 8) |
- **Max RAM biết được TRONG mù #44 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 93 mẫu RAM; **max 3.431 MB**
  (T9 poll-t9.log, 17:51:40Z, đoạn D, dòng `RAMavail=3431MB` đã
  xác minh trực tiếp trong log) = **57% ngưỡng guard** — thấp hơn
  max kỷ lục 4.576 MB mù #42; đoạn E max **1.863 MB** (20:43:35Z,
  log sibling đợt 125).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 3,431 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T7 đợt 124)

1. **Cửa sổ sàn có mốc vẫn không đóng được đoạn (mới, §2.3 đoạn D):**
   đoạn D có 169 mốc trong cửa sổ sàn [18:02:26Z, 20:16:04Z] — cửa
   sổ không trống — nhưng đoạn vẫn MỞ vì đuôi sau mốc cuối
   (5.899 s) dài hơn sàn nhiều lần. Bài học: mốc trong cửa sổ sàn
   chỉ loại trừ reboot ẩn CÓ im lặng bao phủ cắt; đuôi trống sau
   mốc cuối mới là điều kiện đóng — hai điều kiện độc lập, phải
   kiểm cả hai (đợt 124 đoạn A đóng nhờ cả hai: cửa sổ rỗng + đuôi
   29 s < sàn).
2. **Không có cận nhảy dùng được tại #69 (mới, §2.2):** khác #67
   (có cả cận trên poll bị lỡ lẫn cận dưới quan sát cũ-clock), tại
   #69 không có tiến trình cadence nào còn sống để bị lỡ poll và
   quan sát cũ-clock muộn nhất cách btime tới 5.899 s. Bài học:
   cận nhảy chỉ tồn tại khi có observer còn sống qua reboot — máy
   yên sau khi đợt đóng xong thì không có cận; ghi rõ "không có
   cận" thay vì cố vẽ cận yếu.
3. **F69 kiểm được ngay trong boot mới (mới, §2.2):** khác F67
   (không bao giờ kiểm được), F69 ≈ 0 đã kiểm bằng HTTP Date 3
   server trong boot #69. Nếu đoạn D đóng được trong tương lai thì
   gap #68→#69 có thể chứng nhận dạng điểm (không mang caveat F
   chưa kiểm như #66→#67) — ghi rõ để luồng sau khỏi mất công kiểm
   lại F69.
4. **ĐÍNH CHÍNH: không có reset dpkg giữa boot — phải kiểm boot
   trước MỖI lần đọc /var/log (mới, §2.1):** bản nháp đầu của LIMITS
   này đã diễn giải sai quan sát 20:55:48Z (file 73 dòng, birth
   20:55:02Z, 0 dòng 20:35) là "replay reset dpkg.log giữa boot #69".
   Xác minh lại 21:02:44Z cho thấy thực ra **reboot #70 lúc 20:54:19Z
   đã xóa /var/log theo mẫu reset mỗi boot (đã biết)** — file lúc
   20:55:48Z là replay của boot #70. T7 suýt kết luận sai vì đã đọc
   /var/log lần hai mà KHÔNG kiểm lại boot trước (lần kiểm boot cuối
   là 20:52:20Z, trước #70). Bài học đứng: **kiểm boot trước mỗi lần
   đọc /var/log** — một reboot giữa hai lần đọc sẽ thay toàn bộ
   /var/log. Bài học cũ vẫn đúng: bracket dpkg phải ghi ngay trong
   lượt (bracket 20:35:38Z của #69 chỉ còn tồn tại trong LIMITS này).
   Phụ: replay là baseline xác định — #68 và #70 đều đúng 1.509 dòng,
   kết thúc gstreamer1.0-tools.
5. **Viết script mới thay vì sed chuyển cửa sổ (mới, §2.4):** các
   script đợt này (blind44-*.py, eperm-sweep44.py, ram-max44.py)
   được viết mới với cửa sổ hardcode đúng, không dùng sed hai lượt
   trên chuỗi thời gian — tránh lỗi T7-124 §4 mục 4 (sed ghi đè B0
   thành B1, sweep ra 0 file). Bài học T7-124 đã áp dụng: mọi kết
   quả 0 đều đối chiếu với kỳ vọng trước khi tin (sweep 131 file,
   không phải 0).
6. **"Mốc" = mtime float phân biệt, không phải giây tròn (làm rõ,
   §2.3):** investigate.py đếm distinct float epoch từ os.stat
   (389 dòng → 379 mốc). Đếm lại bằng giây tròn cho 239 mốc —
   khác nhau vì nhiều file cùng một giây nhưng khác nanosecond.
   Số dùng trong LIMITS là số float (theo tiền lệ T7-123/T7-124);
   lỗ/gap tính bằng float nên không đổi verdict. Ghi rõ để luồng
   sau khỏi tưởng lệch số.
7. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo probe #44 boot 670c07f6 ĐÚNG; dự báo đoạn D KHÔNG
   ĐÓNG ĐƯỢC / E ĐÓNG ĐÚNG (đuôi thật 5.899 s (1h38'), ngắn hơn dự báo
   ~1h45' vì mốc cuối là 18:56:52Z chứ không phải ~18:50Z — dự báo đúng
   hướng, đuôi thật ngắn hơn vì đợt 124 đóng muộn hơn dự kiến); dự báo gap #68→#69 SPAN
   ĐÚNG; dự báo EPERM 0 sóng ĐÚNG (5 dòng dmesg là trường hợp đã
   biết từ trước, không phải sóng — prereg không dự báo riêng dòng
   này, T7 phân loại có giải thích tại §2.4); dự báo WFS chênh 0
   ĐÚNG (838 dòng, trong khoảng dự báo ~835–880); dự báo RAM max
   < 4.576 MB ĐÚNG (3.431 MB) — không sửa sau khi thấy số.
   (Prereg dự báo đúng CERT n=38, FULL n=53 giữ nguyên.)
8. **Kiểm lại boot TRƯỚC (20:52:20Z) và SAU khi viết LIMITS
   (21:02:44Z):** lúc 20:52:20Z boot 670c07f6 (#69), uptime-s
   20:35:11Z — nhưng **reboot #70 xảy ra 20:54:19Z, GIỮA lúc viết
   LIMITS** (phát hiện lúc stage file 21:01:33Z, xác minh 21:02:44Z:
   boot 310f07e4, uptime-s 20:54:19Z). Probe #44 và mù #44 KHÔNG bị
   ảnh hưởng (cửa sổ đóng 20:45:03Z, trước #70); nhưng 2 ghi nhận
   trong LIMITS này đã được đính chính theo #70: (a) quan sát dpkg
   lúc 20:55:48Z thuộc boot #70, không phải reset giữa boot #69
   (xem §4 mục 4); (b) mẫu RAM 20:55:48Z thuộc boot #70 (xem §3).
   T7 KHÔNG chạy probe #45 — mù #45 (từ probe #44) là việc của lượt
   sau.
9. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
   model đóng/nhạc bản quyền.**
10. **Không quét toàn workspace lượt này:** cờ round125-e4a7-done
    và round125-e4b8-done CHƯA tồn tại lúc T7 đóng — T7 chỉ dùng
    góc hẹp/mục tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ
    repo-1/goals + /tmp + exec-logs, phương pháp T7-124). Không
    chạy quét v2 600k file kiểu T3.
11. **Stage batch:** chỉ 1 file text (LIMITS doc này),
    NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
    checkpoint + stage file).
12. **Ghi rõ:** số thứ tự reboot #47–#69 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
13. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F69 ĐÃ KIỂM (≈ 0) vào hồ sơ (xem
    §2.2 + §2.6).
14. **Cross-check tái hiện T7(124) 100%** (CERT n=38 / FULL n=53)
    trước khi kết luận số mới — chạy blind42-gaps.py verbatim qua
    exec (xem blind44-gaps.txt).
15. **md5 preview.tsx / media.ts KHÔNG ĐỔI trong lúc làm việc
    (ghi nhận):** preview.tsx 03bf029f (baseline), media.ts
    2c384ed1 — khớp baseline sau khi T3 gỡ H3f. T7 không sửa
    production file nào.
16. **T6 đợt 125 đã DONE trước khi T7 đóng** (round125-t6.done
    đã tạo; T6 đang viết LIMITS lúc T7 kiểm) — T7 chỉ ghi nhận
    trạng thái, không phụ thuộc kết quả T6.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **MÂU THUẪN BRIEF — CẦN PARENT QUYẾT (mới, xem §0):** nhiệm vụ
   (1) "kiểm tra sâu mù #42 đoạn B với góc mới" mâu thuẫn LUẬT
   CỨNG "KHÔNG kiểm lại mù #40 B / #43" trong cùng brief (đoạn B
   mù #42 = mù #43). T7 đã tuân LUẬT CỨNG + quyết §12.4, KHÔNG
   kiểm lại. **Cần parent quyết rõ:** (a) giữ §12.4 (để mở, không
   kiểm lại — thì nhiệm vụ (1) bị hủy); hay (b) ban hành quyết mới
   ghi đè §12.4, nêu rõ góc mới + lý do góc đó nằm ngoài phạm vi
   cấm. T7 khuyến nghị (a) — 3 lần kiểm tra sâu mù #40 B đều 0 và
   mù #43 đã chấp nhận để mở cùng lý do (đuôi là máy yên sau khi
   đợt đóng xong; không còn kênh timestamp nào chưa quét trong
   đuôi — 0 file ở cả 4 phạm vi + 0 session); góc mới muốn có ý
   nghĩa phải là nguồn NGOÀI VM, không phải quét lại trong VM.
2. **Khoảng mù #44 (gap #68→#69): MỞ (mới, lượt này, xem §2.3
   đoạn D).** Đuôi 5.899 s trống hoàn toàn ở cả 4 phạm vi; 0
   session bắc qua cắt D-hi; tối đa 5 ẩn. **Cần parent quyết:**
   có chấp nhận để mù #44 mở như mù #35/#37/#39/#40/#43 (chờ bằng
   chứng ngoài VM) hay giao luồng điều tra thêm — T7 khuyến nghị
   **ĐỂ MỞ** (đuôi D là máy yên sau khi đợt 124 đóng xong + chờ
   lượt cron 03:35 +07; không còn kênh timestamp nào chưa quét
   trong đuôi — 0 file ở cả 4 phạm vi + 0 session). Gap #68→#69
   giữ SPAN cho tới khi đó.
3. **Mù #43 (gap #67→#68): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ**
   (quyết đợt 124 §12.4). T7 không kiểm lại lượt này. Gap #67→#68
   giữ SPAN.
4. **Mù #40 đoạn B: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   124 §12.3). T7 không kiểm lại lượt này. Gap #63→#64 giữ SPAN.
5. **Gap #68→#69 = 3h01'20" VẪN CHỈ LÀ SPAN (mới — xem §2.5,
   CERT n=38, FULL n=53).** Đoạn D mù #44 mở, đuôi 5.899 s.
   Cần đúng 1 quan sát trong đuôi sau cắt D-hi 20:16:04Z để chứng
   nhận (xem §2.6). Khác #66→#67: F69 ĐÃ KIỂM (≈ 0) nên nếu D
   đóng được thì gap này chứng nhận được dạng điểm (không mang
   caveat F chưa kiểm).
6. **Gap #66→#67 = KHOẢNG [27'06", 28'28"] ĐÃ CHỨNG NHẬN DẠNG
   KHOẢNG (đợt 124) — parent ĐÃ CHẤP NHẬN cả ba điểm (§12.5).**
   Không đổi lượt này.
7. **Reboot #69 (20:35:11Z, boot 670c07f6) — CHỈ GHI NHẬN giờ +
   bracket replay (mới, xem §2.2 cuối + §2.1).** Gap #68→#69 thuộc
   mù #44, để điều tra tiếp (đoạn D mở). **Không tự đánh số thứ tự
   chắc chắn** — số #69 là tạm thời như #68. **Lưu ý replay:**
   bracket 20:35:38Z chỉ còn trong LIMITS này (đã mất theo reboot
   #70; xem §4 mục 4).
8. **RAM max 3.431 MB = 57% guard (mới — xem §3).** Thấp hơn max
   kỷ lục 4.576 MB mù #42. **Birefnet KHÔNG chạy** (vẫn dưới guard
   6 GB; quyết parent §12.7 vẫn đứng). u2net vẫn là fallback chính
   thức.
9. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
   --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
   117, chưa trả lời — nhắc lần 11 ở đợt này). Watcher này sẽ
   lấp đúng loại lỗ như đuôi đoạn D của mù #44.
10. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
    parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
    117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
11. **EPERM không tuyên bố đã hết** (sóng gần nhất ~128h50'
    trước probe #44). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
12. **Reboot #70 (20:54:19Z, boot 310f07e4) GIỮA PHIÊN — MÙ #45 MỚI
    MỞ (mới, xem §0 + §2.2).** #70 xảy ra sau probe #44 nên không
    ảnh hưởng mù #44; nhưng nó cắt giữa đợt 125 đang chạy: T5 đang
    chờ replay b70, T1/T2/T4/T8 vẫn viết file sau #70, T9 lần ghi
    cuối 20:53:55Z (trước #70 — có thể bị cắt, việc của driver/T10),
    T3 đã DONE. **Mù #45 (từ probe #44 20:45:03Z) chưa điều tra —
    việc của lượt sau:** probe #45 + điều tra đoạn F (20:45:03Z →
    20:54:19Z, 556 s < sàn, đóng bằng probe #44 là đầu đoạn + uptime
    nếu có) + đoạn G (từ #70). Gap #69→#70 danh nghĩa 1.148 s
    (19'08") — chỉ hơn sàn 1 s; nếu đoạn F đóng được thì gap này có
    thể chứng nhận dạng điểm (F70 ≈ 0 đã kiểm). T7 KHÔNG tự chạy
    probe #45 lượt này (nhịp probe là 1/lượt).
