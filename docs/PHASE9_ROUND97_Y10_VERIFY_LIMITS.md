# PHASE9_ROUND97_Y10_VERIFY_LIMITS — Kiểm chứng độc lập toàn bộ đợt 97 (Y10)

> Luồng Y10. Lượt cron 18:35 +07 12/11/2026, đợt 97 spawn 11:35Z (18:35 +07).
> Repo `~/workspace/repo-1` (cây làm việc, HEAD GitHub vẫn `5f548ef8`).
> **KHÔNG push. KHÔNG release/tag. Không sửa production trong luồng này.**
> Scratch: `hidden_files/round97-y10-*` (poll, verify, O8). Chỉ dọn 1 process
> mồ côi (Xvfb :193 của Y5, xem §3.4) để chạy lại test — không đụng code,
> không đụng file của luồng khác.

## 0. Dòng thời gian + phương pháp

- Đợt 97 spawn 11:35Z, 9 luồng Y1–Y9 (+ Y10 verify). Boot `d8dc09fe`
  (reboot #19, 11:30:25Z — Y8 chốt giờ chính xác từng giây, xem §2.8).
  Không reboot trong lúc Y10 làm việc (boot giữ nguyên tới cuối lượt).
- Y10 poll đĩa từ 11:38:02Z (poller `round97-y10-poll.sh`, 5 phút/lượt,
  log `round97-y10-poll.log`): poll 1 (11:38Z) 0 luồng về; poll 4
  (11:53Z) Y6+Y8 về; 12:06Z Y1+Y3+Y6+Y8+Y9 về (Y2 đã có LIMITS, chưa
  batch); 12:15Z Y4+Y7 về; 12:28Z Y2 về (batch + re-verify trên cây
  hiện tại); **12:40:34Z ALL LANDED theo đĩa — 9/9 LIMITS + 9/9 batch**
  (Y5 về cuối). Poller dừng tay lúc đó.
- **Lưu ý poller:** tiêu chí poller (md + batch cho mỗi luồng) KHÔNG BAO
  GIỜ đạt được vì **Y4 không có file `round97-y4.md`** (chỉ có LIMITS +
  batch + thư mục `round97-y4/`). Theo lệ X9b, hạ cánh tính theo đĩa
  (LIMITS + batch có trên đĩa) — Y4 tính là đã về. Poller ghi
  `all-landed=0` tới lúc dừng tay là đúng tiêu chí hẹp của nó, không
  phải luồng thiếu.
- Kiểm chứng chạy trên cây gộp cuối cùng: suite offline 12:42–12:46Z
  (`preview.tsx` mtime 12:02:15Z, md5 `a0a078e1`, ổn định từ 12:02Z),
  O8 WebKit 12:48–12:49Z + Chromium re-run 12:50–12:51Z (xem §1.3 về
  lần chạy đầu exit 2).
- Đối chiếu số headline: đọc file thô/JSON gốc trên đĩa cho cả 9 luồng,
  tính lại độc lập bằng script (Y1 JSON+GST log+byte file; Y2 JSON +
  analyze output; Y3 JSON; Y4 analyzer chạy lại; Y5 JSON; Y6 analysis;
  Y7 probe JSON; Y8 heartbeat/scan; Y9 analyze-slots chạy lại).

## 1. Kiểm chứng trên cây gộp — TOÀN XANH (2 sự cố môi trường, đã xử lý)

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 6,52 s** |

### 1.2 Suite offline (log `hidden_files/round97-y10-verify.log`, xong 12:46:06Z)

| test | kết quả |
|---|---|
| playheadHold90R2 | **50 passed**, exit 0 (44 cũ + 6 mới Y4-R1..R6) |
| playheadPacing54K9 | 19 pass, 0 fail, exit 0 |
| previewEngine | 18 test passed (mask) + **25 test passed** (rvfc), exit 0 |
| seek | 21 passed, exit 0 |
| seekSkipRender86N3 | 9/9 test pass, exit 0 |
| previewLoop50F2 | 20 passed, exit 0 |
| ghostBlend.probe | **15 kiểm chứng xanh**, exit 0 |
| css60 (cssClasses60Q2) | PASS 60/60, exit 0 |
| css61 (cssClasses61R4) | PASS 60/60, exit 0 |
| Audit P7 (i18nAudit59P7) | **8/8 pass qua esbuild ESM bundle** (chạy lại: `P7 i18n audit round 59: 8/8 pass`). Bản chạy `node --experimental-strip-types` exit 1 — **lỗi runner đã biết**: `ERR_MODULE_NOT_FOUND` import không đuôi `./nestedPreview`, đúng như X9b đã ghi. Không phải lỗi audit. |
| orphans (binOrphan60Q7) | 17 pass, 0 fail, exit 0 |
| r6-i18n-check | PASS — dict vi==en==**2767 key** lá, 0 key mồ côi (không đổi) |
| U4 fail-fast | 141 pass, 0 fail, exit 0 |
| media (run-media-tests.mjs) | blobPrefetch **25 pass**, captureThumb **2 pass**, retryPlay95W2 **7 pass** — 3/3 PASS |
| media.retryPlay96X3 (X3, esbuild) | 7 pass, 0 fail, exit 0 |
| media.stallWatchdog96X3 (X3, esbuild) | 9 pass, 0 fail, exit 0 |
| deint-fps-verdict (X6) | pass 17, fail 0, exit 0 |
| vite-diagnosis-regex (X6) | pass 9, fail 0, exit 0 |
| Xvfb lock test | **FAIL lần đầu (2 lỗi) → PASS sau khi dọn mồ côi** (xem §3.4) |

### 1.3 O8 — 21/21 cả 2 engine (log `hidden_files/round97-y10-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| WebKit (:190/5562/9654) | 12:48:57–12:49:13Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |
| Chromium (:189/5552/9652) | re-run 12:50–12:51Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |

Số Δx khớp **đúng từng chữ** với O8 của X2/X3/X9b trên cùng cây
(Chromium 0,112/0,113; WebKit 0,194/0,197) — mask-track ổn định qua
đợt 97 dù `preview.tsx` đổi 4 luồng.

- **Chromium lần đầu exit=2 (không phải lỗi O8):** scratch mới
  `round97-y10/o8-chromium` thiếu fixture (`o8-white-720p-6s.mp4`,
  `o8-ball-720p-6s.mp4`, `o8-track-35-65.json`) — script báo rõ và
  dừng. Đã copy 3 fixture từ `round96-x9b/o8-chromium` (scratch của
  X9b, không phải file repo) rồi chạy lại: 21/21. Bài học cho verify
  sau: copy fixture TRƯỚC khi chạy O8 Chromium.
- **WebKit dùng env khác:** script webkit đọc `O8W_SCRATCH`, không
  phải `O8_SCRATCH` — lần chạy này nó dùng thư mục mặc định
  `round87-o8/webkit` (artifacts tươi 12:48–12:49Z, `o8w-*`). Kết quả
  vẫn đứng (log + artifacts khớp thời gian).

## 2. Đối chiếu từng luồng — số headline KHỚP, không lỗi số nào

### 2.1 Y1 — blob 2 MiB: KHỚP, phát hiện mới đã xác minh byte

- JSON đủ 24 case (a) + 36 case (b). Tính lại từ JSON thô: (a) blob
  strict 2/12 (failKind ok=2), loose 7/12, prog 12/12, failKind blob
  stall-timeout 4 / error-event 6 / ok 2; (b) strict 7/18, loose 18/18,
  prog 18/18, failKind blob ok 7 / error-event 11 — khớp đúng bảng §1.
- Phân tầng tải tính lại từ `summary.txt` (đối chiếu JSON): (a) band
  load1<3: n=6 strict=2 bogus-log=5; band ≥3: n=6 strict=0 bogus-log=5;
  (b) band <3: n=5 strict=0 bogus-log=3; band ≥3: n=13 strict=7
  bogus-log=5 — khớp LIMITS §2.
- Grep độc lập GST log: (a) 10/12 log blob có `bogus size`; (b) 8/18 —
  khớp.
- **Hai giá trị bogus mới xác minh byte trực tiếp trong `c2.mp4`:**
  2854668610 tại offset 2097184 (= 2 MiB + 32) và 162705492 tại offset
  2100315 (= 2 MiB + 3163); cả hai chỉ xuất hiện đúng 1 lần trong toàn
  bộ file; giá trị cổ điển 541230788 tại 2097152 cũng khớp + duy nhất.
  Cả hai giá trị mới đều có trong GST log thật (run2 / run6). Diễn giải
  "nhảy +2 MiB giữa pull" đứng trên bằng chứng này.
- Fail⇒bogus lịch sử tính lại: 24+7+0+8+9+8 = **56/63 = 89%** — khớp.
- Không sửa production (`media.ts` mtime 09:56:43Z không đổi).

### 2.2 Y2 — ghost double-count: KHỚP, phán quyết đứng

- JSON `preview-abcde-assert97y2b.json` (5.460.303 B): pump event/case
  a 340, b 343, c 332, d 318, e 278; blend tick 644/657/599/579/459
  (459–657) — khớp LIMITS §3. Late capture: chỉ 1 (case d, seq 1279);
  tổng capture B–E = 343+326+316+272 = **1257** → 1/1257 = 0,08% ✓.
  tickPresentedOffset B 0:623/+1:33/−1:1, C 0:431/+1:112/−1:56,
  D 0:415/+1:136, E 0:348/+1:85 — khớp đúng §3.2.
- Analyze output trên đĩa: mẫu 37/84 hợp lệ **1565**, bucket 84 n=**327**
  (20,9%); triple-consec trong bucket 84: 165 (50%) — khớp §3.3.
  V6: triple(P) **444/515 = 86,2%**, confusion (37,37):335, (37,84):70,
  (84,37):1, (84,84):109; triple(expected) 441/515 = 85,6%;
  dbl(P) 54/515 = **10,5%**; meas−triple(P) med +0,1, p10 −45,8,
  p90 +0,3 — khớp đúng §3.7.
- V5 sim: triple min 39,6 max 89,8; K=3 (mod6=3) triple 89,7; K=2
  triple 39,6 — khớp §3.6.
- V10: outlier v6 = **71** — khớp §3.10.
- Log assert97y2b: `ASSERT PASS: tất cả kiểm tra xanh`, exit=0.
- Pump event log: 13 marker "Đợt 97 Y2" còn đủ trên cây gộp; không sửa
  hành vi production (chỉ đo + log).

### 2.3 Y3 — retry-play lỗi muộn: KHỚP, nợ ĐÓNG (1 chú thích về tiêu chí)

- JSON 24 case, 0 runError. Tính lại từ JSON thô:
  - ERRBASE: errAfterPlayS 0,79–2,40; retry95 4/4; rescued 4/4;
    frames 65–198 — khớp.
  - LATEBAD4: err 8,40–9,21; retry95 8/8; rescued 8/8; frames 90–163 —
    khớp.
  - LATEBAD8: err 16,71–17,29 (**max 17,29 s**); retry95 4/4;
    retryAtS == canplayAfterErrT chính xác cả 4 case (19,18 / 18,21 /
    18,20 / 18,51); frames 4–25 — khớp.
  - LATEGOOD4: 0 error, 0 retry; frames 60–181 — khớp.
  - LATEBAD4TICK: err 8,43–8,89; retry95 0/4; rescued 4/4; frames
    59–174 — khớp.
- **Chú thích (LIMITS Y3 §4 đã ghi rõ, nhắc lại khi trích):** bảng §1
  ghi LATEBAD8 "rescued 3/4" theo tiêu chí finalCt > 1; thực chất
  retry đã bắn 4/4 và phát lại tiếp tục 4/4 (c2-run1: 4 frame, ct 0,25
  trong 0,73 s còn lại của wall 20 s). Đừng trích "3/4" mà không kèm
  chú thích này.
- Không sửa production (chỉ probe + JSON + LIMITS).

### 2.4 Y4 — re-arm: KHỚP, nợ giảm thêm chưa đóng

- Analyzer Y4 chạy lại độc lập trên JSON gốc đợt 96:
  - b1: "tick ph nhảy hại: 2" — gồm relMs=8411 Δph=0,600 Δct=0,033
    drift=0,000 (ca bắt thêm) + relMs=11417 (ca cũ) — khớp §1.1.
  - b5: "tick ph nhảy hại: 0" — ca b5 (relMs≈5270) **vẫn sót** dù
    ngưỡng đã nới 1,5 frame (do bộ lọc seeking-window) — khớp §1.1;
    "seeking kẹt >=3s: 1" — khớp.
- Analyzer hậu-fix (`analyze-post3-y4.txt`) đọc lại: d1 tail sống=3,
  d2 tail sống=4, d3 tail sống=4 + grace-bật + drift vượt=2
  (relMs 5709 maxDrift 0,406; relMs 12590 maxDrift 0,400); gộp tail
  sống=**11**, grace+drift=**2**, BỊ CHẶN=0, LỌT=0; CANCELLED=0 — khớp
  đúng bảng §1.3.
- 8 marker "Đợt 97 Y4" còn đủ; 6 test Y4-R1..R6 có trong file test;
  Hold 50/50 trên cây gộp (Y10 §1.2).
- Phát hiện mới "stall bò" (d3 §3.3) và analyzer sót b5 đã ghi rõ
  trong LIMITS Y4 — đúng phạm vi, chưa sửa.

### 2.5 Y5 — watchdog đóng băng: KHỚP, chưa chứng minh in vivo

- Code: `"no-callback-frozen"` ×3 trong `preview.tsx` (lý do kill +
  comment + điều kiện đếm silent-kill); `frozenSinceMs` /
  `lastCurrentTime` ×12 — đường kill tồn tại trong code. 4 marker
  "Đợt 97 Y5" còn đủ.
- Grep toàn bộ scratch Y5: chuỗi `"no-callback-frozen"` chỉ xuất hiện
  trong `summary.py` (dòng code đếm), **0 lần trong dữ liệu chạy** —
  khớp "0 lần bắn trong 17 lượt headed".
- Memo c2 blind tính lại từ JSON thô 6 lượt wk-blur (ringFirstAt −
  phCross): r6 7593−7594 ≈ 0; r7 7977−7977 = 0; **r8 8258−7773 = 485 ms**;
  r9 7201−7202 ≈ 0; r10 7744−7744 = 0; r11 8003−8004 ≈ 0 — khớp
  "13/14 ≈ 0 ms, 1/14 = 485 ms" (6/14 lượt kiểm trực tiếp, cùng mẫu).
- Blind c1 wk r6: ringFirstAt 5029 − phCross 3937 = 1092 ms — khớp
  min 1092 ms trong bảng §2.1.
- 17 lượt có kết quả + 1 lượt mất (wk-freeze-r9): thư mục r1–r9 +
  wk-blur r6–r11 (6) + chr 3 = 17 lượt có kết quả; r9 không có JSON
  kết quả — khớp LIMITS §3.4.
- Y5 không chạy lại O8 (không đụng render) — Y10 đã chạy O8 trên cây
  gộp: 21/21 cả 2 engine (§1.3), bù chỗ này.

### 2.6 Y6 — blur fix-3: KHỚP

- `analysis.txt`: D gộp r6+r7+r8 **3/457 (0,7%) mean 0,307 sd 0,001** —
  khớp §1a. B-band chính (wk-base): r4+r5 n=5/19, r6 n=2/9, r7 n=1/7;
  gộp **n=8/35 mean 0,774 med 0,775 sd 0,012**; pair-like n=2,
  dc-like n=6 — khớp §1b.
- `supplement.txt`: chr-base gộp wk B **n=36/107 mean 0,766 med 0,767
  sd 0,016**; B thấp [0,70–0,76): **n=15** (mean ~0,752) → pair-like
  15 / dc-like 21 — khớp §1b (42%/58%).
- Cap D dị thường: `D: c0 fi=9 g=0.307 tag=tick last=9 prev=3 pres=9
  ringSize=2 skipped=1 relPlay=1929` — khớp đúng từng trường §2.
- Không sửa production (chỉ đo + probe).

### 2.7 Y7 — zombie pump: KHỚP

- Probe JSON thô (`frame-parity-results.json`):
  - base2: dbgFinal caps **55/75/59**, lastFrame 40/41/87, fb "" — khớp.
  - fix1: caps **19/19/36**, lastFrame 89/89/89, fb
    "clip-change"/"clip-change"/""; fbAt c0=**3614**, c1=**7047** — khớp.
  - fix2: caps **46/27/37**, lastFrame 89/**2**/88, fb clip-change ×2;
    fbAt c0=**4483**, c1=**7820** — khớp (1 capture zombie sót ở c1,
    lastFrame=2, đúng §2).
- Helper `rvfcKillZombiePumpsOnElement` + lý do `"clip-change"` có trong
  `preview.tsx` (grep 4 hit: def + call site + reason + comment);
  2 marker "Đợt 97 Y7" còn đủ.
- Pixel parity: tâm dải không đổi (Y7 §3) — Y10 không đo lại pixels,
  nhưng O8 21/21 cả 2 engine + ghostBlend 15/15 trên cây gộp là bằng
  chứng không hồi quy render.

### 2.8 Y8 — EPERM probe #16: KHỚP

- Heartbeat: `n=16, ts=2026-11-12T11:37:29Z, boot=d8dc09fe-...,
  pid=5489` — khớp.
- Log probe v2, 3 dòng mới: `probe DEAD detected by status (last #15
  at 2026-11-12T08:40:51Z, age 10598s, ...)`; `=== boot changed
  a3a13d5a -> d8dc09fe (reboot detected, uptime since 2026-11-12
  11:30:25 ) ===`; `probe#16 boot=d8dc09fe tmp+ws ok=2 fail=0` — khớp
  đúng từng dòng §1. Reboot #19 = **11:30:25Z** chính xác từng giây.
- Scan: `scan-meta.txt` ghi `NEWSTD files_with_hits=100
  total_lines=294`, `R7B files_with_hits=118 total_lines=324`;
  `wfs-newstd.txt` 100 dòng / `wfs-r7b.txt` 118 dòng — khớp §3.2.
  Đối chiếu chéo 294+25+5=324 (file Y6 tạo giữa chừng) đã ghi rõ
  trong LIMITS Y8; Y10 không chạy lại quét (đọc file quét gốc).
- RAM 6 mẫu trong LIMITS (939/884/865/1791/2566/2610 MB) — max 2610 MB
  = 42% ngưỡng 6 GB; birefnet KHÔNG chạy — đúng luật.

### 2.9 Y9 — harness: KHỚP

- Cap + summary: `probe-after2-results.json` đọc trực tiếp:
  drawsTotal=**346**, drawsKept=**346** (100%) — khớp §1.
- `analyze-slots.py` chạy lại độc lập trên dữ liệu E1 gốc: run1 base
  3,16, ratios [0,89, 1,34, 1,30, 1,16, 0,89], mean 1,12, sd 0,19,
  max/min 1,51; run2 base 6,96, ratios [0,82, 0,99, 0,87, 1,05, 0,92],
  mean 0,93, sd 0,08, max/min 1,28; tương quan drawFps–loadAfter
  +0,68, –heapDelta +0,02, –gapP50 −0,61, –gapMax −0,78 — khớp đúng §3.
- E1: 10 dòng PASS trong mỗi log e1-run1/2/3; `KẾT QUẢ HEADED D4:
  10/10 pass` — khớp "10/10 pass cả 3 lần".
- Code: `AbortSignal.timeout` ×6 trong `clicktest-77e1-deint-fps.mjs`;
  `drawsSummary`/`mainSummary` ×5 + cap 2000 trong probe96x5b;
  `fault-inject-hang-server.mjs` tồn tại (1832 B) — khớp §2/§5.

## 3. Va chạm đo giữa luồng + đính chính

### 3.1 preview.tsx — 4 luồng cùng sửa, không mất marker, không xung đột nội dung

- Mtime cuối 12:02:15Z (Y4), md5 `a0a078e1`, 379669 B (từ 360785 B
  lúc 09:41:00Z). `media.ts` không đổi (09:56:43Z).
- Marker trên cây cuối: "Đợt 97 Y2" ×13, "Đợt 97 Y4" ×8,
  "Đợt 97 Y5" ×4, "Đợt 97 Y7" ×2 — khớp đúng claim từng luồng.
  Marker đợt 96 còn nguyên: "Đợt 96 X2" ×16, "Đợt 96 X4" ×5;
  `media.ts` "Đợt 96 X3" ×11, "96X3" ×25.
- Vùng sửa tách biệt theo đọc code của các luồng: Y2 pump/blend-log,
  Y4 drift/re-seek + grace tail, Y5 watchdog/freeze-kill, Y7
  clip-change kill. tsc 0 + build PASS + toàn bộ suite xanh sau khi
  gộp — không xung đột nội dung.

### 3.2 Y2/Y5 sửa preview.tsx giữa lượt đo của Y6 — đã ghi, không sai số

- Y6 ghi md5 trước/sau mỗi lượt (6cac637d → 18078068 → 484125f9 →
  9a9812e5). Số liệu cụm D/A/B/C vẫn dùng được vì toán blend không
  đổi (Y6 §3 đã đọc code xác minh). Số liệu cửa sổ mù/fbAt của Y6
  chỉ ghi nhận, không kết luận — đúng cách xử lý.

### 3.3 Y7 baseline nhiễm tải đã loại đúng

- Baseline đầu chr-blur-y7base (load 15,00; 31 caps) đã loại, chỉ dùng
  base2 — đúng lệ (Y7 §5 mục 4).

### 3.4 Xvfb lock FAIL lần đầu — do mồ côi của Y5, KHÔNG phải hồi quy

- Lần chạy suite 12:42–12:46Z: `test-xvfb-display-lock.mjs` FAIL
  (2 lỗi): test B — 3 claim song song: `:193:FAIL:sock`, `:195:OK`,
  `:194:OK`; distinct=2/3.
- Nguyên nhân (xác minh từ đĩa): **Xvfb :193 (pid 31588, PPID 1,
  start 12:27:39) còn sống** — chính là Xvfb của lượt mất
  wk-freeze-r9 của Y5 (driver log: ":193 đã claim 12:27:38, Xvfb :193
  đã lên 12:27:40"). Y5 đã kill node probe (pid 31551) và dọn lock/
  socket :193, nhưng process Xvfb này sống sót thành mồ côi; socket
  `/tmp/.X11-unix/X193` đã mất nên display chiếm mà không dùng được.
- Xử lý: kill pid 31588 (mồ côi, không socket, không ai dùng; hoàn
  tất việc dọn mà Y5 đã ghi trong log của nó), chạy lại test:
  **PASS (không lỗi)** — B: :194:OK, :193:OK, :195:OK, distinct=3/3.
  Cơ chế lock không hồi quy; FAIL ban đầu là trạng thái môi trường.
- Ghi thêm: còn file lock mồ côi `/tmp/.X193-lock` đã tự mất sau kill;
  `/tmp/.X194-lock` (pid 34579), `/tmp/.X195-lock` (pid 34585),
  `/tmp/.X196-lock` (pid 20131) còn lại với pid đã chết — vô hại,
  cơ chế thu hồi mồ côi của test A đã chứng minh xử lý được.

### 3.5 P7 strip-types exit 1 — lỗi runner tiền tồn, không phải hồi quy

- `ERR_MODULE_NOT_FOUND: Cannot find module '.../lib/nestedPreview'`
  (import không đuôi trong `i18nAudit59P7.test.ts`). Đúng như X9b đã
  ghi đợt 96. Chạy lại qua esbuild ESM: **8/8 pass**. Không sửa code.

### 3.6 test-preview-engine.sh (.cjs route) FAIL sẵn — tiền tồn

- Y2/Y5/Y7 đều ghi: script cũ fail `Cannot find module
  './previewClipKey62R6.ts'` (import đuôi `.ts` từ đợt 62 R6) + race
  `/tmp/vcut-test-preview-engine` dùng chung giữa các luồng song song
  (order.txt nhân đôi dòng). Route đúng
  `node --experimental-strip-types .../previewEngine.test.ts` cho
  18+25 passed. Không do đợt 97; sửa runner để đợt sau (Y2 §5 mục 2).

## 4. Read-back batch + tổng chờ push

- **Đợt 97: 9 batch / 32 entry / 29 file duy nhất, 0 binary,
  0 workflow, mọi entry tồn tại trên đĩa** (read-back đầy đủ, §4.1).
  File duy nhất trùng trong đợt: `apps/web/src/preview.tsx` xuất hiện
  trong 4 batch (Y2 + Y4 + Y5 + Y7) — cùng 1 file, 4 luồng sửa.
- **LỆCH ĐỊNH DẠNG BATCH (phát hiện mới, cần parent xử lý trước push):**
  5/9 batch đợt 97 viết bằng **newline-delimited** thay vì
  **NUL-delimited** như quy ước vòng lặp: Y3, Y5, Y7, Y8, Y9 (xác minh
  bằng `od -c`: Y3 dùng `\n`; Y1/Y2/Y4/Y6 dùng `\0`).
  Cả 299 batch đợt 67–96 đều NUL-only. Đọc bằng splitter chỉ-NUL thì
  đợt 97 chỉ còn 21 entry (thay vì 32) và 5 "entry" chứa ký tự newline
  trong đường dẫn — sẽ hỏng lúc push. **Parent cần chuẩn hoá 5 file này
  sang NUL trước khi push** (hoặc push-tooling phải đọc cả hai dạng).
  Y10 KHÔNG tự sửa file batch của luồng khác.
- **Tổng chờ push đợt 67–97 (đếm lại từ đĩa, split cả `\0` và `\n`):
  308 batch / 2301 entry / 1377 file duy nhất.** Đối chiếu: đợt 67–96
  đếm lại = **299 / 2269 / 1356 — khớp đúng từng số với tổng chính thức
  của parent sau đợt 96**, nên phương pháp đếm đã được kiểm chứng.
  Đợt 97 thêm 9 batch / 32 entry / 21 file duy nhất mới. HEAD vẫn
  5f548ef8. Dict i18n 2767 key (không đổi).

### 4.1 Từng batch đợt 97

| batch | entry | định dạng | trạng thái |
|---|---|---|---|
| phase9-round97-y1-blob-2mib.txt | 5 | NUL | OK |
| phase9-round97-y2-ghost-doublecount.txt | 3 | NUL | OK |
| phase9-round97-y3-retry-late.txt | 3 | **newline** | OK (cần chuẩn hoá) |
| phase9-round97-y4-rearm.txt | 6 | NUL | OK |
| phase9-round97-y5-watchdog-freeze.txt | 3 | **newline** | OK (cần chuẩn hoá) |
| phase9-round97-y6-blur-fix3.txt | 2 | NUL | OK |
| phase9-round97-y7-zombie-pump.txt | 3 | **newline** | OK (cần chuẩn hoá) |
| phase9-round97-y8-eperm-probe.txt | 1 | **newline** | OK (cần chuẩn hoá) |
| phase9-round97-y9-harness.txt | 6 | **newline** | OK (cần chuẩn hoá) |

## 5. Trạng thái nợ sau đợt 97 (cập nhật từ LIMITS gộp đợt 96 §4)

1. **2 MiB — THU HẸP, vẫn mở:** logging nặng ức chế bogus (chứng minh);
   tải vô tội (bác); cơ chế sửa thành "pull bị nhảy +2 MiB trong vài
   atom đầu" (bằng chứng byte §2.1). Còn lại: cần 1 run bogus CÓ
   `basesrc` logging để đếm byte typefind (mâu thuẫn đo lường vẫn mở:
   logging nặng ức chế bogus); stall thầm 0 frame (Y1a 4/12 vs Y1b
   0/18, chưa giải thích); 1–3 pipeline blob/case.
2. **Ghost double-count — PHÁN QUYẾT XONG PHẦN LỚN (Y2):** cụm 84 là
   triple đúng ở pha cao, KHÔNG phải lỗi blend; fix X2 đúng (cửa sổ
   nhãn triple liên tiếp ~100%); H1 (mislabel trễ-callback) bác bỏ làm
   nguyên nhân chính (1/1257, 0,08%); H1b (callback sớm −1) thường
   xuyên nhưng vô hại với nội dung snapshot; H2/H3 không tách được
   bucket. **Còn mở: residual 13,8%** (71/515 mẫu case B đo mức ngược
   với triple(P) dù cửa sổ nhãn hoàn hảo) — ứng viên duy nhất: race
   pixels lúc capture (drawImage đua với element chuyển frame), CHƯA
   chứng minh; cần expose ring snapshot pixels (`__vcutRvfcRingPixels`
   đề xuất). **CẤM sửa production dựa trên mức gStd** (metric nhạy pha
   đã chứng minh).
3. **Retry-play lỗi muộn >3 s — ĐÃ ĐÓNG (Y3):** đo trực tiếp tới 17,3 s,
   retry 12/12, app-tick 4/4. Không cần mở rộng wall hay thêm watchdog
   cho error muộn. Mới: revoke blob không phá được pipeline đang phát
   (0 error/4 case) — đừng dùng revoke để tiêm lỗi muộn.
4. **Re-arm — GIẢM THÊM, CHƯA ĐÓNG (Y4):** đuôi ân hạn đã implement +
   chạy live đúng thiết kế (11 tick tail sống, 2 tick grace+drift vượt
   ở tải vừa) nhưng **0 CANCELLED ngoài đời**; analyzer vẫn sót ca b5
   (cần carve-out đầu khoảng seeking); trần 5000 ms 0 ứng viên / 10
   lượt. **Phát hiện mới: detector mù với stall "bò"** (element tăng
   ~1 frame/tick dài, 0,055× realtime, reset đồng hồ đóng băng — drift
   re-seek bắn, seek kẹt 1,63 s ở d3) — nợ lớn nhất còn lại của hướng
   này; hướng sau: đóng băng theo TỐC ĐỘ thay vì tuyệt đối 1 frame.
5. **Blur parity fix-3 — ĐÃ ĐO ĐỦ (Y6):** tần suất D ~1% (0,7% gộp 457
   cap chr), không về 0 (D xuất hiện khi ring thoáng qua size 2 dưới
   tải); D TỒN TẠI trên WebKit (3/107); B-band wk tách được ở mức quần
   thể (pair ~42% / dc ~58%, n=36) nhưng không sạch từng mẫu. Cap D dị
   thường r7 ({3,9}→0,307) là 1 điểm ủng hộ mislabel — kiểm tra bằng
   pump log Y2 ở đợt sau.
6. **Watchdog đóng băng — CHƯA CHỨNG MINH IN VIVO (Y5):** fix đã
   implement (kill `"no-callback-frozen"` khi frame+ct cùng đóng băng
   ≥1000 ms, đã bỏ guard seeking), kiểm chứng offline xanh, nhưng
   **0 lần bắn trong 17 lượt** (đóng băng cứng ~3%/clip có pump; mọi
   stall đều có frame tiến <1000 ms); 8 lần fault-injection pause đều
   bị app resume trong ~74–400 ms mà KHÔNG gọi `play()` (phát hiện
   phụ: task `play()` đã queue lật lại pause). Kỳ vọng cứu ~1100 ms ở
   ca r5 vẫn là counterfactual. Cần ca đóng băng cứng tự nhiên hoặc
   injection tầng thấp hơn (GStreamer/task queue).
7. **Memo c2 blind — ĐÃ ĐO (Y5):** thường ~0 ms (13/14), thỉnh thoảng
   ~0,5 s (1/14 = 485 ms, do độ trễ khởi động element); watchdog đóng
   góp 0 ms (memo bỏ chờ 1000 ms mọi lượt). Cần thêm lượt để chốt đuôi
   phân phối.
8. **G1 — VẪN MỞ, chờ user quyết** (không giao luồng đợt 97; Y9 chỉ đo
   nhiễu slot cho verdict, không đổi G1).
9. **Zombie pump — GẦN NHƯ TRIỆT TIÊU (Y7):** kill-on-element-reuse
   ("clip-change") giảm zombie +27 → 0/0 và 0/+1; thống kê theo clip
   hết phồng; pixel parity giữ nguyên. Còn lại: clip kế KHÔNG blur thì
   zombie còn nguyên (cần hook draw path/MediaPool); tàn dư 0–1
   capture/lần đổi clip.
10. **EPERM — probe #16 xong (Y8):** khoảng mù #15 ~177' chứa reboot
    #18 (09:24:17Z) + #19 (11:30:25Z); không bằng chứng sóng trong bản
    ghi còn lại (nhưng ~51' cuối mù hoàn toàn); đính chính dương tính
    giả: 33 dòng "sóng EPERM đã tắt" là in mặc định khi ghi thử đầu
    tiên thành công — chỉ dòng "vẫn bật" hoặc "Operation not permitted"
    mới tính. Quét writeFileSync 294 dòng / 100 file, đối chiếu chéo
    khớp tuyệt đối sau khi tính file Y6 tạo giữa chừng. Đề xuất cron
    10 phút vẫn chờ user quyết. **Khoảng mù #16 bắt đầu 11:37:29Z.**
11. **Harness — 3/3 XONG (Y9):** cap draws/mainDraws 400→2000 + tóm
    tắt timing live (đo sau: kept 346/346); E1 timeout 2 s cho media
    probe + vòng CDP `/json/list` (fault-injection: exit 2 trong
    20,6 s/14,6 s thay vì treo exit 124); nhiễu slot: verdict 1 lần
    dùng được CÓ BIÊN (vùng 0,6–0,9 không quyết được, phải đo thêm
    lần 2); GC không phải nguồn nhiễu (r=+0,02); lượng tử hoá ±1 draw
    là nguồn nhiễu chính. Chưa làm: hạ mặc định 180 lần thử CDP (~450 s),
    slot 5 s, cài quy tắc verdict vào E1/G5.
12. **Đứng yên:** TTS 39 CẤM kiểm lại; birefnet 0 lần thành công (RAM
    max lượt này 2610 MB = 42% ngưỡng 6 GB — vẫn chưa đủ mức thử lại);
    `.github/workflows/ci-security.yml` vẫn 403 chờ user; release gate
    không đổi: không release/tag cho tới khi ngang hoặc hơn CapCut thật.
13. **Nợ harness mới:** `test-preview-engine.sh` (.cjs route) fail sẵn
    (shared /tmp + require `.ts`) — sửa runner để đợt sau; state100
    chạm cap 1200 mẫu khi chờ yên lâu (Y5/Y6); baseline wk chỉ 77 key
    (Y6); lượt mất wk-freeze-r9 của Y5 (CDP evaluate treo — cần timeout
    cho `page.evaluate` + log nhịp tim trước khi chạy lại injection).

## 6. Batch đã stage (KHÔNG push)

- `phase9-round97-y10-verify.txt` — 1 entry, NUL-delimited, read-back
  OK, 0 binary, 0 workflow:
  - `docs/PHASE9_ROUND97_Y10_VERIFY_LIMITS.md` (file này)

## 7. Ghi chú vận hành cho verify sau

1. **Copy fixture O8 trước khi chạy:** 3 file
   (`o8-white-720p-6s.mp4`, `o8-ball-720p-6s.mp4`,
   `o8-track-35-65.json`) từ scratch của verify trước vào
   `round<N>-y10/o8-chromium/` — Chromium leg exit 2 nếu thiếu.
   WebKit leg đọc env **`O8W_SCRATCH`**, không phải `O8_SCRATCH`.
2. **P7 chạy qua esbuild ESM**, không dùng `node
   --experimental-strip-types` (lỗi `nestedPreview` tiền tồn).
3. **Kiểm tra mồ côi Xvfb trước khi chạy xvfb-lock test:** `ps` tìm
   Xvfb có PPID 1 + socket `/tmp/.X11-unix/X<nn>` đã mất — dọn rồi
   chạy lại test để phân biệt FAIL thật với FAIL do mồ côi.
4. **Y4 không viết `round97-y4.md`** — poller lần sau nên tính hạ cánh
   theo LIMITS + batch trên đĩa, đừng đòi md của mọi luồng.
5. **Vite 5173 của Y2 (pid 15768, từ 11:48Z) vẫn chạy** — Y2 để lại có
   chủ ý; O8 dùng cổng riêng nên không va chạm. Parent dọn khi cần.
