# PHASE9 ROUND131 T2 — EPERM: probe #50 ok=2 fail=0 + mù #50 ĐÓNG HOÀN TOÀN (A+B+C) + 2 gap CHỨNG NHẬN DẠNG KHOẢNG + CERT n=44 / FULL n=59 + mù #49 B kiểm lại KHÔNG ĐỔI

> Luồng T2, đợt 131 vòng lặp Phase 9 VCut Studio (lượt cron 21:35 +07,
> 17/11/2026; làm việc 14:41Z → 15:07Z 17/11/2026).
> Nhiệm vụ: probe #50 theo lịch thường lệ + mù #50 MỚI MỞ từ probe #49 —
> điều tra đoạn từ #77 (dải cơ học cho #78: [11:29:01Z, 13:37:19Z]) + mù #49
> đoạn B còn mở (kiểm lại bằng code trên đĩa hiện tại) + quét sóng EPERM.
> Prereg viết TRƯỚC khi đo:
> hidden_files/round131-t2/prereg-t2.md. **Dự báo ĐÚNG HẾT, trừ đoạn B chỉ
> dự báo "KHÔNG CHẮC" (không dự báo sai — verdict ĐÓNG nằm trong vùng
> không chắc đã ghi).** Prereg lần này KHÔNG đặt điều kiện chặt hơn tiền lệ
> (bài học T2-130 §4 mục 1 đã áp dụng trước khi đo — xem §4 mục 1).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #47 (ĐÃ ĐÓNG HOÀN
> TOÀN đợt 128) / mù #46 đoạn A / mù #45 đoạn G1 / mù #44 đoạn D /
> mù #40 đoạn B / mù #43 / mù #42 đoạn B** (quyết parent đợt 124 §12.3
> + §12.4, đợt 125 §12(h), đợt 126 §12(h), đợt 127 §12(c)). G1 + mù
> #22/#28/#29/#30/#31/#35/#37/#38 đoạn G chờ user quyết.
> **REBOOT GIỮA PHIÊN T2 (mới, xem §2.1 cuối + §4 mục 3):** boot #79?
> (f868abad) CHẾT lúc 15:01:30Z — SAU khi probe #50 + toàn bộ đo mù #50
> đã xong (đo cuối cùng 14:59:24Z) — nên KHÔNG ảnh hưởng verdict nào
> của lượt này; phiên T2 sống sót, mọi file + log probe đã xác minh còn
> nguyên (15:06:59Z). Reboot này mở mù #51 (việc của T2 đợt 132).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (14:46:52–14:46:56Z):** `status`
  báo **DEAD/STALE** (heartbeat age 11.311 s, last #49 11:38:21Z, boot
  86538084, exit 1); `once` ngay sau đó là **probe #50, boot
  f868abad, ok=2 fail=0**, exit 0, 14:46:56Z; `status` chạy lại
  **ALIVE** (age 9 s, n=50), exit 0. Log v2 tăng đúng **3 dòng**
  (139 → 142) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=50, ts 14:46:56Z, boot f868abad.
- **Boot #79? (tạm) lúc 14:26:41Z, boot
  `f868abad-66fb-46e7-bbaa-cd3ec0cddf34`** — xác minh bằng `uptime -s`
  + btime 1794925601 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại: HTTP `Date` cả 3 server đều khớp **+2,0 s** (server hơn
  local 2 s cả ba: example.com, google.com, cloudflare.com) →
  **F79? ≈ −2 s (±~1 s)** — đo trực tiếp đầu tiên trên boot mới.
- **#78? tới TRONG dải cơ học từ #77** [11:29:01Z, 13:37:19Z] (p10–p90
  FULL57); #78? thật 13:02:41Z — **lần thứ tám liên tiếp trong dải**.
  **#79? tới TRONG dải cơ học từ #78?** [13:35:19Z, 15:40:04Z]
  (p10–p90 FULL58); #79? thật 14:26:41Z — **lần thứ chín liên tiếp
  trong dải**.
- **Khoảng mù #50 (MỚI): 11:38:21Z → 14:46:56Z 17/11 (3h08'35") —
  ĐÓNG HOÀN TOÀN (A đóng, B đóng, C đóng).** Đoạn A **ĐÓNG** (277 mốc,
  lỗ lớn nhất 895 s, đuôi 2 s, 1 session bắc qua A-lo, đuôi A dày đặc);
  đoạn B **ĐÓNG** (180 mốc, lỗ lớn nhất 738 s — chính là đuôi, 1 session
  bắc qua B-lo, quan sát cuối LIMITS gộp 130 lúc 14:14:23Z); đoạn C
  **ĐÓNG** (uptime trực tiếp lúc probe #50 + dấu boot tươi).
  **2 reboot đã chốt trong mù (#78? 13:02:41Z + #79? 14:26:41Z — chính
  xác từng giây trên đĩa) + 0 ẩn.** Đây là mù đóng hoàn toàn đầu tiên
  kể từ mù #47 (đợt 128).
- **Gap #77→#78? = [7.560 s, 7.580 s] (mid 7.570 s) CHỨNG NHẬN DẠNG
  KHOẢNG (mới)** — đoạn A mù #50 đóng; biên ±10 s của T5, F78 chưa
  đo trực tiếp + caveat lệch đồng hồ cũ ~1 s tại #78? (xem §2.2 +
  §2.5 + §4 mục 1). **Gap #78?→#79? = [5.030 s, 5.050 s] (mid
  5.040 s) CHỨNG NHẬN DẠNG KHOẢNG (mới)** — đoạn B mù #50 đóng;
  F78 chưa đo, F79? ≈ −2 s đã đo trực tiếp lượt này.
  **CERT n=42 → n=44 / FULL n=57 → n=59.**
- **Mù #49 đoạn B kiểm lại trên đĩa hiện tại: VERDICT KHÔNG ĐỔI**
  (mới, xem §2.6): A tái hiện đúng từng giây (lỗ lớn nhất 116 s,
  ĐÓNG); B tái hiện đúng từng giây (lỗ lớn nhất 2.252 s, MỞ, tối đa
  1 ẩn); C đầu lỗ 2.347 s → 2.363 s (+16 s do mốc sớm nhất ngoài
  cây bị ghi đè, vẫn ĐÓNG bằng uptime). **Gap #76→#77 giữ SPAN**
  theo quyết parent đợt 130 §12.3(e). 0 file mới xuất hiện trong
  cửa sổ #49; 52 file trong snapshot T2-130 không còn mtime trong
  cửa sổ (xóa hoặc ghi đè — giải thích hết, xem §2.6).
- **Replay boot #79? CHẠY ĐẦY ĐỦ (theo T5-131, chủ quản replay):**
  configure 14:35:39Z (boot +8'58"), install xong 1.509 dòng / 217
  installs lúc 14:48:40Z, bracket (8'58", 21'59"], cờ POSTBOOT_PASS
  14:50:18Z. Snapshot của T2 lúc 14:47:54Z (1.113 dòng, 163 installs,
  vẫn chạy) khớp giữa chừng. File dpkg.log của boot #79? đã MẤT theo
  reboot 15:01:30Z — hồ sơ T5-131 là bằng chứng còn lại.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 135 file
  *.log có mtime trong mù #50 (0 file repo-1, 135 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8, xem §2.7). Quét mở rộng: **15 match thô / 12 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher trên + 4 dòng meta-hit tên file trong log T2-130; 3 match
  thô thừa là trùng lặp). Sóng gần nhất vẫn là
  **~11:55–12:11Z 11/11** (R7) — **~146h51'** trước probe #50. EPERM
  vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 37: 878 dòng / 245 file** (phạm vi 3.075
  file); R7b đối chiếu 903 dòng / 262 file; copies 25 dòng / 17
  file — y hệt lần 36. Đối chiếu chéo 878+25=903=R7b,
  **chênh 0 — lần thứ ba mươi bảy liên tiếp**. +7 dòng / +1 file so
  với lần 36, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray;
  mtime không đổi từ 10/11.
- RAM: max biết được trong mù #50 **3.317 MB** (T4 gate0-wait #4,
  11:44:20Z, đoạn A) = **55% ngưỡng guard**; đoạn B max **2.112 MB**;
  đoạn C max **1.841 MB**. **Birefnet KHÔNG chạy, vẫn
  0 lần chạy thành công trong gói** — 3.317 MB vẫn dưới guard 6 GB;
  quyết parent §12.7 vẫn đứng (chỉ thử lại khi quan sát được
  available ≥ 6 GB).
- **preview.tsx KHÔNG ĐỔI trong đợt 131:** md5 805409f0, mtime
  11:40:32Z (instrumentation (c2) của T5 đợt 130); media.ts KHÔNG
  ĐỔI 2c384ed1. T2 không sửa production file nào.
- **Reboot #80? (tạm) lúc 15:01:30Z, boot
  `ad1327ef-e045-4d44-ae14-13c76bab50ec`** — SAU probe #50, GIỮA đợt
  131 (T1/T4/T5/T7/T9 đã done; T4 lượt yên #9 xong 15:00:06Z, 84 s
  trước reboot). Boot #79? chết trong khung (15:01:07Z, 15:01:30Z]
  (23 s — hẹp nhất từ trước tới nay cho một khung chết, nhờ lần ghi
  cuối của chính T2); tuổi thọ #79? = 2.089 s (34'49"). Gap
  #79?→#80? = 2.089 s danh nghĩa — SPAN (mù #51 mở, việc của T2
  đợt 132). Số thứ tự TẠM — T6 đợt 131 chốt.
- **Đợt 131 lúc T2 đóng (~15:07Z):** T1/T4/T5/T7/T9 đã có cờ .done
  trên đĩa; T3/T6/T8/T10 đang chạy; boot hiện tại #80? (kiểm
  15:06:59Z). Hạn cứng đóng đợt 17:35Z 17/11 (theo brief T2). T2
  KHÔNG mở Xvfb (không cần) nên không có gì để kill — luật đứng đợt
  127 §12.1.3 không phát sinh việc.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 14:45:06Z | boot_id `f868abad-66fb-46e7-bbaa-cd3ec0cddf34`; `who -b` Nov 17 14:26; `uptime -s` **2026-11-17 14:26:41**; btime **1794925601 = 2026-11-17T14:26:41Z**; journal chỉ 1 boot (f868abad, first entry 14:26:52Z, last 14:44:36Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #78? đã mất theo reboot #79?, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 14:46:52Z | **DEAD/STALE**, heartbeat n=49, ts 11:38:21Z, boot 86538084, age **11.311 s** (đúng 3h08'31"); last sample probe #49; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 14:46:56Z | **probe #50, boot=f868abad, ok=2 fail=0**, exit 0; dòng `boot changed 86538084 -> f868abad` (uptime since 2026-11-17 14:26:41) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 14:46:56Z | **ALIVE**, age 9 s, n=50, exit 0 |

Kiểm lại từ đĩa: log probe v2 **142 dòng** — 139 sau T2-130 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #49 +
dòng `boot changed` + dòng probe #50). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #49 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=50, ts 2026-11-17T14:46:56Z, boot
f868abad-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #79?: 3 session T2 trong vùng C (birth
14:41:53Z, 14:44:48Z, 14:45:32Z — các luồng đợt 131) + 53 mốc mtime
trong vùng C (mốc đầu 14:35:37Z — file system_prompt.md ghi lúc
mở đợt; mốc cuối 14:46:53Z — file của luồng đợt 131) + 35 mốc gộp
4 phạm vi. **Số thứ tự TẠM THỜI** (như #69/#70/#71/#72/#73/#74/
#75/#76/#77/#78?).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #50 (11:38:21Z → 14:46:56Z 17/11, 3h08'35")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #50: `uptime -s` = **2026-11-17 14:26:41Z**,
  boot_id `f868abad-66fb-46e7-bbaa-cd3ec0cddf34` — khác boot của
  probe #49 (86538084).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (14:45:06Z): chỉ **1 boot**
  (f868abad, first entry 14:26:52Z, last 14:44:36Z). Journal/wtmp
  của boot 57c3e5e2 đã mất theo reboot #79? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #79? — bracket ghi trong lượt (bài học
  T7-125 §4 mục 4: kiểm boot trước MỖI lần đọc /var/log).** Lúc
  14:47:24Z file có **1.113 dòng**, 14:35:39Z–14:47:54Z (2 dòng
  "startup packages configure" 14:35:39–40Z, boot +8'58"; phase
  install bắt đầu 14:46:50Z "startup archives unpack"; 163 dòng
  "status installed" lúc 14:47:54Z — **VẪN CHẠY, chưa đóng băng**;
  /var/log/apt đã có history.log với End-Date 14:47:54Z cho 1
  transaction). **Hồ sơ đầy đủ thuộc về T5-131 (chủ quản replay):
  install xong 1.509 dòng / 217 installs lúc 14:48:40Z, bracket
  (8'58", 21'59"], cờ POSTBOOT_PASS 14:50:18Z** — snapshot của T2
  khớp giữa chừng (163 installs lúc 14:47:54Z, trước khi xong
  14:48:40Z). File dpkg.log này đã MẤT theo reboot 15:01:30Z
  (xem cuối mục này) — hồ sơ T5-131 là bằng chứng còn lại cho
  bracket #79?.
- **dpkg.log của boot #78? đã MẤT** (file lúc T2 kiểm chỉ còn
  bracket #79?): /var/log reset mỗi boot. Bản ghi T5b-130 (replay
  #78? đầy đủ 1.509 dòng / 217 installs, bracket (0'43", 34'56"],
  cờ POSTBOOT_PASS mới 13:39:13Z) là bằng chứng duy nhất còn lại
  cho bracket #78? — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**REBOOT GIỮA PHIÊN T2 — boot #80? (tạm) lúc 15:01:30Z (mới,
sau khi mọi đo mù #50 đã xong):** lúc 15:05:43Z kiểm lại boot
thấy `uptime -s` = **2026-11-17 15:01:30Z**, boot_id
`ad1327ef-e045-4d44-ae14-13c76bab50ec`, btime **1794927690**,
`who -b` Nov 17 15:01, journal chỉ 1 boot (ad1327ef, first entry
15:01:45Z), `stat /proc/1` 15:01:44Z (+14 s). **Boot #79? chết
trong khung (15:01:07Z, 15:01:30Z]** (rộng 23 s — hẹp nhất từ
trước tới nay cho một khung chết): quan sát cuối trên #79? là
chính lần ghi blind49-recheck.log của T2 lúc 15:01:07Z; trước đó
cờ round131-t4.done 15:00:06Z, round131-t1.done 15:00:02Z, scan
WFS xong 14:59:24Z. Tuổi thọ boot #79?: 14:26:41Z → 15:01:30Z =
**2.089 s (34'49")** — ngắn nhất trong chuỗi gần đây. Gap
#79?→#80? = **2.089 s danh nghĩa — SPAN** (mù #51 mở từ probe
#50; T2 đợt 132 điều tra). **Phiên T2 sống sót qua reboot:**
mọi file round131-t2 + log probe (142 dòng) + heartbeat (n=50)
đã xác minh còn nguyên lúc 15:06:59Z — reboot chỉ giết /var/log
của boot cũ (dpkg.log #79? đã mất, chỉ còn hồ sơ T5-131) và
không giết session T2. **Số thứ tự TẠM THỜI** — T6 đợt 131 chốt.
dpkg.log boot #80? lúc 15:05:43Z: **2 dòng** 15:02:19Z ("startup
packages configure", boot +49 s), 0 installs — replay mới bắt
đầu, T5 theo dõi tiếp.

### 2.2 Reboot đã chốt trong mù — #78? (mới, đã biết từ T5b-130) + #79? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 78? | **13:02:41Z** (chính xác từng giây) | 86538084 → 57c3e5e2 | Chốt từ T5b-130/T8-130 (kernel btime 1794920561; `uptime -s` đồng ý; /proc/1 13:02:56Z, +15 s); T2 lượt này xác nhận gián tiếp: probe #50 boot f868abad khác 86538084, và mọi quan sát đoạn B đều mang dấu boot #78? (4 exec-log nhắc 57c3e5e2). **Số thứ tự TẠM THỜI.** |
| 79? | **14:26:41Z** (chính xác từng giây) | 57c3e5e2 → f868abad | Chốt từ lượt này: `uptime -s` đọc tươi (14:45:06Z + kiểm lại 14:47:05Z) + btime 1794925601 + `who -b` 14:26 + boot_id f868abad + journal first entry 14:26:52Z + probe #50 14:46:56Z boot f868abad ok=2 fail=0 + 3 session trong vùng C. **Số thứ tự TẠM THỜI.** |

**Clock:** F79? ≈ **−2 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` cả 3 server đều
khớp **+2,0 s** (server hơn local đúng 2 s cả ba: example.com,
google.com, cloudflare.com — local epoch đọc ngay sau mỗi lần
fetch nên độ lệch thật ~−1 đến −2 s). **F79? là lần đo trực tiếp
đầu tiên trên boot #79?** — không dùng cận hai lần đo. Khác F77
(+1,0 s, đợt 130): đồng hồ local lần này chậm hơn ~1 s so với
lượt trước — ghi đúng số đo, không ép về "≈ 0". F77 ≈ 0 (±~2 s,
đã kiểm 11:38Z đợt 130, 3/3 nguồn). **F78 CHƯA ĐO** (T5b-130/
T8-130/T5-130 không đo HTTP Date trên boot #78? — đã kiểm bằng
grep trong cả ba doc; xem §2.5 + §4 mục 1).

**CẬN NHẢY CLOCK TẠI #78? VÀ #79? — 0 nhân chứng nhảy ở cả hai:**
- **0 nhân chứng nhảy tại #78?:** **0 session** sinh trước
  13:02:41Z có mtime sau 13:02:41Z (quét 207 exec-log). Quan sát
  cũ-clock muộn nhất trước #78?: session mtime 13:01:26Z — cách
  btime 75 s nên chỉ cho cận lỏng |X78?| < 75 s; cận chặt tới từ
  đo F77/F79? trực tiếp + suy luận lệch ~1 s dưới đây.
- **0 nhân chứng nhảy tại #79?:** **0 session** sinh trước
  14:26:41Z có mtime sau 14:26:41Z. Quan sát cũ-clock muộn nhất
  trước #79?: session mtime 14:00:19Z — cách btime tới 1.582 s
  nên chỉ cho cận lỏng |X79?| < 1.582 s (máy yên sau khi T10
  đóng, cận lỏng là đúng bản chất); F79? đo trực tiếp (±~1 s)
  là bằng chứng chính. Hai cây mtime đi tới 14:14:23Z (LIMITS
  gộp 130) — vẫn cách btime 738 s.
- **Lệch đồng hồ cũ ~1 s tại #78? (suy luận, KHÔNG phải đo trực
  tiếp — T8-130 §1):** dòng log harness cuối 13:02:42Z trên
  đồng hồ cũ (#77) trong khi btime #78? là 13:02:41Z — đồng hồ cũ
  chạy nhanh hơn đồng hồ mới ~1 s tại thời điểm reboot. Hệ quả:
  file ghi trước reboot trên đồng hồ cũ có thể mang mtime
  13:02:42Z và bị gán nhầm sang đoạn B khi đọc thô theo đồng hồ
  (xem §2.4 — đúng 4 file T4-attempt3 ở 13:02:42Z). Lệch này
  KHÔNG làm đổi gap danh nghĩa tính từ btime (btime lấy từ RTC
  lúc boot, không chịu drift của đồng hồ khách trong lúc chạy)
  và KHÔNG đổi verdict đoạn nào (loại 4 file 13:02:42Z thì đầu B
  vẫn dày từ 13:06:06Z, lỗ đầu chỉ 205 s << sàn 1.147 s). Ghi rõ
  để luồng sau khỏi tưởng phải áp cận hai lần đo hay sửa gap.
  (Khác đợt 129: lệch lúc đó ~33 s; lần này chỉ ~1 s — cùng
  mẫu, khác độ lớn; xem quyết parent đợt 130 §12.3(f) về hai
  khung chết #77.)

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #77→#78? = **7.570 s (2h06'10")** — **CHỨNG NHẬN DẠNG
  KHOẢNG [7.560 s, 7.580 s]** (đoạn A mù #50 đóng, xem §2.3 + §2.5).
- Gap #78?→#79? = **5.040 s (1h24'00")** — **CHỨNG NHẬN DẠNG
  KHOẢNG [5.030 s, 5.050 s]** (đoạn B mù #50 đóng, xem §2.3 + §2.5).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):**
  #78? từ #77 dự kiến [11:29:01Z, 13:37:19Z] (p10–p90 FULL57); thực
  tế **#78? 13:02:41Z NẰM TRONG dải** (lần thứ tám liên tiếp trong
  dải). #79? từ #78? dự kiến [13:35:19Z, 15:40:04Z] (p10–p90
  FULL58); thực tế **#79? 14:26:41Z NẰM TRONG dải** (lần thứ chín
  liên tiếp trong dải).
- Dải cơ học cho #80? từ #79? (p10–p90 FULL59): [14:59:26Z,
  17:00:38Z]; hiệu dụng sau probe #50: [14:46:56Z, 17:00:38Z].
  **Reboot #80? thật 15:01:30Z NẰM TRONG dải** (lần thứ mười liên
  tiếp — ghi nhận lượt này, T6 chốt số; xem §2.1 cuối).
- **#70 tới sớm hơn cả cận dưới p10 (đợt 125):** dải từ #69 là
  [21:11:16Z, 23:29:41Z]; #70 thật 20:54:19Z — ghi nhận đợt 125,
  không đổi lượt này.

**Reboot #78? + #79? — CHỈ GHI NHẬN giờ + bracket replay:**
- #78? xảy ra GIỮA LUỘT đợt 130 (lần thứ hai liên tiếp reboot rơi
  giữa lượt — T4 xong attempt3 trước reboot ~2 s theo btime boot
  mới (probe exit 13:02:39Z; xem F-131-3 của T1-131: "3 giây" chỉ
  đúng theo khung T4); T8 chạy lại harness 3/3 trên #78? sau cờ
  POSTBOOT_PASS mới 13:39:13Z).
- #79? xảy ra SAU khi đợt 130 đóng (T10 đóng 14:09:54Z trên boot
  #78?; đợt 131 mở trên boot #79? — lượt cron 21:35 +07 dispatch
  14:35:51Z, replay #79? khởi động 14:35:39Z đúng lúc lượt mở, như
  #77 khởi động muộn +39'08" đợt 130). Đây là reboot thứ 7 liên
  tiếp rơi vào khoảng ranh giới đợt (lúc mở / giữa lượt / giữa đợt
  đóng và lượt mở) (#71→#72 lúc mở đợt 127, #72→#73 giữa đợt 127,
  #73→#74 giữa đợt 127 đóng và lượt 128 mở, #74→#75 giữa đợt 128
  đóng và lượt 129 mở, #76→#77 giữa đợt 129 đóng và lượt 130 mở,
  #77→#78? giữa lượt 130, #78?→#79? giữa đợt 130 đóng và lượt 131
  mở) — mẫu lặp lại đã ghi ở LIMITS gộp đợt 127 §12.1 mục 4 +
  đợt 128 §12.1 mục 4 + đợt 129 + đợt 130.
- **Số thứ tự TẠM THỜI** (như #69/#70/#71/#72/#73/#74/#75/#76/#77).
- Tuổi thọ boot #77: 10:56:31Z → 13:02:41Z = **2h06'10"** (chết
  trong khung (13:02:16Z, 13:02:41Z] theo T8/T5b, hoặc
  (13:02:42Z, 13:04:14Z] theo T4 — parent chấp nhận ghi cả hai,
  quyết đợt 130 §12.3(f)). Tuổi thọ boot #78?: 13:02:41Z →
  14:26:41Z = **1h24'00"** (chết trong khung (14:15:34Z,
  14:26:41Z] theo T7-131 thu hẹp từ dữ liệu scheduler — khung
  rộng (14:14:23Z, 14:26:41Z] từ quan sát cuối của T2 vẫn đúng
  nhưng bị bao trong). Tuổi thọ boot gần đây cập nhật: #74?
  2h18'27", #75? 1h48'41", #76? 1h54'19", #77? 2h06'10", #78?
  1h24'00", #79? 2.089 s (34'49", chết giữa đợt 131 — xem §2.1
  cuối).

### 2.3 Hoạt động trong khoảng mù — vì sao A, B, C đều đóng

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **40 file** +
hidden_files **482 file**; **522 file, 510 mốc float phân biệt /
292 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3 — "mốc" là mtime float phân biệt, không
phải giây tròn; lần này giây (292) < float (510) vì nhiều file
chia sẻ cùng giây nhưng khác phần lẻ giây — ghi cả hai số, không
ép bằng nhau).
Ngoài hai cây: **79 file** (agents — exec-log/tool-output chiếm đa
số + stage files + system/memory; chi tiết xem
blind50-outside.txt); **/tmp: 0 file** trong mù #50 (xem
blind50-tmp.txt — trống). Gộp cả 4 phạm vi: **325 mốc giây phân
biệt** (324 trong ba đoạn + 1 mốc đúng tại B0 11:38:21Z — file
ghi lúc probe #49, xem §2.4). Chia mù làm ba
đoạn bởi #78? (13:02:41Z) và #79? (14:26:41Z):

- **Đoạn A: 11:38:21Z → 13:02:41Z (1h24'20" = 5.060 s, boot #77
  86538084) — ĐÓNG (mọi lỗ << sàn):**
  - **277 mốc** (hai cây), lỗ lớn nhất **895 s** (12:04:39Z →
    12:19:34Z), các lỗ còn lại đều < 895 s — thân đoạn A dày đặc.
    Mốc đầu 11:38:21Z (head 1 s — chính probe #49, float
    11:38:21.xxx); mốc cuối **13:02:39Z** (đuôi **2 s** < sàn
    1.147 s). **18 session** chạm đoạn A (5 chạm đuôi A).
  - Cửa sổ sàn [A-lo=11:57:28Z, A-hi=12:43:34Z] có mốc dày đặc
    (đợt 130 chạy xuyên suốt: T1/T3/T6/T7/T9 đóng 11:39–11:45Z,
    T5 instrumentation 11:40Z, T4 đo lượt yên #8 12:43–13:02Z).
  - **1 session bắc qua cắt A-lo (11:57:28Z)** (birth 11:56:14Z
    mtime 12:03:43Z). **0 session bắc qua cắt A-hi (12:43:34Z)**
    — và cũng không cần: điều kiện đóng là mọi lỗ < sàn.
  - Đuôi A (12:43:34Z, 13:02:41Z] DÀY ĐẶC ở cả 4 phạm vi: repo-1
    **0**, hidden_files **39**, ngoài cây **5**, /tmp **0**
    (xem blind50-sessions.log). 5 session chạm đuôi A (mtime
    cuối 13:01:26Z).
  - Quan sát cuối đoạn A: file ps-after-t4-attempt3.txt
    (13:02:39Z) + stop-sampler-t4-attempt3 (13:02:38Z) — T4 lượt
    yên #8 xong attempt3 sát reboot (probe exit 13:02:39Z theo
    chain-t4.log, chỉ 2 s trước btime #78? — xem F-131-3 của
    T1-131); trước đó run-webkit-t4-attempt3.log 13:00:41Z,
    session exec-log 13:01:26Z. Sau 13:02:39Z máy yên tới reboot
    #78? (đuôi 2 s theo hai cây — << sàn).
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn** (lỗ lớn nhất 895 s <
    sàn; gộp 4 phạm vi lỗ lớn nhất chỉ 461 s, xem §2.4).
- **Đoạn B: 13:02:41Z → 14:26:41Z (1h24'00" = 5.040 s, boot #78?
  57c3e5e2) — ĐÓNG (mọi lỗ << sàn):**
  - **180 mốc** (hai cây), lỗ lớn nhất hai cây **738 s**
    (14:14:23Z → 14:26:41Z — chính là đuôi B); lỗ lớn thứ hai
    chỉ 297 s. Mốc đầu 13:02:42Z (head 2 s — 4 file T4-attempt3
    ở ranh giới lệch ~1 s, xem §2.4; loại chúng thì đầu B vẫn
    dày từ 13:06:06Z, lỗ đầu 205 s); mốc cuối **14:14:23Z**
    (đuôi hai cây **738 s** < sàn 1.147 s). **9 session** chạm
    đoạn B, **0 session** chạm đuôi B.
  - Cửa sổ sàn [B-lo=13:21:48Z, B-hi=14:07:34Z] có mốc dày đặc
    (replay #78? 13:03–13:37Z; T5b đóng 13:40–13:43Z; T8b chạy
    13:39–13:51Z; T10 đóng đợt 13:5x–14:09Z + LIMITS gộp 130
    14:14:23Z).
  - **1 session bắc qua cắt B-lo (13:21:48Z)** (birth 13:14:46Z
    mtime 13:39:46Z). **0 session bắc qua cắt B-hi (14:07:34Z)**
    — và cũng không cần: điều kiện đóng là mọi lỗ < sàn.
  - Đuôi B (14:07:34Z, 14:26:41Z] KHÔNG TRỐNG ở cả 4 phạm vi:
    repo-1 **2** (GAP_ANALYSIS.md 14:09:03Z, LIMITS gộp 130
    14:14:23Z), hidden_files **2** (t10-count-final.txt
    14:09:47Z, round130-t10.done 14:09:54Z), ngoài cây **1**
    (stage file closing đợt 130, 14:09:37Z), /tmp **0**. 0 session
    chạm đuôi B — nhưng 5 file trên đủ đóng đuôi (lỗ lớn nhất
    trong đuôi chỉ 269 s).
  - Quan sát cuối đoạn B: LIMITS gộp đợt 130 (14:14:23Z) — file
    đóng đợt bị sửa sau khi T10 đóng (cờ round130-t10.done
    14:09:54Z) để thêm §12.3 quyết parent — mẫu F-129-3/F-130-1
    lần thứ ba liên tiếp (xem T1-131 F-131-1: file hiện 67.500 B,
    +4.357 B vs 63.143 B lúc đóng, §12.3 chỉ giải thích 4.324 B
    — còn 33 B chưa đối chiếu). Trước đó stage file closing
    14:09:37Z, session exec-log 14:00:19Z. Sau 14:14:23Z máy yên
    tới reboot #79? (đuôi gộp 738 s < sàn).
  - **Kết luận đoạn B: ĐÓNG — tối đa 0 ẩn** (lỗ lớn nhất 738 s <
    sàn; gộp 4 phạm vi lỗ lớn nhất cũng 738 s, xem §2.4).
- **Đoạn C: 14:26:41Z → 14:46:56Z (20'15" = 1.215 s, boot #79?
  f868abad) — ĐÓNG bằng đo uptime trực tiếp + probe #50 + dấu
  boot tươi:**
  - **`uptime -s` lúc 14:45:06Z = 14:26:41Z** chứng minh máy up
    liên tục từ #79? tới lúc đo; probe #50 14:46:56Z đọc boot_id
    f868abad tươi — cùng boot_id với boot bắt đầu 14:26:41Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C.) Đoạn C
    dài 1.215 s > sàn nên không áp cắt độ dài; uptime trực tiếp
    là closer cho toàn đoạn.
  - **Chuỗi dấu boot tươi củng cố:** 3 session chạm vùng C
    (birth 14:41:53Z, 14:44:48Z, 14:45:32Z — các luồng đợt 131)
    + 53 mốc mtime (mốc đầu 14:35:37Z — file system_prompt.md
    ghi lúc mở đợt; mốc cuối 14:46:53Z — file của luồng đợt
    131). Lỗ mtime (14:26:41Z → 14:35:37Z] 536 s là máy yên sau
    boot (replay khởi động 14:35:39Z, lượt cron 21:35 +07 mở đợt
    131 lúc 14:35Z, luồng bắt đầu ghi ~14:35–14:37Z), không
    observer — nhưng uptime đóng đoạn này. 0 session bắc qua
    cắt C-lo (14:45:48Z) / C-hi (14:27:49Z) — không cần vì
    uptime là closer.
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #50 ĐÓNG HOÀN TOÀN.**
Đoạn A đóng, đoạn B đóng, đoạn C đóng.
2 reboot đã chốt giờ (#78? 13:02:41Z + #79? 14:26:41Z — chính xác
từng giây trên đĩa) + **tối đa 0 ẩn**. Mù #50: **ĐÓNG HOÀN TOÀN**.
Đây là mù đóng hoàn toàn đầu tiên kể từ mù #47 (đợt 128); mù #48
đoạn A mở, mù #49 đoạn B mở — chuỗi hai mù mở liên tiếp đã dứt.

Ngoài hai cây: **79 file** có mtime trong mù #50 (agents —
exec-log/tool-output chiếm đa số + stage files đợt 130 + system/
memory; chi tiết xem blind50-outside.txt); **/tmp: 0 file** trong
mù #50 (xem blind50-tmp.txt — trống). Boot_id nhắc trong
exec-log sinh/viết trong mù: 86538084 6 file, 57c3e5e2 4 file,
f868abad 3 file (phiên T2 này nằm trong số đó).

### 2.4 Gộp 4 phạm vi + 2 phát hiện mới (phương pháp nối tiếp T2-130 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind50-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 165 mốc, lỗ lớn nhất **461 s** (12:09:33Z →
  12:17:14Z), floor=0 → **ĐÓNG** (khớp verdict hai cây: lỗ lớn
  nhất 895 s float — ngoài cây chẻ lỗ lớn nhất hai cây nhờ
  session exec-log 12:15:15–12:17:14Z; không đổi verdict).
- Đoạn B gộp: 124 mốc, lỗ lớn nhất **738 s** (14:14:23Z →
  14:26:41Z, đuôi), floor=0; lỗ lớn thứ hai 297 s, thứ ba 269 s →
  **ĐÓNG, tối đa 0 ẩn**.
- Đoạn C gộp: 35 mốc, lỗ lớn nhất 536 s (đầu đoạn, máy yên sau
  boot) — **ĐÓNG bằng uptime** (không áp luật lỗ cho đoạn C).
- Tổng gộp 325 mốc giây = 324 trong ba đoạn + 1 mốc đúng tại B0
  (11:38:21Z — file ghi lúc probe #49, float 11:38:21.xxx, bị
  loại khỏi đoạn A vì đoạn A mở ở (B0, …] theo giây tròn).
- Không có file nào trong `~/workspace/goals` ngoài hidden_files
  có mtime trong mù (kiểm bằng find riêng — vùng duy nhất hai
  lần quét chính không phủ, đã kiểm bổ sung, 0 file).

**Phát hiện 1 — 4 file 13:02:42Z ở ranh giới A/B là cùng một
hiện tượng lệch ~1 s (mới):** `vite.lock.queue/cooldown-t4`,
`round130-t4/chain-t4.log`, `round130-t4/classb-t4-attempt3.txt`,
`round130-t4/run-t4-attempt3.nohup.log` cùng mtime 13:02:42Z —
đúng 1 s sau btime #78? (13:02:41Z), khớp suy luận lệch đồng hồ
cũ ~1 s của T8-130 §1 (dòng harness cuối 13:02:42Z trên đồng hồ
cũ #77). Cả 4 đều là file T4-attempt3 (lượt yên #8) ghi lúc
kết thúc attempt3 — tức ghi TRƯỚC reboot trên đồng hồ cũ, nhưng
mtime đọc thô rơi vào đoạn B. **Không đổi verdict nào:** loại
cả 4 khỏi đoạn B thì đầu B vẫn dày từ 13:06:06Z (lỗ đầu 205 s);
đoạn A vẫn đóng (đuôi 2 s kể cả cộng lệch 1 s). Ghi rõ để luồng
sau khỏi tưởng mốc 13:02:42Z là bằng chứng chắc chắn cho đầu
đoạn B — cùng bài học như file T3 09:02:34–35Z ở mù #49, chỉ
khác độ lớn lệch (1 s thay vì 33 s).

**Phát hiện 2 — LIMITS gộp 130 sửa sau khi đóng, lần thứ ba liên
tiếp (mới, nối tiếp F-129-3/F-130-1):** file mtime 14:14:23Z,
sau cờ `round130-t10.done` (14:09:54Z) 4'29" — nội dung thêm là
§12.3 quyết parent (khớp brief parent giao đợt 131). T1-131
F-131-1 đã ghi: file hiện 67.500 B, +4.357 B vs 63.143 B lúc
đóng, §12.3 chỉ giải thích 4.324 B — còn 33 B chưa đối chiếu
(không có snapshot lúc đóng; đề nghị T10 đợt sau lưu sha256 lúc
đóng). T2 chỉ ghi nhận mtime + vai trò của file này (quan sát
cuối đoạn B, 14:14:23Z) — việc đối chiếu kích thước thuộc T1.

### 2.5 Phân phối gap — CERT n=42 → n=44 / FULL n=57 → n=59 (2 gap mới CHỨNG NHẬN DẠNG KHOẢNG)

**Gap #77→#78? = [7.560 s, 7.580 s] (mid 7.570 s) CHỨNG NHẬN DẠNG
KHOẢNG (mới)** — đoạn A mù #50 đóng (§2.3). Biên ±10 s của T5
dùng nguyên văn; mid không dịch chuyển (thực hành của T5). Caveat:
F78 chưa đo trực tiếp (xem §2.2); lệch đồng hồ cũ ~1 s tại #78?
chỉ ảnh hưởng vị trí mtime trong 1 s quanh ranh giới A/B, không
ảnh hưởng gap danh nghĩa tính từ btime (RTC). Tiền lệ: gap
#72→#73 chứng nhận dạng khoảng đợt 128 trong khi F73 cũng chưa
từng đo; gap #75→#76 chứng nhận dạng khoảng đợt 130 trong khi
F76 cũng chưa đo — cả hai đã được parent chấp nhận. Không áp hint
hướng nào.

**Gap #78?→#79? = [5.030 s, 5.050 s] (mid 5.040 s) CHỨNG NHẬN DẠNG
KHOẢNG (mới)** — đoạn B mù #50 đóng (§2.3). Biên ±10 s của T5
dùng nguyên văn; mid không dịch chuyển. Caveat: F78 chưa đo trực
tiếp (như trên); F79? ≈ −2 s đã đo trực tiếp lượt này (xem §2.2).
Không áp hint hướng nào.

**Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
#49 mở (T2-130 §2.3; kiểm lại lượt này, verdict không đổi — xem
§2.6). **CERT/FULL không tính gap này.**

**Gap #75→#76 = [6.511 s, 6.531 s] VẪN LÀ KHOẢNG** — đã chứng nhận
đợt 130 (đoạn A mù #49 đóng). Không đổi lượt này.

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

**Cross-check tái hiện T2(130) 100%:** chạy blind49-gaps.py
verbatim cho lại đúng CERT n=42 / FULL n=57 của T2 đợt 130 (xem
blind50-gaps.txt: CERT42 mean 1h41'27" median 1h52'28" p10
0h33'27" p90 2h23'51" sd 0h42'56" min 0h19'07" max 3h14'08";
FULL57 mean 1h48'02" median 1h54'16" p10 0h32'31" p90 2h40'49"
sd 0h56'33" min 0h19'07" max 5h43'18"; in 90–150' = 31, <60' = 11,
>180' = 6, >240' = 2 — khớp T2-130 §2.5 từng số). Cả hai gap mới
đều vào (A và B đều đóng) nên cả CERT lẫn FULL đều +2.

- **CERT n=44 (mới):** mean 1h41'37" median 1h52'28" p10 0h36'47"
  p90 2h23'10" sd 0h42'11" min 0h19'07" max 3h14'08".
- **FULL n=59 (mới):** mean 1h47'56" median 1h54'16" p10 0h32'45"
  p90 2h33'58" sd 0h55'42" min 0h19'07" max 5h43'18"; in 90–150'
  = 32, <60' = 11, >180' = 6, >240' = 2.
- Độ nhạy biên LO/HI của 2 gap mới: CERT44 mean chỉ dao động ±1 s
  (1h41'36"–1h41'37"), FULL59 mean dao động 1 s (1h47'56"–
  1h47'57") — biên ±10 s không làm lệch phân phối.
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới 7.570 s
  = 2h06'10" và 5.040 s = 1h24'00" đều nằm trong dải; gap #76→#77
  6.859 s cũng nằm trong dải nhưng chưa chứng nhận nên không vào).
- **Tốc độ reboot (đồng hồ ghi nhận):** 79 / 162,14 h = **1 reboot
  mỗi 123,1 phút** (từ #1 2026-11-10T20:18:10Z tới #79?
  2026-11-17T14:26:41Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 83 / 162,14 h = **1 mỗi 117,2 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn G1 (+4), mù #46
  đoạn A (+4), mù #48 đoạn A (+2) và mù #49 đoạn B (+1). Mù #50:
  **+0** (đóng hoàn toàn).
- **#78? vào dải cơ học (xem §2.2):** lần thứ tám liên tiếp trong
  dải. **#79? vào dải cơ học:** lần thứ chín liên tiếp trong dải.
  **#80? (15:01:30Z) cũng vào dải cơ học từ #79?** [14:59:26Z,
  17:00:38Z] — lần thứ mười liên tiếp (ghi nhận lượt này, T6
  chốt số; xem §2.1 cuối).

### 2.6 Mù #49 đoạn B kiểm lại trên đĩa hiện tại — VERDICT KHÔNG ĐỔI

Theo brief đợt 131 (điều tra mù #49 đoạn B còn mở) + quyết parent
đợt 130 §12.3(e) (gap #76→#77 giữ SPAN, không giao kiểm sâu lại),
T2 chạy lại code tính gộp blind#49 trên đĩa hiện tại (không chỉ
đọc lại snapshot đóng băng đợt 130) để xác nhận verdict trong hồ
sơ vẫn đúng — xem blind49-recheck.py / blind49-recheck.log:
- Số file có mtime trong cửa sổ #49 lúc kiểm lại: repo-1 **11**
  (đợt 130: 12), hidden_files **309** (đợt 130: 361), ngoài cây
  **37** (đợt 130: 40), /tmp **0** (đợt 130: 1). **0 file mới**
  xuất hiện trong cửa sổ (đúng kỳ vọng: không file nào có thể
  mang mtime trong một cửa sổ đã khép sau khi cửa sổ khép).
- 52 file trong snapshot T2-130 không còn mtime trong cửa sổ —
  giải thích hết bằng diff (xem §4 mục 4): (a) ghi đè mtime mới
  hơn — GAP_ANALYSIS.md (giờ 14:09:03Z, closing đợt 130),
  system_prompt.md / reconciliation_state.json / CURRENT.md
  (file runtime ghi đè liên tục), round-in-progress.md (ghi lại
  14:37:27Z cho đợt 131), tree-md5.txt + prereg-t4.md của T4-130;
  (b) xóa file tạm — toàn bộ round93-u4/work/* (~40 file, dọn
  dẹp giữa hai lượt) + 5 file analyze-t4-*.py của round129-t4 +
  cooldown-t4 + 1 file round109-k7 + vite-lock-v2.log; (c) /tmp
  bị xóa (ephemeral, đúng bản chất).
- **Tái hiện đúng từng giây các lỗ quyết định:**
  - Đoạn A gộp: lỗ lớn nhất **116 s** (08:59:20Z → 09:01:16Z) —
    **ĐÓNG**, đúng số T2-130.
  - Đoạn B gộp: lỗ lớn nhất **2.252 s** (10:04:23Z → 10:41:55Z) —
    **MỞ, tối đa 1 ẩn**, đúng số T2-130; lỗ lớn thứ hai 876 s
    (đuôi) cũng đúng số.
  - Đoạn C gộp: lỗ lớn nhất **2.363 s** (10:56:31Z → 11:35:54Z)
    vs 2.347 s đợt 130 (+16 s — mốc sớm nhất ngoài cây
    system_prompt.md 11:35:38Z bị ghi đè ra khỏi cửa sổ; mốc
    sớm nhất còn lại 11:35:54Z) — **vẫn ĐÓNG bằng uptime**,
    không đổi verdict.
- **Kết luận: mù #49 KHÔNG ĐÓNG HOÀN TOÀN — không đổi** (A đóng,
  B mở tối đa 1 ẩn, C đóng). Gap #76→#77 = 6.859 s **giữ SPAN**.
  Không giao luồng sau kiểm lại B mù #49 (tiền lệ quyết đợt 126
  §12(h) + quyết đợt 130 §12.3(e)) — chờ bằng chứng ngoài VM.

### 2.7 Quét writeFileSync lần thứ 37 — chênh 0 (lần thứ 37 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round131-t2, đổi OUT sang
  round131-t2) **14:59:07Z → 14:59:24Z 17/11 (17 s, có SCAN-END)**.
  Scan chạy trên boot #79?, SAU khi mù #50 đã đóng bằng probe #50
  (14:46:56Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **878 dòng / 245 file** (phạm vi 3.075 file); R7b đối
  chiếu: **903 dòng / 262 file** (phạm vi 12.468 file); copies:
  **25 dòng / 17 file** — y hệt lần 36. Đối chiếu chéo:
  878+25=903=R7b, **chênh 0**.
- **+7 dòng / +1 file so với lần 36** (871/244 → 878/245), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | PHASE9_GAP_ANALYSIS.md | +1 (27 → 28) | 14:09:03Z 17/11 | §59 thêm ở closing đợt 130 (nhắc `writeFileSync` thêm 1 lần) |
  | docs/PHASE9_ROUND130_T2_EPERM_LIMITS.md | +6 (0 → 6) | 11:48:32Z 17/11 | Tài liệu T2 đợt 130 (nhắc `writeFileSync` 6 lần); viết SAU scan lần 36 (11:45:04Z 17/11) nên lần này mới vào |
- Phạm vi: 3.075 = 3.064 + 11 net (**11 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 11 file mới gồm 7 LIMITS đợt
  130 (gộp + T2/T3/T4/T5/T5b/T8) + 4 LIMITS đợt 131 (T3/T5/T7/T9,
  viết trước scan 14:59Z); 0 file mất). Copies y hệt lần 36
  (diff 0 dòng).
- **Kết luận: 37 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #50.

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
  né EPERM trong mù #50.

## 3. RAM trong mù #50 — max 3.317 MB (55% guard), birefnet KHÔNG chạy

- **4 mẫu MemAvailable của lượt (đo trực tiếp):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 14:45:06Z | **745.868 kB** | Trước probe #50 (boot #79?) |
  | 14:46:56Z | **1.805.768 kB** | Lúc probe #50 (boot #79?) |
  | 15:05:43Z | **1.370.272 kB** | Sau reboot #80? (boot mới ad1327ef) — KHÔNG tính vào max trong mù #50 |
- **Max RAM biết được TRONG mù #50 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 260 mẫu RAM; **max 3.317 MB**
  (T4 gate0-wait #4, 11:44:20Z, đoạn A, dòng `RAMavail=3317MB`
  trong round130-t4/poll-t4.log — đã xác minh trực tiếp dòng log)
  = **55% ngưỡng guard** — cao hơn max 2.749 MB mù #49 nhưng vẫn
  thấp hơn max kỷ lục 4.576 MB mù #42; đoạn A max **3.317 MB**;
  đoạn B max **2.112 MB** (T4 attempt3 exit, 13:02:42Z, dòng `RAM
  2112MB avail` trong round130-t4/chain-t4.log — đã xác minh trực
  tiếp); đoạn C max **1.841 MB** (14:46:17Z).
- **Ghi nhận chênh lệch (không kết luận nguyên nhân):** T9-131 đo
  RAM khả dụng 502–546 MB trong cùng khoảng thời gian (balloon
  virtio 6.443.824 kB ~6,29 GB giải thích RAM kẹt ~500 MB) — trong
  khi 2 mẫu trực tiếp của T2 là 728 MB (14:45:06Z) và 1.763 MB
  (14:46:56Z). Các mẫu đo ở thời điểm khác nhau trong lúc replay
  install + luồng đợt 131 khởi động — RAM khả dụng dao động nhanh
  >1 GB trong 2 phút (mẫu T2: 728 MB → 1.763 MB trong 110 s).
  T9 là chủ quản RAM/headroom; T2 chỉ ghi số đo trực tiếp của
  mình kèm thời điểm.
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 3.317 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T2 đợt 130)

1. **Prereg KHÔNG đặt điều kiện chặt hơn tiền lệ — không cần ghi
   đè (mới, nối tiếp T2-130 §4 mục 1):** prereg đợt này viết điều
   kiện chứng nhận gap theo đúng tiền lệ đã được parent chấp nhận
   (gap #72→#73 đợt 128 + gap #75→#76 đợt 130: chứng nhận dạng
   khoảng với biên ±10 s của T5 + caveat F chưa đo) — F78 chưa đo
   không cản chứng nhận. Cả hai gap mới đều chứng nhận đúng điều
   kiện prereg đã viết. Không sửa prereg sau khi thấy số; mọi số
   gap trong LIMITS này đều lấy từ code, không lấy từ prereg.
2. **Prereg dự báo ĐÚNG HẾT các verdict có dự báo chắc (mới, §0):**
   probe #50 boot f868abad ok=2 fail=0 ĐÚNG; log +3 ĐÚNG; #78?
   trong dải cơ học ĐÚNG (lần thứ tám liên tiếp); đoạn A ĐÓNG
   ĐÚNG; đoạn C ĐÓNG bằng uptime ĐÚNG; EPERM 0 sóng ĐÚNG; WFS
   chênh 0 ĐÚNG (878 dòng — trong khoảng dự báo ~871–880); RAM
   max < 4.576 MB ĐÚNG (3.317 MB). Đoạn B prereg chỉ ghi "KHÔNG
   CHẮC" (không dự báo chắc) — verdict ĐÓNG nằm trong vùng không
   chắc đã ghi, không tính là dự báo sai. Prereg KHÔNG dự báo
   reboot 15:01:30Z (xảy ra sau probe #50) — không tính vào dự
   báo.
3. **Chốt chặn round-in-progress.md — diễn giải trước khi làm
   (mới, prereg §0):** file TỒN TẠI lúc T2 mở lượt (mtime
   14:37:27Z) nhưng nội dung ghi rõ "Đợt 131 đang chạy (cron
   21:35 +07 17/11/2026) — Parent: cron vcut-build-loop" và chủ
   đề đợt gồm "probe #50/mù #50" — đây là chốt chặn của CHÍNH
   đợt 131 do parent tạo, không phải đợt main-chat; các luồng
   round131-t* khác cũng đang chạy song song. Luật vòng lặp §0
   ("bỏ qua khi đợt main-chat đang chạy") nhắm vào đợt main-chat;
   parent giao trực tiếp nhiệm vụ T2 đợt 131 nên T2 làm việc bình
   thường. Công việc T2 vốn chỉ đọc log + viết LIMITS + stage
   file text, không sửa production code.
4. **Reboot giữa phiên T2 (mới, §2.1 cuối):** boot #79? chết
   15:01:30Z, sau khi mọi đo mù #50 đã xong (đo cuối 14:59:24Z).
   Phiên T2 sống sót — không mất file nào (xác minh 15:06:59Z:
   toàn bộ round131-t2 + log probe 142 dòng + heartbeat n=50 còn
   nguyên). Khung chết #79? hẹp 23 s nhờ lần ghi cuối của chính
   T2 (blind49-recheck.log 15:01:07Z). Bài học: khi reboot giết
   session giữa chừng, kiểm tra đĩa trước rồi tiếp tục từ chỗ dở
   (đúng brief) — lần này không có gì dở vì đo đã xong trước
   reboot; chỉ có bracket dpkg.log #79? bị mất theo reboot (hồ
   sơ T5-131 còn lại).
5. **Kiểm lại mù #49 bằng quét lại trên đĩa hiện tại, không chỉ
   đọc snapshot đóng băng (mới, §2.6):** recheck quét lại cả 4
   phạm vi cho cửa sổ #49 và tính lại lỗ gộp bằng code. Phát hiện
   52 file snapshot không còn mtime trong cửa sổ (xóa/ghi đè) —
   nhưng các lỗ quyết định tái hiện đúng từng giây (A 116 s,
   B 2.252 s); chỉ đầu lỗ đoạn C lệch +16 s do mốc ngoài cây bị
   ghi đè. Bài học: snapshot đóng băng là hồ sơ gốc; quét lại
   chỉ xác nhận verdict, không thay thế hồ sơ gốc — và file
   runtime (system_prompt.md, reconciliation_state.json,
   CURRENT.md, round-in-progress.md) có mtime trôi liên tục nên
   không dùng làm mốc neo cho các mù cũ.
6. **4 file 13:02:42Z ở ranh giới A/B (mới, §2.4):** cùng một hiện
   tượng lệch ~1 s (T8-130 §1) — cả 4 đều là file T4-attempt3.
   Đã làm test loại trừ (loại cả 4, đầu B vẫn dày từ 13:06:06Z,
   lỗ đầu 205 s). Khác đợt 129 (lệch ~33 s, 4 file T3 ở
   09:02:34–35Z) chỉ ở độ lớn — cùng bài học: mtime trong vài
   giây sau btime không phải bằng chứng chắc chắn cho đầu đoạn
   sau reboot.
7. **F79? đo bằng 3/3 nguồn, giá trị +2 s (mới, §2.2):** khác F77
   (+1,0 s, đợt 130) — ghi đúng số đo (+2 s cả ba server, local
   chậm ~1–2 s) thay vì ép về "≈ 0". Với dung sai ±~2 s quen
   thuộc thì F79? vẫn trong dung sai, nhưng con số thô được ghi
   rõ để luồng sau khỏi tưởng đồng hồ không trôi.
8. **Kiểm lại boot TRƯỚC (14:45:06Z) và SAU khi viết LIMITS
   (15:06:59Z):** trước là boot f868abad (#79?), sau là boot
   ad1327ef (#80?) — **CÓ reboot giữa phiên T2 lượt này** (xem
   §2.1 cuối + §4 mục 4). Probe #50 và mù #50 KHÔNG bị ảnh hưởng
   (đo xong trước reboot 15:01:30Z); mù #51 mở từ probe #50 và
   chứa reboot #80? — việc của T2 đợt 132.
9. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
   model đóng/nhạc bản quyền.**
10. **Không quét toàn workspace lượt này:** chỉ dùng góc hẹp/mục
    tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ repo-1/goals
    + /tmp + exec-logs + kiểm bổ sung goals-ngoài-hidden_files).
11. **Stage batch:** chỉ 1 file text (LIMITS doc này),
    NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
    checkpoint + stage file).
12. **Ghi rõ:** số thứ tự reboot #48–#80? vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
13. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F78 CHƯA ĐO + lệch đồng hồ cũ ~1 s
    tại #78? vào hồ sơ (xem §2.2 + §2.5).
14. **Cross-check tái hiện T2(130) 100%** (CERT n=42 / FULL n=57)
    trước khi kết luận số mới — chạy blind49-gaps.py verbatim
    qua exec trong blind50-gaps.py (xem blind50-gaps.txt). Lỗi
    nhỏ lúc chạy đầu: `f57` chỉ tồn tại trong namespace exec
    (`_ns["f57"]`) — sửa bằng cách kéo ra khỏi `_ns` rồi chạy
    lại exit 0; không dùng số nào từ lần chạy lỗi (lần chạy lỗi
    đã tính đúng CERT44/FULL59 trước khi crash ở dòng in dải cơ
    học — số đó chỉ dùng sau khi chạy lại exit 0 xác nhận lại).
15. **md5 preview.tsx KHÔNG ĐỔI trong đợt 131 (ghi nhận):**
    preview.tsx 805409f0, mtime 11:40:32Z (instrumentation (c2)
    của T5 đợt 130); media.ts không đổi 2c384ed1. T2 không sửa
    production file nào. (Lần đầu md5sum gõ sai đường dẫn
    `src/components/` — find ra đúng `src/preview.tsx` +
    `src/media.ts` rồi chạy lại; số trên là số chạy lại.)
16. **Các luồng đợt 131 khác đang chạy lúc T2 đóng** — T2 chỉ ghi
    nhận trạng thái (T1/T4/T5/T7/T9 đã có cờ .done; T3/T6/T8/T10
    đang chạy), không phụ thuộc kết quả các luồng đó. T4 lượt yên
    #9 xong 15:00:06Z — 84 s trước reboot #80? (xem §2.1 cuối).
17. **T2 KHÔNG mở Xvfb** (luồng probe không cần browser) nên
    không có Xvfb nào để kill — luật đứng đợt 127 §12.1.3 (mỗi
    driver tự kill Xvfb của mình) không phát sinh việc lượt này.
18. **Replay #79? đã xong đầy đủ theo T5-131 (mới, §2.1):**
    1.509 dòng / 217 installs lúc 14:48:40Z, cờ POSTBOOT_PASS
    14:50:18Z — snapshot của T2 (163 installs lúc 14:47:54Z)
    chỉ là giữa chừng; T5 là chủ quản replay, T2 chỉ ghi bracket.
    Replay #80? mới bắt đầu (2 dòng 15:02:19Z) — T5 theo dõi
    tiếp.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #50: ĐÓNG HOÀN TOÀN (mới — xem §2.3).** Đoạn A
   đóng, đoạn B đóng, đoạn C đóng. 2 reboot đã chốt giờ (#78?
   13:02:41Z + #79? 14:26:41Z) + tối đa 0 ẩn. Gap #77→#78?
   chứng nhận dạng khoảng [7.560 s, 7.580 s]; gap #78?→#79?
   chứng nhận dạng khoảng [5.030 s, 5.050 s]. **CERT n=44 /
   FULL n=59 (mới).**
2. **Mù #51 MỚI MỞ (từ probe #50 14:46:56Z) — việc của lượt sau:**
   đã chứa reboot #80? (15:01:30Z, boot ad1327ef) — probe #51 +
   điều tra đoạn từ #79? ở đợt 132. Gap #79?→#80? = 2.089 s danh
   nghĩa, SPAN cho tới khi đoạn tương ứng đóng.
3. **Gap #77→#78? = [7.560 s, 7.580 s] CHỨNG NHẬN DẠNG KHOẢNG
   (mới — xem §2.5).** Caveat: F78 chưa đo trực tiếp; lệch đồng
   hồ cũ ~1 s tại #78? (suy luận từ log harness, không phải đo
   trực tiếp) chỉ ảnh hưởng vị trí mtime trong 1 s quanh ranh
   giới, không ảnh hưởng gap danh nghĩa (RTC). Tiền lệ #72→#73
   (F73 cũng chưa đo) + #75→#76 (F76 cũng chưa đo) đã được
   parent chấp nhận.
4. **Gap #78?→#79? = [5.030 s, 5.050 s] CHỨNG NHẬN DẠNG KHOẢNG
   (mới — xem §2.5).** Caveat: F78 chưa đo trực tiếp; F79? ≈ −2 s
   đã đo trực tiếp lượt này.
5. **Mù #49 đoạn B: MỞ — kiểm lại lượt này, VERDICT KHÔNG ĐỔI
   (mới — xem §2.6).** Gap #76→#77 giữ SPAN theo quyết parent
   đợt 130 §12.3(e). Không giao luồng sau kiểm lại B mù #49.
6. **Mù #48 (đoạn A): MỞ — parent CHƯA quyết có chấp nhận để mở
   hay không.** T2 không kiểm lại lượt này. Gap #74→#75 giữ SPAN.
7. **Mù #47: ĐÓNG HOÀN TOÀN (đợt 128) — KHÔNG đổi lượt này.**
   T2 không kiểm lại.
8. **Mù #46 (đoạn A): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (tiền lệ
   quyết đợt 126 §12(h), đính chính đợt 127 §12(c)). T2 không
   kiểm lại lượt này. Gap #71→#72 giữ SPAN.
9. **Mù #45 (đoạn G1): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h)). T2 không kiểm lại lượt này. Gap #70→#71 giữ SPAN.
10. **Mù #44 đoạn D: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
    125 §12(h), kiểm sâu 1 lần đã xong đợt 126). T2 không kiểm lại
    lượt này. Gap #68→#69 giữ SPAN.
11. **Mù #43 (gap #67→#68): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ**
    (quyết đợt 124 §12.4). T2 không kiểm lại lượt này. Gap #67→#68
    giữ SPAN.
12. **Mù #40 đoạn B: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
    124 §12.3). T2 không kiểm lại lượt này. Gap #63→#64 giữ SPAN.
13. **Gap #66→#67 = KHOẢNG [27'06", 28'28"] ĐÃ CHỨNG NHẬN DẠNG
    KHOẢNG (đợt 124) — parent ĐÃ CHẤP NHẬN cả ba điểm (§12.5).**
    Không đổi lượt này.
14. **Reboot #78? (13:02:41Z, boot 57c3e5e2) + #79? (14:26:41Z,
    boot f868abad) — CHỈ GHI NHẬN giờ + bracket replay (mới, xem
    §2.2 cuối + §2.1).** Gap #77→#78? thuộc mù #50 đoạn A, ĐÓNG;
    gap #78?→#79? thuộc mù #50 đoạn B, ĐÓNG. **Không tự đánh số
    thứ tự chắc chắn** — số #78?/#79? là tạm thời như #77. **Lưu ý
    replay:** bracket #79? đầy đủ thuộc về T5-131 (1.509/217 lúc
    14:48:40Z, POSTBOOT_PASS 14:50:18Z); bracket #78? thuộc về
    T5b-130 (1.509/217, POSTBOOT_PASS 13:39:13Z). Cả hai file
    dpkg.log gốc đều đã mất theo reboot sau (như bracket
    #71/#72/#73/#74/#75/#76/#77).
15. **Reboot #80? (tạm) lúc 15:01:30Z, boot ad1327ef — CHỈ GHI
    NHẬN giờ + bracket replay mới bắt đầu (mới, xem §2.1 cuối).**
    Boot #79? chết trong khung (15:01:07Z, 15:01:30Z] (23 s);
    tuổi thọ #79? 2.089 s (34'49"). Gap #79?→#80? = 2.089 s danh
    nghĩa, SPAN. **Số thứ tự TẠM — T6 đợt 131 chốt** (kèm công
    việc mù #37, theo quyết đợt 130 §12.3(h)).
16. **RAM max 3.317 MB = 55% guard (mới — xem §3).** Cao hơn max
    2.749 MB mù #49 nhưng vẫn thấp hơn max kỷ lục 4.576 MB
    mù #42. **Birefnet KHÔNG chạy** (vẫn dưới guard 6 GB; quyết
    parent §12.7 vẫn đứng). u2net vẫn là fallback chính thức.
    Ghi nhận chênh lệch mẫu RAM trực tiếp của T2 (728 MB →
    1.763 MB trong 110 s) so với khoảng 502–546 MB của T9-131
    — khác thời điểm đo, T9 là chủ quản RAM.
17. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
    --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
    117, chưa trả lời — nhắc lần 16 ở đợt 130 theo LIMITS gộp;
    T5-131 cũng nhắc lần 16). Watcher này sẽ lấp đúng loại lỗ
    như lỗ đoạn B của mù #49 (2.252 s — lần này không còn lỗ
    nào > sàn trong mù #50, nhưng mù #51 đã mở và chứa reboot
    #80? giữa đợt).
18. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
    parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
    117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
19. **EPERM không tuyên bố đã hết** (sóng gần nhất ~146h51'
    trước probe #50). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
20. **Mù #51 MỚI MỞ (từ probe #50 14:46:56Z) — việc của lượt sau:**
    probe #51 + điều tra đoạn từ #79? (xem mục 2 + §2.1 cuối).
    T2 KHÔNG tự chạy probe #51 lượt này (nhịp probe là 1/lượt).
