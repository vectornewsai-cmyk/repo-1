# Phase 9 đợt 15, luồng T1 — cập nhật rasterizer harness parity: LIMITS (trung thực)

> Đợt lớn cron 02:03 28/10/2026, luồng T1 (chỉ luồng này).
> Nợ xử lý: §2–§3 của `docs/PHASE9_ROUND14_LIMITS.md` (V12 circle FAIL giả,
> V11 dissolve FAIL giả, V14 PENDING circle/dissolve).
> Phạm vi CỨNG đã giữ: KHÔNG push GitHub, KHÔNG release/tag, KHÔNG tạo
> file binary (.png/.ogg/.cube/.ttf), KHÔNG sửa code sản phẩm
> (`transitionPreview.ts`, `preview.tsx`, `render.js`, …) — chỉ sửa 3 file
> harness `test_v*.js` + tài liệu này. Không đưa `dist/` vào kết quả.
> FFmpeg đo: 8.1.2 (`ffmpeg -version`, máy này). Khung đo transition:
> 72×45 @30fps, A đỏ thuần / B xanh dương thuần, frame giữa p=0.5
> (index 45), thang phân loại V6 (KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8).

## 1. Việc đã làm (3 rasterizer, không đụng code sản phẩm)

### 1.1. V12 — mô hình circle mới (smoothstep + tâm cắt nguyên)
- `regionCovers` thêm kind `radial-gradient` (phủ khắp khung, alpha theo
  bán kính — bỏ mô hình circle biên cứng cũ).
- Thêm `layerPixelAlpha` (mirror V11) + nhánh `hasRadial` trong
  `rasterizeTransitionPreview`: cặp radial-gradient có 2 lớp phủ khắp
  khung với alpha bù nhau (a+b=1) nên composite bằng crossfade từng
  pixel, KHÔNG phải sequential-over (over sẽ cho sai công thức xfade).
- Trọng số: ưu tiên hàm thật `radialGradientWeight` từ module
  `transitionPreview` (log chạy xác nhận đã dùng hàm thật, đợt 14 R4);
  fallback nội bộ là đúng công thức nhiệm vụ giao:
  `w = 1 − S(clamp(rho−mid+0.5, 0, 1))`, `S(t)=3t²−2t³`.
- Tâm/rMax: lấy từ chính region do `describeTransition` cung cấp
  (`cx=floor(W/2)`, `cy=floor(H/2)`, `rMax=hypot(cx,cy)`) — rasterizer
  KHÔNG tự tính lại tâm (W/2, H/2); hai quy ước chỉ khác nhau khi W
  hoặc H lẻ (đo đợt 14). Bán kính đánh giá tại chỉ số pixel nguyên
  (x, y), không phải tâm pixel +0,5.

### 1.2. V11 — nối dissolve-noise bằng mask frand
- `regionCovers` thêm kind `dissolve-noise`: `frand` float32 từ module
  `dissolveFrand.ts` (transpile cùng harness, giống V12), đánh giá tại
  chỉ số nguyên `floor(x), floor(y)` (vf_xfade.c đánh giá frand tại x,
  y nguyên — dùng tâm pixel cho trường khác hẳn, mức ngẫu nhiên).
  `invert=true` (lớp A) hiện khi `fr ≥ p`, `invert=false` (lớp B) hiện
  khi `fr < p`; hai lớp rời nhau nên nhánh sequential-over sẵn có cho
  đúng phân hoạch, không cần nhánh riêng.
- Nếu module frand load lỗi, region trả `false` có chủ đích để case
  dissolve LỆCH rõ ràng thay vì cho số của fallback.
- Dọn kèm (không đổi số đo): fallback `radialWeight` của V11 đổi từ
  cosin đợt 13 sang smoothstep (cosin sai có hệ thống ~0,01 trọng số);
  trước dọn này V11 circle vẫn PASS 0,33 vì luôn dùng hàm thật từ
  module — fallback chỉ là bẫy tiềm ẩn nếu module mất export. Nhãn
  case circle và comment `layerPixelAlpha` (cũ ghi tâm (W/2, H/2)) sửa
  cho đúng tâm cắt nguyên từ region.

### 1.3. V14 — hỗ trợ kind radial-gradient + region dissolve-noise
- `SUPPORTED_REGION_KINDS` thêm `radial-gradient`, `dissolve-noise`;
  `regionCovers` + `layerPixelAlpha` + nhánh `hasRadial` mirror V11/V12
  (cùng quy ước tâm cắt nguyên, chỉ số nguyên, frand float32).
- Gỡ nhánh PENDING đặc biệt cho dissolve trong phần T (trước đây bỏ qua
  không đo MAD) — nay dissolve đi qua đường đo chung; nếu load module
  lỗi thì region trả `false` có chủ đích (LỆCH rõ ràng), không quay lại
  PENDING giả. Header V14 cập nhật theo.
- Phần E (effect) của V14 không sửa gì; kết quả effect giữ nguyên để
  đối chứng hồi quy.

## 2. Bảng trước/sau (số đo thật, chạy lại toàn bộ 3 harness)

### V11 — 24 case (lệnh: `node src/test_v11_parity.js` từ `server/render/`)
| Case | Trước (baseline đầu lượt) | Sau |
|---|---|---|
| circleopen | MAD 0,33 — KHỚP (PASS) | MAD 0,33 — KHỚP (PASS), ≤8: 100% |
| circleclose | MAD 0,33 — KHỚP (PASS) | MAD 0,33 — KHỚP (PASS), ≤8: 100% |
| **dissolve** | **MAD 85,00 — LỆCH (FAIL)**, tỉ lệ B preview 0,0% (region không raster được) | **MAD 0,00 — KHỚP (PASS)**, ≤8: 100%, tỉ lệ B render 50,8% vs preview 50,8% |
| fade / wipeleft / slideright / diamondclose / squareopen + 14 type V3 còn lại + 4 text | Không đổi (đã PASS/XẤP XỈ như trước) | Không đổi |
| **Tổng V11** | **24 case, FAIL: transition dissolve; lỗi render: 0; exit 0** | **24 case, FAIL: không có; lỗi render: 0; exit 0** |

Phần text V11 giữ nguyên trạng trước (không phải hồi quy do lượt này):
tiltIn MAD 1,10 XẤP XỈ, skewIn MAD 0,94 XẤP XỈ, slideReveal MAD 0,93
KHỚP, curtainIn MAD 0,40 KHỚP.

### V12 — 32 case (A 7 + A2 V3 14 + B text 4 + C effect 7)
| Case | Trước | Sau |
|---|---|---|
| **circleopen** | **MAD 84,67 — LỆCH (FAIL)**, tỉ lệ B preview 0,0% (rasterizer cũ không hiểu radial-gradient nên vẽ đen) | **MAD 0,33 — KHỚP (PASS)**, ≤8: 100%, tỉ lệ B render 4,2% vs preview 4,2% |
| dissolve | MAD 0,00 — KHỚP (PASS) | MAD 0,00 — KHỚP (PASS) (không đổi) |
| fade / wipeleft / slideright / diamondclose / squareopen | KHỚP | KHỚP (không đổi) |
| A2 V3 (14 type) + B text + C effect | Không có FAIL, không có PENDING fallback | Không đổi (text tiltIn/skewIn vẫn XẤP XỈ như trước, không phải FAIL) |
| **Tổng V12** | **32 case, FAIL: transition circleopen; lỗi render: 0; exit 0** | **32 case, FAIL: không có; PENDING V3: không có; lỗi render: 0; exit 0** |

### V14 — tổng hợp (lệnh: `node src/test_v14_parity.js`)
| Case | Trước | Sau |
|---|---|---|
| circleopen | PENDING (region kind chưa hỗ trợ: radial-gradient) | MAD 0,334 — KHỚP, ≤8: 100% |
| circleclose | PENDING (region kind chưa hỗ trợ: radial-gradient) | MAD 0,334 — KHỚP, ≤8: 100% |
| dissolve | PENDING (không đo MAD) | MAD 0,000 — KHỚP, ≤8: 100% |
| fade / wipeleft / slideright / diamondclose / squareopen | KHỚP | KHỚP (không đổi) |
| Effect: pixelate / mirror / rgb-shift / shake×2 / sharpen×2 | KHỚP | KHỚP (không đổi; sharpen 0,456–0,466) |
| Effect: edgedetect step / natural | XẤP XỈ (3,856 / 8,528) | XẤP XỈ (không đổi) |
| noise / glitch | STAT-APPROX / STRUCT-OK | STAT-APPROX / STRUCT-OK (không đổi) |
| **Tổng V14** | **KHỚP 12, XẤP XỈ 2, LỆCH 0, PENDING 3, STAT-APPROX 1, STRUCT-OK 1; lỗi render: 0; exit 0** | **KHỚP 15, XẤP XỈ 2, LỆCH 0, PENDING 0, STAT-APPROX 1, STRUCT-OK 1, STAT-LỆCH 0; lỗi render: 0; exit 0** |

### Lệnh kiểm chứng đã chạy (từ `server/render/`, đều exit 0)
- Baseline đầu lượt (trước sửa): V11, V12, V14 — khớp đúng mô tả đợt 14
  (V11 chỉ FAIL dissolve, V12 chỉ FAIL circleopen, V14 PENDING đúng 3).
- `node --check` cho cả 3 file sau sửa: SYNTAX-OK.
- Sau sửa: V11, V12, V14 chạy lại toàn bộ — kết quả như bảng trên.
- Sau dọn comment/fallback V11 (§1.2 cuối): V11 chạy lại lần nữa —
  24 case, FAIL: không có; circleopen/circleclose 0,33; dissolve 0,00.
- Không chạy `tsc`/`vite build` toàn dự án: lượt này chỉ sửa file
  harness (không sửa code sản phẩm, không sửa TS nguồn web) nên 2 lệnh
  đó không bị ảnh hưởng; harness tự transpile module TS cần thiết bằng
  tsc sang /tmp lúc chạy (log xác nhận `transitionPreview`,
  `dissolveFrand`, `radialGradientWeight` đều load hàm thật).

## 3. Giới hạn chưa làm được / nợ còn lại (trung thực)
- Phạm vi đo của lượt này chỉ là khung 72×45, p=0,5, nguồn A/B thuần
  sắc: chưa đo circle/dissolve ở 1920×1080, yuv420p/16-bit, footage
  thật, hay p khác 0,5 — các giới hạn này vẫn nguyên như đợt 14 §3
  (badge matched chỉ có giá trị trong phạm vi nguồn tổng hợp đã đo).
- MAD sàn 0,33 của circle là sàn đo (FFmpeg truncate kênh khi blend),
  không phải sai mô hình — đừng "sửa" thêm để ép về 0 (kết luận đợt 14).
- Dissolve ở 320×180 từng lệch 1–3 pixel (giả thuyết FMA/sinf, đợt 14
  R2) không được kiểm tra lại ở lượt này vì harness đo ở 72×45 (MAD
  0,00 tại cỡ này); không claim bit-perfect tuyệt đối.
- Nợ ngoài phạm vi luồng này, vẫn còn nguyên từ đợt 14 §3: `grid`
  (mô hình preview sai), `bars-fade` (cần nền crossfade),
  `blinds-h`/`plus`/`checker` (lệch biên quy ước lấy mẫu),
  `circle-soft` vs preview biên cứng (MAD 14–18, cần sửa preview, không
  phải harness), text tiltIn/skewIn vẫn XẤP XỈ (raster libass vs
  drawtext+bilinear), edgedetect/glitch vẫn XẤP XỈ/STAT ở V14.
- V13 (HD) chưa chạy lại ở lượt này: V13 đo cùng mô hình circle cũ qua
  rasterizer riêng của nó — nếu V13 cũng dùng mô hình cũ thì case
  circle HD của V13 vẫn FAIL/PENDING giả cho tới khi có luồng cập nhật
  riêng; lượt này KHÔNG sửa V13 (ngoài phạm vi nhiệm vụ) và KHÔNG claim
  V13 đã xanh.
- 3 file harness nay chứa 3 bản copy của cùng logic radial/dissolve
  (V11/V12/V14) — trùng lặp có chủ đích theo kiến trúc harness độc lập
  từng vòng, nhưng sửa mô hình sau này phải sửa cả 3 nơi (hoặc tách
  module raster dùng chung — việc của đợt sau, không làm ở đây để khỏi
  đụng cấu trúc harness đang chạy).
- Chưa push: mọi file đổi chỉ nằm trên đĩa local, chờ parent stage
  batch push (luồng này KHÔNG tự stage, KHÔNG push — theo luật cứng).
