# PHASE9 ROUND164 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 14 LIÊN TIẾP) + #66/#67 KHÔNG GIẾT HOLDER + prune lần 39: XÓA 1 FILE — LIMITS

- Đợt: 164, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 00:35 +07 22/11/2026 (= 17:35:51Z 21/11). Chạy
  17:39Z → 17:52Z 21/11/2026. Lúc mở đã ở trên boot
  `f1d4ce1a` (btime 17:33:27Z) — reboot #67 theo brief giao
  và theo xác minh độc lập của T0-164 (cờ `round164-t0.done`
  xuất hiện trong lúc T6 chạy, ~17:43Z — xem §8/§11);
  T6 KHÔNG tự chứng nhận số hiệu #67, chỉ chứng nhận từ
  log lock rằng #66 và #67 không giết holder (xem §2/§8);
  KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 14 liên tiếp nếu đạt — tổng
  1680/1680); ghi chuỗi xanh kép + chuỗi suite xanh mới;
  (b) lock: chạy lại analyze-log.py trên log final đóng
  băng; kiểm cuối ACQUIRED/RELEASED/cặp/đang giữ/TIMEOUT/
  KHÔNG NHẢ; double-acquire và STALE-LOCK có ca mới
  không? Ghi đúng số kiểm cuối đợt này (đừng nhầm nhãn
  đợt cũ — bài học (r) đợt 163); (c) reboot #66/#67 có
  giết holder không? (lock trống bao lâu trước btime?
  0 dòng log sau mốc nào? 0 STALE-LOCK mới?); (d) prune
  lần 39: kiểm queue lúc mở (kỳ vọng ~101 mục), prune 1
  file cũ nhất theo đúng điều kiện đứng (ghi tên file,
  mtime, tuổi, điều nào), queue sau prune; (e) trần
  inotify hiện tại; 0 zombie; X11 lúc mở; đồng hồ
  (Cloudflare ±? s); (f) ghi mọi sai số dạng F-164-T6-N;
  lưu ý F-147-T6-1 (nối lại — đã nối 14 lần, kiểm tra
  còn nối không).
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–163,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–163); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (517 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 11, STALE-LOCK GIỮ 11
  (0 ca mới cả hai — xem §4). Reboot #67 KHÔNG giết holder
  nào (lock trống 1h34m29s trước btime); reboot #66 CŨNG
  KHÔNG giết holder nào (lock trống 7m47s trước btime —
  kiểm chứng lần đầu, xem §2/§8). Prune lần 39: xóa 1 file cũ nhất
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
- Thư mục làm việc: `hidden_files/round164-t6/` (ps-full-open.txt,
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
  new-lines-since-t6-163.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a164.sh,
  t7-block-a164.sh,
  t7-a164-churn.log, t7-control-a164.stdout.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT f1d4ce1a (#67, btime 17:33:27Z); lock TRỐNG; queue 101 file (khớp T10-163 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f`, btime 17:33:27Z
  theo /proc/stat** (epoch 1795282407; `uptime -s` =
  17:33:27; `journal --list-boots` chỉ 1 dòng f1d4ce1a,
  first entry 17:33:41Z). Uptime ~6' lúc T6 bắt đầu
  (17:39Z), ~18' lúc snapshot đóng (17:51Z). Boot này là
  #67 theo brief giao và theo T0-164 (xác minh độc lập 9
  nguồn — cờ `round164-t0.done` xuất hiện trong lúc T6
  chạy, ~17:43Z; xem §8/§11) — **T6 KHÔNG tự chứng nhận
  số hiệu #67** (thuộc T0-164/T2-164); T6 chỉ chứng nhận
  từ log lock rằng #66 và #67 không giết holder (xem §2/§8).
  **KHÔNG có reboot trong phiên T6** (boot_id giống nhau
  lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sat, 21 Nov 2026 17:40:09 GMT` vs local 17:40:08Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, khớp T6-163);
  lúc đóng Cloudflare 17:51:01Z vs local 17:50:59Z
  (chênh ~2 s, trong đó có độ trễ fetch curl ~1–2 s —
  cùng họ ±1 s lúc mở, không phải lệch đồng hồ). Các mốc
  wall đợt 164 đọc trực tiếp được.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Lưu ý phương pháp: `md5-open.txt`/`md5-close.txt`/
  `md5-final.txt` đều là đo tươi từ đĩa bằng `md5sum`
  trực tiếp (không copy file md5 qua lại — bài học
  F-163-T6-1); cả ba khớp nhau từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp số học
  từ T10-163 đóng: 100 sau prune 38 + 1 file cooldown mới
  `cooldown-t8-round163`, mtime 15:58Z (§2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật lúc mở và lúc đóng; X11 trống lúc mở, 3 socket luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 17:40Z
  (mở, `ps-full-open.txt`) và lúc 17:51Z
  (đóng, `ps-full-close.txt`).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở và lúc đóng: 0 vite thật đang chạy** —
  `ss -tlnp` trống hoàn toàn cả hai snapshot; các dòng chứa
  chuỗi "vite" trong snapshot ps đều KHÔNG phải process vite:
  lúc mở 1 dòng và lúc đóng 1 dòng (chính lệnh snapshot của
  T6) — cùng bẫy tự-tham-chiếu như đợt 155–163.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #67 đã dọn
  sạch 3 socket X193/X194/X195 của đợt 163 — T8-163 đã
  dọn lúc ~16:04Z, `/tmp/.X11-unix/` trống lúc T10-163
  đóng; reboot #67 dọn nốt phần còn lại nếu có).
  **Lúc đóng: 3 socket X193 / X194 / X195, tạo 17:47Z** —
  của các luồng khác đợt 164 (T4/T8 khởi động Xvfb trong
  phiên; T6 không khởi động Xvfb/vite nào, không đụng tới
  các process này, không kill process nào trong phiên này).
  (T0-164 ghi "X11 TRỐNG" lúc đóng cờ ~17:43Z — đúng lúc
  kiểm của T0, TRƯỚC khi 3 socket xuất hiện 17:47Z; không
  mâu thuẫn — chỉ khác thời điểm kiểm. Đây là lần thứ
  năm liên tiếp cùng 3 số display X193/X194/X195 — xem
  quyết (bb) đợt 163.)
  Process luồng khác lúc mở: T5-164 đang chạy
  `replay-watch-164.sh` (pid 5451) và T9-164 b2-watcher
  (pid 2458).
- **Watcher-164 ĐANG CHẠY lúc T6 mở** — pid 5451
  `bash replay-watch-164.sh` (T5-164 khởi động; T0-164
  xác nhận trong cờ). Khác đợt 163: watcher-163 đã chết
  theo reboot #66 (T10-163 phát hiện, quyết (x) đợt 163);
  khoảng không-watcher trên boot #66 đã được lấp bởi
  watcher-164 trên boot #67. T6 không khởi động watcher nào.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-164).
  Inotify: `max_user_watches` = **63756** lúc mở và lúc
  đóng (~17:40Z và ~17:51Z) — **GIỐNG trần trên #65**
  (đợt 163); khác 63747 trên #66 (T9-163 đo) — xem §11,
  ghi nhận, không hành động.
- Tải hệ thống trong phiên: các luồng đợt 164 khởi động
  dần (T5-164 watcher, T9-164 sampler/b2-watcher) — harness
  churn vẫn 120/120 (xem §6).
  Suite đợt này chạy 28–38 s/lượt (tương đương đợt 163:
  25–34 s/lượt).

## 2. Lock lúc mở: TRỐNG; 0 dòng mới trong phiên T6; +33 dòng kể từ T6-163 đóng — TẤT CẢ CỦA t4 + t8-round163, TRƯỚC phiên T6

- **Lúc mở (17:40Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (17:51Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`
  (trước prune), rc=0. Prune KHÔNG phải chờ (xem §7).
- **Log lock +33 dòng kể từ T6-163 đóng** (raw 1808 lúc
  T6-163 đóng → 1841 lúc T6-164 mở → 1841 lúc snapshot
  đóng): 33 dòng đều trước phiên T6; **+0 dòng trong
  phiên T6-164** (diff bản đã lọc mở/đóng identical —
  không luồng nào khác đụng lock trong phiên T6; giống đợt 163).
- Đối chiếu 33 dòng (khớp đúng từng dòng, file
  `new-lines-since-t6-163.txt`, dòng thô 1809–1841):
  - t4: 2 chu kỳ hoàn tất (14:54:04Z → 14:57:46Z, hold
    222 s; 14:59:01Z → 15:02:37Z, hold 216 s) — lượt yên
    #32 attempt1 + attempt2 của T4-163 (attempt1 trượt
    tickCost 62,0 ms; attempt2 hợp lệ 53,0 ms — xem
    aggregate 163 §4).
  - t8-round163: 7 chu kỳ bắt đầu (15:39:27Z →
    15:55:07Z); **7 chu kỳ HOÀN TẤT** (holds 187 / 80 /
    140 / 241 / 71 / 130 / 230 s; 6 dòng COOLDOWN kèm theo,
    các lần chờ 2949 ms (lần đầu, cổng 5390) rồi
    14936–14955 ms trên cổng 5490/5390);
    0 chu kỳ dở dang. Chu kỳ hold 241 s (15:47:00Z →
    15:51:01Z) là pha dài nhất trong 7 chu kỳ — lock
    vẫn RELEASED bình thường sau đó, không bị giết.
  - Tổng: Δ TICKET +9, Δ ACQUIRED +9, Δ RELEASED +9,
    Δ COOLDOWN +6, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **9/9 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ bị reboot giết.**
- **KHOẢNG TRỐNG LOG 15:58:58Z → nay (17:40Z lúc mở,
  1h41m10s): KHÔNG có dòng lock nào sau 15:58:58Z.**
  Cả hai reboot #66 (btime 16:06:45Z) và #67 (btime
  17:33:27Z) rơi vào khoảng này — xem §8.
- **REBOOT #67 (btime 17:33:27Z, boot `f1d4ce1a`) —
  KHÔNG giết holder nào:** dòng lock cuối trước reboot là
  t8-round163 RELEASED 15:58:58Z (hold 230 s, số học khớp);
  dòng đầu sau reboot: KHÔNG CÓ (0 dòng log sau 15:58:58Z
  tới lúc T6-164 mở) — tức lock trống **1h34m29s (5.669 s)
  trước reboot** và không có dòng lock nào sau 15:58:58Z.
  Không có ACQUIRED nào chưa release tại thời điểm #67,
  không có dòng STALE-LOCK mới nào sau #67 (STALE-LOCK
  vẫn 11, ca mới nhất 03:12:16Z — trước #67 hơn 14 giờ),
  still held = 0 lúc T6-164 mở, lock TRỐNG xác minh độc
  lập lúc mở 17:40Z.
  **Kết luận: #67 không giết holder nào — verdict sạch
  (khoảng trống ~1h34m — ngắn hơn #65 với 1h56m26s nhưng
  vẫn là khoảng trống dài, không có holder nào để giết).**
  CAVEAT: theo tiền lệ OVERLAP #62 (quyết parent (q) đợt 161),
  btime ghi trên /proc/stat được đọc là giờ thật trừ khi có
  bằng chứng ngược; T0-164 đã xác minh độc lập btime #67 LÀ
  giờ thật (9 nguồn khớp, KHÔNG nghịch lý đồng hồ — xem
  §8/§11), nên caveat này đã được giải quyết từ phía T0;
  verdict "không giết holder" cũng KHÔNG phụ thuộc vào việc
  có overlap hay không, vì dòng lock cuối là RELEASED và 0
  dòng sau 15:58:58Z tới lúc T6 mở — lock trống trong toàn
  bộ cửa sổ chứa reboot dù reboot xảy ra ở mốc nào trong
  cửa sổ đó. Các mốc "1h34m29s" trong LIMITS này là số đo
  theo btime ghi trên /proc/stat, giữ nguyên để đối chiếu;
  T10-164 phán cuối về giờ thật của #67 (T0-164 đã xác minh).
- **REBOOT #66 (btime 16:06:45Z, boot `edb2acdb`) —
  KHÔNG giết holder nào (KIỂM CHỨNG LẦN ĐẦU — T6-163
  không kiểm được vì #66 xảy ra sau khi T6-163 đóng cờ
  14:52Z):** dòng lock cuối trước reboot cũng là
  t8-round163 RELEASED 15:58:58Z — tức lock trống **7m47s
  (467 s) trước btime #66**; 0 dòng log trong (15:58:58Z,
  16:06:45Z]; 0 STALE-LOCK mới sau #66 (STALE-LOCK vẫn 11);
  0 chu kỳ dở dang nào tại btime. **Kết luận: #66 không
  giết holder nào — verdict sạch nhưng khoảng trống NGẮN
  (467 s — ngắn nhất trong chuỗi #61–#67; ngắn hơn #64
  với 55m10s).** Caveat: khoảng trống ngắn nên bằng chứng
  "không có holder để giết" mỏng hơn các reboot trước —
  nhưng vẫn đầy đủ: log cho thấy chu kỳ cuối RELEASED
  sạch 15:58:58Z và không một dòng ACQUIRED nào sau đó
  tới lúc T6-164 mở; không có holder nào tồn tại trong
  cửa sổ chứa #66. T0/T7/T9-163 đã xác minh btime #66
  là giờ thật (quyết (e) đợt 163).
- **File cooldown mới kể từ T6-163 đóng:
  `cooldown-t8-round163` (mtime 15:58Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 163 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 251 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 9 chu kỳ hoàn tất
  kể từ T6-163 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 242 chu kỳ T6-163 đã đếm = **251 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (242 đợt
    163 + 9 đợt này).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1835 dòng chính thức lúc kiểm cuối, 517 cặp, 0 đang giữ, double-acquire GIỮ 11, STALE-LOCK GIỮ 11, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — bản đã lọc
= raw trừ đúng 6 dòng đó, lọc bằng `awk '$2!="tA" &&
$2!="tH"'` — cột owner là $2, bài học F-162-T6-1;
diff bản đã lọc mở/đóng identical, §2; analyzer chạy
trên bản đã lọc).
Bản đã lọc lúc đóng: **1835 dòng** (raw 1841) — **+33 dòng
kể từ T6-163 đóng** (1802 → 1835). Kiểm cuối sau
prune (17:52Z 21/11): bản đã lọc **1835 dòng** (raw 1841),
RELEASED 517, cặp 517, đang giữ 0, double-acquire 11 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-162 đóng | T6-163 đóng | T6-164 mở | T6-164 đóng (snapshot) | Δ trong phiên T6-164 |
|---|---|---|---|---|---|
| Tổng dòng | 1772 | 1802 | 1835 | 1835 | +0 |
| TICKET | 522 | 530 | 539 | 539 | +0 |
| ACQUIRED | 511 | 519 | 528 | 528 | +0 |
| RELEASED | 500 | 508 | 517 | 517 | +0 |
| COOLDOWN | 217 | 223 | 229 | 229 | +0 |
| STALE-LOCK | 11 | 11 | 11 | 11 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 500 | 508 | 517 | 517 | +0 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 | 0 |
| Double-acquire | 11 | 11 | 11 | 11 | 0 mới trong phiên |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 528 / RELEASED 517, 517 cặp.** Các số 519/508
  là kiểm cuối đợt 163 (không phải đợt này); 511/500 là
  kiểm cuối đợt 162; 502/491 là kiểm cuối đợt 161. Bảng
  trên dùng đúng ba số này (đã đối chiếu với bảng §4 của
  LIMITS T6-162 và T6-163 — cả hai tự nó đúng).
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối:**
  ACQUIRED 528 − RELEASED 517 = 11 ACQUIRED chưa release
  trong lịch sử log — nhưng cả 11 đều đã được xử lý: 10 ca
  double-acquire cũ (đã giải thích các đợt trước) + 1 ca
  t8-round159 03:12:16Z (STALE-LOCK thu hồi holder bị
  #60 giết — §8 đợt 160). Analyzer xác nhận `still held at end of
  log: 0` ở cả ba snapshot (mở/đóng/kiểm cuối). Lock
  TRỐNG lúc mở và lúc đóng — status xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 11 — 0 ca mới kể từ T6-163 đóng,
  0 ca mới trong phiên T6-164.** Ca mới nhất vẫn là
  analyzer dòng 1690 (bản đã lọc — dòng 1690 bản thô là
  t8-round159 ACQUIRED 03:12:16Z sau STALE-LOCK cùng giây
  (artifact thu hồi #60, đã giải thích đợt 160).
  **Kết luận: 0 double-acquire THẬT mới.** T10-164 lưu ý khi đối chiếu: số "11" của
  analyzer gồm 10 ca cũ + 1 artifact thu hồi #60;
  STALE-LOCK "11" cũng gồm 10 ca cũ + 1 ca thu hồi #60 —
  **hai con số là CÙNG MỘT sự kiện, không phải hai sự
  kiện riêng** (nhắc lại từ đợt 160/161/162/163, quyết (v) đợt 162,
  quyết (r) đợt 163).
- **0 double-acquire mới** kể từ T6-163 đóng (theo nghĩa
  cơ chế). 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (9 chu kỳ mới sạch kể từ T6-163 đóng,
  0 chu kỳ dở dang), 0 zombie lúc đóng, 0 stale mới
  trong phiên, queue 0 ticket, log nhất quán (517 cặp +
  0 đang giữ lúc kiểm cuối, 0 mất dấu khác — số chính
  thức đã loại 6 dòng repro lỗi của T6-132), 0
  TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–164 (toàn đợt) và đợt 164 (tới ~17:52Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **251 chu kỳ thật** chứng minh (§3).
  Caveat còn lại: **reboot #67 KHÔNG giết holder**
  (xem §8 — khoảng trống ~1h34m, verdict sạch);
  **reboot #66 KHÔNG giết holder** (khoảng trống 467 s —
  ngắn nhất chuỗi, verdict sạch nhưng mỏng hơn);
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
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163 §6.2.
  File khối T7 đã trích `t7-block-a164.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162 và 163 (cùng md5). Harness đợt này chạy đúng code (A)
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
- `bash -n` harness t7-control-a164.sh: OK (bản sao của
  t7-control-a163.sh, chỉ đổi hậu tố a163 → a164 + sửa
  comment "đợt 163" → "đợt 164").
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–163 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ mười bốn liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~17:40–17:43Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 33/38/36/32/
28/32 s — tương đương đợt 163: 30/27/25/33/34/28 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào do 6 lượt chạy (0 dòng mới trong
phiên đều là của T6, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round164-t6/t7-control-a164.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot f1d4ce1a (#67,
btime 17:33:27Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a164.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162 và 163; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a164-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 554 ms, max 3452 ms, trung bình 1931,99 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~6'58" (17:43:50–17:50:48Z).
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
| **(A), đợt 162 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 163 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 164 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau mười ba đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ mười bốn liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 1680/1680 dưới churn qua 14 đợt). Chú thích tỉ lệ
  (như T6-150–163): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 13 (đợt 163) → **14 (đợt
  164 — lần thứ mười bốn xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 45 (đợt 163) → **46 (đợt 164,
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
  - 17:40Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-163 thêm `cooldown-t8-round163`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG lúc mở (17:40Z) VÀ vẫn TRỐNG lúc snapshot
    đóng (17:51Z) — điều (e) thỏa ngay, **prune KHÔNG
    phải chờ** (giống đợt 161/162/163). T6 xác minh lại TRỐNG
    ngay trước prune (17:51Z, `status-before-prune.txt`).
  - 17:51:28Z 21/11: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-t1-smoke-a`, mtime 2026-11-15T11:39:24Z,
    150,20h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file smoke test cũ từ 15/11, không thuộc
    đợt 163/164). Xác định "cũ nhất" bằng mtime
    chính xác tới nano-giây: `cooldown-t1-smoke-a`
    11:39:24.340698517Z, sớm hơn file kế tiếp
    `cooldown-t1-smoke-hold` 11:39:49.466698323Z đúng
    25,13 s (cả ba file smoke cùng mtime tới giây —
    phải dùng ns mới phân biệt được; xem §12 F-164-T6-3).
  - **Kết quả prune đợt 164 (lần 39): 1 file đã xóa
    (`cooldown-t1-smoke-a`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (17:40Z) **101 file / 1414 byte**;
  lúc snapshot đóng (17:51Z, trước khi prune) **101 file /
  1414 byte** (log lock 0 dòng mới trong phiên, không thêm
  file cooldown mới);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (17:52Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-163 đóng: 100 + 1 file mới
  (`cooldown-t8-round163`) = 101 ✓ — khớp đúng số T10-163 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 68 file; ≥48h (`-mtime +1`): 82
  file**. Sau prune (17:52Z): **≥192h: 0 file; ≥72h:
  67 file; ≥48h: 81 file** — ≥72h giảm 68 → 67 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t1-smoke-hold`, mtime 2026-11-15T11:39:49Z —
  lúc 17:52Z mới **~150,20h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 68, tăng 1 so với lúc
  mở đợt 163 (67): 1 file khác đã vượt ngưỡng 72h trong
  khoảng giữa 2 đợt; khớp số học, không phải mâu thuẫn.
  ≥48h lúc mở đợt này giữ 82 như lúc mở đợt 163.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ mười lăm liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt 156 xóa
  `cooldown-s3-round116`, đợt 157 xóa
  `cooldown-s10-round116`, đợt 158 xóa `cooldown-t6`,
  đợt 159 xóa `cooldown-t8-round117`, đợt 160 xóa
  `cooldown-t4-hold`, đợt 161 xóa `cooldown-t4-wc`,
  đợt 162 xóa `cooldown-t3-round117`, đợt 163 xóa
  `cooldown-t10-round117`, đợt này xóa
  `cooldown-t1-smoke-a` trước khi nó đủ 7 ngày — nó đủ
  7 ngày theo đồng hồ tường vào khoảng
  **22/11 11:39Z** nhưng đã bị xóa ở đợt 164, sớm ~17,80h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 40 (T6-165): tổng lock 100 sau prune 39 —
  kiểm lại lúc mở đợt 165** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t1-smoke-hold` đủ 7 ngày ~22/11 11:39Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-164; #66/#67 KHÔNG giết holder; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **f1d4ce1a** (btime
  17:33:27Z = epoch 1795282407). T6 **KHÔNG tự chứng nhận**
  số hiệu reboot #67 (thuộc T0-164/T2-164 — lúc T6 mở
  chưa có cờ `round164-t0.done` trên đĩa; cờ xuất hiện
  trong lúc T6 chạy harness, ~17:43Z).
- Uptime boot lúc đóng ~18'. `journal --list-boots`
  chỉ 1 dòng f1d4ce1a (first entry 17:33:41Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~17:51Z, boot_id giống lúc mở; kiểm
  lại sau prune, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  17:51:01Z vs local 17:50:59Z — chênh ~2 s (trong đó có
  độ trễ fetch; lúc mở chênh ~1 s). Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 164
  đọc trực tiếp được.
- **REBOOT #67 (btime 17:33:27Z, boot `f1d4ce1a`) —
  KHÔNG giết holder** (§2): lock trống 1h34m29s trước
  btime (RELEASED cuối 15:58:58Z, hold 230 s, số học
  khớp); 0 dòng log sau 15:58:58Z; 0 STALE-LOCK mới;
  still held = 0 lúc T6-164 mở; lock TRỐNG xác minh
  độc lập lúc mở 17:40Z. **Verdict này sạch (khoảng trống
  ~1h34m — ngắn hơn #65 với 1h56m26s, dài hơn #64 với
  55m10s).** T6 không phán mù cho #67 —
  giao T2-164 (mù #96? (#64) / #97? (#65) / #98? (#66)
  nếu có cũng giao T2-164).
- **REBOOT #66 (btime 16:06:45Z, boot `edb2acdb`) —
  KHÔNG giết holder** (§2): lock trống 7m47s trước btime
  (RELEASED cuối 15:58:58Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới. **Verdict sạch nhưng khoảng trống
  NGẮN NHẤT chuỗi #61–#67 (467 s) — bằng chứng mỏng hơn
  các reboot trước nhưng vẫn đầy đủ** (không có holder
  nào tồn tại trong cửa sổ chứa #66).
  **Chuỗi "không giết holder" lên 7 reboot liên tiếp
  (#61, #62, #63, #64, #65, #66, #67) — sau #60.**
- **Watcher-164 ĐANG CHẠY, pid 5451** (§1) — T5-164
  khởi động trên boot #67; watcher-163 chết theo reboot
  #66 (T10-163 phát hiện, quyết (x) đợt 163). T6 chỉ ghi
  nhận trạng thái lúc mở/đóng.
  **POSTBOOT_PASS #66 CHƯA CÓ lúc T0-164 kiểm lại cuối
  17:42:49Z (T5-164 sở hữu).**
- **BỔ SUNG — đọc cờ `round164-t0.done` lúc kiểm cuối
  (~17:51Z, trong lúc T6 đóng):** T0-164 xác minh btime
  #67 (17:33:27Z) **LÀ giờ thật** (9 nguồn khớp;
  KHÔNG nghịch lý đồng hồ); gap #66→#67 =
  **5.202 s (1h26m42s)**; reboot #67 xảy ra SAU khi
  T10-163 đóng sổ 16m50s — claim T10-163 ĐỨNG. **Run 163
  SUCCEEDED 17:18:13Z, margin 1.058 s tới hạn, 0 lần viết
  lại — KHÔNG bị reboot #67 giết** (xong trước btime 914 s)
  — kết cục run 163 T6 chỉ ghi nhận chéo từ cờ T0; verdict
  chính thức thuộc T7-164. **Marker CÒN — sống qua 19
  reboot #49–#67** (T0-164 đếm độc lập 65−49+1=17 tới #65,
  + #66 + #67 = 19; không lặp lỗi T0-162). POSTBOOT_PASS
  #65/#64 CÒN; #63 KHÔNG CÓ (boot thứ 7 lọt); #66 CHƯA CÓ
  lúc T0 kiểm cuối. O8 JSON đợt 163 CÒN ĐÚNG
  (`d614173d` / `44d90ffe` / `931baeaf`, 21/21 ×3, boot
  1c1cf10c). Cây md5 khớp (530e10a7 / 2c384ed1 / ee80d093 /
  fedc0141). X11 TRỐNG lúc T0 đóng (3 socket xuất hiện
  sau đó 17:47Z — xem §1).
- **Nhắc lại #60/#61/#62/#63/#64/#65 (để đối chiếu):** #60 ĐÃ
  giết holder t8-round159 (lần thứ 2 reboot giết holder,
  sau #50); cơ chế STALE-LOCK thu hồi đúng. #61 KHÔNG
  giết holder (lock trống 1h57m24s trước btime). #62 KHÔNG
  giết holder (lock trống 1h28m01s trước btime — quyết
  parent (w) đợt 161). #63 KHÔNG giết holder (lock trống
  10m34s trước btime — T6-162 chứng nhận bổ sung). #64
  KHÔNG giết holder (lock trống 55m10s trước btime —
  quyết parent (v) đợt 162). #65 KHÔNG giết holder (lock
  trống 1h56m26s trước btime — quyết parent (r) đợt 163).
  Đợt này #66 + #67 nối chuỗi "không giết holder" lên
  **7 reboot liên tiếp** (#61–#67) — sau #60.

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-164
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (17:52Z 21/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 1841 dòng thô /
  1835 dòng chính thức, 517 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round164-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND164_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round164-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 164 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 164 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–163 (T10-163 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-164).

## 11. GHI CHÚ CHO T10-164 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ mười bốn liên tiếp, tổng 1680/1680 qua 14
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 13 → 14 (lần thứ mười bốn xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 45 → 46 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (517 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); prune lần 39 xóa 1 file, queue về đúng
  trần 100 (KHÔNG phải chờ luồng khác nhả lock đợt này;
  0 dòng log mới trong phiên T6).
- **Reboot #67 KHÔNG giết holder** (lock trống 1h34m29s
  trước btime — verdict sạch; nối chuỗi "không giết
  holder" lên 7 reboot liên tiếp sau #60, kể cả #66).
  **Reboot #66 KHÔNG giết holder — KIỂM CHỨNG LẦN ĐẦU**
  (lock trống 7m47s trước btime — ngắn nhất chuỗi, verdict
  sạch nhưng mỏng hơn; T6-163 không kiểm được vì #66 xảy
  ra sau khi T6-163 đóng cờ).
  **Đồng hồ ở giờ thật** (Cloudflare ~1 s lúc mở, ~2 s lúc
  đóng gồm độ trễ fetch). Mù cho #66/#67 giao T2-164.
  **Kiểm cuối đợt này: ACQUIRED 528 / RELEASED 517, 517
  cặp** (đừng mang 519/508 — đó là kiểm cuối đợt 163 —
  vào cột đợt này; bài học (r) đợt 163).
- **Double-acquire GIỮ 11, STALE-LOCK GIỮ 11 — 0 ca mới
  cả hai.** Hai con số là CÙNG MỘT sự kiện thu hồi #60 —
  T10-164 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng (quyết (v) đợt 162, quyết (r) đợt 163).
- 0 zombie lúc mở và lúc đóng; X11 trống lúc mở (reboot
  #67 đã dọn 3 socket sót đợt 163), 3 socket X193/X194/
  X195 mới lúc đóng (của luồng khác đợt 164, tạo 17:47Z
  — lần thứ năm liên tiếp cùng 3 số display)
  — không phải của T6; watcher-164 đang chạy pid 5451
  (T5-164); T10-164 lưu ý khi đối chiếu log (+33 dòng kể
  từ T6-163 đóng đều là của t4 + t8-round163, +0 dòng trong
  phiên T6).
- **Inotify: trần `max_user_watches` nay là 63756** (giống
  trần trên #65; khác 63747 trên #66 theo T9-163). Ghi
  nhận theo quyết (m) đợt 146 (ghi làm chú thích, không
  hành động); T9-164 sở hữu hệ quả headroom nếu có. T6
  không suy đoán nguyên nhân đổi.
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #88? VẪN MỞ; mù #94? MỞ theo quyết (b) đợt 163;
  mù #95? MỞ theo quyết (b) đợt 163; birefnet 0 thử lần
  17 (đợt 163); u2net là fallback chính thức; POSTBOOT_PASS
  #66 CHƯA CÓ lúc T0-164 kiểm lại cuối 17:42:49Z — giao
  T5-164; run 163 SUCCEEDED 17:18:13Z theo cờ T0-164 —
  kết cục chính thức thuộc T7-164).
- Cờ `round164-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-164 (F-164-T6-n)

- **F-164-T6-1 — Tuổi prune ghi nháp 150,87h do dùng
  hằng epoch sai, đã bắt và sửa trước khi viết LIMITS.**
  Lúc tính tuổi file `cooldown-t1-smoke-a` tại giờ prune
  17:51:28Z, lệnh python nháp dùng epoch 1795285900 (sai —
  đó là 18:31:40Z, không phải 17:51:28Z) nên cho 150,87h.
  Đã bắt khi đối chiếu lại bằng epoch đúng của giờ prune
  (1795283488) và sửa `prune-deleted.txt` thành **150,20h**
  (sớm hơn 7 ngày đúng 17,80h) TRƯỚC khi viết LIMITS.
  Không ảnh hưởng kết quả (file nháp chưa dùng để đếm
  chính thức; mọi số §7 đều dùng tuổi đã sửa). Bài học:
  tuổi prune chỉ tính từ epoch của đúng mốc giờ ghi trong
  `prune-time.txt`, không gõ hằng epoch tay — cùng họ
  F-162-T6-2 (tuổi prune tính nhẩm sai).
- **F-164-T6-2 — Lệnh kiểm md5 live-code khối T7 đặt
  sai thứ tự pipeline, cho md5 rỗng — đã bắt ngay, không
  dùng.** Lệnh `grep -v '^#' suite | sed -n
  '/T7-BLOCK-START/,/T7-BLOCK-END/p'` lọc comment TRƯỚC
  khi cắt theo marker — mà marker chính là dòng comment
  `# T7-BLOCK-START`/`END` nên dải cắt rỗng, md5 ra
  `d41d8cd9` (md5 của chuỗi rỗng). Đã bắt ngay khi thấy
  md5 rỗng và KHÔNG dùng số này; giá trị đúng lấy từ
  pipeline đứng của harness (sed cắt trên suite thô, rồi
  mới bỏ comment/dòng trống): live-code
  `c92f2efff2080fbe6712522343e9e400`, file khối
  `dc973443030249a262ff63cbc62231d5` — khớp đợt 151–163.
  Không ảnh hưởng kết quả (mọi số §5/§6 đều từ harness
  và pipeline shell đứng). Bài học: cắt theo marker
  trước, lọc comment sau — cùng họ F-163-T6-2 (tính md5
  live-code bằng script nối chuỗi tự viết).
- **F-164-T6-3 — Ghi nhận (không phải lỗi): ba file
  smoke cùng mtime tới giây, phải phân biệt bằng
  nano-giây.** `cooldown-t1-smoke-a` / `-hold` / `-wl`
  đều mtime 2026-11-15T11:39:24Z/49Z tới giây — `ls -ltr`
  xếp smoke-a đầu tiên nhưng không chứng minh được thứ
  tự thật; T6 đã xác định "cũ nhất" bằng `stat %y`
  (smoke-a 11:39:24.340698517Z, sớm hơn smoke-hold
  25,13 s) và `find -printf '%T@'` sắp xếp toàn queue.
  Không ảnh hưởng kết quả. Bài học: khi nhiều file cùng
  mtime tới giây, luôn dùng ns để chọn file prune.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a164-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round164-t6/appendix-numbers.txt` giữ bản
trích gốc (tuổi prune đã sửa thành 150,20h sau khi bắt lỗi
F-164-T6-1 — xem §12; md5 live-code chỉ tính bằng pipeline
shell đứng sau khi bắt lỗi F-164-T6-2 — xem §12):

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=554 max=3452 mean=1931.99
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
suite run1: PASS=9 FAIL=0 T7A=1 secs=33 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 secs=38 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 secs=36 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 secs=32 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 secs=28 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 secs=32 rc=0
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a164.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=528, COOLDOWN=229, RELEASED=517, STALE-LOCK=11, STALE-TICKET=1, TICKET=539, TIMEOUT=10, total=1835
cleaned-open pairs ACQUIRED->RELEASED: 517
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 11
cleaned-close counts: TOTAL: ACQUIRED=528, COOLDOWN=229, RELEASED=517, STALE-LOCK=11, STALE-TICKET=1, TICKET=539, TIMEOUT=10, total=1835
cleaned-close pairs ACQUIRED->RELEASED: 517
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 11
cleaned-final counts: TOTAL: ACQUIRED=528, COOLDOWN=229, RELEASED=517, STALE-LOCK=11, STALE-TICKET=1, TICKET=539, TIMEOUT=10, total=1835
cleaned-final pairs ACQUIRED->RELEASED: 517
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 11
raw log lines open: 1841
raw log lines close: 1841
raw log lines final (after prune check): 1841
new lines since T6-163 close: 33 (TICKET 9, ACQUIRED 9, RELEASED 9, COOLDOWN 6, STALE-LOCK 0, TIMEOUT 0)
new lines in T6-164 session: 0
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
queue age bands open: >=192h: 0 files; >=72h: 68 files; >=48h: 82 files
queue age bands post-prune: >=192h: 0 files; >=72h: 67 files; >=48h: 81 files
KHONG-NHA lines in raw log: 0
prune-39 deleted: cooldown-t1-smoke-a mtime=2026-11-15T11:39:24Z size=14 age=150.20h rule=(b) at 2026-11-21T17:51:28Z
next oldest remaining: cooldown-t1-smoke-hold mtime=2026-11-15T11:39:49Z
reboot-67: btime 2026-11-21T17:33:27Z boot f1d4ce1a; last lock line before reboot 2026-11-21T15:58:58Z RELEASED (lock empty 1h34m29s = 5669s); 0 lines after 15:58:58Z; 0 new STALE-LOCK; NO holder killed
reboot-66: btime 2026-11-21T16:06:45Z boot edb2acdb; last lock line before reboot 2026-11-21T15:58:58Z RELEASED (lock empty 7m47s = 467s); 0 lines after 15:58:58Z; 0 new STALE-LOCK; NO holder killed
clock check open: Cloudflare Date 2026-11-21T17:40:09Z vs local 17:40:08Z (~1s)
clock check close: Cloudflare Date 2026-11-21T17:51:01Z vs local 17:50:59Z (~2s incl fetch latency)
inotify max_user_watches: 63756 (same as #65; was 63747 on #66)
```

---
**Batch stage / Tổng batch:** T6-164: 1 batch / 1 entry / 1 file. Đợt 164 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry (t6). Lũy kế 111–163 (T10-163 đếm dedup toàn cục): T6 không tự cộng tay — chờ T10-164 đếm lại.
