# PHASE9_ROUND162_T4_WEBKIT_QUIET31_LIMITS.md

**Đợt:** 162. **Luồng:** T4 — đo lượt yên WebKit #31 trên 1 boot
+ LƯỢT HỢP LỆ #27 (chuỗi lượt yên hợp lệ nối dài: #22 đợt 157 →
#23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161 → #27
đợt 162)
+ KHÔNG PAGE-WEDGED (0 wedge — lần thứ 6 liên tiếp: đợt 157, 158,
159, 160, 161, 162).
**Ngày:** 21/11/2026 (lượt cron 18:35 +07 21/11 = 11:35:51Z 21/11).
**Boot đo:** d9a8d1ce (reboot #64 ỨNG VIÊN, CHƯA XÁC NHẬN — T2-162,
btime 11:15:18Z — boot lúc mở; KHÔNG có reboot mới trong lúc đo hay
lúc đóng sổ; kiểm cuối 12:02Z vẫn d9a8d1ce).
**Trạng thái:
#31 CÓ LƯỢT HỢP LỆ — attempt1 ĐẠT NGAY ở lần mở cửa đầu tiên
(11:54:39Z), ngân sách 3/3 chỉ dùng 1/3 (attempt1 20/20, LỚP B ĐẠT
5/5, tickCost median 42,0 ms ≤60; poller thoát 11:58:30Z, trước hạn
cắt poller 13:30Z gần 1 giờ 32 phút, trước hạn cờ ~14:00Z hơn 2 giờ).
(c2)=8 occurrence / 8 distinct-seq, COVERED 8/8. P1 ĐÚNG (6/8 occ),
P2 ĐÚNG (8/8 lag +1f trở lên, 0 âm), P3-A1 ĐÚNG TRỞ LẠI 7/8
(p=0,000231615 — sau 2 lần SAI liên tiếp đợt 160/161), P3' 8/8 occ
ĐẠT (DAT seq 233, 293, 322, 346, 370, 397, 424, 478 — 4 seq MỚI:
233, 346, 370, 424; 4 seq ĐÃ THẤY: 293, 322, 397, 478), P7 ĐÚNG
(0 entry trễ ≥+1f). lag≥+5f (b) = 16 occurrence / 4 event — TÁI
DIỄN lần đầu kể từ đợt 157 (đợt 158–161: 0 occ; xem F-162-T4-1).
Cộng dồn MỚI (27 lượt hợp lệ): P1 105/108, P2 99/99, P3-A1 89/108,
P3' 72/80 occurrence = 67/74 distinct-seq, P7 61/61. PRE-FLIGHT CHECK
(quyết (t) đợt 158) PASS PHẦN SETUP — gate0 lúc mở là T4-check-only
(postboot exit 0, replay đang chạy), cờ T5-162 tới ở poll #3
(11:40:00Z, replay-đầy-đủ — khác đợt 161: replay tự nhiên VẮNG MẶT,
phải early-repair; xem §0b + §3). Cờ T5-162 CÓ cho boot đo
(POSTBOOT_PASS 11:40:00Z, boot+24m42s, dpkg 1545). RAM KHÔNG SẬP
<500 MB lần nào (0/23 poll — khác đợt 161: 37/89 poll <500 MB);
cửa phải chờ 21 poll vì load5 cao đầu đợt (max 6,06), không phải vì
RAM — xem F-162-T4-7.**

## 0. Verdict tổng

- **#31 CÓ LƯỢT HỢP LỆ (lượt hợp lệ #27, attempt1).**
  Ngân sách 3 attempt/đợt dùng **1/3**: attempt1 ĐẠT NGAY, không
  retry. Poller poll lại gate theo quyết (h) đợt 149 không cần
  dùng tới (chỉ 1 lần mở cửa). Poller thoát 11:58:30Z vì
  LUOT HOP LE — KHÔNG phải hết ngân sách hay hết hạn (hạn cắt
  13:30Z còn ~1 giờ 32 phút, hạn cờ ~14:00Z còn hơn 2 giờ).
- **Attempt1-d9a8d1ce (11:54:39–11:58:30Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 42,0 ≤ 60, lớp B 5/5).** Vite :5187
  (ready 3 s, giữ lock ~4 phút), WebKit 27.2 (Xvfb :193), app boot
  OK 11:54:48Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT.
  20 pass (wall 2820–3426 ms/pass): tickCost n=646, blendTick
  n=522, c2DrawLog n=1252. **tickCost total median= 42,0 ms
  (p90 68,0, max 98, min 28)**; hậu flip+2000 ms median 41,0.
  Per-pass median 36,5–53,0 ms — 20/20 pass ≤60.
  **(c2)=8 occurrence / 8 distinct-seq, COVERED 8/8.**
  lag≥+5f (b) = 16 occurrence / 4 event — xem F-162-T4-1.
  **p1p3p7 chạy TAY (F-148-T4-1): P1 ĐÚNG, P2 ĐÚNG, P3-A1 ĐÚNG,
  P3' ĐẠT, P7 ĐÚNG** (xem §6). **KHÔNG PAGE-WEDGED** —
  attempt1 chạy đủ 20/20, 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.569.367 B, `passes=20`, không có trường
  `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (77/77 +
  316/316 tick không vi phạm thật, bar ≥90%, xem skiplatest).
- **Poller: 23 poll thật** (1 test + 22 poller), **1 boot duy
  nhất, 1 instance duy nhất** (không chết/khởi động lại; fix
  F-155-T4-1 giữ vững đợt thứ bảy). RAM ≥1024: 23/23;
  **0/23 poll <500 MB** (khác đợt 161: 37/89); chuỗi RAM<500 dài
  nhất 0 poll. **1 poll duy nhất** load+RAM cùng đạt — **chính
  poll mở cửa** (#22); **0 poll gần-mở bị chặn bởi gate0**.
  Gate0: T5 20 poll, T4-check-only 2 poll (poller) + 1 poll test.
  apt>0: 0 poll. load5<2: chỉ 1/22 poll (poller) — tải đầu đợt
  cao là nguyên nhân chờ cửa chính (xem F-162-T4-7).
- **Chuỗi lượt yên hợp lệ: NỐI DÀI LÊN #27.** Cộng dồn 27 lượt:
  P1 105/108, P2 99/99, P3-A1 89/108, **P3' 72/80 occurrence =
  67/74 distinct-seq**, P7 61/61. Chuỗi median tickCost 27 lượt:
  39,0–60,0 ms, mean ~47,6 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #30 (quyết (i) đợt 161):** ngưỡng
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi
  ngưỡng/cadence nào.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc inner-end, lúc run-attempt
  exit — không đổi; mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round162-t4.done` viết ~12:02Z 21/11
  (trong hạn cờ ~14:00Z, sớm hơn ~2 giờ), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158)

Chạy **trước mọi attempt, trước khi mở poller** (11:38:35–11:38:44Z),
ghi vào `hidden_files/round162-t4/preflight-162.txt` — **PASS
PHẦN SETUP, GATE0 LÀ T4-CHECK-ONLY LÚC MỞ (không phải lỗi setup)**:

- **b.json CÓ trong `round162-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156/157/158/159/160/161 (F-158-T4-1/2 KHÔNG lặp lại: file spec đã
  có trước khi poller chạy).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–161. **vite.t4-temp.config.mjs md5
  `e3e874e1528b28563f7aa26234661522`** — khớp.
- **tree-md5.txt `530e10a7` == preview.tsx hiện tại** (`530e10a7`).
- **10/10 analyzer** `analyze-t4-*.py` có mặt (c2coverage,
  c2drawlog, labellag, lag5, p1p3p7, perpass, skiplatest, stall,
  tickcost, wallbands).
- **Script hệ thống:** `vcut-webkit-postboot-check.sh` +
  `vcut-vite-lock-v2.sh` có mặt; `bash -n` OK cả 4 script T4;
  `python3 -m py_compile` OK 12 file py.
- **Playwright-core** `/home/hatch/scratch-round63-r4/
  node_modules/playwright-core/index.mjs` có mặt.
- **Media** `apps/web/public/stripes-nonperiodic.mp4` có mặt
  (140.828 B).
- **Lock + ngân sách trống:** không có `vite.lock`,
  không có `attempt-done-*` trong thư mục làm việc mới.
- **Deadline waiter epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG
  (bài học F-156-T8-3):** chuỗi deadline trong script
  `2026-11-21 13:30:00 UTC` → epoch **1795267800** =
  2026-11-21T13:30:00Z — khớp đúng hạn cắt poller 13:30Z
  (hạn cờ ~14:00Z = 1795269600, hạn cứng 14:30Z =
  1795271400); không còn sót dạng `10:30`/`07:30`/`08:00`/`08:30`
  nào trong script mới (grep 0 hit).
- **GATE0 LÚC MỞ LÀ T4-CHECK-ONLY (postboot exit 0 — khác đợt
  161: exit 1, replay frozen):** boot #64 mới (d9a8d1ce, btime
  11:15:18Z), dpkg.log 1488 dòng lúc kiểm đầu rồi 1545 dòng
  lúc poll #1 (replay ĐANG CHẠY — apt-get installing
  fonts-wqy-zenhei lúc 11:37Z); cờ T5-162 CHƯA CÓ; cờ T5-161
  `cu(mtime-cu)` (mtime 08:59:30Z < btime 11:15:18Z) — KHÔNG
  tính cho boot mới; postboot check-only chạy tay **exit 0**
  (đủ 11 gói + GST 269 plugin, xem `preflight-postboot-162.log`).
  Đây là trạng thái chờ hợp lệ của boot mới, không phải lỗi
  setup — poller poll 45 s/lần và mở cửa khi gate A đạt
  (gate0 đã có sẵn qua T4-check-only; cờ T5 tới ở poll #3).
- **Test poll (POLL_TEST=1): exit 7 đúng thiết kế** —
  poll #1 RAM 2242 MB, load1 4,71/load5 2,13 (cửa đóng vì load
  cao), gate0=T4-check-only, tree YES, blockers 0, apt 0,
  dpkg 1545 (xem `poll-test-162.log`).
- **Copy-forward đợt 161 → 162:** grep toàn bộ `161` cũ sau
  sed — chỉ còn `round161-t5` fallback (đúng) + chú thích lịch
  sử; sửa thêm `round162-*` trong t4-attempt-inner.sh (dòng
  find FUNCTIONAL — xem F-162-T4-5). Deadline `10:30` → `13:30`
  ở cả 3 dạng (`2026-11-21 10:30:00 UTC`, `10:30Z`,
  `T10:30:00Z`); `brief dot 161` → `brief dot 162`;
  `poll-test-161`/`stats-161`/`distinct-seq-161` → 162;
  base distinct-seq 61/64 → 63/66 (xem §6 + F-162-T4-3/5).

## 1. Poller — 23 poll thật, 1 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot d9a8d1ce
  (11:38:44Z):** poll #1 RAM=2242 MB, load1=4,71 load5=2,13,
  blockers=0, gate0=T4-check-only (postboot exit 0, T5-161 cu)
  → cửa đóng (load cao) → **TEST-POLL-OK exit 7 đúng thiết kế**.
  Poll này nằm trong `poll-test-162.log`; thống kê §A đã hợp nhất.
- **Instance 2 (không POLL_TEST), 22 poll, boot d9a8d1ce
  (11:38:48–11:54:39Z):** RAM ≥1024: 22/22; load1<2: 10/22;
  load5<2: 1/22; gate0: T4-check-only 2, T5 20;
  lock=khong 22/22; dpkg 1545 → 1545; blockers=1 ở 1 poll (#2);
  apt>0: 0 poll.
- **Giai đoạn 1 — chờ load5 hạ (poll #1–#21, 11:38–11:53Z):**
  gate0 đạt từ poll #3 (cờ T5-162 viết 11:40:00Z, dpkg 1545);
  RAM luôn ≥1024 (min 1694 MB, max 3225 MB) — RAM KHÔNG BAO GIỜ
  chặn cửa đợt này (khác đợt 161: RAM chặn 58 poll); load1
  0,65–9,58, load5 1,81–6,06; load5<2 chỉ 1 lần trong cả giai
  đoạn — chính poll mở cửa. **0 poll gần-mở bị chặn bởi gate0.**
  Poll #2 blockers=1 (vite build của luồng khác, xem F-162-T4-6).
- **Giai đoạn 2 — cửa mở lần 1 (poll #22, 11:54:39Z):
  load1=0,69, load5=1,81 <2, RAM=2643 MB** → **CỬA MỞ, chạy
  attempt1** → ĐẠT NGAY → poller thoát 11:58:30Z.
- **Phân rã 23 poll thật:** RAM≥1024: 23/23; RAM 500–1023:
  0/23; RAM<500: **0/23**. load1<2: 10/23; load5<2: 1/23.
  1 poll mà load + RAM cùng đạt — **chính poll mở cửa** (#22).
  gate0: T5 20 poll, T4-check-only 3 poll (2 poller + 1 test).
  blockers>0: 1 poll. apt>0: 0 poll.
  **KHÔNG có reboot trong phiên đo** (boot d9a8d1ce suốt,
  btime 11:15:18Z, kiểm lúc đóng 12:02Z).
- **RAM KHÔNG SẬP (xem F-162-T4-7):** đợt 154: 74/147 poll
  <500 MB; đợt 155: 2/123; đợt 156: 0/32; đợt 157: 0/25;
  đợt 158: 0/18; đợt 159: 0/6; đợt 160: 0/30; đợt 161: 37/89
  (tái diễn); đợt này: **0/23 poll <500 MB** — RAM mở 2242 MB
  (test) rồi 1694–3225 MB (poller); RAM<1024 KHÔNG XUẤT HIỆN
  lần nào. Gate A RAM ≥1024 không chặn cửa lần nào đợt này;
  load5 là nguyên nhân chặn cửa duy nhất.

## 2. Attempt duy nhất — attempt1 ĐẠT NGAY, 0 wedge

- **Attempt1-d9a8d1ce (11:54:39–11:58:30Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 42,0 ≤ 60, lớp B 5/5).** Vite :5187
  (ready 3 s — `vite up after 3s`, pid 37286, giữ lock ~4 phút),
  WebKit 27.2 (Xvfb :193, đã dọn socket X193 mồ côi trước khi
  lên), app boot OK 11:54:48Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT,
  RELABEL BẬT. 20 pass (wall 2820–3426 ms/pass): tickCost
  n=646, blendTick n=522, c2DrawLog n=1252.
  **tickCost total median= 42,0 ms (p90 68,0, max 98, min 28)**
  — dư 18,0 ms dưới cổng; hậu flip+2000 ms median 41,0.
  **Lớp B: ĐẠT 5/5** (B1 load5 cuối 1,36 ≤2,5; B2 load1 max
  1,82 ≤4; B3 không reboot; B4 pgrep -x=0, ps exact-comm=0,
  dpkg delta=0; B5 RAM min 1594 MB, 0 mẫu <500 MB,
  **0/100 mẫu <1024 MB** — tốt nhất kể từ đợt 160 (2/101 mẫu
  <1024) và tốt hơn hẳn đợt 161 attempt2 (5/101)). Sampler n=100.
  Per-pass: tickCost median/pass 36,5–53,0 ms — **20/20 pass
  ≤60**; load1 trong attempt 1,25–1,82 (mean/pass 1,25–1,82);
  RAM mean/pass **2109 → 1607 MB** (balloon ghim nhẹ trong lúc
  đo — nhẹ, min 1594 MB vẫn cao hơn nhiều so với attempt1 đợt
  161: 437 MB). Pearson r=-0,16 median~load1_mean, r=0,36
  median~RAM_mean (chỉ mô tả).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.569.367 B (md5
  `8df513a98e5f8f0b136f1c0d5410724d`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **(c2)=8 occurrence / 8 distinct-seq, COVERED 8/8.**
  lag≥+5f (b) = 16 occurrence / 4 event — đây là số (a)/(b)
  (label lag sau presented), không phải (c2); ghi nhận, không dùng
  làm verdict (xem F-162-T4-1). **p1p3p7 chạy TAY (xem §6).**
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (77/77 +
  316/316 tick không vi phạm thật, bar ≥90%, xem skiplatest).
- **Caveat B2 — KHÔNG CÓ (khác đợt 160/161):** `ps-before`/
  `ps-after` chỉ có process vite của chính attempt (npm exec
  vite pid 37286, sh + node vite pid 37302/37303) — KHÔNG có
  process luồng khác (T9 sampler/b2-watcher vắng mặt đợt này).
  Load1 max 1,82 / load5 cuối 1,36 trong cửa sổ → B2 ĐẠT sạch,
  không caveat nào cần ghi cho T10 đối chiếu.
- **Lưu ý (c2) seq 322 + 367 (quyết (j) đợt 156):** seq 322
  trong attempt1 ĐÃ TỪNG xuất hiện trong (c2) của attempt hợp
  lệ (đợt 161 attempt2, lượt #26 hợp lệ) nên KHÔNG tính là
  distinct mới (xem §6 + F-162-T4-3). Seq 293 đã thấy đợt 133
  attempt1 (lượt #10 hợp lệ), 397 đã thấy đợt 131 attempt1
  (lượt #9 hợp lệ), 478 đã thấy đợt 142 attempt3 (lượt #18 hợp
  lệ) — cả 4 đều không tính mới. Seq 233 mới (chỉ từng xuất
  hiện đợt 147 — đợt đó KHÔNG có lượt hợp lệ), 346 mới (chỉ
  từng xuất hiện đợt 144 attempt2 boot mới — ứng viên dự phòng
  yếu, KHÔNG được tính), 370 mới (chưa từng xuất hiện), 424
  mới (chỉ từng xuất hiện đợt 161 attempt1 KHÔNG hợp lệ —
  theo quy ước đợt 161 §2, gặp lại ở lượt hợp lệ thì tính mới).

## 3. Replay/postboot trên boot mới — cờ T5 CÓ (replay tự nhiên, KHÔNG cần early-repair)

- **Boot d9a8d1ce (reboot #64 ứng viên, btime 11:15:18Z):**
  replay TỰ NHIÊN CHẠY ĐẦY ĐỦ trên boot này: lúc T4 mở
  (11:37Z) apt-get đang installing fonts-wqy-zenhei, dpkg.log
  1488 dòng → 1545 dòng lúc poll #1 (11:38:48Z); **T5-162:
  POSTBOOT_PASS mới viết 11:40:00Z (boot+24m42s; dpkg 1545
  dòng; cache 178 .deb; lists 37; postboot PASS poll=0 độc lập
  exit 0 lúc 11:40:00Z; replay-day-du; cờ cũ lưu
  POSTBOOT_PASS-39d46ba0)**. Gate0=T5 từ poll #3 (11:40:18Z).
  Khác đợt 161 (replay tự nhiên VẮNG MẶT hoàn toàn, frozen
  621 s, early-repair mới cứu được cờ ở boot+60m01s, dpkg chỉ
  795 dòng): đợt này replay tự nhiên hoàn thành và dpkg đủ bộ
  1545 dòng (bằng bộ đầy đủ của đợt 160) — T5 chi tiết; T4 chỉ
  ghi số, không tự kết luận replay có "đầy đủ" không
  (postboot check-only PASS là đủ cho gate0 theo quyết (j)
  đợt 143). Postboot check-only của chính T4 đã PASS (exit 0)
  ngay lúc mở pre-flight, nên gate0 có sẵn qua đường dự phòng
  T4-check-only từ poll #1 (trước khi cờ T5 tới).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:** boot
  d9a8d1ce lúc mở poller (11:38:48Z), lúc attempt1, lúc
  poller thoát (11:58:30Z) và lúc kiểm cuối (12:02Z) —
  btime 11:15:18Z không đổi. Số hiệu #64 CHƯA ĐƯỢC
  XÁC NHẬN (T2-162) — T4 không tự xác nhận số hiệu reboot.
  Mù #93? (#61) đã đóng đợt 161; mù #94? (#62, nếu có) giao
  T2-162; mù #95? (#64, nếu có) giao T2-163 — T4 không tự mở mù.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND162_T4_WEBKIT_QUIET31_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round162-t4/`):**
  `poll-wait-t4-162.sh` (deadline 13:30Z 21/11 + cờ T5
  round162-t5/ + fallback round161-t5/ + nhãn T4-162a),
  `run-attempt-162.sh` (đổi số vòng/đường dẫn/nhãn so với 161).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–161, md5
  `4291e539...`) và **KHÔNG ghi đè `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round162-t4/` — inner có fix F-156-T4-1 đổi
  `round161-*` → `round162-*`, theo đúng mẫu 149–161: chỉ
  stage 2 script trên; fix inner theo bản làm việc sang đợt
  163). **`b.json` KHÔNG stage** (file spec làm việc, theo mẫu
  các đợt trước — chỉ có trong `hidden_files/round162-t4/`,
  md5 `078938cf...`, giống hệt bản đợt 156/157/158/159/160/161).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-162.sh`, `run-attempt-162.sh`,
  `t4-attempt-inner.sh` (CÓ fix F-156-T4-1 đổi sang
  `round162-*`), `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-162.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn mới 27 lượt TRƯỚC KHI chạy,
  xem F-161-T4-5), `distinct-seq-162.py` (helper cột
  distinct-seq — cơ số đã cập nhật 63/66 NHƯNG in 71/74 là
  SAI 4 vì chưa trừ seq cũ, xem §6 + F-162-T4-3),
  `preflight-162.txt` + `preflight-postboot-162.log`
  (pre-flight check, quyết (t) đợt 158).
- **Log/evidence (hidden_files/round162-t4/, không stage):**
  `poll-t4.log` (start ×1 instance + 22 poll thật + CUA YEN MO
  ×1 + LUOT HOP LE), `poll-test-162.log` (test start + 1 poll
  thật + TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`, `postboot-t4-162-gate0wait-*.log` (check-only
  poll #1/#5/#9/… exit 0),
  `appendix-162.txt` (output stats-162.py),
  `preview-b-f3-flip-webkit-t4-attempt1-d9a8d1ce.json`
  (3.569.367 B, 20/20, md5 `8df513a98e5f8f0b136f1c0d5410724d`)
  + `run-webkit-t4-attempt1-d9a8d1ce.log` +
  `load-mid-t4-attempt1-d9a8d1ce.log` (sampler n=100) +
  `ps-before/after-t4-attempt1-d9a8d1ce.txt`
  + `classb-t4-attempt1-d9a8d1ce.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-d9a8d1ce-*.txt` (10 file/attempt)
  + `analyze-t4-p1p3p7-attempt1-d9a8d1ce.txt`
  + `coverage-check-attempt1-d9a8d1ce.txt` (8/8)
  + `attempt-done-attempt1-d9a8d1ce` (exit 0).
  `analyze-l7-labellag.txt` + `lag5-detail.txt` là output mặc
  định của analyzer (ghi theo tên mặc định trong script —
  xem F-157-T4-6), nội dung trùng bản per-attempt.
  `blockers-ps-2.txt` + `blockers-list-2.txt` (poll #2
  blockers=1 — vite build luồng khác, xem F-162-T4-6).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 11:58:30Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round162-t4-quiet31.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round162-t4.done` (~12:02Z 21/11 — trong
  hạn cờ ~14:00Z, sớm hơn ~2 giờ, CÓ NỘI DUNG).

## 5. Sai số F-162-T4-1..7 (+ nợ cũ)

- **F-162-T4-1 — lag≥+5f (b) TÁI DIỄN: 16 OCCURRENCE / 4 EVENT
  (không phải sai số thao tác — kết quả đo thật, ghi nhận,
  KHÔNG dùng làm verdict).** lag5 analyzer: 16 occurrence
  (seq 205, 206, 293, 294×2, 295×2, 296×2, 297×2, 298, 478,
  479×2, 480), gộp 4 event: M=20 (2 occ, max +5f), M=17
  (2 occ, +5f), M=29 (8 occ, max +12f), M=28 (4 occ, max +7f).
  Đây là số (a)/(b) (label lag sau presented), không phải (c2);
  theo mẫu đợt 161 §2, số này chỉ ghi nhận, không dùng làm
  verdict (verdict = probe 20/20 + lớp B 5/5 + tickCost median
  ≤60). Lần đầu tiên kể từ đợt 157 có lag≥+5f (đợt 157: 30 occ;
  đợt 158/159/160/161: 0 occ). Lưu ý: seq 293 (một (c2) seq)
  có lag +5f trong event 2 — nhưng P2 vẫn ĐÚNG 8/8 vì mọi (c2)
  lag đều ≥+1f, 0 âm; P3' vẫn ĐẠT 8/8 (stall-based, prereg).
  Ghi nhận để T10/T8 đối chiếu; T4 không mở điều tra riêng.
- **F-162-T4-2 — blendTick ĐẾM CHÊNH 1 GIỮA 2 ANALYZER
  (không ảnh hưởng verdict).** tickcost analyzer đếm blendTick
  n=522 (tBlend gap) / coverage analyzer đếm n=523 (cùng JSON).
  Chênh 1, lần thứ ba liên tiếp cùng mẫu (F-160-T4-7, F-161-T4-9).
  Có thể do đếm biên flip; không ảnh hưởng (c2)/tickCost/lớp B.
  Ghi nhận, không điều tra riêng.
- **F-162-T4-3 — HELPER distinct-seq IN 71/74 LÀ SAI 4:
  4 SEQ ĐÃ THẤY TRONG ATTEMPT HỢP LỆ CŨ (sai số quy trình —
  phát hiện + sửa bằng kiểm tay TRƯỚC KHI viết LIMITS, không
  ảnh hưởng đo).** `distinct-seq-162.py` in
  `cong don moi (co so 63/66 distinct-seq): 71/74` vì helper
  chỉ cộng số seq mới mà không trừ seq cũ. T4 kiểm tay bằng
  grep từng seq trên toàn bộ LIMITS T4 cũ:
  **seq 293 ĐÃ xuất hiện trong (c2) của attempt hợp lệ đợt 133**
  (attempt1, lượt #10 hợp lệ, (c2) [166, 218, 293, 323, 394]);
  **seq 322 ĐÃ thấy đợt 161** (attempt2, lượt #26 hợp lệ);
  **seq 397 ĐÃ thấy đợt 131** (attempt1, lượt #9 hợp lệ —
  dry-run đợt 132 tái tạo đúng (c2)=9 [161/204/246/267/288/375/
  397/420/421] trên JSON này); **seq 478 ĐÃ thấy đợt 142**
  (attempt3, lượt #18 hợp lệ, (c2) [174/203/225/357/431/454/
  478]). **Seq 233 MỚI** (chỉ từng xuất hiện đợt 147 — đợt đó
  KHÔNG có lượt hợp lệ, cả 2 attempt đều partial); **seq 346
  MỚI** (chỉ từng xuất hiện đợt 144 attempt2 boot mới — ứng
  viên dự phòng yếu, P1 YEU 1/1, KHÔNG được tính vào cộng dồn:
  đợt 144 chốt cộng dồn P3' 21/21 = 17 + 4 của attempt3);
  **seq 370 MỚI** (chưa từng xuất hiện trong bất kỳ dòng (c2)
  nào — chỉ có "tBlend gap n=370" và "81/370" là mẫu số
  baseline); **seq 424 MỚI** (chỉ từng xuất hiện đợt 161
  attempt1 KHÔNG hợp lệ — theo quy ước đợt 161 §2, gặp lại ở
  lượt hợp lệ thì tính mới). Kết luận: distinct mới chỉ +4 →
  **67/74** (không phải 71/74); occurrence **72/80** vẫn đúng
  (seq lặp tính 2 lần theo mẫu đợt 151 §4). Nợ vá helper tự động
  (đọc sổ distinct-seq) vẫn còn — lần thứ ba liên tiếp helper
  sai do chưa trừ seq cũ (F-160-T4-6, F-161-T4-3) — giao
  T10/T4-163.
- **F-162-T4-4 — P3-A1 ĐÚNG TRỞ LẠI 7/8 SAU 2 LẦN SAI LIÊN
  TIẾP (không phải sai số thao tác — kết quả đo thật, xem §6).**
  p1p3p7 tay exit 0: P3-A1 baseline đóng băng 91/392, (c2)
  đóng băng-tại-tick 7/8 [233, 293, 322, 346, 370, 397, 424],
  p=0,000231615 <0,01 → ĐÚNG theo luật DEF §5 (chỉ seq 478
  không đóng băng-tại-tick). Chuỗi SAI bị cắt (159: 5/5 ĐÚNG,
  160: 3/5 SAI, 161: 2/3 SAI, 162: 7/8 ĐÚNG); cộng dồn 82/100
  → **89/108**. Điều tra (c2) VẪN ĐÓNG (P1 ĐÚNG, 0 lag âm,
  P3' ĐẠT 8/8).
- **F-162-T4-5 — COPY-FORWARD sed BỎ SÓT SỐ HỌC TRONG
  distinct-seq-*.py (sai số quy trình, phát hiện + sửa TRƯỚC
  KHI poller chạy nhờ grep kiểm, không ảnh hưởng đo).** Sed đổi
  nhãn `61/64` → `63/66` trong `distinct-seq-162.py` nhưng
  KHÔNG đổi được biểu thức `{61+len(ok)}/{64+len(seqs)}` (dòng
  17) — helper sẽ in 65/68 sai nếu chạy. T4 phát hiện khi rà
  pre-flight và sửa thành `{63+len(ok)}/{66+len(seqs)}` trước
  khi chạy test poll. Bài học (bổ sung F-161-T4-8): sau sed phải
  grep cả biểu thức số học `{NN+len` trong helper, không chỉ
  nhãn `co so NN/NN` — giao T4-163 kiểm lại (nợ nhỏ).
- **F-162-T4-6 — POLL #2 BLOCKERS=1: VITE BUILD CỦA LUỒNG
  KHÁC (quan sát đo, không phải sai số — ghi nhận, không ảnh
  hưởng verdict).** Snapshot `blockers-ps-2.txt` /
  `blockers-list-2.txt`: pid 14330 `node .../vite build
  --config vite.config.ts` (build, không phải serve) — process
  của luồng khác (nhiều khả năng T1/T8 build). Chỉ 1 poll (#2),
  hết ở poll #3; cửa chưa mở lúc đó nên không ảnh hưởng attempt.
  Ghi nhận để T10/T8 đối chiếu khi xét chuỗi FULL PASS; T4 không
  tự đổi luật blockers (comm-based, quyết (i) đợt 137).
- **F-162-T4-7 — TẢI ĐẦU ĐỢT CAO, CỬA CHỜ 21 POLL VÌ LOAD5
  (quan sát đo, không phải sai số).** load1 max 9,58 (poll #8),
  load5 max 6,06 (poll #8); load5<2 chỉ 1/22 poll (poller) —
  chính poll mở cửa #22. RAM không chặn cửa lần nào (min 1694
  MB, 0 poll <1024). Khác đợt 161 (RAM chặn 58 poll sau gate0).
  Tải cao đầu đợt nhiều khả năng do các luồng khác chạy nặng lúc
  mở đợt (T1 suite, T8 chuẩn bị O8) — T4 không tự kết luận
  nguyên nhân (không có bằng chứng process nào trong poll
  snapshot ngoài vite build ở F-162-T4-6).
- **F-161-T4-1..9 — ĐÃ TRÁNH / KHÔNG LẶP LẠI.** Attempt1 ĐẠT
  NGAY (không có attempt B5 vi phạm như F-161-T4-1); p1p3p7
  tay chạy 1 lần với đủ 2 đối số → exit 0 ngay (F-160-T4-1/2);
  copy-forward sed + grep kiểm 4 mẫu + số học helper
  (F-162-T4-5) trước poller; pre-flight check PASS phần setup
  (F-158-T4-1/2); footer stats-*.py cập nhật đúng trước khi
  chạy (F-161-T4-5); exit code check-only capture ngay sau lệnh
  (F-161-T4-6); ps-before/after KHÔNG có process luồng khác
  (F-161-T4-4 không tái diễn).
- **F-161-T4-3 — ĐÃ TRÁNH MỘT PHẦN (helper vẫn sai, kiểm tay
  vẫn cần).** Cơ số helper đã cập nhật 63/66 trong
  distinct-seq-162.py, nhưng kiểm tay bằng grep vẫn cần mỗi đợt
  — lần thứ ba liên tiếp helper sai do chưa trừ seq cũ. Nợ vá
  helper đọc sổ distinct-seq cộng dồn vẫn còn (xem F-162-T4-3).
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-162 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này.** p1p3p7 chạy TAY sau
  poller, exit 0, output lưu
  `analyze-t4-p1p3p7-attempt1-d9a8d1ce.txt` (xem §6). Nợ đứng
  ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt
  có attempt hợp lệ T4 phải chạy tay và ghi rõ.

## 6. P3' cộng dồn (MỚI — 27 lượt hợp lệ) + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 162 (MỚI): P1 105/108, P2 99/99,
  P3-A1 89/108, P3' 72/80 occurrence = 67/74 distinct-seq, P7
  61/61** (27 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 161 §6: "26 lượt hợp lệ" — nay 27).
- **Đóng góp lượt #31 (attempt1-d9a8d1ce, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=8 occurrence / 8 distinct-seq [233, 293, 322, 346, 370,
  397, 424, 478].
  - **P1 ĐÚNG — 6/8 occ** (distinct 6/8 gần run-end:
    run_end seqs [151, 178, 206, 233, 262, 298, 322, 330, 346,
    370, 397, 424, 448, 480, 502]; baseline 45/393,
    p=5,13402e-05 trên distinct 6/8). Cộng dồn 99/100 →
    **105/108**. (293 và 478 không gần run-end.)
  - **P2 ĐÚNG — 8/8 occ** lag ≥+1f, 0 lag âm (lag từng
    tuple: 1, 5, 1, 1, 1, 1, 1, 3 — tất cả +1f trở lên; seq 293
    lag +5f nhưng vẫn là +1f trở lên). Cộng dồn 91/91 →
    **99/99**.
  - **P3-A1 ĐÚNG — 7/8 occ** (distinct 7/8: 233, 293, 322,
    346, 370, 397, 424 đóng băng-tại-tick; 478 không; baseline
    91/392, p=0,000231615 trên distinct 7/8). Cộng dồn 82/100 →
    **89/108**. (Đợt 157 P3-A1 SAI 4/11 — đợt 158 ĐÚNG 7/7,
    đợt 159 ĐÚNG 5/5, đợt 160 SAI 3/5, đợt 161 SAI 2/3, đợt
    này ĐÚNG 7/8 — chuỗi SAI bị cắt.)
  - **P3' 8/8 occ ĐẠT** (distinct 8/8; DAT seq 233 stall 7,
    293 stall 7, 322 stall 6, 346 stall 3, 370 stall 3,
    397 stall 3, 424 stall 5, 478 stall 5). Cộng dồn 64/72 →
    **72/80 occurrence**; distinct 63/66 → **67/74** (chỉ
    233, 346, 370, 424 mới — 293, 322, 397, 478 đã thấy, xem
    kiểm chứng dưới).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 39, 0: 54}; đối chứng toàn bộ drawSrc post: {-1: 301,
    0: 179}, 0/480 entry). Cộng dồn 60/60 → **61/61**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–161).
- **Kiểm chứng 4 seq "đã thấy" (F-162-T4-3):** grep toàn bộ
  LIMITS T4 cũ cho thấy **seq 293 ĐÃ từng xuất hiện trong
  dòng (c2) của attempt hợp lệ đợt 133** (attempt1, lượt #10
  hợp lệ, (c2) [166, 218, 293, 323, 394]); **seq 322 ĐÃ thấy
  đợt 161** (attempt2, lượt #26 hợp lệ, (c2) [262, 322, 367]);
  **seq 397 ĐÃ thấy đợt 131** (attempt1, lượt #9 hợp lệ —
  dry-run đợt 132 tái tạo đúng (c2)=9 [161/204/246/267/288/
  375/397/420/421] trên JSON này); **seq 478 ĐÃ thấy đợt 142**
  (attempt3, lượt #18 hợp lệ, (c2) [174/203/225/357/431/454/
  478], coverage 7/7). Các seq mới: **233** (chỉ từng xuất hiện
  đợt 147 — đợt đó KHÔNG có lượt hợp lệ, cả 2 attempt đều
  partial do probe kẹt); **346** (chỉ từng xuất hiện đợt 144
  attempt2 boot mới — ứng viên dự phòng yếu, P1 YEU 1/1,
  KHÔNG được tính vào cộng dồn); **370** (chưa từng xuất hiện
  trong bất kỳ dòng (c2) nào); **424** (chỉ từng xuất hiện đợt
  161 attempt1 KHÔNG hợp lệ vì B5 — theo quy ước đợt 161 §2,
  gặp lại ở lượt hợp lệ thì tính mới). → 4/8 seq mới, distinct
  đúng là **67/74** (helper in 71/74 là sai 4 — đã hiệu chỉnh
  tay), occurrence **72/80** vẫn đúng.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** — P3-A1 ĐÚNG 7/8 (p=0,00023) củng cố thêm
  thay vì suy yếu: (1) P1 ĐÚNG; (2) lag âm — KHÔNG (0);
  (3) +2f ≥3 — KHÔNG (chỉ lag (c2) +1f/+3f/+5f, không có tiêu
  chí mở lại nào xảy ra theo §13 DEF v0.5). P3' (prereg
  stall-based) vẫn ĐẠT 8/8 — bằng chứng ủng hộ chính không suy
  yếu. lag≥+5f (b) = 16 occurrence là số (a)/(b), không phải
  (c2) — ghi nhận ở F-162-T4-1, không dùng làm verdict.
- Chuỗi median tickCost 27 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / **42,0 ms** (trung
  bình ~47,6 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).
  Lượt này 42,0 ms — thấp thứ 9 trong chuỗi (8 lượt thấp hơn:
  39,0 / 39,5 / 40,0 ×3 / 41,0 ×3).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 163

- **(a) #31 CÓ lượt hợp lệ — lượt hợp lệ #27 (chuỗi lượt yên
  hợp lệ NỐI DÀI #22 → #23 → #24 → #25 → #26 → #27).** Từ phía
  T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐÃ ĐẠT** — lượt
  yên #31 thuộc boot d9a8d1ce (#64 ứng viên). O8 chạy trên boot
  nào, có qua gate chuẩn hay phải dùng thủ tục (i), là do T8/T10
  quyết theo tiền lệ (quyết (h) đợt 157: chuỗi được tính khi
  O8 chạy sau lượt yên về thời gian, dù reboot xen giữa đổi
  boot). T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
  Lưu ý: attempt1 ĐẠT NGAY (ngân sách chỉ dùng 1/3) — khác đợt
  161 (attempt1 B5 vi phạm, attempt2 mới đạt).
- **(b) P3' cộng dồn MỚI 72/80 = 67/74 (xem §6 + F-162-T4-3):**
  helper in 71/74 là SAI 4 — T4 đã kiểm tay bằng grep từng seq
  trên LIMITS cũ (293 đã thấy đợt 133, 322 đã thấy đợt 161,
  397 đã thấy đợt 131, 478 đã thấy đợt 142). **P3-A1 ĐÚNG TRỞ
  LẠI 7/8 (p=0,00023)** — cộng dồn 89/108. T10 kiểm lại phép
  cộng khi viết aggregate (§12): P1 105/108, P2 99/99, P3-A1
  89/108, P3' 72/80 = 67/74, P7 61/61.
- **(c) PAGE-WEDGED KHÔNG tái diễn lần thứ sáu liên tiếp (0
  wedge đợt 157 + 0 wedge đợt 158 + 0 wedge đợt 159 + 0 wedge
  đợt 160 + 0 wedge đợt 161 + 0 wedge đợt này — attempt1 chạy
  đủ 20/20 sạch).** Chữ ký đợt 156 (2 wedge liên tiếp, fetch
  writePartial timeout 30 s) không xuất hiện. T4-163 tiếp tục
  theo dõi, ghi nhận nếu tái diễn; chưa mở điều tra riêng
  (quyết (j) đợt 156 giữ nguyên). Câu hỏi đợt 156 §7(c)
  (wedge có tính là "kẹt" cho chuỗi "P3 không kẹt" của T8
  không) VẪN MỞ — đợt này không có wedge mới nên không thêm
  dữ kiện.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) ĐÃ ÁP DỤNG
  THÀNH CÔNG — giữ làm quy tắc đứng, kèm bổ sung:** pre-flight
  PASS phần setup, F-158-T4-1/2 không lặp lại, attempt1 ĐẠT
  NGAY, ngân sách chỉ dùng 1/3. **Bổ sung từ đợt này:** trên boot
  MỚI, gate0 có thể đã PASS qua T4-check-only ngay lúc mở
  (postboot exit 0 — khác đợt 161 exit 1, replay frozen); replay
  tự nhiên có thể CHẠY ĐẦY ĐỦ và cờ T5 tới nhanh (boot+24m42s
  — khác đợt 161 boot+60m01s qua early-repair). T4-163 chạy
  pre-flight y hệt trước mọi attempt (checklist §0b), ghi rõ
  gate0 đạt/chưa đạt lúc mở + replay đã chạy hay chưa + exit
  code check-only capture ngay sau lệnh.
- **(e) lag≥+5f (b) TÁI DIỄN (F-162-T4-1): 16 occ / 4 event,
  max +12f — lần đầu kể từ đợt 157.** Đây là số (a)/(b), không
  phải (c2); không dùng làm verdict. T10/T8 đối chiếu xem có
  liên quan gì tới chuỗi FULL PASS hay harness không; T4 không
  mở điều tra riêng.
- **(f) F-162-T4-6 (poll #2 blockers=1 — vite build luồng
  khác):** pid 14330 `node vite build --config vite.config.ts`
  xuất hiện 1 poll duy nhất rồi hết. T10 ghi nhận khi xét chuỗi
  FULL PASS; T4 không tự đổi luật blockers.
- **(g) ĐIỂM MÙ LIVE-DIAG F-158-T8-4 (quyết (u) đợt 158) —
  GIỚI HẠN ĐỨNG, CHƯA BỔ SUNG KIỂM "NỘI DUNG TƯƠI".**
  HB128 heartbeat làm tươi log mtime nên live-diag dựa trên
  mtime có thể mù (live-diag 0/2 ở 85m4). Đợt này **không có
  kẹt nào** (0 wedge, probe chạy sạch 20/20) nên live-diag
  không được thử thách — không có dữ kiện mới về việc nó bắt
  được hay không bắt được kẹt. Ghi nhận làm giới hạn đứng;
  không bổ sung kiểm "nội dung tươi" theo quyết (u).
- **(h) F-162-T4-3 (helper distinct-seq in sai 71/74, đúng
  67/74):** cơ số helper đã cập nhật 63/66 trong
  distinct-seq-162.py (vá một phần), nhưng kiểm tay bằng grep
  vẫn cần mỗi đợt — lần thứ ba liên tiếp helper sai do chưa
  trừ seq cũ (F-160-T4-6, F-161-T4-3). Có nên vá helper đọc sổ
  distinct-seq cộng dồn (hoặc grep LIMITS cũ tự động) để T4-163
  không phải kiểm tay không? T4 không tự đổi — chờ T10/parent
  phán (nợ từ F-157-T4-5).
- **(i) F-162-T4-5 (copy-forward sed bỏ sót số học helper):**
  sau sed phải grep cả biểu thức `{NN+len` trong helper, không
  chỉ nhãn `co so NN/NN` — giao T4-163 kiểm lại (nợ nhỏ, mẫu
  lỗi thứ tư liên tiếp của copy-forward sed).
- **(j) Các nợ đứng khác giữ nguyên từ đợt 161 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#94? giao T2 (mù #88? MỞ,
  #94? (#62) SƠ BỘ MỞ giao T2-162); birefnet 0 thử (lần thứ 16
  liên tiếp — đợt này không thử); u2net là fallback chính thức;
  run 161 kết cục thuộc T7-162; reboot #64 ỨNG VIÊN chưa xác
  nhận (T2-162); POSTBOOT_PASS #64 ĐÃ CÓ (T5-162, 11:40:00Z —
  xem §3); **replay tự nhiên CHẠY ĐẦY ĐỦ trên boot #64**
  (dpkg 1545 dòng — khác #62 frozen, phải early-repair).
- **(k) Đối chiếu waiter/O8 (T8):** T4 gate mở 11:54:39Z
  (poll #22); attempt1 ĐẠT → **GATE cho chuỗi FULL PASS ĐẠT
  từ phía T4** (có lượt yên hợp lệ #31 trên boot d9a8d1ce).
  T8 tự quyết thủ tục (i) sau waiter hết hạn / boot mới; T4 chỉ
  ghi dữ kiện, không tự kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-162.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-162.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-21T11:38:44Z - 2026-11-21T11:38:44Z, boot=d9a8d1ce
   RAM min=2242 max=2242 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 0/1 load5<2: 0/1 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=1
   lock: khong=1
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 22 poll, 2026-11-21T11:38:48Z - 2026-11-21T11:54:39Z, boot=d9a8d1ce
   RAM min=1694 max=3225 >=1024: 22/22 500-1023: 0/22 <500: 0/22
   load1<2: 10/22 load5<2: 1/22 blockers>0: 1 apt>0: 0
   gate0: T5=20, T4-check-only=2
   lock: khong=22
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 23
-- RAM toan phien: min=1694 max=3225 >=1024: 23/23 <500: 0/23
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 1/23
   gan-mo? #22 2026-11-21T11:54:39Z boot=d9a8d1ce RAM=2643 L1=0.69 L5=1.81 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round162-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot d9a8d1ce: 23 poll; RAM>=1024 lan cuoi: 2026-11-21T11:54:39Z #22; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 27 luot hop le): P1 105/108 P2 99/99 P3-A1 89/108 P3' 72/80 occ = 67/74 distinct-seq P7 61/61
-- chuoi median 27 luot: n=27 mean=47,6 min=39,0 max=60,0 vuot-60: 0
```
