# PHASE9 ROUND108 J8 — EPERM: probe #27 + khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN + làm lại mô hình dự báo reboot

> Luồng J8, đợt 108 vòng lặp Phase 9 VCut Studio (lượt cron 03:35 +07,
> 14/11/2026; làm việc ~20:40–20:50Z 13/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù
> #26 kể từ probe #26 (17:40:22Z 13/11) + LÀM LẠI mô hình dự báo reboot
> từ toàn bộ lịch sử #1–#34 + quét sóng EPERM + quét writeFileSync theo
> chuẩn mới (đối chiếu snapshot I7 đợt 107) + ghi RAM hiện tại (birefnet:
> KHÔNG chạy — vẫn dưới ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #24, mù #22, mù #21, hay reboot #16**
> — chỉ báo cáo "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 20:40:22Z
  báo **DEAD/STALE** (heartbeat age 10.800 s, last #26 17:40:22Z,
  boot 63a52041, exit 1); `once` ngay sau đó là **probe #27, boot
  cc460738 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại **ALIVE**
  (age 6 s, n=27), exit 0. Log v2 tăng đúng 3 dòng (70 → 73);
  heartbeat nay n=27, ts 20:40:28Z, boot cc460738-…
- **Reboot #34 = 20:34:17Z** (63a52041 → cc460738), chốt từng giây
  bằng `uptime -s` + `boot_id` đo trực tiếp lúc 20:40:15Z và xác nhận
  lại 20:40:34Z. Gap #33 → #34 = **5h43'18" — dài nhất trong chuỗi
  đã đánh số, NHƯNG là cận trên chưa chứng nhận** (xem §2.3): nó
  chứa lỗ không-bản-ghi 1h13'58" nên có thể thực chất là 2 gap ngắn
  hơn với 1 reboot ẩn ở giữa. **Số thứ tự #34 là TẠM THỜI.**
- **Khoảng mù #26: 17:40:22Z → 20:40:28Z (3h00'06") — KHÔNG ĐÓNG
  HOÀN TOÀN (mới, lượt này).** Lỗ không-bản-ghi **1h13'58"**
  (19:20:19Z → 20:34:17Z) trong cả hai cây giám sát — dài hơn nhiều
  so với 2 × sàn (38'14"), không có tiến trình chạy nền dài hạn nào
  phủ, nên **không loại trừ được reboot ẩn**. Trong mù: ít nhất 1
  reboot đã chốt giờ (#34); có thể nhiều hơn — không xác định được.
  Đoạn 17:40:22Z → 19:10:59Z thì đóng bằng loại trừ trực tiếp
  (poller I9, 10 poll cùng boot); đuôi sau #34 (6'11") đóng bằng
  uptime đo trực tiếp. Đây là mù thứ hai liên tiếp không đóng được
  hoàn toàn (sau #24).
- **Mô hình dự báo reboot LÀM LẠI (mới, lượt này — xem §2.5):
  BỎ dự báo điểm.** Sai số điểm 3 lượt liên tiếp: F9 −1h32', G8
  +1h03', H7 +3h42' — MAE 2h06' LỚN HƠN cả gap trung vị (1h59'48",
  tỉ số 1,05). Phân phối gap #6 → #34 (n=28): trung vị 1h59'48",
  trung bình 2h06'54", p10 44,9', p90 3h07'54", min 19'07", max
  5h43'18" (cận trên chưa chứng nhận); chỉ tính các gap đơn đã
  chứng nhận (n=19): max vẫn 3h14'08", p10–p90 1h03'36"–3h02'00".
  Mô hình thay thế: **chỉ báo dải** (dải chứng nhận 19'07"–3h14'08"
  + p10–p90 thực nghiệm) **+ đo uptime trực tiếp + poller**; không
  lên lịch theo dự báo. **Không đưa dự báo điểm cho #35** — chỉ
  dải cơ học [20:53:24Z, 23:48:25Z] kèm cảnh báo dải đã bị vượt 2
  lần bởi các gap chưa chứng nhận.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong 88
  file *.log có mtime trong mù #26 (0 file repo-1, 88 file
  hidden_files); 4 dòng "sóng EPERM đã tắt" đều là **dương tính
  giả đã biết** (dòng launcher). Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — ~56h29'28" trước probe #27. EPERM vẫn
  KHÔNG được tuyên bố là đã hết. Lỗ 1h13'58" cũng là **mù hoàn
  toàn về sóng**.
- **Quét writeFileSync chuẩn mới: 540 dòng / 166 file** (phạm vi
  2752 file); R7b đối chiếu 565 dòng / 183 file; copies 25 dòng /
  17 file; đối chiếu chéo 540+25=565=R7b, **chênh 0 — lần thứ mười
  bốn liên tiếp**. +34 dòng / +8 file so với I7, giải thích đúng
  hết bằng diff. 1 file biến mất khỏi scope (vite.config.i1-temp.ts
  — file tạm, I7 đã dự báo). Async `.writeFile(`: vẫn đúng **2 vị
  trí, cả hai trong helper retry đã biết** — 0 stray (xem §2.7).
- RAM 4 mẫu của lượt: **1.586.040 / 1.521.996 / 1.585.516 /
  1.508.644 kB** (~1,55 / 1,49 / 1,55 / 1,47 GB) — ~25% ngưỡng
  guard; max RAM biết được trong mù #26 là **2.965.144 kB**
  (I2 check 3, 17:49:22Z) = 48% guard. Birefnet KHÔNG chạy, vẫn 0
  lần chạy thành công trong gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ
  parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 20:40:15Z | boot_id `cc460738-3ea3-4376-8dfc-eb9000cc6dab`; `who -b` Nov 13 20:34; `uptime -s` **2026-11-13 20:34:17Z** (uptime ~6'); journal chỉ 1 boot (cc460738, first entry 20:34:31Z, last 20:40:31Z lúc kiểm tra); `last -x reboot` 20:34 still running; wtmp bắt đầu 20:34:31Z |
| `bash scripts/probe-eperm-v2.sh status` | 20:40:22Z | **DEAD/STALE**, exit 1 — heartbeat n=26, ts 17:40:22Z, boot 63a52041, age **10.800 s** (đúng 3h00'00"); last sample probe #26; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 20:40:28Z | **probe #27, boot=cc460738, ok=2 fail=0**, exit 0; dòng `boot changed 63a52041 -> cc460738` (uptime since 2026-11-13 20:34:17) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 20:40:34Z | **ALIVE**, age 6 s, n=27, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 73 dòng, trước lượt 70 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=27, ts
20:40:28Z, pid=6892, boot cc460738-3ea3-4376-8dfc-eb9000cc6dab).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
(od: `x \n`) — không phải checklist P8 §2.3, như I7 đã đính chính.
Lượt này làm theo checklist như H7 §1 đã ghi (status → once →
status, log +3 dòng, DEAD → once → ALIVE), khớp mẫu mọi lượt trước.

## 2. Điều tra khoảng mù #26 (17:40:22Z → 20:40:28Z, 3h00'06")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #27: `uptime -s` = **2026-11-13 20:34:17Z**,
  boot_id `cc460738-3ea3-4376-8dfc-eb9000cc6dab` — khác boot của
  probe #26 (63a52041).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (lúc 20:40:15–20:40:34Z): chỉ **1
  boot** (hiện tại, cc460738, first entry 20:34:31Z, last
  20:40:31Z). `last -x reboot`: chỉ 1 dòng (20:34, still running).
  wtmp bắt đầu 20:34:31Z. Journal/wtmp của boot 63a52041 đã mất
  theo reboot #34 — như mọi lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu.

### 2.2 Reboot duy nhất đã chốt trong mù — #34, 20:34:17Z

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 34 | **20:34:17Z (chính xác từng giây)** | 63a52041 → cc460738 | J8 đo trực tiếp 2 lần lúc 20:40:15Z và 20:40:34Z (`uptime -s` + `boot_id` + `who -b` + journal first entry 20:34:31Z); dòng `boot changed … (uptime since 2026-11-13 20:34:17)` trong log probe v2; spawn đợt 108 (cron 20:35:51Z) diễn ra trên boot mới, ~94 s sau reboot. **Số thứ tự TẠM THỜI** — điều kiện: 0 reboot ẩn trong lỗ của mù #26 (xem §2.3), và cộng dồn điều kiện tạm thời từ mù #24 (xem H7 §2.3). |

Khoảng cách #33 → #34 = **5h43'18" — dài nhất trong chuỗi đã
đánh số** (vượt trần cũ 3h14'08" tới 2h29'10"). Boot #33 sống
5h43'18" — boot sống lâu nhất từng ghi. **Nhưng cả hai kỷ lục
này đều CHƯA CHỨNG NHẬN là gap đơn** (xem §2.3 + §2.5): gap này
chứa lỗ 1h13'58" nên có thể thực chất là 2 gap ngắn hơn.

### 2.3 Hoạt động trong khoảng mù — vì sao KHÔNG ĐÓNG ĐƯỢC

Hoạt động ghi đĩa trong hai cây giám sát, chia làm ba đoạn bởi
#34 (20:34:17Z). Đếm cửa sổ (ảnh chụp lúc đo): repo-1 **21 file
nguồn** (không tính dist/node_modules) + dist build 19:16:54–55Z;
hidden_files **2080 file** (không tính chrome-userdata top-level;
phần lớn là file work U4/I9 chạy lại trong lúc verify).

- **Đoạn TRƯỚC #34, khi còn observer: 17:40:22Z → 19:10:59Z
  (1h30'37", boot 63a52041) — ĐÓNG bằng loại trừ trực tiếp:**
  - **Poller I9 là kẹp trực tiếp:** poll 0–9, mỗi ~10 phút, tất
    cả cùng boot 14:50:59Z, uptime tăng đơn điệu 2:49 → 4:02:
    17:40:22, 17:50:55, 18:01:17, 18:05:00, 18:10:49, 18:21:13,
    18:31:42, 18:42:30, 18:53:37, 19:10:59Z (poll 9 ghi rõ
    "boot 2026-11-13 14:50:59" + suite 27/27 + O8 21/21 cả 2
    engine). Một reboot ẩn trong đoạn này phải giết poller —
    không, nó poll đều suốt 1h30'. Poll 4 (18:10:49Z) đã ghi nhận
    dải dự báo H7 bị phá lần đầu (gap #33 → #34 vượt trần
    3h14'08").
  - Hoạt động driver dày đặc suốt đoạn: LIMITS I7 17:48:57Z, I4
    17:51:08Z, I1 17:54:01Z, I2 17:56:09Z, I3 17:59:59Z, I8
    18:37:03Z, I5 18:46:31Z, I6 18:52:42Z, O8 xong 19:04:11Z, I9
    LIMITS 19:08:19Z. Khoảng trống mtime dài nhất trong đoạn
    (17:59:59Z → 18:37:03Z, 37'04") **nhỏ hơn 2 × sàn**
    (38'14") và được lấp bằng nội dung poll.log (poll 5–6 trong
    lỗ đó) — bài học I7 §4 mục 1 áp dụng lại: đọc nội dung log
    append, không chỉ đếm mtime.
- **Đoạn CHUYỂN TIẾP: 19:10:59Z → 19:20:19Z (9'20") — đóng trên
  bằng chứng hoạt động, KHÔNG bằng loại trừ trực tiếp:**
  - Hoạt động: ROUND107 LIMITS 19:14:10Z, GAP_ANALYSIS 19:14:29Z,
    dist build 19:16:54–55Z, U4 measurements.json 19:20:19Z
    (verify I9 chạy lại) + 1 exec-log runtime 19:20:19.152Z
    (cùng giây — cùng job verify/closing).
  - Poller I9 đã dừng sau poll 9 (đóng băng xong ~19:19Z theo kế
    hoạch spawn+100'); không còn tiến trình chạy nền dài hạn nào
    sau 19:10:59Z. Một reboot ẩn trong 9'20" này phải giết các
    job verify/closing đang chạy và để chúng ghi tiếp trong cùng
    9'20" mà không để lại run bị giết nào — rất khó xảy ra, nhưng
    theo chuẩn H7 §4 mục 2 (ghi rời rạc không loại trừ được),
    đoạn này chỉ được tính là "đóng trên bằng chứng hoạt động",
    không phải loại trừ trực tiếp.
- **LỖ: 19:20:19Z → 20:34:17Z (1h13'58") — KHÔNG ĐÓNG ĐƯỢC:**
  - **0 file** có mtime trong hai cây giám sát (repo-1 không tính
    dist/node_modules; hidden_files không tính chrome-userdata);
    **0 file** trong `dist` sau 19:16:55Z; **0 file** trong /tmp
    (cả mù #26 cũng 0 file /tmp — nhất quán với việc reboot #34
    xóa /tmp; không dùng /tmp làm mốc).
  - Ngoài hai cây, toàn ~/workspace chỉ có **1 file** mtime trong
    lỗ — chính exec-log 19:20:19.152Z ở biên lỗ (đã kể ở đoạn
    trên), không phải bản ghi mới trong lỗ. Sau biên đó, không còn
    gì tới spawn đợt 108 (20:35:51Z, sau #34).
  - Sàn KHÔNG loại trừ được: lỗ dài 1h13'58" >> 2 × sàn mới
    (38'14"). Một reboot ẩn T bất kỳ trong lỗ chỉ cần cách #33 và
    #34 mỗi bên ≥ 19'07" — sàn chỉ loại trừ được đuôi lỗ
    (20:15:10Z → 20:34:17Z, 19'07"); cửa sổ còn lại
    (19:20:19Z → 20:15:10Z, **54'51"**) hoàn toàn mở.
  - Tiến trình chạy nền dài hạn KHÔNG có: poller I9 đã dừng
    19:10:59Z; không watcher nào sống qua 19:20:19Z. Đây là cùng
    một lỗ hệ thống như mù #24 (H7 §4 mục 3): đợt cũ đóng băng
    xong (~19:19Z) và đợt mới spawn 3 giờ sau mới có observer —
    khoảng trống giữa hai đợt không có ai canh.
- **Đuôi SAU #34: 20:34:17Z → 20:40:28Z (6'11") — ĐÓNG bằng
  uptime đo trực tiếp:** `uptime -s` = 20:34:17Z tại probe #27
  chứng minh máy up liên tục từ 20:34:17Z; spawn đợt 108
  (20:35:51Z) + round-in-progress.md / build-loop-log.md
  (20:39:50Z) đều trên boot mới.

**Kết luận trung thực: khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN.**
Đúng 1 reboot đã chốt giờ trong mù (#34, 20:34:17Z); lỗ 1h13'58"
(19:20:19Z → 20:34:17Z) có thể chứa thêm reboot — số lượng không
xác định được. **Hệ quả trực tiếp: số thứ tự #34 là TẠM THỜI,**
cộng dồn với tính tạm thời từ mù #24 (nếu lỗ mù #24 chứa k reboot
ẩn thì "reboot #34" thực tế là #(34+k), cộng thêm số reboot ẩn
(nếu có) trong lỗ mù #26). Không còn dữ liệu nào để thu hẹp lỗ
này thêm (journal/wtmp volatile, không có /var/log/syslog hay
kern.log) — **không thể đóng mù #26 hồi tố bằng một probe tương
lai**: probe #28 trên boot cc460738 sẽ đóng mù #27 (từ 20:40:28Z),
không đóng được mù #26. Parent/user quyết xem có chấp nhận "ít
nhất 1 reboot, có thể nhiều hơn" làm mức đóng của mù #26 hay để
mở như mù #24/#21. J8 không tự quyết.

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 107 + spawn đợt 108

Khoảng mù 17:40:22Z → 20:40:28Z (3h00'06") được phủ bởi các luồng
sibling đợt 107 (I1–I9, làm việc tới ~19:20Z) + spawn đợt 108
(20:35:51Z, file đầu round-in-progress.md 20:39:50Z — trong mù, 38
giây trước khi mù đóng). Đã đọc lại log thật (grep `sóng EPERM
vẫn bật` / `CẢNH BÁO: chờ sóng` / `Operation not permitted` /
`sóng EPERM đã tắt` trên 88 file *.log có mtime trong mù #26 —
0 file repo-1, 88 file hidden_files, trừ chrome-userdata):

| Nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| round107-i2/run-f5-hiram107.log | 17:49:25Z + 17:50:22Z | 2 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết** |
| round107-i9-o8.log | 19:02:21Z + 19:03:19Z | 2 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết** |
| Toàn bộ 88 log | toàn mù | "vẫn bật" 0 hit; "CẢNH BÁO" 0 hit; "Operation not permitted" 0 hit thật |

Tổng trong *.log có mtime trong mù #26: **4 dòng "đã tắt"** (2
cặp, đều mẫu launcher) + **0 dòng "vẫn bật", 0 "CẢNH BÁO", 0
"Operation not permitted" thật**.

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5):**
cả 4 dòng đều là dòng launcher "sóng EPERM đã tắt, khởi động
vite" in khi lần ghi thử ĐẦU TIÊN thành công ngay (code launcher
`waveOff=true` ở lần write đầu) — in mặc định cả khi không có
sóng. Bằng chứng phân biệt: **0 dòng "sóng EPERM vẫn bật sau …s
chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"** trong
toàn bộ 88 log; **0 lần "Operation not permitted" thật**.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **Lỗ 1h13'58" là mù hoàn toàn về sóng** (đủ dài để
  chứa nhiều sóng ~16 phút mà không để lại dấu vết nào) — và khác
  mù #25, lỗ này **có thể chứa reboot ẩn** (xem §2.3). Mù #26 "mù"
  về cả sóng lẫn reboot trong cùng một lỗ. Đoạn chuyển tiếp 9'20"
  (19:10:59Z → 19:20:19Z) cũng mù về sóng (chỉ có file ghi, không
  có probe sóng nào chạy).
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~56h29'28" trước
  probe #27 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #27 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 20:40:28Z ghi được.

### 2.5 LÀM LẠI mô hình dự báo reboot (mới, lượt này)

#### 2.5.1 Vì sao mô hình cũ chết: sai số điểm 3 lượt liên tiếp

| Lượt | Dự báo điểm | Thực tế | Sai số |
|---|---|---|---|
| F9 → #31 | ~12:59Z | 11:26:40Z | **−1h32'20"** (sớm, ngoài dải) |
| G8 → #32 | ~13:28:49Z | 14:31:52Z | **+1h03'03"** (muộn, trong dải sát trần) |
| H7 → #34 | ~16:51:58Z | 20:34:17Z | **+3h42'19"** (muộn; lúc probe #26 đã lệch +48'24" và vẫn tăng) |

MAE 3 lượt = **2h05'54"** — lớn hơn cả gap trung vị (1h59'48",
tỉ số MAE/trung vị = **1,05**). Dự báo điểm "trung bình ~2h01'"
sai trung bình nhiều hơn cả một gap điển hình, và sai cả hai
hướng. Kết luận: **dự báo điểm không còn dùng được — bỏ hẳn,
không thay bằng một điểm khác.**

#### 2.5.2 Dữ liệu: chuỗi gap #6 → #34 (n=28) — phạm vi và chất lượng

Chuỗi đã chốt (giờ chính xác từng giây, trừ các mốc ~): bảng H7
§2.4 (#14 → #33) + #33 → #34 mới + tái cấu trúc #6 → #14 từ log
probe v2 + xác nhận S7 (xem §2.5.4 về cách tái cấu trúc). Thời kỳ
trước #6 (#1–#5, 10/11) **loại khỏi phân phối**: giờ chỉ là ~
(20:18Z, 23:28Z, 02:03Z, 08:24:39Z) và còn 1 reboot chưa định vị
được giờ (xem §2.5.4) — không đủ chính xác để tính gap.

Phân phối gap #6 → #34 (n=28; các gap ~ dùng điểm giữa, xem bảng
đầy đủ ở §2.5.3):

| Thống kê | Toàn bộ n=28 | Chỉ gap đơn đã chứng nhận n=19 |
|---|---|---|
| Min | 19'07" (#32 → #33) | 19'07" |
| Max | **5h43'18" (#33 → #34, cận trên)** | **3h14'08" (#26 → #27)** |
| Trung bình | 2h06'54" | 1h56'00" |
| Trung vị | 1h59'48" | 1h59'48" |
| Độ lệch chuẩn (mẫu) | 66,5' (CV 0,52) | — |
| p10 | 44,9' | 1h03'36" |
| p25 | 1h42'30" | — |
| p75 | 2h15'12" | — |
| p90 | 3h07'54" | 3h02'00" |

Đọc thêm: 16/28 gap (57%) nằm trong 90'–150'; 4 gap < 60', 6 gap
> 180', 2 gap > 240' (cả hai đều là cận trên chưa chứng nhận).
Nửa đầu chuỗi (#6 → #19, n=14): trung bình 2h00'12", trung vị
1h56'54"; nửa sau (#20 → #34, n=14): trung bình 2h13'30", trung
vị 2h00'36" — **không có xu hướng rõ rệt**; cái tăng là phương
sai (min 19'07" và max 5h43'18" đều ở nửa sau). Tốc độ trung bình
cả chuỗi: 34 reboot / 72h16'07" (từ ~20:18:10Z 10/11 tới
20:34:17Z 13/11) = **1 reboot / 2h07'33"** — nhưng đây là cận
dưới của tần suất thật (xem §2.5.5).

#### 2.5.3 Bảng gap đầy đủ #6 → #34

| Cặp | Gap | Trạng thái |
|---|---|---|
| #6 → #7 | 2h13'21" | exact (09:21:17Z → 11:34:38Z) |
| #7 → #8 | 1h46'28" | exact (11:34:38Z → 13:21:06Z) |
| #8 → #9 | ~2h08' | approx ±1' (~15:29Z) |
| #9 → #10 | ~1h55' | approx ±1' (~15:29Z) |
| #10 → #11 | 1h58'47" | exact (17:24:01Z → 19:22:48Z) |
| #11 → #12 | 4h10'33" | **CẬN TRÊN** (chứa mù #11) |
| #12 → #13 | 3h01'21" | exact (23:33:21Z → 02:34:42Z) |
| #13 → #14 | ~50' | approx (~03:25Z ±~5') |
| #14 → #15 | ~1h53' | approx (~03:25Z) |
| #15 → #16 | ~2h08'–2h12' | approx (kẹp #16) |
| #16 → #17 | ~31'–35' | approx (kẹp #16) |
| #17 → #18 | 1h23'02" | exact |
| #18 → #19 | 2h06'08" | exact |
| #19 → #20 | 1h54'16" | exact |
| #20 → #21 | 1h59'46" | exact |
| #21 → #22 | 2h01'12" | exact |
| #22 → #23 | 3h04'35" | exact |
| #23 → #24 | 1h11'36" | exact |
| #24 → #25 | 2h09'31" | exact |
| #25 → #26 | 2h20'49" | exact |
| #26 → #27 | **3h14'08"** | exact — max gap đơn đã chứng nhận |
| #27 → #28 | 1h30'26" | exact |
| #28 → #29 | 1h59'55" | exact |
| #29 → #30 | 1h58'14" | exact |
| #30 → #31 | 31'47" | exact |
| #31 → #32 | 3h05'12" | **CẬN TRÊN** (chứa lỗ mù #24) |
| #32 → #33 | **19'07"** | exact — min (sàn) |
| #33 → #34 | **5h43'18"** | **CẬN TRÊN** (chứa lỗ mù #26 1h13'58") |

#### 2.5.4 Đính chính quan trọng: "trần" cũ 3h14'08" chỉ đúng trên gap #14–#33

H7/G8 ghi "trần 3h14'08"" — con số này chỉ đúng trên cửa sổ
#14 → #33 mà các bảng gap của F7/G8/H7 liệt kê. Trên toàn chuỗi
#6 → #34 đã có **2 gap vượt trần này, và cả hai đều là cận trên
chưa chứng nhận** (#11 → #12 4h10'33", #33 → #34 5h43'18").
Trên các gap đơn đã chứng nhận (n=19), max vẫn là 3h14'08" —
trần cũ đứng vững ở đó, nhưng chỉ ở đó. **Từ nay không trích
"trần 3h14'08"" mà không ghi rõ tập gap nó bao phủ.**

Tái cấu trúc #6 → #14 (mới, lượt này — kiểm chứng được từ log
probe v2 + S7): log probe v2 chỉ ghi **bước nhảy ròng** giữa hai
probe liên tiếp, nên nó bỏ lọt reboot trung gian — 3 trường hợp
đã biết: ~15:29Z 11/11 (62b088d2 → 0799d357, S7 xác nhận bằng
poller R8 bị giết ở poll 4 + uptime 1 phút lúc 15:29Z; probe log
chỉ ghi nhảy ròng 62b088d2 → 182a689e), #16 (~07:26–07:30Z,
boot adcef40a), #30 (10:54:53Z, boot 287705ad). Đánh số đi kèm:
#6 = 09:21:17Z, #7 = 11:34:38Z, #8 = 13:21:06Z, #9 = ~15:29Z,
#10 = 17:24:01Z, #11 = 19:22:48Z, #12 = 23:33:21Z, #13 =
02:34:42Z, #14 = ~03:25Z, #15 = 05:17:47Z — khớp GAP_ANALYSIS
(#12 23:33:21Z, #13 02:34:42Z, #14 ~03:25Z) và W7 ("15 lần trong
~32h59' từ ~20:18Z 10/11"). Hệ quả cho thời kỳ trước #6: với #1
= ~20:18Z 10/11 thì #2–#5 phải là 4 reboot trước 09:21:17Z
11/11, nhưng chỉ 3 có giờ (~23:28Z 10/11, ~02:03Z 11/11,
08:24:39Z 11/11) — **còn 1 reboot thời kỳ đầu chưa định vị được
giờ**, nên toàn bộ gap trước #6 bị loại khỏi phân phối. Đây là
giới hạn dữ liệu, không phải lỗi đếm của lượt nào trước.

#### 2.5.5 Mô hình mới (J8) — chỉ dải + đo trực tiếp, không điểm

1. **Bỏ dự báo điểm.** Không đưa điểm cho #35 hay bất kỳ reboot
   nào sau đó. Lý do: MAE/trung vị = 1,05 (§2.5.1); 3 lượt liên
   tiếp sai > 48', ngược hướng nhau; dải điểm ±~2h rộng bằng
   chính gap trung vị nên điểm không mang thông tin hơn "khoảng
   2 giờ nữa".
2. **Dải làm việc (certified band): [19'07", 3h14'08"]** — min–max
   trên các gap đơn đã chứng nhận (n=19). Dùng làm mốc làm việc
   duy nhất khi cần một dải. Cảnh báo kèm: dải này đã bị vượt 2
   lần bởi các gap chưa chứng nhận — nó là phát biểu về các gap
   đơn đã biết, không phải bảo đảm.
3. **Khoảng tin cậy thực nghiệm p10–p90:** toàn chuỗi n=28:
   **[44,9', 3h07'54"]** (rộng 2h23'); gap đơn n=19: **[1h03'36",
   3h02'00"]**. Khi cần lên kế hoạch cửa sổ làm việc, dùng
   p10–p90, không dùng min–max (min–max bị kéo bởi 2 kỷ lục cận
   trên + 2 kỷ lục sàn).
4. **Mọi gap chứa lỗ mù đều là cận trên của thời gian reboot
   thật.** Nếu lỗ chứa reboot ẩn, gap quan sát sẽ tách thành 2+
   gap ngắn hơn — phân phối quan sát **lệch dài** so với thực tế:
   trung vị thật ≤ 1h59'48", tần suất thật ≥ 1/2h07'33". Đừng
   dùng phân phối này để lập luận "máy đã yên X giờ nên sắp
   reboot" theo hướng ngược lại — dữ liệu không ủng hộ suy luận
   đó (không có bằng chứng hazard tăng theo uptime; 57% gap nằm
   gọn 90'–150' nhưng đuôi dài tới 5h43' vẫn xuất hiện).
5. **Quy tắc vận hành thay cho dự báo:** không lên lịch theo bất
   kỳ con số nào ở trên. Mỗi lượt spawn đọc `uptime -s` trực
   tiếp; giữ poller chạy trong suốt đợt (mẫu I9: 10 poll đã đóng
   trực tiếp 1h30'37" của mù #26); đề xuất cron riêng 10 phút
   vẫn là cách duy nhất để lấp lỗ giữa các đợt (xem §5 mục 5).
6. **#35 — chỉ dải cơ học, không điểm:** áp dải chứng nhận lên
   #34 (20:34:17Z) → **[20:53:24Z, 23:48:25Z]**; p10–p90 toàn
   chuỗi → [21:19'Z, 23:42'Z]. Ghi rõ: đây là phép áp dải máy
   móc, không phải dự báo — và dải đã bị vượt 2 lần trước đây
   bởi các gap chưa chứng nhận, nên #35 hoàn toàn có thể rơi
   ngoài dải nếu nó cũng chứa lỗ mù.

#### 2.5.6 Giới hạn của mô hình mới (ghi rõ)

- n=28 nhỏ; 6/28 gap là approx (điểm giữa ±1'–5'); 3/28 là cận
  trên (trong đó #31 → #32 = 3h05'12" vẫn nằm dưới trần chứng
  nhận nên không ảnh hưởng max).
- Số thứ tự #32/#33/#34 là tạm thời (mù #24 + mù #26 chưa đóng);
  nếu lỗ chứa reboot ẩn, cả chuỗi dịch số và một số gap tách đôi
  — phân phối sẽ phải tính lại.
- Không kiểm tra hazard theo uptime, theo giờ trong ngày, hay
  theo tải — n quá nhỏ và dữ liệu tải theo reboot không đủ để
  kết luận; không đưa các yếu tố đó vào mô hình.
- Dải chứng nhận [19'07", 3h14'08"] có thể bị phá lần nữa bởi
  chính một gap đơn đã chứng nhận trong tương lai (sàn đã bị phá
  2 lần: 1h11'36" → 31'47" → 19'07") — khi đó tính lại dải, đừng
  coi dải cũ là bất biến.

### 2.6 Quét writeFileSync (snapshot 20:46:04–20:46:48Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round108-j8`. Tính lại từ file wfs-*.txt + files-*.bin gốc, khớp
100% scan-meta.txt:

- Chuẩn mới: **540 dòng / 166 file** (phạm vi 2752 file).
  I7: 506 dòng / 158 file (phạm vi 2732 file).
- R7b (đối chiếu): **565 dòng / 183 file**. I7: 531 / 175.
- Copies: **25 dòng / 17 file** — y hệt I7, H7, G8 và F7.
- Đối chiếu chéo 540+25=565=R7b, **chênh 0 — lần thứ mười bốn
  liên tiếp**. Tổng hit trên cả 3 bảng: 540+565+25 = **1.130 dòng**.
- **+34 dòng / +8 file so với I7, giải thích đúng hết bằng diff
  hit list** (không có dòng nào tăng trong file cũ ngoài
  GAP_ANALYSIS, không file nào giảm):
  - +6 `apps/web/scripts/probe107i4-frame-parity.mjs` (I4 đợt 107
    — file mới)
  - +5 `apps/web/scripts/probe107i8-frame-parity.mjs` (I8 đợt 107
    — file mới)
  - +6 `apps/web/scripts/probe108j3-frame-parity.mjs` (J3 đợt 108
    — file mới, sibling đang chạy)
  - +5 `apps/web/scripts/probe108j4-frame-parity.mjs` (J4 đợt 108
    — file mới, sibling đang chạy)
  - +5 `apps/web/scripts/probe108j5-frame-parity.mjs` (J5 đợt 108
    — file mới, sibling đang chạy)
  - +3 `docs/PHASE9_ROUND107_I7_EPERM_LIMITS.md` (file LIMITS của
    chính I7 — 17:48:57Z, sau snapshot I7 17:43:41Z)
  - +2 `docs/PHASE9_ROUND107_I9_VERIFY_LIMITS.md` (I9, 19:08:19Z)
  - +1 `docs/PHASE9_ROUND107_LIMITS.md` (closing, 19:14:10Z)
  - +1 `PHASE9_GAP_ANALYSIS.md` (16 → 17 — mục tóm tắt đợt 107
    mới thêm, 19:14:29Z)
  - Tổng: 6+5+6+5+5+3+2+1+1 = **34** ✓, 8 file mới ✓ (diff R7b y
    hệt NEWSTD — vì các file mới không nằm trong release*/build*/
    assets)
- **0 file biến mất khỏi hit list** (chỉ GAP_ANALYSIS đổi số đếm
  16 → 17).
- Scope: **+21 file mới / −1 file** so với I7 (2752 = 2732+21−1
  ✓): 21 file mới = 8 file hit trên + 13 file không hit
  (`gen107i8-stripes-code.py`, `i3_minprobe_107.mjs`,
  `i3_minprobe2_107.mjs`, `webkit_blob_flaky_107i3_diag.mjs`,
  `webkit_blob_flaky_108j2_2mib.mjs`, `vite.config.j6-temp.ts` —
  file tạm của J6 đợt 108, như F3-temp/i1-temp trước đây, có thể
  biến mất ở lượt sau — + 7 LIMITS đợt 107 I1/I2/I3/I4/I5/I6/I8);
  1 file biến mất khỏi scope là `apps/web/vite.config.i1-temp.ts`
  — file tạm của I1 (I7 đã dự báo có thể biến mất). Comm hai chiều
  khớp đúng.
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt I7 — xem files-copies.txt).
- **Race trong cửa sổ scan (ghi rõ, không giấu):**
  `probe108j3-frame-parity.mjs` hạ cánh 20:46:09Z — ĐÚNG GIỮA cửa
  sổ scan 20:46:04–20:46:48Z (sibling J3 đang chạy). Đếm lại trực
  tiếp sau scan: file có đúng 6 dòng `writeFileSync`, khớp số
  trong wfs-newstd.txt — không hỏng số đếm. Các file đợt 108 còn
  lại (probe108j4 20:40:45Z, probe108j5 20:41:58Z,
  webkit_blob_flaky_108j2 20:43:23Z, vite.config.j6-temp.ts
  20:44:39Z) đều hạ cánh trước khi scan bắt đầu. Sibling đợt 108
  vẫn đang chạy nên lượt sau cần đối chiếu lại.

### 2.7 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2752 file), NUL-safe, chạy từ trong repo-1 — các hit trong file
`.md` đều là trích dẫn trong LIMITS cũ (33 file chứa mẫu, y hệt
I7); **chỉ đúng 2 hit trong code**:

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z). Kết luận giữ nguyên
như I7: **2 async call site, cả 2 đều thuộc helper retry đã biết
với cùng hợp đồng EPERM-only + verify byte — không phải write
async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

4 mẫu MemAvailable của lượt: **1.586.040 kB (20:40:15Z) /
1.521.996 kB (20:40:22Z) / 1.585.516 kB (20:40:28Z) / 1.508.644 kB
(20:40:34Z)** — ~1,55 / 1,49 / 1,55 / 1,47 GB, lúc đợt 108 vừa
spawn (20:35:51Z), tải chưa lên, trên boot mới (reboot #34 vừa
xóa bộ nhớ). Mức này bằng **~25% ngưỡng guard 6144 MB** — cao hơn
nhiều so với 3 mẫu của I7 (~0,45 GB, lúc đợt 107 vừa spawn trên
boot cũ đã chạy 2h49'), vì boot mới chưa tích tải. Max RAM biết
được trong mù #26 là **2.965.144 kB** (I2 check 3, 17:49:22Z, lúc
sibling I1 thoát) = **48% ngưỡng guard**; không mẫu nào trong mù
#26 tiến gần ngưỡng. Birefnet KHÔNG chạy, đúng quy tắc parent
đợt 92 §3 mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ
MỨC; chạm ≥ 6 GB mới thử lại). Birefnet-general vẫn **0 lần chạy
thành công** trong gói.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Log probe v2 chỉ ghi bước nhảy ròng, không phải toàn bộ
   reboot** (mới, lượt này — xem §2.5.4): 3 reboot đã biết
   (~15:29Z 11/11, #16, #30) hoàn toàn vắng mặt trong log probe
   v2 — probe nhảy thẳng qua boot trung gian. Đừng bao giờ đếm
   reboot chỉ bằng `grep "boot changed"` trên log probe; chuỗi
   đánh số chính thức nằm trong các file LIMITS EPERM theo đợt,
   không nằm trong log probe.
2. **"Trần" chỉ có nghĩa khi ghi rõ tập gap** (mới, lượt này —
   xem §2.5.4): trần 3h14'08" chỉ đúng trên gap #14–#33; trên
   toàn chuỗi đã có 2 gap vượt trần (đều là cận trên). Khi trần
   đổi, kiểm tra lại các mù đã đóng bằng trần cũ — như H7 đã làm
   cho #22/#23 với sàn mới.
3. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
   bằng sàn** (H7 §4 mục 1, nhắc lại): sàn 19'07" vẫn đứng sau
   lượt này (#34 chưa phá sàn — gap #33 → #34 dài, không ngắn),
   nhưng lỗ mù #26 cho thấy sàn không giúp gì khi lỗ > 2 × sàn.
4. **Với file log append của tiến trình chạy nền, phải đọc nội
   dung, không chỉ đếm mtime** (I7 §4 mục 1, nhắc lại): lỗ mtime
   37'04" trong đoạn poller (17:59:59Z → 18:37:03Z) được lấp bằng
   nội dung poll.log (poll 5–6); ngược lại, lỗ 1h13'58" không lấp
   được bằng bất kỳ nội dung nào vì không còn tiến trình nào ghi.
5. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
   poller/watcher** (H7 §4 mục 2, nhắc lại): trong lỗ mù #26,
   toàn ~/workspace ngoài hai cây chỉ có 1 exec-log ở biên lỗ
   (19:20:19.152Z) — write đơn lẻ của job ngắn, không dùng làm
   bằng chứng loại trừ.
6. **Khoảng trống giữa đóng băng đợt cũ và spawn đợt mới là lỗ mù
   hệ thống** (H7 §4 mục 3, nhắc lại với bằng chứng mới): đợt 107
   đóng băng ~19:19Z, đợt 108 spawn 20:35:51Z — lỗ 1h13'58" này
   là lần thứ hai liên tiếp lỗ giữa-đợt nuốt mất khả năng đóng mù
   (sau mù #24). Đây chính là lý do đề xuất cron riêng 10 phút
   vẫn đứng (xem §5 mục 5).
7. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4 mục
   4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu đủ 2
   vị trí đã biết trước khi kết luận.
8. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8, nhắc lại):** lượt này 4 dòng "đã tắt" trong mù #26
   đều là dương tính giả (2 cặp launcher); 0 dòng "vẫn bật", 0
   "Operation not permitted" thật.
9. **Lưu sớm** (nhắc lại H7 §4 mục 8 / I7 §4 mục 9): lượt này
   probe + quét xong là ghi LIMITS/batch ngay, không đợi luồng
   khác — reboot #35 có thể cắt ngang bất cứ lúc nào (dải cơ học
   mở tới 23:48:25Z).
10. **Đếm *.log sóng EPERM phải quét cả hai cây** (mới, lượt này):
    lần quét đầu chỉ quét repo-1 trả về 0 file — vì log đợt này
    nằm ở hidden_files (88 file), không phải repo-1. I7 đếm 78
    file trên cả hai cây; lượt này 88 file cũng trên cả hai cây
    (0 repo-1 + 88 hidden_files). Quét một cây sẽ kết luận sai
    là "không có log".

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #26 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** lỗ 1h13'58" (19:20:19Z → 20:34:17Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#34), có thể nhiều hơn
   — không xác định được; số thứ tự #34 là TẠM THỜI (cộng dồn
   tính tạm thời từ mù #24). Không còn dữ liệu nào để thu hẹp
   thêm — parent/user quyết xem có chấp nhận "ít nhất 1 reboot,
   có thể nhiều hơn" làm mức đóng của mù #26 hay để mở như mù
   #24. J8 không tự quyết. Probe #28 không đóng được mù #26 hồi
   tố.
2. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1): lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#32), có thể nhiều hơn
   — không xác định được; số thứ tự #32/#33/#34 là TẠM THỜI.
   Không còn dữ liệu nào để thu hẹp thêm — parent/user quyết.
   J8 không tự quyết.
3. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
   gian. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết. J8 không tự quyết.
4. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
   §6 mục 3): cửa sổ lý thuyết ≤78 s với sàn 19'07". J8 không thử
   lại, không tự quyết — parent/user quyết giữ "đóng", "đóng có
   điều kiện", hay mở lại. **Khoảng mù #23 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận G8). **Khoảng mù #25 VẪN ĐÓNG HOÀN TOÀN**
   (không đổi kết luận I7 — việc #34 rơi vào 20:34:17Z không ảnh
   hưởng mù #25 vì mù đó đóng trước 17:40:22Z).
5. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3,
   F7 §6 mục 4, G8 §6 mục 5, H7 §6 mục 5, I7 §5 mục 6): lệnh cron
   chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). J8 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới: mù #26 dài 3h00'06" chứa một
   lỗ 1h13'58" không observer nào — lỗ giữa-đợt thứ hai liên tiếp
   nuốt mất khả năng đóng mù; không có observer thường trực thì
   lỗ này sẽ lặp lại mỗi đợt.
6. **Mô hình dự báo điểm ĐÃ BỎ (mới, lượt này — xem §2.5):** không
   đưa dự báo điểm cho #35 hay reboot nào sau đó; thay bằng dải
   chứng nhận [19'07", 3h14'08"] + p10–p90 thực nghiệm + đo uptime
   trực tiếp + poller. Các lượt sau KHÔNG dùng lại điểm H7
   (~16:51:58Z cho #34 — đã sai +3h42') hay trung bình ~2h01'/
   ~2h07' làm điểm dự báo. Nếu parent/user muốn một điểm duy
   nhất để lên lịch, câu trả lời trung thực là: dữ liệu không
   ủng hộ điểm nào — MAE/trung vị = 1,05.
7. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
   và các lượt sau; log tăng đúng 3 dòng checklist, 70 → 73 —
   không thêm dòng lạ mới trong lượt này.)
8. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
9. **VM reboot ~1 lần / 2h07'33"** (34 lần/~72h16'07", số thứ tự
   tạm thời — xem §2.3 + §2.5.5): mọi probe nền đều chết theo
   reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục bằng 1 mẫu mới. Reboot #35 chỉ có dải cơ học
   [20:53:24Z, 23:48:25Z] (xem §2.5.5 mục 6) — không điểm.
10. **Birefnet: KHÔNG chạy trong lượt này** — RAM 4 mẫu MemAvailable
    **1.586.040 / 1.521.996 / 1.585.516 / 1.508.644 kB** (~1,55 /
    1,49 / 1,55 / 1,47 GB); max RAM biết được trong mù #26 là
    2.965.144 kB (48% guard 6144 MB). Birefnet-general vẫn 0 lần
    chạy thành công trong gói.
11. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
12. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
13. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    J8 không thử lại nguồn nào, theo đúng lệnh.
14. **Khoảng mù #27 bắt đầu từ 20:40:28Z** (probe #27) — lượt sau
    (probe #28) đối chiếu từ mốc này, trên boot cc460738 (#34,
    từ 20:34:17Z, số thứ tự tạm thời). Reboot #35 chỉ có dải cơ
    học [20:53:24Z, 23:48:25Z], không điểm (xem §2.5.5 mục 6).
15. **Đính chính tiền đề lượt này (ghi để parent sửa hồ sơ):**
    tiền đề ghi "Reboot #34 = 2026-11-13 20:34:17Z (chốt bằng
    `uptime -s` trực tiếp lúc 20:36:52Z…)" — **giờ đúng, J8 xác
    nhận độc lập** bằng 2 phép đo trực tiếp lúc 20:40:15Z và
    20:40:34Z + journal/wtmp; **số thứ tự #34 là TẠM THỜI**
    (xem §2.3), không phải số chốt. Tiền đề ghi "mù #26 bắt đầu
    17:40:22Z (probe #26)" — **đúng**. Tiền đề ghi "file
    `eperm-now.txt` … KHÔNG phải checklist P8 §2.3" — **đúng,
    J8 xác nhận lại**: file vẫn chỉ chứa `x` + newline.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND108_J8_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round108-j8-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round108-j8/`
(probe-notes.txt, scan-meta.txt, scan-wfs.sh, files-newstd.bin,
wfs-newstd.txt, files-r7b.bin, wfs-r7b.txt, files-copies.txt,
wfs-copies.txt, scope-new-files.txt, scope-gone-files.txt,
async-writefile.txt, blind26-logfiles.txt, blind26-logfiles-repo.txt,
blind26-logfiles-hf.txt, blind26-wave-hits.txt) + log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

Tổng chờ push: chưa đếm lại trong lượt này (sibling đợt 108 vẫn
đang chạy; parent đếm lại khi đợt 108 đóng băng).
