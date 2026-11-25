# PHASE9_ROUND174_T4_WEBKIT_QUIET43_LIMITS.md

**Đợt:** 174. **Luồng:** T4 — đo lượt yên WebKit #43 trên 1 boot
+ **#43 CÓ LƯỢT HỢP LỆ — attempt2-3c704685 (20/20 + lớp B 5/5 +
  tickCost median 44,5 ms ≤60). CHUỖI LƯỢT YÊN HỢP LỆ 36 → 37.**
  Attempt1 PAGE-WEDGED sau pass 3 (3/20 pass, probe exit 2 —
  partial, KHÔNG tính verdict, retry đúng luật); attempt2 chạy
  ngay sau retry-wait (cửa mở lại poll #37, RAM 1969 MB) và
  PASS sạch. Ngân sách dùng 2/3.
+ **CỘNG DỒN MỚI (37 lượt hợp lệ): P1 150/153, P2 144/144,
  P3-A1 126/153, P3' 113/125 occurrence = 99/104 distinct-seq,
  P7 71/71.** Sổ distinct-seq ĐÃ THĂNG CẤP as-of-174
  (md5 `18e3c0c545ef28d7f42a79e7a01d88ac`; valid_rounds_p3 25;
  non_dat [242, 260, 283, 364, 498] — thêm 260).
+ **BOOT 3c704685 — CỜ REPAIR-TAY-T5, KHÔNG PHẢI REPLAY-ĐẦY-ĐỦ.**
  POSTBOOT_PASS viết 23:46:57Z (boot+47m21s), mode repair-tay-T5,
  poll=1, dpkg 1731 — replay host-side cài tới 1731 dòng nhưng
  thiếu 2 gói apt + libEGL.so.1, T5 repair tay mới đủ. Cờ thứ năm
  liên tiếp có caveat "không replay" (#75/#81/#84 + #85).
+ **RAM <500 MB: 3/38 poll** (đợt thứ hai liên tiếp có poll <500,
  sau 41/144 đợt 173; chuỗi sạch 168–172 đã dứt từ đợt 173).
  RAM dao động cực mạnh trong phiên: 382 → 1969 MB.
**Ngày:** 22–23/11/2026 (lượt cron 06:35 +07 23/11 = 23:35:51Z 22/11).
**Boot đo:** MỘT boot duy nhất — 3c704685 (btime 22:59:36Z, ứng viên
#85 — T7-173 đã xác minh 9 nguồn sơ bộ; số hiệu chờ T0-174 xác nhận).
**Trạng thái:
#43 CÓ LƯỢT HỢP LỆ (attempt2-3c704685, 20/20 pass, lớp B DAT 5/5,
tickCost median 44,5 ms). Chuỗi lượt yên hợp lệ 36 → 37.
Cộng dồn MỚI: P1 150/153, P2 144/144, P3-A1 126/153,
P3' 113/125 occ = 99/104 distinct-seq, P7 71/71.
Ngân sách dùng 2/3 (attempt1 wedged — partial, không tính verdict;
attempt2 hợp lệ). POSTBOOT_PASS cho boot 3c704685 ĐÃ CÓ
(23:46:57Z, mode repair-tay-T5, poll=1 — KHÔNG phải replay-đầy-đủ);
watcher-174 của T5 sở hữu. KHÔNG có reboot trong phiên đo.
0 B2 spike trong cả hai cửa sổ attempt.**

## 0. Verdict tổng

- **#43 CÓ LƯỢT HỢP LỆ (attempt2-3c704685).**
  Poll #36 (00:07:44Z) mở cửa lần đầu: gate0=T5 + RAM 1068 MB +
  load1 1,50/load5 1,10 + lock khong + blockers 0 + apt 0.
  Attempt1 chạy 00:07:44–00:09:49Z nhưng PAGE-WEDGED sau pass 3
  (3/20 pass, probe exit 2, partial JSON 416.310 B — KHÔNG tính
  verdict, retry đúng luật quyết (h) đợt 149). Retry-wait poll
  lại gate: poll #37 (00:09:49Z) mở cửa ngay (RAM 1969 MB).
  Attempt2 chạy 00:09:49–00:13:52Z: **20/20 pass, lớp B DAT 5/5,
  tickCost median 44,5 ms ≤60** → LUOT HOP LE, poller thoát 0.
- **Hai điều kiện gate CHỈ trùng nhau 2 lần trong cả phiên:**
  (a) gate0=T5 từ poll #10 (23:48:10Z, cờ T5-174 viết 23:46:57Z)
  NHƯNG load5 còn 2,03–3,41 ở poll #10–#17 trong khi RAM còn
  ≥1024 (1041–1911 MB) — cửa đóng vì load5; (b) load5 rơi <2 từ
  ~poll #18 NHƯNG RAM cũng rơi <1024 từ poll #18 (968 MB) và
  giữ <1024 suốt 18 poll liên tiếp (#18–#35, min 382 MB) —
  cửa đóng vì RAM; (c) RAM hồi ≥1024 ở poll #36 (1068 MB) đúng
  lúc load1/load5 đã hạ (1,50/1,10) → cửa mở. Suýt lỡ lần nữa
  như đợt 173, nhưng lần này cửa mở được 2 lần liên tiếp.
- **Poller — 1 instance thật + 1 test, 38 poll thật, 2 lần cửa mở,
  trên 1 boot (0 reboot).** Instance 2: 37 poll
  (23:41:17Z–00:09:49Z), gate0 T5 29 / khong-dat 8, RAM ≥1024:
  19/37, RAM <500: **3/37**, dpkg 1647→1731 (replay cài dần tới
  poll #10 rồi đứng yên sau repair).
- **Chuỗi lượt yên hợp lệ: 36 → 37.** Median tickCost attempt2 =
  44,5 ms (chuỗi 37 lượt: n=37, mean 48,1, min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60).
- **Điều kiện GIỮ NGUYÊN như #42 (quyết (m) đợt 167):**
  ngưỡng gate A RAM ≥1024 MB, load1<2, load5<2, tickCost
  median ≤60 ms, lớp B 5/5, ngân sách 3 attempt/đợt, poll
  45 s — KHÔNG đổi ngưỡng/cadence nào.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NÀO TRONG LÚC
  PROBE PASS CHẠY (wording MỚI theo F-170-T9-9 / quyết (h)
  đợt 170): CÓ 1 VI PHẠM NGOÀI T4 — xem F-174-T4-2.**
  Mọi phân tích của chính T4 (p1p3p7 tay, distinct-seq live,
  stats-174.py, đọc analyzer/log T9) đều làm SAU khi poller
  thoát (từ ~00:14Z). Pre-flight postboot check-only (23:40Z)
  + test poll (23:41:07Z) chạy TRƯỚC khi mở poller, ngoài cửa
  sổ attempt. T4 không chạy probe chạm dpkg nào trong cả phiên
  (chỉ đọc `wc -l` dpkg.log + `pgrep -x`). Xem §0b + F-174-T4-2.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt1, lúc attempt2, lúc đóng — không đổi; mọi
  poll đều tree=YES).
- **Cờ:** `hidden_files/round174-t4.done` viết ~00:2xZ 23/11
  (trong hạn cờ ~02:00Z, sớm ~1h30m), CÓ NỘI DUNG; boot kiểm
  lần cuối ngay trước khi viết cờ là 3c704685 (F-171-T10-2).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1 + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4 + F-170-T4-1 + F-171-T4-7 + F-172-T4-1/2 + F-173-T4-1/5)

Chạy **trước mọi attempt, trước khi mở poller** (23:38–23:41Z),
ghi vào `hidden_files/round174-t4/preflight-174.txt` — **PASS**:

- **b.json CÓ trong `round174-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156–173 (F-158-T4-1/2 KHÔNG lặp lại).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–173. **vite.t4-temp.config.mjs md5
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
  `2026-11-23 01:30:00 UTC` → epoch **1795397400** =
  2026-11-23T01:30:00Z — khớp đúng hạn cắt poller 01:30Z
  (hạn cờ ~02:00Z = 1795399200, hạn cứng 02:30Z =
  1795401000); không còn sót dạng `22:30`/`23:00Z`/`23:30Z`
  nào trong script mới (grep 0 hit); grep `round173`
  trong mọi script làm việc chỉ còn fallback `round173-t5/`
  (có chủ đích); `round172` 0 hit; `WebKit #42` 0 hit;
  `T4-173a` 0 hit; `default=173` 0 hit.
- **Copy-forward đợt 173 → 174:** deadline poller `22:30Z
  22/11` → `01:30Z 23/11` ở mọi dạng; hạn cờ/cứng trong
  comment `23:00Z`/`23:30Z` → `02:00Z`/`02:30Z`;
  `brief dot 173` → `brief dot 174`;
  `poll-test-173`/`stats-173`/`distinct-seq-173` → 174;
  T5FLAG chính `round174-t5/` + fallback `round173-t5/`;
  **W trong `t4-attempt-inner.sh` / `check-classb-t4.sh` /
  `poll-wait-t4-174.sh` / `run-attempt-174.sh` ĐÃ LÀ
  `round174-t4` ngay sau copy**; `T4-173a` → `T4-174a`
  trong `run-attempt-174.sh`; `default=173` → `default=174`
  trong `distinct-seq-174.py`; `run-attempt-173.sh` →
  `run-attempt-174.sh` ở cả poll-wait lẫn comment;
  `WebKit #42` → `WebKit #43` trong run-attempt;
  glob chống nhiễu chéo trong `t4-attempt-inner.sh`
  `round173-*` → `round174-*`.
  **GREP BẮT ĐƯỢC 1 SÓT** (mẫu F-168-T4-1): 2 dòng echo start
  trong poll-wait vẫn ghi deadline cũ `2026-11-22T22:30:00Z`
  (chỉ là nhãn log — DEADLINE_S đã đúng epoch 1795397400) —
  đã sửa thành `2026-11-23T01:30:00Z` TRƯỚC khi mở poller;
  test poll chạy lại sau khi sửa, exit 7 đúng thiết kế.
- **`cp -a` LẠI BÁO EPERM NHƯNG CLEANUP CHẠY VÔ ĐIỀU KIỆN
  (bài học F-170-T4-1 ĐÃ ÁP DỤNG):** `cp -a round173-t4
  round174-t4` báo `failed to preserve ownership` (EPERM)
  nhưng cleanup `rm` chạy KHÔNG chain `&&` nên vẫn chạy đủ
  (thư mục sạch 22 file trước khi đổi tên script).
- **Freeze check (bài học F-164-T4-1):** thư mục `round173-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-22 23:35:51Z**
  (giờ mở đợt 174); `round172-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ: REPLAY ĐANG CHẠY — GIỐNG MẪU ĐỢT 173 (xem
  F-173-T4-6):** boot 3c704685 (btime 22:59:36Z, tuổi ~39m
  lúc mở), dpkg.log 1647 dòng, hoạt động cuối 23:37:33Z
  (gstreamer1.0-tools vừa cài xong, ~3 phút trước lúc mở);
  `/var/log/apt/` TỒN TẠI; apt-get/dpkg không chạy lúc mở
  (pgrep 0); cờ T5-174 CHƯA CÓ lúc mở (thư mục `round174-t5/`
  trống); cờ T5-173 chỉ ghi boot 4ae2d2ea, mtime 21:27:05Z <
  btime 22:59:36Z — KHÔNG tính cho boot mới (poller bỏ qua
  đúng luật: mtime cũ); postboot check-only chạy tay **exit 1
  FAIL** (thiếu libEGL.so.1 + 2 gói apt chưa cài:
  gstreamer1.0-plugins-bad, gstreamer1.0-gl — xem
  `preflight-postboot-174.log`); gate0 lúc mở là khong-dat,
  phải chờ cờ T5-174 (repair) hoặc replay xong. Đây là TRẠNG
  THÁI GATE, không phải lỗi setup — pre-flight PASS.
- **Test poll (POLL_TEST=1): TEST-POLL-OK (exit 7 đúng thiết kế)** —
  poll #1 RAM 1387 MB (≥1024), load1 1,89/load5 1,07,
  gate0=khong-dat (postboot exit 1, pb_age 0), apt=0,
  dpkg 1647 (xem `poll-test-174.log`, chạy lại sau khi sửa
  nhãn deadline).
  TEST-POLL-OK chỉ in ngay trước `exit 7` trong code nên
  dòng này trong log là bằng chứng exit 7.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`,
  bài học F-171-T4-7).
- **RAM lúc mở DAO ĐỘNG MẠNH (xem F-171-T4-9 — tiếp diễn):**
  avail 439 MB lúc 23:38Z → 418 MB lúc 23:39Z → 1373 MB lúc
  test poll 23:41:07Z → 1275 MB lúc poll #1 23:41:17Z — do
  các luồng khác + replay; poller mở được cửa khi RAM ≥1024
  và load hạ (lần này cửa mở thật 2 lần — xem §1).

## 1. Poller — 38 poll thật, 2 lần cửa mở, trên 1 boot (0 reboot)

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 3c704685
  (23:41:07Z):** poll #1 RAM=1387 MB (≥1024), load1=1,89
  load5=1,07, blockers=0, gate0=khong-dat → cửa đóng
  (chỉ thiếu gate0) → **TEST-POLL-OK exit 7 đúng thiết kế**.
  Poll này nằm trong `poll-test-174.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot 3c704685, 37 poll (23:41:17Z–
  00:09:49Z), 2 lần cửa mở:** RAM ≥1024: 19/37 (min 382,
  max 1969 MB); 500–1023: 15/37; **<500: 3/37**;
  load1<2: 27/37; load5<2: 20/37; gate0: **T5 29,
  khong-dat 8**; lock=khong 32, co 5 (vite.lock của
  T0-round174, port 5560 — xem F-174-T4-7); blockers>0: 4 poll;
  apt>0: 5 poll; dpkg 1647→1731 (replay cài dần tới poll #10
  rồi đứng yên sau repair của T5).
- **Giai đoạn 1 — chờ gate0 (poll #1–#9, 23:41:17–23:47:23Z):**
  RAM ≥1024 ở 9/9 poll (1195–1911 MB); gate0=khong-dat suốt
  giai đoạn (postboot exit 1; repair của T5 chưa xong);
  load1 vọt 5,02–5,87 ở poll #2–#4 (spike B2 của luồng khác —
  xem §3); lock=co + blockers=5 ở poll #5–#7 (T0-round174 giữ
  vite.lock port 5560 + click-test/render); apt>0 ở poll #7
  (apt=2, replay đang cài). Cửa sổ này KHÔNG MỞ ĐƯỢC vì thiếu
  gate0 (và load5 2,00–3,13).
- **Giai đoạn 2 — gate0 về nhưng load5 chặn (poll #10–#17,
  23:48:10–23:53:26Z):** cờ T5-174 xuất hiện ở poll #10
  (23:48:10Z, viết 23:46:57Z); postboot_exit=0 từ poll #10.
  RAM ≥1024 ở 8/8 poll (1041–1699 MB) NHƯNG load5 2,03–3,41
  ở 7/8 poll (chỉ poll #10 load5 2,03 — vẫn >2); load1 cũng
  vọt 4,86–6,09 ở poll #10–#11 (spike B2, xem §3). Cửa sổ vàng
  này KHÔNG MỞ ĐƯỢC vì thiếu load5<2 (và load1<2).
- **Giai đoạn 3 — RAM sập, load đã hạ (poll #18–#35,
  23:54:12Z–00:06:59Z):** RAM<1024 từ #18 (968 MB) và giữ
  <1024 suốt 18 poll liên tiếp; RAM<500 lần đầu ở #30
  (00:03:58Z, 403 MB), chuỗi <500 dài nhất 3 poll (#30–#32,
  382–403 MB); load1/load5 lúc này đều đẹp (0,29–2,00 /
  0,69–1,12). Cửa sổ này KHÔNG MỞ ĐƯỢC vì thiếu RAM.
- **Giai đoạn 4 — cửa mở 2 lần (poll #36–#37):** RAM hồi
  1068 MB ở #36 (00:07:44Z) đúng lúc load1/load5 đã hạ
  (1,50/1,10) → **CỬA MỞ, attempt1 chạy ngay**; retry-wait
  poll #37 (00:09:49Z) RAM 1969 MB, load1 1,31/load5 1,41 →
  **CỬA MỞ LẠI, attempt2 chạy ngay**. Poller thoát 0 sau
  attempt2 hợp lệ (00:13:52Z), trước hạn cắt 01:30Z tới 76 phút.
- **Phân rã 38 poll thật:** RAM≥1024: 20/38; RAM 500–1023:
  15/38; RAM<500: **3/38**. load1<2: 28/38; load5<2: 21/38.
  **Stats "gan-mo" đếm 3 vs mở cửa thật 2 (xem F-174-T4-4):**
  heuristic chỉ kiểm load1<2 + load5<2 + RAM≥1024 mà KHÔNG
  kiểm gate0/apt/PB/lock/blockers — poll test #1 (23:41:07Z)
  bị đếm "gan-mo" dù là test poll (gate0 khong-dat, cửa không
  mở); 2 poll còn lại (#36, #37) chính là 2 lần mở cửa thật.
  Poller vẫn đúng (chỉ mở khi đủ MỌI điều kiện).
  gate0: T5 29 poll, khong-dat 9 poll (8 instance 2 + 1 test),
  T4-check-only 0 poll (check-only FAIL tới poll #10 nên không
  có poll nào đi qua đường dự phòng trước khi cờ T5 có; sau
  #10 cờ T5 đã là chính).
  blockers>0: 4 poll (#5/#6/#7/#9 — toàn T0-round174).
  apt>0: 5 poll. **RAM <500 MB: 3/38 poll** — đợt thứ hai liên
  tiếp có poll <500 (đợt 173: 41/144; đợt 172 trở về trước:
  0). Ghi nhận để T9-174 đối chiếu headroom/balloon trên boot
  3c704685.

## 2. Attempt — 2 attempt (1 wedged + 1 hợp lệ), ngân sách dùng 2/3

- **Attempt1 — attempt1-3c704685, 00:07:44–00:09:49Z, probe
  exit 2, PAGE-WEDGED sau pass 3 (3/20 pass), partial JSON
  416.310 B — KHÔNG TÍNH VERDICT, RETRY ĐÚNG LUẬT.**
  - Vite lock v2: lấy ticket ngay (chờ 0s), giữ 123s, nhả
    00:09:47Z. Xvfb :193 lên 00:07:49Z (dọn socket X193 mồ côi
    trước). WebKit 27.2 launch OK, app boot OK, C2 draw log BAT.
  - Pass 1–3 chạy xong (pass 3: 37 khung rAF, 37 đo được,
    wall 3340 ms); partial JSON ghi sau pass 2 (2/20) rồi sau
    pass 3 (3/20) — tickCost n=49 median 45,0, blendTick n=40,
    c2DrawLog n=97.
  - Sau pass 3, **cả 3 lần fetch writePartial đều TIMEOUT 30 s**
    (tickCost 00:08:12→00:08:42Z, blendTick 00:08:47→00:09:12Z,
    c2DrawLog 00:09:17→00:09:42Z — mỗi lần HB129 báo elapsed
    5s/10s/15s/20s/25s/30s rồi timeout, giữ dữ liệu cũ không ghi
    đè) → probe kết luận trang wedged, tự thoát sau pass 3,
    không chạy pass tiếp theo. Partial JSON 3/20 đã ghi.
    (c2) seqs = [] (không có seq để kiểm coverage — coverage
    check trống); P3' không tính được ((c2)=0).
  - Lớp B attempt1: **DAT 5/5** (sampler n=59, load1 max 3,11,
    RAM min 671 MB max 1470 MB, 0 mẫu <500 MB, 8/59 mẫu
    <1024 MB; load5 cuối 1,42; boot không đổi; dpkg delta 0;
    apt/dpkg = 0). Wedge KHÔNG phải do nhiễm tải theo lớp B —
    nguyên nhân renderer-side chưa xác định (xem F-174-T4-1).
    **Lưu ý B2:** ps-before/after bắt được `m56-174.py` của T2
    chạy trong cửa sổ attempt1 (xem F-174-T4-2).
  - Poller đánh giá: partial (có JSON 416.310 B, exit=2 —
    wedged/timeout, KHÔNG tính verdict) → RETRY, còn 2 lượt.
- **Attempt2 — attempt2-3c704685, 00:09:49–00:13:52Z,
  LUOT HOP LE (20/20 + lớp B 5/5 + tickCost median 44,5 ms).**
  - Vite lock v2: cooldown 13.247 ms sau nhả attempt1, lấy
    ticket (chờ 13s), giữ 207s, nhả 00:13:29Z. Xvfb :193 lên
    00:10:05Z (dọn socket X193 mồ côi trước). WebKit 27.2,
    app boot OK. Pass 20 xong 00:11:26Z (35 khung rAF, 35 đo
    được, wall 2935 ms); partial JSON 20/20 ghi 00:11:27Z
    (tickCost n=633, blendTick n=511, c2DrawLog n=1231).
  - Probe exit 0; JSON 3.503.322 B; flip afterPass=5,
    wallMs=25526; tickCost total n=634 median=**44,5** p90=68,0
    max=96 min=28; hậu flip+2000ms n=463 median=44,0.
    BlendTick/pass=25,6; rAF/pass median=38 (min 31, max 45).
    pageErrs=[].
  - Lớp B attempt2: **DAT 5/5** (sampler n=101, load1 max 1,69,
    RAM min 1091 MB max 1918 MB, 0 mẫu <500 MB, **0/101 mẫu
    <1024 MB**; load5 cuối 0,97; boot không đổi; dpkg delta 0;
    apt/dpkg = 0). Ps-before/after: chỉ vite của chính T4 —
    sạch (xem F-174-T4-2).
  - Per-pass (20 pass): tick median 38,0–51,0 ms; wall
    2898–3530 ms; load1 mean 0,94–1,69; RAM mean 1098–1387 MB.
    Tương quan Pearson: median~load1_mean r=-0,14;
    median~RAM_mean r=-0,18 (chỉ mô tả, không kết luận nhân quả).
  - **(c2) 7/7 covered** (labellag skippedLatest=0: (c) dang
    ngo n=7, (c2) dang ngo that n=7; seqs
    [189, 219, 259, 260, 260, 343, 417], lag +1f ×4, +2f ×1,
    +4f ×2, 0 lag âm; xem §7).
- **Ngân sách dùng 2/3.** Không attempt nào bị reboot giết
  (0 reboot trong phiên); 1 attempt còn lại chưa dùng.

## 3. B2 spike / đối chiếu sampler T9 (theo nhiệm vụ đợt 174)

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT HỢP LỆ (attempt2,
  00:09:49–00:13:52Z): 0 SPIKE.** T9 `b2-spikes.log` ghi **9
  spike** trong phiên, tất cả đều 23:42:06–23:49:49Z (load1
  tới 7,03 lúc 23:43:15Z) — **tất cả đều NGOÀI cả hai cửa sổ
  attempt** (attempt1 00:07:44–00:09:49Z cũng 0 spike).
  Trong cửa sổ attempt2, sampler T9: load1 1,58 → 0,40
  (00:09:37–00:13:37Z), mem 1.391.496 → 1.609.460 kB —
  KHỚP poller T4 (load1 max 1,69, RAM min 1091 MB) và
  perpass (load1 mean 0,94–1,69).
- **9 spike ngoài attempt — quy driver (đọc log T9):**
  cụm 23:42:06–23:44:26Z (5 spike, load1 tới 7,03 — render
  node của luồng khác + T0) và cụm 23:48:02–23:49:49Z
  (4 spike, load1 tới 5,89 — T5 repair + watcher). Cả hai
  cụm đều rơi vào lúc poller đang chờ gate (chưa có attempt)
  nên không ảnh hưởng verdict; chúng GIẢI THÍCH vì sao load5
  chặn cửa ở giai đoạn 2 (§1).
- **Đối chiếu sampler T9 (độc lập):** sampler T9 (60 s/mẫu)
  trong cửa sổ phiên: RAM min ~382 MB (khớp poller T4 min
  382 MB); balloon ~4,7–5,2M kB trong cửa sổ attempt2
  (thấp hơn ~6,4M kB cuối phiên đợt 173). Phân tích
  balloon/headroom thuộc T9-174; T4 chỉ ghi số đo phía poller.

## 4. Replay/postboot trên boot mới — cờ T5-174 ĐÃ CÓ (23:46:57Z, mode repair-tay-T5); 0 reboot trong phiên

- **Boot 3c704685 (btime 22:59:36Z, ứng viên #85 — CHƯA xác
  minh số hiệu; T0-174 xác minh 9 nguồn): replay host-side
  CHẠY MỘT PHẦN rồi DỪNG.** Lúc T4 mở (23:38Z): dpkg.log
  1647 dòng, hoạt động cuối 23:37:33Z (gstreamer1.0-tools);
  apt-get/dpkg không chạy. dpkg tăng 1647→1731 tới poll #10
  (23:48:10Z) rồi ĐỨNG YÊN 1731 suốt phần còn lại — replay
  cài được phần lớn nhưng thiếu 2 gói apt
  (gstreamer1.0-plugins-bad, gstreamer1.0-gl) + libEGL.so.1
  (preflight postboot check-only exit 1 lúc 23:40Z). T5 repair
  tay xong, verify độc lập exit 0.
  Theo cờ T5-174: watcher-174 + T5 manual repair,
  **POSTBOOT_PASS mới viết 23:46:57Z (boot+47m21s; dpkg 1731
  dòng; cache 175 .deb; lists 75; postboot PASS poll1 độc lập
  exit 0 lúc 23:46:25Z; mode repair-tay-T5; cờ cũ 4ae2d2ea lưu
  POSTBOOT_PASS-4ae2d2ea)**. Gate0=T5 từ poll #10.
  **CAVEAT: cờ repair, KHÔNG phải replay-đầy-đủ** — không có
  receipt replay đầy đủ (giống #75/#81/#84). Tiền lệ: #75 và
  #81 mode repair đã được chấp nhận cho gate (quyết (j)/(b)
  đợt 168 và quyết đợt 172). **KHÁC đợt 173: cờ repair lần
  này MỞ ĐƯỢC CỬA (2 lần, poll #36/#37) và cho lượt yên hợp
  lệ #43** — giá trị gate của cờ này đợt này là thật, không
  chỉ hồ sơ. T4 chỉ ghi dữ kiện, KHÔNG tự kết luận giá trị
  gate repair-mode cho chuỗi FULL PASS — giao T10-174 +
  parent quyết.
- **KHÔNG có reboot trong phiên đo hay lúc đóng:**
  boot 3c704685 lúc mở poller (23:41:17Z), lúc attempt1
  (00:07:44Z), lúc attempt2 (00:09:49Z), lúc poller thoát
  (00:13:52Z) và lúc kiểm cuối (~00:20Z) — btime 22:59:36Z
  không đổi; 0 dòng REBOOT PHAT HIEN trong poll log.
  (Khác đợt 173: reboot #84 giết poller giữa phiên — đợt này
  0 reboot, poller chạy 1 instance duy nhất tới đích.)
- **85m4 / 86n2 / 84l10: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Đây là verdict của harness T8, T4 không đo và không suy
  đoán — giao T8-174 báo cáo. (T4 chỉ ghi: 0 kẹt quan sát
  được trong attempt2 hợp lệ; attempt1 wedged là probe-side,
  không phải harness — xem F-174-T4-1.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND174_T4_WEBKIT_QUIET43_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round174-t4/`):**
  `poll-wait-t4-174.sh` (deadline 01:30Z 23/11 + cờ T5
  round174-t5/ + fallback round173-t5/ + nhãn T4-174a),
  `run-attempt-174.sh` (đổi số vòng/đường dẫn/nhãn so với 173,
  lượt yên #43),
  `distinct-seq-174.py` (đợt này ĐÃ DÙNG LIVE trên dữ liệu
  attempt2 — xem §7; khi chạy từ `apps/web/scripts/` phải
  truyền `--ledger` trỏ tới sổ vì sổ không nằm cùng thư mục —
  nếu không, helper lỗi FileNotFoundError thay vì in số sai).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–173, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round174-t4/` — theo đúng mẫu 149–173: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round174-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–173).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-174.sh`, `run-attempt-174.sh`,
  `t4-attempt-inner.sh` (W = round174-t4 + glob check nhiễu
  chéo round174-*), `check-classb-t4.sh` (W = round174-t4),
  10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-174.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer ĐÃ CẬP NHẬT cộng dồn 37 lượt — P1 150/153, P2
  144/144, P3-A1 126/153, P3' 113/125 = 99/104, P7 71/71;
  chuỗi median n=37 mean 48,1),
  `distinct-seq-174.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-174: 99/104 distinct, occ 113/125, valid_rounds_p3 25,
  non_dat_in_union [242, 260, 283, 364, 498] — thêm 260;
  md5 `18e3c0c545ef28d7f42a79e7a01d88ac`),
  `distinct-seq-ledger-174-proposed.json` (bản helper ghi ra
  trong live run — ĐÃ DÙNG để thăng cấp sổ; giữ làm audit trail),
  `preflight-174.txt` + `preflight-postboot-174.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1
  + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4 + F-170-T4-1
  + F-171-T4-7 + F-172-T4-1/2 + F-173-T4-1/5).
- **Log/evidence (hidden_files/round174-t4/, không stage):**
  `poll-t4.log` (37 poll instance 2 + 2 CUA YEN MO + 0 REBOOT
  PHAT HIEN),
  `poll-test-174.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log` (log poller),
  `chain-t4.log` (start poller + 2 CUA YEN MO + attempt1
  PAGE-WEDGED + attempt2 LUOT HOP LE),
  `postboot-t4-174-gate0wait-*.log` (check-only các poll
  #1/#5/#9/... mỗi 4 poll),
  `stats-174-output.txt` (output stats-174.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (4 poll có
  blockers — #5/#6/#7/#9, T0-round174 + vite build),
  `preview-b-f3-flip-webkit-t4-attempt1-3c704685.json`
  (416.310 B, partial 3/20, probe exit 2),
  `preview-b-f3-flip-webkit-t4-attempt2-3c704685.json`
  (3.503.322 B, 20/20, probe exit 0),
  `classb-t4-attempt1-3c704685.txt` +
  `classb-t4-attempt2-3c704685.txt` (cả hai DAT 5/5),
  `analyze-t4-attempt2-3c704685-*.txt` (10 analyzer attempt2,
  gồm p1p3p7 chạy TAY — xem F-174-T4-5),
  `analyze-t4-attempt1-3c704685-*.txt` (10 analyzer attempt1,
  c2coverage/p1p3p7 trống vì (c2)=0),
  `coverage-check-attempt1-3c704685.txt` (trống) +
  `coverage-check-attempt2-3c704685.txt` (7/7),
  `load-mid-t4-attempt1-3c704685.log` (n=59) +
  `load-mid-t4-attempt2-3c704685.log` (n=101),
  `run-webkit-t4-attempt1-3c704685.log` (PAGE-WEDGED) +
  `run-webkit-t4-attempt2-3c704685.log` (20/20),
  `ps-before-t4-attempt1-3c704685.txt` +
  `ps-before-t4-attempt2-3c704685.txt`,
  `dpkg-lines-before-attempt*.txt` (cả hai 1731) +
  `apt-history-before-attempt*.txt`,
  `attempt-done-attempt1-3c704685` (exit=2) +
  `attempt-done-attempt2-3c704685` (exit=0).
  File phụ: `analyze-l7-labellag.txt` + `lag5-detail.txt`
  (output mặc định của analyzer labellag/lag5 khi chạy không
  kèm outpath — cùng nội dung với file attempt2 tương ứng).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  00:13:52Z exit 0; vite :5187 trống, curl 000;
  `/tmp/.X11-unix/` còn X194/X195 — socket của luồng khác,
  KHÔNG phải của T4; X193 của chính T4 đã dọn tay lúc đóng,
  xem F-174-T4-8).

## 6. Sai số F-174-T4-1..8 (+ nợ cũ)

- **F-174-T4-1 — ATTEMPT1 PAGE-WEDGED SAU PASS 3 (probe-side,
  không phải harness; retry thành công ngay trên cùng boot).**
  Cả 3 lần fetch writePartial sau pass 3 đều timeout 30 s
  (tickCost, blendTick, c2DrawLog — mỗi lần HB129 báo đủ 5
  mốc 5s→30s rồi timeout, giữ dữ liệu cũ không ghi đè);
  probe tự kết luận trang wedged, thoát sau pass 3 với partial
  JSON 3/20 đã ghi, exit 2. Lớp B attempt1 vẫn DAT 5/5
  (load1 max 3,11, RAM min 671 MB) nên wedge KHÔNG quy được
  cho nhiễm tải theo lớp B. Attempt2 trên cùng boot, cùng cây,
  cùng gate chạy PASS sạch 20/20 ngay sau đó (chỉ cách 0
  phút — retry-wait poll #37 mở cửa ngay) nên wedge là sự cố
  nhất thời renderer-side, không phải hồi quy hệ thống.
  T4 không kết luận nguyên nhân sâu (thuộc probe/harness);
  ghi nhận để T8-174 đối chiếu với kẹt harness (84l10/85m4/
  86n2 — 0 kẹt đợt này theo T8-173, đợt này chờ T8-174).
- **F-174-T4-2 — T2 CHẠY `m56-174.py` TRONG CỬA SỔ ATTEMPT1
  (vi phạm quy tắc đứng — KHÔNG PHẢI T4, T4 chỉ ghi nhận).**
  Ps-before/after của classb attempt1 bắt được 2 process:
  pid 45713 (bash wrapper: `tail -1 poll-t4.log; cd .../round174-t2
  && python3 m56-174.py`) + pid 45715 (`python3 m56-174.py`)
  chạy trong lúc attempt1 (00:07:44–00:09:49Z). Quy tắc đứng
  (nợ mở đợt 173→174): T2/T4 không chạy script phân tích nặng
  trong cửa sổ attempt. Class B attempt1 vẫn DAT 5/5 (load1
  max 3,11 <4) nên không ảnh hưởng verdict attempt1 (vốn đã
  partial vì wedge); KHÔNG kết luận m56 gây ra wedge (chỉ ghi
  trùng thời gian). Cửa sổ attempt2 SẠCH (ps-before/after chỉ
  có vite của chính T4) — lượt hợp lệ không bị vấy bẩn.
  Nhắc lại cho đợt 175: T2 (và mọi luồng) KHÔNG chạy script
  phân tích nặng trong lúc probe pass chạy.
- **F-174-T4-3 — `pgrep -f` TỰ MATCH SHELL EXEC CỦA CHÍNH T4
  (cùng họ F-173-T9-6, bài học F-171-T4-7 chưa đủ).**
  Lúc kiểm đóng, `pgrep -f "poll-wait-t4-174[.]sh"` trả về pid
  50740 — kiểm lại bằng `ps -p` thì pid đã không còn tồn tại:
  đó chính là shell wrapper của lệnh exec đang chạy (cmdline
  của nó chứa chuỗi pattern). Bracket trick `[.]` KHÔNG ngăn
  được self-match dưới exec wrapper này. Bài học: kiểm process
  lúc đóng phải dùng `ps` trực tiếp (hoặc `pgrep -x` theo tên),
  không dùng `pgrep -f` một mình; số "0 process T4" đợt này
  được xác nhận bằng `ps -eo pid,args` (không có poll-wait /
  run-attempt / Xvfb nào) + curl :5187 = 000.
- **F-174-T4-4 — STATS "GAN-MO" ĐẾM 3 ≠ MỞ CỬA THẬT 2
  (heuristic đếm thừa — lần thứ ba liên tiếp, poller vẫn
  đúng).** `stats-174.py` đếm "gan-mo" = load1<2 + load5<2
  + RAM≥1024 đồng thời, KHÔNG kiểm gate0/apt/PB/lock/
  blockers: ra 3 (test poll #1 + #36 + #37) trong khi 2 poll
  mở cửa thật (#36, #37). Test poll #1 bị đếm thừa vì
  heuristic không loại instance test (gate0 khong-dat ở đó).
  Đợt 173 cũng lệch (34 vs 0), đợt 172 cũng lệch (6 vs 1).
  Poller không sai (chỉ mở khi đủ MỌI điều kiện). Ghi nhận
  để T10 kiểm: số "gan-mo" trong §A KHÔNG được dùng làm số
  cửa mở — số đúng là 2.
- **F-174-T4-5 — `p1p3p7` ĐÒI argv[1] LÀ ĐƯỜNG DẪN JSON TRẦN
  (lần chạy tay đầu sai dạng — đã sửa, không mất số liệu).**
  Lần 1 T4 gọi `analyze-t4-p1p3p7.py "T4-174a2=<json>"`
  (theo mẫu tickcost/wallbands) → IndexError (thiếu argv[2]);
  lần 2 truyền đúng `"T4-174a2=<json>" "<seqs>"` →
  FileNotFoundError (script mở argv[1] làm path, không tách
  nhãn `T4-...=`); lần 3 truyền path trần + seqs → exit 0,
  ra P1/P3-A1/P7 (xem §7). Ghi vào checklist T4-175: p1p3p7
  dùng `analyze-t4-p1p3p7.py <json> "<seq1,seq2,...>"`
  (KHÔNG có nhãn T4-...=). F-148-T4-1 (cơ chế script chưa tự
  gọi p1p3p7) vẫn còn ở mức cơ chế — đợt này T4 đã chạy tay
  và ghi rõ.
- **F-174-T4-6 — RAM <500 MB XUẤT HIỆN LẦN THỨ HAI LIÊN TIẾP
  (3/38 poll, đợt 173: 41/144) + DAO ĐỘNG CỰC MẠNH 382→1969 MB.**
  RAM <500 ở poll #30–#32 (403/382/~390 MB, chuỗi dài nhất 3
  poll) trong khi load ~0,3 (máy gần như idle) — cùng mẫu
  balloon đợt 173 (T9 sampler: balloon ~4,7–5,2M kB trong cửa
  sổ attempt2). RAM lúc mở poller 418 MB, test poll 1387 MB,
  poll #1 1275 MB — dao động >900 MB trong 3 phút (F-171-T4-9
  tiếp diễn). T4 không kết luận nguyên nhân balloon (thuộc
  T9-174); chỉ ghi: gate RAM ≥1024 giữ nguyên theo quyết
  parent đợt 132, KHÔNG hạ ngưỡng để vớt lượt.
- **F-174-T4-7 — T0-ROUND174 GIỮ VITE.LOCK + CLICK-TEST/RENDER
  CHẠY TRONG LÚC POLLER CHỜ GATE (ghi nhận, KHÔNG vi phạm —
  ngoài cửa sổ attempt vì chưa có attempt).**
  Poll #5–#9: lock=co (thread=t0-round174, pid 18582,
  port 5560, ticket 1-179539102281) + blockers 5/5/5/1
  (vite :5560 + render node + MiniBrowser/WebKit); poll #2–#4
  load1 vọt 5,02–5,87 (render node luồng khác). Vì chưa có
  attempt nào nên không ảnh hưởng verdict; giao T0/T10 đối
  chiếu lịch các luồng trong cửa sổ 23:42–23:47Z. Nhắc lại:
  nếu attempt mở cửa trong lúc T0 giữ lock thì poller đã chặn
  đúng luật (lock=co chặn cửa — poll #5–#9 chứng minh).
- **F-174-T4-8 — X193 SOCKET LÚC ĐÓNG LÀ CỦA CHÍNH T4 (đã dọn
  tay — khác F-173-T4-8).** Sau khi poller thoát,
  `/tmp/.X11-unix/` còn X193 (mtime 00:10Z — Xvfb :193 của
  attempt2, process đã chết nhưng socket còn) + X194/X195
  (mtime 23:45Z — của luồng khác, giao T8-174 dọn theo
  F-173-T1-2). T4 đã `rm` X193 lúc đóng (00:2xZ); X194/X195
  để nguyên (không dọn socket của luồng khác).
- **F-173-T4-1 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  0 reboot trong phiên nên không có poller chết theo reboot;
  checklist kiểm boot + khởi động lại tay vẫn đứng cho T4-175.
- **F-173-T4-5 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  Đếm poll dùng regex chi tiết (`^poll #(\d+) (\S+) boot=`)
  trong stats-174.py → 38 poll thật; `grep -c "^poll #"` thô
  đếm 42 (thừa 4 dòng snapshot blockers #5/#6/#7/#9) — T4
  không dùng số thô.
- **F-172-T4-1 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  Trước giờ mở poller T4 chỉ dùng `ls`/`grep` hẹp; T9
  b2-spikes trong phiên không ghi spike nào do lệnh của T4.
- **F-172-T4-2 — TÁI DIỄN DƯỚI DẠNG F-174-T4-4** (gan-mo
  3 vs mở thật 2 — lần thứ ba liên tiếp; xem trên).
- **F-171-T4-7 — TÁI DIỄN DƯỚI DẠNG F-174-T4-3** (pgrep -f
  tự match shell exec — xem trên; đã xác nhận bằng ps).
- **F-170-T4-1 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  `cp -a` vẫn báo EPERM nhưng cleanup chạy vô điều kiện
  (không chain `&&`) nên thư mục làm việc sạch đúng 22 file
  trước khi đổi tên script.
- **F-168-T4-1 — TÁI DIỄN NHẸ, ĐÃ SỬA TRƯỚC KHI MỞ POLLER**
  (2 dòng echo start còn deadline cũ `2026-11-22T22:30:00Z` —
  xem §0b; grep bắt được, đã sửa, test poll chạy lại).

## 7. P3' cộng dồn (MỚI — 37 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 174 (MỚI): P1 150/153, P2 144/144,
  P3-A1 126/153, P3' 113/125 occurrence = 99/104
  distinct-seq, P7 71/71** (37 lượt hợp lệ — #43 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 173 §6: "36 lượt hợp lệ" — nay 37).
- **Đóng góp lượt #43 (attempt2-3c704685, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=7 occurrence / 6 distinct-seq [189, 219, 259, 260×2,
  343, 417], trong đó 4 seq MỚI [259, 260, 343, 417] nhưng
  chỉ 3 DAT MỚI [259, 343, 417] (260 KHONG-DAT).
  - **P1 — ĐÚNG 7/7 occ** (cả 7 gần run-end ±1 tick: trong 15
    run_end seqs; baseline 45/373, p=3,71985e-07 — verdict
    ĐÚNG theo luật DEF §3 vì n=7 ≥3 và p<0,01).
    Cộng dồn 143/146 → **150/153**.
  - **P2 ĐÚNG — 7/7 occ** (lag +1f ×4, +2f ×1, +4f ×2; 0 lag
    âm). Cộng dồn 137/137 → **144/144**.
  - **P3-A1 — SAI 3/7 occ** (3/7 seq đóng băng-tại-tick
    [189, 343, 417]; baseline 83/372, p=0,189986 — verdict
    SAI theo luật DEF §5 vì 3/7 <2/3 VÀ p≥0,01). Cộng dồn
    123/146 → **126/153**.
  - **P3' 5/7 occ ĐẠT** (189 stall 7, 219 stall 3, 259 stall 4,
    343 stall 7, 417 stall 3; 260 stall 1 KHONG-DAT ×2).
    Cộng dồn 96/100 → **99/104 distinct** (3 seq DAT MỚI —
    259, 343, 417; 260 mới nhưng KHONG-DAT); occurrence
    108/118 → **113/125**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 41, 0: 42}; đối chứng toàn bộ drawSrc post: {-1: 299,
    0: 163}, 0/462 entry). Cộng dồn 70/70 → **71/71**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–173).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-174.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 173 — nội dung bằng sổ as-of-172 gốc vì đợt 173
  0 lượt hợp lệ: 96/100 distinct, occ 108/118), tính seq
  MỚI = tập hiệu với sổ, in cộng dồn mới distinct +
  occurrence, ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-174-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Live đợt 174:** sổ + stall/c2coverage
  attempt2-3c704685 → **99/104 distinct, 113/125 occ** — khớp
  tính tay độc lập dưới đây. Sổ ĐÃ THĂNG CẤP: as-of 174,
  99/104 distinct, occ 113/125, valid_rounds_p3 25,
  non_dat_in_union [242, 260, 283, 364, 498] (thêm 260 —
  không seq không-DAT cũ nào DAT thêm đợt này; md5 sổ mới
  `18e3c0c545ef28d7f42a79e7a01d88ac`).
  Helper KHÔNG cần back-test riêng đợt này (đã back-test khớp
  live 172 ở đợt 173, và live 174 khớp tính tay — xem dưới).
- **Kiểm chứng seq 189/219/259/260/343/417 đợt 174:**
  helper (đọc sổ) xác nhận **259 + 260 + 343 + 417 MỚI**
  (chưa có trong sổ — seen_c2 96 seq VÀ seen_dat 93 seq đều
  không chứa 4 seq này); **189 + 219 ĐÃ THẤY** (189 DAT đợt
  163, 219 DAT đợt 169). Tính tay: distinct DAT 96 + 3 =
  **99**; distinct tổng 100 + 4 = **104**; occurrence DAT
  108 + 5 = **113**, tổng 118 + 7 = **125**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — có thêm 7 mẫu (c2) mới đợt này:**
  P1 ĐÚNG 7/7 (p=3,7e-07) + P2 ĐÚNG 7/7 + P7 ĐÚNG ủng hộ
  ghost-freeze; P3-A1 SAI 3/7 (p=0,19) và P3' 5/7 (260
  stall 1 ×2 KHONG-DAT) là điểm trừ — cùng mẫu với đợt 172
  (242 stall 1 ×2 KHONG-DAT, P3-A1 vẫn ĐÚNG 5/7 lúc đó).
  Seq 260 xuất hiện 2 lần trong cùng lượt và cả 2 đều stall 1
  — ghi nhận để T2/T10 đối chiếu (260 có phải seq "cứng đầu"
  như 242 không — 242 cũng KHONG-DAT 2 lần đợt 172).
- Chuỗi median tickCost 37 lượt (mới): 49,5 / 40,0 /
  52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 /
  58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 /
  39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 /
  42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 / 40,0 /
  43,0 / 46,0 / **44,5 ms** (trung bình 48,1 ms; min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại (không có mẫu
  lag mới).

## 8. Chờ quyết parent / nợ đợt 175

- **(a) #43 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 36 → 37.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT đợt
  này** (attempt2 hợp lệ trên boot 3c704685, cùng boot T8 chạy
  O8 — nếu O8 PASS thì chuỗi WebKit FULL PASS 24 → 25; T8 tự
  quyết O8).
- **(b) P3' cộng dồn MỚI 37 lượt: P1 150/153, P2 144/144,
  P3-A1 126/153, P3' 113/125 = 99/104, P7 71/71:**
  helper đã dùng live khớp tính tay; sổ distinct-seq ĐÃ THĂNG
  CẤP as-of-174. **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới.
- **(c) BOOT 3c704685 (ứng viên #85, CHƯA xác minh số hiệu) —
  giao T0-174 xác minh 9 nguồn + (m) #85 (T2-174 + parent 174);
  (m) #84 cũng thuộc T2-174 + parent 174; (m) #82 đã CHẤP
  NHẬN đợt 173.** Dữ kiện T4: btime 22:59:36Z, gap #84→#85 =
  7.101 s (theo T7-173); 0 reboot trong phiên T4; run 173
  viết lại lần 2 tại #85 (theo T7-173) — kết cục run 173 thuộc
  T7-174.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1/F-167-T4-1/F-168-T4-1/F-169-T4-1/3/4/F-170-T4-1/
  F-171-T4-7/F-172-T4-1/2/F-173-T4-1/5 TIẾP TỤC CHỨNG MINH
  HIỆU QUẢ — giữ làm quy tắc đứng, BỔ SUNG 3 MỤC:** p1p3p7
  dùng path JSON trần + seqs (F-174-T4-5); kiểm process lúc
  đóng bằng `ps` trực tiếp, không dùng `pgrep -f` một mình
  (F-174-T4-3); T2/mọi luồng KHÔNG chạy script phân tích nặng
  trong cửa sổ attempt (F-174-T4-2 — nhắc lại, đã vi phạm 1
  lần đợt này). T4-175 áp dụng y hệt checklist này + grep
  thêm số cộng dồn cứng trong stats-*.py (F-169-T4-3) + lệnh
  kiểm chạy ngoài echo (F-169-T4-1) + kiểm poller thoát bằng
  chain log, không dùng pgrep -f (F-169-T4-4).
- **(e) POSTBOOT_PASS cho boot 3c704685 ĐÃ CÓ (23:46:57Z,
  boot+47m21s, mode repair-tay-T5, poll=1): GHI NHẬN +
  CAVEAT.** Đây là cờ REPAIR, KHÔNG phải replay-đầy-đủ
  (replay chỉ một phần tới dpkg 1731, thiếu 2 gói apt +
  libEGL; T5 repair tay). Tiền lệ #75/#81/#84 mode repair đã
  được chấp nhận cho gate — **KHÁC đợt 173: cờ này MỞ ĐƯỢC
  CỬA và cho lượt yên hợp lệ** nên T10/parent cần quyết giá
  trị gate của nó cho chuỗi FULL PASS (nếu O8 PASS trên cùng
  boot). Watcher-174 ĐANG CHẠY hay đã dừng lúc T4 đóng —
  giao T5-174 báo cáo.
- **(f) RAM <500 MB: 3/38 poll — ĐỢT THỨ HAI LIÊN TIẾP CÓ POLL
  <500 (đợt 173: 41/144).** Chuỗi sạch 168–172 đã dứt từ
  đợt 173. Ghi nhận để T9-174 đối chiếu headroom/balloon
  (balloon ~4,7–5,2M kB trong cửa sổ attempt2; RAM dao động
  382→1969 MB trong phiên).
- **(g) (m) #84/#85 (T2-174 + parent 174); INSIDE #83/#84/#85
  (T2-174; FULL129/FULL130/FULL131; chuỗi mới dài 1 từ #82);
  mù #96?/#88? (hole-recheck lần 18)/#94?/#95?/#77? (T2-174;
  U cách sàn 29 s — theo dõi sát); (m) #56 lần 17 (T2-174);
  (1c') (f') V1 đã triển khai (T8-173) — đợt này 0 kích hoạt
  mới (0 kẹt harness theo T8-173; đợt này chờ T8-174);
  84l10 điều tra riêng + Q3 heartbeat (T8-174); E-177 KẾT
  THÚC (T9-173) — E-178/179/180 kết thúc (T9-173), episode
  mới trên #85 thuộc T9-174; POSTBOOT_PASS #85 ĐÃ CÓ
  (T5-174 lo — lần này đã có, xem (e)); #85 có giết holder
  không (T6-174); prune lần 49 (T6-174); checklist (o)
  (T8-174); H3 chỉ giám sát thụ động; birefnet 0 thử lần 28;
  T2-174/T4-174: không chạy script phân tích nặng trong cửa
  sổ attempt + nhắc T5 không probe dpkg trong cửa sổ attempt
  (đợt này T2 VI PHẠM 1 lần trong attempt1 — xem F-174-T4-2;
  T5 không vi phạm); u2net là fallback chính thức;
  ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; G1
  chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT (attempt1 +
  attempt2, dpkg delta 0 cả hai).** dpkg ổn định 1731 sau
  repair (poll #10–#37); replay không chạy trong cửa sổ nào.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 2 lần đợt này
  (poll #36/#37) → **CÓ lượt yên hợp lệ #43 cho chuỗi FULL
  PASS** (attempt2, boot 3c704685). T8 tự quyết O8 đợt này
  (cùng boot đo).

## A. Phụ lục số liệu (script trích từ log gốc — stats-174.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-174.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-22T23:41:07Z - 2026-11-22T23:41:07Z, boot=3c704685
   RAM min=1387 max=1387 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 1/1 load5<2: 1/1 blockers>0: 0 apt>0: 0
   gate0: khong-dat=1
   lock: khong=1
   dpkg 1647->1647
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 37 poll, 2026-11-22T23:41:17Z - 2026-11-23T00:09:49Z, boot=3c704685
   RAM min=382 max=1969 >=1024: 19/37 500-1023: 15/37 <500: 3/37
   load1<2: 27/37 load5<2: 20/37 blockers>0: 4 apt>0: 5
   gate0: T5=29, khong-dat=8
   lock: co=5, khong=32
   dpkg 1647->1731
   chuoi RAM<500 dai nhat: 3 poll
-- TONG poll that: 38
-- RAM toan phien: min=382 max=1969 >=1024: 20/38 <500: 3/38
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 3/38
   gan-mo? #1 2026-11-22T23:41:07Z boot=3c704685 RAM=1387 L1=1.89 L5=1.07 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #36 2026-11-23T00:07:44Z boot=3c704685 RAM=1068 L1=1.50 L5=1.10 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #37 2026-11-23T00:09:49Z boot=3c704685 RAM=1969 L1=1.31 L5=1.41 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 3c704685: 38 poll; RAM>=1024 lan cuoi: 2026-11-23T00:09:49Z #37; RAM<1024 lan dau: 2026-11-22T23:54:12Z #18 RAM=968
-- cong don P3' (MOI, 37 luot hop le): P1 150/153 P2 144/144 P3-A1 126/153 P3' 113/125 occ = 99/104 distinct-seq P7 71/71
-- chuoi median 37 luot: n=37 mean=48,1 min=39,0 max=60,0 vuot-60: 0
```
