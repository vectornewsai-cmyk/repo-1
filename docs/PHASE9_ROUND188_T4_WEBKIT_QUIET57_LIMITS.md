# PHASE9_ROUND188_T4_WEBKIT_QUIET57_LIMITS.md

**Đợt:** 188. **Luồng:** T4 — đo lượt yên WebKit #57 trên 1 boot
+ **#57 KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt, 0 lần cửa yên mở.
  Poller chạy 136 poll thật (23:48:13Z–01:29:51Z) rồi HẾT HẠN
  01:30Z, ngân sách dùng 0/3. NGUYÊN NHÂN DUY NHẤT: BALLOON
  host-side GHIM ~6,44 GB — RAM avail <1024 MB trong 101/136
  poll thật (74%), <500 MB trong 60/136; RAM ≥1024 lần cuối
  #44 (00:20:39Z). Mọi điều kiện khác đều từng xanh cùng lúc
  (gate0=T5 từ poll #33, apt=0, lock trống, load1/load5 <2)
  — chỉ thiếu RAM. CHUỖI LƯỢT YÊN HỢP LỆ KHÔNG TĂNG (giữ 0
  nếu §12.3-187 chưa chấp nhận 0→1; đứt 1→0 nếu đã chấp
  nhận — parent quyết cuối).**
  Poller thoát 01:30:00Z đúng hạn cắt, trong hạn cờ ~02:00Z.
+ **BOOT ĐO: MỘT boot — 257c1eae (#111, btime 23:10:44Z; T0-188
  XÁC NHẬN 9 nguồn tươi; gap #110→#111 = 7.043 s). 0 reboot
  trong phiên đo.**
+ **CỘNG DỒN GIỮ NGUYÊN (48 lượt hợp lệ): P1 215/219, P2 210/210,
  P3-A1 187/219, P3' 179/191 occurrence = 139/142 distinct-seq,
  P7 113/113.** Sổ distinct-seq KHÔNG thăng cấp (giữ as-of-187,
  md5 `ea978f23`); 0 seq mới.
**Ngày:** 25/11/2026 (lượt cron 06:35 +07 25/11 = 23:35:51Z 24/11).
**Boot đo:** 257c1eae (138 poll: 2 test + 136 poller).

## 0. Verdict tổng

- **#57 KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt.** Cửa yên mở 0 lần
  trong 136 poll; poller hết hạn cắt 01:30Z 25/11 (exit theo
  thiết kế — bài học đợt 143). Ngân sách **0/3 (còn 3)**.
- **Chuỗi lượt yên hợp lệ: KHÔNG TĂNG.** #56 CÓ lượt hợp lệ
  attempt1 (chuỗi 0→1 đề xuất — parent quyết cuối ở §12.3-187,
  CHƯA CÓ lúc T4 đóng: aggregate 187 KHÔNG CÓ header §12.3
  theo F-188-T1-3); #57 không có lượt hợp lệ nên chuỗi không
  tăng — **1→0 (ĐỨT) nếu §12.3-187 chấp nhận 0→1, giữ 0 nếu
  chưa** (parent quyết cuối).
- **Chân lượt yên cho chuỗi FULL PASS: KHÔNG CÓ đợt này**
  (FULL PASS đã 1→0 ở đợt 186; đợt 187 chờ §12.3-187).
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 8: KHÔNG THỂ KIỂM (xem §6,
  F-188-T4-4).** 0 cửa sổ attempt (poller hết hạn, 0 attempt);
  0 file analyzer nào được ghi trong phiên (`run-analyzers-188.sh`
  KHÔNG chạy); file skiplatest mặc định mtime vẫn 18:13:20Z
  (đợt 179) — 0 ghi mới. Không tính ĐẠT cũng không tính HỎNG
  — chờ đợt sau có attempt.
- **0 VI PHẠM PHÍA T4 — đề xuất CHUỖI ĐỢT SẠCH 2 → 3 NẾU ĐỢT 187
  SẠCH** (parent quyết cuối; T4-187 đã đề xuất 2→3, §12.3-187
  chưa có). Phía T4 giữ sạch: không khởi động script nặng nào
  trong lúc gate0wait; không probe dpkg nào trong cả phiên;
  0 attempt nên 0 chồng tải trong cửa sổ attempt. B2 KHÔNG CÓ
  DỮ KIỆN MỚI (0 attempt — xem §3/F-188-T4-5); luật B2 KHÔNG
  TÁCH vẫn đứng theo quyết (p) đợt 186.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, mọi poll đều tree=YES, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round188-t4.done` viết lúc đóng
  (~01:37Z), CÓ NỘI DUNG, trong hạn cờ ~02:00Z. **0 reboot
  trong phiên đo; boot lúc viết cờ vẫn #111.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (23:46–23:48Z),
ghi vào `hidden_files/round188-t4/preflight-188.txt` — **PASS
PHẦN TĨNH** (0 sót; xem F-188-T4-1: 2 chuỗi stale bắt được ở
lần grep thứ 2 + sửa trước pre-flight). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–187:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ as-of-187 md5 `ea978f23…` (occ 179/191,
  distinct 139/142, valid_rounds_p3 36, non_dat [260, 364, 498]).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; Playwright-core có mặt (webkit
  object, import tuyệt đối từ `scratch-round63-r4/node_modules/
  playwright-core/index.mjs`); media `stripes-nonperiodic.mp4`
  có mặt (140.828 B); không có `vite.lock`, không có
  `attempt-done-*`.
- **Fixture /tmp mất theo #110 — KHÔNG ẢNH HƯỞNG T4**
  (probe lấy media qua vite từ `public/`; T8-188 rebuild lại).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-25
  01:30:00 UTC` → **1795570200** = 01:30Z (hạn cờ ~02:00Z =
  1795572000, hạn cứng 02:35Z = 1795574100); grep 0 hit cho
  mẫu rộng `round186|22:30|23:00|23:35|#56|cea79500|9161bfd1|
  round184|T4-187a|default=187|WebKit #56|round185|20:00|20:35|
  T4-187|default=186` trong 7 file vận hành (lần grep thứ 2
  sạch — sau khi sửa 2 chuỗi sót ở lần 2: comment "poller dung
  22:30Z" + comment T5FLAG `(uu tien round187-t5, du phong
  round186-t5)` không có slash — xem F-188-T4-1).
- **Copy-forward 187 → 188 (script python thay thế có neo,
  KHÔNG sed global):** deadline `22:30Z 24/11` → `01:30Z
  25/11`; hạn cờ/cứng → `02:00Z`/`02:35Z`; T5FLAG chính
  `round188-t5/` + fallback `round187-t5/`; `T4-187a` →
  `T4-188a`; `default=187` → `default=188`; `WebKit #56` →
  `#57`; glob `round186-*` → `round187-*`.
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 187); **`tree-md5.txt` KHÔNG có trong danh
  sách cleanup — còn nguyên, 530e10a7.**
- **Freeze check (F-164-T4-1):** `round187-t4` còn **0 file
  mtime ≥ 23:35:51Z** (giờ mở đợt 188).
- **GATE0 LÚC MỞ: CHƯA ĐẠT.** round188-t5/ chưa tồn tại
  (T5-188 chưa khởi động); fallback round187-t5/POSTBOOT_PASS
  mtime 21:22:15Z < btime #111 23:10:44Z nên poller đánh
  "cu(mtime-cu)", KHÔNG TÍNH — đúng thiết kế chống cờ sai
  boot. **Check-only postboot chạy tay exit=1 FAIL** (libevent/
  libEGL/libavif/libdw/libevdev thiếu, GST thư mục hệ thống
  không tồn tại, apt thiếu 11 gói — replay hệ thống chưa chạy
  trên boot #111 mới; dpkg.log mới 2 dòng từ 23:11Z, 0 apt/
  dpkg đang chạy lúc 23:47Z; xem `preflight-postboot-188.log`).
  Gate0 đạt từ poll #33 (00:12:20Z) — cờ T5 có 00:11:36Z, và
  check-only cũng PASS độc lập từ poll #33 (repair xong: đủ
  lib/GST/apt — xem postboot-t4-188-gate0wait-33.log trở đi);
  check-only FAIL ở poll #1–#32 (PB=1 tới poll #32).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (23:48:01Z): RAM 1738 MB, load1 5,37/load5 3,02,
  gate0=khong-dat, t5flag=cu(mtime-cu), apt=0, dpkg 2.
  Lần 2 (23:48:08Z): RAM 1722 MB, load1 5,18/load5 3,02,
  gate0=khong-dat, apt=0, dpkg 2. Cửa chưa mở vì gate0 +
  load — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~1.693 MB avail; load1 ~5,88 lúc mở** — cửa
  chỉ mở khi đủ điều kiện.
- **F-176-T4-2: KHÔNG TÁI DIỄN** — sampler không chạy trong
  phiên (0 attempt nên không có sampler nào).
- **F-185-T4-2: KHÔNG TÁI DIỄN** — một luồng T4 duy nhất từ
  đầu đến cuối.

## 1. Poller — 138 poll thật (2 test + 136), 0 lần cửa mở, 0 reboot

- **Test (POLL_TEST=1), 2 poll, boot 257c1eae
  (23:48:01Z, 23:48:08Z):** cả 2 đều gate0=khong-dat,
  load1 5,37/5,18, load5 3,02/3,02, RAM 1738/1722 MB,
  lock=khong, blockers=0, apt=0, dpkg 2 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-188.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 257c1eae (#111), 136 poll
  (23:48:13Z–01:29:51Z), 0 lần cửa mở:** RAM ≥1024:
  35/136 (min 375, max 2092 MB); 500–1023: 41/136;
  **<500: 60/136**; load1<2: 113/136; load5<2: 109/136;
  gate0: **T5 104/136** (cờ có từ poll #33, 00:12:20Z) +
  khong-dat 32/136 (poll #1–#32, trước khi cờ T5 có);
  lock=co 4, khong 132 (T0 giữ, poll #34–#37);
  blockers>0: 4 poll; apt>0: 21 poll; dpkg 2 → 768
  (repair xong trong phiên, TRƯỚC khi gate0 đạt).
- **Giai đoạn 1 — chờ gate0 + repair (poll #1–#32,
  23:48:13–00:11:35Z):** gate0 khong-dat (check-only FAIL,
  apt=1 poll #13–#32 — T5 repair đang chạy); dpkg 2 →
  768 (poll #33 đã 768). Cửa KHÔNG MỞ. Replay #111 ĐÌNH
  TRỆ (T5-188): heal 23:11:21Z viết 2 dòng dpkg rồi dừng;
  44' 0 tiến triển; watcher repair thay thế theo quy tắc (h).
- **Cờ T5 có 00:11:36Z (poll #33 đã nhận T5 PASS, 00:12:20Z)**
  nhưng RAM 612 MB → cửa KHÔNG MỞ (chỉ thiếu RAM).
- **Giai đoạn 2 — T0 giữ lock + O8 (poll #34–#37,
  00:13:06–00:15:22Z):** lock=co (thread=t0-round188,
  pid 287138, port 5560, ticket 1-17955655801) + blockers
  3/5/5/1; load1 1,44/0,89/2,67/4,96 (tải O8). Cửa KHÔNG MỞ.
- **Giai đoạn 3 — load5 hạ (poll #38–#44,
  00:16:08–00:20:39Z):** load1 <2 từ poll #39 (trừ #38:
  3,98 — đuôi O8); load5 2,35 → 2,26 (vẫn >2). Cửa KHÔNG
  MỞ (chỉ thiếu load5). RAM ≥1024 lần cuối #44 (00:20:39Z).
- **Giai đoạn 4 — balloon ghim (poll #45–#136,
  00:21:24–01:29:51Z):** RAM rơi dưới 1024 từ poll #45
  (972 MB — thiếu 52 MB, mọi điều kiện khác xanh) và KHÔNG
  BAO GIỜ trở lại ≥1024 (max sau đó 988 MB ở poll #84);
  balloon đo trực tiếp 6.443.824 kB lặp lại đúng 3 lần
  (00:31/00:41/00:46Z) — xem F-188-T4-2. Load1/load5 <2
  trong phần lớn giai đoạn này; gate0=T5, apt=0, lock trống
  — chỉ thiếu RAM. Cửa KHÔNG MỞ.
- **HẾT HẠN — poll #136 (01:29:51Z):** load1 2,26, load5
  1,21, RAM 444 MB, gate0=T5, lock=khong, apt=0, dpkg 768
  → **poller thoát 01:30:00Z, 0 attempt, exit theo thiết kế
  (bài học đợt 143).** Load1 tăng vọt #135–#136 (3,31/2,26
  lúc 01:29–01:30Z) — trùng lúc luồng khác khởi động
  (Xvfb :199 lúc 01:31Z; xem F-188-T4-6) — không ảnh hưởng
  verdict (RAM đã <500 từ trước).
- **0 reboot trong phiên đo.** Poller thoát 01:30:00Z sau
  khi tuyên hết hạn (không chạm hạn cờ ~02:00Z).
- **Phân rã 138 poll thật:** RAM≥1024: 37/138; RAM 500–1023:
  41/138; RAM<500: **60/138**. load1<2: 113/138; load5<2:
  109/138. **Stats "gan-mo" đếm 8 nhưng 0 lần mở cửa thật**
  — #20–#26 đủ load/RAM nhưng thiếu gate0 + apt=1; #35
  đủ load/RAM nhưng lock=co + blockers=5 (xem F-188-T4-3).
  gate0: T5 104/138 + khong-dat 34/138 (32 poll thật +
  2 test). blockers>0: 4 poll (toàn lúc T0 giữ lock).
  apt>0: 21 poll (toàn lúc T5 repair).

## 2. Attempt — 0 attempt (ngân sách dùng 0/3)

- **Không có attempt nào chạy.** Không có JSON attempt, không
  có analyzer nào chạy, không có classb nào đánh giá, không có
  tickCost nào đo. Ngân sách **0/3 đã dùng (còn 3)**.
- **(c2) attempt: KHÔNG CÓ** — 0 seq; P1/P2/P3-A1/P3'/P7
  không có đóng góp mới; labellag (b) 0 occurrence / 0 event
  theo nghĩa không có attempt để đo (KHÔNG tính là "0 occ
  lần thứ 4 liên tiếp" — F-185-T4-4 KHÔNG ÁP DỤNG đợt này).
- **Không attempt nào bị reboot giết; 3 retry còn lại.**

## 3. B2 spike / đối chiếu sampler T9 + O8 T0

- **KIỂM B2 — KHÔNG CÓ DỮ KIỆN MỚI (0 attempt).** Không đo
  được load1_max trong cửa sổ attempt; phân bổ tự-tải/lạ-tải
  KHÔNG BÁO CÁO được đợt này (xem F-188-T4-5). Dữ kiện cho
  quyết tách B2 VẪN CHỈ 1 đợt (187 — F-187-T4-5); cần ≥3 đợt
  theo quyết (p) đợt 186. Luật B2 KHÔNG TÁCH vẫn đứng.
- **O8 T0 TRÊN BOOT #111 — PASS 3/3 (theo T0-188.done 00:22Z):
  WebKit 21/21 ×2 + Chromium 21/21, 00:13:00–00:15:45Z, sau
  cờ POSTBOOT_PASS #111 1m24s; libevent heal lần 4 (vắng lúc
  mở boot → có sau repair). 0 attempt T4 chồng** (0 attempt
  chạy; poll #34–#37 trong cửa sổ O8 đều ghi lock=co
  thread=t0-round188 + blockers → cửa yên KHÔNG mở).
- **O8 T8 TRÊN BOOT #111 — CHƯA CÓ (T8-188 chưa đóng cờ lúc
  T4 đóng).** Chân O8 T8 + harness thuộc T8-188 báo cáo.
- **Ghi trong cửa sổ attempt: KHÔNG CÓ CỬA SỔ NÀO.**
  `run-analyzers-188.sh` KHÔNG chạy đợt này. File
  `hidden_files/round109-k7/analyze-k7-skiplatest.txt` mtime
  vẫn 2026-11-23 18:13:20Z (đợt 179) — 0 ghi mới.

## 4. Replay/postboot — POSTBOOT_PASS #111 CÓ (repair, poll=1, CÓ caveat)

- **Boot 257c1eae (btime 23:10:44Z, số hiệu #111 — T0-188
  XÁC NHẬN 9 nguồn tươi; gap #110→#111 = 7.043 s, trở lại
  mẫu ~2h).**
- **POSTBOOT_PASS #111 ĐÃ CÓ 00:11:36Z** (boot+1h00m52s;
  repair-sớm-quyết-h, poll=1, **CÓ caveat** — GST symlink →
  debroot ephemeral + tools CHƯA CÀI + dpkg 768; verify độc
  lập exit 0; T5-188). Gate0=T5 từ poll #33 (00:12:20Z).
  Check-only của T4 KHÔNG PASS ở poll #1–#32 (replay đình
  trệ); từ poll #33 gate0 đi qua cờ T5 (PB=0 cả 104 poll).
  **Replay #111: ĐÌNH TRỆ** (heal 23:11:21Z viết 2 dòng dpkg
  rồi dừng; 44' sau 0 tiến triển, dpkg 2 dòng, 0 proc,
  /var/log/apt vắng, cache 0, GST 0; replay host KHÔNG BAO
  GIỜ chạy — watcher repair thay thế theo quy tắc (h);
  T5-188). **#110 VẪN CÓ** (T5-188 — mtime + md5 không đổi).
- **Tổng boot không cờ GIỮ 24** (T5-188); 24 → 25 nếu parent
  chấp nhận #108 ở §12.3-187 (T10-187b đang đóng song song).
- **0 REBOOT trong cửa sổ attempt (0 attempt); 0 REBOOT trong
  phiên đo.** Số hiệu #111 đã xác nhận (T0-188); (m) #111 +
  INSIDE #111 thuộc T2-188 ((m) #111 thô: 1 requeue eid 10875
  tại btime +37,468 s; (m) #110 đối chiếu +43,959 s — T0-188);
  #111 có giết holder không: **KHÔNG** (T6-188 — chuỗi 15);
  POSTBOOT_PASS #111 CÓ — **nhưng KHÔNG có chân lượt yên**
  nên chuỗi FULL PASS không thể lên 1 đợt này (parent quyết
  cuối — còn chờ chân O8 T8 + harness của T8-188).
- **Run 188 TIMEOUT 23:38:46Z** (theo T0-188.done — run 188
  sống tại btime #111; kết cục thuộc T7-188 phán cuối).
  **Run 187 kết cục thuộc T7-187** (T1-188: verify đợt 187
  PASS với đính chính F-188-T1-2; đếm khớp lần thứ 102 liên
  tiếp).
- **Scheduler gap / OUTAGE: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  T7-188 phán cuối.
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-188 báo cáo.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND188_T4_WEBKIT_QUIET57_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round188-t4/`):**
  `poll-wait-t4-188.sh` (deadline 01:30Z 25/11 + cờ T5
  round188-t5/ + fallback round187-t5/),
  `run-attempt-188.sh` (lượt yên #57),
  `run-analyzers-188.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt; đợt này KHÔNG CHẠY — 0 attempt),
  `distinct-seq-188.py` (helper đọc sổ; đợt này KHÔNG DÙNG
  LIVE — 0 attempt nên sổ giữ as-of-187, md5 `ea978f23`).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–187, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round188-t4/` — theo đúng mẫu 149–187: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, md5 `078938cf...`, giống hệt bản đợt 156–187).
- **Script làm việc (hidden_files, không stage):**
  5 script T4 (`poll-wait`/`run-attempt`/`run-analyzers`/
  `t4-attempt-inner` — W = round188-t4 + glob chéo round187-* /
  `check-classb-t4` — đếm sampler n chỉ dòng `boot=`),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-188.py` (thống kê §A;
  footer CỘNG DỒN GIỮ NGUYÊN 48 lượt),
  `distinct-seq-188.py` (helper đọc sổ — KHÔNG DÙNG LIVE đợt
  này), `distinct-seq-ledger.json` (SỔ distinct-seq, GIỮ
  as-of-187: 139/142 distinct, occ 179/191, valid_rounds_p3
  36, non_dat [260, 364, 498], md5 `ea978f23…`),
  `preflight-188.txt` + `preflight-postboot-188.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2),
  `round188-t4-copy.py` (script copy-forward 187 → 188).
- **Log/evidence (hidden_files/round188-t4/, không stage):**
  `poll-t4.log` (136 poll trên #111 + HẾT HẠN 01:30Z +
  0 attempt), `poll-t4.nohup.log` (1 instance),
  `poll-test-188.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + HẾT HẠN, poller thoát),
  `postboot-t4-188-gate0wait-*.log` (check-only mỗi 4 poll,
  34 file), `stats-188-output.txt` (output stats-188.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll #34–#37).
  **0 JSON attempt (0 attempt chạy). 0 process T4 sống lúc
  đóng** (poller đã thoát 01:30:00Z; 0 vite T4; 0 Xvfb T4;
  0 MiniBrowser/WebProcess T4). **X11 KHÔNG trống lúc đóng —
  1 socket X199 + Xvfb :199 + vite l10 + MiniBrowser/WebKit
  của LUỒNG KHÁC, khởi động 01:31–01:32Z SAU khi poller T4
  thoát (xem F-188-T4-6).**

## 6. Sai số F-188-T4-1..9 (+ nợ cũ)

- **F-188-T4-1 — COPY-FORWARD: 2 CHUỖI STALE SÓT SAU LẦN SỬA
  ĐẦU (GHI NHẬN — DẠNG F-187-T4-1).** Grep kiểm lần 2 bắt
  thêm 2 chuỗi: comment "poller dung 22:30Z" (thiếu ngày) +
  comment T5FLAG `(uu tien round187-t5, du phong round186-t5)`
  không có slash nên cặp thay thế `round187-t5/` không chạm.
  Sửa TRƯỚC pre-flight; grep lần 3 sạch (mẫu rộng `round186|
  22:30|23:00|23:35|#56|cea79500|9161bfd1|round184|T4-187a|
  default=187|WebKit #56|round185|20:00|20:35|T4-187|
  default=186` = 0 hit trong 7 file vận hành). Không ảnh hưởng
  vận hành (2 comment). Bài học: cặp thay thế phải bao cả dạng
  không slash — đợt này mẫu cũ đã bắt được 2 chuỗi nhờ kiểm cả
  `186` lẻ.
- **F-188-T4-2 — BALLOON GHIM ~6,44 GB, RAM <1024 TRONG 101/136
  POLL (MỚI — NẶNG, NGUYÊN NHÂN CỬA KHÔNG MỞ).** RAM avail
  <1024: 101/136 poll thật (74%); <500: 60/136; min 375 MB;
  chuỗi RAM<500 dài nhất 18 poll; RAM ≥1024 lần cuối #44
  (00:20:39Z), sau đó max 988 MB (#84). Balloon đo trực tiếp
  qua /proc/meminfo: **6.443.824 kB lặp lại đúng 3 lần**
  (00:31/00:41/00:46Z — giá trị ghim cố định của host), dao
  động 5,98–6,44 GB trong phiên (5.976.096 kB lúc 00:51Z,
  6.247.216 kB lúc 01:06Z); lúc T4 đóng còn xả (4.850.072 kB
  lúc 01:34Z — quá muộn, sau hạn cắt). 0 process ăn RAM
  (process lớn nhất lúc 00:31Z: hatch daemon 296 MB RSS;
  sampler-autotrigger của T9 chỉ 7,9 MB) → **host-side**,
  không phải rò rỉ trong guest. Giao T9-188 phân loại episode
  (E-233 VẪN GHIM lúc đóng đợt 186 — T9-188 phán là episode
  mới hay nối tiếp; T4 chỉ ghi số).
- **F-188-T4-3 — STATS "gan-mo" ĐẾM 8 NHƯNG 0 LẦN MỞ CỬA THẬT
  (MỚI — DẠNG F-187-T4-3).** Script stats đếm poll đủ
  load1<2 + load5<2 + RAM≥1024 (proxy, không xét
  lock/blockers/gate0/apt): #20–#26 đủ 3 điều kiện nhưng cửa
  đóng vì gate0 khong-dat + apt=1; #35 đủ 3 điều kiện nhưng
  lock=co + blockers=5. Chỉ là cách đếm proxy, không ảnh
  hưởng verdict (0 lần mở cửa thật khớp log CUA YEN MO = 0).
- **F-188-T4-4 — QUYẾT (p) KIỂM CHỨNG LIVE LẦN 8: KHÔNG THỂ
  KIỂM (MỚI — F-187-T4-4 ĐÃ HẾT THEO NGHĨA KHÔNG CÓ CỬA SỔ
  MỚI).** 0 cửa sổ attempt (poller hết hạn, 0 attempt);
  `run-analyzers-188.sh` KHÔNG chạy; 0 file analyzer nào được
  ghi trong phiên. File skiplatest mặc định mtime vẫn
  2026-11-23 18:13:20Z — 0 ghi mới. Verdict lần 8 KHÔNG ĐẠT
  cũng KHÔNG HỎNG — không có cửa sổ để kiểm; chờ đợt sau có
  attempt mới kiểm tiếp (chuỗi lần ĐẠT dừng ở 7).
- **F-188-T4-5 — B2 KHÔNG CÓ DỮ KIỆN MỚI (MỚI — THEO QUYẾT
  (p) ĐỢT 186).** 0 attempt nên không đo load1_max, không báo
  cáo phân bổ tự-tải/lạ-tải được đợt này. Dữ kiện cho quyết
  tách B2 VẪN CHỈ 1 đợt (187 — F-187-T4-5); cần ≥3 đợt.
  Luật B2 KHÔNG TÁCH vẫn đứng; T4 tiếp tục báo cáo cùng mẫu
  các đợt sau khi có attempt.
- **F-188-T4-6 — X11 KHÔNG TRỐNG LÚC ĐÓNG, NHƯNG KHÔNG PHẢI
  CỦA T4 (MỚI — DẠNG F-186-T4-5).** Lúc đóng (01:32Z): socket
  X199 + Xvfb :199 (pid 416330, khởi động 01:31Z) + vite l10
  (pid 416456, 01:32Z) + MiniBrowser/WebKit (pid 416485+,
  01:32Z) — TẤT CẢ khởi động SAU khi poller T4 thoát 01:30Z,
  thuộc luồng khác (nghi harness T8-188). T4 chạy 0 attempt
  nên không thể tạo Xvfb/vite nào; 0 process T4 sống lúc
  đóng (poller đã thoát; pgrep `poll-wait-t4-188` = 1).
- **F-188-T4-7 — REPLAY #111 ĐÌNH TRỆ (MỚI — THEO T5-188).**
  Heal 23:11:21Z (boot+37s) viết 2 dòng dpkg rồi DỪNG; 44'
  sau 0 tiến triển (dpkg 2 dòng, 0 proc, /var/log/apt vắng,
  cache 0, GST 0, journal 0 entry apt/dpkg); replay host
  KHÔNG BAO GIỜ chạy — watcher repair thay thế theo quy tắc
  (h). Hệ quả phía T4: gate0 chỉ đạt 00:11:36Z nhờ cờ T5
  (poll #33), muộn ~40' sau khi poller mở; check-only của T4
  FAIL cả 32 poll đầu.
- **F-188-T4-8 — LOAD1 TĂNG VỌT CUỐI PHIÊN #135–#136 (MỚI —
  NHẸ).** load1 3,31/2,26 lúc 01:29:06–01:29:51Z (trước đó
  <1,3 suốt từ poll #45) — trùng lúc luồng khác khởi động
  (Xvfb :199 lúc 01:31Z; xem F-188-T4-6). Không ảnh hưởng
  verdict (RAM đã 444–462 MB, cửa đóng từ trước).
- **F-188-T4-9 — AGGREGATE 186 §12.3 BỊ VIẾT LẠI TRONG LƯỢT
  188 (MỚI — THEO F-188-T6-1).** T4 đọc §12.3 lúc ~23:44Z
  (header ghi "parent viết trực tiếp... SẠCH, không điền sẵn;
  lần thứ 99 liên tiếp"); aggregate bị viết lại 23:49:15Z
  (107.950 → 108.730 B) — header mới đổi thành nguồn gốc
  "CHƯA NGÃ NGŨ" (cùng trạng thái đợt 180/181, không ghi là
  điền sẵn lần 19 cũng không ghi là sạch) + đếm khớp 99 →
  101 + hai đính chính (n) run 185 CA thứ 14 trong cửa sổ
  (không phải 15), (q) ghi lại theo kiểm đếm lượt này. T4
  kiểm spot sau viết lại: **(b) FULL PASS 1→0, (m) #55
  chuỗi 47→0, (p) chuỗi 0 vi phạm 1→2 + (p) live lần 6 ĐẠT
  + B2 KHÔNG TÁCH — GIỮ NGUYÊN**, khớp cả hai bản (T5-188
  F-188-T5-2 xác nhận (c)/(e)/(p) cả hai bản đồng ý) nên
  verdict T4 đợt này KHÔNG ĐỔI. T4 KHÔNG phán nguồn gốc bản
  viết lại (giao parent/T10-188); ghi nhận làm bằng chứng,
  không viết lại aggregate. LƯU Ý MÂU THUẪN SỐ THỨ TỰ: bản
  viết lại ghi kiểm đếm của parent là "lần thứ 101", trong
  khi T1-188 đếm 101 = T10-187, 102 = T1-188 — T4 không tự
  hòa giải, giữ cả hai số làm bằng chứng.
- **F-187-T4-1 — TÁI DIỄN DƯỚI DẠNG F-188-T4-1**
  (2 chuỗi stale — bắt được trước pre-flight).
- **F-187-T4-2 — KHÔNG ÁP DỤNG** (0 attempt — không có RAM
  trong attempt để so ngưỡng 1024; RAM poll còn tệ hơn đợt
  187: min 375 MB).
- **F-187-T4-3 — TÁI DIỄN DƯỚI DẠNG F-188-T4-3** ("gan-mo"
  = 8, 0 lần mở cửa thật).
- **F-187-T4-4 — KHÔNG THỂ KIỂM ĐỢT NÀY (xem F-188-T4-4 —
  0 cửa sổ attempt).**
- **F-187-T4-5 — KHÔNG CÓ DỮ KIỆN MỚI (xem F-188-T4-5).**
- **F-187-T4-6 — KHÔNG ÁP DỤNG** (0 attempt — không có
  median mới; median chuỗi 48 lượt giữ nguyên 39,0 ms).
- **F-186-T4-2 — KHÔNG ÁP DỤNG** (0 attempt).
  **F-186-T4-5 — TÁI DIỄN DƯỚI DẠNG F-188-T4-6** (X11 có
  socket lúc đóng — nhưng thuộc luồng khác, không phải sót
  của T4). **F-186-T4-7 — KHÔNG TÁI DIỄN** (B1 không đo được
  đợt này — 0 attempt; không tính sạch cũng không tính dơ).
- **F-185-T4-4 — KHÔNG ÁP DỤNG** (0 attempt — labellag (b)
  không có event để đếm; không tính là lần thứ 4 liên tiếp 0).
  **F-185-T4-2 — KHÔNG TÁI DIỄN** (1 luồng T4 duy nhất).
  **F-185-T4-3 — KHÔNG ÁP DỤNG** (0 attempt).
- **F-184-T4-2 — TÁI DIỄN NẶNG HƠN** (RAM <500 MB: 60/138
  poll — xem F-188-T4-2). **F-184-T4-4 — KHÔNG TÁI DIỄN**
  (0 reboot trong phiên đo).
- **F-183-T4-4 — TÁI DIỄN DƯỚI DẠNG BÌNH THƯỜNG** (T0 giữ
  lock polls #34–#37). **F-183-T4-6 — TÁI DIỄN DƯỚI DẠNG
  F-188-T4-3** ("gan-mo" = 8, 0 lần mở cửa thật).
- **F-182-T4-1 — KHÔNG TÁI DIỄN** (0 reboot).
  **F-181-T4-3 — KHÔNG TÁI DIỄN. F-181-T4-6 — KHÔNG CÓ SỐ
  MỚI** (chuỗi median 48 lượt giữ nguyên). **F-179-T4-5 —
  KHÔNG THỂ KIỂM (xem F-188-T4-4). F-178-T4-1 — KHÔNG ÁP
  DỤNG** (0 attempt). **F-177-T4-4 — KHÔNG TÁI DIỄN.
  F-177-T4-6 — TÁI DIỄN DƯỚI DẠNG F-188-T4-1.
  F-176-T4-1 — KHÔNG TÁI DIỄN** (0 vi phạm theo T4).
  **F-176-T4-2 — KHÔNG ÁP DỤNG** (0 attempt, không sampler).
  **F-175-T4-1 — KHÔNG TÁI DIỄN** (`tree-md5.txt` còn
  nguyên). **F-175-T4-2 — KHÔNG ÁP DỤNG** (0 cửa sổ attempt).
  **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG BÌNH THƯỜNG** (T0 giữ
  lock #34–#37). **F-175-T4-5 — KHÔNG TÁI DIỄN** (0 reboot).
  **F-174-T4-1 — KHÔNG ÁP DỤNG** (0 attempt).
  **F-174-T4-6 — TÁI DIỄN NẶNG HƠN** (RAM <500 MB: 60/138
  poll).

## 7. P3' cộng dồn (GIỮ NGUYÊN — 48 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 188 (GIỮ NGUYÊN): P1 215/219, P2
  210/210, P3-A1 187/219, P3' 179/191 occurrence = 139/142
  distinct-seq, P7 113/113** (48 lượt hợp lệ — #57 KHÔNG CÓ
  lượt hợp lệ nên không cộng thêm seq nào; 0 attempt nhiễm
  tải). Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #57: 0 seq** (0 attempt). Helper
  `distinct-seq-188.py` KHÔNG DÙNG LIVE đợt này (không có
  stall/c2coverage mới để đọc); sổ GIỮ as-of-187 (md5
  `ea978f23…`, valid_rounds_p3 36, non_dat [260, 364, 498]).
- **P1/P2/P3-A1/P3'/P7: GIỮ NGUYÊN** (không có attempt hợp lệ
  để cộng: P1 215/219, P2 210/210, P3-A1 187/219, P3'
  179/191 = 139/142, P7 113/113).
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (không có lượt hợp lệ mới để thay đổi).
- Chuỗi median tickCost 48 lượt (GIỮ NGUYÊN — không thêm số
  mới): 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 ms (tổng 2277,0; trung bình 47,4 ms; min 39,0,
  max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 189

- **(a) #57 KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ
  KHÔNG TĂNG (giữ 0 nếu §12.3-187 chưa chấp nhận 0→1; đứt
  1→0 nếu đã chấp nhận — parent quyết cuối).** Chân lượt yên
  cho chuỗi FULL PASS **KHÔNG CÓ đợt này** — FULL PASS không
  thể lên 1 ở đợt 188.
- **(b) P3' cộng dồn GIỮ NGUYÊN 48 lượt: P1 215/219, P2
  210/210, P3-A1 187/219, P3' 179/191 = 139/142, P7 113/113:**
  sổ distinct-seq giữ as-of-187 md5 `ea978f23…` (KHÔNG thăng
  cấp). **Chờ parent/T10 quyết:** ghi nhận cộng dồn giữ nguyên.
- **(c) BOOT 257c1eae (số hiệu #111 — T0-188 ĐÃ XÁC NHẬN 9
  nguồn tươi, btime 23:10:44Z, gap #110→#111 = 7.043 s).**
  **(m) #111 + INSIDE #111 thuộc T2-188** ((m) #111 thô:
  1 requeue eid 10875 tại btime +37,468 s; (m) #110 đối chiếu
  +43,959 s — T0-188); **#111 KHÔNG GIẾT HOLDER** (T6-188 —
  chuỗi 15); **(m) #110/#111 + INSIDE thuộc T2-188.**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 2 chuỗi sót
  (F-188-T4-1 — sửa trước pre-flight); gate0 ĐÃ ĐẠT lúc mở
  poller qua T5 từ poll #33 (cờ T5 có 00:11:36Z).
- **(e) POSTBOOT_PASS #111 ĐÃ CÓ (00:11:36Z,
  repair-sớm-quyết-h, poll=1, CÓ caveat — GST symlink →
  debroot ephemeral + tools CHƯA CÀI + dpkg 768).
  Replay #111 ĐÌNH TRỆ (T5-188). Tổng boot không cờ GIỮ 24
  (24 → 25 nếu parent chấp nhận #108 ở §12.3-187).**
  Hướng (3) VẪN ĐỨNG lần 35 (theo T5-188).
- **(f) Balloon ghim ~6,44 GB — RAM <500 MB: 60/138 poll
  (min 375 MB).** Giao T9-188 phân loại episode (E-233 vẫn
  ghim lúc đóng 186 — T9-188 phán mới hay nối tiếp).
- **(g) (m) #105 DƯƠNG (parent 186 quyết cuối); (m) #56 lần
  31 (T2-188 — LƯU Ý: (m) #56 của T2 KHÁC lượt yên #56 của
  T4, đừng nhầm); mù #96?/#95?/#94?/#88?/#77? (T2-188);
  V2 phương án chính + B2 (T8-188); 84l10 + Q3 (T8-188);
  run 188 TIMEOUT 23:38:46Z (T7-188 phán); run 187 kết cục
  thuộc T7-187; OUTAGE 8.406 s = OUTAGE #2 + điều tra
  "cố định theo giờ" (T7-188); #111 giết holder? KHÔNG
  (T6-188 — chuỗi 15); prune lần 63 (T6-188); checklist (o)
  (T8-188); H3 chỉ giám sát thụ động; birefnet 0 thử lần 41;
  nhắc mọi luồng: KHÔNG script nặng / KHÔNG probe dpkg trong
  cửa sổ attempt; u2net là fallback; ci-security.yml 403 chờ
  user; TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B2 KHÔNG CÓ DỮ KIỆN MỚI (0 attempt)** — phân bổ
  tự-tải/lạ-tải không báo cáo được đợt này (F-188-T4-5; dữ
  kiện tách B2 vẫn chỉ 1 đợt — 187). Luật B2 KHÔNG TÁCH
  vẫn đứng theo quyết (p) đợt 186.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 0 lần đợt này
  (0 attempt) → **KHÔNG có lượt yên hợp lệ #57 cho chuỗi
  FULL PASS.** T8 tự quyết O8 đợt này (O8 T0 trên #111 PASS
  3/3 — 00:13:00–00:15:45Z, 0 chồng attempt; O8 T8 + harness
  thuộc T8-188 báo cáo).
- **(j) F-188-T4-1 (2 chuỗi stale — sửa trước pre-flight);
  F-188-T4-2 (balloon ghim ~6,44 GB — nguyên nhân cửa không
  mở); F-188-T4-3 (stats "gan-mo" đếm 8, 0 lần mở cửa thật);
  F-188-T4-4 ((p) kiểm chứng live lần 8 KHÔNG THỂ KIỂM —
  0 cửa sổ attempt); F-188-T4-5 (B2 không có dữ kiện mới);
  F-188-T4-6 (X11 có socket lúc đóng — thuộc luồng khác);
  F-188-T4-7 (replay #111 đình trệ); F-188-T4-8 (load1 tăng
  vọt cuối phiên #135–#136); F-188-T4-9 (aggregate 186 §12.3
  bị viết lại trong lượt 188 — (b)/(m)/(p) giữ nguyên).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-188.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-188.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-24T23:48:01Z - 2026-11-24T23:48:08Z, boot=257c1eae
   RAM min=1722 max=1738 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 0/2 blockers>0: 0 apt>0: 0
   gate0: khong-dat=2
   lock: khong=2
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 136 poll, 2026-11-24T23:48:13Z - 2026-11-25T01:29:51Z, boot=257c1eae
   RAM min=375 max=2092 >=1024: 35/136 500-1023: 41/136 <500: 60/136
   load1<2: 113/136 load5<2: 109/136 blockers>0: 4 apt>0: 21
   gate0: T5=104, khong-dat=32
   lock: co=4, khong=132
   dpkg 2->768
   chuoi RAM<500 dai nhat: 18 poll
-- TONG poll that: 138
-- RAM toan phien: min=375 max=2092 >=1024: 37/138 <500: 60/138
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 8/138
   gan-mo? #20 2026-11-25T00:02:33Z boot=257c1eae RAM=1793 L1=0.88 L5=1.96 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #21 2026-11-25T00:03:19Z boot=257c1eae RAM=1720 L1=0.75 L5=1.77 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #22 2026-11-25T00:04:04Z boot=257c1eae RAM=1586 L1=0.48 L5=1.56 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #23 2026-11-25T00:04:49Z boot=257c1eae RAM=1432 L1=0.62 L5=1.45 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #24 2026-11-25T00:05:34Z boot=257c1eae RAM=1327 L1=0.60 L5=1.32 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #25 2026-11-25T00:06:19Z boot=257c1eae RAM=1215 L1=0.79 L5=1.26 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #26 2026-11-25T00:07:04Z boot=257c1eae RAM=1076 L1=0.43 L5=1.10 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #35 2026-11-25T00:13:51Z boot=257c1eae RAM=1068 L1=0.89 L5=0.98 blk=5 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=co t5=PASS
-- boot 257c1eae: 138 poll; RAM>=1024 lan cuoi: 2026-11-25T00:20:39Z #44; RAM<1024 lan dau: 2026-11-25T00:07:49Z #27 RAM=975
-- cong don P3' (MOI, 48 luot hop le): P1 215/219 P2 210/210 P3-A1 187/219 P3' 179/191 occ = 139/142 distinct-seq P7 113/113
-- chuoi median 48 luot: n=48 mean=47,4 min=39,0 max=60,0 vuot-60: 0
```
