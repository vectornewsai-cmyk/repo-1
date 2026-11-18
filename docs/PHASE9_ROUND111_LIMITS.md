# PHASE9_ROUND111_LIMITS — Verify độc lập đợt 111 (M1–M8 + cây gộp)

> Luồng M9 (verify), đợt 111, lượt cron 12:35 +07 14/11/2026. Bắt đầu 05:38Z,
> xong 07:06Z 14/11/2026. Boot trong lúc đo #40 (05:16:36Z,
> `73316ed9…`); reboot #41 xảy ra 06:53:26Z (`35099846…`, gap #40→#41 =
> 1h36'50") — SAU khi 8/8 luồng xong (06:49:11Z), TRONG lúc M9 kiểm cây
> gộp; không luồng nào bị giết. KHÔNG push. KHÔNG release/tag. KHÔNG sửa
> production (chỉ M1 sửa đợt này).
> Phương pháp: tính lại headline từng luồng từ dữ liệu thô bằng code riêng
> (script `recount-m9-*.py` trong `hidden_files/round111-m9/`), không tin mù
> LIMITS; chạy lại toàn bộ suite + O8 trên cây gộp; đếm batch từ đĩa.
> File verify: `hidden_files/round111-m9/` (recount-m9-m1/m2/m3/m4/m7,
> recount-m9-m5-tickcost.txt, `round111-m9-suites.log`,
> `round111-m9-o8.log`, `poll-m9.log`, `m9-notes.md`).

## 0. Kết luận ngắn

| Luồng | Verdict | Headline đã xác nhận |
|---|---|---|
| M1 tail-ceiling/E4 | **KHỚP kèm đính chính** | Fix endedClosed đã vào production (preview.tsx `c4198206…`); A/B 2+2 = **1 CAP/157 ticks** (m1f4, age 5197 ms) → **E4 KHÔNG ĐÓNG** theo prereg; Fisher vs K1-on p=0,4297, vs L1-fix p=1,0000; pause-deadlock đã chết (0 paused, rearm cứu 3/4 đuôi); CAP còn lại là cơ chế mới (cuộc đua tail-ceiling 5000 ms vs restart-ended seek ở biên cuối clip); unit test 84 passed (tự chạy lại) |
| M2 2 MiB preload+ring8 | **KHỚP** | Ring 8 MiB: R8 **0/0 spliced** cả 2 lượt (flood 2,76/3,28); Fisher R8 vs gộp ring-4M 6/8 p=0,1333; vs M2 ring-4 4/6 p=0,4286; L2-A recount khớp 100% (14 spliced, offset +4.194.304 đã xác nhận); PT r2 burst 234 pull, seekedOk FALSE, fallback http |
| M3 Zombie lượt 3 | **KHỚP kèm đính chính** | 3/3 lượt TRONG DẢI 100%; dạng mạnh **1/3 lượt** (R2, 4 gap freeze sạch qua biên 6/18/36/42 s); gộp toàn chuỗi **4/12 lượt**; CDP **0/3 lượt trong dải** → điều kiện chữ prereg §6 THỎA MÃN, đề xuất BỎ bar CDP làm bar song song; stall 5 s 0/3 (gộp L3+M3 0/5); dial độc lập THẤT BẠI với bằng chứng sạch (E4 yes×10: 2,36→1,02) |
| M4 EPERM probe #30 + mù #29 | **KHỚP kèm đính chính** | Probe #30 ok=2 fail=0 (05:38:51Z, boot #40); mù #29 **KHÔNG ĐÓNG HOÀN TOÀN** — lỗ thật **13'33"** (04:56:10Z→05:09:43Z, birth-time exec-log U4), khe 79 s không loại trừ được; gap stats CERT22/FULL34 khớp 100% |
| M5 Ghost pixel | **KHỚP kèm đính chính nhỏ** | Fixture không tuần hoàn PASS (min pairwise 6); (b) unique-match **648/648, 484/484, 314/314**, nomatch 0; "capture lag max 16f" của L7 là **alias** — trễ dương thật max **+4f**; decode lag tới −58f; stale canvas sau seek (label 0 / pixels 67–76); nhãn ghost nhiễu là cấu trúc (đúng tuyệt đối skp=0 chỉ 25,5%/42,6%/41,2%); đề xuất ngưỡng WebKit **≤60 ms** (median 50→86→167); F6' vẫn đứng 61/61, 72/72, 55/55 |
| M6 ENOSPC phần C | **KHỚP** | Vite thường **1586 watch** cả 2 lượt; vite ignored **0 watch**; phần C: thường 4/4 V2 ≤2 s, ignored 4/4 STALE@32s; restart 10/10 phục vụ mới; headroom 1655→1647, trần 63747 |
| M7 Điểm gãy tải | **KHỚP kèm đính chính** | Điểm gãy **VẪN MỞ — và lần này không có cả điểm GIỮ**: 4 lượt blur đều TRUNG-GIAN (sampled load1 0,93/7,86/21,16/46,8; tick 17/36/30/8, tất cả <50); **r69 control GIỮ, 282 tick, 100% trong ±1** → đói tick là do tải, không phải build; presented lệch DƯƠNG (trung vị +2/0/+1/0), dạng gãy "trễ âm" không tái hiện; dial hog không điều khiển được load1; gate v2 không suy ra GIỮ; 0 lỗi CDP/project-load; H-alt không tái hiện lần 3; E6 vẫn ĐÃ ĐÓNG (20/20) |
| M8 Infra postboot+vite lock | **KHỚP kèm đính chính** | Postboot-check PASS 5/5 (05:39Z + 05:53Z); WebKit launch 3/3 (3422/931/2592 ms, v27.2); plugin GST 269=269; vite-test A/B **0 watch** (ready 318/157 ms, kill-vite OK); headroom 1640<1700 nên ORIG bỏ qua; stale-recovery đã được M9 kiểm lại trực tiếp trên script hiện tại: fake-stale PASS, dir-trống-già PASS (lúc yên), nhả sai/đúng thread đúng |

**Cây gộp cuối đợt (M9 tự chạy, boot #41, 06:59–07:06Z): tsc web 0, tsc
desktop 0, vite build PASS (6,18 s), 27/27 suite exit 0
(playheadHold90R2 84 passed), O8 21/21 Chromium + 21/21 WebKit.**
`preview.tsx` md5 `c4198206cb916c0f1c6d8996330335a1` suốt đợt (M1-fix) —
không đổi trong lúc verify.

**Batch đợt 111 (đếm từ đĩa, gồm batch M9 này): 9 file / 20 entry /
20 file duy nhất, 0 binary, 0 workflow.** 10 file >37.768 byte cần
`ENABLE_PRIVSEP=0` khi push (xem §9). File oversize đợt 109
`benchmarks/results/webkit-blob-flaky-96x3.json` (6.370.678 B) vẫn chờ.

## 0.1 Đính chính chung — sàn gap reboot (M8 viết sai; nhắc lại L9 §0.1)

M8 §2.1 viết gap #39→#40 "không phá sàn mới 26'03"". **SAI.** Khoảng gap
đã chứng nhận vẫn là **[19'07", 3h14'08"]** (sàn 19'07" = gap #32→#33,
đợt 106; M4 đợt này tính lại CERT n=22 + FULL n=34, khớp). 26'03" >
19'07" nên **không phá sàn, sàn không đổi** — 26'03" không phải sàn và
chưa từng là sàn. Đây là lỗi thứ hai liên tiếp về sàn (L5/L7/L8 đợt 110
đã viết sai tương tự, L9 đã đính chính ở §0.1).

Reboot trong đợt 111: #40 05:16:36Z (gap #39→#40 = 2h25'48", trong khoảng
đã chứng nhận, không phá sàn), #41 06:53:26Z (gap #40→#41 = 1h36'50",
cũng trong khoảng, không phá sàn). #41 xảy ra sau khi 8/8 luồng xong
(06:49:11Z) nên không cắt luồng nào; nó cắt poller M9 (POLL#14 là cuối)
và 1 exec sleep của M9 (SIGTERM ~06:53Z). M9 kiểm cây gộp trên boot #41
sau khi chạy postboot-check PASS.

## 1. M1 — tail-ceiling/E4: KHỚP kèm đính chính (verdict: KHÔNG ĐÓNG E4)

### 1.1 Tính lại từ dữ liệu thô (recount-m9-m1.py, code riêng)

A/B 2+2 từ `probe-results.json` thô — tất cả khớp M1 §3:

| Lượt | GOP | Build | ticks | tails | CAP | rate | wall | frzTail |
|---|---|---|---|---|---|---|---|---|
| m1f1 | 250 | H (RAM 2245488, load1 37,23) | 42 | 2 | 0 | 0,411 | 11604 | 468 |
| m1f2 | 30 | H (RAM 2298452, load1 22,08) | 40 | 1 | 0 | 0,461 | 11498 | 674 |
| m1f3 | 250 | J (RAM 1993536, load1 12,60) | 38 | 1 | 0 | 0,401 | 12976 | 405 |
| m1f4 | 30 | J (RAM 2061808, load1 8,17) | 37 | 1 | **1 [5197]** | 0,501 | 10907 | 0 |

Gộp 157 ticks, 5 tails, **1 CAP/157 = 0,0064**. Fisher vs K1-on
p=0,4297; vs L1-fix p=1,0000; Poisson P(0|K1-on)=0,0363, P(≤1)=0,1566,
P(0|L1-fix)=0,4160 — khớp M1. Prereg 05:50:37Z trước lượt đo đầu
06:18:52Z. md5 khớp: preview.tsx `c4198206…`, playheadHold90R2.ts
`6721b982…`, test `d535e814…`, probe `18f4e574…`. Unit test tự chạy lại:
**84 passed**.

### 1.2 Cơ chế (tính lại từng tick)

- l1f3 tái hiện từ JSON đợt 110: tick 15 t=4331 burst ct 0,5667→1,3211;
  tick 16–37 đuôi mở adv=0, ct→6,0, ph→5,23, tailBursts 0→8, gate 0→12;
  tick 37 t=9108 ct=6,0 tuổi 4777 ms; tick 38 t=9317 ct 6,0→5,5;
  tick 39 t=9522 resyncsV 1→2, restartV 0→1; tick 40 t=9708 đuôi null
  tuổi 5377 → CAP. Khớp M1 §1.
- m1f4 tick-by-tick khớp M1 §4.2: đuôi mở t=3807; ct 1,2→5,8667 tới
  tick 26 (t=9004, tuổi 5197); tick 23 adv=1 rồi reset tick 24; tick 27
  (t=9401) đuôi null tuổi 5594; tick 28–36 ct đóng băng 5,9667,
  ended=False suốt, restartV=0 — freeze 1 frame trước cuối clip, cơ chế
  MỚI (khác l1f3: không có restart, không có resync).
- Mechanism khớp: m1f3 age 5204 rearm, 10 mẫu, 0 paused, render 1/11;
  m1f2 age 5104 rearm, 14 mẫu, 0 paused, 7/15; m1f4 age 5197 không
  rearm, 10 mẫu, 0 paused, 0/11. `ended`=true: 0 tick cả 4 lượt; max ct
  5,6667/5,9/5,9333/5,9667; restartV cuối = 0 cả 4 lượt;
  tailEndedClosed=0 mọi tick. Pause-deadlock đã chết (0 paused).
- Fix code đã đọc: `PLAYHEAD_TAIL_ENDED_EPS_S = 0.1`, input
  `ended`/`duration`, cờ `endedClosed`, đóng-vì-ended trước trần 5000 ms;
  preview.tsx truyền `ended: tailElVideo.ended, duration:
  tailElVideo.duration`, đếm `resumeTailEndedClosed111M1++`, hook
  `__vcutTailEndedClosed111M1` công bố + dọn khi unmount. Nhánh mới chưa
  từng chạy live (0 ended-close trong 4 lượt A/B) — khả năng cao không
  ảnh hưởng các luồng khác đo cùng đợt (M3/M5/M7 đều chạy trên cùng cây
  sau fix, xem §1.3).

### 1.3 Đính chính cho M1 (nhỏ, không đổi verdict)

1. `tsc.log` của M1 rỗng 0 byte (không ghi exit code) — M9 đã kiểm lại
   bằng tsc ở cây gộp (§9.1: tsc web 0).
2. "ended đã đúng ở tick 37/38 l1f3" là suy luận từ restartV 0→1 +
   ct=6,0 (probe cũ không lấy mẫu `ended` — ended=None trong JSON),
   không phải quan sát trực tiếp.
3. Tải nền lượt A/B rất cao (load1 đầu lượt 37,23/22,08/12,60/8,17) vì
   9 luồng chạy song song — ghi rõ, không tách.

## 2. M2 — 2 MiB preload + ring 8 MiB: KHỚP

Recount riêng (`recount-m9-m2.py`) từ pull log thô: 10/10 run khớp bảng
§2 (EXACT/PULL/spliced/flood/queue2/frames/finalCt). CTL r1 1240/1242
sạch flood 3,19; CTL r2 1300/1318, 16 spliced +4.194.304, flood 5,49;
P0 r1/r2 2+12 spliced, preloadWaitMs 20070/20032, preloadFull FALSE;
P r1 14 spliced ms 806–808, r2 sạch; **R8 0/0 spliced, flood 2,76/3,28,
last pull 43991/35515**; PT r1 2 spliced ms 23423 req_off 0, PT r2 burst
234 pull ms 40577–40603, 117 req_off ×2, seekedOk FALSE, errEvents
t=36,59, finalSrcKind http (fallback). Fisher R8 vs gộp ring-4M 6/8
p=0,1333; vs M2 ring-4 4/6 p=0,4286. L2-A recount khớp 100%
(Lc8-l2C8LAG r1/r2: 14 spliced, EXACT 602/740, flood 5,25/5,33,
first/last ms 11916/36104 và 11714/39352, NODATA 4/5); L2-F r2 khớp (8
SPL+2M, EXACT 807, flood 7,53). media.ts md5 `2c384ed1…`, shim
`b208e8de…` khớp. Prereg 05:42:52Z trước run đầu 05:49:34Z. "Readback"
R8 CÓ thật — trong pull log qua dòng shim `L2Q2... readback=2097152
ring-buffer-max-size=8388608 rb-readback=8388608 OK` (cả 2 run) +
`J2Q2SET orig=2097152 new=8388608`. Caveat duy nhất: bar M2PT "ghi
trước khi chạy" chỉ khớp thứ tự dòng trong progress.md, không có
timestamp độc lập — không phải lỗi của M2.

## 3. M3 — Zombie lượt 3: KHỚP kèm đính chính

### 3.1 Tính lại từ dữ liệu thô (recount-m9-m3.py, tái lập đúng logic analyzer rev3.1 §3/§4)

| Lượt | gaps >300 ms | đạt bar | trusted | dạng mạnh (distinct≥2) | bracket ≤300 | CDP | load5 median (snap) | drift |
|---|---|---|---|---|---|---|---|---|
| R1 | 1 | 0 | 0 | 0 | 0 | 0/3 | 7,70 (16/16) | 23 |
| R2 | 44 | 11 | 10 | **4** | 0 | 0/62 | 4,25 (16/16) | 23 |
| R3 | 5 | 0 | 0 | 0 | 0 | 0/12 | 4,94 (15/15) | 23 |

0 gap >1000 ms cả 3 lượt (stall 0). 4 gap mạnh R2 khớp từng số: 425 ms
[7179,7604] ph 5,767→6,233 skips=1 distinct=2 bracket 703 inside
[5,933,6,133,6,233,6,233]; 608 ms [20082,20689] ph 17,733→18,333
distinct=2 bracket 839; 430 ms [40176,40606] ph 35,433→36,267
distinct=3 bracket 861; 594 ms [46806,47400] ph 41,467→42,233
distinct=2 bracket 868. Gap 923 ms distinct=2 nhưng skips=None nên
loại đúng. md5 c4198206→c4198206, mtimeChanged=False cả 3 lượt.
draws/s: R1 29,4 / R2 9,6 / R3 21,2 (tính lại từ drawsTotal deltas).
Prereg mtime 05:41:18Z (trước load-test 05:42:09Z). Probe diff vs
probe110l3: chỉ đổi đường dẫn scratch/CFG_DIR/tên driver + tiêu đề;
node --check OK.

### 3.2 Gộp chuỗi + CDP (đối chiếu LIMITS J3/K3/L3)

- Tần suất gộp: J3 0/4 + K3 1/3 + L3 2/2 + M3 1/3 = **4/12 lượt**;
  gap theo chữ 1+4+4=9, freeze-only 1+3+4=**8 gap**; bracket J3 0 gap
  cả 3 lượt M3 (nhỏ nhất 401 ms R1).
- 7/8 gap freeze sạch straddle biên clip 3 s (L3: 12 s, 36 s, 36 s;
  M3 R2: 6/18/36/42 s; ngoại lệ duy nhất K3 R2 ph 69,17→70,00 không
  qua biên).
- CDP gộp: dải chặt 0/7 (K3 0/3 + L3 0/1 + M3 0/3), mọi lượt 0/8 (K3
  0/3 + L3 0/2 + M3 0/3). Điều kiện chữ prereg §6 (0/3 lượt trong dải
  đợt này) **thỏa mãn** — đề xuất BỎ bar CDP làm bar song song có cơ sở
  (giữ CDP làm công cụ giám định từng gap: R2 corroborate spread
  44/44).
- Stall 5 s biên 60 s: 0/3 lượt (gộp L3+M3 0/5); stall giữa clip kiểu
  c15: 0/3 (gộp 1/5).

### 3.3 Đính chính cho M3 (load-test — kết luận chính không đổi)

Đếm lại 63 mẫu từ `load-test-m3.txt` (cả 2 file .txt/.stdout giống nhau):

1. **C:** load1 cuối **7,22** không phải 7,28; load5 **2,09→3,92** không
   phải 1,04→3,99 (1,04 là load15 của mẫu đầu). Chuỗi đầy đủ M3 trích
   thì đúng (15 giá trị, đỉnh 7,38).
2. **E1:** 6,96→**7,14** không phải 6,96→6,89 (6,89 là mẫu thứ 8 của
   E2). Verdict "phẳng, không đọc được" vẫn ~đứng (net +0,18 trên cao
   nguyên).
3. **E2:** 6,94→**6,93** không phải 6,94→6,03 (6,03 không có trong dữ
   liệu; E2 lên tới 9,05 giữa pha rồi về 6,93 — gần như phẳng,
   "SUY NHẸ" nói quá). Verdict "không tăng" vẫn đứng.
4. E3 5,73→2,35 ✓, E4 2,36→1,02 ✓, D 0,94→1,76 max 2,65,
   procs_blocked {0:5, 1:2, 2:1, 6:1} ✓.
5. **Lỗi đo hogN/hogCPU%:** "LUÔN = 0" chỉ đúng một nửa — hogN luôn 0
   ✓ (pattern pgrep `while \(True\)` không khớp cmdline python thật),
   nhưng hogCPU% KHÁC 0 ở 4/6 pha (C 99–134, E3 88–102, E4 107–141,
   D 86–180; chỉ E1/E2 python = 0,0). Giá trị yes-phase còn củng cố
   throttle (~29%/hog lúc E3: 3 hog ≈ 88–102% tổng).

## 4. M4 — EPERM probe #30 + mù #29: KHỚP kèm đính chính

- Probe v2 log 82 dòng: probe#29 02:40:36Z, DEAD 05:38:51Z age 10695s,
  boot 2f001e9c→73316ed9 uptime 05:16:36, probe#30 ok=2 fail=0.
  Heartbeat n=30 ts 05:38:51Z boot 73316ed9 pid 6804. Probe-notes:
  MemAvailable 1347128/1345352 kB, DEAD/STALE exit 1, once probe#30
  exit 0, status ALIVE n=30. **Probe #30 KHỚP.**
- Gap stats recount riêng: CERT22 mean 1h52'05", median 1h59'16", p10
  1h08'41", p90 2h57'18", sd 43'58"; FULL34 mean 1h59'51", median
  1h59'16", p10 38'06", p90 3h05'01", sd 1h04'16"; counts 18/5/6/2 —
  khớp 100%.
- WFS lần 17 khớp (NEWSTD 595/178, R7b 620/195, copies 25/17,
  595+25=620, +18/+4 phân rã đúng; scope 2797 vs 2782, +16/−1, file mất
  `apps/web/vite.config.l7-temp.ts`). Wave scan khớp (99 log, 0 "vẫn
  bật", 0 "CẢNH BÁO", 0 "Operation not permitted", 8 "đã tắt").
  Poller L9 khớp (POLL#0–#16, 02:52:22Z→04:12:24Z). Blind 464 mốc
  mtime / 306 giây nguyên khớp.
- **Đính chính quan trọng (M9 tự tìm):** birth-time của exec-log U4
  `proc_140e9b8da275.log` = 05:09:43.656Z, modify 05:13:57Z — exec
  verify của parent BẮT ĐẦU trong lỗ 1 → lỗ thật còn **13'33"
  (04:56:10Z→05:09:43Z)**, không phải 14'31". Khe 79 s
  [04:56:10Z, 04:57:29Z] KHÔNG đổi → verdict **mù #29 KHÔNG ĐÓNG HOÀN
  TOÀN** vẫn đứng. M4 viết "0 file có mtime trong lỗ" — đúng về mtime
  nhưng bỏ sót tín hiệu birth-time/dir-mtime. `/tmp/.ICE-unix` mtime
  05:16:47Z trong lỗ 2 là artifact boot #40, củng cố giờ #40 (không
  đổi kết luận lỗ 2 đã đóng bằng uptime + sàn).

## 5. M5 — Ghost pixel: KHỚP kèm đính chính nhỏ

### 5.1 Fixture + (b) unique-match

- Verify-fixture chạy lại **PASS**: (i) min pairwise Hamming 6 tại
  frames (16,45); (ii) decode-vs-src flips max 0 mean 0,00; (iii)
  frame kề min 28 median 36; bit-1 min 17/max 27/median 22. Mp4
  140.828 B, 90 frame GT, seed 20261125.
- Labellag: chạy lại analyzer trên 3 JSON thô → diff EXACT với file
  đã lưu cả 3 lượt. §2 khớp toàn bộ: (b) unique n **648/648, 484/484,
  314/314**, nomatch 0; N1 skp=1 med 0 p90 2 max +3, skp=0 med 1 p90 3
  max +4, min −15; N2 skp=1 med 0 p90 0 max +68, skp=0 med 0 p90 2 max
  +68, min −14; N3 skp=1 med 0 p90 76 max +76, skp=0 med 0 p90 1 max
  +76, min −58; (c2) 0/4/0 (N1 4 ca lag 1f đúng seq 204/254/386/436).
  Histogram §2.3 kiểm tổng: N1 648 ✓, N2 484 ✓, N3 314 ✓.
- **"Capture lag max 16f" của L7 là alias:** trễ dương thật (loại trừ
  ghost stale sau seek) max +4f (133 ms) ở cả 3 lượt; (c2) sụp từ
  n=7/64 (L7) xuống 0/4/0; cụm seq 326–327 KHÔNG tái diễn.
- Hai cơ chế trễ thật: (a) decode lag — nhãn chạy trước pixels, tới
  −58f (1,9 s) lúc tải nặng; (b) stale canvas sau seek — label 0 /
  pixels 67–76, tồn tại 4–8 tick, tăng theo tải (N1: 0 ghost; N2: 1;
  N3: 3). N2 duplicate ghosts đếm từ JSON thô: **106/343 tick** có
  duplicate labelMs ✓.

### 5.2 F6' + nhãn ghost + ngưỡng WebKit

- F6' bar: N1 61/61, N2 72/72, N3 55/55 (1)+(2) 100%, 0 ứng viên,
  (3) alias 0/0/0 — khớp §3. (4)/(4b) khớp §4.1 từng số. Tỉ lệ đúng
  tuyệt đối (clean / mọi occurrence): N1 97/122 (79,5%) + 134/526
  (25,5%); N2 122/144 (84,7%) + 145/340 (42,6%); N3 85/110 (77,3%) +
  84/204 (41,2%). Flip analyzer cross-check độc lập: ALL-OCCURRENCES
  clean 231/648, 267/484, 169/314 — khớp đúng tổng clean labellag.
  41,1% của L7 bị alias thổi phồng (clean ⟺ sai số là bội số của 4
  trên sọc tuần hoàn) — đính chính đúng.
- TickCost (chạy lại analyzer trên 3 JSON): N1 median **50,0** p90
  80,1 max 115, post-flip 48,0; N2 **86,0** / 105,0 / 271, post-flip
  88,0; N3 **167,0** / 253,2 / 520, post-flip 133,0; tBlend gap
  92/122/279; BlendTick/pass 22,2/17,1/10,2; rAF/pass 34/27/20. L7
  40,5 / K7 66,0 đã đối chiếu LIMITS gốc — khớp. Đề xuất ngưỡng
  **≤60 ms** tuân đúng luật prereg (N1 50 < 60 ≤ N2 86; p90 ≤90 cũng
  tách đúng; caveat n=5, N1 chưa thật yên — M5 đã ghi rõ).
- §6 (run-webkit-n*.log): N1 pause gStd 115,6/114,6/116,6; trailMax
  7, trailFramesGt0 158/75/55; edgeLMed 2,2/2,3/1,1, edgeRMed
  0,7/1,2/0,6; edgeLMax 208,5/141,2/91,6, edgeRMax 237,0/228,8/255,6;
  gStd spread drawn nGroups 71/25/9, nSkipped 272/183/141, spreadMed
  8,9/5,0/7,9, spreadMax 45,6/42,8/34,8 — khớp hết.
- Chain log: N1 lần 1 acquire 06:21:07Z rồi crash `port: unbound
  variable` dòng 246 (lock script mtime 06:06:18Z, M8 sửa giữa chừng)
  → message "TIMEOUT 1500s" là sai (crash, không phải timeout); N1
  lần 2 probe_exit=1 (expectCx crash sau 20 pass); N1 lần 3 (start
  06:31:53Z load 0,65/3,58, end 06:33:24Z load 4,06/4,02, exit 0); N2
  start 06:36:13Z 6,49/5,34 exit 0; N3 start 06:38:20Z 1,21/3,75 exit 0.
  md5 c4198206→c4198206 mọi lượt; kill-vite OK mọi lượt. RAM 650 MB
  lúc N1 lần 1 bắt đầu ✓. Prereg mtime 05:52:33Z (trước lượt đo đầu).
  P1 không chạy (lý do §9.5 — hết giờ + giá trị biên thấp).

### 5.3 Đính chính cho M5 (nhỏ)

1. §0.1: 6 marker M1 ở các dòng 6252, 6253, 6459, 6726, 6756, 7990 —
   không phải tất cả trong "dòng 6252–6728" (6756, 7990 nằm ngoài;
   7990 là dòng dọn hook lúc unmount). Nội dung vẫn đúng: tất cả trong
   code tail/resume + hook cleanup, không vị trí nào trong hàm
   ghost/ring/snapshot.
2. §6: "Pause baseline cũng đã có trail=2 (lượt N1 lần 2 hỏng)" —
   trail_left_n=2 ở pause t=1.5 có trong run-webkit-n1.log của lượt N1
   THÀNH CÔNG (lần 3), không riêng lần 2 hỏng. (Nit, không ảnh hưởng
   số §6.)
3. Lưu ý: text "LƯU Ý (a)/(b)" trong output labellag vẫn là text cũ L7
   về sọc tuần hoàn — M5 đã tự ghi rõ ở §2.3. N2 histogram §2.3 viết
   tắt "{−14:15, …}" nhưng tổng kiểm được.

## 6. M6 — ENOSPC phần C: KHỚP

Đọc `m6-measure.log`: chỉ lần chạy 05:44:53–05:50:04Z hợp lệ (2 lần
trước vô hiệu: `mode: unbound variable` 05:41:20Z; bug `port_code`
"000000" 05:43:14Z — toàn bộ ABORTED). A/B: vite thường 1586 watch cả
2 lượt (total 1600, page 1291B/200 lượt 1; lượt 2 page 0B/000 — dị
thường đã ghi), vite ignored 0 watch (total 14, page 1093B/200). Phần
C: thường 4/4 V2 ≤2 s (app 3/3 + dep 1/1), ignored 4/4 STALE@32s; file
mới + index.html 0 s cả hai; restart 10/10 phục vụ mới. Headroom:
1655/1655 trước vite, 1647/1647 sau, trần 63747. Vite ready 1298/249 ms
(thường), 201/1600 ms (ignored). Không đính chính số liệu.

## 7. M7 — Điểm gãy tải: KHỚP kèm đính chính

### 7.1 Tính lại từ dữ liệu thô (recount-m9-m7.py)

| Lượt | sampled load1 | n tick | med off | trong ±1 | pump | caps | gateV2 | phân loại |
|---|---|---|---|---|---|---|---|---|
| r64 noblur | 3,27 (n=2) | 0 | — | — | 0 | 76 | — | baseline |
| r65 | 0,93 (n=4) | 17 | +2 | 6/17 (35,3%) | 22 | 23 | — | TRUNG-GIAN |
| r66 | 7,86 (n=4) | 36 | 0 | 28/36 (77,8%) | 41 | 43 | True | TRUNG-GIAN |
| r67 | 21,16 (n=4) | 30 | +1 | 20/30 (66,7%) | 33 | 35 | True | TRUNG-GIAN |
| r68 | 46,8 (n=7) | 8 | 0 | 6/8 (75,0%) | 16 | 16 | True | TRUNG-GIAN |
| **r69 control** | **1,87 (n=4)** | **282** | **0** | **282/282 (100%)** | **208** | **200** | — | **GIỮ** |

Tất cả khớp bảng §1 + §7 (offs từng tick đã đối chiếu: r65
[0,0,4,5,2,1,2,2,0,1,2,3,8,3,1,6,2]; r68 [0,0,0,0,0,-1,3,3]).
md5 c4198206→c4198206, mtimeChanged=False, pageErrs=[] mọi lượt.
stallBlocks=[] mọi lượt (0 lỗi CDP/project-load). Dial:
r65 ĐẠT 20 s (2,21); r66 KHÔNG ĐẠT 300 s (10,39 lúc 06:01:51Z), swing
0,16 (05:58:39) → 7,37 (05:58:51) → 28,14 (06:00:06); r67 KHÔNG ĐẠT
300 s (24,10); r68 ĐẠT 290 s (22,86), phát 24,55 → cuối 40,39.
Prereg mtime 05:41:08Z (trước driver 05:42:35Z); addendum 05:59:17Z
(đổi r69 thành control). Ngưỡng 50 tick ở prereg §4 — khớp §1.
tsc.log rỗng 0 byte (cùng nit như M1); vite-build.log "built in
16.26s" khớp §8; probe md5 8cfe3b9a… khớp, node --check OK.
Baseline g 88,02: analyzer tính từ r64 (76 caps) — code dùng
chr-code-noblur-r64; nhãn in "(noblur r57, boot moi)" là stale (copy
từ script L4) — số đúng, nhãn sai. F2 gộp: r65 12/17, r66 23/36,
r67 21/30, r68 4/7 → 90 tick, 60 trong ±1 = 66,7% FAIL — khớp §5.
H-alt: g-txt n=29 (3+12+10+4), median |Δg| đều 0,058 vs H-alt 0,054,
cải thiện 0,004 < 0,010 → KHÔNG TÁI HIỆN lần 3 — khớp §5. Band A':
r66 c0 pres51 g=0,465 + r69 c2 pres51 g=0,462, cả hai Nhãn-đúng —
gộp J5+K4+L4+M7 thành **20/20 Nhãn-đúng**; E6 vẫn ĐÃ ĐÓNG.
r69 content offsets (g-analyzer chạy lại 06:45:28Z): med 0, dải
−1..+1, 282/282, ghost +0 (n=564); F2 r69 282/282 nhận diện, 282
trong ±1 — khớp §7. Kết luận "đói tick là do tải" theo đúng luật
addendum §3 (r69 ≥80 tick + GIỮ → nhánh (a)) — r69 có 282 tick + GIỮ
nên suy luận đúng luật đăng ký trước.

### 7.2 Đính chính cho M7

1. §5: "skip-stale-frame chiếm đa số ở r65 (13/22 pump bị skip)" SAI
   — đếm trực tiếp từ pump JSON: capture 13, skip-stale-frame 9 → chỉ
   9/22 (41%) bị skip, KHÔNG phải đa số; số 13 là capture, M7 đảo
   ngược. Cơ chế (skip → presented nhảy ahead, offset dương) vẫn hợp
   lý nhưng số headline sai.
2. §2: "r66 dưới bar 80% đúng 0,8 điểm phần trăm" SAI đơn vị —
   28/36=77,78%, thiếu 2,22 điểm phần trăm; 0,8 là số TICK thiếu (cần
   28,8 tick) chứ không phải điểm phần trăm.
3. §0 RAM: "freeMB tối thiểu 544 (r66), 506 (r67), 761 (r68)" trộn 3
   nguồn khác nhau: r66 544 = min sampler hog lúc dial; r67 506 = free
   lúc phát; r68 761 = AVAILABLE lúc phát (free lúc phát r68 chỉ 142).
   Thấp nhất thật: free 147 (r66 lúc phát), 142 (r68 lúc phát);
   available 962/1456/761. Không OOM — kết luận "gần OOM" vẫn đứng
   nhưng số cần ghi đúng nguồn.

## 8. M8 — Infra postboot + vite lock: KHỚP kèm đính chính

- Postboot-check1.log: PASS 5/5 (wrapper K1, libs, GST 269=debroot,
  apt 10/10, kết luận ĐỦ ĐIỀU KIỆN). Launch JSONs: o8env 3422 ms,
  clean 931 ms, headless 2592 ms; đều version 27.2, eval 2, boot
  05:16:36. Plugin GST: find -type f = 269 hệ thống = 269 debroot.
- Vite-test.log (3 lần): lần 1 acquire 05:51:26Z (owner m8 pid 12042,
  5 trường) rồi crash `label: unbound variable` dòng 53, trap nhả lock
  đúng; lần 2 (05:53:42Z) chờ lock M7, bị kill 06:05:29Z, trap KHÔNG
  nhả lock M7 (đúng); lần 3 (06:06:51Z) chờ M7→M1 (pid 28713, port
  5580, 06:18:52Z)→M5 (pid 22713, port 5184, 06:21:07Z), acquire
  06:24:19Z (pid 24954), vite A ready 318 ms total 5→5 delta 0
  vite_proc_wd 0 curl 200 kill TERM pid 36151 OK, vite B ready 157 ms
  total 5→5 delta 0 kill TERM pid 36283 OK, headroom 1640<1700 → ORIG
  bỏ qua, nhả lock 06:24:30Z. Tất cả khớp §4.
- md5 history §1.7: vite-test.log tự ghi a288feac 05:46:14Z →
  c4198206 05:53:42Z — KHỚP (có bằng chứng độc lập trong log của M8).
- Script: bash -n OK cả 2; postboot-check2.log (05:53Z) đã ghi #40 =
  05:16:36Z, script mtime 05:47:02Z (sửa giữa check1/check2) — khớp
  §2.4. vite-lock.sh hiện tại: port_serving đã sửa (dòng 91-96,
  comment ghi bug M8), owner_field hỗ trợ 2 định dạng + pid-format M3.
- **Đính chính 1 (§2.1):** "không phá sàn mới 26'03"" SAI — sàn chứng
  nhận vẫn 19'07" (xem §0.1).
- **Đính chính 2 (§3.3 stale-recovery):** "PASS cả 2 dạng" KHÔNG có
  output lưu lại trong dữ liệu M8: chỉ có lần 1 FAIL trong exec-log
  proc_6fc98e3b8fac (acquire timeout 60 s EXIT=1 cả 2 dạng, curl 5599
  SERVING); dòng echo "stale-recovery test PASS" trong exec-log
  proc_09877e511812 KHÔNG có trong m8-progress.log (log chỉ có 4
  dòng). **M9 đã kiểm lại trực tiếp trên script hiện tại (bản
  06:25:26Z):** fake-stale (pid 999999 chết + cổng 5999 trống) PASS —
  acquire EXIT=0, owner 5 trường, nhả sai thread từ chối EXIT=1, nhả
  đúng OK; **dir-trống-già PASS lúc yên** (không vite nào chạy —
  acquire EXIT=0, owner 5 trường, release OK). Lần test đầu của M9 bị
  chặn đúng theo thiết kế (còn vite M3 pid 39456 + M5 pid 40376 đang
  chạy → guard vite_any_running). Kết luận: stale-recovery của script
  hiện tại HOẠT ĐỘNG đúng cả 2 dạng — claim của M8 được xác nhận
  bằng kiểm lại của M9, không phải bằng output gốc của M8.
- **Đính chính 3 (§3.2):** nguyên nhân lần 1 FAIL không chỉ bug
  `000000`: lúc 05:43Z vite M6 đang phục vụ THẬT trên cổng 5599 (đúng
  cổng owner giả) nên ngay cả khi sửa bug, lần 1 vẫn FAIL vì vite thật
  còn sống + vite node trên cổng tồn tại.
- Lưu ý: vcut-vite-lock.sh bản cuối mtime 06:25:26Z (sau vite-test
  06:24:30Z) — M8 chưa chạy lại end-to-end trên bản cuối; M9 đã chạy
  stale-recovery trên bản này, PASS cả 2 dạng (xem trên). M8 cũng sửa
  lock script lúc 06:06:18Z giữa lúc M5 đang acquire → làm acquire
  của M5 crash giả + lock mồ côi (§0.2 M5; xem §10 mục 13).

## 9. Cây gộp cuối đợt — M9 tự chạy (06:59–07:06Z, boot #41, máy yên)

Trước khi chạy: `ps` không còn vite nào; giữ `vite.lock` có owner
`m9` (06:58:14Z, boot #41), nhả sau khi xong. `preview.tsx` md5
`c4198206…` trước/sau mọi lượt kiểm — không đổi. Postboot-check chạy
trước (boot #41 mới): PASS toàn bộ (wrapper, libs, GST 269=269, apt
10/10, ĐỦ ĐIỀU KIỆN).

### 9.1 Suite 27 mục — 27/27 exit 0 (log `round111-m9-suites.log`, 895 dòng)

| Mục | Kết quả |
|---|---|
| tsc-web | exit 0 (0 lỗi) |
| tsc-desktop | exit 0 (0 lỗi) |
| vite build | PASS, built in 6,18 s (chunk >500 kB cảnh báo cũ) |
| playheadHold90R2 | **84 passed** (75 cũ + 9 mới của M1) |
| playheadPacing54K9 | 19 pass, 0 fail |
| previewEngine | 27 test passed |
| seek | 21 passed |
| seekSkipRender86N3 | 9/9 test pass |
| previewLoop50F2 | 20 passed |
| ghostBlend.probe | 15 kiểm chứng xanh |
| rvfcClipWindow102D3 | 21 test passed |
| driftConfirmSkip103E4 | 12/12 + 5/5 PASS |
| css60 | PASS (60/60) |
| css61 | PASS (60/60) |
| P7-esbuild | 8/8 pass |
| orphans | 17 pass, 0 fail |
| r6 | PASS (i18n check) |
| U4 | 141 pass, 0 fail |
| media-tests | 3/3 PASS (blobPrefetch 25 pass; captureThumb PASS 2 FAIL 0; retryPlay95W2) |
| media-retry96X3 | 7 pass, 0 fail |
| media-watchdog96X3 | 9 pass, 0 fail |
| deint-verdict | 17 pass, 0 fail (số "4/5 PASS" trong log là tên test case, không phải số fail) |
| deint-verdict-100b7 | exit 0 |
| armHeld99a3 | exit 0 |
| vite-diagnosis-regex | exit 0 |
| xvfb-lock | PASS (không lỗi) |
| test-preview-engine.sh | 354 assertions pass |

### 9.2 O8 21/21 cả 2 engine (log `round111-m9-o8.log`)

- Chromium 07:05:55–07:06:03Z (chạy lại sau khi copy fixture — xem
  dưới): **21/21 pass, 0 fail, 0 note**, exit 0; report JSON
  `o8-chromium/o8-clicktest-report.json`: n=21, ok=true 21/21. S7:
  mask Δx=0,112, bóng Δx=0,113 (kỳ vọng 0,112).
- WebKit 07:03:14–07:04:05Z (LD_LIBRARY_PATH debroot): **21/21 pass,
  0 fail, 0 note**, exit 0; report JSON
  `o8-webkit/o8w-clicktest-report.json`: n=21, ok=true 21/21. S7:
  mask Δx=0,194, bóng Δx=0,197 (kỳ vọng 0,194) — giống L9.
- **Sự cố lần 1 (Chromium):** O8 Chromium lần đầu exit=2 sau 1 s —
  KHÔNG phải lỗi sản phẩm: harness thiếu fixture trong SCRATCH mới
  (`o8-white-720p-6s.mp4`, `o8-ball-720p-6s.mp4`,
  `o8-track-35-65.json` — script O8 của L9 không tự copy fixture;
  L9 đã copy tay trước khi chạy). M9 copy 3 file từ
  `hidden_files/round87-o8/headed/` vào `round111-m9/o8-chromium/`
  rồi chạy lại → 21/21. Vòng sau: đưa bước copy fixture vào script
  O8 (hoặc chạy O8 từ scratch đã có fixture sẵn).

### 9.3 File production đổi so với đầu đợt (find file đổi từ 05:38Z)

Chỉ M1 đổi production: `apps/web/src/preview.tsx`,
`apps/web/src/lib/playheadHold90R2.ts`,
`apps/web/src/lib/playheadHold90R2.test.ts`. Ngoài ra chỉ có
script/benchmark/docs (đều nằm trong batch §9.4) + 1 file binary
local-only của M5 (`apps/web/public/stripes-nonperiodic.mp4`, KHÔNG
stage). Không có file lạ nào khác đổi trong đợt.

### 9.4 Đếm batch từ đĩa (đọc trực tiếp paths-loop)

| Batch | Entry |
|---|---|
| phase9-round111-m1-tailceiling.txt | 5 |
| phase9-round111-m2-2mib.txt | 4 |
| phase9-round111-m3-zombie.txt | 2 |
| phase9-round111-m4-eperm.txt | 1 |
| phase9-round111-m5-ghost-pixel.txt | 1 |
| phase9-round111-m6-enospc.txt | 1 |
| phase9-round111-m7-loadbreak.txt | 2 |
| phase9-round111-m8-infra.txt | 3 |
| phase9-round111-m9-verify.txt (M9) | 1 |
| **Tổng đợt 111** | **9 batch / 20 entry / 20 file duy nhất** |

**0 binary, 0 `.github/workflows/*`.** Mọi file staged đều tồn tại
trên đĩa. 10 file >37.768 byte (cần `ENABLE_PRIVSEP=0` khi push):
preview.tsx 441.338 B; playheadHold90R2.ts 50.416 B;
playheadHold90R2.test.ts 43.713 B; probe111m1.mjs 45.847 B;
probe111m3-frame-parity.mjs 58.391 B; probe111m7-frame-parity.mjs
39.133 B; webkit_blob_flaky_111m2_2mib.mjs 69.407 B;
webkit-blob-flaky-111m2-2mib.json 45.195 B;
PHASE9_ROUND111_M3_ZOMBIE_LIMITS.md 41.578 B;
PHASE9_ROUND111_M4_EPERM_LIMITS.md 44.974 B.
**Lũy kế chờ push đợt 106–111 (đếm trực tiếp từ paths-loop): 58 batch /
118 entry / 111 file duy nhất + 1 file oversize**
`benchmarks/results/webkit-blob-flaky-96x3.json` (6.370.678 B, vẫn chờ).
Lưu ý đối chiếu: L9 §9.4 đếm lũy kế 106–110 là 47/94/90 — đúng tại
thời điểm L9 xong (04:17Z); sau đó parent stage thêm 2 batch đợt 110
(`phase9-round110-closing.txt` 04:56:10Z: LIMITS gộp + GAP_ANALYSIS;
`phase9-round110-l3-zombie.txt` 04:51:57Z: LIMITS + probe L3) nên lũy
kế 106–110 nay là 49/98/93. Đợt 111 thêm 9/20/20 (trùng 2 file cũ:
preview.tsx + vcut-webkit-postboot-check.sh) → 58/118/111.

## 10. Nợ mở sang đợt sau (cập nhật từ LIMITS gộp đợt 110 §10)

1. **G1 + mù #22 chờ user quyết** (metric G5/M2; mù #22 cửa sổ lý
   thuyết ≤78 s) — không đổi. Thêm: **mù #28 chờ user quyết** (chấp
   nhận "ít nhất 2 reboot, có thể 3" hay để mở) và **mù #29 KHÔNG ĐÓNG
   HOÀN TOÀN** (lỗ thật 13'33", khe 79 s — xem §4).
2. **E4: KHÔNG ĐÓNG (M1 đợt này, 1 CAP/157).** Cơ chế pause-deadlock
   đã chết, fix endedClosed đã vào nhưng CAP còn lại là cuộc đua
   tail-ceiling 5000 ms vs restart-ended seek ở biên cuối clip (m1f4:
   freeze 1 frame trước cuối, không restart). Cần luồng riêng điều tra
   cơ chế mới + A/B xác nhận; hoặc user quyết "đóng có điều kiện" (cơ
   chế E4 đã xong, CAP còn lại thuộc hệ khác). M1 đề xuất KHÔNG đưa
   chặn set-lại ring thành sửa production — chờ quyết.
3. **2 MiB offset +4.194.304:** đã xác nhận trên c8 (L2/M2); ring 8
   MiB: R8 0/0 spliced nhưng Fisher chưa đạt (p=0,1333 vs gộp ring-4M;
   p=0,4286 vs M2 ring-4) — cần thêm lượt. Còn lại: G6 §8.5c
   preload-before-seek chưa đo; gán el1/el2 + preload trước seek.
4. **Zombie gate (b) dạng mạnh: VẪN MỞ nhưng đã lặp lại.** M3: 1/3
   lượt (R2, 4 gap freeze sạch); gộp 4/12 lượt. **Quyết bar CDP: đề
   xuất BỎ làm bar song song** (điều kiện chữ 0/3 lượt trong dải đã
   thỏa — chờ verify/parent quyết; nếu giữ thì đăng ký trước ngưỡng
   Δdraws nới lỏng ≤5 và chạy lại). Quy tắc loại stall >1000 ms đã
   đăng ký + áp dụng xong (không đổi số đếm M3; đối chiếu L3: 4 gap →
   3 gap freeze, lượt vẫn 2/2) — giữ cho các đợt sau. 7/8 gap freeze
   sạch straddle biên clip 3 s — cần mẫu lớn hơn + đăng ký trước để
   kiểm tra giả thuyết freeze tập trung ở chuyển clip. Stall 5 s biên
   60 s: 0/5 lượt (L3+M3); stall giữa clip kiểu c15: 1/5 lượt —
   nguyên nhân gây seek giữa clip vẫn chưa xác định. draws/s dao động
   3× giữa các lượt chưa rõ nguyên nhân.
5. **E6: ĐÃ ĐÓNG (L4 đợt 110, 18/18; M7 đợt này thêm 2 sự kiện → 20/20
   Nhãn-đúng).** H-alt không tái hiện lần 3 liên tiếp (M7 n=29) —
   dừng dùng H-alt để diễn giải.
6. **E1 bar ≥7: ĐÃ ĐẠT (L5 run31 đợt 110).** Gate v2: M7 cho thấy đạt
   gate v2 không suy ra presented GIỮ (r66/r67/r68 đạt gate nhưng vẫn
   TRUNG-GIAN) — gate là cổng liveness, không phải cổng chính xác.
7. **EPERM probe #31 + mù #30 đợt sau** (mù #29 KHÔNG đóng hoàn toàn
   — xem §4; probe #30 ok=2 fail=0 trên boot #40).
8. **F6': ĐÃ ĐÓNG (L7 lượt yên đợt 110); M5 đợt này ĐÃ CÓ bằng chứng
   pixel độc lập mạnh** ((b) unique-match n=648/484/314, nomatch 0 —
   nợ 1 ĐÓNG). Nợ mới/mở: (a) label-at-capture vẫn mở (đo lại bằng
   chính fixture mới để so sánh (b) trước/sau; đổi ngữ nghĩa nhãn →
   bar F6' phải định nghĩa lại); (b) **ngưỡng WebKit đề xuất ≤60 ms**
   (thay ≤100 ms — cần 1 lượt yên thật trên fixture mới để chốt; nếu
   median ~40–45 ms thì giữ ≤60, nếu >60 ms thì hiệu chuẩn lại, không
   tự nâng ngưỡng sau khi thấy số); (c) nhãn ghost vẫn nhiễu (cấu
   trúc, đúng tuyệt đối chỉ ~26–43% skp=0) — muốn nhãn tốt hơn phải
   đổi cơ chế anchor/label trên WebKit; (d) capture lag thật max +4f
   (133 ms), decode lag tới −58f, stale sau seek — đã đo tuyệt đối,
   không cần đo lại (b) trừ khi cây ghost thay đổi.
9. **Điểm gãy tải: VẪN MỞ (M7).** Không có điểm GIỮ lẫn điểm GÃY nào
   trên build mới ở tải có đo; r69 control GIỮ (282 tick, 100% trong
   ±1) chứng minh đói tick là do tải, không phải build. Đợt sau cần
   tích đủ tick dưới tải (kéo dài cửa sổ phát / nhiều clip hơn / phát
   lặp lại) để n tick vượt 50 ngay cả khi tick rate sụp còn ~1–4/s,
   hoặc đo presented bằng metric không phụ thuộc mật độ tick rVFC.
   Dial tải bằng hog không điều khiển được load1 dưới throttle nhấp
   nháy — chỉ tin sampled mean TRONG LÚC PHÁT.
10. **ENOSPC: vite nối tiếp bắt buộc** (headroom 1640–1655; 1 vite =
    1578–1586 watch). `watch.ignored ["**/**"]` đã chứng minh 0 watch
    (L8/M6/M8) — áp dụng cho mọi vite tạm của luồng đo. Phần C đã đo:
    vite thường V2 ≤2 s, vite ignored STALE@32s — trade-off
    stale-module vẫn mở (cần quyết có chấp nhận STALE@32s không).
    Stale-recovery của lock script đã được M9 kiểm lại PASS cả 2 dạng
    trên bản hiện tại.
11. **WebKit sau reboot: đã có đường bền vững** (apt replay + script
    postboot-check; M8 đã cập nhật script lên #40 — **cần cập nhật
    tiếp lên #41** vì script vẫn ghi "#40 = 05:16:36Z" trong khi boot
    hiện tại là #41 06:53:26Z; check vẫn PASS vì so với boot hiện
    tại). Replay mất ~17 phút sau boot mới đủ package — probe WebKit
    đầu đợt sau reboot phải chạy postboot-check trước. Vite mồ côi:
    kill vite phải theo pid node thật, kiểm `ps` + `curl` cổng sau khi
    kill (M5/M7/M8 đợt này đều làm đúng; không còn vite mồ côi sau
    đợt).
12. **Birefnet 0 lần thành công** — chỉ thử lại khi RAM đổi (guard
    6 GB; RAM khả dụng ~1,0–2,5 GB; max RAM trong mù #28 là 3,50 GB).
    **TTS 39 CẤM kiểm lại.**
13. **Lock script + quy trình:** (a) KHÔNG sửa `vcut-vite-lock.sh`
    khi có acquire đang chạy (M8 sửa 06:06:18Z làm acquire của M5
    crash giả + lock mồ côi; M8 cũng gặp hiện tượng tương tự); acquire
    nên dùng bản copy đóng băng như M5 đã làm; (b) run script không
    nên diễn giải mọi exit != 0 của acquire là "timeout" (M5 đã sửa
    message trong run-m5.sh của mình); (c) poll lock nên nhanh (M3
    đổi 60 s → 5 s vì khe hở giữa các lượt chỉ vài giây; M7 nhả rồi
    giữ lại sau ~8 s — poll 10 s bỏ lỡ cửa; luồng vừa nhả lock mà
    định giữ lại ngay nên chờ ≥15 s sau khi nhả để luồng đang chờ có
    cửa công bằng — xem spec lock M8 §6).
14. **ci-security.yml vẫn 403, chờ user** (workflow chưa từng lên
    GitHub). **Release gate không đổi** (chỉ release khi ngang/hơn
    CapCut thật). **KHÔNG push** khi user chưa nhắn "push đi".

## 11. Ghi chú verify (M9)

- Poll M9: POLL#0 05:39:07Z → POLL#14 06:49:11Z (mỗi 300 s). 8/8 done
  lúc 06:49:11Z (M1, M2, M3, M4, M5, M6, M7, M8). Hạn chờ ~07:35Z —
  M9 không cần chờ hết hạn vì tất cả đã về trước hạn.
- Reboot trong đợt M9: #40 05:16:36Z (trước khi M9 bắt đầu), #41
  06:53:26Z (sau khi 8/8 xong, trong lúc M9 kiểm cây gộp). #41 cắt
  poller M9 (POLL#14 là cuối) và 1 exec sleep của M9 (SIGTERM
  ~06:53Z); 1 exec khác của M9 (WAKE3, kiểm M3/M5/M7 lúc 06:31Z)
  cũng bị SIGTERM khi hết lượt — nội dung của nó đã được M9 kiểm lại
  trực tiếp từ đĩa sau đó, không mất thông tin. M9 kiểm cây gộp trên
  boot #41 sau postboot-check PASS.
- M9 không chạy suite cuối trước khi 8/8 luồng xong (tránh tranh
  vite); suite chạy 06:59–07:03Z, O8 07:03–07:06Z, đều sau khi M7/M5
  xong và lock đã tự do.
- Không có luồng nào sửa production ngoài M1 (kiểm bằng find file đổi
  từ 05:38Z, xem §9.3). M5 có 1 file binary local-only
  (stripes-nonperiodic.mp4) không stage — đúng quy định.
- M9 tự kiểm lại 2 claim không có output gốc đủ mạnh: stale-recovery
  của M8 (§8 — PASS cả 2 dạng trên script hiện tại) và tickCost/fixtures
  của M5 (§5 — chạy lại analyzer + verify-fixture, khớp). M9 cũng tự
  tìm 1 đính chính cho M4 (lỗ 1 thật 13'33" qua birth-time) và 1 đính
  chính cho M7 (skip-stale r65 9/22 không phải 13/22).

## 12. File đã đổi + batch (KHÔNG push)

- `docs/PHASE9_ROUND111_LIMITS.md` — file này.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round111-m9-verify.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu verify:
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round111-m9/`
  (poll-m9.sh, poll-m9.log, m9-notes.md, m9-notes-m2-correction.md,
  recount-m9-m1/m2/m3/m4/m7.py + .txt, recount-m9-m5-tickcost.txt,
  hole-check-m9.txt, baseline-md5.txt, round111-m9-verify.sh,
  round111-m9-o8.sh, round111-m9-suites.log, round111-m9-o8.log,
  o8-chromium/, o8-webkit/).
- Cờ xong: `hidden_files/round111-m9-done` (tạo SAU KHI LIMITS + batch
  xong).
