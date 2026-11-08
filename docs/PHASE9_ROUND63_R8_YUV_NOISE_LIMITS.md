# Phase 9 đợt 63 R8 — Noise không gian YUV + sharpen viewport + docs

Ngày: 2026-11-08. Luồng R8, đợt 63. **KHÔNG push, KHÔNG release/tag,
KHÔNG binary vào batch.** Đóng nợ đợt 62 R8 §5.2/§5.3/§5.4
(xem `docs/PHASE9_ROUND62_R8_MCP_TRANSITION_LIMITS.md` §5):
(1) noise preview↔render LỆCH-THỐNG-KÊ — cần noise không gian YUV ở
đường canvas + cập nhật tiêu chí test Node theo pipeline thật;
(2) sharpen ở viewport downscale mạnh vẫn XẤP XỈ — thử
`imageSmoothingQuality="high"`; (3) `FEATURE_STATUS.md` hàng
Transitions vẫn ghi "chưa kiểm tra lại" (đã có luồng song song khác cập
nhật hàng này trong đợt 63 — xem §6); (4) uisfx 936 file chưa có trên đĩa.

## 0. Kết quả tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Noise YUV preview | **ĐÓNG (mô hình)** — `addYuvNoise` mới trong `effectCanvas.ts`: Gauss từng plane yuv420p (bt709 limited-range, U/V nửa phân giải, nearest 2×2); parity test Node **KHỚP** (tỉ lệ std 1.01, Δcorr ≤ 0.007, Δkurt ≤ 0.09) |
| Tiêu chí test Node | **ĐÓNG** — pipeline đo đổi sang yuv420p thật (bt709) + tiêu chí so sánh trực tiếp (std [0.85,1.18], \|Δkurt\| ≤ 0.35, \|Δcorr\| ≤ 0.12) + guard pipeline; mô hình RGB cũ rớt cả 3 tiêu chí |
| Sharpen + `imageSmoothingQuality="high"` | **CẢI THIỆN RÕ, vẫn XẤP XỈ** — delta MAD 0.99→0.50 ở downscale 2.6×, tỉ lệ std ~1.0 ở 1.58×, gần như không đổi khi upscale; le8 vẫn 94–97% < 99% nên chưa KHỚP |
| Noise headed | **Vẫn LỆCH-THỐNG-KÊ** (std + kurt) — nhưng đã phân rã được nguyên nhân: mô hình màu đúng (Node KHỚP), lệch còn lại do codec x264 làm mượt nhiễu render (~2× trên R/B); corr nay khớp ở các cỡ downscale (Δ ≤ 0.08 ở 1920) |
| FEATURE_STATUS.md | **ĐÓNG** — hàng Transitions đã được luồng song song cập nhật trước (§6); hàng Video effects + tóm tắt + mục Sound cập nhật trong luồng này |
| uisfx fetch-on-demand | **KIỂM CHỨNG XONG + SỬA 1 BUG** — `--pack=minimal` tải đúng 78/78 (decode đủ 78/78, Opus 48kHz); đường lỗi đúng; bug parse `--pack <tên>` (lặng lẽ tải cả 936 file) đã sửa + kiểm chứng lại |
| Hồi quy | effectCanvas unit 14/14, parity Node 15/15, previewEngine 14/14, MCP apply_transition 19/19 + roundtrip 130/130, vite build pass, headed 7/7 × 3 cỡ cửa sổ, 0 lỗi trang |
| tsc | **KHÔNG 0** — 3 lỗi ở `gopTrialDecode63R4.test.ts` của luồng R4 song song (đang sửa, mtime 03:34); file của luồng này 0 lỗi (xem §7) |

## 1. Noise: đo thật filter FFmpeg rồi mới implement

Probe `/tmp/r63-noise-probe.mjs` (không stage), FFmpeg 8.1.2, ảnh phẳng
128, bt709. Kết quả quyết định thiết kế:

- **Nhiễu render là Gauss từng plane, σ ≈ 0.97–0.98 × alls/√3:**
  alls=28 → std Y/U/V [15.73, 15.64, 15.70], kurt [0.05, −0.17, −0.17];
  alls=50 → [28.40, 28.20, 28.38], kurt [0.00, −0.20, −0.21];
  tương quan giữa các plane ≈ 0. Đối chứng cờ `u` (uniform):
  std 7.86, kurt −1.16 — đúng dạng đều, tức mặc định (không `u`) là
  Gauss. Mô hình dùng σ = alls/√3 đúng lý thuyết; lệch std ~2–3% so
  với filter nằm trong mọi ngưỡng (xem §4).
- **Trong RGB, nhiễu yuv420p cho std [2.14, 1.30, 2.41]×σ và corr
  [0.15, 0.26, 0.30]** (alls=28: std [33.55, 20.44, 37.78], corr
  RG/RB/GB [0.148, 0.255, 0.296]) — vì R = 1.164·Y + 1.793·V,
  G = 1.164·Y − 0.213·U − 0.534·V, B = 1.164·Y + 2.115·U. Trong khi
  nhiễu trực tiếp RGB24 cho std [15.8, 15.7, 15.6], corr ≈ 0. Đây là
  toàn bộ bản chất LỆCH-THỐNG-KÊ đợt 62 R8 đo được.
- **Chroma upsample là NEAREST 2×2, không phải bilinear:** xung U đơn
  lẻ cho footprint đúng 2×2 ở biên độ đầy đủ (127), bằng 0 ngoài khối;
  xung Y đơn lẻ chỉ ảnh hưởng đúng 1 pixel. lag-1 ngang của delta RGB
  [0.354, 0.149, 0.402] khớp mô hình khối 2×2 (lý thuyết R 0.352).
- **Kẹp plane làm kurtosis phình ở vùng bão hòa** (đúng như đợt 62 R8
  §3.2 điểm 2): ở t=1, kurt render B = −0.70 do kẹp 0/255 — cùng hiệu
  ứng ở cả 2 phía khi mô hình kẹp giống filter (xem §2).

### Implement (`effectCanvas.ts`: `addYuvNoise`, `applyNoise`, `applyGlitch`)

- RGB→YUV bt709 limited-range (float, hệ số chuẩn), cộng Gauss
  σ=strength/√3: Y từng pixel, Cb/Cr từng mẫu chroma 2×2
  (cx=x>>1, cy=y>>1; khung lẻ dùng ceil(w/2)×ceil(h/2) mẫu), kẹp plane
  0..255 (av_clip_uint8 của filter), convert về RGB, kẹp cuối bởi
  Uint8ClampedArray. Roundtrip không nhiễu: **MAD 0.000**.
- Thứ tự rút RNG xác định (cùng seed → cùng ảnh): Cb rồi Cr theo mẫu
  chroma (row-major), rồi Y từng pixel. `applyGlitch` dùng chung
  `addYuvNoise` (ns thay cho vòng Gauss RGB cũ).
- Ngưỡng unit test cập nhật theo lý thuyết (xem §4): std từng kênh
  [0.85, 1.15]×[2.14, 1.30, 2.41]×σ; corr ±0.12 quanh [0.15, 0.26, 0.30];
  glitch gộp TB/std 14–23/18–29 (đo thật seed 42: TB 16.93, std 22.10 —
  thấp hơn lý thuyết 18.0/23.2 do kẹp trên nguồn pattern bão hòa).

## 2. Tiêu chí test Node mới (parity test)

Đính chính tiêu chí đợt 16 H5: test cũ áp filter trực tiếp lên RGB24
rồi kết luận "KHỚP" — nhưng pipeline render thật áp noise lên yuv420p.
Test nay render qua chuỗi thật `rgb24 → yuv420p (bt709) → noise →
rgb24 (bt709)` (`renderEffectYuv`, 3 lệnh ffmpeg) và so sánh preview
với render thay vì áp ngưỡng tuyệt đối lên preview:

- tỉ lệ std từng kênh ∈ **[0.85, 1.18]** — CHẶT HƠN [0.8, 1.25] cũ;
  kì vọng ≈ 1.03 (σ lý thuyết so với σ đo của filter).
- **|Δkurt| ≤ 0.35** từng kênh (không áp ±0.6 tuyệt đối như cũ: ở t=1,
  kẹp làm kurt cả 2 bên về ≈ −0.5..−0.7 — cùng hiệu ứng, không phải
  lệch mô hình).
- **|Δcorr| ≤ 0.12** từng cặp (corr tuyệt đối của render ≈
  [0.15, 0.26, 0.30] là DẤU HIỆU của nhiễu YUV — tiêu chí cũ |corr|
  ≤ 0.1 bắt render phải có corr ≈ 0, tức bắt nhiễu RGB, là sai
  pipeline).
- **Guard pipeline:** render phải tự mang dấu hiệu YUV
  (std_R/std_G ∈ [1.4, 1.9], std_B/std_G ∈ [1.6, 2.1], corr GB ≥ 0.15)
  — nếu chuỗi đo vô tình rơi về RGB24 thì test fail ồn ào thay vì
  pass rỗng.

Ngưỡng mới KHÔNG nới để cho xanh: std chặt hơn cũ, corr/kurt chuyển
từ tuyệt đối sang so sánh trực tiếp. **Mô hình RGB cũ rớt cả 3 tiêu
chí** (tỉ lệ std [0.47, 0.78, 0.42], Δcorr [0.148, 0.255, 0.296] —
số đo từ probe, cùng σ, cùng nguồn) — tiêu chí phân biệt được đúng/sai.

**Kết quả parity Node 15/15:** noise t=0.5: std render
[33.55, 20.44, 37.78] vs preview [33.77, 20.43, 38.14], tỉ lệ
**[1.01, 1.00, 1.01]**, kurt Δ ≤ 0.06, corr Δ ≤ 0.007. Noise t=1: tỉ lệ
**[1.01, 1.01, 1.01]**, kurt render [−0.48, −0.12, −0.70] vs preview
[−0.49, −0.03, −0.68] (Δ ≤ 0.09 — kẹp khớp nhau). Đây là bằng chứng
mô hình màu ĐÚNG trong pipeline không codec/không resample.

## 3. Sharpen + `imageSmoothingQuality="high"` — đo ở 3 mức downscale

### 3.1. Bài học về vị trí đặt setting (đo 2 lần)

Lần 1: chỉ đặt `"high"` trên ctx của `effectCanvasSource` →
headed 1440 cho số sharpen **y hệt đợt 62** (delta MAD 0.99, std
[5.12, 6.13, 4.68]). Nguyên nhân: draw ở đó là 1:1 (dw×dh = letterbox
của media trong project) nên quality không có tác dụng — bước downscale
viewport thật sự nằm ở **ctx chính trong `renderFrame`**
(`setTransform(vp.scale, …)` rồi `drawImage(unit, …)`). Setting đã
chuyển sang ctx chính (1 lần/frame); setting ở effect canvas vẫn giữ
cho trường hợp media lớn hơn project (lúc đó draw mới resample).

Probe Chrome 1254 (`/tmp/r63-smoothing-probe.mjs`, pattern HF
1280→489): quality low cho delta std [19.48, 9.92, 20.33], còn
medium/high cho **[10.98, 5.49, 11.18]** (giảm ~44%; medium == high),
ảnh plain khác low MAD 4.75 — "high" triệt HF đúng hướng cần.

### 3.2. Số đo headed (7/7 × 3 cỡ, 0 lỗi trang; render worker thật CRF 18)

| Case (delta sharpen) | 1440×900 (downscale 2.62×) | 1920×1080 (downscale 1.58×) | 2560×1600 (upscale 1.35×) |
|---|---|---|---|
| sharp05 MAD (R8 → R63) | 0.990 → **0.496** | — → **0.450** | 0.503 → **0.525** |
| sharp05 std preview vs render | [5.12,6.13,4.68] → **[2.44,1.93,2.07]** vs [1.49,1.59,1.72] (tỉ lệ 3.4× → 1.2–1.6×) | **[2.29,2.28,2.51]** vs [2.16,2.49,2.56] (tỉ lệ **1.06/0.92/0.98**) | **[2.72,3.08,3.79]** vs [3.27,3.49,4.07] (tỉ lệ 0.83/0.88/0.93; R8: 0.73–0.94) |
| sharp10 MAD (R8 → R63) | 1.201 → **0.654** | — → **0.616** | 0.732 → **0.745** |
| sharp10 std preview vs render | [6.38,7.82,6.37] → **[3.63,2.89,3.65]** vs [2.22,2.56,2.47] | **[3.95,3.79,4.45]** vs [3.07,3.81,3.72] (tỉ lệ 1.29/0.99/1.20) | **[4.42,4.72,6.87]** vs [5.22,5.48,5.81] |
| le8 / le32 delta | 95.8% / 99.9% (R8: 94.9% / 98.7%) | 96.9% / 99.9% | 96.2% / 99.8% |

- **Kết luận: cải thiện rõ ở downscale, gần như không đổi khi
  upscale, vẫn XẤP XỈ** (le8 94–97% < 99% nên chưa KHỚP ở cỡ nào).
  Tỉ lệ std delta về ~1.0 ở 1.58× là điểm tốt nhất — Chrome "high"
  gần với bilinear của FFmpeg ở mức downscale vừa, còn ở 2.62× vẫn
  thừa ~1.2–1.6× (bộ lọc của Chrome không đồng nhất với bilinear).
- **Plain MAD không đổi ở cả 3 cỡ** (1.304 / 1.147 / 1.176; R8: 1.304 /
  — / 1.176). Đối chiếu snapshot plain 2560 R62 vs R63: **byte-identical
  (MAD 0.000, 0% đổi)**. Giải thích: clip plain vẽ thẳng video element
  lên ctx chính — đường video-source của Chrome bỏ qua setting này;
  chỉ đường canvas-source (clip có effect) mới chịu tác dụng. Plain MAD
  bị chi phối bởi nhiễu codec CRF 18 + decode, không phải resample.
- Không sửa công thức sharpen (đã khớp render ở full-res, MAD 0.278).

## 4. Noise headed — mô hình đúng, lệch còn lại do codec

Headed noise (delta = effect − plain, testsrc2 bão hòa + CRF 18):

| noise05 | 1440 (2.62×) | 1920 (1.58×) | 2560 (upscale) |
|---|---|---|---|
| std preview vs render | [18.02,8.21,20.33] vs [6.10,6.09,9.06] | [20.02,11.92,22.92] vs [8.80,8.96,12.67] | [21.08,13.40,23.77] vs [10.18,12.21,13.72] |
| tỉ lệ std (R8 cũ → R63) | [1.54,1.76,1.01] → **[2.95,1.35,2.24]** | — → **[2.27,1.33,1.81]** | [0.88,0.81,0.63] → **[2.07,1.10,1.73]** |
| corr preview vs render | [−0.195,−0.184,−0.081] vs [−0.206,−0.028,−0.034] (Δ 0.011/0.156/0.047) | [−0.050,−0.081,0.052] vs [−0.129,−0.019,0.041] (**Δ ≤ 0.079 — ĐẠT**) | [−0.002,−0.059,0.080] vs [0.111,0.045,0.203] (Δ 0.113/0.104/0.123) |
| kurt preview vs render | [1.16,0.58,1.24] vs [9.49,−0.09,5.25] | [1.84,0.34,1.92] vs [10.21,−0.13,5.41] | [2.23,0.19,2.28] vs [8.70,0.13,5.15] |

noise10 cùng chiều: tỉ lệ std [2.32,1.32,1.93] (1440), [1.87,1.30,1.61]
(1920), [1.71,1.07,1.55] (2560); corr Δ ≤ 0.114 ở 1440 (đạt), ≤ 0.042
ở 1920 (đạt).

**Phân rã nguyên nhân (tái tạo Node `/tmp/r63-noise-replicate.mjs`,
frame 30 thật của test-pattern.mp4):**
- Nhiễu YUV trên nội dung thật (full-res, chưa resample): std
  [24.41, 18.64, 27.59] (thấp hơn [33.8, 20.4, 38.1] trên phẳng 128
  vì kẹp ở vùng bão hòa của testsrc2), kurt [2.82, −0.02, 2.71],
  corr [0.121, 0.036, 0.189].
- Downscale bilinear (không codec): std [15.72, 6.02, 18.0], corr
  **[−0.116, −0.233, −0.094]** — bilinear triệt thành phần Y (trắng,
  tương quan dương) mạnh hơn thành phần chroma (khối 2×2) nên corr
  ĐỔI DẤU. Đúng dấu corr render đo được ở headed ([−0.21, −0.03,
  −0.03] ở 1440) — tức corr render bị chi phối bởi resample+codec,
  không phải bởi bản thân nhiễu. Preview với "high" nay cho corr
  [−0.195, −0.184, −0.081] ở 1440 — khớp dấu và độ lớn này.
- Render headed [6.10, 6.09, 9.06] còn nhỏ hơn cả bilinear-only
  [15.72, 6.02, 18.0] — phần chênh còn lại là **x264 CRF 18 lượng tử
  hoá nhiễu**: R/B (phụ thuộc chroma nhiều) bị nén ~2×, G gần như giữ
  nguyên (6.02 → 6.09). Preview không thể khớp std tuyệt đối nếu không
  mô hình hoá codec — ngoài phạm vi luồng này.

**Verdict trung thực:** noise headed vẫn **LỆCH-THỐNG-KÊ** (std tuyệt
đối + kurt). Nhưng "lệch" nay đã khác bản chất so với đợt 62: mô hình
màu đã đúng tuyệt đối trong pipeline không codec (Node KHỚP, §2), corr
nay khớp ở các cỡ downscale, và phần std còn lệch được quy về codec
với số đo cụ thể — không còn là "preview dùng sai không gian màu".
Đường sửa tiếp theo (nợ): áp noise ở full-res rồi downscale + hiệu
chuẩn theo CRF, hoặc chấp nhận std tuyệt đối lệch và chỉ claim cấu
trúc (xem §8).

## 5. uisfx fetch-on-demand — kiểm chứng thật + sửa 1 bug

Cơ chế fetch-on-demand là `assets/sounds/fetch_sounds.sh --pack <id>`
(1 pack = 78 file; không có code app nào đọc kho sound này — xem cuối
mục). Kiểm chứng bằng bản sao script y hệt (sha256 trùng bản gốc) chạy
trong /tmp để không đụng `assets/audio/` thật.

- **Tải thật 1 pack (`--pack=minimal`, dạng `=`): 78 mới, 0 đã có,
  0 lỗi / tổng 78** (mất ~150 s); 78/78 file có magic `OggS`, ffprobe
  0 lỗi, **decode đầy đủ 78/78 OK** (ffmpeg → null); codec **Opus**
  48 kHz mono (không phải Vorbis — Ogg chỉ là container); kích thước
  735–9097 B (median 2597 B); SHA256 manifest đủ 78 mục.
- **Đường lỗi tải (BASE trỏ host sai):** 78 dòng WARN + tổng kết
  "0 mới, 0 đã có, **78 lỗi** / tổng 78", thư mục audio trống, không
  sót file `.tmp`; manifest SHA256 ghi rỗng (0 byte).
- **Pack sai (dạng `=`):** `Pack không hợp lệ: nope` + liệt kê 12 pack,
  exit 2.
- **BUG — dạng `--pack <tên>` (đúng như hướng dẫn trong script) bị
  parse sai, lặng lẽ tải toàn bộ 936 file:** vòng `for arg in "$@"` +
  `shift` không ảnh hưởng danh sách đã expand, nên ONLY_PACK không bao
  giờ được gán; kiểm chứng: `--pack minimal --dry-run` liệt kê **936**
  file thay vì 78, `--pack nope` bắt đầu tải toàn bộ (đã kill kịp sau
  79 file, dọn sạch /tmp). Chỉ dạng `--pack=X` là chạy đúng. Hướng dẫn
  trong script còn ghi `--pack ui` — "ui" không phải tên pack.
- **Sửa (luồng này):** parse lại bằng while/shift chuẩn — cả 2 dạng
  `--pack=X` và `--pack X` đều đúng, tham số lạ/thiếu tên pack exit 2;
  sửa hướng dẫn `--pack ui` → `--pack=minimal`; thêm guard `[[ -e … ]]`
  cho vòng ffprobe để khỏi WARN giả khi thư mục rỗng. Kiểm chứng lại:
  `--pack minimal --dry-run` = 78, `--pack=minimal --dry-run` = 78,
  `--dry-run --pack minimal` = 78, `--dry-run` = 936, các dạng sai đều
  exit 2 (đo exit code trực tiếp, không qua pipe).
- **Kho sound chưa được nối vào đâu:** grep toàn repo (trừ
  node_modules/.venv): không có UI picker, không có code render/audio
  nào đọc `assets/sounds/index.json` hay `assets/audio/` — file thiếu
  không gây lỗi runtime ở đâu; kho mới chỉ là dữ liệu khai báo + script
  fetch. Nợ nối UI/render thuộc luồng khác.

## 6. FEATURE_STATUS.md

- Hàng **Transitions**: một luồng song song đợt 63 đã cập nhật trước
  (MCP cell nay "✅ apply_transition 82/82 qua tool thật", Tests cell
  "MCP R8 19/19"). Luồng này chỉ thêm xác nhận hồi quy lại
  "(19/19 + roundtrip 130/130 đợt 63 R8)" vào Tests cell — không sửa
  nội dung của luồng kia.
- Hàng **Video effects (16)** + đoạn tóm tắt đầu file: cập nhật trạng
  thái sharpen/noise theo số đo đợt này (§3–§4).
- Mục **Sound**: thêm kết quả kiểm chứng fetch-on-demand + bug đã sửa.

## 7. Kiểm chứng + hồi quy

| Kiểm tra | Kết quả |
|---|---|
| effectCanvas unit | **14/14** |
| effectCanvas parity Node | **15/15** (noise yuv420p 2/2, glitch ngưỡng YUV mới) |
| previewEngine | **14/14** |
| MCP apply_transition (test R8) | **19/19** (82/82 apply, 8/8 từ chối) |
| MCP roundtrip | **130/130** |
| vite build | **pass** (34.69 s) |
| tsc web | **3 lỗi — KHÔNG phải của luồng này:** `gopTrialDecode63R4.test.ts` (luồng R4 song song, mtime 03:34:35, unused import + import `.ts` không có `allowImportingTsExtensions`); file của luồng này 0 lỗi. Không sửa file luồng khác khi họ còn đang sửa. |
| Headed preview | **7/7 × 3 cỡ** (1440×900, 1920×1080, 2560×1600), 0 lỗi trang; proxy=false |
| Compare headed | xem §3–§4 (JSON: `hidden_files/round63-r8/headed/w1440|w1920|w2560/`) |

**Sự cố giữa chừng (không phải lỗi code của luồng này):** lần compare
đầu (03:05) cả 5 variant render đều fail với
`ReferenceError: probes is not defined` tại `validate.js:984` — file
này bị một luồng song song sửa đúng lúc đó (mtime 03:05:12 rồi
03:05:27); chạy lại sau khi file ổn định thì render bình thường
(3.1 s/variant). Đây là hazard khi nhiều luồng cùng sửa file chung —
harness compare đọc file trực tiếp mỗi lần render nên dễ dính bản sửa
dở; luồng sau nên retry render 1 lần khi gặp lỗi load file.

**Tái tạo:**
```bash
# Unit/parity Node (từ gốc repo):
node --experimental-strip-types apps/web/src/lib/effectCanvas.test.ts          # 14/14
node --experimental-strip-types apps/web/src/lib/effectCanvas.parity.test.ts   # 15/15
node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts         # 14/14
# MCP (từ mcp-server):
node test-apply-transition-81.mjs        # 19/19
node dist/mcp-server/src/roundtrip.test.js  # 130/130
# Headed + compare (từ gốc repo; Chromium 1254 — bản 1248 của đợt 62 không còn trên máy):
node apps/web/scripts/parity-63r8-sharpen-noise-headed.mjs  # 7/7 (mặc định 1440x900)
R63_WIN_W=1920 R63_WIN_H=1080 node apps/web/scripts/parity-63r8-sharpen-noise-headed.mjs
R63_WIN_W=2560 R63_WIN_H=1600 node apps/web/scripts/parity-63r8-sharpen-noise-headed.mjs
node apps/web/scripts/parity-63r8-compare.mjs  # JSON: hidden_files/round63-r8/headed/r63-compare-report.json
# uisfx (bản sao trong /tmp, không tải vào repo):
bash assets/sounds/fetch_sounds.sh --pack=minimal --dry-run  # 78 file
```

## 8. Nợ mở

1. **Noise headed std tuyệt đối vẫn lệch ~2× (R/B)** do x264 CRF 18
   làm mượt nhiễu render — cần mô hình hoá codec hoặc áp noise ở
   full-res rồi downscale theo đúng thứ tự render (đụng hiệu năng
   preview + thứ tự LUT/chroma — việc lớn, luồng riêng).
2. **Sharpen vẫn XẤP XỈ** (le8 94–97% < 99%): Chrome "high" gần nhưng
   không đồng nhất bilinear của FFmpeg; muốn KHỚP cần khớp bộ lọc
   resample hoặc áp sharpen ở full-res rồi downscale (cùng việc lớn
   như nợ 1).
3. **Ma trận màu:** preview dùng bt709 (nguồn HD). Nguồn SD bt601 sẽ
   lệch ma trận nhỏ (Y sai ~1–2 mức) — chưa xử lý theo metadata nguồn.
4. **σ filter thực tế 0.97–0.98× lý thuyết** (đo §1) — chấp nhận, trong
   ngưỡng; nếu muốn khớp tuyệt đối có thể nhân hệ số 0.975 vào σ (chưa
   làm vì chưa rõ hệ số có ổn định theo alls không: 0.973 ở 28,
   0.984 ở 50).
5. **tsc web đang đỏ do file luồng R4** (xem §7) — luồng R4 tự sửa;
   không đụng.
6. **`ci-security.yml` 403** (nợ cũ từ đợt 62) vẫn nguyên — repo chưa
   có CI chạy thật.
7. **Kho sound 936 file uisfx vẫn chưa có trên đĩa** (chỉ fetch được
   theo pack khi cần); kho chưa nối vào UI/render (xem §5).

## 9. Stage (KHÔNG push)

Batch: `~/workspace/repo-1-push/paths-loop/phase9-round63-r8-yuv-noise.txt`
(NUL-delimited, verify read-back, 9 entry, text only):
`apps/web/src/lib/effectCanvas.ts`,
`apps/web/src/lib/effectCanvas.test.ts`,
`apps/web/src/lib/effectCanvas.parity.test.ts`,
`apps/web/src/preview.tsx`,
`apps/web/scripts/parity-63r8-sharpen-noise-headed.mjs` (mới),
`apps/web/scripts/parity-63r8-compare.mjs` (mới),
`assets/sounds/fetch_sounds.sh`,
`docs/FEATURE_STATUS.md`,
`docs/PHASE9_ROUND63_R8_YUV_NOISE_LIMITS.md` (file này).

Không stage: video/frame/render/JSON trong
`hidden_files/round63-r8/` (binary + kết quả đo), chẩn đoán `/tmp/r63-*`
(probe noise/smoothing/replicate, script uisfx sao chép), file OGG tải
thử trong /tmp (đã dọn sau khi kiểm chứng; riêng bản sao script
fetch_sounds.sh trong /tmp giữ lại để đối chiếu sha256 nếu cần).

Lưu ý: `docs/FEATURE_STATUS.md` trong batch này chứa cả cập nhật hàng
Transitions của một luồng song song đợt 63 (đã ổn định từ 02:57) lẫn
cập nhật của luồng này — push lấy nội dung mới nhất của file.
