# PHASE9 ROUND143 T6 — lock health + prune lần 18 + boot #104? TẠM INSIDE dải + xung đột đánh số (c)/(d) + mâu thuẫn full boot_id b47f7932 — LIMITS

- Đợt: 143, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 09:35 +07 19/11/2026 (= 02:35:51Z 19/11). Chạy
  02:40:49Z → 02:55:01Z 19/11/2026, toàn bộ trên một boot duy
  nhất 70a5b0fc (ứng viên #104?) — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune lần 18, suite kiểm lock 9/9
  ×2, chốt chuỗi boot với boot 70a5b0fc (btime 01:55:25Z),
  đối chiếu khung chết #102?/9afdaa89 với T2-143 khi có dữ
  kiện (T2-143 mới có prereg + probe #62 + boot-verify +
  f104 + dpkg104 lúc T6 đóng — merged/LIMITS/.done CHƯA có,
  ghi rõ chưa đủ dữ kiện để chốt), kiểm Xvfb sót, ghi mọi
  sai số F-143-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round143-t6/` (status-open.txt,
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
  repro-newmsg-fixed143.sh, repro-newmsg.log,
  scan-mtime-143.py, scan-mtime-143.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 70a5b0fc (ứng viên #104?; xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `70a5b0fc-6aae-4261-a3fe-11226162b5a3`, btime 01:55:25Z**
  (`/proc/stat` btime epoch 1795053325; `uptime -s` =
  01:55:25Z; `who -b` = Nov 19 01:55; `/proc/1` 01:55:36Z —
  chênh +11 s, cùng mẫu các boot trước; `journal --list-boots`
  chỉ 1 dòng 70a5b0fc, first entry 01:55:36Z (boot +11 s);
  `wtmp` bắt đầu 01:55:36Z). Uptime ~45'31" lúc T6 bắt đầu
  (02:40:49Z), ~59'36" lúc đóng (02:55:01Z). Đây là boot sau
  **reboot #29** (9afdaa89 → 70a5b0fc, trong lúc T10-142 đóng
  sổ — theo aggregate đợt 142 §12.2(c)).
- **KHÔNG có mâu thuẫn btime lần này:** brief,
  `round-in-progress.md` và T2-143 prereg đều ghi btime
  01:55:25Z. T2-143 `boot-verify.txt` (02:48:41Z) khớp đúng
  boot_id + btime + epoch + journal first entry của T6;
  T7-143 NOTES (kiểm lần 1 ~02:43Z) khớp đúng boot_id +
  btime; probe #62 của T2-143 (`once.txt`:
  `probe#62 boot=70a5b0fc ok=2 fail=0`) xác nhận boot đang
  sống. Ba luồng khớp nhau hoàn toàn (T6 + T2 + T7).
- **Đợt 143 mở 02:35:51Z** (round-in-progress.md; sched
  02:35:51Z) — tức **2.426 s sau btime boot 70a5b0fc
  (01:55:25Z)**. T6 mở 02:40:49Z (2.724 s sau btime).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline. preview.tsx md5 `530e10a7`.
- Các luồng đợt 143 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round143-t2/t4/t5/t7/t8/t9/t10; T2-143 đã viết
  prereg + chạy probe #62 (ok=2 fail=0, boot 70a5b0fc) nhưng
  CHƯA viết merged/LIMITS/.done lúc T6 đóng — T6 đối chiếu ở
  §8 với prereg-t2.md + boot-verify.txt + f104.txt +
  once.txt; **T4-143 CHƯA GIỮ LOCK lúc T6 mở lẫn lúc đóng**
  — poll-wait đang chạy từ 02:42Z (poll #17 02:54:34Z),
  gate postboot CHƯA ĐẠT (T5-143 đang repair boot 70a5b0fc,
  flag T5 vẫn là bản cũ của đợt 142 — xem §11);
  T5-143 đang repair (process `vcut-webkit-postboot-check.sh
  --repair` chạy lúc T6 đóng — §10); T8-143 đang chuẩn bị
  (chờ T4/T5 — `wait-t4-t5-143t8.sh`).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật lúc mở và lúc đóng — 0 cổng lạ

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 02:40Z
  (mở, `ps-full-open.txt`) và lúc 02:55Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (02:40Z) và lúc đóng (02:55Z): 0 tiến trình
  vite/node/webkit thật, 0 tiến trình lock-script, 0 Xvfb**
  (xem §10). `ss -tlnp` lúc mở và lúc đóng đều chỉ còn dòng
  header (không cổng nào lắng nghe).
- Process lạ duy nhất trong 2 snapshot đều là của luồng khác,
  hợp lệ: lúc mở có process grep `job_runs` của T7-143 (đang
  kiểm lần 1); lúc đóng có process bash
  `vcut-webkit-postboot-check.sh --repair` của T5-143 (đang
  repair boot 70a5b0fc) — đều không phải vite/webkit/Xvfb.

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; 0 chu kỳ mới trong phiên T6

- **Lúc mở (02:40:49Z): thư mục lock thật
  `hidden_files/vite.lock` KHÔNG TỒN TẠI** — status
  `TRỐNG (không có lock)`, `0 ticket + 94 cooldown`, rc=0.
- **Lúc đóng (02:55:01Z): lock TRỐNG** — status `TRỐNG`,
  `0 ticket + 94 cooldown`, rc=0.
- **Log lock +0 dòng trong phiên T6: 1075 dòng thô lúc mở →
  1075 dòng thô lúc đóng** — không có event lock nào trong
  phiên T6. Bản đã lọc lúc đóng md5 `e2925211…` KHỚP ĐÚNG
  bản đã lọc lúc mở (chuỗi không đứt); bản thô lúc đóng md5
  `053589c9…` KHỚP ĐÚNG bản thô lúc mở.
- Khoảng yên trước đó: không có event lock nào từ 02:04:14Z
  (t10-142 release cuối) tới lúc T6 mở — yên lặng này là do
  đợt 142 đã đóng và đợt 143 mới mở, T4-143 chưa acquire được
  (gate postboot chưa đạt, §11) — không phải do lock kẹt (bằng
  chứng: suite độc lập 9/9 ×2, §6; 11 chu kỳ mới sau T6-142
  đóng đều sạch, §4).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 53 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 11 chu kỳ mới kể từ
  lúc T6-142 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4):
  - t4-round142 ×3 (00:00:55Z → 00:20:38Z; holds 209 / 212 /
    206 s),
  - t8-round142 ×6 (00:30:32Z → 00:46:19Z; holds 70 / 140 /
    240 / 70 / 121 / 230 s),
  - t10-round142 ×2 (02:01:30Z → 02:04:14Z; holds 64 / 58 s).
  - Cộng với 42 chu kỳ T6-142 đã đếm = **53 chu kỳ liên
    tiếp sạch trên thứ tự mới**.
  - Bằng chứng phiên bản: T4-142 dùng script repo
    (`run-attempt-142.sh` dòng 13: `LOCKV2=.../vcut-vite-
    lock-v2.sh`); T8-142 dùng script repo
    (`run-webkit-142t8.sh` dòng 33: `LOCK=.../vcut-vite-
    lock-v2.sh`); T10-142 dùng bản frozen
    `round142-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
    (aggregate đợt 142 §10.3 kiểm trực tiếp).
- **File `cooldown-t10-round142` mtime 02:04:14Z** (release
  cuối của t10-142 — xem §4); file `cooldown-t8-round142`
  mtime 00:46:19Z (release cuối của t8-142);
  `cooldown-t4` mtime 00:20:38Z (release cuối của t4-142).
  Không file cooldown nào mới trong phiên T6.
- **T10-143 đã chuẩn bị bản frozen** `round143-t10/vcut-
  vite-lock-v2.t10.sh`, md5 `520b8baa` (T6 kiểm trực tiếp
  đợt này) — tức sẽ chạy trên **thứ tự ghi mới** (§11).

## 4. Nhất quán log lock: 1031 dòng chính thức lúc T6-142 đóng → 1069 lúc T6-143 đóng, 309 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z,
dòng 848–853 thô — T6 đợt này xác minh lại bằng multiset
diff: đúng 6 dòng đó là phần chênh giữa raw[0:1037] và bản
đã lọc T6-142 đóng, gồm 2 TICKET + 2 ACQUIRED + 2 RELEASED).
Bản đã lọc lúc đóng có md5 `e2925211…` — KHỚP ĐÚNG bản đã
lọc lúc mở (0 dòng mới trong phiên T6); lúc mở (02:40Z):
**1075 dòng thô / 1069 chính thức**; lúc đóng (02:55Z):
**1075 dòng thô / 1069 chính thức** — KHỚP ĐÚNG số T10-142
đếm lúc đóng đợt 142 (aggregate §10.4: thô 1075 / chính
thức 1069; TICKET 326/324, ACQUIRED 317/315, RELEASED
311/309, COOLDOWN 106, TIMEOUT 8, STALE-LOCK 6,
STALE-TICKET 1) và KHỚP ĐÚNG số brief giao cho T6 đợt này
— ba nguồn độc lập đồng thuận.

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-142 (1031) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 324 | 313 | 233 | 227 |
| ACQUIRED | 315 | 304 | 233 | 227 |
| RELEASED | 309 | 298 | 231 | 225 |
| COOLDOWN | 106 | 101 | 98 | 93 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **1069** | **1031** | **796** | **773** |

- So với snapshot T6-142 đóng (1031 dòng): **+38 dòng =
  TICKET +11 / ACQUIRED +11 / RELEASED +11 / COOLDOWN +5 /
  TIMEOUT +0 / STALE +0** — đúng bằng 11 chu kỳ mới:
  t4-round142 ×3 = 9 dòng (3×3 T/A/R, wait_s 0/1/0 — 0
  COOLDOWN) + t8-round142 ×6 = 23 dòng (6×3 T/A/R + 5
  COOLDOWN — 5 chu kỳ có wait_s=15/16, 1 chu kỳ wait_s=0)
  + t10-round142 ×2 = 6 dòng (2×3 T/A/R, wait_s 0/1 — 0
  COOLDOWN). Mọi chu kỳ đều sạch, ghép cặp đủ — khớp từng
  con số, không có event nào mất dấu hay thêm lạ ngoài ca t4
  cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 1069 dòng): **309 cặp ACQUIRED→RELEASED;
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
- Cửa sổ R120: **233 = 233 T/A, RELEASED 231** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  324+315+309+106+8+6+1 = 1069 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 142 khép lại trên lock (toàn đợt): 11 chu kỳ sạch**
  — t4-142 ×3 (holds 209/212/206 s — lượt yên #18, xem §11)
  + t8-142 ×6 (holds 70/140/240/70/121/230 s — kiểm chứng
  vá watchdog) + t10-142 ×2 (holds 64/58 s — suite + O8).
  T6-142 lúc đóng mới thấy 0 chu kỳ; 11 chu kỳ này T6 đợt
  này đếm bổ sung, khớp đúng recount T10-142 (log 1075
  dòng thô lúc T10-142 đóng sổ 02:04:14Z).
  **Đợt 143 tới 02:55Z có 0 chu kỳ** (T4-143 chưa acquire
  — gate postboot chưa đạt). Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 141 (toàn đợt), đợt 142 (toàn đợt) và đợt 143 (tới 02:55Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round141-t*/` + `round142-t*/` +
`round143-t*/` (tới 02:55Z) — theo quy tắc lăn: bỏ round140,
thêm round142 (phần còn lại sau T6-142) + round143. **Phương pháp đếm đợt này:
grep ra file /tmp trước, `--exclude` file grep-output
(`khong-nha-grep.txt`) NGAY từ lần đầu + loại file repro
của chính T6 đợt này (`round143-t6/repro-newmsg.log`, 3
dòng — đếm ở đợt 144)** (theo bài học F-142-T6-2: không
đếm lồng file grep-output; bài học T6-138 §5).
**Lưu ý phương pháp:** pattern grep có dấu (`KHÔNG NHẢ` /
`BỎ QUA release thừa`) — các file `.done` của T6 viết bằng
ASCII không dấu (`"KHONG NHA"`) nên KHÔNG khớp pattern này.
Tổng **12 dòng khớp chuẩn, phân loại đủ 12/12 — tất cả
đều là bản sao script / log repro, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 6 | 3 file × 2 dòng: `round141-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round142-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round143-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa` — MỚI, T10-143 đã chuẩn bị) |
| Tái hiện có kiểm soát trên /tmp | 6 | `round141-t6/repro-newmsg.log` + `round142-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 0 | Không file `.done` nào trong phạm vi khớp pattern có dấu (các file `.done` của T6 viết không dấu) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 141 (toàn đợt) / 142 (toàn đợt) / 143 nào |
| Round143-t* (trừ repro /tmp của T6) | 2 dòng | Chỉ 2 dòng bản sao script `round143-t10/vcut-vite-lock-v2.t10.sh` — T10-143 chưa chạy harness |

- **Repro đợt này (chưa đếm, đếm ở đợt 144):**
  `round143-t6/repro-newmsg.log` 3 dòng (2 `BỎ QUA` +
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
  đợt), đợt 141 = 0 (toàn đợt), đợt 142 = 0 (toàn đợt —
  bổ sung 11 chu kỳ sau T6-142 đóng, §4), đợt 143 tới
  02:55Z = 0.** Khớp với log pairing sạch ở §4 (309 cặp +
  1 ca reboot-kill cũ đã giải thích — không liên quan nhánh
  release).
- Giới hạn phạm vi: T4/T8/T10-143 chưa chạy xong tới 02:55Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  143, T6 đợt 144 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-142 đếm 10 dòng (4 script + 6
  repro); đợt này bỏ round140 (−2 script −3 repro = −5)
  nhưng thêm round142-t10 script (2) + round142-t6 repro
  (3) + round143-t10 script (2) = +7 → 10 − 5 + 7 =
  **12 dòng** ✓.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
70a5b0fc (`#104?` ứng viên).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round143-t6/test-v2-t6-run1.log` 02:44:52Z,
`test-v2-t6-run2.log` 02:45:14Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ mười chín liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — mười chín lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ hai mươi lăm liên tiếp (T6
  đợt 120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 142 + T6
  đợt 143).

### 6.2 Repro message ĐÚNG (`round143-t6/repro-newmsg.log`, 02:45:53Z)

Copy verbatim script của T6-142, chỉ đổi tên TDIR
(`vcut-t6r142-repro` → `vcut-t6r143-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–142, kết quả giống hệt:
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
  lúc đó có 94 cooldown; log thật vẫn 1075 dòng thô lúc
  repro chạy và queue vẫn 94 file sau khi repro xong;
  không có file `cooldown-tA/tH/tB` nào xuất hiện trong
  queue thật. **F-132-T6-1 KHÔNG lặp lại.**
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (309 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy nhất do reboot
  giữa lượt (đợt 130), 0 sự kiện "KHÔNG NHẢ" trên lock thật
  đợt 120–142 (toàn đợt) và đợt 143 (tới 02:55Z), suite 9/9
  độc lập ×2 lần chạy (T7 xanh cả hai lần), và thứ tự ghi
  mới đã có **53 chu kỳ thật** chứng minh (§3). **Không còn
  caveat nào về mất dòng RELEASED cho các chu kỳ mới** —
  caveat cũ chỉ còn là 1 dòng lịch sử (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **đợt 143 tới lúc đóng có 0
  chu kỳ lock** — vì T4-143 chưa acquire được (gate postboot
  chưa đạt, §11), không phải vì lock kẹt.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 18 liên tiếp)

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
  - 02:46Z: lock TRỐNG (status 0 ticket + 94 cooldown)
    — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng) — tổng 94 file ≤ trần mềm 100 nên điều (b) cũng
    không kích hoạt.
  - **Kết quả prune đợt 143: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 18 liên tiếp prune xóa 0 file
    (đợt 126–143: 0 mỗi đợt).
  - Lưu ý: không có file cooldown mới nào trong phiên T6
    (0 chu kỳ đợt 143, §4). Số file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (02:40Z) **94 file / 1316 byte**;
  lúc đóng (02:55Z) **94 file / 1316 byte** (94 × 14 =
  1316 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 92 + 2 = 94 ✓ (2 file cooldown mới kể từ
  T6-142 đóng: `cooldown-t8-round142` +
  `cooldown-t10-round142`; `cooldown-t4` ghi đè cùng tên
  nên không tăng tổng). Không file nào bị xóa hay thêm giữa
  hai lần đếm của đợt này.
- Phân tầng tuổi lúc 02:46Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 32 file** (tăng từ 27 đợt 142 — 5 file
  mtime 15/11 23:48Z–16/11 02:46Z vừa vượt 72h, đúng quy
  luật tuổi); **≥48h (`-mtime +1`): 60 file** (tăng từ 55
  đợt 142 — 5 file mtime 16/11 23:48Z–17/11 02:46Z vừa
  vượt 48h, đúng quy luật tuổi). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 02:46Z mới **~104h08' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#104? + 70a5b0fc; số tuyệt đối VẪN TẠM; xung đột đánh số (c)/(d) + mâu thuẫn full boot_id b47f7932 (F-143-T6-1); khung chết #102?/9afdaa89 CHƯA CHỐT (chờ merged mù #62 của T2-143)

### 8.0 Reboot #29 — 9afdaa89 → 70a5b0fc (btime 01:55:25Z), trong lúc T10-142 đóng sổ

- Reboot 9afdaa89 → 70a5b0fc (btime 01:55:25Z) xảy ra trong
  lúc T10-142 đóng sổ (sau kiểm giữa #2 của T7 ~01:56Z,
  trước khi T10 kiểm boot 01:56:07Z) — **sự kiện #29** theo
  đánh số của aggregate đợt 142 §12.2(c) (quy tắc đứng: mỗi
  lần đổi boot_id là 1 sự kiện, kể cả reboot trong lúc đóng
  sổ). T10-142 chạy suite + O8 trên boot mới này
  (27/27; O8 Chromium 21/21, WebKit FAIL — xem §11).
- **Không luồng nào mất việc do reboot này trong phiên
  T6:** T6 mở 02:40:49Z và đóng 02:55:01Z toàn bộ trên boot
  mới, không bị reboot cắt (uptime liền mạch 45'31" →
  59'36'). Reboot xảy ra trước khi đợt 143 mở (02:35:51Z).
- **Replay apt sau boot 70a5b0fc: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-143 là chủ
  quản verdict replay / cờ POSTBOOT_PASS boot mới (đang
  repair lúc T6 đóng — process `--repair` chạy 02:55Z;
  T4-143 poll #17 ghi `dpkg_lines=2` tới 02:54:34Z — replay
  chưa xong theo số T4, bracket chính thức thuộc về T5).
- **/tmp đã bị reboot xóa sạch:** socket Xvfb X193/X194/X195
  của T10-142 (do chính suite/O8 của T10 tạo, đã dọn tay
  02:27:12Z) không còn; các TDIR suite `/tmp/vcut-lock-v2-
  test.*/` tự dọn bằng trap; TDIR repro của T6 đợt này đã
  dọn sạch sau khi xong (bản fixed in "TDIR cleaned").

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1 / T6-138 §8.1 / T6-139 §8.1 /
  T6-140 §8.1 / T6-141 §8.1 / T6-142 §8.1): khoảng
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

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm 9afdaa89 + 70a5b0fc)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 / T6-138 §8.2 /
T6-139 §8.2 / T6-140 §8.2 / T6-141 §8.2 / T6-142 §8.2 (mỗi
boot liệt kê với boot_id + btime lấy từ ≥1 nguồn độc lập;
btime→btime danh nghĩa = khoảng cách giữa hai btime liên
tiếp). Số thứ tự là số tạm theo thứ tự thời gian (tất cả đều
mang "?") — xem verdict §8.12. **Định nghĩa đếm dùng: định
nghĩa gộp của T10 (LIMITS gộp đợt 133 §10.2) — mọi reboot
quanh đợt, cả giữa lượt lẫn ranh giới — theo quyết
F-133-6.** Bảng dưới chỉ ghi 7 boot cuối (chuỗi đầy đủ
#57→#93 xem T6-131 §8.2 + T6-132 §8.2 + T6-133 §8.2 +
T6-134 §8.2 + T6-135 §8.2 + T6-136 §8.2 + T6-137 §8.2 +
T6-138 §8.2 + T6-139 §8.2 + T6-140 §8.2 + T6-141 §8.2 +
T6-142 §8.2 — không chép lại để khỏi drift; T6 đợt này đã
đối chiếu lại với LIMITS gộp đợt 142: các boot #94?→#101?
dưới đây khớp đúng btime/boot_id T10-142 đã chốt, không có
boot_id lạ nào xuất hiện trong bất kỳ bằng chứng 18–19/11
nào ngoài chuỗi này — trừ boot mới dưới đây).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #94 | 17db9652 | 09:36:01Z 18/11 | 2h16m19s (8.179 s — gap #94?→#95?, CHỨNG NHẬN [8.169, 8.189] s, T2-139); sống tới 11:52:20Z | T6-138 + T2-138 (prereg + probe #57 + merged mù #57 A đóng) |
| #95 | 914964c3 | 11:52:20Z 18/11 | 2h01m21s (7.281 s — gap #95?→#96?, CHỨNG NHẬN [7.271, 7.291] s, T2-139); sống tới 13:53:41Z | T2-138 §6 + T10-138 .done + T2-139 (merged mù #58 A+B đóng) |
| #96 | 541524e2 | 13:53:41Z 18/11 | 2h00m56s (7.256 s — gap #96?→#97?, CHỨNG NHẬN [7.246, 7.266] s, T2-140 + quyết parent (j) đợt 140); sống tới 15:54:37Z | T6-139 + T2-139 (prereg + probe #58 + merged mù #58 B+C đóng) + T2-140 (merged mù #59 đóng hoàn toàn) |
| #97 | af558fb5 | 15:54:37Z 18/11 | 1h58m19s (7.099 s — gap #97?→#98?, CHỨNG NHẬN [7.089, 7.109] s, T2-141); sống tới 17:52:56Z | T6-140 + T2-140 (prereg + probe #59 + merged mù #59 đóng hoàn toàn) + T10-139 closing-checks |
| #98 | 90392aa5 | 17:52:56Z 18/11 | 2h01m16s (7.276 s — gap #98?→#99?, CHỨNG NHẬN [7.266, 7.286] s, T2-141); sống tới 19:54:12Z | T2-140 §6 + T10-140 closing-checks + T2-141 prereg (boot #98? ứng viên) + T2-141 LIMITS (merged mù #60 đóng hoàn toàn) |
| #99 | 2c0efe57 | 19:54:12Z 18/11 | 1h58m09s (7.089 s — gap #99?→#100?, CHỨNG NHẬN [7.079, 7.099] s, T2-142 + quyết parent (e) đợt 142); sống tới 21:52:21Z | T6-141 + T2-141 (prereg + probe #60 + merged mù #60 đóng hoàn toàn) + T10-141 §10.2 (btime INSIDE dải FULL75) + quyết parent (g) đợt 141 (XÁC NHẬN = #99?) |
| #100 | 57a0dd12 | 21:52:21Z 18/11 | 0h40m42s (2.442 s — gap #100?→#101?, CHỈ LÀ SPAN — đoạn B mù #61 MỞ, tối đa 1 ẩn, quyết parent (e)/(f) đợt 142); sống tới 22:33:03Z | T10-141 §10.2 (btime INSIDE dải FULL75 [20:22:26Z, 22:19:21Z]) + quyết parent (g) đợt 141 (XÁC NHẬN = #100?) + T2-142 prereg §4 |
| #101 | ed5323a4 | 22:33:03Z 18/11 | 0h15m02s (902 s — gap #101?→#102?, CHỨNG NHẬN [892, 912] s, T2-142 + quyết parent (e) đợt 142; caveat đoạn ngắn < sàn 1.147 s); sống tới 22:48:05Z | T10-141 §10.1/§10.2 (suite + O8 chạy trên boot này 22:39–22:45Z; btime INSIDE dải tạm FULL75 neo #100? [22:20:35Z, 00:17:30Z]) + quyết parent (g) đợt 141 (ghi TẠM = #101?) + T2-142 prereg §4 |
| #102 | bde599df | 22:48:05Z 18/11 | 1h06m15s (3.975 s — gap #102?→#103? theo nhãn parent, CHỜ chứng nhận từ merged mù #62, ứng viên [3.965, 3.985] s; xem §8.8 về cách đếm chặt 3.933 s + 42 s); sống tới 23:54:20Z | T6-142 + T2-142 (prereg + probe #61 + merged mù #61) + T10-142 §10.2 + quyết parent (d) đợt 142 (ghi TẠM = #102?; btime NGOÀI dải tạm, dưới p10) |
| #103 | 9afdaa89 | 23:54:20Z 18/11 | 2h01m05s (7.265 s — gap #103?→#104? theo nhãn parent, CHỜ chứng nhận từ merged mù #62, ứng viên [7.255, 7.275] s); sống tới 01:55:25Z | T7-142 + T9-142 + T10-142 §10.2 + T2-142 (btime TRONG dải FULL77 [23:15:16Z, 01:12:54Z]) + quyết parent (d) đợt 142 (ghi TẠM = #103?) |
| #104 | 70a5b0fc | 01:55:25Z 19/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T2-143 prereg + boot-verify (02:48:41Z) + probe #62 (ok=2 fail=0) + T7-143 NOTES kiểm lần 1 + T10-142 (suite + O8 chạy trên boot này 01:57–02:04Z) |

- **Ghi chú bảng:** các hàng #94–#101 chép nguyên từ bảng
  T6-142 (đã qua soát xét đợt 142, cập nhật verdict gap
  theo quyết parent (e) đợt 142); hàng #102–#103 là boot
  đã ghi TẠM theo quyết parent (d) đợt 142; hàng #104 là
  boot mới. Nhãn gap trong ngoặc ở mỗi hàng là gap ứng
  với tuổi thọ danh nghĩa của boot đó (btime → btime boot
  sau) **theo nhãn parent** (bỏ qua b47f7932 trong dãy số
  — xem §8.8).
- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #99?→#100? là sự kiện thứ 24** (GIỮA lượt 141);
  **#100?→#101? là sự kiện thứ 25** (trong lúc T10-141
  đóng sổ); **#101?→#102? là sự kiện thứ 26** (trong lúc
  T10-141 đóng sổ — theo aggregate đợt 142 §12.2(c));
  **#102?→b47f7932 là sự kiện thứ 27 + b47f7932→#103? là
  sự kiện thứ 28** (REBOOT ĐÔI giữa lượt 142, cách nhau
  42 s theo btime — theo aggregate đợt 142 §12.2(c));
  **#103?→#104? là sự kiện thứ 29** (trong lúc T10-142
  đóng sổ — theo aggregate đợt 142 §12.2(c)).
- **Boot trung gian b47f7932 (btime 23:53:38Z, sống ~42 s
  theo btime) KHÔNG có hàng riêng trong bảng trên** — theo
  nhãn parent (d) đợt 142 (9afdaa89 = #103?), nó không
  được đánh số trong dãy số boot. Xem §8.8 (F-143-T6-1):
  T6 ghi rõ sự tồn tại của nó ở đây + trong chuỗi sự kiện,
  không giấu, nhưng không tự đánh số lại.
- **T2-143 + T7-143 đối chiếu khớp (độc lập, trước/sau khi
  T6 đo):** prereg-t2.md §"Bối cảnh" ghi boot mới
  `70a5b0fc…`, btime 01:55:25Z (xác minh lúc 02:41:46Z),
  gọi là #104? ứng viên; `boot-verify.txt` (02:48:41Z)
  khớp đúng boot_id + btime + epoch + journal first entry
  của T6 (uptime -s 01:55:25Z, btime epoch 1795053325,
  journal first entry 01:55:36Z); probe #62 (theo
  once.txt: `probe#62 boot=70a5b0fc ok=2 fail=0`) xác nhận
  boot đang sống; T7-143 NOTES kiểm lần 1 (~02:43Z) khớp
  đúng boot_id + btime. Ba luồng khớp nhau hoàn toàn về
  boot_id, btime, epoch và số tạm. T2-143 cũng ghi rõ
  run 143 mở SAU boot này nên không kỳ vọng viết lại
  started_at tại boot này (xem §9).
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#96: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3 +
    T6-138 §8.2–§8.4 + T6-139 §8.2–§8.4 + T6-140 §8.2–§8.4
    + T6-141 §8.2–§8.4 + T6-142 §8.2–§8.4 (không chép lại).
    Lưu ý theo quyết parent đợt 142 §12.2(g): khung chết
    #99? **XÁC NHẬN chuẩn (21:51:52Z, 21:52:21Z] (29 s)**;
    khung chết #100? **XÁC NHẬN chuẩn (22:32:05Z,
    22:33:03Z] (58 s)**; khung chết #101? **XÁC NHẬN chuẩn
    (22:45:49Z, 22:48:05Z] (136 s)** (xem §8.5); khung chết
    #98? **XÁC NHẬN chuẩn (19:46:47Z, 19:54:12Z] (445 s)**
    theo quyết parent (g) đợt 141; khung chết #97? **XÁC
    NHẬN chuẩn (17:52:10Z, 17:52:56Z] (46 s)** theo quyết
    parent (b) đợt 141; khung chết #96? **XÁC NHẬN chuẩn
    (15:54:16Z, 15:54:37Z] (21 s)** theo quyết parent (c)
    đợt 140; khung chết #94? **GIỮ chuẩn (11:52:12Z,
    11:52:20Z] (8 s)**; khung chết #93? bản chuẩn
    **(09:35:47Z, 09:36:01Z] (14 s)** GIỮ nguyên.
  - #95: khung ứng viên 400 s (xem §8.3).
  - #102: ứng viên quét mtime của T6, CHƯA CHỐT (xem §8.6).
  - #103: ứng viên quét mtime của T6, CHƯA CHỐT (xem §8.7).

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
  các lần append sau đó (nay là 02:04:14Z), không phải bằng
  chứng mới; 3 file còn lại là cùng 3 file cũ, cùng mốc
  13:47:01Z. **Không có bằng chứng mới — khung 400 s giữ
  nguyên.** Merged của T2-143 (mù #62) không phủ cửa sổ
  này (mù #62 bắt đầu 23:45:18Z 18/11); khung chuẩn cuối
  cùng vẫn chờ T2 khi có merged phủ — T6 không tự chốt.
- Mốc ~13:50Z của T1-139 (bản nháp aggregate đợt 138 soạn
  ~13:50Z trên boot 914964c3) vẫn chỉ là mốc suy ra, không
  có file mtime cứng — T6 ghi nhận lại để T2 cân nhắc,
  không tự thu hẹp khung 400 s.

### 8.4 Khung chết #96?/#97?/#98? — ĐÃ CHỐT CHUẨN theo quyết parent đợt 140/141, không có bằng chứng mới

- **Khung chết #96? chuẩn: (15:54:16Z, 15:54:37Z] (21 s)**
  — XÁC NHẬN theo quyết parent đợt 140 §12.2(c). Khung T9
  (15:54:02Z, 15:54:37Z] (35 s) giữ làm biên ngoài.
- **Khung chết #97? chuẩn: (17:52:10Z, 17:52:56Z] (46 s)**
  — XÁC NHẬN theo quyết parent đợt 141 §12.2(b).
- **Khung chết #98? chuẩn: (19:46:47Z, 19:54:12Z] (445 s)**
  — XÁC NHẬN theo quyết parent đợt 141 §12.2(g).
- Không có bằng chứng mới nào về khung #96?/#97?/#98?
  trong phiên T6 đợt này — merged mù #62 không phủ các
  cửa sổ này (mù #62 bắt đầu 23:45:18Z 18/11). Trạng thái
  ba khung từ nay là **ĐÃ CHỐT CHUẨN**, không còn hoãn quyết.

### 8.5 Khung chết #99?/#100?/#101? — ĐÃ CHỐT CHUẨN theo quyết parent đợt 142 §12.2(g)

- **Khung chết #99? chuẩn: (21:51:52Z, 21:52:21Z] (29 s)**
  — merged T2 TRÙNG KHỚP HOÀN TOÀN khung quan sát T9-141.
- **Khung chết #100? chuẩn: (22:32:05Z, 22:33:03Z] (58 s)**.
- **Khung chết #101? chuẩn: (22:45:49Z, 22:48:05Z] (136 s)**.
- Không có bằng chứng mới nào về ba khung này trong phiên
  T6 đợt này. Trạng thái ba khung từ nay là **ĐÃ CHỐT
  CHUẨN**, không còn hoãn quyết.

### 8.6 Khung chết #102? — quét mtime của T6: mốc cuối 23:53:40Z NẰM SAU btime boot trung gian (dị thường đồng hồ) — KHÔNG CÓ KHUNG THUẦN, CHƯA CHỐT — chờ merged mù #62 của T2-143

- **Quét mtime của T6 (`scan-mtime-143.py`, hidden_files +
  docs, cửa sổ W1 (23:45:18Z, 23:54:20Z]): 75 file, mốc
  cuối 23:53:40Z** — `round142-t5/ram-sampler.log` (T5-142);
  trước đó: `round142-t9/ram-sampler-long.log` +
  `ram-sampler-long.out` 23:53:38Z (T9-142 sampler vòng 1),
  các file T2-142 blind61 tới 23:52:41Z, T4-142
  gate0wait-13 23:51:40Z. Không có file nào khác có mtime
  trong cửa sổ sau 23:53:40Z trong hai cây quét.
- **Vấn đề:** mốc cuối quét được (23:53:40Z) NẰM SAU btime
  boot trung gian b47f7932 (23:53:38Z) 2 giây — tức file
  ghi trên boot cũ bde599df lúc 23:53:40Z nhưng boot mới
  đã có btime 23:53:38Z. Đây là **dị thường đồng hồ quanh
  23:54Z, cùng lớp F-142-T7-1(b)** (btime 9afdaa89 23:54:20Z
  sớm hơn thời điểm T7 đọc được b47f7932 lúc 23:54:33Z) —
  T2-143 prereg §6 đã dự báo đúng trường hợp này ("nếu
  merged cho mốc cuối đoạn A > 23:53:38Z thì đó là bằng
  chứng dị thường đồng hồ quanh 23:54Z, ghi rõ không
  giấu"). Quét của T6 xác nhận dự báo đó bằng bằng chứng
  file-mtime độc lập.
- Hệ quả: khung ứng viên thuần theo quét mtime
  (23:53:40Z, 23:53:38Z] là **rỗng/âm — KHÔNG TỒN TẠI**,
  nên T6 **không đưa ra khung #102? thuần nào**. Khung
  gộp (23:53:55Z, 23:54:20Z] (25 s) của T9+T4 (mốc cuối là
  poll #16 của T4-142 lúc 23:53:55Z trên boot cũ — quan
  sát nội dung, không phải file mtime) là khung cho **chuyển
  bde599df→9afdaa89 gộp cả reboot đôi**, KHÔNG phải khung
  chết #102? thuần — T2-143 prereg §6 phân biệt rõ, T6
  đồng thuận.
- **T6 không tự chốt khung #102?** — merged mù #62 của
  T2-143 (đoạn A: 23:45:18Z → 23:53:38Z, 500 s; đoạn B:
  23:53:38Z → 23:54:20Z, 42 s) là chứng nhận chính thức;
  T2 sẽ báo khung merged, parent quyết. Gap danh nghĩa
  #102?→#103? = **3.975 s (1h06'15")** — nằm trong dải
  chứng nhận [0h00'55", 3h14'08"]. Chứng nhận **[3.965 s,
  3.985 s] NẾU đoạn A+B mù #62 đóng** (prereg T2-143 §4 —
  với caveat đoạn A chỉ 500 s < sàn 1.147 s và đoạn B chỉ
  42 s: verdict đóng đứng trên mật độ, không chỉ luật cơ
  học — xem §8.8; T6 không tự chứng nhận).

### 8.7 Khung chết #103? (9afdaa89) — ứng viên quét mtime của T6: (01:44:23Z, 01:55:25Z] (662 s), CHƯA CHỐT — chờ merged mù #62 của T2-143

- **Quét mtime của T6 (hidden_files + docs, cửa sổ W2
  (01:34:32Z, 01:55:25Z]): 7 file, mốc cuối 01:44:23Z** —
  `PHASE9_ROUND142_T9_HEADROOM_LIMITS.md` +
  `round142-t9.done` (T9-142 đóng, cùng mốc 01:44:23Z);
  các file trước đó: `round142-t9/appendix-vong1.md` +
  `appendix-vong2.md` 01:39:19Z, `guard-watcher-2.out`
  01:37:27Z, `ram-sampler-long-2.log/.out` 01:35:32Z (sampler
  vòng 2 kết thúc). Không có file nào khác có mtime trong
  cửa sổ sau 01:44:23Z trong hai cây quét.
- Khung ứng viên theo quét này: **(01:44:23Z, 01:55:25Z]
  (662 s)**. Rộng vì máy yên sau khi T9 đóng (sampler đã
  hết hạn 01:35Z, các luồng còn lại không ghi file trong
  cây quét tới lúc reboot).
- **Thu hẹp bằng quan sát nội dung (không phải file
  mtime):** T7-142 ghi khoảng im lặng chứa reboot thứ ba
  (01:45:34Z, 01:55:57Z] — HB 01:50:50Z chạy trên boot cũ
  (start 01:45:34Z) — tức boot cũ còn sống ít nhất tới
  ~01:50:50Z. Nếu chấp nhận mốc nội dung này thì khung thu
  hẹp còn (01:50:50Z, 01:55:25Z] (275 s) — T6 ghi nhận để
  T2-143 cân nhắc, KHÔNG tự thu hẹp khung 662 s (quan sát
  nội dung không phải mốc merged; verdict cuối thuộc
  merged mù #62 đoạn C).
- **T6 không tự chốt khung #103?** — merged mù #62 của
  T2-143 (đoạn C: 23:54:20Z → 01:55:25Z, 7.265 s) là chứng
  nhận chính thức. Gap danh nghĩa #103?→#104? = **7.265 s
  (2h01'05")** — nằm trong dải chứng nhận. Chứng nhận
  **[7.255 s, 7.275 s] NẾU đoạn C mù #62 đóng** (prereg
  T2-143 §4 — T6 không tự chứng nhận).

### 8.8 F-143-T6-1 — Xung đột đánh số quyết (c) vs (d) + mâu thuẫn full boot_id b47f7932 (MỚI — T2-143 prereg phát hiện, T6 ghi lại + đối chiếu độc lập)

(a) **Xung đột đánh số:** quyết (c) đợt 142 XÁC NHẬN
b47f7932 là boot thật (2 sự kiện #27+#28 — mỗi lần đổi
boot_id là 1 sự kiện), nhưng quyết (d) đợt 142 đánh số
9afdaa89 = #103? và 70a5b0fc = #104? — ngụ ý reboot đôi
chỉ là 1 bước số. Hai quyết không thể cùng đúng theo định
nghĩa "mỗi boot một số tiếp theo" (T2-143 prereg §4 ghi
đúng xung đột này; T6 đợt này xác nhận lại bằng đối chiếu
độc lập với aggregate §12.2(c)/(d)). **T6 KHÔNG tự chọn
phe:** tài liệu này dùng nhãn parent (d) (#102?/#103?/
#104?) cho bảng §8.2 + gap/dải, đồng thời ghi rõ biến
thể đếm chặt trong cùng các mục (b47f7932 = #103?,
9afdaa89 = #104?, 70a5b0fc = #105?; gap 3.933 s / 42 s
SPAN / 7.265 s). Giao T2-143 (báo cả hai biến thể +
đề xuất sau merged) + T10/parent quyết. Giá trị gap
7.265 s và verdict dải #104?/#105? không phụ thuộc cách
đánh số (T2-143 prereg §4 — T6 xác nhận bằng tính toán
độc lập §8.9).
(b) **Mâu thuẫn full boot_id b47f7932 — T7 vs T9
(T2-143 prereg "Mâu thuẫn mới phát hiện trước khi đo",
T6 KHÔNG tự đo lại — không còn boot đó để đo):**
T7-142 (LIMITS + NOTES, nhất quán nội bộ):
`b47f7932-ebca-447e-a015-0a6c160efd98`; T9-142 (LIMITS,
nhất quán nội bộ): `b47f7932-ebca-4205-86a0-b71a0ab9790c`
(nhóm 3–5 trùng hệt bde599df). Cả hai đồng nhất về prefix
`b47f7932-ebca` + btime 1795046018 = 23:53:38Z +
`uptime -s` 23:53:38. T10-142 chỉ ghi short id + btime.
Tiền đề "T7 + T9 quan sát độc lập cùng boot_id" của quyết
(c) thực ra chỉ là **cùng prefix + btime** — T2-143 ghi rõ,
không tự khẳng định bên nào chép đúng (không có quan sát
thứ ba về full id trên đĩa lúc này). T6 ghi lại đúng như
T2-143 đã phát hiện, không thêm kết luận. Hệ quả cho
T10/parent: nếu một trong hai full id là chép sai (đua với
reboot — cả hai lần đọc 23:54:33Z/23:54:36Z đều SAU btime
9afdaa89 23:54:20Z, cùng lớp dị thường đồng hồ §8.6) thì
cần xem lại độ mạnh của bằng chứng "boot thật" cho
b47f7932 — nhưng **sự tồn tại của reboot #27/#28 như sự
kiện thì không đổi** (hai lần đổi boot_id quan sát được,
dù full id còn mâu thuẫn).
(c) **Đoạn B mù #62 chỉ 42 s — không chứng nhận được bằng
mật độ** (T2-143 prereg §3B): 42 s, gần như chắc chắn 0
mốc; floor(42/1147)=0 cơ học nhưng vô nghĩa — chính
b47f7932 là bằng chứng một boot 42 s có thể tồn tại gần
như không để lại mốc. Gap b47f7932→9afdaa89 = 42 s giữ
SPAN theo đếm chặt (T2 sẽ báo đoạn B là "không loại được
boot ẩn < 42 s" thay vì đóng cơ học). T6 đồng thuận, không
tự chứng nhận gap 42 s.

### 8.9 Dải #104? CHUẨN (FULL77) — btime 70a5b0fc INSIDE; chuỗi INSIDE khởi động lại (2 lần liên tiếp)

- Dải chuẩn cho #104? theo T2-143 prereg §5 (FULL77, neo
  tại #103? 9afdaa89 23:54:20Z, p10 1.632 s, p90 8.690 s —
  từ T2-142 §2.5): **[00:21:32Z, 02:19:10Z]**. T6 tính độc
  lập bằng code cho cùng dải — **KHỚP ĐÚNG TỪNG GIÂY**.
  Biến thể CERT62: [00:20:48Z, 02:10:21Z] (p10 1.588 s,
  p90 8.161 s).
- Thực tế btime 70a5b0fc **01:55:25Z — NẰM TRONG cả hai
  dải**: cách cận dưới FULL77 33'53" (2.033 s), cách cận
  trên 23'45" (1.425 s). Gap danh nghĩa #103?→#104? =
  7.265 s — nằm trong dải chứng nhận [0h00'55",
  3h14'08"].
- **T6 KHÔNG ép verdict INSIDE cuối cùng** — dải chuẩn
  thuộc T2-143; T6 chỉ ghi đối chiếu độc lập: theo dải
  FULL77/CERT62 hiện hành thì 01:55:25Z INSIDE. Chuỗi
  INSIDE theo dải cơ học: #102? OUTSIDE (đứt — lần OUTSIDE
  đầu tiên kể từ #93?); #103? INSIDE (btime 23:54:20Z
  trong dải FULL77 neo #102? [23:15:16Z, 01:12:54Z] —
  T2-142); #104? INSIDE (theo đối chiếu này) — **chuỗi
  INSIDE mới dài 2 lần liên tiếp (#103?, #104?)**, chờ
  T2-143 xác nhận bằng dải chuẩn của mình (nếu T2 dùng
  FULL78/79 sau khi merged chứng nhận thêm gap, p10/p90 có
  thể dịch vài giây như tiền lệ — verdict INSIDE là vững:
  01:55:25Z nằm sâu trong dải, cách cả hai cận >20 phút).
- Tốc độ reboot tới #104?: 104 / 197,62 h = **1 mỗi 114,0
  phút** (tới #101?: 101 / 194,25 h = 1 mỗi 115,4 phút —
  chênh 1,4 phút/boot, trong nhiễu). Không có thay đổi chế
  độ. (Tính bằng code: từ #1 2026-11-10T20:18:10Z tới
  #104? 2026-11-19T01:55:25Z = 197,62 h.) Cộng dồn ẩn tối
  đa: +4 (mù #29/#30/#31) → 1 mỗi 109,8 phút; +3 nữa
  (mù #53 đoạn B) → 1 mỗi 106,8 phút; +2 nữa (mù #55 đoạn
  B quy ước) → 1 mỗi 104,9 phút; +1 nữa (mù #56 đoạn A quy
  ước) → 1 mỗi 104,0 phút; **+0 nữa (mù #57 ĐÓNG + mù #58
  ĐÓNG + mù #59 ĐÓNG + mù #60 ĐÓNG, tối đa 0)** → 114 /
  197,62 h = 1 mỗi 104,0 phút.

### 8.10 Dải dự báo cho boot #105? (T6 tính độc lập — chờ T2-143 công bố dải chuẩn)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 / T6-138 §8.6 /
T6-139 §8.6 / T6-140 §8.6 / T6-141 §8.8 / T6-142 §8.9 —
p10–p90 của phân phối FULL77 (p10 = 1.632 s, p90 =
8.690 s; T2-142 §2.5), cộng vào btime 70a5b0fc 01:55:25Z.
**T6 dùng FULL77** (CERT 62 / FULL 77 đã xác nhận — phân
phối hiện hành cho tới khi T2-143 chứng nhận thêm gap).

- **Dải dự báo T6 cho #105? (FULL77): [02:22:37Z,
  04:20:15Z]** (01:55:25Z + 1.632 s = 02:22:37Z;
  01:55:25Z + 8.690 s = 04:20:15Z 19/11). Tính bằng code
  (python3), không nhẩm. Biến thể CERT62: [02:21:53Z,
  04:11:26Z] (p10 1.588 s, p90 8.161 s). (Cùng dải cho
  #106? theo đếm chặt — neo cùng boot 70a5b0fc.)
- **Đối chiếu với T2: CHƯA CÓ để đối chiếu.** T2-143 prereg
  §5 chỉ công bố dải #104? (khớp đúng T6, §8.9); dải
  #105? chuẩn thuộc T2-143 sau khi merged mù #62.
- Lưu ý: cận dưới dải #105? (02:22:37Z) đã qua lúc T6 đóng
  (02:55Z) mà chưa có reboot — điều đó bình thường (dải
  p10–p90 chỉ bao 80% khối lượng, không phải cam kết).
  Dải hiệu dụng sau probe #62 (xong ~02:48Z): [02:48Z,
  04:20:15Z] (cận dưới thực tế là thời điểm probe #62 xác
  nhận boot 70a5b0fc còn sống).

### 8.11 Gap chờ chứng nhận (hai cách đánh số — T2-143 prereg §4, T6 đối chiếu số học độc lập)

- Theo nhãn brief/quyết (d) (bỏ qua b47f7932 trong dãy số):
  #102?→#103? = 3.975 s → khoảng **[3.965, 3.985] s** nếu
  đoạn A+B mù #62 đóng; #103?→#104? = 7.265 s → khoảng
  **[7.255, 7.275] s** nếu đoạn C đóng. Nếu cả hai chứng
  nhận: CERT 62→64 / FULL 77→79.
- Theo đếm chặt (mỗi boot một số, b47f7932 = #103?):
  #102?→#103? = 3.933 s → [3.923, 3.943] s nếu đoạn A
  đóng; #103?→#104? = 42 s → SPAN (đoạn B không chứng nhận
  được — §8.8(c)); #104?→#105? = 7.265 s → [7.255,
  7.275] s nếu đoạn C đóng. Nếu A + C đóng: CERT 62→64 /
  FULL 77→79 (cùng số lượng, khác giá trị gap đầu).
- T6 đã tính độc lập cả hai bộ gap bằng code (3.933 s /
  42 s / 3.975 s / 7.265 s — khớp đúng T2-143 prereg §4).
  T6 không tự chứng nhận gap nào — merged mù #62 của
  T2-143 là chứng nhận chính thức, parent quyết.

### 8.12 VERDICT: chuỗi tương đối CHỐT #57→#104? + 70a5b0fc; số tuyệt đối VẪN TẠM (giữ "?"); #102?/#103?/#104? chờ merged mù #62

- **CHỐT ĐƯỢC — chuỗi tương đối:** 44 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới 70a5b0fc (01:55:25Z 19/11)
  xếp đúng thứ tự thời gian (tính cả b47f7932 là boot quan
  sát được thứ 43, không đánh số — xem §8.8), mỗi boot có
  boot_id + btime riêng biệt (trừ mâu thuẫn full id của
  b47f7932, §8.8(b)), không có boot_id lạ nào trong bất kỳ
  bằng chứng nào ở khoảng giữa; các bước chuyển
  #74→#75→…→#102→#103→#104 đều có ≥2 nguồn độc lập xác
  nhận (T5 + T2 + T6 + T7 + T9 + T10 + file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-143 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #102?→#103? lần này có
    dị thường đồng hồ quanh 23:54Z — §8.6/§8.8 — củng cố
    rằng ranh giới cần chứng nhận ngoài VM.)
  - **Mù #57 + mù #58 + mù #59 + mù #60 ĐÃ ĐÓNG HOÀN TOÀN
    (T2-138, T2-139, T2-140, T2-141):** số #94?/#95?/#96?/
    #97?/#98?/#99? nay đã xác nhận theo quy ước (không còn
    reboot ẩn giữa #93?→#94?→…→#98?→#99?); mù #56 A vẫn
    MỞ theo quyết parent (e) — số #93? vẫn mang tính quy
    ước headline.
  - **MỚI — mù #61 KHÔNG ĐÓNG HOÀN TOÀN (quyết parent (f)
    đợt 142) + mù #62 MỚI MỞ:** T2-143 đã chạy probe #62
    (ok=2 fail=0, boot 70a5b0fc) và đã viết prereg (dự báo
    3 gap + 4 đoạn A/B/C/D + dải #104? chuẩn + cảnh báo
    xung đột đánh số + mâu thuẫn full boot_id b47f7932)
    nhưng chưa công bố merged/LIMITS/.done lúc 02:55Z. Số
    #103?/#104? là TẠM theo quyết parent (d) đợt 142 — gap
    #102?→#103? / #103?→#104? vẫn CHỜ chứng nhận bằng
    merged; số #102? là TẠM THỜI và còn NGOÀI dải tạm (dưới
    p10, §8.9 T6-142) — nếu đoạn A+B+C đóng (tối đa 0 ẩn
    theo nhãn parent) thì 70a5b0fc CHÍNH LÀ #104? (theo quy
    ước); nếu A/B/C MỞ thì số có thể cao hơn. T6-143 chốt
    chuỗi TƯƠNG ĐỐI (70a5b0fc là boot quan sát được tiếp
    theo sau 9afdaa89, không có boot quan sát được nào ở
    giữa) — số thứ tự tuyệt đối #102?/#103?/#104? chờ
    verdict của T2-143. **Ghi rõ "chờ T2" theo brief; T10
    gộp.**
- **Kết luận cho parent:** T6-143 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 2 boot (#103? — reboot #28 giữa lượt
  142; #104? — reboot #29 trong lúc đóng sổ đợt 142, cộng
  boot trung gian b47f7932 không đánh số); số thứ tự tuyệt
  đối **vẫn TẠM** và phải giữ "?" cho tới khi có bằng chứng
  ngoài VM (và, riêng #102?/#103?/#104?, tới khi mù #62
  đóng + xung đột đánh số (c)/(d) được quyết). Không bịa
  số, không bỏ "?" khi chưa đủ bằng chứng — đúng như brief
  giao.
- Hệ quả thực hành: T9-143 gọi boot lúc mở là "#104?"
  trong LIMITS của mình là đúng quy ước tạm; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #27/#28 cho reboot đôi, sự kiện #29 cho reboot
  trong lúc đóng sổ 142 — theo aggregate đợt 142 §12.2(c)).
  Các quyết parent trước vẫn đứng: không quyết con số tuyệt
  đối nào ở đây.

### 8.13 Reboot #29 — không mất việc của luồng T6; T6 không bị cắt

- Reboot 9afdaa89 → 70a5b0fc (btime 01:55:25Z) xảy ra trong
  lúc T10-142 đóng sổ, trước khi đợt 143 mở (02:35:51Z) —
  **không giết attempt hay holder lock nào của đợt 143**
  (đợt 143 mở sau đó, trên boot mới; T4-143 poll-wait bắt
  đầu 02:42Z trên boot mới).

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **02:40:49Z** (boot 70a5b0fc đã 45'24"
  tuổi); đóng **02:55:01Z** (boot 70a5b0fc đã ~59'36" tuổi).
  Đợt 143 mở **02:35:51Z** (round-in-progress.md) — tức
  **2.426 s sau btime boot 70a5b0fc (01:55:25Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — giả thuyết
  "scheduler ghi lại started_at khi hồi phục sau reboot"
  ĐÃ ĐƯỢC XÁC NHẬN đợt 134 (lần thứ 5 liên tiếp, +6.967
  s, = btime + 40 s), tái diễn đợt 135 (lần thứ 6, +36 s),
  đợt 136 (lần thứ 7), đợt 137 (lần thứ 8 — bằng chứng
  trực tiếp ĐẦU TIÊN, started_at = btime + 46 s), đợt 138
  (lần thứ 9, btime + 50 s), đợt 140 (lần thứ 10 —
  T10-140: started_at lượt 140 nay 17:53:45Z = btime
  90392aa5 + 49 s), đợt 141 (lần thứ 11 — T7-141:
  started_at lượt 141 viết lại lần 1 (btime + 32 s, bằng
  chứng trực tiếp thứ 5) và lần 2 offset +34 s sau đính
  chính 936 s) và đợt 142 (lần thứ 12 + 13 — T7-142:
  started_at lượt 142 viết lại lần 1 (btime 9afdaa89 +
  37 s) và lần 2 (btime 70a5b0fc + 32 s)).
- **Quan sát mới T7-143 kiểm lần 1 (~02:43Z, T6 chỉ ghi
  mốc, không kết luận — T7 là chủ quản):** run 143
  (`b6c4b22d`) sched = started = **02:35:51Z, jitter 0 s,
  running, KHÔNG viết lại** (boot không đổi 70a5b0fc từ
  01:55:25Z; không có reboot trong lúc run 143 chạy tới
  nay — đúng dự báo của T2-143 prereg: run mở SAU boot
  nên không kỳ vọng viết lại tại boot này). Run 142
  (`eddb1710`) nay đã `succeeded`, finished 02:34:13Z;
  started_at VẪN **01:55:57Z** — KHÔNG viết lại lần 3
  (boot không đổi, run đã finished trước khi lượt 143 bắt
  đầu). Run 141 started_at vẫn 22:48:39Z = btime(bde599df)
  + 34 s — không đổi; run 140 vẫn 19:54:43Z; run 139 vẫn
  15:55:16Z. KHÔNG run cũ nào bị viết lại thêm.
- **F104? (chủ quản T2-143 — T6 chỉ ghi số thô, không kết
  luận):** `f104.txt` của T2-143 (02:48:52Z): HTTP `Date`
  3 server hơn local +1/+0/+1 s theo quy ước `Date −
  local_after` của T2 (example.com 02:48:53 vs local
  02:48:52; google.com 02:48:53 vs 02:48:52/53; cloudflare
  02:48:54 vs 02:48:53). T2-143 prereg dự báo F104? ≈ −1 s
  tới −2 s theo quy ước ngược (`Date − local_before` sẽ
  cho +1/+1/+2 — số liệu thô giống hệt nhau, chỉ khác quy
  ước; offset thật nằm giữa hai cách tính, khoảng ±1–2 s).
  T6 không đo F, không kết luận — chờ verdict T2-143.
  F103? (9afdaa89) CHƯA ĐO (T2-142 không đo HTTP Date trên
  boot đó) — ghi rõ, không bịa.

## 10. Dọn Xvfb: 0 Xvfb chạy; 0 socket sót

- **Lúc mở (02:40Z): 0 Xvfb đang chạy** (`pgrep -x Xvfb`
  rc=1; quét `ps-full-open.txt` không có process nào tên
  Xvfb). **`/tmp/.X11-unix/` TRỐNG** (x11-open.txt).
- **Lúc đóng (02:55Z): 0 Xvfb đang chạy** (pgrep rc=1),
  quét `ps-full-close.txt` không có process nào tên Xvfb.
  **`/tmp/.X11-unix/` vẫn TRỐNG** (x11-close.txt).
- **Socket X193/X194/X195 của T10-142 ĐÃ BIẾN MẤT** — T10
  đã dọn tay 02:27:12Z (sau khi suite/O8 xong) + reboot #29
  xóa /tmp; thư mục /tmp/.X11-unix mtime 02:27Z (không đổi
  giữa lúc mở và lúc đóng của T6 — không có file nào được
  tạo/xóa trong đó trong phiên T6). Không còn gì để dọn;
  T6 không xóa gì (không có file nào của tiến trình khác
  để xóa). T8-143 chưa chạy harness lúc T6 đóng.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-143; T2-143
  boot-verify ghi MemAvailable 2.138.544 kB lúc 02:48:41Z
  — số RAM thuộc T2, T6 chỉ ghi bối cảnh; T4-143 poll #9–
  #17 ghi RAMavail 1.342 → 1.968 → 1.530 MB dao động — xem
  §11; headroom thuộc T9).

## 11. Tuân thủ lock của luồng đo đợt 142 ĐÃ kiểm được + đợt 143 tới nay

- **T4-142 acquire + release sạch ×3** (00:00:55Z →
  00:20:38Z; holds 209/212/206 s; port 5187; wait_s 0/1/0;
  ticket khớp log). **Lượt yên WebKit #18 HỢP LỆ ở
  attempt3** (T4-142 LIMITS: 20/20 pass, tickCost median
  49,0 ms ≤60 ms; cộng dồn 15 lượt hợp lệ). T4 dùng script
  repo (`run-attempt-142.sh` dòng 13, `LOCKV2=.../vcut-
  vite-lock-v2.sh`) — tức chạy trên **thứ tự ghi mới**
  (§3).
- **T8-142 acquire + release sạch ×6** (00:30:32Z →
  00:46:19Z; holds 70/140/240/70/121/230 s; ports 5390/
  5490; 5 chu kỳ wait_s=15/16 qua cooldown, 1 chu kỳ
  wait_s=0; ticket khớp log). T8 dùng script repo
  (`run-webkit-142t8.sh` dòng 33, `LOCK=.../vcut-vite-
  lock-v2.sh`) — tức chạy trên **thứ tự ghi mới** (§3).
  Đây là các lần chạy kiểm chứng vá watchdog (102 evaluate
  đã wrap + driver im lặng >120 s) — 0 kẹt thật đợt 142
  nên vá chưa được thử bằng kẹt thật (quyết parent (j)
  đợt 142: giữ nguyên bản vá, chờ kẹt thật sau).
- **T10-142 acquire + release sạch ×2** (02:01:30Z →
  02:04:14Z; holds 64/58 s; port 5554; wait_s 0/1; ticket
  khớp log — suite 27/27 + O8 Chromium 21/21 + O8 WebKit
  FAIL 2 attempt trên boot 70a5b0fc). T10 dùng bản frozen
  `round142-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
  (aggregate đợt 142 §10.3 kiểm trực tiếp) — tức chạy trên
  **thứ tự ghi mới** (§3).
- **Tổng kết đợt 142: 11/11 chu kỳ sạch, trên thứ tự ghi
  mới** — 53 chu kỳ liên tiếp sạch kể từ lúc T6-135 đóng
  (§3). **Đợt 143 tới 02:55Z: 0/0 chu kỳ.**
- **T4-143 acquire + release sạch ×0 tới 02:55Z** — poll-
  wait đang chạy từ 02:42Z (poll #17 02:54:34Z), gate
  postboot CHƯA ĐẠT (flag T5 vẫn là bản cũ của đợt 142 —
  `t5src=142-t5/POSTBOOT_PASS`, `postboot_exit=1`; T5-143
  đang repair boot 70a5b0fc — process `--repair` chạy lúc
  T6 đóng; RAMavail dao động 1.342 → 1.968 → 1.530 MB qua
  các poll #6–#17; blockers 0 từ poll #7; load1 0,19–3,62).
  **Lượt yên #19 CHƯA ĐO ĐƯỢC tới lúc T6 đóng** — T4-143
  vẫn đang chờ gate postboot; không phải lỗi lock. T4-143
  sẽ acquire bằng script repo (`run-attempt-143.sh` — T6
  không kiểm md5 của file này vì T4 chưa acquire; lúc
  acquire T6 đợt sau kiểm).
- **T8-143 chưa chạy harness tới lúc T6 đóng** (đang chờ
  T4/T5 — `wait-t4-t5-143t8.sh`); T10-143 đã chuẩn bị bản
  frozen md5 `520b8baa` (§3) nhưng chưa chạy suite/O8.
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Đường dẫn đúng `apps/web/src/preview.tsx`.
- **O8 WebKit FAIL đợt 142 (giao T5+T8 đợt 143 điều tra —
  quyết parent (b) đợt 142):** S1 FAIL + `Target crashed`,
  exit=2, 2 attempt giống hệt trên boot 70a5b0fc ~7 phút
  tuổi — không liên quan lock (lock của T10-142 sạch ×2,
  §4; suite 27/27 trên cùng boot). T6 không điều tra O8.

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-143-T6-1 (mới, xem dưới).**
  Không có sai số đếm nào của T6 đợt này: số mở của T6
  khớp đúng số brief giao + số T10-142 đếm lúc đóng
  (1075 thô / 1069 chính thức, từng loại khớp đúng).
- **F-143-T6-1 — Xung đột đánh số (c)/(d) + mâu thuẫn full
  boot_id b47f7932 (mới, T2-143 prereg phát hiện, T6 ghi
  lại + đối chiếu độc lập — xem §8.8):** quyết (c) xác
  nhận b47f7932 là boot thật (2 sự kiện #27+#28) nhưng
  quyết (d) đánh số 9afdaa89 = #103? (ngụ ý reboot đôi = 1
  bước số) — hai quyết không thể cùng đúng theo định nghĩa
  "mỗi boot một số tiếp theo". Thêm: T7 và T9 KHÔNG đồng
  nhất full boot_id của b47f7932 (T7:
  `...-447e-a015-0a6c160efd98`; T9:
  `...-4205-86a0-b71a0ab9790c` — chỉ prefix + btime đồng
  nhất), nên tiền đề "cùng boot_id" của quyết (c) thực ra
  chỉ là cùng prefix + btime. **T6 không tự chọn phe,
  không tự đánh số lại:** dùng nhãn parent (d) trong bảng
  + ghi rõ biến thể đếm chặt; giao T2-143 + T10/parent
  quyết. **Không ảnh hưởng kết luận lock:** chỉ là nhãn
  hồ sơ; chuỗi boot tương đối + btime không đổi.
- **F-142-T6-1 (cũ, đã giải quyết ở đợt 142):** mâu thuẫn
  nhãn reboot #25/#26 — aggregate đợt 142 §12.2(c) đã chốt
  #26 theo cách đếm của T10 (mỗi lần đổi boot_id là 1 sự
  kiện, kể cả reboot trong lúc đóng sổ). Không lặp lại ở
  đợt này: T6-143 ghi đúng sự kiện #27/#28/#29 theo chốt
  đó.
- **F-142-T6-2 (cũ, đã khắc phục):** grep "KHÔNG NHẢ" lần
  đầu trả 33 dòng do chưa loại file grep-output. T6 đợt
  này loại `khong-nha-grep.txt` + file repro của mình
  NGAY từ lần đầu (§5: 15 dòng thô → 12 dòng chuẩn sau
  khi loại 3 dòng repro của chính mình) — không lặp lại.
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
  Không lặp lại ở đợt này: T6-143 ghi đúng boot sống
  70a5b0fc (khớp T2-143 boot-verify + probe #62 +
  T7-143 NOTES kiểm lần 1).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn; tổng 17 không đổi. T6-143 đã đếm lại đúng (§5:
  trích dẫn = 0 — các file `.done` của T6 viết không dấu
  nên không khớp pattern có dấu; đã giải thích phương pháp
  ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **Số hiệu boot mới (#102?/#103?/#104?) VẪN TẠM (xem §8.12):**
  chuỗi tương đối #57→#104? + 70a5b0fc đã chốt (44 boot,
  tính cả b47f7932 không đánh số); số tuyệt đối giữ "?"
  vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa 6, mù
  #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới #123); (b)
  mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51 đoạn B mở,
  tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng không làm
  neo được; (e) dị thường đồng hồ #84?→#85? (§8.4(b) đợt
  134) + dị thường đồng hồ quanh 23:54Z (§8.6/§8.8); **(f)
  MỚI: mù #61 không đóng hoàn toàn + mù #62 mới mở — số
  #102?/#103?/#104? + gap #102?→#103? / #103?→#104? chờ
  verdict T2-143; xung đột đánh số (c)/(d) chưa quyết
  (F-143-T6-1); mù #56 A vẫn MỞ (quyết parent (e)) — số
  #93? cũng vẫn quy ước headline**. Journal/wtmp chỉ giữ
  boot hiện tại (journal `--list-boots` chỉ 1 dòng
  70a5b0fc; wtmp bắt đầu 01:55:36Z) nên T6 suy ra số hiệu
  từ thứ tự thời gian + hồ sơ các đợt trước, không phải từ
  log hệ thống.
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
  **mù #62 MỚI MỞ** (T2-143 đang điều tra; probe #62 xong
  ok=2 fail=0, prereg đã viết nhưng merged/LIMITS/.done
  chưa có lúc T6 đóng); mù #52 đã đóng hoàn toàn (T2-133);
  mù #54 đã đóng hoàn toàn (T2-135).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  chín liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round141-t*/` (toàn đợt) +
  `round142-t*/` (toàn đợt) + `round143-t*/` tới 02:55Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T8/T10-143 chưa chạy xong tới thời điểm đếm; T6
  đợt 144 đếm tiếp.
- **Prune cooldown lần 18 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 94 ≤ trần 100 lúc chạy). File
  cũ nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z,
  theo `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 142 khép sạch trên lock (§4):** 11 chu kỳ (t4-142 ×3
  + t8-142 ×6 + t10-142 ×2) sạch — T6 đợt này đếm bổ sung
  11 chu kỳ sau khi T6-142 đóng, khớp đúng recount T10-142;
  **đợt 143 tới 02:55Z có 0 chu kỳ** (T4-143 chưa acquire
  — gate postboot chưa đạt, T5-143 đang repair). Không phải
  bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 02:55Z (trống, 0 ticket + 94 cooldown); đợt
  còn chạy tới ~05:30Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–142 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 53 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt boot 70a5b0fc chưa có verdict đầy đủ** (thuộc
  T5-143 — xem §8.0/§11; T5 đang repair lúc T6 đóng,
  `dpkg_lines=2` theo poll T4).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- **T2-143 CHƯA XONG lúc T6 đóng (02:55Z):** probe #62 xong
  (ok=2 fail=0) và prereg + boot-verify + f104 + dpkg104
  đã viết (dự báo 4 đoạn A/B/C/D + dải #104? chuẩn +
  cảnh báo xung đột đánh số + mâu thuẫn full boot_id
  b47f7932) nhưng merged/LIMITS + .done chưa có. Theo
  brief, T6 ghi rõ "chờ T2" và để T10 gộp — KHÔNG tự suy
  đoán số boot #102?/#103?/#104?, không tự chứng nhận gap
  #102?→#103? / #103?→#104?, không tự chốt khung chết
  #102?/9afdaa89 cuối cùng. T6 chỉ ghi thêm quan sát quét
  mtime của mình (§8.6–§8.7) để T2-143 cân nhắc.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND143_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t8-round142` + `cooldown-t10-round142`
do release hợp lệ của t8/t10-142 — xem §3), Xvfb (0
process; 0 socket sót — X193/X194/X195 của T10-142 đã
được T10 dọn tay 02:27:12Z, T6 không xóa gì).
Stage: `repo-1-push/paths-loop/phase9-round143-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round143-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, x11-open.txt, x11-close.txt,
boot-verify-open.txt, analyze-log-cleaned-open.txt,
vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-close.log, vite-lock-v2-raw-open.log,
vite-lock-v2-raw-close.log, analyze-log.py,
cooldown-now-open.txt, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg-fixed.sh, repro-newmsg-fixed143.sh,
repro-newmsg.log, scan-mtime-143.py, scan-mtime-143.txt).
