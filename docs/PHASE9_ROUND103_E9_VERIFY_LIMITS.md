# Phase 9 đợt 103 — E9: kiểm chứng độc lập (8/8 về đủ; cây gộp xanh, O8 21/21 cả 2 engine)

> Luồng E9, đợt 103, lượt cron 12:35 +07 13/11/2026. KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production. KHÔNG đụng TTS 39, birefnet,
> `.github/workflows/*`.
>
> **Kết quả chung: 8/8 luồng E1–E8 về đủ** (LIMITS + log + batch stage).
> **Cây gộp xanh: tsc 0/0, vite build PASS 7,80 s, 27/27 mục suite offline
> exit 0 ngay lần đầu (không retry), test-preview-engine.sh 354
> assertions, O8 21/21 cả 2 engine ngay lần đầu (không retry). Đối chiếu
> headline 8/8 luồng đã về KHỚP với dữ liệu thô trên đĩa, với 7 đính
> chính/ghi chú nhỏ (xem §2 — không đổi kết luận nào).** Đợt thứ hai liên
> tiếp 8/8 về đủ trong một lượt (đợt 102: 8/8; đợt 101: 7/8 + C9 muộn).
> **Reboot #28 (06:56:44Z) xảy ra GIỮA đợt** — sau khi 7/8 luồng đã về,
> giết probe đang chạy của E5; E5 tự hồi phục sau reboot và vẫn về đủ.

## 0. Dòng thời gian + phương pháp

- **E9 bắt đầu:** 05:40:30Z 13/11 (boot `9576eac3`, RAM khả dụng 1265 MB,
  `preview.tsx` md5 `ed260e62` = cuối đợt 102). Lúc bắt đầu chưa có dấu
  vết đợt 103 nào trên đĩa (không file `PHASE9_ROUND103_*`, không
  `hidden_files/round103-*`, không `paths-loop phase9-round103-*`).
- **Poll đĩa (poller E9, mỗi 10 phút):** 05:50Z **0/8** → 06:00Z **1/8**
  (E7) → 06:10Z **2/8** (E8) → 06:20Z **3/8** (E2) → 06:30Z **5/8** (E1,
  E6) → 06:40Z **5/8** → 06:50Z **7/8** (E3, E4) → **06:56:44Z REBOOT
  #28** (`9576eac3 → 8c1c5131`) làm gián đoạn runtime + poller (poller
  gốc không có kết quả cuối xác nhận; E9 khởi động lại poller 06:58:31Z)
  → 07:08:35Z **8/8 ALL LANDED** (E5). Không báo missing vội ở bất kỳ
  poll nào (E5 là ví dụ đúng của "về muộn sau reboot thì gộp muộn thay
  vì bỏ" — E5 retry s1 lúc 06:58Z, stage xong trước 07:08Z).
- **Reboot #28:** `uptime -s` = 2026-11-13 06:56:44Z, boot_id
  `8c1c5131-7366-4f08-8c7f-b70325c398d3`. Khoảng cách #27→#28 =
  **1h30'26"** — trong dải quan sát (1h11'36"–3h14'08"). E5 đang chạy
  probe confirm s2 lúc reboot (confirm-s2.log 0 byte, probe dir s2 có
  file lúc 06:56Z); sau reboot không còn process probe/vite nào sống,
  E5 chạy lại s1 một lần (vẫn crash do RAM ~1,5 GB — xem §2.5) rồi
  viết LIMITS + stage. Reboot tiếp theo dự kiến ~09:03Z (chu kỳ
  ~2h07'/lần; dải 08:08–10:11Z).
- **Không reboot trong lúc verify** (boot `8c1c5131` suốt từ lúc E9
  khởi động lại tới O8 xong 07:20:32Z). Verify offline 07:09:59–
  07:14:46Z; O8 07:18:32–07:20:32Z.
- **Cây gộp đóng băng lúc verify (07:09:10Z):** `preview.tsx`
  `c2251e39da176c56ac7f4ae69b165132` (ổn định từ poll 06:40Z),
  `media.ts` `2c384ed13703809d5e999311147745e7` (không đổi từ đợt 99),
  `playheadHold90R2.ts` `00cce1acb343b6b0cd28ca1824eedfcb` (không đổi
  từ đợt 101), `previewEngine.ts`
  `cd540de9c6c58a50fb81cf4a1f085c82` (không đổi từ đợt 101),
  `rvfcClipWindow.ts` mới `5f5f9aef028da32acd2444016a45ccc1` (D3, đợt
  102), `driftConfirmSkip103E4.ts` mới
  `2748b6f304354daf979ce90bbe0631bc` (E4, đợt này). Không còn process
  luồng E1–E8 nào chạy lúc đóng băng (E5 đã stage xong 07:08Z).
- **Script verify:** `hidden_files/round103-e9-verify.sh` (dựa trên
  `round102-d9-verify.sh`; thêm test mới của E4
  `driftConfirmSkip103E4.test.ts`) + script O8 `round103-e9-o8.sh`
  (dựa trên `round102-d9-o8.sh`; fixtures copy từ `round103-e8/o8-chromium`,
  md5 khớp E8/D7/C9: white `07bc0cb9…`, ball `6df873f7…`, track
  `cdf9a252…`; WebKit đọc fixture từ `round87-o8/headed`, md5 khớp —
  xem §1.3). Log: `round103-e9-suites.log`, `round103-e9-o8.log`, poll
  log `round103-e9/poll.log`.
- **preview.tsx đổi 5 lần giữa đợt:** `ed260e62` (cuối đợt 102) →
  `0209d29c` (~05:50Z) → `110a51b9` (05:59:24Z) → `03fab95d` (~06:21Z)
  → `4e954101` (06:28:22Z) → `c2251e39` (06:38:03Z, ổn định từ đó).
  Chuỗi này khớp nhật ký của E3/E4/E5 (E3 thử F8 rồi revert, E4 land
  v2, E5 land nested fix).

## 1. Kiểm chứng trên cây gộp

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 7,80 s** |

### 1.2 Suite offline (log `hidden_files/round103-e9-suites.log`)

| test | kết quả |
|---|---|
| playheadHold90R2 | **75 passed**, exit 0 |
| playheadPacing54K9 | **19 pass, 0 fail**, exit 0 |
| previewEngine | 18 test passed (mask) + **27 test passed** (rvfc), exit 0 |
| seek | **21 passed**, exit 0 |
| seekSkipRender86N3 | **9/9 test pass**, exit 0 |
| previewLoop50F2 | **20 passed**, exit 0 |
| ghostBlend.probe | **15 kiểm chứng xanh**, exit 0 |
| rvfcClipWindow102D3 (D3, đợt 102) | **13 + 21 test passed** (2 sub-suite), exit 0 — xem đính chính §2.1 |
| driftConfirmSkip103E4 (mới, E4) | **12/12 PASS**, exit 0 |
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

**Tổng: 27/27 mục exit 0 ngay lần đầu** (không mục nào cần chạy lại;
26 mục cũ + 1 mục mới của E4). Các dòng chứa "fail" trong log đều lành:
"0 fail" trong các bảng tổng, tiêu đề section U4, và tên test-case kiểm
tra luật FAIL có chủ đích — 0 dòng "not ok" trong toàn bộ log.

### 1.3 O8 — 21/21 cả 2 engine, ngay lần đầu (log `hidden_files/round103-e9-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium | 07:18:32–07:19:32Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |
| WebKit | 07:19:32–07:20:32Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |

Số Δx khớp **đúng từng chữ** với O8 của D7/D9/E8 trên các cây trước —
cả hai fix đã land đợt này (E4 drift-confirm gate + E5 nested flat-spec,
đều đụng `preview.tsx` + đường draw/tick) **không làm lệch mask-track**.
E0: 0 lỗi JS/pageerror/crash cả 2 engine. Cả 2 leg exit=0 ngay lần đầu
(tổng ~120 giây); 0 dòng "retry" trong log O8; fixtures đã copy trước
(md5 khớp) và libs WebKit đầy đủ trên boot `8c1c5131` (`ldd`
MiniBrowser-gtk trước khi chạy: **0 thiếu** — tốt hơn D9 ghi 3 thiếu
benign; `libwebkitgtk` resolve được).

## 2. Đối chiếu từng luồng — số headline KHỚP (7 ghi chú nhỏ, không đổi kết luận)

### 2.1 Đính chính nhỏ — rvfcClipWindow102D3: 13 + 21 = 34 test, không phải 21

File test của D3 in HAI dòng tổng: `13 test passed` (sub-suite
`rvfcClipWindow`) + `21 test passed` (sub-suite
`shouldDeferRvfcPumpCreation`) — tổng **34 test**, cả hai đều xanh
trên cây gộp cuối. D9 đợt 102 ghi "21/21" (chỉ lấy dòng tổng cuối) —
số đúng để trích từ nay là **13 + 21**. Không đổi kết luận nào (fix
zombie D3 vẫn xanh).

### 2.2 E1 — G1 evidence 12: KHỚP

- **Pool v13** (`benchmarks/results/g1-evidence-v13-103e1.json`, đọc
  trực tiếp): pool30 **n=100, PASS 91**; pool60 **n=64, PASS 61** ✓;
  e1_e1 G5 [0,91 / 0,82 / 1,02 / 1,35 / 1,08 / 0,99 / 1,34 / 0,92 /
  0,99] ✓; M2 [0,91 / 0,89 / 0,80 / 1,09 / 1,06 / 1,03 / 1,35 / 0,84
  / 1,13] ✓; e1_60 G5 [1,15 / 1,22 / 1,43 / 1,08 / 0,96] ✓.
- **Lần yên quyết định:** e1 run1 trong JSON: baseline **23,19 fps**,
  G5 **0,91**, M2 **0,91**, mode "yên", flagged False ✓ — đúng như
  LIMITS §3.1.
- **Chân yên M2** (`m2-quiet103e1.json`, đọc trực tiếp):
  `first20_m2_max = 15` ✓ (khung (a) trần cứng); `last20_m2_max =
  19` ✓ (khung (b)); `last10_m2_max = 10` ✓ (khung (f));
  `post_a9_m2` len **12** ✓ (khung (g));
  `quiet30_m2_range = [24, 25, 30]` ✓ (khung (c) 24–25/30, kịch bản
  xấu đúng mốc 80,0%); `near_boundary_runs` len **0** ✓ (khung (h)
  không kiểm được); `flips_total = 6`, `agree = 126`, `n_runs_m2 =
  118 → 132` ✓ (126/132 = 95,5%); `quiet60_m2` len **21** (21/21)
  ✓; `flagged_quiet` len **2** ✓.
- **Ghi chú:** G4 flake ở E1 run8 (harness 9/10, §3.5) là quan sát
  của riêng E1 — E9 không chạy lại headed E1 nên không xác minh độc
  lập lần flake này; G5/M2 của run8 vẫn dùng được theo lập luận của
  E1 (FPS đo độc lập với G4), E9 không phản bác.
- E1 không sửa production, không tự đóng G1 ✓.

### 2.3 E2 — 2 MiB byte-probe: KHỚP (đếm lại toàn bộ 1.728 pull + Fisher tính lại)

- **Đếm lại toàn bộ pull từ `e2-analysis.txt` (E9 chạy script cộng
  các dòng tổng theo element):** qtdemux0 **353 pull (EXACT 340 /
  SPLICED 13 / OTHER 0)** ✓; qtdemux1 **66 (53 / 13 / 0)** ✓;
  qtdemux2 **487 (487 / 0 / 0)** ✓; typefind **822 (796 / 26 / 0)**
  ✓. Tổng **1.728 pull, 0 OTHER** ✓; **typefind spliced 26 = đúng
  qtdemux0+qtdemux1 spliced (13+13)** ✓ — bằng chứng đếm được rằng
  typefind chỉ proxy.
- **Ma trận đối chiếu JSON** (`webkit-blob-flaky-103e2-2mib.json`, 14
  case): playOk False ×6 (E2L) → True ×4 (E2T) → False ×4 (E2W) ✓
  khớp bảng LIMITS §2 (nhẹ 10/10 bogus, TRACE 0/4).
- **Spot-check byte:** run1 qtdemux0 pull off=0 SPLICED
  file[2097152:2097168]; qtdemux1 off=3179 size=38487 SPLICED
  file[2100331:2100395]; off=41666 SPLICED file[2138818:2138882];
  qtdemux2 cùng offset EXACT ✓ — đúng cấu trúc splice E2 mô tả §3
  (đoạn sai 39.642 byte = 2139973 − 2100331).
- **Fisher tính lại bằng `math.comb`:** E2-only (nhẹ 10/10 vs TRACE
  0/4) **p = 1/C(14,10) = 0,0010** ✓ (E2 ghi 0,0010); gộp D1+C1
  (nhẹ 26/28 vs TRACE 0/8) **p = 1,487e-06 ≈ 1,5e-06** ✓ (E2 ghi
  1,5e-06).
- E2 không sửa production (chỉ shim LD_PRELOAD + probe + analyzer);
  binary `.so` không vào batch ✓.

### 2.4 E3 — Ghost F8 relabel: KHỚP — KHÔNG LAND, đã revert (trả lời ghi chú parent)

- **Clean đếm lại từ file analyze:** flip tap-on hậu flip+2000ms
  **68/76 = 89,5%** ✓; labelSrc=tap **68/74 = 91,9%** ✓; baseline
  flip **68/142 = 47,9%** ✓; baseline A2 **53/126 = 42,1%** ✓.
  Bar đăng ký trước (≥70% và hơn baseline ≥20 điểm trên case B)
  không đạt (B 49,5% / B2 58,1%) — quyết định KHÔNG LAND là đúng.
- **Revert đã xác minh trên cây gộp (ghi chú parent — (a)):** grep
  marker E3 (`103e3`/`103 E3`/`freshAnchorFrame`/`relabelFrameIndex`/
  `e3RelabelStash`/`presentedTap`) trong `preview.tsx` = **0 lần
  xuất hiện, 0 dòng** ✓; `previewEngine.ts` md5 `cd540de9` khớp
  baseline (không hề chạm) ✓. **Marker biến mất là KỲ VỌNG** (E3 tự
  revert vì F8 trượt bar), không phải va chạm gộp — không cần khôi
  phục gì.
- E3 không để lại code production nào (chỉ LIMITS trong batch).

### 2.5 E4 — Zombie tick stale-frame: KHỚP — FIX v2 ĐÃ LAND (ghi chú parent — (b))

- **Kill latency y1 đếm lại từ `analysis-y1.txt`:** n=12, min 0,00 /
  median **0,20** / max **2,40** / mean 0,37 ms ✓ (LIMITS §2 ghi
  median 0,20 / max 2,40).
- **Draws stale:** `draws-check-y1.txt` và `draws-check-y2.txt` đều
  ghi **`examined=23 stale=0`** ✓ (tổng 0/46 như LIMITS §1.5);
  `e4skip` y1 = 207 ✓.
- **Code trên cây gộp:** marker E4 **29 dòng / 40 lần xuất hiện**
  (`103E4` ×23, `driftConfirmSkip` ×6, `forwardDriftConfirmPending`
  ×4, `graceActive103E4` ×2, `__vcut103e4` ×7 — đủ cả 6 điểm E4 liệt
  kê §3: import predicate, set pending, counter, tách grace, OR gate
  với N3, ghi timestamp kill); file mới `driftConfirmSkip103E4.ts`
  md5 `2748b6f3…`, test 12/12 xanh trên cây gộp (§1.2). (E4 ghi "30
  dòng" — chênh 1 do cách đếm pattern; mọi thành phần đều có mặt,
  không thiếu code.)
- **D3/C4 còn nguyên:** marker D3 **14 lần xuất hiện** (khớp đúng
  D9: `102d3` ×5 + `rvfcKillPumpsOutsidePlayhead` ×4 +
  `shouldDeferRvfcPumpCreation` ×4 + `seek-inactive` ×1); marker C4
  **13 lần xuất hiện** (khớp đúng D9: `paddedGhosts` ×6 +
  `lastDrawnPaddedGhosts` ×5 + `motionBlurPadGhostCount` ×2).
- **Ghi chú về reboot:** E5 §7 ghi "Boot 9576eac3 suốt đợt, không
  reboot" — đúng cho cửa sổ đo của E5, nhưng **reboot #28 lúc
  06:56:44Z xảy ra trong đợt 103** (sau probe post-fix của E5, giữa
  lúc E5 chạy confirm load0 s2) và giết probe s2 của chính E5; E5 đã
  chạy lại s1 sau reboot (vẫn crash do RAM ~1,5 GB — lỗi môi trường,
  không phải sản phẩm) rồi viết LIMITS + stage. Không phải lỗi số
  liệu của E5, chỉ là mốc thời gian cần ghi đúng.
- E4 là một trong 2 luồng sửa production đợt này (cùng E5).

### 2.6 E5 — Re-arm fail-open nested: KHỚP — FIX ĐÃ LAND

- **Tổng gộp đếm lại từ `analyze-{n,j,p,k}-full.txt` (dòng "GỘP"):**
  n pre-fix nested: bursts **8**, gate **0**, đóng-drift-vượt **7**,
  f4-like **2** (kẹt 1), watch **9**, resync **10** ✓; j pre-fix
  phẳng: bursts **16**, gate **53**, đóng **3**, f4-like **0**,
  watch **18**, resync **16** ✓; p post-fix nested: bursts **37**,
  gate **42**, đóng **1**, f4-like **0**, watch **7**, resync **8**
  ✓; k post-fix phẳng: bursts **45**, gate **87**, đóng **12**,
  f4-like **9** (kẹt 9), watch **12**, resync **24** ✓ — khớp từng
  số với bảng LIMITS §2/§4.
- **Code trên cây gộp:** marker `103E5` **9 dòng** ✓ (E5 ghi ×9),
  `101C3` **12 dòng** ✓; `playheadHold90R2.ts` md5 `00cce1ac` không
  đổi ✓ (không đổi luật lib).
- **Cảnh báo của E5 được ghi nhận nguyên vẹn:** 20 ca f4-like nhãn
  analyzer post-fix phẳng (9 k + 11 r) đều là đóng TRẦN 5000 ms theo
  kiểm tay của E5 — E9 không kiểm tay lại từng ca (ngoài phạm vi
  verify độc lập đợt này), nhưng tổng số 9 k + 11 r khớp file analyze;
  nguyên nhân decoder đóng băng lâu hơn (2,1–3,4 s vs 0,8–1,1 s
  pre-fix) CHƯA xác định — E9 không trích "phẳng f4-like 0/12" mà
  không kèm phân tích này (xem LIMITS gộp §4 mục 5).
- E5 là luồng thứ 2 sửa production đợt này (chỉ `preview.tsx`).

### 2.7 E6 — Blur parity: KHỚP (Fisher tính lại khớp từng chữ)

- **Cap gộp đếm lại từ `analysis103e6.json`:** per-run n = 33+101+
  28+45 = **207** ✓; `d_caps: []` (0 D) ✓; `gap6`: **3 ca** (r33
  fi70 A, r34 fi42 A, r34 fi13 B) ✓; `d_postfix_pooled: {D: 0, n:
  1640, fisher_p: 1.4319849693627308e-09, ci_upper:
  0.001829268292682927}` ✓.
- **Fisher tính lại bằng `math.comb`:** gộp **p = 1,432e-09** (E6 ghi
  1,43e-09 ✓); rule-of-three 95% CI trên 0/1640 = **0,183%** ✓.
- **Blind wk:** `blind_est` wk c1 3129/1861ms, c2 304/303ms ✓ khớp
  LIMITS §4.
- **Ghi chú nhỏ:** E6 §7.5 vẫn liệt kê nợ 2 MiB là "chỉ còn probe ghi
  nội dung byte buffer đầu qtdemux" — bước này **đã được E2 làm xong
  trong chính đợt 103** (LIMITS E6 viết trước khi E2 hạ cánh; tham
  chiếu chéo cũ, không phải lỗi số liệu). Xem LIMITS gộp §4 mục 2.
- E6 không sửa production (chỉ probe + analyzer).

### 2.8 E7 — EPERM probe #22: KHỚP

- **Checklist P8 §2.3 đọc trực tiếp trong
  `eperm-probe-v2.log` (58 dòng, trước lượt 55 dòng — đúng +3):**
  `probe DEAD detected by status (last #21 … age 10848s)`
  05:40:20Z ✓; `boot changed 249407b6 -> 9576eac3 (uptime since
  2026-11-13 05:26:18)` ✓; `probe#22 boot=9576eac3 tmp+ws ok=2
  fail=0` 05:40:24Z ✓; heartbeat `n=22, ts=05:40:24Z, boot
  9576eac3` ✓.
- **Quét writeFileSync:** đọc `scan-meta.txt` của E7:
  `NEWSTD files_with_hits=138 total_lines=443`, `R7B 155/468`,
  `COPIES 17/25` ✓ khớp từng số với LIMITS §2.6; file list trên đĩa
  đếm lại: `wfs-newstd.txt` 138 dòng, `wfs-r7b.txt` 155 dòng,
  `wfs-copies.txt` 17 dòng ✓; đối chiếu chéo 443+25=468 ✓.
- **"Sóng gần nhất ~41h29' trước probe #22"** — tính lại: cuối sóng
  12:11Z 11/11 → 05:40:24Z 13/11 = **41h29'24"** ✓.
- **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN** (lỗ 17'23" 03:57:19Z–
  04:14:42Z có thể chứa 1 reboot trung gian): E9 không có dữ liệu
  mới để thu hẹp lỗ này (journal/wtmp volatile, không syslog) —
  ghi nhận nguyên vẹn lập luận sàn của E7 (§2.3).
- E7 không đụng TTS 39, không thử birefnet, không tự tạo cron ✓
  (không file cron mới nào trong `crons/` của goal).

### 2.9 E8 — Harness: KHỚP (chạy lại 2 script quantify — diff rỗng)

- **D6 recheck — E9 chạy lại độc lập đúng 2 script quantify của D6
  trên cùng dữ liệu:** diff vs `.txt` gốc của D6 = **rỗng cả hai**
  (h + i1–i12) ✓ — "0/24 đuôi đạt tiêu chí ổn định-lệch" nay đã
  được kiểm tra lại độc lập 2 lần (E8 + E9), nợ LIMITS gộp đợt 102
  §4 mục 8 nay ĐÃ ĐÓNG hoàn toàn.
- **Harness md5 trên cây gộp khớp đúng từng chữ với E8 ghi:**
  E1 `4ba1d86c…`, N10 `9ca985cd…` ✓ (không đổi một byte so với D7).
- **O8 đọc lại từ `round103-e8/o8-chromium.log` + `o8.log`:**
  Chromium `21/21 pass, 0 fail, 0 note`, S5 Δx=0,112, S7 mask
  0,112 / bóng 0,113 ✓; WebKit `21/21 pass, 0 fail, 0 note`, S5
  Δx=0,194, S7 mask 0,194 / bóng 0,197 ✓ — khớp từng số với LIMITS
  §5 (và khớp O8 của E9 trên cây gộp cuối, xem §1.3).
- **Ghi chú:** lần chạy O8 Chromium đầu của E8 exit=2 do quên copy
  fixture (lỗi setup harness, E8 tự ghi rõ §5) — đã chạy lại sạch;
  E9 chạy O8 trên cây gộp cuối ngay lần đầu, không dính lỗi này.
- E8 không sửa production, không sửa harness ✓ (chỉ đo + tính lại).

## 3. Va chạm gộp — preview.tsx: 3 luồng cùng sửa, không mất marker

- **File duy nhất bị nhiều luồng sửa:** `apps/web/src/preview.tsx`
  (E3 thử F8 rồi revert + E4 land fix v2 + E5 land nested fix).
  `apps/web/tsconfig.json` chỉ E4 chạm (thêm test mới vào exclude).
  Tất cả file còn lại trong 8 batch đều duy nhất (tổng 21 entry / 20
  file duy nhất đợt 103 — trùng duy nhất là `preview.tsx` trong 2
  batch E4+E5). Không file `.github/workflows/*` nào bị đụng; không
  binary nào vào batch.
- **Trên đĩa lúc đóng băng (md5 `c2251e39`):** marker E3 **×0**
  (revert hoàn toàn, đúng thiết kế) ✓; marker E4 **29 dòng / 40 lần
  xuất hiện** (đủ 6 điểm) ✓; marker E5 **9 dòng** ✓; marker D3
  **14 lần xuất hiện** (khớp D9) ✓; marker C4 **13 lần xuất hiện**
  (khớp D9) ✓; marker C3 **12 dòng** ✓; `previewEngine.ts` md5
  `cd540de9` (không đổi) ✓.
- **Thứ tự sửa (khôi phục từ poll md5):** `ed260e62` (cuối đợt 102)
  → `0209d29c` → `110a51b9` (05:59:24Z) → `03fab95d` (~06:21Z, E5
  land) → `4e954101` (06:28:22Z, E4 land) → `c2251e39` (06:38:03Z,
  E3 revert xong, ổn định từ đó). Cây ổn định từ 06:40Z trở đi (E5
  đo post-fix trên `03fab95d`/`4e954101`, hồi quy cuối trên
  `c2251e39` vẫn xanh — xem §1.2).
- **Thay đổi production có logic mới đợt này (đúng 2):** fix zombie
  tick của E4 (`driftConfirmSkip103E4.ts` mới + gate mở rộng trong
  `preview.tsx`) và fix fail-open nested của E5 (spec phẳng tick
  trước trong `preview.tsx`). E2/E6 chỉ sửa probe/analyzer (không
  thuộc tsc). Mọi luồng khác chỉ đo / probe / test / docs.
- **tsconfig.json (E4):** chỉ thêm `src/lib/driftConfirmSkip103E4.test.ts`
  vào exclude (dòng 46) — theo quy ước repo, tsc web vẫn 0.
- tsc 0 + vite build PASS + toàn bộ suite xanh + O8 21/21 cả 2
  engine sau gộp — không xung đột nội dung. **Không có va chạm nào
  cần khôi phục code** (ghi chú parent — (c)): E3 revert là có chủ
  ý, E4/E5/D3/C4 đều còn nguyên.

## 4. Boot + reboot + RAM trong đợt

- **Reboot #27 lúc 05:26:18Z** (`249407b6 → 9576eac3`) xảy ra TRƯỚC
  lượt — E7 xác minh giờ từng giây bằng `uptime -s`; khoảng cách
  #26→#27 = 3h14'08" (dài nhất từng ghi).
- **Reboot #28 lúc 06:56:44Z** (`9576eac3 → 8c1c5131`) xảy ra GIỮA
  đợt — sau khi 7/8 luồng đã về, giết probe s2 đang chạy của E5 và
  làm gián đoạn runtime + poller E9 (khôi phục 06:58:31Z). Khoảng
  cách #27→#28 = **1h30'26"**. Chu kỳ nay 28 lần / ~58h39' ≈
  **2h06'/lần**. Reboot tiếp theo dự kiến ~09:03Z (dải 08:08–
  10:11Z).
- **RAM khả dụng (MemAvailable):** poll E9: 1603 → 2257 → 3062 →
  2571 → 1820 → 2361 → 1291 → 690 MB (lúc 07:08Z); E7 ghi 5 mẫu
  1050/2535/2447/1314/1083 MB; E5 ghi ~1,2–1,9 GB cuối đợt. Max quan
  sát trong đợt ~3,06 GB, **luôn dưới ngưỡng guard 6 GB** —
  birefnet KHÔNG chạy (đúng quy tắc parent đợt 92). RAM xuống
  ~690 MB lúc E9 đóng băng là thấp nhất đợt — E5 đã gặp WebKit
  "Target crashed" ở RAM ~1,5 GB trong confirm load0 (xem §2.5).
- **preview.tsx đổi 5 lần giữa đợt** (xem §0); ổn định từ 06:38Z.

## 5. Trạng thái nợ sau đợt 103 (cập nhật từ LIMITS gộp đợt 102 §4)

1. **E9 kiểm chứng độc lập + O8 — ĐÃ XONG (luồng này).** 8/8 luồng
   đã về đối chiếu khớp; O8 21/21 cả 2 engine ngay lần đầu trên cây
   gộp cuối (E4+E5 đã land); D6 recheck nay đã được kiểm tra lại độc
   lập 2 lần (E8 + E9 chạy lại 2 script quantify, diff rỗng) — nợ
   LIMITS gộp đợt 102 §4 mục 8 nay ĐÃ ĐÓNG hoàn toàn.
2. **G1 — VẪN MỞ, chờ user quyết metric G5/M2 (có đáp án mới cho
   khung (c)).** Lần yên quyết định đã tới và PASS (E1 run1 G5/M2
   0,91): khung (c) tích lũy nay **24–25/30 = 80,0%–83,3%** — kịch
   bản xấu đúng mốc 80,0% (lần đầu tiên); khung (b) trượt 19/20, (f)
   10/10, (g) hậu-A9 12/12; khung (a) vẫn trần cứng 15/20. Câu hỏi
   mới Q5 của E1 (§7): mốc 80,0% đúng chóc có đủ không, hay cần đệm
   (1 lần yên FAIL nữa kéo kịch bản xấu xuống 24/31 = 77,4%)?
3. **2 MiB — ĐÃ THU HẸP TỚI ADAPTER webkitwebsrc (E2).** Splice nằm
   trong adapter pull của `webkitwebsrc` (trước typefind), không phải
   trong typefind (26/26 pull spliced trùng khớp từng mili-giây);
   luồng byte tái dựng đầy đủ `[0..3179] ++ [2 MiB+3179 .. EOF] ++
   [42821..]`, đoạn sai duy nhất 39.642 byte; đường PUSH sạch
   (2.280 buffer); ức chế bởi TRACE xác nhận lại (nhẹ 10/10 vs
   TRACE 0/4, p=0,0010; gộp p=1,5e-06). Còn mở: VÌ SAO đúng
   2.097.152 (trùng LOW threshold nhưng 0 stop/restart trong 36 run
   gộp) + cơ chế dataReceived/refill nào tạo đoạn sai (catch-22:
   TRACE ghi được thì ức chế bogus — cần shim chặn `dataReceived`
   như E2 đã chặn pull_range, việc của đợt sau).
4. **Ghost residual — F8 KHÔNG LAND (E3).** Relabel bằng anchor tap
   đúng cơ chế khi anchor tươi (78–92% clean) nhưng headline trượt
   bar vì độ phủ anchor thấp (34% → 49,5% clean; 74% → 58,1%;
   97% hậu flip → 89,5%). Đã revert hoàn toàn. Hướng còn đứng: **F8b
   nhãn bằng frame anchor THÔ khi anchor cũ** (CHƯA thử — nhắm đúng
   tập snapshot 25–27% clean) + F6' pixel-verified skipLatest cho
   WebKit (chỉ phác, chưa đo). Quy ước mới từ E3 §3.5: báo PHÂN BỐ
   spread, không báo median đơn độc (median là artifact lưỡng đỉnh).
5. **Zombie pump — KHE EARLY-RETURN ĐÃ ĐÓNG (D3) + ĐƯỜNG TICK ĐÃ
   ĐÓNG (E4, fix v2 đã land).** Gate mở rộng (overCount ≥ 1 mà seek
   không phát): 0 stale tick 0/21 + 0 stale draws 0/46; kill latency
   trực tiếp trung vị 0,10–0,20 ms (nhanh hơn C5 gián tiếp 23–123 ms
   ~100–600×). Nợ mới: gate (b) có thể giữ canvas đóng băng tới trần
   grace 5000 ms nếu playhead không bị giữ (chưa quan sát được);
   chưa có trần skip — cần đo lại từ đầu nếu đặt trần.
6. **Re-arm — fail-open nested ĐÃ ĐÓNG (E5, fix đã land); D6-A vẫn
   bị bác.** Nested: gate 0 → 42/8 lượt, đóng ADV2 khi drift vượt
   7 → 0, f4-like 2 → 0. Phẳng không hồi quy luật (gate 87/12 lượt,
   0 đóng ADV2). **NỢ MỚI: tỉ lệ đóng-trần trên phẳng load4 TĂNG
   MẠNH post-fix** — 20 ca đóng trần kèm resync / 9 lượt load4 (vs
   0/6 pre-fix), tuổi đuôi trung vị phẳng j 2102 ms → k 5013 ms;
   tất cả 20 ca kiểm tay đều là đóng trần (không phải ADV2) nhưng
   nguyên nhân decoder đóng băng lâu hơn (2,1–3,4 s vs 0,8–1,1 s)
   CHƯA xác định (confound: E3 CDP probe + RAM giảm dần + reboot
   #28). **Không trích "phẳng f4-like 0/12"** mà không kèm phân tích
   này. Đợt sau: chạy lại ma trận phẳng load4 trên máy yên (RAM ≥
   2,5 GB, không luồng khác chạy probe song song); nếu vẫn cao thì
   A/B có kiểm soát (tắt E5/E4 bằng cờ hook tạm thời).
7. **Blur parity — D floor post-fix gộp 0/1640 (p=1,43e-09).**
   r7 VẪN MỞ: strip-confirm KHÔNG chốt được nội dung gap 2 (0/13
   xác nhận; 2/13 bác gap 2; 3/13 bác cả hai; 7/13 mơ hồ) + phát
   hiện giới hạn cứng strip 48-bit (chỉ 4 mẫu phân biệt / 90 frame
   — đo pha cuộn, không pin được 1 frame) + đính chính D4 §1.2
   (11 ca A ringSize=3/pool=2 → KHÔNG có pad-clone; 0,449 cũng là
   dự đoán triple liên tiếp khỏe mạnh). B-band: chỉ còn mẫu hình c0
   giàu pair-like hơn c2 (17,1% vs 6,1%, p=0,0042, post-hoc — cần
   kiểm chứng đăng ký trước). Cửa sổ mù wk KHÔNG thu hẹp được (giữ
   nguyên A5; cần lượt blind yên — đang bị cấm trong nhiệm vụ này).
8. **EPERM — probe #22 ok=2 fail=0; khoảng mù #21 CHƯA ĐÓNG HOÀN
   TOÀN** (lỗ 17'23" 03:57:19Z–04:14:42Z có thể chứa đúng 1 reboot
   trung gian — khoảng mù đầu tiên kể từ #8 không đóng được bằng
   lập luận sàn). Tiếp theo: probe #23 + khoảng mù #22 (bắt đầu
   05:40:24Z). **Reboot #28 lúc 06:56:44Z** (giữa đợt 103) — E7
   không quan sát lúc xảy ra (đã về trước đó); E9 ghi giờ từng giây
   từ `uptime -s` + `boot_id` trực tiếp. Giờ từng giây reboot #16
   KHÔNG chốt được (kẹp ~4', chờ parent/user quyết). Cron riêng 10
   phút vẫn chờ user quyết.
9. **Harness — D6 recheck ĐÃ ĐÓNG (E8 + E9); N10 fallback mơ hồ ĐÃ
   TRIỆT.** Còn mở: keydown chậm tự nhiên lọt đúng cửa sổ 2s của
   fallback #1 vẫn chưa quan sát được ngoài đời (22 lần chạy / 638
   toggle tự nhiên, wait chậm nhất 804ms — thấp hơn timeout 5000ms
   tới 6,2 lần); G4 flake lần đầu tiên trong lịch sử G1 (E1 run8,
   9/10 — cần theo dõi, nếu lặp lại thì điều tra thời gian áp
   enhance sau toggle dưới tải); ENOSPC vite (hết inotify watchers
   khi nhiều luồng cùng chạy vite — chạy lại sau khi watcher giải
   phóng, không sửa config).
10. **Birefnet-general trong gói: vẫn 0 lần chạy thành công** (không
    thử đợt này — RAM max quan sát được ~3,06 GB < ngưỡng guard 6
    GB; quyết định parent đợt 92 giữ nguyên).
11. **TTS 39: không kiểm lại đợt này** (lệnh cấm được tuân thủ).
12. **ci-security.yml + ci-build.yml: vẫn 403** (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App). Không file workflow
    nào bị đụng đợt này.
13. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi
    ngang/hơn CapCut thật.

## 6. Batch đã stage (KHÔNG push)

- E9: `phase9-round103-e9-verify.txt` — 1 entry NUL-delimited
  (LIMITS này), read-back OK (xem dưới).
- Đợt 103 (8 luồng): **21 entry / 8 file** (E1 2, E2 4, E3 1, E4 6,
  E5 4, E6 2, E7 1, E8 1) / 20 file duy nhất (trùng duy nhất:
  `preview.tsx` trong 2 batch E4+E5) / 18 file duy nhất mới so với
  trước đợt 103 (`preview.tsx` + `tsconfig.json` đã có trong batch
  trước). Closing đợt 103: 2 entry (LIMITS gộp + gap analysis §32).
- **Tổng chờ push sau đợt 103 (đếm lại trực tiếp từ đĩa, đợt 67–103,
  SAU khi stage E9 + closing): 371 file batch / 2460 entry / 1494
  file duy nhất** (trước E9 + closing: 369/2457/1492 — khớp đúng số
  đếm lại; E9 + closing thêm 2 file batch / 3 entry / 2 file duy
  nhất mới là LIMITS gộp + LIMITS này; gap analysis đã có trong 31
  batch trước nên không thêm file duy nhất). HEAD vẫn 5f548ef8.
  KHÔNG push.

## 7. Ghi chú vận hành cho verify sau

- **Poller E9 đếm đúng 8/8** (glob `e[1-8]` không khớp file closing
  — bài học C9 đã áp dụng đúng; không còn lỗi đếm closing như C9).
  Poller gốc bị gián đoạn bởi runtime restart + reboot #28 lúc
  06:56:44Z (không có kết quả cuối xác nhận); E9 khởi động lại
  poller 06:58:31Z và poll đầu sau restart đã đủ 8/8 — **reboot giữa
  đợt không làm mất batch nào** (file stage trên đĩa còn nguyên).
- **LIMITS trước, paths sau là bình thường:** E8 (06:06Z) có LIMITS
  trước khi stage paths — poller chỉ đếm paths, nhưng verify phải
  đếm cả LIMITS để biết luồng nào đang stage dở.
- **Luồng về muộn sau reboot thì gộp muộn, đừng bỏ:** E5 bị reboot
  giết probe giữa chừng nhưng vẫn về đủ trước poll 07:08Z. Nếu E9
  đóng băng cây lúc 06:50Z (7/8) thì đã bỏ mất fix nested của E5.
- **Fisher một phía phải lấy đúng đuôi** (bài học C9 §7 vẫn đứng):
  E2 ghi đúng cả hai p (0,0010 và 1,5e-06); E9 tính lại khớp từng
  chữ số có nghĩa.
- **Đếm marker phải phân biệt dòng vs lần xuất hiện:** E4 "30 dòng"
  vs E9 đếm 29 dòng / 40 lần xuất hiện; E5 "×9" là 9 dòng (12 lần
  xuất hiện); D3 14 lần xuất hiện = 12 dòng? — không: D3 là 14 lần
  xuất hiện trên 12 dòng (2 dòng chứa 2 marker). Ghi rõ đơn vị đếm
  khi đối chiếu để khỏi báo lệch giả.
- **O8 sau khi fix land mới là O8 có giá trị:** E8 chạy O8 lúc
  05:45–05:49Z trên cây `ed260e62` (trước khi E4/E5 land); E9 chạy
  lại trên cây gộp cuối `c2251e39` và Δx khớp từng chữ — nếu chỉ tin
  O8 của E8 thì chưa chứng minh được 2 fix đợt này không lệch
  mask-track.
- **Sau reboot, VM có thể là image mới thiếu libs:** kiểm tra `ldd`
  MiniBrowser trước mọi probe WebKit; lần này **0 thiếu** (tốt hơn
  D9: 3 thiếu benign).
- **RAM cuối đợt xuống rất thấp (~690 MB lúc 07:08Z):** E5 đã gặp
  WebKit "Target crashed" ở RAM ~1,5 GB. Verify sau nên ghi RAM lúc
  đóng băng; nếu RAM < 1 GB thì cân nhắc đợi hoặc báo rõ môi trường
  yếu.
- **ENOSPC vite (E4/E6):** nhiều luồng cùng chạy vite dev có thể
  cạn inotify watchers (giới hạn 63747, không nâng được) — chạy lại
  sau khi watcher giải phóng, không sửa config/probe.
