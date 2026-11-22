# PHASE9 ROUND149 T6 — lock KHỎE + T7 flaky TÁI DIỄN → ĐÃ ĐIỀU TRA, NGUYÊN NHÂN = đếm blockers không giới hạn phạm vi + churn WebKit (TÁI HIỆN ĐƯỢC 2 LẦN) + prune lần 24: 0 FILE XÓA ((b) KHÔNG kích hoạt lần đầu sau 3 lần liên tiếp) + boot MỚI 70025d3e: MÂU THUẪN với verify trực tiếp của T10-148 (F-149-T6-1) — LIMITS

- Đợt: 149, luồng T6 (sức khỏe lock vite v2 + theo dõi T7 flaky + prune).
  Lượt cron 03:35 +07 20/11/2026 (= 20:35:51Z 19/11). Chạy
  20:44:49Z → 21:04:40Z 19/11/2026, toàn bộ trên một boot duy
  nhất 70025d3e — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): lock health theo lệ (đếm cặp
  ACQUIRED→RELEASED, lock đang giữ, TIMEOUT mới, zombie,
  Xvfb socket sót; chạy suite lock 9/9 — ghi rõ nếu flaky
  tái diễn, tái diễn thì điều tra — quyết parent 148
  §12.3(o)); prune theo cooldown; đếm tiếp lock T4-148
  đang giữ lúc T6-148 đóng (smoke-wall45 acquire
  17:49:18Z — nợ §11 đợt 148).
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (không có đổi nào đợt này — bản `520b8baa`
  từ đợt 135 giữ nguyên), KHÔNG sửa script test dù đã tìm
  ra lỗi thiết kế của T7 (quyết sửa thuộc parent — xem
  §6.5). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn —
  chỉ đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round149-t6/` (status-open.txt,
  status-close.txt, ps-full-open.txt, ps-full-close.txt,
  ss-open.txt, ss-close.txt, x11-open.txt, x11-close.txt,
  boot-verify-open.txt, boot-verify-close.txt, time-open.txt,
  time-close.txt, wc-open.txt, wc-close.txt,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-raw-open.log, vite-lock-v2-raw-close.log,
  analyze-log.py, cooldown-now-open.txt,
  cooldown-now.txt, prune-candidates.txt, prune-deleted.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, test-v2-t6-run3.log,
  repro-newmsg-fixed149.sh, repro-newmsg.log,
  t7-investigate.sh, t7-investigate.log,
  t7-inv-ps-*-before.txt, t7-inv-ps-*-after.txt,
  md5-open.txt, md5-close.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI 70025d3e (btime 20:00:33Z) + MÂU THUẪN với verify trực tiếp của T10-148 (F-149-T6-1, xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `70025d3e-ff1b-4519-aa1e-5459a616930b`, btime 20:00:33Z
  theo /proc/stat** (btime epoch 1795118433; `uptime -s` =
  20:00:33; `who -b` = Nov 19 20:00; `/proc/1` mtime
  20:00:44,244Z (+11 s); `/proc/1/stat` starttime 1085
  ticks = 10,85 s sau kernel boot → PID 1 start wall ≈
  20:00:43,85Z, khớp /proc/1 mtime trong 0,39 s — cùng
  mẫu hòa giải như các boot trước; `journal --list-boots`
  chỉ 1 dòng 70025d3e, first entry 20:00:44Z (boot +11 s).
  Uptime ~44'16" lúc T6 bắt đầu (20:44:49Z), ~1h04'07"
  lúc đóng (21:04:40Z). Đây là boot sau **reboot #38
  (tạm đánh số — xem §8)**.
- **MÂU THUẪN (F-149-T6-1 — mới, lớn, xem §8):** T10-148
  verify trực tiếp lúc đóng sổ đọc boot **ae8f70bb**
  (live `cat /proc/sys/kernel/random/boot_id`) lúc
  **20:02:19Z và 20:06:13Z** — SAU btime boot mới
  20:00:33Z. Đồng hồ tường hiện tại ĐÚNG (kiểm bằng Date
  header 3 server: +2/+3 s — xem §8.1) và
  (now−btime)−uptime = **0,39 s** (hai đồng hồ đồng thuận
  boot này bắt đầu 20:00:33Z). Hai nhóm dữ kiện không thể
  cùng đúng trên một máy: hoặc T10-148 chạy trên cell
  khác (giả thuyết đa-cell — xem §8.2), hoặc btime boot
  mới sai. T6 KHÔNG tự chốt — gap ae8f70bb→70025d3e KHÔNG
  chứng nhận được từ btime; giao T2-149 (mù mới, xem
  §8.3). Số hiệu boot #114? là TẠM.
- **Đợt 149 mở 20:35:51Z** (sched 20:35:51Z) — tức
  **35'18" sau btime boot 70025d3e (20:00:33Z)**.
  T6 mở 20:44:49Z (44'16" sau btime).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline. preview.tsx md5 `530e10a7`.
- Các luồng đợt 149 khác: lúc T6 mở chưa có thư mục
  round149-t* nào khác (T6 là luồng đầu tiên mở cờ);
  trong phiên T6 lần lượt xuất hiện đủ 9 thư mục t1–t9
  (t10 đã có thư mục từ trước khi T6 đóng — xem §11);
  T4-149 chạy attempt #22 (quyết parent (h) đợt 148:
  #22 mở đợt 149) trên boot 70025d3e; T1-149 chạy lại
  suite 27 mục + `npm test` (xem §11); T8-149 chuẩn bị
  O8 (chưa acquire lúc T6 đóng — xem §2/§11); T2/T7-149
  chưa có .done lúc T6 đóng (T7-149 đang điều tra mẫu
  (m) theo quyết parent (f) đợt 148).

## 1. Quét zombie: 0 zombie; 0 vite lúc mở, 0 vite lúc đóng (T4 giữ lock giữa phiên nhưng vite đã tắt lúc đóng); 3 socket Xvfb mồ côi của T1-149 (0 process Xvfb sống)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 20:44Z
  (mở, `ps-full-open.txt`, 30 dòng) và lúc 21:04Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (20:44:49Z): 0 vite thật đang chạy** — `ss -tlnp`
  trống hoàn toàn (0 cổng lắng nghe); `/tmp/.X11-unix/`
  trống (0 socket). Lock TRỐNG (§2). Đây là trạng thái
  sạch sau reboot + trước khi T4-149 acquire lần đầu
  (20:48:19Z).
- **Lúc đóng (21:04:40Z): 0 vite thật đang chạy** — `ss`
  trống; lock TRỐNG (§2). T4-149 attempt3 đã release
  21:03:36Z và dọn xong vite (cổng 5187 không còn lắng
  nghe).
- **Giữa phiên: T4-149 giữ lock với vite thật** (xem §2):
  attempt1 vite pid 11211 cổng 5187 (20:48:19Z–20:52:28Z),
  attempt2 vite pid 24500 cổng 5187 (20:52:45Z–20:57:22Z),
  attempt3 vite (20:59:02Z–21:03:36Z) — kèm MiniBrowser/
  WebKitWebProcess/WebKitNetworkProcess (xem §6.3: đếm
  blockers lúc attempt2 chạy = 11 process khớp mẫu poll).
- Lưu ý phương pháp (như mọi đợt): dòng bash wrapper của
  chính T6 trong `ps-full-*.txt` có args chứa chuỗi
  `vite-lock-v2.sh` nên khớp grep `vite` — đó là lệnh đo
  của chính T6, không phải process vite. T6 đếm "vite thật"
  bằng comm/args thực + đối chiếu ppid, không đếm dòng
  wrapper của mình. (Chính wrapper này cũng là 1 blocker
  trong đếm poll của T7 — xem §6.3.)

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; 3 chu kỳ hoàn tất trong phiên T6 + 10 chu kỳ hoàn tất giữa T6-148 đóng và T6-149 mở

- **Lúc mở (20:44:49Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 100 cooldown`,
  rc=0.
- **Lúc đóng (21:04:40Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 100 cooldown`
  (sau prune 0 file — xem §7), rc=0.
- **Log lock +9 dòng trong phiên T6** (raw 1301 lúc
  20:44:49Z → 1310 lúc đóng; md5 bản thô mở
  `4099ba18…` → đóng `96ca3880…`): t4 TICKET/ACQUIRED/
  RELEASED ×3 (attempt1 hold 249 s, attempt2 hold 276 s,
  attempt3 hold 274 s — xem dưới). **3 chu kỳ hoàn tất
  trong phiên, 0 chu kỳ đang giữ.**
- **Giữa T6-148 đóng (17:49:28Z) và T6-149 mở (20:44:49Z):
  +33 dòng = 10 chu kỳ hoàn tất** (xem §4): t4
  smoke-wall45 (acquire 17:49:18Z — chu kỳ T6-148 để lại
  "đang giữ" — **RELEASED 17:50:14Z, hold 56 s** —
  nợ §11 đợt 148 ĐÃ ĐẾM XONG, chu kỳ sạch) + t4
  attempt1/2/3 đợt 148 (TICKET 17:59:46Z / 18:04:18Z /
  18:08:35Z; RELEASED holds 219 / 219 / 216 s) + t8-148
  ×6 (O8/harness, TICKET 18:23:56Z → 18:47:16Z;
  RELEASED holds 81 / 140 / 902 / 70 / 130 / 230 s —
  hold 902 s là chu kỳ dài nhất đợt 148). Không có
  TIMEOUT/STALE mới nào trong khoảng này (§4).
- **T4-149 trong phiên T6 (attempt #22, boot 70025d3e):**
  attempt1 acquire 20:48:19Z → release 20:52:28Z
  (hold 249 s); attempt2 acquire 20:52:45Z → release
  20:57:22Z (hold 276 s); attempt3 acquire 20:59:02Z
  (TICKET 20:59:01Z, wait_s=1) → release 21:03:36Z
  (hold 274 s). Cả ba acquire/release sạch, ticket khớp
  log. T4 dùng script repo (`vcut-vite-lock-v2.sh
  run-attempt t4 5187 ...` trong ps — tức chạy trên
  **thứ tự ghi mới**, §3). File attempt JSON
  attempt1/2/3-70025d3e đã có; marker attempt-done
  attempt1/2 đã có, attempt3 chưa có lúc T6 đóng
  (T4 đang phân tích — xem §11).
- **T8-149 chưa acquire lúc T6 đóng** (0 dòng t8-round149
  trong log tới 21:04:40Z) — O8 đợt 149 chạy sau cờ T4
  theo quyết parent (c)/(j) đợt 148; T6 đợt 150 đếm tiếp.
- **Cửa sổ trống trong phiên:** lock trống 20:44:49Z–
  20:48:19Z (mở → T4 acquire attempt1), 20:52:28Z–
  20:52:45Z (17 s), 20:57:22Z–20:59:02Z (100 s),
  21:03:36Z–21:04:40Z (đóng). Prune chạy trong cửa sổ
  cuối (21:03:4xZ — xem §7).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 119 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 13 chu kỳ mới kể từ
  lúc T6-148 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4;
  đếm bằng TICKET sau snapshot đóng T6-148 17:49:28Z):
  - t4-round148 smoke-wall45 ×1 (RELEASED 17:50:14Z,
    hold 56 s — acquire đã nằm trong snapshot T6-148),
  - t4-round148 attempt1/2/3 ×3 (holds 219 / 219 / 216 s),
  - t8-round148 ×6 (holds 81 / 140 / 902 / 70 / 130 / 230 s),
  - t4-round149 attempt1/2/3 ×3 (holds 249 / 276 / 274 s).
  - Cộng với 106 chu kỳ T6-148 đã đếm = **119 chu kỳ liên
    tiếp sạch trên thứ tự mới** (106 đợt 148 + 13 đợt này).
  - Bằng chứng phiên bản: T4-148/T4-149 dùng script repo
    (`vcut-vite-lock-v2.sh run-attempt t4 5187 ...` trong
    ps — tức chạy trên **thứ tự ghi mới**); T8-148 dùng
    script repo (lock holder ghi `boot=d8a11644` trong
    status — script mới); T4-149 ghi `boot=70025d3e`
    trong status (§2).
- **File `cooldown-t4` mtime 21:03:36Z** (release attempt3
  của t4-149 — ghi đè, không phải file mới); file
  `cooldown-t8-round148` mtime 18:51:07Z (release cuối
  của t8-148). **Không file cooldown mới nào trong phiên
  T6** (queue giữ nguyên 100 file — xem §7).
- **T10-149 chưa mở lúc T6 đóng** — T6 đợt sau kiểm md5
  bản frozen khi T10 chuẩn bị.

## 4. Nhất quán log lock: 1304 dòng chính thức lúc đóng, 375 cặp, 0 đang giữ, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại: đúng 6
dòng đó là phần chênh giữa raw và bản đã lọc, khớp diff
round148-t6).
Bản đã lọc lúc mở: 1295 dòng (raw 1301); lúc đóng: **1304
dòng** (raw 1310) — **+9 dòng trong phiên T6** (t4 ×3 chu
kỳ, §2). **KHỚP ĐÚNG số T6-148 đếm lúc đóng cộng thêm
13 chu kỳ hoàn tất (§3)** — ba nguồn độc lập đồng thuận
về số lúc mở (T6-148 đóng 1262 chính thức + 33 dòng
phần còn lại đợt 148 = 1295 lúc mở đợt này; xem bảng).

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-148 (1262) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 392 | 380 | 301 | 295 |
| ACQUIRED | 381 | 369 | 299 | 293 |
| RELEASED | 375 | 362 | 297 | 291 |
| COOLDOWN | 139 | 134 | 131 | 126 |
| TIMEOUT | 10 | 10 | **2** | 2 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **1304** | **1262** | **1031** | **1008** |

- So với snapshot T6-148 đóng (1262 dòng): **+42 dòng =
  TICKET +12 / ACQUIRED +12 / RELEASED +13 / COOLDOWN +5 /
  TIMEOUT +0 / STALE +0** — đúng bằng 13 chu kỳ hoàn tất
  (§3: 12 chu kỳ T+A+R đủ + 1 chu kỳ wall45 chỉ còn
  RELEASED trong khoảng này vì acquire của nó đã nằm
  trong snapshot T6-148) + 5 event COOLDOWN (t8-148:
  5 event cho 6 chu kỳ — O8 đầu không ghi COOLDOWN, xem
  T6-148 §4; t4-148/t4-149: 0 event mới — các release
  ghi đè `cooldown-t4` đã có, không ghi event COOLDOWN
  mới vào log? — xem chú thích dưới). Mọi chu kỳ đều
  sạch, ghép cặp đủ — khớp từng con số, không có event
  nào mất dấu hay thêm lạ ngoài ca t4 cũ §3 T6-136.
- **Chú thích COOLDOWN (để T10 khỏi nhầm):** số event
  COOLDOWN trong log (+5) NHỎ HƠN số release trong khoảng
  (+13) vì event COOLDOWN chỉ ghi khi holder chờ cooldown
  (wait > 0 / có delay) — release của t4 (wait_s=0/1,
  reacquire nhanh) không sinh event COOLDOWN mới trong
  log dù file `cooldown-t4` được ghi đè trên đĩa. Đây là
  hành vi đã biết của script (không phải mất dòng):
  5 event mới đều là của t8-148 (wait 14945–14958 ms,
  xem dòng log 18:25–18:47Z). Queue file trên đĩa vẫn
  100 (xem §7) — số file queue và số event COOLDOWN
  trong log là hai số khác nhau (bài học F-146-T6-1).
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 1304 dòng): **375 cặp ACQUIRED→RELEASED;
  0 "đang giữ"** — lock trống lúc đóng (§2). Chênh
  ACQUIRED − RELEASED = 6 = **5 ca double-acquire đã biết
  + 1 ca t4 mồ côi (dòng 869, ACQUIRED 23:50:17Z)**.
  Dòng 869 **vẫn là ACQUIRED duy nhất không có RELEASED thật
  của chính nó** (F-134-T6-2); KHÔNG phải lock kẹt. 0 lần
  RELEASED không có ACQUIRED trước đó.
- 6 ca "double-acquire" trong output analyzer — **cùng
  đúng 6 ca đã biết** (5 ca cũ s3-round116, t3-round117,
  t4, t3-round119, t8-round129 dòng 781 + ca t4 dòng
  888/02:50:57Z); tất cả giải thích được bằng STALE-LOCK
  cướp sau reboot (5 ca cũ) hoặc reboot-kill (ca t4);
  **không có ca mới nào**.
- 10 TIMEOUT (8 cũ từ trước đợt 120 + **2 t1-147** — xem
  T6-148 §4) — **0 TIMEOUT mới** kể từ T6-148 đóng.
  STALE-LOCK mới duy nhất vẫn là đợt 130 (do reboot
  giữa lượt).
- Cửa sổ R120: **301 = 299 T/A + 2 TIMEOUT, RELEASED 297**
  (chênh T/A−R = 2 = 1 ca reboot-kill đợt 129 + 1 ca t4
  đợt 134), TIMEOUT 2, STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  392+381+375+139+10+6+1 = 1304 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 148 khép lại trên lock (toàn đợt): 13 chu kỳ sạch**
  — 3 trong phiên T6-148 + 10 sau khi T6-148 đóng snapshot
  (t4 wall45 ×1 + t4 attempt ×3 + t8 ×6) — khớp đúng
  recount T10-148 (log thô cuối t8-round148 RELEASED
  18:51:07Z; queue 100 file sau T8 — T10-148 §10.4 ghi
  lock TRỐNG lúc đóng, khớp).
  **Đợt 149 tới 21:04:40Z có 3 chu kỳ sạch + 0 đang giữ**
  (t4 attempt1/2/3 #22) — T6 đợt 150 đếm tiếp. Không phải
  bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 147 (toàn đợt), đợt 148 (toàn đợt) và đợt 149 (tới 21:04Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round147-t*/` + `round148-t*/` +
`round149-t*/` (tới 21:04Z) — theo quy tắc lăn: bỏ round146,
thêm round149 (phần còn lại sau T6-148).
**Phương pháp đếm đợt này: grep ra file /tmp trước,
`--exclude` file grep-output (`khong-nha-grep.txt`) NGAY
từ lần đầu + KHÔNG loại file repro theo basename (bài học
F-144-T6-3), trừ tay 3 dòng repro của chính mình sau khi
đếm** (theo bài học F-142-T6-2: không đếm lồng file
grep-output; bài học T6-138 §5).
**Lưu ý phương pháp:** pattern grep có dấu (`KHÔNG NHẢ` /
`BỎ QUA release thừa`) — các file `.done` của T6 viết bằng
ASCII không dấu (`"KHONG NHA"`) nên KHÔNG khớp pattern này.
Tổng **8 dòng khớp (grep lúc 20:46Z), phân loại đủ 8/8 — tất
cả đều là bản sao script / log repro, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 2 | `round147-t1/vcut-vite-lock-v2.t1-147.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 6 | `round147-t6/repro-newmsg.log` (3) + `round148-t6/repro-newmsg.log` (3) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 0 | Không file `.done` nào trong phạm vi khớp pattern có dấu (các file `.done` của T6 viết không dấu) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 147 (toàn đợt) / 148 (toàn đợt) / 149 nào |
| Round149-t* (trừ repro /tmp của T6) | 0 dòng | T10-149 chưa mở; T4-149/T8-149 chưa có driver log nào khớp (chỉ có log lock thật, không đếm ở đây) |

- **Repro đợt này (chưa đếm, đếm ở đợt 150):**
  `round149-t6/repro-newmsg.log` 3 dòng (2 `BỎ QUA` +
  1 `KHÔNG NHẢ`) trên /tmp — xem §6.2.
- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt
  122 = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125
  = 0 (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0
  (toàn đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn
  đợt), đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt),
  đợt 132 = 0 (toàn đợt), đợt 133 = 0 (toàn đợt),
  đợt 134 = 0 (toàn đợt), đợt 135 = 0 (toàn đợt), đợt 136
  = 0 (toàn đợt), đợt 137 = 0 (toàn đợt), đợt 138 = 0
  (toàn đợt), đợt 139 = 0 (toàn đợt), đợt 140 = 0 (toàn
  đợt), đợt 141 = 0 (toàn đợt), đợt 142 = 0 (toàn đợt),
  đợt 143 = 0 (toàn đợt), đợt 144 = 0 (toàn đợt), đợt 145
  = 0 (toàn đợt), đợt 146 = 0 (toàn đợt), đợt 147 (toàn
  đợt) = 0, đợt 148 (toàn đợt — bổ sung 10 chu kỳ sau
  T6-148 đóng, §4) = 0, đợt 149 tới 21:04Z = 0.**
  Khớp với log pairing sạch ở §4 (375 cặp + 1 ca
  reboot-kill cũ đã giải thích + 0 đang giữ — không
  liên quan nhánh release).
- Giới hạn phạm vi: T4/T8/T10-149 chưa chạy xong tới 21:04Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  149, T6 đợt 150 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-148 đếm 13 dòng (4 script + 9
  repro); đợt này bỏ round146 (−2 script −3 repro = −5)
  = **8 dòng** ✓ (round149-t6 repro +3 chưa đếm — đếm ở
  đợt 150; round148-t10 không có script frozen — T10-148
  không chạy O8 riêng).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9, 9/9, 8/9 (T7 FAIL) + ĐIỀU TRA T7: TÁI DIỄN LẦN THỨ HAI LIÊN TIẾP — NGUYÊN NHÂN ĐÃ TÌM RA + TÁI HIỆN ĐƯỢC (F-149-T6-2)

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
70025d3e (`#114?` đếm chặt tạm — xem §8).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, lần 3 8/9 (T7 FAIL)

(`round149-t6/test-v2-t6-run1.log` ~20:51Z,
`test-v2-t6-run2.log` ~20:52Z, `test-v2-t6-run3.log`
~20:52Z):
- **Lần 1: PASS=9 FAIL=0, rc=0** (T7: `blockers 14 -> 13`).
  **Lần 2: PASS=9 FAIL=0, rc=0** (T7: `blockers 13 -> 12`).
  **Lần 3: PASS=8 FAIL=1, rc=1 — FAIL duy nhất là T7**
  (`T7 poll: B1=3 B2=3 (muốn B1-B2=1)` — đếm blockers:
  3 trước khi kill giả, 3 sau khi kill; kỳ vọng đúng 1
  bị gỡ).
- **Kết luận: T7 flaky TÁI DIỄN** (F-149-T6-2) — lần flaky
  thứ hai liên tiếp (đợt 148 lần 2: B1=7 B2=4; đợt 149
  lần 3: B1=3 B2=3). Theo quyết parent 148 §12.3(o)
  ("tái diễn thì điều tra"), T6-149 **ĐÃ MỞ ĐIỀU TRA**
  (xem §6.3–§6.5). T1–T6 + T8 xanh cả 3 lần chạy —
  không có thao tác lock nào fail. **Kết luận suite: xanh
  về bản chất (9/9, 9/9, 8/9-T7)** — không phải lỗi
  lock (T7 chỉ đếm process giả trong /tmp, không đụng
  lock thật).
- Chuỗi: đợt 148 là lần flaky đầu tiên sau 23 lần xanh
  kép; đợt 149 flaky tiếp — chuỗi "xanh kép" của T7
  nay là 0 (tính lại từ đợt 150); chuỗi suite xanh về
  bản chất vẫn giữ (31 lần liên tiếp không fail ngoài
  T7 flaky — T6 đợt 120 + T9 đợt 120 + T6 đợt 121 … +
  T6 đợt 149).

### 6.2 Repro message ĐÚNG (`round149-t6/repro-newmsg.log`, 21:04:23Z)

Copy verbatim script của T6-148, chỉ đổi tên TDIR
(`vcut-t6r148-repro` → `vcut-t6r149-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–148, kết quả giống hệt:
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
  lúc đó có 100 cooldown; log thật vẫn 1310 dòng thô
  lúc repro chạy và queue vẫn 100 file sau khi repro xong;
  không có file `cooldown-tA/tH/tB` nào xuất hiện trong
  queue thật. **F-132-T6-1 KHÔNG lặp lại.**

### 6.3 Cơ chế T7 — đếm blockers KHÔNG giới hạn phạm vi (đọc code)

- Test T7 (`test-vite-lock-v2.sh` dòng 144–157): spawn 1
  process giả `bash -c 'exec -a WebProcess-q4test sleep 25'`,
  chạy poll `--once` → B1, kill giả, chạy poll lại → B2,
  PASS khi và chỉ khi B1−B2 = 1.
- Poll (`vcut-poll-quiet-v2.sh`, hàm `count_blockers`):
  đếm **TOÀN BỘ process trên máy** có args khớp
  `[v]ite|[p]robe.*\.mjs|[M]iniBrowser|[w]ebkit|[W]ebProcess`
  (không giới hạn theo PID, thread, hay thư mục). B1 =
  1 (giả) + N (nền); B2 = 0 (giả) + N' (nền). PASS khi
  và chỉ khi N' = N, tức **nền phải ỔN ĐỊNH TUYỆT ĐỐI
  trong ~2 s giữa hai lần poll**. Bất kỳ process vite/
  WebKit nào của luồng khác khởi động hay tắt trong
  cửa sổ đó đều phá vỡ bất biến — test không có cách
  nào phân biệt giả với thật.
- **Nền lúc T4-149 chạy attempt: 7–11 process khớp mẫu**
  (đo trực tiếp 20:5xZ: vite lock wrapper, npm exec vite,
  sh -c vite, node vite, probe `.mjs`, MiniBrowser,
  WebKitNetworkProcess, WebKitWebProcess, tee log,
  cộng wrapper đo của chính T6). Tức B1/B2 bị chi phối
  bởi process của luồng khác (7–11) chứ không phải giả
  (1). Chỉ cần 1 process nền đổi trạng thái giữa hai
  poll là FAIL.
- **Cả hai lần flaky đều rơi vào cửa sổ WebKit đang
  chuyển trạng thái (đối chiếu giờ):**
  - Đợt 148 lần 2 (log mtime 17:44:29Z; T7 chạy
    ~17:44:15–17:44:29Z): T8-148 O8 đang chạy
    (17:41:02Z–17:45:04Z), WebKit con ra/vào giữa các
    pass — B1=7 B2=4 (nền giảm 2 + giả 1 = Δ3).
  - Đợt 149 lần 3 (log mtime 20:52:43Z; T7 chạy
    ~20:52:38–20:52:43Z): T4-149 attempt1 vừa release
    (20:52:28Z, stack WebKit đang tắt) và attempt2 sắp
    acquire (20:52:45Z, vite/WebKit đang khởi động) —
    B1=3 B2=3 (nền tăng 1 + giả 1 = Δ0, triệt tiêu nhau).
  - Đối chứng: lần 3 đợt 148 (log mtime 17:45:43Z; T7
    chạy ~17:45:30Z, sau khi O8 release 17:45:04Z,
    cửa sổ yên) PASS 9/9. Lần 1+2 đợt 149 (T7 chạy
    ~20:51:30Z/~20:52:00Z, attempt1 đang chạy ổn định)
    PASS 9/9 cả hai.

### 6.4 Tái hiện có kiểm soát: 54 lần chạy khối T7 trích verbatim — 52 PASS + 2 FAIL đúng lúc T4 tắt stack (TÁI HIỆN ĐƯỢC)

Script `round149-t6/t7-investigate.sh`: khối T7 trích
verbatim từ suite + snapshot ps đầy đủ trước/sau mỗi
lần chạy (file `t7-inv-ps-*-before/after.txt`), chạy
chỉ trên /tmp, không đụng lock thật. Tổng **54 lần
chạy: 52 PASS + 2 FAIL**:
- `steady1` (20:56:08Z, attempt2 đang chạy ổn định):
  B1=8 B2=7 (nền 7, ổn định) → PASS. Chứng minh giả
  luôn được đếm (B1 = nền+1 trong MỌI lần chạy).
- `loop1–loop20` (20:56:37Z–20:59:12Z, cách nhau 5 s):
  20/20 PASS. Nền DAO ĐỘNG MẠNH GIỮA các lần chạy
  (8→9→8→3→2→6→8) theo vòng đời stack WebKit của T4
  (attempt2 release 20:57:22Z: nền 8 → 3 giữa loop5 và
  loop6; attempt3 acquire 20:59:02Z: nền 2 → 8 giữa
  loop19 và loop20) — NHƯNG ổn định TRONG mỗi cặp poll
  (~3 s) nên Δ=1 luôn đúng. Đây là bằng chứng trực tiếp
  rằng nền churn theo từng đợt, và flake chỉ xảy ra khi
  churn rơi đúng vào cửa sổ ~2 s giữa hai poll.
- `tight21–tight45` (21:01:45Z–21:02:44Z, chạy sát nhau,
  attempt3 đang chạy ổn định): 25/25 PASS, B1=8 B2=7
  không đổi (nền 7 ổn định suốt 1 phút).
- `rel46–rel53` (21:03:19Z–21:03:37Z, chạy sát nhau,
  phủ đúng lúc attempt3 release 21:03:36Z): **2 FAIL
  TÁI HIỆN:**
  - `rel51` (21:03:32Z): **B1=6 B2=3, Δ=3** — nền giảm 2
    giữa hai poll (stack WebKit của attempt3 đang tắt
    trước khi release được ghi log 21:03:36Z).
  - `rel53` (21:03:37Z): **B1=3 B2=1, Δ=2** — nền giảm
    thêm 1 giữa hai poll (1 process nền còn lại sau khi
    giả bị kill là wrapper đo của chính T6 — xem dưới).
  - Các lần còn lại (rel46–50, rel52) PASS với nền
    giảm dần 7 → 3 → 2 → 1 theo tiến trình tắt stack.
- **Lưu ý đo lường (ghi rõ để T10 khỏi nhầm):**
  `fake_visible=2` trong mọi lần chạy investigate (không
  phải 1) vì lệnh đếm `grep -c "WebProcess-q4test"` tự
  đếm chính process grep + wrapper exec của T6 — đây là
  nhiễu của DỤNG CỤ ĐO của T6, KHÔNG phải của poll
  (poll dùng bracket trick + `grep -v grep` nên không tự
  đếm; B1 = nền+1 trong mọi lần chạy chứng minh giả được
  đếm đúng 1 lần). Tương tự, wrapper đo của chính T6
  (cmdline chứa chuỗi `WebProcess-q4test` / `vite-lock`)
  luôn là 1 blocker nền trong mọi lần chạy — ỔN ĐỊNH nên
  không phá Δ (trừ rel53, khi nó là process nền cuối
  cùng còn lại sau khi stack T4 tắt hết: B2=1).
- **Kết luận điều tra: NGUYÊN NHÂN GỐC = thiết kế test
  T7 đếm blockers trên toàn hệ thống mà không giới hạn
  phạm vi, nên bất kỳ process vite/WebKit nào của luồng
  khác khởi động/tắt trong cửa sổ ~2 s giữa hai lần poll
  đều làm FAIL.** Đây là lỗi của test, KHÔNG phải lỗi
  lock: mọi thao tác lock thật (T1–T6, T8) đều PASS
  trong cả 3 lần chạy suite đợt 148 và đợt 149; giả luôn
  được đếm đúng (B1 = nền+1 trong 54/54 lần chạy kiểm
  soát); repro message §6.2 xanh; log pairing §4 sạch
  (375 cặp, 0 đang giữ). Tỉ lệ flake quan sát: 2 lần /
  ~87 lần chạy T7 trong suite (≈ 2,3% mỗi lần chạy) —
  đúng bậc với xác suất churn rơi vào cửa sổ 2 s khi
  đợt đông (8–10 luồng chạy WebKit song song).

### 6.5 Đề xuất sửa (T6 KHÔNG tự sửa — quyết thuộc parent)

- Phương án A (khuyến nghị): giới hạn phạm vi đếm của T7
  về đúng process giả — đếm chỉ process có args chứa
  marker duy nhất `WebProcess-q4test` (hoặc đếm theo PID
  giả đã biết), thay vì đếm mọi process khớp mẫu chung.
  Khi đó B1=1 B2=0 bất kể luồng khác làm gì.
- Phương án B: chụp nền trước khi spawn giả (N0) và assert
  B1−N0=1 VÀ B2−N0=0 thay vì assert B1−B2=1 (vẫn nhạy
  với churn nhưng phân biệt được giả mất hay nền đổi).
- Phương án C: giữ nguyên test, chấp nhận T7 flaky khi
  đợt đông và tách T7 khỏi gate 9/9 (quyết đã được đề
  xuất từ T6-148 §6.1, vẫn thuộc parent).
- **T6 không sửa `test-vite-lock-v2.sh` / `vcut-poll-quiet-v2.sh`
  trong đợt này** (script test dùng chung; đổi gate/thiết
  kế test là quyết parent/T10). T7 vẫn flaky về bản chất
  cho tới khi một trong ba phương án trên được quyết.
- **Kết luận sức khỏe: lock KHỎE.** Giữ/nhả đúng lúc mở
  và lúc đóng (T4 #22 hold 249/276/274 s + T4-148/T8-148
  10 chu kỳ sạch giữa hai đợt), 0 zombie, 0 stale mới,
  queue 0 ticket, log nhất quán (375 cặp + 1 ca
  reboot-kill cũ đã giải thích + 0 đang giữ, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của
  T6-132), 0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên
  lock thật đợt 147–148 (toàn đợt) và đợt 149 (tới
  21:04Z), suite 9/9 độc lập (T7 flaky 1/3 lần — đã
  điều tra xong, F-149-T6-2), và thứ tự ghi mới đã có
  **119 chu kỳ thật** chứng minh (§3). **Không còn caveat
  nào về mất dòng RELEASED cho các chu kỳ mới** — caveat
  cũ chỉ còn là 1 dòng lịch sử (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **T8-149 chưa chạy O8 lúc
  T6 đóng** (chờ cờ T4 theo quyết (j)) — T6 đợt 150
  đếm tiếp; và **boot mới có mâu thuẫn btime (F-149-T6-1,
  §8)** — không liên quan lock.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (ĐIỀU (b) KHÔNG KÍCH HOẠT LẦN ĐẦU SAU 3 LẦN LIÊN TIẾP)

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
  - 20:50Z: lock ĐANG GIỮ bởi t4 attempt1 (acquire
    20:48:19Z) — điều (e) KHÔNG thỏa, prune hoãn.
    Quét ứng viên lúc này: `-mtime +7`: **0 file**;
    tổng 100 file (đúng trần mềm, không vượt).
  - 21:03:4xZ: lock TRỐNG trở lại (t4 attempt3 release
    21:03:36Z; kiểm status TRỐNG — điều (e) thỏa);
    quét lại ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt` rỗng) — điều (a)
    không kích hoạt. Tổng **100 file, KHÔNG vượt trần
    mềm 100** — điều (b) KHÔNG kích hoạt.
  - **Kết quả prune đợt 149: 0 file đã xóa.**
    `prune-deleted.txt` rỗng. Đây là kết quả đúng của
    luật — **lần đầu tiên sau 3 lần kích hoạt liên tiếp
    (đợt 146 xóa 1, đợt 147 xóa 1, đợt 148 xóa 2) điều
    (b) không kích hoạt**, vì trong phiên T6 không có
    file cooldown mới nào được thêm (T4-149 release ×3
    chỉ ghi đè `cooldown-t4`; T8-149 chưa chạy O8 nên
    chưa thêm `cooldown-t8-round149` — xem §2).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (20:44Z) **100 file / 1400 byte**;
  lúc trống trước prune (21:03Z) **100 file / 1400 byte**
  (100 × 14 = 1400 khớp; `ls`/`find`/`status` khớp nhau);
  **sau prune 100 file / 1400 byte**. Số học khớp: 100 +
  0 = 100 ✓ (0 file cooldown mới trong phiên), rồi
  100 − 0 = 100 ✓ (0 file prune). Không file nào bị xóa
  hay thêm giữa hai lần đếm của đợt này (log lock +9
  dòng trong phiên, §2 — nhưng 0 file cooldown mới vì
  các release đều ghi đè file đã có).
- Phân tầng tuổi lúc ~21:03Z (ngữ nghĩa `find -mtime`,
  TRƯỚC prune — cũng là sau prune vì 0 file xóa):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 46 file** (tăng từ 45 lúc 20:50Z — 1
  file mtime 16/11 vừa vượt 72h, đúng quy luật tuổi);
  **≥48h (`-mtime +1`): 71 file** (không đổi so với
  20:50Z). File cũ nhất còn lại vẫn là
  `cooldown-s4-w2`, mtime 2026-11-14T21:08:48Z —
  lúc 21:03Z mới **~119,9h tuổi**.
- **Hệ quả cho F-147-T6-1 (xem §12):** quy luật "điều (b)
  xóa file cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" lần
  này TẠM DỪNG một nhịp — vì không có file mới nào được
  thêm trong phiên T6 nên tổng không vượt trần và
  `cooldown-s4-w2` sống sót thêm một đợt. File này đủ 7
  ngày theo đồng hồ tường vào khoảng **21/11 21:08Z**;
  theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
  viên vào khoảng **22/11 21:08Z**. Nếu T8-149 thêm
  `cooldown-t8-round149` (tổng 101) thì prune đợt 150
  sẽ kích hoạt điều (b) và xóa `cooldown-s4-w2` TRƯỚC
  khi nó đủ 7 ngày — quy luật cũ nối lại. T6 các đợt sau
  đếm tiếp. Ghi nhận, không đổi luật (luật thuộc parent).
- **Chú thích tên file:** file `cooldown-now-open.txt`
  trong thư mục làm việc đợt này CHỨA status lúc lock
  đang giữ (20:50Z, t4 attempt1) — không phải status
  lúc mở (lúc mở lock TRỐNG, đã ghi trong
  `status-open.txt`). Tên file theo mẫu đợt 148 nhưng
  nội dung là snapshot trước prune; T6 đợt sau đừng đọc
  nhầm thành status mở. (Không đổi tên để giữ mẫu —
  ghi chú này là đủ.)

## 8. CHỐT SỐ BOOT — boot mới 70025d3e: MÂU THUẪN btime với verify trực tiếp của T10-148 (F-149-T6-1); gap ae8f70bb→70025d3e KHÔNG chứng nhận được; mù mới giao T2-149

### 8.0 Reboot #38 (tạm đánh số) — ae8f70bb → 70025d3e, btime 20:00:33Z theo /proc/stat; T10-148 verify trực tiếp ae8f70bb lúc 20:02:19Z + 20:06:13Z

- Boot mới `70025d3e-ff1b-4519-aa1e-5459a616930b`,
  btime **20:00:33Z** theo /proc/stat (epoch 1795118433);
  /proc/1 mtime 20:00:44,244Z (+11 s); starttime
  1085 ticks = 10,85 s; journal first entry 20:00:44Z
  (boot +11 s). Uptime 44'16" lúc T6 mở (20:44:49Z).
- **Mâu thuẫn (F-149-T6-1 — mới, lớn):** T10-148 verify
  trực tiếp (`round148-t10-verify.sh`, đọc LIVE
  `/proc/sys/kernel/random/boot_id` hai lần) ghi boot
  **ae8f70bb-9197-4eae-b70f-2988769ac6a9** lúc
  **20:02:19Z** (`=== T1-148 verify start ... boot
  ae8f70bb ... ===`) và **20:06:13Z** (`=== ALL DONE ...
  boot ae8f70bb ===`) trong `round148-t10-suites.log`
  (mtime file 20:06:13,801Z khớp đúng timestamp nội
  dung). Cả hai thời điểm đều SAU btime boot mới
  20:00:33Z (lần lượt +106 s và +340 s). Trên MỘT máy,
  không thể vừa reboot lúc 20:00:33Z vừa đọc được boot
  cũ lúc 20:02:19Z/20:06:13Z.
- **Kiểm đồng hồ độc lập của T6 (quyết định giả thuyết
  lệch đồng hồ):** đọc Date header 3 server lúc 20:46:34Z
  (giờ địa phương): example.com 20:46:36Z, google.com
  20:46:36Z, cloudflare.com 20:46:37Z → **đồng hồ tường
  hiện tại CHỈ CHÊNH +2/+3 s** (server đi trước — trong
  sai số làm tròn header 1 s + độ trễ request; cùng bậc
  F109? ≈ 0 s các đợt trước). **Đồng hồ tường HIỆN TẠI
  ĐÚNG — không có lệch ~6–20 phút.**
- **Kiểm nhất quán nội bộ hai đồng hồ (uptime vs wall):**
  (now−btime) − uptime = **0,39 s** (đo bằng code,
  20:50:21Z: uptime 2988,33 s; now−btime 2988,72 s).
  Tức đồng hồ đơn điệu (monotonic) và đồng hồ tường
  ĐỒNG THUẬN rằng kernel này boot lúc 20:00:33Z. Không
  có nhảy đồng hồ nào sau boot có thể giải thích mâu
  thuẫn mà không phá vỡ đẳng thức này.
- **Hai giả thuyết còn lại (T6 không tự chốt):**
  - (i) **Đa-cell (nhiều máy chia sẻ filesystem):**
    T10-148 chạy trên một cell/kernel khác vẫn ở boot
    ae8f70bb (verify 20:02–20:06Z, cờ 20:16:46Z), trong
    khi cell của T6-149 reboot lúc 20:00:33Z sang boot
    70025d3e. Giải thích được MỌI dữ kiện mà không cần
    lệch đồng hồ nào (mỗi cell có kernel/boot_id/uptime
    riêng; `~/workspace` chia sẻ nên file của hai cell
    xen kẽ nhau). Ủng hộ: runtime ghi `cell_shared_cpus`
    (cell là khái niệm có thật ở đây); các file T10 viết
    20:00:26Z–20:16:46Z (count-final-148.py 20:00:26Z,
    verify.sh 20:02:19Z, preclosing 20:04:58Z,
    suites.log 20:06:13Z, count-final 20:15:38Z, .done
    20:16:46Z) tạo thành một chuỗi làm việc LIÊN TỤC
    trên ae8f70bb — không có dấu vết session chết/khởi
    động lại giữa chừng; và KHÔNG có file nào trong
    hidden_files có mtime trong (20:16:46Z, 20:35:51Z)
    ngoài chính cờ .done — khoảng trống đúng kiểu "mọi
    session đều chết sau khi T10 đóng, trước khi đợt 149
    mở" (nhưng cell T6 reboot 20:00:33Z thì khoảng trống
    đó lại bắt đầu từ 20:16:46Z, không phải 20:00:33Z —
    khớp với cell T10, không khớp cell T6).
  - (ii) **Một máy + btime sai:** btime /proc/stat của
    boot mới sai ≥6 phút (kernel ghi btime từ đồng hồ
    tường lúc boot; nếu đồng hồ lúc boot chậm ~6+ phút
    rồi được sửa về đúng sau đó thì btime 20:00:33Z
    tương ứng reboot thật ~20:06–20:17Z). Nhưng giả
    thuyết này ĐÒI HỎI đồng hồ đơn điệu cũng chạy sai
    tương ứng (uptime 47' lúc 20:47:54Z chỉ khớp reboot
    ~20:00:54Z, không khớp reboot sau 20:06Z) — tức cần
    HAI đồng hồ cùng sai một lượng — rất khó xảy ra.
    T6 đánh giá (ii) kém khả thi hơn (i), nhưng không đủ
    bằng chứng để loại (ii) hẳn.
- **Hệ quả:** gap danh nghĩa ae8f70bb→70025d3e =
  20:00:33Z − 19:41:02Z = **1.171 s** (19'31") theo btime
  /proc/stat — **T6 KHÔNG chứng nhận, KHÔNG dùng làm
  số liệu chuỗi** (btime một đầu đang bị tranh chấp).
  Nếu reboot thật xảy ra sau 20:06:13Z (theo verify
  T10) thì gap thật > 1.511 s; nếu btime đúng thì gap
  là 1.171 s. T2-149 phải giải quyết mâu thuẫn này
  trước khi chứng nhận bất kỳ gap nào (mù mới
  ae8f70bb → 70025d3e — xem §8.3). **Chuỗi INSIDE:
  danh nghĩa OUTSIDE** (btime 20:00:33Z nằm sau biên
  trên dải #112? [17:56:01Z, 19:53:46Z] (FULL82,
  /proc/1) / [17:55:46Z, 19:53:31Z] (FULL82-alt,
  /proc/stat) khoảng 400 s — và mọi btime thật có thể
  (≥20:06:13Z theo verify T10) còn nằm xa biên trên
  hơn — nên verdict OUTSIDE là vững DÙ btime nào đúng,
  MIỄN LÀ một máy; nếu đa-cell thì khái niệm chuỗi cần
  xem lại — T2-149/T10 phán). Chuỗi INSIDE giữ 0 cho
  tới khi T2-149 xác nhận chính thức.
- **Số hiệu (TẠM, đếm chặt):** d8a11644 = #111?,
  1d610e56 = #112?, ae8f70bb = #113?,
  **70025d3e = #114?**; reboot ae8f70bb→70025d3e =
  **sự kiện #38** (theo định nghĩa gộp §10.2 đợt 133 —
  mỗi lần đổi boot_id là 1 sự kiện). Chờ T2-149 xác
  nhận.
- **Quan sát phụ cho T5-149:** `/var/log/dpkg.log`
  vẫn được ghi tới **20:45:06Z** (gói cuối
  gstreamer1.0-tools 1.24.2-1ubuntu0.2 — cùng gói cuối
  replay boot d8a11644) — tức btime+44' vẫn có hoạt
  động dpkg, chậm hơn nhiều so với replay d8a11644
  (xong btime+3'32"). T6 không kết luận replay xong
  lúc nào (thuộc T5-149) — chỉ ghi mốc để T5 đối chiếu
  (có thể replay chậm, hoặc 20:45:06Z là thao tác apt
  khác sau replay).

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI

- Trạng thái đông cứng từ T6-119 §2.3: khoảng
  **11:39:50Z → 23:45:17Z ngày 15/11 (12h05'27")**,
  **A+D đóng, B+C mở** (2 cửa sổ mở, tổng ~9h48'14"),
  **tối đa 29 reboot ẩn**. Parent đã **chấp nhận để mở**
  (QUYẾT PARENT 7 đợt 119) — T6 KHÔNG thử đóng lại.
  Ngày đúng là **15/11** (F-131-T6-1).

### 8.2 Chuỗi boot quan sát được — thêm 70025d3e (TẠM #114?); các boot #102?→#113? giữ nguyên theo T6-148 §8.2

- Bảng 10 boot cuối của T6-148 (§8.2) giữ nguyên, cộng
  thêm 1 hàng mới:

| # (tạm, đếm chặt) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #113 | ae8f70bb | 19:41:02Z 19/11 | 19'31" (1.171 s — gap #113?→#114?, KHÔNG CHỨNG NHẬN — xem F-149-T6-1) | T10-148 §10.1 (btime stat 19:41:02Z / proc/1 19:41:12Z, chênh 10 s) + T7-148 NOTES (run 148 viết lại lần 2 tại reboot #37) |
| #114 | 70025d3e | 20:00:33Z 19/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T4-149 (status ghi boot=70025d3e, attempt1/2/3) |

- **Ghi chú:** tuổi thọ ae8f70bb 1.171 s là DANH NGHĨA
  theo btime /proc/stat (20:00:33Z − 19:41:02Z) — nếu
  reboot thật xảy ra sau 20:06:13Z (theo verify T10)
  thì tuổi thọ thật > 1.511 s. T6 ghi cả hai khả năng,
  không chọn một. Boot 1d610e56 sống 390 s (quyết (g)
  đợt 148: ngắn nhất kể từ đợt 120) vẫn là boot ngắn
  nhất chuỗi gần đây — ae8f70bb sống ≥1.171 s, dài hơn
  nhiều.
- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133):** #35 (→d8a11644), #36 (→1d610e56), #37
  (→ae8f70bb) theo aggregate đợt 148 §10.2; **#38
  (→70025d3e) là sự kiện mới đợt này** — xảy ra giữa
  lúc T10-148 đóng sổ (cờ 20:16:46Z) và lúc đợt 149 mở
  (20:35:51Z) NẾU tin verify T10, hoặc lúc 20:00:33Z
  NẾU tin btime (xem F-149-T6-1). Chờ parent/T2-149
  xác nhận thời điểm + số sự kiện.
- **Full boot_id b47f7932: KHÔNG có dữ kiện mới.**
  T7: `b47f7932-ebca-447e-a015-0a6c160efd98`; T9:
  `b47f7932-ebca-4205-86a0-b71a0ab9790c` (F-143-T6-1) —
  quyết parent (g) đợt 143: **ĐỂ MỞ**, ghi cả hai bản kèm
  nguồn, không chọn một.
- **Dải #113? TẠM (T6 tính độc lập — chờ T2-149 merged
  FULL83):** KHÔNG tính được dải đáng tin cho boot sau
  70025d3e vì btime neo (20:00:33Z) đang bị tranh chấp
  (F-149-T6-1) — mọi dải neo vào btime này đều mang
  sai số chưa biết (≥6 phút). T6 không công bố dải tạm
  đợt này (khác mọi đợt trước — ghi rõ lý do thay vì
  đưa số sai). T2-149 công bố dải chuẩn sau khi giải
  quyết mâu thuẫn.
- **Khung chết #110?: CHỐT LÀM CHUẨN (17:24:10Z,
  17:27:53Z] (223 s)** theo quyết parent (b)/(g) đợt 148
  (bản 238 s theo /proc/1 bị thay thế). **Chuẩn nguồn
  btime: /proc/stat (kernel btime)** theo quyết parent
  (b) đợt 148 — T6 áp dụng xuyên suốt tài liệu này
  (gap 18.867 s, chứng nhận [18.857, 18.877] s;
  CERT 67 / FULL 82 giữ nguyên). Lưu ý: F-149-T6-1 cho
  thấy ngay cả btime /proc/stat cũng có thể mâu thuẫn
  với đọc trực tiếp — chuẩn nguồn không giải quyết được
  mâu thuẫn lần này (mâu thuẫn không phải giữa hai
  nguồn btime mà giữa btime và quan sát trực tiếp boot_id).
- **Khung chết #111? (d8a11644) + #112? (1d610e56):
  CHƯA CHỐT** — chờ merged mù #68/#69? của T2-149
  (giao theo quyết parent (g) đợt 148). T6 không quét
  mtime cho hai khung này (thuộc T2-149).

### 8.3 Mù mới ae8f70bb → 70025d3e — MỞ, giao T2-149 (số hiệu mù #70 tạm — T2-149 đánh số chính thức)

- Khoảng mù: từ heartbeat/probe cuối trên ae8f70bb tới
  probe đầu trên 70025d3e (T2-149 xác định mốc chính
  xác). Hai đoạn: A (ae8f70bb, #113? — chứa T7/T9-148
  cuối phiên + T10-148 đóng sổ + verify 20:02–20:06Z)
  / B (70025d3e, #114? — chứa đợt 149 mở 20:35:51Z +
  T4-149 attempt1/2/3 + T6-149).
- **Câu hỏi trung tâm cho T2-149 (khác mọi mù trước):
  mâu thuẫn F-149-T6-1** — merged gap có lấp được
  khoảng 20:00:33Z–20:06:13Z không (có file nào có mtime
  trong khoảng đó thuộc boot nào?), và các session
  exec-log quanh 20:00–20:17Z nói gì (phiên T10 sống
  qua reboot hay chạy trên cell khác?). Nếu merged cho
  thấy hoạt động liên tục trên ae8f70bb tới sau 20:06Z
  thì btime 20:00:33Z là sai; nếu merged cho thấy hố
  hoạt động quanh 20:00Z thì verify T10 có vấn đề về
  timestamp. T6 chỉ ghi dữ kiện, không tự kết luận.
- **Mù #68 (d8a11644 → 1d610e56) + mù #69?
  (1d610e56 → ae8f70bb) VẪN MỞ** — giao T2-149 theo
  quyết parent (g) đợt 148; T6 không đụng.
- **Chuỗi mù đóng hoàn toàn: 3 (mù #65, #66, #67)** —
  không đổi đợt này (mù #68/#69? mở; mù mới mở).
  Chuỗi INSIDE: 0 (chờ T2-149 xác nhận chính thức —
  xem §8.0).

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **20:44:49Z** (boot 70025d3e đã
  44'16" tuổi theo btime /proc/stat); đóng **21:04:40Z**
  (boot 70025d3e đã ~1h04'07" tuổi). Đợt 149 mở
  **20:35:51Z** (sched 20:35:51Z) — tức **35'18" sau
  btime boot 70025d3e (20:00:33Z)**.
- **T7-149 chưa có .done/NOTES mới lúc T6 đóng** — T7-149
  đang điều tra mẫu quyết (m) theo quyết parent (f) đợt
  148 (phạm vi: cơ chế reboot trong cửa đóng sổ làm run
  TIMEOUT và run sau chạy muộn; hạn một đợt). T6 không
  đọc started_at của run 148/149 (thuộc T7-149) — chỉ
  ghi mốc của mình để T7 đối chiếu: đợt 149 mở
  20:35:51Z trên boot 70025d3e (btime 20:00:33Z);
  **nếu run 149 started_at bị viết lại thì offset tính
  từ btime nào là câu hỏi cho T7-149, vì btime boot này
  đang bị tranh chấp (F-149-T6-1)** — T7-149 cân nhắc
  khi tính offset (ghi cả hai nguồn như mọi đợt).
- Dữ kiện cũ T7-148 để lại (xem aggregate đợt 148 §9 +
  NOTES T7-148): run 147 TIMEOUT + viết lại lần 1
  (btime + 41 s stat / + 26 s proc/1); run 148 viết lại
  2 lần trong đợt (btime + 43 s / + 35 s stat) — bằng
  chứng trực tiếp thứ 14 + 15 cho giả thuyết viết lại.
  T6 không kết luận thêm.

## 10. Dọn Xvfb: 0 Xvfb lúc mở + 0 Xvfb lúc đóng; 3 socket mồ côi của T1-149 (test xvfb-lock), 0 process Xvfb sống

- **Lúc mở (20:44Z): 0 Xvfb đang chạy, `/tmp/.X11-unix/`
  trống** (x11-open.txt). Reboot đã xóa /tmp (socket
  X188/X193 cũ của đợt 148 không còn).
- **Lúc đóng (21:04Z): 0 Xvfb đang chạy** (ps-full-close
  0 process Xvfb; `ps -eo pid,ppid,args | grep -i xvfb`
  0 dòng). **`/tmp/.X11-unix/` có 3 socket X193/X194/X195**
  (x11-close.txt, mtime 21:02:52Z) + 3 file lock
  `/tmp/.X193-lock` / `.X194-lock` / `.X195-lock`
  (cùng mtime 21:02:52Z; nội dung lần lượt PID 44618 /
  44617 / 44619 — **cả 3 PID đều đã chết**, `ps -p`
  không thấy).
- **Chủ sở hữu 3 socket: T1-149 (test xvfb-lock)** —
  `round149-t1-suites.log` ghi: "B. 3 claim song song
  đều lên Xvfb thật — :195:OK, :193:OK, :194:OK" và
  "C. không còn Xvfb nào của test chạy" — test tự xác
  nhận process đã tắt nhưng socket + lock file còn lại
  (cùng mẫu T10-148: suite tự tạo 3 socket, T10 dọn tay
  lúc đóng). **T6 không dọn socket của luồng khác**
  (không phải phạm vi T6) — ghi rõ chủ sở hữu để T1-149
  (hoặc T10-149 lúc đóng) dọn; T6 đợt sau kiểm lại
  `/tmp/.X11-unix/` còn sót không.
- **Socket X193 lúc đóng KHÔNG phải socket của T4-148**
  (bài học F-147-T6-2: không kết luận "sót" từ tên
  socket): T4-149 attempt3 dùng DISPLAY=:193 (log
  `run-webkit-t4-attempt3-70025d3e.log` 20:59:14Z "Xvfb
  :193 đã lên") nhưng Xvfb của attempt3 đã tắt cùng
  attempt (release 21:03:36Z); 3 socket mtime 21:02:52Z
  trùng giờ test xvfb-lock của T1-149 (21:02Z) — số
  display :193 chỉ là trùng số do Xvfb cấp lại. T6 đã
  đối chiếu log + mtime trước khi kết luận.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-149;
  T2-148 boot-verify ghi MemAvailable 938.000 kB lúc
  17:42:32Z trên boot cũ — không dùng cho boot mới).
  Inotify: `max_user_watches` = **63747** lúc đóng
  (khớp đợt 147/148 — không có lần flip mới trong phiên
  T6; chuỗi flip-flop 63.747 → 63.756 → 63.747 qua 3
  boot giữ nguyên; quyết parent (m) đợt 146: ghi làm
  chú thích, không hành động).

## 11. Tuân thủ lock của luồng đo đợt 149 tới nay

- **T4-round149 acquire + release sạch ×3 trong phiên T6**
  (attempt #22, holds 249 / 276 / 274 s — xem §2/§3).
  T4 dùng script repo (thứ tự ghi mới). Attempt JSON
  attempt1/2/3-70025d3e đã có; marker attempt-done
  attempt1/2 đã có, attempt3 chưa có lúc T6 đóng (T4
  đang phân tích — T6 đợt 150 đếm tiếp nếu T4 chạy
  attempt4). Lượt yên #22: đang đo (quyết parent (h)
  đợt 148: #21 ĐÓNG, #22 mở đợt 149) — verdict thuộc
  T4-149/T10-149.
- **T8-round149 chưa acquire lúc T6 đóng** (0 dòng
  t8-round149 trong log; thư mục round149-t8 đã có
  o8-driver/run-webkit/scripts + smoke/ — đang chuẩn
  bị). O8 chạy sau cờ T4 theo quyết parent (c)/(j) đợt
  148 (tuân từ đợt 149 trở đi — lệch lại thì giữ chuỗi
  WebKit FULL PASS 6). T6 đợt 150 đếm tiếp.
- **T1-round149 đã chạy lại suite 27 mục + `npm test`**
  (round149-t1-suites.log + t1-npm-test.log đã có lúc
  T6 đóng; t1-count-final-148-recount.txt đã có) —
  `npm test` nay thuộc suite chuẩn của T10 từ đợt 149
  (quyết parent (k) đợt 148 — giao sửa pixelate ưu tiên
  cao + chạy lại `npm test` đầy đủ; T1 chạy trước, T10
  chạy lúc đóng). Verdict `npm test` thuộc T1/T10-149.
  T1 cũng tạo 3 socket Xvfb mồ côi (xem §10).
- **T10-round149 chưa mở lúc T6 đóng** (chưa chuẩn bị
  bản frozen lock script — T6 đợt sau kiểm md5 khi T10
  chuẩn bị).
- **T2/T5/T7/T9-149 đang chạy** (đã có thư mục
  round149-t2/t5/t7/t9); chưa có .done nào lúc T6 đóng
  (T6 là cờ đầu tiên của đợt 149).
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Đường dẫn đúng `apps/web/src/preview.tsx`.
- **O8 WebKit:** T8-148 O8 PASS (quyết parent (c) đợt 148:
  CHẤP NHẬN trích dẫn dù lệch quyết (j); chuỗi WebKit
  FULL PASS 5 → 6 với lệch chuẩn ghi rõ). O8 đợt 149
  chưa chạy lúc T6 đóng — verdict thuộc T8-149/T10-149.
  T6 không điều tra O8.
- **T5-149 (replay boot 70025d3e):** dpkg.log vẫn ghi tới
  20:45:06Z (xem §8.0) — verdict replay thuộc T5-149.
- **T7-149 (điều tra mẫu (m)):** đang chạy theo quyết
  parent (f) đợt 148 (hạn một đợt); T6 không can thiệp
  (xem §9).

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-149-T6-1, F-149-T6-2,
  F-149-T6-3 (mới, xem dưới).** Không có sai số đếm nào
  của T6 đợt này: số mở của T6 khớp đúng số T6-148 đếm
  lúc đóng cộng 10 chu kỳ hoàn tất + 1 RELEASED wall45
  (1295 chính thức lúc mở, từng loại khớp đúng — KỂ CẢ
  số queue file 100, T10-148 đã đếm bằng `ls | wc -l`
  theo bài học F-145-T6-1; T1-149 recount chưa có lúc
  T6 đóng — T10 gộp kiểm lại).
- **F-149-T6-1 — Mâu thuẫn boot/btime: T10-148 verify
  trực tiếp ae8f70bb lúc 20:02:19Z + 20:06:13Z vs btime
  boot mới 70025d3e 20:00:33Z (mới — mâu thuẫn dữ kiện,
  không phải lỗi đếm của T6):** ba nhóm độc lập: (a)
  T10-148 suites.log đọc LIVE boot_id ae8f70bb hai lần
  (20:02:19Z + 20:06:13Z, mtime file khớp timestamp nội
  dung); (b) boot mới btime /proc/stat 20:00:33Z +
  /proc/1 20:00:44Z + journal first entry 20:00:44Z +
  uptime khớp btime trong 0,39 s; (c) đồng hồ tường hiện
  tại đúng (+2/+3 s vs 3 server). (a) và (b) không thể
  cùng đúng trên một máy. Hai giả thuyết: đa-cell
  (khả thi hơn — xem §8.0) hoặc btime sai (đòi hai đồng
  hồ cùng sai — kém khả thi). **T6 không tự chốt; gap
  1.171 s KHÔNG chứng nhận; mù mới giao T2-149; số
  #114? TẠM; dải #113? KHÔNG công bố đợt này.** T10/
  parent phán sau khi T2-149 điều tra. (Cùng họ với
  F-148-T6-2 (lệch nguồn btime 15 s) nhưng NẶNG HƠN:
  lần này mâu thuẫn là giữa btime và quan sát trực tiếp
  boot_id, không phải giữa hai nguồn btime — chuẩn
  /proc/stat theo quyết (b) đợt 148 không giải quyết
  được.)
- **F-149-T6-2 — T7 flaky TÁI DIỄN lần thứ hai liên tiếp
  (mới — tính flaky đã biết, không phải lỗi lock; ĐÃ
  ĐIỀU TRA XONG):** lần 3 FAIL `T7 poll: B1=3 B2=3`;
  lần 1 + lần 2 đều 9/9 PASS. Điều tra (§6.3–§6.4):
  nguyên nhân gốc = poll đếm blockers toàn hệ thống
  không giới hạn phạm vi + churn process vite/WebKit
  của luồng khác trong cửa sổ ~2 s giữa hai poll; tái
  hiện được 2 lần (rel51 Δ=3, rel53 Δ=2) đúng lúc T4
  tắt stack; 52/54 lần chạy kiểm soát PASS (giả luôn
  được đếm, B1 = nền+1). **T6 không tự sửa script test
  (quyết thuộc parent — xem §6.5, ba phương án A/B/C).**
  Chuỗi "xanh kép" của T7 nay là 0 (tính lại từ đợt
  150); chuỗi suite xanh về bản chất vẫn giữ (31 lần
  liên tiếp không fail ngoài T7 flaky).
- **F-149-T6-3 — Prune điều (b) KHÔNG kích hoạt, 0 file
  xóa (mới — kết quả đúng của luật, không phải lỗi):**
  lần đầu sau 3 lần kích hoạt liên tiếp (146 xóa 1,
  147 xóa 1, 148 xóa 2) điều (b) không kích hoạt — vì
  tổng đúng bằng trần mềm 100 (không vượt) và 0 file
  cooldown mới trong phiên T6. Quy luật F-147-T6-1
  (điều (b) xóa file cũ nhất TRƯỚC khi đủ 7 ngày) tạm
  dừng một nhịp: `cooldown-s4-w2` sống sót thêm một
  đợt (đủ 7 ngày theo đồng hồ tường ~21/11 21:08Z,
  theo `find` ~22/11 21:08Z). Nếu T8-149 thêm file mới
  (tổng 101) thì prune đợt 150 kích hoạt (b) và xóa
  `cooldown-s4-w2` trước khi đủ 7 ngày. Ghi nhận, không
  đổi luật (luật thuộc parent).
- **F-148-T6-1 (cũ, nhắc lại):** dự báo "file cũ nhất đủ
  7 ngày ~21/11 21:08Z" của T6-147 không còn đối tượng
  (file đã bị xóa theo điều (b) trước khi đủ 7 ngày) —
  **lần thứ ba liên tiếp điều này xảy ra ở đợt 148**.
  Đợt này quy luật TẠM DỪNG (xem F-149-T6-3): file cũ
  nhất còn lại (`cooldown-s4-w2`) vẫn sống và vẫn giữ
  mốc đủ 7 ngày ~21/11 21:08Z (theo đồng hồ tường).
- **F-148-T6-2 (cũ, ĐÃ ĐƯỢC PARENT QUYẾT ở đợt 148
  §12.3(b)):** chuẩn nguồn btime **ĐỔI SANG /proc/stat
  (kernel btime)** làm chuẩn; gap = 18.867 s, chứng
  nhận [18.857, 18.877] s; CERT 67 / FULL 82 giữ nguyên
  (số lượng không đổi); khung chết #110? CHỐT 223 s
  theo /proc/stat (quyết (g)). T6 đợt này áp dụng
  /proc/stat xuyên suốt. Lưu ý mới: F-149-T6-1 cho thấy
  chuẩn nguồn không giải quyết được mâu thuẫn lần này.
- **F-148-T6-3 (cũ, đã khắc phục):** quét mtime lần đầu
  194 file, quét lại 164 file do luồng khác viết lại
  file giữa hai lần quét — T6 đợt này KHÔNG quét mtime
  khung chết (khung #110? đã chốt; khung #111?/#112?
  thuộc T2-149) nên không lặp lại.
- **F-148-T6-4 (cũ, nhắc lại):** claim "0 reboot trong
  phiên" của đợt 147 ĐÃ SAI theo nghĩa chặt (reboot #35
  trong lúc T10-147 đóng sổ) — đính chính đã có trong
  GAP §77 + entry MEMORY đợt 148 (quyết parent (l) đợt
  148: THÊM GHI CHÚ ĐÍNH CHÍNH, không sửa hồ sơ đã đóng).
  T6 đợt này ghi đúng: reboot #38 xảy ra trong lúc
  T10-148 đóng sổ HOẶC lúc 20:00:33Z (xem F-149-T6-1)
  — không claim "0 reboot" khi chưa đủ bằng chứng.
- **F-147-T6-2 (cũ, đã khắc phục):** grep ps lúc đóng suýt
  đọc sai 2 node process của T1-147 — T6 đợt này đã đối
  chiếu ppid/log/mtime trước khi kết luận ở cả hai
  snapshot (§1: cây attempt của T4-149; §10: 3 socket
  X193/194/195 thuộc T1-149, không phải T4-148) — không
  lặp lại lỗi đọc vội.
- **F-147-T6-3 (cũ, đã được T10-147 xác minh + parent quyết
  ở đợt 147):** T6 không tự tính lại p10/p90 FULL80 và
  mean CERT65/FULL80 từ log gaps thô — T6 đợt này vẫn
  lấy p10/p90 từ LIMITS T2-147/T2-148 và đối chiếu bằng
  code; **đợt này T6 KHÔNG công bố dải tạm cho boot sau
  70025d3e** (btime neo đang bị tranh chấp — xem §8.2).
  Verdict INSIDE/OUTSIDE chờ T2-149 xác nhận chính thức
  (§8.0); T10 gộp kiểm lại. Không tự chứng nhận gap
  ae8f70bb→70025d3e.
- **F-146-T6-1 (cũ, đã được T10-146 xác minh + parent quyết
  ở đợt 146):** T10-144 ghi nhầm queue 116 file (thực tế
  98; 116 là số event COOLDOWN trong log). Phương pháp
  đếm queue bằng `ls | wc -l` giữ nguyên. T6-149 xác
  nhận tiếp: số mở đợt này (100 file) khớp đúng số
  T10-148 (100 file lúc đóng đợt 148 — T10-148 §10.4
  ghi lock TRỐNG; queue 100 sau prune đợt 148).
- **F-146-T6-2 (cũ, đã khắc phục):** bản nháp ghi sai số
  chu kỳ mới 11/64, đúng là 12/75 — đã sửa trước khi stage
  đợt 145. T6 đợt này đếm chu kỳ bằng TICKET sau snapshot
  (13 chu kỳ hoàn tất, §3) — không lặp lại.
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
  0 giữ nguyên qua đợt 148). T6 đợt này ghi danh nghĩa
  70025d3e OUTSIDE dải #112? (xem §8.0) nhưng chờ T2-149
  xác nhận chính thức — không tự thay số chuẩn (vẫn là 0
  cho tới khi T2-149 xác nhận).
- **F-144-T6-2 (cũ, ĐÃ ĐƯỢC GIẢI QUYẾT ở đợt 144):** gap
  T2-144 prereg 7.280 s lệch 60 s so với 7.220 s tính từ
  btime — T2-144 xác minh lại bằng code (F-144-T2-8) và
  chứng nhận gap [7.210, 7.230] s theo số đúng; CERT 64 /
  FULL 79 đã được quyết parent (c) đợt 144 XÁC NHẬN.
  (Cùng họ với F-148-T6-2 đợt này: lệch nguồn btime 15 s
  — đã chốt chuẩn /proc/stat ở quyết (b) đợt 148.)
- **F-144-T6-3 (cũ, đã khắc phục):** grep "KHÔNG NHẢ" lần
  đầu loại sai file repro theo basename. T6 đợt này loại
  CHỈ file grep-output ngay từ lần đầu và trừ tay 3 dòng
  repro của chính mình (§5) — không lặp lại; tổng 8 dòng
  khớp đúng số học lăn.
- **F-144-T6-4 (cũ, đã khắc phục):** md5 bản đã lọc ghi sai
  trong bản nháp. T6 đợt này lấy md5 CHỈ từ file snapshot
  (raw-open `4099ba18…`, cleaned-open `14a797a6…`,
  raw-close `96ca3880…`, cleaned-close `198e51d4…` — mở ≠
  đóng do +9 dòng trong phiên, §2) — không lặp lại.
- **F-143-T6-1 (cũ, đã được parent quyết ở đợt 143):**
  xung đột đánh số (c)/(d) + mâu thuẫn full boot_id
  b47f7932 — quyết parent (c) đợt 143: **CHỌN CÁCH ĐẾM
  CHẶT làm chuẩn từ đợt 144** (b47f7932 = #103?,
  9afdaa89 = #104?, 70a5b0fc = #105?, 691a7403 = #106?,
  cc222c8a = #107?, e146ca67 = #108?, 98a7c93f = #109?,
  6fb582df = #110?, d8a11644 = #111?, 1d610e56 = #112?,
  ae8f70bb = #113?, 70025d3e = #114? — số sau theo đếm
  chặt đợt này, TẠM); quyết parent (g) đợt 143: **full
  boot_id b47f7932 ĐỂ MỞ** (ghi cả hai bản T7/T9 kèm
  nguồn, không chọn một). T6 đợt này áp dụng đếm chặt
  trong toàn bộ tài liệu và ghi nhận full boot_id vẫn để
  mở (§8.2) — không lặp lại phần chưa quyết.
- **F-142-T6-1 (cũ, đã giải quyết ở đợt 142):** mâu thuẫn
  nhãn reboot #25/#26 — aggregate đợt 142 §12.2(c) đã chốt
  #26 theo cách đếm của T10 (mỗi lần đổi boot_id là 1 sự
  kiện, kể cả reboot trong lúc đóng sổ). Không lặp lại ở
  đợt này: T6-149 ghi đúng sự kiện #38 theo chốt đó
  (với caveat thời điểm — xem F-149-T6-1).
- **F-142-T6-2 (cũ, đã khắc phục):** grep "KHÔNG NHẢ" lần
  đầu trả 33 dòng do chưa loại file grep-output. T6 đợt
  này loại `khong-nha-grep.txt` NGAY từ lần đầu (§5) —
  không lặp lại.
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
  Không lặp lại ở đợt này: T6-149 ghi đúng boot sống
  70025d3e (khớp T4-149 status + file attempt
  *-70025d3e + T6 đo trực tiếp).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn; tổng 17 không đổi. T6-149 đã đếm lại đúng (§5:
  trích dẫn = 0 — các file `.done` của T6 viết không dấu
  nên không khớp pattern có dấu; đã giải thích phương pháp
  ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **Số hiệu boot mới (#102?→#114?) VẪN TẠM (xem §8.2):**
  chuỗi tương đối #57→#114? + 70025d3e đã chốt ở mức
  quan sát được (52 boot, tính cả b47f7932 = #103?
  chặt); số tuyệt đối giữ "?" vì (a) mù #37 tối đa 29 ẩn
  (+ mù #38 G mở tối đa 6, mù #29/#30/#31 +4 — T5-120:
  "#60" tạm có thể tới #123); (b) mù #49 đoạn B mở, tối
  đa 1 ẩn; (c) mù #51 đoạn B mở, tối đa 3 ẩn; (d) mù #52
  đóng hoàn toàn nhưng không làm neo được; (e) dị thường
  đồng hồ #84?→#85? (§8.4(b) đợt 134) + dị thường đồng hồ
  quanh 23:54Z (§8.6/§8.8 T6-143) + dị thường đồng hồ ≥23 s
  ở reboot #34 (§3/§8.6 đợt 147) + **dị thường btime 15 s
  ở reboot #35 (F-148-T6-2) + MÂU THUẪN boot/btime ở
  reboot #38 (F-149-T6-1 — nặng nhất từ trước: btime vs
  quan sát trực tiếp, không phải lệch nguồn)**;
  **(f) MỚI: mù #67 ĐÃ ĐÓNG HOÀN TOÀN (quyết parent (b)
  đợt 148 — chuỗi mù đóng hoàn toàn lên 3; gap 18.867 s
  chứng nhận [18.857, 18.877] s theo /proc/stat → CERT
  67 / FULL 82) + mù #68 + #69? MỞ (giao T2-149) + mù
  mới ae8f70bb→70025d3e MỞ (giao T2-149); chuỗi INSIDE
  chờ T2-149 xác nhận chính thức (T6 ghi danh nghĩa
  OUTSIDE — xem §8.0); mù #56 A vẫn MỞ (quyết parent
  (e)) — số #93? cũng vẫn quy ước headline**. Journal/wtmp
  chỉ giữ boot hiện tại (journal `--list-boots` chỉ 1 dòng
  70025d3e; wtmp bắt đầu 20:00:44Z) nên T6 suy ra số hiệu từ
  thứ tự thời gian + hồ sơ các đợt trước, không phải từ log
  hệ thống.
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
  **mù #68 + #69? MỞ** (giao T2-149, quyết parent (g)
  đợt 148) + **mù mới ae8f70bb→70025d3e MỞ** (giao
  T2-149 — xem §8.3); mù #52 đã đóng hoàn toàn (T2-133);
  mù #54 đã đóng hoàn toàn (T2-135).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  flaky 1/3 lần chạy suite (lần 3 FAIL B1=3 B2=3) — lần
  flaky thứ hai liên tiếp. **Đã điều tra xong đợt này
  (F-149-T6-2): nguyên nhân gốc là thiết kế test đếm
  không giới hạn phạm vi + churn WebKit của luồng khác;
  tái hiện được 2 lần; đề xuất sửa ở §6.5 (quyết thuộc
  parent).** T6 không tự đổi test.
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round147-t*/` (toàn đợt) +
  `round148-t*/` (toàn đợt) + `round149-t*/` tới 21:04Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T8/T10-149 chưa chạy xong tới thời điểm đếm; T6
  đợt 150 đếm tiếp.
- **Prune cooldown lần 24 áp dụng: xóa 0 file**
  (0 file đủ 7 ngày theo điều (a); tổng đúng bằng trần
  mềm 100 nên điều (b) không kích hoạt — xem §7 và
  F-149-T6-3). Tổng sau prune 100 file. File cũ nhất còn
  lại đủ 7 ngày theo đồng hồ tường ~21/11 21:08Z,
  theo `find` ~22/11 21:08Z — T6 các đợt sau đếm tiếp.
- **Đợt 148 khép sạch trên lock (§4):** 13 chu kỳ (3 trong
  phiên T6-148 + 10 sau đó: t4 wall45 ×1 + t4 attempt ×3
  + t8 ×6) sạch — T6 đợt này đếm bổ sung bằng TICKET
  từng chu kỳ, khớp đúng recount T10-148;
  **đợt 149 tới 21:04Z có 3 chu kỳ sạch + 0 đang giữ**
  (t4 attempt1/2/3 #22) — T6 đợt 150 đếm tiếp. Không phải
  bug lock.
- **Kiểm vite.lock.queue + lock LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 21:04Z (lock TRỐNG, 0 ticket + 100 cooldown
  sau prune); đợt còn chạy tới ~23:30Z, **T10
  đóng đợt sẽ recount lại lúc đóng** (như đợt 124–148
  T10 đã đếm lúc đóng). T6 không chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 119 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt boot 70025d3e: dpkg.log vẫn ghi tới
  20:45:06Z** (xem §8.0); verdict replay thuộc T5-149.
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`,
  `test-v2-t6-run2.log` và `test-v2-t6-run3.log` (9/9 rồi
  9/9 rồi 8/9-T7). Thư mục repro /tmp của T6 đã dọn sạch
  sau khi xong (bản fixed in "TDIR cleaned"). **Ngoại lệ
  điều tra T7:** script `t7-investigate.sh` + log
  `t7-investigate.log` + 54×2 file snapshot ps
  (`t7-inv-ps-*-before/after.txt`) ĐƯỢC GIỮ trong
  `round149-t6/` (không nằm /tmp) — bằng chứng tái hiện
  FAIL rel51/rel53.
- **T2-149 CHƯA XONG lúc T6 đóng (21:04Z):** chưa có .done/
  LIMITS (T2 đang điều tra mù #68/#69? + mù mới). Theo
  brief, T6 ghi rõ "chờ T2" và để T10 gộp — KHÔNG tự suy
  đoán số boot #112?→#114?, không tự chứng nhận gap
  ae8f70bb→70025d3e, không tự chốt khung chết #111?/#112?,
  không tự công bố dải #113?. T6 chỉ ghi thêm quan sát
  của mình (§8: mâu thuẫn F-149-T6-1 + kiểm đồng hồ 3
  server + đẳng thức (now−btime)−uptime = 0,39 s + file
  T10 mtime 20:00:26Z–20:16:46Z) để T2-149 cân nhắc.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).
- **Trần inotify 63747 — ghi làm chú thích chuẩn chuỗi,
  không hành động (quyết parent (m) đợt 146):** T6 đo
  63747 lúc đóng (21:06Z) trên boot 70025d3e; T5-149
  POSTBOOT_PASS chưa có lúc T6 đóng (T9-149 đo chính
  thức); chuỗi flip-flop 63.747 → 63.756 → 63.747 qua 3
  boot giữ nguyên, không có lần flip mới trong phiên T6
  (giá trị ổn định 63747 suốt phiên, khớp đợt 147/148).
  Không hành động.

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND149_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), Xvfb (0 process lúc mở +
0 process lúc đóng; `/tmp/.X11-unix/` có 3 socket mồ côi
của T1-149 lúc đóng — T6 không xóa gì).
File cooldown: prune đã chạy, **xóa 0 file** (điều (a) 0
ứng viên; điều (b) không kích hoạt — tổng đúng bằng trần
mềm 100; xem §7); `cooldown-t4` do release hợp lệ của
t4-149 ghi đè 3 lần (xem §3).
Stage: `repo-1-push/paths-loop/phase9-round149-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back + od -c).
Dữ liệu thô: `hidden_files/round149-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, x11-open.txt, x11-close.txt,
boot-verify-open.txt, boot-verify-close.txt, time-open.txt,
time-close.txt, wc-open.txt, wc-close.txt,
analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
vite-lock-v2-raw-open.log, vite-lock-v2-raw-close.log,
analyze-log.py, cooldown-now-open.txt, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log,
test-v2-t6-run3.log, repro-newmsg-fixed149.sh,
repro-newmsg.log, t7-investigate.sh, t7-investigate.log,
t7-inv-ps-*-before.txt, t7-inv-ps-*-after.txt,
md5-open.txt, md5-close.txt).
