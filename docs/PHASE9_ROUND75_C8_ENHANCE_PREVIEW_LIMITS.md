# Đợt 75 C8 — Deinterlace vào preview bằng tap dọc +0.5px: LIMITS trung thực

Ngày đo: 2026-11-09 (giờ VN). Máy đo: VM này (CPU-only, Chromium 158
qua Xvfb + CDP, FFmpeg 8.1.2). Đóng gap E3 phần cuối cùng còn lại +
nợ D3 full-res (đợt 61 §6.4 / đợt 63 §6.7): Enhance (denoise/stabilize)
đã vào preview từ đợt 60–64, nhưng **deinterlace chưa có xấp xỉ nào**
(panel ghi "khử răng cưa không hiện"). Luồng này đưa deinterlace vào
preview bằng tap dọc — và đo thật cả chi phí FPS.

## 1. Kết luận ngắn

- Preview nay áp deinterlace xấp xỉ cho clip video **khi tỉ lệ vẽ thật
  ≥ 0.9**: vẽ khung lệch dọc +0.5px (bilinear → trung bình 2 dòng kề,
  hạt nhân [1,1]/2), KHÔNG thêm lần vẽ nào. R combing trên
  interlaced720: **1.12 → 0.67** ở 1:1 (progressive đối chứng 0.69,
  yadif render thật 0.57); trong app ở cửa sổ 2560×1440 (tỉ lệ thật
  1.132): **R 0.74 → 0.54**, lặp lại y hệt 3 lần chạy (MAD 0.7386).
- Dưới ngưỡng 0.9, deinterlace vẫn không đổi pixel preview (hành vi
  letterbox cũ giữ nguyên: Q1 headed 7/7, combo 61R3 9/9).
- Toggle "Xem trước enhance" bật/tắt tap như các enhance khác; tắt thì
  trả đúng khung gốc (MAD 0). Bản render luôn áp yadif thật.
- **Phát hiện thật (FAIL, giữ ngưỡng): FPS deint-only ~0.65–0.71x
  baseline** (gộp 3 lần headed, 8 tỉ lệ drift-corrected, mean 0.68x,
  median 0.60x) — dưới ngưỡng 0.75x. Tap tự nó không tốn lần vẽ, nhưng
  đường offscreen (vẽ qua enhanceCanvas rồi mới lên canvas chính) tốn
  1 lần vẽ full-res thêm. Xem §3.

## 2. Thay đổi code

| File | Đổi gì |
|---|---|
| `apps/web/src/lib/enhancePreview.ts` | `deinterlaceOf()` mới; `EnhancePreviewPlan` + `EnhancePreviewDebug` thêm field `deinterlaceTap`; `enhancePreviewPlan` thêm tham số thứ 4 `drawScaleY = 0` (mặc định giữ hành vi cũ); hằng mới `ENHANCE_PREVIEW_DEINT_MIN_SCALE_Y = 0.9`, `ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX = 0.5`. Deinterlace vào `applied` chỉ khi tap áp, còn lại ở `notApproximated` như trước. |
| `apps/web/src/preview.tsx` | `previewViewportScale(W, H)` mới (đọc tỉ lệ viewport từ canvas preview thật, cache element + kiểm tra `isConnected`); call-site truyền tỉ lệ vẽ thật `(dh/mh) × previewViewportScale(W, H)`; `enhancePreviewSource` thêm tham số `deintTap` (lệch dọc +0.5px trên lần vẽ gốc và bản mờ, cùng hình học zoom); `enhancePreviewDebugState` thêm `deinterlaceTap: false`. |
| `apps/web/src/components/enhance/EnhancePanel.tsx` | Chỉ sửa comment đầu file (deinterlace nay có tap khi xem gần full-res). |
| `apps/web/src/i18n/vi.json`, `en.json` | Chỉ đổi GIÁ TRỊ key `enhance.previewApprox` (không thêm key, dict giữ 2413/2413): khử răng cưa "chỉ hiện khi xem gần full-res (trung bình nửa dòng dọc)". |
| `apps/web/src/components/enhance/enhancePreview75C8.test.ts` | **Mới**: 14 test khóa cổng tap + ngưỡng biên + hook debug. |
| `apps/web/src/components/enhance/enhancePreview60Q1.test.ts` | Plan đúng 10 key (thêm `deinterlaceTap`); chuỗi `previewApprox` mới (3 chỗ); tên 2 test plan ghi rõ "không truyền tỉ lệ vẽ (mặc định 0)". |
| `apps/web/src/components/enhance/enhancePreview62R3.test.ts` | Debug đúng 11 key (thêm `deinterlaceTap`) + assert `deinterlaceTap === false`. |
| `apps/web/scripts/probe-75c8-deint.mjs` | **Mới**: probe ứng viên tap + sweep tỉ lệ + ground truth yadif. |
| `apps/web/scripts/clicktest-75c8-deint-preview.mjs` | **Mới**: headed G0–G5 + H9 (cửa sổ 2560×1440). |

Không đụng spec/render/store. Không thêm key i18n (dict 2413, xem §5).
Fragment test đợt 60 (`hidden_files/round60-q1-fragment.json`, fixture
local, không nằm trong repo) đã cập nhật 2 giá trị `previewApprox` cho
khớp dict mới — test Q1 đọc fragment làm nguồn kỳ vọng nên không cập
nhật thì test fail oan; file này KHÔNG đưa vào batch stage.

## 3. Số đo thật

### 3.1 Probe ứng viên (tab trắng, `probe-75c8-deint.mjs`, 2 lần chạy)

Fixture: `interlaced720.mp4` (testsrc2 60fps + `tinterlace`, idet
TFF=150 Prog=0), `clean720.mp4` (progressive), bản render yadif thật
(`render.js` enhance deinterlace: idet prog 0 → 0.993, đối chứng 0;
render 16–34 fps tùy tải). Metric combing C/S (như D1 đợt 61 R3),
3 mốc 1/2/3s, full-res 1280×720. Lần 1 + lần 2 (sweep mở rộng) khớp
nhau (R noop interlaced 1.12 cả hai lần).

| Ứng viên | R interlaced (mean 3 mốc) | R clean | R yadif | vgrad clean (giữ %) | MAD vs noop |
|---|---|---|---|---|---|
| noop (đối chứng) | **1.12** | 0.69 | 0.57 | 0.928 (100%) | — |
| **tap1 (+0.5px, CHỌN)** | **0.67** | 0.61 | 0.57 | 0.677 (**73%**) | 2.09 |
| tap2 (±0.5px, alpha 0.5) | 0.58 | 0.58 | 0.54 | 0.573 (62%) | 1.80 |
| SVG feGaussianBlur σy 0.8 | 0.54 | 0.51 | 0.51 | 0.487 (52%) | 2.07 |
| SVG feGaussianBlur σy 1.2 | 0.54 | 0.51 | 0.51 | 0.487 (52%) | 2.07 |
| ctx.filter blur(0.5px) | 1.12 | 0.69 | 0.57 | 0.928 (100%) | **0** |

- **Chọn tap1**: R rơi đúng băng progressive (0.67 vs 0.69), giữ
  sắc nét dọc tốt nhất (73%), và KHÔNG thêm lần vẽ (cùng 1 drawImage,
  chỉ đổi offset). tap2 khớp yadif hơn (0.58 ≈ 0.57) nhưng tốn thêm
  1 lần vẽ và mềm hơn (62%). SVG mờ quá (52%) và σ 0.8 vs 1.2 cho
  số giống hệt nhau tới 3 chữ số thập phân ở mọi video — Chromium
  lượng tử hoá filter; chi phí raster của filter là điểm nghẽn FPS
  đã biết (đợt 63 R3). `blur(0.5px)` là NO-OP hoàn toàn (MAD = 0) —
  khớp bài học đợt 61 R3 §2.1 (blur < 0.8px bị lượng tử hoá).

### 3.2 Sweep tỉ lệ → ngưỡng cổng 0.9

Chênh R interlaced − clean theo tỉ lệ vẽ (noop, 3 mốc):

| Tỉ lệ | 0.38 | 0.50 | 0.68 | 0.75 | 0.80 | 0.85 | 0.90 | 0.95 | 1.00 |
|---|---|---|---|---|---|---|---|---|---|
| Gap R | 0.06 | 0.12 | 0.08 | 0.12 | 0.11 | 0.15 | 0.17 | 0.18 | **0.43** |

Gap ≤ 0.18 tới 0.95 rồi nhảy lên 0.43 ở 1.0 → tap chỉ bật ở
**≥ 0.9** (nơi răng cưa thấy rõ). Dưới ngưỡng, downscale đã giấu
răng cưa. Ngưỡng là phán đoán trên dữ liệu nhiễu (±0.05): băng
0.8–0.95 có gap 0.11–0.18, không có điểm gãy rõ trước 1.0; chọn
0.9 để giữ hành vi letterbox cũ (xem §4) thay vì 0.75 như bản
nháp đầu (bản nháp dùng `dh/mh` thuần theo tọa độ project — SAI
biến số, xem §6).

### 3.3 Headed trong app (`clicktest-75c8-deint-preview.mjs`)

Cửa sổ 2560×1440, canvas preview backing **1991×815**, tỉ lệ thật
1.132, clip 1 = interlaced720.mp4, playhead 1.0s, pause. 3 lần chạy
(lần 1 dùng ngưỡng cũ 0.75 + biến cổng sai; lần 2–3 dùng code cuối
ngưỡng 0.9 + tỉ lệ thật — số pixel lặp lại y hệt cả 3 lần):

| Case | Lần 1 | Lần 2 | Lần 3 (code cuối) |
|---|---|---|---|
| G0 canvas đủ lớn (scaleY 1.132) | PASS | PASS | PASS |
| G1 baseline: R inter − R clean | 0.74 (không đối chứng) | 0.74 − 0.60 = **0.14** | 0.74 − 0.60 = **0.14** |
| G2 deint BẬT: R →, MAD, hook | R 0.74 → 0.54, MAD 0.7386, tap=true | giống hệt | giống hệt |
| G3 tắt lại: MAD vs A | 0 | 0 | 0 |
| G4 progressive + deint: R | 0.53 | 0.53 | 0.53 |
| G5 FPS deint-only (drift-corrected) | 0.72/0.60 → **0.66x** | 1.08/0.59/0.46 → **0.71x** | 0.51/0.53/0.91 → **0.65x** |
| H9 0 lỗi trang | PASS | PASS | PASS |
| **Tổng** | **4/7** | **6/7** | **6/7** |

- G1 lần 1 FAIL oan (ngưỡng tuyệt đối R > 0.9 theo probe 1:1 — app
  vẽ upscale 1.13x nên R gốc chỉ 0.74); lần 2+ so sánh có đối chứng
  cùng cỡ canvas (gap 0.14 > 0.10) thì PASS. G2 lần 1 FAIL oan
  (đòi < 0.7× gốc; thực tế 0.54 = 0.73× gốc nhưng đã về băng yadif);
  lần 2+ ngưỡng < 0.65 và < 0.8× gốc thì PASS.
- G3: tắt toggle trả đúng khung gốc, MAD = 0 (mẫu Q1 A→D).
- G4: tap trên footage progressive không tạo thêm răng cưa (R 0.53).
- **G5 FAIL cả 3 lần (giữ ngưỡng 0.75x, không nới):** 8 tỉ lệ
  drift-corrected gộp: 0.72, 0.60, 1.08, 0.59, 0.46, 0.51, 0.53,
  0.91 → **mean 0.68x, median 0.60x**. Cơ chế: tap tự nó miễn phí
  (cùng 1 drawImage), nhưng `needsOffscreen=true` bắt đường vẽ qua
  enhanceCanvas (src → enhanceCanvas → canvas chính = 2 lần vẽ
  full-res ~1450×815 thay vì 1) — cùng cơ chế làm stabilize-only
  đo được 0.62–0.90x ở đợt 63 R3. Lưu ý: FPS tuyệt đối ở cửa sổ
  này rất thấp và nhiễu mạnh (baseline 0.63–33.64 fps giữa các
  slot/lần — VM tải cao + canvas lớn + SwiftShader); chỉ tỉ lệ
  drift-corrected mới đọc được, và cả 3 lần đều < 0.75x.

### 3.4 Hồi quy headed (code cuối)

- Q1 headed (`clicktest-60q1-enhance-preview.mjs`): **7/7** — B5
  deinterlace ở letterbox (clip 360p, tỉ lệ thật 0.76 < 0.9):
  hook `notApproximated=[deinterlace]`, applied
  `[stabilize, denoise]`, pixel E→F mean abs diff **0**.
- Combo 61R3 (`clicktest-61r3-combo.mjs`): **9/9** — C6 hook full
  combo: applied `[denoise]`, notApproximated
  `[deinterlace, stabilize]`, `deinterlaceTap=false`; C0–C7
  (mask/SR/motion-blur + enhance) đều xanh — đường enhance qua
  mask/SR/motion blur không vỡ.

## 4. Kiểm chứng (cây đã gộp code C8)

| Kiểm chứng | Kết quả |
|---|---|
| Unit mới `enhancePreview75C8.test.ts` vi + en | **14/14 + 14/14** |
| Q1 `enhancePreview60Q1.test.ts` vi + en | **16/16 + 16/16** |
| 61R3 `enhancePreview61R3.test.ts` vi + en | **7/7 + 7/7** |
| 62R3 `enhancePreview62R3.test.ts` vi + en | **10/10 + 10/10** |
| 63R3 `enhancePreview63R3.test.ts` vi + en | **8/8 + 8/8** |
| P8 `enhancePresets59P8.test.ts` vi + en | **21/21 + 21/21** |
| R2 `enhanceSpeedBlock61R2.test.ts` vi + en | **9/9 + 9/9** |
| `previewEngine.test.ts` | **14/14** |
| css60 / css61 | **59/59 / 60/60** |
| `tsc --noEmit` (apps/web) | **0 lỗi** (chạy lại sau lần sửa preview.tsx cuối của sibling — xem §6) |
| `vite build` | **pass** (12.90s; cảnh báo chunk >500kB có từ trước) |
| `r6-i18n-check.cjs` | **PASS** — dict vi=en=**2413** (không thêm key) |
| Headed C8 (3 lần) | 4/7 → 6/7 → 6/7 (chỉ G5 FAIL, xem §3.3) |
| Headed Q1 / Combo 61R3 | **7/7 / 9/9** |

## 5. Giới hạn — đọc trước khi trích số

1. **Tap KHÔNG phải yadif.** Tap chỉ trung bình 2 dòng kề (làm mờ
   dọc); yadif nội suy theo cạnh + thời gian (mode 1) và cho idet
   prog 0.993. R sau tap (0.54–0.67) rơi vào băng progressive/yadif
   theo metric C/S, nhưng đó là metric combing, không phải so sánh
   pixel với yadif. Đừng nói "preview khử răng cưa đúng như render".
2. **Tap làm mềm hình.** Trên footage progressive, vgrad dọc giữ
   73% (mất 27% độ sắc nét dọc). Chỉ áp khi user bật deinterlace
   trên clip đó; clip không bật deinterlace không bị ảnh hưởng.
3. **FPS deint-only ~0.65–0.71x baseline — FAIL ngưỡng 0.75x**
   (§3.3). Nguyên nhân là đường offscreen, không phải tap. Ở cửa
   sổ lớn, baseline tuyệt đối đã rất thấp (1.5–16 fps trên VM này)
   nên tỉ lệ mới là số đọc được; đừng trích FPS tuyệt đối.
4. **Ngưỡng 0.9 là phán đoán trên dữ liệu nhiễu** (§3.2): gap
   0.11–0.18 trong băng 0.8–0.95, không có điểm gãy rõ trước 1.0.
   Clip 1080p fullscreen ở màn 1440×900 (tỉ lệ thật 0.75) KHÔNG
   được áp tap — gap đo được ở đó chỉ ~0.12 nên đánh đổi này chấp
   nhận được, nhưng chưa đo headed cho trường hợp đó.
5. **Chưa đo:** tap trên footage interlaced PAL/NTSC thật (chỉ có
   testsrc2 tổng hợp); tap + mask/SR/motion-blur cùng lúc ở tỉ lệ
   ≥ 0.9 (chỉ mới đo đường thường; combo headed C6 ở letterbox nên
   tap tắt — đường mask+tap chưa có số headed); Safari/Firefox
   (bilinear của drawImage lệch 0.5px có thể khác nhau theo trình
   duyệt — chưa kiểm chứng).
6. **Hook `__vcutPreviewEnhance` chỉ giữ clip video vẽ cuối**
   (giới hạn cũ từ Q1, còn nguyên): project có 2 clip video chồng
   nhau thì hook chỉ giữ clip vẽ sau.
7. **File chung `preview.tsx` / `vi.json` / `en.json` đang được
   nhiều luồng đợt 75 sửa song song** (xem §6): batch này stage
   toàn bộ file ở trạng thái sau khi sửa C8 — parent gộp cần đối
   chiếu dict + tsc lại sau khi gộp (dict lúc C8 bắt đầu là 2405
   theo brief, lúc đo là 2413 do sibling thêm 8 key; C8 không thêm
   key nào, chỉ đổi 1 giá trị).

## 6. Ghi chú quá trình (đỏ-trước/xanh-sau)

- **Bản nháp sai biến cổng (đã sửa, không giấu):** bản đầu truyền
  `dh/mh` thuần (tọa độ project) làm `drawScaleY` và ngưỡng 0.75.
  Q1 headed B5 fail (MAD 0.1374 thay vì 0; hook báo tap=true ở
  letterbox) đã lộ lỗi: với clip 360p, dh/mh = 720/360 = 2.0 (tọa
  độ project) trong khi tỉ lệ vẽ thật = (720/360) × 0.38 = 0.76.
  Sửa: (1) thêm `previewViewportScale()` đọc tỉ lệ viewport từ
  canvas preview thật (không đọc `ctx.getTransform()` vì
  drawVideoClip còn được gọi qua offscreen octx ở transition/dip);
  (2) ngưỡng 0.75 → 0.9 theo sweep mở rộng (§3.2). Sau sửa: Q1
  headed 7/7, combo 9/9, C8 headed 6/7 (chỉ G5 fail thật).
- **Ngưỡng G1/G2 lần 1 đặt sai điều kiện** (R tuyệt đối theo probe
  1:1 trong khi app vẽ upscale 1.13x): sửa thành so sánh có đối
  chứng cùng cỡ canvas (G1) và ngưỡng < 0.65 + < 0.8× gốc (G2) —
  ghi rõ trong script; số pixel không đổi giữa các lần chạy
  (R 0.74→0.54, MAD 0.7386 y hệt 3 lần).
- **Probe lần 1 lỗi vite config** (`configureServer` đặt sai chỗ,
  middleware không mount → video 404): sửa theo mẫu plugin của
  harness 61R3 + kiểm tra content-type ở bước probe media.
- **Xung đột file chung:** `preview.tsx` bị sửa lúc 14:42 UTC
  (luồng C1, letterbox intermediate) và 15:23 UTC (luồng khác, chưa
  rõ) trong lúc C8 làm việc; `vi.json`/`en.json` tăng 2405 → 2413
  do sibling trước khi C8 đo. Code C8 kiểm tra còn nguyên sau mỗi
  lần (grep marker + chạy lại tsc/test/headed trên cây hiện tại).
  Batch stage file ở trạng thái hiện tại (đã gồm thay đổi của
  sibling trong cùng file) — parent khử trùng khi gộp.
- **Đỏ-trước unit:** import `ClipEnhance` thừa trong test mới
  (tsc TS6133) — đã xóa; fragment Q1 chứa chuỗi `previewApprox`
  cũ làm 2 test fail — đã cập nhật fragment cho khớp dict (file
  fixture local, không nằm trong repo, không stage).
- **Không sửa:** `PHASE9_GAP_ANALYSIS.md` (hàng E3 nay đã cũ —
  "preview chưa áp enhance" không còn đúng cho cả 3 tính năng;
  để parent cập nhật ở đợt docs, tránh đụng sibling); không đụng
  `ci-security.yml`/workflow (403, nợ cũ).

## 7. Nợ mở cho đợt sau

1. **G5: FPS deint-only ~0.65–0.71x < 0.75x** — hướng tối ưu:
   khi CHỈ có deintTap (không denoise/stabilize), nội tuyến offset
   +0.5px vào lần vẽ cuối thay vì qua enhanceCanvas — nhưng phải
   chạm mọi nhánh vẽ cuối (thường/mask/SR/motion-blur), rủi ro hồi
   quy cao; chưa làm trong đợt này.
2. Đo tap headed cho clip 1080p fullscreen 1440×900 (tỉ lệ thật
   0.75 < 0.9 — tap tắt theo thiết kế; kiểm chứng gap có đúng
   ~0.12 không) và cho footage interlaced thật (không phải testsrc2).
3. Click-test headed tap + mask/SR/motion-blur ở tỉ lệ ≥ 0.9
   (hiện chỉ có combo ở letterbox, tap tắt).
4. Kiểm chứng tap trên Safari/Firefox (bilinear lệch 0.5px có thể
   khác Chromium).
5. Cập nhật hàng E3 trong `PHASE9_GAP_ANALYSIS.md` (preview nay áp
   cả 3 enhance: denoise blend + stabilize zoom + deinterlace tap)
   ở đợt docs.

## 8. Cách chạy lại

```bash
# Probe ứng viên + sweep (vite dev + Chromium Xvfb + CDP, ~60-90 s):
node apps/web/scripts/probe-75c8-deint.mjs
# Headed trong app (cửa sổ 2560x1440, ~5 phút):
node apps/web/scripts/clicktest-75c8-deint-preview.mjs
# Hồi quy letterbox + combo:
node apps/web/scripts/clicktest-60q1-enhance-preview.mjs
node apps/web/scripts/clicktest-61r3-combo.mjs
# Unit test (vi + en):
./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview75C8.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round75-c8/enhancePreview75C8.test.cjs \
  && node /tmp/round75-c8/enhancePreview75C8.test.cjs
VCUT_TEST_LANG=en node /tmp/round75-c8/enhancePreview75C8.test.cjs
```
