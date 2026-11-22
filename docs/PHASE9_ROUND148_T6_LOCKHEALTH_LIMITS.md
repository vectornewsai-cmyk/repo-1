# PHASE9 ROUND148 T6 — lock KHỎE + prune lần 23 XÓA 2 FILE (trần mềm lần 3 liên tiếp) + reboot #35: d8a11644 OUTSIDE → chuỗi INSIDE 6 ĐỨT về 0 (F-148-T6-1, F-148-T6-2, F-148-T6-3, F-148-T6-4) — LIMITS

- Đợt: 148, luồng T6 (sức khỏe lock vite v2 + chuỗi boot).
  Lượt cron 00:35 +07 20/11/2026 (= 17:35:51Z 19/11). Chạy
  17:40:19Z → 17:49:42Z 19/11/2026, toàn bộ trên một boot duy
  nhất d8a11644 — KHÔNG có reboot trong phiên T6.
- Nhiệm vụ: kiểm lock lúc mở/đóng (ticket + cooldown), đếm
  dòng/cặp ACQUIRED, chạy prune lần 23, suite kiểm lock 9/9
  ×2 (+ lần 3 vì T7 flaky), chốt chuỗi boot với boot d8a11644
  (btime 17:27:53Z theo /proc/stat — xem F-148-T6-2: T2-148
  prereg dùng 17:28:08Z theo /proc/1, lệch +15 s), kiểm
  chuỗi INSIDE theo quyết parent (e) đợt 146/147 (6 làm
  chuẩn; d8a11644 OUTSIDE dải #111? → 0, chờ T2-148 xác
  nhận chính thức) + kiểm khung chết #110? (6fb582df) bằng
  quét mtime, kiểm mâu thuẫn full boot_id b47f7932 (T7 vs T9,
  F-143-T6-1) nếu còn dữ kiện mới — không quyết bên nào đúng
  nếu không đủ bằng chứng, chỉ ghi nhận (quyết parent (g)
  đợt 143: ĐỂ MỞ), kiểm Xvfb sót, ghi mọi sai số F-148-T6-n.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production, không sửa script
  lock (không có đổi nào đợt này — bản `520b8baa` từ đợt 135 giữ
  nguyên). Không sửa preview.tsx (530e10a7 giữ vĩnh viễn — chỉ
  đọc md5 để kiểm, §11).
- Thư mục làm việc: `hidden_files/round148-t6/` (status-open.txt,
  status-close.txt, ps-full-open.txt, ps-full-close.txt,
  ss-open.txt, ss-close.txt, x11-open.txt, x11-close.txt,
  boot-verify-open.txt, boot-verify-close.txt, time-open.txt,
  time-close.txt, wc-open.txt, wc-close.txt,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-raw-open.log, vite-lock-v2-raw-close.log,
  analyze-log.py, cooldown-now-open.txt,
  cooldown-now-open-list.txt, cooldown-now.txt,
  prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log, test-v2-t6-run2.log,
  test-v2-t6-run3.log, repro-newmsg-fixed148.sh,
  repro-newmsg.log, scan-mtime-148.py, scan-mtime-148.txt,
  md5-open.txt, md5-close.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI d8a11644 (reboot #35 trong lúc T10-147 đóng sổ; xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `d8a11644-1f76-4e48-94f6-97b2cf34fff8`, btime 17:27:53Z
  theo /proc/stat** (btime epoch 1795109273; `uptime -s` =
  17:27:53; `who -b` = Nov 19 17:28; `/proc/1` 17:28:08Z —
  chênh +15 s, cùng mẫu các boot trước (e146ca67: +15 s;
  cc222c8a: +15 s; 98a7c93f: +16 s; 6fb582df: +10 s);
  `journal --list-boots` chỉ 1 dòng d8a11644, first entry
  17:28:09Z (boot +16 s theo btime /proc/stat).
  Uptime ~12'26" lúc T6 bắt đầu (17:40:19Z), ~21'35"
  lúc đóng (17:49:28Z). Đây là boot sau **reboot #35**
  (6fb582df → d8a11644, btime 17:27:53Z — xem §8).
- **MÂU THUẪN btime 15 s (F-148-T6-2 — mới, xem §8.10):**
  brief + T2-148 prereg ghi btime ~17:28:08Z (lấy từ
  `/proc/1`, epoch 1795109288); T6 + T5-148 POSTBOOT_PASS
  + T7-148 NOTES ghi btime 17:27:53Z (lấy từ `/proc/stat`
  + `uptime -s`, epoch 1795109273). T6 dùng **17:27:53Z
  làm chuẩn** theo quy ước đứng mọi đợt 120–147 (btime =
  /proc/stat = uptime -s; /proc/1 luôn muộn hơn 10–16 s
  và chỉ ghi làm chú thích). T7-148 đối chiếu độc lập:
  offset started_at run 147 viết lại = btime + 41 s theo
  /proc/stat (nằm trong dải chuỗi 31–50 s) vs +26 s theo
  /proc/1 (ngoài dải, min 31 s) — chuỗi offset khớp nguồn
  /proc/stat hơn. T2-148 tự ghi nghịch lý này làm
  F-candidate trong prereg. Gap theo T6: **18.867 s**;
  theo T2 prereg: 18.882 s (lệch đúng 15 s). T10/parent
  chốt chuẩn nào (T6 không tự đổi quy ước).
- **Đợt 148 mở 17:35:51Z** (sched 17:35:51Z) — tức **7.958 s
  sau btime boot d8a11644 (17:27:53Z)** theo /proc/stat
  (7.943 s theo /proc/1). T6 mở 17:40:19Z (12.386 s sau
  btime). Run 148 khởi động muộn +62 s (17:36:53Z — vì
  run 147 TIMEOUT, xem §9).
- Script lock v2 lúc mở: md5 `520b8baa` (bản sau đổi thứ tự
  đợt 135, không đổi) — v1 frozen `fd21193c`, suite
  `1c0d7eaa`, khớp baseline. preview.tsx md5 `530e10a7`.
- Các luồng đợt 148 khác đang chạy song song (lúc T6 mở đã
  có thư mục round148-t5/t7/t8/t9; round148-t1/t2/t4 xuất
  hiện trong phiên T6 — lúc đóng đủ 9/9 thư mục t1–t9):
  T8-148 đã acquire lock O8 từ 17:41:02Z (xem §1/§11);
  T5-148 đã viết POSTBOOT_PASS cho boot mới lúc 17:44:24Z
  (poll=2, dpkg 1545/221 — §11); T2-148 đã viết prereg +
  boot-verify ×2 + probe #67 (ok=2 fail=0, boot d8a11644)
  và đang điều tra mù #67 — T6 đối chiếu ở §8 với prereg +
  once.txt + boot-verify.txt; T4-148 đang chạy smoke +
  attempt #21 (quyết parent đợt 147: sửa probe + đo lại
  #21, không chuyển sang #22 — §11); T7-148 đã viết NOTES
  kiểm lần 1 (run 147 TIMEOUT + viết lại — §9); T9-148
  đang chạy sampler (ram-sampler.log tới 17:48:36Z),
  chưa viết headroom probe lúc T6 đóng; T1-148 đã chạy
  lại suite 27 mục (viết lại 30 file round93-u4/work
  17:46:51Z+ — xem F-148-T6-3, §8.6); T10-148 chưa mở
  lúc T6 đóng.

## 1. Quét zombie: 0 zombie; 1 vite thật lúc mở (T8-148 O8) và 1 vite thật lúc đóng (T4-148 attempt); Xvfb :188 → :193 đều là của luồng đang chạy — 0 cổng lạ, 0 process sót

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 17:40Z
  (mở, `ps-full-open.txt`) và lúc 17:49Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- **Lúc mở (17:40:19Z): 1 vite thật đang chạy — T8-148 O8**
  (pid 8165 `node .../vite --configLoader native -c
  /tmp/round87-o8/vite.o8w.config.mjs --port 5560`,
  ppid 8139 `node clicktest-87o8-mask-track-webkit.mjs`;
  kèm bridge pid 8152 (cổng 8861), Xvfb :188 pid 8177,
  esbuild pid 8178, MiniBrowser/WebKit pid 8192/8200/8259/
  8287). Tất cả thuộc cây process của T8-148 (lock holder
  lúc mở, §2). `ss -tlnp` lúc mở: 127.0.0.1:5560 (vite O8)
  + *:8861 (bridge T8) — đúng 2 cổng của T8, 0 cổng lạ.
- **Lúc đóng (17:49:28Z): 1 vite thật đang chạy — T4-148
  attempt** (pid 22260 `node .../vite -c .../round148-t4/
  vite.t4-temp.config.mjs --port 5187`, ppid 22259; kèm
  esbuild pid 22270, Xvfb :193 pid 22332). T8-148 đã nhả
  lock 17:45:04Z và dọn xong Xvfb :188 (không còn :188
  lúc đóng — xem §10). `ss` lúc đóng chỉ còn [::1]:5187
  (vite T4) — 0 cổng lạ.
- Lưu ý phương pháp (như mọi đợt): dòng bash wrapper của
  chính T6 trong `ps-full-*.txt` có args chứa chuỗi
  `vite-lock-v2.sh` nên khớp grep `vite` — đó là lệnh đo
  của chính T6, không phải process vite. T6 đếm "vite thật"
  bằng comm/args thực + đối chiếu ppid, không đếm dòng
  wrapper của mình.
- Snapshot mở rơi vào lúc T8-148 đang giữ lock O8 (acquire
  17:41:02Z — SAU lúc T6 bắt đầu 17:40:19Z 43 s; snapshot
  ps lúc ~17:40:5xZ đã thấy cây O8 của T8) — lock KHÔNG
  trống lúc mở đợt này (khác đợt 147: trống cả mở lẫn
  đóng). Cửa sổ trống duy nhất trong phiên T6 là
  17:46:43Z–17:47:19Z (giữa lúc T8 nhả và lúc T4 acquire
  smoke — prune chạy trong cửa sổ này, §7).

## 2. Lock lúc mở: T8-148 ĐANG GIỮ; lúc đóng: T4 ĐANG GIỮ; 3 chu kỳ hoàn tất + 1 chu kỳ đang giữ trong phiên T6

- **Lúc mở (17:40:19Z): thư mục lock thật
  `hidden_files/vite.lock` TỒN TẠI** — status lúc
  ~17:40:5xZ: `dir tồn tại, tuổi 21s, thread=t8-round148,
  pid=8053, port=5560, ticket=1-1795110062081669161-8075-
  t8-round148, started=2026-11-19T17:41:02Z,
  boot=d8a11644-...`, vite node 8165 trên cổng 5560,
  curl SERVING; `0 ticket + 101 cooldown`, rc=0.
- **Lúc đóng (17:49:28Z): lock ĐANG GIỮ bởi t4** —
  status: `dir tồn tại, tuổi 11s, thread=t4, pid=22098,
  port=5187, ticket=1-1795110557824174521-22098-t4,
  started=2026-11-19T17:49:18Z, boot=d8a11644-...`,
  vite node 22260 trên cổng 5187, curl 000 (vite đang
  khởi động); `0 ticket + 100 cooldown` (sau prune, §7),
  rc=0.
- **Cửa sổ trống giữa phiên (17:46:43Z): lock TRỐNG** —
  status `TRỐNG (không có lock)`, `0 ticket + 102
  cooldown`, rc=0 (kiểm 2 lần: 17:46:43Z + ngay trước
  prune — điều (e) thỏa, §7).
- **Log lock +13 dòng trong phiên T6** (raw 1255 lúc
  17:40:19Z → 1268 lúc đóng; md5 bản thô mở
  `8939e73a…` → đóng `3e639b1f…`): t8-round148 TICKET+
  ACQUIRED 17:41:02Z (2) + RELEASED 17:45:04Z (1) +
  t4 TICKET/ACQUIRED 17:47:19Z (2) + RELEASED 17:48:11Z
  (1) + COOLDOWN 17:48:17Z (1) + TICKET/ACQUIRED
  17:48:26/27Z (2) + RELEASED 17:49:02Z (1) + COOLDOWN
  17:49:17Z (1) + TICKET/ACQUIRED 17:49:17/18Z (2) =
  13 dòng. **3 chu kỳ hoàn tất trong phiên** (t8 O8
  hold 242 s; t4 smoke hold 52 s + 36 s) **+ 1 chu kỳ
  đang giữ** (t4 attempt smoke-wall45, acquired
  17:49:18Z, chưa release lúc T6 đóng — T6 đợt 149 đếm
  tiếp).
- Khoảng yên trước đó: event lock cuối trước phiên T6 là
  t8-round147 RELEASED 17:16:46Z; yên 17:16:46Z →
  17:41:02Z (24'16") là khoảng giữa đợt 147 đóng và đợt
  148 mở (reboot #35 ở giữa) — không phải do lock kẹt
  (bằng chứng: suite độc lập §6; 12 chu kỳ sau T6-147
  đóng đều sạch, §4).

## 3. Không đổi script đợt này — thứ tự mới đợt 135 đã có 106 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 12 chu kỳ mới kể từ
  lúc T6-147 đóng đều chạy trên thứ tự mới và đều sạch**
  (mỗi chu kỳ đủ TICKET + ACQUIRED + RELEASED — xem §4;
  đếm bằng TICKET sau snapshot đóng T6-147 14:46:32Z):
  - t4-round147 ×2 (attempt 1/2 đo lại #21, TICKET
    14:47:43Z / 16:39:29Z; RELEASED holds 6673 / 793 s —
    attempt1 giữ 111 phút do probe kẹt F-147-T4-1, chặn
    O8 chạy lại của T1 hai lần TIMEOUT 1800 s — xem §4),
  - t8-round147 ×7 (O8 hold 147 s + harness 6/6, TICKET
    16:58:16Z → 17:12:56Z; RELEASED holds 147 / 70 / 130 /
    240 / 70 / 131 / 230 s),
  - t8-round148 ×1 (O8, 17:41:02Z → 17:45:04Z; hold 242 s),
  - t4-round148 ×2 (smoke, TICKET 17:47:19Z / 17:48:26Z;
    RELEASED holds 52 / 36 s).
  - Cộng với 94 chu kỳ T6-147 đã đếm = **106 chu kỳ liên
    tiếp sạch trên thứ tự mới** (94 đợt 147 + 12 đợt này).
  - Bằng chứng phiên bản: T8-147 dùng script repo
    (`run-webkit-147t8.sh` — đã kiểm đợt 147); T4-147 dùng
    script repo (`run-attempt-147.sh` — đã kiểm đợt 147);
    T8-148 dùng script repo (lock holder lúc mở ghi
    `boot=d8a11644` trong status — script mới); T4-148
    dùng script repo (`vcut-vite-lock-v2.sh run-attempt t4
    5187 ...` trong ps — tức chạy trên **thứ tự ghi mới**,
    §11).
- **File `cooldown-t8-round148` mtime 17:45:04Z** (release
  của t8-148 — file MỚI, queue 101 → 102); file
  `cooldown-t4` mtime 17:49:02Z (release smoke thứ hai
  của t4-148 — ghi đè, không phải file mới); file
  `cooldown-t8-round147` mtime 17:16:46Z (release cuối
  harness t8-147). Không file cooldown mới nào trong
  phiên T6 ngoài `cooldown-t8-round148` (§7).
- **T10-148 chưa mở lúc T6 đóng** — T6 đợt sau kiểm md5
  bản frozen khi T10 chuẩn bị.

## 4. Nhất quán log lock: 1262 dòng chính thức lúc đóng, 362 cặp, 1 ACQUIRED mồ côi cũ (t4 F-134-T6-2) + 1 đang giữ hợp lệ (t4-148), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`awk '$3=="TICKET"'` — KHÔNG dùng grep -c chuỗi con; bài
học F-138-T10-1: STALE-TICKET làm grep đếm thừa). Số chính
thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH 17:43:46Z
17/11, dòng 848–853 thô — T6 đợt này xác minh lại: đúng 6
dòng đó là phần chênh giữa raw và bản đã lọc, khớp diff
round147-t6).
Bản đã lọc lúc mở: 1251 dòng (raw 1257); lúc đóng: **1262
dòng** (raw 1268) — **+11 dòng kể từ snapshot mở** (t8
RELEASED 1 + t4 10; +13 dòng kể từ lần đếm đầu 17:40:19Z
vì snapshot mở đã gồm TICKET+ACQUIRED của t8-148 lúc
17:41:02Z — xem §2). **KHỚP ĐÚNG số T6-147 đếm lúc đóng cộng thêm
12 chu kỳ hoàn tất + 2 TIMEOUT mới (§3)** — ba nguồn độc
lập đồng thuận về số lúc mở (T6-147 đóng 1212 chính thức
+ 39 dòng phần còn lại đợt 147 = 1251 lúc mở đợt này;
xem bảng).

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng T6-147 (1212) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 380 | 365 | 289 | 283 |
| ACQUIRED | 369 | 356 | 287 | 281 |
| RELEASED | 362 | 350 | 284 | 278 |
| COOLDOWN | 134 | 126 | 126 | 121 |
| TIMEOUT | 10 | 8 | **2** | 2 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **1262** | **1212** | **989** | **966** |

- So với snapshot T6-147 đóng (1212 dòng): **+50 dòng =
  TICKET +15 / ACQUIRED +13 / RELEASED +12 / COOLDOWN +8 /
  TIMEOUT +2 / STALE +0** — đúng bằng 12 chu kỳ hoàn tất
  (§3) + 1 ACQUIRED đang giữ (t4-148, 17:49:18Z) + 2
  TIMEOUT mới (t1-147, xem dưới) + 2 COOLDOWN thừa so với
  chu kỳ (t8-147 harness: 6 chu kỳ có 5 event COOLDOWN +
  1 event O8 — xem T6-147 §4; đợt này t4 smoke có 2 event
  COOLDOWN cho 2 chu kỳ + t8-148 O8 có 0 event — tổng
  COOLDOWN +8 = 5 (t8-147 harness) + 1 (t8-147 O8, wait
  2323 ms) + 2 (t4-148 smoke) = 8 ✓). Mọi chu kỳ đều
  sạch, ghép cặp đủ — khớp từng con số, không có event
  nào mất dấu hay thêm lạ ngoài ca t4 cũ §3 T6-136.
- **2 TIMEOUT MỚI (lần đầu kể từ trước đợt 120):**
  t1-147-round147 TICKET 14:48:20Z → TIMEOUT 15:18:25Z
  (waited=1805 s) và TICKET 15:20:27Z → TIMEOUT
  15:50:28Z (waited=1801 s) — T1-147 chạy lại O8 nhưng
  bị t4-round147 attempt1 giữ lock 111 phút (hold
  6673 s, F-147-T4-1 probe kẹt) nên timeout sau ~30 phút
  mỗi lần, KHÔNG acquire được. Đây là TIMEOUT do chờ
  lock bị giữ lâu, không phải lỗi lock (cơ chế timeout
  hoạt động đúng: ticket bị hủy sau 1800 s, không kẹt
  vĩnh viễn; không có ACQUIRED mồ côi nào từ 2 ticket
  này). Đợt 120+ trước đó có **0 TIMEOUT**; nay R120 có
  **2 TIMEOUT** — cả hai đều giải thích được, không phải
  suy thoái lock. T10 gộp ghi nhận.
- Ghép cặp theo thread (`analyze-log.py` của T6-134, chạy
  trên bản ĐÃ LỌC 1262 dòng): **362 cặp ACQUIRED→RELEASED;
  1 "đang giữ"** — t4-148 (ACQUIRED 17:49:18Z, dòng
  1262, attempt smoke-wall45 đang chạy — hợp lệ, không
  phải kẹt). Chênh ACQUIRED − RELEASED = 7 = **5 ca
  double-acquire đã biết + 1 ca t4 mồ côi (dòng 869,
  ACQUIRED 23:50:17Z) + 1 ca t4-148 đang giữ**. Dòng 869
  **vẫn là ACQUIRED duy nhất không có RELEASED thật của
  chính nó** (F-134-T6-2); KHÔNG phải lock kẹt. 0 lần
  RELEASED không có ACQUIRED trước đó.
- 6 ca "double-acquire" trong output analyzer — **cùng
  đúng 6 ca đã biết** (5 ca cũ s3-round116, t3-round117,
  t4, t3-round119, t8-round129 dòng 781 + ca t4 dòng
  888/02:50:57Z); tất cả giải thích được bằng STALE-LOCK
  cướp sau reboot (5 ca cũ) hoặc reboot-kill (ca t4);
  **không có ca mới nào**.
- 8 TIMEOUT cũ toàn bộ từ trước đợt 120 (lần cuối
  12:02:19Z 15/11) + **2 TIMEOUT mới t1-147** (xem trên)
  — STALE-LOCK mới duy nhất vẫn là đợt 130 (do reboot
  giữa lượt).
- Cửa sổ R120: **289 = 287 T/A + 2 TIMEOUT, RELEASED 284**
  (chênh T/A−R = 3 = 1 ca reboot-kill đợt 129 + 1 ca t4
  đợt 134 + 1 ca t4-148 đang giữ), TIMEOUT 2 (mới),
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  380+369+362+134+10+6+1 = 1262 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 147 khép lại trên lock (toàn đợt): 9 chu kỳ sạch**
  — 0 trong phiên T6-147 + 9 sau khi T6-147 đóng snapshot
  (t4 ×2 attempt #21 + t8-round147 ×7 O8+harness) — khớp
  đúng recount T10-147 (log thô cuối t8-round147 RELEASED
  17:16:46Z; queue 101 file sau T8).
  **Đợt 148 tới 17:49:28Z có 3 chu kỳ sạch + 1 đang giữ**
  (t8 O8 + t4 smoke ×2 + t4 attempt đang giữ) — T6 đợt
  149 đếm tiếp. Không phải bug lock.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 146 (toàn đợt), đợt 147 (toàn đợt) và đợt 148 (tới 17:49Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại
chỉ `echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. Phạm
vi đếm: toàn bộ `round146-t*/` + `round147-t*/` +
`round148-t*/` (tới 17:49Z) — theo quy tắc lăn: bỏ round145,
thêm round147 (phần còn lại sau T6-147) + round148.
**Phương pháp đếm đợt này: grep ra file /tmp trước,
`--exclude` file grep-output (`khong-nha-grep.txt`) NGAY
từ lần đầu + KHÔNG loại file repro theo basename (bài học
F-144-T6-3), trừ tay 3 dòng repro của chính mình sau khi
đếm** (theo bài học F-142-T6-2: không đếm lồng file
grep-output; bài học T6-138 §5).
**Lưu ý phương pháp:** pattern grep có dấu (`KHÔNG NHẢ` /
`BỎ QUA release thừa`) — các file `.done` của T6 viết bằng
ASCII không dấu (`"KHONG NHA"`) nên KHÔNG khớp pattern này.
Tổng **13 dòng khớp, phân loại đủ 13/13 — tất cả đều là
bản sao script / log repro, 0 sự kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round146-t10/vcut-vite-lock-v2.t10.sh` (dòng 432/434, bản mới `520b8baa`), `round147-t1/vcut-vite-lock-v2.t1-147.sh` (dòng 432/434, bản mới `520b8baa`) |
| Tái hiện có kiểm soát trên /tmp | 9 | `round146-t6/repro-newmsg.log` (3) + `round147-t6/repro-newmsg.log` (3) + `round148-t6/repro-newmsg.log` (3, của chính T6 đợt này — đếm ở đợt 149) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.2) |
| Trích dẫn trong tài liệu | 0 | Không file `.done` nào trong phạm vi khớp pattern có dấu (các file `.done` của T6 viết không dấu) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 146 (toàn đợt) / 147 (toàn đợt) / 148 nào |
| Round148-t* (trừ repro /tmp của T6) | 0 dòng | T10-148 chưa mở; T4-148/T8-148 chưa có driver log nào khớp (chỉ có log lock thật, không đếm ở đây) |

- **Repro đợt này (chưa đếm, đếm ở đợt 149):**
  `round148-t6/repro-newmsg.log` 3 dòng (2 `BỎ QUA` +
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
  = 0 (toàn đợt), đợt 146 = 0 (toàn đợt — bổ sung 2 chu kỳ
  t4-147? không, 2 chu kỳ t4 thuộc đợt 147; đợt 146 đã
  khép ở T6-147 §4), đợt 147 (toàn đợt — bổ sung 9 chu kỳ
  sau T6-147 đóng, §4) = 0, đợt 148 tới 17:49Z = 0.**
  Khớp với log pairing sạch ở §4 (362 cặp + 1 ca
  reboot-kill cũ đã giải thích + 1 đang giữ hợp lệ — không
  liên quan nhánh release).
- Giới hạn phạm vi: T4/T8/T10-148 chưa chạy xong tới 17:49Z
  — nếu có sự kiện mới sau thời điểm đếm thì thuộc đợt
  148, T6 đợt 149 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-147 đếm 13 dòng (4 script + 9
  repro); đợt này bỏ round145 (−2 script −3 repro = −5)
  nhưng thêm round147-t1 script (+2 — 3 dòng repro
  round147-t6 đã nằm trong số T6-147 đếm vì đó là repro
  của chính T6-147) và round148-t6 repro (+3) = 13 − 5 +
  2 + 3 = **13 dòng** ✓ (round148-t10 chưa mở nên +0;
  round147-t10 không có script frozen — T10-147 không
  chạy O8 riêng). Trừ 3 dòng repro của chính mình →
  **10 dòng phân loại chuẩn** (4 script + 6 repro cũ).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9, 8/9 (T7 flaky 1 lần), 9/9 + repro message đều xanh — T7 flaky TÁI DIỄN lần đầu sau 23 lần xanh kép (F-148-T6-1)

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot
d8a11644 (`#111?` đếm chặt).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 8/9 (T7 FAIL), lần 3 9/9 PASS

(`round148-t6/test-v2-t6-run1.log` ~17:43Z,
`test-v2-t6-run2.log` ~17:44Z, `test-v2-t6-run3.log`
~17:45Z):
- **Lần 1: PASS=9 FAIL=0, rc=0. Lần 2: PASS=8 FAIL=1,
  rc=1 — FAIL duy nhất là T7** (`T7 poll: B1=7 B2=4
  (muốn B1-B2=1)` — đếm blockers WebProcess giả: 7
  trước khi kill giả, 4 sau khi kill; kỳ vọng đúng 1
  bị gỡ). **Lần 3 (chạy lại để định tính flake):
  PASS=9 FAIL=0, rc=0** — T7 xanh trở lại
  (`blockers 2 -> 1`).
- **Kết luận: T7 flaky TÁI DIỄN 1 lần** (F-148-T6-1) —
  lần flaky đầu tiên sau **23 lần xanh kép liên tiếp**
  không có lần T7 flaky (T6-147 §6.1). Tính flaky của
  T7 (T9 đợt 119 §1.2) vẫn được ghi nhận là bản chất —
  lần xanh kép thứ 24 bị đứt ở lần chạy 2 nhưng lần
  chạy 3 xanh lại ngay; T1–T6 + T8 xanh cả 3 lần chạy.
  Quyết tách T7 khỏi gate 9/9 khi đợt đông vẫn thuộc về
  parent; T6 không tự đổi test. **Kết luận suite: xanh
  về bản chất (9/9, 8/9-T7, 9/9)** — không phải lỗi
  lock (T7 chỉ đếm process giả trong /tmp, không đụng
  lock thật; mọi thao tác lock T1–T6/T8 đều PASS cả 3
  lần).
- Chuỗi xanh suite: lần thứ ba mươi liên tiếp không có
  lần fail nào ngoài T7 flaky (T6 đợt 120 + T9 đợt 120
  + T6 đợt 121 … + T6 đợt 147 + T6 đợt 148 — tính cả
  lần T7 flaky này là fail do test, không phải do lock).

### 6.2 Repro message ĐÚNG (`round148-t6/repro-newmsg.log`, 17:46:20Z)

Copy verbatim script của T6-147, chỉ đổi tên TDIR
(`vcut-t6r147-repro` → `vcut-t6r148-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–147, kết quả giống hệt:
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
  lúc đó có 101–102 cooldown; log thật vẫn 1257 dòng thô
  lúc repro chạy và queue vẫn 102 file sau khi repro xong;
  không có file `cooldown-tA/tH/tB` nào xuất hiện trong
  queue thật. **F-132-T6-1 KHÔNG lặp lại.**
- **Kết luận sức khỏe: lock KHỎE.** Giữ/nhả đúng lúc mở
  và lúc đóng (T8 O8 hold 242 s + T4 smoke 52/36 s +
  T4 attempt đang giữ hợp lệ), 0 zombie, 0 stale, queue
  0 ticket, log nhất quán (362 cặp + 1 ca reboot-kill cũ
  đã giải thích + 1 đang giữ hợp lệ, 0 mất dấu khác — số
  chính thức đã loại 6 dòng repro lỗi của T6-132),
  2 TIMEOUT mới đều giải thích được (t1-147 chờ lock bị
  giữ 111 phút — cơ chế timeout hoạt động đúng), 0 sự
  kiện "KHÔNG NHẢ" trên lock thật đợt 120–147 (toàn đợt)
  và đợt 148 (tới 17:49Z), suite 9/9 độc lập (T7 flaky
  1/3 lần — F-148-T6-1), và thứ tự ghi mới đã có **106
  chu kỳ thật** chứng minh (§3). **Không còn caveat nào
  về mất dòng RELEASED cho các chu kỳ mới** — caveat cũ
  chỉ còn là 1 dòng lịch sử (t4, §3–§4 T6-136).
  Lưu ý duy nhất trong phiên: **lock KHÔNG trống lúc mở
  lẫn lúc đóng** (T8 giữ lúc mở, T4 giữ lúc đóng) —
  prune phải chờ cửa sổ trống 17:46:43Z–17:47:19Z (§7);
  T4-148 attempt đang giữ lúc T6 đóng — T6 đợt 149 đếm
  tiếp.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 2 FILE (TRẦN MỀM KÍCH HOẠT LẦN 3 LIÊN TIẾP)

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
  - 17:46:43Z: lock TRỐNG (status 0 ticket + 102 cooldown
    — kiểm 2 lần: lúc snapshot trống + kiểm lại ngay trước
    prune) — điều (e) thỏa; quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng) — điều (a) không kích hoạt.
  - **Điều (b) KÍCH HOẠT LẦN THỨ BA LIÊN TIẾP: tổng 102 >
    trần mềm 100 → xóa 2 file cũ nhất tới khi còn 100.**
    File bị xóa: `cooldown-s8-round116` (mtime
    2026-11-14T21:08:25Z, tuổi **~116,6h** ≥48h ✓) và
    `cooldown-s4-w1` (mtime 2026-11-14T21:08:37Z, tuổi
    **~116,6h** ≥48h ✓), cả hai thuộc đợt ~116 — không
    phải đợt hiện tại/ngay trước ✓ (điều (c) thỏa).
  - **Kết quả prune đợt 148: 2 file đã xóa.** Danh sách
    file đã xóa: `cooldown-s8-round116`,
    `cooldown-s4-w1`. `prune-deleted.txt` ghi 2 dòng
    `removed ...`. Đây là kết quả đúng của luật — luật đã
    chạy và điều (b) kích hoạt lần thứ ba liên tiếp (đợt
    146 xóa `cooldown-r4-round115`, đợt 147 xóa
    `cooldown-s4-staleprobe`, đợt 148 xóa 2 file này).
    File cooldown cũ nhất còn lại nay là
    `cooldown-s4-w2`, mtime 2026-11-14T21:08:48Z — sẽ đủ
    7 ngày theo đồng hồ tường vào khoảng **21/11 21:08Z**;
    theo phương pháp `find -mtime +7` (≥192h) sẽ khớp ứng
    viên vào khoảng **22/11 21:08Z**. T6 các đợt sau đếm
    tiếp. Xem F-147-T6-1 (§12): dự báo "file cũ nhất đủ 7
    ngày ~21/11 21:08Z" của T6-147 không còn đối tượng vì
    chính file đó (`cooldown-s8-round116`) đã bị xóa theo
    điều (b) trước khi đủ 7 ngày — lần thứ ba liên tiếp
    điều này xảy ra; quy luật: trong khi mỗi đợt thêm ≥1
    file cooldown mới thì điều (b) xóa file cũ nhất mỗi
    đợt TRƯỚC khi nó đủ 7 ngày, nên điều (a) praktisch
    không bao giờ kích hoạt — ghi nhận, không đổi luật
    (luật thuộc parent).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (17:40Z) **101 file / 1414 byte**;
  lúc trống trước prune (17:46Z) **102 file / 1428 byte**
  (102 × 14 = 1428 khớp; `ls`/`find`/`status` khớp nhau);
  **sau prune 100 file / 1400 byte**. Số học khớp: 101 +
  1 = 102 ✓ (1 file cooldown mới: `cooldown-t8-round148`
  mtime 17:45:04Z; `cooldown-t4` chỉ ghi đè, không phải
  file mới), rồi 102 − 2 = 100 ✓ (2 file prune). Không
  file nào bị xóa hay thêm giữa hai lần đếm của đợt này
  ngoài 2 file prune trên (log lock +13 dòng trong phiên,
  §2 — nhưng chỉ 1 file cooldown mới vì các release còn
  lại ghi đè file đã có).
- Phân tầng tuổi lúc ~17:46Z (ngữ nghĩa `find -mtime`,
  TRƯỚC prune): **>7 ngày (`-mtime +7`, tức ≥192h): 0
  file; ≥72h (`-mtime +2`): 43 file** (tăng từ 40 đợt 147
  trước prune — 3 file mtime 16/11 vừa vượt 72h, đúng
  quy luật tuổi); **≥48h (`-mtime +1`): 72 file** (tăng
  từ 71 đợt 147 trước prune — 1 file vừa vượt 48h, đúng
  quy luật tuổi).
  Sau prune: ≥72h **41 file**, ≥48h **70 file** (2 file
  bị xóa thuộc cả hai tầng). File cũ nhất còn lại
  `cooldown-s4-w2`, mtime 2026-11-14T21:08:48Z —
  lúc 17:46Z mới **~116,6h tuổi**.
- **Lưu ý cửa sổ prune hẹp:** lock chỉ trống
  17:46:43Z–17:47:19Z (~36 s) giữa lúc T8 nhả và lúc T4
  acquire smoke — T6 prune đúng trong cửa sổ này (xóa
  xong 17:47:06Z, 13 s trước khi T4 acquire). Nếu đợt
  sau lock không trống trong phiên T6 thì prune PHẢI
  hoãn theo điều (e) — T6 không tự ý xóa khi lock đang
  giữ.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#111? + d8a11644; số tuyệt đối VẪN TẠM; chuỗi INSIDE 6 → 0 (ĐỨT); khung chết #110? ứng viên 223 s

### 8.0 Reboot #35 — 6fb582df → d8a11644 (btime 17:27:53Z), trong lúc T10-147 đóng sổ

- Reboot 6fb582df → d8a11644 (btime 17:27:53Z theo
  /proc/stat; 17:28:08Z theo /proc/1 — xem F-148-T6-2)
  xảy ra **trong lúc T10-147 đóng sổ** (sau cờ
  round147-t8.done 17:22:19Z, trước cờ t10.done
  17:33:22Z; aggregate mtime 17:34:03Z) — **sự kiện #35**
  theo đánh số của aggregate đợt 147 §10.2 (quy tắc đứng:
  mỗi lần đổi boot_id là 1 sự kiện, kể cả reboot trong
  lúc đóng sổ). **Claim "0 reboot trong phiên" của đợt
  147 ĐÃ SAI theo nghĩa chặt** (xem F-148-T6-4): 0 reboot
  trong phiên làm việc của các luồng T1–T9, NHƯNG 1
  reboot trong lúc T10 đóng sổ (trước hạn cứng 17:30Z 2
  phút, trong cửa sổ đóng sổ của T10). T10-147 đóng
  17:33:22Z theo cờ (mtime 17:34:14Z) — TRÊN BOOT MỚI
  d8a11644 (phiên worker của T10 sống qua reboot; file
  postclosing mtime 17:33:36Z + aggregate mtime 17:34:03Z
  đều sau btime boot mới).
- **Không luồng nào mất việc do reboot này trong phiên
  T6:** T6 mở 17:40:19Z và đóng 17:49:42Z toàn bộ trên
  boot mới, không bị reboot cắt (uptime liền mạch
  12'26" → 21'35'). Reboot xảy ra trước khi đợt 148 mở
  (17:35:51Z) và KHÔNG giết holder lock nào (lock trống
  từ 17:16:46Z — release cuối của t8-round147 — tới
  17:41:02Z; không có ticket/lock mồ côi nào sau reboot
  — queue giữ nguyên 101 file qua reboot, §7).
- **Replay apt sau boot d8a11644: THUỘC T5** — T6 không
  kiểm `dpkg.log` (không thuộc nhiệm vụ brief). T5-148
  đã viết POSTBOOT_PASS cho boot mới lúc 17:44:24Z
  (poll=2, repair=none/replay-full, dpkg=1545/221 —
  xem §11).
- **/tmp đã bị reboot xóa sạch:** socket Xvfb của T8-147
  (X188 cũ) không còn; `/tmp/.X11-unix/` lúc T6 mở chỉ
  có X188 MỚI của T8-148 (17:41Z) — xem §10. Socket
  X193 của T4-145 đã biến mất từ lâu (reboot xóa /tmp);
  X193 lúc đóng là của T4-148, tạo mới 17:49Z (§10).

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1 / T6-135 §8.1 /
  T6-136 §8.1 / T6-137 §8.1 / T6-138 §8.1 / T6-139 §8.1 /
  T6-140 §8.1 / T6-141 §8.1 / T6-142 §8.1 / T6-143 §8.1 /
  T6-144 §8.1 / T6-145 §8.1 / T6-146 §8.1 / T6-147 §8.1):
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

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm d8a11644 theo cách đếm chặt)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2 /
T6-135 §8.2 / T6-136 §8.2 / T6-137 §8.2 / T6-138 §8.2 /
T6-139 §8.2 / T6-140 §8.2 / T6-141 §8.2 / T6-142 §8.2 /
T6-143 §8.2 / T6-144 §8.2 / T6-145 §8.2 / T6-146 §8.2 /
T6-147 §8.2 (mỗi boot liệt kê với boot_id + btime lấy từ ≥1
nguồn độc lập; btime→btime danh nghĩa = khoảng cách giữa
hai btime liên tiếp).
**Số thứ tự dùng CÁCH ĐẾM CHẶT làm chuẩn** theo quyết
parent (c) đợt 143: b47f7932 = #103?, 9afdaa89 = #104?,
70a5b0fc = #105?, 691a7403 = #106?, cc222c8a = #107?,
e146ca67 = #108?, 98a7c93f = #109? (theo quyết parent (e)/(f)
đợt 144 + (g) đợt 145 + (e) đợt 146), 6fb582df = #110?
(theo quyết parent (g) đợt 146 + (e) đợt 147 — INSIDE 6
chính thức), **d8a11644 = #111?** (mới đợt này — reboot
#35, xem §8.0). **Định nghĩa đếm dùng: định nghĩa gộp
của T10 (LIMITS gộp đợt 133 §10.2) — mọi reboot quanh đợt,
cả giữa lượt lẫn ranh giới — theo quyết F-133-6.** Bảng
dưới chỉ ghi 10 boot cuối (chuỗi đầy đủ #57→#101 xem
T6-131 §8.2 + T6-132 §8.2 + T6-133 §8.2 + T6-134 §8.2 +
T6-135 §8.2 + T6-136 §8.2 + T6-137 §8.2 + T6-138 §8.2 +
T6-139 §8.2 + T6-140 §8.2 + T6-141 §8.2 + T6-142 §8.2 +
T6-143 §8.2 + T6-144 §8.2 + T6-145 §8.2 + T6-146 §8.2 +
T6-147 §8.2 — không chép lại để khỏi drift; T6 đợt này đã
đối chiếu lại với LIMITS gộp đợt 147: các boot #102?→#110?
dưới đây khớp đúng btime/boot_id T10-147 đã chốt, không có
boot_id lạ nào xuất hiện trong bất kỳ bằng chứng 18–19/11
nào ngoài chuỗi này).

| # (tạm, đếm chặt) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #102 | bde599df | 22:48:05Z 18/11 | 1h05m33s (3.933 s — gap #102?→#103?, CHỨNG NHẬN [3.923, 3.943] s, T2-143 + quyết parent (d) đợt 143); sống tới 23:53:38Z | T6-143 + T2-143 (prereg + probe #62 + merged mù #62) + T10-142 §10.2 + quyết parent (d) đợt 143 (CERT 63 / FULL 78 XÁC NHẬN) |
| #103 | b47f7932 | 23:53:38Z 18/11 | 0h00m42s (42 s — gap #103?→#104?, SPAN — đoạn B mù #62 không chứng nhận được, quyết parent (e) đợt 143 BÁC floor cơ học = 0); sống tới 23:54:20Z | T6-143 + T2-143 (prereg + merged mù #62) + T7-142 + T9-142 + T10-142 §10.2 + quyết parent (c) đợt 143 (đếm chặt: b47f7932 = #103?) |
| #104 | 9afdaa89 | 23:54:20Z 18/11 | 2h01m05s (7.265 s — gap #104?→#105?, SPAN — đoạn C mù #62 MỞ, tối đa 2 ẩn, quyết parent (e) đợt 143 BÁC continuity dòng-log làm closer); sống tới 01:55:25Z | T7-142 + T9-142 + T10-142 §10.2 + T2-142 (btime TRONG dải FULL77 neo #102? [23:15:16Z, 01:12:54Z] — xem §8.8/F-144-T6-1) + quyết parent (c) đợt 143 (đếm chặt: 9afdaa89 = #104?) |
| #105 | 70a5b0fc | 01:55:25Z 19/11 | 2h00m20s (7.220 s — gap #105?→#106?, CHỨNG NHẬN [7.210, 7.230] s, mù #63 đóng hoàn toàn, T2-144 + quyết parent (c) đợt 144); sống tới 03:55:45Z | T6-143 + T2-143 prereg + boot-verify + probe #62 + T7-143 NOTES + T10-142 (suite + O8 chạy trên boot này 01:57–02:04Z) + quyết parent (c) đợt 143 (đếm chặt: 70a5b0fc = #105?) |
| #106 | 691a7403 | 03:55:45Z 19/11 | 1h57m30s (7.050 s — gap #106?→#107?, SPAN — đoạn B mù #64 MỞ, tối đa 2 ẩn, quyết parent (b) đợt 145); sống tới 05:53:15Z | T6-144 (brief + uptime/journal//proc/1/wtmp) + T2-144 prereg + boot-verify (probe #63 ok=2 fail=0) + T7-144 NOTES + T10-143 (suite + O8 chạy trên boot này 03:58–05:27Z) + quyết parent (c) đợt 143 (đếm chặt: 691a7403 = #106?) + quyết parent (d) đợt 145 (khung chết CHỐT (05:53:06Z, 05:53:15Z] 9 s) |
| #107 | cc222c8a | 05:53:15Z 19/11 | 2h03m01s (7.381 s — gap #107?→#108?, SPAN — đoạn B mù #64 MỞ, tối đa 2 ẩn, quyết parent (b) đợt 145); sống tới 07:56:16Z | T7-144 (ba nguồn, kiểm 3 lần) + T9-144 (uptime + btime + boot_id + who-b + journal) + T2-144 boot-verify/LIMITS §2.11 + T10-144 §10.1/§10.2 + quyết parent (e) đợt 144 (reboot #31 XÁC NHẬN) + quyết parent (c) đợt 145 (khung chết CHỐT (07:55:38Z, 07:56:16Z] 38 s) |
| #108 | e146ca67 | 07:56:16Z 19/11 | 1h57m47s (7.067 s — gap #108?→#109?, CHỨNG NHẬN [7.057, 7.077] s, mù #65 đóng hoàn toàn, T2-146 + quyết parent (b)/(c) đợt 146); sống tới 09:54:03Z | T6-145 (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T2-145 prereg + boot-verify ×2 (probe #64 ok=2 fail=0) + T7-145 NOTES + T10-144 (suite + O8 chạy trên boot này 08:13–08:20Z) + T2-146 (probe #65 ok=2 fail=0, boot 98a7c93f + merged mù #65 đóng hoàn toàn — xác nhận boot sau) + quyết parent (f) đợt 144 (e146ca67 = #108? đếm chặt) + quyết parent (g) đợt 145 (reboot #33 XÁC NHẬN) + quyết parent (b)/(c) đợt 146 (mù #65 đóng hoàn toàn; gap chứng nhận → CERT 65 / FULL 80) |
| #109 | 98a7c93f | 09:54:03Z 19/11 | 2h19m23s (8.363 s — gap #109?→#110?, CHỨNG NHẬN [8.353, 8.373] s, mù #66 đóng hoàn toàn, T2-147 + quyết parent đợt 147 (MEMORY.md: mù #66 đóng hoàn toàn → chuỗi 2; gap chứng nhận → CERT 66 / FULL 81; khung chết #109? (12:13:15Z, 12:13:26Z] 11 s CHỐT LÀM CHUẨN; INSIDE 6 chính thức)); sống tới 12:13:26Z | T6-146 (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T2-146 prereg + boot-verify (probe #65 ok=2 fail=0) + T7-146 NOTES + T5-146 POSTBOOT_PASS + T10-145 (suite + O8 chạy trên boot này 11:16–11:26Z) + T2-147 (probe #66 ok=2 fail=0, boot 6fb582df — xác nhận boot sau) + quyết parent (g) đợt 145 (98a7c93f = #109? đếm chặt) + quyết parent (q) đợt 146 (tuổi thọ CHUẨN 8.363 s) |
| #110 | 6fb582df | 12:13:26Z 19/11 | 5h14m27s (18.867 s — gap #110?→#111?, CHỜ merged mù #67 của T2-148 chứng nhận; khoảng dự kiến [18.857, 18.877] s theo btime /proc/stat của T6 — T2-148 prereg dùng btime /proc/1 17:28:08Z nên dự kiến [18.872, 18.892] s, lệch 15 s — xem F-148-T6-2); sống tới 17:27:53Z | T6 này (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T2-147 prereg + boot-verify ×2 (probe #66 ok=2 fail=0) + T7-147 (run 147 khởi động đúng giờ, không viết lại) + T5-147 POSTBOOT_PASS + T9-147 headroom log + T2-148 prereg (reboot #35 + mù #67 MỞ) + T7-148 NOTES (btime stat 17:27:53Z + proc/1 17:28:08Z, ghi cả hai) + T5-148 POSTBOOT_PASS (btime 17:27:53Z) + quyết parent (g) đợt 146 (6fb582df = #110? đếm chặt) + quyết parent đợt 147 (INSIDE 6 chính thức) |
| #111 | d8a11644 | 17:27:53Z 19/11 | đang sống | T6 này (brief + uptime/journal//proc/1/wtmp, mở + đóng) + T2-148 prereg + boot-verify ×2 (probe #67 ok=2 fail=0) + T7-148 NOTES + T5-148 POSTBOOT_PASS + T9-148 sampler + quyết parent (chờ — số #111? là TẠM theo đếm chặt) |

- **Ghi chú bảng:** các hàng #102–#109 chép nguyên từ bảng
  T6-147 (đã qua soát xét đợt 147, cập nhật verdict gap +
  khung chết theo quyết parent đợt 147 ghi trong MEMORY.md:
  gap #109?→#110? nay CHỨNG NHẬN [8.353, 8.373] s — CERT
  66 / FULL 81; khung #109? CHỐT (12:13:15Z, 12:13:26Z]
  11 s; INSIDE 6 chính thức); hàng #110 cập nhật tuổi thọ
  18.867 s (theo /proc/stat — xem F-148-T6-2) + gap chờ
  chứng nhận; hàng #111 là boot mới. Nhãn gap trong ngoặc
  ở mỗi hàng là gap ứng với tuổi thọ danh nghĩa của boot đó
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
  (g) đợt 145 XÁC NHẬN); **#109?→#110? là sự kiện thứ 34**
  (GIỮA LƯỢT 146, trong lúc T10-146 chờ cờ — quyết parent
  (g) đợt 146 XÁC NHẬN); **#110?→#111? là sự kiện thứ 35**
  (TRONG LÚC T10-147 ĐÓNG SỔ, sau cờ T8 17:22:19Z, trước
  cờ T10 17:33:22Z — T2-148 prereg + T7-148 NOTES + T6
  đợt này (btime 17:27:53Z + file T10 mtime sau btime);
  chờ parent xác nhận).
- **T2-148 + T5-148 + T7-148 đối chiếu (độc lập, trước/sau
  khi T6 đo):** prereg-t2.md ghi boot mới `d8a11644…`,
  btime 17:28:08Z theo /proc/1 (xem F-148-T6-2 — lệch
  +15 s so với T6/T5/T7 dùng /proc/stat);
  `boot-verify.txt` + `boot-verify2.txt` khớp đúng boot_id
  + uptime -s 17:27:53Z (trong cùng file boot-verify của
  T2 cũng có cả hai số: btime_epoch=1795109288 và
  `2026-11-19 17:27:53`); probe #67 (`once.txt`:
  `probe#67 boot=d8a11644 ok=2 fail=0`) xác nhận boot
  đang sống; T5-148 POSTBOOT_PASS (17:44:24Z, poll=2,
  dpkg 1545/221) ghi btime=17:27:53Z — KHỚP T6; T7-148
  NOTES ghi cả hai btime + kết luận chuỗi offset khớp
  /proc/stat hơn (41 s trong dải vs 26 s ngoài dải).
  Ba luồng T5/T6/T7 khớp nhau về btime /proc/stat;
  T2 dùng /proc/1 — T10 gộp phán (F-148-T6-2).
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#96: như T6-133 §8.2 + T6-134 §8.2–§8.4 + T6-135
    §8.2–§8.3 + T6-136 §8.2–§8.3 + T6-137 §8.2–§8.3 +
    T6-138 §8.2–§8.4 + T6-139 §8.2–§8.4 + T6-140 §8.2–§8.4
    + T6-141 §8.2–§8.4 + T6-142 §8.2–§8.4 + T6-143 §8.2–
    §8.5 + T6-144 §8.2–§8.5 + T6-145 §8.2–§8.5 + T6-146
    §8.2–§8.5 + T6-147 §8.2–§8.5 (không chép lại).
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
  - #108 (e146ca67): khung **CHỐT LÀM CHUẨN (09:44:04Z,
    09:54:03Z] (599 s)** — quyết parent (d) đợt 146 (rộng
    nhưng là tốt nhất có được; recheck 0 mốc mới; khoảng
    im lặng 549 s của T7 là bằng chứng loại khác, không
    phải khung cạnh tranh).
  - #109 (98a7c93f): khung **CHỐT LÀM CHUẨN (12:13:15Z,
    12:13:26Z] (11 s)** — quyết parent đợt 147 (ghi trong
    MEMORY.md: "Khung chết #109? (12:13:15Z, 12:13:26Z]
    (11 s): CHỐT LÀM CHUẨN").
  - #110 (6fb582df): ứng viên quét mtime của T6, CHƯA
    CHỐT (xem §8.6).

### 8.3 Khung chết #95? — ứng viên 400 s GIỮ NGUYÊN (không có bằng chứng mới)

- **Khung chết #95? ứng viên: (13:47:01Z, 13:53:41Z]
  (400 s)** — T2/T6/T10 đồng thuận đợt 139; T2-140 prereg
  §0 và T2-141 prereg §0 xác nhận giữ nguyên trừ khi có
  bằng chứng mới.
- T6 đợt này KHÔNG quét lại cửa sổ này (không có bằng chứng
  mới nào có thể xuất hiện: cửa sổ nằm ngày 18/11, đã đóng
  băng từ đợt 139; merged mù #67 không phủ cửa sổ này —
  mù #67 bắt đầu 14:41:45Z 19/11). **Khung 400 s giữ
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
  trong phiên T6 đợt này — merged mù #67 không phủ các
  cửa sổ này (mù #67 bắt đầu 14:41:45Z 19/11). Trạng thái
  ba khung từ nay là **ĐÃ CHỐT CHUẨN**, không còn hoãn quyết.

### 8.5 Khung chết #99?/#100?/#101? — ĐÃ CHỐT CHUẨN theo quyết parent đợt 142 §12.2(g)

- **Khung chết #99? chuẩn: (21:51:52Z, 21:52:21Z] (29 s)**
  — merged T2 TRÙNG KHỚP HOÀN TOÀN khung quan sát T9-141.
- **Khung chết #100? chuẩn: (22:32:05Z, 22:33:03Z] (58 s)**.
- **Khung chết #101? chuẩn: (22:45:49Z, 22:48:05Z] (136 s)**.
- Không có bằng chứng mới nào về ba khung này trong phiên
  T6 đợt này. Trạng thái ba khung từ nay là **ĐÃ CHỐT
  CHUẨN**, không còn hoãn quyết.

### 8.6 Khung chết #110? (6fb582df) — quét mtime của T6: mốc cuối 17:24:10Z, ứng viên (17:24:10Z, 17:27:53Z] 223 s — chờ merged mù #67 của T2-148 chốt

- **Quét mtime của T6 (`scan-mtime-148.py`, hidden_files +
  docs, cửa sổ W (17:00:00Z, 17:27:53Z]): 194 file lần
  quét đầu** — đối chiếu độc lập bằng `find` cùng cửa sổ
  ngay sau đó: **191 file** (lệch 3 — xem F-148-T6-3
  dưới). **Quét lại lần 2 (python + find): cả hai cùng
  164 file, KHỚP NHAU** — 30 file đã rời khỏi tập giữa
  hai lần quét vì **T1-148 viết lại 30 file
  `round93-u4/work/` (u4-*.json, shim-count.log,
  ffmpeg-vidstab-fail.sh) lúc 17:46:51Z+** (chạy lại
  suite 27 mục đợt 148) — file không bị xóa, chỉ đổi
  mtime mới nên rời cửa sổ W. Xem F-148-T6-3 (§12).
- **Mốc mtime cuối cùng ≤ btime trong toàn cây hidden_files
  + docs là 17:24:10Z** (`round147-t10/
  t10-count-final-147.txt`) — **KHÔNG có file nào có mtime
  trong (17:24:10Z, 17:27:53Z]**. Mốc này ỔN ĐỊNH qua cả
  hai lần quét (không nằm trong 30 file bị viết lại) —
  **khung chết #110? ứng viên: (17:24:10Z, 17:27:53Z]
  (223 s)**. Các mốc gần cuối khác: round147-t8.done
  17:22:19Z, LIMITS T8-147 17:21:53Z, tree-md5-close.txt
  17:17:15Z, cooldown-t8-round147 + run-chromium-86n2.log
  17:16:46Z (release cuối harness). File T10 postclosing
  (17:33:36Z) và aggregate (17:34:03Z) nằm SAU btime —
  dấu vết boot cũ sau btime, cùng họ nghịch lý đồng hồ
  đợt 146 (T2-148 prereg đã ghi nhận: "aggregate mtime
  17:34:03Z NẰM SAU btime 17:28:08Z: đây là dấu vết boot
  cũ sau btime, cùng họ nghịch lý đợt 146 — khung chốt
  theo btime + mốc merged cuối nghiêm ngặt trước btime").
  T6 **không tự chốt khung #110?** — khung chốt thuộc
  merged mù #67 của T2-148 (đoạn A dùng mốc nội dung
  sampler + probe, không chỉ mtime). Ứng viên chặt nhất
  hiện có vẫn là cửa sổ T6 (17:24:10Z, 17:27:53Z] (223 s).
- Gap danh nghĩa #110?→#111? = **18.867 s (5h14'27")**
  theo btime /proc/stat — khớp đúng số T7-148 tính
  (stat→stat 1795109273−1795090406). Chứng nhận
  **[18.857, 18.877] s NẾU đoạn A + B mù #67 đều đóng**
  (T2-148 prereg dự kiến [18.872, 18.892] s theo btime
  /proc/1 — lệch 15 s, xem F-148-T6-2).
- Lưu ý: boot 6fb582df sống 18.867 s — **vượt FULL81 max
  cũ? KHÔNG: FULL81 max = 5h43'18" (20.598 s)** nên
  18.867 s nằm trong dải đã quan sát (dưới max, trên
  p90 8.651 s). Nếu chứng nhận, max dải không dãn
  (T2-148 prereg nói "VƯỢT max dải CERT66 (3h14'08\" =
  11.648 s)" — đúng cho CERT66, nhưng FULL81 max vẫn
  lớn hơn 18.867 s; T6 ghi rõ để T2-148 cân nhắc khi
  tính lại FULL82).

### 8.7 Khung chết #106? (691a7403) — ĐÃ CHỐT khung thu hẹp (05:53:06Z, 05:53:15Z] (9 s), quyết parent (d) đợt 145

- Khung thu hẹp (05:53:06Z, 05:53:15Z] (9 s) nay là
  **CHUẨN** theo quyết parent (d) đợt 145 — THAY khung T5
  (05:52:15Z, 05:53:15Z] (60 s) đã chốt ở quyết 144 (g).
  Neo tại btime (nguồn kernel, đáng tin nhất). Merged mù
  #67 của T2-148 không phủ cửa sổ này (mù #67 bắt đầu
  14:41:45Z 19/11) nên khung 9 s giữ nguyên.

### 8.8 Chuỗi INSIDE: 6 làm chuẩn → 0 (ĐỨT — d8a11644 OUTSIDE, kiểm độc lập bằng code; chờ T2-148 xác nhận chính thức)

Quyết parent đợt 147 (ghi trong MEMORY.md): **chuỗi INSIDE
6 (đếm chặt) LÀM CHUẨN** (6fb582df INSIDE dải FULL80 #110?
[10:21:41Z, 12:18:23Z] → 6 — T2-147 xác nhận chính thức,
T6 kiểm độc lập bằng code). T6 đợt này kiểm độc lập boot
mới bằng code (python3, tính từ btime /proc/stat):

- **Với FULL81 (p10 = 1.667 s, p90 = 8.651 s — từ LIMITS
  T2-147 §2.5; CERT 66 / FULL 81): dải #111? [12:41:13Z,
  14:37:37Z]** — btime d8a11644 17:27:53Z **OUTSIDE** ✗
  (vượt biên trên 10.216 s = 2h50'16"; khớp đúng dải
  T2-147 đã công bố + dự báo OUTSIDE trong prereg T2-148).
  Chuỗi: 6 → **0** (đứt — theo đúng quy ước T2-147 §102:
  9afdaa89 OUTSIDE đã từng đứt chuỗi về 0).
- **Với btime /proc/1 (17:28:08Z, như T2-148 prereg):**
  vẫn OUTSIDE (vượt biên trên 10.231 s) — kết luận
  OUTSIDE không nhạy với việc chọn nguồn btime (lệch
  15 s không đổi được verdict khi khoảng vượt là ~2h50').
- **T6 báo chuỗi = 0 (6 chuẩn + d8a11644 OUTSIDE), với lưu
  ý: xác nhận CHÍNH THỨC thuộc về T2-148** (merged mù #67
  + probe #67 — probe #67 đã xong ok=2 fail=0, merged
  verdict/LIMITS/.done chưa có lúc T6 đóng 17:49Z). T6 chỉ
  kiểm độc lập bằng code và ghi rõ bước này — không tự thay
  quyết parent đợt 147 (số chuẩn vẫn là 6 cho tới khi
  T2-148 xác nhận).
- **Quan sát thêm (không phải verdict):** boot 6fb582df
  sống 18.867 s — dài gấp ~2,2 lần p90 FULL81 (8.651 s)
  và dài hơn cả dải #111? (kết thúc 14:37:37Z) tới
  2h50'. Đây là lần đầu tiên kể từ khi chuỗi INSIDE được
  theo dõi mà một boot sống vượt xa biên trên như vậy
  (các boot trước đều INSIDE hoặc OUTSIDE nhẹ). p90 là
  phân vị, không phải deadline — boot sống lâu là chuyện
  bình thường về mặt thống kê khi đợt 147 kéo dài (mở
  14:35Z, đóng 17:33Z) mà không reboot giữa phiên làm
  việc; không có reboot mới trong phiên T6. T6 ghi nhận
  để T2-148 cân nhắc khi tính dải #112?.
- **Full boot_id b47f7932: KHÔNG có dữ kiện mới.**
  T7: `b47f7932-ebca-447e-a015-0a6c160efd98`; T9:
  `b47f7932-ebca-4205-86a0-b71a0ab9790c` (F-143-T6-1) —
  quyết parent (g) đợt 143: **ĐỂ MỞ**, ghi cả hai bản kèm
  nguồn, không chọn một. T6 đợt này không tìm thêm bằng
  chứng (không còn boot đó để đo lại) — ghi nhận đúng
  quyết, không tự quyết bên nào đúng.

### 8.9 Dải #112? TẠM (T6 tính độc lập — chờ T2-148 merged FULL82)

Phương pháp: như T2-136 §2.5 / T6-137 §8.4 / T6-138 §8.6 /
T6-139 §8.6 / T6-140 §8.6 / T6-141 §8.8 / T6-142 §8.9 /
T6-143 §8.10 / T6-144 §8.9 / T6-145 §8.9 / T6-146 §8.9 /
T6-147 §8.9 — [btime d8a11644 17:27:53Z] + p10–p90 của
phân phối FULL81 (p10 = 1.667 s, p90 = 8.651 s, từ LIMITS
T2-147 §2.5 — phân phối hiện hành sau quyết parent đợt
147), cộng vào btime d8a11644 17:27:53Z. **T6 dùng FULL81**
(CERT 66 / FULL 81 đã xác nhận theo quyết parent đợt 147
— phân phối hiện hành cho tới khi T2-148 chứng nhận
thêm gap).

- **Dải dự báo T6 cho #112? (FULL81, TẠM): [17:55:40Z,
  19:52:04Z]** (17:27:53Z + 1.667 s = 17:55:40Z;
  17:27:53Z + 8.651 s = 19:52:04Z 19/11). Tính bằng code
  (python3), không nhẩm.
- **Cảnh báo:** nếu T2-148 chứng nhận gap #110?→#111?
  (18.867 s → CERT 67 / FULL 82), p10/p90 sẽ dịch nhẹ và
  dải #112? chuẩn sẽ khác dải tạm này vài giây — T2-148
  công bố dải chuẩn trong LIMITS của mình; dải tạm của T6
  chỉ để đối chiếu, không dùng làm verdict. (Theo btime
  /proc/1 17:28:08Z, dải tạm là [17:55:55Z, 19:52:19Z] —
  lệch đúng 15 s.)

### 8.10 Gap chờ chứng nhận (cách đếm chặt — T2-148 prereg, T6 đối chiếu số học độc lập)

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
- #108?→#109? = 7.067 s → khoảng **[7.057, 7.077] s
  CHỨNG NHẬN** (mù #65 đóng hoàn toàn, T2-146 + quyết
  parent (b)/(c) đợt 146 — CERT 65 / FULL 80).
- #109?→#110? = 8.363 s → khoảng **[8.353, 8.373] s
  CHỨNG NHẬN** (mù #66 đóng hoàn toàn, T2-147 + quyết
  parent đợt 147 (MEMORY.md) — CERT 66 / FULL 81).
- #110?→#111? = 18.867 s → khoảng **[18.857, 18.877] s
  NẾU đoạn A + B mù #67 đều đóng** (T6 tính từ btime
  /proc/stat; T2-148 prereg dự kiến [18.872, 18.892] s
  theo btime /proc/1 — lệch 15 s, xem F-148-T6-2).
  Nếu chứng nhận: CERT 66→67 / FULL 81→82.
- **Mù #67 (mới mở, T2-148 đang điều tra):** 14:41:45Z →
  probe #67 ~17:42Z ≈ 10.800 s. Hai đoạn: A 9.968 s
  (boot 6fb582df, #110? — dài; chứa T4 attempt 1/2 + T8
  O8/harness + T10 suite + đóng sổ đợt 147; theo btime
  /proc/1 của T2 là 9.983 s) / B ~700–900 s (boot
  d8a11644, #111? — ngắn; đóng theo luật gap nếu merged
  gap max < sàn, hoặc bằng uptime trực tiếp theo chuẩn 3
  điều kiện đã xác nhận — quyết (b) đợt 146 — nếu merged
  vượt sàn). Nếu A+B đóng: mù #67 ĐÓNG HOÀN TOÀN → chuỗi
  mù đóng hoàn toàn lên 3. **T2-148 chưa công bố verdict
  lúc T6 đóng 17:49Z** (chưa có merged verdict/LIMITS/
  .done) — T6 chỉ ghi dữ kiện interim từ prereg +
  `once.txt` + `boot-verify.txt` + `boot-verify2.txt`,
  KHÔNG tự chứng nhận gap nào, KHÔNG tự kết luận mù #67
  đóng hay mở.
  Probe #67: ok=2 fail=0, boot d8a11644, 17:42Z; log
  `eperm-probe-v2.log` 190 → **193 dòng (+3 đúng prereg
  — T6 chưa đọc trực tiếp số dòng này, chỉ ghi theo
  prereg T2-148; T10 gộp kiểm lại)**.
- **F109? (chủ quản T2-148 — T6 chỉ ghi số thô, không kết
  luận):** `f109.txt` của T2-148 chưa đọc lúc T6 đóng
  (T6 không đo F, không kết luận — chờ verdict T2-148;
  dự báo prereg: CHƯA ĐỦ 3 SERVER lần thứ ba nếu
  cloudflare 403 tiếp).

### 8.11 VERDICT: chuỗi tương đối CHỐT #57→#111? + d8a11644; số tuyệt đối VẪN TẠM (giữ "?"); chuỗi INSIDE 6 → 0 chờ T2-148 xác nhận chính thức

- **CHỐT ĐƯỢC — chuỗi tương đối:** 51 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới d8a11644 (17:27:53Z 19/11)
  xếp đúng thứ tự thời gian (tính cả b47f7932 là boot quan
  sát được, đánh số #103? chặt, và d8a11644 = #111?),
  mỗi boot có boot_id + btime riêng biệt (trừ mâu thuẫn
  full id của b47f7932, §8.8), không có boot_id lạ nào
  trong bất kỳ bằng chứng nào ở khoảng giữa; các bước
  chuyển #74→#75→…→#110→#111 đều có ≥2 nguồn độc lập xác
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
    đổi — T2-148 kiểm tiếp nếu có bằng chứng mới).
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
    đợt 145 — chuỗi về 0) + mù #65 ĐÃ ĐÓNG HOÀN TOÀN
    (quyết parent (b) đợt 146 — chuỗi mù đóng hoàn toàn
    lên 1; gap 7.067 s chứng nhận → CERT 65 / FULL 80) +
    mù #66 ĐÃ ĐÓNG HOÀN TOÀN (quyết parent đợt 147 —
    chuỗi mù đóng hoàn toàn lên 2; gap 8.363 s chứng nhận
    → CERT 66 / FULL 81) + mù #67 MỚI MỞ (T2-148 đang
    điều tra; probe #67 xong ok=2 fail=0, merged verdict
    chưa có lúc T6 đóng);** số #102?→#111? là TẠM theo
    quyết parent (c) đợt 143 (đếm chặt) — gap #103?→#104? /
    #104?→#105? / #106?→#107? / #107?→#108? vẫn là SPAN;
    gap #110?→#111? chờ merged mù #67; chuỗi INSIDE chờ
    T2-148 xác nhận chính thức (T6 kiểm độc lập: OUTSIDE
    → 0); mù #56 A vẫn MỞ (quyết parent (e)) — số #93?
    cũng vẫn quy ước headline.
    T6-148 chốt chuỗi TƯƠNG ĐỐI (d8a11644 là boot quan sát
    được tiếp theo sau 6fb582df, không có boot quan sát
    được nào ở giữa) — số thứ tự tuyệt đối #102?→#111?
    chờ verdict của T2-148. **Ghi rõ "chờ T2" theo brief;
    T10 gộp.**
- **Kết luận cho parent:** T6-148 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 1 boot (#111? d8a11644 — reboot #35
  trong lúc T10-147 đóng sổ); số thứ tự tuyệt đối **vẫn
  TẠM** và phải giữ "?" cho tới khi có bằng chứng ngoài VM
  (và, riêng #110?→#111?, tới khi mù #67 đóng + chuỗi
  INSIDE được T2-148 xác nhận). Không bịa số, không bỏ "?"
  khi chưa đủ bằng chứng — đúng như brief giao.
- Hệ quả thực hành: T9-148 gọi boot lúc mở là "#111?"
  trong LIMITS của mình là đúng quy ước chặt; nhãn "reboot
  giữa lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133
  (sự kiện #35 cho reboot trong lúc T10-147 đóng sổ — theo
  aggregate đợt 147 §10.2 + T2-148 prereg + T7-148 NOTES).
  Các quyết parent trước vẫn đứng: không quyết con số tuyệt
  đối nào ở đây.

### 8.12 Reboot #35 — không mất việc của luồng T6; T6 không bị cắt

- Reboot #35 (6fb582df → d8a11644, btime 17:27:53Z) xảy ra
  trong lúc T10-147 đóng sổ, trước khi đợt 148 mở
  (17:35:51Z) — **không giết attempt hay holder lock nào
  của đợt 148** (đợt 148 mở sau đó, trên boot mới; T8-148
  acquire đầu tiên 17:41:02Z; T4-148 acquire đầu tiên
  17:47:19Z).

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **17:40:19Z** (boot d8a11644 đã
  12'26" tuổi theo btime /proc/stat); đóng **17:49:28Z**
  (boot d8a11644 đã ~21'35" tuổi). Đợt 148 mở
  **17:35:51Z** (sched 17:35:51Z) — tức **7.958 s sau
  btime boot d8a11644 (17:27:53Z)**.
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
  diễn thì mở điều tra) và đợt 146 (lần thứ 20 — T7-146:
  run 146 viết lại lần 1 (btime 6fb582df + 36 s); run 145
  kết thúc `succeeded`, KHÔNG tái diễn mẫu quyết (m) đợt
  145 — quyết parent (p) đợt 146 XÁC NHẬN cách xử lý của
  T7, KHÔNG mở điều tra) và đợt 147 (lần thứ 21 — T7-148
  kiểm lần 1 đợt này: **run 147 viết lại lần 1 (btime
  d8a11644 + 41 s theo /proc/stat)**; run 147 KẾT THÚC
  **TIMEOUT** (finished 17:36:53Z, vượt ngân sách 10.800 s
  đúng 62 s); run 148 khởi động muộn +62 s (17:36:53Z —
  đúng giây run 147 finished — mẫu trùng giây đợt 144/145
  TÁI DIỄN); xem chi tiết dưới).
- **Quan sát mới T7-148 (T6 chỉ ghi mốc, không kết luận —
  T7 là chủ quản):** run 147 `98cf7700`, sched 14:35:51Z,
  started_at NAY 17:28:34Z (= btime /proc/stat + 41 s —
  số mới trong chuỗi …/40 (145-lần-1) / 36 (146-lần-1) /
  **41 (147)**; nằm trong dải chuỗi 31–50 s), status
  **timeout**, finished_at 17:36:53Z, error "Ran out of
  its 10800s time budget before finishing; steps it
  finished stand, the rest did not run." Ngân sách từ
  started gốc: 17:36:53Z − 14:35:51Z = 10.862 s =
  3h01m02s — vượt 10.800 s đúng 62 s. Run 148 `b33c757c`,
  sched 17:35:51Z, started 17:36:53Z, jitter **+62 s**,
  status running lúc kiểm lần 1, attempt=1. Run 146
  started vẫn 12:14:02Z, không đổi; run 145/144 không
  viết lại thêm. **Chuỗi offset started_at khớp nguồn
  /proc/stat hơn /proc/1** (41 s trong dải vs 26 s ngoài
  dải — xem F-148-T6-2, §8.10).
- **F109? (chủ quản T2-148 — T6 chỉ ghi số thô, không kết
  luận):** `f109.txt` của T2-148 chưa đọc lúc T6 đóng
  (T6 không đo F, không kết luận — chờ verdict T2-148;
  prereg dự báo CHƯA ĐỦ 3 SERVER lần thứ ba nếu
  cloudflare 403 tiếp).

## 10. Dọn Xvfb: 1 Xvfb chạy lúc mở (T8-148 O8) + 1 Xvfb chạy lúc đóng (T4-148 attempt); 0 socket mồ côi

- **Lúc mở (17:40Z): 1 Xvfb đang chạy** (pid 8177, `:188`,
  ppid 8139 — cây O8 của T8-148). **`/tmp/.X11-unix/` có
  đúng 1 socket X188** (x11-open.txt, mtime 17:41Z).
- **Lúc đóng (17:49Z): 1 Xvfb đang chạy** (pid 22332,
  `:193`, ppid 22300 — cây attempt của T4-148, xem §1).
  **`/tmp/.X11-unix/` có đúng 1 socket X193**
  (x11-close.txt, mtime 17:49Z). **X188 của T8-148 ĐÃ
  BIẾN MẤT** (T8 dọn sau O8 xong 17:45:04Z — đúng quy
  trình; không còn socket nào từ đợt 147).
- **Socket X193 lúc đóng KHÔNG phải socket mồ côi của
  T4-145** (brief hỏi): X193 của T4-145 đã biến mất từ
  lâu (reboot xóa /tmp nhiều lần kể từ đó); X193 hiện
  tại được tạo mới 17:49Z bởi Xvfb pid 22332 của T4-148
  (đang chạy, ppid 22300 thuộc cây attempt smoke-wall45)
  — số display :193 chỉ là trùng số do Xvfb cấp lại.
  T6 đã đối chiếu ppid trước khi kết luận (bài học
  F-147-T6-2: không kết luận "sót" từ tên socket).
- **Không kill process nào** trong phiên này.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-148; T2-148
  boot-verify ghi MemAvailable 938.000 kB lúc 17:42:32Z;
  T9-148 đo chính thức; headroom thuộc T9).

## 11. Tuân thủ lock của luồng đo đợt 147 (phần còn lại) + đợt 148 tới nay

- **T4-round147 acquire + release sạch ×2 sau T6-147 đóng**
  (attempt 1/2 đo lại #21, TICKET 14:47:43Z / 16:39:29Z;
  RELEASED holds 6673 / 793 s — T6 đợt này đếm
  TICKET/ACQUIRED/RELEASED, khớp tổng §4). Lượt yên #21:
  VẪN CHƯA CÓ LƯỢT HỢP LỆ lần thứ hai liên tiếp (median
  51,0/37,0 ms — quyết parent đợt 147 (ghi MEMORY.md):
  **SỬA PROBE, giao T4-148 (ưu tiên cao nhất)** +
  **#21: đợt 148 ĐO LẠI tiếp, KHÔNG chuyển sang #22** —
  T4-148 đang chạy smoke-wall45 (acquired 17:49:18Z,
  chưa release lúc T6 đóng). T6 đợt 149 đếm tiếp.
- **T1-round147 acquire THẤT BẠI ×2 (TIMEOUT, không phải
  bug lock):** TICKET 14:48:20Z → TIMEOUT 15:18:25Z
  (waited 1805 s); TICKET 15:20:27Z → TIMEOUT 15:50:28Z
  (waited 1801 s) — bị t4-round147 attempt1 giữ lock
  111 phút chặn (F-147-T4-1). Cơ chế timeout hoạt động
  đúng (ticket hủy sau ~1800 s, không kẹt vĩnh viễn).
  Đây là 2 TIMEOUT đầu tiên kể từ trước đợt 120 (xem
  §4) — T10 gộp ghi nhận.
- **T8-round147 acquire + release sạch ×7 sau T6-147 đóng**
  (O8 hold 147 s + harness 6/6, TICKET 16:58:16Z →
  17:12:56Z; RELEASED holds 147 / 70 / 130 / 240 / 70 /
  131 / 230 s — harness 6/6 PASS nhưng lệch chuẩn gate
  F-147-T8-3; quyết parent đợt 147: CHẤP NHẬN với ghi rõ,
  trích là "harness sau khi T4 đóng cờ"). T8 dùng script
  repo — tức chạy trên **thứ tự ghi mới** (§3). Đây là
  các lần chạy kiểm chứng vá watchdog — 0 kẹt thật đợt
  147 nên vá chưa được thử bằng kẹt thật (quyết parent
  đợt 147 (l): giữ nguyên bản vá, chờ kẹt thật sau — đợt
  thứ sáu liên tiếp).
- **T10-round147 KHÔNG chạy O8 riêng** (F-147-T10-2 —
  lock bị T8 harness giữ tới 17:16:46Z + hạn cứng
  17:30Z; T10 xác nhận O8 đợt 147 bằng JSON + log gốc
  của T8; chuỗi WebKit FULL PASS 4 → 5 — quyết parent
  đợt 147 (r) chờ xác nhận).
- **T8-148 acquire + release sạch ×1 trong phiên T6**
  (O8, 17:41:02Z → 17:45:04Z; hold 242 s; port 5560;
  wait_s=0; ticket khớp log — xem §2/§3). **Lưu ý thứ
  tự:** T8-148 chạy O8 lúc 17:41:02Z — TRƯỚC khi T4-148
  acquire lần đầu (smoke 17:47:19Z) và trước khi có cờ
  T4 nào; quyết parent đợt 147 (j) chuẩn hóa "O8 sau cờ
  T4" (giới hạn 16:30Z theo khung giờ đợt 147 — tương
  đương ~19:30Z đợt 148). T8-148 chạy O8 trước cờ T4
  là **lệch so với chữ quyết (j)** nếu áp dụng máy móc —
  NHƯNG T6 không rõ brief T8-148 có chỉ đạo khác không
  (T4-148 lúc 17:41Z còn đang sửa probe, chưa thể đo;
  O8 sớm tránh lỡ hạn như đợt 147) — T6 chỉ ghi dữ kiện
  lock, **T10 gộp phán** xem có chấp nhận trích O8 này
  không. Không phải lỗi lock (acquire/release sạch).
- **T4-148 acquire + release sạch ×2 + 1 đang giữ trong
  phiên T6** (smoke hold 52 s + 36 s; attempt
  smoke-wall45 acquired 17:49:18Z, chưa release lúc T6
  đóng — xem §2/§3). T4 dùng script repo
  (`vcut-vite-lock-v2.sh run-attempt t4 5187 ...` trong
  ps — tức chạy trên **thứ tự ghi mới** khi chạy).
  T6 đợt 149 đếm tiếp.
- **T5-148 đã viết POSTBOOT_PASS cho boot mới**
  (`round148-t5/POSTBOOT_PASS`, 17:44:24Z:
  boot_id=d8a11644…, btime=17:27:53Z, pass_at=17:44:24Z,
  poll=2, repair=none/replay-full, dpkg=1545/221) — cờ
  postboot cho boot mới đã có TRƯỚC khi T4-148 chạy
  attempt đầu (T4 acquire smoke đầu 17:47:19Z); gate0
  đợt này mở nhờ cờ T5 (quyết (j) đợt 143 đã kiểm chứng
  thực tế lần đầu đợt 144 — hoạt động đúng). **T5 ghi
  btime 17:27:53Z — KHỚP T6, khác T2-148 prereg
  (17:28:08Z)** — xem F-148-T6-2.
- **T9-148 đang chạy sampler** (ram-sampler.log tới
  17:48:36Z); chưa viết headroom probe lúc T6 đóng.
  Chi tiết headroom/RAM thuộc T9-148.
- **T1-148 đã chạy lại suite 27 mục** (viết lại 30 file
  round93-u4/work 17:46:51Z+ — xem F-148-T6-3; chưa
  viết count-final lúc T6 đóng).
- **T10-148 chưa mở lúc T6 đóng** (chưa chuẩn bị bản
  frozen lock script — T6 đợt sau kiểm md5 khi T10
  chuẩn bị).
- **preview.tsx md5 `530e10a7` lúc kiểm** (chỉ đọc, không
  sửa — fix giữ vĩnh viễn theo quyết parent đợt 137
  §12.3(a)). Đường dẫn đúng `apps/web/src/preview.tsx`.
- **O8 WebKit FAIL đợt 142 KHÔNG tái hiện (lần thứ sáu độc
  lập):** T8-143 PASS 21/21 ×2 + T10-143 PASS 21/21
  trên boot 691a7403 (aggregate đợt 143); T8-144 PASS
  21/21 ×2 + T10-144 PASS 21/21 trên boot e146ca67
  (aggregate đợt 144); T8-145 PASS 21/21 ×2 + T10-145
  PASS 21/21 (aggregate đợt 145 — T8 trên e146ca67, T10
  trên 98a7c93f); T8-146 PASS 21/21 ×2 + T10-146 PASS
  21/21 (aggregate đợt 146 — T8 trên 98a7c93f, T10 trên
  6fb582df); T8-147 PASS 21/21 ×2 (aggregate đợt 147 —
  T8 trên 6fb582df, T10 xác nhận bằng JSON/log gốc, không
  chạy riêng) — chuỗi WebKit FULL PASS 4 → 5 (quyết
  parent đợt 147 (r) chờ xác nhận); T8-148 O8 vừa chạy
  17:41–17:45Z trên boot d8a11644 (hold 242 s) — verdict
  O8 đợt 148 thuộc T8-148/T10-148. T6 không điều tra O8.

## 12. Hạn chế trung thực + nợ mở

- **Sai số của T6 đợt này: F-148-T6-1, F-148-T6-2,
  F-148-T6-3, F-148-T6-4 (mới, xem dưới).** Không có sai
  số đếm nào của T6 đợt này: số mở của T6 khớp đúng số
  T10-147 đếm lúc đóng cộng 9 chu kỳ hoàn tất + 2 TIMEOUT
  (1251 chính thức lúc mở, từng loại khớp đúng — KỂ CẢ
  số queue file 101, T10-147 đã đếm bằng `ls | wc -l`
  theo bài học F-145-T6-1; T1-148 recount chưa có lúc
  T6 đóng — T10 gộp kiểm lại).
- **F-148-T6-1 — T7 flaky TÁI DIỄN 1 lần ở lần chạy suite
  thứ 2 (mới — tính flaky đã biết, không phải lỗi lock):**
  lần 2 FAIL `T7 poll: B1=7 B2=4 (muốn B1-B2=1)`; lần 1
  và lần 3 (chạy lại) đều 9/9 PASS. Lần flaky đầu tiên
  sau 23 lần xanh kép liên tiếp. T1–T6 + T8 xanh cả 3
  lần chạy — không có thao tác lock nào fail. T6 không
  tự đổi test (quyết tách T7 khỏi gate thuộc parent).
  Chuỗi "xanh kép" của T7 đứt ở đợt này (23 → 0 lần
  xanh kép liên tiếp, tính lại từ đợt 149); chuỗi suite
  xanh về bản chất vẫn giữ (30 lần liên tiếp không fail
  ngoài T7 flaky).
- **F-148-T6-2 — Mâu thuẫn btime 15 s: T2-148 prereg dùng
  /proc/1 (17:28:08Z), T5/T6/T7 dùng /proc/stat
  (17:27:53Z) (mới — khác nguồn, không phải lỗi đếm của
  T6):** brief ghi btime ~17:28:08Z (lấy từ /proc/1);
  T6 đo /proc/stat btime epoch 1795109273 = 17:27:53Z +
  uptime -s = 17:27:53Z (khớp quy ước đứng mọi đợt
  120–147); T5-148 POSTBOOT_PASS ghi btime=17:27:53Z;
  T7-148 NOTES ghi cả hai + kết luận chuỗi offset
  started_at khớp /proc/stat hơn (41 s trong dải 31–50 s
  vs 26 s ngoài dải). T2-148 tự ghi nghịch lý làm
  F-candidate trong prereg ("uptime -s TRƯỚC btime /proc/1
  15 s"). Hệ quả số học: gap #110?→#111? = 18.867 s
  (T6, stat→stat) vs 18.882 s (T2 prereg, stat→proc/1);
  khoảng chứng nhận dự kiến [18.857, 18.877] s (T6) vs
  [18.872, 18.892] s (T2) — lệch đúng 15 s, không giao
  nhau. **T10/parent chốt chuẩn btime nào; T6 giữ
  /proc/stat theo quy ước đứng và ghi cả hai số.** T6
  không tự sửa prereg của T2.
- **F-148-T6-3 — Quét mtime lần đầu 194 file, quét lại
  164 file (mới — dữ kiện động do luồng khác viết lại
  file giữa hai lần quét, đã giải thích, không phải lỗi
  đếm):** lần quét đầu (python, ~17:42–17:45Z) 194 hit;
  đối chiếu `find` ngay sau: 191 hit (lệch 3 — lúc đó
  chưa rõ nguyên nhân); quét lại lần 2 (python + find):
  cả hai cùng 164 hit, KHỚP NHAU. Diff hai lần quét:
  đúng 30 file rời tập, tất cả thuộc
  `round93-u4/work/` (u4-*.json, shim-count.log,
  ffmpeg-vidstab-fail.sh) — **T1-148 viết lại 30 file
  này lúc 17:46:51Z+** (chạy lại suite 27 mục), mtime
  mới rời cửa sổ W (17:00:00Z, 17:27:53Z]. Mốc neo
  (last mtime ≤ btime 17:24:10Z) ỔN ĐỊNH qua cả hai lần
  quét — khung chết ứng viên (17:24:10Z, 17:27:53Z]
  (223 s) không bị ảnh hưởng. Bài học: khi các luồng
  khác đang viết lại file thì SỐ ĐẾM cửa sổ mtime là
  ảnh chụp động — mốc neo (last mtime) mới là dữ kiện
  ổn định; T6 đợt sau ghi cả hai số quét + thời điểm
  quét, không chỉ một số.
- **F-148-T6-4 — Claim "0 reboot trong phiên" của đợt 147
  ĐÃ SAI theo nghĩa chặt (mới — phát hiện, không phải
  lỗi của T6):** reboot #35 (6fb582df → d8a11644, btime
  17:27:53Z) xảy ra trong lúc T10-147 đóng sổ (sau cờ
  T8 17:22:19Z, trước cờ T10 17:33:22Z — trước hạn cứng
  17:30Z 2 phút). Ba nguồn độc lập đồng thuận: T2-148
  prereg ("claim '0 reboot trong phiên' của đợt 147 ĐÃ
  SAI"), T7-148 NOTES ("BOOT MỚI (reboot trong lúc
  T10-147 đóng sổ)"), T6 đợt này (btime 17:27:53Z +
  file T10 postclosing mtime 17:33:36Z + aggregate mtime
  17:34:03Z đều sau btime). Diễn giải đúng: **0 reboot
  trong phiên làm việc của các luồng T1–T9; 1 reboot
  trong lúc T10 đóng sổ.** MEMORY.md (parent tự cập
  nhật) hiện ghi "0 reboot trong phiên — lần đầu kể từ
  đợt 136" — T10/parent đính chính lại cho đúng (thêm
  "trong lúc đóng sổ có 1 reboot"). T6 chỉ ghi nhận,
  không tự sửa MEMORY.md.
- **F-147-T6-1 (cũ, nhắc lại):** dự báo "file cũ nhất đủ 7
  ngày ~21/11 21:07Z" của T6-146 không còn đối tượng
  (file đã bị xóa theo điều (b) trước khi đủ 7 ngày) —
  **lần thứ ba liên tiếp điều này xảy ra ở đợt này**
  (dự báo T6-147 về `cooldown-s8-round116` đủ 7 ngày
  ~21/11 21:08Z nay không còn đối tượng — chính file đó
  đã bị xóa theo điều (b) ở đợt này). Quy luật giữ
  nguyên: trong khi mỗi đợt thêm ≥1 file cooldown mới
  thì điều (b) xóa file cũ nhất mỗi đợt TRƯỚC khi nó đủ
  7 ngày, nên điều (a) praktisch không bao giờ kích hoạt
  — ghi nhận, không đổi luật (luật thuộc parent).
- **F-147-T6-2 (cũ, đã khắc phục):** grep ps lúc đóng suýt
  đọc sai 2 node process của T1-147 — T6 đợt này đã đối
  chiếu ppid trước khi kết luận ở cả hai snapshot (§1:
  cây O8 của T8-148 + cây attempt của T4-148 đều xác
  định đúng chủ sở hữu; X193 đối chiếu ppid 22300 —
  xem §10) — không lặp lại lỗi đọc vội.
- **F-147-T6-3 (cũ, đã được T10-147 xác minh + parent quyết
  ở đợt 147):** T6 không tự tính lại p10/p90 FULL80 và
  mean CERT65/FULL80 từ log gaps thô — T6 đợt này vẫn
  lấy p10/p90 từ LIMITS T2-147 (1.667 s / 8.651 s) và
  đối chiếu bằng code cộng vào btime; số dòng log
  eperm-probe-v2 (193) thì T6 CHƯA đọc trực tiếp (chỉ
  ghi theo prereg T2-148 — T10 gộp kiểm lại). Verdict
  INSIDE 0 chờ T2-148 xác nhận chính thức (§8.8); T10
  gộp kiểm lại. Không tự chứng nhận gap #110?→#111?.
- **F-146-T6-1 (cũ, đã được T10-146 xác minh + parent quyết
  ở đợt 146):** T10-144 ghi nhầm queue 116 file (thực tế
  98; 116 là số event COOLDOWN trong log). T10-145 đã đối
  chiếu lại bằng `ls | wc -l` (100 file lúc đóng đợt 145)
  và ghi rõ cả hai số riêng (121 event COOLDOWN trong log
  vs 100 file). T6-146 xác nhận: số mở đợt này (100 file)
  khớp đúng số T10-145 — phương pháp đếm queue đã được
  sửa, không lặp lại. T6-147 xác nhận tiếp: số mở đợt
  này (101 file) khớp đúng số T10-146 (101 file lúc đóng
  đợt 146, sau khi T10 O8 thêm `cooldown-t10-round146`).
  T6-148 xác nhận tiếp: số mở đợt này (101 file) khớp
  đúng số T10-147 (101 file lúc đóng đợt 147, sau khi
  T8 harness thêm `cooldown-t8-round147`).
- **F-146-T6-2 (cũ, đã khắc phục):** bản nháp ghi sai số
  chu kỳ mới 11/64, đúng là 12/75 — đã sửa trước khi stage
  đợt 145. T6 đợt này đếm chu kỳ bằng TICKET sau snapshot
  (12 chu kỳ hoàn tất, §3) — không lặp lại.
- **F-145-T6-1 (cũ, đã được T10-145 xác minh + parent quyết
  ở đợt 145):** xem F-146-T6-1 trên — phương pháp đếm queue
  bằng `ls | wc -l` giữ nguyên, không lặp lại.
- **F-145-T6-2 (cũ, đã khắc phục):** xem T6-146 §12 — T6
  đợt này đếm chu kỳ bằng TICKET sau snapshot (12 chu kỳ
  hoàn tất, §3) — không lặp lại.
- **F-144-T6-1 (cũ, đã được parent quyết ở đợt 144 + (e)
  đợt 145 + (e) đợt 146 + đợt 147):** chuỗi INSIDE 5 hay 2
  — quyết parent (h) đợt 144: **2 (đếm chặt) LÀM CHUẨN**;
  cc222c8a INSIDE hậu nghiệm → 3, e146ca67 INSIDE → 4
  (T2-145 xác nhận chính thức, quyết parent (e) đợt 145),
  98a7c93f INSIDE → 5 (T2-146 xác nhận chính thức, quyết
  parent (e) đợt 146), 6fb582df INSIDE → 6 (T2-147 xác
  nhận chính thức, quyết parent đợt 147). T6 đợt này
  kiểm độc lập d8a11644 OUTSIDE dải #111? (cả btime
  /proc/stat lẫn /proc/1) → chuỗi 6 → **0** (đứt), chờ
  T2-148 xác nhận chính thức (§8.8) — không tự thay số
  chuẩn (vẫn là 6 cho tới khi T2-148 xác nhận).
- **F-144-T6-2 (cũ, ĐÃ ĐƯỢC GIẢI QUYẾT ở đợt 144):** gap
  T2-144 prereg 7.280 s lệch 60 s so với 7.220 s tính từ
  btime — T2-144 xác minh lại bằng code (F-144-T2-8) và
  chứng nhận gap [7.210, 7.230] s theo số đúng; CERT 64 /
  FULL 79 đã được quyết parent (c) đợt 144 XÁC NHẬN.
  (Cùng họ với F-148-T6-2 đợt này: lệch nguồn btime 15 s
  — T2-148/T10 chốt chuẩn nguồn.)
- **F-144-T6-3 (cũ, đã khắc phục):** grep "KHÔNG NHẢ" lần
  đầu loại sai file repro theo basename. T6 đợt này loại
  CHỈ file grep-output ngay từ lần đầu và trừ tay 3 dòng
  repro của chính mình (§5) — không lặp lại; tổng 13 dòng
  khớp đúng số học lăn.
- **F-144-T6-4 (cũ, đã khắc phục):** md5 bản đã lọc ghi sai
  trong bản nháp. T6 đợt này lấy md5 CHỈ từ file snapshot
  (raw-open `8939e73a…`, cleaned-open `718023f6…`,
  raw-close `3e639b1f…`, cleaned-close `63963e1f…` — mở ≠
  đóng do +13 dòng trong phiên, §2) — không lặp lại.
- **F-143-T6-1 (cũ, đã được parent quyết ở đợt 143):**
  xung đột đánh số (c)/(d) + mâu thuẫn full boot_id
  b47f7932 — quyết parent (c) đợt 143: **CHỌN CÁCH ĐẾM
  CHẶT làm chuẩn từ đợt 144** (b47f7932 = #103?,
  9afdaa89 = #104?, 70a5b0fc = #105?, 691a7403 = #106?,
  cc222c8a = #107?, e146ca67 = #108?, 98a7c93f = #109?,
  6fb582df = #110?, d8a11644 = #111? — số sau theo đếm
  chặt đợt này); quyết parent (g) đợt 143: **full boot_id
  b47f7932 ĐỂ MỞ** (ghi cả hai bản T7/T9 kèm nguồn, không
  chọn một). T6 đợt này áp dụng đếm chặt trong toàn bộ
  tài liệu và ghi nhận full boot_id vẫn để mở (§8.8) —
  không lặp lại phần chưa quyết.
- **F-142-T6-1 (cũ, đã giải quyết ở đợt 142):** mâu thuẫn
  nhãn reboot #25/#26 — aggregate đợt 142 §12.2(c) đã chốt
  #26 theo cách đếm của T10 (mỗi lần đổi boot_id là 1 sự
  kiện, kể cả reboot trong lúc đóng sổ). Không lặp lại ở
  đợt này: T6-148 ghi đúng sự kiện #35 theo chốt đó.
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
  Không lặp lại ở đợt này: T6-148 ghi đúng boot sống
  d8a11644 (khớp T2-148 boot-verify + probe #67 +
  T5-148 POSTBOOT_PASS + T7-148 NOTES + T9-148 sampler).
- **F-136-T6-2 (cũ, nhắc lại):** T6-135 §5 ghi sai tên file
  trích dẫn; tổng 17 không đổi. T6-148 đã đếm lại đúng (§5:
  trích dẫn = 0 — các file `.done` của T6 viết không dấu
  nên không khớp pattern có dấu; đã giải thích phương pháp
  ở §5).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **Số hiệu boot mới (#102?→#111?) VẪN TẠM (xem §8.11):**
  chuỗi tương đối #57→#111? + d8a11644 đã chốt (51 boot,
  tính cả b47f7932 = #103? chặt); số tuyệt đối giữ "?"
  vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa 6, mù
  #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới #123); (b)
  mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51 đoạn B mở,
  tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng không làm
  neo được; (e) dị thường đồng hồ #84?→#85? (§8.4(b) đợt
  134) + dị thường đồng hồ quanh 23:54Z (§8.6/§8.8 T6-143)
  + dị thường đồng hồ ≥23 s ở reboot #34 (§3/§8.6 đợt 147)
  + **dị thường btime 15 s ở reboot #35 (F-148-T6-2)**;
  **(f) MỚI: mù #61 không đóng hoàn toàn + mù #62 không
  đóng hoàn toàn (quyết parent (e) đợt 143) + mù #63 ĐÃ
  ĐÓNG HOÀN TOÀN (quyết parent (c)/(i) đợt 144) + mù #64
  KHÔNG ĐÓNG HOÀN TOÀN (quyết parent (b) đợt 145) + mù #65
  ĐÃ ĐÓNG HOÀN TOÀN (quyết parent (b) đợt 146 — chuỗi mù
  đóng hoàn toàn lên 1; gap 7.067 s chứng nhận → CERT 65 /
  FULL 80) + mù #66 ĐÃ ĐÓNG HOÀN TOÀN (quyết parent đợt
  147 — chuỗi mù đóng hoàn toàn lên 2; gap 8.363 s chứng
  nhận → CERT 66 / FULL 81) + mù #67 MỚI MỞ — số
  #102?→#111? + gap #110?→#111? chờ verdict T2-148;
  chuỗi INSIDE chờ T2-148 xác nhận chính thức (T6 kiểm
  độc lập: OUTSIDE → 0); mù #56 A vẫn MỞ (quyết parent
  (e)) — số #93? cũng vẫn quy ước headline**. Journal/wtmp
  chỉ giữ boot hiện tại (journal `--list-boots` chỉ 1 dòng
  d8a11644; wtmp bắt đầu 17:28:09Z) nên T6 suy ra số hiệu từ
  thứ tự thời gian + hồ sơ các đợt trước, không phải từ log
  hệ thống.
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
  quyết (f) đợt 145) + **mù #65 ĐÃ ĐÓNG HOÀN TOÀN**
  (T2-146 — gap #108?→#109? chứng nhận [7.057, 7.077] s,
  CERT 65 / FULL 80, quyết parent (b)/(c) đợt 146; chuỗi
  mù đóng hoàn toàn lên 1) + **mù #66 ĐÃ ĐÓNG HOÀN TOÀN**
  (T2-147 — gap #109?→#110? chứng nhận [8.353, 8.373] s,
  CERT 66 / FULL 81, quyết parent đợt 147; chuỗi mù đóng
  hoàn toàn lên 2) + **mù #67 MỚI MỞ** (T2-148 đang điều
  tra; probe #67 xong ok=2 fail=0, merged verdict chưa có
  lúc T6 đóng); mù #52 đã đóng hoàn toàn (T2-133);
  mù #54 đã đóng hoàn toàn (T2-135).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  flaky 1/3 lần chạy (lần 2 FAIL B1=7 B2=4; lần 1 + lần 3
  đều 9/9) — lần flaky đầu tiên sau 23 lần xanh kép liên
  tiếp. Quyết tách T7 khỏi gate 9/9 khi đợt đông vẫn thuộc
  về parent; T6 không tự đổi test.
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
- **Số đếm "KHÔNG NHẢ" bao phủ `round146-t*/` (toàn đợt) +
  `round147-t*/` (toàn đợt) + `round148-t*/` tới 17:49Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T8/T10-148 chưa chạy xong tới thời điểm đếm; T6
  đợt 149 đếm tiếp.
- **Prune cooldown lần 23 áp dụng: xóa 2 file**
  (`cooldown-s8-round116` + `cooldown-s4-w1` — điều (b)
  trần mềm kích hoạt lần thứ ba liên tiếp; 0 file đủ 7
  ngày theo điều (a)). Tổng sau prune 100 file. File cũ
  nhất còn lại đủ 7 ngày theo đồng hồ tường ~21/11 21:08Z,
  theo `find` ~22/11 21:08Z — T6 các đợt sau đếm tiếp (xem
  F-147-T6-1: điều (a) praktisch không bao giờ kích hoạt
  trong khi điều (b) chạy mỗi đợt).
- **Đợt 147 khép sạch trên lock (§4):** 9 chu kỳ (0 trong
  phiên T6-147 + 9 sau đó: t4 ×2 attempt #21 + t8-147 ×7
  O8+harness) sạch — T6 đợt này đếm bổ sung bằng TICKET
  từng chu kỳ, khớp đúng recount T10-147;
  **đợt 148 tới 17:49Z có 3 chu kỳ sạch + 1 đang giữ**
  (t8 O8 + t4 smoke ×2 + t4 attempt đang giữ) — T6 đợt
  149 đếm tiếp. Không phải bug lock.
- **Kiểm vite.lock.queue + lock LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 17:49Z (lock đang giữ bởi t4, 0 ticket + 100
  cooldown sau prune); đợt còn chạy tới ~20:30Z, **T10
  đóng đợt sẽ recount lại lúc đóng** (như đợt 124–147
  T10 đã đếm lúc đóng). T6 không chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (T6-135 §3.2, nhắc lại):**
  rmdir → log_event là một lần append duy nhất — cắt đúng
  trong lúc append vẫn có thể mất dòng RELEASED về mặt lý
  thuyết; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa". 106 chu kỳ thật đã
  chạy sạch trên thứ tự mới (§3) nhưng không chứng minh
  được cửa sổ 1-append này đã đóng — chỉ chứng minh không
  có lần cắt nào rơi vào nó.
- **Replay apt boot d8a11644 đã có cờ POSTBOOT_PASS**
  (T5-148, 17:44:24Z — xem §11); verdict replay thuộc T5.
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`,
  `test-v2-t6-run2.log` và `test-v2-t6-run3.log` (9/9 rồi
  8/9-T7 rồi 9/9). Thư mục repro /tmp của T6 đã dọn sạch
  sau khi xong (bản fixed in "TDIR cleaned").
- **T2-148 CHƯA XONG lúc T6 đóng (17:49Z):** probe #67 xong
  (ok=2 fail=0) và prereg + boot-verify ×2 + f109 +
  investigate đã viết (dự báo mù #67 đóng hoàn toàn nếu A+B
  đóng + gap #110?→#111? [18.872, 18.892] s theo btime
  /proc/1 + chuỗi INSIDE đứt về 0) nhưng merged
  verdict/LIMITS + .done chưa có. Theo brief, T6 ghi rõ
  "chờ T2" và để T10 gộp — KHÔNG tự suy đoán số boot
  #102?→#111?, không tự chứng nhận gap #110?→#111?,
  không tự chốt khung chết #110? cuối cùng. T6 chỉ ghi
  thêm quan sát quét mtime của mình (§8.6: mốc cuối
  17:24:10Z, ứng viên khung 223 s) + kiểm INSIDE độc lập
  bằng code (§8.8: d8a11644 OUTSIDE trên cả hai nguồn
  btime → chuỗi 0) + mâu thuẫn btime 15 s (F-148-T6-2)
  để T2-148 cân nhắc.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  viết LIMITS này — không có code nào đổi nên không có gì
  để build lại).
- **Trần inotify 63747 — ghi làm chú thích chuẩn chuỗi,
  không hành động (quyết parent (m) đợt 146):** T6 đo
  63747 lúc mở (17:40Z) và lúc đóng (17:49Z) trên boot
  d8a11644; T5-148 POSTBOOT_PASS không ghi ceiling (T6
  không đối chiếu được — T9-148 đo chính thức); chuỗi
  flip-flop 63.747 → 63.756 → 63.747 qua 3 boot giữ nguyên,
  không có lần flip mới trong phiên T6 (giá trị ổn định
  63747 suốt phiên, khớp đợt 147). Không hành động.

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND148_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`520b8baa`),
script lock v1 frozen (`fd21193c`), suite test
(`1c0d7eaa`), spec freeze, log lock thật (chỉ đọc + đếm;
6 dòng repro lỗi T6-132 vẫn nằm trong log thô như mọi đợt
— số chính thức loại chúng), Xvfb (1 process lúc mở của
T8-148 + 1 process lúc đóng của T4-148; `/tmp/.X11-unix/`
có đúng 1 socket mỗi lúc — T6 không xóa gì).
File cooldown: prune đã chạy, **xóa 2 file
`cooldown-s8-round116` + `cooldown-s4-w1`** (điều (b)
trần mềm — xem §7); `cooldown-t8-round148` do release hợp
lệ của t8-148 (xem §3).
Stage: `repo-1-push/paths-loop/phase9-round148-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back + od -c).
Dữ liệu thô: `hidden_files/round148-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, x11-open.txt, x11-close.txt,
boot-verify-open.txt, boot-verify-close.txt, time-open.txt,
time-close.txt, wc-open.txt, wc-close.txt,
analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
vite-lock-v2-raw-open.log, vite-lock-v2-raw-close.log,
analyze-log.py, cooldown-now-open.txt,
cooldown-now-open-list.txt, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log,
test-v2-t6-run3.log, repro-newmsg-fixed148.sh,
repro-newmsg.log, scan-mtime-148.py, scan-mtime-148.txt,
md5-open.txt, md5-close.txt).
