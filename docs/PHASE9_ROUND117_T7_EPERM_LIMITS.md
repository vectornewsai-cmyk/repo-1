# PHASE9 ROUND117 T7 — EPERM: probe #36 + mù #35 KHÔNG ĐÓNG HOÀN TOÀN + WFS lần 23 chênh 0

> Luồng T7, đợt 117 vòng lặp Phase 9 VCut Studio (lượt cron 15:35 +07,
> 15/11/2026; làm việc 08:38Z → 08:57Z 15/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + xác định reboot
> #49/#50/#51 trong mù #35 kể từ probe #35 (21:04:50Z) + quét sóng EPERM +
> quét writeFileSync lần thứ 23 + ghi RAM (birefnet: KHÔNG chạy —
> vẫn dưới ngưỡng guard, xem §3).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round117-t7/prereg-t7.md (định nghĩa probe #36, mốc đối
> chiếu, tiêu chí đóng mù #35, cách xử lý sàn đoạn A/B/C/D/E).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #31, mù #30, mù #29, mù #28,
> mù #26, mù #24, mù #21, hay reboot #16** — chỉ báo cáo "không thấy"
> vs "không có". Mù #31 KHÔNG thử lại (đã thử hết nguồn ở đợt 114).
> G1 + mù #22/#28/#29/#30 chờ user quyết — chỉ ghi nhận trạng thái.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (08:42:38Z → 08:42:46Z):**
  `status` báo **DEAD/STALE** (heartbeat age 41.868 s, last #35
  21:04:50Z, boot 0c2a9f2f, exit 1 theo quy định script — exit lấy từ
  `$?` trực tiếp, không qua pipe, xem §1); `once` ngay sau đó là
  **probe #36, boot 22536366 (ĐỔI), ok=2 fail=0**, exit 0; `status`
  chạy lại **ALIVE** (age 1 s, n=36), exit 0. Log v2 tăng đúng **3
  dòng** checklist (97 → 100): dòng DEAD mới cho heartbeat #35 +
  dòng `boot changed` + dòng probe #36 — **như R7/S7 (+3) vì lượt này
  chưa có dòng DEAD nào cho #35**; prereg §1 đã dự báo đúng +3 trước
  khi đo. Heartbeat nay n=36, ts 08:42:46Z, boot 22536366.
- **Reboot #52 MỚI (phát hiện lượt này, không có trong brief):**
  **08:29:12Z**, boot `22536366-8716-46f0-a999-cd4199080854` — ~6 phút
  trước khi lượt cron 15:35 +07 (08:35Z) spawn đợt 117. Xác minh
  bằng `uptime -s` ×2 + btime 1794731352 + `who -b` + journal 1 boot
  + wtmp + `ps` systemd PID 1 START 08:29:22 (xem §1).
- **Khoảng mù #35: 21:04:50Z 14/11 → 08:42:46Z 15/11 (11h37'56") —
  KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này).** Đoạn A **ĐÓNG** (poller S10
  #1 + đọc boot tươi lúc START + sàn đuôi); đoạn E **ĐÓNG** (đo uptime
  trực tiếp lúc probe + dấu boot tươi sibling đợt 117). Đoạn B, C, D
  **MỞ**: 3 cửa sổ mở, tổng **6h49'50"** — B (23:17:54Z,
  ~01:57:53Z] 2h39'59" (tối đa 9 ẩn); C [~02:36:07Z, ~04:11:53Z]
  1h35'46" (tối đa 5–6 ẩn); D (~05:36Z, 08:10:05Z] 2h34'05" (tối đa
  9 ẩn). **Tổng tối đa 24 reboot ẩn danh nghĩa (23–24 với biên
  không chắc chắn)** — theo số học sàn, không phải khả năng thực tế
  (xem §2.3). Đây là mù đầu tiên KHÔNG đóng hoàn toàn kể từ mù #31
  (chuỗi 3 mù đóng liên tiếp #32/#33/#34 đã đứt).
- **Gap #48 → #49 = 2h03'00" — ĐƯỢC CHỨNG NHẬN (mới, lượt này).**
  Khoảng (19:43:46Z, 21:46:46Z) không chứa cửa sổ mở nào (phần
  (19:43:46Z, 21:04:50Z] đã đóng bởi mù #34 đoạn C; đoạn A mù #35 đã
  đóng — xem §2.3). Tập gap đơn đã chứng nhận tăng **n=27 → n=28**;
  toàn chuỗi **n=42 → n=43** (xem §2.5). Dải chứng nhận
  [19'07", 3h14'08"] không đổi (gap mới nằm giữa).
- **Gap #49 → #50 ≈ 4h30'14", #50 → #51 ≈ 2h14'00", #51 → #52 ≈
  3h58'12" — đều là CẬN TRÊN, KHÔNG được chứng nhận** (đoạn B/C/D
  mở; #50/#51 chỉ là giờ khoảng ± vài phút, chưa chốt từng giây —
  xem §2.2). Hai gap vượt max dải chứng nhận 3h14'08" (#49→#50,
  #51→#52) nhưng đó là cận trên chưa chứng nhận, không phá dải.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong 128
  file *.log có mtime trong mù #35 (0 file repo-1, 128 file
  hidden_files — đếm lại độc lập từ đĩa); 2 dòng "sóng EPERM đã tắt"
  thật đều là **dương tính giả đã biết** (dòng launcher S10 O8,
  22:57:34Z + 22:58:28Z, đoạn B). 3 hit "vẫn bật"/"CẢNH BÁO"/
  "Operation not permitted" đều là **dòng nhãn trong chính file
  sweep-log của S7** (ghi "0 lines" — meta-hit, không phải sóng).
  Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~92h32'** trước
  probe #36. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 23: 722 dòng / 203 file** (phạm vi 2887
  file); R7b đối chiếu 747 dòng / 220 file; copies 25 dòng / 17 file
  — y hệt lần 22; đối chiếu chéo 722+25=747=R7b, **chênh 0 — lần
  thứ hai mươi ba liên tiếp**. +14 dòng / +3 file so với lần 22,
  giải thích đúng hết bằng diff (xem §2.7). Async `.writeFile(`:
  vẫn đúng **2 vị trí, cả hai trong helper retry đã biết** — 0 stray;
  mtime 2 helper không đổi từ 10/11.
- RAM: 5 mẫu MemAvailable của lượt: **1.219.436 kB (08:39:07Z) /
  1.033.984 kB (08:42:38Z, lúc probe #36) / 1.061.464 kB (08:50:46Z,
  lúc scan xong) / 849.352 kB (08:53:52Z) / 802.348 kB (08:56Z, lúc
  viết LIMITS)** — ~1,16 GB rồi ~0,99 GB rồi ~1,01 GB rồi ~0,81 GB
  rồi ~0,77 GB. Max RAM biết được **trong** mù #35 từ log sibling:
  **3.681 MB ≈ 3,59 GB** (S6 gateA poll 2, 22:13:29Z, boot #49) =
  60% ngưỡng guard — vẫn xa guard. Birefnet KHÔNG chạy, vẫn 0 lần
  chạy thành công trong gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ
  parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.
- **Đính chính prereg (quan trọng, xem §2.3 đoạn A):** prereg §2
  viết "đầu đoạn A (21:04:50Z, 21:06:42Z] đóng bằng sàn" là **SAI**
  — sàn không loại được t trong khoảng đó (t thỏa cả hai phía sàn).
  Đoạn A đóng được là nhờ **dòng START của poller S10 #1 đọc boot
  tươi** (boot 0c2a9f2f + uptime-s 19:43:46Z lúc 21:06:42Z — cùng
  boot với probe #35). Kết luận "đoạn A đóng" vẫn đứng, nhưng bằng
  chứng đúng là đọc boot tươi, không phải sàn. Tương tự đầu đoạn B
  (21:46:46Z, 21:47:53Z] đóng bằng START tươi của poller #2, không
  phải sàn.
- **Số thứ tự reboot #47–#52 đều TẠM THỜI** (xem §2.2): kế thừa tính
  tạm thời từ mù #29/#30/#31 chưa đóng (tối đa "thực tế #56" nếu
  #29 +1, #30 +2, #31 +1) **và từ mù #35 chưa đóng** (tối đa +24
  danh nghĩa nữa). **Giá trị các gap không phụ thuộc số thứ tự** —
  chỉ phụ thuộc giờ đã chốt.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 08:42:38Z | boot_id `22536366-8716-46f0-a999-cd4199080854`; `who -b` Nov 15 08:29; `uptime -s` **2026-11-15 08:29:12Z** (2 lần, giống nhau từng giây); btime **1794731352 = 2026-11-15T08:29:12Z**; journal chỉ 1 boot (22536366, first entry 08:29:24Z, last 08:42:21Z lúc kiểm tra); `last -x reboot` 08:29 still running; wtmp bắt đầu 08:29:23Z; `ps` systemd PID 1 START 08:29:22, hatch 08:29:23, hatch-execd 08:35:38 |
| `bash scripts/probe-eperm-v2.sh status` | 08:42:38Z | **DEAD/STALE**, heartbeat n=35, ts 21:04:50Z, boot 0c2a9f2f, age **41.868 s** (đúng 11h37'48"); last sample probe #35; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp, ghi trong status1.txt — không qua pipe) |
| `bash scripts/probe-eperm-v2.sh once` | 08:42:46Z | **probe #36, boot=22536366, ok=2 fail=0**, exit 0; dòng `boot changed 0c2a9f2f -> 22536366` (uptime since 2026-11-15 08:29:12) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 08:42:47Z | **ALIVE**, age 1 s, n=36, exit 0 |

Kiểm lại từ đĩa (08:42Z): log probe v2 **100 dòng** — 97 sau S7 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #35 +
dòng `boot changed` + dòng probe #36). **Như R7/S7 (+3):** lượt này
chưa có dòng DEAD nào cho heartbeat #35 nên `status` 08:42:38Z
ghi thêm đúng 1 dòng DEAD ("probe DEAD detected by status (last
#35 at 2026-11-14T21:04:50Z, age 41868s, no probe end since last
start)"). Prereg §1 đã dự báo đúng +3 trước khi đo (ghi rõ cơ sở:
chưa có dòng DEAD nào cho #35). Heartbeat **n=36, ts
2026-11-15T08:42:46Z, boot 22536366-…**; log vẫn chỉ có **ĐÚNG 1
dòng `probe start`** (08:49:50Z 11/11) và **0 dòng `=== probe
end`** — loop v2 chưa từng được start lại kể từ đợt 88 (đếm bằng
grep chính xác `=== probe end`, không dùng substring — xem S7 §4
mục 24).

**Ghi rõ phương pháp exit code (áp dụng đính chính của N6 §1):**
cả 3 lệnh checklist đều ghi output ra file riêng (status1.txt,
once.txt, status2.txt) rồi đọc `$?` trực tiếp, KHÔNG qua `| tee`
— số exit trên là exit thật của script (status 1 STALE / once 0 /
status 0 ALIVE), đúng quy định header script. File
`probe-notes.txt` chỉ chứa phần xác minh boot độc lập, không chứa
exit code.

Nguồn độc lập cho boot #52: T1 prereg-t1.md (boot 22536366, uptime
08:29:12Z) + T3 prereg-t3.md + T5 prereg-t5.md + T6 prereg-t6.md
(đều đọc boot_id/uptime tươi lúc spawn đợt 117) + session
c0670ea8 proc_61d4eb724807.log (boot=22536366, uptime 08:44:02Z) +
session 111e0d9a proc_071599f0d107.log / proc_b9d10aee53df.log
(08:40–08:42Z) — tất cả đều đọc boot_id/uptime trực tiếp từ /proc
tại thời điểm ghi (đều sau probe #36, chỉ củng cố — đoạn E đóng
chính bằng đo uptime tại probe, xem §2.3). Reboot #52 đã được chốt
giờ từ lượt này (08:29:12Z); T7 xác nhận bằng 2 lần đo trực tiếp +
btime trên boot #52. **Số thứ tự TẠM THỜI** (xem §0).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như I7/J8/K6/L6/M4/N6/P6/Q6/R7/S7
đã đính chính.

## 2. Điều tra khoảng mù #35 (21:04:50Z 14/11 → 08:42:46Z 15/11, 11h37'56")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #36: `uptime -s` = **2026-11-15 08:29:12Z**,
  boot_id `22536366-8716-46f0-a999-cd4199080854` — khác boot của
  probe #35 (0c2a9f2f).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (08:42Z): chỉ **1 boot**
  (22536366, first entry 08:29:24Z, last 08:42:21Z). `last -x
  reboot`: chỉ 1 dòng (08:29, still running). wtmp bắt đầu
  08:29:23Z. Journal/wtmp của boot d2ee7500 đã mất theo reboot
  #52 — như mọi lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu (kiểm lại lượt này).
  `btmp` cũng chỉ bắt đầu 08:29:24Z (boot hiện tại).

### 2.2 Bốn reboot đã chốt trong mù — #49 (21:46:46Z), #50 (~02:17Z), #51 (~04:31Z), #52 (08:29:12Z)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 49 | **21:46:46Z (chính xác từng giây)** | 0c2a9f2f → 9c6b5543 | Chốt từ S10 đợt 116 (poller #2 START đọc `uptime -s`/`boot_id` tươi 21:47:53Z). **Xác nhận lại lượt này:** poller #1 poll #9 21:46:43Z (boot #48 còn sống) + poller #2 START 21:47:53Z (boot 9c6b5543, uptime-s 21:46:46) + waiter #2 READY 22:48:05Z (boot=9c6b5543 tươi) + S6 attempt4 gateA poll 22:12–22:16Z (RAMavail 2,5–3,7 GB, boot #49). **Số thứ tự TẠM THỜI** (xem dưới). |
| 50 | **~02:17Z (KHOẢNG, ± vài phút)** | 9c6b5543 → 6c1a704a | Parent phát hiện chỉ-đọc lượt cron 09:35 +07 (02:35:51Z): boot 6c1a704a, uptime ~20 phút lúc 02:36Z → boot khoảng 02:17Z. **T7 đã thử kẹp chính xác từng giây mà KHÔNG được:** session exec-log của lượt cron đó (agent 5788cebc, proc_36f00cee1f3d.log, birth=mtime=02:37:23Z) chỉ chứa `tail` build-loop-log.md (chữ "uptime" trong đó là trích dẫn cũ, không phải output `uptime -s`); tool-output JSON 02:36:00Z là `ls` + `read` build-loop-log.md; journal/wtmp/btmp chỉ giữ boot hiện tại; dpkg.log không có entry nào qua đêm (entry gần nhất trước đó là replay #48, entry sau là 08:37:56Z sau #52). **Giờ #50 giữ nguyên là khoảng; mọi gap liên quan là cận trên.** |
| 51 | **~04:31Z (KHOẢNG, ± vài phút)** | 6c1a704a → d2ee7500 | Parent phát hiện chỉ-đọc lượt cron 12:35 +07 (05:35:51Z): boot d2ee7500, uptime 1:05 lúc 05:36Z → boot khoảng 04:31Z. **T7 đã thử kẹp chính xác từng giây mà KHÔNG được:** session của lượt cron đó (agent 38534d34) KHÔNG có thư mục exec-logs — chỉ còn 1 tool-output JSON (05:35:57Z, `ls` + `read` build-loop-log.md, không có output `uptime -s`); journal/wtmp/btmp chỉ giữ boot hiện tại; dpkg.log không có entry qua đêm. **Giờ #51 giữ nguyên là khoảng; mọi gap liên quan là cận trên.** |
| 52 | **08:29:12Z (chính xác từng giây)** | d2ee7500 → 22536366 | Chốt từ lượt này: 2 phép đo `uptime -s` độc lập trên boot mới (08:42:38Z, giống nhau từng giây) + btime 1794731352 + `who -b` 08:29 + boot_id 22536366 + journal first entry 08:29:24Z + wtmp begins 08:29:23Z + `ps` systemd PID 1 START 08:29:22 (đều ghi trong probe-notes.txt lúc 08:42Z) + probe #36 08:42:46Z boot 22536366 ok=2 fail=0 + dấu boot tươi sibling đợt 117 (T1/T3/T5/T6 prereg, session c0670ea8 08:44:02Z). **Số thứ tự TẠM THỜI** (xem dưới). |

Gap #48 → #49 = **2h03'00" — ĐƯỢC CHỨNG NHẬN (mới, lượt này, xem
§2.3 + §2.5)**. Gap #49 → #50 ≈ **4h30'14" — CẬN TRÊN** (đoạn B
mở, #50 là khoảng). Gap #50 → #51 ≈ **2h14'00" — CẬN TRÊN** (đoạn
C mở, cả hai đầu là khoảng). Gap #51 → #52 ≈ **3h58'12" — CẬN
TRÊN** (đoạn D mở, #51 là khoảng). **Tính tạm thời của số thứ tự
(ghi rõ, không giấu):** #49–#52 kế thừa tính tạm thời từ mù #29
chưa đóng (khe 79 s, M4 §2.3), mù #30 chưa đóng (3 cửa sổ mở, N6
§2.3), **mù #31 chưa đóng (1 cửa sổ mở 8'55", xem §2.6)** và **từ
mù #35 chưa đóng (3 cửa sổ mở, tổng 6h49'50", tối đa +24 ẩn danh
nghĩa — xem §2.3)**: nếu mù #29 chứa 1 reboot ẩn, mù #30 chứa tối
đa 2, mù #31 chứa tối đa 1 và mù #35 chứa tối đa 24 thì "reboot
#52" thực tế có thể là **#80**. **Giá trị các gap không phụ thuộc
số thứ tự** — chỉ phụ thuộc giờ đã chốt.

**Poller S10 #2 dừng sau poll #19 (ghi rõ, không phải bằng chứng
reboot):** poller #2 (36 poll, sleep 300 s) dừng ở poll #19 lúc
23:17:54Z, không có dòng TIMEOUT hay ALL DONE. File cuối cùng của
S10 trên đĩa cũng là poll-s10.log 23:17:54Z (s10-log.md 23:10:21Z,
LIMITS gộp 23:10:33Z) — phiên S10 kết thúc ~23:17Z, nhiều khả năng
poller (setsid nhưng cùng cây tiến trình phiên) bị giết cùng phiên.
Không có bằng chứng reboot tại 23:17:54Z; T7 không dùng thời điểm
này làm giờ reboot, chỉ dùng làm mốc "quan sát cuối".

### 2.3 Hoạt động trong khoảng mù — vì sao KHÔNG ĐÓNG HOÀN TOÀN

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **24 file** +
hidden_files **467 file** (không tính chrome-userdata); **491
file, 485 mốc giây phân biệt** (độ chính xác đầy đủ — theo cách
đếm L9 §6.1/M4 §4 mục 14/N6 §4 mục 19/P6 §4 mục 20/Q6 §4 mục
20/R7 §4 mục 20/S7 §2.3). Chia mù làm năm đoạn bởi #49 (21:46:46Z),
#50 (~02:17Z), #51 (~04:31Z), #52 (08:29:12Z):

- **Đoạn A: 21:04:50Z → 21:46:46Z (41'56", boot 0c2a9f2f #48) —
  ĐÓNG bằng đo uptime tại probe #35 + đọc boot tươi lúc poller
  START + poller đơn nhất + sàn đuôi:**
  - Probe #35 (21:04:50Z) đo uptime chứng minh up liên tục từ
    19:43:46Z tới 21:04:50Z — đóng tới 21:04:50Z.
  - **Dòng START của poller S10 #1 (21:06:42Z) đọc boot tươi**
    `boot 0c2a9f2f … uptime-s 2026-11-14 19:43:46` — cùng boot với
    probe #35; một reboot trong (21:04:50Z, 21:06:42Z] sẽ cho
    boot_id/uptime-s mới. Đóng đầu đoạn (21:04:50Z, 21:06:42Z].
    **Đính chính prereg §2 đoạn A:** prereg viết "đầu 1'52" < sàn
    → sàn đóng" là SAI — sàn không loại được t trong khoảng này
    (t thỏa gap1 ≥ 19'07" so với #48 và gap2 ≥ 19'07" so với
    #49). Bằng chứng đúng là đọc boot tươi lúc START. Kết luận
    "đoạn A đóng" vẫn đứng.
  - **Poller S10 #1 là 1 tiến trình duy nhất (kiểm bằng code từ
    nội dung log — xem blind35-investigate.log):** 9 poll liên
    tiếp #1–#9, đúng số thứ tự, đúng 300/301 s mỗi bước
    (21:06:42Z → 21:46:43Z), không trùng, không thiếu số, không
    có #1 thứ hai; script `poller-s10.sh` là vòng `for i in
    $(seq 1 36)` + `sleep 300` foreground, **không có cơ chế
    restart nào**. Reboot sẽ giết tiến trình poller → không còn
    poll sau đó; poll tồn tại tới 21:46:43Z nên **không reboot
    nào trong (21:06:42Z, 21:46:43Z]**.
  - Đuôi (21:46:43Z, 21:46:46Z] 3 s < sàn 19'07" → sàn đóng (bất
    kỳ t nào trong đó cũng < 19'07" trước #49).
  - Mật độ mtime củng cố (214 mốc, lỗ lớn nhất chỉ 196 s) nhưng
    không dùng để đóng. **Kết luận đoạn A: ĐÓNG.**
- **Đoạn B: 21:46:46Z → ~02:17Z (~4h30', boot 9c6b5543 #49) —
  MỞ. Cửa sổ mở (23:17:54Z, ~01:57:53Z] = 9.599 s ≈ 2h39'59",
  tối đa 9 reboot ẩn (ceil(9599/1147)).**
  - **Poller S10 #2 là 1 tiến trình duy nhất (kiểm bằng code):**
    START 21:47:53Z đọc boot tươi 9c6b5543 + uptime-s 21:46:46;
    19 poll liên tiếp #1–#19, đúng số thứ tự, đúng 300/301 s
    mỗi bước (21:47:53Z → 23:17:54Z); script không có cơ chế
    restart. Đóng (21:47:53Z, 23:17:54Z]. Đầu (21:46:46Z,
    21:47:53Z] 67 s đóng bằng **đọc boot tươi lúc START** (không
    phải sàn — đính chính prereg tương tự đoạn A).
  - **Waiter S10 #2 củng cố (không phải quan sát chính):**
    session proc_9b19d49d59ad (birth 21:48:02Z, mtime 22:48:05Z),
    dòng READY đọc boot tươi `boot=9c6b5543` lúc 22:48:05Z —
    tiến trình sống (21:48:02Z, 22:48:05Z] + đọc boot tươi tại
    22:48:05Z. Nằm trong vùng poller đã phủ nên chỉ củng cố.
    Session này cũng là session DUY NHẤT bắc qua cắt sàn B-lo
    (22:05:53Z) — 1 session (xem blind35-sessions.log).
  - **Sau 23:17:54Z: KHÔNG còn observer nào.** Poller #2 đã dừng
    (xem §2.2); S10 suite/O8/postboot #49 đều trước 23:17:54Z
    (22:48–22:59Z). Quét session bắc qua (stat %W trên 324 file
    exec-log): **0 session bắc qua cắt B-hi (~01:57:53Z)**; 0
    session chạm vùng tối B (23:17:54Z, ~02:17Z]. Quét ngoài hai
    cây trong vùng tối B chỉ còn mtime-only: proactivity 6 file
    23:41:55Z, self-improvement 23:42:28Z, feed research web.md
    23:45:05Z — đã đọc nội dung mẫu: goals.md là snapshot trạng
    thái, web.md là tin AI (5 dòng) — **không chứa boot_id/uptime**,
    không thu hẹp được khe (quy tắc N6 §4 mục 2). /tmp: 0 file
    trong vùng tối B. chrome-userdata: 0 file có mtime trong toàn
    mù #35. /var/log + /var/lib: 0 file sửa trong vùng tối
    (dpkg.log không có entry qua đêm).
  - Lỗ mtime lớn nhất đoạn B: **10.746 s (23:17:54Z → 02:17:00Z,
    cả hai cây)** — bắt đầu đúng lúc poller #2 dừng (mtime của
    chính poll-s10.log) và kết thúc ở biên #50 danh nghĩa. Lỗ
    này KHÔNG tự đóng (quy tắc N6 §4 mục 2) — nó chính là cửa sổ
    mở sau khi trừ phần poller phủ.
  - Cửa sổ sàn-cho-phép đoạn B: t ∈ [22:05:53Z, ~01:57:53Z]
    (gap1 = t − 21:46:46Z ≥ 19'07" ⟺ t ≥ 22:05:53Z; gap2 =
    ~02:17:00Z − t ≥ 19'07" ⟺ t ≤ ~01:57:53Z — tính bằng code,
    xem blind35-gaps.txt; #50 là khoảng nên hai biên ± vài
    phút). Poller phủ tới 23:17:54Z → còn lại (23:17:54Z,
    ~01:57:53Z]. **Kết luận đoạn B: MỞ.**
- **Đoạn C: ~02:17Z → ~04:31Z (~2h14', boot 6c1a704a #50) —
  MỞ. Cửa sổ mở [~02:36:07Z, ~04:11:53Z] = 5.746 s ≈ 1h35'46",
  tối đa 5–6 reboot ẩn (ceil(5746/1147) = 6 danh nghĩa; 5 nếu
  giờ #50/#51 lệch làm cửa sổ < 5.735 s — biên không chắc chắn,
  xem dưới).**
  - **0 mốc mtime trong cả hai cây** suốt đoạn C (8.040 s) — máy
    yên hẳn qua đêm; 0 file repo-1, 0 file hidden_files. Đây là
    đoạn duy nhất trong mù không có mốc mtime nào (lưu ý phương
    pháp: mtime chỉ là lần ghi CUỐI — file build-loop-log.md
    từng được ghi lúc 02:35–02:37Z nhưng mtime hiện tại đã bị
    các lần ghi sau đè; xem S7 §4 mục 23).
  - Quan sát duy nhất trong đoạn C: lượt cron 09:35 +07
    (02:35:51Z) — tool-output JSON 02:36:00Z (`ls` + `read`) và
    exec-log proc_36f00cee1f3d.log (birth=mtime=02:37:23Z,
    `tail` build-loop-log.md). **Không có output `uptime -s`
    từng giây nào được lưu** — chỉ còn ghi nhận của parent trong
    build-loop-log.md ("uptime ~20 phút lúc 02:36Z"). Dấu boot
    tươi duy nhất của đoạn C là lần đọc boot 6c1a704a của parent
    lúc ~02:36Z — chứng minh boot #50 sống tới ~02:36Z, tức ngay
    đầu cửa sổ sàn-cho-phép (02:36:07Z). Sau 02:37:23Z: **không
    còn quan sát nào** cho tới đoạn D (05:35:57Z).
  - Quét session bắc qua: **0 session bắc qua cắt C-lo
    (~02:36:07Z) và 0 qua cắt C-hi (~04:11:53Z)**. Quét ngoài hai
    cây: chỉ 2 file agent trên (02:36:00Z, 02:37:23Z); /tmp: 0.
  - Cửa sổ sàn-cho-phép đoạn C: t ∈ [~02:36:07Z, ~04:11:53Z]
    (t − ~02:17:00Z ≥ 19'07" ⟺ t ≥ ~02:36:07Z; ~04:31:00Z − t ≥
    19'07" ⟺ t ≤ ~04:11:53Z). Đọc boot tươi của parent lúc
    ~02:36Z nằm NGAY TRƯỚC biên 02:36:07Z (chênh lệch dưới 1
    phút, không lưu được từng giây) nên thực tế không cắt được
    đáng kể cửa sổ — giữ nguyên toàn bộ cửa sổ sàn-cho-phép là
    cửa sổ mở. **Kết luận đoạn C: MỞ.**
- **Đoạn D: ~04:31Z → 08:29:12Z (~3h58', boot d2ee7500 #51) —
  MỞ. Cửa sổ mở (~05:36Z, 08:10:05Z] = 9.245 s ≈ 2h34'05", tối đa
  9 reboot ẩn (ceil(9245/1147) = 9; 8 chỉ khi lần đọc boot của
  parent muộn hơn 05:38Z — parent ghi "lúc 05:36Z" nên giữ 9).**
  - Dấu boot tươi duy nhất: parent đọc boot d2ee7500 lúc ~05:36Z
    (lượt cron 12:35 +07, "uptime 1:05 lúc 05:36Z") — chứng minh
    boot #51 sống tới ~05:36Z. Session của lượt cron đó (agent
    38534d34) không còn exec-logs; tool-output JSON duy nhất
    (05:35:57Z) là `ls` + `read`, không có output `uptime -s`.
  - Mốc mtime duy nhất trong hai cây: repo-1
    PHASE9_GAP_ANALYSIS.md 05:39:12Z (parent viết gap §45 lúc
    đóng đợt 116 — nội dung gap, không chứa boot). Ngoài hai cây:
    proactivity 6 file 05:41:56Z, self-improvement 2 file
    05:44:35Z, memory reconciliation 06:41:45Z–06:46:59Z (nhiều
    file) — tất cả mtime-only, đã kiểm mẫu nội dung: không chứa
    boot_id/uptime (memory reconciliation là tool memory_get, nội
    dung là văn bản memory). /tmp: 0 file trong đoạn D.
  - Quét session bắc qua: **0 session bắc qua cắt D-lo
    (~04:50:07Z) và 0 qua cắt D-hi (08:10:05Z)**. 0 session chạm
    vùng D (04:31:00Z, 08:29:12Z] trong 324 file exec-log.
  - Cửa sổ sàn-cho-phép đoạn D: t ∈ [~04:50:07Z, 08:10:05Z]
    (t − ~04:31:00Z ≥ 19'07" ⟺ t ≥ ~04:50:07Z; 08:29:12Z − t ≥
    19'07" ⟺ t ≤ 08:10:05Z). Đọc boot tươi của parent ~05:36Z cắt
    đầu cửa sổ → còn lại (~05:36Z, 08:10:05Z]. **Kết luận đoạn D:
    MỞ.**
- **Đoạn E: 08:29:12Z → 08:42:46Z (13'34", boot 22536366 #52) —
  ĐÓNG bằng đo uptime trực tiếp + probe #36 + dấu boot tươi:**
  - **`uptime -s` ×2 lúc 08:42:38Z = 08:29:12Z** chứng minh máy
    up liên tục từ #52 tới lúc đo; probe #36 08:42:46Z đọc
    boot_id 22536366 tươi — cùng boot_id với boot bắt đầu
    08:29:12Z. (Nguyên tắc như P6 §2.3 đoạn C mù #31 và Q6 §4
    mục 21: đo uptime tại thời điểm probe ĐÓNG toàn bộ đoạn từ
    reboot cuối tới lúc đo — sàn chỉ áp dụng GIỮA hai reboot đã
    biết, không áp cho đuôi sau reboot cuối.)
  - **Chuỗi dấu boot tươi củng cố (đọc boot_id/uptime trực tiếp
    từ /proc tại thời điểm ghi — đều sau probe #36, chỉ củng
    cố):** T1/T3/T5/T6 prereg (boot 22536366, uptime-s 08:29:12Z)
    + session c0670ea8 proc_61d4eb724807.log (boot=22536366,
    uptime 08:44:02Z) + session 111e0d9a (08:40–08:42Z) + apt
    replay sau #52: dpkg.log entry 08:37:56Z (cài
    gstreamer1.0-tools — T8 infra chạy postboot replay, boot #52
    +8'44"). Dấu tươi cuối 08:44:02Z, chỉ 1'16" sau probe #36.
  - Lỗ mtime lớn nhất đoạn E: **541 s (08:29:12Z → 08:38:13Z,
    hidden_files)** và **746 s (08:29:12Z → 08:41:38Z, repo-1)**
    — nằm trong đoạn đã đóng bằng uptime trực tiếp nên không tạo
    cửa sổ mở (quy tắc N6 §4 mục 2). Lỗ này là khoảng máy vừa
    boot xong chưa có agent nào ghi (đợt 117 spawn 08:35:51Z).
  - Kết luận đoạn E: **ĐÓNG**.

**Kết luận trung thực: khoảng mù #35 KHÔNG ĐÓNG HOÀN TOÀN.** 4
reboot đã chốt giờ trong mù (#49 21:46:46Z, #50 ~02:17Z, #51
~04:31Z, #52 08:29:12Z) + **3 cửa sổ mở, tổng 6h49'50", tối đa 24
reboot ẩn danh nghĩa** (B 9 + C 6 + D 9; C là 5–6 tùy biên dưới
phút — tổng 23–24). Gap #48 → #49 = 2h03'00" được chứng nhận theo
khoảng (xem §2.5); các gap còn lại giữ **cận trên**. Chuỗi 3 mù
đóng liên tiếp (#32, #33, #34) đã đứt tại mù #35. Số thứ tự #49–
#52 vẫn TẠM THỜI (xem §2.2 — "thực tế #52" có thể tới #80).

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 116/117

Khoảng mù 21:04:50Z 14/11 → 08:42:46Z 15/11 (11h37'56") được phủ
bởi các luồng sibling đợt 116 (S1–S10, làm việc tới ~23:17Z) +
lượt cron skip 23:35Z/02:35Z/05:35Z + spawn đợt 117 (08:35:51Z).
Đã đọc lại log thật — **đếm lại độc lập từ đĩa** (python, đọc
toàn bộ nội dung 128 file *.log có mtime trong mù #35 — 0 file
repo-1, 128 file hidden_files, trừ chrome-userdata):

| Mẫu | Số dòng | Kết luận |
|---|---|---|
| `sóng EPERM vẫn bật` | **1 (meta)** | Dòng nhãn trong file sweep-log của S7 (`'sóng EPERM vẫn bật': 0 lines`) — KHÔNG phải sóng thật |
| `CẢNH BÁO` (10-phút wave warning) | **1 (meta)** | Dòng nhãn trong file sweep-log của S7 (`'CẢNH BÁO': 0 lines`) — KHÔNG phải cảnh báo thật |
| `Operation not permitted` | **1 (meta)** | Dòng nhãn trong file sweep-log của S7 (`'Operation not permitted': 0 lines`) — KHÔNG phải lỗi thật |
| `sóng EPERM đã tắt` | **11** | 9 dòng nằm trong file sweep-log của S7 (trích dẫn lại 8 dòng thật từ mù #34 + dòng đếm) + **2 dòng thật** trong s10-o8.log (22:57:34Z, 22:58:28Z) — cả 2 đều là dòng launcher, **dương tính giả đã biết** |

**Đính chính meta-hit (mới, lượt này — bẫy đếm cần ghi rõ):**
file `round116-s7/eperm-sweep.log` của S7 có mtime trong mù #35
(S7 viết lúc ~21:18Z, sau probe #35) nên lọt vào tập quét; nội
dung nó là BÁO CÁO đếm của S7, trong đó các mẫu tìm kiếm xuất hiện
dưới dạng nhãn (`'sóng EPERM vẫn bật': 0 lines`). Đếm thô whole-file
cho 1/1/1 nhưng cả 3 đều là nhãn báo cáo, không phải sự kiện. T7
đã đọc trực tiếp 3 dòng này (grep -n, xem §4) — số thật là **0/0/0**.
Lượt sau quét sóng: loại file `eperm-sweep*.log` của chính các
luồng EPERM trước khỏi tập đếm, hoặc đếm theo dòng sự kiện (có
timestamp + ngữ cảnh), không đếm nhãn báo cáo.

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5, J8
§2.4, K6 §2.4, L6 §2.4, M4 §2.4, N6 §2.4, P6 §2.4, Q6 §2.4, R7
§2.4, S7 §2.4):** 2 dòng "đã tắt" thật đều có dạng `[timestamp]
sóng EPERM đã tắt, khởi động vite` — in khi lần ghi thử ĐẦU TIÊN
thành công ngay (code launcher `waveOff=true` ở lần write đầu) —
in mặc định cả khi không có sóng. Phân bố: S10 s10-o8.log 2 dòng
(22:57:34Z, 22:58:28Z, đoạn B). **Quét mở rộng (như S7):** grep
`/eperm|not permitted/i` trên cùng 128 file trả 33 dòng (tính cả
dòng khớp 2 lần — dòng chứa cả "hasEperm" lẫn "EPERM" được đếm 2
lần): 11 dòng trong eperm-sweep.log của S7 (3 nhãn + 8 trích dẫn
"đã tắt" từ mù #34: 2 R10 + 6 R1); 11 dòng trong
eperm-sweep-extra.log của S7 (dòng tổng "14 lines" khớp 2 lần + 6
tên test phân biệt từ mù #34, trong đó 3 dòng "hasEperm" khớp 2
lần); 9 dòng trong round116-s10-suites.log (6 tên test phân biệt
"✔ … hasEperm phân biệt EPERM với port conflict" / "thứ tự chẩn
đoán — EPERM được ưu tiên trước port conflict", 3 dòng khớp 2 lần)
— test pass, không phải lỗi thật; 2 dòng launcher S10 trên. **0
dòng sóng thật mới.**

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng lần này, KHÁC mù #32/#33/#34, **mù #35
  KHÔNG đóng hoàn toàn** nên vẫn còn lỗ quan sát về reboot (3 cửa
  sổ mở, tổng 6h49'50') mà một sóng ngắn có thể ẩn náu về mặt
  logic — tuy nhiên sóng EPERM là hiện tượng ghi file, không phải
  reboot: vite khởi động thành công ngay ở 22:57–22:58Z (S10 O8, 2
  lần) và probe #36 ok=2 fail=0 lúc 08:42:46Z; các lần ghi file
  thành công rải rác trong đoạn B (tới 23:17:54Z) và đoạn E
  (08:35Z→) cũng không thấy sóng. Một sóng dài ~16' kiểu R7 khó
  lọt vào các đoạn đã quan sát, nhưng trong 3 cửa sổ mở (đặc biệt
  đoạn C hoàn toàn yên, 0 mốc mtime) thì không loại trừ được bằng
  log — chỉ ghi nhận giới hạn này, không suy diễn thêm.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — **~92h32'** trước
  probe #36 (tính từ cuối sóng ~12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #36 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 08:42:46Z ghi được.

### 2.5 Phân phối gap cập nhật — CERT n=28 (mới) + dải chứng nhận CÒN DÙNG ĐƯỢC

Gap mới **#48 → #49 = 2h03'00" ĐƯỢC CHỨNG NHẬN**: khoảng
(19:43:46Z, 21:46:46Z) không chứa cửa sổ mở nào — phần
(19:43:46Z, 21:04:50Z] đã đóng bởi mù #34 đoạn C (S7; parent đã
chấp nhận — QUYẾT PARENT 7, xem §2.6); phần (21:04:50Z, 21:46:46Z]
là đoạn A mù #35 đã đóng (§2.3). Đây là chứng nhận theo khoảng
(interval), không theo nhãn mù (P6 §4 mục 8). Tập gap đơn đã chứng
nhận **n=27 → n=28**; toàn chuỗi tăng n=42 → **n=43** (thêm 1 gap).
Tính lại từ bảng S7 (exec lại blind34-gaps.py nguyên văn — không
gõ lại số, tránh sai sót chép tay) + 1 gap mới, bằng code (percentile
tuyến tính, index = p·(n−1) — cùng phương pháp
J8/K6/L6/L9/M4/N6/P6/Q6/R7/S7). **Kiểm tra chéo: tính lại CERT n=27
ra đúng 100% số S7** (trung bình 1h52'46", trung vị 1h59'46",
p10 1h00'25", p90 2h40'49", sd 0h42'31"), **tính lại toàn chuỗi
n=42 ra đúng 100% số S7** (trung bình 1h57'40", trung vị
1h59'16", p10 0h48'36", p90 3h04'16", sd 0h59'33") — nên số mới
dưới đây đáng tin ở cùng mức (script `blind35-gaps.py`, output
`blind35-gaps.txt`):

| Thống kê | Toàn bộ n=43 | Chỉ gap đơn đã chứng nhận n=28 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, CẬN TRÊN)** | **3h14'08" (#26 → #27)** |
| Trung bình | 1h57'47" | 1h53'08" |
| Trung vị | 1h59'46" | 1h59'50" |
| Độ lệch chuẩn (mẫu) | 0h58'50" (CV 0,50) | 0h41'46" |
| p10 | 0h48'46" | 1h02'25" |
| p90 | 3h03'56" | 2h37'23" |

Đọc thêm: 25/43 gap (58%) nằm trong 90'–150'; 6 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
**Dải chứng nhận [19'07", 3h14'08"] đứng vững trên tập gap đơn
đã chứng nhận (n=28)** — min/max không đổi (gap mới nằm giữa).
Cảnh báo J8 vẫn đứng: dải này đã bị vượt 2 lần bởi các gap chưa
chứng nhận (#11 → #12 4h10'33",
#33 → #34 5h43'18") — nó là phát biểu về các gap đơn đã biết,
không phải bảo đảm; nay thêm 2 cận trên vượt dải (#49 → #50
≈4h30', #51 → #52 ≈3h58'). **Không đưa dự báo điểm cho #53 hay
reboot nào sau đó** — chỉ dải cơ học áp lên #52 (08:29:12Z):
**[08:48:19Z, 11:43:20Z]**; probe #36 (08:42:46Z, boot #52) đã
loại trừ phần trước 08:42:46Z → dải hiệu dụng
**[08:42:46Z, 11:43:20Z]**; p10–p90 toàn chuỗi →
[09:17:57Z, 11:33:08Z].
Tần suất reboot: 52 reboot / 108,18 giờ = 1 reboot / 124,8 phút
(tính từ mốc #1 2026-11-10T20:18:10Z tới #52; nếu cộng tối đa +4
ẩn từ mù #29/#30/#31 thì 56 / 108,18h = 1 / 115,9 phút — chưa tính
ẩn tối đa +24 của mù #35).

### 2.6 Mù cũ — KHÔNG ĐỔI, KHÔNG THỬ LẠI (không có nguồn mới thật sự)

- **Mù #31 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI, KHÔNG THỬ LẠI LƯỢT
  NÀY** (Q6 §2.6, R7 §2.6, S7 §2.6): 1 cửa sổ mở — 8'55"
  (10:23:54Z → 10:32:49Z); 2 reboot đã chốt (#43 08:53:37Z, #44
  10:53:31Z) + tối đa 1 ẩn. Không có nguồn mới thật sự nào cho
  cửa sổ này lượt này (mọi log mới đều sau cửa sổ; journal/wtmp
  vẫn chỉ giữ boot hiện tại #52), nên T7 không thử lại.
  Parent/user quyết xem có chấp nhận "ít nhất 2 reboot, có thể 3"
  làm mức đóng của mù #31 hay để mở như mù #24/#26/#28/#29/#30.
  T7 không tự quyết. Gap #43 → #44 = 1h59'54" KHÔNG được chứng
  nhận (cận trên).
- **Mù #30 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (N6 §5 mục 1, P6 §5
  mục 2, Q6 §5 mục 3, R7 §5 mục 4, S7 §5 mục 5): 3 cửa sổ mở, tổng
  30'50"; 2 reboot đã chốt + có thể tối đa 2 ẩn. Số thứ tự #41/#42
  vẫn TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm —
  parent/user quyết.
- **Mù #29 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (M4 §5 mục 1, P6 §5
  mục 3, Q6 §5 mục 4, R7 §5 mục 5, S7 §5 mục 6): lỗ thật 14'31"
  theo M4 / 13'33" theo M9 birth-time, khe 79 s không loại trừ
  được; 2 reboot đã chốt + có thể 1 ẩn. Số thứ tự #39/#40 vẫn TẠM
  THỜI.
- **Mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục 1, P6 §5
  mục 4, Q6 §5 mục 5, R7 §5 mục 6, S7 §5 mục 7): lỗ 23'39"
  (02:01:06Z → 02:24:45Z), khe 4'32" không loại trừ được; 2 reboot
  đã chốt + có thể 1 ẩn. Số thứ tự #37/#38 vẫn TẠM THỜI.
- **Mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục 1, P6 §5
  mục 5, Q6 §5 mục 6, R7 §5 mục 7, S7 §5 mục 8): lỗ 1h13'58"
  (19:20:19Z → 20:34:17Z) có thể chứa thêm reboot; ít nhất 1
  (#34), có thể nhiều hơn — không xác định được; số thứ tự #34 là
  TẠM THỜI.
- **Mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục 1, P6 §5
  mục 6, Q6 §5 mục 7, R7 §5 mục 8, S7 §5 mục 9): lỗ 2h03'11"
  (12:28:41Z → 14:31:52Z) có thể chứa thêm reboot; ít nhất 1
  (#32), có thể nhiều hơn — không xác định được; số thứ tự #32 →
  #52 là TẠM THỜI.
- **Mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1, P6 §5
  mục 7, Q6 §5 mục 8, R7 §5 mục 9, S7 §5 mục 10): lỗ ~17'23"
  (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung gian.
- **Mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8, §6 mục
  3, P6 §5 mục 8, Q6 §5 mục 9, R7 §5 mục 10, S7 §5 mục 11): cửa sổ
  lý thuyết ≤78 s với sàn 19'07". Parent/user quyết giữ "đóng",
  "đóng có điều kiện", hay mở lại. **Mù #23 VẪN ĐÓNG HOÀN TOÀN**
  (G8). **Mù #25 VẪN ĐÓNG HOÀN TOÀN** (I7). **Mù #27 VẪN ĐÓNG
  HOÀN TOÀN** (K6). **Mù #32 VẪN ĐÓNG HOÀN TOÀN** (Q6). **Mù #33
  VẪN ĐÓNG HOÀN TOÀN** (R7). **Mù #34 VẪN ĐÓNG HOÀN TOÀN** (S7;
  parent đã chấp nhận — QUYẾT PARENT 7: chấp nhận chứng nhận gap
  #46→#47 = 2h01'01" và #47→#48 = 1h57'56", CERT n=27 — T7 xác
  nhận lại từ tool-output JSON của parent lúc 02:36:00Z).
  **Mù #35 KHÔNG ĐÓNG HOÀN TOÀN** (mới, lượt này — xem §2.3).

### 2.7 Quét writeFileSync (snapshot 08:50:24–08:50:46Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7 — bản S7, chỉ đổi thư mục OUT
sang `round117-t7`). Chạy trọn vẹn (22 s, SCAN-END có đủ). Kết quả
NEWSTD khớp 100% scan-meta.txt (tính lại từ file wfs-*.txt +
files-*.bin gốc).

- Chuẩn mới: **722 dòng / 203 file** (phạm vi 2887 file).
  Lần 22 (S7): 708 dòng / 200 file (phạm vi 2874 file).
- R7b (đối chiếu): **747 dòng / 220 file**. Lần 22: 733 / 217.
- Copies: **25 dòng / 17 file** — y hệt lần 22, 21, 20, 19, 18, 17,
  J8, I7, H7, G8 và F7.
- Đối chiếu chéo 722+25=747=R7b, **chênh 0 — lần thứ hai mươi
  ba liên tiếp**. Tổng hit trên cả 3 bảng: 722+747+25 =
  **1.494 dòng**.
- **+14 dòng / +3 file so với lần 22, giải thích đúng hết bằng
  diff hit list** (đã đọc nội dung từng dòng mới; 0 file cũ tăng,
  không file nào giảm):
  - +5 `docs/PHASE9_ROUND116_S7_EPERM_LIMITS.md` (file LIMITS của
    chính S7 — 5 hit đều là trích dẫn "writeFileSync" trong văn
    bản, đã đọc nội dung từng dòng)
  - +1 `apps/web/scripts/probe116s1.mjs` (S1 đợt 116 — script
    probe: `fs.writeFileSync(waveProbeFile, "x")`, ghi file thử
    sóng — cùng mẫu các probe trước; đã đọc dòng 215)
  - +8 `apps/web/scripts/probe117t3-frame-parity.mjs` (T3 đợt 117
    — script probe frame-parity: ghi vite config tạm + kết quả/
    log vào scratch; đã đọc 8 dòng 357/408/420/650/768/769/779/
    780)
  - Tổng: 5+1+8 = **14** ✓, 3 file mới có hit ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets). Đếm lại trực tiếp sau scan: S7 LIMITS đúng 5,
    probe116s1 đúng 1, probe117t3 đúng 8.
- **0 file biến mất khỏi hit list.**
- Scope: **+13 file ròng / −0 file** so với lần 22 (2887 =
  2874+13−0 ✓): 13 file mới = 3 file hit trên + 10 file không
  hit (2 script benchmark T9 — `benchmarks/render/q8_analyze_117t9.py`,
  `benchmarks/render/webkit_blob_flaky_117t9_2mib.mjs` — + 8 file
  LIMITS — ROUND116_LIMITS + S1/S2/S3/S5/S6/S9 đợt 116 + T8 đợt
  117). Comm hai chiều khớp đúng (13 = 3+10 ✓).
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt lần 22 — xem files-copies.txt;
  diff wfs-copies.txt với lần 22: IDENTICAL).
- **Race trong cửa sổ scan (ghi rõ, không giấu):** các sibling
  đợt 117 vẫn đang chạy (T3 đã tạo probe117t3 08:4xZ, T8/T9 đang
  chạy — các file mới trong diff đều đã hạ cánh trước khi scan
  bắt đầu 08:50:24Z — đếm lại trực tiếp sau scan khớp số trong
  wfs-newstd.txt — không hỏng số đếm). Sibling đợt 117 vẫn đang
  chạy nên lượt sau cần đối chiếu lại.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2887 file), NUL-safe, chạy từ trong repo-1 — chỉ đúng 2 hit
trong code (đếm lại bằng python từ files-*.bin gốc, không tin mù
file cũ; tổng 138 dòng `.writeFile(` trong phạm vi, 136 dòng nằm
trong `.md`, 2 dòng trong code — lần 22 là 133 dòng, 131 trong
`.md`, 2 trong code; +5 dòng đều nằm trong `.md` trích dẫn mới):

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z — kiểm lại trực tiếp
lượt này). Kết luận giữ nguyên như M4/N6/P6/Q6/R7/S7: **2 async call
site, cả 2 đều thuộc helper retry đã biết với cùng hợp đồng
EPERM-only + verify byte — không phải write async stray, không
cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

5 mẫu MemAvailable của lượt: **1.219.436 kB (08:39:07Z, lúc kiểm
tra đầu) / 1.033.984 kB (08:42:38Z, lúc probe #36) / 1.061.464 kB
(08:50:46Z, lúc scan xong) / 849.352 kB (08:53:52Z) / 802.348 kB
(08:56Z, lúc viết LIMITS)** — ~1,16 GB rồi ~0,99 GB rồi ~1,01 GB
rồi ~0,81 GB rồi ~0,77 GB. **Dao động mạnh trong 17 phút** (từ
~1,2 GB xuống ~0,8 GB — có thể do các sibling đợt 117 khởi động
vite/browser sau khi T7 đo; T7 không đo được nguyên nhân chính
xác, chỉ ghi số — cùng mẫu dao động như R7/S7). Max RAM biết được
**trong** mù #35 từ log sibling (ram-max.py, 192 mẫu): **3.681 MB
≈ 3,59 GB** (S6 gateA poll 2, 22:13:29Z, boot #49) = **60% ngưỡng
guard 6144 MB**; max trong đoạn A: **2.698 MB** (S2 driver,
21:20:18Z, boot #48); max trong đoạn E: **2.011 MB** (sibling đợt
117, 08:41:06Z, boot #52); đoạn C/D: **không có mẫu RAM nào**
(máy yên, không ai đo). Birefnet KHÔNG chạy, đúng quy tắc parent
đợt 92 §3 mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC;
chạm ≥ 6 GB mới thử lại). Birefnet-general vẫn **0 lần chạy thành
công** trong gói. Mẫu RAM lúc probe (~0,99 GB) vẫn xa ngưỡng guard;
máy chưa từng tiến gần ngưỡng guard trong mù #35 (max 60%).

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Lỗ mù phải kiểm chứng 4 lớp trước khi tuyên bố (L6 §4 mục 1,
   M4 §4 mục 1, N6 §4 mục 1, P6 §4 mục 1, Q6 §4 mục 1, R7 §4 mục
   1, S7 §4 mục 1, áp dụng lượt này — xem §2.3):** (a) mtime find
   trong hai cây để xác định lỗ; (b) **đọc NỘI DUNG** các file log
   append chạm biên lỗ (poll-s10.log — 28 poll, 300/301 s đều;
   waiter READY — boot tươi 22:48:05Z; S6 gateA poll — RAMavail;
   cron session 02:37:23Z — chỉ là `tail`); (c) **tìm ngoài hai
   cây**: find toàn ~/workspace (không prune) + /tmp +
   chrome-userdata trong đúng cửa sổ lỗ; (d) **số học sàn** để bound
   khe không loại trừ được (mù #35: 3 cửa sổ còn lại, tổng
   6h49'50").
2. **Dấu boot TƯƠI (đọc /proc tại thời điểm ghi) miễn nhiễm với lỗ
   "tiến trình cũ sống sót" (P6 §4 mục 2, áp dụng lượt này — xem
   §2.3):** postboot-check và S10 poller START / waiter READY /
   T1/T3/T5/T6 prereg log đọc `boot_id`/`uptime -s` bằng command
   substitution NGAY lúc echo — sau reboot, /proc cho boot_id mới
   nên dấu này chứng minh không reboot trước thời điểm đó, bất kể
   tiến trình có sống sót hay không. Ngược lại, một session chỉ ghi
   file (không đọc boot) thì vẫn phải trừ 38 s sống sót ở đuôi. Khi
   đánh giá session, phân biệt rõ: session có đọc boot tươi trong
   nội dung thì đóng tới đúng thời điểm đọc; session chỉ ghi file
   thì trừ 38 s.
3. **Quan sát ngoài cây KHÔNG tự động thu hẹp khe (N6 §4 mục 2,
   P6 §4 mục 3, áp dụng lượt này — xem §2.3):** 142 file
   ~/workspace ngoài hai cây + 27 file /tmp có mtime trong mù #35
   nhưng hầu hết chỉ là mtime — khe được bound bằng số học sàn +
   poller + đo boot tươi + session bắc qua, không bằng mật độ quan
   sát. Chỉ quan sát nào **xác định boot** (boot_id/uptime trong
   nội dung, hoặc session bắc qua) mới thu hẹp được khe. Đừng đếm
   "có file trong lỗ" thành "lỗ đã lấp" — đoạn C có đúng 2 file
   ngoài cây (02:36:00Z, 02:37:23Z) mà vẫn mở 1h35'46".
4. **`find -newerBt` với chuỗi thời gian là SAI (N6 §4 mục 3, nhắc
   lại — lượt này KHÔNG mắc):** dùng `find -printf '%T@'` / python
   `os.stat().st_mtime` lấy mtime epoch rồi so sánh bằng code
   (T7 đã làm đúng: toàn workspace + /tmp trong mù #35; 324 file
   exec-log cho quét session-spanning).
5. **`status` STALE chỉ ghi 1 dòng DEAD cho mỗi heartbeat (N6 §4
   mục 4, P6 §4 mục 5, Q6 §4 mục 5, R7 §4 mục 5, S7 §4 mục 5, xác
   nhận lại lượt này — xem §1):** log tăng 97 → 100 (+3: DEAD mới
   cho #35 + boot-changed + probe) vì chưa có dòng DEAD nào cho
   heartbeat #35. Khi đếm dòng log lượt sau phải tính cả cơ chế
   dedupe này (baseline mới là **100**, không phải 97).
6. **Exit code lấy từ `$?` trực tiếp, không qua pipe (N6 §4 mục
   5, P6 §4 mục 6, Q6 §4 mục 6, R7 §4 mục 6, S7 §4 mục 6, áp dụng
   lượt này — xem §1):** cả 3 lệnh checklist ghi ra file riêng rồi
   đọc `$?`; probe-notes.txt (ghi trực tiếp, không qua `| tee`)
   chỉ chứa phần xác minh boot, không chứa exit code. Quy định
   script: status 0 ALIVE / 1 STALE-DEAD / 2 never-run; once 0.
7. **Session exec bắc qua là kẹp mạnh sau poller (N6 §4 mục 6,
   P6 §4 mục 7, Q6 §4 mục 7, R7 §4 mục 7, S7 §4 mục 7, áp dụng
   lượt này — xem §2.3):** lượt này quét session-spanning trả
   **1 session bắc qua cắt B-lo (waiter S10 #2, birth 21:48:02Z,
   mtime 22:48:05Z) + 0 session bắc qua 5 cắt còn lại** (B-hi,
   C-lo, C-hi, D-lo, D-hi) — yếu hơn mù #34 (6+4 session); poller
   S10 #2 vẫn là observer chính tới 23:17:54Z, sau đó không còn
   observer nào.
8. **Chứng nhận gap theo KHOẢNG, không theo nhãn mù (P6 §4 mục 8,
   Q6 §4 mục 8, R7 §4 mục 8, S7 §4 mục 8, áp dụng lượt này — xem
   §2.5):** #48 → #49 được chứng nhận vì khoảng (19:43:46Z,
   21:46:46Z) không chứa cửa sổ mở (đuôi đoạn C mù #34 + đoạn A mù
   #35 đóng kín). Ghi rõ cơ sở để parent quyết.
9. **`ps aux` / `ps -eo lstart` là nguồn độc lập cho giờ reboot
   (L6 §4 mục 2, M4 §4 mục 3, N6 §4 mục 8, P6 §4 mục 9, Q6 §4
   mục 9, R7 §4 mục 9, S7 §4 mục 9, áp dụng lượt này — xem §2.2):**
   systemd PID 1 START 08:29:22, hatch 08:29:23, hatch-execd
   08:35:38 — khớp `uptime -s` 08:29:12Z ở mức phút.
10. **Chốt giờ reboot bằng `uptime -s` trên boot mới, đo 2 lần —
    KHÔNG dùng mtime file cuối của boot cũ** (K6 §4 mục 2, nhắc
    lại): lần này #52 giữ giờ T7 chốt (08:29:12Z); T7 xác nhận lại
    bằng 2 lần đo trực tiếp + btime trên boot #52; #49 giữ giờ S10
    chốt (21:46:46Z); #50/#51 chỉ là khoảng (parent đọc uptime
    phút) — T7 đã thử kẹp từng giây qua mọi nguồn còn lại mà
    không được (xem §2.2); ghi rõ nguồn gốc giờ, đừng giả vờ đo
    lại được.
11. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
    reboot** (J8 §4 mục 1, nhắc lại): đừng bao giờ đếm reboot chỉ
    bằng `grep "boot changed"` trên log probe (30 dòng tới nay);
    chuỗi đánh số chính thức nằm trong các file LIMITS EPERM theo
    đợt.
12. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (J8 §4 mục 2, nhắc
    lại): dải chứng nhận [19'07", 3h14'08"] đứng vững trên gap đơn
    đã chứng nhận (n=28) sau lượt này; trên toàn chuỗi vẫn có 2
    gap vượt (đều là cận trên) + nay thêm 2 cận trên vượt dải
    (#49→#50, #51→#52). **Nằm trong dải không đồng nghĩa được
    chứng nhận** (M4 §4 mục 6, nhắc lại): gap #48 → #49
    (2h03'00") được chứng nhận vì khoảng đã đóng kín, không phải
    vì nó nằm trong dải.
13. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
    bằng sàn** (H7 §4 mục 1, nhắc lại): sàn 19'07" vẫn đứng sau
    lượt này; mù #35 KHÔNG đóng được là vì poller dừng + không
    còn observer sau 23:17:54Z, sàn chỉ đóng đầu/đuôi đoạn A
    (3 s) và các mép cửa sổ — sàn là công cụ bound, không phải
    bằng chứng đóng duy nhất. Riêng chứng nhận #48 → #49 dựa một
    phần vào đọc boot tươi lúc poller START (không phải sàn cho
    đầu đoạn A — xem đính chính §2.3).
14. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
    poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ lớn
    23:17:54Z → 02:17:00Z, toàn ~/workspace ngoài hai cây chỉ có
    ghi rời rạc (proactivity 23:41:55Z, self-improvement
    23:42:28Z, feed 23:45:05Z) — không session nào bắc qua lỗ này;
    đoạn B/C/D mở được là vì KHÔNG CÓ poller/watcher nào sau
    23:17:54Z, không phải vì thiếu ghi rời rạc. **Bài học vận hành
    cho parent: poller S10 chết cùng phiên S10 (~23:17Z) là điểm
    gãy — các lượt sau cần một observer sống độc lập với phiên
    agent (poller v2 loop foreground trong phiên đang sống, hoặc
    watcher v2 của infra) nếu muốn mù sau đóng được.**
15. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
    4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
    vị trí đã biết trước khi kết luận.
16. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
    §4 mục 8, nhắc lại):** lượt này 2 dòng "đã tắt" thật trong mù
    #35 đều là dương tính giả (launcher S10 O8); 0 dòng "vẫn bật",
    0 "Operation not permitted" thật. **MỚI: đừng đếm dòng nhãn
    trong file sweep-log của chính các luồng EPERM trước** — file
    `round116-s7/eperm-sweep.log` chứa cả 3 mẫu dưới dạng nhãn
    báo cáo ("0 lines"); đếm thô cho 1/1/1, số thật là 0/0/0 (xem
    §2.4). Lượt sau: loại file `eperm-sweep*.log` khỏi tập quét
    sóng, hoặc chỉ đếm dòng có timestamp sự kiện.
17. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9 / J8 §4 mục 9
    / L6 §4 mục 10 / M4 §4 mục 11 / N6 §4 mục 16 / P6 §4 mục 17 /
    Q6 §4 mục 17 / R7 §4 mục 17 / S7 §4 mục 17): lượt này probe +
    quét xong là ghi LIMITS/batch ngay, không đợi luồng khác —
    reboot #52 (08:29:12Z) đã xảy ra 6 phút trước khi đợt 117
    spawn; lượt sau có thể bị reboot giết bất cứ lúc nào.
18. **Đếm *.log sóng EPERM phải quét cả hai cây** (J8 §4 mục 10,
    nhắc lại): lần này 128 file đều nằm ở hidden_files (0 file
    repo-1). Quét một cây sẽ kết luận sai là "không có log".
19. **Scan writeFileSync có thể bị reboot cắt ngang giữa chừng**
    (L6 §4 mục 12, nhắc lại): lần này scan chạy trọn vẹn 22 s
    trên boot mới, SCAN-END có đủ; kiểm tra SCAN-END trước khi
    tin scan-meta.txt.
20. **Đếm mốc mtime (L9 §6.1, áp dụng lượt này):** mù #35 có
    **491 file** (độ chính xác đầy đủ) nhưng chỉ **485 giây
    nguyên phân biệt** — ghi cả hai số, không ghi một số mập mờ.
21. **Đo uptime tại thời điểm probe ĐÓNG đoạn đuôi sau reboot cuối
    — sàn chỉ áp dụng GIỮA hai reboot đã biết (Q6 §4 mục 21,
    R7 §4 mục 21, S7 §4 mục 21, áp dụng lượt này — xem §2.3):**
    đoạn E đóng toàn bộ bằng đo uptime trực tiếp, KHÔNG tự tạo
    cửa sổ mở giả bằng sàn.
22. **File mtime-only trong cửa sổ có thể bị ghi đè sau đó và mất
    nội dung gốc (Q6 §4 mục 22, nhắc lại):** khi đếm lại cửa sổ
    cũ, đối chiếu số file với lượt trước và giải thích mọi chênh
    lệch bằng mtime hiện tại; đừng kết luận "lượt trước đếm sai"
    khi file đã dời mtime — đoạn C mù #35 là ví dụ ngược: file
    build-loop-log.md từng được ghi 02:35–02:37Z nhưng mtime hiện
    tại đã là 08:35Z+ nên quét mtime cho 0 mốc trong đoạn C.
23. **Mtime của file chỉ là lần ghi CUỐI — append trung gian không
    thấy được bằng `find` (R7 §4 mục 23, áp dụng lượt này — xem
    §2.3):** poller S10 #2 ghi append mỗi 300 s nhưng file
    poll-s10.log chỉ có 1 mtime cuối (23:17:54Z); lỗ mtime 10.746 s
    trong đoạn B chỉ lấp được bằng cách ĐỌC NỘI DUNG log
    (timestamp trong từng dòng), không bằng mật độ mốc mtime.
    Lượt sau: khi thấy lỗ mtime lớn, đọc nội dung các log append
    trong lỗ trước khi kết luận "lỗ".
24. **Bẫy grep substring khi đếm dòng probe (R7 §4 mục 24, nhắc
    lại — lượt này KHÔNG mắc):** `grep -c "probe end"` trả 28+
    vì mọi dòng DEAD đều chứa "no probe end since last start" —
    phải dùng mẫu chính xác `=== probe end` (đúng 0 dòng). Tương
    tự, đếm "boot changed" là đếm bước nhảy ròng, không phải số
    reboot (xem mục 11).
25. **Chứng minh poller là 1 tiến trình từ NỘI DUNG log, không cần
    session launch (R7 §4 mục 25, áp dụng lượt này — xem §2.3):**
    1 lần bắt đầu lại #1 duy nhất + chuỗi poll liên tiếp đúng số
    thứ tự + đúng khoảng 300 s + script không có cơ chế restart
    + ghi chú đương thời của S10 (poller #1 chết theo reboot, #2
    chạy lại 21:47:53Z) — hợp lại đã đủ chứng minh tính đơn nhất;
    không cần tìm proc log của session đã launch nó.
26. **Prereg phải ghi cả hai khả năng khi cơ chế dedupe chưa chắc
    chắn (Q6 §4 mục 23, nhắc lại):** T7 dự báo đúng log +3 vì đã
    kiểm tra trước rằng chưa có dòng DEAD nào cho heartbeat #35.
    Lượt sau: kiểm tra dòng DEAD cuối log trước khi dự báo số dòng
    tăng.
27. **Tái dùng bảng gap bằng exec nguyên văn, không gõ lại (R7 §4
    mục 27, áp dụng lượt này — xem §2.5):** blind35-gaps.py exec
    blind34-gaps.py nguyên văn rồi cộng 1 gap mới — các kiểm tra
    chéo CERT27 và FULL42 đều khớp 100% số S7 đã công bố. Gõ lại
    bảng gap bằng tay rất dễ sai số.
28. **`find %w` (birth time) KHÔNG được hỗ trợ bởi findutils trên
    VM này (S7 §4 mục 28, áp dụng lượt này — xem §2.3):** T7 dùng
    `find -print0` + `stat -c '%W %Y %n'` trên 324 file exec-log
    (btime hoạt động). Lượt sau: ĐỪNG dùng `find %w` — dùng
    `stat %W`.
29. **Dòng log sau reboot không tự động là bằng chứng sống sót
    (S7 §4 mục 29, nhắc lại):** lượt này không gặp dòng dị thường
    kiểu gateA poll 3 của R5; mọi dòng log dùng làm bằng chứng đều
    đã kiểm tiến trình ghi có thể sống qua reboot hay không (poller
    START đọc tươi / waiter READY đọc tươi / session birth-mtime).
30. **Đính chính mới — "đầu đoạn đóng bằng sàn" là lập luận sai
    khi khoảng đầu ngắn hơn sàn nhưng thỏa cả hai phía sàn (mới,
    lượt này — xem §2.3 đoạn A):** một khoảng (a, b] với b − a <
    sàn chỉ đóng bằng sàn khi b − a < sàn VÀ t trong đó vi phạm
    sàn so với MỘT trong hai reboot kề — cụ thể: t ∈ (21:04:50Z,
    21:06:42Z] thỏa t − #48 ≥ 19'07" và #49 − t ≥ 19'07" nên sàn
    KHÔNG loại được. Đoạn A đóng được nhờ dòng START đọc boot
    tươi, không nhờ sàn. Lượt sau: khi viết "đoạn ngắn hơn sàn nên
    đóng", kiểm tra cả hai bất đẳng thức sàn trước khi kết luận —
    chỉ khi khoảng nằm TRONG 19'07" ngay sau reboot trước HOẶC
    ngay trước reboot sau thì sàn mới đóng một mình.
31. **Giờ reboot từ uptime phút (parent đọc) không kẹp được từng
    giây sau đó (mới, lượt này — xem §2.2):** #50/#51 chỉ còn là
    khoảng vì không có nguồn nào lưu output `uptime -s` từng giây
    (session cron chỉ còn `ls`/`read`/`tail`; journal/wtmp chỉ giữ
    boot hiện tại; dpkg.log không có entry qua đêm). Lượt sau:
    khi phát hiện reboot mới bằng đọc uptime, **ghi output
    `uptime -s` + boot_id đầy đủ vào file ngay lúc đó** (như
    probe-notes của luồng EPERM) thay vì chỉ ghi "uptime ~20
    phút" vào log — nếu không, giờ reboot đó mãi mãi chỉ là
    khoảng và mọi gap liên quan mãi mãi chỉ là cận trên.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #35 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem §2.3):**
   4 reboot đã chốt (#49 21:46:46Z, #50 ~02:17Z, #51 ~04:31Z, #52
   08:29:12Z) + 3 cửa sổ mở tổng 6h49'50" (B 2h39'59" tối đa 9 ẩn;
   C 1h35'46" tối đa 5–6 ẩn; D 2h34'05" tối đa 9 ẩn) + tối đa 24
   reboot ẩn danh nghĩa. Gap #48 → #49 = 2h03'00" ĐƯỢC CHỨNG NHẬN
   (mới — xem §2.5; chứng nhận dựa vào đoạn A đóng bằng đọc boot
   tươi lúc poller START + sàn đuôi — chờ parent xác nhận, nếu
   không đồng ý thì hạ về cận trên, CERT về n=27). Các gap #49 →
   #50 ≈ 4h30'14", #50 → #51 ≈ 2h14'00", #51 → #52 ≈ 3h58'12"
   giữ **cận trên**. Số thứ tự #49–#52 vẫn TẠM THỜI (tối đa "thực
   tế #80"). Dải cơ học cho #53 từ #52: [08:48:19Z, 11:43:20Z] —
   hiệu dụng [08:42:46Z, 11:43:20Z] sau probe #36; là phép áp dải
   máy móc, không phải dự báo.
2. **Khoảng mù #34 VẪN ĐÓNG HOÀN TOÀN** (S7 đợt 116; parent đã
   chấp nhận — QUYẾT PARENT 7). Gap #46 → #47 = 2h01'01" và gap
   #47 → #48 = 1h57'56" ĐÃ ĐƯỢC CHỨNG NHẬN (parent chấp nhận).
3. **Khoảng mù #33 ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (R7 đợt 115).
   Gap #45 → #46 = 2h27'07" ĐÃ ĐƯỢC CHỨNG NHẬN (R7; parent đã
   chứng nhận gap #44 → #45, quyết parent 15/11).
4. **Khoảng mù #32 ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (Q6 đợt 114).
5. **Khoảng mù #31 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI, KHÔNG THỬ
   LẠI LƯỢT NÀY** (Q6 §2.6, R7 §2.6, S7 §2.6, T7 §2.6): 1 cửa sổ
   mở — 8'55" (10:23:54Z → 10:32:49Z). Số reboot trong mù: 2 đã chốt
   (#43 08:53:37Z; #44 10:53:31Z) + có thể tối đa 1 ẩn. **Số thứ
   tự #43/#44 vẫn TẠM THỜI** — parent/user quyết xem có chấp nhận
   "ít nhất 2 reboot, có thể 3" làm mức đóng của mù #31 hay để mở
   như mù #24/#26/#28/#29/#30. T7 không tự quyết. Gap #43 → #44
   = 1h59'54" KHÔNG được chứng nhận (cận trên); không còn nguồn
   nào để thử thêm (trừ khi có nguồn mới thật sự).
6. **Khoảng mù #30 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (N6 §5 mục
   1, P6 §5 mục 2, Q6 §5 mục 3, R7 §5 mục 4, S7 §5 mục 5): 3 cửa
   sổ mở, tổng 30'50"; số reboot trong mù: 2 đã chốt + có thể tối
   đa 2 ẩn. Số thứ tự #41/#42 vẫn TẠM THỜI. Không còn dữ liệu nào
   để thu hẹp thêm — parent/user quyết. T7 không tự quyết.
7. **Khoảng mù #29 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (M4 §5 mục
   1, P6 §5 mục 3, Q6 §5 mục 4, R7 §5 mục 5, S7 §5 mục 6): lỗ thật
   14'31" theo M4 / 13'33" theo M9 birth-time, khe 79 s không loại
   trừ được; số reboot trong mù: 2 đã chốt + có thể 1 ẩn. Số thứ
   tự #39/#40 vẫn TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm
   — parent/user quyết. T7 không tự quyết.
8. **Khoảng mù #28 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (L6 §5 mục
   1, P6 §5 mục 4, Q6 §5 mục 5, R7 §5 mục 6, S7 §5 mục 7): lỗ
   23'39" (02:01:06Z → 02:24:45Z), khe 4'32" không loại trừ được;
   số reboot trong mù: 2 đã chốt + có thể 1 ẩn. Số thứ tự #37/#38
   vẫn TẠM THỜI. Không còn dữ liệu nào để thu hẹp thêm —
   parent/user quyết. T7 không tự quyết.
9. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (J8 §6 mục
   1, P6 §5 mục 5, Q6 §5 mục 6, R7 §5 mục 7, S7 §5 mục 8): lỗ
   1h13'58" (19:20:19Z → 20:34:17Z) có thể chứa thêm reboot; số
   reboot trong mù: ít nhất 1 (#34), có thể nhiều hơn — không xác
   định được; số thứ tự #34 là TẠM THỜI.
10. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
    1, P6 §5 mục 6, Q6 §5 mục 7, R7 §5 mục 8, S7 §5 mục 9): lỗ
    2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm reboot; ít
    nhất 1 (#32), có thể nhiều hơn — không xác định được; số thứ
    tự #32 → #52 là TẠM THỜI.
11. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục
    1, P6 §5 mục 7, Q6 §5 mục 8, R7 §5 mục 9, S7 §5 mục 10): lỗ
    ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
    gian. Không còn dữ liệu nào để thu hẹp thêm — parent/user
    quyết. T7 không tự quyết.
12. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
    §6 mục 3, P6 §5 mục 8, Q6 §5 mục 9, R7 §5 mục 10, S7 §5 mục
    11): cửa sổ lý thuyết ≤78 s với sàn 19'07". T7 không thử lại,
    không tự quyết — parent/user quyết giữ "đóng", "đóng có điều
    kiện", hay mở lại.
13. **Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
    riêng 10 phút vẫn chờ user quyết.
14. **Dị thường gateA poll 3 (R5, 19:44:10Z) vẫn CHƯA GIẢI THÍCH
    ĐƯỢC** (R5 LIMITS §1.4; S7 §2.2; T7 không gặp thêm dòng dị
    thường kiểu này trong mù #35). Parent có thể giao luồng hạ
    tầng điều tra cơ chế (đồng hồ nhảy sau reboot? exec service
    restart?) — T7 không tự kết luận.
15. **Poller S10 chết cùng phiên S10 (~23:17Z) là điểm gãy quan
    sát (mới, lượt này — xem §4 mục 14):** mù #35 mở chủ yếu vì
    không còn observer nào sau 23:17:54Z (poller #2 dừng khi phiên
    S10 kết thúc; không có watcher/poller nào khác chạy qua đêm).
    Đề xuất parent: các lượt sau cần một observer sống độc lập với
    phiên agent (poller v2 loop foreground trong phiên đang sống,
    hoặc watcher v2 của infra chạy sớm sau mỗi reboot) nếu muốn mù
    sau đóng được; và khi phát hiện reboot mới bằng đọc uptime,
    ghi output `uptime -s` + boot_id đầy đủ vào file ngay (xem §4
    mục 31) — nếu không giờ reboot đó mãi chỉ là khoảng.
16. **Nợ mở đợt 117 (kế thừa LIMITS gộp đợt 116 §10 + T7 §5):**
    E4 tái hiện (T1), zombie hướng sửa mới (T2), điểm gãy tải
    >21,07 (T3), migration lock v2 3 điều kiện (T4), WebKit ≤60 ms
    theo dõi (T5, đã đóng), ghost seek ≥80 seek (T6), mù #35 mở
    (T7 — lượt này), postboot #49/#50/#51 + kẹp replay #49 +
    headroom + watcher v2 sớm (T8), B-Q8-1 hướng khác (T9), G1 +
    mù #22 + mù #28 + mù #29 + mù #30 + mù #31 chờ user quyết,
    birefnet 0 lần thành công — chỉ thử lại khi RAM đổi (RAM khả
    dụng ~0,8–3,7 GB < ngưỡng 6 GB, u2net là fallback chính thức;
    max RAM trong mù #35 là 3,59 GB); ci-security.yml vẫn 403 chờ
    user; TTS 39 CẤM kiểm lại.
