# PHASE9 ROUND155 T6 — (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN + lock KHỎE + prune lần 30: XÓA 1 FILE + reboot #49 KHÔNG giết holder — LIMITS

- Đợt: 155, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 21:35 +07 20/11/2026 (= 14:35:51Z). Chạy
  14:40:40Z → 14:54:31Z 20/11/2026, toàn bộ trên một boot duy
  nhất 12fc68a3 — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm sức khỏe lock lúc mở đợt
  155: tổng số file lock/queue, số cặp, số giữ, cooldown còn
  lại; đối chiếu với 100 lúc T10-154 đóng; (b) prune lần 30:
  tổng lock 100 sau prune 29, lúc T10-154 đóng đã là 101
  (T8 thêm 1 cooldown) — kiểm lại lúc mở đợt 155 rồi prune
  theo mẫu các đợt trước; (c) kiểm chứng lại (A) 120/120
  PASS dưới churn; (d) kiểm tra vite.lock.queue/cooldown
  (T8 đợt 154 thêm 1 cooldown) + reboot #49 (btime
  13:05:12Z, giữa phiên đợt 154) có giết holder không;
  (e) viết LIMITS trung thực, phụ lục số liệu bằng script
  trích từ log gốc, không gõ tay; (f) stage paths
  NUL-delimited; (g) viết cờ .done CÓ NỘI DUNG.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151/152/
  153/154, file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151/152/153/154); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE: 434 cặp ACQUIRED→RELEASED, 0 đang giữ,
  0 TIMEOUT mới, 0 "KHÔNG NHẢ". Prune lần 30: xóa 1 file cũ
  nhất (điều (b)), queue 101 → 100 file. Reboot #49 (btime
  13:05:12Z) KHÔNG giết holder nào (chu kỳ cuối trước reboot
  hoàn tất 11:04:11Z, không có dòng lock nào giữa 11:04:11Z
  và 13:31:34Z).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round155-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, wc-open.txt, wc-close.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  analyze-log.py, analyze-log-cleaned-open.txt,
  analyze-log-cleaned-close.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt, khong-nha-grep.txt,
  queue-open.txt, status-before-prune.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a155.sh,
  t7-block-a155.sh, t7-a155-churn.log, md5-open.txt,
  md5-close.txt, appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 12fc68a3 (reboot #49, btime 13:05:12Z); lock TRỐNG; queue 101 file (khớp T10-154 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `12fc68a3-10f4-4459-908f-b0a47615afae`, btime 13:05:12Z
  theo /proc/stat** (epoch 1795179912; `uptime -s` =
  13:05:12; `journal --list-boots` chỉ 1 dòng 12fc68a3,
  first entry 13:05:29Z). Uptime ~1h35' lúc T6 bắt đầu
  (14:40Z), ~1h49' lúc đóng (14:54Z). Đây là boot sau
  **reboot #49 lúc 13:05:12Z** — xảy ra GIỮA phiên đợt 154
  (T10-154 đã xác nhận số hiệu #49; xem §2/§8).
  **KHÔNG có reboot trong phiên T6** (boot_id giống nhau
  lúc mở và lúc đóng; không có reboot #50 lúc đóng —
  kiểm 14:53:53Z).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx` (lần ghi
  md5-open đầu tiên T6 gõ nhầm đường dẫn cũ
  `apps/web/src/pages/editor/components/preview.tsx` nên
  md5sum báo No such file; đã ghi lại đúng đường dẫn,
  md5 khớp — xem §11).
- Queue lúc mở: **101 file / 1414 byte** — khớp đúng số
  T10-154 đóng (100 sau prune 29 + 1 file cooldown mới
  `cooldown-t8-round154`, mtime 13:51:00Z, §2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite lúc mở và lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 14:40Z
  (mở, `ps-full-open.txt`, 13 dòng) và lúc 14:54Z
  (đóng, `ps-full-close.txt`, 30 dòng).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot). Lưu ý: lệnh `grep -c defunct` ở lần
  chụp mở trả về 1 — đó là chính chuỗi `defunct` trong
  dòng lệnh của T6 (tham số grep), KHÔNG phải process
  thật; kiểm bằng cột STAT cho 0. Khác đợt 154 (có 1
  defunct `sed` thật của chính T6 lúc mở).
- **Lúc mở và lúc đóng: 0 vite thật đang chạy** —
  `ss -tlnp` trống hoàn toàn cả 2 snapshot (0 cổng lắng
  nghe); `/tmp/.X11-unix/` trống lúc mở, có 3 socket
  (X193/X194/X195, 14:49Z) lúc đóng — của các luồng khác
  đợt 155 (T8 harness), KHÔNG phải của T6 (T6 không khởi
  động Xvfb/vite nào).
- Lúc đóng có script của luồng khác đang chạy:
  `replay-watch-155.sh` (T5-155, pid 26066) và
  `b2-watcher.sh` (T9-155, pid 23307) — không phải vite
  server; `ss` trống nên không có vite nào đang lắng
  nghe. T6 không đụng tới chúng, không kill process nào
  trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-155).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (khớp đợt 147–154 — không có lần flip mới trong
  phiên T6; quyết parent (m) đợt 146: ghi làm chú thích,
  không hành động).
- Tải hệ thống trong phiên: 10 luồng đợt 155 chạy song
  song — harness churn vẫn 120/120 (xem §6).

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; +26 dòng kể từ T6-154 đóng — TẤT CẢ TRƯỚC phiên T6; +3 dòng TRONG phiên (1 chu kỳ t4 hoàn tất)

- **Lúc mở (14:40:xxZ): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc đóng (14:54:xxZ, trước prune): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`
  (sau prune 1 file → 100, xem §7), rc=0. Kiểm lại
  TRỐNG ngay trước prune (14:54:11Z, `status-before-prune.txt`).
- **Log lock +26 dòng kể từ T6-154 đóng** (raw 1504 lúc
  T6-154 đóng → 1530 lúc T6-155 mở → 1533 lúc đóng):
  26 dòng đều trước phiên T6, **+3 dòng trong phiên T6**
  (xem dưới).
- Đối chiếu 26 dòng (khớp đúng từng dòng, xem §4):
  - t8-round154: 7 chu kỳ hoàn tất (13:31:34Z →
    13:51:00Z; holds 181 / 80 / 141 / 240 / 70 / 131 /
    230 s; 5 dòng COOLDOWN kèm theo, các lần chờ
    14940–14963 ms trên cổng 5490/5390).
  - Tổng: 7 chu kỳ hoàn tất = Δ TICKET +7, Δ ACQUIRED +7,
    Δ RELEASED +7, Δ COOLDOWN +5 (khớp §4). 0 STALE-LOCK,
    0 STALE-TICKET, 0 TIMEOUT mới trong 26 dòng.
- **Reboot #49 (btime 13:05:12Z) KHÔNG giết holder nào:**
  chu kỳ cuối cùng trên log trước reboot hoàn tất
  11:04:11Z (t8-round153 RELEASED hold 230 s) —
  **~2h01m trước reboot #49**; **không có dòng lock nào
  giữa 11:04:11Z và 13:31:34Z** (dòng đầu sau reboot là
  t8-round154 TICKET 13:31:34Z); không có ACQUIRED nào
  chưa release tại thời điểm reboot (still held = 0,
  xem §4). T6 KHÔNG chứng nhận số hiệu/gap/mù của
  reboot #49 — thuộc T0-155/T2-155 (số hiệu #49 đã có
  từ quyết parent đợt 154).
- **+3 dòng TRONG phiên T6-155:** 1 chu kỳ t4 hoàn tất
  (TICKET 14:42:56Z → ACQUIRED 14:42:56Z wait 0 s →
  RELEASED 14:47:40Z hold 284 s) — luồng T4-155 acquire
  trong lúc harness của T6 đang chạy; harness chạy trên
  /tmp nên không bị ảnh hưởng. File `cooldown-t4` chỉ
  ghi đè cùng tên cũ (mtime mới 14:47:40Z), không tăng
  số lượng queue (vẫn 101 trước prune).
- **File cooldown mới kể từ T6-154 đóng:
  `cooldown-t8-round154` (mtime 13:51:00Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 154 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 168 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 8 chu kỳ hoàn tất
  kể từ T6-154 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2; gồm 7 chu
  kỳ t8-round154 + 1 chu kỳ t4 trong phiên T6-155).
  - Cộng với 160 chu kỳ T6-154 đã đếm = **168 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (160 đợt
    154 + 8 đợt này).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1527 dòng chính thức lúc đóng, 434 cặp, 0 đang giữ, 0 double-acquire mới trong phiên, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
diff: bản đã lọc = raw trừ đúng 6 dòng đó, diff exit 0
lúc mở (chỉ 26 dòng mới so với T6-154 đóng) và lúc đóng
(chỉ thêm 3 dòng t4 trong phiên)).
Bản đã lọc lúc đóng: **1527 dòng** (raw 1533) — **+29 dòng
kể từ T6-154 đóng** (26 trước phiên + 3 trong phiên).
**KHỚP ĐÚNG số T6-154 đếm lúc đóng cộng thêm 8 chu kỳ
hoàn tất** — xem bảng đối chiếu dưới.

| Chỉ số (bản đã lọc) | T6-154 đóng | T6-155 mở | T6-155 đóng | Δ trong phiên T6-155 |
|---|---|---|---|---|
| Tổng dòng | 1498 | 1524 | 1527 | +3 |
| TICKET | 446 | 453 | 454 | +1 |
| ACQUIRED | 435 | 442 | 443 | +1 |
| RELEASED | 426 | 433 | 434 | +1 |
| COOLDOWN | 171 | 176 | 176 | 0 |
| STALE-LOCK | 9 | 9 | 9 | 0 |
| STALE-TICKET | 1 | 1 | 1 | 0 |
| TIMEOUT | 10 | 10 | 10 | 0 |
| Cặp ACQUIRED→RELEASED | 426 | 433 | 434 | +1 |
| Đang giữ cuối log | 0 | 0 | 0 | 0 |
| Double-acquire | 9 | 9 | 9 | 0 mới |

- **0 double-acquire mới** kể từ T6-154 đóng (9 ca toàn bộ
  đều đã giải thích ở các đợt trước; mỗi ca đều có dòng
  STALE-LOCK tương ứng — xem
  `analyze-log-cleaned-close.txt`).
  0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới
  (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt 150),
  0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`khong-nha-grep.txt` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE.** Giữ/nhả đúng lúc mở
  và lúc đóng (8 chu kỳ mới sạch kể từ T6-154 đóng),
  0 zombie lúc đóng, 0 stale mới, queue 0 ticket, log nhất
  quán (434 cặp + 0 đang giữ, 0 mất dấu khác — số chính
  thức đã loại 6 dòng repro lỗi của T6-132), 0 TIMEOUT mới,
  0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 148–155 (toàn
  đợt) và đợt 155 (tới 14:54Z), suite 9/9 ×6 lần (T7 (A)
  xanh cả 6 — xem §6), và thứ tự ghi mới đã có **168 chu
  kỳ thật** chứng minh (§3).
  **Không còn caveat nào về mất dòng RELEASED cho các
  chu kỳ mới** — caveat cũ chỉ còn là 1 dòng lịch sử
  (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **reboot #49 giữa phiên
  đợt 154** (btime 13:05:12Z) — không giết holder, nhưng
  gap/mù của nó thuộc T0-155/T2-155 (T6 không chứng
  nhận); và **script replay-watch của T5-155 + b2-watcher
  của T9-155 + 3 socket X11 của luồng khác chạy lúc T6
  đóng** (xem §1) — chỉ 1 chu kỳ t4 acquire trong cửa
  sổ T6, đã hoàn tất sạch.

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151/T6-152/T6-153/T6-154 §6.2. File khối T7 đã trích
  `t7-block-a155.sh` md5 **`dc973443030249a262ff63cbc62231d5`**
  — **giống hệt** file khối đã trích đợt 151, 152, 153
  và 154 (cùng md5). Harness đợt này chạy đúng code (A) trong
  suite, không phải bản sao tay (xem §6.2).
- **PHẠM VI HẸP — đã tuân thủ, có bằng chứng:**
  `vcut-poll-quiet-v2.sh` KHÔNG đổi (`1710e480` lúc mở
  = lúc đóng); hàm `count_blockers` dùng chung cho gate
  cửa yên của T4 KHÔNG đổi (grep: `count_blockers` chỉ
  xuất hiện trong poll script, dòng 32/46 — trong suite
  chỉ có 1 lần xuất hiện duy nhất là dòng comment ở
  khối T7: "PHẠM VI HẸP: (A) CHỈ áp cho khối test T7
  này; KHÔNG đổi count_blockers", kèm 3 lệnh poll cũ
  của (B) đã comment; không có trong live-code khối T7).
  Script lock v2 KHÔNG đổi (`520b8baa`). T4-155 có acquire
  1 chu kỳ trong phiên T6 (§2) — chu kỳ hoàn tất sạch,
  gate của T4 không bị ảnh hưởng bởi bất kỳ đổi nào của
  T6 (T6 không đổi gì).
- `bash -n` harness t7-control-a155.sh: OK (bản sao của
  t7-control-a154.sh, chỉ đổi hậu tố a154 → a155 + sửa
  comment "đợt 154" → "đợt 155", diff kiểm chứng khớp).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151/152/153/154 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ năm liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(14:42–14:45Z, `test-v2-t6-run1.log` … `run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt ~21–22 s).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Không có FAIL nào ở bất kỳ khối nào.
Suite chạy trên log riêng trong /tmp — log lock thật
chỉ tăng 3 dòng trong 6 lượt chạy (chu kỳ t4 của luồng
khác, §2; không phải của suite T6).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round155-t6/t7-control-a155.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung.
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a155.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153
  và 154; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a155-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 505 ms, max 3475 ms, trung bình 2066,18 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'07" (14:46:xx–14:53:xxZ),
  dưới tải hệ thống cao (10 luồng đợt 155 chạy song
  song — xem §1).
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

- **Kết luận: (A) VẪN XANH sau bốn đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ năm liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 600/600 dưới churn qua 5 đợt). Chú thích tỉ lệ
  (như T6-150/151/152/153/154): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 4 (đợt 154) → **5 (đợt
  155 — lần thứ năm xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 36 (đợt 154) → **37 (đợt 155,
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
  - 14:40Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-154 thêm `cooldown-t8-round154`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG ngay từ lúc mở (14:40:xxZ) và vẫn TRỐNG
    lúc kiểm tra lại trước khi prune (14:54:11Z,
    `status-before-prune.txt`) — điều (e) thỏa ngay,
    **không phải chờ như đợt 151** (đợt 151 T4-151 giữ lock giữa phiên nên prune phải chờ).
  - 14:54:11Z: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-s6`, mtime 2026-11-14T21:40:10Z,
    ~141h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round ~116; xem §12
    F-149-T6-3).
  - **Kết quả prune đợt 155 (lần 30): 1 file đã xóa
    (`cooldown-s6`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size + tuổi + điều luật).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (14:40Z) **101 file / 1414 byte**;
  lúc prune (14:54:11Z, trước khi xóa) **101 file /
  1414 byte** (log lock 1533 dòng — +3 dòng trong phiên
  là chu kỳ t4, `cooldown-t4` chỉ ghi đè cùng tên, không
  file cooldown mới, xem §2/§4);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  đóng (14:54Z) vẫn **100 file / 1400 byte**. Số học
  khớp: 101 + 0 = 101 ✓ (0 file cooldown mới trong
  phiên T6), rồi 101 − 1 = 100 ✓ (1 file prune). Không
  file nào bị xóa hay thêm ngoài 1 file prune giữa hai
  lần đếm của đợt này. Số học từ T6-154 đóng: 100 + 1
  file mới (`cooldown-t8-round154`; `cooldown-t4` chỉ ghi
  đè cùng tên) = 101 ✓ — khớp đúng số T10-154 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 61 file; ≥48h (`-mtime +1`): 75
  file**. Sau prune (14:54Z): **≥192h: 0 file; ≥72h:
  60 file; ≥48h: 74 file** — ≥72h giảm 61 → 60 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-s3-round116`, mtime 2026-11-14T22:10:36Z —
  lúc 14:54Z mới **~140,7h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 61, tăng từ 60 lúc mở
  đợt 154 — dù prune 29 đã xóa 1 file ≥72h — vì 2 file
  khác đã vượt ngưỡng 72h trong khoảng giữa 2 đợt; khớp
  số học, không phải mâu thuẫn.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ sáu liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt này xóa `cooldown-s6` trước khi nó đủ 7 ngày — nó đủ 7 ngày theo đồng hồ
  tường vào khoảng **21/11 21:40Z** nhưng đã bị xóa ở
  đợt 155). T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 31 (T6-156): tổng lock 100 sau prune 30 —
  kiểm lại lúc mở đợt 156** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-155; reboot #49 (btime 13:05:12Z) KHÔNG giết holder

- Boot duy nhất trong phiên: **12fc68a3** (btime
  13:05:12Z = epoch 1795179912). T6 **KHÔNG chứng nhận**
  số hiệu/gap reboot #49 (thuộc T0-155/T2-155; số hiệu
  #49 đã có từ quyết parent đợt 154).
- Uptime boot lúc đóng ~1h49'. `journal --list-boots`
  chỉ 1 dòng 12fc68a3 (first entry 13:05:29Z) — khớp
  btime. **KHÔNG có reboot #50 lúc đóng** (kiểm
  14:53:53Z).
- Reboot #49 (btime 13:05:12Z) xảy ra giữa phiên đợt 154,
  sau chu kỳ lock cuối 11:04:11Z — không giết holder
  nào (§2); T10-154 đã ghi nhận #49.

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này.
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-155
  (LIMITS này) — xem §10.
- Lock lúc đóng: TRỐNG, 0 ticket + 100 cooldown (sau
  prune), log 1533 dòng thô / 1527 dòng chính thức,
  434 cặp, 0 đang giữ.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round155-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND155_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round155-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 155 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 155 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (chỉ T6 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–155 tạm tính: **429 batch
  / 834 entry** (428/833 đợt 154 + 1/1 đợt 155 — số file
  duy nhất do T10 đếm dedup toàn cục; T6 không tự cộng
  tay vào lũy kế file).

## 11. GHI CHÚ CHO T10-155 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ năm liên tiếp, tổng 600/600 qua 5
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 4 → 5 (lần thứ năm xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 36 → 37 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe (434 cặp, 0 giữ, 0 TIMEOUT mới); prune lần
  30 xóa 1 file, queue về đúng trần 100.
- Reboot #49 (btime 13:05:12Z) KHÔNG giết holder nào —
  T0-155/T2-155 đánh số/chứng nhận gap chính thức (T6
  không chứng nhận).
- 0 zombie lúc mở và lúc đóng; replay-watch của T5-155 +
  b2-watcher của T9-155 + 3 socket X11 của luồng khác
  chạy lúc T6 đóng — chỉ 1 chu kỳ t4 acquire trong cửa
  sổ T6, đã hoàn tất sạch; T10-155 lưu ý khi đối chiếu
  log (+3 dòng trong phiên T6 là của T4-155, không phải
  của suite T6).
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả): (i) lệnh chụp snapshot lúc đóng lần
  đầu chạy sai cwd nên 6 file rơi ra `~/` — đã `mv` về
  đúng `round155-t6/` và kiểm `ls` đủ file; (ii) lần
  trích appendix đầu tiên cũng sai cwd, file rác
  `~/appendix-numbers.txt` đã xóa, home sạch; (iii) lần
  ghi md5-open đầu tiên gõ nhầm đường dẫn preview.tsx
  cũ — đã ghi lại đúng `apps/web/src/preview.tsx`,
  md5 530e10a7 khớp. Mọi số liệu trong LIMITS này đều
  trích từ file đúng vị trí sau khi dọn.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #74?/
  #75?/#77?/#81? giao T2-155; birefnet 0 thử; u2net là
  fallback chính thức).
- Cờ `round155-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a155-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round155-t6/appendix-numbers.txt` giữ bản
trích gốc:

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=505 max=3475 mean=2066.18
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
suite run1: PASS=9 FAIL=0 T7A=1
suite run2: PASS=9 FAIL=0 T7A=1
suite run3: PASS=9 FAIL=0 T7A=1
suite run4: PASS=9 FAIL=0 T7A=1
suite run5: PASS=9 FAIL=0 T7A=1
suite run6: PASS=9 FAIL=0 T7A=1
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a155.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=442, COOLDOWN=176, RELEASED=433, STALE-LOCK=9, STALE-TICKET=1, TICKET=453, TIMEOUT=10, total=1524
cleaned-open pairs ACQUIRED->RELEASED: 433
cleaned-open still held at end of log: 0 -> {}
cleaned-close counts: TOTAL: ACQUIRED=443, COOLDOWN=176, RELEASED=434, STALE-LOCK=9, STALE-TICKET=1, TICKET=454, TIMEOUT=10, total=1527
cleaned-close pairs ACQUIRED->RELEASED: 434
cleaned-close still held at end of log: 0 -> {}
raw log lines open: 1530
raw log lines close: 1533
queue files now: 100 bytes=1400
KHONG-NHA lines in raw log: 0
```

---
**Batch stage / Tổng batch:** T6-155: 1 batch / 1 entry / 1 file. Đợt 155 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry. Lũy kế 111–155 (tạm tính, T10 đếm lại dedup toàn cục): 429 batch / 834 entry. Tổng batch chờ user push (đợt 136–155, tạm tính): 181 batch / 256 entry (180/255 đợt 154 + 1/1 đợt 155 — số file duy nhất do T10 đếm dedup toàn cục).
