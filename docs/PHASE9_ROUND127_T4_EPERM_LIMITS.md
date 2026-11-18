# PHASE9 ROUND127 T4 — EPERM: probe #46 + mù #46 (A MỞ, B ĐÓNG) + gap #71→#72 SPAN + WFS lần 33 chênh 0 + RAM max 2.551 MB

> Luồng T4, đợt 127 vòng lặp Phase 9 VCut Studio (lượt cron 09:35 +07,
> 17/11/2026; làm việc 02:40Z → 02:5xZ 17/11/2026).
> Nhiệm vụ: probe #46 + mù #46 mô tả ban đầu + boot mới ghi nhận + EPERM
> sweep + WFS lần 33 + RAM (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard
> + quyết parent §12.7, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round127-t4/prereg-t4.md (định nghĩa probe #46, mốc đối
> chiếu, dự báo A KHÔNG ĐÓNG ĐƯỢC / B ĐÓNG / gap #71→#72 SPAN + dự báo
> EPERM 0 sóng + WFS chênh 0 + RAM max < 4.576 MB). **Lỗi số học trong
> prereg (xem §4 mục 9):** prereg ghi gap danh nghĩa ~8.910 s — đó là
> độ dài đoạn A (8.891 s), gap thật là 9.876 s. Verdict SPAN không đổi.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #44 đoạn D / mù #42
> đoạn B / mù #43 và mù #40 B** (quyết parent đợt 124 §12.3 + §12.4 và
> đợt 125 §12(h): CHẤP NHẬN ĐỂ MỞ). G1 + mù #22/#28/#29/#30/#31/#35/
> #37/#38 đoạn G chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (02:41:09Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.743 s, last #45 23:42:06Z, boot
  ff7afbbb, exit 1); `once` ngay sau đó là **probe #46, boot
  81464315, ok=2 fail=0**, exit 0, 02:41:09Z; `status` chạy lại
  **ALIVE** (age 0 s, n=46), exit 0. Log v2 tăng đúng **3 dòng**
  (127 → 130) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=46, ts 02:41:09Z, boot 81464315.
- **Boot #72 (tạm) lúc 02:10:17Z, boot
  `81464315-ba1a-460d-b370-92a1673accc1`** — xác minh bằng `uptime -s`
  + btime 1794881417 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại CHÍNH XÁC so với UTC thật (HTTP `Date` 3 server độc lập
  khớp `date -u` trong 0–3 s) → **F72 ≈ 0**.
- **Khoảng mù #46 (MỚI): 23:42:06Z 16/11 → 02:41:09Z 17/11 (2h59'03") —
  KHÔNG ĐÓNG HOÀN TOÀN (A mở, B đóng; tối đa 4 ẩn).** Đoạn A **MỞ**
  (đuôi 4.793 s sau mốc cuối 00:50:24Z, 0 session bắc qua cắt A-hi,
  0 file trong đuôi ở cả 4 phạm vi); đoạn B **ĐÓNG** (uptime trực
  tiếp lúc probe #46 + dấu boot tươi). **1 reboot đã chốt trong
  mù (#72 02:10:17Z — mới, chính xác từng giây trên đĩa) + tối đa 4
  ẩn danh nghĩa trong đuôi đoạn A.**
- **Gap #71→#72 = 9.876 s (2h44'36") VẪN CHỈ LÀ SPAN — KHÔNG chứng
  nhận được (mới, mù #46, đoạn A mở, xem §2.5).** Đoạn A mở, đuôi
  4.793 s, tối đa 4 ẩn. Còn thiếu gì để chứng nhận: đúng 1 quan sát
  trong đuôi sau cắt A-hi 01:51:10Z (xem §2.6).
- **#72 tới TRONG dải cơ học:** dải từ #71 là [23:57:49Z, 02:16:45Z]
  (p10–p90 FULL54); #72 thật 02:10:17Z nằm trong dải — lần thứ hai
  liên tiếp trong dải sau khi #71 đã vào dải đợt 126. Ghi nhận,
  không đổi dải chứng nhận (gap #71→#72 là SPAN, không vào FULL).
- **CERT n=39 / FULL n=54 KHÔNG ĐỔI** (tái hiện 100% bằng
  blind45-gaps.py verbatim + ghi gap mới là SPAN — xem §2.5).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 98 file
  *.log có mtime trong mù #46 (0 file repo-1, 98 file hidden_files);
  4 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã biết**
  (T1 + T2 + 2× T10-O8 đợt 126). Quét mở rộng: **31 match thô / 22
  dòng duy nhất — phân loại hết** (4 dòng launcher trên + 18 dòng
  test-pass hasEperm). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11**
  (R7) — **~134h46'** trước probe #46. EPERM vẫn KHÔNG được tuyên
  bố là đã hết.
- **Quét writeFileSync lần 33: 850 dòng / 238 file** (phạm vi 3.026
  file); R7b đối chiếu 875 dòng / 255 file; copies 25 dòng / 17
  file — y hệt lần 32. Đối chiếu chéo 850+25=875=R7b, **chênh 0 —
  lần thứ ba mươi ba liên tiếp**. +6 dòng / +2 file so với lần 32,
  giải thích đúng hết bằng diff (xem §2.7). Async `.writeFile(`:
  vẫn đúng **2 vị trí helper đã biết** — 0 stray; mtime không đổi từ
  10/11.
- RAM: max biết được trong mù #46 **2.551 MB** (T5 wait-replay-b71,
  23:47:09Z, đoạn A) = **42% ngưỡng guard**; đoạn B không có mẫu.
  **Birefnet KHÔNG chạy, vẫn 0 lần chạy thành công trong gói** —
  2.551 MB vẫn dưới guard 6 GB; quyết parent §12.7 vẫn đứng (chỉ thử
  lại khi quan sát được available ≥ 6 GB).
- **Replay #72 KHÁC HÌNH DẠNG các replay trước (mới, xem §2.2):**
  dpkg.log chỉ **350 dòng, 02:35:39–02:48:06Z** (trước đây 1.509
  dòng), nhưng kết thúc cùng gói gstreamer1.0-tools và đã đóng băng
  lúc kiểm 02:49:31Z; bắt đầu +25m22 sau boot (trước đây +9m59).
  Apt history cho thấy cùng mẫu replay os-intent của host. **T4 chỉ
  ghi nhận bracket — T5 là chủ quản replay, giao T5 xem lại khác
  biệt số dòng.**
- **Đợt 127 lúc T4 đóng (~02:50Z):** các luồng khác đang chạy;
  boot vẫn #72 (kiểm 02:50:04Z). Hạn cứng đóng đợt 05:00Z 17/11.
  T4 KHÔNG chạy quét toàn workspace lượt này (đúng giới hạn phối hợp).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 02:40:54Z | boot_id `81464315-ba1a-460d-b370-92a1673accc1`; `who -b` Nov 17 02:10; `uptime -s` **2026-11-17 02:10:17**; btime **1794881417 = 2026-11-17T02:10:17Z**; journal chỉ 1 boot (81464315, first entry 02:10:29Z, last 02:40:04Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #71 đã mất theo reboot #72, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 02:41:09Z | **DEAD/STALE**, heartbeat n=45, ts 23:42:06Z, boot ff7afbbb, age **10.743 s** (đúng 2h59'03"); last sample probe #45; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 02:41:09Z | **probe #46, boot=81464315, ok=2 fail=0**, exit 0; dòng `boot changed ff7afbbb -> 81464315` (uptime since 2026-11-17 02:10:17) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 02:41:09Z | **ALIVE**, age 0 s, n=46, exit 0 |

Kiểm lại từ đĩa: log probe v2 **130 dòng** — 127 sau T7 đợt 126 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #45 +
dòng `boot changed` + dòng probe #46). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #45 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=46, ts 2026-11-17T02:41:09Z, boot
81464315-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #72: driver mở đợt 127
(round-in-progress.md mtime 02:37:39Z) + 1 session T4 trong vùng B
(birth 02:40:26Z — chính phiên probe này) + 23 mốc mtime trong vùng
B (mốc đầu 02:37:39Z — lúc mở đợt 127; mốc cuối 02:41:07Z — file của
luồng đợt 127). **Số thứ tự TẠM THỜI** (như #69/#70/#71).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #46 (23:42:06Z 16/11 → 02:41:09Z 17/11, 2h59'03")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #46: `uptime -s` = **2026-11-17 02:10:17Z**,
  boot_id `81464315-ba1a-460d-b370-92a1673accc1` — khác boot của
  probe #45 (ff7afbbb).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (02:40:54Z): chỉ **1 boot**
  (81464315, first entry 02:10:29Z, last 02:40:04Z). Journal/wtmp
  của boot ff7afbbb đã mất theo reboot #72 — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #72 — bracket replay ghi ngay trong lượt (bài học
  T7-125 §4 mục 4: kiểm boot trước MỖI lần đọc /var/log).** Lúc
  02:41:09Z file có **2 dòng** (đã bắt đầu replay: 2 dòng "startup
  packages configure" 02:35:39Z); lúc 02:48:06Z file có **350 dòng**,
  dòng cuối 02:48:06Z (status installed gstreamer1.0-tools);
  kiểm lại 02:49:31Z vẫn 350 dòng, cùng bracket — **đã đóng băng,
  replay xong**. **`/var/log/apt/` đã xuất hiện** (eipp.log.xz +
  history.log + term.log). **Replay #72 KHÁC HÌNH DẠNG các replay
  trước: 350 dòng thay vì 1.509 dòng** (#68/#70/#71 đều 1.509 dòng),
  bắt đầu +25m22 sau boot (trước đây +9m59), nhưng kết thúc cùng
  gói gstreamer1.0-tools; apt history.log cho thấy cùng mẫu apt-get
  replay os-intent của host (các entry Install: libdw1t64,
  libegl-mesa0, libevent-2.1-7t64, libgstreamer1.0-0, ...). **T4
  chỉ ghi nhận bracket + khác biệt — T5 là chủ quản replay.**
- **dpkg.log của boot #71 đã MẤT** (file hiện tại chỉ còn bracket
  #72): /var/log reset mỗi boot. Bản ghi T7-126 (1.509 dòng,
  23:35:40–23:37:46Z) là bằng chứng duy nhất còn lại cho bracket
  #71 — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123). `btmp` cũng chỉ bắt đầu 02:10:29Z (boot hiện tại).

### 2.2 Reboot đã chốt trong mù — #72 (mới, 02:10:17Z) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 72 | **02:10:17Z** (chính xác từng giây) | ff7afbbb → 81464315 | Chốt từ lượt này: `uptime -s` đọc tươi (02:40:54Z) + btime 1794881417 + `who -b` 02:10 + boot_id 81464315 + journal first entry 02:10:29Z + probe #46 02:41:09Z boot 81464315 ok=2 fail=0 + driver mở đợt 127 02:37:39Z + 1 session T4 trong vùng B. **Số thứ tự TẠM THỜI.** |

**Clock:** F72 ≈ 0 (`date -u` 02:40:54Z vs HTTP `Date`
example.com 02:40:56Z, google.com 02:40:56Z, cloudflare.com
02:40:57Z — khớp trong 0–3 s, phần lệch là thời gian chạy tuần
tự 3 lệnh curl). F71 ≈ 0 (đã kiểm 23:42Z đợt 126, trên boot #71).

**CẬN NHẢY CLOCK TẠI #72 — |X| ≲ 5 s (từ hai lần đo F):**
- **0 nhân chứng nhảy tại #72:** **0 session** sinh trước
  02:10:17Z có mtime sau 02:10:17Z (quét 326 exec-log).
- **Không có quan sát cũ-clock muộn trong vòng 1 h trước #72:**
  session mtime muộn nhất trước #72 là 00:50:24Z (LIMITS gộp 126)
  — cách btime tới 1h19'53" nên không đặt được cận có ý nghĩa từ
  phía này (tương tự #71 đợt 126).
- **Cận từ hai lần đo F:** F71 ≈ 0 (±2 s) và F72 ≈ 0 (±3 s) →
  |X| ≲ 5 s. Phiên sau #72 sớm nhất: session birth 02:40:26Z
  (+30m09 sau btime — driver mở đợt 127 lúc 02:37:39Z, không có
  phiên nào sinh ngay sau boot vì máy yên sau khi đợt 126 đóng xong).
- Gap #71→#72 là SPAN nên cận nhảy tại #72 không ảnh hưởng chứng
  nhận nào lượt này; ghi rõ để luồng sau khỏi mất công kiểm lại F72.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #71→#72 = **9.876 s (2h44'36")** — **VẪN CHỈ LÀ SPAN**
  (đoạn A mù #46 mở, xem §2.3).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo) — #72 ĐÃ
  VÀO DẢI:** #72 từ #71 dự kiến [23:57:49Z, 02:16:45Z] (p10–p90
  FULL54); thực tế **#72 02:10:17Z NẰM TRONG dải** (lần thứ hai
  liên tiếp trong dải: #71 đã vào dải đợt 126 sau 2 lần ngoài dải
  liên tiếp trước đó). Dải cơ học cho #73 từ #72 (p10–p90 FULL54):
  [02:42:25Z, 05:01:21Z]; hiệu dụng sau probe #46: [02:41:09Z,
  05:01:21Z]. Lưu ý: cận dưới p10 02:42:25Z đã rất gần lúc T4 viết
  LIMITS (~02:50Z) mà vẫn boot #72 — dải là cơ học, không phải dự
  báo nên không có gì sai; #73 vẫn có thể tới bất kỳ lúc nào trong
  dải.
- **#70 tới sớm hơn cả cận dưới p10 (đợt 125):** dải từ #69 là
  [21:11:16Z, 23:29:41Z]; #70 thật 20:54:19Z — ghi nhận đợt 125,
  không đổi lượt này.

**Reboot #72 — CHỈ GHI NHẬN giờ + bracket replay (mới, xảy ra
trước khi T4 mở):**
- Reboot này xảy ra TRƯỚC lượt cron 09:35 +07 (02:10Z) — đợt 127
  mở trên boot #72 (round-in-progress.md mtime 02:37:39Z, RAM lúc
  mở ~1,6 GB). Gap #71→#72 danh nghĩa 2h44'36" thuộc mù #46
  (đoạn A), để điều tra tiếp — T4 mở điều tra lượt này, kết luận
  đoạn A MỞ (xem §2.3) và ĐỂ MỞ theo quyết parent §12(c) đợt 127.
- **Số thứ tự TẠM THỜI** (như #69/#70/#71).

### 2.3 Hoạt động trong khoảng mù — vì sao A mở, B đóng

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **16 file** +
hidden_files **330 file**; **346 file, 336 mốc giây phân biệt /
336 mốc float phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3 — "mốc" là mtime float
phân biệt, không phải giây tròn; lần này giây = float = 336, không
có file nào trôi mtime khỏi cửa sổ giữa hai lần quét). Chia mù làm
hai đoạn bởi #72 (02:10:17Z):

- **Đoạn A: 23:42:06Z 16/11 → 02:10:17Z 17/11 (2h28'11" = 8.891 s,
  boot #71 ff7afbbb) — MỞ vì đuôi 4.793 s sau mốc cuối 00:50:24Z:**
  - **Đợt 126 đóng dần trong A:** T7 LIMITS (mtime 00:04:47Z) +
    T10 phase1-summary (00:45:06Z) + **LIMITS gộp đợt 126
    (docs/PHASE9_ROUND126_LIMITS.md, mtime 00:50:24Z — mốc cuối
    đoạn A)**. Sau 00:50:24Z máy yên hoàn toàn tới reboot #72.
  - Mật độ mtime: **313 mốc**, lỗ lớn nhất **4.793 s** — chính là
    đuôi (00:50:24Z → 02:10:17Z); các lỗ còn lại đều < 650 s (lớn
    thứ hai ~640 s, xem log). Mốc đầu 23:42:06Z (head ~1 s — chính
    probe #45); mốc cuối **00:50:24Z**. **26 session** chạm đoạn A.
    Cửa sổ sàn [00:01:13Z, 01:51:10Z] có mốc — nhưng đuôi sau mốc
    cuối vẫn dài hơn sàn nhiều lần nên đoạn không đóng (bài học
    T7-125 §4 mục 1: mốc trong cửa sổ sàn chỉ loại trừ reboot ẩn
    CÓ im lặng bao phủ cắt; đuôi trống sau mốc cuối mới là điều
    kiện đóng).
  - **1 session bắc qua cắt A-lo (00:01:13Z)** (birth 23:56:20Z
    mtime 00:03:15Z — một lệnh ngắn ~7 phút của luồng đợt 126) —
    chỉ loại trừ reboot đúng tại thời điểm cắt, không thu hẹp cửa
    sổ sàn; **0 session bắc qua cắt A-hi (01:51:10Z)** và **0
    session chạm đuôi A** (01:51:10Z, 02:10:17Z].
  - Đuôi: mốc cuối 00:50:24Z → #72 02:10:17Z = **4.793 s** >>
    sàn 1.147 s. File trong đuôi (sau cắt A-hi) ở cả 4 phạm vi:
    repo-1 **0**, hidden_files **0**, ngoài cây **0**, /tmp **0**
    — đuôi HOÀN TOÀN TRỐNG. /tmp: **1 file** trong cả mù #46
    (/tmp/round76-d8/hevc-a.mp4, 02:41:06Z — trong đoạn B, 3 s
    trước probe #46; asset test cũ, không phải quan sát trong
    đuôi A).
  - **Kết luận đoạn A: MỞ — tối đa 4 ẩn danh nghĩa**
    (⌊4.793/1.147⌋ = 4, cùng cách đếm như mù #45 tối đa 4 ẩn với
    đuôi 4.710 s và mù #44 tối đa 5 ẩn với đuôi 5.899 s).
  - **ĐỂ MỞ theo quyết parent đợt 127 §12(c)** (đuôi trống thì để
    mở luôn — xem §2.4 + §5 mục 2). KHÔNG giao kiểm lại nữa.
- **Đoạn B: 02:10:17Z → 02:41:09Z (30'52" = 1.852 s, boot #72
  81464315) — ĐÓNG bằng đo uptime trực tiếp + probe #46 + dấu
  boot tươi:**
  - **`uptime -s` lúc 02:40:54Z = 02:10:17Z** chứng minh máy up
    liên tục từ #72 tới lúc đo; probe #46 02:41:09Z đọc boot_id
    81464315 tươi — cùng boot_id với boot bắt đầu 02:10:17Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2.) Đoạn B dài 1.852 s > sàn
    nên không áp cắt độ dài; uptime trực tiếp là closer cho toàn
    đoạn.
  - **Chuỗi dấu boot tươi củng cố:** driver mở đợt 127
    (round-in-progress.md mtime 02:37:39Z) + 1 session T4 trong
    vùng B (birth 02:40:26Z) + 23 mốc mtime (mốc đầu 02:37:39Z —
    lúc mở đợt 127; mốc cuối 02:41:07Z — file của luồng đợt 127).
    Lỗ mtime (02:10:17Z → 02:37:39Z] 1.642 s là máy yên sau boot
    (lượt cron 09:35 +07 mở đợt 127 lúc 02:37Z), không observer —
    nhưng uptime đóng đoạn này.
  - **Kết luận đoạn B: ĐÓNG.**

**Kết luận trung thực: khoảng mù #46 KHÔNG ĐÓNG HOÀN TOÀN.**
Đoạn A mở (đuôi 4.793 s trống hoàn toàn), đoạn B đóng; 1 reboot
đã chốt giờ (#72 02:10:17Z — chính xác từng giây trên đĩa) +
**tối đa 4 ẩn danh nghĩa**. Mù #46: **MỞ (đoạn A)**.

Ngoài hai cây: **69 file** có mtime trong mù #46 (agents —
exec-log/tool-output chiếm đa số; 10 file stage paths-loop đợt 126;
self-improvement bookkeeping; proactivity; chi tiết xem
blind46-outside.txt); **/tmp: 1 file** trong mù #46 (xem trên).
Boot_id nhắc trong exec-log sinh/viết trong mù: ff7afbbb 5 file,
81464315 0 file (chưa có exec-log nào nhắc boot mới ngoài log
probe v2 — phiên T4 02:40:26Z không ghi boot_id vào nội dung log).

### 2.5 Phân phối gap — CERT n=39 / FULL n=54 KHÔNG ĐỔI (gap #71→#72 SPAN)

**Gap #71→#72 = 9.876 s (2h44'36") VẪN CHỈ LÀ SPAN — KHÔNG đưa
vào FULL/CERT** — đoạn A mù #46 mở, đuôi 4.793 s, tối đa 4 ẩn
(xem §2.3). Cùng luật như #55→#56 / #56→#57 (T6-119 §2.5), span
#59→#60 (10.680 s, T5-120 §2.5), span #61→#62 (5.689 s, T4-121
§2.5), span #63→#64 (7.933 s, T7-122 §2.5), span #67→#68
(9.692 s, T7-124 §2.5), span #68→#69 (10.880 s, T7-125 §2.5) và
span #70→#71 (9.082 s, T7-126 §2.5).

**Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN** — đoạn G1 mù
#45 mở (T7-126 §2.3). Không đưa vào FULL/CERT.

**Gap #68→#69 = 10.880 s (3h01'20") VẪN CHỈ LÀ SPAN** — đoạn D mù
#44 vẫn mở sau kiểm sâu 1 lần (T7-126 §2.4). Không đưa vào
FULL/CERT.

**Cross-check tái hiện T7(126) 100%:** chạy blind45-gaps.py
verbatim cho lại đúng CERT n=39 / FULL n=54 của T7 đợt 126 (xem
blind46-gaps.txt: CERT39 mean 1h42'14" median 1h57'56" p10
0h31'13" p90 2h24'46" sd 0h43'53" min 0h19'07" max 3h14'08";
FULL54 mean 1h48'58" median 1h56'28" p10 0h32'09" p90 2h51'05"
sd 0h57'39" min 0h19'07" max 5h43'18"; in 90–150' = 29, <60' = 10,
>180' = 6, >240' = 2 — khớp T7-126 §2.5 từng số). Gap #71→#72
không thêm vào nên thống kê giữ nguyên.

- **CERT n=39: mean 1h42'14" median 1h57'56" p10 0h31'13" p90
  2h24'46" sd 0h43'53" min 0h19'07" max 3h14'08".**
- **FULL n=54: mean 1h48'58" median 1h56'28" p10 0h32'09" p90
  2h51'05" sd 0h57'39" min 0h19'07" max 5h43'18";** in 90–150' = 29,
  <60' = 10, >180' = 6, >240' = 2.
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap SPAN không
  vào dải).
- **Tốc độ reboot (đồng hồ ghi nhận):** 72 / 149,87 h = **1 reboot
  mỗi 124,9 phút** (từ #1 2026-11-10T20:18:10Z tới #72
  2026-11-17T02:10:17Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 76 / 149,87 h = **1 mỗi 118,3 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn G1 (+4) và mù #46
  đoạn A (+4).
- **#72 đã vào dải cơ học (xem §2.2):** lần thứ hai liên tiếp
  trong dải — chuỗi "ngoài dải" đã reset từ đợt 126.

### 2.6 Trạng thái các mù cũ — #44 D / #40 B / #43 / #42 B KHÔNG KIỂM LẠI (quyết parent)

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #46 (mới) | **MỞ (mới, lượt này — đoạn A; B đóng)** | Đuôi A 4.793 s trống hoàn toàn, tối đa 4 ẩn; gap #71→#72 vẫn SPAN; **ĐỂ MỞ theo quyết parent §12(c) đợt 127** — không kiểm lại |
| #45 | **MỞ (đoạn G1)** | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 125 §12(h))** — T4 KHÔNG kiểm lại lượt này. Đuôi 4.710 s, tối đa 4 ẩn; gap #70→#71 vẫn SPAN |
| #44 | **MỞ (đoạn D, đã kiểm sâu 1 lần đợt 126 vẫn mở)** | **ĐỂ MỞ theo quyết parent §12(h)** — lần kiểm sâu cuối cùng đã xong đợt 126 (§2.4 T7-126); gap #68→#69 vẫn SPAN |
| #43 | **MỞ (đoạn B mù #42)** | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.4) — T4 KHÔNG kiểm lại lượt này.** Đuôi 4.503 s, tối đa 3 ẩn; gap #67→#68 vẫn SPAN |
| #42 | **KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'50", tối đa 3 ẩn)** | Đoạn A đóng → gap #66→#67 chứng nhận dạng khoảng; đoạn B mở = mù #43 |
| #41 | ĐÓNG HOÀN TOÀN | T7-123 §2.3; gap #64→#65 chứng nhận dạng khoảng, #65→#66 chứng nhận dạng điểm |
| #40 | KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'04", tối đa 1 ẩn) | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.3) — T4 KHÔNG kiểm lại lượt này.** 3 lần kiểm tra sâu đều 0; gap #63→#64 vẫn SPAN |
| #39 | KHÔNG ĐÓNG HOÀN TOÀN (I+K đóng, J mở, 2h56'14", tối đa 2 ẩn) | **Parent đã chấp nhận ĐỂ MỞ** (quyết đợt 123 §12.2) — KHÔNG kiểm lại |
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | Thử cuối đã thất bại đợt 121 — KHÔNG thử lại lượt này (theo brief T4); cần parent quyết có chấp nhận để mở như mù #35/#37 hay không |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #47–#72 vẫn TẠM THỜI vì mù này |
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
01:51:10Z** trong đuôi (00:50:24Z, 02:10:17Z]. Ngay cả khi A được
đóng, gap #71→#72 vẫn mang caveat F71/F72 ĐÃ KIỂM (≈ 0 cả hai đầu,
xem §2.2) nên có thể chứng nhận dạng điểm — nhưng chỉ khi A đóng
được; hiện tại A mở theo quyết §12(c) nên gap giữ SPAN. **Không
giao luồng sau kiểm lại A** (quyết §12(c) đã bao phủ: đuôi trống
thì để mở luôn).

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 33 — chênh 0 (lần thứ 33 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T4 trong round127-t4, đổi OUT sang
  round127-t4) **02:48:18Z → 02:48:45Z 17/11 (27 s, có SCAN-END)**.
  Scan chạy trên boot #72, SAU khi mù #46 đã đóng bằng probe #46
  (02:41:09Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **850 dòng / 238 file** (phạm vi 3.026 file); R7b đối
  chiếu: **875 dòng / 255 file** (phạm vi 12.419 file); copies:
  **25 dòng / 17 file** — y hệt lần 32. Đối chiếu chéo:
  850+25=875=R7b, **chênh 0**.
- **+6 dòng / +2 file so với lần 32** (844/236 → 850/238), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND126_T7_EPERM_LIMITS.md | +5 (0 → 5) | 00:04:47Z 17/11 | Tài liệu T7 đợt 126 (nhắc `writeFileSync` 5 lần); viết SAU scan lần 32 (23:54:52Z 16/11) nên lần này mới vào |
  | docs/PHASE9_ROUND126_LIMITS.md | +1 (0 → 1) | 00:50:24Z 17/11 | Tài liệu gộp đợt 126 (nhắc `writeFileSync` 1 lần); viết SAU scan lần 32 nên lần này mới vào |
- Phạm vi: 3.026 = 3.013 + 13 net (**14 file mới, 1 file mất**:
  kiểm bằng diff danh sách file — 14 file mới gồm 8 file đợt 126
  (LIMITS gộp + T1/T2/T4/T5/T7/T8/T9) + 4 file đợt 127 (T1 E4-desk,
  T2 DEF v0.3.1 ×2, T7 scheduler) + 2 script benchmark T3 đợt 127
  (f2_startup_analyze/probe 127t3); 1 file mất là
  apps/web/vite.n2.config.mjs — đã bỏ, thay bằng vite.n3.config.mjs
  đã có từ 09:25 16/11). Copies y hệt lần 32 (diff 0 dòng).
- **Kết luận: 33 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #46.

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
  né EPERM trong mù #46.

## 3. RAM trong mù #46 — max 2.551 MB (42% guard), birefnet KHÔNG chạy

- **3 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #46 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 02:41:09Z | **1.661.364 kB** | Sau probe #46 (boot #72) |
  | 02:48:06Z | **2.469.052 kB** | Trước khi viết LIMITS (boot #72) |
  | 02:50:04Z | **2.389.368 kB** | Trước khi viết LIMITS (boot #72) |
- **Max RAM biết được TRONG mù #46 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 82 mẫu RAM; **max 2.551 MB**
  (T5 wait-replay-b71, 23:47:09Z, đoạn A, dòng `RAMavail=2551MB`
  đã xác minh trực tiếp trong log — `poll 2 ... dpkg=1509
  frozen=yes ...`)
  = **42% ngưỡng guard** — cao hơn max 2.240 MB mù #45 nhưng vẫn
  thấp hơn max kỷ lục 4.576 MB mù #42; đoạn A max **2.551 MB**;
  đoạn B **không có mẫu** (máy yên sau boot #72 tới khi đợt 127
  mở — không observer nào ghi RAM trong B).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 2.551 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T7 đợt 126)

1. **Prereg sai số học gap — sửa công khai, verdict không đổi
   (mới, §0 + §2.5):** prereg §2 ghi gap #71→#72 danh nghĩa
   ~8.910 s — đó thực ra là độ dài đoạn A (8.891 s, từ probe #45
   23:42:06Z tới #72 02:10:17Z); gap thật tính từ btime #71
   23:25:41Z tới btime #72 02:10:17Z = 9.876 s (2h44'36"). Lỗi
   do lẫn hai mốc bắt đầu (probe #45 vs btime #71). Bài học:
   gap = btime(n+1) − btime(n), đoạn = probe/btime theo định
   nghĩa đoạn — viết cả hai số trong prereg và đối chiếu bằng code
   (blind46-investigate.py in ra cả hai) trước khi chốt verdict.
   Verdict SPAN không đổi vì đoạn A mở bất kể gap là 8.910 hay
   9.876 s.
2. **Replay #72 khác hình dạng — ghi bracket, không ép khớp
   baseline (mới, §2.1 + §2.2):** dpkg.log #72 chỉ 350 dòng
   (trước đây 1.509) nhưng kết thúc cùng gói gstreamer1.0-tools
   và đã đóng băng; apt history cùng mẫu os-intent. T4 không kết
   luận "replay ngắn hơn là bình thường" hay "bất thường" — chỉ
   ghi số + giao T5 (chủ quản replay) xem lại. Bài học: baseline
   lặp lại không phải luật — khác biệt phải được ghi rõ thay vì
   làm tròn cho khớp.
3. **Giây = float = 336 mốc, không trôi (mới, §2.3):** lần này
   số mốc giây và float trùng nhau — không có file nào trôi mtime
   khỏi cửa sổ giữa hai lần quét (khác T7-126 có 1 file trôi).
   Ghi rõ để luồng sau khỏi tưởng lệch số.
4. **Cận nhảy từ hai lần đo F vẫn dùng được khi không có quan sát
   cũ-clock gần (xem §2.2):** tại #72 không có session mtime nào
   trong 1 h trước btime, nhưng F71 ≈ 0 (±2 s) + F72 ≈ 0 (±3 s)
   vẫn cho |X| ≲ 5 s — cùng phương pháp T7-126 §4 mục 2.
5. **Prereg viết trước khi đo:** dự báo +3 dòng log checklist
   ĐÚNG; dự báo probe #46 boot 81464315 ok=2 fail=0 ĐÚNG; dự báo
   đoạn B ĐÓNG bằng uptime trực tiếp ĐÚNG; dự báo đoạn A KHÔNG
   ĐÓNG ĐƯỢC ĐÚNG (đuôi thật 4.793 s = 1h19'53", ngắn hơn dự báo
   ~1h30'–2h vì mốc cuối là LIMITS gộp đợt 126 lúc 00:50:24Z chứ
   không phải ~00:3xZ — dự báo đúng hướng); dự báo gap #71→#72
   SPAN ĐÚNG (CERT 39 / FULL 54 không đổi); dự báo EPERM 0 sóng
   ĐÚNG; dự báo WFS chênh 0 ĐÚNG (850 dòng, trong khoảng dự báo
   ~850–900); dự báo RAM max < 4.576 MB ĐÚNG (2.551 MB) —
   không sửa sau khi thấy số, trừ lỗi số học gap đã ghi ở mục 1.
6. **Kiểm lại boot TRƯỚC (02:40:54Z) và SAU khi viết LIMITS
   (02:48:06Z, 02:50:04Z):** cả ba lần đều boot 81464315 (#72),
   uptime-s 02:10:17Z — KHÔNG có reboot giữa phiên T4 lượt này.
   Probe #46 và mù #46 KHÔNG bị ảnh hưởng bởi reboot sau đó (chưa
   xảy ra tới lúc đóng).
7. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
   model đóng/nhạc bản quyền.**
8. **Không quét toàn workspace lượt này:** chỉ dùng góc hẹp/mục
   tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ repo-1/goals
   + /tmp + exec-logs).
9. **Stage batch:** chỉ 1 file text (LIMITS doc này),
   NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
   checkpoint + stage file).
10. **Ghi rõ:** số thứ tự reboot #47–#72 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
11. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F72 ĐÃ KIỂM (≈ 0) vào hồ sơ (xem
    §2.2 + §2.6).
12. **Cross-check tái hiện T7(126) 100%** (CERT n=39 / FULL n=54)
    trước khi kết luận số mới — chạy blind45-gaps.py verbatim qua
    exec (xem blind46-gaps.txt).
13. **md5 preview.tsx / media.ts KHÔNG ĐỔI trong lúc làm việc
    (ghi nhận):** preview.tsx 03bf029f (baseline), media.ts
    2c384ed1 — khớp baseline sau khi T3 gỡ H3f. T4 không sửa
    production file nào.
14. **Các luồng đợt 127 khác đang chạy lúc T4 đóng** — T4 chỉ ghi
    nhận trạng thái, không phụ thuộc kết quả các luồng đó.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #46 (đoạn A): MỞ — ĐÃ ĐỂ MỞ THEO QUYẾT §12(c) đợt
   127 (mới, xem §2.3 đoạn A).** Đuôi 4.793 s trống hoàn toàn ở cả
   4 phạm vi; 0 session bắc qua cắt A-hi; tối đa 4 ẩn. Gap #71→#72
   giữ SPAN cho tới khi có bằng chứng ngoài VM. **Không giao luồng
   sau kiểm lại A** (quyết §12(c) đã bao phủ).
2. **Gap #71→#72 = 9.876 s SPAN (mới — xem §2.5, CERT n=39,
   FULL n=54 KHÔNG ĐỔI).** Không có gì cần parent quyết thêm cho
   gap này ngoài việc ghi nhận.
3. **Replay #72 chỉ 350 dòng (mới — xem §2.1 + §2.2).** Khác hình
   dạng 1.509 dòng của #68/#70/#71; cùng gói cuối gstreamer1.0-
   tools, cùng mẫu apt os-intent, đã đóng băng. **Giao T5 xem lại
   khác biệt số dòng** — T4 không kết luận nguyên nhân.
4. **Mù #45 (đoạn G1): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h)). T4 không kiểm lại lượt này. Gap #70→#71 giữ SPAN.
5. **Mù #44 đoạn D: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h), kiểm sâu 1 lần đã xong đợt 126). T4 không kiểm lại
   lượt này. Gap #68→#69 giữ SPAN.
6. **Mù #43 (gap #67→#68): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ**
   (quyết đợt 124 §12.4). T4 không kiểm lại lượt này. Gap #67→#68
   giữ SPAN.
7. **Mù #40 đoạn B: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   124 §12.3). T4 không kiểm lại lượt này. Gap #63→#64 giữ SPAN.
8. **Gap #66→#67 = KHOẢNG [27'06", 28'28"] ĐÃ CHỨNG NHẬN DẠNG
   KHOẢNG (đợt 124) — parent ĐÃ CHẤP NHẬN cả ba điểm (§12.5).**
   Không đổi lượt này.
9. **Reboot #72 (02:10:17Z, boot 81464315) — CHỈ GHI NHẬN giờ +
   bracket replay (mới, xem §2.2 cuối + §2.1).** Gap #71→#72 thuộc
   mù #46 đoạn A, đã để mở. **Không tự đánh số thứ tự chắc chắn**
   — số #72 là tạm thời như #71. **Lưu ý replay:** bracket
   02:35:39–02:48:06Z đã ghi trong LIMITS này (sẽ mất theo reboot
   sau, như bracket #70/#71).
10. **RAM max 2.551 MB = 42% guard (mới — xem §3).** Cao hơn max
    2.240 MB mù #45 nhưng vẫn thấp hơn max kỷ lục 4.576 MB mù #42.
    **Birefnet KHÔNG chạy** (vẫn dưới guard 6 GB; quyết parent
    §12.7 vẫn đứng). u2net vẫn là fallback chính thức.
11. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
    --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
    117, chưa trả lời — nhắc lần 13 ở đợt này). Watcher này sẽ
    lấp đúng loại lỗ như đuôi đoạn A của mù #46.
12. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
    parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
    117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
13. **EPERM không tuyên bố đã hết** (sóng gần nhất ~134h46'
    trước probe #46). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
14. **Mù #47 MỚI MỞ (từ probe #46 02:41:09Z) — việc của lượt sau:**
    probe #47 + điều tra đoạn từ #72 (dải cơ học cho #73:
    [02:42:25Z, 05:01:21Z], hiệu dụng sau probe #46: [02:41:09Z,
    05:01:21Z]). T4 KHÔNG tự chạy probe #47 lượt này (nhịp probe
    là 1/lượt).
