# PHASE9 ROUND129 T2 — EPERM: probe #48 ok=2 fail=0 + mù #48 MỞ (đoạn A, đuôi 2.941 s, tối đa 2 ẩn) + gap #74→#75 VẪN SPAN + WFS lần 35 chênh 0 + replay #75 đủ 1.509 dòng

> Luồng T2, đợt 129 vòng lặp Phase 9 VCut Studio (lượt cron 15:35 +07,
> 17/11/2026; làm việc 08:39Z → 08:5xZ 17/11/2026).
> Nhiệm vụ: probe #48 theo lịch thường lệ + mù #48 MỚI MỞ từ probe #47 —
> điều tra đoạn từ #74 (boot #75 btime 07:13:31Z trong dải cơ học
> [05:27:27Z, 07:39:18Z], hiệu dụng [05:42:21Z, 07:39:18Z]).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round129-t2/prereg-t2.md (dự báo probe #48 boot mới ok=2
> fail=0, log +3, đoạn B ĐÓNG bằng uptime, đoạn A CÓ THỂ ĐÓNG, EPERM 0
> sóng, WFS chênh 0, RAM max < 4.576 MB). **Dự báo ĐOẠN A SAI (xem §4
> mục 1) và SỐ HỌC GAP TRONG PREREG SAI (xem §4 mục 2):** prereg dự báo
> đoạn A "có thể đóng" — thực tế A MỞ (đuôi 2.941 s > sàn 1.147 s,
> 0 quan sát trong đuôi A ở cả 4 phạm vi); prereg ghi gap #74→#75 danh
> nghĩa 6.507 s (1h48'27") — **số đúng là 8.307 s (2h18'27")**, code tính
> lại (§2.2). Ghi rõ cả hai sai, không sửa prereg sau khi thấy số.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #47 (ĐÃ ĐÓNG HOÀN
> TOÀN đợt 128) / mù #46 đoạn A / mù #45 đoạn G1 / mù #44 đoạn D /
> mù #40 đoạn B / mù #43** (quyết parent đợt 124 §12.3 + §12.4,
> đợt 125 §12(h), đợt 126 §12(h), đợt 127 §12(c)). G1 + mù #22/#28/
> #29/#30/#31/#35/#37/#38 đoạn G chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (08:39:55Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.654 s, last #47 05:42:21Z, boot
  c279cf46, exit 1); `once` ngay sau đó là **probe #48, boot
  475406f6, ok=2 fail=0**, exit 0, 08:39:55Z; `status` chạy lại
  **ALIVE** (age 0 s, n=48), exit 0. Log v2 tăng đúng **3 dòng**
  (133 → 136) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=48, ts 08:39:55Z, boot 475406f6.
- **Boot #75 (tạm) lúc 07:13:31Z, boot
  `475406f6-8cd8-4a97-a5b3-e798f24d1a26`** — xác minh bằng `uptime -s`
  + btime 1794899611 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại CHÍNH XÁC so với UTC thật (HTTP `Date` example.com khớp
  trong ~0,3 s, google.com trong ~1,7 s; cloudflare.com 403 không
  lấy được Date lượt này) → **F75 ≈ 0 (±~2 s)**.
- **#75 tới TRONG dải cơ học:** dải từ #74 là [05:27:27Z, 07:39:18Z]
  (p10–p90 FULL56); #75 thật 07:13:31Z nằm trong dải — **lần thứ
  năm liên tiếp trong dải** (sau #73, #74 — lần thứ ba và thứ tư
  liên tiếp theo T2-128 §2.2).
- **Khoảng mù #48 (MỚI): 05:42:21Z → 08:39:55Z 17/11 (2h57'34") —
  KHÔNG ĐÓNG HOÀN TOÀN (A mở, B đóng).** Đoạn A **MỞ** (212 mốc,
  khoảng trống lớn nhất 2.941 s = chính đuôi A, 0 quan sát trong
  đuôi (06:54:24Z, 07:13:31Z] ở cả 4 phạm vi); đoạn B **ĐÓNG**
  (uptime trực tiếp lúc probe #48 + dấu boot tươi). **1 reboot đã
  chốt trong mù (#75 07:13:31Z — chính xác từng giây trên đĩa) +
  tối đa 2 ẩn** (đuôi A 2.941 s / sàn 1.147 s = 2,56 → floor 2).
- **Gap #74→#75 = 8.307 s (2h18'27") VẪN CHỈ LÀ SPAN** — đoạn A mù
  #48 mở (xem §2.3 + §2.5). **CERT giữ n=41 / FULL giữ n=56**
  (tái hiện verbatim bằng blind47-gaps.py, xem §2.5 + blind48-gaps.txt).
- **Replay #75 ĐỦ HÌNH DẠNG 1.509 DÒNG (mới, xem §2.1):**
  dpkg.log **1.509 dòng, 08:35:43–08:41:46Z**, 217 installs, gói
  cuối gstreamer1.0-tools, đã đóng băng lúc kiểm 08:45:38Z — giống
  #68/#70/#71/#73/#74, KHÁC #72 (350 dòng, ngoại lệ một lần đã đóng
  đợt 128). Replay #75 khởi động MUỘN (+1h22'12" sau boot — máy yên
  07:13–08:35Z sau khi đợt 128 đóng); chỉ ghi bracket, T5 là chủ
  quản replay.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 49 file
  *.log có mtime trong mù #48 (0 file repo-1, 49 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8 đợt 128). Quét mở rộng: **14 match thô / 11 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher trên + 3 dòng nhắc tên file eperm trong blind47-sessions.log;
  3 match thô thừa là trùng lặp trong cùng dòng — dòng hasEperm chứa
  cả "hasEperm" lẫn "EPERM"). Sóng gần nhất vẫn là **~11:55–12:11Z
  11/11** (R7) — **~140h45'** trước probe #48. EPERM vẫn KHÔNG được
  tuyên bố là đã hết.
- **Quét writeFileSync lần 35: 863 dòng / 242 file** (phạm vi 3.047
  file); R7b đối chiếu 888 dòng / 259 file; copies 25 dòng / 17
  file — y hệt lần 34 về copies. Đối chiếu chéo 863+25=888=R7b,
  **chênh 0 — lần thứ ba mươi lăm liên tiếp**. +7 dòng / +2 file so
  với lần 34, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray;
  mtime không đổi từ 10/11.
- RAM: max biết được trong mù #48 **2.687 MB** (T4 attempt2
  probe-start, 05:53:18Z, đoạn A) = **44% ngưỡng guard**; đoạn B
  không có mẫu RAM nào từ log sibling (máy yên 07:13–08:36Z).
  **Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong gói** —
  2.687 MB vẫn dưới guard 6 GB; quyết parent §12.7 vẫn đứng (chỉ
  thử lại khi quan sát được available ≥ 6 GB).
- **Đợt 129 lúc T2 đóng (~08:5xZ):** T7 + T9 đã có cờ .done trên
  đĩa; các luồng khác đang chạy; boot vẫn #75 (kiểm 08:47:11Z).
  Hạn cứng đóng đợt 10:30Z 17/11 (theo brief T2). T2 KHÔNG mở Xvfb
  (không cần) nên không có gì để kill — luật đứng đợt 127 §12.1.3
  không phát sinh việc.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 08:38:59Z | boot_id `475406f6-8cd8-4a97-a5b3-e798f24d1a26`; `who -b` Nov 17 07:13; `uptime -s` **2026-11-17 07:13:31**; btime **1794899611 = 2026-11-17T07:13:31Z**; journal chỉ 1 boot (475406f6, first entry 07:13:46Z, last 08:39:12Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #74 đã mất theo reboot #75, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 08:39:55Z | **DEAD/STALE**, heartbeat n=47, ts 05:42:21Z, boot c279cf46, age **10.654 s** (đúng 2h57'34"); last sample probe #47; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 08:39:55Z | **probe #48, boot=475406f6, ok=2 fail=0**, exit 0; dòng `boot changed c279cf46 -> 475406f6` (uptime since 2026-11-17 07:13:31) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 08:39:55Z | **ALIVE**, age 0 s, n=48, exit 0 |

Kiểm lại từ đĩa: log probe v2 **136 dòng** — 133 sau T2-128 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #47 +
dòng `boot changed` + dòng probe #48). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #47 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=48, ts 2026-11-17T08:39:55Z, boot
475406f6-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #75: 2 session T2 trong vùng B (birth
08:39:32Z + 08:39:37Z — chính phiên probe này và lệnh kề) + 4 mốc
mtime trong vùng B (mốc đầu 08:36:35Z — luồng đợt 129 mở; mốc cuối
08:39:26Z — file của luồng đợt 129). **Số thứ tự TẠM THỜI** (như
#69/#70/#71/#72/#73/#74).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #48 (05:42:21Z → 08:39:55Z 17/11, 2h57'34")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #48: `uptime -s` = **2026-11-17 07:13:31Z**,
  boot_id `475406f6-8cd8-4a97-a5b3-e798f24d1a26` — khác boot của
  probe #47 (c279cf46).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (08:39:34Z): chỉ **1 boot**
  (475406f6, first entry 07:13:46Z, last 08:39:12Z). Journal/wtmp
  của boot c279cf46 đã mất theo reboot #75 — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #75 — bracket replay ghi ngay trong lượt (bài học
  T7-125 §4 mục 4: kiểm boot trước MỖI lần đọc /var/log).** Lúc
  08:38:59Z file có **1.104 dòng**, 08:35:43–08:38:56Z, dòng cuối
  status installed libc-bin — **ĐANG CHẠY** (chưa đóng băng).
  Kiểm lại 08:43:44Z: **1.509 dòng**, 08:35:43–08:41:46Z, dòng cuối
  status installed gstreamer1.0-tools; kiểm lại 08:45:38Z vẫn
  1.509 dòng, cùng bracket — **đã đóng băng, replay xong**.
  `/var/log/apt/` đã xuất hiện (eipp.log.xz + history.log +
  term.log); history.log cho thấy cùng mẫu apt-get replay os-intent
  của host (entry cuối Install: gstreamer1.0-tools, End-Date
  08:41:46Z). **Replay #75 ĐỦ HÌNH DẠNG 1.509 DÒNG** (217
  "status installed") — giống #68/#70/#71/#73/#74, KHÁC #72 (350
  dòng). **#72 vẫn là ngoại lệ một lần** (đã đóng đợt 128, quyết
  parent §12(g) — không theo dõi thêm). Lưu ý: replay #75 khởi
  động MUỘN (+1h22'12" sau boot — máy yên 07:13–08:35Z sau khi đợt
  128 đóng, lượt cron 15:35 +07 dispatch 08:35:51Z); chỉ ghi
  bracket, T5 là chủ quản replay.
- **dpkg.log của boot #74 đã MẤT** (file hiện tại chỉ còn bracket
  #75): /var/log reset mỗi boot. Bản ghi T2-128 (1.509 dòng,
  05:35:43–05:38:51Z) là bằng chứng duy nhất còn lại cho bracket
  #74 — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123). `btmp` cũng chỉ bắt đầu 07:13:46Z (boot hiện tại).

### 2.2 Reboot đã chốt trong mù — #75 (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 75 | **07:13:31Z** (chính xác từng giây) | c279cf46 → 475406f6 | Chốt từ lượt này: `uptime -s` đọc tươi (08:38:59Z + kiểm lại 08:47:11Z) + btime 1794899611 + `who -b` 07:13 + boot_id 475406f6 + journal first entry 07:13:46Z + probe #48 08:39:55Z boot 475406f6 ok=2 fail=0 + 2 session trong vùng B. **Số thứ tự TẠM THỜI.** |

**Clock:** F75 ≈ 0 (±~2 s) — đo chặt lượt này: `date -u`
08:39:34Z trước, rồi HTTP `Date` example.com khớp trong ~0,3 s
(server-epoch so với local giữa lúc fetch), google.com trong
~1,7 s; cloudflare.com **403** nên không lấy được Date lượt này
(chỉ 2/3 nguồn). F74 ≈ 0 (±1 s, đã kiểm 05:41Z đợt 128).
**F75 là lần đo trực tiếp đầu tiên trên boot #75** — không dùng
cận hai lần đo.

**CẬN NHẢY CLOCK TẠI #75 — chỉ có cận lỏng từ session:**
- **0 nhân chứng nhảy tại #75:** **0 session** sinh trước
  07:13:31Z có mtime sau 07:13:31Z (quét 308 exec-log). Quan sát
  cũ-clock muộn nhất trước #75: session mtime 06:20:06Z — cách
  btime tới 3.205 s nên chỉ cho cận lỏng |X75| < 3.205 s; cận chặt
  tới từ đo F75 ≈ 0 trực tiếp (±~2 s).
- **Cận từ hai lần đo F KHÔNG cần cho #75** (F75 đã đo trực tiếp) —
  ghi rõ để luồng sau khỏi tưởng phải áp cận hai lần đo. Cho
  #74: F74 ≈ 0 (±1 s) đã đo trực tiếp đợt 128.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #74→#75 = **8.307 s (2h18'27")** — **VẪN CHỈ LÀ SPAN**
  (đoạn A mù #48 mở, xem §2.3 + §2.5). **Đính chính prereg:**
  prereg §2 ghi 6.507 s (1h48'27") — **SAI SỐ HỌC** (07:13:31 −
  04:55:04 = 2h18'27" = 8.307 s, code tính lại; xem §4 mục 2).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo) — #75
  VÀO DẢI:** #75 từ #74 dự kiến [05:27:27Z, 07:39:18Z]
  (p10–p90 FULL56); thực tế **#75 07:13:31Z NẰM TRONG dải** (lần
  thứ năm liên tiếp trong dải — sau #71? #72? #73, #74; chuỗi
  "ngoài dải" đã reset từ đợt 126).
- Dải cơ học cho #76 từ #75 (p10–p90 FULL56): [07:45:55Z,
  09:57:45Z]; hiệu dụng sau probe #48: [08:39:55Z, 09:57:45Z].
  Cận dưới p10 07:45:55Z đã qua lúc T2 viết LIMITS (~08:47Z) mà
  vẫn boot #75 — dải là cơ học, không phải dự báo nên không có
  gì sai; #76 vẫn có thể tới bất kỳ lúc nào trong dải.
- **#70 tới sớm hơn cả cận dưới p10 (đợt 125):** dải từ #69 là
  [21:11:16Z, 23:29:41Z]; #70 thật 20:54:19Z — ghi nhận đợt 125,
  không đổi lượt này.

**Reboot #75 — CHỈ GHI NHẬN giờ + bracket replay (mới):**
- #75 xảy ra SAU khi đợt 128 đóng (T10 đóng 06:20:05Z trên boot
  #74; đợt 129 mở trên boot #75 — lượt cron 15:35 +07 dispatch
  08:35:51Z, replay #75 đang chạy lúc đó). Đây là reboot thứ 4
  liên tiếp rơi vào khoảng giữa đợt đóng và lượt mở (#71→#72 lúc
  mở đợt 127, #72→#73 giữa đợt 127, #73→#74 giữa đợt 127 đóng và
  lượt 128 mở, #74→#75 giữa đợt 128 đóng và lượt 129 mở) — mẫu
  lặp lại đã ghi ở LIMITS gộp đợt 127 §12.1 mục 4 + đợt 128 §12.1
  mục 4.
- **Số thứ tự TẠM THỜI** (như #69/#70/#71/#72/#73/#74).
- Tuổi thọ boot #74: 04:55:04Z → 07:13:31Z = **2h18'27"** (chết
  trong khung (06:24:30Z, 07:13:31Z] theo quan sát cuối — mốc
  cuối đoạn A 06:24:30Z; xem §2.3). Tuổi thọ boot gần đây cập
  nhật: #72? 54m08s, #73? 1h24m28s–1h50m39s, #74? 2h18'27"
  (chưa kẹp hẹp hơn — journal/wtmp chỉ giữ boot hiện tại).

### 2.3 Hoạt động trong khoảng mù — vì sao A mở, B đóng

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **10 file** +
hidden_files **212 file**; **222 file, 216 mốc float phân biệt /
138 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3
— "mốc" là mtime float phân biệt, không phải giây tròn; lần này
giây (138) < float (216) vì nhiều file chia sẻ cùng giây nhưng
khác phần lẻ giây — ghi cả hai số, không ép bằng nhau như đợt 128).
Chia mù làm hai đoạn bởi #75 (07:13:31Z):

- **Đoạn A: 05:42:21Z → 07:13:31Z (1h31'10" = 5.470 s, boot #74
  c279cf46) — MỞ (đuôi vượt sàn):**
  - **212 mốc**, lỗ lớn nhất **2.941 s** (06:24:30Z → 07:13:31Z
    — chính là đuôi A); lỗ lớn thứ hai chỉ **242 s** (05:58:30Z →
    06:02:32Z), các lỗ còn lại đều < 242 s — thân đoạn A dày đặc,
    chỉ đuôi là trống.
    Mốc đầu 05:42:21Z (head 0 s — chính probe #47); mốc cuối
    **06:24:30Z** (đuôi **2.941 s** > sàn 1.147 s).
    **18 session** chạm đoạn A.
  - Cửa sổ sàn [A-lo=06:01:28Z, A-hi=06:54:24Z] có mốc dày đặc
    (đợt 128 vẫn chạy tới 06:20:05Z + LIMITS gộp 06:24:30Z).
  - **2 session bắc qua cắt A-lo (06:01:28Z)** (birth 05:41:12Z
    mtime 06:13:12Z; birth 05:40:24Z mtime 06:06:25Z).
    **0 session bắc qua cắt A-hi (06:54:24Z)** — và cũng không
    cần: điều kiện mở là đuôi (2.941 s > sàn 1.147 s), cùng luật
    đã dùng cho đoạn A mù #46 (đuôi trống mới là điều kiện mở).
  - Đuôi A (06:54:24Z, 07:13:31Z] TRỐNG HOÀN TOÀN ở cả 4 phạm vi:
    repo-1 **0**, hidden_files **0**, ngoài cây **0**, /tmp **0**
    (xem blind48-sessions.log). 0 session chạm đuôi A.
  - Quan sát cuối đoạn A: LIMITS gộp đợt 128 (06:24:30Z) — file
    đóng đợt; trước đó T10-128 t10-phase1-summary.md 06:20:50Z,
    o8 log 06:20:06Z. Sau 06:24:30Z máy yên hẳn tới reboot #75.
  - **Kết luận đoạn A: MỞ — tối đa 2 ẩn** (floor(2.941/1.147) = 2).
- **Đoạn B: 07:13:31Z → 08:39:55Z (1h26'24" = 5.184 s, boot #75
  475406f6) — ĐÓNG bằng đo uptime trực tiếp + probe #48 + dấu
  boot tươi:**
  - **`uptime -s` lúc 08:38:59Z = 07:13:31Z** chứng minh máy up
    liên tục từ #75 tới lúc đo; probe #48 08:39:55Z đọc boot_id
    475406f6 tươi — cùng boot_id với boot bắt đầu 07:13:31Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C.) Đoạn B dài 5.184 s > sàn nên không áp cắt độ
    dài; uptime trực tiếp là closer cho toàn đoạn.
  - **Chuỗi dấu boot tươi củng cố:** 2 session chạm vùng B
    (birth 08:39:32Z + 08:39:37Z — phiên T2 này và lệnh kề) +
    4 mốc mtime (mốc đầu 08:36:35Z — luồng đợt 129 mở; mốc cuối
    08:39:26Z — file của luồng đợt 129). Lỗ mtime (07:13:31Z →
    08:36:35Z] 4.984 s là máy yên sau boot (lượt cron 15:35 +07
    mở đợt 129 lúc 08:35Z, luồng bắt đầu ghi ~08:36Z), không
    observer — nhưng uptime đóng đoạn này. 0 session bắc qua cắt
    B-lo (07:32:38Z) / B-hi (08:20:48Z) — không cần vì uptime là
    closer.
  - **Kết luận đoạn B: ĐÓNG.**

**Kết luận trung thực: khoảng mù #48 KHÔNG ĐÓNG HOÀN TOÀN.**
Đoạn A mở (đuôi 2.941 s, tối đa 2 ẩn); đoạn B đóng. 1 reboot đã
chốt giờ (#75 07:13:31Z — chính xác từng giây trên đĩa) + **tối
đa 2 ẩn**. Mù #48: **MỞ (đoạn A)**. Đây là mù mở đầu tiên kể từ
mù #46 (mù #47 đã đóng hoàn toàn đợt 128).

Ngoài hai cây: **67 file** có mtime trong mù #48 (agents —
exec-log/tool-output chiếm đa số; chi tiết xem
blind48-outside.txt); **/tmp: 0 file** trong mù #48 (xem
blind48-tmp.txt — 0 file trong đuôi A). Boot_id nhắc trong
exec-log sinh/viết trong mù: c279cf46 6 file, 475406f6 0 file
(phiên T2 này chưa kịp vào exec-log lúc quét; boot_id mới có
trong probe log/heartbeat).

### 2.5 Phân phối gap — CERT giữ n=41 / FULL giữ n=56 (gap mới VẪN SPAN)

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

**Cross-check tái hiện T2(128) 100%:** chạy blind47-gaps.py
verbatim cho lại đúng CERT n=41 / FULL n=56 của T2 đợt 128 (xem
blind48-gaps.txt: CERT41 mean 1h41'16" median 1h54'16" p10
0h31'47" p90 2h24'11" sd 0h43'27" min 0h19'07" max 3h14'08";
FULL56 mean 1h48'02" median 1h54'38" p10 0h32'24" p90 2h44'14"
sd 0h57'04" min 0h19'07" max 5h43'18"; in 90–150' = 30, <60' = 11,
>180' = 6, >240' = 2 — khớp T2-128 §2.5 từng số). Gap #74→#75
không vào (đoạn A mở) nên phân phối **không đổi**.

- **CERT n=41 (không đổi) / FULL n=56 (không đổi).**
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới 8.307 s
  = 2h18'27" nằm trong dải nhưng chưa chứng nhận nên không vào).
- **Tốc độ reboot (đồng hồ ghi nhận):** 75 / 154,92 h = **1 reboot
  mỗi 123,9 phút** (từ #1 2026-11-10T20:18:10Z tới #75
  2026-11-17T07:13:31Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 79 / 154,92 h = **1 mỗi 117,7 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn G1 (+4), mù #46
  đoạn A (+4) và mù #48 đoạn A (+2, mới).
- **#75 vào dải cơ học (xem §2.2):** lần thứ năm liên tiếp trong
  dải — chuỗi "ngoài dải" đã reset từ đợt 126.

### 2.6 Trạng thái các mù cũ — #47 ĐÓNG / #46 A / #45 G1 / #44 D / #40 B / #43 KHÔNG KIỂM LẠI (quyết parent)

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #48 (mới) | **MỞ (đoạn A)** | **Mới, lượt này** — đoạn A mở (đuôi 2.941 s, tối đa 2 ẩn), đoạn B đóng; 1 reboot đã chốt giờ (#75 07:13:31Z); gap #74→#75 vẫn SPAN |
| #47 | **ĐÓNG HOÀN TOÀN** | T2-128 §2.3; gap #72→#73 + #73→#74 chứng nhận dạng khoảng; CERT n=41 / FULL n=56 — **KHÔNG kiểm lại lượt này** |
| #46 | **MỞ (đoạn A)** | **Parent CHẤP NHẬN ĐỂ MỞ (tiền lệ quyết đợt 126 §12(h), đính chính đợt 127 §12(c))** — T2 KHÔNG kiểm lại lượt này. Đuôi 4.793 s, tối đa 4 ẩn; gap #71→#72 vẫn SPAN |
| #45 | **MỞ (đoạn G1)** | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 125 §12(h))** — T2 KHÔNG kiểm lại lượt này. Đuôi 4.710 s, tối đa 4 ẩn; gap #70→#71 vẫn SPAN |
| #44 | **MỞ (đoạn D, đã kiểm sâu 1 lần đợt 126 vẫn mở)** | **ĐỂ MỞ theo quyết parent §12(h)** — lần kiểm sâu cuối cùng đã xong đợt 126 (§2.4 T7-126); gap #68→#69 vẫn SPAN |
| #43 | **MỞ (đoạn B mù #42)** | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.4) — T2 KHÔNG kiểm lại lượt này.** Đuôi 4.503 s, tối đa 3 ẩn; gap #67→#68 vẫn SPAN |
| #42 | **KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'50", tối đa 3 ẩn)** | Đoạn A đóng → gap #66→#67 chứng nhận dạng khoảng; đoạn B mở = mù #43 |
| #41 | ĐÓNG HOÀN TOÀN | T7-123 §2.3; gap #64→#65 chứng nhận dạng khoảng, #65→#66 chứng nhận dạng điểm |
| #40 | KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'04", tối đa 1 ẩn) | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.3) — T2 KHÔNG kiểm lại lượt này.** 3 lần kiểm tra sâu đều 0; gap #63→#64 vẫn SPAN |
| #39 | KHÔNG ĐÓNG HOÀN TOÀN (I+K đóng, J mở, 2h56'14", tối đa 2 ẩn) | **Parent đã chấp nhận ĐỂ MỞ** (quyết đợt 123 §12.2) — KHÔNG kiểm lại |
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | Thử cuối đã thất bại đợt 121 — KHÔNG thử lại lượt này (theo brief T2); cần parent quyết có chấp nhận để mở như mù #35/#37 hay không |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #48–#75 vẫn TẠM THỜI vì mù này |
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

**Còn thiếu gì để chứng nhận gap #74→#75:** đúng **1 quan sát sau
06:54:24Z** trong đuôi A (06:54:24Z, 07:13:31Z]. Đoạn A mù #48
đã MỞ — theo tiền lệ quyết đợt 126 §12(h) (mù #46 A để mở, không
kiểm lại), **không giao luồng sau kiểm lại A** mù #48 trừ khi
parent ra quyết khác (đuôi trống thì để mở luôn, chờ bằng chứng
ngoài VM).

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 35 — chênh 0 (lần thứ 35 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round129-t2, đổi OUT sang
  round129-t2) **08:44:07Z → 08:44:29Z 17/11 (22 s, có SCAN-END)**.
  Scan chạy trên boot #75, SAU khi mù #48 đã đóng bằng probe #48
  (08:39:55Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **863 dòng / 242 file** (phạm vi 3.047 file); R7b đối
  chiếu: **888 dòng / 259 file** (phạm vi 12.440 file); copies:
  **25 dòng / 17 file** — y hệt lần 34. Đối chiếu chéo:
  863+25=888=R7b, **chênh 0**.
- **+7 dòng / +2 file so với lần 34** (856/240 → 863/242), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | PHASE9_GAP_ANALYSIS.md | +1 (25 → 26) | 06:24:30Z 17/11 | §57 thêm ở closing đợt 128 (nhắc `writeFileSync` thêm 1 lần) |
  | docs/PHASE9_ROUND128_LIMITS.md | +1 (0 → 1) | 06:24:30Z 17/11 | Tài liệu gộp đợt 128 (nhắc `writeFileSync` 1 lần); viết SAU scan lần 34 (05:52:09Z 17/11) nên lần này mới vào |
  | docs/PHASE9_ROUND128_T2_PROBE47_LIMITS.md | +5 (0 → 5) | 05:56:48Z 17/11 | Tài liệu T2 đợt 128 (nhắc `writeFileSync` 5 lần); viết SAU scan lần 34 nên lần này mới vào |
- Phạm vi: 3.047 = 3.041 + 6 net (**6 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 6 file mới gồm LIMITS gộp 128 +
  T2-128 + T3-128 + T4-128 + T7-129 + T9-129; 0 file mất). Copies
  y hệt lần 34 (diff 0 dòng).
- **Kết luận: 35 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #48.

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
  không tính vào 2 helper; T7-126 §2.8 cũng dùng pattern có dấu
  chấm nên số 2 là nhất quán giữa các lượt.
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #48.

## 3. RAM trong mù #48 — max 2.687 MB (44% guard), birefnet KHÔNG chạy

- **4 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #48 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 08:38:59Z | **910.100 kB** | Trước probe #48 (boot #75) |
  | 08:39:55Z | **1.306.668 kB** | Lúc probe #48 (boot #75) |
  | 08:43:44Z | **2.726.472 kB** | Trước khi viết LIMITS (boot #75) |
  | 08:45:38Z | **2.901.496 kB** | Trước khi viết LIMITS (boot #75) |
- **Max RAM biết được TRONG mù #48 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 75 mẫu RAM; **max 2.687 MB**
  (T4 attempt2 probe-start, 05:53:18Z, đoạn A, dòng `RAM 2687MB
  avail` đã xác minh trực tiếp trong chain-t4.log dòng 445)
  = **44% ngưỡng guard** — cao hơn max 2.558 MB mù #47 một ít
  nhưng vẫn thấp hơn max kỷ lục 4.576 MB mù #42; đoạn A max
  **2.687 MB**; đoạn B **không có mẫu RAM nào** từ log sibling
  (máy yên 07:13–08:36Z, không luồng nào ghi mẫu).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 2.687 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T2 đợt 128)

1. **Prereg dự báo ĐOẠN A SAI — sửa công khai, verdict NGƯỢC DỰ BÁO
   (mới, §0 + §2.3):** prereg §2 dự báo đoạn A "CÓ THỂ ĐÓNG" vì
   đợt 128 vẫn chạy tới 06:20:05Z + T5/T9 ghi log sau đó — thực tế
   A MỞ vì đuôi sau quan sát cuối (LIMITS gộp 128, 06:24:30Z) tới
   #75 dài 2.941 s > sàn 1.147 s, và 0 quan sát trong đuôi A ở cả
   4 phạm vi (repo-1 0, hidden_files 0, ngoài cây 0, /tmp 0).
   Bài học (nối tiếp T2-128 §4 mục 1, nhưng ngược chiều): "máy yên
   sau khi đợt đóng" lần này THẬT SỰ yên — sau file đóng đợt cuối
   (LIMITS gộp 06:24:30Z) không còn bất kỳ quan sát nào nữa. Dự
   báo đuôi mù phải tính cả khả năng "không còn file đóng đợt nào
   sau mốc cuối đã biết", không chỉ giờ đóng của luồng đo cuối.
   Verdict A MỞ là số đo, không phải ý kiến.
2. **SỐ HỌC GAP TRONG PREREG SAI — đính chính công khai (mới, §0 +
   §2.2):** prereg §2 ghi gap #74→#75 danh nghĩa 6.507 s
   (1h48'27") — **số đúng là 8.307 s (2h18'27")**: 07:13:31Z −
   04:55:04Z = 2h18'27" (code tính lại, blind48-investigate.log).
   Lỗi do trừ nhẩm giờ (2h18' tính nhầm thành 1h48'). Không sửa
   prereg sau khi thấy số; mọi số gap trong LIMITS này đều lấy từ
   code, không lấy từ prereg. Bài học: không ghi số gap bằng nhẩm
   trong prereg — chỉ ghi dải cơ học (đã có sẵn từ đợt trước) và
   để code tính gap danh nghĩa sau khi đo.
3. **Mốc float ≠ mốc giây (mới, §2.3):** lần này 216 mốc float /
   138 mốc giây (đợt 128: giây = float = 524). Nhiều file chia sẻ
   cùng giây nhưng khác phần lẻ giây. Ghi cả hai số; số mốc dùng
   cho luật đóng/mở là float (theo cách đếm L9 §6.1...), không ép
   bằng nhau. Không ảnh hưởng verdict: đuôi A 2.941 s tính bằng
   float (mốc cuối 06:24:30.x → btime 07:13:31).
4. **F75 đo bằng 2/3 nguồn (mới, §0 + §2.2):** cloudflare.com trả
   403 nên không lấy được Date lượt này; example.com (~0,3 s) +
   google.com (~1,7 s) vẫn đủ kết luận F75 ≈ 0 (±~2 s). Ghi rõ
   giới hạn này thay vì viết "3 server khớp 0–1 s" như các lượt
   trước.
5. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo probe #48 boot 475406f6 ok=2 fail=0 ĐÚNG; dự báo
   #75 trong dải cơ học ĐÚNG (lần thứ năm liên tiếp); dự báo đoạn
   B ĐÓNG bằng uptime trực tiếp ĐÚNG; dự báo đoạn A CÓ THỂ ĐÓNG
   **SAI** (A mở, xem mục 1); dự báo gap #74→#75 SPAN trừ khi A
   đóng ĐÚNG (A mở → SPAN); dự báo EPERM 0 sóng ĐÚNG; dự báo WFS
   chênh 0 ĐÚNG (863 dòng — trong khoảng dự báo ~856–870); dự báo
   RAM max < 4.576 MB ĐÚNG (2.687 MB) — không sửa sau khi thấy số,
   trừ việc ghi rõ dự báo A sai (mục 1) và số học gap sai (mục 2).
6. **Kiểm lại boot TRƯỚC (08:38:59Z) và SAU khi viết LIMITS
   (08:47:11Z):** cả hai lần đều boot 475406f6 (#75), uptime-s
   07:13:31Z — KHÔNG có reboot giữa phiên T2 lượt này. Probe #48
   và mù #48 KHÔNG bị ảnh hưởng bởi reboot sau đó (chưa xảy ra
   tới lúc đóng).
7. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
   model đóng/nhạc bản quyền.**
8. **Không quét toàn workspace lượt này:** chỉ dùng góc hẹp/mục
   tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ repo-1/goals
   + /tmp + exec-logs).
9. **Stage batch:** chỉ 1 file text (LIMITS doc này),
   NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
   checkpoint + stage file).
10. **Ghi rõ:** số thứ tự reboot #48–#75 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
11. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F75 ĐÃ KIỂM (≈ 0, ±~2 s, 2/3 nguồn)
    và F73 CHƯA ĐO vào hồ sơ (xem §2.2 + §2.6).
12. **Cross-check tái hiện T2(128) 100%** (CERT n=41 / FULL n=56)
    trước khi kết luận số mới — chạy blind47-gaps.py verbatim qua
    exec (xem blind48-gaps.txt).
13. **md5 preview.tsx / media.ts KHÔNG ĐỔI trong lúc làm việc
    (ghi nhận):** preview.tsx 03bf029f (baseline), media.ts
    2c384ed1 — khớp baseline. T2 không sửa production file nào.
14. **Các luồng đợt 129 khác đang chạy lúc T2 đóng** — T2 chỉ ghi
    nhận trạng thái (T7 + T9 đã có cờ .done), không phụ thuộc kết
    quả các luồng đó.
15. **T2 KHÔNG mở Xvfb** (luồng probe không cần browser) nên
    không có Xvfb nào để kill — luật đứng đợt 127 §12.1.3 (mỗi
    driver tự kill Xvfb của mình) không phát sinh việc lượt này.
16. **Script ram-max48.py / eperm-sweep48.py copy từ đợt 128 bị
    sed thay nhầm ranh giới** (B0 thành 08:39:55Z, SEGS của
    ram-max thành đoạn mù #47) — đã phát hiện bằng đọc output
    (nhãn "blind#47" + "seg C") và sửa đúng ranh giới mù #48
    trước khi dùng số. Bài học: sau khi sed-adapt script giữa
    các đợt, grep lại mọi timestamp hardcode trước khi chạy
    (không chỉ B0/B1).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #48: MỞ (đoạn A) — mới, xem §2.3.** Đoạn A mở
   (đuôi 2.941 s, tối đa 2 ẩn), đoạn B đóng. 1 reboot đã chốt giờ
   (#75 07:13:31Z) + tối đa 2 ẩn. Gap #74→#75 giữ SPAN.
   **CERT giữ n=41 / FULL giữ n=56 (không đổi).**
2. **Gap #74→#75 = 8.307 s (2h18'27") VẪN CHỈ LÀ SPAN (mới — xem
   §2.5).** Cần đúng 1 quan sát sau 06:54:24Z trong đuôi A để
   đóng đoạn A. Theo tiền lệ quyết đợt 126 §12(h) (mù #46 A để
   mở), **không giao luồng sau kiểm lại A** mù #48 trừ khi parent
   ra quyết khác — chờ bằng chứng ngoài VM.
3. **Replay #75 đủ 1.509 dòng (mới — xem §2.1 + §2.2).** Giống
   #68/#70/#71/#73/#74; khác hình dạng 350 dòng của #72 (ngoại lệ
   một lần, đã đóng đợt 128). Lưu ý replay #75 khởi động muộn
   (+1h22'12") — T5 (chủ quản replay) theo dõi tiếp nếu muốn.
4. **Mù #47: ĐÓNG HOÀN TOÀN (đợt 128) — KHÔNG đổi lượt này.**
   T2 không kiểm lại.
5. **Mù #46 (đoạn A): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (tiền lệ
   quyết đợt 126 §12(h), đính chính đợt 127 §12(c)). T2 không
   kiểm lại lượt này. Gap #71→#72 giữ SPAN.
6. **Mù #45 (đoạn G1): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h)). T2 không kiểm lại lượt này. Gap #70→#71 giữ SPAN.
7. **Mù #44 đoạn D: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h), kiểm sâu 1 lần đã xong đợt 126). T2 không kiểm lại
   lượt này. Gap #68→#69 giữ SPAN.
8. **Mù #43 (gap #67→#68): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ**
   (quyết đợt 124 §12.4). T2 không kiểm lại lượt này. Gap #67→#68
   giữ SPAN.
9. **Mù #40 đoạn B: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   124 §12.3). T2 không kiểm lại lượt này. Gap #63→#64 giữ SPAN.
10. **Gap #66→#67 = KHOẢNG [27'06", 28'28"] ĐÃ CHỨNG NHẬN DẠNG
    KHOẢNG (đợt 124) — parent ĐÃ CHẤP NHẬN cả ba điểm (§12.5).**
    Không đổi lượt này.
11. **Reboot #75 (07:13:31Z, boot 475406f6) — CHỈ GHI NHẬN giờ +
    bracket replay (mới, xem §2.2 cuối + §2.1).** Gap #74→#75
    thuộc mù #48 đoạn A, MỞ. **Không tự đánh số thứ tự chắc
    chắn** — số #75 là tạm thời như #74. **Lưu ý replay:**
    bracket 08:35:43–08:41:46Z đã ghi trong LIMITS này (sẽ mất
    theo reboot sau, như bracket #71/#72/#73/#74).
12. **RAM max 2.687 MB = 44% guard (mới — xem §3).** Cao hơn max
    2.558 MB mù #47 một ít nhưng vẫn thấp hơn max kỷ lục 4.576 MB
    mù #42. **Birefnet KHÔNG chạy** (vẫn dưới guard 6 GB; quyết
    parent §12.7 vẫn đứng). u2net vẫn là fallback chính thức.
13. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
    --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
    117, chưa trả lời — nhắc lần 15 ở đợt này). Watcher này sẽ
    lấp đúng loại lỗ như đuôi đoạn A của mù #48 (2.941 s — lần này
    không có quan sát muộn nào cứu được như mù #47).
14. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
    parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
    117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
15. **EPERM không tuyên bố đã hết** (sóng gần nhất ~140h45'
    trước probe #48). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
16. **Mù #49 MỚI MỞ (từ probe #48 08:39:55Z) — việc của lượt sau:**
    probe #49 + điều tra đoạn từ #75 (dải cơ học cho #76:
    [07:45:55Z, 09:57:45Z], hiệu dụng sau probe #48: [08:39:55Z,
    09:57:45Z]). T2 KHÔNG tự chạy probe #49 lượt này (nhịp probe
    là 1/lượt).
