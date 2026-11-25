# PHASE9 ROUND172 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 22 LIÊN TIẾP) + #80/#81 KHÔNG GIẾT HOLDER + prune lần 47: XÓA 1 FILE — LIMITS

- Đợt: 172, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 00:35:51 +07 23/11/2026 (= 17:35:51Z 22/11).
  Chạy 17:39Z → 17:51Z 22/11/2026. Lúc mở đã ở trên boot
  `4b9db449` (btime 17:02:05Z) — boot này là #81 theo brief
  giao / quyết (d) đợt 171 (btime 17:02:05Z); T6 TỰ XÁC MINH
  btime 17:02:05Z từ /proc/stat + `uptime -s` (cả hai khớp)
  nhưng KHÔNG tự chứng nhận số hiệu #81 (thuộc T0-172),
  chỉ chứng nhận từ log lock rằng #80/#81 KHÔNG giết
  holder (xem §2/§8); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm (A) 120/120 lần thứ 22
  (chuỗi xanh kép đang 21; tổng 2640/2640 nếu sạch);
  (b) prune lần 47 theo đúng quy tắc prune các đợt trước
  (queue 102 → 100 theo mẫu đợt 171 — ghi số thực tế;
  prune KHÔNG chờ lock); (c) chứng nhận reboot #80/#81
  có giết holder không (lock trống trước btime từng
  reboot bao lâu; 0 STALE-LOCK mới?; chuỗi "không giết
  holder" từ #69 đang 12 reboot (#69–#80) — cập nhật
  sau #81); (d) đối chiếu lệch T6 đợt 171 đã giải (file
  cờ POSTBOOT_PASS không hậu tố có từ 14:52Z; T6 tìm file
  có hậu tố boot id nên báo chưa có) — đợt này tìm đúng
  tên file, không lặp lỗi; (e) SỬA WORDING F-171-T6-1
  (quyết (h) đợt 171 nhắc T6): câu "pha poll/gate kết thúc
  trước khi harness bắt đầu" dễ hiểu lầm — ghi rõ cửa sổ
  chồng lấn chính xác và chạm pha nào khi mô tả quan hệ
  poll/gate/harness, áp dụng ngay trong LIMITS đợt này;
  (f) ghi mọi phát hiện/sai số dạng F-172-T6-*.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–171,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–171); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (590 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 12, STALE-LOCK GIỮ 12
  (0 ca mới cả hai kỳ vọng). Reboot #80 KHÔNG giết holder
  (lock trống 1h49m38s trước btime — T6-172 kiểm lại độc
  lập từ log gốc, KHỚP T6-171; số hiệu ĐÃ ĐƯỢC XÁC NHẬN
  theo quyết (d)/(h) đợt 171); #81 KHÔNG giết holder
  (lock trống 30m37s trước btime — số hiệu chưa được T6
  chứng nhận, thuộc T0-172; nếu #81 được xác nhận → chuỗi
  lên 13 reboot).
  Prune lần 47: xóa 1 file cũ nhất (điều (b)) — queue 101 →
  100 file — KHÔNG PHẢI CHỜ lock (lock TRỐNG lúc mở, lúc
  đóng, ngay trước prune và lúc kiểm cuối — giống đợt
  167/168/169/170/171).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round172-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  boot-verify-final.txt, time-open.txt, time-close.txt,
  time-final.txt, queue-open.txt, queue-oldest-true.txt,
  prune-candidates.txt, vite-lock-v2-cleaned-open.log,
  vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, vite-lock-v2-raw-final.log,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt, analyze-log.py,
  new-lines-since-t6-171.txt, prune-deleted.txt, prune-time.txt,
  suite-start.txt, suite-end.txt, harness-start.txt,
  harness-end.txt, inotify-open.txt, inotify-close.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  status-final.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a172.sh,
  t7-block-a172.sh,
  t7-a172-churn.log, t7-control-a172.stdout.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 4b9db449 (btime 17:02:05Z); lock TRỐNG; queue 101 file (T6-171 đóng 100 + 1 file mới)

- **Boot lúc mở và lúc đóng: boot_id
  `4b9db449-7699-4441-a4cf-72983f15dbbd`, btime 17:02:05Z
  theo /proc/stat** (epoch 1795366925; `uptime -s` =
  17:02:05; `journal --list-boots` chỉ 1 dòng 4b9db449,
  first entry 17:02:17Z). Uptime ~37' lúc T6 bắt đầu
  (17:39Z), ~48' lúc snapshot đóng (17:49Z), ~49' lúc kiểm
  cuối (17:51Z). Boot này là #81 theo brief giao / quyết
  (d) đợt 171 (btime 17:02:05Z, ngay trước khi đợt mở
  17:35:51Z đúng 33m46s) —
  **T6 TỰ XÁC MINH btime 17:02:05Z** (hai nguồn độc lập
  /proc/stat + `uptime -s` khớp nhau) nhưng **KHÔNG tự
  chứng nhận số hiệu #81** (thuộc T0-172); T6 chỉ chứng
  nhận từ log lock rằng #80/#81 KHÔNG giết holder (xem
  §2/§8). **KHÔNG có reboot trong phiên T6** (boot_id
  giống nhau lúc mở, lúc đóng và lúc kiểm cuối sau prune).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sun, 22 Nov 2026 17:38:39 GMT` vs local 17:38:37Z
  (**chênh ~2 s — đồng hồ ở giờ thật**, trong đó có độ trễ
  fetch curl ~1–2 s); lúc đóng Cloudflare 17:49:48Z vs
  local 17:49:46Z (chênh ~2 s — cùng họ lúc mở, không phải
  lệch đồng hồ). Các mốc wall đợt 172 đọc trực tiếp được.
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
  từ T6-171 đóng: 100 sau prune 46 + 1 file cooldown mới
  `cooldown-t8-round171`, mtime 16:31:28Z (§2). File
  `cooldown-t4` được ghi đè mtime mới 15:11:35Z (chu kỳ t4
  đợt 171, §2) — ghi đè tại chỗ, không đổi số lượng.

## 1. Quét zombie: 0 zombie thật lúc mở, lúc đóng và lúc kiểm cuối; 0 vite thật của T6; X11 trống lúc mở, 3 socket lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 17:39Z
  (mở, `ps-full-open.txt`) và lúc 17:49Z
  (đóng, `ps-full-close.txt`); kiểm lại zombie lúc kiểm
  cuối 17:51Z bằng `ps -eo stat` (đếm ` Z `).
- **Lúc mở, lúc đóng và lúc kiểm cuối: 0 zombie thật.**
  `grep -c defunct` trên snapshot đóng cho 1 — đó là
  false positive: dòng khớp là chính lệnh exec của T6
  (command line chứa chuỗi "defunct" vì script chụp
  snapshot nằm trong cùng một lệnh bash chứa lệnh grep
  sau đó) — xem F-172-T6-2. 0 process dpkg/apt nào lúc mở
  hay lúc đóng (chỉ apt=1/2 trong log poll của T4-172 —
  hoạt động apt của T5 repair, §6/F-172-T6-4, không phải
  process dpkg/apt trên bảng ps của T6).
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống
  hoàn toàn; 1 dòng chứa chuỗi "vite" trong snapshot ps
  lúc mở là chính lệnh exec của T6 (đường dẫn
  vite-lock-v2.log trong command line — đã lọc).
  **Lúc đóng: 0 vite thật của T6** — T6 không khởi động
  Xvfb/vite nào, không kill process nào trong phiên này.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #81 đã dọn
  sạch 4 socket X193/X194/X195/X196 của đợt 171).
  **Lúc đóng: 3 socket X193 / X194 / X195, tạo
  17:45Z** — của các luồng khác đợt 172 (khởi động Xvfb
  trong phiên; T6 không khởi động Xvfb/vite nào, không đụng
  tới các process này). Trở lại 3 socket như các đợt
  trước 171 (đợt 171 có 4 socket với X196 là lần đầu —
  F-171-T6-2; T8-171 đã dọn).
- **Watcher: `b2-watcher.sh` pid 6126 (round172-t9) có mặt
  lúc mở và lúc đóng** — khởi động ~17:38:46Z (etime 00:29
  lúc snapshot mở 17:39:15Z), sau khi đợt mở 17:35:51Z —
  bình thường; T6 chỉ ghi nhận (xem F-172-T6-5). Watcher-171
  pid 7295 (round171-t9) VẮNG MẶT cả hai snapshot — T6 chỉ
  ghi nhận sự vắng mặt, giao T5-172 xác nhận vòng đời
  watcher (chết theo reboot #81 là giả thuyết, không phải
  kết luận của T6).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-172).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (~17:39Z và ~17:49Z) — **GIỐNG trần trên #69, #70,
  #71, #73, #74, #75, #76, #77, #79 và #80** (theo
  T9-168/T6-168/T6-169/T6-170/T6-171); khác
  63756 trên #67 (T6-164 đo) — xem §11, ghi nhận, không
  hành động.
- Tải hệ thống trong phiên: các luồng đợt 172 khởi động
  dần (T9 watcher ~17:38:46Z, Xvfb 17:45Z của luồng khác,
  T5 replay/repair trong phiên, T4 poll-wait từ 17:41:20Z
  — xem §2/§6) — harness churn vẫn 120/120 (xem §6).
  Suite đợt này chạy ~25 s/lượt trung bình (cửa sổ 6 lượt
  17:39:52Z → 17:42:20Z, ~2m28s; tương đương đợt 171:
  21–25 s/lượt).

## 2. Lock lúc mở: TRỐNG; +32 dòng kể từ T6-171 đóng — TẤT CẢ SẠCH, 9 CHU KỲ MỚI HOÀN TẤT (TRƯỚC PHIÊN); 0 DÒNG TRONG PHIÊN; #80/#81 KHÔNG GIẾT HOLDER (PHÁT HIỆN MỚI: #81)

- **Lúc mở (17:39Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (17:49Z): lock vẫn TRỐNG** — status
  `TRỐNG`, `0 ticket + 101 cooldown` (không có file
  cooldown mới trong phiên, §7).
  **Prune KHÔNG PHẢI CHỜ** (xem §7): lock trống lúc mở,
  lúc đóng, ngay trước prune (`status-before-prune.txt`
  17:50Z) và lúc kiểm cuối (`status-final.txt` 17:51Z) —
  giống đợt 167/168/169/170/171, khác đợt 166 phải chờ T4-166.
- **Log lock +32 dòng kể từ T6-171 đóng** (raw 2072 lúc
  T6-171 đóng → 2104 lúc T6-172 mở → 2104 lúc snapshot
  đóng → 2104 lúc kiểm cuối): 32 dòng trước phiên T6;
  **+0 dòng trong phiên T6-172** (không chu kỳ lock nào
  của luồng khác diễn ra trong 17:39–17:51Z — T4-172 vẫn
  đang ở pha poll/gate-wait, chưa lấy TICKET, xem §6).
- Đối chiếu 32 dòng trước phiên (khớp đúng từng dòng, file
  `new-lines-since-t6-171.txt`, dòng thô 2073–2104):
  - t4: 6 dòng — 2 chu kỳ (attempt 15:02:43Z → RELEASED
    15:06:15Z, hold 212 s; attempt 15:08:11Z → RELEASED
    15:11:35Z, hold 204 s) — t4 đợt 171, lượt yên #40
    (attempt1/attempt2 — khớp aggregate 171 §4: attempt3
    chạy 15:08:10Z; T4-171 sở hữu verdict).
  - t8-round171: 26 dòng — 7 chu kỳ bắt đầu (15:33:56Z →
    16:27:38Z); **7 chu kỳ HOÀN TẤT** (holds 157 / 901 /
    907 / 902 / 60 / 121 / 230 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14938–14964 ms trên cổng 5490/5390); 0 chu kỳ
    dở dang. Ba chu kỳ hold ~900 s (15:38:11Z → 15:53:12Z,
    15:53:27Z → 16:08:34Z, 16:08:49Z → 16:23:51Z) là các pha
    dài trong cửa sổ kẹt WebKit đợt 171 (aggregate 171 §8:
    harness WebKit 0/3 + 3 kẹt thật) — lock vẫn RELEASED
    bình thường sau đó, không bị giết.
  - Tổng trước phiên: Δ TICKET +9, Δ ACQUIRED +9, Δ RELEASED +9,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **9/9 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ dở dang.**
- **REBOOT #80 (btime 14:31:01Z 22/11, boot `2acdd1ab` —
  số hiệu ĐÃ ĐƯỢC XÁC NHẬN theo quyết (d)/(h) đợt 171: T0-171
  + T7-171 xác minh 9 nguồn, KHỚP) — KHÔNG giết holder
  nào (T6-172 KIỂM LẠI ĐỘC LẬP từ log gốc, KHỚP T6-171):**
  dòng lock cuối trước reboot là t8-round170 RELEASED
  12:41:23Z (hold 230 s) — cùng dòng cuối của log tại thời
  điểm đó; dòng đầu sau reboot: t4 TICKET 14:50:04Z — tức
  lock trống **1h49m38s (6.578 s) trước reboot**. Không có
  ACQUIRED nào chưa release tại thời điểm #80, không có
  dòng STALE-LOCK mới nào sau #80 (STALE-LOCK vẫn 12 — ca
  mới nhất là ca #68 lúc 19:16:47Z 21/11, TRƯỚC #80),
  still held = 0 lúc T6-172 mở, lock TRỐNG xác minh độc
  lập lúc mở 17:39Z.
  **Kết luận: #80 không giết holder nào — verdict sạch
  (khoảng trống 6.578 s).**
- **REBOOT #81 (btime 17:02:05Z 22/11, boot `4b9db449` —
  số hiệu CHƯA được T6 chứng nhận, thuộc T0-172; btime
  TỰ XÁC MINH bởi T6: /proc/stat btime 1795366925 +
  `uptime -s` 17:02:05Z khớp nhau) — KHÔNG giết holder
  nào (PHÁT HIỆN MỚI CỦA T6-172):** dòng lock cuối trước
  reboot là t8-round171 RELEASED 16:31:28Z (hold 230 s);
  dòng đầu sau reboot: KHÔNG CÓ (0 dòng log sau 16:31:28Z
  tới lúc T6-172 kiểm cuối 17:51:01Z) — tức lock trống
  **30m37s (1.837 s) trước reboot**. Không có ACQUIRED nào
  chưa release tại thời điểm #81, 0 STALE-LOCK mới sau #81.
  **Kết luận: #81 không giết holder nào — verdict sạch
  (khoảng trống 1.837 s; số hiệu #81 chờ T0-172 xác
  nhận — nếu được xác nhận, chuỗi lên 13 reboot).**
- **Gap #80→#81 = 9.064 s** (2h31m04s; 14:31:01Z →
  17:02:05Z — T6-172 tính từ btime đã xác minh, KHỚP
  quyết (d) đợt 171).
  **Gap #79→#80 = 11.996 s** (3h19m56s; 11:11:05Z →
  14:31:01Z — T6-172 kiểm lại độc lập từ btime, KHỚP
  quyết (d) đợt 171 / T6-171).
- **File cooldown mới kể từ T6-171 đóng:
  `cooldown-t8-round171` (mtime 16:31:28Z)** — 1 file làm
  tổng queue tăng 100 → 101. Số học khớp: 100 + 1 = 101 ✓.
  File `cooldown-t8-round171` là file đợt ngay trước nên
  được bảo vệ bởi điều (c) — đồng thời là file mới nhất
  nên không nằm trong diện xóa của điều (b) trong bất kỳ
  trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 324 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 9 chu kỳ hoàn tất
  kể từ T6-171 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 315 chu kỳ T6-171 đã đếm = **324 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (315 đợt
    171 + 9 đợt này). Chu kỳ bị #68 giết KHÔNG tính
    vào số hoàn tất (nó là bằng chứng reboot giết holder,
    không phải lỗi thứ tự ghi — STALE-LOCK thu hồi đúng).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 2098 dòng chính thức lúc kiểm cuối, 590 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — bản đã lọc
= raw trừ đúng 6 dòng đó, lọc bằng `awk '$2!="tA" &&
$2!="tH"'` — cột owner là $2, bài học F-162-T6-1;
diff bản đã lọc mở/đóng/final giống nhau về nội dung cũ —
32 dòng mới kể từ T6-171 đóng + 0 dòng giữa đóng và kiểm
cuối, §2; analyzer chạy trên bản đã lọc).
Bản đã lọc lúc đóng: **2098 dòng** (raw 2104) — **+32 dòng
kể từ T6-171 đóng** (2066 → 2098; 32 trước phiên + 0 trong
phiên, đều đã đối chiếu §2). Kiểm cuối sau
prune (17:51Z 22/11): bản đã lọc **2098 dòng** (raw 2104),
RELEASED 590, cặp 590, đang giữ 0, double-acquire 12 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-170 đóng | T6-171 đóng | T6-172 mở | T6-172 đóng (snapshot) | Δ trong phiên T6-172 |
|---|---|---|---|---|---|
| Tổng dòng | 2031 | 2066 | 2098 | 2098 | +0 |
| TICKET | 594 | 604 | 613 | 613 | +0 |
| ACQUIRED | 583 | 593 | 602 | 602 | +0 |
| RELEASED | 571 | 581 | 590 | 590 | +0 |
| COOLDOWN | 260 | 265 | 270 | 270 | +0 |
| STALE-LOCK | 12 | 12 | 12 | 12 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 571 | 581 | 590 | 590 | +0 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 | — |
| Double-acquire | 12 | 12 | 12 | 12 | 0 mới trong phiên |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 602 / RELEASED 590, 590 cặp.** Các số 593/581
  là kiểm cuối đợt 171 (không phải đợt này); 583/571 là
  kiểm cuối đợt 170. Bảng trên dùng đúng ba số này (đã đối
  chiếu với bảng §4 của LIMITS T6-170 và T6-171 — cả hai tự
  nó đúng).
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối (sau
  prune):** ACQUIRED 602 − RELEASED 590 = 12
  ACQUIRED chưa release trong lịch sử log — nhưng cả 12 đều
  đã được xử lý: 11 ca cũ (10 ca double-acquire cũ + 1 ca
  t8-round159 03:12:16Z STALE-LOCK thu hồi holder bị #60 giết
  — §8 đợt 160) + 1 ca t4 19:16:47Z (STALE-LOCK thu hồi holder
  bị #68 giết — §2 đợt 165). Analyzer xác nhận `still held
  at end of log: 0` ở cả ba snapshot mở/đóng/kiểm cuối. Lock
  TRỐNG lúc mở, lúc đóng và lúc kiểm cuối — status
  xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 12 — 0 ca mới kể từ T6-171 đóng,
  0 ca mới trong phiên T6-172.** Ca mới nhất vẫn là
  analyzer dòng 1843 (bản đã lọc — t4 ACQUIRED 19:16:47Z sau
  STALE-LOCK cùng giây, thu hồi holder bị #68 giết — §2 đợt 165).
  **Kết luận: 0 double-acquire THẬT mới.** STALE-LOCK GIỮ 12 —
  0 ca mới (ca mới nhất vẫn 19:16:47Z, thu hồi #68).
  **Hai con số là CÙNG MỘT sự kiện thu hồi #68, không phải hai
  sự kiện riêng** (nhắc lại từ đợt 160/161/162/163/164/165/166/167/168/169/170/171,
  quyết (v) đợt 162, quyết (r) đợt 163).
- **0 double-acquire mới** kể từ T6-171 đóng. 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (9 chu kỳ mới sạch kể từ T6-171 đóng,
  0 chu kỳ dở dang ngoài ca bị #68 giết đã thu hồi),
  0 zombie thật lúc mở/lúc đóng/lúc kiểm cuối, 0 stale mới trong phiên, queue 0 ticket,
  log nhất quán (590 cặp + 0 đang giữ lúc kiểm cuối, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–172 (toàn đợt) và đợt 172 (tới ~17:51Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **324 chu kỳ thật** chứng minh (§3).
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
  T6-172 kiểm lại độc lập, KHỚP);
  **reboot #81 KHÔNG giết holder** (khoảng trống 1.837 s —
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
  T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169/T6-170/T6-171 §6.2.
  File khối T7 đã trích `t7-block-a172.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170 và 171 (cùng md5). Harness đợt này chạy đúng code (A)
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
  gì trong phiên (chỉ xóa 1 file cooldown theo luật
  prune đã phê duyệt — §7; không đụng code).
- `bash -n` harness t7-control-a172.sh: OK (bản sao của
  t7-control-a171.sh, chỉ đổi hậu tố a171 → a172).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–171 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ hai mươi hai liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~17:39–17:42Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (cửa sổ 6 lượt
17:39:52Z → 17:42:20Z, ~2m28s — tương đương đợt 171:
21–25 s/lượt).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
+0 dòng trong phiên T6-172 (0 dòng nào là của T6, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round172-t6/t7-control-a172.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168/T6-169/T6-170/T6-171 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 4b9db449 (#81 theo
brief, btime 17:02:05Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a172.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170 và 171; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a172-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 507 ms, max 3491 ms, trung bình 2057,64 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'10" (17:42:27–17:49:37Z).
- **CAVEAT CHỒNG LẤN HARNESS/T4 — ÁP DỤNG SỬA WORDING
  QUYẾT (h) ĐỢT 171 (F-171-T6-1) — xem F-172-T6-1:**
  Quy tắc wording mới từ đợt này: khi mô tả quan hệ
  poll/gate/harness, KHÔNG viết gọn "pha poll/gate kết thúc
  trước khi harness bắt đầu" — mà tách riêng hai pha của
  một attempt và ghi rõ cửa sổ chồng lấn với từng pha:
  (a) **pha đếm gate** (poll → lấy TICKET — gate chưa qua
  thì chưa có TICKET); (b) **pha giữ lock** (TICKET →
  RELEASED — attempt đang chạy). Đợt này harness
  17:42:27–17:49:37Z chồng lấn **pha (a) của T4-172** và
  **KHÔNG chồng lấn pha (b) nào** — ngược với đợt 171
  (harness 14:50:24–14:57:29Z chồng pha (b) của t4 sau
  TICKET 14:50:04Z, pha (a) đã qua trước khi harness bắt
  đầu). Bằng chứng đợt này: poll-wait của T4-172 bắt đầu
  17:41:20Z (`chain-t4.log`); các poll #3–#11
  (17:42:51Z, 17:43:37Z, 17:44:22Z, 17:45:07Z, 17:45:52Z,
  17:46:37Z, 17:47:23Z, 17:48:09Z, 17:48:54Z) nằm TRONG
  cửa sổ harness; gate0=khong-dat trong cả 13 poll tới
  17:50:24Z; **0 TICKET nào được lấy tới lúc kiểm cuối
  17:51:01Z** — T4-172 chưa hề bước vào pha (b) trong
  phiên T6. Đánh giá ảnh hưởng: (i) blockers=0
  (comm-based) trong cả 9 poll nằm trong cửa sổ harness —
  process churn là `exec -a WebProcess-churn sleep 1,5 s`
  (comm vẫn là "sleep") nên không được đếm là blocker theo
  cách đếm comm-based của T4; số legacy trong cửa sổ
  (1,1,1,0,1,1,1,1,0) ở mức hoặc thấp hơn trước harness
  (3, 5, 7) — không có dấu hiệu churn làm phồng số đếm;
  (ii) gate0 giữ khong-dat vì lý do độc lập với churn
  (postboot_exit=1 — POSTBOOT_PASS #81 chỉ được ghi
  17:50:32Z, sau khi harness kết thúc; apt=1 trong các
  poll #2–#12) — churn không gây ra gate pass giả, cũng
  không chặn một gate pass nào; (iii) load1 trong cửa sổ
  0,97–4,35 so với 1,23/1,62 trước harness — tải đã cao
  sẵn và các luồng khác đang hoạt động (Xvfb 17:45Z, T5
  replay/repair); churn chỉ là `sleep` trần, không CPU —
  T6 không quy tải tăng cho churn. **T6 KHÔNG phán verdict
  attempt của T4-172** — T4/T10 sở hữu; T6 chỉ ghi rõ mốc
  giờ và pha chạm để T4-172/T10-172 tự đánh giá.
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

- **Kết luận: (A) VẪN XANH sau hai mươi hai đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ hai mươi hai liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 2640/2640 dưới churn qua 22 đợt). Chú thích tỉ lệ
  (như T6-150–171): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 21 (đợt 171) → **22 (đợt
  172 — lần thứ hai mươi hai xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 53 (đợt 171) → **54 (đợt 172,
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
  - 17:39Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-171 thêm `cooldown-t8-round171`
    sau khi T6-171 prune, §2); quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    — 0 byte, đã ghi lại file riêng như T6-166/167/168/169/170/171) — điều (a)
    không kích hoạt.
  - Lock TRỐNG lúc mở (17:39Z), TRỐNG lúc snapshot
    đóng (17:49Z), TRỐNG ngay trước prune
    (`status-before-prune.txt` 17:50Z) và TRỐNG lúc kiểm
    cuối (17:51Z) — **prune KHÔNG PHẢI CHỜ**
    (giống đợt 167/168/169/170/171 không phải chờ; khác đợt 166 phải chờ
    T4-166). Lưu ý: trong phiên T6-172 có **0 chu kỳ lock**
    của luồng khác (§2) — không có gì để chờ.
  - 17:50:53Z 22/11 (epoch 1795369853): điều (b) KÍCH HOẠT:
    tổng 101 > 100 → xóa 1 file cũ nhất tới khi còn 100.
    File cũ nhất: **`cooldown-t8-round119`, mtime
    2026-11-16T00:35:55.082780278Z, 161,25h tuổi lúc xóa**
    (≥48h — thỏa điều kiện không xóa file <48h; không phải
    file đợt hiện tại hay đợt ngay trước — file cooldown cũ
    từ 16/11, không thuộc đợt 171/172). Xác định "cũ nhất"
    bằng mtime chính xác tới nano-giây:
    `cooldown-t8-round119` 00:35:55.082780278Z, sớm hơn
    file kế tiếp `cooldown-t3-round119` 01:23:30.418448294Z
    đúng ~47m35s. Tuổi tính từ đúng epoch giờ prune trong
    `prune-time.txt` (bài học F-164-T6-1; `prune-time.txt`
    ghi SAU `rm` trong cùng một lệnh — bài học F-167-T6-3).
    Tên file cũ nhất lấy từ `queue-oldest-true.txt`
    (`ls -ltr | head`, cũ nhất lên đầu — đúng tên sau bài
    học F-170-T6-2).
  - **Kết quả prune đợt 172 (lần 47): 1 file đã xóa
    (`cooldown-t8-round119`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (17:39Z) **101 file / 1414 byte**;
  lúc snapshot đóng (17:49Z, trước khi prune) **101 file /
  1414 byte** (0 file mới trong phiên, §2; log lock +0 dòng trong phiên);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (17:51Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-171 đóng: 100 + 1 file mới
  (`cooldown-t8-round171`) = 101 ✓ — khớp đúng số T10-171 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 73 file; ≥48h (`-mtime +1`): 83
  file**. Lúc đóng (trước prune): **≥192h: 0 file; ≥72h:
  73 file; ≥48h: 83 file** (0 file mới trong phiên nên không
  đổi tầng). Sau prune (17:50Z): **≥192h: 0 file; ≥72h:
  72 file; ≥48h: 82 file** — ≥72h giảm 73 → 72 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t3-round119`, mtime 2026-11-16T01:23:30Z —
  lúc 17:50Z mới **~160,46h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 73, giảm 1 so với lúc
  mở đợt 171 (74) — 1 file đã bị xóa ở prune 46; khớp số học, không phải lỗi đếm.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ hai mươi ba liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
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
  `cooldown-t10-round118`, đợt 171 xóa
  `cooldown-t2-round119` + `cooldown-t1`, đợt này xóa
  `cooldown-t8-round119` trước khi nó đủ 7 ngày —
  `cooldown-t8-round119` đủ 7 ngày theo đồng
  hồ tường vào khoảng **23/11 00:35Z** nhưng đã bị xóa ở
  đợt 172, sớm 6,75h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
  **Kiểm số lần nối lại cẩn thận (brief giao dặn):** LIMITS
  T6-171 §7 đã đếm "lần thứ hai mươi hai" (đợt 150–171 nối liên
  tiếp); đợt này là **lần thứ hai mươi ba** — đợt 150–172 =
  23 đợt liên tiếp.
- **Prune lần 48 (T6-173): tổng lock 100 sau prune 47 —
  kiểm lại lúc mở đợt 173** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t3-round119` đủ 7 ngày ~23/11 01:23Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-172; #80/#81 KHÔNG GIẾT HOLDER; đồng hồ ở giờ thật; POSTBOOT_PASS #81 ĐÃ CÓ (tìm đúng tên không hậu tố)

- Boot duy nhất trong phiên: **4b9db449** (btime
  17:02:05Z = epoch 1795366925). T6 **TỰ XÁC MINH btime**
  17:02:05Z (hai nguồn /proc/stat + `uptime -s` khớp) nhưng
  **KHÔNG tự chứng nhận** số hiệu reboot #81 (thuộc
  T0-172 — lúc T6 mở chưa có cờ `round172-t0.done`
  trên đĩa; T6 chỉ chứng nhận từ log lock).
- Uptime boot lúc đóng ~48'. `journal --list-boots`
  chỉ 1 dòng 4b9db449 (first entry 17:02:17Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~17:49Z, boot_id giống lúc mở; kiểm
  lại sau prune ~17:51Z, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  17:49:48Z vs local 17:49:46Z — chênh ~2 s (trong đó có
  độ trễ fetch; lúc mở chênh ~2 s). Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 172
  đọc trực tiếp được.
- **REBOOT #80 (btime 14:31:01Z, boot `2acdd1ab` — số hiệu
  ĐÃ XÁC NHẬN quyết (d)/(h) đợt 171) — KHÔNG giết holder**
  (§2): lock trống 1h49m38s trước btime (RELEASED cuối
  12:41:23Z); 0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch — T6-172 kiểm lại độc lập từ log gốc,
  KHỚP T6-171.**
  **REBOOT #81 (btime 17:02:05Z, boot `4b9db449` — số hiệu
  chưa được T6 chứng nhận) — KHÔNG giết holder** (§2):
  lock trống 30m37s trước btime (RELEASED cuối 16:31:28Z);
  0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch, chờ T0-172 xác nhận số hiệu — nếu được
  xác nhận, chuỗi lên 13 reboot.**
  **Chuỗi "không giết holder" MỚI bắt đầu lại từ #69: 12 reboot
  (#69, #70, #71, #72, #73, #74, #75, #76, #77, #78, #79, #80 — ĐÃ
  XÁC NHẬN) + #81 chờ xác nhận số hiệu (nếu #81 được xác
  nhận → 13).**
- **ĐỐI CHIẾU LỆCH T6 ĐỢT 171 ĐÃ GIẢI — TÌM ĐÚNG TÊN FILE
  (nhiệm vụ (d) brief giao):** quy ước đặt tên đã xác minh
  từ đĩa: file cờ **không hậu tố** `POSTBOOT_PASS` là cờ
  của boot HIỆN TẠI; file **có hậu tố boot id cũ**
  `POSTBOOT_PASS-<boot-id-cũ>` là bản lưu của boot TRƯỚC.
  Bằng chứng: `round171-t5/POSTBOOT_PASS` (không hậu tố,
  mtime 14:52:09.925Z) ghi boot 2acdd1ab (#80, btime
  14:31:01Z, PASS poll=0 lúc 14:52:09Z); còn
  `round171-t5/POSTBOOT_PASS-5df1871f` ghi boot 5df1871f
  (#79, btime 11:11:05Z, PASS lúc 11:49:14Z) — md5
  `30acb1ef…` giống hệt `round170-t5/POSTBOOT_PASS` (cùng
  nội dung #79). T6-171 đã tìm `POSTBOOT_PASS-2acdd1ab`
  (hậu tố = boot hiện tại — tên này không bao giờ tồn tại)
  nên báo chưa có, trong khi file không hậu tố đã có từ
  14:52Z. **Đợt này T6 tìm đúng tên `round172-t5/
  POSTBOOT_PASS` (không hậu tố):** lúc snapshot đóng
  17:49:46Z CHƯA CÓ; kiểm lại lúc kiểm cuối 17:51:01Z
  **ĐÃ CÓ** — mtime 17:50:32.812Z, 324 byte, md5
  `c5763ae618d660cc871ff1db0755bdd9`, ghi boot 4b9db449
  (btime 17:02:05Z; watcher-172) — **repair-som-quyet-h:
  dpkg 795 dòng; cache 110 .deb; lists 75; postboot PASS
  poll1 độc lập exit 0 lúc 17:50:32Z; poll=1; file cũ
  2acdd1ab lưu `POSTBOOT_PASS-2acdd1ab`** (315 byte, mtime
  17:50:32.811Z). Không lặp lỗi đợt 171. Lưu ý thời gian:
  cờ về muộn sau snapshot đóng của T6 75 giây — xem
  F-172-T6-3.
- **REBOOT #79 (btime 11:11:05Z, boot `5df1871f` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 170) — KHÔNG giết holder**
  (§2 đợt 171, T6-172 đối chiếu lại độc lập từ log gốc —
  khớp): lock trống 1h22m35s trước btime
  (RELEASED cuối 09:48:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #78 (btime 09:14:38Z, boot `e298bb52`) —
  KHÔNG giết holder** (§2 đợt 170, T6-172 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 11m21s trước btime
  (RELEASED cuối 09:03:17Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #77 (btime 08:23:52Z, boot `c44cc3ba`) —
  KHÔNG giết holder** (§2 đợt 169, T6-172 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 1h44m39s trước btime
  (RELEASED cuối 06:39:13Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #76 (btime 07:32:23Z, boot `f2b97695` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 168) — KHÔNG giết holder**
  (§2 đợt 169, T6-172 đối chiếu lại độc lập từ log gốc —
  khớp): lock trống 53m10s trước btime
  (RELEASED cuối 06:39:13Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #75 (btime 05:32:46Z, boot `576ca271`) —
  KHÔNG giết holder** (§2 đợt 168, T6-172 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 40m19s trước btime
  (RELEASED cuối 04:52:27Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #74 (btime 04:05:29Z, boot `194efd93` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 167) — KHÔNG giết holder**
  (§2 đợt 168, T6-172 đối chiếu lại độc lập từ log gốc —
  khớp): lock trống 3h25m59s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #73 (btime 02:28:01Z, boot `b643911f`) —
  KHÔNG giết holder** (§2 đợt 167, T6-172 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 1h48m31s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #72 (btime 02:05:05Z 22/11, boot `9e089ef6`) —
  KHÔNG giết holder** (§2 đợt 167, T6-172 đối chiếu lại
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
  T6 không phán mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80/#81 — giao T2-172.
- **Watcher-171 lần 2 (pid 7295 lúc T5-171 đóng) đã chết
  theo reboot #81?** — T6 chỉ ghi nhận sự vắng mặt ở cả
  hai snapshot, không phán vòng đời (T5-172 sở hữu;
  `b2-watcher.sh` pid 6126 mới của round172-t9 đã chạy
  trong phiên T6-172).
  **POSTBOOT_PASS #81 ĐÃ CÓ lúc T6 kiểm cuối** (17:50:32Z,
  repair-som-quyet-h, poll=1 — xem trên); POSTBOOT_PASS #80
  ĐÃ CÓ (14:52:09Z, replay-đầy-đủ, poll=0 — aggregate 171);
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
  #79 KHÔNG giết holder (lock trống 1h22m35s trước btime — đợt 171
  kiểm lại độc lập, số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 170).
  #80 KHÔNG giết holder (lock trống 1h49m38s trước btime — đợt 171,
  số hiệu ĐÃ XÁC NHẬN quyết (d)/(h) đợt 171; T6-172 kiểm lại độc lập, KHỚP).
  #81 KHÔNG giết holder (lock trống 30m37s trước btime — đợt này,
  số hiệu chưa được T6 chứng nhận).**

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng và lúc kiểm cuối: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-172
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (17:51Z 22/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 2104 dòng thô /
  2098 dòng chính thức, 590 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round172-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND172_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round172-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 172 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 172 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–171 (T10-171 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-172).

## 11. GHI CHÚ CHO T10-172 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ hai mươi hai liên tiếp, tổng 2640/2640 qua 22
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 21 → 22 (lần thứ hai mươi hai xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 53 → 54 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (590 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); **#80 KHÔNG GIẾT HOLDER (lock trống
  1h49m38s — T6-172 kiểm lại độc lập, KHỚP T6-171; số hiệu
  ĐÃ XÁC NHẬN quyết (d)/(h) đợt 171); #81 KHÔNG GIẾT HOLDER
  (lock trống 30m37s — số hiệu chưa được T6 chứng nhận,
  btime 17:02:05Z do T6 tự xác minh)** — gap #80→#81 =
  9.064 s; gap #79→#80 = 11.996 s (kiểm lại khớp).
  Double-acquire/STALE-LOCK GIỮ 12 — 0 ca mới cả hai (ca mới
  nhất vẫn là thu hồi #68 đợt 165, đừng đếm thành sự kiện mới).
  Prune lần 47 xóa 1 file, queue về đúng trần 100 (**KHÔNG
  PHẢI CHỜ lock** — lock trống lúc mở/lúc đóng/ngay trước
  prune/lúc kiểm cuối; +32 dòng kể từ T6-171 đóng đều là của t4 (2 chu kỳ)
  + t8-round171 (7 chu kỳ), sạch;
  0 dòng trong phiên, 0 dòng nào của T6).
- **Reboot #80/#81 KHÔNG giết holder** (lock trống
  6.578 s / 1.837 s trước btime — verdict sạch).
  **#68 GIẾT holder** vẫn là phát hiện của đợt 165 (chuỗi #61–#67 đứt).
  **Đồng hồ ở giờ thật** (Cloudflare ~2 s lúc mở, ~2 s lúc
  đóng, gồm độ trễ fetch). Mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80/#81 giao T2-172.
  **Kiểm cuối đợt này: ACQUIRED 602 / RELEASED 590, 590
  cặp** (đừng mang 593/581 — đó là kiểm cuối đợt 171 —
  vào cột đợt này; bài học (r) đợt 163).
- **Double-acquire GIỮ 12, STALE-LOCK GIỮ 12 — 0 ca mới
  cả hai.** Hai con số vẫn là CÙNG MỘT sự kiện thu hồi #68 —
  T10-172 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng (quyết (v) đợt 162, quyết (r) đợt 163).
- 0 zombie thật lúc mở/lúc đóng/lúc kiểm cuối (số 1 của
  `grep defunct` ở snapshot đóng là false positive — lệnh
  exec của chính T6, xem F-172-T6-2);
  X11 trống lúc mở, 3 socket X193/X194/X195 lúc đóng
  (của luồng khác đợt 172, tạo 17:45Z — trở lại 3 socket
  như trước đợt 171) — không phải của T6; T10-172 lưu ý khi đối chiếu log (+32 dòng
  kể từ T6-171 đóng đều là của t4 + t8-round171, sạch).
- **Inotify: trần `max_user_watches` nay là 63747** (giống
  trần trên #69/#70/#71/#73/#74/#75/#76/#77/#79/#80). Ghi nhận theo quyết (m) đợt 146 (ghi làm chú thích, không
  hành động); T9-172 sở hữu hệ quả headroom nếu có. T6
  không suy đoán nguyên nhân đổi.
- **CAVEAT CHỒNG LẤN HARNESS/T4 (F-172-T6-1) — ĐÃ ÁP DỤNG
  SỬA WORDING QUYẾT (h) ĐỢT 171:** harness churn của T6
  (17:42:27–17:49:37Z) chồng lấn **pha đếm gate (pha (a))**
  của T4-172 (polls #3–#11, 17:42:51–17:48:54Z) và
  **KHÔNG chồng lấn pha giữ lock (pha (b)) nào** — T4-172
  chưa lấy TICKET tới lúc kiểm cuối 17:51:01Z; ngược với
  đợt 171 (chồng pha (b) sau TICKET, pha (a) đã qua).
  Blockers comm-based = 0 trong cả 9 poll trong cửa sổ;
  gate0 giữ khong-dat vì postboot_exit=1 + apt=1 (độc lập
  với churn); T6 KHÔNG phán verdict attempt của T4-172.
- **ĐỐI CHIẾU LỆCH T6 ĐỢT 171 (nhiệm vụ (d)) — ĐÃ GIẢI VÀ
  ÁP DỤNG ĐÚNG:** quy ước tên file đã xác minh từ đĩa
  (không hậu tố = boot hiện tại; có hậu tố = bản lưu boot
  trước); T6-172 tìm đúng tên `round172-t5/POSTBOOT_PASS`
  và bắt được cờ #81 ở kiểm cuối 17:50:32Z (poll=1,
  repair-som-quyet-h) — lúc snapshot đóng 17:49:46Z cờ
  chưa có (xem F-172-T6-3).
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #79/#80/#81 VẪN
  MỞ; #88? VẪN MỞ; mù #94? MỞ theo quyết (b) đợt 163;
  mù #95? MỞ theo quyết (b) đợt 163; mù #96? MỞ sau điều
  tra đầy đủ đợt 165 — chờ quyết parent §12.1 (m) đợt 165;
  birefnet 0 thử lần 25 (đợt 171); u2net là fallback chính thức;
  POSTBOOT_PASS #81 ĐÃ CÓ (repair-som-quyet-h, poll=1) — giao T5-172 theo dõi tiếp;
  kết cục run 171 thuộc T7-172).
- Cờ `round172-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-172 (F-172-T6-n)

- **F-172-T6-1 — Harness churn của T6 chồng lấn PHA ĐẾM
  GATE của T4-172 (ngược đợt 171: đợt 171 chồng pha GIỮ,
  đợt này chồng pha ĐẾM) + ÁP DỤNG SỬA WORDING QUYẾT (h)
  ĐỢT 171.** Harness `t7-control-a172.sh` chạy
  17:42:27–17:49:37Z; poll-wait của T4-172 bắt đầu
  17:41:20Z; các poll #3–#11 (17:42:51–17:48:54Z) nằm
  trong cửa sổ harness; gate0=khong-dat trong cả 13 poll
  tới 17:50:24Z; 0 TICKET được lấy tới lúc kiểm cuối
  17:51:01Z — T4-172 chưa bước vào pha giữ lock (pha (b))
  trong phiên T6. Mỗi lần chạy harness bơm 1 process
  `WebProcess-churn` (`sleep` 1,5 s, tên khớp mẫu poll) sau
  delay ngẫu nhiên 0,5–3,5 s. Đánh giá ảnh hưởng: (i)
  blockers=0 (comm-based) trong cả 9 poll trong cửa sổ —
  churn không được đếm là blocker vì comm của process
  `exec -a … sleep` vẫn là "sleep"; số legacy trong cửa sổ
  (1,1,1,0,1,1,1,1,0) ở mức hoặc thấp hơn trước harness
  (3, 5, 7) — không có dấu hiệu churn làm phồng số đếm;
  (ii) gate0 giữ khong-dat vì lý do độc lập với churn
  (postboot_exit=1 — POSTBOOT_PASS #81 chỉ được ghi
  17:50:32Z, sau khi harness kết thúc; apt=1 trong các
  poll #2–#12) — churn không gây gate pass giả, cũng không
  chặn một gate pass nào; (iii) load1 trong cửa sổ
  0,97–4,35 so với 1,23/1,62 trước harness — tải đã cao sẵn
  và các luồng khác đang hoạt động (Xvfb 17:45Z, T5
  replay/repair); churn chỉ là `sleep` trần — không CPU,
  không chạm trình duyệt, ảnh hưởng load trong lúc poll là
  không đáng kể. **SỬA WORDING (quyết (h) đợt 171):** từ
  đợt này, khi mô tả quan hệ poll/gate/harness, T6 tách
  riêng pha (a) đếm gate (poll → TICKET) và pha (b) giữ
  lock (TICKET → RELEASED), ghi rõ cửa sổ chồng lấn với
  từng pha kèm mốc giờ — KHÔNG viết gọn "pha poll/gate kết
  thúc trước khi harness bắt đầu" (câu này gộp hai pha
  thành một và gây hiểu lầm: ở đợt 171 nó đúng cho pha
  (a) nhưng che mất việc harness vẫn chồng pha (b); ở đợt
  172 nó sai hẳn vì pha (a) CHƯA kết thúc khi harness bắt
  đầu). T6 KHÔNG phán verdict attempt của T4-172.
  Ảnh hưởng tới verdict lock/(A)/prune của T6: không có
  (log +0 dòng trong phiên; harness 120/120 trên /tmp).
- **F-172-T6-2 — `grep -c defunct` đếm thừa 1 ở snapshot
  đóng (false positive, không phải zombie thật).** Dòng
  khớp duy nhất là chính lệnh exec bash của T6 (command
  line chứa chuỗi "defunct" vì script chụp snapshot nằm
  trong cùng một lệnh bash chứa lệnh grep chạy sau đó).
  Zombie thật đếm bằng cột stat (`ps -eo stat`, đếm
  ` Z `) = **0** lúc mở, lúc đóng và lúc kiểm cuối.
  Bài học: đếm zombie bằng `ps -eo stat`, không grep chuỗi
  "defunct" trên snapshot chụp trong cùng lệnh chứa từ đó;
  ở đợt 171 con số 0 là đúng vì lệnh chụp snapshot lúc đó
  không chứa chuỗi "defunct" trong cùng invocation.
- **F-172-T6-3 — POSTBOOT_PASS #81 về muộn sau snapshot
  đóng của T6 (75 giây).** Lúc snapshot đóng 17:49:46Z
  file `round172-t5/POSTBOOT_PASS` (đúng tên không hậu tố)
  CHƯA CÓ; kiểm lại lúc kiểm cuối 17:51:01Z thì ĐÃ CÓ
  (mtime 17:50:32.812Z, poll=1, repair-som-quyet-h). Nếu
  T6 chỉ kiểm lúc đóng thì đã báo CHƯA CÓ — đúng tại
  thời điểm đó nhưng lỗi thời 75 giây sau. Bài học: cờ
  postboot có thể về muộn sau khi T6 đóng snapshot — T6
  các đợt sau kiểm lại cờ ở bước kiểm cuối (như đợt này),
  và ghi rõ mốc giờ của từng lần kiểm thay vì một verdict
  duy nhất.
- **F-172-T6-4 — Hoạt động apt tăng vọt lúc T5-172 repair
  (T6 ghi nhận, không phán).** Poll #13 của T4-172
  (17:50:24Z) ghi apt=2, dpkg_lines=171 (trước đó apt=1,
  dpkg_lines=2 trong các poll #1–#12) — trùng lúc T5-172
  đang repair postboot (log repair 17:49:25Z, cờ PASS ghi
  17:50:32Z). T6 không đụng apt/dpkg, không phán nguyên
  nhân — giao T5-172 sở hữu.
- **F-172-T6-5 — Watcher-172 khởi động ~17:38:46Z (sau khi
  đợt mở 17:35:51Z).** `b2-watcher.sh` pid 6126
  (round172-t9) có etime 00:29 lúc snapshot mở 17:39:15Z —
  khởi động sau khi đợt mở, bình thường; T6 chỉ ghi nhận,
  giao T5-172 xác nhận vòng đời watcher.
- **F-172-T6-6 — Queue mở 101 nên điều (b) đợt này chỉ xóa
  1 file (khác đợt 171 xóa 2).** Lúc mở 101 file (do
  `cooldown-t8-round171` thêm sau prune 46), trong phiên
  +0 file → 101 file lúc đóng; điều (b) xóa 1 file cũ nhất
  tới khi còn 100. Không phải lỗi đếm: số học 100 + 1 file mới
  = 101 khớp (§2/§7); file xóa `cooldown-t8-round119`
  ≥48h (161,25h), không thuộc đợt hiện tại/đợt ngay trước,
  và bị xóa trước mốc 7 ngày (sớm 6,75h) — chuỗi F-147-T6-1
  nối lại lần thứ 23. Bài học (nối F-171-T6-4): T6 các đợt
  sau cứ đếm đúng số file lúc đóng trước khi prune, không
  giả định số file xóa.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a172-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round172-t6/appendix-numbers.txt` giữ bản
trích gốc (tuổi prune tính từ đúng epoch giờ prune trong
`prune-time.txt` — bài học F-164-T6-1; md5 live-code chỉ
tính bằng pipeline shell đứng sau khi bắt lỗi F-164-T6-2):

```
churn: n_runs=120 pass=120 fail=0 B1=1:120 B2=0:120
churn delay_ms: min=507 max=3491 mean=2057.64
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
churn harness: 2026-11-22T17:42:27Z -> 2026-11-22T17:49:37Z (~7m10s), boot 4b9db449
suite window: 2026-11-22T17:39:52Z -> 2026-11-22T17:42:20Z
suite run1: PASS=9 FAIL=0 T7A=1 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 rc=0
log lock (bản đã lọc): open raw 2104 / cleaned 2098; close raw 2104 / cleaned 2098; final raw 2104 / cleaned 2098
delta kể từ T6-171 đóng: +32 dòng = TICKET +9 ACQUIRED +9 RELEASED +9 COOLDOWN +5
kiểm cuối: ACQUIRED 602 / RELEASED 590, 590 cặp, 0 đang giữ, double-acquire 12, STALE-LOCK 12
gap #79->#80: 11996 s; gap #80->#81: 9064 s; lock trống trước btime #80: 6578 s; trước btime #81: 1837 s
prune 17:50:53Z epoch 1795369853: xóa cooldown-t8-round119 (161,25h, sớm 6,75h); queue 101 -> 100 file / 1400 byte
POSTBOOT_PASS #81: round172-t5/POSTBOOT_PASS (không hậu tố) mtime 17:50:32.812Z, boot 4b9db449, poll=1, repair-som-quyet-h; md5 c5763ae618d660cc871ff1db0755bdd9
T4-172 poll: poll-wait bắt đầu 17:41:20Z; polls #3–#11 (17:42:51–17:48:54Z) trong cửa sổ harness 17:42:27–17:49:37Z; gate0=khong-dat cả 13 poll tới 17:50:24Z; 0 TICKET lúc kiểm cuối
```
