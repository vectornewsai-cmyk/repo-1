# PHASE9 ROUND128 T2 — EPERM: probe #47 ok=2 fail=0 + mù #47 ĐÓNG HOÀN TOÀN (A+B+C) + 2 gap MỚI CHỨNG NHẬN DẠNG KHOẢNG + WFS lần 34 chênh 0 + replay #74 trở lại 1.509 dòng

> Luồng T2, đợt 128 vòng lặp Phase 9 VCut Studio (lượt cron 12:35 +07,
> 17/11/2026; làm việc 05:40Z → 05:5xZ 17/11/2026).
> Nhiệm vụ: probe #47 + mù #47 mô tả ban đầu + điều tra đoạn từ #72
> (gap #72→#73 ≈54m08s, boot #73 btime 03:04:25Z trong dải cơ học
> [02:42:25Z, 05:01:21Z]).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round128-t2/prereg-t2.md (định nghĩa probe #47, mốc đối
> chiếu, dự báo C ĐÓNG bằng uptime / A CÓ THỂ ĐÓNG / B CÓ THỂ MỞ /
> gap #72→#73 SPAN trừ khi A đóng / EPERM 0 sóng + WFS chênh 0 +
> RAM max < 4.576 MB). **Dự báo B SAI (xem §4 mục 1):** prereg dự báo
> B có thể mở vì đuôi sau ~04:28Z tới #74 ~20–27' vượt sàn — thực tế
> B ĐÓNG (đuôi thật chỉ 459 s nhờ 3 quan sát muộn không lường trước:
> LIMITS gộp 127 04:46:48Z + prereg-e4batch.md 04:44:52Z +
> build-loop-log.md 04:47:24Z). Ghi rõ sai, không sửa prereg sau khi
> thấy số. **MỚI so với brief: boot #74 (btime 04:55:04Z) đã xuất hiện
> SAU khi đợt 127 đóng** — mù #47 chứa HAI reboot (#73 + #74), không
> phải một như brief viết; ghi đúng số đo, không ép khớp brief.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #44 đoạn D / mù #42
> đoạn B / mù #43 và mù #40 B / mù #45 đoạn G1 / mù #46 đoạn A**
> (quyết parent đợt 124 §12.3 + §12.4, đợt 125 §12(h), đợt 126 §12(h),
> đợt 127 §12(c): CHẤP NHẬN ĐỂ MỞ). G1 + mù #22/#28/#29/#30/#31/#35/
> #37/#38 đoạn G chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (05:42:16Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.867 s, last #46 02:41:09Z, boot
  81464315, exit 1); `once` ngay sau đó là **probe #47, boot
  c279cf46, ok=2 fail=0**, exit 0, 05:42:21Z; `status` chạy lại
  **ALIVE** (age 0 s, n=47), exit 0. Log v2 tăng đúng **3 dòng**
  (130 → 133) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=47, ts 05:42:21Z, boot c279cf46.
- **Boot #74 (tạm) lúc 04:55:04Z, boot
  `c279cf46-a38b-4d93-b6e9-fa251b078108`** — xác minh bằng `uptime -s`
  + btime 1794891304 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại CHÍNH XÁC so với UTC thật (HTTP `Date` 3 server độc lập
  khớp `date -u` trong 0–1 s) → **F74 ≈ 0**.
- **Khoảng mù #47 (MỚI): 02:41:09Z → 05:42:21Z 17/11 (3h01'12") —
  ĐÓNG HOÀN TOÀN (A đóng, B đóng, C đóng) — mù ĐÓNG HOÀN TOÀN ĐẦU
  TIÊN KỂ TỪ MÙ #41 (T7-123).** Đoạn A **ĐÓNG** (123 mốc, khoảng
  trống lớn nhất 95 s, đuôi 54 s); đoạn B **ĐÓNG** (345 mốc, khoảng
  trống lớn nhất 632 s, đuôi 459 s); đoạn C **ĐÓNG** (uptime trực
  tiếp lúc probe #47 + dấu boot tươi). **2 reboot đã chốt trong
  mù (#73 03:04:25Z + #74 04:55:04Z — mới, chính xác từng giây
  trên đĩa) + 0 ẩn.**
- **Gap #72→#73 = 3.248 s (54'08") CHỨNG NHẬN DẠNG KHOẢNG
  [3.238 s, 3.258 s] (mới, đoạn A đóng, xem §2.5).** Gap
  **#73→#74 = 6.639 s (1h50'39") CHỨNG NHẬN DẠNG KHOẢNG
  [6.629 s, 6.649 s] (mới, đoạn B đóng, xem §2.5).** Cả hai đều
  dùng biên ±10 s của T5 (T5-127 §2.4) vì F73 chưa từng đo trực
  tiếp — ghi rõ, không tuyên bố dạng điểm. **CERT n=39 → n=41 /
  FULL n=54 → n=56** (cả hai gap vào ở trung điểm, theo tiền lệ
  gap #66→#67 đợt 124; chạy nhạy LO/HI không đổi phân phối).
- **#73 tới TRONG dải cơ học:** dải từ #72 là [02:42:25Z, 05:01:21Z]
  (p10–p90 FULL54); #73 thật 03:04:25Z nằm trong dải — lần thứ ba
  liên tiếp trong dải. **#74 tới TRONG dải cơ học:** dải từ #73 là
  [03:36:34Z, 05:55:30Z]; #74 thật 04:55:04Z nằm trong dải — lần
  thứ tư liên tiếp trong dải.
- **Replay #74 TRỞ LẠI HÌNH DẠNG 1.509 DÒNG (mới, xem §2.1):**
  dpkg.log **1.509 dòng, 05:35:43–05:38:51Z**, 217 installs, gói
  cuối gstreamer1.0-tools, đã đóng băng lúc kiểm 05:52:53Z — giống
  #68/#70/#71/#73, KHÁC #72 (350 dòng). **#72 là ngoại lệ một lần**
  (trả lời câu hỏi theo dõi của T5 đợt 128, quyết parent §12(i)
  đợt 127). Lưu ý: replay #74 khởi động MUỘN (+40m39s sau boot —
  máy yên 04:55–05:35Z sau khi đợt 127 đóng); chỉ ghi bracket,
  T5 là chủ quản replay.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 159 file
  *.log có mtime trong mù #47 (0 file repo-1, 159 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8 đợt 127). Quét mở rộng: **11 match thô / 8 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher trên; 3 match thô còn lại là trùng lặp trong cùng dòng
  — dòng hasEperm chứa cả "hasEperm" lẫn "EPERM"). Sóng gần nhất
  vẫn là **~11:55–12:11Z 11/11** (R7) — **~137h47'** trước probe
  #47. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 34: 856 dòng / 240 file** (phạm vi 3.041
  file); R7b đối chiếu 881 dòng / 257 file; copies 25 dòng / 17
  file — y hệt lần 33. Đối chiếu chéo 856+25=881=R7b, **chênh 0 —
  lần thứ ba mươi tư liên tiếp**. +6 dòng / +2 file so với lần 33,
  giải thích đúng hết bằng diff (xem §2.7). Async `.writeFile(`:
  vẫn đúng **2 vị trí helper đã biết** — 0 stray; mtime không đổi
  từ 10/11.
- RAM: max biết được trong mù #47 **2.558 MB** (T9 poll-t9.log,
  02:47:41Z, đoạn A) = **42% ngưỡng guard**; đoạn B max 1.452 MB,
  đoạn C max 1.071 MB. **Birefnet KHÔNG chạy, vẫn 0 lần chạy thành
  công trong gói** — 2.558 MB vẫn dưới guard 6 GB; quyết parent
  §12.7 vẫn đứng (chỉ thử lại khi quan sát được available ≥ 6 GB).
- **Đợt 128 lúc T2 đóng (~05:54Z):** các luồng khác đang chạy
  (T1 DEF v0.4 + T5/T6/T7/T8/T9 đã có LIMITS trên đĩa lúc quét
  WFS); boot vẫn #74 (kiểm 05:54:37Z). Hạn cứng đóng đợt 07:30Z
  17/11 (theo brief T2). T2 KHÔNG mở Xvfb (không cần) nên không
  có gì để kill — luật đứng đợt 127 §12.1.3 không phát sinh việc.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 05:41:09Z | boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108`; `who -b` Nov 17 04:55; `uptime -s` **2026-11-17 04:55:04**; btime **1794891304 = 2026-11-17T04:55:04Z**; journal chỉ 1 boot (c279cf46, first entry 04:55:18Z, last 05:40:58Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #73 đã mất theo reboot #74, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 05:42:16Z | **DEAD/STALE**, heartbeat n=46, ts 02:41:09Z, boot 81464315, age **10.867 s** (đúng 3h01'07"); last sample probe #46; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 05:42:21Z | **probe #47, boot=c279cf46, ok=2 fail=0**, exit 0; dòng `boot changed 81464315 -> c279cf46` (uptime since 2026-11-17 04:55:04) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 05:42:21Z | **ALIVE**, age 0 s, n=47, exit 0 |

Kiểm lại từ đĩa: log probe v2 **133 dòng** — 130 sau T4-127 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #46 +
dòng `boot changed` + dòng probe #47). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #46 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=47, ts 2026-11-17T05:42:21Z, boot
c279cf46-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #74: 1 session T2 trong vùng C (birth
05:40:31Z — chính phiên probe này) + 4 session chạm vùng C +
56 mốc mtime trong vùng C (mốc đầu 05:40:28Z — luồng đợt 128 mở;
mốc cuối 05:42:20Z — file của luồng đợt 128). **Số thứ tự TẠM
THỜI** (như #69/#70/#71/#72/#73).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #47 (02:41:09Z → 05:42:21Z 17/11, 3h01'12")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #47: `uptime -s` = **2026-11-17 04:55:04Z**,
  boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108` — khác boot của
  probe #46 (81464315).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (05:41:09Z): chỉ **1 boot**
  (c279cf46, first entry 04:55:18Z, last 05:40:58Z). Journal/wtmp
  của boot 5e522260 đã mất theo reboot #74 — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #74 — bracket replay ghi ngay trong lượt (bài học
  T7-125 §4 mục 4: kiểm boot trước MỖI lần đọc /var/log).** Lúc
  05:41:09Z file có **1.509 dòng**, 05:35:43–05:38:51Z, dòng cuối
  status installed gstreamer1.0-tools; kiểm lại 05:52:53Z vẫn
  1.509 dòng, cùng bracket — **đã đóng băng, replay xong**.
  `/var/log/apt/` đã xuất hiện (eipp.log.xz + history.log +
  term.log); history.log cho thấy cùng mẫu apt-get replay os-intent
  của host (entry cuối Install: gstreamer1.0-tools, End-Date
  05:38:51Z). **Replay #74 TRỞ LẠI HÌNH DẠNG 1.509 DÒNG** (217
  "status installed") — giống #68/#70/#71/#73, KHÁC #72 (350
  dòng). **Kết luận: #72 là ngoại lệ một lần** (trả lời câu hỏi
  theo dõi của T5 đợt 128, quyết parent §12(i) đợt 127 — T5 là
  chủ quản replay, T2 chỉ ghi bracket). Lưu ý: replay #74 khởi
  động MUỘN (+40m39s sau boot — máy yên 04:55–05:35Z sau khi đợt
  127 đóng, lượt cron 12:35 +07 dispatch 05:35:51Z); chỉ ghi
  nhận, không kết luận nguyên nhân muộn.
- **dpkg.log của boot #73 đã MẤT** (file hiện tại chỉ còn bracket
  #74): /var/log reset mỗi boot. Bản ghi T5-127 (1.509 dòng,
  03:05:03–03:09:22Z) là bằng chứng duy nhất còn lại cho bracket
  #73 — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123). `btmp` cũng chỉ bắt đầu 04:55:18Z (boot hiện tại).

### 2.2 Reboot đã chốt trong mù — #73 + #74 (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 73 | **03:04:25Z** (chính xác từng giây) | 81464315 → 5e522260 | Chốt từ T5-127: `uptime -s` + btime 1794884665 + `who -b` + journal first entry 03:04:36Z + cờ POSTBOOT_PASS 03:11:16Z. **Số thứ tự TẠM THỜI.** |
| 74 | **04:55:04Z** (chính xác từng giây) | 5e522260 → c279cf46 | Chốt từ lượt này: `uptime -s` đọc tươi (05:41:09Z) + btime 1794891304 + `who -b` 04:55 + boot_id c279cf46 + journal first entry 04:55:18Z + probe #47 05:42:21Z boot c279cf46 ok=2 fail=0 + 4 session trong vùng C. **Số thứ tự TẠM THỜI.** |

**Clock:** F74 ≈ 0 (`date -u` 05:41:13Z vs HTTP `Date`
example.com 05:41:12Z, google.com 05:41:13Z, cloudflare.com
05:41:13Z — khớp trong 0–1 s). F72 ≈ 0 (đã kiểm 02:40Z đợt 127).
F73: **CHƯA TỪNG ĐO TRỰC TIẾP** — không có lần kiểm HTTP `Date`
nào trên boot #73 trong tài liệu đợt 127 (đã grep toàn bộ LIMITS
đợt 127: 0 lần nhắc F73). Bằng chứng duy nhất về clock tại #73
là chênh 6 s T5-127 §2.4 ghi lại (xem dưới).

**CẬN NHẢY CLOCK TẠI #73 — X ∈ [−10 s, +10 s] (biên T5) với gợi ý
có hướng lùi ≥6 s (T5-127 §2.4):**
- T5-127 §2.4: btime boot mới 03:04:25Z sớm hơn mốc repair
  03:04:31Z (đồng hồ cũ) 6 s — repair chạy trước, reboot sau, nên
  đồng hồ mới lùi ít nhất 6 s so với đồng hồ cũ; T5 kết luận tuổi
  #72 ≈ 54m08s (±~10 s). T2 dùng biên ±10 s này NGUYÊN VĂN làm
  biên chứng nhận cho cả hai gap kề #73 (xem §2.5) — không tự
  suy rộng biên, không dịch chuyển trung điểm.
- **2 nhân chứng nhảy tại #73:** 2 session sinh trước 03:04:25Z
  có mtime sau 03:04:25Z (quét 340 exec-log):
  - T5 §8.2 (birth 03:04:06Z, mtime 03:04:35Z — poll 10 lúc
    03:04:30Z, TRIGGER=YES; session đánh giá 5/5 của T5 ngay
    trước reboot);
  - T3 gatewait (birth 02:49:41Z, mtime 03:04:41Z — poll #5/#6
    trên boot #72, watcher bị reboot giết, flush cuối 03:04:41Z).
  Cả hai đều là session watcher/poll sống qua ranh giới reboot —
  củng cố reboot xảy ra trong (03:04:06Z, 03:04:41Z] theo đồng
  hồ các session, khớp btime 03:04:25Z. Không đặt được cận số
  học chặt từ hai nhân chứng này (không biết thời lượng thật của
  session); cận operative vẫn là ±10 s của T5.
- **0 nhân chứng nhảy tại #74:** **0 session** sinh trước
  04:55:04Z có mtime sau 04:55:04Z (quét 340 exec-log). Quan sát
  cũ-clock muộn nhất trước #74: session mtime 04:39:41Z — cách
  btime tới 923 s nên chỉ cho cận lỏng |X74| < 923 s; cận chặt
  tới từ đo F74 ≈ 0 trực tiếp (±1 s).
- **Cận từ hai lần đo F KHÔNG áp được cho #73** (F73 chưa đo) —
  ghi rõ để luồng sau khỏi tưởng có cận F73. Cho #74: F74 ≈ 0
  (±1 s) là bằng chứng trực tiếp, không cần cận hai lần đo.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #72→#73 = **3.248 s (54'08")** — **CHỨNG NHẬN DẠNG KHOẢNG
  [3.238 s, 3.258 s]** (đoạn A đóng, xem §2.3 + §2.5).
- Gap #73→#74 = **6.639 s (1h50'39")** — **CHỨNG NHẬN DẠNG KHOẢNG
  [6.629 s, 6.649 s]** (đoạn B đóng, xem §2.3 + §2.5).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo) — #73 VÀ
  #74 ĐỀU VÀO DẢI:** #73 từ #72 dự kiến [02:42:25Z, 05:01:21Z]
  (p10–p90 FULL54); thực tế **#73 03:04:25Z NẰM TRONG dải** (lần
  thứ ba liên tiếp trong dải). #74 từ #73 dự kiến [03:36:34Z,
  05:55:30Z] (p10–p90 FULL54); thực tế **#74 04:55:04Z NẰM
  TRONG dải** (lần thứ tư liên tiếp trong dải).
- Dải cơ học cho #75 từ #74 (p10–p90 FULL56): [05:27:27Z,
  07:39:18Z]; hiệu dụng sau probe #47: [05:42:21Z, 07:39:18Z].
  Cận dưới p10 05:27:27Z đã qua lúc T2 viết LIMITS (~05:54Z) mà
  vẫn boot #74 — dải là cơ học, không phải dự báo nên không có
  gì sai; #75 vẫn có thể tới bất kỳ lúc nào trong dải.
- **#70 tới sớm hơn cả cận dưới p10 (đợt 125):** dải từ #69 là
  [21:11:16Z, 23:29:41Z]; #70 thật 20:54:19Z — ghi nhận đợt 125,
  không đổi lượt này.

**Reboot #73 + #74 — CHỈ GHI NHẬN giờ + bracket replay (mới):**
- #73 xảy ra GIỮA đợt 127 (giết repair của T5 + watcher T3/T5);
  #74 xảy ra SAU khi đợt 127 đóng (T10 đóng 04:28:53Z trên boot
  #73; đợt 128 mở trên boot #74 — lượt cron 12:35 +07 dispatch
  05:35:51Z, replay #74 đang chạy lúc đó).
- **Số thứ tự TẠM THỜI** (như #69/#70/#71/#72).

### 2.3 Hoạt động trong khoảng mù — vì sao A, B, C đều đóng

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **20 file** +
hidden_files **513 file**; **533 file, 524 mốc giây phân biệt /
524 mốc float phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3 — "mốc" là
mtime float phân biệt, không phải giây tròn; lần này giây = float
= 524, không có file nào trôi mtime khỏi cửa sổ giữa hai lần quét).
Chia mù làm ba đoạn bởi #73 (03:04:25Z) và #74 (04:55:04Z):

- **Đoạn A: 02:41:09Z → 03:04:25Z (23'16" = 1.396 s, boot #72
  81464315) — ĐÓNG (mọi khoảng mtime đều < sàn):**
  - **123 mốc**, lỗ lớn nhất **95 s** (02:51:07Z → 02:52:42Z);
    các lỗ còn lại đều < 95 s. Mốc đầu 02:41:09Z (head 0 s —
    chính probe #46); mốc cuối **03:03:30Z** (đuôi chỉ **54 s**).
    **12 session** chạm đoạn A.
  - Cửa sổ sàn [A-lo, A-hi] RỖNG (A-lo = 03:00:16Z > A-hi =
    02:45:18Z vì đoạn A dài 1.396 s < 2×sàn 2.294 s) — đoạn A
    không đóng bằng mốc trong cửa sổ sàn mà đóng bằng luật
    mọi-khoảng < sàn (đầu + trong + đuôi đều < 1.147 s).
  - **2 session bắc qua cắt A-hi (02:45:18Z)** (birth 02:43:18Z
    mtime 02:49:04Z; birth 02:44:53Z mtime 02:46:52Z).
  - Đuôi A (02:45:18Z, 03:04:25Z] DÀY ĐẶC, không trống: 11 file
    ngoài cây + 3 file repo-1 (T1 E4-desk 02:45:21Z, T6 lockhealth
    02:50:25Z, T4 EPERM LIMITS 02:53:28Z) + 60 file hidden_files
    (cờ .done T1/T7 02:45:35Z/02:45:38Z, file T4/T3/T5/T6/T9 đợt
    127, T5 poll9 03:03:30Z) + 0 file /tmp.
  - **Kết luận đoạn A: ĐÓNG — 0 ẩn.**
- **Đoạn B: 03:04:25Z → 04:55:04Z (1h50'39" = 6.639 s, boot #73
  5e522260) — ĐÓNG (mọi khoảng mtime đều < sàn):**
  - **345 mốc**, lỗ lớn nhất **632 s** (04:08:15Z → 04:18:47Z —
    trong lúc driver T3 chạy leg xen kẽ); các lỗ còn lại đều
    < 632 s. Mốc đầu 03:04:30Z (head 6 s — poll T5); mốc cuối
    **04:47:24Z** (đuôi chỉ **459 s**). **10 session** chạm đoạn B.
  - Cửa sổ sàn [B-lo=03:23:32Z, B-hi=04:35:57Z] có mốc dày đặc.
  - **0 session bắc qua cắt B-hi (04:35:57Z)** — không cần thiết:
    điều kiện đóng là đuôi (459 s < sàn 1.147 s), cùng luật đã
    dùng cho đoạn A mù #46 (đuôi trống mới là điều kiện mở).
    **1 session chạm đuôi B** (birth = mtime = 04:39:41Z — một
    lệnh ngắn của luồng khác).
  - Đuôi B (04:35:57Z, 04:55:04Z] CÓ quan sát ở cả 4 phạm vi:
    repo-1 **1** (LIMITS gộp đợt 127, 04:46:48Z), hidden_files
    **2** (prereg-e4batch.md 04:44:52Z — parent áp đính chính E4
    đợt 127 §12(a); build-loop-log.md 04:47:24Z — T10 ghi log
    đóng đợt), ngoài cây **1** (exec-log 04:39:41Z), /tmp **0**.
  - **Kết luận đoạn B: ĐÓNG — 0 ẩn.** (Prereg dự báo B có thể mở
    vì tưởng máy yên sau ~04:28Z — thực tế có 3 quan sát muộn
    không lường trước; xem §4 mục 1.)
- **Đoạn C: 04:55:04Z → 05:42:21Z (47'17" = 2.837 s, boot #74
  c279cf46) — ĐÓNG bằng đo uptime trực tiếp + probe #47 + dấu
  boot tươi:**
  - **`uptime -s` lúc 05:41:09Z = 04:55:04Z** chứng minh máy up
    liên tục từ #74 tới lúc đo; probe #47 05:42:21Z đọc boot_id
    c279cf46 tươi — cùng boot_id với boot bắt đầu 04:55:04Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B.) Đoạn C
    dài 2.837 s > sàn nên không áp cắt độ dài; uptime trực tiếp
    là closer cho toàn đoạn.
  - **Chuỗi dấu boot tươi củng cố:** 4 session chạm vùng C
    (birth sớm nhất 05:40:24Z — luồng đợt 128) + 56 mốc mtime
    (mốc đầu 05:40:28Z — luồng đợt 128 mở; mốc cuối 05:42:20Z —
    file của luồng đợt 128). Lỗ mtime (04:55:04Z → 05:40:28Z]
    2.725 s là máy yên sau boot (lượt cron 12:35 +07 mở đợt 128
    lúc 05:35Z, luồng bắt đầu ghi ~05:40Z), không observer —
    nhưng uptime đóng đoạn này. 0 session bắc qua cắt C-lo
    (05:14:11Z) / C-hi (05:23:14Z) — không cần vì uptime là
    closer.
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #47 ĐÓNG HOÀN TOÀN.** Cả ba đoạn
đều đóng; 2 reboot đã chốt giờ (#73 03:04:25Z + #74 04:55:04Z —
chính xác từng giây trên đĩa) + **0 ẩn**. Mù #47: **ĐÓNG**.
Đây là mù đóng hoàn toàn đầu tiên kể từ mù #41 (T7-123).

Ngoài hai cây: **70 file** có mtime trong mù #47 (agents —
exec-log/tool-output chiếm đa số; 5 file stage paths-loop đợt 127;
self-improvement bookkeeping; proactivity; chi tiết xem
blind47-outside.txt); **/tmp: 6 file** trong mù #47 (xem
blind47-tmp.txt — 0 file trong đuôi A, 0 file trong đuôi B).
Boot_id nhắc trong exec-log sinh/viết trong mù: 81464315 3 file,
5e522260 1 file, c279cf46 1 file (phiên T2 này).

### 2.5 Phân phối gap — CERT n=39 → n=41 / FULL n=54 → n=56 (2 gap mới)

**Gap #72→#73 = 3.248 s (54'08") CHỨNG NHẬN DẠNG KHOẢNG [3.238 s,
3.258 s]** — đoạn A mù #47 đóng (xem §2.3). Biên ±10 s là biên
của T5 (T5-127 §2.4: tuổi #72 ≈ 54m08s ±~10 s do chênh đồng hồ
tại #73); F73 chưa từng đo trực tiếp nên KHÔNG tuyên bố dạng
điểm. Gợi ý có hướng (repair stamp: đồng hồ lùi ≥6 s tại #73 →
giá trị thật có thể ở nửa trên của biên) chỉ ghi làm caveat,
không dịch chuyển trung điểm (theo đúng thực hành của T5: giữ
số danh nghĩa ±10 s). Tiền lệ: gap #66→#67 chứng nhận dạng khoảng
[27'06", 28'28"] đợt 124, vào CERT/FULL ở trung điểm.

**Gap #73→#74 = 6.639 s (1h50'39") CHỨNG NHẬN DẠNG KHOẢNG [6.629 s,
6.649 s]** — đoạn B mù #47 đóng (xem §2.3). Cùng biên ±10 s của
T5 cho đầu mút chung #73; F74 ≈ 0 (±1 s, đã đo trực tiếp lượt
này) được hấp thụ trong biên. Gợi ý có hướng: giá trị thật có
thể ở nửa dưới của biên (cùng bước lùi tại #73) — caveat, không
dịch chuyển trung điểm.

**Gap #71→#72 = 9.876 s (2h44'36") VẪN CHỈ LÀ SPAN** — đoạn A mù
#46 mở (T4-127 §2.3). Không đưa vào FULL/CERT.

**Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN** — đoạn G1 mù
#45 mở (T7-126 §2.3). Không đưa vào FULL/CERT.

**Gap #68→#69 = 10.880 s (3h01'20") VẪN CHỈ LÀ SPAN** — đoạn D mù
#44 mở (T7-126 §2.4). Không đưa vào FULL/CERT.

**Cross-check tái hiện T7(126) 100%:** chạy blind45-gaps.py
verbatim cho lại đúng CERT n=39 / FULL n=54 của T7 đợt 126 (xem
blind47-gaps.txt: CERT39 mean 1h42'14" median 1h57'56" p10
0h31'13" p90 2h24'46" sd 0h43'53" min 0h19'07" max 3h14'08";
FULL54 mean 1h48'58" median 1h56'28" p10 0h32'09" p90 2h51'05"
sd 0h57'39" min 0h19'07" max 5h43'18"; in 90–150' = 29, <60' = 10,
>180' = 6, >240' = 2 — khớp T7-126 §2.5 từng số). Hai gap mới
vào ở trung điểm (3.248 s + 6.639 s).

- **CERT n=41: mean 1h41'16" median 1h54'16" p10 0h31'47" p90
  2h24'11" sd 0h43'27" min 0h19'07" max 3h14'08".**
- **FULL n=56: mean 1h48'02" median 1h54'38" p10 0h32'24" p90
  2h44'14" sd 0h57'04" min 0h19'07" max 5h43'18";** in 90–150' = 30,
  <60' = 11, >180' = 6, >240' = 2.
- Chạy nhạy LO/HI (cả hai gap ở biên dưới / biên trên): CERT41-LO
  mean 1h41'16" sd 0h43'28"; CERT41-HI mean 1h41'17" sd 0h43'27";
  FULL56-LO mean 1h48'01"; FULL56-HI mean 1h48'02" — phân phối
  gần như không đổi (trung bình lệch ≤1 s); biên ±10 s là không
  đáng kể với thống kê.
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (cả hai gap mới
  đều nằm trong dải).
- **Tốc độ reboot (đồng hồ ghi nhận):** 74 / 152,62 h = **1 reboot
  mỗi 123,7 phút** (từ #1 2026-11-10T20:18:10Z tới #74
  2026-11-17T04:55:04Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 78 / 152,62 h = **1 mỗi 117,4 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn G1 (+4) và mù #46
  đoạn A (+4). Mù #47 đóng hoàn toàn nên +0.
- **#73 và #74 đều vào dải cơ học (xem §2.2):** lần thứ ba và thứ
  tư liên tiếp trong dải — chuỗi "ngoài dải" đã reset từ đợt 126.

### 2.6 Trạng thái các mù cũ — #46 A / #45 G1 / #44 D / #40 B / #43 KHÔNG KIỂM LẠI (quyết parent)

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #47 (mới) | **ĐÓNG HOÀN TOÀN (mới, lượt này — A+B+C đóng)** | 2 reboot đã chốt giờ (#73 + #74) + 0 ẩn; gap #72→#73 + #73→#74 chứng nhận dạng khoảng; CERT n=41 / FULL n=56 |
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
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#74 vẫn TẠM THỜI vì mù này |
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

**Còn thiếu gì để chứng nhận gap #71→#72:** đúng **1 quan sát sau
01:51:10Z** trong đuôi (00:50:24Z, 02:10:17Z]. Đoạn A mù #46 đã
ĐỂ MỞ theo tiền lệ quyết đợt 126 §12(h) nên gap giữ SPAN cho tới
khi có bằng chứng ngoài VM. **Không giao luồng sau kiểm lại A**
mù #46 (quyết đã bao phủ: đuôi trống thì để mở luôn).

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 34 — chênh 0 (lần thứ 34 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round128-t2, đổi OUT sang
  round128-t2) **05:52:09Z → 05:52:31Z 17/11 (22 s, có SCAN-END)**.
  Scan chạy trên boot #74, SAU khi mù #47 đã đóng bằng probe #47
  (05:42:21Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **856 dòng / 240 file** (phạm vi 3.041 file); R7b đối
  chiếu: **881 dòng / 257 file** (phạm vi 12.434 file); copies:
  **25 dòng / 17 file** — y hệt lần 33. Đối chiếu chéo:
  856+25=881=R7b, **chênh 0**.
- **+6 dòng / +2 file so với lần 33** (850/238 → 856/240), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND127_LIMITS.md | +1 (0 → 1) | 04:46:48Z 17/11 | Tài liệu gộp đợt 127 (nhắc `writeFileSync` 1 lần); viết SAU scan lần 33 (02:48:45Z 17/11) nên lần này mới vào |
  | docs/PHASE9_ROUND127_T4_EPERM_LIMITS.md | +5 (0 → 5) | 02:53:28Z 17/11 | Tài liệu T4 đợt 127 (nhắc `writeFileSync` 5 lần); viết SAU scan lần 33 nên lần này mới vào |
- Phạm vi: 3.041 = 3.026 + 15 net (**15 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 15 file mới gồm 7 file LIMITS
  đợt 127 (gộp + T3/T4/T5/T6/T8/T9) + 8 file đợt 128 đã có trên
  đĩa lúc quét (T1 DEF v0.4 ×2, T5 infra, T6 lock, T7 sched, T8
  verify, T9 headroom, script clicktest-85m4-webkit-w7-hb128.mjs
  của T8); 0 file mất). Copies y hệt lần 33 (diff 0 dòng).
- **Kết luận: 34 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #47.

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
  né EPERM trong mù #47.

## 3. RAM trong mù #47 — max 2.558 MB (42% guard), birefnet KHÔNG chạy

- **3 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #47 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 05:41:09Z | **1.239.736 kB** | Trước probe #47 (boot #74) |
  | 05:53:14Z | **2.726.572 kB** | Trước khi viết LIMITS (boot #74) |
- **Max RAM biết được TRONG mù #47 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 198 mẫu RAM; **max 2.558 MB**
  (T9 poll-t9.log, 02:47:41Z, đoạn A, dòng `RAMavail=2558MB`
  đã xác minh trực tiếp trong log)
  = **42% ngưỡng guard** — cao hơn max 2.551 MB mù #46 một ít
  nhưng vẫn thấp hơn max kỷ lục 4.576 MB mù #42; đoạn A max
  **2.558 MB**; đoạn B max **1.452 MB** (03:07:06Z); đoạn C max
  **1.071 MB** (05:41:54Z).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 2.558 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T4 đợt 127)

1. **Prereg dự báo B SAI — sửa công khai, verdict NGƯỢC DỰ BÁO
   (mới, §0 + §2.3):** prereg §2 dự báo đoạn B "có thể mở" vì
   tưởng đuôi sau quan sát cuối ~04:28Z tới #74 dài 20–27' vượt
   sàn — thực tế B ĐÓNG nhờ 3 quan sát muộn không lường trước
   (LIMITS gộp đợt 127 04:46:48Z + prereg-e4batch.md 04:44:52Z +
   build-loop-log.md 04:47:24Z), đuôi thật chỉ 459 s < sàn
   1.147 s. Bài học: "máy yên sau khi đợt đóng" không có nghĩa
   là không còn quan sát — main agent / T10 vẫn ghi file sau
   khi đợt đóng (log đóng đợt, đính chính prereg). Dự báo đuôi
   phải tính cả các file đóng đợt, không chỉ giờ đóng của luồng
   đo cuối. Verdict B ĐÓNG là số đo, không phải ý kiến.
2. **Mù chứa HAI reboot — chia ba đoạn, không ép khớp brief
   (mới, §0 + §2.2):** brief viết mù #47 chứa #73; thực tế #74
   đã xuất hiện sau khi đợt 127 đóng (04:55:04Z) nên mù chia
   thành A/B/C thay vì A/B. T2 không bỏ qua #74 để khớp brief —
   điều tra cả hai gap, cả hai đều chứng nhận được dạng khoảng.
   Bài học: brief có thể lỗi thời ngay khi viết (reboot xảy ra
   giữa lúc viết brief và lúc chạy); số đo trên đĩa là chuẩn.
3. **Cửa sổ sàn RỖNG vẫn đóng được đoạn (mới, §2.3 đoạn A):**
   đoạn A dài 1.396 s < 2×sàn nên [A-lo, A-hi] rỗng — không có
   mốc nào "nằm trong cửa sổ sàn" được. Đoạn vẫn đóng bằng luật
   mọi-khoảng < sàn (lỗ lớn nhất 95 s, đuôi 54 s). Ghi rõ để
   luồng sau khỏi tưởng "cửa sổ sàn rỗng = không đóng được".
4. **F73 chưa đo — ghi rõ, không bịa cận (mới, §2.2 + §2.5):**
   đã grep toàn bộ LIMITS đợt 127: 0 lần nhắc F73. Cận operative
   cho cả hai gap kề #73 là biên ±10 s của T5 (T5-127 §2.4),
   dùng nguyên văn, không dịch chuyển trung điểm. Gợi ý có hướng
   (repair stamp) chỉ là caveat. Hai nhân chứng nhảy tại #73
   (session T5 §8.2 + watcher T3) củng cố giờ reboot nhưng
   không cho cận số học chặt — ghi rõ giới hạn này.
5. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo probe #47 boot c279cf46 ok=2 fail=0 ĐÚNG; dự báo
   đoạn C ĐÓNG bằng uptime trực tiếp ĐÚNG; dự báo đoạn A CÓ THỂ
   ĐÓNG ĐÚNG (lỗ lớn nhất thật 95 s); dự báo đoạn B CÓ THỂ MỞ
   **SAI** (B đóng, xem mục 1); dự báo gap #72→#73 dạng khoảng
   ĐÚNG (không phải điểm, vì F73 chưa đo); dự báo EPERM 0 sóng
   ĐÚNG; dự báo WFS chênh 0 ĐÚNG (856 dòng — thấp hơn khoảng dự
   báo ~860–900 một ít, 4 dòng; dự báo là ước rough, không phải
   tiêu chí pass/fail); dự báo RAM max < 4.576 MB ĐÚNG (2.558 MB)
   — không sửa sau khi thấy số, trừ việc ghi rõ dự báo B sai ở
   mục 1.
6. **Kiểm lại boot TRƯỚC (05:41:09Z) và SAU khi viết LIMITS
   (05:53:14Z, 05:53:57Z, 05:54:37Z):** cả bốn lần đều boot
   c279cf46 (#74), uptime-s 04:55:04Z — KHÔNG có reboot giữa
   phiên T2 lượt này. Probe #47 và mù #47 KHÔNG bị ảnh hưởng
   bởi reboot sau đó (chưa xảy ra tới lúc đóng).
7. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
   model đóng/nhạc bản quyền.**
8. **Không quét toàn workspace lượt này:** chỉ dùng góc hẹp/mục
   tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ repo-1/goals
   + /tmp + exec-logs).
9. **Stage batch:** chỉ 1 file text (LIMITS doc này),
   NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
   checkpoint + stage file).
10. **Ghi rõ:** số thứ tự reboot #47–#74 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
11. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F74 ĐÃ KIỂM (≈ 0) và F73 CHƯA ĐO
    vào hồ sơ (xem §2.2 + §2.6).
12. **Cross-check tái hiện T7(126) 100%** (CERT n=39 / FULL n=54)
    trước khi kết luận số mới — chạy blind45-gaps.py verbatim qua
    exec (xem blind47-gaps.txt).
13. **md5 preview.tsx / media.ts KHÔNG ĐỔI trong lúc làm việc
    (ghi nhận):** preview.tsx 03bf029f (baseline), media.ts
    2c384ed1 — khớp baseline sau khi T3 gỡ H3f. T2 không sửa
    production file nào.
14. **Các luồng đợt 128 khác đang chạy lúc T2 đóng** — T2 chỉ ghi
    nhận trạng thái, không phụ thuộc kết quả các luồng đó.
15. **T2 KHÔNG mở Xvfb** (luồng probe không cần browser) nên
    không có Xvfb nào để kill — luật đứng đợt 127 §12.1.3 (mỗi
    driver tự kill Xvfb của mình) không phát sinh việc lượt này.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #47: ĐÓNG HOÀN TOÀN (mới, xem §2.3).** 2 reboot đã
   chốt giờ (#73 + #74) + 0 ẩn. Gap #72→#73 + #73→#74 chứng nhận
   dạng khoảng (xem §2.5). **CERT n=41 / FULL n=56 (mới).**
2. **Gap #72→#73 = [3.238 s, 3.258 s] + gap #73→#74 = [6.629 s,
   6.649 s] (mới — xem §2.5, CERT n=41, FULL n=56).** Cả hai đều
   dạng khoảng vì F73 chưa từng đo trực tiếp; biên ±10 s của T5.
   Không có gì cần parent quyết thêm cho hai gap này ngoài việc
   ghi nhận.
3. **Replay #74 trở lại 1.509 dòng (mới — xem §2.1 + §2.2).**
   Khác hình dạng 350 dòng của #72; cùng gói cuối gstreamer1.0-
   tools, cùng mẫu apt os-intent, đã đóng băng. **#72 là ngoại lệ
   một lần** (trả lời câu hỏi theo dõi đợt 128, quyết parent
   §12(i) đợt 127). Lưu ý replay #74 khởi động muộn (+40m39s) —
   T5 (chủ quản replay) theo dõi tiếp nếu muốn.
4. **Mù #46 (đoạn A): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (tiền lệ
   quyết đợt 126 §12(h), đính chính đợt 127 §12(c)). T2 không
   kiểm lại lượt này. Gap #71→#72 giữ SPAN.
5. **Mù #45 (đoạn G1): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h)). T2 không kiểm lại lượt này. Gap #70→#71 giữ SPAN.
6. **Mù #44 đoạn D: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h), kiểm sâu 1 lần đã xong đợt 126). T2 không kiểm lại
   lượt này. Gap #68→#69 giữ SPAN.
7. **Mù #43 (gap #67→#68): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ**
   (quyết đợt 124 §12.4). T2 không kiểm lại lượt này. Gap #67→#68
   giữ SPAN.
8. **Mù #40 đoạn B: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   124 §12.3). T2 không kiểm lại lượt này. Gap #63→#64 giữ SPAN.
9. **Gap #66→#67 = KHOẢNG [27'06", 28'28"] ĐÃ CHỨNG NHẬN DẠNG
   KHOẢNG (đợt 124) — parent ĐÃ CHẤP NHẬN cả ba điểm (§12.5).**
   Không đổi lượt này.
10. **Reboot #74 (04:55:04Z, boot c279cf46) — CHỈ GHI NHẬN giờ +
    bracket replay (mới, xem §2.2 cuối + §2.1).** Gap #73→#74
    thuộc mù #47 đoạn B, đã đóng hoàn toàn. **Không tự đánh số
    thứ tự chắc chắn** — số #74 là tạm thời như #73. **Lưu ý
    replay:** bracket 05:35:43–05:38:51Z đã ghi trong LIMITS này
    (sẽ mất theo reboot sau, như bracket #71/#72/#73).
11. **RAM max 2.558 MB = 42% guard (mới — xem §3).** Cao hơn max
    2.551 MB mù #46 một ít nhưng vẫn thấp hơn max kỷ lục 4.576 MB
    mù #42. **Birefnet KHÔNG chạy** (vẫn dưới guard 6 GB; quyết
    parent §12.7 vẫn đứng). u2net vẫn là fallback chính thức.
12. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
    --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
    117, chưa trả lời — nhắc lần 14 ở đợt này). Watcher này sẽ
    lấp đúng loại lỗ như đuôi đoạn B của mù #47 (459 s — lần này
    may mắn có quan sát muộn, lần sau chưa chắc).
13. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
    parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
    117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
14. **EPERM không tuyên bố đã hết** (sóng gần nhất ~137h47'
    trước probe #47). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
15. **Mù #48 MỚI MỞ (từ probe #47 05:42:21Z) — việc của lượt sau:**
    probe #48 + điều tra đoạn từ #74 (dải cơ học cho #75:
    [05:27:27Z, 07:39:18Z], hiệu dụng sau probe #47: [05:42:21Z,
    07:39:18Z]). T2 KHÔNG tự chạy probe #48 lượt này (nhịp probe
    là 1/lượt).
