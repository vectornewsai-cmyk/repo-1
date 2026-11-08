# Phase 9 đợt 64 R9 — Phân rã lệch noise headed do x264 + sharpen viewport

Ngày: 2026-11-08. Luồng R9, đợt 64. **KHÔNG push, KHÔNG release/tag,
KHÔNG binary vào batch.** Đóng nợ đợt 63 R8 §8 mục 1+2
(xem `docs/PHASE9_ROUND63_R8_YUV_NOISE_LIMITS.md` §8):
noise headed vẫn LỆCH-THỐNG-KÊ do x264 làm mượt nhiễu render ~2× trên
R/B (chưa phân rã); sharpen viewport le8 94–97% < 99% nên chưa KHỚP.

## 0. Kết luận tóm tắt (đọc mục này là đủ)

| Câu hỏi | Trả lời bằng số đo |
|---|---|
| x264 có phải nguyên nhân chính của lệch noise headed? | **KHÔNG.** Trên nền phẳng, x264 CRF 18 chỉ làm mất **7–9%** std nhiễu (veryfast; medium chỉ **1%**). Trên nội dung thật headed, đổi CRF 18 → CRF 0 (lossless) chỉ thu hẹp tỉ lệ std từ 2.95 → 2.73 (R, w1440) — codec chiếm **~7%** của lệch (tính theo log). |
| Vậy lệch ~2–3× trên R/B do đâu? | Phân rã nhân tử (w1440, noise05, kênh R, tỉ lệ preview/render 2.95): **codec 1.08× (~7%)** × **resampler extract bilinear→lanczos 1.44× (~34%)** × **kẹp chroma-rail của YUV native 1.34× (~27%)** × **Chrome-high giữ HF tốt hơn cả lanczos 1.41× (~32%)** = 2.95 ✓ (khớp nhân tử). Chi tiết §3–§5. |
| Có preset/CRF nào làm headed KHỚP được không? | **KHÔNG** — không một combo nào trong 8 combo (4 preset × CRF 0/12/18/23) đạt KHỚP-THỐNG-KÊ ở bất kỳ cửa sổ nào, kể cả **lossless CRF 0**. Tốt nhất: medium CRF 18 ≈ CRF 0 (bảo toàn nhiễu gần như tuyệt đối), nhưng vẫn LỆCH do 3 nguyên nhân còn lại. Không nới ngưỡng đo. |
| Sharpen viewport có KHỚP được không (le8 ≥ 99%)? | **KHÔNG** với mọi scaler/preset/CRF đã thử. Tốt nhất **98.6%** (w1920, sharp05, CRF 0, scaler area, MAD 0.297). Lossless cải thiện le8 rõ (+1–2 điểm) nhưng không đủ; scaler tốt nhất chỉ hơn bilinear ~0.1–1.7 điểm. Giả thuyết "sharpen sau downscale" bị **bác bỏ dứt khoát** (le8 1.2–1.8%). |
| Mô hình preview có sai không? | **Không sai ở full-res.** `applyNoise` thật trên frame 30 cho std [24.34, 18.63, 27.45] — khớp chuỗi tham chiếu không-codec [24.43, 18.63, 27.11], KHÔNG khớp render-native [18.18, 18.65, 23.46]. Sharpen full-res đã khớp từ R63 (MAD 0.278). Lệch headed là lệch **đường đo + kẹp YUV native**, không phải lệch mô hình màu. |

## 1. Phương pháp — tái dùng snapshot R63, không chạy lại headed

- `effectCanvas.ts` (mtime 02:54 08/11) và `preview.tsx` (03:43 08/11)
  **không đổi kể từ đợt 63** → snapshot preview headed R63
  (`hidden_files/round63-r8/headed/w{1440,1920,2560}/r63-preview-snaps.json`)
  vẫn hợp lệ; không chạy lại browser (tránh tốn VM đang tải bởi 10 luồng
  song song đợt 64). Tái tạo baseline: veryfast CRF 18 bilinear cho ra
  **đúng số R63 đến 2 chữ số thập phân** (vd w1440 noise05 [2.95, 1.35,
  2.24] = R63) — chuỗi đo tái lập được.
- Harness mới: `apps/web/scripts/parity-64r9-noise-x264.mjs` — 3 phần:
  **(A)** codec-only trên nền phẳng 128 (30 frame, alls=28/50; lấy mẫu
  thưa step-4 ≈ 1,7M mẫu, sai số chuẩn của std ~0,05%);
  **(B/C)** render thật bằng `server/render/src/render.js` (8 combo × 5
  variant = 40 render, ~30–90 s/render do VM tải) + extract frame 30 với
  6 scaler + chẩn đoán thứ tự sharpen; đối chiếu snapshot R63.
- Follow-up (chẩn đoán tay, script + log giữ tại
  `hidden_files/round64-r9/r64r9-followup{1,2,3}.mjs` + `r64r9-run*.log`):
  (FU1) tái tạo đúng chuỗi tiền-xử-lý render.js rồi gỡ từng mắt xích;
  (FU2) phân biệt RGB-roundtrip vs frame-index vs kẹp;
  (FU3) `applyNoise` thật ở full-res + noise với scaler extract khác.
- JSON đầy đủ: `hidden_files/round64-r9/r64r9-report.json`
  (16 noise + 58 sharpen mục/cửa sổ; Part A + Part B/C).
  Lưu ý: lượt chạy 3 (chỉ Part A) đã ghi đè JSON của lượt chạy 2 — phần
  B/C trong JSON hiện tại được **tái tạo từ log lượt 2** (parser đối chiếu
  từng dòng, đủ 16+58 mục/cửa sổ, khớp số in log); file render/frame trên
  đĩa vẫn còn để kiểm tra lại.

## 2. Phần A — codec-only trên nền phẳng: x264 gần như không làm mất nhiễu

Nguồn: `color=0x808080` 1280×720 30 frame; chuỗi `format=yuv420p →
noise → encode libx264 → decode → rgb24 bt709`; delta = noisy − plain
(cùng encode setting). Tham chiếu không-codec: cùng chuỗi ra rawvideo.

| alls=28, tham chiếu không-codec | std [33.97, 20.78, 38.16] | kurt [−0.10, 0.08, −0.10] | corr [0.159, 0.270, 0.301] |
|---|---|---|---|

Tỉ lệ std tham-chiếu/render (1.00 = không mất gì):

| preset | CRF 0 | CRF 12 | CRF 18 | CRF 23 |
|---|---|---|---|---|
| ultrafast | 1.00 | 1.03 | **1.07–1.08** | 1.10 |
| superfast | 1.00 | — | 1.07–1.08 | — |
| veryfast | 1.00 | 1.04 | **1.09** | 1.12 |
| medium | 1.00 | 1.00 | **1.01** | 1.01–1.02 |

- alls=50: tham chiếu std [59.57, 37.43, 65.17], kurt [−0.52, 0.01,
  −0.69]; veryfast CRF 18: 1.05–1.06; medium CRF 18: **1.00–1.01**.
- **Kurtosis và corr KHÔNG đổi theo codec ở mọi setting**
  (|Δkurt| ≤ 0.02, corr giống đến 3 chữ số thập phân) — codec chỉ co
  std, không đổi dạng phân phối trên nền phẳng.
- **Preset quan trọng hơn CRF:** medium CRF 18 bảo toàn nhiễu gần như
  lossless (1%), trong khi ultrafast/veryfast CRF 23 mất 10–12%.
- Kết luận phần A: trên nội dung phẳng, "x264 làm mượt nhiễu ~2×" là
  **SAI** — tối đa 12% ở setting xấu nhất. Lệch headed ~2× phải đến từ
  nội dung + đường đo, không phải codec thuần túy.

## 3. Phần B — headed qua 8 combo: không combo nào KHỚP, kể cả lossless

Tỉ lệ std preview/render, noise05, extract bilinear (tiêu chí KHỚP:
tỉ lệ [0.85, 1.18] + |Δkurt| ≤ 0.35 + |Δcorr| ≤ 0.12):

### w1440 (downscale 2.62×)

| combo | noise05 tỉ lệ [R,G,B] | noise05 kurtΔ | noise10 tỉ lệ [R,G,B] | noise10 kurtΔ |
|---|---|---|---|---|
| veryfast CRF 0 | [2.73, 1.27, 2.07] | [7.30, 0.68, 3.58] | [2.19, 1.27, 1.82] | [3.55, 0.84, 2.08] |
| veryfast CRF 12 | [2.86, 1.31, 2.17] | [7.52, 0.67, 3.83] | [2.26, 1.30, 1.88] | [3.63, 0.82, 2.09] |
| veryfast CRF 18 (= R63) | [2.95, 1.35, 2.24] | [8.33, 0.67, 4.01] | [2.32, 1.32, 1.93] | [3.92, 0.80, 2.01] |
| veryfast CRF 23 | [2.88, 1.36, 2.29] | [9.25, 0.51, 3.96] | [2.37, 1.34, 1.97] | [4.08, 0.85, 2.10] |
| ultrafast CRF 18 | [2.96, 1.35, 2.27] | [7.94, 0.67, 3.94] | [2.32, 1.33, 1.93] | [3.74, 0.80, 2.21] |
| superfast CRF 18 | [2.95, 1.35, 2.28] | [8.55, 0.62, 4.18] | [2.33, 1.32, 1.94] | [3.78, 0.82, 2.10] |
| medium CRF 18 | [2.71, 1.26, 2.08] | [7.59, 0.67, 3.61] | [2.18, 1.27, 1.83] | [3.51, 0.83, 2.03] |
| medium CRF 0 | [2.73, 1.27, 2.07] | [7.30, 0.68, 3.58] | [2.19, 1.27, 1.82] | [3.55, 0.84, 2.08] |

- CRF 0 = medium CRF 0 đến 2 chữ số (lossless thì preset không còn ý
  nghĩa — kiểm chứng nội bộ tốt). **medium CRF 18 ≈ CRF 0** (2.71 vs
  2.73) — preset chậm cứu được gần hết phần codec.
- Codec chỉ đóng góp 2.95/2.73 = **1.08×** (R, noise05). KurtΔ R/B
  7–9 / 3.5–4.0 ở mọi combo — **kurt không bao giờ đạt**, kể cả lossless.
- corrΔ: RG đạt (≤ 0.08) ở mọi combo; RB vượt ở w1440 (0.148–0.178 >
  0.12), đạt ở w1920/w2560 — xem §5.

### w1920 (downscale 1.58×) và w2560 (upscale 1.35×) — tóm tắt

| | noise05 CRF 18 | noise05 CRF 0 | noise10 CRF 0 |
|---|---|---|---|
| w1920 tỉ lệ | [2.27, 1.33, 1.81] | [2.10, 1.25, 1.66] | [1.75, 1.24, 1.51] |
| w2560 tỉ lệ | [2.07, 1.10, 1.73] | [1.89, 1.03, 1.59] | [1.60, 1.02, 1.46] |

- Ở w2560 (upscale), kênh G **đạt** (1.02–1.03) ngay cả CRF 18 — lệch
  còn lại tập trung ở R/B. Đây là manh mối dẫn tới §4 (kẹp chroma).
- corrΔ ở w2560 noise10 vượt nhẹ (RB 0.158–0.162, GB 0.135–0.138).

## 4. Phân rã sâu — kẹp chroma-rail của YUV native (FU1 + FU2)

Câu hỏi: tại sao CRF 0 full-res vẫn yếu hơn chuỗi không-codec trên R/B?
(refCheck: alls=28: không-codec std [24.43, 18.63, 27.11] kurt [2.66,
0.11, 2.66] vs CRF 0 render std [18.18, 18.65, 23.46] kurt [5.73, 0.09,
3.61]; alls=50: [44.05, 30.66, 48.10] vs [37.06, 30.76, 44.31]. Kênh G
**giống hệt** ở cả hai — chỉ R/B lệch.)

- **FU1:** tái tạo đúng chuỗi render.js (trim/scale/pad/fps/format +
  noise) và gỡ từng mắt xích (chỉ scale+format, chỉ format, ép bt709,
  ép bt601) → **tất cả cho cùng một số [18.23, 18.58, 23.57]**; frame
  plain các case **byte-identical** (delta std [0,0,0]). Vậy không phải
  scale/matrix/fps — mà là **nơi áp noise**: trực tiếp trên YUV native
  đã decode (B–F) vs trên YUV vừa convert từ RGB (A).
- **FU2:** T1 (noise trên đúng 1 frame yuv gốc) = T2 (noise trên stream
  rồi select frame 30): [18.22, ...] = [18.23, ...] → frame-index/RNG
  thời gian **không phải** nguyên nhân. T3 desaturate nguồn
  (saturation 0.3): A [31.76, 20.13, 37.04] ≈ D [31.71, 20.10, 37.09]
  → **hội tụ khi hết bão hòa** → nguyên nhân là kẹp (clipping).
- **FU2 T4 — bằng chứng trực tiếp:** ở base YUV native của testsrc2,
  **31.3% mẫu U và 30.9% mẫu V đang chạm rails** (≤16 hoặc ≥240),
  trong khi base qua RGB-roundtrip có **0%**. Y: 0% cả hai (nên kênh G
  không lệch — khớp refCheck).
- Cơ chế: noise `alls` cộng Gauss vào plane U/V rồi kẹp
  `av_clip_uint8` — ~31% mẫu chroma đã ở rails nên nhiễu bị cắt một
  phía → std U/V thực tế giảm → R/B (phụ thuộc mạnh vào V/U) giảm
  26%/13%, đồng thời phân phối thành **hỗn hợp 2 phương sai** (vùng
  railed vs không) → kurtosis phình (R 2.66 → 5.73). Preview
  `addYuvNoise` tính YUV từ RGB đã decode (float, không qua subsample
  rails) nên không chịu kẹp này — xem FU3 (1).
- **FU3 (1):** chạy `applyNoise` thật lên frame 30 RGB: t=0.5 cho
  [24.34, 18.63, 27.45] kurt [2.81, −0.02, 2.74] — **khớp chuỗi A**,
  không khớp render-native. t=1.0: [67.27, 44.79, 74.35]. Mô hình
  preview đúng; lệch là do 2 đường áp noise lên 2 "base YUV" khác nhau
  (RGB-derived vs native-railed).

## 5. Resampler — extract bilinear của harness là một phần của lệch (FU3 (2))

Noise headed với scaler extract khác (render CRF 0, tỉ lệ std):

| scaler | w1440 noise05 | w1440 noise10 | w1920 noise10 | w2560 noise10 |
|---|---|---|---|---|
| bilinear | [2.73, 1.27, 2.07] | [2.19, 1.27, 1.82] | [1.75, 1.24, 1.51] | [1.60, 1.02, 1.46] |
| **lanczos** | **[1.89, 0.95, 1.45]** | **[1.58, 0.98, 1.33]** | **[1.27, 0.97, 1.12]** | **[1.17, 0.80, 1.08]** |
| bicubic | [2.08, 1.02, 1.58] | [1.71, 1.04, 1.44] | [1.37, 1.03, 1.21] | [1.26, 0.85, 1.16] |
| area | [2.30, 1.04, 1.78] | [1.87, 1.06, 1.59] | [1.69, 1.12, 1.48] | = bilinear (upscale fallback) |
| neighbor | [0.98, 0.44, 0.87] | [0.87, 0.46, 0.83] | [0.99, 0.65, 0.92] | [1.03, 0.73, 0.96] |

- **lanczos là scaler FFmpeg gần Chrome-high nhất:** std R/B cải thiện
  30–45% so với bilinear; ở w1920/w2560 noise10, std R/B **vào ngưỡng**
  [0.85, 1.18] (1.27/1.12 và 1.17/1.08 — R w1920 còn vượt nhẹ).
  Nhưng **kurtΔ vẫn fail ở mọi scaler** (lanczos CRF 0: R/B 2.0–5.9 /
  1.0–3.1) và G ở w2560 lanczos **vượt dưới** (0.79–0.80 < 0.85) —
  lanczos giữ HF tốt hơn bilinear cả ở kênh G, trong khi Chrome-high
  vẫn triệt G (xem dưới). Không scaler nào cho KHỚP-THỐNG-KÊ.
- **neighbor là bẫy:** std R/B khớp gần như hoàn hảo (0.87–1.03) nhưng
  G lệch nặng (0.44–0.77) và corrΔ vỡ (0.13–0.35) — neighbor không triệt
  nhiễu Y per-pixel trong khi Chrome có triệt → không dùng được.
- Hồ sơ suy hao theo kênh (w1440, noise05, tỉ lệ sau/downscale so với
  full-res): Chrome-high **(R 0.74, G 0.44, B 0.74)**; bilinear (0.36,
  0.35, 0.36); lanczos (0.52, 0.46, 0.60). Chrome giữ nhiễu khối chroma
  (R/B) gần gấp đôi bilinear, trong khi vẫn triệt nhiễu Y per-pixel (G)
  như lanczos — không scaler FFmpeg nào có cùng hồ sơ này. Đây là phần
  dư 1.41× trong phân rã §0.
- Tái tạo kiểm chứng: extract `area` ở w2560 cho đúng số bilinear R63
  ([2.07, 1.10, 1.73]) — area ở upscale rơi về bilinear, đúng hành vi
  FFmpeg.

## 6. Sharpen viewport — lossless + mọi scaler vẫn XẤP XỈ

Delta sharpen (preview_sharp − preview_plain vs render_sharp −
render_plain), tiêu chí KHỚP: MAD ≤ 2 và le8 ≥ 99%.

| cửa sổ | tốt nhất (le8) | MAD | le32 |
|---|---|---|---|
| w1440 sharp05 | 96.9% (CRF 0, bilinear/bicubic/lanczos/area — bằng nhau) | 0.375–0.400 | 100.0% |
| w1440 sharp10 | 95.3% (CRF 0 bilinear) | 0.554 | 99.7% |
| w1920 sharp05 | **98.6%** (CRF 0, area; MAD 0.297) | 0.297 | — |
| w1920 sharp10 | 96.8% (CRF 0 bilinear) | 0.502 | — |
| w2560 sharp05 | 97.9% (CRF 0 bilinear/area) | 0.355 | 99.9% |
| w2560 sharp10 | 96.7% (CRF 0 bilinear) | 0.600 | — |

- Lossless cải thiện rõ nhưng không đủ: w1440 sharp05 MAD 0.496 →
  0.380, le8 95.8% → 96.9%; w1920 sharp05 MAD 0.450 → 0.310, le8 96.9%
  → 98.5%; w2560 sharp05 MAD 0.525 → 0.355, le8 96.2% → 97.9%.
- Quét scaler (4 combo × 6 scaler × 3 cửa sổ × 2 variant): scaler tốt
  nhất chỉ hơn bilinear **0.1–1.7 điểm le8**; neighbor tệ nhất
  (92.8–95.2%). Không scaler nào ≥ 99%.
- Ở CRF 0, std delta render vẫn yếu hơn preview rõ ở downscale mạnh:
  w1440 sharp05 render [0.87, 1.34, 0.76] vs preview [2.44, 1.93, 2.07]
  (2.8×); ở upscale w2560 thì khớp ([2.81, 3.24, 3.51] vs [2.72, 3.08,
  3.79]). Cùng hồ sơ resampler như noise §5: Chrome-high giữ HF của
  sharpen tốt hơn bilinear.
- **Chẩn đoán thứ tự — bác bỏ dứt khoát:** downscale plain về viewport
  rồi unsharp tại đó cho delta MAD **7.7–8.6**, le8 **1.2–1.8%**, std
  render [7.18, 23.62, 12.14] vs preview [2.44, 1.93, 2.07] (G vọt
  12×) — preview KHÔNG hành xử như sharpen-sau-downscale. Thứ tự hiện
  tại (sharpen ở full-res rồi downscale) là đúng; không đổi.
- Phần dư le8 1.4–3% ở CRF 0 (không còn codec) là chênh kernel thực:
  unsharp FFmpeg 5×5 vs blur nhị thức [1,4,6,4,1] của preview, lộ ở
  biên tương phản cao + khác bộ lọc resample. MAD ≤ 0.6 (dưới xa ngưỡng
  2) nhưng le8 kẹt 95–99%.

## 7. Kiểm chứng + hồi quy

| Kiểm tra | Kết quả |
|---|---|
| effectCanvas unit | **14/14** |
| effectCanvas parity Node | **15/15** (chuỗi YUV, không đụng) |
| previewEngine | **14/14** |
| tsc apps/web | **0 lỗi** |
| vite build apps/web | **pass** (11.38 s) |
| Harness mới (Phần A/B/C) | Phần A **hoàn thành** (lượt 3, sau khi sửa cache — xem §8); Phần B/C **hoàn thành** (lượt 2: 40 render + 174 extract/compare + refCheck); FU1/FU2/FU3 **hoàn thành** |
| Tái tạo baseline R63 | veryfast CRF 18 bilinear = số R63 đến 2 chữ số thập phân ở cả 3 cửa sổ |

**Sự cố giữa chừng (đã xử lý, không giấu):**
1. Lượt chạy 1 bị kill (timeout quản lý) giữa chừng khi đang decode
   flat `veryfast-crf0`, để lại `.raw` dở dang (14/30 frame); lượt 2 tin
   cache theo "file tồn tại" nên crash `buffer lệch kích thước`. **Đã
   sửa:** cache chỉ tin khi đủ đúng kích thước (30×1280×720×3 byte);
   lượt 3 chạy lại Part A xong, exit 0.
2. Lượt chạy 3 (chỉ Part A, `R64_SKIP_BC=1`) ghi đè `r64r9-report.json`
   của lượt 2 — phần B/C trong JSON hiện tại được tái tạo từ
   `/tmp/r64r9-run2.log` (đủ 16 noise + 58 sharpen mục/cửa sổ).
3. Render chậm (~30–90 s/render thay vì ~3 s) do VM tải bởi 10 luồng
   đợt 64 chạy song song (ffmpeg/Chrome của luồng khác) — không phải lỗi
   harness; tổng lượt chạy ~75 phút.

**Tái tạo:**
```bash
# Harness chính (từ gốc repo; ~75 phút khi VM tải, ~15 phút khi rảnh):
node apps/web/scripts/parity-64r9-noise-x264.mjs
# Chỉ Phần A (nhanh, ~4 phút):
R64_SKIP_BC=1 node apps/web/scripts/parity-64r9-noise-x264.mjs
# Follow-up (script + log giữ tại hidden_files/round64-r9/):
node --experimental-strip-types /tmp/r64r9-followup3.mjs  # cần đường dẫn tuyệt đối trong file
```

## 8. Nợ mở + hướng đo/sửa cho đợt sau (đề xuất, chưa làm)

1. **Noise headed vẫn LỆCH-THỐNG-KÊ** (std R/B + kurt) ở mọi preset/CRF/
   scaler — đã phân rã xong (§0, §4, §5). Không còn là "do x264" nữa;
   đừng tốn thêm lượt quét preset/CRF.
2. **Hướng đo khác (đề xuất cho đợt sau):**
   a. **Đo trên frame decode trước encode** (pre-encode): render ra
      rawvideo/png thay vì mp4 (hoặc lấy frame từ filter-chain trực
      tiếp như FU1 case D) rồi so với preview — tách codec hoàn toàn;
      lúc đó tiêu chí std sẽ còn lệch do kẹp + resampler, cần hiệu
      chuẩn riêng từng phần.
   b. **Encode lossless trong harness** (CRF 0): loại ~8% codec; dùng để
      đo mô hình preview thuần. Lưu ý: medium CRF 18 ≈ CRF 0 cho nhiễu
      nên có thể giữ CRF 18 + preset medium cho rẻ.
   c. **Extract bằng lanczos thay vì bilinear** trong harness compare:
      gần Chrome-high nhất (std R/B cải thiện 30–45%); vẫn không khớp
      G ở upscale và kurt vẫn fail — chỉ là cải thiện đo, không phải
      đáp án.
   d. **Thêm case nội dung ít bão hòa** (desaturated/test-pattern nhạt):
      T3 chứng minh A≈D khi desat — trên nội dung đó noise headed có
      thể gần KHỚP, giúp tách hiệu ứng kẹp khỏi hiệu ứng resampler.
3. **Hướng sửa mô hình thật (nghiên cứu, chưa làm):** preview muốn khớp
   render-native trên nội dung bão hòa thì phải mô phỏng kẹp chroma-rail
   — ví dụ attenuate nhiễu U/V theo khoảng cách tới rails — nhưng
   preview chỉ có RGB đã decode, không có YUV native; cần nghiên cứu
   cách ước lượng rails từ RGB (hoặc chấp nhận lệch này là giới hạn
   kiến trúc: preview RGB không thể tái tạo đúng kẹp YUV native).
4. **Sharpen vẫn XẤP XỈ** (le8 tốt nhất 98.6% < 99%): phần dư là chênh
   kernel unsharp-vs-binomial ở biên + resampler Chrome-high. Hướng:
   đo parity sharpen ở full-res (đã KHỚP, MAD 0.278) làm tiêu chí chính
   cho mô hình, viewport giữ XẤP XỈ; hoặc nghiên cứu bộ lọc resample
   thực của Skia/Chrome để replicate trong harness (không phải sửa
   preview).
5. **Không làm trong luồng này (theo luật):** không nới ngưỡng đo
   (le8 99%, tỉ lệ std [0.85, 1.18], |Δkurt| ≤ 0.35 giữ nguyên); không
   đổi preset/CRF mặc định của render (medium CRF 18 tốt cho nhiễu
   nhưng đổi preset mặc định ảnh hưởng tốc độ/kích thước toàn cục —
   quyết định thuộc luồng khác).
6. Nợ cũ còn nguyên: `ci-security.yml` 403 (chờ user); ma trận màu
   nguồn SD bt601 (đợt 63 R8 §8 mục 3); σ filter 0.97–0.98× lý thuyết
   (đợt 63 R8 §8 mục 4).

## 9. Stage (KHÔNG push)

Batch: `~/workspace/repo-1-push/paths-loop/phase9-round64-r9-yuv-noise-x264.txt`
(NUL-delimited, verify read-back, 2 entry, text only):
`apps/web/scripts/parity-64r9-noise-x264.mjs` (mới — harness Phần A/B/C),
`docs/PHASE9_ROUND64_R9_YUV_NOISE_X264_LIMITS.md` (file này).

Không stage: video/frame/render/JSON/log trong
`hidden_files/round64-r9/` (binary + kết quả đo), probe follow-up
`/tmp/r64r9-followup*.mjs` (bản sao giữ tại `hidden_files/round64-r9/`
để đối chiếu), file OGG/test trong /tmp.
