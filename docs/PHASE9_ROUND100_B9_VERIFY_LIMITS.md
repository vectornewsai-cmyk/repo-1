# Phase 9 đợt 100 — B9: kiểm chứng độc lập (8/8 về đủ, cây gộp xanh, O8 21/21 cả 2 engine)

> Luồng B9, đợt 100, lượt cron 03:35 +07 13/11/2026. KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production. KHÔNG đụng TTS 39, birefnet,
> `.github/workflows/*`.
>
> **Kết quả chung: 8/8 luồng B1–B8 về đủ; cây gộp xanh (tsc 0/0, vite
> build PASS 6,13 s, 25/25 mục suite offline exit 0 sau 1 lần retry
> xvfb-lock flake, test-preview-engine.sh 354 assertions, O8 21/21 cả
> 2 engine sau 1 lần retry mỗi leg do môi trường); đối chiếu headline
> 8/8 luồng KHỚP với dữ liệu thô trên đĩa, với 5 đính chính nhỏ (xem
> §2, không đổi kết luận nào).**
>
> **Lưu ý về LIMITS gộp đợt 100 của parent (viết 21:58Z):** parent đã
> gộp và viết LIMITS gộp trước khi B9 xong, ghi "B9 CHƯA XONG — B9 là
> nợ cho đợt 101". Thực tế poller của B9 ghi **ALL LANDED 8/8 lúc
> 22:02Z** (poll cuối của parent chỉ tới 21:52Z, lúc đó B8 chưa hạ
> cánh 10 phút). File này là kết quả kiểm chứng độc lập đầy đủ của B9;
> LIMITS gộp đợt 100 §4 mục 1 ("B9 kiểm chứng + O8 là nợ đợt 101")
> cần đính chính bằng addendum — B9 ĐÃ XONG trong đợt 100, không phải
> nợ đợt 101.

## 0. Dòng thời gian + phương pháp

- **Spawn B1–B8:** ~20:35–20:39Z (lượt cron 03:35 +07). **B9 bắt đầu:**
  20:39:16Z (boot `66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd`, RAM khả dụng
  1617 MB, `preview.tsx` md5 `efce65dd` = cuối đợt 99).
- **Poll đĩa (poller B9, pid 6848, mỗi 10 phút):** 20:49Z **0/8** →
  20:59Z **1/8** (B6) → 21:09Z **4/8** (B2, B3, B5, B6) → 21:19Z
  **6/8** (+B1, B4) → 21:29Z **7/8** (+B7) → 21:39Z **7/8** →
  **reboot #24 lúc ~21:41:50Z** (boot `66fb273d → aa3f2b67`, poller cũ
  chết cùng reboot; B9 kiểm tra `ps` = 0 rồi khởi động lại poller lúc
  21:42Z — không trùng, poller cũ đã chết) → 21:52Z **7/8** →
  **22:02Z 8/8 ALL LANDED** (+B8), poller dừng.
- **Dấu hiệu sống giữa chừng (kiểm tay, không kết luận "mất" khi chưa
  kiểm đĩa):** 20:49Z đã có thư mục làm việc `round100-b2`…`round100-b8`
  (B1 chưa có thư mục riêng lúc đó nhưng sau đó hạ cánh 21:19Z);
  21:19Z đã có LIMITS của B7 dù chưa có file paths — B7 hạ cánh ngay
  sau đó (21:29Z). Không luồng nào chết yểu.
- **Cây gộp đóng băng lúc verify (22:02Z):** `preview.tsx`
  `94ee64c0525c8d34f14ba9a579d516ef`, `media.ts`
  `2c384ed13703809d5e999311147745e7` (không đổi từ đợt 99),
  `playheadHold90R2.ts` `9e0cb234bcd96e62eb7b1b44854aba3c` (B3).
  Không còn process luồng B1–B8 nào chạy lúc đóng băng (kiểm `ps` =
  0). Verify offline 22:05–22:09Z; O8 22:10–22:46Z (có retry, xem
  §1.3). **Không reboot trong lúc verify** (boot `aa3f2b67` suốt).
- **Script verify:** `hidden_files/round100-b9-verify.sh` (dựa trên
  `round99-a10-verify.sh`; thêm `deint-fps-verdict-100b7.test.mjs`
  13 test của B7 + `armHeld99a3.test.mjs` 16 test của A3) + script O8
  `round100-b9-o8.sh` (dựa trên `round99-a10-o8.sh`; fixtures copy
  từ `round99-a10/o8-chromium` + `o8-webkit`, md5 khớp A10: white
  `07bc0cb9…`, ball `6df873f7…`, track `cdf9a252…`). Log:
  `round100-b9-suites.log`, `round100-b9-o8.log`, poll log
  `round100-b9/poll.log`.

## 1. Kiểm chứng trên cây gộp

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 6,13 s** |

### 1.2 Suite offline (log `hidden_files/round100-b9-suites.log`)

| test | kết quả |
|---|---|
| playheadHold90R2 | **65 passed** (56 cũ + 9 mới B3-R1..R9), exit 0 |
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
| deint-fps-verdict-100b7 (mới, B7) | **pass 13, fail 0**, exit 0 |
| armHeld99a3 (A3) | **pass 16, fail 0**, exit 0 |
| vite-diagnosis-regex (X6) | pass 9, fail 0, exit 0 |
| xvfb-lock | **FAIL lần 1, PASS khi chạy lại** (xem §1.2.1) |
| test-preview-engine.sh (Z8, chạy đúng qua script) | **EXIT 0, 354 assertions pass** |

**Tổng: 25/25 mục exit 0** (24 xanh ngay lần 1 + xvfb-lock xanh ở
lần chạy lại độc lập).

#### 1.2.1 xvfb-lock — FAIL lần 1 là flake hạ tầng, không phải hồi quy

- Lần 1 (trong suite, 22:0xZ): section B lỗi — 3 claim song song chỉ
  lên được 2 display khác nhau (`:193:OK, :194:OK, :194:FAIL:sock`,
  distinct=2/3), mất 8201 ms (A10: 3476 ms). Section A và C đều xanh.
- Chạy lại độc lập lúc 22:10:29Z: **PASS, 3504 ms** (`:193:OK,
  :195:OK, :194:OK`, distinct=3/3), exit 0. Thời gian khớp A10
  (3476 ms).
- Kết luận: race chiếm display `:194` dưới tải (hai claim cùng chạm
  socket trong một cửa sổ), không phải lỗi lock logic hay hồi quy sản
  phẩm — test này vốn đo chính race đó và đã PASS ở A10 trên cùng
  logic. Ghi cả hai lần chạy, không giấu lần FAIL.

### 1.3 O8 — 21/21 cả 2 engine (log `hidden_files/round100-b9-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium (retry) | 22:28Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |
| WebKit (retry) | 22:45–22:46Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |

Số Δx khớp **đúng từng chữ** với O8 của X2/X3/X9b/Y10/Z10/A10 trên
các cây trước — mask-track ổn định qua đợt 100 dù `preview.tsx`
đổi 3 luồng (B2 + B3 + B4). E0: 0 lỗi JS/pageerror/crash cả 2
engine (theo report O8).

#### 1.3.1 Lần chạy đầu O8 (22:10–22:11Z): cả 2 leg exit=2 — đều do môi trường, không phải sản phẩm

- **Chromium exit=2:** `HARNESS LỖI: thiếu fixture trong SCRATCH
  round100-b9/o8-chromium` — **lỗi của chính B9:** script O8 của A10
  ghi "fixtures đã copy trước" nhưng B9 quên copy trước khi chạy.
  Đã sửa: copy fixtures từ `round99-a10/o8-*` (md5 khớp A10 từng
  byte), chạy lại → 21/21.
- **WebKit exit=2:** MiniBrowser không khởi động được —
  `libevent-2.1.so.7: cannot open shared object file`. `ldd` cho thấy
  **22 thư viện thiếu** trên VM mới sau reboot #24 (libgtk-4,
  libgstreamer, libsoup, libjxl…): VM bị thay mới ở reboot #24 thiếu
  gần như toàn bộ system libs mà WebKit cần (B8 cũng ghi GStreamer hệ
  thống biến mất ở §1). Đây là **hỏng môi trường do reboot thay VM,
  không phải hồi quy sản phẩm**.
- **Sửa môi trường (B9 làm, ghi rõ để các lượt sau biết):**
  `npx playwright install-deps webkit` lần 1 chết vì `apt-get update`
  kẹt >17 phút ở mirror `mirror.cogentco.com` (nhiều dòng `Ign`,
  log không tiến triển từ 22:25Z). B9 kill apt rồi chạy lại update
  với **chỉ mirror azure** (`/tmp/azure-only.sources`,
  `azure.archive.ubuntu.com`) → xong trong **8 s, exit 0**. Cài đúng
  danh sách gói của Playwright 1.65.0 → exit 0; thư viện thiếu
  22 → 4. 4 còn lại: `libwebkitgtk-6.0` + `libjavascriptcoregtk-6.0`
  (nằm sẵn trong bundle `minibrowser-gtk/lib/`, `ldd` trần báo sai)
  và `libbacktrace` + `libjxl` (lazy/optional — MiniBrowser đã chạy
  tới bước mở display, đủ cho O8). `gst-launch-1.0` vẫn không có
  (gói `gstreamer1.0-tools` không nằm trong danh sách deps của
  Playwright) — không cần cho O8. Chạy lại WebKit → 21/21.
- **Bài học cho lượt sau:** sau mỗi reboot, kiểm tra `ldd`
  MiniBrowser trước khi chạy probe WebKit; nếu VM mới thiếu libs thì
  cài bằng azure-only (cogentco kẹt — đừng chờ quá 5 phút); đừng
  dùng `pkill` với pattern trùng cmdline của chính shell mình (B9
  tự giết shell mình 1 lần ở đây, cùng lỗi B4 đã ghi).

## 2. Đối chiếu từng luồng — số headline KHỚP (5 đính chính nhỏ, không đổi kết luận)

### 2.1 B1 — 2 MiB điểm nối: KHỚP

- **Bogus 4/4:** đếm trực tiếp trong 4 file GST
  `round100-b1/b-websrc/gst/`: run1/2/4 đúng 1 lần `541230788`,
  run3 đúng 1 lần `162705492` + 1 lần `2854668610` ✓. Frames từ
  JSON: 44/61/105/179 ✓; `playOk=false`, `failKind=error-event` cả
  4 ✓.
- **Giá trị byte kiểm lại từ clip c2** (python `struct`, big-endian):
  2 MiB+0 = 541230788 ✓; +32 = 2854668610 ✓; **+3163 = 162705492** ✓
  (giá trị MỚI của B1 đúng là byte tại offset box `free`).
- **Pause/resume 0 lần:** `stopping download` = 0 và `restarting
  download` = 0 trong cả 4 log ✓ — giả thuyết 2019 bị bác bằng
  runtime như B1 ghi.
- **Đính chính nhỏ (B1 đã tự ghi):** field `"round"` trong JSON kết
  quả còn ghi `"phase9-round99-a1-basesrc"` (copy artifact từ probe
  A1) — không ảnh hưởng số đo (đường dẫn `gstDebugFile` + timestamp
  là đúng).
- B1 không sửa production (chỉ probe + JSON kết quả).

### 2.2 B2 — Ghost tick timing: KHỚP

- **Phân loại strip chạy lại từ `analyze-b2-full.txt`:** clean 99 /
  mislabeled 79 / ambiguous 47 trên 225 entry ✓; snapshot phân biệt
  95 (34/37/24) như LIMITS §2.2.
- **P2:** hit 101/178 = 56,7% (tất cả entry) ✓; snapshot phân biệt
  35/71 = **49,3%** vs baseline "cứ đoán nhãn" 34/71 = 47,9% ✓
  (`analyze-b2b.txt`); P2b 21/71 = 29,6% ✓.
- **Stall trong tick:** 60/71 = 84,5% tick có mediaAdv < inRaw − 5 ms
  ✓; rawMs trung vị 0,1 ms (p90 0,5 ms) — B9 không chạy lại probe,
  chỉ đối chiếu file analyze (số đã tính sẵn, khớp LIMITS).
- **6/133 ca:** chạy lại trên dữ liệu cũ A2 run B theo LIMITS §4.2
  cho 5 fail / 89 cửa sổ, cả 5 đều `winTrue == winLab` — B9 tin
  file analyze của B2 (không chạy lại matcher v3 lần nữa vì cùng
  code A2 đã được A10 chạy lại giống hệt từng byte ở đợt 99).
- Instrumentation B2 (marker "Đợt 100 B2" ×6) còn đủ trên cây gộp
  (xem §3). B2 không đổi blend math.

### 2.3 B3 — Tail-expiry fix: KHỚP

- **tailBursts:** đếm trong `analyze-g1-g6-b3.txt`: g1 = 2, g2 = 1,
  g3–g6 = 0 → **tổng 3** ✓ (g1×2, g2×1 như LIMITS §4).
- **f4-like:** 0 ở cả 6 lượt ✓ (mỗi lượt `f4-like: 0`).
- **ARM-HELD §6:** đếm trong `analyze-g1-g6-a3.txt` (analyzer A3
  chạy lại): **2** — g1 relMs 9777 (driftCF 0,384/0,793) và g4
  relMs 15578 (driftCF 0,72/1,715) ✓ đúng từng số với LIMITS §4.
- **Re-arm gộp 6 lượt:** 6 arm, CANCELLED=0, DELAYED=0, NOT-DUE=3,
  AMBIGUOUS=3 ✓; drift re-seek 3 ✓; seeking kẹt ≥3 s: 1 ✓;
  arm-vì-bò 4, tick-bò 32 (LIMITS §4 chỉ ghi "4 ca bò", không nêu
  số tick — không mâu thuẫn).
- **Grace chuỗi ≥2 tick:** LIMITS ghi BỊ CHẶN 6 / LỌT 0 (g1×1, g2×2,
  g3×1, g5×1, g6×1); B9 đếm thô `=> BỊ CHẶN` = 12 dòng trong file
  gộp (6 dòng per-run + 6 dòng lặp lại ở phần gộp) — phù hợp, không
  phải 12 chuỗi.
- **Hồi quy:** playheadHold 65/65 trên cây gộp (B3-R1..R9 trong đó)
  ✓; vite build PASS ✓. Fix B3 là thay đổi production duy nhất có
  logic mới đợt này (`playheadHold90R2.ts` + vùng tail/grace trong
  `preview.tsx`).

### 2.4 B4 — Blur parity: KHỚP

- **B-band wk gộp r4–r20:** đọc `analysis.txt` mục (2): **B n=132 /
  498, mean 0,764, med 0,764, sd 0,016; pair-like 60 (0,750) /
  dc-like 72 (0,776)** ✓ đúng từng số với LIMITS §1a. Caps mới
  wk r17–r20: 43+23+19+20 = **105** ✓ (tổng cap B4 mới).
- **Cap D mới:** r13 c1 fi=69 (gap 17, g=0,306) và r13 c2 fi=38
  (gap 14, g=0,306) có trong `analysis.txt` đúng từng số ✓; r14 c0
  fi=3 gap 4 ✓ (B9 chỉ đối chiếu dòng D, không đếm lại toàn bộ
  783 cap chr — tỉ lệ D gộp 12/783 = 1,5% lấy từ bảng LIMITS §1c,
  đã khớp với các dòng D liệt kê).
- **Đính chính nhỏ:** header LIMITS B4 ghi "reboot tiếp theo dự kiến
  ~19:26Z" — là số cũ copy từ A5 (thực tế reboot #23 là 20:30:14Z,
  #24 là 21:41:50Z). Câu "KHÔNG reboot trong lượt" vẫn đúng cho cửa
  sổ đo của B4 (20:38–21:02Z, boot 66fb273d suốt). Chỉ là dự báo
  stale, không phải số đo sai.
- Instrumentation B4 (marker "Đợt 100 B4" ×3) còn đủ trên cây gộp
  (xem §3). B4 không đổi blend math.

### 2.5 B5 — Zombie early-return: KHỚP

- **Đối chứng dương R5:** đếm trực tiếp trong JSON thô
  `chr-mixedalt-b5c1/frame-parity-results.json`:
  `skip-clip-inactive` = **6** ✓ (1/biên, như LIMITS §2).
- **Đường bình thường R1–R4:** `skip-clip-inactive` = **0** ở cả 4
  lượt (b5n1/n2/s1/l1) ✓; zombie Δ = 0 (theo file `analysis-b5*.txt`,
  B9 đối chiếu mẫu R5: các biên có `zombie Δ=0`, một số biên
  `Δ=None` do không có mốc sau — như LIMITS đã ghi, không phải
  capture tiền-seek).
- B5 không sửa production (chỉ probe + analyzer).

### 2.6 B6 — EPERM probe #19: KHỚP

- **Checklist P8 §2.3 đọc trực tiếp:** heartbeat n=19, ts
  20:40:35Z, boot `66fb273d…`, pid 7199 ✓; log
  `eperm-probe-v2.log` **49 dòng** (46 → 49, đúng +3 checklist) ✓;
  dòng probe#19: `probe#19 boot=66fb273d tmp+ws ok=2 fail=0` ✓;
  dòng `boot changed 99338d31 -> 66fb273d (reboot detected, uptime
  since 2026-11-12 20:30:14)` ✓ — xác minh luôn giờ reboot #23
  chính xác từng giây (B9 kiểm lại bằng `uptime -s` lúc 20:38Z:
  `2026-11-12 20:30:14` ✓).
- **Quét WFS đếm lại:** file `wfs-newstd.txt` (định dạng
  `đường-dẫn:số-dòng`): **124 file / 398 dòng** ✓ đúng từng số;
  bản copy 25 dòng / 17 file (theo `scan-meta.txt`) ✓; đối chiếu
  chéo 398 + 25 = 423 = R7b, chênh 0 ✓ — lần thứ bảy liên tiếp.
- **Đính chính nhỏ:** B6 dự báo "reboot tiếp theo ~22:36Z" (từ chu
  kỳ trung bình ~2h06') — thực tế reboot #24 xảy ra **21:41:50Z**,
  sớm hơn dự báo ~54'. Khoảng cách #22→#23 = 3h04'35" (dài nhất
  từng ghi) vẫn đứng; dự báo theo trung bình có thể trượt ~1h như
  chính B6 đã cảnh báo ở §5 mục 5.
- B6 không đụng TTS 39, không thử birefnet, không tự tạo cron 10
  phút ✓ (theo LIMITS + log).

### 2.7 B7 — Harness Space-toggle + quy tắc slot-tải-đầu: KHỚP

- **Chạy lại `validate-rule.py`:** chỉ đúng 1/24 lần lịch sử bị gắn
  cờ — **A7 run7** (vòng 1: mean 14,83, slot0 5,52 →
  `yên-slot-tải-đầu`) ✓; Z9 run4 yên sạch (slot0 6,47) ✓.
- **Chạy lại `recompute-pool100b7.py`:** tái tạo đúng số A7 (chân
  yên 30fps n=21, median 0,940, mean 0,915, PASS 17/21; CI tính lại
  [0,849; 0,982] so với A7 [0,852; 0,979] — lệch 0,003 do làm tròn
  hệ số t, như B7 đã ghi); không run7: **n=20, median 0,935, mean
  0,910, PASS 16/20 = 80%** ✓; chân yên 60fps không đổi 14/14 ✓.
- **9 lần E1 từ `runs.log` + `runs-wave2.log`:** 9/9 exit=0, 0 abort
  ✓; G5 từng lần 1,01 / 1,05 / 1,06 / 1,00 (2 vòng) / 1,49 / 0,98 /
  0,95 / 0,98 / 0,96 ✓; N10 2/2 hoàn thành ✓. Số "yên30=0/3" ở
  cuối `runs.log` wave 1 chỉ là bộ đếm tiến độ (mục tiêu 3 lần yên,
  wave 1 toàn tải nên 0/3) — không phải kết quả FAIL.
- **Test mới trên cây gộp:** `deint-fps-verdict-100b7` 13/13 ✓;
  `deint-fps-verdict` 17/17 ✓ (xem §1.2).
- B7 không sửa production (chỉ harness/probe + test).

### 2.8 B8 — Vì sao chỉ 1–2/17 lệnh play() tới được GStreamer: KHỚP (1 đính chính nhỏ về đếm tổng)

- **Chạy lại `analyze_b8.py`:** timeline `set_state` của pipeline
  `blob-media-player-6` tái tạo đúng từng lệnh: r2 n=12, r3 n=16 ✓;
  `already-in-state (-6): 0` cả 2 lượt ✓ (GStreamer không gọi thừa
  — WebKit gần như không gọi).
- **Đính chính nhỏ — đếm tổng r3:** LIMITS §4.1 ghi "r3 **6 PLAYING
  + 5 PAUSED**". Đếm lại từ chính bảng của B8 (16 lệnh): PLAYING =
  132,074 / 144,459 / 148,378 / 150,861 / 153,152 / 156,901 (**6**);
  PAUSED = 3,069 (preroll lúc load) / 140,443 / 147,244 / 148,855 /
  151,942 / 155,956 / 159,685 (**7 tổng, 6 sau PLAYING đầu**); READY
  2; NULL 1. Tổng chỉ cộng đủ 16 khi là **6 PLAYING + 6 PAUSED**
  (sau PLAYING đầu) + 1 PAUSED preroll + 2 READY + 1 NULL = 16; với
  5 PAUSED chỉ được 15. Con số đúng theo phương pháp của A10 (pha
  phát sau PLAYING đầu tiên) là **6/6** — trùng với đính chính của
  A10 đối với A4 (r3 6/5 → 6/6). B8 có lẽ đã copy số tổng cũ của A4
  mà không đếm lại lệnh PAUSED cuối 159,685. **Không đổi kết luận:**
  "chỉ 1–2/17" dựa trên đếm trong/near cửa sổ freeze, không dựa trên
  tổng cả lượt; đính chính anchor của B8 (§4.2) vẫn đứng.
- **Thí nghiệm ctypes (§2) chạy lại bởi B9:** `python3
  gst_setstate_calls_test.py` (sau khi cài lại libs GStreamer) trả
  về đúng từng mã như bảng của B8: PLAYING → ASYNC (2), PLAYING
  lặp → SUCCESS (1), PAUSED → SUCCESS (1), PAUSED lặp → SUCCESS
  (1), PLAYING lần 2 → SUCCESS (1). **Xác nhận độc lập:** gọi trùng
  trạng thái vẫn đi qua `set_state` và trả SUCCESS — nên 0 dòng
  `already in state` trong log A4 chứng tỏ WebKit thật sự gần như
  không gọi. Caveat: log GST gốc của thí nghiệm B8 đã mất theo
  `/tmp` khi VM thay mới, nên B9 chỉ chạy lại được mã trả về, không
  đối chiếu lại từng dòng `set_state to X` trong log — nhưng mã trả
  về khớp là đủ cho kết luận "GStreamer được loại trừ".
- B8 không sửa production (chỉ 1 file LIMITS).

## 3. Va chạm gộp — preview.tsx: 3 luồng cùng sửa, không mất marker

- **File duy nhất bị 3 luồng sửa:** `apps/web/src/preview.tsx` (B2 +
  B3 + B4). Tất cả file còn lại trong 8 batch đều duy nhất (tổng 23
  entry / 21 file duy nhất đợt 100 — preview.tsx chung 3 luồng).
  Không file `.github/workflows/*` nào bị đụng; không binary nào vào
  batch.
- **Trên đĩa lúc đóng băng (md5 `94ee64c0…`):** marker "Đợt 100 B2"
  **×6**, "Đợt 100 B3" **×5**, "Đợt 100 B4" **×3** — cả ba bộ đều đủ.
  Marker cũ còn nguyên: "Đợt 99 A2" ×8, "Đợt 99 A6" ×5.
- **Thứ tự sửa (khôi phục từ log B2 §7 + B4 §0):** B4 sửa trước
  (md5 `2efb80d3`), B2 sửa tiếp (`ca9ea4bb`), B3 sửa cuối
  (`94ee64c0`, 20:46:39Z). B9 quan sát thêm 1 mốc: md5 đã là
  `94ee64c0` từ poll 20:49Z và **không đổi tới cuối đợt** — cây ổn
  định từ 20:49Z trở đi.
- **Blend math không đổi:** thân hàm `compositeMotionBlurLayer`
  (dòng 2507) chứa đúng **1 marker "Đợt 99"** (dòng 2568, của A2 —
  stash strip đo lường); B2/B3/B4 chỉ thêm instrumentation chỉ-đo ở
  vùng khác nhau (timing tick / tail-grace / curPix đường thường),
  không đụng weights, gate hay thứ tự vẽ. tsc 0 + vite build PASS +
  toàn bộ suite xanh + O8 21/21 cả 2 engine sau gộp — không xung đột
  nội dung.
- **Thay đổi production duy nhất có logic mới:** fix tail-expiry của
  B3 (`playheadHold90R2.ts`: `PLAYHEAD_TAIL_BURST_RATE_MAX = 1,5`,
  `lastTickMs`, `burstBlocked` + vùng đuôi/grace trong `preview.tsx`).
  Mọi luồng khác chỉ thêm instrumentation đo lường / probe / test /
  docs.

## 4. Boot + reboot + RAM trong đợt

- **Reboot #23 lúc 20:30:14Z** (boot `99338d31 → 66fb273d`) xảy ra
  NGAY TRƯỚC đợt (B9 bắt đầu 20:39Z, uptime 8–9 phút) — B6 xác minh
  giờ từng giây; khoảng cách #22→#23 = 3h04'35", dài nhất từng ghi.
- **Reboot #24 lúc ~21:41:50Z** (boot `66fb273d → aa3f2b67`,
  `uptime -s` xác minh) xảy ra GIỮA đợt, trong lúc B9 đang poll:
  giết poller cũ của B9 (khởi động lại 21:42Z, không trùng) và giết
  cả môi trường WebKit/GStreamer của B8 (VM mới thiếu 22 system
  libs — xem §1.3.1). Khoảng cách #23→#24 chỉ ~1h11'36" — ngắn hơn
  nhiều so với chu kỳ trung bình ~2h06', và ngắn hơn cả khoảng cách
  ngắn nhất từng ghi (#16→#17 ~31–35'). Dự báo reboot của B6
  (~22:36Z) trượt ~54' — chu kỳ reboot không đều, đừng dự báo chặt.
- **Không reboot trong lúc verify** (boot `aa3f2b67` từ 21:42Z tới
  O8 xong 22:46Z). Reboot tiếp theo không dự báo được chắc chắn
  (khoảng cách gần nhất 71', trung bình ~2h06').
- **RAM khả dụng (MemAvailable):** 1617 MB (20:39Z) → 1680 → 1125 →
  3338 → 1443 → 525–530 → 865 → 611 → 551 (22:05Z, lúc verify) →
  1063 (22:46Z). Max trong đợt ~3,3 GB, **luôn dưới ngưỡng guard
  6 GB** — birefnet KHÔNG chạy (đúng quy tắc parent đợt 92). B6 ghi
  max 5.044 MB cuối lượt B6 (20:52Z, khi tải song song giảm) — B9
  không quan sát được mốc đó vì poll 10 phút/lần, nhưng không mâu
  thuẫn (RAM dao động theo tải các luồng song song).
- **preview.tsx đổi 1 lần giữa đợt:** `efce65dd` (cuối đợt 99) →
  `94ee64c0` (sau B2+B3+B4, ổn định từ 20:49Z) — blend math không
  đổi (xem §3).

## 5. Trạng thái nợ sau đợt 100 (cập nhật từ LIMITS gộp đợt 99 §4)

1. **B9 kiểm chứng độc lập + O8 — ĐÃ XONG (luồng này).** 8/8 luồng
   đối chiếu khớp; O8 21/21 cả 2 engine (sau retry môi trường);
   LIMITS gộp đợt 100 §4 mục 1 cần đính chính (B9 không còn là nợ
   đợt 101).
2. **G1 đóng hay chưa — VẪN MỞ, chờ parent/user quyết.** B7: chân
   yên 30fps sau khi loại run7 còn 16/20 = 80% (hết biên — 1 lần
   FAIL yên nữa là về 16/21 = 76%); metric G5 hay M2 vẫn chưa quyết
   (A9 đợt 99: dưới M2 khung 16/20 không đạt được, tối đa 15/20).
   Harness Space-toggle đã sửa (B7) nhưng đường retry/fallback chưa
   bắn thật lần nào — fix mới chứng minh bằng cơ chế + 0 abort/9 lần.
3. **2 MiB — điểm nối hẹp nhất còn lại: handoff typefind ↔
   webkitwebsrc.** Splice đúng 2.097.152 byte, K ∈ {0, 32, 3163} đều
   là biên box; pause/resume 2019 BỊ BÁC (code + runtime); `create()`
   bị loại trừ vai trò giao trực tiếp. Cần probe `typefind:5` /
   `webkitwebsrc:7` + source `qtdemux.c` đúng (B1 §7–§8).
4. **Ghost residual — cơ chế trễ trong-tick BỊ BÁC ở dạng mạnh (B2).**
   Thủ phạm là phase jitter presented-frame ↔ currentTime (±1, thỉnh
   thoảng ±2), độc lập với độ dài tick. Fix ứng viên cũ của A2
   ("đọc lại currentTime ngay trước drawImage") sẽ KHÔNG sửa được
   mislabel — fix đúng hướng phải lấy frame TRÌNH CHIẾU thật (metadata
   rVFC / presentedFrameIndex). 6/133 ca không khớp: ghost mislabel
   KHÔNG phải nguyên nhân (5/5 cũ + 1/1 mới đều winTrue==winLab) —
   còn 2 chữ ký (lật mức 37↔84; đơn-frame ~112, có thể là artifact
   biên pass).
5. **Re-arm — fix tail-expiry B3 ĐÃ LAND nhưng chưa triệt để.** Burst
   dài-gap (> ~770 ms cho +1,16 s) vẫn lọt luật burst-rate (g2, g5
   đã quan sát, chưa gây hại); cửa sổ f4 vẫn mở cho burst dài-gap
   đáp xa (> ~1,5 s). Hướng vá tiếp: drift-gate ở tick đóng hoặc
   ngưỡng rate động theo gap (B3 §6). Trần 5000 ms vẫn 0 nhả quan
   sát.
6. **Blur parity — B-band wk n=132, vẫn không có khe bimodal**
   (2-means chạm nhau 0,0019); ringSize=1 ⇒ pair-like là tín hiệu
   duy nhất còn đứng (12/12); phase 4 đã yếu thêm (17/27). D fix-3
   sàn ~1% (12/783 chr); cap D r7 vẫn mở; presented mislabel −1
   chỉ đúng một phần (coupling ghost−1/presented−1 gợi ý, Fisher
   p=0,067 — cần n lớn hơn). Hướng mạnh nhất vẫn là đọc alpha plan
   thật trong `compositeMotionBlurLayer`.
7. **Zombie pump — khe early-return ngoài đời CHƯA quan sát được
   sau 37 biên đường bình thường (0 ca, B5).** Đối chứng dương 6/6
   chứng minh thiết bị đo đủ nhạy. Muốn ép khe trực tiếp cần trigger
   stall theo playhead hoặc hook ép `skipRenderSeeking` ở đúng tick
   biên (B5 §5).
8. **EPERM — probe #19 ok=2 fail=0; khoảng mù #18 ĐÃ ĐÓNG** (reboot
   #23 20:30:14Z). Tiếp theo: probe #20 + khoảng mù #19 (bắt đầu
   20:40:35Z; chứa reboot #24 21:41:50Z — B9 đã xác minh boot
   `aa3f2b67` + giờ từng giây bằng `uptime -s`). Cron riêng 10 phút
   vẫn chờ user quyết (B6 không tự tạo). Giờ từng giây reboot #16
   vẫn chưa chốt — B6 đề xuất đóng ở mức kẹp ~4' (07:26:03Z →
   ~07:30:00Z).
9. **Birefnet-general trong gói: vẫn 0 lần chạy thành công** (không
   thử đợt này — RAM max quan sát được ~5,0 GB < ngưỡng guard 6 GB;
   quyết định parent đợt 92 giữ nguyên).
10. **TTS 39: không kiểm lại đợt này** (lệnh cấm được tuân thủ).
11. **ci-security.yml + ci-build.yml: vẫn 403** (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App). Không file workflow
    nào bị đụng đợt này.
12. **Môi trường VM sau reboot (mới, B9 phát hiện):** VM thay mới ở
    reboot #24 thiếu 22 system libs (WebKit/GStreamer); B9 đã cài
    lại bằng azure-only apt (cogentco kẹt — xem §1.3.1). Các lượt
    sau nên kiểm tra `ldd` MiniBrowser sau mỗi reboot trước khi chạy
    probe WebKit. `gst-launch-1.0` vẫn chưa có trên VM mới
    (`gstreamer1.0-tools` chưa cài) — probe B1-style sau reboot cần
    kiểm tra lại.
13. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi
    ngang/hơn CapCut thật.

## 6. Batch đã stage (KHÔNG push)

- B9: `phase9-round100-b9-verify.txt` — 1 entry NUL-delimited
  (LIMITS này), read-back OK (xem dưới).
- Đợt 100 (8 luồng): **23 entry / 8 file** (B1 3, B2 2, B3 6, B4 4,
  B5 2, B6 1, B7 4, B8 1) / 21 file duy nhất (preview.tsx chung
  B2+B3+B4).
- **Tổng chờ push sau đợt 100 (đếm lại trực tiếp từ đĩa, đợt 67–100,
  SAU khi stage B9): 342 file batch / 2391 entry / 1443 file duy nhất**
  (trước B9: 341/2390/1442 — khớp đúng số parent trong LIMITS gộp
  đợt 100 §5; B9 thêm 1 file batch / 1 entry / 1 file duy nhất là
  LIMITS này). HEAD vẫn 5f548ef8. KHÔNG push.

## 7. Ghi chú vận hành cho verify sau

- **Poller chết cùng reboot là bình thường:** poller B9 chết ở reboot
  #24; kiểm tra `ps` = 0 rồi khởi động lại (không khởi trùng khi
  poller cũ còn sống — bài học A10 đợt 99 vẫn đứng).
- **O8: copy fixtures TRƯỚC khi chạy.** Script O8 của A10/Z10 ghi
  "fixtures đã copy trước" nhưng không tự copy — B9 quên bước này ở
  lần chạy đầu (Chromium exit=2). Verify sau copy fixtures vào
  `roundXXX/o8-chromium` + `o8-webkit` trước, kiểm md5 (white
  `07bc0cb9…`, ball `6df873f7…`, track `cdf9a252…`).
- **Sau reboot, VM có thể là image mới thiếu libs:** kiểm tra `ldd`
  MiniBrowser trước mọi probe WebKit; cài deps bằng azure-only
  (`azure.archive.ubuntu.com`) vì mirror cogentco kẹt (apt-get
  update treo >17 phút); `apt-get update` đặt `timeout 300` để
  không treo vô hạn.
- **Đừng dùng `pkill` với pattern trùng cmdline shell mình** (B9 tự
  giết shell mình 1 lần; cùng lỗi B4 đã ghi với `pkill -f
  "probe100b4"`).
- **Đếm set_state GST:** B8 lặp lại lỗi đếm tổng của A4 (r3 6/5 thay
  vì 6/6) — verify sau đếm theo đúng phương pháp đã ghi (player-6,
  pha phát sau PLAYING đầu) và đối chiếu hàng "cả lượt" với bảng
  timeline trước khi nhận.
- **Đếm lượt / tỉ lệ gộp:** headline không ghi rõ phạm vi (run nào,
  gộp hay riêng) phải đối chiếu với bảng chi tiết — B2/A2 đã có
  tiền lệ.
- **xvfb-lock FAIL lần 1 rồi PASS khi chạy lại** là flake race
  display đã biết dưới tải — chạy lại 1 lần trước khi kết luận hồi
  quy; ghi cả hai lần.
- **Đếm grace chain của B3:** grep thô `=> BỊ CHẶN` đếm trùng phần
  gộp (12 dòng = 6 chuỗi × 2) — đếm trên dòng per-run hoặc phần
  tóm tắt, không grep thô cả file (cùng bài học đếm arm-vì-bò của
  A10).
