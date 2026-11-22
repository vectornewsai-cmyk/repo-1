# PHASE9 ROUND160 T6 — (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 10 LIÊN TIẾP) + #60 ĐÃ GIẾT HOLDER (STALE-LOCK THU HỒI ĐÚNG) + #61 KHÔNG GIẾT HOLDER + prune lần 35: XÓA 1 FILE — LIMITS

- Đợt: 160, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 12:35 +07 21/11/2026 (= 05:35:51Z 21/11). Chạy
  05:39Z → 05:53Z 21/11/2026. Lúc mở đã ở trên boot
  `52c957d5` (btime 05:25:49Z) — reboot #61 theo brief giao
  (T6 KHÔNG tự chứng nhận số hiệu #61, chỉ chứng nhận từ
  log lock rằng #61 không giết holder — xem §2/§8);
  KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 10 liên tiếp nếu đạt — tổng
  1200/1200); ghi rõ số chu kỳ, điều kiện churn, boot đo;
  (b) kiểm tra lock khỏe: số cặp, số đang giữ, TIMEOUT mới,
  "KHÔNG NHẢ" — trích ĐÚNG CỘT (cột $3 qua
  `analyze-log.py`, xem §4); (c) chạy suite liên quan và
  ghi exit code + thời gian thật; (d) prune lần 35: đếm
  queue lúc mở, xóa file theo đúng quy tắc prune các đợt
  trước, ghi rõ xóa file nào, queue trước/sau; kiểm tra
  reboot #60/#61 có giết holder nào không (brief nhắc:
  T6-156 phát hiện #50 ĐÃ GIẾT holder t4 — kiểm kỹ khoảng
  trống lock quanh btime #60 03:05:59Z và #61 05:25:49Z);
  (e) ghi sai số riêng F-160-T6-n; (f) stage paths
  NUL-delimited; (g) viết cờ .done CÓ NỘI DUNG.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–159,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–159); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (483 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — VỚI 2 LƯU Ý ĐẾM: double-acquire theo analyzer
  LÊN 11 (1 ca mới — là artifact thu hồi sau khi #60 giết
  holder, xem §4; 0 double-acquire THẬT mới) và STALE-LOCK
  LÊN 11 (1 ca mới — chính lần thu hồi holder bị #60 giết,
  xem §2/§8). Reboot #60 ĐÃ GIẾT HOLDER (t8-round159,
  pid 44086, cổng 5390 — bằng chứng lock-log độc lập khớp
  F-159-T8-1; cơ chế STALE-LOCK thu hồi đúng, không kẹt).
  Reboot #61 KHÔNG giết holder nào (lock trống 1h57m24s
  trước btime). Prune lần 35: xóa 1 file cũ nhất
  (điều (b)), queue 101 → 100 file — KHÔNG phải chờ luồng
  khác nhả lock đợt này (lock TRỐNG cả lúc mở lẫn lúc
  prune; 0 dòng log mới trong phiên T6).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round160-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, queue-open.txt,
  queue-oldest-open.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, vite-lock-v2-raw-final.log,
  analyze-log.py,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt,
  new-lines-since-t6-159.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a160.sh,
  t7-control-a160.stdout.log, t7-block-a160.sh,
  t7-a160-churn.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 52c957d5 (#61, btime 05:25:49Z); lock TRỐNG; queue 101 file (khớp T10-159 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `52c957d5-a8dd-4523-822f-acfcde535d3b`, btime 05:25:49Z
  theo /proc/stat** (epoch 1795238749; `uptime -s` =
  05:25:49; `journal --list-boots` chỉ 1 dòng 52c957d5,
  first entry 05:26:00Z). Uptime ~14' lúc T6 bắt đầu
  (05:39Z), ~27' lúc snapshot đóng (05:52Z). Boot này là
  #61 theo brief giao (btime 05:25:49Z) — **T6 KHÔNG tự
  chứng nhận số hiệu #61** (thuộc T0-160/T2-160; lúc T6
  mở chưa có cờ `round160-t0.done` trên đĩa); T6 chỉ
  chứng nhận từ log lock rằng #61 không giết holder (xem
  §2/§8). **KHÔNG có reboot trong phiên T6** (boot_id
  giống nhau lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc 05:42Z — Cloudflare `Date:
  Sat, 21 Nov 2026 05:42:23 GMT` vs local 05:42:22Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, khớp T6-159).
  Các mốc wall đợt 160 đọc trực tiếp được.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Lưu ý phương pháp: `md5-open.txt` ghi lại các giá trị
  md5 đã đo bằng lệnh `md5sum` lúc mở (~05:39Z, xem log
  phiên); `md5-close.txt`/`md5-final.txt` đo lại từ đĩa
  lúc đóng — các bản khớp nhau từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp số học
  từ T6-159 đóng: 100 sau prune 34 + 1 file cooldown mới
  `cooldown-t8-round159`, mtime 03:28Z (§2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật lúc mở và lúc đóng; X11 trống lúc mở, 3 socket luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 05:39Z
  (mở, `ps-full-open.txt`) và lúc 05:52Z
  (đóng, `ps-full-close.txt`).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở và lúc đóng: 0 vite thật đang chạy** —
  `ss -tlnp` trống hoàn toàn cả hai snapshot; các dòng chứa
  chuỗi "vite" trong snapshot ps đều KHÔNG phải process vite:
  lúc mở 2 dòng (1 lệnh scan watcher của T2-160 chứa chuỗi
  `vcut-poll`/`test-vite-lock` trong text lệnh + 1 dòng là
  chính lệnh snapshot của T6); lúc đóng 2 dòng (1 shell
  preflight của T4-160 + 1 dòng là chính lệnh snapshot của
  T6) — cùng bẫy tự-tham-chiếu như đợt 155–159.
- **Lúc mở: `/tmp/.X11-unix/` trống. Lúc đóng: 3 socket
  X193 / X194 / X195 — cùng 3 socket đã có lúc T6-159 đóng**
  (của các luồng khác đợt 159, còn sót lại qua reboot #61;
  T6 không khởi động Xvfb/vite nào, không đụng tới các
  process này, không kill process nào trong phiên này).
  Process luồng khác lúc đóng: shell preflight T4-160
  (pid 3789) và các shell scan của T2-160 (pid 2676/2906).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-160).
  Inotify: `max_user_watches` = **63747** lúc kiểm cuối
  (~05:53Z, khớp đợt 147–159 — không có lần flip mới
  trong phiên T6; quyết parent (m) đợt 146: ghi làm chú
  thích, không hành động).
- Tải hệ thống trong phiên: các luồng đợt 160 khởi động
  dần (T2-160 scan, T4-160 preflight) — harness churn vẫn
  120/120 (xem §6).
  Suite đợt này chạy 24–28 s/lượt (tương đương đợt 159:
  22–29 s/lượt).

## 2. Lock lúc mở: TRỐNG; 0 dòng mới trong phiên T6; +29 dòng kể từ T6-159 đóng — TẤT CẢ CỦA t8-round159, TRƯỚC phiên T6

- **Lúc mở (05:39Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (05:52Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`
  (trước prune), rc=0. Prune KHÔNG phải chờ (xem §7).
- **Log lock +29 dòng kể từ T6-159 đóng** (raw 1688 lúc
  T6-159 đóng → 1717 lúc T6-160 mở → 1717 lúc snapshot
  đóng): 29 dòng đều trước phiên T6; **+0 dòng trong
  phiên T6-160** (diff bản đã lọc mở/đóng rc=0 — không
  luồng nào khác đụng lock trong phiên T6; khác đợt 159
  có chu kỳ t4 trong phiên).
- Đối chiếu 29 dòng (khớp đúng từng dòng, file
  `new-lines-since-t6-159.txt`, dòng thô 1689–1717):
  - t8-round159: 8 chu kỳ bắt đầu (03:01:38Z →
    03:28:25Z); **7 chu kỳ HOÀN TẤT** (holds 155 / 80 /
    140 / 240 / 70 / 131 / 231 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14943–14957 ms trên cổng 5490/5390);
    **1 chu kỳ BỊ REBOOT #60 GIẾT** (acquire 03:06:11Z,
    không RELEASED — xem §8).
  - Tổng: Δ TICKET +8, Δ ACQUIRED +8, Δ RELEASED +7,
    Δ COOLDOWN +5, Δ STALE-LOCK +1, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **7/8 chu kỳ mới hoàn
    tất sạch; chu kỳ thứ 8 được thu hồi đúng cơ chế.**
- **KHOẢNG TRỐNG LOG 03:28:25Z → nay (05:39Z lúc mở,
  2h10m35s): KHÔNG có dòng lock nào sau 03:28:25Z.**
  Reboot #61 (btime 05:25:49Z) rơi vào khoảng này — xem §8.
- **REBOOT #61 (btime 05:25:49Z, boot `52c957d5`) —
  KHÔNG giết holder nào:** dòng lock cuối trước reboot là
  t8-round159 RELEASED 03:28:25Z (hold 231 s, số học khớp);
  dòng đầu sau reboot: KHÔNG CÓ (0 dòng log sau 03:28:25Z
  tới lúc T6-160 mở) — tức lock trống **1h57m24s trước
  reboot** và không có dòng lock nào sau 03:28:25Z.
  Không có ACQUIRED nào chưa release tại thời điểm #61,
  không có dòng STALE-LOCK mới nào sau #61 (STALE-LOCK
  vẫn 11, ca mới nhất 03:12:16Z — trước #61 hơn 2 giờ),
  still held = 0 lúc T6-160 mở, lock TRỐNG xác minh độc
  lập lúc mở 05:39Z.
  **Kết luận: #61 không giết holder nào — verdict sạch
  (khoảng trống ~2 giờ, sạch hơn cả #59 với 44 phút).**
- **File cooldown mới kể từ T6-159 đóng:
  `cooldown-t8-round159` (mtime 03:28Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 159 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 217 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 7 chu kỳ hoàn tất
  kể từ T6-159 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 210 chu kỳ T6-159 đã đếm = **217 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (210 đợt
    159 + 7 đợt này). Chu kỳ t8-round159 bị #60 giết
    (acquire 03:06:11Z, không có RELEASED) KHÔNG tính
    vào 217 (dở dang, không có RELEASED) — nhưng chính
    cơ chế STALE-LOCK đã xử lý đúng trường hợp này
    (reclaim sạch lúc 03:12:16Z, re-acquire cùng giây,
    chu kỳ thay thế hoàn tất RELEASED 03:13:36Z hold 80 s,
    không kẹt, không double-acquire thật — xem §4/§8).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1711 dòng chính thức lúc kiểm cuối, 483 cặp, 0 đang giữ, double-acquire LÊN 11 (1 ca mới — artifact thu hồi #60), STALE-LOCK LÊN 11 (1 ca mới — chính lần thu hồi đó), 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — T6 đợt này xác minh
lại bằng `sed -n '848,853p'`: đúng 6 dòng đó; bản đã lọc
= raw trừ đúng 6 dòng đó; diff bản đã lọc mở/đóng rc=0,
§2).
Bản đã lọc lúc đóng: **1711 dòng** (raw 1717) — **+29 dòng
kể từ T6-159 đóng** (1653 → 1682 → 1711). Kiểm cuối sau
prune (05:53Z 21/11): bản đã lọc **1711 dòng** (raw 1717),
RELEASED 483, cặp 483, đang giữ 0, double-acquire 11 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-159 đóng | T6-160 mở | T6-160 đóng (snapshot) | Δ trong phiên T6-160 |
|---|---|---|---|---|
| Tổng dòng | 1682 | 1711 | 1711 | +0 |
| TICKET | 497 | 505 | 505 | +0 |
| ACQUIRED | 486 | 494 | 494 | +0 |
| RELEASED | 476 | 483 | 483 | +0 |
| COOLDOWN | 202 | 207 | 207 | +0 |
| STALE-LOCK | 10 | 11 | 11 | +0 |
| STALE-TICKET | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 476 | 483 | 483 | +0 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 |
| Double-acquire | 10 | 11 | 11 | 0 mới trong phiên |

- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối:**
  ACQUIRED 494 − RELEASED 483 = 11 ACQUIRED chưa release
  trong lịch sử log — nhưng cả 11 đều đã được xử lý: 10 ca
  double-acquire cũ (đã giải thích các đợt trước) + 1 ca
  mới t8-round159 03:12:16Z (STALE-LOCK thu hồi holder bị
  #60 giết — §8). Analyzer xác nhận `still held at end of
  log: 0` ở cả ba snapshot (mở/đóng/kiểm cuối). Lock
  TRỐNG lúc mở và lúc đóng — status xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE LÊN 11 — 1 CA MỚI kể từ T6-159 đóng,
  0 ca mới trong phiên T6-160.** Ca mới: analyzer dòng
  1696 (bản thô) — t8-round159 ACQUIRED 03:12:16Z sau
  STALE-LOCK cùng giây, acquire trước của cùng thread
  03:06:11Z (dòng thô 1693) chưa có RELEASED vì holder
  đó (pid 44086) đã chết theo reboot #60 (§8). Đây là
  **artifact đếm** — cùng mẫu với ca t4 18:02:49Z sau
  reclaim #50 (xem §4 T6-157): acquire lại sau khi cơ
  chế STALE-LOCK đã reclaim lock của holder chết, không
  phải 2 holder cùng lúc. Các lần acquire lại khác đợt
  này (7 chu kỳ t8-round159 hoàn tất) đều ghép cặp
  RELEASED đúng và KHÔNG bị gắn cờ.
  **Kết luận: 0 double-acquire THẬT mới.** T10-160 lưu ý
  khi đối chiếu: số "11" của analyzer gồm 10 ca cũ + 1
  artifact thu hồi #60; STALE-LOCK "11" cũng gồm 10 ca cũ
  + 1 ca thu hồi #60 — **hai con số +1 là CÙNG MỘT sự
  kiện, không phải hai sự kiện riêng**.
- **0 double-acquire mới** kể từ T6-159 đóng (theo nghĩa
  cơ chế). 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (7 chu kỳ mới sạch kể từ T6-159 đóng +
  1 chu kỳ bị reboot giết được thu hồi đúng cơ chế),
  0 zombie lúc đóng, 0 stale mới trong phiên, queue
  0 ticket, log nhất quán (483 cặp + 0 đang giữ lúc kiểm
  cuối, 0 mất dấu khác — số chính thức đã loại 6 dòng
  repro lỗi của T6-132), 0
  TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–160 (toàn đợt) và đợt 160 (tới ~05:53Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **217 chu kỳ thật** chứng minh (§3).
  Caveat còn lại: **reboot #60 ĐÃ giết holder t8-round159**
  (lần thứ hai reboot giết holder, sau #50 giết holder t4
  đợt 155) — cơ chế STALE-LOCK đã reclaim đúng (không
  kẹt, không double-acquire thật); và **reboot #61 KHÔNG
  giết holder** (xem §8 — khoảng trống ~2 giờ, verdict
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
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159 §6.2.
  File khối T7 đã trích `t7-block-a160.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158 và 159 (cùng md5). Harness đợt này chạy đúng code (A)
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
- `bash -n` harness t7-control-a160.sh: OK (bản sao của
  t7-control-a159.sh, chỉ đổi hậu tố a159 → a160 + sửa
  comment "đợt 159" → "đợt 160").
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–159 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ mười liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(05:42–05:45Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 24/25/28/24/
25/28 s — tương đương đợt 159: 22/27/29/23/23/27 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào do 6 lượt chạy (0 dòng mới trong
phiên đều là của T6, §2/§4).
- Không có lỗi thao tác ở bước suite đợt này.

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round160-t6/t7-control-a160.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 52c957d5 (#61,
btime 05:25:49Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a160.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158 và 159; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a160-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 559 ms, max 3458 ms, trung bình 1964,07 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'04" (05:45:07–05:52:11Z).
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
| **(A), đợt 160 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau chín đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ mười liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 1200/1200 dưới churn qua 10 đợt). Chú thích tỉ lệ
  (như T6-150–159): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 9 (đợt 159) → **10 (đợt
  160 — lần thứ mười xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 41 (đợt 159) → **42 (đợt 160,
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
  - 05:39Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-159 thêm `cooldown-t8-round159`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG lúc mở (05:39Z) VÀ vẫn TRỐNG lúc snapshot
    đóng (05:52Z) — điều (e) thỏa ngay, **prune KHÔNG
    phải chờ** (giống đợt 159; khác đợt 158: T6-158 phải
    chờ t4-158 nhả lock). T6 xác minh lại TRỐNG
    ngay trước prune (05:53Z, `status-before-prune.txt`).
  - 05:53Z 21/11: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-t4-hold`, mtime 2026-11-15T09:12:47Z,
    140,66h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round 117; xem §12
    F-149-T6-3).
  - **Kết quả prune đợt 160 (lần 35): 1 file đã xóa
    (`cooldown-t4-hold`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (05:39Z) **101 file / 1414 byte**;
  lúc snapshot đóng (05:52Z, trước khi prune) **101 file /
  1414 byte** (log lock 0 dòng mới trong phiên, không thêm
  file cooldown mới);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (05:53Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-159 đóng: 100 + 1 file mới
  (`cooldown-t8-round159`) = 101 ✓ — khớp đúng số T10-159 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 65 file; ≥48h (`-mtime +1`): 79
  file**. Sau prune (05:53Z): **≥192h: 0 file; ≥72h:
  64 file; ≥48h: 78 file** — ≥72h giảm 65 → 64 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t4-wc`, mtime 2026-11-15T09:14:07Z —
  lúc 05:53Z mới **~140,64h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 65, tăng 2 so với lúc
  mở đợt 159 (63 sau prune 34 — T6-159 ghi 64 lúc mở,
  63 sau prune): 2 file khác đã vượt ngưỡng 72h trong
  khoảng giữa 2 đợt (file tạo 18/11 02:51–05:39Z); khớp
  số học, không phải mâu thuẫn. ≥48h lúc mở 79, tăng 2
  so với đợt 159 (77 sau prune 34) — cùng lý do, file
  tạo 19/11 02:51–05:39Z.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ mười một liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt 156 xóa
  `cooldown-s3-round116`, đợt 157 xóa
  `cooldown-s10-round116`, đợt 158 xóa `cooldown-t6`,
  đợt 159 xóa `cooldown-t8-round117`, đợt này xóa
  `cooldown-t4-hold` trước khi nó đủ 7 ngày — nó đủ 7
  ngày theo đồng hồ tường vào khoảng **22/11 09:12Z**
  nhưng đã bị xóa ở đợt 160, sớm ~27h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 36 (T6-161): tổng lock 100 sau prune 35 —
  kiểm lại lúc mở đợt 161** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t4-wc` đủ 7 ngày ~22/11 09:14Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-160; #60 ĐÃ giết holder (bằng chứng lock-log); #61 KHÔNG giết holder; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **52c957d5** (btime
  05:25:49Z = epoch 1795238749). T6 **KHÔNG tự chứng nhận**
  số hiệu reboot #61 (thuộc T0-160/T2-160 — lúc T6 mở
  chưa có cờ `round160-t0.done` trên đĩa).
- Uptime boot lúc đóng ~27'. `journal --list-boots`
  chỉ 1 dòng 52c957d5 (first entry 05:26:00Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~05:52Z, boot_id giống lúc mở; kiểm
  lại sau prune, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  05:42:23Z vs local 05:42:22Z — chênh ~1 s. Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 160
  đọc trực tiếp được. (Lưu ý: đồng hồ boot #59 chạy nhanh
  ≥32 s lúc chết — F-159-T8-5 — thuộc về boot cũ đã qua,
  không phải đồng hồ hiện tại.)
- **REBOOT #60 (btime 03:05:59Z, boot `e590ae0a`) —
  ĐÃ GIẾT HOLDER** (phát hiện mới của T6-160 từ log lock,
  khớp độc lập F-159-T8-1): holder t8-round159, pid 44086,
  cổng 5390, ACQUIRED dòng thô 1693 lúc 03:06:11Z (đồng hồ
  cũ #59 — nhanh ≥32 s nên thời điểm thật TRƯỚC btime
  03:05:59Z, xem F-159-T8-5); holder chết theo reboot
  giữa lúc giữ lock chạy WebKit 84l10 attempt 1 (T8-159:
  W1-lần1/2 PASS 03:06:26/31Z đồng hồ cũ rồi log dừng đột
  ngột). Bằng chứng lock-log độc lập: STALE-LOCK dòng
  thô 1695 lúc 03:12:16Z — "owner pid 44086 chết + không
  vite trên cổng 5390 + curl 000 + **boot đổi** (tuổi
  364s)". Tuổi 364 s < STALE_MIN 30 phút nên ca này CHỈ
  được tuyên stale qua nhánh đổi-boot của `lock_is_stale`
  (script v2 dòng ~204: owner_boot ≠ boot_id hiện tại →
  stale NGAY) — tức boot đã đổi giữa lúc ghi lock file
  (~03:06:11Z) và lúc kiểm stale (03:12:16Z). Cơ chế thu
  hồi đúng: re-acquire cùng giây 03:12:16Z (dòng thô
  1696), chu kỳ thay thế hoàn tất RELEASED 03:13:36Z
  hold 80 s; attempt 2 sau đó chạy 6/6 PASS tới 03:28:25Z.
  **Đây là lần thứ hai reboot giết holder** (sau #50 giết
  holder t4 đợt 155); cả hai lần cơ chế STALE-LOCK đều
  xử lý đúng (không kẹt, không double-acquire thật).
  T6 không phán mù cho #60 — giao T2-160 (mù #92? (#60)
  đã giao từ đợt 159; T2-160 lưu ý: bằng chứng lock-log
  này khớp khung giờ thật của #60).
- **REBOOT #61 (btime 05:25:49Z, boot `52c957d5`) —
  KHÔNG giết holder** (§2): lock trống 1h57m24s trước
  btime (RELEASED cuối 03:28:25Z, hold 231 s, số học
  khớp); 0 dòng log sau 03:28:25Z; 0 STALE-LOCK mới;
  still held = 0 lúc T6-160 mở; lock TRỐNG xác minh
  độc lập lúc mở 05:39Z. **Verdict này sạch hơn cả #59**
  (khoảng trống ~2 giờ). T6 không phán mù cho #61 —
  giao T2-160.
- **POSTBOOT_PASS:** #61 CHƯA CÓ cờ lúc T6 mở (thuộc
  T5-160); #60 CHƯA CÓ cờ lúc T6-159 đóng (giao T5-160
  theo T10-159 §10.5 — T5-159 ghi watcher-159 cũng chết
  theo #60). T6 KHÔNG ghi cờ hộ.

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-160
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (05:53Z 21/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 1717 dòng thô /
  1711 dòng chính thức, 483 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round160-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND160_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round160-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 160 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 160 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–159 (T10-159 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-160).

## 11. GHI CHÚ CHO T10-160 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ mười liên tiếp, tổng 1200/1200 qua 10
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 9 → 10 (lần thứ mười xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 41 → 42 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (483 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); prune lần 35 xóa 1 file, queue về đúng
  trần 100 (KHÔNG phải chờ luồng khác nhả lock đợt này;
  0 dòng log mới trong phiên T6).
- **PHÁT HIỆN MỚI — Reboot #60 ĐÃ giết holder**
  (t8-round159, pid 44086, cổng 5390 — bằng chứng lock-log
  độc lập: STALE-LOCK "boot đổi" 03:12:16Z, tuổi 364 s;
  khớp F-159-T8-1). Cơ chế STALE-LOCK thu hồi đúng
  (re-acquire cùng giây, chu kỳ thay thế hoàn tất).
  **Reboot #61 KHÔNG giết holder** (lock trống 1h57m24s
  trước btime — verdict sạch).
  **Đồng hồ ở giờ thật** (Cloudflare ±1 s, T6 tự kiểm).
  Mù cho #60/#61 giao T2-160.
- **Double-acquire theo analyzer LÊN 11 — 1 ca mới
  (artifact thu hồi #60); STALE-LOCK LÊN 11 — 1 ca mới
  (chính lần thu hồi đó). Hai con số +1 là CÙNG MỘT sự
  kiện — T10-160 lưu ý khi đối chiếu (§4), đừng đếm
  thành hai sự kiện riêng.**
- 0 zombie lúc mở và lúc đóng; 3 socket X11 (X193/X194/
  X195) còn sót từ đợt 159 qua reboot #61 — không phải
  của T6; T10-160 lưu ý khi đối chiếu log (+29 dòng kể
  từ T6-159 đóng đều là của t8-round159, +0 dòng trong
  phiên T6).
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #78?–#81? GIỮ MỞ; mù #85?/#86?/#87? GIỮ MỞ theo
  quyết (b) đợt 157; mù #88? MỞ + #91? (#59) giao T2-159
  + #92? (#60) giao T2-160; birefnet 0 thử lần 12; u2net
  là fallback chính thức; POSTBOOT_PASS #57 KHÔNG CÓ —
  không bù được; POSTBOOT_PASS #58 ĐÃ CÓ — T5-158;
  POSTBOOT_PASS #59 ĐÃ CÓ — T5-159; POSTBOOT_PASS #60
  + watcher-160 chờ T5-160).
- Cờ `round160-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-160 (F-160-T6-n)

- **F-160-T6-1 — Chạy `analyze-log.py` lần đầu trên log
  THÔ (1717 dòng) thay vì bản đã lọc.** Lệnh analyzer
  đầu phiên chạy trên `vite-lock-v2-raw-open.log` (chưa
  trừ 6 dòng repro T6-132) nên số TOTAL lúc đó là
  TICKET 507 / ACQUIRED 496 / RELEASED 485 (thừa 2/2/2
  so với số chính thức). Đã làm lại đúng: tạo bản đã lọc
  bằng `sed '848,853d'` (xác minh đúng 6 dòng repro bằng
  `sed -n '848,853p'` trước) rồi chạy analyzer trên bản
  đã lọc — số chính thức TICKET 505 / ACQUIRED 494 /
  RELEASED 483, cặp 483. Không ảnh hưởng kết quả (số
  thô chỉ xuất hiện trong log phiên, không đưa vào LIMITS
  này). Bài học: luôn chạy analyzer trên bản đã lọc, như
  các đợt 151–159 đã làm.
- **F-160-T6-2 — Lệnh `find` quét toàn cây repo-1 (có
  node_modules) để tìm script lock/poll, chạy chậm >10 s
  và phải kill.** Không ảnh hưởng kết quả (đường dẫn
  script đã biết từ T6-159: `apps/web/scripts/`). Bài
  học: dùng đường dẫn đã biết từ LIMITS đợt trước, không
  quét `find` toàn cây có node_modules.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a160-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round160-t6/appendix-numbers.txt` giữ bản
trích gốc:

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=559 max=3458 mean=1964.07
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
suite run1: PASS=9 FAIL=0 T7A=1 secs=24 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 secs=25 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 secs=28 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 secs=24 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 secs=25 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 secs=28 rc=0
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a160.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=494, COOLDOWN=207, RELEASED=483, STALE-LOCK=11, STALE-TICKET=1, TICKET=505, TIMEOUT=10, total=1711
cleaned-open pairs ACQUIRED->RELEASED: 483
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 11
cleaned-close counts: TOTAL: ACQUIRED=494, COOLDOWN=207, RELEASED=483, STALE-LOCK=11, STALE-TICKET=1, TICKET=505, TIMEOUT=10, total=1711
cleaned-close pairs ACQUIRED->RELEASED: 483
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 11
cleaned-final counts: TOTAL: ACQUIRED=494, COOLDOWN=207, RELEASED=483, STALE-LOCK=11, STALE-TICKET=1, TICKET=505, TIMEOUT=10, total=1711
cleaned-final pairs ACQUIRED->RELEASED: 483
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 11
raw log lines open: 1717
raw log lines close: 1717
raw log lines final (after prune check): 1717
new lines since T6-159 close: 29 (TICKET 8, ACQUIRED 8, RELEASED 7, COOLDOWN 5, STALE-LOCK 1, TIMEOUT 0)
new lines in T6-160 session: 0
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
queue age bands open: >=192h: 0 files; >=72h: 65 files; >=48h: 79 files
queue age bands post-prune: >=192h: 0 files; >=72h: 64 files; >=48h: 78 files
KHONG-NHA lines in raw log: 0
prune-35 deleted: cooldown-t4-hold mtime=2026-11-15T09:12:47Z size=14 age=140.66h rule=(b) at 2026-11-21T05:53Z
next oldest remaining: cooldown-t4-wc mtime=2026-11-15T09:14:07Z
reboot-60: btime 2026-11-21T03:05:59Z boot e590ae0a; HOLDER KILLED: t8-round159 pid 44086 port 5390 ACQUIRED 2026-11-21T03:06:11Z (old clock, >=32s fast per F-159-T8-5); STALE-LOCK 2026-11-21T03:12:16Z boot-doi age 364s; re-acquired 03:12:16Z, RELEASED 03:13:36Z hold 80s
reboot-61: btime 2026-11-21T05:25:49Z boot 52c957d5; last lock line before reboot 2026-11-21T03:28:25Z RELEASED (lock empty 1h57m24s); 0 lines after 03:28:25Z; 0 new STALE-LOCK; NO holder killed
clock check: Cloudflare Date 2026-11-21T05:42:23Z vs local 05:42:22Z (~1s)
inotify max_user_watches: 63747
```

---
**Batch stage / Tổng batch:** T6-160: 1 batch / 1 entry / 1 file. Đợt 160 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry (t6). Lũy kế 111–159 (T10-159 đếm dedup toàn cục): T6 không tự cộng tay — chờ T10-160 đếm lại.
