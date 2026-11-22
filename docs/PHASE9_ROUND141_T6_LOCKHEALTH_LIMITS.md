# PHASE9 ROUND141 T6 — lock health + prune lần 16 + BOOT #99? INSIDE dải FULL73 + lượt yên #17 ĐO ĐƯỢC — LIMITS

- Đợt: 141, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 03:35 +07 19/11/2026 (= 20:35:51Z 18/11). Chạy
  20:44:49Z → 20:51:41Z 18/11/2026, toàn bộ trên một boot duy
  nhất #99? (2c0efe57) — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune lần 16, suite kiểm lock 9/9
  ×2, chốt chuỗi boot với boot #99? 2c0efe57 (btime 19:54:12Z),
  khung chết #96? theo quyết parent (c) đợt 140, khung chết
  #97? HOÃN theo quyết parent (d) đợt 140 + quan sát mới
  (dòng RELEASED 17:53:28Z của T4-140 trên boot cũ), dải dự
  báo T6 độc lập cho #100? (FULL73 — chuẩn theo quyết parent
  (j) đợt 140), ghi mọi sai số F-141-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round141-t6/` (status-open.txt,
  status-close.txt, ps-full-open.txt, ps-full-close.txt,
  ss-open.txt, ss-close.txt, boot-verify-open.txt,
  analyze-log-cleaned-open.txt,
  vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-close.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, analyze-log.py,
  cooldown-now-open.txt, cooldown-now.txt,
  prune-candidates.txt, prune-deleted.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg-fixed.sh,
  repro-newmsg-fixed141.sh, repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT #99? (số tạm theo quy ước, xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `2c0efe57-5559-4e92-9f8b-aecf1f9866a3`, btime 19:54:12Z**
  (`/proc/stat` btime epoch 1795031652; `uptime -s` =
  19:54:12Z; `who -b` = Nov 18 19:54; `/proc/1` 19:54:22Z —
  chênh +10 s, cùng mẫu các boot trước; `journal --list-boots`
  chỉ 1 dòng 2c0efe57, first entry 19:54:23Z (boot +11 s —
  đúng mẫu +11–16 s); `wtmp` bắt đầu 19:54:23Z). Uptime
  ~50'37" lúc T6 bắt đầu (20:44:49Z), ~54'56" lúc đóng
  (20:49:08Z). Đây là **reboot #98?→#99? — sự kiện gộp #23**
  (theo T10-140 — xảy ra trong lúc T10-140 đóng sổ, sau kiểm
  cuối 19:47:27Z boot vẫn 90392aa5, trước cờ .done 19:57:15Z;
  xem §8.0).
- **KHÔNG có mâu thuẫn btime lần này** (như đợt 140): brief,
  `round-in-progress.md` và T2-141 prereg đều ghi đúng btime
  19:54:12Z. T2-141 `boot-verify.txt` (20:44:36Z) khớp đúng
  boot_id + btime + epoch + journal first entry của T6;
  T10-140 `t10-closing-checks.txt` cũng ghi btime 19:54:12Z
  (phát hiện 19:57:28Z). F99 do T2 đo: HTTP `Date` 3 server
  hơn local +2/+2/+1 s (xem `round141-t2/f99.txt`) — T6 không
  đo F, chỉ ghi bối cảnh.
- **Đợt 141 mở 20:35:51Z** (round-in-progress.md; sched
  20:35:51Z) — tức **2.499 s sau btime boot #99?
  (19:54:12Z)**. T6 mở 20:44:49Z (3.037 s sau btime).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline.
- Các luồng đợt 141 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round141-t2/t4/t5/t7/t8/t9; T2-141 đã viết prereg
  + chạy probe #60 (ok=2 fail=0, boot 2c0efe57) nhưng CHƯA
  viết LIMITS/.done lúc T6 đóng — T6 đối chiếu ở §8 với
  prereg-t2.md + boot-verify.txt + f99.txt + once.txt +
  blind60-merged.log, không đọc nội dung cờ của luồng khác
  ngoài file T2 phục vụ đối chiếu; **T4-141 ĐANG GIỮ LOCK
  lúc T6 mở** — attempt1 lượt yên #17 đang chạy (acquire
  20:42:48Z, xem §2); T8-141 chưa chạy harness lúc T6 đóng).

## 1. Quét zombie: 0 zombie; vite/node thật lúc mở = T4-141 attempt1 (hợp lệ), lúc đóng = 0 — 0 cổng lạ lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 20:44Z
  (mở, `ps-full-open.txt`) và lúc 20:49Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (20:44Z):** các process vite/node/webkit thật đều
  thuộc T4-141 attempt1 (hợp lệ, đang giữ lock — xem §2):
  lock-script `vcut-vite-lock-v2.sh run-attempt t4 5187`
  (pid 13758), `npm exec vite` (pid 13848), `node vite`
  (pid 13867, cổng 5187), esbuild service (pid 13875),
  probe webkit `probe121t3-ghost-k7.webkit.mjs` (pid 13916).
  `ss -tlnp` lúc mở: **LISTEN [::1]:5187** (vite của T4-141,
  pid 13867) — cổng hợp lệ duy nhất.
- **Lúc đóng (20:49Z): 0 tiến trình vite/node/webkit thật,
  `ss -tlnp` chỉ còn dòng header (không cổng nào lắng
  nghe).** T4-141 đã nhả lock 20:46:14Z và vite đã tắt (§2).
- **0 tiến trình lock-script nào đang chạy** ở cả 2 snapshot
  ngoài holder T4 lúc mở (đã nhả trước lúc đóng).

## 2. Lock lúc mở: T4-141 ĐANG GIỮ (lần đầu T6 mở phiên lúc lock giữ); lúc đóng: TRỐNG; 1 chu kỳ mới trong phiên T6

- **Lúc mở (20:44:49Z): thư mục lock thật
  `hidden_files/vite.lock` TỒN TẠI** (tuổi 121 s) — thread
  `t4`, pid 13758, port 5187,
  ticket `1-1795034568111950606-13758-t4`,
  started 20:42:48Z, boot `2c0efe57…` (status gọi ĐÚNG,
  không override — xem F-139-T6-1 đã sửa). Đây là **lần đầu
  tiên T6 mở phiên lúc lock đang giữ** (các đợt 120–140 đều
  mở lúc lock trống) — không phải bất thường: T4-141 acquire
  20:42:48Z, chỉ 2'01" trước khi T6 mở, để chạy attempt1
  lượt yên #17 (gate A đạt, RAM 1.485 MB lúc poll #2 —
  xem §11).
- `status` lúc mở: `0 ticket + 90 cooldown`, rc=0; vite node
  trên cổng 5187: pid 13867; `curl cổng 5187: 000` (vite vừa
  khởi động, chưa phản hồi lúc status chạy — không phải lỗi;
  probe đã chạy ngay sau đó, xem §11).
- **Lúc đóng (20:49:08Z): lock TRỐNG** — thư mục `vite.lock`
  KHÔNG tồn tại, status `TRỐNG (không có lock)`,
  `0 ticket + 90 cooldown`, rc=0.
- **Log lock +1 dòng trong phiên T6: 1007 dòng thô lúc mở →
  1008 dòng thô lúc đóng** — đúng 1 dòng mới:
  `2026-11-18T20:46:14Z t4 RELEASED hold_s=206` (T4-141
  attempt1 20/20 XONG, run-attempt exit=0 20:46:41Z — xem
  §11). Không có dòng nào khác thay đổi: 1001 dòng đầu của
  bản đã lọc lúc đóng khớp đúng bản đã lọc lúc mở (diff
  kiểm trực tiếp).
- Khoảng yên trước đó: không có event lock nào từ 19:46:47Z
  (T10-140 release) tới 20:42:48Z (T4-141 acquire) — yên lặng
  này là do đợt 140 đã đóng và đợt 141 mới mở — không phải
  do lock kẹt (bằng chứng: suite độc lập 9/9 ×2, §6; chu kỳ
  T4-141 acquire ngay khi cần, §4).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 34 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 3 chu kỳ mới kể từ
  lúc T6-140 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4):
  - t4-140 ×1 (17:48:00Z hold 328 s — release qua trap
    SIGTERM lúc shutdown, xem §11),
  - t10-round140 ×1 (19:44:46Z hold 121 s),
  - t4-141 ×1 (20:42:48Z hold 206 s, attempt1 20/20).
  - Cộng với 31 chu kỳ T6-140 đã đếm = **34 chu kỳ liên
    tiếp sạch trên thứ tự mới**.
  - Bằng chứng phiên bản: T4-140 dùng script repo
    (`run-attempt-140.sh` dòng 13:
    `LOCKV2=.../vcut-vite-lock-v2.sh`, md5 `520b8baa` lúc
    kiểm); T4-141 dùng script repo (`run-attempt-141.sh`
    dòng 13, md5 `520b8baa` lúc kiểm); T10-140 dùng bản
    frozen `round140-t10/vcut-vite-lock-v2.t10.sh`, md5
    `520b8baa` (kiểm trực tiếp đợt này).
- **File `cooldown-t4` mtime 20:46:14Z** (release hợp lệ của
  t4-141 — xem §4); file `cooldown-t10-round140` mtime
  19:46:47Z (release hợp lệ của t10-140); file
  `cooldown-t10-round139` mtime 16:50:56Z (release hợp lệ
  của t10-139 — xem §4); `cooldown-t4` ghi đè cùng tên nên
  tổng số file không đổi vì chu kỳ này.

## 4. Nhất quán log lock: 993 dòng chính thức lúc T6-140 đóng → 1002 lúc T6-141 đóng, 290 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z,
dòng 848–853 thô). Bản đã lọc lúc đóng có md5 `328ab2b0…`
— khác bản đã lọc lúc mở (`8e2dd4ae…`) đúng 1 dòng append
(T4 RELEASED 20:46:14Z); 1001 dòng đầu của bản đã lọc lúc
đóng khớp đúng bản đã lọc lúc mở (chuỗi không đứt). Lúc mở
(20:44Z): **1007 dòng thô / 1001 chính thức**; lúc đóng
(20:49Z): **1008 dòng thô / 1002 chính thức** — diff so
với snapshot T6-140 đóng: **đúng +9 dòng append** (3 chu kỳ
mới), không có dòng nào khác thay đổi.

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-140 (993) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 305 | 302 | 214 | 208 |
| ACQUIRED | 296 | 293 | 214 | 208 |
| RELEASED | 290 | 287 | 212 | 206 |
| COOLDOWN | 96 | 96 | 88 | 83 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **1002** | **993** | **729** | **706** |

- So với snapshot T6-140 đóng (993 dòng): **+9 dòng =
  TICKET +3 / ACQUIRED +3 / RELEASED +3 / COOLDOWN +0 /
  TIMEOUT +0 / STALE +0** — đúng bằng 3 chu kỳ mới:
  t4-140 ×1 = 3 dòng (không có COOLDOWN mới vì acquire
  wait_s=0 — dòng COOLDOWN chỉ ghi khi acquire phải chờ
  cooldown) + t10-round140 ×1 = 3 dòng (wait_s=0) +
  t4-141 ×1 = 3 dòng (wait_s=0). Mọi chu kỳ đều sạch,
  ghép cặp đủ — khớp từng con số, không có event nào mất
  dấu hay thêm lạ ngoài ca t4 cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 1002 dòng): **290 cặp ACQUIRED→RELEASED;
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
- Cửa sổ R120: **214 = 214 T/A, RELEASED 212** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  305+296+290+96+8+6+1 = 1002 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 140 khép lại trên lock (toàn đợt): 2 chu kỳ sạch**
  — t4-140 ×1 (hold 328 s, release qua trap lúc shutdown)
  + t10-round140 ×1 (hold 121 s). T6-140 lúc đóng mới
  thấy 0 chu kỳ; 2 chu kỳ này T6 đợt này đếm bổ sung, khớp
  đúng recount T10-140 (log 1005 dòng thô / 999 chính thức
  lúc T10-140 đóng sổ 19:47:08Z).
  **Đợt 141 tới 20:49Z có 1 chu kỳ** (t4-141, hold 206 s,
  attempt1 20/20). Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 139 (toàn đợt), đợt 140 (toàn đợt) và đợt 141 (tới 20:49Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round139-t*/` + `round140-t*/` +
`round141-t*/` (tới 20:49Z) + các file `.done` tương ứng
— theo quy tắc lăn: bỏ round138, thêm round140 (phần còn
lại sau T6-140) + round141. **Phương pháp đếm đợt này:
grep ra file /tmp trước, `--exclude='khong-nha-grep.txt'`,
rồi mới copy kết quả vào `round141-t6/khong-nha-grep.txt`**
(theo bài học race của T6-138 §5 — file grep-output lồng
nhau không được đếm lại). **Lưu ý phương pháp:** pattern
grep có dấu (`KHÔNG NHẢ` / `BỎ QUA release thừa`) — các
file `.done` của T6 viết bằng ASCII không dấu (`"KHONG
NHA"`) nên KHÔNG khớp pattern này; số học lăn dưới đây
nhất quán với đợt trước. **Lưu ý 2:** grep thô đợt này
trả **13 dòng** vì chạy SAU khi repro của chính T6-141 đã
tạo file `round141-t6/repro-newmsg.log` (3 dòng); theo quy
ước các đợt (repro của chính đợt này chưa đếm — đếm ở đợt
sau, như T6-140 đã làm với repro của mình), **tổng đếm
chuẩn = 10 dòng**; 3 dòng repro đợt này ghi riêng dưới
đây, đếm ở đợt 142.
Tổng **10 dòng khớp chuẩn, phân loại đủ 10/10 — tất cả
đều là bản sao script / log repro / trích dẫn tài liệu, 0
sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round139-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round140-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 6 | `round139-t6/repro-newmsg.log` + `round140-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 0 | Không file `.done` nào trong phạm vi khớp pattern có dấu (các file `.done` của T6 viết không dấu) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 139 (toàn đợt) / 140 (toàn đợt) / 141 nào |
| Round141-t* (trừ repro /tmp của T6) | 0 dòng | Chỉ có 1 chu kỳ T4-141 sạch tới lúc đếm (§4); T8-141 chưa chạy harness |

- **Repro đợt này (chưa đếm, đếm ở đợt 142):**
  `round141-t6/repro-newmsg.log` 3 dòng (2 `BỎ QUA` +
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
  đợt — bổ sung 2 chu kỳ sau T6-140 đóng, §4), đợt 141
  tới 20:49Z = 0.** Khớp với log pairing sạch ở §4 (290
  cặp + 1 ca reboot-kill cũ đã giải thích — không liên
  quan nhánh release).
- Giới hạn phạm vi: T8/T10-141 chưa chạy xong tới 20:49Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  141, T6 đợt 142 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-140 đếm 11 dòng (4 script + 6
  repro + 1 trích dẫn); đợt này bỏ round138 (−2 script
  −3 repro −1 trích dẫn = −6) nhưng thêm round140-t10
  script (2) + round140-t6 repro (3) = +5 → 11 − 6 + 5 =
  **10 dòng** ✓. (round139-t10 KHÔNG có closing-copy —
  T10-139 viết LIMITS gộp trực tiếp; `round140-t6.done`
  viết không dấu nên không khớp pattern có dấu như đã
  giải thích.)

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
#99? (`2c0efe57…`).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round141-t6/test-v2-t6-run1.log` 20:46:49Z,
`test-v2-t6-run2.log` 20:47:10Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ mười bảy liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — mười bảy lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ hai mươi ba liên tiếp (T6
  đợt 120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 140 + T6
  đợt 141).

### 6.2 Repro message ĐÚNG (`round141-t6/repro-newmsg.log`, 20:47:10Z)

Copy verbatim script của T6-140, chỉ đổi tên TDIR
(`vcut-t6r140-repro` → `vcut-t6r141-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–140, kết quả giống hệt:
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
  lúc đó có 90 cooldown; log thật vẫn 1008 dòng thô lúc
  repro chạy và queue vẫn 90 file sau khi repro xong;
  không có file `cooldown-tA/tH/tB` nào xuất hiện trong
  queue thật. **F-132-T6-1 KHÔNG lặp lại.**
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc đóng, 0
  zombie, 0 stale, queue 0 ticket, log nhất quán (290 cặp
  + 1 ca reboot-kill cũ đã giải thích, 0 mất dấu khác — số
  chính thức đã loại 6 dòng repro lỗi của T6-132), 0
  TIMEOUT mới từ đợt 120, STALE-LOCK mới duy nhất do reboot
  giữa lượt (đợt 130), 0 sự kiện "KHÔNG NHẢ" trên lock thật
  đợt 120–140 (toàn đợt) và đợt 141 (tới 20:49Z), suite 9/9
  độc lập ×2 lần chạy (T7 xanh cả hai lần), và thứ tự ghi
  mới đã có **34 chu kỳ thật** chứng minh (§3). **Không còn
  caveat nào về mất dòng RELEASED cho các chu kỳ mới** —
  caveat cũ chỉ còn là 1 dòng lịch sử (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: lúc MỞ lock đang giữ bởi
  T4-141 (§2) — là giữ hợp lệ, đã nhả sạch trước lúc đóng.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 16 liên tiếp)

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
  - 20:48Z: lock TRỐNG (status 0 ticket + 90 cooldown)
    — điều (e) thỏa (chờ T4-141 nhả 20:46:14Z rồi mới chạy
    prune — không chạy prune lúc lock đang giữ); quét ứng
    viên mtime >7 ngày (`find -mtime +7`): **0 file**
    (`prune-candidates.txt` rỗng) — tổng 90 file ≤ trần
    mềm 100 nên điều (b) cũng không kích hoạt.
  - **Kết quả prune đợt 141: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 16 liên tiếp prune xóa 0 file
    (đợt 126–141: 0 mỗi đợt).
  - Lưu ý: file `cooldown-t4` mtime 20:46:14Z là **do
    release hợp lệ của t4-141 (§3), KHÔNG phải do
    prune** (prune không tạo/cập nhật file, chỉ xóa). Số
    file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (20:44Z) **90 file / 1260 byte**;
  lúc đóng (20:49Z) **90 file / 1260 byte** (90 × 14 =
  1260 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 89 + 1 = 90 ✓ (1 file cooldown mới:
  `cooldown-t10-round140`; `cooldown-t4` ghi đè cùng tên
  nên không tăng tổng). Không file nào bị xóa hay thêm
  giữa hai lần đếm của đợt này.
- Phân tầng tuổi lúc 20:48Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 27 file** (không đổi so với đợt 140 —
  không có file nào có mtime trong cửa sổ 15/11 14:49–
  17:40Z để vượt 72h giữa hai lần đếm; đúng quy luật tuổi,
  không phải thêm/xóa); **≥48h (`-mtime +1`): 49 file**
  (tăng từ 45 đợt 140 — 4 file mtime 16/11 14:49–17:40Z
  vừa vượt 48h, đúng quy luật tuổi). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 20:48Z mới **~98h10' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#99?; số tuyệt đối VẪN TẠM; khung chết #96? XÁC NHẬN merged 21 s theo quyết parent (c) đợt 140; khung chết #97? HOÃN QUYẾT + quan sát mới; #99? INSIDE cả hai dải

### 8.0 Reboot #98?→#99? — sự kiện gộp #23, trong lúc T10-140 đóng sổ (theo T10-140)

- Reboot 90392aa5 → 2c0efe57 (btime 19:54:12Z) xảy ra sau
  kiểm cuối của T10-140 (19:47:27Z boot vẫn 90392aa5),
  trước cờ .done của T10-140 (19:57:15Z, ghi trên boot mới)
  — **sự kiện gộp #23**, phân loại "trong lúc đóng sổ đợt
  140" theo T10-140 (`t10-closing-checks.txt`: "Boot
  90392aa5 → 2c0efe57…, btime 19:54:12Z…; Ranh giới: kiểm
  cuối 19:47:27Z boot vẫn 90392aa5; cờ .done tạo 19:57:15Z
  trên boot mới"). Aggregate đợt 140 §12.2(a) đã chấp nhận
  đóng đợt 140 với "2 reboot trong lượt (#22 giữa lượt giết
  attempt1 của T4; #23 trong lúc đóng sổ)".
- **Không có dị thường đồng hồ kèm theo lần này** (khác
  reboot #22): btime 19:54:12Z nằm trong khoảng quan sát
  (19:47:27Z, 19:57:15Z] một cách bình thường; T10-140 kiểm
  lại sau reboot (19:57:59Z) xác nhận aggregate + GAP +
  closing file + count nguyên vẹn.
- **Không luồng nào mất việc do reboot này trong phiên
  T6:** T6 mở 20:44:49Z và đóng 20:49:08Z toàn bộ trên boot
  mới, không bị reboot cắt (uptime liền mạch 50'37" →
  54'56'). Reboot xảy ra trước khi đợt 141 mở (20:35:51Z).
- **Replay apt #99?: THUỘC T5** — T6 không kiểm
  `dpkg.log`. Chỉ ghi bối cảnh từ file của T2-141
  (prereg §3, T2 đọc độc lập lúc 20:42Z): **1.545 dòng**,
  lần ghi cuối 19:58:09Z (gstreamer1.0-tools) — khớp hoàn
  toàn hình dạng replay của các boot trước (#94?/#96?/#97?).
  T4-141 poll #1/#2 cũng ghi dpkg_lines=1545. Bracket chính
  thức thuộc về T5-141.
- **/tmp đã bị reboot xóa sạch (từ đợt 140):** các TDIR
  suite `/tmp/vcut-lock-v2-test.*/` tự dọn bằng trap; TDIR
  repro của T6 đợt này đã dọn sạch sau khi xong (bản fixed
  in "TDIR cleaned"). Socket Xvfb X193 sót lại xem §10 —
  không phải do reboot (tạo 20:42Z, sau reboot).

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1 / T6-138 §8.1 / T6-139 §8.1 /
  T6-140 §8.1): khoảng **11:39:50Z → 23:45:17Z ngày 15/11
  (12h05'27")**, **A+D đóng, B+C mở** (2 cửa sổ mở, tổng
  ~9h48'14"), **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn
  C). Parent đã **chấp nhận để mở** (QUYẾT PARENT 7 đợt
  119) — T6 KHÔNG thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Khoảng mù #37 là 15/11 11:39:50Z → 23:45:17Z, KHÔNG phải
  16/11 — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #98? + #99?)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 / T6-138 §8.2 /
T6-139 §8.2 / T6-140 §8.2 (mỗi boot liệt kê với boot_id +
btime lấy từ ≥1 nguồn độc lập; btime→btime danh nghĩa =
khoảng cách giữa hai btime liên tiếp). Số thứ tự là số tạm
theo thứ tự thời gian (tất cả đều mang "?") — xem verdict
§8.7. **Định nghĩa đếm dùng: định nghĩa gộp của T10
(LIMITS gộp đợt 133 §10.2) — mọi reboot quanh đợt, cả giữa
lượt lẫn ranh giới — theo quyết F-133-6.** Bảng dưới chỉ
ghi 7 boot cuối (chuỗi đầy đủ #57→#91 xem T6-131 §8.2 +
T6-132 §8.2 + T6-133 §8.2 + T6-134 §8.2 + T6-135 §8.2 +
T6-136 §8.2 + T6-137 §8.2 + T6-138 §8.2 + T6-139 §8.2 +
T6-140 §8.2 — không chép lại để khỏi drift; T6 đợt này đã
đối chiếu lại với LIMITS gộp đợt 140: các boot #92?→#97?
dưới đây khớp đúng btime/boot_id T10-140 đã chốt, không có
boot_id lạ nào xuất hiện trong bất kỳ bằng chứng 18/11 nào
ngoài chuỗi này — trừ hai boot mới dưới đây).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #92 | 1ca1feaa | 05:29:18Z 18/11 | 2h37m53s (9.473 s, #91→#92 — SPAN); sống tới 08:07:11Z | T6-136 + T2-136 (prereg + probe #55) |
| #93 | 2104246b | 08:07:11Z 18/11 | 1h28m50s (5.330 s — gap #93?→#94?, CHỨNG NHẬN [5.320, 5.340] s theo quyết parent đợt 138 §12.3(k)); sống tới 09:36:01Z | T6-137 + T2-137 (prereg + probe #56) |
| #94 | 17db9652 | 09:36:01Z 18/11 | 2h16m19s (8.179 s — gap #94?→#95?, CHỨNG NHẬN [8.169, 8.189] s, T2-139); sống tới 11:52:20Z | T6-138 + T2-138 (prereg + probe #57 + merged mù #57 A đóng) |
| #95 | 914964c3 | 11:52:20Z 18/11 | 2h01m21s (7.281 s — gap #95?→#96?, CHỨNG NHẬN [7.271, 7.291] s, T2-139); sống tới 13:53:41Z | T2-138 §6 + T10-138 .done + T2-139 (merged mù #58 A+B đóng) |
| #96 | 541524e2 | 13:53:41Z 18/11 | 2h00m56s (7.256 s — gap #96?→#97?, CHỨNG NHẬN [7.246, 7.266] s, T2-140 + quyết parent (j) đợt 140); sống tới 15:54:37Z | T6-139 + T2-139 (prereg + probe #58 + merged mù #58 B+C đóng) + T2-140 (merged mù #59 đóng hoàn toàn) |
| #97 | af558fb5 | 15:54:37Z 18/11 | 1h58m19s (7.099 s — gap #97?→#98?, CHỜ chứng nhận từ merged mù #60, ứng viên [7.089, 7.109] s); sống tới 17:52:56Z | T6-140 + T2-140 (prereg + probe #59 + merged mù #59 đóng hoàn toàn) + T10-139 closing-checks |
| #98 | 90392aa5 | 17:52:56Z 18/11 | 2h01m16s (7.276 s — gap #98?→#99?, CHỜ chứng nhận từ merged mù #60, ứng viên [7.266, 7.286] s); sống tới 19:54:12Z | T2-140 §6 + T10-140 closing-checks + T2-141 prereg (boot #98? ứng viên) |
| #99 | 2c0efe57 | 19:54:12Z 18/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp) + T2-141 prereg + boot-verify + probe #60 (ok=2 fail=0) + T10-140 closing-checks |

- **Ghi chú bảng:** các hàng #92–#96 chép nguyên từ bảng
  T6-140 (đã qua soát xét đợt 140); hàng #97 T6 đợt này
  cập nhật trạng thái chứng nhận mới (gap #96?→#97? đã
  chứng nhận [7.246, 7.266] s nhờ merged mù #59 đóng hoàn
  toàn + quyết parent (j) đợt 140); hàng #98–#99 là boot
  mới. Nhãn gap trong ngoặc ở mỗi hàng là gap ứng với tuổi
  thọ danh nghĩa của boot đó (btime → btime boot sau).
- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #93?→#94? là sự kiện thứ 18** (GIỮA lượt 137);
  **#94?→#95? là sự kiện thứ 19** (GIỮA lượt 138 — XÁC
  NHẬN theo quyết parent đợt 138 §12.3(e)(iv));
  **#95?→#96? là sự kiện thứ 20** (trong cửa sổ đóng sổ
  đợt 138 — đã XÁC NHẬN nhờ merged mù #58 đóng, T2-139);
  **#96?→#97? là sự kiện thứ 21** (GIỮA lượt 139 — theo
  T10-139; parent đã chấp nhận, §12.2(a) đợt 139);
  **#97?→#98? là sự kiện thứ 22** (GIỮA lượt 140, giết
  attempt1 của T4 — theo T10-140; parent đã chấp nhận,
  §12.2(a) đợt 140); **#98?→#99? là sự kiện thứ 23**
  (trong lúc T10-140 đóng sổ — theo T10-140; parent đã
  chấp nhận, §12.2(a) đợt 140).
- **T2-141 đối chiếu khớp (độc lập, trước khi T6 đo):**
  prereg-t2.md §0 ghi boot mới `2c0efe57…`, btime
  19:54:12Z (đọc trực tiếp 20:39:59Z), gọi là #99? ứng viên
  (nếu không có reboot ẩn giữa 17:52:56Z và 19:54:12Z;
  T6-141 chốt chuỗi tương đối); `boot-verify.txt` khớp
  đúng boot_id + btime của T6 (uptime -s 19:54:12Z, btime
  epoch 1795031652, journal first entry 19:54:23Z);
  probe #60 (theo once.txt: `probe#60 boot=2c0efe57 ok=2
  fail=0`) xác nhận boot đang sống. Hai luồng khớp nhau
  hoàn toàn về boot_id, btime, epoch và số tạm. T2-141
  cũng ghi rõ marker đợt 141 KHÔNG có mâu thuẫn btime lần
  này.
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#93: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3 +
    T6-138 §8.2–§8.4 + T6-139 §8.2–§8.4 + T6-140 §8.2–§8.4
    (không chép lại).
    Lưu ý theo quyết parent đợt 140 §12.2(c): khung chết
    #96? **XÁC NHẬN chuẩn merged (15:54:16Z, 15:54:37Z]
    (21 s)** (xem §8.3); khung chết #94? **GIỮ chuẩn
    (11:52:12Z, 11:52:20Z] (8 s)**; khung chết #93? bản
    chuẩn **(09:35:47Z, 09:36:01Z] (14 s)** GIỮ nguyên.
  - #95: khung ứng viên 400 s (xem §8.3).
  - #97: hai khung quan sát + quan sát mới của T6, HOÃN
    QUYẾT (xem §8.4).
  - #98: ứng viên merged 445 s (xem §8.5).

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
  các lần append sau đó (nay là 20:46:14Z), không phải bằng
  chứng mới; 3 file còn lại là cùng 3 file cũ, cùng mốc
  13:47:01Z. **Không có bằng chứng mới — khung 400 s giữ
  nguyên.** Merged của T2-141 (mù #60) không phủ cửa sổ
  này (mù #60 bắt đầu 17:40:41Z); khung chuẩn cuối cùng
  vẫn chờ T2 khi có merged phủ — T6 không tự chốt.
- Mốc ~13:50Z của T1-139 (bản nháp aggregate đợt 138 soạn
  ~13:50Z trên boot 914964c3) vẫn chỉ là mốc suy ra, không
  có file mtime cứng — T6 ghi nhận lại để T2 cân nhắc,
  không tự thu hẹp khung 400 s.

### 8.4 Khung chết #96? — XÁC NHẬN merged 21 s làm chuẩn mới theo quyết parent (c) đợt 140

- **Khung chết #96? chuẩn mới: (15:54:16Z, 15:54:37Z]
  (21 s)** — ứng viên merged của T2-140, **XÁC NHẬN theo
  quyết parent đợt 140 §12.2(c)** ("Đây đúng là chứng nhận
  bằng merged mù #59 mà quyết (c) đợt 139 đã giao").
- **Khung T9 (15:54:02Z, 15:54:37Z] (35 s) giữ làm biên
  ngoài** theo cùng quyết (c). Khung T8 (15:54:42Z,
  15:55:24Z] là cách dựng khác, không giao với khung
  merged — ghi làm phương án thay thế kèm dị thường đồng
  hồ F-139-T8-3.
- Không có bằng chứng mới nào về khung #96? trong phiên
  T6 đợt này — merged mù #60 không phủ cửa sổ này (mù #60
  bắt đầu 17:40:41Z). Trạng thái khung #96? từ nay là
  **ĐÃ CHỐT CHUẨN** (21 s), không còn hoãn quyết.

### 8.5 Khung chết #97? — HOÃN QUYẾT theo quyết parent (d) đợt 140 — GHI CẢ HAI KHUNG QUAN SÁT + QUAN SÁT MỚI CỦA T6 + ỨNG VIÊN MERGED

- **Hai khung quan sát (từ đợt 140, chờ T2-141):**
  T4/T5: **(17:53:26Z, 17:54:22Z]** (mốc cuối boot cũ
  17:53:26Z — chain T4/sampler T5; mốc đầu boot mới
  17:54:22Z); T8: **(17:53:26Z, 17:54:02Z]** (cùng mốc
  dưới, mốc trên sớm hơn 20 s — T8 kiểm boot mới sớm hơn).
  btime 17:52:56Z sớm hơn mốc cuối boot cũ ~30 s (lệch đồng
  hồ, F-140-T4-1/F-140-T5-2/F-140-T8-1).
- **QUAN SÁT MỚI CỦA T6 (đợt này): dòng log lock
  `2026-11-18T17:53:28Z t4 RELEASED hold_s=328`** (dòng
  1002 thô) — một sự kiện có timestamp trên boot cũ, muộn
  hơn mốc cuối T4/T5 (17:53:26Z) **2 s** và muộn hơn btime
  boot mới (17:52:56Z) **32 s**. Cơ chế: driver T4-140
  (`run-attempt-140.sh` dòng 552) có trap
  `trap 'cmd_release "$thread" …' EXIT TERM INT` — lúc
  shutdown reboot, SIGTERM kích trap, release chạy trước
  khi kernel reboot (T4-140 LIMITS §3: "Poller cũ (pid
  25124) + probe + vite chết theo reboot"; release là hành
  động cuối của tiến trình trước khi chết, không phải của
  tiến trình trên boot mới — không tiến trình nào khác
  release thay cho thread 't4', và T10-140 acquire sau đó
  19:44:46Z với wait_s=0, không có dòng STALE-LOCK nào).
  File `cooldown-t4` từng mang mtime 17:53:28Z (đã bị ghi
  đè 20:46:14Z bởi release T4-141 nên merged của T2 không
  còn thấy mốc này dưới dạng file mtime).
- **Ứng viên merged của T2-141** (`round141-t2/
  blind60-merged.log`, lúc T6 đóng T2 CHƯA công bố
  LIMITS/.done): mốc cuối đoạn A merged là **17:52:10Z**
  (53 mốc, lỗ lớn nhất 79 s) → khung chết #97? ứng viên
  merged **(17:52:10Z, 17:52:56Z] (46 s)**. Lưu ý: merged
  dùng file mtime, không dùng timestamp trong nội dung dòng
  log — nên mốc 17:53:28Z của T6 KHÔNG có trong merged.
- **Hệ quả — T6 KHÔNG tự chốt:** nếu chấp nhận mốc
  17:53:28Z làm mốc cuối boot cũ thì khung (mốc cuối,
  btime] là **rỗng theo đồng hồ đọc** (mốc cuối nằm SAU
  btime 32 s — dị thường đồng hồ đã biết F-140-T4-1);
  nếu chỉ dùng mốc merged thì khung là 46 s. Đây đúng là
  caveat T2-141 prereg §3 đã báo trước: "nếu mốc cuối
  merged nằm sau btime thì khung (mốc cuối, btime] là rỗng
  theo đồng hồ đọc — phải ghi rõ và không ép thành khung
  dương". **Giao T2-141 chứng nhận + parent quyết** theo
  quyết (d) đợt 140; T6 ghi cả hai khung quan sát + quan
  sát mới + ứng viên merged kèm nguồn, không chọn một.
- Gap danh nghĩa #97?→#98? = **7.099 s (1h58'19")** — nằm
  trong dải chứng nhận [0h00'55", 3h14'08"]. Chứng nhận
  **[7.089 s, 7.109 s] NẾU đoạn A mù #60 đóng** (prereg
  T2-141 §1 — T6 không tự chứng nhận, chờ merged/LIMITS
  T2-141; merged sơ bộ: đoạn A 53 mốc, lỗ lớn nhất 79 s,
  floor(79/1147)=0, max_hidden=0 — nhưng đoạn A chỉ dài
  735 s < sàn 1.147 s nên verdict cơ học yếu theo luật
  thuần túy; bằng chứng thực chất là mật độ mốc, T2 quyết
  cuối).

### 8.6 Khung chết #98? — ứng viên merged 445 s (T2-141, chưa chốt)

- **Ứng viên merged của T2-141** (`blind60-merged.log`):
  mốc cuối đoạn B merged là **19:46:47Z** (174 mốc, lỗ lớn
  nhất 445 s) → khung chết #98? ứng viên **(19:46:47Z,
  19:54:12Z] (445 s)**. Mốc 19:46:47Z trùng đúng timestamp
  dòng `t10-round140 RELEASED hold_s=121` trong log lock.
- Bối cảnh để T2 cân nhắc: T10-140 ghi kiểm cuối 19:47:27Z
  boot vẫn 90392aa5 (`t10-closing-checks.txt` — mốc quan
  sát muộn hơn mốc cuối merged 40 s, nhưng là mốc kiểm
  trong nội dung file đóng sổ, không phải file mtime nên
  merged không bắt được); đoạn B merged dài 7.276 s, lỗ
  lớn nhất 445 s (19:46:47Z → 19:54:12Z), floor(445/1147)
  = 0, max_hidden=0. **T6 không tự chốt khung #98?** —
  giao T2-141 + parent.
- Gap danh nghĩa #98?→#99? = **7.276 s (2h01'16")** — nằm
  trong dải chứng nhận. Chứng nhận **[7.266 s, 7.286 s]
  NẾU đoạn B mù #60 đóng** (prereg T2-141 §1 — T2 sẽ báo
  rõ, parent quyết có nhận gap thứ hai hay không; brief
  T2-141 chỉ giao gap #97?→#98?).
- Đoạn C merged (59 mốc, lỗ lớn nhất 1.849 s — 20:05:23Z →
  20:36:12Z, khoảng yên giữa hai đợt) cho floor(1849/1147)
  = 1, max_hidden=1 theo luật lỗ — nhưng đoạn C đóng bằng
  uptime trực tiếp (boot 2c0efe57 đo trực tiếp từ btime
  19:54:12Z tới nay, boot_id/btime không đổi); verdict cuối
  thuộc T2-141. T6 chỉ ghi số merged, không tự chứng nhận.

### 8.7 #98? + #99? INSIDE dải — chuỗi INSIDE theo dải cơ học kéo dài thành 6 lần liên tiếp

- Dải cho #98? theo T2-140 (p10–p90 FULL73, neo tại btime
  #97? 15:54:37Z): **[16:22:37Z, 18:20:05Z]** (biến thể
  FULL73; dải chuẩn FULL72 [16:22:31Z, 18:20:15Z]). Thực tế
  btime #98? **17:52:56Z — NẰM TRONG cả hai dải**.
- Dải cho #99? (FULL73, neo tại btime #98? 17:52:56Z,
  p10 0h28'01" = 1.681 s, p90 2h25'29" = 8.729 s — T2-141
  prereg §2): **[18:20:57Z, 20:18:25Z]**. Thực tế btime
  #99? **19:54:12Z — NẰM TRONG dải**. Dải CERT58 neo tại
  #98?: [18:20:17Z, 20:10:36Z] — 19:54:12Z cũng NẰM TRONG.
- Theo dải chuẩn (quyết parent (f) đợt 138 — dải T2 FULL70
  neo tại #94?): #96? đã OUTSIDE (muộn hơn cận trên 6.705 s)
  nên chuỗi INSIDE theo dải chuẩn đứt ở #96?; nhưng theo
  dải cơ học (neo tại boot ngay trước), #96? INSIDE, #97?
  INSIDE, #98? INSIDE, #99? INSIDE — **chuỗi INSIDE theo
  dải cơ học kéo dài thành 6 lần liên tiếp (#94?, #95?,
  #96?, #97?, #98?, #99?)**. T6 báo cả hai cách đọc như mọi
  đợt; dải chuẩn cho #100? là dải T2 (FULL73, nay chờ
  FULL74/75 sau chứng nhận đợt này) theo quyết parent (j)
  đợt 140 — xem §8.8.
- Tốc độ reboot tới #99?: 99 / 191,60 h = **1 mỗi 116,1
  phút** (tới #98?: 98 / 189,58 h = 1 mỗi 116,1 phút —
  chênh 0,0 phút/boot, trong nhiễu). Không có thay đổi
  chế độ. (Tính bằng code: từ #1 2026-11-10T20:18:10Z tới
  #99? 2026-11-18T19:54:12Z = 191,60 h.) Cộng dồn ẩn tối
  đa: +4 (mù #29/#30/#31) → 1 mỗi 111,6 phút; +3 nữa
  (mù #53 đoạn B) → 1 mỗi 108,5 phút; +2 nữa (mù #55 đoạn
  B quy ước) → 1 mỗi 106,4 phút; +1 nữa (mù #56 đoạn A quy
  ước) → 1 mỗi 105,5 phút; **+0 nữa (mù #57 ĐÓNG + mù #58
  ĐÓNG + mù #59 ĐÓNG, tối đa 0)** → 109 / 191,60 h = 1 mỗi
  105,5 phút.

### 8.8 Dải dự báo cho boot #100? (T6 tính độc lập — chờ T2-141 công bố FULL74/75)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 / T6-138 §8.6 /
T6-139 §8.6 / T6-140 §8.6 — p10–p90 của phân phối FULL73
(p10 = 1.681 s, p90 = 8.729 s; T2-140 §2.5), cộng vào btime
#99? 19:54:12Z. **T6 dùng FULL73** theo quyết parent (j)
đợt 140 (CERT 58 / FULL 73 đã xác nhận — phân phối hiện
hành cho tới khi T2-141 chứng nhận thêm gap).

- **Dải dự báo T6 cho #100? (FULL73): [20:22:13Z,
  22:19:41Z]** (19:54:12Z + 1.681 s = 20:22:13Z;
  19:54:12Z + 8.729 s = 22:19:41Z). Tính bằng code
  (python3), không nhẩm. Biến thể CERT58: [20:21:33Z,
  22:11:52Z] (p10 1.641 s, p90 8.260 s).
- **Đối chiếu với T2: CHƯA CÓ để đối chiếu.** T2-141 prereg
  §2 ghi rõ: "Dải chuẩn cho #100?: chờ FULL74/75 sau khi
  chứng nhận gap ở đợt này (T2-141 tính lại sau khi chứng
  nhận…)". Nếu T2-141 chứng nhận gap #97?→#98? (CERT 59 /
  FULL 74) và/hoặc gap #98?→#99? (CERT 60 / FULL 75) thì
  p10/p90 có thể dịch vài giây như tiền lệ đợt 138/139/140
  — dải trên đây là dải FULL73, T2 là chủ quản dải chuẩn.
  Dải hiệu dụng sau probe #60 (xong ~20:45Z): [20:45Z,
  22:19:41Z] (cận dưới thực tế là thời điểm probe #60 xác
  nhận boot #99? còn sống).
- Lưu ý: cận dưới dải #100? (20:22:13Z) đã qua lúc T6 đóng
  (20:51Z) mà chưa có reboot — điều đó bình thường (dải
  p10–p90 chỉ bao 80% khối lượng, không phải cam kết).

### 8.9 VERDICT: chuỗi tương đối CHỐT #57→#99? — số tuyệt đối VẪN TẠM (giữ "?"); #98?/#99? chờ merged mù #60

- **CHỐT ĐƯỢC — chuỗi tương đối:** 39 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #99? (19:54:12Z 18/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→…→#97→#98
  →#99 đều có ≥2 nguồn độc lập xác nhận (T5 + T2 + T6 +
  T9 + T10 + file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-141 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #97?→#98? lần này CÓ dị
    thường mới kiểu đó — F-140-T4-1, ~30 s, §8.5 — và quan
    sát mới của T6 (17:53:28Z) đẩy lệch lên ~32 s — nhưng
    một lần có dị thường không xóa tiền lệ, mà củng cố nó.)
  - **Mù #57 + mù #58 + mù #59 ĐÃ ĐÓNG HOÀN TOÀN
    (T2-138, T2-139, T2-140):** số #94?/#95?/#96?/#97?
    nay đã xác nhận theo quy ước (không còn reboot ẩn giữa
    #93?→#94?→#95?→#96?→#97?); mù #56 A vẫn MỞ theo quyết
    parent (e) — số #93? vẫn mang tính quy ước headline.
  - **MỚI — mù #60 CHƯA ĐÓNG lúc T6 đóng:** T2-141 đã chạy
    probe #60 (ok=2 fail=0, boot 2c0efe57) và đã tính xong
    merged (`blind60-merged.log`: A 53 mốc/lỗ lớn nhất 79 s/
    max_hidden 0; B 174 mốc/lỗ lớn nhất 445 s/max_hidden 0;
    C 59 mốc/lỗ lớn nhất 1.849 s/max_hidden 1 theo luật lỗ)
    nhưng chưa công bố LIMITS/.done lúc 20:51Z. Số #98?/
    #99? là TẠM THỜI cho tới khi T2 đóng merged — nếu đoạn
    A+B đóng (tối đa 0 ẩn) thì 90392aa5 CHÍNH LÀ #98? và
    2c0efe57 CHÍNH LÀ #99? (theo quy ước); nếu A hoặc B MỞ
    thì số có thể cao hơn. T6-141 chốt chuỗi TƯƠNG ĐỐI
    (2c0efe57 là boot quan sát được tiếp theo sau 90392aa5,
    không có boot quan sát được nào ở giữa) — số thứ tự
    tuyệt đối #98?/#99? chờ verdict của T2-141.
    **Ghi rõ "chờ T2" theo brief; T10 gộp.**
- **Kết luận cho parent:** T6-141 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 2 boot (#98? — reboot #22 giữa lượt
  140; #99? — reboot #23 trong lúc đóng sổ đợt 140); số
  thứ tự tuyệt đối **vẫn TẠM** và phải giữ "?" cho tới khi
  có bằng chứng ngoài VM (và, riêng #98?/#99?, tới khi mù
  #60 đóng). Không bịa số, không bỏ "?" khi chưa đủ bằng
  chứng — đúng như brief giao.
- Hệ quả thực hành: T9-141 gọi boot lúc mở là "#99?"
  trong LIMITS của mình là đúng quy ước tạm; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #22 cho reboot #97?→#98?, sự kiện #23 cho reboot
  #98?→#99? — theo T10-140, parent đã chấp nhận). Các quyết
  parent trước vẫn đứng: không quyết con số tuyệt đối nào
  ở đây.

### 8.10 Reboot #98?→#99? — không mất việc của luồng T6; T6 không bị cắt

- Reboot 90392aa5 → 2c0efe57 (btime 19:54:12Z) xảy ra sau
  kiểm cuối của T10-140 (19:47:27Z), trước cờ .done
  19:57:15Z — **không giết attempt hay holder lock nào
  của đợt 141** (đợt 141 mở sau đó, 20:35:51Z, trên boot
  mới). T10-140 đóng sổ xong trên boot mới (suite/O8 chạy
  xong TRƯỚC reboot, 19:39–19:46Z, boot 90392aa5).
- **Không luồng đợt 141 nào mất việc trong phiên T6:**
  T6 mở 20:44:49Z và đóng 20:49:08Z toàn bộ trên boot mới,
  không bị reboot cắt (uptime liền mạch 50'37" → 54'56');
  T4-141 acquire + release sạch trong phiên (§2, §4).
- **Replay apt sau boot #99?: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-141 là chủ
  quản verdict replay / cờ POSTBOOT_PASS boot mới; T2-141
  đã đọc độc lập 1.545 dòng (xem §8.0).
- **/tmp đã bị reboot xóa sạch (từ đợt 140):** thư mục
  cut-sim của T6-135 đã biến mất theo reboot #94? (T6-137
  đã ghi); các TDIR suite `/tmp/vcut-lock-v2-test.*/` tự
  dọn bằng trap; TDIR repro của T6 đợt này đã dọn sạch
  sau khi xong (bản fixed in "TDIR cleaned").

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **20:44:49Z** (boot #99? đã 50'37"
  tuổi); đóng **20:49:08Z** (boot #99? đã ~54'56" tuổi).
  Đợt 141 mở **20:35:51Z** (round-in-progress.md) — tức
  **2.499 s sau btime boot #99? (19:54:12Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — giả thuyết
  "scheduler ghi lại started_at khi hồi phục sau reboot"
  ĐÃ ĐƯỢC XÁC NHẬN đợt 134 (lần thứ 5 liên tiếp, +6.967
  s, = btime + 40 s), tái diễn đợt 135 (lần thứ 6, +36 s),
  đợt 136 (lần thứ 7), đợt 137 (lần thứ 8 — bằng chứng
  trực tiếp ĐẦU TIÊN, started_at = btime + 46 s), đợt 138
  (lần thứ 9, btime + 50 s) và đợt 140 (lần thứ 10 —
  T10-140: started_at lượt 140 nay 17:53:45Z = btime
  90392aa5 + 49 s, "BỊ VIẾT LẠI lần thứ tư trực tiếp quan
  sát được").
- **T6 đợt này chỉ ghi mốc, không kết luận:** T7-141 là
  chủ quản kiểm slot/started_at. Ghi nhận để T7/T10 đối
  chiếu: đợt 141 mở 2.499 s sau btime #99?; nếu dị thường
  tái diễn thì started_at lượt này rơi vào khoảng
  19:54:5xZ, tức TRƯỚC khi đợt mở 20:35:51Z; nguyên nhân
  vẫn thuộc T7.

## 10. Dọn Xvfb: 0 Xvfb chạy; 1 socket sót X193 (+ /tmp/.X193-lock) — MỚI so với đợt 140

- **Lúc mở (20:44Z): 0 Xvfb đang chạy** (`pgrep -x Xvfb`
  rc=1; quét `ps-full-open.txt` không có process nào tên
  Xvfb).
- **Lúc đóng (20:49Z): 0 Xvfb đang chạy** (pgrep rc=1),
  quét `ps-full-close.txt` không có process nào tên Xvfb.
- **Socket sót: `/tmp/.X11-unix/X193` + `/tmp/.X193-lock`,
  mtime 20:42Z — tạo trong lúc T4-141 attempt1 chạy**
  (T4 acquire 20:42:48Z; display :193 xuất hiện trong log
  T4-141: `chain-t4.log`, `run-webkit-t4-attempt1.log`).
  Attempt1 xong 20:46:41Z, poller T4 đã thoát, nhưng socket
  + lock file vẫn còn lúc T6 đóng (20:49Z) mà không còn
  process Xvfb nào giữ. **T6 KHÔNG xóa** (không phải của
  mình; T6 không đụng process/file của luồng khác theo
  nhiệm vụ) — để T4/T10 xác nhận và dọn. T8-141 dùng Xvfb
  riêng :199 (tự kill + tự unlink socket khi xong —
  `run-webkit-141t8.sh` dòng 8/40–46) nên X193 không phải
  của T8.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-141; T2-141
  boot-verify ghi MemAvailable 1.112.988 kB lúc 20:44:36Z —
  trên gate A 1.024 MB — số RAM thuộc T2, T6 chỉ ghi bối
  cảnh; phù hợp với gate A của T4-141 đạt lúc 20:42:47Z,
  RAM 1.485 MB).

## 11. Tuân thủ lock của luồng đo đợt 140 ĐÃ kiểm được + đợt 141 tới nay

- **T4-140 acquire + release sạch ×1 bổ sung** (17:48:00Z →
  17:53:28Z hold 328 s — attempt1 lượt yên #17 đợt 140,
  10/20 pass rồi bị reboot #22 giết; release qua trap
  SIGTERM lúc shutdown, xem §8.5). T4 dùng script repo
  (`run-attempt-140.sh` dòng 13, md5 `520b8baa`) — tức chạy
  trên **thứ tự ghi mới** (§3). Ticket khớp log (dòng
  1000–1002 thô).
- **T10-140 acquire + release sạch ×1** (19:44:46Z →
  19:46:47Z hold 121 s, port 5554, ticket khớp log — dòng
  1003–1005 thô). T10 dùng bản frozen
  `round140-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
  (kiểm trực tiếp đợt này) — tức chạy trên **thứ tự ghi
  mới** (§3).
- **T4-141 acquire + release sạch ×1** (20:42:48Z →
  20:46:14Z hold 206 s, port 5187, ticket khớp log — dòng
  1006–1008 thô; **attempt1 20/20 — XONG**,
  run-attempt exit=0 20:46:41Z; gate A đạt, RAM 1.485 MB
  lúc poll #2 20:42:47Z — **lượt yên #17 ĐO ĐƯỢC ở đợt
  141**, theo đúng kế hoạch quyết parent (b) đợt 140).
  T4 dùng script repo (`run-attempt-141.sh` dòng 13, md5
  `520b8baa`) — tức chạy trên **thứ tự ghi mới** (§3).
- **Tổng kết đợt 140: 2/2 chu kỳ sạch, trên thứ tự ghi
  mới** — 34 chu kỳ liên tiếp sạch kể từ lúc T6-135 đóng
  (§3). **Đợt 141 tới 20:49Z: 1/1 chu kỳ sạch.**
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Đường dẫn đúng `apps/web/src/preview.tsx`
  (xem F-140-T6-1 đã sửa — đợt này dùng đúng ngay từ đầu).
- **Tuân thủ Xvfb luật đứng của đợt 137:** T4-141 attempt1
  để lại socket X193 + `/tmp/.X193-lock` sau khi xong
  (§10) — T6 ghi nhận, không tự dọn; T4/T10 xác nhận.
  T8-141 chưa chạy harness tới lúc T6 đóng.

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-141-T6-1 (mới, xem dưới).**
- **F-141-T6-1 — Không kiểm `/tmp/.X11-unix/` lúc mở
  (mới):** T6 kiểm socket Xvfb chỉ lúc đóng (20:49Z), không
  kiểm lúc mở (20:44Z). **Không ảnh hưởng kết luận:** socket
  X193 có mtime 20:42Z (trước lúc T6 mở 2'49") nên chắc chắn
  đã tồn tại lúc mở; `ps-full-open.txt` đã xác nhận 0
  process Xvfb lúc mở. Bài học: kiểm `/tmp/.X11-unix/`
  cả lúc mở lẫn lúc đóng như T6-140 đã làm — các đợt sau
  kiểm đủ hai lần.
- **Số hiệu boot mới (#98?/#99?) VẪN TẠM (xem §8.9):**
  chuỗi tương đối #57→#99? đã chốt (39 boot); số tuyệt đối
  giữ "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối
  đa 6, mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới
  #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51
  đoạn B mở, tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng
  không làm neo được; (e) dị thường đồng hồ #84?→#85?
  (§8.4(b) đợt 134) + dị thường mới F-140-T4-1 (~30 s,
  §8.5) và quan sát mới của T6 đẩy lệch lên ~32 s;
  **(f) MỚI: mù #60 chưa đóng — số #98?/#99? chờ verdict
  T2-141; mù #56 A vẫn MỞ (quyết parent (e)) — số #93?
  cũng vẫn quy ước headline**.
  Journal/wtmp chỉ giữ boot hiện tại (journal `--list-boots`
  chỉ 1 dòng 2c0efe57; wtmp bắt đầu 19:54:23Z) nên T6 suy
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
  parent (j) đợt 140) + mù #60 MỚI MỞ (T2-141 đang điều
  tra; probe #60 xong ok=2 fail=0, merged đã tính xong
  nhưng LIMITS/.done chưa có lúc T6 đóng); mù #52 đã đóng
  hoàn toàn (T2-133); mù #54 đã đóng hoàn toàn (T2-135).
- **F-140-T6-1 (cũ, nhắc lại):** T6-140 thử đọc preview.tsx
  bằng đường dẫn sai (`apps/web/src/editor/preview.tsx`).
  T6 đợt này dùng đúng đường dẫn `apps/web/src/preview.tsx`
  ngay từ đầu, md5 `530e10a7` khớp — không lặp lại.
- **F-139-T6-1 (cũ, nhắc lại):** T6-139 gọi `status` với
  `VITE_LOCK_DIR` sai lúc mở. T6 đợt này đã gọi status
  ĐÚNG ngay từ đầu (không override) — không lặp lại.
- **F-136-T6-1 (cũ, nhắc lại):** T1-135 viết sai nhãn boot.
  Không lặp lại ở đợt này: T6-141 ghi đúng boot sống
  2c0efe57 (khớp T2-141 boot-verify + probe #60 +
  T10-140 closing-checks).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn; tổng 17 không đổi. T6-141 đã đếm lại đúng (§5:
  trích dẫn = 0 — các file `.done` của T6 viết không dấu
  nên không khớp pattern có dấu; đã giải thích phương pháp
  ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  bảy liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round139-t*/` (toàn đợt) +
  `round140-t*/` (toàn đợt) + `round141-t*/` tới 20:49Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T8/T10-141 chưa chạy xong tới thời điểm đếm; T6
  đợt 142 đếm tiếp.
- **Prune cooldown lần 16 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 90 ≤ trần 100 lúc chạy). File
  cũ nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z,
  theo `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 140 khép sạch trên lock (§4):** 2 chu kỳ (t4-140 +
  t10-140) sạch — T6 đợt này đếm bổ sung 2 chu kỳ sau khi
  T6-140 đóng, khớp đúng recount T10-140; **đợt 141 tới
  20:49Z có 1 chu kỳ** (t4-141, hold 206 s, attempt1 20/20).
  Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 20:49Z (trống, 0 ticket + 90 cooldown); đợt
  còn chạy tới ~23:00Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–140 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 34 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt #99? chưa có verdict** (thuộc T5-141 — xem
  §8.10; T2-141 đã đọc độc lập 1.545 dòng, lần ghi cuối
  19:58:09Z).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- **T2-141 CHƯA XONG lúc T6 đóng (20:51Z):** probe #60 xong
  (ok=2 fail=0) và merged đã tính xong
  (`blind60-merged.log`: A 53 mốc/lỗ 79 s/max_hidden 0; B
  174 mốc/lỗ 445 s/max_hidden 0; C 59 mốc/lỗ 1.849 s/
  max_hidden 1) nhưng LIMITS + .done chưa có. Theo brief,
  T6 ghi rõ "chờ T2" và để T10 gộp — KHÔNG tự suy đoán số
  boot #98?/#99?, không tự chứng nhận gap #97?→#98? /
  #98?→#99?, không tự chốt khung chết #97?/#98? cuối cùng.
  T6 chỉ ghi thêm quan sát mới của mình (dòng RELEASED
  17:53:28Z, §8.5) để T2-141 cân nhắc.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND141_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t4` do release hợp lệ của t4-141,
`cooldown-t10-round140` do release hợp lệ của t10-140 —
xem §3), Xvfb (0 process; 1 socket sót X193 + lock file
— T6 không xóa, để T4/T10 xử lý).
Stage: `repo-1-push/paths-loop/phase9-round141-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round141-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, boot-verify-open.txt,
analyze-log-cleaned-open.txt, vite-lock-v2-cleaned-open.log,
analyze-log-cleaned-close.txt, vite-lock-v2-cleaned-close.log,
vite-lock-v2-raw-open.log, vite-lock-v2-raw-close.log,
analyze-log.py, cooldown-now-open.txt, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg-fixed.sh, repro-newmsg-fixed141.sh,
repro-newmsg.log).
