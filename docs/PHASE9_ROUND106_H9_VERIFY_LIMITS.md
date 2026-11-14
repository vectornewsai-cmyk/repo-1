# Phase 9 đợt 106 — H9: kiểm chứng độc lập (2/8 về đủ; cây gộp xanh, O8 21/21 cả 2 engine)

> Luồng H9, đợt 106, lượt cron 21:35 +07 13/11/2026. KHÔNG push. KHÔNG
> release/tag. KHÔNG sửa production. KHÔNG đụng TTS 39, birefnet,
> `.github/workflows`, 0 binary.
>
> **Kết quả chính (5 ý):**
> 1. **Chỉ 2/8 luồng về đủ (H5, H6).** H1, H2, H3, H4, H7, H8 CHƯA VỀ
>    (không LIMITS, không batch) — nhưng H9 đã kiểm đĩa trước khi kết
>    luận thiếu, theo bài học các đợt trước: H1/H2/H3/H4/H7 đều có dữ
>    liệu thô trên đĩa, chỉ H8 là không có gì ngoài poll.log 14:40Z.
>    Nguyên nhân chung: **reboot #33 lúc 14:50:59Z** (gap #32→#33 chỉ
>    19'07" — ngắn nhất từng ghi) cắt ngang giữa đợt, đúng lúc các luồng
>    đo dài đang chạy; H5/H6 sống sót vì xong việc sau reboot, các luồng
>    còn lại chết cùng phiên cũ và không quay lại viết LIMITS/batch.
> 2. **Cây gộp XANH:** tsc web 0, desktop 0; vite build PASS 8,74s;
>    **27/27 mục suite exit 0 ngay lần đầu**, 0 dòng "not ok"
>    (test-preview-engine.sh 354 assertions); O8 **21/21 cả 2 engine**
>    (Chromium cần chạy lại 1 lần vì H9 quên copy fixture — lỗi setup
>    của H9, không phải lỗi sản phẩm; lần 2 exit 0 ngay).
> 3. **Đối chiếu headline H5/H6: KHỚP toàn bộ** (đếm lại trực tiếp từ
>    dữ liệu gốc; xem `hidden_files/round106-h9/recounts.log`).
>    Flip-leg trên cây land KHÔNG ĐẠT bar dưới tải nặng (C2 68,5% /
>    C2b 63,0% vs bar 70% và 68,6%) — H5 kết luận đúng, land F8 không
>    bị lật; G4 flake 0/7 mới, gộp 2/28 = 7,1% — H6 kết luận đúng.
> 4. **H4 B-band do H9 tính lại từ dữ liệu thô** (H4 chưa về LIMITS;
>    đúng phương pháp G7 §B): gộp F6+G7+H4 c0 72 (pair 5), c2 54
>    (pair 2), **Fisher một phía p=0,3545 — KHÔNG ĐẠT bar** (tệ đi so
>    với p=0,22 của G7); còn thiếu c0 43 / c2 61 B-cap tới ~115/nhóm;
>    cờ heterogeneity hết ý nghĩa (p=0,37); D floor 0/2371.
> 5. **Dữ liệu thô cứu được:** H1 trigger RAM hợp lệ nhưng cả 2 lượt
>    đều bị loại vì H5 sửa `preview.tsx` giữa lượt; H3 y1 lần đầu đo
>    **trực tiếp** được độ trễ kill (n=12, median 0,20 ms) và zombie
>    Δ=0 ở 12/12 biên; H7 probe #25 ok=2 fail=0 + scan writeFileSync
>    xong (1.038 hit gộp 3 chuẩn).
>
> **Production đổi đợt này (đúng 3 file có ý nghĩa):**
> `apps/web/src/preview.tsx` (H5: chỉ sửa 6 comment sai số, f0b9e496 →
> ced42efd), `apps/web/scripts/clicktest-77e1-deint-fps.mjs` (H6: thêm
> log chẩn đoán G4, không đổi đo), 2 analyzer ghost mới của H5 +
> 2 probe frame-parity mới của H3/H4 (chưa có LIMITS đi kèm).

## 0. Poll + đóng băng

- Poll H9: 14:40Z 0/8 → 14:50Z 0/8 (các dir đã có dữ liệu thô) →
  reboot #33 14:50:59Z cắt ngang poller lần 1 (SIGTERM) → poller khởi
  động lại 14:52:45Z → 9 vòng tới 16:12:48Z, kết thúc **timeout: chỉ
  H5 (15:12Z) + H6 (15:18Z) về đủ**. Log: `hidden_files/round106-h9/poll.log`.
- Kiểm đĩa 16:13Z (sau timeout, theo skill verify_delegated_work):
  H1/H2/H3/H4/H7 mtime cuối 14:46–14:51Z (im lặng >80 phút); H8 chỉ
  có poll.log 14:40Z. Không luồng nào viết thêm sau 15:20Z. H9 đóng
  băng lúc 16:16:21Z và verify — không đợi vô hạn.
- Boot lúc đóng băng: `63a52041` (uptime -s 14:50:59Z = reboot #33).
  RAM khả dụng 606 MB lúc đóng băng, 546 MB lúc verify bắt đầu.
  Không còn process luồng H1–H8 nào chạy lúc đóng băng (ps: 0
  vite/chromium/playwright). Không reboot trong lúc verify (boot
  không đổi 14:50:59Z từ 16:16 tới 16:24Z).
- Cây đóng băng (md5): `preview.tsx` **ced42efd…** (H5 sửa comment),
  `clicktest-77e1-deint-fps.mjs` **ae6cd34a…** (H6 thêm log),
  `analyze106h5-ghost.py` **cf8217cc…**, `analyze106h5-ghost-flip.py`
  **85f1b607…** (H5 mới), `probe106h3-frame-parity.mjs` **d848ee46…**,
  `probe106h4-frame-parity.mjs` **bbf1e745…** (H3/H4 mới, chưa có
  LIMITS đi kèm). `tsconfig.json` không đổi từ đợt 103.
- **Script verify:** `hidden_files/round106-h9-verify.sh` (dựa trên
  `round105-g9-verify.sh`, 27 mục) + script O8
  `round106-h9-o8.sh` (dựa trên `round105-g9-o8.sh`; fixtures copy từ
  `round105-g9/o8-chromium`, md5 khớp — ball `6df873f7…`; WebKit đọc
  fixture từ `round87-o8/headed` như G9/F9). Log:
  `round106-h9-suites.log`, `round106-h9-o8.log`, poll log
  `round106-h9/poll.log`, recounts `round106-h9/recounts.log`,
  phân tích B-band H4 `round106-h9/analyze-h9-h4-bband.py` +
  `analysis-h9-h4-bband.json/.txt`.

## 1. Kiểm chứng trên cây gộp

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 8,74 s** |

### 1.2 Suite offline (log `hidden_files/round106-h9-suites.log`)

| test | kết quả |
|---|---|
| playheadHold90R2 | **75 passed**, exit 0 |
| playheadPacing54K9 | **19 pass, 0 fail**, exit 0 |
| previewEngine | 18 test passed (mask) + **27 test passed** (rvfc), exit 0 |
| seek | **21 passed**, exit 0 |
| seekSkipRender86N3 | **9/9 test pass**, exit 0 |
| previewLoop50F2 | **20 passed**, exit 0 |
| ghostBlend.probe | **15 kiểm chứng xanh**, exit 0 (log có 2 section 10 + 15 — số cuối 15, khớp G9) |
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
| deint-verdict-100b7 (B7) | **pass 13, fail 0**, exit 0 |
| armHeld99a3 (A3) | **pass 16, fail 0**, exit 0 |
| vite-diagnosis-regex (X6) | pass **9**, fail 0, exit 0 |
| xvfb-lock | **PASS (không lỗi)** ngay lần 1, exit 0 |
| test-preview-engine.sh (Z8, chạy đúng qua script) | **EXIT 0, 354 assertions pass** |

**Tổng: 27/27 mục exit 0 ngay lần đầu** (không mục nào cần chạy lại).
0 dòng "not ok" trong toàn bộ log. Verify chạy 16:16:46–16:21:13Z trên
boot `63a52041` (sau reboot #33); không reboot trong lúc verify. RAM
lúc verify 546 MB → suite vẫn xanh hết dù RAM thấp.

### 1.3 O8 — 21/21 cả 2 engine (log `hidden_files/round106-h9-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium (lần 1) | 16:21:47Z | **exit=2 — LỖI SETUP CỦA H9, không phải lỗi sản phẩm:** thiếu fixture trong scratch mới (chưa copy `o8-white-720p-6s.mp4`, `o8-ball-720p-6s.mp4`, `o8-track-35-65.json`); script dừng ở pre-check, chưa đo gì |
| Chromium (chạy lại) | 16:23:07–16:24:06Z | **21/21 pass, 0 fail, exit 0** ngay lần chạy lại (fixtures đã copy, md5 khớp G9) |
| WebKit | 16:21:48–16:22:50Z | **21/21 pass, 0 fail, exit 0** ngay lần đầu |

Số Δx khớp **đúng từng chữ** với O8 của G9 trên cây trước (chr S5
Δx=0,112, S7 0,112/0,113; wk S5 Δx=0,194, S7 0,194/0,197) — code H5
(chỉ sửa comment) và H6 (chỉ thêm log harness) trong cây **không làm
lệch mask-track**. E0: 0 lỗi JS/pageerror/crash cả 2 engine. 0 dòng
"retry" trong log O8 (trừ lần 1 do thiếu fixture).

## 2. Bảng về đủ + đối chiếu từng luồng

| luồng | trạng thái | LIMITS/batch | đối chiếu H9 |
|---|---|---|---|
| H1 Re-arm A/B RAM cao | **CHƯA VỀ** — dữ liệu thô trên đĩa, không LIMITS/batch | watcher + probe-results f6r/f7 + phân tích CAP | §2.1 — trigger hợp lệ, 2 lượt đều bị loại (H5 sửa file giữa lượt); watcher chết do reboot |
| H2 2 MiB queue2 | **CHƯA VỀ** — dữ liệu thô trên đĩa, không LIMITS/batch | h2-run.log + gst/pull log + results JSON (chỉ có 3 case lỗi) | §2.2 — 3/3 run lỗi, 0 chuỗi "queue2" trong GST log; H2EXT/H2C8 không chạy |
| H3 Zombie gate (b) | **CHƯA VỀ** — dữ liệu thô trên đĩa, không LIMITS/batch | analysis-y1.txt + results y1; y2 không có results | §2.3 — y1: zombie Δ=0 (12/12), kill trực tiếp median 0,20 ms (mới); gate (b) vẫn chưa quan sát được |
| H4 Blur B-band c0 | **CHƯA VỀ** — dữ liệu thô trên đĩa, không LIMITS/batch | 4/5 lượt probe + weights JSON | §2.4 — H9 tính lại B-band: Fisher p=0,3545 KHÔNG ĐẠT; D floor 0/2371; weights không giải thích cụm A |
| H5 Ghost | **VỀ ĐỦ** | LIMITS 15:12Z + batch 4 entry | §2.5 — KHỚP toàn bộ |
| H6 Harness | **VỀ ĐỦ** | LIMITS 15:18Z + batch 3 entry | §2.6 — KHỚP toàn bộ |
| H7 EPERM | **CHƯA VỀ** — dữ liệu thô trên đĩa, không LIMITS/batch | probe-notes.txt + scan wfs 3 chuẩn | §2.7 — probe #25 ok=2 fail=0; scan xong (1.038 hit); xác nhận #32 = 14:31:52Z |
| H8 Kiểm chứng chéo | **CHƯA VỀ — không có gì trên đĩa** | chỉ poll.log 14:40Z | §2.8 — không cross-check, không O8; chết cùng reboot, không quay lại |

### 2.1 H1 — Re-arm: trigger hợp lệ, 2 lượt đều bị loại (dữ liệu thô)

- Watcher `wait-hiram.sh` (không sửa): check 1–3 RAM tăng dần
  792 → 1.158 → 2.228 MB; check 4 lúc 14:42:04Z **TRIGGER:
  avail 2.425.576 kB ≥ 2.400.000, load1 3,98 < 4,0, sibProcs 0**
  (sát ngưỡng load đúng 0,02 — hợp lệ nhưng mong manh).
- Hiram chạy f6r (gop250) + f7 (gop30), xong 14:44:38Z, exit 0 cả 2.
  CAP đếm lại từ `cap-pattern-rows.json`: **f6r 3** (ages 5181/5159/
  5007), **f7 2** (5020/5111) → 2,50 CAP/lượt vs baseline F5 2,80
  CAP/lượt (máy yên).
- **NHƯNG cả 2 lượt đều bị H1 tự loại:** file `FAILED-MTIME-f6r.txt`
  + `FAILED-MTIME-f7.txt` đều ghi `MTIME-ĐỔI-GIỮA-LƯỢT` — H5 sửa
  `preview.tsx` lúc 14:43:56Z, đúng giữa lượt f7 (và đuôi f6r).
  Theo tiêu chí H1 (lượt chỉ hợp lệ nếu mtime không đổi trong lượt),
  **2,50 CAP/lượt KHÔNG được trích làm số A/B hợp lệ**. Đây là nhiễu
  chéo giữa 2 luồng song song (H5 sửa file H1 đang đo) — đợt sau:
  luồng sửa `preview.tsx` phải báo trước / các luồng đo phải chốt
  md5 trước khi chạy (H1 đã làm đúng phần mình — ghi
  previewMtimeBefore và tự loại lượt).
- Watcher chết do reboot #33 trước khi hết 50 check (dự kiến tới
  ~15:17Z). H1 không quay lại viết LIMITS/batch sau reboot.
- **Kết luận H1:** A/B RAM cao VẪN MỞ (không có lượt hợp lệ nào);
  kế hoạch đã đăng ký vẫn đứng, chạy lại watcher NGAY sau reboot
  (bài học G4 — lần này trigger đã bắt được ở check 4, chỉ 2'15"
  sau khi bắt đầu, nhưng lượt đo bị nhiễu chéo + reboot cắt).

### 2.2 H2 — 2 MiB: 3/3 run lỗi, queue2 không xuất hiện (dữ liệu thô)

- 3 run `Lc2-h2Q-blobE-run1..3` (14:48:06–14:48:11Z, TRƯỚC reboot)
  đều lỗi `page.evaluate: Target page, context or browser has been
  closed` — trình duyệt chết không rõ nguyên nhân (không phải
  reboot; có thể OOM/Xvfb dưới tải 8–10 luồng). Results JSON
  `benchmarks/results/webkit-blob-flaky-106h2-2mib.json` (1.380 B)
  chỉ chứa 3 case lỗi, **0 phép đo nào thành công**.
- GST log 3 run đều tồn tại nhưng **0 chuỗi "queue2"** trong cả 3
  (grep -c = 0/0/0) — không có bằng chứng queue2 nằm trong pipeline
  đã log; nhưng các run chết trước khi play nên log có thể chưa tới
  đoạn pipeline đầy đủ → **không kết luận được queue2 có/không**,
  chỉ ghi được "0 hit trong log lỗi".
- H2EXT (đuôi `.mp4` vs không đuôi) và H2C8 (c8 splice offset)
  **không chạy**. File results JSON tồn tại nhưng CHƯA stage (H2
  chưa về).
- **Kết luận H2:** 2 MiB VẪN MỞ, không thêm bằng chứng mới nào;
  queue2 vẫn chỉ là ứng viên chưa chứng minh (như G6).

### 2.3 H3 — Zombie: y1 xong, kill trực tiếp đo được lần đầu (dữ liệu thô)

- y1 seek-across: **23/23 biên bắn đủ** (driver đã sửa — F4 chỉ
  bắn 2/23). Phân tích `round106-h3-analysis-y1.txt` (21 KB) đếm
  lại từ H9:
  - Zombie Δ = **0 ở 12/12 biên đo được** (chỉ biên chẵn→lẻ có caps;
    biên lẻ→chẵn None vì dbgFinal chỉ có clip chẵn).
  - Capture trong cửa sổ clip lẻ: **0/12 cửa sổ, 0 capture**
    (nối tiếp G2: 0/24).
  - skip-clip-inactive: **0**; pump events 362 (capture 324,
    skip-stale-frame 38).
  - **Độ trễ kill TRỰC TIẾP (E4b) — lần đầu đo được:** n=12,
    min 0,10 / **median 0,20** / max 1,00 / mean 0,27 ms (so với E4
    gián tiếp 23–123 ms qua A6 — trực tiếp nhanh hơn ~100×; số E4
    cũ là đo qua proxy, không phải độ trễ kill thật). **Caveat:**
    chỉ 12/23 seek có kill entry — toàn seek lẻ (k=1,3,…,23); 11
    seek chẵn "KHÔNG TÌM THẤY kill entry (kills=12)". Mẫu này chưa
    giải thích (có thể kill chỉ log cho clip chẵn, hoặc cửa sổ tìm
    hẹp) — đừng trích "kill 0,2 ms" mà không kèm "n=12/23, chỉ seek lẻ".
  - Kill latency fbAt−b_k: −84..+12 ms (đa số −20..+15 ms).
  - E4a: tick stale **0/11**; cap STALE-CANVAS 23/23 — nhưng cap có
    thể là frame giữ trước nhảy, chỉ tick mới chứng minh draw (theo
    chính phân tích H3).
  - gstd D = **0/787** (mọi clip) — nối tiếp D floor post-fix.
- y2 pause-burst (f4y3 rerun): chỉ có `vite-attempt1.log`, **không
  có results** — chết do reboot (log "chờ yên" tới 14:51:28Z rồi dừng).
- Gate (b) đóng băng trong khi playhead chạy tự do: **KHÔNG có mục
  quan sát nào trong analysis y1** (y1 là seek-across, không phải
  test freeze); y2 không chạy → **VẪN MỞ, chưa quan sát được lần nào**.
- **Kết luận H3:** driver seek-across đã sửa xong (23/23); kill trực
  tiếp đo được nhưng mẫu lệch (chỉ seek lẻ); gate (b) vẫn mở.

### 2.4 H4 — Blur: H9 tính lại B-band từ dữ liệu thô (H4 chưa về LIMITS)

- 4/5 lượt theo prereg đã xong: r39 (caps=98, mtimeChanged=true —
  H5 sửa comment giữa lượt; prereg vẫn gộp vì F3 tắt), r39c0
  (caps=28), r40c0 (caps=37), r40 (caps=224). r41c0 chết do reboot,
  không results. `weights106h4.json` đã viết.
- **B-band — H9 tính lại bằng ĐÚNG phương pháp G7 §B** (script
  `round106-h9/analyze-h9-h4-bband.py`: cùng baseline noblur W3/Z5,
  cùng BANDS, cùng cửa sổ pair-like [0,70–0,76)):
  - H4: r39 B=17, r39c0 B=4, r40c0 B=11, r40 B=37 → **B=69, D=0**.
    Theo clip: c0 31 (pair 1); c1 20 (2); c2 18 (1).
  - Gộp F6+G7+H4: **c0 72 (pair 5); c1 62 (6); c2 54 (2)**.
  - **Fisher một phía (c0>c2): p=0,3545 — KHÔNG ĐẠT bar p<0,05.**
    Tệ đi so với G7 (p=0,22): H4 thêm 31 B-cap c0 nhưng chỉ 1
    pair-like, trong khi c2 thêm 18 B-cap với 1 pair-like — tỉ lệ
    pair-like c0 tụt từ 9,8% xuống 6,9%.
  - Còn thiếu tới ~115/nhóm: **c0 43, c2 61 B-cap**.
  - Cờ heterogeneity c0-only vs c0 3-clip (gộp G7+H4): **4/39 vs
    1/33, Fisher hai phía p=0,3662 — KHÔNG còn dấu hiệu lệch**
    (G7: 4/24 vs 0/17, p=0,13). H4 riêng: c0-only 0/15 vs c0
    3-clip 1/16 — cờ G7 đã loãng hẳn, 2 thiết kế vẫn gộp được.
  - **D floor gộp: 0/2371** (0/2041 + H4 0/330); Fisher vs pre-fix
    28/1547: p=4,32e-12; 95% CI trên 0,127%.
- Weights cụm A (đọc `weights106h4.txt`): w trung bình ≈
  **[1/3, 1/3, 1/3] ở mọi filter** (BILINEAR R² med 0,156; NEAREST
  −0,185; BOX 0,096); g_live trung bình 0,640 vs dự đoán triple
  đều 0,589 — **KHÔNG giải thích được thành phần content thật của
  cụm A (g≈0,44)**: fit triple-weights yếu, g_live vẫn lệch +0,05.
  Hướng "triple liên tiếp + nhãn rải rác" (G7 §7 mục 1) chưa được
  chứng minh hay bác bằng weights này.
- **Kết luận H4:** B-band c0 VẪN MỞ (p=0,35, còn thiếu 43+61);
  D floor vững hơn (0/2371); cụm A vẫn mở.

### 2.5 H5 — Ghost: KHỚP toàn bộ

- Comment đã sửa đúng số: "0/30" còn 4 chỗ trong `preview.tsx`,
  tất cả nằm trong câu đính chính (grep); marker 104f3 50 dòng /
  58 lần; rawAnchor 13 dòng, tất cả comment; `F3AnchorSrc` vẫn
  `"tap" | "pump" | "frameIdx"` — **chỉ sửa comment, 0 dòng code**.
- Analyzer mới: run B 89/122 = **73,0%** (cũ 70,8%), rawAnchor
  distinct 20/31 = **64,5%** (cũ 0/11) — khớp mọi occurrence 66,7%;
  đếm lại từ `analyze-h5-runB.txt` ✓. Bias dedup HẾT.
- Flip-leg cây land: C2 **100/146 = 68,5%**, C2b **97/154 = 63,0%**,
  gộp 197/300 = 65,7% (đếm lại từ `analyze-flip-h5-runC2*.txt` ✓).
  Bar ≥70% và ≥ D+20pt = 68,6%: C2 trượt cả 2 chân trong gang tấc
  (−0,5pt / −0,1pt) → **KHÔNG ĐẠT, H5 kết luận đúng**. Suy luận chặn
  dưới G1 §4.3 KHÔNG bị bác (tụt phủ 92,4% → 83,2%/82,4% + tải
  nặng đi cùng chiều; fallback C2 67,0% ≈ rawAnchor C 73,8% ≈
  frameIdx B3 70,0%).
- Hồi quy H5 tự đo (tsc 0, vite 12,43s, ghostBlend 15/15,
  previewEngine 27/27) được H9 kiểm chứng độc lập trên cùng cây ở
  §1 (tsc 0/0, vite 8,74s — chênh thời gian do tải, ghostBlend
  15/15, previewEngine 18+27) ✓.
- **Kết luận H5:** flip-leg VẪN MỞ, phụ thuộc tải — cần đo lại lúc
  máy yên; analyzer mới dùng từ nay; spread đuôi lỏng max ~75 vẫn mở.

### 2.6 H6 — Harness: KHỚP toàn bộ

- E1 run4–10: **7/7 report JSON pass 10/10**; playMax 174/213/56/
  198/148/60/43 ms khớp bảng LIMITS; G3→G4 gap min 1,724 /
  median 2,221 / max 2,329 s khớp "1,72–2,33s, trung vị 2,22s".
- G4-probe: đếm lại trực tiếp **38 dòng** trên 7 lần chạy ✓.
- Flake gộp **2/28 = 7,1%**; Wilson 95% H9 tính lại [2,0%–22,6%]
  ≈ "~2–23%" ✓. 0/7 mới KHÔNG bác tỉ lệ cũ (P(0/7 | p=1/10)
  ≈ 48%) — H6 kết luận đúng.
- Keydown: mới 9 runs / 110 slots / 220 toggles / max 213 ms /
  retry 0 ✓; gộp 49/671/1342/max 1004 ms ✓.
- Đính chính G3: giờ reboot #29 = **08:56:39Z** đã chèn vào
  `docs/PHASE9_ROUND105_G3_HARNESS_LIMITS.md` (grep thấy khối đính
  chính + bằng chứng) ✓.
- H6 tự ghi lỗi driver `summ_e1` IndexError ×7 — đúng, số đã khôi
  phục đủ từ JSON (H9 đếm lại khớp).
- **Kết luận H6:** G4 flake VẪN CHƯA BIẾT cơ chế; probe mới đã land
  và hoạt động đúng (ngân sách đường khỏe 1,7–2,3s đã đo); cần lần
  chạy dưới tải nặng để bắt mẫu flake có probe.

### 2.7 H7 — EPERM: probe #25 xong, scan xong (dữ liệu thô)

- Probe #25 (14:39:40Z, boot 75697729): **ok=2 fail=0**, exit 0 —
  heartbeat n=25, ALIVE, age 0s (trước đó DEAD/STALE, n=24,
  ts 11:38:22Z, age 10.878s).
- **Xác nhận độc lập reboot #32 = 14:31:52Z** (uptime -s + boot_id
  75697729, đo 14:39:33Z và 14:39:40Z) — khớp H6/prereg.
- Scan writeFileSync (chuẩn mới, xong 14:46:45Z): newstd **154 file /
  494 dòng**; r7b **171 file / 519 dòng**; copies **17 file / 25
  dòng**; tổng 1.038 hit (cộng lại từ 3 file `wfs-*.txt`, khớp
  `scan-meta.txt`). Chênh newstd vs r7b (17 file / 25 dòng) là DO
  THIẾT KẾ (r7b chỉ loại release*/bundled-server/assets ở gốc, newstd
  loại mọi cấp) — không phải lỗi; H7 chưa viết LIMITS nên chưa có
  kết luận đối chiếu nào để kiểm.
- Mù #24 (từ 11:38:22Z): probe #25 chạy trên boot 75697729 (bắt đầu
  14:31:52Z) — mù #24 CHƯA ĐÓNG trong dữ liệu H7 (cần probe trên
  boot sau 14:50:59Z, chưa có).
- **Kết luận H7:** probe #25 xong; mù #24 vẫn mở; cần probe #26.

### 2.8 H8 — Kiểm chứng chéo: KHÔNG CÓ GÌ trên đĩa

- Chỉ có `poll.log` 14:40Z (ghi "bắt đầu", boot 14:31:52Z, RAM
  ~849 MB) — không cross-check H2/H4, không O8, không file nào
  khác. Chết cùng reboot #33, không quay lại.
- **Kết luận H8:** không có kết quả gì để đối chiếu; phần cross-check
  H2/H4 do H9 làm thay trong LIMITS này (§2.2, §2.4).

## 3. Đính chính + ghi chú (H9)

1. **Reboot #33 = 14:50:59Z (boot 63a52041), gap #32→#33 = 19'07"
   — NGẮN NHẤT từng ghi**, phá sàn cũ 31'47" (#30→#31). H6 ghi
   đúng (reboot này là #33). Số #32 vẫn mang tính tạm như H1/H6
   đã caveat: gap #31 (11:26:40Z) → #32 (14:31:52Z) = 3h05'12",
   dài hơn chu kỳ ~2h nên không loại trừ reboot trung gian không
   quan sát được; H7 xác nhận boot_id + giờ #32 bằng 2 phép đo
   trực tiếp nhưng số thứ tự vẫn dựa trên prereg.
2. **H5 ghi boot H5 "reboot tiếp theo dự báo ~16:33Z"** — sai: reboot
   #33 tới lúc 14:50:59Z, chỉ 19 phút sau boot #32 (dự báo ~2h đã
   vỡ). Không ảnh hưởng số đo H5 (flip C2/C2b chạy xong trước
   reboot).
3. **H1 ghi "preview.tsx md5 f0b9e496 lúc watcher start"** — đúng lúc
   đó; nhưng H5 sửa file lúc 14:43:56Z nên md5 lúc hiram kết thúc
   là ced42efd — H1 đã ghi đúng trong log (`preview-md5=ced42efd`
   lúc 14:44:38Z).
4. **G9 đợt 105 ghi "boot 3e4f237a suốt, không reboot cắt ngang"** —
   vẫn đúng cho đợt 105; reboot #32 (14:31:52Z) xảy ra SAU khi G9
   xong (12:2xZ), không mâu thuẫn.
5. **O8 Chromium lần 1 exit=2 là lỗi setup của H9** (quên copy
   fixture vào scratch mới) — không phải lỗi sản phẩm; lần chạy lại
   21/21 ngay. Bài học cho H9 đợt sau: copy fixture + verify md5
   TRƯỚC khi chạy O8 (G9 đã làm đúng bước này).
6. **Số "2,50 CAP/lượt" của H1 không được trích** — cả 2 lượt đều bị
   loại theo tiêu chí H1 (mtime đổi giữa lượt). Chỉ ghi để cho thấy
   trigger đã bắt được và hiram đã chạy.
7. **Kill trực tiếp 0,20 ms (H3) không thay thế số E4 gián tiếp
   23–123 ms** — hai phép đo khác nhau (killTs−tSeekRaw trực tiếp
   vs suy qua A6); số trực tiếp mới n=12/23 và chỉ seek lẻ.

## 4. Production đổi đợt này

| file | luồng | đổi gì | md5 |
|---|---|---|---|
| `apps/web/src/preview.tsx` | H5 | Chỉ sửa 6 comment sai số "0/30 clean" → "70,4% ≈ frameIdx 70,0%" + ghi artifact dedup | f0b9e496 → ced42efd |
| `apps/web/scripts/clicktest-77e1-deint-fps.mjs` | H6 | Thêm log chẩn đoán G4 (G4-probe + waitIdleTraced); không đổi ngưỡng/luồng đo | 4ba1d86c → ae6cd34a |
| `apps/web/scripts/analyze106h5-ghost.py` | H5 | Mới — analyzer distinct đã sửa (dedup theo labelSrc + mọi occurrence) | cf8217cc (mới) |
| `apps/web/scripts/analyze106h5-ghost-flip.py` | H5 | Mới — analyzer flip đã sửa (như trên + thêm "rawAnchor" vào vòng lặp labelSrc) | 85f1b607 (mới) |
| `apps/web/scripts/probe106h3-frame-parity.mjs` | H3 | Mới — driver zombie (chưa có LIMITS đi kèm) | d848ee46 (mới) |
| `apps/web/scripts/probe106h4-frame-parity.mjs` | H4 | Mới — driver blur (chưa có LIMITS đi kèm) | bbf1e745 (mới) |
| `docs/PHASE9_ROUND105_G3_HARNESS_LIMITS.md` | H6 | Sửa đính chính giờ reboot #29 (08:56:39Z) | — |
| `docs/PHASE9_ROUND106_H5_GHOST_LIMITS.md` | H5 | Mới | — |
| `docs/PHASE9_ROUND106_H6_HARNESS_LIMITS.md` | H6 | Mới | — |
| `docs/PHASE9_ROUND106_H9_VERIFY_LIMITS.md` | H9 | Mới (file này) | — |

Không luồng nào sửa production khác. Không file
`.github/workflows/*` nào đổi. Không binary nào stage.

## 5. Nợ mở cho đợt 107 (gộp từ H5/H6 + dữ liệu thô H1–H4/H7/H8)

1. **Đợt 106 dở dang: 6/8 luồng chưa về LIMITS/batch** (H1, H2, H3,
   H4, H7, H8) — dữ liệu thô đã có trên đĩa (trừ H8). Đợt 107 ưu
   tiên: H1 viết LIMITS từ dữ liệu f6r/f7 (ghi rõ 2 lượt bị loại) +
   chạy lại watcher; H3 viết LIMITS y1 (kill trực tiếp + zombie Δ)
   + chạy y2 pause-burst; H4 viết LIMITS B-band (lấy số H9 đã tính
   ở §2.4) + chạy r41c0/r41; H2 chạy lại H2Q/H2EXT/H2C8; H7 viết
   LIMITS probe #25 + scan + chạy probe #26 (đóng mù #24); H8 chạy
   lại cross-check + O8.
2. **Re-arm A/B RAM cao — VẪN MỞ.** Không lượt hợp lệ nào đợt này
   (H1 bị loại cả 2 lượt). Chạy lại watcher NGAY sau reboot; luồng
   sửa `preview.tsx` phải báo trước để luồng đo tránh nhiễu chéo.
3. **2 MiB queue2 — VẪN MỞ.** 0 bằng chứng mới đợt này (H2 3/3 run
   lỗi). Chạy lại H2Q với browser ổn định hơn; kiểm tra GST_DEBUG
   queue2:5 như prereg.
4. **Zombie gate (b) — VẪN MỞ.** Chưa quan sát được lần nào (y1
   không phải test freeze; y2 chưa chạy). Kill trực tiếp đo được
   (median 0,20 ms, n=12/23 chỉ seek lẻ) — cần mẫu đủ 23/23 + giải
   thích vì sao seek chẵn không có kill entry.
5. **Blur B-band c0 — VẪN MỞ (p=0,3545).** Còn thiếu c0 43 / c2 61
   B-cap tới ~115/nhóm. Cờ heterogeneity hết ý nghĩa. Cụm A g≈0,44
   vẫn chưa giải thích (weights ≈ đều, R² thấp).
6. **Ghost flip-leg trên cây land — VẪN MỞ, phụ thuộc tải.** Đo lại
   lúc máy yên (protocol C2, analyzer mới). G1 vẫn chờ user quyết
   metric G5/M2 (nợ từ đợt 105).
7. **G4 flake — VẪN CHƯA BIẾT cơ chế (2/28 = 7,1%).** Probe mới đã
   land; đợt sau chạy E1 dưới tải nặng (load ~15+) để bắt mẫu flake
   có probe. Keydown chậm nhất vẫn 1004 ms (0/1342 toggle fallback).
8. **EPERM — probe #26 + đóng mù #24.** Mù #22 chờ user quyết giữ
   "đóng" hay "đóng có điều kiện" (nợ từ đợt 105).
9. **Reboot #33 phá sàn gap (19'07").** Chu kỳ reboot không còn ~2h
   ổn định — các luồng đo dài phải chia lượt nhỏ + lưu kết quả sớm
   (H3/H4 đã làm đúng phần này; H1/H2/H7/H8 mất LIMITS vì chưa kịp
   viết).
10. **Nợ đứng yên từ đợt 105:** birefnet 0 lần (chỉ thử lại khi RAM
    đổi); TTS 39 CẤM kiểm lại; ci-security.yml 403 chờ user; release
    gate không đổi (KHÔNG release/tag cho tới khi ngang/hơn CapCut).

## 6. Batch stage (KHÔNG push) + tổng chờ push

- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round106-h9-verify.txt`
  (NUL-delimited, 1 entry — LIMITS này, read-back OK).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round106-h9/`
  (poll.log, poll.sh, verify.sh, o8.sh, suites.log, o8.log,
  recounts.log, recount-push.py, analyze-h9-h4-bband.py +
  analysis-h9-h4-bband.json/.txt, o8-chromium/, o8-webkit/).
- **Tổng chờ push (đếm lại trực tiếp từ đĩa, script recount-push.py):**
  đợt 67–106: **390 batch / 2500 entry / 1528 file duy nhất**, 0 thiếu
  trên đĩa. (Trước đợt 106, sau PUSH #5: 387/2492/1523; đợt 106:
  3 batch / 8 entry / 5 unique mới — H5 4 + H6 3 + H9 1 entry.)
  Chưa lên GitHub: các batch đợt 106 + file oversize
  `benchmarks/results/webkit-blob-flaky-96x3.json` (6.370.678 B).
  HEAD vẫn a7308ee9. KHÔNG push.
