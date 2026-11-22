# PHASE9_ROUND163_T4_WEBKIT_QUIET32_LIMITS.md

**Đợt:** 163. **Luồng:** T4 — đo lượt yên WebKit #32 trên 1 boot
+ LƯỢT HỢP LỆ #28 (chuỗi lượt yên hợp lệ nối dài: #22 đợt 157 →
#23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161 → #27
đợt 162 → #28 đợt 163)
+ KHÔNG PAGE-WEDGED (0 wedge — lần thứ 7 liên tiếp: đợt 157, 158,
159, 160, 161, 162, 163).
**Ngày:** 21/11/2026 (lượt cron 21:35 +07 21/11 = 14:35:51Z 21/11).
**Boot đo:** 1c1cf10c (reboot #65 ỨNG VIÊN, CHƯA XÁC NHẬN — T0-163,
btime 14:34:57Z — boot lúc mở; KHÔNG có reboot mới trong lúc đo hay
lúc đóng sổ; kiểm cuối 15:25Z vẫn 1c1cf10c).
**Trạng thái:
#32 CÓ LƯỢT HỢP LỆ — attempt2 ĐẠT ở lần mở cửa thứ hai
(14:59:01Z), ngân sách 3/3 dùng 2/3 (attempt1 20/20 nhưng tickCost
median 62,0 ms >60 — KHÔNG hợp lệ; attempt2 20/20, LỚP B ĐẠT 5/5,
tickCost median 53,0 ms ≤60; poller thoát 15:03:10Z, trước hạn
cắt poller 16:30Z gần 1 giờ 27 phút, trước hạn cờ ~17:00Z gần
2 giờ).
(c2)=2 occurrence / 2 distinct-seq [189, 212], COVERED 2/2. P1 YẾU
(2/2 occ gần run-end, p=0,032 — n=2 <3, không đạt luật DEF §3),
P2 ĐÚNG (2/2 lag +1f, 0 âm), P3-A1 YẾU (2/2 occ đóng băng-tại-tick,
p=0,069 — n=2 <3, không đạt luật DEF §5), P3' 2/2 occ ĐẠT (DAT seq
189, 212 — cả 2 MỚI trên cơ sở 139+), P7 ĐÚNG (0 entry trễ ≥+1f).
lag≥+5f (b) = 0 occurrence cả 2 attempt — SẠCH (khác đợt 162:
16 occ/4 event). Cộng dồn MỚI (28 lượt hợp lệ): P1 107/110,
P2 101/101, P3-A1 91/110, P3' 74/82 occurrence = 69/73
distinct-seq, P7 62/62. HELPER distinct-seq ĐÃ VÁ (quyết (t) đợt
162): đọc sổ distinct-seq-ledger.json thay vì cộng thẳng cơ số —
kiểm chứng back-test trên dữ liệu đợt 161/162 + live đợt 163;
phát hiện cộng dồn ghi nhận 67/74 SAI MẪU SỐ — đúng là 67/71
(xem §6 + F-163-T4-3; T4 không tự đổi số lịch sử — chờ parent/T10
quyết có đính chính trong aggregate không). PRE-FLIGHT CHECK
(quyết (t) đợt 158) PASS PHẦN SETUP — gate0 lúc mở là T4-check-only
(postboot exit 0, replay đang chạy), cờ T5-163 tới ở poll #5
(14:45:44Z; file POSTBOOT_PASS mtime 14:45:05Z, replay-đầy-đủ —
khác đợt 162: cờ tới ở poll #3, boot+24m42s; đợt này boot+10m08s).
Cờ T5-163 CÓ cho boot đo (POSTBOOT_PASS 14:45:05Z, dpkg 1545).
RAM KHÔNG SẬP <500 MB lần nào (0/19 poll); cửa phải chờ load hạ
đầu đợt (load5 max 5,01, load1 max 7,95) — xem F-163-T4-7.**

## 0. Verdict tổng

- **#32 CÓ LƯỢT HỢP LỆ (lượt hợp lệ #28, attempt2).**
  Ngân sách 3 attempt/đợt dùng **2/3**: attempt1 KHÔNG hợp lệ
  (tickCost 62,0 > 60 — xem F-163-T4-1), attempt2 ĐẠT. Poller poll
  lại gate theo quyết (h) đợt 149 sau attempt1 (poll #17 cửa đóng
  vì load1 2,66 >2; poll #18 mở cửa lần 2) — cơ chế retry ĐÃ
  DÙNG và ĐÃ CỨU lượt này (khác đợt 162: đạt ngay attempt1,
  retry không cần dùng). Poller thoát 15:03:10Z vì
  LUOT HOP LE — KHÔNG phải hết ngân sách hay hết hạn (hạn cắt
  16:30Z còn ~1 giờ 27 phút, hạn cờ ~17:00Z còn gần 2 giờ).
- **Attempt1-1c1cf10c (14:54:04–14:58:15Z): probe 20/20,
  KHÔNG HỢP LỆ (tickCost 62,0 > 60, lớp B 5/5, (c2)=0).**
  Vite :5187, WebKit 27.2 (Xvfb :193, đã dọn socket X193 mồ côi
  trước khi lên), app boot OK 14:54:18Z, C2 draw log BẬT, rVFC
  TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall 3064–3926 ms/pass):
  tickCost n=474, blendTick n=381 (tBlend gap; skiplatest đếm
  382 — chênh 1, xem F-163-T4-8), c2DrawLog n=916.
  **tickCost total median= 62,0 ms (p90 93,7, max 181, min 31)
  — VƯỢT cổng 60 đúng 2,0 ms**; hậu flip+2000 ms median 68,0.
  Per-pass median 42,0–88,0 ms — tăng dần theo pass trong khi
  RAM mean/pass giảm 1027 → 894 MB (Pearson r=-0,51, chỉ mô tả).
  **Lớp B: ĐẠT 5/5** (B1 load5 cuối 1,72 ≤2,5; B2 load1 max
  1,98 ≤4; B3 không reboot; B4 pgrep -x=0, ps exact-comm=0,
  dpkg delta=0; B5 RAM min 791 MB, 0 mẫu <500 MB,
  23/107 mẫu <1024 MB — ghi nhận, không vi phạm). Sampler n=107.
  **(c2)=0** — không có seq nào để kiểm P3'/P1/P3-A1; **không
  cộng dồn attempt này** (attempt không hợp lệ không tính).
  lag≥+5f (b) = 0 occurrence. **KHÔNG PAGE-WEDGED:** 0 fetch
  timeout, `pageErrs: []`, JSON đầy đủ 2.619.259 B (md5
  `159fc50413a1d81915c6f8b481347f19`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (72/72 tick
  không vi phạm thật + gap 272/272 trong ±3, xem skiplatest).
- **Attempt2-1c1cf10c (14:59:01–15:03:10Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 53,0 ≤ 60, lớp B 5/5).** Vite :5187,
  WebKit 27.2 (Xvfb :193, đã dọn socket X193 mồ côi), app boot
  OK 14:59:12Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL
  BẬT. 20 pass (wall 2941–3787 ms/pass): tickCost n=510,
  blendTick n=413 (tBlend gap; c2coverage đếm 414 — chênh 1,
  xem F-163-T4-8), c2DrawLog n=988.
  **tickCost total median= 53,0 ms (p90 84,0, max 177, min 31)**
  — dư 7,0 ms dưới cổng; hậu flip+2000 ms median 52,0.
  Per-pass median 43,0–74,0 ms — 20/20 pass.
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,71 ≤2,5; B2 load1 max
  3,06 ≤4; B3 không reboot; B4 pgrep -x=0, ps exact-comm=0,
  dpkg delta=0; B5 RAM min 2061 MB, 0 mẫu <500 MB,
  **0/104 mẫu <1024 MB** — tốt nhất kể từ đợt 162 attempt1
  (0/100)). Sampler n=104.
  **(c2)=2 occurrence / 2 distinct-seq [189, 212], COVERED 2/2**
  (tBlend 46989/50788, delta −26/+23 ms).
  lag≥+5f (b) = 0 occurrence — sạch.
  **p1p3p7 chạy TAY (F-148-T4-1): P1 YẾU, P2 ĐÚNG, P3-A1 YẾU,
  P3' ĐẠT, P7 ĐÚNG** (xem §6 — YẾU do n=2, không phải SAI).
  **KHÔNG PAGE-WEDGED** — attempt2 chạy đủ 20/20, 0 fetch
  timeout, `pageErrs: []`, JSON đầy đủ 2.878.669 B (md5
  `2e38b70a195ea16cf85ed0beb567c27c`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (65/65 tick
  không vi phạm thật + gap 302/302 trong ±3, xem skiplatest).
- **Poller: 19 poll thật** (1 test + 18 poller), **1 boot duy
  nhất, 1 instance duy nhất** (không chết/khởi động lại; fix
  F-155-T4-1 giữ vững đợt thứ tám). RAM ≥1024: 19/19;
  **0/19 poll <500 MB** (chuỗi RAM không sập nối dài); chuỗi
  RAM<500 dài nhất 0 poll. **2 poll duy nhất** load+RAM cùng
  đạt — **chính 2 poll mở cửa** (#16, #18); **0 poll gần-mở
  bị chặn bởi gate0**. Gate0: T5 14 poll, T4-check-only 5 poll
  (4 poller + 1 test). apt>0: 0 poll. load5<2: 3/18 poll
  (poller) — tải đầu đợt cao là nguyên nhân chờ cửa chính.
- **Chuỗi lượt yên hợp lệ: NỐI DÀI LÊN #28.** Cộng dồn 28 lượt:
  P1 107/110, P2 101/101, P3-A1 91/110, **P3' 74/82 occurrence
  = 69/73 distinct-seq**, P7 62/62. Chuỗi median tickCost 28 lượt:
  39,0–60,0 ms, mean ~47,8 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #31 (quyết (i) đợt 162):** ngưỡng
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi
  ngưỡng/cadence nào. P3-A1 YẾU ở lượt này là do n=2 (không đủ
  mẫu cho luật DEF §5), không phải bằng chứng chống lại mô
  hình — điều tra (c2) VẪN ĐÓNG (xem §6).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc inner-end, lúc run-attempt
  exit — không đổi; mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round163-t4.done` viết ~15:25Z 21/11
  (trong hạn cờ ~17:00Z, sớm hơn ~1 giờ 35 phút), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158)

Chạy **trước mọi attempt, trước khi mở poller** (14:42:09Z),
ghi vào `hidden_files/round163-t4/preflight-163.txt` — **PASS
PHẦN SETUP, GATE0 LÀ T4-CHECK-ONLY LÚC MỞ (không phải lỗi setup)**:

- **b.json CÓ trong `round163-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156/157/158/159/160/161/162 (F-158-T4-1/2 KHÔNG lặp lại: file
  spec đã có trước khi poller chạy).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–162. **vite.t4-temp.config.mjs md5
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
  `2026-11-21 16:30:00 UTC` → epoch **1795278600** =
  2026-11-21T16:30:00Z — khớp đúng hạn cắt poller 16:30Z
  (hạn cờ ~17:00Z = 1795280400, hạn cứng 17:30Z =
  1795282200); không còn sót dạng `10:30`/`07:30`/`08:00`/`08:30`/
  `13:30` nào trong script mới (grep 0 hit).
- **GATE0 LÚC MỞ LÀ T4-CHECK-ONLY (postboot exit 0 — giống đợt
  162, khác đợt 161: exit 1, replay frozen):** boot #65 mới
  (1c1cf10c, btime 14:34:57Z), dpkg.log 1545 dòng lúc kiểm đầu
  (bộ đầy đủ); cờ T5-163 CHƯA CÓ; cờ T5-162 `cu(mtime-cu)`
  (mtime cũ < btime 14:34:57Z) — KHÔNG tính cho boot mới;
  postboot check-only chạy tay **exit 0** (đủ 11 gói + GST 269
  plugin, xem `preflight-postboot-163.log`).
  Đây là trạng thái chờ hợp lệ của boot mới, không phải lỗi
  setup — poller poll 45 s/lần và mở cửa khi gate A đạt
  (gate0 đã có sẵn qua T4-check-only; cờ T5 tới ở poll #5).
- **Test poll (POLL_TEST=1): exit 7 đúng thiết kế** —
  poll #1 RAM 1157 MB, load1 5,87/load5 3,61 (cửa đóng vì load
  cao), gate0=T4-check-only, tree YES, blockers 0, apt 0,
  dpkg 1545 (xem `poll-test-163.log`).
- **Copy-forward đợt 162 → 163:** deadline poller `13:30Z` →
  `16:30Z` ở cả 3 dạng (`2026-11-21 13:30:00 UTC`, `13:30Z`,
  `T13:30:00Z`); `brief dot 162` → `brief dot 163`;
  `poll-test-162`/`stats-162`/`distinct-seq-162` → 163;
  T5FLAG chính `round163-t5/` + fallback `round162-t5/`;
  **helper distinct-seq KHÔNG copy-forward kiểu cũ nữa — viết
  lại hoàn toàn để đọc sổ (xem §6 + F-163-T4-3/5)**.

## 1. Poller — 19 poll thật, 2 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 1c1cf10c
  (14:42:23Z):** poll #1 RAM=1157 MB, load1=5,87 load5=3,61,
  blockers=0, gate0=T4-check-only (postboot exit 0, T5-162 cu)
  → cửa đóng (load cao) → **TEST-POLL-OK exit 7 đúng thiết kế**.
  Poll này nằm trong `poll-test-163.log`; thống kê §A đã hợp nhất.
- **Instance 2 (không POLL_TEST), 18 poll, boot 1c1cf10c
  (14:42:40–14:59:01Z):** RAM ≥1024: 18/18; load1<2: 8/18;
  load5<2: 3/18; gate0: T4-check-only 4, T5 14;
  lock=khong 18/18; dpkg 1545 → 1545; blockers=0; apt>0: 0 poll.
- **Giai đoạn 1 — chờ load hạ (poll #1–#15, 14:42–14:53Z):**
  gate0 đạt từ poll #5 (cờ T5-163 viết 14:45:05Z, dpkg 1545);
  RAM luôn ≥1024 (min 1101 MB, max 3441 MB) — RAM KHÔNG BAO GIỜ
  chặn cửa đợt này (nối dài chuỗi từ đợt 162: 0 poll <500 MB);
  load1 0,38–7,95, load5 1,72–5,01; load5<2 chỉ 3 lần trong cả
  giai đoạn — 2 trong số đó là poll mở cửa. **0 poll gần-mở bị
  chặn bởi gate0.** blockers=0 mọi poll (khác đợt 162: 1 poll
  blockers=1 do vite build luồng khác).
- **Giai đoạn 2 — cửa mở lần 1 (poll #16, 14:54:04Z):
  load1=0,38, load5=1,88 <2, RAM=1478 MB** → **CỬA MỞ, chạy
  attempt1** → tickCost median 62,0 >60 → KHÔNG HỢP LỆ →
  poller KHÔNG thoát, poll lại gate theo quyết (h) đợt 149.
  Poll #17 (14:58:15Z, ngay sau attempt1 xong): load1=2,66
  (>2), load5=1,95, RAM=3441 MB (RAM vọt lên sau khi browser
  attempt1 đóng — balloon xả) → cửa đóng. **Poll #18
  (14:59:01Z): load1=1,41, load5=1,72 <2, RAM=3350 MB** →
  **CỬA MỞ LẦN 2, chạy attempt2** → ĐẠT → poller thoát
  15:03:10Z.
- **Phân rã 19 poll thật:** RAM≥1024: 19/19; RAM 500–1023:
  0/19; RAM<500: **0/19**. load1<2: 8/19; load5<2: 3/19.
  2 poll mà load + RAM cùng đạt — **chính 2 poll mở cửa**
  (#16, #18). gate0: T5 14 poll, T4-check-only 5 poll
  (4 poller + 1 test). blockers>0: 0 poll. apt>0: 0 poll.
  **KHÔNG có reboot trong phiên đo** (boot 1c1cf10c suốt,
  btime 14:34:57Z, kiểm lúc đóng 15:25Z).
- **RAM KHÔNG SẬP (nối dài chuỗi):** đợt 154: 74/147 poll
  <500 MB; đợt 155: 2/123; đợt 156: 0/32; đợt 157: 0/25;
  đợt 158: 0/18; đợt 159: 0/6; đợt 160: 0/30; đợt 161: 37/89
  (tái diễn); đợt 162: 0/23; đợt này: **0/19 poll <500 MB** —
  RAM mở 1157 MB (test) rồi 1101–3441 MB (poller); RAM<1024
  KHÔNG XUẤT HIỆN lần nào. Gate A RAM ≥1024 không chặn cửa lần
  nào đợt này; load là nguyên nhân chặn cửa duy nhất.

## 2. Attempt1 KHÔNG hợp lệ + attempt2 HỢP LỆ, 0 wedge

- **Attempt1-1c1cf10c (14:54:04–14:58:15Z): probe 20/20,
  KHÔNG HỢP LỆ (tickCost 62,0 > 60, lớp B 5/5, (c2)=0).**
  Vite :5187, WebKit 27.2 (Xvfb :193, đã dọn socket X193 mồ côi
  trước khi lên), WebKit launched 14:54:11Z, app boot OK
  14:54:18Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT,
  FLIP sau pass 5 (wallMs=29704). 20 pass (wall 3064–3926
  ms/pass): tickCost n=474, blendTick n=381 (tBlend gap;
  skiplatest đếm 382 — chênh 1, xem F-163-T4-8), c2DrawLog
  n=916. **tickCost total median= 62,0 ms (p90 93,7, max 181,
  min 31)** — vượt cổng 60 đúng 2,0 ms; hậu flip+2000 ms
  median 68,0. **Lớp B: ĐẠT 5/5** (B1 load5 cuối 1,72 ≤2,5;
  B2 load1 max 1,98 ≤4; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0; B5 RAM min 791 MB, 0 mẫu <500 MB,
  **23/107 mẫu <1024 MB** — ghi nhận, không vi phạm). Sampler
  n=107. Per-pass: tickCost median/pass 42,0–88,0 ms — tăng dần
  theo pass trong khi RAM mean/pass giảm 1027 → 894 MB;
  Pearson r=-0,51 median~RAM_mean (chỉ mô tả — xem F-163-T4-1).
  Wallbands: median tăng theo wall (0–20k: 44,0 → 62–70k:
  76,0 ms). **(c2)=0** (labellag (c)=0, (c2)=0; stall analyzer
  "(c2)=0 — khong co seq de kiem P3'"; c2coverage "(c2)=0").
  lag≥+5f (b) = 0 occurrence. **KHÔNG PAGE-WEDGED:** 0 fetch
  timeout, `pageErrs: []`, JSON đầy đủ 2.619.259 B (md5
  `159fc50413a1d81915c6f8b481347f19`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (72/72 tick
  không vi phạm thật + gap presented-expected 272/272 trong ±3).
  **Attempt này KHÔNG ĐƯỢC CỘNG DỒN** (không hợp lệ — theo
  quy ước đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Caveat B2 attempt1 — CÓ (ghi nhận, không đổi verdict):**
  `ps-after` (không có trong `ps-before`) xuất hiện process
  của T2-163: pid 36060/36061 `hole-recheck9595.py` (chạy trong
  `round163-t2/`) — process này BẮT ĐẦU TRONG lúc attempt1 chạy
  (không có lúc attempt bắt đầu). B2 vẫn ĐẠT (load1 max 1,98 ≤4,
  load5 cuối 1,72) — caveat chỉ để T10 đối chiếu khi xét chuỗi
  FULL PASS (xem F-163-T4-2).
- **Attempt2-1c1cf10c (14:59:01–15:03:10Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 53,0 ≤ 60, lớp B 5/5).** Vite :5187,
  WebKit 27.2 (Xvfb :193, đã dọn socket X193 mồ côi), WebKit
  launched 14:59:07Z, app boot OK 14:59:12Z, C2 draw log BẬT,
  rVFC TẮT, TAP BẬT, RELABEL BẬT, FLIP sau pass 5
  (wallMs=30569). 20 pass (wall 2941–3787 ms/pass): tickCost
  n=510, blendTick n=413 (tBlend gap; c2coverage đếm 414 —
  chênh 1, xem F-163-T4-8), c2DrawLog n=988.
  **tickCost total median= 53,0 ms (p90 84,0, max 177, min 31)**
  — dư 7,0 ms dưới cổng; hậu flip+2000 ms median 52,0.
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,71 ≤2,5; B2 load1 max
  3,06 ≤4; B3 không reboot; B4 pgrep -x=0, ps exact-comm=0,
  dpkg delta=0; B5 RAM min 2061 MB, 0 mẫu <500 MB,
  **0/104 mẫu <1024 MB** — tốt nhất kể từ đợt 162 attempt1
  (0/100)). Sampler n=104. Per-pass: tickCost median/pass
  43,0–74,0 ms — 20/20 pass; load1 mean/pass 1,33–3,06 (tăng
  trong lúc đo, max đúng bằng load1 max của lớp B); RAM
  mean/pass 2591 MB (pass 1) → 2347 MB (pass 9), min 2061 MB.
  Wallbands: median ổn định 50,0–57,5 ms mọi dải (khác attempt1:
  tăng dần theo wall). **(c2)=2 occurrence / 2 distinct-seq
  [189, 212], COVERED 2/2** (tBlend 46989/50788, delta −26/+23
  ms; blendTick hậu-flip 302/302 trong ±500 ms của log).
  lag≥+5f (b) = 0 occurrence — sạch.
  **p1p3p7 chạy TAY (xem §6): P1 YẾU, P2 ĐÚNG, P3-A1 YẾU,
  P3' ĐẠT, P7 ĐÚNG.** **KHÔNG PAGE-WEDGED:** 0 fetch timeout,
  `pageErrs: []`, JSON đầy đủ 2.878.669 B (md5
  `2e38b70a195ea16cf85ed0beb567c27c`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (65/65 tick
  không vi phạm thật + gap 302/302 trong ±3).
- **Caveat B2 attempt2 — CÓ (ghi nhận, không đổi verdict):**
  `ps-after` (không có trong `ps-before`) xuất hiện process
  của T2-163: pid 40397/40398 python `chrome-history` (chạy
  trong `round163-t2/`, đọc Chrome History sqlite) — BẮT ĐẦU
  TRONG lúc attempt2 chạy. B2 vẫn ĐẠT (load1 max 3,06 ≤4 —
  cao nhất kể từ đợt 162, nhưng vẫn trong cổng; load5 cuối
  1,71) — caveat chỉ để T10 đối chiếu (xem F-163-T4-2).
- **Lưu ý seq 189 + 212 (quyết (j) đợt 156):** cả 2 seq đều
  MỚI trên cơ sở P3' (139+) — không có trong union
  distinct-seq của 15 lượt hợp lệ 139–162 (xem §6 +
  F-163-T4-3). Không seq nào trong 2 seq này từng xuất hiện
  trong (c2) của lượt hợp lệ nào trước đó.

## 3. Replay/postboot trên boot mới — cờ T5 CÓ (replay tự nhiên, KHÔNG cần early-repair)

- **Boot 1c1cf10c (reboot #65 ứng viên, btime 14:34:57Z):**
  replay TỰ NHIÊN CHẠY ĐẦY ĐỦ trên boot này: dpkg.log 1545
  dòng lúc T4 mở (14:42Z — bộ đầy đủ, bằng đợt 160/162);
  **T5-163: POSTBOOT_PASS mới viết 14:45:05Z (boot+10m08s;
  dpkg 1545 dòng; cache 178 .deb; lists 39; postboot PASS
  poll=0 độc lập exit 0 lúc 14:45:04Z; replay-day-du; cờ cũ
  d9a8d1ce lưu POSTBOOT_PASS-d9a8d1ce)**. Gate0=T5 từ poll #5
  (14:45:44Z). Nhanh hơn đợt 162 (cờ tới boot+24m42s) và
  khác hẳn đợt 161 (replay tự nhiên VẮNG MẶT, frozen 621 s,
  early-repair mới cứu được cờ ở boot+60m01s, dpkg chỉ
  795 dòng): đợt này replay tự nhiên hoàn thành và dpkg đủ bộ
  1545 dòng — T5 chi tiết; T4 chỉ ghi số, không tự kết luận
  replay có "đầy đủ" không (postboot check-only PASS là đủ cho
  gate0 theo quyết (j) đợt 143). Postboot check-only của chính
  T4 đã PASS (exit 0) ngay lúc mở pre-flight, nên gate0 có sẵn
  qua đường dự phòng T4-check-only từ poll #1 (trước khi cờ
  T5 tới).
- **Watcher-163 của T5 ĐANG CHẠY (T5-163 sở hữu):**
  `replay-watch-163.log` cập nhật đều mỗi 30 s tới 15:24:44Z
  (dpkg 1545, md5 `aeb0886e`, apt=[] apt2=[] dpkg=[], GST 269,
  cache 178, lists 39 — ổn định). T4 không sở hữu watcher nào;
  poller T4 đã thoát 15:03:10Z.
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:** boot
  1c1cf10c lúc mở poller (14:42:40Z), lúc attempt1, lúc
  attempt2, lúc poller thoát (15:03:10Z) và lúc kiểm cuối
  (15:25Z) — btime 14:34:57Z không đổi. Số hiệu #65 CHƯA ĐƯỢC
  XÁC NHẬN (T0-163) — T4 không tự xác nhận số hiệu reboot.
  Mù #95? (#63, nếu có) giao T2-163 — T4 không tự mở mù.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND163_T4_WEBKIT_QUIET32_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round163-t4/`):**
  `poll-wait-t4-163.sh` (deadline 16:30Z 21/11 + cờ T5
  round163-t5/ + fallback round162-t5/ + nhãn T4-163a),
  `run-attempt-163.sh` (đổi số vòng/đường dẫn/nhãn so với 162),
  `distinct-seq-163.py` (HELPER ĐÃ VÁ — đọc sổ
  distinct-seq-ledger.json; bản snapshot trong repo là bản ghi
  code đã vá; khi chạy từ `apps/web/scripts/` phải truyền
  `--ledger` trỏ tới sổ vì sổ không nằm cùng thư mục — nếu
  không, helper lỗi FileNotFoundError thay vì in số sai, xem
  §6).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–162, md5
  `4291e539...`) và **KHÔNG ghi đè `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round163-t4/` — theo đúng mẫu 149–162: chỉ
  stage script trên; fix inner theo bản làm việc sang đợt
  164). **`b.json` KHÔNG stage** (file spec làm việc, theo mẫu
  các đợt trước — chỉ có trong `hidden_files/round163-t4/`,
  md5 `078938cf...`, giống hệt bản đợt 156–162).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-163.sh`, `run-attempt-163.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-163.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn mới 28 lượt TRƯỚC KHI chạy),
  `distinct-seq-163.py` (helper ĐÃ VÁ — đọc sổ, xem §6),
  `distinct-seq-ledger.json` (SỔ distinct-seq, as-of 163:
  69/73 distinct, occ 74/82 — nguồn thật mới cho T4-164),
  `distinct-seq-ledger-163-proposed.json` (bản helper ghi ra
  trước khi T4 thăng cấp thành sổ — giống hệt sổ hiện tại,
  giữ làm audit trail),
  `build-distinct-seq-ledger.py` (script xây sổ từ file
  stall/c2coverage gốc của 15 lượt hợp lệ 139–162 — chạy lại
  được, xem §6),
  `distinct-seq-163-run-attempt2-1c1cf10c.txt` (output helper
  chạy live trên attempt2),
  `preflight-163.txt` + `preflight-postboot-163.log`
  (pre-flight check, quyết (t) đợt 158).
- **Log/evidence (hidden_files/round163-t4/, không stage):**
  `poll-t4.log` (start ×1 instance + 18 poll thật + CUA YEN MO
  ×2 + LUOT HOP LE), `poll-test-163.log` (test start + 1 poll
  thật + TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`, `postboot-t4-163-gate0wait-*.log` (check-only
  poll #1/#5/#9/… exit 0),
  `stats-163-output.txt` (output stats-163.py),
  `preview-b-f3-flip-webkit-t4-attempt1-1c1cf10c.json`
  (2.619.259 B, 20/20, md5 `159fc50413a1d81915c6f8b481347f19`)
  + `preview-b-f3-flip-webkit-t4-attempt2-1c1cf10c.json`
  (2.878.669 B, 20/20, md5 `2e38b70a195ea16cf85ed0beb567c27c`)
  + `run-webkit-t4-attempt1-1c1cf10c.log` +
  `run-webkit-t4-attempt2-1c1cf10c.log` +
  `load-mid-t4-attempt1-1c1cf10c.log` (sampler n=107) +
  `load-mid-t4-attempt2-1c1cf10c.log` (sampler n=104) +
  `ps-before/after-t4-attempt1-1c1cf10c.txt` +
  `ps-before/after-t4-attempt2-1c1cf10c.txt`
  + `classb-t4-attempt1-1c1cf10c.txt` (LOP-B-TONG DAT 5/5)
  + `classb-t4-attempt2-1c1cf10c.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-1c1cf10c-*.txt` (10 file/attempt)
  + `analyze-t4-attempt2-1c1cf10c-*.txt` (10 file/attempt)
  + `analyze-t4-p1p3p7-attempt2-1c1cf10c.txt`
  + `coverage-check-attempt1-1c1cf10c.txt` ((c2)=0)
  + `coverage-check-attempt2-1c1cf10c.txt` (2/2)
  + `attempt-done-attempt1-1c1cf10c` (exit 0, 14:58:15Z)
  + `attempt-done-attempt2-1c1cf10c` (exit 0, 15:03:10Z).
  `analyze-l7-labellag.txt` + `lag5-detail.txt` là output mặc
  định của analyzer (ghi theo tên mặc định trong script —
  xem F-157-T4-6), nội dung trùng bản per-attempt.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 15:03:10Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round163-t4-quiet32.txt`
  (NUL-delimited, 4 entry — LIMITS + 3 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round163-t4.done` (~15:25Z 21/11 — trong
  hạn cờ ~17:00Z, sớm hơn ~1 giờ 35 phút, CÓ NỘI DUNG).

## 5. Sai số F-163-T4-1..8 (+ nợ cũ)

- **F-163-T4-1 — ATTEMPT1 TICKCOST MEDIAN 62,0 MS > 60
  (không phải sai số thao tác — kết quả đo thật, ghi nhận,
  KHÔNG dùng làm verdict ngoài việc attempt không hợp lệ).**
  Attempt1 20/20, lớp B 5/5, (c2)=0, nhưng tickCost total
  median 62,0 ms (p90 93,7, max 181) — vượt cổng đúng 2,0 ms.
  Dấu hiệu đi kèm: per-pass median tăng dần 42,0 → 88,0 ms
  trong khi RAM mean/pass giảm 1027 → 894 MB (Pearson r=-0,51,
  chỉ mô tả — RAM tụt có thể do balloon, không kết luận nhân
  quả); wallbands median tăng theo wall (44,0 ms ở 0–20k →
  76,0 ms ở 62–70k). Attempt2 ngay sau đó (cùng boot, RAM
  2061–3277 MB) median 53,0 ms — attempt1 chậm hơn có thể do
  RAM thấp đầu lượt (791–1208 MB ở pass 1) — T4 chỉ ghi tương
  quan, không kết luận nhân quả. Cơ chế retry theo quyết (h)
  đợt 149 ĐÃ CỨU lượt này (poll #18 mở cửa lần 2 → attempt2
  ĐẠT). Không đổi ngưỡng (quyết (i) đợt 162).
- **F-163-T4-2 — B2 CAVEAT CẢ 2 ATTEMPT: PROCESS T2-163
  TRONG ps-after (quan sát đo, không phải sai số — ghi nhận,
  không đổi verdict).** Attempt1: pid 36060/36061
  `hole-recheck9595.py` (T2-163) — chỉ có trong `ps-after`,
  không có trong `ps-before` (bắt đầu trong lúc attempt chạy).
  Attempt2: pid 40397/40398 python `chrome-history` (T2-163,
  đọc Chrome History sqlite) — cũng chỉ trong `ps-after`.
  B2 vẫn ĐẠT cả 2 (load1 max 1,98 / 3,06 ≤4; load5 cuối 1,72 /
  1,71). Ghi nhận để T10/T8 đối chiếu khi xét chuỗi FULL PASS
  (đặc biệt attempt2: load1 max 3,06 là cao nhất kể từ đợt 162
  — vẫn trong cổng 4). T4 không tự đổi luật B2.
- **F-163-T4-3 — HELPER distinct-seq: ĐÃ VÁ + PHÁT HIỆN CỘNG
  DỒN GHI NHẬN 67/74 SAI MẪU SỐ, ĐÚNG LÀ 67/71 (sai số quy
  trình — phát hiện + vá TRƯỚC KHI viết LIMITS, không ảnh
  hưởng đo).** Chi tiết đầy đủ ở §6. Tóm tắt: helper cũ
  (`distinct-seq-162.py`, copy-forward sang 163) chỉ cộng seq
  mới mà không trừ seq cũ — in 71/74 đợt 162, đúng 67/71.
  Helper mới `distinct-seq-163.py` đọc sổ
  `distinct-seq-ledger.json` (xây từ file stall/c2coverage
  gốc của 15 lượt hợp lệ 139–162), tính union thật và ghi sổ
  mới ra file riêng (không sửa sổ gốc tại chỗ). Kiểm chứng:
  back-test đợt 162 → 67/71, occ 72/80; back-test đợt 161 →
  61/65, occ 64/72; live đợt 163 → 69/73, occ 74/82 — đều
  khớp builder độc lập + checkpoint tay từng đợt. **T4 KHÔNG
  tự đổi số lịch sử:** cộng dồn 67/74 trong aggregate 162
  vẫn đứng cho tới khi parent/T10 quyết đính chính (xem §7(b)).
  Từ đợt này, sổ là nguồn thật duy nhất cho distinct-seq.
- **F-163-T4-4 — ĐÍNH CHÍNH 2 SỐ TRONG BẢN GHI GIỮA ĐỢT
  (phát hiện khi đọc lại log gốc trước khi viết LIMITS — lỗi
  ghi chép, không ảnh hưởng đo).** (a) Cờ T5-163 xuất hiện
  lần đầu ở **poll #5 (14:45:44Z; file mtime 14:45:05Z)**,
  KHÔNG phải poll #14 như bản ghi giữa đợt (poll #14 chỉ là
  lúc bản ghi được xem lại — log gốc cho thấy t5flag=PASS từ
  poll #5). (b) Tổng poll thật là **19 (18 poller + 1 test)**,
  KHÔNG phải 18 như bản ghi giữa đợt (instance 2 có 18 poll
  #1–#18, cộng 1 poll test). Mọi số trong LIMITS này đều trích
  từ log gốc đã đọc lại (stats-163.py + grep trực tiếp), không
  dùng số ghi tay giữa đợt.
- **F-163-T4-5 — COPY-FORWARD sed BỎ SÓT SỐ HỌC TRONG HELPER
  (sai số quy trình — mẫu lỗi thứ tư liên tiếp, F-162-T4-5).**
  Bản sao-forward `distinct-seq-163.py` vẫn mang cơ số cũ
  63/66 (pre-162) trong docstring + biểu thức
  `{63+len(ok)}/{66+len(seqs)}` — nếu chạy sẽ in sai. **ĐÃ
  XÓA BẰNG BẢN VÁ (F-163-T4-3):** helper mới không còn hardcode
  cơ số nào (đọc từ sổ), nên lớp lỗi này không thể lặp lại.
  Giao T4-164: khi copy-forward, grep `{NN+len` trong helper
  phải 0 hit (không còn số hardcode để sed bỏ sót).
- **F-163-T4-6 — P1/P3-A1 YẾU Ở LƯỢT NÀY DO n=2 (không phải
  SAI — kết quả đo thật, xem §6).** p1p3p7 tay exit 0:
  P1 baseline 54/302, (c2) gần run-end 2/2, p=0,0319723 ≥0,01
  và n=2 <3 → YẾU theo luật DEF §3; P3-A1 baseline 79/301,
  (c2) đóng băng-tại-tick 2/2, p=0,0688844 ≥0,01 và n=2 <3 →
  YẾU theo luật DEF §5. Cộng dồn per-occurrence vẫn +2/2 cả
  hai (107/110 và 91/110). Điều tra (c2) VẪN ĐÓNG (quyết (i)
  đợt 162) — YẾU do ít mẫu, không phải bằng chứng chống lại
  mô hình.
- **F-163-T4-7 — TẢI ĐẦU ĐỢT CAO, CỬA CHỜ 14 POLL VÌ LOAD
  (quan sát đo, không phải sai số).** load1 max 7,95 (poll #3),
  load5 max 5,01 (poll #3); load5<2 chỉ 3/18 poll (poller) —
  cả 3 đều sau 14:54Z (#16 mở cửa attempt1, #17 bị chặn vì
  load1 2,66 >2, #18 mở cửa attempt2). RAM không chặn cửa lần
  nào (min 1101 MB, 0 poll <1024). Khác đợt 162 (cửa chờ 21
  poll vì load5, max 6,06). Tải cao đầu đợt nhiều khả năng do
  các luồng khác chạy nặng lúc mở đợt — T4 không tự kết luận
  nguyên nhân (không có bằng chứng process nào trong poll
  snapshot; blockers=0 mọi poll đợt này).
- **F-163-T4-8 — blendTick ĐẾM CHÊNH 1 GIỮA 2 ANALYZER
  (không ảnh hưởng verdict).** tickcost analyzer đếm blendTick
  a1 n=381 / a2 n=413 (tBlend gap); skiplatest/c2coverage đếm
  a1 n=382 / a2 n=414 (cùng JSON). Chênh 1, lần thứ tư liên
  tiếp cùng mẫu (F-160-T4-7, F-161-T4-9, F-162-T4-2).
  Có thể do đếm biên flip; không ảnh hưởng (c2)/tickCost/lớp B.
  Ghi nhận, không điều tra riêng.
- **F-162-T4-1..7 — ĐÃ TRÁNH / KHÔNG LẶP LẠI (trừ F-162-T4-7
  dạng nhẹ, xem F-163-T4-7).** lag≥+5f (b) = 0 occ cả 2 attempt
  (khác đợt 162: 16 occ — F-162-T4-1 không tái diễn); blendTick
  chênh 1 vẫn còn (F-162-T4-2 → F-163-T4-8, mẫu đứng); helper
  distinct-seq ĐÃ VÁ (F-162-T4-3 → F-163-T4-3); P3-A1 không
  SAI mà YẾU do n=2 (F-162-T4-4 không tái diễn dạng SAI);
  copy-forward sed đã xóa lớp lỗi số học bằng bản vá
  (F-162-T4-5 → F-163-T4-5); blockers=0 mọi poll (F-162-T4-6
  không tái diễn); tải đầu đợt cao vẫn còn nhưng nhẹ hơn
  (F-162-T4-7 → F-163-T4-7).
- **F-161-T4-3 — ĐÃ ĐÓNG BẰNG BẢN VÁ.** Helper đọc sổ
  distinct-seq cộng dồn từ đợt này — T4-164 không phải kiểm
  tay nữa (quyết (t) đợt 162 đã thực hiện, xem §6).
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-163 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này.** p1p3p7 chạy TAY sau
  poller, exit 0, output lưu
  `analyze-t4-p1p3p7-attempt2-1c1cf10c.txt` (xem §6). Nợ đứng
  ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt
  có attempt hợp lệ T4 phải chạy tay và ghi rõ.

## 6. P3' cộng dồn (MỚI — 28 lượt hợp lệ) + VÁ HELPER distinct-seq + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 163 (MỚI): P1 107/110, P2 101/101,
  P3-A1 91/110, P3' 74/82 occurrence = 69/73 distinct-seq, P7
  62/62** (28 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 162 §6: "27 lượt hợp lệ" — nay 28).
- **Đóng góp lượt #32 (attempt2-1c1cf10c, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=2 occurrence / 2 distinct-seq [189, 212].
  - **P1 YẾU — 2/2 occ** (distinct 2/2 gần run-end:
    run_end seqs [115, 125, 132, 146, 165, 189, 212, 235, 255,
    264, 270, 293, 309, 314, 333, 355, 374, 395]; baseline
    54/302, p=0,0319723 trên distinct 2/2 — không đạt luật DEF
    §3 vì n=2 <3 và p≥0,01). Cộng dồn 105/108 → **107/110**.
    (P1 signed đối chiếu: baseline 52/302, p=0,0296478 — cũng
    YẾU.)
  - **P2 ĐÚNG — 2/2 occ** lag ≥+1f, 0 lag âm (lag từng tuple:
    189: 15/14/1; 212: 17/16/1 — cả hai +1f). Cộng dồn 99/99 →
    **101/101**.
  - **P3-A1 YẾU — 2/2 occ** (distinct 2/2: 189, 212 đóng
    băng-tại-tick; baseline 79/301, p=0,0688844 trên distinct
    2/2 — không đạt luật DEF §5 vì n=2 <3 và p≥0,01). Cộng dồn
    89/108 → **91/110**.
  - **P3' 2/2 occ ĐẠT** (distinct 2/2; DAT seq 189 stall 6,
    212 stall 6). Cộng dồn 72/80 → **74/82 occurrence**;
    distinct 67/71 → **69/73** (cả 2 seq MỚI, xem kiểm chứng
    dưới).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 8, 0: 14}; đối chứng toàn bộ drawSrc post: {-1: 236,
    0: 136}, 0/372 entry). Cộng dồn 61/61 → **62/62**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–162).
- **VÁ HELPER distinct-seq (quyết (t) đợt 162 — VIỆC ƯU TIÊN
  ĐỢT NÀY, ĐÃ XONG).** Helper cũ (`distinct-seq-162.py`,
  copy-forward sang 163) in cộng dồn bằng biểu thức hardcode
  `{63+len(ok)}/{66+len(seqs)}` — chỉ cộng seq mới, không trừ
  seq cũ, sai 3 đợt liên tiếp (160: in 64/67, đúng 63/66;
  161: in 64/67, đúng 63/66; 162: in 71/74, đúng 67/71).
  Helper mới `distinct-seq-163.py`:
  (1) đọc sổ `distinct-seq-ledger.json` (union seen_c2/seen_dat
  + occurrence cộng dồn tới đợt trước); (2) parse file stall
  của attempt (seq → stall_truoc) + file c2coverage (đếm
  occurrence, kể cả seq lặp trong lượt); (3) tính seq MỚI =
  tập hiệu với sổ, in cộng dồn mới distinct + occurrence;
  (4) ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-163-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  Sổ được xây bằng `build-distinct-seq-ledger.py` từ file
  stall/c2coverage GỐC của 15 lượt hợp lệ thuộc kỷ P3'
  (đợt 139, 141, 142, 144, 145, 148, 151, 152, 153, 157, 158,
  159, 160, 161, 162) — không gõ tay, không grep LIMITS.
- **CƠ SỞ P3' — chỉ đếm kỷ stall (đợt 139 trở đi).** P3'
  stall-based là prereg DEF v0.5 cho 138+ (đợt 138 không có
  lượt hợp lệ); các lượt hợp lệ trước 139 KHÔNG thuộc tập
  P3' — bằng chứng: occurrence cộng dồn ghi nhận khớp đúng
  tổng các lượt 139+ tại MỌI checkpoint (trước 151: 24/24 =
  tổng 139–150; sau 151: 32/34; sau 153: 39/41; sau 157:
  44/52; sau 158: 51/59; sau 159: 56/64; sau 160: 61/69; sau
  161: 64/72; sau 162: 72/80). Các lượt hợp lệ #1/#3/#4/#5
  (đợt 117, median 49,5/52,0/47,5/44,0) không ảnh hưởng sổ
  P3' — nhưng T4 ghi rõ giới hạn: JSON probe đợt 117 không
  còn trên đĩa (thư mục round117-t4 không có JSON), nên (c2)
  của các lượt tiền-139 KHÔNG được tái tính từ gốc; chúng chỉ
  không thuộc tập P3' (không phải bị xóa khỏi lịch sử chung).
- **KIỂM CHỨNG HELPER MỚI (3 test, đều PASS).**
  (1) Back-test đợt 162: chạy helper trên stall đợt 162 với sổ
  as-of-161 (xây riêng bằng builder, SPEC cắt ở 161) → ra
  **67/71 distinct, 72/80 occ** — khớp union thật, khác số
  ghi nhận 67/74 ở mẫu số. (2) Back-test đợt 161: sổ as-of-160
  + stall đợt 161 → **61/65 distinct, 64/72 occ** — khớp.
  (3) Live đợt 163: sổ hiện tại + stall/c2coverage attempt2 →
  **69/73 distinct, 74/82 occ** — khớp builder độc lập.
  Sổ gốc as-of-162 KHÔNG đổi trong cả 3 test (kiểm bằng đọc
  lại JSON: as_of_round 162, 67/71, 72/80); sổ mới chỉ được
  thăng cấp sau khi T4 đối chiếu xong.
- **PHÁT HIỆN: CỘNG DỒN GHI NHẬN 67/74 SAI MẪU SỐ — ĐÚNG LÀ
  67/71 (tử số 67 trùng nhau do bù trừ ngẫu nhiên).** Nguyên
  nhân: các đợt 157–162 trừ seq cũ bằng grep LIMITS cũ, nhưng
  chỉ trừ 2 lần lặp (364 đợt 157 — SAI, vì 364 thuộc lượt
  không hợp lệ đợt 128, không thuộc tập P3' 139+; và 367 đợt
  161) mà bỏ sót 4 lần lặp thật: 431 (141→142), 304 (151→153),
  322 (161→162), 478 (142→162); đồng thời trừ sai 293/397 đợt
  162 (chỉ xuất hiện ở lượt tiền-139 là 133/131, không thuộc
  tập P3'). Sai số từng đợt (ghi nhận → đúng, distinct):
  sau 153: 39/40 → 37/38 (431 đếm 2 lần); sau 157: 44/47 →
  42/46 (431, 304 đếm 2 lần; 364 trừ sai); sau 158: 51/54 →
  49/53; sau 159: 56/59 → 54/58; sau 160: 61/64 → 59/63; sau
  161: 63/66 → 61/65; sau 162: 67/74 → **67/71** (tử +4 ghi
  nhận là đúng +6 — 293/397 bị trừ sai; mẫu +8 ghi nhận là
  đúng +6 — không trừ 322/478). Occurrence 72/80 ghi nhận
  VẪN ĐÚNG tại mọi checkpoint (không bị ảnh hưởng vì occurrence
  đếm từ analyzer, không qua helper). Seq không DAT trong
  union 139+: [283, 364, 365, 498] (4 seq). **Đính chính này
  CHỈ áp dụng cho mẫu số distinct-seq của P3' (74→71); các cơ
  số P1/P2/P3-A1/P7 không qua helper nên không bị ảnh hưởng.**
  T4 không tự đổi số lịch sử trong aggregate — chờ parent/T10
  quyết (xem §7(b)).
- **Kiểm chứng 2 seq MỚI đợt 163:** helper (đọc sổ) xác nhận
  **189 và 212 đều chưa có trong union 139–162** (seen_c2
  71 seq, seen_dat 67 seq) — cả 2 đều tính mới → 69/73.
  (Theo cách ghi cũ bằng grep LIMITS, 189/212 cũng chưa từng
  xuất hiện trong (c2) của lượt hợp lệ nào — hai cách kiểm
  đồng thuận lần này.)
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** — P1 YẾU và P3-A1 YẾU ở lượt này là do
  n=2 (không đủ mẫu cho luật DEF §3/§5), không phải SAI:
  (1) P1 per-occurrence ĐÚNG 2/2; (2) lag âm — KHÔNG (0);
  (3) +2f ≥3 — KHÔNG (lag (c2) chỉ +1f/+1f, không có tiêu
  chí mở lại nào xảy ra theo §13 DEF v0.5). P3' (prereg
  stall-based) vẫn ĐẠT 2/2 — bằng chứng ủng hộ chính không suy
  yếu. lag≥+5f (b) = 0 occurrence cả 2 attempt — ghi nhận ở
  F-163-T4-7, không dùng làm verdict.
- Chuỗi median tickCost 28 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 / **53,0 ms**
  (trung bình ~47,8 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng
  60). Lượt này 53,0 ms — thấp thứ 20 trong chuỗi (19 lượt
  thấp hơn: 39,0 / 39,5 / 40,0 ×4 / 41,0 ×3 / 42,0 / 44,0 ×3 /
  44,5 / 47,0 / 47,5 / 49,0 / 49,5 / 52,0).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 164

- **(a) #32 CÓ lượt hợp lệ — lượt hợp lệ #28 (chuỗi lượt yên
  hợp lệ NỐI DÀI #22 → #23 → #24 → #25 → #26 → #27 → #28).**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐÃ ĐẠT**
  — lượt yên #32 thuộc boot 1c1cf10c (#65 ứng viên). O8 chạy
  trên boot nào, có qua gate chuẩn hay phải dùng thủ tục (i),
  là do T8/T10 quyết theo tiền lệ (quyết (h) đợt 157: chuỗi
  được tính khi O8 chạy sau lượt yên về thời gian, dù reboot
  xen giữa đổi boot). T4 chỉ ghi dữ kiện, không tự kết luận
  chuỗi FULL PASS. Lưu ý: attempt1 KHÔNG hợp lệ (tickCost
  62,0), attempt2 mới đạt — khác đợt 162 (attempt1 ĐẠT NGAY);
  cơ chế retry poll-lại-gate (quyết (h) đợt 149) đã cứu lượt
  này.
- **(b) P3' cộng dồn MỚI 74/82 = 69/73 + ĐÍNH CHÍNH 67/74 →
  67/71 (xem §6 + F-163-T4-3):** helper đã vá và kiểm chứng
  3 test; sổ distinct-seq-ledger.json là nguồn thật mới.
  **Chờ parent/T10 quyết:** có đính chính cộng dồn lịch sử
  trong aggregate (67/74 → 67/71, chỉ mẫu số distinct-seq của
  P3') không, hay giữ số ghi nhận cũ và chỉ dùng số mới từ
  đợt 163 trở đi? T4 không tự đổi số lịch sử. T10 kiểm lại
  phép cộng khi viết aggregate (§12): P1 107/110, P2 101/101,
  P3-A1 91/110, P3' 74/82 = 69/73, P7 62/62.
- **(c) PAGE-WEDGED KHÔNG tái diễn lần thứ bảy liên tiếp (0
  wedge đợt 157 + 0 wedge đợt 158 + 0 wedge đợt 159 + 0 wedge
  đợt 160 + 0 wedge đợt 161 + 0 wedge đợt 162 + 0 wedge đợt
  này — cả 2 attempt chạy đủ 20/20 sạch).** Chữ ký đợt 156
  (2 wedge liên tiếp, fetch writePartial timeout 30 s) không
  xuất hiện. T4-164 tiếp tục theo dõi, ghi nhận nếu tái diễn;
  chưa mở điều tra riêng (quyết (j) đợt 156 giữ nguyên). Câu
  hỏi đợt 156 §7(c) (wedge có tính là "kẹt" cho chuỗi "P3
  không kẹt" của T8 không) VẪN MỞ — đợt này không có wedge mới
  nên không thêm dữ kiện.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) ĐÃ ÁP DỤNG
  THÀNH CÔNG — giữ làm quy tắc đứng, kèm bổ sung:** pre-flight
  PASS phần setup, F-158-T4-1/2 không lặp lại, attempt2 ĐẠT
  (ngân sách dùng 2/3). **Bổ sung từ đợt này:** trên boot
  MỚI, gate0 có thể đã PASS qua T4-check-only ngay lúc mở
  (postboot exit 0 — giống đợt 162, khác đợt 161 exit 1, replay
  frozen); replay tự nhiên có thể CHẠY ĐẦY ĐỦ và cờ T5 tới
  nhanh (boot+10m08s — nhanh nhất kể từ đợt 161, khác đợt 162
  boot+24m42s). T4-164 chạy pre-flight y hệt trước mọi attempt
  (checklist §0b), ghi rõ gate0 đạt/chưa đạt lúc mở + replay đã
  chạy hay chưa + exit code check-only capture ngay sau lệnh.
- **(e) lag≥+5f (b) = 0 occurrence cả 2 attempt (F-163-T4-7):
  SẠCH sau đợt 162 tái diễn 16 occ.** Đây là số (a)/(b), không
  phải (c2); không dùng làm verdict. T10/T8 đối chiếu xem đợt
  162 có phải nhiễu một lần không; T4 không mở điều tra riêng.
- **(f) F-163-T4-2 (B2 caveat T2-163 trong ps-after cả 2
  attempt):** hole-recheck9595.py (attempt1) + chrome-history
  (attempt2) bắt đầu trong lúc attempt chạy. T10 ghi nhận khi
  xét chuỗi FULL PASS; T4 không tự đổi luật B2.
- **(g) ĐIỂM MÙ LIVE-DIAG F-158-T8-4 (quyết (u) đợt 158) —
  GIỚI HẠN ĐỨNG, CHƯA BỔ SUNG KIỂM "NỘI DUNG TƯƠI".**
  HB128 heartbeat làm tươi log mtime nên live-diag dựa trên
  mtime có thể mù (live-diag 0/2 ở 85m4). Đợt này **không có
  kẹt nào** (0 wedge, probe chạy sạch 20/20 cả 2 attempt) nên
  live-diag không được thử thách — không có dữ kiện mới về
  việc nó bắt được hay không bắt được kẹt. Ghi nhận làm giới
  hạn đứng; không bổ sung kiểm "nội dung tươi" theo quyết (u).
- **(h) HELPER distinct-seq ĐÃ VÁ XONG (quyết (t) đợt 162 —
  ĐÃ THỰC HIỆN, xem §6 + F-163-T4-3):** T4-164 chỉ cần chạy
  helper với stall + c2coverage của attempt hợp lệ; KHÔNG kiểm
  tay nữa. Sổ nằm ở `hidden_files/round163-t4/
  distinct-seq-ledger.json` (as-of 163: 69/73 distinct, occ
  74/82) — T4-164 copy-forward sổ này (cùng thư mục làm việc)
  và chạy helper như §6. Lưu ý: helper ghi sổ mới ra file
  riêng, không sửa sổ gốc tại chỗ — T4-164 kiểm tra rồi mới
  thăng cấp.
- **(i) Các nợ đứng khác giữ nguyên từ đợt 162 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#94?/#95? giao T2 (mù #88?
  MỞ, #94? (#62) SƠ BỘ MỞ giao T2-162, #95? (#63) SƠ BỘ MỞ
  giao T2-163); birefnet 0 thử (lần thứ 16 liên tiếp — đợt này
  không thử); u2net là fallback chính thức; run 162 kết cục
  thuộc T7-163; reboot #65 ỨNG VIÊN chưa xác nhận (T2-163);
  POSTBOOT_PASS #65 ĐÃ CÓ (T5-163, 14:45:05Z — xem §3);
  **replay tự nhiên CHẠY ĐẦY ĐỦ trên boot #65** (dpkg 1545
  dòng — nhanh nhất kể từ đợt 161).
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate mở 14:54:04Z
  (poll #16, attempt1 — KHÔNG hợp lệ) + 14:59:01Z (poll #18,
  attempt2 — ĐẠT) → **GATE cho chuỗi FULL PASS ĐẠT từ phía T4**
  (có lượt yên hợp lệ #32 trên boot 1c1cf10c). T8 tự quyết thủ
  tục (i) sau waiter hết hạn / boot mới; T4 chỉ ghi dữ kiện,
  không tự kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-163.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-163.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-21T14:42:23Z - 2026-11-21T14:42:23Z, boot=1c1cf10c
   RAM min=1157 max=1157 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 0/1 load5<2: 0/1 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=1
   lock: khong=1
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 18 poll, 2026-11-21T14:42:40Z - 2026-11-21T14:59:01Z, boot=1c1cf10c
   RAM min=1101 max=3441 >=1024: 18/18 500-1023: 0/18 <500: 0/18
   load1<2: 8/18 load5<2: 3/18 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=4, T5=14
   lock: khong=18
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 19
-- RAM toan phien: min=1101 max=3441 >=1024: 19/19 <500: 0/19
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 2/19
   gan-mo? #16 2026-11-21T14:54:04Z boot=1c1cf10c RAM=1478 L1=0.38 L5=1.88 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #18 2026-11-21T14:59:01Z boot=1c1cf10c RAM=3350 L1=1.41 L5=1.72 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 1c1cf10c: 19 poll; RAM>=1024 lan cuoi: 2026-11-21T14:59:01Z #18; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 28 luot hop le): P1 107/110 P2 101/101 P3-A1 91/110 P3' 74/82 occ = 69/73 distinct-seq P7 62/62
-- chuoi median 28 luot: n=28 mean=47,8 min=39,0 max=60,0 vuot-60: 0
```
