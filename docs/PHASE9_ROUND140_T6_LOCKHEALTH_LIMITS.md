# PHASE9 ROUND140 T6 — lock health + prune lần 15 + BOOT #97? INSIDE CẢ HAI DẢI — LIMITS

- Đợt: 140, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 00:35 +07 19/11/2026 (= 17:35:51Z 18/11). Chạy
  17:38:33Z → 17:42:13Z 18/11/2026, toàn bộ trên một boot duy
  nhất #97? (af558fb5) — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune lần 15, suite kiểm lock 9/9
  ×2, chốt chuỗi boot với boot #97? af558fb5 (btime 15:54:37Z),
  khung chết #95? giữ nguyên, khung chết #96? ghi cả hai ứng
  viên theo quyết parent đợt 139 §12.2(c), dải dự báo T6 độc
  lập cho #98? (FULL72 — chuẩn theo quyết parent (f)), ghi mọi
  sai số F-140-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round140-t6/` (status-open.txt,
  status-close.txt, ps-full-open.txt, ps-full-close.txt,
  ss-open.txt, ss-close.txt, boot-verify-open.txt,
  analyze-log-cleaned-open.txt,
  vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-close.log, vite-lock-v2-raw-open.log,
  analyze-log.py, cooldown-now-open.txt, cooldown-now.txt,
  prune-candidates.txt, prune-deleted.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg-fixed.sh,
  repro-newmsg-fixed140.sh, repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT #97? (số tạm theo quy ước, xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `af558fb5-e964-4116-a69b-ec784f3defab`, btime 15:54:37Z**
  (`/proc/stat` btime epoch 1795017277; `uptime -s` =
  15:54:37Z; `who -b` = Nov 18 15:54; `/proc/1` 15:54:52Z —
  chênh +15 s, cùng mẫu các boot trước; `journal --list-boots`
  chỉ 1 dòng af558fb5, first entry 15:54:53Z (boot +16 s —
  đúng mẫu +16 s của #92?/#93?/#94?/#95?); `wtmp` bắt đầu
  15:54:xxZ). Uptime ~1h44' lúc T6 bắt đầu (17:38:33Z),
  ~1h48' lúc đóng (17:42:13Z). Đây là **reboot #96?→#97? —
  sự kiện gộp #21** (theo T10-139 — xảy ra sau khi T2-139 đóng
  phiên 15:00:35Z, trước khi T10-139 đóng sổ 17:01:05Z; xem
  §8.0).
- **KHÔNG có mâu thuẫn btime lần này** (khác đợt 139): brief,
  `round-in-progress.md` và T2-140 prereg đều ghi đúng btime
  15:54:37Z. T2-140 `boot-verify.txt` (17:38:57Z) khớp đúng
  boot_id + btime + epoch của T6; T10-139
  `t10-closing-checks.txt` cũng ghi btime 15:54:37Z (kiểm
  16:41:44Z và 16:51:26Z). F97? do T2 đo: HTTP `Date` 3 server
  hơn local +1/+2/+2 s (xem `round140-t2/f97.txt`) — T6 không
  đo F, chỉ ghi bối cảnh.
- **Đợt 140 mở 17:36Z** (round-in-progress.md; sched
  17:35:51Z) — tức **6.083 s sau btime boot #97?
  (15:54:37Z)**. T6 mở 17:38:33Z (6.236 s sau btime).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline.
- Các luồng đợt 140 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round140-t1/t2/t4/t5/t7/t9/t10; T2-140 đã viết
  prereg + chạy probe #59 17:40:41Z (ok=2 fail=0, boot
  af558fb5) nhưng CHƯA viết LIMITS/.done lúc T6 đóng — T6 đối
  chiếu ở §8 với prereg-t2.md + boot-verify.txt + f97.txt +
  once.txt/status, không đọc nội dung cờ của luồng khác ngoài
  file T2 phục vụ đối chiếu; T4-140 đã có `run-attempt-140.sh`
  nhưng CHƯA acquire lúc T6 đóng — log không có dòng mới nào
  trong phiên T6, §2/§4).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật — 0 cổng lạ (lúc mở và lúc đóng)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 17:38Z
  (mở, `ps-full-open.txt`) và lúc 17:42Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: cả 2 lần **không có cổng TCP nào đang lắng
  nghe** (chỉ dòng header).
- **0 tiến trình vite/node/webkit/chromium thật** ở cả 2
  snapshot. Các dòng khớp "vite|node|webkit|chromium" đều là
  chuỗi lệnh shell, không phải process vite: lúc mở 1 dòng là
  lệnh đo của chính T6; lúc đóng 2 dòng — (a) lệnh của T5-140
  (`ram-sampler` + `vite --version`, pid 25610) và (b) lệnh đo
  của chính T6 (pid 25760, chứa chuỗi pattern grep trong args).
  Đã đối chiếu trực tiếp từng dòng.
- **0 tiến trình lock-script nào đang chạy** ở cả 2 snapshot.

## 2. Lock lúc mở và lúc đóng: TRỐNG cả hai lần; 0 chu kỳ mới trong phiên T6

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 17:38Z (mở) và lúc 17:42Z (đóng) — không có file owner
  stale nào, không cần dọn lock stale. (Kiểm trực tiếp bằng
  `ls -ld`; lần này T6 gọi status ĐÚNG ngay từ đầu, không
  override `VITE_LOCK_DIR` — xem F-139-T6-1 đã sửa.)
- `status` (gọi ĐÚNG, không override): `TRỐNG (không có
  lock)`, `0 ticket + 89 cooldown`, rc=0 lúc mở VÀ lúc đóng.
- **Log lock KHÔNG ĐỔI giữa mở và đóng: 999 dòng thô cả hai
  lần** — 0 chu kỳ mới trong phiên T6 (17:38–17:42Z); T4-140
  chưa acquire (§0). Dòng cuối vẫn là `2026-11-18T16:50:56Z
  t10-round139 RELEASED hold_s=121` (đợt 139).
- Khoảng yên: không có event lock nào từ 16:50:56Z (T10-139
  release) tới lúc T6 đóng — yên lặng này là do đợt 139 đã
  đóng và đợt 140 mới mở — không phải do lock kẹt (bằng
  chứng: suite độc lập 9/9 ×2, §6; các chu kỳ đợt 139 ngay
  trước đó đều acquire ngay khi cần, §4).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 31 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 10 chu kỳ mới kể từ
  lúc T6-139 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4):
  - t4-139 ×3 (14:54:30Z hold 292 s; 15:01:57Z hold 330 s;
    15:09:45Z hold 208 s, wait_s=1),
  - t8-round139 ×6 (15:39–15:54Z, hold 79/129/234/60/119/
    223 s, port 5390/5490 xen kẽ, 5 lần chờ cooldown ~15 s),
  - t10-round139 ×1 (16:48:55Z hold 121 s).
  - Cộng với 21 chu kỳ T6-139 đã đếm = **31 chu kỳ liên
    tiếp sạch trên thứ tự mới**.
  - Bằng chứng phiên bản: T4-139 dùng script repo
    (`run-attempt-139.sh` dòng 13:
    `LOCKV2=.../vcut-vite-lock-v2.sh`, md5 `520b8baa` lúc
    kiểm); T8-139 dùng script repo (`run-webkit-139t8.sh`
    dòng 27: `LOCK=.../vcut-vite-lock-v2.sh`, md5 `520b8baa`
    lúc kiểm); T10-139 dùng bản frozen
    `round139-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
    (kiểm trực tiếp đợt này).
- **File `cooldown-t8-round139` mtime 15:54:41Z** và
  **`cooldown-t10-round139` mtime 16:50:56Z** (release hợp
  lệ của t8/t10-139 — xem §4); file `cooldown-t4` mtime
  15:13:14Z (release hợp lệ của t4-139 — ghi đè cùng tên nên
  tổng số file không đổi vì chu kỳ này).

## 4. Nhất quán log lock: 958 dòng chính thức lúc T6-139 đóng → 993 lúc T6-140 đóng, 287 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z,
dòng 848–853 thô). Bản đã lọc lúc đóng có md5 `5b93de2f…`
— khớp đúng bản đã lọc lúc mở (open == close, không có dòng
mới nào trong phiên T6). Lúc mở (17:38Z): **999 dòng thô /
993 chính thức**; lúc đóng (17:42Z): **999 dòng thô / 993
chính thức** — diff bản đã lọc lúc đóng so với lúc T6-139
đóng: **đúng +35 dòng append** (10 chu kỳ mới), không có dòng
nào khác thay đổi; 958 dòng đầu của bản đã lọc khớp đúng
snapshot T6-139 (chuỗi không đứt).

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-139 (958) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 302 | 292 | 211 | 205 |
| ACQUIRED | 293 | 283 | 211 | 205 |
| RELEASED | 287 | 277 | 209 | 203 |
| COOLDOWN | 96 | 91 | 88 | 83 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **993** | **958** | **720** | **697** |

- So với snapshot T6-139 đóng (958 dòng): **+35 dòng =
  TICKET +10 / ACQUIRED +10 / RELEASED +10 / COOLDOWN +5 /
  TIMEOUT +0 / STALE +0** — đúng bằng 10 chu kỳ mới:
  t4-139 ×3 = 9 dòng (không có COOLDOWN mới vì port 5187
  đã có cooldown từ trước, ghi đè cùng tên) + t8-round139
  ×6 = 23 dòng (18 dòng T/A/R + 5 dòng COOLDOWN — 5 lần
  acquire phải chờ cooldown ~15 s trên port vừa nhả) +
  t10-round139 ×1 = 3 dòng (không có COOLDOWN mới vì port
  5554 chưa từng giữ trước đó trong đợt; dòng COOLDOWN chỉ
  ghi khi acquire phải chờ cooldown). Mọi chu kỳ đều sạch,
  ghép cặp đủ — khớp từng con số, không có event nào mất
  dấu hay thêm lạ ngoài ca t4 cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 993 dòng): **287 cặp ACQUIRED→RELEASED;
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
- Cửa sổ R120: **211 = 211 T/A, RELEASED 209** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  302+293+287+96+8+6+1 = 993 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 139 khép lại trên lock (toàn đợt): 11 chu kỳ sạch**
  — t4 ×4 (hold 6/292/330/208 s), t8 ×6 (hold 79/129/234/
  60/119/223 s), t10 ×1 (hold 121 s). T6-139 lúc đóng mới
  thấy 1 chu kỳ (t4 attempt1 hold 6 s); 10 chu kỳ còn lại
  T6 đợt này đếm bổ sung, khớp đúng recount T10-139 (log
  999 dòng thô lúc mở đợt 140; T10-139 đóng sổ ghi lock
  t10-round139 giữ 121 s, đã nhả).
  **Đợt 140 tới 17:42Z có 0 chu kỳ** (chưa có luồng nào
  acquire — T4-140 sẽ acquire khi chạy lượt yên #17).
  Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 138 (toàn đợt), đợt 139 (toàn đợt) và đợt 140 (tới 17:42Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round138-t*/` + `round139-t*/` +
`round140-t*/` (tới 17:42Z) + các file `.done` tương ứng
— theo quy tắc lăn: bỏ round137, thêm round139 (phần còn
lại sau T6-139) + round140. **Phương pháp đếm đợt này:
grep ra file /tmp trước, `--exclude='khong-nha-grep.txt'`,
rồi mới copy kết quả vào `round140-t6/khong-nha-grep.txt`**
(theo bài học race của T6-138 §5 — file grep-output lồng
nhau không được đếm lại). **Lưu ý phương pháp:** pattern
grep có dấu (`KHÔNG NHẢ` / `BỎ QUA release thừa`) — file
`round139-t6.done` viết bằng ASCII không dấu (`"KHONG
NHA"`) nên KHÔNG khớp pattern này; T6-139 cũng đếm trích
dẫn `.done` bằng pattern có dấu nên số học lăn dưới đây
nhất quán với đợt trước.
Tổng **11 dòng khớp chuẩn, phân loại đủ 11/11 — tất cả
đều là bản sao script / log repro / trích dẫn tài liệu, 0
sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round138-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round139-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 6 | `round138-t6/repro-newmsg.log` + `round139-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 1 | `round138-t6.done` (1) — câu trích số liệu T6, không phải sự kiện (`round139-t6.done` viết không dấu nên không khớp pattern có dấu — xem lưu ý phương pháp trên) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 138 (toàn đợt) / 139 (toàn đợt) / 140 nào |
| Round140-t* (trừ repro /tmp của T6) | 0 dòng | Chưa luồng nào acquire tới lúc đếm (§4); T4-140 sẽ acquire khi chạy lượt yên #17 |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt
  122 = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125
  = 0 (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0
  (toàn đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn
  đợt), đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt),
  đợt 132 = 0 (toàn đợt), đợt 133 = 0 (toàn đợt), đợt
  134 = 0 (toàn đợt), đợt 135 = 0 (toàn đợt), đợt 136
  = 0 (toàn đợt), đợt 137 = 0 (toàn đợt), đợt 138 = 0
  (toàn đợt), đợt 139 = 0 (toàn đợt — bổ sung 10 chu kỳ
  sau T6-139 đóng, §4), đợt 140 tới 17:42Z = 0.** Khớp với
  log pairing sạch ở §4 (287 cặp + 1 ca reboot-kill cũ đã
  giải thích — không liên quan nhánh release).
- Giới hạn phạm vi: T8/T10-140 chưa chạy xong tới 17:42Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  140, T6 đợt 141 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-139 đếm 15 dòng (4 script + 9
  repro + 2 trích dẫn); đợt này bỏ round137 (−2 script
  −3 repro −1 trích dẫn = −6) nhưng thêm round139-t10
  script (2) = +2 → 15 − 6 + 2 = **11 dòng** ✓.
  (round139-t10 KHÔNG có closing-copy — T10-139 viết
  LIMITS gộp trực tiếp; `round139-t6.done` không khớp
  pattern có dấu như đã giải thích.)

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
#97? (`af558fb5…`).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round140-t6/test-v2-t6-run1.log` 17:40:43Z,
`test-v2-t6-run2.log` 17:41:07Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ mười sáu liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — mười sáu lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ hai mươi hai liên tiếp (T6
  đợt 120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 139 + T6
  đợt 140).

### 6.2 Repro message ĐÚNG (`round140-t6/repro-newmsg.log`, 17:41:15Z)

Copy verbatim script của T6-139, chỉ đổi tên TDIR
(`vcut-t6r139-repro` → `vcut-t6r140-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–139, kết quả giống hệt:
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
  lúc đó có 89 cooldown; log thật vẫn 999 dòng thô lúc
  repro chạy và queue vẫn 89 file sau khi repro xong;
  không có file `cooldown-tA/tH/tB` nào xuất hiện trong
  queue thật. **F-132-T6-1 KHÔNG lặp lại.**
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (287 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất
  dấu khác — số chính thức đã loại 6 dòng repro lỗi của
  T6-132), 0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy
  nhất do reboot giữa lượt (đợt 130), 0 sự kiện "KHÔNG
  NHẢ" trên lock thật đợt 120–139 (toàn đợt) và đợt 140
  (tới 17:42Z), suite 9/9 độc lập ×2 lần chạy (T7 xanh cả
  hai lần), và thứ tự ghi mới đã có **31 chu kỳ thật**
  chứng minh (§3). **Không còn caveat nào về mất dòng
  RELEASED cho các chu kỳ mới** — caveat cũ chỉ còn là 1
  dòng lịch sử (t4, §3–§4 T6-136).

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 15 liên tiếp)

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
  - 17:41Z: lock TRỐNG (status 0 ticket + 89 cooldown)
    — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng) — tổng 89 file ≤ trần
    mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 140: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 15 liên tiếp prune xóa 0 file
    (đợt 126–140: 0 mỗi đợt).
  - Lưu ý: file `cooldown-t8-round139` mtime 15:54:41Z và
    `cooldown-t10-round139` mtime 16:50:56Z là **do
    release hợp lệ của t8/t10-139 (§3), KHÔNG phải do
    prune** (prune không tạo/cập nhật file, chỉ xóa). Số
    file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (17:38Z) **89 file / 1246 byte**;
  lúc đóng (17:42Z) **89 file / 1246 byte** (89 × 14 =
  1246 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 87 + 2 = 89 ✓ (2 file cooldown mới:
  `cooldown-t8-round139` + `cooldown-t10-round139`;
  `cooldown-t4` ghi đè cùng tên nên không tăng tổng).
  Không file nào bị xóa hay thêm giữa hai lần đếm của đợt
  này.
- Phân tầng tuổi lúc 17:41Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 27 file** (không đổi so với đợt 139 —
  không có file nào có mtime trong cửa sổ 15/11 14:49–
  17:40Z để vượt 72h giữa hai lần đếm; đúng quy luật tuổi,
  không phải thêm/xóa); **≥48h (`-mtime +1`): 45 file**
  (tăng từ 41 đợt 139 — 4 file mtime 16/11 14:49–17:40Z
  vừa vượt 48h, đúng quy luật tuổi). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 17:41Z mới **~95h03' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#97?; số tuyệt đối VẪN TẠM; khung chết #95? 400 s GIỮ; khung chết #96? HOÃN theo quyết parent (c); #97? INSIDE cả hai dải

### 8.0 Reboot #96?→#97? — sự kiện gộp #21, giữa lượt 139 (theo T10-139)

- Reboot 541524e2 → af558fb5 (btime 15:54:37Z) xảy ra sau
  khi T2-139 đóng phiên (15:00:35Z), trước khi T10-139
  đóng sổ (17:01:05Z) — **sự kiện gộp #21**, phân loại
  "giữa lượt 139" theo T10-139 (`t10-closing-checks.txt`:
  "Reboot giua luot: 1 lan — 541524e2 -> af558fb5, btime
  15:54:37Z (su kien gop #21)"). Parent đã chấp nhận đóng
  đợt 139 với "1 reboot giữa lượt (sự kiện #21)" (§12.2(a)
  đợt 139).
- **Dị thường đồng hồ kèm theo (F-139-T8-3, nhắc lại):**
  mốc cuối trên boot cũ theo T8 là ~15:54:42Z (muộn hơn
  btime boot mới 15:54:37Z 5 s) — T10-139 cũng ghi "xay ra
  SAU khi harness T8 xong 15:54:41Z — moc cuoi boot cu
  muon hon btime moi 5 s, di thuong dong ho F-139-T8-3".
  Dị thường này là lý do hai khung chết #96? không giao
  nhau (§8.4) và là lý do parent hoãn quyết khung #96?
  (§12.2(c) đợt 139). T6 không đo lại dị thường này.
- **Không luồng nào mất việc do reboot này trong phiên
  T6:** T6 mở 17:38:33Z và đóng 17:42:13Z toàn bộ trên boot
  mới, không bị reboot cắt (uptime liền mạch 1h44' →
  1h48'). Reboot xảy ra trước khi đợt 140 mở (17:36Z).
- **Replay apt #97?: THUỘC T5** — T6 không kiểm
  `dpkg.log`. Chỉ ghi bối cảnh từ file của T2-140
  (`round140-t2/dpkg97.txt`, T2 đọc độc lập): **1.545 dòng
  / 221 installs / 462 configure**, lần ghi cuối 16:11:16Z
  (gstreamer1.0-tools) — khớp hoàn toàn hình dạng replay
  của các boot trước (#94?/#96?). Bracket chính thức thuộc
  về T5-140.
- **/tmp đã bị reboot xóa sạch (từ đợt 139):** các TDIR
  suite `/tmp/vcut-lock-v2-test.*/` tự dọn bằng trap; TDIR
  repro của T6 đợt này đã dọn sạch sau khi xong (bản fixed
  in "TDIR cleaned").

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1 / T6-138 §8.1 / T6-139 §8.1):
  khoảng **11:39:50Z → 23:45:17Z ngày 15/11 (12h05'27")**,
  **A+D đóng, B+C mở** (2 cửa sổ mở, tổng ~9h48'14"),
  **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn C). Parent đã
  **chấp nhận để mở** (QUYẾT PARENT 7 đợt 119) — T6 KHÔNG
  thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Khoảng mù #37 là 15/11 11:39:50Z → 23:45:17Z, KHÔNG phải
  16/11 — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #97?)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 / T6-138 §8.2 /
T6-139 §8.2 (mỗi boot liệt kê với boot_id + btime lấy từ ≥1
nguồn độc lập; btime→btime danh nghĩa = khoảng cách giữa hai
btime liên tiếp). Số thứ tự là số tạm theo thứ tự thời gian
(tất cả đều mang "?") — xem verdict §8.7. **Định nghĩa đếm
dùng: định nghĩa gộp của T10 (LIMITS gộp đợt 133 §10.2) —
mọi reboot quanh đợt, cả giữa lượt lẫn ranh giới — theo
quyết F-133-6.** Bảng dưới chỉ ghi 6 boot cuối (chuỗi đầy đủ
#57→#91 xem T6-131 §8.2 + T6-132 §8.2 + T6-133 §8.2 +
T6-134 §8.2 + T6-135 §8.2 + T6-136 §8.2 + T6-137 §8.2 +
T6-138 §8.2 + T6-139 §8.2 — không chép lại để khỏi drift;
T6 đợt này đã đối chiếu lại với LIMITS gộp đợt 139: các boot
#92?→#96? dưới đây khớp đúng btime/boot_id T10-139 đã chốt,
không có boot_id lạ nào xuất hiện trong bất kỳ bằng chứng
18/11 nào ngoài chuỗi này — trừ boot mới af558fb5 dưới
đây).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #92 | 1ca1feaa | 05:29:18Z 18/11 | 2h37m53s (9.473 s, #91→#92 — SPAN); sống tới 08:07:11Z | T6-136 + T2-136 (prereg + probe #55) |
| #93 | 2104246b | 08:07:11Z 18/11 | 1h28m50s (5.330 s — gap #93?→#94?, CHỨNG NHẬN [5.320, 5.340] s theo quyết parent đợt 138 §12.3(k)); sống tới 09:36:01Z | T6-137 + T2-137 (prereg + probe #56) |
| #94 | 17db9652 | 09:36:01Z 18/11 | 2h16m19s (8.179 s — gap #94?→#95?, CHỨNG NHẬN [8.169, 8.189] s, T2-139); sống tới 11:52:20Z | T6-138 + T2-138 (prereg + probe #57 + merged mù #57 A đóng) |
| #95 | 914964c3 | 11:52:20Z 18/11 | 2h01m21s (7.281 s — gap #95?→#96?, CHỨNG NHẬN [7.271, 7.291] s, T2-139); sống tới 13:53:41Z | T2-138 §6 + T10-138 .done + T2-139 (merged mù #58 A+B đóng) |
| #96 | 541524e2 | 13:53:41Z 18/11 | 2h00m56s (7.256 s — gap #96?→#97?, CHỜ chứng nhận từ merged mù #59); sống tới 15:54:37Z | T6-139 + T2-139 (prereg + probe #58 + merged mù #58 B+C đóng) |
| #97 | af558fb5 | 15:54:37Z 18/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp) + T2-140 prereg + boot-verify + probe #59 (17:40:41Z, ok=2 fail=0) + T10-139 closing-checks |

- **Ghi chú bảng:** các hàng #92–#95 chép nguyên từ bảng
  T6-139 (đã qua soát xét đợt 139); hàng #96 T6 đợt này cập
  nhật trạng thái chứng nhận mới (gap #95?→#96? đã chứng
  nhận [7.271, 7.291] s nhờ merged mù #58 đóng hoàn toàn);
  hàng #97 là boot mới. Nhãn gap trong ngoặc ở mỗi hàng là
  gap ứng với tuổi thọ danh nghĩa của boot đó (btime → btime
  boot sau).
- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #93?→#94? là sự kiện thứ 18** (GIỮA lượt 137);
  **#94?→#95? là sự kiện thứ 19** (GIỮA lượt 138 — XÁC
  NHẬN theo quyết parent đợt 138 §12.3(e)(iv));
  **#95?→#96? là sự kiện thứ 20** (trong cửa sổ đóng sổ
  đợt 138 — đã XÁC NHẬN nhờ merged mù #58 đóng, T2-139);
  **#96?→#97? là sự kiện thứ 21** (GIỮA lượt 139 — theo
  T10-139; parent đã chấp nhận, §12.2(a) đợt 139).
- **T2-140 đối chiếu khớp (độc lập, trước khi T6 đo):**
  prereg-t2.md §0 ghi boot mới `af558fb5…`, btime
  15:54:37Z (đọc trực tiếp 17:38:57Z), gọi là #97? ứng viên
  (nếu không có reboot ẩn giữa 13:53:41Z và 15:54:37Z;
  T6-140 chốt chuỗi tương đối); `boot-verify.txt` khớp
  đúng boot_id + btime của T6 (uptime -s 15:54:37Z, btime
  epoch 1795017277); probe #59 (17:40:41Z, theo once.txt:
  `probe#59 boot=af558fb5 ok=2 fail=0`) xác nhận boot đang
  sống. Hai luồng khớp nhau hoàn toàn về boot_id, btime,
  epoch và số tạm. T2-140 cũng ghi rõ marker đợt 140 KHÔNG
  có mâu thuẫn btime lần này.
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#93: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3 +
    T6-138 §8.2–§8.4 + T6-139 §8.2–§8.4 (không chép lại).
    Lưu ý theo quyết parent đợt 139 §12.2(b): khung chết
    #94? **GIỮ chuẩn (11:52:12Z, 11:52:20Z] (8 s)**,
    KHÔNG đổi sang ứng viên 2 s của T2 (caveat dị thường
    đồng hồ F-139-T2-6; khung 2 s đòi hỏi timestamp chính
    xác tới 2 s trong khi dị thường đã ghi nhận tới 5 s);
    khung chết #93? bản chuẩn **(09:35:47Z, 09:36:01Z]
    (14 s)** GIỮ nguyên.
  - #94: khung chuẩn 8 s (quyết parent (b) đợt 139); ứng
    viên 2 s của T2 ghi kèm caveat, xét lại nếu T2-140 giải
    quyết được dị thường đồng hồ.
  - #95: khung ứng viên 400 s (xem §8.3).
  - #96: hai khung không giao nhau, HOÃN QUYẾT (xem §8.4).

### 8.3 Khung chết #95? — ứng viên 400 s GIỮ NGUYÊN (quét lại, không có bằng chứng mới)

- **Khung chết #95? ứng viên: (13:47:01Z, 13:53:41Z]
  (400 s)** — T2/T6/T10 đồng thuận đợt 139; T2-140 prereg
  §0 xác nhận giữ nguyên trừ khi có bằng chứng mới.
- T6 quét lại toàn `hidden_files/` + `docs/` trong cửa sổ
  (13:47:01Z, 13:53:41Z] (python walk theo mtime float):
  **3 file, tất cả cùng một sự kiện** (release T10-138,
  mtime 13:47:01.57–13:47:01.62Z): `vite.lock.queue/
  cooldown-t10-round138`, `round138-t10/t10-o8-lock.log`,
  `round138-t10/t10-o8.log`. Không có quan sát nào từ sự
  kiện khác sau 13:47:01Z trong cây quét.
- Khác biệt so với T6-139 (đếm 4 file): file thứ 4 lúc đó
  là `vite-lock-v2.log` — mtime của log đã dịch về sau do
  các lần append sau đó (nay là 16:50:56Z), không phải bằng
  chứng mới; 3 file còn lại là cùng 3 file cũ, cùng mốc
  13:47:01Z. **Không có bằng chứng mới — khung 400 s giữ
  nguyên.** Merged của T2-140 (mù #59) không phủ cửa sổ
  này (mù #59 bắt đầu 14:44:16Z); khung chuẩn cuối cùng
  vẫn chờ T2 khi có merged phủ — T6 không tự chốt.
- Mốc ~13:50Z của T1-139 (bản nháp aggregate đợt 138 soạn
  ~13:50Z trên boot 914964c3) vẫn chỉ là mốc suy ra, không
  có file mtime cứng — T6 ghi nhận lại để T2 cân nhắc,
  không tự thu hẹp khung 400 s.

### 8.4 Khung chết #96? — HAI KHUNG KHÔNG GIAO NHAU, HOÃN QUYẾT THEO QUYẾT PARENT (c) — GHI CẢ HAI KÈM NGUỒN

- **Khung T9: (15:54:02Z, 15:54:37Z] (35 s)** theo dữ liệu
  sampler (T9-139 LIMITS §3 — mốc cuối sampler trên boot
  cũ 15:54:02Z).
- **Khung T8: (15:54:42Z, 15:55:24Z]** theo mốc cuối trên
  boot cũ (T8-139 — mốc cuối 15:54:42Z, sau btime boot mới
  15:54:37Z 5 s).
- **Hai khung không giao nhau** do dị thường đồng hồ 5 s
  (F-139-T8-3): btime 15:54:37Z sớm hơn mốc cuối boot cũ
  ~15:54:42Z. Quyết parent đợt 139 §12.2(c): **HOÃN QUYẾT
  — giao T2-140 chứng nhận bằng merged mù #59 rồi quyết
  sau**; theo luật đứng (đợt 130/131): khi hai bản ghi
  khung chết mâu thuẫn thì GHI CẢ HAI kèm nguồn, không
  chọn một khi chưa có bằng chứng phân xử.
- **Tình trạng lúc T6 đóng (17:42Z): T2-140 CHƯA công bố
  merged mù #59 / LIMITS / .done** (chỉ có prereg + probe
  #59 + các script điều tra, viết 17:40Z). T2-140 prereg §3
  kỳ vọng mốc cuối ≈ 15:54:02Z (T9 sampler) hoặc muộn hơn;
  khung T8 nằm SAU btime nên cần giải thích bằng dị thường
  đồng hồ — T2 ghi cả hai, không tự chọn nếu bằng chứng
  chưa đủ (quyết (c) cho phép vẫn hoãn). **T6 đợt này
  KHÔNG tự chốt khung #96?** — ghi cả hai khung + dị
  thường vào hồ sơ, chờ T2-140 rồi parent quyết. T10-140
  đối chiếu merged T2 khi có.
- Gap danh nghĩa #96?→#97? = **7.256 s (2h00'56")** — nằm
  trong dải chứng nhận [0h00'55", 3h14'08"]. Chứng nhận
  [7.246 s, 7.266 s] NẾU đoạn A mù #59 đóng (prereg T2-140
  §1 — T6 không tự chứng nhận, chờ merged).

### 8.5 #97? INSIDE CẢ HAI DẢI — chuỗi INSIDE theo dải cơ học kéo dài

Dải cho #97? theo T2-139 (p10–p90 FULL72, neo tại btime
#96? 13:53:41Z): **[14:21:34Z, 16:19:19Z]** (T2-139 công
bố; code T6 tính lại cho 14:21:35Z — lệch 1 s do làm tròn
nội suy p10, cùng lớp F-139-T2-4; verdict không đổi).
Dải T6-139 (FULL70): **[14:21:19Z, 16:19:37Z]**. Thực tế
btime #97? **15:54:37Z — NẰM TRONG cả hai dải**.
- Theo dải chuẩn (quyết parent (f) đợt 138 — dải T2 FULL70
  neo tại #94?): #96? đã OUTSIDE (muộn hơn cận trên 6.705 s)
  nên chuỗi INSIDE theo dải chuẩn đứt ở #96?; nhưng theo
  dải cơ học (neo tại boot ngay trước), #96? INSIDE, #97?
  INSIDE — **chuỗi INSIDE theo dải cơ học kéo dài thành 4
  lần liên tiếp (#94?, #95?, #96?, #97?)**. T6 báo cả hai
  cách đọc như mọi đợt; dải chuẩn cho #98? là dải T2
  (FULL72) theo quyết parent (f) đợt 139 — xem §8.6.
- Tốc độ reboot tới #97?: 97 / 187,61 h = **1 mỗi 116,0
  phút** (tới #96?: 96 / 185,59 h = 1 mỗi 116,0 phút —
  chênh 0,0 phút/boot, trong nhiễu). Không có thay đổi
  chế độ. (Tính bằng code: từ #1 2026-11-10T20:18:10Z tới
  #97? 2026-11-18T15:54:37Z = 187,61 h.) Cộng dồn ẩn tối
  đa: +4 (mù #29/#30/#31) → 1 mỗi 111,4 phút; +3 nữa
  (mù #53 đoạn B) → 1 mỗi 108,2 phút; +2 nữa (mù #55 đoạn
  B quy ước) → 1 mỗi 106,2 phút; +1 nữa (mù #56 đoạn A quy
  ước) → 1 mỗi 105,2 phút; **+0 nữa (mù #57 ĐÓNG + mù #58
  ĐÓNG, tối đa 0)** → 107 / 187,61 h = 1 mỗi 105,2 phút.

### 8.6 Dải dự báo cho boot #98? (T6 tính độc lập — TRÙNG KHỚP dải T2)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 / T6-138 §8.6 /
T6-139 §8.6 — p10–p90 của phân phối FULL72 (p10 = 1.674 s,
p90 = 8.738 s; T2-139 §2.5), cộng vào btime #97? 15:54:37Z.
**T6 dùng FULL72 (không dùng FULL70)** theo quyết parent
đợt 139 §12.2(f): dải T2 (FULL72) làm chuẩn cho #98?;
FULL70 đã cũ (không gồm hai gap mới chứng nhận đợt 139).
Dải FULL70 chỉ ghi làm tham chiếu dưới đây:

- **Dải dự báo T6 cho #98? (FULL72): [16:22:31Z,
  18:20:15Z]** (15:54:37Z + 1.674 s = 16:22:31Z; 15:54:37Z
  + 8.738 s = 18:20:15Z). Tính bằng code (python3), không
  nhẩm.
- **Đối chiếu với T2: TRÙNG KHỚP HOÀN TOÀN.** T2-140
  prereg §2 công bố dải chuẩn (FULL72) cho #98? là
  **[16:22:31Z, 18:20:15Z]** — giống hệt dải T6 tính độc
  lập (cùng p10/p90, cùng neo). Dải hiệu dụng sau probe
  #59: [17:40:41Z, 18:20:15Z] (probe #59 xong 17:40:41Z).
- Tham chiếu (stale): dải FULL70 cho #98? là [16:22:15Z,
  18:20:33Z] — chênh ≤18 s so với dải FULL72, đúng như
  quyết parent (f) đã ghi ("Chênh ≤18 s").
- Lưu ý: nếu T2-140 chứng nhận thêm gap #96?→#97? (CERT
  57→58 / FULL 72→73) thì p10/p90 có thể dịch vài giây như
  tiền lệ đợt 138/139 — dải trên đây là dải FULL72, T2 là
  chủ quản dải chuẩn.

### 8.7 VERDICT: chuỗi tương đối CHỐT #57→#97? — số tuyệt đối VẪN TẠM (giữ "?"); #96?/#97? chờ merged mù #59

- **CHỐT ĐƯỢC — chuỗi tương đối:** 37 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #97? (15:54:37Z 18/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→…→#95→#96
  →#97 đều có ≥2 nguồn độc lập xác nhận (T5 + T2 + T6 +
  T9 + T10 + file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-140 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #96?→#97? lần này CÓ dị
    thường mới kiểu đó — F-139-T8-3, 5 s, §8.0 — nhưng
    một lần có dị thường không xóa tiền lệ, mà củng cố nó.)
  - **Mù #57 + mù #58 ĐÃ ĐÓNG HOÀN TOÀN (T2-138, T2-139):**
    số #94?/#95?/#96? nay đã xác nhận theo quy ước (không
    còn reboot ẩn giữa #93?→#94?→#95?→#96?); mù #56 A vẫn
    MỞ theo quyết parent (e) — số #93? vẫn mang tính quy
    ước headline.
  - **MỚI — mù #59 CHƯA ĐÓNG lúc T6 đóng:** T2-140 đã chạy
    probe #59 (17:40:41Z, ok=2 fail=0, boot af558fb5) nhưng
    chưa công bố merged/LIMITS/.done lúc 17:42Z. Số #97?
    là TẠM THỜI cho tới khi T2 đóng merged — nếu đoạn A
    đóng (tối đa 0 ẩn) thì af558fb5 CHÍNH LÀ #97? (theo quy
    ước); nếu A MỞ thì số có thể cao hơn. T6-140 chốt chuỗi
    TƯƠNG ĐỐI (af558fb5 là boot quan sát được tiếp theo
    sau 541524e2, không có boot quan sát được nào ở giữa)
    — số thứ tự tuyệt đối #97? chờ verdict của T2-140.
    **Ghi rõ "chờ T2" theo brief; T10 gộp.**
- **Kết luận cho parent:** T6-140 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 1 boot (#97? — reboot #21 giữa lượt
  139); số thứ tự tuyệt đối **vẫn TẠM** và phải giữ "?" cho
  tới khi có bằng chứng ngoài VM (và, riêng #97?, tới khi
  mù #59 đóng). Không bịa số, không bỏ "?" khi chưa đủ bằng
  chứng — đúng như brief giao.
- Hệ quả thực hành: T9-140 gọi boot lúc mở là "#97?"
  trong LIMITS của mình là đúng quy ước tạm; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #21 cho reboot #96?→#97? — theo T10-139, parent
  đã chấp nhận). Các quyết parent trước vẫn đứng: không
  quyết con số tuyệt đối nào ở đây.

### 8.8 Reboot #96?→#97? — không mất việc của luồng T6; T6 không bị cắt

- Reboot 541524e2 → af558fb5 (btime 15:54:37Z) xảy ra sau
  lần đo cuối của T2-139 (15:00:35Z), trước khi T10-139
  đóng sổ (17:01:05Z) — **không giết attempt hay holder
  lock nào của đợt 140** (đợt 140 mở sau đó, 17:36Z, trên
  boot mới). T8-139 đã xong harness trên boot cũ (mốc cuối
  ~15:54:42Z theo đồng hồ boot cũ — xem dị thường §8.0);
  T10-139 đóng sổ trên boot mới (suite/O8 16:42–16:50Z).
- **Không luồng đợt 140 nào mất việc trong phiên T6:**
  T6 mở 17:38:33Z và đóng 17:42:13Z toàn bộ trên boot mới,
  không bị reboot cắt (uptime liền mạch 1h44' → 1h48');
  chưa có chu kỳ lock nào của đợt 140 (§4).
- **Replay apt sau boot #97?: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-140 là chủ
  quản verdict replay / cờ POSTBOOT_PASS boot mới; T2-140
  đã đọc độc lập 1.545/221/462 (xem §8.0).
- **/tmp đã bị reboot xóa sạch (từ đợt 139):** thư mục
  cut-sim của T6-135 đã biến mất theo reboot #94? (T6-137
  đã ghi); các TDIR suite `/tmp/vcut-lock-v2-test.*/` tự
  dọn bằng trap; TDIR repro của T6 đợt này đã dọn sạch
  sau khi xong (bản fixed in "TDIR cleaned").

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **17:38:33Z** (boot #97? đã 1h43'56"
  tuổi); đóng **17:42:13Z** (boot #97? đã ~1h47'36" tuổi).
  Đợt 140 mở **17:36Z** (round-in-progress.md) — tức
  **6.083 s sau btime boot #97? (15:54:37Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — giả thuyết
  "scheduler ghi lại started_at khi hồi phục sau reboot"
  ĐÃ ĐƯỢC XÁC NHẬN đợt 134 (lần thứ 5 liên tiếp, +6.967
  s, = btime + 40 s), tái diễn đợt 135 (lần thứ 6, +36 s),
  đợt 136 (lần thứ 7), đợt 137 (lần thứ 8 — bằng chứng
  trực tiếp ĐẦU TIÊN, started_at = btime + 46 s) và đợt
  138 (lần thứ 9, btime + 50 s).
- **T6 đợt này chỉ ghi mốc, không kết luận:** T7-140 là
  chủ quản kiểm slot/started_at. Ghi nhận để T7/T10 đối
  chiếu: đợt 140 mở 6.083 s sau btime #97?; nếu dị thường
  tái diễn thì started_at lượt này rơi vào khoảng
  15:55:1x–15:55:2xZ, tức TRƯỚC khi đợt mở 17:36Z; nguyên
  nhân vẫn thuộc T7.

## 10. Dọn Xvfb: 0 Xvfb chạy; 0 socket sót — /tmp/.X11-unix/ trống

- **Lúc mở (17:38Z): `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb
  đang chạy (`pgrep -x Xvfb` rc=1; quét `/proc/*/cmdline`
  không có process nào tên Xvfb).
- **Lúc đóng (17:42Z): 0 Xvfb đang chạy** (pgrep rc=1),
  `/tmp/.X11-unix/` vẫn TRỐNG.
- **Không kill process nào** trong phiên này (không có
  Xvfb sót để kill; T6 không đụng process luồng khác theo
  nhiệm vụ).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-140; T2-140
  boot-verify ghi MemAvailable 913.408 kB lúc 17:38:57Z —
  dưới gate A 1.024 MB — số RAM thuộc T2, T6 chỉ ghi bối
  cảnh).

## 11. Tuân thủ lock của luồng đo đợt 139 ĐÃ kiểm được + đợt 140 tới nay

- **T4-139 acquire + release sạch ×3 bổ sung** (14:54:30Z
  hold 292 s; 15:01:57Z hold 330 s; 15:09:45Z hold 208 s,
  wait_s=1 — attempt1-chạy-lại + attempt2 + attempt3 lượt
  yên #16; ticket khớp log). T4 dùng script repo
  (`run-attempt-139.sh` dòng 13, md5 `520b8baa`) — tức chạy
  trên **thứ tự ghi mới** (§3).
- **T8-139 acquire + release sạch ×6** (15:39–15:54Z, hold
  79/129/234/60/119/223 s, port 5390/5490 xen kẽ, 5 lần chờ
  cooldown ~15 s — ticket khớp log). T8 dùng script repo
  (`run-webkit-139t8.sh` dòng 27, md5 `520b8baa`) — tức chạy
  trên **thứ tự ghi mới** (§3).
- **T10-139 acquire + release sạch ×1** (16:48:55Z →
  16:50:56Z hold 121 s, port 5554, ticket khớp log).
  T10 dùng bản frozen `round139-t10/vcut-vite-lock-v2.t10.sh`,
  md5 `520b8baa` (kiểm trực tiếp đợt này) — tức chạy trên
  **thứ tự ghi mới** (§3).
- **Tổng kết đợt 139: 11/11 chu kỳ sạch, trên thứ tự ghi
  mới** — 31 chu kỳ liên tiếp sạch kể từ lúc T6-135 đóng
  (§3).
- **T4-140 chưa acquire** tới lúc T6 đóng (§2) — chưa có gì
  để kiểm tuân thủ. Khi acquire, T4 sẽ dùng script repo
  (`run-attempt-140.sh` dòng 13:
  `LOCKV2=.../vcut-vite-lock-v2.sh`, md5 `520b8baa` lúc
  kiểm); T6 đợt 141 kiểm tuân thủ + đếm chu kỳ mới.
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Xem F-140-T6-1 về đường dẫn thử đầu tiên.
- **Tuân thủ Xvfb luật đứng của đợt 137: CHƯA CÓ bằng chứng
  mới** (T4-140 chưa chạy attempt tới lúc T6 đóng; không để
  lại socket sót nào đo được lúc T6 mở/đóng đợt 140;
  /tmp đã bị reboot xóa).

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-140-T6-1 (mới, xem dưới).**
- **F-140-T6-1 — Thử đọc preview.tsx bằng đường dẫn sai
  (mới):** lúc kiểm md5, T6 gọi `md5sum` với đường dẫn
  `apps/web/src/editor/preview.tsx` — file này KHÔNG tồn
  tại (đường dẫn đúng là `apps/web/src/preview.tsx`).
  **Không ảnh hưởng kết luận:** T6 tìm lại bằng `find`
  (chỉ 1 file `preview.tsx` ngoài node_modules) và xác minh
  md5 `530e10a7` khớp đúng fix giữ vĩnh viễn. Bài học: đường
  dẫn preview.tsx là `apps/web/src/preview.tsx`, không có
  `editor/` ở giữa — các đợt sau dùng đúng đường dẫn này.
- **Số hiệu boot mới (#97?) VẪN TẠM (xem §8.7):**
  chuỗi tương đối #57→#97? đã chốt (37 boot); số tuyệt đối
  giữ "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối
  đa 6, mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới
  #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51
  đoạn B mở, tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng
  không làm neo được; (e) dị thường đồng hồ #84?→#85?
  (§8.4(b) đợt 134) + dị thường mới F-139-T8-3 (5 s,
  §8.0); **(f) MỚI: mù #59 chưa đóng — số #97? chờ verdict
  T2-140; mù #56 A vẫn MỞ (quyết parent (e)) — số #93?
  cũng vẫn quy ước headline**.
  Journal/wtmp chỉ giữ boot hiện tại (journal `--list-boots`
  chỉ 1 dòng af558fb5; wtmp bắt đầu 15:54:xxZ) nên T6 suy
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
  + mù #59 MỚI MỞ (T2-140 đang điều tra; probe #59 xong
  17:40:41Z ok=2 fail=0, merged chưa công bố lúc T6 đóng);
  mù #52 đã đóng hoàn toàn (T2-133); mù #54 đã đóng hoàn
  toàn (T2-135).
- **F-139-T6-1 (cũ, nhắc lại):** T6-139 gọi `status` với
  `VITE_LOCK_DIR` sai lúc mở (tuổi thư mục hidden_files bị
  đọc nhầm thành tuổi lock dir). T6 đợt này đã gọi status
  ĐÚNG ngay từ đầu (không override) — không lặp lại.
- **F-136-T6-1 (cũ, nhắc lại):** T1-135 viết sai nhãn boot
  ("Boot hiện tại lúc kiểm: 8ae55060" cho phiên 02:40–
  02:54Z — boot sống lúc đó là 78b55838). Không lặp lại
  ở đợt này: T6-140 ghi đúng boot sống af558fb5 (khớp
  T2-140 boot-verify + probe #59 + T10-139 closing-checks).
  (Lưu ý §8.0: nhãn "Boot lúc đóng: 914964c3" trong
  round138-t10.done là cùng mẫu — file được ghi trên boot
  mới nhưng nhãn đúng cho phiên làm việc của T10.)
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn (`round134-t10.done` thay vì
  `round134-t6.done`); tổng 17 không đổi. T6-140 đã đếm
  lại đúng (§5: trích dẫn = 1, gồm `round138-t6.done`;
  `round139-t6.done` viết không dấu nên không khớp pattern
  có dấu — đã giải thích phương pháp ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  sáu liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round138-t*/` (toàn đợt) +
  `round139-t*/` (toàn đợt) + `round140-t*/` tới 17:42Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T8/T10-140 chưa chạy xong tới thời điểm đếm; T6
  đợt 141 đếm tiếp.
- **Prune cooldown lần 15 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 89 ≤ trần 100 lúc chạy). File
  cũ nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z,
  theo `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 139 khép sạch trên lock (§4):** 11 chu kỳ (t4 ×4 +
  t8 ×6 + t10 ×1) sạch — T6 đợt này đếm bổ sung 10 chu kỳ
  sau khi T6-139 đóng, khớp đúng recount T10-139; **đợt
  140 tới 17:42Z có 0 chu kỳ** (chưa có luồng nào acquire).
  Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 17:42Z (trống, 0 ticket + 89 cooldown); đợt
  còn chạy tới ~20:00Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–139 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 31 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt #97? chưa có verdict** (thuộc T5-140 — xem
  §8.8; T2-140 đã đọc độc lập 1.545/221/462).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- **T2-140 CHƯA XONG lúc T6 đóng (17:42Z):** probe #59 xong
  17:40:41Z (ok=2 fail=0) nhưng merged mù #59 + LIMITS +
  .done chưa có. Theo brief, T6 ghi rõ "chờ T2" và để T10
  gộp — KHÔNG tự suy đoán số boot #97?, không tự chứng nhận
  gap #96?→#97?, không tự chốt khung chết #96? cuối cùng.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND140_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t8-round139` + `cooldown-t10-round139`
do release hợp lệ của t8/t10-139, `cooldown-t4` do release
hợp lệ của t4-139 — xem §3), Xvfb (0 process; 0 socket sót).
Stage: `repo-1-push/paths-loop/phase9-round140-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round140-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, boot-verify-open.txt,
analyze-log-cleaned-open.txt, vite-lock-v2-cleaned-open.log,
analyze-log-cleaned-close.txt, vite-lock-v2-cleaned-close.log,
vite-lock-v2-raw-open.log, analyze-log.py,
cooldown-now-open.txt, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg-fixed.sh, repro-newmsg-fixed140.sh,
repro-newmsg.log).
