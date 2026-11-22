# PHASE9 ROUND152 T6 — (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN + lock KHỎE + prune lần 27: XÓA 2 FILE + reboot mới trước phiên, KHÔNG giết holder — LIMITS

- Đợt: 152, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 12:35 +07 20/11/2026 (= 05:35:51Z). Chạy
  05:37:xxZ → 05:53:xxZ 20/11/2026, toàn bộ trên một boot duy
  nhất 18e179e0 — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm sức khỏe lock: số cặp lock,
  số giữ, số dòng queue, chu kỳ thật; (A) là khóa chính thức
  của khối T7 (quyết parent (v) đợt 151 — 120/120 PASS dưới
  churn) — kiểm tra (A) còn nguyên trong suite, KHÔNG đụng
  count_blockers của gate T4; (b) prune lần 27: tổng lock lúc
  T10-151 đóng là 102 (100 sau prune 26 + 2 cooldown T8 thêm)
  — kiểm lại lúc mở đợt 152 rồi prune về ~100 theo mẫu các đợt
  trước; (c) viết LIMITS trung thực; (d) stage paths
  NUL-delimited; (e) viết cờ .done.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151, file
  khối đã trích md5 `dc973443030249a262ff63cbc62231d5` giống
  hệt đợt 151); kiểm chứng lại DƯƠNG TÍNH: khối T7 trích
  verbatim chạy 120 lần với churn bơm vào — PASS 120/120
  (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6 lượt.
  Lock KHỎE: 409 cặp ACQUIRED→RELEASED, 0 đang giữ,
  0 TIMEOUT mới, 0 "KHÔNG NHẢ". Prune lần 27: xóa 2 file cũ
  nhất (điều (b)), queue 102 → 100 file. Reboot mới trước
  phiên (btime 05:20:57Z, boot 18e179e0 — tiếp sau reboot #42)
  KHÔNG giết holder nào (chu kỳ cuối hoàn tất 04:48:03Z,
  ~33 phút trước reboot).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  khác đợt 151 là đợt triển khai (A); đợt này chỉ kiểm lại).
  Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ đọc
  md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round152-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, wc-open.txt, wc-close.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  analyze-log.py, analyze-log-cleaned-open.txt,
  analyze-log-cleaned-close.txt, prune-candidates.txt,
  prune-deleted.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a152.sh,
  t7-block-a152.sh, t7-a152-churn.log, md5-open.txt,
  md5-close.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 18e179e0 MỚI (btime 05:20:57Z, tiếp sau reboot #42); lock TRỐNG; queue 102 file

- **Boot lúc mở và lúc đóng: boot_id
  `18e179e0-365e-4298-92b8-b61b147f9600`, btime 05:20:57Z
  theo /proc/stat** (epoch 1795152057; `uptime -s` =
  05:20:57; `journal --list-boots` chỉ 1 dòng 18e179e0,
  first entry 05:21:13Z). Uptime ~19' lúc T6 bắt đầu
  (05:39Z), ~31' lúc đóng (05:52Z). Đây là boot sau
  **reboot mới lúc 05:20:57Z — tiếp sau reboot #42
  (btime 03:25:16Z, boot `fad2aab9`, xem LIMITS T8-151
  §F-151-T8-5)** — xảy ra TRƯỚC phiên T6 (~15 phút trước
  khi đợt 152 mở 05:35:51Z). **KHÔNG có reboot trong
  phiên T6** (boot_id giống nhau lúc mở và lúc đóng).
  Số hiệu reboot mới: T6 ghi là "tiếp sau #42" — T2-152
  đánh số/chứng nhận chính thức (T6 không chứng nhận
  gap reboot; xem §2/§8).
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp).
- Các luồng đợt 152 khác: lúc T6 mở đã có thư mục
  round152-t1/t2/t4/t7/t8/t9 (chưa có cờ `.done` nào của
  đợt 152 lúc T6 mở — T0 đã stage paths trước đó).

## 1. Quét zombie: 0 zombie; 0 vite lúc mở và lúc đóng; 4 socket Xvfb mồ côi của T1-151 ĐÃ HẾT (do reboot, không phải dọn tay)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 05:39Z
  (mở, `ps-full-open.txt`, 29 dòng) và lúc 05:52:18Z
  (đóng, `ps-full-close.txt`, 32 dòng).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (05:39Z): 0 vite thật đang chạy** — `ss -tlnp`
  trống hoàn toàn (0 cổng lắng nghe); `/tmp/.X11-unix/`
  trống (0 socket). Lock TRỐNG (§2).
- **Lúc đóng (05:52:18Z): 0 vite thật đang chạy** — `ss`
  trống; lock TRỐNG (§2); `/tmp/.X11-unix/` vẫn trống.
- **4 socket Xvfb mồ côi của T1-151 (X193–X196, ghi ở
  T6-151 §1) ĐÃ HẾT** — `/tmp/.X11-unix/` trống hoàn toàn
  ở cả 2 snapshot. Nguyên nhân: reboot mới 05:20:57Z đã
  dọn `/tmp` (socket là file tạm, không sống qua reboot),
  KHÔNG phải dọn tay. Mục nợ "T1-151/T10-151 dọn socket"
  ở T6-151 §11 coi như đóng theo cách này — ghi nhận rõ
  để T10-152 không tìm lại.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-152).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (khớp đợt 147/148/149/150/151 — không có lần flip
  mới trong phiên T6; chuỗi flip-flop 63.747 → 63.756 →
  63.747 qua các boot giữ nguyên; quyết parent (m) đợt
  146: ghi làm chú thích, không hành động).

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; +38 dòng kể từ T6-151 đóng — TẤT CẢ TRƯỚC phiên T6 (0 dòng trong phiên)

- **Lúc mở (05:39:44Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 102 cooldown`,
  rc=0.
- **Lúc đóng (05:52:18Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 100 cooldown`
  (sau prune 2 file — xem §7), rc=0.
- **Log lock +38 dòng kể từ T6-151 đóng** (raw 1405 lúc
  T6-151 đóng → 1443 lúc T6-152 mở → 1443 lúc đóng):
  TẤT CẢ 38 dòng đều trước phiên T6 (02:58–04:48Z) —
  **0 dòng mới trong phiên T6-152** (suite T6 chạy trên
  log riêng trong /tmp, xem §6; không có luồng đợt 152
  nào acquire trong cửa sổ 05:39–05:52Z).
- Đối chiếu 38 dòng (khớp đúng từng dòng, xem §4):
  - t4: 1 chu kỳ hoàn tất (TICKET/ACQUIRED 02:58:32Z →
    RELEASED 03:01:58Z hold 206 s).
  - t8-round151: 8 chu kỳ hoàn tất (holds 148 / 70 / 80 /
    901 / 241 / 71 / 120 / 231 s) + 1 chu kỳ test hold 0 s
    (t8-round151-test 03:27:07Z) + **1 acquire bị reboot
    #42 giết** (t8-round151 ACQUIRED 03:22:39Z, reboot
    #42 btime 03:25:16Z; t8-round151-test phát hiện
    STALE-LOCK 03:27:07Z — "owner pid 62907 chết + không
    vite trên cổng 5490 + curl 000 + boot đổi (tuổi
    268s)" — rồi acquire lại và release hold 0 s).
    Đây là ca double-acquire thứ 9 (xem §4).
  - Tổng: 10 chu kỳ hoàn tất + 1 acquire bị giết đã phục
    hồi = Δ ACQUIRED +11, Δ RELEASED +10, Δ cặp +10
    (khớp §4).
- **Reboot mới 05:20:57Z KHÔNG giết holder nào:** chu kỳ
  cuối cùng trên log hoàn tất 04:48:03Z (t8-round151
  RELEASED hold 231 s) — **~33 phút trước btime
  05:20:57Z**, không có ACQUIRED nào chưa release tại
  thời điểm reboot (still held = 0, xem §4). T6 KHÔNG
  chứng nhận gap/mù của reboot này — thuộc T2-152.
- **File cooldown mới kể từ T6-151 đóng:
  `cooldown-t8-round151` (mtime 04:48:03Z) và
  `cooldown-t8-round151-test` (mtime 03:27:07Z)** (2 file
  — đưa tổng queue từ 100 lên 102, kích hoạt điều (b)
  ở prune lần 27, §7). Cả hai đều là file đợt 151 (đợt
  ngay trước) nên được bảo vệ bởi điều (c) — đồng thời
  chúng cũng là 2 file mới nhất nên không nằm trong
  diện xóa của điều (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 143 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 10 chu kỳ hoàn tất
  kể từ T6-151 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2; gồm 1 chu
  kỳ t4 + 8 chu kỳ t8-round151 + 1 chu kỳ test hold 0 s).
  - Cộng với 133 chu kỳ T6-151 đã đếm = **143 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (133 đợt
    151 + 10 đợt này). Chu kỳ bị reboot #42 giết
    (03:22:39Z) cũng chạy trên thứ tự mới nhưng không
    hoàn tất — đã phục hồi sạch bằng STALE-LOCK, không
    tính vào 143.
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1437 dòng chính thức lúc đóng, 409 cặp, 0 đang giữ, 0 double-acquire mới trong phiên, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
diff: bản đã lọc = raw trừ đúng 6 dòng đó, diff exit 0,
cả lúc mở và lúc đóng).
Bản đã lọc lúc đóng: **1437 dòng** (raw 1443) — **+38 dòng
kể từ T6-151 đóng** (đối chiếu từng dòng ở §2).
**KHỚP ĐÚNG số T6-151 đếm lúc đóng cộng thêm 10 chu kỳ
hoàn tất + 1 acquire bị reboot #42 giết đã phục hồi** —
xem bảng đối chiếu dưới.

| Chỉ số (bản đã lọc) | T6-151 đóng | T6-152 mở | T6-152 đóng | Δ trong phiên T6-152 |
|---|---|---|---|---|
| Tổng dòng | 1399 | 1437 | 1437 | 0 |
| TICKET | 418 | 429 | 429 | 0 |
| ACQUIRED | 407 | 418 | 418 | 0 |
| RELEASED | 399 | 409 | 409 | 0 |
| COOLDOWN | 156 | 161 | 161 | 0 |
| STALE-LOCK | 8 | 9 | 9 | 0 |
| STALE-TICKET | 1 | 1 | 1 | 0 |
| TIMEOUT | 10 | 10 | 10 | 0 |
| Cặp ACQUIRED→RELEASED | 399 | 409 | 409 | 0 |
| Đang giữ cuối log | 0 | 0 | 0 | 0 |
| Double-acquire | 8 | 9 | 9 | 0 mới |

- **Ca double-acquire thứ 9 (mới kể từ T6-151 đóng):
  t8-round151, ACQUIRED 03:40:03Z sau ACQUIRED 03:22:39Z
  chưa release** — đã giải thích đầy đủ: acquire
  03:22:39Z bị reboot #42 (btime 03:25:16Z) giết giữa
  lúc holder đang kẹt; t8-round151-test phát hiện
  STALE-LOCK 03:27:07Z (owner pid 62907 chết + không
  vite trên cổng 5490 + curl 000 + boot đổi) rồi
  acquire/release hold 0 s; t8-round151 acquire lại
  03:40:03Z và release sạch hold 80 s. Phục hồi đúng
  cơ chế STALE-LOCK (xem thêm LIMITS T8-151
  §F-151-T8-5).
- **9 ca double-acquire toàn bộ đều đã giải thích** (mỗi
  ca đều có dòng STALE-LOCK tương ứng: s3-round116,
  t3-round117, t4, t3-round119, t8-round129, t4,
  t8-round149, t8-round150, t8-round151 — xem
  `analyze-log-cleaned-close.txt`).
  0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới
  (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt 150),
  0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`khong-nha-grep.txt` rỗng — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE.** Giữ/nhả đúng lúc mở
  và lúc đóng (10 chu kỳ mới sạch kể từ T6-151 đóng +
  1 acquire bị reboot #42 giết đã phục hồi), 0 zombie,
  0 stale mới ngoài ca reboot #42 đã giải thích, queue
  0 ticket, log nhất quán (409 cặp + 1 ca reboot-kill
  mới đã giải thích + 0 đang giữ, 0 mất dấu khác — số
  chính thức đã loại 6 dòng repro lỗi của T6-132), 0
  TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật
  đợt 148–152 (toàn đợt) và đợt 152 (tới 05:52Z), suite
  9/9 ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự
  ghi mới đã có **143 chu kỳ thật** chứng minh (§3).
  **Không còn caveat nào về mất dòng RELEASED cho các
  chu kỳ mới** — caveat cũ chỉ còn là 1 dòng lịch sử
  (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **reboot mới 05:20:57Z
  trước phiên** — không giết holder, nhưng gap/mù của
  nó thuộc T2-152 (T6 không chứng nhận); và **4 socket
  Xvfb mồ côi của T1-151 đã hết nhờ reboot** (xem §1).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151 §6.2. File khối T7 đã trích
  `t7-block-a152.sh` md5 **`dc973443030249a262ff63cbc62231d5`**
  — **giống hệt** file khối đã trích đợt 151
  (`t7-block-a151.sh`, cùng md5). Harness đợt này chạy
  đúng code (A) trong suite, không phải bản sao tay
  (xem §6.2).
- **PHẠM VI HẸP — đã tuân thủ, có bằng chứng:**
  `vcut-poll-quiet-v2.sh` KHÔNG đổi (`1710e480` lúc mở
  = lúc đóng); hàm `count_blockers` dùng chung cho gate
  cửa yên của T4 KHÔNG đổi (grep: `count_blockers` chỉ
  xuất hiện trong poll script, dòng 32/46 — trong suite
  chỉ có 1 lần xuất hiện duy nhất là dòng comment ở
  khối T7: "PHẠM VI HẸP: (A) CHỈ áp cho khối test T7
  này; KHÔNG đổi count_blockers", kèm 3 lệnh poll cũ
  của (B) đã comment; không có trong live-code khối T7).
  Script lock v2 KHÔNG đổi (`520b8baa`). Không có luồng
  đợt 152 nào acquire trong phiên T6 (§2) nên không có
  bằng chứng live nào thêm về gate T4 đợt này — gate
  của T4 không bị ảnh hưởng bởi bất kỳ đổi nào của T6
  (T6 không đổi gì).
- `bash -n` harness t7-control-a152.sh: OK (bản sao của
  t7-control-a151.sh, chỉ đổi hậu tố a151 → a152).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ hai liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(05:39–05:43Z, `test-v2-t6-run1.log` … `run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt ~27–31 s).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Không có FAIL nào ở bất kỳ khối nào.
Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào trong 6 lượt chạy (1443 lúc mở =
1443 lúc đóng, §4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round152-t6/t7-control-a152.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151 §6.2 / T6-150 §6.3** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung.
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a152.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151; live-code
  (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a152-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 519 ms, max 3484 ms, trung bình 2071,41 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'16" (05:43–05:51Z).
- **Đối chiếu cùng churn (cùng phương pháp bơm churn):**

| Phương án | Có churn | Kết quả |
|---|---|---|
| (B), đợt 150 | 30 lần | **2/30 PASS (7%)** |
| Bản cũ (B1−B2=1), đợt 150 | 30 lần | **13/30 PASS (43%)** |
| **(A), đợt 151** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 152 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau một đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ hai liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 240/240 dưới churn qua 2 đợt). Chú thích tỉ lệ
  (như T6-150/151): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 1 (đợt 151) → **2 (đợt
  152 — lần thứ hai xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 33 (đợt 151) → **34 (đợt 152,
  6/6 lượt 9/9)**.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 2 FILE (ĐIỀU (b) KÍCH HOẠT)

Luật đã phê duyệt (đợt 125 §7, parent phê duyệt §12(c);
chú thích ngữ nghĩa `find -mtime` đã ghi vào luật ở đợt 130
theo quyết parent đợt 129 §12.3(e)):
(a) xóa file `cooldown-*` có mtime cũ hơn 7 ngày; (b) trần
mềm 100 file — nếu tổng vượt 100 thì xóa file cũ nhất tới
khi còn 100, nhưng không xóa file <48h; (c) không bao giờ
xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số
file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock
đang trống (`status` TRỐNG). Ngữ nghĩa `find -mtime`:
`-mtime +7` chỉ khớp file **≥192h (8 ngày)**,
`-mtime +2` chỉ khớp file **≥72h** — phương pháp `find`
bảo thủ hơn chữ luật tối đa 24h (xóa muộn, không bao giờ
xóa sớm).

- **Trình tự thực hiện:**
  - 05:39Z (lúc mở): tổng **102 file / 1428 byte** (vượt
    trần mềm 100 — do T8-151 thêm `cooldown-t8-round151`
    + `cooldown-t8-round151-test`, §2); quét ứng viên
    mtime >7 ngày (`find -mtime +7`): **0 file**
    (`prune-candidates.txt`) — điều (a) không kích hoạt.
  - Lock TRỐNG ngay từ lúc mở (05:39:44Z) và vẫn TRỐNG
    lúc kiểm tra lại trước khi prune (05:52:18Z) — điều
    (e) thỏa ngay, **không phải chờ như đợt 151** (đợt
    151 T4-151 giữ lock giữa phiên nên prune phải chờ).
  - 05:52:25Z: điều (b) KÍCH HOẠT: tổng vẫn 102 > 100 →
    xóa 2 file cũ nhất tới khi còn 100. Hai file cũ nhất:
    **`cooldown-s4-wL`, mtime 2026-11-14T21:10:42Z,
    ~128,7h tuổi lúc xóa** và **`cooldown-s4-wN`,
    mtime 2026-11-14T21:10:49Z, ~128,7h tuổi lúc xóa**
    (cả hai ≥48h — thỏa điều kiện không xóa file <48h;
    không phải file đợt hiện tại hay đợt ngay trước —
    file từ thời round ~116; xem §12 F-149-T6-3).
  - **Kết quả prune đợt 152 (lần 27): 2 file đã xóa
    (`cooldown-s4-wL`, `cooldown-s4-wN`).**
    `prune-deleted.txt` ghi đúng 2 dòng (kèm mtime +
    size từng file).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (05:39Z) **102 file / 1428 byte**;
  lúc prune (05:52:25Z, trước khi xóa) **102 file /
  1428 byte** (log lock 1443 dòng — 0 dòng mới trong
  phiên T6, không file cooldown mới, xem §2/§4);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  đóng (05:52Z) vẫn **100 file / 1400 byte**. Số học
  khớp: 102 + 0 = 102 ✓ (0 file cooldown mới trong
  phiên T6), rồi 102 − 2 = 100 ✓ (2 file prune). Không
  file nào bị xóa hay thêm ngoài 2 file prune giữa hai
  lần đếm của đợt này.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 58 file; ≥48h (`-mtime +1`): 74
  file**. Sau prune (05:52Z): **≥192h: 0 file; ≥72h:
  56 file; ≥48h: 72 file** — ≥72h giảm 58 → 56 (xóa
  đúng 2 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-s2`, mtime 2026-11-14T21:29:45Z —
  lúc 05:52Z mới **~128,4h tuổi**.
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ ba liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt này xóa `cooldown-s4-wL` + `cooldown-s4-wN`
  trước khi chúng đủ 7 ngày — cả hai đủ 7 ngày theo
  đồng hồ tường vào khoảng **21/11 21:10Z** nhưng đã
  bị xóa ở đợt 152). T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 28 (T6-153): tổng lock 100 sau prune 27 —
  kiểm lại lúc mở đợt 153** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-152; reboot mới trước phiên chờ T2-152 chứng nhận

- Boot duy nhất trong phiên: **18e179e0** (btime
  05:20:57Z = epoch 1795152057). T6 **KHÔNG chứng nhận**
  gap reboot mới này (thuộc T2-152; xem §2/§0 về số hiệu
  "tiếp sau #42").
- Uptime boot lúc đóng ~31'. `journal --list-boots`
  chỉ 1 dòng 18e179e0 (first entry 05:21:13Z) — khớp
  btime. Boot trước (`fad2aab9`, sau reboot #42) sống
  03:25:16Z → 05:20:57Z = 6.941 s.
- Reboot #42 (btime 03:25:16Z) giết 1 holder t8-round151
  giữa harness đợt 151 — đã phục hồi sạch bằng
  STALE-LOCK (ca double-acquire thứ 9, đã giải thích,
  §4); T2-151/T8-151 đã ghi nhận (LIMITS T8-151
  §F-151-T8-5).

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này.
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-152
  (LIMITS này) — xem §10.
- Lock lúc đóng: TRỐNG, 0 ticket + 100 cooldown (sau
  prune), log 1443 dòng thô / 1437 dòng chính thức,
  409 cặp, 0 đang giữ.
- Cờ `.done`: xem §10 (T6 viết cờ trước khi báo đóng —
  bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round152-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND152_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round152-t6.done` ĐÃ VIẾT
  trước khi báo đóng** (bắt buộc — rút kinh nghiệm đợt
  150 T6 thiếu cờ; T6 đã kiểm chứng cờ có mặt trên đĩa
  bằng `ls` trước khi kết thúc — xem §11).
- Tổng batch đợt 152 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 152 đếm lại bằng dedup toàn cục): **3 batch /
  5 entry** (T0 3 + T1 1 + T6 1). Lũy kế 111–152 tạm
  tính: **394 batch / 785 entry** (391/780 đợt 151 +
  3/5 đợt 152 — số file duy nhất do T10 đếm dedup
  toàn cục; T6 không tự cộng tay vào lũy kế file).

## 11. GHI CHÚ CHO T10-152 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ hai liên tiếp, tổng 240/240 qua 2
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 1 → 2 (lần thứ hai xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 33 → 34 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe (409 cặp, 0 giữ, 0 TIMEOUT mới); prune lần
  27 xóa 2 file, queue về đúng trần 100.
- Reboot mới trước phiên (btime 05:20:57Z, boot
  18e179e0, tiếp sau #42) KHÔNG giết holder nào — T2-152
  đánh số/chứng nhận gap chính thức (T6 không chứng
  nhận).
- 4 socket Xvfb mồ côi của T1-151 đã hết nhờ reboot
  (không phải dọn tay) — mục nợ T6-151 §11 đóng theo
  cách này.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #72?/
  #73? giao T2-151 — mù mới của reboot 05:20:57Z giao
  T2-152; birefnet 0 thử; u2net là fallback chính thức).
- Cờ `round152-t6.done`: T6 viết TRƯỚC khi báo đóng và
  đã `ls` kiểm chứng trên đĩa (khác đợt 150 — lúc đó
  T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

---
**Batch stage / Tổng batch:** T6-152: 1 batch / 1 entry / 1 file. Đợt 152 tới lúc T6 đóng (tạm tính): 3 batch / 5 entry. Lũy kế 111–152 (tạm tính, T10 đếm lại dedup toàn cục): 394 batch / 785 entry. Tổng batch chờ user push (đợt 136–152, tạm tính): 146 batch / 207 entry (143/202 đợt 151 + 3/5 đợt 152 — số file duy nhất do T10 đếm dedup toàn cục).
