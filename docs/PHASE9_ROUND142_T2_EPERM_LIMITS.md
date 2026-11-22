# PHASE9 ROUND142 T2 — EPERM: probe #61 ok=2 fail=0 + mù #61 KHÔNG đóng hoàn toàn (đoạn B MỞ, tối đa 1 ẩn) + gap #99?→#100? CHỨNG NHẬN [7.079, 7.099] s + gap #101?→#102? CHỨNG NHẬN [892, 912] s (caveat đoạn ngắn) → CERT 62 / FULL 77 + bde599df = #102? TẠM, OUTSIDE dải (chuỗi INSIDE ĐỨT) + khung chết #99? 29 s (= khung T9) + WFS #48 chênh 0

> Luồng T2, đợt 142 vòng lặp Phase 9 VCut Studio (lượt cron 06:35 +07
> 19/11/2026; làm việc 23:40Z 18/11 → ~00:10Z 19/11/2026).
> Nhiệm vụ: probe #61 theo lịch thường lệ + mù #61 (từ probe #60) +
> boot #100?/#101?/#102? + khung chết #99? + WFS lần 48 (đối chiếu bằng SỐ TỔNG
> KẾT theo quyết parent đợt 138 §12.3(h) — file thô scan #43 đã mất,
> chấp nhận mất).
> Quyết parent đợt 141 §12.2: (a) CHẤP NHẬN đóng đợt 141 9/9; (b) **Khung
> chết #97?: XÁC NHẬN ứng viên merged (17:52:10Z, 17:52:56Z] (46 s)** làm
> chuẩn (mốc lock-log 17:53:28Z của T6 ghi là dị thường đồng hồ, không
> làm mốc khung); (c) **XÁC NHẬN gap đôi (CERT 60/FULL 75)**; (d)
> **Headroom: BÁO USER trong báo cáo đợt 141**; (e) **PHÊ DUYỆT VÁ
> watchdog** (wrap page.evaluate + driver canh im lặng >120 s gọi diag
> live; từ đợt 142); (f) **GIỮ ĐÓNG điều tra (c2); điều tra kẹt chung VẪN
> MỞ**; (g) **2c0efe57 = #99? (XÁC NHẬN); khung chết #98? XÁC NHẬN
> (19:46:47Z, 19:54:12Z] (445 s); 57a0dd12 = #100? (XÁC NHẬN); ed5323a4 =
> #101? TẠM** (chờ T2-142); (h) **CHẤP NHẬN giả thuyết viết lại started_at
> ở dạng sự kiện (mọi reboot trong lúc run chạy); BỎ dải offset ~30–50 s**
> (936 s đã phá vỡ); (i) **Gate A/balloon: GIỮ NGUYÊN ngưỡng ≥1024 MB**;
> (j) **Birefnet: GIỮ NGUYÊN quy trình + guard 6.144 MiB**.
> Prereg viết TRƯỚC khi đo: hidden_files/round142-t2/prereg-t2.md
> (có 1 sai số số học — xem F-142-T2-1: đoạn A dài 4.026 s, không phải
> 4.266 s; code dùng đúng timestamp nên không ảnh hưởng kết quả).
> **1 REBOOT TRONG PHIÊN T2, SAU probe #61:** boot 9afdaa89, btime
> 23:54:20Z (sự kiện #27) — xảy ra giữa lúc T2 viết LIMITS (sau probe
> #61 23:45:18Z, trước khi đóng cờ ~00:10Z). **KHÔNG ảnh hưởng mù #61**
> (đóng tại probe #61) **hay bất kỳ verdict nào dưới đây**; mù #62 mở
> từ probe #61 — việc của T2-143. Boot mới 9afdaa89 = ứng viên #103?
> TẠM, btime NẰM TRONG dải FULL77 cho #103? (xem §2.2) — T2-143 chứng
> nhận bằng merged mù #62. T6-142 đã đóng TRƯỚC reboot này (cờ
> round142-t6.done có lúc T2 kiểm; T6 ghi "KHÔNG có reboot trong phiên
> T6" — đúng lúc T6 đóng).
> **T6-142 công bố TRƯỚC khi T2 đóng (như đợt 140/141):** T6-142 LIMITS +
> cờ `.done` đã có lúc T2 kiểm — chuỗi tương đối CHỐT #57→#101? +
> bde599df (ứng viên #102?); bde599df NGOÀI dải tạm (dưới p10); "lần
> OUTSIDE đầu tiên theo dải cơ học kể từ #93?"; chuỗi INSIDE đứt ở
> bde599df. Verdict OUTSIDE của T6 độc lập khớp verdict của T2 (§2.5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (23:44:12Z–23:45:18Z):**
  `status` báo **DEAD/STALE** (heartbeat age 10.803 s, last #60
  20:45:15Z, boot 2c0efe57, exit 1); `once` ngay sau đó là **probe
  #61, boot bde599df, ok=2 fail=0**, exit 0, 23:45:18Z; `status`
  chạy lại **ALIVE** (age 0 s, n=61), exit 0. Log v2 tăng đúng **3
  dòng** (172 → 175) — **như mọi lượt trước**; prereg §1 đã dự báo
  đúng +3 trước khi đo. Heartbeat nay n=61, ts 23:45:18Z, boot
  bde599df.
- **Boot bde599df lúc 22:48:05Z, boot
  `bde599df-eb81-4205-86a0-b71a0ab9790c`** — xác minh bằng `uptime
  -s` + btime 1795042085 + `who -b` + journal 1 boot (xem §1). Clock
  VM hiện tại: HTTP `Date` 3 server hơn local **+1 s / +1 s / +2 s**
  → **F102? ≈ −1 s tới −2 s (±~1 s)** — lần thứ ba 3 server không
  đồng nhất (xem F-142-T2-5).
- **Khoảng mù #61 (20:45:15Z → 23:45:18Z 18/11, 3h00'03" =
  10.803 s) — KHÔNG ĐÓNG HOÀN TOÀN. Đoạn B MỞ (tối đa 1 ẩn).**
  Đoạn A ĐÓNG bằng luật lỗ (merged 100 mốc, lỗ lớn nhất **927 s** ≪
  sàn 1.147 s, tối đa **0 ẩn**); đoạn B MỞ bằng luật lỗ (merged 10
  mốc, lỗ lớn nhất **1.874 s** > sàn, tối đa **1 ẩn**); đoạn C ĐÓNG
  bằng luật lỗ (merged 43 mốc, lỗ lớn nhất **193 s** ≪ sàn, tối đa
  **0 ẩn** — kèm caveat đoạn ngắn, xem F-142-T2-7); đoạn D ĐÓNG bằng
  uptime trực tiếp (merged 37 mốc, lỗ lớn nhất 2.280 s — vượt sàn
  nhưng uptime loại bỏ reboot ẩn). Merged 191 mốc giây.
  **Chuỗi mù đóng hoàn toàn #57–#60 (4 liên tiếp) ĐỨT tại #61.**
- **Gap #99?→#100? = [7.079 s, 7.099 s] (1h58'09" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn A mù #61 đóng, tối đa 0 ẩn — đoạn A phủ
  đúng btime #99? → btime #100?). **Gap #100?→#101? = 2.442 s
  (40'42") — VẪN CHỈ LÀ SPAN** (đoạn B mù #61 mở, tối đa 1 ẩn).
  **Gap #101?→#102? = [892 s, 912 s] (15'02" ±10 s) — CHỨNG NHẬN
  DẠNG KHOẢNG, kèm caveat đoạn ngắn + nhãn có điều kiện** (đoạn C mù
  #61 đóng, tối đa 0 ẩn; nhãn #101?→#102? có điều kiện vì ed5323a4 =
  #101? vẫn TẠM — xem §2.5). **CERT 60→62 / FULL 75→77**:
  CERT62 mean 1h34'23" median 1h49'58" p10 0h26'28" p90 2h16'01" sd
  0h45'25"; FULL77 mean 1h40'38" median 1h53'00" p10 0h27'12" p90
  2h24'50" sd 0h55'35"; in 90–150' = 40, <60' = 18, >180' = 6,
  >240' = 2. Dải chứng nhận [0h00'55", 3h14'08"] không đổi.
  Biến thể một-gap (chỉ #99?→#100?): CERT61 / FULL76 (xem §2.5).
  Biến thể ba-gap (nếu parent đóng đoạn B bằng bằng chứng sampler):
  CERT63 / FULL78 (xem §2.5).
- **Boot bde599df = #102? — TẠM (ứng viên), btime 22:48:05Z NẰM
  NGOÀI dải** (dưới p10) theo cả ba dải: FULL77 [23:00:14Z,
  00:57:52Z] (thiếu 729 s), FULL76 [23:01:24Z, 00:58:02Z] (thiếu
  799 s), CERT62 [22:59:30Z, 00:49:04Z] (thiếu 685 s). **Chuỗi
  INSIDE theo dải cơ học (#94?–#101?, 8 lần liên tiếp) ĐỨT tại
  #102?** — lần OUTSIDE đầu tiên kể từ #93? (theo T6-142 §8).
  **ed5323a4 = #101? VẪN TẠM** (đoạn B mở — không thể xác nhận số;
  btime 22:33:03Z INSIDE dải tạm FULL75 neo #100? [22:20:35Z,
  00:17:30Z]).
- **Khung chết #99? ứng viên MERGED: (21:51:52Z, 21:52:21Z] (29 s)**
  — mốc cuối là sampler vòng 1 của T9-141 (21:51:52Z). **TRÙNG
  KHỚP HOÀN TOÀN với khung quan sát của T9-141 (21:51:52Z,
  21:52:21Z] (29 s)** — hai cách dựng độc lập cho cùng một khung.
  **T2 ĐỀ XUẤT 29 s làm chuẩn mới**; parent quyết khi đóng sổ.
- **Khung chết #100? ứng viên MERGED: (22:32:05Z, 22:33:03Z]
  (58 s)** — mốc cuối là appendix-vong1/vong2.md của T9-141
  (22:32:05Z). Chưa có khung quan sát thay thế nào — T2 không tự
  bịa khung quan sát.
- **Khung chết #101? ứng viên MERGED: (22:45:49Z, 22:48:05Z]
  (136 s)** — mốc cuối là log O8 + cooldown của T10-141
  (22:45:49Z). Chưa có khung quan sát thay thế nào.
- **Dải dự báo #103? — CHUẨN T2 (FULL77, neo tại #102? 22:48:05Z):
  [23:15:16Z, 01:12:54Z]**; biến thể một-gap FULL76: [23:16:26Z,
  01:13:04Z] — chênh ≤70 s. **Reboot #27 (9afdaa89, btime 23:54:20Z)
  NẰM TRONG dải này** (ghi nhận cho T2-143, không chứng nhận ở đây).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 63 file
  *.log có mtime trong mù #61 (0 file repo-1, 63 file
  hidden_files); 2 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả launcher đã biết** (T10-O8, xem §2.7). Quét mở rộng: **8 match
  thô / 8 dòng duy nhất — phân loại hết** (6 dòng test-pass hasEperm
  + 2 dòng launcher). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** —
  **~179,6h** trước probe #61. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 48: 954 dòng / 268 file** (phạm vi 3.181
  file); R7b đối chiếu 979 dòng / 285 file; copies 25 dòng / 17
  file — y hệt lần 43–47 về copies. Đối chiếu chéo 954+25=979=R7b,
  **chênh 0 — lần thứ bốn mươi tám liên tiếp**. +10 dòng / +4 file so
  với lần 47, giải thích đúng hết bằng diff (xem §2.7). T5-142 quét
  độc lập cùng đợt cho **953/267 + 978/284 + 25/17** (phạm vi 3.180 —
  1 file LIMITS của chính T5-142 tạo thêm giữa hai lần quét, mang 1
  hit). Đây là đối chiếu bằng **SỐ TỔNG KẾT** theo quyết (h) — file thô
  scan #43 đã mất, chấp nhận mất. Async `.writeFile(`: vẫn đúng
  **2 vị trí helper đã biết** — 0 stray.
- RAM: max biết được trong mù #61 **2.968.192 kB ≈ 2.898,6 MiB
  (T5-141 sampler, 20:47:12Z, đoạn A) — 47,18% guard 6.144 MiB,
  THIẾU 3.323.264 kB (~3.245,4 MiB), KHÔNG vượt**;
  corroborate bởi T9-141: 2.928.692 kB (20:46:48Z, −39.500 kB).
  Đoạn B max 1.936.172 kB (T9-141 sampler vòng 2 mẫu đầu 21:53:23Z,
  30,77% guard); đoạn C max ~1.343 MB (T10-141 suite, 22:39:48Z);
  đoạn D max 1.176.808 kB (T9-142 sampler, 23:43:37Z, 18,7% guard).
  Birefnet KHÔNG chạy bởi T2 (thuộc T9-142 theo quyết (j)). Đoạn A
  max theo ram-max chỉ 1.243 MB — ram-max là cận dưới (xem
  F-142-T2-10). MemAvailable lúc đóng phiên T2 2.668.352 kB
  (00:06:27Z, trên boot mới 9afdaa89 — NGOÀI mù #61).
- **dpkg.log boot bde599df — replay CHẾT YỂU: 2 dòng** (startup
  packages configure 22:48:39Z ×2), lặng ~56' lúc đọc đầu (23:44Z)
  — **chứng minh chết yểu**; T5-142 đã trigger repair 23:44:06Z
  (REPAIR_TRIGGERED) — bracket chính thức thuộc về T5. **dpkg.log
  boot mới 9afdaa89 (sau reboot #27) — replay XONG, KHỚP HOÀN TOÀN
  hình dạng baseline: 1.545 dòng / 221 status-installed / 462
  configure** (phương pháp đếm 'configure' đã đính chính — xem
  F-142-T2-4), lần ghi cuối 23:58:47Z (gstreamer1.0-tools), gói đầu
  startup configure 23:54:56Z (boot +36 s).
- **preview.tsx 530e10a7** (fix GIỮ VĨNH VIỄN theo quyết parent đợt
  137 §12.3(a)); media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts KHÔNG
  ĐỔI ee80d093. T2 không sửa production file nào.
- **Đợt 142 lúc T2 đóng (~00:10Z 19/11):** T1 + T5 + T6 đã có cờ
  `.done` (T1, T5, T6 — T6 LIMITS đã công bố, chuỗi #57→#101? đã
  chốt + bde599df OUTSIDE); các luồng khác (T4/T7/T8/T9/T10) đang
  chạy; boot hiện tại **9afdaa89** (sau reboot #27, btime 23:54:20Z
  — xảy ra SAU probe #61). T2 KHÔNG mở Xvfb (không cần) nên không
  có gì để kill.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 23:44:12Z | boot_id `bde599df-eb81-4205-86a0-b71a0ab9790c`; `who -b` Nov 18 22:48; `uptime -s` **2026-11-18 22:48:05**; btime **1795042085 = 2026-11-18T22:48:05Z**; journal chỉ 1 boot (bde599df, first entry 22:48:17Z, last 23:43:51Z lúc kiểm tra). MemAvailable 1.012.020 kB lúc 23:44:12Z. |
| Đo F102? (HTTP Date, 3 server) | 23:44:37–23:44:41Z | example.com Date 23:44:38Z vs local_after 23:44:37Z (+1 s); google.com Date 23:44:39Z vs local_after 23:44:38Z (+1 s); cloudflare.com Date 23:44:41Z vs local_after 23:44:39Z (+2 s) → **F102? ≈ −1 s tới −2 s (±~1 s)**. Đo trực tiếp đầu tiên trên boot mới (xem F-142-T2-5: lần thứ ba 3 server không đồng nhất). |
| Đọc dpkg.log bracket bde599df | ~23:44Z | **2 dòng — replay CHẾT YỂU** (startup packages configure 22:48:39Z ×2, lặng ~56' lúc đọc đầu — **chứng minh chết yểu**). T5-142 đã trigger repair 23:44:06Z (file REPAIR_TRIGGERED; POSTBOOT_PASS.stale-bde599df 23:48Z). **T5-142 là chủ quản postboot — bracket chính thức thuộc về T5; số của T2 là đọc độc lập đối chiếu.** (dpkg.log của boot #101? (ed5323a4) đã MẤT theo reboot #26 — /var/log reset mỗi boot; bản ghi T10-141 (suite/O8 chạy trên ed5323a4) là bằng chứng còn lại cho boot đó — cùng mẫu như journal/wtmp.) |
| `bash scripts/probe-eperm-v2.sh status` | 23:45:18Z | **DEAD/STALE**, heartbeat n=60, ts 20:45:15Z, boot 2c0efe57, age **10.803 s** (đúng 3h00'03"); last sample probe #60; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 23:45:18Z | **probe #61, boot=bde599df, ok=2 fail=0**, exit 0; dòng `boot changed 2c0efe57 -> bde599df` (uptime since 2026-11-18 22:48:05) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~23:45:18Z | **ALIVE**, age 0 s, n=61, exit 0 |
| Xác minh boot lại (sau probe) | 23:45:18Z | Cùng boot bde599df, `uptime -s` 22:48:05Z, btime 1795042085. MemAvailable 842.852 kB. |
| Xác minh boot lần 3 (lúc đóng phiên) | 00:06:27Z 19/11 | **BOOT MỚI 9afdaa89** — **reboot #27 trong lúc T2 viết LIMITS** (sau probe #61): boot_id `9afdaa89-6721-4afa-aade-0358fe38e527`, `uptime -s` **2026-11-18 23:54:20**, btime **1795046060 = 2026-11-18T23:54:20Z**; `who -b` Nov 18 23:54; journal chỉ 1 boot (9afdaa89, first entry 23:54:31Z, last 00:07:05Z lúc kiểm tra). MemAvailable 2.668.352 kB. |

Kiểm lại từ đĩa: log probe v2 **175 dòng** — 172 sau T2-141 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #60 +
dòng `boot changed` + dòng probe #61). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #60 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=61, ts 2026-11-18T23:45:18Z, boot
bde599df-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

**Về btime và journal first entry:**
btime thật của bde599df là **22:48:05Z** (/proc/stat 1795042085 +
`uptime -s` + `who -b`). Journal first entry là **22:48:17Z** — chậm
hơn btime 12 s (journald khởi động sau kernel boot ~12 s; đúng mẫu
của #92?/#93?/#94?/#97?/#99? — boot #98? là 16 s, boot #100? chưa
ghi). **Marker round-in-progress.md đợt 142 ghi đúng ~22:48Z cho
boot bde599df** (brief + marker khớp — xem §1). Boot mới 9afdaa89:
btime **23:54:20Z**, journal first entry 23:54:31Z (btime +11 s).

Nguồn độc lập cho boot bde599df: 2 session T2 trong vùng D (xem
§2.3) + 37 mốc merged gộp trong vùng D (mốc đầu 22:48:39Z — xem
§2.4; mốc cuối 23:45:09Z — probe #61) + 2 exec-log nhắc bde599df
trong mù (xem §2.3) + **T6-142 chốt chuỗi tương đối #57→#101? +
bde599df (ứng viên #102?)** (T6-142 §8, công bố TRƯỚC khi T2 đóng).
**Số thứ tự #102? VẪN TẠM** — btime NGOÀI dải (xem §2.5) + #101?
vẫn tạm (đoạn B mở); giá trị gap không phụ thuộc số thứ tự.

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #61 (20:45:15Z → 23:45:18Z 18/11, 3h00'03" = 10.803 s)

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #61: `uptime -s` = **2026-11-18 22:48:05Z**,
  boot_id `bde599df-eb81-4205-86a0-b71a0ab9790c` — khác boot của
  probe #60 (2c0efe57).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (23:44:12Z): chỉ **1 boot**
  (bde599df, first entry 22:48:17Z, last 23:43:51Z). Journal/wtmp
  của các boot trước đã mất theo reboot #26 — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot bde599df — replay CHẾT YỂU, 2 dòng.**
  Đọc lúc ~23:44Z: **2 dòng** (startup packages configure
  22:48:39Z ×2), lặng ~56' lúc đọc đầu — **chứng minh chết yểu**
  (cùng mẫu boot #98? 90392aa5 — 2 dòng rồi T5-140 --repair).
  Replay bắt đầu **boot +34 s** (22:48:39Z). **T5-142 là chủ quản
  postboot — bracket chính thức thuộc về T5** (REPAIR_TRIGGERED
  23:44:06Z; POSTBOOT_PASS.stale-bde599df 23:48Z); số của T2 là đọc
  độc lập đối chiếu.
  **dpkg.log boot 9afdaa89 (sau reboot #27, đọc 00:08:31Z 19/11):
  replay XONG, KHỚP HOÀN TOÀN hình dạng baseline: 1.545 dòng /
  221 status-installed / 462 configure** (phương pháp đếm
  'configure' đã đính chính — xem F-142-T2-4); lần ghi cuối
  **23:58:47Z** (gstreamer1.0-tools installed), lặng ~10' lúc đọc
  — **chứng minh xong**. Gói đầu startup configure 23:54:56Z
  (boot +36 s). **Hình dạng KHỚP baseline 1.545 dòng / 221 installs
  của #82?/#83?/#84?/#90?/#92?/#94?/#96?/#97?/#99?** — cùng một
  replay configure khô. (Bracket này thuộc về T5-142 — T2 chỉ ghi
  nhận vì reboot xảy ra trong phiên T2.)
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**1 reboot TRONG phiên T2, SAU probe #61:** boot 9afdaa89 xác minh
lúc 00:06:27Z + 00:08:31Z + 00:09:31Z (btime 23:54:20Z) — khác boot
lúc probe #61 (bde599df, xác minh 23:44:12Z + 23:45:18Z). Reboot
này xảy ra SAU khi mọi phép đo mù #61 đã xong (cửa sổ mù đóng
23:45:18Z) nên **không ảnh hưởng bất kỳ verdict mù nào**; nó chỉ
ảnh hưởng câu "không reboot trong phiên T2" (nay là SAI — xem
F-142-T2-3) và mở mù #62 (việc của T2-143).

### 2.2 Reboot đã chốt trong mù — #100? + #101? + #102? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 100? | **21:52:21Z** (chính xác từng giây) | 2c0efe57 → 57a0dd12 | Đã XÁC NHẬN theo quyết parent (g) đợt 141 (INSIDE dải FULL75 + T6/T7/T9 xác minh độc lập) + merged đoạn A mù #61 đóng (tối đa 0 ẩn — xem §2.3) + **T6-142 chốt chuỗi tương đối #57→#101?**. **Số thứ tự ĐÃ XÁC NHẬN.** |
| 101? | **22:33:03Z** (chính xác từng giây) | 57a0dd12 → ed5323a4 | TẠM theo quyết parent (g) đợt 141 (INSIDE dải tạm FULL75 neo #100? [22:20:35Z, 00:17:30Z] — T10-141 §10.2). Merged đoạn B mù #61 MỞ (tối đa 1 ẩn — xem §2.3) nên **KHÔNG thể xác nhận số đợt này — VẪN TẠM**. **Số thứ tự VẪN TẠM.** |
| 102? | **22:48:05Z** (chính xác từng giây) | ed5323a4 → bde599df | Chốt từ lượt này: `uptime -s` đọc tươi (23:44:12Z + kiểm lại 23:45:18Z) + btime 1795042085 + `who -b` 22:48 + boot_id bde599df + journal first entry 22:48:17Z + probe #61 23:45:18Z boot bde599df ok=2 fail=0 + merged đoạn C mù #61 đóng (tối đa 0 ẩn) + **T6-142 chốt chuỗi tương đối #57→#101? + bde599df (ứng viên #102?)**. **Số thứ tự TẠM (ứng viên)** — btime NGOÀI dải (xem §2.5) + #101? vẫn tạm. |

**Clock:** F102? ≈ **−1 s tới −2 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` 3 server: example.com
+1 s, google.com +1 s, cloudflare.com +2 s (độ chi tiết 1 s của HTTP
Date). **F102? là lần đo trực tiếp đầu tiên trên boot bde599df.**
F99? ≈ −0 s tới −1 s (đã đo đợt 141). F100? và F101? **CHƯA ĐO**
(T2 không có session nào trên hai boot đó — hai boot chỉ sống
40'42" và 15'02", T2-142 mở phiên sau khi cả hai đã chết). Ba đầu
chuỗi đo được (F99?, F102?) đều ≈ −0 s tới −2 s — đồng hồ local ổn
định ở mức chậm ~0–2 s; xem §2.5 về cách caveat này được xử lý.
F102? là lần thứ ba 3 server không đồng nhất (xem F-142-T2-5).

**CẬN NHẢY CLOCK TẠI REBOOT:**
- **0 nhân chứng nhảy tại #100?:** không session nào sinh trước
  btime 21:52:21Z mà mtime sau btime.
- **0 nhân chứng nhảy tại #101?:** không session nào sinh trước
  btime 22:33:03Z mà mtime sau btime.
- **0 nhân chứng nhảy tại #102?:** không session nào sinh trước
  btime 22:48:05Z mà mtime sau btime.
- Cận session: **|X100?| < 956 s** (session muộn nhất 21:36:25Z —
  session sinh 21:36:25Z, mtime 21:36:25Z; session sớm nhất sau btime
  21:53:23Z). **|X101?| < 166 s** (session muộn nhất 22:30:17Z;
  KHÔNG có session nào sinh trong 1h sau btime). **|X102?| <
  1.068 s** (session muộn nhất 22:30:17Z; session sớm nhất sau btime
  23:40:48Z — session của agent đợt 142).
- **Ranh giới (merged 4 phạm vi):** 0 file trong
  [btime −10 s, btime] và 0 file trong (btime +0 s, +10 s] cho CẢ
  BA reboot #100?, #101? và #102? — ranh giới sạch (mù #60 cũng
  sạch cho cả hai reboot của nó).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #99?→#100? = **[7.079 s, 7.099 s] (1h58'09" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn A mù #61 đóng, tối đa 0 ẩn — xem §2.3).
  **CERT 60→62 / FULL 75→77** (cùng với gap #101?→#102? — xem
  §2.5).
- Gap #100?→#101? = **2.442 s (40'42") — VẪN CHỈ LÀ SPAN** (đoạn B
  mù #61 mở, tối đa 1 ẩn; KHÔNG kiểm lại đợt này ngoài merged —
  xem §2.6). **CERT/FULL không tính gap này.**
- Gap #101?→#102? = **[892 s, 912 s] (15'02" ±10 s) — CHỨNG NHẬN
  DẠNG KHOẢNG, kèm caveat đoạn ngắn + nhãn có điều kiện** (đoạn C mù
  #61 đóng, tối đa 0 ẩn — xem §2.3 + F-142-T2-7). **CERT 60→62 /
  FULL 75→77** (cùng với gap #99?→#100? — xem §2.5).
- Gap #98?→#99? = [7.266 s, 7.286 s] — đã chứng nhận đợt 141, không đổi.
- Gap #97?→#98? = [7.089 s, 7.109 s] — đã chứng nhận đợt 141, không đổi.
- Gap #96?→#97? = [7.246 s, 7.266 s] — đã chứng nhận đợt 140, không đổi.
- Gap #95?→#96? = [7.271 s, 7.291 s] — đã chứng nhận đợt 139, không đổi.
- Gap #94?→#95? = [8.169 s, 8.189 s] — đã chứng nhận đợt 139, không đổi.
- Gap #93?→#94? = [5.320 s, 5.340 s] — đã chứng nhận đợt 138, không đổi.
- Gap #92?→#93? = 9.473 s — **VẪN CHỈ LÀ SPAN** (đoạn A mù #56 mở,
  tối đa 1 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại đợt này — xem
  §2.6). **CERT/FULL không tính gap này.**
- Gap #91?→#92? = 6.838 s — **VẪN CHỈ LÀ SPAN** (đoạn B mù #55 mở,
  tối đa 2 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại đợt này — xem
  §2.6). **CERT/FULL không tính gap này.**
- **Dải cho #100? (chuẩn FULL75, neo tại #99? 19:54:12Z):
  [20:22:26Z, 22:19:21Z]** — thực tế 21:52:21Z **NẰM TRONG dải**
  (đã biết trước khi đo — T10-141 §10.2).
- **Dải cho #101? (tạm FULL75, neo tại #100? 21:52:21Z):
  [22:20:35Z, 00:17:30Z]** (T10-141) — thực tế 22:33:03Z **NẰM
  TRONG dải** (đã biết trước khi đo).
- **Dải cho #102? (chuẩn FULL77, neo tại #101? 22:33:03Z):
  [23:00:14Z, 00:57:52Z]** — thực tế 22:48:05Z **NẰM NGOÀI dải
  (dưới p10 729 s)**. Biến thể một-gap FULL76 [23:01:24Z,
  00:58:02Z] (thiếu 799 s) và dải CERT62 [22:59:30Z, 00:49:04Z]
  (thiếu 685 s) cũng đều NGOÀI — verdict không phụ thuộc bản dải
  nào (xem §2.5). Chuỗi INSIDE theo dải cơ học **ĐỨT tại #102?**
  (trước đó 8 lần liên tiếp #94?, #95?, #96?, #97?, #98?, #99?,
  #100?, #101?).
- **Dải CHUẨN cho #103? (FULL77, neo tại #102? 22:48:05Z):
  [23:15:16Z, 01:12:54Z]**; biến thể một-gap FULL76: [23:16:26Z,
  01:13:04Z] — chênh ≤70 s, không đổi verdict nào.
  **Reboot #27 (9afdaa89, btime 23:54:20Z) NẰM TRONG dải này** —
  ghi nhận cho T2-143 (không chứng nhận ở đây).

**Khung chết các boot (từ merged — xem §2.4):**
- **Khung chết #99? (ứng viên MERGED — T2 ĐỀ XUẤT làm chuẩn mới):
  (21:51:52Z, 21:52:21Z] (29 s)** — mốc muộn nhất là sampler vòng 1
  của T9-141 (21:51:52Z). **TRÙNG KHỚP HOÀN TOÀN với khung quan sát
  của T9-141 (21:51:52Z, 21:52:21Z] (29 s)** — hai cách dựng độc lập
  cho cùng một khung (merged neo btime + quan sát trực tiếp sampler).
  T2 đề xuất 29 s làm chuẩn mới; parent quyết khi đóng sổ.
- **Khung chết #100? (ứng viên MERGED): (22:32:05Z, 22:33:03Z]
  (58 s)** — mốc muộn nhất là appendix-vong1.md +
  appendix-vong2.md của T9-141 (22:32:05Z). Chưa có khung quan sát
  thay thế nào từ T4/T5/T8/T9-142 lúc T2 đóng — T2 không tự bịa
  khung quan sát.
- **Khung chết #101? (ứng viên MERGED): (22:45:49Z, 22:48:05Z]
  (136 s)** — mốc muộn nhất là log O8 + cooldown của T10-141
  (22:45:49Z). Rộng vì máy yên sau O8 của T10 (22:45:49Z) tới lúc
  reboot; chưa có khung quan sát thay thế nào từ T4/T5/T8-142 lúc
  T2 đóng — T2 không tự bịa khung quan sát.
- **Khung chết #98?: (19:46:47Z, 19:54:12Z] (445 s) — CHUẨN PARENT**
  (§12.2(g) đợt 141). Khung chết #97?: (17:52:10Z, 17:52:56Z]
  (46 s) — CHUẨN PARENT (§12.2(b) đợt 141). Khung chết #96?:
  (15:54:16Z, 15:54:37Z] (21 s) — CHUẨN PARENT (§12.2(c) đợt 140).
  Khung chết #95?: (13:47:01Z, 13:53:41Z] (400 s) — GIỮ NGUYÊN.
  Khung chết #94?: (11:52:12Z, 11:52:20Z] (8 s) — GIỮ chuẩn theo
  quyết (b) đợt 139. Khung chết #93?: (09:35:47Z, 09:36:01Z]
  (14 s) — GIỮ NGUYÊN.

**Chuỗi gộp (định nghĩa duy nhất từ đợt 134):** reboot #99?→#100?
là **sự kiện thứ 24** (giữa lượt 141, theo T10-141; parent đã chấp
nhận §12.2(a) đợt 141); reboot #100?→#101? là **sự kiện thứ 25**
(trong lúc T10-141 đóng sổ, theo T10-141 + quyết (g) đợt 141);
reboot #101?→#102? là **sự kiện thứ 26** (trong khoảng giữa hai
đợt — theo T6-142); reboot #102?→9afdaa89 là **sự kiện thứ 27**
(trong phiên T2-142, sau probe #61 — theo T2 lượt này). **Số thứ
tự #100? ĐÃ XÁC NHẬN; #101? VẪN TẠM; #102? TẠM (ứng viên).**
Chuỗi tương đối do T6-142 chốt (#57→#101? + bde599df ứng viên
#102?); số tuyệt đối vẫn tạm theo thông lệ; giá trị gap không phụ
thuộc số thứ tự.

### 2.3 Hoạt động trong khoảng mù — KHÔNG ĐÓNG HOÀN TOÀN (đoạn B mở) (merged 4 phạm vi)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **10 file** +
hidden_files **315 file**; **325 file, 315 mốc float phân biệt /
161 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3/T2-133 §2.3/
T2-134 §2.3/T2-135 §2.3/T2-136 §2.3/T2-137 §2.3/T2-138 §2.3/
T2-139 §2.3/T2-140 §2.3/T2-141 §2.3 — "mốc" là mtime float phân biệt,
không phải giây tròn).
Ngoài hai cây: **51 file** (agents — exec-log/tool-output chiếm đa
số + repo-1-push paths; chi tiết xem blind61-outside.txt — đoạn A
25, đoạn B 4, đoạn C 1, đoạn D 21);
**/tmp: 19 file** trong mù #61 (xem blind61-tmp.txt + caveat §2.4
— cả 19 đều trong đoạn D).
Gộp cả 4 phạm vi: **191 mốc giây phân biệt**. Chia mù làm bốn
đoạn bởi 3 reboot:

- **Đoạn A: 20:45:15Z → 21:52:21Z (1h07'06" = 4.026 s, boot #99?
  2c0efe57) — ĐÓNG (merged 4 phạm vi; hai cây riêng KHÔNG đóng —
  xem dưới):**
  - **165 mốc** (hai cây), lỗ lớn nhất hai cây **1.468 s**
    (21:27:24Z → 21:51:52Z — VƯỢT sàn); lỗ lớn thứ hai 312 s; lỗ
    lớn thứ ba 239 s. Mốc đầu 20:45:15Z (head 0 s — chính probe
    #60); mốc cuối hai cây **21:51:52Z** (đuôi hai cây **29 s**).
    **11 session** chạm đoạn A; **2 session** chạm A-tail.
  - **Merged 4 phạm vi: 100 mốc, lỗ lớn nhất 927 s**
    (21:36:25Z → 21:51:52Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 20:45:27Z (head 12 s), mốc cuối gộp **21:51:52Z**
    (đuôi 29 s — sampler vòng 1 của T9-141). Lỗ lớn thứ hai
    gộp **483 s** (21:27:24Z → 21:35:27Z) và lỗ lớn thứ ba
    **312 s** (21:01:29Z → 21:06:41Z) — cả ba đều < sàn.
    **Lỗ hai cây 1.468 s được lấp bởi 2 mốc ngoài cây:
    21:35:27Z + 21:36:25Z** (mtime của 2 exec-log — session
    proc_8abb9d126922 + proc_0de384457987; xem §2.4).
    **Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): 0 file**
    trong đoạn A (xem §2.4).
  - Cửa sổ sàn [A-lo=21:04:22Z, A-hi=21:33:14Z] (rộng 1.732 s):
    **3 session bắc qua cắt A-lo; 1 session bắc qua cắt A-hi** —
    luật lỗ đã đủ để đóng (lỗ lớn nhất chỉ 927 s = 81% sàn);
    **2 session chạm A-tail** — mốc merged trong A-tail dày tới
    21:51:52Z rồi yên 29 s tới reboot (T9-141 sampler vòng 1 bị
    SIGTERM giết cùng lúc reboot #24).
  - Hoạt động trên 2c0efe57: các luồng đợt 141 làm việc tới
    ~21:51Z (T4 lượt yên #17 attempt1 20/20 tới 20:46Z; T5 sampler
    tới 21:22:30Z; T8 harness tới 21:24:04Z; T7 kiểm lần 2 21:35Z;
    T9 sampler vòng 1 tới 21:51:52Z; T10 đóng sổ tới 21:52Z) —
    máy KHÔNG yên trong đoạn A trừ đuôi 29 s.
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn (merged; hai cây riêng
    KHÔNG đủ — lỗ 1.468 s vượt sàn — merged mới đóng được).**
- **Đoạn B: 21:52:21Z → 22:33:03Z (40'42" = 2.442 s, boot #100?
  57a0dd12) — MỞ (merged 4 phạm vi; hai cây riêng cũng mở):**
  - **9 mốc** (hai cây), lỗ lớn nhất hai cây **1.953 s**
    (21:54:17Z → 22:26:50Z — VƯỢT sàn); lỗ lớn thứ hai 213 s;
    lỗ lớn thứ ba 95 s. Mốc đầu 21:53:23Z (head 62 s — sampler
    vòng 2 của T9 khởi động lại); mốc cuối hai cây **22:32:05Z**
    (đuôi hai cây **58 s**).
  - **Merged 4 phạm vi: 10 mốc, lỗ lớn nhất 1.874 s**
    (21:54:17Z → 22:25:31Z), floor=1 → **MỞ, tối đa 1 ẩn**.
    Mốc đầu gộp 21:53:23Z (head 62 s), mốc cuối gộp **22:32:05Z**
    (đuôi 58 s — appendix-vong1/vong2.md của T9-141). Lỗ lớn thứ
    hai gộp **108 s** (22:30:17Z → 22:32:05Z) và lỗ lớn thứ ba
    **105 s** (22:28:32Z → 22:30:17Z) — cả hai đều ≪ sàn;
    **chỉ có ĐÚNG MỘT lỗ vượt sàn** — lỗ 1.874 s giữa 21:54:17Z
    và 22:25:31Z.
    **Phạm vi thứ 5: 0 file** trong đoạn B (xem §2.4).
  - Cửa sổ sàn [B-lo=22:11:28Z, B-hi=22:13:56Z] (rộng 148 s):
    **2 session bắc qua cắt B-lo; 2 session bắc qua cắt B-hi** —
    nhưng luật lỗ là closer chính (lỗ lớn nhất 1.874 s > sàn) nên
    **2 session bắc qua KHÔNG đóng được đoạn B** (xem §2.4 về
    bằng chứng sampler — cùng lớp, cũng không đóng theo phương
    pháp hiện hành). **2 session chạm B-tail** — mốc merged trong
    B-tail dày từ 22:25:31Z tới 22:32:05Z rồi yên 58 s tới reboot
    (T9 đóng sampler 22:28:25Z, viết appendix 22:32:05Z; T10 đóng
    aggregate 22:54:49Z đã sang đoạn C).
  - Hoạt động trên 57a0dd12: T9 sampler vòng 2 (21:53:23–
    22:27:25Z, 35 mẫu); T7 slot HB 22:00Z + DR 22:00Z + HB
    22:20:50Z (chạy đúng giờ trên boot mới — xem T7-141); T7 kiểm
    lần 3 22:25Z; T10 kiểm boot 22:38:45Z đã sang đoạn C. Máy có
    hoạt động trong đoạn B nhưng **file mtime thưa** — các tiến
    trình dài (sampler, poller) ghi append vào cùng file log nên
    chỉ mtime cuối của file mới đếm được (xem §2.4).
  - **Kết luận đoạn B: MỞ — tối đa 1 ẩn (merged + hai cây đồng
    thuận). Gap #100?→#101? = 2.442 s GIỮ SPAN.**
- **Đoạn C: 22:33:03Z → 22:48:05Z (15'02" = 902 s, boot #101?
  ed5323a4) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **85 mốc** (hai cây), lỗ lớn nhất hai cây **194 s**
    (22:33:03Z → 22:36:16Z); lỗ lớn thứ hai 179 s; lỗ lớn thứ ba
    136 s. Mốc đầu 22:36:16Z (head 194 s — cờ round141-t9.done);
    mốc cuối hai cây **22:45:49Z** (đuôi hai cây **136 s**).
  - **Merged 4 phạm vi: 43 mốc, lỗ lớn nhất 193 s**
    (22:33:03Z → 22:36:16Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 22:36:16Z (head 193 s), mốc cuối gộp **22:45:49Z**
    (đuôi 136 s — log O8 + cooldown của T10-141). Lỗ lớn thứ hai
    gộp **179 s** (22:36:27Z → 22:39:26Z) và lỗ lớn thứ ba
    **136 s** (22:45:49Z → 22:48:05Z — chính là đuôi tới btime) —
    cả ba đều ≪ sàn.
    **Phạm vi thứ 5: 0 file** trong đoạn C (xem §2.4).
  - **CAVEAT ĐOẠN NGẮN (F-142-T2-7, cùng lớp F-141-T2-7):** đoạn C
    chỉ dài 902 s < sàn 1.147 s nên luật lỗ cho floor(902/1147)=0
    NGAY CẢ KHI KHÔNG CÓ MỐC NÀO — verdict đóng cơ học là yếu
    theo luật thuần túy. **Bằng chứng thực chất là mật độ mốc:
    43 mốc merged trong 902 s (trung bình 1 mốc / 21 s), lỗ lớn
    nhất thực tế chỉ 193 s (17% sàn), 85 mốc hai cây.** T2 báo
    cả hai để parent tự xét — verdict đóng đứng trên mật độ,
    không chỉ trên luật cơ học. (So sánh: đoạn A mù #60 — 53 mốc
    / 735 s, lỗ lớn nhất 79 s — parent đã chấp nhận chứng nhận
    gap từ đoạn đó ở quyết (c) đợt 141.)
  - Hoạt động trên ed5323a4: T10 suite 27/27 (22:39:48–22:43:33Z)
    + O8 Chromium/WebKit 21/21 (22:44:02–22:45:49Z) + đóng sổ tới
    22:54:49Z (đã sang đoạn D); T9 cờ .done 22:36:16Z — máy làm
    việc dày trong đoạn C.
  - **Kết luận đoạn C: ĐÓNG — tối đa 0 ẩn (merged + hai cây
    đồng thuận + mật độ dày).**
- **Đoạn D: 22:48:05Z → 23:45:18Z (57'13" = 3.433 s, boot bde599df)
  — ĐÓNG bằng đo uptime trực tiếp + luật lỗ:**
  - **`uptime -s` lúc 23:44:12Z = 22:48:05Z** chứng minh máy up
    liên tục từ #102? tới lúc đo; probe #61 23:45:18Z đọc boot_id
    bde599df tươi — cùng boot_id với boot bắt đầu 22:48:05Z;
    kiểm lại 23:45:18Z cùng boot. (Nguyên tắc như P6 §2.3 đoạn C
    mù #31, Q6 §4 mục 21, T6-119 §2.3 đoạn D, T5-120 §2.3 đoạn H,
    T4-121 §2.3 đoạn K, T7-122 §2.3 đoạn C, T7-123 §2.3 đoạn C,
    T7-124 §2.3 đoạn C, T7-125 §2.3 đoạn E, T7-126 §2.3 đoạn G2,
    T4-127 §2.3 đoạn B, T2-128 §2.3 đoạn C, T2-129 §2.3 đoạn B,
    T2-130 §2.3 đoạn C, T2-131 §2.3 đoạn C, T2-132 §2.3 đoạn C,
    T2-133 §2.3 đoạn B, T2-134 §2.3 đoạn C, T2-135 §2.3 đoạn G,
    T2-136 §2.3 đoạn C mù #55, T2-137 §2.3 đoạn B mù #56,
    T2-138 §2.3 đoạn B mù #57, T2-139 §2.3 đoạn C mù #58,
    T2-140 §2.3 đoạn B mù #59, T2-141 §2.3 đoạn C mù #60.)
  - **56 mốc** (hai cây), lỗ lớn nhất **2.306 s** (22:59:14Z →
    23:37:40Z — khoảng yên sau khi T10-141 đóng aggregate tới khi
    đợt 142 mở); mốc cuối **23:44:47Z** (đuôi hai cây **31 s**).
  - **Merged 4 phạm vi: 37 mốc, lỗ lớn nhất 2.280 s**
    (22:59:40Z → 23:37:40Z), floor=1 theo luật lỗ thuần túy —
    **nhưng uptime trực tiếp loại bỏ khả năng reboot ẩn trong
    lỗ** (máy up liên tục từ 22:48:05Z tới lúc đo 23:44:12Z;
    journal chỉ 1 boot). Mốc đầu gộp 22:48:39Z (head 34 s — dpkg
    startup configure), mốc cuối gộp 23:45:09Z (đuôi 9 s).
  - Đoạn D dài hơn 2×sàn 2.294 s nên có cửa sổ sàn rộng
    [D-lo=23:07:12Z, D-hi=23:26:11Z]; 0 session bắc qua cắt D-lo,
    **0 session bắc qua cắt D-hi** — uptime là closer, luật lỗ chỉ
    là kiểm chứng thêm. Khoảng yên 22:59:40Z → 23:37:40Z là lúc
    máy thật sự không có tiến trình nào ghi đĩa (T10-141 đã đóng
    aggregate 22:59:14Z; đợt 142 mở 23:35:51Z; mốc đầu sau khoảng
    yên là file /tmp 23:37:40Z).
  - **Kết luận đoạn D: ĐÓNG.**

**Kết luận trung thực: khoảng mù #61 KHÔNG ĐÓNG HOÀN TOÀN.**
Đoạn A đóng (luật lỗ, tối đa 0 ẩn), đoạn B MỞ (luật lỗ, tối đa
1 ẩn), đoạn C đóng (luật lỗ + mật độ dày, tối đa 0 ẩn), đoạn D
đóng (uptime). 3 reboot đã chốt (#100? 21:52:21Z + #101? 22:33:03Z
+ #102? 22:48:05Z — chính xác từng giây trên đĩa; #100? đã xác
nhận, #101?/#102? vẫn tạm) + **tối đa 1 ẩn (đoạn B)**. Chuỗi mù
đóng hoàn toàn **ĐỨT tại #61** (trước đó #57, #58, #59, #60 đóng
— 4 liên tiếp).

Ngoài hai cây: **51 file** có mtime trong mù #61 (agents —
exec-log/tool-output chiếm đa số + repo-1-push paths;
chi tiết xem blind61-outside.txt); **/tmp: 19 file** trong mù #61
(xem blind61-tmp.txt + caveat §2.4 — cả 19 đều trong đoạn D).
Boot_id nhắc trong exec-log sinh/viết trong mù: 2c0efe57 6 file,
57a0dd12 1 file, ed5323a4 0 file, bde599df 2 file.

### 2.4 Gộp 4 phạm vi + 4 phát hiện mới (phương pháp nối tiếp T2-141 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind61-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 100 mốc, lỗ lớn nhất **927 s** (21:36:25Z →
  21:51:52Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**. Lỗ lớn thứ hai
  **483 s** (21:27:24Z → 21:35:27Z); lỗ lớn thứ ba **312 s**
  (21:01:29Z → 21:06:41Z) — cả ba đều < sàn.
- Đoạn B gộp: 10 mốc, lỗ lớn nhất **1.874 s** (21:54:17Z →
  22:25:31Z), floor=1 → **MỞ, tối đa 1 ẩn**. Lỗ lớn thứ hai
  **108 s**; lỗ lớn thứ ba **105 s** — cả hai cũng nhỏ hơn nhiều
  so với sàn; chỉ đúng một lỗ vượt sàn.
- Đoạn C gộp: 43 mốc, lỗ lớn nhất **193 s** (22:33:03Z →
  22:36:16Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**. Lỗ lớn thứ hai
  179 s; lỗ lớn thứ ba 136 s.
- Đoạn D gộp: 37 mốc, lỗ lớn nhất **2.280 s** (22:59:40Z →
  23:37:40Z), floor=1 theo luật lỗ thuần túy — **nhưng uptime
  trực tiếp đóng đoạn D** (xem §2.3). Lỗ lớn thứ hai 370 s;
  lỗ lớn thứ ba 234 s.
- Tổng gộp 191 mốc giây. Không có file nào trong
  `~/workspace/goals` ngoài hidden_files có mtime trong mù (kiểm
  bằng find riêng — vùng duy nhất hai lần quét chính không phủ,
  đã kiểm bổ sung, 0 file).

**Phát hiện 1 — /tmp CÓ 19 file trong mù #61, TẤT CẢ trong đoạn
D (mới, nối tiếp phát hiện 1 của T2-141):** /tmp trên VM này là
tmpfs — reboot #100? (21:52:21Z) xóa mọi file /tmp viết trước đó,
reboot #101? (22:33:03Z) xóa tiếp mọi file /tmp viết trong đoạn B,
và reboot #102? (22:48:05Z) xóa tiếp mọi file /tmp viết trong đoạn
C. Kiểm trực tiếp từ blind61-tmp.txt: **0 file có mtime <
22:48:05Z (đoạn A + B + C), 19 file có mtime ≥ 22:48:05Z (đoạn D)**;
file sớm nhất 22:59:40Z, muộn nhất 23:43:32Z. 19 mốc giây /tmp của
merged đều nằm trong đoạn D (4 mốc giây phân biệt — nhiều file
cùng giây). **Verdict không đổi:** đoạn A/B/C đóng/mở không phụ
thuộc /tmp (A đóng vì lỗ merged 927 s, B mở vì lỗ merged 1.874 s,
C đóng vì lỗ merged 193 s, D đóng nhờ uptime). Ghi rõ để luồng sau
khỏi hiểu "19 file /tmp" là bằng chứng cho cả mù — chúng chỉ phủ
đoạn D. Trong A-tail: **0 file**; trong B-tail: **0 file**; trong
C-tail: **0 file**; trong D-tail: **18 file**.

**Phát hiện 2 — Đoạn B mở NHƯNG sampler vòng 2 sống xuyên lỗ
(mới, bằng chứng hỗ trợ — KHÔNG đóng đoạn B theo phương pháp hiện
hành):** lỗ merged 1.874 s (21:54:17Z → 22:25:31Z) là khoảng yên
của file mtime, NHƯNG T9-141 sampler vòng 2 chạy 21:53:23Z →
22:27:25Z với **35 mẫu timestamp, khoảng cách mẫu lớn nhất 61 s,
32 mẫu nằm TRONG lỗ** (ram-sampler-long-2.log — kiểm trực tiếp từ
file, không qua LIMITS). Một reboot ẩn trong lỗ sẽ SIGTERM giết
sampler (đúng như reboot #24 đã giết sampler vòng 1 lúc 21:52:21Z);
sampler vòng 2 chạy liền mạch tới hết hạn 22:28Z — không có dấu
hiệu chết + khởi động lại giữa chừng (file .sh là vòng lặp đơn,
không có cơ chế tự khởi động lại; header ghi boot=57a0dd12).
**T2 KHÔNG tự ý đổi phương pháp:** verdict đoạn B vẫn MỞ theo luật
lỗ mtime (phương pháp chuẩn của chuỗi). T2 đưa câu hỏi cho parent:
có chấp nhận bằng chứng dòng-log sampler để đóng đoạn B (khi đó gap
#100?→#101? = [2.432, 2.452] s được chứng nhận → CERT 63 / FULL 78
— biến thể ba-gap trong gaps.py), hay giữ SPAN (CERT 62 / FULL 77)?
Cùng lớp với 2 session bắc qua cả hai cắt B-lo/B-hi — cũng chỉ là
bằng chứng hỗ trợ, không phải closer.

**Phát hiện 3 — Đoạn A chỉ đóng nhờ merged ngoài cây (mới):**
hai cây riêng cho lỗ lớn nhất 1.468 s > sàn (floor=1) — nếu chỉ
dùng hai cây, đoạn A cũng MỞ. Hai mốc ngoài cây 21:35:27Z +
21:36:25Z (mtime của 2 exec-log session T7/T8-141) lấp lỗ xuống
927 s (2 lỗ con 483 s + 927 s — cả hai < sàn). Đây là lần đầu tiên
một đoạn đóng HOÀN TOÀN nhờ phạm vi ngoài cây (trước đây merged
chỉ thu hẹp lỗ, không đổi verdict). Ghi rõ để luồng sau biết merged
4 phạm vi là closer thực sự, không phải kiểm phụ.

**Phát hiện 4 — Phạm vi thứ 5 KHÔNG có file nào trong mù #61
(mới, kiểm theo bài học F-136-T2-8):** quét ~/memory + ~/dreams +
~/side-chats cho cả mù #61: **0 file**. **0 mốc trong
(21:51:52Z, 21:52:21Z]** (đuôi khung chết #99?), **0 mốc trong
(22:32:05Z, 22:33:03Z]** (đuôi khung chết #100?) và **0 mốc trong
(22:45:49Z, 22:48:05Z]** (đuôi khung chết #101?) — verdict khung
không đổi.

### 2.5 Phân phối gap — CERT n=60 → n=62 / FULL n=75 → n=77 (HAI gap mới chứng nhận)

**Gap mới (xem blind61-gaps.py + blind61-gaps.txt):**
- **Gap #99?→#100? = [7.079 s, 7.099 s] (1h58'09" ±10 s) CHỨNG
  NHẬN DẠNG KHOẢNG** — đoạn A mù #61 đóng (merged, tối đa 0 ẩn;
  đoạn A phủ đúng btime #99? → btime #100?). **CERT/FULL tính gap
  này (mid 7.089 s).** Caveat: F99? ≈ −0 s tới −1 s đo trực tiếp
  đợt 141; F100? CHƯA ĐO (T2 không có session trên boot 57a0dd12)
  — btime gaps là RTC nên không bị ảnh hưởng bởi drift đồng hồ
  guest.
- **Gap #100?→#101? = 2.442 s (40'42") VẪN CHỈ LÀ SPAN** — đoạn B
  mù #61 mở (tối đa 1 ẩn; xem §2.4 phát hiện 2 về bằng chứng
  sampler — parent quyết). **CERT/FULL không tính gap này.**
  Caveat: F100? và F101? đều CHƯA ĐO.
- **Gap #101?→#102? = [892 s, 912 s] (15'02" ±10 s) CHỨNG NHẬN
  DẠNG KHOẢNG, kèm caveat đoạn ngắn + nhãn có điều kiện** — đoạn C
  mù #61 đóng (merged, tối đa 0 ẩn; đoạn C phủ đúng btime #101? →
  btime #102?). **CERT/FULL tính gap này (mid 902 s).** Caveat:
  (i) đoạn C chỉ 902 s < sàn — xem F-142-T2-7; (ii) nhãn
  #101?→#102? có điều kiện vì ed5323a4 = #101? vẫn TẠM (đoạn B
  mở) — khoảng 902 s được chứng nhận giữa hai boot quan sát được
  liên tiếp ed5323a4 → bde599df, bất kể số thứ tự; (iii) F101?
  CHƯA ĐO; F102? ≈ −1 s tới −2 s đo trực tiếp lượt này (xem
  F-142-T2-5).
- **Gap #98?→#99? = [7.266 s, 7.286 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 141. Không đổi lượt này.
- **Gap #97?→#98? = [7.089 s, 7.109 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 141. Không đổi lượt này.
- **Gap #96?→#97? = [7.246 s, 7.266 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 140. Không đổi lượt này.
- **Gap #95?→#96? = [7.271 s, 7.291 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 139. Không đổi lượt này.
- **Gap #94?→#95? = [8.169 s, 8.189 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 139. Không đổi lượt này.
- **Gap #93?→#94? = [5.320 s, 5.340 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 138. Không đổi lượt này.
- **Gap #92?→#93? = 9.473 s (2h37'53") VẪN CHỈ LÀ SPAN** — đoạn A
  mù #56 mở (tối đa 1 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại
  đợt này — xem §2.6). **CERT/FULL không tính gap này.**
- **Gap #91?→#92? = 6.838 s (1h53'58") VẪN CHỈ LÀ SPAN** — đoạn B
  mù #55 mở (tối đa 2 ẩn quy ước / 3 ẩn cộng dồn; KHÔNG kiểm lại
  đợt này — xem §2.6). **CERT/FULL không tính gap này.**
- **Gap #90?→#91? = [4.063 s, 4.083 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 136 (đoạn A mù #55 đóng). Không đổi lượt này.
- **Gap #81?→#82? = [7.797 s, 7.817 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 133 (đoạn A mù #52 đóng). Không đổi lượt này.
- **Gap #80?→#81? = 8.558 s (2h22'38") VẪN CHỈ LÀ SPAN** — đoạn B
  mù #51 mở (tối đa 3 ẩn; KHÔNG kiểm lại đợt này — xem §2.6).
  **CERT/FULL không tính gap này.**
- **Gap #79?→#80? = [2.079 s, 2.099 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 132 (đoạn A mù #51 đóng). Không đổi lượt này.
- **Gap #78?→#79? = [5.030 s, 5.050 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 131 (đoạn B mù #50 đóng). Không đổi lượt này.
- **Gap #77→#78? = [7.560 s, 7.580 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 131 (đoạn A mù #50 đóng). Không đổi lượt này.
- **Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
  #49 mở (T2-131 §2.3; KHÔNG kiểm lại lượt này theo quyết parent
  đợt 132 §12.3(d) — xem §2.6). **CERT/FULL không tính gap này.**
- **Gap #75→#76 = [6.511 s, 6.531 s] VẪN LÀ KHOẢNG** — đã chứng
  nhận đợt 130 (đoạn A mù #49 đóng). Không đổi lượt này.
- **Gap #74→#75 = 8.307 s (2h18'27") VẪN CHỈ LÀ SPAN** — đoạn A mù
  #48 mở (T2-129 §2.3). Không đưa vào FULL/CERT.
- **Gap #73→#74 = 6.639 s (1h50'39") VẪN LÀ KHOẢNG [6.629 s,
  6.649 s]** — đã chứng nhận đợt 128 (đoạn B mù #47 đóng). Không
  đổi lượt này.
- **Gap #72→#73 = 3.248 s (54'08") VẪN LÀ KHOẢNG [3.238 s,
  3.258 s]** — đã chứng nhận đợt 128 (đoạn A mù #47 đóng). Không
  đổi lượt này.
- **Gap #71→#72 = 9.876 s (2h44'36") VẪN CHỈ LÀ SPAN** — đoạn A mù
  #46 mở (T4-127 §2.3). Không đưa vào FULL/CERT.
- **Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN** — đoạn G1 mù
  #45 mở (T7-126 §2.3). Không đưa vào FULL/CERT.
- **Gap #68→#69 = 10.880 s (3h01'20") VẪN CHỈ LÀ SPAN** — đoạn D mù
  #44 mở (T7-126 §2.4). Không đưa vào FULL/CERT.

**Cross-check tái hiện T2(141) 100%:** chạy
blind61-gaps.py verbatim cho lại đúng CERT n=60 / FULL n=75 của
T2 đợt 141 (xem blind61-gaps.txt: CERT60 mean 1h35'19" median
1h49'58" p10 0h27'38" p90 2h16'46" sd 0h44'54" min 0h00'55" max
3h14'08"; FULL75 mean 1h41'33" median 1h53'00" p10 0h28'14" p90
2h25'09" sd 0h55'24" min 0h00'55" max 5h43'18"; in 90–150' = 39,
<60' = 17, >180' = 6, >240' = 2 — khớp T2-141 §2.5 từng số, và
chuỗi exec lồng nhau tái hiện cả CERT58/FULL73 của T2-140 và
CERT57/FULL72 của T2-139).
Hai gap mới vào nên CERT 60→62 / FULL 75→77.

- **CERT n=62 (mới):** mean 1h34'23" median 1h49'58" p10
  0h26'28" p90 2h16'01" sd 0h45'25" min 0h00'55" max 3h14'08".
- **FULL n=77 (mới):** mean 1h40'38" median 1h53'00" p10
  0h27'12" p90 2h24'50" sd 0h55'35" min 0h00'55" max 5h43'18";
  in 90–150' = 40, <60' = 18, >180' = 6, >240' = 2.
- Độ nhạy LO/HI (gap mới ở cận dưới/trên của khoảng):
  CERT62-LO mean 1h34'23" vs CERT62-HI mean 1h34'23" (sd 0h45'26"
  vs 0h45'25" — dịch 1 s, nhỏ, ghi rõ); FULL77-LO mean 1h40'38"
  vs FULL77-HI mean 1h40'39" (dịch 1 s — nhỏ, ghi rõ).
- **Dải chứng nhận [0h00'55", 3h14'08"] — không đổi** (hai gap mới
  7.089 s / 902 s nằm trong dải).
- **Biến thể một-gap (chỉ #99?→#100?, nếu parent giữ
  #101?→#102? vì caveat đoạn ngắn): CERT61 mean 1h35'41" median
  1h50'39" p10 0h27'47" p90 2h16'19" sd 0h44'37"; FULL76 mean
  1h41'46" median 1h53'38" p10 0h28'21" p90 2h25'00" sd 0h55'04".**
- **Biến thể ba-gap (nếu parent ĐÓNG đoạn B bằng bằng chứng
  sampler + chứng nhận #100?→#101? [2.432, 2.452] s mid 2.442 s):
  CERT63 mean 1h33'32" median 1h49'17" p10 0h26'37" p90 2h15'43"
  sd 0h45'34"; FULL78 mean 1h39'52" median 1h51'50" p10 0h27'21"
  p90 2h24'40" sd 0h55'39".**
- **Dải CHUẨN cho #103? (FULL77, neo tại #102? 22:48:05Z):
  [23:15:16Z, 01:12:54Z]**. Biến thể một-gap FULL76: [23:16:26Z,
  01:13:04Z] (chênh ≤70 s).
- **Dải cho #100? — VERDICT: INSIDE.** Dải chuẩn FULL75 (neo tại
  #99?) [20:22:26Z, 22:19:21Z]: thực tế 21:52:21Z **NẰM TRONG
  dải**. Biến thể một-gap FULL74 [20:22:19Z, 22:19:30Z] cũng chứa.
- **Dải cho #101? — VERDICT: INSIDE.** Dải tạm FULL75 (T10-141
  §10.2, neo tại #100?) [22:20:35Z, 00:17:30Z]: thực tế 22:33:03Z
  **NẰM TRONG dải**.
- **Dải cho #102? — VERDICT: OUTSIDE (dưới p10).** Dải chuẩn
  FULL77 (neo tại #101?) [23:00:14Z, 00:57:52Z]: thực tế 22:48:05Z
  **NẰM NGOÀI dải — dưới p10 729 s (12'09")**. Biến thể FULL76
  [23:01:24Z, 00:58:02Z] (thiếu 799 s) và dải CERT62 [22:59:30Z,
  00:49:04Z] (thiếu 685 s) cũng đều NGOÀI. **Chuỗi INSIDE theo dải
  cơ học ĐỨT tại #102?** (trước đó 8 lần liên tiếp #94?, #95?,
  #96?, #97?, #98?, #99?, #100?, #101?). T6-142 độc lập cũng kết
  luận OUTSIDE (dải tạm của T6) và "lần OUTSIDE đầu tiên kể từ
  #93?" — hai verdict độc lập đồng thuận.
- **Tốc độ reboot (đồng hồ ghi nhận):** 102 / 194,50 h = **1 reboot
  mỗi 114,4 phút** (từ #1 2026-11-10T20:18:10Z tới #102?
  2026-11-18T22:48:05Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 106 / 194,50 h = **1 mỗi 110,1 phút**; +3 nữa
  (mù #53 đoạn B tối đa 3) → 109 / 194,50 h = **1 mỗi 107,1
  phút**; +2 nữa (mù #55 đoạn B tối đa 2, quy ước) → 111 /
  194,50 h = **1 mỗi 105,1 phút**; +1 nữa (mù #56 đoạn A tối đa 1,
  quy ước) → 112 / 194,50 h = **1 mỗi 104,2 phút**; **+0 nữa
  (mù #57 ĐÓNG, tối đa 0) → 112 / 194,50 h = 1 mỗi 104,2 phút**;
  **+0 nữa (mù #58 ĐÓNG, tối đa 0) → 112 / 194,50 h = 1 mỗi
  104,2 phút**; **+0 nữa (mù #59 ĐÓNG, tối đa 0) → 112 / 194,50 h
  = 1 mỗi 104,2 phút**; **+0 nữa (mù #60 ĐÓNG, tối đa 0) → 112 /
  194,50 h = 1 mỗi 104,2 phút**; **+0 nữa (mù #61 đoạn A ĐÓNG, tối
  đa 0) → 112 / 194,50 h = 1 mỗi 104,2 phút**; **+1 nữa (mù #61
  đoạn B MỞ, tối đa 1) → 113 / 194,50 h = 1 mỗi 103,3 phút**;
  **+0 nữa (mù #61 đoạn C ĐÓNG, tối đa 0) → 113 / 194,50 h = 1
  mỗi 103,3 phút** (đọc cộng dồn: mù #55 đoạn B tối đa 3 → 114 /
  194,50 h = **1 mỗi 102,4 phút**; mù #56 đoạn A tối đa 3 → 116 /
  194,50 h = **1 mỗi 100,6 phút**). Chưa tính ẩn danh nghĩa tối đa
  của mù #35 (+24), mù #37 (+29), mù #38 đoạn G (+6), mù #39 đoạn
  J (+2), mù #40 đoạn B (+1), mù #43 đoạn B (+3), mù #44 đoạn D
  (+5), mù #45 đoạn G1 (+4), mù #46 đoạn A (+4), mù #48 đoạn A
  (+2), mù #49 đoạn B (+1), mù #51 đoạn B (+3).
  Mù #50: **+0** (đóng hoàn toàn). Mù #52: **+0** (đóng hoàn
  toàn). Mù #53: **+3** (đoạn B mở — recheck đợt 137 xác nhận).
  Mù #54: **+0** (đóng hoàn toàn). Mù #55: **+2 (quy ước) / +3
  (cộng dồn)**. Mù #56: **+1 (quy ước) / +3 (cộng dồn)**.
  Mù #57: **+0 (đóng hoàn toàn)**. Mù #58: **+0 (đóng hoàn
  toàn)**. Mù #59: **+0 (đóng hoàn toàn)**. Mù #60: **+0 (đóng
  hoàn toàn)**. **Mù #61: +1 có thể (đoạn B mở, tối đa 1) —
  +0 (đoạn A đóng) +0 (đoạn C đóng) — mới.**

### 2.6 Mù #56 A + mù #55 B + mù #53 B + mù #51 B + mù #49 B: KHÔNG kiểm lại đợt này

- **Mù #56 A: KHÔNG kiểm lại đợt này.** Đã recheck đợt 138 (0 mốc
  mới trong lỗ, 9 hit đều là file biên phải đã biết); hồ sơ đã ổn
  định; brief đợt 142 không giao recheck; T2 đợt này không thấy
  bằng chứng mới nào về mù #56 A. Gap #92?→#93? = 9.473 s GIỮ
  SPAN.
- **Mù #55 B: KHÔNG kiểm lại đợt này.** Đã recheck đợt 138 (0 mốc
  mới); hồ sơ đã ổn định; brief đợt 142 không giao recheck; T2 đợt
  này không thấy bằng chứng mới nào về mù #55 B. Gap #91?→#92? =
  6.838 s GIỮ SPAN.
- **Mù #53 B: KHÔNG kiểm lại đợt này.** Đã recheck đợt 137 (0 mốc
  giây mới, 1 hit float là file biên đã biết); hồ sơ đã ổn định.
  T2 đợt này không thấy bằng chứng mới nào về mù #53 B. Gap
  #83?→#84? = 6.318 s giữ SPAN.
- **Mù #51 B: KHÔNG kiểm lại đợt này.** Đã kiểm lại 3 lần (đợt
  131, 132, 133) với cùng verdict (lỗ lớn nhất 4.393 s, tối đa
  3 ẩn); hồ sơ đã ổn định. T2 đợt này không thấy bằng chứng mới
  nào về mù #51 B. Gap #80?→#81? = 8.558 s giữ SPAN. (Tiền lệ:
  không giao luồng sau kiểm lại B mù #51 — quyết đợt 126 §12(h)
  + quyết đợt 130 §12.3(e).)
- **Mù #49 B: KHÔNG kiểm lại đợt này.** Quyết parent đợt 132
  §12.3(d) đã phê duyệt bỏ mục kiểm lại thường lệ khỏi brief T2;
  chỉ kiểm lại khi có bằng chứng mới cụ thể. T2 đợt này không thấy
  bằng chứng mới nào về mù #49 B. Gap #76→#77 = 6.859 s giữ SPAN.
  Ghi rõ đã bỏ mục này theo quyết parent.

### 2.7 Quét writeFileSync lần thứ 48 — chênh 0 (lần thứ 48 liên tiếp) — ĐỐI CHIẾU BẰNG SỐ TỔNG KẾT

- Chạy script `scan-wfs.sh` (bản T2 trong round142-t2, đã đổi OUT
  sang round142-t2) **00:00:32Z → 00:00:57Z 19/11 (25 s, có
  SCAN-END)**. **Scan chạy trên boot 9afdaa89** (sau reboot #27) —
  kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại trên đĩa, không
  phụ thuộc boot hay giờ mù.
- NEWSTD: **954 dòng / 268 file** (phạm vi 3.181 file); R7b đối
  chiếu: **979 dòng / 285 file** (phạm vi 12.574 file); copies:
  **25 dòng / 17 file** — y hệt lần 43–47 về copies. Đối chiếu chéo:
  954+25=979=R7b, **chênh 0**.
- **Đối chiếu bằng SỐ TỔNG KẾT (quyết parent đợt 138 §12.3(h)):**
  file thô scan #43 đã mất (F-138-T5-1 — T5 ghi đè 7 file thô #43
  trước khi phát hiện; chấp nhận mất, không khôi phục được). Số
  tổng kết #43 còn nguyên trong LIMITS T2-137 §2.7 (**907 dòng /
  253 file**, R7b **932/270**, copies **25/17** — T2 đã đọc lại trực
  tiếp từ file LIMITS đợt này), số #44 trong LIMITS T2-138 §2.7
  (**915/256**, R7b **940/273**, copies **25/17** — file thô #44
  còn nguyên trong round138-t2, T2 đối chiếu chéo được), số #45
  trong LIMITS T2-139 §2.7 (**926/259**, R7b **951/276**, copies
  **25/17** — file thô #45 còn nguyên trong round139-t2, T2 đối
  chiếu chéo được), số #46 trong LIMITS T2-140 §2.7 (**935/261**,
  R7b **960/278**, copies **25/17** — file thô #46 còn nguyên trong
  round140-t2, T2 đối chiếu chéo được) và số #47 trong LIMITS
  T2-141 §2.7 (**944/264**, R7b **969/281**, copies **25/17** —
  file thô #47 còn nguyên trong round141-t2, T2 đối chiếu chéo
  được). Chuỗi: #43 907/253 → #44 915/256 (+8/+3) → #45 926/259
  (+11/+3) → #46 935/261 (+9/+2) → #47 944/264 (+9/+3) →
  **#48 954/268 (+10/+4)**.
- **+10 dòng / +4 file so với lần 47** (944/264 → 954/268), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + diff
  từng dòng — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND141_LIMITS.md | +1 (0 → 1) | sau scan #47 | LIMITS gộp đợt 141 (nhắc `writeFileSync` 1 lần); viết SAU scan lần 47 (scan #47 chạy 20:52:11Z 18/11; aggregate 141 đóng 22:59:14Z) nên lần này mới vào |
  | docs/PHASE9_ROUND141_T2_EPERM_LIMITS.md | +7 (0 → 7) | sau scan #47 | Tài liệu T2 đợt 141 (nhắc `writeFileSync` 7 lần); viết SAU scan lần 47 (T2-141 LIMITS viết xong 21:06:47Z) nên lần này mới vào |
  | docs/PHASE9_ROUND141_T5_INFRA_LIMITS.md | +1 (0 → 1) | sau scan #47 | LIMITS T5 đợt 141 (nhắc `writeFileSync` 1 lần); viết SAU scan lần 47 (T5 xong 21:25Z) nên lần này mới vào |
  | docs/PHASE9_ROUND142_T5_INFRA_LIMITS.md | +1 (0 → 1) | sau scan #47 | LIMITS T5 đợt 142 (nhắc `writeFileSync` 1 lần); viết TRƯỚC scan lần 48 (T5-142 xong ~23:49Z) nên lần này mới vào |
  1+7+1+1 = 10 dòng. ✓ (Phạm vi: 3.181 = 3.172 + 9 net (**9 file
  mới, 0 file mất**: kiểm bằng diff danh sách file — 9 file mới
  gồm 7 LIMITS đợt 141 (aggregate + T2/T5/T6/T7/T8/T9 — T1/T4-141
  đã có trong phạm vi #47 vì viết trước scan #47) + T1-142 +
  T5-142; trong 9 file mới có 4 file mang hit (+4 file) là gộp 141
  + T2-141 + T5-141 + T5-142; 5 file còn lại không mang hit.
  Copies y hệt lần 47 (diff 0 dòng).)
- **Đối chiếu chéo với T5-142 (quét độc lập):** T5-142 chạy
  scan-wfs-t5.sh lúc **23:48:37Z → 23:49:19Z** (trước T2 ~11 phút)
  cho **953/267 + 978/284 + 25/17** (phạm vi 3.180 — 1 file tạo
  thêm giữa hai lần quét, mang 1 hit: chính file LIMITS của T5-142
  — viết xong sau scan của T5, trước scan của T2). Hai lần quét độc
  lập khớp hoàn toàn về số đếm sau khi trừ file xen giữa.
- **Kết luận: 48 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #61. Verdict
  "chênh 0 lần 48" đứng trên đối chiếu bằng số tổng kết (#43) +
  file thô (#44, #45, #46, #47, #48) + hai lần quét độc lập #48 (T2
  vs T5 khớp hoàn toàn sau khi trừ file xen giữa) — xem aggregate
  đợt 138 §10.1(f).

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
  né EPERM trong mù #61.

## 3. RAM trong mù #61 — max 2.898,6 MiB (47,18% guard, KHÔNG vượt), birefnet KHÔNG chạy bởi T2

- **5 mẫu MemAvailable trực tiếp của lượt (đoạn D + lúc đóng trên
  bde599df / boot mới):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 23:44:12Z | **1.012.020 kB** (988 MB) | Lúc xác minh boot (boot bde599df, đoạn D) — dưới gate A 1.024 MB |
  | 23:45:18Z | **842.852 kB** (823 MB) | Sau probe #61 (boot bde599df, đoạn D) — dưới gate A |
  | 00:06:27Z 19/11 | **2.668.352 kB** (2.606 MB) | Lúc đóng phiên T2 (boot mới 9afdaa89 — NGOÀI mù #61; sau reboot #27, balloon chưa phồng lại) |
- **Max RAM biết được TRONG mù #61: 2.968.192 kB ≈ 2.898,6 MiB
  (T5-141 sampler, 20:47:12Z, đoạn A, `avail_kB=2968192`) —
  47,18% guard 6.144 MiB, THIẾU 3.323.264 kB (~3.245,4 MiB), KHÔNG
  VƯỢT.** Nguồn: T5-141 LIMITS §4 (sampler boot 2c0efe57).
  Corroboration: T9-141 sampler vòng 1 max **2.928.692 kB =
  2.860,1 MiB lúc 20:46:48Z** (24 s trước, −39.500 kB — hai sampler
  độc lập đỉnh trong cùng cửa sổ ~20:47Z). Đoạn B max theo T9-141
  sampler vòng 2: **1.936.172 kB = 1.890,8 MiB lúc 21:53:23Z**
  (mẫu đầu sau reboot #24, 30,77% guard — kiểm trực tiếp từ
  ram-sampler-long-2.log); T9-141 LIMITS §2.2 khớp. Đoạn C max theo
  quét tay: **~1.343 MB lúc 22:39:48Z** (T10-141 suite start,
  RAMavail 1.343 MB — T10-141 LIMITS §9.3). Đoạn D max theo quét
  tay: **1.176.808 kB = 1.149,2 MiB lúc 23:43:37Z** (T9-142 sampler,
  18,7% guard — kiểm trực tiếp từ ram-sampler-long.log của
  round142-t9). **Không sampler nào quan sát được ≥ 6.144 MiB** —
  quyết "thử ngay khi quan sát được" đã được trực đúng, cửa sổ chỉ
  không mở.
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Cửa sổ vượt guard KHÔNG XUẤT HIỆN trong mù #61 (đỉnh cao nhất
  47,18% < 100%) và T2 KHÔNG thử (không thuộc brief T2; việc thử
  thuộc T9-142 theo quyết parent đợt 141 §12.2(j): "GIỮ NGUYÊN quy
  trình + guard 6.144 MiB"). u2net là fallback chính thức.
- Caveat phương pháp (F-142-T2-10, cùng lớp F-141-T2-2): ram-max61.py
  chỉ bắt được mẫu cao nhất 1.243 MB (đoạn A, T4-141) + 1.014 MB
  (đoạn D) — mẫu cao nhất thật 2.968.192 kB (T5-141) không vào danh
  sách vì dòng log sampler của T5 dùng format `avail_kB=` (regex
  nào của script cũng trượt); mẫu T9-142 1.176.808 kB cũng trượt
  (dòng log sampler dài mang số trần không đơn vị). T2 tìm ra max
  thật bằng cách quét tay log sampler của T9/T5. **ram-max là cận
  dưới, không phải max tuyệt đối** — luôn đối chiếu LIMITS sibling
  + quét tay log sampler trước khi chốt max RAM.

## 4. Ghi chú phương pháp + kiểm prereg

1. **Prereg đợt này có 1 dự báo sai + 2 dự báo đúng một nửa — các
   dự báo chính còn lại đều đúng:** probe #61 ok=2 fail=0 + log +3
   (đúng); boot bde599df btime 22:48:05Z (đúng); đoạn A ĐÓNG bằng
   luật lỗ (đúng — nhưng CHỈ đóng nhờ merged ngoài cây, hai cây
   riêng cho lỗ 1.468 s vượt sàn — xem §2.4 phát hiện 3, prereg
   không lường trước); đoạn B "CHƯA BIẾT" (thực tế MỞ, tối đa 1 ẩn
   — prereg đã nêu khả năng này); đoạn C ĐÓNG (đúng, kèm caveat
   đoạn ngắn như prereg dự báo); đoạn D đóng bằng uptime (đúng);
   gap #99?→#100? chứng nhận [7.079, 7.099] s (đúng); gap
   #100?→#101? [2.432, 2.452] s — **KHÔNG chứng nhận được** (đoạn B
   mở — prereg đã nêu "nếu đoạn B đóng" làm điều kiện, điều kiện
   không thỏa); gap #101?→#102? chứng nhận [892, 912] s (đúng, kèm
   caveat); EPERM 0 sóng thật + WFS chênh 0 (đúng); dpkg bde599df
   2 dòng chết yểu (đúng — prereg đoán replay XONG 1.545/221/462
   là **SAI**: boot này replay chết yểu như boot #98?, T5-142 phải
   repair; replay XONG 1.545/221/462 thuộc về boot MỚI 9afdaa89 sau
   reboot #27 — xem F-142-T2-3); RAM max 47,18% guard (prereg dẫn
   T5-141 2.968.192 kB — đúng số, xem §3); btime bde599df NGOÀI
   dải tạm #102? (đúng như prereg cảnh báo — prereg tính dải tạm
   FULL75 [23:01:17Z, ...], thực tế dải chuẩn FULL77 [23:00:14Z,
   00:57:52Z], cả hai đều NGOÀI — verdict không đổi).
   Lệch nhỏ: WFS prereg không đoán số trước (chỉ nêu phương pháp
   diff) — thực tế +10/+4, giải thích đúng hết.
2. **F-142-T2-1 — prereg + docstring script ghi sai độ dài đoạn A
   (mới, lỗi số học):** prereg §3 ghi đoạn A "4.266 s" và docstring
   blind61-investigate.py / blind61-sessions.py ghi "1h11'06\" =
   4266s" / "floor window 1972s wide" — **SAI**: 21:52:21Z −
   20:45:15Z = **4.026 s = 1h07'06"**, floor window rộng 4.026 −
   2.294 = **1.732 s**. Code dùng đúng timestamp (investigate.py
   in "seg A length = 4026s" + "floor window [21:04:22 ..
   21:33:14] (width 1732s)") nên **không ảnh hưởng kết quả nào**;
   docstring hai script đã sửa trong phiên (trước khi chạy
   merged/gaps — merged/gaps không đọc docstring). Prereg KHÔNG
   sửa lại (giữ nguyên làm hồ sơ dự báo); sai số ghi tại đây.
3. **F-142-T2-2 — reboot #27 trong phiên T2, sau probe #61 (mới,
   §1/§2.1):** boot 9afdaa89, btime 23:54:20Z, journal first entry
   23:54:31Z (btime +11 s). Reboot xảy ra sau khi mọi phép đo mù
   #61 đã xong (cửa sổ đóng 23:45:18Z) nên **không ảnh hưởng verdict
   mù nào**; nó chỉ làm câu "không reboot trong phiên T2" thành
   SAI và mở mù #62 (probe #61 → probe #62, việc của T2-143).
   Gap danh nghĩa bde599df → 9afdaa89 = 3.975 s (1h06'15"), NẰM
   TRONG dải FULL77 cho #103? [23:15:16Z, 01:12:54Z] — ghi nhận
   cho T2-143, không chứng nhận ở đây. dpkg.log boot mới replay
   XONG 1.545/221/462 (xem §1).
4. **F-142-T2-3 — dpkg bde599df chết yểu, prereg đoán sai (mới):
   ** prereg §9 đoán replay XONG 1.545/221/462 cho boot bde599df —
   thực tế chỉ **2 dòng** (startup configure 22:48:39Z ×2), lặng
   ~56' — replay chết yểu cùng mẫu boot #98?. T5-142 đã trigger
   repair 23:44:06Z; bracket chính thức thuộc về T5. Replay XONG
   1.545/221/462 thuộc về boot 9afdaa89 sau reboot #27 (đọc
   00:08:31Z). Bài học: không đoán trước hình dạng replay — đọc
   rồi mới kết luận.
5. **F-142-T2-4 — phương pháp đếm dpkg 'configure' đã đính chính
   (mới):** T2-141 ghi "1.545 dòng / 221 installs / 462 configure"
   mà không ghi rõ pattern. Kiểm trực tiếp trên dpkg.log boot
   9afdaa89: `grep -c 'status installed'` = **221** ✓;
   `grep -c 'configure'` (substring) = **462** ✓; `grep -c
   ' configure '` (action) = 178; `grep -c ' install '` (action)
   = 169. **"462 configure" = đếm substring 'configure', "221
   installs" = đếm 'status installed'.** Ghi rõ để các đợt sau
   dùng đúng pattern. Hình dạng replay XONG trên 9afdaa89 khớp
   baseline trên cả ba số (1.545 / 221 / 462).
6. **F-142-T2-5 — F102? 3 server không đồng nhất lần thứ ba (mới):
   example +1 s, google +1 s, cloudflare +2 s** (lần đầu là F97?
   +1/+2/+2 đợt 140; lần hai là F99? +1/0/+1 đợt 141; các đợt trước
   đó đều +1 s cả 3 server). F102? ≈ **−1 s tới −2 s (±~1 s)** —
   T2 ghi khoảng thay vì một số. Không đổi verdict gap nào (btime
   gaps là RTC, không phụ thuộc drift guest). **Quy ước đo:** T2
   tính `Date − local_after` (cùng phương pháp T2-140 đo F97? và
   T2-141 đo F99?); T6-142 đọc cùng file f102.txt theo quy ước
   `Date − local_before` sẽ cho +2/+2/+3 — số liệu thô giống hệt
   nhau, chỉ khác quy ước; offset thật nằm giữa hai cách tính
   (−1 s tới −3 s). T2 giữ quy ước cũ để nhất quán chuỗi.
7. **F-142-T2-6 — started_at lượt 141 viết lại lần 2: +34 s so với
   boot mới, KHÔNG phải +936 s (mới, §2.2 + prereg §6):**
   run 141 started_at nay 22:48:39Z (T10-141 F-141-T10-2 ghi =
   btime(ed5323a4) + 936 s). NHƯNG 22:48:39Z − btime(bde599df
   22:48:05Z) = **+34 s** — khớp dải ~30–50 s cổ điển NẾU lần viết
   lại này xảy ra tại reboot #26 (tới bde599df), không phải #25.
   **Bằng chứng độc lập thứ hai cùng giây:** dpkg.log của boot
   bde599df bắt đầu đúng 22:48:39Z (startup packages configure =
   btime +34 s) — cùng giây với started_at mới. Hai sự kiện độc
   lập cùng mốc 22:48:39Z gợi ý runtime (re)start sau reboot #26
   diễn ra đúng lúc đó. T2 ghi nhận khả năng này để T7-142 kiểm
   (không kết luận cơ chế — cần bằng chứng ngoài started_at; quyết
   parent (h) đợt 141 đã BỎ dải offset ~30–50 s nên +936 s vẫn là
   số ghi nhận, chỉ thêm cách đọc thay thế +34 s).
8. **F-142-T2-7 — đoạn C mù #61 chỉ 902 s: luật lỗ đóng cơ học là
   yếu (mới, đã dự báo trong prereg §3):** 902 s < sàn 1.147 s nên
   floor(902/1147)=0 ngay cả khi không có mốc nào. Verdict đóng
   của đoạn C đứng trên **mật độ thực tế** (43 mốc merged, lỗ lớn
   nhất 193 s = 17% sàn, 85 mốc hai cây), không chỉ trên luật cơ
   học. T2 báo cả hai để parent tự xét — nếu parent thấy mật độ
   chưa đủ, gap #101?→#102? vẫn có thể giữ SPAN (khi đó CERT/FULL
   dùng biến thể một-gap CERT61/FULL76 — xem §2.5). (So sánh:
   đoạn A mù #60 — 53 mốc / 735 s, lỗ lớn nhất 79 s — parent đã
   chấp nhận chứng nhận gap ở quyết (c) đợt 141.)
9. **F-142-T2-8 — đoạn B MỞ dù sampler sống xuyên lỗ (mới, §2.4
   phát hiện 2):** merged lỗ 1.874 s > sàn → verdict MỞ theo luật
   lỗ mtime (phương pháp chuẩn). Bằng chứng sampler vòng 2 (35 mẫu
   timestamp, khoảng cách lớn nhất 61 s, 32 mẫu trong lỗ) + 2
   session bắc qua cả hai cắt B-lo/B-hi là bằng chứng HỖ TRỢ, không
   phải closer theo phương pháp hiện hành. T2 KHÔNG tự ý đổi
   phương pháp. Parent quyết: (a) giữ SPAN (CERT 62 / FULL 77),
   hay (b) chấp nhận bằng chứng dòng-log sampler để đóng đoạn B
   (CERT 63 / FULL 78 — biến thể ba-gap trong gaps.py). Nếu (b)
   được chấp nhận, cần ghi rõ tiền lệ: dòng-log timestamp được
   dùng làm bằng chứng liên tục cho các mù sau.
10. **F-142-T2-9 — file observer T10-141 sha256 không tồn tại
    (mới, cùng lớp F-141-T2-3):** `round141-t10/t10-closing-sha256.txt`
    UNREADABLE — tên file trong script investigate kế thừa từ đợt
    trước không khớp tên thật của T10-141 (T10-141 không tạo file
    này). Không ảnh hưởng verdict (chỉ là kiểm observer phụ; các
    observer khác đọc được: LIMITS gộp 141 22:59:14Z, T2-141 LIMITS
    21:06:47Z, cờ t10.done 22:55:20Z, GAP_ANALYSIS 22:54:49Z,
    build-loop-log 23:49:11Z).
11. **F-142-T2-10 — ram-max61.py lại là cận dưới (mới, cùng lớp
    F-141-T2-2):** mẫu cao nhất thật trong mù #61 là 2.968.192 kB
    (T5-141, format `avail_kB=`) và 1.176.808 kB (T9-142, số trần
    không đơn vị) — cả hai đều trượt mọi pattern của ram-max.
    ram-max chỉ bắt được 1.243 MB (đoạn A) + 1.014 MB (đoạn D).
    T2 tìm ra max thật bằng cách quét tay log sampler của T9/T5
    (xem §3). Bài học lặp lại: ram-max chỉ là cận dưới; luôn đối
    chiếu LIMITS sibling + quét tay log sampler trước khi chốt max
    RAM. (Đoạn B max theo ram-max là "no RAM samples" — max thật
    1.936.172 kB từ T9-141 LIMITS + kiểm trực tiếp file
    ram-sampler-long-2.log.)
12. **F-142-T2-11 — scan WFS #48 chạy trên boot mới 9afdaa89
    (mới):** scan chạy 00:00:32Z–00:00:57Z 19/11, sau reboot #27 —
    kết quả vẫn hợp lệ vì scan chỉ đếm code trên đĩa, không phụ
    thuộc boot hay giờ mù. Đối chiếu chéo với scan độc lập của
    T5-142 (23:48:37Z, trên boot bde599df): chênh đúng 1 file / 1
    dòng — file LIMITS của chính T5-142 viết xong giữa hai lần
    quét (xem §2.7).
13. **Docstring các script blind61 đã kiểm cửa sổ (mới):**
    investigate/sessions/merged/gaps/fifthscope/sweep/ram-max đều
    ghi đúng cửa sổ (20:45:15Z → 23:45:18Z 18/11) + SEGS 4 đoạn
    viết mới — đã kiểm bằng grep trước khi chạy (bài học T2-133 §4
    mục 6: kiểm SEGS sau khi adapt; F-139-T2-2/3 là hai lỗi adapt
    đã bắt bằng chính bước kiểm này). Lần này adapt gặp 2 lỗi suýt
    mắc (số học đoạn A F-142-T2-1 — bắt bằng đối chiếu số in ra của
    code; nhãn observer §4 mục 9 — bắt bằng đối chiếu stat trực
    tiếp, xem F-142-T2-9).
14. **T6-142 công bố TRƯỚC khi T2 đóng (mới, như đợt 140/141):**
    T6-142 LIMITS + cờ `.done` đã có lúc T2 kiểm — chuỗi tương đối
    #57→#101? + bde599df (ứng viên #102?) đã chốt độc lập, bde599df
    OUTSIDE dải tạm (dưới p10), "lần OUTSIDE đầu tiên kể từ #93?",
    chuỗi INSIDE đứt ở bde599df. Số #102? có hai verdict độc lập
    đồng thuận (T6 + T2). T1-142 và T5-142 cũng đã xong (cờ `.done`
    có lúc T2 kiểm).
15. **preview.tsx 530e10a7 GIỮ VĨNH VIỄN — theo quyết parent, không
    phải sai số (nhắc lại, §0):** md5 530e10a7 — fix instrumentation
    của T3-134 theo quyết parent đợt 137 §12.3(a) (GIỮ VĨNH VIỄN,
    từ đợt 138 chỉ giám sát thụ động điều tra (c2)). media.ts
    KHÔNG ĐỔI 2c384ed1; vite.config.ts (apps/web/) KHÔNG ĐỔI
    ee80d093. T2 không sửa production file nào.
16. **R9 (a): SỐ ĐẾM VẪN LÀ 16 — KHÔNG tăng (nhắc lại, §0):**
    quyết parent đợt 141 §12.2 không nhắc lại R9 (a) (quyết (l) đợt
    139: để yên, không nhắc lại). File LIMITS này KHÔNG viết số 17
    ở bất cứ đâu cho R9 (a).

## 5. Hồ sơ + stage

- **LIMITS này:** `docs/PHASE9_ROUND142_T2_EPERM_LIMITS.md`
  (oversize >37.768 B — chỉ stage paths, không push, như các
  LIMITS oversize đợt 134–142).
- **Thư mục làm việc:** `hidden_files/round142-t2/` — prereg-t2.md,
  boot-verify.txt, f102.txt (đo F102? — xem §1), dpkg102.txt (đọc
  bracket bde599df 2 dòng + bracket 9afdaa89 1.545/221/462 — xem
  §1), status1/once/status2 + .exit, blind61-investigate.py
  + .log, blind61-sessions.py + .log, blind61-merged.py + .log,
  blind61-gaps.py + .txt, blind61-fifthscope.py + .log,
  blind61-repo-1.txt, blind61-hidden_files.txt, blind61-outside.txt,
  blind61-tmp.txt, sessions-all.txt, eperm-sweep61.py +
  eperm-sweep-run.log, ram-max61.py + ram-max.txt, scan-wfs.sh +
  scan-meta.txt + files-*.bin + wfs-*.txt.
- **Stage (KHÔNG push):** `phase9-round142-t2-eperm.txt`
  (NUL-delimited, 1 entry: LIMITS này; verify read-back trước khi
  đóng cờ).
- **Cờ:** `hidden_files/round142-t2.done`.
- **Mù #62 MỚI MỞ** từ probe #61 (23:45:18Z 18/11) — việc của T2
  đợt 143. Dải chuẩn cho #103?: FULL77 [23:15:16Z, 01:12:54Z] (neo
  tại #102? 22:48:05Z); biến thể một-gap FULL76 [23:16:26Z,
  01:13:04Z]. Reboot #27 (9afdaa89, btime 23:54:20Z) NẰM TRONG dải
  này — chờ T2-143 chứng nhận bằng merged mù #62.
