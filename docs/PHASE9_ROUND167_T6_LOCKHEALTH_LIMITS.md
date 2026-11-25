# PHASE9 ROUND167 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 17 LIÊN TIẾP) + #71/#72/#73 KHÔNG GIẾT HOLDER + prune lần 42: XÓA 1 FILE — LIMITS

- Đợt: 167, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 09:35 +07 22/11/2026 (= 02:35:51Z). Chạy
  02:37Z → 02:49Z 22/11/2026. Lúc mở đã ở trên boot
  `b643911f` (btime 02:28:01Z) — boot này là #73 theo brief
  giao (btime 02:28:01Z, sau #72 02:05:05Z); T6 KHÔNG tự
  chứng nhận số hiệu #73, chỉ chứng nhận từ log lock rằng
  #71/#72/#73 KHÔNG giết holder (xem §2/§8); KHÔNG có
  reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 17 liên tiếp nếu đạt — tổng
  2040/2040); ghi chuỗi xanh kép + chuỗi suite xanh mới;
  (b) lock: chạy lại analyze-log.py trên log final đóng
  băng; kiểm cuối ACQUIRED/RELEASED/cặp/đang giữ/TIMEOUT/
  KHÔNG NHẢ; double-acquire và STALE-LOCK có ca mới
  không? Ghi đúng số kiểm cuối đợt này (đừng nhầm nhãn
  đợt cũ — bài học (r) đợt 163); (c) reboot #71/#72/#73
  có giết holder không? (lock trống bao lâu trước btime?
  0 dòng log sau mốc nào? 0 STALE-LOCK mới?); boot
  b643911f xuyên suốt từ lúc mở? (d) prune lần 42: kiểm
  queue lúc mở (kỳ vọng 101 mục), prune 1 file cũ nhất
  theo đúng điều kiện đứng (ghi tên file, mtime, tuổi,
  điều nào), queue sau prune; chờ lock nếu cần, ghi rõ
  thời gian chờ; (e) trần inotify hiện tại; 0 zombie;
  X11 lúc mở; đồng hồ (Cloudflare ±? s); (f) ghi mọi sai
  số dạng F-167-T6-N; lưu ý F-147-T6-1 (nối lại — T6-166
  đếm lần thứ 17, kiểm tra còn nối không).
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–166,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–166); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (545 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 12, STALE-LOCK GIỮ 12
  (0 ca mới cả hai). Reboot #71 KHÔNG giết holder (lock
  trống 6m39s trước btime); #72 KHÔNG giết holder (lock
  trống 1h25m35s); #73 KHÔNG giết holder (lock trống
  1h48m31s — dài nhất kể từ #66 — xem §2/§8). Prune lần 42:
  xóa 1 file cũ nhất (điều (b)), queue 101 → 100 file —
  KHÔNG PHẢI CHỜ lock (lock TRỐNG lúc mở, lúc đóng và ngay
  trước prune — khác đợt 166 phải chờ T4-166).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round167-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, queue-open.txt,
  queue-oldest-open.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, vite-lock-v2-raw-final.log,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt,
  new-lines-since-t6-166.txt, prune-deleted.txt, prune-time.txt, harness-start.txt,
  harness-end.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  status-final.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a167.sh,
  t7-block-a167.sh,
  t7-a167-churn.log, t7-control-a167.stdout.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT b643911f (btime 02:28:01Z); lock TRỐNG; queue 101 file (khớp T10-166 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `b643911f-d49c-44a0-8048-82984d3461c5`, btime 02:28:01Z
  theo /proc/stat** (epoch 1795314481; `uptime -s` =
  02:28:01; `journal --list-boots` chỉ 1 dòng b643911f,
  first entry 02:28:13Z). Uptime ~10' lúc T6 bắt đầu
  (02:38Z), ~20' lúc snapshot đóng (02:48Z). Boot này là
  #73 theo brief giao (btime 02:28:01Z, sau #72 02:05:05Z,
  gap #72→#73 danh nghĩa 1.376 s — T0-167 xác minh đầy đủ)
  — **T6 KHÔNG tự chứng nhận số hiệu #73** (thuộc T0-167/T2-167);
  T6 chỉ chứng nhận từ log lock rằng #71/#72/#73 KHÔNG giết
  holder (xem §2/§8).
  **KHÔNG có reboot trong phiên T6** (boot_id giống nhau
  lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sun, 22 Nov 2026 02:38:16 GMT` vs local 02:38:15Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, trong đó có độ trễ
  fetch curl ~1–2 s); lúc đóng Cloudflare 02:48:05Z vs
  local 02:48:03Z (chênh ~2 s — cùng họ lúc mở, không phải
  lệch đồng hồ). Các mốc wall đợt 167 đọc trực tiếp được.
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
  từ T10-166 đóng: 100 sau prune 41 + 1 file cooldown mới
  `cooldown-t8-round166`, mtime 00:39:30Z (§2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật của T6; X11 trống lúc mở, 3 socket luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 02:38Z
  (mở, `ps-full-open.txt`) và lúc 02:48Z
  (đóng, `ps-full-close.txt`).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$1 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống
  hoàn toàn; dòng duy nhất chứa chuỗi "vite" trong snapshot
  ps lúc mở là lệnh exec của chính T6 (cùng bẫy tự-tham-chiếu
  như đợt 155–166).
  **Lúc đóng: 0 vite thật của T6** — dòng "vite" duy nhất
  trong ps lúc đóng cũng là lệnh exec của chính T6 (đã lọc
  `grep -v round167-t6` = 0 dòng còn lại). T6 không khởi
  động Xvfb/vite nào, không kill process nào trong phiên này.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #73 đã dọn
  sạch 3 socket X193/X194/X195 của đợt 166 — T6-166 đã xác
  nhận 3 socket đó lúc đóng đợt 166).
  **Lúc đóng: 3 socket X193 / X194 / X195, tạo 02:44Z** —
  của một luồng khác đợt 167 (khởi động Xvfb trong phiên;
  T6 không khởi động Xvfb/vite nào, không đụng tới các
  process này). Đây là lần thứ tám liên tiếp
  cùng 3 số display X193/X194/X195 — xem quyết (bb) đợt 163.
- **Watcher-167: T6 không thấy watcher nào lúc mở/đóng**
  (T5-167 sở hữu — watcher-166 đã chết theo reboot #71,
  xem aggregate 166 §12.3 (j); T6 không khởi động watcher nào).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-167).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (~02:38Z và ~02:48Z) — **GIỐNG trần trên #69, #70 và
  #71** (theo T9-166); khác 63756 trên #67 (T6-164 đo) — xem §11,
  ghi nhận, không hành động.
- Tải hệ thống trong phiên: các luồng đợt 167 khởi động
  dần (Xvfb 02:44Z của luồng khác) — harness churn vẫn 120/120 (xem §6).
  Suite đợt này chạy 21–25 s/lượt (tương đương đợt 166:
  22–30 s/lượt).

## 2. Lock lúc mở: TRỐNG; +32 dòng kể từ T6-166 đóng — TẤT CẢ SẠCH, 9 CHU KỲ MỚI HOÀN TẤT TRƯỚC PHIÊN + 0 CHU KỲ TRONG PHIÊN; #71/#72/#73 KHÔNG GIẾT HOLDER (PHÁT HIỆN MỚI)

- **Lúc mở (02:38Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (02:48Z): lock vẫn TRỐNG** — status
  `TRỐNG`, `0 ticket + 101 cooldown` (trước prune).
  **Prune KHÔNG PHẢI CHỜ** (xem §7): lock trống lúc mở,
  lúc đóng và ngay trước prune (`status-before-prune.txt`
  02:48Z) — khác đợt 166 phải chờ T4-166 tới 23:51:17Z.
- **Log lock +32 dòng kể từ T6-166 đóng** (raw 1911 lúc
  T6-166 đóng → 1943 lúc T6-167 mở → 1943 lúc snapshot
  đóng → 1943 lúc kiểm cuối): 32 dòng trước phiên T6;
  **+0 dòng trong phiên T6-167** (suite chạy trên log riêng
  trong /tmp — giống đợt 166).
- Đối chiếu 32 dòng trước phiên (khớp đúng từng dòng, file
  `new-lines-since-t6-166.txt`, dòng thô 1912–1943):
  - t4: 4 dòng — 2 chu kỳ (attempt 23:53:08Z → RELEASED
    23:56:43Z, hold 215 s; attempt 23:57:03Z → RELEASED
    00:01:21Z, hold 258 s) — T4-166 tiếp tục sau khi
    T6-166 đóng (attempt1 của T4-166 đã RELEASED 23:51:17Z
    trong phiên T6-166, §2 đợt 166).
  - t8-round166: 28 dòng — 7 chu kỳ bắt đầu (00:18:26Z →
    00:35:39Z); **7 chu kỳ HOÀN TẤT** (holds 178 / 80 /
    150 / 251 / 70 / 130 / 231 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14936–14959 ms trên cổng 5490/5390); 0 chu kỳ
    dở dang. Chu kỳ hold 251 s (00:27:23Z → 00:31:34Z) là pha
    dài nhất trong 7 chu kỳ — lock vẫn RELEASED bình thường
    sau đó, không bị giết.
  - Tổng trước phiên: Δ TICKET +9, Δ ACQUIRED +9, Δ RELEASED +9,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **9/9 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ dở dang.**
- **REBOOT #71 (btime 00:08:00Z 22/11, boot `ea73ac4f`) —
  KHÔNG giết holder nào (PHÁT HIỆN MỚI CỦA T6-167):**
  dòng lock cuối trước reboot là t4 RELEASED 00:01:21Z
  (hold 258 s, số học khớp); dòng đầu sau reboot:
  t8-round166 TICKET 00:18:26Z — tức lock trống
  **6m39s (399 s) trước reboot** và không có dòng lock nào
  trong cửa sổ 00:01:21Z → 00:08:00Z. Không có ACQUIRED nào chưa
  release tại thời điểm #71, không có dòng STALE-LOCK mới nào
  sau #71 (STALE-LOCK vẫn 12 — ca mới nhất là ca #68 lúc
  19:16:47Z 21/11, TRƯỚC #71), still held = 0 lúc T6-167 mở, lock
  TRỐNG xác minh độc lập lúc mở 02:38Z.
  **Kết luận: #71 không giết holder nào — verdict sạch
  (khoảng trống 399 s — ngắn nhất trong chuỗi mới kể từ #69,
  nhưng bằng chứng vẫn đầy: chu kỳ cuối RELEASED sạch
  00:01:21Z và không một dòng ACQUIRED nào sau đó tới lúc
  T6 mở; không có holder nào tồn tại trong cửa sổ chứa #71).**
- **REBOOT #72 (btime 02:05:05Z 22/11, boot `9e089ef6`) —
  KHÔNG giết holder nào (PHÁT HIỆN MỚI CỦA T6-167):**
  dòng lock cuối trước reboot là t8-round166 RELEASED
  00:39:30Z (hold 231 s); dòng đầu sau reboot: KHÔNG CÓ
  (0 dòng log sau 00:39:30Z tới lúc T6-167 mở) — tức lock
  trống **1h25m35s (5.135 s) trước reboot**. Không có
  ACQUIRED nào chưa release tại thời điểm #72, 0 STALE-LOCK
  mới sau #72.
  **Kết luận: #72 không giết holder nào — verdict sạch
  (khoảng trống 5.135 s — dài hơn #70 đúng 3.514 s, bằng chứng
  DÀY; chu kỳ cuối RELEASED sạch 00:39:30Z).**
- **REBOOT #73 (btime 02:28:01Z 22/11, boot `b643911f` —
  số hiệu CHƯA được T6 chứng nhận, thuộc T0-167) —
  KHÔNG giết holder nào (PHÁT HIỆN MỚI CỦA T6-167):**
  dòng lock cuối trước reboot là t8-round166 RELEASED
  00:39:30Z (hold 231 s) — cùng dòng cuối như #72; dòng đầu
  sau reboot: KHÔNG CÓ (0 dòng log sau 00:39:30Z tới lúc
  T6-167 mở) — tức lock trống **1h48m31s (6.511 s) trước
  reboot**. Không có ACQUIRED nào chưa release tại thời
  điểm #73, 0 STALE-LOCK mới sau #73.
  **Kết luận: #73 không giết holder nào — verdict sạch
  (khoảng trống 6.511 s — DÀI NHẤT kể từ #66, vượt #70
  (1.621 s) đúng 4.890 s và vượt #72 (5.135 s) đúng 1.376 s;
  bằng chứng DÀY nhất kể từ #66. Lưu ý trung thực: vẫn ngắn
  hơn #61 (7.044 s) và #65 (6.986 s) — không phải dài nhất
  tuyệt đối trong chuỗi #61+.)**
- **File cooldown mới kể từ T6-166 đóng:
  `cooldown-t8-round166` (mtime 00:39:30Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 166 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 279 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 9 chu kỳ hoàn tất
  kể từ T6-166 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 270 chu kỳ T6-166 đã đếm = **279 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (270 đợt
    166 + 9 đợt này). Chu kỳ bị #68 giết KHÔNG tính
    vào số hoàn tất (nó là bằng chứng reboot giết holder,
    không phải lỗi thứ tự ghi — STALE-LOCK thu hồi đúng).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1937 dòng chính thức lúc kiểm cuối, 545 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — bản đã lọc
= raw trừ đúng 6 dòng đó, lọc bằng `awk '$2!="tA" &&
$2!="tH"'` — cột owner là $2, bài học F-162-T6-1;
diff bản đã lọc mở/đóng/final giống nhau hoàn toàn — 0 dòng
mới trong phiên, §2; analyzer chạy trên bản đã lọc).
Bản đã lọc lúc đóng: **1937 dòng** (raw 1943) — **+32 dòng
kể từ T6-166 đóng** (1905 → 1937; 32 trước phiên + 0 trong
phiên, đều đã đối chiếu §2). Kiểm cuối sau
prune (02:48Z 22/11): bản đã lọc **1937 dòng** (raw 1943),
RELEASED 545, cặp 545, đang giữ 0, double-acquire 12 —
prune không đụng log nên số kiểm cuối = số lúc đóng = số lúc mở.

| Chỉ số (bản đã lọc) | T6-165 đóng | T6-166 đóng | T6-167 mở | T6-167 đóng (snapshot) | Δ trong phiên T6-167 |
|---|---|---|---|---|---|
| Tổng dòng | 1873 | 1905 | 1937 | 1937 | +0 |
| TICKET | 550 | 559 | 568 | 568 | +0 |
| ACQUIRED | 539 | 548 | 557 | 557 | +0 |
| RELEASED | 527 | 536 | 545 | 545 | +0 |
| COOLDOWN | 234 | 239 | 244 | 244 | +0 |
| STALE-LOCK | 12 | 12 | 12 | 12 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 527 | 536 | 545 | 545 | +0 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 | — |
| Double-acquire | 11 | 12 | 12 | 12 | 0 mới trong phiên |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 557 / RELEASED 545, 545 cặp.** Các số 548/536
  là kiểm cuối đợt 166 (không phải đợt này); 539/527 là
  kiểm cuối đợt 165. Bảng trên dùng đúng ba số này (đã đối
  chiếu với bảng §4 của LIMITS T6-165 và T6-166 — cả hai tự
  nó đúng).
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối (sau
  prune):** ACQUIRED 557 − RELEASED 545 = 12
  ACQUIRED chưa release trong lịch sử log — nhưng cả 12 đều
  đã được xử lý: 11 ca cũ (10 ca double-acquire cũ + 1 ca
  t8-round159 03:12:16Z STALE-LOCK thu hồi holder bị #60 giết
  — §8 đợt 160) + 1 ca t4 19:16:47Z (STALE-LOCK thu hồi holder
  bị #68 giết — §2 đợt 165). Analyzer xác nhận `still held
  at end of log: 0` ở cả ba snapshot mở/đóng/kiểm cuối. Lock
  TRỐNG lúc mở, lúc đóng và lúc kiểm cuối — status
  xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 12 — 0 ca mới kể từ T6-166 đóng,
  0 ca mới trong phiên T6-167.** Ca mới nhất vẫn là
  analyzer dòng 1843 (bản đã lọc — t4 ACQUIRED 19:16:47Z sau
  STALE-LOCK cùng giây, thu hồi holder bị #68 giết — §2 đợt 165).
  **Kết luận: 0 double-acquire THẬT mới.** STALE-LOCK GIỮ 12 —
  0 ca mới (ca mới nhất vẫn 19:16:47Z, thu hồi #68).
  **Hai con số là CÙNG MỘT sự kiện thu hồi #68, không phải hai
  sự kiện riêng** (nhắc lại từ đợt 160/161/162/163/164/165/166,
  quyết (v) đợt 162, quyết (r) đợt 163).
- **0 double-acquire mới** kể từ T6-166 đóng. 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (9 chu kỳ mới sạch kể từ T6-166 đóng,
  0 chu kỳ dở dang ngoài ca bị #68 giết đã thu hồi),
  0 zombie lúc đóng, 0 stale mới trong phiên, queue 0 ticket,
  log nhất quán (545 cặp + 0 đang giữ lúc kiểm cuối, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–167 (toàn đợt) và đợt 167 (tới ~02:48Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **279 chu kỳ thật** chứng minh (§3).
  Caveat còn lại: **reboot #68 GIẾT HOLDER t4**
  (xem §2/§8 — chuỗi "không giết holder" đứt tại #68);
  **reboot #69 KHÔNG giết holder** (khoảng trống 451 s);
  **reboot #70 KHÔNG giết holder** (khoảng trống 1.621 s);
  **reboot #71 KHÔNG giết holder** (khoảng trống 399 s);
  **reboot #72 KHÔNG giết holder** (khoảng trống 5.135 s);
  **reboot #73 KHÔNG giết holder** (khoảng trống 6.511 s —
  dài nhất kể từ #66, xem §2);
  reboot #60 ĐÃ giết holder t8-round159 là sự kiện đợt
  160, đã ghi nhận (cơ chế STALE-LOCK đã reclaim đúng —
  nay #68 lặp lại đúng mẫu đó).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166 §6.2.
  File khối T7 đã trích `t7-block-a167.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163, 164, 165 và 166 (cùng md5). Harness đợt này chạy đúng code (A)
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
- `bash -n` harness t7-control-a167.sh: OK (bản sao của
  t7-control-a166.sh, chỉ đổi hậu tố a166 → a167 + sửa
  comment "đợt 166" → "đợt 167").
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–166 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ mười bảy liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~02:39–02:41Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 21/21/21/22/
25/22 s — tương đương đợt 166: 22/24/25/22/27/30 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào do 6 lượt chạy (0 dòng mới trong
phiên đều là của T6, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round167-t6/t7-control-a167.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot b643911f (#73 theo
brief, btime 02:28:01Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a167.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165 và 166; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a167-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 568 ms, max 3457 ms, trung bình 1869,13 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~6'49" (02:41:05–02:47:54Z).
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
| **(A), đợt 165 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 166 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 167 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau mười sáu đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ mười bảy liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 2040/2040 dưới churn qua 17 đợt). Chú thích tỉ lệ
  (như T6-150–166): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 16 (đợt 166) → **17 (đợt
  167 — lần thứ mười bảy xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 48 (đợt 166) → **49 (đợt 167,
  6/6 lượt 9/9)**.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 1 FILE (ĐIỀU (b) KÍCH HOẠT) — KHÔNG PHẢI CHỜ LOCK

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
  - 02:38Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-166 thêm `cooldown-t8-round166`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt` — T6-167 không ghi file
    riêng; số 0 này đo trực tiếp lúc mở và lúc đóng, xem
    §12 F-167-T6-4) — điều (a) không kích hoạt.
  - Lock TRỐNG lúc mở (02:38Z), TRỐNG lúc snapshot
    đóng (02:48Z) và TRỐNG ngay trước prune
    (`status-before-prune.txt`) — **prune KHÔNG PHẢI CHỜ**
    (khác đợt 166 phải chờ T4-166 tới 23:51:17Z; giống đợt
    161–165 không phải chờ). Điều (e) thỏa ngay.
  - 02:48:28Z 22/11 (epoch 1795315708): điều (b) KÍCH HOẠT:
    tổng vẫn 101 > 100 → xóa 1 file cũ nhất tới khi còn 100.
    File cũ nhất: **`cooldown-t2`, mtime
    2026-11-15T12:12:14.083683342Z, 158,60h tuổi lúc xóa**
    (≥48h — thỏa điều kiện không xóa file <48h; không phải
    file đợt hiện tại hay đợt ngay trước — file cooldown cũ
    từ 15/11, không thuộc đợt 166/167). Xác định "cũ nhất"
    bằng mtime chính xác tới nano-giây: `cooldown-t2`
    12:12:14.083683342Z, sớm hơn file kế tiếp
    `cooldown-t3-round118` 12:26:13.196674567Z đúng ~13m59s
    (xem §12 F-164-T6-3 — lần này hai file không cùng mtime tới giây,
    không cần ns để phân biệt, nhưng vẫn dùng ns cho chắc).
    Tuổi tính từ đúng epoch giờ prune trong `prune-time.txt`
    (bài học F-164-T6-1; xem F-167-T6-3 về đính chính 10 s).
  - **Kết quả prune đợt 167 (lần 42): 1 file đã xóa
    (`cooldown-t2`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (02:38Z) **101 file / 1414 byte**;
  lúc snapshot đóng (02:48Z, trước khi prune) **101 file /
  1414 byte** (log lock +0 dòng trong phiên, không thêm
  file cooldown mới);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (02:48Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-166 đóng: 100 + 1 file mới
  (`cooldown-t8-round166`) = 101 ✓ — khớp đúng số T10-166 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 70 file; ≥48h (`-mtime +1`): 83
  file**. Sau prune (02:48Z): **≥192h: 0 file; ≥72h:
  69 file; ≥48h: 82 file** — ≥72h giảm 70 → 69 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t3-round118`, mtime 2026-11-15T12:26:13Z —
  lúc 02:48Z mới **~158,37h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 70, tăng 1 so với lúc
  mở đợt 166 (69) — 1 file vượt mốc 72h trong khoảng ~3h giữa
  hai lần mở; khớp số học, không phải lỗi đếm.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ mười tám liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt 156 xóa
  `cooldown-s3-round116`, đợt 157 xóa
  `cooldown-s10-round116`, đợt 158 xóa `cooldown-t6`,
  đợt 159 xóa `cooldown-t8-round117`, đợt 160 xóa
  `cooldown-t4-hold`, đợt 161 xóa `cooldown-t4-wc`,
  đợt 162 xóa `cooldown-t3-round117`, đợt 163 xóa
  `cooldown-t10-round117`, đợt 164 xóa
  `cooldown-t1-smoke-a`, đợt 165 xóa
  `cooldown-t1-smoke-hold`, đợt 166 xóa
  `cooldown-t1-smoke-wl`, đợt này xóa
  `cooldown-t2` trước khi nó đủ 7 ngày — nó đủ
  7 ngày theo đồng hồ tường vào khoảng
  **22/11 12:12Z** nhưng đã bị xóa ở đợt 167, sớm ~9,40h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
  **Kiểm số lần nối lại cẩn thận (brief giao dặn):** LIMITS
  T6-166 §7 đã đếm "lần thứ mười bảy" (đợt 150–166 nối liên
  tiếp); đợt này là **lần thứ mười tám** — KHÔNG lặp lỗi
  brief đợt 165 ghi sai "lần thứ 10".
- **Prune lần 43 (T6-168): tổng lock 100 sau prune 42 —
  kiểm lại lúc mở đợt 168** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t3-round118` đủ 7 ngày ~22/11 12:26Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-167; #71/#72/#73 KHÔNG GIẾT HOLDER; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **b643911f** (btime
  02:28:01Z = epoch 1795314481). T6 **KHÔNG tự chứng nhận**
  số hiệu reboot #73 (thuộc T0-167/T2-167 — lúc T6 mở
  chưa có cờ `round167-t0.done` trên đĩa; thư mục
  `round167-t0/` đã có mặt nhưng chưa có cờ lúc T6 kiểm).
- Uptime boot lúc đóng ~20'. `journal --list-boots`
  chỉ 1 dòng b643911f (first entry 02:28:13Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~02:48Z, boot_id giống lúc mở; kiểm
  lại sau prune, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  02:48:05Z vs local 02:48:03Z — chênh ~2 s (trong đó có
  độ trễ fetch; lúc mở chênh ~1 s). Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 167
  đọc trực tiếp được.
- **REBOOT #71 (btime 00:08:00Z, boot `ea73ac4f`) —
  KHÔNG giết holder** (§2): lock trống 6m39s trước btime
  (RELEASED cuối 00:01:21Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới. **Verdict sạch.**
  **REBOOT #72 (btime 02:05:05Z, boot `9e089ef6`) —
  KHÔNG giết holder** (§2): lock trống 1h25m35s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới. **Verdict sạch, bằng chứng DÀY.**
  **REBOOT #73 (btime 02:28:01Z, boot `b643911f` — số hiệu
  chưa được T6 chứng nhận) — KHÔNG giết holder** (§2):
  lock trống 1h48m31s trước btime (RELEASED cuối 00:39:30Z);
  0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch, bằng chứng DÀY NHẤT kể từ #66 (6.511 s).**
  **Chuỗi "không giết holder" MỚI bắt đầu lại từ #69: 5 reboot
  (#69, #70, #71, #72, #73).**
- **REBOOT #70 (btime 22:05:25Z 21/11, boot `d1ddd946`) —
  KHÔNG giết holder** (§2 đợt 166, T6-167 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 27m01s trước btime
  (RELEASED cuối 21:38:24Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #69 (btime 20:09:31Z 21/11, boot `9a1a9319`) —
  KHÔNG giết holder** (§2 đợt 165): lock trống 7m31s trước btime
  (RELEASED cuối 20:02:00Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #68 (btime 18:06:30Z 21/11, boot `0c8a94aa`) —
  GIẾT HOLDER t4** (§2 đợt 165): ACQUIRED 18:04:38Z, btime 112 s
  sau khi giữ; 0 RELEASED cho ticket đó; STALE-LOCK thu hồi
  19:16:47Z (tuổi 4329 s, "boot đổi") + re-ACQUIRED cùng giây.
  **Chuỗi "không giết holder" 7 reboot liên tiếp (#61–#67)
  ĐỨT TẠI #68 — reboot thứ ba giết holder (#50, #60, #68).**
  T6 không phán mù cho #68/#69/#70/#71/#72/#73 — giao T2-167.
- **Watcher-166 chết theo reboot #71** (aggregate 166 §12.3 (j)
  ghi nhận — T8 phát hiện, T10 xác minh độc lập nhãn stale
  00:08:20Z; không mâu thuẫn T5/T8, chỉ khác thời điểm kiểm).
  T5-167 sở hữu POSTBOOT_PASS #71/#72/#73 + watcher-167.
  **POSTBOOT_PASS #68 CHƯA CÓ lúc T10-166 đóng** (T5-166 sở hữu —
  boot thứ 9 không cờ); **POSTBOOT_PASS #71/#72 CHƯA CÓ lúc
  T10-166 đóng** (T5-167 sở hữu — kiểm tra lúc mở đợt 167).
- **Nhắc lại #60/#61/#62/#63/#64/#65/#66/#67 (để đối chiếu):** #60 ĐÃ
  giết holder t8-round159 (lần thứ 2 reboot giết holder,
  sau #50); cơ chế STALE-LOCK thu hồi đúng. #61 KHÔNG
  giết holder (lock trống 1h57m24s trước btime). #62 KHÔNG
  giết holder (lock trống 1h28m01s trước btime — quyết
  parent (w) đợt 161). #63 KHÔNG giết holder (lock trống
  10m34s trước btime — T6-162 chứng nhận bổ sung). #64
  KHÔNG giết holder (lock trống 55m10s trước btime —
  quyết parent (v) đợt 162). #65 KHÔNG giết holder (lock
  trống 1h56m26s trước btime — quyết parent (r) đợt 163).
  #66 KHÔNG giết holder (lock trống 7m47s trước btime —
  T6-164 kiểm chứng lần đầu). #67 KHÔNG giết holder (lock
  trống 1h34m29s trước btime — T6-164). **#68 GIẾT holder
  t4 (đợt 165 — lần đầu tiên chuỗi đứt kể từ #60). #69 KHÔNG
  giết holder (lock trống 7m31s trước btime — đợt 165).
  #70 KHÔNG giết holder (lock trống 27m01s trước btime — đợt 166).
  #71 KHÔNG giết holder (lock trống 6m39s trước btime — đợt này).
  #72 KHÔNG giết holder (lock trống 1h25m35s trước btime — đợt này).
  #73 KHÔNG giết holder (lock trống 1h48m31s trước btime — đợt này,
  số hiệu chưa được T6 chứng nhận).**

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-167
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (02:48Z 22/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 1943 dòng thô /
  1937 dòng chính thức, 545 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round167-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND167_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round167-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 167 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 167 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–166 (T10-166 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-167).

## 11. GHI CHÚ CHO T10-167 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ mười bảy liên tiếp, tổng 2040/2040 qua 17
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 16 → 17 (lần thứ mười bảy xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 48 → 49 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (545 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); **#71 KHÔNG GIẾT HOLDER (lock trống
  6m39s); #72 KHÔNG GIẾT HOLDER (lock trống 1h25m35s);
  #73 KHÔNG GIẾT HOLDER (lock trống 1h48m31s — dài nhất kể
  từ #66, số hiệu chưa được T6 chứng nhận) — chuỗi
  "không giết holder" mới bắt đầu từ #69: 5 reboot
  (#69, #70, #71, #72, #73).**
  Double-acquire/STALE-LOCK GIỮ 12 — 0 ca mới cả hai (ca mới
  nhất vẫn là thu hồi #68 đợt 165, đừng đếm thành sự kiện mới).
  Prune lần 42 xóa 1 file, queue về đúng trần 100 (**KHÔNG
  PHẢI CHỜ lock** — lock trống suốt phiên; khác đợt 166 phải
  chờ T4-166; +32 dòng kể từ T6-166 đóng đều là của t4 +
  t8-round166, +0 dòng trong phiên T6).
- **Reboot #71/#72/#73 KHÔNG giết holder** (lock trống
  399 s / 5.135 s / 6.511 s trước btime — verdict sạch).
  **#68 GIẾT holder** vẫn là phát hiện của đợt 165 (chuỗi #61–#67 đứt).
  **Đồng hồ ở giờ thật** (Cloudflare ~1 s lúc mở, ~2 s lúc
  đóng, gồm độ trễ fetch). Mù cho #68/#69/#70/#71/#72/#73 giao T2-167.
  **Kiểm cuối đợt này: ACQUIRED 557 / RELEASED 545, 545
  cặp** (đừng mang 548/536 — đó là kiểm cuối đợt 166 —
  vào cột đợt này; bài học (r) đợt 163).
- **Double-acquire GIỮ 12, STALE-LOCK GIỮ 12 — 0 ca mới
  cả hai.** Hai con số vẫn là CÙNG MỘT sự kiện thu hồi #68 —
  T10-167 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng (quyết (v) đợt 162, quyết (r) đợt 163).
- 0 zombie lúc mở và lúc đóng; X11 trống lúc mở (reboot
  #73 đã dọn 3 socket sót đợt 166), 3 socket X193/X194/
  X195 mới lúc đóng (của luồng khác đợt 167, tạo 02:44Z
  — lần thứ tám liên tiếp cùng 3 số display)
  — không phải của T6; T10-167 lưu ý khi đối chiếu log (+32 dòng
  kể từ T6-166 đóng đều là của t4 + t8-round166, +0 dòng trong
  phiên T6, sạch).
- **Inotify: trần `max_user_watches` nay là 63747** (giống
  trần trên #69/#70/#71). Ghi nhận theo quyết (m) đợt 146 (ghi làm chú thích, không
  hành động); T9-167 sở hữu hệ quả headroom nếu có. T6
  không suy đoán nguyên nhân đổi.
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #88? VẪN MỞ; mù #94? MỞ theo quyết (b) đợt 163;
  mù #95? MỞ theo quyết (b) đợt 163; mù #96? MỞ sau điều
  tra đầy đủ đợt 165 — chờ quyết parent §12.1 (m) đợt 165;
  birefnet 0 thử lần 20 (đợt 166); u2net là fallback chính thức;
  POSTBOOT_PASS #68 CHƯA CÓ lúc T10-166 đóng — giao
  T5-167; POSTBOOT_PASS #71/#72 CHƯA CÓ lúc T10-166 đóng —
  giao T5-167; POSTBOOT_PASS #73 CHƯA CÓ — giao T5-167;
  kết cục run 166 + (m) #71/#72 thuộc T7-167/T2-167).
- Cờ `round167-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-167 (F-167-T6-n)

- **F-167-T6-1 — Lệnh `/usr/bin/time` không tồn tại trên VM
  (rc=127) khi chạy 6 lượt suite lần đầu — 6 file
  `run*.time` rỗng được tạo, suite không chạy lần nào.**
  Đã bắt ngay (rc=127 rõ) và chạy lại đúng bằng
  `bash` + `date +%s` (6/6 PASS=9, §6.1); 6 file rỗng đã
  xóa khỏi thư mục làm việc. Không ảnh hưởng kết quả.
  Bài học: kiểm tra `/usr/bin/time` tồn tại trước khi dùng
  — cùng họ F-166-T6-1 (lỗi cú pháp lệnh đầu phiên).
- **F-167-T6-2 — Python `strptime` lỗi `ValueError` với
  mtime 9 chữ số nano-giây (`2026-11-15T12:12:14.083683342Z`)
  khi tính tuổi file prune (Python chỉ nhận tối đa 6 chữ số
  phần thập phân).** Đã bắt ngay (traceback rõ) và tính lại
  bằng cách cắt về micro-giây (tuổi 158,60h, sớm 9,40h —
  xem §7/appendix). Không ảnh hưởng kết quả (sai số cắt
  <1 µs). Bài học: mtime nano-giây phải cắt trước khi
  `strptime`.
- **F-167-T6-3 — `prune-time.txt` ghi 02:48:18Z trong khi
  lệnh `rm` chạy sau phép tính tuổi, ~02:48:28Z (lệch 10 s).**
  Đã bắt khi đối chiếu (epoch trong file không khớp thời
  điểm xóa thực) và sửa cả `prune-time.txt` +
  `prune-deleted.txt` về 02:48:28Z epoch 1795315708 —
  đúng thời điểm đo tuổi/xóa trong cùng một lệnh shell.
  Tuổi 158,60h / sớm 9,40h tính tại 02:48:28Z là đúng.
  Không ảnh hưởng kết quả. Bài học: ghi `prune-time.txt`
  SAU khi `rm`, không ghi trước phép tính tuổi.
- **F-167-T6-4 — T6-167 không ghi file `prune-candidates.txt`
  riêng (khác T6-166 có file này); số ứng viên điều (a) = 0
  chỉ đo trực tiếp bằng `find -mtime +7` lúc mở và lúc đóng
  (cả hai đều 0) và ghi trong §7, không lưu file.**
  Không ảnh hưởng kết quả (số 0 đã đo hai lần độc lập);
  T6-168 ghi lại file này cho đủ bộ bằng chứng như các đợt trước.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a167-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round167-t6/appendix-numbers.txt` giữ bản
trích gốc (tuổi prune tính từ đúng epoch giờ prune trong
`prune-time.txt` — bài học F-164-T6-1; md5 live-code chỉ
tính bằng pipeline shell đứng sau khi bắt lỗi F-164-T6-2):

```
churn: n_runs=120 pass=120 fail=0 B1=1:120 B2=0:120
churn delay_ms: min=568 max=3457 mean=1869.13
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
churn harness: 2026-11-22T02:41:05Z -> 2026-11-22T02:47:54Z (~6m49s), boot b643911f
suite run1: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 secs=22 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 secs=25 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 secs=22 rc=0
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a167.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=557, COOLDOWN=244, RELEASED=545, STALE-LOCK=12, STALE-TICKET=1, TICKET=568, TIMEOUT=10, total=1937
cleaned-open pairs ACQUIRED->RELEASED: 545
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 12
cleaned-close counts: TOTAL: ACQUIRED=557, COOLDOWN=244, RELEASED=545, STALE-LOCK=12, STALE-TICKET=1, TICKET=568, TIMEOUT=10, total=1937
cleaned-close pairs ACQUIRED->RELEASED: 545
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 12
cleaned-final counts: TOTAL: ACQUIRED=557, COOLDOWN=244, RELEASED=545, STALE-LOCK=12, STALE-TICKET=1, TICKET=568, TIMEOUT=10, total=1937
cleaned-final pairs ACQUIRED->RELEASED: 545
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 12
raw log lines open: 1943
raw log lines close: 1943
raw log lines final (after prune check): 1943
new lines since T6-166 close: 32 (all before session, 0 in session)
new lines in T6-167 session: 0
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
queue age bands open: >=192h: 0 files; >=72h: 70 files; >=48h: 83 files
queue age bands post-prune: >=192h: 0 files; >=72h: 69 files; >=48h: 82 files
KHONG-NHA lines in raw log: 0
prune-42 deleted: cooldown-t2 mtime=2026-11-15T12:12:14.083683342Z size=14 age=158.60h rule=(b) at 2026-11-22T02:48:28Z epoch=1795315708 early_by=9.40h
next oldest remaining: cooldown-t3-round118 mtime=2026-11-15T12:26:13.196674567Z
reboot-71 NO HOLDER KILLED: btime 2026-11-22T00:08:00Z boot ea73ac4f; last lock line before btime 2026-11-22T00:01:21Z t4 RELEASED hold_s=258 (lock empty 6m39s = 399s); 0 lines after 00:01:21Z until 00:18:26Z; 0 unreleased owners; 0 new STALE-LOCK; NO holder killed
reboot-72 NO HOLDER KILLED: btime 2026-11-22T02:05:05Z boot 9e089ef6; last lock line before btime 2026-11-22T00:39:30Z t8-round166 RELEASED hold_s=231 (lock empty 1h25m35s = 5135s); 0 lines after 00:39:30Z; 0 unreleased owners; 0 new STALE-LOCK; NO holder killed
reboot-73? NO HOLDER KILLED: btime 2026-11-22T02:28:01Z boot b643911f (number NOT certified by T6 — belongs to T0-167); last lock line before btime 2026-11-22T00:39:30Z t8-round166 RELEASED hold_s=231 (lock empty 1h48m31s = 6511s); 0 lines after 00:39:30Z; 0 unreleased owners; 0 new STALE-LOCK; NO holder killed
reboot-70: btime 2026-11-21T22:05:25Z boot d1ddd946; last lock line before btime 2026-11-21T21:38:24Z t8-round165 RELEASED hold_s=230 (lock empty 27m01s = 1621s); 0 lines after 21:38:24Z; 0 new STALE-LOCK; NO holder killed (reconfirmed)
clock check open: Cloudflare Date 2026-11-22T02:38:16Z vs local 02:38:15Z (~1s incl fetch latency)
clock check close: Cloudflare Date 2026-11-22T02:48:05Z vs local 02:48:03Z (~2s incl fetch latency)
inotify max_user_watches: 63747 (same as #69/#70/#71)
```

---
**Batch stage / Tổng batch:** T6-167: 1 batch / 1 entry / 1 file. Đợt 167 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry (t6). Lũy kế 111–166 (T10-166 đếm dedup toàn cục): T6 không tự cộng tay — chờ T10-167 đếm lại.
