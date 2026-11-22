# PHASE9 ROUND158 T6 — (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 8 LIÊN TIẾP) + #57/#58 KHÔNG GIẾT HOLDER + prune lần 33: XÓA 1 FILE — LIMITS

- Đợt: 158, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 06:35 +07 21/11/2026 (= 23:35:51Z 20/11). Chạy
  23:39Z 20/11 → 00:06Z 21/11/2026. Lúc mở đã ở trên boot
  `28366bd0` (btime 23:06:08Z) — reboot #58 (quyết (s) đợt
  157 đã XÁC NHẬN); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 8 liên tiếp nếu đạt — tổng
  960/960); ghi rõ số chu kỳ, điều kiện churn, boot đo;
  (b) kiểm tra lock khỏe: số cặp, số đang giữ, TIMEOUT mới,
  "KHÔNG NHẢ"; (c) chạy suite liên quan và ghi exit code +
  thời gian thật; (d) prune lần 33: đếm queue lúc mở, xóa
  file theo đúng quy tắc prune các đợt trước, ghi rõ xóa
  file nào, queue trước/sau; kiểm tra reboot giữa phiên
  (nếu có) có giết holder nào không; (e) ghi sai số riêng
  F-158-T6-n; (f) stage paths NUL-delimited; (g) viết cờ
  .done CÓ NỘI DUNG.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151/152/
  153/154/155/156/157, file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–157); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (468 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) —
  VỚI 1 LƯU Ý ĐẾM: double-acquire theo analyzer GIỮ 10,
  0 ca mới (ca artifact t4 18:02:49Z vẫn là ca mới nhất;
  xem §4). Reboot #57/#58 GIỮA HAI ĐỢT đều KHÔNG giết
  holder nào để lại orphan (xem §2/§8 — #58 sát nút nhất:
  RELEASED cuối 23:06:36Z theo đồng hồ boot cũ nhanh ~+28 s,
  tức ≈ btime 23:06:08Z; không STALE-LOCK, không ACQUIRED
  dở dang). Prune lần 33: xóa 1 file cũ nhất
  (điều (b)), queue 101 → 100 file — PHẢI CHỜ t4-158 nhả
  lock (điều (e)) rồi mới prune, theo tiền lệ T6-151.**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round158-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, wc-open.txt, wc-close.txt,
  queue-open.txt, queue-close.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log,
  analyze-log.py,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt,
  new-lines-since-t6-157.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt, khong-nha-grep.txt,
  status-before-prune.txt, wait-lock-empty.sh,
  wait-lock-empty.log, lock-empty.marker,
  test-v2-t6-run1.log … run6.log, t7-control-a158.sh,
  t7-control-a158.stdout.log, t7-block-a158.sh,
  t7-a158-churn.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 28366bd0 (#58 ĐÃ XÁC NHẬN, btime 23:06:08Z GIỜ THẬT); lock TRỐNG; queue 101 file (khớp T10-157 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `28366bd0-d6d6-4a50-a386-666c0aa3c062`, btime 23:06:08Z
  theo /proc/stat** (epoch 1795215968; `uptime -s` =
  23:06:08; `journal --list-boots` chỉ 1 dòng 28366bd0,
  first entry 23:06:19Z). Uptime ~33' lúc T6 bắt đầu
  (23:39Z), ~48' lúc snapshot đóng (23:54Z). Boot này là
  #58 đã XÁC NHẬN theo quyết (s) đợt 157 — **KHÔNG có
  reboot mới kể từ khi T10-157 đóng (~23:28Z)**, T0-158
  xác minh độc lập bằng 6 nguồn (cờ `round158-t0.done`
  23:50:31Z). T6 KHÔNG tự chứng nhận số hiệu #58 (thuộc
  T0-158/T2-158); T6 chỉ chứng nhận từ log lock rằng #57/#58
  không giết holder (xem §2/§8). **KHÔNG có reboot trong
  phiên T6** (boot_id giống nhau lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T0-158 đo local ≈ Cloudflare ±1 s lúc 23:46Z —
  **không còn dấu hiệu chạy nhanh ~50' như đợt 156**
  (giao T2-158). Các mốc wall đợt 158 đọc trực tiếp được.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Lưu ý phương pháp: `md5-open.txt` ghi lại các giá trị
  md5 đã đo bằng lệnh `md5sum` lúc mở (~23:40Z, xem log
  phiên); `md5-close.txt` đo lại từ đĩa lúc đóng — hai
  bản khớp nhau từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp đúng số
  T10-157 đóng (100 sau prune 32 + 1 file cooldown mới
  `cooldown-t8-round157`, mtime 23:06:36Z, §2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật lúc mở; vite của t4-158 lúc đóng (holder sống hợp lệ)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 23:40Z
  (mở, `ps-full-open.txt`, 16 dòng) và lúc 23:54Z
  (đóng, `ps-full-close.txt`, 44 dòng).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống
  hoàn toàn; 3 dòng chứa chuỗi "vite" trong snapshot ps
  đều là chính lệnh của T6 (tham số `vite-lock` trong
  lệnh snapshot + `sed vite-lock-v2.log`), KHÔNG phải
  process vite (cùng bẫy tự-tham-chiếu như đợt 155/156/157).
- **Lúc đóng: vite của t4-158 đang chạy hợp lệ** —
  `ss -tlnp` có `LISTEN [::1]:5187` (MainThread pid 37626);
  ps có `run-attempt t4 5187 1500 30` (pid 37370, attempt3
  của t4-158, 20 probe) + npm/sh/node vite (pid 37610/
  37625/37626) + 1 dòng lệnh snapshot của T6. Đây là
  holder sống của lock lúc snapshot đóng (§2/§4) — T6
  không kill, không đụng tới.
- **Lúc mở: `/tmp/.X11-unix/` trống. Lúc đóng: 3 socket
  X193 (23:53Z) / X194 / X195 (23:47Z) — của các luồng
  khác đợt 158** (T6 không khởi động Xvfb/vite nào,
  không đụng tới các process này, không kill process nào
  trong phiên này). Các process luồng khác lúc đóng:
  watcher-158 (T5, pid 10867, 23:43Z), b2-watcher (T9,
  pid 9792, 23:41Z), poller/run-attempt T4-158 (pid 37370).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-158).
  Inotify: `max_user_watches` = **63747** lúc kiểm cuối
  (~23:57Z, khớp đợt 147–157 — không có lần flip mới
  trong phiên T6; quyết parent (m) đợt 146: ghi làm chú
  thích, không hành động).
- Tải hệ thống trong phiên: các luồng đợt 158 khởi động
  dần (watcher T5 23:43Z, b2-watcher T9 23:41Z, attempt
  T4-158 23:50Z) — harness churn vẫn 120/120 (xem §6).
  Suite đợt này chạy 23–31 s/lượt (tương đương đợt 157:
  22–28 s/lượt).

## 2. Lock lúc mở: TRỐNG; lúc snapshot đóng: ĐANG GIỮ bởi t4-158 (holder sống hợp lệ); +29 dòng kể từ T6-157 đóng — TẤT CẢ TRƯỚC phiên T6; +9 dòng TRONG phiên — TẤT CẢ CỦA t4-158

- **Lúc mở (23:40Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (23:54:15Z): lock ĐANG GIỮ bởi
  t4-158** — status ghi `thread=t4 pid=37370 port=5187
  started=2026-11-20T23:53:24Z boot=28366bd0…`, vite node
  pid 37626 trên cổng 5187, `0 ticket + 101 cooldown`,
  rc=0. Đây là holder sống hợp lệ (attempt3 lượt yên #27
  của T4-158), KHÔNG phải orphan — xem §4 (still held
  naive = 1, đúng pid này). **Vì lock đang giữ nên prune
  PHẢI CHỜ (điều (e)) — T6 chạy waiter `wait-lock-empty.sh`
  (poll status mỗi 60 s, tối đa 30 lần) rồi mới prune;
  xem §7.**
- **Log lock +29 dòng kể từ T6-157 đóng** (raw 1620 lúc
  T6-157 đóng → 1649 lúc T6-158 mở → 1658 lúc snapshot
  đóng): 29 dòng đều trước phiên T6; **+9 dòng trong
  phiên T6-158** (diff bản đã lọc mở/đóng, §4) — tất cả
  là chu kỳ của t4-158, không phải của suite/harness T6
  (suite + harness chạy trên log riêng trong /tmp).
- Đối chiếu 29 dòng (khớp đúng từng dòng, file
  `new-lines-since-t6-157.txt`):
  - t4: 1 chu kỳ HOÀN TẤT (21:00:27Z → 21:03:55Z; hold
    208 s; wait_s=0; 0 COOLDOWN).
  - t8-round157: 7 chu kỳ HOÀN TẤT (22:31:56Z →
    23:06:36Z; holds 176 / 901 / 160 / 260 / 70 / 131 /
    230 s; 5 dòng COOLDOWN kèm theo, các lần chờ
    14931–14957 ms trên cổng 5490/5390).
  - Tổng: Δ TICKET +8, Δ ACQUIRED +8, Δ RELEASED +8,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **8/8 chu kỳ mới hoàn
    tất sạch.**
- Đối chiếu 9 dòng trong phiên (diff mở/đóng, tất cả
  của t4-158):
  - 2 chu kỳ HOÀN TẤT (23:50:36Z → 23:50:44Z, hold 7 s,
    wait_s=1; 23:53:00Z → 23:53:09Z, hold 9 s, wait_s=0,
    + 1 COOLDOWN 14594 ms cổng 5187).
  - 1 chu kỳ ĐANG MỞ (TICKET + ACQUIRED 23:53:24Z,
    wait_s=15 — holder sống lúc snapshot đóng; đã hoàn
    tất sau đó: RELEASED 23:56:51Z, hold 207 s — xem kiểm
    cuối dưới).
  - Tổng trong phiên: Δ TICKET +3, Δ ACQUIRED +3,
    Δ RELEASED +2, Δ COOLDOWN +1, Δ STALE-LOCK +0,
    Δ TIMEOUT +0 lúc snapshot đóng. **2/2 chu kỳ đã đóng
    hoàn tất sạch; chu kỳ thứ 3 đang giữ hợp lệ, không
    phải kẹt.**
- **Kiểm cuối sau snapshot đóng (00:02:50Z 21/11): chu kỳ
  t4-158 đã hoàn tất** — RELEASED 23:56:51Z (hold 207 s),
  log raw 1659 dòng / đã lọc 1653 dòng; lock TRỐNG xác
  minh lại 00:02:31Z (trước prune) và 00:02:50Z (sau
  prune); boot không đổi (btime 1795215968). Tổng trong
  phiên lúc kiểm cuối: Δ TICKET +3, Δ ACQUIRED +3,
  Δ RELEASED +3, Δ COOLDOWN +1 — **3/3 chu kỳ của t4-158
  hoàn tất sạch.**
- **KHOẢNG TRỐNG LOG 21:03:55Z → 22:31:56Z (1h28m01s):
  KHÔNG có dòng lock nào.** Reboot #57 (btime 21:05:15Z)
  rơi vào khoảng này — xem §8.
- **REBOOT #57 (btime 21:05:15Z) KHÔNG giết holder nào:**
  dòng lock cuối trước reboot là t4 RELEASED 21:03:55Z;
  dòng đầu sau reboot là t8-round157 TICKET 22:31:56Z.
  Lock trống ít nhất 80 s (danh nghĩa) trước reboot —
  kể cả với nghịch lý đồng hồ boot cũ nhanh ≥+25 s tại
  #57 (quyết (p) đợt 157 / F-157-T8-2: poll cuối
  21:05:48Z theo đồng hồ boot cũ) thì thời điểm release
  thật còn sớm hơn nữa. Không có ACQUIRED nào chưa
  release tại thời điểm #57.
- **REBOOT #58 (btime 23:06:08Z) KHÔNG để lại holder
  bị giết / orphan** (xem §8 chi tiết): chu kỳ cuối
  của t8-round157 ACQUIRED 23:02:45Z, RELEASED 23:06:36Z
  (hold 230 s — số học hold khớp: 23:02:45Z + 231 s ≈
  23:06:36Z); theo đồng hồ boot cũ (nhanh ~+28 s so với
  boot mới, F-157-T8-3) thì thời điểm release thật ≈
  btime 23:06:08Z — tức holder nhả đúng lúc reboot xảy
  ra. Không có dòng STALE-LOCK nào, không có ACQUIRED
  dở dang nào (still held = 0 lúc mở), lock TRỐNG đã
  được T8-157 xác minh ~23:08Z sau reboot và T6-158 xác
  minh lại lúc mở 23:40Z. **Kết luận: #58 không giết
  holder nào theo nghĩa để lại lock mồ côi.**
- **File cooldown mới kể từ T6-157 đóng:
  `cooldown-t8-round157` (mtime 23:06:36Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 157 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào. (File `cooldown-t4`
  có mtime cập nhật 23:53Z do chu kỳ t4-158 lúc
  23:53:09Z — cùng tên file, không tăng tổng số file.)

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 201 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 11 chu kỳ hoàn tất
  kể từ T6-157 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2; gồm 1 chu
  kỳ t4 + 7 chu kỳ t8-round157 trước phiên, và 3 chu kỳ
  t4-158 trong phiên, chu kỳ thứ 3 hoàn tất 23:56:51Z
  sau snapshot đóng).
  - Cộng với 191 chu kỳ T6-157 đã đếm = **202 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (191 đợt
    157 + 11 đợt này). Chu kỳ t4 bị #50 giết (15:01:45Z,
    đợt 155) KHÔNG tính vào 201 (dở dang, không có
    RELEASED) — nhưng chính cơ chế STALE-LOCK đã xử lý
    đúng trường hợp này (reclaim sạch, không kẹt, không
    double-acquire thật — xem §4 về artifact đếm).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1652 dòng chính thức lúc snapshot đóng, 467 cặp, 1 đang giữ (holder sống t4-158), double-acquire GIỮ 10 (0 ca mới), 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
diff: bản đã lọc = raw trừ đúng 6 dòng đó; diff bản đã
lọc mở/đóng chỉ có 9 dòng mới của t4-158, §2).
Bản đã lọc lúc đóng: **1652 dòng** (raw 1658) — **+38 dòng
kể từ T6-157 đóng** (29 dòng trước phiên + 9 dòng trong
phiên: 1614 → 1643 → 1652). Kiểm cuối sau prune
(00:02:50Z 21/11): bản đã lọc **1653 dòng** (raw 1659),
RELEASED 468, cặp 468, đang giữ 0, double-acquire 10 —
xem chi tiết dưới bảng.

| Chỉ số (bản đã lọc) | T6-157 đóng | T6-158 mở | T6-158 đóng (snapshot) | Δ trong phiên T6-158 |
|---|---|---|---|---|
| Tổng dòng | 1614 | 1643 | 1652 | +9 |
| TICKET | 478 | 486 | 489 | +3 |
| ACQUIRED | 467 | 475 | 478 | +3 |
| RELEASED | 457 | 465 | 467 | +2 |
| COOLDOWN | 191 | 196 | 197 | +1 |
| STALE-LOCK | 10 | 10 | 10 | +0 |
| STALE-TICKET | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 457 | 465 | 467 | +2 |
| Đang giữ cuối log (naive) | 0 | 0 | 1 (t4 sống) | +1 (live) |
| Double-acquire | 10 | 10 | 10 | 0 mới trong phiên |

- **"Đang giữ = 1" lúc snapshot đóng (naive):** ACQUIRED
  478 − RELEASED 467 = 11 ACQUIRED chưa release trong
  lịch sử log — nhưng 10 trong số đó đã được xử lý: 9 ca
  double-acquire cũ (đã giải thích các đợt trước) + 1 ca
  t4 15:01:45Z (STALE-LOCK #10 lúc 16:31:32Z đã reclaim
  — §2 T6-156). Ca thứ 11 là **holder sống hợp lệ**:
  t4-158 ACQUIRED 23:53:24Z (attempt3 lượt yên #27,
  pid 37370, vite pid 37626 đang chạy — §1), chưa tới
  lúc release khi T6 snapshot. **Số đang giữ HIỆU DỤNG
  ngoài holder sống này = 0** (không holder mồ côi nào;
  lock TRỐNG lúc mở — status xác nhận độc lập, §2).
  **Kiểm cuối sau prune (00:02:50Z): đang giữ = 0 hoàn
  toàn** — attempt3 đã RELEASED 23:56:51Z (hold 207 s),
  cặp lên 468, still held 0 (xem `analyze-log-cleaned-final.txt`).
- **DOUBLE-ACQUIRE GIỮ 10 — 0 CA MỚI kể từ T6-157 đóng
  và trong phiên T6-158.** Danh sách 10 ca của analyzer
  giống hệt đợt 157 (dòng 79/148/200/262/781/888/1321/
  1375/1417/1581 bản đã lọc); ca mới nhất vẫn là artifact
  t4 18:02:49Z sau reclaim #50 (xem §4 T6-157). Các lần
  acquire lại của t4 đợt này (21:00:27Z, 23:50:37Z,
  23:53:00Z, 23:53:24Z) đều ghép cặp RELEASED đúng và
  KHÔNG bị gắn cờ — vì máy trạng thái analyzer đã về 0
  sau RELEASED 18:06:35Z. **Kết luận: 0 double-acquire
  THẬT mới.** T10-158 lưu ý khi đối chiếu: số "10" của
  analyzer gồm 9 ca cũ + 1 artifact; không có sự kiện
  2 holder cùng lúc nào mới.
- **0 double-acquire mới** kể từ T6-157 đóng (theo nghĩa
  cơ chế). 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`khong-nha-grep.txt` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (11 chu kỳ mới sạch kể từ T6-157 đóng),
  0 zombie lúc đóng, 0 stale mới trong phiên, queue
  0 ticket, log nhất quán (468 cặp + 0 đang giữ lúc kiểm
  cuối, 0 mất dấu khác — số chính thức đã loại 6 dòng
  repro lỗi của T6-132), 0
  TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–158 (toàn đợt) và đợt 158 (tới ~00:03Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **202 chu kỳ thật** chứng minh (§3).
  Caveat duy nhất còn lại: **reboot #50 giết holder t4**
  (đợt 155) — cơ chế STALE-LOCK đã reclaim đúng (không
  kẹt, không double-acquire thật); và **reboot #58 sát
  nút với lần release cuối của t8-round157** (xem §8 —
  không để lại orphan, nhưng T2-158 phán cuối về mù).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157 §6.2.
  File khối T7 đã trích `t7-block-a158.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156 và
  157 (cùng md5). Harness đợt này chạy đúng code (A) trong
  suite, không phải bản sao tay (xem §6.2).
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
- `bash -n` harness t7-control-a158.sh: OK (bản sao của
  t7-control-a157.sh, chỉ đổi hậu tố a157 → a158 + sửa
  comment "đợt 157" → "đợt 158" ở 1 dòng header còn sót —
  xem F-158-T6-2).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151/152/153/154/155/156/157 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ tám liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(23:44:14–23:46:46Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 23/26/31/23/
23/26 s — tương đương đợt 157: 22–28 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào do 6 lượt chạy (9 dòng mới trong
phiên đều là của t4-158, §2/§4).
- Lưu ý thao tác (F-158-T6-1): lần chạy đầu dùng
  `/usr/bin/time` (không tồn tại trên VM) nên cả 6 lượt
  rc=127 mà suite không chạy; đã chạy lại bằng
  `date +%s` đo thời gian. Không ảnh hưởng kết quả.

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round158-t6/t7-control-a158.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 28366bd0 (#58,
btime 23:06:08Z giờ thật).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a158.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156 và 157; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a158-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 513 ms, max 3475 ms, trung bình 2007,35 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'03" (23:46:56–23:53:59Z).
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

- **Kết luận: (A) VẪN XANH sau bảy đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ tám liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 960/960 dưới churn qua 8 đợt). Chú thích tỉ lệ
  (như T6-150/151/152/153/154/155/156/157): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 7 (đợt 157) → **8 (đợt
  158 — lần thứ tám xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 39 (đợt 157) → **40 (đợt 158,
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
  - 23:40Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-157 thêm `cooldown-t8-round157`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG lúc mở (23:40Z) nhưng t4-158 acquire lúc
    23:50:36Z (attempt lượt yên #27) và vẫn giữ lúc
    snapshot đóng 23:54:15Z (attempt3, started 23:53:24Z)
    — điều (e) KHÔNG thỏa lúc đó nên **prune PHẢI CHỜ**,
    theo đúng tiền lệ T6-151 (đợt 151 T4-151 giữ lock giữa
    phiên nên prune phải chờ). T6 chạy waiter
    `wait-lock-empty.sh` (poll `status` mỗi 60 s, tối đa
    30 lần) và chỉ prune sau khi status về TRỐNG.
  - 23:57:16Z: waiter poll lần 3 thấy status TRỐNG
    (t4-158 đã RELEASED 23:56:51Z, hold 207 s —
    `lock-empty.marker`); T6 xác minh lại TRỐNG ngay
    trước prune (00:02:31Z, `status-before-prune.txt`).
  - 00:02:31Z 21/11: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-t6`, mtime 2026-11-15T08:55:05Z,
    135,12h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round ~117; xem §12
    F-149-T6-3).
  - **Kết quả prune đợt 158 (lần 33): 1 file đã xóa
    (`cooldown-t6`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (23:40Z) **101 file / 1414 byte**;
  lúc snapshot đóng (23:54Z, trước khi prune) **101 file /
  1414 byte** (log lock tăng 9 dòng trong phiên nhưng
  không thêm file cooldown mới — file `cooldown-t4` chỉ
  cập nhật mtime, xem §2);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (00:02:50Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-157 đóng: 100 + 1 file mới
  (`cooldown-t8-round157`) = 101 ✓ — khớp đúng số T10-157 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 63 file; ≥48h (`-mtime +1`): 77
  file**. Sau prune (00:02:50Z): **≥192h: 0 file; ≥72h:
  62 file; ≥48h: 76 file** — ≥72h giảm 63 → 62 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t8-round117`, mtime 2026-11-15T09:01:00Z —
  lúc 00:02:50Z mới **~135,03h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 63, tăng 1 so với lúc
  mở đợt 157 (62) — 1 file khác đã vượt ngưỡng 72h trong
  khoảng giữa 2 đợt; khớp số học, không phải mâu thuẫn.
  ≥48h lúc mở 77, tăng 1 so với đợt 157 (76) — cùng lý do.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ chín liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt 156 xóa
  `cooldown-s3-round116`, đợt 157 xóa
  `cooldown-s10-round116`, đợt này xóa
  `cooldown-t6` trước khi nó đủ 7 ngày — nó đủ 7 ngày theo đồng hồ
  tường vào khoảng **22/11 08:55Z** nhưng đã bị xóa ở
  đợt 158). T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 34 (T6-159): tổng lock 100 sau prune 33 —
  kiểm lại lúc mở đợt 159** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-158; #57/#58 KHÔNG giết holder; đồng hồ đã về giờ thật

- Boot duy nhất trong phiên: **28366bd0** (btime
  23:06:08Z = epoch 1795215968, GIỜ THẬT theo T0-158).
  T6 **KHÔNG tự chứng nhận** số hiệu reboot #58 (thuộc
  T0-158/T2-158 — T0-158 đã XÁC NHẬN trong cờ
  `round158-t0.done` 23:50:31Z bằng 6 nguồn độc lập).
- Uptime boot lúc đóng ~48'. `journal --list-boots`
  chỉ 1 dòng 28366bd0 (first entry 23:06:19Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~23:54Z, boot_id giống lúc mở; kiểm
  lại sau prune, §7/§9).
- **ĐỒNG HỒ ĐÃ VỀ GIỜ THẬT (T0-158):** local ≈ Cloudflare
  ±1 s lúc 23:46Z — không còn dấu hiệu chạy nhanh ~50'
  như đợt 156. Các mốc wall đợt 158 đọc trực tiếp được;
  nghịch lý đồng hồ còn lại chỉ là dư âm của boot cũ
  (xem dưới, #58).
- **REBOOT #57 (btime 21:05:15Z, boot `bcbaa3ad`) KHÔNG
  giết holder** (§2): lock trống ≥80 s danh nghĩa trước
  reboot; đồng hồ boot cũ nhanh ≥+25 s nên thời điểm
  release thật còn sớm hơn. T4-157 xác nhận attempt1
  hợp lệ đã xong trước reboot (21:04:20Z).
- **REBOOT #58 (btime 23:06:08Z, boot `28366bd0`) — SÁT
  NÚT NHẤT, KHÔNG để lại orphan:** chu kỳ cuối
  t8-round157 ACQUIRED 23:02:45Z → RELEASED 23:06:36Z
  (hold 230 s, số học khớp). Đồng hồ boot cũ nhanh ~+28 s
  so với boot mới (F-157-T8-3: report Chromium 86n2
  finishedAt 23:06:33.359Z + ALL DONE 23:06:36Z mang
  timestamp boot cũ) → thời điểm release thật ≈
  23:06:36Z − 28 s ≈ 23:06:08Z = btime. Tức holder nhả
  đúng lúc reboot xảy ra (sai số vài giây theo độ chính
  xác của ước lượng +28 s). Bằng chứng không có holder
  bị giết dở dang: (1) dòng RELEASED tồn tại với hold_s
  khớp số học — chỉ holder sống mới ghi được dòng này;
  holder bị reboot giết giữa chừng thì KHÔNG có RELEASED;
  (2) 0 dòng STALE-LOCK mới; (3) still held = 0 lúc
  T6-158 mở; (4) lock TRỐNG xác minh độc lập 2 lần sau
  reboot (T8-157 ~23:08Z, T6-158 23:40Z). Verdict 86n2
  PASS đứng (report JSON `ok=true` đã ghi trên đĩa trước
  reboot — T8-157). **T6 không phán mù cho #57/#58 —
  giao T2-158** (mù #88? MỞ từ đợt 157; #89? E2 ĐÓNG /
  F giao T2-158 theo quyết (p) đợt 157).
- **POSTBOOT_PASS:** #58 ĐÃ CÓ (T5-158 ghi 23:43:22Z,
  boot+37m14s, replay đầy đủ, poll=0); #57 KHÔNG CÓ,
  KHÔNG BÙ ĐƯỢC (journal + dpkg.log đã mất; T8-157 đã tự
  kiểm đầy đủ + O8 3/3 PASS trên #57 — ghi nhận, không
  phải cờ; T5-158 KHÔNG ghi cờ hộ). Marker sống qua 10
  reboot #49–#58 (T5-158).

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-158
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (00:02:50Z 21/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 1659 dòng thô /
  1653 dòng chính thức, 468 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round158-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND158_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round158-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 158 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 158 đếm lại bằng dedup toàn cục): **4 batch /
  4 entry** (t0 1 / t1 1 / t5 1 / t6 1 — các file paths
  có mặt trên đĩa lúc ~00:03Z; các luồng khác chưa stage
  tới lúc này; T10 đếm lại). Lũy kế 111–157 (T10-157 đếm dedup toàn cục):
  **458 batch / 872 entry / 743 file**;
  T6 không tự cộng tay vào lũy kế file.

## 11. GHI CHÚ CHO T10-158 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ tám liên tiếp, tổng 960/960 qua 8
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 7 → 8 (lần thứ tám xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 39 → 40 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (468 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); prune lần 33 xóa 1 file, queue về đúng
  trần 100 (sau khi chờ t4 nhả lock).
- **Reboot #57/#58 KHÔNG giết holder** (#57: lock trống
  ≥80 s trước reboot; #58: release cuối ≈ btime theo
  đồng hồ boot cũ nhanh ~+28 s — không STALE-LOCK, không
  orphan, still held 0 lúc mở). **Đồng hồ đã về giờ
  thật** (T0-158: local ≈ Cloudflare ±1 s). Mù cho
  #57/#58 giao T2-158.
- **Double-acquire theo analyzer GIỮ 10 — 0 ca mới.**
  T10-158 lưu ý khi đối chiếu (§4).
- 0 zombie lúc mở và lúc đóng; 3 socket X11 (X193 23:53Z /
  X194 / X195 23:47Z) của luồng khác chạy lúc T6 đóng —
  t4-158 acquire lock trong cửa sổ T6 (9 dòng mới: 2 chu
  kỳ hoàn tất + 1 chu kỳ đang mở lúc snapshot); T10-158
  lưu ý khi đối chiếu log (+29 dòng kể từ T6-157 đóng đều
  là của T4-157/T8-157, +9 dòng trong phiên là của T4-158,
  không phải của suite/harness T6).
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #78?–#81? GIỮ MỞ; mù #85?/#86?/#87? GIỮ MỞ theo
  quyết (b) đợt 157; mù #88? MỞ + #89? E2 ĐÓNG / F giao
  T2-158; birefnet 0 thử lần 11; u2net là fallback chính
  thức; POSTBOOT_PASS #57 KHÔNG CÓ — không bù được;
  POSTBOOT_PASS #58 ĐÃ CÓ — T5-158).
- Cờ `round158-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-158 (F-158-T6-n)

- **F-158-T6-1 — `/usr/bin/time` không tồn tại trên VM
  (rc=127 ×6, suite chưa chạy).** Lệnh chạy suite lần đầu
  dùng `/usr/bin/time -f …` — binary không có nên cả 6
  lượt rc=127, log suite trống (lỗi vào file `run*.time.txt`).
  Đã chạy lại bằng `date +%s` đo thời gian: 6/6 PASS=9
  FAIL=0 rc=0. Không ảnh hưởng kết quả. Bài học: kiểm tra
  binary đo thời gian tồn tại trước khi dùng trong vòng lặp.
- **F-158-T6-2 — Header harness còn sót chữ "đợt 157".**
  Script `t7-control-a158.sh` tạo bằng `sed s/a157/a158/`
  từ bản a157 — 1 dòng comment header vẫn ghi "đợt 157"
  (dòng 2, sed không đổi vì không chứa chuỗi a157). Đã
  sửa tay thành "đợt 158" sau khi harness chạy xong (chỉ
  comment, không đổi code chạy; `bash -n` OK lại sau sửa).
  Không ảnh hưởng kết quả (harness trích block verbatim từ
  suite, không phụ thuộc comment này).
- **F-158-T6-3 — Waiter `wait-lock-empty.sh` ghi nhầm
  "TRONG" thay vì "TRỐNG" trong marker.** Dòng echo của
  waiter ghi `lock TRONG poll=3` (thiếu dấu). Logic phát
  hiện vẫn đúng (grep `'TRỐNG'` trên output của
  `status`) — marker chỉ sai chính tả nhãn. T6 đã sửa
  tay nội dung `lock-empty.marker` thành "lock TRỐNG
  poll=3" + ghi rõ t4 RELEASED 23:56:51Z. Không ảnh
  hưởng kết quả (prune chỉ chạy sau khi T6 xác minh lại
  TRỐNG bằng `status` trực tiếp lúc 00:02:31Z).

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a158-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round158-t6/appendix-numbers.txt` giữ bản
trích gốc:

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=513 max=3475 mean=2007.35
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
md5 t7-block-a158.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=475, COOLDOWN=196, RELEASED=465, STALE-LOCK=10, STALE-TICKET=1, TICKET=486, TIMEOUT=10, total=1643
cleaned-open pairs ACQUIRED->RELEASED: 465
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 10
cleaned-close counts: TOTAL: ACQUIRED=478, COOLDOWN=197, RELEASED=467, STALE-LOCK=10, STALE-TICKET=1, TICKET=489, TIMEOUT=10, total=1652
cleaned-close pairs ACQUIRED->RELEASED: 467
cleaned-close still held at end of log: 1
cleaned-close double-acquire cases: 10
cleaned-final counts: TOTAL: ACQUIRED=478, COOLDOWN=197, RELEASED=468, STALE-LOCK=10, STALE-TICKET=1, TICKET=489, TIMEOUT=10, total=1653
cleaned-final pairs ACQUIRED->RELEASED: 468
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 10
raw log lines open: 1649
raw log lines close: 1658
raw log lines final (after prune check): 1659
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
KHONG-NHA lines in raw log: 0
```

---
**Batch stage / Tổng batch:** T6-158: 1 batch / 1 entry / 1 file. Đợt 158 tới lúc T6 đóng (tạm tính): 4 batch / 4 entry (t0/t1/t5/t6). Lũy kế 111–157 (T10-157 đếm dedup toàn cục): 458 batch / 872 entry / 743 file. Tổng batch chờ user push (đợt 136–157): 210 batch / 294 entry / 247 file (theo T10-157; T10-158 đếm lại sau khi đợt 158 đủ batch).
