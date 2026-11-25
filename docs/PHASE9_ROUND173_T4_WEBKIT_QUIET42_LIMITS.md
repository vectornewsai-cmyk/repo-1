# PHASE9_ROUND173_T4_WEBKIT_QUIET42_LIMITS.md

**Đợt:** 173. **Luồng:** T4 — đo lượt yên WebKit #42 trên 2 boot
+ **#42 KHÔNG CÓ LƯỢT HỢP LỆ — 0 ATTEMPT (poller hết hạn 22:30Z,
  exit 5). CHUỖI LƯỢT YÊN HỢP LỆ GIỮ NGUYÊN 36 (không tăng).**
  Gate0 ĐÃ ĐẠT từ poll #34 instance 3 (cờ T5-173 21:27:05Z) nhưng
  RAM KHÔNG BAO GIỜ ≥1024 MB nữa sau 21:21:16Z — hai điều kiện
  KHÔNG BAO GIỜ trùng nhau trong cả phiên: cửa sổ RAM≥1024
  (#5–#26 instance 3, 21:05:28–21:21:16Z) rơi vào lúc gate0 còn
  khong-dat; gate0 đạt từ #34 thì RAM đã 624 MB và rơi tiếp.
  RAM<500 MB: **41/144 poll toàn phiên** — phá chuỗi sạch 5 đợt
  liên tiếp (168–172 đều 0); chuỗi <500 dài nhất 13 poll.
+ **REBOOT GIỮA PHIÊN GIẾT POLLER — T4 KHỞI ĐỘNG LẠI TAY.**
  Boot dd08464a (btime 20:25:47Z) chết trong khung
  (21:01:36Z, 21:02:07Z]; boot mới 4ae2d2ea (btime 21:01:15Z,
  gap +2.128 s). Poller cũ chết theo reboot (không attempt nào
  đã chạy, ngân sách 3/3 còn nguyên); poller mới khởi động
  21:02:28Z trên boot mới. Số hiệu: dd08464a = **#83 ĐÃ XÁC
  NHẬN (T0-173, 9 nguồn, gap #82→#83 = 5.099 s)**; 4ae2d2ea =
  ứng viên **#84, CHƯA xác minh** (T0-173 đóng 20:54Z, trước
  reboot 21:01:15Z — giao T0/T2-174 hoặc T2-173 xác minh).
+ **CỘNG DỒN KHÔNG ĐỔI (không có lượt hợp lệ để cộng): P1
  143/146, P2 137/137, P3-A1 123/146, P3' 108/118 occurrence =
  96/100 distinct-seq, P7 70/70.** Sổ distinct-seq GIỮ as-of-172
  (không thăng cấp); helper-173 đã back-test khớp live 172.
+ **BOOT 4ae2d2ea — CỜ REPAIR, KHÔNG PHẢI REPLAY-ĐẦY-ĐỦ.**
  POSTBOOT_PASS viết 21:27:05Z, mode repair-sớm-quyết-h, poll=1,
  dpkg 795 — KHÔNG có replay tự nhiên trên boot mới (dpkg giữ
  2 dòng suốt poll #1–#33). Trên boot cũ dd08464a replay CÓ
  chạy (dpkg 2→438) nhưng reboot giết giữa chừng.
**Ngày:** 22/11/2026 (lượt cron 03:35 +07 23/11 = 20:35:51Z).
**Boot đo:** HAI boot — dd08464a (btime 20:25:47Z, chết
~21:01:15Z) rồi 4ae2d2ea (btime 21:01:15Z, boot lúc đóng).
**Trạng thái:
#42 KHÔNG CÓ LƯỢT HỢP LỆ (0 attempt; poller thoát 22:30:30Z
vì HẾT HẠN CẮT 22:30Z, exit 5, trước hạn cờ ~23:00Z ~29m).
Ngân sách dùng 0/3. Cộng dồn GIỮ NGUYÊN 36 lượt hợp lệ:
P1 143/146, P2 137/137, P3-A1 123/146, P3' 108/118
occurrence = 96/100 distinct-seq, P7 70/70. RAM <500 MB:
41/144 poll — LẦN ĐẦU CÓ POLL <500 MB kể từ đợt 167
(phá chuỗi sạch 168–172). POSTBOOT_PASS cho boot 4ae2d2ea
ĐÃ CÓ (21:27:05Z, mode repair-sớm-quyết-h, poll=1 — KHÔNG
phải replay-đầy-đủ); watcher-173b của T5 sở hữu.
KHÔNG có attempt nào nên KHÔNG có tickCost, KHÔNG có lớp B,
KHÔNG có (c2)/P1/P2/P3-A1/P3'/P7 mới.**

## 0. Verdict tổng

- **#42 KHÔNG CÓ LƯỢT HỢP LỆ (0 attempt).**
  Poller thoát 22:30:30Z vì HẾT HẠN CẮT 22:30Z (exit 5) —
  KHÔNG phải vì đủ 3 attempt, KHÔNG phải vì lỗi setup.
  Lý do duy nhất: cửa yên KHÔNG BAO GIỜ mở trong cả phiên
  (xem §1).
- **Hai điều kiện gate KHÔNG BAO GIỜ trùng nhau:**
  (a) RAM≥1024 MB chỉ có trong cửa sổ 21:05:28–21:21:16Z
  (instance 3 poll #5–#26, 22 poll liên tiếp ≥1024 — trong
  đó load1<2 + load5<2 + apt=0 + blockers=0 + lock=khong
  đều đủ ở nhiều poll, xem "gan-mo" §A) NHƯNG gate0 còn
  khong-dat (replay/repair chưa xong, postboot_exit=1);
  (b) gate0=T5 từ poll #34 (21:27:17Z, cờ T5-173 viết
  21:27:05Z) + postboot_exit=0 từ poll #37 (21:29:33Z)
  NHƯNG RAM lúc đó đã 624 MB rồi 429 MB, và KHÔNG BAO GIỜ
  trở lại ≥1024 trong 90 poll còn lại (21:22:01–22:29:42Z).
  RAM<1024 lần đầu instance 3: poll #27 21:22:01Z (998 MB).
- **Poller — 2 instance thật + 1 test, 144 poll thật, 0 lần
  cửa mở, trên 2 boot (1 reboot giữa phiên).** Instance 2
  (dd08464a): 26 poll, gate0 khong-dat 26/26, RAM ≥1024:
  19/26, RAM <500: **0/26**, dpkg 2→438 (replay đang cài).
  Instance 3 (4ae2d2ea): 117 poll, gate0 T5 84 / khong-dat
  33, RAM ≥1024: 26/117, RAM <500: **41/117** (chuỗi dài
  nhất 13 poll), dpkg 2→795 (repair nhảy 1 bước ở poll #34).
  Test poll: 1 poll, exit 7 đúng thiết kế.
- **Chuỗi lượt yên hợp lệ: GIỮ 36 (35→36 đợt 172, nay
  không tăng).** Không có lượt hợp lệ mới nên không cộng
  dồn gì thêm; chuỗi không đứt theo nghĩa "lượt hỏng" — đợt
  này đơn giản là 0 lượt (khác với lượt nhiễm tải bị loại).
- **Điều kiện GIỮ NGUYÊN như #41 (quyết (m) đợt 167):**
  ngưỡng gate A RAM ≥1024 MB, load1<2, load5<2, tickCost
  median ≤60 ms, lớp B 5/5, ngân sách 3 attempt/đợt, poll
  45 s — KHÔNG đổi ngưỡng/cadence nào. Việc hạ ngưỡng RAM
  để "vớt" lượt KHÔNG được làm (quyết parent đợt 132 §12.3(a)
  giữ RAM ≥1024, KHÔNG HẠ).
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NÀO TRONG LÚC
  PROBE PASS CHẠY (wording MỚI theo F-170-T9-9 / quyết (h)
  đợt 170): TUÂN THỦ (vacuous — không có probe pass nào
  chạy).** Mọi phân tích (stats-173.py, helper
  distinct-seq-173 back-test, đọc analyzer/log T9) đều làm
  SAU khi poller thoát (từ ~22:30:35Z). Pre-flight postboot
  check-only (20:41Z) + test poll (20:42:37Z) chạy TRƯỚC khi
  mở poller, ngoài cửa sổ attempt. Không chạy probe chạm
  dpkg nào trong cả phiên (chỉ đọc `wc -l` dpkg.log +
  `pgrep -x`). Xem §0b + F-173-T4-5.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc khởi động lại poller, lúc đóng — không đổi; mọi
  poll đều tree=YES).
- **Cờ:** `hidden_files/round173-t4.done` viết ~22:3xZ 22/11
  (trong hạn cờ ~23:00Z, sớm ~25m), CÓ NỘI DUNG; boot kiểm
  lần cuối ngay trước khi viết cờ là 4ae2d2ea (F-171-T10-2).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1 + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4 + F-170-T4-1 + F-171-T4-7 + F-172-T4-1/2)

Chạy **trước mọi attempt, trước khi mở poller** (20:39–20:42Z),
ghi vào `hidden_files/round173-t4/preflight-173.txt` — **PASS**:

- **b.json CÓ trong `round173-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156–172 (F-158-T4-1/2 KHÔNG lặp lại).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–172. **vite.t4-temp.config.mjs md5
  `e3e874e1528b28563f7aa26234661522`** — khớp.
- **tree-md5.txt `530e10a7` == preview.tsx hiện tại** (`530e10a7`).
- **10/10 analyzer** `analyze-t4-*.py` có mặt (c2coverage,
  c2drawlog, labellag, lag5, p1p3p7, perpass, skiplatest, stall,
  tickcost, wallbands).
- **Script hệ thống:** `vcut-webkit-postboot-check.sh` +
  `vcut-vite-lock-v2.sh` có mặt; `bash -n` OK cả 4 script T4;
  `python3 -m py_compile` OK 13 file py.
- **Playwright-core** `/home/hatch/scratch-round63-r4/
  node_modules/playwright-core/index.mjs` có mặt.
- **Media** `apps/web/public/stripes-nonperiodic.mp4` có mặt
  (140.828 B).
- **Lock + ngân sách trống:** không có `vite.lock`,
  không có `attempt-done-*` trong thư mục làm việc mới.
- **Deadline waiter epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG
  (bài học F-156-T8-3):** chuỗi deadline trong script
  `2026-11-22 22:30:00 UTC` → epoch **1795386600** =
  2026-11-22T22:30:00Z — khớp đúng hạn cắt poller 22:30Z
  (hạn cờ ~23:00Z = 1795388400, hạn cứng 23:30Z =
  1795390200); không còn sót dạng `19:30`/`20:00Z`/`20:30Z`
  nào trong script mới (grep 0 hit); grep `round172`
  trong mọi script làm việc chỉ còn fallback `round172-t5/`
  (có chủ đích, 3 hit trong poll-wait); `round171` 0 hit;
  `WebKit #41` 0 hit; `T4-172a` 0 hit; `default=172` 0 hit.
- **Copy-forward đợt 172 → 173:** deadline poller `19:30Z`
  → `22:30Z` ở mọi dạng (kể cả `19:30:00Z` trong dòng echo
  start — grep bắt được sau lượt sed đầu, đã sửa);
  hạn cờ/cứng trong comment `20:00Z`/`20:30Z` →
  `23:00Z`/`23:30Z`; `brief dot 172` → `brief dot 173`;
  `poll-test-172`/`stats-172`/`distinct-seq-172` → 173;
  T5FLAG chính `round173-t5/` + fallback `round172-t5/`;
  **W trong `t4-attempt-inner.sh` / `check-classb-t4.sh` /
  `poll-wait-t4-173.sh` / `run-attempt-173.sh` ĐÃ LÀ
  `round173-t4` ngay sau copy**; `T4-172a` → `T4-173a`
  trong `run-attempt-173.sh`; `default=172` → `default=173`
  trong `distinct-seq-173.py`; `run-attempt-172.sh` →
  `run-attempt-173.sh` ở cả poll-wait lẫn comment;
  `WebKit #41` → `WebKit #42` trong run-attempt.
  **GREP BẮT ĐƯỢC 4 SÓT** (hạn cờ/cứng `20:00Z`/`20:30Z`
  trong comment poll-wait, `19:30:00Z` trong 2 dòng echo
  start, comment `poll-wait-t4-172.sh` trong run-attempt,
  `distinct-seq-ledger-172-proposed` trong distinct-seq —
  đã sửa hết, grep lại 0 sót ngoài fallback T5 có chủ đích).
  F-168-T4-1 không tái diễn.
- **`cp -a` LẠI BÁO EPERM NHƯNG CLEANUP CHẠY VÔ ĐIỀU KIỆN
  (bài học F-170-T4-1 ĐÃ ÁP DỤNG):** `cp -a round172-t4
  round173-t4` báo `failed to preserve ownership` (EPERM)
  nhưng cleanup `rm` chạy KHÔNG chain `&&` nên vẫn chạy đủ
  (66 file copy, thư mục sạch 22 file trước khi đổi tên
  script; 2 file `distinct-seq-ledger-172-*-proposed.json`
  xóa tay sau đó vì tên khác mẫu rm).
- **Freeze check (bài học F-164-T4-1):** thư mục `round172-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-22 20:35:51Z**
  (giờ mở đợt 173); `round171-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ: REPLAY ĐANG CHẠY — KHÁC MẪU #81 (xem
  F-173-T4-6):** boot dd08464a (btime 20:25:47Z, tuổi ~17m
  lúc mở), dpkg.log CHỈ 2 dòng (`startup packages configure`
  20:35:41Z — 9m54s SAU btime); `/var/log/apt/` KHÔNG TỒN
  TẠI; apt-get update pid 822 đang chạy lúc mở (replay
  host-side, parent là shell replay payload); cờ T5-173
  CHƯA CÓ lúc mở (thư mục `round173-t5/` chỉ có
  `make-watcher-173.py`); cờ T5-172 chỉ ghi boot 4b9db449,
  mtime 17:50:32Z < btime 20:25:47Z — KHÔNG tính cho boot mới
  (poller bỏ qua đúng luật: mtime cũ); postboot check-only
  chạy tay **exit 1 FAIL** (thiếu 5 lib + GST không tồn tại
  + 11 gói apt chưa cài — xem `preflight-postboot-173.log`);
  gate0 lúc mở là khong-dat, phải chờ cờ T5-173 (repair)
  hoặc replay xong. Đây là TRẠNG THÁI GATE, không phải lỗi
  setup — pre-flight PASS.
- **Test poll (POLL_TEST=1): TEST-POLL-OK (exit 7 đúng thiết kế)** —
  poll #1 RAM 1005 MB (<1024), load1 0,54/load5 0,59,
  gate0=khong-dat (postboot exit 1, pb_age 0), apt=1,
  dpkg 2 (xem `poll-test-173.log`).
  TEST-POLL-OK chỉ in ngay trước `exit 7` trong code nên
  dòng này trong log là bằng chứng exit 7.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`,
  bài học F-171-T4-7).
- **RAM lúc mở DAO ĐỘNG MẠNH (xem F-171-T4-9 — tiếp diễn):**
  avail 682 MB lúc 20:39Z → 634 MB lúc 20:40Z → 1110 MB lúc
  20:42Z → 1005 MB lúc test poll 20:42:37Z — do các luồng
  khác + replay; poller vẫn mở được cửa khi RAM ≥1024 và
  load hạ (nhưng đợt này cửa không bao giờ mở đủ mọi điều
  kiện cùng lúc — xem §1).

## 1. Poller — 144 poll thật, 0 lần cửa mở, trên 2 boot (1 reboot giữa phiên)

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot dd08464a
  (20:42:37Z):** poll #1 RAM=1005 MB (<1024), load1=0,54
  load5=0,59, blockers=0, gate0=khong-dat → cửa đóng
  (gate0 + RAM) → **TEST-POLL-OK exit 7 đúng thiết kế**. Poll
  này nằm trong `poll-test-173.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot dd08464a, 26 poll (20:42:43–
  21:01:36Z), 0 lần cửa mở:** RAM ≥1024: 19/26 (min 559,
  max 1856 MB); 500–1023: 7/26; **<500: 0/26**;
  load1<2: 20/26; load5<2: 20/26; gate0: **khong-dat 26/26**;
  lock=khong 17, co 9 (vite.lock của T0-round173, port 5560
  — xem F-173-T4-7); blockers>0: 10 poll; apt>0: 17 poll;
  dpkg 2→438 (replay đang cài dần).
- **Instance 3 — boot 4ae2d2ea, 117 poll (21:02:28–
  22:29:42Z), 0 lần cửa mở:** RAM ≥1024: 26/117 (min 429,
  max 2542 MB); 500–1023: 50/117; **<500: 41/117**;
  load1<2: 113/117; load5<2: 117/117; gate0: **T5 84,
  khong-dat 33**; lock=khong 117/117; blockers>0: 0 poll;
  apt>0: 18 poll; dpkg 2→795.
- **Giai đoạn 1 — instance 3 chờ gate0, RAM còn đủ (poll #1–#26,
  21:02:28–21:21:16Z):** RAM ≥1024 ở 22/26 poll đầu
  (#5–#26 liên tiếp ≥1024; #1–#2 RAM đủ nhưng load1 2,86/
  5,13 chặn cửa — boot đang settle); gate0=khong-dat suốt
  giai đoạn (postboot exit 1; repair của T5 chưa xong);
  apt=1 ở #20–#26 (repair đang cài? — dpkg vẫn 2 dòng tới
  #33 nên apt này là update/lẻ, không phải install chính).
  Cửa sổ vàng này KHÔNG MỞ ĐƯỢC vì thiếu gate0.
- **Giai đoạn 2 — RAM sập, gate0 về sau (poll #27–#117,
  21:22:01–22:29:42Z):** RAM<1024 từ #27 (998 MB) và KHÔNG
  BAO GIỜ trở lại ≥1024 trong 90 poll còn lại; RAM<500 lần
  đầu ở #36 (21:28:47Z, 476 MB); chuỗi <500 dài nhất 13
  poll (#68–#80, 21:52:52–22:01:53Z); 10 poll cuối RAM
  490–513 MB trong khi load1 chỉ 0,02–0,09 (máy gần như
  idle nhưng RAM avail vẫn ~500 MB — balloon, xem
  F-173-T4-2). Cờ T5 xuất hiện ở #34 (21:27:17Z, viết
  21:27:05Z); postboot_exit chuyển =0 từ poll #37
  (21:29:33Z, RAM 429 MB). Cửa sổ này KHÔNG MỞ ĐƯỢC vì
  thiếu RAM.
- **Hết hạn:** poll #117 (22:29:42Z) RAM 496 MB → poller
  ghi `HET HAN CHO 22:30Z — GATE DO LUC HET HAN (poll cuoi
  #117): gateA-RAM(496MB<1024)` rồi `0 attempt — dong theo
  brief dot 173`, thoát 22:30:30Z exit 5.
- **Phân rã 144 poll thật:** RAM≥1024: 45/144; RAM 500–1023:
  58/144; RAM<500: **41/144**. load1<2: 134/144; load5<2:
  138/144. **Stats "gan-mo" đếm 34 ≠ mở cửa thật 0 (xem
  F-173-T4-4):** heuristic chỉ kiểm load1<2 + load5<2 +
  RAM≥1024 mà KHÔNG kiểm gate0/apt/PB/lock/blockers — 34
  poll "gan-mo" đều bị chặn bởi gate0 khong-dat (22 poll
  instance 2 + 12 poll instance 3 giai đoạn 1) hoặc apt=1
  hoặc lock=co hoặc blockers>0; KHÔNG poll nào đủ mọi điều
  kiện. Lệch gan-mo/mở-cửa lần thứ hai liên tiếp (đợt 172:
  6 vs 1) — heuristic cần ghi rõ giới hạn, poller vẫn đúng
  (chỉ mở khi đủ MỌI điều kiện).
  gate0: T5 84 poll, khong-dat 60 poll (26 instance 2 + 33
  instance 3 + 1 test), T4-check-only 0 poll (check-only
  FAIL tới #37 nên không có poll nào đi qua đường dự phòng
  trước khi cờ T5 có; sau #37 cờ T5 đã là chính).
  blockers>0: 10 poll (toàn instance 2). apt>0: 36 poll.
  **RAM <500 MB: 41/144 poll** — LẦN ĐẦU CÓ POLL <500 MB
  kể từ đợt 167 (đợt 168: 0/26, 169: 0/13, 170: 0/22,
  171: 0/18, 172: 0/26). Ghi nhận để T9-173 đối chiếu
  headroom/balloon trên boot mới.

## 2. Attempt — KHÔNG CÓ ATTEMPT NÀO (0/3 ngân sách)

- **Không có attempt nào chạy nên không có kết quả probe,
  không có tickCost median, không có lớp B, không có (c2),
  không có P1/P2/P3-A1/P3'/P7 mới.** Mọi số cộng dồn ở §7
  GIỮ NGUYÊN từ đợt 172.
- **Ngân sách dùng 0/3.** Không attempt nào bị reboot giết
  (reboot xảy ra lúc poller đang chờ gate, trước mọi
  attempt); không có file `attempt-done-*` nào trên đĩa.

## 3. B2 spike / đối chiếu sampler T9 (theo nhiệm vụ đợt 173)

- **KHÔNG CÓ CỬA SỔ ATTEMPT nên KHÔNG CÓ KIỂM B2 trong
  attempt hợp lệ** (vacuous — nhiệm vụ này chỉ áp dụng khi
  có attempt hợp lệ; đợt này 0 attempt). Ghi nhận thay thế:
  trong toàn phiên 20:42–22:30Z, T9 `b2-spikes.log` ghi
  **8 spike** (load1 ≥3): 5 spike trên boot cũ 20:44:19–
  20:46:40Z (max 6,65 lúc 20:44:54Z — click-test của T0 +
  replay) và 3 spike trên boot mới 21:02:32–21:03:42Z (max
  5,23 lúc 21:03:07Z — boot settle). **Tất cả đều NGOÀI
  mọi cửa sổ attempt (vì không có attempt nào)** — không
  ảnh hưởng verdict.
- **Đối chiếu sampler T9 (độc lập):** sampler T9 (60 s/mẫu,
  108 mẫu trong cửa sổ phiên) load1 max **5,95 lúc
  20:45:19Z** — KHỚP poller T4 (load1 max 6,92 ở poll #4
  instance 2, 20:44:59Z; cùng sự kiện click-test của T0,
  lệch do cadence mẫu 60 s vs 45 s). T9 `ram-sampler.log`
  cho thấy balloon ~5,6–6,4M kB trong phiên; `headroom-log`
  cuối phiên: MemAvailable 566.604 kB, Balloon 6.443.824 kB
  — nhất quán với RAM avail ~500 MB mà poller T4 đo được
  cuối phiên. Phân tích balloon/headroom thuộc T9-173;
  T4 chỉ ghi số đo phía poller.

## 4. Replay/postboot trên boot mới — cờ T5-173 ĐÃ CÓ (21:27:05Z, mode repair-sớm); 1 reboot giữa phiên

- **Boot 4ae2d2ea (btime 21:01:15Z, ứng viên #84 — CHƯA xác
  minh; T0-173 đóng trước reboot này): replay host-side
  KHÔNG CHẠY.**
  Lúc T4 khởi động lại poller (21:02:28Z): dpkg.log 2 dòng,
  `/var/log/apt/` không tồn tại, apt=0, postboot check-only
  exit 1 — KHÔNG có replay tự nhiên nào trên boot này
  (giống #81, khác #79/#80). dpkg giữ nguyên 2 dòng suốt
  poll #1–#33. Theo cờ T5-173: watcher-173b repair sớm,
  **POSTBOOT_PASS mới viết 21:27:05Z (boot+25m50s; dpkg 795
  dòng; cache 110 .deb; lists 75; postboot PASS poll=1 độc
  lập exit 0; mode repair-sớm-quyết-h; cờ cũ 4b9db449 lưu
  POSTBOOT_PASS-4b9db449)**. dpkg nhảy 2→795 trong MỘT
  poll (#34, 21:27:17Z) — đúng nhịp repair install, không
  phải replay dần.
  **CAVEAT: cờ repair, KHÔNG phải replay-đầy-đủ** — không
  có receipt (giống #81 đợt 172). Tiền lệ: #75 và #81 mode
  repair đã được chấp nhận cho gate (quyết (j)/(b) đợt 168
  và quyết đợt 172). T4 chỉ ghi dữ kiện, KHÔNG tự kết luận
  giá trị gate repair-mode cho chuỗi FULL PASS — giao
  T10-173 + parent quyết. Lưu ý: cờ repair lần này KHÔNG
  mở được cửa nào vì RAM đã sập trước khi cờ về — giá trị
  gate của cờ này đợt này là thuần hồ sơ.
- **REBOOT GIỮA PHIÊN (btime 21:01:15Z, boot 4ae2d2ea):**
  boot dd08464a chết trong khung (21:01:36Z, 21:02:07Z]
  (poll cuối trên boot cũ #26 21:01:36Z; T4 kiểm lại lúc
  21:02:07Z đã thấy boot mới). Gap btime #83→mới = 2.128 s;
  tuổi boot cũ 35m28s (20:25:47Z→21:01:15Z). Poller cũ
  (pid 12832) chết theo reboot — waiter nền của T4 cũng bị
  SIGTERM cùng lúc (đó là tín hiệu đầu tiên T4 biết có
  reboot). T4 khởi động lại poller tay 21:02:28Z (pid 3151)
  trên boot mới; ngân sách 0/3 còn nguyên (không attempt
  nào đã chạy). Số hiệu: **dd08464a = #83 ĐÃ XÁC NHẬN**
  (T0-173, 9 nguồn, gap #82→#83 = 5.099 s; (m) #83: 0 run
  sống + 0 requeue → KHÔNG PHẢI ĐIỂM); **4ae2d2ea = ứng
  viên #84, CHƯA xác minh** (T0-173 đóng 20:54Z, trước
  reboot — giao T2-173/T0-174 xác minh 9 nguồn + (m) #84).
  **Lưu ý mốc giờ:** dd08464a là boot T4 mở đợt (20:35:51Z
  mở, boot mới hơn giờ mở 9m56s). **Bối cảnh thêm
  (T0-173):** trên boot #83, O8 WebKit FAIL ×2 (renderer
  crash tại S1, probe xác nhận (a) PAGE-CRASH) + Chromium
  PASS 21/21; chuỗi WebKit FULL PASS GIỮ 24; POSTBOOT_PASS
  #83 chưa có lúc T0 đóng (T5 repair tay trên #83 lúc
  20:56–21:01Z nhưng không kịp viết cờ trước reboot).
  Mù #96?/#95?/#94?/#88?/#77?/#78? giao T2-173 — T4 không tự mở mù.
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:**
  boot 4ae2d2ea lúc poller khởi động lại (21:02:28Z), lúc
  poller thoát (22:30:30Z) và lúc kiểm cuối (~22:32Z) —
  btime 21:01:15Z không đổi; 0 dòng REBOOT PHAT HIEN trong
  poll log instance 3 (poller mới mở sau reboot nên không
  tự phát hiện reboot cũ — T4 phát hiện bằng kiểm tay).
- **85m4 / 86n2 / 84l10: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Đây là verdict của harness T8, T4 không đo và không suy
  đoán — giao T8-173 báo cáo. (T4 chỉ ghi: 0 attempt nên 0
  kẹt quan sát được; không có probe nào wedged vì không có
  probe nào chạy.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND173_T4_WEBKIT_QUIET42_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round173-t4/`):**
  `poll-wait-t4-173.sh` (deadline 22:30Z 22/11 + cờ T5
  round173-t5/ + fallback round172-t5/ + nhãn T4-173a),
  `run-attempt-173.sh` (đổi số vòng/đường dẫn/nhãn so với 172,
  lượt yên #42),
  `distinct-seq-173.py` (đợt này CHỈ DÙNG BACK-TEST trên dữ
  liệu 172 — không có live run; khi chạy từ
  `apps/web/scripts/` phải truyền `--ledger` trỏ tới sổ vì sổ
  không nằm cùng thư mục — nếu không, helper lỗi
  FileNotFoundError thay vì in số sai, xem §7).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–172, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round173-t4/` — theo đúng mẫu 149–172: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round173-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–172).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-173.sh`, `run-attempt-173.sh`,
  `t4-attempt-inner.sh` (W = round173-t4 + glob check nhiễu
  chéo round173-*), `check-classb-t4.sh` (W = round173-t4),
  10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-173.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer GIỮ NGUYÊN cộng dồn 36 lượt — P1 143/146, P2
  137/137, P3-A1 123/146, P3' 108/118 = 96/100, P7 70/70;
  chuỗi median n=36 mean 48,2 — vì đợt này 0 lượt hợp lệ,
  không có số mới để cập nhật),
  `distinct-seq-173.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, GIỮ as-of-172:
  96/100 distinct, occ 108/118, valid_rounds_p3 24,
  non_dat_in_union [242, 283, 364, 498] — KHÔNG thăng cấp
  đợt này vì 0 lượt hợp lệ),
  `distinct-seq-ledger-173-backtest172-proposed.json` (bản
  helper ghi ra trong back-test — chỉ khác sổ as-of-172 ở
  `as_of_round` 173 + khóa per_round '173' thay '172', nội
  dung số liệu giống hệt — giữ làm audit trail),
  `distinct-seq-173-backtest172.txt` (output helper back-test —
  KHỚP live 172),
  `preflight-173.txt` + `preflight-postboot-173.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1
  + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4 + F-170-T4-1
  + F-171-T4-7 + F-172-T4-1/2).
- **Log/evidence (hidden_files/round173-t4/, không stage):**
  `poll-t4.log` (26 poll instance 2 + 117 poll instance 3 +
  0 CUA YEN MO + HET HAN 22:30Z exit 5, 0 REBOOT PHAT HIEN
  trong instance 3 — reboot phát hiện bằng kiểm tay),
  `poll-test-173.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log` (ghi đè khi khởi
  động lại poller — chỉ còn log instance 3),
  `chain-t4.log` (2 dòng start poller + HET HAN),
  `postboot-t4-173-gate0wait-*.log` (check-only các poll
  #1/#5/#9/... mỗi 4 poll),
  `stats-173-output.txt` (output stats-173.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (10 poll
  instance 2 có blockers — click-test T0 + vite build).
  **KHÔNG có:** JSON probe, classb, analyzer attempt nào
  (0 attempt); không process T4 nào còn sống lúc đóng
  (poller đã thoát 22:30:30Z vì HET HAN; vite :5187 trống,
  curl 000; `/tmp/.X11-unix/` còn X188 — socket của luồng
  khác, KHÔNG phải của T4 vì T4 không mở Xvfb đợt này,
  xem §6 F-173-T4-8).

## 6. Sai số F-173-T4-1..8 (+ nợ cũ)

- **F-173-T4-1 — REBOOT GIỮA PHIÊN GIẾT POLLER + WAITER
  (lần đầu poller chết theo reboot — T4 khởi động lại tay,
  0 thiệt hại về ngân sách).** Boot dd08464a chết
  ~21:01:15Z; poller pid 12832 + waiter nền của T4 cùng bị
  giết (waiter báo SIGTERM). T4 phát hiện bằng kiểm tay lúc
  21:02:07Z (boot mới 4ae2d2ea, btime 21:01:15Z) và khởi
  động lại poller 21:02:28Z (pid 3151). Không attempt nào đã
  chạy nên ngân sách 0/3 còn nguyên; poll log instance 2
  còn nguyên trên đĩa (append tiếp, không mất). Bài học:
  poller KHÔNG tự hồi sau reboot — agent phải kiểm và khởi
  động lại tay; lần sau nếu waiter bị SIGTERM thì kiểm boot
  ngay thay vì chờ. Nợ đứng: ghi mục này vào checklist
  pre-flight/đóng đợt cho T4-174.
- **F-173-T4-2 — RAM SẬP KÉO DÀI TRÊN BOOT MỚI: 41/117 POLL
  <500 MB, 90 POLL LIÊN TIẾP <1024 MB (21:22:01–22:29:42Z)
  TRONG KHI LOAD ~0 (không phải lỗi poller — dữ kiện
  headroom/balloon).** Sau poll #26 (21:21:16Z, RAM 1055
  MB), RAM không bao giờ trở lại ≥1024; RAM<500 lần đầu
  #36 (21:28:47Z, 476 MB); chuỗi <500 dài nhất 13 poll
  (#68–#80); 10 poll cuối RAM 490–513 MB với load1
  0,02–0,09. T9 sampler độc lập xác nhận balloon ~6,4M kB
  cuối phiên. Đây là lần đầu RAM<500 xuất hiện kể từ đợt
  167 — phá chuỗi sạch 5 đợt (168–172). T4 không kết luận
  nguyên nhân balloon (thuộc T9-173); chỉ ghi: gate RAM
  ≥1024 giữ nguyên theo quyết parent đợt 132, KHÔNG hạ
  ngưỡng để vớt lượt.
- **F-173-T4-3 — POSTBOOT_PASS #84? Ở MODE REPAIR-SỚM
  (KHÔNG PHẢI REPLAY-ĐẦY-ĐỦ — KHÔNG PHẢI SAI SỐ, CHỈ GHI
  NHẬN + CAVEAT CHO GATE).** Cờ T5-173 viết 21:27:05Z ở
  mode repair-sớm-quyết-h (poll=1, dpkg 795, cache 110,
  lists 75) vì replay host-side KHÔNG CHẠY trên boot
  4ae2d2ea (dpkg giữ 2 dòng suốt poll #1–#33). Gate0=T5 từ
  poll #34. Tiền lệ: #75 và #81 mode repair đã được chấp
  nhận cho gate (quyết (j)/(b) đợt 168, quyết đợt 172).
  Đợt này cờ repair KHÔNG mở được cửa nào (RAM đã sập
  trước) nên giá trị gate của nó chỉ còn ý nghĩa hồ sơ.
  T4 chỉ ghi dữ kiện, KHÔNG tự kết luận giá trị gate
  repair-mode cho chuỗi FULL PASS — giao T10-173 + parent
  quyết.
- **F-173-T4-4 — STATS "GAN-MO" ĐẾM 34 ≠ MỞ CỬA THẬT 0
  (heuristic đếm thừa — lần thứ hai liên tiếp, poller vẫn
  đúng).** `stats-173.py` đếm "gan-mo" = load1<2 + load5<2
  + RAM≥1024 đồng thời, KHÔNG kiểm gate0/apt/PB/lock/
  blockers: ra 34 (13 poll instance 2 + 21 poll instance 3)
  trong khi 0 poll mở cửa thật. Mọi poll "gan-mo" đều bị
  chặn bởi gate0 khong-dat (phần lớn), apt=1, lock=co, hoặc
  blockers>0. Đợt 172 cũng lệch (6 vs 1). Poller không sai
  (chỉ mở khi đủ MỌI điều kiện). Ghi nhận để T10 kiểm: số
  "gan-mo" trong §A KHÔNG được dùng làm số cửa mở — số
  đúng là 0.
- **F-173-T4-5 — `grep -c "^poll #"` ĐẾM 153 ≠ 144 POLL THẬT
  (9 dòng snapshot blockers — cùng họ F-173-T4-4, poller
  vẫn đúng).** `poll-t4.log` có 153 dòng bắt đầu bằng
  `poll #`: 144 dòng chi tiết poll thật + 9 dòng
  `poll #N ... blockers=N (...) — snapshot da luu ...`
  (poll #2/#4–#11/#14 instance 2). Stats script chỉ đếm
  dòng chi tiết (regex `^poll #(\d+) (\S+) boot=`) nên
  144 là số đúng; grep thô đếm thừa 9. Ghi nhận để T10
  kiểm: đếm poll phải dùng regex chi tiết, không dùng
  `grep -c "^poll #"`.
- **F-173-T4-6 — DPKG.LOG BOOT CŨ GHI 20:35:41Z — 9m54s SAU
  BTIME (quan sát, không phải sai số).** Boot dd08464a
  btime 20:25:47Z nhưng 2 dòng `startup packages configure`
  trong dpkg.log mang timestamp 20:35:41Z — đúng lúc
  replay apt-get update (pid 822) bắt đầu. Khác mẫu #81
  (dpkg 17:02:37–38Z, chỉ ~32s sau btime). Giải thích có
  thể: replay payload khởi động muộn trên boot này (cell
  boot chậm) — T4 chỉ ghi dữ kiện, giao T5/T0 đối chiếu
  thời gian replay bắt đầu trên boot dd08464a.
- **F-173-T4-7 — T0-ROUND173 GIỮ VITE.LOCK + CLICK-TEST
  CHẠY TRONG LÚC POLLER CHỜ GATE (ghi nhận, KHÔNG vi phạm
  — ngoài cửa sổ attempt vì không có attempt).**
  Instance 2 poll #4–#11 + #14: lock=co (thread=t0-round173,
  pid 19628 rồi 33440, port 5560) + blockers 1–4
  (clicktest-87o8-mask-track-webkit.mjs + vite :5560 +
  MiniBrowser/WebKitNetworkProcess; poll #2 là `vite build`).
  Load1 vọt 6,92 ở poll #4. Vì không có attempt nào nên
  không ảnh hưởng verdict; giao T0/T10 đối chiếu lịch các
  luồng trong cửa sổ 20:43–20:53Z. Nhắc lại: nếu attempt
  mở cửa trong lúc T0 giữ lock thì poller đã chặn đúng
  luật (lock=co chặn cửa).
- **F-173-T4-8 — X188 SOCKET LÚC ĐÓNG KHÔNG PHẢI CỦA T4
  (ghi nhận, không dọn socket của luồng khác).** Sau khi
  poller thoát, `/tmp/.X11-unix/` còn X188 (mtime 22:32Z
  — đúng lúc đóng). T4 đợt này KHÔNG mở Xvfb lần nào (0
  attempt) nên X188 là của luồng khác (suite T1/T8); T4
  không dọn tay (khác F-172-T4-6 khi X193 là của chính T4).
  Giao T8-173 dọn nếu là socket thừa.
- **F-172-T4-1 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  Trước giờ mở poller T4 chỉ dùng `ls`/`grep` hẹp (tìm
  aggregate không dùng `grep -r` toàn cây); T9 b2-spikes
  trong phiên không ghi spike nào do lệnh của T4.
- **F-172-T4-2 — TÁI DIỄN DƯỚI DẠNG F-173-T4-4** (gan-mo
  34 vs mở thật 0 — lần thứ hai liên tiếp; xem trên).
- **F-171-T4-7 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  Kiểm process lúc đóng dùng bracket trick (`pgrep -f
  "poll-wait-t4-173[.]sh"`) — 0 process T4, 0 self-match.
- **F-170-T4-1 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  `cp -a` vẫn báo EPERM nhưng cleanup chạy vô điều kiện
  (không chain `&&`) nên thư mục làm việc sạch đúng 22 file
  trước khi đổi tên script.
- **F-148-T4-1 — KHÔNG ÁP DỤNG đợt này (không có attempt
  hợp lệ để chạy p1p3p7 tay).** Nợ đứng ở mức cơ chế
  (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt có attempt
  hợp lệ T4 phải chạy tay và ghi rõ.

## 7. P3' cộng dồn (KHÔNG ĐỔI — 36 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 173 (KHÔNG ĐỔI): P1 143/146, P2
  137/137, P3-A1 123/146, P3' 108/118 occurrence = 96/100
  distinct-seq, P7 70/70** (36 lượt hợp lệ — #42 KHÔNG CÓ
  lượt hợp lệ nên không cộng thêm gì).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 172 §6: "36 lượt hợp lệ" — nay vẫn 36).
- **Đóng góp lượt #42: 0 occurrence / 0 distinct-seq**
  (không có attempt hợp lệ). Không seq mới, không DAT mới,
  không thay đổi sổ.
- **HELPER distinct-seq ĐÃ BACK-TEST TRƯỚC LIVE (quyết (t)
  đợt 162 + đính chính quyết (i) đợt 163) — KHÔNG CÓ LIVE
  RUN ĐỢT NÀY.** Helper `distinct-seq-173.py` trên stall +
  c2coverage attempt1-172 với sổ as-of-171 (bản
  backtest171-proposed đợt 172) → ra **96/100 distinct,
  108/118 occ** — khớp hệt live 172; bản proposed của
  back-test chỉ khác sổ as-of-172 ở `as_of_round` (173 vs
  172) + khóa per_round ('173' vs '172') với nội dung số
  liệu giống hệt (seen_c2, seen_dat, non_dat_in_union đều
  bằng nhau). **Helper ĐÃ ĐƯỢC KIỂM CHỨNG cho live đợt
  174** (khi có attempt hợp lệ).
  Sổ distinct-seq GIỮ as-of-172 (không thăng cấp): 96/100
  distinct, occ 108/118, valid_rounds_p3 24, non_dat_in_union
  [242, 283, 364, 498].
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — không có dữ kiện mới đợt này** (0
  lượt hợp lệ nên không có mẫu (c2) mới; P1/P3-A1 không
  chạy lại được).
- Chuỗi median tickCost 36 lượt (không đổi): 49,5 / 40,0 /
  52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 /
  58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 /
  39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 /
  42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 / 40,0 /
  43,0 / **46,0 ms** (trung bình 48,2 ms; min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại (không có mẫu
  lag mới).

## 8. Chờ quyết parent / nợ đợt 174

- **(a) #42 KHÔNG CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ
  GIỮ 36.** Từ phía T4, **chân lượt yên cho chuỗi FULL PASS
  (O8) KHÔNG ĐẠT đợt này** (0 attempt) — không phải do
  nhiễm tải mà do cửa không mở (RAM sập sau khi gate0 về).
  O8 đợt này không có lượt yên mới để dựa vào; T8/T10 quyết
  hệ quả cho chuỗi FULL PASS.
- **(b) P3' cộng dồn KHÔNG ĐỔI 36 lượt: P1 143/146, P2
  137/137, P3-A1 123/146, P3' 108/118 = 96/100, P7 70/70:**
  helper đã back-test khớp live 172; sổ distinct-seq GIỮ
  as-of-172. **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  không đổi.
- **(c) REBOOT GIỮA PHIÊN (btime 21:01:15Z, boot 4ae2d2ea —
  ứng viên #84, CHƯA xác minh; boot cũ dd08464a = #83 ĐÃ
  XÁC NHẬN 9 nguồn bởi T0-173, gap #82→#83 = 5.099 s) —
  giao T2-173/T0-174 xác minh số hiệu + 9 nguồn cho boot
  4ae2d2ea + (m) #84; giao T7-173/T2-173 kiểm tra run 172
  có bị viết lại tại reboot này không.** Dữ kiện T4: btime
  cũ 20:25:47Z, btime mới 21:01:15Z (gap 2.128 s); poller mở
  sau reboot mới nên không có poll nào trên boot cũ trong
  instance 3; 0 reboot thêm trong phiên sau khi khởi động
  lại. (m) #83: KHÔNG PHẢI ĐIỂM (T0-173: 0 run sống +
  0 requeue).
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1/F-167-T4-1/F-168-T4-1/F-169-T4-1/3/4/F-170-T4-1/
  F-171-T4-7/F-172-T4-1/2 TIẾP TỤC CHỨNG MINH HIỆU QUẢ —
  giữ làm quy tắc đứng, BỔ SUNG 2 MỤC:** poller chết theo
  reboot thì agent phải kiểm boot + khởi động lại tay ngay
  (F-173-T4-1 — waiter bị SIGTERM là tín hiệu); đếm poll
  phải dùng regex chi tiết, không dùng `grep -c "^poll #"`
  (F-173-T4-5 — đếm thừa 9 dòng snapshot blockers). T4-174
  áp dụng y hệt checklist này + grep thêm số cộng dồn cứng
  trong stats-*.py (F-169-T4-3) + lệnh kiểm chạy ngoài echo
  (F-169-T4-1) + kiểm poller thoát bằng chain log, không dùng
  pgrep -f (F-169-T4-4).
- **(e) POSTBOOT_PASS cho boot mới 4ae2d2ea ĐÃ CÓ (21:27:05Z,
  boot+25m50s, mode repair-sớm-quyết-h, poll=1): GHI NHẬN +
  CAVEAT.** Đây là cờ REPAIR, KHÔNG phải replay-đầy-đủ
  (dpkg nhảy 2→795 một bước; không receipt). Tiền lệ #75/#81
  mode repair đã được chấp nhận cho gate — T4 ghi dữ kiện,
  T10/parent quyết giá trị gate này cho chuỗi FULL PASS
  (đợt này cờ không mở được cửa nào nên chỉ còn ý nghĩa
  hồ sơ). Watcher-173b ĐANG CHẠY hay đã dừng lúc T4 đóng —
  giao T5-173 báo cáo.
- **(f) RAM <500 MB: 41/144 poll — SẠCH 5 ĐỢT LIÊN TIẾP
  (168–172) ĐÃ DỨT.** Đợt 172: 0/26, đợt 171: 0/18, đợt 170:
  0/22, đợt 169: 0/13, đợt 168: 0/26 — nay 41/144 (toàn bộ
  trên boot mới 4ae2d2ea; boot cũ 0/26). Ghi nhận để T9-173
  đối chiếu headroom/balloon (balloon ~6,4M kB cuối phiên)
  và điều tra nguyên nhân RAM sập kéo dài 90 poll.
- **(g) (m) #83 KHÔNG PHẢI ĐIỂM (T0-173 đã chốt); (m) #84
  (ứng viên, chưa xác minh số hiệu) + (m) #82 (chưa chốt
  đợt 172) thuộc T2-173 + parent đợt 173; (m) #56 lần 16
  thuộc T2-173;
  FULL128/FULL129 thuộc T2-173; mù #96?/#88? (hole-recheck
  lần 17)/#94?/#95?/#77? giao T2-173; (1c') (f') triển khai
  V1 (T8-173) + replay kiểm lại trên log đợt 172; 84l10
  điều tra riêng + Q3 heartbeat (T8-173); E-177 kết cục
  (T9-173); POSTBOOT_PASS #82 chưa có (T5-173 lo — nay
  boot #82 đã chết, chỉ còn ý nghĩa hồ sơ nếu T5 đã ghi
  trước reboot); #82 có giết holder không (T6-173); prune
  lần 48 (T6-173); checklist (o) (T8-173); H3 chỉ giám sát
  thụ động; birefnet 0 thử lần 27; T2-173/T4-173: không chạy
  script phân tích nặng trong cửa sổ attempt + nhắc T5 không
  probe dpkg trong cửa sổ attempt (đợt này 0 attempt nên
  không có cửa sổ nào — nhắc vẫn đứng cho đợt sau); u2net
  là fallback chính thức; ci-security.yml vẫn 403 chờ user;
  TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ CỬA SỔ ATTEMPT ĐỂ ĐO (0 attempt).**
  dpkg ổn định 795 sau repair (poll #34–#117); replay
  không chạy trong cửa sổ nào (không có cửa sổ attempt).
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate KHÔNG MỞ lần
  nào đợt này (0 attempt trên cả 2 boot) → **KHÔNG CÓ
  lượt yên hợp lệ #42 cho chuỗi FULL PASS**. T8 tự quyết O8
  đợt này (không có chân lượt yên mới).

## A. Phụ lục số liệu (script trích từ log gốc — stats-173.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-173.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-22T20:42:37Z - 2026-11-22T20:42:37Z, boot=dd08464a
   RAM min=1005 max=1005 >=1024: 0/1 500-1023: 1/1 <500: 0/1
   load1<2: 1/1 load5<2: 1/1 blockers>0: 0 apt>0: 1
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 26 poll, 2026-11-22T20:42:43Z - 2026-11-22T21:01:36Z, boot=dd08464a
   RAM min=559 max=1856 >=1024: 19/26 500-1023: 7/26 <500: 0/26
   load1<2: 20/26 load5<2: 20/26 blockers>0: 10 apt>0: 17
   gate0: khong-dat=26
   lock: co=9, khong=17
   dpkg 2->438
   chuoi RAM<500 dai nhat: 0 poll
-- instance 3: 117 poll, 2026-11-22T21:02:28Z - 2026-11-22T22:29:42Z, boot=4ae2d2ea
   RAM min=429 max=2542 >=1024: 26/117 500-1023: 50/117 <500: 41/117
   load1<2: 113/117 load5<2: 117/117 blockers>0: 0 apt>0: 18
   gate0: T5=84, khong-dat=33
   lock: khong=117
   dpkg 2->795
   chuoi RAM<500 dai nhat: 13 poll
-- TONG poll that: 144
-- RAM toan phien: min=429 max=2542 >=1024: 45/144 <500: 41/144
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 34/144
   gan-mo? #10 2026-11-22T20:49:32Z boot=dd08464a RAM=1194 L1=0.76 L5=1.88 blk=1 apt=2 gate0=khong-dat lock=co t5=cu(mtime-cu)
   gan-mo? #12 2026-11-22T20:51:04Z boot=dd08464a RAM=1856 L1=0.52 L5=1.49 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #13 2026-11-22T20:51:49Z boot=dd08464a RAM=1733 L1=1.16 L5=1.54 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #15 2026-11-22T20:53:20Z boot=dd08464a RAM=1824 L1=1.62 L5=1.67 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #16 2026-11-22T20:54:05Z boot=dd08464a RAM=1735 L1=0.82 L5=1.45 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #17 2026-11-22T20:54:50Z boot=dd08464a RAM=1603 L1=0.61 L5=1.31 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #18 2026-11-22T20:55:35Z boot=dd08464a RAM=1440 L1=1.08 L5=1.34 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #19 2026-11-22T20:56:20Z boot=dd08464a RAM=1313 L1=1.66 L5=1.40 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #20 2026-11-22T20:57:05Z boot=dd08464a RAM=1222 L1=0.98 L5=1.25 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #21 2026-11-22T20:57:50Z boot=dd08464a RAM=1141 L1=1.31 L5=1.31 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #22 2026-11-22T20:58:36Z boot=dd08464a RAM=1257 L1=1.27 L5=1.29 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #23 2026-11-22T20:59:21Z boot=dd08464a RAM=1095 L1=0.76 L5=1.16 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #5 2026-11-22T21:05:28Z boot=4ae2d2ea RAM=2199 L1=1.65 L5=1.61 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #6 2026-11-22T21:06:14Z boot=4ae2d2ea RAM=2062 L1=1.17 L5=1.50 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #7 2026-11-22T21:06:59Z boot=4ae2d2ea RAM=2542 L1=1.34 L5=1.51 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #8 2026-11-22T21:07:44Z boot=4ae2d2ea RAM=2384 L1=1.97 L5=1.67 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #9 2026-11-22T21:08:29Z boot=4ae2d2ea RAM=2208 L1=1.60 L5=1.62 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #10 2026-11-22T21:09:14Z boot=4ae2d2ea RAM=2085 L1=0.97 L5=1.44 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #11 2026-11-22T21:09:59Z boot=4ae2d2ea RAM=1836 L1=0.84 L5=1.34 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #12 2026-11-22T21:10:44Z boot=4ae2d2ea RAM=1696 L1=0.40 L5=1.15 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #13 2026-11-22T21:11:30Z boot=4ae2d2ea RAM=1806 L1=1.04 L5=1.22 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #14 2026-11-22T21:12:15Z boot=4ae2d2ea RAM=1741 L1=1.14 L5=1.22 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #15 2026-11-22T21:13:00Z boot=4ae2d2ea RAM=2105 L1=1.11 L5=1.19 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #16 2026-11-22T21:13:45Z boot=4ae2d2ea RAM=2506 L1=0.77 L5=1.10 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #17 2026-11-22T21:14:30Z boot=4ae2d2ea RAM=2144 L1=0.36 L5=0.94 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #18 2026-11-22T21:15:15Z boot=4ae2d2ea RAM=2013 L1=0.17 L5=0.81 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #19 2026-11-22T21:16:00Z boot=4ae2d2ea RAM=2082 L1=0.08 L5=0.69 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #20 2026-11-22T21:16:45Z boot=4ae2d2ea RAM=1883 L1=0.33 L5=0.66 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #21 2026-11-22T21:17:30Z boot=4ae2d2ea RAM=1696 L1=0.67 L5=0.73 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #22 2026-11-22T21:18:16Z boot=4ae2d2ea RAM=1556 L1=0.42 L5=0.66 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #23 2026-11-22T21:19:01Z boot=4ae2d2ea RAM=1421 L1=0.24 L5=0.58 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #24 2026-11-22T21:19:46Z boot=4ae2d2ea RAM=1328 L1=0.67 L5=0.61 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #25 2026-11-22T21:20:31Z boot=4ae2d2ea RAM=1105 L1=0.50 L5=0.57 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #26 2026-11-22T21:21:16Z boot=4ae2d2ea RAM=1055 L1=0.37 L5=0.53 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
-- boot 4ae2d2ea: 117 poll; RAM>=1024 lan cuoi: 2026-11-22T21:21:16Z #26; RAM<1024 lan dau: 2026-11-22T21:22:01Z #27 RAM=998
-- boot dd08464a: 27 poll; RAM>=1024 lan cuoi: 2026-11-22T20:59:21Z #23; RAM<1024 lan dau: 2026-11-22T20:42:37Z #1 RAM=1005
-- cong don P3' (MOI, 36 luot hop le): P1 143/146 P2 137/137 P3-A1 123/146 P3' 108/118 occ = 96/100 distinct-seq P7 70/70
-- chuoi median 36 luot: n=36 mean=48,2 min=39,0 max=60,0 vuot-60: 0
```
