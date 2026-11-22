# PHASE9 ROUND157 T6 — (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 7 LIÊN TIẾP) + #56 XÁC NHẬN — KHÔNG GIẾT HOLDER + prune lần 32: XÓA 1 FILE — LIMITS

- Đợt: 157, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 03:35 +07 21/11/2026 (= 20:35:51Z). Chạy
  20:41:35Z → ~21:00Z 20/11/2026. Lúc mở đã ở trên boot mới
  `348dab54` (btime 19:32:47Z) — reboot #56 (xem §0/§8);
  KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 7 liên tiếp nếu đạt — tổng
  840/840); ghi rõ số chu kỳ, điều kiện churn, boot đo;
  (b) kiểm tra lock khỏe: số cặp, số đang giữ, TIMEOUT mới,
  "KHÔNG NHẢ"; (c) chạy suite liên quan và ghi exit code +
  thời gian thật; (d) prune lần 32: đếm queue lúc mở, xóa
  file theo đúng quy tắc prune các đợt trước, ghi rõ xóa
  file nào, queue trước/sau; kiểm tra reboot #56 ứng viên
  lúc mở (đọc cờ round157-t0.done) có giết holder nào
  không; (e) ghi sai số riêng F-157-T6-n; (f) stage paths
  NUL-delimited; (g) viết cờ .done CÓ NỘI DUNG.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151/152/
  153/154/155/156, file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151/152/153/154/155/156); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (457 cặp ACQUIRED→RELEASED,
  0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ hiệu dụng) —
  VỚI 1 LƯU Ý ĐẾM: double-acquire theo analyzer 9 → 10,
  ca mới là ARTIFACT của máy trạng thái analyzer (t4 acquire
  lại 18:02:49Z sau khi holder cũ chết theo #50 — lock đã
  trống từ 16:34:28Z, không có 2 holder sống cùng lúc; xem
  §4). Reboot #56 XÁC NHẬN (T0-157) KHÔNG giết holder nào
  (lock trống ≥22m08s trước reboot — xem §2/§8); #53/#54/#55
  cũng KHÔNG giết holder nào (đều rơi vào khoảng trống log
  18:12:35Z–19:34:16Z). Prune lần 32: xóa 1 file cũ nhất
  (điều (b)), queue 101 → 100 file.**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round157-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, wc-open.txt, wc-close.txt,
  queue-open.txt, queue-close.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-raw-close.log, analyze-log.py,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  new-lines-since-t6-156.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt, khong-nha-grep.txt,
  status-before-prune.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a157.sh,
  t7-control-a157.stdout.log, t7-block-a157.sh,
  t7-a157-churn.log, md5-open.txt, md5-close.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI 348dab54 (#56 XÁC NHẬN, btime 19:32:47Z GIỜ THẬT); lock TRỐNG; queue 101 file (khớp T10-156 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `348dab54-90f7-438e-924e-2c839630842b`, btime 19:32:47Z
  theo /proc/stat** (epoch 1795203167; `uptime -s` =
  19:32:47; `journal --list-boots` chỉ 1 dòng 348dab54,
  first entry 19:32:59Z). Uptime ~1h09' lúc T6 bắt đầu
  (20:41Z), ~1h27' lúc đóng (~21:00Z). Boot này KHÁC boot
  #55 (c99a1045, btime 19:04:44Z) — **reboot #56, T0-157
  XÁC NHẬN** (cờ `round157-t0.done` 20:52:49Z: "REBOOT #56
  XÁC NHẬN (sau #55 c99a1045, đếm tuần tự)"; btime
  19:32:47Z là GIỜ THẬT — xem §8 về nghịch lý đồng hồ).
  T6 KHÔNG tự chứng nhận số hiệu #56 (thuộc T0-157/T2-157);
  T6 chỉ chứng nhận từ log lock rằng #56 không giết holder
  (xem §2/§8). **KHÔNG có reboot trong phiên T6**
  (boot_id giống nhau lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Lưu ý phương pháp: `md5-open.txt` ghi lại các giá trị
  md5 đã đo bằng lệnh `md5sum` lúc mở (~20:44Z, xem log
  phiên); `md5-close.txt` đo lại từ đĩa lúc đóng — hai
  bản khớp nhau từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp đúng số
  T10-156 đóng (100 sau prune 31 + 1 file cooldown mới
  `cooldown-t8-round156`, mtime 19:53:25Z, §2) và khớp cờ
  T0-157 ("Lock queue 101 (0 ticket + 101 cooldown,
  1.414 B), lock TRỐNG").

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật lúc mở; 0 vite thật lúc đóng (chỉ socket X11 của luồng khác)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 20:43Z
  (mở, `ps-full-open.txt`, 28 dòng) và lúc ~20:59Z
  (đóng, `ps-full-close.txt`, 27 dòng).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở và lúc đóng: 0 vite thật đang chạy** — `ss -tlnp`
  trống hoàn toàn cả hai lần; 1 dòng chứa chuỗi "vite"
  trong mỗi snapshot ps đều là chính dòng lệnh của T6
  (tham số `vite-lock` trong lệnh snapshot), KHÔNG phải
  process vite (cùng bẫy tự-tham-chiếu như đợt 155/156).
- **Lúc mở: `/tmp/.X11-unix/` trống. Lúc đóng: 3 socket
  X193/X194/X195 (20:49Z) — của các luồng khác đợt 157**
  (T6 không khởi động Xvfb/vite nào, không đụng tới các
  process này, không kill process nào trong phiên này).
  Các process luồng khác lúc đóng: poller T4-157
  (pid 3205/3207), sampler T9-157 (pid 3380), watcher
  T5-157 (pid 3428), b2-watcher (pid 3550) — đều khởi động
  sau khi đợt 157 mở; KHÔNG acquire lock nào trong cửa sổ
  T6 (diff log RỖNG, §4).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-157).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (khớp đợt 147–156 — không có lần flip mới trong
  phiên T6; quyết parent (m) đợt 146: ghi làm chú thích,
  không hành động).
- Tải hệ thống trong phiên: các luồng đợt 157 khởi động
  dần (Xvfb xuất hiện giữa phiên — xem trên) — harness
  churn vẫn 120/120 (xem §6). Suite đợt này chạy 22–28 s/
  lượt (nhanh hơn đợt 156: 27–36 s/lượt — boot #56 đã ấm
  hơn lúc T6 chạy; ghi nhận là quan sát tải, không phải
  lỗi).

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; +35 dòng kể từ T6-156 đóng — TẤT CẢ TRƯỚC phiên T6; +0 dòng TRONG phiên

- **Lúc mở (20:43:xxZ): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc đóng (~20:59Z, sau prune): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 100 cooldown`
  (sau prune 1 file → 100, xem §7), rc=0. Kiểm lại
  TRỐNG ngay trước prune (20:59:15Z,
  `status-before-prune.txt`).
- **Log lock +35 dòng kể từ T6-156 đóng** (raw 1585 lúc
  T6-156 đóng → 1620 lúc T6-157 mở → 1620 lúc đóng):
  35 dòng đều trước phiên T6, **+0 dòng trong phiên T6-157**
  (diff bản đã lọc mở/đóng RỖNG — §4).
- Đối chiếu 35 dòng (khớp đúng từng dòng, file
  `new-lines-since-t6-156.txt`):
  - t4: 3 chu kỳ HOÀN TẤT (18:02:49Z → 18:12:35Z; holds
    226 / 152 / 142 s; wait_s=0 cả 3; 0 COOLDOWN).
  - t8-round156: 7 chu kỳ HOÀN TẤT (19:34:16Z →
    19:53:25Z; holds 158 / 70 / 141 / 240 / 60 / 120 /
    231 s; 5 dòng COOLDOWN kèm theo, các lần chờ
    14951–14966 ms trên cổng 5490/5390).
  - Tổng: Δ TICKET +10, Δ ACQUIRED +10, Δ RELEASED +10,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **10/10 chu kỳ mới hoàn
    tất sạch.**
- **KHOẢNG TRỐNG LOG 18:12:35Z → 19:34:16Z (1h21m41s,
  khung wall đợt 156): KHÔNG có dòng lock nào.** Reboot
  #53 (18:26:15Z), #54 (18:29:43Z), #55 (19:04:44Z) đều
  rơi vào khoảng này — xem §8.
- **REBOOT #56 (btime GIỜ THẬT 19:32:47Z) KHÔNG giết
  holder nào:** dòng lock cuối cùng là t8-round156
  RELEASED 19:53:25Z (khung wall đợt 156 — xem §8 về
  khung giờ). Đổi sang giờ thật: dòng cuối này ở giờ
  thật 19:53:25Z − J, với J ≥ 42'46" (cận dưới cứng
  T0-157) → ≤ 19:10:39Z, tức **ít nhất 22m08s TRƯỚC
  reboot #56** (19:32:47Z giờ thật); theo giả thuyết dẫn
  đầu J ≈ 50'26" thì là 29m48s trước. Không có dòng lock
  nào sau 19:53:25Z (wall) — log đứng yên 1620 dòng suốt
  phiên T6. Tại thời điểm #56, lock đã trống hoàn toàn.
- **Reboot #53/#54/#55 KHÔNG giết holder nào:** cả ba
  rơi vào khoảng trống log 18:12:35Z–19:34:16Z (không có
  ACQUIRED nào chưa release tại bất kỳ thời điểm nào
  trong khoảng — chu kỳ cuối trước khoảng hoàn tất
  18:12:35Z; chu kỳ đầu sau khoảng bắt đầu 19:34:16Z).
  Holder duy nhất từng dở dang — t4 15:01:45Z — đã được
  reclaim xong từ 16:34:28Z (đợt 156, §2 T6-156).
- **File cooldown mới kể từ T6-156 đóng:
  `cooldown-t8-round156` (mtime 19:53:25Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 156 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 191 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 10 chu kỳ hoàn tất
  kể từ T6-156 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2; gồm 3 chu
  kỳ t4 + 7 chu kỳ t8-round156).
  - Cộng với 181 chu kỳ T6-156 đã đếm = **191 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (181 đợt
    156 + 10 đợt này). Chu kỳ t4 bị #50 giết (15:01:45Z,
    đợt 155) KHÔNG tính vào 191 (dở dang, không có
    RELEASED) — nhưng chính cơ chế STALE-LOCK đã xử lý
    đúng trường hợp này (reclaim sạch, không kẹt, không
    double-acquire thật — xem §4 về artifact đếm).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1614 dòng chính thức lúc đóng, 457 cặp, 0 đang giữ, double-acquire 9 → 10 (CA MỚI LÀ ARTIFACT — KHÔNG PHẢI LỖI LOCK), 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
diff: bản đã lọc = raw trừ đúng 6 dòng đó; diff bản đã
lọc mở/đóng RỖNG vì không có dòng mới trong phiên).
Bản đã lọc lúc đóng: **1614 dòng** (raw 1620) — **+35 dòng
kể từ T6-156 đóng** (35 trước phiên + 0 trong phiên).
**KHỚP ĐÚNG số T6-156 đếm lúc đóng cộng thêm 10 chu kỳ
hoàn tất** — xem bảng đối chiếu dưới.

| Chỉ số (bản đã lọc) | T6-156 đóng | T6-157 mở | T6-157 đóng | Δ trong phiên T6-157 |
|---|---|---|---|---|
| Tổng dòng | 1579 | 1614 | 1614 | +0 |
| TICKET | 468 | 478 | 478 | +0 |
| ACQUIRED | 457 | 467 | 467 | +0 |
| RELEASED | 447 | 457 | 457 | +0 |
| COOLDOWN | 186 | 191 | 191 | +0 |
| STALE-LOCK | 10 | 10 | 10 | +0 |
| STALE-TICKET | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 447 | 457 | 457 | +0 |
| Đang giữ cuối log (naive) | 1 (t4) | 0 | 0 | +0 |
| Double-acquire | 9 | 10 | 10 | 0 mới trong phiên |

- **"Đang giữ = 0" lúc đóng (naive):** ACQUIRED 467 −
  RELEASED 457 = 10 ACQUIRED chưa release trong lịch sử
  log — nhưng cả 10 đều đã được xử lý: 9 ca double-acquire
  cũ (đã giải thích các đợt trước) + 1 ca t4 15:01:45Z
  (STALE-LOCK #10 lúc 16:31:32Z đã reclaim — §2 T6-156).
  ACQUIRED 18:02:49Z của t4 (ca double-acquire thứ 10,
  xem dưới) đã được RELEASED 18:06:35Z ghép cặp đúng, nên
  máy trạng thái analyzer về 0 ở cuối log. **Số đang giữ
  HIỆU DỤNG = 0** (không holder nào còn sống tại cuối log;
  lock TRỐNG lúc mở và lúc đóng — status xác nhận độc lập,
  §2).
- **DOUBLE-ACQUIRE 9 → 10 — CA MỚI LÀ ARTIFACT CỦA
  ANALYZER, KHÔNG PHẢI 2 HOLDER SỐNG CÙNG LÚC:**
  analyzer ghi double-acquire tại dòng 1581 (bản đã lọc):
  t4 ACQUIRED 18:02:49Z trong khi máy trạng thái của nó
  vẫn giữ ACQUIRED cũ của cùng tên thread t4 lúc
  15:01:45Z (dòng 1529) — ACQUIRED cũ này KHÔNG BAO GIỜ
  có RELEASED vì holder pid 55022 chết theo reboot #50.
  Bằng chứng đây là artifact, không phải lỗi lock:
  (1) STALE-LOCK #10 (16:31:32Z) đã reclaim ACQUIRED cũ
  và t8-round155 đã RELEASED 16:34:28Z — lock TRỐNG từ
  đó; (2) KHÔNG có dòng lock nào giữa 16:54:37Z và
  18:02:49Z — lock trống hoàn toàn 1h08m12s trước khi t4
  acquire lại; (3) ACQUIRED 18:02:49Z thuộc process t4
  MỚI (ticket `1-1795197769279519727-34627-t4`, pid khác
  55022 đã chết); (4) analyzer chỉ key trạng thái theo
  TÊN thread và KHÔNG xóa trạng thái khi gặp STALE-LOCK
  (xem code `analyze-log.py`: chỉ ACQUIRED ghi held,
  chỉ RELEASED xóa held) — nên lần acquire lại đầu tiên
  của cùng tên thread sau một reclaim luôn bị gắn cờ.
  T6-156 §4 đã dự báo đúng trường hợp này cho t8
  (không gắn cờ vì khác tên thread); lần này tới lượt t4
  (cùng tên thread) nên gắn cờ. **Kết luận: 0 double-acquire
  THẬT mới kể từ T6-156 đóng.** T10-157 lưu ý khi đối
  chiếu: số "10" của analyzer gồm 9 ca cũ + 1 artifact
  này; không có sự kiện 2 holder cùng lúc nào mới.
- **0 double-acquire mới** kể từ T6-156 đóng (theo nghĩa
  cơ chế). 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`khong-nha-grep.txt` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở và lúc đóng (10 chu kỳ mới sạch kể từ
  T6-156 đóng), 0 zombie lúc đóng, 0 stale mới trong
  phiên, queue 0 ticket, log nhất quán (457 cặp + 0 đang
  giữ hiệu dụng, 0 mất dấu khác — số chính thức đã loại
  6 dòng repro lỗi của T6-132), 0 TIMEOUT mới, 0 sự kiện
  "KHÔNG NHẢ" trên lock thật đợt 148–157 (toàn đợt) và
  đợt 157 (tới ~21:00Z), suite 9/9 ×6 lần (T7 (A) xanh
  cả 6 — xem §6), và thứ tự ghi mới đã có **191 chu kỳ
  thật** chứng minh (§3).
  Caveat duy nhất còn lại: **reboot #50 giết holder t4**
  (đợt 155) — cơ chế STALE-LOCK đã reclaim đúng (không
  kẹt, không double-acquire thật); và **nghịch lý đồng hồ
  khung wall đợt 156** (xem §8 — T0-157 đã giải quyết,
  T10-156 KHÔNG sai).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156 §6.2.
  File khối T7 đã trích `t7-block-a157.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155 và 156
  (cùng md5). Harness đợt này chạy đúng code (A) trong
  suite, không phải bản sao tay (xem §6.2).
- **PHẠM VI HẸP — đã tuân thủ, có bằng chứng:**
  `vcut-poll-quiet-v2.sh` KHÔNG đổi (`1710e480` lúc mở
  = lúc đóng); hàm `count_blockers` dùng chung cho gate
  cửa yên của T4 KHÔNG đổi (grep: `count_blockers` chỉ
  xuất hiện trong poll script, dòng 32/46 — trong suite
  chỉ có 1 lần xuất hiện duy nhất là dòng comment ở
  khối T7: "PHẠM VI HẸP: (A) CHỈ áp cho khối test T7
  này; KHÔNG đổi count_blockers", kèm 3 lệnh poll cũ
  của (B) đã comment; không có trong live-code khối T7).
  Script lock v2 KHÔNG đổi (`520b8baa`). T6 không đổi
  gì trong phiên (chỉ xóa 1 file cooldown theo luật
  prune đã phê duyệt — §7; không đụng code).
- `bash -n` harness t7-control-a157.sh: OK (bản sao của
  t7-control-a156.sh, chỉ đổi hậu tố a156 → a157 + sửa
  comment "đợt 156" → "đợt 157", diff kiểm chứng khớp).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151/152/153/154/155/156 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ bảy liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(20:46:25–20:48:55Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 25/28/26/23/
26/22 s — nhanh hơn đợt 156 (27–36 s/lượt), xem §1:
boot #56 đã ấm hơn lúc T6 chạy; vẫn xanh cả 6, không có
FAIL nào ở bất kỳ khối nào).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào trong 6 lượt chạy (raw vẫn 1620,
§4; không phải của suite T6).
- Lưu ý thao tác (F-157-T6-4): lệnh tóm tắt vòng lặp dùng
  grep `^PASS=` không khớp định dạng dòng kết quả
  (`== KẾT QUẢ: PASS=9 FAIL=0 ==`) nên in trống; đã xác
  minh lại từng log bằng tail + `grep -c "^PASS:"` (= 9)
  và `grep -c "^FAIL:"` (= 0). Không ảnh hưởng kết quả.

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round157-t6/t7-control-a157.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 348dab54 (#56,
btime 19:32:47Z giờ thật).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a157.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155 và 156; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a157-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 501 ms, max 3491 ms, trung bình 2092,37 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'14" (20:51:38–20:58:52Z).
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

- **Kết luận: (A) VẪN XANH sau sáu đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ bảy liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 840/840 dưới churn qua 7 đợt). Chú thích tỉ lệ
  (như T6-150/151/152/153/154/155/156): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 6 (đợt 156) → **7 (đợt
  157 — lần thứ bảy xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 38 (đợt 156) → **39 (đợt 157,
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
  - 20:43Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-156 thêm `cooldown-t8-round156`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG ngay từ lúc mở (20:43:xxZ) và vẫn TRỐNG
    lúc kiểm tra lại trước khi prune (20:59:15Z,
    `status-before-prune.txt`) — điều (e) thỏa ngay,
    **không phải chờ như đợt 151** (đợt 151 T4-151 giữ lock giữa phiên nên prune phải chờ).
  - 20:59:15Z: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-s10-round116`, mtime 2026-11-14T22:59:19Z,
    142,00h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round ~116; xem §12
    F-149-T6-3).
  - **Kết quả prune đợt 157 (lần 32): 1 file đã xóa
    (`cooldown-s10-round116`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (20:43Z) **101 file / 1414 byte**;
  lúc prune (20:59:15Z, trước khi xóa) **101 file /
  1414 byte** (log lock 1620 dòng — +0 dòng trong phiên,
  không file cooldown mới, xem §2/§4);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  đóng (~21:00Z) vẫn **100 file / 1400 byte**. Số học
  khớp: 101 + 0 = 101 ✓ (0 file cooldown mới trong
  phiên T6), rồi 101 − 1 = 100 ✓ (1 file prune). Không
  file nào bị xóa hay thêm ngoài 1 file prune giữa hai
  lần đếm của đợt này. Số học từ T6-156 đóng: 100 + 1
  file mới (`cooldown-t8-round156`) = 101 ✓ — khớp đúng số T10-156 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 62 file; ≥48h (`-mtime +1`): 76
  file**. Sau prune (20:59Z): **≥192h: 0 file; ≥72h:
  61 file; ≥48h: 75 file** — ≥72h giảm 62 → 61 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t6`, mtime 2026-11-15T08:55:05Z —
  lúc 20:59Z mới **~132,1h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 62, bằng lúc mở đợt
  156 — dù prune 31 đã xóa 1 file ≥72h — vì 1 file
  khác đã vượt ngưỡng 72h trong khoảng giữa 2 đợt; khớp
  số học, không phải mâu thuẫn. ≥48h lúc mở 76, bằng
  lúc mở đợt 156 — cùng lý do.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ tám liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt 156 xóa
  `cooldown-s3-round116`, đợt này xóa
  `cooldown-s10-round116` trước khi nó đủ 7 ngày — nó đủ 7 ngày theo đồng hồ
  tường vào khoảng **21/11 22:59Z** nhưng đã bị xóa ở
  đợt 157). T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 33 (T6-158): tổng lock 100 sau prune 32 —
  kiểm lại lúc mở đợt 158** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-157; #56 XÁC NHẬN (T0-157), KHÔNG giết holder; nghịch lý đồng hồ ĐÃ ĐƯỢC T0-157 GIẢI QUYẾT

- Boot duy nhất trong phiên: **348dab54** (btime
  19:32:47Z = epoch 1795203167, GIỜ THẬT theo T0-157).
  T6 **KHÔNG tự chứng nhận** số hiệu reboot #56 (thuộc
  T0-157/T2-157 — T0-157 đã XÁC NHẬN trong cờ
  `round157-t0.done` 20:52:49Z).
- Uptime boot lúc đóng ~1h27'. `journal --list-boots`
  chỉ 1 dòng 348dab54 (first entry 19:32:59Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~20:59Z, boot_id giống lúc mở).
- **NGHỊCH LÝ ĐỒNG HỒ — T0-157 ĐÃ GIẢI QUYẾT
  (T6 chỉ đối chiếu độc lập, không phán lại):**
  T10-156 ghi lúc đóng ~20:17Z vẫn boot c99a1045 "KHÔNG
  reboot mới" — mâu thuẫn bề ngoài với btime boot mới
  19:32:47Z (trước cả thời điểm T10 đóng). T0-157 giải
  quyết: **đồng hồ wall của cell trong suốt đợt 156 chạy
  NHANH hơn giờ thật một hằng số J ≥ 42'46"** (giả thuyết
  dẫn đầu J ≈ 50'26", kế thừa nghịch lý đợt 153; sampler
  137 mẫu không có gap nào > 90 s nên J là hằng số,
  không nhảy trong phiên); **btime 19:32:47Z là GIỜ
  THẬT** (Date header github.com khớp từng giây với đồng
  hồ local lúc 20:44:16Z; F-measure +0,92/+0,93 s ổn
  định; journal monotonic vs wall drift −0,16 s).
  **T10-156 KHÔNG sai** — các mốc wall đợt 156 đều phải
  trừ J mới ra giờ thật. Cửa sổ mù giờ thật
  (20:15:33Z − J, 19:32:47Z] dài J − 2.566 s (≈460 s nếu
  J = 3.026 s) — số hiệu #56 giả định không có boot ẩn
  trong đó; mù #88? giao T2-157.
  - **Đối chiếu độc lập của T6 (khớp mô hình J):**
    driver T8-156 đọc live `boot=c99a1045` tại
    19:34:16Z (khởi động), 19:35:12Z (attempt1 exit),
    19:36:02Z (attempt2 exit) — cả ba đều SAU btime
    19:32:47Z nếu đọc trong cùng một khung, nhưng đều là
    mốc wall-nhanh (giờ thật ≈ 18:43:50Z/18:44:46Z/
    18:45:36Z với J ≈ 50'26") — TRƯỚC reboot #56
    (19:32:47Z giờ thật) nên không mâu thuẫn. JSON O8
    `run.bootId` = `c99a1045`, stamp 19-34-17, pid 10439,
    21 kết quả 0 fail, md5 `78ac5a61…` — khớp đúng hồ sơ
    T10-156 (WebKit `78ac5a61`/`831d4b9b`, Chromium
    `7e4d9dd9` — T6 đọc lại từ đĩa, md5 khớp). **Kết quả
    O8 đợt 156 ĐỨNG (chạy thật trên c99a1045); chỉ các
    mốc wall đợt 156 phải trừ J.**
  - Giả thuyết trung gian của chính T6 (đồng hồ NHẢY
    ~1h TẠI reboot) đã bị bác bởi chứng cứ T0 (Date
    header + F-measure + drift) TRƯỚC khi T6 viết
    LIMITS này — xem F-157-T6-3. Không ảnh hưởng kết
    quả (không có dòng nào trong LIMITS này dùng giả
    thuyết đó).
- Reboot #56 (giờ thật 19:32:47Z) xảy ra sau khi T10-156
  đóng (20:15:33Z wall-nhanh ≈ 19:25:07Z giờ thật với
  J ≈ 50'26") và trước khi đợt 157 mở (20:35:51Z giờ
  thật — đồng hồ sau reboot đã là giờ thật). **KHÔNG
  giết holder** (§2): lock trống ≥22m08s trước reboot
  (cận dưới cứng theo J ≥ 42'46"; 29m48s theo J ≈
  50'26"). Reboot #53/#54/#55 KHÔNG giết holder (§2).
  LƯU Ý CHO T7-157 (từ cờ T0-157): btime cell-wall đội J
  so với giờ thật, DB scheduler chạy khung host (giờ
  thật); tính offset (m) phải cùng một khung, nếu không
  offset lệch ~50 phút và phá dải 33–49,8 s.

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-157
  (LIMITS này) — xem §10.
- Lock lúc đóng: TRỐNG, 0 ticket + 100 cooldown (sau
  prune), log 1620 dòng thô / 1614 dòng chính thức,
  457 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round157-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND157_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round157-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 157 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 157 đếm lại bằng dedup toàn cục): **4 batch /
  4 entry** (t0 1 / t1 1 / t5 1 / t6 1 — các file paths
  có mặt trên đĩa lúc ~21:00Z; các luồng khác chưa stage
  tới lúc này; T10 đếm lại). Lũy kế 111–156 (T10-156 đếm
  dedup toàn cục): **448 batch / 859 entry / 731 file**;
  T6 không tự cộng tay vào lũy kế file.

## 11. GHI CHÚ CHO T10-157 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ bảy liên tiếp, tổng 840/840 qua 7
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 6 → 7 (lần thứ bảy xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 38 → 39 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (457 cặp, 0 giữ hiệu dụng,
  0 TIMEOUT mới); prune lần 32 xóa 1 file, queue về đúng
  trần 100.
- **Reboot #56 XÁC NHẬN (T0-157), KHÔNG giết holder**
  (lock trống ≥22m08s trước reboot; #53/#54/#55 cũng
  không giết holder — đều trong khoảng trống log).
  **Nghịch lý đồng hồ đã được T0-157 giải quyết**
  (wall đợt 156 nhanh hơn giờ thật J ≥ 42'46"; btime
  19:32:47Z là giờ thật; T10-156 KHÔNG sai; O8 đợt 156
  đứng — chạy thật trên c99a1045). Mù #88? giao T2-157.
- **Double-acquire theo analyzer 9 → 10 — CA MỚI LÀ
  ARTIFACT** (t4 acquire lại 18:02:49Z sau reclaim #50;
  analyzer key theo tên thread, không xóa trạng thái khi
  gặp STALE-LOCK). 0 double-acquire THẬT mới. T10-157
  lưu ý khi đối chiếu (§4).
- 0 zombie lúc mở và lúc đóng; 3 socket X11 (X193/X194/
  X195, 20:49Z) của luồng khác chạy lúc T6 đóng — không
  acquire lock nào trong cửa sổ T6 (diff log RỖNG);
  T10-157 lưu ý khi đối chiếu log (+35 dòng kể từ T6-156
  đóng đều là của T4-156/T8-156, không phải của
  suite/harness T6).
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #78?–#81? GIỮ MỞ; mù #85?/#86?/#87? + #88? giao
  T2-157; birefnet 0 thử lần 10; u2net là fallback chính
  thức; POSTBOOT_PASS #56 CHƯA CÓ — T5-157 xử lý;
  POSTBOOT_PASS #53/#54/#55 KHÔNG CÓ — T5-157).
- Cờ `round157-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-157 (F-157-T6-n)

- **F-157-T6-1 — `grep -c '-> PASS'` báo lỗi option
  (pattern bắt đầu bằng `-`).** Lệnh `grep -c '-> PASS'
  t7-a157-churn.log` trả "invalid option -- '>'" (2
  lần, PASS và FAIL). Đã chạy lại với `grep -c --`:
  120 PASS / 0 FAIL — khớp đếm bằng python
  (`appendix-numbers.txt`) và dòng tổng kết harness.
  Không ảnh hưởng kết quả.
- **F-157-T6-2 — Đọc nhầm etime ps "00:50" là 50 phút.**
  Trong `ps-full-open.txt`, pid 3205 (poller T4-157)
  có ELAPSED "00:50" — T6 thoạt đọc là 50 phút (sẽ
  ngụ ý poller khởi động trước cả khi đợt mở). Thực tế
  định dạng etime `[[DD-]HH:]MM:SS` nên "00:50" = 50
  GIÂY (khởi động ~20:43:05Z, sau khi đợt mở 20:35:51Z
  — hợp lý). Đã sửa trước khi viết bất kỳ kết luận nào;
  không ảnh hưởng kết quả. Bài học: etime 2 trường là
  MM:SS, chỉ 3 trường mới có giờ.
- **F-157-T6-3 — Giả thuyết trung gian SAI về đồng hồ
  (đã bị bác trước khi viết LIMITS).** Trước khi đọc cờ
  T0-157, T6 suy luận reboot kèm "nhảy đồng hồ ~1h TẠI
  reboot" để giải thích mâu thuẫn btime 19:32:47Z vs
  driver T8 đọc c99a1045 lúc 19:34:16Z. Cờ T0-157
  (đọc 20:52:49Z) chứng minh mô hình đúng: wall đợt 156
  chạy NHANH hằng số J ≥ 42'46" suốt phiên, btime là giờ
  thật — không có nhảy tại reboot (Date header github
  khớp từng giây; F-measure ổn định; drift journal
  −0,16 s). Giả thuyết nhảy đồng hồ KHÔNG xuất hiện
  trong bất kỳ file giao phẩm nào; LIMITS này dùng mô
  hình J của T0 (xem §8). Không ảnh hưởng kết quả.
- **F-157-T6-4 — Lệnh tóm tắt vòng lặp suite dùng grep
  `^PASS=` không khớp định dạng dòng kết quả.** Dòng kết
  quả suite là `== KẾT QUẢ: PASS=9 FAIL=0 ==` nên grep
  `^PASS=` in trống trong tóm tắt chạy nền. Đã xác minh
  lại từng log bằng tail + `grep -c "^PASS:"` (= 9) và
  `grep -c "^FAIL:"` (= 0), rc=0 cả 6 lượt. Không ảnh
  hưởng kết quả (chỉ là lệnh tóm tắt).

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a157-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round157-t6/appendix-numbers.txt` giữ bản
trích gốc:

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=501 max=3491 mean=2092.37
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
suite run1: PASS=9 FAIL=0 T7A=1
suite run2: PASS=9 FAIL=0 T7A=1
suite run3: PASS=9 FAIL=0 T7A=1
suite run4: PASS=9 FAIL=0 T7A=1
suite run5: PASS=9 FAIL=0 T7A=1
suite run6: PASS=9 FAIL=0 T7A=1
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a157.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=467, COOLDOWN=191, RELEASED=457, STALE-LOCK=10, STALE-TICKET=1, TICKET=478, TIMEOUT=10, total=1614
cleaned-open pairs ACQUIRED->RELEASED: 457
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 10
cleaned-close counts: TOTAL: ACQUIRED=467, COOLDOWN=191, RELEASED=457, STALE-LOCK=10, STALE-TICKET=1, TICKET=478, TIMEOUT=10, total=1614
cleaned-close pairs ACQUIRED->RELEASED: 457
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 10
raw log lines open: 1620
raw log lines close: 1620
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
KHONG-NHA lines in raw log: 0
```

---
**Batch stage / Tổng batch:** T6-157: 1 batch / 1 entry / 1 file. Đợt 157 tới lúc T6 đóng (tạm tính): 4 batch / 4 entry (t0/t1/t5/t6). Lũy kế 111–156 (T10-156 đếm dedup toàn cục): 448 batch / 859 entry / 731 file. Tổng batch chờ user push (đợt 136–156): 200 batch / 281 entry / 235 file (theo T10-156; T10-157 đếm lại sau khi đợt 157 đủ batch).
