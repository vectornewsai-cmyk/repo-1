# PHASE9 ROUND137 T6 — lock health + prune lần 12 + BOOT MỚI #93? NGOÀI DẢI — LIMITS

- Đợt: 137, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 15:35 +07 18/11/2026 (= 08:35Z). Chạy 08:40:23Z →
  08:49:23Z 18/11/2026, toàn bộ trên một boot duy nhất #93?
  (2104246b) — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune, suite kiểm lock 9/9 ×2, chốt
  chuỗi boot với boot mới 2104246b, kiểm tra có phải boot #93?
  không (dải dự báo đợt 136 cho #93? là [05:56:47Z, 07:55:21Z]
  — 08:07:11Z nằm ngoài dải, cần giải thích), đối chiếu với T2
  (gap #92?→#93?, khung chết #92?), ghi mọi sai số F-137-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên).
- Thư mục làm việc: `hidden_files/round137-t6/` (status-open.txt,
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

## 0. Trạng thái lúc bắt đầu — BOOT #93? (số tạm, xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `2104246b-04b2-4252-a642-b1a7cadeefe1`, btime 08:07:11Z**
  (`uptime -s` = 08:07:11Z, `who -b` = Nov 18 08:07,
  `/proc/1` 08:07:26Z — chênh +15 s, cùng mẫu các boot trước;
  `journal --list-boots` chỉ 1 dòng 2104246b, first entry
  08:07:27Z; `wtmp` bắt đầu 08:07:27Z; btime epoch
  1794989231). Uptime ~33' lúc T6 bắt đầu (08:40:23Z),
  ~42' lúc đóng (08:49:23Z). Đây là **reboot #92?→#93? —
  sự kiện gộp #17** (ranh giới, sau khi đợt 136 đóng 07:26Z,
  trước khi đợt 137 mở 08:35Z).
- **Btime 08:07:11Z NẰM NGOÀI dải dự báo đợt 136 cho #93?**
  [05:56:47Z, 07:55:21Z] — muộn hơn cận trên 710 s (11'50").
  Đây là lần OUTSIDE đầu tiên sau chuỗi 4 lần INSIDE liên
  tiếp (#89?–#92?) — giải thích ở §8.4, KHÔNG phải lỗi đo:
  btime đọc trực tiếp, 3 nguồn khớp nhau (uptime -s +
  /proc/stat btime + journal/wtmp). T2-137 prereg đã độc
  lập đi tới cùng kết luận trước khi T6 đo (ghi thành sai
  số dự báo của T2, F-137-T2-? — T6 không đánh số trùng).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 137 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round137-t1/t2/t3; T2-137 đã viết prereg +
  boot-verify + chạy probe #56 — T6 đối chiếu ở §8, không
  đọc nội dung cờ của luồng khác ngoài file T2 phục vụ đối
  chiếu).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật — 0 cổng lạ (lúc mở và lúc đóng)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 08:40Z
  (mở, `ps-full-open.txt`) và lúc 08:49Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: cả 2 lần **không có cổng TCP nào đang lắng
  nghe** (chỉ dòng header).
- **0 tiến trình vite/node/webkit/chromium thật** ở cả 2
  snapshot (1 dòng khớp "vite" trong file ps lúc đóng chỉ
  là chuỗi lệnh shell của chính lệnh đo của T6 — không phải
  process vite; đã đối chiếu trực tiếp từng dòng; lúc mở
  0 dòng khớp).
- **0 tiến trình lock-script nào đang chạy** ở cả 2 snapshot
  (lúc mở chưa có acquire nào của đợt 137; lúc đóng vẫn
  chưa — log không đổi giữa mở và đóng, §2/§4).

## 2. Lock lúc mở và lúc đóng: TRỐNG cả hai lần; không có event lock nào trong phiên T6

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 08:40Z (mở) và lúc 08:49Z (đóng) — không có file owner
  stale nào, không cần dọn lock stale.
- `status` lúc mở và lúc đóng: `TRỐNG (không có lock)`,
  `0 ticket + 84 cooldown`, rc=0 cả hai lần.
- **Log lock KHÔNG ĐỔI giữa mở và đóng:** diff bản đã lọc
  lúc mở vs lúc đóng rỗng — không có acquire/release nào
  của đợt 137 tới lúc T6 đóng (T4/T8-137 chưa acquire;
  T2-137 probe không dùng lock).
- Log thật lúc mở và lúc đóng: **929 dòng thô / 923 dòng
  chính thức** — dòng cuối `2026-11-18T07:18:31Z t10-round136
  RELEASED hold_s=117`.
- Khoảng yên trước đợt: không có event lock nào từ
  07:18:31Z (t10-round136 release) tới lúc T6 đóng — yên
  lặng này là do đợt 136 đã đóng và đợt 137 mới mở — không
  phải do lock kẹt (bằng chứng: 5 chu kỳ đợt 136 đều sạch,
  §4; suite độc lập 9/9 ×2, §6).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 11 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 4 chu kỳ mới kể từ
  lúc T6-136 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED, file
  cooldown được ghi — xem §4):
  - t8-round136 ×3 (05:59–06:07Z, hold 78/136/243 s —
    chu kỳ thứ 2 và 3 có chờ cooldown 15 s, đúng cơ chế),
  - t10-round136 ×1 (07:16:34Z, hold 117 s).
  - Cộng với 7 chu kỳ T6-136 đã đếm (t4-135, t8-135 ×4,
    t10-135, t4-136) = **11 chu kỳ liên tiếp sạch trên
    thứ tự mới**.
  - Bằng chứng phiên bản: T8-136 gọi thẳng script repo
    (`run-webkit-136t8.sh` dòng 16:
    `LOCK=.../vcut-vite-lock-v2.sh`, md5 `520b8baa` lúc
    kiểm); T10-136 dùng bản frozen
    `round136-t10/vcut-vite-lock-v2.t10.sh`, md5
    `520b8baa` (kiểm trực tiếp đợt này).
- **File `cooldown-t4` mtime 05:52:07Z KHÔNG ĐỔI kể từ đợt
  136** (release hợp lệ của t4-136 — xem §4 T6-136);
  2 file cooldown mới so với lúc T6-136 đóng:
  `cooldown-t8-round136` (06:07Z) và
  `cooldown-t10-round136` (07:18Z) — đúng 2 chu kỳ mới
  có tên riêng (t8 ghi đè cùng tên 2 lần, t4 ghi đè cùng
  tên nên tổng chỉ +2, không phải +4).

## 4. Nhất quán log lock: 909 dòng chính thức lúc T6-136 đóng → 923 lúc mở đợt 137, 267 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc mở
(08:40Z) và lúc đóng (08:49Z) — hai lần đếm giống hệt
nhau (log không đổi trong phiên, §2). Số chính thức đã
loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z, dòng
848–853 thô). 847 dòng đầu của bản đã lọc có md5
`9048174e…` — khớp đúng snapshot đã lọc của
T6-132/T6-133/T6-134/T6-135/T6-136 (chuỗi không đứt).
Diff bản đã lọc lúc mở đợt này so với lúc T6-136 đóng:
**đúng +14 dòng append** (4 chu kỳ mới), không có dòng
nào khác thay đổi.

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-136 (909) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 282 | 278 | 191 | 185 |
| ACQUIRED | 273 | 269 | 191 | 185 |
| RELEASED | 267 | 263 | 189 | 183 |
| COOLDOWN | 86 | 84 | 78 | 73 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **923** | **909** | **650** | **627** |

- So với snapshot T6-136 đóng (909 dòng): **+14 dòng =
  TICKET +4 / ACQUIRED +4 / RELEASED +4 / COOLDOWN +2 /
  TIMEOUT +0 / STALE +0** — đúng bằng 4 chu kỳ mới:
  t8-round136 ×3 (hold 78/136/243 s) = 11 dòng
  (3×3 + 2 COOLDOWN — chu kỳ đầu không có COOLDOWN vì
  port 5390 chưa từng giữ trước đó trong đợt; 2 chu kỳ
  sau chờ cooldown 15 s trên port 5490) + t10-round136
  ×1 (hold 117 s) = 3 dòng. Mọi chu kỳ đều sạch, ghép
  cặp đủ — khớp từng con số, không có event nào mất dấu
  hay thêm lạ ngoài ca t4 cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134):
  **267 cặp ACQUIRED→RELEASED; 0 "đang giữ" theo cách
  ghép tham lam của script** — nhưng đọc kỹ: chênh
  ACQUIRED − RELEASED = 6 = **5 ca double-acquire đã biết
  + 1 ca t4 mồ côi (dòng 869, ACQUIRED 23:50:17Z)**.
  Dòng 869 **vẫn là ACQUIRED duy nhất không có RELEASED
  thật của chính nó** (F-134-T6-2); KHÔNG phải lock kẹt.
  0 lần RELEASED không có ACQUIRED trước đó.
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
- Cửa sổ R120: **191 = 191 T/A, RELEASED 189** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  282+273+267+86+8+6+1 = 923 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 136 khép lại sạch trên lock (toàn đợt): 5 chu kỳ
  (t4 ×1 hold 218 s + t8 ×3 hold 78/136/243 s + t10 ×1
  hold 117 s) đều sạch** — T6-136 lúc đóng mới thấy 1
  chu kỳ (t4); 4 chu kỳ còn lại T6 đợt này đếm bổ sung
  khớp đúng recount T10-136. **Đợt 137 tới lúc T6 đóng
  có 0 chu kỳ** (chưa luồng nào acquire).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 135 (toàn đợt), đợt 136 (toàn đợt) và đợt 137 (tới 08:49Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round135-t*/` + `round136-t*/` +
`round137-t*/` (tới 08:49Z) + các file `.done` tương ứng
— theo quy tắc lăn: bỏ round134, thêm round137. Tổng
**16 dòng khớp chuẩn, phân loại đủ 16/16 — tất cả đều
là bản sao script / log repro / trích dẫn tài liệu, 0 sự
kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round135-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round136-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 9 | `round135-t6/repro-newmsg.log` + `round136-t6/repro-newmsg.log` + `round137-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.3) |
| Trích dẫn trong tài liệu | 3 | `round135-t10/PHASE9_ROUND135_LIMITS.closing-copy.md` (1) + `round136-t10/PHASE9_ROUND136_LIMITS.closing-copy.md` (1) + `round135-t6.done` (1) — câu trích số liệu T6, không phải sự kiện |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 135 (toàn đợt) / 136 (toàn đợt) / 137 nào |
| Round137-t* (trừ repro /tmp của T6) | 0 dòng | T4/T8-137 chưa acquire; T1/T2/T3-137 không dùng lock tới lúc đếm |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt
  122 = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125
  = 0 (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0
  (toàn đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn
  đợt), đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt),
  đợt 132 = 0 (toàn đợt), đợt 133 = 0 (toàn đợt), đợt
  134 = 0 (toàn đợt), đợt 135 = 0 (toàn đợt), đợt 136
  = 0 (toàn đợt — bổ sung 4 chu kỳ sau T6-136 đóng, §4),
  đợt 137 tới 08:49Z = 0.** Khớp với log pairing sạch ở §4
  (267 cặp + 1 ca reboot-kill cũ đã giải thích — không
  liên quan nhánh release).
- Giới hạn phạm vi: T4/T8/T10-137 chưa chạy xong tới 08:49Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  137, T6 đợt 138 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-136 đếm 18 dòng (4 script + 9
  repro + 5 trích dẫn); đợt này bỏ round134 (−2 script
  −3 repro −3 trích dẫn [aggregate-draft, closing-copy,
  round134-t6.done] = −8) nhưng thêm round136-t10 script
  (2), round136-t10 closing-copy (1) và round137-t6 repro
  (3) = +6 → 18 − 8 + 6 = **16 dòng** ✓.
- Lưu ý: `round136-t6.done` có **0** dòng khớp mẫu (grep -c
  = 0) — khác `round135-t6.done` (1 dòng, dòng 4). Không
  phải sai số: nội dung .done của T6-136 không trích câu
  đó; chỉ ghi nhận để T6 sau khỏi đếm nhầm.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
#93? (`2104246b…`).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round137-t6/test-v2-t6-run1.log` 08:45:03Z,
`test-v2-t6-run2.log` 08:45:26Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ mười ba liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — mười ba lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ mười chín liên tiếp (T6 đợt
  120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 136 + T6 đợt
  137).

### 6.2 Repro message ĐÚNG (`round137-t6/repro-newmsg.log`, 08:45:34Z)

Copy verbatim script của T6-136, chỉ đổi tên TDIR
(`vcut-t6r136-repro` → `vcut-t6r137-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–136, kết quả giống hệt:
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
  lúc đó có 84 cooldown; log thật vẫn 929 dòng thô và
  queue vẫn 84 file sau khi repro xong; không có file
  `cooldown-tA/tH/tB` nào xuất hiện trong queue thật.
  **F-132-T6-1 KHÔNG lặp lại.**
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (267 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất
  dấu khác — số chính thức đã loại 6 dòng repro lỗi của
  T6-132), 0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy
  nhất do reboot giữa lượt (đợt 130), 0 sự kiện "KHÔNG
  NHẢ" trên lock thật đợt 120–136 (toàn đợt) và đợt 137
  (tới 08:49Z), suite 9/9 độc lập ×2 lần chạy (T7 xanh cả
  hai lần), và thứ tự ghi mới đã có **11 chu kỳ thật**
  chứng minh (§3). **Không còn caveat nào về mất dòng
  RELEASED cho các chu kỳ mới** — caveat cũ chỉ còn là 1
  dòng lịch sử (t4, §3–§4 T6-136).

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 12 liên tiếp)

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
  - 08:47Z: lock TRỐNG (status 0 ticket + 84 cooldown)
    — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng) — tổng 84 file ≤ trần
    mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 137: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 12 liên tiếp prune xóa 0 file
    (đợt 126–137: 0 mỗi đợt).
  - Lưu ý: file `cooldown-t4` mtime 05:52:07Z là **do
    release hợp lệ của t4-136 (§3), KHÔNG phải do
    prune** (prune không tạo/cập nhật file, chỉ xóa). Số
    file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (08:40Z) **84 file / 1176 byte**;
  lúc đóng (08:49Z) **84 file / 1176 byte** (84 × 14 =
  1176 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 84 + 0 = 84 ✓. Chỉ 2 file mới so với lúc
  T6-136 đóng: `cooldown-t8-round136` và
  `cooldown-t10-round136` (đúng 2 chu kỳ mới của đợt 136
  có tên riêng; `cooldown-t4` ghi đè cùng tên nên tổng
  chỉ +2, không phải +4). Không file nào bị xóa hay thêm
  giữa hai lần đếm của đợt này.
- Phân tầng tuổi lúc 08:47Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 14 file** (giữ nguyên 14 như đợt 136);
  **≥48h (`-mtime +1`): 36 file** (tăng từ 32 đợt 136 —
  4 file mtime sáng 16/11 vừa vượt 48h giữa hai lần đếm,
  đúng quy luật tuổi, không phải thêm/xóa). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 08:47Z mới **~86h06' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#93?; số tuyệt đối VẪN TẠM; khung chết #92? MỘT bản ghi + một bản hẹp; #93? NGOÀI DẢI

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1): khoảng **11:39:50Z → 23:45:17Z ngày 15/11
  (12h05'27")**, **A+D đóng, B+C mở** (2 cửa sổ mở, tổng
  ~9h48'14"), **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn
  C). Parent đã **chấp nhận để mở** (QUYẾT PARENT 7 đợt
  119) — T6 KHÔNG thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Khoảng mù #37 là 15/11 11:39:50Z → 23:45:17Z, KHÔNG phải
  16/11 — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #93?)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 (mỗi boot liệt kê với boot_id +
btime lấy từ ≥1 nguồn độc lập; btime→btime danh nghĩa =
khoảng cách giữa hai btime liên tiếp). Số thứ tự là số tạm
theo thứ tự thời gian (tất cả đều mang "?") — xem verdict
§8.6. **Định nghĩa đếm dùng: định nghĩa gộp của T10 (LIMITS
gộp đợt 133 §10.2) — mọi reboot quanh đợt, cả giữa lượt
lẫn ranh giới — theo quyết F-133-6.** Bảng dưới chỉ ghi 5
boot cuối (chuỗi đầy đủ #57→#88 xem T6-131 §8.2 +
T6-132 §8.2 + T6-133 §8.2 + T6-134 §8.2 + T6-135 §8.2 +
T6-136 §8.2 — không chép lại để khỏi drift; T6 đợt này đã
đối chiếu lại với LIMITS gộp đợt 136: các boot #89?→#92?
dưới đây khớp đúng btime/boot_id T10-136 đã chốt, không
có boot_id lạ nào xuất hiện trong bất kỳ bằng chứng 18/11
nào ngoài chuỗi này).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #89 | 8ae55060 | 01:31:18Z 18/11 | 1h13m42s (4.422 s, #88→#89 — SPAN); sống tới 02:27:27Z | T10-134 (boot lúc đóng đợt 134) |
| #90 | 78b55838 | 02:27:27Z 18/11 | 56m09s (3.369 s, #89→#90 — SPAN); sống tới 03:35:20Z | T6-135 (brief + uptime/journal//proc/1) |
| #91 | bcc71e61 | 03:35:20Z 18/11 | 1h53m58s (6.838 s, #90→#91 — SPAN, xem §8.3 T6-136); sống tới 05:29:18Z | T10-135 (t10-reboot1.md; LIMITS gộp §đầu) |
| #92 | 1ca1feaa | 05:29:18Z 18/11 | 2h37m53s (9.473 s, #91→#92 — xem §8.3–§8.4); sống tới 08:07:11Z | T6-136 + T2-136 (prereg + probe #55) |
| #93 | 2104246b | 08:07:11Z 18/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp) + T2-137 prereg + boot-verify |

- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #91?→#92? là sự kiện thứ 16** (ranh giới, sau khi
  đợt 135 đóng 04:10Z, trước khi đợt 136 mở 05:35Z);
  **#92?→#93? là sự kiện thứ 17** (ranh giới, sau khi đợt
  136 đóng 07:26Z, trước khi đợt 137 mở 08:35Z). Không đợt
  nào từ 129 tới nay thiếu reboot.
- **T2-137 đối chiếu khớp (độc lập, trước khi T6 đo):**
  prereg-t2.md §0–§1 ghi boot mới `2104246b…`, btime
  08:07:11Z (đọc trực tiếp 08:40:18Z), gọi là ứng viên
  #93?; `boot-verify.txt` (2 lần verify 08:45:02Z +
  08:46:15Z) khớp đúng boot_id + btime của T6. Hai luồng
  khớp nhau hoàn toàn về boot_id, btime và số tạm.
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#91: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 (không chép lại). Lưu ý
    theo quyết parent đợt 136 §12.3(d)(e): khung chết
    #90? bản hẹp **(03:34:51Z, 03:35:20Z] (29 s)** làm
    chuẩn (khung 177 s giữ làm biên ngoài, caveat mốc
    0 byte); khung chết #91? bản hẹp **(04:42:27Z,
    05:29:18Z] (2.811 s)** làm chuẩn, bản ghi chính
    (04:19:07Z, 05:29:18Z] (4.211 s) đứng nguyên.
    (T6-136 ghi bản hẹp #91? là (04:42:10Z, …] (2.828 s)
    theo session-jsonl; con số 04:42:27Z của parent là
    mốc merged muộn hơn do T2 quét rộng hơn — khác phạm
    vi quét, không phải sai số đo; T6 dùng số parent đã
    chốt từ đây.)
  - #92: MỘT khung + một bản hẹp (xem §8.3).

### 8.3 Khung chết #92? (1ca1feaa) — MỘT bản ghi + một bản hẹp (không mâu thuẫn)

- **Khung chết #92?: (07:34:17Z, 08:07:11Z] (32m54s,
  1.974 s) — MỘT bản ghi chính, CÓ thể quy trách nhiệm.**
  Quan sát cuối là mtime file
  `docs/PHASE9_ROUND136_LIMITS.md` 07:34:17Z (LIMITS gộp
  đợt 136 viết lúc đóng, quy trách nhiệm được). Quét
  `find -newermt` trên toàn `hidden_files/` + `docs/` +
  `repo-1` (trừ node_modules) + `/tmp` cho khoảng
  (07:18:31Z, 08:07:11Z] chỉ trả thêm các mốc ≤07:34:17Z
  (`round136-t10.done` 07:25:54Z;
  `PHASE9_GAP_ANALYSIS.md` 07:25:27Z; closing-copy
  07:25:36Z; t10-count-final 07:24:21Z) — không có quan
  sát nào khác trong khoảng chết theo mtime ở các cây
  này. Tuổi thọ #92? theo khung này:
  **2h04'59"–2h37'53"** (btime 05:29:18Z → quan sát cuối
  07:34:17Z = 2h04'59"; danh nghĩa 2h37'53"). /tmp trống
  trong cửa sổ (chỉ có file T1-137 từ 08:41Z, trên boot
  mới).
- **Bản hẹp hơn: (08:05:05Z, 08:07:11Z] (2m06s, 126 s),
  KHÔNG quy trách nhiệm được** — mtime các file hệ thống
  ghi bởi runtime/main agent: `memory/bank/world.md` +
  `memory/bank/reflections.md` 08:05:05Z, session jsonl
  `~/agents/agent-ec0dbb77-…/sessions/….jsonl` 08:05:03Z,
  `~/MEMORY.md` 08:05:03Z, `~/memory/2026-11-18.md`
  08:03:35Z (nội dung cuối là mục ước tính 35–38% —
  main agent ghi memory sau khi trả lời user, không phải
  việc của luồng đợt 136). Theo tiền lệ khung #82? /
  #91? (T6-133 §8.4 / T6-135 §8.3 / T6-136 §8.3), ghi cả
  hai bản ghi và **khung hẹp nhất làm chuẩn** — hai bản
  ghi này KHÔNG mâu thuẫn nhau (chỉ khác độ quy trách
  nhiệm), khác hẳn trường hợp #84? đợt 134 (khung rỗng
  do dị thường đồng hồ) nên tiền lệ "khung hẹp nhất làm
  chuẩn" áp được ở đây.
- **Gap #92?→#93? danh nghĩa (btime→btime) = 2h37'53"
  (9.473 s) — SPAN** (chưa chứng nhận; T2-137 kiểm mù
  #56, đoạn A). T2-137 prereg: gap này nằm trong dải
  chứng nhận đã có [0h00'55", 3h14'08"] nên không tạo
  lớp dị thường mới; chứng nhận dạng khoảng CHỈ NẾU đoạn
  A mù #56 đóng (merged) + đoạn B đóng bằng uptime — nếu
  A mở thì gap GIỮ SPAN, không ép chứng nhận.
- **Không có dị thường đồng hồ mới ở ranh giới này:**
  btime mới 08:07:11Z (uptime -s) khớp /proc/1 08:07:26Z
  (+15 s, cùng mẫu các boot trước) và journal first entry
  08:07:27Z / wtmp 08:07:27Z; T2-137 f93.txt cho thấy đồng
  hồ local chỉ chậm ~1–2 s so với giờ internet (Date
  header) — không có lệch ~35 s như ranh giới #84?→#85?.
  Các quan sát cuối trên boot cũ đều ≤08:05:05Z < btime
  mới — khung chết không rỗng, không đảo ngược.
- **Hệ quả thực hành:** bản hẹp chứng minh máy vẫn sống
  và main agent còn hoạt động tới 08:05:05Z — chỉ 126 s
  trước reboot 08:07:11Z. Reboot xảy ra ~2 phút sau hoạt
  động cuối cùng của main agent, khi không còn luồng đợt
  nào đang chạy — phù hợp với giải thích OUTSIDE ở §8.4.

### 8.4 #93? NGOÀI DẢI — giải thích (không phải lỗi đo)

Dải cơ học cho #93? (p10–p90 FULL69, T2-136 §2.5):
**[05:56:47Z, 07:55:21Z]** (từ btime #92? 05:29:18Z);
dải hiệu dụng sau probe #55: [05:50:26Z, 07:55:21Z].
Thực tế **08:07:11Z — NẰM NGOÀI dải, muộn hơn cận trên
710 s (11'50")**. Gap danh nghĩa 9.473 s so với gap cận
trên p90 = 8.763 s (07:55:21Z − 05:29:18Z) — vượt 710 s,
tức ~8,1% trên p90. Chuỗi INSIDE 4 lần liên tiếp
(#89?/#90?/#91?/#92?) DỪNG; đây là lần OUTSIDE thứ 5
tổng cộng (sau cụm 4 lần #85?–#88?).

Giải thích — 3 lý do, không lý do nào là lỗi đo:

1. **Dải là p10–p90 theo định nghĩa: 10% số gap vượt
   cận trên là ĐÚNG KỲ VỌNG, không phải mô hình hỏng.**
   Một lần OUTSIDE phía trên sau 4 lần INSIDE liên tiếp
   hoàn toàn tương thích với phân vị p90 (xác suất ~10%
   mỗi lần, độc lập). Dải này là dự báo thống kê, không
   phải giới hạn vật lý — không có cơ chế nào bắt buộc
   reboot phải rơi trong dải. T2-137 ghi đây là "dự báo
   sai của dải T2-136" và tự đánh số sai số của họ
   (F-137-T2-?) — T6 đồng ý về sự kiện, không đánh số
   trùng.
2. **Reboot này là reboot RANH GIỚI sau khi đợt đã đóng,
   trong lúc máy nhàn rỗi.** Hoạt động có thể quy trách
   nhiệm cuối cùng là 07:34:17Z (T10 đóng đợt 136); sau
   đó chỉ còn ghi memory/session của main agent tới
   08:05:05Z (§8.3). Không có công việc nào buộc máy
   phải reboot sớm — thời điểm reboot trong cửa sổ nhàn
   rỗi do phía host quyết định, không tuân theo phân phối
   gap của các giai đoạn máy đang chạy đợt. Phân phối
   FULL69 trộn cả gap lúc chạy đợt và gap ranh giới nhàn
   rỗi; một reboot ranh giới chạy dài hơn p90 là điều
   phân phối này vốn đã chứa (chính 10% đuôi trên đó).
3. **Tốc độ reboot gần như KHÔNG ĐỔI — không có thay đổi
   chế độ.** Tới #93?: 93 / 179,82 h = 1 mỗi 116,0 phút;
   tới #92?: 92 / 177,19 h = 1 mỗi 115,6 phút. Chênh
   0,4 phút/boot — trong nhiễu. Nếu mô hình phân phối
   gap đã vỡ (ví dụ host đổi chính sách reboot), tốc độ
   này sẽ lệch rõ; nó không lệch. Kết luận: dải p10–p90
   vẫn dùng được như dự báo thống kê, chỉ cần ghi nhận
   lần OUTSIDE này vào FULL tiếp theo (T2) — không sửa
   dải giữa chừng, không đổi phương pháp vì 1 lần vượt.

### 8.5 Reboot #92?→#93? — không mất việc của luồng nào; T6 không bị cắt

- Reboot 1ca1feaa → 2104246b (btime 08:07:11Z) xảy ra sau
  khi đợt 136 đóng (07:26Z) và trước khi đợt 137 mở
  (08:35Z) — **không giết attempt hay holder lock nào**
  (lock đã trống từ 07:18:31Z, §2; đợt 136 đã đóng sổ).
- **Không luồng đợt 137 nào mất việc:** T6 mở 08:40:23Z
  và đóng 08:49:23Z toàn bộ trên boot mới, không bị reboot
  cắt (uptime liền mạch 33' → 42'); các cờ `.done` đợt
  137 xuất hiện trên boot mới.
- **Replay apt sau boot #93?: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-137 là chủ
  quản verdict replay / cờ POSTBOOT_PASS boot mới. Lưu ý
  từ T2-136 prereg: `dpkg.log` của boot #92? (1ca1feaa)
  đã MẤT theo reboot #93? (`/var/log` reset mỗi boot) —
  bracket #92? chỉ còn trong hồ sơ T10-136 nếu có.
- **/tmp đã bị reboot xóa sạch:** thư mục cut-sim của
  T6-135 (`/tmp/vcut-t6r135-cut-*`) mà T6-136 ghi "vẫn
  còn trên đĩa lúc đóng" nay đã biến mất; các TDIR suite
  `/tmp/vcut-lock-v2-test.*/` cũng không còn (suite tự
  dọn bằng trap). Không còn file rác T6 nào trên /tmp.

### 8.6 VERDICT: chuỗi tương đối CHỐT #57→#93? — số tuyệt đối VẪN TẠM (giữ "?"); #93? còn chờ mù #56 A

- **CHỐT ĐƯỢC — chuỗi tương đối:** 33 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #93? (08:07:11Z 18/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→…→#91→#92
  →#93 đều có ≥2 nguồn độc lập xác nhận (T5 + T2 + T6 +
  T9 + T10 + file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-137 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #92?→#93? lần này KHÔNG
    có dị thường — §8.3 — nhưng một lần sạch không xóa
    tiền lệ.)
  - **MỚI — mù #56 đoạn A CHƯA ĐÓNG lúc T6 đóng:** số
    #93? là TẠM THỜI cho tới khi T2 đóng đoạn A (merged)
    — nếu A đóng (tối đa 0 ẩn) thì boot này CHÍNH LÀ
    #93?; nếu A MỞ thì số có thể cao hơn (#94?+). T6-137
    chốt chuỗi TƯƠNG ĐỐI (2104246b là boot quan sát được
    tiếp theo sau 1ca1feaa, không có boot quan sát được
    nào ở giữa) — số thứ tự tuyệt đối #93? chờ verdict
    của T2-137.
- **Kết luận cho parent:** T6-137 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 1 boot (#93? ranh giới); số thứ tự
  tuyệt đối **vẫn TẠM** và phải giữ "?" cho tới khi có
  bằng chứng ngoài VM (và, riêng #93?, tới khi mù #56 A
  đóng). Không bịa số, không bỏ "?" khi chưa đủ bằng
  chứng — đúng như brief giao.
- Hệ quả thực hành: T9-137 gọi boot lúc mở là "#93?"
  trong LIMITS của mình là đúng quy ước tạm; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #17 cho reboot này — là sự kiện RANH GIỚI,
  không phải giữa lượt). Các quyết parent trước vẫn đứng:
  không quyết con số tuyệt đối nào ở đây.

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **08:40:23Z** (boot #93? đã 33'12"
  tuổi); đóng **08:49:23Z** (boot #93? đã ~42' tuổi).
  Đợt 137 mở **08:35Z** (round-in-progress.md) — tức
  **1.669 s sau btime boot #93? (08:07:11Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — giả thuyết
  "scheduler ghi lại started_at khi hồi phục sau reboot"
  ĐÃ ĐƯỢC XÁC NHẬN đợt 134 (lần thứ 5 liên tiếp, +6.967
  s, = btime + 40 s) và tái diễn đợt 135 (lần thứ 6 liên
  tiếp, +36 s sau btime 03:35:20Z — T10-135 §10.2) và
  đợt 136 (lần thứ 7 — MEMORY).
- **T6 đợt này chỉ ghi mốc, không kết luận:** T7-137 là
  chủ quản kiểm slot/started_at. Ghi nhận để T7/T10 đối
  chiếu: đợt 137 mở chỉ 1.669 s sau btime #93? — gần
  btime hơn hẳn đợt 136 (393 s sau btime); nếu dị thường
  tái diễn thì so với mẫu đợt 134/135 (started_at = btime
  + ~40 s) sẽ thấy started_at lượt này rơi vào khoảng
  08:07:51Z, tức TRƯỚC khi đợt mở 08:35Z; nguyên nhân
  vẫn thuộc T7.

## 10. Dọn Xvfb: 0 Xvfb chạy; 0 socket sót — reboot đã dọn /tmp

- **Lúc mở (08:40Z): `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb
  đang chạy (`pgrep -x Xvfb` rc=1; quét `/proc/*/cmdline`
  không có process nào tên Xvfb).
- **Lúc đóng (08:49Z): 0 Xvfb đang chạy** (pgrep rc=1),
  `/tmp/.X11-unix/` vẫn TRỐNG — **socket X193 sót từ
  đợt 136 (§10 T6-136) đã biến mất theo reboot**
  (reboot xóa /tmp), không cần T10 dọn tay lúc đóng đợt
  137 nữa nếu nó không xuất hiện lại.
- **Không kill process nào** trong phiên này (không có
  Xvfb sót để kill; T6 không đụng process luồng khác theo
  nhiệm vụ).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-137).

## 11. Tuân thủ lock của luồng đo đợt 136 ĐÃ kiểm được

- **T8-136 acquire + release sạch ×3** (05:59:39Z →
  06:00:57Z hold 78 s; 06:01:12Z → 06:03:28Z hold 136 s;
  06:03:43Z → 06:07:46Z hold 243 s; port 5390/5490/5490,
  ticket khớp log — §2/§4). T8 gọi thẳng script repo
  (`run-webkit-136t8.sh` dòng 16:
  `LOCK=.../vcut-vite-lock-v2.sh`, md5 `520b8baa`) — tức
  chạy trên **thứ tự ghi mới** (§3). Đây là 3 chu kỳ đầu
  tiên của T8 trên thứ tự mới.
- **T10-136 acquire + release sạch ×1** (07:16:34Z →
  07:18:31Z, hold 117 s, port 5554, ticket khớp log).
  T10 dùng bản frozen `round136-t10/vcut-vite-lock-v2.t10.sh`,
  md5 `520b8baa` (kiểm trực tiếp đợt này) — tức chạy trên
  **thứ tự ghi mới** (§3).
- **T4-136 đã kiểm ở đợt 136** (acquire + release sạch,
  hold 218 s, script repo `520b8baa` — T6-136 §11).
- **Tổng kết đợt 136: 5/5 chu kỳ sạch, tất cả trên thứ tự
  ghi mới** — 11 chu kỳ liên tiếp sạch kể từ lúc T6-135
  đóng (§3).
- **T4/T8-137 chưa acquire** tới lúc T6 đóng (§2) — chưa
  có gì để kiểm tuân thủ. Khi họ acquire, họ sẽ dùng bản
  script `520b8baa`; T6 đợt 138 kiểm tuân thủ + đếm chu
  kỳ mới.
- **Tuân thủ Xvfb luật đứng của đợt 136: CHƯA CÓ bằng chứng
  mới** (T8-136 chạy harness WebKit — socket X193 sót đã
  bị reboot xóa, §10; T10-136 chạy O8 — không để lại
  socket sót nào đo được).

## 12. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#93?) VẪN TẠM (xem §8.6):** chuỗi
  tương đối #57→#93? đã chốt (33 boot); số tuyệt đối giữ
  "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa
  6, mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới
  #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51
  đoạn B mở, tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng
  không làm neo được; (e) dị thường đồng hồ #84?→#85?
  (§8.4(b) đợt 134); **(f) MỚI: mù #56 đoạn A chưa đóng
  — số #93? chờ verdict T2-137**. Journal/wtmp chỉ giữ
  boot hiện tại (journal `--list-boots` chỉ 1 dòng
  2104246b; wtmp bắt đầu 08:07:xxZ) nên T6 suy ra số hiệu
  từ thứ tự thời gian + hồ sơ các đợt trước, không phải
  từ log hệ thống.
- **T6 đợt này ghi 0 sai số mới (không có F-137-T6-n).**
  Việc btime #93? nằm ngoài dải dự báo [05:56:47Z,
  07:55:21Z] đã được T2-137 ghi thành sai số dự báo của
  họ (F-137-T2-?, prereg §1) — T6 đối chiếu khớp (vượt
  cận trên đúng 710 s) và giải thích ở §8.4, không đánh
  số trùng. Không có sai số đo nào của T6 đợt này.
- **Đính chính số khung chết #91? (không đánh số F):**
  T6-136 ghi bản hẹp #91? là (04:42:10Z, 05:29:18Z]
  (2.828 s) theo session-jsonl; quyết parent đợt 136
  §12.3(e) chốt bản hẹp **(04:42:27Z, 05:29:18Z]
  (2.811 s)** — mốc 04:42:27Z là quan sát merged muộn hơn
  do T2 quét rộng hơn. Khác phạm vi quét, không phải sai
  số đo; T6 từ đây dùng số parent đã chốt.
- **F-136-T6-1 (cũ, nhắc lại):** T1-135 viết sai nhãn boot
  ("Boot hiện tại lúc kiểm: 8ae55060" cho phiên 02:40–
  02:54Z — boot sống lúc đó là 78b55838). Không lặp lại
  ở đợt này: T6-137 ghi đúng boot sống 2104246b (khớp
  T2-137 boot-verify).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn (`round134-t10.done` thay vì
  `round134-t6.done`); tổng 17 không đổi. T6-137 đã đếm
  lại đúng (§5: trích dẫn = 3, gồm `round135-t6.done`).
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; ngày
  đúng là **15/11** (F-131-T6-1, nhắc lại ở §8.1). Mù #49
  đoạn B mở + mù #51 đoạn B mở + mù #53 B recheck
  (T2-137) + mù #55 (T2-136: B mở tối đa 2 ẩn quy ước /
  3 cộng dồn) + mù #56 MỚI MỞ (T2-137); mù #52 đã đóng
  hoàn toàn (T2-133); mù #54 đã đóng hoàn toàn (T2-135).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  ba liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round135-t*/` (toàn đợt) +
  `round136-t*/` (toàn đợt) + `round137-t*/` tới 08:49Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T8/T10-137 chưa chạy xong tới thời điểm đếm; T6
  đợt 138 đếm tiếp.
- **Prune cooldown lần 12 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 84 ≤ trần 100 lúc chạy). File
  cũ nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z,
  theo `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 136 khép sạch trên lock (§4):** 5 chu kỳ (t4 ×1 +
  t8 ×3 + t10 ×1) đều sạch — T6 đợt này đếm bổ sung 4
  chu kỳ sau khi T6-136 đóng, khớp đúng recount T10-136;
  **đợt 137 tới 08:49Z có 0 chu kỳ**. Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 08:49Z (trống, 0 ticket + 84 cooldown); đợt
  còn chạy tới ~11:00Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–136 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 11 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Socket X193 sót đợt 136 đã biến mất theo reboot (§10):**
  T10 không cần dọn tay nữa nếu nó không xuất hiện lại.
- **Replay apt #93? chưa có verdict** (thuộc T5-137 — xem
  §8.5).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned"). Thư mục cut-sim /tmp của T6-135 đã biến mất
  theo reboot (§8.5).
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND137_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t8-round136`/`cooldown-t10-round136`
do release hợp lệ của t8/t10-136 — xem §3), Xvfb (0
process; 0 socket sót — X193 đã biến mất theo reboot).
Stage: `repo-1-push/paths-loop/phase9-round137-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round137-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, analyze-log-cleaned-open.txt,
vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-close.log, analyze-log.py,
cooldown-now.txt, prune-candidates.txt, prune-deleted.txt,
khong-nha-grep.txt, test-v2-t6-run1.log,
test-v2-t6-run2.log, repro-newmsg-fixed.sh,
repro-newmsg.log).
