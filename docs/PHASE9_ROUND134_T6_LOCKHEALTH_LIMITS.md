# PHASE9 ROUND134 T6 — Sức khỏe lock v2 + prune cooldown lần 9 + CHỐT SỐ BOOT #84?/#85? (reboot #9 GIỮA LUỘT, giết attempt1 T4; RELEASED mất dòng do reboot — ca đầu tiên) — LIMITS

- Đợt: 134, luồng T6 (sức khỏe lock v2 + prune cooldown + chốt số
  boot + khung chết #83?/#84? + đối chiếu started_at).
  Lượt cron 06:35 +07 18/11/2026. Chạy 23:45Z 17/11 → 00:03Z 18/11/2026
  (hai boot: mở trên #84?, đóng lại trên #85? sau reboot giữa lượt).
- Nhiệm vụ: kiểm lock vite sau boot #84? theo đúng phương pháp
  chính thức; prune cooldown lần 9 theo luật đã phê duyệt; ĐẾM LẠI
  chuỗi boot theo định nghĩa gộp DUY NHẤT (LIMITS gộp đợt 133
  §10.2 — F-133-6: từ đợt 134 mọi luồng dùng một định nghĩa này);
  ghi khung chết #83? + #84? (khung #84? có dị thường đồng hồ);
  ghi rõ trạng thái mù #37 + caveat mốc chính #82?. KHÔNG sửa logic
  lock, KHÔNG sửa script lock, KHÔNG đụng production. Mọi thí nghiệm
  acquire/release chạy trên lock dir /tmp riêng với đúng biến môi
  trường (VITE_LOCK_DIR / VITE_LOCK_QUEUE_DIR / VITE_LOCK_LOG);
  lock thật chỉ đọc qua `status` — ngoại trừ thao tác prune file
  cooldown đã phê duyệt. **Không lặp lại F-132-T6-1** (repro lần
  này chạy đúng trên /tmp, log thật không đổi lúc repro).
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round134-t6/` (analyze-log.py,
  analyze-log-cleaned-open.txt, analyze-log-raw-873.txt,
  analyze-log-cleaned-close.txt, analyze-log-cleaned-close2.txt,
  analyze-log-raw-875.txt, vite-lock-v2-cleaned-867.log,
  vite-lock-v2-cleaned-869.log, new-lines-since-867.txt,
  cooldown-now.txt, prune-candidates.txt, prune-deleted.txt,
  ps-full-open.txt, ps-full-close.txt, ps-full-close2.txt,
  ss-open.txt, ss-close.txt, ss-close2.txt,
  khong-nha-grep.txt, khong-nha-grep-close.txt,
  khong-nha-grep-close2.txt, status-open.txt, status-close.txt,
  status-close2.txt, test-v2-t6-run1.log, test-v2-t6-run2.log,
  repro-newmsg-fixed.sh, repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.

## 0. Trạng thái lúc bắt đầu — BOOT #84? (số tạm, xem §8)

- **Boot lúc mở: boot_id `d2e66749-2840-49f8-930d-7e54c9554b96`,
  btime 23:26:58Z** (`uptime -s` = 23:26:58Z, `who -b` =
  Nov 17 23:27, `/proc/1` 23:27:09Z — chênh +11 s, cùng mẫu
  các boot trước; `journal --list-boots` chỉ 1 dòng d2e66749).
  Uptime ~18' lúc T6 bắt đầu (23:45:08Z).
- Khớp brief mở đợt 134 + round-in-progress.md (boot mới sau khi
  đợt 133 đóng 22:12Z; boot 3e7a7b51 #83? đã chết). Đây là
  **reboot #83?→#84? — sự kiện thứ 8 theo định nghĩa gộp §10.2
  đợt 133**, loại RANH GIỚI (btime 23:26:58Z, trước khi đợt 134
  mở 23:35Z 8'02").
- md5 khớp baseline đợt 120–133: v2 `cd0c05c1` (script live
  `apps/web/scripts/vcut-vite-lock-v2.sh`), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 134 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round134-t1…t9; T3-fix.done đã có; T9.done lúc
  23:51Z; T1/T7.done lúc ~00:02Z — sau thời điểm đóng 2 của
  T6, T6 không đọc nội dung các cờ này, T10 đối chiếu).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật — 0 cổng lạ (lúc mở, lúc đóng 1 trên #84?, lúc đóng 2 trên #85?)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 23:45Z
  (mở, `ps-full-open.txt`), lúc 23:50Z (đóng 1,
  `ps-full-close.txt`, còn trên boot #84?) và lúc ~00:02Z
  (đóng 2, `ps-full-close2.txt`, trên boot mới #85?).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 3 snapshot.
- `ss -tlnp`: cả 3 lần **không có cổng TCP nào đang lắng
  nghe** (chỉ dòng header).
- **0 tiến trình vite/node/webkit/chromium thật** ở cả 3
  snapshot (đóng 1: chỉ systemd/journal/hatch daemon/execd
  + shell của T6 + các bash/sleep của T4/T2/T8 đang chờ;
  đóng 2: thêm poller T4 đã khởi động lại + waiter T8 +
  các luồng T2/T5 đang chạy trên boot mới — không có vite
  thật nào còn sống sau reboot).
- **Không có tiến trình nào của đợt 133 còn sống sau reboot
  #83?→#84?** (đợt 133 đã đóng 22:12Z, trước reboot).

## 2. Lock lúc mở và lúc đóng 1: TRỐNG cả hai lần; chu kỳ T4 23:50:17Z bị reboot giết (xem §3)

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 23:45Z (mở), lúc 23:50Z (đóng 1) và lúc ~00:02Z
  (đóng 2, sau reboot #85?) — không có file owner stale
  nào, không cần dọn lock stale.
- Lý do không có stale lúc mở: sự kiện lock cuối cùng của
  đợt 133, `t10-round133` RELEASED hold 120s lúc
  **22:04:37Z**, tức **1h31' trước khi đợt 134 mở (23:35Z)**
  và 1h41' trước khi T6 bắt đầu. Lock đã trống sẵn khi đợt
  134 mở — không phải do reboot dọn (cùng mẫu như các boot
  trước).
- `status` lúc mở 23:45Z, lúc đóng 1 23:50Z và lúc đóng 2
  ~00:02Z: `TRỐNG (không có lock)`, `0 ticket + 78 cooldown`,
  rc=0 cả ba lần — queue không đổi suốt phiên T6 (78 file /
  1092 B, xem §7).
- Khoảng yên trước đợt: **không có event lock nào từ
  22:04:37Z (t10-round133 release) tới 23:50:17Z (t4
  acquire)** — 1h45'40" yên giữa hai đợt; yên lặng này là do
  đợt 133 đã đóng và T4-134 đang chờ cờ fix T3 + POSTBOOT_PASS
  T5 — không phải do lock kẹt (bằng chứng: suite /tmp §6
  chạy xanh trên bản script hiện hành + T4 sau đó acquire
  thành công ngay khi gate mở).

## 3. Chu kỳ lock của đợt 134 tới lúc T6 đóng 2: 1 chu kỳ mới — T4 attempt1 lượt yên #11 BỊ REBOOT GIẾT, RELEASED mất dòng (ca đầu tiên)

Từ snapshot T10 đợt 133 (867 dòng chính thức lúc 22:05Z
17/11) tới lúc đóng 2 của T6 (869 dòng chính thức lúc
~00:02Z 18/11): **+2 dòng = TICKET +1 / ACQUIRED +1 /
RELEASED +0 / COOLDOWN +0 / TIMEOUT +0 / STALE-LOCK +0 /
STALE-TICKET +0.** (Chi tiết trong
`round134-t6/new-lines-since-867.txt`.)

- **`t4` (T4 lượt yên WebKit #11 attempt1, đợt 134): 1 chu kỳ
  BỊ GIẾT GIỮA CHỪNG — 23:50:17Z ACQUIRED, KHÔNG CÓ
  RELEASED** — cổng 5187, wait 0s. T4 acquire 4 giây sau
  thời điểm đóng 1 của T6 (23:50:13Z) nên không nằm trong
  snapshot đóng 1; T6 phát hiện ở lần kiểm tiếp theo
  23:55Z và xác minh đầy đủ sau reboot.
- **Reboot #84?→#85? (btime 23:53:17Z) giết attempt1 của T4
  giữa pass 3/20** (passesDone=2, JSON partial 257.631 B,
  heartbeat kẹt ở elapsed=100s — theo chain-t4.log của T4,
  ghi 23:56:13Z trên boot mới). T4 đã quyết định chạy lại
  attempt1 trên boot mới (chờ POSTBOOT_PASS mới của T5;
  fix T3 còn nguyên, preview.tsx 530e10a7).
- **Trạng thái lock sau reboot: dir đã sạch, status TRỐNG,
  nhưng log THIẾU dòng RELEASED cho t4.** `vite.lock`
  không tồn tại lúc 23:55:43Z và ~00:02Z; `status` TRỐNG;
  pairing script báo 1 "đang giữ" (t4, dòng 869) — NHƯNG
  ĐÂY KHÔNG PHẢI HOLDER CÒN SỐNG: vite :5187 đã chết
  (curl 000 theo T4), 0 process vite/webkit sót, holder
  đã chết theo reboot. Cơ chế đã xác định từ code
  (xem §3.1).
- **Đợt 133 khép lại sạch trên lock** (T10 recount 867 dòng /
  251 cặp — T6 mở đợt 134 đếm lại khớp đúng, §4). **Đợt 134
  tới lúc T6 đóng 2 có đúng 1 chu kỳ (t4) và nó là ca
  reboot-kill** — không phải lỗi lock, không phải holder
  quên nhả. T4 chạy lại attempt1 + T8 harness + T10 O8
  sau thời điểm đếm của T6 — **T10-134 recount lại lúc
  đóng** (như mọi đợt).

### 3.1 Vì sao dir sạch nhưng log thiếu RELEASED — cơ chế đã xác định (không phải suy đoán)

- `run-attempt` của script v2 (dòng 512–527) acquire, chạy
  attempt, rồi **nhả trong trap "kể cả SIGTERM/SIGINT"**.
  Khi reboot SIGTERM tiến trình wrapper của T4, trap đã
  chạy `cmd_release`.
- Thứ tự trong `cmd_release` (dòng ~410–435): (1) `rm -f
  owner && rmdir LOCKDIR`; (2) ghi file cooldown
  (`date +%s%3N > cooldown-$thread`, dòng 430); (3) tính
  hold_s; (4) `log_event RELEASED`. **Ghi cooldown ĐI TRƯỚC
  ghi log RELEASED** — cửa sổ giữa bước (2) và (4) là nơi
  reboot cắt ngang (hoặc log append bị mất theo reboot).
- Bằng chứng khớp đúng từng bước: dir đã bị `rmdir` (không
  tồn tại sau reboot ✓); file `cooldown-t4` có mtime
  **23:53:53Z** — tức bước (2) ĐÃ CHẠY (mtime cũ trước đó
  là 20:54:11Z từ đợt 133) ✓; dòng RELEASED KHÔNG CÓ trong
  log (875 dòng, dòng cuối vẫn là ACQUIRED 23:50:17Z) —
  bước (4) KHÔNG HOÀN THÀNH ✓. (Về mốc 23:53:53Z muộn hơn
  btime boot mới 36 s — xem dị thường đồng hồ §8.4; dù
  theo đồng hồ nào thì thứ tự bước (1)→(2)→mất (4) vẫn
  đúng.)
- **Hệ quả ghi nhận:** log sẽ giữ mãi 1 ACQUIRED không có
  RELEASED tương ứng (t4, dòng 869) — cùng họ với 5 ca
  double-acquire đã biết nhưng cơ chế khác (đây là ca
  **reboot-kill làm mất dòng RELEASED đầu tiên**, khác đợt
  129 là acquire bị mất theo reboot khi chưa kịp release).
  Không sửa script trong đợt này (đổi thứ tự ghi log /
  fsync cần quyết parent; T6 chỉ ghi nhận). T10-134 ghi
  chú ca này lúc đóng sổ để đợt sau khỏi đếm nhầm thành
  "đang giữ".

## 4. Nhất quán log lock: 869 dòng chính thức lúc đóng 2, 251/251 cặp, 1 "đang giữ" GIẢI THÍCH ĐƯỢC (t4 reboot-kill), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~00:02Z
18/11 (14/11 18:01:32Z → 17/11 23:50:17Z; script ghép cặp
`round134-t6/analyze-log.py` — tái dùng từ round130–133).
Lúc mở (23:45Z) log là 873 dòng thô / 867 chính thức —
KHỚP ĐÚNG recount T10 đợt 133 (867/251), không có dòng
nào thêm hay mất giữa hai đợt.

| Sự kiện | Tổng chính thức lúc đóng 2 | Lúc mở (đóng T10-133) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 266 | 265 | 175 | 169 |
| ACQUIRED | 257 | 256 | 175 | 169 |
| RELEASED | 251 | 251 | 173 | 167 |
| COOLDOWN | 80 | 80 | 72 | 67 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | **6** | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **869** | **867** | **596** | **573** |

- So với snapshot T10 đợt 133 (867 dòng): +2 dòng, đúng
  bằng TICKET +1 / ACQUIRED +1 (t4 23:50:17Z) / RELEASED
  +0 — khớp từng con số, không có event nào mất dấu hay
  thêm lạ ngoài ca t4 §3.
- Ghép cặp theo thread: **251 cặp ACQUIRED→RELEASED, 1
  "đang giữ" ở cuối log = t4 (23:50:17Z, dòng 869) —
  GIẢI THÍCH ĐƯỢC: holder chết theo reboot, dir đã sạch,
  status TRỐNG (§3.1); KHÔNG phải lock kẹt.** 0 lần
  RELEASED không có ACQUIRED trước đó. Chênh ACQUIRED −
  RELEASED = 6 = 5 ca double-acquire đã biết + 1 ca t4
  reboot-kill mới.
- 5 ca "double-acquire" — **cùng đúng 5 ca T6 đợt 131–133
  đã liệt kê** (s3-round116, t3-round117, t4, t3-round119,
  t8-round129 dòng 781), tất cả giải thích được bằng
  STALE-LOCK cướp sau reboot; **không có ca mới nào**.
  Ca t4 mới KHÔNG thuộc nhóm này (ghi riêng ở §3.1).
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11, t9 chờ 900s cổng 5581) — đợt 120+ có **0 TIMEOUT**;
  5 STALE-LOCK + 1 STALE-TICKET cũ toàn bộ từ trước đợt 120
  (lần cuối 01:04:20–21Z 16/11) + **1 STALE-LOCK 09:04:38Z
  17/11 do reboot #75→#76 giữa lượt** (§3 đợt 130).
- Round 120–133 khép lại sạch trên lock (đợt 129 với caveat
  1 acquire mất theo reboot đã dọn đúng luật — T6-130 §3;
  đợt 130–133 sạch hẳn). Đợt 134 tới 00:02Z có đúng 1 ca
  reboot-kill (§3). Cửa sổ R120: **175 = 175 T/A,
  RELEASED 173** (chênh 2 = 1 ca reboot-kill đợt 129 + 1 ca
  t4 đợt 134), 0 TIMEOUT, STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  266+257+251+80+8+6+1 = 869 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**
  trong log. **0 dòng chứa DEFER / KILLED / ERROR** trong
  toàn log (grep -i, đếm 0).
- **Về 6 dòng repro lỗi (F-132-T6-1):** file log thật hiện
  có **875 dòng** (6 dòng tA/tH lúc 17:43:46Z do repro lỗi
  của T6-132 ghi vào). Số liệu bảng trên là số **chính
  thức, đã loại 6 dòng đó** (bản sao đã lọc
  `vite-lock-v2-cleaned-869.log`, 869 dòng; phân tích
  `analyze-log-cleaned-close2.txt`). Bản phân tích thô
  trên file 875 dòng (`analyze-log-raw-875.txt`) cũng được
  lưu để đối chiếu: TICKET 268 / ACQUIRED 259 / RELEASED
  253 / tổng 875 — chênh đúng +2/+2/+2, cặp 253, vẫn 1
  đang giữ (t4). **Chuỗi保管:** 847 dòng đầu của bản đã
  lọc đợt này có md5 `9048174e…` — khớp đúng bản snapshot
  đã lọc của T6-132/T6-133. T6 đợt 135 dùng số chính thức
  869 làm snapshot; 6 dòng tA/tH dòng 848–853 là của
  T6-132, không phải của luồng sản xuất.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 132 (toàn đợt), đợt 133 (toàn đợt) và đợt 134 (tới 00:02Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round132-t*/` + `round133-t*/` + `round134-t*/`
(tới 00:02Z) — theo quy tắc lăn: bỏ round131 (T6-133 đã
đóng toàn đợt 131), thêm round134. Tổng **18 dòng khớp
chuẩn, phân loại đủ 18/18 — tất cả đều là bản sao script /
log repro / trích dẫn tài liệu, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 8 | 4 file × 2 dòng: `round132-t4/vcut-vite-lock-v2.frozen.sh`, `round132-t10/vcut-vite-lock-v2.t10.sh`, `round133-t10/vcut-vite-lock-v2.t10.sh`, `round134-t10/vcut-vite-lock-v2.t10.sh` — mỗi file 2 dòng `echo` (dòng 421 `BỎ QUA release thừa`, dòng 423 `KHÔNG NHẢ`) |
| Tái hiện có kiểm soát trên /tmp | 9 | `round132-t6/repro-newmsg.log` + `round133-t6/repro-newmsg.log` + `round134-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6) |
| Trích dẫn trong tài liệu | 1 | `round133-t10/PHASE9_ROUND133_LIMITS.closing-copy.md` dòng 64 — câu trích số liệu T6-133 ("KHÔNG NHẢ trên lock thật: 0"), không phải sự kiện |
| File grep-output của các T6 trước | 0 trong đếm chuẩn | Các file `khong-nha-grep*.txt` của T6-132/133/134 đã loại khỏi đếm chuẩn như mọi đợt (chỉ là tiếng vọng của các lần grep trước) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 132 (toàn đợt) / 133 (toàn đợt) / 134 nào |
| Round134-t* (trừ repro/script của T6/T10) | 0 dòng | T4/T8-134 chưa có driver log nào khớp chuỗi tới 00:02Z (T4 đang chạy lại attempt1; T8 waiter đang chờ gate) |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0 (toàn
  đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn đợt),
  đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt), đợt 132
  = 0 (toàn đợt), đợt 133 = 0 (toàn đợt), đợt 134 tới
  00:02Z = 0.** Khớp với log pairing sạch ở §4 (251/251
  cặp + 1 ca reboot-kill đã giải thích — không liên quan
  nhánh release; trap release của run-attempt CHẠY nhưng
  log line bị mất theo reboot, xem §3.1).
- Giới hạn phạm vi: T4/T8/T10-134 chưa chạy xong tới
  00:02Z — nếu có sự kiện mới sau thời điểm đếm thì thuộc
  đợt 134, T6 đợt 135 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-133 đếm 8 dòng script-copy trên 4
  file (round131-t4/t10, round132-t4/t10) + 1 dòng trích
  dẫn chưa xuất hiện lúc đó; đợt này bỏ round131 (−4
  dòng) nhưng thêm round133-t10 (+2), round134-t10 (+2)
  và 1 dòng trích dẫn closing-copy (+1) → 8 dòng script +
  1 dòng trích dẫn; cộng 9 dòng repro /tmp = 18 dòng thô
  lúc đóng 2 (lúc đóng 1 là 16 dòng — T10-134 chưa spawn).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
#84? (`d2e66749…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round134-t6/test-v2-t6-run1.log` 23:46Z,
  `test-v2-t6-run2.log` 23:46Z):
  - **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều
    PASS=9 FAIL=0) — lần thứ mười liên tiếp không có lần T7
    flaky ở lần chạy đầu (đợt 125, 126, 127, 128, 129, 130,
    131, 132, 133 cũng vậy). Tính flaky của T7 (T9 đợt 119
    §1.2) vẫn được ghi nhận là bản chất — mười lần xanh kép
    không xóa nó; quyết tách T7 khỏi gate 9/9 khi đợt đông
    vẫn thuộc về parent; T6 không tự đổi test.
  - Kết luận suite: xanh lần thứ mười sáu liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt
    123 + T6 đợt 124 + T6 đợt 125 + T6 đợt 126 + T6 đợt
    127 + T6 đợt 128 + T6 đợt 129 + T6 đợt 130 + T6 đợt
    131 + T6 đợt 132 + T6 đợt 133 + T6 đợt 134).
- **Repro message ĐÚNG (`round134-t6/repro-newmsg.log`,
  23:46:50Z)** — copy verbatim script của T6-133, chỉ
  đổi tên TDIR (`vcut-t6r133-repro` → `vcut-t6r134-repro`)
  theo bài học F-132-T6-1; biến môi trường đúng
  (`VITE_LOCK_DIR` / `VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG`
  trỏ /tmp). Cùng 3 thí nghiệm A/B/C như T9 đợt 120 và T6
  đợt 121–133, kết quả giống hệt:
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
    lúc đó có 78 cooldown; log thật vẫn 873 dòng và queue vẫn
    78 file sau khi repro xong; không có file `cooldown-tA/
    tH/tB` nào xuất hiện trong queue thật. **F-132-T6-1 KHÔNG
    lặp lại.**
  - Kết luận: **fix text đợt 120 không đổi hành vi; guard còn
    nguyên; thông báo mới phân biệt rõ 2 trường hợp.**
- Bằng chứng lock thật đang chạy tốt trên bản `cd0c05c1`:
  **chu kỳ T4 23:50:17Z acquire sạch, wait 0s** (§3) — đây
  là bằng chứng live (không phải chỉ suite /tmp) rằng lock
  v2 hoạt động đúng qua boot #84?; chu kỳ bị giết bởi
  reboot là lỗi ngoài lock (trap release đã chạy, chỉ mất
  dòng log — xem §3.1), không phải lỗi acquire/release.
- **Kết luận sức khỏe: lock KHỎE (với 1 caveat ghi rõ).**
  Trống lúc mở và cả hai lần đóng (kể cả sau reboot #85?),
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (251/251
  cặp + 1 ca reboot-kill đã giải thích, 0 mất dấu khác —
  số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy nhất do
  reboot giữa lượt (đã dọn đúng luật, đợt 130), 0 sự kiện
  "KHÔNG NHẢ" trên lock thật đợt 120–133 (toàn đợt) và đợt
  134 (tới 00:02Z), suite 9/9 độc lập ×2 lần chạy (T7 xanh
  cả hai lần), và T4 lượt yên #11 acquire sạch ngay khi
  gate mở. **Caveat duy nhất: 1 dòng RELEASED mất theo
  reboot (§3.1)** — không ảnh hưởng holder nào còn sống,
  nhưng log sẽ giữ mãi 1 ACQUIRED không cặp; T10-134 ghi
  chú để đợt sau khỏi đếm nhầm.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 9 liên tiếp)

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
  - 23:47Z: lock TRỐNG (`status` 0 ticket + 78 cooldown,
    rc=0) — đủ điều kiện (e). Quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng). Tổng 78 file ≤ trần mềm 100 nên điều (b) cũng
    không kích hoạt.
  - **Kết quả prune đợt 134: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Vì tập ứng viên rỗng nên không thực thi thao tác xóa
    nào (không có gì để xóa). Đây là kết quả đúng của luật
    — luật đã chạy, không phải luật chưa chạy. File cooldown
    cũ nhất sẽ đủ 7 ngày theo đồng hồ tường vào khoảng
    **21/11 18:38Z**; theo phương pháp `find -mtime +7`
    (≥192h) sẽ khớp ứng viên vào khoảng **22/11 18:38Z**.
    T6 các đợt sau đếm tiếp. Đây là lần thứ 9 liên tiếp
    prune xóa 0 file (đợt 126: 0; đợt 127: 0; đợt 128: 0;
    đợt 129: 0; đợt 130: 0; đợt 131: 0; đợt 132: 0; đợt
    133: 0; đợt 134: 0).
  - Lưu ý: file `cooldown-t4` mtime cập nhật lên 23:53:53Z
    là **do trap release của run-attempt chạy lúc reboot
    (§3.1), KHÔNG phải do prune** (prune không tạo/cập
    nhật file, chỉ xóa). Số file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (23:45Z) **78 file / 1092 byte**; lúc
  đóng 1 (23:50Z) **78 file / 1092 byte**; lúc đóng 2
  (~00:02Z) **78 file / 1092 byte** (78 × 14 = 1092 khớp
  cả ba lần; `ls`/`find`/`status` khớp nhau). Số học khớp:
  78 + 0 = 78 ✓. Không file nào bị xóa hay thêm giữa ba
  lần đếm (T4 tái dùng `cooldown-t4` có sẵn, +0 file net).
- Phân tầng tuổi lúc 23:47Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 14 file** (tăng 1 → 14 so với đợt 133 —
  13 file mtime chiều 14/11 vừa vượt 72h trong lúc đợt 133
  đóng / đợt 134 mở, đúng theo đồng hồ, không phải sai
  số); **≥48h (`-mtime +1`): 27 file** (giữ nguyên 27 như
  đợt 131–133). File cũ nhất `cooldown-r4-round115`, mtime
  2026-11-14T18:38:25Z — lúc 23:47Z mới **~77h09' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#85; số tuyệt đối VẪN TẠM; khung chết #84? CÓ DỊ THƯỜNG ĐỒNG HỒ

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1): khoảng **11:39:50Z → 23:45:17Z ngày
  15/11 (12h05'27")**, **A+D đóng, B+C mở** (2 cửa sổ mở,
  tổng ~9h48'14"), **tối đa 29 reboot ẩn** (21 đoạn B + 8
  đoạn C). Parent đã **chấp nhận để mở** (QUYẾT PARENT 7
  đợt 119) — T6 KHÔNG thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Khoảng mù #37 là 15/11 11:39:50Z → 23:45:17Z, KHÔNG phải
  16/11 — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #84? và #85?)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 (mỗi boot liệt
kê với boot_id + btime lấy từ ≥1 nguồn độc lập;
btime→btime danh nghĩa = khoảng cách giữa hai btime liên
tiếp). Số thứ tự là số tạm theo thứ tự thời gian (tất cả
đều mang "?") — xem verdict §8.5. **Định nghĩa đếm dùng
từ đợt này: định nghĩa gộp của T10 (LIMITS gộp đợt 133
§10.2) — mọi reboot quanh đợt, cả giữa lượt lẫn ranh
giới — theo quyết F-133-6.** Bảng dưới chỉ ghi 4 boot cuối
(chuỗi đầy đủ #57→#82 xem T6-131 §8.2 + T6-132 §8.2 +
T6-133 §8.2 — không chép lại để khỏi drift; T6 đợt này đã
đối chiếu lại: không có boot_id lạ nào xuất hiện trong bất
kỳ bằng chứng 17/11 nào ngoài chuỗi này, trừ boot mới
#85? dưới đây).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #82 | 07da9c50 | 19:34:15Z 17/11 | 2h10'07" (7.807 s, #81→#82 — CERTIFIED interval, xem T6-133 §8.3) | T10-132/T2-133/T6-133 |
| #83 | 3e7a7b51 | 21:41:40Z 17/11 | 2h07'25" (7.645 s, #82→#83 — SPAN); đang sống tới 23:26:58Z | T6-133/T10-133 |
| #84 | d2e66749 | 23:26:58Z 17/11 | 1h45'18" (6.318 s, #83→#84 — SPAN); đang sống tới 23:53:17Z | T6 này (brief + uptime/journal//proc/1) |
| #85 | 81335571 | 23:53:17Z 17/11 | 26'19" (1.579 s, #84→#85 — SPAN, xem §8.4); đang sống | T6 này (uptime/journal//proc/1 + T4/T5) |

- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #83?→#84? là sự kiện thứ 8 (ranh giới, trước khi
  đợt 134 mở); #84?→#85? là sự kiện thứ 9 (giữa lượt,
  giết attempt1 T4).** Không đợt nào từ 129 tới nay thiếu
  reboot.
- **F-134-T6-1 — nhãn đếm của T5 lệch 1 so với định nghĩa
  gộp (không đổi verdict):** `round134-t5/t5-newboot-state.md`
  (23:58Z) gọi reboot #84?→#85? là "reboot GIỮA LUỘT lần
  thứ 8 liên tiếp". Theo định nghĩa gộp đã chốt ở F-133-6
  (chuỗi T10-133 §10.2: #82?→#83? = sự kiện thứ 7), reboot
  này là **sự kiện thứ 9** (#83?→#84? ranh giới = thứ 8).
  T6 ghi theo định nghĩa gộp và báo lệch để T10/parent
  thống nhất — không tự đổi số của T5 trong file của T5.
  (Lưu ý: chuỗi đếm riêng của T2-133 §0 cũng từng lệch
  theo hướng khác — xem F-133-6; đây là trường hợp mới
  của cùng một bệnh: nhãn "lần thứ N" phải luôn kèm
  định nghĩa.)
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#81: như T6-133 §8.2 (ghi cả hai bản ghi, khung hẹp
    nhất làm chuẩn — không chép lại).
  - #82: HAI khung (xem §8.3 — caveat mốc chính CÒN).
  - #83: MỘT khung (xem §8.3).
  - #84: HAI bản ghi — một khung mtime + một bản ghi dị
    thường (xem §8.4).

### 8.3 Khung chết #83? (3e7a7b51) — MỘT bản ghi + khung chết #82? (caveat CÒN)

- **Khung chết #83?: (22:16:31Z, 23:26:58Z] (1h10'27") —
  MỘT bản ghi duy nhất.** Quan sát cuối là mtime file
  `docs/PHASE9_ROUND133_LIMITS.md` 22:16:31Z (T10-133 viết
  LIMITS gộp lúc đóng, quy trách nhiệm được). Quét
  `find -newermt` trên toàn `hidden_files/` + `docs/` +
  `repo-1` (trừ node_modules) + `/tmp` + `agents/` cho
  khoảng (22:04:37Z, 23:26:58Z] không trả thêm mốc nào sau
  22:16:31Z: hidden_files muộn nhất là
  `round133-t10.done` 22:13:15Z; /tmp trống trong cửa sổ;
  agents exec-log muộn nhất 22:04:37Z; memory log 17/11
  mtime 16:08:33Z (không ghi thêm trên boot cũ).
  Tuổi thọ #83? theo khung: **34'51"–1h45'18"** (btime
  21:41:40Z → quan sát cuối 22:16:31Z = 34'51"; danh nghĩa
  1h45'18").
- **Gap #83?→#84? danh nghĩa (btime→btime) = 1h45'18"
  (6.318 s) — SPAN** (chưa chứng nhận; T2-134 kiểm mù #53).
  Không có dải cơ học công bố trước cho #84? (dải
  [20:07:15Z, 22:01:22Z] của T2-133 là dải cho #83?, và
  #83? thật 21:41:40Z đã nằm trong dải — lần thứ 13 liên
  tiếp INSIDE; T6 KHÔNG cộng dồn INSIDE cho #84? từ dải
  đó). T2-134 tính dải cho #85?.
- **Khung chết #82? (07da9c50): ghi cả hai bản ghi như
  T6-133 §8.4 / T10-133 §10.2 — (a) chính (21:28:35Z,
  21:41:40Z] (13m05s); (b) hẹp hơn (21:29:47Z, 21:41:40Z]
  (11m53s), không quy trách nhiệm được; khung hẹp nhất
  làm chuẩn. Caveat CÒN (T6-134 xác nhận lại): mốc chính
  21:28:35Z nay CHỈ CÒN trong hồ sơ T6 đợt 133 — mtime
  sống của `build-loop-log.md` hiện là 23:52:47Z (đã ghi
  đè nhiều lần: mục mở đợt 134 + các mục T9/T4 lúc
  23:52Z); nội dung dòng T8-133 vẫn còn trong file (dòng
  6785) và ghi chú caveat vẫn còn (dòng 6798), nhưng mtime
  21:28:35Z không đo lại được từ đĩa. T10-133 §10.2 đã ghi
  caveat này; T6-134 xác nhận nó vẫn đứng.**

### 8.4 Boot mới #85? + khung chết #84? (đóng góp mới của T6 đợt này) — CÓ DỊ THƯỜNG ĐỒNG HỒ

- **Reboot GIỮA LUỘT lần thứ 9 theo định nghĩa gộp**
  (d2e66749 → 81335571, btime 23:53:17Z). Reboot giết
  attempt1 lượt yên #11 của T4 giữa pass 3/20 (§3) và
  giết poller gốc của T4 (PID 14270, chết theo runtime
  restart); không giết holder lock nào còn sống (lock đã
  sạch theo §3.1 — trap release đã chạy, chỉ mất dòng
  log). T4 đã khởi động lại poller 23:56:13Z chờ
  POSTBOOT_PASS mới của T5 cho boot 81335571.
- **Boot mới: boot_id `81335571-099d-4896-b180-620577ac8140`,
  btime 23:53:17Z** (`uptime -s` = 23:53:17Z, `who -b` =
  Nov 17 23:53, `/proc/1` 23:53:34Z — chênh +17 s, cùng mẫu
  các boot trước; `journal --list-boots` chỉ 1 dòng
  81335571). Uptime ~9' lúc T6 đóng 2 (00:02Z).
- **Gap #84?→#85? danh nghĩa (btime→btime) = 26'19"
  (1.579 s) — SPAN** (chưa chứng nhận; T2-134 kiểm mù
  #53/#54). Đây là gap ngắn nhất trong chuỗi #78→#85
  (các gap trước 5.040–8.558 s) — nhưng vẫn SPAN cho tới
  khi T2 chứng nhận; T6 không kết luận gì từ độ ngắn.
- **Khung chết #84? (d2e66749): HAI bản ghi — ghi cả hai,
  KHÔNG ép một chuẩn duy nhất vì hai bản ghi MÂU THUẪN
  NHAU (dị thường đồng hồ):**
  - (a) **(23:52:47Z, 23:53:17Z] (30 s) — bản ghi theo
    MTIME FILE, có thể quy trách nhiệm:** quan sát cuối
    là mtime file `build-loop-log.md` 23:52:47Z (mục parent
    ghi T9 XONG 23:51Z + T4 đang chạy attempt1). Quét
    `find -newermt` trên toàn `hidden_files/` + `docs/` +
    `repo-1` (trừ node_modules) + `/tmp` + `agents/` cho
    khoảng (22:16:31Z, 23:53:17Z] chỉ trả thêm các mốc
    ≤23:52:47Z (T2 `blind53-merged.log` 23:52:41Z; T9
    LIMITS 23:51:28Z; `round134-t9.done` 23:51:47Z; T4 JSON
    23:52:10Z) — không có quan sát nào khác trong khoảng
    chết theo mtime. Tuổi thọ #84? theo khung này:
    **25'49"–26'19"** (btime 23:26:58Z → 23:52:47Z =
    25'49"; danh nghĩa 26'19").
  - (b) **BẢN GHI DỊ THƯỜNG — quan sát cuối theo NỘI DUNG
    LOG VƯỢT QUA btime boot mới (khung rỗng/đảo ngược):**
    heartbeat trong `round134-t4/poll-t4.nohup.log` +
    `chain-t4.log` ghi tới **23:53:50Z** (elapsed=100s,
    pass 3/20) — muộn hơn btime boot mới 23:53:17Z **33
    giây**; file `cooldown-t4` có mtime **23:53:53Z** —
    muộn hơn btime **36 giây** (§3.1). Nếu tin các mốc
    nội dung này là quan sát trên boot cũ thì khung chết
    là **(23:53:50Z, 23:53:17Z] — RỖNG**, không tồn tại.
    T6 KHÔNG ép khung (a) làm chuẩn duy nhất khi (b) tồn
    tại — tiền lệ "khung hẹp nhất làm chuẩn" không áp
    được cho khung rỗng mâu thuẫn. **Diễn giải có căn cứ
    nhất: đồng hồ boot cũ chạy nhanh hơn đồng hồ boot mới
    khoảng 33–40 s tại ranh giới reboot** (clock skew giữa
    hai boot; cùng họ hiện tượng T2 đã đo bằng F82?/F83?
    với biên ±10–15 s — lần này lớn hơn). T2/T5 là chủ
    quản phân tích đồng hồ (F-metrics, session bound);
    T6 chỉ ghi raw evidence: btime mới 23:53:17Z (uptime
    -s, khớp /proc/1 23:53:34Z + journal first entry
    23:53:34Z) vs heartbeat cuối 23:53:50Z vs cooldown-t4
    23:53:53Z.
  - Lưu ý: T4 ghi "Poller goc (PID 14270) chet theo runtime
    restart" — runtime restart đi kèm reboot; tiến trình
    chờ của chính T6 (sleep) cũng chết theo reboot nhưng
    T6 không dùng thời gian đo được của nó làm mốc khung
    chết (độ trễ reaping của runtime sau reboot, như T6-133
    §8.4 đã nêu) — chỉ ghi nhận T6 còn sống trên boot cũ
    tới lúc shutdown (đóng 1 lúc 23:50:13Z, kiểm tiếp
    23:55:23Z đã sang boot mới).

### 8.5 VERDICT: chuỗi tương đối CHỐT #57→#85 — số tuyệt đối VẪN TẠM (giữ "?")

- **CHỐT ĐƯỢC — chuỗi tương đối:** 29 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #85 (23:53:17Z 17/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→#76→#77→#78
  →#79→#80→#81→#82→#83→#84→#85 đều có ≥2 nguồn độc lập
  xác nhận (T5 + T2 + T6 + T9 + T10 + file mtime + T4).
  Không có bằng chứng nào về một boot quan sát được mà
  chưa đếm.
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Bốn lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-134 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (§8.4(b))** cho thấy ngay cả btime cũng có thể lệch
    ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM.
- **Kết luận cho parent:** T6-134 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 2 boot (#84? ranh giới, #85? mới);
  số thứ tự tuyệt đối **vẫn TẠM** và phải giữ "?" cho tới
  khi có bằng chứng ngoài VM. Không bịa số, không bỏ "?"
  khi chưa đủ bằng chứng — đúng như brief giao.
- Hệ quả thực hành: T9-134 gọi boot lúc mở là "#84?" trong
  LIMITS của mình là đúng quy ước tạm; T10-134 gọi boot
  sau reboot là "#85?" là đúng quy ước tạm; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #9 cho reboot này) — T5 ghi "lần thứ 8" là
  lệch 1 so với định nghĩa đã chốt (F-134-T6-1). Các quyết
  parent trước vẫn đứng: không quyết con số tuyệt đối nào
  ở đây.

### 8.6 Reboot #85? giết attempt1 của T4 — không mất việc của luồng nào khác ngoài attempt đang chạy

- Reboot d2e66749 → 81335571 (btime 23:53:17Z) giết attempt1
  lượt yên #11 của T4 giữa pass 3/20 (JSON partial, phải
  chạy lại trên boot mới — quyết định của T4, có căn cứ:
  reboot là lỗi harness ngoài phép đo). Không giết holder
  lock nào còn sống (lock đã sạch theo §3.1).
- **Không luồng nào khác mất việc:** các cờ `.done` đã có
  trước reboot — T3-fix 23:5xZ, T9 23:51:47Z (T1/T7.done
  xuất hiện sau reboot, trên boot mới — T6 không dùng làm
  bằng chứng "trước reboot"). T10 chưa spawn lúc T6 đóng
  1 (thư mục `round134-t10/` xuất hiện lúc ~00:02Z —
  T10 sẽ đóng sổ trên boot mới #85?).

## 9. Replay apt sau boot #85?: THUỘC T5 — T6 không kết luận

- T6 đợt này không kiểm `dpkg.log` (không thuộc 4 việc
  brief giao). Lúc kiểm ~00:02Z thấy các luồng T2/T5 đang
  chạy trên boot mới; T5 đã viết `t5-newboot-state.md`
  23:58Z (dpkg 2 dòng / 0 installs, replay chưa chạy xong
  lúc đó — T5 là chủ quản). Verdict replay / cờ
  POSTBOOT_PASS boot mới thuộc T5-134 (cờ cũ cho boot
  d2e66749 đã STALE, pass_at 23:49:21Z).
- **Lock không bị ảnh hưởng** (trống trước/sau mọi thao tác
  của T6, xem §2 — trừ ca t4 §3.1 đã giải thích).

## 10. Dọn Xvfb: 0 Xvfb, 0 socket sót — /tmp/.X11-unix/ trống lúc mở, đóng 1 và đóng 2

- **Lúc mở (23:45Z), lúc đóng 1 (23:50Z) và lúc đóng 2
  (~00:02Z, sau reboot): `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb
  đang chạy (`pgrep -x Xvfb` rc=1 cả ba lần; quét
  `/proc/*/cmdline` không có process nào tên Xvfb). Không
  có Xvfb sót nào từ đợt 133 (reboot đã xóa tmpfs; T4-134
  chạy WebKit harness trên boot #84? và attempt bị giết
  theo reboot — 0 process vite/webkit sót sau reboot).
- T4-134 đã chạy attempt1 lượt yên #11 (23:50:17–23:53:5xZ)
  trên boot #84? — attempt bị reboot giết, không còn
  process nào của nó sau reboot (T4 xác nhận "0 process
  vite/webkit/probe sot").
- **Không kill process nào** trong phiên này (không có Xvfb
  sót để kill; T6 không đụng process luồng khác theo nhiệm
  vụ).
- **RAM khả dụng (đo của T6, không phải số chính thức —
  thuộc T9):** 2.087 MB lúc 23:50Z trên boot #84?; 1.064
  MB lúc 00:02Z trên boot mới #85? (tổng 7.934 MB) —
  RAM tụt sau reboot, phù hợp cửa sổ vàng sau boot đã
  qua nhanh / các luồng khác đã khởi động lại. T9-134 đo
  chính thức (`.done` 23:51Z trên boot cũ); số RAM trên
  boot mới thuộc T9-134/T10.

## 11. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **23:45:08Z** (boot #84? đã 18'10"
  tuổi); đóng 1 **23:50:13Z**; đóng 2 **~00:02:27Z** (boot
  #85? đã ~9'10" tuổi). Đợt 134 mở **23:35Z**
  (round-in-progress.md) — tức **482 s sau btime boot
  #84? (23:26:58Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — lần thứ 3 liên
  tiếp, +7.135 s (chuỗi đợt 130 +5.251 s → đợt 131 +1.585
  s → đợt 132 +7.135 s). Lượt đợt 132 ghi started_at
  19:34:46Z dù T7 đợt 132 đã thấy cùng run_id running lúc
  17:40Z; started_at ghi 31 s sau btime boot mới
  19:34:15Z.
- **T6 đợt này chỉ ghi mốc, không kết luận:** T7-134 là chủ
  quản kiểm slot/started_at (cờ `round134-t7.done` xuất
  hiện lúc ~00:02Z, sau khi T6 đóng 2 — T6 không đọc nội
  dung cờ này). Ghi nhận để T7/T10 đối chiếu: đợt 134 mở
  482 s sau btime #84? (khác hẳn mẫu đợt 132: started_at
  chỉ 31 s sau btime) — nếu dị thường tái diễn thì nó
  không gắn với "mở ngay sau boot" theo cùng một cách;
  nguyên nhân (hành vi ghi log của scheduler sau reboot
  hay lỗi đếm slot) vẫn mở, thuộc T7.

## 12. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#84?/#85?) VẪN TẠM (xem §8.5):**
  chuỗi tương đối #57→#85 đã chốt (29 boot); số tuyệt đối
  giữ "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa
  6, mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới
  #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn (không kiểm
  lại đợt này theo quyết parent); (c) mù #51 đoạn B mở,
  tối đa 3 ẩn (recheck3 không đổi); (d) mù #52 đóng hoàn
  toàn nhưng không làm neo được; (e) dị thường đồng hồ
  #84?→#85? (§8.4(b)) cho thấy btime cũng có thể lệch
  ~35 s. Journal/wtmp chỉ giữ boot hiện tại (journal
  `--list-boots` chỉ 1 dòng 81335571; wtmp bắt đầu
  23:53:xxZ) nên T6 suy ra số hiệu từ thứ tự thời gian +
  hồ sơ các đợt trước, không phải từ log hệ thống.
- **F-134-T6-1 — nhãn đếm của T5 lệch 1 so với định nghĩa
  gộp (không đổi verdict):** T5 gọi reboot #84?→#85? là
  "lần thứ 8", định nghĩa gộp §10.2 đợt 133 cho "sự kiện
  thứ 9". Chỉ là nhãn đếm; btime/boot_id/khung chết của
  cả hai reboot đều đúng. T10/parent thống nhất nhãn khi
  đóng sổ.
- **F-134-T6-2 — ca mất dòng RELEASED do reboot ĐẦU TIÊN
  (không phải sai số của T6, là phát hiện mới):** trap
  release của run-attempt ghi cooldown TRƯỚC khi ghi log
  RELEASED (script v2 dòng ~430 vs log_event sau đó);
  reboot cắt ngang giữa hai bước → dir sạch + cooldown
  chạm mtime 23:53:53Z nhưng log thiếu RELEASED (t4, dòng
  869). Log giữ mãi 1 ACQUIRED không cặp. Không phải lỗi
  lock, không phải holder quên nhả; T10-134 ghi chú ca
  này lúc đóng. Đổi thứ tự ghi (log trước, cooldown sau)
  hoặc fsync cần quyết parent — T6 không tự sửa script.
- **F-133-T6: KHÔNG CÓ sai số mới từ đợt 133.** Không lặp
  lại F-132-T6-1 (repro chạy đúng /tmp, §6); không có
  double-acquire / TIMEOUT / STALE-LOCK mới; không có
  event lock nào mất dấu hay thêm lạ ngoài ca t4 §3.1
  (+2 dòng khớp từng con số); khung chết #83? chỉ có một
  bản ghi (không có bản hẹp thứ hai như #82? — đã quét
  đủ, không ép thêm); khung chết #84? ghi cả hai bản ghi
  nhưng KHÔNG ép một chuẩn duy nhất vì mâu thuẫn đồng hồ
  — ghi rõ lý do, không tự chọn chuẩn trái với bằng chứng.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; ngày
  đúng là **15/11** (F-131-T6-1, nhắc lại ở §8.1). Mù #49
  đoạn B mở + mù #51 đoạn B mở thuộc T2-134; mù #52 đã
  đóng hoàn toàn (T2-133); mù #53 mở từ probe #52, probe
  #53 + mù #54 thuộc T2-134.
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  liên tiếp không xóa tính flaky. Quyết tách T7 khỏi gate
  9/9 khi đợt đông vẫn thuộc về parent; T6 không tự đổi
  test.
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round132-t*/` (toàn đợt) +
  `round133-t*/` (toàn đợt) + `round134-t*/` tới 00:02Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T8/T10-134 chưa chạy xong tới thời điểm đếm; T6
  đợt 135 đếm tiếp.
- **Prune cooldown lần 9 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 78 ≤ trần 100 lúc chạy). File cũ
  nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z, theo
  `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 133 khép sạch trên lock (§3–§4):** chu kỳ O8 của
  T10-133 (22:02:37–22:04:37Z, hold 120s) sạch — T6 mở đợt
  134 đếm lại khớp đúng recount T10-133; **đợt 134 tới
  00:02Z có đúng 1 chu kỳ (t4) và là ca reboot-kill
  (§3.1).** Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối ~00:02Z (trống, 0 ticket + 78 cooldown); đợt
  còn chạy tới ~02:00Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–134 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Tuân thủ lock của luồng đo đợt 134 ĐÃ kiểm được:**
  T4 attempt1 lượt yên #11 (23:50:17Z acquire, hold bị
  cắt bởi reboot — xem §3.1) acquire đúng quy trình
  (ticket → acquire → trap release). T8/T10-134 chưa chạy
  — T6 đợt 135 kiểm tiếp.
- **Tuân thủ Xvfb luật đứng của đợt 134: CÓ bằng chứng mới
  tích cực** (T4 chạy WebKit harness trên boot #84? và
  sau reboot 0 Xvfb/socket/process sót — §10).
- **Replay apt #85? chưa có verdict** (thuộc T5-134 — xem
  §9).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` và
  `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro /tmp
  của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND134_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (prune
đã chạy, xóa 0 file; `cooldown-t4` cập nhật mtime 23:53:53Z
do trap release lúc reboot — xem §3.1, không phải do
prune), Xvfb (0 process; 0 socket sót).
Stage: `repo-1-push/paths-loop/phase9-round134-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round134-t6/` (analyze-log.py,
analyze-log-cleaned-open.txt, analyze-log-raw-873.txt,
analyze-log-cleaned-close.txt, analyze-log-cleaned-close2.txt,
analyze-log-raw-875.txt, vite-lock-v2-cleaned-867.log,
vite-lock-v2-cleaned-869.log, new-lines-since-867.txt,
cooldown-now.txt, prune-candidates.txt, prune-deleted.txt,
ps-full-open.txt, ps-full-close.txt, ps-full-close2.txt,
ss-open.txt, ss-close.txt, ss-close2.txt,
khong-nha-grep.txt, khong-nha-grep-close.txt,
khong-nha-grep-close2.txt, status-open.txt, status-close.txt,
status-close2.txt, test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg-fixed.sh, repro-newmsg.log).
