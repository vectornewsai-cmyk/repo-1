# PHASE9_ROUND183_T4_WEBKIT_QUIET52_LIMITS.md

**Đợt:** 183. **Luồng:** T4 — đo lượt yên WebKit #52 trên 1 boot
+ **#52 CÓ LƯỢT HỢP LỆ — attempt1-51745634: 20/20 + lớp B DAT 5/5
  + tickCost median 44,0 ms ≤ 60. CHUỖI LƯỢT YÊN HỢP LỆ 44 → 45.**
  Ngân sách dùng **1/3**. Poller thoát exit 0 lúc 06:08:24Z —
  trước hạn cắt 07:30Z 1h21'36".
+ **BOOT ĐO: MỘT boot — 51745634 (#101, btime 05:12:27Z; T0-183
  XÁC NHẬN 9 nguồn). 0 reboot trong phiên T4.**
+ **CỘNG DỒN MỚI (45 lượt hợp lệ): P1 199/203, P2 194/194,
  P3-A1 172/203, P3' 163/175 occurrence = 130/134 distinct-seq,
  P7 97/97.** Seq (c2) mới: 229, 329, 472 (kiểm tay vắng thật
  trong sổ as-of-181); 182, 207, 378, 431 ĐÃ THẤY. Sổ
  distinct-seq as-of-183 md5 `b799edb8` (lúc mở `4ea6802e`).
**Ngày:** 24/11/2026 (lượt cron 12:35 +07 24/11 = 05:35:51Z).
**Boot đo:** 51745634 (31 poll: 2 test + 29 poller).

## 0. Verdict tổng

- **#52 CÓ LƯỢT HỢP LỆ (attempt1-51745634).** Cửa yên mở poll
  #29 (06:04:34Z): load1 0,70, load5 1,82, RAM 1824 MB,
  gate0=T5 (POSTBOOT_PASS #101, 05:56:42Z, repair-sớm-quyết-h,
  poll=1, CÓ caveat), lock=khong, blockers=0, apt=0, dpkg 768.
  Attempt chạy 06:04:34–06:07:58Z (3'24"); analyzers chạy
  NGOÀI cửa sổ attempt 06:07:58–06:08:24Z (quyết (p) đợt 179);
  poller thoát exit 0 lúc 06:08:24Z. Ngân sách **1/3**.
- **Chuỗi lượt yên hợp lệ: 44 → 45.** Cộng dồn P1/P2/P3-A1/P3'/
  P7 MỚI như trên (xem §7). Chuỗi median tickCost 45 số
  (mean 47,8, min 39,0, max 60,0; 0 lượt vượt 60).
- **Điều kiện GIỮ NGUYÊN như #50 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **ĐÍNH CHÍNH §12.3 ĐỢT 182 — T4 DÙNG BẢN ĐÃ ĐÍNH CHÍNH:**
  aggregate 182 §12.3 đã bị ĐIỀN SẴN lần thứ 16 lúc 05:27Z
  (tiêu đề mạo danh "(parent viết trực tiếp...)"; parent KHÔNG
  có lượt nào lúc 05:27Z). Parent đã kiểm lại bằng dedup viết
  mới trong lượt này (khớp từng số, lần 87) và đính chính
  aggregate lúc **05:44:21Z (nay 79.228 B)** — T4 đọc lại
  dòng 194–200 lúc ~05:50Z và dùng các quyết THẬT: (a) CHẤP
  NHẬN đợt 182; **(b) chuỗi WebKit FULL PASS VỀ 0** (KHÔNG
  phải GIỮ 1 — đợt 182 không có lượt full pass nên chuỗi đứt;
  đợt 183 có full pass thì chuỗi lên lại 1); (c) #100 KHÔNG
  CÓ cờ, KHÔNG bù được, tổng boot không cờ GIỮ 22; (q) số thứ
  tự đếm là **87** (không phải 86); (d)–(r) giữ nguyên. Các
  số (b)/(q) trong LIMITS này đều theo bản đã đính chính.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 3: ĐẠT (xem §6,
  F-183-T4-5).** Lần đầu có attempt hợp lệ kể từ khi quyết (p)
  đặt ra: 0 file analyzer nào ghi trong cửa sổ attempt
  (06:04:34.368–06:07:58.589Z); file skiplatest mặc định
  `round109-k7/analyze-k7-skiplatest.txt` mtime vẫn
  18:13:20Z (đợt 179) — 0 ghi mới.
- **0 VI PHẠM THEO T4 — CHUỖI 0 VI PHẠM 4 → 5** (chuỗi tính
  lại từ 1 ở đợt 179 theo quyết (p); đợt này giữ sạch: T4
  không khởi động script nặng nào trong lúc gate0wait; không
  probe dpkg nào trong cả phiên — chỉ đọc `wc -l` dpkg.log +
  `pgrep -x`; mọi phân tích (stats, P1/P3-A1/P7, distinct-seq,
  LIMITS) đều làm SAU khi poller thoát 06:08:24Z. Pre-flight
  + 2 test poll chạy TRƯỚC khi mở poller / ngoài cửa sổ
  attempt. Trong cửa sổ attempt T4 chỉ chạy probe + sampler
  của chính attempt (theo thiết kế), không chạy script nặng
  nào khác).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, mọi poll đều tree=YES, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round183-t4.done` viết lúc đóng,
  CÓ NỘI DUNG, trong hạn cờ ~08:00Z; boot lúc đóng vẫn
  51745634 (#101 đã xác nhận).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (05:43:04Z),
ghi vào `hidden_files/round183-t4/preflight-183.txt` — **PASS**
(0 sót; xem F-183-T4-1: 2 lỗi copy-forward phát hiện + sửa
trước pre-flight). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–182:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq as-of-181 md5
  `4ea6802e…` (occ 156/168, distinct 127/131,
  valid_rounds_p3 32).
- **10/10 analyzer** có mặt (+ `run-analyzers-183.sh` —
  quyết (p)); `bash -n` OK 5 script
  T4 (poll-wait, run-attempt, run-analyzers, inner,
  check-classb); `py_compile` OK 12 file py (xem F-183-T4-3:
  LIMITS 182 ghi 13 là đếm thừa 1); Playwright-core
  có mặt (webkit object — import tuyệt đối
  `/home/hatch/scratch-round63-r4/node_modules/playwright-core/
  index.mjs`, cùng đường dẫn probe dùng); media
  `stripes-nonperiodic.mp4` có mặt; không có
  `vite.lock`, không có `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-24
  07:30:00 UTC` → **1795505400** = 07:30Z (hạn cờ ~08:00Z =
  1795507200, hạn cứng 08:35Z = 1795509300); grep 0 hit cho
  `04:30`/`05:00Z`/`05:35Z`/`round181`/`WebKit #51`/`T4-182`/
  `default=182`/`poll-test-182` trong script mới;
  `round182` chỉ còn trong fallback T5FLAG + glob chống nhiễu
  (có chủ đích).
- **Copy-forward 182 → 183:** deadline `04:30Z` → `07:30Z`;
  hạn cờ/cứng `05:00Z`/`05:35Z` → `08:00Z`/`08:35Z`; T5FLAG
  chính `round183-t5/` + fallback `round182-t5/`; W trong 5
  script ĐÃ LÀ `round183-t4`; `T4-182a` → `T4-183a`;
  `default=182` → `default=183`; `WebKit #51` → `#52`;
  glob chống nhiễu `round181-*` → `round182-*`.
  (Grep stale-string lần 2 phát hiện 2 lỗi do sed global
  `182→183` làm hỏng fallback/glob — xem F-183-T4-1; sửa
  TRƯỚC pre-flight; grep lần 3 sạch.)
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 182; `build-distinct-seq-ledger.py` không
  copy theo mẫu 23-file đợt 181 trừ file này); **`tree-md5.txt`
  KHÔNG có trong danh sách cleanup (F-175-T4-1 đã sửa) — còn
  nguyên, nội dung 530e10a7.**
- **Freeze check (F-164-T4-1):** `round182-t4` còn **0 file
  mtime ≥ 05:35:51Z** (giờ mở đợt 183).
- **GATE0 LÚC MỞ: CHƯA ĐẠT TRÊN BOOT #101.** dpkg.log 2 dòng;
  round183-t5 chưa tồn tại lúc 05:43Z (T5-183 viết cờ
  05:56:42Z, 13 phút sau); postboot check-only chạy tay
  **exit 1 FAIL** (thiếu 11 gói apt: libevent-2.1-7t64,
  GST plugins-base/good/bad/ugly/gl/libav/x, libavif16,
  libgstreamer1.0-0, libevdev2 — replay host chưa chạy).
  Gate0=T5 chỉ đạt ở poll #19 (05:57:01Z) sau khi T5 viết cờ.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (05:43:19Z): RAM 1716 MB, load1 4,08/load5 1,99,
  gate0=khong-dat, t5flag=cu (#99), apt=1, dpkg 2.
  Lần 2 (05:43:22Z): RAM 1752 MB, load1 4,08/load5 1,99,
  gate0=khong-dat, t5flag=cu, apt=1, dpkg 2. Cửa chưa mở
  vì load1 >2 + gate0 chưa đạt — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`).
- **RAM lúc mở 1819 MB; load1 3,78–4,08 lúc mở** — cửa
  chỉ mở khi đủ mọi điều kiện.
- **F-176-T4-2 (check-classb đếm sampler n chỉ dòng `boot=`):
  KHÔNG TÁI DIỄN — sampler n=98 đếm đúng (xem §2).**

## 1. Poller — 31 poll thật (2 test + 29), 1 lần cửa mở, 0 reboot

- **Test (POLL_TEST=1), 2 poll, boot 51745634
  (05:43:19Z, 05:43:22Z):** cả 2 đều gate0=khong-dat
  (PB=1), load1 4,08, load5 1,99, RAM 1716/1752 MB,
  lock=khong, blockers=0, apt=1 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần).
  2 poll này nằm trong `poll-test-183.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 51745634 (#101), 29 poll
  (05:43:28–06:04:34Z), 1 lần cửa mở (#29):** RAM ≥1024:
  25/29 (min 743, max 2821 MB); 500–1023: 4/29; **<500: 0/29**;
  load1<2: 9/29; load5<2: 3/29;
  gate0: **T5 11/29** (từ poll #19) + khong-dat 18/29;
  lock=co 4, khong 25 (T0 giữ, poll #20–#23);
  blockers>0: 4 poll; apt>0: 18 poll; dpkg 2 → 768.
- **Giai đoạn 1 — gate0 chưa đạt, replay/T5 repair đang chạy
  (poll #1–#18, 05:43:28–05:56:16Z):** postboot exit=1 suốt;
  t5flag=cu (cờ round182-t5 là của boot #99, mtime < btime
  #101); apt=1 suốt (apt-get host/T5 repair); dpkg ĐỨNG YÊN
  2 dòng; load1 2,26–4,92, load5 1,99–2,44; RAM 743–2182 MB.
  Cửa KHÔNG MỞ ĐƯỢC vì thiếu gate0 + load chưa đủ.
  RAM<1024 lần đầu poll #7 (05:47:59Z, 1016 MB).
- **Giai đoạn 2 — gate0 đạt, T0 giữ lock + blockers
  (poll #19–#23, 05:57:01–06:00:03Z):** poll #19 gate0=T5
  lần đầu (POSTBOOT_PASS #101 viết 05:56:42Z — xem §4),
  dpkg 2 → 768; poll #20–#23 T0-round183 giữ vite.lock
  (pid 550990, port 5560, ticket 1-17954998617) + blockers
  3/5/5/1; load1 leo tới 4,84. Cửa KHÔNG MỞ ĐƯỢC vì thiếu
  lock + blockers + load (tái diễn dạng F-182-T4-3 — xem §6,
  F-183-T4-4). T0 chạy O8 trên #101 trong lúc này (xem §3).
- **Giai đoạn 3 — lock đã nhả, load5 hạ dần (poll #24–#28,
  06:00:48–06:03:49Z):** lock=khong từ poll #24; load1<2 từ
  poll #25 (1,50); load5 2,86 → 2,62 → 2,42 → 2,23 → 2,12
  — vẫn >2. Cửa KHÔNG MỞ (chỉ thiếu load5).
- **CỬA MỞ — poll #29 (06:04:34Z):** load1 0,70, load5 1,82,
  RAM 1824 MB, gate0=T5, lock=khong, blockers=0, apt=0,
  dpkg 768, tree=YES → **CHẠY attempt1 NGAY**.
- **0 reboot trong phiên đo.** Poller thoát exit 0 lúc
  06:08:24Z sau khi attempt hợp lệ (không chạm hạn cắt
  07:30Z).
- **Phân rã 31 poll thật:** RAM≥1024: 27/31; RAM 500–1023:
  4/31; RAM<500: **0/31**. load1<2: 9/31; load5<2: 5/31.
  **Stats "gan-mo" đếm 1 = đúng poll #29 mở cửa thật** (khác
  đợt 182: 23 gan-mo giả — xem §6, F-183-T4-6). gate0: T5
  11/31 (toàn sau 05:56:42Z); khong-dat 20/31 (2 test + 18
  poll). blockers>0: 4 poll (toàn lúc T0 giữ lock trên #101).
  apt>0: 20 poll (2 test + 18 poll giai đoạn 1).

## 2. Attempt — 1 attempt, HỢP LỆ (ngân sách dùng 1/3)

- **attempt1-51745634, 06:04:34–06:07:58Z (3'24"), 20/20
  pass.** JSON `preview-b-f3-flip-webkit-t4-attempt1-51745634.json`
  3.340.763 B. **tickCost total n=621 median=44,0 p90=68,0
  max=124 min=28**; hậu flip+2000ms n=448 median=43,5;
  tBlend gap n=494 median=86,5 p90=108,0 max=1723;
  BlendTick/pass=24,8; rAF/pass median=36 (min 27, max 42);
  webkit=27,2; pageErrs=[]; flip afterPass=5 wallMs=26201;
  tick viaRvfc=0 hậu flip+2000ms: 356.
- **Per-pass median:** 38,0 / 55,0 / 40,0 / 46,0 / 39,5 / 39,0 /
  38,0 / 40,0 / 56,0 / 39,0 / 39,0 / 44,5 / 53,0 / 48,0 /
  43,0 / 53,0 / 41,5 / 56,0 / 55,5 / 36,0 (p90/pass 56,0–76,6;
  load1/pass 0,82 → 0,36; RAM/pass 1229 → 886 MB; pass 19
  RAM 667–846 MB — thấp nhất lượt). Tương quan median~load1
  r=-0,29; median~RAM r=-0,30 (chỉ mô tả, không kết luận
  nhân quả từ 1 lượt).
- **Lớp B DAT 5/5** (`classb-t4-attempt1-51745634.txt`,
  06:07:58Z): sampler n=98, load1_max=0,93, RAM_min=667 MB,
  RAM_max=1803 MB, **0 mẫu RAM<500 MB**, 24 mẫu RAM<1024 MB
  (cảnh báo, không vi phạm); load5 lúc kết thúc 1,27; boot
  lúc bắt đầu = boot hiện tại 05:12:27Z; apt/dpkg thật lúc
  đánh giá (pgrep -x) = 0; **dpkg.log: trước=768, hiện tại=768,
  delta-trong-cửa-sổ=0**; ps-before/after exact-comm apt/dpkg
  = 0. B1 DAT (load5 cuối ≤2,5); B2 DAT (load1 max ≤4 +
  không process phân tích nặng khác — ps-before/after chỉ có
  vite của chính attempt); B3 DAT (không reboot trong lúc đo);
  B4 DAT (pgrep -x=0, ps exact-comm=0, dpkg delta=0);
  B5 DAT (RAM min 667 MB, 0 mẫu <500 MB).
- **(c2) 7/7 COVERED + P3' 7/7 DAT:** seq 182 (stall 3),
  207 (2), 229 (3), 329 (5), 378 (3), 431 (5), 472 (6) —
  đều ở cuối chuỗi đóng băng ≥2 tick; coverage 7/7
  (blendTick hậu-flip trong ±500 ms của log: 356/356 =
  100,0%); P1 7/7 DUNG (baseline 42/356, p=3,18e-07);
  P3-A1 7/7 DUNG (baseline 64/355, p=6,19e-06); P2 7/7
  (cả 7 seq lag +1f; median/p90/max lag đều 1f, 0 âm);
  P7 DUNG (c2 drawSrc delta {-1: 40, 0: 34}; đối chứng toàn
  bộ drawSrc post: {-1: 299, 0: 148}, 0/447 entry trễ ≥+1f);
  labellag (b) lag≥+5f: 0 occurrence; F6' ĐÓNG (skipLatest
  n=50 hậu flip+2000ms: (1) 100,0%, (2) 100,0%).
- **Không attempt nào bị reboot giết; không retry.** Ngân
  sách còn 2/3 (không dùng thêm vì đã có lượt hợp lệ).

## 3. B2 spike / đối chiếu sampler T9 + O8 T0

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT: 0 SPIKE.** T9-183 CÓ
  `b2-spikes.log` Ở ĐÚNG ĐƯỜNG DẪN
  (`~/workspace/repo-1/round183-t9/b2-spikes.log`, 1120 dòng,
  80 header SPIKE; F-181-T9-5 KHÔNG tái diễn): **0 spike
  trong cửa sổ attempt 06:04:34–06:07:58Z**; spike cuối
  06:00:20Z (load1 3,20 — trước attempt 4'14"). Phân tích
  chi tiết thuộc T9-183 (T9 chưa đóng cờ lúc T4 đóng).
- **O8 T0 TRÊN BOOT #101 — PASS 3/3 (theo T0-183.done 06:02Z):
  WebKit 21/21 ×2 (S1 05:57:55Z / 05:58:47Z) + Chromium 21/21
  (S1 05:59:47Z), 05:57:41–06:00:17Z, SAU POSTBOOT_PASS #101
  (05:56:42Z) 59 s.** T4 poll #20–#23 trong cửa sổ O8 đều ghi
  lock=co thread=t0-round183 + blockers → cửa yên KHÔNG mở;
  poll #24 (06:00:48Z, sau khi O8 xong ~31 s) lock=khong.
  **0 giây chồng lấn giữa O8 và attempt T4** (O8 xong
  06:00:17Z, attempt bắt đầu 06:04:34Z — cách 4'17"). T0 giữ
  lock 157 s; 0 attempt chồng (T0-183.done).
- **Ghi trong cửa sổ attempt: KHÔNG CÓ.** `run-analyzers-183.sh`
  chạy 06:07:58–06:08:24Z, SAU khi attempt-done đã ghi
  (06:07:58.589Z) — xem kiểm chứng live lần 3 (§6,
  F-183-T4-5). File `hidden_files/round109-k7/
  analyze-k7-skiplatest.txt` mtime vẫn 2026-11-23 18:13:20Z
  (đợt 179) — 0 ghi mới.

## 4. Replay/postboot — POSTBOOT_PASS #101 ĐÃ CÓ (repair-sớm-quyết-h, poll=1, CÓ caveat)

- **Boot 51745634 (btime 05:12:27Z, số hiệu #101 — T0-183 XÁC
  NHẬN 9 nguồn; gap #100→#101 = 7.400 s).**
- **POSTBOOT_PASS #101 ĐÃ CÓ 05:56:42Z** (boot+44m15s;
  watcher-183 pid 384639, **mode repair-sớm-quyết-h, poll=1,
  CÓ caveat** (GST symlink, tools không cài; libc-bin 8.12);
  verify độc lập exit=0; 11/11 gói NEED + 5/5 lib; dpkg 768,
  cache 107, lists 66; T5-183.done 06:05:00Z). Gate0=T5 từ
  poll #19 (05:57:01Z). Hướng (3) VẪN ĐỨNG lần 30.
- **#100 KHÔNG CÓ cờ — KHÔNG BÙ ĐƯỢC (quyết (c) đã đính
  chính):** boot #100 đã chết (reboot sang #101 lúc
  05:12:27Z); T5-183 chỉ kiểm tính khả thi, kết luận không
  thể repair hậu kỳ (log mất); tổng boot không cờ **GIỮ 22**.
  Giao T5-183 watcher + repair cho boot HIỆN TẠI (#101) —
  đã làm xong, cờ #101 CÓ.
- **0 REBOOT trong cửa sổ attempt; 0 REBOOT trong phiên đo.**
  Số hiệu #101 đã xác nhận (T0-183); (m) #101 + INSIDE #101
  thuộc T2-183; #101 có giết holder không — T0-183 ghi
  #100 + #101 đều KHÔNG GIẾT HOLDER (chuỗi = 6 nếu parent
  xác nhận); POSTBOOT_PASS #101 CÓ — giá trị chân gate (a)
  cho chuỗi FULL PASS: **lượt yên #52 CÓ trên #101 + gate (a)
  #101 CÓ (caveat) + O8 T0 PASS 3/3 trên #101 — 3 chân CÙNG
  BOOT #101**; O8 T8 + harness thuộc T8-183. Chuỗi FULL PASS
  **VỀ 0** theo quyết (b) đã đính chính (đợt 182 không có
  full pass) — đợt 183 có full pass thì chuỗi lên lại 1
  (parent quyết cuối).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-183 báo cáo.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND183_T4_WEBKIT_QUIET52_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round183-t4/`):**
  `poll-wait-t4-183.sh` (deadline 07:30Z 24/11 + cờ T5
  round183-t5/ + fallback round182-t5/),
  `run-attempt-183.sh` (lượt yên #52),
  `run-analyzers-183.sh` (chạy classb + 9 analyzer
  NGOÀI cửa sổ attempt; đợt này ĐÃ CHẠY 06:07:58–06:08:24Z),
  `distinct-seq-183.py` (helper đọc sổ; đợt này DÙNG LIVE —
  sổ as-of-183: 130/134 distinct, occ 163/175).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–182, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round183-t4/` — theo đúng mẫu 149–182: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round183-t4/`, md5 `078938cf...`,
  giống hệt bản đợt 156–182).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-183.sh`, `run-attempt-183.sh`,
  `run-analyzers-183.sh`,
  `t4-attempt-inner.sh` (W = round183-t4 + glob check nhiễu
  chéo round182-*), `check-classb-t4.sh` (W = round183-t4 +
  đếm sampler n chỉ dòng `boot=` — fix F-176-T4-2),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-183.py` (thống kê §A;
  footer CỘNG DỒN MỚI 45 lượt),
  `distinct-seq-183.py` (helper đọc sổ — DÙNG LIVE),
  `distinct-seq-ledger.json` (SỔ distinct-seq, as-of-183:
  130/134 distinct, occ 163/175, valid_rounds_p3 33,
  non_dat [260, 283, 364, 498]; md5 `b799edb8…` — ĐÃ THĂNG
  CẤP từ bản đề xuất, sổ gốc as-of-181 `4ea6802e…` còn
  trong `distinct-seq-ledger-183-proposed.json` đối chiếu),
  `preflight-183.txt` + `preflight-postboot-183.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2).
- **Log/evidence (hidden_files/round183-t4/, không stage):**
  `poll-t4.log` (29 poll trên #101 + dòng CUA YEN MO #29 +
  LUOT HOP LE), `poll-t4.nohup.log` (1 instance),
  `poll-test-183.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + CUA YEN MO + analyzers +
  LUOT HOP LE, thoát poller exit 0),
  `postboot-t4-183-gate0wait-*.log` (check-only mỗi 4 poll;
  PB=1 tới poll #21 rồi PB=0),
  `stats-183-output.txt` (output stats-183.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có
  blockers: #20–#23 T0 giữ lock),
  `preview-b-f3-flip-webkit-t4-attempt1-51745634.json`
  (3.340.763 B — KHÔNG stage, binary-json lớn),
  `analyze-t4-attempt1-51745634-*.txt` (9 analyzer),
  `classb-t4-attempt1-51745634.txt` (lớp B 5/5),
  `coverage-check-attempt1-51745634.txt` (7/7),
  `attempt-done-attempt1-51745634` (ngân sách 1/3),
  `load-mid-t4-attempt1-51745634.log` (sampler n=98),
  `run-webkit-t4-attempt1-51745634.log`,
  `ps-before/after-t4-attempt1-51745634.txt`.
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  06:08:24Z exit 0; 0 vite; 0 Xvfb; 0 MiniBrowser/WebProcess —
  chỉ còn socket X193 mồ côi, xem F-183-T4-2).

## 6. Sai số F-183-T4-1..7 (+ nợ cũ)

- **F-183-T4-1 — COPY-FORWARD: SED GLOBAL `182→183` LÀM HỎNG
  FALLBACK + GLOB (GHI NHẬN — DẠNG F-182-T4-9, MỨC NẶNG
  HƠN).** Sau sed, `T5FLAG_FALLBACK` thành round183-t5/
  (trùng cờ chính — fallback mất tác dụng) và glob chống
  nhiễu trong `t4-attempt-inner.sh` thành round183-*
  (kiểm nhầm thư mục đợt hiện tại thay vì đợt trước).
  Nguyên nhân: placeholder round181→roundTMP→round182 bị
  sed `182→183` cuối cùng ghi đè. Phát hiện bằng grep kiểm
  lần 2 (soát `round18` toàn bộ 7 file) + sửa TRƯỚC
  pre-flight (fallback → round182-t5; glob → round182-*;
  grep lần 3 sạch). Không ảnh hưởng vận hành (poller chạy
  với fallback đúng; cửa mở nhờ cờ chính round183-t5).
  Bài học: sed global số đợt PHẢI chạy sau bước placeholder,
  hoặc dùng thay thế có neo `round182-t5` riêng.
- **F-183-T4-2 — SOCKET X193 MỒ CÔI SAU ATTEMPT (MỚI — TÁI
  DIỄN DẠNG F-181-T4-3).** Lúc đóng, `/tmp/.X11-unix/` có
  1 socket X193 (mtime 06:04Z — tạo lúc attempt bắt đầu),
  0 process Xvfb. T4 không dọn tay (giữ nguyên hiện trạng
  làm bằng chứng; tiền lệ F-181-T4-3/F-182-T4-7: reboot sau
  đã xóa). Giao T10/parent quyết dọn hay giữ.
- **F-183-T4-3 — PY_COMPILE 12 FILE, KHÔNG PHẢI 13 (GHI NHẬN
  — LIMITS 182 ĐẾM THỪA 1).** Trong `round183-t4` chỉ có
  12 file py (10 analyzer + stats + distinct-seq) — cả 12
  đều compile OK. LIMITS 182 ghi "py_compile OK 13 file py"
  trong khi `round182-t4` cũng chỉ có 12 file py — số 13
  là đếm thừa (nhiều khả năng đếm cả `__pycache__` hoặc
  nhầm). Không ảnh hưởng pre-flight (đủ 12/12).
- **F-183-T4-4 — T0-ROUND183 GIỮ VITE.LOCK + BLOCKERS TRONG
  LÚC POLLER CHỜ GATE (tái diễn dạng F-182-T4-3/F-181-T4-4).**
  Poll #20–#23: lock=co (thread=t0-round183, pid 550990,
  port 5560, ticket 1-17954998617) + blockers 3/5/5/1;
  load1 leo tới 4,84. O8 T0 PASS 3/3 trên #101
  (05:57:41–06:00:17Z) và nhả lock trước poll #24 (06:00:48Z)
  — bàn giao sạch (xem §3). Giao T0/T10 đối chiếu lịch các
  luồng trong cửa sổ 05:57–06:00Z.
- **F-183-T4-5 — QUYẾT (p) KIỂM CHỨNG LIVE LẦN 3: ĐẠT
  (MỚI — F-179-T4-5 ĐÃ HẾT).** Cửa sổ attempt
  06:04:34.368Z (marker) → 06:07:58.589Z (attempt-done).
  Run-analyzers bắt đầu 06:07:58Z (cùng giây với attempt-done,
  sau trap EXIT). Mtime sớm nhất của 9 file analyzer +
  classb: classb 06:07:58.697Z, c2drawlog 06:07:58.839Z —
  cả hai SAU attempt-done 06:07:58.589Z; 8 file còn lại
  06:08:06–06:08:24Z. **0 file analyzer ghi trong cửa sổ
  attempt.** File skiplatest mặc định
  `hidden_files/round109-k7/analyze-k7-skiplatest.txt`
  mtime vẫn 2026-11-23 18:13:20Z — 0 ghi mới. Kiểm chứng
  live lần 3 (đợt 179–182 dời 3 lần vì 0 attempt) nay
  THỰC HIỆN ĐƯỢC và ĐẠT.
- **F-183-T4-6 — STATS "GAN-MO" = 1 = ĐÚNG POLL MỞ CỬA
  (KHÔNG CÒN MÂU THUẪN — F-182-T4-6 ĐÃ HẾT).** Stats đếm
  poll đủ load1<2 + load5<2 + RAM≥1024: 1 poll (#29) — đúng
  poll mở cửa thật (gate0=T5). Khác đợt 182 (23 gan-mo giả,
  cửa thật 0).
- **F-183-T4-7 — B2: 0 SPIKE TRONG CỬA SỔ ATTEMPT; LOG DỪNG
  SPIKE CUỐI 06:00:20Z (GHI NHẬN).** `b2-spikes.log` CÓ tại
  `~/workspace/repo-1/round183-t9/` (1120 dòng, 80 header
  SPIKE); 0 spike trong 06:04:34–06:07:58Z; spike cuối
  06:00:20Z load1 3,20. T9-183 chưa đóng cờ lúc T4 đóng —
  phân tích đầy đủ (watcher còn sống không, vì sao không
  còn spike sau 06:00:20Z) thuộc T9-183.
- **F-182-T4-1 — KHÔNG TÁI DIỄN.** 0 reboot trong phiên T4
  (1 boot duy nhất 51745634).
- **F-182-T4-4 — ĐÃ HẾT THEO NGHĨA MỚI (xem §4).** #100
  KHÔNG CÓ POSTBOOT_PASS và KHÔNG bù được (quyết (c) đã
  đính chính — boot đã chết); T5-183 repair #101 thành
  công, cờ #101 CÓ 05:56:42Z.
- **F-182-T4-5 — ĐÃ HẾT (xem F-183-T4-5 — kiểm chứng live
  lần 3 ĐẠT).**
- **F-182-T4-6 — ĐÃ HẾT (xem F-183-T4-6).**
- **F-182-T4-7 — TÁI DIỄN DƯỚI DẠNG F-183-T4-2** (socket X193
  mồ côi — lần này sau attempt, không phải sau reboot).
- **F-182-T4-9 — TÁI DIỄN DƯỚI DẠNG NẶNG HƠN F-183-T4-1.**
- **F-181-T4-1 — ĐÃ HẾT (xem F-183-T4-6).**
- **F-181-T4-2 — KHÔNG ÁP DỤNG (đợt này CÓ attempt; kiểm
  chứng lần 3 xem F-183-T4-5).**
- **F-181-T4-3 — TÁI DIỄN DƯỚI DẠNG F-183-T4-2.**
- **F-181-T4-4 — TÁI DIỄN DƯỚI DẠNG F-183-T4-4.**
- **F-181-T4-5 — KHÔNG TÁI DIỄN (xem F-183-T4-7 — kiểm đúng
  đường dẫn ngay từ đầu).**
- **F-181-T4-6 — CÓ SỐ MỚI (xem §7): chuỗi median 44 → 45,
  thêm 44,0 ms; mean 47,9 → 47,8.**
- **F-181-T4-7 — KHÔNG ÁP DỤNG (sampler n=98 đếm đúng dòng
  `boot=` — xem §0b).**
- **F-181-T4-8 — KHÔNG ÁP DỤNG (p90 tickCost 68,0 ms — chỉ
  ghi nhận, không có bar p90).**
- **F-179-T4-5 — ĐÃ HẾT (xem F-183-T4-5).**
- **F-178-T4-1 — KHÔNG TÁI DIỄN.** 0 tick probe-mo của T9
  trong cửa sổ attempt (0 spike — xem §3).
- **F-177-T4-4 — KHÔNG TÁI DIỄN (xem F-183-T4-7).**
- **F-177-T4-6 — TÁI DIỄN DƯỚI DẠNG F-183-T4-1.**
- **F-176-T4-1 — KHÔNG TÁI DIỄN.** 0 vi phạm quy tắc đứng theo
  T4 — chuỗi 0 vi phạm 4 → 5 ở đợt 183.
- **F-176-T4-2 — KHÔNG TÁI DIỄN.** Sampler n=98 (xem §2).
- **F-175-T4-1 — KHÔNG TÁI DIỄN.** `tree-md5.txt` không còn
  trong danh sách cleanup copy-forward; test poll lần 1
  tree=YES ngay.
- **F-175-T4-2 — KHÔNG TÁI DIỄN.** 0 ghi analyzer trong cửa
  sổ attempt (xem F-183-T4-5).
- **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG F-183-T4-4.**
- **F-175-T4-5 — KHÔNG TÁI DIỄN.** 0 reboot trong phiên.
- **F-174-T4-1 — KHÔNG ÁP DỤNG (p1p3p7 chạy tay sau attempt
  — kết quả §7, không lỗi).**
- **F-174-T4-3 — KHÔNG TÁI DIỄN.** Kiểm process lúc đóng dùng
  `ps` trực tiếp (0 process T4, 0 Xvfb) — không dùng `pgrep -f`.
- **F-174-T4-4 — KHÔNG ÁP DỤNG (p1p3p7 chạy — 7/7 cả ba).**
- **F-174-T4-6 — KHÔNG TÁI DIỄN.** RAM <500 MB: **0/31 poll**
  toàn phiên (min 743 MB) — không có attempt nào chạy trên
  RAM thấp.

## 7. P3' cộng dồn (MỚI — 45 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 183 (MỚI): P1 199/203, P2 194/194,
  P3-A1 172/203, P3' 163/175 occurrence = 130/134 distinct-seq,
  P7 97/97** (45 lượt hợp lệ — #52 CÓ lượt hợp lệ nên cộng
  thêm 7 seq).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #52: 7/7 seq (c2) ĐẠT cả P1 + P2 + P3-A1 +
  P3'** (seq 182, 207, 229, 329, 378, 431, 472; stall 3, 2,
  3, 5, 3, 5, 6); P7 ĐÚNG (0/447 entry trễ ≥+1f).
  Helper `distinct-seq-183.py` DÙNG LIVE (quyết (t) đợt 162):
  sổ as-of-181 (127/131 distinct, occ 156/168) + stall/
  c2coverage attempt1-51745634 → **130/134 distinct,
  163/175 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 229, 329, 472** (chưa có trong sổ);
  **182, 207, 378, 431 ĐÃ THẤY** (trong sổ).
  T4 kiểm tay lại sổ as-of-181: cả 3 seq mới vắng thật
  (229/329/472 không có trong `seen_dat` lẫn `seen_c2`).
- **P1 — ĐÚNG 7/7 occ** (cả 7 seq gần run-end ±1 tick; trong
  14 run_end seqs; baseline 42/356, p=3,18e-07 — verdict
  ĐÚNG theo luật DEF §3 vì n=7 ≥3 VÀ p<0,01). Cộng dồn
  192/196 → **199/203**.
- **P2 ĐÚNG — 7/7 occ** (cả 7 seq lag +1f; DEF §4 chỉ đòi
  lag ≥ +1f; median/p90/max lag đều 1f, 0 âm). Cộng dồn
  187/187 → **194/194**.
- **P3-A1 — ĐÚNG 7/7 occ** (cả 7 seq đóng băng-tại-tick;
  baseline 64/355, p=6,19e-06 — verdict ĐÚNG theo luật DEF
  §5 vì p<0,01 và n≥3). Cộng dồn 165/196 → **172/203**.
- **P3' 7/7 occ ĐẠT** (stall: 182=3, 207=2, 229=3, 329=5,
  378=3, 431=5, 472=6). Cộng dồn 127/131 → **130/134
  distinct** (3 seq ĐẠT MỚI — 229, 329, 472);
  occurrence 156/168 → **163/175**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 40,
  0: 34}; đối chứng toàn bộ drawSrc post: {-1: 299, 0: 148},
  0/447 entry). Cộng dồn 90/90 → **97/97**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162).**
  Helper `distinct-seq-183.py` đọc sổ (as-of 181: 127/131
  distinct, occ 156/168), tính seq MỚI = tập hiệu với sổ,
  in cộng dồn mới, ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-183-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Live đợt 183:** sổ + stall/c2coverage attempt1-51745634 →
  **130/134 distinct, 163/175 occ** — khớp tính tay trên.
  Sổ ĐÃ THĂNG CẤP: as-of 183, 130/134 distinct, occ 163/175,
  valid_rounds_p3 33, non_dat [260, 283, 364, 498] (không đổi;
  sổ gốc as-of-181 md5 `4ea6802e…` còn trong file đề xuất
  đối chiếu; sổ mới md5 `b799edb8…`).
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (lượt #52 thêm 3 seq mới đều ĐẠT cả
  P1/P2/P3-A1/P3' — ủng hộ thêm, không đổi verdict).
- Chuỗi median tickCost 45 lượt (MỚI — thêm 44,0 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 /
  39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 /
  58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 /
  44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 /
  53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 / 50,0 /
  45,0 / 49,5 / 44,0 / 50,0 / 44,0 ms (tổng 2149,5; trung bình
  47,8 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 184

- **(a) #52 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 44 → 45.**
  Chân lượt yên cho chuỗi FULL PASS **CÓ đợt này** (attempt1
  trên #101, 20/20 + B 5/5 + median 44,0 ms) — cùng boot với
  gate (a) #101 (CÓ, caveat) + O8 T0 PASS 3/3 trên #101.
  Chuỗi FULL PASS **VỀ 0** theo quyết (b) đã đính chính
  (đợt 182 không có full pass) — đợt 183 có full pass thì
  chuỗi lên lại 1 (parent quyết cuối — còn chờ chân O8 T8 +
  harness của T8-183).
- **(b) P3' cộng dồn MỚI 45 lượt: P1 199/203, P2 194/194,
  P3-A1 172/203, P3' 163/175 = 130/134, P7 97/97:**
  sổ distinct-seq as-of-183 md5 `b799edb8…` (3 seq mới 229,
  329, 472 — kiểm tay vắng thật). **Chờ parent/T10 quyết:**
  ghi nhận cộng dồn mới.
- **(c) BOOT 51745634 (số hiệu #101) — T0-183 ĐÃ XÁC NHẬN 9
  nguồn (gap #100→#101 = 7.400 s).**
  **(m) #101 (T2-183 + parent 183; số liệu thô +41,126 s từ
  T0-183); INSIDE #101 (T2-183; FULL147); #101 KHÔNG GIẾT
  HOLDER (T0-183 — chuỗi = 6 nếu parent xác nhận).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale-string lần 2 bắt được 2 lỗi
  copy-forward do sed global (F-183-T4-1 — sửa trước
  pre-flight); gate0 CHƯA ĐẠT lúc mở nhưng T5 viết cờ sau
  13 phút (repair #101 thành công).
- **(e) POSTBOOT_PASS #101 ĐÃ CÓ (05:56:42Z, boot+44m15s,
  repair-sớm-quyết-h, poll=1, CÓ caveat): GHI NHẬN — cờ CÓ
  caveat (GST symlink, tools không cài). Giá trị cho gate (a)
  thuộc T8/T10 quyết. #100 KHÔNG CÓ — KHÔNG bù được, tổng
  boot không cờ GIỮ 22 (quyết (c) đã đính chính).** Hướng (3)
  VẪN ĐỨNG lần 30.
- **(f) RAM <500 MB: 0/31 poll (min 743 MB).** Không có
  attempt nào chạy trên RAM thấp. Giao T9-183 đối chiếu
  balloon trên #101.
- **(g) (m) #101 (T2-183 + parent 183); (m) #56 lần 26
  (T2-183); mù #96?/#95?/#94?/#88? (hole-recheck lần 27)/#77?
  (T2-183); (c')/(f') — đợt này 0 kích hoạt mới (chờ T8-183);
  Plan B B1 (T8-183); 84l10 + Q3 heartbeat (T8-183, driver
  hb128 làm chuẩn); E-218 kết cục (T9-183; E-219 nếu ghim
  tiếp trên #101); #101 có giết holder không (T0-183 ghi
  KHÔNG — chuỗi = 6 nếu parent xác nhận); prune lần 58
  (T6-183); checklist (o) (T8-183); H3 chỉ giám sát thụ động;
  birefnet 0 thử lần 37; nhắc mọi luồng: KHÔNG chạy script
  nặng / KHÔNG probe dpkg trong cửa sổ attempt (đợt này T4
  giữ 0 vi phạm — chuỗi 4 → 5); u2net là fallback chính thức;
  ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; G1
  chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT** (dpkg delta
  0, apt/dpkg 0 — xem §2). Trong lúc chờ gate, host/T5 repair
  chạy apt (dpkg 2 → 768) — KHÔNG phải replay của luồng T4.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (attempt1 hợp lệ) → **CÓ lượt yên hợp lệ #52 cho chuỗi
  FULL PASS** (cùng boot #101 với O8 T0). T8 tự quyết O8
  đợt này (O8 T0 trên #101 PASS 3/3 — 05:57:41–06:00:17Z;
  O8 T8-183 thuộc T8-183 báo cáo).
- **(j) F-183-T4-1 (sed global làm hỏng fallback/glob —
  sửa trước pre-flight); F-183-T4-2 (socket X193 mồ côi sau
  attempt); F-183-T4-5 (quyết (p) kiểm chứng live lần 3
  ĐẠT — F-179-T4-5 ĐÃ HẾT); F-183-T4-6 (stats gan-mo = 1 =
  poll mở cửa thật).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-183.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-183.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-24T05:43:19Z - 2026-11-24T05:43:22Z, boot=51745634
   RAM min=1716 max=1752 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 2/2 blockers>0: 0 apt>0: 2
   gate0: khong-dat=2
   lock: khong=2
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 29 poll, 2026-11-24T05:43:28Z - 2026-11-24T06:04:34Z, boot=51745634
   RAM min=743 max=2821 >=1024: 25/29 500-1023: 4/29 <500: 0/29
   load1<2: 9/29 load5<2: 3/29 blockers>0: 4 apt>0: 18
   gate0: T5=11, khong-dat=18
   lock: co=4, khong=25
   dpkg 2->768
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 31
-- RAM toan phien: min=743 max=2821 >=1024: 27/31 <500: 0/31
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 1/31
   gan-mo? #29 2026-11-24T06:04:34Z boot=51745634 RAM=1824 L1=0.70 L5=1.82 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round183-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 51745634: 31 poll; RAM>=1024 lan cuoi: 2026-11-24T06:04:34Z #29; RAM<1024 lan dau: 2026-11-24T05:47:59Z #7 RAM=1016
-- cong don P3' (MOI, 45 luot hop le): P1 199/203 P2 194/194 P3-A1 172/203 P3' 163/175 occ = 130/134 distinct-seq P7 97/97
-- chuoi median 45 luot: n=45 mean=47,8 min=39,0 max=60,0 vuot-60: 0
```
