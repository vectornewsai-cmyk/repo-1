# PHASE9 ROUND173 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 23 LIÊN TIẾP) + #82/#83 KHÔNG GIẾT HOLDER + prune lần 48: XÓA 3 FILE — LIMITS

- Đợt: 173, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 03:35:51 +07 23/11/2026 (= 20:35:51Z 22/11).
  Chạy 20:39Z → 20:52Z 22/11/2026. Lúc mở đã ở trên boot
  `dd08464a` (btime 20:25:47Z) — boot này có thể là #83
  theo brief giao (btime 20:25:47Z); T6 TỰ XÁC MINH
  btime 20:25:47Z từ /proc/stat + `uptime -s` (cả hai khớp)
  nhưng KHÔNG tự chứng nhận số hiệu #83 (thuộc T0-173),
  chỉ chứng nhận từ log lock rằng #82/#83 KHÔNG giết
  holder (xem §2/§8); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm (A) 120/120 lần thứ 23
  (chuỗi xanh kép đang 22; tổng 2760/2760 nếu sạch);
  (b) prune lần 48 theo đúng quy tắc prune các đợt trước
  (queue 100 → 102 theo mẫu đợt 172 — ghi số thực tế;
  prune KHÔNG chờ lock); (c) chứng nhận reboot #82 (và
  boot mới btime 20:25:47Z nếu là #83) có giết holder
  không (lock trống trước btime từng reboot bao lâu; 0
  STALE-LOCK mới?; chuỗi "không giết holder" từ #69 đang
  13 reboot (#69–#81) — cập nhật sau #82/#83); (d) đối
  chiếu pid watcher-172 lệch với T5-173 (17944 vs 6126) —
  kết luận nguyên nhân (F-172-T6-5); (e) kiểm chồng lấn
  harness với cửa sổ attempt của T4 (ghi rõ ảnh hưởng/
  không ảnh hưởng); (f) ghi mọi phát hiện/sai số dạng
  F-173-T6-*.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–172,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–172); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (601 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 12, STALE-LOCK GIỮ 12
  (0 ca mới cả hai kỳ vọng). Reboot #82 KHÔNG giết holder
  (lock trống 31m09s trước btime — số hiệu chờ T0-173 xác
  nhận); #83 (ứng viên, btime 20:25:47Z) KHÔNG giết holder
  (lock trống 1h56m08s trước btime — số hiệu chờ T0-173
  xác nhận; nếu cả hai được xác nhận → chuỗi lên 15 reboot).
  Prune lần 48: xóa 3 file cũ nhất (điều (b)) — queue 103 →
  100 file — KHÔNG PHẢI CHỜ lock (lock TRỐNG lúc mở, lúc
  đóng, ngay trước prune và lúc kiểm cuối — giống đợt
  167/168/169/170/171/172). Lệch pid watcher-172 ĐÃ GIẢI:
  17944 và 6126 là HAI watcher khác nhau (xem §8/F-173-T6-2),
  không phải lệch — F-172-T6-5 ĐÓNG.**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round173-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  boot-verify-final.txt, time-open.txt, time-close.txt,
  time-final.txt, time-open-cloud.txt, time-close-cloud.txt,
  queue-open.txt, queue-oldest-true.txt,
  prune-candidates.txt, vite-lock-v2-cleaned-open.log,
  vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, vite-lock-v2-raw-final.log,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt, analyze-log.py,
  new-lines-since-t6-172.txt, prune-deleted.txt, prune-time.txt,
  suite-start.txt, suite-end.txt, harness-start.txt,
  harness-end.txt, inotify-open.txt, inotify-close.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  status-final.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a173.sh,
  t7-block-a173.sh,
  t7-a173-churn.log, t7-control-a173.stdout.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT dd08464a (btime 20:25:47Z); lock TRỐNG; queue 102 file (T6-172 đóng 100 + 2 file mới)

- **Boot lúc mở, lúc đóng và lúc kiểm cuối: boot_id
  `dd08464a-c4e5-4162-951e-0705e8149d97`, btime 20:25:47Z
  theo /proc/stat** (epoch 1795379147; `uptime -s` =
  20:25:47; `journal --list-boots` chỉ 1 dòng dd08464a,
  first entry 20:26:00Z). Uptime ~13' lúc T6 bắt đầu
  (20:39Z), ~25' lúc snapshot đóng (20:50Z), ~26' lúc kiểm
  cuối (20:52Z). Boot này có thể là #83 theo brief giao /
  T5-173 watcher-status ("có thể là #83 — chờ T0-173 xác
  minh 9 nguồn") —
  **T6 TỰ XÁC MINH btime 20:25:47Z** (hai nguồn độc lập
  /proc/stat + `uptime -s` khớp nhau) nhưng **KHÔNG tự
  chứng nhận số hiệu #83** (thuộc T0-173); T6 chỉ chứng
  nhận từ log lock rằng #82/#83 KHÔNG giết holder (xem
  §2/§8). **KHÔNG có reboot trong phiên T6** (boot_id
  giống nhau lúc mở, lúc đóng và lúc kiểm cuối sau prune).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sun, 22 Nov 2026 20:39:20 GMT` vs local 20:39:19Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, trong đó có độ trễ
  fetch curl ~1–2 s); lúc đóng Cloudflare ~20:50Z vs
  local chênh ~1–2 s (cùng họ lúc mở, không phải
  lệch đồng hồ). Các mốc wall đợt 173 đọc trực tiếp được.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Tên file script lock đúng là `vcut-vite-lock-v2.sh` /
  `vcut-vite-lock.sh` (có tiền tố `vcut-` — xem F-173-T6-6).
  Lưu ý phương pháp: `md5-open.txt`/`md5-close.txt`/
  `md5-final.txt` đều là đo tươi từ đĩa bằng `md5sum`
  trực tiếp (không copy file md5 qua lại — bài học
  F-163-T6-1); cả ba khớp nhau từng hash, xem §9.
- Queue lúc mở: **102 file / 1428 byte** — khớp số học
  từ T6-172 đóng: 100 sau prune 47 + 2 file cooldown mới
  `cooldown-t0-round172` (mtime 18:09:35Z) +
  `cooldown-t8-round172` (mtime 18:29:39Z) (§2). File
  `cooldown-t4` được ghi đè mtime mới 18:02:54Z (chu kỳ t4
  đợt 172, §2) — ghi đè tại chỗ, không đổi số lượng.

## 1. Quét zombie: 0 zombie thật lúc mở, lúc đóng và lúc kiểm cuối; 0 vite thật của T6; X11 trống lúc mở, 3 socket lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 20:39Z
  (mở, `ps-full-open.txt`) và lúc 20:50Z
  (đóng, `ps-full-close.txt`); kiểm lại zombie lúc kiểm
  cuối 20:52Z bằng `ps -eo stat` (đếm ` Z `).
- **Lúc mở, lúc đóng và lúc kiểm cuối: 0 zombie thật.**
  `grep -c defunct` trên snapshot mở cho 0 — không còn
  false positive kiểu F-172-T6-2 (lệnh chụp snapshot đợt
  này không chứa chuỗi "defunct"). 0 process dpkg/apt nào
  trên bảng ps của T6 lúc mở hay lúc đóng (apt=1/2 trong
  log poll của T4-173 là hoạt động apt của T5-173
  repair — xem §6/F-173-T6-1 — không phải process
  dpkg/apt trên bảng ps của T6).
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống
  hoàn toàn; 0 dòng chứa chuỗi "vite" ngoài chính lệnh
  exec của T6 trong snapshot ps lúc mở.
  **Lúc đóng: 0 vite thật của T6** — T6 không khởi động
  Xvfb/vite nào, không kill process nào trong phiên này.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #83 đã dọn
  sạch socket của đợt 172).
  **Lúc đóng: 3 socket X193 / X194 / X195, tạo
  20:47Z** — của các luồng khác đợt 173 (khởi động Xvfb
  trong phiên; T6 không khởi động Xvfb/vite nào, không đụng
  tới các process này). Trở lại 3 socket như đợt 172.
- **Watcher-173: `b2-watcher.sh` pid 2670 (round173-t9) và
  `replay-watch-173.sh` pid 13457 (round173-t5) đều có mặt
  lúc đóng** — b2-watcher-173 khởi động ~20:40:19Z
  (etime 05:38 lúc 20:45:57Z), replay-watch-173 START
  20:42:50Z (log header, end 23:30:00Z) — cả hai sau khi
  đợt mở 20:35:51Z, bình thường; T6 chỉ ghi nhận. Xem
  §8/F-173-T6-2 về hai loại watcher khác nhau.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-173).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (~20:39Z và ~20:50Z) — **GIỐNG trần trên #69, #70,
  #71, #73, #74, #75, #76, #77, #79, #80 và #81** (theo
  T9-168/T6-168/T6-169/T6-170/T6-171/T6-172); khác
  63756 trên #67 (T6-164 đo) — xem §11, ghi nhận, không
  hành động.
- Tải hệ thống trong phiên: các luồng đợt 173 khởi động
  dần (T9 watcher ~20:40Z, T5 replay-watch ~20:42:50Z,
  T4 poll-wait từ 20:42:43Z, T0 giữ lock 20:44:25–20:50:31Z
  chạy WebKit, Xvfb 20:47Z — xem §2/§6) — harness churn
  vẫn 120/120 (xem §6).
  Suite đợt này chạy ~22 s/lượt trung bình (cửa sổ 6 lượt
  20:41:26Z → 20:43:38Z, ~2m12s; tương đương đợt 172:
  21–25 s/lượt).

## 2. Lock lúc mở: TRỐNG; +38 dòng kể từ T6-172 đóng — TẤT CẢ SẠCH, 11 CHU KỲ MỚI HOÀN TẤT (9 TRƯỚC PHIÊN + 2 TRONG PHIÊN); #82/#83 KHÔNG GIẾT HOLDER (PHÁT HIỆN MỚI: CẢ HAI)

- **Lúc mở (20:39Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 102 cooldown`,
  rc=0.
- **Lúc snapshot đóng (20:50Z): lock vẫn TRỐNG** — status
  `TRỐNG`, `0 ticket + 103 cooldown` (1 file cooldown mới
  trong phiên — của chu kỳ t0-round173 RELEASED 20:50:31Z,
  §7). **Lúc kiểm cuối sau prune (20:52Z): lock TRỐNG**,
  `0 ticket + 100 cooldown`.
  **Prune KHÔNG PHẢI CHỜ** (xem §7): lock trống lúc mở,
  lúc đóng, ngay trước prune (`status-before-prune.txt`
  ~20:51Z) và lúc kiểm cuối (`status-final.txt` 20:52Z) —
  giống đợt 167/168/169/170/171/172.
  Lưu ý: trong phiên T6-173 có **2 chu kỳ lock** của luồng
  khác (t0-round173, §2 dưới) — cả hai đều hoàn tất
  TRƯỚC khi prune (RELEASED cuối 20:51:51Z, rm prune
  20:51:52Z — xem F-173-T6-5).
- **Log lock +38 dòng kể từ T6-172 đóng** (raw 2104 lúc
  T6-172 đóng → 2136 lúc T6-173 mở → 2139 lúc snapshot
  đóng → 2142 lúc kiểm cuối): 32 dòng trước phiên T6
  (17:59–18:29Z); **+6 dòng trong phiên T6-173**
  (20:44–20:51Z — 2 chu kỳ t0-round173, đều hoàn tất).
- Đối chiếu 32 dòng trước phiên (khớp đúng từng dòng, file
  `new-lines-since-t6-172.txt`, dòng thô 2105–2136):
  - t4: 3 dòng — 1 chu kỳ (attempt 17:59:27Z → RELEASED
    18:02:54Z, hold 207 s) — t4 đợt 172, lượt yên #41
    (attempt1 — khớp aggregate 172: attempt1 20/20).
  - t0-round172: 3 dòng — 1 chu kỳ (18:07:00Z → RELEASED
    18:09:35Z, hold 155 s).
  - t8-round172: 26 dòng — 7 chu kỳ bắt đầu (18:11:20Z →
    18:25:48Z); **7 chu kỳ HOÀN TẤT** (holds 152 / 71 /
    131 / 240 / 60 / 121 / 231 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14967–14981 ms trên cổng 5490/5390); 0 chu kỳ
    dở dang.
  - Tổng trước phiên: Δ TICKET +9, Δ ACQUIRED +9, Δ RELEASED +9,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **9/9 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ dở dang.**
- Đối chiếu 6 dòng trong phiên (dòng thô 2137–2142):
  - t0-round173: 3 dòng — 1 chu kỳ (TICKET 20:44:24Z →
    ACQUIRED 20:44:25Z wait 1 s → RELEASED 20:50:31Z,
    hold 366 s, port 5560) — T0-173 chạy WebKit trong lúc
    giữ lock (T4-173 polls #4–#11 ghi lock=co pid 19628,
    port 5560 — khớp ticket `1-179538026497…`, §6).
  - t0-round173: 3 dòng — 1 chu kỳ probe (TICKET/ACQUIRED
    20:51:50Z wait 0 s → RELEASED 20:51:51Z, hold 1 s,
    port 5560) — `round173-t0/o8-probe-lock.log` ghi
    "ĐÃ NHẢ (thread=t0-round173 20:51:51Z, giữ 1s)".
  - Tổng trong phiên: Δ TICKET +2, Δ ACQUIRED +2, Δ RELEASED +2,
    Δ COOLDOWN +0. **2/2 chu kỳ trong phiên hoàn tất
    sạch; 0 chu kỳ dở dang.**
- **REBOOT #82 (btime 19:00:48Z 22/11, boot `34e61c92` —
  số hiệu CHƯA được T6 chứng nhận, thuộc T0-173; btime
  lấy từ brief giao / MEMORY — T6 KHÔNG tự xác minh
  btime này từ máy vì boot đã qua) — KHÔNG giết holder
  nào (PHÁT HIỆN MỚI CỦA T6-173):** dòng lock cuối trước
  reboot là t8-round172 RELEASED 18:29:39Z (hold 231 s);
  dòng đầu sau reboot: KHÔNG CÓ (0 dòng log từ 18:29:39Z
  tới TICKET t0-round173 20:44:24Z) — tức lock trống
  **31m09s (1.869 s) trước reboot**. Không có ACQUIRED nào
  chưa release tại thời điểm #82, 0 STALE-LOCK mới sau #82.
  **Kết luận: #82 không giết holder nào — verdict sạch
  (khoảng trống 1.869 s; số hiệu #82 chờ T0-173 xác
  nhận — nếu được xác nhận, chuỗi lên 14 reboot).**
- **REBOOT #83 (ứng viên — btime 20:25:47Z 22/11, boot
  `dd08464a` — số hiệu CHƯA được T6 chứng nhận, thuộc
  T0-173; btime TỰ XÁC MINH bởi T6: /proc/stat btime
  1795379147 + `uptime -s` 20:25:47Z khớp nhau) — KHÔNG
  giết holder nào (PHÁT HIỆN MỚI CỦA T6-173):** dòng lock
  cuối trước reboot vẫn là t8-round172 RELEASED 18:29:39Z
  (hold 231 s); dòng đầu sau reboot: KHÔNG CÓ (0 dòng log
  từ 18:29:39Z tới TICKET t0-round173 20:44:24Z) — tức
  lock trống **1h56m08s (6.968 s) trước reboot**. Không có
  ACQUIRED nào chưa release tại thời điểm #83, 0 STALE-LOCK
  mới sau #83.
  **Kết luận: #83 không giết holder nào — verdict sạch
  (khoảng trống 6.968 s; số hiệu #83 chờ T0-173 xác
  nhận — nếu được xác nhận, chuỗi lên 15 reboot).**
- **Gap #81→#82 = 7.123 s** (1h58m43s; 17:02:05Z →
  19:00:48Z — T6-173 tính từ btime brief/MEMORY, KHỚP
  aggregate 172). **Gap #82→#83 = 5.099 s** (1h24m59s;
  19:00:48Z → 20:25:47Z — T6-173 tính từ btime đã xác
  minh cho #83 + btime brief cho #82).
  **Gap #80→#81 = 9.064 s** (T6-173 kiểm lại độc lập từ
  btime, KHỚP quyết (d) đợt 171 / T6-172).
- **File cooldown mới kể từ T6-172 đóng:
  `cooldown-t0-round172` (mtime 18:09:35Z) +
  `cooldown-t8-round172` (mtime 18:29:39Z)** — 2 file làm
  tổng queue tăng 100 → 102. Số học khớp: 100 + 2 = 102 ✓.
  Trong phiên T6-173 thêm 1 file `cooldown-t0-round173`
  (mtime 20:50:31Z) → 103 trước prune (§7). Các file
  cooldown đợt 172/173 được bảo vệ bởi điều (c) — không
  nằm trong diện xóa của điều (b).

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 335 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 11 chu kỳ hoàn tất
  kể từ T6-172 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 324 chu kỳ T6-172 đã đếm = **335 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (324 đợt
    172 + 11 đợt này). Chu kỳ bị #68 giết KHÔNG tính
    vào số hoàn tất (nó là bằng chứng reboot giết holder,
    không phải lỗi thứ tự ghi — STALE-LOCK thu hồi đúng).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 2136 dòng chính thức lúc kiểm cuối, 601 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — bản đã lọc
= raw trừ đúng 6 dòng đó, lọc bằng `awk '$2!="tA" &&
$2!="tH"'` — cột owner là $2, bài học F-162-T6-1;
diff bản đã lọc mở/đóng/final giống nhau về nội dung cũ —
38 dòng mới kể từ T6-172 đóng + 3 dòng giữa đóng và kiểm
cuối (chu kỳ probe t0, §2); analyzer chạy trên bản đã lọc).
Bản đã lọc lúc đóng: **2133 dòng** (raw 2139) — **+35 dòng
kể từ T6-172 đóng** (2098 → 2133; 32 trước phiên + 3 trong
phiên tới lúc đóng, đều đã đối chiếu §2). Kiểm cuối sau
prune (20:52Z 22/11): bản đã lọc **2136 dòng** (raw 2142),
RELEASED 601, cặp 601, đang giữ 0, double-acquire 12 —
prune không đụng log nên số kiểm cuối = số lúc đóng + 3
dòng probe t0 (20:51:50–51Z, §2).

| Chỉ số (bản đã lọc) | T6-171 đóng | T6-172 đóng | T6-173 mở | T6-173 đóng (snapshot) | Δ trong phiên T6-173 (tới kiểm cuối) |
|---|---|---|---|---|---|
| Tổng dòng | 2066 | 2098 | 2130 | 2133 | +6 (tới kiểm cuối 2136) |
| TICKET | 604 | 613 | 622 | 623 | +2 |
| ACQUIRED | 593 | 602 | 611 | 612 | +2 |
| RELEASED | 581 | 590 | 599 | 600 | +2 |
| COOLDOWN | 265 | 270 | 275 | 275 | +0 |
| STALE-LOCK | 12 | 12 | 12 | 12 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 581 | 590 | 599 | 600 | +2 (601 lúc kiểm cuối) |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 | — |
| Double-acquire | 12 | 12 | 12 | 12 | 0 mới trong phiên |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 613 / RELEASED 601, 601 cặp.** Các số 602/590
  là kiểm cuối đợt 172 (không phải đợt này); 593/581 là
  kiểm cuối đợt 171. Bảng trên dùng đúng ba số này (đã đối
  chiếu với bảng §4 của LIMITS T6-171 và T6-172 — cả hai tự
  nó đúng).
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối (sau
  prune):** ACQUIRED 613 − RELEASED 601 = 12
  ACQUIRED chưa release trong lịch sử log — nhưng cả 12 đều
  đã được xử lý: 11 ca cũ (10 ca double-acquire cũ + 1 ca
  t8-round159 03:12:16Z STALE-LOCK thu hồi holder bị #60 giết
  — §8 đợt 160) + 1 ca t4 19:16:47Z (STALE-LOCK thu hồi holder
  bị #68 giết — §2 đợt 165). Analyzer xác nhận `still held
  at end of log: 0` ở cả ba snapshot mở/đóng/kiểm cuối. Lock
  TRỐNG lúc mở, lúc đóng và lúc kiểm cuối — status
  xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 12 — 0 ca mới kể từ T6-172 đóng,
  0 ca mới trong phiên T6-173.** Ca mới nhất vẫn là
  analyzer dòng 1843 (bản đã lọc — t4 ACQUIRED 19:16:47Z sau
  STALE-LOCK cùng giây, thu hồi holder bị #68 giết — §2 đợt 165).
  **Kết luận: 0 double-acquire THẬT mới.** STALE-LOCK GIỮ 12 —
  0 ca mới (ca mới nhất vẫn 19:16:47Z, thu hồi #68).
  **Hai con số là CÙNG MỘT sự kiện thu hồi #68, không phải hai
  sự kiện riêng** (nhắc lại từ đợt 160/161/162/163/164/165/166/167/168/169/170/171/172,
  quyết (v) đợt 162, quyết (r) đợt 163).
- **0 double-acquire mới** kể từ T6-172 đóng. 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (11 chu kỳ mới sạch kể từ T6-172 đóng,
  0 chu kỳ dở dang ngoài ca bị #68 giết đã thu hồi),
  0 zombie thật lúc mở/lúc đóng/lúc kiểm cuối, 0 stale mới trong phiên, queue 0 ticket,
  log nhất quán (601 cặp + 0 đang giữ lúc kiểm cuối, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–173 (toàn đợt) và đợt 173 (tới ~20:52Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **335 chu kỳ thật** chứng minh (§3).
  Caveat còn lại: **reboot #68 GIẾT HOLDER t4**
  (xem §2/§8 — chuỗi "không giết holder" đứt tại #68);
  **reboot #69 KHÔNG giết holder** (khoảng trống 451 s);
  **reboot #70 KHÔNG giết holder** (khoảng trống 1.621 s);
  **reboot #71 KHÔNG giết holder** (khoảng trống 399 s);
  **reboot #72 KHÔNG giết holder** (khoảng trống 5.135 s);
  **reboot #73 KHÔNG giết holder** (khoảng trống 6.511 s);
  **reboot #74 KHÔNG giết holder** (khoảng trống 12.359 s —
  dài nhất kể từ #61, xem §2 đợt 168);
  **reboot #75 KHÔNG giết holder** (khoảng trống 2.419 s —
  số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 168);
  **reboot #76 KHÔNG giết holder** (khoảng trống 3.190 s —
  số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 168);
  **reboot #77 KHÔNG giết holder** (khoảng trống 6.279 s —
  số hiệu ĐÃ XÁC NHẬN, aggregate 169);
  **reboot #78 KHÔNG giết holder** (khoảng trống 681 s —
  số hiệu ĐÃ XÁC NHẬN, quyết (e) đợt 170);
  **reboot #79 KHÔNG giết holder** (khoảng trống 4.955 s —
  số hiệu ĐÃ XÁC NHẬN, quyết (d)/(h) đợt 170);
  **reboot #80 KHÔNG giết holder** (khoảng trống 6.578 s —
  đợt 171, số hiệu ĐÃ XÁC NHẬN quyết (d)/(h) đợt 171;
  T6-172 kiểm lại độc lập, KHỚP; T6-173 kiểm lại, KHỚP);
  **reboot #81 KHÔNG giết holder** (khoảng trống 1.837 s —
  đợt 172, số hiệu ĐÃ XÁC NHẬN theo aggregate 172);
  **reboot #82 KHÔNG giết holder** (khoảng trống 1.869 s —
  đợt này, số hiệu chờ T0-173 xác nhận);
  **reboot #83 KHÔNG giết holder** (khoảng trống 6.968 s —
  đợt này, ứng viên, số hiệu chờ T0-173 xác nhận);
  reboot #60 ĐÃ giết holder t8-round159 là sự kiện đợt
  160, đã ghi nhận (cơ chế STALE-LOCK đã reclaim đúng —
  nay #68 lặp lại đúng mẫu đó).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng
  = lúc kiểm cuối** (bản (A) đợt 151). Live-code khối T7
  (bỏ comment/dòng trống) md5
  **`c92f2efff2080fbe6712522343e9e400`** — khớp đúng
  T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169/T6-170/T6-171/T6-172 §6.2.
  File khối T7 đã trích `t7-block-a173.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171 và 172 (cùng md5). Harness đợt này chạy đúng code (A)
  trong suite, không phải bản sao tay (xem §6.2).
- **PHẠM VI HẸP — đã tuân thủ, có bằng chứng:**
  `vcut-poll-quiet-v2.sh` KHÔNG đổi (`1710e480` lúc mở
  = lúc đóng = lúc kiểm cuối); hàm `count_blockers` dùng
  chung cho gate cửa yên của T4 KHÔNG đổi (grep: `count_blockers` xuất
  hiện 2 lần trong poll script, dòng 32/46 — trong suite
  chỉ có 1 lần xuất hiện duy nhất là dòng comment ở
  khối T7, dòng 151: "PHẠM VI HẸP: (A) CHỈ áp cho khối
  test T7 này; KHÔNG đổi count_blockers", kèm 3 lệnh poll
  cũ của (B) đã comment; không có trong live-code khối T7).
  Script lock v2 KHÔNG đổi (`520b8baa`). T6 không đổi
  gì trong phiên (chỉ xóa 3 file cooldown theo luật
  prune đã phê duyệt — §7; không đụng code).
- `bash -n` harness t7-control-a173.sh: OK (bản sao của
  t7-control-a172.sh, chỉ đổi hậu tố a172 → a173).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–172 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ hai mươi ba liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~20:41–20:43Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (cửa sổ 6 lượt
20:41:26Z → 20:43:38Z, ~2m12s — tương đương đợt 172:
21–25 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
+6 dòng trong phiên T6-173 (2 chu kỳ t0-round173, §2/§4 —
0 dòng nào là của T6).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round173-t6/t7-control-a173.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169/T6-170/T6-171/T6-172 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot dd08464a (#83 ứng
viên, btime 20:25:47Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a173.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171 và 172; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a173-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 506 ms, max 3358 ms, trung bình 1918,13 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~6m56s (20:43:47–20:50:43Z).
- **CAVEAT CHỒNG LẤN HARNESS/T4 — ÁP DỤNG QUY TẮC WORDING
  QUYẾT (h) ĐỢT 171 (F-171-T6-1) — xem F-173-T6-1:**
  Quy tắc wording: khi mô tả quan hệ poll/gate/harness,
  tách riêng hai pha của một attempt và ghi rõ cửa sổ
  chồng lấn với từng pha: (a) **pha đếm gate** (poll → lấy
  TICKET — gate chưa qua thì chưa có TICKET); (b) **pha giữ
  lock** (TICKET → RELEASED — attempt đang chạy). Đợt này
  harness 20:43:47–20:50:43Z chồng lấn **CẢ HAI PHA —
  lần đầu tiên chồng cả (a) lẫn (b) trong một đợt**
  (đợt 171 chỉ chồng pha (b); đợt 172 chỉ chồng pha (a)):
  pha (a) của T4-173 (poll-wait bắt đầu 20:42:43Z; các
  poll #3–#11, 20:44:13–20:50:18Z, nằm TRONG cửa sổ
  harness; poll #12 20:51:04Z sau harness) VÀ pha (b)
  của T0-173 (TICKET 20:44:24Z → RELEASED 20:50:31Z,
  hold 366 s — gần trọn cửa sổ harness; T4-173 polls
  #4–#11 ghi lock=co pid 19628 port 5560 ticket
  `1-179538026497…` khớp đúng ticket này).
  Bằng chứng đợt này (`round173-t4/poll-t4.log`):
  gate0=khong-dat trong cả 12 poll tới 20:51:04Z;
  **0 TICKET nào của T4-173 được lấy tới lúc kiểm cuối
  20:52Z** — T4-173 chưa hề bước vào pha (b) trong phiên
  T6. Đánh giá ảnh hưởng: (i) blockers comm-based trong
  cửa sổ: #3=0, #4=2, #5–#9=4, #10–#11=1 — số 4 ở #5–#9
  là vite/WebKit THẬT của T0-173 trên cổng 5560
  (blockers-list-9.txt: vite 5560 + MiniBrowser WebKit),
  không phải churn (process churn là `exec -a
  WebProcess-churn sleep 1,5 s`, comm vẫn là "sleep" nên
  không được đếm là blocker theo cách đếm comm-based của
  T4); số legacy trong cửa sổ (0,4,7,6,7,6,7,1,2) ở mức
  hoặc thấp hơn poll #2 trước harness (legacy 6) — không
  có dấu hiệu churn làm phồng số đếm; (ii) gate0 giữ
  khong-dat vì lý do độc lập với churn (postboot_exit=1 —
  POSTBOOT_PASS #83 chỉ được T5-173 xử lý sau, chưa có
  lúc kiểm cuối 20:52Z; t5flag=cu — cờ cũ của 172-t5;
  apt=1 trong các poll #1–#9, apt=2 ở poll #10) — churn
  không gây ra gate pass giả, cũng không chặn một gate
  pass nào; (iii) load1 trong cửa sổ 3,23 / 6,92 / 4,32 /
  5,06 / 2,82 / 1,47 / 0,90 / 0,76 / 0,56 — cao lúc đầu
  rồi hạ dần; tải cao trùng lúc T0 khởi động WebKit
  (20:44–20:46Z) và T5-173 hoạt động (dpkg_lines 2 → 28 →
  168 → 266 → 323 ở polls #8–#11); churn chỉ là `sleep`
  trần, không CPU — T6 không quy tải tăng cho churn.
  **T6 KHÔNG phán verdict attempt của T4-173** — T4/T10
  sở hữu; T6 chỉ ghi rõ mốc giờ và pha chạm để T4-173/T10-173 tự đánh giá.
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
| **(A), đợt 168 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 169 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 170 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 171 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 172 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 173 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau hai mươi ba đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ hai mươi ba liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 2760/2760 dưới churn qua 23 đợt). Chú thích tỉ lệ
  (như T6-150–172): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 22 (đợt 172) → **23 (đợt
  173 — lần thứ hai mươi ba xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 54 (đợt 172) → **55 (đợt 173,
  6/6 lượt 9/9)**.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 3 FILE (ĐIỀU (b) KÍCH HOẠT) — KHÔNG PHẢI CHỜ LOCK

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
  - 20:39Z (lúc mở): tổng **102 file / 1428 byte** (vượt
    trần mềm 100 — do T0-172 + T8-172 thêm 2 file
    `cooldown-t0-round172` + `cooldown-t8-round172` sau
    khi T6-172 prune, §2); quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    — 0 byte, đã ghi lại file riêng như T6-166/167/168/169/170/171/172) — điều (a)
    không kích hoạt.
  - Lock TRỐNG lúc mở (20:39Z), TRỐNG lúc snapshot
    đóng (20:50Z), TRỐNG ngay trước prune
    (`status-before-prune.txt` ~20:51Z) và TRỐNG lúc kiểm
    cuối (20:52Z) — **prune KHÔNG PHẢI CHỜ**
    (giống đợt 167/168/169/170/171/172 không phải chờ; khác đợt 166 phải chờ
    T4-166). Lưu ý: trong phiên T6-173 có **2 chu kỳ lock**
    của t0-round173 (§2) — cả hai hoàn tất trước prune
    (RELEASED cuối 20:51:51Z, rm prune 20:51:52Z — xem
    F-173-T6-5).
  - 20:51:52Z 22/11 (epoch 1795380712): điều (b) KÍCH HOẠT:
    tổng 103 > 100 → xóa 3 file cũ nhất tới khi còn 100.
    Các file cũ nhất (mtime chính xác tới nano-giây):
    **`cooldown-t3-round119`, mtime
    2026-11-16T01:23:30.418448294Z, 163,47h tuổi lúc xóa**;
    **`cooldown-t10-round119`, mtime
    2026-11-16T02:15:33.452070954Z, 162,61h tuổi lúc xóa**;
    **`cooldown-round120-t8-e1`, mtime
    2026-11-16T06:21:27.498008745Z, 158,51h tuổi lúc xóa**
    (cả ba ≥48h — thỏa điều kiện không xóa file <48h;
    không phải file đợt hiện tại hay đợt ngay trước — file
    cooldown cũ từ 16/11, không thuộc đợt 172/173).
    Xác định "cũ nhất" bằng mtime chính xác tới nano-giây
    (`ls -ltr --time-style=full-iso` — 3 file đầu đúng
    thứ tự trên; file kế tiếp `cooldown-round120-t8-n10`
    06:28:53Z). Tuổi tính từ đúng epoch giờ prune trong
    `prune-time.txt` (bài học F-164-T6-1; `prune-time.txt`
    ghi SAU `rm` trong cùng một lệnh — bài học F-167-T6-3).
    Tên file cũ nhất lấy từ `queue-oldest-true.txt`
    (`ls -ltr | head`, cũ nhất lên đầu — đúng tên sau bài
    học F-170-T6-2).
  - **Kết quả prune đợt 173 (lần 48): 3 file đã xóa
    (`cooldown-t3-round119`, `cooldown-t10-round119`,
    `cooldown-round120-t8-e1`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (20:39Z) **102 file / 1428 byte**;
  lúc snapshot đóng (20:50Z, trước khi prune) **103 file /
  1442 byte** (+1 file mới trong phiên,
  `cooldown-t0-round173` 20:50:31Z, §2; log lock +6 dòng
  trong phiên, 0 dòng nào của T6);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (20:52Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 3 file prune giữa hai lần đếm của đợt này
  (sau prune, T0 probe 1s đã RELEASED trước rm — không
  thêm file cooldown mới).
  Số học từ T6-172 đóng: 100 + 2 file mới
  (`cooldown-t0-round172` + `cooldown-t8-round172`) = 102 ✓
  lúc mở; 102 + 1 file mới trong phiên
  (`cooldown-t0-round173`) = 103 ✓ lúc đóng — khớp đúng
  số T10-172 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 73 file; ≥48h (`-mtime +1`): 83
  file**. Lúc đóng (trước prune): **≥192h: 0 file; ≥72h:
  73 file; ≥48h: 83 file** (1 file mới trong phiên <48h
  nên không đổi tầng). Sau prune (20:51Z): **≥192h: 0 file; ≥72h:
  70 file; ≥48h: 80 file** — ≥72h giảm 73 → 70 (xóa
  đúng 3 file ≥72h — khớp số học).
  (Ghi chú: ≥72h lúc mở đợt này là 73, tăng 1 so với lúc
  đóng đợt 172 sau prune (72) — 1 file đã đủ 72h trong
  khoảng 17:50–20:39Z; khớp số học, không phải lỗi đếm.)
  File cũ nhất còn lại nay là
  `cooldown-round120-t8-n10`, mtime 2026-11-16T06:28:53Z —
  lúc 20:51Z mới **~158,39h tuổi** (đủ 7 ngày ~23/11 06:28Z).
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ hai mươi bốn liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
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
  `cooldown-t1-smoke-wl`, đợt 167 xóa `cooldown-t2`,
  đợt 168 xóa `cooldown-t3-round118`, đợt 169 xóa
  `cooldown-t5`, đợt 170 xóa `cooldown-t10-round118`,
  đợt 171 xóa `cooldown-t2-round119` + `cooldown-t1`,
  đợt 172 xóa `cooldown-t8-round119`, đợt này xóa
  `cooldown-t3-round119` + `cooldown-t10-round119` +
  `cooldown-round120-t8-e1` trước khi chúng đủ 7 ngày —
  `cooldown-t3-round119` đủ 7 ngày theo đồng
  hồ tường vào khoảng **23/11 01:23Z** nhưng đã bị xóa ở
  đợt 173, sớm 4,53h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
  **Kiểm số lần nối lại cẩn thận (brief giao dặn):** LIMITS
  T6-172 §7 đã đếm "lần thứ hai mươi ba" (đợt 150–172 nối liên
  tiếp); đợt này là **lần thứ hai mươi bốn** — đợt 150–173 =
  24 đợt liên tiếp.
- **Prune lần 49 (T6-174): tổng lock 100 sau prune 48 —
  kiểm lại lúc mở đợt 174** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-round120-t8-n10` đủ 7 ngày ~23/11 06:28Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-173; #82/#83 KHÔNG GIẾT HOLDER; đồng hồ ở giờ thật; POSTBOOT_PASS #83 CHƯA CÓ; LỆCH PID WATCHER-172 ĐÃ GIẢI

- Boot duy nhất trong phiên: **dd08464a** (btime
  20:25:47Z = epoch 1795379147). T6 **TỰ XÁC MINH btime**
  20:25:47Z (hai nguồn /proc/stat + `uptime -s` khớp) nhưng
  **KHÔNG tự chứng nhận** số hiệu reboot #83 (thuộc
  T0-173 — lúc T6 mở chưa có cờ `round173-t0.done`
  trên đĩa; T6 chỉ chứng nhận từ log lock).
- Uptime boot lúc đóng ~25'. `journal --list-boots`
  chỉ 1 dòng dd08464a (first entry 20:26:00Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~20:50Z, boot_id giống lúc mở; kiểm
  lại sau prune ~20:52Z, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  20:39:20Z vs local 20:39:19Z — chênh ~1 s (trong đó có
  độ trễ fetch; lúc đóng chênh ~1–2 s). Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 173
  đọc trực tiếp được.
- **REBOOT #82 (btime 19:00:48Z, boot `34e61c92` — số hiệu
  chưa được T6 chứng nhận) — KHÔNG giết holder** (§2):
  lock trống 31m09s trước btime (RELEASED cuối
  18:29:39Z); 0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch, chờ T0-173 xác nhận số hiệu — nếu được
  xác nhận, chuỗi lên 14 reboot.**
  **REBOOT #83 (ứng viên — btime 20:25:47Z, boot `dd08464a` —
  số hiệu chưa được T6 chứng nhận) — KHÔNG giết holder**
  (§2): lock trống 1h56m08s trước btime (RELEASED cuối
  18:29:39Z); 0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch, chờ T0-173 xác nhận số hiệu — nếu được
  xác nhận, chuỗi lên 15 reboot.**
  **Chuỗi "không giết holder" MỚI bắt đầu lại từ #69: 13 reboot
  (#69, #70, #71, #72, #73, #74, #75, #76, #77, #78, #79, #80, #81 — ĐÃ
  XÁC NHẬN) + #82 chờ xác nhận số hiệu (nếu #82 được xác
  nhận → 14) + #83 ứng viên (nếu #83 được xác nhận → 15).**
- **ĐỐI CHIẾU LỆCH PID WATCHER-172 — ĐÃ GIẢI, F-172-T6-5
  ĐÓNG (nhiệm vụ (d) brief giao):** 17944 và 6126 là
  **HAI watcher khác nhau**, không phải một watcher bị
  báo lệch pid:
  - pid **17944** = `replay-watch-172.sh` của **T5-172**
    (postboot replay watcher): log header
    `REPLAY-WATCH-172-START 2026-11-22T17:41:39Z pid=17944
    boot=4b9db449 … end=2026-11-22T20:30:00Z`;
    `t5-stats-172-output.txt` ghi
    `watcher172_ps=17944 bash …/round172-t5/replay-watch-172.sh`
    và `watcher172_pid17944_kill0=ALIVE`; LIMITS T5-172 ghi
    "Watcher-172 START 17:41:39Z, pid 17944".
  - pid **6126** = `b2-watcher.sh` của **T9-172** (headroom/
    balloon watcher): T6-172 ps snapshot mở/đóng đều ghi
    `6126 … bash …/round172-t9/b2-watcher.sh`;
    `round172-t9/b2-spikes.log` ghi pid 6126 hai lần.
  - Nguyên nhân lệch: hai luồng đặt tên lỏng "watcher-172"
    cho hai script khác nhau (replay-watch của T5 vs
    b2-watcher của T9) — cả hai đều đúng trong phạm vi
    của mình. Mẫu này lặp lại ở watcher-171: 28156
    (replay-watch-171 của T5 — LIMITS T5-172) vs 7295
    (b2-watcher-171 của T9 — T6-172 ghi nhận). **Kết luận:
    không có watcher nào mất/không khớp — F-172-T6-5 ĐÓNG.**
    Bài học: khi đối chiếu pid watcher, ghi rõ TÊN SCRIPT
    (replay-watch-* vs b2-watcher.sh), không chỉ gọi
    "watcher-<đợt>".
  - Vòng đời sau đó: cả hai watcher-172 đều chết theo
    reboot #82 (btime 19:00:48Z) — replay-watch-172
    (17944) poll cuối 19:01:11Z (xem F-173-T6-3);
    b2-watcher-172 (6126) không còn trên ps lúc T6-173 mở;
    T9 đã khởi động lại watcher trên #82
    (`b2-nohup-82.out` tạo 19:02Z) và trên #83
    (round173-t9/b2-watcher.sh 20:39Z, pid 2670, khởi động
    ~20:40:19Z). T5-173 watcher-status xác nhận
    replay-watch-172 pid 17944 DEAD (`kill -0: No such
    process`, log 149 dòng, poll cuối 19:01:11Z).
- **POSTBOOT_PASS #83 CHƯA CÓ lúc T6 kiểm cuối** (20:52Z,
  tìm đúng tên `round173-t5/POSTBOOT_PASS` không hậu tố —
  quy ước đã xác minh đợt 172): T5-173 đang làm
  (replay-watch-173 pid 13457 START 20:42:50Z, end
  23:30:00Z; `t5-postboot-poll0-dd08464a.log` mtime
  20:50Z). T5-173 mở lúc 20:44:28Z trên boot dd08464a
  (boot+~17m). **POSTBOOT_PASS #82 KHÔNG CÓ** — T5-173
  watcher-status ghi "POSTBOOT_PASS #82 (34e61c92): grep
  count 0 — KHONG CO" (không bao giờ được viết — watcher
  của T5-172 chết theo #82 trước khi viết cờ; T5-173 chỉ
  lo #83). T6 KHÔNG bù cờ postboot — giao T5-173.
  POSTBOOT_PASS #81 ĐÃ CÓ (17:50:32Z, repair-sớm-quyết-h,
  poll=1 — T6-172); POSTBOOT_PASS #80 ĐÃ CÓ (14:52:09Z,
  replay-đầy-đủ, poll=0 — aggregate 171).
- **Nhắc lại #60/#61/#62/#63/#64/#65/#66/#67/#68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80/#81 (để đối chiếu):** #60 ĐÃ
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
  #71 KHÔNG giết holder (lock trống 6m39s trước btime — đợt 167).
  #72 KHÔNG giết holder (lock trống 1h25m35s trước btime — đợt 167).
  #73 KHÔNG giết holder (lock trống 1h48m31s trước btime — đợt 167).
  #74 KHÔNG giết holder (lock trống 3h25m59s trước btime — đợt 168,
  DÀI NHẤT kể từ #61).
  #75 KHÔNG giết holder (lock trống 40m19s trước btime — đợt 168,
  số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 168).
  #76 KHÔNG giết holder (lock trống 53m10s trước btime — đợt 169,
  số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 168).
  #77 KHÔNG giết holder (lock trống 1h44m39s trước btime — đợt 169,
  số hiệu ĐÃ XÁC NHẬN, aggregate 169).
  #78 KHÔNG giết holder (lock trống 11m21s trước btime — đợt 170,
  số hiệu ĐÃ XÁC NHẬN, quyết (e) đợt 170).
  #79 KHÔNG giết holder (lock trống 1h22m35s trước btime — đợt 171
  kiểm lại độc lập, số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 170).
  #80 KHÔNG giết holder (lock trống 1h49m38s trước btime — đợt 171,
  số hiệu ĐÃ XÁC NHẬN quyết (d)/(h) đợt 171; T6-172 kiểm lại độc lập, KHỚP;
  T6-173 kiểm lại, KHỚP).
  #81 KHÔNG giết holder (lock trống 30m37s trước btime — đợt 172,
  số hiệu ĐÃ XÁC NHẬN theo aggregate 172).
  #82 KHÔNG giết holder (lock trống 31m09s trước btime — đợt này,
  số hiệu chưa được T6 chứng nhận).
  #83 KHÔNG giết holder (lock trống 1h56m08s trước btime — đợt này,
  ứng viên, số hiệu chưa được T6 chứng nhận).**

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng và lúc kiểm cuối: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-173
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (20:52Z 22/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 2142 dòng thô /
  2136 dòng chính thức, 601 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief; đã kiểm boot lần cuối
  ngay trước khi viết cờ).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round173-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND173_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round173-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11; đã kiểm boot lần cuối
  `dd08464a` ngay trước khi viết cờ).
- Tổng batch đợt 173 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 173 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–172 (T10-172 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-173).

## 11. GHI CHÚ CHO T10-173 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ hai mươi ba liên tiếp, tổng 2760/2760 qua 23
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 22 → 23 (lần thứ hai mươi ba xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 54 → 55 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (601 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); **#82 KHÔNG GIẾT HOLDER (lock trống
  31m09s — số hiệu chờ T0-173 xác nhận); #83 KHÔNG GIẾT HOLDER
  (lock trống 1h56m08s — ứng viên, số hiệu chờ T0-173 xác
  nhận)** — gap #81→#82 = 7.123 s; gap #82→#83 = 5.099 s
  (kiểm lại khớp). Double-acquire/STALE-LOCK GIỮ 12 — 0 ca mới cả hai (ca mới
  nhất vẫn là thu hồi #68 đợt 165, đừng đếm thành sự kiện mới).
  Prune lần 48 xóa 3 file, queue về đúng trần 100 (**KHÔNG
  PHẢI CHỜ lock** — lock trống lúc mở/lúc đóng/ngay trước
  prune/lúc kiểm cuối; +38 dòng kể từ T6-172 đóng đều là của t4 (1 chu kỳ)
  + t0-round172 (1 chu kỳ) + t8-round172 (7 chu kỳ) + t0-round173 (2 chu kỳ),
  sạch; 0 dòng nào của T6).
- **Reboot #82/#83 KHÔNG giết holder** (lock trống
  1.869 s / 6.968 s trước btime — verdict sạch).
  **#68 GIẾT holder** vẫn là phát hiện của đợt 165 (chuỗi #61–#67 đứt).
  **Đồng hồ ở giờ thật** (Cloudflare ~1 s lúc mở, ~1–2 s lúc
  đóng, gồm độ trễ fetch). Mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80/#81/#82/#83 giao T2-173.
  **Kiểm cuối đợt này: ACQUIRED 613 / RELEASED 601, 601
  cặp** (đừng mang 602/590 — đó là kiểm cuối đợt 172 —
  vào cột đợt này; bài học (r) đợt 163).
- **Double-acquire GIỮ 12, STALE-LOCK GIỮ 12 — 0 ca mới
  cả hai.** Hai con số vẫn là CÙNG MỘT sự kiện thu hồi #68 —
  T10-173 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng (quyết (v) đợt 162, quyết (r) đợt 163).
- 0 zombie thật lúc mở/lúc đóng/lúc kiểm cuối;
  X11 trống lúc mở, 3 socket X193/X194/X195 lúc đóng
  (của luồng khác đợt 173, tạo 20:47Z — trở lại 3 socket
  như đợt 172) — không phải của T6; T10-173 lưu ý khi đối chiếu log (+38 dòng
  kể từ T6-172 đóng đều là của t4 + t0-round172 + t8-round172 + t0-round173, sạch).
- **Inotify: trần `max_user_watches` nay là 63747** (giống
  trần trên #69/#70/#71/#73/#74/#75/#76/#77/#79/#80/#81). Ghi nhận theo quyết (m) đợt 146 (ghi làm chú thích, không
  hành động); T9-173 sở hữu hệ quả headroom nếu có. T6
  không suy đoán nguyên nhân đổi.
- **CAVEAT CHỒNG LẤN HARNESS/T4 (F-173-T6-1) — LẦN ĐẦU
  CHỒNG CẢ HAI PHA:** harness churn của T6
  (20:43:47–20:50:43Z) chồng lấn **pha đếm gate (pha (a))**
  của T4-173 (polls #3–#11, 20:44:13–20:50:18Z) VÀ
  **pha giữ lock (pha (b))** của T0-173 (TICKET 20:44:24Z
  → RELEASED 20:50:31Z, hold 366 s). Blockers comm-based
  trong cửa sổ là vite/WebKit thật của T0 (không phải
  churn — comm churn là "sleep"); gate0 giữ khong-dat vì
  postboot_exit=1 (độc lập với churn); T6 KHÔNG phán
  verdict attempt của T4-173.
- **LỆCH PID WATCHER-172 (nhiệm vụ (d)) — ĐÃ GIẢI, F-172-T6-5
  ĐÓNG:** 17944 = replay-watch-172.sh của T5; 6126 =
  b2-watcher.sh của T9 — hai watcher khác nhau, cả hai
  đều đúng (xem §8). T6 các đợt sau ghi rõ TÊN SCRIPT khi
  đối chiếu pid watcher.
- **POSTBOOT_PASS #83 CHƯA CÓ lúc T6 kiểm cuối** (20:52Z
  — T5-173 đang làm, replay-watch-173 pid 13457 START
  20:42:50Z); **POSTBOOT_PASS #82 KHÔNG CÓ** (T5-173 xác
  nhận grep count 0 — không bao giờ được viết). T6 không
  bù cờ postboot.
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #79/#80/#81/#82/#83 VẪN
  MỞ; #88? VẪN MỞ; mù #94? MỞ theo quyết (b) đợt 163;
  mù #95? MỞ theo quyết (b) đợt 163; mù #96? MỞ sau điều
  tra đầy đủ đợt 165 — chờ quyết parent §12.1 (m) đợt 165;
  birefnet 0 thử lần 26 (đợt 172); u2net là fallback chính thức;
  POSTBOOT_PASS #83 CHƯA CÓ — giao T5-173 theo dõi tiếp;
  kết cục run 172 thuộc T7-173).
- Cờ `round173-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-173 (F-173-T6-n)

- **F-173-T6-1 — Harness churn của T6 chồng lấn CẢ PHA ĐẾM
  GATE của T4-173 VÀ PHA GIỮ LOCK của T0-173 (lần đầu
  chồng cả hai pha trong một đợt).** Harness
  `t7-control-a173.sh` chạy 20:43:47–20:50:43Z;
  poll-wait của T4-173 bắt đầu 20:42:43Z; các poll #3–#11
  (20:44:13–20:50:18Z) nằm trong cửa sổ harness; gate0=khong-dat trong cả 12 poll
  tới 20:51:04Z; 0 TICKET của T4-173 được lấy tới lúc kiểm
  cuối 20:52Z — T4-173 chưa bước vào pha giữ lock (pha (b))
  trong phiên T6; ngược lại T0-173 ĐÃ ở pha (b) gần trọn
  cửa sổ harness (TICKET 20:44:24Z → RELEASED 20:50:31Z,
  hold 366 s). Mỗi lần chạy harness bơm 1 process
  `WebProcess-churn` (`sleep` 1,5 s, tên khớp mẫu poll) sau
  delay ngẫu nhiên 0,5–3,5 s. Đánh giá ảnh hưởng: (i)
  blockers comm-based trong cửa sổ (#3=0, #4=2, #5–#9=4,
  #10–#11=1) là vite/WebKit thật của T0-173 — churn không
  được đếm là blocker vì comm của process `exec -a …
  sleep` vẫn là "sleep"; số legacy trong cửa sổ
  (0,4,7,6,7,6,7,1,2) ở mức hoặc thấp hơn poll #2 trước
  harness (legacy 6) — không có dấu hiệu churn làm phồng
  số đếm; (ii) gate0 giữ khong-dat vì lý do độc lập với churn
  (postboot_exit=1 — POSTBOOT_PASS #83 chưa có lúc kiểm
  cuối; t5flag=cu — cờ cũ của 172-t5; apt=1 trong các
  poll #1–#9, apt=2 ở poll #10) — churn không gây gate pass
  giả, cũng không chặn một gate pass nào; (iii) load1 trong
  cửa sổ 3,23/6,92/4,32/5,06/2,82/1,47/0,90/0,76/0,56 —
  cao lúc đầu rồi hạ dần; tải cao trùng lúc T0 khởi động
  WebKit (20:44–20:46Z) và T5-173 hoạt động (dpkg_lines
  2 → 323 ở polls #8–#11); churn chỉ là `sleep` trần —
  không CPU, không chạm trình duyệt, ảnh hưởng load trong
  lúc poll là không đáng kể. **T6 KHÔNG phán verdict
  attempt của T4-173.**
  Ảnh hưởng tới verdict lock/(A)/prune của T6: không có
  (log +6 dòng trong phiên đều là chu kỳ hoàn tất của
  t0-round173; harness 120/120 trên /tmp).
- **F-173-T6-2 — Lệch pid watcher-172 ĐÃ GIẢI: 17944 ≠ 6126
  vì đó là HAI watcher khác nhau (F-172-T6-5 ĐÓNG).**
  17944 = `replay-watch-172.sh` của T5-172 (postboot replay
  watcher, START 17:41:39Z, end 20:30:00Z); 6126 =
  `b2-watcher.sh` của T9-172 (headroom watcher). Bằng chứng:
  log header replay-watch-172 + `t5-stats-172-output.txt`
  (`watcher172_ps=17944 bash …/replay-watch-172.sh`) +
  LIMITS T5-172 đối chiếu với ps snapshot của T6-172
  (`6126 … bash …/round172-t9/b2-watcher.sh`) +
  `round172-t9/b2-spikes.log` (pid 6126). Mẫu lặp lại ở
  watcher-171: 28156 (replay-watch-171, T5) vs 7295
  (b2-watcher-171, T9). Bài học: khi đối chiếu pid
  watcher, ghi rõ TÊN SCRIPT (replay-watch-* vs
  b2-watcher.sh), không chỉ gọi "watcher-<đợt>".
- **F-173-T6-3 — Replay-watch-172 poll cuối 23 s SAU btime
  #82 (hiện tượng F-172-T5-1 lặp lại trên reboot mới).**
  `round172-t5/replay-watch-172.log` (149 dòng): poll cuối
  19:01:11Z vẫn ghi boot=4b9db449 trong khi btime #82 là
  19:00:48Z — process của boot cũ còn poll được 23 s sau
  btime mới. T5-173 watcher-status xác nhận độc lập:
  pid 17944 DEAD lúc mở T5-173, log 149 dòng, poll cuối
  19:01:11Z. Cùng họ với F-172-T5-1 (watcher-171 poll cuối
  20 s sau btime #81) và bài học F-171-T10-2 (boot_id cũ
  còn đọc được 20 s sau btime mới). T6 chỉ ghi nhận —
  phân loại mù/khoảng không-watcher thuộc T2-173.
- **F-173-T6-4 — POSTBOOT_PASS #82 KHÔNG BAO GIỜ ĐƯỢC VIẾT;
  POSTBOOT_PASS #83 CHƯA CÓ lúc T6 kiểm cuối.**
  T5-173 watcher-status: "POSTBOOT_PASS #82 (34e61c92):
  grep count 0 — KHONG CO". Watcher replay-172 của T5-172
  chết theo #82 (poll cuối 19:01:11Z) trước khi kịp viết
  cờ cho #82; T5-173 chỉ lo #83 (mở 20:44:28Z,
  replay-watch-173 pid 13457, end 23:30:00Z). T6 tìm đúng
  tên không hậu tố `round173-t5/POSTBOOT_PASS` lúc kiểm
  cuối 20:52Z — không tồn tại (chỉ có
  `t5-postboot-poll0-dd08464a.log` mtime 20:50Z). T6 KHÔNG
  bù cờ — giao T5-173.
- **F-173-T6-5 — Chu kỳ probe 1 s của T0-173 rơi vào giữa
  snapshot đóng và prune (không ảnh hưởng prune).**
  TICKET/ACQUIRED 20:51:50Z → RELEASED 20:51:51Z (hold 1 s,
  `o8-probe-lock.log` xác nhận "ĐÃ NHẢ … giữ 1s"); rm
  prune chạy 20:51:52Z — 1 s SAU khi lock đã nhả. Lock
  TRỐNG tại thời điểm prune (status-before-prune TRỐNG +
  RELEASED 20:51:51Z trước rm 1 s). Nếu T6 chỉ đếm log lúc
  đóng (2133 dòng) thì đã bỏ sót 3 dòng này — bài học:
  đếm lại log ở bước kiểm cuối sau prune (như đợt này:
  kiểm cuối 2136 dòng, 601 cặp).
- **F-173-T6-6 — Lệnh md5 đầu phiên của T6 dùng sai tên
  file script lock (`vite-lock-v2.sh` thay vì
  `vcut-vite-lock-v2.sh`).** File `vite-lock-v2.sh` không
  tồn tại trong `apps/web/scripts/`; tên đúng (có tiền tố
  `vcut-`) đã có trong `md5-open.txt` của T6-172
  (`vcut-vite-lock-v2.sh` 520b8baa, `vcut-vite-lock.sh`
  fd21193c). T6 sửa ngay trong phiên: đo lại tươi cả 5 md5
  bằng đúng đường dẫn ở cả ba mốc mở/đóng/kiểm cuối — tất
  cả khớp baseline. Không ảnh hưởng kết quả. Bài học: đọc
  `md5-open.txt` của đợt trước TRƯỚC khi gõ lệnh md5.
- **F-173-T6-7 — Prune lần 48 xóa 3 file (lần đầu xóa 3
  file kể từ đợt 171 xóa 2).** Lúc mở 102 file (do 2 file
  mới của đợt 172) + 1 file mới trong phiên
  (`cooldown-t0-round173` 20:50:31Z) = 103 lúc đóng; điều
  (b) xóa 3 file cũ nhất tới khi còn 100. Không phải lỗi
  đếm: số học 100 + 2 + 1 − 3 = 100 khớp (§2/§7); 3 file
  xóa đều ≥48h (158,51–163,47h), không thuộc đợt hiện tại/
  đợt ngay trước, và bị xóa trước mốc 7 ngày (sớm
  4,53–9,49h) — chuỗi F-147-T6-1 nối lại lần thứ 24.
  Bài học (nối F-172-T6-6): T6 các đợt sau cứ đếm đúng số
  file lúc đóng trước khi prune, không giả định số file xóa.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a173-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round173-t6/appendix-numbers.txt` giữ bản
trích gốc (tuổi prune tính từ đúng epoch giờ prune trong
`prune-time.txt` — bài học F-164-T6-1; md5 live-code chỉ
tính bằng pipeline shell đứng sau khi bắt lỗi F-164-T6-2):

```
churn: n_runs=120 pass=120 fail=0 B1=1:120 B2=0:120
churn delay_ms: min=506 max=3358 mean=1918.13
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
churn harness: 2026-11-22T20:43:47Z -> 2026-11-22T20:50:43Z (~6m56s), boot dd08464a
suite window: 2026-11-22T20:41:26Z -> 2026-11-22T20:43:38Z
suite run1: PASS=9 FAIL=0 T7A=1 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 rc=0
log lock (bản đã lọc): open raw 2136 / cleaned 2130; close raw 2139 / cleaned 2133; final raw 2142 / cleaned 2136
delta kể từ T6-172 đóng: +38 dòng = TICKET +11 ACQUIRED +11 RELEASED +11 COOLDOWN +5
kiểm cuối: ACQUIRED 613 / RELEASED 601, 601 cặp, 0 đang giữ, double-acquire 12, STALE-LOCK 12
gap #80->#81: 9064 s; gap #81->#82: 7123 s; gap #82->#83: 5099 s; lock trống trước btime #82: 1869 s; trước btime #83: 6968 s
prune 20:51:52Z epoch 1795380712: xóa cooldown-t3-round119 (163,47h, sớm 4,53h) + cooldown-t10-round119 (162,61h, sớm 5,39h) + cooldown-round120-t8-e1 (158,51h, sớm 9,49h); queue 103 -> 100 file / 1400 byte
POSTBOOT_PASS #83: CHƯA CÓ lúc kiểm cuối 20:52Z (round173-t5/POSTBOOT_PASS không tồn tại; T5-173 đang làm, watcher replay-watch-173 pid 13457 START 20:42:50Z)
T4-173 poll: poll-wait bắt đầu 20:42:43Z; polls #3–#11 (20:44:13–20:50:18Z) trong cửa sổ harness 20:43:47–20:50:43Z; gate0=khong-dat cả 12 poll tới 20:51:04Z; T4-173 0 TICKET; T0-173 giữ lock pha (b) 20:44:25–20:50:31Z (366s) + probe 1s 20:51:50–51Z
```
