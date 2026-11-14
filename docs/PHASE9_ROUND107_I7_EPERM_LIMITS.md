# PHASE9 ROUND107 I7 — EPERM: probe #26 + khoảng mù #25 ĐÓNG HOÀN TOÀN

> Luồng I7, đợt 107 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07,
> 14/11/2026; làm việc ~17:40–17:47Z 13/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù
> #25 kể từ probe #25 (14:39:40Z 13/11) + quét writeFileSync theo chuẩn
> mới (đối chiếu snapshot H7 đợt 106) + ghi RAM hiện tại (birefnet:
> KHÔNG chạy — vẫn dưới ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #22, mù #21, hay reboot #16**
> — chỉ báo cáo "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 17:40:18Z
  báo **DEAD/STALE** (heartbeat age 10.838 s, last #25 14:39:40Z,
  boot 75697729, exit 1); `once` ngay sau đó là **probe #26, boot
  63a52041, ok=2 fail=0**, exit 0; `status` chạy lại **ALIVE**
  (age 11 s, n=26), exit 0. Log v2 tăng đúng 3 dòng (67 → 70);
  heartbeat nay n=26, ts 17:40:22Z, boot 63a52041-…
- **Reboot #34 CHƯA xảy ra lúc probe #26:** boot vẫn 63a52041 từ
  14:50:59Z (uptime 2h49'23" lúc 17:40:22Z). Dự báo điểm của H7
  (#34 ~16:51:58Z) **SAI theo hướng muộn ít nhất +48'24"** và vẫn
  đang lệch; dải H7 (15:10:06Z–18:05:07Z) vẫn còn mở tới 18:05:07Z.
- **Khoảng mù #25: 14:39:40Z → 17:40:22Z (3h00'42") — ĐÓNG HOÀN
  TOÀN (mới, lượt này).** Đúng **1 reboot trong mù (#33,
  14:50:59Z, đã chốt từ trước)**. Đóng bằng **loại trừ trực tiếp
  (uptime + poller chạy nền)**, không bằng sàn: đoạn trước #33
  (11'19") được kẹp bởi probe #25 + 2 poll của H9 trên cùng boot
  75697729; đoạn sau #33 (2h49'23") được chứng minh liên tục bởi
  `uptime -s` = 14:50:59Z đo trực tiếp lúc probe #26 + poller H9
  (9 poll, 14:52:45Z → 16:12:47Z, cùng boot 63a52041, uptime tăng
  đơn điệu). Đây là mù đầu tiên đóng hoàn toàn kể từ mù #23 (mù
  #24 không đóng được).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong 78
  file *.log có mtime trong mù #25; 6 dòng "sóng EPERM đã tắt" đều
  là **dương tính giả đã biết** (dòng launcher in khi lần ghi thử
  đầu thành công). Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) —
  ~53h29' trước probe #26. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 506 dòng / 158 file** (phạm vi
  2732 file); R7b đối chiếu 531 dòng / 175 file; copies 25 dòng /
  17 file; đối chiếu chéo 506+25=531=R7b, **chênh 0 — lần thứ mười
  ba liên tiếp**. +12 dòng / +4 file so với H7, giải thích đúng
  hết bằng diff. 0 file biến mất khỏi hit list. Async
  `.writeFile(`: vẫn đúng **2 vị trí, cả hai trong helper retry đã
  biết** — 0 stray (xem §2.6).
- RAM 3 mẫu của lượt: **467.932 / 461.620 / 454.240 kB** (~0,46 /
  0,45 / 0,44 GB) — ~7,4% ngưỡng guard; birefnet KHÔNG chạy, vẫn
  0 lần chạy thành công trong gói. Reboot #16 VẪN MỞ (kẹp ~4',
  chờ parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.
- **Dự báo #34 vẫn đang chờ** (dải tới 18:05:07Z); **dự báo #35
  có điều kiện** (xem §2.5): nếu #34 rơi vào trần 18:05:07Z thì
  #35 ~20:06:07Z, dải 18:24:14Z–21:19:15Z. Độ tin cậy dự báo điểm
  thấp: 3 lượt liên tiếp lệch hơn 48 phút (xem §2.5).

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 17:40:11–17:40:18Z | boot_id `63a52041-cdb6-4824-bb17-32c8f5aba5ee`; `who -b` Nov 13 14:51; `uptime -s` **2026-11-13 14:50:59Z** (uptime ~2h49'); journal chỉ 1 boot (63a52041, first entry 14:51:13Z, last 17:45:36Z lúc kiểm tra); `last -x reboot` 14:51 still running; wtmp bắt đầu 14:51:12Z — khớp đo của H7 late-merge lúc 16:28:03Z, boot không đổi |
| `bash scripts/probe-eperm-v2.sh status` | 17:40:18Z | **DEAD/STALE**, exit 1 — heartbeat n=25, ts 14:39:40Z, boot 75697729, age **10.838 s**; last sample probe #25; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 17:40:22Z | **probe #26, boot=63a52041, ok=2 fail=0**, exit 0; dòng `boot changed 75697729 -> 63a52041` (uptime since 2026-11-13 14:50:59) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~17:40:33Z | **ALIVE**, age 11 s, n=26, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 70 dòng, trước lượt 67 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=26, ts
17:40:22Z, pid=29641, boot 63a52041-cdb6-4824-bb17-32c8f5aba5ee).

Lưu ý: file `eperm-now.txt` ở repo root (tiền đề lượt này gọi là
"checklist probe P8 §2.3") thực tế chỉ chứa một ký tự `x` — không
phải checklist. Lượt này làm theo checklist như đã ghi trong H7 §1
(status → once → status, log +3 dòng, DEAD → once → ALIVE), khớp
mẫu mọi lượt trước. Ghi để parent kiểm tra/xóa file `x` đó nếu là
file rác.

## 2. Điều tra khoảng mù #25 (14:39:40Z → 17:40:22Z, 3h00'42")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #26: `uptime -s` = **2026-11-13 14:50:59Z**,
  boot_id `63a52041-cdb6-4824-bb17-32c8f5aba5ee` — khác boot của
  probe #25 (75697729).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (lúc ~17:45Z): chỉ **1 boot** (hiện
  tại, 63a52041, first entry 14:51:13Z, last 17:45:36Z).
  `last -x reboot`: chỉ 1 dòng (14:51, still running). wtmp bắt
  đầu 14:51:12Z. Journal/wtmp của boot 75697729 đã mất theo
  reboot #33 — như mọi lần trước, chỉ giữ boot hiện tại.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu.

### 2.2 Reboot duy nhất trong mù — #33, đã chốt từ trước

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 33 | **14:50:59Z (chính xác từng giây)** | 75697729 → 63a52041 | H7 late-merge đo trực tiếp lúc 16:28:03Z (`uptime -s` + `boot_id` + `who -b` + journal first entry 14:51:13Z); poller H9 restart 14:52:45Z ghi `boot=2026-11-13 14:50:59 (prev boot 14:31:52Z, gap ~19m)`; poll #2 của H9 lúc 14:50:20Z vẫn boot 14:31:52 (up 18 phút) — kẹp #33 vào (14:50:20Z, 14:52:45Z], khớp `uptime -s`. **Số thứ tự TẠM THỜI** — điều kiện: 0 reboot ẩn trong lỗ của mù #24 (xem H7 §2.3). |

Khoảng cách #32 → #33 = **19'07" — SÀN, ngắn nhất từng ghi**
(không đổi so với H7). Khoảng cách #33 → probe #26 = 2h49'23";
#34 chưa xảy ra lúc probe #26 (xem §2.5).

### 2.3 Hoạt động trong khoảng mù — vì sao ĐÓNG ĐƯỢC (khác mù #24)

Hoạt động ghi đĩa trong hai cây giám sát, chia làm ba đoạn bởi
#33 (14:50:59Z):

- **Đoạn TRƯỚC #33: 14:39:40Z → 14:50:59Z (11'19", boot
  75697729) — dày đặc + kẹp trực tiếp:**
  - repo-1 **6 file**: probe106h3-frame-parity 14:42:34Z,
    probe106h4-frame-parity 14:43:13Z, preview.tsx 14:43:56Z,
    webkit_blob_flaky_106h2_2mib.mjs 14:47:30Z,
    clicktest-77e1-deint-fps.mjs 14:48:01Z,
    webkit-blob-flaky-106h2-2mib.json 14:48:11Z.
  - hidden_files: H7 scan (14:43:44–14:46:45Z) + driver H1/H2/H3/
    H4/H5 chạy liên tục tới 14:50:03–14:50:49Z.
  - **Poller H9 là kẹp trực tiếp:** poll #1 14:40:20Z và poll #2
    14:50:20Z, cả hai cùng boot 14:31:52 (up 8' → 18') — một tiến
    trình duy nhất sống qua gần trọn đoạn, uptime tăng đơn điệu.
    Một reboot ẩn trong đoạn này phải giết poller (không — poll
    #2 vẫn chạy) và quay lại đúng boot_id 75697729 (không thể —
    boot_id ngẫu nhiên mỗi lần boot). Đoạn này đóng chắc chắn.
- **Đoạn SAU #33, khi còn observer: 14:50:59Z → 16:12:48Z
  (1h21'49", boot 63a52041) — poller H9 là kẹp trực tiếp:**
  - Poller restart 14:52:45Z sau #33, rồi **9 poll, mỗi 10 phút,
    tất cả cùng boot 14:50:59**: 14:52:45, 15:02:46, 15:12:46,
    15:22:46, 15:32:46, 15:42:47, 15:52:47, 16:02:47, 16:12:47Z
    (up 1' → 1h21'), kết thúc `POLL TIMEOUT after 9 polls
    16:12:48Z`. Một reboot ẩn trong đoạn này phải giết poller —
    không, nó poll đều suốt 1h20'.
  - Hoạt động driver dày tới ~15:20:53Z (H6 h6.md), rồi H9 verify
    16:16:33–16:24:06Z (sau khi poller dừng — xem đoạn đuôi).
  - Lưu ý phương pháp: khoảng trống mtime dài nhất trong đoạn
    này (15:20:53Z → 16:12:48Z, 51'55") **chỉ được lấp bằng NỘI
    DUNG poll.log** (các poll 15:22:46 → 16:12:47Z), không phải
    bằng mtime của file (poll.log chỉ có 1 mtime 16:12:48Z). Đếm
    mtime thô sẽ thấy một "lỗ" giả 51'55" — bài học cho các lượt
    sau: với file log append của tiến trình chạy nền, phải đọc
    nội dung, không chỉ đếm mtime.
- **Đuôi SAU observer cuối: 16:12:48Z → 17:40:22Z (1h27'34") —
  đóng bằng uptime đo trực tiếp, KHÔNG bằng sàn:**
  - Hoạt động: H9 verify + late merge H1–H4/H7 tới 16:37:34Z,
    repo LIMITS tới 16:45:59Z, U4 work 16:45:26–16:49:28Z,
    build-loop-log.md 16:49:28Z. Sau đó **không còn bản ghi nào
    trong hai cây tới probe #26 (16:49:28Z → 17:40:22Z,
    50'54")** — đuôi này, xét riêng bằng sàn, KHÔNG đóng được
    (50'54" > 2 × sàn mới 38'14").
  - Nhưng **uptime -s đo trực tiếp lúc probe #26 = 14:50:59Z**
    chứng minh máy up liên tục từ 14:50:59Z — mọi reboot trong
    (14:50:59Z, 17:40:22Z] đều sẽ đẩy `uptime -s` về sau
    14:50:59Z và đổi boot_id. Boot_id lúc probe (63a52041) cũng
    khớp đúng boot_id H7 đo lúc 16:28:03Z. Đuôi đóng bằng uptime,
    không cần observer.
  - Ngoài hai cây, trong đuôi chỉ có **3 file exec-log rời rạc
    của runtime** (workspace/agents/*/exec-logs/*.log) + chính
    build-loop-log.md ở biên 16:49:28Z — ghi rời rạc, không phải
    tiến trình chạy nền dài hạn, không dùng làm bằng chứng loại
    trừ (bài học H7 §4 mục 2). Spawn đợt 107 (cron 17:35:51Z)
    chưa để lại bản ghi nào trong hai cây tới 17:40:22Z — không
    ảnh hưởng kết luận vì uptime đã đóng đuôi.
  - dist: **0 file**; chrome-userdata: **0 file**; /tmp: **772
    file** trong mù (temp output đợt 106: vidstab/maskan .trf/
    .mkv, r106verify/*.out — mtime mới nhất ~14:41Z, trước #33;
    /tmp bị xóa theo reboot nên không dùng làm mốc).

Đếm cửa sổ (ảnh chụp tại thời điểm đo, xem H7 §4 mục 5): repo-1
**21 file** (không tính dist) có mtime trong mù #25; hidden_files
**242 file** (không tính chrome-userdata). Khoảng trống mtime dài
nhất gộp hai cây: 15:20:53Z → 16:12:48Z (51'55") — đã lấp bằng
nội dung poll.log (xem trên); khoảng trống dài thứ hai là đuôi
16:49:28Z → 17:40:22Z (50'54") — đã đóng bằng uptime.

**Kết luận: khoảng mù #25 ĐÓNG HOÀN TOÀN. Đúng 1 reboot trong
mù (#33, 14:50:59Z).** Khác mù #24 ở điểm quyết định: lỗ của mù
#24 nằm TRƯỚC reboot #32 (uptime của boot mới không với tới được
quá khứ trước #32), còn lỗ/đuôi của mù #25 nằm SAU reboot #33
(uptime của boot hiện tại phủ trọn từ 14:50:59Z tới probe #26),
và đoạn trước #33 thì có poller kẹp trực tiếp. Đây là mù đầu tiên
đóng hoàn toàn kể từ mù #23.

### 2.4 Sóng EPERM trong khoảng mù — tìm trong log đợt 106

Khoảng mù 14:39:40Z → 17:40:22Z (3h00'42") được phủ bởi các luồng
sibling đợt 106 (H1–H9, làm việc tới ~16:49Z) + spawn đợt 107
(17:35:51Z, chưa ghi gì trong hai cây tới lúc probe). Đã đọc lại
log thật (grep `sóng EPERM vẫn bật` / `CẢNH BÁO: chờ sóng` /
`Operation not permitted` / `sóng EPERM đã tắt` trên 78 file
*.log có mtime trong mù #25, trừ node_modules/dist/chrome-userdata):

| Nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| run-f5-hiram.log (round104-f5 + round106-h1, cùng nội dung) | 14:42:06Z + 14:43:14Z | 2 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết** (×2 file = 4 dòng) |
| round106-h9-o8.log | 16:21:50Z + 16:23:15Z | 2 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết** |
| Toàn bộ 78 log | toàn mù | "vẫn bật" 0 hit; "CẢNH BÁO" 0 hit; "Operation not permitted" 0 hit thật |

Tổng trong *.log có mtime trong mù #25: **6 dòng "đã tắt"** (3
cặp, đều mẫu launcher) + **0 dòng "vẫn bật", 0 "CẢNH BÁO", 0
"Operation not permitted" thật**.

**Đính chính dương tính giả (nhắc lại Y8 §4 mục 8, H7 §2.5):**
cả 6 dòng đều là dòng launcher "sóng EPERM đã tắt, khởi động
vite" in khi lần ghi thử ĐẦU TIÊN thành công ngay (code launcher
`waveOff=true` ở lần write đầu) — in mặc định cả khi không có
sóng. Bằng chứng phân biệt: **0 dòng "sóng EPERM vẫn bật sau …s
chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"** trong
toàn bộ 78 log; **0 lần "Operation not permitted" thật**.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". Đuôi 50'54" không observer (16:49:28Z → 17:40:22Z)
  đủ dài để chứa một sóng ~16 phút mà không để lại dấu vết nào
  trong hai cây — khác mù #24, đuôi này **không thể chứa reboot
  ẩn** (uptime đã đóng), nhưng **vẫn có thể chứa sóng ẩn** (sóng
  không giết tiến trình, không đổi boot). Mù #25 "mù" về sóng
  trong đuôi 50'54", dù đã đóng về reboot.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~53h29' trước
  probe #26 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG
  được tuyên bố là đã hết.
- Probe #26 ok=2 fail=0 là mẫu đơn lẻ — không chứng minh sóng đã
  hết, chỉ chứng minh lúc 17:40:22Z ghi được.

### 2.5 Dự báo reboot #34 (đang chờ) và #35 (có điều kiện)

Chuỗi đã chốt (giờ chính xác từng giây, trừ #16 kẹp ~4'): xem
bảng H7 §2.4 — không đổi từ H7 (không có reboot mới nào được
chốt trong lượt này). Sàn **19'07"** (#32 → #33), trần
**3h14'08"** (#26 → #27), trung bình **~2h01'00"/lần** (33 lần /
~66h32'49", cách đếm W7/X7 — số thứ tự tạm thời vì mù #24, xem
H7 §2.3).

- **Reboot #34: ĐANG CHỜ.** Dự báo điểm của H7 (~16:51:58Z =
  14:50:59Z + ~2h01') đã trượt: lúc probe #26 (17:40:22Z) máy
  vẫn trên boot 63a52041, **muộn hơn điểm dự báo ít nhất
  +48'24"** và vẫn đang lệch. Dải H7 (15:10:06Z–18:05:07Z) vẫn
  còn mở tới **18:05:07Z**; nếu #34 chưa xảy ra tới lúc đó thì
  cả dải sàn–trần cũng bị phá (gap #33 → #34 sẽ vượt trần
  3h14'08" — lần đầu tiên).
- **Reboot #35 (có điều kiện vào #34):** #35 ≈ #34 + ~2h01',
  dải #34+19'07" → #34+3h14'08". Nếu #34 rơi vào trần
  18:05:07Z thì **#35 ~20:06:07Z, dải 18:24:14Z–21:19:15Z**.
  Nếu #34 rơi sớm hơn, dịch toàn bộ dải theo.
- **Độ tin cậy dự báo điểm THẤP (ghi rõ):** 3 lượt liên tiếp dự
  báo điểm lệch lớn, ngược hướng nhau — F9 dự #31 ~12:59Z, thực
  tế 11:26:40Z (lệch −1h32', ngoài dải); G8 dự #32 ~13:28:49Z,
  thực tế 14:31:52Z (lệch +1h03'03", trong dải nhưng sát trần);
  H7 dự #34 ~16:51:58Z, tới 17:40:22Z chưa xảy ra (lệch ít nhất
  +48'24", vẫn đang tăng). Từ nay chỉ dùng dải làm mốc làm việc,
  đừng lên kế hoạch theo điểm.

### 2.6 Quét writeFileSync (snapshot 17:43:41–17:44:03Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round107-i7`. Tính lại từ file wfs-*.txt + files-*.bin gốc, khớp
100% scan-meta.txt:

- Chuẩn mới: **506 dòng / 158 file** (phạm vi 2732 file).
  H7: 494 dòng / 154 file (phạm vi 2716 file).
- R7b (đối chiếu): **531 dòng / 175 file**. H7: 519 / 171.
- Copies: **25 dòng / 17 file** — y hệt H7, G8 và F7.
- Đối chiếu chéo 506+25=531=R7b, **chênh 0 — lần thứ mười ba
  liên tiếp**. Tổng hit trên cả 3 bảng: 506+531+25 = **1.062 dòng**.
- **+12 dòng / +4 file so với H7, giải thích đúng hết bằng diff
  hit list** (không có dòng nào tăng trong file cũ ngoài
  GAP_ANALYSIS, không file nào giảm):
  - +5 `apps/web/scripts/probe107i5-frame-parity.mjs` (I5 đợt 107
    — file mới, sibling đang chạy)
  - +3 `docs/PHASE9_ROUND106_H7_EPERM_LIMITS.md` (file LIMITS của
    chính H7 — 16:37:34Z, sau snapshot H7 14:43:44Z)
  - +2 `docs/PHASE9_ROUND106_H9_VERIFY_LIMITS.md` (H9, 16:25:39Z)
  - +1 `docs/PHASE9_ROUND106_LIMITS.md` (closing, 16:45:59Z)
  - +1 `PHASE9_GAP_ANALYSIS.md` (15 → 16 — dòng 1370+, mục tóm
    tắt H7 mới thêm, 16:41:47Z)
  - Tổng: 5+3+2+1+1 = **12** ✓, 4 file mới ✓ (diff R7b y hệt
    NEWSTD — vì các file mới không nằm trong release*/build*/
    assets)
- **0 file biến mất khỏi hit list** (chỉ GAP_ANALYSIS đổi số đếm
  15 → 16).
- Scope: **+16 file / −0 file** so với H7 (2732 = 2716+16 ✓):
  16 file mới = 4 file hit trên + 12 file không hit
  (`analyze106h5-ghost.py`, `analyze106h5-ghost-flip.py`,
  `analyze-h2.py`, `webkit_blob_flaky_106h2_2mib.mjs`,
  `webkit_blob_flaky_107i3_2mib.mjs`,
  `vite.config.i1-temp.ts` — file tạm của I1 đợt 107, như
  F3-temp trước đây, có thể biến mất ở lượt sau — + 7 LIMITS
  đợt 106 H1/H2/H3/H4/H5/H6 + H7/H9/ROUND106 đã đếm trong 4
  file hit? — đếm lại: 9 LIMITS mới (H1, H2, H3, H4, H5, H6,
  H7, H9, ROUND106) trong đó 3 có hit (H7, H9, ROUND106) + 6
  không hit; 16 = 4 hit + 12 không hit (2 analyze ghost + 1
  analyze-h2 + 2 webkit mjs + 1 vite temp + 6 LIMITS không hit)
  ✓. Comm hai chiều khớp đúng.
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt H7 — xem files-copies.txt).
- Không có race giữa lúc scan: 0 file hạ cánh trong cửa sổ scan
  17:43:41–17:44:03Z (13/16 file mới có mtime ≤ 17:40:22Z; 3 file
  đợt 107 — probe107i5 17:41:49Z, vite.config.i1-temp.ts 17:41:55Z,
  webkit_blob_flaky_107i3_2mib.mjs 17:41:30Z — hạ cánh sau probe
  #26 nhưng trước khi scan bắt đầu; sibling đợt 107 vẫn đang chạy
  nên lượt sau cần đối chiếu lại).

### 2.7 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2732 file), NUL-safe, chạy từ trong repo-1 — các hit trong file
`.md` đều là trích dẫn trong LIMITS cũ (33 file chứa mẫu, gồm cả
.md); **chỉ đúng 2 hit trong code**:

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z). Kết luận giữ nguyên
như H7: **2 async call site, cả 2 đều thuộc helper retry đã biết
với cùng hợp đồng EPERM-only + verify byte — không phải write
async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

3 mẫu MemAvailable của lượt: **467.932 kB (17:40:11Z) /
461.620 kB (17:40:18Z) / 454.240 kB (17:40:22Z)** — ~0,46 / 0,45
/ 0,44 GB, lúc đợt 107 vừa spawn (17:35:51Z), tải chưa lên. Mức
này bằng **~7,4% ngưỡng guard 6144 MB**; không có mẫu nào trong
mù #25 tiến gần ngưỡng (mẫu cao nhất biết được trong mù #24 là
1.326 MB, vẫn chỉ 21,6% guard). Birefnet KHÔNG chạy, đúng quy
tắc parent đợt 92 §3 mục 7 (chỉ thử lại khi RAM đổi theo hướng có
lợi ĐỦ MỨC; chạm ≥ 6 GB mới thử lại). Birefnet-general vẫn **0
lần chạy thành công** trong gói.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Với file log append của tiến trình chạy nền, phải đọc nội
   dung, không chỉ đếm mtime** (mới, lượt này — xem §2.3): mtime
   thô của poll.log (16:12:48Z) tạo ra một "lỗ" giả 51'55"
   (15:20:53Z → 16:12:48Z); nội dung mới cho thấy 6 poll đều
   đặn mỗi 10 phút trong lỗ đó, cùng boot. Đếm mtime mà không
   đọc nội dung sẽ kết luận sai là "không có observer".
2. **Uptime đo trực tiếp tại probe đóng được đuôi không-observer
   sau reboot cuối** (mới, lượt này — xem §2.3): đuôi mù #25
   (50'54", không bản ghi nào) vẫn đóng được vì `uptime -s` tại
   probe #26 chứng minh uptime liên tục từ 14:50:59Z. Đây là
   loại trừ trực tiếp mạnh nhất — mạnh hơn sàn, mạnh hơn mật độ
   mtime. Ngược lại, lỗ TRƯỚC reboot cuối (như mù #24) thì
   uptime không với tới được — phân biệt hai trường hợp này khi
   kết luận đóng/không đóng.
3. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
   bằng sàn** (H7 §4 mục 1, nhắc lại): sàn 19'07" vẫn đứng sau
   lượt này (#34 chưa xảy ra), nhưng dải H7 có thể bị phá nếu
   #34 vượt 18:05:07Z (gap > trần 3h14'08" — lần đầu tiên). Khi
   sàn/trần đổi, kiểm tra lại các mù đã đóng bằng sàn cũ.
4. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
   poller/watcher** (H7 §4 mục 2, nhắc lại): 3 exec-log trong
   đuôi mù #25 là write đơn lẻ của các job ngắn — không dùng làm
   bằng chứng loại trừ; lượt này đóng đuôi bằng uptime, không
   bằng các file đó.
5. **Số đếm find trong cửa sổ là ảnh chụp tại thời điểm đo, không
   phải con số bền** (F7 §5 mục 2, nhắc lại): lượt này đếm
   repo-1 21 file / hidden_files 242 file trong mù #25 — mốc
   hoạt động bền là file nguồn (.md/.ts/.mjs/.log), không phải
   output build. Sibling đợt 107 đang chạy nên số đếm sẽ đổi ở
   lượt sau.
6. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (H7 §4
   mục 4, nhắc lại): lượt này quét async từ đúng cwd, đối chiếu
   đủ 2 vị trí đã biết trước khi kết luận.
7. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8, nhắc lại):** lượt này 6 dòng "đã tắt" trong mù #25
   đều là dương tính giả (3 cặp launcher); 0 dòng "vẫn bật", 0
   "Operation not permitted" thật.
8. **Dự báo điểm reboot có độ tin cậy thấp — chỉ dùng dải** (mới,
   lượt này — xem §2.5): 3 lượt liên tiếp lệch > 48 phút, ngược
   hướng nhau. Đừng lên kế hoạch theo điểm; dải sàn–trần mới là
   mốc làm việc.
9. **Lưu sớm** (nhắc lại H7 §4 mục 8): lượt này probe + quét
   xong là ghi LIMITS/batch ngay, không đợi luồng khác — reboot
   #34 có thể cắt ngang bất cứ lúc nào (dải còn mở tới
   18:05:07Z).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #25 ĐÓNG HOÀN TOÀN (mới, lượt này, xem §2.3):**
   đúng 1 reboot (#33, 14:50:59Z); đóng bằng loại trừ trực tiếp
   (poller H9 + uptime -s), không bằng sàn. Đuôi 50'54" không
   observer vẫn **mù về sóng** (có thể chứa sóng ~16 phút mà
   không để lại dấu vết) — đóng về reboot, không đóng về sóng.
2. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (H7 §6 mục
   1): lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#32), có thể nhiều hơn
   — không xác định được; số thứ tự #32/#33 là TẠM THỜI. Không
   còn dữ liệu nào để thu hẹp thêm — parent/user quyết xem có
   chấp nhận "ít nhất 1 reboot, có thể nhiều hơn" làm mức đóng
   của mù #24 hay để mở như mù #21. I7 không tự quyết. Probe #26
   không đóng được mù #24 hồi tố (xem H7 §2.3).
3. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot
   trung gian. Không còn dữ liệu nào để thu hẹp thêm — parent/
   user quyết. I7 không tự quyết.
4. **Khoảng mù #22 ĐÃ ĐÓNG — MỨC TIN CẬY HẠ, KHÔNG ĐỔI** (H7 §2.8,
   §6 mục 3): cửa sổ lý thuyết ≤78 s với sàn mới 19'07". I7
   không thử lại, không tự quyết — parent/user quyết giữ "đóng",
   "đóng có điều kiện", hay mở lại. **Khoảng mù #23 VẪN ĐÓNG
   HOÀN TOÀN** (không đổi kết luận G8).
5. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #26 OK 2/2) + đuôi mù 50'54" không có bản ghi về
   sóng. Sóng gần nhất: ~11:55–12:11Z, ~53h29' trước probe #26.
6. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3
   mục 8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6
   §5 mục 2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2,
   A8 §5 mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục
   3, F7 §6 mục 4, G8 §6 mục 5, H7 §6 mục 5): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). I7 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới: đuôi mù #25 dài 50'54" không
   observer nào — và reboot #34 đang chờ vẫn chưa được ghi nhận
   ngoài probe tay lúc 17:40:22Z.
7. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
   và các lượt sau; log tăng đúng 3 dòng checklist, 67 → 70 —
   không thêm dòng lạ mới trong lượt này.)
8. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
9. **VM reboot ~2h01'/lần** (33 lần/~66h32'49", số thứ tự tạm thời
   — xem H7 §2.3): mọi probe nền đều chết theo reboot; v2 chỉ đảm
   bảo cái chết được ghi nhận + lượt sau hồi phục. Reboot #34 đang
   chờ (dải H7 tới 18:05:07Z); #35 có điều kiện (xem §2.5).
10. **Birefnet: KHÔNG chạy trong lượt này** — RAM 3 mẫu
    MemAvailable **467.932 / 461.620 / 454.240 kB** (~0,46 / 0,45
    / 0,44 GB); không mẫu nào tiến gần guard 6144 MB.
    Birefnet-general vẫn 0 lần chạy thành công trong gói.
11. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
12. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
13. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    I7 không thử lại nguồn nào, theo đúng lệnh.
14. **Khoảng mù #26 bắt đầu từ 17:40:22Z** (probe #26) — lượt sau
    (probe #27) đối chiếu từ mốc này, trên boot 63a52041 (#33,
    từ 14:50:59Z, số thứ tự tạm thời). Reboot #34 đang chờ (dải
    tới 18:05:07Z); nếu #34 xảy ra sau 18:05:07Z thì cả dải
    sàn–trần bị phá lần đầu — lượt sau ghi rõ.
15. **Đính chính tiền đề lượt này (ghi để parent sửa hồ sơ):**
    tiền đề ghi "dự báo #34 ~16:51:58Z (dải 15:10:06Z–18:05:07Z)
    — hiện đã 17:35Z+ mà boot vẫn 63a52041" — **đúng**: lúc probe
    #26 (17:40:22Z) boot vẫn 63a52041, #34 chưa xảy ra; điểm dự
    báo đã trượt ít nhất +48'24". Tiền đề ghi "mù #22 cửa sổ lý
    thuyết ≤78s" — **đúng, không đổi** (H7 §2.8). Tiền đề ghi
    "file eperm-now.txt (checklist probe P8 §2.3)" — **sai mô tả**:
    file chỉ chứa ký tự `x`, không phải checklist (xem §1).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND107_I7_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round107-i7-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round107-i7/`
(probe-notes.txt, scan-meta.txt, scan-wfs.sh, files-newstd.bin,
wfs-newstd.txt, files-r7b.bin, wfs-r7b.txt, files-copies.txt,
wfs-copies.txt) + log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

Tổng chờ push: chưa đếm lại trong lượt này (sibling đợt 107 vẫn
đang chạy; H9 đợt 106 đếm lần cuối ~16:35Z: 395 batch / 2511 entry
/ 1539 file duy nhất sau khi stage H7 — xem H7 §7; parent đếm lại
khi đợt 107 đóng băng).
