# PHASE9 ROUND150 T6 — TRIỂN KHAI (B) XONG NHƯNG KIỂM CHỨNG ÂM TÍNH: (B) MONG MANH HƠN BẢN CŨ TRƯỚC CHURN (2/30 vs 13/30) — (A) MỚI LÀ BẢN CHỐNG CHURN THẬT (30/30) + lock KHỎE + prune lần 25: XÓA 1 FILE (điều (b) kích hoạt) + reboot #40 — LIMITS

- Đợt: 150, luồng T6 (triển khai sửa T7 flaky theo phương án (B) + sức khỏe
  lock vite v2 + prune).
  Lượt cron 06:35 +07 20/11/2026 (= 23:35:51Z 19/11). Chạy
  23:41:xxZ → 00:00:57Z 19–20/11/2026, toàn bộ trên một boot duy
  nhất e9295700 — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (1) triển khai sửa T7 flaky theo phương án (B)
  parent đã chọn (quyết parent §12.3(g) đợt 149; nợ §11.9/§11.16
  aggregate đợt 149); (2) lock health; (3) prune lần 25; (4) chuỗi
  "xanh kép" T7 tính lại từ đợt 150 = 0, chuỗi suite xanh về bản chất
  giữ 31 lần.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§6): (B) đã triển khai đúng như quyết
  (suite md5 `63a25be3`), chạy kiểm chứng đầy đủ (6 lượt suite 9/9 +
  120 lần chạy kiểm soát khối T7) — NHƯNG kiểm chứng ÂM TÍNH: dưới
  cùng một churn bơm vào, (B) chỉ PASS 2/30, bản cũ PASS 13/30;
  phương án (A) thử trong harness đạt 30/30. (B) KHÔNG sửa được flaky
  — về mặt lý thuyết điều kiện PASS của (B) chặt hơn bản cũ nên nó
  fail mọi trường hợp bản cũ fail, cộng thêm các trường hợp mới.
  T6 KHÔNG tự đổi sang (A) (brief chỉ cho (A) làm dự phòng khi (B)
  khó triển khai — (B) triển khai được; việc chọn lại thuộc parent).
  Code (B) vẫn nằm trong suite như đã quyết; parent cần quyết lại
  ở §12 đợt 150.**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa script lock
  (bản `520b8baa` giữ nguyên), KHÔNG sửa `vcut-poll-quiet-v2.sh`
  (bản `1710e480` giữ nguyên) — chỉ sửa khối T7 trong
  `test-vite-lock-v2.sh`. Không sửa preview.tsx (530e10a7 giữ vĩnh
  viễn — chỉ đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round150-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  time-open.txt, time-close.txt, wc-open.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-raw-close.log, analyze-log.py,
  analyze-log-cleaned-close.txt, prune-candidates.txt,
  prune-deleted.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log … run6.log, repro-newmsg-fixed150.sh,
  repro-newmsg.log, t7-control.sh, t7-control-a.sh,
  t7-control-new-steady.log, t7-control-new-churn.log,
  t7-control-old-churn.log, t7-control-old-steady.log,
  t7-control-a-churn.log, md5-open.txt, md5-close.txt).
  Ghi chú: status lock lúc mở/đóng KHÔNG lưu thành file riêng
  đợt này (chỉ ghi trong LIMITS §2/§7 + output phiên) —
  khác mẫu T6-149; raw-open không có file riêng vì log
  không thêm dòng nào trong phiên (raw-close = raw-open,
  1362 dòng cả hai).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI e9295700 (reboot #40, btime 23:32:09Z); lock TRỐNG; queue 101 file

- **Boot lúc mở và lúc đóng: boot_id
  `e9295700-bda0-4a9b-8aab-4dd57661212e`, btime 23:32:09Z
  theo /proc/stat** (epoch 1795131129; `uptime -s` =
  23:32:09; `journal --list-boots` chỉ 1 dòng e9295700,
  first entry 23:32:25Z). Uptime ~9' lúc T6 bắt đầu
  (23:41Z), ~28'48" lúc đóng (00:00:57Z). Đây là boot
  sau **reboot #40 (802f358f → e9295700)** — xảy ra
  TRƯỚC phiên T6 (23:32:09Z, trước khi đợt 150 mở
  23:35:51Z). Gap danh nghĩa 802f358f→e9295700 =
  1795131129 − 1795123431 = **7.698 s** (btime stat trừ
  btime stat) — **T6 KHÔNG chứng nhận** (thuộc T2-150;
  xem §8). Số hiệu boot #116? TẠM (đếm chặt: 70025d3e =
  #114?, 802f358f = #115?, e9295700 = #116?).
- **Đợt 150 mở 23:35:51Z** (sched 23:35:51Z) — tức
  **3'42" sau btime boot e9295700 (23:32:09Z)**.
  T6 mở ~23:41Z (9' sau btime).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, poll
  `1710e480`, khớp baseline. Suite test lúc mở `1c0d7eaa`
  (bản cũ, khối T7 chưa sửa). preview.tsx md5 `530e10a7`.
- Các luồng đợt 150 khác: lúc T6 mở đã có thư mục
  round150-t5/t8/t9; trong phiên lần lượt xuất hiện đủ 9
  thư mục t1–t9. Chưa có `.done` nào của đợt 150 lúc T6
  đóng (T6 là cờ đầu tiên của đợt 150 — như đợt 149).
  T4-150/T8-150 chưa acquire lần nào trong phiên T6
  (log lock không thêm dòng nào — xem §2/§11).

## 1. Quét zombie: 0 zombie; 0 vite lúc mở, 0 vite lúc đóng; 3 socket Xvfb mồ côi của T1-150 (0 process Xvfb sống)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 23:41Z
  (mở, `ps-full-open.txt`, 15 dòng) và lúc 00:00:57Z
  (đóng, `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (23:41Z): 0 vite thật đang chạy** — `ss -tlnp`
  trống hoàn toàn (0 cổng lắng nghe); `/tmp/.X11-unix/`
  trống (0 socket). Lock TRỐNG (§2). Đây là trạng thái
  sạch sau reboot #40 + trước khi bất kỳ luồng đợt 150
  nào acquire.
- **Lúc đóng (00:00:57Z): 0 vite thật đang chạy** — `ss`
  trống; lock TRỐNG (§2).
- **Lúc đóng: `/tmp/.X11-unix/` có 3 socket X193/X194/X195**
  (x11-close.txt, mtime 23:57Z) + 3 file lock
  `/tmp/.X193-lock` / `.X194-lock` / `.X195-lock`
  (cùng mtime 23:57Z; nội dung lần lượt PID 34647 /
  34648 / 34649 — **cả 3 PID đều đã chết**, `ps -p`
  không thấy).
- **Chủ sở hữu 3 socket: T1-150 (test xvfb-lock)** —
  `round150-t1-suites.log` ghi: "B. 3 claim song song
  đều lên Xvfb thật — :193:OK, :194:OK, :195:OK" và
  "C. không còn Xvfb nào của test chạy" — test tự xác
  nhận process đã tắt nhưng socket + lock file còn lại
  (cùng mẫu T1-149: suite tự tạo 3 socket, T10 dọn tay
  lúc đóng). **T6 không dọn socket của luồng khác**
  (không phải phạm vi T6) — ghi rõ chủ sở hữu để T1-150
  (hoặc T10-150 lúc đóng) dọn; T6 đợt sau kiểm lại
  `/tmp/.X11-unix/` còn sót không.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-150).
  Inotify: `max_user_watches` = **63747** lúc đóng
  (khớp đợt 147/148/149 — không có lần flip mới trong
  phiên T6; chuỗi flip-flop 63.747 → 63.756 → 63.747 qua
  3 boot giữ nguyên; quyết parent (m) đợt 146: ghi làm
  chú thích, không hành động).

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; 13 chu kỳ hoàn tất + 1 acquire bị reboot #39 giết (đã phục hồi bằng STALE-LOCK) kể từ T6-149 đóng

- **Lúc mở (23:41Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc đóng (00:00:57Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 100 cooldown`
  (sau prune 1 file — xem §7), rc=0.
- **Log lock +52 dòng kể từ T6-149 đóng** (raw 1310 lúc
  21:04:40Z → 1362 lúc T6-150 mở; bản thô lúc mở = bản
  thô lúc đóng của T6-149 cộng 52 dòng — xem
  `vite-lock-v2-raw-close.log`): **tất cả 52 dòng đều
  là t8-round149 (O8, chạy sau khi T6-149 đóng)**:
  14 TICKET / 14 ACQUIRED / 13 RELEASED / 10 COOLDOWN /
  1 STALE-LOCK (xem §4). **0 dòng mới trong phiên T6**
  (raw vẫn 1362 lúc đóng) — chưa luồng đợt 150 nào
  acquire.
- **13 chu kỳ hoàn tất của t8-round149** (21:15:27Z–
  21:46:39Z, holds 152 / 71 / 130 / 0 / 10 / 10 / 10 /
  60 / 120 / 231 / 80 / 130 / 240 s — hold 0 s là chu
  kỳ phục hồi sau STALE-LOCK, xem dưới). **1 acquire
  KHÔNG có RELEASED: t8-round149 acquire 21:22:05Z**
  (cổng 5490) — holder bị **reboot #39 (21:23:51Z)
  giết**; acquire tiếp theo 21:25:58Z phát hiện
  STALE-LOCK (dòng 1320 bản đã lọc: "owner pid 59445
  chết + không vite trên cổng 5490 + curl 000 + boot
  đổi (tuổi 233s)") rồi acquire lại và release hold 0 s.
  Đây là ca double-acquire thứ 7 (mới — xem §4,
  F-150-T6-2). Phục hồi sạch, đúng cơ chế.
- **Không lock nào còn giữ sau reboot #40:** dòng log
  cuối cùng 21:46:39Z là RELEASED (t8-round149);
  lock đã TRỐNG từ 21:46:39Z, qua reboot #40
  (23:32:09Z), và vẫn TRỐNG lúc T6 mở/đóng. Không có
  ACQUIRED nào bị reboot #40 giết (không có holder
  nào lúc đó).
- **File cooldown mới duy nhất kể từ T6-149 đóng:
  `cooldown-t8-round149`** (mtime 21:46Z) — đưa tổng
  queue từ 100 lên 101, kích hoạt điều (b) ở prune lần
  25 (§7). File `cooldown-t4` mtime 21:03:36Z (release
  attempt3 của t4-149 — ghi đè, không phải file mới).
- **T10-150 chưa mở lúc T6 đóng** — T6 đợt sau kiểm md5
  bản frozen khi T10 chuẩn bị.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 132 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 13 chu kỳ mới kể từ
  lúc T6-149 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4;
  cộng 1 acquire bị reboot giết đã phục hồi bằng
  STALE-LOCK).
  - Cộng với 119 chu kỳ T6-149 đã đếm = **132 chu kỳ
    liên tiếp sạch trên thứ tự mới** (119 đợt 149 + 13
    đợt này).
  - Bằng chứng phiên bản: T8-149 dùng script repo (lock
    holder ghi `boot=70025d3e` trong status — script mới;
    các acquire 21:15–21:46Z đều trên boot 70025d3e).
- **Chỉ đổi duy nhất đợt này là khối T7 trong suite test**
  (`test-vite-lock-v2.sh` md5 `1c0d7eaa` → `63a25be3` —
  xem §6). Script lock và poll không đổi.

## 4. Nhất quán log lock: 1356 dòng chính thức lúc đóng, 388 cặp, 0 đang giữ, 1 double-acquire MỚI (t8-round149, reboot #39 — đã giải thích), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
diff: bản đã lọc = raw trừ đúng 6 dòng đó, diff exit 0).
Bản đã lọc lúc đóng: **1356 dòng** (raw 1362) — **+52 dòng
kể từ T6-149 đóng** (t8-round149, §2). **KHỚP ĐÚNG số
T6-149 đếm lúc đóng cộng thêm 13 chu kỳ hoàn tất + 1
acquire bị reboot giết** — ba nguồn độc lập đồng thuận
về số lúc mở (T6-149 đóng 1304 chính thức + 52 dòng
phần còn lại đợt 149 = 1356 lúc mở đợt này; xem bảng).

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-149 (1304) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 406 | 392 | 315 | 309 |
| ACQUIRED | 395 | 381 | 313 | 307 |
| RELEASED | 388 | 375 | 310 | 304 |
| COOLDOWN | 149 | 139 | 141 | 136 |
| TIMEOUT | 10 | 10 | **2** | 2 |
| STALE-LOCK | 7 | 6 | **2** | 2 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **1356** | **1304** | **1083** | **1060** |

- So với snapshot T6-149 đóng (1304 dòng): **+52 dòng =
  TICKET +14 / ACQUIRED +14 / RELEASED +13 / COOLDOWN +10 /
  TIMEOUT +0 / STALE-LOCK +1** — đúng bằng 13 chu kỳ hoàn
  tất + 1 acquire bị reboot giết (chỉ có TICKET +
  ACQUIRED, không RELEASED — phục hồi bằng 1 event
  STALE-LOCK) + 10 event COOLDOWN (t8-149: 10 event cho
  13 chu kỳ — 3 chu kỳ đầu không ghi event COOLDOWN
  mới vào log vì release ghi đè file đã có; xem chú
  thích COOLDOWN ở T6-149 §4). Mọi chu kỳ đều sạch,
  ghép cặp đủ — khớp từng con số, không có event nào
  mất dấu hay thêm lạ.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 1356 dòng): **388 cặp ACQUIRED→RELEASED;
  0 "đang giữ"** — lock trống lúc đóng (§2). Chênh
  ACQUIRED − RELEASED = 7 = **7 ca double-acquire**
  (6 ca cũ đã biết + 1 ca mới t8-round149, xem dưới).
  Dòng 869 t4 mồ côi (F-134-T6-2) vẫn nằm trong 7 ca
  này (là prev-ACQ của double-acquire dòng 888);
  KHÔNG phải lock kẹt. 0 lần RELEASED không có
  ACQUIRED trước đó.
- 7 ca "double-acquire" trong output analyzer — **6 ca cũ
  đã biết** (s3-round116, t3-round117, t4, t3-round119,
  t8-round129 dòng 781, t4 dòng 888/02:50:57Z) + **1 ca
  MỚI: t8-round149 dòng 1321 (21:25:58Z, prev ACQ
  21:22:05Z dòng 1318)** — giải thích được bằng
  STALE-LOCK cướp sau reboot #39 (F-150-T6-2).
  **Không có ca nào khác.**
- 10 TIMEOUT (8 cũ từ trước đợt 120 + **2 t1-147**) —
  **0 TIMEOUT mới** kể từ T6-149 đóng.
  STALE-LOCK mới duy nhất là đợt 149 (do reboot #39
  giữa lượt).
- Cửa sổ R120: **315 = 313 T/A + 2 TIMEOUT, RELEASED 310**
  (chênh T/A−R = 3 = 1 ca reboot-kill đợt 129 + 1 ca t4
  đợt 134 + 1 ca t8-round149 đợt 149), TIMEOUT 2,
  STALE-LOCK 2 (đợt 130 + đợt 149).
- Đếm loại event trên toàn log chính thức:
  406+395+388+149+10+7+1 = 1356 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 149 khép lại trên lock (toàn đợt): 16 chu kỳ sạch**
  — 3 trong phiên T6-149 + 13 sau khi T6-149 đóng
  (t8-round149 O8 ×13) + 1 acquire bị reboot #39 giết
  đã phục hồi — T6 đợt này đếm bổ sung bằng TICKET
  từng chu kỳ, khớp đúng recount T10-149 (T10-149 ghi
  lock TRỐNG lúc đóng — khớp).
  **Đợt 150 tới 00:00:57Z có 0 chu kỳ** (chưa luồng nào
  acquire) — T6 đợt 151 đếm tiếp. Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 148 (toàn đợt), đợt 149 (toàn đợt) và đợt 150 (tới 00:00Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round148-t*/` + `round149-t*/` (toàn đợt)
+ `round150-t*/` (tới 00:00Z) — theo quy tắc lăn: bỏ
round147, thêm round150 (phần còn lại sau T6-149).
**Phương pháp đếm đợt này: grep ra file /tmp trước,
`--exclude='khong-nha-grep.txt'` (LOẠI MỌI file
grep-output, không chỉ file của mình — xem F-150-T6-3)
NGAY từ lần đầu + KHÔNG loại file repro theo basename
(bài học F-144-T6-3), trừ tay 3 dòng repro của chính
mình sau khi đếm** (theo bài học F-142-T6-2).
**Lưu ý phương pháp:** pattern grep có dấu (`KHÔNG NHẢ` /
`BỎ QUA release thừa`) — các file `.done` của T6 viết bằng
ASCII không dấu (`"KHONG NHA"`) nên KHÔNG khớp pattern này.
Tổng **6 dòng khớp, phân loại đủ 6/6 — tất cả đều là log
repro trên /tmp, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Tái hiện có kiểm soát trên /tmp | 6 | `round148-t6/repro-newmsg.log` (3) + `round149-t6/repro-newmsg.log` (3) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Bản sao script (không phải sự kiện) | 0 | Không file script nào trong phạm vi khớp (round147-t1 đã bỏ khỏi phạm vi lăn) |
| Trích dẫn trong tài liệu | 0 | Không file `.done` nào trong phạm vi khớp pattern có dấu |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 148 (toàn đợt) / 149 (toàn đợt) / 150 nào |
| Round150-t* (trừ repro /tmp của T6) | 0 dòng | T10-150 chưa mở; chưa luồng 150 nào có driver log khớp |

- **Repro đợt này (chưa đếm, đếm ở đợt 151):**
  `round150-t6/repro-newmsg.log` 3 dòng (2 `BỎ QUA` +
  1 `KHÔNG NHẢ`) trên /tmp — xem §6.2.
- **Số học lăn kiểm lại:** T6-149 đếm 8 dòng (2 script
  round147-t1 + 3 repro round147-t6 + 3 repro
  round148-t6); đợt này bỏ round147 (−2 script −3 repro
  = −5) + thêm round149-t6 repro (+3) = **6 dòng** ✓
  khớp đếm tươi.
- **Tổng trên lock thật: đợt 120 = 0 … đợt 148 (toàn đợt)
  = 0, đợt 149 (toàn đợt — bổ sung 13 chu kỳ sau
  T6-149 đóng, §4) = 0, đợt 150 tới 00:00Z = 0.**
  Khớp với log pairing sạch ở §4 (388 cặp + 1 ca
  reboot-kill mới đã giải thích + 0 đang giữ — không
  liên quan nhánh release).
- Giới hạn phạm vi: T4/T8/T10-150 chưa chạy xong tới
  00:00Z — nếu có sự kiện mới sau thời điểm đếm thì
  thuộc đợt 150, T6 đợt 151 đếm tiếp. T6 không quét toàn
  cây hidden_files (lý do như T9 đợt 120 §8).
- **F-150-T6-3 (mới — bẫy phương pháp, đã bắt được trước
  khi ghi):** lần grep đầu trả **27 dòng** vì các file
  `khong-nha-grep.txt` CŨ (của T6-148/T6-149) nằm trong
  thư mục được quét và tự khớp pattern — cùng họ
  F-142-T6-2 nhưng ở cấp lồng nhau (file grep-output
  của đợt trước, không phải của mình). T6 đã chạy lại
  với `--exclude='khong-nha-grep.txt'` (loại MỌI file
  cùng tên) → đúng 6 dòng, khớp số học lăn. Bài học
  cho T6 sau: exclude theo TÊN FILE, không theo đường
  dẫn file của mình.

## 6. TRIỂN KHAI (B) + KIỂM CHỨNG: ĐÃ TRIỂN KHAI ĐÚNG QUYẾT — NHƯNG KIỂM CHỨNG ÂM TÍNH (F-150-T6-1)

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro + control chạy trên lock dir /tmp riêng,
cổng 599x, không đụng lock thật. Boot ghi trong status
repro: boot e9295700 (reboot #40).

### 6.0 Đổi gì trong suite (duy nhất khối T7)

File `apps/web/scripts/test-vite-lock-v2.sh` md5
`1c0d7eaa` → **`63a25be3`**. Diff chỉ khối T7 (dòng
~144–157): thêm 1 lần poll lấy nền N0 TRƯỚC khi spawn
giả, đọc B1 ở dòng poll thứ 2 (`sed -n '2p'`), B2 ở
dòng cuối (`tail -1`), assert mới `B1−N0=1 VÀ B2−N0=0`
thay cho assert cũ `B1−B2=1`. `vcut-poll-quiet-v2.sh`
KHÔNG đổi (`1710e480`); script lock v2 KHÔNG đổi
(`520b8baa`). Header comment khối T7 ghi rõ phương án
(B) + quyết parent §12.3(g) đợt 149 + tham chiếu điều
tra T6-149 §6.3–§6.4.

### 6.1 Suite `test-vite-lock-v2.sh`: 6/6 lần 9/9 PASS (T7 mới xanh cả 6 lần)

(`round150-t6/test-v2-t6-run1.log` … `run6.log`,
23:46Z–23:50Z; mỗi lượt ~40 s — chậm hơn ~25 s các
đợt trước do máy tải nặng, các luồng đợt 150 khác đang
chạy vite/WebKit song song):
- **Lần 1–6: PASS=9 FAIL=0, rc=0 cả 6 lần.** T7 (B):
  `nền N0=1, giả +1 (B1=2), kill giả về nền (B2=1)`
  cả 6 lần (N0=1 là 1 blocker nền ổn định — wrapper đo
  của chính suite/luồng khác; giả luôn được đếm đúng).
- T1–T6 + T8 xanh cả 6 lần — không có thao tác lock
  nào fail.
- **Kết luận suite: xanh 6/6** — nhưng đây là điều kiện
  nền ổn định (xem §6.3: dưới churn, (B) fail nhiều
  hơn bản cũ).

### 6.2 Repro message ĐÚNG (`round150-t6/repro-newmsg.log`, 23:53:41Z)

Copy verbatim script của T6-149, chỉ đổi tên TDIR
(`vcut-t6r149-repro` → `vcut-t6r150-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–149, kết quả giống hệt:
- A. Double-release (acquire tA → release → release lần 2):
  lần 2 in đúng `BỎ QUA release thừa — lock đã trống...`,
  rc=1; status TRỐNG trước và sau; log repro chỉ có đúng
  1 dòng RELEASED cho tA.
- B. Release khi lock trống từ đầu: cùng câu `BỎ QUA...`,
  rc=1.
- C. Đối chứng — release sai thread trong lúc tH đang giữ:
  `KHÔNG NHẢ — lock đang do 'tH' giữ, không phải 'tX'...`,
  rc=1; status sau đó vẫn hiện owner tH (guard hoạt động),
  rồi release tH sạch rc=0.
- **Bằng chứng đang ở /tmp, không phải lock thật:**
  status trong repro hiện `0 ticket + 1 cooldown` (sau A/B)
  rồi `0 ticket + 2 cooldown` (sau C) — trong khi lock thật
  lúc đó có 100 cooldown; log thật vẫn 1362 dòng thô
  lúc repro chạy và queue vẫn 100 file sau khi repro xong;
  không có file `cooldown-tA/tH/tB` nào xuất hiện trong
  queue thật. **F-132-T6-1 KHÔNG lặp lại.**

### 6.3 Kiểm chứng có đối chứng khối T7 (F-150-T6-1 — KẾT QUẢ ÂM TÍNH, MỚI)

Harness `round150-t6/t7-control.sh`: khối T7 cũ và mới
trích verbatim từ suite, chạy chỉ trên /tmp, không đụng
lock thật. Churn bơm vào (khi bật): 1 process
`WebProcess-churn` (khớp mẫu poll) xuất hiện sau delay
ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng vite/WebKit
của luồng khác khởi động/tắt trong cửa sổ giữa các poll.
Tổng **120 lần chạy kiểm soát** (mới 40+30, cũ 30+20),
cộng thêm 30 lần trial (A) (§6.4). Lưu ý: các lô churn
chạy trong lúc các luồng đợt 150 khác đang chạy
vite/WebKit thật nên N0 dao động 0–3 (churn thật cộng
thêm churn bơm vào) — đó là điều kiện stress, không
phải tỉ lệ flake sản xuất (xem chú thích dưới bảng).

| Lô | Kết quả | Ghi chú |
|---|---|---|
| Mới (B), nền ổn định, 40 lần | **40/40 PASS** (N0=0 B1=1 B2=0 cả 40 lần) | Nền yên tuyệt đối |
| Mới (B), có churn, 30 lần | **2/30 PASS — 28 FAIL** | Chỉ 2 lần PASS (run4/run21, churn bắt đầu sau poll B2 nên không chạm cửa sổ) |
| Cũ, có churn, 30 lần | **13/30 PASS — 17 FAIL** | Cùng harness, cùng phân phối churn |
| Cũ, nền ổn định, 20 lần | **19/20 PASS — 1 FAIL** (run12: B1=1 B2=1, KHÔNG bơm churn — churn thật từ luồng khác của đợt 150) | Bằng chứng trực tiếp flaky vẫn sống trong đợt đông |
| **(A) trial, có churn, 30 lần** | **30/30 PASS** | Xem §6.4 |

- **Breakdown 28 FAIL của (B):** 9 lần chỉ sai B1−N0≠1,
  12 lần chỉ sai B2−N0≠0, 7 lần cả hai sai.
  Breakdown 17 FAIL của bản cũ: B1−B2=0 ×10, =2 ×6,
  =−1 ×1.
- **Lý thuyết (đã chứng minh bằng số, không suy đoán):**
  đặt N0/N1/N2 là nền tại 3 thời điểm poll. Bản cũ PASS
  ⟺ N1=N2 (nền bằng nhau tại 2 poll). (B) PASS ⟺
  N1=N0 VÀ N2=N0 (nền bằng N0 tại cả 2 poll sau). Nếu
  N1≠N2 thì ít nhất một trong N1/N2 khác N0 — tức
  **mọi trường hợp bản cũ FAIL thì (B) cũng FAIL**,
  cộng thêm các trường hợp nền đổi giữa N0 và B1 rồi
  ổn định lại (bản cũ PASS, (B) FAIL). Điều kiện PASS
  của (B) chặt hơn hẳn bản cũ; cửa sổ phơi nhiễm dài
  hơn (~2,5 s từ N0 tới B2 so với ~1,5 s từ B1 tới B2).
  Dữ kiện khớp đúng lý thuyết: dưới cùng churn, (B)
  2/30 vs cũ 13/30 (tỉ lệ PASS 7% vs 43%).
- **Chú thích tỉ lệ (để T10/parent khỏi nhầm):** 28/30
  FAIL là tỉ lệ STRESS (churn bơm vào gần như mọi lần
  chạy) — KHÔNG phải tỉ lệ flake sản xuất của (B). Tỉ
  lệ flake sản xuất của bản cũ là ~2,3%/lần chạy
  (2/87 lần chạy suite, T6-149 §6.4) vì churn hiếm khi
  rơi đúng cửa sổ ~2 s. Điều đo được ở đây là SO SÁNH
  TƯƠNG ĐỐI dưới cùng điều kiện: (B) fail nhiều hơn
  bản cũ ~6 lần về tỉ lệ PASS (7% vs 43%) và về lý
  thuyết không thể fail ít hơn bản cũ. **Kết luận:
  (B) KHÔNG sửa được flaky; nó làm flaky tệ hơn.**
  Hai ca flaky gốc (đợt 148: B1=7 B2=4; đợt 149: B1=3
  B2=3) đều vẫn FAIL dưới (B) nếu chạy lại cùng dữ
  kiện nền (đợt 148: nền giảm giữa N0→B2 phá B2−N0=0;
  đợt 149: nền tăng 1 phá B2−N0=0) — T6 kiểm bằng
  lập luận trên các số đã ghi, không chạy lại quá khứ.
- **Tiền đề của quyết (g) đợt 149 ("(B) bền trước mọi
  churn nền") BỊ BÁC BỎ bằng số đo.** T6 đã triển khai
  (B) đúng như quyết và giữ code (B) trong suite — việc
  chọn lại (giữ (B) / về bản cũ / chuyển (A)) thuộc
  parent, xem §12. T6 KHÔNG tự đổi sang (A) vì brief
  chỉ cho (A) làm dự phòng khi (B) khó triển khai
  (mà (B) triển khai được).

### 6.4 Trial phương án (A) trong harness — 30/30 PASS dưới cùng churn (KHÔNG sửa script repo)

Script `round150-t6/t7-control-a.sh`: đếm CHỈ process
có args chứa marker giả `WebProcess-q4test` (bracket
trick `[W]ebProcess-q4test` + `grep -v grep`, không tự
đếm), assert B1=1 B2=0 — đúng bản chất phương án (A)
(T6-149 §6.5: giới hạn phạm vi đếm về đúng process giả).
Chạy 30 lần với cùng harness churn (delay 0,5–3,5 s,
sống 1,5 s): **PASS=30 FAIL=0**. (A) miễn nhiễm với
churn nền theo thiết kế (không đếm nền nên nền đổi
không ảnh hưởng) — là phương án DUY NHẤT trong ba
phương án có tính chất này. **Đề xuất cho parent:
chọn (A)** — triển khai bằng cách đổi `count_blockers`
trong `vcut-poll-quiet-v2.sh` (hoặc riêng khối T7) sang
đếm marker giả/PID giả; cần quyết parent trước khi sửa
(vì poll dùng chung cho gate cửa yên của T4 — đổi
`count_blockers` ảnh hưởng cả gate, xem chú thích
§12). T6 đợt này KHÔNG sửa poll (chưa có quyết).
- **Kết luận sức khỏe: lock KHỎE.** Giữ/nhả đúng lúc mở
  và lúc đóng (t8-round149 13 chu kỳ sạch + 1 acquire
  bị reboot giết đã phục hồi), 0 zombie, 0 stale mới
  ngoài ca reboot #39 đã giải thích, queue 0 ticket,
  log nhất quán (388 cặp + 1 ca reboot-kill mới đã giải
  thích + 0 đang giữ, 0 mất dấu khác — số chính thức
  đã loại 6 dòng repro lỗi của T6-132), 0 TIMEOUT mới,
  0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 148–149
  (toàn đợt) và đợt 150 (tới 00:00Z), suite 9/9 ×6 lần
  (T7 mới xanh cả 6 — nhưng xem F-150-T6-1: xanh trong
  điều kiện nền ổn định, không phải bằng chứng (B)
  chống churn), repro message xanh, và thứ tự ghi mới
  đã có **132 chu kỳ thật** chứng minh (§3). **Không
  còn caveat nào về mất dòng RELEASED cho các chu kỳ
  mới** — caveat cũ chỉ còn là 1 dòng lịch sử (t4, §3–§4
  T6-136).
  Lưu ý duy nhất trong phiên: **chưa luồng đợt 150 nào
  acquire lúc T6 đóng** — T6 đợt 151 đếm tiếp; và
  **(B) kiểm chứng âm tính (F-150-T6-1)** — cần parent
  quyết lại.

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
  - 23:41Z: lock TRỐNG (điều (e) thỏa ngay từ lúc mở).
    Tổng **101 file** (vượt trần mềm 100 — do T8-149 thêm
    `cooldown-t8-round149`, §2); quét ứng viên mtime >7
    ngày (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng) — điều (a) không kích
    hoạt.
  - Điều (b) KÍCH HOẠT: tổng 101 > 100 → xóa file cũ
    nhất tới khi còn 100. File cũ nhất:
    **`cooldown-s4-w2`, mtime 2026-11-14T21:08:48Z,
    122,7h tuổi lúc xóa** (≥48h — thỏa điều kiện không
    xóa file <48h; không phải file đợt hiện tại hay đợt
    ngay trước — file từ thời round ~116; xem §12
    F-149-T6-3: quy luật "điều (b) xóa file cũ nhất
    TRƯỚC khi nó đủ 7 ngày" nối lại đúng như T6-149 dự
    báo).
  - **Kết quả prune đợt 150 (lần 25): 1 file đã xóa
    (`cooldown-s4-w2`).** `prune-deleted.txt` ghi đúng
    1 dòng.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (23:41Z) **101 file / 1414 byte**;
  **sau prune 100 file / 1400 byte** (100 × 14 = 1400
  khớp; `ls`/`find`/`status` khớp nhau). Số học khớp:
  101 + 0 = 101 ✓ (0 file cooldown mới trong phiên T6),
  rồi 101 − 1 = 100 ✓ (1 file prune). Không file nào bị
  xóa hay thêm giữa hai lần đếm của đợt này (log lock
  +0 dòng trong phiên, §2).
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 50 file; ≥48h (`-mtime +1`): 73
  file**. Sau prune (00:0xZ): **≥192h: 0 file; ≥72h:
  52 file; ≥48h: 72 file** — ≥72h tăng 50 → 52 dù đã
  xóa 1 file ≥72h: 3 file có mtime trong (16/11 23:41Z,
  17/11 00:05Z] vừa đủ 72h trong phiên T6 (đúng quy
  luật tuổi); ≥48h giảm 73 → 72 (xóa 1, 0 file mới đủ
  48h). File cũ nhất còn lại nay là
  `cooldown-s4-w3`, mtime 2026-11-14T21:08:59Z —
  lúc 00:00Z mới **~122,8h tuổi**.
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại**
  sau một nhịp tạm dừng ở đợt 149 (T6-149 dự báo đúng:
  T8-149 thêm file mới → tổng 101 → prune đợt 150 kích
  hoạt (b) và xóa `cooldown-s4-w2` trước khi nó đủ 7
  ngày). File này đủ 7 ngày theo đồng hồ tường vào
  khoảng **21/11 21:08Z** nhưng đã bị xóa ở đợt 150 —
  **lần thứ tư liên tiếp dự báo "đủ 7 ngày" không còn
  đối tượng** (xem F-148-T6-1). T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).

## 8. CHỐT SỐ BOOT — reboot #40 (802f358f → e9295700, btime 23:32:09Z); gap 7.698 s DANH NGHĨA, CHƯA CHỨNG NHẬN; mù mới giao T2-150

### 8.0 Reboot #40 — 802f358f → e9295700, btime 23:32:09Z theo /proc/stat; xảy ra TRƯỚC khi đợt 150 mở

- Boot mới `e9295700-bda0-4a9b-8aab-4dd57661212e`,
  btime **23:32:09Z** theo /proc/stat (epoch 1795131129);
  `uptime -s` = 23:32:09; journal first entry 23:32:25Z
  (boot +16 s). Uptime ~9' lúc T6 mở (23:41Z).
- **Không có mâu thuẫn kiểu F-149-T6-1 đợt này:** lần
  cuối thấy boot cũ còn sống là T7-149 kiểm cuối
  ~22:16Z (đọc DB run 148) < btime mới 23:32:09Z; cờ
  T7-149 đóng ~22:45Z < btime mới. Không có quan sát
  trực tiếp boot cũ nào sau btime mới. **Không có bằng
  chứng nhảy clock tại #40 từ phía T6** (việc của
  T1/T5-150).
- **Gap danh nghĩa 802f358f→e9295700 = 7.698 s**
  (1795131129 − 1795123431, btime stat trừ btime stat)
  — **T6 KHÔNG chứng nhận, KHÔNG dùng làm số liệu
  chuỗi** (cần T2-150 merged mù #71?/#72? + kiểm
  clock; tiền lệ đợt 149: cả hai số danh nghĩa 390 s /
  1.171 s đều sai so với giờ thực).
- **Số hiệu (TẠM, đếm chặt):** 70025d3e = #114?,
  802f358f = #115?, **e9295700 = #116?**; reboot
  802f358f→e9295700 = **sự kiện #40** (theo định nghĩa
  gộp §10.2 đợt 133 — mỗi lần đổi boot_id là 1 sự
  kiện). Chờ T2-150 xác nhận.
- **Quan sát phụ cho T5-150:** `/var/log/dpkg.log`
  có entry `startup packages configure` lúc **23:35:42Z**
  (btime+3'33") — mốc để T5 đối chiếu replay boot
  e9295700 (T5-149: replay boot 70025d3e khởi động muộn
  +35m05s; mốc này thuộc T5-150, T6 không kết luận).

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI

- Trạng thái đông cứng từ T6-119 §2.3: khoảng
  **11:39:50Z → 23:45:17Z ngày 15/11 (12h05'27")**,
  **A+D đóng, B+C mở** (2 cửa sổ mở, tổng ~9h48'14"),
  **tối đa 29 reboot ẩn**. Parent đã **chấp nhận để mở**
  (QUYẾT PARENT 7 đợt 119) — T6 KHÔNG thử đóng lại.
  Ngày đúng là **15/11** (F-131-T6-1).

### 8.2 Chuỗi boot quan sát được — thêm 802f358f (#115?) + e9295700 (#116?); các boot #102?→#114? giữ nguyên theo T6-149 §8.2

- Bảng 10 boot cuối của T6-149 (§8.2) giữ nguyên, cộng
  thêm 2 hàng mới:

| # (tạm, đếm chặt) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #114 | 70025d3e | 20:00:33Z 19/11 | 4.998 s (gap #39 danh nghĩa — chờ T2-150 chứng nhận; xem T7-149 §2.6) | T6-149 §8 + T7-149 §2.6 |
| #115 | 802f358f | 21:23:51Z 19/11 | 7.698 s (gap #40 danh nghĩa — KHÔNG CHỨNG NHẬN, xem §8.0) | T7-149 §2.6 (btime stat 21:23:51Z / proc/1 21:24:01Z) + T6 này (gap trừ) |
| #116 | e9295700 | 23:32:09Z 19/11 | đang sống | T6 này (brief + uptime/journal//proc/1, mở + đóng) |

- **Ghi chú:** tuổi thọ 802f358f 7.698 s là DANH NGHĨA
  theo btime /proc/stat — nếu có nhảy clock tại #40
  thì tuổi thọ thật khác (T2-150 xác định). Boot
  1d610e56 sống 390 s (danh nghĩa; thật (0, 276] s theo
  T2-149) vẫn là boot ngắn nhất chuỗi gần đây theo giờ
  thực — 802f358f sống 7.698 s danh nghĩa, dài hơn
  nhiều.
- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133):** #35 (→d8a11644), #36 (→1d610e56), #37
  (→ae8f70bb), #38 (→70025d3e) theo aggregate đợt 149
  §10.2; **#39 (→802f358f)** theo T7-149 §2.6;
  **#40 (→e9295700) là sự kiện mới đợt này** — xảy ra
  giữa lúc T7-149 đóng cờ (~22:45Z) và lúc đợt 150 mở
  (23:35:51Z). Chờ T2-150 xác nhận thời điểm + số sự
  kiện.
- **Full boot_id b47f7932: KHÔNG có dữ kiện mới.**
  T7: `b47f7932-ebca-447e-a015-0a6c160efd98`; T9:
  `b47f7932-ebca-4205-86a0-b71a0ab9790c` (F-143-T6-1) —
  quyết parent (g) đợt 143: **ĐỂ MỞ**, ghi cả hai bản kèm
  nguồn, không chọn một.
- **Dải #113?/#114?/#115? TẠM (T6 tính độc lập — chờ
  T2-150 merged FULL86):** T6 KHÔNG công bố dải tạm
  cho boot sau e9295700 (cần merged mù #71?/#72? +
  kiểm clock tại #39/#40 — thuộc T2-150). T2-150 công
  bố dải chuẩn.
- **Khung chết #110?: CHỐT LÀM CHUẨN (17:24:10Z,
  17:27:53Z] (223 s)** theo quyết parent (b)/(g) đợt 148
  (bản 238 s theo /proc/1 bị thay thế). **Chuẩn nguồn
  btime: /proc/stat (kernel btime)** theo quyết parent
  (b) đợt 148 — T6 áp dụng xuyên suốt tài liệu này
  (gap 7.698 s danh nghĩa, CHƯA chứng nhận; CERT 70 /
  FULL 85 giữ nguyên theo T2-149). Lưu ý: F-149-T6-1 cho
  thấy ngay cả btime /proc/stat cũng có thể mâu thuẫn
  với đọc trực tiếp — chuẩn nguồn không giải quyết được
  mâu thuẫn kiểu đó (đợt này không có mâu thuẫn —
  xem §8.0).
- **Khung chết #111? (d8a11644) + #112? (1d610e56):
  CHƯA CHỐT** — chờ merged mù #68/#69? của T2-149
  (theo T2-149: mù #68/#69?/#70? ĐÃ ĐÓNG HOÀN TOÀN —
  xem §8.3 dưới; khung #111?/#112? nay thuộc T2-150
  sau khi T2-149 đóng). T6 không quét mtime cho hai
  khung này (thuộc T2-150).

### 8.3 Mù mới 802f358f → e9295700 — MỞ, giao T2-150 (số hiệu mù #72? tạm — T2-150 đánh số chính thức)

- Khoảng mù: từ probe cuối trên 802f358f tới probe đầu
  trên e9295700 (T2-150 xác định mốc chính xác). Hai
  đoạn: A (802f358f, #115? — chứa T7-149 đóng cờ
  ~22:45Z + T10-149 đóng sổ) / B (e9295700, #116? —
  chứa đợt 150 mở 23:35:51Z + T6-150).
- **Mù #68/#69?/#70? ĐÃ ĐÓNG HOÀN TOÀN (T2-149) → chuỗi
  đóng hoàn toàn lên 6** (sau 3 ở #67) — T6 ghi nhận
  từ T7-149 §2.5 (T2-149 §2.5: gap #36 (7.607, 7.667],
  #37 (0, 276], #38 [1.257, 1.713) — mids dùng cho
  thống kê; số danh nghĩa 390 s / 1.171 s đều sai).
  **Mù #71? (70025d3e → 802f358f) MỞ — giao T2-150**
  (T7-149 §2.6). **Mù #72? (802f358f → e9295700) MỞ —
  giao T2-150.**
- **Chuỗi INSIDE: 0** (chờ T2-150 xác nhận chính thức —
  T6 ghi danh nghĩa e9295700 OUTSIDE dải #112? như
  T6-149 đã ghi cho 70025d3e — nhưng chờ T2-150 xác
  nhận chính thức, không tự thay số chuẩn).

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **~23:41Z** (boot e9295700 đã
  ~9' tuổi theo btime /proc/stat); đóng **00:00:57Z**
  (boot e9295700 đã ~28'48" tuổi). Đợt 150 mở
  **23:35:51Z** (sched 23:35:51Z) — tức **3'42" sau
  btime boot e9295700 (23:32:09Z)**.
- **T7-150 chưa có .done/NOTES mới lúc T6 đóng** — T7-150
  kiểm run 149/150 như thường lệ (run 149 vẫn `running`
  lúc T7-149 đóng cờ, hạn ngân sách theo started gốc
  23:35:51Z — tức đúng lúc đợt 150 mở; kết cục run 149
  thuộc cửa T7-150). T6 không đọc started_at của run
  149/150 (thuộc T7-150) — chỉ ghi mốc của mình để T7
  đối chiếu: đợt 150 mở 23:35:51Z trên boot e9295700
  (btime 23:32:09Z); **nếu run 150 started_at bị viết
  lại tại reboot #40 thì offset tính từ btime nào là
  câu hỏi cho T7-150** (reboot #40 xảy ra 3'42" TRƯỚC
  khi run 150 dispatch — run 150 chưa chạy lúc reboot
  nên không bị viết lại theo cơ chế đã xác định; T7-150
  xác nhận).
- Dữ kiện cũ T7-149 để lại (xem aggregate đợt 149 §9 +
  LIMITS T7-149): run 148 SUCCEEDED + run 149 jitter
  0 s; mẫu (m) KHÔNG tái diễn ở 148→149; điều tra mẫu
  (m) ĐÃ ĐÓNG theo quyết parent (f) đợt 148 (hạn một
  đợt). T6 không kết luận thêm.

## 10. Dọn Xvfb: 0 Xvfb lúc mở + 0 Xvfb lúc đóng; 3 socket mồ côi của T1-150 (test xvfb-lock), 0 process Xvfb sống

- **Lúc mở (23:41Z): 0 Xvfb đang chạy, `/tmp/.X11-unix/`
  trống** (x11-open.txt). Reboot #40 đã xóa /tmp (socket
  X193/X194/X195 cũ của đợt 149 không còn).
- **Lúc đóng (00:00:57Z): 0 Xvfb đang chạy** (ps-full-close
  0 process Xvfb; `ps -eo pid,ppid,args | grep -i xvfb`
  0 dòng). **`/tmp/.X11-unix/` có 3 socket X193/X194/X195**
  (x11-close.txt, mtime 23:57Z) + 3 file lock
  `/tmp/.X193-lock` / `.X194-lock` / `.X195-lock`
  (cùng mtime 23:57Z; nội dung lần lượt PID 34647 /
  34648 / 34649 — **cả 3 PID đều đã chết**, `ps -p`
  không thấy).
- **Chủ sở hữu 3 socket: T1-150 (test xvfb-lock)** —
  `round150-t1-suites.log` ghi: "B. 3 claim song song
  đều lên Xvfb thật — :193:OK, :194:OK, :195:OK" và
  "C. không còn Xvfb nào của test chạy" — test tự xác
  nhận process đã tắt nhưng socket + lock file còn lại
  (cùng mẫu T1-149: suite tự tạo 3 socket, T10 dọn tay
  lúc đóng). **T6 không dọn socket của luồng khác**
  (không phải phạm vi T6) — ghi rõ chủ sở hữu để T1-150
  (hoặc T10-150 lúc đóng) dọn; T6 đợt sau kiểm lại
  `/tmp/.X11-unix/` còn sót không.
- **Socket X193 lúc đóng KHÔNG phải socket của T4-149**
  (bài học F-147-T6-2: không kết luận "sót" từ tên
  socket): số display :193 chỉ là trùng số do Xvfb cấp
  lại; T6 đã đối chiếu log + mtime trước khi kết luận.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-150).
  Inotify: `max_user_watches` = **63747** lúc đóng
  (khớp đợt 147/148/149 — không có lần flip mới trong
  phiên T6; chuỗi flip-flop 63.747 → 63.756 → 63.747 qua
  3 boot giữ nguyên; quyết parent (m) đợt 146: ghi làm
  chú thích, không hành động).

## 11. Tuân thủ lock của luồng đo đợt 150 tới nay

- **Chưa luồng đợt 150 nào acquire lúc T6 đóng**
  (log lock không thêm dòng nào trong phiên T6 — raw
  vẫn 1362). T4-150 đang chuẩn bị (thư mục round150-t4
  đã có các script analyze-t4-*.py); T8-150 đang chuẩn
  bị O8 (o8-driver-150t8.sh + o8-chromium đã có). Lượt
  yên #22: đang đo (quyết parent (h) đợt 148: #21 ĐÓNG,
  #22 mở đợt 149 — T4-149 attempt1/2/3 đã chạy trong
  đợt 149; verdict #22 thuộc T4-150/T10-150 nếu T4-150
  chạy attempt tiếp theo). T6 đợt 151 đếm tiếp.
- **T1-round150 đã chạy suite** (round150-t1-suites.log
  đã có lúc T6 đóng; test xvfb-lock exit=0 — xem §10).
  `npm test` nay thuộc suite chuẩn của T10 từ đợt 149
  (quyết parent (k) đợt 148). Verdict `npm test` thuộc
  T1/T10-150.
- **T10-round150 chưa mở lúc T6 đóng** (chưa chuẩn bị
  bản frozen lock script — T6 đợt sau kiểm md5 khi T10
  chuẩn bị).
- **T2/T5/T7/T9-150 đang chạy** (đã có thư mục
  round150-t2/t5/t7/t9); chưa có .done nào lúc T6 đóng
  (T6 là cờ đầu tiên của đợt 150).
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Đường dẫn đúng `apps/web/src/preview.tsx`.
- **O8 WebKit:** T8-149 O8 PASS (chuỗi WebKit FULL PASS
  6 → 7 với trích dẫn sau cờ T4 theo quyết parent (j)
  đợt 148 — xem aggregate đợt 149). O8 đợt 150 chưa
  chạy lúc T6 đóng — verdict thuộc T8-150/T10-150.
  T6 không điều tra O8.
- **T5-150 (replay boot e9295700):** dpkg.log có entry
  configure 23:35:42Z (xem §8.0) — verdict replay thuộc
  T5-150.
- **T7-150 (kiểm run 149/150):** đang chạy theo lệ; T6
  không can thiệp (xem §9).

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-150-T6-1, F-150-T6-2,
  F-150-T6-3 (mới, xem dưới).** Không có sai số đếm nào
  của T6 đợt này: số mở của T6 khớp đúng số T6-149 đếm
  lúc đóng cộng 13 chu kỳ hoàn tất + 1 acquire bị
  reboot giết (1356 chính thức lúc mở, từng loại khớp
  đúng — KỂ CẢ số queue file 101, T10-149 đã đếm bằng
  `ls | wc -l` theo bài học F-145-T6-1; T10 gộp kiểm
  lại).
- **F-150-T6-1 — (B) KIỂM CHỨNG ÂM TÍNH (mới — phát hiện
  chính của đợt này, xem §6.3–§6.4):** (B) đã triển
  khai đúng quyết parent §12.3(g) đợt 149 (suite md5
  `63a25be3`, chỉ đổi khối T7). Kiểm chứng: suite 6/6
  lần 9/9 PASS (nền ổn định) + 120 lần chạy kiểm soát
  khối T7 (mới 40+30, cũ 30+20) + 30 lần trial (A).
  Kết quả: dưới cùng churn bơm vào, **(B) PASS 2/30
  (7%) vs bản cũ PASS 13/30 (43%)**; (A) PASS 30/30
  (100%). Lý thuyết: điều kiện PASS của (B) (N1=N0 VÀ
  N2=N0) chặt hơn bản cũ (N1=N2) — (B) fail mọi trường
  hợp bản cũ fail, cộng thêm trường hợp mới; tiền đề
  "(B) bền trước mọi churn nền" BỊ BÁC BỎ bằng số đo.
  **T6 giữ code (B) trong suite như đã quyết và KHÔNG
  tự đổi sang (A)** — brief chỉ cho (A) làm dự phòng
  khi (B) khó triển khai (mà (B) triển khai được).
  **CẦN PARENT QUYẾT LẠI ở §12 đợt 150:** (i) giữ (B)
  (chấp nhận T7 flaky nhiều hơn khi đợt đông), (ii) về
  bản cũ (khôi phục assert B1−B2=1), hay (iii) chuyển
  (A) (đếm chỉ marker giả/PID giả — đã kiểm chứng
  30/30 dưới churn; lưu ý: đổi `count_blockers` trong
  poll sẽ ảnh hưởng cả gate cửa yên của T4 nên cần
  quyết rõ phạm vi sửa: chỉ khối T7 hay cả poll).
  T6 đề xuất (iii) dựa trên số đo.
- **F-150-T6-2 — Double-acquire thứ 7 MỚI (t8-round149,
  reboot #39 — đã giải thích, không phải bug lock):**
  acquire 21:22:05Z bị reboot #39 (21:23:51Z) giết;
  acquire tiếp theo 21:25:58Z phát hiện STALE-LOCK
  (dòng 1320) rồi acquire lại. Cùng mẫu 6 ca cũ
  (STALE-LOCK cướp sau reboot). Không có ca mới nào
  khác. Ghi nhận để T10 khỏi nhầm thành "lock kẹt".
- **F-150-T6-3 — Bẫy phương pháp grep lồng nhau (mới —
  đã bắt được trước khi ghi, xem §5):** lần grep đầu
  trả 27 dòng vì các file `khong-nha-grep.txt` CŨ
  (T6-148/T6-149) nằm trong thư mục quét và tự khớp
  pattern. Đã chạy lại với `--exclude='khong-nha-grep.txt'`
  (loại MỌI file cùng tên) → đúng 6 dòng, khớp số học
  lăn (8 − 5 + 3 = 6). Bài học: exclude theo TÊN FILE,
  không theo đường dẫn file của mình.
- **F-149-T6-1 (cũ, nhắc lại):** mâu thuẫn boot/btime ở
  reboot #38 (T10-148 verify ae8f70bb lúc 20:02:19Z +
  20:06:13Z vs btime boot mới 70025d3e 20:00:33Z) —
  theo T2-149/T7-149: tranh chấp clock T1–T2 đã được
  parent quyết ở đợt 149 §12.3 (xác nhận bác bỏ "X >
  595 s"; mâu thuẫn 27 s giữ khoảng rộng; khung #113?
  chốt bản giờ thực) — T6 ghi nhận, không nhắc lại
  chi tiết (xem LIMITS T7-149 §2.5). Đợt này KHÔNG có
  mâu thuẫn kiểu đó ở reboot #40 (xem §8.0).
- **F-149-T6-2 (cũ, ĐÃ ĐƯỢC XỬ LÝ ở đợt này):** T7 flaky
  tái diễn lần thứ hai liên tiếp (đợt 148 + 149) — đã
  điều tra xong ở đợt 149 (nguyên nhân gốc: đếm
  blockers không giới hạn phạm vi + churn WebKit) và
  đã triển khai sửa (B) ở đợt này — nhưng kiểm chứng
  âm tính (F-150-T6-1). Chuỗi "xanh kép" của T7 tính
  lại từ đợt 150 = **0** (như brief giao); chuỗi suite
  xanh về bản chất: T6-149 ghi 31 lần qua đợt 149 —
  đợt này suite 6/6 lần 9/9 (với T7 mới) nên chuỗi
  nối lên **32 lần** (tính theo đợt; T10 xác nhận
  chính thức lúc đóng).
- **F-149-T6-3 (cũ, ĐÃ ĐƯỢC GIẢI QUYẾT ở đợt này):**
  prune điều (b) không kích hoạt ở đợt 149 (0 file
  xóa) — đợt này điều (b) KÍCH HOẠT, xóa đúng 1 file
  `cooldown-s4-w2` (xem §7); quy luật F-147-T6-1 nối
  lại. Dự báo "đủ 7 ngày ~21/11 21:08Z" lần thứ tư
  liên tiếp không còn đối tượng (file đã bị xóa theo
  điều (b) trước khi đủ 7 ngày).
- **F-148-T6-1 (cũ, nhắc lại):** dự báo "file cũ nhất đủ
  7 ngày ~21/11 21:08Z" của T6-147 không còn đối tượng
  (file đã bị xóa theo điều (b) trước khi đủ 7 ngày) —
  **lần thứ tư liên tiếp điều này xảy ra ở đợt 150**
  (xem §7). T6 các đợt sau đếm tiếp.
- **F-148-T6-2 (cũ, đã được PARENT QUYẾT ở đợt 148
  §12.3(b)):** chuẩn nguồn btime **ĐỔI SANG /proc/stat
  (kernel btime)** làm chuẩn; gap = 18.867 s, chứng
  nhận [18.857, 18.877] s; CERT 67 / FULL 82 giữ nguyên
  (số lượng không đổi); khung chết #110? CHỐT 223 s
  theo /proc/stat (quyết (g)). T6 đợt này áp dụng
  /proc/stat xuyên suốt. Gap #40 danh nghĩa 7.698 s
  CHƯA chứng nhận (thuộc T2-150).
- **F-148-T6-3 (cũ, đã khắc phục):** quét mtime lần đầu
  194 file, quét lại 164 file do luồng khác viết lại
  file giữa hai lần quét — T6 đợt này KHÔNG quét mtime
  khung chết (khung #110? đã chốt; khung #111?/#112?
  thuộc T2-150) nên không lặp lại.
- **F-148-T6-4 (cũ, nhắc lại):** claim "0 reboot trong
  phiên" của đợt 147 ĐÃ SAI theo nghĩa chặt (reboot #35
  trong lúc T10-147 đóng sổ) — đính chính đã có trong
  GAP §77 + entry MEMORY đợt 148 (quyết parent (l) đợt
  148: THÊM GHI CHÚ ĐÍNH CHÍNH, không sửa hồ sơ đã đóng).
  T6 đợt này ghi đúng: reboot #40 xảy ra TRƯỚC phiên
  T6 (23:32:09Z, trước khi đợt 150 mở 23:35:51Z); 0
  reboot TRONG phiên T6 (boot e9295700 suốt phiên).
- **F-147-T6-2 (cũ, đã khắc phục):** grep ps lúc đóng suýt
  đọc sai 2 node process của T1-147 — T6 đợt này đã đối
  chiếu ppid/log/mtime trước khi kết luận ở cả hai
  snapshot (§1: 0 vite lúc mở/đóng; §10: 3 socket
  X193/194/195 thuộc T1-150, không phải T4-149) — không
  lặp lại lỗi đọc vội.
- **F-147-T6-3 (cũ, đã được T10-147 xác minh + parent quyết
  ở đợt 147):** T6 không tự tính lại p10/p90 FULL80 và
  mean CERT65/FULL80 từ log gaps thô — T6 đợt này vẫn
  lấy p10/p90 từ LIMITS T2-147/T2-148 và đối chiếu bằng
  code; **đợt này T6 KHÔNG công bố dải tạm cho boot sau
  e9295700** (cần merged mù #71?/#72? + kiểm clock —
  thuộc T2-150). Verdict INSIDE/OUTSIDE chờ T2-150 xác
  nhận chính thức (§8.0); T10 gộp kiểm lại. Không tự
  chứng nhận gap 802f358f→e9295700.
- **F-146-T6-1 (cũ, đã được T10-146 xác minh + parent quyết
  ở đợt 146):** T10-144 ghi nhầm queue 116 file (thực tế
  98; 116 là số event COOLDOWN trong log). Phương pháp
  đếm queue bằng `ls | wc -l` giữ nguyên. T6-150 xác
  nhận tiếp: số mở đợt này (101 file) khớp đúng số
  T10-149 (100 file lúc đóng đợt 149 + 1 file mới
  `cooldown-t8-round149` — T10-149 §10.4 ghi lock
  TRỐNG; queue 100 sau prune đợt 149).
- **F-146-T6-2 (cũ, đã khắc phục):** bản nháp ghi sai số
  chu kỳ mới 11/64, đúng là 12/75 — đã sửa trước khi stage
  đợt 145. T6 đợt này đếm chu kỳ bằng TICKET sau snapshot
  (13 chu kỳ hoàn tất + 1 acquire bị reboot giết, §3) —
  không lặp lại.
- **F-145-T6-1 (cũ, đã được T10-145 xác minh + parent quyết
  ở đợt 145):** xem F-146-T6-1 trên — phương pháp đếm queue
  bằng `ls | wc -l` giữ nguyên, không lặp lại.
- **F-145-T6-2 (cũ, đã khắc phục):** xem T6-146 §12 — T6
  đợt này đếm chu kỳ bằng TICKET sau snapshot (13 chu kỳ
  hoàn tất, §3) — không lặp lại.
- **F-144-T6-1 (cũ, đã được parent quyết ở đợt 144 + (e)
  đợt 145 + (e) đợt 146 + đợt 147 + đợt 148):** chuỗi INSIDE
  6 làm chuẩn → **0** (d8a11644 OUTSIDE, T2-148 xác nhận
  chính thức, quyết parent đợt 148 không nêu lại — chuỗi
  0 giữ nguyên qua đợt 149). T6 đợt này ghi danh nghĩa
  e9295700 OUTSIDE dải #112? (xem §8.0) nhưng chờ T2-150
  xác nhận chính thức — không tự thay số chuẩn (vẫn là 0
  cho tới khi T2-150 xác nhận).
- **F-144-T6-2 (cũ, ĐÃ ĐƯỢC GIẢI QUYẾT ở đợt 144):** gap
  T2-144 prereg 7.280 s lệch 60 s so với 7.220 s tính từ
  btime — T2-144 xác minh lại bằng code (F-144-T2-8) và
  chứng nhận gap [7.210, 7.230] s theo số đúng; CERT 64 /
  FULL 79 đã được quyết parent (c) đợt 144 XÁC NHẬN.
  (Cùng họ với F-148-T6-2 đợt này: lệch nguồn btime 15 s
  — đã chốt chuẩn /proc/stat ở quyết (b) đợt 148.)
- **F-144-T6-3 (cũ, đã khắc phục):** grep "KHÔNG NHẢ" lần
  đầu loại sai file repro theo basename. T6 đợt này loại
  MỌI file `khong-nha-grep.txt` theo tên ngay từ lần đầu
  và trừ tay 3 dòng repro của chính mình (§5) — không
  lặp lại; tổng 6 dòng khớp đúng số học lăn.
- **F-144-T6-4 (cũ, đã khắc phục):** md5 bản đã lọc ghi sai
  trong bản nháp. T6 đợt này lấy md5 CHỈ từ file snapshot
  (lock v2 `520b8baa`, v1 `fd21193c`, suite mới `63a25be3`,
  poll `1710e480`, preview `530e10a7` — mở ≠ đóng chỉ ở
  suite do sửa khối T7, §6; log thô 1362 dòng cả lúc mở
  lẫn lúc đóng do +0 dòng trong phiên, §2) — không lặp lại.
- **F-143-T6-1 (cũ, đã được parent quyết ở đợt 143):**
  xung đột đánh số (c)/(d) + mâu thuẫn full boot_id
  b47f7932 — quyết parent (c) đợt 143: **CHỌN CÁCH ĐẾM
  CHẶT làm chuẩn từ đợt 144** (b47f7932 = #103?,
  9afdaa89 = #104?, 70a5b0fc = #105?, 691a7403 = #106?,
  cc222c8a = #107?, e146ca67 = #108?, 98a7c93f = #109?,
  6fb582df = #110?, d8a11644 = #111?, 1d610e56 = #112?,
  ae8f70bb = #113?, 70025d3e = #114?, 802f358f = #115?,
  e9295700 = #116? — số sau theo đếm chặt đợt này, TẠM);
  quyết parent (g) đợt 143: **full boot_id b47f7932 ĐỂ
  MỞ** (ghi cả hai bản T7/T9 kèm nguồn, không chọn một).
  T6 đợt này áp dụng đếm chặt trong toàn bộ tài liệu và
  ghi nhận full boot_id vẫn để mở (§8.2) — không lặp lại
  phần chưa quyết.
- **F-142-T6-1 (cũ, đã giải quyết ở đợt 142):** mâu thuẫn
  nhãn reboot #25/#26 — aggregate đợt 142 §12.2(c) đã chốt
  #26 theo cách đếm của T10 (mỗi lần đổi boot_id là 1 sự
  kiện, kể cả reboot trong lúc đóng sổ). Không lặp lại ở
  đợt này: T6-150 ghi đúng sự kiện #40 theo chốt đó.
- **F-142-T6-2 (cũ, đã khắc phục):** grep "KHÔNG NHẢ" lần
  đầu trả 33 dòng do chưa loại file grep-output. T6 đợt
  này loại MỌI file `khong-nha-grep.txt` ngay từ lần đầu
  (§5 + F-150-T6-3) — không lặp lại.
- **F-141-T6-1 (cũ, đã khắc phục):** T6-141 chỉ kiểm
  `/tmp/.X11-unix/` lúc đóng. T6 đợt này kiểm CẢ lúc mở
  lẫn lúc đóng (§10) — không lặp lại.
- **F-140-T6-1 (cũ, nhắc lại):** T6-140 thử đọc preview.tsx
  bằng đường dẫn sai (`apps/web/src/editor/preview.tsx`).
  T6 đợt này dùng đúng đường dẫn `apps/web/src/preview.tsx`
  ngay từ đầu, md5 `530e10a7` khớp — không lặp lại.
- **F-139-T6-1 (cũ, nhắc lại):** T6-139 gọi `status` với
  `VITE_LOCK_DIR` sai lúc mở. T6 đợt này đã gọi status
  ĐÚNG ngay từ đầu (không override) — không lặp lại.
- **F-136-T6-1 (cũ, nhắc lại):** T1-135 viết sai nhãn boot.
  Không lặp lại ở đợt này: T6-150 ghi đúng boot sống
  e9295700 (khớp brief + T6 đo trực tiếp + journal).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn; tổng 17 không đổi. T6-150 đã đếm lại đúng (§5:
  trích dẫn = 0 — các file `.done` của T6 viết không dấu
  nên không khớp pattern có dấu; đã giải thích phương pháp
  ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **Số hiệu boot mới (#102?→#116?) VẪN TẠM (xem §8.2):**
  chuỗi tương đối #57→#116? + e9295700 đã chốt ở mức
  quan sát được (54 boot, tính cả b47f7932 = #103?
  chặt); số tuyệt đối giữ "?" vì (a) mù #37 tối đa 29 ẩn
  (+ mù #38 G mở tối đa 6, mù #29/#30/#31 +4 — T5-120:
  "#60" tạm có thể tới #123); (b) mù #49 đoạn B mở, tối
  đa 1 ẩn; (c) mù #51 đoạn B mở, tối đa 3 ẩn; (d) mù #52
  đóng hoàn toàn nhưng không làm neo được; (e) dị thường
  đồng hồ #84?→#85? (§8.4(b) đợt 134) + dị thường đồng hồ
  quanh 23:54Z (§8.6/§8.8 T6-143) + dị thường đồng hồ ≥23 s
  ở reboot #34 (§3/§8.6 đợt 147) + **dị thường btime 15 s
  ở reboot #35 (F-148-T6-2) + MÂU THUẪN boot/btime ở
  reboot #38 (F-149-T6-1) + tranh chấp clock T1–T2 đã
  quyết ở đợt 149**; **(f) MỚI: mù #68/#69?/#70? ĐÃ ĐÓNG
  HOÀN TOÀN (T2-149 — chuỗi mù đóng hoàn toàn lên 6;
  gap #36 (7.607, 7.667], #37 (0, 276], #38 [1.257,
  1.713) — mids dùng cho thống kê; CERT 70 / FULL 85)
  + mù #71? MỞ + mù mới #72? MỞ (giao T2-150); chuỗi
  INSIDE chờ T2-150 xác nhận chính thức (T6 ghi danh
  nghĩa OUTSIDE — xem §8.0); mù #56 A vẫn MỞ (quyết
  parent (e)) — số #93? cũng vẫn quy ước headline**.
  Journal/wtmp chỉ giữ boot hiện tại (journal `--list-boots`
  chỉ 1 dòng e9295700; wtmp bắt đầu 23:32:25Z) nên T6 suy
  ra số hiệu từ thứ tự thời gian + hồ sơ các đợt trước,
  không phải từ log hệ thống.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; ngày
  đúng là **15/11** (F-131-T6-1, nhắc lại ở §8.1). Mù #49
  đoạn B mở + mù #51 đoạn B mở + mù #53 B recheck
  (T2-137) + mù #55 (T2-136: B mở tối đa 2 ẩn quy ước /
  3 cộng dồn) + mù #56 A MỞ (quyết parent (e)) + mù #57
  **ĐÃ ĐÓNG HOÀN TOÀN** (T2-138) + mù #58 **ĐÃ ĐÓNG HOÀN
  TOÀN** (T2-139 — hai gap chứng nhận, CERT 57 / FULL 72)
  + mù #59 **ĐÃ ĐÓNG HOÀN TOÀN** (T2-140 — gap #96?→#97?
  chứng nhận [7.246, 7.266] s, CERT 58 / FULL 73, quyết
  parent (j) đợt 140) + mù #60 **ĐÃ ĐÓNG HOÀN TOÀN**
  (T2-141 — gap đôi chứng nhận, CERT 60 / FULL 75, quyết
  parent (c) đợt 141) + mù #61 **KHÔNG ĐÓNG HOÀN TOÀN**
  (đoạn B mở, tối đa 1 ẩn — quyết parent (f) đợt 142) +
  **mù #62 KHÔNG ĐÓNG HOÀN TOÀN** (đoạn B không chứng nhận
  được, đoạn C mở tối đa 2 ẩn — quyết parent (e) đợt 143;
  BÁC cả hai đề xuất closer/floor của T2) + **mù #63 ĐÃ
  ĐÓNG HOÀN TOÀN** (T2-144 — gap #105?→#106? chứng nhận
  [7.210, 7.230] s, CERT 64 / FULL 79, quyết parent (c)
  đợt 144; chuỗi mù đóng hoàn toàn bắt đầu lại ở 1) +
  **mù #64 KHÔNG ĐÓNG HOÀN TOÀN** (T2-145 — đoạn B mở,
  tối đa 2 ẩn; quyết parent (b) đợt 145: chuỗi mù đóng
  hoàn toàn đứt, về 0; gap 7.050 s + 7.381 s ĐỂ SPAN,
  quyết (f) đợt 145) + **mù #65 ĐÃ ĐÓNG HOÀN TOÀN**
  (T2-146 — gap #108?→#109? chứng nhận [7.057, 7.077] s,
  CERT 65 / FULL 80, quyết parent (b)/(c) đợt 146; chuỗi
  mù đóng hoàn toàn lên 1) + **mù #66 ĐÃ ĐÓNG HOÀN TOÀN**
  (T2-147 — gap #109?→#110? chứng nhận [8.353, 8.373] s,
  CERT 66 / FULL 81, quyết parent đợt 147; chuỗi mù đóng
  hoàn toàn lên 2) + **mù #67 ĐÃ ĐÓNG HOÀN TOÀN**
  (T2-148 — gap #110?→#111? chứng nhận [18.857,
  18.877] s theo /proc/stat, quyết parent (b) đợt 148;
  chuỗi mù đóng hoàn toàn lên 3; CERT 67 / FULL 82) +
  **mù #68 + #69? + #70? ĐÃ ĐÓNG HOÀN TOÀN** (T2-149 —
  gap #36 (7.607, 7.667], #37 (0, 276], #38 [1.257,
  1.713); chuỗi mù đóng hoàn toàn lên 6; CERT 70 / FULL
  85) + **mù #71? MỞ + mù #72? MỞ** (giao T2-150 — xem
  §8.3); mù #52 đã đóng hoàn toàn (T2-133);
  mù #54 đã đóng hoàn toàn (T2-135).
- **T7 vẫn flaky về bản chất cho tới khi parent quyết lại**
  (xem F-150-T6-1): (B) đã triển khai nhưng kiểm chứng
  âm tính — dưới churn, (B) fail nhiều hơn bản cũ
  (2/30 vs 13/30); (A) là phương án duy nhất kiểm
  chứng chống churn thật (30/30). T6 không tự đổi test
  thêm.
- **v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ** —
  `vite-lock: KHÔNG NHẢ — owner hiện tại là '...', không
  phải '...'` (T6 đợt 126 đã kiểm dòng 191; đợt này T6
  không đọc lại dòng 191 — md5 v1 khớp baseline
  `fd21193c` nên nội dung frozen không đổi theo định nghĩa).
  T6 đợt 120 đã ghi nợ; đang đóng băng, cần parent quyết
  "mở băng" nếu muốn đồng bộ message. Chỉ ghi nhận, không
  tự mở băng.
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §2);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round148-t*/` (toàn đợt) +
  `round149-t*/` (toàn đợt) + `round150-t*/` tới 00:00Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T8/T10-150 chưa chạy xong tới thời điểm đếm; T6
  đợt 151 đếm tiếp.
- **Prune cooldown lần 25 áp dụng: xóa 1 file**
  (`cooldown-s4-w2` theo điều (b); điều (a) 0 ứng viên —
  xem §7). Tổng sau prune 100 file. File cũ nhất còn lại
  (`cooldown-s4-w3`) đủ 7 ngày theo đồng hồ tường ~21/11
  21:08Z, theo `find` ~22/11 21:08Z — nhưng theo quy luật
  F-147-T6-1 nhiều khả năng lại bị xóa theo điều (b)
  trước khi đủ 7 ngày nếu có file mới được thêm — T6 các
  đợt sau đếm tiếp.
- **Đợt 149 khép sạch trên lock (§4):** 16 chu kỳ (3 trong
  phiên T6-149 + 13 sau đó: t8-round149 O8 ×13) sạch +
  1 acquire bị reboot #39 giết đã phục hồi bằng
  STALE-LOCK — T6 đợt này đếm bổ sung bằng TICKET
  từng chu kỳ, khớp đúng recount T10-149;
  **đợt 150 tới 00:00Z có 0 chu kỳ** (chưa luồng nào
  acquire) — T6 đợt 151 đếm tiếp. Không phải bug lock.
- **Kiểm vite.lock.queue + lock LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 00:00Z (lock TRỐNG, 0 ticket + 100 cooldown
  sau prune); đợt còn chạy tới ~02:00Z, **T10
  đóng đợt sẽ recount lại lúc đóng** (như đợt 124–149
  T10 đã đếm lúc đóng). T6 không chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 132 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt boot e9295700: dpkg.log có entry configure
  23:35:42Z** (xem §8.0); verdict replay thuộc T5-150.
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  … `test-v2-t6-run6.log` (9/9 ×6 lần). Thư mục repro /tmp
  của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned"). **Ngoại lệ kiểm chứng T7:** script
  `t7-control.sh` + `t7-control-a.sh` + 5 file log kiểm
  chứng (`t7-control-new-steady.log`,
  `t7-control-new-churn.log`, `t7-control-old-churn.log`,
  `t7-control-old-steady.log`, `t7-control-a-churn.log`)
  ĐƯỢC GIỮ trong `round150-t6/` (không nằm /tmp) — bằng
  chứng đầy đủ 150 lần chạy kiểm soát khối T7.
- **T2-150 CHƯA XONG lúc T6 đóng (00:00Z):** chưa có .done/
  LIMITS (T2 đang điều tra mù #71?/#72? + gap #39/#40).
  Theo brief, T6 ghi rõ "chờ T2" và để T10 gộp — KHÔNG tự
  suy đoán số boot #115?/#116?, không tự chứng nhận gap
  802f358f→e9295700, không tự chốt khung chết #111?/#112?,
  không tự công bố dải #114?/#115?. T6 chỉ ghi thêm quan
  sát của mình (§8: gap danh nghĩa 7.698 s + không có
  mâu thuẫn kiểu F-149-T6-1 + dpkg mốc 23:35:42Z) để
  T2-150 cân nhắc.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  sửa khối T7 trong suite test + viết LIMITS này — không
  có code production nào đổi nên không có gì để build lại).
- **Trần inotify 63747 — ghi làm chú thích chuẩn chuỗi,
  không hành động (quyết parent (m) đợt 146):** T6 đo
  63747 lúc đóng (00:00Z) trên boot e9295700; T9-150 đo
  chính thức; chuỗi flip-flop 63.747 → 63.756 → 63.747 qua
  3 boot giữ nguyên, không có lần flip mới trong phiên T6
  (giá trị ổn định 63747 suốt phiên, khớp đợt 147/148/149).
  Không hành động.

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `apps/web/scripts/test-vite-lock-v2.sh` | Sửa khối T7 theo phương án (B) (md5 `1c0d7eaa` → `63a25be3`) |
| `docs/PHASE9_ROUND150_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), script poll
(`1710e480`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), Xvfb (0 process lúc mở +
0 process lúc đóng; `/tmp/.X11-unix/` có 3 socket mồ côi
của T1-150 lúc đóng — T6 không xóa gì).
File cooldown: prune đã chạy, **xóa 1 file**
(`cooldown-s4-w2` theo điều (b) — xem §7).
Stage: `repo-1-push/paths-loop/phase9-round150-t6-lockhealth.txt`
(NUL-delimited, 2 file trên; verify bằng read-back + od -c).
Dữ liệu thô: `hidden_files/round150-t6/` (ps-full-open.txt,
ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
time-open.txt, time-close.txt, wc-open.txt,
vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
vite-lock-v2-raw-close.log, analyze-log.py,
analyze-log-cleaned-close.txt, prune-candidates.txt,
prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log … run6.log, repro-newmsg-fixed150.sh,
repro-newmsg.log, t7-control.sh, t7-control-a.sh,
t7-control-new-steady.log, t7-control-new-churn.log,
t7-control-old-churn.log, t7-control-old-steady.log,
t7-control-a-churn.log, md5-open.txt, md5-close.txt).
Status lock lúc mở/đóng ghi trong LIMITS §2/§7 (không lưu
file riêng đợt này); raw-open không có file riêng vì log
không thêm dòng nào trong phiên (raw-close = raw-open).
