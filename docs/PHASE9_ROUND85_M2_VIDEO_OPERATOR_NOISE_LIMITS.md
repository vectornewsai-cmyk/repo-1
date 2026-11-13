# Phase 9 đợt 85 — Luồng M2: Danh tính toán tử video + noise Δcorr ở thang ~2

**Ngày:** 2026-11-11 (lượt cron 06:35 +07). **Repo:** `~/workspace/repo-1`, branch main.
**KHÔNG push, KHÔNG release/tag, KHÔNG sửa production.** Mọi số dưới đây đều đo thật
trên VM (Chrome 158 / Chromium 1254, SwiftShader/CPU, 4 vCPU EPYC 9D25).

## 0. Kết luận ngắn

1. **Toán tử video = BILINEAR (kernel tam giác), pha φ ≈ −0,03 px nguồn** so với quy ước
   canvas `S = (i+0,5)/s`. Không phải Mitchell/BC/Lanczos. Độc lập với chất lượng
   (`high` = `low` byte-identical mọi probe), đẳng hướng (x = y), luma = chroma
   (bước chuyển chroma fit triangle, độ rộng bằng luma — không scale chroma riêng
   ở nửa phân giải). Đây là scaler nội bộ của Chrome, không phải code của repo →
   **không có gì để sửa trong production**.
2. **Δcorr ở s ≈ 2,26 KHÔNG phải hiệu ứng thang, KHÔNG phải đường plain/video, mà là
   artifact ghép cặp render sai ma trận trong harness của L2.** Snapshot L2 so với
   render **bt601 đúng** (từ đúng clip nguồn) thì KHỚP-THỐNG-KÊ cả noise05 và noise10
   (Δcorr ≤ 0,013). Giả thuyết "nhiễu tương quan theo thang" **bị bác**: Δcorr phẳng
   theo thang ở mọi thang đo. **Không sửa production.**
3. **Phần dư sóng dày vẫn mở** (sau hiệu chỉnh φ*: ≤ 1,2 MAD sóng 2px, ≤ 0,5 MAD
   sóng 4px): có hệ thống, dạng sóng, không giải thích được bằng họ kernel, sai thang,
   hay lượng tử hoá trọng số. Xem §2.5.
4. **L2 §3 sai**: "chênh tương quan tăng theo thang" là sai — Δcorr phẳng theo thang;
   nguyên nhân là H3 đổi ma trận (đợt 80) + L2 đổi nguồn sang clip native 640 mà
   không đổi render.

Ngưỡng verdict dùng xuyên suốt (E9/F6): stdRatio ∈ [0,85, 1,18], |Δkurt| ≤ 0,35,
|Δcorr| ≤ 0,12.

---

## 1. Nhiệm vụ 1 — Danh tính toán tử video

### 1.1 Phương pháp

- **Media tổng hợp có ground truth** (`r85m2-gen-media.py`, ffmpeg yuv420p libx264
  crf 0, 640×360, 60 frame, 2s): stepV/H-gray, lineV/H-gray, impulse-gray
  (nền 128, đặc trưng 200 / bậc 64→192), stepV-colorCb/Cr (Y ≈ 128 theo bt709),
  sóng vuông `sqw2/4/8-mid` + `sqw4x-mid` (64/192, chu kỳ 2/4/8 px),
  `ocean-{plain,noise05,noise10}.mp4` (encode từ frame render F6).
- **Probe A headed** (`r85m2-video-operator-headed.mjs`, 2026-11-11 00:14:32Z):
  Xvfb :190–199, HTTP 5691, debug 9771, Chromium 1254. 7 clip × 15 dump,
  thang explicit s ∈ {1,125; 1,5; 2,25; 3,0} + CTM s = 2,2639 (1449×815),
  chỉ grab strip quanh đặc trưng. `currentTime = 0, seekableEnd = 0` (giới hạn seek
  của `python http.server`, đã biết từ L2 §5.5); nội dung tĩnh nên frame 0 = frame 30
  (đã verify qua B).
- **Probe sóng headed** (`r85m2-wave-headed.mjs`, 00:25:31Z, HTTP 5693, debug 9773):
  5 clip × 18 dump, thêm thang 1,2638889 (809×455, đúng thang editor).
- **Kiểm chứng phương pháp:** B-vs-nguồn MAD = 0 với clip xám (clip màu MAD 0,5,
  max 2 — do làm tròn yuv420p); đối chứng canvas-high = Mitchell chính xác
  (MAD 0,000–0,004) → pipeline đo đã validate.

### 1.2 Kernel fit trên vạch/bậc rời rạc — triangle thắng rõ

Fit model kernel lên profile 1D của video dump (MAD, n = số điểm profile):

| clip / thang | video-tri | video-Mitchell | video-BC(0,25/0,375) | canvas-Mitchell |
|---|---|---|---|---|
| lineV s=1,125 | 0,008 | 0,017 | 0,014 | 0,001 |
| lineV s=1,5 | ~0,005 | ~0,017 | ~0,014 | ~0,001 |
| lineV s=2,25 | ~0,008 | ~0,019 | ~0,020 | ~0,001 |
| lineV s=3 | 0,005 | 0,019 | 0,020 | 0,001 |

(Toàn bộ: video-tri MAD 0,004–0,015 ở mọi thang và mọi clip line/step;
Mitchell 0,012–0,034; B-spline 0,037–0,055; Lanczos3 0,038; box 0,052–0,060;
Gauss σ=1,0: 0,082–0,084. `video-high` = `video-low` giống hệt mọi trường hợp.)

- **φ* ≈ −0,02..−0,04** (sweep φ trên triangle): lineV s=1,5 φ=−0,03 MAD
  0,0052→0,0029; s=2,25 φ=−0,04 MAD 0,0076→0,0009; stepV s=1,5 φ=−0,03
  0,0083→0,0009; s=2,25 φ=−0,03 0,0056→0,0003.
- **K_eff tự do** (trọng số rời rạc đã chuẩn hoá w(i,320) của pixel vạch, pha
  t = S − 320,5, gộp mọi thang, 51 điểm pha / 48 bin): đỉnh K_eff = 1,0 tại t = 0,
  về 0 tại |t| = 1 (đúng support của triangle); so sánh với trọng số rời rạc
  của ứng viên trên cùng nguồn vạch tổng hợp — **tri MAD 0,011**, Mitchell 0,027,
  BC 0,028, Catmull-Rom 0,037, Lanczos2 0,038, B-spline 0,062, Lanczos3 0,071,
  box 0,094, Gauss 0,147. Tổng trái 4,28 vs phải 3,668 (chênh 0,612 — phù hợp
  pha lệch φ ≈ −0,03).
  - *Đính chính phương pháp:* bản đầu của mục K_eff so sánh curve đo với
    K_eff liên tục (kernel⊛box) và pha tâm vạch sai (S − 320 thay vì S − 320,5).
    Đã sửa: so với trọng số rời rạc chuẩn hoá, pha đúng — kết quả trên là bản sửa.
- **Chroma:** step Cb/Cr fit triangle MAD 0,002–0,007, độ rộng chuyển tiếp bằng
  luma → chroma KHÔNG scale riêng ở nửa phân giải.
- **Lưu ý thiết kế:** clip "Y hằng" chỉ hằng theo bt709; theo bt601 (ma trận
  encode/decode thật) Y dao động ±7,1 (clip Cb) / ±14,5 (clip Cr). Không ảnh
  hưởng kết luận kernel (fit dùng profile từng kênh).

### 1.3 `sqw4-640.mp4` không phải sóng 1D

Nửa trên (y 0–179) là sọc DỌC (sóng theo X, chu kỳ 4px), nửa dưới (y 180–359)
là sọc NGANG (sóng theo Y, chu kỳ 4px); giá trị 64/192, xám sạch, tĩnh
(frame 0/15/30/45 giống hệt). Phân tích 1D strip-H trên toàn khung là sai cho
nửa trên — đã sửa bằng cách chỉ fit nửa dưới (nguồn y 200–350) và dùng thang
thật s = dstLen/srcLen (s = 1,2638889 thì s_x = 809/640 = 1,2640625).

### 1.4 Phần dư sóng dày — sau φ* vẫn còn, có hệ thống (MỞ)

Video-tri trên sóng dày MAD 0,33–2,65 (so với 0,01 trên vạch rời rạc);
canvas-Mit 0,03–0,35 (sàn nhiễu làm tròn uint8).

**Tách φ khỏi ε** (`r85m2-wave-refine.mjs`): φ* ≈ −0,02..−0,04 nhất quán,
ε* ≈ 0,0001 (≈ 0) → **pha hằng, không phải sai thang**. Sau φ*:
sqw4-mid 0,10–0,50; sqw2-mid 0,88–1,22 (tệ nhất); sqw8-mid 0,05–0,68.
Canvas-Mit φ = 0 MAD 0,03–0,35, φ* = 0 → phù hợp sàn làm tròn.

**(h,φ) sweep** (`r85m2-wave-hphi.mjs`): h* ≈ 0,97–1,01 (đa số 0,98),
φ* ≈ −0,02..−0,03. Cải thiện: sqw4-mid s=1,5: 0,44→0,147; s=2,25: 0,098→0,052;
sqw8 s=1,125: 0,676→0,009 (h=0,94, φ=−0,06); nhưng sqw2-mid vẫn 0,3–1,0.
Tự tương quan phần dư = ±1 tại lag = chu kỳ sóng → **phần dư có hệ thống,
dạng sóng, không phải nhiễu làm tròn**.

**Lượng tử hoá trọng số** (`r85m2-wave-quant.mjs`): q6/q7/q8/q16-bit KHÔNG giải
thích nhất quán. q6 cho đúng MAD = 0 tại s = 2,25 cho sóng 4/8px — điểm đơn lẻ,
có thể trùng hợp hình học (9/4) — nhưng không cải thiện ở thang khác; sqw2-mid
vẫn ~1,1. Giả thuyết libyuv điểm cố định bị bác ở dạng tổng quát.

**Kiểm chứng (h,φ) trên vạch rời rạc** (inline node): lineV s=1,5 (0,99, −0,03)
MAD 0,0029 vs (1,0) 0,0052; s=2,25 (1,00, −0,04) 0,0009 vs 0,0076; stepV s=1,5
(0,98, −0,03) 0,0009 vs 0,0083; s=2,25 (1,01, −0,03) 0,0003 vs 0,0056.
→ h ≈ 1, φ ≈ −0,03 đúng cả trên vạch rời rạc; **h = 0,98 trên sóng có thể chỉ
đang hấp thụ phần dư tuần hoàn, không phải kernel thật**. Kết luận giữ:
**kernel = triangle h = 1, φ ≈ −0,03**; phần dư sóng dày (≤ 1,2 MAD sóng 2px /
≤ 0,5 MAD sóng 4px sau φ*) **chưa đóng**.

### 1.5 Hệ quả cho mô hình parity

Đường video mô hình bằng **triangle + φ ≈ −0,03** thay vì Mitchell. Không sửa
production (toán tử là của Chrome). Luồng sau muốn đóng phần dư sóng dày cần
probe mới (ví dụ: sóng dày với pha nguồn dịch chuyển, hoặc đo trực tiếp trọng
số rời rạc trên sóng — không dùng vạch rời rạc nữa).

---

## 2. Nhiệm vụ 2 — Noise Δcorr ở thang ~2

### 2.1 Phân rã snapshot L2 (offline, `r85m2-noise-decompose.mjs`)

Snapshot: `round84-l2/headed-w2560x1440-p640x360/r84l2-snaps-w2560x1440-p640x360.json`
(clean-scale2, s = 2,2639). So với render F6 bt709
(`round78-f6/render/ocean640/fullrgb-*.raw`):

| biến thể | gốc (base) | dP1: plain preview → model Mitchell | dP2: noise preview → model Mitchell |
|---|---|---|---|
| noise05 | LỆCH Δcorr [0,131, 0,017, 0,150] | LỆCH [0,112, 0,012, 0,152] | **KHỚP [0,013, 0,004, 0,003]**, stdRatio [1,01, 1,03, 1,00] |
| noise10 | LỆCH Δcorr [0,126, 0,020, 0,145] | LỆCH [0,115, 0,015, 0,148] | **KHỚP [0,001, 0,004, 0,002]**, stdRatio [1,00, 1,01, 1,00] |

- dP1 vẫn LỆCH → loại đường plain. dP2 KHỚP → thủ phạm nằm ở **trường nhiễu**.
- E_plain MAD = 5,34, std [3,42, 3,8, 1,97], corr [0,658, 0,243, 0,068],
  lagX [0,969, 0,979, 0,906].

### 2.2 Render bt601 từ đúng clip nguồn — KHỚP

Render mới bằng ffmpeg từ đúng clip `ocean640-crf10.mp4`
(decode → `noise=alls=28/50:allf=t` → frame 30 → `scale bt601` → rgb24;
`fullrgb-bt601-{plain,noise05,noise10}.raw`):

| biến thể | verdict | stdRatio | Δkurt | Δcorr |
|---|---|---|---|---|
| noise05 | KHỚP-THỐNG-KÊ | [0,98, 1, 1] | [0,17, 0,03, 0,08] | [0,002, 0,011, 0,013] |
| noise10 | KHỚP-THỐNG-KÊ | [0,97, 1, 1] | [0,20, 0,03, 0,09] | [0,005, 0,007, 0,012] |

E_plain MAD giảm 5,34 → **1,088** — phần lớn "plain ~5,3" của L2 cũng là
lệch ma trận, không phải toán tử video. Đối chứng s = 1,132 (F6, trước H3):
GỐC KHỚP Δcorr ≤ 0,007 — tái lập được.

**Cơ chế gốc:** render F6 dùng fullrgb **bt709 cứng**
(`scale in_color_matrix=bt709:out_color_matrix=bt709`, kể cả ocean640);
render G5 dùng ma trận theo chiều rộng (≤ 640 → bt601). L2 dùng clip native 640
`ocean640-crf10.mp4` (không có metadata màu → Chrome decode SD = bt601; editor
dùng bt601 đúng luật H3) nhưng so với render F6 bt709 (dẫn xuất từ nguồn 720p)
→ lệch. H3 (đợt 80) đã đúng cho clip native 640: G5 preview-bt709 vs render-bt601
cho G 0,81–0,86 LỆCH, sửa editor → bt601 thì 16/16 pass, G 0,97 KHỚP.

### 2.3 Quỹ đạo tương quan nhiễu theo thang — giả thuyết bị bác

`r85m2-noise-corr-scale.mjs`: tái tạo `addYuvNoise` CHÍNH XÁC từ
`apps/web/src/lib/effectCanvas.ts` (mulberry32 + Box-Muller, seed
`0x9e3779b9 ^ 30` tại localT = 1,0s, strength 27,5/50, sigma = strength/√3,
Cb/Cr 1 mẫu/khối 2×2 rồi Y từng pixel, kCb 1,04 / kCr 1,12).
Quỹ đạo corr theo s ∈ {1,0; 1,132; 1,5; 2,264; 3,0} dưới Mitchell:

- render corr phẳng [−0,036, 0,179, 0,171]; editor601 phẳng [−0,163, 0,192, 0,021];
- **Δcorr vs editor601 ≈ [0,127, 0,013, 0,151] ở MỌI s ≥ 1,132** (và
  [0,12, 0,018, 0,134] ngay tại s = 1,0);
- editor709 khớp render ở mọi thang (Δcorr ≤ 0,015).
- Replication khớp snapshot thật: editor601 corr [−0,163, 0,192, 0,021] vs
  prevCorr snapshot [−0,167, 0,196, 0,022]; std [22,37, 17,64, 29,14] vs
  [22,81, 17,66, 29,34].

→ **Δcorr phẳng theo thang. Giả thuyết "nhiễu tương quan theo thang" BỊ BÁC.**
L2 §3 "chênh tương quan tăng theo thang" là sai.

### 2.4 Probe B headed — 4 đường × 5 thang trên cùng B (đóng nợ L2 §5.2)

`r85m2-noise-scale-headed.mjs` (00:40:48Z, HTTP 5695, debug 9775, 54 dump) +
`r85m2-noise-scale-analyze.mjs`. B = frame render F6 (640×360) — cùng một B cho
mọi đường. 4 đường {explicit-canvas, ctm-canvas, explicit-video, ctm-video} ×
s ∈ {1,125; 1,5; 2,25; 3,0} + CTM s = 2,2639; grab crop giữa 320×180 (nhiễu dừng).
Model: Mitchell trên cùng B (canvas → B raw; video → Bv decode 1:1).

**Đường canvas — CTM-canvas ≈ Mitchell ở mọi thang (KHỚP 10/10):**

| thang | exp-canvas Δcorr | ctm-canvas Δcorr | deltaMad (ctm) |
|---|---|---|---|
| 1,125 / 1,5 / 2,25 / 3,0 | 0,000 | 0,000 | ≤ 0,002 |
| 2,2639 | — | 0,000–0,001 | 0,527 / 0,856 |

CTM-canvas tại thang "xấu" 2,2639 lệch tuyệt đối 0,5–0,9 MAD so với Mitchell
(trong khi các thang "đẹp" 9/8, 3/2, 9/4, 3/1 khớp tới 0,002) nhưng **Δcorr
vẫn ≈ 0, verdict KHỚP** — lệch CTM không giải thích Δcorr. Đây là cùng hiện
tượng L2 đo trên sqw4 (CTM-canvas vs Mitchell MAD ~0,4 ở s = 1,26).

**Đường video (triangle) vs Mitchell trên cùng Bv — KHỚP 9/10:**

| thang | stdRatio | Δkurt (tệ nhất) | Δcorr (tệ nhất) | deltaMad | plainMad |
|---|---|---|---|---|---|
| 1,125 | 0,98–0,99 | 0,26 | 0,008 | 1,8 / 2,9 | 0,58 |
| 1,5 | 0,96–0,97 | 0,07 | 0,004 | 1,6 / 2,6 | 0,50 |
| 2,25 | 0,99 | 0,21 | 0,008 | 1,8 / 2,9 | 0,47 |
| 2,2639 | 0,98 | 0,17 | 0,004 | 1,6 / 2,6 | 0,48 |
| 3,0 | 1,00–1,02 | **0,41 (G, noise05 — LỆCH)** / 0,33 (noise10) | 0,029 | 2,1 / 3,5 | 0,44 |

- Kernel triangle vs Mitchell chỉ tạo **Δcorr ≤ 0,008 (s ≤ 2,25), ≤ 0,029 (s = 3)**
  trên trường nhiễu — nhỏ hơn nhiều so với ngưỡng 0,12 và so với Δcorr 0,13–0,15
  của L2. Lệch duy nhất: s = 3 noise05, Δkurt kênh G 0,41 > ngưỡng 0,35 (sát
  ngưỡng; noise10 cùng thang 0,33 KHỚP).
- `exp-video` = `ctm-video` giống hệt ở mọi thang (CTM vs explicit không khác
  nhau trên đường video).
- **Bv vs raw** (decode 1:1): plain MAD 0,536; noise05 3,446; noise10 6,288 —
  vòng yuv420p làm suy giảm trường nhiễu (chroma trung bình 2×2), nên model cho
  đường video phải dùng Bv, không dùng raw.
- *Đính chính chạy:* lần chạy probe B đầu tiên vô hiệu cho đường video — một
  element `<video>` tái dùng cho cả 3 biến thể nên mọi đường video đều vẽ clip
  load cuối (noise10): stdRatio = 0, plainMad ≈ 28. Đã sửa (mỗi biến thể một
  element riêng) và chạy lại; số trên là bản chạy lại. Lần chạy đầu chỉ giữ lại
  kết quả đường canvas (không bị ảnh hưởng).

### 2.5 Hệ quả

- Render phải ghép đúng ma trận với ngữ cảnh decode của nguồn: clip native 640
  → fullrgb **bt601**; nguồn 720p scale trong chuỗi → bt709. Lệch ma trận là
  nguyên nhân duy nhất còn lại của Δcorr L2.
- Đường video (triangle) không tạo Δcorr đáng kể trên nhiễu; đường canvas
  (Mitchell) không tạo Δcorr ở bất kỳ thang nào. **Không sửa production.**

---

## 3. Giới hạn (LIMITS — đọc trước khi dùng số này)

1. **Chỉ upscale đẳng hướng, nội dung tĩnh.** Probe chỉ đo upscale (s ≥ 1,125),
   tỉ lệ x = y, clip tĩnh. Không đo downscale, không đo tỉ lệ không đẳng hướng,
   không đo nội dung chuyển động. Kết luận triangle + φ ≈ −0,03 chưa kiểm chứng
   ngoài miền này.
2. **Seek bị giới hạn:** `seekableEnd = 0` (do `python http.server` không hỗ trợ
   range seek đầy đủ); probe dùng frame 0, nội dung tĩnh nên frame 0 = frame 30
   (đã verify qua B). Không đo được frame giữa clip chuyển động.
3. **Môi trường đo:** Chrome 158 / Chromium 1254 trên VM SwiftShader/CPU
   (4 vCPU EPYC 9D25). Kernel/pha của Chrome có thể khác trên GPU thật, Chrome
   khác phiên bản, hoặc trình duyệt khác. Không đo Safari/Firefox.
4. **Phần dư sóng dày chưa đóng:** sau (h,φ)* còn ≤ 1,2 MAD (sóng 2px),
   ≤ 0,5 MAD (sóng 4px); có hệ thống, dạng sóng (tự tương quan ±1 tại lag =
   chu kỳ). Không giải thích bằng họ kernel, sai thang (ε* ≈ 0), hay lượng tử
   hoá trọng số (q6–q16). q6 cho MAD = 0 tại s = 2,25 cho sóng 4/8px là điểm
   đơn lẻ chưa giải thích (có thể trùng hợp hình học 9/4) — không dùng làm bằng
   chứng libyuv điểm cố định.
5. **Nhiễu chỉ đo trên ocean640** (một clip, một seed `0x9e3779b9 ^ 30` tại
   localT = 1,0s, strength 27,5/50). Chưa đo clip khác, seed khác, strength khác.
6. **Biên:** s = 3 noise05 LỆCH duy nhất trên Δkurt kênh G (0,41 vs ngưỡng 0,35)
   — sát ngưỡng, chưa rõ là hiệu ứng thật hay dao động lấy mẫu (crop 320×180).
   CTM-canvas s = 2,2639 lệch tuyệt đối 0,5–0,9 MAD so với Mitchell (thống kê
   vẫn KHỚP) — chưa rõ cơ chế (nghi pha/scale điểm cố định của Skia ở thang
   không "đẹp").
7. **Thiết kế clip màu:** "Y hằng" chỉ hằng theo bt709; theo bt601 Y dao động
   ±7,1 (Cb) / ±14,5 (Cr). Fit chroma dùng profile từng kênh nên không ảnh
   hưởng kết luận, nhưng số MAD chroma không so trực tiếp được với số luma.
8. **`sqw4-640.mp4` hai nửa khác nhau** (trên sọc dọc, dưới sọc ngang) — mọi
   phân tích 1D cũ trên toàn khung của clip này (kể cả đợt trước) đều bị nhiễm;
   số sóng trong doc này đã fit đúng nửa dưới.
9. **Không sửa production, không có test TS mới** — luồng này chỉ đo và viết
   doc + script probe; không chạm code TS nên không chạy `tsc` (không có gì để
   kiểm chứng bằng tsc).

## 4. Tệp evidence

- Doc này: `docs/PHASE9_ROUND85_M2_VIDEO_OPERATOR_NOISE_LIMITS.md`
- Script (repo `apps/web/scripts/`):
  `r85m2-gen-media.py`, `r85m2-video-operator-headed.mjs`,
  `r85m2-video-operator-analyze.mjs`, `r85m2-wave-headed.mjs`,
  `r85m2-wave-analyze.mjs`, `r85m2-wave-refine.mjs`, `r85m2-wave-hphi.mjs`,
  `r85m2-wave-quant.mjs`, `r85m2-noise-decompose.mjs`,
  `r85m2-noise-corr-scale.mjs`, `r85m2-noise-scale-headed.mjs`,
  `r85m2-noise-scale-analyze.mjs`
- Số liệu (không stage — evidence cục bộ):
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round85-m2/`
  `r85m2-video-operator.json` (7,7 MB), `r85m2-video-operator-analysis.json`,
  `r85m2-wave.json` (5,2 MB), `r85m2-wave-analysis.json`,
  `r85m2-wave-refine.json`, `r85m2-wave-hphi.json`, `r85m2-wave-quant.json`,
  `r85m2-noise-decompose.json`, `r85m2-noise-corr-scale.json`,
  `r85m2-noise-scale.json` (14,5 MB), `r85m2-noise-scale-analysis.json`,
  `media/` (mp4/.rgb/.raw/probe html/log)
- Tham chiếu: `docs/PHASE9_ROUND84_L2_MITCHELL_RESIDUAL_LIMITS.md`,
  `docs/PHASE9_ROUND84_L5_LINEART_EFFECT_CANVAS_PROBE_LIMITS.md`,
  `docs/PHASE9_ROUND80_H3_KERNEL_BC_PROBES_LIMITS.md`,
  `apps/web/scripts/chrome-resample.mjs`, `apps/web/scripts/r78f6-render-frames.mjs`,
  `apps/web/scripts/r79g5-render-frames.mjs`, `apps/web/src/lib/effectCanvas.ts`
  (`addYuvNoise`, `yuvMatrixForSourceWidth`).
