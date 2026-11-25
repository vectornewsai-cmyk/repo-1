# PHASE9 ROUND175 T6 — (A) 120/120 LẦN THỨ 25 + #86 KHÔNG GIẾT HOLDER (chuỗi 17→18) + prune lần 50: XÓA 1 FILE — LIMITS

- Đợt 175, luồng T6 (lock health + kiểm lại (A) + prune). Lượt cron
  09:35:51 +07 23/11/2026 (= 02:35:51Z 23/11). Chạy 02:38:59Z →
  02:55:09Z 23/11/2026. Lúc mở đã ở trên boot `70b7f7ee` (btime
  01:01:37Z) — #86 ứng viên theo brief; **T0-175 ĐÃ XÁC NHẬN số
  hiệu #86 (9 nguồn, cờ `round175-t0.done` 02:48Z, gap #85→#86 =
  7.321 s)** nên verdict #86 dưới đây là verdict trên số hiệu ĐÃ
  XÁC NHẬN (khác đợt 174, khi #84/#85 còn chờ xác nhận lúc T6
  đóng). T6 TỰ XÁC MINH btime 01:01:37Z từ /proc/stat +
  `uptime -s` (khớp nhau); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) (A) 120/120 lần thứ 25 (chuỗi xanh
  kép đang 24; chuỗi suite xanh đang 56); (b) #86 CÓ GIẾT HOLDER
  KHÔNG (chuỗi "không giết holder" từ #69 đang 17 reboot #69–#85);
  (c) prune lần 50 theo đúng điều (a)/(b) đã đứng; (d) đối chiếu
  pid watcher, GHI RÕ TÊN SCRIPT từng watcher (F-172-T6-5); (e)
  lock stats lúc đóng + POSTBOOT_PASS #86 + inotify + đồng hồ giờ
  thật; (f) ghi rõ nếu harness chồng pha attempt của T4 hay pha O8
  của T0 — chỉ ghi nhận, KHÔNG phán verdict attempt của T4.
- **KẾT QUẢ CHÍNH: (A) CÒN NGUYÊN (suite md5 `a89c0676` không
  đổi, live-code khối T7 `c92f2efff2080fbe6712522343e9e400` khớp
  đợt 151–174, file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–174); kiểm chứng lại DƯƠNG TÍNH: khối T7 trích
  verbatim chạy 120 lần với churn — PASS 120/120 (100%), B1=1 B2=0
  cả 120 lần; suite đầy đủ 9/9 × 6 lượt. Lock KHỎE VỀ CƠ CHẾ (620
  cặp ACQUIRED→RELEASED lúc kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG
  NHẢ", 0 đang giữ) — double-acquire GIỮ 12, STALE-LOCK GIỮ 12 (0
  ca mới cả hai, theo cả hai cách đếm — F-175-T6-3). Reboot #86
  (ĐÃ XÁC NHẬN, T0-175 9 nguồn) KHÔNG giết holder (lock trống
  14m41s = 881 s trước btime — chuỗi "không giết holder" từ #69
  lên 18 reboot). Prune lần 50: xóa 1 file cũ nhất (điều (b)) —
  queue 101 → 100 file — KHÔNG PHẢI CHỜ lock (lock TRỐNG lúc mở,
  lúc đóng, ngay trước prune và lúc kiểm cuối — giống đợt 167–
  174). Lệch pid watcher: KHÔNG CÓ — 15862 = `b2-watcher.sh` của
  T9-175, 16528 = `replay-watch-175.sh` của T5-175 (xem §8; cả hai
  CHƯA chạy lúc snapshot mở 02:38:59Z — F-175-T6-6).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (`520b8baa`), KHÔNG sửa `vcut-poll-quiet-v2.sh`
  (`1710e480`), KHÔNG sửa suite (`a89c0676` — đợt này chỉ kiểm
  lại). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ đọc
  md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round175-t6/` (57 file: ps/ss/
  x11/time/queue/boot/status/md5 snapshot mở-đóng-kiểm cuối, log
  lock raw+cleaned 3 thời điểm, analyze-log.py + kết quả,
  new-lines-since-t6-174.txt, prune-*.txt, suite/harness
  start/end, test-v2-t6-run1…6.log, t7-control-a175.sh,
  t7-block-a175.sh, t7-a175-churn.log, churn-delays.txt,
  iter-out.txt, appendix-numbers.txt).
- Log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`. Repo local
  `~/workspace/repo-1` **không có `.git`** nên T6 không verify
  HEAD tại chỗ bằng git — việc verify ref thuộc lúc push
  (parent, public API).
- Lưu ý dọn dẹp: thư mục làm việc các đợt cũ (`round174-t6/`…)
  đã bị dọn khỏi `hidden_files/` trước đợt này — script
  `analyze-log.py` và harness đợt 174 không còn trên đĩa; T6-175
  VIẾT LẠI cả hai từ mô tả trong LIMITS T6-174 (§6.2) và kiểm
  lại bằng md5 khối trích + đối chiếu hai biến thể đếm trên
  snapshot đóng đợt 174 (F-175-T6-3). T10 các đợt sau lưu ý:
  đừng giả định script đợt trước còn đó.

## 0. Trạng thái lúc bắt đầu — BOOT 70b7f7ee (btime 01:01:37Z); lock TRỐNG; queue 101 file

- **Boot lúc mở, lúc đóng và lúc kiểm cuối: boot_id
  `70b7f7ee-2e0b-4565-b019-bdabc2c6e92c`, btime 01:01:37Z theo
  /proc/stat** (epoch 1795395697; `uptime -s` = 01:01:37;
  `journal --list-boots` chỉ 1 dòng 70b7f7ee, first entry
  01:01:56Z). Uptime ~1h37' lúc T6 bắt đầu (02:38Z), ~1h53' lúc
  kiểm cuối (02:55Z). Boot này là #86 — **T0-175 ĐÃ XÁC NHẬN 9
  nguồn** (cờ `round175-t0.done` 02:48Z); T6 TỰ XÁC MINH btime
  01:01:37Z (hai nguồn /proc/stat + `uptime -s` khớp nhau).
  **KHÔNG có reboot trong phiên T6.**
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc mở.
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date: Mon, 23 Nov
  2026 02:39:01 GMT` vs local 02:38:59Z (**chênh ~2 s — đồng hồ
  ở giờ thật**, gồm độ trễ fetch curl ~1–2 s); lúc đóng
  Cloudflare 02:54:16Z vs local 02:54:15Z (chênh ~1 s); lúc kiểm
  cuối Cloudflare 02:55:11Z vs local 02:55:09Z (chênh ~2 s).
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1 frozen
  `fd21193c`, poll `1710e480`, khớp baseline. Suite test lúc mở
  `a89c0676` (bản (A) đợt 151, không đổi). preview.tsx md5
  `530e10a7` (giữ vĩnh viễn, khớp) — `apps/web/src/preview.tsx`.
  `md5-open.txt`/`md5-close.txt`/`md5-final.txt` đều là đo tươi
  từ đĩa bằng `md5sum` trực tiếp (F-163-T6-1); cả ba khớp nhau
  từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp số học từ T6-174
  đóng: 100 sau prune 49 + 1 file cooldown mới
  `cooldown-t8-round174` (mtime 00:46:56Z) (§2). File
  `cooldown-t4` được ghi đè mtime mới 00:13:29Z (chu kỳ t4
  attempt2 đợt 174) — ghi đè tại chỗ, không đổi số lượng (số học
  100 + 1 = 101 chỉ khớp nếu `cooldown-t4` đã tồn tại từ trước).

## 1. Quét zombie: 0 zombie thật; 0 vite thật của T6; X11 trống lúc mở, 3 socket lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 02:38:59Z
  (mở) và lúc ~02:54Z (đóng); kiểm lại zombie lúc kiểm cuối
  02:55Z bằng `ps -eo stat` (đếm `^Z`).
- **Lúc mở, lúc đóng và lúc kiểm cuối: 0 zombie thật.**
  `grep -c ' defunct'` trên snapshot đóng cho 1 — false
  positive tự-match (lệnh exec của chính T6 chứa chuỗi
  "defunct" trong dòng args của nó — F-175-T6-5; đếm đúng bằng
  cột STAT cho 0). 0 process dpkg/apt nào trên bảng ps của T6
  lúc mở hay lúc đóng.
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống hoàn
  toàn; 0 dòng chứa chuỗi "vite" ngoài chính lệnh exec của T6.
  **Lúc đóng: 0 vite thật của T6** — T6 không khởi động
  Xvfb/vite nào, không kill process nào trong phiên này. (Vite
  O8 của T0-175 trên cổng 5560 đã chết trước lúc đóng —
  RELEASED 02:46:17Z, §2.)
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #86 đã dọn sạch
  socket của đợt 174). **Lúc đóng: 3 socket X193 / X194 / X195,
  tạo 02:49Z** — T6 không khởi động Xvfb/vite nào, không đụng
  tới các process này; chủ socket T6 không xác minh (T5-175
  `.done` 02:45Z ghi X188 + Xvfb :188 của T4-175 — socket khác,
  tạo trước 02:45Z; X193–X195 tạo 02:49Z, sau khi T5 đóng).
  Trở lại 3 socket như đợt 172/173/174.
- **Watcher-175: `b2-watcher.sh` pid 15862 (round175-t9) và
  `replay-watch-175.sh` pid 16528 (round175-t5) đều có mặt lúc
  kiểm tra giữa phiên (~02:46Z) và lúc đóng** — b2-watcher-175
  khởi động ~02:39Z, replay-watch-175 START 02:40:29Z (khớp
  `replay-watch-175.log`: REPLAY-WATCH-175-START 02:40:29Z
  pid=16528). **Cả hai CHƯA chạy lúc snapshot mở 02:38:59Z**
  (F-175-T6-6). Xem §8 (F-172-T6-5).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-175). Inotify:
  `max_user_watches` = **63747** lúc mở và lúc đóng — **GIỐNG
  trần trên #69–#85** (T6-174 §1); khác 63756 trên #67 — ghi
  nhận, không hành động.
- Tải hệ thống trong phiên: T0-175 giữ lock chạy O8
  02:40:53–02:46:17Z, T4-175 poll-wait từ 02:41:36Z, T5
  replay-watch từ 02:40:29Z, T9 b2-watcher từ ~02:39Z — suite +
  harness vẫn 9/9 × 6 và 120/120 (xem §6); suite chậm hơn đợt
  174 (~40 s/lượt so với ~30 s/lượt; load1 poll #2 của T4 lên
  11,09 trong cửa sổ suite).

## 2. Lock lúc mở: TRỐNG; +36 dòng kể từ T6-174 đóng (33 trước phiên + 3 trong phiên); #86 KHÔNG GIẾT HOLDER

- **Lúc mở (02:38:59Z): lock TRỐNG** — log kết thúc ở
  t8-round174 RELEASED 00:46:56Z, không có ACQUIRED nào chưa
  release sau đó. **Lúc snapshot đóng (~02:54Z): lock TRỐNG**
  — status `TRỐNG`, `0 ticket + 101 cooldown` (chỉ ghi đè tại
  chỗ `cooldown-t0-round174` mtime 02:46:17Z — không tăng số
  lượng). **Lúc kiểm cuối sau prune (02:55Z): lock TRỐNG**,
  `0 ticket + 100 cooldown`. **Prune KHÔNG PHẢI CHỜ** (xem §7):
  lock trống lúc mở, lúc đóng, ngay trước prune và lúc kiểm
  cuối — giống đợt 167–174. Trong phiên T6-175 có **1 chu kỳ
  lock** của luồng khác (t0-round174/175) — hoàn tất TRƯỚC khi
  prune (RELEASED 02:46:17Z, rm prune 02:54:58Z — cách 8m41s).
- **Log lock +36 dòng kể từ T6-174 đóng** (raw 2174 lúc T6-174
  đóng → 2207 lúc T6-175 mở → 2210 lúc snapshot đóng → 2210
  lúc kiểm cuối): 33 dòng trước phiên T6 (00:07–00:46Z); **+3
  dòng trong phiên T6-175** (02:40–02:46Z — 1 chu kỳ
  t0-round174/175, hoàn tất).
- 33 dòng trước phiên (`new-lines-since-t6-174.txt`, dòng thô
  2175–2207): t4: 7 dòng — 2 chu kỳ (attempt1 00:07:44Z →
  RELEASED 00:09:47Z, hold 123 s; attempt2 00:10:02Z wait 13 s
  → RELEASED 00:13:29Z, hold 207 s; 1 COOLDOWN) — 2 attempt của
  T4-174 (lượt yên #43: attempt1 PAGE-WEDGED, attempt2 20/20
  PASS — aggregate 174 §4); t8-round174: 26 dòng — 7 chu kỳ
  (00:26:56Z → 00:43:05Z), **7 chu kỳ HOÀN TẤT** (holds 157 /
  70 / 141 / 240 / 60 / 121 / 230 s; 5 COOLDOWN, chờ
  14957–14973 ms trên cổng 5490/5390); 0 chu kỳ dở dang. Tổng
  trước phiên: Δ TICKET +9, Δ ACQUIRED +9, Δ RELEASED +9,
  Δ COOLDOWN +6, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
  Δ TIMEOUT +0 (khớp §4). **9/9 chu kỳ mới hoàn tất sạch.**
- 3 dòng trong phiên (dòng thô 2208–2210): t0-round174:
  TICKET/ACQUIRED 02:40:52/53Z wait 1 s → RELEASED 02:46:17Z,
  hold 324 s, port 5560 — T0-175 chạy O8 trong lúc giữ lock
  (WebKit 21/21 ×2 + Chromium 21/21, exit 0 — cờ
  `round175-t0.done` 02:48Z; T4-175 polls #1–#7 ghi lock=co pid
  17064, port 5560 — khớp ticket `1-179540165279…`, §6). Nhãn
  owner `t0-round174` là nhãn sót (F-175-T0-5); chu kỳ thuộc
  T0-175 trên boot #86. Tổng trong phiên: Δ TICKET +1, Δ
  ACQUIRED +1, Δ RELEASED +1, Δ COOLDOWN +0. **1/1 chu kỳ
  trong phiên hoàn tất sạch.**
- **REBOOT #86 (btime 01:01:37Z 23/11, boot `70b7f7ee` — SỐ
  HIỆU ĐÃ ĐƯỢC T0-175 XÁC NHẬN 9 nguồn, cờ `round175-t0.done`
  02:48Z) — KHÔNG giết holder nào (NHIỆM VỤ (b) brief giao,
  verdict mới của T6-175):** dòng lock cuối trước reboot là
  t8-round174 RELEASED 00:46:56Z (hold 230 s); dòng đầu sau
  reboot: KHÔNG CÓ (0 dòng log trong cửa sổ mở (00:46:56Z,
  01:01:37Z) — dòng tiếp theo là t0-round174 TICKET 02:40:52Z)
  — tức lock trống **14m41s (881 s) trước reboot**. Không có
  ACQUIRED nào chưa release tại thời điểm #86, 0 STALE-LOCK mới
  sau #86. **Kết luận: #86 không giết holder nào — verdict
  sạch (khoảng trống 881 s; số hiệu ĐÃ XÁC NHẬN — chuỗi "không
  giết holder" từ #69 lên 18 reboot).**
- **Gap #85→#86 = 7.321 s** (22:59:36Z → 01:01:37Z — T6-175
  tính từ btime, KHỚP cờ T0-175). Gap #84→#85 = 7.101 s,
  #83→#84 = 2.128 s (aggregate 174 §10.5 (xv)).
- **File cooldown mới kể từ T6-174 đóng:
  `cooldown-t8-round174` (mtime 00:46:56Z)** — 1 file làm tổng
  queue tăng 100 → 101 (100 + 1 = 101 ✓). Trong phiên T6-175
  KHÔNG có file cooldown mới (chỉ ghi đè `cooldown-t0-round174`
  mtime 02:46:17Z).

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 354 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/cooldown
  đợt 135, quyết parent đợt 134 §12.3(b)). Không có đổi nào đợt
  này, nên không cần kiểm chứng cắt ngang lại — cut-sim đợt 135
  vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 10 chu kỳ hoàn tất kể từ
  T6-174 đóng chạy trên thứ tự mới và sạch** (đủ TICKET +
  ACQUIRED + RELEASED — xem §2). Cộng với 344 chu kỳ T6-174 đã
  đếm = **354 chu kỳ hoàn tất liên tiếp sạch trên thứ tự mới**.
  Chu kỳ bị #68 giết KHÔNG tính vào số hoàn tất (bằng chứng
  reboot giết holder, không phải lỗi thứ tự ghi — STALE-LOCK thu
  hồi đúng).
- **Đợt này KHÔNG đổi file code nào** — suite giữ `a89c0676`,
  poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 2204 dòng chính thức lúc kiểm cuối, 620 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py` VIẾT LẠI đợt này — xem §0; kiểm lại bằng hai
biến thể đếm trên snapshot đóng đợt 174, F-175-T6-3). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z 17/11,
dòng thô 848–853 — bản đã lọc = raw trừ đúng 6 dòng đó, lọc
bằng `awk '$2!="tA" && $2!="tH"'`, F-162-T6-1). Bản đã lọc lúc
đóng: **2204 dòng** (raw 2210) — **+36 dòng kể từ T6-174 đóng**
(2168 → 2204; 33 trước phiên + 3 trong phiên tới lúc đóng, đều
đã đối chiếu §2). Kiểm cuối sau prune (02:55Z 23/11): bản đã lọc
**2204 dòng** (raw 2210), RELEASED 620, cặp 620, đang giữ 0,
double-acquire 12 — prune không đụng log nên số kiểm cuối = số
lúc đóng (0 dòng mới giữa đóng và kiểm cuối).

| Chỉ số (bản đã lọc) | T6-173 đóng | T6-174 đóng | T6-175 mở | T6-175 đóng | Δ trong phiên |
|---|---|---|---|---|---|
| Tổng dòng | 2136 | 2168 | 2201 | 2204 | +3 |
| TICKET | 624 | 633 | 642 | 643 | +1 |
| ACQUIRED | 613 | 622 | 631 | 632 | +1 |
| RELEASED | 601 | 610 | 619 | 620 | +1 |
| COOLDOWN | 275 | 280 | 286 | 286 | +0 |
| STALE-LOCK | 12 | 12 | 12 | 12 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 601 | 610 | 619 | 620 | +1 |
| Đang giữ cuối log | 0 | 0 | 0 | 0 | — |
| Double-acquire (chuỗi lịch sử) | 12 | 12 | 12 | 12 | 0 mới |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 632 / RELEASED 620, 620 cặp.** Các số 622/610 là
  kiểm cuối đợt 174; 613/601 là kiểm cuối đợt 173.
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối (sau
  prune):** ACQUIRED 632 − RELEASED 620 = 12 ACQUIRED chưa
  release trong lịch sử log — nhưng cả 12 đều đã được xử lý:
  11 ca cũ (10 ca double-acquire cũ + 1 ca t8-round159
  03:12:16Z STALE-LOCK thu hồi holder bị #60 giết — §8 đợt
  160) + 1 ca t4 19:16:47Z (STALE-LOCK thu hồi holder bị #68
  giết — §2 đợt 165). Analyzer xác nhận `still held at end of
  log: 0` ở cả ba snapshot mở/đóng/kiểm cuối. Lock TRỐNG lúc
  mở, lúc đóng và lúc kiểm cuối — status xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 12 — 0 ca mới kể từ T6-174 đóng, 0 ca
  mới trong phiên T6-175.** Ca mới nhất vẫn là analyzer dòng
  1843 (bản đã lọc — t4 ACQUIRED 19:16:47Z sau STALE-LOCK cùng
  giây, thu hồi holder bị #68 giết — §2 đợt 165). STALE-LOCK
  GIỮ 12 — 0 ca mới (ca mới nhất vẫn 19:16:47Z, thu hồi #68).
  **Hai con số là CÙNG MỘT sự kiện thu hồi #68, không phải hai
  sự kiện riêng** (quyết (v) đợt 162, quyết (r) đợt 163). Cách
  đếm 12 này là gì — F-175-T6-3 (biến thể nghiêm ngặt cho 7; cả
  hai đều 0 mới đợt này).
- **0 double-acquire mới** kể từ T6-174 đóng. 0 RELEASED không
  có ACQUIRED trước, 0 TIMEOUT mới (TIMEOUT cuối cùng vẫn là
  19/11 15:50Z, trước đợt 150), 0 sự kiện "KHÔNG NHẢ" trên toàn
  bộ log (`grep -c "KHÔNG NHẢ"` = 0).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả đúng lúc
  mở (10 chu kỳ mới sạch kể từ T6-174 đóng, 0 chu kỳ dở dang
  ngoài ca bị #68 giết đã thu hồi), 0 zombie thật lúc mở/lúc
  đóng/lúc kiểm cuối, 0 stale mới trong phiên, queue 0 ticket,
  log nhất quán (620 cặp + 0 đang giữ lúc kiểm cuối, 0 mất dấu
  khác), 0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật
  đợt 148–175 và đợt 175 (tới ~02:55Z), suite 9/9 × 6 lần (T7
  (A) xanh cả 6 — xem §6), và thứ tự ghi mới đã có **354 chu kỳ
  thật** chứng minh (§3). Caveat còn lại: **reboot #68 GIẾT
  HOLDER t4** (chuỗi đứt tại #68); **reboot #69–#85 KHÔNG giết
  holder** (đã xác nhận — từng khoảng trống xem LIMITS
  T6-165–T6-174 và aggregate 174 §10.5 (viii)); **reboot #86
  KHÔNG giết holder** (khoảng trống 881 s — đợt này, số hiệu
  ĐÃ XÁC NHẬN T0-175 9 nguồn).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức của
khối T7 (kiểm chứng 120/120 PASS dưới churn). Nhiệm vụ đợt
này: KIỂM LẠI (A) còn nguyên, không triển khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng = lúc
  kiểm cuối** (bản (A) đợt 151). Live-code khối T7 (bỏ
  comment/dòng trống) md5 **`c92f2efff2080fbe6712522343e9e400`**
  — khớp đúng T6-151–T6-174 §6.2. File khối T7 đã trích
  `t7-block-a175.sh` md5 **`dc973443030249a262ff63cbc62231d5`**
  — **giống hệt** file khối đã trích đợt 151–174 (cùng md5).
  Harness đợt này chạy đúng code (A) trong suite, không phải
  bản sao tay (xem §6.2).
- **PHẠM VI HẸP — đã tuân thủ, có bằng chứng:**
  `vcut-poll-quiet-v2.sh` KHÔNG đổi (`1710e480` lúc mở = lúc
  đóng = lúc kiểm cuối); hàm `count_blockers` dùng chung cho
  gate cửa yên của T4 KHÔNG đổi (grep: `count_blockers` xuất
  hiện 2 lần trong poll script, dòng 32/46 — trong suite chỉ có
  1 lần xuất hiện duy nhất là dòng comment ở khối T7, dòng 151,
  kèm 3 lệnh poll cũ của (B) đã comment; không có trong
  live-code khối T7). Script lock v2 KHÔNG đổi (`520b8baa`).
  T6 không đổi gì trong phiên (chỉ xóa 1 file cooldown theo luật
  prune đã phê duyệt — §7; không đụng code).
- `bash -n` harness t7-control-a175.sh: OK (viết lại đợt này từ
  mô tả LIMITS T6-174 §6.2 — xem §0; chỉ đổi hậu tố a174 →
  a175). Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–174 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ hai mươi lăm liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~02:41:55–02:45:56Z, `test-v2-t6-run1.log` … `run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (cửa sổ 6 lượt 02:41:55Z →
02:45:56Z, ~4m01s — ~40 s/lượt, chậm hơn đợt 174 ~30 s/lượt
và đợt 173 ~22 s/lượt; có thể do T0-175 chạy O8 song song
trong toàn bộ cửa sổ suite — vite cổng 5560 + load1 poll #2
của T4 lên 11,09; không ảnh hưởng kết quả — 9/9 × 6). Khối T7
(A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện 1 lần mỗi log).
Suite chạy trên log riêng trong /tmp
(`/tmp/vcut-lock-v2-test.*`, owner test `tH2`) — 0 dòng nào
của T6 trên log lock thật trong phiên (3 dòng mới trong phiên
đều là chu kỳ t0-round174/175, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round175-t6/t7-control-a175.sh`: trích khối T7 giữa
marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite (cả hai dòng
marker — `sed -n '/# T7-BLOCK-START/,/# T7-BLOCK-END/p'`, khớp
md5 khối đợt 151–174), chạy N=120 lần với churn bơm vào. Churn
**giống hệt T6-151–T6-174 §6.2** (để so sánh được): 1 process
`WebProcess-churn` (khớp mẫu poll) xuất hiện sau delay ngẫu
nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng vite/WebKit của luồng
khác khởi động/tắt trong cửa sổ giữa các lần đếm. Chỉ chạy trên
/tmp, không đụng lock thật, không đụng poll chung. Chạy trên
boot 70b7f7ee (#86 đã xác nhận, btime 01:01:37Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a175.sh` md5 `dc973443030249a262ff63cbc62231d5` —
  **giống hệt** file khối đã trích đợt 151–174; live-code (bỏ
  comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng** live-code
  khối T7 trong file suite (cùng md5 `c92f2efff…`). Harness
  chạy đúng code trong suite, không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).** B1=1 B2=0 cả 120
  lần (`t7-a175-churn.log`, 120 dòng `-> PASS`, 0 dòng
  `-> FAIL`). Delay churn thực đo (delay đặt trước mỗi lần
  chạy, đều 500–3500 ms): min 534 ms, max 3435 ms, trung bình
  1924,35 ms — đúng phân phối thiết kế. Thời gian chạy harness
  ~6m56s (02:47:06–02:54:02Z).
- **CAVEAT CHỒNG LẤN — QUY TẮC WORDING QUYẾT (h) ĐỢT 171
  (F-171-T6-1) — xem F-175-T6-1:** tách riêng hai pha của một
  attempt: (a) **pha đếm gate** (poll → lấy TICKET); (b)
  **pha giữ lock** (TICKET → RELEASED). Đợt này:
  - **Suite 02:41:55–02:45:56Z chồng CẢ pha (a) của T4-175
    (polls #2–#6, 02:42:23–02:45:30Z) VÀ pha (b) của T0-175
    (TICKET 02:40:52Z → RELEASED 02:46:17Z, hold 324 s — toàn
    bộ cửa sổ suite nằm trong pha (b)).** Blockers comm-based
    trong cửa sổ suite: #2=5, #3=5, #4=5, #5=6, #6=4 — ngang
    poll #1 trước suite (#1=5, 02:41:36Z); legacy (11, 9, 13,
    11, 4) ngang hoặc thấp hơn #1 (legacy 8) — không có dấu
    hiệu suite làm phồng số đếm (suite chỉ chạy trên /tmp,
    không spawn vite; blockers là vite O8 thật của T0 cổng
    5560 + process nền khác). Load1 trong cửa sổ suite: 11,09
    / 9,72 / 7,85 / 4,63 / 6,43 — cao, nhưng T0 đang chạy O8
    trong cùng cửa sổ; suite chỉ là `sleep` + đếm `ps` — T6
    không quy tải tăng cho suite, và cũng không quy nguyên nhân
    spike (thuộc T8/T9).
  - **Harness 02:47:06–02:54:02Z chồng pha (a) của T4-175
    (polls #9–#17, 02:47:48–02:53:53Z; poll #8 02:47:02Z nằm
    4 s TRƯỚC khi harness bắt đầu) và KHÔNG chồng pha (b) nào**
    (T0 đã nhả lock 02:46:17Z, 49 s trước khi harness bắt đầu;
    **0 TICKET nào của T4-175 được lấy tới poll #18 (02:54:39Z)**
    — T4-175 chưa hề bước vào pha (b) trong phiên T6).
    Blockers comm-based trong cửa sổ harness: #9–#17 = 0 tất
    cả (legacy 1, 0, 0, 0, 0, 1, 1, 1, 1) — churn không được đếm
    là blocker vì comm của process `exec -a … sleep` vẫn là
    "sleep"; không có dấu hiệu churn làm phồng số đếm. Load1
    trong cửa sổ harness: 4,60 / 6,44 / 5,34 / 6,80 / 6,61 /
    6,10 / 3,58 / 1,95 / 1,24 — xu hướng giảm dần; RAMavail
    trong cửa sổ giảm 1433 → 704 MB (dưới gateA 1024 MB từ poll
    #13) — lý do T4 chưa lấy ticket thuộc T4/T10, T6 chỉ ghi
    số. Churn chỉ là `sleep` trần, không CPU — T6 không quy tải
    tăng cho churn.
  **T6 KHÔNG phán verdict attempt của T4-175** — T4/T10 sở
  hữu; T6 chỉ ghi rõ mốc giờ và pha chạm để T4-175/T10-175 tự
  đánh giá. (Đợt 173/174 harness chồng cả hai pha; đợt này
  harness chỉ chồng pha (a), suite chồng cả hai pha.)
- **Đối chiếu cùng churn (cùng phương pháp bơm churn):**
  (B) đợt 150: 2/30 PASS (7%); bản cũ (B1−B2=1) đợt 150: 13/30
  PASS (43%); **(A) đợt 151–174: 120/120 PASS mỗi đợt (100%)**;
  **(A) đợt 175: 120/120 PASS (100%).**
- **Kết luận: (A) VẪN XANH sau hai mươi lăm đợt.** (A) miễn
  nhiễm churn nền theo thiết kế — đã chứng minh lần thứ hai
  mươi lăm liên tiếp bằng 120 lần chạy trên đúng code suite
  (tổng cộng 3000/3000 dưới churn qua 25 đợt). Chú thích tỉ lệ
  (như T6-150–174): 120/120 là tỉ lệ dưới churn bơm vào gần
  như mọi lần chạy (stress), không phải tỉ lệ flake sản xuất —
  điều đo được là SO SÁNH TƯƠNG ĐỐI dưới cùng điều kiện: (A)
  100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 — T10 xác
  nhận lại):** chuỗi "xanh kép" T7: 24 (đợt 174) → **25 (đợt
  175 — lần thứ hai mươi lăm xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 56 (đợt 174) → **57 (đợt 175, 6/6 lượt
  9/9)**.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 1 FILE (ĐIỀU (b)) — KHÔNG PHẢI CHỜ LOCK

Luật (đợt 125 §7, parent phê duyệt §12(c); chú thích ngữ nghĩa
`find -mtime` ở đợt 130 theo quyết parent đợt 129 §12.3(e)):
(a) xóa file `cooldown-*` mtime cũ hơn 7 ngày; (b) trần mềm 100
file — nếu tổng vượt 100 thì xóa file cũ nhất tới khi còn 100,
nhưng không xóa file <48h; (c) không bao giờ xóa file của đợt
hiện tại hoặc đợt ngay trước; (d) ghi số file đã xóa + tên vào
log lượt đó; (e) chỉ chạy khi lock đang trống (`status` TRỐNG).
Ngữ nghĩa `find -mtime`: `-mtime +7` chỉ khớp file **≥192h
(8 ngày)**, `-mtime +2` chỉ khớp file **≥72h** — phương pháp
`find` bảo thủ hơn chữ luật tối đa 24h (xóa muộn, không bao giờ
xóa sớm).

- 02:38:59Z (lúc mở): tổng **101 file / 1414 byte** (vượt trần
  mềm 100 — do T8-174 thêm 1 file `cooldown-t8-round174` sau
  khi T6-174 prune, §2); quét ứng viên mtime >7 ngày (`find
  -mtime +7`): **0 file** (`prune-candidates.txt` — 0 byte) —
  điều (a) không kích hoạt.
- Lock TRỐNG lúc mở (log kết thúc RELEASED 00:46:56Z, §2),
  TRỐNG lúc snapshot đóng (~02:54Z), TRỐNG ngay trước prune
  (`status-before-prune.txt` ~02:54Z) và TRỐNG lúc kiểm cuối
  (02:55Z) — **prune KHÔNG PHẢI CHỜ** (giống đợt 167–174; khác
  đợt 166 phải chờ T4-166). Trong phiên T6-175 có **1 chu kỳ
  lock** của t0-round174/175 (§2) — hoàn tất trước prune
  (RELEASED 02:46:17Z, rm prune 02:54:58Z — cách 8m41s).
- 02:54:58Z 23/11 (epoch 1795402498): điều (b) KÍCH HOẠT: tổng
  101 > 100 → xóa 1 file cũ nhất tới khi còn 100. File cũ nhất
  (mtime chính xác tới nano-giây): **`cooldown-t3-round120`,
  mtime 2026-11-16T07:21:06.096850174Z, 163,56h tuổi lúc xóa**
  (≥48h; không phải file đợt hiện tại hay đợt ngay trước —
  file cooldown cũ từ 16/11, không thuộc đợt 174/175). Xác định
  "cũ nhất" bằng mtime chính xác tới nano-giây (`ls -ltr
  --time-style=full-iso` — file kế tiếp `cooldown-t8-round121`
  09:04:58Z). Tuổi tính từ đúng epoch giờ prune trong
  `prune-time.txt` (F-164-T6-1; `prune-time.txt` ghi SAU `rm`
  trong cùng một lệnh — F-167-T6-3). Tên file cũ nhất lấy từ
  `queue-oldest-true.txt` (F-170-T6-2).
- **Kết quả prune đợt 175 (lần 50): 1 file đã xóa
  (`cooldown-t3-round120`).** `prune-deleted.txt` ghi đúng file
  đã xóa (kèm mtime + size 14 byte + tuổi + điều luật + giờ
  prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở **101 file / 1414 byte**; lúc snapshot
  đóng (trước khi prune) **101 file / 1414 byte** (0 file mới
  trong phiên — chỉ ghi đè tại chỗ `cooldown-t0-round174`
  02:46:17Z, §2; log lock +3 dòng trong phiên, 0 dòng nào của
  T6); **sau prune 100 file / 1400 byte** (100 × 14 = 1400
  khớp; `ls`/`find`/`status` khớp nhau); lúc kiểm cuối sau
  prune (02:55Z) vẫn **100 file / 1400 byte**. Không file nào
  bị xóa hay thêm ngoài 1 file prune giữa hai lần đếm của đợt
  này (sau prune, không có chu kỳ lock mới nào — log vẫn 2210
  dòng thô lúc kiểm cuối). Số học từ T6-174 đóng: 100 + 1 file
  mới (`cooldown-t8-round174`) = 101 ✓ lúc mở; 101 − 1 file
  prune = 100 ✓ lúc đóng — khớp đúng số T10-174 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`): lúc mở:
  **≥192h: 0 file; ≥72h: 71 file; ≥48h: 80 file**. Sau prune
  (02:54Z): **≥192h: 0 file; ≥72h: 70 file; ≥48h: 79 file** —
  ≥72h giảm 71 → 70 (xóa đúng 1 file ≥72h — khớp số học).
  File cũ nhất còn lại nay là `cooldown-t8-round121`, mtime
  2026-11-16T09:04:58Z — lúc 02:54Z mới **~161,83h tuổi** (đủ
  7 ngày ~23/11 09:04Z).
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file cũ
  nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại lần thứ hai
  mươi sáu liên tiếp** (đợt 150–175 = 26 đợt liên tiếp; đợt 174
  là lần thứ hai mươi lăm — LIMITS T6-174 §7; đợt này xóa
  `cooldown-t3-round120` trước khi nó đủ 7 ngày — đủ 7 ngày
  vào khoảng **23/11 07:21Z** nhưng đã bị xóa ở đợt 175, sớm
  4,44h). T6 các đợt sau đếm tiếp. Ghi nhận, không đổi luật
  (luật thuộc parent).
- **Prune lần 51 (T6-176): tổng lock 100 sau prune 50 — kiểm
  lại lúc mở đợt 176** (nếu có luồng thêm file mới thì điều (b)
  lại kích hoạt; file cũ nhất còn lại `cooldown-t8-round121`
  đủ 7 ngày ~23/11 09:04Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-175; #86 KHÔNG GIẾT HOLDER; đồng hồ ở giờ thật; POSTBOOT_PASS #86 CÓ; KHÔNG LỆCH PID WATCHER

- Boot duy nhất trong phiên: **70b7f7ee** (btime 01:01:37Z =
  epoch 1795395697). T6 **TỰ XÁC MINH btime** 01:01:37Z (hai
  nguồn /proc/stat + `uptime -s` khớp) và **số hiệu #86 ĐÃ ĐƯỢC
  T0-175 XÁC NHẬN 9 nguồn** (cờ `round175-t0.done` 02:48Z —
  lúc T6 mở chưa có cờ này trên đĩa; T6 chỉ chứng nhận từ log
  lock + tự xác minh btime, số hiệu do T0 chứng nhận).
- Uptime boot lúc đóng ~1h53'. `journal --list-boots` chỉ 1
  dòng 70b7f7ee (first entry 01:01:56Z) — journal đã xoay, chỉ
  còn boot hiện tại. **KHÔNG có reboot mới lúc đóng** (kiểm
  ~02:54Z, boot_id giống lúc mở; kiểm lại sau prune ~02:55Z).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  02:39:01Z vs local 02:38:59Z — chênh ~2 s (trong đó có độ trễ
  fetch; lúc đóng chênh ~1 s; lúc kiểm cuối chênh ~2 s). Các
  mốc wall đợt 175 đọc trực tiếp được.
- **REBOOT #86 (btime 01:01:37Z, boot `70b7f7ee` — số hiệu ĐÃ
  XÁC NHẬN T0-175 9 nguồn) — KHÔNG giết holder** (§2): lock
  trống 14m41s (881 s) trước btime (RELEASED cuối 00:46:56Z);
  0 dòng log trong cửa sổ; 0 STALE-LOCK mới. **Verdict sạch —
  chuỗi "không giết holder" từ #69 lên 18 reboot (#69–#86,
  TẤT CẢ ĐÃ XÁC NHẬN: #69–#85 theo aggregate 174 §10.5 (viii)
  + #86 theo cờ T0-175).**
- **ĐỐI CHIẾU PID WATCHER-175 — KHÔNG CÓ LỆCH (nhiệm vụ (d)
  brief giao):** hai pid ghi nhận giữa phiên và lúc đóng là
  **HAI watcher khác nhau**, cả hai đều đúng trong phạm vi của
  mình:
  - pid **15862** = `b2-watcher.sh` của **T9-175**
    (headroom/balloon watcher): `ps` ghi `15862 … bash
    …/round175-t9/b2-watcher.sh`, etime 07:31 lúc ~02:46Z →
    khởi động ~02:39Z; cùng pid lúc đóng (etime 15:52).
  - pid **16528** = `replay-watch-175.sh` của **T5-175**
    (postboot replay watcher): `ps` ghi `16528 … bash
    …/round175-t5/replay-watch-175.sh`, etime 06:20 lúc
    ~02:46Z → khởi động 02:40:29Z (khớp
    `replay-watch-175.log`: REPLAY-WATCH-175-START 02:40:29Z
    pid=16528); cùng pid lúc đóng (etime 14:41).
  - Áp dụng đúng bài học F-172-T6-5/F-173-T6-2: ghi rõ TÊN
    SCRIPT (replay-watch-* của T5 vs b2-watcher.sh của T9) —
    nên không có kết luận lệch sai. **Không phát sinh F-175-T6-x
    nào về lệch watcher** (xem F-175-T6-6 về thời điểm snapshot
    mở).
  - Vòng đời watcher-174: cả hai watcher-174 đều chết theo
    reboot #86 (btime 01:01:37Z) — b2-watcher-174 (pid 11084)
    và replay-watch-174 (pid 12991) đều vắng trên ps mở đợt
    này (đúng — boot đã đổi); T9/T5 khởi động lại watcher-175
    trên #86 như trên.
- **POSTBOOT_PASS #86 CÓ lúc T6 kiểm cuối** (02:55Z):
  `round175-t5/POSTBOOT_PASS` mtime 02:40:29Z, nội dung "boot
  70b7f7ee … postboot PASS poll0 doc lap exit 0 luc
  2026-11-23T02:40:29Z; POSTBOOT_PASS moi ghi
  2026-11-23T02:40:29Z poll=0 (replay-day-du); co cu 3c704685
  luu POSTBOOT_PASS-3c704685" — watcher-175 tự viết sau poll0
  exit=0; T5-175 verify độc lập exit=0, 11/11 gói + 5/5 lib,
  GST 269=269 (cờ `round175-t5.done` 02:45Z); replay #86 ĐẦY
  ĐỦ 170/170, dpkg 1545 dòng, 50 transaction, term.log 0 lỗi —
  F-174-T5-6 (replay một phần) KHÔNG lặp lại. **Khác #85:** cờ
  #86 là replay-đầy-đủ, không phải repair-tay. T6 KHÔNG bù cờ
  postboot — T5 sở hữu. Lưu ý số poll trong file log poll0 —
  xem F-175-T6-4. **POSTBOOT_PASS #85 CÓ** (23:46:57Z,
  repair-tay-T5, poll=1); **#84 CÓ** (21:27:05Z); #83 KHÔNG CÓ
  (boot thứ 16 không cờ). Hướng (3) VẪN ĐỨNG lần 22 (cờ T5-175).

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng và lúc kiểm cuối: suite (A) `a89c0676`, poll
  `1710e480`, lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt này.
  Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-175 (LIMITS này)
  — xem §10.
- Lock lúc kiểm cuối sau prune (02:55Z 23/11): TRỐNG, 0 ticket
  + 100 cooldown (sau prune), log 2210 dòng thô / 2204 dòng
  chính thức, 620 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi báo
  đóng — bắt buộc theo brief; đã kiểm boot lần cuối `70b7f7ee`
  ngay trước khi viết cờ).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths:
  `~/workspace/repo-1-push/paths-loop/phase9-round175-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng `tr '\0' '\n'` để
  verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND175_T6_LOCKHEALTH_LIMITS.md` (file này)
- **Cờ đóng: `hidden_files/round175-t6.done` ĐÃ VIẾT CÓ NỘI
  DUNG trước khi báo đóng** (bắt buộc — rút kinh nghiệm đợt
  150 T6 thiếu cờ; T6 đã kiểm chứng cờ có mặt trên đĩa và không
  0 byte bằng `ls -l` trước khi kết thúc — xem §11; đã kiểm
  boot lần cuối `70b7f7ee` ngay trước khi viết cờ).
- Tổng batch đợt 175 đã stage tới lúc T6 đóng (tạm tính, T10
  đợt 175 đếm lại bằng dedup toàn cục): **1 batch / 1 entry**
  (t6 1 — T0 đã stage 1 batch `phase9-round175-t0-boot-o8.txt`
  trước T6; các luồng khác chưa stage tới lúc này; T10 đếm
  lại). Lũy kế 111–174 (T10-174 đếm): batches=628 entries=1106
  distinct=959 new=781; pending 166–174: batches=90 entries=127
  distinct=119 new=117. T6 không tự cộng tay vào lũy kế file
  (chờ T10-175).

## 11. GHI CHÚ CHO T10-175 / PARENT (tóm tắt — chi tiết xem §0–§10)

- (A) 120/120 lần thứ 25 (tổng 3000/3000 qua 25 đợt); 6/6 suite
  9/9. Chuỗi xanh kép 24 → 25; chuỗi suite xanh 56 → 57.
- Lock khỏe (620 cặp, 0 giữ hiệu dụng, 0 TIMEOUT mới);
  **#86 KHÔNG GIẾT HOLDER (lock trống 881 s — số hiệu ĐÃ XÁC
  NHẬN T0-175 9 nguồn); chuỗi "không giết holder" từ #69 lên
  18 reboot.** Double-acquire/STALE-LOCK GIỮ 12 — 0 ca mới cả
  hai (ca mới nhất vẫn là thu hồi #68 đợt 165 — F-175-T6-3).
  Prune lần 50 xóa 1 file, queue về đúng trần 100 (**KHÔNG
  PHẢI CHỜ lock**; +36 dòng kể từ T6-174 đóng đều sạch, 0 dòng
  nào của T6).
- **Đồng hồ ở giờ thật** (Cloudflare ~1–2 s). Mù cho #86 giao
  T2-175 (FULL132). **Kiểm cuối: ACQUIRED 632 / RELEASED 620,
  620 cặp** (đừng mang 622/610 của đợt 174 vào cột đợt này —
  bài học (r) đợt 163).
- 0 zombie thật; X11 trống lúc mở, 3 socket X193/X194/X195 lúc
  đóng (tạo 02:49Z — T6 không xác minh chủ; T5-175 `.done` ghi
  X188/:188 của T4-175 lúc 02:45Z — socket khác).
- **Inotify 63747** (giống trần #69–#85; quyết (m) đợt 146 —
  ghi chú, không hành động).
- **CAVEAT CHỒNG LẤN (F-175-T6-1):** suite chồng CẢ pha (a)
  T4-175 (polls #2–#6) VÀ pha (b) T0-175 (toàn bộ cửa sổ suite
  trong hold 324 s); harness chỉ chồng pha (a) T4-175 (polls
  #9–#17), KHÔNG chồng pha (b) nào (T0 nhả 49 s trước harness;
  T4 0 ticket tới poll #18); blockers trong cửa sổ harness = 0
  tất cả — T6 KHÔNG phán verdict attempt của T4-175.
- **POSTBOOT_PASS #86 CÓ** (02:40:29Z, watcher-175,
  replay-day-du, poll=0 — replay ĐẦY ĐỦ 170/170, khác #85 là
  repair-tay); **#85 CÓ** (23:46:57Z, repair-tay-T5, poll=1);
  **#84 CÓ** (21:27:05Z).
- **KHÔNG LỆCH PID WATCHER:** 15862 = `b2-watcher.sh` của
  T9-175; 16528 = `replay-watch-175.sh` của T5-175 (§8).
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403, file
  oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #96?/#95?/#94?/#88?
  VẪN MỞ; birefnet 0 thử lần 28 (đợt 174); u2net là fallback
  chính thức; kết cục run 174 thuộc T7-175 — T0-175 `.done`
  ghi run 174 SUCCEEDED 02:24:03Z, chờ T7-175 chốt).
- Cờ `round175-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo đóng
  và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 — lúc đó T6
  thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-175 (F-175-T6-n)

- **F-175-T6-1 — Suite chồng CẢ PHA ĐẾM GATE của T4-175 VÀ
  PHA GIỮ LOCK của T0-175; harness chỉ chồng PHA ĐẾM GATE của
  T4-175.** Suite 02:41:55–02:45:56Z; poll-wait T4-175 bắt đầu
  02:41:36Z; polls #2–#6 (02:42:23–02:45:30Z) trong cửa sổ
  suite; T0-175 giữ lock pha (b) 02:40:52Z → 02:46:17Z (hold
  324 s, O8 WebKit 21/21 ×2 + Chromium 21/21 exit 0) — toàn bộ
  cửa sổ suite nằm trong pha (b). Harness 02:47:06–02:54:02Z;
  polls #9–#17 (02:47:48–02:53:53Z) trong cửa sổ harness (poll
  #8 02:47:02Z nằm 4 s TRƯỚC harness); **0 TICKET của T4-175
  được lấy tới poll #18 (02:54:39Z)** — T4-175 chưa bước vào
  pha (b) trong phiên T6; T0 đã nhả lock 02:46:17Z, 49 s trước
  harness. Ảnh hưởng: (i) blockers comm-based trong cửa sổ
  suite (#2–#6 = 5, 5, 5, 6, 4) ngang poll #1 trước suite (=5)
  — suite không làm phồng số đếm (suite chỉ chạy trên /tmp,
  không spawn vite; blockers là vite O8 thật của T0 cổng 5560
  + process nền khác); blockers trong cửa sổ harness (#9–#17
  = 0 tất cả) — churn không được đếm là blocker vì comm của
  process `exec -a … sleep` vẫn là "sleep"; (ii) gate0=T5 từ
  poll #1 của T4-175 (POSTBOOT_PASS #86 đã có 02:40:29Z, trước
  cả suite lẫn harness — không liên quan churn); T4 vẫn 0
  ticket tới poll #18 — churn/suite không gây gate pass giả,
  cũng không chặn một gate pass nào (lý do T4 chưa lấy ticket
  — ví dụ RAMavail 823–991 MB < gateA 1024 MB ở polls #13–#18
  — thuộc T4/T10, T6 chỉ ghi số); (iii) load1 trong cửa sổ
  suite 11,09/9,72/7,85/4,63/6,43 và trong cửa sổ harness
  4,60/6,44/5,34/6,80/6,61/6,10/3,58/1,95/1,24 — spike đầu cửa
  sổ suite rơi TRONG lúc T0 giữ lock chạy O8; churn/suite chỉ
  là `sleep` trần — không CPU, không chạm trình duyệt, ảnh
  hưởng load trong lúc poll là không đáng kể; T6 không quy
  nguyên nhân spike (thuộc T8/T9). **T6 KHÔNG phán verdict
  attempt của T4-175.** Ảnh hưởng tới verdict lock/(A)/prune
  của T6: không có (log +3 dòng trong phiên đều là chu kỳ hoàn
  tất của t0-round174/175; suite 9/9 × 6 và harness 120/120
  trên /tmp).
- **F-175-T6-2 — #86 KHÔNG giết holder (verdict mới của
  T6-175, số hiệu ĐÃ XÁC NHẬN).** #86 (btime 01:01:37Z): lock
  trống 881 s trước btime (RELEASED cuối 00:46:56Z); 0 dòng log
  trong cửa sổ mở (00:46:56Z, 01:01:37Z); 0 STALE-LOCK mới sau
  #86. Số hiệu #86 ĐÃ ĐƯỢC T0-175 xác nhận 9 nguồn (cờ
  `round175-t0.done` 02:48Z) — khác đợt 174 khi #84/#85 còn chờ
  xác nhận lúc T6 đóng; chuỗi "không giết holder" từ #69 lên
  **18 reboot** (#69–#86). T6 KHÔNG tự chứng nhận số hiệu
  reboot (thuộc T0-175) — chỉ chứng nhận từ log lock + tự xác
  minh btime.
- **F-175-T6-3 — Hai cách đếm double-acquire cho hai số khác
  nhau (7 vs 12); T6-175 kiểm lại và GIỮ số chuỗi lịch sử 12.**
  Script `analyze-log.py` đợt trước đã bị dọn khỏi đĩa cùng thư
  mục `round174-t6/`; T6-175 viết lại từ mô tả và kiểm lại cả
  hai biến thể trên snapshot đóng đợt 174 (raw 2174 dòng) và
  snapshot mở đợt 175: (A) state machine nghiêm ngặt theo owner
  (ACQUIRED đặt held; RELEASED dọn; STALE-LOCK dọn) cho
  **double-acquire = 7, still-held = 0** ở cả hai snapshot; (C)
  biến thể lịch sử (ACQUIRED đặt held; chỉ RELEASED dọn —
  STALE-LOCK KHÔNG dọn) cho **double-acquire = 12, still-held =
  0** ở cả hai snapshot — đúng số chuỗi lịch sử T6-151–174 (ca
  mới nhất vẫn analyzer dòng 1843, t4 ACQUIRED 19:16:47Z sau
  STALE-LOCK cùng giây, thu hồi holder bị #68 giết). Diễn giải:
  số 12 đếm cả các lần ACQUIRED lại sau STALE-LOCK reclaim
  (cùng owner, không có RELEASED xen giữa — 5 ca trong 12 là
  dạng này); số 7 chỉ đếm ACQUIRED khi owner đang giữ thật.
  **Cả hai cách đếm đều 0 ca mới kể từ T6-174 đóng và 0 ca mới
  trong phiên T6-175** — verdict "0 double-acquire mới" đứng
  theo cả hai cách đếm; T6 GIỮ số 12 cho chuỗi lịch sử để so
  sánh được với các đợt trước. T10 các đợt sau lưu ý khi đối
  chiếu: đừng mang số 7 vào cột double-acquire lịch sử. Script
  viết lại đã lưu tại `hidden_files/round175-t6/analyze-log.py`
  (ghi cả hai biến thể trong comment đầu file).
- **F-175-T6-4 — Số poll trong cờ POSTBOOT_PASS #86 (poll=0)
  không khớp dòng chữ trong file log poll0 (nhắc poll1/poll2).**
  Cờ `round175-t5/POSTBOOT_PASS` (mtime 02:40:29Z) ghi
  "postboot PASS poll0 doc lap exit 0 … poll=0 (replay-day-
  du)"; file `round175-t5/t5-postboot-poll0-70b7f7ee.log` mở
  đầu bằng đoạn chữ nhắc "postboot PASS poll2 doc lap
  02:40:23Z exit 0 (poll1: T4 manual 02:38Z), co POSTBOOT_PASS
  moi poll=2" — và toàn bộ file này mang nội dung mẫu cũ (nhắc
  DOT 151, reboot #41, btime 01:25:51Z — không phải boot #86).
  Cờ T5-175 `.done` 02:45Z giải thích: "watcher-175 tự viết
  sau poll0 exit=0; T5 verify độc lập exit=0, 11/11 gói + 5/5
  lib" — tức theo T5 thì poll0 là lần check quyết định. T6 chỉ
  ghi nhận mâu thuẫn chữ nghĩa giữa cờ (poll=0) và file log
  (poll2) + nội dung mẫu cũ trong file log; **không phán
  verdict về cờ** — thuộc T5-175/T10-175. Không ảnh hưởng
  verdict lock/(A)/prune của T6 (cờ đã CÓ lúc T6 kiểm cuối,
  bất kể số poll).
- **F-175-T6-5 — Đếm zombie bằng `grep -c ' defunct'` cho 1
  false positive tự-match (cùng họ F-172-T6-2).** Lệnh exec đóng
  của chính T6 chứa chuỗi "defunct" trong dòng args của nó nên
  `grep -c ' defunct'` trên `ps-full-close.txt` đếm 1 (chính
  process exec đó). Đếm đúng bằng cột STAT (`ps -eo stat` đếm
  `^Z`) cho **0 zombie thật** lúc mở/lúc đóng/lúc kiểm cuối.
  Bài học nối F-172-T6-2: không bao giờ đếm zombie bằng grep
  chuỗi "defunct" trên snapshot chứa chính lệnh grep đó.
- **F-175-T6-6 — Cả hai watcher-175 đều CHƯA chạy lúc snapshot
  ps mở 02:38:59Z (không phải watcher mất).** `ps-full-open.txt`
  (02:38:59Z, ~3' sau khi đợt mở 02:35:51Z) không có dòng
  watcher nào; b2-watcher-175 (pid 15862) khởi động ~02:39Z
  (etime 07:31 lúc ~02:46Z) và replay-watch-175 (pid 16528)
  START 02:40:29Z — cả hai đều sau snapshot mở. Kiểm tra giữa
  phiên (~02:46Z) và lúc đóng (~02:54Z) cả hai đều có mặt,
  cùng pid, tên script rõ ràng (xem §8). T6 các đợt sau lưu ý:
  snapshot mở quá sớm trong đợt có thể chụp trước khi watcher
  khởi động — kiểm lại watcher lúc đóng trước khi kết luận.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a175-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round175-t6/appendix-numbers.txt` giữ bản trích
gốc (tuổi prune tính từ đúng epoch giờ prune trong
`prune-time.txt` — F-164-T6-1; md5 live-code chỉ tính bằng
pipeline shell đứng sau khi bắt lỗi F-164-T6-2):

```
churn: n_runs=120 pass=120 fail=0 B1=1:120 B2=0:120
churn delay_ms: min=534 max=3435 mean=1924.35
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
churn harness: 2026-11-23T02:47:06Z -> 2026-11-23T02:54:02Z (~6m56s), boot 70b7f7ee
suite window: 2026-11-23T02:41:55Z -> 2026-11-23T02:45:56Z (~4m01s, ~40s/luot)
suite run1: PASS=9 FAIL=0 T7A=1 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 rc=0
log lock (bản đã lọc): open raw 2207 / cleaned 2201; close raw 2210 / cleaned 2204; final raw 2210 / cleaned 2204
delta kể từ T6-174 đóng: +36 dòng = TICKET +10 ACQUIRED +10 RELEASED +10 COOLDOWN +6
kiểm cuối: ACQUIRED 632 / RELEASED 620, 620 cặp, 0 đang giữ, double-acquire 12 (chuỗi lịch sử; nghiêm ngặt 7), STALE-LOCK 12
gap #85->#86: 7321 s; lock trống trước btime #86: 881 s (14m41s)
prune 02:54:58Z epoch 1795402498: xóa cooldown-t3-round120 (163,56h, sớm 4,44h); queue 101 -> 100 file / 1400 byte
POSTBOOT_PASS #86: CÓ (02:40:29Z, watcher-175, replay-day-du, poll=0); #85 CÓ (23:46:57Z, repair-tay-T5, poll=1); #84 CÓ (21:27:05Z)
T4-175 poll: poll-wait bắt đầu 02:41:36Z; polls #2-#6 (02:42:23-02:45:30Z) trong cửa sổ suite 02:41:55-02:45:56Z; polls #9-#17 (02:47:48-02:53:53Z) trong cửa sổ harness 02:47:06-02:54:02Z; gate0=T5 từ poll #1; T4-175 0 TICKET tới poll #18 (02:54:39Z); T0-175 giữ lock pha (b) 02:40:52-02:46:17Z (324s), O8 WebKit 21/21 x2 + Chromium 21/21 exit 0
T0-175 O8 DONE 02:46:17Z; T0-175 .done 02:48Z: #86 XAC NHAN 9 nguon, gap 7321 s; T5-175 .done 02:45Z: replay #86 day du 170/170
watchers: b2-watcher.sh pid 15862 (T9-175), replay-watch-175.sh pid 16528 (T5-175) — cùng pid giữa phiên/lúc đóng; cả hai vắng lúc snapshot mở (khởi động sau 02:38:59Z)
```
