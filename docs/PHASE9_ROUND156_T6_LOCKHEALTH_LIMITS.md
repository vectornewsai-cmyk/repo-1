# PHASE9 ROUND156 T6 — (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 6 LIÊN TIẾP) + #50 GIẾT HOLDER t4 (XÁC NHẬN ĐỘC LẬP TỪ LOG LOCK) + #51/#52 KHÔNG GIẾT HOLDER + prune lần 31: XÓA 1 FILE — LIMITS

- Đợt: 156, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 00:35 +07 21/11/2026 (= 17:35:51Z). Chạy
  17:38:52Z → ~17:57Z 20/11/2026. Lúc mở đã ở trên boot mới
  `5353ed19` (btime 17:19:09Z) — reboot #52 ỨNG VIÊN (xem
  §0/§8); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 6 liên tiếp nếu đạt — tổng
  720/720); ghi rõ số chu kỳ, điều kiện churn, boot đo;
  (b) kiểm tra lock khỏe: số cặp, số đang giữ, TIMEOUT mới,
  "KHÔNG NHẢ"; (c) chạy suite liên quan và ghi exit code +
  thời gian thật; (d) prune lần 31: đếm queue lúc mở, xóa
  file theo đúng quy tắc prune các đợt trước, ghi rõ xóa
  file nào, queue trước/sau; kiểm tra 2 reboot mới (#51
  trong lúc T10 đóng sổ + #52 ứng viên lúc mở) có giết
  holder nào không (chu kỳ cuối hoàn tất lúc nào);
  (e) ghi sai số riêng F-156-T6-n; (f) stage paths
  NUL-delimited; (g) viết cờ .done CÓ NỘI DUNG.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151/152/
  153/154/155, file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151/152/153/154/155); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (447 cặp ACQUIRED→RELEASED,
  0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 double-acquire mới) —
  NHƯNG CÓ 1 SỰ KIỆN MỚI QUAN TRỌNG: reboot #50 ĐÃ GIẾT HOLDER
  t4 (acquire 15:01:45Z, chết theo #50 lúc 15:04:07Z, được
  t8-round155 phát hiện STALE-LOCK và reclaim lúc 16:31:32Z —
  xác nhận độc lập từ log lock cho điều T4-155 đã báo
  "attempt2 bị #50 giết"). Reboot #51 (17:05:29Z) và #52 ứng
  viên (17:19:09Z) KHÔNG giết holder nào (chu kỳ cuối hoàn
  tất 16:54:37Z, trước #51 10m52s, trước #52 24m32s). Prune lần 31:
  xóa 1 file cũ nhất (điều (b)), queue 101 → 100 file.**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round156-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, wc-open.txt, wc-close.txt,
  queue-open.txt, queue-close.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-raw-close.log, analyze-log.py,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  new-lines-since-t6-155.txt, prune-candidates.txt,
  prune-deleted.txt, prune-time.txt, khong-nha-grep.txt,
  status-before-prune.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a156.sh,
  t7-control-a156.stdout.log, t7-block-a156.sh,
  t7-a156-churn.log, md5-open.txt, md5-close.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI 5353ed19 (#52 ỨNG VIÊN, btime 17:19:09Z); lock TRỐNG; queue 101 file (khớp T10-155 đóng)

- **Boot lúc mở và lúc đóng: boot_id
  `5353ed19-ddcb-46cc-9eca-9c9f86ba9706`, btime 17:19:09Z
  theo /proc/stat** (epoch 1795195149; `uptime -s` =
  17:19:09; `journal --list-boots` chỉ 1 dòng 5353ed19,
  first entry 17:19:25Z). Uptime ~20' lúc T6 bắt đầu
  (17:38Z), ~35' lúc đóng (~17:54Z). Boot này KHÁC boot
  #51 (c931d371, btime 17:05:29Z) — **reboot #52 ỨNG VIÊN
  lúc mở** (btime 17:19:09Z, sau #51 13m40s, trước giờ mở
  đợt 156 17:35:51Z 16m42s). T6 **KHÔNG chứng nhận** số
  hiệu #52 (thuộc T0-156/T2-156); T6 chỉ chứng nhận từ
  log lock rằng #52 không giết holder (xem §2/§8).
  **KHÔNG có reboot trong phiên T6** (boot_id giống nhau
  lúc mở và lúc đóng).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Lưu ý phương pháp: `md5-open.txt` ghi lại các giá trị
  md5 đã đo bằng lệnh `md5sum` lúc mở (~17:40Z, xem log
  phiên); `md5-close.txt` đo lại từ đĩa lúc đóng — hai
  bản khớp nhau từng hash (chỉ khác đường dẫn tương đối/
  tuyệt đối), xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp đúng số
  T10-155 đóng (100 sau prune 30 + 1 file cooldown mới
  `cooldown-t8-round155`, mtime 16:54:37Z, §2).

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite lúc mở; 1 vite của luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 17:38Z
  (mở, `ps-full-open.txt`, 9 dòng) và lúc ~17:53Z
  (đóng, `ps-full-close.txt`).
- **Lúc mở và lúc đóng: 0 zombie** (`awk '$4 ~ /Z/'` = 0
  cả hai snapshot).
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống hoàn
  toàn; `/tmp/.X11-unix/` trống. 3 dòng chứa chuỗi "vite"
  trong ps mở đều là chính dòng lệnh của T6 (tham số
  `vite-lock` trong lệnh snapshot), KHÔNG phải process
  vite (cùng bẫy tự-tham-chiếu như đợt 155 §1).
- **Lúc đóng: 1 vite thật của LUỒNG KHÁC đang chạy** —
  pid 4627 `node …/node_modules/.bin/vite --configLoader`
  (MainThread, elapsed 12:11 → khởi động ~17:41Z, trong
  phiên T6), lắng nghe 127.0.0.1:5564; kèm pid 4607 lắng
  nghe *:8861. `/tmp/.X11-unix/` lúc đóng có 4 socket
  (X191 17:41Z, X193/X194/X195 17:47Z) — của các luồng
  khác đợt 156. T6 không khởi động Xvfb/vite nào, không
  đụng tới các process này, không kill process nào trong
  phiên này. Vite pid 4627 KHÔNG acquire lock trong phiên
  T6 (log lock không thêm dòng nào trong phiên — diff
  cleaned mở/đóng RỖNG, §4).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-156).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (khớp đợt 147–155 — không có lần flip mới trong
  phiên T6; quyết parent (m) đợt 146: ghi làm chú thích,
  không hành động).
- Tải hệ thống trong phiên: các luồng đợt 156 khởi động
  dần (vite + Xvfb xuất hiện giữa phiên) — harness churn
  vẫn 120/120 (xem §6). Suite đợt này chạy chậm hơn đợt
  155 (27–36 s/lượt so với 21–22 s, §6.1) — ghi nhận là
  quan sát tải/boot lạnh, không phải lỗi.

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; +52 dòng kể từ T6-155 đóng — TẤT CẢ TRƯỚC phiên T6; +0 dòng TRONG phiên

- **Lúc mở (17:38:xxZ): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc đóng (~17:53Z, trước prune): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`
  (sau prune 1 file → 100, xem §7), rc=0. Kiểm lại
  TRỐNG ngay trước prune (17:54:19Z,
  `status-before-prune.txt`).
- **Log lock +52 dòng kể từ T6-155 đóng** (raw 1533 lúc
  T6-155 đóng → 1585 lúc T6-156 mở → 1585 lúc đóng):
  52 dòng đều trước phiên T6, **+0 dòng trong phiên T6-156**
  (diff bản đã lọc mở/đóng RỖNG — §4).
- Đối chiếu 52 dòng (khớp đúng từng dòng, file
  `new-lines-since-t6-155.txt`):
  - t4: 1 chu kỳ DỞ DANG (TICKET + ACQUIRED 15:01:45Z,
    KHÔNG có RELEASED — xem dưới, reboot #50 giết holder).
  - t8-round155: 13 chu kỳ hoàn tất (16:31:32Z →
    16:54:37Z; holds 176 / 10 / 10 / 10 / 10 / 10 / 10 /
    80 / 141 / 240 / 70 / 130 / 231 s; 10 dòng COOLDOWN
    kèm theo, các lần chờ 14910–14970 ms trên cổng
    5490/5390).
  - Tổng: Δ TICKET +14, Δ ACQUIRED +14, Δ RELEASED +13,
    Δ COOLDOWN +10, Δ STALE-LOCK +1 (khớp §4).
    0 STALE-TICKET, 0 TIMEOUT mới trong 52 dòng.
- **REBOOT #50 (btime 15:04:07Z) ĐÃ GIẾT HOLDER t4 —
  SỰ KIỆN MỚI ĐẦU TIÊN TRONG HỒ SƠ T6:**
  - t4 TICKET + ACQUIRED 15:01:45Z (port 5187, pid 55022,
    wait 1 s) — KHÔNG BAO GIỜ có RELEASED.
  - Reboot #50 btime 15:04:07Z — chỉ **142 s sau khi
    t4 acquire**; pid 55022 chết theo reboot giữa lúc
    đang giữ lock. Không có dòng lock nào giữa 15:01:45Z
    và 16:31:32Z.
  - 16:31:32Z t8-round155 phát hiện STALE-LOCK: "owner pid
    55022 chết + không vite trên cổng 5187 + curl 000 +
    boot đổi (tuổi 5387s)" — tuổi 5387 s = ĐÚNG khoảng
    15:01:45Z → 16:31:32Z (5387 s). t8 reclaim và ACQUIRED
    ngay cùng giây (wait 0 s), RELEASED 16:34:28Z hold
    176 s.
  - Đây là xác nhận độc lập từ log lock cho điều T4-155
    đã báo (aggregate 155 §12.1 (j): "attempt2 bị #50
    giết") — T4-155 attempt2 chính là chu kỳ t4 này.
    Các reboot trước trong hồ sơ T6 (#49 và các reboot
    đợt 148–154) đều KHÔNG giết holder; #50 là reboot
    đầu tiên giết holder mà T6 ghi nhận.
- **Reboot #51 (btime 17:05:29Z) KHÔNG giết holder nào:**
  chu kỳ cuối cùng trên log hoàn tất 16:54:37Z
  (t8-round155 RELEASED hold 231 s) — **10m52s trước
  #51**; không có dòng lock nào giữa 16:54:37Z và
  17:05:29Z; không có ACQUIRED nào chưa release tại thời
  điểm #51 (holder duy nhất chưa release — t4 — đã được
  reclaim xong từ 16:34:28Z).
- **Reboot #52 ứng viên (btime 17:19:09Z) KHÔNG giết
  holder nào:** chu kỳ cuối hoàn tất 16:54:37Z —
  **24m32s trước #52**; không có dòng lock nào giữa
  16:54:37Z và 17:19:09Z (cũng không có dòng nào giữa
  17:19:09Z và lúc T6 mở). T6 KHÔNG chứng nhận số hiệu
  #52 — thuộc T0-156/T2-156 (số hiệu #51 đã XÁC NHẬN
  theo quyết parent (d) đợt 155).
- **File cooldown mới kể từ T6-155 đóng:
  `cooldown-t8-round155` (mtime 16:54:37Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 155 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào. `cooldown-t4` (mtime
  14:47:40Z) chỉ là ghi đè cùng tên cũ, không tăng số
  lượng queue.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 181 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 13 chu kỳ hoàn tất
  kể từ T6-155 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2; gồm 13 chu
  kỳ t8-round155, trong đó chu kỳ đầu là reclaim sau
  STALE-LOCK #50).
  - Cộng với 168 chu kỳ T6-155 đã đếm = **181 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (168 đợt
    155 + 13 đợt này). Chu kỳ t4 bị #50 giết KHÔNG tính
    vào 181 (dở dang, không có RELEASED) — nhưng chính
    cơ chế STALE-LOCK đã xử lý đúng trường hợp này
    (reclaim sạch, không kẹt, không double-acquire mới).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1579 dòng chính thức lúc đóng, 447 cặp, 0 đang giữ HIỆU DỤNG, 0 double-acquire mới trong phiên, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
diff: bản đã lọc = raw trừ đúng 6 dòng đó; diff bản đã
lọc mở/đóng RỖNG vì không có dòng mới trong phiên).
Bản đã lọc lúc đóng: **1579 dòng** (raw 1585) — **+52 dòng
kể từ T6-155 đóng** (52 trước phiên + 0 trong phiên).
**KHỚP ĐÚNG số T6-155 đếm lúc đóng cộng thêm 13 chu kỳ
hoàn tất + 1 chu kỳ dở dang của t4** — xem bảng đối chiếu dưới.

| Chỉ số (bản đã lọc) | T6-155 đóng | T6-156 mở | T6-156 đóng | Δ trong phiên T6-156 |
|---|---|---|---|---|
| Tổng dòng | 1527 | 1579 | 1579 | +0 |
| TICKET | 454 | 468 | 468 | +0 |
| ACQUIRED | 443 | 457 | 457 | +0 |
| RELEASED | 434 | 447 | 447 | +0 |
| COOLDOWN | 176 | 186 | 186 | +0 |
| STALE-LOCK | 9 | 10 | 10 | +0 |
| STALE-TICKET | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 434 | 447 | 447 | +0 |
| Đang giữ cuối log (naive) | 0 | 1 (t4) | 1 (t4) | +0 |
| Double-acquire | 9 | 9 | 9 | 0 mới |

- **Giải thích "đang giữ = 1" (naive):** analyzer đếm
  ACQUIRED chưa có RELEASED sau đó. ACQUIRED 457 −
  RELEASED 447 = 10 ACQUIRED chưa release. Cả 10 đều
  có dòng STALE-LOCK tương ứng: 9 ca double-acquire cũ
  (đã giải thích các đợt trước) + 1 ca mới t4 15:01:45Z
  (STALE-LOCK #10 lúc 16:31:32Z đã reclaim — §2).
  **Số đang giữ HIỆU DỤNG = 0** (không holder nào còn
  sống tại cuối log; lock TRỐNG lúc mở và lúc đóng —
  status xác nhận độc lập, §2).
- **STALE-LOCK #10 KHÔNG tạo double-acquire thứ 10:**
  ACQUIRED của t8 sau dòng STALE-LOCK (cùng giây
  16:31:32Z) — analyzer chỉ ghi double-acquire khi
  ACQUIRED mới xảy ra trong lúc holder cũ còn "active"
  theo máy trạng thái của nó, và dòng STALE-LOCK đã
  xóa trạng thái holder trước. Đây là hành vi đúng của
  cơ chế reclaim, không phải thiếu sót đếm.
- **0 double-acquire mới** kể từ T6-155 đóng.
  0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới
  (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt 150),
  0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`khong-nha-grep.txt` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ, VỚI 1 SỰ
  KIỆN REBOOT-GIẾT-HOLDER ĐẦU TIÊN ĐÃ ĐƯỢC XỬ LÝ ĐÚNG.**
  Giữ/nhả đúng lúc mở và lúc đóng (13 chu kỳ mới sạch
  kể từ T6-155 đóng + 1 reclaim sạch sau #50), 0 zombie
  lúc đóng, 0 stale mới trong phiên, queue 0 ticket, log
  nhất quán (447 cặp + 0 đang giữ hiệu dụng, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của
  T6-132), 0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên
  lock thật đợt 148–156 (toàn đợt) và đợt 156 (tới
  ~17:54Z), suite 9/9 ×6 lần (T7 (A) xanh cả 6 — xem
  §6), và thứ tự ghi mới đã có **181 chu kỳ thật**
  chứng minh (§3).
  **Không còn caveat nào về mất dòng RELEASED cho các
  chu kỳ mới** — caveat cũ chỉ còn là 1 dòng lịch sử
  (t4, §3–§4 T6-136). Caveat mới duy nhất: **reboot
  #50 giết holder t4** — nhưng cơ chế STALE-LOCK đã
  reclaim đúng (không kẹt, không mất lock); T2-156 lưu
  ý khi làm mù #82?/#83? (holder t4 chết theo #50 đã
  được T4-155 báo từ phía attempt; nay T6 xác nhận độc
  lập từ log lock).
  Lưu ý khác trong phiên: **vite pid 4627 + pid 4607 +
  4 socket X11 của luồng khác chạy lúc T6 đóng** (xem
  §1) — không acquire lock nào trong cửa sổ T6 (diff
  log RỖNG); T10-156 lưu ý khi đối chiếu log (+52 dòng
  kể từ T6-155 đóng đều là của T4-155/T8-155, không
  phải của suite/harness T6).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155 §6.2. File khối T7 đã trích
  `t7-block-a156.sh` md5 **`dc973443030249a262ff63cbc62231d5`**
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154 và 155 (cùng md5). Harness đợt này chạy đúng code (A) trong
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
  Script lock v2 KHÔNG đổi (`520b8baa`). T6 không đổi
  gì trong phiên (chỉ xóa 1 file cooldown theo luật
  prune đã phê duyệt — §7; không đụng code).
- `bash -n` harness t7-control-a156.sh: OK (bản sao của
  t7-control-a155.sh, chỉ đổi hậu tố a155 → a156 + sửa
  comment "đợt 155" → "đợt 156", diff kiểm chứng khớp).
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151/152/153/154/155 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ sáu liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(17:43:03–17:46:16Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 36/29/31/27/
32/29 s — chậm hơn đợt 155 (21–22 s/lượt), xem §1: boot
#52 lạnh + các luồng đợt 156 khởi động dần trong phiên;
vẫn xanh cả 6, không có FAIL nào ở bất kỳ khối nào).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
không tăng dòng nào trong 6 lượt chạy (diff mở/đóng
RỖNG, §4; không phải của suite T6).
- Lưu ý thao tác (F-156-T6-1): lần chạy đầu dùng
  `/usr/bin/time` — binary không tồn tại nên rc=127 ×6,
  suite chưa chạy; đã chạy lại không dùng `time`, 6/6
  xanh. Log run1…run6 trên đĩa là của lần chạy lại tốt.

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round156-t6/t7-control-a156.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot 5353ed19 (#52 ứng
viên, btime 17:19:09Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a156.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154 và 155; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a156-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 511 ms, max 3483 ms, trung bình 1857,95 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~6'50" (17:46:22–17:53:12Z),
  dưới tải hệ thống tăng dần (vite + Xvfb của luồng
  khác khởi động giữa phiên — xem §1).
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

- **Kết luận: (A) VẪN XANH sau năm đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ sáu liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 720/720 dưới churn qua 6 đợt). Chú thích tỉ lệ
  (như T6-150/151/152/153/154/155): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 5 (đợt 155) → **6 (đợt
  156 — lần thứ sáu xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 37 (đợt 155) → **38 (đợt 156,
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
  - 17:38Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-155 thêm `cooldown-t8-round155`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt`) — điều (a) không
    kích hoạt.
  - Lock TRỐNG ngay từ lúc mở (17:38:xxZ) và vẫn TRỐNG
    lúc kiểm tra lại trước khi prune (17:54:19Z,
    `status-before-prune.txt`) — điều (e) thỏa ngay,
    **không phải chờ như đợt 151** (đợt 151 T4-151 giữ lock giữa phiên nên prune phải chờ).
  - 17:54:19Z: điều (b) KÍCH HOẠT: tổng vẫn 101 > 100 →
    xóa 1 file cũ nhất tới khi còn 100. File cũ nhất:
    **`cooldown-s3-round116`, mtime 2026-11-14T22:10:36Z,
    139,73h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round ~116; xem §12
    F-149-T6-3).
  - **Kết quả prune đợt 156 (lần 31): 1 file đã xóa
    (`cooldown-s3-round116`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (17:38Z) **101 file / 1414 byte**;
  lúc prune (17:54:19Z, trước khi xóa) **101 file /
  1414 byte** (log lock 1585 dòng — +0 dòng trong phiên,
  không file cooldown mới, xem §2/§4);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  đóng (~17:54Z) vẫn **100 file / 1400 byte**. Số học
  khớp: 101 + 0 = 101 ✓ (0 file cooldown mới trong
  phiên T6), rồi 101 − 1 = 100 ✓ (1 file prune). Không
  file nào bị xóa hay thêm ngoài 1 file prune giữa hai
  lần đếm của đợt này. Số học từ T6-155 đóng: 100 + 1
  file mới (`cooldown-t8-round155`) = 101 ✓ — khớp đúng số T10-155 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 62 file; ≥48h (`-mtime +1`): 76
  file**. Sau prune (17:54Z): **≥192h: 0 file; ≥72h:
  61 file; ≥48h: 75 file** — ≥72h giảm 62 → 61 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-s10-round116`, mtime 2026-11-14T22:59:19Z —
  lúc 17:54Z mới **~138,9h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 62, tăng từ 60 lúc
  đóng đợt 155 — dù prune 30 đã xóa 1 file ≥72h — vì
  2 file khác đã vượt ngưỡng 72h trong khoảng giữa 2
  đợt; khớp số học, không phải mâu thuẫn. ≥48h lúc mở
  76, tăng từ 74 lúc đóng đợt 155 — cùng lý do, 2 file
  vượt ngưỡng 48h giữa 2 đợt.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ bảy liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt này xóa
  `cooldown-s3-round116` trước khi nó đủ 7 ngày — nó đủ 7 ngày theo đồng hồ
  tường vào khoảng **21/11 22:10Z** nhưng đã bị xóa ở
  đợt 156). T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
- **Prune lần 32 (T6-157): tổng lock 100 sau prune 31 —
  kiểm lại lúc mở đợt 157** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-156; #50 GIẾT holder t4; #51/#52 KHÔNG giết holder

- Boot duy nhất trong phiên: **5353ed19** (btime
  17:19:09Z = epoch 1795195149). T6 **KHÔNG chứng nhận**
  số hiệu reboot #52 (thuộc T0-156/T2-156; số hiệu #51
  đã XÁC NHẬN theo quyết parent (d) đợt 155).
- Uptime boot lúc đóng ~35'. `journal --list-boots`
  chỉ 1 dòng 5353ed19 (first entry 17:19:25Z) — journal
  đã xoay, chỉ còn boot hiện tại; T6 không xác minh
  được #51 từ journal (không cần — số hiệu #51 đã có
  từ quyết parent). **KHÔNG có reboot mới lúc đóng**
  (kiểm ~17:53Z, boot_id giống lúc mở).
- Reboot #50 (btime 15:04:07Z) xảy ra giữa phiên đợt 155,
  142 s sau khi t4 acquire — **GIẾT HOLDER t4** (§2);
  T4-155 đã báo attempt2 bị #50 giết, T6 xác nhận độc
  lập từ log lock. Reboot #51 (17:05:29Z) và #52 ứng
  viên (17:19:09Z) xảy ra sau chu kỳ lock cuối 16:54:37Z
  — không giết holder nào (§2).

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-156
  (LIMITS này) — xem §10.
- Lock lúc đóng: TRỐNG, 0 ticket + 100 cooldown (sau
  prune), log 1585 dòng thô / 1579 dòng chính thức,
  447 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round156-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND156_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round156-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 156 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 156 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (chỉ T6 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–156 tạm tính: **439 batch
  / 847 entry** (438/846 đợt 155 + 1/1 đợt 156 — số file
  duy nhất do T10 đếm dedup toàn cục; T6 không tự cộng
  tay vào lũy kế file).

## 11. GHI CHÚ CHO T10-156 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ sáu liên tiếp, tổng 720/720 qua 6
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 5 → 6 (lần thứ sáu xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 37 → 38 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (447 cặp, 0 giữ hiệu dụng,
  0 TIMEOUT mới); prune lần 31 xóa 1 file, queue về đúng
  trần 100.
- **MỚI — reboot #50 GIẾT HOLDER t4 (xác nhận độc lập
  từ log lock):** t4 acquire 15:01:45Z pid 55022, #50
  btime 15:04:07Z, STALE-LOCK + reclaim 16:31:32Z bởi
  t8-round155 (tuổi 5387 s khớp đúng). Đây là reboot
  đầu tiên giết holder trong hồ sơ T6; cơ chế STALE-LOCK
  đã xử lý đúng (không kẹt, không double-acquire mới).
  T2-156 lưu ý khi làm mù #82?/#83?.
- **Reboot #51 + #52 ứng viên KHÔNG giết holder** (chu
  kỳ cuối 16:54:37Z, trước #51 10m52s, trước #52 24m32s).
  Số hiệu #52 giao T2-156 xác nhận.
- 0 zombie lúc mở và lúc đóng; vite pid 4627 + pid 4607 +
  4 socket X11 của luồng khác chạy lúc T6 đóng — không
  acquire lock nào trong cửa sổ T6 (diff log RỖNG);
  T10-156 lưu ý khi đối chiếu log (+52 dòng kể từ
  T6-155 đóng đều là của T4-155/T8-155, không phải của
  suite/harness T6).
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #74?/
  #75?/#76? ĐÓNG theo quyết (c) đợt 155 — CERT76/FULL91
  thành số chính thức; #77? VẪN MỞ; #81? GIỮ MỞ theo
  quyết (b) đợt 155; mù #82?/#83? giao T2-156; birefnet
  0 thử lần 9; u2net là fallback chính thức).
- Cờ `round156-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-156 (F-156-T6-n)

- **F-156-T6-1 — Lần chạy suite đầu dùng `/usr/bin/time`
  không tồn tại (rc=127 ×6, suite chưa chạy).** Lệnh
  `/usr/bin/time -f … bash test-vite-lock-v2.sh` báo
  "No such file or directory" cho cả 6 lượt; T6 phát
  hiện ngay từ rc=127 + log trống và chạy lại không
  dùng `time` (đo wall bằng `date +%s`), 6/6 xanh.
  Không ảnh hưởng kết quả (log run1…run6 trên đĩa là
  của lần chạy lại tốt; wall 36/29/31/27/32/29 s ghi
  từ lần chạy lại). Bài học: kiểm tra binary `time`
  tồn tại trước khi dùng trong loop (đợt 155 dùng
  wall ~21–22 s nhưng không ghi rõ đo bằng gì — T6-156
  ghi rõ phương pháp đo).
- **F-156-T6-2 — Đường dẫn lock status gõ sai lúc mở
  (`…/round156-t6/../../repo-1/…` không tồn tại).**
  Đã chạy lại bằng đường dẫn tuyệt đối đúng, status
  TRỐNG rc=0. Không ảnh hưởng kết quả.
- **F-156-T6-3 — Lệnh kiểm tiến độ harness quên `cd`
  nên đường dẫn tương đối `t7-a156-churn.log` sai
  ("No such file").** Đã chạy lại bằng đường dẫn tuyệt
  đối; tiến độ thực lúc đó 87/120 PASS, 0 FAIL.
  Không ảnh hưởng kết quả (chỉ là lệnh đọc).
- **F-156-T6-4 — Kill 2 lệnh `find ~/workspace` nền
  của chính T6** (proc_cb717e851ab1, proc_74e2fcd111e8)
  sau khi đã lấy được đường dẫn suite cần tìm (find
  toàn workspace quá chậm do cây lớn). Kill có chủ đích,
  không ảnh hưởng kết quả; không kill process luồng khác.
- Lưu ý phương pháp (không phải sai số): `md5-open.txt`
  ghi lại các hash đã đo bằng `md5sum` lúc mở (~17:40Z,
  xem log phiên); `md5-close.txt` đo lại từ đĩa lúc
  đóng — hai bản khớp từng hash.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a156-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round156-t6/appendix-numbers.txt` giữ bản
trích gốc:

```
churn: n_runs=120 pass=120 fail=0
churn delay_ms: min=511 max=3483 mean=1857.95
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
md5 t7-block-a156.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=457, COOLDOWN=186, RELEASED=447, STALE-LOCK=10, STALE-TICKET=1, TICKET=468, TIMEOUT=10, total=1579
cleaned-open pairs ACQUIRED->RELEASED: 447
cleaned-open still held at end of log: 1 -> {'t4': ('2026-11-20T15:01:45Z', 1529)}
cleaned-close counts: TOTAL: ACQUIRED=457, COOLDOWN=186, RELEASED=447, STALE-LOCK=10, STALE-TICKET=1, TICKET=468, TIMEOUT=10, total=1579
cleaned-close pairs ACQUIRED->RELEASED: 447
cleaned-close still held at end of log: 1 -> {'t4': ('2026-11-20T15:01:45Z', 1529)}
raw log lines open: 1585
raw log lines close: 1585
queue files now (pre-prune): 101 bytes=1414; post-prune: 100 files bytes=1400
KHONG-NHA lines in raw log: 0
```

---
**Batch stage / Tổng batch:** T6-156: 1 batch / 1 entry / 1 file. Đợt 156 tới lúc T6 đóng (tạm tính): 1 batch / 1 entry. Lũy kế 111–156 (tạm tính, T10 đếm lại dedup toàn cục): 439 batch / 847 entry. Tổng batch chờ user push (đợt 136–156, tạm tính): 191 batch / 269 entry (190/268 đợt 155 + 1/1 đợt 156 — số file duy nhất do T10 đếm dedup toàn cục).
