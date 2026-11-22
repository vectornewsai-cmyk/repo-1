# PHASE9 ROUND162 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 12 LIÊN TIẾP) + #64 KHÔNG GIẾT HOLDER + prune lần 37: XÓA 1 FILE — LIMITS

- Đợt: 162, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 18:35 +07 21/11/2026 (= 11:35:51Z 21/11). Chạy
  11:37Z → 11:49Z 21/11/2026. Lúc mở đã ở trên boot
  `d9a8d1ce` (btime 11:15:18Z) — reboot #64 theo brief giao
  (T6 KHÔNG tự chứng nhận số hiệu #64, chỉ chứng nhận từ
  log lock rằng #64 không giết holder — xem §2/§8);
  KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 12 liên tiếp nếu đạt — tổng
  1440/1440); ghi rõ số chu kỳ, điều kiện churn, boot đo;
  (b) kiểm tra lock khỏe: số cặp, số đang giữ, TIMEOUT mới,
  "KHÔNG NHẢ" — trích ĐÚNG CỘT (cột $3 qua
  `analyze-log.py`, xem §4); (c) chạy suite liên quan và
  ghi exit code + thời gian thật; (d) prune lần 37: đếm
  queue lúc mở, xóa file theo đúng quy tắc prune các đợt
  trước, ghi rõ xóa file nào, queue trước/sau; kiểm tra
  reboot #64 có giết holder nào không (brief nhắc:
  reboot #60 đã giết holder t8-round159 — lần thứ 2
  reboot giết holder; STALE-LOCK thu hồi đúng);
  (e) ghi sai số riêng F-162-T6-n; (f) stage paths
  NUL-delimited; (g) viết cờ .done CÓ NỘI DUNG.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–161,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–161); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (500 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 11, STALE-LOCK GIỮ 11
  (0 ca mới cả hai — xem §4). Reboot #64 KHÔNG giết holder
  nào (lock trống 55m10s trước btime). Prune lần 37: xóa 1 file cũ nhất
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
- Thư mục làm việc: `hidden_files/round162-t6/` (ps-full-open.txt,
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
  new-lines-since-t6-161.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a162.sh,
  t7-control-a162.stdout.log, t7-block-a162.sh,
  t7-a162-churn.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT d9a8d1ce (#64, btime 11:15:18Z); lock TRỐNG; queue 101 file (khớp T10-161 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7`, btime 11:15:18Z
  theo /proc/stat** (epoch 1795259718; `uptime -s` =
  11:15:18; `journal --list-boots` chỉ 1 dòng d9a8d1ce,
  first entry 11:15:29Z). Uptime ~22' lúc T6 bắt đầu
  (11:37Z), ~33' lúc snapshot đóng (11:48Z). Boot này là
  #64 theo brief giao (btime 11:15:18Z) — **T6 KHÔNG tự
  chứng nhận số hiệu #64** (thuộc T0-162/T2-162; lúc T6
  mở chưa có cờ `round162-t0.done` trên đĩa); T6 chỉ
  chứng nhận từ log lock rằng #64 không giết holder (xem
  §2/§8). **KHÔNG có reboot trong phiên T6** (boot_id
  giống nhau lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sat, 21 Nov 2026 11:37:45 GMT` vs local 11:37:44Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, khớp T6-161);
  lúc đóng Cloudflare 11:48:19Z vs local 11:48:18Z
  (chênh ~1 s). Các mốc wall đợt 162 đọc trực tiếp được.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Lưu ý phương pháp: `md5-open.txt` ghi lại các giá trị
  md5 đã đo bằng lệnh `md5sum` lúc mở (~11:37Z, xem log
  phiên); `md5-close.txt`/`md5-final.txt` đo lại từ đĩa
  lúc đóng — các bản khớp nhau từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp số học
  từ T10-161 đóng: 100 sau prune 36 + 1 file cooldown mới
  `cooldown-t8-round161`, mtime 10:20Z (§2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật lúc mở và lúc đóng; X11 trống lúc mở, 3 socket luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 11:37Z
  (mở, `ps-full-open.txt`) và lúc 11:48Z
  (đóng, `ps-full-close.txt`).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở và lúc đóng: 0 vite thật đang chạy** —
  `ss -tlnp` trống hoàn toàn cả hai snapshot; các dòng chứa
  chuỗi "vite" trong snapshot ps đều KHÔNG phải process vite:
  lúc mở 1 dòng (chính lệnh snapshot của T6) và lúc đóng
  1 dòng (chính lệnh snapshot của T6) — cùng bẫy tự-tham-chiếu như đợt 155–161.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #64 đã dọn
  sạch 3 socket X193/X194/X195 của đợt 161 — T8-161 đã
  dọn lúc ~10:20Z, `/tmp/.X11-unix/` trống lúc T10-161
  đóng; reboot #64 dọn nốt phần còn lại nếu có).
  **Lúc đóng: 3 socket X193 / X194 / X195, tạo 11:44Z** —
  của các luồng khác đợt 162 (T4/T8 khởi động Xvfb trong
  phiên; T6 không khởi động Xvfb/vite nào, không đụng tới
  các process này, không kill process nào trong phiên này).
  Process luồng khác lúc đóng: `b2-watcher.sh` của T9-162
  (pid 6786), `replay-watch-162.sh` của T5-162 (pid 18801,
  watcher-162 đã chạy) và lệnh kiểm tra của T9-162.
- **Watcher-161 KHÔNG còn sống lúc T6 mở** — không thấy
  trong `ps-full-open.txt`; chết theo reboot #63 là khớp
  thời gian (poll cuối 10:30:39Z, T10-161 xác minh);
  verdict chính thức thuộc T5-162 (T6 chỉ ghi nhận sự vắng
  mặt). **Watcher-162 (pid 18801) ĐÃ chạy lúc T6 đóng**
  (T5-162 khởi động; T6 không khởi động watcher nào).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-162).
  Inotify: `max_user_watches` = **63747** lúc kiểm cuối
  (~11:48Z, khớp đợt 147–161 — không có lần flip mới
  trong phiên T6; quyết parent (m) đợt 146: ghi làm chú
  thích, không hành động).
- Tải hệ thống trong phiên: các luồng đợt 162 khởi động
  dần (T5-162 watcher, T9-162 sampler/b2-watcher) — harness churn vẫn
  120/120 (xem §6).
  Suite đợt này chạy 21–32 s/lượt (tương đương đợt 161:
  21–27 s/lượt).

## 2. Lock lúc mở: TRỐNG; 0 dòng mới trong phiên T6; +32 dòng kể từ T6-161 đóng — TẤT CẢ CỦA t4 + t8-round161, TRƯỚC phiên T6

- **Lúc mở (11:37Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (11:48Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`
  (trước prune), rc=0. Prune KHÔNG phải chờ (xem §7).
- **Log lock +32 dòng kể từ T6-161 đóng** (raw 1746 lúc
  T6-161 đóng → 1778 lúc T6-162 mở → 1778 lúc snapshot
  đóng): 32 dòng đều trước phiên T6; **+0 dòng trong
  phiên T6-162** (diff bản đã lọc mở/đóng rc=0 — không
  luồng nào khác đụng lock trong phiên T6; giống đợt 161).
- Đối chiếu 32 dòng (khớp đúng từng dòng, file
  `new-lines-since-t6-161.txt`, dòng thô 1747–1778):
  - t4: 2 chu kỳ hoàn tất (09:43:13Z → 09:46:40Z, hold
    207 s; 09:47:01Z → 09:50:28Z, hold 206 s) — lượt yên #30 attempt1/attempt2 của T4-161.
  - t8-round161: 7 chu kỳ bắt đầu (10:01:51Z →
    10:16:17Z); **7 chu kỳ HOÀN TẤT** (holds 152 / 70 /
    130 / 240 / 60 / 120 / 230 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14959–14972 ms trên cổng 5490/5390);
    0 chu kỳ dở dang.
  - Tổng: Δ TICKET +9, Δ ACQUIRED +9, Δ RELEASED +9,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **9/9 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ bị reboot giết.**
- **KHOẢNG TRỐNG LOG 10:20:08Z → nay (11:37Z lúc mở,
  1h17m23s): KHÔNG có dòng lock nào sau 10:20:08Z.**
  Reboot #64 (btime 11:15:18Z) rơi vào khoảng này — xem §8.
- **REBOOT #64 (btime 11:15:18Z, boot `d9a8d1ce`) —
  KHÔNG giết holder nào:** dòng lock cuối trước reboot là
  t8-round161 RELEASED 10:20:08Z (hold 230 s, số học khớp);
  dòng đầu sau reboot: KHÔNG CÓ (0 dòng log sau 10:20:08Z
  tới lúc T6-162 mở) — tức lock trống **55m10s trước
  reboot** và không có dòng lock nào sau 10:20:08Z.
  Không có ACQUIRED nào chưa release tại thời điểm #64,
  không có dòng STALE-LOCK mới nào sau #64 (STALE-LOCK
  vẫn 11, ca mới nhất 03:12:16Z — trước #64 hơn 8 giờ),
  still held = 0 lúc T6-162 mở, lock TRỐNG xác minh độc
  lập lúc mở 11:37Z.
  **Kết luận: #64 không giết holder nào — verdict sạch
  (khoảng trống ~55 phút; ngắn hơn #62 với 1h28m01s và
  #61 với 1h57m24s nhưng vẫn sạch — không có holder nào
  để giết).** CAVEAT: theo tiền lệ OVERLAP #62 (quyết
  parent (q) đợt 161), btime ghi trên /proc/stat được đọc
  là giờ thật trừ khi có bằng chứng ngược; T6 không có
  bằng chứng nào cho thấy btime #64 sai (đồng hồ lúc mở
  ≈ Cloudflare ±1 s, uptime khớp btime qua `uptime -s`);
  nếu T0/T2-162 phát hiện overlap cho #64 thì khoảng trống
  lock vẫn là 55m10s theo btime ghi — verdict "không giết
  holder" KHÔNG phụ thuộc vào việc có overlap hay không,
  vì dòng lock cuối là RELEASED và 0 dòng sau 10:20:08Z
  tới lúc T6 mở — lock trống trong toàn bộ cửa sổ chứa
  reboot dù reboot xảy ra ở mốc nào trong cửa sổ đó.
  Các mốc "55m10s" trong LIMITS này là số đo theo btime ghi
  trên /proc/stat, giữ nguyên để đối chiếu; T10-162
  phán cuối về giờ thật của #64.
- **File cooldown mới kể từ T6-161 đóng:
  `cooldown-t8-round161` (mtime 10:20Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 161 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 234 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 9 chu kỳ hoàn tất
  kể từ T6-161 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 225 chu kỳ T6-161 đã đếm = **234 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (225 đợt
    161 + 9 đợt này).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1772 dòng chính thức lúc kiểm cuối, 500 cặp, 0 đang giữ, double-acquire GIỮ 11, STALE-LOCK GIỮ 11, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — T6 đợt này xác minh
lại bằng `sed -n '848,853p'`: đúng 6 dòng đó; bản đã lọc
= raw trừ đúng 6 dòng đó; diff bản đã lọc mở/đóng rc=0,
§2; analyzer chạy trên bản đã lọc — xem F-162-T6-1 về
lỗi lọc lần đầu đã bắt và sửa).
Bản đã lọc lúc đóng: **1772 dòng** (raw 1778) — **+32 dòng
kể từ T6-161 đóng** (1740 → 1772). Kiểm cuối sau
prune (11:48Z 21/11): bản đã lọc **1772 dòng** (raw 1778),
RELEASED 500, cặp 500, đang giữ 0, double-acquire 11 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-161 đóng | T6-162 mở | T6-162 đóng (snapshot) | Δ trong phiên T6-162 |
|---|---|---|---|---|
| Tổng dòng | 1740 | 1772 | 1772 | +0 |
| TICKET | 513 | 522 | 522 | +0 |
| ACQUIRED | 502 | 511 | 511 | +0 |
| RELEASED | 491 | 500 | 500 | +0 |
| COOLDOWN | 212 | 217 | 217 | +0 |
| STALE-LOCK | 11 | 11 | 11 | +0 |
| STALE-TICKET | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 491 | 500 | 500 | +0 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 |
| Double-acquire | 11 | 11 | 11 | 0 mới trong phiên |

- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối:**
  ACQUIRED 511 − RELEASED 500 = 11 ACQUIRED chưa release
  trong lịch sử log — nhưng cả 11 đều đã được xử lý: 10 ca
  double-acquire cũ (đã giải thích các đợt trước) + 1 ca
  t8-round159 03:12:16Z (STALE-LOCK thu hồi holder bị
  #60 giết — §8 đợt 160). Analyzer xác nhận `still held at end of
  log: 0` ở cả ba snapshot (mở/đóng/kiểm cuối). Lock
  TRỐNG lúc mở và lúc đóng — status xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 11 — 0 ca mới kể từ T6-161 đóng,
  0 ca mới trong phiên T6-162.** Ca mới nhất vẫn là
  analyzer dòng 1696 (bản đã lọc — dòng 1696 bản thô là
  t8-round159 ACQUIRED 03:12:16Z sau STALE-LOCK cùng giây
  (artifact thu hồi #60, đã giải thích đợt 160).
  **Kết luận: 0 double-acquire THẬT mới.** T10-162 lưu ý khi đối chiếu: số "11" của
  analyzer gồm 10 ca cũ + 1 artifact thu hồi #60;
  STALE-LOCK "11" cũng gồm 10 ca cũ + 1 ca thu hồi #60 —
  **hai con số là CÙNG MỘT sự kiện, không phải hai sự
  kiện riêng** (nhắc lại từ đợt 160/161).
- **0 double-acquire mới** kể từ T6-161 đóng (theo nghĩa
  cơ chế). 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (9 chu kỳ mới sạch kể từ T6-161 đóng,
  0 chu kỳ dở dang), 0 zombie lúc đóng, 0 stale mới
  trong phiên, queue 0 ticket, log nhất quán (500 cặp +
  0 đang giữ lúc kiểm cuối, 0 mất dấu khác — số chính
  thức đã loại 6 dòng repro lỗi của T6-132), 0
  TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–162 (toàn đợt) và đợt 162 (tới ~11:48Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **234 chu kỳ thật** chứng minh (§3).
  Caveat còn lại: **reboot #64 KHÔNG giết holder**
  (xem §8 — khoảng trống ~55 phút, verdict sạch);
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
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161 §6.2.
  File khối T7 đã trích `t7-block-a162.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160 và 161 (cùng md5). Harness đợt này chạy đúng code (A)
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
- `bash -n` harness t7-control-a162.sh: OK (bản sao của
  t7-control-a161.sh, chỉ đổi hậu tố a161 → a162 + sửa
  comment "đợt 161" → "đợt 162").
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–161 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ mười hai liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(11:38–11:41Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 32/25/28/22/
21/21 s — tương đương đợt 161: 27/21/21/21/22/21 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào do 6 lượt chạy (0 dòng mới trong
phiên đều là của T6, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round162-t6/t7-control-a162.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot d9a8d1ce (#64,
btime 11:15:18Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a162.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160 và 161; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a162-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 501 ms, max 3493 ms, trung bình 2059,93 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'12" (11:41:01–11:48:13Z).
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

- **Kết luận: (A) VẪN XANH sau mười một đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ mười hai liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 1440/1440 dưới churn qua 12 đợt). Chú thích tỉ lệ
  (như T6-150–161): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 11 (đợt 161) → **12 (đợt
  162 — lần thứ mười hai xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 43 (đợt 161) → **44 (đợt 162,
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
  - 11:37Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-161 thêm `cooldown-t8-round161`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG lúc mở (11:37Z) VÀ vẫn TRỐNG lúc snapshot
    đóng (11:48Z) — điều (e) thỏa ngay, **prune KHÔNG
    phải chờ** (giống đợt 160/161). T6 xác minh lại TRỐNG
    ngay trước prune (11:48Z, `status-before-prune.txt`).
  - 11:48:25Z 21/11: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-t3-round117`, mtime 2026-11-15T10:27:33Z,
    145,35h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round 117; xem §12
    F-149-T6-3).
  - **Kết quả prune đợt 162 (lần 37): 1 file đã xóa
    (`cooldown-t3-round117`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (11:37Z) **101 file / 1414 byte**;
  lúc snapshot đóng (11:48Z, trước khi prune) **101 file /
  1414 byte** (log lock 0 dòng mới trong phiên, không thêm
  file cooldown mới);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (11:48Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-161 đóng: 100 + 1 file mới
  (`cooldown-t8-round161`) = 101 ✓ — khớp đúng số T10-161 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 67 file; ≥48h (`-mtime +1`): 81
  file**. Sau prune (11:48Z): **≥192h: 0 file; ≥72h:
  66 file; ≥48h: 80 file** — ≥72h giảm 67 → 66 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t10-round117`, mtime 2026-11-15T10:51:49Z —
  lúc 11:49Z mới **~144,96h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 67, tăng 1 so với lúc
  mở đợt 161 (66) và tăng 2 so với sau prune 36 (65):
  2 file khác đã vượt ngưỡng 72h trong khoảng giữa 2 đợt
  (file tạo 18/11 08:37–11:37Z); khớp số học, không phải
  mâu thuẫn. ≥48h lúc mở 81, tăng 1 so với lúc mở đợt 161
  (80) và tăng 2 so với sau prune 36 (79) — cùng lý do,
  file tạo 19/11 08:37–11:37Z.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ mười ba liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt 156 xóa
  `cooldown-s3-round116`, đợt 157 xóa
  `cooldown-s10-round116`, đợt 158 xóa `cooldown-t6`,
  đợt 159 xóa `cooldown-t8-round117`, đợt 160 xóa
  `cooldown-t4-hold`, đợt 161 xóa `cooldown-t4-wc`,
  đợt này xóa `cooldown-t3-round117` trước khi nó đủ 7
  ngày — nó đủ 7 ngày theo đồng hồ tường vào khoảng
  **22/11 10:27Z** nhưng đã bị xóa ở đợt 162, sớm ~22,65h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 38 (T6-163): tổng lock 100 sau prune 37 —
  kiểm lại lúc mở đợt 163** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t10-round117` đủ 7 ngày ~22/11 10:51Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-162; #64 KHÔNG giết holder; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **d9a8d1ce** (btime
  11:15:18Z = epoch 1795259718). T6 **KHÔNG tự chứng nhận**
  số hiệu reboot #64 (thuộc T0-162/T2-162 — lúc T6 mở
  chưa có cờ `round162-t0.done` trên đĩa).
- Uptime boot lúc đóng ~33'. `journal --list-boots`
  chỉ 1 dòng d9a8d1ce (first entry 11:15:29Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~11:48Z, boot_id giống lúc mở; kiểm
  lại sau prune, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  11:48:19Z vs local 11:48:18Z — chênh ~1 s. Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 162
  đọc trực tiếp được.
- **REBOOT #64 (btime 11:15:18Z, boot `d9a8d1ce`) —
  KHÔNG giết holder** (§2): lock trống 55m10s trước
  btime (RELEASED cuối 10:20:08Z, hold 230 s, số học
  khớp); 0 dòng log sau 10:20:08Z; 0 STALE-LOCK mới;
  still held = 0 lúc T6-162 mở; lock TRỐNG xác minh
  độc lập lúc mở 11:37Z. **Verdict này sạch (khoảng trống
  ~55 phút — ngắn nhất trong ba reboot gần đây nhưng vẫn
  sạch).** T6 không phán mù cho #64 —
  giao T2-162 (mù #94? (#62) giao từ đợt 161; #95? (#63)
  / #96? (#64) nếu có cũng giao T2-162).
- **Watcher-161 KHÔNG còn sống lúc T6 mở** (§1) — chết
  theo #63, khớp thời gian; verdict thuộc T5-162.
  **Watcher-162 (pid 18801) đã chạy lúc T6 đóng** (T5-162
  khởi động). POSTBOOT_PASS #64 (nếu có) thuộc T5-162; T6
  KHÔNG ghi cờ hộ.
- **Nhắc lại #60/#61/#62/#63 (để đối chiếu):** #60 ĐÃ
  giết holder t8-round159 (lần thứ 2 reboot giết holder,
  sau #50); cơ chế STALE-LOCK thu hồi đúng. #61 KHÔNG
  giết holder (lock trống 1h57m24s trước btime). #62 KHÔNG
  giết holder (lock trống 1h28m01s trước btime — quyết
  parent (w) đợt 161). Đợt này #64 nối chuỗi "không giết
  holder" lên 3 reboot liên tiếp (#61, #62, #64) — sau #60.
  Riêng #63 (btime 10:30:42Z, giữa phiên đợt 161, sau khi
  T6-161 đã đóng cờ nên T6-161 chưa kiểm): T6-162 chứng
  nhận BỔ SUNG từ cùng bằng chứng log — xem §11 (kể cả
  #63 thì chuỗi là 4 reboot liên tiếp).

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-162
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (11:48Z 21/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 1778 dòng thô /
  1772 dòng chính thức, 500 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round162-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND162_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round162-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 162 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 162 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–161 (T10-161 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-162).

## 11. GHI CHÚ CHO T10-162 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ mười hai liên tiếp, tổng 1440/1440 qua 12
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 11 → 12 (lần thứ mười hai xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 43 → 44 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (500 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); prune lần 37 xóa 1 file, queue về đúng
  trần 100 (KHÔNG phải chờ luồng khác nhả lock đợt này;
  0 dòng log mới trong phiên T6).
- **Reboot #64 KHÔNG giết holder** (lock trống 55m10s
  trước btime — verdict sạch; nối chuỗi "không giết
  holder" lên 3 reboot liên tiếp sau #60, chưa tính #63
  — xem §8).
  **Đồng hồ ở giờ thật** (Cloudflare ±1 s, T6 tự kiểm).
  Mù cho #64 giao T2-162.
- **Double-acquire GIỮ 11, STALE-LOCK GIỮ 11 — 0 ca mới
  cả hai.** Hai con số là CÙNG MỘT sự kiện thu hồi #60 —
  T10-162 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng.
- 0 zombie lúc mở và lúc đóng; X11 trống lúc mở (reboot
  #64 đã dọn 3 socket sót đợt 161), 3 socket X193/X194/
  X195 mới lúc đóng (của luồng khác đợt 162, tạo 11:44Z)
  — không phải của T6; watcher-161 không còn sống lúc
  mở (chết theo #63, khớp thời gian — T5-162 xác minh);
  watcher-162 đã chạy lúc T6 đóng.
  T10-162 lưu ý khi đối chiếu log (+32 dòng kể từ
  T6-161 đóng đều là của t4 + t8-round161, +0 dòng trong
  phiên T6).
- **BỔ SUNG — #63 và lock:** T6-161 đóng cờ 08:50:04Z,
  TRƯỚC reboot #63 (btime 10:30:42Z) nên chưa từng kiểm
  #63 có giết holder không. T6-162 kiểm #64 từ log:
  dòng lock cuối trước #64 là RELEASED 10:20:08Z —
  TRƯỚC btime #63 (10:30:42Z) — tức không có dòng lock
  nào trong khoảng 10:20:08Z → 11:15:18Z, bao gồm toàn bộ
  cửa sổ chứa #63. Vì vậy **#63 CŨNG không giết holder
  nào** (lock trống từ 10:20:08Z, tức 10m34s trước btime
  #63; 0 dòng log sau 10:20:08Z; 0 STALE-LOCK mới sau
  #63) — T6-162 chứng nhận bổ sung từ cùng bằng chứng
  log. Chuỗi "không giết holder" kể cả #63 là 4 reboot
  liên tiếp (#61, #62, #63, #64) sau #60. T10-162 xác
  nhận lại khi đối chiếu.
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #88? VẪN MỞ; mù #93? (#61) ĐÓNG theo quyết parent
  (b) đợt 161; mù #94? (#62) SƠ BỘ MỞ — giao T2-162;
  birefnet 0 thử lần 15 (đợt 161); u2net
  là fallback chính thức; POSTBOOT_PASS #62 ĐÃ CÓ —
  T5-161; POSTBOOT_PASS #63 CHƯA CÓ — giao T5-162;
  POSTBOOT_PASS #64 chưa có — giao T5-162; run 161 vẫn running lúc
  T10-161 đóng — kết cục thuộc T7-162).
- **BỔ SUNG sau khi T0-162 đóng cờ (11:40:32Z, trong lúc T6
  chạy harness — T6 đọc cờ `round162-t0.done` lúc kiểm cuối):**
  T0-162 xác minh btime #64 (11:15:18Z) **LÀ giờ thật** (9 nguồn
  khớp; run 161 SUCCEEDED 11:11:39Z, trước btime 3'39", 0 event
  sau — **KHÔNG nghịch lý đồng hồ, KHÔNG OVERLAP #64/#63**);
  reboot #64 xảy ra SAU khi T10-161 đóng sổ 4'23" (đóng
  11:10:55Z) — claim T10-161 ĐỨNG. Caveat §2 về khả năng
  overlap cho #64 nay được giải quyết: **không có overlap** —
  khoảng trống lock 55m10s là số theo giờ thật. Kết cục run 161
  (SUCCEEDED 11:11:39Z) T6 chỉ ghi nhận chéo từ cờ T0 — verdict
  chính thức thuộc T7-162. POSTBOOT_PASS #63 + #64 CHƯA CÓ
  (T5-162) — khớp ghi nhận của T6.
- Cờ `round162-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-162 (F-162-T6-n)

- **F-162-T6-1 — Lệnh lọc bản đã lọc lần đầu không khớp
  vị trí cột owner.** Lệnh `grep -v -E "^(tA|tH) "` không
  loại được dòng nào (owner tA/tH nằm ở cột $2, sau
  timestamp — không ở đầu dòng), nên bản "đã lọc" lần đầu
  vẫn 1778 dòng = raw (kèm 6 dòng repro lỗi T6-132).
  Đã bắt ngay khi đối chiếu `wc -l` (1778 = raw, phải là
  1772) và lọc lại đúng bằng `awk '$2!="tA" && $2!="tH"'`
  — bản lọc lại 1772 dòng, diff với bản đã lọc đợt 161
  cho đúng 32 dòng mới (1747–1778), khớp từng dòng với
  `new-lines-since-t6-161.txt`. Không ảnh hưởng kết quả
  (chỉ là bản lọc nháp, chưa dùng để đếm chính thức;
  mọi số §4 đều từ bản lọc đúng). Bài học: cột owner là
  $2, không phải đầu dòng — lọc repro phải theo cột,
  như `analyze-log.py` dùng `parts[2]` cho cột sự kiện.
- **F-162-T6-2 — Một số tuổi trong bản nháp prune-deleted.txt
  viết sai, đã bắt và sửa TRƯỚC khi stage.** Tuổi file
  `cooldown-t3-round117` lúc xóa ghi "145.36h" — sai:
  tính tại giờ xóa thật 11:48:25Z là 145,35h (145,36h là
  số tính tại 11:49:00Z — lệch 36 s); số "sớm ~22,64h"
  cũng đã sửa thành 22,65h theo giờ xóa thật. Đã sửa
  `prune-deleted.txt` trước khi viết LIMITS. Không ảnh
  hưởng kết quả (chỉ là số trong file nháp, chưa stage).
  Bài học: đối chiếu tuổi bằng phép tính trực tiếp tại
  đúng giờ xóa, không cộng nhẩm từ LIMITS đợt trước —
  cùng họ F-161-T6-2.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a162-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round162-t6/appendix-numbers.txt` giữ bản
trích gốc:

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=501 max=3493 mean=2059.93
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
suite run1: PASS=9 FAIL=0 T7A=1 secs=32 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 secs=25 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 secs=28 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 secs=22 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a162.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=511, COOLDOWN=217, RELEASED=500, STALE-LOCK=11, STALE-TICKET=1, TICKET=522, TIMEOUT=10, total=1772
cleaned-open pairs ACQUIRED->RELEASED: 500
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 11
cleaned-close counts: TOTAL: ACQUIRED=511, COOLDOWN=217, RELEASED=500, STALE-LOCK=11, STALE-TICKET=1, TICKET=522, TIMEOUT=10, total=1772
cleaned-close pairs ACQUIRED->RELEASED: 500
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 11
cleaned-final counts: TOTAL: ACQUIRED=511, COOLDOWN=217, RELEASED=500, STALE-LOCK=11, STALE-TICKET=1, TICKET=522, TIMEOUT=10, total=1772
cleaned-final pairs ACQUIRED->RELEASED: 500
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 11
raw log lines open: 1778
raw log lines close: 1778
raw log lines final (after prune check): 1778
new lines since T6-161 close: 32 (TICKET 9, ACQUIRED 9, RELEASED 9, COOLDOWN 5, STALE-LOCK 0, TIMEOUT 0)
new lines in T6-162 session: 0
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
queue age bands open: >=192h: 0 files; >=72h: 67 files; >=48h: 81 files
queue age bands post-prune: >=192h: 0 files; >=72h: 66 files; >=48h: 80 files
KHONG-NHA lines in raw log: 0
prune-37 deleted: cooldown-t3-round117 mtime=2026-11-15T10:27:33Z size=14 age=145.35h rule=(b) at 2026-11-21T11:48:25Z
next oldest remaining: cooldown-t10-round117 mtime=2026-11-15T10:51:49Z
reboot-64: btime 2026-11-21T11:15:18Z boot d9a8d1ce; last lock line before reboot 2026-11-21T10:20:08Z RELEASED (lock empty 55m10s = 3310s); 0 lines after 10:20:08Z; 0 new STALE-LOCK; NO holder killed
clock check open: Cloudflare Date 2026-11-21T11:37:45Z vs local 11:37:44Z (~1s)
clock check close: Cloudflare Date 2026-11-21T11:48:19Z vs local 11:48:18Z (~1s)
inotify max_user_watches: 63747
```

---
**Batch stage / Tổng batch:** T6-162: 1 batch / 1 entry / 1 file. Đợt 162 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry (t6). Lũy kế 111–161 (T10-161 đếm dedup toàn cục): T6 không tự cộng tay — chờ T10-162 đếm lại.
