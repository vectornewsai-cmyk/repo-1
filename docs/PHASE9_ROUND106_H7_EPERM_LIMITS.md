# PHASE9 ROUND106 H7 — EPERM: probe #25 + khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN (late merge)

> Luồng H7-muộn (late merge), đợt 106 vòng lặp Phase 9 VCut Studio (lượt
> cron 21:35 +07, 13/11/2026; H7 gốc làm việc ~14:39–14:46Z 13/11/2026).
> Nhiệm vụ: checklist probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù
> #24 kể từ probe #24 (11:38:22Z 13/11) + quét writeFileSync theo chuẩn
> mới (đối chiếu snapshot G8 đợt 105) + ghi RAM hiện tại (birefnet:
> KHÔNG chạy — vẫn dưới ngưỡng guard, xem §3).
> **LATE MERGE:** H7 gốc bị **reboot #33 (14:50:59Z)** cắt ngang TRƯỚC
> KHI viết LIMITS/batch, nhưng dữ liệu thô ĐÃ CÓ trên đĩa
> (`hidden_files/round106-h7/`: probe-notes.txt, scan-meta.txt,
> scan-wfs.sh, wfs-*.txt, files-*.bin/txt). File này được viết lại
> HOÀN TOÀN từ dữ liệu thô đó — mọi số đều tính lại độc lập, không
> copy mù headline của H9 (chỉ dùng làm đối chiếu, xem §2.9).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự đóng mù #22, mù #21, hay reboot #16**
> — chỉ báo cáo "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (H7 gốc):** `status` lúc
  14:39:40Z báo **DEAD/STALE** (heartbeat age 10.878 s, last #24
  11:38:22Z, boot 3e4f237a, exit 1); `once` ngay sau đó là **probe
  #25, boot 75697729 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=25), exit 0. Log v2 tăng đúng 3 dòng (64 →
  67); heartbeat nay n=25, ts 14:39:40Z, boot 75697729-…
- **Reboot #32 = 14:31:52Z** (3e4f237a → 75697729), chốt từng giây
  bằng `uptime -s` + `boot_id` đo trực tiếp lúc 14:39:33Z và xác nhận
  lại 14:39:40Z. **Số thứ tự #32 là TẠM THỜI** — điều kiện: 0 reboot
  ẩn trong lỗ của mù #24 (xem §2.3).
- **Reboot #33 = 14:50:59Z** (75697729 → 63a52041) — xảy ra SAU probe
  #25, cắt ngang H7 gốc. Gap #32 → #33 = **19'07" — SÀN MỚI, ngắn
  nhất từng ghi**, phá sàn cũ 31'47" (#30 → #31). Chốt bằng lệnh
  status bổ sung của lượt late-merge này (16:28:03Z, boot hiện tại
  63a52041) + poller H9 restart 14:52:45Z (xem §2.2).
- **Khoảng mù #24: 11:38:22Z → 14:39:40Z (3h01'18") — KHÔNG ĐÓNG
  HOÀN TOÀN (mới, lượt này).** Lỗ không-bản-ghi **2h03'11"**
  (12:28:41Z → 14:31:52Z) trong cả hai cây giám sát — dài hơn nhiều
  so với 2 × sàn mới (38'14"), không có tiến trình chạy nền dài hạn
  nào phủ, nên **không loại trừ được reboot ẩn**. Trong mù: ít nhất
  1 reboot (#32, chốt giờ); có thể nhiều hơn — không xác định được.
  Đây là mù đầu tiên kể từ #21 không đóng được hoàn toàn (sau #22,
  #23 đều đóng).
- **Hệ quả cho mù #22 (đã đóng ở F7, tin cậy hạ ở G8):** sàn mới
  19'07" mở rộng cửa sổ hình thức thành **[05:45:25Z, 06:37:37Z]**
  (52'12"). Kiểm lại: **520 bản ghi, khoảng cách giữa hai bản ghi
  liên tiếp tối đa 78 s** (trung vị 2 s) — vẫn dày đặc. Mù #22
  **vẫn đóng trên bằng chứng hoạt động, cửa sổ lý thuyết nay ≤78 s**
  (trước đây ≤30 s). H7 KHÔNG tự quyết — parent/user quyết (xem
  §2.8).
- **Mù #23 (G8 đã đóng) VẪN ĐÓNG với sàn mới:** đoạn trước #29
  (17'37") và đoạn #30 → #31 (31'47") đều < 2 × sàn mới (38'14");
  đoạn #29 → #30 loại trừ trực tiếp như cũ. Không đổi kết luận G8.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong 58
  file *.log có mtime trong mù #24; 2 dòng "sóng EPERM đã tắt"
  (G9 O8, 12:14:06Z + 12:14:57Z) đều là **dương tính giả đã biết**.
  Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) —
  ~50h28'40" trước probe #25. EPERM vẫn KHÔNG được tuyên bố là đã
  hết. Lưu ý: lỗ 2h03'11" cũng là **mù hoàn toàn về sóng** (đủ dài
  để chứa một sóng ~16 phút mà không để lại dấu vết nào).
- **Quét writeFileSync chuẩn mới: 494 dòng / 154 file** (phạm vi
  2716 file); R7b đối chiếu 519 dòng / 171 file; copies 25 dòng /
  17 file; đối chiếu chéo 494+25=519=R7b, **chênh 0 — lần thứ mười
  hai liên tiếp**. +22 dòng / +6 file so với G8, giải thích đúng
  hết bằng diff. 0 file biến mất khỏi hit list. Async
  `.writeFile(`: vẫn đúng **2 vị trí, cả hai trong helper retry đã
  biết** — 0 stray (xem §2.7, gồm đính chính lỗi phương pháp của
  chính lượt late-merge này).
- RAM 2 mẫu của H7 gốc: **850.592 kB / 798.288 kB** (~0,83 / 0,78
  GB); max RAM biết được trong mù #24 là **1.326 MB** (G9 poll
  12:28:41Z) = 21,6% ngưỡng guard — birefnet KHÔNG chạy, vẫn 0 lần
  chạy thành công trong gói. Reboot #16 VẪN MỞ (kẹp ~4', chờ
  parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.
- **Dự báo reboot tiếp theo của G8 SAI theo hướng muộn:** G8 dự #32
  ~13:28:49Z (dải 11:58:27–14:40:48Z); thực tế 14:31:52Z — muộn hơn
  1h03'03" so với điểm dự báo, trong dải nhưng sát trần. Dự báo mới:
  **~16:51:58Z** (dải sàn–trần mới 15:10:06Z–18:05:07Z — rất rộng,
  xem §2.4).

## 1. Checklist P8 §2.3 cho lượt này (số thật — H7 gốc, từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 14:39:33Z | boot_id `75697729-9014-47e0-a0cc-c1aad4926fe5`; `who -b` Nov 13 14:32; `uptime -s` **2026-11-13 14:31:52Z** (uptime ~8'); journal chỉ 1 boot (75697729, first entry 14:32:03Z); `last -x reboot` 14:32 still running; wtmp bắt đầu 14:32:03Z |
| `bash scripts/probe-eperm-v2.sh status` | 14:39:40Z | **DEAD/STALE**, exit 1 — heartbeat n=24, ts 11:38:22Z, boot 3e4f237a, age **10.878 s**; last sample probe #24; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 14:39:40Z | **probe #25, boot=75697729, ok=2 fail=0**, exit 0; dòng `boot changed 3e4f237a -> 75697729` (uptime since 2026-11-13 14:31:52) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 14:39:40Z | **ALIVE**, age 0 s, n=25, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 67 dòng, trước lượt 64 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=25, ts
14:39:40Z, pid=6826, boot 75697729-9014-47e0-a0cc-c1aad4926fe5).

**Bổ sung của lượt late-merge (lệnh status nhanh, KHÔNG phải probe
mới):** lúc 16:28:03Z, boot hiện tại đã là `63a52041-cdb6-4824-bb17-
32c8f5aba5ee`, `uptime -s` **2026-11-13 14:50:59**, `who -b` Nov 13
14:51, journal chỉ 1 boot (first entry 14:51:13Z), `last -x reboot`
14:51 still running, wtmp bắt đầu 14:51:12Z — xác nhận reboot #33
lúc 14:50:59Z (xem §2.2). RAM mẫu bổ sung lúc này: MemAvailable
1.042.384 kB (xem §3 — mẫu sau reboot, ghi riêng, không trộn với
2 mẫu của H7 gốc).

Lưu ý phương pháp (nhắc lại G8 §1): dòng `boot changed` của probe
nhảy thẳng 3e4f237a → 75697729 — vì không có probe nào chạy trên
boot trung gian nếu có. Bước nhảy đơn này KHÔNG được đọc là "chỉ
có 1 reboot trong mù"; xem §2.3 để thấy vì sao mù này không đóng
được (khác mù #23, nơi hai boot trung gian đều có bằng chứng độc
lập).

## 2. Điều tra khoảng mù kể từ probe #24

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #25: `uptime -s` = **2026-11-13 14:31:52Z**,
  boot_id `75697729-9014-47e0-a0cc-c1aad4926fe5` — khác boot của
  probe #24 (3e4f237a).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots` (lúc late-merge, 16:28:03Z): chỉ **1
  boot** (hiện tại, 63a52041, first entry 14:51:13Z, last 16:28:36Z
  lúc kiểm tra). `last -x reboot`: chỉ 1 dòng (14:51, still
  running). wtmp bắt đầu 14:51:12Z. **Journal/wtmp của boot #32
  (75697729) đã mất theo reboot #33** — bằng chứng trực tiếp duy
  nhất còn lại về #32 là log probe v2 + probe-notes của H7 gốc
  (đo lúc 14:39:33Z/14:39:40Z, khi boot đó còn sống).
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu. journal/wtmp chỉ
  giữ boot hiện tại, như mọi lần trước.

### 2.2 Hai reboot liên quan (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 32 | **14:31:52Z (chính xác từng giây)** | 3e4f237a → 75697729 | H7 gốc đo trực tiếp lúc 14:39:33Z (`uptime -s` + `boot_id`) và xác nhận lại 14:39:40Z; dòng `boot changed … (uptime since 2026-11-13 14:31:52)` trong log probe v2; H9 xác minh độc lập (recounts.log: "xác nhận độc lập reboot #32 = 14:31:52Z"); poller H9 start 14:40:20Z ghi `boot=2026-11-13 14:31:52`; round106.md (prereg parent, 14:37:20Z): "Boot hiện tại: 14:31:52Z, up 4 phút lúc 14:36Z". **Số thứ tự TẠM THỜI** — xem §2.3. |
| 33 | **14:50:59Z (chính xác từng giây)** | 75697729 → 63a52041 | Lượt late-merge này đo trực tiếp lúc 16:28:03Z (`uptime -s` 2026-11-13 14:50:59 + `boot_id` 63a52041 + `who -b` 14:51 + journal first entry 14:51:13Z); poller H9 restart 14:52:45Z ghi `boot=2026-11-13 14:50:59 (prev boot 14:31:52Z, gap ~19m)`; poll #2 của H9 lúc 14:50:20Z vẫn boot 14:31:52 (up 18 phút) — kẹp #33 vào (14:50:20Z, 14:52:45Z], khớp `uptime -s`. |

Khoảng cách #31 → #32 = **3h05'12"**; #32 → #33 = **19'07" —
NGẮN NHẤT từng ghi** (phá sàn cũ 31'47" của #30 → #31). Chu kỳ
nay là **33 lần trong ~66h32'49"** (từ ~20:18:10Z 10/11 tới
14:50:59Z 13/11) — trung bình **~2h01'00"/lần** theo cách đếm của
W7/X7 (tổng thời gian / số reboot), nhanh hơn ~2h02' của G8.
Reboot tiếp theo dự kiến **~16:51:58Z** (14:50:59Z + ~2h01') —
dải sàn–trần mới (19'07"–3h14'08") cho phép lệch tới
**15:10:06Z–18:05:07Z**, rất rộng. Mọi probe nền đều chết theo
reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi phục
bằng 1 mẫu mới.

**Reboot #33 cắt ngang những gì:** H7 gốc viết xong probe-notes
(14:39:53Z) và chạy xong scan (14:43:44–14:46:45Z), nhưng chưa kịp
viết LIMITS/batch thì #33 xảy ra 14:50:59Z. H9 ghi nhận #33 cũng
cắt ngang poll lần 1 của H9 (SIGTERM ~14:51Z), watcher H1, H3 y2,
H4 r41c0, H8 (không còn dấu vết sau 14:40Z); H2 chết trước reboot
(14:48Z). Dữ liệu thô của H7 sống sót vì nằm trên đĩa, không phụ
thuộc tiến trình nền — đó là lý do late merge này khả thi.

### 2.3 Hoạt động trong khoảng mù — vì sao KHÔNG ĐÓNG ĐƯỢC

Hoạt động ghi đĩa 11:38:22Z → 12:28:41Z (đóng băng đợt 105), rồi
**không còn bản ghi nào trong hai cây giám sát tới 14:31:52Z**,
rồi spawn đợt 106 (14:35:51Z) + probe #25 (14:39:40Z):

- **11:38:22–12:28:41Z (boot 3e4f237a, đoạn A, 50'19"):** đợt 105
  đóng băng: repo-1 **16 file** (không tính dist) — G5 decision
  11:40:03Z, F5 rearm 11:40:04Z, G4 rearm 11:40:32Z, gen105g7
  11:43:16Z, frames-noise.mp4 11:43:28Z, G8 LIMITS 11:46:03Z, G2
  zombie 11:47:39Z, probe105g7 11:47:51Z, webkit-blob-flaky
  11:52:05Z + json 11:52:43Z, G6 LIMITS 11:54:33Z, G1 ghost
  12:01:07Z, G7 blur 12:03:44Z, G9 verify 12:22:52Z, ROUND105
  LIMITS 12:25:57Z, GAP_ANALYSIS 12:26:10Z; hidden_files **440
  file** (không tính chrome-userdata); G9 poller poll 12:09Z,
  12:18:40Z (RAM 1059 MB), 12:28:41Z (RAM 1326 MB), cả ba cùng
  boot 3e4f237a.
- **12:28:41Z–14:31:52Z (LỖ, 2h03'11"):** **0 file** có mtime
  trong hai cây giám sát (repo-1 không tính dist; hidden_files
  không tính chrome-userdata); **0 file** trong `dist`; **0 file**
  trong `chrome-userdata`; **0 file** trong /tmp (cả mù #24 cũng
  0 file /tmp — nhất quán với việc reboot #32 xóa /tmp, như F7
  đã thấy; không dùng /tmp làm mốc).
- **Ngoài hai cây giám sát, toàn ~/workspace có 47 file mtime
  trong lỗ** — TẤT CẢ đều là ghi rời rạc của runtime/main-agent,
  không phải tiến trình chạy nền dài hạn trên VM: proactivity
  snapshot 12:41:55Z (6 file, cùng 1 giây) + 13:59:52Z (6 file);
  memory reconciliation 12:59:08–13:01:06Z và 13:59:56–14:03:58Z;
  file chunk PUSH #5 (merged-rounds67-105-unique.txt 13:57:49Z,
  12 chunk + oversize + CHUNKS.md 13:58:34Z, snapshot-sync json
  14:05:08Z); 1 agents exec-log 12:31:16Z. Khoảng trống
  không-ghi dài nhất giữa các mốc này là **56'43"**
  (13:01:06Z → 13:57:49Z).
- **14:31:52Z–14:39:40Z (đuôi sau #32, 7'48"):** chỉ 1 bản ghi —
  `round106.md` 14:37:20Z (spawn đợt 106 lúc 14:35:51Z theo cron;
  file prereg được ghi ~1,5 phút sau spawn). H9 poll #1 14:40:20Z
  (40 giây sau probe #25) vẫn boot 14:31:52 — đuôi nằm gọn trong
  một boot đã xác định.

Mù chia làm ba đoạn bởi #32:

- Đoạn TRƯỚC #32: 11:38:22Z → 14:31:52Z (**2h53'30"**).
- Đuôi SAU #32: 14:31:52Z → 14:39:40Z (**7'48"**).

**Đoạn trước #32 — KHÔNG LOẠI TRỪ ĐƯỢC (mới, lượt này):**

- Sàn KHÔNG loại trừ được: đoạn dài 2h53'30" >> 2 × sàn mới
  (38'14"). Một reboot ẩn T bất kỳ trong đoạn chỉ cần cách #31
  và #32 mỗi bên ≥ 19'07" — điều kiện này thỏa với hầu hết đoạn.
- Tiến trình chạy nền dài hạn KHÔNG có: poller G9 dừng sau poll
  cuối 12:28:41Z (G9 đã đóng băng xong — LIMITS gộp viết
  12:25:57Z; không có dòng FREEZE/restart nào sau đó trong
  poll.log; poller không còn chạy). Không watcher nào sống qua
  12:28:41Z. Đoạn sau 12:28:41Z không còn observer nào.
- Ghi rời rạc ngoài hai cây KHÔNG loại trừ được: 47 file kia là
  các lần ghi đơn lẻ của runtime/main-agent (mỗi lần là một job
  ngắn: snapshot, reconciliation, ghi chunk) — reboot xảy ra
  GIỮA hai lần ghi sẽ không để lại dấu vết nào trong các file
  đó. Khác hẳn poller/watcher (một tiến trình duy nhất sống qua
  cả đoạn, reboot sẽ giết nó và để lại khoảng trống không-thể-
  lấp — xem G8 §4 mục 4). Hơn nữa, khoảng trống không-ghi dài
  nhất giữa chúng (56'43") vẫn > 2 × sàn mới (38'14") nên ngay
  cả lập luận sàn áp cho khoảng trống đó cũng không đóng được.
- Đoạn 11:38:22Z → 12:28:41Z (50'19") thì hoạt động dày + poller
  G9 sống suốt (3 poll liên tiếp cùng boot 3e4f237a) — đoạn này
  tự nó loại trừ được reboot ẩn bằng tiến trình chạy nền (như
  đoạn #29 → #30 của G8). **Lỗ thực sự chỉ là 12:28:41Z →
  14:31:52Z (2h03'11")**, không phải toàn bộ 2h53'30".

**Đuôi sau #32 — LOẠI TRỪ TRỰC TIẾP (chắc chắn):** nằm gọn trong
một boot đã xác định — `uptime -s` vẫn 14:31:52Z + boot_id không
đổi lúc probe #25 (14:39:33Z, 14:39:40Z) và poll #1 của H9
(14:40:20Z); cộng thêm spawn đợt 106 từ 14:35:51Z trên boot mới
(phương pháp C6 §4 mục 2).

**Kết luận trung thực: khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN.**
Đúng 1 reboot đã chốt giờ trong mù (#32, 14:31:52Z); lỗ 2h03'11"
(12:28:41Z → 14:31:52Z) có thể chứa thêm reboot — số lượng không
xác định được. **Hệ quả trực tiếp: số thứ tự #32/#33 là TẠM
THỜI.** Nếu lỗ chứa k reboot ẩn (k ≥ 1) thì "reboot #32" thực tế
là #(32+k) và "reboot #33" là #(33+k); mọi đếm chu kỳ, trung bình
và dự báo dùng 33 lần đều lệch tương ứng. Không còn dữ liệu nào
để thu hẹp lỗ này thêm (journal/wtmp volatile, không có
/var/log/syslog hay kern.log; các ghi rời rạc đã liệt kê hết) —
**không thể đóng mù #24 hồi tố bằng một probe tương lai**: probe
#26 trên boot 63a52041 sẽ đóng mù #25 (từ 14:39:40Z), không đóng
được mù #24. Parent/user quyết xem có chấp nhận "ít nhất 1
reboot, có thể nhiều hơn" làm mức đóng của mù #24 hay để mở như
mù #21. H7 không tự quyết.

Đếm cửa sổ (đo ~16:28–16:35Z, sau reboot #33 — số đếm đã gồm cả
hoạt động đợt 106 sau probe #25, chỉ dùng làm mốc tham chiếu,
không dùng để đóng mù): repo-1 **16 file** (không dist) có mtime
trong mù #24; hidden_files **440 file** (không tính chrome).
Số đếm là ảnh chụp tại thời điểm đo (F7 §5 mục 2) — mốc hoạt động
bền là file nguồn (.md/.ts/.mjs/.log), không phải output build.

### 2.4 Bảng khoảng cách liên tiếp đã xác nhận (cập nhật từ G8 §2.4)

| Cặp | Khoảng cách |
|---|---|
| #14 ~03:25Z → #15 05:17:47Z | ~1h53' |
| #15 05:17:47Z → #16 ~07:26–07:30Z | ~2h08'–2h12' |
| #16 ~07:26–07:30Z → #17 08:01:15Z | ~31'–35' (kẹp, không phải giờ chính xác) |
| #17 08:01:15Z → #18 09:24:17Z | 1h23'02" |
| #18 09:24:17Z → #19 11:30:25Z | 2h06'08" |
| #19 11:30:25Z → #20 13:24:41Z | 1h54'16" |
| #20 13:24:41Z → #21 15:24:27Z | 1h59'46" |
| #21 15:24:27Z → #22 17:25:39Z | 2h01'12" |
| #22 17:25:39Z → #23 20:30:14Z | 3h04'35" |
| #23 20:30:14Z → #24 21:41:50Z | 1h11'36" (sàn cũ) |
| #24 21:41:50Z → #25 23:51:21Z | 2h09'31" |
| #25 23:51:21Z → #26 02:12:10Z | 2h20'49" |
| #26 02:12:10Z → #27 05:26:18Z | **3h14'08" (dài nhất)** |
| #27 05:26:18Z → #28 06:56:44Z | 1h30'26" |
| #28 06:56:44Z → #29 08:56:39Z | 1h59'55" |
| #29 08:56:39Z → #30 10:54:53Z | 1h58'14" |
| #30 10:54:53Z → #31 11:26:40Z | 31'47" (sàn cũ, đã bị phá) |
| #31 11:26:40Z → #32 14:31:52Z | 3h05'12" |
| #32 14:31:52Z → #33 14:50:59Z | **19'07" (ngắn nhất có giờ chính xác — SÀN MỚI)** |

**Sàn khoảng cách chính xác nay là 19'07" (mới, thay 31'47");**
trần vẫn 3h14'08" (không đổi). Hệ quả: lập luận sàn chỉ còn đóng
được đoạn < 2 × 19'07" = **38'14"** (trước đây 1h03'34"). Dự báo
bằng trung bình càng kém tin cậy hơn: G8 dự #32 ~13:28:49Z, thực
tế 14:31:52Z (lệch +1h03'03", trong dải nhưng sát trần); trước đó
F9 dự #31 ~12:59Z, thực tế 11:26:40Z (lệch −1h32', ngoài dải).
Hai lượt liên tiếp dự báo điểm đều lệch hơn 1 giờ, ngược hướng
nhau — ghi cả dải, đừng chỉ ghi điểm.

Lưu ý: kẹp #16 → #17 (~31'–35', không chính xác) nay nằm TRÊN sàn
mới 19'07" với biên độ rộng — nếu kẹp đó là thật thì sàn thực tế
vẫn có thể thấp hơn 19'07" đôi chút; nhưng kẹp #16 không có giờ
chính xác nên không dùng làm sàn. Tương tự, số thứ tự #32/#33 là
tạm thời (xem §2.3) — nếu lỗ mù #24 chứa reboot ẩn, cả bảng này
dịch số thứ tự từ #32 trở đi.

### 2.5 Sóng EPERM trong khoảng mù — tìm trong log đợt 105 + đợt 106 tới lúc này

Khoảng mù 11:38:22Z → 14:39:40Z (3h01'18") được phủ bởi các luồng
sibling đợt 105 (G1–G9, đóng băng tới 12:28:41Z) + spawn đợt 106
(14:35:51Z, file đầu round106.md 14:37:20Z — trong mù, 2'20" trước
khi mù đóng). Đã đọc lại log thật (grep `sóng EPERM vẫn bật` /
`CẢNH BÁO: chờ sóng` / `Operation not permitted` / `sóng EPERM đã
tắt` trên 58 file *.log có mtime trong mù #24):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| G9 O8 (round105-g9-o8.log) | 12:14:06Z + 12:14:57Z | 2 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết** |
| G1–G8 (`docs/PHASE9_ROUND105_*.md` + log) | 11:38–~12:26Z | 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật |
| Grep rộng toàn bộ cây `hidden_files/round105-*` + `round106-*` tới lúc này | toàn đợt | "vẫn bật" 0 hit; "Operation not permitted" 0 hit thật (chỉ còn các trích dẫn số đếm "0" trong LIMITS cũ — không phải sự kiện) |

Tổng trong *.log có mtime trong mù #24: **2 dòng "đã tắt"** (G9 O8
×2) + **0 dòng "vẫn bật", 0 "CẢNH BÁO", 0 "Operation not
permitted" thật**.

**Đính chính dương tính giả (nhắc lại bài học Y8 §4 mục 8, áp
dụng cho lượt này):** 2 dòng launcher "sóng EPERM đã tắt, khởi
động vite" đều là dòng in khi lần ghi thử ĐẦU TIÊN thành công ngay
(code launcher `waveOff=true` ở lần write đầu) — in mặc định cả
khi không có sóng. Bằng chứng phân biệt: **0 dòng "sóng EPERM vẫn
bật sau …s chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"**
trong toàn bộ cây round105 + round106 tới lúc này; **0 lần
"Operation not permitted" thật**.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **Lỗ 2h03'11" giữa đóng băng đợt 105 (12:28:41Z) và
  #32 (14:31:52Z) là mù hoàn toàn về sóng** (đủ dài để chứa nhiều
  sóng ~16 phút mà không để lại dấu vết nào) — và khác mù #23,
  lỗ này **có thể chứa reboot ẩn** (xem §2.3). Mù #24 "mù" về cả
  sóng lẫn reboot trong cùng một lỗ.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~50h28'40" trước
  probe #25 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG được
  tuyên bố là đã hết.
- Khoảng trống không-bản-ghi 2h03'11" dài hơn nhiều so với đuôi mù
  #23 (22'15") và mù #22 (1h05'34") — vì đợt 105 đóng băng xong
  lúc 12:28:41Z và không còn observer nào chạy nền sau đó (G9
  poller dừng; cron tiếp theo 3 giờ sau mới spawn đợt 106).

### 2.6 Quét writeFileSync (snapshot 14:43:44–14:46:45Z, H7 gốc)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round106-h7`. Late-merge này tính lại từ file wfs-*.txt +
files-*.bin gốc, khớp 100% scan-meta.txt:

- Chuẩn mới: **494 dòng / 154 file** (phạm vi 2716 file).
  G8: 472 dòng / 148 file (phạm vi 2704 file).
- R7b (đối chiếu): **519 dòng / 171 file**. G8: 497 / 165.
- Copies: **25 dòng / 17 file** — y hệt G8 và F7.
- Đối chiếu chéo 494+25=519=R7b, **chênh 0 — lần thứ mười hai
  liên tiếp**. Tổng hit trên cả 3 bảng: 494+519+25 = **1.038 dòng**
  (khớp headline H9 — H9 đếm độc lập từ cùng file gốc).
- **+22 dòng / +6 file so với G8, giải thích đúng hết bằng diff
  hit list** (không có dòng nào tăng trong file cũ ngoài
  GAP_ANALYSIS, không file nào giảm):
  - +5 `apps/web/scripts/probe105g7-frame-parity.mjs` (G7 đợt 105
    — file mới)
  - +6 `apps/web/scripts/probe106h3-frame-parity.mjs` (H3 đợt 106
    — file mới)
  - +5 `apps/web/scripts/probe106h4-frame-parity.mjs` (H4 đợt 106
    — file mới)
  - +3 `docs/PHASE9_ROUND105_G8_EPERM_LIMITS.md` (file LIMITS của
    chính G8 — 11:46:03Z, sau snapshot G8 11:41:44Z)
  - +1 `docs/PHASE9_ROUND105_G9_VERIFY_LIMITS.md` (G9, 12:22:52Z)
  - +1 `docs/PHASE9_ROUND105_LIMITS.md` (closing, 12:25:57Z)
  - +1 `PHASE9_GAP_ANALYSIS.md` (14 → 15 — dòng 1370, mục tóm tắt
    G8 mới thêm, 12:26:10Z)
  - Tổng: 5+6+5+3+1+1+1 = **22** ✓, 6 file mới ✓ (diff R7b y hệt
    NEWSTD — vì các file mới không nằm trong release*/build*/
    assets)
- **0 file biến mất khỏi hit list** (chỉ GAP_ANALYSIS đổi số đếm
  14 → 15).
- Scope: **+13 file / −1 file** so với G8 (2716 = 2704+13−1 ✓):
  13 file mới = 6 file hit trên + 7 file không hit
  (`gen105g7-frames-noise.py`, `webkit_blob_flaky_105g6_2mib.mjs`,
  5 LIMITS đợt 105 G1/G2/G3/G6/G7); 1 file biến mất khỏi scope là
  `apps/web/vite.config.f3-temp.ts` — file tạm của G8 (đã ghi là
  temp, nay đã xóa). Comm hai chiều khớp đúng.
- Hit list **0 đường dẫn release*/build/assets** trong chuẩn mới;
  17 file copies đều nằm dưới `apps/desktop/build/slim-venv/…`
  (vendored `anyio`/`_yaml`, y hệt G8 — xem files-copies.txt).
- Không có race giữa lúc scan: 0 file hạ cánh trong cửa sổ scan
  14:43:44–14:46:45Z (mọi file mới đều có mtime ≤ 12:26:10Z, trừ
  các file đợt 106 H3/H4 viết trước 14:43:44Z).

### 2.7 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2716 file), NUL-safe, chạy từ trong repo-1 — các hit trong file
`.md` đều là trích dẫn trong LIMITS cũ; **chỉ đúng 2 hit trong
code**:

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z). Kết luận giữ nguyên
như G8: **2 async call site, cả 2 đều thuộc helper retry đã biết
với cùng hợp đồng EPERM-only + verify byte — không phải write
async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

**Đính chính lỗi phương pháp của chính lượt late-merge này:**
lần quét async đầu tiên trả về 0 hit vì chạy từ cwd sai
(`/home/hatch` thay vì `~/workspace/repo-1`) — đường dẫn tương
đối trong files-newstd.bin không resolve được, grep lặng lẽ không
tìm thấy gì. Kiểm tra trực tiếp 2 file helper + quét lại NUL-safe
từ đúng cwd xác nhận vẫn đúng 2 vị trí. Bài học: quét trên
files-*.bin (đường dẫn tương đối) **phải `cd` vào repo-1 trước**;
kết quả 0 hit từ sai cwd không phải bằng chứng "không còn async
write" — luôn đối chiếu với 2 vị trí đã biết trước khi kết luận.

### 2.8 Hệ quả cho mù #22 (F7 đã đóng, G8 hạ tin cậy): sàn mới mở rộng cửa sổ, hoạt động vẫn giữ

G8 đã hạ mù #22 xuống "chỉ hoạt động, cửa sổ lý thuyết ≤30 s" với
cửa sổ [06:12:11Z, 06:24:57Z] (12'46", tính bằng sàn cũ 31'47").
Sàn mới 19'07" mở rộng cửa sổ hình thức thành T ∈ [#27 + sàn mới,
#28 − sàn mới] = **[05:45:25Z, 06:37:37Z]** (52'12").

Kiểm lại cửa sổ MỞ RỘNG này từ dữ liệu thô trên đĩa (find mtime
hai cây, 05:45:25–06:37:37Z, không tính dist/chrome-userdata):
**520 bản ghi**, khoảng cách giữa hai bản ghi liên tiếp **tối đa
78 s** (05:58:21Z → 05:59:39Z), trung vị 2 s; bản ghi đầu
05:45:25Z, bản ghi cuối 06:37:05Z — phủ kín cả cửa sổ. Các khoảng
trống lớn nhất tiếp theo: 54 s, 53 s, 51 s, 50 s — không có khoảng
trống nào trên 78 s trong toàn cửa sổ 52'12".

Đánh giá trung thực:

- Một reboot muốn ẩn trong cửa sổ này phải lọt trọn vào một
  khoảng trống ≤ 78 s giữa hai bản ghi, đồng thời mọi driver đang
  chạy phải hồi phục trong vài giây mà không để lại run nào bị
  giết, không làm lệch nhịp ~25–30 s của chuỗi probe E5 (chuỗi
  chạy liên tục 06:10Z → 06:56:06Z không đứt quãng — xem G8 §2.8).
  Quan sát sau #29 cho thấy bản ghi đầu sau reboot có thể nhanh
  tới ~12 s (F4 vite-attempt1.log 08:56:51Z) — nên về nguyên tắc
  không thể loại trừ tuyệt đối bằng mật độ mtime.
- Nhưng xác suất thực tế vẫn rất thấp: 520 bản ghi / 52 phút
  (trung bình 1 bản ghi mỗi ~6 s, trung vị 2 s), 0 run bị giết,
  nhịp chuỗi không lệch — trong khi mọi reboot từng quan sát đều
  để lại dấu vết rõ (run bị giết, poller/watcher chết, khoảng
  trống phút).
- **Kết luận: mù #22 VẪN ĐÓNG trên bằng chứng hoạt động, nhưng
  cửa sổ lý thuyết nay là ≤78 s (thay vì ≤30 s ở G8).** H7 KHÔNG
  tự quyết mở lại, giữ nguyên hay ghi thành "đóng có điều kiện"
  — parent/user quyết. Dù quyết thế nào, đây KHÔNG phải lỗi của
  F7 hay G8: sàn 31'47" là sàn đúng tại thời điểm G8 đo; sàn chỉ
  đổi vì #33 phá kỷ lục sau đó (bài học G8 §4 mục 1 — sàn có thể
  thay đổi, đừng đóng mù vĩnh viễn chỉ bằng sàn).

### 2.9 Đối chiếu với H9 (verify độc lập — không copy mù)

H9 (recounts.log + poll.log, đợt 106) đã xác minh độc lập từ cùng
dữ liệu gốc, trước khi file LIMITS này được viết:

- Probe #25 ok=2 fail=0 (14:39:40Z, boot 75697729); #32 =
  14:31:52Z; scan newstd 154/494, r7b 171/519, copies 17/25 —
  **khớp 100% với tính toán lại của lượt này** (xem §2.6).
- Gap #32 → #33 = 19'07", sàn mới — **khớp**.
- H9 kết luận "mù #24 chưa đóng trong dữ liệu H7" — **khớp với
  kết luận §2.3**, nhưng H9 viết "cần probe trên boot sau
  14:50:59Z, chưa có" — **đính chính cách diễn đạt này**: probe
  #26 trên boot 63a52041 sẽ đóng mù #25 (từ 14:39:40Z), KHÔNG
  đóng được mù #24 hồi tố (lỗ 12:28:41–14:31:52Z không còn nguồn
  nào để thu hẹp — xem §2.3). Đây là đính chính diễn đạt, không
  phải sai số liệu của H9.
- H9 ghi "số #32 chưa xác minh độc lập hoàn toàn … số thứ tự vẫn
  dựa trên prereg" — **khớp với cảnh báo "TẠM THỜI" ở §2.2/§2.3**:
  H7 gốc xác nhận boot_id + giờ #32 bằng 2 phép đo trực tiếp,
  nhưng số thứ tự thì điều kiện vào 0 reboot ẩn trong lỗ.

## 3. RAM (birefnet: KHÔNG chạy)

2 mẫu MemAvailable của H7 gốc trong lượt: **850.592 kB
(14:39:33Z) / 798.288 kB (14:39:40Z)** — ~0,83 / 0,78 GB, lúc
đợt 106 vừa spawn (14:35:51Z), tải chưa lên. Max RAM biết được
trong mù #24 là **1.326 MB** (G9 poll 12:28:41Z; poll 12:18:40Z
1.059 MB) = **21,6% ngưỡng guard 6144 MB**; RAM lúc spawn đợt
106 ~1.099 MB (round106.md). Mẫu bổ sung của lượt late-merge
(sau reboot #33, boot 63a52041): **1.042.384 kB lúc 16:28:03Z** —
ghi riêng, không trộn với mẫu của H7 gốc. Birefnet KHÔNG chạy,
đúng quy tắc parent đợt 92 §3 mục 7 (chỉ thử lại khi RAM đổi theo
hướng có lợi ĐỦ MỨC; chạm ≥ 6 GB mới thử lại). Birefnet-general
vẫn **0 lần chạy thành công** trong gói. Max RAM trong toàn mù
#24 vẫn dưới một phần tư guard — không có thời điểm nào đủ gần
ngưỡng để thử lại birefnet.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
   bằng sàn** (G8 §4 mục 1, nhắc lại với bằng chứng mới): sàn
   31'47" của G8 chỉ sống được 1 lượt — #33 (19'07") phá ngay.
   Từ nay: (a) ghi rõ sàn tại thời điểm đóng mù; (b) ưu tiên loại
   trừ trực tiếp bằng tiến trình chạy nền dài hạn (poller/watcher)
   hoặc uptime — bền hơn sàn; (c) khi sàn đổi, kiểm tra lại các
   mù đã đóng bằng sàn cũ có đoạn > 2 × sàn mới không (lượt này
   đã làm cho #22 — xem §2.8 — và #23 — xem §6 mục 3).
2. **Ghi rời rạc của main-agent/runtime KHÔNG thay thế được
   poller/watcher** (mới, lượt này — bài học từ lỗ mù #24): 47
   file mtime trong lỗ (snapshot, reconciliation, chunk PUSH #5)
   trông như "có hoạt động", nhưng đều là write đơn lẻ của các
   job ngắn — reboot giữa hai lần ghi không để lại dấu vết. Chỉ
   tiến trình duy nhất sống qua cả đoạn + ghi dấu định kỳ mới
   loại trừ được reboot. Các lượt sau: đừng đếm file mtime của
   runtime/main-agent làm bằng chứng loại trừ; chỉ tính
   poller/watcher/driver chạy nền dài hạn + uptime đo trực tiếp.
3. **Khoảng trống giữa đóng băng đợt cũ và spawn đợt mới là lỗ mù
   hệ thống** (mới, lượt này): đợt 105 đóng băng 12:28:41Z, đợt
   106 spawn 14:35:51Z — 2h07'10" không observer nào. Cron 3 giờ
   + không có poller/watcher thường trực = mọi mù đều có thể chứa
   một lỗ như vậy. Đây chính là lý do đề xuất cron riêng 10 phút
   vẫn đứng (xem §6 mục 5) — không có observer thường trực thì
   lỗ này sẽ lặp lại.
4. **Quét trên files-*.bin phải `cd` vào repo-1 trước** (mới, lượt
   này — xem §2.7): đường dẫn tương đối trong files-*.bin không
   resolve được từ cwd khác; kết quả 0 hit từ sai cwd không phải
   bằng chứng. Luôn đối chiếu với 2 vị trí async đã biết trước
   khi kết luận.
5. **Số đếm find trong cửa sổ là ảnh chụp tại thời điểm đo, không
   phải con số bền** (F7 §5 mục 2, nhắc lại): lượt này đếm
   repo-1 16 file / hidden_files 440 file trong mù #24 — mốc hoạt
   động bền là file nguồn (.md/.ts/.mjs/.log), không phải output
   build.
6. **Đếm async `.writeFile(` bằng mẫu `\.writeFile\(` trên đúng
   phạm vi quét, lọc `.md` ra** (F7 §5 mục 3, nhắc lại): lượt này
   vẫn đúng 2 vị trí trong helper retry async đã biết, 0 stray.
7. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8, nhắc lại):** lượt này 2 dòng "đã tắt" trong mù #24
   (G9 O8 ×2) đều là dương tính giả; 0 dòng "vẫn bật", 0
   "Operation not permitted" thật.
8. **Late merge phải tính lại từ dữ liệu thô, không copy headline
   của luồng verify** (mới, lượt này): H9 đã cứu headline trước
   (probe #25, scan, #32) — lượt này tính lại độc lập từ
   probe-log, probe-notes, wfs-*.txt, files-*.bin và khớp 100%,
   kèm 1 đính chính diễn đạt của H9 (xem §2.9). Dữ liệu thô sống
   trên đĩa là lý do late merge khả thi — các luồng nên lưu kết
   quả sớm, VM reboot thất thường.

## 5. Ghi chú về log poller H9 (dị thường nhỏ, không ảnh hưởng kết luận)

Trong `poll.log` của H9, dòng `=== H9 poll RESTART after reboot:
2026-11-13 14:52:45 UTC boot=2026-11-13 14:50:59 (prev boot
14:31:52Z, gap ~19m) ===` đứng giữa poll #2 (14:50:20Z, boot
14:31:52) và poll #1 mới (14:52:45Z, boot 14:50:59). Đây KHÔNG
phải dị thường: poller bị SIGTERM ~14:51Z theo reboot #33, H9
restart bằng tay 14:52:45Z và ghi rõ prev boot — đúng mẫu F9 sau
#29/#30 (xem G8 §5). Kẹp #33: poll #2 14:50:20Z (boot cũ) →
restart 14:52:45Z (boot mới) — khớp `uptime -s` 14:50:59Z. Ghi để
các lượt sau khỏi ngờ vực khi đọc lại poll.log.

## 6. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #24 KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này, xem
   §2.3):** lỗ 2h03'11" (12:28:41Z → 14:31:52Z) có thể chứa thêm
   reboot; số reboot trong mù: ít nhất 1 (#32), có thể nhiều hơn
   — không xác định được; số thứ tự #32/#33 là TẠM THỜI. Không
   còn dữ liệu nào để thu hẹp thêm (journal/wtmp volatile, không
   có /var/log/syslog hay kern.log) — parent/user quyết xem có
   chấp nhận "ít nhất 1 reboot, có thể nhiều hơn" làm mức đóng
   của mù #24 hay để mở như mù #21. H7 không tự quyết.
2. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
   gian. Không còn dữ liệu nào để thu hẹp thêm — parent/user
   quyết xem có chấp nhận "tối đa 1 reboot ẩn trong lỗ 17'23"" làm
   mức đóng của mù #21 hay để mở như reboot #16. H7 không tự quyết.
3. **Khoảng mù #22 ĐÃ ĐÓNG — NHƯNG MỨC TIN CẬY HẠ THÊM (mới, lượt
   này, xem §2.8):** sàn mới 19'07" mở rộng cửa sổ hình thức thành
   [05:45:25Z, 06:37:37Z] (52'12"); hoạt động trong cửa sổ vẫn dày
   (520 bản ghi, khoảng trống tối đa 78 s). Parent/user quyết: giữ
   "đóng", ghi thành "đóng có điều kiện", hay mở lại. H7 không tự
   quyết. **Khoảng mù #23 VẪN ĐÓNG HOÀN TOÀN với sàn mới** (đoạn
   17'37" và 31'47" đều < 2 × 19'07" = 38'14") — không đổi kết luận
   G8.
4. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #25 OK 2/2) — và lỗ 2h03'11" hoàn toàn không có bản
   ghi về sóng lẫn reboot. Sóng gần nhất: ~11:55–12:11Z,
   ~50h28'40" trước probe #25.
5. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3,
   F7 §6 mục 4, G8 §6 mục 5): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). H7 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   mù #24 dài 3h01'18" chứa một lỗ 2h03'11" không observer nào —
   và reboot #32 (14:31:52Z) chỉ được ghi nhận vì H7 chạy probe
   bằng tay lúc 14:39:40Z; không có observer thường trực thì cả
   #32 lẫn lỗ đều chỉ được biết sau khi đã xảy ra.
6. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
   và các lượt sau; log tăng đúng 3 dòng checklist, 64 → 67 —
   không thêm dòng lạ mới trong lượt này; lệnh status bổ sung lúc
   16:28:03Z của late-merge chỉ đọc `uptime`/`boot_id`/journal,
   không ghi vào log probe).
7. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
8. **VM reboot ~2h01'/lần** (33 lần/~66h32'49", số thứ tự tạm thời
   — xem §2.3): mọi probe nền đều chết theo reboot; v2 chỉ đảm
   bảo cái chết được ghi nhận + lượt sau hồi phục. Reboot tiếp theo
   dự kiến **~16:51:58Z** (dải 15:10:06Z–18:05:07Z — rất rộng sau
   khi sàn đổi); lúc 16:28:03Z máy vẫn trên boot 63a52041 (#33).
   Dải khoảng cách quan sát nay là **19'07"–3h14'08"** (sàn mới).
9. **Birefnet: KHÔNG chạy trong lượt này** — RAM 2 mẫu MemAvailable
   **850.592 / 798.288 kB** (~0,83 / 0,78 GB); max RAM biết được
   trong mù #24 là 1.326 MB (21,6% guard 6144 MB). Ghi rõ để parent
   quyết: nếu RAM khả dụng chạm ≥ 6 GB thì mới thử lại.
   Birefnet-general vẫn 0 lần chạy thành công trong gói.
10. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
11. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
12. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    H7 không thử lại nguồn nào, theo đúng lệnh.
13. **Khoảng mù #25 bắt đầu từ 14:39:40Z** (probe #25) — lượt sau
    (probe #26) đối chiếu từ mốc này, trên boot 63a52041 (#33,
    từ 14:50:59Z). Reboot tiếp theo dự kiến ~16:51:58Z (dải
    15:10:06Z–18:05:07Z).
14. **Đính chính tiền đề lượt này (ghi để parent sửa hồ sơ):**
    tiền đề ghi "xác nhận #32 = 14:31:52Z" — **giờ đúng, số thứ tự
    TẠM THỜI**: 14:31:52Z là boot 75697729, đo trực tiếp 2 lần
    (14:39:33Z, 14:39:40Z) + H9 xác minh độc lập; nhưng số "#32"
    điều kiện vào 0 reboot ẩn trong lỗ 12:28:41–14:31:52Z (xem
    §2.3). Mọi đếm reboot từ đây trở đi phải ghi chú tạm thời này
    cho tới khi parent/user quyết mức đóng của mù #24.

## 7. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND106_H7_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round106-h7-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round106-h7/`
(probe-notes.txt, scan-meta.txt, scan-wfs.sh, files-newstd.bin,
wfs-newstd.txt, files-r7b.bin, wfs-r7b.txt, files-copies.txt,
wfs-copies.txt) + ghi chú late-merge `round106-h7-late-merge.md`
trong cùng thư mục; log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

Tổng chờ push sau khi stage H7 (đợt 67–106, đếm lại từ đĩa bằng
recount-push.py của H9, chạy lúc ~16:35Z sau khi stage H7):
**395 batch / 2511 entry / 1539 file duy nhất, 0 thiếu trên đĩa**.
Đợt 106 riêng: 8 batch / 19 entry / 19 unique (H1 1, H2 5, H3 2,
H4 2, H5 4, H6 3, H7 1, H9 1 — H8 không có batch). Chênh so với số
H9 đếm trước đó (389 / 2499 / 1527) là +6 batch / +12 entry / +12
unique — đúng bằng các batch H1–H4 + H7 + H9 đã stage sau lần đếm
của H9 (1+5+2+2+1+1 = 12 entry), không phải sai số đếm. Chưa lên:
file oversize benchmarks/results/webkit-blob-flaky-96x3.json
(6.370.678 B, vẫn trên đĩa).
