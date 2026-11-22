# PHASE9 ROUND141 T2 — EPERM: probe #60 ok=2 fail=0 + mù #60 ĐÓNG HOÀN TOÀN (3 đoạn, 2 reboot) + gap #97?→#98? CHỨNG NHẬN [7.089, 7.109] s + gap #98?→#99? CHỨNG NHẬN [7.266, 7.286] s → CERT 60 / FULL 75 + khung chết #97? ứng viên merged 46 s + #98? INSIDE + #99? INSIDE (chuỗi 6) + WFS #47 chênh 0

> Luồng T2, đợt 141 vòng lặp Phase 9 VCut Studio (lượt cron 03:35 +07
> 19/11/2026; làm việc 20:39Z → ~21:01Z 18/11/2026).
> Nhiệm vụ: probe #60 theo lịch thường lệ + mù #60 (từ probe #59) +
> boot #98?/#99? + khung chết #97? + WFS lần 47 (đối chiếu bằng SỐ TỔNG
> KẾT theo quyết parent đợt 138 §12.3(h) — file thô scan #43 đã mất,
> chấp nhận mất).
> Quyết parent đợt 140 §12.2: (a) CHẤP NHẬN đóng đợt 140 (8/8 luồng =
> 9/9 cờ gồm T10); (b) **Lượt yên #17: GIỮ NGUYÊN kế hoạch đo lại ở đợt
> 141, không đổi cách đo**; (c) **Khung chết #96?: XÁC NHẬN ứng viên
> merged (15:54:16Z, 15:54:37Z] (21 s) làm chuẩn mới** (khung T9 35 s
> giữ làm biên ngoài; khung T8 là cách dựng khác); (d) **boot 90392aa5
> = #98? TẠM; gap #97?→#98? = 7.099 s chờ T2-141 chứng nhận; khung
> chết #97? HOÃN QUYẾT — giao T2-141 chứng nhận bằng merged mù #60**
> (hai khung quan sát T4/T5 (17:53:26Z, 17:54:22Z] và T8 (17:53:26Z,
> 17:54:02Z] ghi cả hai kèm nguồn, không chốt khung quan sát ngay);
> (e) **Gate A / balloon: GIỮ NGUYÊN gate A ≥1024 MB, TIẾP TỤC CHỜ xả
> tự nhiên; KHÔNG nhờ user can thiệp host, KHÔNG đổi cách đo**; (f)
> **Birefnet: GIỮ NGUYÊN quy trình + guard 6.144 MiB** (u2net là
> fallback chính thức); (g) **Headroom 1.838–1.840: VẪN CHỈ THEO DÕI,
> CHƯA báo user** (nếu đợt 141 chạm <1.800 thì báo lúc đó); (h)
> attempt1 partial của T4 KHÔNG đếm vào ngân sách retry đợt sau; (i)
> **TickCost median 69,0/73,0 ms của partial attempt1: CHỈ là quan sát,
> KHÔNG dùng cho bất kỳ quyết định ngưỡng nào**; (j) **Gap #96?→#97?
> [7.246, 7.266] s → CERT 58 / FULL 73: XÁC NHẬN**.
> Prereg viết TRƯỚC khi đo: hidden_files/round141-t2/prereg-t2.md.
> **KHÔNG có mâu thuẫn BTO lần này:** marker round-in-progress.md đợt
> 141 ghi đúng btime 19:54:12Z cho boot 2c0efe57 (brief + T6-141 +
> prereg T2 đều khớp — xem §1). T6-141 chốt chuỗi tương đối #57→#99?
> (T6-141 §8) — công bố TRƯỚC khi T2 đóng (như đợt 140).
> **KHÔNG có reboot mới trong phiên T2:** boot 2c0efe57 xác minh lúc
> 20:39:59Z (mở), 20:44:52Z, 20:45:15Z (sau probe #60), 20:58:55Z,
> 20:59:38Z và 21:00:45Z (lúc đóng) — cùng boot_id + btime 19:54:12Z.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (20:44:52Z–20:45:15Z):**
  `status` báo **DEAD/STALE** (heartbeat age 11.074 s, last #59
  17:40:41Z, boot af558fb5, exit 1); `once` ngay sau đó là **probe
  #60, boot 2c0efe57, ok=2 fail=0**, exit 0, 20:45:15Z; `status`
  chạy lại **ALIVE** (age 0 s, n=60), exit 0. Log v2 tăng đúng **3
  dòng** (169 → 172) — **như mọi lượt trước**; prereg §3 đã dự báo
  đúng +3 trước khi đo. Heartbeat nay n=60, ts 20:45:15Z, boot
  2c0efe57.
- **Boot #99? lúc 19:54:12Z, boot
  `2c0efe57-5559-4e92-9f8b-aecf1f9866a3`** — xác minh bằng `uptime
  -s` + btime 1795031652 + `who -b` + journal 1 boot (xem §1). Clock
  VM hiện tại: HTTP `Date` 3 server hơn local **+1 s / 0 s / +1 s**
  → **F99? ≈ −0 s tới −1 s (±~1 s)** — lần thứ hai 3 server không
  đồng nhất (xem F-141-T2-5).
- **Khoảng mù #60 (17:40:41Z → 20:45:15Z 18/11, 3h04'34" =
  11.074 s) — ĐÓNG HOÀN TOÀN. Mù đóng hoàn toàn thứ tư liên tiếp
  (#57, #58, #59, #60).**
  Đoạn A ĐÓNG bằng luật lỗ (merged 53 mốc, lỗ lớn nhất **79 s** ≪
  sàn 1.147 s, tối đa **0 ẩn** — xem caveat đoạn ngắn F-141-T2-7);
  đoạn B ĐÓNG bằng luật lỗ (merged 174 mốc, lỗ lớn nhất **445 s**
  ≪ sàn, tối đa **0 ẩn**); đoạn C ĐÓNG bằng uptime trực tiếp
  (merged 59 mốc, lỗ lớn nhất 1.849 s — vượt sàn nhưng uptime loại
  bỏ reboot ẩn). Merged 287 mốc giây.
  **Chuỗi mù đóng hoàn toàn: #50 đóng, #51 hở, #52 đóng, #53 hở,
  #54 đóng, #55 hở, #56 hở, #57 đóng, #58 đóng, #59 đóng, #60 đóng.**
- **Gap #97?→#98? = [7.089 s, 7.109 s] (1h58'19" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn A mù #60 đóng, tối đa 0 ẩn; đoạn B mù
  #59 đóng bằng uptime — chuỗi phủ btime #97? → probe #59 → btime
  #98?). **Gap #98?→#99? = [7.266 s, 7.286 s] (2h01'16" ±10 s) —
  CHỨNG NHẬN DẠNG KHOẢNG** (đoạn B mù #60 đóng, tối đa 0 ẩn — đoạn
  B phủ đúng btime #98? → btime #99?). **CERT 58→60 / FULL 73→75**:
  CERT60 mean 1h35'19" median 1h49'58" p10 0h27'38" p90 2h16'46" sd
  0h44'54"; FULL75 mean 1h41'33" median 1h53'00" p10 0h28'14" p90
  2h25'09" sd 0h55'24"; in 90–150' = 39, <60' = 17, >180' = 6,
  >240' = 2. Dải chứng nhận [0h00'55", 3h14'08"] không đổi.
  Biến thể một-gap (chỉ #97?→#98?): CERT59 / FULL74 (xem §2.5).
- **Boot 2c0efe57 = #99? — XÁC NHẬN theo quy ước VÀ được củng cố
  bởi merged** (đoạn A + B mù #60 đóng, tối đa 0 ẩn — không có
  reboot ẩn giữa #97? và boot này) **+ T6-141 chốt chuỗi tương đối
  #57→#99?** (T6-141 §8, công bố TRƯỚC khi T2 đóng). Số tuyệt đối
  vẫn tạm theo thông lệ. Reboot #97?→#98? là **sự kiện gộp #22**
  (giữa lượt 140, theo T10-140; parent đã chấp nhận §12.2(a) đợt
  140); reboot #98?→#99? là **sự kiện gộp #23** (trong lúc T10-140
  đóng sổ, theo T10-140 + T6-141 §8.0).
- **Khung chết #97? ứng viên MERGED: (17:52:10Z, 17:52:56Z] (46 s)**
  — mốc cuối là blind59-gaps.txt của T2-140 (17:52:10Z). Ba khung
  không giao nhau theo đồng hồ đọc: merged 46 s (neo btime) vs
  T4/T5 (17:53:26Z, 17:54:22Z] (56 s) vs T8 (17:53:26Z, 17:54:02Z]
  (36 s) — hai khung quan sát là cách dựng KHÁC (quan sát trực
  tiếp, mốc dưới là nhân chứng nhảy +30 s). **T2 ĐỀ XUẤT 46 s làm
  chuẩn mới** (cùng quy ước đồng hồ đọc như chuẩn #96? 21 s vừa
  được parent xác nhận), kèm caveat đồng hồ cũ chạy nhanh (+11 s
  chắc chắn, tới +30 s có thể — xem F-141-T2-6); **parent quyết
  khi đóng sổ** theo quyết (d) đợt 140.
- **Khung chết #98? ứng viên MERGED: (19:46:47Z, 19:54:12Z]
  (445 s)** — mốc cuối là log O8 + cooldown của T10-140
  (19:46:47Z). Rộng vì máy yên sau O8 của T10 tới lúc reboot;
  chưa có khung quan sát thay thế nào từ T4/T5/T8-140 lúc T2 đóng
  — T2 không tự bịa khung quan sát.
- **#98? INSIDE dải dự báo:** dải chuẩn FULL72 [16:22:31Z,
  18:20:15Z] (quyết (f) đợt 139) — thực tế 17:52:56Z **NẰM
  TRONG dải** (biến thể FULL73 cũng chứa). **#99? INSIDE dải tạm:**
  dải FULL73 neo tại #98? [18:20:57Z, 20:18:25Z] (T2-140 §5) —
  thực tế 19:54:12Z **NẰM TRONG dải** (dải CERT58 cũng chứa).
  Chuỗi INSIDE theo dải cơ học kéo dài thành **6 lần liên tiếp
  (#94?, #95?, #96?, #97?, #98?, #99?)**.
- **Dải dự báo #100? — CHUẨN T2 (FULL75, neo tại #99? 19:54:12Z):
  [20:22:26Z, 22:19:21Z]**; biến thể một-gap FULL74: [20:22:19Z,
  22:19:30Z] — chênh ≤9 s, không đổi verdict nào.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 105 file
  *.log có mtime trong mù #60 (0 file repo-1, 105 file
  hidden_files); 2 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả launcher đã biết** (T10-O8, xem §2.7). Quét mở rộng: **8 match
  thô / 8 dòng duy nhất — phân loại hết** (6 dòng test-pass hasEperm
  + 2 dòng launcher). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** —
  **~176,8h** trước probe #60. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 47: 944 dòng / 264 file** (phạm vi 3.172
  file); R7b đối chiếu 969 dòng / 281 file; copies 25 dòng / 17
  file — y hệt lần 43–46 về copies. Đối chiếu chéo 944+25=969=R7b,
  **chênh 0 — lần thứ bốn mươi bảy liên tiếp**. +9 dòng / +3 file so
  với lần 46, giải thích đúng hết bằng diff (xem §2.7). T5-141 quét
  độc lập cùng ngày cho **đúng số đếm 944/264 + 969/281 + 25/17**
  (phạm vi 3.170 — 2 file tạo thêm giữa hai lần quét, 0 hit).
  Đây là đối chiếu bằng **SỐ TỔNG KẾT** theo quyết (h) — file thô
  scan #43 đã mất, chấp nhận mất. Async `.writeFile(`: vẫn đúng
  **2 vị trí helper đã biết** — 0 stray.
- RAM: max biết được trong mù #60 **2.306.048 kB ≈ 2.252,0 MiB
  (T5-140 wait-replay poll 2, 17:56:59Z, đoạn B) — 36,65% guard
  6.144 MiB, THIẾU 3.985.408 kB (~3.892,0 MiB), KHÔNG vượt**;
  corroborate bởi T9-140: 2.295.468 kB (17:57:20Z, −10.580 kB).
  Birefnet KHÔNG chạy bởi T2 (thuộc T9-141 theo quyết (f)). Đoạn A
  max ~1.181 MB; đoạn C max 1.800.944 kB (T9-141, 20:40:47Z).
  MemAvailable lúc đóng phiên T2 chỉ 445.020 kB (21:00:45Z, dưới
  gate A) — balloon phồng lại sau xả thoáng qua.
- **dpkg.log boot #99? — replay XONG: 1.545 dòng / 221 installs / 462
  configure**, lần ghi cuối 19:58:09Z (gstreamer1.0-tools), gói đầu
  libaspell15 19:55:19Z; replay bắt đầu 19:54:43Z (boot +31 s) —
  **KHỚP HOÀN TOÀN hình dạng replay của boot #94?/#96?/#97?**
  (1.545/221/462).
- **preview.tsx 530e10a7** (fix GIỮ VĨNH VIỄN theo quyết parent đợt
  137 §12.3(a)); media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts KHÔNG
  ĐỔI ee80d093. T2 không sửa production file nào.
- **Đợt 141 lúc T2 đóng (~21:01Z 18/11):** T1 + T4 + T6 đã có cờ
  `.done` (T1, T4, T6 — T6 LIMITS đã công bố, chuỗi #57→#99? đã
  chốt); các luồng khác (T5/T7/T8/T9/T10) đang chạy; boot hiện tại
  **#99? 2c0efe57** (không reboot mới trong phiên T2). T2 KHÔNG mở
  Xvfb (không cần) nên không có gì để kill.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 20:44:52Z | boot_id `2c0efe57-5559-4e92-9f8b-aecf1f9866a3`; `who -b` Nov 18 19:54; `uptime -s` **2026-11-18 19:54:12**; btime **1795031652 = 2026-11-18T19:54:12Z**; journal chỉ 1 boot (2c0efe57, first entry 19:54:23Z, last 20:44:36Z lúc kiểm tra). MemAvailable 1.112.988 kB lúc 20:44:52Z. |
| Đo F99? (HTTP Date, 3 server) | 20:45:00–20:45:04Z | example.com Date 20:45:02Z vs local_after 20:45:01Z (+1 s); google.com Date 20:45:03Z vs local_after 20:45:03Z (0 s); cloudflare.com Date 20:45:04Z vs local_after 20:45:03Z (+1 s) → **F99? ≈ −0 s tới −1 s (±~1 s)**. Đo trực tiếp đầu tiên trên boot mới (xem F-141-T2-5: lần thứ hai 3 server không đồng nhất; T6-141 đọc cùng file f99.txt theo quy ước khác cho +2/+2/+1 — xem F-141-T2-5). |
| Đọc dpkg.log bracket #99? | ~20:44Z | **1.545 dòng / 221 installs / 462 configure** — replay XONG (lần ghi cuối 19:58:09Z, lặng ~46' lúc đọc đầu — **chứng minh xong**). Gói đầu libaspell15 install 19:55:19Z; 98 dòng gstreamer; startup packages configure 19:54:43Z (×2) → startup archives unpack 19:55:18Z. Replay bắt đầu **boot +31 s** — đúng mẫu #96? (boot +31 s). **Hình dạng KHỚP baseline 1.545 dòng / 221 installs của #82?/#83?/#84?/#90?/#92?/#94?/#96?/#97?** — cùng một replay configure khô. **T5-141 là chủ quản postboot — bracket chính thức thuộc về T5; số của T2 là đọc độc lập đối chiếu** (POSTBOOT_PASS của T5 ghi pass_at 20:41:02Z poll 0, boot 2c0efe57). **dpkg.log của boot #98? (90392aa5) đã MẤT** (file lúc T2 kiểm chỉ còn log của boot mới): /var/log reset mỗi boot. Bản ghi T5-140 (795/113/230, repair 1 phần — KHÔNG phải replay đầy đủ) là bằng chứng còn lại cho boot đó — cùng mẫu như journal/wtmp. |
| `bash scripts/probe-eperm-v2.sh status` | 20:45:15Z | **DEAD/STALE**, heartbeat n=59, ts 17:40:41Z, boot af558fb5, age **11.074 s** (đúng 3h04'34"); last sample probe #59; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 20:45:15Z | **probe #60, boot=2c0efe57, ok=2 fail=0**, exit 0; dòng `boot changed af558fb5 -> 2c0efe57` (uptime since 2026-11-18 19:54:12) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~20:45:15Z | **ALIVE**, age 0 s, n=60, exit 0 |
| Xác minh boot lại (sau probe) | 20:45:15Z | Cùng boot 2c0efe57, `uptime -s` 19:54:12Z, btime 1795031652. MemAvailable 1.202.148 kB. |
| Xác minh boot lần 3 (lúc đóng phiên) | 21:00:45Z | Cùng boot 2c0efe57 — **KHÔNG reboot trong phiên T2**. MemAvailable 445.020 kB. |

Kiểm lại từ đĩa: log probe v2 **172 dòng** — 169 sau T2-140 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #59 +
dòng `boot changed` + dòng probe #60). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #59 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §3 đã dự báo đúng +3
trước khi đo. Heartbeat **n=60, ts 2026-11-18T20:45:15Z, boot
2c0efe57-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

**Về btime và journal first entry:**
btime thật là **19:54:12Z** (/proc/stat 1795031652 + `uptime -s` +
`who -b`). Journal first entry là **19:54:23Z** — chậm hơn btime
11 s (journald khởi động sau kernel boot ~11 s; đúng mẫu của
#92?/#93?/#94?/#97? — boot #98? là 16 s, xem T2-140 §1). **Marker
round-in-progress.md đợt 141 ghi đúng 19:54:12Z — KHÔNG có mâu
thuẫn BTO lần này** (khác đợt 139, brief ghi 14:03:07Z sai +566 s;
T6-141 §0 cũng xác nhận brief + marker + prereg T2 đều ghi đúng
19:54:12Z).

Nguồn độc lập cho boot #99?: 2 session T2 trong vùng C (xem §2.3)
+ 59 mốc merged gộp trong vùng C (mốc đầu 19:54:43Z — xem §2.4;
mốc cuối 20:45:03Z — probe #60) + 2 exec-log nhắc 2c0efe57 trong
mù (xem §2.3) + **T6-141 chốt chuỗi tương đối #57→#99?** (T6-141
§8). **Số thứ tự #99? ĐÃ XÁC NHẬN theo quy ước (merged + T6)**
— số tuyệt đối vẫn tạm theo thông lệ; giá trị gap không phụ thuộc
số thứ tự.

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #60 (17:40:41Z → 20:45:15Z 18/11, 3h04'34" = 11.074 s)

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #60: `uptime -s` = **2026-11-18 19:54:12Z**,
  boot_id `2c0efe57-5559-4e92-9f8b-aecf1f9866a3` — khác boot của
  probe #59 (af558fb5).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (20:44:52Z): chỉ **1 boot**
  (2c0efe57, first entry 19:54:23Z, last 20:44:36Z). Journal/wtmp
  của các boot trước đã mất theo reboot #99? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #99? — replay XONG, khớp hình dạng boot #94?/#96?/#97?.**
  Đọc lúc ~20:44Z: **1.545 dòng / 221 installs / 462 configure**
  (cùng phương pháp đếm với T2-136/137/138/139/140); lần ghi cuối
  **19:58:09Z** (gstreamer1.0-tools installed), lặng ~46' lúc
  đọc đầu — **chứng minh xong**. Gói đầu libaspell15 install
  19:55:19Z; 98 dòng gstreamer; startup packages configure
  19:54:43Z (×2) → startup archives unpack 19:55:18Z. Replay bắt
  đầu **boot +31 s** — đúng mẫu #96? (boot +31 s). **Hình dạng
  KHỚP baseline 1.545 dòng / 221 installs của
  #82?/#83?/#84?/#90?/#92?/#94?/#96?/#97?** — cùng một replay
  configure khô. **T5-141 là chủ quản postboot — bracket chính
  thức thuộc về T5; số của T2 là đọc độc lập đối chiếu.**
  **dpkg.log của boot #98? (90392aa5) đã MẤT** (file lúc T2 kiểm
  chỉ còn log của boot mới): /var/log reset mỗi boot. Bản ghi
  T5-140 (795/113/230, repair 1 phần — KHÔNG phải replay đầy đủ
  1.545/221/462) là bằng chứng còn lại cho boot đó — cùng mẫu như
  journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**KHÔNG có reboot trong phiên T2 lượt này:** boot 2c0efe57 xác minh
lúc 20:39:59Z (mở lượt), 20:44:52Z (trước probe #60), 20:45:15Z
(sau probe #60), 20:58:55Z, 20:59:38Z và 21:00:45Z (lúc đóng) —
cùng boot_id + btime 19:54:12Z.

### 2.2 Reboot đã chốt trong mù — #98? + #99? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 98? | **17:52:56Z** (chính xác từng giây) | af558fb5 → 90392aa5 | Chốt từ T2-140 §6 (4 nguồn: /proc/stat + `uptime -s` + `who -b` + journal first entry 17:53:12Z) + merged đoạn A mù #60 đóng (tối đa 0 ẩn) + **T6-141 chốt chuỗi tương đối #57→#99?**. **Số thứ tự ĐÃ XÁC NHẬN theo quy ước và được củng cố bởi merged + T6.** |
| 99? | **19:54:12Z** (chính xác từng giây) | 90392aa5 → 2c0efe57 | Chốt từ lượt này: `uptime -s` đọc tươi (20:44:52Z + kiểm lại 20:45:15Z + 21:00:45Z) + btime 1795031652 + `who -b` 19:54 + boot_id 2c0efe57 + journal first entry 19:54:23Z + probe #60 20:45:15Z boot 2c0efe57 ok=2 fail=0 + merged đoạn B mù #60 đóng (tối đa 0 ẩn) + **T6-141 chốt chuỗi tương đối #57→#99?**. **Số thứ tự ĐÃ XÁC NHẬN theo quy ước và được củng cố bởi merged + T6.** |

**Clock:** F99? ≈ **−0 s tới −1 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` 3 server: example.com
+1 s, google.com 0 s, cloudflare.com +1 s (độ chi tiết 1 s của HTTP
Date). **F99? là lần đo trực tiếp đầu tiên trên boot #99?** — không
dùng cận hai lần đo. F98? ≈ −1 s (±~1 s, đã đo đợt 140). F97? ≈ −1 s
tới −2 s (đã đo đợt 140). Ba đầu chuỗi đo được (F97?, F98?, F99?)
đều ≈ −0 s tới −2 s — đồng hồ local ổn định ở mức chậm ~0–2 s ở cả
ba đầu; xem §2.5 về cách caveat này được xử lý. F99? là lần thứ hai
3 server không đồng nhất (xem F-141-T2-5).

**CẬN NHẢY CLOCK TẠI REBOOT:**
- **2 nhân chứng nhảy tại #98?:** **2 session** sinh trước btime
  có mtime sau btime (quét 276 exec-log):
  - proc_559bda65fb2a.log, birth 17:39:13Z, mtime **17:53:15Z**
    (btime +19 s) — **session sampler của T5-140** (vòng 1 bắt đầu
    17:39:13Z; mẫu cuối vòng 1 mang timestamp 17:53:15Z — cùng lớp
    F-139-T9-3: boot của mẫu chưa rõ, xếp theo quỹ đạo giá trị).
  - proc_f404b4f4a34f.log, birth 17:44:17Z, mtime **17:53:07Z**
    (btime +11 s) — **session của T8-140**.
  Đồng hồ boot cũ chạy nhanh — cùng lớp F-137-T8-7 / F-138-T8-6 /
  F-138-T9-3 / F-139-T8-3 / F-140-T4-1. Mức nhảy: **chắc chắn ≥ +11 s**
  (session T8), **tới +30 s có thể** (last-seen của T4/T5 17:53:26Z
  theo đồng hồ cũ — timestamp trong nội dung log, không phải mtime
  file).
- **0 nhân chứng nhảy tại #99?:** không session nào sinh trước
  btime 19:54:12Z mà mtime sau btime.
- Cận session: **|X98?| < 95 s** (session muộn nhất 17:51:21Z —
  session sinh 17:41:21Z, mtime 17:51:21Z; session sớm nhất sau btime
  17:53:24Z). **|X99?| < 576 s** (session muộn nhất 19:44:36Z;
  session sớm nhất sau btime 20:37:13Z — session của agent đợt 141).
- **Ranh giới (merged 4 phạm vi):** 0 file trong
  [btime −10 s, btime] và 0 file trong (btime +0 s, +10 s] cho CẢ
  HAI reboot #98? và #99? — ranh giới sạch nhất từ trước tới nay
  (mù #59 còn 11 file trong (btime +0 s, +10 s]).
  Các file T8/T5 17:53:07/15/19/24/26Z là file của harness chạy trên
  boot cũ với đồng hồ chạy nhanh (ghi theo đồng hồ đọc) — theo
  phân đoạn đồng hồ chúng rơi vào đoạn B (sau btime), KHÔNG phải
  bằng chứng boot mới đã ghi đĩa trước 17:53:26Z — dpkg replay của
  boot mới chỉ bắt đầu 17:53:47Z (2 dòng startup configure).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #97?→#98? = **[7.089 s, 7.109 s] (1h58'19" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn A mù #60 đóng, tối đa 0 ẩn; đoạn B mù
  #59 đóng bằng uptime trong logic gộp — xem §2.3). **CERT 58→60 /
  FULL 73→75** (xem §2.5).
- Gap #98?→#99? = **[7.266 s, 7.286 s] (2h01'16" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn B mù #60 đóng, tối đa 0 ẩn). **CERT
  58→60 / FULL 73→75** (cùng với gap trên — xem §2.5).
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
- **Dải cho #98? (chuẩn FULL72, quyết (f) đợt 139):
  [16:22:31Z, 18:20:15Z]** — thực tế 17:52:56Z **NẰM TRONG dải**.
  Biến thể FULL73: [16:22:37Z, 18:20:05Z] (T2-140; code lần này cho
  [16:22:38Z, 18:20:06Z] — lệch 1 s do làm tròn nội suy p10, cùng
  lớp F-140-T2-1; verdict không đổi — xem F-141-T2-8).
  Chuỗi INSIDE theo dải cơ học kéo dài thành 5 lần liên tiếp (#94?,
  #95?, #96?, #97?, #98?).
- **Dải cho #99? (tạm FULL73, T2-140 §5): [18:20:57Z, 20:18:25Z]**
  — thực tế 19:54:12Z **NẰM TRONG dải** (dải CERT58 [18:20:17Z,
  20:10:36Z] cũng chứa). Chuỗi INSIDE kéo dài thành **6 lần liên
  tiếp (#94?, #95?, #96?, #97?, #98?, #99?)**.
- **Dải CHUẨN cho #100? (FULL75, neo tại #99? 19:54:12Z):
  [20:22:26Z, 22:19:21Z]**; biến thể một-gap FULL74: [20:22:19Z,
  22:19:30Z] — chênh ≤9 s, không đổi verdict nào.

**Khung chết các boot (từ merged — xem §2.4):**
- **Khung chết #97? (ứng viên MERGED — T2 ĐỀ XUẤT làm chuẩn mới):
  (17:52:10Z, 17:52:56Z] (46 s)** — mốc muộn nhất là
  round140-t2/blind59-gaps.txt 17:52:10Z (file gaps của T2-140).
  Ba khung không giao nhau theo đồng hồ đọc: khung T4/T5
  (17:53:26Z, 17:54:22Z] (56 s) và khung T8 (17:53:26Z, 17:54:02Z]
  (36 s) là cách dựng KHÁC (quan sát trực tiếp, không neo btime)
  và mốc dưới của chúng là nhân chứng nhảy (+30 s theo đồng hồ cũ
  — theo giờ thực mốc đó ngồi tại ~btime). **T2 đề xuất 46 s làm
  chuẩn mới; parent quyết khi đóng sổ** (quyết (d) đợt 140). Caveat
  đồng hồ: khung 46 s là khung theo đồng hồ đọc; nhân chứng nhảy
  +11 s / +30 s cho thấy đồng hồ boot cũ chạy nhanh — khung thật
  theo giờ thực có thể dịch chuyển (xem F-141-T2-6). Cùng caveat
  với khung #96? 21 s (parent đợt 140 §12.2(c) XÁC NHẬN 21 s làm
  chuẩn mới với cùng caveat).
- **Khung chết #98? (ứng viên MERGED): (19:46:47Z, 19:54:12Z]
  (445 s)** — mốc muộn nhất là log O8 + cooldown của T10-140
  (19:46:47Z). Rộng vì máy yên sau O8 của T10 (19:46:47Z) tới lúc
  reboot; không có session nào bắc qua đuôi, không có mốc 5th-scope
  nào trong đuôi. T2 báo khung merged này; **chưa có khung quan sát
  thay thế nào từ T4/T5/T8-140 lúc T2 đóng — T2 không tự bịa khung
  quan sát**. Parent quyết khi đóng sổ (khung này không nằm trong
  quyết (d) đợt 140 — quyết đó chỉ giao khung #97?).
- **Khung chết #96?: (15:54:16Z, 15:54:37Z] (21 s) — CHUẨN PARENT
  MỚI** (§12.2(c) đợt 140). Khung T9 35 s giữ làm biên ngoài; khung
  T8 (15:54:42Z, 15:55:24Z] là cách dựng khác.
- **Khung chết #95?: (13:47:01Z, 13:53:41Z] (400 s) — GIỮ NGUYÊN**
  (T6-140 quét lại: 3 file, cùng một sự kiện; không có bằng chứng
  mới). Khung chết #94? GIỮ chuẩn (11:52:12Z, 11:52:20Z] (8 s) theo
  quyết (b) đợt 139. Khung chết #93? GIỮ chuẩn (09:35:47Z,
  09:36:01Z] (14 s).

**Chuỗi gộp (định nghĩa duy nhất từ đợt 134):** reboot #97?→#98?
là **sự kiện thứ 22** (giữa lượt 140, theo T10-140; parent đã chấp
nhận §12.2(a) đợt 140); reboot #98?→#99? là **sự kiện thứ 23**
(trong lúc T10-140 đóng sổ, theo T10-140 + T6-141 §8.0). **Số thứ
tự #98? và #99? ĐÃ XÁC NHẬN theo quy ước** (merged lần này +
T6-141 chốt chuỗi tương đối #57→#99?); chuỗi tương đối do T6-141
chốt, số tuyệt đối vẫn tạm theo thông lệ; giá trị gap không phụ thuộc
số thứ tự.

### 2.3 Hoạt động trong khoảng mù — ĐÓNG HOÀN TOÀN (merged 4 phạm vi)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **10 file** +
hidden_files **318 file**; **328 file, 323 mốc float phân biệt /
221 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3/T2-133 §2.3/
T2-134 §2.3/T2-135 §2.3/T2-136 §2.3/T2-137 §2.3/T2-138 §2.3/
T2-139 §2.3/T2-140 §2.3 — "mốc" là mtime float phân biệt, không phải
giây tròn).
Ngoài hai cây: **107 file** (agents — exec-log/tool-output chiếm đa
số + repo-1-push paths; chi tiết xem blind60-outside.txt);
**/tmp: 27 file** trong mù #60 (xem blind60-tmp.txt + caveat §2.4
— cả 27 đều trong đoạn C).
Gộp cả 4 phạm vi: **287 mốc giây phân biệt**. Chia mù làm ba
đoạn bởi 2 reboot:

- **Đoạn A: 17:40:41Z → 17:52:56Z (12'15" = 735 s, boot #97?
  af558fb5) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **65 mốc** (hai cây), lỗ lớn nhất hai cây **93 s**
    (17:50:33Z → 17:52:06Z); lỗ lớn thứ hai 79 s; lỗ lớn thứ ba
    55 s. Mốc đầu 17:40:41Z (head 0 s — chính probe #59); mốc
    cuối hai cây **17:52:10Z** (đuôi hai cây **46 s**).
    **12 session** chạm đoạn A; **12 session** chạm A-tail
    (A-tail = toàn đoạn A vì không có cửa sổ sàn).
  - **Merged 4 phạm vi: 53 mốc, lỗ lớn nhất 79 s**
    (17:45:51Z → 17:47:10Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 17:40:43Z (head 2 s), mốc cuối gộp **17:52:10Z**
    (đuôi 46 s — blind59-gaps.txt của T2-140). Lỗ lớn thứ hai
    gộp **48 s** (17:50:33Z → 17:51:21Z) và lỗ lớn thứ ba
    **46 s** (17:52:10Z → 17:52:56Z — chính là đuôi tới btime).
    **Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): 2 file**
    trong đoạn A (memory bank reflections.md + world.md,
    17:50:15Z — xem §2.4).
  - **CAVEAT ĐOẠN NGẮN (F-141-T2-7, đã ghi trong prereg TRƯỚC khi
    đo):** đoạn A chỉ dài 735 s < sàn 1.147 s nên luật lỗ cho
    floor(735/1147)=0 NGAY CẢ KHI KHÔNG CÓ MỐC NÀO — verdict đóng
    cơ học là yếu theo luật thuần túy. **Bằng chứng thực chất là
    mật độ mốc: 53 mốc merged trong 735 s (trung bình 1 mốc / 14 s),
    lỗ lớn nhất thực tế chỉ 79 s (7% sàn).** T2 báo cả hai để parent
    tự xét — verdict đóng đứng trên mật độ, không chỉ trên luật cơ học.
  - Hoạt động trên af558fb5: các luồng đợt 140 làm việc tới
    ~17:53Z theo đồng hồ cũ (T4 attempt1 lượt yên #17 tới pass 11
    kẹt; T5 sampler tới 17:53:15Z; T8 waiter/watch; T10 chờ cờ;
    T2-140 chạy gaps.py tới 17:52:10Z) — máy KHÔNG yên trong đoạn A.
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn (merged + hai cây
    đồng thuận + mật độ dày).**
- **Đoạn B: 17:52:56Z → 19:54:12Z (2h01'16" = 7.276 s, boot #98?
  90392aa5) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **185 mốc** (hai cây), lỗ lớn nhất hai cây **444 s**
    (19:46:47Z → 19:54:12Z — đuôi tới btime); lỗ lớn thứ hai 181 s;
    lỗ lớn thứ ba 181 s. Mốc đầu 17:53:15Z (head 19 s — hoạt động
    boot cũ theo đồng hồ nhanh); mốc cuối hai cây **19:46:47Z**
    (đuôi hai cây **445 s**).
  - **Merged 4 phạm vi: 174 mốc, lỗ lớn nhất 445 s**
    (19:46:47Z → 19:54:12Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 17:53:07Z (head 11 s), mốc cuối gộp **19:46:47Z**
    (đuôi 445 s — log O8 + cooldown của T10-140). Lỗ lớn thứ hai
    gộp **181 s** (19:24:31Z → 19:27:32Z) và lỗ lớn thứ ba
    **181 s** (19:21:30Z → 19:24:31Z) — **cả hai đều NHỎ HƠN
    NHIỀU so với sàn**.
    **Phạm vi thứ 5: 1 file** trong đoạn B (daily log 18/11,
    17:59:05Z — xem §2.4).
  - Cửa sổ sàn [B-lo=18:12:03Z, B-hi=19:35:05Z] (rộng 4.982 s):
    **6 session bắc qua cắt B-lo; 1 session bắc qua cắt B-hi** —
    nhưng luật lỗ đã đủ để đóng (lỗ lớn nhất chỉ 445 s = 39%
    sàn); **2 session chạm B-tail** — mốc merged trong B-tail dày
    tới 19:46:47Z rồi yên 445 s tới reboot (T10-140 đã đóng O8
    19:46:47Z; đợt 140 đóng sổ xong 19:57:15Z đã sang đoạn C).
  - Hoạt động trên 90392aa5: các luồng đợt 140 làm việc dày tới
    ~19:46Z (T5 --repair + postboot PASS 18:17:07Z; T4 poller-b 124
    poll tới 19:29:47Z; T7 kiểm lần 3 19:30Z; T8 waiter tới
    19:30:56Z; T9 sampler vòng 2 tới 19:11:26Z; T10 suite/O8
    19:39–19:46Z) — máy KHÔNG yên trong đoạn B trừ đuôi 445 s.
  - **Kết luận đoạn B: ĐÓNG — tối đa 0 ẩn (merged + hai cây
    đồng thuận).**
- **Đoạn C: 19:54:12Z → 20:45:15Z (51'03" = 3.063 s, boot #99?
  2c0efe57) — ĐÓNG bằng đo uptime trực tiếp + luật lỗ:**
  - **`uptime -s` lúc 20:44:52Z = 19:54:12Z** chứng minh máy up
    liên tục từ #99? tới lúc đo; probe #60 20:45:15Z đọc boot_id
    2c0efe57 tươi — cùng boot_id với boot bắt đầu 19:54:12Z;
    kiểm lại 20:45:15Z + 20:58:55Z + 20:59:38Z + 21:00:45Z cùng boot.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C, T2-132 §2.3 đoạn C, T2-133 §2.3 đoạn B,
    T2-134 §2.3 đoạn C, T2-135 §2.3 đoạn G, T2-136 §2.3 đoạn C
    mù #55, T2-137 §2.3 đoạn B mù #56, T2-138 §2.3 đoạn B mù #57,
    T2-139 §2.3 đoạn C mù #58, T2-140 §2.3 đoạn B mù #59.)
  - **73 mốc** (hai cây), lỗ lớn nhất **1.889 s** (20:05:18Z →
    20:36:47Z — khoảng yên sau khi T10-140 đóng aggregate tới khi
    đợt 141 mở); mốc cuối **20:45:03Z** (đuôi hai cây **12 s**).
  - **Merged 4 phạm vi: 59 mốc, lỗ lớn nhất 1.849 s**
    (20:05:23Z → 20:36:12Z), floor=1 theo luật lỗ thuần túy —
    **nhưng uptime trực tiếp loại bỏ khả năng reboot ẩn trong
    lỗ** (máy up liên tục từ 19:54:12Z tới lúc đo 20:44:52Z;
    journal chỉ 1 boot). Mốc đầu gộp 19:54:43Z (head 31 s — dpkg
    startup configure), mốc cuối gộp 20:45:03Z (đuôi 12 s).
  - Đoạn C dài hơn 2×sàn 2.294 s nên có cửa sổ sàn rộng
    [C-lo=20:13:19Z, C-hi=20:26:08Z]; 0 session bắc qua cắt C-lo,
    **0 session bắc qua cắt C-hi** — uptime là closer, luật lỗ chỉ
    là kiểm chứng thêm. Khoảng yên 20:05:23Z → 20:36:12Z là lúc
    máy thật sự không có tiến trình nào ghi đĩa (T10-140 đã đóng
    aggregate 20:05:01Z; đợt 141 mở 20:35:51Z; mốc đầu sau khoảng
    yên là /tmp jarvis-tool-output 20:36:12Z).
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #60 ĐÓNG HOÀN TOÀN.** Đoạn A đóng
(luật lỗ + mật độ dày, tối đa 0 ẩn), đoạn B đóng (luật lỗ, tối đa
0 ẩn), đoạn C đóng (uptime). 2 reboot đã chốt (#98? 17:52:56Z +
#99? 19:54:12Z — chính xác từng giây trên đĩa, số đã xác nhận
theo quy ước + T6) + **tối đa 0 ẩn**. Chuỗi mù đóng hoàn toàn:
#50 đóng, #51 hở, #52 đóng, #53 hở, #54 đóng, #55 hở, #56 hở,
**#57 đóng, #58 đóng, #59 đóng, #60 đóng** — mù đóng hoàn toàn thứ
tư liên tiếp, lần đầu tiên chuỗi 4 mù đóng liên tiếp.

Ngoài hai cây: **107 file** có mtime trong mù #60 (agents —
exec-log/tool-output chiếm đa số + repo-1-push paths;
chi tiết xem blind60-outside.txt); **/tmp: 27 file** trong mù #60
(xem blind60-tmp.txt + caveat §2.4 — cả 27 đều trong đoạn C).
Boot_id nhắc trong exec-log sinh/viết trong mù: 541524e2 2 file,
af558fb5 9 file, 90392aa5 32 file, 2c0efe57 2 file.

### 2.4 Gộp 4 phạm vi + 4 phát hiện mới (phương pháp nối tiếp T2-140 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind60-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 53 mốc, lỗ lớn nhất **79 s** (17:45:51Z →
  17:47:10Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**. Lỗ lớn thứ hai
  **48 s** (17:50:33Z → 17:51:21Z); lỗ lớn thứ ba **46 s**
  (17:52:10Z → 17:52:56Z — đuôi tới btime) — cả ba đều ≪ sàn.
- Đoạn B gộp: 174 mốc, lỗ lớn nhất **445 s** (19:46:47Z →
  19:54:12Z — đuôi tới btime), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
  Lỗ lớn thứ hai **181 s**; lỗ lớn thứ ba **181 s** — cả hai
  cũng nhỏ hơn nhiều so với sàn.
- Đoạn C gộp: 59 mốc, lỗ lớn nhất **1.849 s** (20:05:23Z →
  20:36:12Z), floor=1 theo luật lỗ thuần túy — **nhưng uptime
  trực tiếp đóng đoạn C** (xem §2.3). Lỗ lớn thứ hai 321 s;
  lỗ lớn thứ ba 125 s.
- Tổng gộp 287 mốc giây. Không có file nào trong
  `~/workspace/goals` ngoài hidden_files có mtime trong mù (kiểm
  bằng find riêng — vùng duy nhất hai lần quét chính không phủ,
  đã kiểm bổ sung, 0 file).

**Phát hiện 1 — /tmp CÓ 27 file trong mù #60, TẤT CẢ trong đoạn
C (mới, nối tiếp phát hiện 1 của T2-140):** /tmp trên VM này là
tmpfs — reboot #98? (17:52:56Z) xóa mọi file /tmp viết trước đó,
và reboot #99? (19:54:12Z) xóa tiếp mọi file /tmp viết trong đoạn
B. Kiểm trực tiếp từ blind60-tmp.txt: **0 file có mtime < 19:54:12Z
(đoạn A + B), 27 file có mtime ≥ 19:54:12Z (đoạn C)**; file sớm nhất
20:05:23Z (r139-entry.txt), muộn nhất 20:42:59Z (node-compile-cache).
27 mốc giây /tmp của merged đều nằm trong đoạn C. **Verdict
không đổi:** đoạn A/B đóng không phụ thuộc /tmp (A/B đóng vì lỗ
merged 79 s / 445 s, C đóng nhờ uptime). Ghi rõ để luồng sau khỏi
hiểu "27 file /tmp" là bằng chứng cho cả mù — chúng chỉ phủ đoạn C.
Trong A-tail: **0 file**; trong B-tail: **0 file**; trong C-tail:
**26 file**.

**Phát hiện 2 — Đoạn A chỉ 735 s: luật lỗ đóng cơ học, mật độ mới
là bằng chứng thực (mới, đã dự báo trong prereg §1):** đoạn A ngắn
hơn sàn 1.147 s nên floor(735/1147)=0 ngay cả khi không có mốc nào
— verdict đóng cơ học là yếu. Bằng chứng thực chất: **53 mốc merged
trong 735 s (1 mốc / ~14 s), lỗ lớn nhất thực tế chỉ 79 s (7% sàn),
12 session chạm đoạn A** — máy hoạt động liên tục (T4 attempt1,
T5 sampler, T8 waiter, T10 chờ cờ, T2-140 chạy gaps.py). T2 báo cả
hai: verdict cơ học + mật độ thực tế (xem F-141-T2-7).

**Phát hiện 3 — Mốc cuối đoạn A 17:52:10Z hẹp khung chết #97?
xuống 46 s (mới):** round140-t2/blind59-gaps.txt 17:52:10Z là file
gaps của T2-140 (chạy lúc 17:52:10Z, trước reboot 46 s). Mốc này
là mốc merged muộn nhất trước btime #98? — khung chết #97? thành
(17:52:10Z, 17:52:56Z] = 46 s theo nguồn của T2 (merged). T2 đề
xuất 46 s làm chuẩn mới; parent quyết khi đóng sổ (cùng mẫu khung
#96? 21 s vs 35 s). Caveat đồng hồ xem F-141-T2-6.

**Phát hiện 4 — Phạm vi thứ 5 không lấp đuôi khung chết nào (mới,
kiểm theo bài học F-136-T2-8):** quét ~/memory + ~/dreams +
~/side-chats cho cả mù #60: 4 file (2 file 17:50:15Z — memory bank
reflections.md + world.md, đoạn A; 1 file 17:59:05Z — daily log
18/11, đoạn B; 1 file 20:06:44Z — daily log 19/11, đoạn C).
**0 mốc trong (17:52:10Z, 17:52:56Z]** (đuôi khung chết #97?) và
**0 mốc trong (19:46:47Z, 19:54:12Z]** (đuôi khung chết #98?) —
verdict khung không đổi.

### 2.5 Phân phối gap — CERT n=58 → n=60 / FULL n=73 → n=75 (HAI gap mới chứng nhận)

**Gap mới (xem blind60-gaps.py + blind60-gaps.txt):**
- **Gap #97?→#98? = [7.089 s, 7.109 s] (1h58'19" ±10 s) CHỨNG
  NHẬN DẠNG KHOẢNG** — đoạn A mù #60 đóng (merged, tối đa 0 ẩn)
  + đoạn B mù #59 đóng bằng uptime trong logic gộp (xem §2.3).
  **CERT/FULL tính gap này (mid 7.099 s).** Caveat: F98? ≈ −1 s
  đo trực tiếp đợt 140; F97? ≈ −1 s tới −2 s đo trực tiếp đợt 140 —
  btime gaps là RTC nên không bị ảnh hưởng bởi drift đồng hồ guest.
- **Gap #98?→#99? = [7.266 s, 7.286 s] (2h01'16" ±10 s) CHỨNG
  NHẬN DẠNG KHOẢNG** — đoạn B mù #60 đóng (merged, tối đa 0 ẩn;
  đoạn B phủ đúng btime #98? → btime #99?). **CERT/FULL tính gap
  này (mid 7.276 s).** Caveat: F98? ≈ −1 s; F99? ≈ −0 s tới −1 s
  đo trực tiếp lượt này (xem F-141-T2-5).
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

**Cross-check tái hiện T2(140) 100%:** chạy
blind60-gaps.py verbatim cho lại đúng CERT n=58 / FULL n=73 của
T2 đợt 140 (xem blind60-gaps.txt: CERT58 mean 1h34'28" median
1h48'59" p10 0h27'21" p90 2h17'40" sd 0h45'27" min 0h00'55" max
3h14'08"; FULL73 mean 1h41'03" median 1h50'39" p10 0h28'01" p90
2h25'29" sd 0h56'05" min 0h00'55" max 5h43'18"; in 90–150' = 37,
<60' = 17, >180' = 6, >240' = 2 — khớp T2-140 §2.5 từng số, và
chuỗi exec lồng nhau tái hiện cả CERT57/FULL72 của T2-139).
Hai gap mới vào nên CERT 58→60 / FULL 73→75.

- **CERT n=60 (mới):** mean 1h35'19" median 1h49'58" p10
  0h27'38" p90 2h16'46" sd 0h44'54" min 0h00'55" max 3h14'08".
- **FULL n=75 (mới):** mean 1h41'33" median 1h53'00" p10
  0h28'14" p90 2h25'09" sd 0h55'24" min 0h00'55" max 5h43'18";
  in 90–150' = 39, <60' = 17, >180' = 6, >240' = 2.
- Độ nhạy LO/HI (gap mới ở cận dưới/trên của khoảng):
  CERT60-LO mean 1h35'18" vs CERT60-HI mean 1h35'19" (dịch 1 s —
  nhỏ, ghi rõ); FULL75-LO = FULL75-HI ở mọi thống kê hiển thị.
- **Dải chứng nhận [0h00'55", 3h14'08"] — không đổi** (hai gap mới
  7.099 s / 7.276 s nằm trong dải).
- **Biến thể một-gap (chỉ #97?→#98?, nếu parent giữ #98?→#99?):
  CERT59 mean 1h34'52" median 1h49'17" p10 0h27'29" p90 2h17'13"
  sd 0h45'09"; FULL74 mean 1h41'17" median 1h51'50" p10 0h28'08"
  p90 2h25'19" sd 0h55'44".**
- **Dải CHUẨN cho #100? (FULL75, neo tại #99? 19:54:12Z):
  [20:22:26Z, 22:19:21Z]**. Biến thể một-gap FULL74: [20:22:19Z,
  22:19:30Z] (chênh ≤9 s).
- **Dải cho #98? — VERDICT: INSIDE.** Dải chuẩn FULL72 (quyết (f)
  đợt 139) [16:22:31Z, 18:20:15Z]: thực tế 17:52:56Z **NẰM TRONG
  dải**. Biến thể FULL73 [16:22:37Z, 18:20:05Z] cũng chứa (code
  lần này cho [16:22:38Z, 18:20:06Z] — lệch 1 s do làm tròn nội
  suy p10, cùng lớp F-140-T2-1; xem F-141-T2-8).
- **Dải cho #99? — VERDICT: INSIDE.** Dải tạm FULL73 (T2-140 §5)
  [18:20:57Z, 20:18:25Z]: thực tế 19:54:12Z **NẰM TRONG dải**
  (dải CERT58 [18:20:17Z, 20:10:36Z] cũng chứa).
  Chuỗi INSIDE theo dải cơ học kéo dài thành **6 lần liên tiếp
  (#94?, #95?, #96?, #97?, #98?, #99?)**.
- **Tốc độ reboot (đồng hồ ghi nhận):** 99 / 191,60 h = **1 reboot
  mỗi 116,1 phút** (từ #1 2026-11-10T20:18:10Z tới #99?
  2026-11-18T19:54:12Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 103 / 191,60 h = **1 mỗi 111,6 phút**; +3 nữa
  (mù #53 đoạn B tối đa 3) → 106 / 191,60 h = **1 mỗi 108,5
  phút**; +2 nữa (mù #55 đoạn B tối đa 2, quy ước) → 108 /
  191,60 h = **1 mỗi 106,5 phút**; +1 nữa (mù #56 đoạn A tối đa 1,
  quy ước) → 109 / 191,60 h = **1 mỗi 105,5 phút**; **+0 nữa
  (mù #57 ĐÓNG, tối đa 0) → 109 / 191,60 h = 1 mỗi 105,5 phút**;
  **+0 nữa (mù #58 ĐÓNG, tối đa 0) → 109 / 191,60 h = 1 mỗi
  105,5 phút**; **+0 nữa (mù #59 ĐÓNG, tối đa 0) → 109 / 191,60 h
  = 1 mỗi 105,5 phút**; **+0 nữa (mù #60 đoạn A ĐÓNG, tối đa 0)
  → 109 / 191,60 h = 1 mỗi 105,5 phút**; **+0 nữa (mù #60 đoạn B
  ĐÓNG, tối đa 0) → 109 / 191,60 h = 1 mỗi 105,5 phút** (đọc cộng
  dồn: mù #55 đoạn B tối đa 3 → 110 / 191,60 h = **1 mỗi 104,5
  phút**; mù #56 đoạn A tối đa 3 → 111 / 191,60 h = **1 mỗi
  103,6 phút**). Chưa tính ẩn danh nghĩa tối đa của mù #35 (+24),
  mù #37 (+29), mù #38 đoạn G (+6), mù #39 đoạn J (+2), mù #40
  đoạn B (+1), mù #43 đoạn B (+3), mù #44 đoạn D (+5), mù #45
  đoạn G1 (+4), mù #46 đoạn A (+4), mù #48 đoạn A (+2), mù #49
  đoạn B (+1), mù #51 đoạn B (+3).
  Mù #50: **+0** (đóng hoàn toàn). Mù #52: **+0** (đóng hoàn
  toàn). Mù #53: **+3** (đoạn B mở — recheck đợt 137 xác nhận).
  Mù #54: **+0** (đóng hoàn toàn). Mù #55: **+2 (quy ước) / +3
  (cộng dồn)**. Mù #56: **+1 (quy ước) / +3 (cộng dồn)**.
  Mù #57: **+0 (đóng hoàn toàn)**. Mù #58: **+0 (đóng hoàn
  toàn)**. Mù #59: **+0 (đóng hoàn toàn)**. **Mù #60: +0 (đóng
  hoàn toàn — cả đoạn A và đoạn B) — mới.**

### 2.6 Mù #56 A + mù #55 B + mù #53 B + mù #51 B + mù #49 B: KHÔNG kiểm lại đợt này

- **Mù #56 A: KHÔNG kiểm lại đợt này.** Đã recheck đợt 138 (0 mốc
  mới trong lỗ, 9 hit đều là file biên phải đã biết); hồ sơ đã ổn
  định; brief đợt 141 không giao recheck; T2 đợt này không thấy
  bằng chứng mới nào về mù #56 A. Gap #92?→#93? = 9.473 s GIỮ
  SPAN.
- **Mù #55 B: KHÔNG kiểm lại đợt này.** Đã recheck đợt 138 (0 mốc
  mới); hồ sơ đã ổn định; brief đợt 141 không giao recheck; T2 đợt
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

### 2.7 Quét writeFileSync lần thứ 47 — chênh 0 (lần thứ 47 liên tiếp) — ĐỐI CHIẾU BẰNG SỐ TỔNG KẾT

- Chạy script `scan-wfs.sh` (bản T2 trong round141-t2, đã đổi OUT
  sang round141-t2) **20:52:11Z → 20:52:51Z 18/11 (40 s, có
  SCAN-END)**. **Scan chạy trên boot #99?** — kết quả vẫn hợp lệ
  vì scan chỉ đếm code hiện tại trên đĩa, không phụ thuộc boot hay
  giờ mù.
- NEWSTD: **944 dòng / 264 file** (phạm vi 3.172 file); R7b đối
  chiếu: **969 dòng / 281 file** (phạm vi 12.565 file); copies:
  **25 dòng / 17 file** — y hệt lần 43, 44, 45 và 46 về copies. Đối
  chiếu chéo: 944+25=969=R7b, **chênh 0**.
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
  chiếu chéo được) và số #46 trong LIMITS T2-140 §2.7 (**935/261**,
  R7b **960/278**, copies **25/17** — file thô #46 còn nguyên trong
  round140-t2, T2 đối chiếu chéo được). Chuỗi: #43 907/253 → #44
  915/256 (+8/+3) → #45 926/259 (+11/+3) → #46 935/261 (+9/+2) →
  **#47 944/264 (+9/+3)**.
- **+9 dòng / +3 file so với lần 46** (935/261 → 944/264), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + diff
  từng dòng — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND140_T2_EPERM_LIMITS.md | +7 (0 → 7) | sau scan #46 | Tài liệu T2 đợt 140 (nhắc `writeFileSync` 7 lần); viết SAU scan lần 46 (scan #46 chạy 17:50:03Z; T2-140 LIMITS viết xong ~17:58Z) nên lần này mới vào |
  | docs/PHASE9_ROUND140_LIMITS.md | +1 (0 → 1) | sau scan #46 | LIMITS gộp đợt 140 (nhắc `writeFileSync` 1 lần); viết SAU scan lần 46 (aggregate đóng 19:57Z, parent §12.2 thêm ~20:05Z) nên lần này mới vào |
  | docs/PHASE9_ROUND140_T5_INFRA_LIMITS.md | +1 (0 → 1) | sau scan #46 | LIMITS T5 đợt 140 (nhắc `writeFileSync` 1 lần); viết SAU scan lần 46 (T5 xong 18:38Z) nên lần này mới vào |
  7+1+1 = 9 dòng. ✓ (Phạm vi: 3.172 = 3.164 + 8 net (**8 file
  mới, 0 file mất**: kiểm bằng diff danh sách file — 8 file mới
  gồm 6 LIMITS đợt 140 (aggregate + T2/T4/T5/T7/T8) + 2 LIMITS đợt
  141 đã viết trước scan (T1/T4); trong 8 file mới có 3 file mang
  hit (+3 file) là T2-140 + gộp 140 + T5-140; 5 file còn lại không
  mang hit. Lưu ý: T9-140 LIMITS đã có trong phạm vi #46 (T2-140
  §2.7 đã ghi — file tạo nháp trước scan #46, viết xong 19:18Z,
  mang 0 mention nên không đổi số đếm). Copies y hệt lần 46
  (diff 0 dòng).)
- **Đối chiếu chéo với T5-141 (quét độc lập):** T5-141 chạy
  scan-wfs-t5.sh lúc **20:42:11Z → 20:42:33Z** (trước T2 10 phút)
  cho **đúng số đếm 944/264 + 969/281 + 25/17** (phạm vi 3.170 —
  2 file tạo thêm giữa hai lần quét, 0 hit). Hai lần quét độc lập
  khớp hoàn toàn về số đếm.
- **Kết luận: 47 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #60. Verdict
  "chênh 0 lần 47" đứng trên đối chiếu bằng số tổng kết (#43) +
  file thô (#44, #45, #46, #47) + hai lần quét độc lập #47 (T2 vs
  T5 khớp hoàn toàn) — xem aggregate đợt 138 §10.1(f).

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
  né EPERM trong mù #60.

## 3. RAM trong mù #60 — max 2.252,0 MiB (36,65% guard, KHÔNG vượt), birefnet KHÔNG chạy bởi T2

- **5 mẫu MemAvailable trực tiếp của lượt (đoạn C + lúc đóng trên #99?):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 20:39:59Z | **456.508 kB** (446 MB) | Lúc mở phiên (boot #99?, đoạn C) — dưới gate A 1.024 MB, balloon vẫn kẹt sau reboot #99? |
  | 20:44:52Z | **1.112.988 kB** (1.087 MB) | Lúc xác minh boot (boot #99?, đoạn C) — trên gate A (xả thoáng qua sau boot) |
  | 20:45:15Z | **1.202.148 kB** (1.174 MB) | Sau probe #60 (boot #99?, đoạn C) — trên gate A |
  | 20:59:04Z | **592.964 kB** (579 MB) | Lúc kiểm T6-141 (boot #99?, đoạn C) — balloon phồng lại, RAM về dưới gate A |
  | 21:00:45Z | **445.020 kB** (435 MB) | Lúc đóng phiên T2 (boot #99?, đoạn C) — NGOÀI mù #60 (mù đóng 20:45:15Z); balloon phồng lại, RAM về dưới gate A |
- **Max RAM biết được TRONG mù #60: 2.306.048 kB ≈ 2.252,0 MiB
  (T5-140 wait-replay poll 2, 17:56:59Z, đoạn B, `ram_avail=2252MB`
  — `free -m` nên đơn vị là MiB) — 36,65% guard 6.144 MiB, THIẾU
  3.985.408 kB (~3.892,0 MiB), KHÔNG VƯỢT.** Nguồn:
  T5-140 LIMITS §4 (wait-replay boot 90392aa5 poll 2, 17:56:59Z).
  Corroboration: T9-140 sampler vòng 2 max **2.295.468 kB =
  2.241,7 MiB lúc 17:57:20Z** (21 s sau, −10.580 kB — hai sampler
  độc lập đỉnh trong cùng cửa sổ ~17:57Z). Đoạn A max theo ram-max:
  **1.181 MB lúc 17:48:03Z** (T5 sampler boot 1 / T4 poll — xem
  ram-max.txt); T9-140 vòng 1 max 1.173.700 kB lúc 17:47:14Z
  (corroborate, −7 kB). Đoạn C max theo quét tay: **1.800.944 kB
  = 1.758,7 MiB lúc 20:40:47Z** (T9-141 sampler-long.log — xem
  F-141-T2-2: ram-max bỏ sót mẫu này); T5-141 sampler max
  1.672.472 kB lúc 20:41:12Z (corroborate); T4-141 poll #1 1.501 MB
  lúc 20:42:02Z (thấp hơn). **Không sampler nào quan sát được ≥
  6.144 MiB** — quyết "thử ngay khi quan sát được" đã được trực
  đúng, cửa sổ chỉ không mở.
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Cửa sổ vượt guard KHÔNG XUẤT HIỆN trong mù #60 (đỉnh cao nhất
  36,65% < 100%) và T2 KHÔNG thử (không thuộc brief T2; việc thử
  thuộc T9-141 theo quyết parent đợt 140 §12.2(f): "GIỮ NGUYÊN quy
  trình + guard 6.144 MiB"). u2net là fallback chính thức.
  **Lưu ý cho T9-141:** sau probe #60, sampler của T9-141 ghi
  **2.928.692 kB lúc 20:46:48Z** và T5-141 ghi **2.968.192 kB lúc
  20:47:12Z** (47,18% guard) — CAO HƠN đỉnh trong mù #60, nhưng
  đều SAU khi mù #60 đóng (20:45:15Z) nên KHÔNG tính vào max mù
  #60; T9-141 tự đánh giá trong LIMITS của mình (vẫn dưới guard,
  chưa đủ điều kiện thử birefnet).
- Caveat phương pháp (F-141-T2-2): ram-max60.py chỉ bắt được mẫu
  cao nhất 2.252 MB — mẫu cao thứ hai của T9 (2.295.468 kB) không
  vào danh sách vì dòng log sampler của T9 mang số trần không đơn
  vị (không có `MB`/`kB` trên dòng, regex nào của script cũng
  trượt); đoạn C max theo ram-max (1.501 MB) cũng thấp hơn max thật
  (1.800.944 kB của T9-141 — cùng lý do; T5-141 dùng format
  `avail_kB=` cũng trượt mọi pattern). T2 tìm ra max thật bằng cách
  quét tay log sampler của T9/T5. **ram-max là cận dưới, không phải
  max tuyệt đối** — luôn đối chiếu LIMITS sibling + quét tay log
  sampler trước khi chốt max RAM.

## 4. Ghi chú phương pháp + kiểm prereg

1. **Prereg đợt này KHÔNG có dự báo sai lớn — các dự báo chính đều
   đúng, 2 điểm tốt hơn dự báo:** probe #60 ok=2 fail=0 + log +3
   (đúng); đoạn A "ĐÓNG theo luật lỗ cơ học" (đúng — cộng thêm mật
   độ dày 53 mốc / lỗ lớn nhất 79 s, tốt hơn dự báo dè dặt chỉ dựa
   vào luật); đoạn B "CHƯA BIẾT" (thực tế ĐÓNG — tốt hơn dự báo dè
   dặt, lỗ lớn nhất chỉ 445 s); đoạn C đóng bằng uptime (đúng);
   gap #97?→#98? chứng nhận [7.089, 7.109] s (đúng); gap
   #98?→#99? chứng nhận [7.266, 7.286] s (đúng — prereg đã nêu khả
   năng này); EPERM 0 sóng thật + WFS chênh 0 (đúng);
   dpkg 1.545/221/462 (đúng); RAM max 36,65% guard (prereg dẫn
   T9-140 2.295.468 kB — thực tế max là 2.306.048 kB của T5-140,
   cao hơn 10.580 kB, xem F-141-T2-2).
   Lệch nhỏ: WFS prereg đoán ~+10/+3, thực tế +9/+3 (lệch 1 dòng —
   xem F-141-T2-4); dải chuẩn #100? prereg chưa tính (chờ chứng nhận
   — nay là FULL75 [20:22:26Z, 22:19:21Z]).
2. **F-141-T2-1 — nhãn observer trong blind60-investigate.py ghi
   "139" nhưng đường dẫn đọc file đợt 140 (mới, lỗi adapt):** adapt
   đổi `ROUND139` → `ROUND140` trong đường dẫn nhưng không đổi nhãn
   ("LIMITS gop 139" / "T2-139 LIMITS"). Giá trị đọc được là đúng
   file đợt 140: aggregate 140 mtime 20:05:01Z (51.315 B — parent
   viết §12.2 vào ~20:05Z, tăng từ 44.975 B lúc T10 đóng), T2-140
   LIMITS mtime 17:58:33Z. Nhãn sai, số đúng — không ảnh hưởng
   verdict nào (observer chỉ là kiểm phụ). Sửa nhãn ở đợt sau.
3. **F-141-T2-2 — ram-max60.py mù với format log sampler của T9
   (mới, cùng lớp F-140-T2-2 — nặng hơn ở đoạn C):** mẫu cao thứ hai
   2.295.468 kB (T9-140, 17:57:20Z) không vào danh sách vì dòng log
   sampler của T9 mang số trần không đơn vị; đoạn C max theo ram-max
   (1.501 MB, T4-141 poll) thấp hơn max thật (1.800.944 kB, T9-141
   sampler-long.log, 20:40:47Z) — cùng lý do; T5-141 dùng format
   `avail_kB=` cũng trượt mọi pattern của ram-max. T2 tìm ra max
   thật bằng cách quét tay log sampler của T9/T5 (xem §3). Bài học:
   ram-max chỉ là cận dưới; luôn đối chiếu LIMITS sibling + quét tay
   log sampler trước khi chốt max RAM. (Đoạn B max theo ram-max
   2.252 MB là đúng — T5 dùng `free -m` nên đơn vị là MiB.)
4. **F-141-T2-3 — file observer T10-140 sha256 không tồn tại (mới,
   cùng lớp F-140-T2-3):** `round140-t10/t10-closing-sha256.txt`
   UNREADABLE — tên file trong script investigate kế thừa từ đợt
   trước không khớp tên thật của T10-140 (T10-140 không tạo file
   này). Không ảnh hưởng verdict (chỉ là kiểm observer phụ; các
   observer khác đọc được: LIMITS gộp 140 20:05:01Z, T2-140 LIMITS
   17:58:33Z, cờ t10.done 19:57:15Z, GAP_ANALYSIS 19:59:17Z,
   build-loop-log 20:05:18Z).
5. **F-141-T2-4 — prereg WFS đoán ~+10/+3, thực tế +9/+3 (mới,
   đính chính dự báo):** prereg đếm 8 file mới và đoán ~+10 dòng /
   +3 file mang hit; thực tế chỉ T2-140 (+7) + gộp 140 (+1) +
   T5-140 (+1) mang hit mới — T4/T7/T8-140 + T1/T4-141 mang 0
   mention `writeFileSync`. Chênh 0 không đổi; chỉ là dự báo delta
   lệch 1 dòng.
6. **F-141-T2-5 — F99? 3 server không đồng nhất lần thứ hai (mới):
   example +1 s, google 0 s, cloudflare +1 s** (lần đầu là F97?
   +1/+2/+2 đợt 140; các đợt trước đó đều +1 s cả 3 server).
   F99? ≈ **−0 s tới −1 s (±~1 s)** — T2 ghi khoảng thay vì một
   số. Không đổi verdict gap nào (btime gaps là RTC, không phụ
   thuộc drift guest). **Quy ước đo:** T2 tính `Date − local_after`
   (cùng phương pháp T2-140 đo F97?); T6-141 đọc cùng file f99.txt
   theo quy ước `Date − local_before` cho +2/+2/+1 — số liệu thô
   giống hệt nhau, chỉ khác quy ước; offset thật nằm giữa hai cách
   tính (−0 s tới −2 s). T2 giữ quy ước cũ để nhất quán chuỗi.
7. **F-141-T2-6 — khung chết #97? 46 s là khung theo đồng hồ đọc
   (mới, §2.2):** 2 nhân chứng nhảy (sampler +19 s, session T8
   +11 s) + last-seen T4/T5 +30 s cho thấy đồng hồ boot cũ chạy
   nhanh — mốc 17:52:10Z là mốc đọc theo đồng hồ đó nên khung thật
   theo giờ thực có thể dịch chuyển. Cùng caveat với khung #96?
   21 s (parent đợt 140 §12.2(c) XÁC NHẬN 21 s làm chuẩn mới với
   cùng caveat — và bác ứng viên 2 s vì "độ chính xác 2 s vượt độ
   tin cậy đồng hồ" ở đợt 139). **T2 đề xuất 46 s làm chuẩn mới**
   (cùng quy ước đồng hồ đọc như chuẩn #96?/#94?); parent quyết
   khi đóng sổ theo quyết (d) đợt 140. Nếu parent thấy 46 s vẫn
   vượt độ tin cậy đồng hồ (dị thường tới +30 s), khung T4/T5 56 s
   và khung T8 36 s là các phương án thay thế sẵn có (cách dựng
   khác, không giao với khung merged theo đồng hồ đọc).
8. **F-141-T2-7 — đoạn A mù #60 chỉ 735 s: luật lỗ đóng cơ học là
   yếu (mới, đã ghi trong prereg TRƯỚC khi đo):** 735 s < sàn
   1.147 s nên floor(735/1147)=0 ngay cả khi không có mốc nào.
   Verdict đóng của đoạn A đứng trên **mật độ thực tế** (53 mốc
   merged, lỗ lớn nhất 79 s = 7% sàn, 12 session chạm đoạn A),
   không chỉ trên luật cơ học. T2 báo cả hai để parent tự xét —
   nếu parent thấy mật độ chưa đủ, gap #97?→#98? vẫn có thể giữ
   SPAN (khi đó CERT/FULL dùng biến thể một-gap... — không, biến
   thể một-gap là chỉ #97?→#98? được chứng nhận; nếu parent giữ cả
   hai gap thì CERT/FULL giữ 58/73 — T2 ghi rõ để parent chọn:
   cả hai gap / chỉ gap #97?→#98? / không gap nào).
9. **F-141-T2-8 — dải #98? có hai bản: FULL72 (chuẩn) vs FULL73
   (biến thể) + lệch làm tròn 1 s (mới):** quyết parent (f) đợt 139
   gọi tên FULL72; T2-140 công bố biến thể FULL73 [16:22:37Z,
   18:20:05Z]; code lần này cho [16:22:38Z, 18:20:06Z] — lệch 1 s
   do làm tròn nội suy p10 (cùng lớp F-140-T2-1). **Chuẩn là dải
   FULL72 [16:22:31Z, 18:20:15Z]**; biến thể chỉ ghi kèm. Cả ba
   bản dải đều chứa reboot #98? 17:52:56Z nên verdict INSIDE không
   phụ thuộc bản nào.
10. **F-141-T2-9 — /tmp 27 file TẤT CẢ trong đoạn C (mới, §2.4):**
    tmpfs bị reboot #98? xóa sạch rồi reboot #99? xóa tiếp nên 0
    file /tmp có mtime trong đoạn A/B; 27 file đều từ 20:05:23Z trở
    đi. Số 27 KHÔNG phải bằng chứng cho đoạn A/B — đoạn A/B đóng
    nhờ lỗ merged 79 s / 445 s, đoạn C đóng nhờ uptime. (Nối tiếp
    phát hiện 1 của T2-140: mù #59 chỉ có 676 file /tmp, tất cả
    đoạn B.)
11. **Docstring các script blind60 đã kiểm cửa sổ (mới):**
    investigate/sessions/merged/gaps/fifthscope/sweep/ram-max đều
    ghi đúng cửa sổ (17:40:41Z → 20:45:15Z 18/11) + SEGS 3 đoạn
    viết mới — đã kiểm bằng grep trước khi chạy (bài học T2-133 §4
    mục 6: kiểm SEGS sau khi adapt; F-139-T2-2/3 là hai lỗi adapt
    đã bắt bằng chính bước kiểm này). Lần này adapt60.py gặp thêm
    1 lỗi suýt mắc (nhãn observer §4 mục 2 — bắt bằng đối chiếu
    stat trực tiếp, xem F-141-T2-1).
12. **T6-141 công bố TRƯỚC khi T2 đóng (mới, như đợt 140):**
    T6-141 LIMITS + cờ `.done` đã có lúc T2 kiểm (20:49Z) — chuỗi
    tương đối #57→#99? đã chốt độc lập, #99? INSIDE dải FULL73,
    dải FULL73 khớp đúng prereg T2. Số #98?/#99? vững hơn mọi lần
    trước (merged + T6 đồng thuận). T1-141 và T4-141 cũng đã xong
    (cờ `.done` có lúc T2 kiểm).
13. **preview.tsx 530e10a7 GIỮ VĨNH VIỄN — theo quyết parent, không
    phải sai số (nhắc lại, §0):** md5 530e10a7 — fix instrumentation
    của T3-134 theo quyết parent đợt 137 §12.3(a) (GIỮ VĨNH VIỄN,
    từ đợt 138 chỉ giám sát thụ động điều tra (c2)). media.ts
    KHÔNG ĐỔI 2c384ed1; vite.config.ts (apps/web/) KHÔNG ĐỔI
    ee80d093. T2 không sửa production file nào.
14. **R9 (a): SỐ ĐẾM VẪN LÀ 16 — KHÔNG tăng (nhắc lại, §0):**
    quyết parent đợt 140 §12.2 không nhắc lại R9 (a) (quyết (l) đợt
    139: để yên, không nhắc lại). File LIMITS này KHÔNG viết số 17
    ở bất cứ đâu cho R9 (a).

## 5. Hồ sơ + stage

- **LIMITS này:** `docs/PHASE9_ROUND141_T2_EPERM_LIMITS.md`
  (oversize >37.768 B — chỉ stage paths, không push, như các
  LIMITS oversize đợt 134–141).
- **Thư mục làm việc:** `hidden_files/round141-t2/` — prereg-t2.md,
  boot-verify.txt, f99.txt (đo F99? — xem §1), dpkg99.txt (đọc lại
  21:06:41Z, cùng số 1.545/221/462 — xem §1), status1/once/status2 + .exit, blind60-investigate.py
  + .log, blind60-sessions.py + .log, blind60-merged.py + .log,
  blind60-gaps.py + .txt, blind60-fifthscope.py + .log,
  blind60-repo-1.txt, blind60-hidden_files.txt, blind60-outside.txt,
  blind60-tmp.txt, sessions-all.txt, eperm-sweep60.py +
  eperm-sweep-run.log, ram-max60.py + ram-max.txt, scan-wfs.sh +
  scan-meta.txt + files-*.bin + wfs-*.txt.
- **Stage (KHÔNG push):** `phase9-round141-t2-eperm.txt`
  (NUL-delimited, 1 entry: LIMITS này; verify read-back trước khi
  đóng cờ).
- **Cờ:** `hidden_files/round141-t2.done`.
- **Mù #61 MỚI MỞ** từ probe #60 (20:45:15Z 18/11) — việc của T2
  đợt 142. Dải chuẩn cho #100?: FULL75 [20:22:26Z, 22:19:21Z] (neo
  tại #99? 19:54:12Z); biến thể một-gap FULL74 [20:22:19Z,
  22:19:30Z].
