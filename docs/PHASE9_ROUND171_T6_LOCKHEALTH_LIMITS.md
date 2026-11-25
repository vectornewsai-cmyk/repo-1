# PHASE9 ROUND171 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 21 LIÊN TIẾP) + #79/#80 KHÔNG GIẾT HOLDER + prune lần 46: XÓA 2 FILE — LIMITS

- Đợt: 171, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 21:35 +07 22/11/2026 (= 14:35:51Z). Chạy
  14:44Z → 15:01Z 22/11/2026. Lúc mở đã ở trên boot
  `2acdd1ab` (btime 14:31:01Z) — boot này là #80 theo brief
  giao (btime 14:31:01Z); T6 TỰ XÁC MINH btime 14:31:01Z
  từ /proc/stat + `uptime -s` (cả hai khớp) nhưng KHÔNG
  tự chứng nhận số hiệu #80 (thuộc T0-171), chỉ chứng
  nhận từ log lock rằng #79/#80 KHÔNG giết holder (xem
  §2/§8); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) prune lần 46 theo đúng quy tắc
  prune các đợt trước (queue 100); (b) kiểm (A) 120/120 lần
  thứ 21 (tổng 2520/2520 nếu sạch); (c) chứng nhận reboot
  #79/#80 có giết holder không (lock trống trước btime từng
  reboot bao lâu; #79 btime ~11:11:05Z — ĐÃ ĐƯỢC XÁC NHẬN
  theo quyết (d) đợt 170; #80 btime 14:31:01Z — nếu sạch
  thì chuỗi "không giết holder" từ #69 lên 12 reboot);
  (d) đếm lock ACQUIRED/RELEASED độc lập, đối chiếu cặp,
  ghi 0 đang giữ hay không; (e) ghi mọi phát hiện/sai số
  dạng F-171-T6-*.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–170,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–170); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (581 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 12, STALE-LOCK GIỮ 12
  (0 ca mới cả hai kỳ vọng). Reboot #79 KHÔNG giết holder
  (lock trống 1h22m35s trước btime — T6-171 kiểm lại độc
  lập từ log gốc, KHỚP T6-170; số hiệu ĐÃ ĐƯỢC XÁC NHẬN
  theo quyết (d) đợt 170); #80 KHÔNG giết holder (lock
  trống 1h49m38s trước btime — số hiệu chưa được T6 chứng
  nhận, thuộc T0-171; nếu #80 được xác nhận → chuỗi lên
  12 reboot).
  Prune lần 46: xóa 2 file cũ nhất (điều (b)) — queue 102 →
  100 file — KHÔNG PHẢI CHỜ lock (lock TRỐNG lúc mở, lúc
  đóng và ngay trước prune — giống đợt 167/168/169/170).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round171-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  boot-verify-final.txt, time-open.txt, time-close.txt, queue-open.txt,
  queue-oldest-true.txt, prune-candidates.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, vite-lock-v2-raw-final.log,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt, analyze-log.py,
  new-lines-since-t6-170.txt, prune-deleted.txt, prune-time.txt,
  suite-start.txt, suite-end.txt, harness-start.txt,
  harness-end.txt, inotify-open.txt, inotify-close.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  status-final.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a171.sh,
  t7-block-a171.sh,
  t7-a171-churn.log, t7-control-a171.stdout.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 2acdd1ab (btime 14:31:01Z); lock TRỐNG; queue 101 file (T6-170 đóng 100 + 1 file mới)

- **Boot lúc mở và lúc đóng: boot_id
  `2acdd1ab-23a6-41b0-9d90-40641d2404a0`, btime 14:31:01Z
  theo /proc/stat** (epoch 1795357861; `uptime -s` =
  14:31:01; `journal --list-boots` chỉ 1 dòng 2acdd1ab,
  first entry 14:31:13Z). Uptime ~13' lúc T6 bắt đầu
  (14:44Z), ~27' lúc snapshot đóng (14:58Z), ~30' lúc kiểm
  cuối (15:01Z). Boot này là #80 theo brief giao (btime
  14:31:01Z, ngay trước khi đợt mở 14:35:51Z đúng 4m50s) —
  **T6 TỰ XÁC MINH btime 14:31:01Z** (hai nguồn độc lập
  /proc/stat + `uptime -s` khớp nhau) nhưng **KHÔNG tự
  chứng nhận số hiệu #80** (thuộc T0-171); T6 chỉ chứng
  nhận từ log lock rằng #79/#80 KHÔNG giết holder (xem
  §2/§8). **KHÔNG có reboot trong phiên T6** (boot_id
  giống nhau lúc mở, lúc đóng và lúc kiểm cuối sau prune).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sun, 22 Nov 2026 14:44:54 GMT` vs local 14:44:53Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, trong đó có độ trễ
  fetch curl ~1–2 s); lúc đóng Cloudflare 14:58:07Z vs
  local 14:58:06Z (chênh ~1 s — cùng họ lúc mở, không phải
  lệch đồng hồ). Các mốc wall đợt 171 đọc trực tiếp được.
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
  từ T6-170 đóng: 100 sau prune 45 + 1 file cooldown mới
  `cooldown-t8-round170`, mtime 12:41Z (§2). File
  `cooldown-t4` được ghi đè mtime mới 14:53Z trong phiên
  (chu kỳ t4 mới, §2) — ghi đè tại chỗ, không đổi số lượng.

## 1. Quét zombie: 0 zombie lúc mở, lúc đóng và lúc kiểm cuối; 0 vite thật của T6; X11 trống lúc mở, 4 socket lúc đóng (X196 MỚI — xem F-171-T6-2)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 14:44Z
  (mở, `ps-full-open.txt`) và lúc 14:58Z
  (đóng, `ps-full-close.txt`); kiểm lại zombie lúc kiểm
  cuối 15:01Z bằng `ps -eo stat`.
- **Lúc mở, lúc đóng và lúc kiểm cuối: 0 zombie.**
  Zombie `dpkg-preconfigure <defunct>` (pid 31534) của
  F-170-T6-1 ĐÃ HẾT — không còn trên bảng ps (reboot #80
  đã dọn bảng process; xem F-171-T6-3). 0 process dpkg/apt
  nào lúc mở hay lúc đóng.
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống
  hoàn toàn; 0 dòng chứa chuỗi "vite" trong snapshot ps
  lúc mở (ngoại trừ lệnh exec của chính T6 — đã lọc).
  **Lúc đóng: 0 vite thật của T6** — T6 không khởi động
  Xvfb/vite nào, không kill process nào trong phiên này.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #80 đã dọn
  sạch 3 socket X193/X194/X195 của đợt 170).
  **Lúc đóng: 4 socket X193 / X194 / X195 / X196, tạo
  14:50Z (X193) và 14:51Z (X194/X195/X196)** — của các
  luồng khác đợt 171 (khởi động Xvfb trong phiên; T6 không
  khởi động Xvfb/vite nào, không đụng tới các process
  này). **X196 là display thứ tư — lần đầu tiên có 4
  socket** (các đợt trước tối đa 3: X193/X194/X195 — xem
  F-171-T6-2; T8-171 sở hữu dọn dẹp).
- **Watcher: `b2-watcher.sh` pid 7295 (round171-t9) có mặt
  lúc mở và lúc đóng** — khởi động 14:44Z, trước snapshot
  mở của T6. Watcher-170 pid 20516 (round170-t9) VẮNG MẶT
  cả hai snapshot — T6 chỉ ghi nhận sự vắng mặt, giao
  T5-171 xác nhận vòng đời watcher (chết theo reboot #80
  là giả thuyết, không phải kết luận của T6).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-171).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (~14:44Z và ~14:58Z) — **GIỐNG trần trên #69, #70,
  #71, #73, #74, #75, #76, #77 và #79** (theo T9-168/T6-168/T6-169/T6-170); khác
  63756 trên #67 (T6-164 đo) — xem §11, ghi nhận, không
  hành động.
- Tải hệ thống trong phiên: các luồng đợt 171 khởi động
  dần (T9 watcher 14:44Z, Xvfb 14:50–14:51Z của luồng khác,
  chu kỳ lock t4 + t0-round171 trong phiên — xem §2)
  — harness churn vẫn 120/120 (xem §6).
  Suite đợt này chạy ~25 s/lượt trung bình (cửa sổ 6 lượt
  14:47:33Z → 14:50:06Z, ~2m33s; tương đương đợt 170:
  21–25 s/lượt).

## 2. Lock lúc mở: TRỐNG; +35 dòng kể từ T6-170 đóng — TẤT CẢ SẠCH, 10 CHU KỲ MỚI HOÀN TẤT (8 TRƯỚC PHIÊN + 2 TRONG PHIÊN); #79/#80 KHÔNG GIẾT HOLDER (PHÁT HIỆN MỚI)

- **Lúc mở (14:44Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (14:58Z): lock vẫn TRỐNG** — status
  `TRỐNG`, `0 ticket + 102 cooldown` (trước prune — tăng
  1 file cooldown mới trong phiên, §7).
  **Prune KHÔNG PHẢI CHỜ** (xem §7): lock trống lúc mở,
  lúc đóng và ngay trước prune (`status-before-prune.txt`
  15:00Z) — giống đợt 167/168/169/170, khác đợt 166 phải chờ T4-166.
- **Log lock +35 dòng kể từ T6-170 đóng** (raw 2037 lúc
  T6-170 đóng → 2066 lúc T6-171 mở → 2072 lúc snapshot
  đóng → 2072 lúc kiểm cuối): 29 dòng trước phiên T6;
  **+6 dòng trong phiên T6-171** (2 chu kỳ của luồng khác
  đợt 171 — t4 + t0-round171; 0 dòng nào trong phiên là
  của T6 — suite chạy trên log riêng trong /tmp, harness
  chạy trên /tmp).
- Đối chiếu 29 dòng trước phiên (khớp đúng từng dòng, file
  `new-lines-since-t6-170.txt`, dòng thô 2038–2066):
  - t4: 3 dòng — 1 chu kỳ (attempt 11:55:27Z → RELEASED
    11:58:53Z, hold 206 s) — t4 đợt 170, lượt yên #39
    (attempt1-5df1871f, khớp aggregate 170 §4).
  - t8-round170: 26 dòng — 7 chu kỳ bắt đầu (12:08:45Z →
    12:37:33Z); **7 chu kỳ HOÀN TẤT** (holds 156 / 902 /
    131 / 240 / 60 / 121 / 230 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14952–14962 ms trên cổng 5390/5490); 0 chu kỳ
    dở dang. Chu kỳ hold 902 s (12:12:02Z → 12:27:04Z) là
    pha dài nhất trong 7 chu kỳ — trùng cửa sổ kẹt WebKit
    84l10 của T8-170 (12:12:02–12:27:03Z, aggregate 170 §8)
    — lock vẫn RELEASED bình thường sau đó, không bị giết.
  - Tổng trước phiên: Δ TICKET +8, Δ ACQUIRED +8, Δ RELEASED +8,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **8/8 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ dở dang.**
- Đối chiếu 6 dòng trong phiên (dòng thô 2067–2072):
  - t4: 3 dòng — 1 chu kỳ (TICKET 14:50:04Z → ACQUIRED
    14:50:05Z, wait 1 s → RELEASED 14:53:57Z, hold 232 s)
    — chu kỳ t4 đợt 171 (lượt yên đợt 171 — T4-171 sở hữu
    verdict; T6 chỉ đối chiếu log).
  - t0-round171: 3 dòng — 1 chu kỳ (TICKET 14:50:33Z →
    ACQUIRED 14:53:58Z, wait 205 s — chờ t4 nhả lock →
    RELEASED 14:57:22Z, hold 204 s) — xếp hàng bình thường
    sau t4, không TIMEOUT, không STALE.
  - Tổng trong phiên: Δ TICKET +2, Δ ACQUIRED +2,
    Δ RELEASED +2, Δ COOLDOWN +0. **2/2 chu kỳ hoàn tất
    sạch; 0 chu kỳ dở dang.** File `cooldown-t4` ghi đè
    mtime mới 14:53Z; file mới `cooldown-t0-round171`
    (mtime 14:57Z) làm queue tăng 101 → 102 (§7).
- **REBOOT #79 (btime 11:11:05Z 22/11, boot `5df1871f` —
  số hiệu ĐÃ ĐƯỢC XÁC NHẬN theo quyết (d) đợt 170: T0-170
  + T7-170 xác minh 9 nguồn, KHỚP) — KHÔNG giết holder
  nào (T6-171 KIỂM LẠI ĐỘC LẬP từ log gốc, KHỚP T6-170):**
  dòng lock cuối trước reboot là t8-round169 RELEASED
  09:48:30Z (hold 230 s) — cùng dòng cuối của log tại thời
  điểm đó; dòng đầu sau reboot: t4 TICKET 11:55:27Z — tức
  lock trống **1h22m35s (4.955 s) trước reboot**. Không có
  ACQUIRED nào chưa release tại thời điểm #79, không có
  dòng STALE-LOCK mới nào sau #79 (STALE-LOCK vẫn 12 — ca
  mới nhất là ca #68 lúc 19:16:47Z 21/11, TRƯỚC #79),
  still held = 0 lúc T6-171 mở, lock TRỐNG xác minh độc
  lập lúc mở 14:44Z.
  **Kết luận: #79 không giết holder nào — verdict sạch
  (khoảng trống 4.955 s). Chuỗi "không giết holder" mới
  từ #69 giữ 11 reboot (#69–#79) theo quyết (h) đợt 170.**
- **REBOOT #80 (btime 14:31:01Z 22/11, boot `2acdd1ab` —
  số hiệu CHƯA được T6 chứng nhận, thuộc T0-171; btime
  TỰ XÁC MINH bởi T6: /proc/stat btime 1795357861 +
  `uptime -s` 14:31:01Z khớp nhau) — KHÔNG giết holder
  nào (PHÁT HIỆN MỚI CỦA T6-171):** dòng lock cuối trước
  reboot là t8-round170 RELEASED 12:41:23Z (hold 230 s);
  dòng đầu sau reboot: KHÔNG CÓ (0 dòng log sau 12:41:23Z
  tới lúc T6-171 mở) — tức lock trống **1h49m38s (6.578 s)
  trước reboot**. Không có ACQUIRED nào chưa release tại
  thời điểm #80, 0 STALE-LOCK mới sau #80.
  **Kết luận: #80 không giết holder nào — verdict sạch
  (khoảng trống 6.578 s; số hiệu #80 chờ T0-171 xác
  nhận — nếu được xác nhận, chuỗi lên 12 reboot).**
- **Gap #79→#80 = 11.996 s** (3h19m56s; 11:11:05Z →
  14:31:01Z — T6-171 tính từ btime đã xác minh).
  **Gap #78→#79 = 6.987 s** (1h56m27s; 09:14:38Z →
  11:11:05Z — T6-171 kiểm lại độc lập từ btime, KHỚP
  MEMORY/aggregate 170).
  **Gap #77→#78 = 3.046 s — T6-171 kiểm lại độc lập từ
  btime, KHỚP quyết (d) đợt 168 / T6-169 / T6-170**
  (1795338878 − 1795335832 = 3046).
- **File cooldown mới kể từ T6-170 đóng:
  `cooldown-t8-round170` (mtime 12:41Z) + `cooldown-t0-round171`
  (mtime 14:57Z)** — 2 file làm tổng queue tăng 100 →
  102. Số học khớp: 100 + 2 = 102 ✓. File
  `cooldown-t0-round171` là file đợt hiện tại nên được bảo
  vệ bởi điều (c) — đồng thời là file mới nhất nên không
  nằm trong diện xóa của điều (b) trong bất kỳ trường hợp
  nào; `cooldown-t8-round170` là file đợt ngay trước, cũng
  được bảo vệ bởi điều (c).

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 315 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 10 chu kỳ hoàn tất
  kể từ T6-170 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 305 chu kỳ T6-170 đã đếm = **315 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (305 đợt
    170 + 10 đợt này). Chu kỳ bị #68 giết KHÔNG tính
    vào số hoàn tất (nó là bằng chứng reboot giết holder,
    không phải lỗi thứ tự ghi — STALE-LOCK thu hồi đúng).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 2066 dòng chính thức lúc kiểm cuối, 581 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — bản đã lọc
= raw trừ đúng 6 dòng đó, lọc bằng `awk '$2!="tA" &&
$2!="tH"'` — cột owner là $2, bài học F-162-T6-1;
diff bản đã lọc mở/đóng/final giống nhau về nội dung cũ —
35 dòng mới kể từ T6-170 đóng + 0 dòng giữa đóng và kiểm
cuối, §2; analyzer chạy trên bản đã lọc).
Bản đã lọc lúc đóng: **2066 dòng** (raw 2072) — **+35 dòng
kể từ T6-170 đóng** (2031 → 2066; 29 trước phiên + 6 trong
phiên, đều đã đối chiếu §2). Kiểm cuối sau
prune (15:01Z 22/11): bản đã lọc **2066 dòng** (raw 2072),
RELEASED 581, cặp 581, đang giữ 0, double-acquire 12 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-169 đóng | T6-170 đóng | T6-171 mở | T6-171 đóng (snapshot) | Δ trong phiên T6-171 |
|---|---|---|---|---|---|
| Tổng dòng | 1998 | 2031 | 2060 | 2066 | +6 |
| TICKET | 585 | 594 | 602 | 604 | +2 |
| ACQUIRED | 574 | 583 | 591 | 593 | +2 |
| RELEASED | 562 | 571 | 579 | 581 | +2 |
| COOLDOWN | 254 | 260 | 265 | 265 | +0 |
| STALE-LOCK | 12 | 12 | 12 | 12 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 562 | 571 | 581 | 581 | +2 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 | — |
| Double-acquire | 12 | 12 | 12 | 12 | 0 mới trong phiên |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 593 / RELEASED 581, 581 cặp.** Các số 583/571
  là kiểm cuối đợt 170 (không phải đợt này); 574/562 là
  kiểm cuối đợt 169. Bảng trên dùng đúng ba số này (đã đối
  chiếu với bảng §4 của LIMITS T6-169 và T6-170 — cả hai tự
  nó đúng).
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối (sau
  prune):** ACQUIRED 593 − RELEASED 581 = 12
  ACQUIRED chưa release trong lịch sử log — nhưng cả 12 đều
  đã được xử lý: 11 ca cũ (10 ca double-acquire cũ + 1 ca
  t8-round159 03:12:16Z STALE-LOCK thu hồi holder bị #60 giết
  — §8 đợt 160) + 1 ca t4 19:16:47Z (STALE-LOCK thu hồi holder
  bị #68 giết — §2 đợt 165). Analyzer xác nhận `still held
  at end of log: 0` ở cả ba snapshot mở/đóng/kiểm cuối. Lock
  TRỐNG lúc mở, lúc đóng và lúc kiểm cuối — status
  xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 12 — 0 ca mới kể từ T6-170 đóng,
  0 ca mới trong phiên T6-171.** Ca mới nhất vẫn là
  analyzer dòng 1843 (bản đã lọc — t4 ACQUIRED 19:16:47Z sau
  STALE-LOCK cùng giây, thu hồi holder bị #68 giết — §2 đợt 165).
  **Kết luận: 0 double-acquire THẬT mới.** STALE-LOCK GIỮ 12 —
  0 ca mới (ca mới nhất vẫn 19:16:47Z, thu hồi #68).
  **Hai con số là CÙNG MỘT sự kiện thu hồi #68, không phải hai
  sự kiện riêng** (nhắc lại từ đợt 160/161/162/163/164/165/166/167/168/169/170,
  quyết (v) đợt 162, quyết (r) đợt 163).
- **0 double-acquire mới** kể từ T6-170 đóng. 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (10 chu kỳ mới sạch kể từ T6-170 đóng,
  0 chu kỳ dở dang ngoài ca bị #68 giết đã thu hồi),
  0 zombie lúc mở/lúc đóng/lúc kiểm cuối, 0 stale mới trong phiên, queue 0 ticket,
  log nhất quán (581 cặp + 0 đang giữ lúc kiểm cuối, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–171 (toàn đợt) và đợt 171 (tới ~15:01Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **315 chu kỳ thật** chứng minh (§3).
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

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng
  = lúc kiểm cuối** (bản (A) đợt 151). Live-code khối T7
  (bỏ comment/dòng trống) md5
  **`c92f2efff2080fbe6712522343e9e400`** — khớp đúng
  T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169/T6-170 §6.2.
  File khối T7 đã trích `t7-block-a171.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169 và 170 (cùng md5). Harness đợt này chạy đúng code (A)
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
- `bash -n` harness t7-control-a171.sh: OK (bản sao của
  t7-control-a170.sh, chỉ đổi hậu tố a170 → a171).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–170 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ hai mươi mốt liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~14:47–14:50Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (cửa sổ 6 lượt
14:47:33Z → 14:50:06Z, ~2m33s — tương đương đợt 170:
21–25 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
+6 dòng trong phiên T6-171 (0 dòng nào là của T6, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round171-t6/t7-control-a171.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169/T6-170 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 2acdd1ab (#80 theo
brief, btime 14:31:01Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a171.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169 và 170; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a171-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 531 ms, max 3482 ms, trung bình 1986,48 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'05" (14:50:24–14:57:29Z).
- **CAVEAT CHỒNG LẤN VỚI T4-171 (xem F-171-T6-1):** harness
  chạy 14:50:24–14:57:29Z; chu kỳ lock t4 trong phiên là
  TICKET 14:50:04Z → RELEASED 14:53:57Z (hold 232 s) — tức
  harness CHỒNG LẤN cửa sổ attempt của t4 trong
  14:50:24–14:53:57Z (~3m33s). Pha poll/gate của t4 kết thúc
  TRƯỚC khi harness bắt đầu (TICKET 14:50:04Z < 14:50:24Z)
  nên số đếm gate không bị ô nhiễm; churn chỉ là `sleep`
  1,5 s trần (không CPU, không chạm trình duyệt) nên ảnh
  hưởng load trong lúc attempt là không đáng kể. T6 ghi rõ
  mốc giờ để T4-171/T10-171 tự đánh giá — T6 KHÔNG phán
  verdict attempt của T4.
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

- **Kết luận: (A) VẪN XANH sau hai mươi đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ hai mươi mốt liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 2520/2520 dưới churn qua 21 đợt). Chú thích tỉ lệ
  (như T6-150–170): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 20 (đợt 170) → **21 (đợt
  171 — lần thứ hai mươi mốt xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 52 (đợt 170) → **53 (đợt 171,
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
  - 14:44Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-170 thêm `cooldown-t8-round170`
    sau khi T6-170 prune, §2); quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    — 0 byte, đã ghi lại file riêng như T6-166/167/168/169/170) — điều (a)
    không kích hoạt.
  - Lock TRỐNG lúc mở (14:44Z), TRỐNG lúc snapshot
    đóng (14:58Z) và TRỐNG ngay trước prune
    (`status-before-prune.txt` 15:00Z) — **prune KHÔNG PHẢI CHỜ**
    (giống đợt 167/168/169/170 không phải chờ; khác đợt 166 phải chờ
    T4-166). Lưu ý: trong phiên T6-171 CÓ 2 chu kỳ lock
    của luồng khác (t4 + t0-round171, §2) — cả hai đều đã
    RELEASED xong trước khi prune chạy (lần lượt 14:53:57Z
    và 14:57:22Z; prune 15:00:04Z).
  - 15:00:04Z 22/11 (epoch 1795359604): điều (b) KÍCH HOẠT:
    tổng 102 > 100 → xóa 2 file cũ nhất tới khi còn 100.
    File cũ nhất: **`cooldown-t2-round119`, mtime
    2026-11-15T23:58:34.816797537Z, 159,03h tuổi lúc xóa**
    (≥48h — thỏa điều kiện không xóa file <48h; không phải
    file đợt hiện tại hay đợt ngay trước — file cooldown cũ
    từ 15/11, không thuộc đợt 170/171). File cũ thứ hai:
    **`cooldown-t1`, mtime 2026-11-16T00:04:25.484794835Z,
    158,93h tuổi lúc xóa** (≥48h; không thuộc đợt 170/171).
    Xác định "cũ nhất" bằng mtime chính xác tới nano-giây:
    `cooldown-t2-round119` 23:58:34.816797537Z, sớm hơn
    file kế tiếp `cooldown-t1` 00:04:25.484794835Z đúng
    ~5m51s; `cooldown-t1` sớm hơn file kế tiếp
    `cooldown-t8-round119` 00:35:55.082780278Z đúng
    ~31m30s. Tuổi tính từ đúng epoch giờ prune trong
    `prune-time.txt` (bài học F-164-T6-1; `prune-time.txt`
    ghi SAU `rm` trong cùng một lệnh — bài học F-167-T6-3).
    Tên file cũ nhất lấy từ `queue-oldest-true.txt`
    (`ls -ltr | head`, cũ nhất lên đầu — đúng tên sau bài
    học F-170-T6-2).
  - **Kết quả prune đợt 171 (lần 46): 2 file đã xóa
    (`cooldown-t2-round119` + `cooldown-t1`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (14:44Z) **101 file / 1414 byte**;
  lúc snapshot đóng (14:58Z, trước khi prune) **102 file /
  1428 byte** (tăng 1 file mới `cooldown-t0-round171` trong
  phiên, §2; log lock +6 dòng trong phiên);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (15:01Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 2 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-170 đóng: 100 + 2 file mới
  (`cooldown-t8-round170` + `cooldown-t0-round171`) = 102 ✓ — khớp đúng số T10-170 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 74 file; ≥48h (`-mtime +1`): 84
  file**. Lúc đóng (trước prune): **≥192h: 0 file; ≥72h:
  74 file; ≥48h: 84 file** (2 file mới đều <48h nên không
  đổi tầng). Sau prune (15:00Z): **≥192h: 0 file; ≥72h:
  72 file; ≥48h: 82 file** — ≥72h giảm 74 → 72 (xóa
  đúng 2 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t8-round119`, mtime 2026-11-16T00:35:55Z —
  lúc 15:00Z mới **~158,41h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 74, tăng 1 so với lúc
  mở đợt 170 (73) — 1 file vượt mốc 72h trong khoảng ~3h giữa
  hai lần mở; khớp số học, không phải lỗi đếm.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ hai mươi hai liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
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
  `cooldown-t5`, đợt 170 xóa
  `cooldown-t10-round118`, đợt này xóa
  `cooldown-t2-round119` + `cooldown-t1` trước khi chúng
  đủ 7 ngày — `cooldown-t2-round119` đủ 7 ngày theo đồng
  hồ tường vào khoảng **22/11 23:58Z** nhưng đã bị xóa ở
  đợt 171, sớm 8,97h; `cooldown-t1` đủ 7 ngày vào khoảng
  **23/11 00:04Z** nhưng đã bị xóa ở đợt 171, sớm 9,07h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
  **Kiểm số lần nối lại cẩn thận (brief giao dặn):** LIMITS
  T6-170 §7 đã đếm "lần thứ hai mươi mốt" (đợt 150–170 nối liên
  tiếp); đợt này là **lần thứ hai mươi hai** — đợt 150–171 =
  22 đợt liên tiếp.
- **Prune lần 47 (T6-172): tổng lock 100 sau prune 46 —
  kiểm lại lúc mở đợt 172** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t8-round119` đủ 7 ngày ~23/11 00:35Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-171; #79/#80 KHÔNG GIẾT HOLDER; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **2acdd1ab** (btime
  14:31:01Z = epoch 1795357861). T6 **TỰ XÁC MINH btime**
  14:31:01Z (hai nguồn /proc/stat + `uptime -s` khớp) nhưng
  **KHÔNG tự chứng nhận** số hiệu reboot #80 (thuộc
  T0-171 — lúc T6 mở chưa có cờ `round171-t0.done`
  trên đĩa; T6 chỉ chứng nhận từ log lock).
- Uptime boot lúc đóng ~27'. `journal --list-boots`
  chỉ 1 dòng 2acdd1ab (first entry 14:31:13Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~14:58Z, boot_id giống lúc mở; kiểm
  lại sau prune ~15:01Z, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  14:58:07Z vs local 14:58:06Z — chênh ~1 s (trong đó có
  độ trễ fetch; lúc mở chênh ~1 s). Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 171
  đọc trực tiếp được.
- **REBOOT #79 (btime 11:11:05Z, boot `5df1871f` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 170) — KHÔNG giết holder**
  (§2): lock trống 1h22m35s trước btime (RELEASED cuối
  09:48:30Z); 0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch — T6-171 kiểm lại độc lập từ log gốc,
  KHỚP T6-170.**
  **REBOOT #80 (btime 14:31:01Z, boot `2acdd1ab` — số hiệu
  chưa được T6 chứng nhận) — KHÔNG giết holder** (§2):
  lock trống 1h49m38s trước btime (RELEASED cuối 12:41:23Z);
  0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch, chờ T0-171 xác nhận số hiệu — nếu được
  xác nhận, chuỗi lên 12 reboot.**
  **Chuỗi "không giết holder" MỚI bắt đầu lại từ #69: 11 reboot
  (#69, #70, #71, #72, #73, #74, #75, #76, #77, #78, #79 — ĐÃ
  XÁC NHẬN) + #80 chờ xác nhận số hiệu (nếu #80 được xác
  nhận → 12).**
- **REBOOT #78 (btime 09:14:38Z, boot `e298bb52`) —
  KHÔNG giết holder** (§2 đợt 170, T6-171 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 11m21s trước btime
  (RELEASED cuối 09:03:17Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #77 (btime 08:23:52Z, boot `c44cc3ba`) —
  KHÔNG giết holder** (§2 đợt 169, T6-171 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 1h44m39s trước btime
  (RELEASED cuối 06:39:13Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #76 (btime 07:32:23Z, boot `f2b97695` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 168) — KHÔNG giết holder**
  (§2 đợt 169, T6-171 đối chiếu lại độc lập từ log gốc —
  khớp): lock trống 53m10s trước btime
  (RELEASED cuối 06:39:13Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #75 (btime 05:32:46Z, boot `576ca271`) —
  KHÔNG giết holder** (§2 đợt 168, T6-171 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 40m19s trước btime
  (RELEASED cuối 04:52:27Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #74 (btime 04:05:29Z, boot `194efd93` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 167) — KHÔNG giết holder**
  (§2 đợt 168, T6-171 đối chiếu lại độc lập từ log gốc —
  khớp): lock trống 3h25m59s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #73 (btime 02:28:01Z, boot `b643911f`) —
  KHÔNG giết holder** (§2 đợt 167, T6-171 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 1h48m31s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #72 (btime 02:05:05Z 22/11, boot `9e089ef6`) —
  KHÔNG giết holder** (§2 đợt 167, T6-171 đối chiếu lại
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
  T6 không phán mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80 — giao T2-171.
- **Watcher-170 lần 2 (pid 20516 lúc T5-170 đóng) đã chết
  theo reboot #80?** — T6 chỉ ghi nhận sự vắng mặt ở cả
  hai snapshot, không phán vòng đời (T5-171 sở hữu;
  `b2-watcher.sh` pid 7295 mới của round171-t9 đã chạy
  trong phiên T6-171).
  **POSTBOOT_PASS #80 CHƯA CÓ lúc T6 đóng** (giao T5-171);
  POSTBOOT_PASS #79 ĐÃ CÓ (11:49:14Z, replay-đầy-đủ, poll=0 —
  aggregate 170); POSTBOOT_PASS #78 KHÔNG CÓ (boot thứ 14 lọt —
  không bù được, aggregate 170).
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
  #78 KHÔNG giết holder (lock trống 11m21s trước btime — đợt 170,
  số hiệu ĐÃ XÁC NHẬN, quyết (e) đợt 170).
  #79 KHÔNG giết holder (lock trống 1h22m35s trước btime — đợt này
  kiểm lại độc lập, số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 170).
  #80 KHÔNG giết holder (lock trống 1h49m38s trước btime — đợt này,
  số hiệu chưa được T6 chứng nhận).**

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng và lúc kiểm cuối: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-171
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (15:01Z 22/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 2072 dòng thô /
  2066 dòng chính thức, 581 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round171-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND171_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round171-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 171 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 171 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–170 (T10-170 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-171).

## 11. GHI CHÚ CHO T10-171 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ hai mươi mốt liên tiếp, tổng 2520/2520 qua 21
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 20 → 21 (lần thứ hai mươi mốt xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 52 → 53 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (581 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); **#79 KHÔNG GIẾT HOLDER (lock trống
  1h22m35s — T6-171 kiểm lại độc lập, KHỚP T6-170; số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 170); #80 KHÔNG GIẾT HOLDER
  (lock trống 1h49m38s — số hiệu chưa được T6 chứng nhận,
  btime 14:31:01Z do T6 tự xác minh)** — gap #79→#80 =
  11.996 s; gap #78→#79 = 6.987 s (kiểm lại khớp); gap
  #77→#78 = 3.046 s (kiểm lại khớp).
  Double-acquire/STALE-LOCK GIỮ 12 — 0 ca mới cả hai (ca mới
  nhất vẫn là thu hồi #68 đợt 165, đừng đếm thành sự kiện mới).
  Prune lần 46 xóa 2 file, queue về đúng trần 100 (**KHÔNG
  PHẢI CHỜ lock** — lock trống lúc mở/lúc đóng/ngay trước
  prune; +35 dòng kể từ T6-170 đóng đều là của t4 (2 chu kỳ)
  + t8-round170 (7 chu kỳ) + t0-round171 (1 chu kỳ), sạch;
  6 dòng trong phiên, 0 dòng nào của T6).
- **Reboot #79/#80 KHÔNG giết holder** (lock trống
  4.955 s / 6.578 s trước btime — verdict sạch).
  **#68 GIẾT holder** vẫn là phát hiện của đợt 165 (chuỗi #61–#67 đứt).
  **Đồng hồ ở giờ thật** (Cloudflare ~1 s lúc mở, ~1 s lúc
  đóng, gồm độ trễ fetch). Mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80 giao T2-171.
  **Kiểm cuối đợt này: ACQUIRED 593 / RELEASED 581, 581
  cặp** (đừng mang 583/571 — đó là kiểm cuối đợt 170 —
  vào cột đợt này; bài học (r) đợt 163).
- **Double-acquire GIỮ 12, STALE-LOCK GIỮ 12 — 0 ca mới
  cả hai.** Hai con số vẫn là CÙNG MỘT sự kiện thu hồi #68 —
  T10-171 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng (quyết (v) đợt 162, quyết (r) đợt 163).
- 0 zombie lúc mở/lúc đóng/lúc kiểm cuối (**zombie dpkg
  F-170-T6-1 ĐÃ HẾT** — reboot #80 dọn bảng process);
  X11 trống lúc mở, 4 socket X193/X194/X195/**X196** lúc đóng
  (của luồng khác đợt 171, tạo 14:50–14:51Z — **X196 là
  display thứ tư, lần đầu tiên** — xem F-171-T6-2)
  — không phải của T6; T10-171 lưu ý khi đối chiếu log (+35 dòng
  kể từ T6-170 đóng đều là của t4 + t8-round170 +
  t0-round171, sạch).
- **Inotify: trần `max_user_watches` nay là 63747** (giống
  trần trên #69/#70/#71/#73/#74/#75/#76/#77/#79). Ghi nhận theo quyết (m) đợt 146 (ghi làm chú thích, không
  hành động); T9-171 sở hữu hệ quả headroom nếu có. T6
  không suy đoán nguyên nhân đổi.
- **CAVEAT CHỒNG LẤN HARNESS/T4 (F-171-T6-1):** harness
  churn của T6 (14:50:24–14:57:29Z) chồng lấn cửa sổ attempt
  t4 trong phiên (TICKET 14:50:04Z → RELEASED 14:53:57Z,
  hold 232 s) trong 14:50:24–14:53:57Z. Pha poll/gate của t4
  kết thúc TRƯỚC khi harness bắt đầu nên số đếm gate không
  bị ô nhiễm; churn chỉ là `sleep` trần nên ảnh hưởng load
  không đáng kể — T6 ghi rõ mốc giờ để T4-171/T10-171 tự
  đánh giá; T6 KHÔNG phán verdict attempt của T4.
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #79/#80 VẪN
  MỞ; #88? VẪN MỞ; mù #94? MỞ theo quyết (b) đợt 163;
  mù #95? MỞ theo quyết (b) đợt 163; mù #96? MỞ sau điều
  tra đầy đủ đợt 165 — chờ quyết parent §12.1 (m) đợt 165;
  birefnet 0 thử lần 24 (đợt 170); u2net là fallback chính thức;
  POSTBOOT_PASS #79 ĐÃ CÓ (replay-đầy-đủ) — giao T5-171 theo dõi tiếp;
  POSTBOOT_PASS #80 CHƯA CÓ — giao T5-171;
  kết cục run 170 thuộc T7-171).
- Cờ `round171-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-171 (F-171-T6-n)

- **F-171-T6-1 — Harness churn của T6 chồng lấn cửa sổ
  attempt của t4 trong phiên (~3m33s).** Harness
  `t7-control-a171.sh` chạy 14:50:24–14:57:29Z; chu kỳ lock
  t4 trong phiên là TICKET 14:50:04Z → ACQUIRED 14:50:05Z →
  RELEASED 14:53:57Z (hold 232 s) — chồng lấn
  14:50:24–14:53:57Z. Mỗi lần chạy harness bơm 1 process
  `WebProcess-churn` (`sleep` 1,5 s, tên khớp mẫu poll) sau
  delay ngẫu nhiên 0,5–3,5 s. Đánh giá ảnh hưởng: (i) pha
  poll/gate của t4 kết thúc TRƯỚC khi harness bắt đầu
  (TICKET 14:50:04Z < harness start 14:50:24Z) nên số đếm
  gate/cửa yên không bị ô nhiễm; (ii) trong lúc attempt,
  churn chỉ là process `sleep` trần — không CPU, không chạm
  trình duyệt, ảnh hưởng load1 không đáng kể; (iii) T6-170
  cũng có chồng lấn ~1 phút giữa harness và pha poll của
  T4-170 mà không ghi nhận vấn đề — lần này chồng lấn dài
  hơn và trúng cửa sổ attempt nên T6 ghi rõ để T4-171/T10-171
  tự đánh giá. T6 KHÔNG phán verdict attempt của T4-171.
  Ảnh hưởng tới verdict lock/(A)/prune của T6: không có
  (lock +6 dòng trong phiên đều đã đối chiếu sạch §2;
  harness 120/120 trên /tmp).
- **F-171-T6-2 — X11 có 4 socket lúc đóng (X193/X194/X195/
  X196), lần đầu tiên có display thứ tư.** Lúc mở
  `/tmp/.X11-unix/` trống (reboot #80 đã dọn); lúc đóng
  4 socket, tạo 14:50Z (X193) và 14:51Z (X194/X195/X196) —
  của các luồng khác đợt 171 (T6 không khởi động Xvfb/vite
  nào). Các đợt trước tối đa 3 socket cùng 3 số display
  X193/X194/X195 (11 đợt liên tiếp, quyết (bb) đợt 163).
  T6 không đụng tới các socket này, không phán vòng đời —
  chỉ ghi nhận; giao T8-171 dọn dẹp.
- **F-171-T6-3 — Zombie `dpkg-preconfigure <defunct>` của
  F-170-T6-1 (pid 31534) ĐÃ HẾT.** Lúc mở/lúc đóng/lúc kiểm
  cuối đợt này đều 0 zombie; 0 process dpkg/apt nào trong
  cả hai snapshot ps. Zombie cũ biến mất sau reboot #80
  (bảng process được reset theo boot) — đây là ghi nhận
  trạng thái, không phải T6 đã xử lý process nào (T6 không
  kill/không đụng process nào trong phiên).
- **F-171-T6-4 — Queue vượt trần 2 file trong một đợt nên
  điều (b) xóa 2 file (lần đầu kể từ đợt 151).** Lúc mở
  101 file (do `cooldown-t8-round170` thêm sau prune 45),
  trong phiên +1 file `cooldown-t0-round171` → 102 file
  lúc đóng; điều (b) xóa 2 file cũ nhất tới khi còn 100.
  Không phải lỗi đếm: số học 100 + 2 file mới = 102 khớp
  (§2/§7); cả hai file xóa đều ≥48h, không thuộc đợt hiện
  tại/đợt ngay trước, và đều bị xóa trước mốc 7 ngày
  (sớm 8,97h / 9,07h) — chuỗi F-147-T6-1 nối lại lần thứ
  22. Bài học: khi queue mở đã 101 thì prune đợt đó gần
  như chắc chắn xóa ≥1 file; T6 các đợt sau cứ đếm đúng
  số file lúc đóng trước khi prune, không giả định chỉ xóa 1.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a171-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round171-t6/appendix-numbers.txt` giữ bản
trích gốc (tuổi prune tính từ đúng epoch giờ prune trong
`prune-time.txt` — bài học F-164-T6-1; md5 live-code chỉ
tính bằng pipeline shell đứng sau khi bắt lỗi F-164-T6-2):

```
churn: n_runs=120 pass=120 fail=0 B1=1:120 B2=0:120
churn delay_ms: min=531 max=3482 mean=1986.48
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
churn harness: 2026-11-22T14:50:24Z -> 2026-11-22T14:57:29Z (~7m05s), boot 2acdd1ab
suite window: 2026-11-22T14:47:33Z -> 2026-11-22T14:50:06Z
suite run1: PASS=9 FAIL=0 T7A=1 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 rc=0
log lock (bản đã lọc): open raw 2066 / cleaned 2060; close raw 2072 / cleaned 2066; final raw 2072 / cleaned 2066
delta kể từ T6-170 đóng: +35 dòng = TICKET +10 ACQUIRED +10 RELEASED +10 COOLDOWN +5
kiểm cuối: ACQUIRED 593 / RELEASED 581, 581 cặp, 0 đang giữ, double-acquire 12, STALE-LOCK 12
gap #79->#80: 11996 s; lock trống trước btime #79: 4955 s; trước btime #80: 6578 s
prune 15:00:04Z epoch 1795359604: xóa cooldown-t2-round119 (159,03h, sớm 8,97h) + cooldown-t1 (158,93h, sớm 9,07h); queue 102 -> 100 file / 1400 byte
```
