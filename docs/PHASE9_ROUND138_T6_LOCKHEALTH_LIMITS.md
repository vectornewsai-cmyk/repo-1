# PHASE9 ROUND138 T6 — lock health + prune lần 13 + BOOT #94? INSIDE DẢI — LIMITS

- Đợt: 138, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 18:35 +07 18/11/2026 (= 11:35Z). Chạy 11:37:54Z →
  11:43:45Z 18/11/2026, toàn bộ trên một boot duy nhất #94?
  (17db9652) — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune, suite kiểm lock 9/9 ×2, chốt
  chuỗi boot với boot #94? 17db9652 (btime 09:36:01Z, đã xác
  nhận theo quyết parent đợt 137 §12.3(g)), tính dải dự báo
  cho boot #95? (đối chiếu độc lập với dải T2 — T2-138 chưa
  công bố lúc T6 đóng, xem §8.6), đối chiếu khung chết #93? /
  #92? với số parent đã chốt, ghi mọi sai số F-138-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round138-t6/` (status-open.txt,
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

## 0. Trạng thái lúc bắt đầu — BOOT #94? (số tạm theo quy ước, xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `17db9652-ad06-409f-989c-cdbdba15d0af`, btime 09:36:01Z**
  (`uptime -s` = 09:36:01Z, `who -b` = Nov 18 09:36,
  `/proc/1` 09:36:16Z — chênh +15 s, cùng mẫu các boot trước;
  `journal --list-boots` chỉ 1 dòng 17db9652, first entry
  09:36:17Z; `wtmp` bắt đầu 09:36:xxZ; btime epoch
  1794994561). Uptime ~2h01' lúc T6 bắt đầu (11:37:54Z),
  ~2h07' lúc đóng (11:43:45Z). Đây là **reboot #93?→#94? —
  sự kiện gộp #18** (GIỮA lượt 137, sau khi T6-137 đóng
  08:49Z, trước khi đợt 137 đóng sổ 10:41Z).
- **Btime 09:36:01Z NẰM TRONG dải dự báo đợt 137 cho #94?**
  [08:34:40Z, 10:33:14Z] (cả dải cơ học lẫn dải hiệu dụng sau
  probe #56 [08:45:46Z, 10:33:14Z]) — chuỗi INSIDE bắt đầu
  lại ở 1 lần liên tiếp sau 1 lần OUTSIDE (#93?, muộn hơn
  cận trên 710 s). Xem §8.5.
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 138 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round138-t1/t2/t3/t4/t5/t7/t8/t9; T1-138 đã có cờ
  `.done`; T2-138 đã viết prereg + chạy probe #57 11:39:07Z
  nhưng CHƯA viết LIMITS/.done lúc T6 đóng — T6 đối chiếu ở
  §8 với prereg-t2.md, không đọc nội dung cờ của luồng khác
  ngoài file T2 phục vụ đối chiếu).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật — 0 cổng lạ (lúc mở và lúc đóng)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 11:38Z
  (mở, `ps-full-open.txt`) và lúc 11:43Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: cả 2 lần **không có cổng TCP nào đang lắng
  nghe** (chỉ dòng header).
- **0 tiến trình vite/node/webkit/chromium thật** ở cả 2
  snapshot (3 dòng khớp "vite|node|webkit|chromium" trong mỗi
  file ps đều là chuỗi lệnh shell của chính lệnh đo / của
  T4-138 đang khởi động poller — `vcut-webkit-postboot-
  check.sh`, `node_modules` trong lệnh find của T9, và mẫu
  grep của chính lệnh đo của T6 — không phải process vite;
  đã đối chiếu trực tiếp từng dòng; lúc mở 0 process thật,
  lúc đóng 0 process thật).
- **0 tiến trình lock-script nào đang chạy** ở cả 2 snapshot
  (log không đổi giữa mở và đóng, §2/§4).

## 2. Lock lúc mở và lúc đóng: TRỐNG cả hai lần; không có event lock nào trong phiên T6

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 11:38Z (mở) và lúc 11:43Z (đóng) — không có file owner
  stale nào, không cần dọn lock stale.
- `status` lúc mở và lúc đóng: `TRỐNG (không có lock)`,
  `0 ticket + 86 cooldown`, rc=0 cả hai lần.
- **Log lock KHÔNG ĐỔI giữa mở và đóng:** diff bản đã lọc
  lúc mở vs lúc đóng rỗng — không có acquire/release nào
  của đợt 138 tới lúc T6 đóng (T4/T8-138 chưa acquire;
  T2-138 probe không dùng lock).
- Log thật lúc mở và lúc đóng: **958 dòng thô / 952 dòng
  chính thức** — dòng cuối `2026-11-18T10:32:58Z t10-round137
  RELEASED hold_s=110`.
- Khoảng yên trước đợt: không có event lock nào từ
  10:32:58Z (t10-round137 release, lúc đóng sổ đợt 137) tới
  lúc T6 đóng — yên lặng này là do đợt 137 đã đóng và đợt
  138 mới mở — không phải do lock kẹt (bằng chứng: 8 chu kỳ
  đợt 137 đều sạch, §4; suite độc lập 9/9 ×2, §6).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 19 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 8 chu kỳ mới kể từ
  lúc T6-137 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED, file
  cooldown được ghi — xem §4):
  - t4-round137 ×1 (09:44:27Z, hold 213 s),
  - t8-round137 ×6 (09:58:46Z–10:14:20Z, hold 71/134/238/
    65/124/227 s — 5 chu kỳ sau chờ cooldown 15 s, đúng
    cơ chế),
  - t10-round137 ×1 (10:31:07Z, hold 110 s).
  - Cộng với 11 chu kỳ T6-137 đã đếm (t4-135, t8-135 ×4,
    t10-135, t4-136, t8-136 ×3, t10-136) = **19 chu kỳ liên
    tiếp sạch trên thứ tự mới**.
  - Bằng chứng phiên bản: T8-137 gọi thẳng script repo
    (`run-webkit-137t8.sh` dòng 27:
    `LOCK=.../vcut-vite-lock-v2.sh`, md5 `520b8baa` lúc
    kiểm); T4-137 dùng script repo (`run-attempt-137.sh`
    dòng 13 / `t4-attempt-inner.sh` dòng 14:
    `LOCKV2=.../vcut-vite-lock-v2.sh`); T10-137 dùng bản
    frozen `round137-t10/vcut-vite-lock-v2.t10.sh`, md5
    `520b8baa` (kiểm trực tiếp đợt này).
- **File `cooldown-t4` mtime 09:48:00Z** (release hợp lệ của
  t4-137 — xem §4); 2 file cooldown mới so với lúc T6-137
  đóng: `cooldown-t8-round137` (10:14:20Z) và
  `cooldown-t10-round137` (10:32:58Z) — đúng 2 chu kỳ mới
  có tên riêng (t8 ghi đè cùng tên 5 lần, t4 ghi đè cùng
  tên nên tổng chỉ +2, không phải +8).

## 4. Nhất quán log lock: 923 dòng chính thức lúc T6-137 đóng → 952 lúc mở đợt 138, 275 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc mở
(11:38Z) và lúc đóng (11:43Z) — hai lần đếm giống hệt
nhau (log không đổi trong phiên, §2). Số chính thức đã
loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z, dòng
848–853 thô). 847 dòng đầu của bản đã lọc có md5
`9048174e…` — khớp đúng snapshot đã lọc của
T6-132/T6-133/T6-134/T6-135/T6-136/T6-137 (chuỗi không đứt).
Diff bản đã lọc lúc mở đợt này so với lúc T6-137 đóng:
**đúng +29 dòng append** (8 chu kỳ mới), không có dòng
nào khác thay đổi.

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-137 (923) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 290 | 282 | 199 | 193 |
| ACQUIRED | 281 | 273 | 199 | 193 |
| RELEASED | 275 | 267 | 197 | 191 |
| COOLDOWN | 91 | 86 | 83 | 78 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **952** | **923** | **679** | **656** |

- So với snapshot T6-137 đóng (923 dòng): **+29 dòng =
  TICKET +8 / ACQUIRED +8 / RELEASED +8 / COOLDOWN +5 /
  TIMEOUT +0 / STALE +0** — đúng bằng 8 chu kỳ mới:
  t4-round137 ×1 (hold 213 s) = 3 dòng + t8-round137 ×6
  (hold 71/134/238/65/124/227 s) = 23 dòng (6×3 + 5
  COOLDOWN — chu kỳ đầu không có COOLDOWN vì port 5390
  chưa từng giữ trước đó trong đợt; 5 chu kỳ sau chờ
  cooldown 15 s trên port 5490/5390) + t10-round137 ×1
  (hold 110 s) = 3 dòng. Mọi chu kỳ đều sạch, ghép cặp
  đủ — khớp từng con số, không có event nào mất dấu hay
  thêm lạ ngoài ca t4 cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134):
  **275 cặp ACQUIRED→RELEASED; 0 "đang giữ" theo cách
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
- Cửa sổ R120: **199 = 199 T/A, RELEASED 197** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  290+281+275+91+8+6+1 = 952 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 137 khép lại sạch trên lock (toàn đợt): 8 chu kỳ
  (t4 ×1 hold 213 s + t8 ×6 hold 71/134/238/65/124/227 s
  + t10 ×1 hold 110 s) đều sạch** — T6-137 lúc đóng mới
  thấy 0 chu kỳ; 8 chu kỳ còn lại T6 đợt này đếm bổ sung
  khớp đúng recount T10-137 (log 952 dòng lúc đóng sổ).
  **Đợt 138 tới lúc T6 đóng có 0 chu kỳ** (chưa luồng nào
  acquire).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 136 (toàn đợt), đợt 137 (toàn đợt) và đợt 138 (tới 11:43Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round136-t*/` + `round137-t*/` +
`round138-t*/` (tới 11:43Z) + các file `.done` tương ứng
— theo quy tắc lăn: bỏ round135, thêm round138. **Phương
pháp đếm đợt này đã sửa race của các đợt trước: grep ra
file /tmp trước, `--exclude='khong-nha-grep.txt'`, rồi mới
copy kết quả vào `round138-t6/khong-nha-grep.txt`** (xem ghi
nhận cuối §5). Tổng **15 dòng khớp chuẩn, phân loại đủ
15/15 — tất cả đều là bản sao script / log repro / trích
dẫn tài liệu, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round136-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round137-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 9 | `round136-t6/repro-newmsg.log` + `round137-t6/repro-newmsg.log` + `round138-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 2 | `round136-t10/PHASE9_ROUND136_LIMITS.closing-copy.md` (1) + `round137-t6.done` (1, dòng 2) — câu trích số liệu T6, không phải sự kiện |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 136 (toàn đợt) / 137 (toàn đợt) / 138 nào |
| Round138-t* (trừ repro /tmp của T6) | 0 dòng | T4/T8-138 chưa acquire; T1/T2/T3/T5/T7/T9-138 không dùng lock tới lúc đếm |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt
  122 = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125
  = 0 (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0
  (toàn đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn
  đợt), đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt),
  đợt 132 = 0 (toàn đợt), đợt 133 = 0 (toàn đợt), đợt
  134 = 0 (toàn đợt), đợt 135 = 0 (toàn đợt), đợt 136
  = 0 (toàn đợt), đợt 137 = 0 (toàn đợt — bổ sung 8 chu kỳ
  sau T6-137 đóng, §4), đợt 138 tới 11:43Z = 0.** Khớp với
  log pairing sạch ở §4 (275 cặp + 1 ca reboot-kill cũ đã
  giải thích — không liên quan nhánh release).
- Giới hạn phạm vi: T4/T8/T10-138 chưa chạy xong tới 11:43Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  138, T6 đợt 139 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-137 đếm 16 dòng (4 script + 9
  repro + 3 trích dẫn); đợt này bỏ round135 (−2 script
  −3 repro −2 trích dẫn [closing-copy + round135-t6.done]
  = −7) nhưng thêm round137-t10 script (2), round137-t6.done
  trích dẫn (1) và round138-t6 repro (3) = +6 → 16 − 7 + 6
  = **15 dòng** ✓. (round137-t10 KHÔNG có closing-copy —
  T10-137 viết LIMITS gộp trực tiếp; `round136-t6.done` có
  **0** dòng khớp mẫu, như T6-137 đã ghi.)
- **Ghi nhận phương pháp (không phải sai số lock):** file
  `round137-t6/khong-nha-grep.txt` có **15 dòng nhưng
  T6-137 báo 16** — file này chứa các dòng lồng nhau
  (bản sao của chính nội dung grep cũ) do đợt trước grep
  thẳng qua `tee` vào file đang nằm trong phạm vi quét
  (grep đọc lại file khi tee đang ghi — race). Số 16 của
  T6-137 là đúng theo phân loại 4+9+3 của họ; file 15
  dòng của họ thiếu 1 dòng do race đó. Đợt này T6 grep ra
  /tmp trước rồi mới copy — không còn lồng nhau, đếm
  15 tái hiện được. Ghi nhận để T6-139 khỏi đếm nhầm;
  không đánh số F (không phải lỗi của đợt này, không ảnh
  hưởng verdict lock).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
#94? (`17db9652…`).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round138-t6/test-v2-t6-run1.log` 11:42:35Z,
`test-v2-t6-run2.log` 11:43:02Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ mười bốn liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — mười bốn lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ hai mươi liên tiếp (T6 đợt
  120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 137 + T6 đợt
  138).

### 6.2 Repro message ĐÚNG (`round138-t6/repro-newmsg.log`, 11:43:07Z)

Copy verbatim script của T6-137, chỉ đổi tên TDIR
(`vcut-t6r137-repro` → `vcut-t6r138-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–137, kết quả giống hệt:
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
  lúc đó có 86 cooldown; log thật vẫn 958 dòng thô và
  queue vẫn 86 file sau khi repro xong; không có file
  `cooldown-tA/tH/tB` nào xuất hiện trong queue thật.
  **F-132-T6-1 KHÔNG lặp lại.**
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (275 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất
  dấu khác — số chính thức đã loại 6 dòng repro lỗi của
  T6-132), 0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy
  nhất do reboot giữa lượt (đợt 130), 0 sự kiện "KHÔNG
  NHẢ" trên lock thật đợt 120–137 (toàn đợt) và đợt 138
  (tới 11:43Z), suite 9/9 độc lập ×2 lần chạy (T7 xanh cả
  hai lần), và thứ tự ghi mới đã có **19 chu kỳ thật**
  chứng minh (§3). **Không còn caveat nào về mất dòng
  RELEASED cho các chu kỳ mới** — caveat cũ chỉ còn là 1
  dòng lịch sử (t4, §3–§4 T6-136).

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 13 liên tiếp)

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
  - 11:43Z: lock TRỐNG (status 0 ticket + 86 cooldown)
    — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng) — tổng 86 file ≤ trần
    mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 138: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 13 liên tiếp prune xóa 0 file
    (đợt 126–138: 0 mỗi đợt).
  - Lưu ý: file `cooldown-t4` mtime 09:48:00Z là **do
    release hợp lệ của t4-137 (§3), KHÔNG phải do
    prune** (prune không tạo/cập nhật file, chỉ xóa). Số
    file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (11:38Z) **86 file / 1204 byte**;
  lúc đóng (11:43Z) **86 file / 1204 byte** (86 × 14 =
  1204 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 86 + 0 = 86 ✓. Chỉ 2 file mới so với lúc
  T6-137 đóng: `cooldown-t8-round137` và
  `cooldown-t10-round137` (đúng 2 chu kỳ mới của đợt 137
  có tên riêng; `cooldown-t4` ghi đè cùng tên nên tổng
  chỉ +2, không phải +8). Không file nào bị xóa hay thêm
  giữa hai lần đếm của đợt này.
- Phân tầng tuổi lúc 11:43Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 23 file** (tăng từ 14 đợt 137 — 9 file
  mtime sáng 15/11 vừa vượt 72h giữa hai lần đếm, đúng
  quy luật tuổi, không phải thêm/xóa); **≥48h (`-mtime
  +1`): 39 file** (tăng từ 36 đợt 137 — 3 file vừa vượt
  48h, đúng quy luật tuổi). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 11:43Z mới **~89h05' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#94?; số tuyệt đối VẪN TẠM; khung chết #93? 14 s ĐÃ CHỐT ĐỨNG; #94? INSIDE DẢI

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1): khoảng **11:39:50Z →
  23:45:17Z ngày 15/11 (12h05'27")**, **A+D đóng, B+C mở**
  (2 cửa sổ mở, tổng ~9h48'14"), **tối đa 29 reboot ẩn**
  (21 đoạn B + 8 đoạn C). Parent đã **chấp nhận để mở**
  (QUYẾT PARENT 7 đợt 119) — T6 KHÔNG thử đóng lại lượt
  này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Khoảng mù #37 là 15/11 11:39:50Z → 23:45:17Z, KHÔNG phải
  16/11 — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #94?)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 (mỗi boot liệt kê
với boot_id + btime lấy từ ≥1 nguồn độc lập; btime→btime
danh nghĩa = khoảng cách giữa hai btime liên tiếp). Số thứ
tự là số tạm theo thứ tự thời gian (tất cả đều mang "?") —
xem verdict §8.7. **Định nghĩa đếm dùng: định nghĩa gộp của
T10 (LIMITS gộp đợt 133 §10.2) — mọi reboot quanh đợt, cả
giữa lượt lẫn ranh giới — theo quyết F-133-6.** Bảng dưới
chỉ ghi 5 boot cuối (chuỗi đầy đủ #57→#88 xem T6-131 §8.2
+ T6-132 §8.2 + T6-133 §8.2 + T6-134 §8.2 + T6-135 §8.2 +
T6-136 §8.2 + T6-137 §8.2 — không chép lại để khỏi drift;
T6 đợt này đã đối chiếu lại với LIMITS gộp đợt 137: các
boot #89?→#93? dưới đây khớp đúng btime/boot_id T10-137
đã chốt, không có boot_id lạ nào xuất hiện trong bất kỳ
bằng chứng 18/11 nào ngoài chuỗi này).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #89 | 8ae55060 | 01:31:18Z 18/11 | 1h13m42s (4.422 s, #88→#89 — SPAN); sống tới 02:27:27Z | T10-134 (boot lúc đóng đợt 134) |
| #90 | 78b55838 | 02:27:27Z 18/11 | 56m09s (3.369 s, #89→#90 — SPAN); sống tới 03:35:20Z | T6-135 (brief + uptime/journal//proc/1) |
| #91 | bcc71e61 | 03:35:20Z 18/11 | 1h53m58s (6.838 s, #90→#91 — SPAN, xem §8.3 T6-136); sống tới 05:29:18Z | T10-135 (t10-reboot1.md; LIMITS gộp §đầu) |
| #92 | 1ca1feaa | 05:29:18Z 18/11 | 2h37m53s (9.473 s, #91→#92 — xem §8.3–§8.4 T6-137); sống tới 08:07:11Z | T6-136 + T2-136 (prereg + probe #55) |
| #93 | 2104246b | 08:07:11Z 18/11 | 1h28m50s (5.330 s, #92→#93 — SPAN, xem §8.5); sống tới 09:36:01Z | T6-137 + T2-137 (prereg + probe #56) |
| #94 | 17db9652 | 09:36:01Z 18/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp) + T2-138 prereg + boot-verify + probe #57 |

- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #92?→#93? là sự kiện thứ 17** (ranh giới, sau khi
  đợt 136 đóng 07:26Z, trước khi đợt 137 mở 08:35Z);
  **#93?→#94? là sự kiện thứ 18** (GIỮA lượt 137, sau khi
  T6-137 đóng 08:49Z, trước khi đợt 137 đóng sổ 10:41Z).
  Không đợt nào từ 129 tới nay thiếu reboot.
- **T2-138 đối chiếu khớp (độc lập, trước khi T6 đo):**
  prereg-t2.md §0 ghi boot mới `17db9652…`, btime
  09:36:01Z (đọc trực tiếp 11:37:52Z), gọi là #94? theo
  quyết parent đợt 137 §12.3(g); `boot-verify.txt` khớp
  đúng boot_id + btime của T6 (uptime -s 09:36:01Z, btime
  epoch 1794994561, journal 1 boot first entry 09:36:17Z);
  probe #57 (11:39:07Z) boot 17db9652, ok=2 fail=0. Hai
  luồng khớp nhau hoàn toàn về boot_id, btime, epoch và
  số tạm. F94? ≈ −1 s (±~1 s, đo trực tiếp — T2 prereg §1,
  cùng F92?/F93?).
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#91: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3
    (không chép lại). Lưu ý theo quyết parent đợt 137
    §12.3(g): khung chết #90? bản hẹp **(03:34:51Z,
    03:35:20Z] (29 s)** làm chuẩn; khung chết #91? bản
    hẹp **(04:42:27Z, 05:29:18Z] (2.811 s)** làm chuẩn,
    bản ghi chính (04:19:07Z, 05:29:18Z] (4.211 s) đứng
    nguyên.
  - #92: MỘT khung + một bản hẹp (xem §8.4).
  - #93: khung chuẩn 14 s (xem §8.3).

### 8.3 Khung chết #93? — ĐÃ CHỐT 14 s, T6 đợt này quét lại KHÔNG TÌM MỐC MỚI (chỉ 1 file cùng sự kiện poll #69)

- **Khung chết #93?: (09:35:47Z, 09:36:01Z] (14 s) — CHUẨN
  THEO QUYẾT PARENT đợt 137 §12.3(g) (mốc phải = btime
  /proc/stat).** T6 đợt này quét lại toàn `hidden_files/` +
  `docs/` + `repo-1` (trừ node_modules) trong cửa sổ
  (08:49:23Z, 09:36:01Z]: quan sát cuối vẫn là poll #69
  của T4-137; **không có quan sát nào từ sự kiện khác
  sau 09:35:47Z**.
- **Ghi nhận chính xác 1 chi tiết mốc (không phải mâu
  thuẫn, không phải mốc mới):** trong cửa sổ (09:35:47Z,
  09:36:01Z] có đúng **1 file**: `round137-t4/postboot-
  t4-137-gate0wait-69.log`, **mtime 09:35:48.246Z** — nhưng
  đây là **cùng sự kiện poll #69**, không phải quan sát
  mới: `poll-t4.log` dòng 72 ghi `poll #69
  2026-11-18T09:35:47Z boot=2104246b ... RAMavail=492MB`
  (timestamp loop-start `NOW_ISO` lúc bắt đầu vòng poll),
  rồi script postboot chạy và ghi file log, hoàn tất lúc
  09:35:48.246Z. Chênh **1,246 s là thời gian chạy script
  postboot trong cùng một lần poll** (birth file
  09:35:48.004Z, modify 09:35:48.246Z). Mốc 09:35:47Z mà
  T5/T10 dùng là thời điểm poll BẮT ĐẦU (quan sát còn
  sống), mtime 09:35:48.246Z là thời điểm file ghi XONG —
  cùng một quan sát. **Khung 14 s đã chốt đứng nguyên;
  nếu lấy mtime thuần thì khung chỉ còn ~13 s (12,75 s)
  — đó là artifact phương pháp, không phải bằng chứng
  mới, và T6 KHÔNG đề xuất thu hẹp khung đã chốt.**
  T2-138 quét merged mù #57 có thể thấy mtime 09:35:48Z
  này — T6 ghi rõ ở đây để T2/T10 không đọc nhầm thành
  mốc mới.
- Caveat đồng hồ (nhắc lại từ T10-137 §10.1(a), parent đã
  biết khi chốt): đồng hồ boot cũ chạy nhanh ~15–30 s
  (T5 poll 51 ghi 09:36:02Z nhưng vẫn đọc dpkg.log cũ;
  T8 waiter poll 32 ghi 09:36:29Z — muộn hơn cả btime
  /proc/1 09:36:16Z). Khung 14 s đứng được vì mốc trái
  (poll #69 09:35:47Z, T4) và mốc phải (btime /proc/stat
  09:36:01Z, nguồn độc lập) đều không phụ thuộc đồng hồ
  cell cũ chạy nhanh theo cách làm vỡ khung; parent đã
  xác nhận khung này với đầy đủ caveat. T6 không mở lại
  quyết định đã chốt.
- Bản thay thế / biên ngoài (giữ nguyên theo quyết
  parent): bản (09:35:47Z, 09:36:16Z] (29 s, btime
  /proc/1-derived) làm phương án thay thế; bản first-seen
  của T4 (09:35:47Z, 09:37:05Z] (78 s) giữ làm biên ngoài.

### 8.4 Khung chết #92? — bản hẹp 126 s ĐÃ CHỐT ĐỨNG; quét lại không có file mới

- **Khung chết #92?: bản hẹp (08:05:05Z, 08:07:11Z]
  (126 s) làm chuẩn** (quyết parent đợt 137 §12.3(g));
  bản ghi chính (07:34:17Z, 08:07:11Z] (1.974 s) giữ làm
  biên ngoài (quy trách nhiệm được — quan sát cuối là
  mtime `docs/PHASE9_ROUND136_LIMITS.md` 07:34:17Z).
- T6 đợt này quét lại cửa sổ (08:05:05Z, 08:07:11Z] trên
  `hidden_files/` + `docs/`: **rỗng** — đúng như kỳ vọng,
  vì hai mốc 08:05:05Z (`memory/bank/world.md` +
  `memory/bank/reflections.md`) nằm ngoài cây quét; không
  có file nào mới xuất hiện trong cửa sổ (mtime chỉ được
  đặt lúc ghi — file ghi sau không thể mang mtime trong
  cửa sổ đã qua). Các file memory/bank hiện có mtime
  10:49Z — đó là ghi memory tiếp theo trên boot #94?,
  không phải bằng chứng mới trong cửa sổ #92?.
- **Gap #92?→#93? danh nghĩa (btime→btime) = 2h37'53"
  (9.473 s) — VẪN SPAN** (chưa chứng nhận; mù #56 đoạn A
  vẫn MỞ theo quyết parent đợt 137 §12.3(e): headline giữ
  1, ghi kèm 3 bảo thủ; CERT 54 / FULL 69 KHÔNG ĐỔI).

### 8.5 #94? INSIDE DẢI — chuỗi INSIDE bắt đầu lại ở 1; tốc độ reboot gần như KHÔNG ĐỔI

Dải cơ học cho #94? (p10–p90 FULL69, T2-137 §2.5):
**[08:34:40Z, 10:33:14Z]** (từ btime #93? 08:07:11Z);
dải hiệu dụng sau probe #56: [08:45:46Z, 10:33:14Z].
Thực tế **09:36:01Z — NẰM TRONG dải** (cả cơ học lẫn hiệu
dụng). Chuỗi INSIDE bắt đầu lại ở **1 lần liên tiếp**
(#94?) sau 1 lần OUTSIDE (#93?, muộn hơn cận trên 710 s).
T2-138 prereg §1 đi tới cùng kết luận độc lập trước khi
T6 đo (ghi "NẰM TRONG dải" — T6 đối chiếu khớp, không
đánh số trùng).

Gap danh nghĩa #93?→#94? = **5.330 s (1h28'50")** — nằm
trong dải chứng nhận đã có [0h00'55", 3h14'08"]. Khung
chết #93? chuẩn 14 s → khoảng chứng nhận **[5.316 s,
5.330 s] NẾU đoạn A mù #57 đóng** (T2-138 đang điều tra;
prereg §3: nếu cả A và B đóng thì CERT 54→55 / FULL
69→70; nếu A MỞ thì gap GIỮ SPAN — không ép chứng nhận).
Tới lúc T6 đóng, T2-138 chưa công bố verdict mù #57 nên
gap này **TẠM GIỮ SPAN**.

Tốc độ reboot tới #94?: 94 / 181,30 h = **1 mỗi 115,7
phút** (tới #93?: 93 / 179,82 h = 1 mỗi 116,0 phút —
T2-138 prereg §1 tính độc lập, khớp đúng). Chênh 0,3
phút/boot — trong nhiễu. Không có thay đổi chế độ.

### 8.6 Dải dự báo cho boot #95? (T6 tính độc lập — đối chiếu với T2 CHƯA XONG lúc T6 đóng)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 — p10–p90 của
phân phối FULL69 (p10 = 1.649 s, p90 = 8.763 s; hai số này
đã kiểm chéo từ hai dải độc lập: dải #93? [05:56:47Z,
07:55:21Z] từ btime 05:29:18Z và dải #94? [08:34:40Z,
10:33:14Z] từ btime 08:07:11Z — cùng cho p10 = 1.649 s,
p90 = 8.763 s), cộng vào btime #94? 09:36:01Z:

- **Dải dự báo cho #95?: [10:03:30Z, 12:02:04Z]**
  (09:36:01Z + 1.649 s = 10:03:30Z; 09:36:01Z + 8.763 s
  = 12:02:04Z). Tính bằng code (python3), không nhẩm.
- **Đối chiếu với T2: CHƯA XONG.** T2-138 lúc T6 đóng
  (11:43Z) chưa viết LIMITS/.done — prereg-t2.md không
  chứa dải #95?. T10-138 đối chiếu dải T2 khi có; nếu
  khác thì ghi rõ khác biệt (T2 là chủ quản dải).
- Lưu ý ổn định: nếu T2 chứng nhận gap #93?→#94?
  (5.330 s) thì FULL 69→70; p10/p90 là thống kê thứ tự —
  một gap 5.330 s (lớn hơn p10, nhỏ hơn p90) không làm
  dịch chuyển giá trị thứ 7 từ dưới lên (p10) hay giá trị
  thứ 7 từ trên xuống (p90) — dải trên dự kiến đứng nguyên
  cả khi FULL70. T6 không tự sửa dải giữa chừng.

### 8.7 VERDICT: chuỗi tương đối CHỐT #57→#94? — số tuyệt đối VẪN TẠM (giữ "?"); #94? còn chờ mù #57 A

- **CHỐT ĐƯỢC — chuỗi tương đối:** 34 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #94? (09:36:01Z 18/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→…→#92→#93
  →#94 đều có ≥2 nguồn độc lập xác nhận (T5 + T2 + T6 +
  T9 + T10 + file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-138 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #93?→#94? lần này KHÔNG
    có dị thường mới kiểu đó — §8.3 — nhưng một lần sạch
    không xóa tiền lệ.)
  - **MỚI — mù #57 đoạn A CHƯA ĐÓNG lúc T6 đóng:** số
    #94? là TẠM THỜI cho tới khi T2 đóng đoạn A (merged)
    — nếu A đóng (tối đa 0 ẩn) thì boot này CHÍNH LÀ
    #94?; nếu A MỞ thì số có thể cao hơn (#95?+). T6-138
    chốt chuỗi TƯƠNG ĐỐI (17db9652 là boot quan sát được
    tiếp theo sau 2104246b, không có boot quan sát được
    nào ở giữa) — số thứ tự tuyệt đối #94? chờ verdict
    của T2-138. (Mù #56 A vẫn MỞ theo quyết parent (e) —
    số #93? cũng vẫn mang tính quy ước headline.)
- **Kết luận cho parent:** T6-138 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 1 boot (#94?, giữa lượt 137); số thứ
  tự tuyệt đối **vẫn TẠM** và phải giữ "?" cho tới khi có
  bằng chứng ngoài VM (và, riêng #94?, tới khi mù #57 A
  đóng). Không bịa số, không bỏ "?" khi chưa đủ bằng
  chứng — đúng như brief giao.
- Hệ quả thực hành: T9-138 gọi boot lúc mở là "#94?"
  trong LIMITS của mình là đúng quy ước tạm; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #18 cho reboot này — là sự kiện GIỮA LƯỢT, đã
  xác nhận theo quyết parent đợt 137 §12.3(g)(iv)). Các
  quyết parent trước vẫn đứng: không quyết con số tuyệt
  đối nào ở đây.

### 8.8 Reboot #93?→#94? — không mất việc của luồng T6; T6 không bị cắt

- Reboot 2104246b → 17db9652 (btime 09:36:01Z) xảy ra giữa
  lượt 137 — **không giết attempt hay holder lock nào của
  đợt 138** (đợt 138 mở sau đó, 11:35Z, trên boot mới).
  T4-137 poller chết theo reboot và khởi động lại (đã ghi
  ở T10-137 / F-137-T8-7) — thuộc đợt 137, không phải việc
  của T6 đợt này.
- **Không luồng đợt 138 nào mất việc trong phiên T6:**
  T6 mở 11:37:54Z và đóng 11:43:45Z toàn bộ trên boot mới,
  không bị reboot cắt (uptime liền mạch 2h01' → 2h07');
  các cờ `.done` đợt 138 xuất hiện trên boot mới.
- **Replay apt sau boot #94?: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-138 là chủ
  quản verdict replay / cờ POSTBOOT_PASS boot mới. Lưu ý
  từ T2-137 prereg: `dpkg.log` của boot #93? (2104246b)
  đã MẤT theo reboot #94? (`/var/log` reset mỗi boot) —
  bracket #93? chỉ còn trong hồ sơ T10-137 nếu có.
- **/tmp đã bị reboot xóa sạch (từ đợt 137):** thư mục
  cut-sim của T6-135 đã biến mất theo reboot #94? (T6-137
  đã ghi); các TDIR suite `/tmp/vcut-lock-v2-test.*/` tự
  dọn bằng trap; TDIR repro của T6 đợt này đã dọn sạch
  sau khi xong (bản fixed in "TDIR cleaned").

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **11:37:54Z** (boot #94? đã 2h01'53"
  tuổi); đóng **11:43:45Z** (boot #94? đã ~2h07'44" tuổi).
  Đợt 138 mở **11:35:51Z** (round-in-progress.md) — tức
  **7.190 s sau btime boot #94? (09:36:01Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — giả thuyết
  "scheduler ghi lại started_at khi hồi phục sau reboot"
  ĐÃ ĐƯỢC XÁC NHẬN đợt 134 (lần thứ 5 liên tiếp, +6.967
  s, = btime + 40 s), tái diễn đợt 135 (lần thứ 6, +36 s),
  đợt 136 (lần thứ 7) và đợt 137 (lần thứ 8 — bằng chứng
  trực tiếp ĐẦU TIÊN, started_at = btime + 46 s).
- **T6 đợt này chỉ ghi mốc, không kết luận:** T7-138 là
  chủ quản kiểm slot/started_at. Ghi nhận để T7/T10 đối
  chiếu: đợt 138 mở 7.190 s sau btime #94? — xa btime hơn
  hẳn đợt 137 (1.669 s sau btime); nếu dị thường tái diễn
  thì started_at lượt này rơi vào khoảng 09:36:4xZ, tức
  TRƯỚC khi đợt mở 11:35Z; nguyên nhân vẫn thuộc T7.

## 10. Dọn Xvfb: 0 Xvfb chạy; 0 socket sót — /tmp/.X11-unix/ trống

- **Lúc mở (11:38Z): `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb
  đang chạy (`pgrep -x Xvfb` rc=1; quét `/proc/*/cmdline`
  không có process nào tên Xvfb).
- **Lúc đóng (11:43Z): 0 Xvfb đang chạy** (pgrep rc=1),
  `/tmp/.X11-unix/` vẫn TRỐNG.
- **Không kill process nào** trong phiên này (không có
  Xvfb sót để kill; T6 không đụng process luồng khác theo
  nhiệm vụ).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-138; T2-138
  ghi MemAvailable 627.184 kB lúc 11:38:23Z — THẤP, mẫu
  nằm trong đoạn B mù #57).

## 11. Tuân thủ lock của luồng đo đợt 137 ĐÃ kiểm được

- **T4-137 acquire + release sạch ×1** (09:44:27Z →
  09:48:00Z hold 213 s, port 5187, ticket khớp log).
  T4 dùng script repo (`run-attempt-137.sh` dòng 13 /
  `t4-attempt-inner.sh` dòng 14:
  `LOCKV2=.../vcut-vite-lock-v2.sh`, md5 `520b8baa`) —
  tức chạy trên **thứ tự ghi mới** (§3).
- **T8-137 acquire + release sạch ×6** (09:58:46Z →
  09:59:57Z hold 71 s; 10:00:12Z → 10:02:26Z hold 134 s;
  10:02:41Z → 10:06:39Z hold 238 s; 10:06:54Z → 10:07:59Z
  hold 65 s; 10:08:14Z → 10:10:18Z hold 124 s; 10:10:33Z
  → 10:14:20Z hold 227 s; port 5390/5490, ticket khớp
  log — §2/§4). T8 gọi thẳng script repo
  (`run-webkit-137t8.sh` dòng 27:
  `LOCK=.../vcut-vite-lock-v2.sh`, md5 `520b8baa`) — tức
  chạy trên **thứ tự ghi mới** (§3).
- **T10-137 acquire + release sạch ×1** (10:31:07Z →
  10:32:58Z, hold 110 s, port 5554, ticket khớp log).
  T10 dùng bản frozen `round137-t10/vcut-vite-lock-v2.t10.sh`,
  md5 `520b8baa` (kiểm trực tiếp đợt này) — tức chạy trên
  **thứ tự ghi mới** (§3).
- **Tổng kết đợt 137: 8/8 chu kỳ sạch, tất cả trên thứ tự
  ghi mới** — 19 chu kỳ liên tiếp sạch kể từ lúc T6-135
  đóng (§3).
- **T4/T8-138 chưa acquire** tới lúc T6 đóng (§2) — chưa
  có gì để kiểm tuân thủ. Khi họ acquire, họ sẽ dùng bản
  script `520b8baa`; T6 đợt 139 kiểm tuân thủ + đếm chu
  kỳ mới.
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)).
- **Tuân thủ Xvfb luật đứng của đợt 137: CHƯA CÓ bằng chứng
  mới** (T8-137 chạy harness WebKit — không để lại socket
  sót nào đo được lúc T6 mở/đóng đợt 138; /tmp đã bị
  reboot xóa).

## 12. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#94?) VẪN TẠM (xem §8.7):** chuỗi
  tương đối #57→#94? đã chốt (34 boot); số tuyệt đối giữ
  "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa
  6, mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới
  #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51
  đoạn B mở, tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng
  không làm neo được; (e) dị thường đồng hồ #84?→#85?
  (§8.4(b) đợt 134); **(f) MỚI: mù #57 đoạn A chưa đóng
  — số #94? chờ verdict T2-138; mù #56 A vẫn MỞ (quyết
  parent (e)) — số #93? cũng vẫn quy ước headline**.
  Journal/wtmp chỉ giữ boot hiện tại (journal `--list-boots`
  chỉ 1 dòng 17db9652; wtmp bắt đầu 09:36:xxZ) nên T6 suy
  ra số hiệu từ thứ tự thời gian + hồ sơ các đợt trước,
  không phải từ log hệ thống.
- **T6 đợt này ghi 0 sai số mới (không có F-138-T6-n).**
  Việc đối chiếu dải #95? với T2 CHƯA XONG (T2-138 chưa
  công bố lúc T6 đóng) không phải sai số — là công việc
  chờ T10 đối chiếu khi dải T2 có. Không có sai số đo nào
  của T6 đợt này. Mốc mtime 09:35:48.246Z trong cửa sổ
  khung chết #93? đã giải thích ở §8.3 (cùng sự kiện poll
  #69, không phải mốc mới) — không đánh số F.
- **Đính chính mốc khung chết #93? (không đánh số F):**
  T5/T10-137 ghi mốc cuối 09:35:47Z là timestamp loop-start
  của poll #69 (`poll-t4.log` dòng 72); file log của chính
  poll đó có mtime 09:35:48.246Z (script postboot chạy
  1,246 s). Khung 14 s đã chốt dùng mốc loop-start — đứng
  nguyên; T6 không đề xuất thu hẹp theo mtime.
- **T6-137 ghi 0 sai số mới** — T6 đợt này giữ chuẩn đó
  (0 sai số mới, xem trên).
- **F-136-T6-1 (cũ, nhắc lại):** T1-135 viết sai nhãn boot
  ("Boot hiện tại lúc kiểm: 8ae55060" cho phiên 02:40–
  02:54Z — boot sống lúc đó là 78b55838). Không lặp lại
  ở đợt này: T6-138 ghi đúng boot sống 17db9652 (khớp
  T2-138 boot-verify + probe #57).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn (`round134-t10.done` thay vì
  `round134-t6.done`); tổng 17 không đổi. T6-138 đã đếm
  lại đúng (§5: trích dẫn = 2, gồm `round136-t10/...
  closing-copy.md` + `round137-t6.done`).
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; ngày
  đúng là **15/11** (F-131-T6-1, nhắc lại ở §8.1). Mù #49
  đoạn B mở + mù #51 đoạn B mở + mù #53 B recheck
  (T2-137) + mù #55 (T2-136: B mở tối đa 2 ẩn quy ước /
  3 cộng dồn) + mù #56 A MỞ (quyết parent (e)) + mù #57
  MỚI MỞ (T2-138 đang điều tra); mù #52 đã đóng hoàn
  toàn (T2-133); mù #54 đã đóng hoàn toàn (T2-135).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  bốn liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round136-t*/` (toàn đợt) +
  `round137-t*/` (toàn đợt) + `round138-t*/` tới 11:43Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T8/T10-138 chưa chạy xong tới thời điểm đếm; T6
  đợt 139 đếm tiếp.
- **Prune cooldown lần 13 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 86 ≤ trần 100 lúc chạy). File
  cũ nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z,
  theo `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 137 khép sạch trên lock (§4):** 8 chu kỳ (t4 ×1 +
  t8 ×6 + t10 ×1) đều sạch — T6 đợt này đếm bổ sung 8 chu
  kỳ sau khi T6-137 đóng, khớp đúng recount T10-137;
  **đợt 138 tới 11:43Z có 0 chu kỳ**. Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 11:43Z (trống, 0 ticket + 86 cooldown); đợt
  còn chạy tới ~14:00Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–137 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 19 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt #94? chưa có verdict** (thuộc T5-138 — xem
  §8.8).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND138_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t8-round137`/`cooldown-t10-round137`
do release hợp lệ của t8/t10-137 — xem §3), Xvfb (0
process; 0 socket sót).
Stage: `repo-1-push/paths-loop/phase9-round138-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round138-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, analyze-log-cleaned-open.txt,
vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-close.log, analyze-log.py,
cooldown-now.txt, prune-candidates.txt, prune-deleted.txt,
khong-nha-grep.txt, test-v2-t6-run1.log,
test-v2-t6-run2.log, repro-newmsg-fixed.sh,
repro-newmsg.log).
