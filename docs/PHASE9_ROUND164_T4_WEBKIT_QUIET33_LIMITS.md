# PHASE9_ROUND164_T4_WEBKIT_QUIET33_LIMITS.md

**Đợt:** 164. **Luồng:** T4 — đo lượt yên WebKit #33 trên 2 boot
+ LƯỢT HỢP LỆ #29 (chuỗi lượt yên hợp lệ nối dài: #22 đợt 157 →
#23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161 → #27
đợt 162 → #28 đợt 163 → #29 đợt 164)
+ KHÔNG PAGE-WEDGED (0 wedge — lần thứ 8 liên tiếp: đợt 157, 158,
159, 160, 161, 162, 163, 164).
**Ngày:** 21/11/2026 (lượt cron 00:35 +07 22/11 = 17:35:51Z 21/11).
**Boot đo:** HAI boot — f1d4ce1a (reboot #67 ỨNG VIÊN, CHƯA XÁC NHẬN
— T0-164, btime 17:33:27Z — boot lúc mở) + 0c8a94aa (reboot #68
ỨNG VIÊN, CHƯA XÁC NHẬN — btime 18:06:30Z — reboot TRONG đợt,
giữa attempt2, giết poller + attempt2-f1d4ce1a + watcher-164).
**Trạng thái:
#33 CÓ LƯỢT HỢP LỆ — attempt2-0c8a94aa ĐẠT ở lần mở cửa thứ ba
(19:16:46Z), ngân sách 3/3 dùng 2/3 theo nghĩa attempt-done
(attempt1-f1d4ce1a KHÔNG hợp lệ; attempt2-f1d4ce1a BỊ REBOOT GIẾT,
không tính ngân sách; attempt2-0c8a94aa ĐẠT — xem §2).
Attempt1 20/20 nhưng lớp B VI PHẠM (B2 load1 max 4,09 > 4) VÀ
tickCost median 68,0 ms > 60 — KHÔNG hợp lệ trên cả hai cổng.
Attempt2-0c8a94aa 20/20, LỚP B ĐẠT 5/5 sạch, tickCost median
57,0 ms ≤ 60; poller thoát 19:20:59Z, trước hạn cắt poller
19:30Z 9 phút, trước hạn cờ ~20:00Z ~39 phút.
(c2)=2 occurrence / 2 distinct-seq [169, 365], COVERED 2/2. P1 YẾU
(2/2 occ gần run-end, p=0,050, n=2), P2 ĐÚNG (2/2 lag +1f, 0 âm),
P3-A1 YẾU (2/2 occ đóng băng-tại-tick, p=0,088, n=2 <3, không đạt
luật DEF §5), P3' 2/2 occ ĐẠT (DAT seq 169 stall 3, 365 stall 7
— 365 từng là seq KHÔNG DAT trong union, nay DAT), P7 ĐÚNG
(0 entry trễ ≥+1f).
lag≥+5f (b) = 0 occurrence cả 3 attempt — SẠCH. Cộng dồn MỚI
(29 lượt hợp lệ): P1 109/112, P2 103/103, P3-A1 93/112,
P3' 76/84 occurrence = 71/74 distinct-seq, P7 63/63. HELPER
distinct-seq đọc sổ (quyết (t) đợt 162, đính chính quyết (i)
đợt 163): sổ đã thăng cấp as-of 164 (71/74 distinct, occ 76/84).
PRE-FLIGHT CHECK (quyết (t) đợt 158) PASS PHẦN SETUP — gate0 lúc
mở CHƯA ĐẠT (cờ T5-164 chưa có; postboot check-only exit 1, replay
đang cài dần, dpkg.log chỉ 2 dòng — trạng thái chờ hợp lệ của boot
mới, không phải lỗi setup). Cờ T5-164 cho boot #67 tới ở poll #18
(17:54:54Z; file mtime 17:54:38Z, boot+21m11s, replay-đầy-đủ).
Boot #68: POSTBOOT_PASS CHƯA CÓ lúc đóng (T5-164 sở hữu);
gate0 instance 3 hoàn toàn qua T4-check-only (72/88 poll).
RAM SẬP <500 MB TÁI DIỄN: 6/88 poll instance 3 (min 450 MB) —
lần đầu kể từ đợt 161; chuỗi "0 poll <500 MB" đợt 162–163 đứt.**

## 0. Verdict tổng

- **#33 CÓ LƯỢT HỢP LỆ (lượt hợp lệ #29, attempt2-0c8a94aa).**
  Ngân sách 3 attempt/đợt dùng **2/3 theo attempt-done**:
  attempt1-f1d4ce1a KHÔNG hợp lệ (B2 vi phạm + tickCost 68,0 > 60);
  attempt2-f1d4ce1a BỊ REBOOT #68 GIẾT giữa chừng (không có
  attempt-done — KHÔNG tính ngân sách theo quy tắc đứng P1 đợt
  145); attempt2-0c8a94aa ĐẠT. Poller chết theo reboot #68 lúc
  ~18:06:30Z và được T4 khởi động lại bằng tay 18:11:09Z trên
  boot mới (poller mới pid 3188, instance 3, 88 poll) — xem §1
  + F-164-T4-7. Poller thoát 19:20:59Z vì LUOT HOP LE — KHÔNG
  phải hết ngân sách hay hết hạn (hạn cắt 19:30Z còn ~9 phút,
  hạn cờ ~20:00Z còn ~39 phút).
- **Attempt1-f1d4ce1a (18:00:10–18:03:52Z): probe 20/20,
  KHÔNG HỢP LỆ (lớp B VI PHẠM + tickCost 68,0 > 60, (c2)=0).**
  Vite :5187, WebKit 27.2 (Xvfb :193, đã dọn socket X193 mồ côi
  trước khi lên — xem §4), app boot OK, C2 draw log BẬT, rVFC
  TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall 3163–4167 ms/pass):
  tickCost n=472, blendTick n=381 (tBlend gap), c2DrawLog n=916.
  **tickCost total median= 68,0 ms (p90 96,0, max 169, min 31)**
  — VƯỢT cổng 60 đúng 8,0 ms; hậu flip+2000 ms median 69,0.
  Per-pass median 56,0–78,0 ms — tăng dần theo pass trong khi
  RAM mean/pass giảm 1757 → 1501 MB (Pearson r=-0,42, chỉ mô tả).
  **Lớp B: VI PHẠM 4/5** (B1 load5 cuối 2,09 ≤2,5 ĐẠT; **B2
  load1 max 4,09 > 4 VI PHẠM**; B3 không reboot ĐẠT; B4 pgrep
  -x=0, ps exact-comm=0, dpkg delta=0 ĐẠT — delta kiểm tay, xem
  F-164-T4-1; B5 RAM min 1497 MB, 0 mẫu <500 MB, 0/107 mẫu
  <1024 MB ĐẠT). Sampler n=107.
  **(c2)=0** — không có seq nào để kiểm P3'/P1/P3-A1; **không
  cộng dồn attempt này** (attempt không hợp lệ không tính).
  lag≥+5f (b) = 0 occurrence. **KHÔNG PAGE-WEDGED:** 0 fetch
  timeout, `pageErrs: []`, JSON đầy đủ 2.596.452 B (md5
  `aaf8ff2e753c76a9b86bb68d3ff41038`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (70/70 tick
  không vi phạm thật + gap 278/278 trong ±3, xem skiplatest).
- **Attempt2-f1d4ce1a (18:04:37Z–bị giết bởi reboot #68
  18:06:30Z): KHÔNG TÍNH NGÂN SÁCH, KHÔNG DÙNG VERDICT.**
  Probe kịp ghi đủ JSON 20/20 (2.958.138 B, md5
  `228e24c375a446c6aac30f550adb345d`, `passes=20`, `pageErrs: []`)
  lúc 18:06:15Z (giờ boot cũ) nhưng pipeline chết trước khi
  chạy check-classb/analyzer (không có inner-end, không có
  classb, không có attempt-done). Chỉ ghi nhận (record-only):
  tickCost total n=515 median=55,0 ms (p90 85,0, max 153,
  min 30); (c2)=0; lag≥+5f (b) = 0 occurrence. KHÔNG đánh giá
  lớp B (không có ps-after/classb) nên KHÔNG thể tuyên hợp lệ
  — attempt này không đóng góp vào cộng dồn.
- **Attempt2-0c8a94aa (19:16:46–19:20:59Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 57,0 ≤ 60, lớp B 5/5).** Vite :5187,
  WebKit 27.2 (Xvfb :193), app boot OK, C2 draw log BẬT, rVFC
  TẮT, TAP BẬT, RELABEL BẬT, FLIP sau pass 5 (wallMs=27841).
  20 pass (wall 2876–3260 ms/pass): tickCost n=506,
  blendTick n=398 (tBlend gap; c2coverage đếm 399 — chênh 1,
  xem F-164-T4-5), c2DrawLog n=977.
  **tickCost total median= 57,0 ms (p90 85,0, max 173, min 31)**
  — dư 3,0 ms dưới cổng; hậu flip+2000 ms median 57,0.
  Per-pass median 52,0–78,0 ms (pass 4 chỉ n=5 tick, median
  78,0 — pass mỏng, xem §2); RAM mean/pass 538–722 MB (thấp —
  boot #68 thiếu RAM, xem §1); load1 mean/pass 2,18–2,66.
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,16 ≤2,5; B2 load1 max
  3,56 ≤4; B3 không reboot; B4 pgrep -x=0, ps exact-comm=0,
  dpkg delta=0; B5 RAM min 523 MB, 0 mẫu <500 MB,
  **46/103 mẫu <1024 MB** — ghi nhận, không vi phạm). Sampler
  n=103.
  **(c2)=2 occurrence / 2 distinct-seq [169, 365], COVERED 2/2**
  (tBlend 44235/79035, delta −26/+24 ms).
  lag≥+5f (b) = 0 occurrence — sạch.
  **p1p3p7 chạy TAY (F-148-T4-1): P1 YẾU, P2 ĐÚNG, P3-A1 YẾU,
  P3' ĐẠT, P7 ĐÚNG** (xem §6 — YẾU do n=2, không phải SAI).
  **KHÔNG PAGE-WEDGED** — attempt chạy đủ 20/20, 0 fetch
  timeout, `pageErrs: []`, JSON đầy đủ 2.906.409 B (md5
  `77954cb6538bc7fb883ff76829b8b0d4`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (77/77 tick
  không vi phạm thật + gap 308/308 trong ±3, xem skiplatest).
- **Poller: 116 poll thật** (1 test + 27 instance 2 + 88
  instance 3), **2 boot**, **3 lần cửa mở** (#25, #27 trên boot
  #67; #88 trên boot #68). RAM ≥1024: 42/116; **RAM <500: 6/116
  (tất cả instance 3, boot #68)** — xem F-164-T4-4. Gate0: T5
  10 poll, T4-check-only 77 poll, không-đạt 28 poll. 9 poll
  gần-mở bị chặn bởi gate0 (instance 3 #5–#13: apt đang chạy +
  postboot exit 1). Lock: khong 28 poll, stale-boot 88 poll
  (lock cũ của attempt2-f1d4ce1a chết theo reboot — poller nhận
  đúng stale-boot, xem §1).
- **Chuỗi lượt yên hợp lệ: NỐI DÀI LÊN #29.** Cộng dồn 29 lượt:
  P1 109/112, P2 103/103, P3-A1 93/112, **P3' 76/84 occurrence
  = 71/74 distinct-seq**, P7 63/63. Chuỗi median tickCost 29 lượt:
  39,0–60,0 ms, mean ~48,1 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #32 (quyết (i) đợt 163):** ngưỡng
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi
  ngưỡng/cadence nào. P3-A1 YẾU ở lượt này là do n=2 (không đủ
  mẫu cho luật DEF §5), không phải bằng chứng chống lại mô
  hình — điều tra (c2) VẪN ĐÓNG (xem §6).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc inner-end, lúc run-attempt
  exit — không đổi; mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round164-t4.done` viết 19:28:38Z 21/11
  (trong hạn cờ ~20:00Z, sớm hơn ~31 phút), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158)

Chạy **trước mọi attempt, trước khi mở poller** (17:41:08Z),
ghi vào `hidden_files/round164-t4/preflight-164.txt` — **PASS
PHẦN SETUP, GATE0 LÚC MỞ CHƯA ĐẠT (trạng thái chờ hợp lệ của
boot mới, không phải lỗi setup)**:

- **b.json CÓ trong `round164-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156/157/158/159/160/161/162/163 (F-158-T4-1/2 KHÔNG lặp lại:
  file spec đã có trước khi poller chạy).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–163. **vite.t4-temp.config.mjs md5
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
  `2026-11-21 19:30:00 UTC` → epoch **1795289400** =
  2026-11-21T19:30:00Z — khớp đúng hạn cắt poller 19:30Z
  (hạn cờ ~20:00Z = 1795291200, hạn cứng 20:30Z =
  1795293000); không còn sót dạng `16:30`/`13:30`/`10:30`/
  `07:30`/`08:00`/`08:30` nào trong script mới (grep 0 hit);
  grep `round162` 0 hit.
- **Copy-forward đợt 163 → 164:** deadline poller `16:30Z` →
  `19:30Z` ở cả 3 dạng; `brief dot 163` → `brief dot 164`;
  `poll-test-163`/`stats-163`/`distinct-seq-163` → 164;
  T5FLAG chính `round164-t5/` + fallback `round163-t5/`
  (fallback ban đầu bị sót `round162-t5` — ĐÃ SỬA thành
  `round163-t5` trước khi chạy, kiểm bằng grep).
  **HELPER distinct-seq back-test TRƯỚC LIVE: PASS** — chạy
  helper 164 trên stall + c2coverage attempt2 đợt 163 với sổ
  as-of-163 → ra 69/73 distinct, 0 seq mới, sổ gốc KHÔNG đổi
  (xem `distinct-seq-164-backtest163.txt`).
- **GATE0 LÚC MỞ CHƯA ĐẠT (không phải lỗi setup):** boot #67 mới
  (f1d4ce1a, btime 17:33:27Z), dpkg.log 2 dòng lúc kiểm đầu
  (bộ chưa đầy); cờ T5-164 CHƯA CÓ; cờ T5-163 `cu(mtime-cu)`
  (mtime cũ < btime 17:33:27Z) — KHÔNG tính cho boot mới;
  postboot check-only chạy tay **exit 1** (GST hệ thống 0 plugin,
  debroot 269; apt 11 gói chưa cài — replay đang cài dần, xem
  `preflight-postboot-164.log`). Đây là trạng thái chờ hợp lệ
  của boot mới (giống đợt 161: replay chưa xong lúc mở), không
  phải lỗi setup — poller poll 45 s/lần và mở cửa khi gate0 đạt
  (cờ T5 tới ở poll #18 instance 2; check-only exit 0 từ poll
  #13 instance 2). T4 KHÔNG tự chạy --repair (thuộc T5).
- **Test poll (POLL_TEST=1): exit 7 đúng thiết kế** —
  poll #1 RAM 2508 MB, load1 9,75/load5 3,99 (cửa đóng vì load
  cao), gate0=khong-dat, tree YES, blockers 0, apt 1,
  dpkg 2 (xem `poll-test-164.log`).
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb/MiniBrowser.**
- **LỖI COPY-FORWARD PHÁT HIỆN SAU (F-164-T4-1):** pre-flight
  KHÔNG kiểm `W=` hardcode trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` (chỉ kiểm bash -n + py_compile) nên
  không bắt được W còn trỏ `round163-t4` trước khi attempt1
  chạy — xem §5. Giao T4-165: pre-flight thêm grep `round164`
  trong 2 script này (W phải là round164-t4, 0 hit round163).

## 1. Poller — 116 poll thật, 3 lần cửa mở, trên 2 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot f1d4ce1a
  (17:41:55Z):** poll #1 RAM=2508 MB, load1=9,75 load5=3,99,
  blockers=0, gate0=khong-dat (postboot exit 1, T5-163 cu) →
  cửa đóng (load cao + gate0 chưa đạt) → **TEST-POLL-OK exit 7
  đúng thiết kế**. Poll này nằm trong `poll-test-164.log`;
  thống kê §A đã hợp nhất.
- **Instance 2, 27 poll, boot f1d4ce1a (17:41:57–18:04:37Z):**
  RAM ≥1024: 27/27; load1<2: 9/27; load5<2: 2/27; gate0:
  T4-check-only 5, T5 10, khong-dat 12; lock=khong 27/27;
  dpkg 2 → 1545; blockers=0; apt>0: 16 poll.
- **Instance 3 (KHỞI ĐỘNG LẠI BẰNG TAY SAU REBOOT #68),
  88 poll, boot 0c8a94aa (18:11:09–19:16:46Z):** RAM ≥1024:
  14/88; 500–1023: 68/88; **<500: 6/88 (min 450 MB)**;
  load1<2: 81/88; load5<2: 82/88; gate0: T4-check-only 72,
  khong-dat 16, **T5: 0 poll** (cờ T5-164 cho boot #68 chưa
  có suốt phiên — xem §3); lock=stale-boot 88/88 (lock cũ của
  attempt2-f1d4ce1a chết theo reboot — poller nhận đúng
  stale-boot cả 88 poll); dpkg 2 → 1545; blockers=0; apt>0:
  18 poll.
- **Giai đoạn 1 — chờ replay + load hạ, boot #67 (poll #1–#24
  instance 2, 17:41–17:59Z):** gate0 chưa đạt 12 poll đầu
  (postboot exit 1, apt=1–2, dpkg 2 → 184 → 1545 dần);
  check-only exit 0 từ poll #13 (17:51:05Z, dpkg 1158);
  cờ T5-164 tới poll #18 (17:54:54Z, file mtime 17:54:38Z);
  RAM luôn ≥1024 (min 1329 MB) — RAM KHÔNG BAO GIỜ chặn cửa
  trên boot #67; load1 0,58–9,75, load5 1,90–5,31.
  **0 poll gần-mở bị chặn bởi gate0 trên boot #67** (mọi poll
  load+RAM cùng đạt đều là poll mở cửa).
- **Giai đoạn 2 — cửa mở lần 1 + 2, boot #67 (poll #25, #27):**
  poll #25 (18:00:10Z): load1=0,67, load5=1,90 <2, RAM=1844 MB,
  gate0=T5 → **CỬA MỞ, chạy attempt1** → B2 vi phạm + tickCost
  68,0 > 60 → KHÔNG HỢP LỆ → poller KHÔNG thoát, poll lại
  gate theo quyết (h) đợt 149. Poll #26 (18:03:52Z, ngay sau
  attempt1 xong): load1=1,35, load5=2,09 (>2), RAM=1960 MB →
  cửa đóng. **Poll #27 (18:04:37Z): load1=0,76, load5=1,83 <2,
  RAM=1788 MB** → **CỬA MỞ LẦN 2, chạy attempt2-f1d4ce1a** →
  **REBOOT #68 (btime 18:06:30Z) GIẾT attempt2 + poller giữa
  chừng** (xem §2 + F-164-T4-7).
- **Giai đoạn 3 — poller chết + khởi động lại bằng tay, boot
  #68 (18:06:30–18:11:09Z):** poller cũ (pid 9623) chết theo
  reboot; monitor nền cũng bị SIGTERM theo reboot. T4 kiểm
  tra đĩa 18:07:30Z (boot mới 0c8a94aa, btime 18:06:30Z),
  khắc phục lỗi W (F-164-T4-1), chuyển artifact lạc hướng về,
  chạy analyzer attempt1, rồi **khởi động lại poller bằng tay
  18:11:09Z (pid 3188)** — poller đọc attempt-done trên đĩa
  (1/3 đã dùng; attempt2-f1d4ce1a không có attempt-done nên
  KHÔNG tính) và tiếp tục chờ cửa. Khoảng không-poller
  18:06:30–18:11:09Z (~4m39s).
- **Giai đoạn 4 — chờ RAM trên boot #68 (poll #1–#87 instance 3,
  18:11–19:16Z):** gate0 đạt từ poll #18 (18:23:59Z,
  check-only exit 0, dpkg 1502) nhưng **RAM chặn cửa phần lớn
  phiên**: RAM ≥1024 chỉ 14/88 poll; RAM <500: 6 poll (#31
  491 MB 18:33:47Z, #34 481 MB 18:36:03Z, #37 499 MB 18:38:18Z,
  #40 490 MB 18:40:34Z, #42 494 MB 18:42:05Z, #72 450 MB
  19:04:42Z — chuỗi dài nhất 1 poll, đều rời rạc); RAM
  500–1023: 68 poll. **9 poll gần-mở bị chặn bởi gate0**
  (instance 3 #5–#13, 18:14:10–18:20:12Z: load+RAM cùng đạt
  nhưng apt=1 và postboot exit 1 — replay chưa xong). Load
  thấp suốt giai đoạn này (load1<2: 81/88, load5<2: 82/88) —
  RAM là nguyên nhân chặn cửa duy nhất sau khi gate0 đạt.
- **Giai đoạn 5 — cửa mở lần 3 (poll #88 instance 3,
  19:16:46Z): load1=0,91, load5=0,55 <2, RAM=1136 MB**,
  gate0=T4-check-only (pb_age=3), lock=stale-boot → **CỬA MỞ,
  chạy attempt2-0c8a94aa** → ĐẠT → poller thoát 19:20:59Z.
- **Phân rã 116 poll thật:** RAM≥1024: 42/116; RAM 500–1023:
  68/116; RAM<500: **6/116**. load1<2: 90/116; load5<2: 84/116.
  12 poll mà load + RAM cùng đạt — 3 trong số đó là poll mở
  cửa (#25, #27, #88); 9 poll còn lại bị chặn bởi gate0
  (instance 3 #5–#13). gate0: T5 10 poll, T4-check-only 77
  poll, khong-dat 28 poll. blockers>0: 0 poll. apt>0: 35 poll.
  **RAM SẬP <500 MB TÁI DIỄN (F-164-T4-4):** đợt 154: 74/147
  poll <500 MB; đợt 155: 2/123; đợt 156: 0/32; đợt 157: 0/25;
  đợt 158: 0/18; đợt 159: 0/6; đợt 160: 0/30; đợt 161: 37/89
  (tái diễn); đợt 162: 0/23; đợt 163: 0/19; đợt này:
  **6/116 poll <500 MB** — toàn bộ trên boot #68 (6/88),
  boot #67: 0/28. RAM mở phiên 2508 MB (test) rồi 1329–2800 MB
  (instance 2, boot #67), sau đó 450–2543 MB (instance 3,
  boot #68).

## 2. Attempt1 KHÔNG hợp lệ + attempt2-f1d4ce1a bị reboot giết + attempt2-0c8a94aa HỢP LỆ, 0 wedge

- **Attempt1-f1d4ce1a (18:00:10–18:03:52Z): probe 20/20,
  KHÔNG HỢP LỆ (lớp B VI PHẠM + tickCost 68,0 > 60, (c2)=0).**
  Vite :5187, WebKit 27.2 (Xvfb :193, đã dọn socket X193 mồ côi
  trước khi lên), WebKit launched ~18:00:1xZ, app boot OK,
  C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT,
  FLIP sau pass 5 (wallMs=30773). 20 pass (wall 3163–4167
  ms/pass): tickCost n=472, blendTick n=381 (tBlend gap),
  c2DrawLog n=916. **tickCost total median= 68,0 ms (p90 96,0,
  max 169, min 31)** — vượt cổng 60 đúng 8,0 ms; hậu
  flip+2000 ms median 69,0. **Lớp B: VI PHẠM 4/5** (B1 load5
  cuối 2,09 ≤2,5 ĐẠT; **B2 load1 max 4,09 > 4 VI PHẠM**; B3
  không reboot ĐẠT; B4 pgrep -x=0, ps exact-comm=0, dpkg
  delta=0 ĐẠT — delta kiểm tay 1545→1545, xem F-164-T4-1; B5
  RAM min 1497 MB, 0 mẫu <500 MB, **0/107 mẫu <1024 MB** ĐẠT).
  Sampler n=107. Per-pass: tickCost median/pass 56,0–78,0 ms —
  tăng dần theo pass trong khi RAM mean/pass giảm 1757 →
  1501 MB; Pearson r=-0,42 median~RAM_mean (chỉ mô tả — xem
  F-164-T4-1). Wallbands: median 56,0 ms ở 0–20k → 68,0–70,0 ms
  từ 20k trở đi. **(c2)=0** (labellag (c)=0, (c2)=0; stall
  analyzer "(c2)=0 — khong co seq de kiem P3'"; c2coverage
  "(c2)=0"). lag≥+5f (b) = 0 occurrence. **KHÔNG PAGE-WEDGED:**
  0 fetch timeout, `pageErrs: []`, JSON đầy đủ 2.596.452 B
  (md5 `aaf8ff2e753c76a9b86bb68d3ff41038`), `passes=20`,
  không có trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (70/70 tick
  không vi phạm thật + gap presented-expected 278/278 trong ±3).
  **Attempt này KHÔNG ĐƯỢC CỘNG DỒN** (không hợp lệ — theo
  quy ước đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
  **Caveat F-164-T4-1:** artifact attempt1 ban đầu bị ghi nhầm
  vào `round163-t4/` do W hardcode sai (xem §5) — đã chuyển
  về `round164-t4/` và chạy analyzer tay; mọi số trên trích từ
  file đã khôi phục (JSON + classb + sampler gốc), không gõ tay.
  Poller đánh giá "LOP B VI PHAM" dựa trên file classb THIẾU
  trong `round164-t4/` (grep fail) — nhưng verdict thật (đọc
  file đã khôi phục) CŨNG là VI PHẠM (B2 load1 max 4,09) nên
  quyết retry là ĐÚNG về thực chất.
- **Attempt2-f1d4ce1a (18:04:37Z–bị giết bởi reboot #68
  18:06:30Z): KHÔNG TÍNH NGÂN SÁCH, KHÔNG DÙNG VERDICT.**
  Vite :5187, WebKit 27.2 (Xvfb :193). Probe kịp ghi đủ JSON
  20/20 (2.958.138 B, md5 `228e24c375a446c6aac30f550adb345d`,
  `passes=20`, `pageErrs: []`) lúc 18:06:15Z (giờ boot cũ) —
  nhưng pipeline chết trước khi chạy check-classb/analyzer
  (không có inner-end, không có classb, không có ps-after,
  không có attempt-done; chain log dừng ở dòng output probe
  cuối 18:06:15Z). Chỉ ghi nhận (record-only): tickCost total
  n=515 median=55,0 ms (p90 85,0, max 153, min 30); hậu
  flip+2000 ms median 54,0; (c2)=0; lag≥+5f (b) = 0 occurrence;
  FLIP wallMs=30144. KHÔNG đánh giá lớp B nên KHÔNG thể tuyên
  hợp lệ — attempt này không đóng góp vào cộng dồn. File JSON
  + log giữ lại trong `round164-t4/` làm bằng chứng.
- **Attempt2-0c8a94aa (19:16:46–19:20:59Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 57,0 ≤ 60, lớp B 5/5).** Vite :5187,
  WebKit 27.2 (Xvfb :193), WebKit launched ~19:16:5xZ, app boot
  OK, C2 draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT, FLIP
  sau pass 5 (wallMs=27841). 20 pass (wall 2876–3260 ms/pass):
  tickCost n=506, blendTick n=398 (tBlend gap; c2coverage đếm
  399 — chênh 1, xem F-164-T4-5), c2DrawLog n=977.
  **tickCost total median= 57,0 ms (p90 85,0, max 173, min 31)**
  — dư 3,0 ms dưới cổng; hậu flip+2000 ms median 57,0.
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,16 ≤2,5; B2 load1 max
  3,56 ≤4; B3 không reboot; B4 pgrep -x=0, ps exact-comm=0,
  dpkg delta=0; B5 RAM min 523 MB, 0 mẫu <500 MB,
  **46/103 mẫu <1024 MB** — ghi nhận, không vi phạm). Sampler
  n=103. Per-pass: tickCost median/pass 52,0–78,0 ms — pass 4
  chỉ n=5 tick (median 78,0 — pass mỏng, không dùng riêng);
  load1 mean/pass 2,18–2,66; RAM mean/pass 538–722 MB (thấp —
  boot #68 thiếu RAM, xem §1); Pearson r=-0,39
  median~load1_mean, r=0,11 median~RAM_mean (chỉ mô tả).
  Wallbands: median ổn định 54,5–58,0 ms mọi dải. **(c2)=2
  occurrence / 2 distinct-seq [169, 365], COVERED 2/2**
  (tBlend 44235/79035, delta −26/+24 ms; blendTick hậu-flip
  308/308 trong ±500 ms của log).
  lag≥+5f (b) = 0 occurrence — sạch.
  **p1p3p7 chạy TAY (xem §6): P1 YẾU, P2 ĐÚNG, P3-A1 YẾU,
  P3' ĐẠT, P7 ĐÚNG.** **KHÔNG PAGE-WEDGED:** 0 fetch timeout,
  `pageErrs: []`, JSON đầy đủ 2.906.409 B (md5
  `77954cb6538bc7fb883ff76829b8b0d4`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (77/77 tick
  không vi phạm thật + gap 308/308 trong ±3).
- **Caveat B2 attempt2-0c8a94aa — KHÔNG CÓ (sạch):**
  `ps-after` chỉ liệt kê process vite của chính attempt
  (pid 25218/25240/25241, config `round164-t4/` — đúng thư mục
  sau khi vá W); không có process luồng khác nào bắt đầu trong
  lúc attempt chạy (khác đợt 163: T2-163 trong ps-after cả 2
  attempt). B2 ĐẠT sạch, không caveat để T10 đối chiếu.
- **Lưu ý seq 169 + 365 (quyết (j) đợt 156):** 169 là seq MỚI
  hoàn toàn trên cơ sở P3' (139+); 365 đã có trong union
  distinct-seq (từng là seq KHÔNG DAT — xem §6) nhưng CHƯA
  từng DAT — lần này stall 7 → DAT. Không seq nào trong 2 seq
  này từng DAT trong lượt hợp lệ nào trước đó.

## 3. Replay/postboot trên 2 boot — cờ T5-164 cho #67 CÓ (replay tự nhiên, KHÔNG cần early-repair); cờ cho #68 CHƯA CÓ

- **Boot f1d4ce1a (#67 ứng viên, btime 17:33:27Z):**
  replay TỰ NHIÊN CHẠY ĐẦY ĐỦ trên boot này: dpkg.log 2 dòng
  lúc T4 mở (17:41Z — bộ chưa đầy) → 1545 dòng lúc 17:51Z;
  **T5-164: POSTBOOT_PASS mới viết 17:54:38Z (boot+21m11s;
  dpkg 1545 dòng; cache 178 .deb; lists 39; postboot PASS
  poll=0 độc lập exit 0 lúc 17:54:38Z; replay-đầy-đủ; cờ cũ
  1c1cf10c lưu POSTBOOT_PASS-1c1cf10c)**. Gate0=T5 từ poll #18
  instance 2 (17:54:54Z). Nhanh hơn đợt 163 (cờ tới
  boot+10m08s)? — KHÔNG, chậm hơn (boot+21m11s vs boot+10m08s
  đợt 163; đợt 162 boot+24m42s) — vẫn trong họ replay tự nhiên
  chạy đầy đủ, khác đợt 161 (replay VẮNG MẶT, frozen 621 s,
  early-repair mới cứu được cờ ở boot+60m01s, dpkg chỉ 795
  dòng): đợt này replay tự nhiên hoàn thành và dpkg đủ bộ
  1545 dòng — T5 chi tiết; T4 chỉ ghi số, không tự kết luận
  replay có "đầy đủ" không (postboot check-only PASS là đủ cho
  gate0 theo quyết (j) đợt 143). Postboot check-only của chính
  T4 đã PASS (exit 0) từ poll #13 instance 2 (17:51:05Z), nên
  gate0 có sẵn qua đường dự phòng T4-check-only từ poll #13
  (trước khi cờ T5 tới 5 poll).
- **Boot 0c8a94aa (#68 ứng viên, btime 18:06:30Z):**
  **POSTBOOT_PASS CHƯA CÓ lúc T4 đóng** (cờ T5-164 vẫn ghi
  boot f1d4ce1a, mtime 17:54:38Z < btime 18:06:30Z — KHÔNG
  tính cho boot mới; grep `0c8a94aa` trong POSTBOOT_PASS = 0).
  Replay trên boot mới: dpkg.log 2 dòng lúc poller khởi động
  lại (18:11:09Z) → 1545 dòng lúc 18:25:29Z (poll #20 instance
  3); postboot check-only exit 0 từ poll #18 instance 3
  (18:23:59Z, dpkg 1502) — replay tự nhiên CÓ CHẠY trên boot
  mới (dpkg đủ bộ), chỉ chưa có cờ T5 xác nhận lúc đóng.
  **Gate0 instance 3 (88 poll) hoàn toàn qua T4-check-only**
  (72 poll; 16 poll khong-dat lúc đầu) — đường dự phòng
  quyết (j) đợt 143 đã gánh toàn bộ phiên trên boot #68.
  **Watcher-164 của T5 CHẾT THEO REBOOT #68** (T5-164 sở hữu):
  `replay-watch-164.log` poll cuối 18:06:41Z (giờ boot cũ —
  SAU btime boot mới 18:06:30Z, xem F-164-T4-2; vẫn ghi nhãn
  boot cũ f1d4ce1a); không có watcher nào sống trên boot #68
  lúc T4 đóng (T5-164 sở hữu việc khởi động lại).
- **KHÔNG có reboot mới sau #68 trong phiên đo hay lúc đóng:**
  boot 0c8a94aa lúc poller khởi động lại (18:11:09Z), lúc
  attempt2-0c8a94aa, lúc poller thoát (19:20:59Z) và lúc kiểm
  cuối (19:25Z) — btime 18:06:30Z không đổi. Số hiệu #67/#68
  CHƯA ĐƯỢC XÁC NHẬN (T0-164) — T4 không tự xác nhận số hiệu
  reboot. Mù #95?/#94?/#88?/#77? giao T2-164 — T4 không tự mở mù.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND164_T4_WEBKIT_QUIET33_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round164-t4/`):**
  `poll-wait-t4-164.sh` (md5 `168f8d87…`, deadline 19:30Z 21/11 +
  cờ T5 round164-t5/ + fallback round163-t5/ + nhãn T4-164a),
  `run-attempt-164.sh` (md5 `c6146f24…`, đổi số vòng/đường dẫn/
  nhãn so với 163),
  `distinct-seq-164.py` (md5 `1763460d…`, HELPER đọc sổ
  distinct-seq-ledger.json; bản snapshot trong repo là bản ghi
  code đã dùng live; khi chạy từ `apps/web/scripts/` phải truyền
  `--ledger` trỏ tới sổ vì sổ không nằm cùng thư mục — nếu
  không, helper lỗi FileNotFoundError thay vì in số sai, xem §6).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–163, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round164-t4/` — theo đúng mẫu 149–163: chỉ
  stage 3 script trên; **fix W trong inner/check-classb ĐÃ ÁP
  DỤNG ở bản làm việc đợt này** — xem F-164-T4-1; T4-165
  copy-forward 2 file này từ bản làm việc đợt 164, KHÔNG copy
  từ bản round163-t4). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round164-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–163).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-164.sh`, `run-attempt-164.sh`,
  `t4-attempt-inner.sh` (ĐÃ VÁ W → round164-t4 + glob check
  nhiễu chéo round164-*), `check-classb-t4.sh` (ĐÃ VÁ W →
  round164-t4), 10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-164.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn mới 29 lượt TRƯỚC KHI chạy),
  `distinct-seq-164.py` (helper đọc sổ, xem §6),
  `distinct-seq-ledger.json` (SỔ distinct-seq, as-of 164:
  71/74 distinct, occ 76/84 — nguồn thật mới cho T4-165),
  `distinct-seq-ledger-164-proposed.json` (bản helper ghi ra
  trước khi T4 thăng cấp thành sổ — giống hệt sổ hiện tại,
  giữ làm audit trail),
  `distinct-seq-164-backtest163.txt` (back-test helper trên dữ
  liệu đợt 163 trước live),
  `build-distinct-seq-ledger.py` (script xây sổ từ file
  stall/c2coverage gốc của 15 lượt hợp lệ 139–162 — chạy lại
  được, xem §6),
  `distinct-seq-164-run-attempt2-0c8a94aa.txt` (output helper
  chạy live trên attempt2-0c8a94aa),
  `preflight-164.txt` + `preflight-postboot-164.log`
  (pre-flight check, quyết (t) đợt 158).
- **Log/evidence (hidden_files/round164-t4/, không stage):**
  `poll-t4.log` (instance 2: 27 poll + CUA YEN MO ×2; instance 3
  khởi động lại sau reboot: 88 poll + CUA YEN MO ×1 + LUOT HOP
  LE), `poll-test-164.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log` (instance 2),
  `poll-t4-restart.nohup.log` (instance 3),
  `chain-t4.log`, `postboot-t4-164-gate0wait-*.log` (check-only
  poll #1/#5/#9/…),
  `stats-164-output.txt` (output stats-164.py),
  `preview-b-f3-flip-webkit-t4-attempt1-f1d4ce1a.json`
  (2.596.452 B, 20/20, md5 `aaf8ff2e753c76a9b86bb68d3ff41038`)
  + `preview-b-f3-flip-webkit-t4-attempt2-f1d4ce1a.json`
  (2.958.138 B, 20/20, md5 `228e24c375a446c6aac30f550adb345d`
  — bị reboot giết trước khi đánh giá, chỉ ghi nhận)
  + `preview-b-f3-flip-webkit-t4-attempt2-0c8a94aa.json`
  (2.906.409 B, 20/20, md5 `77954cb6538bc7fb883ff76829b8b0d4`)
  + `run-webkit-t4-attempt1-f1d4ce1a.log` +
  `run-webkit-t4-attempt2-f1d4ce1a.log` +
  `run-webkit-t4-attempt2-0c8a94aa.log` +
  `load-mid-t4-attempt1-f1d4ce1a.log` (sampler n=107) +
  `load-mid-t4-attempt2-f1d4ce1a.log` (sampler n=73, 5 dòng
  sau btime boot mới — xem F-164-T4-2) +
  `load-mid-t4-attempt2-0c8a94aa.log` (sampler n=103) +
  `ps-before/after-t4-attempt1-f1d4ce1a.txt` +
  `ps-before-t4-attempt2-f1d4ce1a.txt` (KHÔNG có ps-after —
  pipeline chết trước check-classb) +
  `ps-before/after-t4-attempt2-0c8a94aa.txt`
  + `classb-t4-attempt1-f1d4ce1a.txt` (LOP-B-TONG VI PHAM
  B2 load1 max 4,09; B4 delta kiểm tay 1545→1545=0)
  + `classb-t4-attempt2-0c8a94aa.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-f1d4ce1a-*.txt` (10 file)
  + `analyze-t4-attempt2-f1d4ce1a-*.txt` (6 file record-only:
  tickcost, labellag, lag5, c2coverage, stall, + skiplatest
  KHÔNG chạy — pipeline chết trước analyzer)
  + `analyze-t4-attempt2-0c8a94aa-*.txt` (10 file)
  + `analyze-t4-p1p3p7-attempt2-0c8a94aa.txt`
  + `coverage-check-attempt1-f1d4ce1a.txt` ((c2)=0)
  + `coverage-check-attempt2-0c8a94aa.txt` (2/2)
  + `attempt-done-attempt1-f1d4ce1a` (exit 0, 18:03:52Z)
  + `attempt-done-attempt2-0c8a94aa` (exit 0, 19:20:59Z).
  `analyze-l7-labellag.txt` + `lag5-detail.txt` là output mặc
  định của analyzer (ghi theo tên mặc định trong script —
  xem F-157-T4-6), nội dung trùng bản per-attempt.
  `vite-5187-t4-attempt*-*.log` (vite log mỗi attempt) +
  `stop-sampler-t4-attempt1-f1d4ce1a` (marker) +
  `dpkg-lines-before-*` + `apt-history-before-*` (B4 baseline
  mỗi attempt) + `marker-t4-attempt*-*.txt` (marker).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 19:20:59Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000; `/tmp/.X11-unix/` TRỐNG sau khi T4 dọn
  socket X193 mồ côi của attempt2-0c8a94aa — xem §5).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round164-t4-quiet33.txt`
  (NUL-delimited, 4 entry — LIMITS + 3 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round164-t4.done` (~19:25Z 21/11 — trong
  hạn cờ ~20:00Z, sớm hơn ~35 phút, CÓ NỘI DUNG).

## 5. Sai số F-164-T4-1..8 (+ nợ cũ)

- **F-164-T4-1 — COPY-FORWARD BỎ SÓT W HARDCODE TRONG
  t4-attempt-inner.sh + check-classb-t4.sh (sai số quy trình —
  LỖI LỚN NHẤT ĐỢT NÀY, ĐÃ KHẮC PHỤC TRONG PHIÊN, không ảnh
  hưởng verdict cuối).** T4-164 copy 2 file này từ round163-t4
  KHÔNG đổi số đợt (chỉ đổi số ở poll-wait/run-attempt/
  distinct-seq/stats): cả hai còn `W=.../round163-t4`
  (dòng 17 inner, dòng 21 check-classb). Hậu quả:
  (a) artifact attempt1 + attempt2-f1d4ce1a (JSON, run-webkit
  log, load-mid log, ps-after, classb, vite log, stop-sampler)
  bị ghi nhầm vào thư mục round163-t4 đã đóng băng (11 file);
  (b) run-attempt-164.sh tìm JSON trong round164-t4 không thấy
  → "KHONG CO JSON — probe khong ghi duoc file (exit=0)" và
  BỎ QUA toàn bộ analyzer attempt1; (c) poller đánh giá "LOP B
  VI PHAM" dựa trên file classb THIẾU (grep fail) — may mắn là
  verdict thật (đọc file đã khôi phục) CŨNG là VI PHẠM nên
  quyết retry ĐÚNG về thực chất; (d) file classb attempt1 ghi
  dpkg delta "?" (đọc baseline từ W sai) — T4 kiểm tay:
  dpkg-lines-before-attempt1 (round164-t4) = 1545, dpkg lúc
  classb = 1545 → delta 0, B4 ĐẠT thật. **ĐÃ KHẮC PHỤC:**
  sửa W → round164-t4 ở cả 2 script (bash -n OK, grep round163
  0 hit — kể cả glob check nhiễu chéo round163-* → round164-*);
  chuyển 11 file lạc hướng về round164-t4; kiểm chứng
  round163-t4 còn **0 file mtime ≥18:00Z** (đã khôi phục trạng
  thái đóng băng); chạy analyzer attempt1 tay đầy đủ (10 file).
  **Giao T4-165:** pre-flight thêm grep `W=` + `round163`
  trong inner/check-classb (W phải trỏ đúng thư mục đợt hiện
  tại, 0 hit số đợt cũ) TRƯỚC khi mở poller;
  copy-forward từ nay phải grep `round16[0-9]` trong MỌI script
  làm việc, không chỉ script đổi tên.
- **F-164-T4-2 — SAMPLER attempt2-f1d4ce1a GHI 5 DÒNG SAU BTIME
  BOOT MỚI (dị thường đo, không phải process sống qua reboot).**
  load-mid attempt2 (73 dòng, 18:04:40–18:07:05Z giờ boot cũ):
  5 dòng cuối 18:06:57/18:06:59/18:07:01/18:07:03/18:07:05Z
  — SAU btime boot mới 18:06:30Z, vẫn tag boot=f1d4ce1a.
  Giải thích: lệch đồng hồ ~35 s giữa 2 boot (giờ boot cũ
  chạy nhanh hơn giờ boot mới ~35 s): sampler chết theo reboot
  ở giờ cũ ~18:07:05Z = giờ mới ~18:06:30Z (khớp btime);
  monitor nền của T4 cũng bị SIGTERM chết ở giờ cũ ~18:07:01Z;
  watcher-164 của T5 cũng log poll cuối 18:06:41Z (giờ cũ,
  sau btime mới) — cùng mẫu. Bằng chứng process KHÔNG sống
  qua reboot: chain log attempt2 KHÔNG có inner-end;
  poller/monitor/watcher đều chết; uptime boot mới "up 1 min"
  lúc 18:07:53Z. Ghi nhận để T2-164 đối chiếu khi xét (m)/đồng
  hồ cho #68; T4 không tự kết luận số lệch chính xác.
- **F-164-T4-3 — p1p3p7 CHẠY TAY LẦN ĐẦU THIẾU argv[2]
  (sai số thao tác — bắt ngay, chạy lại đúng, không ảnh hưởng
  đo).** Lần đầu gọi `analyze-t4-p1p3p7.py <JSON>` không truyền
  seqs → IndexError (argv[2]). Chạy lại với `"169,365"` →
  exit 0, output lưu `analyze-t4-p1p3p7-attempt2-0c8a94aa.txt`.
  (Đợt 163 gọi đúng ngay lần đầu — lần này T4 quên tham số.)
  Nợ đứng ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn —
  F-148-T4-1.
- **F-164-T4-4 — RAM SẬP <500 MB TÁI DIỄN (quan sát đo, không
  phải sai số — PHÁT HIỆN ĐÁNG CHÚ Ý NHẤT VỀ RAM ĐỢT NÀY).**
  6/88 poll instance 3 (boot #68) <500 MB: #31 491, #34 481,
  #37 499, #40 490, #42 494, #72 450 MB (min toàn phiên 450 MB);
  chuỗi dài nhất 1 poll (rời rạc). Chuỗi "0 poll <500 MB"
  đợt 162–163 ĐỨT — lần đầu RAM sập kể từ đợt 161 (37/89).
  RAM ≥1024 chỉ 14/88 poll instance 3 (68 poll ở 500–1023);
  RAM là nguyên nhân chặn cửa chính trên boot #68 (load đã
  thấp: load1<2 81/88). Attempt2-0c8a94aa chạy trong RAM
  mean/pass chỉ 538–722 MB (sampler n=103, 46 mẫu <1024 MB)
  mà vẫn ĐẠT (tickCost 57,0) — RAM thấp không kéo tickCost
  vượt cổng lần này. T4 không đổi ngưỡng gate A RAM (quyết (i)
  đợt 163 giữ nguyên); ghi nhận để T9-164 đối chiếu headroom/
  balloon trên boot #68.
- **F-164-T4-5 — blendTick ĐẾM CHÊNH 1 GIỮA 2 ANALYZER
  (không ảnh hưởng verdict — lần thứ năm liên tiếp cùng mẫu).**
  Attempt2-0c8a94aa: tickcost analyzer đếm blendTick n=398
  (tBlend gap); c2coverage đếm n=399 (cùng JSON). Chênh 1,
  cùng mẫu F-160-T4-7, F-161-T4-9, F-162-T4-2, F-163-T4-8.
  Có thể do đếm biên flip; không ảnh hưởng (c2)/tickCost/lớp B.
  Ghi nhận, không điều tra riêng.
- **F-164-T4-6 — NHÃN FOOTER stats-164.py STALE "28 luot"
  (sai số ghi chép — bắt trước khi viết LIMITS).** Lần chạy
  stats đầu vẫn mang nhãn "chuoi median 28 luot" trong khi số
  trong là n=29. ĐÃ SỬA nhãn thành "29 luot" và chạy lại
  stats-164.py — output cuối (`stats-164-output.txt`) đúng.
  (Cùng họ lỗi F-163-T4-4: số ghi tay giữa đợt lệch số log gốc
  — lần này bắt được trước khi đóng sổ.)
- **F-164-T4-7 — POLLER + MONITOR CHẾT THEO REBOOT #68
  (không phải sai số T4 — sự kiện hạ tầng, ĐÃ KHÔI PHỤC).**
  Poller cũ (pid 9623) + monitor nền chết khi reboot #68 giết
  boot #67 (~18:06:30Z; monitor bị SIGTERM ở giờ cũ ~18:07:01Z
  — xem F-164-T4-2). T4 khôi phục bằng kiểm tra đĩa (không
  đoán mò trạng thái): xác nhận boot mới, attempt2-f1d4ce1a
  không có attempt-done (không tính ngân sách), sửa W, chuyển
  artifact, chạy analyzer attempt1, khởi động lại poller bằng
  tay 18:11:09Z (pid 3188). Khoảng không-poller ~4m39s; không
  mất đo nào (poll log + artifact đầy đủ trên đĩa).
- **F-164-T4-8 — GATE0 INSTANCE 3 HOÀN TOÀN QUA T4-CHECK-ONLY
  (giới hạn đứng, không phải lỗi T4).** 88/88 poll instance 3
  (boot #68): gate0=T4-check-only 72 poll, khong-dat 16 poll,
  T5: 0 poll — cờ T5-164 cho boot #68 CHƯA CÓ lúc T4 đóng
  (T5-164 sở hữu; watcher-164 chết theo reboot #68). Đường
  dự phòng quyết (j) đợt 143 đã gánh toàn bộ phiên trên boot
  mới và hoạt động đúng (cửa mở poll #88 qua check-only
  pb_age=3). T4 không tự viết cờ T5 thay T5. Ghi nhận để
  T8-164/T10 đối chiếu gate cho chuỗi FULL PASS (O8 chạy trên
  boot nào, gate nào).
- **F-163-T4-1..8 — ĐÃ TRÁNH / KHÔNG LẶP LẠI (trừ F-163-T4-8
  dạng nhẹ, xem F-164-T4-5).** lag≥+5f (b) = 0 occ cả 3 attempt
  (khác đợt 162: 16 occ — F-162-T4-1 không tái diễn);
  blendTick chênh 1 vẫn còn (F-163-T4-8 → F-164-T4-5, mẫu
  đứng); helper distinct-seq đọc sổ, không còn hardcode cơ số
  (F-163-T4-5 không thể lặp — grep `{NN+len` 0 hit);
  P3-A1 không SAI mà YẾU do n=2 (F-163-T4-6 cùng mẫu);
  blockers=0 mọi poll (F-162-T4-6 không tái diễn); tải đầu
  đợt cao vẫn còn nhưng nhẹ hơn (F-163-T4-7 — load1 max 9,75
  lúc mở, hạ dần).
- **F-162-T4-7 dạng nặng, xem F-164-T4-4.** Tải đầu đợt cao
  (load1 max 9,75 poll test, load5 max 5,31) + RAM sập trên
  boot #68 — hai hiện tượng khác nhau (load cao đầu đợt do
  các luồng khác chạy nặng lúc mở; RAM sập là đặc tính boot
  #68). T4 không tự kết luận nguyên nhân (không có bằng chứng
  process nào trong poll snapshot; blockers=0 mọi poll).
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-164 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này.** p1p3p7 chạy TAY sau
  poller, exit 0 (sau lần gọi đầu thiếu tham số — xem
  F-164-T4-3), output lưu
  `analyze-t4-p1p3p7-attempt2-0c8a94aa.txt` (xem §6). Nợ đứng
  ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt
  có attempt hợp lệ T4 phải chạy tay và ghi rõ.

## 6. P3' cộng dồn (MỚI — 29 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 164 (MỚI): P1 109/112, P2 103/103,
  P3-A1 93/112, P3' 76/84 occurrence = 71/74 distinct-seq, P7
  63/63** (29 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 163 §6: "28 lượt hợp lệ" — nay 29).
- **Đóng góp lượt #33 (attempt2-0c8a94aa, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=2 occurrence / 2 distinct-seq [169, 365].
  - **P1 YẾU — 2/2 occ** (distinct 2/2 gần run-end:
    run_end seqs [102, 107, 112, 123, 126, 132, 148, 152, 169,
    184, 191, 218, 235, 241, 252, 277, 300, 304, 308, 318, 364,
    374, 384]; baseline 69/308, p=0,0501876 trên distinct 2/2
    — không đạt luật DEF §3 vì n=2 <3 và p≥0,01). Cộng dồn
    107/110 → **109/112**.
    (P1 signed đối chiếu: baseline 65/308, p=0,0445374 — cũng
    YẾU.)
  - **P2 ĐÚNG — 2/2 occ** lag ≥+1f, 0 lag âm (lag từng tuple:
    169: 16/15/1; 365: 19/18/1 — cả hai +1f). Cộng dồn 101/101 →
    **103/103**.
  - **P3-A1 YẾU — 2/2 occ** (distinct 2/2: 169, 365 đóng
    băng-tại-tick; baseline 91/307, p=0,087863 trên distinct
    2/2 — không đạt luật DEF §5 vì n=2 <3 và p≥0,01). Cộng dồn
    91/110 → **93/112**.
  - **P3' 2/2 occ ĐẠT** (distinct 2/2; DAT seq 169 stall 3,
    365 stall 7). Cộng dồn 74/82 → **76/84 occurrence**;
    distinct 69/73 → **71/74** (169 MỚI; 365 đã thấy trong
    (c2) nhưng chưa DAT — nay DAT, xem kiểm chứng dưới).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 8, 0: 11}; đối chứng toàn bộ drawSrc post: {-1: 234,
    0: 151}, 0/385 entry). Cộng dồn 62/62 → **63/63**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–163).
- **HELPER distinct-seq ĐỌC SỔ (quyết (t) đợt 162 + đính chính
  quyết (i) đợt 163 — ĐÃ DÙNG LIVE, KHÔNG KIỂM TAY).** Helper
  `distinct-seq-164.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 163: 69/73 distinct, occ 74/82), tính seq MỚI =
  tập hiệu với sổ, in cộng dồn mới distinct + occurrence, ghi
  sổ MỚI ra file riêng
  (`distinct-seq-ledger-164-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Back-test trước live (xem §0b):** chạy helper trên stall +
  c2coverage attempt2 đợt 163 với sổ as-of-163 → ra 69/73
  distinct, 0 seq mới — khớp số đã đính chính quyết (i) đợt
  163; sổ gốc KHÔNG đổi trong back-test. **Live đợt 164:**
  sổ + stall/c2coverage attempt2-0c8a94aa → **71/74 distinct,
  76/84 occ** — khớp tính tay độc lập dưới đây. Sổ đã thăng
  cấp: as-of 164, 71/74 distinct, occ 76/84, valid_rounds_p3
  17, non_dat_in_union [283, 364, 498] (365 ĐÃ RỜI danh sách
  không-DAT — nay DAT).
- **Kiểm chứng 2 seq đợt 164:** helper (đọc sổ) xác nhận
  **169 MỚI hoàn toàn** (chưa có trong union 139–163) và
  **365 đã có trong seen_c2 (71 seq) nhưng chưa có trong
  seen_dat (69 seq)** — 365 từng xuất hiện trong (c2) của lượt
  hợp lệ trước nhưng stall <2 nên không DAT; lần này stall 7
  → DAT. Tính tay: distinct DAT 69 + {169, 365} = **71**;
  distinct tổng 73 + {169} = **74**; occurrence 74 + 2 = **76**,
  82 + 2 = **84**. Khớp helper. (Theo cách ghi cũ bằng grep
  LIMITS, 169 chưa từng xuất hiện trong (c2) của lượt hợp lệ
  nào; 365 đã xuất hiện nhưng chưa DAT — hai cách kiểm đồng
  thuận lần này.)
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** — P1 YẾU và P3-A1 YẾU ở lượt này là do
  n=2 (không đủ mẫu cho luật DEF §3/§5), không phải SAI:
  (1) P1 per-occurrence ĐÚNG 2/2; (2) lag âm — KHÔNG (0);
  (3) +2f ≥3 — KHÔNG (lag (c2) chỉ +1f/+1f, không có tiêu
  chí mở lại nào xảy ra theo §13 DEF v0.5). P3' (prereg
  stall-based) vẫn ĐẠT 2/2 — bằng chứng ủng hộ chính không suy
  yếu. lag≥+5f (b) = 0 occurrence cả 3 attempt — ghi nhận ở
  F-164-T4-4, không dùng làm verdict.
- Chuỗi median tickCost 29 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 / 53,0 /
  **57,0 ms** (trung bình ~48,1 ms; min 39,0, max 60,0; 0 lượt
  vượt ngưỡng 60). Lượt này 57,0 ms — thấp thứ 24 trong chuỗi
  (23 lượt thấp hơn).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 165

- **(a) #33 CÓ lượt hợp lệ — lượt hợp lệ #29 (chuỗi lượt yên
  hợp lệ NỐI DÀI #22 → #23 → #24 → #25 → #26 → #27 → #28 →
  #29).** Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8)
  ĐÃ ĐẠT** — lượt yên #33 thuộc HAI boot (attempt hợp lệ trên
  boot 0c8a94aa #68 ứng viên; attempt1 không hợp lệ trên boot
  f1d4ce1a #67 ứng viên). O8 chạy trên boot nào, có qua gate
  chuẩn hay phải dùng thủ tục (i), là do T8/T10 quyết theo
  tiền lệ (quyết (h) đợt 157: chuỗi được tính khi O8 chạy sau
  lượt yên về thời gian, dù reboot xen giữa đổi boot). T4 chỉ
  ghi dữ kiện, không tự kết luận chuỗi FULL PASS. Lưu ý:
  attempt hợp lệ chạy trên boot #68 (sau reboot giữa đợt);
  gate cho attempt này mở qua **T4-check-only** (cờ T5-164 cho
  boot #68 chưa có lúc đóng — xem F-164-T4-8); O8/T8 đối
  chiếu gate khi xét chuỗi.
- **(b) P3' cộng dồn MỚI 76/84 = 71/74 + seq 365 NAY DAT
  (xem §6 + F-164-T4-1):** helper đọc sổ và kiểm chứng
  back-test + live; sổ distinct-seq-ledger.json là nguồn thật
  mới (as-of 164). **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới P1 109/112, P2 103/103, P3-A1 93/112, P3' 76/84 = 71/74,
  P7 63/63. T10 kiểm lại phép cộng khi viết aggregate (§12).
- **(c) PAGE-WEDGED KHÔNG tái diễn lần thứ tám liên tiếp (0
  wedge đợt 157 + 0 wedge đợt 158 + 0 wedge đợt 159 + 0 wedge
  đợt 160 + 0 wedge đợt 161 + 0 wedge đợt 162 + 0 wedge đợt
  163 + 0 wedge đợt này — cả 3 attempt chạy đủ 20/20 sạch,
  kể cả attempt2-f1d4ce1a bị reboot giết sau khi probe ghi đủ
  JSON).** Chữ ký đợt 156 (2 wedge liên tiếp, fetch
  writePartial timeout 30 s) không xuất hiện. T4-165 tiếp tục
  theo dõi, ghi nhận nếu tái diễn; chưa mở điều tra riêng
  (quyết (j) đợt 156 giữ nguyên). Câu hỏi đợt 156 §7(c) (wedge
  có tính là "kẹt" cho chuỗi "P3 không kẹt" của T8 không) VẪN
  MỞ — đợt này không có wedge mới nên không thêm dữ kiện.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) ĐÃ ÁP DỤNG
  THÀNH CÔNG — giữ làm quy tắc đứng, kèm bổ sung:**
  pre-flight PASS phần setup, F-158-T4-1/2 không lặp lại,
  attempt2-0c8a94aa ĐẠT (ngân sách dùng 2/3 theo attempt-done).
  **Bổ sung từ đợt này (F-164-T4-1):** pre-flight phải grep
  `W=` + số đợt cũ trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` TRƯỚC khi mở poller (W phải trỏ đúng
  thư mục đợt hiện tại, 0 hit số đợt cũ); copy-forward từ nay
  grep `round16[0-9]` trong MỌI script làm việc, không chỉ
  script đổi tên. T4-165 áp dụng checklist này.
- **(e) lag≥+5f (b) = 0 occurrence cả 3 attempt (F-164-T4-4):
  SẠCH sau đợt 162 tái diễn 16 occ.** Đây là số (a)/(b), không
  phải (c2); không dùng làm verdict. T10/T8 đối chiếu xem đợt
  162 có phải nhiễu một lần không; T4 không mở điều tra riêng.
- **(f) RAM SẬP <500 MB TÁI DIỄN (F-164-T4-4):** 6/88 poll
  instance 3 (boot #68), min 450 MB — lần đầu kể từ đợt 161.
  Chuỗi "0 poll <500 MB" đợt 162–163 đứt. RAM ≥1024 chỉ 14/88
  poll instance 3; RAM là nguyên nhân chặn cửa chính trên boot
  #68. Ghi nhận để T9-164 đối chiếu headroom/balloon; T4 không
  đổi ngưỡng gate A RAM.
- **(g) ĐIỂM MÙ LIVE-DIAG F-158-T8-4 (quyết (u) đợt 158) —
  GIỚI HẠN ĐỨNG, CHƯA BỔ SUNG KIỂM "NỘI DUNG TƯƠI".**
  HB128 heartbeat làm tươi log mtime nên live-diag dựa trên
  mtime có thể mù (live-diag 0/2 ở 85m4). Đợt này **không có
  kẹt nào** (0 wedge, probe chạy sạch 20/20 cả 3 attempt) nên
  live-diag không được thử thách — không có dữ kiện mới về
  việc nó bắt được hay không bắt được kẹt. Ghi nhận làm giới
  hạn đứng; không bổ sung kiểm "nội dung tươi" theo quyết (u).
- **(h) HELPER distinct-seq ĐỌC SỔ — T4-165 chỉ cần chạy
  helper với stall + c2coverage của attempt hợp lệ; KHÔNG kiểm
  tay nữa.** Sổ nằm ở `hidden_files/round164-t4/
  distinct-seq-ledger.json` (as-of 164: 71/74 distinct, occ
  76/84) — T4-165 copy-forward sổ này (cùng thư mục làm việc)
  và chạy helper như §6. Lưu ý: helper ghi sổ mới ra file
  riêng, không sửa sổ gốc tại chỗ — T4-165 kiểm tra rồi mới
  thăng cấp. **LƯU Ý COPY-FORWARD:** 2 file `t4-attempt-inner.sh`
  / `check-classb-t4.sh` đợt này ĐÃ VÁ W — T4-165 copy từ bản
  làm việc đợt 164 (không copy từ round163-t4) và kiểm W bằng
  pre-flight mới (xem (d)).
- **(i) Các nợ đứng khác giữ nguyên từ đợt 163 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#94?/#95? giao T2 (mù #88?
  MỞ, #94? (#62) MỞ, #95? (#63) MỞ theo quyết (b) đợt 163);
  birefnet 0 thử (lần thứ 17 liên tiếp — đợt này không thử);
  u2net là fallback chính thức; kết cục run 163 thuộc T7-164;
  reboot #67/#68 ỨNG VIÊN chưa xác nhận (T0-164/T2-164);
  POSTBOOT_PASS #67 ĐÃ CÓ (T5-164, 17:54:38Z — xem §3);
  **POSTBOOT_PASS #68 CHƯA CÓ (T5-164 sở hữu — kiểm tra lúc
  mở đợt 165)**; **replay tự nhiên CHẠY ĐẦY ĐỦ trên boot #67**
  (dpkg 1545 dòng) và **CÓ CHẠY trên boot #68** (dpkg 2 →
  1545, check-only exit 0 từ poll #18 instance 3 — chỉ thiếu
  cờ T5 xác nhận).
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate mở 18:00:10Z
  (poll #25, attempt1 — KHÔNG hợp lệ) + 18:04:37Z (poll #27,
  attempt2-f1d4ce1a — BỊ REBOOT GIẾT) + 19:16:46Z (poll #88,
  attempt2-0c8a94aa — ĐẠT) → **GATE cho chuỗi FULL PASS ĐẠT
  từ phía T4** (có lượt yên hợp lệ #33 trên boot 0c8a94aa).
  T8 tự quyết thủ tục (i) sau waiter hết hạn / boot mới; T4
  chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-164.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-164.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-21T17:41:55Z - 2026-11-21T17:41:55Z, boot=f1d4ce1a
   RAM min=2508 max=2508 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 0/1 load5<2: 0/1 blockers>0: 0 apt>0: 1
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 27 poll, 2026-11-21T17:41:57Z - 2026-11-21T18:04:37Z, boot=f1d4ce1a
   RAM min=1329 max=2800 >=1024: 27/27 500-1023: 0/27 <500: 0/27
   load1<2: 9/27 load5<2: 2/27 blockers>0: 0 apt>0: 16
   gate0: T4-check-only=5, T5=10, khong-dat=12
   lock: khong=27
   dpkg 2->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 3: 88 poll, 2026-11-21T18:11:09Z - 2026-11-21T19:16:46Z, boot=0c8a94aa
   RAM min=450 max=2543 >=1024: 14/88 500-1023: 68/88 <500: 6/88
   load1<2: 81/88 load5<2: 82/88 blockers>0: 0 apt>0: 18
   gate0: T4-check-only=72, khong-dat=16
   lock: stale-boot=88
   dpkg 2->1545
   chuoi RAM<500 dai nhat: 1 poll
-- TONG poll that: 116
-- RAM toan phien: min=450 max=2800 >=1024: 42/116 <500: 6/116
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 12/116
   gan-mo? #25 2026-11-21T18:00:10Z boot=f1d4ce1a RAM=1844 L1=0.67 L5=1.90 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #27 2026-11-21T18:04:37Z boot=f1d4ce1a RAM=1788 L1=0.76 L5=1.83 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #5 2026-11-21T18:14:10Z boot=0c8a94aa RAM=1899 L1=1.38 L5=1.92 blk=0 apt=1 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #6 2026-11-21T18:14:55Z boot=0c8a94aa RAM=1738 L1=1.27 L5=1.82 blk=0 apt=1 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #7 2026-11-21T18:15:40Z boot=0c8a94aa RAM=1612 L1=1.27 L5=1.74 blk=0 apt=1 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #8 2026-11-21T18:16:25Z boot=0c8a94aa RAM=1608 L1=1.79 L5=1.78 blk=0 apt=1 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #9 2026-11-21T18:17:11Z boot=0c8a94aa RAM=1462 L1=1.76 L5=1.78 blk=0 apt=1 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #10 2026-11-21T18:17:56Z boot=0c8a94aa RAM=1391 L1=1.43 L5=1.68 blk=0 apt=1 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #11 2026-11-21T18:18:41Z boot=0c8a94aa RAM=1258 L1=1.20 L5=1.58 blk=0 apt=1 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #12 2026-11-21T18:19:26Z boot=0c8a94aa RAM=1134 L1=1.17 L5=1.52 blk=0 apt=1 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #13 2026-11-21T18:20:12Z boot=0c8a94aa RAM=1049 L1=1.08 L5=1.44 blk=0 apt=1 gate0=khong-dat lock=stale-boot t5=cu(mtime-cu)
   gan-mo? #88 2026-11-21T19:16:46Z boot=0c8a94aa RAM=1136 L1=0.91 L5=0.55 blk=0 apt=0 gate0=T4-check-only(pb_age=3) lock=stale-boot t5=cu(mtime-cu)
-- boot 0c8a94aa: 88 poll; RAM>=1024 lan cuoi: 2026-11-21T19:16:46Z #88; RAM<1024 lan dau: 2026-11-21T18:20:57Z #14 RAM=942
-- boot f1d4ce1a: 28 poll; RAM>=1024 lan cuoi: 2026-11-21T18:04:37Z #27; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 29 luot hop le): P1 109/112 P2 103/103 P3-A1 93/112 P3' 76/84 occ = 71/74 distinct-seq P7 63/63
-- chuoi median 29 luot: n=29 mean=48,1 min=39,0 max=60,0 vuot-60: 0
```
