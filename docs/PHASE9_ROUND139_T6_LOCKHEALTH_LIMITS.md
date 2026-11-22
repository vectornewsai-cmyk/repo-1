# PHASE9 ROUND139 T6 — lock health + prune lần 14 + BOOT #96? NGOÀI DẢI CHUẨN, TRONG DẢI CƠ HỌC — LIMITS

- Đợt: 139, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 21:35 +07 18/11/2026 (= 14:35:51Z). Chạy 14:39:52Z →
  14:51:33Z 18/11/2026, toàn bộ trên một boot duy nhất #96?
  (541524e2) — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune, suite kiểm lock 9/9 ×2, chốt
  chuỗi boot với boot #96? 541524e2 (btime 13:53:41Z — ĐÍNH
  CHÍNH số 14:03:07Z trong brief/round-in-progress.md, xem §8.0),
  đối chiếu dải dự báo #96? (chuẩn T2 FULL70 vs cơ học neo #95?),
  khung chết #95? ứng viên, ghi mọi sai số F-139-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round139-t6/` (status-open.txt,
  status-close.txt, ps-full-open.txt, ps-full-close.txt,
  ss-open.txt, ss-close.txt, analyze-log-cleaned-open.txt,
  vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-close.log, analyze-log.py,
  cooldown-now.txt, prune-candidates.txt, prune-deleted.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg-fixed.sh,
  repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT #96? (số tạm theo quy ước, xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `541524e2-c789-420b-a27b-9287d68c63a3`, btime 13:53:41Z**
  (`/proc/stat` btime epoch 1795010021; `uptime -s` =
  13:53:41Z; `who -b` = Nov 18 13:53; `/proc/1` 13:53:52Z —
  chênh +11 s, cùng mẫu các boot trước; `journal --list-boots`
  chỉ 1 dòng 541524e2, first entry 13:53:53Z; `wtmp` bắt đầu
  13:53:xxZ). Uptime ~46' lúc T6 bắt đầu (14:39:52Z),
  ~58' lúc đóng (14:51:33Z). Đây là **reboot #95?→#96? —
  ứng viên sự kiện gộp #20** (xảy ra sau lần đo cuối của
  T10-138 13:47:01Z, trước khi round138 .done được ghi
  14:01:14Z — xem §8.0).
- **ĐÍNH CHÍNH btime (mới, quan trọng): brief giao cho T6 và
  `round-in-progress.md` đều ghi "btime 14:03:07Z" — SAI.
  Btime thật là 13:53:41Z, chênh −566 s.** Bằng chứng độc
  lập (5 nguồn + T2/T4/T5): /proc/stat, uptime -s, journal
  first entry, /proc/1, T2-139 boot-verify.txt (uptime -s
  13:53:41, btime 1795010021), T4-139 poll-t4.log (btime=
  2026-11-18T13:53:41Z), T5-139 t5-start.txt (btime_kernel
  1795010021). Nguồn của 14:03:07Z: build-loop-log.md dòng
  7259/7268 (parent ghi "boot mới 541524e2 lúc 14:03:07Z
  (parent verify 14:04:50Z)") — tức 14:03:07Z là thời điểm
  parent PHÁT HIỆN/xác minh boot mới, không phải btime;
  ghi nhầm thời điểm phát hiện thành btime. **T2-139 prereg
  đã phát hiện độc lập cùng mâu thuẫn này** (chênh 566 s,
  lấy 13:53:41Z làm chuẩn làm việc).
  **Bổ sung — T1-139 F-139-T1-1 (verify độc lập, đã kiểm
  chứng):** T1 xác minh btime 13:53:41Z (epoch 1795010021)
  bằng 4 nguồn độc lập khớp nhau: (1) /proc/stat btime;
  (2) journal first entry 13:53:53Z (boot+12 s, đúng mẫu
  +12–16 s của mọi boot trước); (3) `who -b` 13:53 +
  `uptime -s` 13:53:41Z + uptime 49 phút lúc 14:43:23Z;
  (4) thời gian sinh `/` 13:53:51Z (boot+10 s — nguồn này
  T6 chưa kiểm, T1 kiểm độc lập). T1 cũng xác nhận marker
  round-in-progress đã được sửa. Mọi gap/dải dưới đây
  dùng 13:53:41Z. Nếu btime thực là 14:03:07Z thì gap
  #95?→#96? dịch +566 s (7.847 s) nhưng verdict hai dải
  không đổi (T2-139 prereg §2 — T6 xác nhận độc lập).
- **Câu "0 reboot trong phiên đóng sổ" ở aggregate đợt 138
  §10.2 đã LỖI THỜI (theo T1-139 F-139-T1-1):** câu này
  được viết lúc soạn nháp aggregate ~13:50Z (đúng lúc đó,
  xem F-138-T10-4) rồi bị reboot 13:53:41Z làm sai, không
  được sửa lại. Phiên đóng sổ của T10 ĐÃ bị reboot cắt —
  thư mục `round138-t10/` không có file nào sau 13:47:01Z
  (T1 kiểm); hai file bằng chứng T10 trích dẫn trong §10.2
  (`t10-closing-checks.txt`, `t10-started-at-138.txt`) KHÔNG
  có trên đĩa (F-139-T1-6 — nhiều khả năng T10 chưa kịp lưu
  file output thì phiên bị reboot cắt). T1 nêu rõ: đính
  chính thuộc về log đợt 139, KHÔNG sửa ngược log đợt 138
  đã đóng — đính chính này trong LIMITS T6-139 (§8.0) +
  LIMITS T1-139 (§6) chính là bản đính chính đó; T6 không
  sửa aggregate đợt 138 hay build-loop-log của parent.
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline.
- Các luồng đợt 139 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round139-t1/t2/t4/t5/t7/t9/t10; T2-139 đã viết
  prereg + chạy probe #58 14:44:16Z nhưng CHƯA viết LIMITS/
  .done lúc T6 đóng — T6 đối chiếu ở §8 với prereg-t2.md,
  không đọc nội dung cờ của luồng khác ngoài file T2 phục vụ
  đối chiếu; T4-139 đã acquire 1 chu kỳ lúc 14:48:38Z, §4).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật — 0 cổng lạ (lúc mở và lúc đóng)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 14:40Z
  (mở, `ps-full-open.txt`) và lúc 14:51Z (đóng,
  `ps-full-close.txt` — chụp lại sau chu kỳ T4-139, §4).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: cả 2 lần **không có cổng TCP nào đang lắng
  nghe** (chỉ dòng header).
- **0 tiến trình vite/node/webkit/chromium thật** ở cả 2
  snapshot (dòng khớp "vite|node|webkit|chromium" duy nhất
  lúc đóng là chuỗi lệnh shell của chính poller T4-139
  (`sleep 540; ... grep -E "poll-wait-t4-139|t4-attempt|vite"`)
  — không phải process vite; lúc mở dòng duy nhất tương tự
  là lệnh đo của chính T6; đã đối chiếu trực tiếp từng dòng).
- **0 tiến trình lock-script nào đang chạy** ở cả 2 snapshot.

## 2. Lock lúc mở và lúc đóng: TRỐNG cả hai lần; 1 chu kỳ T4-139 giữa phiên

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 14:40Z (mở) và lúc 14:51Z (đóng) — không có file owner
  stale nào, không cần dọn lock stale. (Kiểm trực tiếp bằng
  `ls -ld`; xem thêm F-139-T6-1 về một lần gọi status sai
  tham số — không ảnh hưởng kết luận này.)
- `status` (gọi ĐÚNG, không override `VITE_LOCK_DIR`):
  `TRỐNG (không có lock)`, `0 ticket + 87 cooldown`, rc=0
  lúc đóng. Lúc mở T6 gọi status với `VITE_LOCK_DIR` đặt sai
  (= thư mục hidden_files) nên status in "dir tồn tại, tuổi
  24s" — đó là tuổi của chính thư mục hidden_files, không
  phải lock dir (xem F-139-T6-1); đếm queue lúc mở vẫn đúng
  (0 ticket + 87 cooldown) vì `VITE_LOCK_QUEUE_DIR` đặt đúng.
- **Log lock ĐỔI giữa mở và đóng: +3 dòng = đúng 1 chu kỳ
  mới của T4-139** (14:48:38Z TICKET → ACQUIRED port 5187 →
  14:48:44Z RELEASED hold_s=6 — xem §4). Trước chu kỳ đó,
  dòng cuối là `2026-11-18T13:47:01Z t10-round138 RELEASED
  hold_s=115` (đợt 138). Không có acquire/release nào khác
  trong phiên T6.
- Khoảng yên trước chu kỳ T4: không có event lock nào từ
  13:47:01Z (T10-138 release) tới 14:48:38Z — yên lặng này là
  do đợt 138 đã đóng và đợt 139 mới mở + reboot xen giữa —
  không phải do lock kẹt (bằng chứng: chu kỳ T4-139 acquire
  ngay khi cần, wait_s=0, §4; suite độc lập 9/9 ×2, §6).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 21 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 2 chu kỳ mới kể từ
  lúc T6-138 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED, file
  cooldown được ghi — xem §4):
  - t10-round138 ×1 (13:45:06Z, hold 115 s),
  - t4 (đợt 139) ×1 (14:48:38Z, hold 6 s).
  - Cộng với 19 chu kỳ T6-138 đã đếm = **21 chu kỳ liên
    tiếp sạch trên thứ tự mới**.
  - Bằng chứng phiên bản: T10-138 dùng bản frozen
    `round138-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
    (kiểm trực tiếp đợt này); T4-139 dùng script repo
    (`run-attempt-139.sh` dòng 13:
    `LOCKV2=.../vcut-vite-lock-v2.sh`, md5 `520b8baa` lúc
    kiểm).
- **File `cooldown-t4` mtime 14:48:44Z** (release hợp lệ của
  t4-139 — xem §4; ghi đè cùng tên nên tổng số file không
  đổi, vẫn 87); file `cooldown-t10-round138` mtime 13:47:01Z
  (release hợp lệ của t10-138).

## 4. Nhất quán log lock: 952 dòng chính thức lúc T6-138 đóng → 958 lúc T6-139 đóng, 277 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z,
dòng 848–853 thô). 847 dòng đầu của bản đã lọc có md5
`9048174e…` — khớp đúng snapshot đã lọc của
T6-132/T6-133/T6-134/T6-135/T6-136/T6-137/T6-138 (chuỗi không
đứt). Lúc mở (14:40Z): **961 dòng thô / 955 chính thức**;
lúc đóng (14:51Z): **964 dòng thô / 958 chính thức** — diff
bản đã lọc lúc đóng so với lúc T6-138 đóng: **đúng +6 dòng
append** (2 chu kỳ mới), không có dòng nào khác thay đổi.

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-138 (952) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 292 | 290 | 201 | 195 |
| ACQUIRED | 283 | 281 | 201 | 195 |
| RELEASED | 277 | 275 | 199 | 193 |
| COOLDOWN | 91 | 91 | 83 | 78 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **958** | **952** | **685** | **662** |

- So với snapshot T6-138 đóng (952 dòng): **+6 dòng =
  TICKET +2 / ACQUIRED +2 / RELEASED +2 / COOLDOWN +0 /
  TIMEOUT +0 / STALE +0** — đúng bằng 2 chu kỳ mới:
  t10-round138 ×1 (hold 115 s) = 3 dòng (không có COOLDOWN
  mới vì tên `cooldown-t10-round138` là tên riêng mới — có
  file cooldown mới nhưng không có dòng COOLDOWN vì port
  5554 chưa từng giữ trước đó trong đợt; dòng COOLDOWN chỉ
  ghi khi acquire phải chờ cooldown) + t4-139 ×1 (hold 6 s)
  = 3 dòng (ghi đè `cooldown-t4` cùng tên). Mọi chu kỳ đều
  sạch, ghép cặp đủ — khớp từng con số, không có event nào
  mất dấu hay thêm lạ ngoài ca t4 cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 958 dòng): **277 cặp ACQUIRED→RELEASED;
  0 "đang giữ" theo cách ghép tham lam của script** — nhưng
  đọc kỹ: chênh ACQUIRED − RELEASED = 6 = **5 ca
  double-acquire đã biết + 1 ca t4 mồ côi (dòng 869,
  ACQUIRED 23:50:17Z)**. Dòng 869 **vẫn là ACQUIRED duy
  nhất không có RELEASED thật của chính nó** (F-134-T6-2);
  KHÔNG phải lock kẹt. 0 lần RELEASED không có ACQUIRED
  trước đó.
- 6 ca "double-acquire" trong output analyzer — **cùng
  đúng 6 ca đã biết** (5 ca cũ s3-round116, t3-round117,
  t4, t3-round119, t8-round129 dòng 781 + ca t4 dòng
  888/02:50:57Z); tất cả giải thích được bằng STALE-LOCK
  cướp sau reboot (5 ca cũ) hoặc reboot-kill (ca t4);
  **không có ca mới nào**.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11) — đợt 120+ có **0 TIMEOUT**; 5 STALE-LOCK + 1
  STALE-TICKET cũ toàn bộ từ trước đợt 120 + **1
  STALE-LOCK 09:04:38Z 17/11 do reboot #75→#76 giữa
  lượt** (đợt 130).
- Cửa sổ R120: **201 = 201 T/A, RELEASED 199** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  292+283+277+91+8+6+1 = 958 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 138 khép lại trên lock (toàn đợt): 1 chu kỳ
  (t10 ×1 hold 115 s) sạch** — T6-138 lúc đóng mới thấy 0
  chu kỳ; chu kỳ này T6 đợt này đếm bổ sung, khớp đúng
  recount T10-138 (log 961 dòng thô lúc mở đợt 139).
  **Đợt 139 tới 14:51Z có 1 chu kỳ** (t4 ×1 hold 6 s —
  attempt1 lượt yên #16; RAM đã hồi đủ gate A theo
  poll-t4.log: RAMavail 1.502 MB lúc 14:42:36Z → 2.081 MB
  lúc 14:47:07Z — số RAM thuộc T4, T6 chỉ ghi bối cảnh).
  Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 137 (toàn đợt), đợt 138 (toàn đợt) và đợt 139 (tới 14:51Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round137-t*/` + `round138-t*/` +
`round139-t*/` (tới 14:51Z) + các file `.done` tương ứng
— theo quy tắc lăn: bỏ round136, thêm round139. **Phương
pháp đếm đợt này: grep ra file /tmp trước,
`--exclude='khong-nha-grep.txt'`, rồi mới copy kết quả
vào `round139-t6/khong-nha-grep.txt`** (theo bài học race
của T6-138 §5 — file grep-output lồng nhau không được đếm
lại; grep thô không loại trừ cho 42 dòng, trong đó 30 dòng
là bản sao lồng trong 2 file `khong-nha-grep.txt` cũ).
Tổng **15 dòng khớp chuẩn, phân loại đủ 15/15 — tất cả
đều là bản sao script / log repro / trích dẫn tài liệu, 0
sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round137-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round138-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 9 | `round137-t6/repro-newmsg.log` + `round138-t6/repro-newmsg.log` + `round139-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 2 | `round137-t6.done` (1) + `round138-t6.done` (1) — câu trích số liệu T6, không phải sự kiện |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 137 (toàn đợt) / 138 (toàn đợt) / 139 nào |
| Round139-t* (trừ repro /tmp của T6) | 0 dòng | T4-139 acquire 1 chu kỳ sạch (§4); T1/T2/T3/T5/T7/T8/T9/T10-139 không dùng lock tới lúc đếm |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt
  122 = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125
  = 0 (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0
  (toàn đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn
  đợt), đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt),
  đợt 132 = 0 (toàn đợt), đợt 133 = 0 (toàn đợt), đợt
  134 = 0 (toàn đợt), đợt 135 = 0 (toàn đợt), đợt 136
  = 0 (toàn đợt), đợt 137 = 0 (toàn đợt), đợt 138 = 0
  (toàn đợt — bổ sung 1 chu kỳ sau T6-138 đóng, §4), đợt
  139 tới 14:51Z = 0.** Khớp với log pairing sạch ở §4
  (277 cặp + 1 ca reboot-kill cũ đã giải thích — không liên
  quan nhánh release).
- Giới hạn phạm vi: T8/T10-139 chưa chạy xong tới 14:51Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  139, T6 đợt 140 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-138 đếm 15 dòng (4 script + 9
  repro + 2 trích dẫn); đợt này bỏ round136 (−2 script
  −3 repro −1 trích dẫn [closing-copy] = −6) nhưng thêm
  round138-t10 script (2), round138-t6.done trích dẫn (1)
  và round139-t6 repro (3) = +6 → 15 − 6 + 6 = **15 dòng**
  ✓. (round138-t10 KHÔNG có closing-copy — T10-138 viết
  LIMITS gộp trực tiếp.)

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
#96? (`541524e2…`).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round139-t6/test-v2-t6-run1.log` 14:47:11Z,
`test-v2-t6-run2.log` 14:47:33Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ mười lăm liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — mười lăm lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ hai mươi mốt liên tiếp (T6
  đợt 120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 138 + T6
  đợt 139).

### 6.2 Repro message ĐÚNG (`round139-t6/repro-newmsg.log`, 14:47:42Z)

Copy verbatim script của T6-138, chỉ đổi tên TDIR
(`vcut-t6r138-repro` → `vcut-t6r139-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–138, kết quả giống hệt:
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
  lúc đó có 87 cooldown; log thật vẫn 961 dòng thô lúc
  repro chạy (chu kỳ T4-139 14:48:38Z xảy ra SAU khi repro
  xong 14:47:43Z) và queue vẫn 87 file sau khi repro xong;
  không có file `cooldown-tA/tH/tB` nào xuất hiện trong
  queue thật. **F-132-T6-1 KHÔNG lặp lại.**
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (277 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất
  dấu khác — số chính thức đã loại 6 dòng repro lỗi của
  T6-132), 0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy
  nhất do reboot giữa lượt (đợt 130), 0 sự kiện "KHÔNG
  NHẢ" trên lock thật đợt 120–138 (toàn đợt) và đợt 139
  (tới 14:51Z), suite 9/9 độc lập ×2 lần chạy (T7 xanh cả
  hai lần), và thứ tự ghi mới đã có **21 chu kỳ thật**
  chứng minh (§3). **Không còn caveat nào về mất dòng
  RELEASED cho các chu kỳ mới** — caveat cũ chỉ còn là 1
  dòng lịch sử (t4, §3–§4 T6-136).

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 14 liên tiếp)

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
  - 14:49Z: lock TRỐNG (status 0 ticket + 87 cooldown)
    — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng) — tổng 87 file ≤ trần
    mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 139: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 14 liên tiếp prune xóa 0 file
    (đợt 126–139: 0 mỗi đợt).
  - Lưu ý: file `cooldown-t4` mtime 14:48:44Z là **do
    release hợp lệ của t4-139 (§3), KHÔNG phải do
    prune** (prune không tạo/cập nhật file, chỉ xóa). Số
    file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (14:40Z) **87 file / 1218 byte**;
  lúc đóng (14:51Z) **87 file / 1218 byte** (87 × 14 =
  1218 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 87 + 0 = 87 ✓ (chu kỳ T4-139 ghi đè
  `cooldown-t4` cùng tên nên tổng không đổi). Không file
  nào bị xóa hay thêm giữa hai lần đếm của đợt này.
- Phân tầng tuổi lúc 14:49Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 27 file** (tăng từ 23 đợt 138 — 4 file
  mtime sáng 15/11 vừa vượt 72h giữa hai lần đếm, đúng
  quy luật tuổi, không phải thêm/xóa); **≥48h (`-mtime
  +1`): 41 file** (tăng từ 39 đợt 138 — 2 file vừa vượt
  48h, đúng quy luật tuổi). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 14:48Z mới **~92h10' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#96?; số tuyệt đối VẪN TẠM; khung chết #95? ứng viên 400 s; #96? NGOÀI dải chuẩn / TRONG dải cơ học

### 8.0 Đính chính btime boot hiện tại — 13:53:41Z, KHÔNG phải 14:03:07Z (mới)

- Brief giao T6 + `round-in-progress.md` + build-loop-log.md
  đều ghi btime 541524e2 = 14:03:07Z. **Sai: btime thật
  13:53:41Z** (epoch 1795010021) — chênh 566 s. Bằng chứng:
  /proc/stat btime, `uptime -s` 13:53:41Z, journal first
  entry 13:53:53Z, /proc/1 13:53:52Z, T2-139 boot-verify.txt,
  T4-139 poll-t4.log (btime=13:53:41Z), T5-139 t5-start.txt
  (btime_kernel 1795010021). T2-139 prereg §0 phát hiện độc
  lập cùng mâu thuẫn, cùng kết luận.
- Nguồn 14:03:07Z: build-loop-log.md (parent ghi "boot mới
  541524e2 lúc 14:03:07Z (parent verify 14:04:50Z)") — đây
  là thời điểm parent PHÁT HIỆN boot mới, bị ghi nhầm thành
  btime. Hệ quả của sai số này nếu không đính chính: gap
  #95?→#96? sẽ bị ghi 7.847 s thay vì 7.281 s (+566 s), và
  dải dự báo sau này neo sai. **T6 đính chính ở đây; T10
  cần sửa lại số này trong aggregate + build-loop-log
  (T6 không sửa log của parent).**
- Hệ quả phân loại sự kiện: reboot 914964c3 → 541524e2 xảy
  ra lúc btime 13:53:41Z — **SAU lần đo cuối của T10-138
  (13:47:01Z) nhưng TRƯỚC khi round138 .done được ghi
  (14:01:14Z)**. Build-loop-log/MEMORY ghi "1 reboot SAU
  khi đóng cờ" là **không chính xác theo nghĩa hẹp**: reboot
  xảy ra trong cửa sổ đóng sổ (sau khi T10 xong việc đo,
  trước khi cờ .done được viết). File .done (mtime
  14:01:14Z) được ghi TRÊN boot mới 541524e2 nhưng nội dung
  ghi "Boot lúc đóng: 914964c3" — nhãn này đúng cho phiên
  làm việc của T10 (kết thúc 13:47:01Z trên 914964c3) nhưng
  file .done vật lý nằm trên boot mới; cùng mẫu
  F-136-T6-1 (nhãn boot viết sau reboot). T6 ghi rõ sự
  kiện, không tự đổi nhãn của T10; T10-139 phân loại sự
  kiện gộp (ứng viên **#20**, tiếp sau #19) và quyết định
  gọi là "giữa lượt" hay "ranh giới".

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1 / T6-138 §8.1): khoảng
  **11:39:50Z → 23:45:17Z ngày 15/11 (12h05'27")**,
  **A+D đóng, B+C mở** (2 cửa sổ mở, tổng ~9h48'14"),
  **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn C). Parent đã
  **chấp nhận để mở** (QUYẾT PARENT 7 đợt 119) — T6 KHÔNG
  thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Khoảng mù #37 là 15/11 11:39:50Z → 23:45:17Z, KHÔNG phải
  16/11 — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #95? + #96?)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 / T6-138 §8.2 (mỗi
boot liệt kê với boot_id + btime lấy từ ≥1 nguồn độc lập;
btime→btime danh nghĩa = khoảng cách giữa hai btime liên
tiếp). Số thứ tự là số tạm theo thứ tự thời gian (tất cả
đều mang "?") — xem verdict §8.7. **Định nghĩa đếm dùng:
định nghĩa gộp của T10 (LIMITS gộp đợt 133 §10.2) — mọi
reboot quanh đợt, cả giữa lượt lẫn ranh giới — theo quyết
F-133-6.** Bảng dưới chỉ ghi 5 boot cuối (chuỗi đầy đủ
#57→#88 xem T6-131 §8.2 + T6-132 §8.2 + T6-133 §8.2 +
T6-134 §8.2 + T6-135 §8.2 + T6-136 §8.2 + T6-137 §8.2 +
T6-138 §8.2 — không chép lại để khỏi drift; T6 đợt này đã
đối chiếu lại với LIMITS gộp đợt 138: các boot #89?→#94?
dưới đây khớp đúng btime/boot_id T10-138 đã chốt, không có
boot_id lạ nào xuất hiện trong bất kỳ bằng chứng 18/11 nào
ngoài chuỗi này — trừ boot mới 541524e2 dưới đây).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #90 | 78b55838 | 02:27:27Z 18/11 | 56m09s (3.369 s, #89→#90 — SPAN); sống tới 03:35:20Z | T6-135 (brief + uptime/journal//proc/1) |
| #91 | bcc71e61 | 03:35:20Z 18/11 | 1h53m58s (6.838 s, #90→#91 — SPAN, xem §8.3 T6-136); sống tới 05:29:18Z | T10-135 (t10-reboot1.md; LIMITS gộp §đầu) |
| #92 | 1ca1feaa | 05:29:18Z 18/11 | 2h37m53s (9.473 s, #91→#92 — xem §8.3–§8.4 T6-137); sống tới 08:07:11Z | T6-136 + T2-136 (prereg + probe #55) |
| #93 | 2104246b | 08:07:11Z 18/11 | 1h28m50s (5.330 s — gap #93?→#94?, CHỨNG NHẬN [5.320, 5.340] s theo quyết parent đợt 138 §12.3(k)); sống tới 09:36:01Z | T6-137 + T2-137 (prereg + probe #56) |
| #94 | 17db9652 | 09:36:01Z 18/11 | 2h16m19s (8.179 s — gap #94?→#95?, chờ chứng nhận từ merged mù #58); sống tới 11:52:20Z | T6-138 + T2-138 (prereg + probe #57 + merged mù #57 A đóng) |
| #95 | 914964c3 | 11:52:20Z 18/11 | 2h01m21s (7.281 s — gap #95?→#96?, chờ chứng nhận từ merged mù #58); sống tới 13:53:41Z | T2-138 §6 (phát hiện lúc đóng phiên 11:55:20Z) + T10-138 .done + T2-139 prereg |
| #96 | 541524e2 | 13:53:41Z 18/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp) + T2-139 prereg + boot-verify + probe #58 (14:44:16Z, ok=2 fail=0) + T4-139 poll + T5-139 t5-start |

- **Ghi chú bảng:** các hàng #90–#92 chép nguyên từ bảng
  T6-138 (đã qua soát xét đợt 138); các hàng #93–#95 T6 đợt
  này cập nhật trạng thái chứng nhận mới (gap #93?→#94? đã
  chứng nhận [5.320, 5.340] s; gap #94?→#95? / #95?→#96?
  chờ merged mù #58). Nhãn gap trong ngoặc ở mỗi hàng là gap
  ứng với tuổi thọ danh nghĩa của boot đó (btime → btime
  boot sau).
- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #92?→#93? là sự kiện thứ 17** (ranh giới, sau khi
  đợt 136 đóng 07:26Z, trước khi đợt 137 mở 08:35Z);
  **#93?→#94? là sự kiện thứ 18** (GIỮA lượt 137, sau khi
  T6-137 đóng 08:49Z, trước khi đợt 137 đóng sổ 10:41Z);
  **#94?→#95? là sự kiện thứ 19** (GIỮA lượt 138 — XÁC
  NHẬN theo quyết parent đợt 138 §12.3(e)(iv)); **#95?→
  #96? là ứng viên sự kiện thứ 20** (xảy ra 13:53:41Z,
  trong cửa sổ đóng sổ đợt 138 — phân loại "giữa lượt" hay
  "ranh giới" chờ T10-139, xem §8.0).
- **T2-139 đối chiếu khớp (độc lập, trước khi T6 đo):**
  prereg-t2.md §0 ghi boot mới `541524e2…`, btime
  13:53:41Z (đọc trực tiếp 14:40:15Z), gọi là #96? ứng viên
  (nếu không có reboot ẩn giữa 11:52:20Z và 13:53:41Z;
  T6-139 chốt chuỗi tương đối); `boot-verify.txt` khớp
  đúng boot_id + btime của T6 (uptime -s 13:53:41Z, btime
  epoch 1795010021); probe #58 (14:44:16Z, theo
  eperm-probe-v2.log:165–166) boot 541524e2, ok=2 fail=0.
  Hai luồng khớp nhau hoàn toàn về boot_id, btime, epoch và
  số tạm. T2-139 cũng ghi rõ mâu thuẫn btime 14:03:07Z
  (chênh 566 s) như T6.
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#93: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3 +
    T6-138 §8.2–§8.4 (không chép lại). Lưu ý theo quyết
    parent đợt 138 §12.3(e): khung chết #94? bản hẹp
    **(11:52:12Z, 11:52:20Z] (~8 s)** làm ứng viên chuẩn,
    bản (11:51:36Z, 11:52:20Z] (44 s) làm biên ngoài;
    khung chết #93? bản chuẩn **(09:35:47Z, 09:36:01Z]
    (14 s)** GIỮ nguyên.
  - #94: khung ứng viên chuẩn ~8 s / biên ngoài 44 s (xem
    §8.3).
  - #95: khung ứng viên 400 s (xem §8.4).

### 8.3 Khung chết #94? — ứng viên chuẩn ~8 s / biên ngoài 44 s (quyết parent đợt 138 §12.3(e)); chờ T2-139 chốt cuối từ merged mù #58

- **Khung chết #94?: (11:52:12Z, 11:52:20Z] (~8 s, mốc
  cuối T4 poll #13) làm ứng viên chuẩn; (11:51:36Z,
  11:52:20Z] (44 s, lần kiểm cuối của T2-138) làm biên
  ngoài bảo thủ** — quyết parent đợt 138 §12.3(e). Khung
  chuẩn cuối cùng chờ T2-139 chốt từ merged mù #58 (đuôi
  đoạn A). T6 đợt này KHÔNG quét lại khung #94? (không có
  bằng chứng mới nào trong cửa sổ đó xuất hiện sau đợt
  138; merged của T2 là chủ quản).
- Gap danh nghĩa #94?→#95? = **8.179 s (2h16'19")** — nằm
  trong dải chứng nhận đã có [0h00'55", 3h14'08"]. Nếu
  đoạn A mù #58 đóng (merged) thì gap chứng nhận
  **[8.169 s, 8.189 s]** (theo prereg T2-139 §3 — T6 không
  tự chứng nhận, chờ merged).

### 8.4 Khung chết #95? — ứng viên 400 s (T6 quét); merged T2 là chủ quản

- **Khung chết #95? ứng viên (T6 quét): (13:47:01Z,
  13:53:41Z] (400 s).** T6 quét toàn `hidden_files/` +
  `docs/` (trừ node_modules) trong cửa sổ (13:47:01Z,
  13:53:41Z]: quan sát cuối vẫn là release của T10-138
  13:47:01Z; **đúng 4 file trong cửa sổ, tất cả cùng một
  sự kiện** (release T10-138): `vite-lock-v2.log`,
  `vite.lock.queue/cooldown-t10-round138`,
  `round138-t10/t10-o8.log`, `round138-t10/t10-o8-lock.log`
  (mtime 13:47:01.6Z). Không có quan sát nào từ sự kiện
  khác sau 13:47:01Z trong cây quét.
- **Caveat:** đây là khung ứng viên theo cây quét của T6
  (hidden_files + docs). Merged của T2-139 (quét rộng hơn:
  memory/bank, /tmp đã mất theo reboot, eperm log…)
  có thể tìm được mốc muộn hơn và thu hẹp khung — khung
  chuẩn cuối cùng chờ T2-139. T6 không tự chốt khung này.
- **Bổ sung — mốc ~13:50Z của T1-139 (F-139-T1-1):** T1 nêu
  bản nháp aggregate đợt 138 được soạn ~13:50Z trên boot
  914964c3 (trước reboot) — nếu tính mốc này thì khung chết
  #95? thu hẹp còn **(~13:50Z, 13:53:41Z] (~4 phút)** thay
  vì 400 s. Đây là mốc suy ra từ hoạt động soạn thảo, KHÔNG
  có file mtime cứng trên đĩa (file aggregate hiện tại mang
  mtime sau reboot do parent sửa tiếp §12.3) — T6 ghi nhận
  để T2-139 cân nhắc khi chốt merged, không tự thu hẹp
  khung ứng viên 400 s của mình.
- Khoảng yên 13:35Z → 13:53:41Z (~18 phút) trong đoạn B mù
  #58 là lỗ lớn nhất dự kiến (T2-139 prereg §1: ~1.100 s,
  sát sàn 1.147 s) — merged sẽ quyết đoạn B đóng hay mở;
  gap #95?→#96? danh nghĩa **7.281 s (2h01'21")**, trong
  dải chứng nhận [0h00'55", 3h14'08"], chứng nhận
  [7.271 s, 7.291 s] NẾU đoạn B đóng (prereg T2-139 §3).

### 8.5 #96? NGOÀI dải CHUẨN, TRONG dải CƠ HỌC — hai cách đọc mâu thuẫn, T6 báo cả hai, KHÔNG tự chọn

Dải chuẩn theo quyết parent đợt 138 §12.3(f): dải T2
**[10:03:39Z, 12:01:56Z]** (FULL70, neo tại btime #94?
09:36:01Z — vốn là dải cho #95?, parent xác nhận làm
chuẩn "cho #96?"). Thực tế btime #96? **13:53:41Z —
NGOÀI dải chuẩn, muộn hơn cận trên 6.705 s (1h51'45")**.
Theo dải này: **OUTSIDE — chuỗi INSIDE (2 lần liên tiếp:
#94?, #95?) ĐỨT ở #96?.**

Dải cơ học neo tại btime #95? 11:52:20Z (p10–p90 FULL70:
p10 0h27'38" = 1.658 s, p90 2h25'56" = 8.756 s — T2-138
§2.5; tính bằng code, kiểm lại dưới): **[12:19:58Z,
14:18:16Z]** (11:52:20Z + 1.658 s = 12:19:58Z; + 8.756 s
= 14:18:16Z). Thực tế 13:53:41Z — **NẰM TRONG dải cơ học
này**.

Hai cách đọc mâu thuẫn nhau vì dải chuẩn (f) neo tại #94?
(dải của #95?), còn dải cơ học cho #96? phải neo tại
#95?. **T6 báo CẢ HAI, không tự chọn — parent quyết khi
đóng sổ** (cùng lập trường với T2-139 prereg §2, vốn cũng
báo cả hai). T10-139 đối chiếu dải T2-139 khi có.

- Ghi chú 1 s (không đổi verdict): btime #94? 09:36:01Z +
  p90 8.756 s = 12:01:57Z theo phép cộng trực tiếp, trong
  khi dải T2 công bố cận trên 12:01:56Z — chênh 1 s (làm
  tròn p90). Muộn hơn cận trên công bố là 6.705 s; muộn
  hơn cận trên cộng trực tiếp là 6.704 s. Không đổi
  verdict nào.
- Tốc độ reboot tới #96?: 96 / 185,59 h = **1 mỗi 116,0
  phút** (tới #95?: 95 / 183,57 h = 1 mỗi 116,0 phút —
  chênh 0,0 phút/boot, trong nhiễu). Không có thay đổi
  chế độ. (Tính bằng code: từ #1 2026-11-10T20:18:10Z tới
  #96? 2026-11-18T13:53:41Z = 185,59 h.)

### 8.6 Dải dự báo cho boot #97? (T6 tính độc lập — đối chiếu với T2 CHƯA XONG lúc T6 đóng)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 / T6-138 §8.6 —
p10–p90 của phân phối FULL70 (p10 = 1.658 s, p90 =
8.756 s; T2-138 §2.5), cộng vào btime #96? 13:53:41Z.
Lưu ý: nếu T2-139 chứng nhận thêm 1–2 gap (CERT 55→57 /
FULL 70→72) thì p10/p90 có thể dịch vài giây như tiền lệ
đợt 138 (dải T6 FULL69 dịch 9 s / 8 s khi FULL70) — dải
dưới đây là dải FULL70, T2 là chủ quản dải chuẩn:

- **Dải dự báo cho #97?: [14:21:19Z, 16:19:37Z]**
  (13:53:41Z + 1.658 s = 14:21:19Z; 13:53:41Z + 8.756 s
  = 16:19:37Z). Tính bằng code (python3), không nhẩm.
- **Đối chiếu với T2: CHƯA XONG.** T2-139 lúc T6 đóng
  (14:51Z) chưa viết LIMITS/.done — prereg-t2.md không
  chứa dải #97?. T10-139 đối chiếu dải T2 khi có; nếu
  khác thì ghi rõ khác biệt (T2 là chủ quản dải).

### 8.7 VERDICT: chuỗi tương đối CHỐT #57→#96? — số tuyệt đối VẪN TẠM (giữ "?"); #95?/#96? chờ merged mù #58

- **CHỐT ĐƯỢC — chuỗi tương đối:** 36 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #96? (13:53:41Z 18/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→…→#94→#95
  →#96 đều có ≥2 nguồn độc lập xác nhận (T5 + T2 + T6 +
  T9 + T10 + file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-139 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #95?→#96? lần này KHÔNG
    có dị thường mới kiểu đó — §8.0 — nhưng một lần sạch
    không xóa tiền lệ.)
  - **MỚI — mù #57 ĐÃ ĐÓNG HOÀN TOÀN (T2-138):** số #94?
    nay đã xác nhận theo quy ước (không còn reboot ẩn giữa
    #93? và #94?); mù #56 A vẫn MỞ theo quyết parent (e) —
    số #93? vẫn mang tính quy ước headline.
  - **MỚI — mù #58 CHƯA ĐÓNG lúc T6 đóng:** T2-139 đã chạy
    probe #58 (14:44:16Z, ok=2 fail=0, boot 541524e2) nhưng
    chưa công bố merged/LIMITS/.done lúc 14:51Z. Số #95?
    và #96? là TẠM THỜI cho tới khi T2 đóng merged — nếu
    đoạn A + B đóng (tối đa 0 ẩn) thì 914964c3 CHÍNH LÀ
    #95? và 541524e2 CHÍNH LÀ #96? (theo quy ước); nếu A
    hoặc B MỞ thì số có thể cao hơn. T6-139 chốt chuỗi
    TƯƠNG ĐỐI (541524e2 là boot quan sát được tiếp theo
    sau 914964c3, không có boot quan sát được nào ở giữa)
    — số thứ tự tuyệt đối #95?/#96? chờ verdict của
    T2-139. **Ghi rõ "chờ T2" theo brief; T10 gộp.**
- **Kết luận cho parent:** T6-139 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 2 boot (#95?, #96? — reboot #19 giữa
  lượt 138 + ứng viên #20 trong cửa sổ đóng sổ đợt 138);
  số thứ tự tuyệt đối **vẫn TẠM** và phải giữ "?" cho tới
  khi có bằng chứng ngoài VM (và, riêng #95?/#96?, tới khi
  mù #58 đóng). Không bịa số, không bỏ "?" khi chưa đủ bằng
  chứng — đúng như brief giao.
- Hệ quả thực hành: T9-139 gọi boot lúc mở là "#96?"
  trong LIMITS của mình là đúng quy ước tạm; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #19 cho reboot #94?→#95? — đã xác nhận; sự
  kiện #20 ứng viên cho #95?→#96? — chờ T10-139 phân
  loại). Các quyết parent trước vẫn đứng: không quyết con
  số tuyệt đối nào ở đây.

### 8.8 Reboot #95?→#96? — không mất việc của luồng T6; T6 không bị cắt

- Reboot 914964c3 → 541524e2 (btime 13:53:41Z) xảy ra sau
  lần đo cuối của T10-138 (13:47:01Z), trước khi round138
  .done được ghi (14:01:14Z) — **không giết attempt hay
  holder lock nào của đợt 139** (đợt 139 mở sau đó,
  14:35:51Z, trên boot mới). T10-138 đã xong việc đo trên
  boot cũ; file .done được ghi trên boot mới (xem §8.0).
- **Không luồng đợt 139 nào mất việc trong phiên T6:**
  T6 mở 14:39:52Z và đóng 14:51:33Z toàn bộ trên boot mới,
  không bị reboot cắt (uptime liền mạch 46' → 58');
  chu kỳ T4-139 (14:48:38Z) chạy xong sạch trên boot mới.
- **Replay apt sau boot #96?: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-139 là chủ
  quản verdict replay / cờ POSTBOOT_PASS boot mới.
- **/tmp đã bị reboot xóa sạch (từ đợt 138):** thư mục
  cut-sim của T6-135 đã biến mất theo reboot #94? (T6-137
  đã ghi); các TDIR suite `/tmp/vcut-lock-v2-test.*/` tự
  dọn bằng trap; TDIR repro của T6 đợt này đã dọn sạch
  sau khi xong (bản fixed in "TDIR cleaned").

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **14:39:52Z** (boot #96? đã 46'11"
  tuổi); đóng **14:51:33Z** (boot #96? đã ~57'52" tuổi).
  Đợt 139 mở **14:35:51Z** (round-in-progress.md) — tức
  **2.530 s sau btime boot #96? (13:53:41Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — giả thuyết
  "scheduler ghi lại started_at khi hồi phục sau reboot"
  ĐÃ ĐƯỢC XÁC NHẬN đợt 134 (lần thứ 5 liên tiếp, +6.967
  s, = btime + 40 s), tái diễn đợt 135 (lần thứ 6, +36 s),
  đợt 136 (lần thứ 7), đợt 137 (lần thứ 8 — bằng chứng
  trực tiếp ĐẦU TIÊN, started_at = btime + 46 s) và đợt
  138 (lần thứ 9, btime + 50 s).
- **T6 đợt này chỉ ghi mốc, không kết luận:** T7-139 là
  chủ quản kiểm slot/started_at. Ghi nhận để T7/T10 đối
  chiếu: đợt 139 mở 2.530 s sau btime #96?; nếu dị thường
  tái diễn thì started_at lượt này rơi vào khoảng
  13:54:2x–13:54:3xZ, tức TRƯỚC khi đợt mở 14:35Z; nguyên
  nhân vẫn thuộc T7.

## 10. Dọn Xvfb: 0 Xvfb chạy; 0 socket sót — /tmp/.X11-unix/ trống

- **Lúc mở (14:40Z): `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb
  đang chạy (`pgrep -x Xvfb` rc=1; quét `/proc/*/cmdline`
  không có process nào tên Xvfb).
- **Lúc đóng (14:51Z): 0 Xvfb đang chạy** (pgrep rc=1),
  `/tmp/.X11-unix/` vẫn TRỐNG.
- **Không kill process nào** trong phiên này (không có
  Xvfb sót để kill; T6 không đụng process luồng khác theo
  nhiệm vụ).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-139; T4-139
  poll-t4.log ghi RAMavail 1.502 MB lúc 14:42:36Z → 2.081 MB
  lúc 14:47:07Z — đã hồi trên gate A, là bối cảnh cho chu
  kỳ lock §4, không phải số đo của T6).

## 11. Tuân thủ lock của luồng đo đợt 138 ĐÃ kiểm được + đợt 139 tới nay

- **T10-138 acquire + release sạch ×1** (13:45:06Z →
  13:47:01Z hold 115 s, port 5554, ticket khớp log).
  T10 dùng bản frozen `round138-t10/vcut-vite-lock-v2.t10.sh`,
  md5 `520b8baa` (kiểm trực tiếp đợt này) — tức chạy trên
  **thứ tự ghi mới** (§3).
- **T4-139 acquire + release sạch ×1** (14:48:38Z →
  14:48:44Z hold 6 s, port 5187, ticket khớp log —
  `run-attempt-139.sh` dòng 13 dùng script repo
  `vcut-vite-lock-v2.sh`, md5 `520b8baa`) — tức chạy trên
  **thứ tự ghi mới** (§3). Đây là attempt1 lượt yên #16;
  hold ngắn (6 s) là việc của T4, T6 chỉ ghi chu kỳ sạch.
- **Tổng kết đợt 138: 1/1 chu kỳ sạch, trên thứ tự ghi
  mới** — 21 chu kỳ liên tiếp sạch kể từ lúc T6-135 đóng
  (§3).
- **T8/T10-139 chưa acquire** tới lúc T6 đóng (§2) — chưa
  có gì để kiểm tuân thủ. Khi họ acquire, họ sẽ dùng bản
  script `520b8baa`; T6 đợt 140 kiểm tuân thủ + đếm chu
  kỳ mới.
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)).
- **Tuân thủ Xvfb luật đứng của đợt 137: CHƯA CÓ bằng chứng
  mới** (T4-139 chạy attempt — không để lại socket sót nào
  đo được lúc T6 mở/đóng đợt 139; /tmp đã bị reboot xóa).

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-139-T6-1 (mới, xem dưới).**
- **F-139-T6-1 — Gọi `status` với `VITE_LOCK_DIR` sai
  (mới):** lúc mở, T6 gọi status với `VITE_LOCK_DIR` =
  thư mục hidden_files (thay vì `.../hidden_files/vite.lock`
  như mặc định của script, dòng 107). Kết quả status in
  "dir tồn tại, tuổi 24s" — đó là tuổi của chính thư mục
  hidden_files (mtime đổi mỗi khi có file mới ghi vào),
  không phải lock dir; `owner: (KHÔNG CÓ FILE OWNER…)`
  cũng là đọc nhầm thư mục. **Không ảnh hưởng kết luận:**
  `ls -ld vite.lock` trực tiếp xác nhận thư mục lock
  KHÔNG tồn tại lúc mở và lúc đóng; đếm queue (0 ticket +
  87 cooldown) đúng vì `VITE_LOCK_QUEUE_DIR` đặt đúng;
  T6 đã gọi lại status ĐÚNG (không override) lúc đóng và
  được `TRỐNG (không có lock)`, rc=0. Đã ghi chú đính
  chính vào `status-open.txt`. Bài học: `VITE_LOCK_DIR`
  là đường dẫn tới chính thư mục lock, không phải thư mục
  cha — các đợt sau không override biến này khi gọi status.
- **Đính chính btime 14:03:07Z → 13:53:41Z (không đánh số
  F — không phải sai số của T6):** brief + round-in-progress
  + build-loop-log ghi sai btime boot 541524e2 (xem §8.0);
  T6 đo độc lập + T2-139 prereg cùng xác nhận 13:53:41Z;
  **T1-139 F-139-T1-1 verify độc lập bằng 4 nguồn**
  (/proc/stat, journal first entry 13:53:53Z, who -b/uptime,
  thời gian sinh `/` 13:53:51Z). Tương tự, "1 reboot SAU khi
  đóng cờ" trong MEMORY/build-loop-log là không chính xác
  theo nghĩa hẹp — reboot xảy ra 13:53:41Z, trước khi .done
  đợt 138 được ghi 14:01:14Z (xem §8.0); và câu "0 reboot
  trong phiên đóng sổ" ở aggregate đợt 138 §10.2 đã lỗi
  thời (viết lúc soạn nháp ~13:50Z, đúng lúc đó — xem
  F-138-T10-4). Theo T1, đính chính thuộc về log đợt 139
  (LIMITS này + LIMITS T1-139 §6), KHÔNG sửa ngược
  aggregate đợt 138 đã đóng; T6 không sửa aggregate hay
  build-loop-log của parent.
- **Số hiệu boot mới (#95?/#96?) VẪN TẠM (xem §8.7):**
  chuỗi tương đối #57→#96? đã chốt (36 boot); số tuyệt đối
  giữ "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối
  đa 6, mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới
  #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51
  đoạn B mở, tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng
  không làm neo được; (e) dị thường đồng hồ #84?→#85?
  (§8.4(b) đợt 134); **(f) MỚI: mù #58 chưa đóng — số
  #95?/#96? chờ verdict T2-139; mù #56 A vẫn MỞ (quyết
  parent (e)) — số #93? cũng vẫn quy ước headline**.
  Journal/wtmp chỉ giữ boot hiện tại (journal `--list-boots`
  chỉ 1 dòng 541524e2; wtmp bắt đầu 13:53:xxZ) nên T6 suy
  ra số hiệu từ thứ tự thời gian + hồ sơ các đợt trước,
  không phải từ log hệ thống.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; ngày
  đúng là **15/11** (F-131-T6-1, nhắc lại ở §8.1). Mù #49
  đoạn B mở + mù #51 đoạn B mở + mù #53 B recheck
  (T2-137) + mù #55 (T2-136: B mở tối đa 2 ẩn quy ước /
  3 cộng dồn) + mù #56 A MỞ (quyết parent (e)) + mù #57
  **ĐÃ ĐÓNG HOÀN TOÀN** (T2-138) + mù #58 MỚI MỞ (T2-139
  đang điều tra; probe #58 xong 14:44:16Z, merged chưa
  công bố lúc T6 đóng); mù #52 đã đóng hoàn toàn (T2-133);
  mù #54 đã đóng hoàn toàn (T2-135).
- **F-136-T6-1 (cũ, nhắc lại):** T1-135 viết sai nhãn boot
  ("Boot hiện tại lúc kiểm: 8ae55060" cho phiên 02:40–
  02:54Z — boot sống lúc đó là 78b55838). Không lặp lại
  ở đợt này: T6-139 ghi đúng boot sống 541524e2 (khớp
  T2-139 boot-verify + probe #58 + T4 poll + T5 start).
  (Lưu ý §8.0: nhãn "Boot lúc đóng: 914964c3" trong
  round138-t10.done là cùng mẫu — file được ghi trên boot
  mới nhưng nhãn đúng cho phiên làm việc của T10.)
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn (`round134-t10.done` thay vì
  `round134-t6.done`); tổng 17 không đổi. T6-139 đã đếm
  lại đúng (§5: trích dẫn = 2, gồm `round137-t6.done` +
  `round138-t6.done`).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  lăm liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
  gate 9/9 khi đợt đông vẫn thuộc về parent; T6 không tự
  đổi test.
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round137-t*/` (toàn đợt) +
  `round138-t*/` (toàn đợt) + `round139-t*/` tới 14:51Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T8/T10-139 chưa chạy xong tới thời điểm đếm; T6
  đợt 140 đếm tiếp.
- **Prune cooldown lần 14 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 87 ≤ trần 100 lúc chạy). File
  cũ nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z,
  theo `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 138 khép sạch trên lock (§4):** 1 chu kỳ (t10 ×1)
  sạch — T6 đợt này đếm bổ sung 1 chu kỳ sau khi T6-138
  đóng, khớp đúng recount T10-138; **đợt 139 tới 14:51Z có
  1 chu kỳ** (t4 ×1 hold 6 s). Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 14:51Z (trống, 0 ticket + 87 cooldown); đợt
  còn chạy tới ~17:00Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–138 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 21 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt #96? chưa có verdict** (thuộc T5-139 — xem
  §8.8).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- **T2-139 CHƯA XONG lúc T6 đóng (14:51Z):** probe #58 xong
  14:44:16Z (ok=2 fail=0) nhưng merged mù #58 + LIMITS +
  .done chưa có. Theo brief, T6 ghi rõ "chờ T2" và để T10
  gộp — KHÔNG tự suy đoán số boot #95?/#96?, không tự
  chứng nhận gap #94?→#95? / #95?→#96?, không tự chốt
  khung chết #94?/#95? cuối cùng.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND139_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t4` do release hợp lệ của t4-139,
`cooldown-t10-round138` do release hợp lệ của t10-138 —
xem §3), Xvfb (0 process; 0 socket sót).
Stage: `repo-1-push/paths-loop/phase9-round139-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round139-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, analyze-log-cleaned-open.txt,
vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-close.log, analyze-log.py,
cooldown-now.txt, prune-candidates.txt, prune-deleted.txt,
khong-nha-grep.txt, test-v2-t6-run1.log,
test-v2-t6-run2.log, repro-newmsg-fixed.sh,
repro-newmsg.log).

## 14. Bổ sung sau khi đóng — T4 acquire chu kỳ thứ 2 (14:54:30Z, đang giữ lúc T6 xong stage)

- Số liệu §§2–§5/§7 trong tài liệu này chốt tại **14:51Z**
  (log 964 dòng thô / 958 chính thức, 1 chu kỳ đợt 139).
  Sau thời điểm đó, T4-139 acquire tiếp chu kỳ thứ 2:
  `14:54:30Z t4 TICKET … port=5187` → `ACQUIRED port=5187
  wait_s=0` (ticket 1-1795013670578521641-21216-t4).
- Lúc T6 kiểm lần cuối **14:58:29Z**: lock ĐANG DO t4 GIỮ
  (owner t4, pid 21216, port 5187, started 14:54:30Z,
  boot 541524e2); vite node 21321 đang chạy trên cổng 5187
  (attempt1 lượt yên #16 của T4 đang chạy — chain-t4.log
  ghi HB129, writePartial timeouts); log 966 dòng thô;
  queue vẫn 87 file / 0 ticket. Đây là sử dụng lock BÌNH
  THƯỜNG, đúng quy trình (acquire → giữ → sẽ release) —
  không phải lock kẹt. T10-139 recount toàn bộ lúc đóng
  đợt (chu kỳ này sẽ thành cặp thứ 278 khi T4 release).
- T6 không chờ chu kỳ này release xong (attempt của T4 còn
  đang chạy, không thuộc phạm vi chờ của T6) — ghi nhận để
  T10 không đọc nhầm "lock trống lúc T6 đóng" thành "lock
  trống cả đợt".
