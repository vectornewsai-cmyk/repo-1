# PHASE9 ROUND133 T6 — Sức khỏe lock v2 + prune cooldown lần 8 + CHỐT SỐ BOOT #82?/#83? (chuỗi tương đối CHỐT #57→#83, số tuyệt đối VẪN TẠM; mù #52 ĐÓNG HOÀN TOÀN) — LIMITS

- Đợt: 133, luồng T6 (sức khỏe lock v2 + prune cooldown + chốt số
  boot + mù #37/#49/#51/#52).
  Lượt cron 03:35 +07 18/11/2026. Chạy 20:39–21:47Z 17/11/2026
  (03:39–04:47 +07 18/11).
- Nhiệm vụ: kiểm lock vite sau boot #82? theo đúng phương pháp
  chính thức; prune cooldown lần 8 theo luật đã phê duyệt; ĐẾM LẠI
  chuỗi boot từ mù #37 và chốt số thứ tự cho #82?/boot mới (quyết
  parent LIMITS gộp đợt 131 §12.3(h) + đợt 132 §12.3); ghi rõ trạng
  thái mù #37 (ngày đúng 15/11 — F-131-T6-1) + verdict mù #51
  (T2-133 recheck3) + mù #52 (T2-133, mới). KHÔNG sửa logic lock,
  KHÔNG sửa script lock, KHÔNG đụng production. Mọi thí nghiệm
  acquire/release chạy trên lock dir /tmp riêng với đúng biến môi
  trường (VITE_LOCK_DIR / VITE_LOCK_QUEUE_DIR / VITE_LOCK_LOG);
  lock thật chỉ đọc qua `status` — ngoại trừ thao tác prune file
  cooldown đã phê duyệt. **Không lặp lại sự cố F-132-T6-1** (xem
  §6 — repro lần này chạy đúng trên /tmp, log thật không đổi).
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round133-t6/` (analyze-log.py,
  analyze-log-cleaned.txt, analyze-log-raw-856.txt,
  analyze-log-cleaned-close.txt, analyze-log-raw-870.txt,
  vite-lock-v2-cleaned-850.log, vite-lock-v2-cleaned-864.log,
  new-lines-since-847.txt, new-lines-since-856.txt,
  cooldown-now.txt, prune-candidates.txt, prune-deleted.txt,
  ps-full-open.txt, ps-full-close.txt, ss-open.txt, ss-close.txt,
  khong-nha-grep.txt, khong-nha-grep-close.txt,
  test-v2-t6-run1.log, test-v2-t6-run2.log,
  repro-newmsg-fixed.sh, repro-newmsg.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.

## 0. Trạng thái lúc bắt đầu — BOOT #82? (số tạm, xem §8)

- **Boot lúc mở: boot_id `07da9c50-5836-4481-a4a4-7e22c6260325`,
  btime 19:34:15Z** (`uptime -s` = 19:34:15Z, `who -b` =
  Nov 17 19:34, `/proc/1` 19:34:15Z, `journal --list-boots`
  chỉ 1 dòng 07da9c50). Uptime ~1h05' lúc T6 bắt đầu
  (20:39Z).
- Khớp brief mở đợt 133 + round-in-progress.md (cả hai đều
  ghi cùng boot_id + btime). Đây là boot mới sau **reboot
  giữa lượt lần thứ sáu liên tiếp** của đợt 132
  (b379ecd7 → 07da9c50, btime 19:34:15Z).
- md5 khớp baseline đợt 120–132: v2 `cd0c05c1` (script live
  `apps/web/scripts/vcut-vite-lock-v2.sh`), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 133 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round133-t1…t10; T9 đang đo RAM snapshot lúc
  20:40Z — chỉ thấy bash/sleep của T9, không phải vite).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật — 0 cổng lạ (lúc mở và lúc đóng)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 20:42Z
  (mở, `ps-full-open.txt`) và lúc 21:42Z (đóng,
  `ps-full-close.txt`, sau reboot #83?).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: lúc mở và lúc đóng **không có cổng TCP nào
  đang lắng nghe** (chỉ dòng header).
- **0 tiến trình vite/node/webkit/chromium thật** ở cả 2
  snapshot. Snapshot đóng chỉ thấy systemd/journal/hatch
  daemon/execd + **replay apt sau boot mới** (`apt-get
  update` + methods http/https/gpgv/store — replay os-intent
  của host sau reboot, thuộc T5, không phải tiến trình đợt
  133) + chính shell của T6.
- **Không có tiến trình nào của đợt 133 còn sống sau reboot**
  (tất cả 8 cờ `.done` đã có trước reboot — xem §8.6).

## 2. Lock lúc mở và lúc đóng: TRỐNG cả hai lần; holder cuối đợt 132 đã nhả sạch trước khi đợt 133 mở

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 20:39Z (mở) và lúc 21:42Z (đóng, sau reboot #83?) —
  không có file owner stale nào, không cần dọn lock stale.
- Lý do không có stale lúc mở: sự kiện lock cuối cùng của
  đợt 132, `t10-round132` RELEASED hold 105s lúc
  **20:22:35Z**, tức **12' trước khi đợt 133 mở (20:35Z)**
  và 1h11' trước khi T6 bắt đầu. Lock đã trống sẵn khi đợt
  133 mở — không phải do reboot dọn (cùng mẫu như các boot
  #60/#62/#64/#66/#68/#71/#72/#74/#75/#76/#77/#78/#79/#80/
  #81 ở các đợt trước).
- Lý do không có stale lúc đóng: sự kiện lock cuối cùng của
  đợt 133, `t8-round133` RELEASED hold 230s lúc **21:23:09Z**,
  tức **18'31" TRƯỚC reboot #83? (21:41:40Z)**. Lock đã
  trống sẵn khi reboot xảy ra — reboot lần này KHÔNG giết
  holder nào (khác đợt 129: t8-round129 mất acquire theo
  reboot, đã dọn đúng luật).
- `status` lúc mở 20:45Z và lúc đóng 21:44Z: `TRỐNG (không
  có lock)`, `0 ticket + 76 cooldown` (mở) / `0 ticket +
  77 cooldown` (đóng — +1 file `cooldown-t8-round133`),
  rc=0 cả hai lần.
- Khoảng yên trước đợt: **không có event lock nào từ
  20:22:35Z (t10-round132 release) tới 20:50:45Z (t4
  acquire)** — 28'10" yên giữa hai đợt; yên lặng này là do
  đợt 132 đã đóng và T4-133 đang chờ gate A (cơ chế chờ RAM
  mới) — không phải do lock kẹt (bằng chứng: suite /tmp §6
  chạy xanh trên bản script hiện hành + T4 sau đó acquire
  thành công ngay khi gate mở).

## 3. Chu kỳ lock của đợt 133: 4 chu kỳ mới — TẤT CẢ nhả sạch, T4 lượt yên #10 ĐO ĐƯỢC (cơ chế chờ RAM hoạt động)

Từ sau snapshot T6 đợt 132 (847 dòng chính thức lúc 17:45Z
17/11) tới lúc đóng T6 đợt 133 (864 dòng chính thức lúc
21:43Z — xem §4 về 6 dòng repro lỗi F-132-T6-1): **+17 dòng
= TICKET +5 / ACQUIRED +5 / RELEASED +5 / COOLDOWN +2 /
TIMEOUT +0 / STALE-LOCK +0 / STALE-TICKET +0.** Khớp từng
con số, không có event nào mất dấu hay thêm lạ. (Chi tiết
từng dòng trong `round133-t6/new-lines-since-847.txt` +
`new-lines-since-856.txt`.)

- **`t10-round132` (T10 đóng đợt 132, sau khi T6-132 đóng):
  1 chu kỳ sạch** — 20:20:50–20:22:35Z, hold 105s, cổng
  5554, wait 0s (suite O8 Chromium 21/21 + WebKit 21/21).
  +1 file `cooldown-t10-round132`. Đây là chu kỳ cuối của
  đợt 132 — đợt 132 khép lại sạch trên lock (xem §4).
- **`t4` (T4 lượt yên WebKit #10, đợt 133): 1 chu kỳ sạch**
  — 20:50:45–20:54:11Z, hold 206s, cổng 5187, wait 0s.
  Đây là attempt1 của lượt yên #10: **gate A mở ở poll #3
  20:50:45Z khi RAM đạt 1.168 MB** (cơ chế chờ RAM theo
  quyết parent đợt 132 §12.3(a) — lần đầu tiên hoạt động
  thành công sau khi đợt 132 kẹt 75 poll). T4 `.done`
  21:10Z: 1 attempt, 20/20 pass, median 39,5 ms, ngưỡng
  GIỮ, (c2)=5, F6 tái xác nhận ĐÓNG, log draw 0/5. +1 file
  `cooldown-t4`. Thời điểm ACQUIRED trong log (20:50:45Z)
  khớp đúng từng giây với poll gate A mở của T4 — bằng
  chứng live độc lập rằng cơ chế chờ RAM + lock v2 phối
  hợp đúng.
- **`t8-round133` (T8 vite harness, đợt 133): 3 chu kỳ
  sạch** — 21:15:33–21:16:38Z hold 65s (cổng 5390, wait
  0s); 21:16:53–21:19:03Z hold 129s (cổng 5490, wait 15s,
  +1 COOLDOWN 14943ms); 21:19:18–21:23:09Z hold 230s (cổng
  5490, wait 16s, +1 COOLDOWN 14944ms). T8 `.done` 21:27Z:
  3/3 exit 0, harness 21:15:30–21:23:09Z (khớp log từng
  giây). +1 file `cooldown-t8-round133` (tái dùng cho cả 2
  COOLDOWN nên +0 file net cho chu kỳ 2–3).
- **Đợt 133 khép lại sạch trên lock (tới lúc T6 đóng
  21:44Z): 4 chu kỳ của chính luồng đợt 133 (t4×1 +
  t8×3) đều TICKET = ACQUIRED = RELEASED, 0 TIMEOUT,
  0 STALE-LOCK.** Các luồng đợt 133 còn lại (t1/t2/t3/t5/
  t7/t9) không có event lock thật nào trong cả đợt — tức
  không dùng lock thật (không phải vi phạm, chỉ là không
  dùng). T10-133 chưa spawn lúc T6 đóng (thư mục
  `round133-t10/` còn trống 21:44Z) — **T10 đóng đợt sẽ
  recount lại lúc đóng** (như đợt 124–132 T10 đã đếm lúc
  đóng); chu kỳ O8 của T10 (nếu có) thuộc đợt 133 nhưng
  nằm sau thời điểm đếm của T6.

## 4. Nhất quán log lock: 864 dòng chính thức, 250/250 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~21:43Z
(14/11 18:01:32Z → 17/11 21:23:09Z; script ghép cặp
`round133-t6/analyze-log.py` — tái dùng từ round130–132):

| Sự kiện | Tổng chính thức | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|
| TICKET | 264 | 173 | 167 |
| ACQUIRED | 255 | 173 | 167 |
| RELEASED | 250 | 172 | 166 |
| COOLDOWN | 80 | 72 | 67 |
| TIMEOUT | 8 | **0** | 0 |
| STALE-LOCK | 6 | **1** | 1 |
| STALE-TICKET | 1 | **0** | 0 |
| **Tổng dòng** | **864** | **591** | **568** |

- So với snapshot T6 đợt 132 (847 dòng lúc ~17:45Z 17/11):
  +17 dòng, đúng bằng TICKET +5 / ACQUIRED +5 / RELEASED
  +5 / COOLDOWN +2 / TIMEOUT +0 / STALE-LOCK +0 — khớp
  từng con số, không có event nào mất dấu hay thêm lạ.
  (Lưu ý đếm: `grep -c TICKET` thô đếm 265 vì khớp cả
  dòng STALE-TICKET; số chính thức 264 dùng khớp từ chính
  xác như script analyze-log.py.)
- Ghép cặp theo thread: **250 cặp ACQUIRED→RELEASED, 0 lock
  đang giữ ở cuối log, 0 lần RELEASED không có ACQUIRED trước
  đó.** Chênh ACQUIRED − RELEASED = 5, đúng bằng 5 ca
  "double-acquire" — không có lock nào mất dấu.
- 5 ca "double-acquire" — **cùng đúng 5 ca T6 đợt 131–132
  đã liệt kê** (s3-round116, t3-round117, t4, t3-round119,
  t8-round129 dòng 781), tất cả giải thích được bằng
  STALE-LOCK cướp sau reboot; **không có ca mới nào**.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11, t9 chờ 900s cổng 5581) — đợt 120+ có **0 TIMEOUT**;
  5 STALE-LOCK + 1 STALE-TICKET cũ toàn bộ từ trước đợt 120
  (lần cuối 01:04:20–21Z 16/11) + **1 STALE-LOCK 09:04:38Z
  17/11 do reboot #75→#76 giữa lượt** (§3 đợt 130).
- Round 120/121/122/123/124/125/126/127/128/129/130/131/132
  khép lại sạch trên lock (đợt 129 với caveat 1 acquire mất
  theo reboot đã dọn đúng luật — T6-130 §3; đợt 130, 131,
  132 sạch hẳn — xem §3 trên; đợt 133 tới 21:44Z cũng
  sạch hẳn). Cửa sổ R120: **173 = 173 T/A, RELEASED 172**
  (chênh 1 đúng bằng ca reboot-kill), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  264+255+250+80+8+6+1 = 864 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**
  trong log. **0 dòng chứa DEFER / KILLED / ERROR** trong
  toàn log (grep -i).
- **Về 6 dòng repro lỗi (F-132-T6-1, §6 đợt 132):** file log
  thật hiện có **870 dòng** (6 dòng tA/tH lúc 17:43:46Z do
  repro lỗi của T6-132 ghi vào). Số liệu bảng trên là số
  **chính thức, đã loại 6 dòng đó** (bản sao đã lọc
  `vite-lock-v2-cleaned-864.log`, 864 dòng; phân tích
  `analyze-log-cleaned-close.txt`). Bản phân tích thô trên
  file 870 dòng (`analyze-log-raw-870.txt`) cũng được lưu
  để đối chiếu: TICKET 266 / ACQUIRED 257 / RELEASED 252 /
  tổng 870 — chênh đúng +2/+2/+2, cặp 252, vẫn 0 đang giữ,
  0 mất dấu. **Chuỗi保管:** 847 dòng đầu của bản đã lọc
  đợt này có md5 `9048174e…` — khớp đúng bản snapshot đã
  lọc của T6-132 (`vite-lock-v2-cleaned-847.log`). T6 đợt
  134 dùng số chính thức 864 làm snapshot; 6 dòng tA/tH
  dòng 848–853 là của T6-132, không phải của luồng sản
  xuất.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 131 (toàn đợt), đợt 132 (toàn đợt) và đợt 133 (tới 21:44Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round131-t*/` + `round132-t*/` + `round133-t*/`
(tới 21:44Z) — theo quy tắc lăn: bỏ round130 (T6-132 đã
đóng toàn đợt 130), thêm round133. Tổng **8 dòng khớp
chuẩn, phân loại đủ 8/8 — tất cả đều là bản sao script,
0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 8 | 4 file × 2 dòng: `round131-t4/vcut-vite-lock-v2.frozen.sh`, `round131-t10/vcut-vite-lock-v2.t10.sh`, `round132-t4/vcut-vite-lock-v2.frozen.sh`, `round132-t10/vcut-vite-lock-v2.t10.sh` — mỗi file 2 dòng `echo` (dòng 421 `BỎ QUA release thừa`, dòng 423 `KHÔNG NHẢ`) |
| File grep-output của các T6 trước | 0 trong đếm chuẩn | Grep thô trả 32 dòng; 18 dòng nằm trong `khong-nha-grep.txt` của T6-131 (10 dòng) và T6-132 (8 dòng) — chỉ là tiếng vọng của các lần grep trước, đã loại khỏi đếm chuẩn như mọi đợt |
| Tái hiện có kiểm soát trên /tmp | 0 trong đếm chuẩn | `round131-t6/repro-newmsg.log` + `round132-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt; repro của T6-133 (`round133-t6/repro-newmsg.log`) cũng 3 dòng tương tự trên /tmp (xem §6) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 131 (toàn đợt) / 132 (toàn đợt) / 133 nào |
| Round133-t* | 0 dòng | T4/T10-133 chưa copy script vào thư mục của mình tới 21:44Z (T10 chưa spawn); không có driver log nào của đợt 133 khớp chuỗi |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0 (toàn
  đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn đợt),
  đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt), đợt 132
  = 0 (toàn đợt), đợt 133 tới 21:44Z = 0.** Khớp với log
  pairing sạch ở §4 (250/250 cặp, 0 TIMEOUT, STALE-LOCK
  mới duy nhất do reboot — không liên quan nhánh release).
- Giới hạn phạm vi: T10-133 chưa chạy tới 21:44Z — nếu có
  sự kiện mới sau thời điểm đếm thì thuộc đợt 133, T6 đợt
  134 đếm tiếp. T6 không quét toàn cây hidden_files (lý do
  như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-132 đếm 8 dòng trên 4 file
  (round130-t4/t10, round131-t4/t10); đợt này bỏ round130
  (−4 dòng) nhưng thêm round132-t4/t10 (+4 dòng) → vẫn 8
  dòng trên 4 file (round131-t4/t10, round132-t4/t10) ✓.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
#82? (`07da9c50…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round133-t6/test-v2-t6-run1.log` 20:43:18–39Z,
  `test-v2-t6-run2.log` 20:43:39–44:01Z):
  - **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều
    PASS=9 FAIL=0) — lần thứ chín liên tiếp không có lần T7
    flaky ở lần chạy đầu (đợt 125, 126, 127, 128, 129, 130,
    131, 132 cũng vậy). Tính flaky của T7 (T9 đợt 119 §1.2)
    vẫn được ghi nhận là bản chất — chín lần xanh kép không
    xóa nó; quyết tách T7 khỏi gate 9/9 khi đợt đông vẫn
    thuộc về parent; T6 không tự đổi test.
  - Kết luận suite: xanh lần thứ mười lăm liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt
    123 + T6 đợt 124 + T6 đợt 125 + T6 đợt 126 + T6 đợt
    127 + T6 đợt 128 + T6 đợt 129 + T6 đợt 130 + T6 đợt
    131 + T6 đợt 132 + T6 đợt 133).
- **Repro message ĐÚNG (`round133-t6/repro-newmsg.log`,
  20:44:10–11Z)** — copy verbatim script của T6-132, chỉ
  đổi tên TDIR (`vcut-t6r132-repro` → `vcut-t6r133-repro`)
  theo bài học F-132-T6-1; biến môi trường đúng
  (`VITE_LOCK_DIR` / `VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG`
  trỏ /tmp). Cùng 3 thí nghiệm A/B/C như T9 đợt 120 và T6
  đợt 121–132, kết quả giống hệt:
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
    lúc đó có 76 cooldown; log thật vẫn 856 dòng và queue vẫn
    76 file sau khi repro xong; không có file `cooldown-tA/
    tH/tB` nào xuất hiện trong queue thật. **F-132-T6-1 KHÔNG
    lặp lại.**
  - Kết luận: **fix text đợt 120 không đổi hành vi; guard còn
    nguyên; thông báo mới phân biệt rõ 2 trường hợp.**
- Bằng chứng lock thật đang chạy tốt trên bản `cd0c05c1`:
  **5/5 chu kỳ acquire/release thật sau snapshot T6 đợt 132
  đều sạch (§3)** — đây là bằng chứng live (không phải chỉ
  suite /tmp) rằng lock v2 hoạt động đúng qua boot #82? và
  trống sạch sang boot mới #83?.
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng (kể cả sau reboot #83?), 0 zombie, 0 stale, queue 0
  ticket, log nhất quán (250/250 cặp + 0 đang giữ, 0 mất
  dấu — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy nhất do
  reboot giữa lượt (đã dọn đúng luật, đợt 130), 0 sự kiện
  "KHÔNG NHẢ" trên lock thật đợt 120–132 (toàn đợt) và đợt
  133 (tới 21:44Z), suite 9/9 độc lập ×2 lần chạy (T7 xanh
  cả hai lần), và T4 lượt yên #10 acquire/release sạch ngay
  khi gate A mở bằng cơ chế chờ RAM.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 8 liên tiếp)

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
  - 20:45Z: lock TRỐNG (`status` 0 ticket + 76 cooldown,
    rc=0) — đủ điều kiện (e). Quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng). Tổng 76 file ≤ trần mềm 100 nên điều (b) cũng
    không kích hoạt.
  - **Kết quả prune đợt 133: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Vì tập ứng viên rỗng nên không thực thi thao tác xóa
    nào (không có gì để xóa). Đây là kết quả đúng của luật
    — luật đã chạy, không phải luật chưa chạy. File cooldown
    cũ nhất sẽ đủ 7 ngày theo đồng hồ tường vào khoảng
    **21/11 18:38Z**; theo phương pháp `find -mtime +7`
    (≥192h) sẽ khớp ứng viên vào khoảng **22/11 18:38Z**.
    T6 các đợt sau đếm tiếp. Đây là lần thứ 8 liên tiếp
    prune xóa 0 file (đợt 126: 0; đợt 127: 0; đợt 128: 0;
    đợt 129: 0; đợt 130: 0; đợt 131: 0; đợt 132: 0; đợt
    133: 0).
  - Lưu ý: +1 file `cooldown-t8-round133` (21:23:09Z) và
    +1 file `cooldown-t4` (20:54:11Z) trong lúc T6 chạy là
    **file cooldown mới do luồng đợt 133 tạo khi dùng lock
    thật theo đúng quy trình, KHÔNG phải do prune** (prune
    không tạo file, chỉ xóa). Số file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (20:45Z) **76 file / 1064 byte** (khớp
  cả ba cách đếm độc lập: `find` 76, `ls` 76, `status`
  "76 cooldown"; 76 × 14 = 1064 khớp; tổng kích thước file
  đo trực tiếp cũng 1064 B); lúc đóng (21:43Z) **77 file /
  1078 byte** (77 × 14 = 1078 khớp) — tăng đúng +1 file net: `cooldown-t8-round133` mới (T8 tạo lúc 21:16:38Z,
  mtime cập nhật 21:23:09Z ở lần release cuối); file `cooldown-t4` đã có
  trong queue từ trước (mtime cũ 14:55Z) được T4 tái dùng nên chỉ cập nhật
  mtime lên 20:54:11Z, +0 file net. Số học khớp: 76 + 1 = 77 ✓).
  Không file nào bị xóa giữa hai
  lần đếm.
- Phân tầng tuổi lúc 20:45Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 1 file** (tăng 0 → 1 so với đợt 132 —
  file cũ nhất `cooldown-r4-round115` vừa vượt 72h trong
  lúc đợt 133 chạy, đúng theo đồng hồ, không phải sai số);
  **≥48h (`-mtime +1`): 27 file** (giữ nguyên 27 như đợt
  131–132). File cũ nhất `cooldown-r4-round115`, mtime
  2026-11-14T18:38:25Z — lúc 20:45Z mới **~74h07' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#83; mù #52 ĐÓNG HOÀN TOÀN; số tuyệt đối VẪN TẠM

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NHẮC LẠI ĐÍNH CHÍNH NGÀY (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1): khoảng **11:39:50Z → 23:45:17Z ngày 15/11
  (12h05'27")**, **A+D đóng, B+C mở** (2 cửa sổ mở, tổng
  ~9h48'14"), **tối đa 29 reboot ẩn** (21 đoạn B + 8 đoạn
  C). Parent đã **chấp nhận để mở** (QUYẾT PARENT 7 đợt
  119) — T6 KHÔNG thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- **Nhắc lại F-131-T6-1 (đính chính ngày — nội dung khoảng
  mù không đổi): khoảng mù #37 là 15/11 11:39:50Z →
  23:45:17Z, KHÔNG phải 16/11.** Từ đợt 131 trở đi ghi đúng
  **15/11** — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #82? và #83?)

Phương pháp: như T6-131 §8.2 (mỗi boot liệt kê với boot_id +
btime lấy từ ≥1 nguồn độc lập; btime→btime danh nghĩa =
khoảng cách giữa hai btime liên tiếp). Số thứ tự là số tạm
theo thứ tự thời gian (tất cả đều mang "?") — xem verdict
§8.5. Bảng dưới chỉ ghi 6 boot cuối (chuỗi đầy đủ #57→#80
xem T6-131 §8.2 + T6-132 §8.2 — không chép lại để khỏi
drift; T6 đợt này đã đối chiếu lại: không có boot_id lạ nào
xuất hiện trong bất kỳ bằng chứng 17/11 nào ngoài chuỗi
này).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #78 | 57c3e5e2 | 13:02:41Z 17/11 | 2h06'10" (7.570 s) | T5b-130/T2-131 |
| #79 | f868abad | 14:26:41Z 17/11 | 1h24'00" (5.040 s, #78→#79) | T5-131/T2-131/T6-131 |
| #80 | ad1327ef | 15:01:30Z 17/11 | 34'49" (2.089 s, #79→#80); xem §8.3 | T5-131/T2-131/T10-131 |
| #81 | b379ecd7 | 17:24:08Z 17/11 | 2h22'38" (8.558 s, #80→#81); xem §8.4 | T6-132/T9-132/round-in-progress |
| #82 | 07da9c50 | 19:34:15Z 17/11 | 2h10'07" (7.807 s mid, #81→#82 — CERTIFIED interval, xem §8.3); đang sống tới 21:41:40Z | T10-132/T2-133/T6 này |
| #83 | 3e7a7b51 | 21:41:40Z 17/11 | 2h07'25" (7.645 s, #82→#83 — SPAN, xem §8.4); đang sống | T6 này |

- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77: HAI khung (quyết parent §12.3(f) đợt 130 — giữ
    nguyên, xem §8.5).
  - #78: (14:14:23Z, 14:26:41Z] (T2-131) và (14:15:34Z,
    14:26:41Z] (T7-131) — ghi cả hai, lấy khung hẹp nhất
    làm chuẩn (quyết parent đợt 131 §12.3(c)).
  - #79: HAI khung (T4 (15:00:06Z, 15:01:30Z] vs T8
    (15:01:22Z, 15:01:30Z]) — ghi cả hai, khung T8 nằm
    trong khung T4 (quyết parent đợt 131 §12.3(c)).
  - #80: HAI khung — (16:07Z, 17:24:08Z] (brief đợt 132)
    và (16:10:55Z, 17:24:08Z] (T6-132 §8.4, hẹp hơn) —
    ghi cả hai, khung hẹp nhất làm chuẩn (quyết parent
    đợt 132 §12.3(c)).
  - #81: HAI khung (xem §8.3).
  - #82: HAI khung (xem §8.4).

### 8.3 Khung chết #81? HẸP HƠN NỮA + gap #81?→#82? ĐƯỢC CHỨNG NHẬN (đóng góp của T2-133; T6 đối chiếu)

- Brief mở đợt 132 + T10-132 dùng khung **(19:33:56Z,
  19:34:15Z] (19 s)** — bốn nguồn T4/T5/T5b/T8 khớp nhau
  (LIMITS gộp đợt 132 §10.2).
- **T2-133 hẹp hơn nữa: (19:34:00Z, 19:34:15Z] (15 s).**
  Bằng chứng: merged second-marks của mù #52 (T2-133
  `blind52-merged.log`): seg A last mark 19:34:00Z,
  tail=15s; không có mark nào trong [btime−10s, btime].
  Ghi cả hai khung theo tiền lệ (quyết parent đợt 132
  §12.3(c)); **khung hẹp nhất (15 s) làm chuẩn**.
- **Gap #81?→#82? = INTERVAL [2h09'57", 2h10'17"], mid
  2h10'07" — CERTIFIED** (T2-133 `blind52-gaps.txt`: seg A
  mù #52 đóng (merged) + seg C mù #51 đóng theo uptime,
  T5 ±10s bound, F81? và F82? đều đo trực tiếp,
  |X82?| < 15s session bound). CERT n=46 / FULL n=61 (tăng
  từ CERT45/FULL60 của T2-132). Kiểm tra cơ học: #82? thực
  tế 19:34:15Z nằm trong khoảng dự báo từ #81?
  [17:57:00Z, 19:54:40Z] — lần thứ 12 liên tiếp INSIDE.
- **Mù #52: ĐÓNG HOÀN TOÀN** (T2-133 `blind52-merged.log`):
  seg A marks=162, largest gap 419s → max_hidden=0;
  seg B marks=113, largest gap 469s → max_hidden=0.
  Mù #52 (17:46:50Z → probe #52) là mù đầu tiên được đóng
  hoàn toàn kể từ mù #50 — nhưng nó chỉ chứng nhận bước
  #81→#82, KHÔNG neo được số tuyệt đối (xem §8.5).

### 8.4 Boot mới #83? + khung chết #82? (đóng góp mới của T6 đợt này)

- **Reboot GIỮA LUỘT lần thứ bảy liên tiếp** (07da9c50 →
  3e7a7b51, btime 21:41:40Z). Reboot giết tiến trình chờ
  của chính T6 (sleep tới ~22:05Z bị SIGTERM trong lúc
  shutdown — xem §8.6); không giết holder lock nào (lock
  đã trống từ 21:23:09Z, §2).
- **Boot mới: boot_id `3e7a7b51-7a44-4dc0-9c2f-25b82cd342bf`,
  btime 21:41:40Z** (`uptime -s` = 21:41:40Z, `who -b` =
  Nov 17 21:41, `/proc/1` 21:41:56Z — chênh +16 s, cùng mẫu
  các boot trước; `journal --list-boots` chỉ 1 dòng
  3e7a7b51). Uptime ~1' lúc T6 kiểm lại (21:42Z).
- **Gap #82?→#83? danh nghĩa (btime→btime) = 2h07'25"
  (7.645 s) — SPAN** (chưa chứng nhận; T2-134 kiểm mù #53).
  Kiểm tra cơ học (T6 đối chiếu, T2-134 chính thức hóa):
  #83? thực tế 21:41:40Z nằm trong khoảng dự báo của T2-133
  từ #82? [20:07:15Z, 22:01:22Z] — lần thứ 13 liên tiếp
  INSIDE.
- **Khung chết #82? (07da9c50): HAI bản ghi — ghi cả hai,
  khung hẹp nhất làm chuẩn (tiền lệ quyết parent đợt 132
  §12.3(c)):**
  - (a) **(21:28:35Z, 21:41:40Z] (13m05s) — bản ghi CHÍNH,
    có thể quy trách nhiệm:** quan sát cuối là mtime file
    `build-loop-log.md` 21:28:35Z (mục T8-133 của parent,
    ghi sau khi T8 `.done` 21:27Z). Quét `find -newermt`
    trên toàn `hidden_files/` + `docs/` + `repo-1` (trừ
    node_modules) + `goals/` (trừ hidden_files) + `/tmp` +
    `agents/` cho khoảng (21:23:09Z, 21:41:40Z] chỉ trả
    thêm đúng 1 mốc (xem (b)) — không có quan sát nào khác
    trong khoảng chết.
  - (b) **(21:29:47Z, 21:41:40Z] (11m53s) — bản ghi HẸP
    HƠN, KHÔNG quy trách nhiệm được:** thư mục
    `workspace/agents/9e39f4db-…/exec-logs` có mtime
    21:29:47Z nhưng **trống rỗng** (total 0) — một file
    tạm đã được tạo rồi xóa trong đó, không còn dấu vết để
    xác định là của luồng nào. Đây là bằng chứng ghi thật
    trên boot cũ (mtime trước btime boot mới), nhưng T6
    KHÔNG dùng làm chuẩn duy nhất vì không quy trách nhiệm
    được; ghi lại để T2-134 tự quyết có nhận hay không.
  - Tuổi thọ #82? theo khung chính: **1h54'20"–2h07'25"**
    (thay cho danh nghĩa 2h07'25"); theo khung hẹp:
    1h55'32"–2h07'25".
  - Lưu ý: tiến trình chờ của T6 bị SIGTERM trong lúc
    shutdown KHÔNG được dùng làm mốc khung chết (thời gian
    đo được ~21:42:02Z lẫn độ trễ reaping của runtime sau
    reboot, không phải mtime file) — chỉ ghi nhận rằng T6
    còn sống trên boot cũ tới lúc shutdown (xem §8.6).

### 8.5 VERDICT: chuỗi tương đối CHỐT #57→#83 — số tuyệt đối VẪN TẠM (giữ "?")

- **CHỐT ĐƯỢC — chuỗi tương đối:** 27 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #83 (21:41:40Z 17/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→#76→#77→#78
  →#79→#80→#81→#82→#83 đều có ≥2 nguồn độc lập xác nhận
  (T5 + T2 + T6 + T9 + T10 + file mtime). Không có bằng
  chứng nào về một boot quan sát được mà chưa đếm.
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Bốn lý do độc lập,
  bất kỳ lý do nào cũng đủ để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn.** Toàn bộ chuỗi sau
    mù #37 mang cùng một độ lệch chưa biết k (0 ≤ k ≤ 29).
    T5-120 §2.2 đã tính gộp: cộng thêm mù #38 (G mở, tối đa
    6 ẩn) và mù #29/#30/#31 (+4) thì boot tạm gọi "#60"
    thực tế có thể tới #123. Độ lệch này là **cấu trúc,
    không gỡ được từ trong VM** — không có quan sát mới nào
    trong cửa sổ B/C của mù #37 từ đợt 119 tới nay.
  - (b) **Mù #49 đoạn B (đời boot #76) MỞ, tối đa 1 ẩn**
    (T2-130 §2; T2-131 kiểm lại: VERDICT KHÔNG ĐỔI) —
    bước #76→#77 có thể là +2 thay vì +1, độc lập với (a).
    **Đợt này T2-133 KHÔNG kiểm lại mù #49 B** theo quyết
    parent đợt 132 §12.3(d) (bỏ mục kiểm lại thường lệ) —
    đoạn B vẫn mở, gap #76→#77 vẫn SPAN.
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (T2-132; T2-133
    recheck3 — VERDICT KHÔNG ĐỔI, xem dưới) — bước
    #80?→#81? có thể là +2/+3/+4 thay vì +1, độc lập với
    (a) và (b). Gap #80?→#81? = 2h22'38" vẫn SPAN, KHÔNG
    vào FULL/CERT.
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c):**
    việc chứng nhận bước #81→#82 chỉ khóa chặt một bước
    chuyển, không lấp được các khoảng mù trước đó. Ngay cả
    khi T2-134 đóng mù #53 hoàn toàn thì (a)+(b)+(c) vẫn
    chặn số tuyệt đối.
- **Mù #51 recheck3 (T2-133 `blind51-recheck3.log`): VERDICT
  KHÔNG ĐỔI** — A đóng (max_hidden=0), B mở tối đa 3 ẩn
  (largest gap 4393s = 16:10:55Z → 17:24:08Z, floor
  (4393/1147)=3), C đóng (max_hidden=0). Gap #79?→#80? =
  [2.079 s, 2.099 s] CHỨNG NHẬN DẠNG KHOẢNG (CERT n=45,
  FULL n=60) giữ nguyên; gap #80?→#81? vẫn SPAN.
- **Kết luận cho parent:** T6-133 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 2 boot (#82? đã chứng nhận gap,
  #83? mới); số thứ tự tuyệt đối **vẫn TẠM** và phải giữ
  "?" cho tới khi có bằng chứng ngoài VM (hoặc một mù
  được đóng hoàn toàn làm neo mới — mù #52 đóng nhưng nằm
  sau tất cả các mù đang mở nên không làm neo được). Việc
  "chốt số boot" theo nghĩa bỏ dấu "?" là **không thể đạt
  được bằng bằng chứng trong VM** chừng nào mù #37 còn mở.
  Không bịa số, không bỏ "?" khi chưa đủ bằng chứng — đúng
  như brief giao.
- Hệ quả thực hành: T9-133 gọi boot mới là "#82?" trong
  LIMITS của mình là đúng quy ước tạm; T10-133 gọi boot
  sau reboot là "#83?" là đúng quy ước tạm; không cần đổi
  tên file/cờ nào. Các quyết parent trước (§12.3(h) đợt
  130 và 131, §12.3 đợt 132) vẫn đứng: không quyết con số
  tuyệt đối nào ở đây.

### 8.6 Reboot #83? giết tiến trình chờ của T6 — không mất việc của luồng nào khác

- Reboot 07da9c50 → 3e7a7b51 (btime 21:41:40Z) giết tiến
  trình `sleep` chờ tới ~22:05Z của chính T6 bằng SIGTERM
  (session bị kill sau 55m55s chạy). T6 khởi động lại công
  việc kiểm tra lúc đóng trên boot mới lúc 21:42Z — không
  mất dữ liệu nào (mọi snapshot lúc mở + suite + repro +
  prune đã ghi đĩa trước reboot).
- **Không luồng nào khác mất việc:** cả 8 cờ `.done` của
  đợt 133 đã có trước reboot — T1 20:55Z, T2 21:11Z, T3
  21:13Z, T4 21:10Z, T5 21:17Z, T7 20:45Z, T8 21:27Z, T9
  20:45Z (muộn nhất T8 21:27Z, tức 14' trước reboot). T10
  chưa spawn lúc T6 đóng (thư mục `round133-t10/` còn
  trống 21:44Z) — T10 sẽ đóng sổ trên boot mới #83?.

## 9. Replay apt sau boot #83?: THUỘC T5 — T6 không kết luận

- T6 đợt này không kiểm `dpkg.log` (không thuộc 4 việc
  brief giao). Lúc kiểm ~21:42Z thấy replay os-intent của
  host đang chạy (`apt-get update` + methods) trên boot
  mới — đó là replay sau reboot của hệ thống, không phải
  replay của T5-133. Verdict replay / cờ POSTBOOT_PASS boot
  mới thuộc T5-134 (hoặc T5-133 nếu còn chạy — T5 `.done`
  đã có 21:17Z trên boot cũ).
- **Lock không bị ảnh hưởng** (trống trước/sau mọi thao tác
  của T6, xem §2).

## 10. Dọn Xvfb: 0 Xvfb, 0 socket sót — /tmp/.X11-unix/ trống lúc mở và lúc đóng

- **Lúc mở đợt (20:42Z) và lúc đóng (21:42Z, sau reboot):
  `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb đang chạy
  (`pgrep -x Xvfb` rc=1 cả hai lần; quét `/proc/*/cmdline`
  không có process nào tên Xvfb). Không có Xvfb sót nào từ
  đợt 132 (reboot #83? đã xóa tmpfs; T4-133 + T8-133 đã
  chạy WebKit harness trên boot #82? và dọn sạch — T8
  `.done` 21:27Z ghi "0 Xvfb/vite/MiniBrowser sót").
- T4-133 đã chạy attempt1 lượt yên #10 (20:50:45–20:54:11Z)
  và T8-133 đã chạy 3 harness (21:15:30–21:23:09Z) trên
  boot #82? — cả hai đều dọn Xvfb của mình khi xong (luật
  đứng "mỗi driver tự kill Xvfb của mình khi xong").
- **Không kill process nào** trong phiên này (không có Xvfb
  sót để kill; T6 không đụng process luồng khác theo nhiệm
  vụ).
- **RAM khả dụng (đo của T6, không phải số chính thức —
  thuộc T9):** 1.550 MB lúc 21:43Z trên boot mới #83?
  (tổng 7.934 MB) — cửa sổ vàng sau boot, phù hợp phát
  hiện của T4-132 (RAM cao ~10 phút đầu sau boot rồi rơi).
  T9-133 đo chính thức trên boot cũ (`.done` 20:45Z); số
  RAM trên boot mới thuộc T9-134.

## 11. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#82?/#83?) VẪN TẠM (xem §8.5):**
  chuỗi tương đối #57→#83 đã chốt (27 boot); số tuyệt đối
  giữ "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa
  6, mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới
  #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn (không kiểm
  lại đợt này theo quyết parent); (c) mù #51 đoạn B mở,
  tối đa 3 ẩn (recheck3 không đổi); (d) mù #52 đóng hoàn
  toàn nhưng không làm neo được. Journal/wtmp chỉ giữ boot
  hiện tại (journal `--list-boots` chỉ 1 dòng 3e7a7b51;
  wtmp bắt đầu 21:41:56Z) nên T6 suy ra số hiệu từ thứ tự
  thời gian + hồ sơ các đợt trước, không phải từ log hệ
  thống.
- **F-133-T6: KHÔNG CÓ sai số mới.** Không lặp lại
  F-132-T6-1 (repro chạy đúng /tmp, §6); không có
  double-acquire / TIMEOUT / STALE-LOCK mới; không có
  event lock nào mất dấu hay thêm lạ (+17 dòng khớp từng
  con số); khung chết #82? ghi cả hai bản ghi, bản hẹp
  (21:29:47Z) ghi rõ là không quy trách nhiệm được — không
  tự chọn một chuẩn duy nhất trái tiền lệ.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; ngày
  đúng là **15/11** (F-131-T6-1, nhắc lại ở §8.1). Mù #49
  đoạn B mở + mù #51 đoạn B mở thuộc T2-134; mù #52 đã
  đóng hoàn toàn (T2-133).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ chín
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round131-t*/` (toàn đợt) +
  `round132-t*/` (toàn đợt) + `round133-t*/` tới 21:44Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T10-133 chưa chạy tới thời điểm đếm; T6 đợt 134 đếm
  tiếp.
- **Prune cooldown lần 8 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 76 ≤ trần 100 lúc chạy). File cũ
  nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z, theo
  `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 132 khép sạch trên lock (§3):** chu kỳ O8 của
  T10-132 (20:20:50–20:22:35Z, hold 105s) sạch; **đợt 133
  khép sạch trên lock tới 21:44Z (§3):** 4 chu kỳ của luồng
  đợt 133 đều sạch; ca reboot-kill duy nhất trong cửa sổ
  thuộc đợt 129 (đã dọn đúng luật). Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 21:44Z (trống, 0 ticket + 77 cooldown); đợt còn
  chạy tới ~23:35Z, **T10 đóng đợt sẽ recount lại lúc đóng**
  (như đợt 124–133 T10 đã đếm lúc đóng). T6 không chờ tới
  lúc đóng.
- **Tuân thủ lock của luồng đo đợt 133 ĐÃ kiểm được:**
  T4 attempt1 lượt yên #10 (20:50:45–20:54:11Z, hold 206s)
  + T8 3 harness (21:15:33–21:23:09Z) đều acquire/release
  sạch, đúng quy trình (ticket → acquire → release →
  cooldown). T10-133 chưa chạy — T6 đợt 134 kiểm tiếp.
- **Tuân thủ Xvfb luật đứng của đợt 133: CÓ bằng chứng mới
  tích cực** (T4 + T8 chạy WebKit harness trên boot #82?
  và dọn sạch — 0 Xvfb/socket sót lúc T6 đóng, kể cả sau
  reboot #83?).
- **Replay apt #83? chưa có verdict** (thuộc T5-134 — xem
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

## 12. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND133_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (prune
đã chạy, xóa 0 file; +1 file `cooldown-t8-round133` do T8
dùng lock thật theo đúng quy trình), Xvfb (0 process; 0
socket sót).
Stage: `repo-1-push/paths-loop/phase9-round133-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round133-t6/` (analyze-log.py,
analyze-log-cleaned.txt, analyze-log-raw-856.txt,
analyze-log-cleaned-close.txt, analyze-log-raw-870.txt,
vite-lock-v2-cleaned-850.log, vite-lock-v2-cleaned-864.log,
new-lines-since-847.txt, new-lines-since-856.txt,
cooldown-now.txt, prune-candidates.txt, prune-deleted.txt,
ps-full-open.txt, ps-full-close.txt, ss-open.txt, ss-close.txt,
khong-nha-grep.txt, khong-nha-grep-close.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg-fixed.sh, repro-newmsg.log).
