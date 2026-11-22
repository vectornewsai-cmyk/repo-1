# PHASE9 ROUND159 T6 — (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 9 LIÊN TIẾP) + #59 KHÔNG GIẾT HOLDER + prune lần 34: XÓA 1 FILE — LIMITS

- Đợt: 159, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 09:35 +07 21/11/2026 (= 02:35:51Z 21/11). Chạy
  02:39Z → 02:52Z 21/11/2026. Lúc mở đã ở trên boot
  `eec65561` (btime 01:33:47Z) — reboot #59 (chưa có cờ
  T0-159 lúc T6 mở; T6 KHÔNG tự chứng nhận số hiệu #59,
  chỉ chứng nhận từ log lock rằng #59 không giết holder —
  xem §2/§8); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 9 liên tiếp nếu đạt — tổng
  1080/1080); ghi rõ số chu kỳ, điều kiện churn, boot đo;
  (b) kiểm tra lock khỏe: số cặp, số đang giữ, TIMEOUT mới,
  "KHÔNG NHẢ" — trích ĐÚNG CỘT (cảnh báo brief: T1-157
  từng trích sai cột; T6 trích bằng cột $3 qua
  `analyze-log.py`, xem §4); (c) chạy suite liên quan và
  ghi exit code + thời gian thật; (d) prune lần 34: đếm
  queue lúc mở, xóa file theo đúng quy tắc prune các đợt
  trước, ghi rõ xóa file nào, queue trước/sau; kiểm tra
  reboot #59 có giết holder nào không; (e) ghi sai số riêng
  F-159-T6-n; (f) stage paths NUL-delimited; (g) viết cờ
  .done CÓ NỘI DUNG.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–158,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–158); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (476 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) —
  VỚI 1 LƯU Ý ĐẾM: double-acquire theo analyzer GIỮ 10,
  0 ca mới (ca artifact t4 18:02:49Z vẫn là ca mới nhất;
  xem §4). Reboot #59 KHÔNG giết holder nào (lock trống
  43m59s trước btime, 0 dòng log sau lần RELEASED cuối
  00:49:48Z, 0 STALE-LOCK mới — xem §2/§8). Prune lần 34:
  xóa 1 file cũ nhất (điều (b)), queue 101 → 100 file —
  KHÔNG phải chờ luồng khác nhả lock đợt này (lock TRỐNG
  cả lúc mở lẫn lúc prune; khác đợt 158 phải chờ t4-158).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round159-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, queue-open.txt,
  queue-close.txt, queue-oldest-open.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, vite-lock-v2-raw-final.log,
  analyze-log.py,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt,
  new-lines-since-t6-158.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a159.sh,
  t7-control-a159.stdout.log, t7-block-a159.sh,
  t7-a159-churn.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT eec65561 (#59, btime 01:33:47Z); lock TRỐNG; queue 101 file (khớp T10-158 đóng + 1 file mới)

- **Boot lúc mở và lúc đóng: boot_id
  `eec65561-8a81-4f1a-99d6-a1ea81606127`, btime 01:33:47Z
  theo /proc/stat** (epoch 1795224827; `uptime -s` =
  01:33:47; `journal --list-boots` chỉ 1 dòng eec65561,
  first entry 01:33:59Z). Uptime ~65' lúc T6 bắt đầu
  (02:39Z), ~77' lúc snapshot đóng (02:50Z). Boot này là
  #59 theo brief giao (btime 01:33:47Z) — **T6 KHÔNG tự
  chứng nhận số hiệu #59** (thuộc T0-159/T2-159; lúc T6
  mở chưa có cờ `round159-t0.done` trên đĩa); T6 chỉ
  chứng nhận từ log lock rằng #59 không giết holder (xem
  §2/§8). **KHÔNG có reboot trong phiên T6** (boot_id
  giống nhau lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc 02:51Z — Cloudflare `Date:
  Sat, 21 Nov 2026 02:51:20 GMT` vs local 02:51:19Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, không còn dấu
  hiệu chạy nhanh ~42–50' như đợt 156; khớp T0-158).
  Các mốc wall đợt 159 đọc trực tiếp được.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Lưu ý phương pháp: `md5-open.txt` ghi lại các giá trị
  md5 đã đo bằng lệnh `md5sum` lúc mở (~02:39Z, xem log
  phiên); `md5-close.txt`/`md5-final.txt` đo lại từ đĩa
  lúc đóng — các bản khớp nhau từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp số học
  từ T6-158 đóng: 100 sau prune 33 + 1 file cooldown mới
  `cooldown-t8-round158`, mtime 00:49:48Z (§2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật lúc mở và lúc đóng; X11 trống lúc mở, 3 socket luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 02:39Z
  (mở, `ps-full-open.txt`, 10 dòng) và lúc 02:50Z
  (đóng, `ps-full-close.txt`).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở và lúc đóng: 0 vite thật đang chạy** —
  `ss -tlnp` trống hoàn toàn cả hai snapshot; 2 dòng chứa
  chuỗi "vite" trong snapshot ps lúc đóng đều KHÔNG phải
  process vite: 1 dòng là chính lệnh snapshot của T6
  (tham số `vite-lock-v2` trong lệnh) + 1 dòng là lệnh
  poller của T4-159 (chứa chuỗi `vite-cfg` trong text
  lệnh) — cùng bẫy tự-tham-chiếu như đợt 155/156/157/158.
- **Lúc mở: `/tmp/.X11-unix/` trống. Lúc đóng: 3 socket
  X193 (02:46Z) / X194 / X195 (02:44Z) — của các luồng
  khác đợt 159** (T6 không khởi động Xvfb/vite nào,
  không đụng tới các process này, không kill process nào
  trong phiên này). Process luồng khác lúc đóng: poller
  T4-159 (pid 29871, pre-flight 02:43Z, đang chạy
  `poll-wait-t4-159.sh`).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-159).
  Inotify: `max_user_watches` = **63747** lúc kiểm cuối
  (~02:51Z, khớp đợt 147–158 — không có lần flip mới
  trong phiên T6; quyết parent (m) đợt 146: ghi làm chú
  thích, không hành động).
- Tải hệ thống trong phiên: các luồng đợt 159 khởi động
  dần (poller T4-159 02:43Z, t4 acquire lock 02:46:28Z)
  — harness churn vẫn 120/120 (xem §6).
  Suite đợt này chạy 22–29 s/lượt (tương đương đợt 158:
  23–31 s/lượt).

## 2. Lock lúc mở: TRỐNG; trong phiên: 1 chu kỳ t4 hoàn tất sạch; +26 dòng kể từ T6-158 đóng — TẤT CẢ CỦA t8-round158, TRƯỚC phiên T6

- **Lúc mở (02:39Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (02:50Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`
  (trước prune), rc=0. Khác đợt 158 (t4-158 giữ lock lúc
  đóng nên prune phải chờ) — đợt này **prune KHÔNG phải
  chờ** (xem §7).
- **Log lock +26 dòng kể từ T6-158 đóng** (raw 1659 lúc
  T6-158 đóng → 1685 lúc T6-159 mở → 1688 lúc snapshot
  đóng): 26 dòng đều trước phiên T6; **+3 dòng trong
  phiên T6-159** (diff bản đã lọc mở/đóng, §4) — 1 chu kỳ
  của t4, không phải của suite/harness T6 (suite +
  harness chạy trên log riêng trong /tmp).
- Đối chiếu 26 dòng (khớp đúng từng dòng, file
  `new-lines-since-t6-158.txt`):
  - t8-round158: 7 chu kỳ HOÀN TẤT (00:07:35Z →
    00:49:48Z; holds 152 / 70 / 902 / 901 / 60 / 120 /
    230 s; 5 dòng COOLDOWN kèm theo, các lần chờ
    14950–14972 ms trên cổng 5490/5390).
  - Tổng: Δ TICKET +7, Δ ACQUIRED +7, Δ RELEASED +7,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **7/7 chu kỳ mới hoàn
    tất sạch.**
- Đối chiếu 3 dòng trong phiên (diff mở/đóng, của t4):
  - 1 chu kỳ HOÀN TẤT (02:46:28Z → 02:50:00Z, hold 212 s,
    wait_s=0, cổng 5187, + 0 COOLDOWN — file
    `cooldown-t4` chỉ cập nhật mtime 02:50Z, không thêm
    file mới).
  - Tổng trong phiên: Δ TICKET +1, Δ ACQUIRED +1,
    Δ RELEASED +1, Δ COOLDOWN +0, Δ STALE-LOCK +0,
    Δ TIMEOUT +0. **1/1 chu kỳ trong phiên hoàn tất sạch.**
- **KHOẢNG TRỐNG LOG 00:49:48Z → 02:46:28Z (1h56m40s):
  KHÔNG có dòng lock nào trong khoảng 00:49:48Z →
  01:33:47Z và 01:33:47Z → 02:46:28Z.** Reboot #59
  (btime 01:33:47Z) rơi vào khoảng này — xem §8.
- **REBOOT #59 (btime 01:33:47Z) KHÔNG giết holder nào:**
  dòng lock cuối trước reboot là t8-round158 RELEASED
  00:49:48Z (hold 230 s, số học khớp); dòng đầu sau
  reboot là t4 TICKET 02:46:28Z — tức lock trống
  **43m59s trước reboot** và không có dòng lock nào sau
  00:49:48Z (`awk '$1 > "2026-11-21T00:49:48Z"'` = 0
  dòng). Không có ACQUIRED nào chưa release tại thời
  điểm #59, không có dòng STALE-LOCK mới nào (vẫn 10,
  ca mới nhất 16:31:32Z 20/11), still held = 0 lúc T6-159
  mở, lock TRỐNG xác minh độc lập lúc mở 02:39Z.
  **Kết luận: #59 không giết holder nào — verdict này
  sạch hơn #58 (sát nút) vì khoảng trống 44 phút, không
  còn nghịch lý đồng hồ boot cũ.**
- **File cooldown mới kể từ T6-158 đóng:
  `cooldown-t8-round158` (mtime 00:49:48Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 158 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào. (File `cooldown-t4`
  có mtime cập nhật 02:50Z do chu kỳ t4 lúc 02:50:00Z —
  cùng tên file, không tăng tổng số file.)

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 210 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 8 chu kỳ hoàn tất
  kể từ T6-158 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2; gồm 7 chu
  kỳ t8-round158 trước phiên, và 1 chu kỳ t4 trong phiên).
  - Cộng với 202 chu kỳ T6-158 đã đếm = **210 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (202 đợt
    158 + 8 đợt này). Chu kỳ t4 bị #50 giết (15:01:45Z,
    đợt 155) KHÔNG tính vào 210 (dở dang, không có
    RELEASED) — nhưng chính cơ chế STALE-LOCK đã xử lý
    đúng trường hợp này (reclaim sạch, không kẹt, không
    double-acquire thật — xem §4 về artifact đếm).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1682 dòng chính thức lúc kiểm cuối, 476 cặp, 0 đang giữ, double-acquire GIỮ 10 (0 ca mới), 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa;
cảnh báo brief đợt này: T1-157 từng trích sai cột — T6
trích đúng cột và ghi rõ nguồn lệnh tại đây). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
diff: bản đã lọc = raw trừ đúng 6 dòng đó; diff bản đã
lọc mở/đóng chỉ có 3 dòng mới của t4, §2).
Bản đã lọc lúc đóng: **1682 dòng** (raw 1688) — **+29 dòng
kể từ T6-158 đóng** (26 dòng trước phiên + 3 dòng trong
phiên: 1653 → 1679 → 1682). Kiểm cuối sau prune
(02:51Z 21/11): bản đã lọc **1682 dòng** (raw 1688),
RELEASED 476, cặp 476, đang giữ 0, double-acquire 10 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-158 đóng | T6-159 mở | T6-159 đóng (snapshot) | Δ trong phiên T6-159 |
|---|---|---|---|---|
| Tổng dòng | 1653 | 1679 | 1682 | +3 |
| TICKET | 489 | 496 | 497 | +1 |
| ACQUIRED | 478 | 485 | 486 | +1 |
| RELEASED | 468 | 475 | 476 | +1 |
| COOLDOWN | 197 | 202 | 202 | +0 |
| STALE-LOCK | 10 | 10 | 10 | +0 |
| STALE-TICKET | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 468 | 475 | 476 | +1 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 |
| Double-acquire | 10 | 10 | 10 | 0 mới trong phiên |

- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối:**
  ACQUIRED 486 − RELEASED 476 = 10 ACQUIRED chưa release
  trong lịch sử log — nhưng cả 10 đều đã được xử lý: 9 ca
  double-acquire cũ (đã giải thích các đợt trước) + 1 ca
  t4 15:01:45Z (STALE-LOCK #10 lúc 16:31:32Z đã reclaim
  — §2 T6-156). Analyzer xác nhận `still held at end of
  log: 0` ở cả ba snapshot (mở/đóng/kiểm cuối). Lock
  TRỐNG lúc mở và lúc đóng — status xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 10 — 0 CA MỚI kể từ T6-158 đóng
  và trong phiên T6-159.** Danh sách 10 ca của analyzer
  giống hệt đợt 158 (dòng 79/148/200/262/781/888/1321/
  1375/1417/1581 bản đã lọc); ca mới nhất vẫn là artifact
  t4 18:02:49Z sau reclaim #50 (xem §4 T6-157). Các lần
  acquire lại đợt này (t8-round158 7 lần, t4 02:46:28Z)
  đều ghép cặp RELEASED đúng và KHÔNG bị gắn cờ — vì máy
  trạng thái analyzer đã về 0 sau RELEASED 18:06:35Z.
  **Kết luận: 0 double-acquire THẬT mới.** T10-159 lưu ý
  khi đối chiếu: số "10" của analyzer gồm 9 ca cũ + 1
  artifact; không có sự kiện 2 holder cùng lúc nào mới.
- **0 double-acquire mới** kể từ T6-158 đóng (theo nghĩa
  cơ chế). 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (8 chu kỳ mới sạch kể từ T6-158 đóng),
  0 zombie lúc đóng, 0 stale mới trong phiên, queue
  0 ticket, log nhất quán (476 cặp + 0 đang giữ lúc kiểm
  cuối, 0 mất dấu khác — số chính thức đã loại 6 dòng
  repro lỗi của T6-132), 0
  TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–159 (toàn đợt) và đợt 159 (tới ~02:52Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **210 chu kỳ thật** chứng minh (§3).
  Caveat duy nhất còn lại: **reboot #50 giết holder t4**
  (đợt 155) — cơ chế STALE-LOCK đã reclaim đúng (không
  kẹt, không double-acquire thật); và **reboot #59 KHÔNG
  giết holder** (xem §8 — khoảng trống 44 phút, verdict
  sạch).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158 §6.2.
  File khối T7 đã trích `t7-block-a159.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157
  và 158 (cùng md5). Harness đợt này chạy đúng code (A)
  trong suite, không phải bản sao tay (xem §6.2).
- **PHẠM VI HẸP — đã tuân thủ, có bằng chứng:**
  `vcut-poll-quiet-v2.sh` KHÔNG đổi (`1710e480` lúc mở
  = lúc đóng); hàm `count_blockers` dùng chung cho gate
  cửa yên của T4 KHÔNG đổi (grep: `count_blockers` xuất
  hiện 2 lần trong poll script, dòng 32/46 — trong suite
  chỉ có 1 lần xuất hiện duy nhất là dòng comment ở
  khối T7, dòng 151: "PHẠM VI HẸP: (A) CHỈ áp cho khối
  test T7 này; KHÔNG đổi count_blockers", kèm 3 lệnh poll
  cũ của (B) đã comment; không có trong live-code khối T7).
  Script lock v2 KHÔNG đổi (`520b8baa`). T6 không đổi
  gì trong phiên (chỉ xóa 1 file cooldown theo luật
  prune đã phê duyệt — §7; không đụng code).
- `bash -n` harness t7-control-a159.sh: OK (bản sao của
  t7-control-a158.sh, chỉ đổi hậu tố a158 → a159 + sửa
  comment "đợt 158" → "đợt 159" — lần này sed đổi cả
  header, không còn sót như F-158-T6-2).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–158 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ chín liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(02:40–02:43Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 22/27/29/23/
23/27 s — tương đương đợt 158: 23/26/31/23/23/26 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào do 6 lượt chạy (3 dòng mới trong
phiên đều là của t4, §2/§4).
- Không có lỗi thao tác ở bước suite đợt này (khác
  F-158-T6-1: đã dùng `date +%s` đo thời gian ngay từ đầu,
  không dùng `/usr/bin/time`).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round159-t6/t7-control-a159.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot eec65561 (#59,
btime 01:33:47Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a159.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157 và 158; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a159-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 512 ms, max 3497 ms, trung bình 1988,19 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'02" (02:43:08–02:50:10Z).
- **Đối chiếu cùng churn (cùng phương pháp bơm churn):**

| Phương án | Có churn | Kết quả |
|---|---|---|
| (B), đợt 150 | 30 lần | **2/30 PASS (7%)** |
| Bản cũ (B1−B2=1), đợt 150 | 30 lần | **13/30 PASS (43%)** |
| **(A), đợt 151** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 152 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 153 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 154 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 155 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 156 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 157 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 158 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 159 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau tám đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ chín liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 1080/1080 dưới churn qua 9 đợt). Chú thích tỉ lệ
  (như T6-150–158): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 8 (đợt 158) → **9 (đợt
  159 — lần thứ chín xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 40 (đợt 158) → **41 (đợt 159,
  6/6 lượt 9/9)**.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 1 FILE (ĐIỀU (b) KÍCH HOẠT)

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
  - 02:39Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-158 thêm `cooldown-t8-round158`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG lúc mở (02:39Z) VÀ vẫn TRỐNG lúc snapshot
    đóng (02:50Z) — điều (e) thỏa ngay, **prune KHÔNG
    phải chờ** (khác đợt 158: T6-158 phải chờ t4-158 nhả
    lock; đợt này chu kỳ t4 trong phiên đã hoàn tất
    02:50:00Z trước khi prune). T6 xác minh lại TRỐNG
    ngay trước prune (02:50:57Z, `status-before-prune.txt`).
  - 02:50:57Z 21/11: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-t8-round117`, mtime 2026-11-15T09:01:21Z,
    137,83h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round 117; xem §12
    F-149-T6-3).
  - **Kết quả prune đợt 159 (lần 34): 1 file đã xóa
    (`cooldown-t8-round117`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (02:39Z) **101 file / 1414 byte**;
  lúc snapshot đóng (02:50Z, trước khi prune) **101 file /
  1414 byte** (log lock tăng 3 dòng trong phiên nhưng
  không thêm file cooldown mới — file `cooldown-t4` chỉ
  cập nhật mtime, xem §2);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (02:51Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-158 đóng: 100 + 1 file mới
  (`cooldown-t8-round158`) = 101 ✓ — khớp đúng số T10-158 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 64 file; ≥48h (`-mtime +1`): 78
  file**. Sau prune (02:51Z): **≥192h: 0 file; ≥72h:
  63 file; ≥48h: 77 file** — ≥72h giảm 64 → 63 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t4-hold`, mtime 2026-11-15T09:12:47Z —
  lúc 02:51:50Z mới **~137,65h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 64, tăng 1 so với lúc
  mở đợt 158 (63) — 1 file khác đã vượt ngưỡng 72h trong
  khoảng giữa 2 đợt; khớp số học, không phải mâu thuẫn.
  ≥48h lúc mở 78, tăng 1 so với đợt 158 (77) — cùng lý do.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ mười liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt 156 xóa
  `cooldown-s3-round116`, đợt 157 xóa
  `cooldown-s10-round116`, đợt 158 xóa `cooldown-t6`,
  đợt này xóa `cooldown-t8-round117` trước khi nó đủ 7
  ngày — nó đủ 7 ngày theo đồng hồ tường vào khoảng
  **22/11 09:01Z** nhưng đã bị xóa ở đợt 159, sớm ~30h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 35 (T6-160): tổng lock 100 sau prune 34 —
  kiểm lại lúc mở đợt 160** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t4-hold` đủ 7 ngày ~22/11 09:12Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-159; #59 KHÔNG giết holder; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **eec65561** (btime
  01:33:47Z = epoch 1795224827). T6 **KHÔNG tự chứng nhận**
  số hiệu reboot #59 (thuộc T0-159/T2-159 — lúc T6 mở
  chưa có cờ `round159-t0.done` trên đĩa).
- Uptime boot lúc đóng ~77'. `journal --list-boots`
  chỉ 1 dòng eec65561 (first entry 01:33:59Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~02:50Z, boot_id giống lúc mở; kiểm
  lại sau prune, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  02:51:20Z vs local 02:51:19Z — chênh ~1 s. Không còn
  dấu hiệu chạy nhanh ~42–50' như đợt 156. Các mốc wall
  đợt 159 đọc trực tiếp được.
- **REBOOT #59 (btime 01:33:47Z, boot `eec65561`) —
  KHÔNG giết holder** (§2): lock trống 43m59s trước
  btime (RELEASED cuối 00:49:48Z, hold 230 s, số học
  khớp); 0 dòng log sau 00:49:48Z; 0 STALE-LOCK mới;
  still held = 0 lúc T6-159 mở; lock TRỐNG xác minh
  độc lập lúc mở 02:39Z. **Verdict này sạch hơn #58**
  (sát nút, release ≈ btime) vì khoảng trống 44 phút
  không còn nghịch lý đồng hồ boot cũ. T6 không phán mù
  cho #59 — giao T2-159 (mù #88? VẪN MỞ từ đợt 157;
  #91? (#59) giao T2-159 theo brief đợt 159).
- **POSTBOOT_PASS:** #59 CHƯA CÓ cờ lúc T6 mở (thuộc
  T5-159); #58 ĐÃ CÓ (T5-158 ghi 23:43:22Z). T6 KHÔNG
  ghi cờ hộ.

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-159
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (02:51Z 21/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 1688 dòng thô /
  1682 dòng chính thức, 476 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round159-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND159_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round159-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 159 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 159 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–158 (T10-158 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-159).

## 11. GHI CHÚ CHO T10-159 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ chín liên tiếp, tổng 1080/1080 qua 9
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 8 → 9 (lần thứ chín xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 40 → 41 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (476 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); prune lần 34 xóa 1 file, queue về đúng
  trần 100 (KHÔNG phải chờ luồng khác nhả lock đợt này).
- **Reboot #59 KHÔNG giết holder** (lock trống 43m59s
  trước btime — verdict sạch, không sát nút như #58).
  **Đồng hồ ở giờ thật** (Cloudflare ±1 s, T6 tự kiểm).
  Mù cho #59 giao T2-159.
- **Double-acquire theo analyzer GIỮ 10 — 0 ca mới.**
  T10-159 lưu ý khi đối chiếu (§4).
- 0 zombie lúc mở và lúc đóng; 3 socket X11 (X193 02:46Z /
  X194 / X195 02:44Z) của luồng khác chạy lúc T6 đóng —
  t4 acquire lock trong cửa sổ T6 (3 dòng mới: 1 chu kỳ
  hoàn tất, hold 212 s); T10-159 lưu ý khi đối chiếu log
  (+26 dòng kể từ T6-158 đóng đều là của t8-round158,
  +3 dòng trong phiên là của t4, không phải của
  suite/harness T6).
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #78?–#81? GIỮ MỞ; mù #85?/#86?/#87? GIỮ MỞ theo
  quyết (b) đợt 157; mù #88? MỞ + #91? (#59) giao T2-159;
  birefnet 0 thử lần 12; u2net là fallback chính thức;
  POSTBOOT_PASS #57 KHÔNG CÓ — không bù được;
  POSTBOOT_PASS #58 ĐÃ CÓ — T5-158; POSTBOOT_PASS #59
  chờ T5-159).
- Cờ `round159-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-159 (F-159-T6-n)

- **F-159-T6-1 — `grep -c "-> PASS"` lỗi invalid option
  (quên `--` trước pattern bắt đầu bằng `-`).** Lệnh đếm
  dòng PASS/FAIL trong `t7-a159-churn.log` lần đầu báo
  `grep: invalid option -- '>'` (rc=2, 0 dòng đếm được).
  Đã chạy lại bằng `grep -c -- "-> PASS"` / `grep -c --
  "-> FAIL"`: 120 PASS / 0 FAIL — khớp dòng tổng kết của
  harness (`== TỔNG: ... PASS=120 FAIL=0 / 120 ==`).
  Không ảnh hưởng kết quả. Bài học: pattern grep bắt đầu
  bằng `-` phải có `--`.
- **F-159-T6-2 — Khởi động một lệnh `sleep 240` để chờ
  harness rồi tự kill.** Trong lúc chờ harness chạy nền,
  T6 chạy `sleep 240` để "chờ" rồi phải kill bằng
  `process.kill` (SIGTERM) — việc chờ này là thừa: kết
  quả nền tự về qua runtime. Không ảnh hưởng kết quả
  (sleep bị kill trước khi hết hạn, không chạm gì khác).
  Bài học: không dùng sleep để chờ job nền; kết thúc
  lượt và để runtime giao kết quả.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a159-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round159-t6/appendix-numbers.txt` giữ bản
trích gốc:

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=512 max=3497 mean=1988.19
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
suite run1: PASS=9 FAIL=0 T7A=1 secs=22 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 secs=27 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 secs=29 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 secs=23 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 secs=23 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 secs=27 rc=0
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a159.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=485, COOLDOWN=202, RELEASED=475, STALE-LOCK=10, STALE-TICKET=1, TICKET=496, TIMEOUT=10, total=1679
cleaned-open pairs ACQUIRED->RELEASED: 475
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 10
cleaned-close counts: TOTAL: ACQUIRED=486, COOLDOWN=202, RELEASED=476, STALE-LOCK=10, STALE-TICKET=1, TICKET=497, TIMEOUT=10, total=1682
cleaned-close pairs ACQUIRED->RELEASED: 476
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 10
cleaned-final counts: TOTAL: ACQUIRED=486, COOLDOWN=202, RELEASED=476, STALE-LOCK=10, STALE-TICKET=1, TICKET=497, TIMEOUT=10, total=1682
cleaned-final pairs ACQUIRED->RELEASED: 476
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 10
raw log lines open: 1685
raw log lines close: 1688
raw log lines final (after prune check): 1688
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
KHONG-NHA lines in raw log: 0
prune-34 deleted: cooldown-t8-round117 mtime=2026-11-15T09:01:21Z size=14 age=137.83h rule=(b) at 2026-11-21T02:50:57Z
next oldest remaining: cooldown-t4-hold mtime=2026-11-15T09:12:47Z
reboot-59: btime 2026-11-21T01:33:47Z boot eec65561; last lock line before reboot 2026-11-21T00:49:48Z RELEASED (lock empty 43m59s); 0 lines after 00:49:48Z; 0 new STALE-LOCK
clock check: Cloudflare Date 2026-11-21T02:51:20Z vs local 02:51:19Z (~1s)
```

---
**Batch stage / Tổng batch:** T6-159: 1 batch / 1 entry / 1 file. Đợt 159 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry (t6). Lũy kế 111–158 (T10-158 đếm dedup toàn cục): T6 không tự cộng tay — chờ T10-159 đếm lại.
