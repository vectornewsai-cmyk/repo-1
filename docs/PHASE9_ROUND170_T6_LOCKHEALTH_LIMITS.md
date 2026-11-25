# PHASE9 ROUND170 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 20 LIÊN TIẾP) + #78/#79? KHÔNG GIẾT HOLDER + prune lần 45: XÓA 1 FILE — LIMITS

- Đợt: 170, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 18:35 +07 22/11/2026 (= 11:35:51Z). Chạy
  11:37Z → 11:48Z 22/11/2026. Lúc mở đã ở trên boot
  `5df1871f` (btime 11:11:05Z) — boot này là #79? theo brief
  giao (btime ~11:12Z, ứng viên); T6 TỰ XÁC MINH btime
  11:11:05Z từ /proc/stat + `uptime -s` (cả hai khớp) nhưng
  KHÔNG tự chứng nhận số hiệu #79 (thuộc T0-170), chỉ chứng
  nhận từ log lock rằng #78/#79? KHÔNG giết holder (xem
  §2/§8); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) prune lần 45 theo đúng quy tắc
  prune các đợt trước (queue 100); (b) kiểm (A) 120/120 lần
  thứ 20 (tổng 2400/2400 nếu sạch); (c) chứng nhận reboot
  #78 có giết holder không (lock trống trước btime #78
  09:14:38Z bao lâu; nếu sạch thì chuỗi "không giết holder"
  từ #69 lên 10 reboot) và boot mới trong phiên (#79 ứng
  viên — boot lúc mở 5df1871f, btime ~11:12Z); (d) đếm lock
  ACQUIRED/RELEASED độc lập, đối chiếu cặp, ghi 0 đang giữ
  hay không; (e) ghi mọi phát hiện/sai số dạng F-170-T6-*.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–169,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–169); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (571 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 12, STALE-LOCK GIỮ 12
  (0 ca mới cả hai kỳ vọng). Reboot #78 KHÔNG giết holder (lock
  trống 11m21s trước btime — chuỗi "không giết holder" mới
  từ #69 lên 10 reboot); #79? KHÔNG giết holder (lock trống
  1h22m35s — số hiệu chưa được T6 chứng nhận, thuộc T0-170;
  nếu #79 được xác nhận → chuỗi lên 11).
  Prune lần 45: xóa 1 file cũ nhất (điều (b)), queue 101 →
  100 file — KHÔNG PHẢI CHỜ lock (lock TRỐNG lúc mở, lúc
  đóng và ngay trước prune — giống đợt 167/168/169).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round170-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  boot-verify-final.txt, time-open.txt, time-close.txt, queue-open.txt,
  queue-oldest-open.txt, queue-oldest-true.txt, prune-candidates.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, vite-lock-v2-raw-final.log,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt, analyze-log.py,
  new-lines-since-t6-169.txt, prune-deleted.txt, prune-time.txt,
  suite-start.txt, suite-end.txt, harness-start.txt,
  harness-end.txt, inotify-open.txt, inotify-close.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  status-final.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a170.sh,
  t7-block-a170.sh,
  t7-a170-churn.log, t7-control-a170.stdout.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 5df1871f (btime 11:11:05Z); lock TRỐNG; queue 101 file (khớp T10-169 đóng + 1 file mới)

- **Boot lúc mở và lúc đóng: boot_id
  `5df1871f-7e19-45e1-a357-1ca4fd89bc33`, btime 11:11:05Z
  theo /proc/stat** (epoch 1795345865; `uptime -s` =
  11:11:05; `journal --list-boots` chỉ 1 dòng 5df1871f,
  first entry 11:11:16Z). Uptime ~27' lúc T6 bắt đầu
  (11:37Z), ~37' lúc snapshot đóng (11:47Z). Boot này là
  #79? theo brief giao (btime ~11:12Z, ứng viên, ngay
  trước khi đợt mở 11:35:51Z đúng 24m46s) — **T6 TỰ XÁC
  MINH btime 11:11:05Z** (hai nguồn độc lập /proc/stat +
  `uptime -s` khớp nhau) nhưng **KHÔNG tự chứng nhận số
  hiệu #79** (thuộc T0-170); T6 chỉ chứng nhận từ log
  lock rằng #78/#79? KHÔNG giết holder (xem §2/§8).
  **KHÔNG có reboot trong phiên T6** (boot_id giống nhau
  lúc mở, lúc đóng và lúc kiểm cuối sau prune).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sun, 22 Nov 2026 11:37:59 GMT` vs local 11:37:58Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, trong đó có độ trễ
  fetch curl ~1–2 s); lúc đóng Cloudflare 11:47:49Z vs
  local 11:47:47Z (chênh ~2 s — cùng họ lúc mở, không phải
  lệch đồng hồ). Các mốc wall đợt 170 đọc trực tiếp được.
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
  từ T10-169 đóng: 100 sau prune 44 + 1 file cooldown mới
  `cooldown-t8-round169`, mtime 09:48:30Z (§2). File
  `cooldown-t4` được ghi đè mtime mới 09:03:17Z (chu kỳ t4
  mới, §2) — ghi đè tại chỗ, không đổi số lượng.

## 1. Quét zombie: 0 zombie lúc mở, 1 zombie dpkg lúc đóng (không phải của T6 — xem F-170-T6-1); 0 vite thật của T6; X11 trống lúc mở, 3 socket luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 11:37Z
  (mở, `ps-full-open.txt`) và lúc 11:47Z
  (đóng, `ps-full-close.txt`).
- **Lúc mở: 0 zombie** (`awk` trên cột STAT = 0).
  **Lúc đóng: 1 zombie** — pid 31534, ppid 31518,
  `dpkg-preconfigure [dpkg-preconfigu] <defunct>`, STAT ZN,
  etime 00:00 (xem F-170-T6-1: không phải process của T6;
  T6 không khởi động/không đụng dpkg hay apt nào; parent
  31518 đã không còn lúc T6 kiểm lại sau snapshot đóng).
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống
  hoàn toàn; 0 dòng chứa chuỗi "vite" trong snapshot ps
  lúc mở (ngoại trừ lệnh exec của chính T6 — đã lọc).
  **Lúc đóng: 0 vite thật của T6** — T6 không khởi động
  Xvfb/vite nào, không kill process nào trong phiên này.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #79? đã dọn
  sạch 3 socket X193/X194/X195 của đợt 169 — T6-169 đã xác
  nhận 3 socket đó lúc đóng đợt 169).
  **Lúc đóng: 3 socket X193 / X194 / X195, tạo 11:44Z** —
  của một luồng khác đợt 170 (khởi động Xvfb trong phiên;
  T6 không khởi động Xvfb/vite nào, không đụng tới các
  process này). Đây là lần thứ mười một liên tiếp
  cùng 3 số display X193/X194/X195 — xem quyết (bb) đợt 163.
- **Watcher: lúc mở CHƯA CÓ watcher nào của đợt 170 trong
  snapshot** (các luồng đợt 170 chưa khởi động process nào
  lúc đó — T9 khởi động sau).
  **Lúc đóng: `b2-watcher.sh` pid 2339 (round170-t9) có
  mặt** — khởi động trong phiên, sau snapshot mở của T6;
  T6 không khởi động watcher nào. Watcher-169 pid 19123
  (round169-t9) đã chết theo reboot #79? — T6 chỉ ghi
  nhận sự vắng mặt, giao T5-170 xác nhận vòng đời watcher.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-170).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (~11:37Z và ~11:47Z) — **GIỐNG trần trên #69, #70,
  #71, #73, #74, #75, #76 và #77** (theo T9-168/T6-168/T6-169); khác
  63756 trên #67 (T6-164 đo) — xem §11, ghi nhận, không
  hành động.
- Tải hệ thống trong phiên: các luồng đợt 170 khởi động
  dần (T9 watcher 09:43Z, Xvfb 11:44Z của luồng khác)
  — harness churn vẫn 120/120 (xem §6).
  Suite đợt này chạy ~22 s/lượt trung bình (cửa sổ 6 lượt
  11:38:19Z → 11:40:34Z, ~2m15s; tương đương đợt 169:
  21–25 s/lượt).

## 2. Lock lúc mở: TRỐNG; +33 dòng kể từ T6-169 đóng — TẤT CẢ SẠCH, 9 CHU KỲ MỚI HOÀN TẤT TRƯỚC PHIÊN + 0 CHU KỲ TRONG PHIÊN; #78/#79? KHÔNG GIẾT HOLDER (PHÁT HIỆN MỚI)

- **Lúc mở (11:37Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (11:47Z): lock vẫn TRỐNG** — status
  `TRỐNG`, `0 ticket + 101 cooldown` (trước prune).
  **Prune KHÔNG PHẢI CHỜ** (xem §7): lock trống lúc mở,
  lúc đóng và ngay trước prune (`status-before-prune.txt`
  11:47Z) — giống đợt 167/168/169, khác đợt 166 phải chờ T4-166.
- **Log lock +33 dòng kể từ T6-169 đóng** (raw 2004 lúc
  T6-169 đóng → 2037 lúc T6-170 mở → 2037 lúc snapshot
  đóng → 2037 lúc kiểm cuối): 33 dòng trước phiên T6;
  **+0 dòng trong phiên T6-170** (suite chạy trên log riêng
  trong /tmp, harness chạy trên /tmp — không dòng nào
  trong phiên là của T6; cũng không có chu kỳ nào của
  luồng khác trong cửa sổ 11:37–11:48Z).
- Đối chiếu 33 dòng trước phiên (khớp đúng từng dòng, file
  `new-lines-since-t6-169.txt`, dòng thô 2005–2037):
  - t4: 6 dòng — 2 chu kỳ (attempt 08:55:10Z → RELEASED
    08:58:37Z, hold 207 s; attempt 08:59:49Z → RELEASED
    09:03:17Z, hold 208 s) — t4 đợt 169 tiếp tục sau khi
    T6-169 đóng. File `cooldown-t4` ghi đè mtime mới
    09:03:17Z (không đổi số lượng queue).
  - t8-round169: 27 dòng — 7 chu kỳ bắt đầu (09:30:06Z →
    09:44:40Z); **7 chu kỳ HOÀN TẤT** (holds 160 / 71 /
    131 / 241 / 60 / 121 / 230 s; 6 dòng COOLDOWN kèm theo,
    các lần chờ 2925 ms + 14953–14967 ms trên cổng 5390/5490/5560); 0 chu kỳ
    dở dang. Chu kỳ hold 241 s (09:36:53Z → 09:40:54Z) là pha
    dài nhất trong 7 chu kỳ — lock vẫn RELEASED bình thường
    sau đó, không bị giết.
  - Tổng trước phiên: Δ TICKET +9, Δ ACQUIRED +9, Δ RELEASED +9,
    Δ COOLDOWN +6, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **9/9 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ dở dang.**
- **REBOOT #78 (btime 09:14:38Z 22/11, boot `e298bb52` —
  số hiệu ĐÃ ĐƯỢC XÁC NHẬN: T7 xác minh 9 nguồn trong phiên
  đợt 169, parent quyết aggregate 169) — KHÔNG giết holder
  nào (PHÁT HIỆN MỚI CỦA T6-170):** dòng lock cuối trước
  reboot là t4 RELEASED 09:03:17Z (hold 208 s, số học khớp);
  dòng đầu sau reboot: TICKET t8-round169 09:30:06Z — tức
  lock trống **11m21s (681 s) trước reboot**. Không có
  ACQUIRED nào chưa release tại thời điểm #78, không có
  dòng STALE-LOCK mới nào sau #78 (STALE-LOCK vẫn 12 — ca
  mới nhất là ca #68 lúc 19:16:47Z 21/11, TRƯỚC #78),
  still held = 0 lúc T6-170 mở, lock TRỐNG xác minh độc
  lập lúc mở 11:37Z.
  **Kết luận: #78 không giết holder nào — verdict sạch
  (khoảng trống 681 s). Chuỗi "không giết holder" mới
  bắt đầu từ #69 lên 10 reboot (#69–#78).**
- **REBOOT #79? (btime 11:11:05Z 22/11, boot `5df1871f` —
  số hiệu CHƯA được T6 chứng nhận, thuộc T0-170; btime
  TỰ XÁC MINH bởi T6: /proc/stat btime 1795345865 +
  `uptime -s` 11:11:05Z khớp nhau) — KHÔNG giết holder
  nào (PHÁT HIỆN MỚI CỦA T6-170):** dòng lock cuối trước
  reboot là t8-round169 RELEASED 09:48:30Z (hold 230 s) —
  cùng dòng cuối của log (dòng thô 2037); dòng đầu sau
  reboot: KHÔNG CÓ (0 dòng log sau 09:48:30Z tới lúc
  T6-170 mở) — tức lock trống **1h22m35s (4.955 s) trước
  reboot**. Không có ACQUIRED nào chưa release tại thời
  điểm #79?, 0 STALE-LOCK mới sau #79?.
  **Kết luận: #79? không giết holder nào — verdict sạch
  (khoảng trống 4.955 s; số hiệu #79 chờ T0-170 xác
  nhận — nếu được xác nhận, chuỗi lên 11 reboot).**
- **Gap #77→#78 = 3.046 s** (50m46s; 08:23:52Z →
  09:14:38Z — T6-170 kiểm lại độc lập từ btime, KHỚP
  MEMORY/aggregate 169).
  **Gap #78→#79? = 6.987 s** (1h56m27s; 09:14:38Z →
  11:11:05Z — số hiệu #79 chờ T0-170 xác nhận).
  **Gap #76→#77 = 3.089 s — T6-170 kiểm lại độc lập từ
  btime, KHỚP quyết (d) đợt 168 / T6-169** (1795335832 −
  1795332743 = 3089).
- **File cooldown mới kể từ T6-169 đóng:
  `cooldown-t8-round169` (mtime 09:48:30Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 169 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 305 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 9 chu kỳ hoàn tất
  kể từ T6-169 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 296 chu kỳ T6-169 đã đếm = **305 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (296 đợt
    169 + 9 đợt này). Chu kỳ bị #68 giết KHÔNG tính
    vào số hoàn tất (nó là bằng chứng reboot giết holder,
    không phải lỗi thứ tự ghi — STALE-LOCK thu hồi đúng).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 2031 dòng chính thức lúc kiểm cuối, 571 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — bản đã lọc
= raw trừ đúng 6 dòng đó, lọc bằng `awk '$2!="tA" &&
$2!="tH"'` — cột owner là $2, bài học F-162-T6-1;
diff bản đã lọc mở/đóng/final giống nhau về nội dung cũ —
33 dòng mới trước phiên + 0 dòng trong phiên, §2; analyzer
chạy trên bản đã lọc).
Bản đã lọc lúc đóng: **2031 dòng** (raw 2037) — **+33 dòng
kể từ T6-169 đóng** (1998 → 2031; 33 trước phiên + 0 trong
phiên, đều đã đối chiếu §2). Kiểm cuối sau
prune (11:48Z 22/11): bản đã lọc **2031 dòng** (raw 2037),
RELEASED 571, cặp 571, đang giữ 0, double-acquire 12 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-168 đóng | T6-169 đóng | T6-170 mở | T6-170 đóng (snapshot) | Δ trong phiên T6-170 |
|---|---|---|---|---|---|
| Tổng dòng | 1966 | 1998 | 2031 | 2031 | +0 |
| TICKET | 576 | 585 | 594 | 594 | +0 |
| ACQUIRED | 565 | 574 | 583 | 583 | +0 |
| RELEASED | 553 | 562 | 571 | 571 | +0 |
| COOLDOWN | 249 | 254 | 260 | 260 | +0 |
| STALE-LOCK | 12 | 12 | 12 | 12 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 553 | 562 | 571 | 571 | +0 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 | — |
| Double-acquire | 12 | 12 | 12 | 12 | 0 mới trong phiên |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 583 / RELEASED 571, 571 cặp.** Các số 574/562
  là kiểm cuối đợt 169 (không phải đợt này); 565/553 là
  kiểm cuối đợt 168. Bảng trên dùng đúng ba số này (đã đối
  chiếu với bảng §4 của LIMITS T6-168 và T6-169 — cả hai tự
  nó đúng).
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối (sau
  prune):** ACQUIRED 583 − RELEASED 571 = 12
  ACQUIRED chưa release trong lịch sử log — nhưng cả 12 đều
  đã được xử lý: 11 ca cũ (10 ca double-acquire cũ + 1 ca
  t8-round159 03:12:16Z STALE-LOCK thu hồi holder bị #60 giết
  — §8 đợt 160) + 1 ca t4 19:16:47Z (STALE-LOCK thu hồi holder
  bị #68 giết — §2 đợt 165). Analyzer xác nhận `still held
  at end of log: 0` ở cả ba snapshot mở/đóng/kiểm cuối. Lock
  TRỐNG lúc mở, lúc đóng và lúc kiểm cuối — status
  xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 12 — 0 ca mới kể từ T6-169 đóng,
  0 ca mới trong phiên T6-170.** Ca mới nhất vẫn là
  analyzer dòng 1843 (bản đã lọc — t4 ACQUIRED 19:16:47Z sau
  STALE-LOCK cùng giây, thu hồi holder bị #68 giết — §2 đợt 165).
  **Kết luận: 0 double-acquire THẬT mới.** STALE-LOCK GIỮ 12 —
  0 ca mới (ca mới nhất vẫn 19:16:47Z, thu hồi #68).
  **Hai con số là CÙNG MỘT sự kiện thu hồi #68, không phải hai
  sự kiện riêng** (nhắc lại từ đợt 160/161/162/163/164/165/166/167/168/169,
  quyết (v) đợt 162, quyết (r) đợt 163).
- **0 double-acquire mới** kể từ T6-169 đóng. 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (9 chu kỳ mới sạch kể từ T6-169 đóng,
  0 chu kỳ dở dang ngoài ca bị #68 giết đã thu hồi),
  0 zombie lúc mở (1 zombie dpkg lúc đóng — không phải của
  T6, xem F-170-T6-1), 0 stale mới trong phiên, queue 0 ticket,
  log nhất quán (571 cặp + 0 đang giữ lúc kiểm cuối, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–170 (toàn đợt) và đợt 170 (tới ~11:48Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **305 chu kỳ thật** chứng minh (§3).
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
  đợt này, số hiệu ĐÃ XÁC NHẬN);
  **reboot #79? KHÔNG giết holder** (khoảng trống 4.955 s —
  đợt này, số hiệu chưa được T6 chứng nhận);
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
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169 §6.2.
  File khối T7 đã trích `t7-block-a170.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168 và 169 (cùng md5). Harness đợt này chạy đúng code (A)
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
- `bash -n` harness t7-control-a170.sh: OK (bản sao của
  t7-control-a169.sh, chỉ đổi hậu tố a169 → a170).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–169 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ hai mươi liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~11:38–11:40Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (cửa sổ 6 lượt
11:38:19Z → 11:40:34Z, ~2m15s — tương đương đợt 169:
21–25 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
0 dòng mới trong phiên T6-170 (0 dòng nào là của T6, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round170-t6/t7-control-a170.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 5df1871f (#79? theo
brief, btime 11:11:05Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a170.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168 và 169; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a170-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 536 ms, max 3493 ms, trung bình 1958,79 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'00" (11:40:38–11:47:38Z).
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

- **Kết luận: (A) VẪN XANH sau mười chín đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ hai mươi liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 2400/2400 dưới churn qua 20 đợt). Chú thích tỉ lệ
  (như T6-150–169): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 19 (đợt 169) → **20 (đợt
  170 — lần thứ hai mươi xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 51 (đợt 169) → **52 (đợt 170,
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
  - 11:37Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-169 thêm `cooldown-t8-round169`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt` — 0 byte, đã ghi lại
    file riêng như T6-166/167/168/169) — điều (a)
    không kích hoạt.
  - Lock TRỐNG lúc mở (11:37Z), TRỐNG lúc snapshot
    đóng (11:47Z) và TRỐNG ngay trước prune
    (`status-before-prune.txt`) — **prune KHÔNG PHẢI CHỜ**
    (giống đợt 167/168/169 không phải chờ; khác đợt 166 phải chờ
    T4-166). Lưu ý: trong phiên T6-170 KHÔNG có chu kỳ
    lock nào của luồng khác (0 dòng log mới trong phiên —
    khác đợt 169 có 1 chu kỳ t4 trong phiên).
  - 11:48:04Z 22/11 (epoch 1795348084): điều (b) KÍCH HOẠT:
    tổng vẫn 101 > 100 → xóa 1 file cũ nhất tới khi còn 100.
    File cũ nhất: **`cooldown-t10-round118`, mtime
    2026-11-15T13:13:10.2244033200Z, 166,58h tuổi lúc xóa**
    (≥48h — thỏa điều kiện không xóa file <48h; không phải
    file đợt hiện tại hay đợt ngay trước — file cooldown cũ
    từ 15/11, không thuộc đợt 169/170). Xác định "cũ nhất"
    bằng mtime chính xác tới nano-giây: `cooldown-t10-round118`
    13:13:10.2244033200Z, sớm hơn file kế tiếp
    `cooldown-t2-round119` 23:58:34.8167975370Z đúng ~10h45m.
    Tuổi tính từ đúng epoch giờ prune trong `prune-time.txt`
    (bài học F-164-T6-1; `prune-time.txt` ghi SAU `rm` trong
    cùng một lệnh — bài học F-167-T6-3).
  - **Kết quả prune đợt 170 (lần 45): 1 file đã xóa
    (`cooldown-t10-round118`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (11:37Z) **101 file / 1414 byte**;
  lúc snapshot đóng (11:47Z, trước khi prune) **101 file /
  1414 byte** (log lock 0 dòng mới trong phiên, không thêm
  file cooldown mới);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (11:48Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-169 đóng: 100 + 1 file mới
  (`cooldown-t8-round169`) = 101 ✓ — khớp đúng số T10-169 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 73 file; ≥48h (`-mtime +1`): 84
  file**. Sau prune (11:48Z): **≥192h: 0 file; ≥72h:
  72 file; ≥48h: 83 file** — ≥72h giảm 73 → 72 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t2-round119`, mtime 2026-11-15T23:58:34Z —
  lúc 11:48Z mới **~155,82h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 73, tăng 1 so với lúc
  mở đợt 169 (72) — 1 file vượt mốc 72h trong khoảng ~3h giữa
  hai lần mở; khớp số học, không phải lỗi đếm.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ hai mươi mốt liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
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
  `cooldown-t1-smoke-wl`, đợt 167 xóa
  `cooldown-t2`, đợt 168 xóa
  `cooldown-t3-round118`, đợt 169 xóa
  `cooldown-t5`, đợt này xóa
  `cooldown-t10-round118` trước khi nó đủ 7 ngày — nó đủ
  7 ngày theo đồng hồ tường vào khoảng
  **22/11 13:13Z** nhưng đã bị xóa ở đợt 170, sớm ~1,42h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
  **Kiểm số lần nối lại cẩn thận (brief giao dặn):** LIMITS
  T6-169 §7 đã đếm "lần thứ hai mươi" (đợt 150–169 nối liên
  tiếp); đợt này là **lần thứ hai mươi mốt** — đợt 150–170 =
  21 đợt liên tiếp.
- **Prune lần 46 (T6-171): tổng lock 100 sau prune 45 —
  kiểm lại lúc mở đợt 171** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t2-round119` đủ 7 ngày ~22/11 23:58Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-170; #78/#79? KHÔNG GIẾT HOLDER; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **5df1871f** (btime
  11:11:05Z = epoch 1795345865). T6 **TỰ XÁC MINH btime**
  11:11:05Z (hai nguồn /proc/stat + `uptime -s` khớp) nhưng
  **KHÔNG tự chứng nhận** số hiệu reboot #79? (thuộc
  T0-170 — lúc T6 mở chưa có cờ `round170-t0.done`
  trên đĩa; T6 chỉ chứng nhận từ log lock).
- Uptime boot lúc đóng ~37'. `journal --list-boots`
  chỉ 1 dòng 5df1871f (first entry 11:11:16Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~11:47Z, boot_id giống lúc mở; kiểm
  lại sau prune ~11:48Z, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  11:47:49Z vs local 11:47:47Z — chênh ~2 s (trong đó có
  độ trễ fetch; lúc mở chênh ~1 s). Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 170
  đọc trực tiếp được.
- **REBOOT #78 (btime 09:14:38Z, boot `e298bb52` — số hiệu
  ĐÃ XÁC NHẬN) — KHÔNG giết holder** (§2): lock trống 11m21s trước btime
  (RELEASED cuối 09:03:17Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới. **Verdict sạch — chuỗi "không giết
  holder" mới từ #69 lên 10 reboot (#69–#78).**
  **REBOOT #79? (btime 11:11:05Z, boot `5df1871f` — số hiệu
  chưa được T6 chứng nhận) — KHÔNG giết holder** (§2):
  lock trống 1h22m35s trước btime (RELEASED cuối 09:48:30Z);
  0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch, chờ T0-170 xác nhận số hiệu — nếu được
  xác nhận, chuỗi lên 11 reboot.**
  **Chuỗi "không giết holder" MỚI bắt đầu lại từ #69: 10 reboot
  (#69, #70, #71, #72, #73, #74, #75, #76, #77, #78) + #79? chờ xác
  nhận số hiệu (nếu #79 được xác nhận → 11).**
- **REBOOT #77 (btime 08:23:52Z, boot `c44cc3ba`) —
  KHÔNG giết holder** (§2 đợt 169, T6-170 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 1h44m39s trước btime
  (RELEASED cuối 06:39:13Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #76 (btime 07:32:23Z, boot `f2b97695` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 168) — KHÔNG giết holder**
  (§2 đợt 169, T6-170 đối chiếu lại độc lập từ log gốc —
  khớp): lock trống 53m10s trước btime
  (RELEASED cuối 06:39:13Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #75 (btime 05:32:46Z, boot `576ca271`) —
  KHÔNG giết holder** (§2 đợt 168, T6-170 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 40m19s trước btime
  (RELEASED cuối 04:52:27Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #74 (btime 04:05:29Z, boot `194efd93` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 167) — KHÔNG giết holder**
  (§2 đợt 168, T6-170 đối chiếu lại độc lập từ log gốc —
  khớp): lock trống 3h25m59s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #73 (btime 02:28:01Z, boot `b643911f`) —
  KHÔNG giết holder** (§2 đợt 167, T6-170 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 1h48m31s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #72 (btime 02:05:05Z 22/11, boot `9e089ef6`) —
  KHÔNG giết holder** (§2 đợt 167, T6-170 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 1h25m35s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #71 (btime 00:08:00Z, boot `ea73ac4f`) —
  KHÔNG giết holder** (§2 đợt 167): lock trống 6m39s trước btime
  (RELEASED cuối 00:01:21Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #70 (btime 22:05:25Z 21/11, boot `d1ddd946`) —
  KHÔNG giết holder** (§2 đợt 166): lock trống 27m01s trước btime
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
  T6 không phán mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79? — giao T2-170.
- **Watcher-169 lần 2 (pid 19123 lúc T5-169 đóng) đã chết
  theo reboot #79?** (aggregate 170) — T6 chỉ ghi nhận sự
  vắng mặt, không phán vòng đời (T5-170 sở hữu;
  `b2-watcher.sh` pid 2339 mới của round170-t9 đã chạy
  trong phiên T6-170).
  **POSTBOOT_PASS #78 CHƯA CÓ lúc T6 đóng** (giao T5-170);
  POSTBOOT_PASS #77 ĐÃ CÓ (08:46:44Z, replay-đầy-đủ, poll=0 —
  aggregate 169); POSTBOOT_PASS #76 CHƯA CÓ (boot thứ 13 lọt —
  không bù được, aggregate 169).
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
  #78 KHÔNG giết holder (lock trống 11m21s trước btime — đợt này,
  số hiệu ĐÃ XÁC NHẬN).
  #79? KHÔNG giết holder (lock trống 1h22m35s trước btime — đợt này,
  số hiệu chưa được T6 chứng nhận).**

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-170
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (11:48Z 22/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 2037 dòng thô /
  2031 dòng chính thức, 571 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round170-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND170_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round170-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 170 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 170 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–169 (T10-169 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-170).

## 11. GHI CHÚ CHO T10-170 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ hai mươi liên tiếp, tổng 2400/2400 qua 20
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 19 → 20 (lần thứ hai mươi xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 51 → 52 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (571 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); **#78 KHÔNG GIẾT HOLDER (lock trống
  11m21s — chuỗi "không giết holder" mới từ #69 lên 10 reboot);
  #79? KHÔNG GIẾT HOLDER (lock trống 1h22m35s — số hiệu chưa
  được T6 chứng nhận, btime 11:11:05Z do T6 tự xác minh)** —
  gap #77→#78 = 3.046 s (kiểm lại khớp); gap #78→#79? = 6.987 s.
  Double-acquire/STALE-LOCK GIỮ 12 — 0 ca mới cả hai (ca mới
  nhất vẫn là thu hồi #68 đợt 165, đừng đếm thành sự kiện mới).
  Prune lần 45 xóa 1 file, queue về đúng trần 100 (**KHÔNG
  PHẢI CHỜ lock** — lock trống lúc mở/lúc đóng/ngay trước
  prune; 0 dòng log mới trong phiên T6-170; +33 dòng kể từ T6-169 đóng
  đều là của t4 (2 chu kỳ) + t8-round169 (7 chu kỳ), sạch).
- **Reboot #78/#79? KHÔNG giết holder** (lock trống
  681 s / 4.955 s trước btime — verdict sạch).
  **#68 GIẾT holder** vẫn là phát hiện của đợt 165 (chuỗi #61–#67 đứt).
  **Đồng hồ ở giờ thật** (Cloudflare ~1 s lúc mở, ~2 s lúc
  đóng, gồm độ trễ fetch). Mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79? giao T2-170.
  **Kiểm cuối đợt này: ACQUIRED 583 / RELEASED 571, 571
  cặp** (đừng mang 574/562 — đó là kiểm cuối đợt 169 —
  vào cột đợt này; bài học (r) đợt 163).
- **Double-acquire GIỮ 12, STALE-LOCK GIỮ 12 — 0 ca mới
  cả hai.** Hai con số vẫn là CÙNG MỘT sự kiện thu hồi #68 —
  T10-170 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng (quyết (v) đợt 162, quyết (r) đợt 163).
- 0 zombie lúc mở; **1 zombie dpkg lúc đóng** (pid 31534,
  `dpkg-preconfigure <defunct>`, parent đã không còn lúc kiểm
  lại — xem F-170-T6-1, không phải của T6); X11 trống lúc mở
  (reboot #79? đã dọn 3 socket sót đợt 169), 3 socket X193/X194/
  X195 mới lúc đóng (của luồng khác đợt 170, tạo 11:44Z
  — lần thứ mười một liên tiếp cùng 3 số display)
  — không phải của T6; T10-170 lưu ý khi đối chiếu log (+33 dòng
  kể từ T6-169 đóng đều là của t4 + t8-round169, sạch).
- **Inotify: trần `max_user_watches` nay là 63747** (giống
  trần trên #69/#70/#71/#73/#74/#75/#76/#77). Ghi nhận theo quyết (m) đợt 146 (ghi làm chú thích, không
  hành động); T9-170 sở hữu hệ quả headroom nếu có. T6
  không suy đoán nguyên nhân đổi.
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #78/#79? VẪN
  MỞ; #88? VẪN MỞ; mù #94? MỞ theo quyết (b) đợt 163;
  mù #95? MỞ theo quyết (b) đợt 163; mù #96? MỞ sau điều
  tra đầy đủ đợt 165 — chờ quyết parent §12.1 (m) đợt 165;
  birefnet 0 thử lần 23 (đợt 169); u2net là fallback chính thức;
  POSTBOOT_PASS #77 ĐÃ CÓ (replay-đầy-đủ) — giao T5-170 theo dõi tiếp;
  POSTBOOT_PASS #78 CHƯA CÓ — giao T5-170;
  kết cục run 169 + (m) #78 thuộc T7-170/T2-170).
- Cờ `round170-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-170 (F-170-T6-n)

- **F-170-T6-1 — 1 zombie `dpkg-preconfigure <defunct>`
  (pid 31534, ppid 31518, STAT ZN) xuất hiện trong phiên
  T6-170, lúc mở 0 zombie → lúc đóng 1 zombie.** Không
  phải process của T6: T6 không khởi động/không đụng dpkg,
  apt hay dpkg-preconfigure nào trong phiên; zombie này
  thuộc hoạt động dpkg của một luồng khác đợt 170 (T5-170
  sở hữu dpkg — nhắc lại quyết đợt 169: T5 không chạy probe
  chạm dpkg trong cửa sổ attempt của T4). Parent 31518 đã
  không còn lúc T6 kiểm lại sau snapshot đóng (zombie vẫn
  nằm trên bảng ps vì parent chưa reap). T6 không kill/không
  đụng tới process này, không phán vòng đời dpkg — chỉ ghi
  nhận. Ảnh hưởng: không ảnh hưởng verdict lock/(A)/prune
  (lock 0 dòng mới trong phiên, harness 120/120).
- **F-170-T6-2 — File `queue-oldest-open.txt` ghi bằng
  `ls -lt | head` (mới nhất lên đầu) nên tên file gây
  hiểu lầm, giống cách đặt tên của các đợt trước.** Nội
  dung file là 5 file MỚI nhất, không phải cũ nhất. T6 đã
  bù bằng file `queue-oldest-true.txt` (`ls -ltr | head`,
  cũ nhất lên đầu — đúng file cũ nhất
  `cooldown-t10-round118`) và mọi số liệu prune trong LIMITS
  này đều lấy từ file đúng. Không ảnh hưởng verdict (prune
  xóa đúng file cũ nhất, đã đối chiếu mtime nano-giây).
  Bài học: đợt sau đổi `queue-oldest-open.txt` sang
  `ls -ltr | head` cho đúng tên.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a170-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round170-t6/appendix-numbers.txt` giữ bản
trích gốc (tuổi prune tính từ đúng epoch giờ prune trong
`prune-time.txt` — bài học F-164-T6-1; md5 live-code chỉ
tính bằng pipeline shell đứng sau khi bắt lỗi F-164-T6-2):

```
churn: n_runs=120 pass=120 fail=0 B1=1:120 B2=0:120
churn delay_ms: min=536 max=3493 mean=1958.79
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
churn harness: 2026-11-22T11:40:38Z -> 2026-11-22T11:47:38Z (~7m00s), boot 5df1871f
suite window: 2026-11-22T11:38:19Z -> 2026-11-22T11:40:34Z
suite run1: PASS=9 FAIL=0 T7A=1 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 rc=0
(suite per-run secs not logged individually; window 11:38:19Z -> 11:40:34Z = ~2m15s for 6 runs)
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a170.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=583, COOLDOWN=260, RELEASED=571, STALE-LOCK=12, STALE-TICKET=1, TICKET=594, TIMEOUT=10, total=2031
cleaned-open pairs ACQUIRED->RELEASED: 571
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 12
cleaned-close counts: TOTAL: ACQUIRED=583, COOLDOWN=260, RELEASED=571, STALE-LOCK=12, STALE-TICKET=1, TICKET=594, TIMEOUT=10, total=2031
cleaned-close pairs ACQUIRED->RELEASED: 571
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 12
cleaned-final counts: TOTAL: ACQUIRED=583, COOLDOWN=260, RELEASED=571, STALE-LOCK=12, STALE-TICKET=1, TICKET=594, TIMEOUT=10, total=2031
cleaned-final pairs ACQUIRED->RELEASED: 571
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 12
cleaned-final RELEASED without prior ACQUIRED: 0
raw log: open 2037 lines, close 2037 lines, final 2037 lines (0 new lines in T6-170 session)
new lines since T6-169 close: +33 raw (raw 2004 -> 2037); +9 TICKET, +9 ACQUIRED, +9 RELEASED, +6 COOLDOWN; 9 cycles complete (2 t4 + 7 t8-round169), 0 incomplete
queue open: 101 files / 1414 byte; queue close (before prune): 101 files / 1414 byte; queue after prune 45: 100 files / 1400 byte
queue age tiers open: >=192h: 0; >=72h: 73; >=48h: 84
queue age tiers after prune: >=192h: 0; >=72h: 72; >=48h: 83
prune 45: deleted cooldown-t10-round118 mtime 2026-11-15T13:13:10.224403320Z size 14 byte, rule (b), prune 2026-11-22T11:48:04Z epoch 1795348084, age 166.58h (166h34m), 1.42h before 7-day deadline 2026-11-22T13:13:10Z
prune candidates -mtime +7 (rule a): 0
new oldest after prune: cooldown-t2-round119 mtime 2026-11-15T23:58:34.816797537Z
boot open/close/final: 5df1871f-7e19-45e1-a357-1ca4fd89bc33 btime 1795345865 = 2026-11-22T11:11:05Z (uptime -s agrees)
reboot #78 (boot e298bb52, btime 2026-11-22T09:14:38Z): last RELEASED before btime 2026-11-22T09:03:17Z (t4, hold 208s); lock empty 681 s (11m21s) before btime; 0 log lines in (09:03:17Z, 09:14:38Z]; first line after btime 2026-11-22T09:30:06Z; 0 STALE-LOCK new -> NO holder killed
reboot #79? (boot 5df1871f, btime 2026-11-22T11:11:05Z, number NOT certified by T6 — belongs to T0-170; btime self-verified by T6 from /proc/stat + uptime -s): last RELEASED before btime 2026-11-22T09:48:30Z (t8-round169, hold 230s); lock empty 4955 s (1h22m35s) before btime; 0 log lines in (09:48:30Z, 11:11:05Z]; 0 STALE-LOCK new -> NO holder killed
gap #77->#78: 3046 s (recheck matches MEMORY)
gap #78->#79?: 6987 s (1h56m27s)
gap #76->#77 recheck: 3089 s (matches T6-169)
inotify max_user_watches: 63747 open and close
clock: open Cloudflare 11:37:59Z vs local 11:37:58Z (~1 s); close Cloudflare 11:47:49Z vs local 11:47:47Z (~2 s incl fetch delay)
zombies: open 0; close 1 (pid 31534, ppid 31518, dpkg-preconfigure <defunct>, STAT ZN, etime 00:00; parent gone at recheck — see F-170-T6-1)
X11: open empty; close 3 sockets X193/X194/X195 created 11:44Z (other thread's Xvfb, 11th consecutive same 3 displays)
watcher at close: b2-watcher.sh pid 2339 (round170-t9), started in session by T9; T6 started no watcher
grep KHONG NHA on full log: 0
count_blockers: poll script 2 occurrences; suite 1 occurrence (comment line 151 only)
```
