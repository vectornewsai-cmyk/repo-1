# PHASE9 ROUND146 T6 — lock health + prune lần 21 XÓA 1 FILE ĐẦU TIÊN (trần mềm kích hoạt) + chuỗi INSIDE 4 → 5 chờ T2-146 xác nhận chính thức (F-146-T6-1, F-146-T6-2) — LIMITS

- Đợt: 146, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 18:35 +07 19/11/2026 (= 11:35:51Z 19/11). Chạy
  11:37:15Z → 11:50:30Z 19/11/2026, toàn bộ trên một boot duy
  nhất 98a7c93f (ứng viên #109? đếm chặt) — KHÔNG có reboot
  trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune lần 21, suite kiểm lock 9/9
  ×2, chốt chuỗi boot với boot 98a7c93f (btime 09:54:03Z),
  kiểm chuỗi INSIDE theo quyết parent (e) đợt 145 (4 làm
  chuẩn; 98a7c93f INSIDE dải #109? → 5, chờ T2-146 xác nhận
  chính thức) + kiểm khung chết #108? (e146ca67) bằng quét
  mtime, kiểm mâu thuẫn full boot_id b47f7932 (T7 vs T9,
  F-143-T6-1) nếu còn dữ kiện mới — không quyết bên nào đúng
  nếu không đủ bằng chứng, chỉ ghi nhận (quyết parent (g)
  đợt 143: ĐỂ MỞ), kiểm Xvfb sót, ghi mọi sai số F-146-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round146-t6/` (status-open.txt,
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
  repro-newmsg-fixed146.sh, repro-newmsg.log,
  scan-mtime-146.py, scan-mtime-146.txt, md5-open.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT 98a7c93f (ứng viên #109? đếm chặt; xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `98a7c93f-83d3-40e5-8043-ee6dda19c5f1`, btime 09:54:03Z**
  (`/proc/stat` btime epoch 1795082043; `uptime -s` =
  09:54:03Z; `who -b` = Nov 19 09:54; `/proc/1` 09:54:19Z —
  chênh +16 s, cùng mẫu các boot trước (e146ca67: +15 s;
  cc222c8a: +15 s); `journal --list-boots` chỉ 1 dòng
  98a7c93f, first entry 09:54:19Z (boot +16 s)). Uptime
  ~1h43'12" lúc T6 bắt đầu (11:37:15Z), ~1h56'19" lúc đóng
  (11:50:22Z). Đây là boot sau **reboot #33** (e146ca67 →
  98a7c93f, trong lúc T10-145 chờ cờ — theo aggregate đợt
  145 §9.2/§10.2; quyết parent (g) đợt 145 XÁC NHẬN là sự
  kiện #33, boot này = #109? đếm chặt).
- **KHÔNG có mâu thuẫn btime lần này:** brief,
  T2-146 boot-verify (11:39:17Z) và T7-146 NOTES (mở
  ~11:37Z) đều ghi btime 09:54:03Z. T2-146 `boot-verify.txt`
  khớp đúng boot_id + btime; probe #65 của T2-146
  (`once.txt`: `probe#65 boot=98a7c93f ok=2 fail=0`,
  11:39:18Z) xác nhận boot đang sống. Ba luồng khớp nhau
  hoàn toàn (T6 + T2 + T7).
- **Đợt 146 mở 11:35:51Z** (sched 11:35:51Z) — tức **6.108 s
  sau btime boot 98a7c93f (09:54:03Z)**. T6 mở 11:37:15Z
  (6.192 s sau btime).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline. preview.tsx md5 `530e10a7`.
- Các luồng đợt 146 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round146-t1/t2/t4/t5/t7/t8/t9; T1-146 đã viết
  count-final (t1-count-final-146.txt); T2-146 đã viết prereg
  + boot-verify + f107 + probe #65 (ok=2 fail=0, boot
  98a7c93f) và đang điều tra mù #65 (blind65-*.py/log/txt)
  nhưng CHƯA viết merged verdict/LIMITS/.done lúc T6 đóng
  — T6 đối chiếu ở §8 với prereg-t2.md + once.txt +
  blind65-investigate.log; T5-146 đã viết POSTBOOT_PASS cho
  boot 98a7c93f lúc 11:37:57Z (§11); T8-146 đang chạy O8
  (§2/§11); T4-146 đang chờ cửa yên (poller #12 lúc
  11:50:07Z, chưa có attempt nào lúc T6 đóng — T6 đợt 147
  đếm tiếp); T9-146 sampler đang chạy; T10-146 chưa mở thư
  mục (chưa chuẩn bị bản frozen lock script — T6 đợt sau
  kiểm md5 khi T10 chuẩn bị).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật lúc mở, 0 còn sót lúc đóng — 0 cổng lạ

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 11:37Z
  (mở, `ps-full-open.txt`) và lúc 11:50Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (11:37Z): 0 tiến trình vite/node/webkit thật,
  0 tiến trình lock-script, 0 Xvfb** (xem §10). `ss -tlnp`
  lúc mở và lúc đóng đều chỉ còn dòng header (không cổng
  nào lắng nghe).
- **Lúc đóng (11:50Z): 0 vite/node/webkit thật còn sót**
  (vite O8 của T8-146 đã thoát cùng release 11:47:11Z —
  xem §2/§6.2; 1 dòng "vite" trong `ps-full-close.txt` là
  lệnh bash của chính T6 — chuỗi lệnh chứa đường dẫn vite
  trong args, không phải process vite). 0 Xvfb (xem §10).
- Snapshot mở (11:37:15Z) rơi vào cửa sổ 112 s giữa lúc
  đợt 146 mở (11:35:51Z) và lúc T8-146 acquire (11:39:07Z)
  — lock genuinely trống tại thời điểm snapshot mở (log
  1180 dòng, event cuối là t10-round145 RELEASED
  11:26:20Z); T8 acquire SAU snapshot mở 112 s — không
  phải do T6 bỏ sót.

## 2. Lock lúc mở: TRỐNG; lúc đóng: TRỐNG; 1 chu kỳ mới trong phiên T6 (sạch)

- **Lúc mở (11:37:15Z): thư mục lock thật
  `hidden_files/vite.lock` KHÔNG TỒN TẠI** — status
  `TRỐNG (không có lock)`, `0 ticket + 100 cooldown`, rc=0.
- **Lúc đóng (11:50:22Z): lock TRỐNG** — status `TRỐNG`,
  `0 ticket + 101 cooldown` (trước prune; sau prune 100
  file, §7), rc=0.
- **Log lock +3 dòng trong phiên T6: 1180 dòng thô lúc mở →
  1183 dòng thô lúc đóng** — đúng 1 chu kỳ mới, sạch:
  - t8-round146 ×1 (11:39:07Z → 11:47:11Z; hold 484 s;
    port 5560; wait_s=0; TICKET + ACQUIRED + RELEASED).
  - Không có COOLDOWN log mới trong chu kỳ này (wait_s=0
    không ghi event COOLDOWN — cùng mẫu các chu kỳ wait_s=0
    trước đây); file cooldown mới duy nhất là
    `cooldown-t8-round146` (mtime 11:47:11Z — file cooldown
    được ghi mỗi lần release, không phụ thuộc wait; tổng
    queue 100 → 101, §7).
  - Hold 484 s dài hơn hẳn O8 đợt 145 (212 s) — do O8 đợt
    này chạy bộ kiểm S0–S6 mask/track + WebKit ×2 +
    Chromium (log T8-146: `O8 DONE 11:47:11Z webkit1=0
    webkit2=0 chromium=0`); verdict O8 thuộc T8-146, T6
    chỉ ghi hold dài nhưng release sạch, không phải kẹt
    (lock đã nhả đúng, không TIMEOUT/STALE).
- Bản đã lọc lúc đóng md5 `64e794d7…` (1177 dòng) — khác
  bản đã lọc lúc mở (1174 dòng, md5 `b5f0c5af…`) đúng 3
  dòng mới; bản thô lúc đóng md5 `b5e4fe93…`.
- Khoảng yên trước đó: không có event lock nào từ 11:26:20Z
  (t10-round145 release cuối) tới 11:39:07Z (t8-round146
  acquire) — yên lặng này là do đợt 145 đã đóng và đợt 146
  mới mở — không phải do lock kẹt (bằng chứng: suite độc lập
  9/9 ×2, §6; 8 chu kỳ đợt 145 sau T6-145 đóng đều sạch,
  §4).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 84 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 9 chu kỳ mới kể từ
  lúc T6-145 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4;
  đếm bằng TICKET sau snapshot đóng T6-145 08:46:04Z):
  - t4 ×1 (attempt1 lượt yên #20, TICKET 08:53:03Z;
    RELEASED hold 216 s),
  - t8-round145 ×6 (harness 6/6, TICKET 09:01:30Z →
    09:13:38Z; RELEASED holds 70 / 140 / 241 / 70 / 131 /
    230 s),
  - t10-round145 ×1 (11:23:58Z → 11:26:20Z; hold 142 s),
  - t8-round146 ×1 (11:39:07Z → 11:47:11Z; hold 484 s).
  - Cộng với 75 chu kỳ T6-145 đã đếm = **84 chu kỳ liên
    tiếp sạch trên thứ tự mới** (75 đợt 145 + 9 đợt này).
  - Bằng chứng phiên bản: T8-146 dùng script repo
    (`run-webkit-146t8.sh` dòng 33: `LOCK=.../vcut-vite-
    lock-v2.sh`); T4-145 dùng script repo
    (`run-attempt-145.sh` dòng 23:
    `LOCKV2=.../vcut-vite-lock-v2.sh` — đã kiểm đợt 145);
    T10-145 dùng bản frozen md5 `520b8baa` (aggregate đợt
    145 §10.3) — tức tất cả đều chạy trên **thứ tự ghi
    mới** (§11).
- **File `cooldown-t8-round146` mtime 11:47:11Z** (release
  của t8-146); file `cooldown-t10-round145` mtime
  11:26:20Z (release cuối của t10-145); `cooldown-t8-
  round145` mtime 09:17:28Z (release cuối của t8-145
  harness). Không file cooldown nào mới trong phiên T6
  ngoài `cooldown-t8-round146` (do release hợp lệ của
  t8-146 — xem §2).
- **T10-146 chưa chuẩn bị bản frozen** lúc T6 đóng (chưa có
  thư mục round146-t10) — T6 đợt sau kiểm md5 khi T10
  chuẩn bị.

## 4. Nhất quán log lock: 1174 dòng chính thức lúc mở → 1177 lúc đóng, 340 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại bằng
multiset diff trên cả hai snapshot: đúng 6 dòng đó là phần
chênh giữa raw và bản đã lọc, gồm 2 TICKET + 2 ACQUIRED +
2 RELEASED).
Bản đã lọc lúc mở có 1174 dòng; lúc đóng có 1177 dòng —
**KHỚP ĐÚNG số T10-145 đếm lúc đóng đợt 145 (aggregate
§10.4: thô 1180 / chính thức 1174; TICKET 356/354,
ACQUIRED 347/345, RELEASED 341/339, COOLDOWN 121,
TIMEOUT 8, STALE-LOCK 6, STALE-TICKET 1)** và KHỚP ĐÚNG
số T6-145 đếm lúc đóng (thô 1151 / chính thức 1145, cộng
thêm 32 dòng sau đó = 9 chu kỳ đợt 145 còn lại + 1 chu kỳ
t8-146 — xem §3). Ba nguồn độc lập đồng thuận về số lúc
mở — kể cả số queue file lần này (100 file, T10-145 đếm
bằng `ls | wc -l` theo bài học F-145-T6-1).

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-145 (1145) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 355 | 346 | 264 | 258 |
| ACQUIRED | 346 | 337 | 264 | 258 |
| RELEASED | 340 | 331 | 262 | 256 |
| COOLDOWN | 121 | 116 | 113 | 108 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **1177** | **1145** | **904** | **881** |

- So với snapshot T6-145 đóng (1145 dòng): **+32 dòng =
  TICKET +9 / ACQUIRED +9 / RELEASED +9 / COOLDOWN +5 /
  TIMEOUT +0 / STALE +0** — đúng bằng 9 chu kỳ mới (§3)
  + 5 COOLDOWN (5 trong 6 chu kỳ harness của t8-round145 có
  wait_s=15 — 5 event COOLDOWN sau snapshot T6-145 đóng
  đều là của t8-round145: 09:02:41Z / 09:05:16Z /
  09:09:32Z / 09:10:57Z / 09:13:23Z; chu kỳ harness đầu
  wait_s=0 nên không có event). Mọi chu kỳ đều sạch, ghép
  cặp đủ — khớp từng con số, không có event nào mất dấu hay
  thêm lạ ngoài ca t4 cũ §3 T6-136.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 1177 dòng): **340 cặp ACQUIRED→RELEASED;
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
- Cửa sổ R120: **264 = 264 T/A, RELEASED 262** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  355+346+340+121+8+6+1 = 1177 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 145 khép lại trên lock (toàn đợt): 9 chu kỳ sạch**
  — 1 trong phiên T6-145 (t8-145 O8) + 8 sau khi T6-145
  đóng snapshot (t4 ×1 attempt1 #20 + t8-round145 ×6
  harness + t10-round145 ×1) — khớp đúng recount T10-145
  (log 1180 dòng thô lúc T10-145 đóng sổ 11:26:20Z).
  **Đợt 146 tới 11:50:22Z có 1 chu kỳ** (t8-round146 O8).
  T4-146 chưa có attempt nào tới lúc T6 đóng — T6 đợt 147
  đếm tiếp. Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 144 (toàn đợt), đợt 145 (toàn đợt) và đợt 146 (tới 11:50Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round144-t*/` + `round145-t*/` +
`round146-t*/` (tới 11:50Z) — theo quy tắc lăn: bỏ round143,
thêm round145 (phần còn lại sau T6-145) + round146. **Phương pháp đếm đợt này:
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
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round144-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round145-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 9 | `round144-t6/repro-newmsg.log` (3) + `round145-t6/repro-newmsg.log` (3) + `round146-t6/repro-newmsg.log` (3, của chính T6 đợt này — đếm ở đợt 147) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 0 | Không file `.done` nào trong phạm vi khớp pattern có dấu (các file `.done` của T6 viết không dấu) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 144 (toàn đợt) / 145 (toàn đợt) / 146 nào |
| Round146-t* (trừ repro /tmp của T6) | 0 dòng | T10-146 chưa chuẩn bị bản frozen script; chưa có driver log nào khác khớp |

- **Repro đợt này (chưa đếm, đếm ở đợt 147):**
  `round146-t6/repro-newmsg.log` 3 dòng (2 `BỎ QUA` +
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
  đợt 143 = 0 (toàn đợt), đợt 144 = 0 (toàn đợt), đợt 145
  = 0 (toàn đợt — bổ sung 8 chu kỳ sau T6-145 đóng, §4),
  đợt 146 tới 11:50Z = 0.**
  Khớp với log pairing sạch ở §4 (340 cặp + 1 ca
  reboot-kill cũ đã giải thích — không liên quan nhánh
  release).
- Giới hạn phạm vi: T4/T10-146 chưa chạy xong tới 11:50Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  146, T6 đợt 147 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-145 đếm 13 dòng (4 script + 9
  repro); đợt này bỏ round143 (−2 script −3 repro = −5)
  nhưng thêm round145-t10 script (+2 — 3 dòng repro
  round145-t6 đã nằm trong số T6-145 đếm vì đó là repro
  của chính T6-145) và round146-t6 repro (+3) = 13 − 5 +
  2 + 3 = **13 dòng** ✓ (round146-t10 chưa có script
  frozen nên +0). Trừ 3 dòng repro của chính mình →
  **10 dòng phân loại chuẩn** (4 script + 6 repro cũ).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
98a7c93f (`#109?` đếm chặt).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round146-t6/test-v2-t6-run1.log` ~11:38Z,
`test-v2-t6-run2.log` ~11:39Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ hai mươi hai liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119
  §1.2) vẫn được ghi nhận là bản chất — hai mươi hai lần
  xanh kép không xóa nó; quyết tách T7 khỏi gate 9/9 khi
  đợt đông vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ hai mươi tám liên tiếp (T6
  đợt 120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 145 + T6
  đợt 146).

### 6.2 Repro message ĐÚNG (`round146-t6/repro-newmsg.log`, 11:39:14Z)

Copy verbatim script của T6-145, chỉ đổi tên TDIR
(`vcut-t6r145-repro` → `vcut-t6r146-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–145, kết quả giống hệt:
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
  lúc đó có 100 cooldown; log thật vẫn 1182 dòng thô lúc
  repro chạy (t8-round146 TICKET+ACQUIRED, chưa RELEASED)
  và queue vẫn 100 file sau khi repro xong; không có file
  `cooldown-tA/tH/tB` nào xuất hiện trong queue thật.
  **F-132-T6-1 KHÔNG lặp lại.**
- **Lưu ý quan sát phụ (không phải sai số):** status trong
  repro lúc C (~11:39:13Z) hiện `vite bất kỳ đang chạy:
  none` — đúng lúc vite O8 của T8-146 vừa khởi động (log
  T8: vite dev :5560 lúc 11:39:12.697Z, "đã lên"
  11:39:19.551Z); snapshot repro không phải bằng chứng về
  vite O8. Vite đó chạy trong lúc T8 giữ lock và đã thoát
  cùng release 11:47:11Z (curl 5560/5554 = 000000 sau
  release theo log T8; 0 vite lúc T6 đóng, §1). Không phải
  vite sót.
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (340 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy nhất do reboot
  giữa lượt (đợt 130), 0 sự kiện "KHÔNG NHẢ" trên lock thật
  đợt 120–145 (toàn đợt) và đợt 146 (tới 11:50Z), suite 9/9
  độc lập ×2 lần chạy (T7 xanh cả hai lần), và thứ tự ghi
  mới đã có **84 chu kỳ thật** chứng minh (§3). **Không còn
  caveat nào về mất dòng RELEASED cho các chu kỳ mới** —
  caveat cũ chỉ còn là 1 dòng lịch sử (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **1 chu kỳ lock mới trong
  phiên T6 sạch** (t8-146 O8 hold 484 s — dài hơn O8 đợt
  145 do bộ kiểm lớn hơn, release sạch); T4-146 chưa có
  attempt nào tới lúc T6 đóng — T6 đợt 147 đếm tiếp.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 1 FILE (LẦN ĐẦU TIÊN — trần mềm kích hoạt)

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
  - 11:50Z: lock TRỐNG (status 0 ticket + 101 cooldown —
    kiểm 2 lần: lúc snapshot đóng + kiểm lại ngay trước
    prune) — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng) — điều (a) không kích hoạt.
  - **Điều (b) KÍCH HOẠT LẦN ĐẦU TIÊN: tổng 101 > trần mềm
    100 → xóa file cũ nhất tới khi còn 100 = xóa đúng 1
    file.** File bị xóa: `cooldown-r4-round115`, mtime
    2026-11-14T18:38:25Z, tuổi **113,2h** (≥48h ✓), thuộc
    đợt 115 — không phải đợt hiện tại/ngay trước ✓ (điều
    (c) thỏa).
  - **Kết quả prune đợt 146: 1 file đã xóa.** Danh sách file
    đã xóa: `cooldown-r4-round115`. `prune-deleted.txt` ghi
    dòng `removed .../cooldown-r4-round115`. Đây là kết quả
    đúng của luật — luật đã chạy và điều (b) kích hoạt lần
    đầu sau 20 đợt liên tiếp xóa 0 file (đợt 126–145).
    File cooldown cũ nhất còn lại nay là
    `cooldown-s4-staleprobe`, mtime 2026-11-14T21:07:26Z —
    sẽ đủ 7 ngày theo đồng hồ tường vào khoảng **21/11
    21:07Z**; theo phương pháp `find -mtime +7` (≥192h) sẽ
    khớp ứng viên vào khoảng **22/11 21:07Z**. T6 các đợt
    sau đếm tiếp. Xem F-146-T6-1 (§12): dự báo "file cũ
    nhất đủ 7 ngày ~21/11 18:38Z" của T6-145 không còn đối
    tượng vì chính file đó đã bị xóa theo điều (b) trước
    khi đủ 7 ngày.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (11:37Z) **100 file / 1400 byte**;
  lúc đóng trước prune (11:50Z) **101 file / 1414 byte**
  (101 × 14 = 1414 khớp; `ls`/`find`/`status` khớp nhau);
  **sau prune 100 file / 1400 byte**. Số học khớp: 100 + 1
  = 101 ✓ (1 file cooldown mới: `cooldown-t8-round146`),
  rồi 101 − 1 = 100 ✓ (1 file prune: `cooldown-r4-
  round115`). Không file nào bị xóa hay thêm giữa hai lần
  đếm của đợt này ngoài 2 file trên.
- Phân tầng tuổi lúc ~11:50Z (ngữ nghĩa `find -mtime`,
  TRƯỚC prune): **>7 ngày (`-mtime +7`, tức ≥192h): 0
  file; ≥72h (`-mtime +2`): 39 file** (tăng từ 36 đợt 145
  — 3 file mtime 16/11 08:46Z–11:50Z vừa vượt 72h, đúng quy
  luật tuổi); **≥48h (`-mtime +1`): 70 file** (tăng từ 67
  đợt 145 — 3 file vừa vượt 48h, đúng quy luật tuổi).
  Sau prune: ≥72h **38 file**, ≥48h **69 file** (file bị
  xóa thuộc cả hai tầng). File cũ nhất còn lại
  `cooldown-s4-staleprobe`, mtime 2026-11-14T21:07:26Z —
  lúc 11:50Z mới **~110h43' tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#109? + 98a7c93f; số tuyệt đối VẪN TẠM; chuỗi INSIDE 4 → 5 chờ T2-146 xác nhận chính thức

### 8.0 Reboot #33 — e146ca67 → 98a7c93f (btime 09:54:03Z), giữa lượt 145

- Reboot e146ca67 → 98a7c93f (btime 09:54:03Z) xảy ra giữa
  lượt 145 (trong lúc T10-145 chờ cờ, ~09:54:03Z; vòng chờ
  cờ đầu của T10 bị SIGTERM cùng lúc — F-145-T10-1;
  sampler vòng 1 của T9 bị SIGTERM cùng lúc; sleep chờ kiểm
  lần 3 của T7 chết SIGTERM cùng lúc — xem aggregate đợt
  145 §9.2/§10.2) — **sự kiện #33** theo đánh số của
  aggregate đợt 145 §10.2 (quy tắc đứng: mỗi lần đổi
  boot_id là 1 sự kiện, kể cả reboot trong lúc đóng sổ).
  **Quyết parent (g) đợt 145: XÁC NHẬN là sự kiện #33;
  boot 98a7c93f = #109? theo đếm chặt.**
- **Không luồng nào mất việc do reboot này trong phiên
  T6:** T6 mở 11:37:15Z và đóng 11:50:30Z toàn bộ trên boot
  mới, không bị reboot cắt (uptime liền mạch 1h43'12" →
  1h56'27'). Reboot xảy ra trước khi đợt 146 mở (11:35:51Z).
- **Replay apt sau boot 98a7c93f: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-146 đã viết
  POSTBOOT_PASS cho boot mới lúc 11:37:57Z (poll=2,
  repair=none/replay-full, dpkg 1545/221 — xem §11);
  T2-146 `dpkg107.txt` ghi 1.545 dòng, gói cuối
  gstreamer1.0-tools 1.24.2-1ubuntu0.2 lúc 09:58:17Z (khớp
  quan sát T9-145) — replay xong ~4 phút sau btime.
- **/tmp đã bị reboot xóa sạch:** socket Xvfb của T10-145
  (do chính suite/O8 của T10 tạo, đã dọn tay 11:26Z —
  aggregate đợt 145 §10.4) không còn; `/tmp/.X11-unix/`
  TRỐNG cả lúc T6 mở lẫn lúc đóng (xem §10).

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1 / T6-138 §8.1 / T6-139 §8.1 /
  T6-140 §8.1 / T6-141 §8.1 / T6-142 §8.1 / T6-143 §8.1 /
  T6-144 §8.1 / T6-145 §8.1):
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

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm 98a7c93f theo cách đếm chặt)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 / T6-138 §8.2 /
T6-139 §8.2 / T6-140 §8.2 / T6-141 §8.2 / T6-142 §8.2 /
T6-143 §8.2 / T6-144 §8.2 / T6-145 §8.2 (mỗi boot liệt kê
với boot_id + btime lấy từ ≥1 nguồn độc lập; btime→btime
danh nghĩa = khoảng cách giữa hai btime liên tiếp).
**Số thứ tự dùng CÁCH ĐẾM CHẶT làm chuẩn** theo quyết
parent (c) đợt 143: b47f7932 = #103?, 9afdaa89 = #104?,
70a5b0fc = #105?, 691a7403 = #106?, cc222c8a = #107?,
e146ca67 = #108?, 98a7c93f = #109? (hai số sau theo quyết
parent (e)/(f) đợt 144 + (g) đợt 145). **Định nghĩa đếm
dùng: định nghĩa gộp của T10 (LIMITS gộp đợt 133 §10.2) —
mọi reboot quanh đợt, cả giữa lượt lẫn ranh giới — theo
quyết F-133-6.** Bảng dưới chỉ ghi 8 boot cuối (chuỗi đầy
đủ #57→#101 xem T6-131 §8.2 + T6-132 §8.2 + T6-133 §8.2 +
T6-134 §8.2 + T6-135 §8.2 + T6-136 §8.2 + T6-137 §8.2 +
T6-138 §8.2 + T6-139 §8.2 + T6-140 §8.2 + T6-141 §8.2 +
T6-142 §8.2 + T6-143 §8.2 + T6-144 §8.2 + T6-145 §8.2 —
không chép lại để khỏi drift; T6 đợt này đã đối chiếu lại
với LIMITS gộp đợt 145: các boot #102?→#109? dưới đây khớp
đúng btime/boot_id T10-145 đã chốt, không có boot_id lạ
nào xuất hiện trong bất kỳ bằng chứng 18–19/11 nào ngoài
chuỗi này).

| # (tạm, đếm chặt) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #102 | bde599df | 22:48:05Z 18/11 | 1h05m33s (3.933 s — gap #102?→#103?, CHỨNG NHẬN [3.923, 3.943] s, T2-143 + quyết parent (d) đợt 143); sống tới 23:53:38Z | T6-143 + T2-143 (prereg + probe #62 + merged mù #62) + T10-142 §10.2 + quyết parent (d) đợt 143 (CERT 63 / FULL 78 XÁC NHẬN) |
| #103 | b47f7932 | 23:53:38Z 18/11 | 0h00m42s (42 s — gap #103?→#104?, SPAN — đoạn B mù #62 không chứng nhận được, quyết parent (e) đợt 143 BÁC floor cơ học = 0); sống tới 23:54:20Z | T6-143 + T2-143 (prereg + merged mù #62) + T7-142 + T9-142 + T10-142 §10.2 + quyết parent (c) đợt 143 (đếm chặt: b47f7932 = #103?) |
| #104 | 9afdaa89 | 23:54:20Z 18/11 | 2h01m05s (7.265 s — gap #104?→#105?, SPAN — đoạn C mù #62 MỞ, tối đa 2 ẩn, quyết parent (e) đợt 143 BÁC continuity dòng-log làm closer); sống tới 01:55:25Z | T7-142 + T9-142 + T10-142 §10.2 + T2-142 (btime TRONG dải FULL77 neo #102? [23:15:16Z, 01:12:54Z] — xem §8.8/F-144-T6-1) + quyết parent (c) đợt 143 (đếm chặt: 9afdaa89 = #104?) |
| #105 | 70a5b0fc | 01:55:25Z 19/11 | 2h00m20s (7.220 s — gap #105?→#106?, CHỨNG NHẬN [7.210, 7.230] s, mù #63 đóng hoàn toàn, T2-144 + quyết parent (c) đợt 144); sống tới 03:55:45Z | T6-143 + T2-143 prereg + boot-verify + probe #62 + T7-143 NOTES + T10-142 (suite + O8 chạy trên boot này 01:57–02:04Z) + quyết parent (c) đợt 143 (đếm chặt: 70a5b0fc = #105?) |
| #106 | 691a7403 | 03:55:45Z 19/11 | 1h57m30s (7.050 s — gap #106?→#107?, SPAN — đoạn B mù #64 MỞ, tối đa 2 ẩn, quyết parent (b) đợt 145); sống tới 05:53:15Z | T6-144 (brief + uptime/journal//proc/1/wtmp) + T2-144 prereg + boot-verify (probe #63 ok=2 fail=0) + T7-144 NOTES + T10-143 (suite + O8 chạy trên boot này 03:58–05:27Z) + quyết parent (c) đợt 143 (đếm chặt: 691a7403 = #106?) + quyết parent (d) đợt 145 (khung chết CHỐT (05:53:06Z, 05:53:15Z] 9 s) |
| #107 | cc222c8a | 05:53:15Z 19/11 | 2h03m01s (7.381 s — gap #107?→#108?, SPAN — đoạn B mù #64 MỞ, tối đa 2 ẩn, quyết parent (b) đợt 145); sống tới 07:56:16Z | T7-144 (ba nguồn, kiểm 3 lần) + T9-144 (uptime + btime + boot_id + who-b + journal) + T2-144 boot-verify/LIMITS §2.11 + T10-144 §10.1/§10.2 + quyết parent (e) đợt 144 (reboot #31 XÁC NHẬN) + quyết parent (c) đợt 145 (khung chết CHỐT (07:55:38Z, 07:56:16Z] 38 s) |
| #108 | e146ca67 | 07:56:16Z 19/11 | 1h57m47s (7.067 s — gap #108?→#109?, CHỜ merged mù #65 của T2-146 chứng nhận; khoảng dự kiến [7.057, 7.077] s theo prereg T2-146); sống tới 09:54:03Z | T6-145 (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T2-145 prereg + boot-verify ×2 (probe #64 ok=2 fail=0) + T7-145 NOTES + T10-144 (suite + O8 chạy trên boot này 08:13–08:20Z) + T2-146 (probe #65 ok=2 fail=0, boot 98a7c93f — xác nhận boot sau) + quyết parent (f) đợt 144 (e146ca67 = #108? đếm chặt) + quyết parent (g) đợt 145 (reboot #33 XÁC NHẬN) |
| #109 | 98a7c93f | 09:54:03Z 19/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T2-146 prereg + boot-verify (probe #65 ok=2 fail=0) + T7-146 NOTES + T5-146 POSTBOOT_PASS + T10-145 (suite + O8 chạy trên boot này 11:16–11:26Z) + quyết parent (g) đợt 145 (98a7c93f = #109? đếm chặt) |

- **Ghi chú bảng:** các hàng #102–#107 chép nguyên từ bảng
  T6-145 (đã qua soát xét đợt 145, cập nhật verdict gap +
  khung chết theo quyết parent (b)/(c)/(d) đợt 145: gap
  #106?→#107? / #107?→#108? nay SPAN — mù #64 không đóng
  hoàn toàn; khung #106? nay CHỐT khung thu hẹp 9 s; khung
  #107? CHỐT 38 s); hàng #108–#109 là boot mới theo quyết
  parent (f) đợt 144 + (g) đợt 145. Nhãn gap trong ngoặc ở
  mỗi hàng là gap ứng với tuổi thọ danh nghĩa của boot đó
  (btime → btime boot sau) **theo cách đếm chặt**.
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
  (f) đợt 144 XÁC NHẬN); **#108?→#109? là sự kiện thứ 33**
  (GIỮA LƯỢT 145, trong lúc T10-145 chờ cờ — quyết parent
  (g) đợt 145 XÁC NHẬN).
- **T2-146 + T7-146 đối chiếu khớp (độc lập, trước/sau khi
  T6 đo):** prereg-t2.md ghi boot mới `98a7c93f…`, btime
  09:54:03Z, gọi là #109? đếm chặt; `boot-verify.txt` khớp
  đúng boot_id + btime của T6 (verify 11:39:17Z); probe #65
  (`once.txt`: `probe#65 boot=98a7c93f ok=2 fail=0`,
  11:39:18Z) xác nhận boot đang sống; T7-146 NOTES kiểm lần
  1 (~11:37Z) khớp đúng boot_id + btime + epoch. Ba luồng
  khớp nhau hoàn toàn về boot_id, btime, epoch và số chặt.
  T2-146 cũng ghi rõ mù #65 có 2 đoạn (A 4.351 s / B
  ~6.315 s) và dự báo đóng hoàn toàn nếu A+B đóng (xem
  §8.10).
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#96: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3 +
    T6-138 §8.2–§8.4 + T6-139 §8.2–§8.4 + T6-140 §8.2–§8.4
    + T6-141 §8.2–§8.4 + T6-142 §8.2–§8.4 + T6-143 §8.2–
    §8.5 + T6-144 §8.2–§8.5 + T6-145 §8.2–§8.5 (không chép
    lại).
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
  - #106 (691a7403): khung **CHỐT LÀM CHUẨN (05:53:06Z,
    05:53:15Z] (9 s)** — quyết parent (d) đợt 145 (thu hẹp
    khung T5 60 s đã chốt đợt 144 (g), bằng bằng chứng tốt
    hơn; neo btime giữ nguyên).
  - #107 (cc222c8a): khung **CHỐT LÀM CHUẨN (07:55:38Z,
    07:56:16Z] (38 s)** — quyết parent (c) đợt 145.
  - #108 (e146ca67): ứng viên quét mtime của T6, CHƯA CHỐT
    (xem §8.6).

### 8.3 Khung chết #95? — ứng viên 400 s GIỮ NGUYÊN (không có bằng chứng mới)

- **Khung chết #95? ứng viên: (13:47:01Z, 13:53:41Z]
  (400 s)** — T2/T6/T10 đồng thuận đợt 139; T2-140 prereg
  §0 và T2-141 prereg §0 xác nhận giữ nguyên trừ khi có
  bằng chứng mới.
- T6 đợt này KHÔNG quét lại cửa sổ này (không có bằng chứng
  mới nào có thể xuất hiện: cửa sổ nằm ngày 18/11, đã đóng
  băng từ đợt 139; merged mù #65 không phủ cửa sổ này —
  mù #65 bắt đầu 08:41:32Z 19/11). **Khung 400 s giữ
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
  trong phiên T6 đợt này — merged mù #65 không phủ các
  cửa sổ này (mù #65 bắt đầu 08:41:32Z 19/11). Trạng thái
  ba khung từ nay là **ĐÃ CHỐT CHUẨN**, không còn hoãn quyết.

### 8.5 Khung chết #99?/#100?/#101? — ĐÃ CHỐT CHUẨN theo quyết parent đợt 142 §12.2(g)

- **Khung chết #99? chuẩn: (21:51:52Z, 21:52:21Z] (29 s)**
  — merged T2 TRÙNG KHỚP HOÀN TOÀN khung quan sát T9-141.
- **Khung chết #100? chuẩn: (22:32:05Z, 22:33:03Z] (58 s)**.
- **Khung chết #101? chuẩn: (22:45:49Z, 22:48:05Z] (136 s)**.
- Không có bằng chứng mới nào về ba khung này trong phiên
  T6 đợt này. Trạng thái ba khung từ nay là **ĐÃ CHỐT
  CHUẨN**, không còn hoãn quyết.

### 8.6 Khung chết #108? (e146ca67) — quét mtime của T6: 0 file trong (09:30:00Z, 09:54:03Z], KHÔNG thu hẹp được — chờ merged mù #65 của T2-146

- **Quét mtime của T6 (`scan-mtime-146.py`, hidden_files +
  docs, cửa sổ W (09:30:00Z, 09:54:03Z]): 0 file** — đối
  chiếu độc lập bằng `find` cùng cửa sổ: **0 file** ✓.
  Mốc mtime cuối cùng ≤ btime trong toàn cây hidden_files
  là **09:25:51Z** (`round145-t5.done`) — SỚM HƠN cả đầu
  khoảng im lặng của T7 (09:45:34Z). Quét mtime của T6
  KHÔNG thu hẹp được khung chết #108? (xem F-146-T6-2).
- Giải thích vì sao 0 file: các file còn được ghi trong cửa
  sổ đều có lần ghi cuối SAU btime (sampler T9 vòng 1:
  `ram-sampler-long.log` + `.out`, mtime 09:54:09.49Z —
  chính là mẫu nghịch lý đồng hồ) hoặc đã ghi lần cuối
  trước 09:30Z (T8 smoke logs ~09:01–09:19Z, T5
  `ram-sampler.log` 09:22:50Z, `t5.done` 09:25:51Z);
  mtime chỉ ghi lần ghi CUỐI nên các lần ghi 09:52/09:53Z
  của sampler không để lại dấu mtime.
- **Quan sát nội dung (không phải mtime) vẫn là bằng chứng
  cuối trước btime:** sampler T9 vòng 1 ghi mẫu
  09:52:09Z, 09:53:09Z (đồng hồ cũ) rồi mẫu 09:54:09Z —
  mẫu cuối này MUỘN HƠN btime boot mới 09:54:03Z 6 s
  (nghịch lý đồng hồ đã biết từ T9-145). Khung chết theo
  btime (nguồn kernel) vẫn là neo chuẩn; merged mù #65 của
  T2-146 (đoạn A: 08:41:32Z → 09:54:03Z) là chứng nhận
  chính thức. **T6 không tự chốt khung #108?** — ứng viên
  chặt nhất hiện có vẫn là khoảng im lặng của T7
  (09:45:34Z, 09:54:43Z] (549 s), quá rộng làm khung.
  Gap danh nghĩa #108?→#109? = **7.067 s (1h57'47")** —
  nằm trong dải chứng nhận [0h00'55", 3h14'08"]. Chứng nhận
  **[7.057, 7.077] s NẾU đoạn A + B mù #65 đều đóng**
  (T2-146 prereg — T6 đối chiếu số học độc lập: 09:54:03Z −
  07:56:16Z = 7.067 s ✓).

### 8.7 Khung chết #106? (691a7403) — ĐÃ CHỐT khung thu hẹp (05:53:06Z, 05:53:15Z] (9 s), quyết parent (d) đợt 145

- Khung thu hẹp (05:53:06Z, 05:53:15Z] (9 s) nay là
  **CHUẨN** theo quyết parent (d) đợt 145 — THAY khung T5
  (05:52:15Z, 05:53:15Z] (60 s) đã chốt ở quyết 144 (g).
  Neo tại btime (nguồn kernel, đáng tin nhất). Merged mù
  #65 của T2-146 không phủ cửa sổ này (mù #65 bắt đầu
  08:41:32Z 19/11) nên khung 9 s giữ nguyên.

### 8.8 Chuỗi INSIDE: 4 làm chuẩn → 5 chờ T2-146 xác nhận chính thức (T6 kiểm độc lập bằng code)

Quyết parent (e) đợt 145: **chuỗi INSIDE 4 (đếm chặt) LÀM
CHUẨN từ đợt 145** (cc222c8a INSIDE → 3, e146ca67 INSIDE
dải FULL79 #108? [06:20:44Z, 08:17:45Z] → 4 — T2-145 xác
nhận chính thức, T6 kiểm độc lập bằng code). T6 đợt này
kiểm độc lập boot mới bằng code (python3, tính từ btime +
p10/p90 FULL79 đã công bố: p10 = 1.649 s, p90 = 8.670 s —
từ T2-144 §2.5; CERT 64 / FULL 79 giữ nguyên theo quyết
parent (b) đợt 145):

- **98a7c93f INSIDE dải #109? (FULL79, neo e146ca67
  07:56:16Z): [08:23:45Z, 10:20:46Z]** — btime 09:54:03Z
  **INSIDE** ✓ (khớp đúng dải T2-145 đã công bố + dự báo
  prereg T2-146). Chuỗi: 4 → **5**.
- **T6 báo chuỗi = 5 (4 chuẩn + 98a7c93f), với lưu ý: xác
  nhận CHÍNH THỨC thuộc về T2-146** (merged mù #65 +
  probe #65 — probe #65 đã xong ok=2 fail=0, merged
  verdict/LIMITS/.done chưa có lúc T6 đóng 11:51Z). T6 chỉ
  kiểm độc lập bằng code và ghi rõ bước này — không tự thay
  quyết parent (e) (số chuẩn vẫn là 4 cho tới khi T2-146
  xác nhận).
- **Full boot_id b47f7932: KHÔNG có dữ kiện mới.**
  T7: `b47f7932-ebca-447e-a015-0a6c160efd98`; T9:
  `b47f7932-ebca-4205-86a0-b71a0ab9790c` (F-143-T6-1) —
  quyết parent (g) đợt 143: **ĐỂ MỞ**, ghi cả hai bản kèm
  nguồn, không chọn một. T6 đợt này không tìm thêm bằng
  chứng (không còn boot đó để đo lại) — ghi nhận đúng
  quyết, không tự quyết bên nào đúng.

### 8.9 Dải #110? TẠM (T6 tính độc lập — chờ T2-146 merged FULL80/81)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 / T6-138 §8.6 /
T6-139 §8.6 / T6-140 §8.6 / T6-141 §8.8 / T6-142 §8.9 /
T6-143 §8.10 / T6-144 §8.9 / T6-145 §8.9 — p10–p90 của phân
phối FULL79 (p10 = 1.649 s, p90 = 8.670 s), cộng vào btime
98a7c93f 09:54:03Z. **T6 dùng FULL79** (CERT 64 / FULL 79
đã xác nhận theo quyết parent (b) đợt 145 — phân phối hiện
hành cho tới khi T2-146 chứng nhận thêm gap).

- **Dải dự báo T6 cho #110? (FULL79, TẠM): [10:21:32Z,
  12:18:33Z]** (09:54:03Z + 1.649 s = 10:21:32Z;
  09:54:03Z + 8.670 s = 12:18:33Z 19/11). Tính bằng code
  (python3), không nhẩm — **khớp đúng số làm tròn trong
  prereg T2-146** (§8.2).
- **Cảnh báo:** nếu T2-146 chứng nhận gap #108?→#109?
  (7.067 s → CERT 65 / FULL 80), p10/p90 sẽ dịch nhẹ và
  dải #110? chuẩn sẽ khác dải tạm này vài giây — T2-146
  công bố dải chuẩn trong LIMITS của mình; dải tạm của T6
  chỉ để đối chiếu, không dùng làm verdict.

### 8.10 Gap chờ chứng nhận (cách đếm chặt — T2-146 prereg, T6 đối chiếu số học độc lập)

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
  parent (c) đợt 144 — CERT 64 / FULL 79).
- #106?→#107? = 7.050 s → **SPAN** (đoạn B mù #64 MỞ,
  tối đa 2 ẩn; quyết parent (b) đợt 145 — ĐỂ SPAN, không
  mở đường chứng nhận mới, quyết (f) đợt 145).
- #107?→#108? = 7.381 s → **SPAN** (đoạn B mù #64 MỞ;
  quyết parent (b)/(f) đợt 145).
- #108?→#109? = 7.067 s → khoảng **[7.057, 7.077] s NẾU
  đoạn A + B mù #65 đều đóng** (T2-146 prereg — T6 đối
  chiếu số học độc lập: 09:54:03Z − 07:56:16Z = 7.067 s ✓).
  Nếu chứng nhận: CERT 64→65 / FULL 79→80.
- **Mù #65 (mới mở, T2-146 đang điều tra):** 08:41:32Z →
  probe #65 11:39:18Z = 10.666 s (2h57'46"). Hai đoạn: A
  4.351 s (boot e146ca67, #108? — dài hơn sàn 1.147 s, cần
  merged chứng nhận; floor window [09:00:39Z, 09:34:56Z]
  rộng 2.057 s theo log điều tra T2-146); B 6.315 s (boot
  98a7c93f, #109? — đóng theo luật gap + uptime trực tiếp
  theo log điều tra T2-146). Nếu A+B đóng: mù #65 ĐÓNG HOÀN
  TOÀN → chuỗi mù đóng hoàn toàn lên 1 (sau khi về 0 ở
  #64). **T2-146 chưa công bố verdict lúc T6 đóng 11:51Z**
  (chưa có merged verdict/LIMITS/.done) — T6 chỉ ghi dữ
  kiện interim từ prereg + investigate log, KHÔNG tự chứng
  nhận gap nào, KHÔNG tự kết luận mù #65 đóng hay mở.
  Probe #65: ok=2 fail=0, boot 98a7c93f, 11:39:18Z; log
  `eperm-probe-v2.log` 184 → **187 dòng (+3 đúng prereg)**.

### 8.11 VERDICT: chuỗi tương đối CHỐT #57→#109? + 98a7c93f; số tuyệt đối VẪN TẠM (giữ "?"); chuỗi INSIDE chờ T2-146 xác nhận chính thức

- **CHỐT ĐƯỢC — chuỗi tương đối:** 49 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới 98a7c93f (09:54:03Z 19/11)
  xếp đúng thứ tự thời gian (tính cả b47f7932 là boot quan
  sát được, đánh số #103? chặt, và 98a7c93f = #109?),
  mỗi boot có boot_id + btime riêng biệt (trừ mâu thuẫn
  full id của b47f7932, §8.8), không có boot_id lạ nào
  trong bất kỳ bằng chứng nào ở khoảng giữa; các bước
  chuyển #74→#75→…→#108→#109 đều có ≥2 nguồn độc lập xác
  nhận (T5 + T2 + T6 + T7 + T9 + T10 + file mtime +
  T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Các lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-146 kiểm tiếp nếu có bằng chứng mới).
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
    ở 1) + mù #64 KHÔNG ĐÓNG HOÀN TOÀN (quyết parent (b)
    đợt 145 — chuỗi về 0) + mù #65 MỚI MỞ (T2-146 đang
    điều tra; probe #65 xong ok=2 fail=0, merged verdict
    chưa có lúc T6 đóng);** số #102?→#109? là TẠM theo
    quyết parent (c) đợt 143 (đếm chặt) — gap
    #103?→#104? / #104?→#105? / #106?→#107? / #107?→
    #108? vẫn là SPAN; gap #108?→#109? chờ merged mù #65;
    chuỗi INSIDE chờ T2-146 xác nhận chính thức (§8.8).
    T6-146 chốt chuỗi TƯƠNG ĐỐI (98a7c93f là boot quan sát
    được tiếp theo sau e146ca67, không có boot quan sát
    được nào ở giữa) — số thứ tự tuyệt đối #102?→#109?
    chờ verdict của T2-146. **Ghi rõ "chờ T2" theo brief;
    T10 gộp.**
- **Kết luận cho parent:** T6-146 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 1 boot (#109? 98a7c93f — reboot #33
  giữa lượt 145); số thứ tự tuyệt đối **vẫn TẠM** và phải
  giữ "?" cho tới khi có bằng chứng ngoài VM (và, riêng
  #108?→#109?, tới khi mù #65 đóng + chuỗi INSIDE được
  T2-146 xác nhận). Không bịa số, không bỏ "?" khi chưa đủ
  bằng chứng — đúng như brief giao.
- Hệ quả thực hành: T9-146 gọi boot lúc mở là "#109?"
  trong LIMITS của mình là đúng quy ước chặt; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #33 cho reboot giữa lượt 145 — theo aggregate
  đợt 145 §10.2 + quyết parent (g) đợt 145). Các quyết
  parent trước vẫn đứng: không quyết con số tuyệt đối nào
  ở đây.

### 8.12 Reboot #33 — không mất việc của luồng T6; T6 không bị cắt

- Reboot #33 (e146ca67 → 98a7c93f, btime 09:54:03Z) xảy ra
  giữa lượt 145, trước khi đợt 146 mở (11:35:51Z) —
  **không giết attempt hay holder lock nào của đợt 146**
  (đợt 146 mở sau đó, trên boot mới; T8-146 acquire đầu
  11:39:07Z trên boot mới).

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **11:37:15Z** (boot 98a7c93f đã
  1h43'12" tuổi); đóng **11:50:22Z** (boot 98a7c93f đã
  ~1h56'19" tuổi). Đợt 146 mở **11:35:51Z**
  (sched 11:35:51Z) — tức **6.108 s sau btime boot
  98a7c93f (09:54:03Z)**.
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
  + 41 s); run 143 KHÔNG viết lại lần 2 vì đã finished)
  và đợt 145 (lần thứ 19 — T7-145: run 145 viết lại lần 1
  (btime 98a7c93f + 40 s); run 144 KHÔNG bị viết lại lần
  3 tại reboot #33 vì đã finished; run 144 KẾT THÚC
  TIMEOUT; run 145 chạy muộn +187 s — quyết parent (m)
  đợt 145: CHỈ GHI NHẬN LÀ DỮ KIỆN, không điều tra; tái
  diễn thì mở điều tra).
- **Quan sát mới T7-146 (NOTES mở ~11:37Z, T6 chỉ ghi
  mốc, không kết luận — T7 là chủ quản):** boot lúc mở
  98a7c93f khớp brief đợt 146 + boot-verify T2-146; KHÔNG
  có reboot mới từ kiểm cuối T7-145 (~11:03:00Z) tới lúc
  mở. Đợt 146 mở 6.108 s sau btime — tức run mở SAU boot
  nên không kỳ vọng viết lại tại boot này (cùng mẫu run
  145 tại boot e146ca67: mở sau boot, không viết lại cho
  tới khi reboot #33 xảy ra). T7-146 kiểm lần 1 ~11:37Z,
  lần 2/3 + kiểm cuối chưa tới lúc T6 đóng — T6 không đọc
  `scheduler.job_runs`, không kết luận thay T7.
- **F107? (chủ quản T2-146 — T6 chỉ ghi số thô, không kết
  luận):** `f107.txt` của T2-146 (11:39:23Z): HTTP `Date`
  example.com +0 s, google.com +0 s theo quy ước `Date −
  local_after` của T2; cloudflare.com **ERROR HTTP 403:
  Forbidden** (không có số đọc). F106? là +1/+1/+1 (quy ước
  Date − local_after). T6 không đo F, không kết luận — chờ
  verdict T2-146.

## 10. Dọn Xvfb: 0 Xvfb chạy; 0 socket sót lúc mở và lúc đóng

- **Lúc mở (11:37Z): 0 Xvfb đang chạy** (`pgrep -x Xvfb`
  rc=1; quét `ps-full-open.txt` không có process nào tên
  Xvfb). **`/tmp/.X11-unix/` TRỐNG** (x11-open.txt).
- **Lúc đóng (11:50Z): 0 Xvfb đang chạy** (pgrep rc=1),
  quét `ps-full-close.txt` không có process nào tên Xvfb.
  **`/tmp/.X11-unix/` TRỐNG** (x11-close.txt) — vite O8
  WebKit/Chromium của T8-146 (MiniBrowser, bắt đầu
  11:39:07Z) đã thoát cùng release 11:47:11Z và không để
  lại socket.
- **Socket X193/X194/X195 của T10-145 ĐÃ BIẾN MẤT** — T10
  đã dọn tay 11:26Z (sau khi suite/O8 xong) + reboot #33
  xóa /tmp; không còn socket nào từ đợt 145.
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-146; T2-146
  prereg không ghi MemAvailable lúc verify đợt này; T9-146
  đo chính thức; headroom thuộc T9).

## 11. Tuân thủ lock của luồng đo đợt 145 ĐÃ kiểm được + đợt 146 tới nay

- **T4-round145 acquire + release sạch ×1 sau T6-145 đóng**
  (attempt1 lượt yên #20, TICKET 08:53:03Z; RELEASED hold
  216 s — T6 đợt này đếm TICKET/ACQUIRED/RELEASED, khớp
  tổng §4). Lượt yên #20: HỢP LỆ ngay attempt1 (median
  58,0 ms) — **quyết parent (o) đợt 145: CHẤP NHẬN cộng dồn
  theo quy ước các đợt trước — số đếm 17 lượt đứng**
  (P1 51/51, P2 42/42, P3-A1 46/51, P3' 23/23, P7 37/37);
  đợt 146 đo #21.
- **T8-round145 acquire + release sạch ×6 sau T6-145 đóng**
  (harness 6/6, TICKET 09:01:30Z → 09:13:38Z; RELEASED
  holds 70 / 140 / 241 / 70 / 131 / 230 s — harness 6/6
  QUA GATE đúng chuẩn lần đầu sau 2 đợt (sau #20 hợp lệ);
  xem §4). T8 dùng script repo (`run-webkit-145t8.sh`
  dòng 33) — tức chạy trên **thứ tự ghi mới** (§3). Đây là
  các lần chạy kiểm chứng vá watchdog — 0 kẹt thật đợt 145
  nên vá chưa được thử bằng kẹt thật (quyết parent (j) đợt
  145: giữ nguyên bản vá, chờ kẹt thật sau — đợt thứ tư
  liên tiếp).
- **T10-round145 acquire + release sạch ×1** (11:23:58Z →
  11:26:20Z; hold 142 s; port 5554; wait_s=0; ticket khớp
  log — suite 27/27 + O8 Chromium 21/21 + O8 WebKit 21/21
  trên boot 98a7c93f). T10 dùng bản frozen
  `round145-t10/vcut-vite-lock-v2.t10.sh`, md5 `520b8baa`
  (aggregate đợt 145 §10.3) — tức chạy trên **thứ tự ghi
  mới** (§3).
- **Tổng kết đợt 145: 9 chu kỳ sạch** (1 trong phiên
  T6-145 + 8 sau khi T6-145 đóng — xem §3/§4);
  **tổng 84 chu kỳ liên tiếp sạch trên thứ tự ghi mới**
  (75 đợt 145 + 9 đợt này).
- **T8-146 acquire + release sạch ×1 tới 11:50Z**
  (11:39:07Z → 11:47:11Z; hold 484 s; port 5560; wait_s=0;
  ticket khớp log — O8 đang chạy, verdict thuộc T8-146;
  log T8: `O8 DONE 11:47:11Z webkit1=0 webkit2=0
  chromium=0`, vite sau release curl 5560/5554 = 000000).
  T8 dùng script repo (`run-webkit-146t8.sh` dòng 33,
  `LOCK=.../vcut-vite-lock-v2.sh`) — tức chạy trên **thứ
  tự ghi mới** (§3). Vite port 5560 của attempt WebKit
  (pid 24720) + vite port 5554 của attempt Chromium (pid
  27193) đều nằm trong lúc T8 giữ lock — hợp lệ; đã thoát
  cùng release (không còn process vite nào lúc T6 đóng, §1).
- **T4-146 chưa có attempt nào tới lúc T6 đóng** (poller
  #12 lúc 11:50:07Z, lock trống, load1 4,19/5,40, đang chờ
  cửa yên; `run-attempt-146.sh` dòng 23 dùng script repo —
  tức chạy trên **thứ tự ghi mới** khi chạy; vá B4 + sampler
  + attempt-tagging theo quyết parent (b) đợt 144 đã chạy
  thật đợt 145). T6 đợt 147 đếm tiếp. Lưu ý: poll #7
  (11:46:19Z) ghi blockers=1 (comm-based) — thuộc
  F-145-T4-2 (giao T4-146), không phải việc T6.
- **T5-146 đã viết POSTBOOT_PASS cho boot mới**
  (`round146-t5/POSTBOOT_PASS`, 11:37:57Z:
  boot_id=98a7c93f…, btime=09:54:03Z, pass_at=11:37:57Z,
  poll=2, repair=none/replay-full, dpkg=1545/221) — cờ
  postboot cho boot mới đã có TRƯỚC khi T4-146 chạy
  attempt đầu (T4 còn đang chờ cửa lúc T6 đóng); gate0
  đợt này mở nhờ cờ T5 (quyết (j) đợt 143 đã kiểm chứng
  thực tế lần đầu đợt 144 — hoạt động đúng).
- **T10-146 chưa chạy suite/O8 tới lúc T6 đóng** (chưa mở
  thư mục — đang chờ cờ; chưa chuẩn bị bản frozen lock
  script — T6 đợt sau kiểm md5 khi T10 chuẩn bị).
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Đường dẫn đúng `apps/web/src/preview.tsx`.
- **O8 WebKit FAIL đợt 142 KHÔNG tái hiện (lần thứ tư
  độc lập):** T8-143 PASS 21/21 ×2 + T10-143 PASS 21/21
  trên boot 691a7403 (aggregate đợt 143); T8-144 PASS
  21/21 ×2 + T10-144 PASS 21/21 trên boot e146ca67
  (aggregate đợt 144); T8-145 PASS 21/21 ×2 + T10-145
  PASS 21/21 (aggregate đợt 145 — T8 trên e146ca67, T10
  trên 98a7c93f) — chuỗi WebKit FULL PASS 2 → 3; kết luận
  trạng thái boot mới đã được quyết parent (b) đợt 142 +
  (i) đợt 143 chấp nhận. T6 không điều tra O8; verdict O8
  đợt 146 thuộc T8-146/T10-146.

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-146-T6-1, F-146-T6-2 (mới,
  xem dưới).** Không có sai số đếm nào của T6 đợt này: số
  mở của T6 khớp đúng số T10-145 đếm lúc đóng (1180 thô /
  1174 chính thức, từng loại khớp đúng — KỂ CẢ số queue
  file 100, T10-145 đã đếm bằng `ls | wc -l` theo bài học
  F-145-T6-1).
- **F-146-T6-1 — Prune lần 21 xóa file đầu tiên, dự báo
  "file cũ nhất đủ 7 ngày ~21/11 18:38Z" của T6-145
  không còn đối tượng (mới — ghi nhận, không phải lỗi
  đếm):** điều (b) trần mềm kích hoạt lần đầu (tổng 101 >
  100) nên `cooldown-r4-round115` (113,2h tuổi) bị xóa
  TRƯỚC khi đủ 7 ngày. Dự báo của T6-145 về file này
  (đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z, theo
  `find` ~22/11 18:38Z) nay không còn đối tượng để kiểm
  chứng — file cũ nhất còn lại là `cooldown-s4-
  staleprobe` (mtime 2026-11-14T21:07:26Z): đủ 7 ngày
  theo đồng hồ tường ~21/11 21:07Z, theo `find -mtime +7`
  ~22/11 21:07Z. T6 các đợt sau đếm tiếp theo file mới
  này, không nhắc lại mốc 18:38Z. Việc xóa là đúng luật
  (điều (b), parent phê duyệt đợt 125 §12(c)) — không
  phải lỗi áp dụng luật.
- **F-146-T6-2 — Quét mtime khung chết #108? cho 0 file,
  không thu hẹp được khung (mới — giới hạn phương pháp,
  không phải lỗi đếm):** quét mtime (`scan-mtime-146.py`,
  hidden_files + docs, cửa sổ (09:30:00Z, 09:54:03Z])
  cho 0 file; đối chiếu độc lập bằng `find` cùng cửa sổ
  cũng 0 file. Mốc mtime cuối ≤ btime là 09:25:51Z
  (`round145-t5.done`) — SỚM HƠN cả đầu khoảng im lặng
  của T7 (09:45:34Z), nên quét mtime của T6 không đóng
  góp gì cho khung #108? (khung ứng viên theo mtime sẽ
  là (09:25:51Z, 09:54:03Z] = 28m12s — RỘNG HƠN khoảng im
  lặng 549 s của T7). Nguyên nhân: mtime chỉ ghi lần ghi
  cuối; các file còn ghi trong cửa sổ đều có lần ghi cuối
  sau btime (sampler T9 09:54:09Z — nghịch lý đồng hồ 6 s
  đã biết) hoặc trước 09:30Z. Khung #108? vẫn chờ merged
  mù #65 của T2-146 (đoạn A dùng mốc nội dung sampler,
  không phải mtime). T6 không tự chốt khung.
- **F-145-T6-1 (cũ, đã được T10-145 xác minh + parent quyết
  ở đợt 145):** T10-144 ghi nhầm queue 116 file (thực tế
  98; 116 là số event COOLDOWN trong log). T10-145 đã đối
  chiếu lại bằng `ls | wc -l` (100 file lúc đóng đợt 145)
  và ghi rõ cả hai số riêng (121 event COOLDOWN trong log
  vs 100 file). T6-146 xác nhận: số mở đợt này (100 file)
  khớp đúng số T10-145 — phương pháp đếm queue đã được
  sửa, không lặp lại.
- **F-145-T6-2 (cũ, đã khắc phục):** bản nháp ghi sai số
  chu kỳ mới 11/64, đúng là 12/75 — đã sửa trước khi stage
  đợt 145. T6 đợt này đếm chu kỳ bằng TICKET sau snapshot
  (9 chu kỳ mới, §3) — không lặp lại.
- **F-144-T6-1 (cũ, đã được parent quyết ở đợt 144 + (e)
  đợt 145):** chuỗi INSIDE 4 hay 2 — quyết parent (h) đợt
  144: **2 (đếm chặt) LÀM CHUẨN**; cc222c8a INSIDE hậu
  nghiệm → 3, e146ca67 INSIDE → 4 (T2-145 xác nhận chính
  thức, quyết parent (e) đợt 145). T6 đợt này kiểm độc lập
  98a7c93f INSIDE dải #109? → chuỗi 5 chờ T2-146 xác nhận
  chính thức (§8.8) — không tự thay số chuẩn (vẫn là 4).
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
  (raw-open `8da535c9…`, cleaned-open `b5f0c5af…`,
  raw-close `b5e4fe93…`, cleaned-close `64e794d7…`) — không
  lặp lại.
- **F-143-T6-1 (cũ, đã được parent quyết ở đợt 143):**
  xung đột đánh số (c)/(d) + mâu thuẫn full boot_id
  b47f7932 — quyết parent (c) đợt 143: **CHỌN CÁCH ĐẾM
  CHẶT làm chuẩn từ đợt 144** (b47f7932 = #103?,
  9afdaa89 = #104?, 70a5b0fc = #105?, 691a7403 = #106?,
  cc222c8a = #107?, e146ca67 = #108?, 98a7c93f = #109? —
  hai số sau theo quyết parent (e)/(f) đợt 144 + (g) đợt
  145); quyết parent (g) đợt 143: **full boot_id b47f7932
  ĐỂ MỞ** (ghi cả hai bản T7/T9 kèm nguồn, không chọn
  một). T6 đợt này áp dụng đếm chặt trong toàn bộ tài liệu
  và ghi nhận full boot_id vẫn để mở (§8.8) — không lặp
  lại phần chưa quyết.
- **F-142-T6-1 (cũ, đã giải quyết ở đợt 142):** mâu thuẫn
  nhãn reboot #25/#26 — aggregate đợt 142 §12.2(c) đã chốt
  #26 theo cách đếm của T10 (mỗi lần đổi boot_id là 1 sự
  kiện, kể cả reboot trong lúc đóng sổ). Không lặp lại ở
  đợt này: T6-146 ghi đúng sự kiện #33 theo chốt đó.
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
  Không lặp lại ở đợt này: T6-146 ghi đúng boot sống
  98a7c93f (khớp T2-146 boot-verify + probe #65 +
  T7-146 NOTES kiểm lần 1).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn; tổng 17 không đổi. T6-146 đã đếm lại đúng (§5:
  trích dẫn = 0 — các file `.done` của T6 viết không dấu
  nên không khớp pattern có dấu; đã giải thích phương pháp
  ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **Số hiệu boot mới (#102?→#109?) VẪN TẠM (xem §8.11):**
  chuỗi tương đối #57→#109? + 98a7c93f đã chốt (49 boot,
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
  KHÔNG ĐÓNG HOÀN TOÀN (quyết parent (b) đợt 145) + mù
  #65 MỚI MỞ — số #102?→#109? + gap #108?→#109? chờ
  verdict T2-146; chuỗi INSIDE chờ T2-146 xác nhận chính
  thức; mù #56 A vẫn MỞ (quyết parent (e)) — số #93? cũng
  vẫn quy ước headline**. Journal/wtmp chỉ giữ boot hiện
  tại (journal `--list-boots` chỉ 1 dòng 98a7c93f; wtmp bắt
  đầu 09:54:19Z) nên T6 suy ra số hiệu từ thứ tự thời gian
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
  BÁC cả hai đề xuất closer/floor của T2) + **mù #63 ĐÃ
  ĐÓNG HOÀN TOÀN** (T2-144 — gap #105?→#106? chứng nhận
  [7.210, 7.230] s, CERT 64 / FULL 79, quyết parent (c)
  đợt 144; chuỗi mù đóng hoàn toàn bắt đầu lại ở 1) +
  **mù #64 KHÔNG ĐÓNG HOÀN TOÀN** (T2-145 — đoạn B mở,
  tối đa 2 ẩn; quyết parent (b) đợt 145: chuỗi mù đóng
  hoàn toàn đứt, về 0; gap 7.050 s + 7.381 s ĐỂ SPAN,
  quyết (f) đợt 145) + **mù #65 MỚI MỞ** (T2-146 đang
  điều tra; probe #65 xong ok=2 fail=0, merged verdict
  chưa có lúc T6 đóng); mù #52 đã đóng hoàn toàn (T2-133);
  mù #54 đã đóng hoàn toàn (T2-135).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ hai
  mươi hai liên tiếp không xóa tính flaky. Quyết tách T7
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round144-t*/` (toàn đợt) +
  `round145-t*/` (toàn đợt) + `round146-t*/` tới 11:50Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T10-146 chưa chạy xong tới thời điểm đếm; T6
  đợt 147 đếm tiếp.
- **Prune cooldown lần 21 áp dụng: xóa 1 file**
  (`cooldown-r4-round115` — điều (b) trần mềm kích hoạt
  lần đầu; 0 file đủ 7 ngày theo điều (a)). Tổng sau prune
  100 file. File cũ nhất còn lại đủ 7 ngày theo đồng hồ
  tường ~21/11 21:07Z, theo `find` ~22/11 21:07Z — T6 các
  đợt sau đếm tiếp.
- **Đợt 145 khép sạch trên lock (§4):** 9 chu kỳ (1 trong
  phiên T6-145 + 8 sau đó: t4 ×1 attempt1 #20 + t8-145 ×6
  harness + t10-145 ×1) sạch — T6 đợt này đếm bổ sung
  bằng TICKET từng chu kỳ, khớp đúng recount T10-145;
  **đợt 146 tới 11:50Z có 1 chu kỳ sạch** (t8-146 O8);
  T4-146 chưa có attempt nào — T6 đợt 147 đếm tiếp. Không
  phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 11:50Z (trống, 0 ticket + 101 cooldown trước
  prune, 100 sau prune); đợt còn chạy tới ~14:15Z, **T10
  đóng đợt sẽ recount lại lúc đóng** (như đợt 124–145 T10
  đã đếm lúc đóng). T6 không chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 84 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt boot 98a7c93f đã có cờ POSTBOOT_PASS**
  (T5-146, 11:37:57Z — xem §11); verdict replay thuộc T5.
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned").
- **T2-146 CHƯA XONG lúc T6 đóng (11:51Z):** probe #65 xong
  (ok=2 fail=0) và prereg + boot-verify + f107 + investigate
  đã viết (dự báo mù #65 đóng hoàn toàn nếu A+B đóng +
  gap #108?→#109? [7.057, 7.077] s + chuỗi INSIDE lên 5)
  nhưng merged verdict/LIMITS + .done chưa có. Theo brief,
  T6 ghi rõ "chờ T2" và để T10 gộp — KHÔNG tự suy đoán số
  boot #102?→#109?, không tự chứng nhận gap #108?→#109?,
  không tự chốt khung chết #108? cuối cùng. T6 chỉ ghi thêm
  quan sát quét mtime của mình (§8.6: 0 file trong
  (09:30:00Z, 09:54:03Z], không thu hẹp được khung) + kiểm
  INSIDE độc lập bằng code (§8.8: 98a7c93f INSIDE → chuỗi 5)
  để T2-146 cân nhắc.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND146_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), Xvfb (0 process;
`/tmp/.X11-unix/` TRỐNG cả mở lẫn đóng — T6 không xóa gì).
File cooldown: prune đã chạy, **xóa 1 file
`cooldown-r4-round115`** (điều (b) trần mềm — xem §7);
`cooldown-t8-round146` do release hợp lệ của t8-146
(xem §3).
Stage: `repo-1-push/paths-loop/phase9-round146-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round146-t6/` (status-open.txt,
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
repro-newmsg-fixed146.sh, repro-newmsg.log,
scan-mtime-146.py, scan-mtime-146.txt, md5-open.txt).
