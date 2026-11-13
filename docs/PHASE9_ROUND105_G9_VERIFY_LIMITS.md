# Phase 9 đợt 105 — G9: kiểm chứng độc lập (8/8 về đủ; cây gộp xanh, O8 21/21 cả 2 engine)

> Luồng G9, đợt 105, lượt cron 18:35 +07 13/11/2026. KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production. KHÔNG đụng TTS 39, birefnet,
> `.github/workflows/*`.
>
> **Kết quả chung: 8/8 luồng G1–G8 về đủ hoàn toàn (LIMITS + log + batch
> stage) — đợt thứ hai liên tiếp kể từ đợt 102 mà cả 8 luồng đều về đủ
> trong một lượt, và là lần đầu kể từ đợt 102 mà không có reboot nào
> cắt ngang giữa lượt. Cây gộp XANH: tsc 0/0, vite build PASS 6,19 s,
> 27/27 mục suite offline exit 0 ngay lần đầu, test-preview-engine.sh
> 354 assertions, O8 21/21 cả 2 engine ngay lần đầu (Δx khớp từng chữ
> với D7/D9/E8/E9/F9 — code G1 land trong cây KHÔNG làm lệch
> mask-track). Đối chiếu headline: 8/8 KHỚP, với 9 đính chính/ghi chú
> (xem §2 — không đổi kết luận nào, trừ 2 đính chính về giờ reboot mà
> G8 đã sửa và G3 đã sai).** Production đổi duy nhất đợt này: G1 land
> F8-only trong `preview.tsx` (gỡ nấc rawAnchor F8b).

## 0. Dòng thời gian + phương pháp

- **G9 bắt đầu:** 11:38:08Z 13/11 (boot `3e4f237a`, RAM khả dụng 452 MB,
  `preview.tsx` md5 `ca378bbf` = cuối đợt 104). Lúc bắt đầu chỉ có
  G5 (2 file log) + G6 (dir trống) trên đĩa.
- **Poll đĩa (poller G9, mỗi 10 phút):** 11:38Z **0/8** → 11:48Z **4/8**
  (G2, G3, G4, G8) → 11:58Z **5/8** (+G6) → 12:08Z **7/8** (+G1, G7)
  → **12:09Z 8/8** sau khi sửa lỗi glob (xem dưới). Không reboot trong
  suốt lượt (boot `3e4f237a` suốt từ 11:26:40Z).
- **Lỗi poller của chính G9 (ghi để lượt sau tránh):** glob
  `PHASE9_ROUND105_${t^^}_*LIMITS.md` không khớp file quyết định của
  G5 (`PHASE9_ROUND105_G5_G1_DECISION.md` — không có chữ LIMITS trong
  tên). Poll 12:08Z ghi G5 "paths-only" là SAI — G5 đã về đủ từ 11:40Z
  (doc 19.260 B + `g5-verification.md` + paths stage 11:40Z). Đã sửa
  trong poll.log lúc 12:09Z. Bài học: verify thread phải glob cả
  `*G{1-8}*` trong `docs/`, không chỉ `*LIMITS.md`.
- **Reboot #31 — đính chính tiền đề lượt này:** brief đợt 105 (và G4,
  G6) ghi "reboot #30 lúc 11:26Z" là **SAI**. 11:26:40Z là reboot **#31**
  (boot `3e4f237a`, đo trực tiếp `uptime -s` + `boot_id`); reboot **#30
  đã xảy ra lúc 10:54:53Z** (boot `287705ad`, F9 ghi nhận trực tiếp).
  Khoảng cách #30→#31 = **31'47" — NGẮN NHẤT từng ghi**, phá sàn cũ
  1h11'36" (xem §2.7). Chu kỳ nay 31 lần / ~63h ≈ 2h02'/lần. Reboot
  tiếp theo (#32) dự báo ~13:29Z (dải sàn–trần mới 11:58:27Z–14:40:48Z
  của G8 — rất rộng, kém tin cậy; dự báo F9 ~12:59Z đã SAI LỚN).
- **Cây gộp đóng băng lúc verify (12:09:54Z):** `preview.tsx`
  `f0b9e4968b5443d0bb31bc7f3b255a0e` (G1 land 11:52:15Z, ổn định từ đó),
  `media.ts` `2c384ed1…` (không đổi từ đợt 99),
  `playheadHold90R2.ts` `00cce1ac…` (không đổi từ đợt 101),
  `previewEngine.ts` `cd540de9…` (không đổi từ đợt 101),
  `rvfcClipWindow.ts` `5f5f9aef…` (D3, đợt 102),
  `driftConfirmSkip103E4.ts` `2748b6f3…` (E4, đợt 103),
  `tsconfig.json` `7a79b58c…` (không đổi từ đợt 103). Không còn process
  luồng G1–G8 nào chạy lúc đóng băng. RAM lúc đóng băng 755 MB, load
  ~0,1 — máy yên.
- **Script verify:** `hidden_files/round105-g9-verify.sh` (dựa trên
  `round104-f9-verify.sh`, cùng 27 mục — đợt 105 không thêm test mới
  nào; test mới duy nhất là probe/script của G6/G7, không phải unit
  test) + script O8 `round105-g9-o8.sh` (dựa trên
  `round104-f9-o8.sh`; fixtures copy từ `round104-f9/o8-chromium`,
  md5 khớp — ball `6df873f7…`; WebKit đọc fixture từ
  `round87-o8/headed` như C9/F9). Log: `round105-g9-suites.log`,
  `round105-g9-o8.log`, poll log `round105-g9/poll.log`, recounts
  `round105-g9/recounts.log`.
- **`preview.tsx` đổi 1 lần giữa đợt:** `ca378bbf` (cuối đợt 104) →
  `f0b9e496` (11:52:15Z, G1 land F8-only, gỡ nấc rawAnchor) — ổn định
  từ đó. Không luồng nào khác sửa production (kiểm bằng `find -newermt
  11:35Z` trên `apps/*/src` + `server`: chỉ `preview.tsx` đổi).
  Các file đổi khác trong cửa sổ: docs/LIMITS (8 file), benchmarks
  (G6 probe + JSON), scripts probe (G7 ×2, G6 ×1), `dist/` (output
  vite build 12:00:37Z — không stage), binary `frames-noise.mp4`
  (G7, KHÔNG stage theo luật).

## 1. Kiểm chứng trên cây gộp

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 6,19 s** |

### 1.2 Suite offline (log `hidden_files/round105-g9-suites.log`)

| test | kết quả |
|---|---|
| playheadHold90R2 | **75 passed**, exit 0 |
| playheadPacing54K9 | **19 pass, 0 fail**, exit 0 |
| previewEngine | 18 test passed (mask) + **27 test passed** (rvfc), exit 0 |
| seek | **21 passed**, exit 0 |
| seekSkipRender86N3 | **9/9 test pass**, exit 0 |
| previewLoop50F2 | **20 passed**, exit 0 |
| ghostBlend.probe | **15 kiểm chứng xanh**, exit 0 |
| rvfcClipWindow102D3 (D3, đợt 102) | **13 + 21 test passed** (2 sub-suite), exit 0 |
| driftConfirmSkip103E4 (E4, đợt 103) | **12/12 PASS**, exit 0 |
| css60 (cssClasses60Q2) | PASS **60/60**, exit 0 |
| css61 (cssClasses61R4) | PASS **60/60**, exit 0 |
| Audit P7 (i18nAudit59P7, esbuild) | **8/8 pass** |
| orphans (binOrphan60Q7) | **17 pass, 0 fail**, exit 0 |
| r6-i18n-check | PASS — dict vi==en==**2767 key** lá (không đổi) |
| U4 fail-fast | **141 pass, 0 fail**, exit 0 |
| media (run-media-tests.mjs) | blobPrefetch **25 pass**, captureThumb **2 pass**, retryPlay95W2 **7 pass** — 3/3 PASS |
| media.retryPlay96X3 (esbuild) | **7 pass, 0 fail**, exit 0 |
| media.stallWatchdog96X3 (esbuild) | **9 pass, 0 fail**, exit 0 |
| deint-fps-verdict (X6) | pass **17**, fail 0, exit 0 |
| deint-fps-verdict-100b7 (B7) | **pass 13, fail 0**, exit 0 |
| armHeld99a3 (A3) | **pass 16, fail 0**, exit 0 |
| vite-diagnosis-regex (X6) | pass **9**, fail 0, exit 0 |
| xvfb-lock | **PASS (không lỗi)** ngay lần 1, exit 0 |
| test-preview-engine.sh (Z8, chạy đúng qua script) | **EXIT 0, 354 assertions pass** |

**Tổng: 27/27 mục exit 0 ngay lần đầu** (không mục nào cần chạy lại).
0 dòng "not ok" trong toàn bộ log. Verify chạy 12:09:54–12:13:38Z trên
boot `3e4f237a` (sau reboot #31); không reboot trong lúc verify. RAM
lúc verify 755 MB → suite vẫn xanh hết dù RAM thấp — RAM không phải
yếu tố chặn suite offline đợt này.

### 1.3 O8 — 21/21 cả 2 engine, ngay lần đầu (log `hidden_files/round105-g9-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium | 12:13:5x–12:14:55Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |
| WebKit | 12:15:04–12:15:45Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |

Số Δx khớp **đúng từng chữ** với O8 của D7/D9/E8/E9/F9 trên các cây
trước — code G1 land đợt này (F8-only, gỡ rawAnchor, đụng `preview.tsx`
+ cả hai đường tick/pump) **không làm lệch mask-track**. E0: 0 lỗi
JS/pageerror/crash cả 2 engine. Cả 2 leg exit=0 ngay lần đầu (tổng
~105 giây); 0 dòng "retry" trong log O8. WebKit launch qua Playwright
bình thường (không dùng `ldd` thô để kết luận thiếu lib — xem F9 §1.3).
O8 chạy trên cây gộp cuối đã có code G1 land, thay cho O8 riêng của G3
(G3 không chạy O8 — F9 đã bao phủ cây cũ; G9 bao phủ cây mới).

## 2. Đối chiếu từng luồng — số headline KHỚP (9 đính chính/ghi chú, không đổi kết luận)

### 2.1 G1 — Ghost F8 land / F8b bác: KHỚP

- **Run B/B2/B3/C/D (đọc lại trực tiếp file phân tích trên đĩa
  `round105-g1/analyze-f3-*.txt`):** A baseline 43/94 = **45,7%** ✓;
  B 68/96 = **70,8%** ✓; B2 67/88 = **76,1%** ✓; B3 (code đã gỡ
  rawAnchor) 68/78 = **87,2%** ✓; flip C 67/91 = **73,6%** ✓ vs flip
  D 68/140 = **48,6%** ✓. Cả hai chân bar đều đạt (clean ≥70% và hơn
  baseline ≥20 điểm: B +25,1pt, B2 +30,4pt, B3 +41,5pt; flip +25,0pt).
- **rawAnchor — số "0/30 clean" là artifact, G1 đã tự đính chính
  trong LIMITS §3; đếm lại từ `all-occurrences-clean.txt`:** tap gộp
  (3405+4428+1831)/(3497+4503+1872) = 9664/9872 = **97,9%** ✓;
  rawAnchor gộp (64+48+104)/(96+70+141) = 216/307 = **70,4%** ✓;
  frameIdx B3 21/30 = **70,0%** ✓. Kết luận "không lợi ích đo được
  so với frameIdx" đứng trên 70,4% ≈ 70,0%, KHÔNG đứng trên 0/30.
- **Đính chính nhỏ (comment trong code, không đổi kết luận):** 10 dòng
  comment trong `preview.tsx` (dòng 1263, 1363, 2608–2609, 2738…)
  vẫn ghi nấc rawAnchor "đã bỏ sau khi đo 0/30 clean" — con số 0/30
  là artifact dedup mà chính G1 đã bác trong LIMITS §3. Comment gây
  hiểu lầm cho người đọc sau (tưởng rawAnchor tệ tuyệt đối, trong khi
  thực tế nó ≈ frameIdx). Đề nghị đợt sau sửa comment thành "70,4%
  ≈ frameIdx 70,0%, không lợi ích" — G9 KHÔNG sửa production.
- **Code land kiểm lại:** marker `104f3` vẫn **50 dòng / 58 lần xuất
  hiện** (như F3/F9 đếm); `F3AnchorSrc` đã hẹp thành `"tap" |
  "pump" | "frameIdx"` (dòng 2738, không còn `"rawAnchor"`); log run
  B3 ghi TAP BẬT + RELABEL BẬT, rVFC tắt theo protocol case B ✓.
  Hồi quy G1 tự đo (tsc 0, vite 6,96s, ghostBlend 15/15,
  previewEngine 27/27) được G9 kiểm chứng độc lập trên cùng cây ở §1
  (tsc 0/0, vite 6,19s — chênh thời gian do tải, ghostBlend 15/15,
  previewEngine 18+27) ✓.
- **Caveat G1 tự ghi, G9 nhắc lại:** flip-leg cho code land KHÔNG đo
  lại — suy luận chặn dưới ở §4.3 (rawAnchor → frameIdx chỉ giữ
  nguyên hoặc tăng clean ở tập fallback); spread đuôi lỏng KHÔNG cải
  thiện (max ~75 mọi run) nên tiêu chí spread của bar không đánh giá
  được rõ ràng — land dựa trên 2 chân clean.
- G1 không đụng TTS 39, birefnet, workflows ✓. G1 là luồng duy nhất
  sửa production đợt này.

### 2.2 G2 — Zombie hoàn thiện F4 từ dữ liệu thô: KHỚP

- **Zombie Δ = 0 (đếm lại từ `round105-g2-analysis.txt`):** tách theo
  run: f4y1 `seek-inactive` **11**, `no-callback` 1; f4y2
  `seek-inactive` **9**, `no-callback` 3 ✓ (tổng 20/24 biên đo được);
  `skip-clip-inactive` **n=0 cả 2 lượt** ✓. Zombie Δ=0 ở mọi biên đo
  được (None ở biên không có dữ liệu, không tính là Δ≠0).
- **Gate (b) (chạy lại từ file G2):** draws-gap GOP **gaps=267,
  unheld_with_skips=0** ✓ 0/267; freeze f4y1 6 + f4y2 13 = **19 real
  freeze, 0 với playhead tiến** ✓ (e4y1 thêm 1 ca advancing 3107 ms
  — chính là ca clip-18 mà G2 giám định là 1 bước nhảy + plateau,
  không phải chạy tự do; e4y2 0).
- **Draws-check stale:** GOP `draws examined=46 stale=8 | main
  examined=46 stale=1` — con số **8/46 danh nghĩa** khớp ✓; **0/46
  xác nhận** là giám định từng ca của G2 trong
  `round105-g2-adjudicate.txt` (7 ca seekRel nội suy sớm, 1 ca drift
  +0,356 s vượt ngưỡng 0,35 đúng 6 ms) — G9 spot-check thấy hồ sơ
  từng ca có đủ state100/draws/cap quanh biên, nhưng "0 xác nhận" là
  phán đoán phương pháp, không phải đếm thô; ghi rõ để đợt sau khỏi
  trích thành "đo được 0".
- **F4 driver seek-across (đọc `round104-f4/driver.log`):** f4y1 đúng
  **2 dòng** `driver seek-across` (c0→c1, c1→c2), f4y2 **0 dòng** ✓ —
  "2/23 và 0/23" đứng; dữ liệu F4 thực chất là phát tick-by-tick +
  sysload 2, không phải seek-across.
- **G2 không chạy probe live mới** (RAM ~518 MB lúc bắt đầu, 8–10
  luồng song song) — quyết định ghi rõ trong LIMITS, không retry ✓.
  G2 chạy lại suite riêng (ghostBlend 15/15, rvfcClipWindow 21,
  driftConfirm 12/12, preview-engine 354 — 10 dòng exit=0 trong
  `round105-g2-suites.log`) ✓.
- G2 không sửa production ✓ (chỉ probe F4 + analyzer + LIMITS).

### 2.3 G3 — Harness hoàn thiện F8: KHỚP (trừ đính chính #29 — xem §2.7)

- **D6 recheck — G9 chạy lại độc lập cả 3 script, diff rỗng từng
  byte:** `quantify-burst-vs-stable.py` vs
  `quantify-h-recheck.txt` **0 dòng**; `quantify-i1-i12-*.py` vs
  `quantify-i1-i12-recheck.txt` **0 dòng**;
  `recheck-d6-independent.py` (E8) vs `recheck-d6-independent.txt`
  **0 dòng** ✓. Đây là lần xác nhận thứ tư (D6 → E8 → G3 → G9).
  Số gộp khớp: h blk/s trung vị 1,20, đóng băng 14%, drift 0,450 s,
  nhảy vọt 34/76; i 1,25 / 25% / 0,847 s / 42/85; **0/24 đuôi đạt
  tiêu chí ổn định-lệch; 0/38 đoạn** ✓. D6-A vẫn bị bác.
- **F8 chạy xong 4/12 lần:** N10 ×2 `pass: 4` trong report JSON ✓
  (tỉ lệ 1,21× / 1,08× trong log); E1 ×2 `pass: 10, total: 10` ✓;
  G5 run1 **1,14× PASS chắc** (log 08:48:19Z: "mean 1.14x median
  1.14 → PASS (chắc)", tỉ lệ 1,47/1,24/0,94/0,9/1,14) ✓; run2 gộp
  **0,87× PASS** (log 08:53:51Z: "gộp 10 tỉ lệ mean 0.87x median
  0.9") ✓. Run3 dở: log dừng 08:57:05.772Z sau PASS G7a, không
  report JSON ✓.
- **G4 flake tái hiện (đọc `round104-f1/e1-run2-run.log`):** `FAIL G4
  đối chứng progressive: R=0.48 …, deinterlaceTap=false, applied=[]`
  ✓ khớp từng chữ; G3→G4 11,50 s (G3 08:43:13.568Z → FAIL
  08:43:25.072Z = 11,504 s) ✓. Gộp: 1/11 lần E1 hoàn thành đợt 104,
  2/21 mọi lần E1 từng có (9,5%) — ca 103 (E1 run8) đã được F9
  xác minh đợt trước, ca này là ca thứ hai ✓.
- **Keydown chậm nhất 1004 ms:** `fpsSlots.3.playWaitMs = 1004`
  trong `round104-f8/e1-run2/c77e1-headed-report.json` ✓ + log
  "playing về true sau 1004ms" ✓. Gộp 40 lần / 561 slot / 1122
  toggle, 0 retry/fallback/abort — G9 không đếm lại toàn bộ 40 lần
  (số gộp kế thừa từ G3 + F9), chỉ xác minh kỷ lục 1004 ms.
- **Đính chính #2 của G3 (F1 có 5 run N10 + 9 run E1, không phải "3
  run deint 60fps" như LIMITS gộp đợt 104 §1): ĐÚNG** — thư mục
  `round104-f1/` có `60fps-deint-run1..5` (5) + `e1-run1..9` (9) ✓.
- **Đính chính #1 của G3 về giờ reboot #29: SAI — xem §2.7.**
- G3 không sửa production/harness, không chạy O8 (F9 đã bao phủ cây
  cũ; G9 bao phủ cây mới ở §1.3) ✓.

### 2.4 G4 — Re-arm finalize (watcher A/B RAM cao): KHỚP

- **Watcher từ đĩa (`round104-f5/wait-hiram.out`, đọc toàn bộ 50
  check):** bắt đầu 09:14:54Z boot `cff65e89`, kết thúc 09:52:26Z
  dòng `NO HIRAM WINDOW in ~37 min` ✓; RAM cao nhất check 5
  (09:17:55Z) **2.356.708 kB**, load1 **4,25** (vượt gate <4,0 — chặn
  kép) ✓; **0/50 check ≥ 2.400.000 kB** (đếm lại bằng grep + sort,
  top 5: 2.356.708 / 2.023.404 / 1.938.968 / 1.843.436 /
  1.688.884 kB) ✓; check 50: 527.276 kB ✓; `run-f5-hiram.log`
  **không tồn tại** → 0 lượt f6r/f7 ✓. G4 ghi đúng, F9 ghi đúng,
  **không cần đính chính** — như chính G4 kết luận.
- **Đính chính duy nhất của G4:** G4 ghi "reboot #30 lúc 11:26:51Z"
  — **SAI cả số lẫn giờ** (xem §2.7: #31 lúc 11:26:40Z). Không ảnh
  hưởng kết luận A/B (script còn dùng được sau reboot — G4 kiểm
  `bash -n` + `node --check` + md5 `preview.tsx` ca378bbf /
  `playheadHold90R2` 00cce1ac / `driftConfirmSkip103E4` 2748b6f3…,
  G9 kiểm lại các md5 này vẫn đúng trên cây đóng băng trừ
  `preview.tsx` nay là f0b9e496 do G1 land — G4 kiểm TRƯỚC khi G1
  land, không mâu thuẫn).
- G4 không đo live mới (lý do RAM + nhiễu, ghi rõ) ✓; kế hoạch A/B
  §4 đăng ký trước đầy đủ (ngưỡng, tiêu chí quyết định, bài học bắt
  cửa sổ ngay sau reboot) ✓. G4 cập nhật §10b vào LIMITS F5 (mtime
  11:40:04Z) và stage kèm trong batch G4 ✓.

### 2.5 G5 — G1 decision (G5 hay M2): KHỚP — G1 VẪN MỞ, chờ user

- **Chạy lại 2 script F1, diff 0 dòng (G9 chạy lại diff):**
  `m2-recheck.log` vs `m2-quiet104f1.log` **0 dòng**;
  `pool-recheck.log` vs `pool104f1-analysis.log` **0 dòng** ✓.
- **Tính tay run8/run9 từ tỉ lệ thô:** run8 mean [0,60; 1,02; 1,11;
  0,90; 0,94] = 0,91, median 0,94, baseline 21,87 ✓; run9 mean [0,92;
  0,88; 0,92; 0,94; 0,86] = 0,90, median 0,92, baseline 27,39 ✓.
- **Khung (a)–(i) + quy luật:** G9 kiểm lại từ
  `m2-quiet104f1.json` đọc trực tiếp: pool30 n=109 PASS 100, pool60
  n=69 PASS 66; `first20_m2_max = 15`, `last20_m2_max = 19`,
  `last10_m2_max = 10`, `quiet30_m2_range = [26, 27, 32]`,
  `post_a9_m2` len 14, `near_boundary_runs` len 0, `flips_total = 6`,
  `agree = 140`, `n_runs_m2 = 146` → 140/146 = 95,9% ✓ — tất cả
  khớp G5 §1.
- **Đính chính diễn đạt của G5 (G9 xác minh độc lập):** cửa sổ trượt
  (b) trước F1 đã là X6-3..E1-1 (20 lần); đợt F1 chỉ X6-3 và X6-4 rời
  cửa sổ — kiểm từ `quiet30_order`: 20 lần cuối là X6-3..F1-9,
  X6-1/X6-2 chỉ còn trong 20 lần đầu ✓. Cả hai lần rời đều PASS nên
  19/20 không đổi — chỉ sửa diễn đạt, không sửa số ✓.
- **Khuyến nghị của G5 (M2 + khung (c), đóng G1 với điều kiện tự mở
  lại nếu 1 lần yên FAIL tương lai) chỉ là khuyến nghị — G5 KHÔNG tự
  đóng G1, KHÔNG đổi ngưỡng/metric/khung ✓. Quyết định thuộc user.**
- Ghi chú: `g5-verification.md` của G5 viết "reboot #30 lúc 11:26Z"
  — cùng lỗi đánh số như brief/G4/G6 (xem §2.7); không ảnh hưởng số
  G1 (phân tích offline, không phụ thuộc boot).

### 2.6 G6 — 2 MiB truy nguyên 2097152 + probe blob-direct: KHỚP

- **2097152 không phải ranh giới cấu trúc (parse độc lập bằng
  Python trên `c2.mp4` 2.139.973 B):** stco 3 chunk @ **3179,
  1049719, 2094129** ✓; 2097152 nằm giữa sample 187 (delta +3023),
  không phải đầu chunk/sample/atom ✓; 4 byte tại đó `204286c4` ✓.
- **0/8 run có DoSeek hay Range tới 2097152 — mạnh hơn cả claim:**
  chuỗi `2097152` **không xuất hiện trong bất kỳ file GST nào** trong
  8 log (`round105-g6/f-websrc/gst/`) ✓. 5/8 run bogus (5 YES / 3 NO
  trong file phân tích) ✓.
- **5/5 run bogus splice đúng tại file[2097152] (xác minh bằng vân
  hex):** 4 run có pull spliced đầu tiên hex `204286c4268363400af1e110e7b5e9ec`
  = đúng file[2097152:2097168] ✓; run còn lại (A-run2) splice ở
  req_off 3179/41666 nhưng có 4 dòng ATAKE `file_off=2097152` ✓.
  Gộp F2+G6: 15/20 run bogus (first-atom 10/12 + 5/8) / 16/20
  (any-splice 11/12 + 5/8) — "15–16/20" của G6 khớp cả hai định
  nghĩa ✓.
- **Fisher tính lại bằng `math.comb`:** first-atom E 2/3 vs A 2/3
  hai phía **p=1,0** ✓; any-splice E 2/3 vs A 3/3 hai phía **p=1,0**
  ✓; gộp first-atom E 2/3 vs A 12/15 **p=1,0** ✓; gộp any-splice E
  2/3 vs A 14/15 **p=0,3137 ≈ 0,31** ✓. Blob-direct KHÔNG hiệu quả
  — swap http→blob không phải điều kiện cần ✓.
- **`queue2.max-size-bytes = 2097152` (mặc định):** G9 xác minh bằng
  `gst-inspect-1.0 queue2` — Default: 2097152 ✓. Nhưng G6 tự ghi rõ
  đây mới là **ứng viên, chưa phải nguyên nhân đã chứng minh**
  (typefind pull-mode, queue2 push-mode, log GST không có element
  queue2 nào) — G9 đồng ý, không nâng cấp thành kết luận.
- **Phát hiện phương pháp (§5 G6):** shim F2 không ghi được pull của
  chính typefind (hook lọc theo parent của pad) — G9 không kiểm lại
  độc lập cơ chế hook, nhưng hệ quả ghi nhận: "tổng take trước pull"
  của F2 là take của adapter, không phải lượng byte typefind đã tiêu
  thụ — các đợt sau không được đồng nhất hai số này.
- G6 chạy 8 run live, 0 crash/OOM dù RAM bắt đầu 548 MB ✓. G6
  không sửa production ✓.

### 2.7 G8 — EPERM probe #24 + mù #23: KHỚP (và 2 đính chính quan trọng)

- **Probe #24 (đọc `eperm-probe-v2.log`):** 11:38:22Z, boot
  `3e4f237a`, `tmp+ws ok=2 fail=0` ✓; status trước đó DEAD/STALE
  (age 10757 s, last #23 08:39:02Z) ✓; heartbeat n=24 sau probe ✓.
  Checklist P8 §2.3 đúng 1 lần ✓.
- **Mù #23 ĐÃ ĐÓNG HOÀN TOÀN:** 08:39:02Z → 11:38:22Z = 2h59'20" ✓;
  đúng 3 reboot #29 (08:56:39Z), #30 (10:54:53Z), #31 (11:26:40Z).
  G9 xác minh độc lập đoạn #29→#30: poller F9 poll mỗi 10 phút trên
  boot `cff65e89` liên tục 09:07:45Z–10:47:46Z (11 poll, không sót),
  reboot #30 kẹp trong 7'07" sau poll cuối (10:47:46Z → 10:54:53Z) ✓;
  watcher hiram F5 50 check boot `cff65e89` đầu–cuối ✓. Hai đoạn còn
  lại loại trừ bằng sàn cũ 1h11'36" (mỗi đoạn < 2× sàn cũ nên không
  chứa reboot ẩn — lập luận G8 §2.2, G9 đọc lại thấy chặt).
- **ĐÍNH CHÍNH LỚN 1 — tiền đề lượt SAI, G8 đã sửa đúng:** 11:26:40Z
  là **#31, KHÔNG phải #30** (brief đợt 105 + G4 + G6 ghi sai; G1
  và G7 ghi đúng). #30 = 10:54:53Z (F9 đo trực tiếp: poller restart
  10:55:48Z `uptime_since=10:54:53`, suites log boot `287705ad`
  10:59:20–11:03:20Z, O8 chạy trên boot đó tới 11:13:36Z) ✓. Khoảng
  cách #30→#31 = **31'47" — NGẮN NHẤT từng ghi**, phá sàn cũ
  1h11'36" ✓.
- **ĐÍNH CHÍNH LỚN 2 — G3 SAI về giờ #29, G8 bác đúng:** G3 (§1)
  ghi reboot #29 "KHÔNG phải 08:56:39Z… trong khoảng
  08:57:06–08:58:12Z". **Sai.** Bằng chứng trực tiếp đo thời gian
  boot của kernel: F7 đo `uptime -s` = 08:56:39Z lúc **08:57:38Z**
  (nằm TRONG khoảng G3 nêu — nếu reboot từ 08:57:06Z trở đi thì
  `uptime -s` lúc đó không thể đọc 08:56:39Z); F9 poller restart
  08:57:45Z ghi cùng `uptime_since=08:56:39` ✓; kẹp hoạt động 13
  giây của G8 (bản ghi cuối trước reboot 08:56:38Z, đầu sau reboot
  08:56:51Z) ✓. Lỗi phương pháp của G3: lấy log cuối của F8
  (08:57:05Z — thực ra là bản ghi TRÊN boot mới) và "F1 resume"
  (08:58:12Z — thời điểm tiến trình tự resume) làm hai đầu kẹp.
  **Giờ #29 giữ nguyên 08:56:39Z; mọi đếm khoảng cách dùng nó vẫn
  đúng.** Ghi để parent bảo G3 sửa lại LIMITS của họ — G8 không sửa
  file luồng khác, G9 cũng không.
- **Hệ quả cho mù #22 (đã đóng ở F7):** sàn mới 31'47" làm sụp cột
  sàn của F7 — đoạn trước #28 dài 1h16'20" nay > 2× sàn mới
  (1h03'34"), mở cửa sổ hình thức [06:12:11Z, 06:24:57Z]. G8 kiểm
  lại: hoạt động dày đặc, khoảng cách giữa các bản ghi ≤ ~30 s,
  chuỗi probe E5 không đứt quãng, không run nào bị giết → mù #22
  **vẫn đóng trên bằng chứng hoạt động, nhưng mức tin cậy hạ từ
  "sàn + hoạt động, kín" xuống "chỉ hoạt động, cửa sổ lý thuyết ≤30
  s"**. G8 KHÔNG tự quyết mở lại hay giữ nguyên — **parent/user
  quyết**. G9 ghi nhận, không tự quyết.
- **Quét writeFileSync (đọc `scan-meta.txt`):** NEWSTD **148 file /
  472 dòng**, R7B **165 / 497**, COPIES **17 / 25** ✓; đối chiếu
  chéo 472+25=497, 148+17=165, **chênh 0 — lần thứ mười một liên
  tiếp** ✓; +17 dòng / +6 file so với F7 (ghi trong LIMITS, G9
  không đếm lại diff từng file). Async `.writeFile(`: vẫn 2 vị trí
  trong helper retry đã biết ✓ (G9 không đếm lại — kế thừa F7/F9).
- **Sóng EPERM:** 0 "vẫn bật" / 0 "CẢNH BÁO 10 phút" / 0 "Operation
  not permitted" thật trong 339 file *.log có mtime trong mù #23
  (G9 không đếm lại 339 file — kế thừa G8; con số nhất quán với
  F7/E7); sóng gần nhất vẫn ~11:55–12:11Z (R7) — 11/11 12:11Z →
  13/11 11:38:22Z = **47h27'** ✓. EPERM KHÔNG được tuyên bố là đã
  hết ✓.
- **RAM:** 5 mẫu G8 499 / 473 / 497 / 1868 / 1811 MB, max ~1,82 GB =
  30% guard ✓ (ghi trong LIMITS; G9 đo thêm 452–2269 MB trong lúc
  poll — cùng dải). Birefnet KHÔNG chạy ✓. Reboot #16 vẫn mở ✓.

### 2.8 G7 — Blur r7 + B-band c0: KHỚP (với 2 chú thích)

- **r7 — "nội dung gap 2" BỊ BÁC, r7 ĐÓNG với giả thuyết này:**
  G9 chạy lại `analyze105g7b.py` — output **diff 0 dòng** so với
  `analysis105g7b.txt` ✓ (tái tạo hoàn toàn). Từ output tái tạo:
  chr ghost content==nhãn riêng **157/164 (95,7%)** ✓; 24 tick
  decisive → **11 sự kiện phân biệt** (dedup theo bộ 5, 14 tick là
  1 sự kiện wk lặp lại) ✓; đường rVFC 5 sự kiện content gap
  **(6,6,6,7,6)** ✓ — xem chú thích dưới về ca gap 7; ca gap-2 duy
  nhất (wk c0 pres 80) lặp 14 tick, presented trễ −5, ghost trễ −1
  ✓ (xác minh trong `pres_check` JSON: pres 80→75 lặp 14 lần).
- **Chú thích 1 — ca content gap 7:** label gap = 6, content gap =
  7 (pres 8→9, ghost 2→2). G7 ghi "5/5 content gap == label gap
  (6,6,6,7,6; ca gap 7 là presented +1, trong nhiễu nhãn ±1)".
  Đọc chặt: 7 ≠ 6 — "==" ở đây là **trong dung sai ±1 đã công bố**,
  không phải bằng nhau tuyệt đối. G7 đã công khai dung sai trong
  cùng câu nên không phải lỗi số, nhưng đợt sau trích dẫn nên viết
  "5/5 trong ±1" thay vì "5/5 ==".
- **Chú thích 2 — bar (b) literal KHÔNG ĐẠT:** presented content ==
  nhãn exact 53/175 = **30,3%** (mốc 80%) — G7 tự ghi bar này quá
  chặt so với nhiễu nhãn ±1 đã biết (121/175 = 69,1% trong ±1) và
  không dùng nó để vô hiệu kết quả strip ✓. G9 đồng ý cách xử lý:
  strip tự chứng minh bằng MAD (tới frame đúng median 0,4 chr /
  1,7 wk, tới frame nhì 47–48 — số này là suy ra từ phân tích đã
  tái tạo, G9 không tính lại median MAD độc lập).
- **Phát hiện phương pháp ringLast:** tương quan 100% (chr 39/39,
  wk 36/36) khi `skippedLatest=1` thì ghost đã blend mới nhất là
  `ringPrev` ✓ (đọc trong LIMITS §1.3 + code `preview.tsx` ~1212;
  cap gap-6 cũ giữ nguyên nhờ nấc rơi về prev của `predict_pair`,
  kiểm lại 4/4 cap F6 — G9 không đếm lại 4 cap này, kế thừa G7).
- **B-band c0:** c0 4/41 (9,8%) vs c2 1/36 (2,8%), Fisher một phía
  tính lại **p=0,2224 ≈ 0,22** ✓ — KHÔNG ĐẠT bar p<0,05, power 46%
  (G9 không tính lại power); còn thiếu 74 c0 + 79 c2 (dự tính của
  G7). Pair-like c0-only 4/24 vs c0 3-clip 0/17, Fisher hai phía
  tính lại **p=0,1284 ≈ 0,13** ✓.
- **D floor gộp: 0/2041** — bảng §3: 867+566+207+127+274 = **2041**
  ✓ (F6 0/1767 = 867+566+207+127 ✓); Fisher vs pre-fix 28/1547
  tính lại **p=5,12e-11** ✓; CI trên 0,147% (rule of three:
  3/2041 = 0,147% ✓).
- **Hiệu chuẩn g:** triple 0,616–0,635 (n=9 sự kiện, lệch +0,03..
  +0,05 so với dự đoán 0,589 — G7 ghi là nợ chưa giải thích) ✓;
  pad-clone 0,774–0,777 (dự đoán 0,755) ✓. G7 không sửa production
  ✓ (chỉ generator + probe + LIMITS; binary `frames-noise.mp4`
  không stage ✓).
- **Đổi build giữa chừng:** G7 ghi `preview.tsx` đổi ca378bbf →
  f0b9e496 lúc 11:52:15Z giữa lượt r38, probe đặt cờ tắt F3 nên
  không ảnh hưởng chế độ đo ✓ (G9 xác minh md5 + thời gian đổi
  khớp; cờ `__vcut104f3PresentedTap=false` +
  `__vcut104f3Relabel=false` có trong probe).

## 3. Production đổi đợt này (đúng 1 file)

| file | thay đổi | bằng chứng |
|---|---|---|
| `apps/web/src/preview.tsx` | G1 land F8-only: tap + gate 50 ms + relabel bằng anchor tươi; **gỡ nấc rawAnchor F8b** | md5 ca378bbf → f0b9e496 (11:52:15Z); `F3AnchorSrc` hẹp thành `"tap" \| "pump" \| "frameIdx"`; B3 87,2% trên code đã gỡ; tsc 0, vite PASS, ghostBlend 15/15, previewEngine 27/27, O8 21/21 cả 2 engine trên cây land |

Không luồng nào khác sửa production. Không file `.github/workflows/*`
nào đổi. Không TTS 39, không birefnet. Không binary nào stage.

## 4. Tổng chờ push (đếm lại trực tiếp từ đĩa, đợt 67–105)

Phương pháp parent/F9 (tái tạo khớp đúng mốc cũ): file
`phase9-round*.txt` trong `~/workspace/repo-1-push/paths-loop/`,
round 67–105, entry tách bằng NUL, unique theo đường dẫn.

| mốc | batch | entry | file duy nhất |
|---|---|---|---|
| Sau F9 đợt 104 (mốc F9, đã tái tạo khớp) | 377 | 2473 | 1506 |
| Trước khi G9 stage (đợt 105: 8 batch / 16 entry / 15 unique mới) | 385 | 2489 | 1521 |
| **Sau khi G9 stage (+1 batch / +1 entry / +1 unique)** | **386** | **2490** | **1522** |

Đợt 105: 8 batch / 16 entry — 15 unique mới + 1 trùng cũ
(`apps/web/src/preview.tsx`, đã stage từ các đợt trước — đường dẫn
cũ, nội dung mới). Mỗi file paths đợt 105 đã đọc lại: 0 dòng newline,
đúng số NUL (G1 2, G2 2, G3 1, G4 3, G5 1, G6 3, G7 3, G8 1).
HEAD vẫn 5f548ef8. **KHÔNG push.**

## 5. Nợ mở cho đợt 106 (từ LIMITS gộp đợt 104 §4, cập nhật sau đợt 105)

1. **G1 — VẪN MỞ, chờ user quyết metric (G5 hay M2).** G5 đã trình
   bản quyết định đầy đủ + khuyến nghị (M2 + khung (c), đóng với điều
   kiện tự mở lại nếu 1 lần yên FAIL tương lai). Không luồng nào được
   tự đóng G1. Khi user quyết xong, đợt sau cập nhật ngưỡng/metric
   theo quyết định đó.
2. **Re-arm A/B RAM cao — VẪN MỞ.** Kế hoạch chi tiết đã đăng ký
   trước (G4 §4): 2 lượt f6r gop250 + f7 gop30 qua `wait-hiram.sh` +
   `run-f5-hiram.sh`, ngưỡng RAM ≥ 2.400.000 kB + load1 < 4,0 +
   sibProcs = 0; **khởi động watcher NGAY sau reboot, trước mọi
   driver khác** (bài học F5: cửa sổ RAM cao chỉ xuất hiện ~5 phút
   đầu sau boot). A/B tắt E4 hoãn lại (chỉ khi RAM cao vẫn cho CAP
   cao).
3. **2 MiB — VẪN MỞ (đã hẹp).** 2097152 là vị trí tuyệt đối của nội
   dung bị splice, không phải ranh giới file, không phải điều kiện
   cần của seek/Range; blob-direct không hiệu quả; queue2
   max-size-bytes = 2097152 là ứng viên chưa chứng minh (cần bằng
   chứng queue2 nằm trong chuỗi pull webkitwebsrc→typefind→qtdemux).
   Shim F2 không ghi được pull của typefind — cần hook mới cho các
   đợt sau.
4. **Ghost F8b — ĐÃ ĐÓNG (gỡ khỏi code).** F8 land; rawAnchor ≈
   frameIdx (70,4% vs 70,0%), không lợi ích. Nợ còn lại: sửa comment
   "0/30 clean" trong `preview.tsx` thành số đã đính chính; flip-leg
   cho code land chưa đo lại (suy luận chặn dưới); spread đuôi lỏng
   chưa cải thiện (max ~75); WebKit không có driver ghost (tap vô
   dụng trên WebKit theo thiết kế).
5. **Zombie gate (b) — VẪN MỞ.** 0/267 draws-gap + 0/19 freeze có
   playhead chạy (f4) — chưa quan sát được, không đóng, không bác.
   Cần lượt máy yên + state100 dày mới kết luận được (G2 §3).
6. **Blur r7 — ĐÃ ĐÓNG với giả thuyết "nội dung gap 2".** Thành phần
   content thật của cụm A stripes vẫn là nợ mở (giả thuyết dẫn đầu
   của E6: triple liên tiếp khỏe mạnh với nhãn rải rác — chưa chứng
   minh). B-band c0 vẫn mở (p=0,22, power 46%; cần thêm 74 c0 + 79
   c2); thiết kế c0-only đã kiểm chứng (24 B-cap/lượt) nhưng cờ
   pair-like 4/24 vs 0/17 (p=0,13) cần theo dõi — nếu lệch kéo dài
   thì 2 thiết kế không hoán đổi được, phải tách pool. Triple g
   lệch +0,03..+0,05 so với dự đoán 0,589 — chưa giải thích.
7. **EPERM probe #25 + mù #24 — chờ lượt sau.** Mù #23 đã đóng hoàn
   toàn (thứ hai liên tiếp). **Mù #22: mức tin cậy đã hạ** (xem
   §2.7) — parent/user quyết giữ "đóng" hay ghi "đóng có điều kiện".
   Reboot #16 vẫn mở (kẹp ~4'). Cron riêng 10 phút vẫn chờ user
   quyết. Dự báo reboot #32 ~13:29Z (dải rất rộng, kém tin cậy).
8. **G4 flake — VẪN MỞ (nay 2/21, 9,5%).** Cơ chế chưa biết; G3 §4
   ghi chi tiết. Keydown chậm tự nhiên vẫn mở (kỷ lục nay 1004 ms,
   vẫn dưới cửa sổ 2 s của fallback #1).
9. **Birefnet 0 lần thành công** — chỉ thử lại khi RAM đổi (max
   trong mù #23 chỉ ~2,30 GB = 37% guard). **TTS 39 CẤM kiểm lại.**
   **ci-security.yml vẫn 403 chờ user.** **Release gate đứng yên**
   (không release/tag cho đến khi ngang/hơn CapCut).
10. **G3 cần sửa LIMITS của họ:** đính chính sai về giờ reboot #29
    (08:56:39Z vẫn đúng — xem §2.7). G9/G8 không sửa file luồng khác.

## 6. Giới hạn của kiểm chứng này

- G9 KHÔNG đo live mới nào ngoài suites + O8 (§1); mọi số headline
  đều đối chiếu từ dữ liệu gốc trên đĩa của các luồng (chạy lại
  script/analyzer khi có thể, đọc trực tiếp JSON/log khi không).
- Một số số gộp được kế thừa mà không đếm lại toàn bộ: G3 "40 lần /
  561 slot / 1122 toggle" keydown; G8 "339 file *.log" sóng EPERM và
  diff +17/+6 của quét wfs; G7 "4/4 cap F6" predict_pair; G2 "0/46
  xác nhận" là giám định (xem §2.2). Các số này được ghi rõ nguồn
  trong từng mục.
- Verify chạy trên RAM 452–755 MB (thấp) nhưng suite offline + O8
  vẫn xanh ngay lần đầu — RAM thấp không làm nhiễu kết quả đợt này;
  các probe live của G1/G6/G7 chạy lúc RAM 1,65–2,58 GB (ghi trong
  LIMITS từng luồng).
- Poller G9 có lỗi glob (bỏ sót G5 lúc đầu, đã sửa 12:09Z — xem §0);
  không ảnh hưởng kết luận 8/8 vì đã kiểm đĩa tới phút cuối trước
  khi đóng băng (không luồng nào về sau 12:09Z — tất cả LIMITS đều
  có mtime ≤ 12:03Z).

## Phụ lục — file liên quan

- Tài liệu này: `docs/PHASE9_ROUND105_G9_VERIFY_LIMITS.md`
- Log G9: `hidden_files/round105-g9/` (poll.log, poll.sh,
  round105-g9-verify.sh, round105-g9-o8.sh, round105-g9-suites.log,
  round105-g9-o8.log, recounts.log, o8-chromium/, o8-webkit/)
- Batch stage (không push):
  `~/workspace/repo-1-push/paths-loop/phase9-round105-g9-verify.txt`
- LIMITS từng luồng: `docs/PHASE9_ROUND105_G{1..8}_*.md`
- Log poller F9 đợt 104 (dùng đối chiếu mù #23):
  `hidden_files/round104-f9/poll.log`
