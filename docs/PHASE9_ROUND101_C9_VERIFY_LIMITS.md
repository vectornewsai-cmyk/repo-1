# Phase 9 đợt 101 — C9: kiểm chứng độc lập (7/8 về đủ, C1 không về; cây gộp xanh, O8 21/21 cả 2 engine)

> Luồng C9, đợt 101, lượt cron 06:35 +07 13/11/2026. KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production. KHÔNG đụng TTS 39, birefnet,
> `.github/workflows/*`.
>
> **Kết quả chung: 7/8 luồng C2–C8 về đủ; C1 (2 MiB) KHÔNG về** (chỉ có
> dữ liệu đo thô, không LIMITS, không batch — parent đã ghi là nợ đợt
> 102, C9 xác nhận độc lập). **Cây gộp xanh: tsc 0/0, vite build PASS
> 6,33 s, 25/25 mục suite offline exit 0 ngay lần đầu (không retry),
> test-preview-engine.sh 354 assertions, O8 21/21 cả 2 engine ngay lần
> đầu (không retry). Đối chiếu headline 7/7 luồng đã về KHỚP với dữ
> liệu thô trên đĩa, với 6 đính chính nhỏ (xem §2, không đổi kết luận
> nào). Poller đếm nhầm 8/8 do glob khớp cả file closing (xem §0).**

## 0. Dòng thời gian + phương pháp

- **C9 bắt đầu:** 23:39:57Z 12/11 (boot `aa3f2b67`, RAM khả dụng 660 MB,
  `preview.tsx` md5 `94ee64c0` = cuối đợt 100). Lúc bắt đầu chưa có
  dấu vết đợt 101 nào trên đĩa.
- **Poll đĩa (poller C9, mỗi 10 phút):** 23:41Z **0/8** → 23:51Z **1/8**
  (C6) → **reboot #25 lúc 23:51:21Z** (boot `aa3f2b67 → 3a12a7d3`,
  `uptime -s` xác minh; poller cũ chết cùng reboot, khởi động lại
  23:52Z, resume từ `poll.log`) → 00:02Z **1/8** → 00:12Z **2/8** (+C8)
  → 00:22Z **3/8** (+C7) → 00:32Z **4/8** (+C2) → 00:42Z **6/8** (+C3,
  C5) → 00:52Z–01:22Z **6/8** → 01:32Z **"8/8" theo glob — SAI, xem
  dưới** (thực chất 7 luồng + file closing; +C4). Poller dừng.
- **Đính chính poller (lỗi của chính C9):** glob `phase9-round101-c*.txt`
  khớp cả `phase9-round101-closing.txt` (closing bắt đầu bằng "c") nên
  poller đếm 8 file khi chỉ có 7 luồng. Đếm đúng: C2, C3, C4, C5, C6,
  C7, C8 = **7/8**; C1 không có file paths nào. Verify sau dùng glob
  `phase9-round101-c[1-9]-*.txt` hoặc trừ file closing.
- **C1 không về — đã rõ, không chờ thêm:** launcher C1 exit 0 lúc
  23:43Z (watchdog: launcher gone, 0 kill rounds); file C1 mới nhất
  `disasm-websrc.txt` 23:48Z; không process C1 nào còn chạy lúc 01:33Z;
  không LIMITS, không batch. C1 đã chạy xong 4 probe blobA (playOk=true
  cả 4) nhưng không viết kết luận/stage. Parent đã gộp 7 luồng và ghi
  C1 là nợ đợt 102 — C9 xác nhận độc lập từ đĩa.
- **Dấu hiệu sống giữa chừng:** 23:43Z đã có thư mục `round101-c1` +
  `round101-c7`; 23:52Z sau reboot đã có đủ thư mục `round101-c1`…
  `round101-c8`. Không luồng nào chết yểu ngoài C1 dừng sớm không báo.
- **Cây gộp đóng băng lúc verify (01:33Z):** `preview.tsx`
  `07f567926935eef429a5e2b9bacf707f` (C4 post-fix), `media.ts`
  `2c384ed13703809d5e999311147745e7` (không đổi từ đợt 99),
  `playheadHold90R2.ts` `00cce1acb343b6b0cd28ca1824eedfcb` (C3),
  `previewEngine.ts` `cd540de9c6c58a50fb81cf4a1f085c82` (C4).
  Không còn process luồng C1–C8 nào chạy lúc đóng băng. Verify offline
  01:37–01:41Z; O8 01:42–01:44Z. **Không reboot trong lúc verify**
  (boot `3a12a7d3` suốt).
- **Script verify:** `hidden_files/round101-c9-verify.sh` (dựa trên
  `round100-b9-verify.sh`; không cần `new-tests.sh` riêng vì test mới
  của C3 nằm trong `playheadHold90R2.test.ts`, của C4 trong
  `previewEngine.test.ts`, của C8 trong `deint-fps-verdict*.test.mjs`
  — tất cả đã nằm trong suite §1.2) + script O8
  `round101-c9-o8.sh` (dựa trên `round100-b9-o8.sh`; fixtures copy
  TRƯỚC từ `round100-b9/o8-chromium`, md5 khớp A10/B9: white
  `07bc0cb9…`, ball `6df873f7…`, track `cdf9a252…`; WebKit đọc fixture
  từ `round87-o8/headed`, md5 khớp — xem §1.3.1). Log:
  `round101-c9-suites.log`, `round101-c9-o8.log`, poll log
  `round101-c9/poll.log`.

## 1. Kiểm chứng trên cây gộp

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 6,33 s** |

### 1.2 Suite offline (log `hidden_files/round101-c9-suites.log`)

| test | kết quả |
|---|---|
| playheadHold90R2 | **75 passed** (65 cũ + 10 mới C3-R1..R10), exit 0 |
| playheadPacing54K9 | 19 pass, 0 fail, exit 0 |
| previewEngine | 18 test passed (mask) + **27 test passed** (rvfc, tăng từ 25 — 2 test mới C4), exit 0 |
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
| deint-fps-verdict-100b7 (B7) | **pass 13, fail 0**, exit 0 |
| armHeld99a3 (A3) | **pass 16, fail 0**, exit 0 |
| vite-diagnosis-regex (X6) | pass 9, fail 0, exit 0 |
| xvfb-lock | **PASS ngay lần 1**, exit 0 (B9 đợt 100 FAIL lần 1 do race display — lần này không tái hiện) |
| test-preview-engine.sh (Z8, chạy đúng qua script) | **EXIT 0, 354 assertions pass** |

**Tổng: 25/25 mục exit 0 ngay lần đầu** (không mục nào cần chạy lại).

### 1.3 O8 — 21/21 cả 2 engine, ngay lần đầu (log `hidden_files/round101-c9-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium | 01:42–01:43Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |
| WebKit | 01:43–01:44Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |

Số Δx khớp **đúng từng chữ** với O8 của X2/X3/X9b/Y10/Z10/A10/B9 trên
các cây trước — mask-track ổn định qua đợt 101 dù `preview.tsx` đổi
2 luồng (C3 + C4). E0: 0 lỗi JS/pageerror/crash cả 2 engine.

#### 1.3.1 Không retry lần này — vì sao nhanh hơn B9, và 2 ghi chú môi trường

- Cả 2 leg exit=0 ngay lần đầu (tổng ~105 giây). B9 đợt 100 mất ~36
  phút vì phải sửa môi trường (quên copy fixture + cài 22 lib WebKit);
  lần này fixtures đã copy trước (md5 khớp) và libs WebKit đã có sẵn
  trên boot `3a12a7d3` (C4 cài lại deps bằng azure sau reboot #25;
  C9 kiểm `ldd` MiniBrowser-gtk trước khi chạy: chỉ 4 thiếu — đúng 4
  benign B9 đã ghi: libwebkitgtk + libjavascriptcoregtk trong bundle,
  libbacktrace + libjxl lazy/optional).
- **Đính chính parent closing:** parent ghi "O8 webkit còn trống" —
  SAI. Thư mục `round101-c9/o8-webkit` (scratch) đúng là trống, nhưng
  script WebKit đọc fixture từ `round87-o8/headed` (hardcode trong
  script, dòng 201–204), nơi fixture đầy đủ và md5 khớp. O8 WebKit
  chạy 21/21 ngay lần đầu là bằng chứng.
- **Ghi chú nhỏ:** leg WebKit dùng display/ports mặc định của script
  (`:188`/`:5560`) chứ không dùng `O8_DISPLAY=:190`/`O8_DEV_PORT=5562`
  mà script O8 của C9 truyền — script webkit bỏ qua 2 biến này (leg
  Chromium thì dùng đúng `:189`/`:5552`). Không ảnh hưởng kết quả;
  verify sau cứ để mặc định hoặc sửa script cho nhất quán.
- `gst-launch-1.0` vẫn không có trên VM (như B9) — không cần cho O8.

## 2. Đối chiếu từng luồng — số headline KHỚP (6 đính chính nhỏ, không đổi kết luận)

### 2.1 C1 — 2 MiB junction probe: KHÔNG VỀ (chỉ có dữ liệu thô)

- **Dữ liệu thô có thật:** 4 run blobA c2 trong
  `benchmarks/results/webkit-blob-flaky-101c1-websrc.json`:
  playOk=**true 4/4**, frames 127/138/155/144, failKind=ok — KHÔNG có
  bogus lần nào. `summary-c1.txt` + `matrix101c1.log` khớp từng run.
- **Không mâu thuẫn với B1 (4/4 bogus):** C1 chạy setup khác B1
  (media-pool bundle, production 8 MiB pool) chứ không phải blobA
  trực tiếp như B1 — 0/4 bogus ở setup pool là quan sát mới, chưa
  được C1 kết luận gì (không LIMITS). Ghi nhận cho đợt 102, không tự
  kết luận thay C1.
- **Đính chính nhỏ — parent tóm tắt C1 trộn 2 run:** LIMITS gộp đợt
  101 §1 ghi "stopping download 6, high watermark 6, queue-size 12,
  `max 20971520` 6, `2097152` 8, Range request 10, stop_typefinding 7,
  find type in pull mode 1, flush-stop 5; … webKitWebSrcCreate 3236
  dòng, typefind 327 dòng" — các đếm đầu là của **run1**, còn
  create 3236 / typefind 327 là của **run4** (run1: 3242/309; run2:
  3292/309; run3: 3222/320). Các đếm từng run đều đúng trong
  `summary-c1.txt`; chỉ là parent ghép 2 run vào một dòng. Không đổi
  gì (C1 vốn chưa có kết luận).
- **Không có field stale kiểu B1:** JSON C1 ghi đúng
  `"round": "phase9-round101-c1-typefind-websrc"` (B1 còn field
  `"round": "phase9-round99-a1-basesrc"` cũ).
- C1 không sửa production (chỉ probe + JSON + summary).

### 2.2 C2 — Ghost residual: KHỚP

- **Jitter mẫu lớn:** đếm trong `analyze-c2-idle.txt` /
  `analyze-c2-quiet.txt`: D1 distinct clean **72**, đơn-nghĩa n=**163**
  (44%) ✓; D1b clean **52**, n=**114** (46%) ✓; flip-baseline trong
  `analyze-c2-flip.txt`: clean **68/151 = 45,0%** ✓.
- **F5 bị bác:** counterfactual trong file analyze cho δ* tốt nhất
  +0 cả 3 mẫu (C9 đối chiếu dòng CF, không chạy lại toàn bộ
  counterfactual — cùng code analyze đã dùng ở B2).
- **δ-tracking mâu thuẫn:** `analyze-c2-autocorr.txt`: D1 lag-1
  **86/162 = 53,1% vs chance 28,1%** ✓; D1b **31/113 = 27,4% vs
  chance 29,0%** ✓.
- **Flip:** `analyze-c2-flip.txt`: hậu flip [0,2000ms) |gap|≤3
  **32/32** ✓; [5000,15000ms) **0/154** ✓; [15000ms+) **0/605** ✓;
  gap tại seek +8022ms = **233**, +34527ms = **1028**, 10 gap cuối
  1028–1030 ✓.
- C2 không sửa production (chỉ probe + analyzer).

### 2.3 C3 — Re-arm drift-gate: KHỚP

- **Gate/burst:** cộng từ `analyze-h1-h12-c3.txt`: tailDriftGate
  theo lượt [0,0,0,10,0,0,7,6,5,5,5,6] = **44** ✓; tailBursts
  [1,1,1,5,1,1,2,6,3,4,3,3] = **31** ✓; dòng tổng ghi đúng
  "tailBursts: 31 | tailDriftGate: 44 | f4-like: 0" ✓.
- **f4-like 0/12:** cả 12 lượt trong file analyze đều ghi
  "f4-like …: 0 (kèm kẹt seek: 0)" ✓.
- **Grace:** cộng từ `analyze-h1-h12-a3.txt` (analyzer A3): chuỗi
  ≥2 tick BỊ CHẶN **11**, LỌT **0** ✓.
- **ARM-HELD §6 = 1/12:** file a3 ghi "ARM-HELD §6 (99A3): 1" ở lượt
  h12 ✓; CANCELLED hẹp h11-7863 có cờ [NHIỄM-PAUSE-SEEK] trong
  analyzer ✓ (khớp LIMITS C3 §5).
- **Test mới:** `playheadHold90R2.test.ts` chứa **C3-R ×10** ✓; chạy
  lại trên cây gộp: **75/75** ✓ (xem §1.2).
- **Code trên cây gộp:** hằng `PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S =
  0,35` + nhánh `driftGateBlocked` trong `playheadHold90R2.ts` ✓;
  marker "Đợt 101 C3" **×5** trong `preview.tsx` ✓ (xem §3).
- C3 là 1 trong 2 luồng sửa production đợt này (cùng C4).

### 2.4 C4 — Blur pad-oldest: KHỚP (Fisher tính lại khớp từng chữ)

- **B-band:** `analysis101c4.txt`: wk gộp r4–r24 **B n=180/671, mean
  0,765, med 0,768, sd 0,015; pair-like 75 / dc-like 105** ✓ đúng
  từng số với LIMITS §1.
- **D post-fix:** `analysis101c4-postfix.txt`: chr **0/688**, wk
  **0/179** ✓; C9 tính lại Fisher một phía bằng `math.comb`:
  gộp **p=3,55e-06** (C4 ghi 3,6e-06 ✓), chr **p=5,1e-04** ✓, wk
  **p=0,028** ✓.
- **Coupling:** tính lại Fisher: ghost−1 10/23 vs nền 39/221 →
  **p=0,00630** (C4 ghi 0,0063 ✓).
- **Test mới:** `previewEngine.test.ts` chứa 2 test C4
  (`motionBlurPadGhostCount`, `motionBlurBlendPlan` pad) ✓; chạy lại
  trên cây gộp: **27/27** (tăng từ 25) ✓.
- **Code trên cây gộp:** `motionBlurPadGhostCount` trong
  `previewEngine.ts` + import/dùng trong `preview.tsx` (dòng 2572)
  ✓; md5 `preview.tsx` = `07f56792` = post-fix C4 ✓.
- C4 là luồng thứ 2 sửa production đợt này. C4 không chạy blind
  (đã ghi rõ).

### 2.5 C5 — Zombie early-return qua seek-across: KHỚP

- **24/24:** đếm trong file analyze (`analysis-all.txt`): pump
  events lượt seek-across x1 `skip-clip-inactive: 12` ✓ và xl1
  `skip-clip-inactive: 12` ✓; các lượt thường n1/l1/p1: 0 ✓.
- **Đối chứng dương:** `analysis-c5c3.txt`: pump events
  `skip-clip-inactive: 6` ✓.
- **Độ trễ kill:** C9 không đo lại từng timestamp (tin bảng C5 §2
  đã trích từ `driverActions` trong JSON thô); mẫu kiểm tra 2 ca
  trong JSON x1 cho trễ skip−seek ~25–31 ms, cùng dải R3 23–31 ms
  mà C5 ghi.
- **Đính chính nhỏ (ghi chú phương pháp, không phải số sai):**
  C5 §4 mục 3 ghi driver cũ in exit=0 cho mọi lượt do `$(date)`
  ghi đè `$?` — C9 xác nhận cơ chế này có thật trong `run.sh`
  (lệnh echo gọi `$(date ...)` trước khi in `$?`); các lượt C5
  chỉ đánh giá theo file đĩa như C5 đã làm. Parent nên kiểm tra
  driver các đợt trước có cùng lỗi khi đọc log exit code cũ.
- C5 không sửa production (chỉ probe + analyzer).

### 2.6 C6 — EPERM probe #20: KHỚP

- **Checklist P8 §2.3 đọc trực tiếp trong
  `eperm-probe-v2.log` (52 dòng, trước lượt 49 — đúng +3):**
  `probe DEAD detected by status (last #19 … age 10756s)` 23:39:51Z
  ✓; `boot changed 66fb273d -> aa3f2b67 (uptime since 2026-11-12
  21:41:50)` ✓; `probe#20 boot=aa3f2b67 tmp+ws ok=2 fail=0`
  23:39:56Z ✓; heartbeat `n=20, ts=23:39:56Z, boot aa3f2b67` ✓.
- **Khoảng mù #19 ĐÃ ĐÓNG:** 20:40:35Z → 23:39:56Z, chứa đúng 1
  reboot #24 21:41:50Z (C9 xác nhận độc lập bằng `uptime -s` lúc
  20:39Z đợt 100 và bằng reboot #25 sau đó — boot đổi 1 lần).
- **Đính chính nhỏ — giờ reboot #25:** C6 dự báo "~23:45Z" (từ chu
  kỳ trung bình ~2h03'); thực tế reboot #25 là **23:51:21Z** theo
  `uptime -s` (C5 ghi đúng 23:51:21Z; C7 ghi 23:51:32Z lệch 11 giây;
  C8 ghi ~23:52:16Z lệch ~55 giây). Dự báo theo trung bình trượt
  ~6 phút lần này — tốt hơn lần B6 (trượt ~54') nhưng vẫn trượt;
  chu kỳ reboot không đều, đừng dự báo chặt (C6 đã tự cảnh báo).
- C6 không đụng TTS 39, không thử birefnet, không tự tạo cron ✓.

### 2.7 C7 — G1 evidence: KHỚP (tính lại từ JSON gộp)

- **Pool v11** (`benchmarks/results/g1-evidence-v11-101c7.json`):
  pool30 **n=82**, pool60 **n=54**, b7_e1 9, b7_60 2, c7_e1 7,
  c7_60 5 ✓.
- **Chân yên M2** (`m2-quiet101c7.json`, C9 tính lại bằng script):
  quiet30 n=**27**, known=**23**, PASS=**21**, FAIL đúng 2
  (U6-2 0,57; X6-6 0,63) ✓; khoảng [21,22,27] ✓; 20 lần đầu tối
  đa **15** ✓; 20 lần mới nhất **19/20** ✓; flips_total **6**,
  agree **98**, n_runs_m2 **104** ✓; quiet60 n=**17**, PASS 17/17 ✓.
- **Test hồi quy:** `deint-fps-verdict` 17/17 + `100b7` 13/13 chạy
  lại trên cây gộp ✓ (xem §1.2).
- C7 không sửa production, không tự đóng G1 ✓ (chỉ thu thập bằng
  chứng + 4 khung + Q1–Q5 cho user).

### 2.8 C8 — Harness retry/fallback bắn thật: KHỚP

- **Retry:** log `e1-fault-retry-run.log`: "Space lần 1 … playing
  về true sau 28ms (lần thử 2, space-retry)" ✓.
- **Fallback:** report JSON `e1-fault-fallback/c77e1-headed-report.json`:
  `playMethods=['space', 'store-fallback']`,
  `retry/fallback=[(1, 0, 'baseline', 'store-fallback', 13, 'space', 7)]`
  — fallback lật sau 13 ms ✓ đúng từng số với LIMITS §1.
- **Harness md5 trên cây gộp khớp đúng từng chữ với C8 ghi:**
  E1 `d18e04653cea44c7ce8e6bc6d0f4dcde` ✓, N10
  `3bc93119839a298ad743b2144b398e41` ✓, verdict
  `57a4f6d820edd1772b24bf8239563fa7` ✓.
- **Test hồi quy:** deint-verdict 17/17 + 100b7 13/13 trên cây gộp ✓.
- C8 không sửa production (chỉ harness/probe).

## 3. Va chạm gộp — preview.tsx: 2 luồng cùng sửa, không mất marker

- **File duy nhất bị 2 luồng sửa:** `apps/web/src/preview.tsx` (C3 +
  C4). Tất cả file còn lại trong 7 batch đều duy nhất (tổng 19 entry
  / 19 file duy nhất đợt 101 — không trùng file nào giữa các luồng).
  Không file `.github/workflows/*` nào bị đụng; không binary nào vào
  batch.
- **Trên đĩa lúc đóng băng (md5 `07f56792`):** marker "Đợt 101 C3"
  **×5**, "Đợt 101 C4"/pad-oldest **×12** (gồm `paddedGhosts`,
  `lastDrawnPaddedGhosts`, import `motionBlurPadGhostCount`). Marker
  cũ còn nguyên: "Đợt 100 B2" ×6, "Đợt 100 B3" ×5, "Đợt 100 B4" ×3,
  "Đợt 99 A2" ×8.
- **Thứ tự sửa (khôi phục từ poll md5):** `94ee64c0` (cuối đợt 100) →
  `a6e34691` (C3, ~00:07Z) → `68741a23` (trung gian, poll 00:42Z —
  C9 không gán chắc cho luồng nào, có thể là C4 đang sửa dở) →
  `07f56792` (C4 post-fix, ổn định từ poll 01:02Z). Cây ổn định từ
  01:02Z trở đi.
- **Blend math không đổi ngoài pad-oldest của C4:** C3 chỉ thêm
  instrumentation + helper drift ở vùng đuôi/grace; C4 thêm pad
  ghost trong `compositeMotionBlurLayer` (đúng fix đã đăng ký, có
  test 27/27 + D post 0/867). tsc 0 + vite build PASS + toàn bộ
  suite xanh + O8 21/21 cả 2 engine sau gộp — không xung đột nội dung.
- **Thay đổi production có logic mới đợt này (đúng 2):** drift-gate
  của C3 (`playheadHold90R2.ts` + vùng đuôi/grace trong
  `preview.tsx`) và pad-oldest của C4 (`previewEngine.ts` +
  `compositeMotionBlurLayer`). Mọi luồng khác chỉ đo / probe / test /
  docs / harness.

## 4. Boot + reboot + RAM trong đợt

- **Reboot #25 lúc 23:51:21Z** (boot `aa3f2b67 → 3a12a7d3`,
  `uptime -s` xác minh) xảy ra GIỮA đợt, trong lúc C9 đang poll:
  giết poller cũ của C9 (khởi động lại 23:52Z, không trùng) và giết
  driver C5 (R2) + driver C7 (N10 run3) giữa chừng — cả hai chạy lại
  sau reboot. Khoảng cách #24→#25 = 2h09'31" — gần đúng chu kỳ trung
  bình ~2h03'. Dự báo reboot của C6 (~23:45Z) trượt ~6'.
- **Không reboot trong lúc verify** (boot `3a12a7d3` từ 23:52Z tới O8
  xong 01:44Z). Reboot tiếp theo không dự báo được chắc chắn.
- **RAM khả dụng (MemAvailable):** poll C9: 660 → 2082 → 1408 (sau
  reboot) → 889 → 2950 → 1776 → 3071 → 978 → 515 → 889 → 962 →
  984 → 930 MB; C6 ghi min **447 MB** trong lượt. Max quan sát
  trong đợt ~3,1 GB, **luôn dưới ngưỡng guard 6 GB** — birefnet
  KHÔNG chạy (đúng quy tắc parent đợt 92).
- **preview.tsx đổi 3 lần giữa đợt:** `94ee64c0` → `a6e34691` →
  `68741a23` → `07f56792` (ổn định từ 01:02Z).

## 5. Trạng thái nợ sau đợt 101 (cập nhật từ LIMITS gộp đợt 101 §4)

1. **C9 kiểm chứng độc lập + O8 — ĐÃ XONG (luồng này).** 7/7 luồng đã
   về đối chiếu khớp; O8 21/21 cả 2 engine ngay lần đầu; LIMITS gộp
   đợt 101 §4 mục 1 cần đính chính (C9 không còn là nợ đợt 102 —
   chỉ C1 còn là nợ).
2. **C1 2 MiB junction probe — VẪN MỞ, nợ đợt 102.** Chỉ có dữ liệu
   thô (4 run playOk=true, 0/4 bogus ở setup pool-bundle; summary
   GST run1–run4). Cần LIMITS + kết luận: probe typefind:5 /
   webkitwebsrc:7 + source `qtdemux.c` đúng (B1 §7–§8) — và giải
   thích vì sao setup pool-bundle 0/4 bogus trong khi B1 blobA 4/4.
3. **G1 đóng hay chưa — VẪN MỞ, chờ parent/user quyết.** C7: khung
   (a) tối đa 15/20 (trần cứng); khung (b) trượt 19/20; khung (c)
   21–22/27 (phụ thuộc I5-1 không tính lại được); khung (d) 21/23
   lệch chọn mẫu. Câu hỏi Q1–Q5 của C7 (§7) chưa ai trả lời.
4. **Ghost residual — F5 BỊ BÁC, ngoại suy presented CHẾT ở seek đầu
   (C2).** Hướng còn đứng duy nhất: tap rVFC độc lập (chỉ Chromium;
   trên WebKit vẫn là bài toán mở — F6' pixel-verified skipLatest).
   Baseline A/B tap đã đo: clean 45,0% (n=151).
5. **Re-arm — drift-gate C3 ĐÃ LAND.** f4-like 0/12, gate chặn 44,
   burst 31, ADV2-đóng-drift-vượt 0/5, grace 11/0, ARM-HELD 1/12
   (gộp 3 đợt 4/36 — B3 tăng 2/6 là nhiễu mẫu nhỏ). Đánh đổi: tuổi
   đuôi trung vị +45% (1339 → 1942 ms), 2 đuôi đóng do trần 5000 ms
   (h4, h8 — vô hại); CANCELLED hẹp h11-7863 là artifact pause-seek.
6. **Blur parity — D floor TRIỆT bằng pad-oldest (C4, 0/867,
   p=3,6e-06).** B-band chốt không phải 2 mode (n=180, khe 0,0005,
   tách 1,66σ); coupling ghost−1/presented−1 có ý nghĩa (p=0,0063)
   nhưng hướng −1 vs +4 alias vẫn chỉ là suy luận cơ chế (strip
   48-bit không phân biệt được); r7 vẫn mở (1 ca duy nhất trong 876);
   D dư (nếu có) <0,35% — cần mẫu post-fix lớn hơn.
7. **Zombie pump — khe early-return ĐÃ QUAN SÁT ĐƯỢC qua seek-across
   (C5, 24/24).** Đề xuất C5: ĐÓNG nợ "chưa quan sát được", GIỮ code
   phòng thủ. Nợ mới: stale first-frame của pump mới sau seek (2 ca,
   tự sửa bằng reset-capture — chưa rõ có kịp vẽ lên canvas không);
   nguyên nhân navigation giết 2 lượt đối chứng 24-clip chưa xác định.
8. **EPERM — probe #20 ok=2 fail=0; khoảng mù #19 ĐÃ ĐÓNG** (reboot
   #24 21:41:50Z). Tiếp theo: probe #21 + khoảng mù #20 (bắt đầu
   23:39:56Z; chứa reboot #25 23:51:21Z — C9 đã xác minh boot
   `3a12a7d3` + giờ từng giây bằng `uptime -s`). Giờ từng giây reboot
   #16 KHÔNG chốt được (C6 đã thử hết nguồn — đề xuất đóng ở mức kẹp
   ~4', chờ parent/user quyết). Cron riêng 10 phút vẫn chờ user quyết.
9. **Birefnet-general trong gói: vẫn 0 lần chạy thành công** (không
   thử đợt này — RAM max quan sát được ~3,1 GB < ngưỡng guard 6 GB;
   quyết định parent đợt 92 giữ nguyên).
10. **TTS 39: không kiểm lại đợt này** (lệnh cấm được tuân thủ).
11. **ci-security.yml + ci-build.yml: vẫn 403** (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App). Không file workflow
    nào bị đụng đợt này.
12. **Harness — retry/fallback Space-toggle ĐÃ bắn thật (C8, E1).**
    Còn chưa bắn thật: đường retry/fallback của N10 chiều PHÁT
    (44/44 toggle `"space"`) và vòng lặp fallback thứ 2 của E1.
13. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi
    ngang/hơn CapCut thật.

## 6. Batch đã stage (KHÔNG push)

- C9: `phase9-round101-c9-verify.txt` — 1 entry NUL-delimited
  (LIMITS này), read-back OK (xem dưới).
- Đợt 101 (7 luồng): **19 entry / 7 file** (C2 1, C3 6, C4 5, C5 2,
  C6 1, C7 1, C8 3) / 19 file duy nhất (không trùng file giữa các
  luồng). Closing đợt 101: 2 entry (LIMITS gộp + gap analysis §30).
- **Tổng chờ push sau đợt 101 (đếm lại trực tiếp từ đĩa, đợt 67–101,
  SAU khi stage C9): 351 file batch / 2413 entry / 1456 file duy nhất**
  (trước C9: 350/2412/1455 — khớp đúng số parent trong LIMITS gộp
  đợt 101 §5; C9 thêm 1 file batch / 1 entry / 1 file duy nhất là
  LIMITS này). HEAD vẫn 5f548ef8. KHÔNG push.

## 7. Ghi chú vận hành cho verify sau

- **Poller đếm 8/8 nhầm vì glob khớp file closing:** dùng glob
  `phase9-round101-c[1-9]-*.txt` hoặc trừ `*-closing.txt` khi đếm
  luồng; file closing không phải là một luồng.
- **Waiter grep tự khớp dòng ghi chú của chính nó:** waiter v1 báo
  sai ALL LANDED lúc 23:46Z vì grep `"ALL LANDED 8/8"` khớp dòng
  ghi chú trong poll.log — v2 khớp chuỗi đầy đủ `"ALL LANDED 8/8
  lúc"` mới đúng. Đừng để chuỗi trigger xuất hiện trong log text
  thường.
- **Poller chết cùng reboot là bình thường:** poller C9 chết ở reboot
  #25; kiểm tra `ps` = 0 rồi khởi động lại (không khởi trùng khi
  poller cũ còn sống — bài học A10/B9 vẫn đứng). Poller mới resume
  từ `poll.log`, không poll mù.
- **O8: copy fixtures TRƯỚC khi chạy** (bài học B9 vẫn đứng — C9 đã
  copy + md5 khớp nên cả 2 leg xanh ngay lần đầu). **WebKit đọc
  fixture từ `round87-o8/headed`, không phải từ O8W_SCRATCH** —
  đừng kết luận "webkit trống" khi chỉ nhìn scratch.
- **Sau reboot, VM có thể là image mới thiếu libs:** kiểm tra `ldd`
  MiniBrowser trước mọi probe WebKit; cài deps bằng azure-only
  (`azure.archive.ubuntu.com`) vì mirror cogentco kẹt; `apt-get
  update` đặt `timeout 300`. Lần này libs đã có sẵn (C4 cài lại
  sau reboot #25) nên không cần apt.
- **Script O8 WebKit bỏ qua `O8_DISPLAY`/`O8_DEV_PORT`** (dùng mặc
  định `:188`/`:5560`) — không ảnh hưởng kết quả, nhưng đừng tưởng
  đã đổi display khi truyền biến.
- **Đếm grace chain / Fisher:** đếm trên dòng per-run hoặc phần tóm
  tắt, không grep thô cả file (bài học B9 về `=> BỊ CHẶN` vẫn đứng);
  Fisher một phía phải lấy đúng đuôi (post < pre) — lấy nhầm đuôi
  cho p≈1,0.
- **Driver exit code:** `run.sh` kiểu cũ in exit=0 cho mọi lượt do
  `$(date)` ghi đè `$?` (C5 §4 mục 3) — chỉ tin file đĩa, không tin
  exit code in ra; kiểm tra driver các đợt trước có cùng lỗi không.
- **Tóm tắt parent trộn số liệu 2 run:** LIMITS gộp đợt 101 §1 (C1)
  ghép đếm run1 với create/typefind run4 — verify sau đối chiếu
  từng run riêng trước khi nhận số tóm tắt.
