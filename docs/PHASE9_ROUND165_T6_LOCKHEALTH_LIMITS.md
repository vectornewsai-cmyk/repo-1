# PHASE9 ROUND165 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 15 LIÊN TIẾP) + #68 GIẾT HOLDER (ĐỨT CHUỖI #61–#67) + #69 KHÔNG GIẾT HOLDER + prune lần 40: XÓA 1 FILE — LIMITS

- Đợt: 165, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 03:35 +07 22/11/2026 (= 20:35:51Z 21/11). Chạy
  20:38Z → 20:51Z 21/11/2026. Lúc mở đã ở trên boot
  `9a1a9319` (btime 20:09:31Z) — reboot #69 theo brief giao
  và theo T10-164 (phát hiện trong lúc T10-164 đóng sổ);
  T6 KHÔNG tự chứng nhận số hiệu #69, chỉ chứng nhận từ
  log lock rằng #68 GIẾT holder còn #69 KHÔNG giết holder
  (xem §2/§8); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 15 liên tiếp nếu đạt — tổng
  1800/1800); ghi chuỗi xanh kép + chuỗi suite xanh mới;
  (b) lock: chạy lại analyze-log.py trên log final đóng
  băng; kiểm cuối ACQUIRED/RELEASED/cặp/đang giữ/TIMEOUT/
  KHÔNG NHẢ; double-acquire và STALE-LOCK có ca mới
  không? Ghi đúng số kiểm cuối đợt này (đừng nhầm nhãn
  đợt cũ — bài học (r) đợt 163); (c) reboot #68/#69 có
  giết holder không? (lock trống bao lâu trước btime?
  0 dòng log sau mốc nào? 0 STALE-LOCK mới?); (d) prune
  lần 40: kiểm queue lúc mở (kỳ vọng 101 mục), prune 1
  file cũ nhất theo đúng điều kiện đứng (ghi tên file,
  mtime, tuổi, điều nào), queue sau prune; (e) trần
  inotify hiện tại; 0 zombie; X11 lúc mở; đồng hồ
  (Cloudflare ±? s); (f) ghi mọi sai số dạng F-165-T6-N;
  lưu ý F-147-T6-1 (nối lại — T6-164 đếm lần thứ 15,
  kiểm tra còn nối không).
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–164,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–164); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (527 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — NHƯNG double-acquire LÊN 12, STALE-LOCK LÊN 12
  (1 ca mới cả hai — CÙNG MỘT sự kiện: reboot #68 giết holder
  t4, xem §2/§4). Reboot #68 GIẾT HOLDER t4 attempt2-f1d4ce1a
  (ACQUIRED 18:04:38Z, btime #68 18:06:30Z, 112 s sau khi giữ;
  STALE-LOCK thu hồi 19:16:47Z) — chuỗi "không giết holder"
  #61–#67 (7 reboot) ĐỨT TẠI #68. Reboot #69 KHÔNG giết holder
  (lock trống 7m31s trước btime). Prune lần 40: xóa 1 file cũ nhất
  (điều (b)), queue 101 → 100 file — KHÔNG phải chờ luồng
  khác nhả lock đợt này (lock TRỐNG lúc mở, lúc đóng và ngay
  trước prune; 0 dòng log của T6 trong phiên, +3 dòng của
  T4-165 đều sạch).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round165-t6/` (ps-full-open.txt,
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
  new-lines-since-t6-164.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt, harness-start.txt,
  harness-end.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  status-final.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a165.sh,
  t7-block-a165.sh,
  t7-a165-churn.log, t7-control-a165.stdout.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 9a1a9319 (#69, btime 20:09:31Z); lock TRỐNG; queue 101 file (khớp T10-164 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `9a1a9319-3786-4add-8ffa-c51a1027946e`, btime 20:09:31Z
  theo /proc/stat** (epoch 1795291771; `uptime -s` =
  20:09:31; `journal --list-boots` chỉ 1 dòng 9a1a9319,
  first entry 20:09:42Z). Uptime ~29' lúc T6 bắt đầu
  (20:38Z), ~41' lúc snapshot đóng (20:50Z). Boot này là
  #69 theo brief giao và theo T10-164 (phát hiện trong lúc
  T10-164 đóng sổ, btime 20:09:31Z, gap #68→#69 = 7.381 s)
  — **T6 KHÔNG tự chứng nhận số hiệu #69** (thuộc T0-165/T2-165);
  T6 chỉ chứng nhận từ log lock rằng #68 GIẾT holder còn
  #69 KHÔNG giết holder (xem §2/§8).
  **KHÔNG có reboot trong phiên T6** (boot_id giống nhau
  lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sat, 21 Nov 2026 20:38:49 GMT` vs local 20:38:47Z
  (**chênh ~2 s — đồng hồ ở giờ thật**, trong đó có độ trễ
  fetch curl ~1–2 s); lúc đóng Cloudflare 20:50:25Z vs
  local 20:50:23Z (chênh ~2 s — cùng họ lúc mở, không phải
  lệch đồng hồ). Các mốc wall đợt 165 đọc trực tiếp được.
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
  từ T10-164 đóng: 100 sau prune 39 + 1 file cooldown mới
  `cooldown-t8-round164`, mtime 20:02Z (§2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật lúc mở và lúc đóng; X11 trống lúc mở, 3 socket luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 20:38Z
  (mở, `ps-full-open.txt`) và lúc 20:50Z
  (đóng, `ps-full-close.txt`).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở và lúc đóng: 0 vite thật đang chạy** —
  `ss -tlnp` trống hoàn toàn cả hai snapshot; dòng duy nhất
  chứa chuỗi "vite" trong snapshot ps lúc đóng là lệnh
  exec của chính T4-165 (preflight chứa chuỗi "vite.lock"
  trong văn bản — không phải process vite; cùng bẫy tự-tham-chiếu
  như đợt 155–164). Lúc mở 1 dòng vite cũng là lệnh snapshot
  của chính T6.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #69 đã dọn
  sạch 3 socket X193/X194/X195 của đợt 164 — T8-164 đã xác
  nhận `/tmp/.X11-unix/` TRỐNG lúc T10-164 đóng).
  **Lúc đóng: 3 socket X193 / X194 / X195, tạo 20:46Z** —
  của T4-165 (khởi động Xvfb trong phiên; T6 không khởi động
  Xvfb/vite nào, không đụng tới các process này, không kill
  process nào trong phiên này). Đây là lần thứ sáu liên tiếp
  cùng 3 số display X193/X194/X195 — xem quyết (bb) đợt 163.
  Process luồng khác lúc đóng: T4-165 đang chạy poller
  (preflight 20:40Z, poller start sau đó — thấy trong ps
  lúc đóng).
- **Watcher-165: T6 không thấy watcher nào lúc mở/đóng**
  (T5-165 sở hữu — watcher-164 đã chết theo reboot #68,
  xem aggregate 164 §10.5 (ix); T6 không khởi động watcher nào).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-165).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (~20:38Z và ~20:50Z) — **GIỐNG trần trên #66**
  (theo T9-163); khác 63756 trên #67 (T6-164 đo) — xem §11,
  ghi nhận, không hành động.
- Tải hệ thống trong phiên: các luồng đợt 165 khởi động
  dần (T4-165 poller) — harness churn vẫn 120/120 (xem §6).
  Suite đợt này chạy 21–33 s/lượt (tương đương đợt 164:
  28–38 s/lượt).

## 2. Lock lúc mở: TRỐNG; +35 dòng kể từ T6-164 đóng — TẤT CẢ CỦA t4 + t8-round164, TRƯỚC phiên T6; #68 GIẾT HOLDER (PHÁT HIỆN MỚI)

- **Lúc mở (20:38Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (20:50Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`
  (trước prune), rc=0. Prune KHÔNG phải chờ (xem §7).
- **Log lock +35 dòng kể từ T6-164 đóng** (raw 1841 lúc
  T6-164 đóng → 1876 lúc T6-165 mở → 1879 lúc snapshot
  đóng): 35 dòng đều trước phiên T6; **+3 dòng trong
  phiên T6-165 — đều của T4-165, sạch** (TICKET+ACQUIRED
  20:42:07Z, RELEASED 20:46:13Z hold 246 s — chu kỳ hoàn
  tất đầu tiên trên boot #69; xem §2 cuối). **0 dòng của
  chính T6 trong phiên** (suite chạy trên log riêng trong
  /tmp — giống đợt 164).
- Đối chiếu 35 dòng (khớp đúng từng dòng, file
  `new-lines-since-t6-164.txt`, dòng thô 1842–1876):
  - t4: 9 dòng — attempt1-f1d4ce1a hoàn tất (TICKET+ACQ
    18:00:11Z → RELEASED 18:03:52Z, hold 221 s);
    attempt2-f1d4ce1a TICKET+ACQ 18:04:38Z — **BỊ #68 GIẾT**
    (xem dưới); attempt2-0c8a94aa TICKET 19:16:47Z +
    STALE-LOCK 19:16:47Z + ACQ 19:16:47Z → RELEASED
    19:20:22Z, hold 215 s (chu kỳ hoàn tất sau thu hồi).
  - t8-round164: 26 dòng — 7 chu kỳ bắt đầu (19:29:54Z →
    19:58:09Z); **7 chu kỳ HOÀN TẤT** (holds 182 / 70 /
    902 / 241 / 71 / 130 / 230 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14925–14952 ms trên cổng 5490/5390, lần
    đầu không COOLDOWN); 0 chu kỳ dở dang. Chu kỳ hold
    902 s (19:34:45Z → 19:49:47Z) là pha dài nhất trong 7
    chu kỳ — trùng cửa sổ harness T8-164 (kẹt 85m4) — lock
    vẫn RELEASED bình thường sau đó, không bị giết.
  - Tổng: Δ TICKET +10, Δ ACQUIRED +10, Δ RELEASED +9,
    Δ COOLDOWN +5, Δ STALE-LOCK +1, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **9/10 chu kỳ mới hoàn
    tất sạch; 1 chu kỳ bị reboot #68 giết.**
- **REBOOT #68 (btime 18:06:30Z, boot `0c8a94aa`) —
  GIẾT HOLDER t4 (PHÁT HIỆN MỚI CỦA T6-165 — T6-164
  đóng 17:54Z, TRƯỚC #68 nên không thể thấy):**
  t4 ACQUIRED 18:04:38Z (ticket `...-38955-t4`, pid 38955,
  port 5187, wait 0 s) — attempt2-f1d4ce1a của T4-164
  (aggregate 164 §4: attempt2-f1d4ce1a "BỊ #68 GIẾT giữa
  chừng"). Btime #68 18:06:30Z rơi vào **112 s sau khi
  giữ lock**. **KHÔNG có dòng RELEASED nào cho ACQUIRED
  này trong toàn bộ log** (RELEASED chỉ +9 trong khi
  ACQUIRED +10 — đúng 1 chu kỳ thiếu RELEASED).
  19:16:47Z t4 attempt2-0c8a94aa (boot #68) ghi STALE-LOCK:
  "owner pid 38955 chết + không vite trên cổng 5187 +
  curl 000 + boot đổi (tuổi 4329s)" — tuổi 4329 s =
  18:04:38Z → 19:16:47Z, khớp từng giây — rồi ACQUIRED lại
  cùng giây (double-acquire #12, xem §4) và RELEASED sạch
  19:20:22Z (hold 215 s). **Cơ chế STALE-LOCK đã thu hồi
  đúng** — cùng chữ ký #60 (t8-round159, đợt 160).
  **Kết luận: #68 GIẾT holder — đây là reboot thứ ba giết
  holder (#50, #60, #68). Chuỗi "không giết holder" 7
  reboot liên tiếp (#61–#67) ĐỨT TẠI #68.** T10-165 phán
  cuối; T7-165/T2-165 đối chiếu (m) #68 từ phía scheduler.
  Caveat: T6 không tự chứng nhận số hiệu/btime #68 (thuộc
  T0-165/T2-165 — T0-164/T7-164 đã ghi btime 18:06:30Z,
  gap #67→#68 = 1.983 s); verdict "giết holder" KHÔNG phụ
  thuộc vào số hiệu reboot: ACQUIRED 18:04:38Z chưa release
  + STALE-LOCK "boot đổi" 19:16:47Z + 0 RELEASED cho ticket
  đó là đủ.
- **REBOOT #69 (btime 20:09:31Z, boot `9a1a9319`) —
  KHÔNG giết holder nào:** dòng lock cuối trước reboot là
  t8-round164 RELEASED 20:02:00Z (hold 230 s, số học khớp);
  dòng đầu sau reboot: KHÔNG CÓ (0 dòng log sau 20:02:00Z
  tới lúc T6-165 mở) — tức lock trống **7m31s (451 s)
  trước reboot** và không có dòng lock nào sau 20:02:00Z.
  Không có ACQUIRED nào chưa release tại thời điểm #69,
  không có dòng STALE-LOCK mới nào sau #69 (STALE-LOCK
  vẫn 12 — ca mới nhất là ca #68 lúc 19:16:47Z, TRƯỚC #69),
  still held = 0 lúc T6-165 mở, lock TRỐNG xác minh độc
  lập lúc mở 20:38Z.
  **Kết luận: #69 không giết holder nào — verdict sạch
  (khoảng trống 451 s — ngắn nhất chuỗi kể từ #66 với 467 s;
  ngắn hơn #66 đúng 16 s, bằng chứng mỏng hơn nhưng vẫn đầy
  đủ: chu kỳ cuối RELEASED sạch 20:02:00Z và không một dòng
  ACQUIRED nào sau đó tới lúc T6 mở; không có holder nào tồn
  tại trong cửa sổ chứa #69).**
- **File cooldown mới kể từ T6-164 đóng:
  `cooldown-t8-round164` (mtime 20:02Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 164 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 261 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 10 chu kỳ hoàn tất
  kể từ T6-164 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2: 9 chu kỳ
  trước phiên T6 + 1 chu kỳ t4-165 trong phiên).
  - Cộng với 251 chu kỳ T6-164 đã đếm = **261 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (251 đợt
    164 + 10 đợt này). Chu kỳ bị #68 giết KHÔNG tính
    vào số hoàn tất (nó là bằng chứng reboot giết holder,
    không phải lỗi thứ tự ghi — STALE-LOCK thu hồi đúng).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1873 dòng chính thức lúc kiểm cuối, 527 cặp, 0 đang giữ, double-acquire LÊN 12, STALE-LOCK LÊN 12, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — bản đã lọc
= raw trừ đúng 6 dòng đó, lọc bằng `awk '$2!="tA" &&
$2!="tH"'` — cột owner là $2, bài học F-162-T6-1;
diff bản đã lọc mở/đóng chỉ khác 3 dòng t4-165, §2; analyzer chạy
trên bản đã lọc).
Bản đã lọc lúc đóng: **1873 dòng** (raw 1879) — **+38 dòng
kể từ T6-164 đóng** (1835 → 1873; 35 trước phiên + 3 trong
phiên, đều đã đối chiếu §2). Kiểm cuối sau
prune (20:51Z 21/11): bản đã lọc **1873 dòng** (raw 1879),
RELEASED 527, cặp 527, đang giữ 0, double-acquire 12 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-163 đóng | T6-164 đóng | T6-165 mở | T6-165 đóng (snapshot) | Δ trong phiên T6-165 |
|---|---|---|---|---|---|
| Tổng dòng | 1802 | 1835 | 1870 | 1873 | +3 (t4-165) |
| TICKET | 530 | 539 | 549 | 550 | +1 (t4-165) |
| ACQUIRED | 519 | 528 | 538 | 539 | +1 (t4-165) |
| RELEASED | 508 | 517 | 526 | 527 | +1 (t4-165) |
| COOLDOWN | 223 | 229 | 234 | 234 | +0 |
| STALE-LOCK | 11 | 11 | 12 | 12 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 508 | 517 | 526 | 527 | +1 (t4-165) |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 | 0 |
| Double-acquire | 11 | 11 | 12 | 12 | 0 mới trong phiên |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 539 / RELEASED 527, 527 cặp.** Các số 528/517
  là kiểm cuối đợt 164 (không phải đợt này); 519/508 là
  kiểm cuối đợt 163. Bảng trên dùng đúng ba số này (đã đối
  chiếu với bảng §4 của LIMITS T6-163 và T6-164 — cả hai tự
  nó đúng).
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối:**
  ACQUIRED 539 − RELEASED 527 = 12 ACQUIRED chưa release
  trong lịch sử log — nhưng cả 12 đều đã được xử lý: 11 ca
  cũ (10 ca double-acquire cũ + 1 ca t8-round159 03:12:16Z
  STALE-LOCK thu hồi holder bị #60 giết — §8 đợt 160) +
  1 ca MỚI t4 19:16:47Z (STALE-LOCK thu hồi holder bị #68
  giết — §2 đợt này). Analyzer xác nhận `still held at end of
  log: 0` ở cả ba snapshot (mở/đóng/kiểm cuối). Lock
  TRỐNG lúc mở và lúc đóng — status xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE LÊN 12 — 1 ca mới kể từ T6-164 đóng,
  0 ca mới trong phiên T6-165.** Ca mới nhất là
  analyzer dòng 1843 (bản đã lọc — dòng 1843 bản thô là
  t4 ACQUIRED 19:16:47Z sau STALE-LOCK cùng giây
  (thu hồi holder bị #68 giết, đã giải thích §2).
  **Kết luận: 0 double-acquire THẬT mới ngoài ca thu hồi
  #68.** T10-165 lưu ý khi đối chiếu: số "12" của
  analyzer gồm 11 ca cũ + 1 artifact thu hồi #68;
  STALE-LOCK "12" cũng gồm 11 ca cũ + 1 ca thu hồi #68 —
  **hai con số là CÙNG MỘT sự kiện, không phải hai sự
  kiện riêng** (nhắc lại từ đợt 160/161/162/163/164, quyết (v) đợt 162,
  quyết (r) đợt 163).
- **0 double-acquire mới** kể từ T6-164 đóng (theo nghĩa
  cơ chế, ngoài ca thu hồi #68). 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (10 chu kỳ mới sạch kể từ T6-164 đóng,
  0 chu kỳ dở dang ngoài ca bị #68 giết đã thu hồi),
  0 zombie lúc đóng, 0 stale mới trong phiên, queue 0 ticket,
  log nhất quán (527 cặp + 0 đang giữ lúc kiểm cuối, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–165 (toàn đợt) và đợt 165 (tới ~20:51Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **261 chu kỳ thật** chứng minh (§3).
  Caveat còn lại: **reboot #68 GIẾT HOLDER t4**
  (xem §2/§8 — chuỗi "không giết holder" đứt tại #68);
  **reboot #69 KHÔNG giết holder** (khoảng trống 451 s —
  ngắn nhất chuỗi kể từ #66, verdict sạch nhưng mỏng hơn);
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
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164 §6.2.
  File khối T7 đã trích `t7-block-a165.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163 và 164 (cùng md5). Harness đợt này chạy đúng code (A)
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
- `bash -n` harness t7-control-a165.sh: OK (bản sao của
  t7-control-a164.sh, chỉ đổi hậu tố a164 → a165 + sửa
  comment "đợt 164" → "đợt 165").
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–164 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ mười lăm liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~20:40–20:43Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 25/25/21/29/
33/30 s — tương đương đợt 164: 33/38/36/32/28/32 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào do 6 lượt chạy (0 dòng mới trong
phiên đều là của T6, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round165-t6/t7-control-a165.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 9a1a9319 (#69,
btime 20:09:31Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a165.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163 và 164; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a165-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 591 ms, max 3499 ms, trung bình 1903,46 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~6'53" (20:43:19–20:50:12Z).
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

- **Kết luận: (A) VẪN XANH sau mười bốn đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ mười lăm liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 1800/1800 dưới churn qua 15 đợt). Chú thích tỉ lệ
  (như T6-150–164): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 14 (đợt 164) → **15 (đợt
  165 — lần thứ mười lăm xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 46 (đợt 164) → **47 (đợt 165,
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
  - 20:38Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-164 thêm `cooldown-t8-round164`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG lúc mở (20:38Z) VÀ vẫn TRỐNG lúc snapshot
    đóng (20:50Z) VÀ vẫn TRỐNG ngay trước prune
    (`status-before-prune.txt`) — điều (e) thỏa ngay,
    **prune KHÔNG phải chờ** (giống đợt 161/162/163/164). T6 xác minh lại TRỐNG
    ngay trước prune (20:50Z).
  - 20:50:46Z 21/11 (epoch 1795294246): điều (b) KÍCH HOẠT:
    tổng vẫn 101 > 100 → xóa 1 file cũ nhất tới khi còn 100.
    File cũ nhất: **`cooldown-t1-smoke-hold`, mtime
    2026-11-15T11:39:49.466698323Z, 153,18h tuổi lúc xóa**
    (≥48h — thỏa điều kiện không xóa file <48h; không phải
    file đợt hiện tại hay đợt ngay trước — file smoke test cũ
    từ 15/11, không thuộc đợt 164/165). Xác định "cũ nhất"
    bằng mtime chính xác tới nano-giây: `cooldown-t1-smoke-hold`
    11:39:49.466698323Z, sớm hơn file kế tiếp
    `cooldown-t1-smoke-wl` 11:39:49.777698321Z đúng
    0,31 s (cả hai file smoke cùng mtime tới giây —
    phải dùng ns mới phân biệt được; xem §12 F-164-T6-3).
    Tuổi tính từ đúng epoch giờ prune trong `prune-time.txt`
    (bài học F-164-T6-1).
  - **Kết quả prune đợt 165 (lần 40): 1 file đã xóa
    (`cooldown-t1-smoke-hold`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (20:38Z) **101 file / 1414 byte**;
  lúc snapshot đóng (20:50Z, trước khi prune) **101 file /
  1414 byte** (log lock +3 dòng của T4-165 trong phiên, không thêm
  file cooldown mới);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (20:51Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-164 đóng: 100 + 1 file mới
  (`cooldown-t8-round164`) = 101 ✓ — khớp đúng số T10-164 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 68 file; ≥48h (`-mtime +1`): 82
  file**. Sau prune (20:51Z): **≥192h: 0 file; ≥72h:
  67 file; ≥48h: 81 file** — ≥72h giảm 68 → 67 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t1-smoke-wl`, mtime 2026-11-15T11:39:49Z —
  lúc 20:51Z mới **~153,19h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 68, giữ nguyên như lúc
  mở đợt 164; ≥48h lúc mở đợt này giữ 82 như lúc mở đợt 164.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ mười sáu liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
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
  `cooldown-t1-smoke-a`, đợt này xóa
  `cooldown-t1-smoke-hold` trước khi nó đủ 7 ngày — nó đủ
  7 ngày theo đồng hồ tường vào khoảng
  **22/11 11:39Z** nhưng đã bị xóa ở đợt 165, sớm ~14,82h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
  **Đính chính brief giao:** brief đợt này ghi "F-147-T6-1 nối
  lại lần thứ 10?" — số này SAI: LIMITS T6-164 §7 đã đếm
  "lần thứ mười lăm"; đợt này là **lần thứ mười sáu**
  (xem F-165-T6-1).
- **Prune lần 41 (T6-166): tổng lock 100 sau prune 40 —
  kiểm lại lúc mở đợt 166** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t1-smoke-wl` đủ 7 ngày ~22/11 11:39Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-165; #68 GIẾT HOLDER; #69 KHÔNG GIẾT HOLDER; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **9a1a9319** (btime
  20:09:31Z = epoch 1795291771). T6 **KHÔNG tự chứng nhận**
  số hiệu reboot #69 (thuộc T0-165/T2-165 — lúc T6 mở
  chưa có cờ `round165-t0.done` trên đĩa).
- Uptime boot lúc đóng ~41'. `journal --list-boots`
  chỉ 1 dòng 9a1a9319 (first entry 20:09:42Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~20:50Z, boot_id giống lúc mở; kiểm
  lại sau prune, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  20:50:25Z vs local 20:50:23Z — chênh ~2 s (trong đó có
  độ trễ fetch; lúc mở chênh ~2 s). Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 165
  đọc trực tiếp được.
- **REBOOT #68 (btime 18:06:30Z, boot `0c8a94aa`) —
  GIẾT HOLDER t4** (§2): ACQUIRED 18:04:38Z, btime 112 s
  sau khi giữ; 0 RELEASED cho ticket đó; STALE-LOCK thu hồi
  19:16:47Z (tuổi 4329 s, "boot đổi") + re-ACQUIRED cùng giây.
  **Chuỗi "không giết holder" 7 reboot liên tiếp (#61–#67)
  ĐỨT TẠI #68 — reboot thứ ba giết holder (#50, #60, #68).**
  T6 không phán mù cho #68 — giao T2-165.
- **REBOOT #69 (btime 20:09:31Z, boot `9a1a9319`) —
  KHÔNG giết holder** (§2): lock trống 7m31s trước btime
  (RELEASED cuối 20:02:00Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới. **Verdict sạch nhưng khoảng trống
  NGẮN NHẤT chuỗi kể từ #66 (451 s, ngắn hơn #66 đúng 16 s)
  — bằng chứng mỏng hơn các reboot trước nhưng vẫn đầy đủ**
  (không có holder nào tồn tại trong cửa sổ chứa #69).
  **Chuỗi "không giết holder" MỚI bắt đầu lại từ #69: 1 reboot.**
- **Watcher-164 chết theo reboot #68** (T9-164 phát hiện sau
  khi T5-164 đóng cờ; aggregate 164 §10.5 (ix) ghi nhận —
  không mâu thuẫn T5/T9, chỉ khác thời điểm kiểm).
  T5-165 sở hữu POSTBOOT_PASS #68/#69 + watcher-165.
  **POSTBOOT_PASS #66 CHƯA CÓ lúc T0-164 kiểm lại cuối
  17:42:49Z (T5-164 sở hữu).**
- **BỔ SUNG — đọc chéo preflight T4-165 lúc T6 đóng
  (~20:50Z, thấy trong ps snapshot):** T4-165 ghi boot lúc mở
  9a1a9319 (#69 ứng viên, btime 1795291771 = 20:09:31Z,
  uptime ~31' lúc mở); gate0 lúc mở ĐẠT qua dự phòng
  T4-check-only (chưa có cờ T5-165); replay tự nhiên trên
  boot #69 ĐÃ XONG lúc mở (boot+~31'); RAM ~967–974 MB
  avail lúc mở (gate A đóng). T6 chỉ ghi nhận chéo từ
  preflight T4; verdict chính thức thuộc T4-165/T5-165.
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
  t4 (đợt này — lần đầu tiên chuỗi đứt kể từ #60). #69 KHÔNG
  giết holder (lock trống 7m31s trước btime — đợt này).**

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-165
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (20:51Z 21/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 1879 dòng thô /
  1873 dòng chính thức, 527 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round165-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND165_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round165-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 165 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 165 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–164 (T10-164 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-165).

## 11. GHI CHÚ CHO T10-165 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ mười lăm liên tiếp, tổng 1800/1800 qua 15
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 14 → 15 (lần thứ mười lăm xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 46 → 47 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (527 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); **NHƯNG #68 GIẾT HOLDER — chuỗi
  "không giết holder" đứt tại #68 (reboot thứ ba giết holder,
  sau #50/#60); #69 KHÔNG giết holder (chuỗi mới bắt đầu
  lại từ #69: 1).** Double-acquire/STALE-LOCK lên 12 —
  cùng một sự kiện thu hồi #68, đừng đếm thành hai.
  Prune lần 40 xóa 1 file, queue về đúng trần 100 (KHÔNG
  phải chờ luồng khác nhả lock đợt này; +3 dòng của T4-165
  trong phiên đều sạch — chu kỳ hoàn tất đầu tiên trên boot #69).
- **Reboot #68 GIẾT holder t4 attempt2-f1d4ce1a** (ACQUIRED
  18:04:38Z, btime 18:06:30Z, 112 s sau khi giữ; STALE-LOCK
  thu hồi 19:16:47Z, tuổi 4329 s — verdict DƯƠNG, cơ chế
  thu hồi đúng). **Reboot #69 KHÔNG giết holder** (lock
  trống 7m31s trước btime — ngắn nhất chuỗi kể từ #66,
  verdict sạch nhưng mỏng hơn).
  **Đồng hồ ở giờ thật** (Cloudflare ~2 s lúc mở và lúc
  đóng, gồm độ trễ fetch). Mù cho #68/#69 giao T2-165.
  **Kiểm cuối đợt này: ACQUIRED 539 / RELEASED 527, 527
  cặp** (đừng mang 528/517 — đó là kiểm cuối đợt 164 —
  vào cột đợt này; bài học (r) đợt 163).
- **Double-acquire LÊN 12, STALE-LOCK LÊN 12 — 1 ca mới
  cả hai.** Hai con số là CÙNG MỘT sự kiện thu hồi #68 —
  T10-165 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng (quyết (v) đợt 162, quyết (r) đợt 163).
- 0 zombie lúc mở và lúc đóng; X11 trống lúc mở (reboot
  #69 đã dọn 3 socket sót đợt 164), 3 socket X193/X194/
  X195 mới lúc đóng (của T4-165, tạo 20:46Z
  — lần thứ sáu liên tiếp cùng 3 số display)
  — không phải của T6; T10-165 lưu ý khi đối chiếu log (+35 dòng kể
  từ T6-164 đóng đều là của t4 + t8-round164, +3 dòng trong
  phiên T6 đều là của T4-165, sạch).
- **Inotify: trần `max_user_watches` nay là 63747** (giống
  trần trên #66; khác 63756 trên #67 theo T6-164). Ghi
  nhận theo quyết (m) đợt 146 (ghi làm chú thích, không
  hành động); T9-165 sở hữu hệ quả headroom nếu có. T6
  không suy đoán nguyên nhân đổi.
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #88? VẪN MỞ; mù #94? MỞ theo quyết (b) đợt 163;
  mù #95? MỞ theo quyết (b) đợt 163; mù #96? SƠ BỘ MỞ —
  điều tra đầy đủ giao T2-165; birefnet 0 thử lần
  18 (đợt 164); u2net là fallback chính thức; POSTBOOT_PASS
  #66 CHƯA CÓ lúc T0-164 kiểm lại cuối 17:42:49Z — giao
  T5-165; POSTBOOT_PASS #68/#69 CHƯA CÓ lúc T10-164 đóng —
  giao T5-165; kết cục run 164 + (m) #68/#69 thuộc
  T7-165/T2-165).
- Cờ `round165-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-165 (F-165-T6-n)

- **F-165-T6-1 — Đính chính số đếm F-147-T6-1 trong brief
  giao (không phải lỗi của T6).** Brief đợt này ghi
  "F-147-T6-1 nối lại lần thứ 10?" — số này SAI: LIMITS
  T6-164 §7 đã đếm "lần thứ mười lăm" (đợt 150–164 nối
  liên tiếp). Đợt này xóa `cooldown-t1-smoke-hold` sớm
  14,82h trước mốc 7 ngày → nối lại **lần thứ mười sáu**.
  T6 dùng số đúng (16) trong LIMITS này; brief ghi 10 có
  thể là số cũ từ đợt ~159 chưa cập nhật. Không ảnh hưởng
  kết quả (chỉ là nhãn đếm).
- **F-165-T6-2 — Lệnh exec đầu phiên lỗi cú pháp bash do
  `echo` chứa dấu ngoặc đơn không quote — phần trích
  new-lines không chạy lần đầu, đã chạy lại đúng ngay sau
  đó.** Lệnh `echo --- new lines since T6-164 close (raw
  1841) ---` đặt dấu `(` ở đầu một từ không quote nên bash
  báo syntax error, cả khối `tail`/`wc`/`cat` sau đó không
  chạy. Đã bắt ngay (exit 2) và chạy lại đúng bằng lệnh
  riêng — file `new-lines-since-t6-164.txt` đầy đủ 35 dòng,
  mọi số §2 đều từ bản chạy lại. Không ảnh hưởng kết quả.
  Bài học: không dùng dấu ngoặc đơn trong chuỗi `echo`
  không quote — cùng họ F-164-T6-2 (pipeline đặt sai thứ tự).
- **F-165-T6-3 — Lệnh status/md5 lần đầu dùng sai đường
  dẫn `scripts/` thay vì `apps/web/scripts/` — đã bắt
  ngay, chạy lại đúng, không dùng số sai.** Lệnh đầu
  `bash ~/workspace/repo-1/scripts/vcut-vite-lock-v2.sh`
  báo No such file; `md5sum` lần đầu chỉ đo được preview.tsx
  (các file kia `[ -f ]` lọc mất). Cả hai file
  `status-open.txt`/`md5-open.txt` đã bị ghi đè đúng bằng
  lần chạy lại với đường dẫn đúng (`apps/web/scripts/`,
  xem §0/§9) — đã kiểm lại nội dung cả hai file trước khi
  viết LIMITS. Không ảnh hưởng kết quả. Bài học: đường dẫn
  script lock/suite là `apps/web/scripts/`, không phải
  `scripts/` — cùng họ F-158-T10-2 (sai đường dẫn lần đầu).

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a165-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round165-t6/appendix-numbers.txt` giữ bản
trích gốc (tuổi prune tính từ đúng epoch giờ prune trong
`prune-time.txt` — bài học F-164-T6-1; md5 live-code chỉ
tính bằng pipeline shell đứng sau khi bắt lỗi F-164-T6-2):

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=591 max=3499 mean=1903.46
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
suite run1: PASS=9 FAIL=0 T7A=1 secs=25 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 secs=25 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 secs=29 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 secs=33 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 secs=30 rc=0
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a165.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=538, COOLDOWN=234, RELEASED=526, STALE-LOCK=12, STALE-TICKET=1, TICKET=549, TIMEOUT=10, total=1870
cleaned-open pairs ACQUIRED->RELEASED: 526
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 12
cleaned-close counts: TOTAL: ACQUIRED=539, COOLDOWN=234, RELEASED=527, STALE-LOCK=12, STALE-TICKET=1, TICKET=550, TIMEOUT=10, total=1873
cleaned-close pairs ACQUIRED->RELEASED: 527
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 12
cleaned-final counts: TOTAL: ACQUIRED=539, COOLDOWN=234, RELEASED=527, STALE-LOCK=12, STALE-TICKET=1, TICKET=550, TIMEOUT=10, total=1873
cleaned-final pairs ACQUIRED->RELEASED: 527
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 12
raw log lines open: 1876
raw log lines close: 1879
raw log lines final (after prune check): 1879
new lines since T6-164 close: 35 (TICKET 10, ACQUIRED 10, RELEASED 9, COOLDOWN 5, STALE-LOCK 1, TIMEOUT 0)
new lines in T6-165 session: 3 (t4-165: TICKET+ACQUIRED 20:42:07Z, RELEASED 20:46:13Z hold_s=246 — clean complete cycle, first on boot #69)
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
queue age bands open: >=192h: 0 files; >=72h: 68 files; >=48h: 82 files
queue age bands post-prune: >=192h: 0 files; >=72h: 67 files; >=48h: 81 files
KHONG-NHA lines in raw log: 0
prune-40 deleted: cooldown-t1-smoke-hold mtime=2026-11-15T11:39:49.466698323Z size=14 age=153.18h rule=(b) at 2026-11-21T20:50:46Z epoch=1795294246 early_by=14.82h
next oldest remaining: cooldown-t1-smoke-wl mtime=2026-11-15T11:39:49.777698321Z
reboot-68 KILLED HOLDER: t4 ACQUIRED 2026-11-21T18:04:38Z pid 38955 port 5187 (attempt2-f1d4ce1a); btime #68 2026-11-21T18:06:30Z = 112s into hold; NO RELEASED ever; STALE-LOCK 2026-11-21T19:16:47Z (tuoi 4329s, boot doi) + re-ACQUIRED same second (double-acquire #12); chain #61-#67 BROKEN at #68
reboot-69: btime 2026-11-21T20:09:31Z boot 9a1a9319; last lock line before btime 2026-11-21T20:02:00Z t8-round164 RELEASED hold_s=230 (lock empty 7m31s = 451s); 0 lines after 20:02:00Z; 0 new STALE-LOCK; NO holder killed
clock check open: Cloudflare Date 2026-11-21T20:38:49Z vs local 20:38:47Z (~2s incl fetch latency)
clock check close: Cloudflare Date 2026-11-21T20:50:25Z vs local 20:50:23Z (~2s incl fetch latency)
inotify max_user_watches: 63747 (same as #66; was 63756 on #67)
```

---
**Batch stage / Tổng batch:** T6-165: 1 batch / 1 entry / 1 file. Đợt 165 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry (t6). Lũy kế 111–164 (T10-164 đếm dedup toàn cục): T6 không tự cộng tay — chờ T10-165 đếm lại.
