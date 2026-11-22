# PHASE9 ROUND153 T6 — (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN + lock KHỎE + prune lần 28: XÓA 1 FILE + reboot mới trước phiên, KHÔNG giết holder — LIMITS

- Đợt: 153, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 15:35 +07 20/11/2026 (= 08:35:51Z). Chạy
  08:37:xxZ → 08:49:xxZ 20/11/2026, toàn bộ trên một boot duy
  nhất 401fca75 — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm sức khỏe lock lúc mở đợt
  153: tổng số file lock/queue, số cặp, số giữ, cooldown còn
  lại; đối chiếu với 101 lúc T10-152 đóng; (b) prune lần 28:
  tổng lock 100 sau prune 27, lúc T10-152 đóng đã là 101
  (T8 thêm 1 cooldown) — kiểm lại lúc mở đợt 153 rồi prune
  theo mẫu các đợt trước; (c) kiểm chứng lại (A) 120/120
  PASS dưới churn; (d) viết LIMITS trung thực, phụ lục số
  liệu bằng script trích từ log gốc, không gõ tay; (e) stage
  paths NUL-delimited; (f) viết cờ .done CÓ NỘI DUNG.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151/152,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151/152); kiểm chứng lại DƯƠNG TÍNH: khối
  T7 trích verbatim chạy 120 lần với churn bơm vào — PASS
  120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE: 417 cặp ACQUIRED→RELEASED, 0 đang giữ,
  0 TIMEOUT mới, 0 "KHÔNG NHẢ". Prune lần 28: xóa 1 file cũ
  nhất (điều (b)), queue 101 → 100 file. Reboot mới trước
  phiên (btime 07:32:38Z, boot 401fca75) KHÔNG giết holder
  nào (chu kỳ cuối hoàn tất 06:33:45Z, ~59 phút trước
  reboot; không có dòng lock nào sau 06:33:45Z).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round153-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, wc-open.txt, wc-close.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  analyze-log.py, analyze-log-cleaned-open.txt,
  analyze-log-cleaned-close.txt, prune-candidates.txt,
  prune-deleted.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a153.sh,
  t7-block-a153.sh, t7-a153-churn.log, md5-open.txt,
  md5-close.txt, appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 401fca75 MỚI (btime 07:32:38Z); lock TRỐNG; queue 101 file (khớp T10-152 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `401fca75-bece-45b6-88fa-b12f602d6390`, btime 07:32:38Z
  theo /proc/stat** (epoch 1795159958; `uptime -s` =
  07:32:38; `journal --list-boots` chỉ 1 dòng 401fca75,
  first entry 07:32:49Z). Uptime ~65' lúc T6 bắt đầu
  (08:37Z), ~76' lúc đóng (08:49Z). Đây là boot sau
  **reboot mới lúc 07:32:38Z** — xảy ra TRƯỚC phiên T6
  (~63 phút trước khi đợt 153 mở 08:35:51Z). **KHÔNG có
  reboot trong phiên T6** (boot_id giống nhau lúc mở và
  lúc đóng). Kể từ T6-152 đóng (boot 18e179e0, btime
  05:20:57Z) đã có 2 reboot mới: #44 btime 07:04:11Z (theo
  hồ sơ T2-152) và reboot này btime 07:32:38Z — T2-153
  đánh số/chứng nhận gap chính thức (T6 không chứng nhận
  gap/mù của reboot; xem §2/§8).
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp).
- Queue lúc mở: **101 file / 1414 byte** — khớp đúng số
  T10-152 đóng (100 sau prune 27 + 1 file cooldown mới
  `cooldown-t8-round152`, mtime 06:33:45Z, §2).

## 1. Quét zombie: 0 zombie cả 2 snapshot; 0 vite lúc mở; 1 vite của luồng khác (T8-153) lúc đóng — không phải của T6

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 08:37Z
  (mở, `ps-full-open.txt`, 15 dòng) và lúc 08:48Z
  (đóng, `ps-full-close.txt`, 48 dòng).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (08:37Z): 0 vite thật đang chạy** — `ss -tlnp`
  trống hoàn toàn (0 cổng lắng nghe); `/tmp/.X11-unix/`
  trống (0 socket). Lock TRỐNG (§2).
- **Lúc đóng (08:48Z): 1 vite thật đang chạy — KHÔNG phải
  của T6:** pid 25394, `node …/vite --configLoader native
  -c /tmp/round87-o8/vite.o8w.config.mjs --port 5564
  --strictPort --host 127.0.0.1` (cùng ppid 25315 với
  bridge pid 25381, `server/bridge/src/index.js` trên cổng
  8861, và Xvfb `:191` pid 25429) — đây là O8 click-test
  của T8-153, khởi động trong phiên T6. `ss` lúc đóng có
  2 cổng lắng nghe (127.0.0.1:5564 vite, *:8861 bridge);
  `/tmp/.X11-unix/` có 1 socket X191 (của T8-153).
  Log lock thật KHÔNG tăng dòng nào trong phiên T6
  (1472 lúc mở = 1472 lúc đóng, §4) nên vite của T8-153
  chưa acquire lock nào trong cửa sổ T6 — T6 không đụng
  tới nó, không kill process nào trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-153).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (khớp đợt 147–152 — không có lần flip mới trong
  phiên T6; quyết parent (m) đợt 146: ghi làm chú thích,
  không hành động).

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; +29 dòng kể từ T6-152 đóng — TẤT CẢ TRƯỚC phiên T6 (0 dòng trong phiên)

- **Lúc mở (08:37:xxZ): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc đóng (08:48:xxZ, trước prune): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`
  (sau prune 1 file → 100, xem §7), rc=0.
- **Log lock +29 dòng kể từ T6-152 đóng** (raw 1443 lúc
  T6-152 đóng → 1472 lúc T6-153 mở → 1472 lúc đóng):
  TẤT CẢ 29 dòng đều trước phiên T6 (05:59–06:33Z) —
  **0 dòng mới trong phiên T6-153** (suite T6 chạy trên
  log riêng trong /tmp, xem §6; vite của T8-153 lúc đóng
  chưa acquire — xem §1).
- Đối chiếu 29 dòng (khớp đúng từng dòng, xem §4):
  - t4: 1 chu kỳ hoàn tất (TICKET/ACQUIRED 05:59:46Z →
    RELEASED 06:03:28Z hold 222 s).
  - t8-round152: 7 chu kỳ hoàn tất (holds 171 / 80 / 140 /
    240 / 71 / 130 / 230 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14934–14957 ms trên cổng 5490/5390).
  - Tổng: 8 chu kỳ hoàn tất = Δ TICKET +8, Δ ACQUIRED +8,
    Δ RELEASED +8, Δ COOLDOWN +5 (khớp §4). 0 STALE-LOCK,
    0 STALE-TICKET, 0 TIMEOUT mới trong 29 dòng.
- **2 reboot mới kể từ T6-152 đóng KHÔNG giết holder
  nào:** chu kỳ cuối cùng trên log hoàn tất 06:33:45Z
  (t8-round152 RELEASED hold 230 s) — **~30 phút trước
  reboot #44 (btime 07:04:11Z, theo hồ sơ T2-152) và
  ~59 phút trước reboot btime 07:32:38Z**; không có dòng
  lock nào sau 06:33:45Z, không có ACQUIRED nào chưa
  release tại thời điểm either reboot (still held = 0,
  xem §4). T6 KHÔNG chứng nhận gap/mù của 2 reboot này
  — thuộc T2-153.
- **File cooldown mới kể từ T6-152 đóng:
  `cooldown-t8-round152` (mtime 06:33:45Z)** — file duy
  nhất làm tổng queue tăng 100 → 101 (file `cooldown-t4`
  mtime 06:03:28Z chỉ ghi đè cùng tên cũ, không tăng số
  lượng — tên file cooldown theo thread nên thread lặp
  lại ghi đè). Số học khớp: 100 + 1 = 101 ✓. File mới
  là file đợt 152 (đợt ngay trước) nên được bảo vệ bởi
  điều (c) — đồng thời là file mới nhất nên không nằm
  trong diện xóa của điều (b) trong bất kỳ trường hợp
  nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 151 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 8 chu kỳ hoàn tất
  kể từ T6-152 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2; gồm 1 chu
  kỳ t4 + 7 chu kỳ t8-round152).
  - Cộng với 143 chu kỳ T6-152 đã đếm = **151 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (143 đợt
    152 + 8 đợt này).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1466 dòng chính thức lúc đóng, 417 cặp, 0 đang giữ, 0 double-acquire mới trong phiên, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
diff: bản đã lọc = raw trừ đúng 6 dòng đó, diff exit 0,
cả lúc mở và lúc đóng).
Bản đã lọc lúc đóng: **1466 dòng** (raw 1472) — **+29 dòng
kể từ T6-152 đóng** (đối chiếu từng dòng ở §2).
**KHỚP ĐÚNG số T6-152 đếm lúc đóng cộng thêm 8 chu kỳ
hoàn tất** — xem bảng đối chiếu dưới.

| Chỉ số (bản đã lọc) | T6-152 đóng | T6-153 mở | T6-153 đóng | Δ trong phiên T6-153 |
|---|---|---|---|---|
| Tổng dòng | 1437 | 1466 | 1466 | 0 |
| TICKET | 429 | 437 | 437 | 0 |
| ACQUIRED | 418 | 426 | 426 | 0 |
| RELEASED | 409 | 417 | 417 | 0 |
| COOLDOWN | 161 | 166 | 166 | 0 |
| STALE-LOCK | 9 | 9 | 9 | 0 |
| STALE-TICKET | 1 | 1 | 1 | 0 |
| TIMEOUT | 10 | 10 | 10 | 0 |
| Cặp ACQUIRED→RELEASED | 409 | 417 | 417 | 0 |
| Đang giữ cuối log | 0 | 0 | 0 | 0 |
| Double-acquire | 9 | 9 | 9 | 0 mới |

- **0 double-acquire mới** kể từ T6-152 đóng (9 ca toàn bộ
  đều đã giải thích ở các đợt trước; mỗi ca đều có dòng
  STALE-LOCK tương ứng — xem
  `analyze-log-cleaned-close.txt`).
  0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới
  (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt 150),
  0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`khong-nha-grep.txt` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE.** Giữ/nhả đúng lúc mở
  và lúc đóng (8 chu kỳ mới sạch kể từ T6-152 đóng),
  0 zombie, 0 stale mới, queue 0 ticket, log nhất quán
  (417 cặp + 0 đang giữ, 0 mất dấu khác — số chính thức
  đã loại 6 dòng repro lỗi của T6-132), 0 TIMEOUT mới,
  0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 148–153 (toàn
  đợt) và đợt 153 (tới 08:48Z), suite 9/9 ×6 lần (T7 (A)
  xanh cả 6 — xem §6), và thứ tự ghi mới đã có **151 chu
  kỳ thật** chứng minh (§3).
  **Không còn caveat nào về mất dòng RELEASED cho các
  chu kỳ mới** — caveat cũ chỉ còn là 1 dòng lịch sử
  (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **2 reboot mới trước phiên**
  (btime 07:04:11Z và 07:32:38Z) — không giết holder,
  nhưng gap/mù của chúng thuộc T2-153 (T6 không chứng
  nhận); và **vite + Xvfb của T8-153 chạy lúc T6 đóng**
  (xem §1) — không acquire lock trong cửa sổ T6.

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151/T6-152 §6.2. File khối T7 đã trích
  `t7-block-a153.sh` md5 **`dc973443030249a262ff63cbc62231d5`**
  — **giống hệt** file khối đã trích đợt 151 và 152
  (cùng md5). Harness đợt này chạy đúng code (A) trong
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
  Script lock v2 KHÔNG đổi (`520b8baa`). Không có luồng
  đợt 153 nào acquire trong phiên T6 (§2) nên không có
  bằng chứng live nào thêm về gate T4 đợt này — gate
  của T4 không bị ảnh hưởng bởi bất kỳ đổi nào của T6
  (T6 không đổi gì).
- `bash -n` harness t7-control-a153.sh: OK (bản sao của
  t7-control-a152.sh, chỉ đổi hậu tố a152 → a153, diff
  kiểm chứng khớp).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151/152 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ ba liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(08:38–08:40Z, `test-v2-t6-run1.log` … `run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt ~21–22 s).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Không có FAIL nào ở bất kỳ khối nào.
Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào trong 6 lượt chạy (1472 lúc mở =
1472 lúc đóng, §4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round153-t6/t7-control-a153.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung.
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a153.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151 và 152;
  live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a153-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 501 ms, max 3488 ms, trung bình 1993,19 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'03" (08:40:50–08:47:53Z).
- **Đối chiếu cùng churn (cùng phương pháp bơm churn):**

| Phương án | Có churn | Kết quả |
|---|---|---|
| (B), đợt 150 | 30 lần | **2/30 PASS (7%)** |
| Bản cũ (B1−B2=1), đợt 150 | 30 lần | **13/30 PASS (43%)** |
| **(A), đợt 151** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 152 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 153 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau hai đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ ba liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 360/360 dưới churn qua 3 đợt). Chú thích tỉ lệ
  (như T6-150/151/152): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 2 (đợt 152) → **3 (đợt
  153 — lần thứ ba xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 34 (đợt 152) → **35 (đợt 153,
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
  - 08:37Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-152 thêm `cooldown-t8-round152`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG ngay từ lúc mở (08:37:xxZ) và vẫn TRỐNG
    lúc kiểm tra lại trước khi prune (08:48:44Z) — điều
    (e) thỏa ngay, **không phải chờ như đợt 151** (đợt
    151 T4-151 giữ lock giữa phiên nên prune phải chờ).
  - 08:48:44Z: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-s2`, mtime 2026-11-14T21:29:45Z,
    ~131,3h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round ~116; xem §12
    F-149-T6-3).
  - **Kết quả prune đợt 153 (lần 28): 1 file đã xóa
    (`cooldown-s2`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size + tuổi + điều luật).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (08:37Z) **101 file / 1414 byte**;
  lúc prune (08:48:44Z, trước khi xóa) **101 file /
  1414 byte** (log lock 1472 dòng — 0 dòng mới trong
  phiên T6, không file cooldown mới, xem §2/§4);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  đóng (08:49Z) vẫn **100 file / 1400 byte**. Số học
  khớp: 101 + 0 = 101 ✓ (0 file cooldown mới trong
  phiên T6), rồi 101 − 1 = 100 ✓ (1 file prune). Không
  file nào bị xóa hay thêm ngoài 1 file prune giữa hai
  lần đếm của đợt này. Số học từ T6-152 đóng: 100 + 1
  file mới (`cooldown-t8-round152`; `cooldown-t4` chỉ ghi
  đè cùng tên) = 101 ✓ — khớp đúng số T10-152 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 58 file; ≥48h (`-mtime +1`): 74
  file**. Sau prune (08:48Z): **≥192h: 0 file; ≥72h:
  57 file; ≥48h: 73 file** — ≥72h giảm 58 → 57 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-s5`, mtime 2026-11-14T21:36:06Z —
  lúc 08:48Z mới **~131,2h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này vẫn 58 như lúc mở đợt
  152 — dù prune 27 đã xóa 2 file ≥72h — vì 2 file khác
  đã vượt ngưỡng 72h trong khoảng giữa 2 đợt; khớp số
  học, không phải mâu thuẫn.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ tư liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt này xóa `cooldown-s2` trước khi nó đủ 7 ngày —
  nó đủ 7 ngày theo đồng hồ tường vào khoảng
  **21/11 21:29Z** nhưng đã bị xóa ở đợt 153). T6 các
  đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 29 (T6-154): tổng lock 100 sau prune 28 —
  kiểm lại lúc mở đợt 154** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-153; 2 reboot mới trước phiên chờ T2-153 chứng nhận

- Boot duy nhất trong phiên: **401fca75** (btime
  07:32:38Z = epoch 1795159958). T6 **KHÔNG chứng nhận**
  gap 2 reboot mới này (thuộc T2-153; xem §2/§0 về số
  hiệu — reboot btime 07:32:38Z chờ T2-153 đánh số
  chính thức; reboot #44 btime 07:04:11Z đã có trong hồ
  sơ T2-152).
- Uptime boot lúc đóng ~76'. `journal --list-boots`
  chỉ 1 dòng 401fca75 (first entry 07:32:49Z) — khớp
  btime. Boot trước (`18e179e0`, sau reboot #43) sống
  05:20:57Z → 07:32:38Z = 7.901 s theo btime (gồm cả
  khoảng reboot #44 ở giữa — boot 18e179e0 kết thúc ở
  reboot #44 07:04:11Z; boot sau #44 sống 07:04:11Z →
  07:32:38Z = 1.707 s; T2-153 chốt chính thức).
- Reboot #44 (btime 07:04:11Z) và reboot btime 07:32:38Z
  đều sau chu kỳ lock cuối 06:33:45Z — không giết holder
  nào (§2); T2-152/T8-152 đã ghi nhận #44.

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này.
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-153
  (LIMITS này) — xem §10.
- Lock lúc đóng: TRỐNG, 0 ticket + 100 cooldown (sau
  prune), log 1472 dòng thô / 1466 dòng chính thức,
  417 cặp, 0 đang giữ.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round153-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND153_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round153-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 153 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 153 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (chỉ T6 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–153 tạm tính: **409 batch
  / 806 entry** (408/805 đợt 152 + 1/1 đợt 153 — số file
  duy nhất do T10 đếm dedup toàn cục; T6 không tự cộng
  tay vào lũy kế file).

## 11. GHI CHÚ CHO T10-153 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ ba liên tiếp, tổng 360/360 qua 3
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 2 → 3 (lần thứ ba xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 34 → 35 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe (417 cặp, 0 giữ, 0 TIMEOUT mới); prune lần
  28 xóa 1 file, queue về đúng trần 100.
- 2 reboot mới trước phiên (btime 07:04:11Z #44 theo hồ
  sơ T2-152, và btime 07:32:38Z boot 401fca75 chờ T2-153
  đánh số) KHÔNG giết holder nào — T2-153 đánh số/chứng
  nhận gap chính thức (T6 không chứng nhận).
- Vite + Xvfb của T8-153 chạy lúc T6 đóng (port 5564,
  X191) — không acquire lock trong cửa sổ T6; T10-153
  lưu ý khi đối chiếu log (0 dòng mới trong phiên T6
  nhưng luồng khác vẫn đang chạy).
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #74?/
  #75? giao T2-153; birefnet 0 thử; u2net là fallback
  chính thức).
- Cờ `round153-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a153-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round153-t6/appendix-numbers.txt` giữ bản
trích gốc:

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=501 max=3488 mean=1993.19
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
md5 t7-block-a153.sh=dc973443030249a262ff63cbc62231d5
cleaned-close counts: {'TICKET': 437, 'TIMEOUT': 10, 'ACQUIRED': 426, 'RELEASED': 417, 'COOLDOWN': 166, 'STALE-LOCK': 9, 'STALE-TICKET': 1} lines=1466
cleaned-open  counts: {'TICKET': 437, 'TIMEOUT': 10, 'ACQUIRED': 426, 'RELEASED': 417, 'COOLDOWN': 166, 'STALE-LOCK': 9, 'STALE-TICKET': 1} lines=1466
raw log lines now: 1472
queue files now: 100 bytes=1400
KHONG-NHA lines in raw log: 0
```

---
**Batch stage / Tổng batch:** T6-153: 1 batch / 1 entry / 1 file. Đợt 153 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry. Lũy kế 111–153 (tạm tính, T10 đếm lại dedup toàn cục): 409 batch / 806 entry. Tổng batch chờ user push (đợt 136–153, tạm tính): 161 batch / 228 entry (160/227 đợt 152 + 1/1 đợt 153 — số file duy nhất do T10 đếm dedup toàn cục).
