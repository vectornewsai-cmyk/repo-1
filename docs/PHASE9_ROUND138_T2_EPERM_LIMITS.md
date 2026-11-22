# PHASE9 ROUND138 T2 — EPERM: probe #57 ok=2 fail=0 + mù #57 ĐÓNG HOÀN TOÀN (đầu tiên từ #54) + gap #93?→#94? CHỨNG NHẬN [5.320 s, 5.340 s] → CERT 55 / FULL 70 + boot #94? TRONG dải dự báo + recheck mù #56 A / #55 B: 0 mốc mới + dpkg replay #94? XONG (1.545/221, khớp T5-137) + RAM vượt guard 6.623 MiB (T5, 09:00:26Z) — birefnet KHÔNG thử (thuộc T9)

> Luồng T2, đợt 138 vòng lặp Phase 9 VCut Studio (lượt cron 18:35 +07
> 18/11/2026; làm việc 11:37Z → ~11:52Z 18/11/2026).
> Nhiệm vụ: probe #57 theo lịch thường lệ + mù #57 (từ probe #56) +
> recheck mù #56 đoạn A + mù #55 B (brief giao) + boot #94? + quét sóng
> EPERM + WFS lần 44. Quyết parent đợt 137 §12.3: (a) **ĐÓNG điều tra
> (c2), kết luận "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" + GIỮ fix 530e10a7
> VĨNH VIỄN** (từ đợt 138 chỉ giám sát thụ động); (b) **CHẤP NHẬN DEF
> v0.5** (P5 34–52 ms + P3' stall-based, T3/T10 viết ở đợt 138);
> (c) GIỮ ngưỡng ≤60 ms; điều tra tải song song TRƯỚC; (d) Lag +2f chỉ
> theo dõi ở #15+; **(e) Mù #56 A: headline giữ 1, ghi kèm 3 bảo
> thủ**; (f) **GIAO RÕ T9-138 thử birefnet khi cửa sổ mở** (sampler
> nào quan sát được ≥ 6.144 MiB thì thử ngay); **(g) XÁC NHẬN số boot
> theo quy ước: 2104246b = #93?, 17db9652 = #94?; khung chết #93?
> chuẩn (09:35:47Z, 09:36:01Z] (14 s)**; khung chết #92? chuẩn bản hẹp
> (08:05:05Z, 08:07:11Z] (126 s); (h) bước 4 kiểm kẹt chấp nhận như
> hiện tại, KHÔNG can thiệp host; (i) poller T4 chụp ps snapshot
> TRƯỚC rồi đếm TỪ snapshot; (j) headroom chỉ theo dõi; (k) CHẤP NHẬN
> đóng đợt 137 9/9. Prereg viết TRƯỚC khi đo:
> hidden_files/round138-t2/prereg-t2.md. **KHÔNG có reboot giữa phiên
> T2 lượt này** — boot 17db9652 từ lúc mở (11:37:52Z) tới lần kiểm
> cuối 11:51:36Z. **ĐÍNH CHÍNH ở §6: một reboot xảy ra SAU lần kiểm
> cuối, phát hiện lúc đóng phiên 11:55:20Z — boot mới 914964c3,
> btime 11:52:20Z (ứng viên #95?).**
> — và lần này còn được củng cố: đoạn A mù #57 ĐÓNG (tối đa 0 ẩn)
> nên không có reboot ẩn giữa #93? và boot này → 17db9652 CHÍNH LÀ
> #94? theo cả hai cách đọc (quy ước + merged); số tuyệt đối vẫn tạm
> theo thông lệ, chờ T6-138 chốt chuỗi tương đối.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (11:39:03Z–11:39:07Z):**
  `status` báo **DEAD/STALE** (heartbeat age 10.397 s, last #56
  08:45:46Z, boot 2104246b, exit 1); `once` ngay sau đó là **probe
  #57, boot 17db9652, ok=2 fail=0**, exit 0, 11:39:07Z; `status`
  chạy lại **ALIVE** (age 4 s, n=57), exit 0. Log v2 tăng đúng **3
  dòng** (160 → 163) — **như mọi lượt trước**; prereg §3 đã dự báo
  đúng +3 trước khi đo. Heartbeat nay n=57, ts 11:39:07Z, boot
  17db9652.
- **Boot #94? lúc 09:36:01Z, boot
  `17db9652-ad06-409f-989c-cdbdba15d0af`** — xác minh bằng `uptime
  -s` + btime 1794994561 + `who -b` + journal 1 boot (xem §1). Clock
  VM hiện tại: HTTP `Date` 3 server hơn local **0 s / +1 s / +1 s**
  → **F94? ≈ −1 s (±~1 s)** — đo trực tiếp đầu tiên trên boot mới.
- **DẢI DỰ BÁO ĐÚNG:** dải cơ học cho #94? (p10–p90 FULL69, T2-137
  §2.5) là **[08:34:40Z, 10:33:14Z]** — thực tế **09:36:01Z NẰM
  TRONG dải** (cả cơ học lẫn hiệu dụng [08:45:46Z, 10:33:14Z]).
  Chuỗi INSIDE bắt đầu lại ở 1 lần liên tiếp (#94?) sau 1 lần
  OUTSIDE (#93?, muộn hơn cận trên 710 s).
- **Khoảng mù #57 (08:45:46Z → 11:39:07Z 18/11, 2h53'21" =
  10.401 s) — ĐÓNG HOÀN TOÀN.** Đoạn A ĐÓNG bằng luật lỗ (merged
  116 mốc, lỗ lớn nhất **61 s** ≪ sàn 1.147 s, tối đa **0 ẩn**);
  đoạn B ĐÓNG bằng uptime trực tiếp (merged 195 mốc, lỗ lớn nhất
  2.566 s là khoảng yên 10:49:36Z → 11:32:22Z sau khi T10-137 đóng
  — uptime loại bỏ reboot ẩn trong đó). Merged 312 mốc giây.
  **Chuỗi mù đóng hoàn toàn: #57 là mù đóng hoàn toàn ĐẦU TIÊN kể
  từ #54** (#50 đóng, #51 hở, #52 đóng, #53 hở, #54 đóng, #55 hở,
  #56 hở, **#57 đóng**).
- **Gap #93?→#94? = [5.320 s, 5.340 s] (1h28'50" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG, gap mới đầu tiên kể từ đợt 136.**
  **CERT 54→55 / FULL 69→70**: CERT55 mean 1h32'44" median
  1h46'28" p10 0h26'54" p90 2h17'50" sd 0h46'01"; FULL70 mean
  1h39'58" median 1h48'59" p10 0h27'38" p90 2h25'56" sd 0h57'01";
  in 90–150' = 34, <60' = 17, >180' = 6, >240' = 2. Dải chứng nhận
  [0h00'55", 3h14'08"] không đổi. Dải cơ học mới cho #95?:
  [10:03:39Z, 12:01:56Z]; dải hiệu dụng sau probe #57: [11:39:07Z,
  12:01:56Z].
- **Khung chết #93? HẸP HƠN 1 s (ứng viên mới): (09:35:48Z,
  09:36:01Z] (13 s)** — mốc cuối là T4-137
  postboot-t4-137-gate0wait-69.log 09:35:48Z. Khung chuẩn parent
  (09:35:47Z, 09:36:01Z] (14 s) vẫn đứng trừ khi parent cập nhật
  (xem §2.2). Khung chết #92? (08:05:05Z, 08:07:11Z] (126 s) +
  #91? (04:42:27Z, 05:29:18Z] (2.811 s) — chuẩn parent — không đổi.
- **Gap #92?→#93? = 9.473 s GIỮ SPAN — recheck mù #56 A: 0 mốc
  mới trong lỗ** (9 hit đều là file biên phải đã biết, xem §2.6).
  **Gap #91?→#92? = 6.838 s GIỮ SPAN — recheck mù #55 B: 0 mốc
  mới.**
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 129 file
  *.log có mtime trong mù #57 (0 file repo-1, 129 file
  hidden_files); 2 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả launcher đã biết** (T10-O8, xem §2.7). Quét mở rộng: **8 match
  thô / 8 dòng duy nhất — phân loại hết** (6 dòng test-pass hasEperm
  + 2 dòng launcher). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** —
  **~167,5h** trước probe #57. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 44: 915 dòng / 256 file** (phạm vi 3.146
  file); R7b đối chiếu 940 dòng / 273 file; copies 25 dòng / 17
  file — y hệt lần 43 về copies. Đối chiếu chéo 915+25=940=R7b,
  **chênh 0 — lần thứ bốn mươi bốn liên tiếp**. +8 dòng / +3 file so
  với lần 43, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray.
- RAM: max biết được trong mù #57 **6.781.936 kB ≈ 6.623 MiB
  (T5-137, 09:00:26Z, Balloon 0, đoạn A) — VƯỢT guard 6.144 MiB
  LẦN ĐẦU TIÊN** (T5-137 LIMITS §9.2); T4 độc lập corroborate: 5
  poll khác nhau ≥ 6.144 MiB trong 08:59:39Z–09:01:10Z (cao nhất
  T4: 6.693 MB lúc 09:00:25Z). Đoạn B max **1.847 MB** (09:37:39Z).
  **Birefnet KHÔNG chạy bởi T2 — việc thử thuộc T9-138 theo quyết
  (f)** (quyết parent đợt 137 §12.3(f)). MemAvailable trực tiếp lúc
  đóng phiên: **6.204.548 kB (11:51:36Z, NGOÀI mù — đang hồi nhanh,
  còn thiếu ~85 MiB tới guard; để T9 biết)**.
- **dpkg.log boot #94? — replay XONG (khác bracket tạm của T2-137
  cho boot #93?): 1.545 dòng / 221 installs / 462 configure**,
  lần ghi cuối 09:42:06Z (gstreamer1.0-tools), lặng ~1h57' lúc đọc
  đầu — **KHỚP HOÀN TOÀN xác nhận của T5-137** (1.545/221, cờ
  09:43:47Z poll 6). Gói đầu libaspell15 09:37:59Z;
  gstreamer1.0-gl 09:38:16Z; replay bắt đầu 09:36:50Z (boot +49 s).
- **preview.tsx 530e10a7** (fix GIỮ VĨNH VIỄN theo quyết parent đợt
  137 §12.3(a)); media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts KHÔNG
  ĐỔI ee80d093. T2 không sửa production file nào.
- **Đợt 138 lúc T2 đóng (~11:52Z 18/11):** các luồng khác đang chạy
  (T4/T5/T7/T8/T9 chưa có cờ; T1/T3/T6 đã xong); boot hiện tại #94?
  (kiểm 11:51:36Z). **ĐÍNH CHÍNH ở §6: reboot #95? phát hiện lúc
  đóng phiên 11:55:20Z.** T6-138 CHƯA công bố chuỗi lúc T2 đóng — số #94?
  vẫn chờ T6/T10 đối chiếu theo thông lệ, dù merged lần này đã loại
  bỏ khả năng reboot ẩn. T2 KHÔNG mở Xvfb (không cần) nên không có
  gì để kill.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 11:37:52Z | boot_id `17db9652-ad06-409f-989c-cdbdba15d0af`; `who -b` Nov 18 09:36; `uptime -s` **2026-11-18 09:36:01**; btime **1794994561 = 2026-11-18T09:36:01Z**; journal chỉ 1 boot (17db9652, first entry 09:36:17Z, last 11:37:49Z lúc kiểm tra). MemAvailable 627.184 kB lúc 11:38:23Z. |
| Đo F94? (HTTP Date, 3 server) | 11:38:31–11:38:35Z | example.com Date 11:38:33Z vs local_after 11:38:33Z (0 s); google.com Date 11:38:34Z vs local_after 11:38:33Z (+1 s); cloudflare.com Date 11:38:35Z vs local_after 11:38:34Z (+1 s) → **F94? ≈ −1 s (±~1 s)**. Đo trực tiếp đầu tiên trên boot mới. |
| Đọc dpkg.log bracket #94? | ~11:39Z | **1.545 dòng / 221 installs / 462 configure** — replay XONG (lần ghi cuối 09:42:06Z, lặng ~1h57'); gói đầu libaspell15 09:37:59Z; gstreamer1.0-gl 09:38:16Z; replay bắt đầu 09:36:50Z (boot +49 s). Khớp xác nhận T5-137. |
| `bash scripts/probe-eperm-v2.sh status` | 11:39:03Z | **DEAD/STALE**, heartbeat n=56, ts 08:45:46Z, boot 2104246b, age **10.397 s** (đúng 2h53'21"); last sample probe #56; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 11:39:07Z | **probe #57, boot=17db9652, ok=2 fail=0**, exit 0; dòng `boot changed 2104246b -> 17db9652` (uptime since 2026-11-18 09:36:01) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~11:39:11Z | **ALIVE**, age 4 s, n=57, exit 0 |
| Xác minh boot lại (sau probe) | 11:39:16Z | Cùng boot 17db9652, `uptime -s` 09:36:01Z, btime 1794994561. MemAvailable 771.296 kB. |
| Xác minh boot lần 3 (lần kiểm cuối) | 11:51:36Z | Cùng boot 17db9652 — **KHÔNG reboot tới thời điểm này**. MemAvailable 6.204.548 kB. (Reboot #95? phát hiện SAU đó, lúc đóng phiên 11:55:20Z — xem §6.) |

Kiểm lại từ đĩa: log probe v2 **163 dòng** — 160 sau T2-137 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #56 +
dòng `boot changed` + dòng probe #57). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #56 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §3 đã dự báo đúng +3
trước khi đo. Heartbeat **n=57, ts 2026-11-18T11:39:07Z, boot
17db9652-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

**Về btime và journal first entry (đính chính, nối tiếp T2-137):**
btime thật là **09:36:01Z** (/proc/stat 1794994561 + `uptime -s` +
`who -b`). Journal first entry là **09:36:17Z** — chậm hơn btime
16 s (journald khởi động sau kernel boot ~16 s — cùng mẫu #93?:
first entry 08:07:27Z vs btime 08:07:11Z, cũng 16 s; #92?: first
entry 05:29:34Z vs btime 05:29:18Z, cũng 16 s). Sai lệch 16 s này
KHÔNG đổi verdict nào. Ghi rõ để luồng sau khỏi lấy 09:36:17Z
làm btime.

Nguồn độc lập cho boot #94?: 5 session T2 trong vùng B (xem §2.3)
+ 195 mốc merged gộp trong vùng B (mốc đầu 09:36:03Z — T5 postboot
poll; mốc cuối 11:39:06Z — exec-log phiên T2) + 7 exec-log nhắc
17db9652 trong mù (xem §2.3). **Số thứ tự #94? ĐÃ XÁC NHẬN theo
quy ước (quyết (g)) và được củng cố bởi merged**: đoạn A mù #57
đóng với tối đa 0 ẩn nên không có reboot ẩn giữa #93? và boot này
— T6-138 chốt chuỗi tương đối, số tuyệt đối vẫn tạm theo thông lệ.

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #57 (08:45:46Z → 11:39:07Z 18/11, 2h53'21" = 10.401 s)

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #57: `uptime -s` = **2026-11-18 09:36:01Z**,
  boot_id `17db9652-ad06-409f-989c-cdbdba15d0af` — khác boot của
  probe #56 (2104246b).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (11:38:23Z): chỉ **1 boot**
  (17db9652, first entry 09:36:17Z, last 11:37:49Z). Journal/wtmp
  của các boot trước đã mất theo reboot #94? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #94? — replay XONG, khớp T5-137.** Đọc lúc
  ~11:39Z: **1.545 dòng / 221 installs / 462 configure** (installs
  = số dòng `status installed`; configure = số dòng chứa
  `configure` — cùng phương pháp đếm với T2-136, xem dưới); lần
  ghi cuối **09:42:06Z** (gstreamer1.0-tools installed), lặng
  ~1h57' lúc đọc đầu — **chứng minh xong** (khác bracket tạm
  566/83/170 của T2-137 cho boot #93?, lúc đó replay còn chạy).
  Gói đầu libaspell15 install 09:37:59Z; gstreamer1.0-gl install
  09:38:16Z; 98 dòng gstreamer; startup packages configure
  09:36:50Z (×2) → startup archives unpack 09:37:59Z. Replay bắt
  đầu **boot +49 s** — nhanh hơn hẳn #93? (boot +24m24s, cache
  trống phải download) vì lần này cache apt SỐNG QUA REBOOT
  (T5-137: "replay NHANH từ cache (1545/221, cờ 09:43:47Z)").
  **Hình dạng KHỚP baseline 1.545 dòng / 221 installs của
  #82?/#83?/#84?/#90?/#92?** — cùng một replay configure khô.
  **T5-137 là chủ quản postboot — bracket chính thức thuộc về T5;
  số của T2 là đọc độc lập đối chiếu, khớp từng số.**
  **dpkg.log của boot #93? (2104246b) đã MẤT** (file lúc T2 kiểm
  chỉ còn log của boot mới): /var/log reset mỗi boot. Bản ghi
  T2-137 (bracket #93? tạm: 566 dòng / 83 installs / 170
  configure, lần ghi cuối 09:01:42Z) + xác nhận T5-137 là bằng
  chứng còn lại cho boot đó — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**KHÔNG có reboot giữa phiên T2 lượt này — tới lần kiểm cuối
11:51:36Z:** boot 17db9652 xác minh lúc 11:37:52Z (mở lượt),
11:39:16Z (sau probe #57) và 11:51:36Z (lần kiểm cuối) — cùng
boot_id + btime 09:36:01Z. **ĐÍNH CHÍNH (xem §6): một reboot xảy ra
SAU lần kiểm cuối, phát hiện lúc đóng phiên 11:55:20Z — boot mới
914964c3, btime 11:52:20Z.** (Tiền lệ: T2-134 cũng gặp reboot giữa
phiên; lượt này gặp ở phút cuối, sau khi mọi đo đạc đã xong.)

### 2.2 Reboot đã chốt trong mù — #94? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 94? | **09:36:01Z** (chính xác từng giây) | 2104246b → 17db9652 | Chốt từ lượt này: `uptime -s` đọc tươi (11:37:52Z + kiểm lại 11:39:16Z + 11:51:36Z) + btime 1794994561 + `who -b` 09:36 + boot_id 17db9652 + journal first entry 09:36:17Z + probe #57 11:39:07Z boot 17db9652 ok=2 fail=0 + 16 session trong vùng B. **Số thứ tự ĐÃ XÁC NHẬN theo quy ước (quyết (g) đợt 137) và được củng cố bởi merged (đoạn A đóng, tối đa 0 ẩn).** |

**Clock:** F94? ≈ **−1 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` 3 server: example.com
0 s, google.com +1 s, cloudflare.com +1 s (độ chi tiết 1 s của HTTP
Date). **F94? là lần đo trực tiếp đầu tiên trên boot #94?** — không
dùng cận hai lần đo. F93? ≈ −1 s (±~1 s, đã đo đợt 137). Hai đầu
chuỗi đo được (F93?, F94?) đều ≈ −1 s — đồng hồ local ổn định ở mức
chậm ~1 s ở cả hai đầu; xem §2.5 về cách caveat này được xử lý.

**CẬN NHẢY CLOCK TẠI REBOOT (0 nhân chứng nhảy):**
- **0 nhân chứng nhảy tại #94?:** **0 session** sinh trước
  btime có mtime sau btime (quét 259 exec-log).
- Cận session: **|X94?| < 54 s** (session muộn nhất 09:35:07Z —
  cận CHẶT, vì sau 09:35:07Z còn session/file viết tới 09:35:48Z;
  cận chặt thật cho khung chết là mốc merged 09:35:48Z — xem khung
  chết dưới).
- Session sớm nhất sau btime: 09:36:21Z (phiên main agent
  edca69d8, spawn sau reboot).
- **Ranh giới sạch hoàn toàn:** 0 file trong
  (btime +0 s, +10 s] NGOẠI TRỪ 3 file T5 postboot ở +2 s
  (09:36:03Z — hoạt động ĐẦU TIÊN trên boot mới, không phải file
  +s kiểu mù #54); 0 file trong [btime −10 s, btime] (merged kiểm
  cả 3 cây repo-1/hidden_files/outside). Không có file +s kiểu
  mù #54 (#88? +8 s, #89? +3 s) hay mù #50.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #93?→#94? = **[5.320 s, 5.340 s] (1h28'50" ±10 s) — CHỨNG
  NHẬN DẠNG KHOẢNG** (đoạn A mù #57 đóng, tối đa 0 ẩn + đoạn B
  đóng bằng uptime). **CERT 54→55 / FULL 69→70** (xem §2.5).
- Gap #92?→#93? = 9.473 s (2h37'53") — **VẪN CHỈ LÀ SPAN**
  (đoạn A mù #56 mở, tối đa 1 ẩn quy ước / 3 ẩn cộng dồn; ĐÃ
  RECHECK đợt này — xem §2.6). **CERT/FULL không tính gap này.**
- Gap #91?→#92? = 6.838 s (1h53'58") — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #55 mở, tối đa 2 ẩn quy ước / 3 ẩn cộng dồn; ĐÃ
  RECHECK đợt này — xem §2.6). **CERT/FULL không tính gap này.**
- Gap #83?→#84? = 6.318 s (1h45'18") — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #53 mở, tối đa 3 ẩn; KHÔNG kiểm lại đợt này — xem
  §2.6). **CERT/FULL không tính gap này.**
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):**
  #94? từ #93? dự kiến [08:34:40Z, 10:33:14Z] (p10–p90 FULL69 —
  bản script T2-137, kiểm lại bằng code đợt này: khớp từng giây);
  thực tế **09:36:01Z — TRONG dải**. **Chuỗi INSIDE bắt đầu lại ở
  1 lần liên tiếp (#94?)** sau 1 lần OUTSIDE (#93?).
- **Dải cơ học mới cho #95? (p10–p90 FULL70): [10:03:39Z,
  12:01:56Z]** — từ btime #94? 09:36:01Z; dải hiệu dụng sau probe
  #57: [11:39:07Z, 12:01:56Z].

**Khung chết các boot mới (từ merged — xem §2.4):**
- **Khung chết #93? (ứng viên HẸP HƠN 1 s): (09:35:48Z,
  09:36:01Z] (13 s)** — mốc muộn nhất là T4-137
  postboot-t4-137-gate0wait-69.log 09:35:48Z (hidden_files).
  Khung chuẩn parent (09:35:47Z, 09:36:01Z] (14 s) vẫn đứng trừ
  khi parent cập nhật — mốc 09:35:47Z là mốc T10-137 dùng làm
  chuẩn; mốc 09:35:48Z của T2 là file log T4 viết muộn hơn 1 s
  trong cùng giây kế tiếp. Cả hai khung đều đúng ở độ chính xác
  giây theo nguồn của mình; T2 báo ứng viên hẹp hơn để parent
  quyết (cùng mẫu khung #90? 29 s vs 177 s: parent giữ bản hẹp làm
  chuẩn). Tuổi thọ boot #93? theo khung này: 1h28'37"–1h28'50" (từ
  btime 08:07:11Z).
- **Khung chết #92?: (08:05:05Z, 08:07:11Z] (126 s) — CHUẨN PARENT
  VẪN ĐỨNG** (§12.3(g) đợt 137). Khung chết #91?: (04:42:27Z,
  05:29:18Z] (2.811 s) — CHUẨN PARENT VẪN ĐỨNG (§12.3(e) đợt 136;
  recheck đợt này 0 mốc mới — xem §2.6).

**Chuỗi gộp (định nghĩa duy nhất từ đợt 134):** reboot #93?→#94?
là **sự kiện thứ 18** (đợt 137 là sự kiện thứ 17) — với điều kiện
không có reboot ẩn trong đoạn A mù #57; đoạn A ĐÓNG (tối đa 0 ẩn)
nên điều kiện này ĐƯỢC CHỨNG MINH, không còn là giả định. **Số
thứ tự #94? ĐÃ XÁC NHẬN theo quy ước** (quyết (g) đợt 137);
chuỗi tương đối do T6-138 chốt, số tuyệt đối vẫn tạm theo thông
lệ; giá trị gap không phụ thuộc số thứ tự.

### 2.3 Hoạt động trong khoảng mù — ĐÓNG HOÀN TOÀN (merged 4 phạm vi)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **15 file** +
hidden_files **357 file**; **372 file, 364 mốc float phân biệt /
243 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3/T2-133 §2.3/
T2-134 §2.3/T2-135 §2.3/T2-136 §2.3/T2-137 §2.3 — "mốc" là mtime
float phân biệt, không phải giây tròn). Ngoài hai cây: **80 file**
(agents — exec-log/tool-output chiếm đa số + avatars + voice +
proactivity; chi tiết xem blind57-outside.txt);
**/tmp: 688 file** trong mù #57 (xem blind57-tmp.txt — 0 file trong
đoạn A-tail, 1 file trong đoạn B-tail, xem caveat §2.4).
Gộp cả 4 phạm vi: **312 mốc giây phân biệt**. Chia mù làm hai
đoạn bởi 1 reboot:

- **Đoạn A: 08:45:46Z → 09:36:01Z (50'15" = 3.015 s, boot #93?
  2104246b) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **132 mốc** (hai cây), lỗ lớn nhất hai cây **61 s**
    (08:56:46Z → 08:57:46Z); lỗ lớn thứ hai 61 s; lỗ lớn thứ ba
    60 s. Mốc đầu 08:45:46Z (head 1 s — chính probe #56); mốc
    cuối hai cây **09:35:48Z** (đuôi hai cây **13 s**).
    **13 session** chạm đoạn A.
  - **Merged 4 phạm vi: 116 mốc, lỗ lớn nhất 61 s**
    (09:33:01Z → 09:34:02Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 08:45:47Z (head 1 s), mốc cuối gộp **09:35:48Z**
    (đuôi 13 s — T4 gate0wait-69.log). Lỗ lớn thứ hai gộp **61 s**
    (09:31:00Z → 09:32:01Z) và lỗ lớn thứ ba **61 s** (09:27:59Z
    → 09:29:00Z) — **cả hai đều NHỎ HƠN NHIỀU so với sàn** (các
    lỗ 60–61 s là nhịp poll 60 s của T4/T5, xem dưới).
    **Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): 0 mốc**
    trong đoạn A (3 file của phạm vi thứ 5 đều trong đoạn B — xem
    §2.4).
  - Cửa sổ sàn [A-lo=09:04:53Z, A-hi=09:16:54Z]: 2 session bắc qua
    cắt A-lo; **1 session bắc qua cắt A-hi** (sinh 08:47:07Z,
    mtime 09:35:07Z — phiên main agent 4f98e5af); **3 session chạm
    A-tail** (09:16:54Z, 09:36:01Z] — mốc merged trong A-tail dày
    đặc (T4 gate0wait + T5 b90 polls mỗi ~60 s tới 09:35:48Z).
  - Hoạt động trên 2104246b: các luồng đợt 137 làm việc tới
    ~09:0xZ (T4 poll #22 09:00:25Z RAM 6.693 MB; T5 wait-replay
    poll 16–18 09:00:47–09:02:48Z) + T4/T5 postboot polls đều đặn
    mỗi ~60 s tới 09:35:48Z (T4 gate0wait-69.log là mốc cuối) —
    máy KHÔNG yên trong đoạn A (ngược với đoạn A mù #56: yên
    06:21–07:08Z rồi chỉ còn memory reconciliation). Không có cron
    nào chạy trong khoảng này (lượt cron tiếp theo mở 11:35Z — đã
    sang boot mới).
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn (merged + hai cây
    đồng thuận).**
- **Đoạn B: 09:36:01Z → 11:39:07Z (2h03'06" = 7.386 s, boot #94?
  17db9652) — ĐÓNG bằng đo uptime trực tiếp + luật lỗ:**
  - **`uptime -s` lúc 11:38:23Z = 09:36:01Z** chứng minh máy up
    liên tục từ #94? tới lúc đo; probe #57 11:39:07Z đọc boot_id
    17db9652 tươi — cùng boot_id với boot bắt đầu 09:36:01Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C, T2-132 §2.3 đoạn C, T2-133 §2.3 đoạn B,
    T2-134 §2.3 đoạn C, T2-135 §2.3 đoạn G, T2-136 §2.3 đoạn C
    mù #55, T2-137 §2.3 đoạn B mù #56.)
  - **232 mốc** (hai cây), lỗ lớn nhất **3.138 s** (10:44:21Z →
    11:36:39Z — khoảng yên sau khi T10-137 đóng tới khi đợt 138
    mở); mốc cuối **11:39:05Z** (đuôi hai cây **2 s**).
    **16 session** chạm đoạn B.
  - **Merged 4 phạm vi: 195 mốc, lỗ lớn nhất 2.566 s**
    (10:49:36Z → 11:32:22Z), floor=2 theo luật lỗ thuần túy —
    **nhưng uptime trực tiếp loại bỏ khả năng reboot ẩn trong
    lỗ** (máy up liên tục từ 09:36:01Z tới lúc đo 11:38:23Z;
    journal chỉ 1 boot). Mốc đầu gộp 09:36:03Z (head 2 s — T5
    postboot poll), mốc cuối gộp 11:39:06Z (đuôi 1 s).
  - Đoạn B dài hơn 2×sàn 5.092 s nên có cửa sổ sàn rộng
    [B-lo=09:55:08Z, B-hi=11:20:00Z]; 3 session bắc qua cắt B-lo,
    **0 session bắc qua cắt B-hi** — uptime là closer, luật lỗ chỉ
    là kiểm chứng thêm. Khoảng yên 10:49:36Z → 11:32:22Z là lúc
    máy thật sự không có tiến trình nào ghi đĩa (T10-137 đã đóng
    10:41Z; đợt 138 dispatch 11:35Z; mốc đầu sau khoảng yên là
    voice/s2s-context 11:32:22Z — hoạt động của hệ thống trước khi
    dispatch).
  - **Kết luận đoạn B: ĐÓNG.**

**Kết luận trung thực: khoảng mù #57 ĐÓNG HOÀN TOÀN.** Đoạn A đóng
(luật lỗ, tối đa 0 ẩn), đoạn B đóng (uptime). 1 reboot đã chốt giờ
(#94? 09:36:01Z — chính xác từng giây trên đĩa, số đã xác nhận
theo quy ước) + **tối đa 0 ẩn**. Chuỗi mù đóng hoàn toàn: #50
đóng, #51 hở, #52 đóng, #53 hở, #54 đóng, #55 hở, #56 hở, **#57
đóng** — mù đóng hoàn toàn đầu tiên kể từ #54 (3 lượt trước).

Ngoài hai cây: **80 file** có mtime trong mù #57 (agents —
exec-log/tool-output chiếm đa số + avatars + voice/s2s-context;
chi tiết xem blind57-outside.txt); **/tmp: 688 file** trong mù #57
(xem blind57-tmp.txt + caveat §2.4 — 0 file trong đoạn A-tail, 1
file trong đoạn B-tail). Boot_id nhắc trong exec-log sinh/viết
trong mù: 2104246b 8 file, 17db9652 7 file.

### 2.4 Gộp 4 phạm vi + 4 phát hiện mới (phương pháp nối tiếp T2-137 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind57-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 116 mốc, lỗ lớn nhất **61 s** (09:33:01Z →
  09:34:02Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**. Lỗ lớn thứ hai
  **61 s** (09:31:00Z → 09:32:01Z); lỗ lớn thứ ba **61 s**
  (09:27:59Z → 09:29:00Z) — cả hai cũng nhỏ hơn nhiều so với sàn.
- Đoạn B gộp: 195 mốc, lỗ lớn nhất **2.566 s** (10:49:36Z →
  11:32:22Z — khoảng yên), floor=2 theo luật lỗ thuần túy —
  **nhưng uptime trực tiếp đóng đoạn B** (xem §2.3). Lỗ lớn thứ hai
  249 s; lỗ lớn thứ ba 233 s.
- Tổng gộp 312 mốc giây. Không có file nào trong
  `~/workspace/goals` ngoài hidden_files có mtime trong mù (kiểm
  bằng find riêng — vùng duy nhất hai lần quét chính không phủ,
  đã kiểm bổ sung, 0 file).

**Phát hiện 1 — /tmp CÓ 688 file trong mù #57, TẤT CẢ trong đoạn B,
0 file trong đoạn A (mới, nối tiếp phát hiện 1 của T2-137):** /tmp
trên VM này là tmpfs — reboot #94? (09:36:01Z) xóa mọi file /tmp
viết trước đó. Kiểm trực tiếp từ blind57-tmp.txt: **0 file có
mtime < 09:36:01Z (đoạn A), 688 file có mtime ≥ 09:36:01Z (đoạn
B)**; file sớm nhất 09:44:38Z (node-compile-cache), muộn nhất
11:39:02Z (jarvis-tool-output). 40 mốc giây /tmp của merged đều
nằm trong đoạn B. **Verdict không đổi:** đoạn A đóng và đoạn B
đóng đều không phụ thuộc /tmp (A đóng vì lỗ lớn nhất chỉ 61 s
trên cả 4 phạm vi, B đóng nhờ uptime). Ghi rõ để luồng sau khỏi
hiểu "688 file /tmp" là bằng chứng cho cả mù — chúng chỉ phủ
đoạn B (node-compile-cache + T8 smoke + T10 O8 + tool-output của
đợt 137/138). Trong A-tail (09:16:54Z, 09:36:01Z]: **0 file**;
trong B-tail (11:20:00Z, 11:39:07Z]: **1 file**
(jarvis-tool-output-k5glte.json 11:39:02Z).

**Phát hiện 2 — Đoạn A có nhịp poll 60 s đều đặn, lỗ lớn nhất chỉ
61 s (mới):** các lỗ lớn nhất đoạn A (61 s, 61 s, 61 s) đều là
khoảng giữa hai lần poll liên tiếp của T4 (gate0wait, mỗi ~60 s)
và T5 (b90 polls, mỗi ~60 s) trong lúc chờ replay dpkg trên boot
#93?. Nhịp 60 s này là "lưới an toàn" tự nhiên: bất kỳ reboot ẩn
nào cũng phải ngồi trong một lỗ ≤61 s — nhỏ hơn sàn 1.147 s tới
18,8 lần. Đây là lần đầu tiên một đoạn mù được phủ dày tới mức
này (116 mốc / 3.015 s ≈ 1 mốc mỗi 26 s trung bình). So sánh:
đoạn A mù #56 có 148 mốc / 8.205 s (≈ 1 mốc mỗi 55 s) nhưng 3 lỗ
vượt sàn; đoạn A mù #57 dày hơn gấp đôi theo mật độ.

**Phát hiện 3 — Mốc cuối đoạn A 09:35:48Z hẹp khung chết #93?
thêm 1 s (mới):** T4-137 postboot-t4-137-gate0wait-69.log
09:35:48Z là file log poll cuối của T4 trên boot #93? trước
reboot. Mốc này muộn hơn mốc 09:35:47Z mà T10-137 dùng làm chuẩn
1 s — khung chết #93? thành (09:35:48Z, 09:36:01Z] = 13 s theo
nguồn của T2. T2 KHÔNG tự đổi chuẩn parent (14 s vẫn đứng);
parent quyết khi đóng sổ (cùng mẫu khung #90? 29 s vs 177 s).
Không có caveat 0 byte như mốc 03:34:51Z của khung #90? (file
log này có nội dung — poll #69 của T4).

**Phát hiện 4 — Phạm vi thứ 5 không lấp khoảng yên đoạn B (mới,
kiểm theo bài học F-136-T2-8):** quét ~/memory + ~/dreams +
~/side-chats cho cả mù #57: 3 file (memory/2026-11-18.md
10:45:06Z + ~/memory/bank/reflections.md + ~/memory/bank/world.md
cùng 10:49:36Z — vòng memory reconciliation của hệ thống, đoạn B).
**0 mốc trong (09:35:48Z, 09:36:01Z]** (đuôi khung chết) và **0
mốc trong khoảng yên 10:49:36Z → 11:32:22Z** — hai file 10:49:36Z
CHÍNH LÀ mốc trái của lỗ lớn nhất đoạn B (cùng giây với mốc
merged), không lấp lỗ. Verdict đoạn B không đổi (đóng bằng
uptime).

### 2.5 Phân phối gap — CERT n=54 → n=55 / FULL n=69 → n=70 (MỘT gap mới chứng nhận)

**Một gap mới (xem blind57-gaps.py + blind57-gaps.txt):**
- **Gap #93?→#94? = [5.320 s, 5.340 s] (1h28'50" ±10 s) CHỨNG
  NHẬN DẠNG KHOẢNG** — đoạn A mù #57 đóng (merged, tối đa 0 ẩn)
  + đoạn B đóng bằng uptime. **CERT/FULL tính gap này (mid
  5.330 s).** Đây là gap chứng nhận đầu tiên kể từ đợt 136
  (#90?→#91?).
- **Gap #92?→#93? = 9.473 s (2h37'53") VẪN CHỈ LÀ SPAN** — đoạn A
  mù #56 mở (tối đa 1 ẩn quy ước / 3 ẩn cộng dồn; ĐÃ RECHECK đợt
  này — xem §2.6). **CERT/FULL không tính gap này.**
- **Gap #91?→#92? = 6.838 s (1h53'58") VẪN CHỈ LÀ SPAN** — đoạn B
  mù #55 mở (tối đa 2 ẩn quy ước / 3 ẩn cộng dồn; ĐÃ RECHECK đợt
  này — xem §2.6). **CERT/FULL không tính gap này.**
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

**Cross-check tái hiện T2(136) + T2(137) 100%:** chạy
blind56-gaps.py verbatim cho lại đúng CERT n=54 / FULL n=69 của
T2 đợt 137 (xem blind57-gaps.txt: CERT54 mean 1h32'48" median
1h47'34" p10 0h26'45" p90 2h18'35" sd 0h46'27" min 0h00'55" max
3h14'08"; FULL69 mean 1h40'08" median 1h49'17" p10 0h27'29" p90
2h26'04" sd 0h57'25" min 0h00'55" max 5h43'18"; in 90–150' = 34,
<60' = 17, >180' = 6, >240' = 2 — khớp T2-137 §2.5 từng số, và
chuỗi exec lồng nhau tái hiện cả T2-136). 1 gap mới vào nên CERT
54→55 / FULL 69→70.

- **CERT n=55 (mới):** mean 1h32'44" median 1h46'28" p10
  0h26'54" p90 2h17'50" sd 0h46'01" min 0h00'55" max 3h14'08".
- **FULL n=70 (mới):** mean 1h39'58" median 1h48'59" p10
  0h27'38" p90 2h25'56" sd 0h57'01" min 0h00'55" max 5h43'18";
  in 90–150' = 34, <60' = 17, >180' = 6, >240' = 2.
- Độ nhạy LO/HI (gap mới ở cận dưới/trên của khoảng): CERT55-LO
  = CERT55-HI và FULL70-LO = FULL70-HI (khoảng ±10 s không làm
  dịch phân vị ở độ chính xác này — cùng mẫu các đợt trước).
- **Dải chứng nhận [0h00'55", 3h14'08"] — không đổi** (gap mới
  5.330 s nằm trong dải).
- **Dải cơ học cho #95? (p10–p90 FULL70): [10:03:39Z,
  12:01:56Z 18/11]** — từ btime #94? 09:36:01Z; dải hiệu dụng sau
  probe #57: [11:39:07Z, 12:01:56Z].
- **Dải cơ học cho #94? ĐÃ ĐÚNG (không phải sai số):**
  [08:34:40Z, 10:33:14Z] (p10–p90 FULL69, T2-137 §2.5 — kiểm lại
  bằng code đợt này khớp từng giây) vs thực tế 09:36:01Z —
  **INSIDE**. Chuỗi INSIDE bắt đầu lại ở 1 lần liên tiếp.
- **Tốc độ reboot (đồng hồ ghi nhận):** 94 / 181,30 h = **1 reboot
  mỗi 115,7 phút** (từ #1 2026-11-10T20:18:10Z tới #94?
  2026-11-18T09:36:01Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 98 / 181,30 h = **1 mỗi 111,0 phút**; +3 nữa
  (mù #53 đoạn B tối đa 3) → 101 / 181,30 h = **1 mỗi 107,7
  phút**; +2 nữa (mù #55 đoạn B tối đa 2, quy ước) → 103 /
  181,30 h = **1 mỗi 105,6 phút**; +1 nữa (mù #56 đoạn A tối đa 1,
  quy ước) → 104 / 181,30 h = **1 mỗi 104,6 phút**; **+0 nữa
  (mù #57 ĐÓNG, tối đa 0) → 104 / 181,30 h = 1 mỗi 104,6 phút**
  (đọc cộng dồn: mù #55 đoạn B tối đa 3 → 105 / 181,30 h = **1
  mỗi 103,6 phút**; mù #56 đoạn A tối đa 3 → 106 / 181,30 h =
  **1 mỗi 102,6 phút**). Chưa tính ẩn danh nghĩa tối đa của mù
  #35 (+24), mù #37 (+29), mù #38 đoạn G (+6), mù #39 đoạn J (+2),
  mù #40 đoạn B (+1), mù #43 đoạn B (+3), mù #44 đoạn D (+5), mù
  #45 đoạn G1 (+4), mù #46 đoạn A (+4), mù #48 đoạn A (+2), mù
  #49 đoạn B (+1), mù #51 đoạn B (+3).
  Mù #50: **+0** (đóng hoàn toàn). Mù #52: **+0** (đóng hoàn
  toàn). Mù #53: **+3** (đoạn B mở — recheck đợt 137 xác nhận).
  Mù #54: **+0** (đóng hoàn toàn). Mù #55: **+2 (quy ước) / +3
  (cộng dồn)**. Mù #56: **+1 (quy ước) / +3 (cộng dồn)**.
  **Mù #57: +0 (đóng hoàn toàn) — mới.**

### 2.6 Mù #56 A + mù #55 B RECHECK đợt này + mù #53 B + mù #51 B + mù #49 B: KHÔNG kiểm lại

- **Mù #56 A: ĐÃ RECHECK đợt này (brief giao) — VERDICT KHÔNG
  ĐỔI.** Quét lại trực tiếp cả 5 phạm vi trong 3 lỗ vượt sàn
  (06:21:23Z → 06:41:57Z; 06:41:57Z → 07:07:03Z; 07:41:57Z →
  08:03:35Z) 18/11, ở độ chính xác giây (xem
  blind57-fifthscope.py + .log): **0 mốc mới TRONG LỖ**. 9 hit đều
  là **file biên phải đã biết** (xem F-138-T2-4): 6 file
  proactivity ở 06:41:57Z (cùng giây với mốc phải của lỗ 1), 1
  exec-log ở 07:07:03Z (mốc phải của lỗ 2), 2 file memory
  reconciliation ở 08:03:35Z (mốc phải của lỗ 3) — cả 9 file đều
  đã có trong danh sách blind56 đợt 137 (đối chiếu trực tiếp bằng
  grep — xem §4). Lỗ lớn nhất vẫn 1.506 s, tối đa 1 ẩn quy ước /
  3 ẩn cộng dồn. Khung chết #92? (08:05:05Z, 08:07:11Z] (126 s) —
  chuẩn parent — giữ nguyên. **Gap #92?→#93? = 9.473 s GIỮ
  SPAN.**
- **Mù #55 B: ĐÃ RECHECK đợt này (brief giao) — VERDICT KHÔNG
  ĐỔI.** Quét lại trực tiếp cả 5 phạm vi trong cửa sổ lỗ
  (04:42:27Z, 05:29:18Z] 18/11, ở độ chính xác giây: **0 mốc
  mới**. Lỗ lớn nhất vẫn 2.811 s (04:42:27Z → 05:29:18Z, tính
  thêm phạm vi thứ 5) / 2.843 s (merged 4 phạm vi), tối đa 2 ẩn
  quy ước / 3 ẩn cộng dồn. Khung chết #91? (04:42:27Z, 05:29:18Z]
  (2.811 s) — chuẩn parent — giữ nguyên. **Gap #91?→#92? =
  6.838 s GIỮ SPAN.**
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

### 2.7 Quét writeFileSync lần thứ 44 — chênh 0 (lần thứ 44 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round138-t2, đã đổi OUT
  sang round138-t2) **11:48:37Z → 11:49:13Z 18/11 (36 s, có
  SCAN-END)**. **Scan chạy trên boot #94?** — kết quả vẫn hợp lệ
  vì scan chỉ đếm code hiện tại trên đĩa, không phụ thuộc boot hay
  giờ mù.
- NEWSTD: **915 dòng / 256 file** (phạm vi 3.146 file); R7b đối
  chiếu: **940 dòng / 273 file** (phạm vi 12.539 file); copies:
  **25 dòng / 17 file** — y hệt lần 43 về copies. Đối chiếu chéo:
  915+25=940=R7b, **chênh 0**.
- **+8 dòng / +3 file so với lần 43** (907/253 → 915/256), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + diff
  từng dòng — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND137_LIMITS.md | +1 (0 → 1) | 10:44:21Z 18/11 | LIMITS gộp đợt 137 (nhắc `writeFileSync` 1 lần ở §2.7); viết SAU scan lần 43 (09:00:32Z 18/11) nên lần này mới vào |
  | docs/PHASE9_ROUND137_T2_EPERM_LIMITS.md | +5 (0 → 5) | 09:15:11Z 18/11 | Tài liệu T2 đợt 137 (nhắc `writeFileSync` 5 lần); viết SAU scan lần 43 (09:00:32Z) nên lần này mới vào |
  | docs/PHASE9_ROUND138_T5_INFRA_LIMITS.md | +2 (0 → 2) | 11:43:55Z 18/11 | Tài liệu T5 đợt 138 (đã viết trước scan lần 44); nhắc `writeFileSync` 2 lần |
  1+5+2 = 8 dòng. ✓ (Chuỗi đầy đủ: lần 42 là 901/251 (scan
  06:09:39Z); lần 43 là 907/253 (+6/+2 do 2 LIMITS đợt 136);
  lần 44 là 915/256 (+8/+3 do 2 LIMITS đợt 137 + 1 LIMITS đợt
  138-T5). Tổng +14/+5 so với lần 42 — khớp diff trực tiếp với
  file lần 42.)
- Phạm vi: 3.146 = 3.126 + 20 net (**20 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 20 file mới gồm DEF_v0.5.md +
  5 LIMITS đợt 136 + 10 LIMITS đợt 137 + 4 LIMITS đợt 138 đã viết
  trước scan (T1/T3/T5/T6); 0 file mất). Copies y hệt lần 43
  (diff 0 dòng).
- **Kết luận: 44 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #57.

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
  né EPERM trong mù #57.

## 3. RAM trong mù #57 — max 6.623 MiB (VƯỢT guard lần đầu), birefnet KHÔNG chạy bởi T2

- **3 mẫu MemAvailable trực tiếp của lượt (đoạn B + lúc đóng):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 11:38:23Z | **627.184 kB** (612 MB) | Trước probe #57 (boot #94?, đoạn B) — THẤP, balloon đang siết |
  | 11:39:11Z | **808.384 kB** (789 MB) | Sau probe #57 (boot #94?, đoạn B) — đang hồi |
  | 11:39:16Z | **771.296 kB** (753 MB) | Xác minh boot lại (boot #94?, đoạn B) |
  | 11:47:55Z | **3.183.048 kB** (3.109 MB) | Trong lúc quét RAM (boot #94?, đoạn B) — hồi mạnh |
  | 11:51:36Z | **6.204.548 kB** (6.059 MB ≈ 5.919 MiB) | Lúc đóng phiên T2 (boot #94?, đoạn B) — NGOÀI mù #57; balloon hồi nhanh, còn thiếu ~85 MiB tới guard 6.144 MiB; **để T9-138 biết: cửa sổ vượt guard có thể đang mở ra lúc T2 đóng** |
- **Max RAM biết được TRONG mù #57: 6.781.936 kB ≈ 6.623 MiB
  (T5-137, 09:00:26Z, đoạn A, Balloon 0) — VƯỢT guard 6.144 MiB
  LẦN ĐẦU TIÊN.** Nguồn: T5-137 LIMITS §9.2 (đo trực tiếp theo
  MemAvailable; chuỗi T5: 753 MB (08:41Z) → 1.932 MB (08:46Z) →
  1.112 MB (08:51Z) → 4.433 MB (08:58Z) → **6.781 MB (09:00:26Z,
  Balloon 0)** → 5.928 MB (09:02Z) → 3.524 MB (09:08Z) → 1.340 MB
  (09:19Z) → 1.068 MB (09:21Z) → 518 MB (09:31Z)). Đợt 136 cao
  nhất chỉ 6.081 MB (≈5,83 GiB), dưới guard — đây là lần đầu
  guard bị vượt.
- **Corroboration độc lập từ T4-137 (đếm bằng code — xem
  ram-max.txt):** 210 mẫu RAM; 5 poll khác nhau ≥ 6.144 MiB trong
  08:59:39Z–09:01:10Z (đoạn A): 6.693 MB (poll #22, 09:00:25Z),
  6.608 MB (poll #21, 08:59:39Z), 6.549 MB (T5 wait-replay poll
  16, 09:00:47Z), 6.511 MB (poll 15, 08:59:47Z), 6.414 MB (poll
  #23, 09:01:10Z). Đoạn A max theo ram-max57.py: **6.693 MB**
  (09:00:25Z); đoạn B max **1.847 MB** (09:37:39Z — ngay sau
  reboot #94?, balloon siết mạnh). Lưu ý đơn vị: T4/T5 ghi "MB"
  theo kB/1000 (quy ước các đợt trước — vd MemAvailable trực tiếp
  2.430.996 kB được ghi "2.431 MB" ở đợt 137); dù đọc theo MiB
  (kB/1024) thì 6.781.936 kB = 6.623 MiB vẫn VƯỢT guard 6.144
  MiB — kết luận không phụ thuộc đơn vị.
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Cửa sổ vượt guard ĐÃ XUẤT HIỆN trong mù #57 (09:00:26Z, đoạn A)
  nhưng T5-137 KHÔNG thử (không thuộc brief T5) và T2-138 KHÔNG
  thử (không thuộc brief T2; việc thử thuộc T9-138 theo quyết
  parent đợt 137 §12.3(f): "GIAO RÕ T9-138 thử birefnet khi cửa sổ
  mở"). u2net là fallback chính thức. **Lưu ý cho T9:** mẫu trực
  tiếp 6.204.548 kB lúc 11:51:36Z (ngoài mù) cho thấy balloon đang
  hồi nhanh trên boot #94? — nếu một lượt sau (hoặc chính T9 đợt
  này) quan sát được ≥ 6.144 MiB thì đủ điều kiện thử birefnet
  theo quyết §12.3(f); lượt này T2 chưa thử.
- Caveat phương pháp (F-138-T2-6): ram-max57.py chỉ bắt được mẫu
  cao nhất 6.693 MB — mẫu cao hơn của T5 (6.781.936 kB) không vào
  danh sách vì dòng log gốc không mang timestamp ISO-T trên cùng
  dòng (regex của script yêu cầu `2026-11-18T…`); T2 tìm ra bằng
  cách đối chiếu LIMITS của T5. **ram-max là cận dưới, không phải
  max tuyệt đối** — luôn đối chiếu LIMITS sibling.

## 4. Ghi chú phương pháp + kiểm prereg

1. **Prereg đợt này KHÔNG có dự báo sai — tất cả các dự báo chính
   đều đúng:** dải cơ học cho #94? INSIDE (prereg §1 dự báo đúng);
   probe #57 ok=2 fail=0 + log +3 (đúng); đoạn A "có khả năng
   ĐÓNG cao" (đúng — đóng với tối đa 0 ẩn); đoạn B đóng bằng
   uptime (đúng); recheck #56 A + #55 B đều 0 mốc mới (đúng);
   EPERM 0 sóng thật + WFS chênh 0 (đúng). Không có sai số dự báo
   nào lượt này (khác F-137-T2-1).
2. **F-138-T2-1 — adapt script vòng 1 làm hỏng B0 của
   blind57-merged.py do bare-time map nối tiếp (mới, cùng lớp lỗi
   F-137-T2-2/3):** sau khi TIME_MAP đổi "05:50:26Z"→"08:45:46Z",
   BARE_MAP đổi "08:45:46"→"11:39:07" đã bắt luôn chuỗi vừa viết
   (bare "08:45:46" khớp bên trong "08:45:46Z") — B0 thành
   11:39:07Z, SEG A bắt đầu 11:39:07Z. Đã phát hiện bằng grep kiểm
   toàn bộ hằng số TRƯỚC khi chạy (bài học F-137-T2-2/3) và sửa
   bằng edit trực tiếp. **KHÔNG dùng số nào từ bản lỗi.**
   Bài học: KHÔNG BAO GIỜ dùng bare-time map sau Z-map — chỉ dùng
   placeholder cho Z-form, docstring sửa bằng edit trực tiếp.
3. **F-138-T2-2 — adapt vòng 2 abort giữa chừng, để lại 3 script
   chưa adapt (mới):** assert `"blind56" in src` thất bại ở
   eperm-sweep57.py (file chỉ có `"blind#56"`, không có `"blind56"`
   trần) — script abort TRƯỚC khi ghi sweep/ram-max/scan-wfs.
   Đã phát hiện bằng grep verify (sweep vẫn B0/B1 cũ) và adapt
   lại vòng 3 bằng placeholder-only (không bare map, extra đúng
   chuỗi). **KHÔNG dùng số nào từ bản lỗi.**
4. **F-138-T2-3 — blind57-investigate.py: biến b92/b93 chưa đổi tên
   thành b93/b94 (mới):** TIME_MAP đổi btime trong code nhưng
   không đổi tên biến — `b93 = 09:36:01Z` (thực chất là btime
   #94?) và `b92 = 05:29:18Z` vẫn đứng. Đã phát hiện khi đọc lại
   phần floor arithmetic TRƯỚC khi chạy và sửa thành b93 =
   08:07:11Z, b94 = 09:36:01Z + nhãn gap #93?→#94?. Số gap in ra
   (5.330 s) là đúng vì phép trừ dùng đúng hai btime; chỉ tên biến
   và nhãn sai. **KHÔNG có số liệu sai nào từ lỗi này.**
5. **F-138-T2-4 — recheck #56 A: 9 hit đều là file biên PHẢI đã
   biết (mới, §2.6):** cửa sổ recheck `(t0, t1]` bao gồm cả giây
   biên phải — 6 file proactivity ở 06:41:57Z + 1 exec-log ở
   07:07:03Z + 2 file memory reconciliation ở 08:03:35Z đều là
   mốc phải của ba lỗ (đã có trong danh sách blind56 đợt 137, đối
   chiếu trực tiếp bằng grep). Nội lỗ: **0 mốc mới**. Đây là ảnh
   gương của F-137-T2-4 (bên đó là biên TRÁI 22:16:31.872Z).
   Bài học: recheck lỗ phải loại trừ CẢ HAI biên (trái + phải)
   trước khi đếm — cửa sổ nội lỗ là `(t0, t1)` mở cả hai đầu ở độ
   chính xác giây.
6. **F-138-T2-5 — file output scan WFS của T2-137 KHÔNG có trên
   đĩa (mới, §2.7):** round137-t2 chỉ còn scan-wfs.sh; các file
   wfs-*.txt / files-*.bin / scan-meta.txt mà T2-137 §5 liệt kê
   đều không tồn tại (tìm toàn cây hidden_files cũng không thấy).
   T2-138 đã xác minh chuỗi WFS bằng baseline lần 42 (round136-t2,
   901/251) + số công bố lần 43 (907/253): 901→907 (+6/+2 do 2
   LIMITS đợt 136) →915 (+8/+3 do 2 LIMITS đợt 137 + 1 LIMITS
   đợt 138-T5) — khớp diff trực tiếp. Không đổi verdict nào
   (chênh 0 lần 44 vẫn đứng).
7. **F-138-T2-6 — ram-max57.py bỏ sót mẫu RAM cao nhất của T5
   (mới, §3):** mẫu 6.781.936 kB (09:00:26Z) không vào danh sách
   vì dòng log gốc không mang timestamp ISO-T trên cùng dòng
   (regex yêu cầu `2026-11-18T…`). T2 tìm ra bằng cách đối chiếu
   LIMITS T5-137 §9.2. Bài học: ram-max chỉ là cận dưới; luôn đối
   chiếu LIMITS sibling trước khi chốt max RAM.
8. **F-138-T2-7 — prereg §1 ghi khoảng gap là [5.316 s, 5.330 s]
   (mới, đính chính quy ước):** đó là khoảng suy từ khung chết
   14 s, NHƯNG khoảng chứng nhận theo quy ước đã dùng cho mọi gap
   trước là **±10 s quanh danh nghĩa** → [5.320 s, 5.340 s], mid
   5.330 s không đổi. Độ nhạy LO/HI cho thấy ±10 s không dịch
   phân vị. Không đổi số CERT/FULL.
9. **Docstring các script blind57 đã kiểm cửa sổ (mới):**
   investigate/sessions/merged/gaps/fifthscope/sweep/ram-max đều
   ghi đúng cửa sổ (08:45:46Z → 11:39:07Z 18/11) + SEGS 2 đoạn
   viết mới — đã kiểm bằng grep trước khi chạy (bài học T2-133 §4
   mục 6: kiểm SEGS sau khi adapt; F-138-T2-1/2/3 là ba lỗi adapt
   đã bắt bằng chính bước kiểm này).
10. **T6-138 chưa công bố chuỗi lúc T2 đóng (mới):** thư mục
    round138-t6 lúc T2 đóng chỉ có file mở phiên (status-open,
    analyze-log, ps-full-open, ss-open, vite-lock-v2-cleaned-open)
    + cờ round138-t6.done — chưa có LIMITS. Số #94? vẫn chờ T6
    chốt chuỗi tương đối #58→#94?. T10 đối chiếu khi đóng sổ.
    (Tiền lệ: các đợt trước T6 thường công bố sau T2; không phải
    sai số. Lần này merged đã loại bỏ khả năng reboot ẩn nên số
    #94? vững hơn mọi lần trước.)
11. **preview.tsx 530e10a7 GIỮ VĨNH VIỄN — theo quyết parent, không
    phải sai số (mới, §0):** md5 530e10a7 — fix instrumentation
    của T3-134 theo quyết parent đợt 137 §12.3(a) (GIỮ VĨNH VIỄN,
    từ đợt 138 chỉ giám sát thụ động điều tra (c2)). media.ts
    KHÔNG ĐỔI 2c384ed1; vite.config.ts (apps/web/) KHÔNG ĐỔI
    ee80d093. T2 không sửa production file nào.
12. **R9 (a): SỐ ĐẾM VẪN LÀ 16 — KHÔNG tăng (nhắc lại, §0):**
    quyết parent đợt 134 §12.3(d) đã đính chính T5-134 viết
    "nhắc lần 17" là sai; số đếm giữ 16. File LIMITS này KHÔNG
    viết số 17 ở bất cứ đâu cho R9 (a).

## 5. Hồ sơ + stage

- **LIMITS này:** `docs/PHASE9_ROUND138_T2_EPERM_LIMITS.md`
  (oversize >37.768 B — chỉ stage paths, không push, như các
  LIMITS oversize đợt 134–137).
- **Thư mục làm việc:** `hidden_files/round138-t2/` — prereg-t2.md,
  boot-verify.txt, f94.txt, status1/once/status2 + .exit,
  blind57-investigate.py + .log, blind57-sessions.py + .log,
  blind57-merged.py + .log, blind57-gaps.py + .txt,
  blind57-fifthscope.py + .log, blind57-repo-1.txt,
  blind57-hidden_files.txt, blind57-outside.txt, blind57-tmp.txt,
  sessions-all.txt, eperm-sweep57.py + eperm-sweep-run.log,
  ram-max57.py + ram-max.txt, scan-wfs.sh + scan-meta.txt +
  files-*.bin + wfs-*.txt.
- **Stage (KHÔNG push):** `phase9-round138-t2-eperm.txt`
  (NUL-delimited, 1 entry: LIMITS này; verify read-back trước khi
  đóng cờ).
- **Cờ:** `hidden_files/round138-t2.done`.
- **Mù #58 MỚI MỞ** từ probe #57 (11:39:07Z 18/11) — việc của T2
  đợt 139. Dải cơ học cho #95?: [10:03:39Z, 12:01:56Z]; dải hiệu
  dụng sau probe #57: [11:39:07Z, 12:01:56Z].

## 6. Hậu kỳ — REBOOT #95? PHÁT HIỆN LÚC ĐÓNG PHIÊN (sau lần kiểm cuối 11:51:36Z)

> Ghi thêm sau khi stage xong, lúc kiểm boot cuối trước khi đóng cờ
> (11:55:20Z). Mọi đo đạc của phiên T2 đã xong trước reboot này;
> không có số liệu nào trong §0–§5 bị ảnh hưởng (tất cả đều đọc
> trên boot #94? trước 11:51:36Z).

- **Boot mới `914964c3-c36a-4893-bf24-d8321e75d299`, btime
  11:52:20Z** (1795002740) — xác minh bằng `uptime -s` 2026-11-18
  11:52:20 + btime + `who -b` Nov 18 11:52 + journal chỉ 1 boot
  (914964c3, first entry 11:52:36Z — chậm hơn btime 16 s, cùng mẫu
  #92?/#93?/#94?). MemAvailable trên boot mới: 1.346.120 kB lúc
  11:55:34Z.
- **Cửa sổ reboot: (11:51:36Z, 11:52:20Z]** — lần kiểm cuối còn
  thấy 17db9652 (uptime -s 09:36:01Z, MemAvailable 6.204.548 kB)
  lúc 11:51:36Z; btime boot mới 11:52:20Z. Khung chết #94? là
  (mốc cuối trên #94?, 11:52:20Z] — mốc cuối T2 xác minh được trên
  #94? là lần kiểm 11:51:36Z (các file T2 ghi trong 11:52–11:55Z
  nằm vắt qua reboot nên không dùng làm mốc); T2-139 sẽ chốt khung
  chết #94? từ merged của mù #58.
- **Đây là reboot GIỮA PHIÊN T2 (tiền lệ T2-134):** phiên T2 mở
  11:37Z trên boot #94? và đóng 11:55Z trên boot mới. Khác T2-134
  ở chỗ reboot này xảy ra SAU khi mọi đo đạc (probe, merged, gaps,
  sweep, WFS, RAM) đã xong — chỉ còn việc ghi file + stage. Không
  có số liệu nào phải đo lại.
- **Hồ sơ file sau reboot:** LIMITS này, paths file
  phase9-round138-t2-eperm.txt và cờ round138-t2.done đều được
  ghi/xác minh SAU reboot (mtime 11:55Z trên boot mới) — file nằm
  trên đĩa persistent (~/workspace), không mất mát. dpkg.log của
  boot mới lúc 11:55:49Z chỉ có 2 dòng (startup packages configure
  11:53:11Z/11:53:12Z) — replay mới bắt đầu (boot +51 s); bracket
  #95? thuộc về T2-139/T5-139.
- **Hệ quả cho đợt sau:** mù #58 mở từ probe #57 (11:39:07Z) nay
  CHỨA 1 reboot (11:52:20Z) — ứng viên boot **#95?** (tạm, nếu
  không có reboot ẩn giữa probe #57 và 11:52:20Z; T6-139 chốt
  chuỗi). Dải cơ học cho #95? ở §2.5 là [10:03:39Z, 12:01:56Z] —
  thực tế 11:52:20Z NẰM TRONG dải (INSIDE, chờ T2-139 xác nhận
  chính thức bằng merged). Gap danh nghĩa #94?→#95? = 11:52:20Z −
  09:36:01Z = **8.179 s (2h16'19")** — T2-139 chứng nhận/không
  theo kết quả merged mù #58.
- **F-138-T2-8 — "KHÔNG reboot giữa phiên" viết quá sớm (mới):**
  §0 và §2.1 ban đầu viết "KHÔNG có reboot giữa phiên T2" dựa
  trên lần kiểm cuối 11:51:36Z, trong khi phiên chỉ thực sự đóng
  ở ~11:55Z. Reboot xảy ra đúng trong khoảng trống đó. Bài học:
  câu "không reboot giữa phiên" chỉ được viết SAU lần kiểm boot
  cuối cùng ngay trước khi đóng cờ — T2 đợt này đã sửa lại §0/§1/§2.1
  và ghi §6 này thay vì giữ câu cũ.
