# Phase 9 đợt 102 — D9: kiểm chứng độc lập (8/8 về đủ; cây gộp xanh, O8 21/21 cả 2 engine)

> Luồng D9, đợt 102, lượt cron 09:35 +07 13/11/2026. KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production. KHÔNG đụng TTS 39, birefnet,
> `.github/workflows/*`.
>
> **Kết quả chung: 8/8 luồng D1–D8 về đủ** (LIMITS + log + batch stage).
> **Cây gộp xanh: tsc 0/0, vite build PASS 6,28 s, 26/26 mục suite offline
> exit 0 ngay lần đầu (không retry), test-preview-engine.sh 354
> assertions, O8 21/21 cả 2 engine ngay lần đầu (không retry). Đối chiếu
> headline 8/8 luồng đã về KHỚP với dữ liệu thô trên đĩa, với 3 đính
> chính nhỏ (xem §2 — Fisher D1, giờ reboot #25, đếm marker C4; không
> đổi kết luận nào).** Đợt đầu tiên kể từ đợt 99 mà cả 8 luồng đều về
> đủ trong một lượt (đợt 100: 8/8, đợt 101: 7/8 + C9 muộn).

## 0. Dòng thời gian + phương pháp

- **D9 bắt đầu:** 02:39:57Z 13/11 (boot `249407b6`, RAM khả dụng 500 MB,
  `preview.tsx` md5 `07f56792` = post-fix C4 cuối đợt 101). Lúc bắt đầu
  chưa có dấu vết đợt 102 nào trên đĩa (không file
  `PHASE9_ROUND102_*`, không `hidden_files/round102-*`, không
  `paths-loop phase9-round102-*`).
- **Poll đĩa (poller D9, mỗi 10 phút):** 02:50Z **0/8** → 03:00Z **1/8**
  (D5) → 03:10Z **1/8** (D7 đã có LIMITS nhưng chưa stage paths) →
  03:20Z **2/8** (+D1; D8 đã có LIMITS nhưng chưa stage paths) → 03:30Z
  **5/8** (+D2, D7, D8) → 03:40Z **8/8 ALL LANDED** (D3, D4, D6 về
  cùng lúc). Poller dừng 03:40Z. Không có luồng nào phải đợi quá
  poll cuối; không báo missing vội ở bất kỳ poll nào (D7/D8 là ví dụ
  đúng của "có LIMITS trước, paths sau").
- **Không reboot trong đợt** (boot `249407b6` suốt từ lúc D9 bắt đầu
  tới lúc O8 xong 03:48Z). Reboot #26 (02:12:10Z, `3a12a7d3 →
  249407b6`) xảy ra TRƯỚC lượt, do D5 xác minh bằng `uptime -s` +
  `boot_id` trực tiếp; D9 xác nhận độc lập: boot lúc 02:40Z đã là
  `249407b6` với uptime ~28 phút.
- **Cây gộp đóng băng lúc verify (03:41Z):** `preview.tsx`
  `ed260e62bd459d7978455773f71314dc` (ổn định từ poll 03:30Z),
  `media.ts` `2c384ed13703809d5e999311147745e7` (không đổi từ đợt 99),
  `playheadHold90R2.ts` `00cce1acb343b6b0cd28ca1824eedfcb` (không đổi
  từ đợt 101), `previewEngine.ts`
  `cd540de9c6c58a50fb81cf4a1f085c82` (không đổi từ đợt 101),
  `rvfcClipWindow.ts` mới `5f5f9aef028da32acd2444016a45ccc1` (D3).
  Không còn process luồng D1–D8 nào chạy lúc đóng băng. Verify offline
  03:42–03:46Z; O8 03:47–03:48Z. **Không reboot trong lúc verify.**
- **Script verify:** `hidden_files/round102-d9-verify.sh` (dựa trên
  `round101-c9-verify.sh`; thêm test mới của D3
  `rvfcClipWindow102D3.test.ts`) + script O8 `round102-d9-o8.sh`
  (dựa trên `round101-c9-o8.sh`; fixtures copy TRƯỚC từ
  `round102-d7/o8-chromium`, md5 khớp D7/C9: white `07bc0cb9…`, ball
  `6df873f7…`, track `cdf9a252…`; WebKit đọc fixture từ
  `round87-o8/headed`, md5 khớp — xem §1.3). Log:
  `round102-d9-suites.log`, `round102-d9-o8.log`, poll log
  `round102-d9/poll.log`.
- **preview.tsx đổi 4 lần giữa đợt:** `07f56792` (cuối đợt 101) →
  `b06e4aad` (D2 đang thử tap, poll 02:50Z) → `833ca8ef` (D3 land
  kill đồng bộ, poll 03:00Z) → `e886e754` (D3 land gate, poll 03:20Z)
  → `ed260e62` (D2 revert xong + D3 hoàn tất, ổn định từ 03:30Z).
  D2 revert đúng (0 marker D2 còn lại — xem §3).

## 1. Kiểm chứng trên cây gộp

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 6,28 s** |

### 1.2 Suite offline (log `hidden_files/round102-d9-suites.log`)

| test | kết quả |
|---|---|
| playheadHold90R2 | **75 passed**, exit 0 |
| playheadPacing54K9 | **19 pass, 0 fail**, exit 0 |
| previewEngine | 18 test passed (mask) + **27 test passed** (rvfc), exit 0 |
| seek | **21 passed**, exit 0 |
| seekSkipRender86N3 | **9/9 test pass**, exit 0 |
| previewLoop50F2 | **20 passed**, exit 0 |
| ghostBlend.probe | **15 kiểm chứng xanh**, exit 0 |
| rvfcClipWindow102D3 (mới, D3) | **21 test passed**, exit 0 |
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

**Tổng: 26/26 mục exit 0 ngay lần đầu** (không mục nào cần chạy lại).
21 dòng trong log chứa chữ "fail" đều lành: "0 fail" trong các bảng
tổng, tiêu đề section U4, và tên test-case kiểm tra luật FAIL có chủ
đích — 0 dòng "not ok" trong toàn bộ log.

### 1.3 O8 — 21/21 cả 2 engine, ngay lần đầu (log `hidden_files/round102-d9-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium | 03:47:00–03:47:51Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |
| WebKit | 03:47:51–03:48:41Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |

Số Δx khớp **đúng từng chữ** với O8 của D7 (đợt này, trước khi D3
land) và của C9/X2/X3/X9b/Y10/Z10/A10/B9 trên các cây trước — fix
zombie của D3 (đụng `preview.tsx` + đường draw) **không làm lệch
mask-track**. E0: 0 lỗi JS/pageerror/crash cả 2 engine (dòng duy nhất
chứa "crash" trong log là câu PASS "không có lỗi JS/pageerror/crash").
Cả 2 leg exit=0 ngay lần đầu (tổng ~100 giây); fixtures đã copy trước
(md5 khớp) và libs WebKit đã có sẵn trên boot `249407b6` (`ldd`
MiniBrowser-gtk trước khi chạy: chỉ 3 thiếu — `libjavascriptcoregtk`
trong bundle, `libbacktrace` + `libjxl` lazy/optional; `libwebkitgtk`
lần này resolve được, khác C9 ghi 4 thiếu — không ảnh hưởng kết quả).

## 2. Đối chiếu từng luồng — số headline KHỚP (3 đính chính nhỏ, không đổi kết luận)

### 2.1 D1 — 2 MiB junction probe: KHỚP (1 đính chính: Fisher p)

- **Bogus đếm lại trực tiếp từ log GST thô
  (`hidden_files/round102-d1/d-websrc/gst/`):** D1a
  `Lc2-b1-blobA-run{1..6}.log` = **1,1,1,1,2,2 = 8** ✓; D1b
  `Lc2-d1-blobA-run{1..8}.log` = **1,2,0,1,0,2,1,2 = 9** ✓
  (run3 trex 0, run5 stall-trước-demux 0 — đúng như LIMITS §2.1/§2.2).
  Gộp nhẹ 16/18 run có ≥1 bogus ✓.
- **Frames + failKind đếm lại từ JSON thô:** D1a totalFrames
  24/30/3/0/23/0, failKind error-event ×4 + stall-timeout ×2 ✓; D1b
  9/0/17/25/0/15/4/0, error-event ×5 + stall-timeout ×3 ✓ — khớp
  từng số với bảng LIMITS §1/§2 (JSON ghi `frames: null`, số frame
  nằm ở `totalFrames`).
- **Đính chính nhỏ — Fisher p của hiệu ứng ức chế bởi logging:**
  D1 ghi **p = 0,0029** (C1 TRACE 0/4 vs nhẹ 16/18). D9 tính lại bằng
  `math.comb`, đuôi đúng (bogus ở nhóm TRACE ≤ 0): **p = 0,0021**
  (C(6,4)/C(22,4) = 15/7315). Lấy nhầm đuôi cho p≈1,0 (bẫy C9 đã
  cảnh báo ở LIMITS C9 §7). Chênh lệch tương đối ~40% nhưng cùng bậc
  độ lớn, cùng kết luận (p < 0,005 — ức chế bởi logging là thật).
  Không rõ D1 tính 0,0029 bằng cách nào (có thể làm tròn khác hoặc
  bảng khác); số D9 tính lại (0,0021) là số nên trích.
- **Disassembly:** file `hidden_files/round101-c1/disasm-websrc.txt`
  tồn tại (249 dòng, như D1 trích); D9 không disasm lại — tin D1 ở
  mức "hai hằng đã xác nhận", vì log runtime C1 (0 dòng
  `"queue size %zu (min …)"` trong 4 run TRACE) khớp độc lập với
  cơ chế guard-trước-check mà D1 mô tả.
- D1 không sửa production (chỉ probe + JSON + log GST + analyzer).

### 2.2 D2 — Ghost tap rVFC độc lập (F7): KHỚP — KHÔNG LAND, đã revert

- **Clean đếm lại từ file analyze:** tap TẮT
  `analyze-d2-tapoff.txt`: distinct clean **45**, đơn-nghĩa n=**111**
  (40,5%) ✓; tap BẬT `analyze-d2-tapon.txt`: clean **54**, n=**103**
  (52,4%) ✓; flip `analyze-d2-flip-tapon.txt`: clean **49/91**
  (53,8%) ✓. Bar đăng ký trước (≥70% và hơn baseline ≥20 điểm)
  không đạt — quyết định KHÔNG LAND là đúng.
- **Flip gap đếm lại:** hậu flip [5000,15000ms) gap trung vị **1,0**,
  |gap|≤3 **110/114 (96%)** ✓; [15000ms+) trung vị **1,0**, **166/177
  (94%)** ✓ — claim "anchor hết phân kỳ" đứng.
- **Presented accuracy đếm lại từ `analyze-d2-presented.txt`:**
  A 26,4% (53/201), B 46,2% (78/169), C 60,3% (126/209) ✓ đúng
  từng số với LIMITS §4.
- **Revert đã xác minh trên cây gộp:** grep marker D2
  (`102D2`/`102d2`/`PresentedTap`) trong `preview.tsx` = **0** ✓;
  md5 cuối `ed260e62` khác baseline `07f56792` chỉ do D3 land song
  song (D2 không động vào phần D3 — xem §3).
- D2 không để lại code production nào (chỉ LIMITS trong batch).

### 2.3 D3 — Zombie fix: KHỚP — FIX ĐÃ LAND, đo được

- **Baseline:** `analysis-base.txt`: pump events n=166, cap 102,
  stale-frame 43, reset 3, **`skip-clip-inactive: 11`** ✓; 4 ca
  skip đầu relPlayMs 14181/34310/50086/60684, frameIdx 85/67/87/77,
  trễ 18–50 ms ✓ (khớp mẫu C5 R3).
- **Sau fix — 0 skip-clip-inactive ở cả 6 lượt:** trong
  `analysis-{x1,x2,n1,c1,x3,x4}.txt` không còn dòng đếm
  `skip-clip-inactive` nào (grep = 0); fb `seek-inactive` đếm được
  **11/10/11/12/12/12** ✓ khớp từng số với bảng LIMITS §2
  (x1 11/11, x2 10/11, n1 11/11, c1 12/12, x3 12/12, x4 12/12).
- **Test mới trên cây gộp:** `rvfcClipWindow102D3.test.ts` chạy lại
  **21/21** ✓ (xem §1.2); `tsconfig.json` chứa
  `src/lib/rvfcClipWindow102D3.test.ts` ở exclude (dòng 229) ✓ đúng
  như D3 ghi.
- **Code trên cây gộp:** `rvfcKillPumpsOutsidePlayhead` ×4,
  `shouldDeferRvfcPumpCreation` ×4, `seek-inactive` ×1,
  `102d3` ×5 trong `preview.tsx`; lib mới `rvfcClipWindow.ts`
  md5 `5f5f9aef…` ✓.
- D3 là luồng duy nhất sửa production đợt này (cùng D7 sửa harness).

### 2.4 D4 — Blur parity: KHỚP (Fisher tính lại khớp từng chữ)

- **Cap gộp đếm lại từ `analysis102d4.json`:** per-run n =
  97+176+98+30+58+16+28+13+36+14 = **566** ✓; `d_caps: []` (0 D) ✓;
  `gap6`: **20 ca** (A 11 / B 6 / C 3 — đếm lại từng ca trong JSON:
  A: r22×5 + r23x×1 + r24×5 = 11 ✓; B: r20×1 + r22×1 + r23x×1 +
  r24×1 + r29×1 + r31×1 = 6 ✓; C: r24×2 + r31×1 = 3 ✓); cụm A g
  0,434–0,447 quanh dự đoán pad-triple gap-2 0,449 ✓ (kiểm tra 2 ca
  mẫu trong JSON: fi63 g=0,4421, fi69 g=0,4396).
- **D floor gộp:** `d_postfix_pooled: {d: 0, n: 1433, fisher_p:
  9.466301842955844e-09}` ✓; D9 tính lại Fisher một phía bằng
  `math.comb`: gộp **p=9,47e-09** (D4 ghi 9,5e-09 ✓), C4-riêng
  **p=3,55e-06** (C4 ghi 3,6e-06 ✓); rule-of-three 95% CI trên
  0/1433 = **0,209%** ✓.
- **Pool=1 post-fix gộp:** n=31, bands C 18 / B 6 / A 7 ✓.
- D4 không sửa production (chỉ probe + analyzer).

### 2.5 D5 — EPERM probe #21: KHỚP

- **Checklist P8 §2.3 đọc trực tiếp trong
  `eperm-probe-v2.log` (55 dòng, trước lượt 52 dòng — đúng +3):**
  `probe DEAD detected by status (last #20 … age 10769s)`
  02:39:25Z ✓; `boot changed aa3f2b67 -> 249407b6 (uptime since
  2026-11-13 02:12:10)` ✓; `probe#21 boot=249407b6 tmp+ws ok=2
  fail=0` 02:39:32Z ✓; heartbeat `n=21, ts=02:39:32Z, boot
  249407b6` ✓.
- **Khoảng mù #20 ĐÃ ĐÓNG:** 2 reboot đều có giờ từng giây —
  #25 23:51:21Z (C9 poll.log: poll 23:51Z trên boot aa3f2b67 →
  poller chết → restart 23:52:38Z trên boot 3a12a7d3 — D9 đã đọc
  lại poll.log C9 và xác nhận) và #26 02:12:10Z (`uptime -s` +
  `boot_id` D5 đo trực tiếp; D9 xác nhận độc lập: boot lúc 02:40Z
  đã là `249407b6`, uptime ~28 phút).
- **Quét writeFileSync:** D9 không chạy lại scan, nhưng đọc
  `scan-meta.txt` của D5: `NEWSTD files_with_hits=132
  total_lines=431`, `R7B 149/456`, `COPIES 17/25`, scope 2658 file,
  SCAN 02:46:25–02:48:23Z ✓ khớp từng số với LIMITS §2.6; file list
  trên đĩa đếm lại: `wfs-newstd.txt` 132 dòng, `wfs-r7b.txt` 149
  dòng, `wfs-copies.txt` 17 dòng ✓; đối chiếu chéo 431+25=456 ✓.
  (Phần giải thích +33 dòng bằng diff hit list D9 không kiểm lại
  từng dòng — tin D5 ở mức này.)
- **Đính chính nhỏ — giờ reboot #25:** D5 §5 mục 11 và §4 mục 6 ghi
  đúng **23:51:21Z** (C9 đính chính C8 lệch ~55s); nhưng
  `PHASE9_GAP_ANALYSIS.md` §30 vẫn ghi "~23:52:16Z" (giờ C8 ước
  lượng) — D9 sửa thành 23:51:21Z trong §31 đợt này.
- D5 không đụng TTS 39, không thử birefnet, không tự tạo cron ✓
  (không file cron mới nào trong `crons/` của goal).

### 2.6 D6 — Re-arm drift-gate follow-up: KHỚP — KHÔNG SỬA, GIỮ NGUYÊN GATE

- **Gate/burst cộng lại từ `analyze-i1-i12-c3.txt`:**
  tailDriftGate theo lượt [5,7,8,4,8,3,7,3,5,0,5,4] = **59** ✓;
  tailBursts [3,2,6,0,4,1,1,1,1,0,2,0] = **21** ✓; dòng tổng ghi
  đúng `"tailBursts: 21 | tailDriftGate: 59 | đuôi đóng khi drift
  vượt: 1 | f4-like: 0 (kẹt seek: 0) | tiếp quản bởi watch: 14 |
  resyncsV tăng: 20"` ✓.
- **f4-like 0/12:** mọi lượt trong file analyze đều ghi "f4-like …:
  0 (kèm kẹt seek: 0)" ✓ (kiểm tra mẫu 5 lượt đầu).
- **D6-A bị bác:** D9 không chạy lại mô phỏng — tin phân tích
  quỹ đạo tick-by-tick của D6 (răng cưa Δct + drift dao động) ở mức
  "đã đọc file `dump-tail-ticks.txt`/`quantify-*-burst-vs-stable.py`
  có trên đĩa"; kết luận "0/24 đuôi đạt tiêu chí ổn định-lệch" là
  số của D6, chưa tính lại độc lập (cần chạy lại 2 script quantify
  mới xác nhận — ghi làm nợ kiểm tra nhẹ cho đợt 103, không đổi
  quyết định giữ gate vì baseline i1–i12 0 f4-like đã tự đứng).
- `playheadHold90R2.ts` md5 `00cce1ac` trên cây gộp = md5 C9 đã
  verify ✓ (gate không đổi một byte).
- D6 không sửa production (chỉ probe + analyzer).

### 2.7 D7 — Harness O8 + N10/E1 fault bắn thật: KHỚP

- **O8 đọc lại từ `round102-d7/o8.log`:** Chromium
  `== KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail, 0 note ==`, S5
  Δx=0,112, S7 mask 0,112 / bóng 0,113 ✓; WebKit `21/21 pass, 0
  fail, 0 note`, S5 Δx=0,194, S7 mask 0,194 / bóng 0,197 ✓ —
  khớp từng số với LIMITS §4.1 (và khớp O8 của D9 trên cây gộp
  cuối, xem §1.3).
- **N10 retry — log `n10-retry-run.log`:** "Space lần 1 … playing
  về true sau 69ms (lần thử 2, space-retry)" 02:52:51.653Z ✓.
- **N10 fallback — log `n10-fallback2-run.log`:** timeout lần 1
  5095ms 03:04:47.661Z, lần 2 5407ms 03:04:53.776Z, fallback #1
  "lật sau 158ms" 03:04:54.151Z ✓; tỉ lệ 1,2/1,55/2,15/2,87/1,66
  → 1,89×, 4/4 pass ✓.
- **E1 FB2 — log `e1-fb2-run.log`:** dispatch keydown muộn
  02:59:59.664Z, fallback #1 "chưa giữ được" 03:00:01.784Z
  (wait 2120ms), fallback #2 "lật sau 112ms" 03:00:02.083Z ✓.
- **Harness md5 trên cây gộp khớp đúng từng chữ với D7 ghi:**
  E1 `4ba1d86c458a9b2de1e8b423eb31ca7f` ✓, N10
  `9ca985cd7c38978ce5aaadeedcf758e8` ✓ (đã land sau khi D8 xong).
- D7 không sửa production (chỉ harness/probe).

### 2.8 D8 — G1 evidence 11: KHỚP (tính lại từ JSON gộp)

- **Pool v12** (`benchmarks/results/g1-evidence-v12-102d8.json`):
  pool30 **n=91**, pool60 **n=59**, d8_e1 **n=9**, d8_60 **n=5** ✓.
- **Chân yên M2** (`m2-quiet102d8.json`, đọc trực tiếp):
  `first20_m2_max = 15` ✓ (khung (a) trần cứng); `last20_m2_max =
  19` ✓ (khung (b)); `last10_m2_max = 10` ✓ (khung (f));
  `post_a9_m2` len **11** ✓ (khung (g)); `quiet30_order` len 29,
  `quiet30_m2_range` len 3 (23–24/29, khung (c)) ✓;
  `near_boundary_runs` len **0** ✓ (khung (h) không kiểm được);
  `flips_total = 6`, `agree = 112`, `n_runs_m2 = 118` ✓ (112/118
  = 94,9%); `quiet60_m2` len **20** (20/20) ✓; `flagged_quiet`
  len **2** ✓ (A7-7, D8-3).
- **Test hồi quy:** `deint-fps-verdict` 17/17 + `100b7` 13/13 chạy
  lại trên cây gộp ✓ (xem §1.2).
- **Đính chính nhỏ:** D8 §6 mục 13 ghi reboot #25 là "23:51:32Z
  12/11" — lệch 11 giây so với giờ đúng 23:51:21Z (cùng lỗi C7 đã
  mắc ở đợt 101; C9 đã đính chính). Không đổi gì khác.
- D8 không sửa production, không tự đóng G1 ✓ (chỉ thu thập bằng
  chứng + khung (f)–(i) + Q1–Q6 cho user).

## 3. Va chạm gộp — preview.tsx: 2 luồng cùng sửa, không mất marker

- **File duy nhất bị 2 luồng sửa:** `apps/web/src/preview.tsx` (D2
  thử tap rồi revert + D3 land fix). Tất cả file còn lại trong 8
  batch đều duy nhất (tổng 20 entry / 20 file duy nhất đợt 102 —
  không trùng file nào giữa các luồng). Không file
  `.github/workflows/*` nào bị đụng; không binary nào vào batch.
- **Trên đĩa lúc đóng băng (md5 `ed260e62`):** marker D3 **×14**
  (trong `preview.tsx`: `102d3` ×5, `rvfcKillPumpsOutsidePlayhead`
  ×4, `shouldDeferRvfcPumpCreation` ×4, `seek-inactive` ×1);
  marker D2 **×0** (revert hoàn toàn) ✓; marker "Đợt 101 C3" **×5**
  (theo dòng); marker C4 **13 lần xuất hiện**
  (`paddedGhosts` ×6, `lastDrawnPaddedGhosts` ×5,
  `motionBlurPadGhostCount` ×2 — C9 ghi 12, D9 đếm 13: chênh 1 do
  cách đếm lần xuất hiện, code pad-oldest còn nguyên, test pad
  27/27 xanh); marker cũ "Đợt 100 B" ×14 dòng.
- **Thứ tự sửa (khôi phục từ poll md5):** `07f56792` (cuối đợt 101)
  → `b06e4aad` (D2 tap, ~02:50Z) → `833ca8ef` (D3 kill đồng bộ,
  ~03:00Z) → `e886e754` (D3 gate, ~03:20Z) → `ed260e62` (D2 revert
  + D3 hoàn tất, ổn định từ 03:30Z). Cây ổn định từ 03:30Z trở đi.
- **Thay đổi production có logic mới đợt này (đúng 1):** fix zombie
  của D3 (`rvfcClipWindow.ts` mới + kill đồng bộ + skip-seeking
  guard + gate tạo pump trong `preview.tsx`). D7 chỉ sửa harness
  (`.mjs`, không thuộc tsc). Mọi luồng khác chỉ đo / probe / test /
  docs.
- **tsconfig.json (D3):** chỉ thêm `src/lib/rvfcClipWindow102D3.test.ts`
  vào exclude (dòng 229) — theo quy ước repo, tsc web vẫn 0.
- tsc 0 + vite build PASS + toàn bộ suite xanh + O8 21/21 cả 2
  engine sau gộp — không xung đột nội dung.

## 4. Boot + reboot + RAM trong đợt

- **Không reboot trong đợt 102** (boot `249407b6` từ 02:39Z lúc D9
  bắt đầu tới O8 xong 03:48Z). **Reboot #26 lúc 02:12:10Z**
  (`3a12a7d3 → 249407b6`) xảy ra trước lượt — D5 xác minh giờ từng
  giây bằng `uptime -s`; khoảng cách #25→#26 = 2h20'49", trong dải
  quan sát 1h11'36"–3h04'35". Reboot tiếp theo D5 dự kiến ~04:16Z
  (chưa tới lúc D9 kết thúc 03:49Z — không quan sát được).
- **RAM khả dụng (MemAvailable):** poll D9: 500 → 2531 → 1825 →
  2328 → 2939 → 2872 → 1142 MB; D5 ghi 5 mẫu 464/430/1412/989/1795
  MB trong lượt. Max quan sát trong đợt ~2,9 GB, **luôn dưới ngưỡng
  guard 6 GB** — birefnet KHÔNG chạy (đúng quy tắc parent đợt 92).
- **preview.tsx đổi 4 lần giữa đợt** (xem §0); ổn định từ 03:30Z.

## 5. Trạng thái nợ sau đợt 102 (cập nhật từ LIMITS gộp đợt 101 §4)

1. **D9 kiểm chứng độc lập + O8 — ĐÃ XONG (luồng này).** 8/8 luồng
   đã về đối chiếu khớp; O8 21/21 cả 2 engine ngay lần đầu trên cây
   gộp cuối (D3 đã land); LIMITS gộp đợt 101 §4 mục 1 nay ĐÃ ĐÓNG
   hoàn toàn (C1 đã kết luận ở D1, C9 đã xong ở đợt 101 — D9 xác
   nhận độc lập).
2. **2 MiB — điểm nối hẹp nhất nay là luồng byte blob→qtdemux trước
   pull đầu của qtdemux (D1).** Không còn là "handoff
   typefind↔webkitwebsrc" ở mức event (chuỗi event giống hệt nhau
   giữa bogus và sạch). Bước duy nhất còn lại để chốt: probe ghi nội
   dung byte của buffer đầu tiên qtdemux nhận (B1 §8.4 — cần code đo
   mới, chưa làm). Vì sao đúng 2.097.152 vẫn mở (trùng LOW threshold
   nhưng restart không bao giờ chạy — 0 restart trong 22 run).
3. **G1 đóng hay chưa — VẪN MỞ, chờ parent/user quyết.** D8: khung
   (a) tối đa 15/20 (trần cứng); khung (b) trượt 19/20; khung (c)
   23–24/29 (lần yên tiếp theo là quyết định: PASS → kịch bản xấu
   24/30 = 80,0% đúng mốc); khung mới (f) 10/10, (g) hậu-A9 11/11;
   (h) không kiểm được (0 lần biên); (i) đệm 3 lần FAIL liên tiếp.
   Câu hỏi Q1–Q6 của D8 (§7) chưa ai trả lời. Đợt 103 nên đo E1 đầu
   lượt để bắt cửa sổ yên (D8: chỉ 2/9 lần thử thành yên).
4. **Ghost residual — F7 tap KHÔNG LAND (D2).** Tap sửa được anchor
   (gap hậu flip trung vị 1,0, |gap|≤3 94–96%) nhưng không sửa được
   clean/spread (52,4%/53,8% < bar 70%) vì nhãn snapshot lấy từ
   currentTime, tap chỉ đổi `presented`. Hướng còn đứng: **F8 relabel
   snapshot bằng anchor tap** (CHƯA thử) + siết ngưỡng tươi anchor
   500ms → ~50ms (CHƯA đo lại) + F6' pixel-verified skipLatest cho
   WebKit. Mọi kết luận nhân quả chỉ đo trên Chromium.
5. **Zombie pump — KHE EARLY-RETURN ĐÃ ĐÓNG (D3, fix đã land).**
   Kill đồng bộ khi playhead nhảy + guard skip-seeking + gate tạo
   pump: 0 skip-clip-inactive ở 6 lượt post-fix (114 biên
   seek-across + 23 biên thường); đối chứng tắt owner-kill vẫn 0/12
   (trước fix C5 c5c3 cùng điều kiện bắn 6/6). Nợ mới: đường tick vẽ
   1 frame stale ở tick đầu sau nhảy (d3x2, cap frame 90) — cùng cửa
   sổ 2-tick nhưng ở đường vẽ, chưa fix.
6. **Re-arm — drift-gate C3 ĐÃ LAND, D6 GIỮ NGUYÊN.** D6-A
   "stable-offset close" BỊ BÁC bằng dữ liệu (0/24 đuôi đạt tiêu chí
   ổn định-lệch; "drift giống nhau" là điểm đáp của burst lặp lại,
   không phải decoder ổn định). Baseline mới i1–i12: f4-like 0/12,
   gate chặn 59, burst 21, 0 seek kẹt. Tuổi đuôi trung vị theo
   velocityTicks: h 1509 ms → i 2400 ms (khác phiên đo, cùng code
   gate — không kết luận "gate tệ đi"). Hạ trần 5000 → 3000 ms cũng
   không làm (lợi nhỏ, rủi ro không chứng minh được an toàn).
7. **Blur parity — D floor post-fix gộp 0/1433 (p=9,5e-09).**
   B-band chốt không phải 2 mode; r7 VẪN MỞ (1 ca duy nhất trong
   lịch sử) nhưng cơ chế của nó đã bị pad-oldest trung hòa (11/566
   cap nhãn gap 6 rơi vào dải A, nội dung gap 2). Cần strip-confirm
   1 ca trong cụm A để chốt r7. Cửa sổ mù wk KHÔNG thu hẹp được
   (c1 median 1152ms đúng dải Y5; đuôi tải tới 8124ms) — giữ nguyên
   kết luận A5; cần lượt blind yên (đang bị cấm trong nhiệm vụ này).
8. **EPERM — probe #21 ok=2 fail=0; khoảng mù #20 ĐÃ ĐÓNG**
   (2 reboot #25 23:51:21Z + #26 02:12:10Z, cả hai đều có giờ từng
   giây). Tiếp theo: probe #22 + khoảng mù #21 (bắt đầu 02:39:32Z).
   Giờ từng giây reboot #16 KHÔNG chốt được (kẹp ~4', chờ
   parent/user quyết). Cron riêng 10 phút vẫn chờ user quyết.
   **Đính chính giờ reboot #25: 23:51:21Z** (không phải ~23:52:16Z
   như GAP_ANALYSIS §30 đã ghi).
9. **Harness — N10 retry/fallback chiều PHÁT + E1 vòng fallback thứ
   2 ĐÃ bắn thật (D7).** Nợ harness từ C8 nay ĐÃ ĐÓNG hết: mọi đường
   retry/fallback của Space-toggle (E1 + N10, cả 2 chiều, cả vòng
   lặp fallback thứ 2) đều đã bắn thật ít nhất 1 lần. Còn mở: keydown
   chậm tự nhiên lọt đúng cửa sổ 2s của fallback #1 vẫn chưa quan
   sát được ngoài đời (chỉ mới chứng minh bằng dispatch định thời);
   mơ hồ ±100–200ms ở N10 fallback lần 2 (chạy lại với DELAY=20000
   sẽ triệt).
10. **Birefnet-general trong gói: vẫn 0 lần chạy thành công** (không
    thử đợt này — RAM max quan sát được ~2,9 GB < ngưỡng guard 6 GB;
    quyết định parent đợt 92 giữ nguyên).
11. **TTS 39: không kiểm lại đợt này** (lệnh cấm được tuân thủ).
12. **ci-security.yml + ci-build.yml: vẫn 403** (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App). Không file workflow
    nào bị đụng đợt này.
13. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi
    ngang/hơn CapCut thật.

## 6. Batch đã stage (KHÔNG push)

- D9: `phase9-round102-d9-verify.txt` — 1 entry NUL-delimited
  (LIMITS này), read-back OK (xem dưới).
- Đợt 102 (8 luồng): **20 entry / 8 file** (D1 2, D2 1, D3 6, D4 2,
  D5 1, D6 3, D7 3, D8 2) / 20 file duy nhất (không trùng file giữa
  các luồng). Closing đợt 102: 2 entry (LIMITS gộp + gap analysis §31).
- **Tổng chờ push sau đợt 102 (đếm lại trực tiếp từ đĩa, đợt 67–102,
  SAU khi stage D9 + closing): 361 file batch / 2436 entry / 1474
  file duy nhất** (trước D9: 359/2433/1472 — khớp đúng số đếm lại;
  D9 + closing thêm 2 file batch / 3 entry / 2 file duy nhất mới là
  LIMITS gộp + LIMITS này; gap analysis đã có trong 30 batch trước
  nên không thêm file duy nhất). HEAD vẫn 5f548ef8. KHÔNG push.

## 7. Ghi chú vận hành cho verify sau

- **Poller D9 đếm đúng 8/8 ngay lần đầu** (glob `d[1-8]` không khớp
  file closing — bài học C9 đã áp dụng đúng; không còn lỗi đếm
  closing như C9). Nhưng poller dừng ở 03:40Z khi vừa đủ 8/8 —
  D3/D4/D6 về cùng lúc trong 10 phút cuối; nếu một luồng về muộn
  hơn poll cuối thì phải chờ thêm như C9 đã làm (đừng kết luận
  missing từ 1 poll).
- **LIMITS trước, paths sau là bình thường:** D7 (03:10Z) và D8
  (03:20Z) đều có LIMITS trước khi stage paths — poller chỉ đếm
  paths, nhưng verify phải đếm cả LIMITS để biết luồng nào đang
  stage dở.
- **Fisher một phía phải lấy đúng đuôi** (bài học C9 §7 vẫn đứng):
  D9 suýt trích p≈1,0 cho D1 vì lấy nhầm đuôi (post < pre); đuôi
  đúng cho "TRACE ức chế bogus" là P(X≤0) = 0,0021.
- **Đừng tin số tóm tắt khi chưa đối chiếu từng run:** D1 ghi
  Fisher 0,0029, D9 tính lại 0,0021 — cùng kết luận nhưng số khác;
  luôn tính lại Fisher/p-value khi luồng claim (nhiệm vụ D9 đã yêu
  cầu).
- **O8 sau khi fix land mới là O8 có giá trị:** D7 chạy O8 lúc
  02:45–02:48Z trên cây `07f56792` (trước khi D3 land); D9 chạy lại
  trên cây gộp cuối `ed260e62` và Δx khớp từng chữ — nếu chỉ tin
  O8 của D7 thì chưa chứng minh được fix D3 không lệch mask-track.
- **Sau reboot, VM có thể là image mới thiếu libs:** kiểm tra `ldd`
  MiniBrowser trước mọi probe WebKit; lần này chỉ 3 thiếu benign
  (`libwebkitgtk` đã resolve được, khác C9).
- **D6-A là tiền lệ tốt:** một phương án "trông hứa hẹn trên mô
  phỏng" vẫn bị bác bằng quỹ đạo tick-by-tick — verify sau đừng chỉ
  kiểm tra số mô phỏng, hãy hỏi dữ liệu gốc có phân biệt được hai
  giả thuyết không.
