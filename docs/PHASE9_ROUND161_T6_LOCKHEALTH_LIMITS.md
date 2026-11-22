# PHASE9 ROUND161 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 11 LIÊN TIẾP) + #62 KHÔNG GIẾT HOLDER + prune lần 36: XÓA 1 FILE — LIMITS

- Đợt: 161, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 15:35 +07 21/11/2026 (= 08:35:51Z 21/11). Chạy
  08:37Z → 08:48Z 21/11/2026. Lúc mở đã ở trên boot
  `39d46ba0` (btime 07:59:29Z) — reboot #62 theo brief giao
  (T6 KHÔNG tự chứng nhận số hiệu #62, chỉ chứng nhận từ
  log lock rằng #62 không giết holder — xem §2/§8);
  KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 11 liên tiếp nếu đạt — tổng
  1320/1320); ghi rõ số chu kỳ, điều kiện churn, boot đo;
  (b) kiểm tra lock khỏe: số cặp, số đang giữ, TIMEOUT mới,
  "KHÔNG NHẢ" — trích ĐÚNG CỘT (cột $3 qua
  `analyze-log.py`, xem §4); (c) chạy suite liên quan và
  ghi exit code + thời gian thật; (d) prune lần 36: đếm
  queue lúc mở, xóa file theo đúng quy tắc prune các đợt
  trước, ghi rõ xóa file nào, queue trước/sau; kiểm tra
  reboot #62 có giết holder nào không (brief nhắc:
  reboot #60 đã giết holder t8-round159 — lần thứ 2
  reboot giết holder; STALE-LOCK thu hồi đúng);
  (e) ghi sai số riêng F-161-T6-n; (f) stage paths
  NUL-delimited; (g) viết cờ .done CÓ NỘI DUNG.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–160,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–160); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (491 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 11, STALE-LOCK GIỮ 11
  (0 ca mới cả hai — xem §4). Reboot #62 KHÔNG giết holder
  nào (lock trống 1h28m01s trước btime). Prune lần 36: xóa 1 file cũ nhất
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
- Thư mục làm việc: `hidden_files/round161-t6/` (ps-full-open.txt,
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
  new-lines-since-t6-160.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a161.sh,
  t7-control-a161.stdout.log, t7-block-a161.sh,
  t7-a161-churn.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 39d46ba0 (#62, btime 07:59:29Z); lock TRỐNG; queue 101 file (khớp T10-160 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `39d46ba0-5724-4e4e-abec-a546d4d98ab2`, btime 07:59:29Z
  theo /proc/stat** (epoch 1795247969; `uptime -s` =
  07:59:29; `journal --list-boots` chỉ 1 dòng 39d46ba0,
  first entry 07:59:40Z). Uptime ~38' lúc T6 bắt đầu
  (08:37Z), ~48' lúc snapshot đóng (08:47Z). Boot này là
  #62 theo brief giao (btime 07:59:29Z) — **T6 KHÔNG tự
  chứng nhận số hiệu #62** (thuộc T0-161/T2-161; lúc T6
  mở chưa có cờ `round161-t0.done` trên đĩa); T6 chỉ
  chứng nhận từ log lock rằng #62 không giết holder (xem
  §2/§8). **KHÔNG có reboot trong phiên T6** (boot_id
  giống nhau lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc 08:47Z — Cloudflare `Date:
  Sat, 21 Nov 2026 08:47:24 GMT` vs local 08:47:23Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, khớp T6-160).
  Lúc mở đo được chênh biểu kiến ~2 s (Cloudflare
  08:37:17Z vs local 08:37:15Z — gồm độ trễ round-trip
  của curl; số đo lúc đóng ~1 s là số sạch hơn).
  Các mốc wall đợt 161 đọc trực tiếp được.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Lưu ý phương pháp: `md5-open.txt` ghi lại các giá trị
  md5 đã đo bằng lệnh `md5sum` lúc mở (~08:37Z, xem log
  phiên); `md5-close.txt`/`md5-final.txt` đo lại từ đĩa
  lúc đóng — các bản khớp nhau từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp số học
  từ T10-160 đóng: 100 sau prune 35 + 1 file cooldown mới
  `cooldown-t8-round160`, mtime 06:31Z (§2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật lúc mở và lúc đóng; X11 trống lúc mở, 3 socket luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 08:37Z
  (mở, `ps-full-open.txt`) và lúc 08:47Z
  (đóng, `ps-full-close.txt`).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở và lúc đóng: 0 vite thật đang chạy** —
  `ss -tlnp` trống hoàn toàn cả hai snapshot; các dòng chứa
  chuỗi "vite" trong snapshot ps đều KHÔNG phải process vite:
  lúc mở 1 dòng (chính lệnh snapshot của T6) và lúc đóng
  1 dòng (chính lệnh snapshot của T6) — cùng bẫy tự-tham-chiếu như đợt 155–160.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #62 đã dọn
  sạch 3 socket X193/X194/X195 còn sót từ đợt 160 —
  xem F-160-T10-4). **Lúc đóng: 3 socket X193 / X194 /
  X195, tạo 08:45Z** — của các luồng khác đợt 161
  (T4/T8 khởi động Xvfb trong phiên; T6 không khởi động
  Xvfb/vite nào, không đụng tới các process này, không
  kill process nào trong phiên này).
  Process luồng khác lúc đóng: `b2-watcher.sh` của T9-161
  (pid 3972) và lệnh kiểm tra postboot-repair của T5-161
  (pid 28698, `vcut-webkit-postboot-check.sh --repair`).
- **Watcher-160 (pid 4539, END 08:30:00Z) KHÔNG còn sống
  lúc T6 mở** — không thấy trong `ps-full-open.txt`;
  boot đã đổi 07:59:29Z, TRƯỚC giờ END 08:30:00Z nên
  watcher chết theo reboot #62 là khớp thời gian; verdict
  chính thức thuộc T5-161 (T6 chỉ ghi nhận sự vắng mặt).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-161).
  Inotify: `max_user_watches` = **63747** lúc kiểm cuối
  (~08:48Z, khớp đợt 147–160 — không có lần flip mới
  trong phiên T6; quyết parent (m) đợt 146: ghi làm chú
  thích, không hành động).
- Tải hệ thống trong phiên: các luồng đợt 161 khởi động
  dần (T5-161 postboot replay, T9-161 b2-watcher) — harness churn vẫn
  120/120 (xem §6).
  Suite đợt này chạy 21–27 s/lượt (tương đương đợt 160:
  24–28 s/lượt).

## 2. Lock lúc mở: TRỐNG; 0 dòng mới trong phiên T6; +29 dòng kể từ T6-160 đóng — TẤT CẢ CỦA t4 + t8-round160, TRƯỚC phiên T6

- **Lúc mở (08:37Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (08:47Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`
  (trước prune), rc=0. Prune KHÔNG phải chờ (xem §7).
- **Log lock +29 dòng kể từ T6-160 đóng** (raw 1717 lúc
  T6-160 đóng → 1746 lúc T6-161 mở → 1746 lúc snapshot
  đóng): 29 dòng đều trước phiên T6; **+0 dòng trong
  phiên T6-161** (diff bản đã lọc mở/đóng rc=0 — không
  luồng nào khác đụng lock trong phiên T6; giống đợt 160).
- Đối chiếu 29 dòng (khớp đúng từng dòng, file
  `new-lines-since-t6-160.txt`, dòng thô 1718–1746):
  - t4: 1 chu kỳ hoàn tất (06:01:26Z → 06:04:56Z, hold
    210 s) — lượt yên #29 attempt1 của T4-160.
  - t8-round160: 7 chu kỳ bắt đầu (06:12:59Z →
    06:27:37Z); **7 chu kỳ HOÀN TẤT** (holds 158 / 70 /
    130 / 240 / 61 / 120 / 231 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14944–14975 ms trên cổng 5490/5390);
    0 chu kỳ dở dang.
  - Tổng: Δ TICKET +8, Δ ACQUIRED +8, Δ RELEASED +8,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **8/8 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ bị reboot giết.**
- **KHOẢNG TRỐNG LOG 06:31:28Z → nay (08:37Z lúc mở,
  2h05m32s): KHÔNG có dòng lock nào sau 06:31:28Z.**
  Reboot #62 (btime 07:59:29Z) rơi vào khoảng này — xem §8.
- **REBOOT #62 (btime 07:59:29Z, boot `39d46ba0`) —
  KHÔNG giết holder nào:** dòng lock cuối trước reboot là
  t8-round160 RELEASED 06:31:28Z (hold 231 s, số học khớp);
  dòng đầu sau reboot: KHÔNG CÓ (0 dòng log sau 06:31:28Z
  tới lúc T6-161 mở) — tức lock trống **1h28m01s trước
  reboot** và không có dòng lock nào sau 06:31:28Z.
  Không có ACQUIRED nào chưa release tại thời điểm #62,
  không có dòng STALE-LOCK mới nào sau #62 (STALE-LOCK
  vẫn 11, ca mới nhất 03:12:16Z — trước #62 hơn 4 giờ),
  still held = 0 lúc T6-161 mở, lock TRỐNG xác minh độc
  lập lúc mở 08:37Z.
  **Kết luận: #62 không giết holder nào — verdict sạch
  (khoảng trống ~1,5 giờ; ngắn hơn #61 với 1h57m24s
  nhưng vẫn sạch — không có holder nào để giết).**
  CAVEAT (bổ sung sau khi đọc nhật ký T0-161, 08:50Z):
  T0-161 phát hiện btime ghi 07:59:29Z KHÔNG PHẢI giờ
  thật — theo DB host-side, run 160 SUCCEEDED 08:03:36Z
  → giờ thật của reboot ~08:13:30Z (offset +841 s);
  T0 chọn H2 (đồng hồ mới chậm lúc boot), T5-161 chọn H1
  (đồng hồ cũ nhanh ≥+824 s) — CHỜ T10 PHÁN. Nếu giờ
  thật của reboot là ~08:13:30Z thì khoảng trống lock
  là ~1h42m thay vì 1h28m01s. **Verdict "không giết
  holder" KHÔNG phụ thuộc vào con số này:** dòng lock
  cuối là RELEASED và 0 dòng sau 06:31:28Z tới lúc T6
  mở — lock trống trong toàn bộ cửa sổ chứa reboot dù
  reboot xảy ra ở mốc nào trong cửa sổ đó. Các mốc
  "1h28m01s" trong LIMITS này là số đo theo btime ghi
  trên /proc/stat, giữ nguyên để đối chiếu; T10-161
  phán cuối về giờ thật của #62.
- **File cooldown mới kể từ T6-160 đóng:
  `cooldown-t8-round160` (mtime 06:31Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 160 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 225 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 8 chu kỳ hoàn tất
  kể từ T6-160 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 217 chu kỳ T6-160 đã đếm = **225 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (217 đợt
    160 + 8 đợt này).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1740 dòng chính thức lúc kiểm cuối, 491 cặp, 0 đang giữ, double-acquire GIỮ 11, STALE-LOCK GIỮ 11, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — T6 đợt này xác minh
lại bằng `sed -n '848,853p'`: đúng 6 dòng đó; bản đã lọc
= raw trừ đúng 6 dòng đó; diff bản đã lọc mở/đóng rc=0,
§2; analyzer chạy trên bản đã lọc ngay từ lần đầu —
không lặp F-160-T6-1).
Bản đã lọc lúc đóng: **1740 dòng** (raw 1746) — **+29 dòng
kể từ T6-160 đóng** (1711 → 1740). Kiểm cuối sau
prune (08:48Z 21/11): bản đã lọc **1740 dòng** (raw 1746),
RELEASED 491, cặp 491, đang giữ 0, double-acquire 11 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-160 đóng | T6-161 mở | T6-161 đóng (snapshot) | Δ trong phiên T6-161 |
|---|---|---|---|---|
| Tổng dòng | 1711 | 1740 | 1740 | +0 |
| TICKET | 505 | 513 | 513 | +0 |
| ACQUIRED | 494 | 502 | 502 | +0 |
| RELEASED | 483 | 491 | 491 | +0 |
| COOLDOWN | 207 | 212 | 212 | +0 |
| STALE-LOCK | 11 | 11 | 11 | +0 |
| STALE-TICKET | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 483 | 491 | 491 | +0 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 |
| Double-acquire | 11 | 11 | 11 | 0 mới trong phiên |

- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối:**
  ACQUIRED 502 − RELEASED 491 = 11 ACQUIRED chưa release
  trong lịch sử log — nhưng cả 11 đều đã được xử lý: 10 ca
  double-acquire cũ (đã giải thích các đợt trước) + 1 ca
  t8-round159 03:12:16Z (STALE-LOCK thu hồi holder bị
  #60 giết — §8 đợt 160). Analyzer xác nhận `still held at end of
  log: 0` ở cả ba snapshot (mở/đóng/kiểm cuối). Lock
  TRỐNG lúc mở và lúc đóng — status xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 11 — 0 ca mới kể từ T6-160 đóng,
  0 ca mới trong phiên T6-161.** Ca mới nhất vẫn là
  analyzer dòng 1690 (bản thô) — t8-round159 ACQUIRED
  03:12:16Z sau STALE-LOCK cùng giây (artifact thu hồi
  #60, đã giải thích đợt 160). **Kết luận: 0 double-acquire
  THẬT mới.** T10-161 lưu ý khi đối chiếu: số "11" của
  analyzer gồm 10 ca cũ + 1 artifact thu hồi #60;
  STALE-LOCK "11" cũng gồm 10 ca cũ + 1 ca thu hồi #60 —
  **hai con số là CÙNG MỘT sự kiện, không phải hai sự
  kiện riêng** (nhắc lại từ đợt 160).
- **0 double-acquire mới** kể từ T6-160 đóng (theo nghĩa
  cơ chế). 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (8 chu kỳ mới sạch kể từ T6-160 đóng,
  0 chu kỳ dở dang), 0 zombie lúc đóng, 0 stale mới
  trong phiên, queue 0 ticket, log nhất quán (491 cặp +
  0 đang giữ lúc kiểm cuối, 0 mất dấu khác — số chính
  thức đã loại 6 dòng repro lỗi của T6-132), 0
  TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–161 (toàn đợt) và đợt 161 (tới ~08:48Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **225 chu kỳ thật** chứng minh (§3).
  Caveat còn lại: **reboot #62 KHÔNG giết holder**
  (xem §8 — khoảng trống ~1,5 giờ, verdict sạch);
  reboot #60 ĐÃ giết holder t8-round159 là sự kiện đợt
  160, đã ghi nhận (cơ chế STALE-LOCK đã reclaim đúng).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160 §6.2.
  File khối T7 đã trích `t7-block-a161.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159 và 160 (cùng md5). Harness đợt này chạy đúng code (A)
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
- `bash -n` harness t7-control-a161.sh: OK (bản sao của
  t7-control-a160.sh, chỉ đổi hậu tố a160 → a161 + sửa
  comment "đợt 160" → "đợt 161").
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–160 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ mười một liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(08:37–08:39Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 27/21/21/21/
22/21 s — tương đương đợt 160: 24/25/28/24/25/28 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào do 6 lượt chạy (0 dòng mới trong
phiên đều là của T6, §2/§4).
- Lỗi thao tác nhỏ ở bước suite đợt này — xem F-161-T6-1
  (§12): mẫu grep tóm tắt lần đầu không khớp định dạng
  dòng kết quả; đã đọc lại đuôi từng log để xác nhận
  PASS=9 FAIL=0 — không ảnh hưởng kết quả.

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round161-t6/t7-control-a161.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 39d46ba0 (#62,
btime 07:59:29Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a161.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159 và 160; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a161-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 553 ms, max 3494 ms, trung bình 2195,81 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'26" (08:39:47–08:47:13Z).
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
| **(A), đợt 161 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau mười đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ mười một liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 1320/1320 dưới churn qua 11 đợt). Chú thích tỉ lệ
  (như T6-150–160): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 10 (đợt 160) → **11 (đợt
  161 — lần thứ mười một xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 42 (đợt 160) → **43 (đợt 161,
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
  - 08:37Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-160 thêm `cooldown-t8-round160`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG lúc mở (08:37Z) VÀ vẫn TRỐNG lúc snapshot
    đóng (08:47Z) — điều (e) thỏa ngay, **prune KHÔNG
    phải chờ** (giống đợt 159/160). T6 xác minh lại TRỐNG
    ngay trước prune (08:47Z, `status-before-prune.txt`).
  - 08:47:38Z 21/11: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-t4-wc`, mtime 2026-11-15T09:14:07Z,
    143,56h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round 117; xem §12
    F-149-T6-3).
  - **Kết quả prune đợt 161 (lần 36): 1 file đã xóa
    (`cooldown-t4-wc`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (08:37Z) **101 file / 1414 byte**;
  lúc snapshot đóng (08:47Z, trước khi prune) **101 file /
  1414 byte** (log lock 0 dòng mới trong phiên, không thêm
  file cooldown mới);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (08:48Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-160 đóng: 100 + 1 file mới
  (`cooldown-t8-round160`) = 101 ✓ — khớp đúng số T10-160 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 66 file; ≥48h (`-mtime +1`): 80
  file**. Sau prune (08:48Z): **≥192h: 0 file; ≥72h:
  65 file; ≥48h: 79 file** — ≥72h giảm 66 → 65 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t3-round117`, mtime 2026-11-15T10:27:33Z —
  lúc 08:48Z mới **~142,34h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 66, tăng 1 so với lúc
  mở đợt 160 (65) và tăng 2 so với sau prune 35 (64):
  2 file khác đã vượt ngưỡng 72h trong khoảng giữa 2 đợt
  (file tạo 18/11 05:53–08:37Z); khớp số học, không phải
  mâu thuẫn. ≥48h lúc mở 80, tăng 1 so với lúc mở đợt 160
  (79) và tăng 2 so với sau prune 35 (78) — cùng lý do,
  file tạo 19/11 05:53–08:37Z.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ mười hai liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt 156 xóa
  `cooldown-s3-round116`, đợt 157 xóa
  `cooldown-s10-round116`, đợt 158 xóa `cooldown-t6`,
  đợt 159 xóa `cooldown-t8-round117`, đợt 160 xóa
  `cooldown-t4-hold`, đợt này xóa `cooldown-t4-wc` trước khi nó đủ 7
  ngày — nó đủ 7 ngày theo đồng hồ tường vào khoảng
  **22/11 09:14Z** nhưng đã bị xóa ở đợt 161, sớm ~24h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 37 (T6-162): tổng lock 100 sau prune 36 —
  kiểm lại lúc mở đợt 162** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t3-round117` đủ 7 ngày ~22/11 10:27Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-161; #62 KHÔNG giết holder; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **39d46ba0** (btime
  07:59:29Z = epoch 1795247969). T6 **KHÔNG tự chứng nhận**
  số hiệu reboot #62 (thuộc T0-161/T2-161 — lúc T6 mở
  chưa có cờ `round161-t0.done` trên đĩa).
- Uptime boot lúc đóng ~48'. `journal --list-boots`
  chỉ 1 dòng 39d46ba0 (first entry 07:59:40Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~08:47Z, boot_id giống lúc mở; kiểm
  lại sau prune, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  08:47:24Z vs local 08:47:23Z — chênh ~1 s. Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 161
  đọc trực tiếp được. (Lưu ý: đồng hồ boot #59 chạy nhanh
  ≥32 s lúc chết — F-159-T8-5 — thuộc về boot cũ đã qua,
  không phải đồng hồ hiện tại.)
- **REBOOT #62 (btime 07:59:29Z, boot `39d46ba0`) —
  KHÔNG giết holder** (§2): lock trống 1h28m01s trước
  btime (RELEASED cuối 06:31:28Z, hold 231 s, số học
  khớp); 0 dòng log sau 06:31:28Z; 0 STALE-LOCK mới;
  still held = 0 lúc T6-161 mở; lock TRỐNG xác minh
  độc lập lúc mở 08:37Z. **Verdict này sạch (khoảng trống
  ~1,5 giờ).** T6 không phán mù cho #62 —
  giao T2-161 (mù #93? (#61) giao từ đợt 160; #94? (#62)
  nếu có cũng giao T2-161).
- **NGHỊCH LÝ ĐỒNG HỒ #62 — T0-161 PHÁT HIỆN, T6 GHI
  NHẬN (không phán):** btime ghi trên /proc/stat
  07:59:29Z KHÔNG PHẢI giờ thật (T0-161: DB host-side
  run 160 SUCCEEDED 08:03:36.487Z → giờ thật reboot
  ~08:13:30Z, offset +841 s; T0 chọn H2, T5-161 chọn H1
  — chờ T10 phán). Đồng hồ MỚI lúc T6 kiểm (08:47Z)
  ≈ Cloudflare ±1 s — khớp T0-161 ("đồng hồ mới ≈
  Cloudflare ±1 s"). Verdict "không giết holder" của T6
  không phụ thuộc giờ thật của reboot (xem §2 caveat).
  T6 không sửa lại các mốc wall trong LIMITS này theo
  giờ thật chưa phán — mọi mốc đều là số đọc trực tiếp
  trên máy (btime /proc/stat, log lock, Cloudflare).
- **Watcher-160 (pid 4539, END 08:30:00Z) KHÔNG còn sống
  lúc T6 mở** (§1) — boot đổi 07:59:29Z trước giờ END
  nên chết theo #62 là khớp thời gian; verdict thuộc
  T5-161. POSTBOOT_PASS #62 (nếu có) thuộc T5-161; T6
  KHÔNG ghi cờ hộ.
- **Nhắc lại #60/#61 (đợt 160, để đối chiếu):** #60 ĐÃ
  giết holder t8-round159 (lần thứ 2 reboot giết holder,
  sau #50); cơ chế STALE-LOCK thu hồi đúng. #61 KHÔNG
  giết holder (lock trống 1h57m24s trước btime). Đợt này
  #62 nối chuỗi "không giết holder" lên 2 reboot liên
  tiếp (#61, #62) — sau #60.

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-161
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (08:48Z 21/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 1746 dòng thô /
  1740 dòng chính thức, 491 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round161-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND161_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round161-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 161 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 161 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–160 (T10-160 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-161).

## 11. GHI CHÚ CHO T10-161 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ mười một liên tiếp, tổng 1320/1320 qua 11
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 10 → 11 (lần thứ mười một xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 42 → 43 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (491 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); prune lần 36 xóa 1 file, queue về đúng
  trần 100 (KHÔNG phải chờ luồng khác nhả lock đợt này;
  0 dòng log mới trong phiên T6).
- **Reboot #62 KHÔNG giết holder** (lock trống 1h28m01s
  trước btime — verdict sạch; nối chuỗi "không giết
  holder" lên 2 reboot liên tiếp sau #60).
  **Đồng hồ ở giờ thật** (Cloudflare ±1 s, T6 tự kiểm).
  Mù cho #62 giao T2-161.
- **Double-acquire GIỮ 11, STALE-LOCK GIỮ 11 — 0 ca mới
  cả hai.** Hai con số là CÙNG MỘT sự kiện thu hồi #60 —
  T10-161 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng.
- 0 zombie lúc mở và lúc đóng; X11 trống lúc mở (reboot
  #62 đã dọn 3 socket sót đợt 160), 3 socket X193/X194/
  X195 mới lúc đóng (của luồng khác đợt 161, tạo 08:45Z)
  — không phải của T6; watcher-160 không còn sống lúc
  mở (chết theo #62, khớp thời gian — T5-161 xác minh).
  T10-161 lưu ý khi đối chiếu log (+29 dòng kể từ
  T6-160 đóng đều là của t4 + t8-round160, +0 dòng trong
  phiên T6).
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #88? VẪN MỞ; mù #93? (#61) giao T2-161; birefnet 0 thử lần 14; u2net
  là fallback chính thức; POSTBOOT_PASS #61 ĐÃ CÓ —
  T5-160; POSTBOOT_PASS #60 KHÔNG CÓ, không bù được;
  POSTBOOT_PASS #62 chờ T5-161; run 160 vẫn running lúc
  T10-160 đóng — kết cục thuộc T7-161).
- Cờ `round161-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-161 (F-161-T6-n)

- **F-161-T6-1 — Mẫu grep tóm tắt suite lần đầu không
  khớp định dạng dòng kết quả.** Lệnh tóm tắt 6 lượt
  suite dùng `grep -E '^PASS=|^FAIL='` nhưng dòng kết
  quả thật là `== KẾT QUẢ: PASS=9 FAIL=0 (log: ...) ==`
  (không bắt đầu bằng PASS=) nên in ra trống cho cả 6
  lượt, dù rc=0 và T7A=1 đã in đúng. Đã đọc lại đuôi
  từng log (`test-v2-t6-run*.log`) để xác nhận trực tiếp:
  cả 6 đều `PASS=9 FAIL=0`, rc=0. Không ảnh hưởng kết
  quả (chỉ là lệnh tóm tắt, không phải số liệu sai).
  Bài học: mẫu grep phải khớp đúng định dạng dòng
  `== KẾT QUẢ: PASS=`, hoặc đọc đuôi log trực tiếp như
  đã làm để sửa.
- **F-161-T6-2 — Hai số tuổi trong bản nháp §7 viết sai,
  đã bắt và sửa TRƯỚC khi stage.** (1) Tuổi file cũ nhất
  còn lại `cooldown-t3-round117` ghi "~143,34h" — sai:
  10:27:33Z 15/11 → 08:48Z 21/11 = 5d 22h 20m = ~142,34h
  (đã sửa thành 142,34h). (2) Ghi chú tăng ngưỡng ≥72h
  lẫn lộn số sau-prune-35 với số lúc-mở đợt 160 (ghi
  "65 sau prune 35 — T6-160 ghi 64 lúc mở" — ngược nhau;
  số đúng: T6-160 mở 65, sau prune 35 là 64; đợt này mở
  66 = +1 so với lúc mở, +2 so với sau prune) — đã viết
  lại gọn, đúng cả hai mốc so sánh. Không ảnh hưởng kết
  quả (chỉ là số trong bản nháp LIMITS, chưa stage, đã
  sửa trước khi ghi paths). Bài học: đối chiếu tuổi và
  số ngưỡng bằng phép tính trực tiếp, không cộng nhẩm
  từ LIMITS đợt trước.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a161-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round161-t6/appendix-numbers.txt` giữ bản
trích gốc:

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=553 max=3494 mean=2195.81
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
suite run1: PASS=9 FAIL=0 T7A=1 secs=27 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 secs=22 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a161.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=502, COOLDOWN=212, RELEASED=491, STALE-LOCK=11, STALE-TICKET=1, TICKET=513, TIMEOUT=10, total=1740
cleaned-open pairs ACQUIRED->RELEASED: 491
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 11
cleaned-close counts: TOTAL: ACQUIRED=502, COOLDOWN=212, RELEASED=491, STALE-LOCK=11, STALE-TICKET=1, TICKET=513, TIMEOUT=10, total=1740
cleaned-close pairs ACQUIRED->RELEASED: 491
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 11
cleaned-final counts: TOTAL: ACQUIRED=502, COOLDOWN=212, RELEASED=491, STALE-LOCK=11, STALE-TICKET=1, TICKET=513, TIMEOUT=10, total=1740
cleaned-final pairs ACQUIRED->RELEASED: 491
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 11
raw log lines open: 1746
raw log lines close: 1746
raw log lines final (after prune check): 1746
new lines since T6-160 close: 29 (TICKET 8, ACQUIRED 8, RELEASED 8, COOLDOWN 5, STALE-LOCK 0, TIMEOUT 0)
new lines in T6-161 session: 0
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
queue age bands open: >=192h: 0 files; >=72h: 66 files; >=48h: 80 files
queue age bands post-prune: >=192h: 0 files; >=72h: 65 files; >=48h: 79 files
KHONG-NHA lines in raw log: 0
prune-36 deleted: cooldown-t4-wc mtime=2026-11-15T09:14:07Z size=14 age=143.56h rule=(b) at 2026-11-21T08:47:38Z
next oldest remaining: cooldown-t3-round117 mtime=2026-11-15T10:27:33Z
reboot-62: btime 2026-11-21T07:59:29Z boot 39d46ba0; last lock line before reboot 2026-11-21T06:31:28Z RELEASED (lock empty 1h28m01s); 0 lines after 06:31:28Z; 0 new STALE-LOCK; NO holder killed
clock check: Cloudflare Date 2026-11-21T08:47:24Z vs local 08:47:23Z (~1s)
inotify max_user_watches: 63747
```

---
**Batch stage / Tổng batch:** T6-161: 1 batch / 1 entry / 1 file. Đợt 161 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry (t6). Lũy kế 111–160 (T10-160 đếm dedup toàn cục): T6 không tự cộng tay — chờ T10-161 đếm lại.
