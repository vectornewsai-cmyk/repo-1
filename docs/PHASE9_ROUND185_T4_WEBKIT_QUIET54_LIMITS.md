# PHASE9_ROUND185_T4_WEBKIT_QUIET54_LIMITS.md

**Đợt:** 185. **Luồng:** T4 — đo lượt yên WebKit #54 trên 1 boot
+ **#54 CÓ LƯỢT HỢP LỆ — attempt1-9161bfd1: 20/20 + lớp B ĐẠT 5/5
  + tickCost median 45,0 ms ≤ 60. CHUỖI LƯỢT YÊN HỢP LỆ 46 → 47.**
  Ngân sách dùng **1/3** (hợp lệ ngay attempt đầu — không retry).
  Poller thoát exit 0 lúc 11:56:12Z — trước hạn cắt 13:30Z 1h33'48".
+ **BOOT ĐO: MỘT boot — 9161bfd1 (#104, btime 11:13:42Z; T0-185
  XÁC NHẬN 9 nguồn tươi, gap #103→#104 = 7.127 s). 0 reboot trong phiên đo.**
+ **CỘNG DỒN MỚI (47 lượt hợp lệ): P1 210/214, P2 205/205,
  P3-A1 182/214, P3' 174/186 occurrence = 137/140 distinct-seq,
  P7 108/108.** Seq (c2) mới: 155, 389 (kiểm tay vắng thật
  trong sổ as-of-184); 283 ĐÃ THẤY trong sổ nhưng lần đầu ĐẠT
  (rời khỏi non_dat); 441, 467 ĐÃ THẤY. Sổ distinct-seq as-of-185
  md5 `cd5410cc` (lúc mở `349e5c14`).
**Ngày:** 24/11/2026 (lượt cron 18:35 +07 24/11 = 11:35:51Z).
**Boot đo:** 9161bfd1 (17 poll: 2 test + 15 poller).

## 0. Verdict tổng

- **#54 CÓ LƯỢT HỢP LỆ (attempt1-9161bfd1).** Cửa yên mở poll #15
  (11:52:20Z): load1 0,23, load5 1,88, RAM 1350 MB, gate0=T5
  (POSTBOOT_PASS #104, 11:42:15Z, replay-đầy-đủ, poll=0, KHÔNG
  caveat — đề xuất T5-185), lock=khong, blockers=0, apt=0, dpkg 1468.
  Attempt1 chạy 11:52:20–11:55:49Z (3'29") — 20/20 pass, lớp B
  ĐẠT 5/5, tickCost median 45,0 ms; analyzers chạy NGOÀI cửa sổ
  attempt 11:55:49–11:56:12Z (quyết (p) đợt 179); poller thoát
  exit 0 lúc 11:56:12Z. Ngân sách **1/3**.
- **Chuỗi lượt yên hợp lệ: 46 → 47.** Cộng dồn P1/P2/P3-A1/P3'/
  P7 MỚI như trên (xem §7). Chuỗi median tickCost 47 số
  (mean 47,6, min 39,0, max 60,0; 0 lượt vượt 60).
- **Điều kiện GIỮ NGUYÊN như #50 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 5: ĐẠT (xem §6,
  F-185-T4-7).** 0 file analyzer nào ghi trong cửa sổ attempt1
  (11:52:20.321–11:55:49.138Z); file skiplatest mặc định
  `round109-k7/analyze-k7-skiplatest.txt` mtime vẫn
  18:13:20Z (đợt 179) — 0 ghi mới.
- **0 VI PHẠM PHÍA T4 — CHUỖI 0 VI PHẠM GIỮ 0** (chuỗi đã VỀ 0
  theo quyết (p) đợt 183, GIỮ 0 theo quyết (p) đợt 184 —
  F-184-T2-8 thuộc T2; parent quyết cuối, xem §6). Phía T4 giữ
  sạch: không khởi động script nặng nào trong lúc gate0wait;
  không probe dpkg nào trong cả phiên; mọi phân tích đều làm
  SAU khi poller thoát 11:56:12Z. Trong cửa sổ attempt T4 chỉ
  chạy probe + sampler của chính attempt.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, mọi poll đều tree=YES, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round185-t4.done` viết lúc đóng,
  CÓ NỘI DUNG, trong hạn cờ ~14:00Z; boot lúc đóng vẫn
  9161bfd1 (#104).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (11:41–11:42Z),
ghi vào `hidden_files/round185-t4/preflight-185.txt` — **PASS**
(0 sót; xem F-185-T4-1: 7 chuỗi stale bắt được ở lần grep thứ 2
+ sửa trước pre-flight). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–184:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq as-of-184 md5 `349e5c14…`
  (occ 169/181, distinct 134/138, valid_rounds_p3 34,
  non_dat [260, 283, 364, 498]).
- **10/10 analyzer** có mặt (+ `run-analyzers-185.sh` —
  quyết (p)); `bash -n` OK 5 script
  T4 (poll-wait, run-attempt, run-analyzers, inner,
  check-classb); `py_compile` OK 12 file py; Playwright-core
  có mặt (webkit object — import tuyệt đối
  `/home/hatch/scratch-round63-r4/node_modules/playwright-core/
  index.mjs`, cùng đường dẫn probe dùng); media
  `stripes-nonperiodic.mp4` có mặt
  (`apps/web/public/stripes-nonperiodic.mp4`, 140.828 B);
  không có `vite.lock`, không có `attempt-done-*`.
- **Fixture /tmp mất theo #102 — KHÔNG ẢNH HƯỞNG T4:**
  probe lấy media qua vite từ `public/`; 0 file /tmp nào
  trong đường chạy T4 (ghi rõ theo brief đợt 185; rebuild
  fixture sau gate nếu cần — không phải việc T4).
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-24
  13:30:00 UTC` → **1795527000** = 13:30Z (hạn cờ ~14:00Z =
  1795528800, hạn cứng 14:35Z = 1795530900); grep 0 hit cho
  mẫu rộng `round183|10:30|11:00Z|11:35Z|07:30|08:00Z|08:35Z|
  #53|default=184|6ecd948e|T4-184a|round182|...-184`
  trong 7 file mới (lần grep thứ 3 sạch).
- **Copy-forward 184 → 185 (KHÔNG sed global — sửa bằng script
  python thay thế có neo, xem F-185-T4-1):** deadline `10:30Z`
  → `13:30Z`; hạn cờ/cứng `11:00Z`/`11:35Z` → `14:00Z`/
  `14:35Z`; T5FLAG chính `round185-t5/` + fallback
  `round184-t5/`; W trong 5 script ĐÃ LÀ `round185-t4`;
  `T4-184a` → `T4-185a`; `default=184` → `default=185`;
  `WebKit #53` → `#54`; glob chống nhiễu `round183-*` →
  `round184-*`. (Grep stale-string lần 2 phát hiện 7 chuỗi sót
  — xem F-185-T4-1; sửa TRƯỚC pre-flight; grep lần 3 sạch.)
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 184); **`tree-md5.txt` KHÔNG có trong danh
  sách cleanup — còn nguyên, 530e10a7.**
- **Freeze check (F-164-T4-1):** `round184-t4` còn **0 file
  mtime ≥ 11:35:51Z** (giờ mở đợt 185).
- **GATE0 LÚC MỞ: CHƯA CÓ CỜ T5 CHO BOOT #104** lúc mở
  pre-flight (round185-t5/ chưa tồn tại — T5-185 chưa spawn
  watcher; fallback round184-t5/POSTBOOT_PASS mtime 08:43:59Z
  < btime #104 11:13:42Z nên poller đánh "cu(mtime-cu)",
  KHÔNG TÍNH — đúng thiết kế chống cờ sai boot). DỰ PHÒNG
  T4-check-only: postboot check-only chạy tay **exit 0 PASS**
  (GST thư mục thật, 269 plugin, apt đủ 11 gói,
  gst-inspect-1.0 có) — gate0 có thể mở qua T4-check-only
  (PB=0, tuổi ≤3 poll) khi RAM/load/lock/blockers đủ. dpkg.log
  1468 dòng. Boot #104 có vẻ ĐÃ HEAL (khác #103: dpkg 2,
  libs 0/6) — T5-185 xác nhận POSTBOOT_PASS #104 (cờ CÓ lúc
  11:42:15Z, poll #2 đã nhận T5 PASS).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (11:41:33Z): RAM 1693 MB, load1 3,80/load5 2,38,
  gate0=T4-check-only(pb_age=0), t5flag=cu(mtime-cu), apt=0,
  dpkg 1468. Lần 2 (11:41:35Z): RAM 1635 MB, load1 3,74/load5
  2,39, gate0=T4-check-only, apt=0, dpkg 1468. Cửa chưa mở
  vì load — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket).
- **RAM lúc mở ~1.282 MB avail; load1 ~3,02 lúc mở** — cửa
  chỉ mở khi đủ mọi điều kiện.
- **F-176-T4-2: KHÔNG TÁI DIỄN** — sampler n=100 đếm đúng.
- **DISPATCH LẠI (F-185-T4-2):** luồng T4 đầu đợt 185 kết thúc
  sau ~10 phút mà chưa viết LIMITS/paths/cờ. Đính chính brief:
  "không để lại file nào" là SAI — trên đĩa ĐÃ CÓ preflight
  PASS + poller đang chạy (pid 15128, poll #5 lúc 11:44:46Z)
  + toàn bộ script làm việc; chỉ thiếu 3 đầu ra bắt buộc.
  Luồng dispatch lại TIẾP QUẢN poller đang chạy sau khi kiểm
  chứng độc lập (bash -n/py_compile/tree/sổ OK, 0 attempt-done)
  — KHÔNG giết poller làm lại (attempt chưa chạy nên không mất
  phép đo nào); 4 script 185 đã copy vào repo (md5 khớp) để
  sẵn sàng stage.

## 1. Poller — 17 poll thật (2 test + 15), 1 lần cửa mở, 0 reboot

- **Test (POLL_TEST=1), 2 poll, boot 9161bfd1
  (11:41:33Z, 11:41:35Z):** cả 2 đều gate0=T4-check-only,
  load1 3,80/3,74, load5 2,38/2,39, RAM 1693/1635 MB,
  lock=khong, blockers=0, apt=0 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-185.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 9161bfd1 (#104), 15 poll
  (11:41:43–11:52:20Z), 1 lần cửa mở (#15):** RAM ≥1024:
  15/15 (min 1350, max 2086 MB); 500–1023: 0/15; **<500: 0/15**;
  load1<2: 5/15; load5<2: 1/15;
  gate0: **T5 14/15** (cờ có từ poll #2, 11:42:29Z) +
  T4-check-only 1/15 (poll #1, trước khi cờ T5 có);
  lock=co 5, khong 10 (T0 giữ, poll #3–#7);
  blockers>0: 5 poll; apt>0: 0 poll; dpkg 1468 → 1468 (đứng yên).
- **Giai đoạn 1 — T0 giữ lock + load cao (poll #1–#7,
  11:41:43–11:46:18Z):** lock=co (thread=t0-round185, pid 31278,
  port 5560, ticket 1-179552056750) từ poll #3; blockers
  5/5/5/5/1 (poll #3–#7); load1 3,47–7,76 (đỉnh #7),
  load5 2,38–4,32; RAM 1609–2006 MB. O8 T0 chạy trên
  #104 trong lúc này (PASS 3/3, xem §3). Cửa KHÔNG MỞ ĐƯỢC vì
  thiếu lock + blockers + load.
- **Giai đoạn 2 — lock đã nhả, load5 hạ dần (poll #8–#14,
  11:47:04–11:51:35Z):** lock=khong từ poll #8; load1<2 từ
  poll #11 (1,59); load5 4,23 → 2,18 — vẫn >2 tới poll #14
  (2,18). Cửa KHÔNG MỞ (chỉ thiếu load5).
- **CỬA MỞ — poll #15 (11:52:20Z):** load1 0,23, load5 1,88,
  RAM 1350 MB, gate0=T5, lock=khong, blockers=0, apt=0,
  dpkg 1468, tree=YES → **CHẠY attempt1 NGAY**.
- **0 reboot trong phiên đo.** Poller thoát exit 0 lúc
  11:56:12Z sau khi attempt1 hợp lệ (không chạm hạn cắt
  13:30Z).
- **Phân rã 17 poll thật:** RAM≥1024: 17/17; RAM 500–1023:
  0/17; RAM<500: **0/17**. load1<2: 5/17; load5<2: 3/17.
  **Stats "gan-mo" đếm 1 = đúng 1 poll mở cửa thật** (#15).
  gate0: T5 16/17 + T4-check-only 1/17. blockers>0: 5 poll
  (toàn lúc T0 giữ lock). apt>0: 0 poll.

## 2. Attempt — 1 attempt, HỢP LỆ NGAY (ngân sách dùng 1/3)

- **attempt1-9161bfd1, 11:52:20–11:55:49Z (3'29"), 20/20
  pass — HỢP LỆ.** JSON
  `preview-b-f3-flip-webkit-t4-attempt1-9161bfd1.json`
  3.512.843 B, passes=20, pageErrs=[]. **tickCost total n=637
  median=45,0 p90=71,0 max=108 min=28**; hậu flip+2000ms n=472
  median=45,0; tBlend gap n=514 median=83,0 p90=107,0 max=2169;
  BlendTick/pass=25,8; rAF/pass median=37 (min 31, max 49);
  webkit=27,2; pageErrs=[]; flip afterPass=5 wallMs=25974.
- **Per-pass median attempt1:** 53,0 / 39,5 / 47,5 / 51,0 /
  40,5 / 40,0 / 40,0 / 48,0 / 48,0 / 46,0 / 44,0 / 53,0 /
  47,0 / 51,0 / 40,0 / 44,5 / 45,5 / 39,0 / 42,0 / 48,0
  (p90/pass 60,9–81,3; load1/pass 0,21 → 2,77; RAM/pass
  1164 → 805 MB). Tương quan median~load1 r=-0,19;
  median~RAM r=0,19 (chỉ mô tả, không kết luận nhân quả từ
  1 lượt). Load1/pass leo dần là trung bình 1 phút tích lũy
  tải của chính attempt (xem §3 — 6 spike B2 đều tự-tải).
- **Lớp B attempt1 ĐẠT 5/5** (`classb-t4-attempt1-9161bfd1.txt`,
  11:55:49Z): sampler n=100, load1_max=3,51, RAM_min=805 MB,
  RAM_max=1610 MB, **0 mẫu RAM<500 MB**, 40 mẫu RAM<1024 MB
  (cảnh báo, không vi phạm); load5 lúc kết thúc 1,76; boot lúc
  bắt đầu = boot hiện tại 11:13:42Z; apt/dpkg thật lúc đánh giá
  (pgrep -x) = 0; **dpkg.log: trước=1468, hiện tại=1468,
  delta-trong-cửa-sổ=0**; ps-before/after exact-comm apt/dpkg
  = 0. B1 ĐẠT (load5 cuối ≤2,5); B2 ĐẠT (load1 max 3,51 ≤ 4 +
  ps-before/after chỉ có vite của chính attempt — 0 process
  phân tích nặng khác); B3 ĐẠT (không reboot trong lúc đo);
  B4 ĐẠT (pgrep -x=0, ps exact-comm=0, dpkg delta=0); B5 ĐẠT
  (RAM min 805 MB, 0 mẫu <500 MB).
- **(c2) attempt1 5/5 COVERED + P3' 5/5 ĐẠT:** seq 155 (stall 8),
  283 (3), 389 (3), 441 (4), 467 (3) — đều ở cuối chuỗi đóng
  băng ≥2 tick; coverage 5/5 (blendTick hậu-flip trong ±500 ms
  của log: 384/384 = 100,0%); P1 5/5 DUNG (baseline 45/384,
  p=2,21e-05); P3-A1 4/5 — **SAI** (baseline 96/383,
  p=0,0158 — xem F-185-T4-3); P2 5/5 (cả 5 seq lag +1f;
  median/p90/max lag đều 1f, 0 âm); P7 DUNG (c2 drawSrc delta
  {-1: 25, 0: 26}; đối chứng toàn bộ drawSrc post: {-1: 307,
  0: 163}, 0/470 entry trễ ≥+1f); F6' ĐÓNG (skipLatest n=82
  hậu flip+2000ms: (1) 100,0%, (2) 100,0%).
- **Không attempt nào bị reboot giết; 0 retry.** Ngân sách
  còn 2/3 (không dùng thêm vì đã có lượt hợp lệ).

## 3. B2 spike / đối chiếu sampler T9 + O8 T0

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT1: 6 SPIKE** (11:53:48–
  11:54:13Z, load1 3,51 → 3,39 → 3,28 → 3,09 → 3,08 → 3,00 —
  ngưỡng ghi của T9 là load1 ≥ 3,0; `b2-spikes.log` ở ĐÚNG
  ĐƯỜNG DẪN `~/workspace/repo-1/round185-t9/b2-spikes.log`,
  90 header SPIKE lúc kiểm; F-181-T9-5 KHÔNG tái diễn).
  **6 spike này KHÔNG PHẢI nhiễm tải lạ:** spike đầu tiên
  (11:53:48Z, load1=3,51) đầu bảng là **WebKitWebProces
  75,7%** (pid 116369 — process WebKit của chính attempt),
  tiếp theo MainThread (probe), Xvfb :193 (của chính attempt),
  vite/esbuild (của chính attempt); 5 spike sau chỉ còn
  process hệ thống nhỏ (hatch 8,0%, hatch-execd 3,3%) vì
  load1 là trung bình 1 phút còn dư sau burst render.
  **0 process phân tích nặng của luồng khác** (ps-before/
  after attempt1 chỉ có vite của chính attempt — khớp B2).
  B2 vẫn ĐẠT vì load1_max 3,51 ≤ 4 (xem F-185-T4-5). Khác
  F-184-T2-8 (tải lạ hole-recheck, load1_max 4,48 > 4,
  attempt bị hủy): lần này tải là của chính attempt, không
  vượt bar, attempt HỢP LỆ.
- **O8 T0 TRÊN BOOT #104 — PASS 3/3 (theo T0-185.done 11:48Z):
  WebKit 21/21 ×2 + Chromium 21/21, SAU POSTBOOT_PASS #104
  32 s; libevent ĐÃ HEAL; 0 attempt chồng với T4.** T4 poll
  #3–#7 trong cửa sổ O8 đều ghi lock=co thread=t0-round185
  + blockers → cửa yên KHÔNG mở; poll #8 (11:47:04Z, sau khi
  O8 xong) lock=khong. **0 giây chồng lấn giữa O8 và attempt
  T4** (O8 xong trước poll #8 11:47:04Z, attempt1 bắt đầu
  11:52:20Z — cách ~5'16").
- **O8 T8 TRÊN BOOT #104 — CHƯA CÓ (T8-185 chưa đóng cờ lúc
  T4 đóng).** Chân O8 T8 + harness thuộc T8-185 báo cáo.
- **Ghi trong cửa sổ attempt1: KHÔNG CÓ.** `run-analyzers-185.sh`
  chạy 11:55:49–11:56:12Z, SAU khi attempt-done đã ghi
  (11:55:49.138Z) — xem kiểm chứng live lần 5 (§6,
  F-185-T4-7). File `hidden_files/round109-k7/
  analyze-k7-skiplatest.txt` mtime vẫn 2026-11-23 18:13:20Z
  (đợt 179) — 0 ghi mới.

## 4. Replay/postboot — POSTBOOT_PASS #104 ĐÃ CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat — đề xuất)

- **Boot 9161bfd1 (btime 11:13:42Z, số hiệu #104 — T0-185
  XÁC NHẬN 9 nguồn tươi; gap #103→#104 = 7.127 s).**
- **POSTBOOT_PASS #104 ĐÃ CÓ 11:42:15Z** (boot+28m33s;
  watcher-185 pid 18279, **mode replay-đầy-đủ, poll=0,
  KHÔNG caveat — đề xuất T5-185, tiền lệ #102/#99/#95**;
  T5-185.done 11:46Z; verify độc lập exit 0 — 11/11 NEED +
  5/5 lib, GST 269=269 thư mục thật, tools cài; cờ 315 B
  md5 `8e6d6e5d`; backup #102 byte-identical md5 `6007fea8`;
  replay #104 KHÔNG đình trệ — heal 11:35:39Z → xong
  11:40:18Z, dpkg 1468 dòng, 50 transaction). Gate0=T5
  14/15 poll (poll #1 dùng T4-check-only dự phòng trước khi
  cờ có). Hướng (3) VẪN ĐỨNG lần 32 (theo T5-185).
- **POSTBOOT_PASS #103 KHÔNG CÓ — ĐÃ XÁC NHẬN, KHÔNG bù
  được** (T5-185.done: KHÔNG THỬ REPAIR — boot đã chết theo
  #104 11:13:42Z; dpkg.log/history #103 mất theo rootfs
  rebuild; không watcher nào sống trên #103 sau 09:15:04Z;
  replay #103 đình trệ toàn phần — nợ host-side quyết (k)
  đợt 174 VẪN MỞ; tiền lệ #100/#83). **Tổng boot không cờ
  22 → 23 nếu parent chấp nhận** (T5-185 đề xuất).
- **0 REBOOT trong cửa sổ attempt; 0 REBOOT trong phiên đo.**
  Số hiệu #104 đã xác nhận (T0-185); (m) #104 + INSIDE #104
  thuộc T2-185 (T0-185.done: (m) #104 thô — 0 requeue trong
  cửa hẹp); #104 KHÔNG GIẾT HOLDER (T0-185: lock trống
  1.910 s — T6-185 phán cuối);
  POSTBOOT_PASS #104 CÓ — giá trị chân gate (a) cho chuỗi
  FULL PASS: **lượt yên #54 CÓ trên #104 + gate (a) #104 CÓ
  (KHÔNG caveat — đề xuất) + O8 T0 PASS 3/3 trên #104 — 3 chân
  CÙNG BOOT #104**; O8 T8 + harness thuộc T8-185. Chuỗi FULL
  PASS **GIỮ 0** theo quyết (b) đợt 184 — đợt 185 có full pass
  thì chuỗi lên lại 1 (parent quyết cuối).
- **Run 184 SUCCEEDED 11:16:07Z** (margin **+1,184 s** theo
  hạn started-gốc, viết lại ×2 — lần 2 tại 11:11:06Z KHÔNG do
  reboot; T0-185.done — kết cục thuộc T7-185).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-185 báo cáo.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND185_T4_WEBKIT_QUIET54_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round185-t4/`):**
  `poll-wait-t4-185.sh` (deadline 13:30Z 24/11 + cờ T5
  round185-t5/ + fallback round184-t5/),
  `run-attempt-185.sh` (lượt yên #54),
  `run-analyzers-185.sh` (chạy classb + 9 analyzer
  NGOÀI cửa sổ attempt; đợt này ĐÃ CHẠY 11:55:49–11:56:12Z),
  `distinct-seq-185.py` (helper đọc sổ; đợt này DÙNG LIVE —
  sổ as-of-185: 137/140 distinct, occ 174/186).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–184, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round185-t4/` — theo đúng mẫu 149–184: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round185-t4/`, md5 `078938cf...`,
  giống hệt bản đợt 156–184).
- **Script làm việc (hidden_files, không stage):**
  5 script T4 (`poll-wait`/`run-attempt`/`run-analyzers`/
  `t4-attempt-inner` — W = round185-t4 + glob chéo round184-* /
  `check-classb-t4` — đếm sampler n chỉ dòng `boot=`),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-185.py` (thống kê §A;
  footer CỘNG DỒN MỚI 47 lượt),
  `distinct-seq-185.py` (helper đọc sổ — DÙNG LIVE),
  `distinct-seq-ledger.json` (SỔ distinct-seq, as-of-185:
  137/140 distinct, occ 174/186, valid_rounds_p3 35,
  non_dat [260, 364, 498] — 283 đã rời khỏi non_dat vì lần
  đầu ĐẠT; md5 `cd5410cc…` — ĐÃ THĂNG CẤP từ bản đề xuất,
  sổ gốc as-of-184 `349e5c14…` còn trong file đề xuất đối
  chiếu + trong `hidden_files/round184-t4/
  distinct-seq-ledger.json`),
  `preflight-185.txt` + `preflight-postboot-185.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2).
- **Log/evidence (hidden_files/round185-t4/, không stage):**
  `poll-t4.log` (15 poll trên #104 + CUA YEN MO #15 +
  LUOT HOP LE), `poll-t4.nohup.log` (1 instance),
  `poll-test-185.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + CUA YEN MO + analyzers +
  LUOT HOP LE, thoát poller exit 0),
  `postboot-t4-185-gate0wait-*.log` (check-only mỗi 4 poll;
  PB=0 suốt), `stats-185-output.txt` (output stats-185.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có
  blockers: #3–#7 T0 giữ lock),
  1 JSON attempt (3.512.843 B — KHÔNG stage),
  `analyze-t4-attempt1-9161bfd1-*.txt` (9 analyzer, attempt1
  hợp lệ) + `p1p3p7-attempt1-9161bfd1.txt` (P1/P3-A1/P7
  attempt1 — chạy tay sau poller),
  `classb-t4-attempt1-9161bfd1.txt` (B 5/5),
  `coverage-check-attempt1-9161bfd1.txt` (5/5),
  `attempt-done-attempt1-9161bfd1` (ngân sách 1/3),
  `load-mid-t4-attempt1-9161bfd1.log` (sampler n=100),
  `run-webkit-t4-attempt1-9161bfd1.log`,
  `ps-before/after-t4-attempt1-9161bfd1.txt` (sạch — chỉ
  vite của chính attempt).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  11:56:12Z exit 0; 0 vite; 0 Xvfb; 0 MiniBrowser/WebProcess;
  X11 chỉ còn socket X193 mồ côi — xem F-185-T4-6).

## 6. Sai số F-185-T4-1..7 (+ nợ cũ)

- **F-185-T4-1 — COPY-FORWARD: 7 CHUỖI STALE SÓT SAU LẦN SỬA
  ĐẦU (GHI NHẬN — DẠNG F-184-T4-1).** Lần sửa đầu bằng script
  thay thế có neo đã đổi đúng fallback/glob (không lặp lỗi sed
  global đợt 183), nhưng grep kiểm lần 2 bắt thêm 7 chuỗi
  stale: 4 tên file tự tham chiếu trong comment/usage
  (run-attempt-184.sh, run-analyzers-184.sh,
  distinct-seq-184.py, poll-wait-t4-183.sh) + comment hạn cắt
  10:30Z + comment glob round183-* + echo "(excl. round184-t4
  itself)" trong t4-attempt-inner.sh. Sửa TRƯỚC pre-flight;
  grep lần 3 sạch. Không ảnh hưởng vận hành (toàn chuỗi
  comment/echo/usage; deadline + T5FLAG + glob đều đúng từ
  lần sửa đầu). Bài học: thay thế có neo vẫn cần grep lần 2
  với mẫu rộng — đã làm.
- **F-185-T4-2 — DISPATCH LẠI: LUỒNG T4 ĐẦU KẾT THÚC SỚM
  KHI CHƯA VIẾT 3 ĐẦU RA BẮT BUỘC (MỚI).** Luồng T4 đầu đợt
  185 kết thúc sau ~10 phút mà chưa viết LIMITS/paths/cờ.
  Đính chính brief dispatch lại: "không để lại file nào"
  là SAI — trên đĩa ĐÃ CÓ preflight PASS + poller đang chạy
  + toàn bộ script làm việc; chỉ thiếu 3 đầu ra bắt buộc.
  Luồng dispatch lại tiếp quản poller sau khi kiểm chứng độc
  lập (bash -n/py_compile/tree/ledger — xem §0b) thay vì
  giết làm lại; attempt chưa chạy nên không mất phép đo nào.
  Bài học: brief dispatch lại nên kiểm tra đĩa trước khi
  khẳng định "không có file".
- **F-185-T4-3 — P3-A1 SAI 4/5 LƯỢT NÀY (MỚI).** P3-A1:
  baseline đóng băng 96/383, (c2) đóng băng-tại-tick 4/5
  [283, 389, 441, 467], p=0,0158 ≥ 0,01 — verdict SAI theo
  luật DEF §5. Seq 155 (stall 8 — stall CAO NHẤT lượt này)
  KHÔNG đóng băng-tại-tick. Đây là chẩn đoán P3-A1 — KHÔNG
  phải gate verdict lượt yên (20/20 + B 5/5 + median ≤60
  vẫn đủ); P3' stall-based vẫn 5/5 ĐẠT, P1 5/5 DUNG, P2 5/5,
  P7 DUNG. Cộng dồn P3-A1: 178/209 → **182/214**. Theo dõi
  đợt sau xem P3-A1 có SAI tiếp không (không tự đổi luật DEF).
- **F-185-T4-4 — LABELLAG (b) lag≥+5f: 8 OCCURRENCE / 1 EVENT
  (MỚI — TÁI DIỄN DẠNG F-184-T4-3, TĂNG).** Attempt1: seq
  180–184, lag max +13f (đợt 184: 6 occ, max +11f), tBlend
  34980–35351 ms (371 ms, 1 event, M=[27]). Đây là chẩn đoán
  (b) — KHÔNG phải gate verdict (P1/P2/P3'/P7 của attempt1
  đều DUNG trừ P3-A1 SAI riêng; F6' ĐÓNG). Lần thứ hai liên
  tiếp có occurrence (b) ≥+5f (đợt 183 là 0, đợt 184 là 6,
  đợt này 8) — theo dõi đợt sau.
- **F-185-T4-5 — 6 SPIKE B2 TRONG CỬA SỔ ATTEMPT1 — TOÀN
  TẢI CỦA CHÍNH ATTEMPT (MỚI — KHÁC F-184-T2-8).** load1
  3,00–3,51, 11:53:48–11:54:13Z (xem §3). Đầu bảng spike đầu
  là WebKitWebProces 75,7% của chính attempt; 0 process lạ;
  B2 vẫn ĐẠT (max 3,51 ≤ 4). Không phải nhiễm tải, không
  hủy attempt. Ghi nhận để T9 đối chiếu (T9-185 đếm spike
  theo ngưỡng load1 ≥ 3,0 — lượt yên hợp lệ vẫn có thể có
  spike tự-tải dưới bar B2).
- **F-185-T4-6 — SOCKET X193 CÒN LẠI SAU ATTEMPT (MỚI —
  NHẸ).** `/tmp/.X11-unix/` lúc đóng còn socket X193 (mtime
  11:52:24Z — Xvfb :193 của chính attempt, tạo trong cửa sổ
  attempt); 0 Xvfb thật lúc đóng (ps). Socket mồ côi, không
  ảnh hưởng đo (attempt đã xong trước khi Xvfb thoát). Khác
  F-183-T4-2 (socket X193 đã wipe theo #102 — không còn):
  lần này socket do chính attempt tạo ra, chưa được dọn.
  Ghi nhận; lần sau kiểm tra dọn socket Xvfb của attempt
  sau khi poller thoát.
- **F-185-T4-7 — QUYẾT (p) KIỂM CHỨNG LIVE LẦN 5: ĐẠT
  (MỚI — F-184-T4-5 ĐÃ HẾT).** Cửa sổ attempt1
  11:52:20.321Z (marker) → 11:55:49.138Z (attempt-done).
  Run-analyzers bắt đầu 11:55:49Z (cùng giây với attempt-done,
  sau trap EXIT). Mtime sớm nhất của 9 file analyzer +
  classb: classb 11:55:49.226Z, c2drawlog 11:55:49.315Z —
  cả hai SAU attempt-done 11:55:49.138Z (lần lượt +88 ms,
  +177 ms); 8 file còn lại 11:55:56–11:56:12Z. **0 file
  analyzer ghi trong cửa sổ attempt1.** File skiplatest mặc
  định `hidden_files/round109-k7/analyze-k7-skiplatest.txt`
  mtime vẫn 2026-11-23 18:13:20Z — 0 ghi mới. Kiểm chứng live
  lần 5 (đợt 179: lần 1 dời; 180–182 dời; 183: lần 3 ĐẠT;
  184: lần 4 ĐẠT; lần này lần 5 ĐẠT).
- **F-184-T4-1 — TÁI DIỄN DƯỚI DẠNG F-185-T4-1**
  (7 chuỗi stale — bắt được trước pre-flight).
- **F-184-T4-2 — KHÔNG TÁI DIỄN.** RAM <500 MB: 0/17 poll
  (min 1350 MB).
- **F-184-T4-3 — TÁI DIỄN DƯỚI DẠNG F-185-T4-4** (8 occ /
  1 event, max +13f — tăng so với 6 occ / max +11f).
- **F-184-T4-4 — KHÔNG TÁI DIỄN.** 0 reboot trong phiên đo
  (#104 đã có trước khi mở đợt).
- **F-184-T4-5 — ĐÃ HẾT (xem F-185-T4-7 — kiểm chứng live
  lần 5 ĐẠT). F-184-T2-8 — KHÔNG TÁI DIỄN PHÍA T4** (0 chồng
  tải lạ; 6 spike B2 đều tự-tải, dưới bar 4).
- **F-183-T4-1 — TÁI DIỄN DƯỚI DẠNG NHẸ HƠN F-185-T4-1.
  F-183-T4-2 — TÁI DIỄN DƯỚI DẠNG F-185-T4-6** (socket X193
  còn lại sau attempt — lần này do chính attempt tạo).
  **F-183-T4-3 — KHÔNG TÁI DIỄN** (py_compile 12 file —
  đếm đúng). **F-183-T4-4 — TÁI DIỄN DƯỚI DẠNG BÌNH
  THƯỜNG** (T0 giữ lock polls #3–#7 + blockers; đó là vận
  hành bình thường của O8, không phải sai số mới).
  **F-183-T4-5 — ĐÃ HẾT (xem F-185-T4-7). F-183-T4-6 —
  KHÔNG TÁI DIỄN THEO NGHĨA MỚI:** stats "gan-mo" = 1 =
  đúng 1 poll mở cửa thật (#15). **F-183-T4-7 — KHÔNG
  TÁI DIỄN** (kiểm đúng đường dẫn ngay từ đầu; 6 spike
  trong cửa sổ attempt1 đều tự-tải).
  **F-182-T4-1 — KHÔNG TÁI DIỄN** (0 reboot trong phiên đo).
  **F-182-T4-4 — ĐÃ HẾT** (#104 CÓ POSTBOOT_PASS, KHÔNG
  caveat — đề xuất). **F-181-T4-3 — KHÔNG TÁI DIỄN.
  F-181-T4-6 — CÓ SỐ MỚI:** chuỗi median 46 → 47, thêm
  45,0 ms; mean 47,7 → 47,6. **F-181-T4-7 — KHÔNG ÁP DỤNG**
  (sampler n=100 đếm đúng dòng `boot=`). **F-181-T4-8 —
  KHÔNG ÁP DỤNG** (p90 tickCost attempt1 71,0 ms — chỉ ghi
  nhận, không có bar p90). **F-179-T4-5 — ĐÃ HẾT (xem
  F-185-T4-7). F-178-T4-1 — KHÔNG TÁI DIỄN** (6 spike trong
  cửa sổ attempt1 đều tự-tải, B2 ĐẠT). **F-177-T4-4 —
  KHÔNG TÁI DIỄN. F-177-T4-6 — TÁI DIỄN DƯỚI DẠNG
  F-185-T4-1. F-176-T4-1 — KHÔNG TÁI DIỄN** (0 vi phạm
  theo T4). **F-176-T4-2 — KHÔNG TÁI DIỄN** (sampler
  n=100). **F-175-T4-1 — KHÔNG TÁI DIỄN** (`tree-md5.txt`
  còn nguyên; test poll lần 1 tree=YES). **F-175-T4-2 —
  KHÔNG TÁI DIỄN** (0 ghi analyzer trong cửa sổ attempt1).
  **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG BÌNH THƯỜNG** (T0 giữ
  lock polls #3–#7). **F-175-T4-5 — KHÔNG TÁI DIỄN**
  (0 reboot trong phiên đo). **F-174-T4-1 — KHÔNG ÁP DỤNG**
  (p1p3p7 chạy tay sau attempt — kết quả §7, không lỗi).
  **F-174-T4-3 — KHÔNG TÁI DIỄN** (kiểm process lúc đóng
  dùng `ps` trực tiếp). **F-174-T4-4 — KHÔNG ÁP DỤNG**
  (p1p3p7 chạy — P1/P2/P7 DUNG, P3-A1 SAI riêng — xem
  F-185-T4-3). **F-174-T4-6 — KHÔNG TÁI DIỄN** (RAM <500
  MB: 0/17 poll).

## 7. P3' cộng dồn (MỚI — 47 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 185 (MỚI): P1 210/214, P2 205/205,
  P3-A1 182/214, P3' 174/186 occurrence = 137/140 distinct-seq,
  P7 108/108** (47 lượt hợp lệ — #54 CÓ lượt hợp lệ nên cộng
  thêm 5 seq; 0 attempt nhiễm tải).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #54: 5/5 seq (c2) P1 + P2 + P3' ĐẠT; P3-A1
  4/5 (SAI riêng — xem F-185-T4-3)** (seq 155, 283, 389, 441,
  467; stall 8, 3, 3, 4, 3); P7 ĐÚNG (0/470 entry trễ ≥+1f).
  Helper `distinct-seq-185.py` DÙNG LIVE (quyết (t) đợt 162):
  sổ as-of-184 (134/138 distinct, occ 169/181) + stall/
  c2coverage attempt1-9161bfd1 → **137/140 distinct,
  174/186 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 155, 389** (chưa có trong sổ);
  **283 ĐÃ THẤY nhưng lần đầu ĐẠT** (trong sổ union, chưa
  trong seen_dat — rời khỏi non_dat [260, 283, 364, 498] →
  [260, 364, 498]); **441, 467 ĐÃ THẤY** (trong sổ).
  T4 kiểm tay lại sổ as-of-184: cả 2 seq mới vắng thật
  (155/389 không có trong `seen_dat` lẫn `seen_c2`); 283
  có trong `seen_c2` nhưng vắng trong `seen_dat`.
- **P1 — ĐÚNG 5/5 occ** (cả 5 seq gần run-end ±1 tick; trong
  15 run_end seqs; baseline 45/384, p=2,21e-05 — verdict
  ĐÚNG theo luật DEF §3 vì n=5 ≥3 VÀ p<0,01). Cộng dồn
  205/209 → **210/214**.
- **P2 ĐÚNG — 5/5 occ** (cả 5 seq lag +1f; DEF §4 chỉ đòi
  lag ≥ +1f; median/p90/max lag đều 1f, 0 âm). Cộng dồn
  200/200 → **205/205**.
- **P3-A1 — SAI 4/5 occ** (4 seq đóng băng-tại-tick [283,
  389, 441, 467]; seq 155 KHÔNG đóng băng-tại-tick;
  baseline 96/383, p=0,0158 ≥ 0,01 — verdict SAI theo luật
  DEF §5). Cộng dồn 178/209 → **182/214**.
- **P3' 5/5 occ ĐẠT** (stall: 155=8, 283=3, 389=3, 441=4,
  467=3). Cộng dồn 134/138 → **137/140 distinct** (3 seq
  ĐẠT MỚI — 155, 283, 389); occurrence 169/181 → **174/186**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 25,
  0: 26}; đối chứng toàn bộ drawSrc post: {-1: 307, 0: 163},
  0/470 entry). Cộng dồn 103/103 → **108/108**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162).**
  Helper đọc sổ (as-of 184: 134/138 distinct, occ 169/181),
  tính seq MỚI = tập hiệu với sổ, in cộng dồn mới, ghi sổ MỚI
  ra file riêng (`distinct-seq-ledger-185-proposed.json`) —
  KHÔNG sửa sổ gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp.
  **Live đợt 185:** sổ + stall/c2coverage attempt1-9161bfd1 →
  **137/140 distinct, 174/186 occ** — khớp tính tay trên.
  Sổ ĐÃ THĂNG CẤP: as-of 185, 137/140 distinct, occ 174/186,
  valid_rounds_p3 35, non_dat [260, 364, 498] (sổ gốc as-of-184
  md5 `349e5c14…` còn trong file đề xuất đối chiếu + trong
  `hidden_files/round184-t4/distinct-seq-ledger.json`; sổ mới
  md5 `cd5410cc…`).
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (lượt #54 thêm 2 seq mới + 1 seq lần
  đầu ĐẠT, đều ĐẠT cả P1/P2/P3' — ủng hộ thêm; P3-A1 SAI
  1 lượt không đổi verdict vì P3' stall-based vẫn 5/5 và
  P1/P2/P7 đều DUNG — theo dõi P3-A1 đợt sau).
- Chuỗi median tickCost 47 lượt (MỚI — thêm 45,0 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 /
  39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 /
  58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 /
  44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 /
  53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 / 50,0 /
  45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 ms (tổng
  2238,0; trung bình 47,6 ms; min 39,0, max 60,0; 0 lượt
  vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 186

- **(a) #54 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 46 → 47.**
  Chân lượt yên cho chuỗi FULL PASS **CÓ đợt này** (attempt1
  trên #104, 20/20 + B 5/5 + median 45,0 ms) — cùng boot với
  gate (a) #104 (CÓ, KHÔNG caveat — đề xuất) + O8 T0 PASS 3/3
  trên #104. Chuỗi FULL PASS **GIỮ 0** theo quyết (b) đợt 184
  — đợt 185 có full pass thì chuỗi lên lại 1 (parent quyết
  cuối — còn chờ chân O8 T8 + harness của T8-185).
- **(b) P3' cộng dồn MỚI 47 lượt: P1 210/214, P2 205/205,
  P3-A1 182/214, P3' 174/186 = 137/140, P7 108/108:**
  sổ distinct-seq as-of-185 md5 `cd5410cc…` (2 seq mới 155,
  389 — kiểm tay vắng thật; 283 lần đầu ĐẠT). **Chờ
  parent/T10 quyết:** ghi nhận cộng dồn mới.
- **(c) BOOT 9161bfd1 (số hiệu #104) — T0-185 ĐÃ XÁC NHẬN 9
  nguồn tươi (gap #103→#104 = 7.127 s).**
  **(m) #104 (T2-185 + parent 185; số liệu thô 0 requeue
  trong cửa hẹp từ T0-185); INSIDE #104 (T2-185); #104 KHÔNG
  GIẾT HOLDER (T0-185 — lock trống 1.910 s; T6-185 phán cuối).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale-string lần 2 bắt được 7 chuỗi
  sót (F-185-T4-1 — sửa trước pre-flight); gate0 ĐÃ ĐẠT lúc
  mở poller qua T5 từ poll #2 (cờ T5 có 11:42:15Z, trước
  poll #2 14 giây).
- **(e) POSTBOOT_PASS #104 ĐÃ CÓ (11:42:15Z, boot+28m33s,
  replay-đầy-đủ, poll=0, KHÔNG caveat — đề xuất): GHI NHẬN.
  POSTBOOT_PASS #103 KHÔNG CÓ — ĐÃ XÁC NHẬN, KHÔNG bù được;
  tổng boot không cờ 22 → 23 nếu parent chấp nhận** (đề xuất
  T5-185). Hướng (3) VẪN ĐỨNG lần 32.
- **(f) RAM <500 MB: 0/17 poll (min 1350 MB).** Không có
  attempt nào chạy trên RAM thấp. Giao T9-185 đối chiếu
  balloon trên #104.
- **(g) (m) #104 (T2-185 + parent 185); (m) #56 lần 28
  (T2-185); mù #96?/#95?/#94?/#88? (hole-recheck lần 29)/#77?
  (T2-185); (c')/(f') V2 làm phương án chính từ đợt 185
  (quyết (j) đợt 184 — T8-185 triển khai); Plan B B1 (T8-185);
  84l10 + Q3 heartbeat (T8-185); run 184 SUCCEEDED 11:16:07Z
  (margin +1,184 s — T7-185); #104 có giết holder không
  (T0-185 ghi KHÔNG — T6-185 phán cuối); prune lần 60
  (T6-185); checklist (o) (T8-185); H3 chỉ giám sát thụ động;
  birefnet 0 thử lần 39; nhắc mọi luồng: KHÔNG chạy script
  nặng / KHÔNG probe dpkg trong cửa sổ attempt (đợt này 0
  chồng tải lạ phía T4 — 6 spike B2 đều tự-tải); u2net là
  fallback chính thức; ci-security.yml vẫn 403 chờ user;
  TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT** (dpkg delta
  0, apt/dpkg 0 — xem §2).
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (attempt1 hợp lệ ngay) → **CÓ lượt yên hợp lệ #54 cho chuỗi
  FULL PASS** (cùng boot #104 với O8 T0). T8 tự quyết O8 đợt
  này (O8 T0 trên #104 PASS 3/3 — sau cờ 32 s; O8 T8-185
  thuộc T8-185 báo cáo).
- **(j) F-185-T4-1 (7 chuỗi stale — sửa trước pre-flight);
  F-185-T4-2 (dispatch lại — tiếp quản poller đang chạy);
  F-185-T4-3 (P3-A1 SAI 4/5 — seq 155 không đóng băng-tại-
  tick); F-185-T4-4 (labellag (b) lag≥+5f 8 occ / 1 event —
  lần thứ hai liên tiếp >0); F-185-T4-5 (6 spike B2 tự-tải
  trong cửa sổ attempt1 — B2 vẫn ĐẠT); F-185-T4-6 (socket
  X193 còn lại sau attempt); F-185-T4-7 (quyết (p) kiểm chứng
  live lần 5 ĐẠT).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-185.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-185.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-24T11:41:33Z - 2026-11-24T11:41:35Z, boot=9161bfd1
   RAM min=1635 max=1693 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 0/2 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=2
   lock: khong=2
   dpkg 1468->1468
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 15 poll, 2026-11-24T11:41:43Z - 2026-11-24T11:52:20Z, boot=9161bfd1
   RAM min=1350 max=2086 >=1024: 15/15 500-1023: 0/15 <500: 0/15
   load1<2: 5/15 load5<2: 1/15 blockers>0: 5 apt>0: 0
   gate0: T4-check-only=1, T5=14
   lock: co=5, khong=10
   dpkg 1468->1468
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 17
-- RAM toan phien: min=1350 max=2086 >=1024: 17/17 <500: 0/17
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 1/17
   gan-mo? #15 2026-11-24T11:52:20Z boot=9161bfd1 RAM=1350 L1=0.23 L5=1.88 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 9161bfd1: 17 poll; RAM>=1024 lan cuoi: 2026-11-24T11:52:20Z #15; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 47 luot hop le): P1 210/214 P2 205/205 P3-A1 182/214 P3' 174/186 occ = 137/140 distinct-seq P7 108/108
-- chuoi median 47 luot: n=47 mean=47,6 min=39,0 max=60,0 vuot-60: 0
```
