# PHASE9 ROUND144 T6 — lock health + prune lần 19 + chuỗi INSIDE: 4 theo dải đã công bố, 2 theo đếm chặt (F-144-T6-1) + gap T2-144 lệch 60 s (F-144-T6-2) — LIMITS

- Đợt: 144, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 12:35 +07 19/11/2026 (= 05:35:51Z 19/11). Chạy
  05:38:22Z → 05:49:08Z 19/11/2026, toàn bộ trên một boot duy
  nhất 691a7403 (ứng viên #106? đếm chặt) — KHÔNG có reboot
  trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune lần 19, suite kiểm lock 9/9
  ×2, chốt chuỗi boot với boot 691a7403 (btime 03:55:45Z),
  kiểm mâu thuẫn full boot_id b47f7932 (T7 vs T9, F-143-T6-1)
  nếu còn dữ kiện mới — không quyết bên nào đúng nếu không
  đủ bằng chứng, chỉ ghi nhận (quyết parent (g) đợt 143: ĐỂ
  MỞ), kiểm Xvfb sót, ghi mọi sai số F-144-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round144-t6/` (status-open.txt,
  status-close.txt, status-mid.txt, ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-close.txt, time-open.txt,
  time-close.txt, wc-open.txt, analyze-log-cleaned-open.txt,
  vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-close.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, analyze-log.py,
  cooldown-now-open.txt, cooldown-now.txt,
  prune-candidates.txt, prune-deleted.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg-fixed.sh,
  repro-newmsg-fixed144.sh, repro-newmsg.log,
  scan-mtime-144.py, scan-mtime-144.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 691a7403 (ứng viên #106? đếm chặt; xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `691a7403-512b-4055-bb55-de0d7516eeeb`, btime 03:55:45Z**
  (`/proc/stat` btime epoch 1795060545; `uptime -s` =
  03:55:45Z; `who -b` = Nov 19 03:55; `/proc/1` 03:55:55Z —
  chênh +10 s, cùng mẫu các boot trước; `journal --list-boots`
  chỉ 1 dòng 691a7403, first entry 03:55:55Z (boot +10 s);
  `wtmp` bắt đầu 03:55:55Z). Uptime ~1h42'37" lúc T6 bắt đầu
  (05:38:22Z), ~1h53'23" lúc đóng (05:49:08Z). Đây là boot sau
  **reboot #30** (70a5b0fc → 691a7403, trong lúc T10-143 chờ
  cờ — theo aggregate đợt 143 §10.2).
- **KHÔNG có mâu thuẫn btime lần này:** brief,
  `round-in-progress.md` và T2-144 prereg đều ghi btime
  03:55:45Z. T2-144 `boot-verify.txt` khớp đúng boot_id +
  btime; T7-144 NOTES (mở ~05:39Z) khớp đúng boot_id +
  btime + epoch; probe #63 của T2-144 (`once.txt`:
  `probe#63 boot=691a7403 ok=2 fail=0`) xác nhận boot đang
  sống. Ba luồng khớp nhau hoàn toàn (T6 + T2 + T7).
- **Đợt 144 mở 05:35:51Z** (round-in-progress.md; sched
  05:35:51Z) — tức **6.006 s sau btime boot 691a7403
  (03:55:45Z)**. T6 mở 05:38:22Z (6.157 s sau btime).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline. preview.tsx md5 `530e10a7`.
- Các luồng đợt 144 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round144-t1/t2/t4/t5/t7/t8/t9/t10; T1-144 đã
  đóng cờ (PASS, verify đợt 143); T2-144 đã viết prereg +
  boot-verify + f105 + probe #63 (ok=2 fail=0, boot
  691a7403) nhưng CHƯA viết merged/LIMITS/.done lúc T6 đóng
  — T6 đối chiếu ở §8 với prereg-t2.md + f105.txt +
  once.txt; T5-144 đã viết POSTBOOT_PASS cho boot mới lúc
  05:43:07Z (§11); T8-144 đã chạy O8 xong (§11); T4-144
  đang chạy lượt yên #19 (attempt 1 xong 05:47:40Z,
  attempt 2 bắt đầu 05:48:15Z — §11); T10-144 đang chờ cờ
  (missing tất cả lúc 05:42Z).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật lúc mở và lúc đóng — 0 cổng lạ

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 05:38Z
  (mở, `ps-full-open.txt`) và lúc 05:48Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (05:38Z) và lúc đóng (05:48Z): 0 tiến trình
  vite/node/webkit thật, 0 tiến trình lock-script, 0 Xvfb**
  (xem §10). `ss -tlnp` lúc mở và lúc đóng đều chỉ còn dòng
  header (không cổng nào lắng nghe).
- Snapshot đóng (05:48:06Z) rơi vào cửa sổ 25 s giữa hai
  attempt của T4 (attempt 1 nhả 05:47:40Z, attempt 2 acquire
  05:48:15Z) — lock genuinely trống tại thời điểm snapshot,
  không phải do T4 đã dừng (xem §2/§11).

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; 2 chu kỳ mới trong phiên T6 (đều sạch)

- **Lúc mở (05:38:33Z): thư mục lock thật
  `hidden_files/vite.lock` KHÔNG TỒN TẠI** — status
  `TRỐNG (không có lock)`, `0 ticket + 96 cooldown`, rc=0.
- **Lúc đóng (05:48:06Z): lock TRỐNG** — status `TRỐNG`,
  `0 ticket + 97 cooldown`, rc=0.
- **Log lock +6 dòng trong phiên T6: 1104 dòng thô lúc mở →
  1110 dòng thô lúc đóng** — đúng 2 chu kỳ mới, đều sạch:
  - t8-round144 ×1 (05:41:10Z → 05:43:53Z; hold 163 s;
    port 5560; wait_s=0; TICKET + ACQUIRED + RELEASED),
  - t4 ×1 (05:44:12Z → 05:47:40Z; hold 208 s; port 5187;
    wait_s=0; TICKET + ACQUIRED + RELEASED).
  - Không có COOLDOWN mới trong 2 chu kỳ này (cả hai đều
    wait_s=0); file cooldown mới duy nhất là
    `cooldown-t8-round144` (mtime 05:43:53Z — ghi đè cùng
    tên sau release của t8; tổng queue 96 → 97, §7).
- Bản đã lọc lúc đóng md5 `d7707847…` (1104 dòng) — khác
  bản đã lọc lúc mở (1098 dòng) đúng 6 dòng mới; bản thô
  lúc đóng md5 `19cadf3b…`.
- Khoảng yên trước đó: không có event lock nào từ 05:27:01Z
  (t10-143 release cuối) tới 05:41:10Z (t8-144 acquire) —
  yên lặng này là do đợt 143 đã đóng và đợt 144 mới mở —
  không phải do lock kẹt (bằng chứng: suite độc lập 9/9 ×2,
  §6; 8 chu kỳ đợt 143 sau T6-143 đóng đều sạch, §4).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 63 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 10 chu kỳ mới kể từ
  lúc T6-143 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4):
  - t8-round143 ×7 (03:58:12Z → 05:07:14Z; holds 173 / 70 /
    131 / 240 / 60 / 120 / 230 s),
  - t10-round143 ×1 (05:25:19Z → 05:27:01Z; hold 102 s),
  - t8-round144 ×1 (05:41:10Z → 05:43:53Z; hold 163 s),
  - t4 ×1 (05:44:12Z → 05:47:40Z; hold 208 s).
  - Cộng với 53 chu kỳ T6-143 đã đếm = **63 chu kỳ liên
    tiếp sạch trên thứ tự mới**.
  - Bằng chứng phiên bản: T8-143 dùng script repo
    (`run-webkit-143t8.sh` dòng 33: `LOCK=.../vcut-vite-
    lock-v2.sh`); T10-143 dùng bản frozen
    `round143-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
    (T6 kiểm trực tiếp đợt này); T8-144 dùng script repo
    (`run-webkit-144t8.sh` dòng 33); T4 dùng script repo
    (`run-attempt-144.sh` dòng 13: `LOCKV2=.../vcut-vite-
    lock-v2.sh`) — tức tất cả đều chạy trên **thứ tự ghi
    mới** (§11).
- **File `cooldown-t8-round144` mtime 05:43:53Z** (release
  của t8-144); file `cooldown-t10-round143` mtime 05:27:01Z
  (release cuối của t10-143); `cooldown-t8-round143` mtime
  05:07:14Z (release cuối của t8-143). Không file cooldown
  nào mới trong phiên T6 ngoài `cooldown-t8-round144` (do
  release hợp lệ của t8-144 — xem §2).
- **T10-144 chưa chuẩn bị bản frozen** lúc T6 đóng (thư mục
  round144-t10 chỉ có count-final-144.py + wait-flags) —
  T6 đợt sau kiểm md5 khi T10 chuẩn bị.

## 4. Nhất quán log lock: 1098 dòng chính thức lúc mở → 1104 lúc đóng, 319 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z,
dòng 848–853 thô — T6 đợt này xác minh lại bằng multiset
diff trên cả hai snapshot: đúng 6 dòng đó là phần chênh
giữa raw và bản đã lọc, gồm 2 TICKET + 2 ACQUIRED +
2 RELEASED).
Bản đã lọc lúc mở có 1098 dòng; lúc đóng có 1104 dòng —
**KHỚP ĐÚNG số T10-143 đếm lúc đóng đợt 143 (aggregate
§10.4: thô 1104 / chính thức 1098; TICKET 334/332,
ACQUIRED 325/323, RELEASED 319/317, COOLDOWN 111,
TIMEOUT 8, STALE-LOCK 6, STALE-TICKET 1)** và KHỚP ĐÚNG
số brief giao cho T6 đợt này — ba nguồn độc lập đồng thuận
về số lúc mở.

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-143 (1069) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 334 | 324 | 243 | 237 |
| ACQUIRED | 325 | 315 | 243 | 237 |
| RELEASED | 319 | 309 | 241 | 235 |
| COOLDOWN | 111 | 106 | 103 | 98 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **1104** | **1069** | **831** | **808** |

- So với snapshot T6-143 đóng (1069 dòng): **+35 dòng =
  TICKET +10 / ACQUIRED +10 / RELEASED +10 / COOLDOWN +5 /
  TIMEOUT +0 / STALE +0** — đúng bằng 10 chu kỳ mới (§3):
  t8-round143 ×7 = 26 dòng (7×3 T/A/R + 5 COOLDOWN — 5
  chu kỳ có wait_s=15/16, 2 chu kỳ wait_s=0: O8 03:58
  wait 0 + harness 04:51 wait 0) + t10-round143 ×1 = 3
  dòng (T/A/R, wait_s=0 — 0 COOLDOWN) + t8-round144 ×1 =
  3 dòng (T/A/R, wait_s=0) + t4 ×1 = 3 dòng (T/A/R,
  wait_s=0). Mọi chu kỳ đều sạch, ghép cặp đủ — khớp từng
  con số, không có event nào mất dấu hay thêm lạ ngoài ca t4
  cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 1104 dòng): **319 cặp ACQUIRED→RELEASED;
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
- Cửa sổ R120: **243 = 243 T/A, RELEASED 241** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  334+325+319+111+8+6+1 = 1104 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 143 khép lại trên lock (toàn đợt): 8 chu kỳ sạch**
  — t8-143 ×7 (holds 173/70/131/240/60/120/230 s — O8
  chạy lại sau repair + harness 6/6 KHÔNG QUA GATE, xem
  §11) + t10-143 ×1 (hold 102 s — suite + O8). T6-143 lúc
  đóng mới thấy 0 chu kỳ; 8 chu kỳ này T6 đợt này đếm bổ
  sung, khớp đúng recount T10-143 (log 1104 dòng thô lúc
  T10-143 đóng sổ 05:27:01Z).
  **Đợt 144 tới 05:48:06Z có 2 chu kỳ** (t8-144 ×1 +
  t4 ×1 — attempt 1 lượt yên #19). T4 attempt 2 bắt đầu
  05:48:15Z, sau snapshot đóng của T6 — T6 đợt 145 đếm
  tiếp. Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 142 (toàn đợt), đợt 143 (toàn đợt) và đợt 144 (tới 05:48Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round142-t*/` + `round143-t*/` +
`round144-t*/` (tới 05:48Z) — theo quy tắc lăn: bỏ round141,
thêm round143 (phần còn lại sau T6-143) + round144. **Phương pháp đếm đợt này:
grep ra file /tmp trước, `--exclude` file grep-output
(`khong-nha-grep.txt`) NGAY từ lần đầu + loại file repro
của chính T6 đợt này (`round144-t6/repro-newmsg.log`, 3
dòng — đếm ở đợt 145)** (theo bài học F-142-T6-2: không
đếm lồng file grep-output; bài học T6-138 §5).
**Lưu ý phương pháp:** pattern grep có dấu (`KHÔNG NHẢ` /
`BỎ QUA release thừa`) — các file `.done` của T6 viết bằng
ASCII không dấu (`"KHONG NHA"`) nên KHÔNG khớp pattern này.
**Lưu ý sai số phương pháp đã sửa ngay trong phiên
(F-144-T6-3):** lần grep đầu T6 dùng `--exclude=repro-
newmsg.log` (khớp theo basename) nên loại luôn cả file
repro của T6-142/T6-143 — kết quả 4 dòng là SAI (thiếu
6 dòng repro). T6 phát hiện ngay, chạy lại KHÔNG loại
repro theo basename mà trừ tay 3 dòng repro của chính
mình — kết quả chuẩn 10 dòng dưới đây. File grep-output
cuối cùng là bản chạy lại đúng.
Tổng **10 dòng khớp chuẩn, phân loại đủ 10/10 — tất cả
đều là bản sao script / log repro, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round142-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round143-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 6 | `round142-t6/repro-newmsg.log` + `round143-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 0 | Không file `.done` nào trong phạm vi khớp pattern có dấu (các file `.done` của T6 viết không dấu) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 142 (toàn đợt) / 143 (toàn đợt) / 144 nào |
| Round144-t* (trừ repro /tmp của T6) | 0 dòng | T10-144 chưa chuẩn bị bản frozen script; chưa có driver log nào khớp |

- **Repro đợt này (chưa đếm, đếm ở đợt 145):**
  `round144-t6/repro-newmsg.log` 3 dòng (2 `BỎ QUA` +
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
  đợt), đợt 141 = 0 (toàn đợt), đợt 142 = 0 (toàn đợt),
  đợt 143 = 0 (toàn đợt — bổ sung 8 chu kỳ sau T6-143
  đóng, §4), đợt 144 tới 05:48Z = 0.** Khớp với log pairing sạch ở §4 (319 cặp +
  1 ca reboot-kill cũ đã giải thích — không liên quan nhánh
  release).
- Giới hạn phạm vi: T4/T8/T10-144 chưa chạy xong tới 05:48Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  144, T6 đợt 145 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-143 đếm 12 dòng (6 script + 6
  repro); đợt này bỏ round141 (−2 script −3 repro = −5)
  nhưng thêm round143-t6 repro (3) = +3 → 12 − 5 + 3 =
  **10 dòng** ✓ (round144-t10 chưa có script frozen nên
  +0).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
691a7403 (`#106?` đếm chặt).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round144-t6/test-v2-t6-run1.log` ~05:42Z,
`test-v2-t6-run2.log` ~05:43Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ hai mươi liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — hai mươi lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ hai mươi sáu liên tiếp (T6
  đợt 120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 143 + T6
  đợt 144).

### 6.2 Repro message ĐÚNG (`round144-t6/repro-newmsg.log`, 05:43:21Z)

Copy verbatim script của T6-143, chỉ đổi tên TDIR
(`vcut-t6r143-repro` → `vcut-t6r144-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–143, kết quả giống hệt:
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
  lúc đó có 96 cooldown; log thật vẫn 1106 dòng thô lúc
  repro chạy và queue vẫn 96 file sau khi repro xong;
  không có file `cooldown-tA/tH/tB` nào xuất hiện trong
  queue thật. **F-132-T6-1 KHÔNG lặp lại.**
- **Lưu ý quan sát phụ (không phải sai số):** status trong
  repro lúc C hiện `vite bất kỳ đang chạy: pid=35384 node
  ... vite.o8.config.mjs --port 5554` — đó là vite O8
  WebKit của chính T8-144 (bắt đầu 05:43:04Z, trong lúc
  T8 giữ lock port 5560 — xem §11), đã thoát cùng release
  05:43:53Z (`curl5560=000000 curl5554=000000` sau release
  theo log T8). Không phải vite sót.
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (319 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy nhất do reboot
  giữa lượt (đợt 130), 0 sự kiện "KHÔNG NHẢ" trên lock thật
  đợt 120–143 (toàn đợt) và đợt 144 (tới 05:48Z), suite 9/9
  độc lập ×2 lần chạy (T7 xanh cả hai lần), và thứ tự ghi
  mới đã có **63 chu kỳ thật** chứng minh (§3). **Không còn
  caveat nào về mất dòng RELEASED cho các chu kỳ mới** —
  caveat cũ chỉ còn là 1 dòng lịch sử (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **2 chu kỳ lock mới trong
  phiên T6 đều sạch** (t8-144 O8 + t4 attempt 1 lượt yên
  #19); T4 attempt 2 bắt đầu sau snapshot đóng — T6 đợt
  145 đếm tiếp.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 19 liên tiếp)

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
  - 05:48Z: lock TRỐNG (status 0 ticket + 97 cooldown —
    kiểm 2 lần: lúc snapshot đóng + kiểm lại ngay trước
    prune) — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng) — tổng 97 file ≤ trần mềm 100 nên điều (b) cũng
    không kích hoạt.
  - **Kết quả prune đợt 144: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 19 liên tiếp prune xóa 0 file
    (đợt 126–144: 0 mỗi đợt).
  - Lưu ý: 1 file cooldown mới trong phiên T6
    (`cooldown-t8-round144`, do release hợp lệ của t8-144,
    §2/§4). Số file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (05:38Z) **96 file / 1344 byte**;
  lúc đóng (05:48Z) **97 file / 1358 byte** (97 × 14 =
  1358 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 96 + 1 = 97 ✓ (1 file cooldown mới:
  `cooldown-t8-round144`; `cooldown-t4` ghi đè cùng tên
  nên không tăng tổng — T4 đã có file cooldown từ đợt
  142). Không file nào bị xóa hay thêm giữa hai lần đếm
  của đợt này ngoài file trên.
- Phân tầng tuổi lúc 05:48Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 32 file** (không đổi so với đợt 143 —
  không file nào vượt 72h trong khoảng 02:46Z → 05:48Z);
  **≥48h (`-mtime +1`): 65 file** (tăng từ 60 đợt 143 —
  5 file mtime 17/11 02:46Z–05:48Z vừa vượt 48h, đúng quy
  luật tuổi). File cũ nhất
  `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 05:48Z mới **~107h07' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#106? + 691a7403; số tuyệt đối VẪN TẠM; F-144-T6-1 (chuỗi INSIDE: 4 hay 2?) + F-144-T6-2 (gap T2-144 lệch 60 s)

### 8.0 Reboot #30 — 70a5b0fc → 691a7403 (btime 03:55:45Z), giữa lượt 143

- Reboot 70a5b0fc → 691a7403 (btime 03:55:45Z) xảy ra giữa
  lượt 143 (trong lúc T10-143 chờ cờ, ~03:55:45Z; vòng chờ
  cờ đầu của T10 bị SIGTERM cùng lúc — F-143-T10-1; sampler
  vòng 1 của T9 bị SIGTERM cùng lúc) — **sự kiện #30** theo
  đánh số của aggregate đợt 143 §10.2 (quy tắc đứng: mỗi
  lần đổi boot_id là 1 sự kiện, kể cả reboot trong lúc đóng
  sổ). T10-143 chạy suite + O8 trên boot mới này
  (27/27; O8 Chromium 21/21 + WebKit 21/21 — xem §11).
- **Không luồng nào mất việc do reboot này trong phiên
  T6:** T6 mở 05:38:22Z và đóng 05:49:08Z toàn bộ trên boot
  mới, không bị reboot cắt (uptime liền mạch 1h42' →
  1h53'). Reboot xảy ra trước khi đợt 144 mở (05:35:51Z).
- **Replay apt sau boot 691a7403: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-144 đã viết
  POSTBOOT_PASS cho boot mới lúc 05:43:07Z (repair=none/
  replay-full, dpkg 1545/221 — xem §11); T4 đã acquire
  được sau cờ (§11).
- **/tmp đã bị reboot xóa sạch:** socket Xvfb X193/X194/X195
  của T10-143 (do chính suite/O8 của T10 tạo, đã dọn tay
  05:21Z — aggregate đợt 143 §10.4) không còn; socket X193
  hiện tại là của T4-144 attempt 1/2 (xem §10), không phải
  sót từ đợt 143.

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1 / T6-138 §8.1 / T6-139 §8.1 /
  T6-140 §8.1 / T6-141 §8.1 / T6-142 §8.1 / T6-143 §8.1):
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

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm 691a7403 theo cách đếm chặt)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 / T6-138 §8.2 /
T6-139 §8.2 / T6-140 §8.2 / T6-141 §8.2 / T6-142 §8.2 /
T6-143 §8.2 (mỗi boot liệt kê với boot_id + btime lấy từ
≥1 nguồn độc lập; btime→btime danh nghĩa = khoảng cách
giữa hai btime liên tiếp). **Từ đợt này, số thứ tự dùng
CÁCH ĐẾM CHẶT làm chuẩn** theo quyết parent (c) đợt 143:
b47f7932 = #103?, 9afdaa89 = #104?, 70a5b0fc = #105?,
691a7403 = #106? (nhãn (d) đợt 142 bị thay thế — đều là
nhãn TẠM nên việc sửa là hợp lệ). **Định nghĩa đếm dùng:
định nghĩa gộp của T10 (LIMITS gộp đợt 133 §10.2) — mọi
reboot quanh đợt, cả giữa lượt lẫn ranh giới — theo quyết
F-133-6.** Bảng dưới chỉ ghi 7 boot cuối (chuỗi đầy đủ
#57→#99 xem T6-131 §8.2 + T6-132 §8.2 + T6-133 §8.2 +
T6-134 §8.2 + T6-135 §8.2 + T6-136 §8.2 + T6-137 §8.2 +
T6-138 §8.2 + T6-139 §8.2 + T6-140 §8.2 + T6-141 §8.2 +
T6-142 §8.2 + T6-143 §8.2 — không chép lại để khỏi drift;
T6 đợt này đã đối chiếu lại với LIMITS gộp đợt 143: các
boot #100?→#105? dưới đây khớp đúng btime/boot_id T10-143
đã chốt, không có boot_id lạ nào xuất hiện trong bất kỳ
bằng chứng 18–19/11 nào ngoài chuỗi này).

| # (tạm, đếm chặt) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #100 | 57a0dd12 | 21:52:21Z 18/11 | 0h40m42s (2.442 s — gap #100?→#101?, CHỈ LÀ SPAN — đoạn B mù #61 MỞ, tối đa 1 ẩn, quyết parent (e)/(f) đợt 142); sống tới 22:33:03Z | T10-141 §10.2 + quyết parent (g) đợt 141 + T2-142 prereg §4 |
| #101 | ed5323a4 | 22:33:03Z 18/11 | 0h15m02s (902 s — gap #101?→#102?, CHỨNG NHẬN [892, 912] s, T2-142 + quyết parent (e) đợt 142; caveat đoạn ngắn < sàn 1.147 s); sống tới 22:48:05Z | T10-141 §10.1/§10.2 + quyết parent (g) đợt 141 + T2-142 prereg §4 |
| #102 | bde599df | 22:48:05Z 18/11 | 1h05m33s (3.933 s — gap #102?→#103?, CHỨNG NHẬN [3.923, 3.943] s, T2-143 + quyết parent (d) đợt 143); sống tới 23:53:38Z | T6-143 + T2-143 (prereg + probe #62 + merged mù #62) + T10-142 §10.2 + quyết parent (d) đợt 143 (CERT 63 / FULL 78 XÁC NHẬN) |
| #103 | b47f7932 | 23:53:38Z 18/11 | 0h00m42s (42 s — gap #103?→#104?, SPAN — đoạn B mù #62 không chứng nhận được, quyết parent (e) đợt 143 BÁC floor cơ học = 0); sống tới 23:54:20Z | T6-143 + T2-143 (prereg + merged mù #62) + T7-142 + T9-142 + T10-142 §10.2 + quyết parent (c) đợt 143 (đếm chặt: b47f7932 = #103?) |
| #104 | 9afdaa89 | 23:54:20Z 18/11 | 2h01m05s (7.265 s — gap #104?→#105?, SPAN — đoạn C mù #62 MỞ, tối đa 2 ẩn, quyết parent (e) đợt 143 BÁC continuity dòng-log làm closer); sống tới 01:55:25Z | T7-142 + T9-142 + T10-142 §10.2 + T2-142 (btime TRONG dải FULL77 neo #102? [23:15:16Z, 01:12:54Z] — xem §8.8/F-144-T6-1) + quyết parent (c) đợt 143 (đếm chặt: 9afdaa89 = #104?) |
| #105 | 70a5b0fc | 01:55:25Z 19/11 | 2h00m20s (7.220 s — gap #105?→#106?, SPAN — chờ merged mù #63 của T2-144; xem F-144-T6-2 về số 7.280 s trong prereg T2-144); sống tới 03:55:45Z | T6-143 + T2-143 prereg + boot-verify + probe #62 + T7-143 NOTES + T10-142 (suite + O8 chạy trên boot này 01:57–02:04Z) + quyết parent (c) đợt 143 (đếm chặt: 70a5b0fc = #105?) |
| #106 | 691a7403 | 03:55:45Z 19/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T2-144 prereg + boot-verify (probe #63 ok=2 fail=0) + T7-144 NOTES kiểm lần 1 + T10-143 (suite + O8 chạy trên boot này 03:58–05:27Z) + quyết parent (c) đợt 143 (đếm chặt: 691a7403 = #106?) |

- **Ghi chú bảng:** các hàng #100–#101 chép nguyên từ bảng
  T6-143 (đã qua soát xét đợt 143, cập nhật verdict gap
  theo quyết parent (d)/(e) đợt 143); hàng #102–#105 là
  boot đã ghi TẠM theo quyết parent (c) đợt 143 (đếm chặt
  thay nhãn (d) đợt 142); hàng #106 là boot mới. Nhãn gap
  trong ngoặc ở mỗi hàng là gap ứng với tuổi thọ danh nghĩa
  của boot đó (btime → btime boot sau) **theo cách đếm
  chặt**.
- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #99?→#100? là sự kiện thứ 24** (GIỮA lượt 141);
  **#100?→#101? là sự kiện thứ 25** (trong lúc T10-141
  đóng sổ); **#101?→#102? là sự kiện thứ 26** (trong lúc
  T10-141 đóng sổ — theo aggregate đợt 142 §12.2(c));
  **#102?→b47f7932 là sự kiện thứ 27 + b47f7932→#104? là
  sự kiện thứ 28** (REBOOT ĐÔI giữa lượt 142, cách nhau
  42 s theo btime — theo aggregate đợt 142 §12.2(c));
  **#104?→#105? là sự kiện thứ 29** (trong lúc T10-142
  đóng sổ — theo aggregate đợt 142 §12.2(c));
  **#105?→#106? là sự kiện thứ 30** (GIỮA LƯỢT 143,
  trong lúc T10-143 chờ cờ — theo aggregate đợt 143
  §10.2).
- **T2-144 + T7-144 đối chiếu khớp (độc lập, trước/sau khi
  T6 đo):** prereg-t2.md ghi boot mới `691a7403…`, btime
  03:55:45Z, gọi là #106? đếm chặt (nhãn (d) cũ bị thay
  thế); `boot-verify.txt` khớp đúng boot_id + btime của
  T6; probe #63 (`once.txt`: `probe#63 boot=691a7403 ok=2
  fail=0`) xác nhận boot đang sống; T7-144 NOTES kiểm lần
  1 (~05:40Z) khớp đúng boot_id + btime + epoch. Ba luồng
  khớp nhau hoàn toàn về boot_id, btime, epoch và số chặt.
  T2-144 cũng ghi rõ run 144 mở SAU boot này nên không kỳ
  vọng viết lại started_at tại boot này (xem §9).
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#96: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3 +
    T6-138 §8.2–§8.4 + T6-139 §8.2–§8.4 + T6-140 §8.2–§8.4
    + T6-141 §8.2–§8.4 + T6-142 §8.2–§8.4 + T6-143 §8.2–
    §8.5 (không chép lại).
  - #95: khung ứng viên 400 s (xem §8.3).
  - #102 (bde599df): khung **XÁC NHẬN (23:52:41Z,
    23:53:38Z] (57 s)** — quyết parent (f) đợt 143.
  - #104 (9afdaa89): khung **XÁC NHẬN (01:45:44Z,
    01:55:25Z] (581 s)** — quyết parent (f) đợt 143 (thu
    hẹp 81 s so với ứng viên quét 662 s của T6-143).
  - #105: ứng viên quét mtime của T6, CHƯA CHỐT (xem §8.6).
  - #103 (b47f7932): khung ứng viên (23:53:38Z, 23:54:20Z]
    (42 s) — T2-144 prereg; merged mù #63 chứng nhận,
    T6 không tự chốt.

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
  các lần append sau đó (nay là 05:47:40Z), không phải bằng
  chứng mới; 3 file còn lại là cùng 3 file cũ, cùng mốc
  13:47:01Z. **Không có bằng chứng mới — khung 400 s giữ
  nguyên.** Merged của T2-144 (mù #63) không phủ cửa sổ
  này (mù #63 bắt đầu 02:49:42Z 19/11); khung chuẩn cuối
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
  trong phiên T6 đợt này — merged mù #63 không phủ các
  cửa sổ này (mù #63 bắt đầu 02:49:42Z 19/11). Trạng thái
  ba khung từ nay là **ĐÃ CHỐT CHUẨN**, không còn hoãn quyết.

### 8.5 Khung chết #99?/#100?/#101? — ĐÃ CHỐT CHUẨN theo quyết parent đợt 142 §12.2(g)

- **Khung chết #99? chuẩn: (21:51:52Z, 21:52:21Z] (29 s)**
  — merged T2 TRÙNG KHỚP HOÀN TOÀN khung quan sát T9-141.
- **Khung chết #100? chuẩn: (22:32:05Z, 22:33:03Z] (58 s)**.
- **Khung chết #101? chuẩn: (22:45:49Z, 22:48:05Z] (136 s)**.
- Không có bằng chứng mới nào về ba khung này trong phiên
  T6 đợt này. Trạng thái ba khung từ nay là **ĐÃ CHỐT
  CHUẨN**, không còn hoãn quyết.

### 8.6 Khung chết #105? (70a5b0fc) — ứng viên quét mtime của T6: (03:55:15Z, 03:55:45Z] (30 s), CHƯA CHỐT — chờ merged mù #63 của T2-144

- **Quét mtime của T6 (`scan-mtime-144.py`, hidden_files +
  docs, cửa sổ W (03:34:32Z, 03:55:45Z]): 2 file, mốc
  cuối 03:55:15Z** — `round143-t9/ram-sampler-long.log` +
  `ram-sampler-long.out` (T9-143 sampler vòng 1, cùng mốc
  03:55:15Z). Không có file nào khác có mtime trong cửa sổ
  sau 03:55:15Z trong hai cây quét.
- Khung ứng viên theo quét này: **(03:55:15Z, 03:55:45Z]
  (30 s)** — KHỚP ĐÚNG khung T9 (aggregate đợt 143 §10.2:
  khung chết boot cũ (T9): (03:55:15Z, 03:55:45Z] (30 s)).
  Hai nguồn độc lập (T9 + quét mtime của T6) đồng thuận
  hoàn toàn về mốc cuối 03:55:15Z.
- **T6 không tự chốt khung #105?** — merged mù #63 của
  T2-144 (đoạn A: 02:49:42Z → 03:55:45Z) là chứng nhận
  chính thức; T2 sẽ báo khung merged, parent quyết. Gap
  danh nghĩa #105?→#106? = **7.220 s (2h00'20")** — nằm
  trong dải chứng nhận [0h00'55", 3h14'08"]. Chứng nhận
  **[7.210 s, 7.230 s] NẾU đoạn A mù #63 đóng** (T2-144
  prereg §4 — với lưu ý F-144-T6-2: prereg ghi 7.280 s,
  T6 tính độc lập 7.220 s; khoảng chứng nhận theo số đúng
  là [7.210, 7.230] s — T2 xác minh lại).

### 8.7 Khung chết #103? (b47f7932) — ứng viên (23:53:38Z, 23:54:20Z] (42 s), CHƯA CHỐT — chờ merged mù #63 của T2-144

- Khung ứng viên theo T2-144 prereg: **(23:53:38Z,
  23:54:20Z] (42 s)** — đúng bằng gap btime giữa hai boot
  (không có mốc quan sát nào trong 42 s này theo merged mù
  #62 đoạn B: gần như chắc chắn 0 mốc).
- **T6 không tự chốt khung #103?** — merged mù #63 của
  T2-144 là chứng nhận chính thức cho khung này (theo
  aggregate đợt 143 §11: T2-144 chứng nhận khung chết
  #103?/b47f7932 bằng merged mù #63). Gap #103?→#104? =
  42 s giữ SPAN (quyết parent (e) đợt 143 BÁC floor cơ học
  = 0 cho gap 42 s — dị thường đồng hồ đã ghi nhận tới
  ~32 s, cùng cỡ với 42 s).

### 8.8 F-144-T6-1 — Chuỗi INSIDE: 4 theo dải đã công bố, 2 theo đếm chặt (MỚI — T6 kiểm độc lập theo giao của quyết parent (m) đợt 143)

Quyết parent (m) đợt 143 giao T6-144 chốt số đếm chuỗi
INSIDE từ lịch sử dải ("4 chỉ đúng nếu b47f7932, 9afdaa89,
70a5b0fc, 691a7403 đều INSIDE dải của chúng — parent không
khẳng định số 4 khi chưa kiểm được cả bốn"). T6 kiểm cả
bốn bằng code (python3, tính từ btime + p10/p90 đã công
bố), kết quả PHỤ THUỘC vào cách hiểu "dải của chúng":

(a) **Theo dải ĐÃ CÔNG BỐ (lịch sử dải của T2): cả bốn
đều INSIDE → chuỗi = 4.** Đây là cách T2-143 (§2.5) và
T2-144 prereg (dòng 21: "chuỗi INSIDE ở 4") đã đếm:
- b47f7932: dải FULL77 neo bde599df 22:48:05Z
  **[23:15:16Z, 01:12:54Z]** (T2-142 §2.5) — btime
  23:53:38Z **INSIDE**.
- 9afdaa89: dải CHUẨN cho #103? của T2-142, CÙNG dải trên
  **[23:15:16Z, 01:12:54Z]** (neo bde599df) — btime
  23:54:20Z **INSIDE** (T2-142 ghi rõ: "Reboot #27
  (9afdaa89, btime 23:54:20Z) NẰM TRONG dải này").
- 70a5b0fc: dải FULL77 neo 9afdaa89 **[00:21:31Z,
  02:19:09Z]** (script T2) / [00:21:32Z, 02:19:10Z]
  (tính T6-143) — btime 01:55:25Z **INSIDE** (cả FULL78
  [00:21:40Z, 02:19:00Z] cũng INSIDE).
- 691a7403: dải FULL78 neo 70a5b0fc **[02:22:45Z,
  04:20:05Z]** — btime 03:55:45Z **INSIDE**.
- Chuỗi đứt trước đó: bde599df (#102? chặt) OUTSIDE (gap
  902 s < p10 1632 s — T2-142 §2.5: NGOÀI cả ba dải) —
  lần OUTSIDE đầu tiên kể từ #93?; chuỗi INSIDE khởi
  động lại từ b47f7932.
(b) **Theo dải NEO TIỀN NHIỆM ĐẾM CHẶT (tính lại cho
nhất quán với chuẩn mới): 9afdaa89 OUTSIDE → chuỗi = 2.**
Vấn đề: dải T2-142 công bố cho 9afdaa89 neo tại bde599df
— tức coi 9afdaa89 là boot kế tiếp của bde599df, BỎ QUA
b47f7932. Nhưng quyết parent (c) đợt 143 đã CHỌN CÁCH
ĐẾM CHẶT làm chuẩn từ đợt 144: b47f7932 LÀ boot thật, là
tiền nhiệm trực tiếp của 9afdaa89. Dải nhất quán với chuẩn
mới cho 9afdaa89 phải neo tại b47f7932 23:53:38Z:
FULL77 p10 1632 s / p90 8690 s → **[00:20:50Z,
02:18:28Z] 19/11** — btime 23:54:20Z 18/11 **OUTSIDE**
(gap chỉ 42 s, thấp hơn cận dưới 26'30"). Ba boot còn
lại không đổi (tiền nhiệm chặt của chúng trùng tiền
nhiệm đã công bố): b47f7932 INSIDE, 70a5b0fc INSIDE,
691a7403 INSIDE → **chuỗi INSIDE hiện tại = 2**
(70a5b0fc, 691a7403).
(c) **T6 KHÔNG tự chọn số nào làm chuẩn.** Hai con số
đều đúng dưới quy ước của chúng; khác nhau ở đúng một
điểm: dải của 9afdaa89 neo tại đâu. T6 ghi rõ cả hai
cách tính + số liệu để parent/T2 quyết. Lưu ý phương
pháp: dải là băng dự báo cho boot KẾ TIẾP tính từ boot
TRƯỚC NÓ — bỏ qua một boot thật (42 s) khi neo dải sẽ
giấu một dị thường thật (gap 42 s, xa dưới p10). Theo
chuẩn đếm chặt vừa được chọn, cách tính (b) là nhất
quán về phương pháp; cách tính (a) là lịch sử đã công
bố và là cơ sở của số "4" trong aggregate đợt 143.
Giao T2-144 (chủ quản dải) + parent quyết: giữ "4"
theo lịch sử công bố, hay sửa thành "2" theo đếm chặt.
**Không ảnh hưởng kết luận lock:** chỉ là nhãn hồ sơ;
chuỗi boot tương đối + btime không đổi.
(d) **Full boot_id b47f7932: KHÔNG có dữ kiện mới.**
T7: `b47f7932-ebca-447e-a015-0a6c160efd98`; T9:
`b47f7932-ebca-4205-86a0-b71a0ab9790c` (F-143-T6-1) —
quyết parent (g) đợt 143: **ĐỂ MỞ**, ghi cả hai bản kèm
nguồn, không chọn một. T6 đợt này không tìm thêm bằng
chứng (không còn boot đó để đo lại) — ghi nhận đúng
quyết, không tự quyết bên nào đúng.

### 8.9 Dải #107? CHUẨN (T6 tính độc lập — khớp T2-144 prereg trong 1 s làm tròn)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 / T6-138 §8.6 /
T6-139 §8.6 / T6-140 §8.6 / T6-141 §8.8 / T6-142 §8.9 /
T6-143 §8.10 — p10–p90 của phân phối FULL78 (p10 =
1.640 s, p90 = 8.680 s theo dải đã công bố [02:22:45Z,
04:20:05Z] neo 01:55:25Z; p10 theo giá trị T2-143 §2.5 là
1.641 s — chênh 1 s làm tròn, xem F-143-T2-3), cộng vào
btime 691a7403 03:55:45Z.
**T6 dùng FULL78** (CERT 63 / FULL 78 đã xác nhận theo
quyết parent (d) đợt 143 — phân phối hiện hành cho tới khi
T2-144 chứng nhận thêm gap).

- **Dải dự báo T6 cho #107? (FULL78): [04:23:05Z,
  06:20:25Z]** (03:55:45Z + 1.640 s = 04:23:05Z;
  03:55:45Z + 8.680 s = 06:20:25Z 19/11). Tính bằng code
  (python3), không nhẩm. Biến thể dùng p10 = 1.641 s:
  [04:23:06Z, 06:20:25Z].
- **Đối chiếu với T2: KHỚP.** T2-144 prereg công bố dải
  #107? CHUẨN (đếm chặt, neo tại #106? 691a7403 03:55:45Z):
  **[04:23:06Z, 06:20:25Z]** — khớp đúng tính T6 theo
  p10 = 1.641 s (chênh 1 s làm tròn so với biến thể
  1.640 s — không ảnh hưởng verdict nào).
- Lưu ý: cận dưới dải #107? (04:23:06Z) đã qua lúc T6 đóng
  (05:49Z) mà chưa có reboot — điều đó bình thường (dải
  p10–p90 chỉ bao 80% khối lượng, không phải cam kết).
  Dải hiệu dụng sau probe #63 (xong ~05:40Z): [05:40Z,
  06:20:25Z] (cận dưới thực tế là thời điểm probe #63 xác
  nhận boot 691a7403 còn sống).

### 8.10 Gap chờ chứng nhận (cách đếm chặt — T2-144 prereg, T6 đối chiếu số học độc lập)

- #102?→#103? = 3.933 s → khoảng **[3.923, 3.943] s
  CHỨNG NHẬN** (T2-143 + quyết parent (d) đợt 143 —
  CERT 63 / FULL 78).
- #103?→#104? = 42 s → **SPAN** (đoạn B mù #62 không
  chứng nhận được; quyết parent (e) đợt 143 BÁC floor cơ
  học = 0).
- #104?→#105? = 7.265 s → **SPAN** (đoạn C mù #62 MỞ,
  tối đa 2 ẩn; quyết parent (e) đợt 143 BÁC continuity
  dòng-log làm closer).
- #105?→#106? = 7.220 s → khoảng **[7.210, 7.230] s NẾU
  đoạn A mù #63 đóng** (T2-144 prereg §4 — với lưu ý
  F-144-T6-2: prereg ghi 7.280 s; T6 tính độc lập 7.220 s
  từ btime; khoảng chứng nhận theo số đúng là [7.210,
  7.230] s — T2 xác minh lại). Nếu chứng nhận: CERT
  63→64 / FULL 78→79.
- **Lưu ý lệch cửa sổ (T2-144 prereg phát hiện, T6 ghi
  nhận):** brief đợt 144 yêu cầu chứng nhận gap
  #103?→#104? và #104?→#105? "bằng merged mù #63" — cả
  hai gap đều NẰM TRONG mù #62, không nằm trong cửa sổ
  mù #63 (02:49:42Z → probe #63). Merged mù #63 CHỈ
  chứng nhận được gap #105?→#106? (đoạn A mù #63). T2-144
  sẽ làm cả hai việc và báo rõ từng việc — T6 không tự
  chứng nhận gap nào.

### 8.11 VERDICT: chuỗi tương đối CHỐT #57→#106? + 691a7403; số tuyệt đối VẪN TẠM (giữ "?"); chuỗi INSIDE chờ quyết (F-144-T6-1)

- **CHỐT ĐƯỢC — chuỗi tương đối:** 46 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới 691a7403 (03:55:45Z 19/11)
  xếp đúng thứ tự thời gian (tính cả b47f7932 là boot quan
  sát được, đánh số #103? chặt), mỗi boot có boot_id +
  btime riêng biệt (trừ mâu thuẫn full id của b47f7932,
  §8.8(d)), không có boot_id lạ nào trong bất kỳ bằng
  chứng nào ở khoảng giữa; các bước chuyển
  #74→#75→…→#105→#106 đều có ≥2 nguồn độc lập xác nhận
  (T5 + T2 + T6 + T7 + T9 + T10 + file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-144 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #102?→#103? có dị thường
    đồng hồ quanh 23:54Z — §8.6/§8.8 T6-143 — củng cố
    rằng ranh giới cần chứng nhận ngoài VM.)
  - **Mù #57 + mù #58 + mù #59 + mù #60 ĐÃ ĐÓNG HOÀN TOÀN
    (T2-138, T2-139, T2-140, T2-141):** số #94?/#95?/#96?/
    #97?/#98?/#99? nay đã xác nhận theo quy ước (không còn
    reboot ẩn giữa #93?→#94?→…→#98?→#99?); mù #56 A vẫn
    MỞ theo quyết parent (e) — số #93? vẫn mang tính quy
    ước headline.
  - **MỚI — mù #61 KHÔNG ĐÓNG HOÀN TOÀN (quyết parent (f)
    đợt 142) + mù #62 KHÔNG ĐÓNG HOÀN TOÀN (quyết parent
    (e) đợt 143: đoạn B không chứng nhận được, đoạn C mở
    tối đa 2 ẩn) + mù #63 MỚI MỞ (T2-144 đang điều tra;
    probe #63 xong ok=2 fail=0, prereg đã viết nhưng
    merged/LIMITS/.done chưa có lúc T6 đóng);** số
    #102?/#103?/#104?/#105?/#106? là TẠM theo quyết parent
    (c) đợt 143 (đếm chặt) — gap #103?→#104? / #104?→#105?
    vẫn là SPAN; gap #105?→#106? chờ merged mù #63; chuỗi
    INSIDE chờ quyết (F-144-T6-1). T6-144 chốt chuỗi
    TƯƠNG ĐỐI (691a7403 là boot quan sát được tiếp theo
    sau 70a5b0fc, không có boot quan sát được nào ở giữa)
    — số thứ tự tuyệt đối #102?→#106? chờ verdict của
    T2-144. **Ghi rõ "chờ T2" theo brief; T10 gộp.**
- **Kết luận cho parent:** T6-144 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 1 boot (#106? — reboot #30 giữa lượt
  143); số thứ tự tuyệt đối **vẫn TẠM** và phải giữ "?" cho
  tới khi có bằng chứng ngoài VM (và, riêng #103?→#106?,
  tới khi mù #63 đóng + chuỗi INSIDE được quyết
  F-144-T6-1). Không bịa số, không bỏ "?" khi chưa đủ bằng
  chứng — đúng như brief giao.
- Hệ quả thực hành: T9-144 gọi boot lúc mở là "#106?"
  trong LIMITS của mình là đúng quy ước chặt; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #30 cho reboot giữa lượt 143 — theo aggregate
  đợt 143 §10.2). Các quyết parent trước vẫn đứng: không
  quyết con số tuyệt đối nào ở đây.

### 8.12 Reboot #30 — không mất việc của luồng T6; T6 không bị cắt

- Reboot 70a5b0fc → 691a7403 (btime 03:55:45Z) xảy ra giữa
  lượt 143, trước khi đợt 144 mở (05:35:51Z) —
  **không giết attempt hay holder lock nào của đợt 144**
  (đợt 144 mở sau đó, trên boot mới; T8-144 acquire đầu
  05:41:10Z trên boot mới).

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **05:38:22Z** (boot 691a7403 đã
  1h42'37" tuổi); đóng **05:49:08Z** (boot 691a7403 đã
  ~1h53'23" tuổi). Đợt 144 mở **05:35:51Z**
  (round-in-progress.md) — tức **6.006 s sau btime boot
  691a7403 (03:55:45Z)**.
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
  chính 936 s), đợt 142 (lần thứ 12 + 13 — T7-142:
  started_at lượt 142 viết lại lần 1 (btime 9afdaa89 +
  37 s) và lần 2 (btime 70a5b0fc + 32 s)) và đợt 143 (lần
  thứ 14 + 15 + 16 — T7-143: started_at lượt 143 viết lại
  lần 1 tại reboot #30 (btime 691a7403 + 35 s, bằng chứng
  trực tiếp thứ tám); run 142 KHÔNG bị viết lại lần 3).
- **Quan sát mới T7-144 kiểm lần 1 (~05:40Z, T6 chỉ ghi
  mốc, không kết luận — T7 là chủ quản):** run 144
  (`b93ae161`) sched = started = **05:35:51Z, jitter 0 s,
  running, KHÔNG viết lại** (boot không đổi 691a7403 từ
  03:55:45Z; không có reboot trong lúc run 144 chạy tới
  nay — đúng dự báo của T2-144 prereg: run mở SAU boot
  nên không kỳ vọng viết lại tại boot này). Run 143
  (`b6c4b22d`) nay đã `succeeded`, finished 02:34:13Z —
  started_at của run 143 là btime 691a7403 + 35 s (viết
  lại lần 1 tại reboot #30, xem trên). KHÔNG run cũ nào
  bị viết lại thêm.
- **F105? (chủ quản T2-144 — T6 chỉ ghi số thô, không kết
  luận):** `f105.txt` của T2-144 (05:43:44Z): HTTP `Date`
  3 server hơn local +1/+1/+0 s theo quy ước `Date −
  local_after` của T2 (example.com 05:43:44 vs local
  05:43:43; google.com 05:43:45 vs 05:43:44; cloudflare
  05:43:45 vs 05:43:45) — tức `Date − local_before` sẽ
  cho +2/+2/+1. Số liệu thô giống nhau, chỉ khác quy ước;
  offset thật nằm giữa hai cách tính, khoảng ±1–2 s.
  T6 không đo F, không kết luận — chờ verdict T2-144.
  F104? (70a5b0fc) ≈ −0..−1 s (T2-143). F103? (9afdaa89)
  CHƯA ĐO (T2-142 không đo HTTP Date trên boot đó) — ghi
  rõ, không bịa.

## 10. Dọn Xvfb: 0 Xvfb chạy; 0 socket sót (X193 là của T4 attempt 2, đang dùng)

- **Lúc mở (05:38Z): 0 Xvfb đang chạy** (`pgrep -x Xvfb`
  rc=1; quét `ps-full-open.txt` không có process nào tên
  Xvfb). **`/tmp/.X11-unix/` TRỐNG** (x11-open.txt).
- **Lúc đóng (05:48Z): 0 Xvfb đang chạy** (pgrep rc=1),
  quét `ps-full-close.txt` không có process nào tên Xvfb.
  **`/tmp/.X11-unix/` có 1 socket X193** (x11-close.txt)
  — NHƯNG không phải sót: socket tạo 05:44Z (attempt 1
  của T4), mtime cập nhật 05:48Z; `fuser` cho thấy pid
  39592 đang giữ — T4 attempt 2 bắt đầu 05:48:15Z, đang
  dùng display này. T6 không xóa gì (không có file nào
  của tiến trình khác để xóa).
- **Socket X193/X194/X195 của T10-143 ĐÃ BIẾN MẤT** — T10
  đã dọn tay 05:21Z (sau khi suite/O8 xong) + reboot #30
  xóa /tmp; socket X193 hiện tại là của T4-144, không
  liên quan đợt 143.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-144; T2-144
  prereg dự kiến đỉnh mù #63 ≤ ~48,70% guard; T4-144 poll
  ghi RAMavail dao động — xem §11; headroom thuộc T9).

## 11. Tuân thủ lock của luồng đo đợt 143 ĐÃ kiểm được + đợt 144 tới nay

- **T8-143 acquire + release sạch ×7** (03:58:12Z →
  05:07:14Z; holds 173/70/131/240/60/120/230 s; ports
  5560/5390/5490; 5 chu kỳ wait_s=15/16 qua cooldown, 2
  chu kỳ wait_s=0; ticket khớp log). Chu kỳ 03:58 là O8
  chạy lại (Chromium 21/21 + WebKit 21/21 PASS — O8 WebKit
  FAIL đợt 142 KHÔNG tái hiện); 6 chu kỳ 04:51–05:07 là
  harness 6/6 PASS KHÔNG QUA GATE (F-143-T8-2 — quyết
  parent (i) đợt 143: chấp nhận lần chạy có ghi rõ, không
  trích là "harness sau gate"). T8 dùng script repo
  (`run-webkit-143t8.sh` dòng 33, `LOCK=.../vcut-vite-
  lock-v2.sh`) — tức chạy trên **thứ tự ghi mới** (§3).
  Đây là các lần chạy kiểm chứng vá watchdog — 0 kẹt thật
  đợt 143 nên vá chưa được thử bằng kẹt thật (quyết parent
  (i) đợt 143: giữ nguyên bản vá, chờ kẹt thật sau — đợt
  thứ hai liên tiếp).
- **T10-143 acquire + release sạch ×1** (05:25:19Z →
  05:27:01Z; hold 102 s; port 5554; wait_s=0; ticket khớp
  log — suite 27/27 + O8 Chromium 21/21 + O8 WebKit 21/21
  trên boot 691a7403). T10 dùng bản frozen
  `round143-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
  (T6 kiểm trực tiếp đợt này) — tức chạy trên **thứ tự
  ghi mới** (§3).
- **Tổng kết đợt 143: 8/8 chu kỳ sạch, trên thứ tự ghi
  mới** — 61 chu kỳ liên tiếp sạch kể từ lúc T6-135 đóng
  (53 + 8). **Đợt 144 tới 05:48:06Z: 2/2 chu kỳ sạch**
  (t8-144 ×1 + t4 ×1), nâng tổng lên **63 chu kỳ liên
  tiếp sạch**.
- **T8-144 acquire + release sạch ×1 tới 05:48Z**
  (05:41:10Z → 05:43:53Z; hold 163 s; port 5560; wait_s=0;
  ticket khớp log — O8 Chromium 21/21 + WebKit 21/21 PASS
  exit 0, S1 PASS cả hai). T8 dùng script repo
  (`run-webkit-144t8.sh` dòng 33, `LOCK=.../vcut-vite-
  lock-v2.sh`) — tức chạy trên **thứ tự ghi mới** (§3).
  Vite port 5554 của attempt WebKit (pid 35384, bắt đầu
  05:43:04Z) nằm trong lúc T8 giữ lock — hợp lệ; đã thoát
  cùng release (`curl5560=000000 curl5554=000000` theo log
  T8 — xem §6.2).
- **T4 attempt 1 acquire + release sạch ×1 tới 05:48Z**
  (05:44:12Z → 05:47:40Z; hold 208 s; port 5187; wait_s=0;
  ticket khớp log — lượt yên #19 attempt 1). T4 dùng
  script repo (`run-attempt-144.sh` dòng 13,
  `LOCKV2=.../vcut-vite-lock-v2.sh`) — tức chạy trên
  **thứ tự ghi mới** (§3). Log nội bộ của T4
  (`chain-t4.log`) ghi `LOP-B-TONG: B2(load)=VI PHAM` ở
  attempt 1 — verdict lượt yên thuộc T4-144, T6 chỉ ghi
  chu kỳ lock sạch; **attempt 2 của T4 bắt đầu 05:48:15Z**
  (sau snapshot đóng của T6 — T6 đợt 145 đếm tiếp).
- **T5-144 đã viết POSTBOOT_PASS cho boot mới**
  (`round144-t5/POSTBOOT_PASS`, 05:43:07Z:
  boot_id=691a7403…, btime=03:55:45Z, pass_at=05:43:07Z,
  poll=2, repair=none/replay-full, dpkg=1545/221) — cờ
  postboot cho boot mới đã có TRƯỚC khi T4 acquire
  (05:44:12Z); gate0 đợt này mở nhờ cờ T5 (khác đợt 143:
  T4 kẹt gate0 vì thiếu cờ cho boot mới — quyết parent
  (j) đợt 143 giao T4+T5-144 đề xuất sửa quy trình; T5
  đã viết cờ mới — T4-144/T5-144 báo chi tiết).
- **T10-144 chưa chạy suite/O8 tới lúc T6 đóng** (đang chờ
  cờ — `wait-flags.log` 05:42Z: missing tất cả; chưa chuẩn
  bị bản frozen lock script — T6 đợt sau kiểm md5 khi T10
  chuẩn bị).
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Đường dẫn đúng `apps/web/src/preview.tsx`.
- **O8 WebKit FAIL đợt 142 KHÔNG tái hiện (lần thứ hai
  độc lập):** T8-143 PASS 21/21 ×2 + T10-143 PASS 21/21
  trên boot 691a7403 (aggregate đợt 143); T8-144 PASS
  21/21 ×2 tiếp (đợt này) — kết luận trạng thái boot mới
  đã được quyết parent (b) đợt 142 + (i) đợt 143 chấp
  nhận. T6 không điều tra O8.

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-144-T6-1, F-144-T6-2,
  F-144-T6-3, F-144-T6-4 (mới, xem dưới).** Không có sai số đếm nào
  của T6 đợt này: số mở của T6 khớp đúng số brief giao +
  số T10-143 đếm lúc đóng (1104 thô / 1098 chính thức,
  từng loại khớp đúng).
- **F-144-T6-1 — Chuỗi INSIDE: 4 theo dải đã công bố, 2
  theo đếm chặt (mới — xem §8.8):** số "4" trong aggregate
  đợt 143 đúng theo lịch sử dải T2 đã công bố (9afdaa89
  INSIDE dải neo bde599df của T2-142); nhưng theo cách đếm
  chặt (chuẩn từ đợt 144, quyết parent (c) đợt 143),
  dải của 9afdaa89 phải neo tại b47f7932 → 9afdaa89
  OUTSIDE (gap 42 s, thấp hơn cận dưới 26'30") → chuỗi
  hiện tại = 2 (70a5b0fc, 691a7403). **T6 không tự chọn
  số nào làm chuẩn:** ghi rõ cả hai cách tính + số liệu;
  giao T2-144 + T10/parent quyết. **Không ảnh hưởng kết
  luận lock:** chỉ là nhãn hồ sơ; chuỗi boot tương đối +
  btime không đổi.
- **F-144-T6-2 — Gap T2-144 prereg lệch 60 s (mới — T6
  phát hiện, T2 xác minh):** prereg T2-144 ghi gap
  #105?→#106? = 70a5b0fc→691a7403 = **7.280 s (2h01'20")**;
  T6 tính độc lập từ btime: 03:55:45Z − 01:55:25Z =
  **7.220 s (2h00'20")** (epoch 1795060545 − 1795053325 =
  7.220); aggregate đợt 143 §10.2 cũng ghi boot cũ sống
  2h00m20s. Số 7.280 của T2 cao hơn 60 s — có thể là lỗi
  gõ (7.280 vs 7.220). Khoảng chứng nhận theo số đúng là
  [7.210, 7.230] s (không phải [7.270, 7.290] s nếu theo
  7.280). T6 chỉ gắn cờ, không sửa số của T2 — T2-144 xác
  minh lại trong LIMITS của mình. Không ảnh hưởng verdict
  INSIDE (cả hai giá trị đều nằm sâu trong dải) hay kết
  luận lock.
- **F-144-T6-3 — Lần grep "KHÔNG NHẢ" đầu loại sai file
  repro (mới — đã sửa ngay trong phiên, xem §5):** T6 dùng
  `--exclude=repro-newmsg.log` (khớp theo basename) nên
  loại luôn cả file repro của T6-142/T6-143 — kết quả đầu
  4 dòng là SAI (thiếu 6 dòng repro). T6 phát hiện ngay
  (tổng không khớp số học lăn 10), chạy lại KHÔNG loại
  repro theo basename mà trừ tay 3 dòng repro của chính
  mình — kết quả chuẩn 10 dòng. File grep-output cuối cùng
  là bản chạy lại đúng; không ảnh hưởng kết luận (0 sự
  kiện trên lock thật trong cả hai lần đếm). Bài học: không
  dùng `--exclude` theo basename cho file repro khi nhiều
  đợt cùng tên file.
- **F-144-T6-4 — md5 bản đã lọc lúc đóng ghi sai trong bản
  nháp (mới — đã sửa trước khi stage):** bản nháp §2 ghi
  md5 `713e5115…` cho bản đã lọc lúc đóng — đó là md5 của
  file tạm 1100 dòng xây từ log đang chạy (đã lẫn 2 dòng
  TICKET/ACQUIRED của t8-round144), không phải bản
  snapshot lúc đóng. T6 kiểm lại và sửa thành `d7707847…`
  (bản đã lọc 1104 dòng xây từ `vite-lock-v2-raw-close.log`
  snapshot 05:48:06Z) trước khi stage. Số dòng/số đếm
  trong tài liệu không sai (chỉ md5 ghi nháp sai) — đã
  sửa, không ảnh hưởng kết luận. Bài học: md5 của bản
  đã lọc chỉ lấy từ file xây bằng snapshot, không lấy từ
  file xây bằng log đang chạy.
- **F-143-T6-1 (cũ, đã được parent quyết ở đợt 143):**
  xung đột đánh số (c)/(d) + mâu thuẫn full boot_id
  b47f7932 — quyết parent (c) đợt 143: **CHỌN CÁCH ĐẾM
  CHẶT làm chuẩn từ đợt 144** (b47f7932 = #103?,
  9afdaa89 = #104?, 70a5b0fc = #105?, 691a7403 = #106?);
  quyết parent (g) đợt 143: **full boot_id b47f7932 ĐỂ
  MỞ** (ghi cả hai bản T7/T9 kèm nguồn, không chọn một).
  T6 đợt này áp dụng đếm chặt trong toàn bộ tài liệu và
  ghi nhận full boot_id vẫn để mở (§8.8(d)) — không lặp
  lại phần chưa quyết.
- **F-142-T6-1 (cũ, đã giải quyết ở đợt 142):** mâu thuẫn
  nhãn reboot #25/#26 — aggregate đợt 142 §12.2(c) đã chốt
  #26 theo cách đếm của T10 (mỗi lần đổi boot_id là 1 sự
  kiện, kể cả reboot trong lúc đóng sổ). Không lặp lại ở
  đợt này: T6-144 ghi đúng sự kiện #30 theo chốt đó.
- **F-142-T6-2 (cũ, đã khắc phục):** grep "KHÔNG NHẢ" lần
  đầu trả 33 dòng do chưa loại file grep-output. T6 đợt
  này loại `khong-nha-grep.txt` NGAY từ lần đầu (§5) —
  không lặp lại; chỉ mắc lỗi mới F-144-T6-3 (loại sai
  repro theo basename) và đã sửa ngay.
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
  Không lặp lại ở đợt này: T6-144 ghi đúng boot sống
  691a7403 (khớp T2-144 boot-verify + probe #63 +
  T7-144 NOTES kiểm lần 1).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn; tổng 17 không đổi. T6-144 đã đếm lại đúng (§5:
  trích dẫn = 0 — các file `.done` của T6 viết không dấu
  nên không khớp pattern có dấu; đã giải thích phương pháp
  ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **Số hiệu boot mới (#102?→#106?) VẪN TẠM (xem §8.11):**
  chuỗi tương đối #57→#106? + 691a7403 đã chốt (46 boot,
  tính cả b47f7932 = #103? chặt); số tuyệt đối giữ "?"
  vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa 6, mù
  #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới #123); (b)
  mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51 đoạn B mở,
  tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng không làm
  neo được; (e) dị thường đồng hồ #84?→#85? (§8.4(b) đợt
  134) + dị thường đồng hồ quanh 23:54Z (§8.6/§8.8 T6-143);
  **(f) MỚI: mù #61 không đóng hoàn toàn + mù #62 không
  đóng hoàn toàn (quyết parent (e) đợt 143) + mù #63 mới
  mở — số #102?→#106? + gap #103?→#104? / #104?→#105?
  chờ verdict T2-144; chuỗi INSIDE chờ quyết (F-144-T6-1);
  mù #56 A vẫn MỞ (quyết parent (e)) — số #93? cũng vẫn
  quy ước headline**. Journal/wtmp chỉ giữ boot hiện tại
  (journal `--list-boots` chỉ 1 dòng 691a7403; wtmp bắt
  đầu 03:55:55Z) nên T6 suy ra số hiệu từ thứ tự thời gian
  + hồ sơ các đợt trước, không phải từ log hệ thống.
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
  BÁC cả hai đề xuất closer/floor của T2) + **mù #63 MỚI
  MỞ** (T2-144 đang điều tra; probe #63 xong ok=2 fail=0,
  prereg đã viết nhưng merged/LIMITS/.done chưa có lúc T6
  đóng); mù #52 đã đóng hoàn toàn (T2-133); mù #54 đã
  đóng hoàn toàn (T2-135).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ hai
  mươi liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round142-t*/` (toàn đợt) +
  `round143-t*/` (toàn đợt) + `round144-t*/` tới 05:48Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T8/T10-144 chưa chạy xong tới thời điểm đếm; T6
  đợt 145 đếm tiếp.
- **Prune cooldown lần 19 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 97 ≤ trần 100 lúc chạy). File
  cũ nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z,
  theo `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 143 khép sạch trên lock (§4):** 8 chu kỳ (t8-143 ×7
  + t10-143 ×1) sạch — T6 đợt này đếm bổ sung 8 chu kỳ sau
  khi T6-143 đóng, khớp đúng recount T10-143;
  **đợt 144 tới 05:48Z có 2 chu kỳ sạch** (t8-144 ×1 +
  t4 attempt 1 ×1); T4 attempt 2 bắt đầu sau snapshot
  đóng — T6 đợt 145 đếm tiếp. Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 05:48Z (trống, 0 ticket + 97 cooldown); đợt
  còn chạy tới ~08:30Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–143 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 63 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt boot 691a7403 đã có cờ POSTBOOT_PASS**
  (T5-144, 05:43:07Z — xem §11); verdict replay thuộc T5.
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- **T2-144 CHƯA XONG lúc T6 đóng (05:49Z):** probe #63 xong
  (ok=2 fail=0) và prereg + boot-verify + f105 đã viết
  (dự báo dải #107? chuẩn + cảnh báo lệch cửa sổ chứng
  nhận gap mù #62 + gap #105?→#106? 7.280 s — xem
  F-144-T6-2) nhưng merged/LIMITS + .done chưa có. Theo
  brief, T6 ghi rõ "chờ T2" và để T10 gộp — KHÔNG tự suy
  đoán số boot #102?→#106?, không tự chứng nhận gap
  #105?→#106?, không tự chốt khung chết #105? cuối cùng.
  T6 chỉ ghi thêm quan sát quét mtime của mình (§8.6) để
  T2-144 cân nhắc.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND144_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t8-round144` do release hợp lệ của
t8-144 — xem §3), Xvfb (0 process; socket X193 là của
T4-144 attempt 2 đang dùng — T6 không xóa gì).
Stage: `repo-1-push/paths-loop/phase9-round144-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round144-t6/` (status-open.txt,
status-close.txt, status-mid.txt, ps-full-open.txt,
ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
x11-close.txt, boot-verify-close.txt, time-open.txt,
time-close.txt, wc-open.txt, analyze-log-cleaned-open.txt,
vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-close.log, vite-lock-v2-raw-open.log,
vite-lock-v2-raw-close.log, analyze-log.py,
cooldown-now-open.txt, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log,
repro-newmsg-fixed.sh, repro-newmsg-fixed144.sh,
repro-newmsg.log, scan-mtime-144.py, scan-mtime-144.txt).
