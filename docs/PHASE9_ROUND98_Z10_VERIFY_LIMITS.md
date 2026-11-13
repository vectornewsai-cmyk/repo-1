# PHASE9_ROUND98_Z10_VERIFY_LIMITS — Kiểm chứng độc lập toàn bộ đợt 98 (Z10)

> Luồng Z10. Lượt cron 21:35 +07 12/11/2026, đợt 98 spawn ~14:37Z (21:35 +07).
> Repo `~/workspace/repo-1` (cây làm việc, HEAD GitHub vẫn `5f548ef8`).
> **KHÔNG push. KHÔNG release/tag. Không sửa production trong luồng này.**
> Scratch: `hidden_files/round98-z10-*` (poll, verify, O8). Không dọn process
> nào của luồng khác; không đụng file của luồng khác.
>
> **Bối cảnh đặc biệt — parent đã gộp trước khi Z10 xong:** parent stage
> closing đợt 98 (`phase9-round98-closing.txt`, 15:29Z) + viết
> `docs/PHASE9_ROUND98_LIMITS.md` khi Z10 còn đang chạy verify (U4 bị
> reboot giết giữa chừng, xem §0). LIMITS này là kiểm chứng độc lập
> HOÀN CHỈNH SAU gộp: toàn bộ suite offline + O8 cả 2 engine + đối chiếu
> headline từng luồng từ dữ liệu thô trên đĩa. Nó BỔ SUNG (không thay thế)
> LIMITS gộp của parent — đặc biệt O8 21/21 cả 2 engine mà parent chưa
> chạy, và 1 đính chính số pool G1 trong LIMITS gộp §4 mục 8 (xem §3.7).

## 0. Dòng thời gian + phương pháp

- Đợt 98 spawn ~14:37Z, 9 luồng Z1–Z9 (+ Z10 verify). Boot `65bc5fb6`
  (reboot #20, 13:24:41Z — Z7 chốt giờ chính xác từng giây, xem §2.7).
- Z10 poll đĩa từ 14:39:00Z (poller `/tmp/z10-poll.sh`, 5 phút/lượt,
  log `/tmp/z10-poll.log`): poll 1 (14:39Z) 0 luồng về; poll 3 (14:49Z)
  Z7 về; poll 6 (15:04Z) Z3/Z6/Z8 có LIMITS/log; poll 7 (15:09Z)
  Z1+Z6+Z7+Z8 về; poll 8 (15:14Z) Z4 về; **poll 9 (15:19:05Z)
  ALL LANDED theo đĩa — 9/9 LIMITS + 9/9 batch + 9/9 log md**.
  Poller dừng ngay lúc đó. Không luồng nào thiếu log md đợt này
  (khác Y4 đợt 97).
- **Reboot #21 lúc 15:24:27Z (boot mới `0b32ac3a`), GIỮA lúc Z10 verify:**
  verify part 1 (15:21:39–15:24Z, trên boot 65bc5fb6) chạy xong tới
  U4 thì bị reboot giết giữa chừng — U4 là bước duy nhất dở dang
  (log dừng giữa các check dry-run, không có dòng `exit=` cho U4).
  Z10 chạy lại phần còn lại (part 2, 15:25–15:30Z, trên boot mới):
  P7-esbuild, U4 (chạy lại toàn bộ), media-tests, retry96X3,
  watchdog96X3, deint-verdict, vite-diagnosis-regex, xvfb-lock —
  tất cả exit 0. O8 chạy 15:30–15:32Z trên boot mới, 21/21 cả 2 engine.
  **Không reboot nào trong lúc Z1–Z9 làm việc** (boot giữ nguyên
  65bc5fb6 từ spawn tới 15:19Z). Reboot tiếp theo dự kiến ~17:28Z
  (15:24:27Z + ~2h04').
- `preview.tsx` ổn định suốt verify: mtime 14:57:21Z, md5
  `41b05c8e`, 390879 B — khớp đúng md5 cuối mà Z3/Z4 ghi lúc 15:12Z.
  `media.ts` không đổi (mtime 09:56:43Z, từ đợt 97).
- Đối chiếu số headline: đọc file thô/JSON gốc trên đĩa cho cả 9 luồng,
  tính lại độc lập (Z1 summary + GST log; Z2 analyze output; Z3 analyzer
  output; Z4 JSON dbgFinal/fbAt; Z5 analysis; Z6 driver log + JSON
  dbgFinal; Z7 heartbeat/scan-meta; Z8 E1 report JSON + chạy lại
  self-test verdict + test-preview-engine.sh; Z9 analyze-pool chạy lại).

## 1. Kiểm chứng trên cây gộp — TOÀN XANH (1 sự cố môi trường: reboot #21, đã xử lý)

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 6,05 s** (parent gộp đo 12,98 s lúc tải cao — cùng PASS, khác thời gian do tải) |

### 1.2 Suite offline (log `hidden_files/round98-z10-verify.log`)

| test | kết quả |
|---|---|
| playheadHold90R2 | **56 passed**, exit 0 (50 cũ + 6 mới Z3-R1..R6) |
| playheadPacing54K9 | 19 pass, 0 fail, exit 0 |
| previewEngine | 18 test passed (mask) + **25 test passed** (rvfc), exit 0 |
| seek | 21 passed, exit 0 |
| seekSkipRender86N3 | 9/9 test pass, exit 0 |
| previewLoop50F2 | 20 passed, exit 0 |
| ghostBlend.probe | **15 kiểm chứng xanh**, exit 0 |
| css60 (cssClasses60Q2) | PASS 60/60, exit 0 |
| css61 (cssClasses61R4) | PASS 60/60, exit 0 |
| Audit P7 (i18nAudit59P7) | **8/8 pass qua esbuild ESM bundle**. Bản chạy `node --experimental-strip-types` exit 1 — **lỗi runner đã biết**: `ERR_MODULE_NOT_FOUND` import không đuôi `./nestedPreview`, đúng như X9b/Y10 đã ghi. Không phải lỗi audit. |
| orphans (binOrphan60Q7) | 17 pass, 0 fail, exit 0 |
| r6-i18n-check | PASS — dict vi==en==**2767 key** lá, 0 key mồ côi (không đổi) |
| U4 fail-fast | 141 pass, 0 fail, exit 0 (chạy lại toàn bộ sau reboot #21) |
| media (run-media-tests.mjs) | blobPrefetch **25 pass**, captureThumb **2 pass**, retryPlay95W2 **7 pass** — 3/3 PASS |
| media.retryPlay96X3 (X3, esbuild) | 7 pass, 0 fail, exit 0 |
| media.stallWatchdog96X3 (X3, esbuild) | 9 pass, 0 fail, exit 0 |
| deint-fps-verdict (X6) | pass 17, fail 0, exit 0 |
| vite-diagnosis-regex (X6) | pass 9, fail 0, exit 0 |
| xvfb-lock | **PASS, 0 lỗi** (B: distinct 3/3 — :194, :195, :193; C: không lock mồ côi) |
| test-preview-engine.sh (Z8, chạy lại độc lập) | **EXIT 0, 354 assertions pass** (25 khối test) |

### 1.3 O8 — 21/21 cả 2 engine (log `hidden_files/round98-z10-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium (:189/5552/9652) | 15:30–15:31Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |
| WebKit (:190/5562/9654) | 15:31–15:32Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |

Số Δx khớp **đúng từng chữ** với O8 của X2/X3/X9b/Y10 trên các cây
trước (Chromium 0,112/0,113; WebKit 0,194/0,197) — mask-track ổn
định qua đợt 98 dù `preview.tsx` đổi 3 luồng. Fixture copy trước
khi chạy theo bài học Y10 (3 file từ `round97-y10/o8-chromium`).
WebKit leg dùng `O8W_SCRATCH` như Y10 đã ghi.

## 2. Đối chiếu từng luồng — số headline KHỚP, không lỗi số nào

### 2.1 Z1 — blob basesrc:5: KHỚP

- JSON `webkit-blob-flaky-98z1-basesrc.json`: đủ 24 case (12 blob +
  12 prog); blob playOk True 11/12, case duy nhất không playOk là
  c2-run1 `runError: "page.evaluate: Target page, context or browser
  has been closed"` — đúng deadlock Z1 §5.
- `summary.txt` (tính từ JSON + GST log): blob strict **11/12**,
  loose **11/12**, prog **12/12**; bogusLogs **2/12** — khớp LIMITS §1.
- Grep độc lập GST log (`round98-z1/a-basesrc/gst/`): đúng 2 file
  chứa `bogus size` — `Lc2-z1-blobA-run3.log` và
  `Lc8-z1-blobA-run5.log` (lưu ý: LIMITS Z1 §6 ghi thư mục `gst/`,
  thực tế là `a-basesrc/gst/` — chỉ khác đường dẫn, không sai số).
  Giá trị bogus trong summary: run3 `2854668610`, run5 `2991868683`
  — khớp Y1a (atom-2) và giá trị cổ điển.
- Log 2,2–5,1 MB/run (logKB 2241–5078 trong summary) — khớp claim
  "ngang chuỗi nặng X1". `media.ts` sha không đổi (mtime 09:56:43Z).
- Fail⇒bogus gộp 56/64 = 88%: Z1 thêm 0/1 (deadlock không bogus) —
  số học đúng (56/63 trước Z1, +0 fail-bogus / +1 fail).

### 2.2 Z2 — ghost residual: KHỚP

- `analyze-z2.txt` đọc trực tiếp: capture có pix 138/138 (100%),
  pixels **khớp nhãn 136**, **lệch −1 thật 0**, **lệch +1 thật 2**
  (seq=285 label 39→40, seq=292 label 51→52, h(label)=24 cả hai,
  lateMs 19,8 / 17,1 ms) — khớp đúng LIMITS §3.3.
- Outlier 23: curPix sạch 11, lệch 12 (8 single-match + 4 đa-khớp:
  P=2 [0,5], P=60 [57,61], P=16 [14,15,19], P=3 [0,5]) — khớp
  LIMITS §4.2 ("lệch rõ 8, đa-khớp 4"). Đối chứng 58: sạch 42,
  lệch 9, đa-khớp 7 — khớp. Dự đoán triple(P) khớp ±5: 54/81
  (66,7%) — khớp.
- Metric pha: 13/17 = 76,5% — khớp §5.
- 10 marker "Đợt 98 Z2" còn đủ trong `preview.tsx` trên cây gộp.
  Probe assert exit 1 với 1 fail gStd spread (median 33,9 > 15) là
  bệnh nhạy pha đã biết từ X2/Y2 — Z10 chạy lại ghostBlend probe
  trên cây gộp: **15/15 xanh** (§1.2), không hồi quy do Z2.

### 2.3 Z3 — re-arm stall bò: KHỚP

- Analyzer output `analyze-old7-plus-d3-z3.txt`: b1 2 nhảy hại
  (relMs 8411 Δph=0,600; relMs 11417 Δph=1,300 — khớp Y4);
  **b5: 1 nhảy hại [CARVE-OUT đầu-seeking], relMs=5270 Δph=0,833
  Δct=0,033 drift=0,767** — khớp đúng từng số LIMITS §1.1.
  Carve-out chỉ bắt thêm đúng 1 ca trên 10 lượt.
- `analyze-post3-z3.txt` gộp 3 lượt hậu-fix: arm-vì-bò **0**,
  tick-bò **8** (e1r 2 + e2r 1 + e3 5), re-seek trong 3 tick sau
  arm-vì-bò 0; chuỗi grace ≥2 tick **BỊ CHẶN=3, LỌT=0** (e1r 2 +
  e2r 1) — khớp §1.3. Nhảy hại e3 relMs=10920 Δph=0,933 Δct=0,000
  drift=0,867 [CARVE-OUT] — khớp §3.3.
- 7 marker "Đợt 98 Z3" còn đủ. Hold **56/56** trên cây gộp (§1.2)
  gồm 6 test Z3-R1..R6 — khớp claim Z3.

### 2.4 Z4 — watchdog freeze in vivo: KHỚP (nợ ĐÓNG, đã xác minh từ JSON thô)

- JSON `wk-freeze-deepstub-r3/frame-parity-results.json`:
  `dbgFinal[1].fb = "no-callback-frozen"`, `fbAt.c1 = 21113` —
  khớp kill ở pausedAt+1333 ms (§3.1).
- JSON `wk-freeze-deepstub-r5/frame-parity-results.json`:
  `dbgFinal[1].fb = "no-callback-frozen"`, `fbAt.c1 = 17408` —
  khớp kill ở pausedAt+606 ms (§3.2).
- JSON r1/r2/r4: 0 lần `"no-callback-frozen"` trong dbgFinal —
  khớp "2 lần bắn, 0 kill oan". (Lưu ý đếm thô: chuỗi
  `"no-callback-frozen"` xuất hiện 107 lần trong JSON r3 và 103
  lần trong JSON r5 vì mỗi mẫu state100/tick ghi lại fb hiện tại —
  không phải 107 lần kill; chỉ `dbgFinal[].fb` mới là bản ghi kill.
  Đừng trích "107 lần".)
- Z4 không sửa production: 0 marker "Đợt 98 Z4" trong `preview.tsx`
  — đúng như LIMITS §6 khai báo. Marker "Đợt 97 Y5" ×4 còn nguyên.

### 2.5 Z5 — blur B-band: KHỚP

- `analysis.txt`: B wk gộp r4–r11 **n=61/247, mean 0,766, med
  0,769, sd 0,016**; pair-like 25 (mean 0,750) / dc-like 36 (mean
  0,777) — khớp §1b. D chr gộp r6–r10: **5/575 (0,9%), mean 0,306**
  — khớp §1a.
- Blind wk: r1 **2973 ms** (phCross 12594 → ring 15567), r2 **990 ms**
  (phCross 25303 → ring 26293) — khớp §1d. Memo c2 = 0 ms cả 2 lượt
  (theo LIMITS §1d; Z10 không đo lại blind, chỉ đối chiếu file).
- Z5 không sửa production (chỉ probe) — đúng khai báo; 1 lượt mất
  wk-blur-r11 (CDP evaluate treo, tái hiện lỗi Y5) đã ghi trong
  LIMITS §0.1, không ảnh hưởng n≥60 (đạt 61).

### 2.6 Z6 — zombie non-blur: KHỚP

- Driver log: mixed-base fbAt={} (không kill); mixed-fix
  `fbAt={c0:3931}`, pageErrs=0, mtimeChanged=false; blur-fix
  `fbAt={c0:3819, c1:6927}` — khớp §2.
- JSON dbgFinal đọc trực tiếp: base c0 `('', lastFrame=31,
  caps=13)` → fix mixed c0 `('clip-change', 89, 6)`; blur fix
  c0 `('clip-change', 89, 14)`, c1 `('clip-change', 89, 10)`,
  c2 `('', 89, 8)` — khớp đúng bảng §2 (13/—/14 → 6/—/6 và
  14/10/8, lastFrame đều 89).
- 5 marker "Đợt 98 Z6" còn đủ. Pixel parity: O8 21/21 cả 2 engine
  + ghostBlend 15/15 trên cây gộp (§1) là bằng chứng không hồi quy
  render; tâm dải Z6 đã đối chiếu trong LIMITS §3, Z10 không đo
  lại pixels.

### 2.7 Z7 — EPERM probe #17: KHỚP

- Heartbeat `eperm-probe-v2.heartbeat`: `n=17,
  ts=2026-11-12T14:38:22Z, boot=65bc5fb6-...` — khớp.
- Log probe v2: `2026-11-12T14:38:22Z probe#17 boot=65bc5fb6
  tmp+ws ok=2 fail=0`; dòng `boot changed d8dc09fe -> 65bc5fb6
  (reboot detected, uptime since 2026-11-12 13:24:41)` — khớp §1.
  Reboot #20 = **13:24:41Z** chính xác từng giây (khớp cả
  `uptime -s` mà Z10 tự đo lúc poll: 13:24:41).
- Scan: `scan-meta.txt` ghi `NEWSTD files_with_hits=109
  total_lines=333`, `R7B ... total_lines=358`, copies 25 dòng /
  17 file — khớp §3.2. Đối chiếu chéo 333+25=358 — khớp tuyệt đối.
- RAM 6 mẫu Z7 (645–1451 MB, max 24% guard) — birefnet KHÔNG chạy,
  đúng luật. Khoảng mù #17 bắt đầu 14:38:22Z.

### 2.8 Z8 — harness: KHỚP (chạy lại độc lập 2 hạng mục)

- `deint-fps-verdict.mjs` self-test chạy lại: **16/16 PASS** —
  khớp §2.
- `test-preview-engine.sh` chạy lại độc lập: **EXIT 0, 354
  assertions pass** — khớp §4 (và khớp parent gộp §3).
- E1 report JSON đọc trực tiếp: run1 `g5Verdict = {rule: "98Z8",
  rounds: 1, run1: {ratios: [1.26, 1.09, 1.23, 1.24, 0.7], mean:
  1.1, median: 1.23}, verdict: "PASS", certain: true}`; force2
  `rounds: 2, run1 mean 1.25, run2 mean 1.07, combinedMean 1.16,
  combinedMedian 1.04, verdict "PASS"` — khớp đúng §5.
- Z8 không sửa logic production: 0 marker "Đợt 98 Z8" trong
  `preview.tsx` — đúng khai báo (chỉ sửa harness/probe/test).

### 2.9 Z9 — G1 evidence v9: KHỚP (chạy lại script gộp)

- `analyze-pool98z9.py` chạy lại độc lập: tái tạo đúng số X6
  (pool 30 n=53 PASS 44/53; pool 60 n=37 PASS 35/37) trước khi
  thêm lần Z9 — phương pháp gộp đã kiểm chứng.
- Pool sau Z9 (tính lại): **30fps n=59, median 0,990, mean 0,980,
  CI [0,923; 1,037], PASS 50/59 (85%)**; **60fps n=42, median
  0,985, mean 0,990, CI [0,941; 1,039], PASS 40/42 (95%)**;
  **chân yên 30fps n=18, median 0,940, mean 0,913, CI [0,840;
  0,986], PASS 14/18 (78%)** — khớp đúng §2.
- 11 lần Z9 mới tính lại từ fpsSlots đều KHỚP (E1 0,93/0,92/0,99/
  0,94/1,08 gộp/1,15; N10 1,12/1,04/1,31/1,12/0,84; M2 run5 N10
  0,73 FAIL — đúng là lần G5/M2 bất đồng thứ hai).
- G1 vẫn MỞ, chờ user quyết — Z9 không tự đóng, đúng luật.

## 3. Va chạm đo giữa luồng + đính chính

### 3.1 preview.tsx — 3 luồng cùng sửa, không mất marker, không xung đột nội dung

- Mtime cuối 14:57:21Z (Z6), md5 `41b05c8e`, 390879 B (từ 360785 B
  lúc 09:41:00Z đợt 97, qua 379669 B cuối đợt 97). `media.ts`
  không đổi (09:56:43Z).
- Marker trên cây cuối: "Đợt 98 Z2" ×10, "Đợt 98 Z3" ×7,
  "Đợt 98 Z6" ×5 — khớp đúng claim từng luồng. Z1/Z4/Z5/Z7/Z8/Z9
  = 0 marker (đúng khai báo: probe/harness/đo-only, không sửa
  production).
- Marker cũ còn nguyên: "Đợt 97 Y2" ×13, "Đợt 97 Y4" ×8,
  "Đợt 97 Y5" ×4, "Đợt 97 Y7" ×2; "Đợt 96 X2" ×16,
  "Đợt 96 X4" ×5; `media.ts` "Đợt 96 X3" ×11 (không đếm lại
  "96X3" ×25 đợt này — không đổi file).
- Vùng sửa tách biệt: Z2 ring/blend-log (strip pixels), Z3
  drift/re-seek/watchdog (luật bò), Z6 draw-path/syncMedia
  (owner-change kill). tsc 0 + build PASS + toàn bộ suite xanh +
  O8 21/21 cả 2 engine sau khi gộp — không xung đột nội dung.

### 3.2 Z2/Z3/Z6 sửa preview.tsx giữa lượt đo của Z5 — đã ghi, không sai số

- Z5 ghi md5 trước/sau mỗi lượt (a0a078e1 → fa16bb50 →
  7238158c → 41b05c8e). Blend math không đổi (thân hàm
  `compositeMotionBlurLayer` chứa 0 marker "Đợt 98") — số liệu
  cụm D/A/B/C của Z5 vẫn dùng được; chỉ số liệu watchdog/fallback
  các lượt lai gắn cờ build. Z10 xác nhận độc lập: thân hàm đó
  không chứa marker đợt 98 (đọc code lúc đối chiếu Z5).
- Z2 probe chạy trên md5 `7238158c` (đã có Z3, chưa có Z6);
  Z3 probe chạy trên cây đã gộp Z2+Z3+Z6; Z6 baseline chạy trên
  `7238158c` (trước Z6). Các build đo đã ghi rõ trong từng LIMITS
  — không luồng nào nhận số đo trên build khác làm số của mình.

### 3.3 Reboot #21 giữa verify của Z10 — đã xử lý, không mất bằng chứng

- Part 1 verify (boot 65bc5fb6) xong 14/15 mục offline thì reboot
  giết giữa U4. Part 2 chạy lại toàn bộ U4 + các mục còn lại trên
  boot mới `0b32ac3a` — tất cả exit 0. Không mục nào chỉ có kết quả
  "nửa chừng": U4 được chạy lại trọn vẹn (141 pass, 0 fail).
- Các mục part 1 (tsc/build/suite) chạy trên cây gộp cuối cùng
  (preview.tsx md5 41b05c8e, ổn định từ 14:57Z) — reboot không đổi
  cây code, chỉ đổi boot. Kết quả part 1 vẫn đứng.

### 3.4 P7 strip-types exit 1 — lỗi runner tiền tồn, không phải hồi quy

- `ERR_MODULE_NOT_FOUND: Cannot find module '.../lib/nestedPreview'`
  (import không đuôi trong `i18nAudit59P7.test.ts`). Đúng như X9b/Y10
  đã ghi. Chạy lại qua esbuild ESM: **8/8 pass**.

### 3.5 test-preview-engine.sh (.cjs route) — ĐÃ SỬA XONG (Z8), không còn fail sẵn

- Khác đợt 97: script nay chạy **EXIT 0, 354 assertions pass**
  (Z8 §4 + Z10 chạy lại độc lập §1.2). Nợ "test-preview-engine.sh
  fail sẵn" trong LIMITS gộp đợt 97 §4 mục 11 **ĐÃ ĐÓNG**.
- Lưu ý: chạy trực tiếp `node preview-engine.test.cjs` vẫn FAIL
  (test suy OUT từ `__dirname`, phải chạy qua script) — đó là cách
  chạy sai, không phải hồi quy (parent gộp §2 đã ghi).

### 3.6 Đính chính LIMITS gộp đợt 98 của parent (§4 mục 8 — số pool cũ)

- Parent gộp §4 mục 8 ghi: "pool 30fps n=53 PASS 44/53 = 83% biên 2;
  pool 60fps n=37 PASS 35/37 = 95%" — đây là **số X6 TRƯỚC Z9**,
  không phải số sau đợt 98. Số đúng sau Z9 (Z9 §2 + Z10 tính lại
  §2.9): **pool 30fps n=59 PASS 50/59 = 85%, biên 3 FAIL**;
  **pool 60fps n=42 PASS 40/42 = 95%**. Chân yên 30fps 14/18
  (78%) trong cùng mục thì đúng. Đọc LIMITS gộp §4 mục 8 kèm
  đính chính này; §1 Z9 của LIMITS gộp đã ghi đúng số mới.

### 3.7 Lưu ý nhỏ khác (không sai số)

- Z1 LIMITS §6 ghi GST log ở `hidden_files/round98-z1/gst/` —
  thực tế là `round98-z1/a-basesrc/gst/` (2 file có `bogus size`
  đã xác minh tại đó). Chỉ khác đường dẫn.
- Z4: đừng trích "107 lần no-callback-frozen" — đó là số lần chuỗi
  xuất hiện trong JSON (mỗi mẫu ghi lại fb), kill thật chỉ 2 lần
  (dbgFinal, §2.4).

## 4. Read-back batch + tổng chờ push

- **Đợt 98: 9 batch luồng / 31 entry / 29 file duy nhất, 0 binary,
  0 workflow, mọi entry tồn tại trên đĩa** (read-back NUL-split đầy
  đủ, §4.1). File duy nhất trùng trong đợt: `apps/web/src/preview.tsx`
  xuất hiện trong 3 batch (Z2 + Z3 + Z6) — cùng 1 file, 3 luồng sửa.
- **Định dạng batch đợt 98: 9/9 NUL-delimited** (od -c: 0 byte
  newline trong cả 9 file) — không còn lệch định dạng như đợt 97
  (5/9 newline, parent đã chuẩn hoá). Z10 KHÔNG phải sửa file batch
  nào của luồng khác.
- **Tổng chờ push đợt 67–98 (đếm lại từ đĩa, split cả `\0` và `\n`):
  320 batch / 2337 entry / 1401 file duy nhất** — khớp đúng từng số
  với tổng parent ghi trong LIMITS gộp đợt 98 §5 (320/2337/1401,
  gồm closing). Phương pháp đếm đã kiểm chứng: đếm lại đợt 67–97 =
  **310 / 2304 / 1379 — khớp đúng từng số với tổng chính thức của
  parent sau đợt 97**.
- Đợt 98 thêm 10 batch / 33 entry / 22 file duy nhất mới (9 batch
  luồng 31 entry + closing 2 entry; file mới gồm 9 LIMITS luồng +
  LIMITS gộp + 12 file code/probe/JSON mới). HEAD vẫn 5f548ef8.
  Dict i18n 2767 key (không đổi).

### 4.1 Từng batch đợt 98

| batch | entry | định dạng | trạng thái |
|---|---|---|---|
| phase9-round98-z1-blob-basesrc.txt | 3 | NUL | OK |
| phase9-round98-z2-ghost-residual.txt | 3 | NUL | OK |
| phase9-round98-z3-rearm-crawl.txt | 6 | NUL | OK |
| phase9-round98-z4-watchdog-freeze.txt | 2 | NUL | OK |
| phase9-round98-z5-blur-bband.txt | 3 | NUL | OK |
| phase9-round98-z6-zombie-nonblur.txt | 3 | NUL | OK |
| phase9-round98-z7-eperm-probe.txt | 1 | NUL | OK |
| phase9-round98-z8-harness.txt | 8 | NUL | OK |
| phase9-round98-z9-g1-evidence9.txt | 2 | NUL | OK |
| phase9-round98-closing.txt (parent) | 2 | NUL | OK |

## 5. Trạng thái nợ sau đợt 98 (cập nhật từ LIMITS gộp đợt 98 §4)

1. **2 MiB — THU HẸP THÊM, vẫn mở:** basesrc:5 RIÊNG cũng ức chế
   bogus (2/12 vs 10/12, log 2,2–5,1 MB/run ngang chuỗi nặng) —
   giả thuyết "nhẹ" bị bác; qtdemux được minh oan ở tầng pull-range
   (không lần đọc nào hỏi offset 2 MiB cho atom); nghi phạm còn lại
   là `webkitwebsrc.create()` hoặc handoff typefind/adapter (đọc
   source, không tốn runtime). Mới: deadlock WebProcess sau 2 lần
   interr (c2-run1, kẹt ~10 phút) + bug `withTimeout` họ probe
   (timeout không bao giờ bắn) — probe-only, để đợt sau sửa.
2. **Ghost residual 13,8% — THU HẸP, vẫn mở:** race pixels lúc
   capture BỊ BÁC làm cơ chế chính (0% lệch −1 thật, chỉ 1,4% lệch
   +1 thật); ứng viên còn lại là race frame hiện tại lúc blend
   (curPix lệch 35% ở outlier vs 16% đối chứng, p ≈ 0,07, n nhỏ,
   chế độ thưa) — cần đo lại dense trước khi bàn fix. **CẤM sửa
   production dựa trên mức gStd** (đứng từ Y2).
3. **Re-arm — GIẢM THÊM, CHƯA ĐÓNG:** luật vận tốc đã sửa + đo
   live (giữ-vận-tốc 4/4 lần tăng bò không nhả giữ ở e3; carve-out
   bắt được b5; chuỗi grace BỊ CHẶN lần đầu khác 0: 3 chuỗi, 0 lọt)
   nhưng **arm-vì-bò vẫn 0/3 lượt** (watch S2 che phủ mọi stall)
   và **CANCELLED vẫn 0** (0/13 lượt gộp). Cần cấu hình "bò sau
   khi watch đã hết" như d3, hoặc chấp nhận detector là lưới an
   toàn cho cấu hình hiếm. Mới: nhả trần 5000 ms quan sát được lần
   đầu (e3) nhưng analyzer đếm sai mốc trần (lấy đầu stall thay vì
   watchCeil) — luồng sau sửa analyzer.
4. **Watchdog freeze — ĐÃ ĐÓNG (Z4, xác minh độc lập §2.4):**
   freeze-kill bắn in vivo 2 lần bằng deepstub (r3 +1333 ms, r5
   +606 ms trên stall tự nhiên). Còn mở: cơ chế pipeline tự lật
   `paused` (21 lần lật/tick, playBlocks=0) chưa xác định ở tầng
   GStreamer; deepstub chỉ là công cụ đo, không đưa vào production.
5. **Blur parity — ĐÃ ĐO ĐỦ, vẫn mở ở mức từng mẫu:** D fix-3
   ~1% (0,9% gộp 575 cap chr) — sàn, cơ chế tinh chỉnh: ring chỉ
   còn 1 ghost cách presented 2 khung cũng cho D; B-band wk n=61,
   hỗn hợp pair ~41% / dc ~59% ở mức quần thể, **không khe bimodal**,
   không tách sạch từng mẫu (2-means chạm nhau 0,0029); 2 tín hiệu
   một phía mới (ringSize=1 ⇒ pair-like; phase 4 ⇒ dc-like) cần
   kiểm thêm bằng pixel strip Z2. Dị thường chr r7 ({3,9} gap 6)
   vẫn mở (mislabel ±1 không đủ, cần +4).
6. **Zombie pump — GẦN NHƯ TRIỆT TIÊU (Z6):** kill owner-change
   diệt zombie clip-kế-không-blur (+6 → 0; blur→blur 0/0); độ trễ
   kill 0–3 ms (trong lượng tử state100). Còn lại: straggler
   tiền-seek 0–1 capture/biên (chưa quan sát được mẫu nào hậu-fix,
   n=4 biên) — cần kiểm tra "clip còn active không" trong
   `rvfcCallback` mới diệt hẳn (chạm core pump, ngoài phạm vi).
7. **EPERM — probe #17 xong (Z7):** khoảng mù #16 ~181' đóng (1
   reboot #20); không bằng chứng sóng trong bản ghi còn lại (nhưng
   ~92' cuối mù hoàn toàn — dài nhất từng ghi); sóng gần nhất vẫn
   ~11:55–12:11Z (R7). **Khoảng mù #17 bắt đầu 14:38:22Z.**
   Đề xuất cron 10 phút vẫn chờ user quyết. Quét writeFileSync
   333 dòng / 109 file, đối chiếu chéo khớp tuyệt đối lần 5.
8. **Harness — 5/5 XONG (Z8):** slot 5 s /json/list (worst case
   450 s → ~65 s, FI chứng minh); verdict vùng 0,6–0,9 đã cài vào
   E1 + bắn thật lần đầu ở run5 của Z9; bucket playT0rel (unit test
   30/30); test-preview-engine.sh sửa xong (354 assertions, nợ
   đợt 97 §4 mục 11 ĐÃ ĐÓNG). Còn mở: chưa có lần E1 thật-yên nào
   dưới code mới; slot G5 3 s → 5 s chưa làm (cần parent quyết).
9. **G1 — VẪN MỞ, chờ user quyết:** chân yên 30fps 14/18 (78%),
   còn thiếu 2 PASS yên liên tiếp nữa (16/20 = 80%); pool 30fps
   50/59 (85%, biên 3 FAIL); pool 60fps 40/42 (95%); chân yên
   60fps 10/10 (không mẫu mới). M2 lật 1/11 verdict đợt này (N10
   run5: 0,84 → 0,73) — parent cần quyết metric G5 hay M2.
10. **Z10 — XONG (luồng này):** kiểm chứng độc lập đầy đủ + O8
    21/21 cả 2 engine — nợ "Z10 chưa xong" trong LIMITS gộp đợt 98
    §2/§4 mục 1 **nay ĐÃ XONG**. Parent gộp trước khi Z10 xong nên
    LIMITS gộp không có O8; LIMITS này bổ sung O8 + đính chính §3.6.
11. **Đứng yên:** TTS 39 CẤM kiểm lại; birefnet 0 lần thành công
    (RAM max đợt 98 ~2,6 GB, xa ngưỡng 6 GB; u2net là fallback chính
    thức); `.github/workflows/ci-security.yml` vẫn 403 chờ user;
    release gate không đổi: không release/tag cho tới khi ngang hoặc
    hơn CapCut thật.

## 6. Batch đã stage (KHÔNG push)

- `phase9-round98-z10-verify.txt` — 1 entry, NUL-delimited, read-back
  OK, 0 binary, 0 workflow:
  - `docs/PHASE9_ROUND98_Z10_VERIFY_LIMITS.md` (file này)
- Tổng chờ push sau khi thêm batch này: **321 batch / 2338 entry /
  1402 file duy nhất** (đợt 67–98: 320/2337/1401 + Z10 1/1/1).

## 7. Ghi chú vận hành cho verify sau

1. **Reboot có thể giết verify giữa chừng** (đợt này: reboot #21
   15:24:27Z giết part 1 giữa U4). Verify script nên chia bước có
   log `exit=` từng mục (đã có) để chạy lại đúng phần dở — Z10 đã
   làm vậy (part 2 chạy lại U4 trọn vẹn).
2. **Copy fixture O8 trước khi chạy** (đã làm, theo bài học Y10);
   WebKit leg đọc env **`O8W_SCRATCH`**, không phải `O8_SCRATCH`.
3. **P7 chạy qua esbuild ESM**, không dùng `node
   --experimental-strip-types` (lỗi `nestedPreview` tiền tồn).
4. **Kiểm tra mồ côi Xvfb trước khi chạy xvfb-lock test** — đợt này
   không có Xvfb nào chạy lúc verify, test PASS ngay lần đầu.
5. **Đừng đếm chuỗi `"no-callback-frozen"` trong JSON làm số lần
   kill** — chỉ `dbgFinal[].fb` mới là bản ghi kill (Z4 §2.4).
6. **Đếm tổng chờ push phải lọc đúng round 67–98** — glob
   `phase9-round*.txt` còn match các round 1–66 (tổng thô 532
   batch là sai); lọc số round trước khi đếm.
7. **Parent có thể gộp trước khi verify xong** (đợt này: closing
   15:29Z trong lúc Z10 đang verify). Verify sau vẫn chạy đầy đủ
   và ghi LIMITS bổ sung + đính chính, không chạy lại phần parent
   đã làm.
