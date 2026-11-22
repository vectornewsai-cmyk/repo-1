# PHASE9 ROUND142 T6 — lock health + prune lần 17 + BOOT #102? ỨNG VIÊN NGOÀI dải tạm (gap ngắn 902 s) + reboot #26 trong khoảng giữa hai đợt — LIMITS

- Đợt: 142, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 06:35 +07 19/11/2026 (= 23:35:51Z 18/11). Chạy
  23:42:10Z → 23:49:37Z 18/11/2026, toàn bộ trên một boot duy
  nhất bde599df (ứng viên #102?) — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune lần 17, suite kiểm lock 9/9
  ×2, chốt chuỗi boot với boot bde599df (btime 22:48:05Z),
  đối chiếu khung chết #99?/#100?/#101? với T2-142 khi có dữ
  kiện (T2-142 mới có prereg + probe #61, CHƯA có LIMITS/
  .done lúc T6 đóng — ghi rõ chưa đủ dữ kiện để chốt),
  kiểm Xvfb sót, ghi mọi sai số F-142-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round142-t6/` (status-open.txt,
  status-close.txt, ps-full-open.txt, ps-full-close.txt,
  ss-open.txt, ss-close.txt, x11-open.txt, x11-close.txt,
  boot-verify-open.txt, analyze-log-cleaned-open.txt,
  vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-close.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, analyze-log.py,
  cooldown-now-open.txt, cooldown-now.txt,
  prune-candidates.txt, prune-deleted.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg-fixed.sh,
  repro-newmsg-fixed142.sh, repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT bde599df (ứng viên #102?; xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `bde599df-eb81-4205-86a0-b71a0ab9790c`, btime 22:48:05Z**
  (`/proc/stat` btime epoch 1795042085; `uptime -s` =
  22:48:05Z; `who -b` = Nov 18 22:48; `/proc/1` 22:48:16Z —
  chênh +11 s, cùng mẫu các boot trước; `journal --list-boots`
  chỉ 1 dòng bde599df, first entry 22:48:17Z (boot +12 s —
  đúng mẫu +11–16 s); `wtmp` bắt đầu 22:48:16Z). Uptime
  ~54'05" lúc T6 bắt đầu (23:42:10Z), ~60'20" lúc đóng
  (23:48:25Z). Đây là **reboot #26** (theo đánh số của
  aggregate đợt 141 §12.2(a) — xem F-142-T6-1 về mâu thuẫn
  nhãn #25/#26 giữa các file đợt 142).
- **KHÔNG có mâu thuẫn btime lần này:** brief,
  `round-in-progress.md` và T2-142 prereg đều ghi btime
  22:48:05Z. T2-142 `boot-verify.txt` (23:44:12Z) khớp đúng
  boot_id + btime + epoch + journal first entry của T6;
  T2-142 probe #61 (`once.txt`: `probe#61 boot=bde599df
  ok=2 fail=0`) xác nhận boot đang sống. F102 do T2 đo:
  HTTP `Date` 3 server hơn local +1/+2/+3 s (xem
  `round142-t2/f102.txt`) — T6 không đo F, chỉ ghi bối cảnh.
- **Đợt 142 mở 23:35:51Z** (round-in-progress.md; sched
  23:35:51Z) — tức **2.866 s sau btime boot bde599df
  (22:48:05Z)**. T6 mở 23:42:10Z (3.245 s sau btime).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline. preview.tsx md5 `530e10a7`.
- Các luồng đợt 142 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round142-t2/t4/t5/t9; T2-142 đã viết prereg +
  chạy probe #61 (ok=2 fail=0, boot bde599df) nhưng CHƯA
  viết LIMITS/.done lúc T6 đóng — T6 đối chiếu ở §8 với
  prereg-t2.md + boot-verify.txt + f102.txt + once.txt,
  không đọc nội dung cờ của luồng khác ngoài file T2 phục
  vụ đối chiếu; **T4-142 CHƯA GIỮ LOCK lúc T6 mở lẫn lúc
  đóng** — poll-wait đang chạy từ 23:42:38Z, gate A CHƯA
  ĐẠT (RAM 1.009 MB lúc poll #2 rồi rơi dần 947 → 713 →
  665 → 580 → 563 MB lúc poll #10 23:49:24Z — xem §11);
  T5-142 postboot PASS 23:48:25Z (repair-1-phần, dpkg
  795/113 — thuộc T5).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật lúc mở và lúc đóng — 0 cổng lạ

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 23:42Z
  (mở, `ps-full-open.txt`) và lúc 23:48Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (23:42Z) và lúc đóng (23:48Z): 0 tiến trình
  vite/node/webkit thật, 0 tiến trình lock-script, 0 Xvfb**
  (xem §10). `ss -tlnp` lúc mở và lúc đóng đều chỉ còn dòng
  header (không cổng nào lắng nghe).
- T4-142 poll-wait đang chạy (bash, không phải vite) — hợp
  lệ, chưa acquire (lock trống, §2).

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; 0 chu kỳ mới trong phiên T6

- **Lúc mở (23:42:10Z): thư mục lock thật
  `hidden_files/vite.lock` KHÔNG TỒN TẠI** — status
  `TRỐNG (không có lock)`, `0 ticket + 92 cooldown`, rc=0.
- **Lúc đóng (23:48:25Z): lock TRỐNG** — status `TRỐNG`,
  `0 ticket + 92 cooldown`, rc=0.
- **Log lock +0 dòng trong phiên T6: 1037 dòng thô lúc mở →
  1037 dòng thô lúc đóng** — không có event lock nào trong
  phiên T6. Bản đã lọc lúc đóng md5 `8d475b38…` KHỚP ĐÚNG
  bản đã lọc lúc mở (chuỗi không đứt).
- Khoảng yên trước đó: không có event lock nào từ 22:45:49Z
  (T10-141 release) tới lúc T6 mở — yên lặng này là do đợt
  141 đã đóng và đợt 142 mới mở, T4-142 chưa acquire được
  (gate A chưa đạt, §11) — không phải do lock kẹt (bằng
  chứng: suite độc lập 9/9 ×2, §6; 8 chu kỳ mới sau T6-141
  đóng đều sạch, §4).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 42 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 8 chu kỳ mới kể từ
  lúc T6-141 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4):
  - t8-round141 ×7 (20:53:03Z → 21:23:21Z; holds 11 / 128 /
    900 / 61 / 119 / 222 / 68 s),
  - t10-round141 ×1 (22:44:03Z hold 106 s).
  - Cộng với 34 chu kỳ T6-141 đã đếm = **42 chu kỳ liên
    tiếp sạch trên thứ tự mới**.
  - Bằng chứng phiên bản: T8-141 dùng script repo
    (`run-webkit-141t8.sh` dòng 27 + `run-webkit-141t8-
    retry84l10.sh` dòng 13: `LOCK=.../vcut-vite-lock-v2.sh`,
    md5 `520b8baa` lúc kiểm); T10-141 dùng bản frozen
    `round141-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
    (kiểm trực tiếp đợt này).
- **File `cooldown-t10-round141` mtime 22:45:49Z** (release
  hợp lệ của t10-141 — xem §4); file `cooldown-t4` mtime
  20:46:14Z (release hợp lệ của t4-141, §3 T6-141);
  `cooldown-t8-round141` mtime 21:23:21Z (release cuối của
  t8-141). Không file cooldown nào mới trong phiên T6.

## 4. Nhất quán log lock: 1002 dòng chính thức lúc T6-141 đóng → 1031 lúc T6-142 đóng, 298 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z,
dòng 848–853 thô). Bản đã lọc lúc đóng có md5 `8d475b38…`
— KHỚP ĐÚNG bản đã lọc lúc mở (0 dòng mới trong phiên T6);
lúc mở (23:42Z): **1037 dòng thô / 1031 chính thức**; lúc
đóng (23:48Z): **1037 dòng thô / 1031 chính thức** — diff so
với snapshot T6-141 đóng: **đúng +29 dòng append** (8 chu kỳ
mới), không có dòng nào khác thay đổi.

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-141 (1002) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 313 | 305 | 222 | 216 |
| ACQUIRED | 304 | 296 | 222 | 216 |
| RELEASED | 298 | 290 | 220 | 214 |
| COOLDOWN | 101 | 96 | 93 | 88 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **1031** | **1002** | **758** | **735** |

- So với snapshot T6-141 đóng (1002 dòng): **+29 dòng =
  TICKET +8 / ACQUIRED +8 / RELEASED +8 / COOLDOWN +5 /
  TIMEOUT +0 / STALE +0** — đúng bằng 8 chu kỳ mới:
  t8-round141 ×7 = 26 dòng (7×3 T/A/R + 5 COOLDOWN — 5
  chu kỳ có wait_s=15, 2 chu kỳ wait_s=0) + t10-round141
  ×1 = 3 dòng (wait_s=0). Mọi chu kỳ đều sạch, ghép cặp đủ
  — khớp từng con số, không có event nào mất dấu hay thêm
  lạ ngoài ca t4 cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 1031 dòng): **298 cặp ACQUIRED→RELEASED;
  0 "đang giữ"** — nhưng đọc kỹ: chênh ACQUIRED − RELEASED
  = 6 = **5 ca double-acquire đã biết + 1 ca t4 mồ côi
  (dòng 869, ACQUIRED 23:50:17Z)**. Dòng 869 **vẫn là
  ACQUIRED duy nhất không có RELEASED thật của chính nó**
  (F-134-T6-2); KHÔNG phải lock kẹt. 0 lần RELEASED không
  có ACQUIRED trước đó.
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
- Cửa sổ R120: **222 = 222 T/A, RELEASED 220** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  313+304+298+101+8+6+1 = 1031 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 141 khép lại trên lock (toàn đợt): 9 chu kỳ sạch**
  — t4-141 ×1 (hold 206 s, attempt1 20/20, lượt yên #17)
  + t8-141 ×7 (holds 11/128/900/61/119/222/68 s — chu kỳ
  hold 900 s là lần chạy 86n2 bị kẹt thật thứ 4, TIMEOUT
  124 giết sau 900 s; release vẫn được ghi sạch qua trap/
  timeout — xem §11) + t10-141 ×1 (hold 106 s, O8).
  T6-141 lúc đóng mới thấy 1 chu kỳ; 8 chu kỳ này T6 đợt
  này đếm bổ sung, khớp đúng recount của T10-141 (log
  1037 dòng thô lúc T10-141 đóng sổ 22:45:49Z).
  **Đợt 142 tới 23:48Z có 0 chu kỳ** (T4-142 chưa acquire
  — gate A chưa đạt). Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 140 (toàn đợt), đợt 141 (toàn đợt) và đợt 142 (tới 23:48Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round140-t*/` + `round141-t*/` +
`round142-t*/` (tới 23:48Z) — theo quy tắc lăn: bỏ round139,
thêm round141 (phần còn lại sau T6-141) + round142. **Phương pháp đếm đợt này:
grep ra file /tmp trước, `--exclude` file grep-output
(`khong-nha-grep.txt` — bản sao kết quả đếm các đợt trước,
KHÔNG được đếm lại), rồi mới copy kết quả vào
`round142-t6/khong-nha-grep.txt`** (theo bài học race của
T6-138 §5 + bài học đếm lồng của đợt này, xem F-142-T6-2).
**Lưu ý phương pháp:** pattern grep có dấu (`KHÔNG NHẢ` /
`BỎ QUA release thừa`) — các file `.done` của T6 viết bằng
ASCII không dấu (`"KHONG NHA"`) nên KHÔNG khớp pattern này.
**Lưu ý 2:** grep thô đợt này trả **33 dòng** vì chạy TRƯỚC
khi loại file `khong-nha-grep.txt` (23 dòng là bản sao trong
2 file grep-output cũ round140-t6/round141-t6); **tổng đếm
chuẩn = 10 dòng** sau khi loại; 3 dòng repro đợt này ghi
riêng dưới đây, đếm ở đợt 143.
Tổng **10 dòng khớp chuẩn, phân loại đủ 10/10 — tất cả
đều là bản sao script / log repro / trích dẫn tài liệu, 0
sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round140-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round141-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 6 | `round140-t6/repro-newmsg.log` + `round141-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 0 | Không file `.done` nào trong phạm vi khớp pattern có dấu (các file `.done` của T6 viết không dấu) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 140 (toàn đợt) / 141 (toàn đợt) / 142 nào |
| Round142-t* (trừ repro /tmp của T6) | 0 dòng | Chỉ có 0 chu kỳ T4-142 tới lúc đếm (§4); T8-142 chưa chạy harness |

- **Repro đợt này (chưa đếm, đếm ở đợt 143):**
  `round142-t6/repro-newmsg.log` 3 dòng (2 `BỎ QUA` +
  1 `KHÔNG NHẢ`) trên /tmp — xem §6.2.
- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt
  122 = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125
  = 0 (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0
  (toàn đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn
  đợt), đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt),
  đợt 132 = 0 (toàn đợt), đợt 133 = 0 (toàn đợt), đợt
  134 = 0 (toàn đợt), đợt 135 = 0 (toàn đợt), đợt 136
  = 0 (toàn đợt), đợt 137 = 0 (toàn đợt), đợt 138 = 0
  (toàn đợt), đợt 139 = 0 (toàn đợt), đợt 140 = 0 (toàn
  đợt), đợt 141 = 0 (toàn đợt — bổ sung 8 chu kỳ sau
  T6-141 đóng, §4), đợt 142 tới 23:48Z = 0.** Khớp với log
  pairing sạch ở §4 (298 cặp + 1 ca reboot-kill cũ đã giải
  thích — không liên quan nhánh release).
- Giới hạn phạm vi: T8/T10-142 chưa chạy xong tới 23:48Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  142, T6 đợt 143 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-141 đếm 10 dòng (4 script + 6
  repro); đợt này bỏ round139 (−2 script −3 repro = −5)
  nhưng thêm round141-t10 script (2) + round141-t6 repro
  (3) = +5 → 10 − 5 + 5 = **10 dòng** ✓.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
bde599df (`#102?` ứng viên).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round142-t6/test-v2-t6-run1.log` 23:46:14Z,
`test-v2-t6-run2.log` 23:46:36Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ mười tám liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — mười tám lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ hai mươi bốn liên tiếp (T6
  đợt 120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 141 + T6
  đợt 142).

### 6.2 Repro message ĐÚNG (`round142-t6/repro-newmsg.log`, 23:46:44Z)

Copy verbatim script của T6-141, chỉ đổi tên TDIR
(`vcut-t6r141-repro` → `vcut-t6r142-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–141, kết quả giống hệt:
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
  lúc đó có 92 cooldown; log thật vẫn 1037 dòng thô lúc
  repro chạy và queue vẫn 92 file sau khi repro xong;
  không có file `cooldown-tA/tH/tB` nào xuất hiện trong
  queue thật. **F-132-T6-1 KHÔNG lặp lại.**
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (298 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy nhất do reboot
  giữa lượt (đợt 130), 0 sự kiện "KHÔNG NHẢ" trên lock thật
  đợt 120–141 (toàn đợt) và đợt 142 (tới 23:48Z), suite 9/9
  độc lập ×2 lần chạy (T7 xanh cả hai lần), và thứ tự ghi
  mới đã có **42 chu kỳ thật** chứng minh (§3). **Không còn
  caveat nào về mất dòng RELEASED cho các chu kỳ mới** —
  caveat cũ chỉ còn là 1 dòng lịch sử (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **đợt 142 tới lúc đóng có 0
  chu kỳ lock** — vì T4-142 chưa acquire được (gate A
  chưa đạt, RAM rơi — §11), không phải vì lock kẹt.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 17 liên tiếp)

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
  - 23:48Z: lock TRỐNG (status 0 ticket + 92 cooldown)
    — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng) — tổng 92 file ≤ trần mềm 100 nên điều (b) cũng
    không kích hoạt.
  - **Kết quả prune đợt 142: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 17 liên tiếp prune xóa 0 file
    (đợt 126–142: 0 mỗi đợt).
  - Lưu ý: không có file cooldown mới nào trong phiên T6
    (0 chu kỳ đợt 142, §4). Số file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (23:42Z) **92 file / 1288 byte**;
  lúc đóng (23:48Z) **92 file / 1288 byte** (92 × 14 =
  1288 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 90 + 2 = 92 ✓ (2 file cooldown mới kể từ
  T6-141 đóng: `cooldown-t8-round141` + `cooldown-t10-
  round141`; `cooldown-t4` ghi đè cùng tên nên không tăng
  tổng). Không file nào bị xóa hay thêm giữa hai lần đếm
  của đợt này.
- Phân tầng tuổi lúc 23:48Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 27 file** (không đổi so với đợt 141 —
  không có file nào có mtime trong cửa sổ 15/11 14:49–
  17:40Z để vượt 72h giữa hai lần đếm; đúng quy luật tuổi,
  không phải thêm/xóa); **≥48h (`-mtime +1`): 55 file**
  (tăng từ 49 đợt 141 — 6 file mtime 16/11 14:49–17:40Z
  vừa vượt 48h, đúng quy luật tuổi). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 23:48Z mới **~101h10' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#101? + bde599df (ứng viên #102?); số tuyệt đối VẪN TẠM; bde599df NGOÀI dải tạm (dưới p10); khung chết #99?/#100?/#101? CHƯA CHỐT (chờ T2-142)

### 8.0 Reboot #26 — ed5323a4 → bde599df (btime 22:48:05Z), trong khoảng GIỮA hai đợt (sau kiểm đóng đợt 141, trước khi đợt 142 mở)

- Reboot ed5323a4 → bde599df (btime 22:48:05Z) xảy ra sau
  kiểm boot cuối của T10-141 (22:48:05Z boot vẫn ed5323a4 —
  cùng giây với btime boot mới, xem §8.5) và trước khi đợt
  142 mở (23:35:51Z) — **sự kiện #26** theo đánh số của
  aggregate đợt 141 §12.2(a) (sự kiện #24 = 2c0efe57 →
  57a0dd12 giữa lượt 141; #25 = 57a0dd12 → ed5323a4 trong
  lúc T10-141 đóng sổ). Aggregate đợt 141 đếm "2 reboot
  trong lượt" — reboot #26 này là reboot THỨ BA gắn với
  cửa sổ đóng đợt 141, nhưng xảy ra SAU các kiểm đóng của
  T10 (22:47:15Z/22:48:05Z) nên không nằm trong số "2
  reboot trong lượt" của aggregate; cờ `round141-t10.done`
  mtime 22:55:20Z — tức được ghi SAU btime boot mới, trên
  boot bde599df (file trên đĩa sống qua reboot; T6 không
  suy đoán ai ghi — chỉ ghi mốc).
- **Mâu thuẫn nhãn (F-142-T6-1, xem §12):**
  `round-in-progress.md` đợt 142 ghi boot lúc mở bde599df
  "sau reboot #25 trong lúc đóng sổ đợt 141"; cờ
  `round142-t5/POSTBOOT_PASS` cũng ghi "(reboot #25…)" và
  gọi boot đã chết là 2c0efe57 (sai tên — boot chết trước
  khi T5-142 mở là ed5323a4, không phải 2c0efe57);
  ngược lại T2-142 prereg ghi "Reboot #26 CHƯA đặt số".
  Aggregate đợt 141 §12.2(a) đã dùng #25 cho 57a0dd12 →
  ed5323a4 — nên theo hồ sơ đã chốt của parent, reboot
  ed5323a4 → bde599df là **#26**. T6 dùng #26 và giao T10/
  parent thống nhất lại nhãn (round-in-progress.md +
  POSTBOOT_PASS cần sửa #25 → #26; T5 sửa tên boot chết
  2c0efe57 → ed5323a4).
- **Không luồng nào mất việc do reboot này trong phiên
  T6:** T6 mở 23:42:10Z và đóng 23:48:25Z toàn bộ trên boot
  mới, không bị reboot cắt (uptime liền mạch 54'05" →
  60'20'). Reboot xảy ra trước khi đợt 142 mở (23:35:51Z).
- **Replay apt #102?: THUỘC T5** — T6 không kiểm
  `dpkg.log`. Chỉ ghi bối cảnh từ file của T5-142
  (POSTBOOT_PASS, pass_at 23:48:25Z): replay CHẾT DẠNG (B)
  — dpkg chỉ 2 dòng configure 22:48:39Z (boot +34 s) rồi
  im; T5 đã `--repair` 1 lần 23:44:06Z, re-check toàn PASS,
  dpkg 795/113 (repair-1-phần, KHÔNG phải replay đầy đủ).
  T4-142 poll #7/#8 cũng ghi dpkg_lines=795. Bracket chính
  thức thuộc về T5-142.
- **/tmp đã bị reboot xóa sạch:** socket Xvfb X193 sót từ
  đợt 141 (§10 T6-141) đã biến mất theo reboot #26; các
  TDIR suite `/tmp/vcut-lock-v2-test.*/` tự dọn bằng trap;
  TDIR repro của T6 đợt này đã dọn sạch sau khi xong (bản
  fixed in "TDIR cleaned").

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1 / T6-138 §8.1 / T6-139 §8.1 /
  T6-140 §8.1 / T6-141 §8.1): khoảng **11:39:50Z → 23:45:17Z ngày 15/11
  (12h05'27")**, **A+D đóng, B+C mở** (2 cửa sổ mở, tổng
  ~9h48'14"), **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn
  C). Parent đã **chấp nhận để mở** (QUYẾT PARENT 7 đợt
  119) — T6 KHÔNG thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Khoảng mù #37 là 15/11 11:39:50Z → 23:45:17Z, KHÔNG phải
  16/11 — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #100? + #101? + bde599df)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 / T6-138 §8.2 /
T6-139 §8.2 / T6-140 §8.2 / T6-141 §8.2 (mỗi boot liệt kê
với boot_id + btime lấy từ ≥1 nguồn độc lập; btime→btime
danh nghĩa = khoảng cách giữa hai btime liên tiếp). Số thứ
tự là số tạm theo thứ tự thời gian (tất cả đều mang "?") —
xem verdict §8.8. **Định nghĩa đếm dùng: định nghĩa gộp của
T10 (LIMITS gộp đợt 133 §10.2) — mọi reboot quanh đợt, cả
giữa lượt lẫn ranh giới — theo quyết F-133-6.** Bảng dưới
chỉ ghi 7 boot cuối (chuỗi đầy đủ #57→#93 xem T6-131 §8.2 +
T6-132 §8.2 + T6-133 §8.2 + T6-134 §8.2 + T6-135 §8.2 +
T6-136 §8.2 + T6-137 §8.2 + T6-138 §8.2 + T6-139 §8.2 +
T6-140 §8.2 + T6-141 §8.2 — không chép lại để khỏi drift;
T6 đợt này đã đối chiếu lại với LIMITS gộp đợt 141: các boot
#94?→#99? dưới đây khớp đúng btime/boot_id T10-141 đã chốt,
không có boot_id lạ nào xuất hiện trong bất kỳ bằng chứng
18/11 nào ngoài chuỗi này — trừ boot mới dưới đây).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #94 | 17db9652 | 09:36:01Z 18/11 | 2h16m19s (8.179 s — gap #94?→#95?, CHỨNG NHẬN [8.169, 8.189] s, T2-139); sống tới 11:52:20Z | T6-138 + T2-138 (prereg + probe #57 + merged mù #57 A đóng) |
| #95 | 914964c3 | 11:52:20Z 18/11 | 2h01m21s (7.281 s — gap #95?→#96?, CHỨNG NHẬN [7.271, 7.291] s, T2-139); sống tới 13:53:41Z | T2-138 §6 + T10-138 .done + T2-139 (merged mù #58 A+B đóng) |
| #96 | 541524e2 | 13:53:41Z 18/11 | 2h00m56s (7.256 s — gap #96?→#97?, CHỨNG NHẬN [7.246, 7.266] s, T2-140 + quyết parent (j) đợt 140); sống tới 15:54:37Z | T6-139 + T2-139 (prereg + probe #58 + merged mù #58 B+C đóng) + T2-140 (merged mù #59 đóng hoàn toàn) |
| #97 | af558fb5 | 15:54:37Z 18/11 | 1h58m19s (7.099 s — gap #97?→#98?, CHỨNG NHẬN [7.089, 7.109] s, T2-141); sống tới 17:52:56Z | T6-140 + T2-140 (prereg + probe #59 + merged mù #59 đóng hoàn toàn) + T10-139 closing-checks |
| #98 | 90392aa5 | 17:52:56Z 18/11 | 2h01m16s (7.276 s — gap #98?→#99?, CHỨNG NHẬN [7.266, 7.286] s, T2-141); sống tới 19:54:12Z | T2-140 §6 + T10-140 closing-checks + T2-141 prereg (boot #98? ứng viên) + T2-141 LIMITS (merged mù #60 đóng hoàn toàn) |
| #99 | 2c0efe57 | 19:54:12Z 18/11 | 1h58m09s (7.089 s — gap #99?→#100?, CHỜ chứng nhận từ merged mù #61, ứng viên [7.079, 7.099] s); sống tới 21:52:21Z | T6-141 + T2-141 (prereg + probe #60 + merged mù #60 đóng hoàn toàn) + T10-141 §10.2 (btime INSIDE dải FULL75) + quyết parent (g) đợt 141 (XÁC NHẬN = #99?) |
| #100 | 57a0dd12 | 21:52:21Z 18/11 | 0h40m42s (2.442 s — gap #100?→#101?, CHỜ chứng nhận từ merged mù #61, ứng viên [2.432, 2.452] s); sống tới 22:33:03Z | T10-141 §10.2 (btime INSIDE dải FULL75 [20:22:26Z, 22:19:21Z]) + quyết parent (g) đợt 141 (XÁC NHẬN = #100?) + T2-142 prereg §4 |
| #101 | ed5323a4 | 22:33:03Z 18/11 | 0h15m02s (902 s — gap #101?→#102?, CHỜ chứng nhận từ merged mù #61, ứng viên [892, 912] s; caveat đoạn ngắn < sàn 1.147 s); sống tới 22:48:05Z | T10-141 §10.1/§10.2 (suite + O8 chạy trên boot này 22:39–22:45Z; btime INSIDE dải tạm FULL75 neo #100? [22:20:35Z, 00:17:30Z]) + quyết parent (g) đợt 141 (ghi TẠM = #101?) + T2-142 prereg §4 |
| #102 | bde599df | 22:48:05Z 18/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp) + T2-142 prereg + boot-verify + probe #61 (ok=2 fail=0) + T5-142 POSTBOOT_PASS |

- **Ghi chú bảng:** các hàng #94–#99 chép nguyên từ bảng
  T6-141 (đã qua soát xét đợt 141); hàng #100–#101 là boot
  đã chốt/xác nhận theo quyết parent (g) đợt 141; hàng
  #102 là boot mới. Nhãn gap trong ngoặc ở mỗi hàng là gap
  ứng với tuổi thọ danh nghĩa của boot đó (btime → btime
  boot sau).
- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #97?→#98? là sự kiện thứ 22** (GIỮA lượt 140);
  **#98?→#99? là sự kiện thứ 23** (trong lúc T10-140 đóng
  sổ); **#99?→#100? là sự kiện thứ 24** (GIỮA lượt 141 —
  theo aggregate đợt 141 §12.2(a)); **#100?→#101? là sự
  kiện thứ 25** (trong lúc T10-141 đóng sổ — theo aggregate
  đợt 141 §12.2(a)); **#101?→#102? là sự kiện thứ 26**
  (trong khoảng GIỮA hai đợt 141/142 — sau kiểm đóng của
  T10-141, trước khi đợt 142 mở — xem §8.0; nhãn #26 theo
  T2-142 prereg, CHƯA được parent chốt — F-142-T6-1).
- **T2-142 đối chiếu khớp (độc lập, trước khi T6 đo):**
  prereg-t2.md §0 ghi boot mới `bde599df…`, btime
  22:48:05Z (đọc trực tiếp 23:42Z), gọi là #102? ứng viên
  (kèm cảnh báo btime có thể nằm NGOÀI dải tạm — xem §8.6);
  `boot-verify.txt` khớp đúng boot_id + btime của T6
  (uptime -s 22:48:05Z, btime epoch 1795042085, journal
  first entry 22:48:17Z — T2 ghi "~22:48:17Z" như dự báo,
  khớp đúng);
  probe #61 (theo once.txt: `probe#61 boot=bde599df ok=2
  fail=0`) xác nhận boot đang sống. Hai luồng khớp nhau
  hoàn toàn về boot_id, btime, epoch và số tạm. T2-142
  cũng ghi rõ marker đợt 142 KHÔNG có mâu thuẫn btime lần
  này.
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#96: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3 +
    T6-138 §8.2–§8.4 + T6-139 §8.2–§8.4 + T6-140 §8.2–§8.4
    + T6-141 §8.2–§8.4 (không chép lại).
    Lưu ý theo quyết parent đợt 141 §12.2(b): khung chết
    #97? **XÁC NHẬN chuẩn merged (17:52:10Z, 17:52:56Z]
    (46 s)** (xem §8.3); khung chết #98? **XÁC NHẬN chuẩn
    merged (19:46:47Z, 19:54:12Z] (445 s)** theo quyết
    parent (g) đợt 141 (xem §8.4); khung chết #94? **GIỮ
    chuẩn (11:52:12Z, 11:52:20Z] (8 s)**; khung chết #93?
    bản chuẩn **(09:35:47Z, 09:36:01Z] (14 s)** GIỮ nguyên.
  - #95: khung ứng viên 400 s (xem §8.3).
  - #99: ứng viên quét mtime của T6, CHƯA CHỐT (xem §8.5).
  - #100: ứng viên quét mtime của T6, CHƯA CHỐT (xem §8.6).
  - #101: ứng viên quét mtime của T6 + kiểm nội dung của
    T10, CHƯA CHỐT (xem §8.7).

### 8.3 Khung chết #95? — ứng viên 400 s GIỮ NGUYÊN (quét lại, không có bằng chứng mới)

- **Khung chết #95? ứng viên: (13:47:01Z, 13:53:41Z]
  (400 s)** — T2/T6/T10 đồng thuận đợt 139; T2-140 prereg
  §0 và T2-141 prereg §0 xác nhận giữ nguyên trừ khi có
  bằng chứng mới.
- T6 quét lại toàn `hidden_files/` + `docs/` trong cửa sổ
  (13:47:01Z, 13:53:41Z] (python walk theo mtime float):
  **3 file, tất cả cùng một sự kiện** (release T10-138,
  mtime 13:47:01.57–13:47:01.62Z): `vite.lock.queue/
  cooldown-t10-round138`, `round138-t10/t10-o8-lock.log`,
  `round138-t10/t10-o8.log`. Không có quan sát nào từ sự
  kiện khác sau 13:47:01Z trong cây quét.
- Khác biệt so với T6-139 (đếm 4 file): file thứ 4 lúc đó
  là `vite-lock-v2.log` — mtime của log đã dịch về sau do
  các lần append sau đó (nay là 22:45:49Z), không phải bằng
  chứng mới; 3 file còn lại là cùng 3 file cũ, cùng mốc
  13:47:01Z. **Không có bằng chứng mới — khung 400 s giữ
  nguyên.** Merged của T2-142 (mù #61) không phủ cửa sổ
  này (mù #61 bắt đầu 20:45:15Z); khung chuẩn cuối cùng
  vẫn chờ T2 khi có merged phủ — T6 không tự chốt.
- Mốc ~13:50Z của T1-139 (bản nháp aggregate đợt 138 soạn
  ~13:50Z trên boot 914964c3) vẫn chỉ là mốc suy ra, không
  có file mtime cứng — T6 ghi nhận lại để T2 cân nhắc,
  không tự thu hẹp khung 400 s.

### 8.4 Khung chết #96?/#97?/#98? — ĐÃ CHỐT CHUẨN theo quyết parent đợt 141, không có bằng chứng mới

- **Khung chết #96? chuẩn: (15:54:16Z, 15:54:37Z] (21 s)**
  — XÁC NHẬN theo quyết parent đợt 140 §12.2(c). Khung T9
  (15:54:02Z, 15:54:37Z] (35 s) giữ làm biên ngoài.
- **Khung chết #97? chuẩn mới: (17:52:10Z, 17:52:56Z]
  (46 s)** — ứng viên merged của T2-141, **XÁC NHẬN theo
  quyết parent đợt 141 §12.2(b)** ("Đây là chứng nhận bằng
  merged mù #60 mà quyết (d) đợt 140 đã giao"). Hai khung
  quan sát (T4/T5 56 s / T8 36 s) ghi làm phương án thay
  thế. Quan sát mới của T6-141 (dòng log lock 17:53:28Z
  muộn hơn btime 32 s) ghi là dị thường đồng hồ theo cùng
  quyết (b) — không làm mốc khung chết.
- **Khung chết #98? chuẩn mới: (19:46:47Z, 19:54:12Z]
  (445 s)** — ứng viên merged của T2-141, **XÁC NHẬN theo
  quyết parent đợt 141 §12.2(g)** (không có khung quan sát
  thay thế; rộng 7,4 phút nhưng là kết quả chứng nhận
  merged).
- Không có bằng chứng mới nào về khung #96?/#97?/#98?
  trong phiên T6 đợt này — merged mù #61 không phủ các
  cửa sổ này (mù #61 bắt đầu 20:45:15Z). Trạng thái ba
  khung từ nay là **ĐÃ CHỐT CHUẨN**, không còn hoãn quyết.

### 8.5 Khung chết #99? — ứng viên quét mtime của T6: (21:51:52Z, 21:52:21Z] (29 s), CHƯA CHỐT — chờ merged mù #61 của T2-142

- **Quét mtime của T6 (hidden_files + docs, cửa sổ
  21:30:00Z–21:52:21Z): 2 file, cùng một sự kiện, mốc cuối
  21:51:52Z** — `round141-t9/ram-sampler-long.log` +
  `ram-sampler-long.out` (T9-141 sampler vòng 1). Không có
  file nào khác có mtime trong cửa sổ sau 21:51:52Z trong
  hai cây quét.
- Khung ứng viên theo quét này: **(21:51:52Z, 21:52:21Z]
  (29 s)** — TRÙNG ĐÚNG khung quan sát của T9-141 mà
  T2-142 prereg §6 đã dự báo ("khung quan sát T9
  (21:51:52Z, 21:52:21Z] 29 s — T2 báo cả khung merged +
  khung quan sát T9, parent quyết"). Hai nguồn độc lập
  (T9 quan sát trực tiếp + T6 quét mtime) đồng thuận về
  mốc cuối 21:51:52Z.
- **T6 không tự chốt khung #99?** — merged mù #61 của
  T2-142 (đoạn A: 20:45:15Z → 21:52:21Z, 4.266 s) là
  chứng nhận chính thức; T2 sẽ báo khung merged + khung
  quan sát, parent quyết. Gap danh nghĩa #99?→#100? =
  **7.089 s (1h58'09")** — nằm trong dải chứng nhận
  [0h00'55", 3h14'08"]. Chứng nhận **[7.079 s, 7.099 s]
  NẾU đoạn A mù #61 đóng** (prereg T2-142 §4 — T6 không
  tự chứng nhận, chờ merged/LIMITS T2-142).

### 8.6 Khung chết #100? — ứng viên quét mtime của T6: (22:32:05Z, 22:33:03Z] (58 s), CHƯA CHỐT — chờ merged mù #61 của T2-142

- **Quét mtime của T6 (hidden_files + docs, cửa sổ
  22:00:00Z–22:33:03Z): 7 file, mốc cuối 22:32:05Z** —
  `round141-t9/appendix-vong1.md` + `appendix-vong2.md`
  (T9-141, cùng mốc 22:32:05Z); các file trước đó:
  `round141-t7.done` 22:28:32Z, `DOCS/PHASE9_ROUND141_T7_
  SCHEDULER_LIMITS.md` 22:28:27Z, `round141-t9/ram-sampler-
  long-2.log/.out` 22:28:25Z, `round141-t7/NOTES.md`
  22:26:50Z. Không có file nào khác có mtime trong cửa sổ
  sau 22:32:05Z trong hai cây quét.
- Khung ứng viên theo quét này: **(22:32:05Z, 22:33:03Z]
  (58 s)**. T2-142 prereg §6 dự báo khung này "dự kiến
  rộng (máy yên sau T9 đóng sampler 22:28:25Z?)" — thực
  tế quét của T6 hẹp hơn dự báo nhờ 2 file T9 ghi lúc
  22:32:05Z (sau khi sampler đóng).
- **T6 không tự chốt khung #100?** — merged mù #61 của
  T2-142 (đoạn B: 21:52:21Z → 22:33:03Z, 2.442 s) là
  chứng nhận chính thức; T2 sẽ báo khung merged, parent
  quyết. Gap danh nghĩa #100?→#101? = **2.442 s
  (0h40'42")** — nằm trong dải chứng nhận. Chứng nhận
  **[2.432 s, 2.452 s] NẾU đoạn B mù #61 đóng** (prereg
  T2-142 §4 — T6 không tự chứng nhận).
- Lưu ý: đoạn B có T9 sampler vòng 2 tới 22:28:25Z + T7
  kiểm lần 3 22:25Z + T7/T9 đóng cờ 22:28–22:32Z — mật độ
  mốc dày tới gần btime; verdict cuối thuộc T2-142.

### 8.7 Khung chết #101? — ứng viên quét mtime của T6: (22:45:49Z, 22:48:05Z] (136 s) + kiểm nội dung của T10 ở cùng giây với btime, CHƯA CHỐT — chờ merged mù #61 của T2-142

- **Quét mtime của T6 (hidden_files + docs, cửa sổ
  22:33:03Z–22:48:05Z): 273 file, mốc cuối 22:45:49Z** —
  `round141-t10/t10-o8.log`, `t10-o8-lock.log`,
  `o8-run.out`, `o8-webkit/o8w-*.png/.json/.log`,
  `vite-lock-v2.log` (dòng cuối t10-141 RELEASED
  22:45:49Z), `vite.lock.queue/cooldown-t10-round141`
  (cùng mốc 22:45:49Z — sự kiện O8 của T10-141 kết thúc).
  Không có file nào có mtime trong (22:45:49Z, 22:48:05Z]
  trong hai cây quét.
- Khung ứng viên theo quét mtime: **(22:45:49Z, 22:48:05Z]
  (136 s)**.
- **Quan sát nội dung bổ sung (không phải file mtime):**
  T10-141 kiểm boot lúc **22:47:15Z và 22:48:05Z — vẫn
  ed5323a4** (aggregate đợt 141 §10.1). Kiểm 22:48:05Z
  trùng đúng giây với btime boot mới bde599df — tức ranh
  giới chết/sống nằm gọn trong cùng một giây đồng hồ
  tường: boot cũ còn sống lúc kiểm đầu giây 22:48:05Z,
  boot mới có btime 22:48:05Z. Nếu chấp nhận kiểm nội dung
  này làm mốc cuối thì khung (mốc cuối, btime] suy biến
  thành 0 s — T6 ghi nhận để T2-142 cân nhắc, KHÔNG tự
  thu hẹp khung 136 s (kiểm nội dung không phải mốc
  merged; độ phân giải giây + dị thường đồng hồ đã biết ở
  ranh giới reboot không cho phép ép khung 0 s).
- **T6 không tự chốt khung #101?** — merged mù #61 của
  T2-142 (đoạn C: 22:33:03Z → 22:48:05Z, 902 s) là chứng
  nhận chính thức. Gap danh nghĩa #101?→#102? = **902 s
  (0h15'02")** — nằm trong dải chứng nhận [0h00'55",
  3h14'08"]. Chứng nhận **[892 s, 912 s] NẾU đoạn C mù
  #61 đóng** (prereg T2-142 §4 — với caveat đoạn C chỉ
  902 s < sàn 1.147 s: verdict đóng cơ học yếu như đoạn A
  mù #60, đứng trên mật độ mốc — parent tự xét như
  F-141-T2-7; T6 không tự chứng nhận).

### 8.8 bde599df NGOÀI dải tạm cho #102? (dưới p10) — số #102? VẪN TẠM; chuỗi INSIDE theo dải cơ học ĐỨT ở #102?

- Dải tạm cho #102? theo T2-142 prereg §5 (FULL75, neo tại
  btime #101? 22:33:03Z, p10 0h28'14" = 1.694 s, p90
  2h25'09" = 8.709 s — T2-141 §2.5): **[23:01:17Z,
  00:58:12Z]**. Biến thể CERT60: [23:00:41Z, 00:49:49Z]
  (p10 1.658 s, p90 8.206 s).
- Thực tế btime bde599df **22:48:05Z — NẰM TRƯỚC cả hai
  dải**: sớm hơn cận dưới FULL75 **792 s (13'12")**, sớm
  hơn cận dưới CERT60 **756 s (12'36")**. Gap danh nghĩa
  #101?→#102? chỉ 902 s — **ngắn hơn p10 FULL75 (1.694 s)
  tới 792 s**.
- **T6 KHÔNG ép verdict INSIDE** — đúng như cảnh báo của
  T2-142 prereg §5 ("NẾU btime 22:48:05Z NẰM TRƯỚC dải
  (dưới p10) thì KHÔNG chốt #102? ngay — ghi TẠM + chờ
  T2-143?"). Số **#102? VẪN TẠM** cho tới khi T2-142
  chứng nhận bằng merged mù #61 (đoạn C đóng → gap
  [892, 912] s chứng nhận dạng khoảng → CERT 63 / FULL 78
  nếu cả ba gap chứng nhận) và parent quyết.
- Hệ quả chuỗi INSIDE: theo dải chuẩn (quyết parent (f)
  đợt 138 — dải T2 FULL70 neo tại #94?): #96? đã OUTSIDE
  nên chuỗi INSIDE theo dải chuẩn đứt ở #96?; theo dải cơ
  học (neo tại boot ngay trước), #96? INSIDE, #97? INSIDE,
  #98? INSIDE, #99? INSIDE, #100? INSIDE (theo quyết
  parent (g) đợt 141), #101? INSIDE (theo quyết parent (g)
  đợt 141 — btime 22:33:03Z trong dải tạm FULL75 neo #100?
  [22:20:35Z, 00:17:30Z]) — **chuỗi INSIDE theo dải cơ
  học kéo dài thành 8 lần liên tiếp (#94? … #101?) rồi
  ĐỨT ở bde599df (#102? ứng viên — OUTSIDE dưới p10)**.
  Đây là lần OUTSIDE đầu tiên theo dải cơ học kể từ #93?
  (btime #93? 08:07:11Z OUTSIDE dải FULL72 neo #92? —
  xem T6-137 §8.5). Không có thay đổi chế độ nào được
  suy ra từ một lần OUTSIDE — gap 902 s vẫn nằm trong
  dải chứng nhận, chỉ là ngắn hơn p10.
- Tốc độ reboot tới #101?: 101 / 194,25 h = **1 mỗi 115,4
  phút** (tới #99?: 99 / 191,60 h = 1 mỗi 116,1 phút —
  chênh 0,7 phút/boot, trong nhiễu). Không có thay đổi
  chế độ. (Tính bằng code: từ #1 2026-11-10T20:18:10Z tới
  #101? 2026-11-18T22:33:03Z = 194,25 h.) Cộng dồn ẩn tối
  đa: +4 (mù #29/#30/#31) → 1 mỗi 111,0 phút; +3 nữa
  (mù #53 đoạn B) → 1 mỗi 107,9 phút; +2 nữa (mù #55 đoạn
  B quy ước) → 1 mỗi 106,0 phút; +1 nữa (mù #56 đoạn A quy
  ước) → 1 mỗi 105,0 phút; **+0 nữa (mù #57 ĐÓNG + mù #58
  ĐÓNG + mù #59 ĐÓNG + mù #60 ĐÓNG, tối đa 0)** → 111 /
  194,25 h = 1 mỗi 105,0 phút.

### 8.9 Dải dự báo cho boot #103? (T6 tính độc lập — chờ T2-142 công bố FULL76/77/78)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 / T6-138 §8.6 /
T6-139 §8.6 / T6-140 §8.6 / T6-141 §8.8 — p10–p90 của phân
phối FULL75 (p10 = 1.694 s, p90 = 8.709 s; T2-141 §2.5),
cộng vào btime bde599df 22:48:05Z. **T6 dùng FULL75** (CERT
60 / FULL 75 đã xác nhận — phân phối hiện hành cho tới khi
T2-142 chứng nhận thêm gap).

- **Dải dự báo T6 cho #103? (FULL75): [23:16:19Z,
  01:13:14Z]** (22:48:05Z + 1.694 s = 23:16:19Z;
  22:48:05Z + 8.709 s = 01:13:14Z 19/11). Tính bằng code
  (python3), không nhẩm. Biến thể CERT60: [23:15:43Z,
  01:04:51Z] (p10 1.658 s, p90 8.206 s).
- **Đối chiếu với T2: CHƯA CÓ để đối chiếu.** T2-142 prereg
  §4 ghi rõ: nếu cả ba gap chứng nhận thì CERT 60→63 /
  FULL 75→78 — p10/p90 có thể dịch vài giây như tiền lệ
  đợt 138/139/140/141 — dải trên đây là dải FULL75, T2 là
  chủ quản dải chuẩn.
- Lưu ý: cận dưới dải #103? (23:16:19Z) đã qua lúc T6 đóng
  (23:49Z) mà chưa có reboot — điều đó bình thường (dải
  p10–p90 chỉ bao 80% khối lượng, không phải cam kết).
  Dải hiệu dụng sau probe #61 (xong ~23:44Z): [23:44Z,
  01:13:14Z] (cận dưới thực tế là thời điểm probe #61 xác
  nhận boot bde599df còn sống).

### 8.10 VERDICT: chuỗi tương đối CHỐT #57→#101? + bde599df; số tuyệt đối VẪN TẠM (giữ "?"); #101?/#102? chờ merged mù #61

- **CHỐT ĐƯỢC — chuỗi tương đối:** 41 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới bde599df (22:48:05Z 18/11)
  xếp đúng thứ tự thời gian, mỗi boot có boot_id + btime
  riêng biệt, không có boot_id lạ nào trong bất kỳ bằng
  chứng nào ở khoảng giữa; các bước chuyển #74→#75→…→
  #99→#100→#101→bde599df đều có ≥2 nguồn độc lập xác nhận
  (T5 + T2 + T6 + T9 + T10 + file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-142 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #101?→#102? lần này có
    kiểm boot của T10 trùng đúng giây với btime boot mới
    — §8.7 — nhưng một lần trùng giây không xóa tiền lệ,
    mà củng cố rằng ranh giới cần chứng nhận ngoài VM.)
  - **Mù #57 + mù #58 + mù #59 + mù #60 ĐÃ ĐÓNG HOÀN TOÀN
    (T2-138, T2-139, T2-140, T2-141):** số #94?/#95?/#96?/
    #97?/#98?/#99? nay đã xác nhận theo quy ước (không còn
    reboot ẩn giữa #93?→#94?→…→#98?→#99?); mù #56 A vẫn
    MỞ theo quyết parent (e) — số #93? vẫn mang tính quy
    ước headline.
  - **MỚI — mù #61 CHƯA ĐÓNG lúc T6 đóng:** T2-142 đã chạy
    probe #61 (ok=2 fail=0, boot bde599df) và đã viết
    prereg (dự báo 3 gap + 4 đoạn A/B/C/D) nhưng chưa công
    bố merged/LIMITS/.done lúc 23:49Z. Số #100?/#101? là
    XÁC NHẬN theo quyết parent (g) đợt 141 (btime INSIDE
    dải) — nhưng gap #99?→#100? / #100?→#101? / #101?→
    #102? vẫn CHỜ chứng nhận bằng merged; số #102? là TẠM
    THỜI và còn NGOÀI dải tạm (dưới p10, §8.8) — nếu đoạn
    A+B+C đóng (tối đa 0 ẩn) thì bde599df CHÍNH LÀ #102?
    (theo quy ước); nếu A/B/C MỞ thì số có thể cao hơn.
    T6-142 chốt chuỗi TƯƠNG ĐỐI (bde599df là boot quan sát
    được tiếp theo sau ed5323a4, không có boot quan sát
    được nào ở giữa) — số thứ tự tuyệt đối #100?/#101?/
    #102? chờ verdict của T2-142. **Ghi rõ "chờ T2" theo
    brief; T10 gộp.**
- **Kết luận cho parent:** T6-142 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 3 boot (#100? — reboot #24 giữa lượt
  141; #101? — reboot #25 trong lúc đóng sổ đợt 141;
  bde599df — reboot #26 trong khoảng giữa hai đợt); số thứ
  tự tuyệt đối **vẫn TẠM** và phải giữ "?" cho tới khi
  có bằng chứng ngoài VM (và, riêng #101?/#102?, tới khi mù
  #61 đóng). Không bịa số, không bỏ "?" khi chưa đủ bằng
  chứng — đúng như brief giao.
- Hệ quả thực hành: T9-142 gọi boot lúc mở là "#102?"
  trong LIMITS của mình là đúng quy ước tạm; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #24 cho reboot #99?→#100?, sự kiện #25 cho
  reboot #100?→#101?, sự kiện #26 cho reboot #101?→#102?
  — theo aggregate đợt 141 + T2-142 prereg; parent chốt
  nhãn #26 khi đóng sổ — xem F-142-T6-1). Các quyết parent
  trước vẫn đứng: không quyết con số tuyệt đối nào ở đây.

### 8.11 Reboot #26 — không mất việc của luồng T6; T6 không bị cắt

- Reboot ed5323a4 → bde599df (btime 22:48:05Z) xảy ra sau
  kiểm cuối của T10-141 (22:48:05Z boot vẫn ed5323a4),
  trước khi đợt 142 mở (23:35:51Z) — **không giết attempt
  hay holder lock nào của đợt 142** (đợt 142 mở sau đó,
  trên boot mới; T4-142 poll-wait bắt đầu 23:42:38Z trên
  boot mới).
- **Không luồng đợt 142 nào mất việc trong phiên T6:**
  T6 mở 23:42:10Z và đóng 23:48:25Z toàn bộ trên boot mới,
  không bị reboot cắt (uptime liền mạch 54'05" → 60'20');
  T4-142 poll sạch trong phiên (§2, §11).
- **Replay apt sau boot bde599df: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-142 là chủ
  quản verdict replay / cờ POSTBOOT_PASS boot mới (PASS
  23:48:25Z, repair-1-phần); T2-142 đã đọc độc lập
  dpkg_lines=795 (xem §8.0).
- **/tmp đã bị reboot xóa sạch (từ đợt 141):** socket Xvfb
  X193 đã biến mất theo reboot #26 (§10); các TDIR suite
  `/tmp/vcut-lock-v2-test.*/` tự dọn bằng trap; TDIR repro
  của T6 đợt này đã dọn sạch sau khi xong (bản fixed in
  "TDIR cleaned").

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **23:42:10Z** (boot bde599df đã 54'05"
  tuổi); đóng **23:48:25Z** (boot bde599df đã ~60'20" tuổi).
  Đợt 142 mở **23:35:51Z** (round-in-progress.md) — tức
  **2.866 s sau btime boot bde599df (22:48:05Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — giả thuyết
  "scheduler ghi lại started_at khi hồi phục sau reboot"
  ĐÃ ĐƯỢC XÁC NHẬN đợt 134 (lần thứ 5 liên tiếp, +6.967
  s, = btime + 40 s), tái diễn đợt 135 (lần thứ 6, +36 s),
  đợt 136 (lần thứ 7), đợt 137 (lần thứ 8 — bằng chứng
  trực tiếp ĐẦU TIÊN, started_at = btime + 46 s), đợt 138
  (lần thứ 9, btime + 50 s), đợt 140 (lần thứ 10 —
  T10-140: started_at lượt 140 nay 17:53:45Z = btime
  90392aa5 + 49 s) và đợt 141 (lần thứ 11 — T7-141:
  started_at lượt 141 viết lại lần 1 (btime + 32 s, bằng
  chứng trực tiếp thứ 5) và lần 2 offset +936 s).
- **Quan sát mới T2-142 prereg ghi để T7-142 kiểm:**
  started_at lượt 141 viết lại lần 2 = **22:48:39Z** —
  bằng btime(ed5323a4) + 936 s theo cách tính cũ, NHƯNG
  bằng **btime(bde599df) + 34 s** nếu lần viết lại này xảy
  ra tại reboot #26 chứ không phải #25 — KHỚP dải
  ~30–50 s cổ điển. T2 ghi nhận khả năng này, không kết
  luận (cần bằng chứng ngoài started_at). **T6 đợt này
  chỉ ghi mốc, không kết luận:** T7-142 là chủ quản kiểm
  slot/started_at. Ghi nhận để T7/T10 đối chiếu: đợt 142
  mở 2.866 s sau btime bde599df; nếu dị thường tái diễn
  thì started_at lượt này rơi vào khoảng 22:48:xxZ, tức
  TRƯỚC khi đợt mở 23:35:51Z; nguyên nhân vẫn thuộc T7.

## 10. Dọn Xvfb: 0 Xvfb chạy; 0 socket sót — X193 của đợt 141 đã biến mất theo reboot #26

- **Lúc mở (23:42Z): 0 Xvfb đang chạy** (`pgrep -x Xvfb`
  rc=1; quét `ps-full-open.txt` không có process nào tên
  Xvfb). **`/tmp/.X11-unix/` TRỐNG** (x11-open.txt) — đã
  kiểm cả lúc mở (khắc phục F-141-T6-1).
- **Lúc đóng (23:48Z): 0 Xvfb đang chạy** (pgrep rc=1),
  quét `ps-full-close.txt` không có process nào tên Xvfb.
  **`/tmp/.X11-unix/` vẫn TRỐNG** (x11-close.txt).
- **Socket sót X193 (+ /tmp/.X193-lock) của đợt 141 ĐÃ
  BIẾN MẤT** — reboot #26 xóa /tmp (btime 22:48:05Z; thư
  mục /tmp/.X11-unix mtime 22:48Z). Không còn gì để dọn;
  T6 không xóa gì (không có file nào của tiến trình khác
  để xóa). T8-142 chưa chạy harness lúc T6 đóng.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-142; T2-142
  boot-verify ghi MemAvailable 1.012.020 kB lúc 23:44:12Z
  — DƯỚI gate A 1.024 MB — số RAM thuộc T2, T6 chỉ ghi bối
  cảnh; phù hợp với gate A của T4-142 chưa đạt lúc poll
  #2–#10, RAM 1.009 → 563 MB — xem §11; headroom mở đợt
  1.614 theo T5-142 — DƯỚI ngưỡng báo ~1.800 — thuộc T9).

## 11. Tuân thủ lock của luồng đo đợt 141 ĐÃ kiểm được + đợt 142 tới nay

- **T8-141 acquire + release sạch ×7 bổ sung** (20:53:03Z →
  21:23:21Z; holds 11/128/900/61/119/222/68 s; ports 5390/
  5490; 5 chu kỳ wait_s=15 qua cooldown, 2 chu kỳ
  wait_s=0; ticket khớp log — dòng 1009–1034 thô). Chu kỳ
  hold 900 s (20:55:52Z → 21:10:52Z) là lần chạy 86n2 bị
  kẹt thật thứ 4 (WebKit TIMEOUT 124) — watchdog không
  kích hoạt (thuộc T8-141 / quyết parent (e) đợt 141 đã
  phê duyệt vá từ đợt 142); release vẫn được ghi sạch
  (timeout giết process → trap release chạy). T8 dùng
  script repo (`run-webkit-141t8.sh` dòng 27, md5
  `520b8baa`) — tức chạy trên **thứ tự ghi mới** (§3).
- **T10-141 acquire + release sạch ×1** (22:44:03Z →
  22:45:49Z hold 106 s, port 5554, ticket khớp log — dòng
  1035–1037 thô; O8 Chromium 21/21 + WebKit 21/21 trên
  boot ed5323a4). T10 dùng bản frozen
  `round141-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
  (kiểm trực tiếp đợt này) — tức chạy trên **thứ tự ghi
  mới** (§3).
- **T4-142 acquire + release sạch ×0 tới 23:49Z** — poll-
  wait đang chạy từ 23:42:38Z (poll #10 23:49:24Z), gate A
  CHƯA ĐẠT (RAM 1.009 MB lúc poll #2, rơi dần tới 563 MB
  lúc poll #10; gate A ≥1.024 MB KHÔNG HẠ theo quyết
  parent (i) đợt 141), lock vẫn trống. T4 dùng script repo
  (`run-attempt-142.sh` — T6 không kiểm md5 của file này
  vì T4 chưa acquire; lúc acquire T6 đợt sau kiểm).
  **Lượt yên #18 CHƯA ĐO ĐƯỢC tới lúc T6 đóng** — T4-142
  vẫn đang chờ gate A; không phải lỗi lock.
- **Tổng kết đợt 141: 9/9 chu kỳ sạch, trên thứ tự ghi
  mới** — 42 chu kỳ liên tiếp sạch kể từ lúc T6-135 đóng
  (§3). **Đợt 142 tới 23:48Z: 0/0 chu kỳ.**
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Đường dẫn đúng `apps/web/src/preview.tsx`.
- **Tuân thủ Xvfb luật đứng của đợt 137:** socket X193 của
  T4-141 đã biến mất theo reboot #26 (§10) — không còn
  sót; T8-142 chưa chạy harness tới lúc T6 đóng.

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-142-T6-1 + F-142-T6-2 (mới, xem dưới).**
- **F-142-T6-1 — Mâu thuẫn nhãn reboot #25/#26 giữa các file đợt 142 (mới, T6 phát hiện lúc đối chiếu):**
  `round-in-progress.md` đợt 142 (dòng 3) và cờ
  `round142-t5/POSTBOOT_PASS` đều gọi reboot ed5323a4 →
  bde599df là **"#25"**; T2-142 prereg gọi là **"#26"**;
  aggregate đợt 141 §12.2(a) đã dùng #25 cho 57a0dd12 →
  ed5323a4. **Hệ quả:** nếu giữ nhãn của round-in-progress
  thì có HAI reboot cùng mang số #25 (57a0dd12→ed5323a4 và
  ed5323a4→bde599df) — đếm sự kiện gộp sẽ lệch 1. T6 dùng
  #26 theo aggregate + T2-142 prereg. **Cần T10/parent
  thống nhất:** sửa round-in-progress.md + POSTBOOT_PASS
  #25 → #26. Ngoài ra cờ POSTBOOT_PASS gọi boot đã chết
  là "2c0efe57" — sai tên (boot chết trước khi T5-142 mở
  là ed5323a4; 2c0efe57 chết ở reboot #24, 21:52:21Z) —
  cần T5 sửa. **Không ảnh hưởng kết luận lock:** chỉ là
  nhãn hồ sơ; chuỗi boot tương đối + btime không đổi.
- **F-142-T6-2 — Grep "KHÔNG NHẢ" lần đầu trả 33 dòng do chưa loại file grep-output (mới, đã sửa trong phiên):**
  lần grep đầu chưa loại `khong-nha-grep.txt` nên đếm lồng
  23 dòng bản sao từ 2 file grep-output cũ (round140-t6/
  round141-t6). Đã chạy lại với `--exclude` đúng (loại mọi
  file `khong-nha-grep.txt` + repro đợt này) → tổng chuẩn
  10 dòng (§5). Bài học: grep đếm "KHÔNG NHẢ" phải loại
  file grep-output NGAY từ lần đầu — các đợt sau dùng đúng
  lệnh đợt này.
- **F-141-T6-1 (cũ, đã khắc phục):** T6-141 chỉ kiểm
  `/tmp/.X11-unix/` lúc đóng. T6 đợt này kiểm CẢ lúc mở
  lẫn lúc đóng (§10) — không lặp lại.
- **Số hiệu boot mới (#100?/#101?/bde599df) VẪN TẠM (xem §8.10):**
  chuỗi tương đối #57→#101? + bde599df đã chốt (41 boot);
  số tuyệt đối giữ "?" vì (a) mù #37 tối đa 29 ẩn (+ mù
  #38 G mở tối đa 6, mù #29/#30/#31 +4 — T5-120: "#60" tạm
  có thể tới #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn; (c)
  mù #51 đoạn B mở, tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn
  nhưng không làm neo được; (e) dị thường đồng hồ #84?→#85?
  (§8.4(b) đợt 134) + ranh giới #101?→#102? có kiểm boot
  của T10 trùng đúng giây với btime (§8.7); **(f) MỚI: mù
  #61 chưa đóng — số #101?/#102? + gap #99?→#100? /
  #100?→#101? / #101?→#102? chờ verdict T2-142; mù #56 A
  vẫn MỞ (quyết parent (e)) — số #93? cũng vẫn quy ước
  headline**. Journal/wtmp chỉ giữ boot hiện tại (journal
  `--list-boots` chỉ 1 dòng bde599df; wtmp bắt đầu
  22:48:16Z) nên T6 suy ra số hiệu từ thứ tự thời gian +
  hồ sơ các đợt trước, không phải từ log hệ thống.
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
  parent (c) đợt 141) + mù #61 MỚI MỞ (T2-142 đang điều
  tra; probe #61 xong ok=2 fail=0, prereg đã viết nhưng
  merged/LIMITS/.done chưa có lúc T6 đóng); mù #52 đã đóng
  hoàn toàn (T2-133); mù #54 đã đóng hoàn toàn (T2-135).
- **F-140-T6-1 (cũ, nhắc lại):** T6-140 thử đọc preview.tsx
  bằng đường dẫn sai (`apps/web/src/editor/preview.tsx`).
  T6 đợt này dùng đúng đường dẫn `apps/web/src/preview.tsx`
  ngay từ đầu, md5 `530e10a7` khớp — không lặp lại.
- **F-139-T6-1 (cũ, nhắc lại):** T6-139 gọi `status` với
  `VITE_LOCK_DIR` sai lúc mở. T6 đợt này đã gọi status
  ĐÚNG ngay từ đầu (không override) — không lặp lại.
- **F-136-T6-1 (cũ, nhắc lại):** T1-135 viết sai nhãn boot.
  Không lặp lại ở đợt này: T6-142 ghi đúng boot sống
  bde599df (khớp T2-142 boot-verify + probe #61 +
  T5-142 POSTBOOT_PASS).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn; tổng 17 không đổi. T6-142 đã đếm lại đúng (§5:
  trích dẫn = 0 — các file `.done` của T6 viết không dấu
  nên không khớp pattern có dấu; đã giải thích phương pháp
  ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  tám liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round140-t*/` (toàn đợt) +
  `round141-t*/` (toàn đợt) + `round142-t*/` tới 23:48Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T8/T10-142 chưa chạy xong tới thời điểm đếm; T6
  đợt 143 đếm tiếp.
- **Prune cooldown lần 17 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 92 ≤ trần 100 lúc chạy). File
  cũ nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z,
  theo `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 141 khép sạch trên lock (§4):** 9 chu kỳ (t4-141 +
  t8-141 ×7 + t10-141) sạch — T6 đợt này đếm bổ sung 8 chu
  kỳ sau khi T6-141 đóng, khớp đúng recount T10-141;
  **đợt 142 tới 23:48Z có 0 chu kỳ** (T4-142 chưa acquire
  — gate A chưa đạt, RAM rơi). Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 23:48Z (trống, 0 ticket + 92 cooldown); đợt
  còn chạy tới ~02:30Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–141 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 42 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt bde599df chưa có verdict đầy đủ** (thuộc
  T5-142 — xem §8.0/§8.11; T5 đã repair-1-phần, dpkg
  795/113, POSTBOOT_PASS 23:48:25Z).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- **T2-142 CHƯA XONG lúc T6 đóng (23:49Z):** probe #61 xong
  (ok=2 fail=0) và prereg đã viết (dự báo 3 gap + 4 đoạn
  A/B/C/D + cảnh báo btime #102? ngoài dải tạm) nhưng
  merged/LIMITS + .done chưa có. Theo brief, T6 ghi rõ
  "chờ T2" và để T10 gộp — KHÔNG tự suy đoán số boot
  #100?/#101?/#102?, không tự chứng nhận gap #99?→#100? /
  #100?→#101? / #101?→#102?, không tự chốt khung chết
  #99?/#100?/#101? cuối cùng. T6 chỉ ghi thêm quan sát
  quét mtime của mình (§8.5–§8.7) để T2-142 cân nhắc.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND142_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t8-round141` + `cooldown-t10-round141`
do release hợp lệ của t8/t10-141 — xem §3), Xvfb (0
process; 0 socket sót — X193 đã biến mất theo reboot #26,
T6 không xóa gì).
Stage: `repo-1-push/paths-loop/phase9-round142-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round142-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, x11-open.txt, x11-close.txt,
boot-verify-open.txt, analyze-log-cleaned-open.txt,
vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-close.log, vite-lock-v2-raw-open.log,
vite-lock-v2-raw-close.log, analyze-log.py,
cooldown-now-open.txt, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg-fixed.sh, repro-newmsg-fixed142.sh,
repro-newmsg.log).
