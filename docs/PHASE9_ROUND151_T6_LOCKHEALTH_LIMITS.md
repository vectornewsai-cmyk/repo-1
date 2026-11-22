# PHASE9 ROUND151 T6 — TRIỂN KHAI (A) XONG, KIỂM CHỨNG DƯƠNG TÍNH: 120/120 PASS DƯỚI CHURN (VƯỢT MỤC TIÊU ≥95%) + lock KHỎE + prune lần 26: XÓA 2 FILE (điều (b) kích hoạt) + KHÔNG reboot trong phiên — LIMITS

- Đợt: 151, luồng T6 (triển khai phương án (A) cho test flaky T7 +
  sức khỏe lock vite v2 + prune).
  Lượt cron 09:35 +07 20/11/2026 (= 02:35:51Z). Chạy
  02:37:xxZ → 02:52:36Z 20/11/2026, toàn bộ trên một boot duy
  nhất 2e430750 — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (1) triển khai phương án (A) cho test flaky
  T7 theo quyết parent §12.3(b) đợt 150 (quyết (g) đợt 149 về (B) đã
  bị thay thế bằng số đo); (2) kiểm chứng ≥120 lần có churn (mục tiêu
  ≥95% PASS, đối chiếu 2/30 của (B)); (3) lock health; (4) prune
  lần 26.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§6): (A) đã triển khai đúng như
  quyết (suite md5 `63a25be3` → `a89c0676`, chỉ đổi khối T7);
  kiểm chứng DƯƠNG TÍNH: khối T7 trích verbatim từ suite chạy
  120 lần với churn bơm vào — PASS 120/120 (100%, vượt mục tiêu
  ≥95%), B1=1 B2=0 cả 120 lần; đối chiếu (B) 2/30 và bản cũ 13/30
  dưới cùng churn (T6-150 §6.3). Suite đầy đủ 9/9 × 6 lượt, T7 (A)
  xanh cả 6. Lock KHỎE: 399 cặp ACQUIRED→RELEASED, 0 đang giữ,
  0 TIMEOUT mới, 0 "KHÔNG NHẢ". Prune lần 26: xóa 2 file cũ nhất
  (điều (b)), queue 102 → 100 file.**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa script lock
  (bản `520b8baa` giữ nguyên), KHÔNG sửa `vcut-poll-quiet-v2.sh`
  (bản `1710e480` giữ nguyên — phạm vi hẹp của (A), xem §5) — chỉ
  sửa khối T7 trong `test-vite-lock-v2.sh`. Không sửa preview.tsx
  (530e10a7 giữ vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round151-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, wc-open.txt, wc-close.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  analyze-log.py, analyze-log-cleaned-open.txt,
  analyze-log-cleaned-close.txt, prune-candidates.txt,
  prune-deleted.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a151.sh,
  t7-block-a151.sh, t7-a151-churn.log, md5-open.txt,
  md5-close.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
  Vì vậy code (B) được giữ lại trong chính file suite dưới
  dạng đoạn chú thích (xem §5), không chỉ dựa vào git history.

## 0. Trạng thái lúc bắt đầu — BOOT 2e430750 (reboot #41, btime 01:25:51Z); lock TRỐNG; queue 102 file

- **Boot lúc mở và lúc đóng: boot_id
  `2e430750-6ba0-47b6-bf22-902953eff096`, btime 01:25:51Z
  theo /proc/stat** (epoch 1795137951; `uptime -s` =
  01:25:51; `journal --list-boots` chỉ 1 dòng 2e430750,
  first entry 01:26:02Z). Uptime ~1h14' lúc T6 bắt đầu
  (02:39Z), ~1h26' lúc đóng (02:52:36Z). Đây là boot sau
  **reboot #41 (e9295700 → 2e430750)** — xảy ra TRƯỚC
  phiên T6 (01:25:51Z, giữa harness đợt 150; xem aggregate
  đợt 150 §12.3(p) + MEMORY.md). **KHÔNG có reboot trong
  phiên T6** (boot_id giống nhau lúc mở và lúc đóng).
- **Đợt 151 mở 02:35:51Z** — tức **1h10' sau btime boot
  2e430750 (01:25:51Z)**. T6 mở ~02:37Z.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `63a25be3` (bản (B) đợt 150).
  preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp).
- Các luồng đợt 151 khác: lúc T6 mở đã có thư mục
  round151-t0/t1/t2/t4/t5/t7/t8/t9; cờ `.done` đầu tiên
  của đợt 151 là round151-t0.done (đã có trước khi T6
  mở). T4-151 acquire 1 lần trong phiên T6 (xem §2).

## 1. Quét zombie: 0 zombie; 0 vite lúc mở; 4 socket Xvfb mồ côi của T1-151 lúc đóng (0 process Xvfb sống)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 02:39Z
  (mở, `ps-full-open.txt`, 29 dòng) và lúc 02:52:36Z
  (đóng, `ps-full-close.txt`, 32 dòng).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (02:39Z): 0 vite thật đang chạy** — `ss -tlnp`
  trống hoàn toàn (0 cổng lắng nghe); `/tmp/.X11-unix/`
  trống (0 socket). Lock TRỐNG (§2). Đây là trạng thái
  sạch sau reboot #41 + trước khi bất kỳ luồng đợt 151
  nào acquire (trừ T0/T5 đã stage xong trước đó).
- **Lúc đóng (02:52:36Z): 0 vite thật đang chạy** — `ss`
  trống; lock TRỐNG (§2).
- **Lúc đóng: `/tmp/.X11-unix/` có 4 socket X193/X194/X195/
  X196** (x11-close.txt, mtime 02:45–02:46Z). Không còn
  file lock `/tmp/.X193-lock` tương ứng nào được ghi nhận
  (chỉ socket). **0 process Xvfb sống** (`ps` không thấy
  Xvfb nào).
- **Chủ sở hữu 4 socket: T1-151 (test xvfb-lock)** —
  `round151-t1/round151-t1-suites.log` ghi: "B. 3 claim
  song song đều lên Xvfb thật — :196:OK, :195:OK, :194:OK"
  và "C. không còn Xvfb nào của test chạy" — test tự xác
  nhận process đã tắt nhưng socket còn lại (cùng mẫu
  T1-149/T1-150: suite tự tạo socket, T10 dọn tay lúc
  đóng). X193 (mtime 02:45Z) không được nêu tên trong
  3 claim của B — có thể từ bước A của cùng test
  ("lock mồ côi … claim được :211" — display :211
  không phải :193; nguồn gốc X193 chưa xác định chắc,
  ghi nhận để T1-151/T10-151 đối chiếu, không suy đoán).
  **T6 không dọn socket của luồng khác** (không phải
  phạm vi T6) — ghi rõ chủ sở hữu để T1-151 (hoặc
  T10-151 lúc đóng) dọn; T6 đợt sau kiểm lại
  `/tmp/.X11-unix/` còn sót không.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-151).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (khớp đợt 147/148/149/150 — không có lần flip mới
  trong phiên T6; chuỗi flip-flop 63.747 → 63.756 → 63.747
  qua 3 boot giữ nguyên; quyết parent (m) đợt 146: ghi
  làm chú thích, không hành động).

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; +1 chu kỳ hoàn tất của T4-151 trong phiên (hold 259 s)

- **Lúc mở (02:39Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 102 cooldown`,
  rc=0.
- **Lúc đóng (02:52:36Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 100 cooldown`
  (sau prune 2 file — xem §7), rc=0.
- **Log lock +3 dòng kể từ T6-150 đóng** (raw 1362 lúc
  T6-150 đóng → 1402 lúc T6-151 mở → 1405 lúc đóng):
  - +40 dòng trước phiên T6 (t8-round150, 01:02–01:58Z —
    xem §4).
  - **+3 dòng TRONG phiên T6, tất cả là t4 (đợt 151)**:
    TICKET 02:45:21Z → ACQUIRED 02:45:21Z wait_s=0 →
    RELEASED 02:49:40Z hold_s=259 (port 5187, ticket
    `1-1795142721437639163-39163-t4`). Chu kỳ sạch, đủ
    3 dòng TICKET/ACQUIRED/RELEASED.
  - T4 giữ lock 02:45:21Z–02:49:40Z (4'19") — đúng lúc
    T6 kiểm tra prune lần đầu (02:46:51Z lock ĐANG BỊ
    GIỮ, xem §7) nên prune phải chờ tới khi lock trống
    trở lại (02:51:25Z) mới chạy, đúng điều (e).
- **Không có ACQUIRED nào bị reboot giết trong phiên**
  (không có reboot trong phiên; dòng log cuối cùng
  02:49:40Z là RELEASED của t4).
- **File cooldown mới duy nhất kể từ T6-150 đóng:
  `cooldown-t8-round150` và `cooldown-t8-round150-test`**
  (2 file — đưa tổng queue từ 100 lên 102, kích hoạt
  điều (b) ở prune lần 26, §7). File `cooldown-t4`
  được **ghi đè** lúc T4-151 release (mtime
  02:49:40Z = đúng giờ RELEASED) — không phải file
  mới, không làm tăng tổng queue. Ghi nhận: sau
  RELEASED của t4 KHÔNG có dòng COOLDOWN nào trong log
  (grep `t4 COOLDOWN` = 0) — cùng mẫu các release
  trước của t4 (đợt 149: release 21:03:36Z cũng chỉ
  ghi đè file, không có dòng COOLDOWN; xem T6-150 §2).
  Đây là hành vi có sẵn của đường release t4, không
  phải dị thường mới — T6 đợt sau không cần điều tra
  thêm trừ khi T4 báo khác.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 133 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 1 chu kỳ mới của
  t4-151 chạy trên thứ tự mới và sạch** (đủ TICKET +
  ACQUIRED + RELEASED — xem §2).
  - Cộng với 132 chu kỳ T6-150 đã đếm = **133 chu kỳ
    liên tiếp sạch trên thứ tự mới** (132 đợt 150 +
    1 đợt này).
- **Chỉ đổi duy nhất đợt này là khối T7 trong suite test**
  (`test-vite-lock-v2.sh` md5 `63a25be3` → `a89c0676` —
  xem §5). Script lock và poll không đổi.

## 4. Nhất quán log lock: 1399 dòng chính thức lúc đóng, 399 cặp, 0 đang giữ, 0 double-acquire mới, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
diff: bản đã lọc = raw trừ đúng 6 dòng đó, diff exit 0,
cả lúc mở và lúc đóng).
Bản đã lọc lúc đóng: **1399 dòng** (raw 1405) — **+43 dòng
kể từ T6-150 đóng** (40 dòng t8-round150 + 3 dòng t4-151).
**KHỚP ĐÚNG số T6-150 đếm lúc đóng cộng thêm 10 chu kỳ
hoàn tất của t8-round150 + 1 acquire bị reboot #41 giết
đã phục hồi + 1 chu kỳ hoàn tất của t4-151** — xem bảng
đối chiếu dưới.

| Chỉ số (bản đã lọc) | T6-150 đóng | T6-151 mở | T6-151 đóng | Δ trong phiên T6-151 |
|---|---|---|---|---|
| Tổng dòng | 1356 | 1396 | 1399 | +3 (t4-151) |
| TICKET | — | 412 | 418 | +1 |
| ACQUIRED | — | 406 | 407 | +1 |
| RELEASED | — | 398 | 399 | +1 |
| COOLDOWN | — | 156 | 156 | 0 |
| STALE-LOCK | — | 8 | 8 | 0 |
| STALE-TICKET | — | 1 | 1 | 0 |
| TIMEOUT | — | 10 | 10 | 0 |
| Cặp ACQUIRED→RELEASED | 388 | 398 | 399 | +1 (t4-151, hold 259 s) |
| Đang giữ cuối log | 0 | 0 | 0 | 0 |
| Double-acquire | 7 | 8 | 8 | 0 mới |

- **+40 dòng t8-round150 (trước phiên T6, 01:02–01:58Z):**
  10 chu kỳ hoàn tất (holds 183 / 80 / 902 / 70 / 131 /
  901 / 70 / 120 / 230 s + 1 chu kỳ hold 0 s của
  t8-round150-test) và **1 acquire bị reboot #41 giết**
  (t8-round150 ACQUIRED 01:24:37Z, reboot #41 btime
  01:25:51Z; t8-round150-test phát hiện STALE-LOCK
  01:31:10Z — "owner pid 68531 chết + không vite trên
  cổng 5490 + curl 000 + boot đổi (tuổi 393s)" — rồi
  acquire lại và release hold 0 s). Đây là ca
  double-acquire thứ 8 (mới — dòng 1375 bản đã lọc,
  t8-round150 ACQUIRED 01:31:34Z sau ACQUIRED 01:24:37Z
  chưa release). Phục hồi sạch, đúng cơ chế STALE-LOCK.
- **8 ca double-acquire toàn bộ đều đã giải thích** (mỗi
  ca đều có dòng STALE-LOCK tương ứng: s3-round116,
  t3-round117, t4, t3-round119, t8-round129, t4,
  t8-round149, t8-round150 — xem `analyze-log-cleaned-close.txt`).
  0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới
  (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt 150),
  0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`khong-nha-grep.txt` rỗng — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE.** Giữ/nhả đúng lúc mở
  và lúc đóng (t4-151 1 chu kỳ sạch hold 259 s + 10 chu
  kỳ t8-round150 sạch + 1 acquire bị reboot #41 giết đã
  phục hồi), 0 zombie, 0 stale mới ngoài ca reboot #41
  đã giải thích, queue 0 ticket, log nhất quán (399 cặp
  + 1 ca reboot-kill mới đã giải thích + 0 đang giữ,
  0 mất dấu khác — số chính thức đã loại 6 dòng repro
  lỗi của T6-132), 0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ"
  trên lock thật đợt 148–151 (toàn đợt) và đợt 151
  (tới 02:52Z), suite 9/9 ×6 lần (T7 (A) xanh cả 6 —
  xem §6), và thứ tự ghi mới đã có **133 chu kỳ thật**
  chứng minh (§3). **Không còn caveat nào về mất dòng
  RELEASED cho các chu kỳ mới** — caveat cũ chỉ còn là
  1 dòng lịch sử (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **T4-151 giữ lock trong
  lúc T6 kiểm tra prune lần đầu** — prune đã chờ đúng
  luật (xem §7); và **4 socket Xvfb mồ côi của T1-151**
  (xem §1) — T6 không dọn, để T1-151/T10-151 xử lý.

## 5. TRIỂN KHAI (A) — chỉ đổi khối T7 trong suite; poll dùng chung KHÔNG đổi (phạm vi hẹp)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**. Kiểm chứng có đối chứng của T6-150 là quyết định:
cùng điều kiện churn, (B) 2/30 PASS, bản cũ 13/30, trial
(A) 30/30. Tiền đề của quyết (g) đợt 149 ("(B) bền trước
mọi churn nền") bị bác bỏ bằng số đo — (B) fail mọi ca
bản cũ fail, cộng thêm ca mới. (A) đếm chỉ marker giả/PID
giả, đúng đại lượng cần kiểm và bền trước churn nền.

- **Đổi gì trong suite (duy nhất khối T7):**
  `apps/web/scripts/test-vite-lock-v2.sh` md5 `63a25be3` →
  **`a89c0676`**. Diff chỉ khối T7 (giữa marker
  `T7-BLOCK-START` / `T7-BLOCK-END`, thêm mới để harness
  trích verbatim — xem §6): bỏ 3 lần poll `$POLL` +
  đọc N0/B1/B2 từ poll log + assert `B1−N0=1 VÀ B2−N0=0`;
  thay bằng hàm `count_fake` đếm CHỈ process giả
  (`ps -eo args | grep -E "[W]ebProcess-q4test" |
  grep -v grep | wc -l` — bracket trick + `grep -v grep`,
  không tự đếm) + assert `B1=1 B2=0`. Spawn giả, sleep,
  kill giả giữ nguyên hình thức (`exec -a
  WebProcess-q4test sleep 25`, sleep 1 s giữa các lần
  đếm — cùng cửa sổ ~2 s như bản (B), nên phép so sánh
  với 2/30 của (B) là cùng điều kiện).
- **PHẠM VI HẸP — đã tuân thủ, có bằng chứng:**
  `vcut-poll-quiet-v2.sh` KHÔNG đổi (`1710e480` lúc mở
  = lúc đóng); hàm `count_blockers` dùng chung cho gate
  cửa yên của T4 KHÔNG đổi (grep: `count_blockers` chỉ
  xuất hiện trong poll script, dòng 32/46 — không có
  trong khối T7 mới ngoài dòng comment ghi rõ phạm vi).
  Script lock v2 KHÔNG đổi (`520b8baa`). T4-151 đã
  acquire/release bình thường trong phiên (§2) — gate
  của T4 không bị ảnh hưởng bởi đổi này.
- **Code (B) giữ trong lịch sử — 2 lớp:**
  (1) đoạn chú thích trong chính khối T7 của suite (toàn
  bộ lệnh (B): 3 lần poll + công thức đọc N0/B1/B2 +
  assert cũ `B1−N0=1 VÀ B2−N0=0`, kèm md5 bản (B)
  `63a25be3` + tham chiếu LIMITS T6-150 §6 và harness
  đối chứng `round150-t6/t7-control.sh`); (2) bản (B)
  nguyên vẹn còn nằm trong paths đã stage đợt 150
  (`phase9-round150-t6-lockhealth.txt` stage suite md5
  `63a25be3` — T10 đối chiếu lúc push). Lưu ý: repo
  local không có `.git` nên "git history" ở đây là
  lịch sử stage + LIMITS, không phải commit git.
- `bash -n` suite sau sửa: OK. Các khối T1–T6, T8
  không đổi (xem §6: suite 9/9 ×6).

## 6. KIỂM CHỨNG (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, vượt mục tiêu ≥95%)

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(02:41–02:44Z, `test-v2-t6-run1.log` … `run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt ~27 s).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Không có FAIL nào ở bất kỳ khối nào.

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round151-t6/t7-control-a151.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
**đã sửa** (không viết lại tay), chạy N=120 lần với
churn bơm vào. Churn **giống hệt T6-150 §6.3** (để so
sánh được): 1 process `WebProcess-churn` (khớp mẫu
poll) xuất hiện sau delay ngẫu nhiên 0,5–3,5 s, sống
1,5 s — mô phỏng vite/WebKit của luồng khác khởi
động/tắt trong cửa sổ giữa các lần đếm. Chỉ chạy trên
/tmp, không đụng lock thật, không đụng poll chung.
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a151.sh` md5 `dc973443030249a262ff63cbc62231d5`;
  live-code (bỏ comment/dòng trống) của khối đã trích
  md5 `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite đã sửa (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a151-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 513 ms, max 3488 ms, trung bình 2098,97 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'21" (02:44–02:52Z).
- **Đối chiếu cùng churn (T6-150 §6.3, cùng phương pháp
  bơm churn):**

| Phương án | Có churn | Kết quả |
|---|---|---|
| (B), đợt 150 | 30 lần | **2/30 PASS (7%)** |
| Bản cũ (B1−B2=1), đợt 150 | 30 lần | **13/30 PASS (43%)** |
| **(A), đợt 151** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) ĐÃ SỬA ĐƯỢC flaky.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — là phương án DUY NHẤT trong ba
  phương án có tính chất này, và lần này đã chứng minh
  bằng 120 lần chạy trên đúng code suite (không chỉ
  trial trong harness như đợt 150: trial (A) 30/30).
  Mục tiêu brief (≥95% PASS dưới churn) **vượt**:
  100%. Chú thích tỉ lệ (như T6-150): 120/120 là tỉ
  lệ dưới churn bơm vào gần như mọi lần chạy (stress),
  không phải tỉ lệ flake sản xuất — điều đo được là
  SO SÁNH TƯƠNG ĐỐI dưới cùng điều kiện: (A) 100% vs
  (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 0 (đợt 150, theo quyết
  (b)) → **1 (đợt 151 — lần đầu xanh kép trở lại sau
  khi chuyển sang (A))**. Chuỗi suite xanh về bản
  chất: 32 (đợt 150, theo quyết (b)) → **33 (đợt 151,
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
  - 02:39Z (lúc mở): tổng **102 file / 1428 byte** (vượt
    trần mềm 100 — do T8-150 thêm `cooldown-t8-round150`
    + `cooldown-t8-round150-test`, §2); quét ứng viên
    mtime >7 ngày (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng) — điều (a) không kích
    hoạt.
  - 02:46:51Z: kiểm tra lại trước khi prune — **lock
    ĐANG BỊ T4-151 GIỮ** (acquire 02:45:21Z, port 5187)
    nên điều (e) KHÔNG thỏa — **prune CHỜ**, không chạy
    khi lock bận. Đây là lần đầu tiên (theo hồ sơ T6
    các đợt) prune phải chờ vì lock bận giữa phiên;
    ghi nhận đúng luật, không lách.
  - 02:51:25Z: lock TRỐNG trở lại (T4-151 đã release
    02:49:40Z, hold 259 s) — điều (e) thỏa. Điều (b)
    KÍCH HOẠT: tổng vẫn 102 > 100 → xóa 2 file cũ nhất
    tới khi còn 100. Hai file cũ nhất:
    **`cooldown-s4-w3`, mtime 2026-11-14T21:08:59Z,
    ~125,7h tuổi lúc xóa** và **`cooldown-s4-hold2`,
    mtime 2026-11-14T21:10:37Z, ~125,7h tuổi lúc xóa**
    (cả hai ≥48h — thỏa điều kiện không xóa file <48h;
    không phải file đợt hiện tại hay đợt ngay trước —
    file từ thời round ~116; xem §12 F-149-T6-3).
  - **Kết quả prune đợt 151 (lần 26): 2 file đã xóa
    (`cooldown-s4-w3`, `cooldown-s4-hold2`).**
    `prune-deleted.txt` ghi đúng 2 dòng (kèm mtime +
    size từng file).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (02:39Z) **102 file / 1428 byte**;
  lúc prune (02:51:25Z, trước khi xóa) **102 file /
  1428 byte** (log lock 1405 dòng — T4-151 đã release
  nhưng chỉ ghi đè `cooldown-t4`, không thêm file mới,
  xem §2); **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  đóng (02:52:36Z) vẫn **100 file / 1400 byte**. Số học
  khớp: 102 + 0 = 102 ✓ (0 file cooldown mới trong
  phiên T6 — T4 ghi đè, không thêm), rồi 102 − 2 = 100
  ✓ (2 file prune). Không file nào bị xóa hay thêm
  ngoài 2 file prune giữa hai lần đếm của đợt này.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 55 file; ≥48h (`-mtime +1`): 74
  file**. Sau prune (02:51Z): **≥192h: 0 file; ≥72h:
  53 file; ≥48h: 72 file** — ≥72h giảm 55 → 53 (xóa
  đúng 2 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học, khác đợt 150 khi 3 file vừa đủ 72h
  trong phiên). File cũ nhất còn lại nay là
  `cooldown-s4-wL`, mtime 2026-11-14T21:10:42Z —
  lúc 02:51Z mới **~125,7h tuổi**.
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại**
  lần thứ hai liên tiếp (đợt 150 xóa `cooldown-s4-w2`,
  đợt này xóa `cooldown-s4-w3` + `cooldown-s4-hold2`
  trước khi chúng đủ 7 ngày — cả hai đủ 7 ngày theo
  đồng hồ tường vào khoảng **21/11 21:08–21:10Z**
  nhưng đã bị xóa ở đợt 151). T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 27 (T6-152): tổng lock 100 sau prune 26 —
  kiểm lại lúc mở đợt 152** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-151; reboot #41 đã chốt ở đợt 150

- Boot duy nhất trong phiên: **2e430750** (btime
  01:25:51Z = epoch 1795137951). T6 **KHÔNG chứng nhận**
  gap reboot #41 (thuộc T2-151; xem aggregate đợt 150
  §12.3(p) về nghịch lý đồng hồ #41 + MEMORY.md).
- Uptime boot lúc đóng ~1h26'. `journal --list-boots`
  chỉ 1 dòng 2e430750 (first entry 01:26:02Z) — khớp
  btime.

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline trừ suite (đổi đúng
  khối T7 như quyết).
- Cây repo: chỉ 2 file đổi/thêm trong batch T6-151
  (suite + LIMITS này) — xem §10.
- Lock lúc đóng: TRỐNG, 0 ticket + 100 cooldown (sau
  prune), log 1405 dòng thô / 1399 dòng chính thức,
  399 cặp, 0 đang giữ.
- Cờ `.done`: xem §10 (T6 viết cờ trước khi báo đóng —
  bắt buộc theo brief, rút kinh nghiệm đợt 150 T6
  thiếu cờ).

## 10. BATCH STAGE — 1 batch / 2 entry / 2 file (paths NUL-delimited, đã verify read-back)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round151-t6-lockhealth.txt`
  (2 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 2 dòng đúng tên file):
  - `apps/web/scripts/test-vite-lock-v2.sh` (sửa khối T7
    sang (A); md5 `63a25be3` → `a89c0676`)
  - `docs/PHASE9_ROUND151_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round151-t6.done` ĐÃ VIẾT
  trước khi báo đóng** (bắt buộc — đợt 150 T6 thiếu cờ;
  T6 đã kiểm chứng cờ có mặt trên đĩa bằng `ls` trước
  khi kết thúc — xem §11).
- Tổng batch đợt 151 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 151 đếm lại bằng dedup toàn cục): **3 batch /
  6 entry** (T0 2 + T5 2 + T6 2). Lũy kế 111–151 tạm
  tính: **391 batch / 780 entry** (388/774 đợt 150 +
  3/6 đợt 151 — số file duy nhất do T10 đếm dedup
  toàn cục; T6 không tự cộng tay vào lũy kế file).

## 11. GHI CHÚ CHO T10-151 / PARENT

- (A) đã triển khai + kiểm chứng dương tính (120/120
  dưới churn, 6/6 suite 9/9). Không còn nợ nào về
  (A)/(B): quyết (b) đợt 150 đã thực thi xong; (B)
  giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 0 → 1 (lần đầu xanh kép trở lại);
  chuỗi suite xanh về bản chất: 32 → 33 (theo quy ước
  đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe (399 cặp, 0 giữ, 0 TIMEOUT mới); prune
  lần 26 xóa 2 file, queue về đúng trần 100.
- 4 socket Xvfb mồ côi của T1-151 (X193–X196, 0
  process sống) — T6 không dọn; T1-151/T10-151 xử lý
  lúc đóng đợt (cùng mẫu T1-150).
- Reboot #41 (btime 01:25:51Z) giết 1 holder t8-round150
  trước phiên — đã phục hồi sạch bằng STALE-LOCK (ca
  double-acquire thứ 8, đã giải thích); T2-151 xử lý
  mù #73? + gap #41 (T6 không chứng nhận).
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #72?/
  #73? giao T2-151; birefnet 0 thử; u2net là fallback
  chính thức).
- Cờ `round151-t6.done`: T6 viết TRƯỚC khi báo đóng và
  đã `ls` kiểm chứng trên đĩa (khác đợt 150 — lúc đó
  T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

---
**Batch stage / Tổng batch:** T6-151: 1 batch / 2 entry / 2 file. Đợt 151 tới lúc T6 đóng (tạm tính): 3 batch / 6 entry. Lũy kế 111–151 (tạm tính, T10 đếm lại dedup toàn cục): 391 batch / 780 entry. Tổng batch chờ user push (đợt 136–151, tạm tính): 143 batch / 202 entry (140/196 đợt 150 + 3/6 đợt 151 — số file duy nhất do T10 đếm dedup toàn cục).
