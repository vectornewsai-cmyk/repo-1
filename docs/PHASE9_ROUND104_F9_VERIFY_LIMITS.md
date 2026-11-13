# Phase 9 đợt 104 — F9: kiểm chứng độc lập (4/8 về đủ + F5 dở dang; cây gộp xanh, O8 21/21 cả 2 engine)

> Luồng F9, đợt 104, lượt cron 15:35 +07 13/11/2026. KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production. KHÔNG đụng TTS 39, birefnet,
> `.github/workflows/*`.
>
> **Kết quả chung: 4/8 luồng về đủ hoàn toàn (F1, F2, F6, F7 — LIMITS +
> log + batch stage); F5 dở dang (LIMITS + dữ liệu có trên đĩa, §10b
> trống, CHƯA stage); F3, F4, F8 CHẾT do reboot #29 (interrupted,
> không LIMITS, không batch). Cây gộp XANH: tsc 0/0, vite build PASS
> 6,31 s, 27/27 mục suite offline exit 0 ngay lần đầu, test-preview-
> engine.sh 354 assertions, O8 21/21 cả 2 engine ngay lần đầu (Δx khớp
> từng chữ với D7/D9/E8/E9 — code F3 land trong cây KHÔNG làm lệch
> mask-track). Đối chiếu headline: 4/4 luồng về đủ KHỚP + F5 (dở dang)
> KHỚP, với 7 đính chính/ghi chú nhỏ (xem §2 — không đổi kết luận
> nào).** Đây là đợt đầu tiên kể từ đợt 99 mà reboot giết chết luồng
> giữa chừng mà không có ai resume lại (F3/F4/F8 chết 08:57Z, không
> hoạt động đĩa nào sau đó).
>
> **Lưu ý về LIMITS gộp đợt 104 của parent (09:20:43Z):** parent đã gộp
> MỘT PHẦN lúc 09:20Z (chỉ F2/F6/F7 về đủ lúc đó) và stage closing.
> Tài liệu này cập nhật tình hình SAU đó: F1 đã về đủ (LIMITS + batch
> 09:27Z), F5 đã hết chờ (watcher A/B RAM cao kết thúc 09:52:26Z,
> KHÔNG bắt được cửa sổ RAM cao — §10b vẫn trống), F9 kiểm chứng
> xong (27/27 suite + O8 21/21). Tổng chờ push sau F9 (đếm lại từ
> đĩa): **377 batch / 2473 entry / 1506 file duy nhất** (parent ghi
> 375/2470/1503 lúc 09:20Z — thiếu F1 +2 entry/+2 unique, vì F1 stage
> sau đó). Parent cần cập nhật LIMITS gộp §1 (F1, F9) + §5 (tổng) khi
> closing đợt 104; F9 KHÔNG sửa file closing của parent. Đính chính
> thêm: parent ghi mù #22 "chứa đúng 2 reboot" — sai, mù #22 chỉ
> chứa đúng 1 reboot (#28); #29 xảy ra sau khi mù đóng (xem §2.7).

## 0. Dòng thời gian + phương pháp

- **F9 bắt đầu:** 08:39:17Z 13/11 (boot `8c1c5131`, RAM khả dụng 421 MB,
  `preview.tsx` md5 `c2251e39` = cuối đợt 103). Lúc bắt đầu chưa có dấu
  vết đợt 104 nào trên đĩa.
- **Poll đĩa (poller F9, mỗi 10 phút):** 08:39Z **0/8** → 08:49Z **0/8
  paths, 1/8 limits** (F5) → **08:56:39Z REBOOT #29** (`8c1c5131 →
  cff65e89`) giết watcher + poller F9 (khôi phục 08:57:45Z) → 09:07Z
  **2/8** (F2, F7) → 09:17Z **3/8** (+F6) → 09:27Z **4/8** (+F1) →
  09:37–10:47Z **4/8 đứng yên 70 phút** (F5 có LIMITS nhưng không
  stage; F3/F4/F8 không động tĩnh đĩa nào từ 08:57Z) → **10:54:53Z
  REBOOT #30** (`cff65e89 → 287705ad`) SIGTERM watcher F9 (lần 2) +
  giết poller ở poll 11 → F9 kiểm tra `subagent.list` (run
  5100e968): **F3/F4/F8 = interrupted** (chết lúc reboot #29, không
  resume), **F1/F2/F5/F6/F7 = done** — nhưng F5 done mà chưa stage,
  §10b trống. Không còn process F3/F4/F8 nào sống. **F9 ĐÓNG BĂNG
  lúc 10:55:32Z** (quyết định, không phải timeout poller): chờ thêm
  không làm luồng đã chết sống lại — gộp 4 luồng đã xong + F5 dở
  dang, F3/F4/F8/F5-chưa-stage thành nợ đợt 105.
- **Reboot #29:** `uptime -s` = 2026-11-13 08:56:39Z, boot_id
  `cff65e89-0058-4c4e-8ba3-691a3e05b031`. Khoảng cách #28→#29 =
  **1h59'55"** — trong dải quan sát (1h11'36"–3h14'08"). **Reboot
  #30:** 10:54:53Z, boot_id `287705ad-…`, khoảng cách #29→#30 =
  **1h58'14"**. Chu kỳ nay 30 lần / ~62h37' ≈ **2h05'/lần**.
  Reboot tiếp theo dự kiến ~12:59Z (dải 12:06–14:09Z).
- **Không reboot trong lúc verify** (boot `287705ad` suốt từ lúc F9
  đóng băng tới O8 xong 11:07:51Z). Verify offline 10:59:20–
  11:03:20Z; O8 11:06:06–11:07:51Z.
- **Cây gộp đóng băng lúc verify (10:58:59Z):** `preview.tsx`
  `ca378bbfb8d94f6f5196efb8bc2fd0f7` (ổn định từ 08:44:33Z — F3 land
  F8/F8b), `media.ts` `2c384ed13703809d5e999311147745e7` (không đổi từ
  đợt 99), `playheadHold90R2.ts` `00cce1acb343b6b0cd28ca1824eedfcb`
  (không đổi từ đợt 101), `previewEngine.ts`
  `cd540de9c6c58a50fb81cf4a1f085c82` (không đổi từ đợt 101),
  `rvfcClipWindow.ts` `5f5f9aef028da32acd2444016a45ccc1` (D3, đợt
  102), `driftConfirmSkip103E4.ts`
  `2748b6f304354daf979ce90bbe0631bc` (E4, đợt 103),
  `tsconfig.json` `7a79b58cd637748ed89254e78ff172f3` (không đổi từ
  đợt 103). Không còn process luồng F1–F8 nào chạy lúc đóng băng.
  RAM lúc đóng băng 1242 MB.
- **Script verify:** `hidden_files/round104-f9-verify.sh` (dựa trên
  `round103-e9-verify.sh`, cùng 27 mục — đợt 104 không thêm test mới
  nào) + script O8 `round104-f9-o8.sh` (dựa trên `round103-e9-o8.sh`;
  fixtures copy từ `round103-e9/o8-chromium`, md5 khớp E8/D7/C9:
  white `07bc0cb9…`, ball `6df873f7…`, track `cdf9a252…`; WebKit đọc
  fixture từ `round87-o8/headed`, md5 khớp — xem §1.3). Log:
  `round104-f9-suites.log`, `round104-f9-o8.log`, poll log
  `round104-f9/poll.log`, recounts `round104-f9/recounts.log`.
- **`preview.tsx` đổi 1 lần giữa đợt:** `c2251e39` (cuối đợt 103) →
  `ca378bbf` (08:44:33Z, F3 land F8/F8b, +11 KB) — ổn định từ đó.
  Không luồng nào khác sửa production.

## 1. Kiểm chứng trên cây gộp

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 6,31 s** |

### 1.2 Suite offline (log `hidden_files/round104-f9-suites.log`)

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
0 dòng "not ok" trong toàn bộ log. Verify chạy trên boot `287705ad`
(sau reboot #30); không reboot trong lúc verify.

### 1.3 O8 — 21/21 cả 2 engine, ngay lần đầu (log `hidden_files/round104-f9-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium | 11:06:06–11:07:01Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |
| WebKit | 11:07:01–11:07:51Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |

Số Δx khớp **đúng từng chữ** với O8 của D7/D9/E8/E9 trên các cây
trước — code F3 land đợt này (relabel snapshot bằng anchor, đụng
`preview.tsx` + cả hai đường tick/pump) **không làm lệch mask-track**.
E0: 0 lỗi JS/pageerror/crash cả 2 engine. Cả 2 leg exit=0 ngay lần đầu
(tổng ~105 giây); 0 dòng "retry" trong log O8; fixtures đã copy trước
(md5 khớp) và WebKit launch qua Playwright bình thường (version
27.2). Ghi chú: `ldd` thô trên `minibrowser-gtk/bin/MiniBrowser`
hiện 4 lib "not found" (libwebkitgtk, libjavascriptcoregtk,
libbacktrace, libjxl) — ĐÓ KHÔNG PHẢI đường launch thật (O8 WebKit
dùng Playwright `webkit.launch`, đã chạy tốt; F5 đợt này cũng xác
minh `ldd` với đúng `LD_LIBRARY_PATH` của probe cho 0 thiếu).
Không chạy lại O8 của F8 (F8 chết trước khi chạy O8) — O8 của F9
trên cây gộp cuối thay thế.

## 2. Đối chiếu từng luồng — số headline KHỚP (7 đính chính/ghi chú nhỏ, không đổi kết luận)

### 2.1 F1 — G1 evidence 13: KHỚP

- **Pool v14** (`benchmarks/results/g1-evidence-v14-104f1.json`, đọc
  trực tiếp): pool30 **n=109, PASS 100** ✓; pool60 **n=69, PASS
  66** ✓; chân yên 30fps (trừ hỗn hợp) **n=32, PASS 28, G5 median
  0,940** ✓; chân yên 60fps **n=26, PASS 26** ✓.
- **2 lần yên quyết định:** f1_e1 run8: baseline **21,87 fps**,
  G5 **0,91**, M2 **0,94**, mode "yên" ✓; run9: baseline **27,39**,
  G5 **0,90**, M2 **0,92** ✓ — đúng như LIMITS §1/§3.1.
- **Khung M2** (`m2-quiet104f1.json`, đọc trực tiếp):
  `first20_m2_max = 15` ✓ (khung (a) trần cứng); `last20_m2_max =
  19` ✓ (khung (b)); `last10_m2_max = 10` ✓ (khung (f));
  `quiet30_m2_range = [26, 27, 32]` ✓ (khung (c) 26–27/32, kịch bản
  xấu 26/32 = 81,25%); `post_a9_m2` len **14** ✓ (khung (g));
  `near_boundary_runs` len **0** ✓ (khung (h) không kiểm được);
  `flips_total = 6`, `agree = 140`, `n_runs_m2 = 146 → 140/146 =
  95,9%` ✓; `quiet60_m2` len **26** ✓; `flagged_quiet` = [A7-7,
  D8-3] ✓.
- **G4 flake #2 xác minh độc lập:** `e1-run2-run.log` ghi `FAIL G4
  đối chứng progressive: R=0.48 …, deinterlaceTap=false,
  applied=[]` ✓ — khớp từng chữ F1 §3.5.
- **Đính chính nhỏ (ghi chú, không đổi kết luận):** F1 §3.6 ghi
  pause **837ms** (run3 slot 5) là "chậm nhất từng quan sát trong
  lịch sử G1" — **đã bị vượt ngay trong đợt này:** F8 E1 run2
  (08:48–08:54Z) có **playWait max = 1004ms** (`round104-f8/run-f8.log`).
  Kỷ lục wait chậm nhất nay là **1004ms (play)**, vẫn dưới cửa sổ
  2s của fallback #1 — keydown chậm tự nhiên vẫn chưa lọt cửa sổ.
  F1 viết LIMITS trước khi thấy số của F8; không phải lỗi số liệu
  của F1.
- F1 không sửa production, không tự đóng G1 ✓.

### 2.2 F2 — 2 MiB refill: KHỚP (chạy lại analyzer trên cả 12 pull log + Fisher tính lại)

- **Đếm lại toàn bộ 12 pull log bằng chính script `analyze-f2.py`
  của F2:** run1 YES(6) / run2 NO(0) / run3 YES(6) / run4 YES(4) /
  run5 YES(6) / run6 YES(2) / run7 YES(6) / run8 YES(6) / run9
  YES(4) / run10 YES(2) / run11 YES(2) / run12 YES(6) — "YES" ở
  đây là verdict của analyzer (≥1 pull spliced).
- **Định nghĩa bogus của F2 là first-atom (pull đầu off=0 bị
  splice), không phải any-splice:** theo định nghĩa đó, run9
  KHÔNG tính là bogus (4 pull spliced của run9 đều ở req_off
  3179/41666 trên qtdemux0 — header đúng + sample-data splice,
  cùng mẫu E2W-run2). Đếm theo first-atom: **10/12 run bogus, 12
  bogus atom** (run4: 2 atom; các run khác 1 atom) ✓ khớp F2 §2.
  Theo định nghĩa any-splice thì là **11/12** (chỉ run2 sạch) —
  con số này MẠNH HƠN chứ không yếu hơn kết luận "shim không ức
  chế bogus" của F2.
- **Đính chính nhỏ 1:** F2 ghi "atom-1 9/12 run" — đếm lại đúng là
  **10/12 run** (run4: 2 atom + 9 run khác × 1 atom = 12 atom trên
  10 run). F2 cộng nhầm ở câu này; các số khác (10/12 run, 12
  atom) đều đúng.
- **Đính chính nhỏ 2 — Fisher:** F2 ghi p≈0,48 cho F2 (10/12) vs
  E2 nhẹ (10/10). Tính lại bằng `math.comb`: **một phía p =
  0,2857; hai phía p = 0,4805**. Số 0,48 của F2 là **hai phía**;
  theo quy ước một phía của E2/E6 thì p = 0,286. Cả hai đều "không
  có ý nghĩa" — kết luận không đổi. (Biến thể any-splice 11/12 vs
  10/10: một phía p = 0,5455, hai phía p = 1,0 — cũng không có ý
  nghĩa.)
- **Refill run7 đếm lại từ `f2-run7-analysis-v2.txt`:** adapter
  `f0ace0` pushed=5.355.119, taken=4.249.573, discontinuities=0;
  PUSH#4 ms=9978 size=1.075.013 file_off=1064960 (R5) ✓; adapter
  `be1d90` pushed=4.838.093, taken=2.963.429, discontinuities=0;
  PUSH#4 ms=10595 size=1.627.973 file_off=512000 (R6) ✓; pull
  splice ms=10076 (off=0) / ms=10680 (3179) / ms=10686 (41666) ✓;
  typefind adapter 4096 B (1 push/map/take mỗi instance) ✓.
- **Đính chính nhỏ 3 — "0 Range/seek tới 2097152":** đúng cho
  **Range request** (chỉ run4 có `Range: bytes=2097152-` +
  `requestedPosition=2097152`, 1 file GST duy nhất) ✓; nhưng
  **DoSeek segment bắt đầu ở 2097152** còn xuất hiện ở run6 và
  run7 (seek nội bộ trong dữ liệu đã fetch, không phải Range mới).
  Cách viết "Range/seek" ở F2 §2 là chưa chính xác — con số 2 MiB
  xuất hiện như seek target nội bộ ở 3/12 run, không chỉ run4.
  Không đổi kết luận (seek này KHÔNG phải điều kiện cần của bogus;
  run4 vẫn bogus dạng atom-1 như các run khác).
- **0 stop/restart thật** trong 12 log GST ✓ (grep 0 dòng).
- F2 không sửa production (chỉ shim + probe + analyzer); binary
  `.so` không vào batch ✓.

### 2.3 F3 — Ghost F8b: KHÔNG CÓ LIMITS — code đã land mà chưa có verdict (xem §3)

- F3 **interrupted** (chết lúc reboot #29, không resume). Không
  LIMITS, không batch, không phân tích đầu ra.
- Nhưng **code F3 ĐÃ LAND trong cây gộp** (xem §3 — production đổi
  duy nhất đợt này): marker `104f3` **50 dòng / 58 lần xuất hiện**
  trong `preview.tsx` (F5 ghi "54 marker" — chênh do cách đếm;
  F9 đếm bằng `grep -c` dòng / `grep -o` lần xuất hiện). Tap +
  relabel **BẬT MẶC ĐỊNH** (chỉ tắt khi window flag
  `__vcut104f3PresentedTap` / `__vcut104f3Relabel` === false, hoặc
  tap tắt khi `rvfcSilentEngine`); ngưỡng tươi 50ms
  (`F3_ANCHOR_FRESH_MS`); F8b rawAnchor khi anchor cũ; relabel
  trên cả hai đường tick (dòng 1523) và pump (dòng 1983).
- **Dữ liệu còn lại trên đĩa:** run-a (tapoff/relabeloff) có JSON
  1.085.270 B + log (08:54:50Z); run-b (tapon/relabelon) CHỈ có
  log 4.900 B (08:57:05Z, play pass 1–6 có dbg) — **không có JSON
  kết quả, không có file phân tích đầu ra** (chỉ có script
  `analyze-f3*.py`, chưa từng chạy ra output). Không thể đối chiếu
  headline clean% nào của F3 — F3 chưa từng viết headline.
- **Bằng chứng hồi quy từ F9 (thay cho verdict còn thiếu):** tsc 0,
  vite build PASS, 27/27 suite xanh (ghostBlend 15/15,
  previewEngine 18+27), O8 21/21 cả 2 engine với Δx khớp từng chữ
  các đợt trước — code F3 không làm lệch mask-track, không làm vỡ
  cây. Nhưng **không có bằng chứng nào rằng F8b ĐẠT bar** (clean
  ≥70% + hơn baseline ≥20 điểm trên case B) — bar đó chưa từng
  được đo xong. **Quyết định giữ hay revert code F3 thuộc parent**
  (revert được bằng grep marker `104f3`, như chính F3 đã ghi trong
  code); đợt 105 phải đo lại F8b từ đầu (run-b chưa có JSON).
- F3 là luồng duy nhất sửa production đợt này.

### 2.4 F4 — Zombie gate (b): KHÔNG CÓ LIMITS — dữ liệu thô còn lại, chưa có diễn giải

- F4 **interrupted** (chết lúc reboot #29, không resume). Không
  LIMITS, không batch. Probe script `probe104f4-frame-parity.mjs`
  còn trên đĩa (chưa stage).
- **Dữ liệu thô F4 để lại (chưa có diễn giải của F4 — F9 chỉ trích
  số, không kết luận thay):** `drawsgap-all.txt` (phân tích lại
  các lượt cũ + 2 lượt mới f4y1/f4y2 trên cây `ca378bbf`):
  gaps với gate-(b) skip + playhead tiến (dph>0,30s):
  **e4y1: 10, e4y2: 0, f4y1: 28, f4y2: 24**; GOP gaps=267,
  unheld_with_skips=62, **max_unheld_gap=4326ms**. Tức là trường
  hợp xấu mà F4 đi điều tra (gate (b) giữ canvas đóng băng trong
  khi playhead vẫn tiến) **ĐÃ XUẤT HIỆN trong dữ liệu phân tích
  lại** (vd f4y2 gap 4326ms rel 107486..111812, dph=0,46s) —
  nhưng F4 chưa viết verdict (có phải "đóng băng tới trần grace"
  thật không, có cần trần skip không).
- Đối chứng trong cùng dữ liệu: `freeze-f4y2.txt` (lượt mới f4y2):
  13 real freeze, **0 với playhead tiến**, max 321ms — trong lượt
  đo trực tiếp mới thì trường hợp xấu KHÔNG xuất hiện. Hai mặt
  dữ liệu này mâu thuẫn bề ngoài và cần F4 (đợt 105) diễn giải:
  phân tích lại lượt cũ vs đo trực tiếp lượt mới đo khác nhau ở
  đâu (định nghĩa "freeze" của freeze.py vs "gap" của drawsgap.py).
- F4 không sửa production.

### 2.5 F5 — Re-arm: KHỚP (dở dang — LIMITS có, §10b trống, chưa stage)

- **Tái hiện 20 ca đếm lại từ `cap-pattern-rows.json` (29 dòng,
  đọc trực tiếp):** j **0 CAP/6 lượt**, k **9/6**, r **11/4**, f
  **14/5** ✓; tuổi CAP f 5004–5271ms ✓; 1 ca CAP "lành" f1
  (tuổi 5271, drift −0,27, adv=1, không resync) ✓; nested p2/p6
  mỗi 1 CAP lành ✓.
- **Freeze-trong-đuôi-mở trung vị đếm lại:** j **1179ms**, k
  **4847ms**, r **4901ms**, f **4900ms** ✓ khớp F5 §3/§8.
- **Đính chính nhỏ:** F5 ghi "RAM < 2173 MB ⇒ luôn có CAP: 29
  CAP / 11 lượt (k2, k4, k8, r3, r5, r8, f1–f5); RAM ≥ 2173 MB:
  5 CAP / 10 lượt (k3, k5, r2 là 3 ngoại lệ)". Đếm lại từ JSON +
  xác nhận RAM r2 từ `round103-e5/confirm-r2.log` (MemAvailable
  **2169 MB** lúc bắt đầu): **r2 thuộc nhóm < 2173, không phải
  ≥ 2173**. Số đúng: **< 2173: 12 lượt / 30 CAP; ≥ 2173: 9 lượt /
  4 CAP; ngoại lệ nay chỉ k3, k5**. Kết luận RAM mạnh hơn (12/12
  lượt < 2173 đều có ≥1 CAP), không đổi hướng.
- **Kết quả đo live máy yên KHỚP:** f 14 CAP / 5 lượt = 2,80
  CAP/lượt, rate trung vị 0,110×, freeze 4900ms, RAM bắt đầu
  1464–2015 MB ✓; giả thuyết "tải song song" bị bác (f4 load
  1,16 → 4 CAP; f5 load 0,62 → 3 CAP) ✓; gate C3 đúng luật (0
  đóng ADV2 khi drift vượt) ✓.
- **A/B RAM cao KHÔNG chạy được — kết quả đã định đoạt, F5 chưa
  ghi:** watcher `wait-hiram.sh` kết thúc 09:52:26Z với **"NO
  HIRAM WINDOW in ~37 min"** (50 lần check, RAM 482–694 MB, load
  ~0, không sibling probe nào) — không bắt được cửa sổ RAM ≥
  2400 MB trong ~37 phút. Theo tiêu chí F5 §10, đây là nhánh thứ
  ba ("không bắt được cửa sổ → nợ VẪN MỞ với RAM là nghi phạm số
  1 chưa được kiểm ở mức cao"). F5 đã done mà không điền §10b,
  không stage batch — 2 file của F5 (`docs/PHASE9_ROUND104_F5_REARM_LIMITS.md`
  + `apps/web/scripts/probe104f5.mjs`) đang nằm trên đĩa mà chưa
  có trong batch nào; parent quyết resume F5 hay stage trong
  closing.
- F5 không sửa production ✓ (chỉ thêm probe script).

### 2.6 F6 — Blur parity: KHỚP (Fisher + timing + strip tính lại)

- **D floor gộp đếm lại:** 867+566+207+127 = **1767** ✓; Fisher
  một phía tính lại bằng `math.comb`: **p = 4,7729e-10** (F6 ghi
  4,77e-10 ✓); rule-of-three 95% CI trên = **0,170%** ✓. Caps
  mới đếm lại từ `analysis104f6.txt`: 21+45+34+27 = **127**, D=0
  ✓; pool=1 F6: n=13, A 5 / B 6 / C 2 ✓.
- **Timing r7 đếm lại từ `timing104f6.txt`:** B content gaps
  **[3, 5, 6, 6, 7], median 6,0** ✓; "bar (a) ≥1 ca A content gap
  2: KHÔNG ĐẠT" ✓ (0/13 ca A). Ghi chú: file timing ghi "trong
  {5,6,7}: 4/5" (4/5 ca B đo được), LIMITS ghi bar (b) là "≥4/7" —
  cùng tử số, khác mẫu số trình bày (bar tính trên 7 ca B đăng ký,
  file tính trên 5 ca đo được); cả hai đều cho kết luận "ĐẠT".
- **B-band c0 đếm lại từ `bband104f6-prereg.txt`:** c0 0/5, c1
  1/20, c2 1/13 ✓; Fisher một phía (greater, quy ước scipy)
  **p=1,0** ✓ (F9 tính tay: với biên cố định, p một phía
  "greater" = 1,0 vì OR quan sát = 0 là nhỏ nhất); CI Newcombe
  [−33,3pp, +36,2pp] ✓; power 15% ✓. Kết luận "KHÔNG ĐỦ BẰNG
  CHỨNG" đứng.
- **Strip feasibility đếm lại từ `strip104f6-feasibility.txt`:**
  k=4 MAD<1 **28/86**, k=5 **71/85** ✓ khớp §1.1.
- F6 không sửa production (chỉ probe script + LIMITS); probe
  **TẮT F3 tap+relabel** cho baseline (cùng chế độ nhãn với
  C4/D4/E6 — ghi rõ để đợt sau không gộp nhầm mẫu F3-bật vào)
  ✓.

### 2.7 F7 — EPERM probe #23: KHỚP (log + scan + heartbeat đọc trực tiếp)

- **Checklist P8 §2.3 đọc trực tiếp trong
  `eperm-probe-v2.log` (61 dòng, trước lượt 58 dòng — đúng +3):**
  `probe DEAD detected by status (last #22 … age 10716s)`
  08:39:00Z ✓; `boot changed 9576eac3 -> 8c1c5131 (uptime since
  2026-11-13 06:56:44)` ✓; `probe#23 boot=8c1c5131 tmp+ws ok=2
  fail=0` 08:39:02Z ✓; heartbeat `n=23, ts=08:39:02Z, boot
  8c1c5131` ✓.
- **Quét writeFileSync đọc trực tiếp `scan-meta.txt`:**
  `NEWSTD files_with_hits=142 total_lines=455`, `R7B 160/486`,
  `COPIES 17/25` ✓ khớp từng số với LIMITS §2.6; đối chiếu chéo
  455+25+6 (race file `probe104f4-frame-parity.mjs:6` trong
  R7B, vắng trong NEWSTD) = 486 ✓ — lần thứ mười liên tiếp chênh
  0 sau khi tính race.
- **Async writeFile đếm lại:** đúng **2 vị trí**
  (`eperm-retry.mjs:71`, `epermRetry.js:116`), cả hai trong hàm
  `writeFileEpermRetryAsync` ✓ — đính chính E7 §2.6 ("0 async")
  là đúng (sai số đếm của E7, không phải code mới).
- **"Sóng EPERM đã tắt" đếm lại:** E5 57 + E8 O8 2 +
  round103-e9-o8.log 2 = **61 dòng / 17 file** ✓ khớp F7 §2.5;
  0 dòng "vẫn bật", 0 "Operation not permitted" thật ✓.
- **Mù #22 đóng hoàn toàn — các đầu vào kiểm được:** đoạn trước
  #28 = 05:40:24Z → 06:56:44Z = **1h16'20" = 4580s < 2 × sàn
  8592s** ✓ (công thức sàn của F7); bản ghi cuối 06:56:06Z
  (probe-error.txt của E5) chỉ cách #28 **38 giây** ✓; giờ #28
  06:56:44Z khớp đo trực tiếp của F9 (uptime -s + boot_id lúc
  08:39Z). F9 không chạy lại toàn bộ lập luận kẹp mù, nhưng các
  mốc giờ then chốt đều khớp với bản ghi độc lập (E9 đợt 103 +
  quan sát của F9).
- **Đính chính LIMITS gộp parent §1 F7 (không phải lỗi của F7):**
  parent ghi mù #22 "chứa đúng 2 reboot" — **sai: mù #22 chỉ
  chứa đúng 1 reboot (#28, 06:56:44Z)**; #27 (05:26:18Z) xảy ra
  TRƯỚC khi mù bắt đầu (05:40:24Z), #29 (08:56:39Z) xảy ra SAU
  khi mù đóng (08:39:02Z). F7 ghi đúng ("Reboot duy nhất trong mù
  là #28").
- **Reboot #29 trong lượt F7:** 08:56:39Z (F9 xác minh độc lập
  bằng `uptime -s` + boot_id: `cff65e89`) ✓ khớp F7 §4.
- F7 không đụng TTS 39, không thử birefnet, không tự tạo cron ✓.

### 2.8 F8 — Harness: KHÔNG CÓ LIMITS — dữ liệu thô còn lại, chưa có diễn giải

- F8 **interrupted** (chết lúc reboot #29, không resume). Không
  LIMITS, không batch, **không chạy O8** (O8 của F9 thay thế, xem
  §1.3).
- **Dữ liệu thô còn lại (`round104-f8/run-f8.log`):** N10 thường
  ×2 xong (slots 11, pass 4/4, playWait max 400/284ms); E1 ×2
  xong (pass 10/10, G4 PASS cả hai — run1 g5=None, run2 g5=0,87);
  E1 run3 bị reboot #29 giết ở bước G7a (log dừng 08:57:05Z, G7a
  PASS R 0,67 → 0,51). 0 retry, 0 fallback trong toàn bộ 4 lần
  chạy xong.
- **Ghi chú mới cho nợ harness:** E1 run2 của F8 có **playWait
  max = 1004ms** — vượt kỷ lục 837ms của F1 (xem §2.1) và là lần
  gần nhất từng quan sát với cửa sổ 2s của fallback #1 (còn cách
  ~1s). Keydown chậm tự nhiên vẫn chưa lọt cửa sổ — nợ vẫn mở.
- F8 không sửa production, không sửa harness ✓ (harness md5
  `4ba1d86c` / `9ca985cd` không đổi trong log F8).

## 3. Va chạm gộp — preview.tsx: chỉ F3 sửa, không mất marker

- **File duy nhất bị sửa trong đợt:** `apps/web/src/preview.tsx`
  (F3 land F8/F8b; không luồng nào khác chạm production). Tất cả
  file còn lại trong 4 batch đã stage đều duy nhất (tổng đợt 104
  tới lúc F9 stage: 5 file batch / 12 entry / 12 file duy nhất
  trong đợt — xem §6; trùng duy nhất trong toàn bộ đợt là
  `PHASE9_GAP_ANALYSIS.md` (đã có trong 29 batch trước đó — 30 kể
  cả closing đợt 104).
  Không file `.github/workflows/*` nào bị đụng; không binary nào
  vào batch.
- **Trên đĩa lúc đóng băng (md5 `ca378bbf`):** marker F3 `104f3`
  **50 dòng / 58 lần xuất hiện** (mới, đợt này) ✓; marker E4
  `103E4` **21 dòng / 23 lần xuất hiện** (khớp đúng E9: `103E4`
  ×23) ✓; `driftConfirmSkip` ×6 ✓; marker E5 `103E5` **9 dòng /
  12 lần xuất hiện** (E9: 9 dòng) ✓; marker C3 `101C3` **12 dòng
  / 13 lần xuất hiện** (E9: 12 dòng) ✓; marker D3 `102d3` **3 dòng
  / 5 lần xuất hiện** (E9: `102d3` ×5) ✓; marker C4
  `paddedGhosts` **5 dòng / 6 lần xuất hiện** (E9: ×6) ✓.
  `previewEngine.ts` md5 `cd540de9` (không đổi) ✓;
  `playheadHold90R2.ts` md5 `00cce1ac` (không đổi) ✓.
- **Thay đổi production có logic mới đợt này (đúng 1):** F8/F8b
  relabel snapshot của F3 (tap rVFC độc lập + relabel bằng anchor
  trình chiếu + fallback rawAnchor, ngưỡng tươi 50ms, BẬT MẶC
  ĐỊNH). Không có luồng nào khác sửa production.
- **Vấn đề mở duy nhất của cây gộp:** code F3 chưa có verdict theo
  bar đăng ký trước (xem §2.3) — parent quyết giữ hay revert
  (revert bằng grep marker `104f3`). F9 KHÔNG tự revert (không
  phải việc của verify) và KHÔNG sửa lặng lẽ gì trong cây.

## 4. Boot + reboot + RAM trong đợt

- **Reboot #29 lúc 08:56:39Z** (`8c1c5131 → cff65e89`) xảy ra GIỮA
  đợt — giết 3 luồng F3/F4/F8 (interrupted, không resume) + giết
  run5 của F1 (đã chạy lại) + giết driver lần 1 của F5 (08:57:46Z,
  fail toàn bộ 6 lượt do `libevent-2.1.so.7` trong cửa sổ boot+1–2
  phút — xem F5 §7) + giết watcher/poller F9 (đã khởi động lại). Khoảng cách #28→#29 = **1h59'55"**. Đây là lần
  đầu tiên reboot giết chết luồng mà không ai resume lại (đợt
  103: E5 tự hồi phục sau reboot; đợt 104: F3/F4/F8 không hồi
  phục — bài học: parent cần resume luồng interrupted sau reboot,
  hoặc verify phải đóng băng đúng lúc như F9 đã làm).
- **Reboot #30 lúc 10:54:53Z** (`cff65e89 → 287705ad`) xảy ra
  GIỮA đợt — SIGTERM watcher F9 (lần 2) + giết poller ở poll 11.
  Khoảng cách #29→#30 = **1h58'14"**. Chu kỳ nay 30 lần / ~62h37'
  ≈ **2h05'/lần**. Reboot tiếp theo dự kiến ~12:59Z (dải
  12:06–14:09Z).
- **RAM khả dụng (MemAvailable):** poll F9: 421 → 946 → 883 →
  2314 → 720 → 556 → 505 → 594 → 752 → 555 → 543 → 819 → 560 MB
  (lúc 10:47Z); F7 ghi 5 mẫu 395/430/2100/1590/1660 MB; F1 ghi
  426–2951 MB trong cửa sổ đo. Max quan sát trong đợt ~2,95 GB,
  **luôn dưới ngưỡng guard 6 GB** — birefnet KHÔNG chạy (đúng quy
  tắc parent đợt 92). RAM lúc F9 đóng băng 1242 MB.
- **preview.tsx đổi 1 lần giữa đợt** (xem §0); ổn định từ
  08:44:33Z.

## 5. Trạng thái nợ sau đợt 104 (cập nhật từ LIMITS gộp đợt 103 §4 + closing parent 09:20Z §4)

1. **F9 kiểm chứng độc lập + O8 — ĐÃ XONG (luồng này).** 4/8 luồng
   về đủ đối chiếu khớp (+ F5 dở dang khớp); O8 21/21 cả 2 engine
   ngay lần đầu trên cây gộp cuối (đã có code F3). Đợt 105 không
   cần chạy lại O8 trừ khi cây đổi.
2. **G1 — VẪN MỞ, chờ user quyết metric G5/M2 (có đáp án mới cho
   Q5).** F1 đo được 2 lần yên PASS (run8/run9): khung (c) tích lũy
   nay **26–27/32 = 81,2%–84,4%** — kịch bản xấu 81,25%, **VƯỢT
   mốc 80,0% với đệm +1,25 điểm** (lần đầu tiên vượt mốc ngay cả
   kịch bản xấu). Câu hỏi Q5 cập nhật của F1 (§7): đệm +1,25đ có
   đủ không (a) chấp nhận 81,25% là đủ đệm, (b) chờ thêm 2 lần yên
   PASS nữa để chịu được 1 FAIL (28/34 → 28/35 = 80,0%), hay (c)
   coi khung (c) vẫn chưa khép. Khung (b) 19/20, (f) 10/10, (g)
   14/14 đều đã đạt; khung (a) vẫn trần cứng 15/20. G4 flake lần
   thứ 2 (F1 run2, 9/10) — tỉ lệ 2/18 lần E1 trong 2 đợt gần nhất
   đã đủ cao để luồng harness đợt sau điều tra thời gian áp
   enhance sau toggle dưới tải (không chỉ "theo dõi").
3. **2 MiB — refill tạo đoạn sai ĐÃ XÁC ĐỊNH (F2).** dataReceived
   của Range CUỐI CÙNG trước pull đầu (R5/R6) đẩy toàn bộ response
   vào adapter, create() rút thành chunk 4096 B trong phase scan;
   adapter webkitwebsrc VÔ TỘI ở thời điểm pull (0 discontinuity,
   FIFO rỗng lúc pull); đoạn sai nằm trong cache push-phase nội bộ
   của typefind; adapter typefind chỉ giữ 4096 B đầu. Shim không
   ức chế bogus (10/12 first-atom; 11/12 any-splice; Fisher không
   có ý nghĩa). Còn mở: VÌ SAO đúng 2.097.152 (run4 có Range thật
   tới 2097152 lần đầu trong 48 run gộp; DoSeek tới 2097152 còn ở
   run6/run7 — xem §2.2) + cơ chế nào trong typefind đặt vị trí
   đọc ahead đúng 2 MiB (cần đếm byte typefind forward downstream
   trong phase scan và/hoặc soi cache nội bộ typefind).
4. **Ghost residual — F8b CHƯA CÓ VERDICT (F3 chết giữa chừng).**
   Code F8/F8b đã land trong cây, BẬT MẶC ĐỊNH, chưa đo xong bar
   (run-b không có JSON). Parent quyết giữ hay revert (grep marker
   `104f3`). Đợt 105: đo lại F8b từ đầu (cần JSON run-b + phân
   tích clean% theo bar đăng ký trước); F6 tắt F3 khi đo baseline
   — đợt sau kiểm tra md5 + chế độ F3 trước khi gộp mẫu. Hướng
   F6' pixel-verified skipLatest cho WebKit vẫn chỉ phác. Quy ước
   mới: báo PHÂN BỐ spread, không báo median (E3 §3.5).
5. **Zombie pump — gate (b) CÓ DẤU HIỆU XẤU TRONG DỮ LIỆU PHÂN
   TÍCH LẠI (F4 chết, chưa diễn giải).** Khe early-return (D3) +
   đường tick vẽ (E4) ĐÃ ĐÓNG (xác minh lại: driftConfirmSkip
   12/12, E4 marker còn nguyên). Nợ mới từ dữ liệu thô F4:
   **62 gap gate-(b) skip + playhead tiến** trong phân tích lại
   4 lượt (e4y1 10, f4y1 28, f4y2 24; max 4326ms) — nhưng lượt đo
   trực tiếp mới f4y2 (freeze.py) cho 0 gap loại này (13 freeze,
   max 321ms). Đợt 105 (F4 kế tiếp) phải diễn giải mâu thuẫn này
   trước khi quyết có cần trần skip không. Chưa có trần skip.
6. **Re-arm — fail-open nested ĐÃ ĐÓNG (E5); D6-A vẫn bị bác;
   ĐÓNG-TRẦN phẳng load4 VẪN MỞ (F5 dở dang).** Máy yên KHÔNG làm
   giảm CAP (14 CAP / 5 lượt = 2,80/lượt, freeze 4900ms) — giả
   thuyết tải song song BỊ BÁC. RAM vẫn là nghi phạm số 1 (đính
   chính §2.5: <2173 MB: 12/12 lượt có CAP, 30 CAP; ≥2173 MB: 4
   CAP / 9 lượt, ngoại lệ chỉ k3/k5) nhưng **CHƯA ĐƯỢC KIỂM ở mức
   cao** — watcher A/B RAM cao kết thúc không bắt được cửa sổ
   (NO HIRAM WINDOW ~37 phút). E4 fix vẫn là nghi phạm chưa loại
   được (confound hoàn hảo); E3 CDP là confound thứ ba. Đợt 105:
   bắt cửa sổ RAM cao (thường ngay sau reboot) để chạy f6r/f7; nếu
   vẫn cao thì A/B tắt E4. **Không trích "phẳng f4-like 0/12"** mà
   không kèm phân tích này. F5 chưa stage — 2 file F5 đang chờ
   parent quyết (resume F5 để điền §10b + stage, hoặc stage trong
   closing).
7. **Blur parity — r7 VẪN MỞ, nhưng "nội dung gap 2" đã bị bác
   trên mọi trục đo được (F6).** Strip dài hơn bị bác offline
   (stimulus tuần hoàn ~5 frame, chỉ 4 mẫu phân biệt / 90 frame);
   timing đăng ký trước: 0/13 ca A content gap 2, 8/10 ca rVFC
   content gap đúng 6; hiệu chuẩn 520 capture: 0 ca lệch 4 frame.
   D floor post-fix gộp **0/1767** (CI trên 0,170% — đã đạt mục
   tiêu < 0,183%). B-band c0: kiểm chứng đăng ký trước KHÔNG ĐỦ
   BẰNG CHỨNG (p=1,0, power 15% — cần ~100 B-cap/nhóm, 6–8 lượt
   yên). Cửa sổ mù wk KHÔNG thu hẹp được (giữ nguyên A5; cần lượt
   blind yên — đang bị cấm). Dị thường fi48 (presented overshoot
   −6 + blend (48,48,48) mà g=0,435) chưa giải thích được. Bước
   quyết định đề xuất: **stimulus không tuần hoàn** (video test
   mới, mỗi frame nhận diện duy nhất).
8. **EPERM — mù #22 ĐÃ ĐÓNG HOÀN TOÀN (F7); mù #23 mở từ
   08:39:02Z (đã chứa reboot #29, #30).** Probe #24 + khoảng mù
   #23 (bắt đầu 08:39:02Z) là việc của đợt 105. Khoảng mù #21
   CHƯA ĐÓNG HOÀN TOÀN (lỗ 17'23" có thể chứa 1 reboot trung gian
   — parent/user quyết mức đóng); giờ từng giây reboot #16 KHÔNG
   chốt được (kẹp ~4', chờ parent/user quyết); cron riêng 10 phút
   vẫn chờ user quyết. **Đính chính closing parent:** mù #22 chỉ
   chứa 1 reboot (#28), không phải 2 (xem §2.7).
9. **Harness — keydown chậm tự nhiên VẪN CHƯA lọt cửa sổ 2s (F8
   dở dang).** Kỷ lục mới: playWait max **1004ms** (F8 E1 run2);
   pause max 837ms (F1 run3). 0 retry, 0 fallback trong toàn bộ
   lượt F1+F8 (198 + 132 toggle). D6 recheck ĐÃ ĐÓNG (đợt 103);
   N10 fallback mơ hồ ĐÃ TRIỆT (đợt 103). G4 flake lần thứ 2 (F1
   run2) — luồng harness đợt 105 điều tra thời gian áp enhance sau
   toggle dưới tải. ENOSPC vite khi nhiều luồng cùng chạy vite dev
   (chạy lại sau khi watcher giải phóng). F8 chưa chạy O8 (F9 đã
   chạy thay — không cần chạy lại).
10. **Birefnet-general trong gói: vẫn 0 lần chạy thành công**
    (không thử đợt này — RAM max quan sát được ~2,95 GB < ngưỡng
    guard 6 GB; quyết định parent đợt 92 giữ nguyên).
11. **TTS 39: không kiểm lại đợt này** (lệnh cấm được tuân thủ).
12. **ci-security.yml + ci-build.yml: vẫn 403** (chờ user thêm tay
    qua web GitHub hoặc cấp quyền workflows cho App). Không file
    workflow nào bị đụng đợt này.
13. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi
    ngang/hơn CapCut thật.
14. **Nợ vận hành mới — reboot giết luồng không ai resume:** F3/F4/
    F8 chết ở reboot #29 mà không được resume (khác E5 đợt 103 tự
    hồi phục). Đợt sau: parent kiểm `subagent.list` sau mỗi reboot
    và resume luồng interrupted; verify (F9) không chờ vô hạn mà
    đóng băng đúng lúc như đợt này.

## 6. Batch đã stage (KHÔNG push)

- F9: `phase9-round104-f9-verify.txt` — 1 entry NUL-delimited
  (LIMITS này); read-back OK: 1 entry, file tồn tại trên đĩa
  (41.736 byte), NUL-terminated.
- Đợt 104 (4 luồng về đủ + F5 dở dang + closing parent): **6 file
  batch / 13 entry** (F1 2, F2 5, F6 2, F7 1, F9 1, closing 2) /
  12 file duy nhất mới trong đợt (closing: LIMITS gộp + gap analysis
  — gap analysis đã có trong 29 batch trước nên không thêm file
  duy nhất; LIMITS gộp mới là file duy nhất mới). **Chưa stage:**
  2 file F5 (LIMITS + `probe104f5.mjs`), code F3 trong
  `preview.tsx` (đã land nhưng không có batch nào liệt kê),
  probe F4 (`probe104f4-frame-parity.mjs`), dữ liệu F8 — parent
  quyết khi closing đợt 104 (resume F5/F3/F4/F8 hay stage tay).
- **Tổng chờ push sau đợt 104 (đếm lại trực tiếp từ đĩa, đợt
  67–104, SAU khi stage F9): 377 file batch / 2473 entry / 1506
  file duy nhất** (trước F9: 376/2472/1505 — tái tạo khớp đúng
  371/2460/1494 sau đợt 103; F9 +1 batch / +1 entry / +1 unique
  mới là LIMITS này). Đợt 104 thêm 6 file batch / 13 entry / 12
  file duy nhất mới so với sau đợt 103 (F1 2 + F2 5 + F6 2 + F7 1
  + F9 1 + LIMITS gộp 1 = 12; gap analysis đã có). HEAD vẫn
  5f548ef8. KHÔNG push.

## 7. Ghi chú vận hành cho verify sau

- **Poller F9 đếm đúng 4/8** (glob `f[1-8]` không khớp file closing
  hay file f9 — bài học C9 đã áp dụng đúng; file closing đợt 104
  của parent cũng không bị đếm nhầm). Poller bị gián đoạn 2 lần
  bởi reboot #29/#30 (runtime restart đi kèm); F9 khởi động lại
  poller sau mỗi lần và vẫn đủ dữ liệu để quyết định đóng băng —
  **đừng kết luận missing từ việc poller chết — kiểm tra đĩa +
  `subagent.list` trước** (bài học E9 đợt 103, nay có thêm:
  `subagent.list` cho biết luồng nào interrupted — F3/F4/F8 chết
  thật, không phải "về muộn").
- **Luồng interrupted sau reboot thì KHÔNG tự về:** F3/F4/F8 im
  lặng đĩa từ 08:57Z (gần 2 giờ) trong khi F1/F2/F6 resume được
  và về đủ. Verify không chờ vô hạn: khi đã rõ luồng nào không về
  kịp (interrupted + không process + không động tĩnh đĩa >1h) thì
  đóng băng và gộp phần đã xong, ghi nợ đợt sau.
- **LIMITS trước, paths sau là bình thường:** F5 có LIMITS từ
  ~09:14Z nhưng không stage paths (chờ watcher) — poller chỉ đếm
  paths, nhưng verify phải đếm cả LIMITS để biết luồng nào đang
  stage dở. F5 là trường hợp "done nhưng dở dang": LIMITS + dữ
  liệu đủ để đối chiếu, nhưng §10b trống + chưa stage.
- **Parent gộp một phần giữa đợt là bình thường nhưng gây lệch
  số:** closing parent 09:20Z ghi tổng 375/2470/1503 (thiếu F1,
  vì F1 stage sau đó) và "F1 chỉ có dữ liệu thô" (sai ở thời điểm
  F9 đóng băng). Verify sau phải đếm lại tổng từ đĩa ở thời điểm
  đóng băng, không trích số closing giữa đợt.
- **Fisher một phía phải lấy đúng đuôi và ghi rõ quy ước** (bài
  học C9 §7 vẫn đứng): F2 ghi p≈0,48 là **hai phía** (một phía =
  0,286); F6 ghi p=1,0 là một phía "greater" theo quy ước scipy
  (OR quan sát = 0 là nhỏ nhất nên p = 1,0). Ghi rõ quy ước khi
  đối chiếu để khỏi báo lệch giả.
- **Đếm marker phải phân biệt dòng vs lần xuất hiện:** F3 "54
  marker" (F5) vs F9 đếm 50 dòng / 58 lần xuất hiện; E4 "30 dòng"
  vs E9 đếm 29 dòng / 40 lần xuất hiện (103E4 ×23). Ghi rõ đơn vị
  đếm khi đối chiếu để khỏi báo lệch giả.
- **"Bogus" của 2 MiB có 2 định nghĩa:** first-atom (F2: 10/12)
  vs any-splice (F9 đếm lại: 11/12 — run9 chỉ splice ở 3179/
  41666). Khi trích tỉ lệ bogus phải ghi rõ định nghĩa; kết luận
  "shim không ức chế" đứng dưới cả hai định nghĩa.
- **O8 sau khi fix land mới là O8 có giá trị:** F8 chết trước khi
  chạy O8; F9 chạy lại trên cây gộp cuối `ca378bbf` (đã có code
  F3) và Δx khớp từng chữ — nếu chỉ tin O8 của đợt trước thì chưa
  chứng minh được code F3 không lệch mask-track.
- **Sau reboot, VM có thể là image mới thiếu libs:** kiểm tra
  đường launch thật trước mọi probe WebKit. Lần này Playwright
  `webkit.launch` chạy tốt cả 2 leg O8; `ldd` thô trên
  MiniBrowser-gtk hiện 4 lib "not found" nhưng đó không phải
  đường launch thật — đừng báo thiếu lib từ `ldd` thô.
- **RAM cuối đợt xuống rất thấp (~420–560 MB trong nhiều poll):**
  F5 gặp WebKit "Target crashed" ở RAM ~1,5 GB (đợt 103) và
  "mẫu không tự load sau 240s" ở RAM ~1,5 GB (f6 đợt này).
  Verify sau nên ghi RAM lúc đóng băng; nếu RAM < 1 GB thì cân
  nhắc đợi hoặc báo rõ môi trường yếu.
- **ENOSPC vite (E4/E6 đợt 103):** không xuất hiện đợt này (F6
  ghi: reboot đã dọn sạch vite server cũ).
