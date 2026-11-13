# Phase 9 đợt 99 — A10: kiểm chứng độc lập (BẢN CHẠY LẠI)

> Luồng A10, đợt 99, lượt cron 00:35 +07 13/11/2026. **Bản chạy lại:** lần chạy
> trước của A10 kết thúc sớm không có kết quả cuối, nhưng để lại poller nền
> (pid 8156, bắt đầu 17:40Z) + verify log đã có header + 1 dòng poll — bản
> này KHÔNG khởi poller thứ hai, KHÔNG kill poller, tiếp tục append cùng log.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG đụng TTS 39,
> birefnet, `.github/workflows/*`.
>
> **Kết quả chung: 9/9 luồng A1–A9 về đủ; cây gộp TOÀN XANH (tsc 0/0, vite
> build PASS, 24/24 mục suite offline exit 0, O8 21/21 cả 2 engine); đối
> chiếu headline 9/9 luồng KHỚP với dữ liệu thô trên đĩa, với 4 đính chính
> nhỏ (A2, A4, A5 — xem §2, không đổi kết luận nào).**

## 0. Dòng thời gian + phương pháp

- **Spawn A1–A9:** 17:39Z. **A10 bản chạy lại bắt đầu:** 17:42Z (boot
  `99338d31-a4bc-4020-b910-301c997a24a2` khớp boot đầu đợt; poller pid 8156
  còn chạy; RAM khả dụng 1236 MB lúc bắt đầu).
- **Poll đĩa (poller + kiểm tay):** 17:40Z 0/9 → 17:51Z 2/9 (A8, A9) →
  18:01Z 2/9 → 18:11Z 5/9 (A1, A4, A6) → 18:21Z 6/9 (A2; A7 đã có LIMITS
  chưa batch) → **18:31Z 9/9 ALL LANDED, poller dừng.** Không luồng nào
  phải chờ quá poller (11 lượt, ~110 phút — dừng ở lượt 5).
- **Dấu hiệu sống giữa chừng (kiểm tay, không kết luận "mất" khi chưa kiểm
  đĩa):** 18:01Z cả 9 luồng đều có thư mục làm việc + file đang ghi (A1
  matrix/watchdog, A2 assert, A3 probe f1–f4, A4 vite w3, A5 driver blur,
  A6 analyze, A7 e1-run7, A8/A9 đã hạ cánh). Không luồng nào chết yểu.
- **Cây gộp đóng băng lúc verify (18:33Z):** `preview.tsx`
  `efce65ddfb3f0dca2b2a44a2250f5f90`, `media.ts`
  `2c384ed13703809d5e999311147745e7`, `playheadHold90R2.ts`
  `11d0ec7cf437e59cafffebf3d025d203`, `playheadPacing.ts`
  `0ff7ae69bdff5876426e14446fa11c9b`. Không còn process luồng A1–A9 nào
  chạy lúc đóng băng. Verify offline 18:32:40–18:36:23Z; O8
  18:37:53–18:39:00Z. **Không reboot trong lúc verify.**
- **Boot/reboot:** boot duy nhất `99338d31` suốt đợt + verify. Reboot #22
  lúc 17:25:39Z (trước đợt, `uptime -s` xác minh lại 18:5xZ đúng từng
  giây); reboot tiếp theo dự kiến ~19:29Z (chu kỳ ~2h03', A8 tính).
  Không phần verify nào bị reboot giết (khác Z10 đợt 98).
- **Script verify:** `hidden_files/round99-a10-verify.sh` (dựa trên
  `round98-z10-verify.sh`; P7 chạy qua esbuild thay vì strip-types —
  bản strip-types exit 1 do lỗi runner đã biết, xem Z10 §1.2) + script
  O8 `round99-a10-o8.sh` (fixture copy trước từ `round98-z10/o8-chromium`,
  md5 white `07bc0cb9…`, ball `6df873f7…`, track `cdf9a252…`; WebKit leg
  dùng `O8W_SCRATCH` như Y10/Z10). Log: `round99-a10-suites.log`,
  `round99-a10-o8.log`, poll log `round99-a10-verify.log`.

## 1. Kiểm chứng trên cây gộp — TOÀN XANH

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 7,27 s** |

### 1.2 Suite offline (log `hidden_files/round99-a10-suites.log`)

| test | kết quả |
|---|---|
| playheadHold90R2 | **56 passed**, exit 0 |
| playheadPacing54K9 | 19 pass, 0 fail, exit 0 |
| previewEngine | 18 test passed (mask) + **25 test passed** (rvfc), exit 0 |
| seek | 21 passed, exit 0 |
| seekSkipRender86N3 | 9/9 test pass, exit 0 |
| previewLoop50F2 | 20 passed, exit 0 |
| ghostBlend.probe | **15 kiểm chứng xanh**, exit 0 |
| css60 (cssClasses60Q2) | PASS 60/60, exit 0 |
| css61 (cssClasses61R4) | PASS 60/60, exit 0 |
| Audit P7 (i18nAudit59P7, esbuild) | **8/8 pass** |
| orphans (binOrphan60Q7) | 17 pass, 0 fail, exit 0 |
| r6-i18n-check | PASS — dict vi==en==**2767 key** lá (không đổi) |
| U4 fail-fast | 141 pass, 0 fail, exit 0 |
| media (run-media-tests.mjs) | blobPrefetch **25 pass**, captureThumb **2 pass**, retryPlay95W2 **7 pass** — 3/3 PASS |
| media.retryPlay96X3 (esbuild) | 7 pass, 0 fail, exit 0 |
| media.stallWatchdog96X3 (esbuild) | 9 pass, 0 fail, exit 0 |
| deint-fps-verdict (X6) | pass 17, fail 0, exit 0 |
| vite-diagnosis-regex (X6) | pass 9, fail 0, exit 0 |
| xvfb-lock | **PASS, 0 lỗi** |
| test-preview-engine.sh (Z8, chạy đúng qua script) | **EXIT 0, 354 assertions pass** |

### 1.3 O8 — 21/21 cả 2 engine (log `hidden_files/round99-a10-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium (:189/5552/9652) | 18:37–18:38Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |
| WebKit (:190/5562/9654) | 18:38–18:39Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |

Số Δx khớp **đúng từng chữ** với O8 của X2/X3/X9b/Y10/Z10 trên các cây
trước — mask-track ổn định qua đợt 99 dù `preview.tsx` đổi 2 luồng
(A2 + A6). E0: 0 lỗi JS/pageerror/crash cả 2 engine.

## 2. Đối chiếu từng luồng — số headline KHỚP (4 đính chính nhỏ, không đổi kết luận)

### 2.1 A1 — 2 MiB basesrc: KHỚP

- **2 run bogus có log basesrc:** run1 (ghi đĩa) blob strict 12/12,
  bogus **0/12**; run2 (tmpfs, 0 byte ghi đĩa) blob strict 10/12, bogus
  **2/12** — đúng từng số trong `summary.txt` /
  `summary-devnull.txt` (A1). Ghi đĩa bị loại làm yếu tố ức chế: tmpfs
  cho đúng 2/12 như Z1 ghi đĩa.
- **Giá trị mới 541230788:** có trong đúng 2 file GST
  `Lc2-a1d-blobA-run1.log` + `run5.log`; cả 2 đều `fail=error-event`.
  Đọc trực tiếp file clip (python `struct`, big-endian như trường atom
  MP4): c2 tại 2 MiB+0 = `0x204286c4` = 541230788 ✓; c8 tại 2 MiB+0 =
  `0xb2544b0b` = 2991868683 ✓ (X1/Z1); c2 tại 2 MiB+32 = `0xaa26c942`
  = 2854668610 ✓ (Z1). Cả 3 giá trị lịch sử đều là u32 big-endian tại
  đúng offset A1 nêu.
- **Thành phần đặt ra 2 MiB:** `strings` trên
  `libwebkitgtk-6.0.so.4.20.0` (bản WebKit đúng của probe) còn chứa cả
  hai chuỗi A1 nêu: `"doesHaveEOS: %s, isDownloadSuspended: %s"` và
  `"queue size above low watermark, not restarting download"` ✓.
  Caveat của A1 (literal `2 * 1024 * 1024` trong source hiện tại chưa
  đọc được verbatim; điểm nối tráo buffer chưa chứng minh) được giữ
  nguyên — A10 không xác minh thêm được điểm này.
- Không sửa production (`media.ts` không đổi trong lượt A1).

### 2.2 A2 — ghost residual: KHỚP (1 đính chính nhỏ về headline)

- **Số lượng snapshot đếm lại trực tiếp từ JSON thô:** run A case B
  345 ✓, run B 527 ✓, gộp 872 ✓; run C (đường tick) 251 ✓ — khớp
  đúng từng số với LIMITS §2.2/§4.2.
- **Fisher một phía tính lại độc lập (hàm `math.comb`):** gộp có
  "trộn lẫn" [[44,62],[32,101]] p = **0,00311** (A2: 0,0031 ✓); không
  "trộn lẫn" [[22,62],[17,101]] p = **0,02863** (A2: 0,0286 ✓); run A
  riêng 0,1141 (A2: 0,114 ✓); run B riêng 0,3909 (A2: 0,391 ✓).
- **Phân tích v3 chạy lại:** `analyze-a2c.py` trên
  `preview-b-assert99a2.json` cho ra file **giống hệt từng byte** với
  `analyze-a2c-b.txt` của A2 (triple(P) 63/118, cửa sổ thật 84/89,
  pha 5/13 vs gStd 8/13).
- **Đính chính nhỏ:** headline §0 ghi "96,6% cửa sổ thật khác
  triple(P)" mà không ghi rõ là số của **run B** (86/89); gộp cả 2 run
  là **126/133 = 94,7%** (bảng §5.2 của A2 ghi đúng). Không đổi kết
  luận (vẫn ~95%).
- Instrumentation A2 (marker "Đợt 99 A2" ×8) còn đủ trên cây gộp (xem
  §3). A2 không sửa hành vi production (chỉ expose strip đo lường).

### 2.3 A3 — re-arm CANCELLED: KHỚP

- Chạy lại đếm trên `analyze-all18-a3.txt` (18 lượt): tổng **15 lần
  re-arm** ✓; **ARM-HELD = 1** — đúng 1 ca `=> ARM-HELD`: e1r tick 41,
  relMs 11829, driftArm 0,1333, driftCF 0,4063/0,8253 ✓ khớp LIMITS §0
  mục 2 từng số.
- **Grace ≥2 tick: BỊ CHẶN = 8, LỌT = 0** ✓ (đếm độc lập trên file:
  8 chuỗi BỊ CHẶN — e1r ×2, e2r ×1, f1 ×1, f3 ×1, f4 ×1, f5 ×2 — đúng
  như LIMITS ghi "3 cũ + 5 mới").
- **Arm-vì-bò: 4 ca, 27 tick-bò, 0 re-seek sau arm** ✓ (cộng trên 18
  dòng per-run; lưu ý: grep thô cả file sẽ đếm trùng phần tóm tắt
  thành 8/54 — A10 đã đếm đúng theo dòng per-run).
- **f3 CANCELLED đầu tiên:** relMs 8313, due-hẹp=true, cờ
  `[NHIỄM-PAUSE-SEEK]` ✓ — artifact probe như LIMITS §0 mục 3.
  **f5 suýt-đếm:** relMs 12919, driftCF 0,7034/0,697 (cả 2 due),
  watch@k+1=true/k+2=false, cờ `[NHIỄM-PAUSE-SEEK]` → NOT-HELD, không
  đếm ✓ như LIMITS §0 mục 4.
- Không sửa production (chỉ script trong `apps/web/scripts/`).

### 2.4 A4 — watchdog paused: KHỚP (1 đính chính nhỏ về đếm GST toàn lượt)

- **Ghép cặp flip↔play từ JSON thô** (`freezeLog[0]` trong
  `frame-parity-results.json`): r2 `flipN=17, flipsWithPlayCall=17,
  playCallN=17, repauseCount=17, playBlocks=0`; stacks
  `:2323:29 ×13 + :2333:25 ×4` ✓ đúng từng số với bảng LIMITS §2; r3
  `11/11/11/11, playBlocks=0`, stack `:2343:29 ×11` ✓. `pausedBefore`
  true tuyệt đối cả 2 lượt; gap flip−play r2 46–180 ms, r3 129–310 ms
  ✓. Cơ chế wrapper instance được xác nhận thêm bằng cờ trong JSON:
  `ownPlay=true, ownPause=true, instancePlayWrapped=true,
  instancePlayIsNative=false, instancePlayIsStub=false` cả 2 lượt.
- **Đối chiếu GST (chạy lại `analyze99a4.mjs`):** timeline media
  khớp; đếm trong cửa sổ freeze [pausedAt, resumeAt] neo theo PLAYING
  đầu tiên: r2 **1 PLAYING (GST 131,524) + 0 PAUSED** ✓, r3 **1 PLAYING
  (GST 148,378) + 1 PAUSED (GST 148,855)** ✓ — đúng từng số, kết luận
  "pipeline không tự lật 17/11 lần" đứng vững.
- **Đính chính nhỏ:** hàng "set_state của pipeline media, cả lượt"
  trong bảng §3 của A4 ghi **r2 5 PLAYING / 4 PAUSED, r3 6 PLAYING /
  5 PAUSED**; đếm lại trực tiếp trên `gst.log` (pattern
  `set_state to PLAYING/PAUSED`, player-6, pha phát sau PLAYING đầu
  tiên): **r2 4 PLAYING / 4 PAUSED, r3 6 PLAYING / 6 PAUSED**. Lệch ±1
  ở hàng nền này, không ảnh hưởng kết luận (cửa sổ freeze mới là hàng
  mang kết luận, và nó khớp chính xác). Nợ §4 mục 5 đợt 98: ĐÓNG.
- Không sửa production. Lưu ý: r2 chạy trên build `848d21c0`, r3 trên
  `efce65dd` (A6 sửa giữa chừng) — cơ chế play() nằm ở syncMedia /
  media.ts, không đổi giữa 2 build, nên không nhiễm kết luận.

### 2.5 A5 — blur B-band: KHỚP (1 đính chính nhỏ về đếm lượt)

- **B-band wk gộp r4–r16: n=96/393, mean 0,766, med 0,768, sd 0,016;
  pair-like 40 (0,750) / dc-like 56 (0,777)** ✓ đúng từng số trong
  `analysis.txt`. Đóng góp A5: B n=35/146 (đếm lại từ `analysis.json`:
  wk r12 11 + r13 4 + r15 8 + r16 12 = 35 ✓; tổng cap 37+26+34+49 =
  146 ✓). 61 cap B cũ (Z5 r4–r11) + 35 = 96 ✓.
- **D chr 1,3%:** tỉ lệ gộp chr r6–r12: D n=9 / tổng cap 693
  (A 435 + B 203 + C 46 + D 9) = 1,30% ✓. Lượt này chr D = 4/118 =
  3,4% (LIMITS A5 §2 ghi đúng cả hai con số, không nhầm lẫn).
- **Strip ghost wk 64% mislabel:** 25/39 ✓ theo bảng §108 của A5;
  các dòng verdict từng ghost trong `analysis.txt` §5b phù hợp (lệch
  thật chiếm đa số).
- **Blind wk:** r3 c1=1291 ms / c2=0 ms (trong dải Y5) ✓; r4 c1=3792
  ms / c2=671 ms ✓ — r4 được A5 ghi rõ là ngoại lệ tải (load lúc
  phát 14,75), memo c2 671 ms là ca khác 0 thứ hai trong lịch sử
  (sau 485 ms), gộp 2/21 ca khác 0.
- **Lượt mất r14:** driver log ghi exit=2 lúc 17:55:46Z sau
  `EVAL_TIMEOUT_20000ms` ×3 + timeout 60 s cuối; driver tiếp tục
  lượt sau ✓ — fix timeout đã chứng minh như LIMITS §0.1.
- **Đính chính nhỏ:** LIMITS §0 ghi "7/8 lượt có kết quả"; đếm lại
  từ driver log: 9 lượt chạy (7 driver99a5 + 2 driver99a5b), **8/9
  có kết quả** (chỉ r14 mất); riêng lượt blur là 6/7. Con số 7/8
  không khớp cách đếm nào — lỗi đếm chữ, không ảnh hưởng số liệu.
- Không sửa production (chỉ 2 probe harness mới).

### 2.6 A6 — zombie straggler: KHỚP

- **Chạy lại `round99-a6-analyze.py` trên cả 4 lượt:** zombie Δ
  state100 base **0/0/0**, ctrl **+12/+5/+8 = +25**, check **0/0/0**,
  final **0/0/0** ✓ đúng từng số với bảng LIMITS §2. Phân loại
  pre/post-seek trong cửa sổ clip lẻ: ctrl 22 capture toàn post-seek
  (11+4+7), **0 pre-seek** ✓; base/check/final 0 capture ✓.
- **`skip-clip-inactive`:** đếm trực tiếp trong JSON thô: check = **3**,
  base/ctrl/final = **0** ✓; `fb='clip-inactive' ×3` ở lượt check ✓.
- **dbgFinal khớp hoàn toàn:** base caps 6/7/8, lastFrame 89/71/89,
  fb clip-change ×3; ctrl 28/27/24, 35/28/33, fb '' ×3; check 7/5/16,
  89/81/86, fb clip-inactive ×3; final 20/51/13, 89/89/89, fb
  clip-change ×3 ✓.
- Production change duy nhất của đợt (xem §3): check clip-active
  trong `rvfcCallback` + hook test, marker "Đợt 99 A6" ×5 còn đủ.
  Nợ §4 mục 7 đợt 98: ĐÓNG (straggler 0/13 biên).

### 2.7 A7 — G1 evidence v10: KHỚP

- **Tính lại từ `benchmarks/results/g1-evidence-v10-99a7.json`:**
  pool 30fps **n=66 PASS 57 (86%), median 0,995** ✓; pool 60fps
  **n=47 PASS 44 (94%), median 0,960** ✓; chân yên 30fps (trừ hỗn
  hợp, theo quy tắc Z9) **n=21 PASS 17 (81%)** ✓ — đếm thô theo
  baseline≥10 cho n=22 PASS 18, chênh đúng 1 là run hỗn hợp Z9 run5
  (G5 1,08, tính vào pool tổng nhưng LOẠI khỏi chân yên — A7 ghi rõ
  "trừ hỗn hợp" ở bảng §88–89, A10 xác minh đúng quy tắc này).
  Mốc 16/20: 20 lần yên cuối (trừ hỗn hợp) PASS 16/20 ✓.
- **7 lần E1 mới 7/7 PASS** (0,83 / 1,03 / 1,13 / 1,48 / 1,15 /
  1,02 / 0,93): JSON `a7_e1` khớp; **run2 abort** (`a7_e1_run2_aborted:
  true`, exit=2, harness lỗi "bấm Space lần 2 mà playing vẫn true" ở
  slot 7, log `e1-run2-run.log` 17:45:15Z) được A7 phân loại abort,
  không verdict — đúng, không phải FAIL G1. Caveat: harness
  Space-toggle flaky dưới tải (ghi ở §7).
- **60fps:** 4/5 PASS (0,71 FAIL / 0,90 / 0,94 / 0,93 / 0,94) ✓;
  run1 0,71 FAIL cũng FAIL dưới M2 (0,73) — G5/M2 đồng thuận ✓.
- **1,48 vs 1,49:** log run5 ghi mean 1,49× từ tỉ lệ làm tròn
  (1,43/1,32/1,34/2,13/1,21); JSON lưu 1,48. A7 đã tự đính chính ở
  LIMITS dòng 138 ("tính lại từ tỉ lệ làm tròn: 1,48") — không phải
  lỗi số. Caveat run7 (baseline 14,83 nhưng slot dao động 5,52–25,77)
  đã được A7 nêu; nếu phân loại lại thành hỗn hợp thì chân yên vẫn
  16/20 = 80% — kết luận không đổi.
- Chỉ đo, không sửa production. G1 VẪN MỞ — quyết định thuộc
  parent/user (xem §5).

### 2.8 A8 — EPERM probe #18: KHỚP

- **Heartbeat + log đọc trực tiếp:** `eperm-probe-v2.heartbeat` n=18,
  ts 17:40:14Z, boot `99338d31…`, pid 7689 ✓; log
  `eperm-probe-v2.log` 46 dòng (43→46, đúng +3 checklist) ✓; dòng
  probe#18: `2026-11-12T17:40:14Z probe#18 boot=99338d31 tmp+ws ok=2
  fail=0` ✓; dòng `boot changed 65bc5fb6 -> 99338d31 (reboot detected,
  uptime since 2026-11-12 17:25:39)` ✓ — xác minh luôn giờ reboot #22
  chính xác từng giây (A10 kiểm lại bằng `uptime -s` lúc 18:5xZ:
  `2026-11-12 17:25:39` ✓).
- **Quét WFS:** `scan-meta.txt` NEWSTD 115 file / 356 dòng ✓
  (`wfs-newstd.txt` đếm lại đúng 115 dòng); 356 + 25 (copies) = 381
  = R7b, chênh 0 ✓ — khớp tuyệt đối lần thứ sáu liên tiếp như A8 ghi.
- Không đụng TTS 39, không thử birefnet, không tự tạo cron 10 phút ✓
  (theo LIMITS + log md của A8).

### 2.9 A9 — G1 metric G5 vs M2: KHỚP

- **Chạy lại `analyze-g5-vs-m2.py`** (bản copy, output chuyển sang
  scratch A10): file tóm tắt JSON **giống hệt từng byte** với của A9.
  Tổng 69 lần, đồng thuận **63/69 (91,3%)** ✓; 6 lần bất đồng, **cả 6
  đều G5 PASS → M2 FAIL, 0 lần ngược lại** (dòng "Flips: 6 —
  PASS->FAIL: 6, FAIL->PASS: 0" trong output chạy lại) ✓.
- **Quy luật biên G5:** G5≥1,00 lật 0/36 ✓; [0,75;0,90) lật 4/10 ✓;
  [0,90;1,00) lật 2/19 ✓. Yên 24/25, tải 39/44 ✓. Loại mẫu số đóng
  băng: 4/69 ✓; M2 vs M2c khác verdict 0/58; M2mean vs G5 khác verdict
  0/58 ✓ — bước làm M2 chặt hơn là median, không phải bước loại.
- **Đính chính X6:** M2mean E1 = **22/26** — kiểm lại: 4 FAIL E1
  (S6 r1 0,73; U6 r2 0,67; W6 r6 0,74; W6 r7 0,69) đều có M2mean = G5
  đúng từng số trong `m2-analysis.txt` (không tỉ lệ nào bị loại);
  E1-30fps n=32 (gồm 6 lần Z9) PASS 28 → trừ 6 lần Z9 (đều PASS) còn
  22/26 ✓. X6 ghi 21/26 là sai 1.
- **Chân yên dưới M2:** tập con tính lại được 12/14 (86%) ✓ (output
  chạy lại: M2 n=14 PASS 12/14); 4 lần mất fpsSlots đúng là I5-1 0,93
  PASS + J3-1 0,68 / L3-1 0,65 / L3-2 0,68 FAIL (kiểm lại từ pool30
  trong JSON A7) → khoảng 12–13/18 (67–72%) ✓ như A9 ghi.
- Chỉ phân tích offline, không đo mới, không sửa production, không
  đổi metric/ngưỡng, không tự đóng G1 ✓.

## 3. Va chạm gộp — preview.tsx: 2 luồng cùng sửa, không mất marker

- **File duy nhất bị 2 luồng sửa:** `apps/web/src/preview.tsx` (A2 +
  A6). Tất cả 23 file còn lại trong 9 batch đều duy nhất (tổng 24 entry
  / 23 file duy nhất đợt 99). Không file `.github/workflows/*` nào bị
  đụng; không binary nào vào batch.
- **Trên đĩa lúc đóng băng (md5 `efce65dd…`, = build cuối của A6):**
  marker "Đợt 99 A2" **×8** (dòng 1211, 1239, 1268, 1301, 1468, 1815,
  2461, 2541) + marker "Đợt 99 A6" **×5** (dòng 1568, 1908, 2075, 2110,
  3803) — cả hai bộ đều đủ. Marker cũ còn nguyên: "Đợt 98 Z2" ×10,
  "Đợt 98 Z3" ×7, "Đợt 98 Z6" ×5.
- **Thứ tự sửa (khôi phục từ log):** A2 sửa trước (vite riêng 5173 từ
  17:46, probe 17:47–17:57Z); A6 sửa sau trên nền đã có A2 (build cuối
  `efce65dd` đo 18:09–18:13Z); A5 đo trên cả 2 build giữa lượt
  (`848d21c0` rồi `efce65dd`) và xác minh blend math không đổi (đúng 1
  marker "Đợt 99" trong `compositeMotionBlurLayer`). A4 đo trên cả 2
  build, cơ chế không đổi. **tsc 0 + vite build PASS + toàn bộ suite
  xanh + O8 21/21 cả 2 engine sau gộp — không xung đột nội dung.**
- **Lưu ý nhỏ (không sai số):** A6 LIMITS ghi marker ×5 — đếm lại
  đúng 5 dòng chứa chuỗi "Đợt 99 A6" (lần đếm tay trước đó của A10 ra
  6 do pattern grep rộng bắt cả `__vcut99a6…` — đã đính chính).

## 4. Boot + reboot trong lúc verify

- Boot duy nhất `99338d31-a4bc-4020-b910-301c997a24a2` từ lúc A10 bắt
  đầu (17:42Z) tới lúc O8 xong (18:39Z). **Không reboot nào trong lúc
  verify** — không phần nào phải chạy lại (khác Z10 đợt 98 bị reboot
  #21 giết giữa U4).
- Reboot #22 lúc 17:25:39Z xảy ra TRƯỚC đợt (A8 xác minh; A10 kiểm
  lại bằng `uptime -s`). Reboot tiếp theo dự kiến ~19:29Z theo chu kỳ
  ~2h03' — sau khi A10 xong việc (LIMITS viết 18:4x–19:0xZ).

## 5. Trạng thái nợ sau đợt 99 (cập nhật từ LIMITS gộp đợt 98 §4)

1. **Z10 kiểm chứng độc lập + O8 — ĐÃ XONG (luồng này).** 9/9 luồng
   đối chiếu khớp; O8 21/21 cả 2 engine lần đầu có trong LIMITS verify
   của đợt 99 (Z10 đợt 98 làm sau, ở file riêng).
2. **2 MiB — đã có tên thành phần + bằng chứng binary.** Còn mở: điểm
   nối tráo buffer chưa chứng minh (nằm ở/below `webkitwebsrc.create()`
   hoặc handoff typefind/adapter); distinction cuối "format cost vs
   nhiễu thời gian của debug call" chưa tách được.
3. **Ghost residual — cơ chế mới: snapshot đường tick gán sai nhãn hệ
   thống** (chỉ 47,4% sạch, n=251; A2). Residual thưa được giải thích
   bởi thành phần cửa sổ (95,5% khớp theo cửa sổ thật). Còn mở: residual
   dense (pump sống, cửa sổ liên tiếp) vẫn chưa đo; ghost wk mislabel
   64% (A5) cùng hướng với A2 — hai luồng độc lập cùng kết luận nhãn
   ghost wk sai hệ thống.
4. **Re-arm — phân loại rộng ARM-HELD đếm được đuôi chặn thành công
   (1 ca thật/18 lượt); CANCELLED hẹp đầu tiên là artifact probe.**
   Grace ≥2 tick BỊ CHẶN 8 / LỌT 0. Arm-vì-bò lần đầu quan sát được
   ngoài đời (4 ca, 27 tick-bò, 0 re-seek sau arm) — fix Z3 hoạt động.
5. **Watchdog freeze — ĐÃ ĐÓNG.** Cơ chế lật `paused` ĐÃ XÁC NHẬN:
   app tự `play()` qua wrapper instance của MediaPool (bypass stub
   prototype); giả thuyết "pipeline tự lật" của Z4 BỊ BÁC làm cơ chế.
   Còn mở duy nhất: vì sao chỉ 1–2/17 lệnh tới được GStreamer dưới
   dạng `set_state` (WebKit hấp thụ toggle nhanh — chưa đọc code
   WebKit).
6. **Blur parity — B-band wk n=96 gộp (r4–r16), D ~1%.** Định nghĩa
   "định" vẫn không thỏa (khe 2-means 0,0022, 1,66σ). Mới: ghost wk
   mislabel 64%; cap D r7 dị thường vẫn mở (A5 không lặp lại được
   trong 118 cap chr mới — nhưng cũng không giải thích được r7).
   Blind wk: r3 trong dải Y5; r4 là ngoại lệ tải (3792 ms); memo c2
   có thêm 1 ca khác 0 (671 ms) — cần thêm lượt blind yên để chốt
   đuôi, không vội kết luận.
7. **Zombie pump — ĐÃ ĐÓNG.** Straggler tiền-seek 0/13 biên (9 đợt
   này + 4 Z6); check clip-active là lưới an toàn, đường chạy thường
   không bắn.
8. **G1 đóng hay chưa — VẪN MỞ, chờ parent/user quyết.** A7: chân
   yên 30fps đạt đủ cả ba tiêu chí chặt lần đầu (17/21 = 81%, median
   0,940, CI cận dưới 0,852); mốc 16/20 đã đạt. A9 khuyến nghị: GIỮ
   G5 cho đến khi khung 16/20 khép lại, rồi chuyển sang M2 làm metric
   chính; nếu đổi sang M2 ngay thì phải định nghĩa lại khung và xử lý
   4 lần mất fpsSlots bằng cờ rõ ràng. Ngưỡng giữ nguyên 0,75× cả hai
   phương án. Pool 60fps n=47 PASS 44/47 (94%); run N10 0,71× là lần
   FAIL 60fps đầu tiên kể từ M1 (G5/M2 đồng thuận FAIL).
9. **EPERM — probe #18 ok=2 fail=0; khoảng mù #17 ĐÃ ĐÓNG** (2 reboot
   đã xác nhận). Tiếp theo: probe #19 + khoảng mù #18. Cron riêng 10
   phút vẫn chờ user quyết (A8 không tự tạo).
10. **Birefnet-general trong gói: vẫn 0 lần chạy thành công** (không
    thử đợt này — RAM dưới ngưỡng guard; quyết định parent đợt 92 giữ
    nguyên).
11. **TTS 39: không kiểm lại đợt này** (lệnh cấm được tuân thủ).
12. **ci-security.yml + ci-build.yml: vẫn 403** (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App). Không file workflow
    nào bị đụng đợt này.
13. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi
    ngang/hơn CapCut thật.

## 6. Batch đã stage (KHÔNG push)

- A10: `phase9-round99-a10-verify.txt` — 1 entry NUL-delimited
  (LIMITS này), read-back OK (xem dưới).
- Đợt 99 (9 luồng): **24 entry / 9 file** (A1 5, A2 2, A3 5, A4 2,
  A5 3, A6 3, A7 2, A8 1, A9 1) / 23 file duy nhất (preview.tsx
  chung A2+A6).
- **Tổng chờ push sau đợt 99 (đếm lại trực tiếp từ đĩa, đợt 67–99):
  331 file batch / 2363 entry / 1425 file duy nhất** (sau đợt 98 +
  Z10: 321/2338/1402; đợt 99: +9 file/+24 entry/+22 file duy nhất
  mới — preview.tsx đã có trong backlog từ trước nên chỉ +22 unique;
  A10: +1/+1/+1). HEAD vẫn 5f548ef8. KHÔNG push.

## 7. Ghi chú vận hành cho verify sau

- **Poller của A10 chạy lại:** poller cũ (pid 8156) sống suốt đợt và
  dừng đúng khi ALL LANDED 9/9 (18:31Z) — mẫu này dùng được cho đợt
  sau: đừng khởi poller thứ hai khi bản chạy lại thấy poller còn sống.
- **Đếm arm-vì-bò / tick-bò trong file gộp của A3:** phải đếm trên
  dòng per-run, không grep thô cả file (phần tóm tắt lặp lại số liệu
  → đếm trùng đúng 2×).
- **Đếm set_state GST:** A4 ghi số toàn lượt lệch ±1 so với đếm lại
  (r2 PLAYING 5→4, r3 PAUSED 5→6 ở pha phát). Verify sau nên đếm
  theo đúng phương pháp đã ghi (player-6, pha phát) và đối chiếu
  hàng "cả lượt" trước khi nhận.
- **Đếm lượt của A5:** "7/8 lượt có kết quả" không khớp cách đếm nào
  (thực tế 8/9 lượt chạy, 6/7 lượt blur). Verify sau kiểm tra số
  lượt chạy trong driver log trước khi nhận headline đếm lượt.
- **Headline tỉ lệ gộp của A2:** "96,6% cửa sổ thật khác triple(P)"
  là số run B; gộp là 94,7%. Verify sau đối chiếu headline với bảng
  chi tiết khi headline không ghi rõ phạm vi.
- **Reboot dự kiến ~19:29Z** (A8 tính từ chu kỳ 2h03'): verify đợt
  100 nên bắt đầu sớm sau reboot đó để có đủ cửa sổ ~2h.
- **Caveat harness:** E1 run2 của A7 abort do Space-toggle flaky
  dưới tải (không phải FAIL G1); r14 của A5 mất do evaluate treo
  nhưng timeout fix đã chặn đúng thiết kế — cả hai đều là nhiễu
  harness, không phải hồi quy sản phẩm.
