# Đợt 193 P2 — Enhance parity: sharpen trên nhiễu + warm-up thích nghi + deint bob-nearest

- **Luồng:** P2 đợt 193 (Phase 9 VCut build loop) — Editing Core, preview/render parity, đợt thứ 3 theo hướng mới (lệnh user 15:03 25/11).
- **Nền:** đợt 192 đã đóng, parent CHẤP NHẬN toàn bộ ở §14.2 aggregate `docs/PHASE9_ROUND192_LIMITS.md` (99.871 B; §14.2-192 nguồn gốc CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18; các lần sạch vẫn 179, 183, 191).
- **Kết quả chính (3 khoản theo §13-192):**
  1. **Sharpen trên nhiễu — KHÔNG cải thiện được, đã chứng minh bằng số:** 6 biến thể (V1–V6) đều không hơn V0 hiện tại ngoài sai số đo; `applySharpen` KHÔNG ĐỔI. Giới hạn gốc là mô hình Y_est (xem §2).
  2. **Warm-up thích nghi — ĐẠT, thay đổi lớn nhất đợt này:** alpha nhân thêm k(s, σ̂) nội suy trên lưới đo + warm-up đánh giá tại alpha hiệu dụng. Sai số tệ nhất: flat20 16,5 → **1,3**; flat40 53,6 → **1,2**; flat15 giữ −1,5; gauss15seq 2,0 → −1,6; natural15seq giữ 2,9. S2-warmup-s0.5 của P4 (đợt 192: +8,82) dự kiến về ~0,6–1,5 — trong bar 5,5 (xem §1.4, lưu ý cho P4-193).
  3. **Deint bob-nearest + bob-first — ĐẠT, đã ship:** bob-nearest thắng bob-bilinear mọi ô (MAD 3,10 → 2,55 inter f8; 4,00–4,56 → 3,55–4,11 inter15; le8 88–90% → 93–95%); bob-first thắng tap kèm denoise/stabilize mọi ô (12/12). Tap +0,5px trong `enhanceCanvas` đã BỎ. `mode: 1` @30fps đã đúng sẵn (MAD 0,000 vs mode=0); @60fps vẫn là giới hạn có số đo (xem §3.3).
- **Kiểm chứng:** `npx tsc --noEmit` 0 lỗi (apps/web); 11 suite enhance **155/155 pass** (đợt 192: 126/126; +15 test mới 91P2, +2 shape-lock cập nhật cho field mới); `npm run build` PASS (7,14 s); headed Chromium 1254 xác minh bob-nearest hai bước đúng ánh xạ (xem §4).
- **File đổi (6):** `apps/web/src/lib/enhancePreview.ts`, `apps/web/src/preview.tsx`, `apps/web/src/components/enhance/enhancePreview91P2.test.ts`, `.../enhancePreview60Q1.test.ts`, `.../enhancePreview62R3.test.ts`, LIMITS này. Không đụng file luồng khác. Không push (chỉ stage).

## §1. Warm-up thích nghi theo mức nhiễu — ĐẠT

### §1.1. Vấn đề (đợt 192 §5.6)

Alpha blend hiệu chuẩn trên flat15 (Y-std 8,25) nhưng trên footage nhiễu hơn, hqdn3d giảm tương đối ít hơn trong khi blend không đổi nên preview overstate: flat20 (Y-std 11,15) frame 3 s=0,5 sai **+16,5** điểm; flat40 (Y-std 22,69) tới **+53,6**. Warm-up bậc 2 đợt 192 chỉ sửa được hội tụ theo frame trên flat15, không sửa được lệch theo mức nhiễu.

### §1.2. Alpha-search: k phải là hàm 2 biến (s, σ)

Đo alpha lý tưởng (alpha-search, probe-193-p2 A1) trên flat15seq/flat20seq/flat40seq/gauss15seq (Y-std 8,25 / 11,15 / 22,69 / 8,63), f=0,1,2,8, s=0,3/0,5/0,8/1,0. Tỉ lệ steady-state alpha'/a(s):

| σ \ s | 0,3 | 0,5 | 0,8 | 1,0 |
|---|---|---|---|---|
| 8,25 (flat15) | 1,000 | 0,998 | 0,999 | 0,989 |
| 11,15 (flat20) | 0,526 | 0,628 | 0,766 | 0,787 |
| 22,69 (flat40) | 0,077 | 0,123 | 0,226 | 0,293 |

Một hệ số k chung theo σ KHÔNG đủ: k trung bình sửa được s=0,5 nhưng phá s=0,8/1,0 (probe A3: flat20 s=1,0 f=1 → −15,5). Lưới trên đã nhúng vào `enhancePreview.ts` (`DENOISE_ADAPTIVE_K_TABLE`, nội suy song tuyến, kẹp biên; σ < 8,25 → k≈1, giữ hành vi hiệu chuẩn cũ cho footage sạch).

Warm-up cũng phụ thuộc alpha hiệu dụng, không phụ thuộc σ riêng: ở alpha hiệu dụng, dạng warm-up gần như không đổi theo σ (flat20 s=1,0 f=1: tỉ lệ lý tưởng 0,757; bậc 2 tại a·k=0,772 cho 0,7527 — khớp trong 0,01). Công thức cuối: **alpha_final = a(s) · k2d(s, σ̂) · w(f, a(s)·k2d(s, σ̂))**, với w là bậc 2 hiện có (f=0 → 1/3; f≥3 → 1). Không truyền σ̂ → đúng hành vi cũ (k=1, w tại a).

### §1.3. Bộ ước lượng σ̂: E_full / 1,30

Thống kê E = mean |Δ| lân cận của luma bt709 (kề ngang + kề dọc, mỗi cặp 1 lần) trên frame gốc. Với nhiễu trắng Gauss σ, **E ≈ 1,30·σ** — đo trên 4 fixture flat: E/σ = 1,301 / 1,300 / 1,299 / 1,318 (sai < 1,5%). Kiểm tra chéo trên fixture khác: flat15 σ̂=8,26 (thật 8,25); flat20 σ̂=11,15 (thật 11,15); flat40 σ̂=22,67 (thật 22,69); gauss15seq σ̂=8,75 (thật 8,63).

Đã thử estB (hai tỉ lệ E96/E48): chính xác tương đương trên fixture phẳng nhưng trả về 0 trên mọi fixture có texture — LOẠI. estA được chọn: đơn giản, không phụ thuộc kernel downscale của trình duyệt, vẫn có nghĩa trên nội dung vừa texture vừa nhiễu. Sàn texture: natural sạch σ̂=1,97; natural15 σ̂=8,27 (→ k≈1, vô hại); step 0,31; step15 0,79; pattern15 6,07.

Triển khai trong preview (`estimateEnhanceNoiseSigma`, xem §6.1): đọc 3 dải ngang (y ≈ 0,2/0,5/0,8 chiều cao, mỗi dải 12 dòng, đủ chiều rộng) từ khung nguồn; ưu tiên held canvas (G1 đợt 79) khi drawSrc còn là video thô; đã qua chroma/LUT/effects thì đọc từ canvas đã xử lý; video không có held canvas thì vẽ 1 lần xuống scratch canvas native. Chỉ chạy khi denoise bật; cache 1 entry theo (clipId, frameIdx); mọi thất bại → null (giữ hành vi cũ, không đoán bừa). σ̂ phơi qua `plan.noiseSigma` / hook debug để P4 kiểm chứng.

### §1.4. Kết quả sau sửa (probe-193-p2e, sai số tệ nhất trên 16 ô seq×s×f)

| Fixture | Trước | Sau |
|---|---|---|
| flat15seq | −1,5 | −1,5 (không đổi) |
| flat20seq | 16,5 | **1,3** |
| flat40seq | 53,6 | **1,2** |
| gauss15seq | 2,0 | −1,6 |
| natural15seq | 2,9 | 2,9 (không đổi, k≈1) |

Ô mục tiêu: flat20 s=0,5 f=2: 16,5 → 0,7; s=0,8 f=2: 10 → 0,4; s=1,0 f=1: 1,9 → −0,4; s=1,0 f=2: 4 → −0,5. Tất cả trong bar 5,5 của P4.

**Lưu ý cho P4-193:** harness `parityHarness193.ts` hiện gọi `enhancePreviewPlan` với 5 đối số (không σ̂) — S2 đo lại PHẢI truyền σ̂ ước lượng của fixture làm đối số thứ 6 (dùng `estimateNoiseSigmaFromRgba` đã export, hoặc `noiseSigmaFromMeanAbsDiff` trên E đo được), nếu không sẽ đo hành vi cũ k=1. Fixture σ=15 của P4 (Y-std 11,23) → σ̂≈11,2 → k(0,5; 11,2)≈0,63 → S2-warmup-s0.5 dự kiến ~0,6–1,5 (đợt 192: +8,82). N3/N4/N5 của P4 không bị ảnh hưởng (flat15 k≈1; sharpen không đổi; deint xem §3).

## §2. Sharpen trên nội dung nhiễu — KHÔNG cải thiện được (chứng minh bằng số)

### §2.1. Các biến thể đã thử (probe-193-p2, probe-193-p2d; sanity: bản sao probe của `applySharpen` khớp code ship MAD 0)

MAD vs truth unsharp trên natural15 / pattern15 (t=0,5 / 1,0). V0 = code hiện tại:

- **V0 (hiện tại):** natural15 **1,551 / 2,461**; pattern15 0,838 / 1,163 — tốt nhất hoặc đồng tốt nhất mọi ô.
- **V1** (delta từ luma suy ra thay vì luma native): tệ hơn mọi ô trên nhiễu — natural15 1,809 / 2,939.
- **V2** (chỉ sửa pixel bị gamut-clip): tốt hơn ~1% — natural15 1,533 / 2,429; pattern15 0,826 / 1,149 — trong sai số đo, KHÔNG ship.
- **V2b** (V2, tol 1): như V2. **V3** (làm mịn trường offset): tệ hơn. **V4** (kernel Gauss σ=1,0): không hơn. **V5** (V2+V4): ~1%, như V2. **V6** (blur trên luma suy ra): tệ hẳn, nhất là nội dung sạch — natural sạch 0,138 → 1,281 (t=0,5); 0,152 → 2,274 (t=1,0).

### §2.2. Chuỗi nhân quả đo được (probe-193-p2d)

`applySharpen` làm việc trên luma SUY RA từ RGB (Y_est), trong khi truth unsharp chạy trên luma native YUV. mean|Y_est − Y_native| = **2,063** trên natural15 (so với Y_derived 3,326), 1,154 trên pattern15, 0,918 trên natural sạch; độ lệch chuẩn sai số Y_est trên natural15 = **2,708**. Phần dư do chroma native từng pixel không thể biết được (subsampling 420) + gamut clipping — canvas chỉ cho RGB, không cho mặt phẳng YUV native. Không có cách sửa rẻ nào: mọi biến thể hoặc không chạm được vào nguồn sai số (V2/V4/V5, ~1%), hoặc phá thêm (V1/V3/V6).

**Quyết định: `applySharpen` KHÔNG ĐỔI.** N4 của P4-192 (MAD 0,966/1,111 trên fixture của P4) vẫn đứng. Giới hạn còn lại: sharpen preview trên nội dung nhiễu lệch MAD ~1,5–2,5 ở t=0,5–1,0 so với render; muốn hơn cần truy cập YUV native (VideoFrame YUV planes / WebCodecs) — nợ lớn, không làm trong đợt này.

## §3. Deint: bob-nearest + bob-first + mode 1

### §3.1. Bob-nearest thắng bob-bilinear (probe-193-p2c C1, MAD vs yadif mode=0)

| Fixture | bilinear | nearest |
|---|---|---|
| inter f3 / f7 / f8 / f11 | 2,702 / 3,003 / 3,096 / 2,786 | **2,316 / 2,508 / 2,552 / 2,237** |
| inter le8 | 91% | **95%** |
| inter15 f3 / f7 / f11 | 3,998 / 4,025 / 4,56 | **3,626 / 3,548 / 4,107** |
| inter15 le8 | 88% | **93%** |
| interbar | 0,000 | 0,000 (cả hai khớp yadif đúng) |

Vẫn tier XẤP XỈ (cần MAD ≤2 & le8 ≥99% mới KHỚP). Đã ship: bước upscale cuối của bob nay tắt smoothing (nearest) thay vì bilinear.

### §3.2. Bob-first thắng tap kèm denoise/stabilize (probe-193-p2c C2, truth yadif→hqdn3d)

Bob TRƯỚC rồi mới blend denoise/zoom trên khung đã bob (khớp thứ tự render yadif → hqdn3d), thay cho tap +0,5px trong `enhanceCanvas`. Bob-first-nearest tốt nhất cả 12 ô (inter + inter15, s=0,5/0,8, f3/f7/f11): vd inter s=0,5 f=3: tap 4,679 → bob-first-bilinear 4,57 → **bob-first-nearest 4,261**; inter15 s=0,8 f=11: tap 8,717 → 8,074 → **7,863**. Tap +0,5px đã BỎ khỏi `enhancePreviewSource` (bỏ tham số `deintTap` + `tapDy`); hằng `ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX` giữ lại cho test 75C8 + tương thích.

### §3.3. `deinterlace: { mode: 1 }` — đo xong, không ship thay đổi

- Ở project 30fps / nguồn 30fps: render mode=1 qua fps=30 cho frame **Y HỆT mode=0 (MAD 0,000 cả 16 frame)** — preview hiện tại (bob-top) đã đúng, không cần làm gì.
- Ở project 60fps: cần luân phiên field theo frame output; bob luân phiên MAD **2,795** vs bob-top-only 3,305 so với yadif mode=1 — luân phiên giúp nhưng KHÔNG ship được đúng vì app không có fps nguồn (`MediaItem` không lưu fps — chỉ có duration/width/height; luân phiên chỉ đúng khi projFps == 2× inputFps, nguồn 60fps sẽ sai). **Nợ:** thêm fps vào probe/import media (`media.ts` MediaItem); P1-193 không liên quan.

## §4. Kiểm chứng headed bob-nearest (Chromium 1254, CDP)

Đợt 192 chỉ chứng minh được bước 1 (downscale nearest giữ top field); bước 2 chưa chứng minh được vì half của mẫu xen kẽ đồng nhất 200 nên mọi cách upscale đều ra 200. Đợt này dùng mẫu phân biệt được (`headed-bob-nearest-check.mjs`, kết quả `headed-bob-nearest-result.json` — bản sao ở `hidden_files/round193-p2/`):

- Half XÂY TRỰC TIẾP xen kẽ 200/50 → upscale smoothing-OFF ra đúng **[200,200,50,50,200,200,50,50,200,200,50,50]** (line doubling); smoothing-ON ra nội suy [200,163,88,88,163,...] — phân biệt rõ.
- Nguồn canvas mẫu CẶP (dòng 0-1: 200, 2-3: 50, ...) → half [200,50,200,50,...] (top field) → hai bước OFF ra đúng **[200,200,50,50,...]**; hai bước ON ra [200,163,88,...].
- Nguồn video `rowpat-pair.mp4`: frame [214,214,38,38,215,215,40,40] (cặp giữ qua encode) → half [214,38,215,40,...] → hai bước OFF **[214,214,38,38,215,215,40,40,...]** — đúng.
- Hồi quy 192: nguồn xen kẽ → half toàn 200, full OFF toàn 200 (đúng — top field đồng nhất).
- Thời gian 640×360: hai bước (half+full) 569,3 ms/1000 lần = **0,57 ms/frame**; baseline chỉ-half không đo được trong setup này (canvas không được đọc lại nên Chromium hoãn raster — 2,8 ms/1000, không phải chi phí thật). Kết luận an toàn: lần vẽ full-res nearest thêm vào tốn **tối đa 0,57 ms/frame** (~1,7% ngân sách 33 ms @30fps, headless software raster — chỉ thị, không phải FPS trên app thật).

## §5. Giới hạn còn lại / nợ

1. **Sharpen trên nhiễu:** giới hạn Y_est (§2.2) — không sửa rẻ được; cần YUV native mới hơn được. MAD ~1,5–2,5 ở t=0,5–1,0 trên nội dung nhiễu.
2. **Deint vẫn tier XẤP XỈ:** MAD 2,24–4,11, le8 93–95% (cần ≤2 & ≥99% mới KHỚP). Bob-nearest là tốt nhất trong các cách canvas làm được; hơn nữa cần yadif thật trong preview (nợ lớn).
3. **`mode: 1` @60fps:** gap MAD 3,31 (top-only) / 2,80 (luân phiên) vs yadif mode=1; cần fps nguồn — nợ thêm fps vào `MediaItem` (probe/import).
4. **Bộ ước lượng σ̂:** texture dày tần số cao có thể đẩy σ̂ trên 8,25 và làm under-denoise nhẹ — hướng an toàn (ít denoise hơn, không over-blur). Lưới k hiệu chuẩn ở 320×180; σ̂ không phụ thuộc tỉ lệ (mean |Δ| theo pixel) nhưng lưới chưa kiểm lại ở khổ lớn.
5. **FPS headed đường bob chưa đo lại** trên app thật (nợ như P2-192 §5.4) — chỉ có chi phí 1 lần vẽ thêm ≤0,57 ms/frame @640×360 (§4).
6. **P4-193 phải cập nhật S2** để truyền σ̂ vào plan (xem §1.4) — nếu không sẽ đo hành vi cũ.

## §6. Thay đổi code + kiểm chứng

### §6.1. `apps/web/src/lib/enhancePreview.ts`

- Lưới `DENOISE_ADAPTIVE_K_SIGMAS/STRENGTHS/TABLE` + `denoiseAdaptiveK(strength, noiseSigma)` (nội suy song tuyến, kẹp biên; σ̂ không hữu hạn → 1).
- Bộ ước lượng: `DENOISE_ESTIMATOR_MEAN_ABS_DIFF_PER_SIGMA = 1.3`, `meanAbsLumaNeighborDiff(data, w, h)`, `noiseSigmaFromMeanAbsDiff(E)`, `estimateNoiseSigmaFromRgba(data, w, h)`.
- `denoiseWarmupFactor(frameIndex, strength, noiseSigma?)`: khi có σ̂, bậc 2 đánh giá tại alpha hiệu dụng a·k; không σ̂ → đúng hành vi cũ.
- `enhancePreviewPlan(..., noiseSigma?)`: alpha = a(s)·k·w(f, a·k); thêm field `noiseSigma: number | null` vào `EnhancePreviewPlan` + `EnhancePreviewDebug` (null = không ước lượng). Tham số tùy chọn nên harness 191/192/193 + lời gọi cũ (5 đối số) không đổi gì.
- Comment đầu file cập nhật (warm-up thích nghi §193, bob-nearest + bob-first, mode 1); comment hằng `ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX` ghi rõ tap không còn dùng trong preview.tsx (giữ export cho test 75C8).

### §6.2. `apps/web/src/preview.tsx`

- Mới `deintBobNearestSource(src, w, h)` (canvas tái dùng `deintBobCanvas`): bước 1 tái dùng `deintIntermediateSource` (half nearest, top field), bước 2 upscale nearest lên canvas full-res dw×dh. Downstream không đổi gì (mọi drawImage sau đều chỉ rõ dw×dh; G7b mask giữ nguyên hình học vì bob canvas full-res như drawSrc thường).
- Mới `estimateEnhanceNoiseSigma(drawSrc, srcEl, clip, frameIdx)` + cache 1 entry + scratch canvas (xem §1.3).
- `drawVideoClip`: ước lượng σ̂ (chỉ khi denoise bật) → truyền vào plan; **bob-first**: khi `enhPlan.deinterlaceTap` thì bob-nearest TRƯỚC (nguồn ưu tiên held canvas G1 như trước), rồi mới offscreen denoise/stabilize trên khung đã bob; stage mới `"deint-bob-nearest"` (stage cũ `"deint-intermediate"` không còn dùng ở đâu).
- `enhancePreviewSource`: bỏ tham số `deintTap` + `tapDy` (chỉ có 1 call site); import `ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX` đã bỏ; thêm import `denoiseStrengthOf`, `meanAbsLumaNeighborDiff`, `noiseSigmaFromMeanAbsDiff`.

### §6.3. Test

- `enhancePreview91P2.test.ts`: +15 test mới (lưới k, kẹp biên, nội suy; warm-up tại a·k; plan với/không σ̂; estimator trên buffer 2×2 + phẳng; hook debug mang noiseSigma) — **35/35 pass** (trước 20/20).
- `enhancePreview60Q1.test.ts` + `enhancePreview62R3.test.ts`: cập nhật shape-lock (plan 11 → 12 key, debug +`noiseSigma`; assert `noiseSigma === null` khi không truyền) — đúng quy ước khi thêm field (như đợt 191 với `denoiseWarmupFactor`).
- Toàn bộ 11 suite enhance: **155/155 pass** (59P8 21/21, 60Q1 16/16, 61R3 7/7, 62R3 10/10, 63R3 8/8, 75C8 14/14, 76D4 10/10, 77E1 11/11, 91P2 35/35, 61R2 9/9, 64R2 14/14).
- `npx tsc --noEmit` (apps/web): **0 lỗi** (đã sửa 1 lỗi shape: `enhancePreviewDebugState` thiếu `noiseSigma`).
- `npm run build` (apps/web): **PASS** (7,14 s; cảnh báo chunk >500 kB có sẵn, không liên quan).
- Probe: `/tmp/round193-p2` (probe-193-p2*.mjs + fixture); bản sao probe + script/kết quả headed ở `~/workspace/goals/capcut-clone-video-editor/hidden_files/round193-p2/`. Số đo bằng ffmpeg 8.1.2 / node 24.22.1 / Chromium 1254.

## §7. Hướng cho đợt sau

- P4-193: cập nhật S2 truyền σ̂ (xem §1.4); kiểm N3/N4/N5 như thường (N4 sharpen không đổi, N5 deint kỳ vọng MAD ~2,5–4,1 / le8 ~93–95%).
- Đợt 194 P2 (nếu tiếp tục enhance parity): (a) thêm fps vào `MediaItem` rồi ship bob luân phiên cho mode 1 @60fps; (b) đo FPS headed đường bob trên app thật; (c) sharpen YUV-native chỉ khi có đường VideoFrame YUV (nợ lớn — cân nhắc kỹ trước khi làm).
