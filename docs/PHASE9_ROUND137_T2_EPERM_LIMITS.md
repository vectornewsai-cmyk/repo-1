# PHASE9 ROUND137 T2 — EPERM: probe #56 ok=2 fail=0 + mù #56 HỞ đoạn A (tối đa 1 ẩn) + boot #93? NGOÀI dải dự báo 710 s + gap #92?→#93? GIỮ SPAN + CERT/FULL KHÔNG ĐỔI + recheck mù #55 B / #53 B KHÔNG ĐỔI + dpkg replay #93? CHƯA XONG lúc đóng

> Luồng T2, đợt 137 vòng lặp Phase 9 VCut Studio (lượt cron 15:35 +07
> 18/11/2026; làm việc 08:39Z → ~09:07Z 18/11/2026).
> Nhiệm vụ: probe #56 theo lịch thường lệ + mù #56 (từ probe #55) +
> recheck mù #55 B + mù #53 B (brief giao) + boot mới #93? + quét sóng
> EPERM + WFS lần 43. Quyết parent đợt 136 §12.3: (a) GIỮ fix 530e10a7
> qua đợt 137, lượt yên #14 LÀ LƯỢT QUYẾT ĐỊNH; (b) GIỮ NGUYÊN prereg
> P5/P6 qua #14; (c) GIỮ ngưỡng ≤60 ms; **(d) XÁC NHẬN khung chết #90?
> bản hẹp (03:34:51Z, 03:35:20Z] (29 s) làm chuẩn, khung 177 s giữ làm
> biên ngoài**; **(e) XÁC NHẬN khung chết #91? bản hẹp (04:42:27Z,
> 05:29:18Z] (2.811 s) làm chuẩn**, bản ghi chính (04:19:07Z,
> 05:29:18Z] (4.211 s) đứng nguyên; (f) GIỮ NGUYÊN guard birefnet
> 6.144 MiB; **(g) Mù #55 B: headline giữ 2, ghi kèm 3 bảo thủ**;
> (h) bắt buộc log ps snapshot khi blockers>0 (T4); (i) phê duyệt 4
> bước kiểm điều tra kẹt (T8); (j) cửa scheduler gãy chỉ ghi nhận;
> (k) headroom chỉ theo dõi; (l) CHẤP NHẬN đóng đợt 136 9/9. Prereg
> viết TRƯỚC khi đo: hidden_files/round137-t2/prereg-t2.md.
> **Dải dự báo cho #93? SAI — OUTSIDE 710 s** (dự báo của T2-136, xem
> §4 F-137-T2-1; không phải lỗi đo). KHÔNG push, KHÔNG release/tag,
> KHÔNG binary, KHÔNG workflow, KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG
> kiểm lại mù #47 (ĐÃ ĐÓNG HOÀN TOÀN đợt 128) / mù #46 đoạn A /
> mù #45 đoạn G1 / mù #44 đoạn D / mù #40 đoạn B / mù #43 / mù #42
> đoạn B** (quyết parent đợt 124 §12.3 + §12.4, đợt 125 §12(h),
> đợt 126 §12(h), đợt 127 §12(c)). **Mù #50 ĐÃ ĐÓNG HOÀN TOÀN đợt 131
> — KHÔNG kiểm lại. Mù #49 B: KHÔNG kiểm lại thường lệ** theo quyết
> parent đợt 132 §12.3(d). **Mù #51 B: KHÔNG kiểm lại đợt này** (đã
> kiểm 3 lần, verdict ổn định, không có bằng chứng mới).
> **KHÔNG có reboot giữa phiên T2 lượt này** — boot 2104246b từ lúc mở
> (08:40Z) tới lúc đóng (~09:06Z). **Số thứ tự #93? TẠM THỜI** — đoạn A
> mù #56 MỞ (tối đa 1 ẩn quy ước / 3 cộng dồn) nên boot mới có thể là
> #94? (1 ẩn) tới #96? (3 ẩn cộng dồn); T6-137 chưa công bố chuỗi lúc
> T2 đóng — chờ T6/T10 đối chiếu.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (08:45:46Z):** `status`
  báo **DEAD/STALE** (heartbeat age 10.520 s, last #55 05:50:26Z, boot
  1ca1feaa, exit 1); `once` ngay sau đó là **probe #56, boot
  2104246b, ok=2 fail=0**, exit 0, 08:45:46Z; `status` chạy lại
  **ALIVE** (age 1 s, n=56), exit 0. Log v2 tăng đúng **3 dòng**
  (157 → 160) — **như mọi lượt trước**; prereg §3 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=56, ts 08:45:46Z, boot 2104246b.
- **Boot #93? (tạm) lúc 08:07:11Z, boot
  `2104246b-04b2-4252-a642-b1a7cadeefe1`** — xác minh bằng `uptime -s`
  + btime 1794989231 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại: HTTP `Date` 3 server hơn local **+1 s / 0 s / +1 s**
  → **F93? ≈ −1 s (±~1 s)** — đo trực tiếp đầu tiên trên boot mới.
- **DẢI DỰ BÁO SAI (mới):** dải cơ học cho #93? (p10–p90 FULL69,
  T2-136 §2.5) là **[05:56:47Z, 07:55:21Z]** — thực tế **08:07:11Z
  NẰM NGOÀI dải, muộn hơn cận trên 710 s (11'50")**. Lần OUTSIDE đầu
  tiên sau chuỗi 4 lần INSIDE liên tiếp (#89?/#90?/#91?/#92?) và sau
  cụm 4 lần OUTSIDE (#85?–#88?). Đây là **dự báo sai của dải T2-136**,
  không phải lỗi đo (btime đọc trực tiếp 3 nguồn khớp nhau).
- **Khoảng mù #56 (05:50:26Z → 08:45:46Z 18/11, 2h55'20" =
  10.520 s) — HỞ ĐOẠN A, tối đa 1 ẩn (quy ước) / 3 ẩn (cộng dồn).**
  Đoạn A MỞ (merged 148 mốc, lỗ lớn nhất **1.506 s** 06:41:57Z →
  07:07:03Z + lỗ lớn thứ hai **1.298 s** 07:41:57Z → 08:03:35Z + lỗ
  lớn thứ ba **1.234 s** 06:21:23Z → 06:41:57Z — **cả ba đều vượt sàn
  1.147 s**); đoạn B ĐÓNG bằng uptime trực tiếp (merged 47 mốc, lỗ
  lớn nhất 1.461 s là head, tail 5 s). Merged 196 mốc giây. Chuỗi mù
  đóng hoàn toàn dừng ở #54 (chuỗi: #50 đóng, #51 hở, #52 đóng, #53
  hở, #54 đóng, #55 hở, **#56 hở**).
- **Gap #92?→#93? = 9.473 s GIỮ SPAN** (đoạn A mù #56 mở).
  **CERT n=54 / FULL n=69 KHÔNG ĐỔI** (không có gap mới chứng nhận
  được). Dải cơ học mới cho #94?: [08:34:40Z, 10:33:14Z]; dải hiệu
  dụng sau probe #56: [08:45:46Z, 10:33:14Z].
- **Gap #91?→#92? = 6.838 s GIỮ SPAN — recheck mù #55 B KHÔNG ĐỔI:**
  quét lại trực tiếp cả 5 phạm vi trong lỗ (04:42:27Z, 05:29:18Z],
  **0 mốc mới**.
- **Gap #83?→#84? = 6.318 s GIỮ SPAN — recheck mù #53 B KHÔNG ĐỔI:**
  quét lại trực tiếp cả 5 phạm vi trong lỗ (22:16:31Z, 23:26:58Z]
  17/11, **0 mốc giây mới** (1 hit float là file biên đã biết
  22:16:31.872Z — xem §2.6).
- **Khung chết #92? (mới): (08:05:05Z, 08:07:11Z] (126 s)** — mốc
  cuối là các file memory reconciliation 08:05:05Z (4 file, cùng giây,
  ở cả 4 phạm vi merged + phạm vi thứ 5 ~/memory); không có file nào
  muộn hơn trong (08:05:05Z, 08:07:11Z] ở cả 5 phạm vi. Khung chết
  #90? (03:34:51Z, 03:35:20Z] (29 s) + #91? (04:42:27Z, 05:29:18Z]
  (2.811 s) — chuẩn parent đợt 136 — không đổi.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 47 file
  *.log có mtime trong mù #56 (0 file repo-1, 47 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8, xem §2.7). Quét mở rộng: **8 match thô / 8 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher). Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** —
  **~164,6h** trước probe #56. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 43: 907 dòng / 253 file** (phạm vi 3.133
  file); R7b đối chiếu 932 dòng / 270 file; copies 25 dòng / 17
  file — y hệt lần 42 về copies. Đối chiếu chéo 907+25=932=R7b,
  **chênh 0 — lần thứ bốn mươi ba liên tiếp**. +6 dòng / +2 file so
  với lần 42, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray.
- RAM: max biết được trong mù #56 **3.678 MB** (T4-136 load-mid,
  05:50:32Z, đoạn A) — xa dưới guard; đoạn B max **2.421 MB**
  (T4-137 poll #1, 08:44:34Z). **Birefnet KHÔNG chạy — 3.678 MB vẫn
  DƯỚI guard 6.144 MiB** (quyết §12.3(f) đợt 136 vẫn đứng).
  MemAvailable trực tiếp lượt này: 2.431 MB lúc 08:45:02Z; 2.049 MB
  lúc 08:46:15Z; **4.647 MB lúc 09:05:48Z (ngoài mù #56 — balloon
  hồi sau khi replay dpkg lặng)**.
- **dpkg.log boot #93? — replay CHƯA XONG lúc T2 đóng (mới, khác mọi
  bracket trước):** đọc lần 1 lúc 08:45Z chỉ **73 dòng / 11 installs
  / 23 configure** (replay mới chạy); 08:58Z: 471/69/141; lúc đóng
  09:06Z: **566 dòng / 83 installs / 170 configure**, lần ghi cuối
  09:01:42Z (fontconfig), lặng ≥4 phút — **chưa chứng minh xong**.
  Gói đầu libaspell15 08:43:11Z; gstreamer1.0-gl 08:50:48Z. Replay bắt
  đầu 08:31:35Z (boot +24m24s — muộn hơn #92? là boot +13m16s).
  **Bracket này là số tạm lúc đóng, KHÔNG phải bracket chuẩn** — T5-137
  (chủ quản postboot) xác nhận chính thức. (Xem §2.1 + F-137-T2-5.)
- **preview.tsx 530e10a7** (fix GIỮ theo quyết parent đợt 136
  §12.3(a)); media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts KHÔNG ĐỔI
  ee80d093. T2 không sửa production file nào.
- **Đợt 137 lúc T2 đóng (~09:06Z 18/11):** các luồng khác đang chạy
  (round137-t1/t3/t4/t5/t6/t8/t9 có file mới trong đoạn B); boot hiện
  tại #93? (kiểm 09:05:48Z). T6-137 CHƯA công bố chuỗi boot lúc T2
  đóng — số #93? vẫn tạm, chờ T6/T10 đối chiếu. T2 KHÔNG mở Xvfb
  (không cần) nên không có gì để kill.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 08:45:02Z | boot_id `2104246b-04b2-4252-a642-b1a7cadeefe1`; `who -b` Nov 18 08:07; `uptime -s` **2026-11-18 08:07:11**; btime **1794989231 = 2026-11-18T08:07:11Z**; journal chỉ 1 boot (2104246b, first entry 08:07:27Z, last 08:44:59Z lúc kiểm tra). MemAvailable 2.430.996 kB lúc 08:45:02Z. |
| Đo F93? (HTTP Date, 3 server) | 08:45:02–08:45:05Z | example.com Date 08:45:04Z vs local_after 08:45:03Z (+1 s); google.com Date 08:45:04Z vs local_after 08:45:04Z (0 s); cloudflare.com Date 08:45:05Z vs local_after 08:45:04Z (+1 s) → **F93? ≈ −1 s (±~1 s)**. Đo trực tiếp đầu tiên trên boot mới. |
| Đọc dpkg.log bracket #93? (lần 1) | 08:45Z | **73 dòng / 11 installs / 23 configure** — replay MỚI CHẠY (gói đầu libaspell15 chưa có; chỉ có `startup packages configure` 08:31:35Z/08:31:36Z + `startup archives unpack` 08:43:10Z). **KHÔNG phải bracket chuẩn** (xem §2.1 + F-137-T2-5). |
| `bash scripts/probe-eperm-v2.sh status` | 08:45:46Z | **DEAD/STALE**, heartbeat n=55, ts 05:50:26Z, boot 1ca1feaa, age **10.520 s** (đúng 2h55'20"); last sample probe #55; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 08:45:46Z | **probe #56, boot=2104246b, ok=2 fail=0**, exit 0; dòng `boot changed 1ca1feaa -> 2104246b` (uptime since 2026-11-18 08:07:11) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~08:45:46Z | **ALIVE**, age 1 s, n=56, exit 0 |
| Xác minh boot lại (sau probe) | 08:46:15Z | Cùng boot 2104246b, `uptime -s` 08:07:11Z, btime 1794989231. MemAvailable 2.049.456 kB. |
| Đọc lại dpkg.log (lần 2) | 08:58:20Z | **471 dòng / 69 installs / 141 configure**, lần ghi cuối 08:58:05Z (libgtk-4-bin) — replay VẪN CHẠY. |
| Đọc lại dpkg.log (lần 3) | 09:01:59Z | **566 dòng / 83 installs / 170 configure**, lần ghi cuối 09:01:42Z (fontconfig). |
| Đọc lại dpkg.log (lần 4, lúc đóng) | 09:05:48Z | **566 dòng / 83 installs / 170 configure — KHÔNG ĐỔI so với lần 3**, lặng 4'06" — chưa chứng minh xong. Gói đầu libaspell15 08:43:11Z; gstreamer1.0-gl install 08:50:48Z; 49 dòng gstreamer. |
| Xác minh boot lần 3 (lúc đóng) | 09:05:48Z | Cùng boot 2104246b — **KHÔNG reboot giữa phiên T2**. MemAvailable 4.646.788 kB. |

Kiểm lại từ đĩa: log probe v2 **160 dòng** — 157 sau T2-136 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #55 +
dòng `boot changed` + dòng probe #56). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #55 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §3 đã dự báo đúng +3
trước khi đo. Heartbeat **n=56, ts 2026-11-18T08:45:46Z, boot
2104246b-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

**Về btime và journal first entry (đính chính, nối tiếp T2-136):**
btime thật là **08:07:11Z** (/proc/stat 1794989231 + `uptime -s` +
`who -b`). Journal first entry là **08:07:27Z** — chậm hơn btime
16 s (journald khởi động sau kernel boot ~16 s — cùng mẫu #92?:
first entry 05:29:34Z vs btime 05:29:18Z, cũng 16 s). Sai lệch 16 s
này KHÔNG đổi verdict nào. Ghi rõ để luồng sau khỏi lấy 08:07:27Z
làm btime.

Nguồn độc lập cho boot #93?: 5 session T2 trong vùng B (xem §2.3)
+ 47 mốc merged gộp trong vùng B (mốc đầu 08:31:32Z —
system_prompt.md; mốc cuối 08:45:41Z — t5-postboot-b90-poll1.log
của T5 đợt 137) + 0 exec-log nhắc 2104246b trong mù (nội dung log
của phiên T2 không chứa chuỗi boot_id — ghi rõ để không hiểu "0"
là thiếu bằng chứng; bằng chứng chính là uptime/btime/journal +
probe #56). **Số thứ tự TẠM THỜI** (như #69–#92?; T6-137 sẽ chốt
chuỗi tương đối, số tuyệt đối vẫn tạm; giá trị gap không phụ thuộc
số thứ tự — nhưng lần này đoạn A MỞ nên số tuyệt đối còn chưa chắc
hơn mọi lần trước: có thể là #94?–#96? nếu có reboot ẩn).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #56 (05:50:26Z → 08:45:46Z 18/11, 2h55'20" = 10.520 s)

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #56: `uptime -s` = **2026-11-18 08:07:11Z**,
  boot_id `2104246b-04b2-4252-a642-b1a7cadeefe1` — khác boot của
  probe #55 (1ca1feaa).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (08:45:02Z): chỉ **1 boot**
  (2104246b, first entry 08:07:27Z, last 08:44:59Z). Journal/wtmp
  của các boot trước đã mất theo reboot #93? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #93? — replay CHƯA XONG lúc T2 đóng (mới).**
  Lần đọc 1 (08:45Z): **73 dòng, 11 installs, 23 configure** —
  replay mới bắt đầu (startup packages configure 08:31:35Z +
  08:31:36Z, startup archives unpack 08:43:10Z; chưa có gói install
  nào). Lần đọc 2 (08:58:20Z): **471 dòng, 69 installs, 141
  configure**, lần ghi cuối 08:58:05Z (libgtk-4-bin). Lần đọc 3
  (09:01:59Z) và 4 (09:05:48Z): **566 dòng, 83 installs, 170
  configure**, lần ghi cuối 09:01:42Z (fontconfig), lặng 4'06" lúc
  đóng — **chưa chứng minh xong** (có thể đã xong, có thể đang nghỉ
  giữa hai pha; không có dòng kết thúc tường minh trong dpkg.log).
  Gói đầu libaspell15 install 08:43:11Z; gstreamer1.0-gl install
  08:50:48Z; 49 dòng gstreamer; các pha configure/unpack xen kẽ
  (configure 08:31:35Z → unpack 08:43:10Z → configure 08:43:11Z →
  unpack 08:43:37Z → ...). Replay bắt đầu **boot +24m24s** — muộn
  hơn hẳn #92? (boot +13m16s, gói đầu 05:42:34Z) và dài hơn hẳn
  (≥30 phút vs ~3 phút của #92? — #92? xong trong 05:42:34Z →
  05:45:44Z). **Hình dạng khác hẳn baseline 1.545 dòng / 221
  installs của #82?/#83?/#84?/#90?/#92?** — có thể lần này là đợt
  nâng cấp gói thật (unattended-upgrades cài bản mới: libgtk-4-bin,
  fontconfig, xfonts-utils...) chứ không phải replay configure khô
  như các boot trước; hoặc replay bị chậm vì máy tải nặng (9 luồng
  đợt 137 + T5 chờ replay). **T5-137 là chủ quản postboot — bracket
  chính thức thuộc về T5; số 566/83/170 của T2 chỉ là số tạm lúc
  đóng.** (Hồ sơ đầy đủ thuộc về T5-137.)
  **dpkg.log của boot #92? (1ca1feaa) đã MẤT** (file lúc T2 kiểm chỉ
  còn log của boot mới): /var/log reset mỗi boot. Bản ghi T2-136
  (bracket #92?: 1.545 dòng / 221 installs / 462 configure) là bằng
  chứng còn lại cho boot đó — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**KHÔNG có reboot giữa phiên T2 lượt này:** boot 2104246b xác minh
lúc 08:45:02Z (mở lượt), 08:46:15Z (sau probe #56) và 09:05:48Z
(lúc đóng) — cùng boot_id + btime 08:07:11Z. (Tiền lệ: T2-134 gặp
reboot giữa phiên; lượt này không gặp.)

### 2.2 Reboot đã chốt trong mù — #93? (mới, TẠM THỜI) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 93? | **08:07:11Z** (chính xác từng giây) | 1ca1feaa → 2104246b | Chốt từ lượt này: `uptime -s` đọc tươi (08:45:02Z + kiểm lại 08:46:15Z + 09:05:48Z) + btime 1794989231 + `who -b` 08:07 + boot_id 2104246b + journal first entry 08:07:27Z + probe #56 08:45:46Z boot 2104246b ok=2 fail=0 + 5 session trong vùng B. **Số thứ tự TẠM THỜI — và lần này còn chưa chắc hơn mọi lần trước (đoạn A mở, xem dưới).** |

**Clock:** F93? ≈ **−1 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` 3 server: example.com
+1 s, google.com 0 s, cloudflare.com +1 s (độ chi tiết 1 s của HTTP
Date). **F93? là lần đo trực tiếp đầu tiên trên boot #93?** — không
dùng cận hai lần đo. F92? ≈ −1 s (±~1 s, đã đo đợt 136). Hai đầu
chuỗi đo được (F92?, F93?) đều ≈ −1 s — đồng hồ local ổn định ở mức
chậm ~1 s ở cả hai đầu; xem §2.5 về cách caveat này được xử lý.

**CẬN NHẢY CLOCK TẠI REBOOT (0 nhân chứng nhảy):**
- **0 nhân chứng nhảy tại #93?:** **0 session** sinh trước
  btime có mtime sau btime (quét 244 exec-log).
- Cận session: **|X93?| < 2.920 s** (session muộn nhất 07:18:31Z —
  cận LỎNG, vì sau 07:18:31Z không còn session nào viết; cận chặt
  thật cho khung chết là mốc merged 08:05:05Z — xem khung chết dưới).
- Session sớm nhất sau btime: 08:40:48Z (phiên main agent
  18112f2e, spawn lượt cron đợt 137).
- **Ranh giới sạch hoàn toàn:** 0 file trong
  (btime +0 s, +10 s] và 0 file trong [btime −10 s, btime] (merged
  kiểm cả 3 cây repo-1/hidden_files/outside). Không có file +s kiểu
  mù #54 (#88? +8 s, #89? +3 s) hay mù #50.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #92?→#93? = **9.473 s (2h37'53")** — **VẪN CHỈ LÀ SPAN**
  (đoạn A mù #56 mở, tối đa 1 ẩn theo quy ước / 3 ẩn cộng dồn).
- Gap #91?→#92? = 6.838 s (1h53'58") — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #55 mở, tối đa 2 ẩn quy ước / 3 ẩn cộng dồn; ĐÃ RECHECK
  đợt này — xem §2.6).
- Gap #83?→#84? = 6.318 s (1h45'18") — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #53 mở, tối đa 3 ẩn; ĐÃ RECHECK đợt này — xem §2.6).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):**
  #93? từ #92? dự kiến [05:56:47Z, 07:55:21Z] (p10–p90 FULL69 —
  bản script T2-136, kiểm lại bằng code đợt này: khớp từng giây);
  thực tế **08:07:11Z — NGOÀI dải, muộn hơn cận trên 710 s**.
  **Chuỗi INSIDE dừng ở 4 lần liên tiếp (#89?/#90?/#91?/#92?)**;
  #93? là lần OUTSIDE đầu tiên sau đó (và là lần ngoài dải đầu tiên
  kể từ đợt 134).
- **Dải cơ học mới cho #94? (p10–p90 FULL69): [08:34:40Z,
  10:33:14Z]** — từ btime #93? 08:07:11Z; dải hiệu dụng sau probe
  #56: [08:45:46Z, 10:33:14Z].

**Khung chết các boot mới (từ merged — xem §2.4):**
- **Khung chết #92?: (08:05:05Z, 08:07:11Z] (126 s) — MỚI** —
  mốc muộn nhất là 4 file memory reconciliation cùng giây 08:05:05Z
  (objectives/memory/CURRENT.md + archive 20261118T080505Z.CURRENT.md
  ở 08:05:05.602Z + ~/memory/bank/reflections.md 08:05:05.588Z +
  ~/memory/bank/world.md 08:05:05.590Z — hai file sau thuộc phạm vi
  thứ 5, cùng giây với mốc merged nên KHÔNG hẹp thêm khung ở độ
  chính xác giây). Đã kiểm bổ sung: không còn file nào trong
  ~/agents + ~/memory + ~/dreams + ~/side-chats có mtime trong
  (08:05:05Z, 08:07:11Z]. Sau 08:05:05Z máy yên 2'06" tới reboot.
  Tuổi thọ boot #92? theo khung này: 2h35'47"–2h37'53" (từ btime
  05:29:18Z).
- **Khung chết #91?: (04:42:27Z, 05:29:18Z] (2.811 s) — CHUẨN PARENT
  VẪN ĐỨNG** (§12.3(e) đợt 136; recheck đợt này 0 mốc mới — xem
  §2.6). Khung chết #90?: (03:34:51Z, 03:35:20Z] (29 s) — CHUẨN
  PARENT VẪN ĐỨNG (§12.3(d) đợt 136).

**Chuỗi gộp (định nghĩa duy nhất từ đợt 134):** reboot #92?→#93?
là **sự kiện thứ 17** (đợt 136 là sự kiện thứ 16) — với điều kiện
không có reboot ẩn trong đoạn A mù #56; nếu có 1 ẩn thì sự kiện
này là thứ 18 (và số boot mới là #94?), nếu 3 ẩn cộng dồn thì sự
kiện thứ 20 (boot #96?). **Số thứ tự TẠM THỜI** (như #69–#92?;
chuỗi tương đối do T6-137 chốt, số tuyệt đối vẫn tạm; giá trị gap
không phụ thuộc số thứ tự).

### 2.3 Hoạt động trong khoảng mù — HỞ ĐOẠN A (merged 4 phạm vi)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **11 file** +
hidden_files **267 file**; **278 file, 273 mốc float phân biệt /
166 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3/T2-133 §2.3/
T2-134 §2.3/T2-135 §2.3/T2-136 §2.3 — "mốc" là mtime float phân biệt,
không phải giây tròn). Ngoài hai cây: **595 file** (agents —
exec-log/tool-output chiếm đa số + system/memory/proactivity +
self_improvement + round137-*/ ; chi tiết xem blind56-outside.txt);
**/tmp: 2 file** trong mù #56 (xem blind56-tmp.txt — CẢ HAI trong
đoạn B, xem caveat §2.4).
Gộp cả 4 phạm vi: **196 mốc giây phân biệt**. Chia mù làm hai
đoạn bởi 1 reboot:

- **Đoạn A: 05:50:26Z → 08:07:11Z (2h16'45" = 8.205 s, boot #92?
  1ca1feaa) — MỞ (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **213 mốc** (hai cây), lỗ lớn nhất hai cây **2.822 s**
    (06:21:23Z → 07:08:25Z); lỗ lớn thứ hai 1.974 s (đuôi hai cây).
    Mốc đầu 05:50:26Z (head 0 s — chính probe #55); mốc cuối hai cây
    **07:34:17Z** (đuôi hai cây **1.974 s** > sàn 1.147 s).
    **11 session** chạm đoạn A.
  - **Merged 4 phạm vi: 148 mốc, lỗ lớn nhất 1.506 s**
    (06:41:57Z → 07:07:03Z), floor=1 → **MỞ, tối đa 1 ẩn (quy
    ước)**. Mốc đầu gộp 05:50:47Z (head 21 s), mốc cuối gộp
    **08:05:05Z** (đuôi 126 s — 4 file memory reconciliation).
    Lỗ lớn thứ hai gộp **1.298 s** (07:41:57Z → 08:03:35Z) và lỗ
    lớn thứ ba **1.234 s** (06:21:23Z → 06:41:57Z) — **cả hai cũng
    vượt sàn** (xem §2.4 về cách đếm tối đa ẩn).
    **Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): 0 mốc**
    trong cả ba lỗ vượt sàn (xem §2.4 phát hiện 1) — verdict không
    đổi.
  - Cửa sổ sàn [A-lo=06:09:33Z, A-hi=07:48:04Z]: 3 session bắc qua
    cắt A-lo; **0 session bắc qua cắt A-hi và 0 session chạm
    A-tail** — không session nào trong A-tail (07:48:04Z,
    08:07:11Z]; mốc merged trong A-tail chỉ có 10 file ngoài cây
    (memory reconciliation 08:03:35Z–08:05:05Z).
  - Hoạt động trên 1ca1feaa: T4-136 load-mid 05:50–05:52Z + T5/T8
    đợt 136 đóng dần 05:54–06:08Z + T2-136 LIMITS 06:21:23Z + yên
    06:21–07:08Z (chỉ session exec-log thưa) + T10 đóng đợt 136
    07:08–07:26Z + parent verify 07:28Z + LIMITS gộp 136 viết quyết
    07:34:17Z + memory reconciliation 08:03:35–08:05:05Z — sau đó im
    lặng 2'06" tới reboot. Không có cron nào chạy trong khoảng này
    (lượt cron tiếp theo mở 08:35Z — đã sang boot mới).
  - **Kết luận đoạn A: MỞ — tối đa 1 ẩn (quy ước lỗ lớn nhất //
    sàn); đọc cộng dồn ba lỗ vượt sàn thì tối đa 3 ẩn (xem §2.4).**
- **Đoạn B: 08:07:11Z → 08:45:46Z (38'35" = 2.315 s, boot #93?
  2104246b) — ĐÓNG bằng đo uptime trực tiếp + luật lỗ:**
  - **`uptime -s` lúc 08:45:02Z = 08:07:11Z** chứng minh máy up
    liên tục từ #93? tới lúc đo; probe #56 08:45:46Z đọc boot_id
    2104246b tươi — cùng boot_id với boot bắt đầu 08:07:11Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C, T2-132 §2.3 đoạn C, T2-133 §2.3 đoạn B,
    T2-134 §2.3 đoạn C, T2-135 §2.3 đoạn G, T2-136 §2.3 đoạn C
    mù #55.)
  - **60 mốc** (hai cây), lỗ lớn nhất **1.991 s** (08:07:11Z →
    08:40:22Z — head, do file mở đợt 137 đầu tiên
    (round-in-progress.md + build-loop-log) chỉ ghi 08:40:22Z);
    mốc cuối **08:45:41Z** (đuôi **5 s** < sàn). **5 session**
    chạm đoạn B (đều là phiên đợt 137 / main agent).
  - **Merged 4 phạm vi: 47 mốc, lỗ lớn nhất 1.461 s**
    (08:07:11Z → 08:31:32Z — head, mốc đầu là system_prompt.md),
    floor=1 theo luật lỗ thuần túy — **nhưng uptime trực tiếp loại
    bỏ khả năng reboot ẩn trong head** (máy up liên tục từ
    08:07:11Z tới lúc đo 08:45:02Z; journal chỉ 1 boot). Mốc đầu
    gộp 08:31:32Z (head 1.461 s), mốc cuối gộp 08:45:41Z (đuôi 5 s).
  - Đoạn B dài hơn 2×sàn đúng 21 s (2.315 s vs 2.294 s) nên có cửa
    sổ sàn hẹp [B-lo=08:26:18Z, B-hi=08:26:39Z] (rộng 21 s); 0
    session bắc qua cắt B-lo/B-hi — uptime là closer, luật lỗ chỉ
    là kiểm chứng thêm.
  - **Kết luận đoạn B: ĐÓNG.**

**Kết luận trung thực: khoảng mù #56 HỞ ĐOẠN A.** Đoạn A mở với
tối đa 1 ẩn (quy ước) / 3 ẩn (cộng dồn), đoạn B đóng (uptime).
1 reboot đã chốt giờ (#93? 08:07:11Z — chính xác từng giây trên
đĩa, số tạm) + **tối đa 1 ẩn (quy ước)**. Chuỗi mù đóng hoàn toàn
dừng ở #54: #50 đóng, #51 hở, #52 đóng, #53 hở, #54 đóng, #55 hở,
**#56 hở**.

Ngoài hai cây: **595 file** có mtime trong mù #56 (agents —
exec-log/tool-output chiếm đa số + system/memory/proactivity/
self_improvement; chi tiết xem blind56-outside.txt); **/tmp: 2 file**
trong mù #56 (xem blind56-tmp.txt + caveat §2.4 — CẢ HAI trong đoạn
B). Boot_id nhắc trong exec-log sinh/viết trong mù: 1ca1feaa 6 file,
2104246b 0 file (xem §1 về cách đọc số 0 này).

### 2.4 Gộp 4 phạm vi + 4 phát hiện mới (phương pháp nối tiếp T2-136 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind56-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 148 mốc, lỗ lớn nhất **1.506 s** (06:41:57Z →
  07:07:03Z), floor=1 → **MỞ, tối đa 1 ẩn (quy ước)**.
  Lỗ lớn thứ hai **1.298 s** (07:41:57Z → 08:03:35Z); lỗ lớn
  thứ ba **1.234 s** (06:21:23Z → 06:41:57Z) — cả hai cũng vượt
  sàn (xem phát hiện 2 dưới).
- Đoạn B gộp: 47 mốc, lỗ lớn nhất **1.461 s** (08:07:11Z →
  08:31:32Z — head), floor=1 theo luật lỗ thuần túy — **nhưng
  uptime trực tiếp đóng đoạn B** (xem §2.3). Lỗ lớn thứ hai
  329 s; lỗ lớn thứ ba 201 s.
- Tổng gộp 196 mốc giây. Không có file nào trong
  `~/workspace/goals` ngoài hidden_files có mtime trong mù (kiểm
  bằng find riêng — vùng duy nhất hai lần quét chính không phủ,
  đã kiểm bổ sung, 0 file).

**Phát hiện 1 — /tmp CHỈ CÓ 2 file trong mù #56, cả hai trong đoạn B
(mới, nối tiếp phát hiện 1 của T2-136):** /tmp trên VM này là tmpfs
— reboot #93? (08:07:11Z) xóa mọi file /tmp viết trước đó. Vì vậy
merged cho đoạn A **không có đóng góp /tmp** — nhưng đoạn B (boot
hiện tại còn sống) có 2 file /tmp (t1-head68027.md 08:41:10Z +
t1-diff136.txt 08:41:44Z, đều của T1-137). **Verdict không đổi:**
đoạn A mở và đoạn B đóng đều không phụ thuộc /tmp (A mở vì cả 4
phạm vi đều trống trong ba lỗ vượt sàn, B đóng nhờ uptime). Ghi rõ
để luồng sau khỏi hiểu "2 file /tmp" là bằng chứng cho cả mù —
chúng chỉ phủ đoạn B.

**Phát hiện 2 — Đoạn A có BA lỗ vượt sàn, quy ước đếm tối đa ẩn
chưa từng gặp trường hợp này (mới — nối tiếp phát hiện 2 của
T2-136):** lỗ lớn nhất 1.506 s (1.506//1.147 = 1), lỗ lớn thứ hai
1.298 s (1.298//1.147 = 1) và lỗ lớn thứ ba 1.234 s (1.234//1.147
= 1) đều vượt sàn. Quy ước từ trước tới nay (code merged các đợt)
chỉ đếm lỗ lớn nhất → **tối đa 1 ẩn**. Nhưng một reboot ẩn có thể
ngồi trong lỗ thứ hai hoặc thứ ba mà không cần lỗ lớn nhất — cộng
dồn ba lỗ thì **tối đa 3 ẩn**. T2 báo cả hai số: headline lấy 1
(quy ước, nhất quán với các đợt trước — cùng quy ước parent đã xác
nhận cho mù #55 ở §12.3(g) đợt 136), và ghi rõ 3 là số bảo thủ nếu
parent muốn chuẩn chặt hơn. Gap #92?→#93? giữ SPAN theo cả hai
cách đọc — không đổi verdict nào. Tốc độ reboot (§2.5) tính cả hai
biến thể. **Hệ quả cho số thứ tự boot (mới):** vì đoạn A mở, boot
mới 2104246b có thể là #94? (1 ẩn) tới #96? (3 ẩn cộng dồn) — T2
không chốt số tuyệt đối; T6-137 chốt chuỗi tương đối.

**Phát hiện 3 — Mốc cuối đoạn A 08:05:05Z là hoạt động memory
reconciliation của hệ thống (mới):** 4 file cùng giây 08:05:05Z
(objectives/memory/CURRENT.md + archive 20261118T080505Z.CURRENT.md
ở 08:05:05.602Z + ~/memory/bank/reflections.md 08:05:05.588Z +
~/memory/bank/world.md 08:05:05.590Z) — tiến trình nền của hệ thống
chạy reconciliation bộ nhớ sau khi đợt 136 đóng (08:03:35Z–
08:05:05Z, 10 file ngoài cây trong A-tail). Nhờ đó khung chết #92?
chỉ còn 126 s thay vì 1.974 s (đuôi hai cây). Mốc này là hoạt động
có timestamp của tiến trình hệ thống, cùng lớp với mốc session
proactivity đã dùng cho khung chết #91? (parent đã xác nhận ở
§12.3(e) đợt 136) — đủ làm mốc cuối theo tiền lệ "last-seen =
hoạt động cuối có timestamp". Không có caveat 0 byte như mốc
03:34:51Z của khung #90? (các file này đều có nội dung).

**Phát hiện 4 — Phạm vi thứ 5 không hẹp thêm khung chết #92?
(mới, kiểm theo bài học F-136-T2-8):** quét ~/memory + ~/dreams +
~/side-chats cho cả mù #56: 4 file (2 file 08:05:05Z + 2 file
08:37:01Z — memory people/groups INDEX.md của vòng relationships
đợt 137, đoạn B). **0 mốc trong cả ba lỗ vượt sàn của đoạn A** và
**0 mốc trong (08:05:05Z, 08:07:11Z]** ngoài 2 file cùng giây
08:05:05Z (đã tính trong khung). Khung chết #92? chốt
(08:05:05Z, 08:07:11Z] = 126 s. Verdict đoạn A không đổi (vẫn MỞ,
tối đa 1 ẩn quy ước / 3 cộng dồn).

### 2.5 Phân phối gap — CERT n=54 / FULL n=69 KHÔNG ĐỔI (không có gap mới chứng nhận)

**Không có gap mới (xem blind56-gaps.py + blind56-gaps.txt):**
- **Gap #92?→#93? = 9.473 s (2h37'53") VẪN CHỈ LÀ SPAN** — đoạn A
  mù #56 mở (tối đa 1 ẩn quy ước / 3 ẩn cộng dồn).
  **CERT/FULL không tính gap này.**
- **Gap #91?→#92? = 6.838 s (1h53'58") VẪN CHỈ LÀ SPAN** — đoạn B
  mù #55 mở (tối đa 2 ẩn quy ước / 3 ẩn cộng dồn; ĐÃ RECHECK đợt
  này — xem §2.6). **CERT/FULL không tính gap này.**
- **Gap #83?→#84? = 6.318 s (1h45'18") VẪN CHỈ LÀ SPAN** — đoạn B
  mù #53 mở (tối đa 3 ẩn; ĐÃ RECHECK đợt này — xem §2.6).
  **CERT/FULL không tính gap này.**
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

**Cross-check tái hiện T2(136) 100%:** chạy blind55-gaps.py
verbatim cho lại đúng CERT n=54 / FULL n=69 của T2 đợt 136 (xem
blind56-gaps.txt: CERT54 mean 1h32'48" median 1h47'34" p10
0h26'45" p90 2h18'35" sd 0h46'27" min 0h00'55" max 3h14'08";
FULL69 mean 1h40'08" median 1h49'17" p10 0h27'29" p90 2h26'04"
sd 0h57'25" min 0h00'55" max 5h43'18"; in 90–150' = 34, <60' = 17,
>180' = 6, >240' = 2 — khớp T2-136 §2.5 từng số). 0 gap mới vào
nên cả CERT lẫn FULL đều KHÔNG ĐỔI.

- **CERT n=54 (không đổi):** mean 1h32'48" median 1h47'34" p10
  0h26'45" p90 2h18'35" sd 0h46'27" min 0h00'55" max 3h14'08".
- **FULL n=69 (không đổi):** mean 1h40'08" median 1h49'17" p10
  0h27'29" p90 2h26'04" sd 0h57'25" min 0h00'55" max 5h43'18";
  in 90–150' = 34, <60' = 17, >180' = 6, >240' = 2.
- **Dải chứng nhận [0h00'55", 3h14'08"] — không đổi** (gap mới
  9.473 s nằm trong dải, nhưng vẫn là SPAN nên không vào phân phối).
- **Dải cơ học cho #94? (p10–p90 FULL69): [08:34:40Z,
  10:33:14Z 18/11]** — từ btime #93? 08:07:11Z; dải hiệu dụng sau
  probe #56: [08:45:46Z, 10:33:14Z].
- **Dải cơ học cho #93? ĐÃ SAI (F-137-T2-1):** [05:56:47Z,
  07:55:21Z] (p10–p90 FULL69, T2-136 §2.5 — kiểm lại bằng code đợt
  này khớp từng giây) vs thực tế 08:07:11Z — **OUTSIDE, muộn hơn
  cận trên 710 s**. Chuỗi INSIDE dừng ở 4 lần liên tiếp
  (#89?/#90?/#91?/#92?).
- **Tốc độ reboot (đồng hồ ghi nhận):** 93 / 179,82 h = **1 reboot
  mỗi 116,0 phút** (từ #1 2026-11-10T20:18:10Z tới #93?
  2026-11-18T08:07:11Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 97 / 179,82 h = **1 mỗi 111,2 phút**; +3 nữa
  (mù #53 đoạn B tối đa 3) → 100 / 179,82 h = **1 mỗi 107,9
  phút**; +2 nữa (mù #55 đoạn B tối đa 2, quy ước) → 102 /
  179,82 h = **1 mỗi 105,8 phút**; +1 nữa (mù #56 đoạn A tối đa 1,
  quy ước) → 103 / 179,82 h = **1 mỗi 104,7 phút** (đọc cộng dồn:
  mù #55 đoạn B tối đa 3 → 104 / 179,82 h = **1 mỗi 103,7 phút**;
  mù #56 đoạn A tối đa 3 → 105 / 179,82 h = **1 mỗi 102,8
  phút**). Chưa tính ẩn danh nghĩa tối đa của mù #35 (+24), mù
  #37 (+29), mù #38 đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B
  (+1), mù #43 đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn G1
  (+4), mù #46 đoạn A (+4), mù #48 đoạn A (+2), mù #49 đoạn B
  (+1), mù #51 đoạn B (+3).
  Mù #50: **+0** (đóng hoàn toàn). Mù #52: **+0** (đóng hoàn
  toàn). Mù #53: **+3** (đoạn B mở — recheck đợt này xác nhận).
  Mù #54: **+0** (đóng hoàn toàn). Mù #55: **+2 (quy ước) / +3
  (cộng dồn)**. **Mù #56: +1 (quy ước) / +3 (cộng dồn) — mới.**

### 2.6 Mù #55 B + mù #53 B RECHECK đợt này + mù #51 B + mù #49 B: KHÔNG kiểm lại

- **Mù #55 B: ĐÃ RECHECK đợt này (brief giao) — VERDICT KHÔNG
  ĐỔI.** Quét lại trực tiếp cả 5 phạm vi trong cửa sổ lỗ
  (04:42:27Z, 05:29:18Z] 18/11 (repo-1 + hidden_files + ngoài cây
  + /tmp + ~/memory + ~/dreams + ~/side-chats — xem
  blind56-fifthscope.py): **0 mốc mới**. Lỗ lớn nhất vẫn 2.811 s
  (04:42:27Z → 05:29:18Z, tính thêm phạm vi thứ 5) / 2.843 s
  (merged 4 phạm vi), tối đa 2 ẩn quy ước / 3 ẩn cộng dồn. Khung
  chết #91? (04:42:27Z, 05:29:18Z] (2.811 s) — chuẩn parent — giữ
  nguyên. **Gap #91?→#92? = 6.838 s GIỮ SPAN.**
- **Mù #53 B: ĐÃ RECHECK đợt này (brief giao) — VERDICT KHÔNG
  ĐỔI.** Quét lại trực tiếp cả 5 phạm vi trong cửa sổ lỗ
  (22:16:31Z, 23:26:58Z] 17/11: **0 mốc giây mới**. Một hit float
  duy nhất là file `docs/PHASE9_ROUND133_LIMITS.md` ở
  **22:16:31.872Z** — đây là **file biên đã biết** (mốc giây
  22:16:31Z, có trong danh sách blind53b-repo-1.txt dòng 10 từ đợt
  136 và danh sách đợt 134 dòng 11): nó LÀ mốc trái của lỗ, không
  phải mốc mới trong lỗ. Quét của T2 so sánh float với biên trái
  mở (`t0 < mt`) nên bắt được file này (0,872 s sau mốc giây biên);
  merged tính theo giây nên file này chính là mốc 22:16:31Z đã
  biết — xem F-137-T2-4. Lỗ lớn nhất vẫn **4.227 s**
  (22:16:31Z → 23:26:58Z), tối đa 3 ẩn. Khung chết #83?
  (22:16:31Z, 23:26:58Z] (4.227 s) giữ nguyên.
  **Gap #83?→#84? = 6.318 s GIỮ SPAN.**
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

### 2.7 Quét writeFileSync lần thứ 43 — chênh 0 (lần thứ 43 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round137-t2, đã đổi OUT sang
  round137-t2) **09:00:32Z → 09:00:50Z 18/11 (18 s, có SCAN-END)**.
  **Scan chạy trên boot #93?** — kết quả vẫn hợp lệ vì scan chỉ đếm
  code hiện tại trên đĩa, không phụ thuộc boot hay giờ mù.
- NEWSTD: **907 dòng / 253 file** (phạm vi 3.133 file); R7b đối
  chiếu: **932 dòng / 270 file** (phạm vi 12.526 file); copies:
  **25 dòng / 17 file** — y hệt lần 42 về copies. Đối chiếu chéo:
  907+25=932=R7b, **chênh 0**.
- **+6 dòng / +2 file so với lần 42** (901/251 → 907/253), giải thích đúng hết bằng diff
  (kiểm bằng diff danh sách file + diff từng dòng — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND136_LIMITS.md | +1 (0 → 1) | 07:34:17Z 18/11 | LIMITS gộp đợt 136 (nhắc `writeFileSync` 1 lần ở §2.7); viết SAU scan lần 42 (06:09:39Z 18/11) nên lần này mới vào |
  | docs/PHASE9_ROUND136_T2_EPERM_LIMITS.md | +5 (4 → 5) | 06:21:23Z 18/11 | Tài liệu T2 đợt 136 (nhắc `writeFileSync` thêm 1 lần ở bản chốt sau scan lần 42 — file chốt 06:21:23Z, sau scan lần 42 06:09:39Z) |
- Phạm vi: 3.133 = 3.126 + 7 net (**7 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 7 file mới gồm 5 LIMITS đợt 136
  (T1/T3/T7/T8 + gộp) + 2 LIMITS đợt 137 đã viết trước scan (T6 +
  T9); 0 file mất). Copies y hệt lần 42 (diff 0 dòng).
- **Kết luận: 43 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #56.

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
  né EPERM trong mù #56.

## 3. RAM trong mù #56 — max 3.678 MB, birefnet KHÔNG chạy

- **3 mẫu MemAvailable trực tiếp của lượt:**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 08:45:02Z | **2.430.996 kB** (2.374 MB) | Trước probe #56 (boot #93?, đoạn B) |
  | 08:46:15Z | **2.049.456 kB** (2.001 MB) | Sau probe #56 (boot #93?, đoạn B) — đang giảm khi các luồng đợt 137 chạy |
  | 09:05:48Z | **4.646.788 kB** (4.538 MB) | Lúc đóng phiên T2 (boot #93?) — NGOÀI mù #56; balloon hồi mạnh sau khi replay dpkg lặng (lần ghi cuối 09:01:42Z) |
- **Max RAM biết được TRONG mù #56 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 15 mẫu RAM; **max 3.678 MB**
  (T4-136 load-mid, 05:50:32Z, đoạn A — đã xác minh trực tiếp dòng
  log: `load=1.89 1.89 1.36 1/497 15378 RAMavail=3678MB`); đoạn A max
  **3.678 MB** (05:50:32Z); đoạn B max **2.421 MB** (T4-137 poll #1,
  08:44:34Z, boot 2104246b); đoạn B còn 2.275 MB (poll #2,
  08:45:20Z) + 2.176 MB (T5-137 wait-replay poll 1, 08:45:40Z).
  Đoạn A sau 05:52:07Z không còn mẫu RAM nào (máy yên dần tới
  reboot) — max đoạn A thực chất là mẫu đầu mù, ngay sau probe #55.
  Prereg dự báo khoảng rộng 1.000–6.100 MB (không neo hẹp theo bài
  học F-136-T2-4) — thực tế 3.678 MB nằm trong khoảng, **không có
  dự báo RAM sai lượt này**.
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 3.678 MB < ngưỡng guard 6 GB (6.144 MB); u2net là fallback
  chính thức. Quyết parent §12.3(f) đợt 136 vẫn đứng: chỉ thử lại
  khi một probe quan sát được available ≥ 6.144 MiB. **Lưu ý:** mẫu
  trực tiếp 4.647 MB lúc đóng (ngoài mù) cho thấy balloon đang hồi
  trên boot mới — nếu một lượt sau quan sát được ≥ 6.144 MiB thì đủ
  điều kiện thử birefnet theo quyết §12.3(f); lượt này chưa đủ
  (max trong mù chỉ 3.678 MB).

## 4. Ghi chú phương pháp + kiểm prereg

1. **Prereg có 1 dự báo SAI — dải cơ học cho #93? (F-137-T2-1,
   mới, §0 + §2.5):** dải T2-136 [05:56:47Z, 07:55:21Z] (p10–p90
   FULL69) vs thực tế 08:07:11Z — OUTSIDE, muộn hơn cận trên 710 s.
   Đây là dự báo sai của dải, không phải lỗi đo (btime đọc trực
   tiếp 3 nguồn khớp nhau; code kiểm lại dải khớp từng giây). Chuỗi
   INSIDE dừng ở 4 lần liên tiếp. Bài học: dải p10–p90 không phải
   biên cứng — một lần ngoài dải sau 4 lần trong dải là dữ liệu
   phân phối, không phải lỗi phương pháp; không nới dải hậu kiểm để
   vừa dữ liệu (cùng nguyên tắc parent giữ prereg P5/P6 ở §12.3(b)
   đợt 136).
2. **F-137-T2-2 — sed nối tiếp làm hỏng B0 của eperm-sweep56.py,
   lần chạy đầu cho 0 file log (mới):** chuỗi sed `-e
   s/02:45:23/05:50:26/ -e s/05:50:26/08:45:46/` biến B0 thành
   08:45:46Z (cửa sổ rỗng) — lần chạy đầu báo 0 file *.log (sai).
   Đã phát hiện khi đối chiếu số 0 với file log thấy trong
   blind56-sessions.log, sửa B0 về 05:50:26Z, chạy lại cho số đúng
   (47 file). **KHÔNG dùng số nào từ lần chạy lỗi.** Cùng lớp lỗi
   ram-max56 (F-137-T2-3, đã bắt trước khi chạy). Bài học: sau
   adapt bằng sed nối tiếp, grep B0/B1 của MỌI script trước khi
   chạy (không chỉ docstring — nối tiếp F-136-T2-7).
3. **F-137-T2-3 — ram-max56.py SEGS/B0 hỏng do cùng nguyên nhân
   sed nối tiếp (mới):** B0 bị ghi đè thành 08:45:46Z, SEGS A bắt
   đầu 08:45:46Z, SEGS C rỗng — đã phát hiện bằng grep kiểm tra và
   sửa bằng edit trực tiếp TRƯỚC khi chạy (B0 05:50:26Z, SEGS A/B
   đúng). Lần chạy ram-max dùng bản đã sửa; không có số liệu sai
   nào từ lỗi này. Bài học như F-137-T2-2.
4. **F-137-T2-4 — recheck #53 B: 1 hit float là file biên đã biết
   (mới, §2.6):** quét so sánh float `t0 < mt` với biên trái mở
   22:16:31Z nên bắt file PHASE9_ROUND133_LIMITS.md ở
   22:16:31.872Z — file này LÀ mốc trái của lỗ (mốc giây
   22:16:31Z, có trong danh sách blind53b từ đợt 134), không phải
   mốc mới. Bài học: recheck lỗ phải so sánh ở độ chính xác giây
   như merged, hoặc loại trừ file biên đã biết trước khi đếm.
5. **F-137-T2-5 — dpkg bracket #93? đọc lần đầu khi replay còn
   chạy (mới, §2.1):** lần đọc 08:45Z chỉ có 73 dòng / 11 installs
   — khác mọi bracket trước (đều đọc khi replay đã xong, ~1.545
   dòng). Đã đọc lại 3 lần nữa (471 → 566 → 566 dòng) và ghi rõ
   số lúc đóng là số tạm, chưa chứng minh xong. Bài học: bracket
   dpkg phải đọc lại lúc đóng + ghi rõ replay xong/chưa xong; không
   lấy lần đọc đầu làm bracket chuẩn.
6. **F-137-T2-6 — prereg §2 ghi B "nếu probe trước ~08:45:25Z thì
   không có cửa sổ sàn" — probe thực tế 08:45:46Z (mới):** B dài
   2.315 s, hơn 2×sàn đúng 21 s → B CÓ cửa sổ sàn hẹp [08:26:18Z,
   08:26:39Z]. Không đổi verdict nào (B đóng bằng uptime trực
   tiếp); chỉ là ghi chú biên — prereg đã lường cả hai trường hợp
   trong cùng câu.
7. **F-137-T2-7 — round-in-progress.md xuất hiện 08:40:22Z, SAU lần
   kiểm chốt chặn của T2 lúc mở phiên (mới):** T2 kiểm lúc ~08:39Z
   thấy file KHÔNG tồn tại; main agent ghi file này lúc 08:40:22Z
   (cùng mốc với build-loop-log) khi mở đợt 137 — đây là marker
   của CHÍNH đợt 137, không phải đợt main-chat; không vi phạm chốt
   chặn (main agent đã kiểm lúc mở: "round-in-progress.md KHÔNG
   tồn tại lúc mở → lượt này chạy bình thường"). Ghi rõ để luồng
   sau khỏi hiểu lầm "file xuất hiện giữa phiên" là đợt main-chat
   chen vào.
8. **Docstring các script blind56 đã kiểm cửa sổ (mới):**
   investigate/sessions/merged/gaps/ram-max/sweep đều ghi đúng cửa
   sổ (05:50:26Z → 08:45:46Z 18/11) + SEGS 2 đoạn viết mới — đã
   kiểm bằng grep trước khi chạy (bài học T2-133 §4 mục 6: kiểm
   SEGS sau khi adapt; F-137-T2-2/3 là hai lỗi sed đã bắt bằng
   chính bước kiểm này — sweep là lỗi sót: grep kiểm chỉ bắt
   docstring, không bắt B0 trong code).
9. **T6-137 chưa công bố chuỗi lúc T2 đóng (mới):** thư mục
    round137-t6 lúc T2 đóng chỉ có file test/log mở-đóng, chưa có
    LIMITS — số #93? vẫn tạm, chờ T6 chốt chuỗi tương đối
    #57→#93?. T10 đối chiếu khi đóng sổ. (Tiền lệ: các đợt trước
    T6 thường công bố sau T2; không phải sai số.)
10. **preview.tsx 530e10a7 GIỮ — theo quyết parent, không phải sai
    số (mới, §0):** md5 530e10a7 — fix instrumentation của T3-134
    theo quyết parent đợt 136 §12.3(a) (GIỮ qua đợt 137, lượt yên
    #14 là lượt quyết định cho điều tra (c2)). media.ts KHÔNG ĐỔI
    2c384ed1; vite.config.ts (apps/web/) KHÔNG ĐỔI ee80d093. T2
    không sửa production file nào.
11. **R9 (a): SỐ ĐẾM VẪN LÀ 16 — KHÔNG tăng (nhắc lại, §0):**
    quyết parent đợt 134 §12.3(d) đã đính chính T5-134 viết
    "nhắc lần 17" là sai; số đếm giữ 16. File LIMITS này KHÔNG
    viết số 17 ở bất cứ đâu cho R9 (a).

## 5. Hồ sơ + stage

- **LIMITS này:** `docs/PHASE9_ROUND137_T2_EPERM_LIMITS.md`
  (oversize >37.768 B — chỉ stage paths, không push, như các
  LIMITS oversize đợt 134–136).
- **Thư mục làm việc:** `hidden_files/round137-t2/` — prereg-t2.md,
  boot-verify.txt, f93.txt, status1/once/status2 + .exit,
  blind56-investigate.py + .log, blind56-sessions.py + .log,
  blind56-merged.py + .log, blind56-gaps.py + .txt,
  blind56-fifthscope.py + .log, blind56-repo-1.txt,
  blind56-hidden_files.txt, blind56-outside.txt, blind56-tmp.txt,
  sessions-all.txt, eperm-sweep56.py + eperm-sweep-run.log,
  ram-max56.py + ram-max.txt, scan-wfs.sh + scan-meta.txt +
  files-*.bin + wfs-*.txt.
- **Stage (KHÔNG push):** `phase9-round137-t2-eperm.txt`
  (NUL-delimited, 1 entry: LIMITS này; verify read-back trước khi
  đóng cờ).
- **Cờ:** `hidden_files/round137-t2.done`.
- **Mù #57 MỚI MỞ** từ probe #56 (08:45:46Z 18/11) — việc của T2
  đợt 138.
