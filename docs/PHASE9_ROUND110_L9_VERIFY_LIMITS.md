# PHASE9_ROUND110_L9_VERIFY_LIMITS — Verify độc lập đợt 110 (L1–L8 + cây gộp)

> Luồng L9 (verify), đợt 110, lượt cron 09:35 +07 14/11/2026. Bắt đầu 02:40Z,
> xong 04:17Z 14/11/2026. Boot cuối #39 (02:50:48Z, `ce518c02…`).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (chỉ L1 sửa đợt này).
> Phương pháp: tính lại headline từng luồng từ dữ liệu thô bằng code riêng
> (script `recount-l*.py` trong `hidden_files/round110-l9/`), không tin mù
> LIMITS; chạy lại toàn bộ suite + O8 trên cây gộp; đếm batch từ đĩa.
> File verify: `hidden_files/round110-l9/` (recount-l1/l2/l4/l5/l6/l7,
> `round110-l9-suites.log`, `round110-l9-o8.log`, `poll-l9.log`).

## 0. Kết luận ngắn

| Luồng | Verdict | Headline đã xác nhận |
|---|---|---|
| L1 E4 fix + A/B | **KHỚP kèm đính chính** | Unit test 12/12+5/5 (tự chạy lại); A/B 2+2 = **1 CAP/179 ticks** (l1f3, age 5191 ms) → **KHÔNG ĐÓNG E4** theo prereg; Fisher p=0,2571; pause-deadlock đã chết (0/60 mẫu paused), rearm cứu 3/4 đuôi; CAP còn lại là cơ chế mới (đuôi chạm trần vs restart-ended seek ở biên cuối clip) |
| L2 2 MiB offset | **KHỚP kèm đính chính** | Offset +4.194.304 trên c8 xác nhận (12/12 pull log, 0 OTHER); ring-buffer-max-size quyết định offset, không phải max-size-bytes; fresh-element +2.097.152 |
| L3 Zombie gate (b) | **KHÔNG HOÀN THÀNH** | Agent bị gián đoạn ~02:51:23Z bởi reboot #39, **không được giao lại** (khác L6); không có lượt freeze nào, không LIMITS, không batch — chỉ còn prereg + script + load-test dở (variant A, 8 mẫu) |
| L4 Blur cụm A | **KHỚP** | E6 BỊ BÁC — 18/18 Nhãn-đúng (11 mới + 7 cũ); H-alt không tái hiện lần 2; proxy-max 4,07/3,47/1,94/1,76/1,15/0,78 đã kiểm lại, khớp |
| L5 Harness E1 | **KHỚP kèm đính chính** | Bar ≥7 **ĐẠT** — run31 QUALIFYING (10/10, G4 R=0,51, G5 3,24×, slot0Fps 0,71); Wilson 2/36 [1,5%, 18,1%]; gate v2 chặn đúng mẫu t+10s run30 |
| L6 EPERM + mù #28 | **KHỚP kèm đính chính** | Probe #29 ok=2 fail=0; mù #28 **KHÔNG đóng hoàn toàn** (lỗ thật 23'39", còn khe 4'32" không loại trừ được); gap stats CERT n=22 khớp |
| L7 F6' yên | **KHỚP kèm đính chính** | **F6' ĐÓNG** — lượt yên thật (poll 45, load 0,31/1,78, blockers=0): (1) 53/53 + (2) 53/53 = 100%, n=53 ≥ 30; tickCost median 40,5 ms; lag (c2) skp=1: n=7, median 8f, max 16f |
| L8 Infra | **KHỚP kèm đính chính** | Apt replay là đường bền vững (plugin 270 file sau replay); watch.ignored = 0 watch (A 1585 vs B 0, đo lại khớp log); O8 WebKit 21/21 sau sửa; postboot-check script mới |

**Cây gộp cuối đợt (L9 tự chạy): tsc web 0, tsc desktop 0, vite build PASS
(6,46 s), 27/27 suite exit 0, O8 21/21 Chromium + 21/21 WebKit.**
`preview.tsx` md5 `9b27abe57975ec5b69ec2e21c3fa281c` suốt đợt (L1-fix) — không
đổi trong lúc verify.

**Batch đợt 110 (đếm từ đĩa, gồm batch L9 này): 8 file / 18 entry /
18 file duy nhất, 0 binary, 0 workflow.** 6 file >37.768 byte cần
`ENABLE_PRIVSEP=0` khi push (xem §9). File oversize đợt 109
`benchmarks/results/webkit-blob-flaky-96x3.json` (6.370.678 B) vẫn chờ.

## 0.1 Đính chính chung — sàn gap reboot (L5/L7/L8 đều viết sai)

Ba luồng viết gap #38→#39 = **26'03"** là "phá sàn" / "sàn gap mới" /
"sàn reboot lại bị phá". **SAI.** Khoảng gap đã chứng nhận vẫn là
**[19'07", 3h14'08"]** (sàn 19'07" = gap #32→#33, đợt 106; L6 đợt này
đã tính lại CERT n=22, khớp). 26'03" > 19'07" nên **không phá sàn,
sàn không đổi**. L1 lúc đầu cũng ghi #38 cho reboot 02:51Z nhưng đã tự
đính chính trong LIMITS §8 (#39). Lỗi này không đổi verdict luồng nào —
chỉ đổi câu về sàn gap trong LIMITS gộp đợt sau.

## 1. L1 — E4 fix + A/B 2+2: KHỚP kèm đính chính (verdict: KHÔNG ĐÓNG)

### 1.1 Tính lại từ dữ liệu thô (recount-l1.py, code riêng)

| lượt | gop | tầng | RAM (kB) | load1 | ticks | tails | CAP | rate | wall | frzMax | frzTail | frzPhAdv |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| l1f1 | 250 | J | 1.717.056 | 1,04 | 43 | 1 | 0 | 0,420 | 11.592 | 2.819 | 508 | 508 |
| l1f2 | 30 | J | 1.917.380 | 2,35 | 44 | 3 | 0 | 0,448 | 11.619 | 3.040 | 328 | 328 |
| l1f3 | 250 | J | 1.975.028 | 2,00 | 54 | 1 | **1 (5.191 ms)** | 0,455 | 10.984 | 2.322 | 205 | 186 |
| l1f4 | 30 | J | 2.093.612 | 1,56 | 38 | 1 | 0 | 0,501 | 10.508 | 2.429 | 375 | 375 |
| **gộp** | | | | | **179** | **6** | **1** | **0,452*** | | | **352*** | **352*** |

\* trung vị. Khớp 100% với `cap-pattern-rows.json` của L1 (mọi ô: ticks,
tails, CAP, rate, wall, frzMax, frzTail, frzPhAdv, gapMed, gapMax, mtime
02:54:12.764Z trước/sau mỗi lượt, pageErrs [], stopped=true). CAP duy
nhất: l1f3, ended=4331, age=5191, adv=0, drift=0,0, ct=5,5, ph=5,5,
t=9522, tick_idx=39, cap_first40=1.

**Gộp: 1 CAP / 179 ticks = 0,0056 CAP/tick** (K1-on 6/284 = 0,0211;
K1-off 0/159). **Fisher 2 phía (tự tính): p = 0,2571** (bảng
[[1,178],[6,278]]) — khớp L1. Poisson P(0 CAP | rate on, n=179) =
0,0228; P(≤1 CAP) = 0,1089; Binomial P(0) = 0,0219 — khớp L1.
**Fisher vs K1-off p = 1,0000** (không phân biệt được với nhánh E4-tắt)
— khớp L1 §5.

### 1.2 Kiểm cơ chế (đuôi age ≥ 4000 ms, tính lại)

| lượt | ended | age | rearm tick sau? | mẫu | paused | skipTicks Δ (N3) | seeking? | renderTicks skipped |
|---|---|---|---|---|---|---|---|---|
| l1f1 | 5086 | 4.900 | CÓ | 13 | 0 (0,00) | 0 | không | 10/15 |
| l1f2 | 4677 | 4.114 | CÓ | 10 | 0 (0,00) | 0 | không | 3/10 |
| l1f3 | 4331 | 5.191 | KHÔNG → CAP | 22 | 0 (0,00) | 1 | có (1 mẫu) | 21/22 |
| l1f4 | 3532 | 5.367 | CÓ | 15 | 0 (0,00) | 0 | không | 0/15 |

Khớp 100% với `mechanism-rows.json` của L1. Đối chiếu prereg §4:
(a) "0 CAP" — **KHÔNG ĐẠT** (1 CAP); (b) "không đuôi nào age ≥4800
thiếu rearm" — **KHÔNG ĐẠT** (l1f3 thiếu); "paused <20% mọi đuôi
≥4000 ms" — **ĐẠT** (0% cả 4 đuôi); (c) "E4 vẫn bỏ vẽ" — **ĐẠT**
(l1f1 10/15, l1f3 21/22 renderTicks skipped trong khi skipTicks N3
đứng yên/Δ=1). **Verdict KHÔNG ĐÓNG E4 là đúng prereg.**

### 1.3 CAP l1f3 — cơ chế MỚI, không phải pause-deadlock (tự tái hiện từng tick)

- Đuôi Y4 (ended=4331) mở sau burst ct 0,57→1,32 ở t=4331. Trong đuôi,
  element **giải mã bình thường**: ct 1,32→6,0 (chạm cuối clip t=9108),
  ph 0,5→5,23; `advances` giữ 0 cả đuôi (luật B3/C3 từ chối đếm burst),
  tailDriftGate 0→13, tailBursts 0→9.
- Tick 38 (t=9317): ct 6,0→5,5, ph 5,23→5,5 — **drift re-seek đã bắn**
  (seeking=True ở mẫu relMs=9023, skipTicks 5→6, resyncsV 1→2 và
  restartV 0→1 ở tick 39). Tuổi đuôi lúc re-seek bắn: 9317−4331 =
  4.986 ms — đã **vượt ngưỡng CAP 4800 ms** trước khi re-seek kịp cứu.
- Tick 39 (t=9522): tuổi 5.191 ms; tick 40 đuôi đóng (chạm trần 5000 ms),
  rearms 0→0 cả lượt → **CAP theo đúng luật F5/K1**.
- Vì sao không rearm: trong đuôi element không đóng băng ≥300 ms nên
  detector không có gì để arm (đúng luật); ~200 ms cuối element đang
  seeking (restart seek) nên detector trả track null (đúng luật). Sau
  re-seek, ct kẹt ở 5,5 tới hết lượt (t=10991) nhưng lượt kết thúc trước
  khi thành đuôi mới.
- Kết luận: đây là **cuộc đua tail-ceiling 5000 ms vs restart-ended
  seek ở biên cuối clip**, độc lập với E4 — khớp phân tích §4.2 của L1
  (kể cả chi tiết resyncsV/restartV/tailBursts/gate, đã kiểm lại từng
  tick). Nợ mới, cần luồng riêng (xem §10).

### 1.4 Fix + wiring — tự kiểm bằng đọc code và chạy test

- Unit test tự chạy lại: `node --experimental-strip-types
  apps/web/src/lib/driftConfirmSkip103E4.test.ts` → **12/12 + 5/5 PASS**
  (khớp L1).
- md5 trên đĩa: preview.tsx `9b27abe5…` ✓, driftConfirmSkip103E4.ts
  `ce3a9291…` ✓, test mới `417b03a2…`.
- Wiring đọc trực tiếp trong code: `combineSkipRender(N3, E4)` trả
  `{skipRender: N3||E4, skipRenderSeeking: N3}`; `syncMedia` trả
  `SkipRenderDecision`; tickInner: `prevSkipRenderSeeking =
  decision.skipRenderSeeking` (dòng 7266), render skip theo
  `decision.skipRender` (7323), bộ đếm N3 chỉ tăng khi
  `skipRenderSeeking` (7328–7330); nhánh pause lấy `.skipRenderSeeking`
  (7355). Đúng thiết kế tách tín hiệu.
- Trích dẫn dòng pre-fix trong LIMITS §1.1 kiểm lại trên bản pristine
  `preview.tsx.pristine.ced42efd` (round109-k1): return gộp
  `|| skipRenderDriftConfirm103E4` ở 5605–5612 ✓, gán
  `prevSkipRenderSeeking` ở ~7252 ✓, `nextResumeFreezeRearm` trả
  track null khi paused (`playheadHold90R2.ts`) ✓.

### 1.5 Đính chính cho L1 (nhỏ, không đổi verdict)

1. **Số paused K1-on §1.1 ghi sai từng đuôi.** L1 viết "24/26, 20/21,
   21/23, 23/23". Tính lại từ dữ liệu thô K1 (và khớp chính
   `mechanism-rows.json` của K1): **23/23, 24/25, 20/21, 21/22**
   (4 đuôi CAP k1on). Tổng đúng: 88/91 mẫu paused (không phải ~90/94
   như §5 — xem mục 3). Gộp toàn nhánh on (k1on+k2on+k3on+k4on, 6 đuôi
   CAP): **106/110**.
2. **Span cứu k1off: 0/13 mẫu paused, không phải 0/14** (K1
   mechanism-rows: k1off ended 4206, age 5209, paused 0/13, rearm_up
   True). Gộp nhánh off (≥4000 ms): 3 đuôi, cả 3 được cứu bằng rearm
   (**3/3**, không phải 2/2 như §5 — 2/2 chỉ đúng nếu lấy ngưỡng
   ≥4800 ms: k1off 5209 + k3off 4910; đuôi k2off age 4008 bị loại ở
   ngưỡng đó). Paused nhánh off: 0/36 (≥4000) / 0/26 (≥4800) — không
   phải 0/14.
3. **Reboot §8 đã tự đính chính** ("lúc đầu ghi #38 — luồng L8 xác
   nhận là #39") — ghi nhận, không tính là lỗi còn tồn tại.
4. **Nit comment:** chú thích ở return của `syncMedia` viết "Nhánh
   pause bỏ qua giá trị trả về" — không chính xác hoàn toàn: nhánh
   pause có đọc `.skipRenderSeeking` (dòng 7355). Chỉ là chữ, không
   đổi hành vi (cờ E4 luôn false ở đường pause). L1 đã tự ghi nit
   comment N3 tương tự ở §7.4.
5. Các số so sánh §5 còn lại đã kiểm lại từ dữ liệu thô K1: CAP/tick
   on 6/284 = 0,0211 ✓, off 0/159 ✓, C40 on = 3 ✓, rate trung vị on
   0,151 / off 0,424 ✓, freeze-trong-đuôi trung vị on 4520 / off
   316 ms ✓.

## 2. L2 — 2 MiB offset +4.194.304: KHỚP kèm đính chính

(Tính lại bằng recount-l2.py, đọc trực tiếp byte clip — không import
script L2.)

- **Nhóm A (c8, ring 4 MiB, wall 30 s): 2/2 run, mỗi run 14 spliced
  pull, toàn bộ delta +4.194.304** (req_off 9939/48426/66916/80895/
  97529/114176/126851, ms ~12,2–12,5 s) → **offset +4.194.304 ĐÃ XÁC
  NHẬN**, khớp bảng LIMITS, 0 OTHER trong cả 12 pull log.
- S1 (max-size 1 MiB + ring 4 MiB): 396 EXACT cả 2 run, 0 splice. S2
  (max-size 4 MiB + ring 1 MiB): r1 396 EXACT, r2 **2 pull +1.048.576**
  (req_off 0) → **ring-buffer-max-size quyết định offset, không phải
  max-size-bytes** (phản ví dụ đứng).
- D fresh-element: r1 2×+2.097.152, r2 6×+2.097.152 (req_off 0/3179/
  41666). F (c8 default ring, wall 30 s): r1 798 EXACT (cap), r2
  **8×+2.097.152** (req_off 80895/97529/114176/126851, ms 2317–2369).
  G (c16, cap 2000): 1368/1110 EXACT, 0 splice.
- Frames/finalCt/errEvents từ JSON khớp bảng cả 14 case; md5 cây
  9b27abe5 ở cả 14 case.
- Playbin attribution: L2PLAYBIN khớp từng dòng (r1: regular-0 @697,
  blob-1 @810, blob-2 @1069, regular-3 @1141; r2: regular-0 @525,
  blob-1 @573, blob-2 @722, regular-3 @861); thứ tự ms splice nhất
  quán (r1 splice 1132 → blob-2; r2 splice đầu 671 → blob-1, sau
  761–762 → blob-2). WebKit dùng **GstPlayBin3** cho blob URL.
- DOT sample xác nhận node queue2 S2: max-size-bytes=4194304,
  ring-buffer-max-size=1048576.

Đính chính:
1. **Số boot của L2 lệch 1 suốt LIMITS + prereg**: boot lúc bắt đầu
   là **#38** (02:24:45Z), reboot giữa lượt là **#39** (02:50:48Z); L2
   gọi là #37/#38.
2. Cột "Instances" không định nghĩa: D r2 có **3 qtdemux riêng** trong
   log GST (qtdemux0/1 blob + qtdemux2 http-fallback — cùng luồng với
   http-src-1, GST 0,41 s, khớp regular-3); L2 đếm 2 (chỉ blob) —
   chấp nhận được theo §4 nhưng không ghi rõ trong bảng.
3. **Log pull/gst thô nhóm E bị nhóm G ghi đè** (cùng tên case, L2
   tự nhận §5.6) — số E chỉ kiểm được qua JSON summary +
   `l2-progress.md`, không kiểm được từ log thô. Frames/finalCt E
   (669/28,70; 618/29,30; 0 err) khớp bảng từ JSON.
4. preview.tsx mtime 02:54:12.76Z khớp "02:54:12Z" của L2 (file md5
   chung ghi 02:55:02Z).

## 3. L3 — Zombie gate (b): KHÔNG HOÀN THÀNH (gián đoạn, không giao lại)

- **Trạng thái agent: `interrupted`** (runtime, completed_at
  ~02:51:23Z) — trùng lúc load-test dừng (mẫu cuối 02:51:27Z). Không
  có agent L3 thay thế trong danh sách subagent (khác L6: L6 lỗi
  runtime 02:51:26Z và được giao lại sau 41 s; L3 không có bản giao
  lại nào tới lúc L9 xong 04:17Z).
- **Trên đĩa chỉ có:** prereg-l3.md (02:46Z), round110-l3-analyze.py,
  run-l3.sh, load-holder-l3.sh, load-test-l3.sh + load-test-l3.txt/
  .stdout (12 dòng). **Không có:** driver-l3.log, thư mục kết quả
  freeze nào, LIMITS, batch. `run-l3.sh` chưa từng chạy (không log).
- Load-test dở: chỉ variant A (node x6, 90 s) chạy được 8 mẫu
  (02:50:31–02:51:27Z): load1 ~43,5–49,4, load5 ~19,0–23,8,
  procs_running 19–68, hogN~6, hogCPU% ~17–48, cpuBusy% 55–74%.
  Variant B (python), C (yes), liều N=3/N=10 **chưa chạy**. Lưu ý:
  load-test này tự tạo sóng tải load ~44–49 mà poll L7 thấy ở poll
  3–5 và L5-run26 gặp — ghi nhận để khỏi chẩn đoán sai nguồn tải.
- **Không có số liệu nào để verify** cho 3 mục prereg: (a) dạng mạnh
  gate (b) lặp lại, (b) stall chuyển clip 5 s (c19→c20), (c) dial tải
  + ring draws 2000→8000 + quyết định bar CDP. **Cả 3 vẫn là nợ mở
  sang đợt sau** (xem §10).
- File mồ côi chưa stage: `apps/web/scripts/probe110l3-frame-parity.mjs`
  (L3 tạo, nằm trên đĩa, không thuộc batch nào — parent quyết đợt sau
  stage hay bỏ; L9 không tự stage file của luồng khác).
- Chú thích thời gian: load-test bắt đầu 02:50:26Z trên boot #38 và
  mẫu cuối 02:51:27Z nằm trong cửa sổ lệch đồng hồ ~38 s quanh reboot
  #39 (02:50:48Z) — hiện tượng đã biết: tiến trình cũ sống ~29–38 s
  sau reboot theo timestamp của chính nó.

## 4. L4 — Blur cụm A: KHỚP (E6 BỊ BÁC; proxy-max đã kiểm xong)

(Tính lại bằng recount-l4.py — tái cài đặt đầy đủ; khớp 100% số L4.)

- Baseline: L4 **87,94** (n=87), K4 88,06, J5 88,11 ✓. Mỗi lượt
  caps/ticks/events: r58 155/182/122, r59 108/120/74, r60 168/197/134,
  r61 87/84/44, r62 42/36/11, r63 57/52/26. Tổng **617 caps / 671
  ticks / 411 distinct events** ✓. K4 156 events, J5 804 ✓.
- **E6 BỊ BÁC — 18/18 Nhãn-đúng**: band A' L4=11, K4=1, J5=6, gộp=18,
  tất cả Nhãn-đúng. Mọi event L4 khớp bảng LIMITS E8–E18 từng trường
  (run/clip/pres/content/ghosts/label gap 6/content gap/g tới 0,001),
  kể cả outlier gap-7 r59 c1 pres45 (content gap 7, g=0,466). Nhạy cảm
  (sampled mean [2,5]): **12/12** ✓.
- F2: **671/671 identified, 643 trong ±1 (95,8%)**, ghost_all 671/671;
  nhẹ r58–61: 583/569 (97,6%); vừa r62–63: 88/74 (84,1%) ✓.
- Bar (b) blind H-alt: L4 mới n=409: **median |Δg| even 0,068 /
  signed +0,063 vs H-alt 0,060 / +0,048** — cải thiện 0,008 < ngưỡng
  prereg 0,010 → **H-alt KHÔNG tái hiện** (lần 2 liên tiếp). Gộp
  n=1367: 0,065/+0,057 vs 0,046/+0,027 ✓.
- Bar (c) triples: L4 n=29 **+0,048/−0,009**; gộp n=536
  **+0,051/−0,008** ✓.
- Bar (d): sampled means 2,63/3,19/1,75/1,59/0,95/0,71 (n=4 mỗi lượt),
  median đều +0, trong ±1: 178/182 (97,8%), 114/120 (95,0%), 197/197
  (100%), 80/84 (95,2%), 29/36 (80,6%), 45/52 (86,5%) ✓; md5
  9b27abe5 không đổi mọi lượt, mtimeChangedMidRun=false ✓. g<0,35:
  0/617 ✓. Điểm gãy tải KHÔNG đóng (giữ tới sampled 3,19; r62/r63
  không đạt load 5–8 dù có hog).
- **Proxy-max (mục mở từ lần kiểm trước, nay đã kiểm xong):**
  tính lại từ `loadAtPlay` + `envAfter.uptime` trong từng
  frame-parity-results.json: r58 2,55/4,07 → **4,07**; r59 3,47/2,93 →
  **3,47**; r60 1,94/1,51 → **1,94**; r61 1,76/1,42 → **1,76**; r62
  1,15/0,82 → **1,15**; r63 0,78/0,63 → **0,78** — khớp đúng số L4.

## 5. L5 — Harness E1: KHỚP kèm đính chính (BAR ≥7 ĐẠT)

- **Run31 QUALIFYING — bar ≥7 đạt**: report pass=**10/10**, G4 PASS
  **R=0,51 < 0,8**, G5 PASS **3,24×**, frozenSlots [4,6,7,10] (4/11),
  G0 canvas 1991×815, G3 MAD=0; slot0Fps=**0,71**; idle mode=tải. G3
  03:21:33.362Z → G4 03:21:41.047Z = **gap 7,685 s** ✓. Cửa sổ dial:
  load1 **35,31** / load5 **20,36**, n=1 mẫu (03:21:40Z); mẫu ngay
  trước cửa 03:21:30Z load1 38,06/load5 20,34; sampler cả lượt 36 mẫu
  load1 mean 18,75/min 1,00/max 38,38 — verdict không dựa vào 1 mẫu
  duy nhất (L5 đã tự ghi caveat).
- Keydown run31: 11 slots / 22 toggles, **playMax 2082 ms** (slot 7),
  pauseMax 1521 ms (slot 3), methods space/space, 0 retry/fallback/
  abort. Gộp: **57 lượt / 759 slots / 1518 toggles, max 2197 ms**
  (kỷ lục I6 không đổi).
- Wilson tự tính lại: 2/35 = 5,7% [1,6%, 18,6%]; **2/36 = 5,6%
  [1,5%, 18,1%]**; **2/37 = 5,4% [1,5%, 17,7%]** ✓ khớp L5.
- Gate từ `run-l5.log`: run26 A fail 180 s (load1 2,50→0,41→1,59) →
  B pass 60 s (4,63→30,02); run28 A pass 90 s; run29 A pass 20 s;
  run30 A pass 40 s — **mẫu t+10s load1 0,59/load5 8,15 bị gate v2
  loại đúng** (lỗ K5 §6.3 đã vá có tác dụng); run31 A pass 60 s
  (3,37→23,14; load5 4,06→9,48). Dòng driver "BAR ĐẠT:… (6 I6 + 1 K5
  = 7)" — xem đính chính 2.
- Lỗi trước run31: run26 + run28 **CDP page-target timeout** (111
  lần/60,2 s; 114 lần/61,1 s — mode lỗi mới, pre-mount); run29 + run30
  **project-load timeout 3 phút** (mẫu run24 K5); run27 bị reboot #39
  cắt giữa gate dial. Run31 chờ vite lock 7 phút (L4 giữ ~03:07, xong
  03:17:58Z).
- Harness md5 `ae6cd34a…` không đổi ✓ (tự kiểm). Preview md5 mỗi lượt:
  run28 bắt đầu ced42efd → kết thúc 9b27abe5 (vượt qua L1-fix
  02:55:02Z; lỗi CDP xảy ra trước khi tải trang, không phải do fix);
  run29/30/31 hoàn toàn trên 9b27abe5 ✓. ENOSPC: **0 dòng trong cả
  5 vite log**, đều ready. RAM ≥1024 MB mọi lượt; watcher 5/63756.

Đính chính:
1. §3.4 "gap #38→#39 ~26 phút — phá sàn gap" **sai** (xem §0.1).
2. Nhãn driver log "1 K5" phải là **1 L5** (L5 đã tự đính chính trong
   LIMITS; không sửa log, chỉ ghi nhận).
3. Mẫu n=1 trong cửa sổ G3→G4 — caveat L5 đã tự ghi, nhắc lại ở đây.

## 6. L6 — EPERM probe #29 + mù #28: KHỚP kèm đính chính

- Probe #29: 02:40:36Z, boot 2f001e9c, ok=2 fail=0; log 76→79 dòng;
  heartbeat n=29 ✓ (kiểm từ `eperm-probe-v2.log` + heartbeat).
- **Mù #28 KHÔNG đóng hoàn toàn**: lỗ thật **23'39" (02:01:06Z →
  02:24:45Z)**; sàn loại trừ (02:05:38Z, 02:24:45Z) để lại khe
  **4'32" [02:01:06Z, 02:05:38Z]** không loại trừ được. Kiểm độc lập:
  activity cuối trong `blind28-all.txt` = epoch 1794621666 =
  02:01:06Z; tự find toàn ~/workspace (trừ 2 cây) + /tmp trong cửa sổ
  lỗ = 0 file; file duy nhất trong cửa sổ rộng [02:01:06, 02:40:36] =
  exec-log của parent (`agents/fc4c7535…/exec-logs/proc_2eb0ccf25ccf.log`,
  mtime 02:36:55Z) mà `ps aux` trong đó cho thấy systemd PID 1 START
  02:24 (nguồn độc lập thứ 3 cho #38).
- Gap stats tính lại bằng code riêng (recount-l6.py): CERT n=21 tái
  hiện K6 100% (mean 1h51'38", median 1h58'47", p10 1h08'24", p90
  3h01'21"); CERT n=22 = mean 1h52'05", median 1h59'16", p10
  1h08'41", p90 2h57'18", sd 43'58"; FULL n=32 = mean 2h01'58",
  median 1h59'16", p10 51'50", p90 3h05'08", sd 1h03'55", 17/32 trong
  90–150', 4 <60', 6 >180', 2 >240'. Gap #36→#37 = 2h01'46" certified
  → n=22. Gap #37→#38 = 1h29'03" chỉ là cận trên.
- Wave scan tính lại trên 120 log file: 0 "vẫn bật", 0 "CẢNH BÁO",
  0 "Operation not permitted", **19 "đã tắt"** (toàn false positive
  của launcher).
- WFS scan tính lại: NEWSTD **577 dòng / 174 file**, R7B **602 / 191**,
  copies **25 / 17**; 577+25=602 ✓; scope 2782 file (NUL entries trong
  files-newstd.bin = 2782 ✓); chênh +20/+4 phân rã khớp grep trực tiếp
  (GAP_ANALYSIS 19, probe110l3 7, probe110l4 5, K6 LIMITS 6, round109
  LIMITS 1).
- Async `.writeFile(`: đúng 2 vị trí, đều trong helper
  `writeFileEpermRetryAsync` (eperm-retry.mjs:71, epermRetry.js:116).
- K9 poll.log đoạn A kiểm lại: 9 poll 23:40:25Z→00:52:23Z, gap giữa
  các poll tối đa 601 s = 10'01" ✓.

Đính chính:
1. "506 mốc giây" = 506 giá trị mtime riêng biệt ở độ chính xác đầy
   đủ; số giây nguyên riêng biệt = **350**.
2. Phạm vi đầy đủ của "đã tắt" trong wave: **23:48:19Z → 01:47:08Z**
   trong run-k1.log (16 dòng) + round109-k9-o8.log (3 dòng); câu L6
   "23:48:19Z → 00:14:32Z (của K2/K4/K5/K7)" chưa đủ/sai quy kết.
3. Lỗi đánh máy đường dẫn §2.7: `./docs/PHASE9_GAP_ANALYSIS.md` phải
   là `./PHASE9_GAP_ANALYSIS.md` (dữ liệu scan đúng, 19 hit).

## 7. L7 — F6' WebKit lượt yên: KHỚP kèm đính chính (F6' ĐÓNG)

(Tính lại bằng recount-l7.py, code riêng, từ JSON thô + ground-truth
stripes round97-y2. Mọi số dưới đây đều tái hiện đúng.)

- **Cửa yên là thật:** poll 45 (03:36:17Z) load **0,31/1,78**,
  blockers=0 (không vite/MiniBrowser/WebProcess/node probe/hog nào của
  luồng khác), không vite.lock — kiểm từ `poll-l7.log` + định nghĩa
  blocker trong `poll-l7.sh`. Chờ 44 phút (poll 1–44, 02:52–03:35Z),
  trong giới hạn prereg 90 phút; không chạy lượt nhiễm tải. Lượt duy
  nhất 03:36:17–03:37:35Z (78 s), case B, 20 pass, `--disable-rvfc`,
  flip sau pass 5 (wallMs=25611), tap ON + relabel ON, vite :5184
  (config tạm `vite.config.l7-temp.ts`, watch ignore tất cả, lên sau
  2 s, 0 crash ENOSPC), Xvfb :193, probe_exit=0. JSON
  `preview-b-f3-flip-land-webkit-quiet.json` (3.285.148 byte).
- **Bar F6' (1): 53/53 = 100,0%** tick skippedLatest=1 hậu flip+2000ms
  không chứa ghost label==presented; **(2) pixel-verified: 53/53 =
  100,0%** (0 ứng viên ghost label==presented → 0 strip kiểm, 0 vi
  phạm thật). n=53 ≥ 30, bar ≥90% → **F6' ĐÓNG theo prereg**. Đối chứng
  skp=0: 228/228 cả (1) và (2). BlendTick 390 (viaRvfc=0: 390); tick
  hậu flip+2000ms: 281; gap presented−expected 281/281 = 100% (tất cả
  đúng 0, median 0, min/max 0); anchorSrc frameIdx 281/281 (100%),
  tap 0. pageErrs [].
- (3) strip khớp presented, label khác: skp=1 alias 26 / đáng ngờ 7 —
  đúng 7 ca L7 liệt kê: (144, 29, 22), (178, 51, 42), (237, 32, 26),
  (269, 34, 27), (278, 57, 49), (326, 22, 6), (327, 22, 6); skp=0
  alias 33 / đáng ngờ 64.
- (4) label-clean distinct: skp=1 15/28 = 53,6%; skp=0 37/90 = 41,1%;
  mọi-occurrence skp=1 87/100 = 87,0%, skp=0 164/327 = 50,2%.
  Clean distinct hậu flip (mọi skp): **37/90 = 41,1%**; mọi-occurrence
  **251/427 = 58,8%** ✓ (K7: 43,1% / 57,2% — nhãn ghost nhiễu là
  cấu trúc, không phải do tải).
- **tickCost total: n=502, median 40,5 ms, p90 64,9, max 94, min 27**
  ✓; hậu flip median 40,0 ms. Ngưỡng prereg median ≤100 ms được giữ.
- **gStd spread** (từ chính JSON probe): gStdSpread 0,5/76 (98 nhóm);
  gStdSpreadDrawn **0,6/76 (48 nhóm)**; DrawnPresented 0,3/76 — khớp
  L7 (yên: 0,6 ngang Chromium 0,7; K7 nhiễm tải: 47,4).
- **Trễ nhãn–pixel (c2) tính lại:** skp=1: **n=7, median 8f (267 ms),
  p90 16f, max 16f (533 ms), min 6f** — đúng 7 ca: (144,29,22,7),
  (178,51,42,9), (237,32,26,6), (269,34,27,7), (278,57,49,8),
  (326,22,6,16), (327,22,6,16); skp=0: **n=64, median 4f (133 ms),
  p90 7f, max 16f, min 1f** ✓. (a) median 0f/p90 1f/max 2f (skp=1),
  0f/2f/2f (skp=0); **(b) n=0 cả hai** (strip 48px không xác định duy
  nhất 1 frame) ✓; (c) skp=1 n=33 median 14f, skp=0 n=97 median 5f ✓;
  (c1) alias skp=1 n=26, skp=0 n=33 — gồm ca lag 58f (seq 126,
  label 0 → presented 58, alias do footage tuần hoàn) ✓; (d) nomatch
  0/106 và 0/456 ✓. Cụm lệch 18f của K7 (seq 301–306) KHÔNG tái hiện;
  cụm mới seq 326–327 lệch 16f.
- Cây đo: `9b27abe5…` (L1-fix), nhất quán trước/sau probe — khớp §0.1
  (diff ced42efd→9b27abe5 = **58 dòng diff**, đã đếm lại; chỉ chạm
  call-site syncMedia + module drift-confirm skip, không chạm đường
  ghost/ring/skipLatest). Hồi quy L7 trên cây này (tsc 0, vite build
  PASS 6,59 s, ghostBlend 15/15, previewEngine 27/27, E4 test 5/5)
  được cây gộp của L9 chạy lại độc lập ở §8 (cùng kết quả).

Đính chính:
1. §0 "Gap #38→#39 = 26'03" — sàn reboot lại bị phá (sàn cũ 31'47"…
   không còn sàn nào đứng được)" **sai** (xem §0.1): 26'03" không phá
   sàn 19'07"; không có "sàn cũ 31'47"" nào trong khoảng đã chứng nhận
   [19'07", 3h14'08"].
2. Caveat (2) L7 đã tự ghi rõ: (2) đạt 100% vì (1) đã loại hết ứng
   viên (0 ghost label==presented) — kiểm pixel lại không có ứng viên
   để kiểm. Bảo đảm mức pixel ("snapshot trong pool không bao giờ mang
   pixel của presented") vẫn CHƯA có — nợ đo lường mới, không phải lý
   do giữ F6' mở (bar đã định nghĩa rõ từ K7).
3. Vite mồ côi của L7: vite :5184 (pid 21711, chạy từ 03:36:18Z) vẫn
   sống sau khi agent L7 xong (done 03:46:44Z). L9 đã kill bằng TERM
   lúc ~03:58Z trước khi chạy suite cuối (cổng 5184 về 000, không còn
   vite) — an toàn vì lượt đo đã xong từ 03:37:37Z. Ghi nhận mẫu vite
   mồ côi thứ 2 trong đợt (cùng mẫu L8 §3.4).

## 8. L8 — Infra WebKit + vite: KHỚP kèm đính chính

- **Apt replay là đường bền vững — đã chứng minh bằng reboot #39:**
  plugin dir hệ thống đếm lại **270 file** (debroot 269) ✓; launch
  JSON kiểm lại: o8env 03:02:01Z version 27.2 eval 2, 28392 ms;
  clean 03:02:53Z, 26308 ms — khớp §2.3. Postboot-check lần 2
  (03:08Z): PASS toàn bộ, "ĐỦ ĐIỀU KIỆN chạy WebKit" ✓ (log
  `l8-postboot-check2.log` đọc lại).
- **Watch A/B đo lại khớp log `l8-watch-measure.log`:** baseline
  total_wd=14; A (config gốc) total 1598 / vite **1585**, trang 200;
  B (watch.ignored) total **14** / vite **0**, trang 200; sau kill về
  14/0. Kết luận 0 watch đứng ✓ (lưu ý L8 tự ghi: chỉ số
  `inotify_fds_of_vite_pid` = 0 cả A lẫn B là sai do pgrep trúng vỏ
  npx — số đúng là vite_wd + tổng cell).
- **O8 WebKit sau sửa: 21/21 PASS, 0 fail, exit 0** — kiểm lại từ
  report JSON thô `o8-webkit/o8w-clicktest-report.json`: n=21,
  ok=true 21/21 ✓ (03:26:37–03:27:29Z). Đây cũng là bằng chứng decode
  video WebKit trên boot #39.
- **Script postboot-check tồn tại trong repo, +x, `bash -n` OK** ✓
  (`apps/web/scripts/vcut-webkit-postboot-check.sh`, 6940 byte).
- **O8 script sửa `node --check` OK** ✓ (lỗi comment `**/` đã sửa).
- **Log append 4 chỗ đã sửa** (O8 webkit .mjs; run-k7.sh,
  run-k7-quiet.sh, k8-enospc-vite.sh) — `bash -n` OK (không chạy lại
  từng script, chỉ kiểm syntax + đọc diff; O8 end-to-end đã chạy
  thật sau sửa).
- **Phần C (trade-off stale-module) VÔ HIỆU, L8 tự ghi rõ** (cờ
  `--root` sai + vite B mồ côi làm nhiễu) — không dùng số phần C.
  Script đã sửa cho đợt sau.
- Headroom: số 248×3 / 1854 / 2127 **không có log thô riêng lưu lại**
  (chỉ có trong LIMITS + script probe `l8-headroom.py`); số học nội bộ
  nhất quán với trần 63747 (lúc L5 vite chạy: cell 1632 wd = vite
  1609 + systemd 14 + chrome 9; ngoài cell ~61,8k). Ghi nhận là
  "LIMITS-only", không bác bỏ.

Đính chính:
1. §2.1 "gap #38→#39 = 26'03" — sàn gap mới (sàn cũ 19'07")" **sai**
   (xem §0.1).
2. §4.2 "52 file clicktest-*.mjs vẫn mở vite log bằng `"w"`" — đếm lại
   sau khi L8 sửa xong: **51 file**. 52 là số đếm TRƯỚC khi sửa (gồm
   chính script O8 webkit mà L8 đã đổi sang `"a"` — kiểm lại: script
   O8 hiện có 0 match `"w"`, 2 match `"a"` ở dòng 220/301). Nợ còn
   lại là 51, không phải 52.
3. §6 nghi ngờ "L7 chạy vite lúc 02:58–03:0x trong khi L5 giữ lock"
   — **đã giải quyết bằng đĩa**: vite log của L7
   (`vite-5184-l7.log`) bắt đầu **03:36:18Z**, sau khi L5 nhả lock
   (03:25:44Z); vite lúc 02:58 là vite run28 của L5 (log
   `e1-run28/c77e1-headed-vite.log`, mtime 02:54:58Z; L5 giữ lock lúc
   đó). **L7 không vi phạm lock.**
4. §9.5 "Symlink GST 02:57Z chưa rõ ai tạo" — **đã rõ: L1 tạo**
   (LIMITS L1 §8: "vá lại tay 02:57Z"). Không còn là ẩn số.
5. §6 "lock dir của L4 không có file owner" — ghi nhận đúng (L8 đã
   nêu); đề xuất chuẩn hóa protocol lock (ghi owner nguyên tử + kiểm
   tra tiến trình vite thật) vẫn đứng.

## 9. Cây gộp cuối đợt — L9 tự chạy (03:58–04:12Z, boot #39, máy yên)

Trước khi chạy: `ps` không còn vite nào (đã kill vite mồ côi L7 pid
21711, xem §7.3); giữ `vite.lock` có owner `l9-verify`, nhả sau khi
xong. `preview.tsx` md5 `9b27abe5…` trước/sau mọi lượt kiểm — không đổi.

### 9.1 Suite 27 mục — 27/27 exit 0 (log `round110-l9-suites.log`, 886 dòng)

| Mục | Kết quả |
|---|---|
| tsc-web | exit 0 (0 lỗi) |
| tsc-desktop | exit 0 (0 lỗi) |
| vite build | PASS, built in 6,46 s (chunk >500 kB cảnh báo cũ) |
| playheadHold90R2 | 75 passed |
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

### 9.2 O8 21/21 cả 2 engine (log `round110-l9-o8.log`)

- Chromium 04:10:08–04:11:01Z: **21/21 pass, 0 fail, 0 note**,
  exit 0; report JSON `o8-chromium/o8-clicktest-report.json`: n=21,
  ok=true 21/21.
- WebKit 04:11:01–04:11:54Z (LD_LIBRARY_PATH debroot): **21/21 pass,
  0 fail, 0 note**, exit 0; report JSON `o8-webkit/o8w-clicktest-report.json`:
  n=21, ok=true 21/21. S7: mask Δx=0,194, bóng Δx=0,197 (kỳ vọng
  0,194).

### 9.3 File production đổi so với đầu đợt (tìm file đổi từ 02:30Z)

Chỉ L1 đổi production: `apps/web/src/preview.tsx`,
`apps/web/src/lib/driftConfirmSkip103E4.ts`,
`apps/web/src/lib/driftConfirmSkip103E4.test.ts`. Ngoài ra chỉ có
script/benchmark/docs (đều nằm trong batch §9.4) + 1 file mồ côi của
L3 (`apps/web/scripts/probe110l3-frame-parity.mjs`, chưa stage).
`PHASE9_GAP_ANALYSIS.md` mtime 01:54:18Z — đổi trước đợt 110, không
tính. Không có file lạ nào khác đổi trong đợt.

### 9.4 Đếm batch từ đĩa (đọc trực tiếp paths-loop)

| Batch | Entry |
|---|---|
| phase9-round110-l1-rearm.txt | 4 |
| phase9-round110-l2-2mib.txt | 5 |
| phase9-round110-l4-blur.txt | 2 |
| phase9-round110-l5-harness.txt | 1 |
| phase9-round110-l6-eperm.txt | 1 |
| phase9-round110-l7-webkit-ghost.txt | 1 |
| phase9-round110-l8-infra.txt | 3 |
| phase9-round110-l9-verify.txt (L9) | 1 |
| **Tổng đợt 110** | **8 batch / 18 entry / 18 file duy nhất** |

**0 binary, 0 `.github/workflows/*`.** Mọi file staged đều tồn tại
trên đĩa. 6 file >37.768 byte (cần `ENABLE_PRIVSEP=0` khi push):
preview.tsx 439.893 B; webkit_blob_flaky_110l2_2mib.mjs 63.956 B;
webkit-blob-flaky-110l2-2mib.json 60.930 B; clicktest-87o8-mask-track-
webkit.mjs 53.857 B; PHASE9_ROUND110_L6_EPERM_LIMITS.md 43.090 B;
probe110l4-frame-parity.mjs 38.823 B. **Lũy kế chờ push đợt 106–110
(đếm trực tiếp từ paths-loop): 47 batch / 94 entry / 90 file duy nhất
+ 1 file oversize** `benchmarks/results/webkit-blob-flaky-96x3.json`
(6.370.678 B, vẫn chờ). Chú ý: preview.tsx trùng giữa đợt 110 và đợt
trước (18 file đợt 110 nhưng chỉ +17 unique mới so với 73 của đợt
106–109: 73+17=90).

## 10. Nợ mở sang đợt sau (cập nhật từ LIMITS gộp đợt 109 §4)

1. **G1 + mù #22 chờ user quyết** (metric G5/M2; mù #22 cửa sổ lý
   thuyết ≤78 s) — không đổi.
2. **E4: KHÔNG ĐÓNG.** Cơ chế pause-deadlock đã chết, nhưng còn nợ
   mới: cuộc đua tail-ceiling 5000 ms vs restart-ended seek ở biên
   cuối clip (l1f3). Cần luồng riêng + A/B xác nhận lại 2+2 trên cây
   đó; hoặc user quyết "đóng có điều kiện" cho E4 vì cơ chế E4 đã xong
   và CAP còn lại thuộc hệ khác (đề xuất L1 §6).
3. **2 MiB offset +4.194.304:** đã xác nhận trên c8 (L2). Còn lại:
   G6 §8.5c preload-before-seek chưa đo; ring 8 MiB trên c8 chưa đo.
4. **Zombie gate (b) dạng mạnh + stall chuyển clip 5 s: VẪN MỞ.**
   L3 đợt này không chạy được lượt nào (gián đoạn reboot #39, không
   giao lại). Cần chạy lại từ đầu đợt sau (3 lượt freeze dial [3,8]
   + điều tra stall + dial generator + ring draws + quyết định bar
   CDP). Tần suất gộp J3+K3+L3: dạng mạnh quan sát được 1 lần (K3 R2)
   — chưa lặp lại.
5. **E6: ĐÃ ĐÓNG (L4 đợt này, 18/18).** H-alt không tái hiện 2 lần
   liên tiếp — dừng dùng H-alt để diễn giải.
6. **E1 bar ≥7: ĐÃ ĐẠT (L5 run31).** Wilson gộp 2/37 [1,5%, 17,7%].
   Gate tải v2 đã vá lỗ K5 §6.3 (run30 chứng minh).
7. **EPERM probe #30 + mù #29 đợt sau** (mù #28 KHÔNG đóng hoàn toàn
   — khe 4'32" còn lại, xem §6).
8. **F6': ĐÃ ĐÓNG (L7 lượt yên).** Nợ đo lường mới (không thuộc F6'):
   bảo đảm mức pixel chưa có (cần gán nhãn lúc capture xong hoặc
   fixture không tuần hoàn để đo trễ tuyệt đối từng ghost); ngưỡng
   WebKit median ≤100 ms chưa phân biệt được tải (cần ≥3–4 lượt nữa
   mới đặt ngưỡng chặt); nhãn ghost WebKit vẫn nhiễu 41,1% (cấu trúc);
   capture lag max ~16f (533 ms) tái diễn (cụm mới seq 326–327).
9. **ENOSPC: vite nối tiếp bắt buộc** (headroom 248–1854; 1 vite =
   1578 watch). `watch.ignored ["**/**"]` đã chứng minh 0 watch (L8)
   — áp dụng cho mọi vite tạm của luồng đo. Phần C (trade-off
   stale-module) chưa đo — script đã sửa, đợt sau chạy lại.
10. **WebKit sau reboot: đã có đường bền vững** (apt replay + script
    postboot-check, L8). Replay mất ~17 phút sau boot mới đủ package
    — probe WebKit đầu đợt sau reboot phải chạy postboot-check trước.
    Vite mồ côi: đã có 2 vụ đợt này (vite B của L8 §3.4; vite L7 pid
    21711 do L9 dọn) — kill vite phải theo pid node thật, kiểm `ps` +
    `curl` cổng sau khi kill.
11. **Birefnet 0 lần thành công** — chỉ thử lại khi RAM đổi (guard
    6 GB; RAM khả dụng ~1,0–2,3 GB). **TTS 39 CẤM kiểm lại.**
12. **ci-security.yml vẫn 403, chờ user** (workflow chưa từng lên
    GitHub). **Release gate không đổi** (chỉ release khi ngang/hơn
    CapCut thật). **KHÔNG push** khi user chưa nhắn "push đi".

## 11. Ghi chú verify (L9)

- Poll L9: POLL#0 02:52:22Z → POLL#12 03:52:24Z (mỗi 300 s, tối đa
  24). 7/8 done lúc 03:47:24Z (L1, L2, L4, L5, L6, L7, L8); L3 không
  bao giờ có cờ. Hạn chờ ~2 h từ 02:40Z (≈04:40Z) — L9 không chờ hết
  hạn vì L3 đã xác nhận `interrupted` ở runtime từ ~02:51:23Z và
  không có bản giao lại (khác L6); chờ thêm không thay đổi được gì.
  Nếu L3 được giao lại muộn sau khi L9 xong, ghi addendum vào LIMITS
  này thay vì verify lại toàn bộ.
- Reboot trong đợt L9: #37 00:55:42Z, #38 02:24:45Z, #39 02:50:48Z
  (gap #38→#39 = 26'03" — không phá sàn 19'07", xem §0.1). Reboot #39
  cắt poller L9 lần 1 + 1 exec sleep-600 (SIGTERM ~02:51Z); poller
  khởi động lại sau reboot, POLL#0 mới 02:52:22Z.
- L9 không chạy suite cuối trước khi 7/8 luồng xong (tránh tranh
  vite); suite chạy 03:58–04:02Z, O8 04:10–04:12Z, đều sau khi L7
  xong và vite mồ côi L7 đã dọn.
- Không có luồng nào sửa production ngoài L1 (kiểm bằng find file
  đổi từ 02:30Z, xem §9.3).

## 12. File đã đổi + batch (KHÔNG push)

- LIMITS này: `docs/PHASE9_ROUND110_L9_VERIFY_LIMITS.md` (mới).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round110-l9-verify.txt`
  (NUL-delimited, 1 file text trên).
- Scratch/log: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round110-l9/`
  (recount-l1.py/.txt, recount-l2.py/.txt, recount-l4.py/.txt,
  recount-l5.txt, recount-l5b.txt, recount-l5c.txt, recount-l6.py/.txt,
  recount-l6-blind.txt, recount-l6-wave.txt, recount-l6-wfs.txt,
  recount-l6-wfs2.txt, recount-l7.py/.txt, round110-l9-verify.sh,
  round110-l9-suites.log, round110-l9-o8.sh, round110-l9-o8.log,
  o8-chromium/, o8-webkit/, poll-l9.sh, poll-l9.log,
  baseline-md5.txt, baseline-tsc-build.log).
- Cờ done: `hidden_files/round110-l9-done` (tạo ngay khi LIMITS +
  batch xong).
