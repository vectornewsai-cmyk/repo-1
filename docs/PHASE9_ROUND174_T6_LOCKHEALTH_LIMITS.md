# PHASE9 ROUND174 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 24 LIÊN TIẾP) + #84/#85 KHÔNG GIẾT HOLDER + prune lần 49: XÓA 2 FILE — LIMITS

- Đợt: 174, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 06:35:51 +07 23/11/2026 (= 23:35:51Z 22/11).
  Chạy 23:42Z → 23:56Z 22/11/2026. Lúc mở đã ở trên boot
  `3c704685` (btime 22:59:36Z) — boot này là #85 ứng viên
  theo brief giao (btime 22:59:36Z); T6 TỰ XÁC MINH
  btime 22:59:36Z từ /proc/stat + `uptime -s` (cả hai khớp)
  nhưng KHÔNG tự chứng nhận số hiệu #85 (thuộc T0-174),
  chỉ chứng nhận từ log lock rằng #84/#85 KHÔNG giết
  holder (xem §2/§8); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm (A) 120/120 lần thứ 24
  (chuỗi xanh kép đang 23; tổng 2880/2880 nếu sạch);
  (b) #85 CÓ GIẾT HOLDER KHÔNG (nợ từ đợt 173 — T6-173
  đóng trước #85; lock trống bao lâu trước btime #85
  22:59:36Z; chuỗi "không giết holder" từ #69 đang
  15 reboot (#69–#83)); (c) prune lần 49 theo đúng quy
  tắc prune các đợt trước (đợt 173 prune 48 xóa 3 file,
  queue 103→100 — ghi số thực tế; prune KHÔNG chờ lock);
  (d) đối chiếu pid watcher nếu có lệch (bài học
  F-172-T6-5: hai watcher khác nhau đều đúng — ghi rõ
  watcher nào là gì trước khi kết luận lệch);
  (e) ghi mọi phát hiện/sai số dạng F-174-T6-*.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–173,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–173); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (610 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 12, STALE-LOCK GIỮ 12
  (0 ca mới cả hai kỳ vọng). Reboot #84 KHÔNG giết holder
  (lock trống 8m38s trước btime — PHÁT HIỆN MỚI, T6-173
  đóng trước #84; số hiệu chờ T0-174 xác nhận);
  #85 (ứng viên, btime 22:59:36Z) KHÔNG giết holder
  (lock trống 7m33s trước btime — số hiệu chờ T0-174
  xác nhận; nếu cả hai được xác nhận → chuỗi lên 17 reboot).
  Prune lần 49: xóa 2 file cũ nhất (điều (b)) — queue 102 →
  100 file — KHÔNG PHẢI CHỜ lock (lock TRỐNG lúc mở, lúc
  đóng, ngay trước prune và lúc kiểm cuối — giống đợt
  167/168/169/170/171/172/173). Lệch pid watcher: KHÔNG CÓ
  lệch nào cần giải — 11084 = `b2-watcher.sh` của T9-174,
  12991 = `replay-watch-174.sh` của T5-174 (xem §8).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round174-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  boot-verify-final.txt, time-open.txt, time-close.txt,
  time-final.txt, time-open-cloud.txt, time-close-cloud.txt,
  queue-open.txt, queue-close.txt, queue-final.txt,
  queue-oldest-true.txt,
  prune-candidates.txt, vite-lock-v2-cleaned-open.log,
  vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, vite-lock-v2-raw-final.log,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt, analyze-log.py,
  new-lines-since-t6-173.txt, prune-deleted.txt, prune-time.txt,
  suite-start.txt, suite-end.txt, harness-start.txt,
  harness-end.txt, inotify-open.txt, inotify-close.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  status-final.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a174.sh,
  t7-block-a174.sh,
  t7-a174-churn.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 3c704685 (btime 22:59:36Z); lock TRỐNG; queue 101 file (T6-173 đóng 100 + 1 file mới)

- **Boot lúc mở, lúc đóng và lúc kiểm cuối: boot_id
  `3c704685-a16c-4b61-8573-af6eb7cb48c6`, btime 22:59:36Z
  theo /proc/stat** (epoch 1795388376; `uptime -s` =
  22:59:36; `journal --list-boots` chỉ 1 dòng 3c704685,
  first entry 22:59:48Z). Uptime ~42' lúc T6 bắt đầu
  (23:42Z), ~54' lúc snapshot đóng (23:54Z), ~56' lúc kiểm
  cuối (23:56Z). Boot này là #85 ứng viên theo brief giao /
  aggregate 173 §7 (T7 xác minh 9 nguồn, btime 22:59:36Z;
  gap #84→#85 = 7.101 s) —
  **T6 TỰ XÁC MINH btime 22:59:36Z** (hai nguồn độc lập
  /proc/stat + `uptime -s` khớp nhau) nhưng **KHÔNG tự
  chứng nhận số hiệu #85** (thuộc T0-174); T6 chỉ chứng
  nhận từ log lock rằng #84/#85 KHÔNG giết holder (xem
  §2/§8). **KHÔNG có reboot trong phiên T6** (boot_id
  giống nhau lúc mở, lúc đóng và lúc kiểm cuối sau prune).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sun, 22 Nov 2026 23:42:07 GMT` vs local 23:42:05Z
  (**chênh ~1–2 s — đồng hồ ở giờ thật**, trong đó có độ trễ
  fetch curl ~1–2 s); lúc đóng Cloudflare ~23:54:07Z vs
  local 23:54:05Z (chênh ~1–2 s, cùng họ lúc mở, không phải
  lệch đồng hồ). Các mốc wall đợt 174 đọc trực tiếp được.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Tên file script lock đúng là `vcut-vite-lock-v2.sh` /
  `vcut-vite-lock.sh` (có tiền tố `vcut-` — bài học
  F-173-T6-6 đã áp dụng: đọc `md5-open.txt` đợt trước
  trước khi gõ lệnh md5 — đợt này không sai tên).
  Lưu ý phương pháp: `md5-open.txt`/`md5-close.txt`/
  `md5-final.txt` đều là đo tươi từ đĩa bằng `md5sum`
  trực tiếp (không copy file md5 qua lại — bài học
  F-163-T6-1); cả ba khớp nhau từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp số học
  từ T6-173 đóng: 100 sau prune 48 + 1 file cooldown mới
  `cooldown-t8-round173` (mtime 22:52:03Z) (§2). File
  `cooldown-t0-round173` được ghi đè mtime mới 20:52:37Z
  (chu kỳ t0-round173 20:52:25–37Z, §2) — ghi đè tại chỗ,
  không đổi số lượng.

## 1. Quét zombie: 0 zombie thật lúc mở, lúc đóng và lúc kiểm cuối; 0 vite thật của T6; X11 trống lúc mở, 3 socket lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 23:42Z
  (mở, `ps-full-open.txt`) và lúc 23:54Z
  (đóng, `ps-full-close.txt`); kiểm lại zombie lúc kiểm
  cuối 23:56Z bằng `ps -eo stat` (đếm ` Z `).
- **Lúc mở, lúc đóng và lúc kiểm cuối: 0 zombie thật.**
  `grep -c defunct` trên snapshot mở cho 0 — không còn
  false positive kiểu F-172-T6-2 (lệnh chụp snapshot đợt
  này không chứa chuỗi "defunct"). 0 process dpkg/apt nào
  trên bảng ps của T6 lúc mở hay lúc đóng (apt=1/2 trong
  log poll của T4-174 là hoạt động apt của T5-174
  repair — xem §6 — không phải process dpkg/apt trên
  bảng ps của T6).
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống
  hoàn toàn; 0 dòng chứa chuỗi "vite" ngoài chính lệnh
  exec của T6 trong snapshot ps lúc mở.
  **Lúc đóng: 0 vite thật của T6** — T6 không khởi động
  Xvfb/vite nào, không kill process nào trong phiên này.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #85 đã dọn
  sạch socket của đợt 173).
  **Lúc đóng: 3 socket X193 / X194 / X195, tạo
  23:45Z** — của T0-174 (Xvfb cho O8, khởi động trong
  phiên; T6 không khởi động Xvfb/vite nào, không đụng
  tới các process này). Trở lại 3 socket như đợt 172/173.
- **Watcher-174: `b2-watcher.sh` pid 11084 (round174-t9) và
  `replay-watch-174.sh` pid 12991 (round174-t5) đều có mặt
  lúc mở và lúc đóng** — b2-watcher-174 khởi động ~23:38Z
  (etime 03:29 lúc 23:42Z), replay-watch-174 START
  ~23:42Z (etime 00:05 lúc 23:42Z) — cả hai sau khi
  đợt mở 23:35:51Z, bình thường; T6 chỉ ghi nhận. Xem
  §8 về hai loại watcher khác nhau (bài học F-172-T6-5).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-174).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (~23:42Z và ~23:54Z) — **GIỐNG trần trên #69, #70,
  #71, #73, #74, #75, #76, #77, #79, #80, #81, #82 và #83**
  (theo T9-168/T6-168/T6-169/T6-170/T6-171/T6-172/T6-173);
  khác 63756 trên #67 (T6-164 đo) — xem §11, ghi nhận, không
  hành động.
- Tải hệ thống trong phiên: các luồng đợt 174 khởi động
  dần (T9 watcher ~23:38Z, T4 poll-wait từ 23:41:17Z,
  T5 replay-watch ~23:42Z, T0 giữ lock 23:43:42–23:47:50Z
  chạy O8, Xvfb 23:45Z — xem §2/§6) — harness churn
  vẫn 120/120 (xem §6).
  Suite đợt này chạy ~30 s/lượt (cửa sổ 6 lượt
  23:43:06Z → 23:46:06Z, ~3m00s; đợt 173: ~22 s/lượt —
  chậm hơn ~8 s/lượt, có thể do tải hệ thống lúc T0/T5
  khởi động song song; không ảnh hưởng kết quả — 9/9 × 6).

## 2. Lock lúc mở: TRỐNG; +32 dòng kể từ T6-173 đóng — TẤT CẢ SẠCH, 9 CHU KỲ MỚI HOÀN TẤT (8 TRƯỚC PHIÊN + 1 TRONG PHIÊN); #84/#85 KHÔNG GIẾT HOLDER (PHÁT HIỆN MỚI: CẢ HAI)

- **Lúc mở (23:42Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (23:54Z): lock vẫn TRỐNG** — status
  `TRỐNG`, `0 ticket + 102 cooldown` (1 file cooldown mới
  trong phiên — của chu kỳ t0-round174 RELEASED 23:47:50Z,
  §7). **Lúc kiểm cuối sau prune (23:56Z): lock TRỐNG**,
  `0 ticket + 100 cooldown`.
  **Prune KHÔNG PHẢI CHỜ** (xem §7): lock trống lúc mở,
  lúc đóng, ngay trước prune (`status-before-prune.txt`
  ~23:55Z) và lúc kiểm cuối (`status-final.txt` 23:56Z) —
  giống đợt 167/168/169/170/171/172/173.
  Lưu ý: trong phiên T6-174 có **1 chu kỳ lock** của luồng
  khác (t0-round174, §2 dưới) — hoàn tất TRƯỚC khi prune
  (RELEASED 23:47:50Z, rm prune 23:55:54Z — cách 8m04s).
- **Log lock +32 dòng kể từ T6-173 đóng** (raw 2142 lúc
  T6-173 đóng → 2171 lúc T6-174 mở → 2174 lúc snapshot
  đóng → 2174 lúc kiểm cuối): 29 dòng trước phiên T6
  (20:52–22:52Z); **+3 dòng trong phiên T6-174**
  (23:43–23:47Z — 1 chu kỳ t0-round174, hoàn tất).
- Đối chiếu 29 dòng trước phiên (khớp đúng từng dòng, file
  `new-lines-since-t6-173.txt`, dòng thô 2143–2171):
  - t0-round173: 3 dòng — 1 chu kỳ (TICKET/ACQUIRED
    20:52:25Z → RELEASED 20:52:37Z, hold 12 s) — chu kỳ
    bắt đầu 25 s SAU kiểm cuối của T6-173 (20:52Z); T6-173
    không bỏ sót (kiểm cuối của họ đúng lúc 20:52Z).
  - t8-round173: 26 dòng — 7 chu kỳ bắt đầu (22:32:06Z →
    22:48:12Z); **7 chu kỳ HOÀN TẤT** (holds 162 / 70 /
    131 / 240 / 61 / 121 / 231 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14937–14970 ms trên cổng 5490/5390); 0 chu kỳ
    dở dang.
  - Tổng trước phiên: Δ TICKET +8, Δ ACQUIRED +8, Δ RELEASED +8,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **8/8 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ dở dang.**
- Đối chiếu 3 dòng trong phiên (dòng thô 2172–2174):
  - t0-round174: 3 dòng — 1 chu kỳ (TICKET/ACQUIRED
    23:43:42Z wait 0 s → RELEASED 23:47:50Z, hold 248 s,
    port 5560) — T0-174 chạy O8 trong lúc giữ lock
    (WebKit 21/21 ×2 + Chromium 21/21, exit 0 — xem §6;
    T4-174 polls #5–#9 ghi lock=co pid 18582, port 5560 —
    khớp ticket `1-179539102281…`, §6).
  - Tổng trong phiên: Δ TICKET +1, Δ ACQUIRED +1, Δ RELEASED +1,
    Δ COOLDOWN +0. **1/1 chu kỳ trong phiên hoàn tất
    sạch; 0 chu kỳ dở dang.**
- **REBOOT #84 (btime 21:01:15Z 22/11, boot `4ae2d2ea` —
  số hiệu CHƯA được T6 chứng nhận, thuộc T0-174; btime
  lấy từ aggregate 173 §7 (T7 xác minh 9 nguồn) — T6 KHÔNG
  tự xác minh btime này từ máy vì boot đã qua) — KHÔNG giết
  holder nào (PHÁT HIỆN MỚI CỦA T6-174 — T6-173 đóng
  trước #84 nên chưa ai chứng nhận từ log lock):** dòng lock
  cuối trước reboot là t0-round173 RELEASED 20:52:37Z
  (hold 12 s); dòng đầu sau reboot: KHÔNG CÓ (0 dòng log
  trong cửa sổ mở (20:52:37Z, 21:01:15Z) — dòng tiếp theo
  là t8-round173 TICKET 22:32:06Z) — tức lock trống
  **8m38s (518 s) trước reboot**. Không có ACQUIRED nào
  chưa release tại thời điểm #84, 0 STALE-LOCK mới sau #84.
  **Kết luận: #84 không giết holder nào — verdict sạch
  (khoảng trống 518 s; số hiệu #84 chờ T0-174 xác
  nhận — nếu được xác nhận, chuỗi lên 16 reboot).**
- **REBOOT #85 (ứng viên — btime 22:59:36Z 22/11, boot
  `3c704685` — số hiệu CHƯA được T6 chứng nhận, thuộc
  T0-174; btime TỰ XÁC MINH bởi T6: /proc/stat btime
  1795388376 + `uptime -s` 22:59:36Z khớp nhau) — KHÔNG
  giết holder nào (PHÁT HIỆN MỚI CỦA T6-174, đúng nhiệm
  vụ (b) brief giao):** dòng lock cuối trước reboot vẫn là
  t8-round173 RELEASED 22:52:03Z (hold 231 s); dòng đầu sau
  reboot: KHÔNG CÓ (0 dòng log trong cửa sổ mở
  (22:52:03Z, 22:59:36Z) — dòng tiếp theo là t0-round174
  TICKET 23:43:42Z) — tức lock trống **7m33s (453 s)
  trước reboot**. Không có ACQUIRED nào chưa release tại
  thời điểm #85, 0 STALE-LOCK mới sau #85.
  **Kết luận: #85 không giết holder nào — verdict sạch
  (khoảng trống 453 s; số hiệu #85 chờ T0-174 xác
  nhận — nếu được xác nhận, chuỗi lên 17 reboot).**
- **Gap #83→#84 = 2.128 s** (35m28s; 20:25:47Z →
  21:01:15Z — T6-174 tính từ btime, KHỚP aggregate 173 §7).
  **Gap #84→#85 = 7.101 s** (1h58m21s; 21:01:15Z →
  22:59:36Z — T6-174 tính từ btime, KHỚP aggregate 173 §7).
  **Gap #82→#83 = 5.099 s** (T6-173 tính, T0-173 xác nhận).
- **File cooldown mới kể từ T6-173 đóng:
  `cooldown-t8-round173` (mtime 22:52:03Z)** — 1 file làm
  tổng queue tăng 100 → 101. Số học khớp: 100 + 1 = 101 ✓.
  Trong phiên T6-174 thêm 1 file `cooldown-t0-round174`
  (mtime 23:47:50Z) → 102 trước prune (§7). File
  `cooldown-t0-round173` được ghi đè mtime mới 20:52:37Z
  (chu kỳ t0-round173 20:52:25–37Z) — ghi đè tại chỗ, không
  đổi số lượng. Các file cooldown đợt 173/174 được bảo vệ
  bởi điều (c) — không nằm trong diện xóa của điều (b).

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 344 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 9 chu kỳ hoàn tất
  kể từ T6-173 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 335 chu kỳ T6-173 đã đếm = **344 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (335 đợt
    173 + 9 đợt này). Chu kỳ bị #68 giết KHÔNG tính
    vào số hoàn tất (nó là bằng chứng reboot giết holder,
    không phải lỗi thứ tự ghi — STALE-LOCK thu hồi đúng).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 2168 dòng chính thức lúc kiểm cuối, 610 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — bản đã lọc
= raw trừ đúng 6 dòng đó, lọc bằng `awk '$2!="tA" &&
$2!="tH"'` — cột owner là $2, bài học F-162-T6-1;
diff bản đã lọc mở/đóng/final giống nhau về nội dung cũ —
32 dòng mới kể từ T6-173 đóng + 3 dòng trong phiên tới lúc
đóng (chu kỳ t0-round174, §2); analyzer chạy trên bản đã lọc).
Bản đã lọc lúc đóng: **2168 dòng** (raw 2174) — **+32 dòng
kể từ T6-173 đóng** (2136 → 2168; 29 trước phiên + 3 trong
phiên tới lúc đóng, đều đã đối chiếu §2). Kiểm cuối sau
prune (23:56Z 22/11): bản đã lọc **2168 dòng** (raw 2174),
RELEASED 610, cặp 610, đang giữ 0, double-acquire 12 —
prune không đụng log nên số kiểm cuối = số lúc đóng (0 dòng
mới giữa đóng và kiểm cuối).

| Chỉ số (bản đã lọc) | T6-172 đóng | T6-173 đóng | T6-174 mở | T6-174 đóng (snapshot) | Δ trong phiên T6-174 (tới kiểm cuối) |
|---|---|---|---|---|---|
| Tổng dòng | 2098 | 2136 | 2165 | 2168 | +3 (tới kiểm cuối 2168) |
| TICKET | 613 | 624 | 632 | 633 | +1 |
| ACQUIRED | 602 | 613 | 621 | 622 | +1 |
| RELEASED | 590 | 601 | 609 | 610 | +1 |
| COOLDOWN | 270 | 275 | 280 | 280 | +0 |
| STALE-LOCK | 12 | 12 | 12 | 12 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 590 | 601 | 609 | 610 | +1 (610 lúc kiểm cuối) |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 | — |
| Double-acquire | 12 | 12 | 12 | 12 | 0 mới trong phiên |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 622 / RELEASED 610, 610 cặp.** Các số 613/601
  là kiểm cuối đợt 173 (không phải đợt này); 602/590 là
  kiểm cuối đợt 172. Bảng trên dùng đúng ba số này (đã đối
  chiếu với bảng §4 của LIMITS T6-172 và T6-173 — cả hai tự
  nó đúng).
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối (sau
  prune):** ACQUIRED 622 − RELEASED 610 = 12
  ACQUIRED chưa release trong lịch sử log — nhưng cả 12 đều
  đã được xử lý: 11 ca cũ (10 ca double-acquire cũ + 1 ca
  t8-round159 03:12:16Z STALE-LOCK thu hồi holder bị #60 giết
  — §8 đợt 160) + 1 ca t4 19:16:47Z (STALE-LOCK thu hồi holder
  bị #68 giết — §2 đợt 165). Analyzer xác nhận `still held
  at end of log: 0` ở cả ba snapshot mở/đóng/kiểm cuối. Lock
  TRỐNG lúc mở, lúc đóng và lúc kiểm cuối — status
  xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 12 — 0 ca mới kể từ T6-173 đóng,
  0 ca mới trong phiên T6-174.** Ca mới nhất vẫn là
  analyzer dòng 1843 (bản đã lọc — t4 ACQUIRED 19:16:47Z sau
  STALE-LOCK cùng giây, thu hồi holder bị #68 giết — §2 đợt 165).
  **Kết luận: 0 double-acquire THẬT mới.** STALE-LOCK GIỮ 12 —
  0 ca mới (ca mới nhất vẫn 19:16:47Z, thu hồi #68).
  **Hai con số là CÙNG MỘT sự kiện thu hồi #68, không phải hai
  sự kiện riêng** (nhắc lại từ đợt 160/161/162/163/164/165/166/167/168/169/170/171/172/173,
  quyết (v) đợt 162, quyết (r) đợt 163).
- **0 double-acquire mới** kể từ T6-173 đóng. 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (9 chu kỳ mới sạch kể từ T6-173 đóng,
  0 chu kỳ dở dang ngoài ca bị #68 giết đã thu hồi),
  0 zombie thật lúc mở/lúc đóng/lúc kiểm cuối, 0 stale mới trong phiên, queue 0 ticket,
  log nhất quán (610 cặp + 0 đang giữ lúc kiểm cuối, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–174 (toàn đợt) và đợt 174 (tới ~23:56Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **344 chu kỳ thật** chứng minh (§3).
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
  đợt 173, số hiệu ĐÃ XÁC NHẬN theo brief đợt 174 —
  chuỗi 15 reboot #69–#83 đã tính #82);
  **reboot #83 KHÔNG giết holder** (khoảng trống 6.968 s —
  đợt 173, số hiệu ĐÃ XÁC NHẬN — T0-173 `.done`
  "boot dd08464a (#83, XAC NHAN 9 nguon)");
  **reboot #84 KHÔNG giết holder** (khoảng trống 518 s —
  đợt này, số hiệu chờ T0-174 xác nhận);
  **reboot #85 KHÔNG giết holder** (khoảng trống 453 s —
  đợt này, ứng viên, số hiệu chờ T0-174 xác nhận);
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
  T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169/T6-170/T6-171/T6-172/T6-173 §6.2.
  File khối T7 đã trích `t7-block-a174.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172 và 173 (cùng md5). Harness đợt này chạy đúng code (A)
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
  gì trong phiên (chỉ xóa 2 file cooldown theo luật
  prune đã phê duyệt — §7; không đụng code).
- `bash -n` harness t7-control-a174.sh: OK (bản sao của
  t7-control-a173.sh, chỉ đổi hậu tố a173 → a174).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–173 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ hai mươi bốn liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~23:43–23:46Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (cửa sổ 6 lượt
23:43:06Z → 23:46:06Z, ~3m00s — chậm hơn đợt 173
~8 s/lượt, xem §1; tương đương đợt 172:
21–25 s/lượt + tải hệ thống).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp
(`/tmp/vcut-lock-v2-test.*`, owner test `tH2`) — 0 dòng
nào của T6 trên log lock thật trong phiên (3 dòng mới
trong phiên đều là chu kỳ t0-round174, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round174-t6/t7-control-a174.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169/T6-170/T6-171/T6-172/T6-173 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 3c704685 (#85 ứng
viên, btime 22:59:36Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a174.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172 và 173; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay. `diff` khối trích vs đoạn suite
  giữa hai marker: KHỚP từng dòng.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a174-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 552 ms, max 3497 ms, trung bình 2088,32 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7m15s (23:46:25–23:53:40Z).
- **CAVEAT CHỒNG LẤN HARNESS/T4 — ÁP DỤNG QUY TẮC WORDING
  QUYẾT (h) ĐỢT 171 (F-171-T6-1) — xem F-174-T6-1:**
  Quy tắc wording: khi mô tả quan hệ poll/gate/harness,
  tách riêng hai pha của một attempt và ghi rõ cửa sổ
  chồng lấn với từng pha: (a) **pha đếm gate** (poll → lấy
  TICKET — gate chưa qua thì chưa có TICKET); (b) **pha giữ
  lock** (TICKET → RELEASED — attempt đang chạy). Đợt này
  harness 23:46:25–23:53:40Z chồng lấn **CẢ HAI PHA —
  lần thứ hai liên tiếp chồng cả (a) lẫn (b) trong một đợt**
  (đợt 173 là lần đầu; đợt 171 chỉ chồng pha (b); đợt 172
  chỉ chồng pha (a)):
  pha (a) của T4-174 (poll-wait bắt đầu 23:41:17Z; các
  poll #8–#17, 23:46:38–23:53:26Z, nằm TRONG cửa sổ
  harness; poll #18 23:54:12Z sau harness) VÀ pha (b)
  của T0-174 (TICKET 23:43:42Z → RELEASED 23:47:50Z,
  hold 248 s — 23:46:25–23:47:50Z, ~85 s đầu cửa sổ
  harness, nằm trong pha (b); T4-174 polls #5–#9 ghi
  lock=co pid 18582 port 5560 ticket
  `1-179539102281…` khớp đúng ticket này).
  Bằng chứng đợt này (`round174-t4/poll-t4.log`):
  gate0=khong-dat ở poll #8 (23:46:38Z) rồi **T5 từ poll
  #9 (23:47:23Z)** — do T5-174 viết POSTBOOT_PASS #85 lúc
  23:46:57Z (repair-tay-T5, poll=1 — xem F-174-T6-4),
  KHÔNG liên quan churn;
  **0 TICKET nào của T4-174 được lấy tới poll #18
  (23:54:12Z)** — T4-174 chưa hề bước vào pha (b) trong
  phiên T6. Đánh giá ảnh hưởng: (i) blockers comm-based
  trong cửa sổ: #8=0, #9=1, #10–#17=0 — số 1 ở #9 là
  vite THẬT của T0-174 trên cổng 5554 (blockers-list-9.txt:
  pid 32650 `node …/vite … --port 5554`, O8 của T0),
  không phải churn (process churn là `exec -a
  WebProcess-churn sleep 1,5 s`, comm vẫn là "sleep" nên
  không được đếm là blocker theo cách đếm comm-based của
  T4); số legacy trong cửa sổ (1,1,1,1,1,0,1,1,1,0) ở mức
  hoặc thấp hơn poll #5–#7 trước harness (legacy 8/11/11)
  — không có dấu hiệu churn làm phồng số đếm; (ii) gate0
  lật khong-dat→T5 trong cửa sổ harness vì POSTBOOT_PASS
  #85 được T5-174 viết lúc 23:46:57Z (độc lập với churn —
  churn chỉ chạm /tmp, không viết cờ postboot); T4 vẫn
  0 ticket tới poll #18 — churn không gây ra gate pass
  giả, cũng không chặn một gate pass nào (lý do T4 chưa
  lấy ticket — ví dụ RAMavail 968 MB < 1024 MB ở poll #18
  — thuộc T4/T10, T6 chỉ ghi số); (iii) load1 trong cửa
  sổ 0,89 / 1,47 / 4,86 / 6,09 / 4,10 / 2,55 / 1,20 /
  0,86 / 1,90 / 1,96 — spike #10–#12 (4,86/6,09/4,10)
  rơi SAU khi T0 đã nhả lock (23:47:50Z) và vite O8 đã
  chết (curl 000 sau release — `o8-lock.log`); churn
  chỉ là `sleep` trần, không CPU — T6 không quy tải tăng
  cho churn, và cũng không quy nguyên nhân spike (thuộc
  T8/T9 — hoạt động của họ trong cửa sổ).
  **T6 KHÔNG phán verdict attempt của T4-174** — T4/T10
  sở hữu; T6 chỉ ghi rõ mốc giờ và pha chạm để T4-174/T10-174 tự đánh giá.
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
| **(A), đợt 174 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau hai mươi bốn đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ hai mươi bốn liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 2880/2880 dưới churn qua 24 đợt). Chú thích tỉ lệ
  (như T6-150–173): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 23 (đợt 173) → **24 (đợt
  174 — lần thứ hai mươi bốn xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 55 (đợt 173) → **56 (đợt 174,
  6/6 lượt 9/9)**.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 2 FILE (ĐIỀU (b) KÍCH HOẠT) — KHÔNG PHẢI CHỜ LOCK

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
  - 23:42Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-173 thêm 1 file
    `cooldown-t8-round173` sau khi T6-173 prune, §2); quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    — 0 byte, đã ghi lại file riêng như T6-166/167/168/169/170/171/172/173) — điều (a)
    không kích hoạt.
  - Lock TRỐNG lúc mở (23:42Z), TRỐNG lúc snapshot
    đóng (23:54Z), TRỐNG ngay trước prune
    (`status-before-prune.txt` ~23:55Z) và TRỐNG lúc kiểm
    cuối (23:56Z) — **prune KHÔNG PHẢI CHỜ**
    (giống đợt 167/168/169/170/171/172/173 không phải chờ; khác đợt 166 phải chờ
    T4-166). Lưu ý: trong phiên T6-174 có **1 chu kỳ lock**
    của t0-round174 (§2) — hoàn tất trước prune
    (RELEASED 23:47:50Z, rm prune 23:55:54Z — cách 8m04s).
  - 23:55:54Z 22/11 (epoch 1795391754): điều (b) KÍCH HOẠT:
    tổng 102 > 100 → xóa 2 file cũ nhất tới khi còn 100.
    Các file cũ nhất (mtime chính xác tới nano-giây):
    **`cooldown-round120-t8-n10`, mtime
    2026-11-16T06:28:53.343026048Z, 161,45h tuổi lúc xóa**;
    **`cooldown-t10-round120`, mtime
    2026-11-16T07:15:48.690837856Z, 160,67h tuổi lúc xóa**
    (cả hai ≥48h — thỏa điều kiện không xóa file <48h;
    không phải file đợt hiện tại hay đợt ngay trước — file
    cooldown cũ từ 16/11, không thuộc đợt 173/174).
    Xác định "cũ nhất" bằng mtime chính xác tới nano-giây
    (`ls -ltr --time-style=full-iso` — 2 file đầu đúng
    thứ tự trên; file kế tiếp `cooldown-t3-round120`
    07:21:06Z). Tuổi tính từ đúng epoch giờ prune trong
    `prune-time.txt` (bài học F-164-T6-1; `prune-time.txt`
    ghi SAU `rm` trong cùng một lệnh — bài học F-167-T6-3).
    Tên file cũ nhất lấy từ `queue-oldest-true.txt`
    (`ls -ltr | head`, cũ nhất lên đầu — đúng tên sau bài
    học F-170-T6-2).
  - **Kết quả prune đợt 174 (lần 49): 2 file đã xóa
    (`cooldown-round120-t8-n10`, `cooldown-t10-round120`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (23:42Z) **101 file / 1414 byte**;
  lúc snapshot đóng (23:54Z, trước khi prune) **102 file /
  1428 byte** (+1 file mới trong phiên,
  `cooldown-t0-round174` 23:47:50Z, §2; log lock +3 dòng
  trong phiên, 0 dòng nào của T6);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (23:56Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 2 file prune giữa hai lần đếm của đợt này
  (sau prune, không có chu kỳ lock mới nào — log vẫn
  2174 dòng thô lúc kiểm cuối).
  Số học từ T6-173 đóng: 100 + 1 file mới
  (`cooldown-t8-round173`) = 101 ✓
  lúc mở; 101 + 1 file mới trong phiên
  (`cooldown-t0-round174`) = 102 ✓ lúc đóng — khớp đúng
  số T10-173 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 71 file; ≥48h (`-mtime +1`): 81
  file**. Lúc đóng (trước prune): **≥192h: 0 file; ≥72h:
  71 file; ≥48h: 81 file** (1 file mới trong phiên <48h
  nên không đổi tầng). Sau prune (23:55Z): **≥192h: 0 file; ≥72h:
  69 file; ≥48h: 79 file** — ≥72h giảm 71 → 69 (xóa
  đúng 2 file ≥72h — khớp số học).
  (Ghi chú: ≥72h lúc mở đợt này là 71, tăng 1 so với lúc
  đóng đợt 173 sau prune (70) — 1 file đã đủ 72h trong
  khoảng 20:51–23:42Z; khớp số học, không phải lỗi đếm.)
  File cũ nhất còn lại nay là
  `cooldown-t3-round120`, mtime 2026-11-16T07:21:06Z —
  lúc 23:55Z mới **~160,57h tuổi** (đủ 7 ngày ~23/11 07:21Z).
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ hai mươi lăm liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
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
  đợt 172 xóa `cooldown-t8-round119`, đợt 173 xóa
  `cooldown-t3-round119` + `cooldown-t10-round119` +
  `cooldown-round120-t8-e1`, đợt này xóa
  `cooldown-round120-t8-n10` + `cooldown-t10-round120`
  trước khi chúng đủ 7 ngày —
  `cooldown-round120-t8-n10` đủ 7 ngày theo đồng
  hồ tường vào khoảng **23/11 06:28Z** nhưng đã bị xóa ở
  đợt 174, sớm 6,55h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
  **Kiểm số lần nối lại cẩn thận (brief giao dặn):** LIMITS
  T6-173 §7 đã đếm "lần thứ hai mươi bốn" (đợt 150–173 nối liên
  tiếp); đợt này là **lần thứ hai mươi lăm** — đợt 150–174 =
  25 đợt liên tiếp.
- **Prune lần 50 (T6-175): tổng lock 100 sau prune 49 —
  kiểm lại lúc mở đợt 175** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t3-round120` đủ 7 ngày ~23/11 07:21Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-174; #84/#85 KHÔNG GIẾT HOLDER; đồng hồ ở giờ thật; POSTBOOT_PASS #85 CÓ; KHÔNG LỆCH PID WATCHER

- Boot duy nhất trong phiên: **3c704685** (btime
  22:59:36Z = epoch 1795388376). T6 **TỰ XÁC MINH btime**
  22:59:36Z (hai nguồn /proc/stat + `uptime -s` khớp) nhưng
  **KHÔNG tự chứng nhận** số hiệu reboot #85 (thuộc
  T0-174 — lúc T6 mở chưa có cờ `round174-t0.done`
  trên đĩa; T6 chỉ chứng nhận từ log lock).
- Uptime boot lúc đóng ~54'. `journal --list-boots`
  chỉ 1 dòng 3c704685 (first entry 22:59:48Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~23:54Z, boot_id giống lúc mở; kiểm
  lại sau prune ~23:56Z, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  23:42:07Z vs local 23:42:05Z — chênh ~1–2 s (trong đó có
  độ trễ fetch; lúc đóng chênh ~1–2 s). Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 174
  đọc trực tiếp được.
- **REBOOT #84 (btime 21:01:15Z, boot `4ae2d2ea` — số hiệu
  chưa được T6 chứng nhận) — KHÔNG giết holder** (§2):
  lock trống 8m38s trước btime (RELEASED cuối
  20:52:37Z); 0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch, chờ T0-174 xác nhận số hiệu — nếu được
  xác nhận, chuỗi lên 16 reboot.**
  **REBOOT #85 (ứng viên — btime 22:59:36Z, boot `3c704685` —
  số hiệu chưa được T6 chứng nhận) — KHÔNG giết holder**
  (§2): lock trống 7m33s trước btime (RELEASED cuối
  22:52:03Z); 0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch, chờ T0-174 xác nhận số hiệu — nếu được
  xác nhận, chuỗi lên 17 reboot.**
  **Chuỗi "không giết holder" MỚI bắt đầu lại từ #69: 15 reboot
  (#69, #70, #71, #72, #73, #74, #75, #76, #77, #78, #79, #80, #81, #82, #83 — ĐÃ
  XÁC NHẬN theo brief đợt 174) + #84 chờ xác nhận số hiệu (nếu #84 được xác
  nhận → 16) + #85 ứng viên (nếu #85 được xác nhận → 17).**
- **ĐỐI CHIẾU PID WATCHER-174 — KHÔNG CÓ LỆCH (nhiệm vụ (d)
  brief giao):** hai pid ghi nhận lúc mở và lúc đóng là
  **HAI watcher khác nhau**, cả hai đều đúng trong phạm vi
  của mình (không phải một watcher bị báo lệch pid):
  - pid **11084** = `b2-watcher.sh` của **T9-174**
    (headroom/balloon watcher): `ps` ghi `11084 … bash
    b2-watcher.sh`, etime 03:29 lúc mở → khởi động
    ~23:38Z; cùng pid lúc đóng (etime 15:29).
  - pid **12991** = `replay-watch-174.sh` của **T5-174**
    (postboot replay watcher): `ps` ghi `12991 … bash
    …/round174-t5/replay-watch-174.sh`, etime 00:05 lúc
    mở → khởi động ~23:42Z; cùng pid lúc đóng
    (etime 12:05).
  - Áp dụng đúng bài học F-172-T6-5/F-173-T6-2: ghi rõ
    TÊN SCRIPT (replay-watch-* của T5 vs b2-watcher.sh
    của T9), không chỉ gọi "watcher-<đợt>" — nên không
    có kết luận lệch sai. **Không phát sinh F-174-T6-x
    nào về lệch watcher.**
  - Vòng đời watcher-173: cả hai watcher-173 đều chết
    theo reboot #84 (btime 21:01:15Z) — replay-watch-173
    (pid 13457) poll cuối 21:01:24Z (xem F-174-T6-3);
    b2-watcher-173 chết theo #84, T9 khởi động lại trên
    #84 (`b2-nohup-84.out` tạo 21:02:32Z) và trên #85
    (`b2-nohup-85.out` tạo 23:01:30Z).
- **POSTBOOT_PASS #85 CÓ lúc T6 kiểm cuối** (23:56Z):
  `round174-t5/POSTBOOT_PASS` mtime 23:46:57Z, nội dung
  "boot 3c704685 … postboot PASS poll1 … 23:46:25Z;
  POSTBOOT_PASS moi ghi 2026-11-22T23:46:57Z poll=1
  (repair-tay-T5)" — T5-174 viết TRONG cửa sổ harness
  của T6 (xem F-174-T6-4). **POSTBOOT_PASS #84 CÓ**
  (21:27:05Z, repair-sớm, poll=1 — aggregate 173 §8;
  file `round173-t5/POSTBOOT_PASS` mtime 21:27Z; cờ cũ
  4ae2d2ea được T5-174 lưu thành `POSTBOOT_PASS-4ae2d2ea`).
  T6 KHÔNG bù cờ postboot — T5 sở hữu.
  POSTBOOT_PASS #83 KHÔNG CÓ (F-173-T6-4 — không bao giờ
  được viết); POSTBOOT_PASS #82 KHÔNG CÓ (xác nhận đợt 173).
- **Nhắc lại #60/#61/#62/#63/#64/#65/#66/#67/#68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80/#81/#82/#83/#84 (để đối chiếu):** #60 ĐÃ
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
  #82 KHÔNG giết holder (lock trống 31m09s trước btime — đợt 173,
  số hiệu ĐÃ XÁC NHẬN theo brief đợt 174).
  #83 KHÔNG giết holder (lock trống 1h56m08s trước btime — đợt 173,
  số hiệu ĐÃ XÁC NHẬN — T0-173 `.done` "boot dd08464a
  (#83, XAC NHAN 9 nguon)").
  #84 KHÔNG giết holder (lock trống 8m38s trước btime — đợt này,
  số hiệu chưa được T6 chứng nhận).
  #85 KHÔNG giết holder (lock trống 7m33s trước btime — đợt này,
  ứng viên, số hiệu chưa được T6 chứng nhận).**

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng và lúc kiểm cuối: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-174
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (23:56Z 22/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 2174 dòng thô /
  2168 dòng chính thức, 610 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief; đã kiểm boot lần cuối
  `3c704685` ngay trước khi viết cờ).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round174-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND174_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round174-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11; đã kiểm boot lần cuối
  `3c704685` ngay trước khi viết cờ).
- Tổng batch đợt 174 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 174 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–173 (T1-174 đếm):
  batches=618 entries=1092 distinct=946 new=768;
  pending 166–173: batches=80 entries=113 distinct=106
  new=104. T6 không tự cộng tay vào lũy kế file
  (chờ T10-174).

## 11. GHI CHÚ CHO T10-174 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ hai mươi bốn liên tiếp, tổng 2880/2880 qua 24
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 23 → 24 (lần thứ hai mươi bốn xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 55 → 56 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (610 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); **#84 KHÔNG GIẾT HOLDER (lock trống
  518 s — số hiệu chờ T0-174 xác nhận); #85 KHÔNG GIẾT HOLDER
  (lock trống 453 s — ứng viên, số hiệu chờ T0-174 xác
  nhận)** — gap #83→#84 = 2.128 s; gap #84→#85 = 7.101 s
  (kiểm lại khớp aggregate 173 §7). Double-acquire/STALE-LOCK GIỮ 12 — 0 ca mới cả hai (ca mới
  nhất vẫn là thu hồi #68 đợt 165, đừng đếm thành sự kiện mới).
  Prune lần 49 xóa 2 file, queue về đúng trần 100 (**KHÔNG
  PHẢI CHỜ lock** — lock trống lúc mở/lúc đóng/ngay trước
  prune/lúc kiểm cuối; +32 dòng kể từ T6-173 đóng đều là của t0-round173 (1 chu kỳ)
  + t8-round173 (7 chu kỳ) + t0-round174 (1 chu kỳ),
  sạch; 0 dòng nào của T6).
- **Reboot #84/#85 KHÔNG giết holder** (lock trống
  518 s / 453 s trước btime — verdict sạch; nếu T0-174
  xác nhận cả hai số hiệu, chuỗi "không giết holder" từ
  #69 lên 17 reboot).
  **#68 GIẾT holder** vẫn là phát hiện của đợt 165 (chuỗi #61–#67 đứt).
  **Đồng hồ ở giờ thật** (Cloudflare ~1–2 s lúc mở, ~1–2 s lúc
  đóng, gồm độ trễ fetch). Mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80/#81/#82/#83/#84/#85 giao T2-174.
  **Kiểm cuối đợt này: ACQUIRED 622 / RELEASED 610, 610
  cặp** (đừng mang 613/601 — đó là kiểm cuối đợt 173 —
  vào cột đợt này; bài học (r) đợt 163).
- **Double-acquire GIỮ 12, STALE-LOCK GIỮ 12 — 0 ca mới
  cả hai.** Hai con số vẫn là CÙNG MỘT sự kiện thu hồi #68 —
  T10-174 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng (quyết (v) đợt 162, quyết (r) đợt 163).
- 0 zombie thật lúc mở/lúc đóng/lúc kiểm cuối;
  X11 trống lúc mở, 3 socket X193/X194/X195 lúc đóng
  (của T0-174, tạo 23:45Z — trở lại 3 socket như đợt 172/173) — không phải của T6; T10-174 lưu ý khi đối chiếu log (+32 dòng
  kể từ T6-173 đóng đều là của t0-round173 + t8-round173 + t0-round174, sạch).
- **Inotify: trần `max_user_watches` nay là 63747** (giống
  trần trên #69/#70/#71/#73/#74/#75/#76/#77/#79/#80/#81/#82/#83). Ghi nhận theo quyết (m) đợt 146 (ghi làm chú thích, không
  hành động); T9-174 sở hữu hệ quả headroom nếu có. T6
  không suy đoán nguyên nhân đổi.
- **CAVEAT CHỒNG LẤN HARNESS/T4 (F-174-T6-1) — LẦN THỨ HAI
  CHỒNG CẢ HAI PHA:** harness churn của T6
  (23:46:25–23:53:40Z) chồng lấn **pha đếm gate (pha (a))**
  của T4-174 (polls #8–#17, 23:46:38–23:53:26Z) VÀ
  **pha giữ lock (pha (b))** của T0-174 (TICKET 23:43:42Z
  → RELEASED 23:47:50Z, hold 248 s; ~85 s đầu cửa sổ
  harness nằm trong pha (b)). Blockers comm-based trong
  cửa sổ là vite THẬT của T0 (poll #9 = 1, vite cổng 5554),
  không phải churn (comm churn là "sleep"); gate0 lật
  khong-dat→T5 trong cửa sổ vì POSTBOOT_PASS #85 được
  T5-174 viết 23:46:57Z (độc lập với churn); T4 0 ticket
  tới poll #18; T6 KHÔNG phán verdict attempt của T4-174.
- **POSTBOOT_PASS #85 CÓ** (23:46:57Z, repair-tay-T5,
  poll=1 — T5-174 viết trong cửa sổ harness của T6, xem
  F-174-T6-4); **POSTBOOT_PASS #84 CÓ** (21:27:05Z,
  repair-sớm, poll=1 — aggregate 173 §8).
- **KHÔNG LỆCH PID WATCHER (nhiệm vụ (d)):** 11084 =
  `b2-watcher.sh` của T9-174; 12991 = `replay-watch-174.sh`
  của T5-174 — hai watcher khác nhau, cả hai đều đúng
  (xem §8). T6 các đợt sau tiếp tục ghi rõ TÊN SCRIPT khi
  đối chiếu pid watcher.
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #79/#80/#81/#82/#83/#84/#85 VẪN
  MỞ; #88? VẪN MỞ; mù #94? MỞ theo quyết (b) đợt 163;
  mù #95? MỞ theo quyết (b) đợt 163; mù #96? MỞ sau điều
  tra đầy đủ đợt 165 — chờ quyết parent §12.1 (m) đợt 165;
  birefnet 0 thử lần 27 (đợt 173); u2net là fallback chính thức;
  kết cục run 173 thuộc T7-174).
- Cờ `round174-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-174 (F-174-T6-n)

- **F-174-T6-1 — Harness churn của T6 chồng lấn CẢ PHA ĐẾM
  GATE của T4-174 VÀ PHA GIỮ LOCK của T0-174 (lần thứ hai
  liên tiếp chồng cả hai pha trong một đợt).** Harness
  `t7-control-a174.sh` chạy 23:46:25–23:53:40Z;
  poll-wait của T4-174 bắt đầu 23:41:17Z; các poll #8–#17
  (23:46:38–23:53:26Z) nằm trong cửa sổ harness; gate0
  lật khong-dat→T5 ở poll #9 (23:47:23Z) vì POSTBOOT_PASS
  #85 được T5-174 viết 23:46:57Z; **0 TICKET của T4-174
  được lấy tới poll #18 (23:54:12Z)** — T4-174 chưa bước
  vào pha giữ lock (pha (b)) trong phiên T6; ngược lại
  T0-174 ĐÃ ở pha (b) trong ~85 s đầu cửa sổ harness
  (TICKET 23:43:42Z → RELEASED 23:47:50Z, hold 248 s,
  O8 WebKit 21/21 ×2 + Chromium 21/21 exit 0). Mỗi lần chạy
  harness bơm 1 process `WebProcess-churn` (`sleep` 1,5 s,
  tên khớp mẫu poll) sau delay ngẫu nhiên 0,5–3,5 s.
  Đánh giá ảnh hưởng: (i) blockers comm-based trong cửa sổ
  (#8=0, #9=1, #10–#17=0) là vite THẬT của T0-174 (poll #9:
  pid 32650 `node …/vite … --port 5554` — vite O8, KHÔNG
  phải vite lock cổng 5560; xem F-174-T6-6) — churn không
  được đếm là blocker vì comm của process `exec -a …
  sleep` vẫn là "sleep"; số legacy trong cửa sổ
  (1,1,1,1,1,0,1,1,1,0) ở mức hoặc thấp hơn poll #5–#7
  trước harness (legacy 8/11/11) — không có dấu hiệu
  churn làm phồng số đếm; (ii) gate0 lật khong-dat→T5 vì
  lý do độc lập với churn (POSTBOOT_PASS #85 do T5-174
  viết — xem F-174-T6-4); T4 vẫn 0 ticket tới poll #18 —
  churn không gây gate pass giả, cũng không chặn một gate
  pass nào; (iii) load1 trong cửa sổ 0,89/1,47/4,86/6,09/
  4,10/2,55/1,20/0,86/1,90/1,96 — spike #10–#12 rơi SAU
  khi T0 đã nhả lock (23:47:50Z) và vite O8 đã chết
  (curl 000 sau release); churn chỉ là `sleep` trần —
  không CPU, không chạm trình duyệt, ảnh hưởng load trong
  lúc poll là không đáng kể; T6 không quy nguyên nhân spike
  (thuộc T8/T9). **T6 KHÔNG phán verdict attempt của
  T4-174.**
  Ảnh hưởng tới verdict lock/(A)/prune của T6: không có
  (log +3 dòng trong phiên đều là chu kỳ hoàn tất của
  t0-round174; harness 120/120 trên /tmp).
- **F-174-T6-2 — #84 VÀ #85 đều KHÔNG giết holder (cả hai
  là verdict mới của T6-174).** #84 (btime 21:01:15Z):
  lock trống 518 s trước btime (RELEASED cuối 20:52:37Z);
  #85 (btime 22:59:36Z): lock trống 453 s trước btime
  (RELEASED cuối 22:52:03Z); 0 dòng log trong cả hai cửa
  sổ mở; 0 STALE-LOCK mới sau cả hai reboot. #84 là nợ
  chưa ai chứng nhận từ log lock (T6-173 đóng 20:52Z,
  trước #84 21:01:15Z); #85 là nhiệm vụ (b) brief giao.
  Số hiệu cả hai chờ T0-174 xác nhận — nếu cả hai được
  xác nhận, chuỗi "không giết holder" từ #69 lên 17 reboot.
  T6 KHÔNG tự chứng nhận số hiệu reboot (thuộc T0-174).
- **F-174-T6-3 — Replay-watch-173 poll cuối 9 s SAU btime
  #84 (hiện tượng F-172-T5-1 lặp lại lần thứ ba).**
  `round173-t5/replay-watch-173.log` (43 dòng): poll cuối
  21:01:24Z vẫn ghi boot=dd08464a trong khi btime #84 là
  21:01:15Z — process của boot cũ còn poll được 9 s sau
  btime mới. Watcher chết theo #84 (file mtime 21:01:24Z;
  40/40 dòng boot= đều là dd08464a). Cùng họ với
  F-172-T5-1 (watcher-171 poll cuối 20 s sau btime #81)
  và F-173-T6-3 (replay-watch-172 poll cuối 23 s sau btime
  #82). T6 chỉ ghi nhận — phân loại mù/khoảng
  không-watcher thuộc T2-174. Lưu ý: OVERLAP thứ 11 của
  T9-173 cũng ghi mẫu sampler cuối trên #83 lúc 21:01:20Z
  (+5 s sau btime #84) — cùng họ hiện tượng, T2-174 đối
  chiếu.
- **F-174-T6-4 — POSTBOOT_PASS #85 được T5-174 viết TRONG
  cửa sổ harness của T6 (23:46:57Z, 32 s sau khi harness
  bắt đầu 23:46:25Z).** Nội dung cờ: "postboot PASS poll1
  … 23:46:25Z; POSTBOOT_PASS moi ghi 2026-11-22T23:46:57Z
  poll=1 (repair-tay-T5)". Gate0 của T4-174 lật
  khong-dat→T5 ở poll #9 (23:47:23Z) — hệ quả trực tiếp
  của cờ này, KHÔNG phải của churn (churn chỉ chạm /tmp,
  không viết cờ postboot; T5-174 repair chạy apt-get
  update/install trước đó — dpkg_lines 1647 → 1731 trong
  cửa sổ). Ghi rõ để T4/T10 không đọc nhầm cú lật gate0
  trong cửa sổ harness thành ảnh hưởng của churn.
- **F-174-T6-5 — Prune lần 49 xóa 2 file (lần đầu xóa 2
  file kể từ đợt 171 xóa 2).** Lúc mở 101 file (do 1 file
  mới của đợt 173) + 1 file mới trong phiên
  (`cooldown-t0-round174` 23:47:50Z) = 102 lúc đóng; điều
  (b) xóa 2 file cũ nhất tới khi còn 100. Không phải lỗi
  đếm: số học 100 + 1 + 1 − 2 = 100 khớp (§2/§7); 2 file
  xóa đều ≥48h (160,67–161,45h), không thuộc đợt hiện tại/
  đợt ngay trước, và bị xóa trước mốc 7 ngày (sớm
  6,55–7,33h) — chuỗi F-147-T6-1 nối lại lần thứ 25.
  Bài học (nối F-173-T6-7): T6 các đợt sau cứ đếm đúng số
  file lúc đóng trước khi prune, không giả định số file xóa.
- **F-174-T6-6 — Blocker comm-based duy nhất trong cửa sổ
  harness (poll #9 = 1) là vite O8 trên cổng 5554, KHÔNG
  phải vite lock cổng 5560.** `blockers-list-9.txt`: pid
  32650 `node …/vite … --port 5554` (vite O8 của T0-174);
  lock của T0 giữ trên cổng 5560 (ticket
  `1-179539102281…`, pid 18582). Cách đếm comm-based của
  T4 đếm process vite bất kể cổng — nên số blocker=1 ở
  poll #9 không có nghĩa có vite đang giữ lock cổng 5560
  ngoài T0 (T0 chính là holder lúc đó, lock=co). Ghi rõ
  để T4/T10 không đọc nhầm blocker này thành vite lạ.
  Không ảnh hưởng verdict lock/(A)/prune của T6.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a174-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round174-t6/appendix-numbers.txt` giữ bản
trích gốc (tuổi prune tính từ đúng epoch giờ prune trong
`prune-time.txt` — bài học F-164-T6-1; md5 live-code chỉ
tính bằng pipeline shell đứng sau khi bắt lỗi F-164-T6-2):

```
churn: n_runs=120 pass=120 fail=0 B1=1:120 B2=0:120
churn delay_ms: min=552 max=3497 mean=2088.32
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
churn harness: 2026-11-22T23:46:25Z -> 2026-11-22T23:53:40Z (~7m15s), boot 3c704685
suite window: 2026-11-22T23:43:06Z -> 2026-11-22T23:46:06Z
suite run1: PASS=9 FAIL=0 T7A=1 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 rc=0
log lock (bản đã lọc): open raw 2171 / cleaned 2165; close raw 2174 / cleaned 2168; final raw 2174 / cleaned 2168
delta kể từ T6-173 đóng: +32 dòng = TICKET +9 ACQUIRED +9 RELEASED +9 COOLDOWN +5
kiểm cuối: ACQUIRED 622 / RELEASED 610, 610 cặp, 0 đang giữ, double-acquire 12, STALE-LOCK 12
gap #83->#84: 2128 s; gap #84->#85: 7101 s; lock trống trước btime #84: 518 s; trước btime #85: 453 s
prune 23:55:54Z epoch 1795391754: xóa cooldown-round120-t8-n10 (161,45h, sớm 6,55h) + cooldown-t10-round120 (160,67h, sớm 7,33h); queue 102 -> 100 file / 1400 byte
POSTBOOT_PASS #84: CÓ (21:27:05Z, repair-sớm, poll=1); POSTBOOT_PASS #85: CÓ (23:46:57Z, repair-tay-T5, poll=1)
T4-174 poll: poll-wait bắt đầu 23:41:17Z; polls #8–#17 (23:46:38–23:53:26Z) trong cửa sổ harness 23:46:25–23:53:40Z; gate0=khong-dat #1–#8, T5 từ #9; T4-174 0 TICKET tới poll #18 (23:54:12Z); T0-174 giữ lock pha (b) 23:43:42–23:47:50Z (248s), O8 WebKit 21/21 ×2 + Chromium 21/21 exit 0
T0-174 O8 DONE 23:47:50Z; T0 vite blocker poll #9 pid 32650 port 5554
replay-watch-173 poll cuối 21:01:24Z boot=dd08464a, 9 s SAU btime #84 (21:01:15Z)
watchers: b2-watcher.sh pid 11084 (T9-174), replay-watch-174.sh pid 12991 (T5-174) — cùng pid lúc mở/đóng
```
