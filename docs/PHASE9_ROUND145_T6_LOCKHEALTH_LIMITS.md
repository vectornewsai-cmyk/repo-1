# PHASE9 ROUND145 T6 — lock health + prune lần 20 + chuỗi INSIDE: 2 làm chuẩn, 4 chờ T2-145 xác nhận chính thức (F-145-T6-1) — LIMITS

- Đợt: 145, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 15:35 +07 19/11/2026 (= 08:35:51Z 19/11). Chạy
  08:42:11Z → 08:46:04Z 19/11/2026, toàn bộ trên một boot duy
  nhất e146ca67 (ứng viên #108? đếm chặt) — KHÔNG có reboot
  trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune lần 20, suite kiểm lock 9/9
  ×2, chốt chuỗi boot với boot e146ca67 (btime 07:56:16Z),
  kiểm chuỗi INSIDE theo quyết parent (h) đợt 144 (2 làm
  chuẩn; cc222c8a INSIDE hậu nghiệm → 3, chờ T2-145 xác nhận
  chính thức) + kiểm e146ca67 INSIDE dải #108? bằng code,
  kiểm mâu thuẫn full boot_id b47f7932 (T7 vs T9, F-143-T6-1)
  nếu còn dữ kiện mới — không quyết bên nào đúng nếu không
  đủ bằng chứng, chỉ ghi nhận (quyết parent (g) đợt 143: ĐỂ
  MỞ), kiểm Xvfb sót, ghi mọi sai số F-145-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round145-t6/` (status-open.txt,
  status-close.txt, ps-full-open.txt, ps-full-close.txt,
  ss-open.txt, ss-close.txt, x11-open.txt, x11-close.txt,
  boot-verify-open.txt, boot-verify-close.txt, time-open.txt,
  time-close.txt, wc-open.txt, analyze-log-cleaned-open.txt,
  vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-close.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, analyze-log.py,
  cooldown-now-open.txt, cooldown-now.txt,
  prune-candidates.txt, prune-deleted.txt,
  khong-nha-grep.txt, test-v2-t6-run1.log,
  test-v2-t6-run2.log, repro-newmsg-fixed.sh,
  repro-newmsg-fixed145.sh, repro-newmsg.log,
  scan-mtime-145.py, scan-mtime-145.txt, md5-open.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT e146ca67 (ứng viên #108? đếm chặt; xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `e146ca67-20a5-4452-9112-69155233ab99`, btime 07:56:16Z**
  (`/proc/stat` btime epoch 1795074976; `uptime -s` =
  07:56:16Z; `who -b` = Nov 19 07:56; `/proc/1` 07:56:31Z —
  chênh +15 s, cùng mẫu các boot trước (691a7403: +10 s;
  cc222c8a: +15 s); `journal --list-boots` chỉ 1 dòng
  e146ca67, first entry 07:56:32Z (boot +16 s)). Uptime
  ~45'55" lúc T6 bắt đầu (08:42:11Z), ~49'48" lúc đóng
  (08:46:04Z). Đây là boot sau **reboot #32** (cc222c8a →
  e146ca67, trong lúc T10-144 chờ cờ — theo aggregate đợt
  144 §10.2; quyết parent (f) đợt 144 XÁC NHẬN là sự kiện
  #32, boot này = #108? đếm chặt).
- **KHÔNG có mâu thuẫn btime lần này:** brief,
  T2-145 boot-verify (×2: 08:36:16Z) và T7-145 NOTES (mở
  ~08:41Z) đều ghi btime 07:56:16Z. T2-145 `boot-verify.txt`
  khớp đúng boot_id + btime; probe #64 của T2-145
  (`once.txt`: `probe#64 boot=e146ca67 ok=2 fail=0`)
  xác nhận boot đang sống. Ba luồng khớp nhau hoàn toàn
  (T6 + T2 + T7).
- **Đợt 145 mở 08:35:51Z** (sched 08:35:51Z) — tức **2.375 s
  sau btime boot e146ca67 (07:56:16Z)**. T6 mở 08:42:11Z
  (2.755 s sau btime).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline. preview.tsx md5 `530e10a7`.
- Các luồng đợt 145 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round145-t1/t2/t4/t5/t7/t8/t9/t10; T1-145 đã
  đóng cờ (count-final-145-t1.py); T2-145 đã viết prereg +
  boot-verify + f106 + probe #64 (ok=2 fail=0, boot
  e146ca67) và đang điều tra mù #64 (blind64-*.py/log/txt)
  nhưng CHƯA viết merged/LIMITS/.done lúc T6 đóng — T6 đối
  chiếu ở §8 với prereg-t2.md + f106.txt + once.txt;
  T5-145 đã viết POSTBOOT_PASS cho boot mới lúc 08:45:28Z
  (§11); T8-145 đang chạy O8 (§2/§11); T4-145 đang chuẩn
  bị (scripts 08:42–08:43Z, chưa có attempt nào lúc T6
  đóng — T6 đợt 146 đếm tiếp); T10-145 đang chờ cờ
  (wait-flags-145.log) và CHƯA chuẩn bị bản frozen lock
  script — T6 đợt sau kiểm md5 khi T10 chuẩn bị.

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật lúc mở, 0 còn sót lúc đóng — 0 cổng lạ

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 08:42Z
  (mở, `ps-full-open.txt`) và lúc 08:46Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (08:42Z): 0 tiến trình vite/node/webkit thật,
  0 tiến trình lock-script, 0 Xvfb** (xem §10). `ss -tlnp`
  lúc mở và lúc đóng đều chỉ còn dòng header (không cổng
  nào lắng nghe).
- **Lúc đóng (08:46Z): 0 vite/node/webkit thật còn sót**
  (vite O8 của T8-145 đã thoát cùng release 08:46:01Z —
  xem §2/§6.2; 2 dòng "vite" trong `ps-full-close.txt` là
  lệnh bash của chính T5 (sampler wrapper) và của T8
  (watcher grep o8 log) — chuỗi lệnh chứa đường dẫn vite
  trong args, không phải process vite). 0 Xvfb (xem §10).
- Snapshot mở (08:42:11Z) rơi vào cửa sổ 19 s giữa lúc
  T8-145 acquire (08:42:30Z) và lúc T6 mở — lock genuinely
  trống tại thời điểm snapshot mở (log 1148 dòng, event
  cuối là t10-round144 RELEASED 08:20:09Z); T8 acquire
  SAU snapshot mở 19 s — không phải do T6 bỏ sót.

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; 1 chu kỳ mới trong phiên T6 (sạch)

- **Lúc mở (08:42:11Z): thư mục lock thật
  `hidden_files/vite.lock` KHÔNG TỒN TẠI** — status
  `TRỐNG (không có lock)`, `0 ticket + 98 cooldown`, rc=0.
- **Lúc đóng (08:46:04Z): lock TRỐNG** — status `TRỐNG`,
  `0 ticket + 99 cooldown`, rc=0.
- **Log lock +3 dòng trong phiên T6: 1148 dòng thô lúc mở →
  1151 dòng thô lúc đóng** — đúng 1 chu kỳ mới, sạch:
  - t8-round145 ×1 (08:42:29Z → 08:46:01Z; hold 212 s;
    port 5560; wait_s=1; TICKET + ACQUIRED + RELEASED).
  - Không có COOLDOWN log mới trong chu kỳ này (wait_s=1
    không ghi event COOLDOWN — cùng mẫu t8-round144 O8
    wait_s=0 đợt 144); file cooldown mới duy nhất là
    `cooldown-t8-round145` (mtime 08:46:01Z — ghi đè cùng
    tên sau release của t8; tổng queue 98 → 99, §7).
- Bản đã lọc lúc đóng md5 `b75a7f0d…` (1145 dòng) — khác
  bản đã lọc lúc mở (1142 dòng, md5 `c585db74…`) đúng 3
  dòng mới; bản thô lúc đóng md5 `ec49c26f…`.
- Khoảng yên trước đó: không có event lock nào từ 08:20:09Z
  (t10-round144 release cuối) tới 08:42:29Z (t8-round145
  acquire) — yên lặng này là do đợt 144 đã đóng và đợt 145
  mới mở — không phải do lock kẹt (bằng chứng: suite độc lập
  9/9 ×2, §6; 11 chu kỳ đợt 144 sau T6-144 đóng đều sạch,
  §4).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 75 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 12 chu kỳ mới kể từ
  lúc T6-144 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4;
  đếm bằng TICKET sau snapshot đóng T6-144 05:48:06Z):
  - t8-round144 ×6 (harness 6/6, TICKET 06:22:39Z →
    06:34:56Z; RELEASED holds 80 / 140 / 241 / 70 / 130 /
    231 s),
  - t4 ×4 (attempts 2–5 lượt yên #19, TICKET 05:48:15Z /
    05:58:53Z / 06:03:14Z / 06:07:30Z),
  - t10-round144 ×1 (08:18:11Z → 08:20:09Z; hold 118 s),
  - t8-round145 ×1 (08:42:29Z → 08:46:01Z; hold 212 s).
  - Cộng với 63 chu kỳ T6-144 đã đếm = **75 chu kỳ liên
    tiếp sạch trên thứ tự mới** (63 đợt 144 + 12 đợt này).
  - Bằng chứng phiên bản: T8-145 dùng script repo
    (`run-webkit-145t8.sh` dòng 33: `LOCK=.../vcut-vite-
    lock-v2.sh`); T4-145 dùng script repo
    (`run-attempt-145.sh` dòng 23:
    `LOCKV2=.../vcut-vite-lock-v2.sh`) — tức tất cả đều
    chạy trên **thứ tự ghi mới** (§11).
- **File `cooldown-t8-round145` mtime 08:46:01Z** (release
  của t8-145); file `cooldown-t10-round144` mtime 08:20:09Z
  (release cuối của t10-144); `cooldown-t8-round144` mtime
  06:38:47Z (release cuối của t8-144). Không file cooldown
  nào mới trong phiên T6 ngoài `cooldown-t8-round145` (do
  release hợp lệ của t8-145 — xem §2).
- **T10-145 chưa chuẩn bị bản frozen** lúc T6 đóng (thư mục
  round145-t10 chỉ có count-final-145.py + wait-flags) —
  T6 đợt sau kiểm md5 khi T10 chuẩn bị.

## 4. Nhất quán log lock: 1142 dòng chính thức lúc mở → 1145 lúc đóng, 331 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
multiset diff trên cả hai snapshot: đúng 6 dòng đó là phần
chênh giữa raw và bản đã lọc, gồm 2 TICKET + 2 ACQUIRED +
2 RELEASED).
Bản đã lọc lúc mở có 1142 dòng; lúc đóng có 1145 dòng —
**KHỚP ĐÚNG số T10-144 đếm lúc đóng đợt 144 (aggregate
§10.4: thô 1148 / chính thức 1142; TICKET 347/345,
ACQUIRED 338/336, RELEASED 332/330, COOLDOWN 116,
TIMEOUT 8, STALE-LOCK 6, STALE-TICKET 1)** và KHỚP ĐÚNG
số T6-144 đếm lúc đóng (thô 1110 / chính thức 1104, cộng
thêm 38 dòng sau đó = 8 chu kỳ đợt 144 còn lại + 1 chu kỳ
t10-144 — xem §3). Ba nguồn độc lập đồng thuận về số lúc
mở — TRỪ số queue file của T10-144 (xem F-145-T6-1, §12).

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-144 (1104) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 346 | 334 | 255 | 249 |
| ACQUIRED | 337 | 325 | 255 | 249 |
| RELEASED | 331 | 319 | 253 | 247 |
| COOLDOWN | 116 | 111 | 108 | 103 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **1145** | **1104** | **872** | **849** |

- So với snapshot T6-144 đóng (1104 dòng): **+41 dòng =
  TICKET +12 / ACQUIRED +12 / RELEASED +12 / COOLDOWN +5 /
  TIMEOUT +0 / STALE +0** — đúng bằng 12 chu kỳ mới (§3)
  + 5 COOLDOWN (5 trong 6 chu kỳ harness của t8-round144 có
  wait_s>1 — 5 event COOLDOWN sau snapshot T6-144 đóng đều
  là của t8-round144: 06:23:59Z / 06:26:34Z / 06:30:50Z /
  06:32:16Z / 06:34:41Z; chu kỳ harness đầu wait_s=0 nên
  không có event). Mọi chu kỳ đều sạch, ghép cặp đủ — khớp
  từng con số, không có event nào mất dấu hay thêm lạ ngoài
  ca t4 cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 1145 dòng): **331 cặp ACQUIRED→RELEASED;
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
- Cửa sổ R120: **255 = 255 T/A, RELEASED 253** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  346+337+331+116+8+6+1 = 1145 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 144 khép lại trên lock (toàn đợt): 13 chu kỳ sạch**
  — 2 trong phiên T6-144 (t8-144 O8 + t4 attempt 1) + 11 sau
  khi T6-144 đóng snapshot (t4 ×4 attempts 2–5 + t8-round144
  ×6 harness + t10-round144 ×1) — khớp đúng recount T10-144
  (log 1148 dòng thô lúc T10-144 đóng sổ 08:20:09Z).
  **Đợt 145 tới 08:46:04Z có 1 chu kỳ** (t8-round145 O8).
  T4-145 chưa có attempt nào tới lúc T6 đóng — T6 đợt 146
  đếm tiếp. Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 143 (toàn đợt), đợt 144 (toàn đợt) và đợt 145 (tới 08:46Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round143-t*/` + `round144-t*/` +
`round145-t*/` (tới 08:46Z) — theo quy tắc lăn: bỏ round142,
thêm round144 (phần còn lại sau T6-144) + round145. **Phương pháp đếm đợt này:
grep ra file /tmp trước, `--exclude` file grep-output
(`khong-nha-grep.txt`) NGAY từ lần đầu + KHÔNG loại file
repro theo basename (bài học F-144-T6-3), trừ tay 3 dòng
repro của chính mình sau khi đếm** (theo bài học F-142-T6-2:
không đếm lồng file grep-output; bài học T6-138 §5).
**Lưu ý phương pháp:** pattern grep có dấu (`KHÔNG NHẢ` /
`BỎ QUA release thừa`) — các file `.done` của T6 viết bằng
ASCII không dấu (`"KHONG NHA"`) nên KHÔNG khớp pattern này.
Tổng **13 dòng khớp, phân loại đủ 13/13 — tất cả đều là
bản sao script / log repro, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round143-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round144-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`, md5 T6 kiểm trực tiếp đợt này) |
| Tái hiện có kiểm soát trên /tmp | 9 | `round143-t6/repro-newmsg.log` (3) + `round144-t6/repro-newmsg.log` (3) + `round145-t6/repro-newmsg.log` (3, của chính T6 đợt này — đếm ở đợt 146) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 0 | Không file `.done` nào trong phạm vi khớp pattern có dấu (các file `.done` của T6 viết không dấu) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 143 (toàn đợt) / 144 (toàn đợt) / 145 nào |
| Round145-t* (trừ repro /tmp của T6) | 0 dòng | T10-145 chưa chuẩn bị bản frozen script; chưa có driver log nào khác khớp |

- **Repro đợt này (chưa đếm, đếm ở đợt 146):**
  `round145-t6/repro-newmsg.log` 3 dòng (2 `BỎ QUA` +
  1 `KHÔNG NHẢ`) trên /tmp — xem §6.2.
- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt
  122 = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125
  = 0 (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0
  (toàn đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn
  đợt), đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt),
  đợt 132 = 0 (toàn đợt), đợt 133 = 0 (toàn đợt),
  đợt 134 = 0 (toàn đợt), đợt 135 = 0 (toàn đợt), đợt 136
  = 0 (toàn đợt), đợt 137 = 0 (toàn đợt), đợt 138 = 0
  (toàn đợt), đợt 139 = 0 (toàn đợt), đợt 140 = 0 (toàn
  đợt), đợt 141 = 0 (toàn đợt), đợt 142 = 0 (toàn đợt),
  đợt 143 = 0 (toàn đợt), đợt 144 = 0 (toàn đợt — bổ sung
  11 chu kỳ sau T6-144 đóng, §4), đợt 145 tới 08:46Z = 0.**
  Khớp với log pairing sạch ở §4 (331 cặp + 1 ca
  reboot-kill cũ đã giải thích — không liên quan nhánh
  release).
- Giới hạn phạm vi: T4/T10-145 chưa chạy xong tới 08:46Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  145, T6 đợt 146 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-144 đếm 10 dòng (4 script + 6
  repro); đợt này bỏ round142 (−2 script −3 repro = −5)
  nhưng thêm round144 (+2 script t10 +3 repro t6 = +5)
  và round145-t6 repro (+3) = 10 − 5 + 5 + 3 =
  **13 dòng** ✓ (round145-t10 chưa có script frozen nên
  +0). Trừ 3 dòng repro của chính mình → **10 dòng phân
  loại chuẩn** (4 script + 6 repro cũ).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
e146ca67 (`#108?` đếm chặt).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round145-t6/test-v2-t6-run1.log` ~08:43Z,
`test-v2-t6-run2.log` ~08:44Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ hai mươi mốt liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — hai mươi mốt lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ hai mươi bảy liên tiếp (T6
  đợt 120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 144 + T6
  đợt 145).

### 6.2 Repro message ĐÚNG (`round145-t6/repro-newmsg.log`, 08:44:23Z)

Copy verbatim script của T6-144, chỉ đổi tên TDIR
(`vcut-t6r144-repro` → `vcut-t6r145-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–144, kết quả giống hệt:
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
  lúc đó có 98 cooldown; log thật vẫn 1150 dòng thô lúc
  repro chạy (t8-round145 TICKET+ACQUIRED, chưa RELEASED)
  và queue vẫn 98 file sau khi repro xong; không có file
  `cooldown-tA/tH/tB` nào xuất hiện trong queue thật.
  **F-132-T6-1 KHÔNG lặp lại.**
- **Lưu ý quan sát phụ (không phải sai số):** status trong
  repro lúc C hiện `vite bất kỳ đang chạy: pid=15872 node
  ... vite.o8w.config.mjs --port 5560` — đó là vite O8
  WebKit của chính T8-145 (bắt đầu 08:43:50Z, trong lúc
  T8 giữ lock port 5560 — xem §11), đã thoát cùng release
  08:46:01Z (`curl5560=000000` sau release theo status
  đóng của T6 — không còn process vite nào, §1). Không
  phải vite sót.
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (331 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy nhất do reboot
  giữa lượt (đợt 130), 0 sự kiện "KHÔNG NHẢ" trên lock thật
  đợt 120–144 (toàn đợt) và đợt 145 (tới 08:46Z), suite 9/9
  độc lập ×2 lần chạy (T7 xanh cả hai lần), và thứ tự ghi
  mới đã có **75 chu kỳ thật** chứng minh (§3). **Không còn
  caveat nào về mất dòng RELEASED cho các chu kỳ mới** —
  caveat cũ chỉ còn là 1 dòng lịch sử (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **1 chu kỳ lock mới trong
  phiên T6 sạch** (t8-145 O8 hold 212 s); T4-145 chưa có
  attempt nào tới lúc T6 đóng — T6 đợt 146 đếm tiếp.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 20 liên tiếp)

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
  - 08:46Z: lock TRỐNG (status 0 ticket + 99 cooldown —
    kiểm 2 lần: lúc snapshot đóng + kiểm lại ngay trước
    prune) — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng) — tổng 99 file ≤ trần mềm 100 nên điều (b) cũng
    không kích hoạt.
  - **Kết quả prune đợt 145: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Đây là kết quả đúng của luật — luật đã chạy, không
    phải luật chưa chạy. File cooldown cũ nhất sẽ đủ 7
    ngày theo đồng hồ tường vào khoảng **21/11 18:38Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 18:38Z**. T6 các đợt sau đếm
    tiếp. Đây là lần thứ 20 liên tiếp prune xóa 0 file
    (đợt 126–145: 0 mỗi đợt).
  - Lưu ý: 1 file cooldown mới trong phiên T6
    (`cooldown-t8-round145`, do release hợp lệ của t8-145,
    §2/§4). Số file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (08:42Z) **98 file / 1372 byte**;
  lúc đóng (08:46Z) **99 file / 1386 byte** (99 × 14 =
  1386 khớp cả hai lần; `ls`/`find`/`status` khớp nhau).
  Số học khớp: 98 + 1 = 99 ✓ (1 file cooldown mới:
  `cooldown-t8-round145`; `cooldown-t4` ghi đè cùng tên
  nên không tăng tổng — T4 chưa có attempt mới đợt này
  nhưng file cũ vẫn còn từ đợt 142). Không file nào bị xóa
  hay thêm giữa hai lần đếm của đợt này ngoài file trên.
- Phân tầng tuổi lúc ~08:45Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 36 file** (tăng từ 32 đợt 144 — 4 file
  mtime 16/11 05:48Z–08:44Z vừa vượt 72h, đúng quy luật
  tuổi); **≥48h (`-mtime +1`): 67 file** (tăng từ 65 đợt
  144 — 2 file vừa vượt 48h, đúng quy luật tuổi). File cũ
  nhất `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z —
  lúc 08:46Z mới **~110h08' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#108? + e146ca67; số tuyệt đối VẪN TẠM; chuỗi INSIDE 2 làm chuẩn → 4 chờ T2-145 xác nhận chính thức

### 8.0 Reboot #32 — cc222c8a → e146ca67 (btime 07:56:16Z), giữa lượt 144

- Reboot cc222c8a → e146ca67 (btime 07:56:16Z) xảy ra giữa
  lượt 144 (trong lúc T10-144 chờ cờ, ~07:56:16Z; vòng chờ
  cờ thứ hai của T10 bị SIGTERM cùng lúc — F-144-T10-2;
  watcher guard vòng 2 của T9 biến mất trong cửa sổ này —
  xem aggregate đợt 144 §9.2/§10.2) — **sự kiện #32** theo
  đánh số của aggregate đợt 144 §10.2 (quy tắc đứng: mỗi
  lần đổi boot_id là 1 sự kiện, kể cả reboot trong lúc đóng
  sổ). **Quyết parent (f) đợt 144: XÁC NHẬN là sự kiện #32;
  boot e146ca67 = #108? theo đếm chặt.**
- **Không luồng nào mất việc do reboot này trong phiên
  T6:** T6 mở 08:42:11Z và đóng 08:46:04Z toàn bộ trên boot
  mới, không bị reboot cắt (uptime liền mạch 45'55" →
  49'48'). Reboot xảy ra trước khi đợt 145 mở (08:35:51Z).
- **Replay apt sau boot e146ca67: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-145 đã viết
  POSTBOOT_PASS cho boot mới lúc 08:45:28Z (poll=2,
  repair=none/replay-full, dpkg 1545/221 — xem §11); T2-145
  `dpkg106.txt` ghi 1.545 dòng, gói cuối gstreamer1.0-tools
  1.24.2-1ubuntu0.2 lúc 08:00:09Z — replay xong ~4 phút sau
  btime.
- **/tmp đã bị reboot xóa sạch:** socket Xvfb của T10-144
  (do chính suite/O8 của T10 tạo, đã dọn tay 08:20Z —
  aggregate đợt 144 §10.4) không còn; `/tmp/.X11-unix/`
  TRỐNG cả lúc T6 mở lẫn lúc đóng (xem §10).

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1 / T6-138 §8.1 / T6-139 §8.1 /
  T6-140 §8.1 / T6-141 §8.1 / T6-142 §8.1 / T6-143 §8.1 /
  T6-144 §8.1):
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

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm cc222c8a + e146ca67 theo cách đếm chặt)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 / T6-138 §8.2 /
T6-139 §8.2 / T6-140 §8.2 / T6-141 §8.2 / T6-142 §8.2 /
T6-143 §8.2 / T6-144 §8.2 (mỗi boot liệt kê với boot_id +
btime lấy từ ≥1 nguồn độc lập; btime→btime danh nghĩa =
khoảng cách giữa hai btime liên tiếp). **Số thứ tự dùng
CÁCH ĐẾM CHẶT làm chuẩn** theo quyết parent (c) đợt 143:
b47f7932 = #103?, 9afdaa89 = #104?, 70a5b0fc = #105?,
691a7403 = #106? (nhãn (d) đợt 142 bị thay thế — đều là
nhãn TẠM nên việc sửa là hợp lệ). **Định nghĩa đếm dùng:
định nghĩa gộp của T10 (LIMITS gộp đợt 133 §10.2) — mọi
reboot quanh đợt, cả giữa lượt lẫn ranh giới — theo quyết
F-133-6.** Bảng dưới chỉ ghi 7 boot cuối (chuỗi đầy đủ
#57→#101 xem T6-131 §8.2 + T6-132 §8.2 + T6-133 §8.2 +
T6-134 §8.2 + T6-135 §8.2 + T6-136 §8.2 + T6-137 §8.2 +
T6-138 §8.2 + T6-139 §8.2 + T6-140 §8.2 + T6-141 §8.2 +
T6-142 §8.2 + T6-143 §8.2 + T6-144 §8.2 — không chép lại
để khỏi drift; T6 đợt này đã đối chiếu lại với LIMITS gộp
đợt 144: các boot #102?→#106? dưới đây khớp đúng btime/
boot_id T10-144 đã chốt, không có boot_id lạ nào xuất hiện
trong bất kỳ bằng chứng 18–19/11 nào ngoài chuỗi này).

| # (tạm, đếm chặt) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #102 | bde599df | 22:48:05Z 18/11 | 1h05m33s (3.933 s — gap #102?→#103?, CHỨNG NHẬN [3.923, 3.943] s, T2-143 + quyết parent (d) đợt 143); sống tới 23:53:38Z | T6-143 + T2-143 (prereg + probe #62 + merged mù #62) + T10-142 §10.2 + quyết parent (d) đợt 143 (CERT 63 / FULL 78 XÁC NHẬN) |
| #103 | b47f7932 | 23:53:38Z 18/11 | 0h00m42s (42 s — gap #103?→#104?, SPAN — đoạn B mù #62 không chứng nhận được, quyết parent (e) đợt 143 BÁC floor cơ học = 0); sống tới 23:54:20Z | T6-143 + T2-143 (prereg + merged mù #62) + T7-142 + T9-142 + T10-142 §10.2 + quyết parent (c) đợt 143 (đếm chặt: b47f7932 = #103?) |
| #104 | 9afdaa89 | 23:54:20Z 18/11 | 2h01m05s (7.265 s — gap #104?→#105?, SPAN — đoạn C mù #62 MỞ, tối đa 2 ẩn, quyết parent (e) đợt 143 BÁC continuity dòng-log làm closer); sống tới 01:55:25Z | T7-142 + T9-142 + T10-142 §10.2 + T2-142 (btime TRONG dải FULL77 neo #102? [23:15:16Z, 01:12:54Z] — xem §8.8/F-144-T6-1) + quyết parent (c) đợt 143 (đếm chặt: 9afdaa89 = #104?) |
| #105 | 70a5b0fc | 01:55:25Z 19/11 | 2h00m20s (7.220 s — gap #105?→#106?, CHỨNG NHẬN [7.210, 7.230] s, mù #63 đóng hoàn toàn, T2-144 + quyết parent (c) đợt 144); sống tới 03:55:45Z | T6-143 + T2-143 prereg + boot-verify + probe #62 + T7-143 NOTES + T10-142 (suite + O8 chạy trên boot này 01:57–02:04Z) + quyết parent (c) đợt 143 (đếm chặt: 70a5b0fc = #105?) |
| #106 | 691a7403 | 03:55:45Z 19/11 | 1h57m30s (7.050 s — gap #106?→#107?, CHỜ merged mù #64 của T2-145 chứng nhận; khoảng dự kiến [7.040, 7.060] s theo prereg T2-145); sống tới 05:53:15Z | T6-144 (brief + uptime/journal//proc/1/wtmp) + T2-144 prereg + boot-verify (probe #63 ok=2 fail=0) + T7-144 NOTES + T10-143 (suite + O8 chạy trên boot này 03:58–05:27Z) + quyết parent (c) đợt 143 (đếm chặt: 691a7403 = #106?) + quyết parent (g) đợt 144 (khung chết CHỐT (05:52:15Z, 05:53:15Z] 60 s) |
| #107 | cc222c8a | 05:53:15Z 19/11 | 2h03m01s (7.381 s — gap #107?→#108?, CHỜ merged mù #64 của T2-145 chứng nhận; khoảng dự kiến [7.371, 7.391] s theo prereg T2-145); sống tới 07:56:16Z | T7-144 (ba nguồn, kiểm 3 lần) + T9-144 (uptime + btime + boot_id + who-b + journal) + T2-144 boot-verify/LIMITS §2.11 + T10-144 §10.1/§10.2 + quyết parent (e) đợt 144 (reboot #31 XÁC NHẬN) |
| #108 | e146ca67 | 07:56:16Z 19/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T2-145 prereg + boot-verify ×2 (probe #64 ok=2 fail=0) + T7-145 NOTES + T10-144 (suite + O8 chạy trên boot này 08:13–08:20Z) + quyết parent (f) đợt 144 (e146ca67 = #108? đếm chặt) |

- **Ghi chú bảng:** các hàng #102–#106 chép nguyên từ bảng
  T6-144 (đã qua soát xét đợt 144, cập nhật verdict gap
  theo quyết parent (c)/(d) đợt 144: gap #105?→#106? nay
  CHỨNG NHẬN [7.210, 7.230] s — CERT 64 / FULL 79); hàng
  #107–#108 là boot mới theo quyết parent (e)/(f) đợt 144.
  Nhãn gap trong ngoặc ở mỗi hàng là gap ứng với tuổi thọ
  danh nghĩa của boot đó (btime → btime boot sau) **theo
  cách đếm chặt**.
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
  §10.2); **#106?→#107? là sự kiện thứ 31** (GIỮA LƯỢT
  144, trong lúc T10-144 chờ cờ — quyết parent (e) đợt
  144 XÁC NHẬN); **#107?→#108? là sự kiện thứ 32**
  (GIỮA LƯỢT 144, trong lúc T10-144 chờ cờ — quyết parent
  (f) đợt 144 XÁC NHẬN).
- **T2-145 + T7-145 đối chiếu khớp (độc lập, trước/sau khi
  T6 đo):** prereg-t2.md ghi boot mới `e146ca67…`, btime
  07:56:16Z, gọi là #108? đếm chặt; `boot-verify.txt` khớp
  đúng boot_id + btime của T6 (verify ×2); probe #64
  (`once.txt`: `probe#64 boot=e146ca67 ok=2 fail=0`) xác
  nhận boot đang sống; T7-145 NOTES kiểm lần 1 (~08:41Z)
  khớp đúng boot_id + btime + epoch. Ba luồng khớp nhau
  hoàn toàn về boot_id, btime, epoch và số chặt.
  T2-145 cũng ghi rõ mù #64 có 3 đoạn (A 583 s / B 7.381 s
  / C 2.716 s) và dự báo đóng hoàn toàn nếu B đóng (xem
  §8.10).
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#96: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3 +
    T6-138 §8.2–§8.4 + T6-139 §8.2–§8.4 + T6-140 §8.2–§8.4
    + T6-141 §8.2–§8.4 + T6-142 §8.2–§8.4 + T6-143 §8.2–
    §8.5 + T6-144 §8.2–§8.5 (không chép lại).
  - #95: khung ứng viên 400 s (xem §8.3).
  - #102 (bde599df): khung **XÁC NHẬN (23:52:41Z,
    23:53:38Z] (57 s)** — quyết parent (f) đợt 143.
  - #104 (9afdaa89): khung **XÁC NHẬN (01:45:44Z,
    01:55:25Z] (581 s)** — quyết parent (f) đợt 143 (thu
    hẹp 81 s so với ứng viên quét 662 s của T6-143).
  - #105 (70a5b0fc): khung **CHỐT LÀM CHUẨN (03:55:15Z,
    03:55:45Z] (30 s)** — quyết parent (d) đợt 144 (khớp
    đúng khung T9-143 + quét mtime T6-144).
  - #103 (b47f7932): khung **CHỐT LÀM CHUẨN (23:53:38Z,
    23:54:20Z] (42 s)** — quyết parent (d) đợt 144.
  - #106 (691a7403): khung **CHỐT LÀM CHUẨN (05:52:15Z,
    05:53:15Z] (60 s)** — khung T5, quyết parent (g) đợt
    144 (khung T8 theo đồng-hồ-cũ là hệ quả nhảy đồng hồ
    ~29 s, không phải khung độc lập).
  - #107 (cc222c8a): ứng viên quét mtime của T6, CHƯA CHỐT
    (xem §8.6).

### 8.3 Khung chết #95? — ứng viên 400 s GIỮ NGUYÊN (quét lại, không có bằng chứng mới)

- **Khung chết #95? ứng viên: (13:47:01Z, 13:53:41Z]
  (400 s)** — T2/T6/T10 đồng thuận đợt 139; T2-140 prereg
  §0 và T2-141 prereg §0 xác nhận giữ nguyên trừ khi có
  bằng chứng mới.
- T6 đợt này KHÔNG quét lại cửa sổ này (không có bằng chứng
  mới nào có thể xuất hiện: cửa sổ nằm ngày 18/11, đã đóng
  băng từ đợt 139; merged mù #64 không phủ cửa sổ này —
  mù #64 bắt đầu 05:43:32Z 19/11). **Khung 400 s giữ
  nguyên.** Mốc ~13:50Z của T1-139 vẫn chỉ là mốc suy ra,
  không có file mtime cứng — T6 ghi nhận lại để T2 cân nhắc,
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
  trong phiên T6 đợt này — merged mù #64 không phủ các
  cửa sổ này (mù #64 bắt đầu 05:43:32Z 19/11). Trạng thái
  ba khung từ nay là **ĐÃ CHỐT CHUẨN**, không còn hoãn quyết.

### 8.5 Khung chết #99?/#100?/#101? — ĐÃ CHỐT CHUẨN theo quyết parent đợt 142 §12.2(g)

- **Khung chết #99? chuẩn: (21:51:52Z, 21:52:21Z] (29 s)**
  — merged T2 TRÙNG KHỚP HOÀN TOÀN khung quan sát T9-141.
- **Khung chết #100? chuẩn: (22:32:05Z, 22:33:03Z] (58 s)**.
- **Khung chết #101? chuẩn: (22:45:49Z, 22:48:05Z] (136 s)**.
- Không có bằng chứng mới nào về ba khung này trong phiên
  T6 đợt này. Trạng thái ba khung từ nay là **ĐÃ CHỐT
  CHUẨN**, không còn hoãn quyết.

### 8.6 Khung chết #107? (cc222c8a) — ứng viên quét mtime của T6: (07:55:38Z, 07:56:16Z] (38 s), CHƯA CHỐT — chờ merged mù #64 của T2-145

- **Quét mtime của T6 (`scan-mtime-145.py`, hidden_files +
  docs, cửa sổ W (07:30:00Z, 07:56:16Z]): 4 file, mốc
  cuối 07:55:38Z** — `round144-t9/ram-sampler-long-2.log` +
  `ram-sampler-long-2.out` (T9-144 sampler vòng 2, cùng mốc
  07:55:38.35Z) + `round144-t9/b2-spike-watch-2.out` +
  `b2-spikes-2.log` (07:55:12.10Z). Không có file nào khác
  có mtime trong cửa sổ sau 07:55:38Z trong hai cây quét.
- Khung ứng viên theo quét này: **(07:55:38Z, 07:56:16Z]
  (38 s)** — KHỚP ĐÚNG khung ứng viên T10 (aggregate đợt
  144 §10.2: khung chết boot cc222c8a (T10): (07:55:38Z,
  07:56:16Z] (38 s, mẫu sampler cuối T9 → btime)).
  Hai nguồn độc lập (T10 + quét mtime của T6) đồng thuận
  hoàn toàn về mốc cuối 07:55:38Z.
- **T6 không tự chốt khung #107?** — merged mù #64 của
  T2-145 (đoạn B: 05:53:15Z → 07:56:16Z) là chứng nhận
  chính thức; T2 sẽ báo khung merged, parent quyết. Gap
  danh nghĩa #107?→#108? = **7.381 s (2h03'01")** — nằm
  trong dải chứng nhận [0h00'55", 3h14'08"]. Chứng nhận
  **[7.371, 7.391] s NẾU đoạn B mù #64 đóng** (T2-145
  prereg — T6 đối chiếu số học độc lập: 07:56:16Z −
  05:53:15Z = 7.381 s ✓).

### 8.7 Khung chết #106? (691a7403) — ĐÃ CHỐT khung T5 (05:52:15Z, 05:53:15Z] (60 s), quyết parent (g) đợt 144

- Khung T5 (05:52:15Z, 05:53:15Z] (60 s) nay là **CHUẨN**
  theo quyết parent (g) đợt 144 — neo tại btime (nguồn
  kernel, đáng tin nhất). Khung T8 theo đồng-hồ-cũ
  (05:53:44Z, 05:54:08Z] (24 s) được ghi nhận là hệ quả
  nhảy đồng hồ ~29 s, không phải khung độc lập. T9 không
  chốt được là nhất quán với lệch đồng hồ này.
- Merged mù #64 của T2-145 sẽ đối chiếu mốc cuối đoạn A
  (05:43:32Z → 05:53:15Z) — không chốt lại trừ khi merged
  tìm được mốc muộn hơn 05:52:15Z trong đoạn A (theo
  prereg T2-145).

### 8.8 Chuỗi INSIDE: 2 làm chuẩn → 4 chờ T2-145 xác nhận chính thức (T6 kiểm độc lập bằng code)

Quyết parent (h) đợt 144: **chuỗi INSIDE 2 (đếm chặt) LÀM
CHUẨN từ đợt 144**; cc222c8a INSIDE hậu nghiệm → chuỗi lên
3 (chờ T2-145 xác nhận chính thức bằng probe #64 + merged
mù #64). T6 đợt này kiểm độc lập cả hai boot mới bằng code
(python3, tính từ btime + p10/p90 FULL79 đã công bố:
p10 = 1.649 s, p90 = 8.670 s — từ T2-144 §2.5; dải #107?
[04:23:14Z, 06:20:15Z] của T2-144 khớp đúng tính T6):

- **cc222c8a INSIDE dải #107? (FULL79, neo 691a7403
  03:55:45Z): [04:23:14Z, 06:20:15Z]** — btime 05:53:15Z
  **INSIDE** ✓ (khớp đúng dải T2-144 đã công bố; T7/T10
  cũng ghi INSIDE hậu nghiệm). Chuỗi: 2 → **3**.
- **e146ca67 INSIDE dải #108? (FULL79, neo cc222c8a
  05:53:15Z): [06:20:44Z, 08:17:45Z]** — btime 07:56:16Z
  **INSIDE** ✓ (khớp đúng dự báo prereg T2-145:
  [06:20:44Z, 08:17:45Z]). Chuỗi: 3 → **4**.
- **T6 báo chuỗi = 4 (2 chuẩn + cc222c8a + e146ca67), với
  lưu ý: xác nhận CHÍNH THỨC thuộc về T2-145** (merged mù
  #64 + probe #64 — probe #64 đã xong ok=2 fail=0, merged
  chưa có lúc T6 đóng). T6 chỉ kiểm độc lập bằng code và
  ghi rõ cả hai bước — không tự thay quyết parent (h)
  (số chuẩn vẫn là 2 cho tới khi T2-145 xác nhận).
- Lưu ý: cận trên dải #108? (08:17:45Z) đã qua lúc T6 đóng
  (08:46Z) mà chưa có reboot — điều đó bình thường (dải
  p10–p90 chỉ bao 80% khối lượng, không phải cam kết).
- **Full boot_id b47f7932: KHÔNG có dữ kiện mới.**
  T7: `b47f7932-ebca-447e-a015-0a6c160efd98`; T9:
  `b47f7932-ebca-4205-86a0-b71a0ab9790c` (F-143-T6-1) —
  quyết parent (g) đợt 143: **ĐỂ MỞ**, ghi cả hai bản kèm
  nguồn, không chọn một. T6 đợt này không tìm thêm bằng
  chứng (không còn boot đó để đo lại) — ghi nhận đúng
  quyết, không tự quyết bên nào đúng.

### 8.9 Dải #109? TẠM (T6 tính độc lập — chờ T2-145 merged FULL80/81)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 / T6-138 §8.6 /
T6-139 §8.6 / T6-140 §8.6 / T6-141 §8.8 / T6-142 §8.9 /
T6-143 §8.10 / T6-144 §8.9 — p10–p90 của phân phối FULL79
(p10 = 1.649 s, p90 = 8.670 s), cộng vào btime e146ca67
07:56:16Z. **T6 dùng FULL79** (CERT 64 / FULL 79 đã xác
nhận theo quyết parent (c) đợt 144 — phân phối hiện hành
cho tới khi T2-145 chứng nhận thêm gap).

- **Dải dự báo T6 cho #109? (FULL79, TẠM): [08:23:45Z,
  10:20:46Z]** (07:56:16Z + 1.649 s = 08:23:45Z;
  07:56:16Z + 8.670 s = 10:20:46Z 19/11). Tính bằng code
  (python3), không nhẩm.
- **Cảnh báo:** nếu T2-145 chứng nhận gap #106?→#107?
  (7.050 s → CERT 65 / FULL 80) và/hoặc gap #107?→#108?
  (7.381 s → CERT 66 / FULL 81), p10/p90 sẽ dịch nhẹ và
  dải #109? chuẩn sẽ khác dải tạm này vài giây — T2-145
  công bố dải chuẩn trong LIMITS của mình; dải tạm của T6
  chỉ để đối chiếu, không dùng làm verdict.

### 8.10 Gap chờ chứng nhận (cách đếm chặt — T2-145 prereg, T6 đối chiếu số học độc lập)

- #102?→#103? = 3.933 s → khoảng **[3.923, 3.943] s
  CHỨNG NHẬN** (T2-143 + quyết parent (d) đợt 143 —
  CERT 63 / FULL 78).
- #103?→#104? = 42 s → **SPAN** (đoạn B mù #62 không
  chứng nhận được; quyết parent (e) đợt 143 BÁC floor cơ
  học = 0).
- #104?→#105? = 7.265 s → **SPAN** (đoạn C mù #62 MỞ,
  tối đa 2 ẩn; quyết parent (e) đợt 143 BÁC continuity
  dòng-log làm closer).
- #105?→#106? = 7.220 s → khoảng **[7.210, 7.230] s
  CHỨNG NHẬN** (mù #63 đóng hoàn toàn, T2-144 + quyết
  parent (c) đợt 144 — CERT 64 / FULL 79). **F-144-T6-2
  ĐÃ ĐƯỢC GIẢI QUYẾT:** số 7.280 s trong prereg T2-144 là
  lỗi gõ; T2-144 xác minh lại bằng code (F-144-T2-8) và
  chứng nhận theo số đúng 7.220 s.
- #106?→#107? = 7.050 s → khoảng **[7.040, 7.060] s NẾU
  đoạn B mù #64 đóng** (T2-145 prereg — T6 đối chiếu số
  học độc lập: 05:53:15Z − 03:55:45Z = 7.050 s ✓). Nếu
  chứng nhận: CERT 64→65 / FULL 79→80.
- #107?→#108? = 7.381 s → khoảng **[7.371, 7.391] s NẾU
  đoạn B mù #64 đóng** (đoạn B bao cả hai gap theo prereg
  T2-145 — T6 đối chiếu số học độc lập: 07:56:16Z −
  05:53:15Z = 7.381 s ✓). Nếu chứng nhận: CERT 65→66 /
  FULL 80→81.
- **Mù #64 (mới mở, T2-145 đang điều tra):** 05:43:32Z →
  08:41:32Z = 10.680 s (2h58'00"). Ba đoạn: A 583 s (boot
  691a7403, #106? — ngắn hơn sàn 1.147 s → đóng theo luật
  gap nếu có mốc hai đầu); B 7.381 s (boot cc222c8a,
  #107? — đoạn dài, cần merged chứng nhận); C 2.716 s
  (boot e146ca67, #108? — đóng theo luật gap + uptime trực
  tiếp). Nếu B đóng: mù #64 ĐÓNG HOÀN TOÀN → chuỗi mù đóng
  hoàn toàn lên 2 (#63, #64). T6 không tự chứng nhận gap
  nào — chờ merged T2-145.

### 8.11 VERDICT: chuỗi tương đối CHỐT #57→#108? + e146ca67; số tuyệt đối VẪN TẠM (giữ "?"); chuỗi INSIDE chờ T2-145 xác nhận chính thức

- **CHỐT ĐƯỢC — chuỗi tương đối:** 48 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới e146ca67 (07:56:16Z 19/11)
  xếp đúng thứ tự thời gian (tính cả b47f7932 là boot quan
  sát được, đánh số #103? chặt, và cc222c8a = #107?,
  e146ca67 = #108?), mỗi boot có boot_id + btime riêng biệt
  (trừ mâu thuẫn full id của b47f7932, §8.8), không có
  boot_id lạ nào trong bất kỳ bằng chứng nào ở khoảng giữa;
  các bước chuyển #74→#75→…→#107→#108 đều có ≥2 nguồn độc
  lập xác nhận (T5 + T2 + T6 + T7 + T9 + T10 + file mtime +
  T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-145 kiểm tiếp nếu có bằng chứng mới).
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
    tối đa 2 ẩn) + mù #63 ĐÃ ĐÓNG HOÀN TOÀN (quyết parent
    (c)/(i) đợt 144 — chuỗi mù đóng hoàn toàn bắt đầu lại
    ở 1) + mù #64 MỚI MỞ (T2-145 đang điều tra; probe #64
    xong ok=2 fail=0, prereg đã viết nhưng merged/LIMITS/
    .done chưa có lúc T6 đóng);** số #102?→#108? là TẠM
    theo quyết parent (c) đợt 143 (đếm chặt) — gap
    #103?→#104? / #104?→#105? vẫn là SPAN; gap #106?→
    #107? / #107?→#108? chờ merged mù #64; chuỗi INSIDE
    chờ T2-145 xác nhận chính thức (§8.8). T6-145 chốt chuỗi
    TƯƠNG ĐỐI (e146ca67 là boot quan sát được tiếp theo
    sau cc222c8a, không có boot quan sát được nào ở giữa)
    — số thứ tự tuyệt đối #102?→#108? chờ verdict của
    T2-145. **Ghi rõ "chờ T2" theo brief; T10 gộp.**
- **Kết luận cho parent:** T6-145 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 2 boot (#107? cc222c8a + #108?
  e146ca67 — reboot #31 + #32 giữa lượt 144); số thứ tự
  tuyệt đối **vẫn TẠM** và phải giữ "?" cho tới khi có bằng
  chứng ngoài VM (và, riêng #106?→#108?, tới khi mù #64
  đóng + chuỗi INSIDE được T2-145 xác nhận). Không bịa số,
  không bỏ "?" khi chưa đủ bằng chứng — đúng như brief giao.
- Hệ quả thực hành: T9-145 gọi boot lúc mở là "#108?"
  trong LIMITS của mình là đúng quy ước chặt; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #31 + #32 cho 2 reboot giữa lượt 144 — theo
  aggregate đợt 144 §10.2 + quyết parent (e)/(f) đợt 144).
  Các quyết parent trước vẫn đứng: không quyết con số tuyệt
  đối nào ở đây.

### 8.12 Reboot #31 + #32 — không mất việc của luồng T6; T6 không bị cắt

- Reboot #31 (691a7403 → cc222c8a, btime 05:53:15Z) và
  reboot #32 (cc222c8a → e146ca67, btime 07:56:16Z) xảy ra
  giữa lượt 144, trước khi đợt 145 mở (08:35:51Z) —
  **không giết attempt hay holder lock nào của đợt 145**
  (đợt 145 mở sau đó, trên boot mới; T8-145 acquire đầu
  08:42:29Z trên boot mới).

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **08:42:11Z** (boot e146ca67 đã
  45'55" tuổi); đóng **08:46:04Z** (boot e146ca67 đã
  ~49'48" tuổi). Đợt 145 mở **08:35:51Z**
  (sched 08:35:51Z) — tức **2.375 s sau btime boot
  e146ca67 (07:56:16Z)**.
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
  37 s) và lần 2 (btime 70a5b0fc + 32 s)), đợt 143 (lần
  thứ 14 + 15 + 16 — T7-143: started_at lượt 143 viết lại
  lần 1 tại reboot #30 (btime 691a7403 + 35 s, bằng chứng
  trực tiếp thứ tám); run 142 KHÔNG bị viết lại lần 3)
  và đợt 144 (lần thứ 17 + 18 — T7-144: run 144 viết lại
  lần 1 (btime cc222c8a + 44 s) và lần 2 (btime e146ca67
  + 41 s); run 143 KHÔNG viết lại lần 2 vì đã finished).
- **Quan sát mới T7-145 (NOTES mở ~08:41Z, T6 chỉ ghi
  mốc, không kết luận — T7 là chủ quản):** boot lúc mở
  e146ca67 khớp brief đợt 145 + boot-verify T2-145; KHÔNG
  có reboot mới từ kiểm cuối T7-144 (~07:57:09Z) tới lúc
  mở. Đợt 145 mở 2.375 s sau btime — tức run mở SAU boot
  nên không kỳ vọng viết lại tại boot này (cùng mẫu run
  144 tại boot 691a7403: mở sau boot, không viết lại cho
  tới khi reboot #31 xảy ra). T7-145 kiểm lần 1 ~08:42Z,
  lần 2 ~09:32Z, lần 3 ~10:23Z, kiểm cuối ~11:03Z — T6
  không đọc `scheduler.job_runs`, không kết luận thay T7.
- **F106? (chủ quản T2-145 — T6 chỉ ghi số thô, không kết
  luận):** `f106.txt` của T2-145 (08:41:45Z): HTTP `Date`
  3 server hơn local +1/+1/+1 s theo quy ước `Date −
  local_after` của T2 (example.com 08:41:44 vs local
  08:41:43; google.com 08:41:45 vs 08:41:44; cloudflare
  08:41:46 vs 08:41:45) — tức `Date − local_before` sẽ
  cho +2/+2/+2. T2-145 prereg ghi **F106? ≈ −1 s** (theo
  quy ước F = local − Date của T2; LẦN ĐẦU cả ba server
  đồng thuận +1). F105? là +1/+1/+0 (quy ước Date −
  local_after). Số liệu thô giống nhau, chỉ khác quy ước;
  offset thật nằm giữa hai cách tính, khoảng ±1–2 s.
  T6 không đo F, không kết luận — chờ verdict T2-145.
  F104? (70a5b0fc) ≈ −0..−1 s (T2-143). F103? (9afdaa89)
  CHƯA ĐO (T2-142 không đo HTTP Date trên boot đó) — ghi
  rõ, không bịa.

## 10. Dọn Xvfb: 0 Xvfb chạy; 0 socket sót lúc mở và lúc đóng

- **Lúc mở (08:42Z): 0 Xvfb đang chạy** (`pgrep -x Xvfb`
  rc=1; quét `ps-full-open.txt` không có process nào tên
  Xvfb). **`/tmp/.X11-unix/` TRỐNG** (x11-open.txt).
- **Lúc đóng (08:46Z): 0 Xvfb đang chạy** (pgrep rc=1),
  quét `ps-full-close.txt` không có process nào tên Xvfb.
  **`/tmp/.X11-unix/` TRỐNG** (x11-close.txt) — vite O8
  WebKit của T8-145 (MiniBrowser, bắt đầu 08:43:52Z) đã
  thoát cùng release 08:46:01Z và không để lại socket.
- **Socket X193/X194/X195 của T10-144 ĐÃ BIẾN MẤT** — T10
  đã dọn tay 08:20Z (sau khi suite/O8 xong) + reboot #32
  xóa /tmp; không còn socket nào từ đợt 144.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-145; T2-145
  prereg ghi MemAvailable lúc verify 424 MB (free -m) /
  564.136 kB (551 MB) lúc verify 2 — thấp, ghi nhận; T9-145
  đo chính thức; headroom thuộc T9).

## 11. Tuân thủ lock của luồng đo đợt 144 ĐÃ kiểm được + đợt 145 tới nay

- **T8-144 acquire + release sạch ×6 sau T6-144 đóng**
  (harness 6/6, TICKET 06:22:39Z → 06:34:56Z; RELEASED
  holds 80 / 140 / 241 / 70 / 130 / 231 s — harness 6/6
  QUA GATE đúng chuẩn lần đầu sau 2 đợt; xem §4). T8 dùng
  script repo (`run-webkit-144t8.sh` dòng 33) — tức chạy
  trên **thứ tự ghi mới** (§3). Đây là các lần chạy kiểm
  chứng vá watchdog — 0 kẹt thật đợt 144 nên vá chưa được
  thử bằng kẹt thật (quyết parent (l) đợt 144: giữ nguyên
  bản vá, chờ kẹt thật sau — đợt thứ ba liên tiếp).
- **T4-round144 acquire + release sạch ×4 sau T6-144 đóng**
  (attempts 2–5 lượt yên #19, TICKET 05:48:15Z / 05:58:53Z /
  06:03:14Z / 06:07:30Z — T6 đợt này đếm TICKET/ACQUIRED/
  RELEASED từng chu kỳ, khớp tổng §4; attempt 1 đã đếm ở
  T6-144). Lượt yên #19: 0 lượt hợp lệ theo luật đã lập trình
  nhưng hậu kiểm attempt3 boot mới đủ điều kiện (median
  55,0 ms) — **quyết parent (b) đợt 144: CHẤP NHẬN
  attempt3 làm lượt HỢP LỆ #19** (cộng dồn lên 16 lượt);
  **ngân sách retry = 3 attempt/đợt** (không tính attempt
  bị reboot giết); **vá B4 + sampler + attempt-tagging giao
  T4-145**; đợt 145 đo #20.
- **T10-144 acquire + release sạch ×1** (08:18:11Z →
  08:20:09Z; hold 118 s; port 5554; wait_s=0; ticket khớp
  log — suite 27/27 + O8 Chromium 21/21 + O8 WebKit 21/21
  trên boot e146ca67). T10 dùng bản frozen
  `round144-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
  (T6 kiểm trực tiếp đợt này) — tức chạy trên **thứ tự
  ghi mới** (§3).
- **Tổng kết đợt 144: 13 chu kỳ sạch** (2 trong phiên
  T6-144 + 11 sau khi T6-144 đóng — xem §3/§4);
  **tổng 75 chu kỳ liên tiếp sạch trên thứ tự ghi mới**
  (63 đợt 144 + 12 đợt này).
- **T8-145 acquire + release sạch ×1 tới 08:46Z**
  (08:42:29Z → 08:46:01Z; hold 212 s; port 5560; wait_s=1;
  ticket khớp log — O8 đang chạy, verdict thuộc T8-145).
  T8 dùng script repo (`run-webkit-145t8.sh` dòng 33,
  `LOCK=.../vcut-vite-lock-v2.sh`) — tức chạy trên **thứ
  tự ghi mới** (§3). Vite port 5560 của attempt WebKit
  (pid 15872, bắt đầu 08:43:50Z) nằm trong lúc T8 giữ lock
  — hợp lệ; đã thoát cùng release (không còn process vite
  nào lúc T6 đóng, §1).
- **T4-145 chưa có attempt nào tới lúc T6 đóng** (scripts
  chuẩn bị 08:42–08:43Z; `run-attempt-145.sh` dòng 23 dùng
  script repo — tức chạy trên **thứ tự ghi mới** khi chạy;
  vá B4 + sampler + attempt-tagging theo quyết parent (b)
  đợt 144 giao T4-145). T6 đợt 146 đếm tiếp.
- **T5-145 đã viết POSTBOOT_PASS cho boot mới**
  (`round145-t5/POSTBOOT_PASS`, 08:45:28Z:
  boot_id=e146ca67…, btime=07:56:16Z, pass_at=08:45:28Z,
  poll=2, repair=none/replay-full, dpkg=1545/221) — cờ
  postboot cho boot mới đã có TRƯỚC khi T4-145 chạy
  attempt đầu (T4 còn đang chuẩn bị lúc T6 đóng); gate0
  đợt này mở nhờ cờ T5 + T4-check-only (quyết (j) đợt 143
  đã kiểm chứng thực tế lần đầu đợt 144 — hoạt động đúng).
- **T10-145 chưa chạy suite/O8 tới lúc T6 đóng** (đang chờ
  cờ — `wait-flags-145.log`; chưa chuẩn bị bản frozen lock
  script — T6 đợt sau kiểm md5 khi T10 chuẩn bị).
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Đường dẫn đúng `apps/web/src/preview.tsx`.
- **O8 WebKit FAIL đợt 142 KHÔNG tái hiện (lần thứ ba
  độc lập):** T8-143 PASS 21/21 ×2 + T10-143 PASS 21/21
  trên boot 691a7403 (aggregate đợt 143); T8-144 PASS
  21/21 ×2 + T10-144 PASS 21/21 trên boot e146ca67
  (aggregate đợt 144) — chuỗi WebKit FULL PASS 1 → 2;
  kết luận trạng thái boot mới đã được quyết parent (b)
  đợt 142 + (i) đợt 143 chấp nhận. T6 không điều tra O8;
  verdict O8 đợt 145 thuộc T8-145/T10-145.

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-145-T6-1, F-145-T6-2 (mới,
  xem dưới).** Không có sai số đếm nào của T6 đợt này: số
  mở của T6 khớp đúng số T10-144 đếm lúc đóng (1148 thô /
  1142 chính thức, từng loại khớp đúng — TRỪ số queue file,
  xem F-145-T6-1).
- **F-145-T6-1 — T10-144 §10.4 ghi queue 116 file, thực
  tế là 98 (mới — T6 phát hiện, T10 xác minh):** aggregate
  đợt 144 §10.4 ghi "Lock TRỐNG lúc đóng: 0 ticket + 116
  cooldown (111 lúc T10-143 đóng + 5 mới)". T6-145 kiểm
  độc lập lúc mở (08:42:11Z): queue có **98 file / 1372
  byte** (98 × 14 = 1372 khớp; `ls`/`find`/`status` khớp
  nhau); diff với danh sách T6-144 lúc đóng (97 file):
  chỉ thêm đúng 1 file `cooldown-t10-round144`, mtime
  08:20:09Z = release của chính T10-144. Số 116 là **số
  event COOLDOWN trong log** (116 dòng), không phải số
  file trong queue — T10 đã lẫn hai số này (cùng mẫu
  T10-143: 111 event = 111 file được ghi trùng nhau một
  cách ngẫu nhiên? — không: T6-143 đóng với 96 file trong
  khi log lúc đó đã có 106 event COOLDOWN; hai số này
  vốn khác nhau từ lâu vì file cooldown ghi đè theo tên
  thread còn event COOLDOWN chỉ ghi khi có wait). Số
  event trong log của T10 là ĐÚNG (T 347 / A 338 / R 332 /
  C 116 — khớp đúng recount T6-145 lúc mở); chỉ số queue
  file bị ghi sai. Không ảnh hưởng kết luận lock (lock vẫn
  TRỐNG, A−R = 6 không đổi). T6 ghi rõ để T10-145 đối
  chiếu lại phương pháp đếm queue lúc đóng đợt 145 (đếm
  file bằng `ls | wc -l`, không lấy số event COOLDOWN).
- **F-145-T6-2 — Bản nháp ghi sai số chu kỳ mới 11/64, đúng
  là 12/75 (mới — đã sửa trước khi stage):** bản nháp §3
  ghi "11 chu kỳ mới (t8-round144 ×2 + t4 ×6 + t10 ×1 +
  t8-145 ×1)" và tổng "64 chu kỳ" — SAI. T6 đối chiếu lại
  delta TICKET (+12: 334→346 chính thức) với danh sách
  TICKET sau snapshot đóng T6-144 (05:48:06Z) và phát hiện:
  t4 có 4 TICKET sau snapshot (05:48:15Z attempt 2 — bắt
  đầu 9 s SAU snapshot đóng của T6-144 nhưng TRƯỚC giờ
  đóng 05:49:08Z của T6-144 — nên không nằm trong số
  T6-144 đếm; + 05:58:53Z / 06:03:14Z / 06:07:30Z) và
  t8-round144 có 6 TICKET harness (06:22:39Z–06:34:56Z),
  không phải ×2. Số đúng: **12 chu kỳ mới** (t4 ×4 +
  t8-144 ×6 + t10-144 ×1 + t8-145 ×1) và tổng **75 chu kỳ
  liên tiếp sạch** (63 + 12). Đã sửa §3/§4/§6.2/§11/§12
  trước khi stage. Số dòng/số đếm event trong tài liệu
  không sai (chỉ số chu kỳ nháp sai) — đã sửa, không ảnh
  hưởng kết luận. Bài học: đếm chu kỳ bằng TICKET sau
  snapshot, không cộng tay từ trí nhớ số attempt của
  aggregate (aggregate ghi "5 attempt" là tổng đợt, không
  phải số sau snapshot T6).
- **F-144-T6-1 (cũ, đã được parent quyết ở đợt 144):**
  chuỗi INSIDE 4 hay 2 — quyết parent (h) đợt 144: **2
  (đếm chặt) LÀM CHUẨN**; cc222c8a INSIDE hậu nghiệm → 3,
  chờ T2-145 xác nhận chính thức. T6 đợt này kiểm độc lập
  cả cc222c8a và e146ca67 đều INSIDE bằng code → chuỗi 4
  chờ T2-145 xác nhận chính thức (§8.8) — không tự thay
  số chuẩn.
- **F-144-T6-2 (cũ, ĐÃ ĐƯỢC GIẢI QUYẾT ở đợt 144):** gap
  T2-144 prereg 7.280 s lệch 60 s so với 7.220 s tính từ
  btime — T2-144 xác minh lại bằng code (F-144-T2-8) và
  chứng nhận gap [7.210, 7.230] s theo số đúng; CERT 64 /
  FULL 79 đã được quyết parent (c) đợt 144 XÁC NHẬN.
- **F-144-T6-3 (cũ, đã khắc phục):** grep "KHÔNG NHẢ" lần
  đầu loại sai file repro theo basename. T6 đợt này loại
  CHỈ file grep-output ngay từ lần đầu và trừ tay 3 dòng
  repro của chính mình (§5) — không lặp lại; tổng 13 dòng
  khớp đúng số học lăn.
- **F-144-T6-4 (cũ, đã khắc phục):** md5 bản đã lọc ghi sai
  trong bản nháp. T6 đợt này lấy md5 CHỈ từ file snapshot
  (raw-open `7585b84a…`, cleaned-open `c585db74…`,
  raw-close `ec49c26f…`, cleaned-close `b75a7f0d…`) — không
  lặp lại.
- **F-143-T6-1 (cũ, đã được parent quyết ở đợt 143):**
  xung đột đánh số (c)/(d) + mâu thuẫn full boot_id
  b47f7932 — quyết parent (c) đợt 143: **CHỌN CÁCH ĐẾM
  CHẶT làm chuẩn từ đợt 144** (b47f7932 = #103?,
  9afdaa89 = #104?, 70a5b0fc = #105?, 691a7403 = #106?,
  cc222c8a = #107?, e146ca67 = #108? — hai số sau theo
  quyết parent (e)/(f) đợt 144); quyết parent (g) đợt 143:
  **full boot_id b47f7932 ĐỂ MỞ** (ghi cả hai bản T7/T9
  kèm nguồn, không chọn một). T6 đợt này áp dụng đếm chặt
  trong toàn bộ tài liệu và ghi nhận full boot_id vẫn để
  mở (§8.8) — không lặp lại phần chưa quyết.
- **F-142-T6-1 (cũ, đã giải quyết ở đợt 142):** mâu thuẫn
  nhãn reboot #25/#26 — aggregate đợt 142 §12.2(c) đã chốt
  #26 theo cách đếm của T10 (mỗi lần đổi boot_id là 1 sự
  kiện, kể cả reboot trong lúc đóng sổ). Không lặp lại ở
  đợt này: T6-145 ghi đúng sự kiện #31 + #32 theo chốt đó.
- **F-142-T6-2 (cũ, đã khắc phục):** grep "KHÔNG NHẢ" lần
  đầu trả 33 dòng do chưa loại file grep-output. T6 đợt
  này loại `khong-nha-grep.txt` NGAY từ lần đầu (§5) —
  không lặp lại.
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
  Không lặp lại ở đợt này: T6-145 ghi đúng boot sống
  e146ca67 (khớp T2-145 boot-verify + probe #64 +
  T7-145 NOTES kiểm lần 1).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn; tổng 17 không đổi. T6-145 đã đếm lại đúng (§5:
  trích dẫn = 0 — các file `.done` của T6 viết không dấu
  nên không khớp pattern có dấu; đã giải thích phương pháp
  ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **Số hiệu boot mới (#102?→#108?) VẪN TẠM (xem §8.11):**
  chuỗi tương đối #57→#108? + e146ca67 đã chốt (48 boot,
  tính cả b47f7932 = #103? chặt); số tuyệt đối giữ "?"
  vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa 6, mù
  #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới #123); (b)
  mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51 đoạn B mở,
  tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng không làm
  neo được; (e) dị thường đồng hồ #84?→#85? (§8.4(b) đợt
  134) + dị thường đồng hồ quanh 23:54Z (§8.6/§8.8 T6-143);
  **(f) MỚI: mù #61 không đóng hoàn toàn + mù #62 không
  đóng hoàn toàn (quyết parent (e) đợt 143) + mù #63 ĐÃ
  ĐÓNG HOÀN TOÀN (quyết parent (c)/(i) đợt 144) + mù #64
  MỚI MỞ — số #102?→#108? + gap #106?→#107? / #107?→
  #108? chờ verdict T2-145; chuỗi INSIDE chờ T2-145 xác
  nhận chính thức; mù #56 A vẫn MỞ (quyết parent (e)) —
  số #93? cũng vẫn quy ước headline**. Journal/wtmp chỉ
  giữ boot hiện tại (journal `--list-boots` chỉ 1 dòng
  e146ca67; wtmp bắt đầu 07:56:32Z) nên T6 suy ra số hiệu
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
  **mù #62 KHÔNG ĐÓNG HOÀN TOÀN** (đoạn B không chứng nhận
  được, đoạn C mở tối đa 2 ẩn — quyết parent (e) đợt 143;
  BÁC cả hai đề xuất closer/floor của T2) + **mù #63 ĐÃ
  ĐÓNG HOÀN TOÀN** (T2-144 — gap #105?→#106? chứng nhận
  [7.210, 7.230] s, CERT 64 / FULL 79, quyết parent (c)
  đợt 144; chuỗi mù đóng hoàn toàn bắt đầu lại ở 1) +
  **mù #64 MỚI MỞ** (T2-145 đang điều tra; probe #64 xong
  ok=2 fail=0, prereg đã viết nhưng merged/LIMITS/.done
  chưa có lúc T6 đóng); mù #52 đã đóng hoàn toàn (T2-133);
  mù #54 đã đóng hoàn toàn (T2-135).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ hai
  mươi mốt liên tiếp không xóa tính flaky. Quyết tách T7
  khỏi gate 9/9 khi đợt đông vẫn thuộc về parent; T6 không
  tự đổi test.
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round143-t*/` (toàn đợt) +
  `round144-t*/` (toàn đợt) + `round145-t*/` tới 08:46Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T10-145 chưa chạy xong tới thời điểm đếm; T6
  đợt 146 đếm tiếp.
- **Prune cooldown lần 20 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 99 ≤ trần 100 lúc chạy). File
  cũ nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z,
  theo `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 144 khép sạch trên lock (§4):** 13 chu kỳ (2 trong
  phiên T6-144 + 11 sau đó: t4 ×4 attempts 2–5 + t8-144 ×6
  harness + t10-144 ×1) sạch — T6 đợt này đếm bổ sung
  bằng TICKET từng chu kỳ, khớp đúng recount T10-144;
  **đợt 145 tới 08:46Z có 1 chu kỳ sạch** (t8-145 O8);
  T4-145 chưa có attempt nào — T6 đợt 146 đếm tiếp. Không
  phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 08:46Z (trống, 0 ticket + 99 cooldown); đợt
  còn chạy tới ~11:15Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–144 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 75 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt boot e146ca67 đã có cờ POSTBOOT_PASS**
  (T5-145, 08:45:28Z — xem §11); verdict replay thuộc T5.
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- **T2-145 CHƯA XONG lúc T6 đóng (08:46Z):** probe #64 xong
  (ok=2 fail=0) và prereg + boot-verify + f106 đã viết
  (dự báo dải #108? chuẩn + chuỗi INSIDE lên 4 + gap
  #106?→#107? [7.040, 7.060] s và #107?→#108? [7.371,
  7.391] s nếu đoạn B mù #64 đóng) nhưng merged/LIMITS +
  .done chưa có. Theo brief, T6 ghi rõ "chờ T2" và để T10
  gộp — KHÔNG tự suy đoán số boot #102?→#108?, không tự
  chứng nhận gap #106?→#107? / #107?→#108?, không tự chốt
  khung chết #107? cuối cùng. T6 chỉ ghi thêm quan sát
  quét mtime của mình (§8.6: khung ứng viên (07:55:38Z,
  07:56:16Z] 38 s, khớp đúng ứng viên T10) + kiểm INSIDE
  độc lập bằng code (§8.8: cả hai boot đều INSIDE → chuỗi
  4) để T2-145 cân nhắc.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND145_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), file cooldown (prune đã chạy,
xóa 0 file; `cooldown-t8-round145` do release hợp lệ của
t8-145 — xem §3), Xvfb (0 process; `/tmp/.X11-unix/` TRỐNG
cả mở lẫn đóng — T6 không xóa gì).
Stage: `repo-1-push/paths-loop/phase9-round145-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round145-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, x11-open.txt, x11-close.txt,
boot-verify-open.txt, boot-verify-close.txt, time-open.txt,
time-close.txt, wc-open.txt, analyze-log-cleaned-open.txt,
vite-lock-v2-cleaned-open.log, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-close.log, vite-lock-v2-raw-open.log,
vite-lock-v2-raw-close.log, analyze-log.py,
cooldown-now-open.txt, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt,
khong-nha-grep.txt, test-v2-t6-run1.log,
test-v2-t6-run2.log, repro-newmsg-fixed.sh,
repro-newmsg-fixed145.sh, repro-newmsg.log,
scan-mtime-145.py, scan-mtime-145.txt, md5-open.txt).
