# Đợt 60 Q1 — Enhance vào preview ở mức xấp xỉ: LIMITS trung thực

Ngày đo: 2026-11-08 (giờ VN). Máy đo: VM này (CPU-only, Chromium headed
qua Xvfb :190, vite dev :5520). Đóng nợ đợt 59 §6.9 + gap E3 phần còn lại:
EnhancePanel (R2) + render enhance (hqdn3d/yadif/vidstab) đã có, nhưng
preview chưa áp enhance. Luồng này đưa enhance vào preview Ở MỨC XẤP XỈ —
không mạo nhận là filter render thật.

## 1. Kết luận ngắn

- Preview nay áp enhance xấp xỉ cho clip video qua 1 lần vẽ offscreen
  (sau LUT/chroma/canvas-effects, trước mask/SR/motion blur — cùng vị trí
  tương đối với hqdn3d ở render): denoise → blur nhẹ, stabilize → zoom
  crop gợi ý, deinterlace → KHÔNG đổi pixel (không có xấp xỉ trực quan).
- Toggle "Xem trước enhance (xấp xỉ)" trong EnhancePanel (mặc định bật,
  cờ UI trong store, không nằm trong spec) bật/tắt phần xấp xỉ; bản render
  luôn áp enhance thật bất kể toggle.
- Bằng chứng thật: unit test 16/16 (vi+en), headed click-test 7/7 với
  đo pixel canvas thật (xem §3), P8 hồi quy 21/21 (vi+en), previewEngine
  14/14, vite build pass 25,5 s.

## 2. Ánh xạ xấp xỉ (lib/enhancePreview.ts — logic thuần, test khóa)

| Enhance (spec) | Render thật | Preview xấp xỉ | Công thức |
|---|---|---|---|
| `denoise: true` / `{strength: s}` | `hqdn3d` không gian + thời gian | blur CSS nhẹ trên offscreen | blur = s × 1.2 px (s=0.5 → 0.6px, s=1 → 1.2px) |
| `stabilize: {smoothing: n}` | `vidstabtransform` 2-pass | zoom crop gợi ý quanh tâm | zoom = 1.02 + n/100 × 0.03 (n=10 → 1.023, n=100 → 1.05) |
| `deinterlace: true` / `{mode}` | `yadif` | KHÔNG đổi gì (không qua offscreen) | — |

- `needsOffscreen` chỉ true khi blur > 0 hoặc zoom != 1 (deinterlace đơn
  lẻ → false, clip vẽ như cũ, không tốn thêm lần vẽ).
- `enhancePreviewPlan` trả `applied` (denoise/stabilize) và
  `notApproximated` (deinterlace luôn ở đây; toggle tắt thì tất cả) theo
  thứ tự `enhanceActiveFeatures` (deinterlace → stabilize → denoise).
- Không thêm shape spec: plan đúng 7 key đã khai (test khóa); toggle là
  `store.enhancePreviewEnabled` (mặc định true) + setter, không nằm trong
  `VideoSpec` nên không ảnh hưởng render/export/lưu project.

## 3. Số đo headed thật (clicktest-60q1-enhance-preview.mjs, 2 lần chạy)

Canvas preview 871×275 (backing store tại cửa sổ 1440×900), lấy mẫu mỗi
4px (15.042 pixel, 45.126 channel). Playhead 0, pause, clip video mẫu 1
(webm 640×360 tự ghi). Vòng preview ngủ trước mỗi snapshot (frame ổn định).

| Chuyển trạng thái | Mean abs diff | % channel đổi | Kết luận |
|---|---|---|---|
| A→B: bật denoise (blur 0.6px) | 0.1461 / 0.1446 | 10.44% / 10.26% | blur đổi pixel thật trên cạnh sắc |
| B→C: bật stabilize (zoom 1.023) | 1.7396 / 1.7447 | 31.04% / 30.87% | zoom đổi pixel mạnh, như kỳ vọng |
| C→D: tắt toggle xem trước | 1.7746 / 1.7798 | 31.86% / 31.82% | pixel đổi ngược |
| A→D: khung gốc vs toggle tắt | **0 / 0** | **0% / 0%** | toggle tắt trả ĐÚNG khung gốc, pixel-identical |
| E→F: bật deinterlace | **0 / 0** | **0% / 0%** | deinterlace không đổi pixel preview, như thiết kế |
| Hook `__vcutPreviewEnhance` | — | — | blur/zoom/applied/notApproximated khớp store ở mọi case |

Số lặp lại tốt giữa 2 lần chạy (chênh < 0.005 mean) — frame pause ổn định,
không phải nhiễu đo.

## 4. Giới hạn — đọc trước khi trích số

1. **Blur KHÔNG phải hqdn3d.** Blur chỉ làm mờ không gian; hqdn3d còn có
   thành phần thời gian và giảm std nhiễu đo được ~45–86% (đợt 59 P9 §4).
   Chưa đo blur 0.6px giảm std nhiễu bao nhiêu trên footage nhiễu thật —
   con số duy nhất đã đo là mean abs diff 0.14 trên khung mẫu sạch (§3).
   Đừng nói "preview khử nhiễu đúng 45%" hay bất kỳ tỉ lệ nào.
2. **Zoom KHÔNG phải vidstab.** Zoom chỉ gợi ý "khung hình đang được crop
   lại"; không có pass detect, không có vector chuyển động, không làm mượt
   chuyển động thật. Render giảm jitter đo được (redx std 3.507 → 1.55 ở
   320×180, đợt 59 P9 §4.2); preview KHÔNG có số giảm jitter tương đương —
   chưa đo, và theo thiết kế thì bằng 0 (zoom tĩnh không đổi vị trí frame
   theo thời gian).
3. **Deinterlace KHÔNG hiện trong preview.** Preview hiện frame như trình
   duyệt giải mã; răng cưa của nguồn interlaced có thể vẫn thấy hoặc không
   tùy decoder — chưa kiểm chứng trên footage interlaced thật (mẫu là
   webm progressive). Yadif chỉ chạy ở render (idet prog 0 → 0.993, đợt
   59 P9 §4.1).
4. **Thứ tự chưa khớp render hoàn toàn.** Render: yadif + vidstabtransform
   chạy TRƯỚC speed/scale, hqdn3d chạy SAU scale/pad cùng vị trí effects.
   Preview: cả blur lẫn zoom đều áp SAU effects (1 lần offscreen) — thứ tự
   tương đối với effects là xấp xỉ, không phải mirror chính xác chain render.
5. **Chi phí thêm: 1 lần vẽ offscreen dw×dh mỗi frame** khi enhance preview
   bật và có denoise/stabilize (drawImage + blur filter). Chưa đo FPS
   preview trước/sau (nợ đo — xem §6). Khi toggle tắt hoặc chỉ có
   deinterlace thì không tốn thêm lần vẽ nào.
6. **Phạm vi vẽ:** enhance áp trên `drawSrc` (sau chroma/LUT/effects) nên
   đi qua được cả 3 đường vẽ (thường / mask unit / SR) và motion-blur
   blend (snapshot lưu drawSrc đã enhance). Chưa click-test headed riêng
   cho enhance + mask / enhance + SR / enhance + motion blur cùng lúc —
   chỉ mới đo đường thường (clip mẫu không mask/SR/motion).
7. **Hook đo `window.__vcutPreviewEnhance`** ghi trạng thái của clip video
   ĐƯỢC VẼ CUỐI trong frame (ghi đè mỗi lần drawVideoClip). Project có 2
   clip video chồng nhau trong cùng frame thì hook chỉ giữ clip vẽ sau —
   đủ cho click-test (clip mẫu nối tiếp, không chồng), chưa phải API đa clip.
8. **Key i18n cũ `enhance.renderOnly` thành mồ côi.** Panel không còn dùng
   key này (dòng cảnh báo nay là `enhance.previewApprox` trong fragment
   round60-q1, parent gộp sau). Key cũ vẫn nằm trong vi/en.json — chờ dọn
   ở đợt kiểm toán i18n sau (đợt 59 P7 đã ghi 41 key mồ côi khác).

## 5. Cách chạy lại

```bash
# Unit test (vi + en):
./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview60Q1.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round60-q1/enhancePreview.test.cjs \
  && node /tmp/round60-q1/enhancePreview.test.cjs
VCUT_TEST_LANG=en node /tmp/round60-q1/enhancePreview.test.cjs
# Hồi quy P8 (preset/panel): bundle + chạy enhancePresets59P8.test.ts tương tự.
# Click-test headed (vite dev + Chromium Xvfb + CDP, ~60 s):
node apps/web/scripts/clicktest-60q1-enhance-preview.mjs
```

## 6. Nợ mở cho đợt sau

- Đo FPS preview trước/sau khi bật enhance preview (blur + zoom offscreen)
  ở 720p/1080p, cả đường thường lẫn đường mask/SR (hiện chỉ có chi phí
  định tính "1 lần vẽ offscreen", chưa có số FPS).
- Đo blur 0.6px giảm std nhiễu bao nhiêu trên footage nhiễu thật (so với
  hqdn3d ~45–86% ở render) để hiệu chuẩn thang blur — hiện thang 1.2px
  là chọn tay, chưa hiệu chuẩn bằng số đo nhiễu.
- Click-test headed enhance + mask / + SR / + motion blur cùng lúc (hiện
  chỉ đo đường thường).
- Footage interlaced thật để kiểm chứng deinterlace "không hiện" trong
  preview có đúng là răng cưa vẫn thấy (hay decoder đã khử).
- Dọn key mồ côi `enhance.renderOnly` khỏi vi/en.json (cùng đợt dọn 41 key
  đợt 59 P7).

## 7. Ghi chú quá trình (đỏ-trước/xanh-sau)

- Đỏ-trước: test unit bundle lỗi vì `lib/enhancePreview.ts` chưa tồn tại;
  sau khi viết module, 1 assert sai kỳ vọng (NaN smoothing → code clamp
  về smoothing 1 → zoom 1.0203, test ghi 1.023) — sửa TEST theo đúng hành
  vi đã ghi trong module (NaN → lo), không sửa code cho khớp test.
- Xanh-sau: unit 16/16 vi + 16/16 en; headed lần 1: 4/7 — 3 FAIL đều do
  test ghi sai thứ tự `applied`/`notApproximated` (ghi ["denoise",
  "stabilize"] trong khi `enhanceActiveFeatures` trả ["stabilize",
  "denoise"]); sửa test, lần 2: **7/7 pass** với số đo lặp lại (§3).
- tsc toàn dự án: không thêm lỗi mới trong file luồng này đụng
  (enhancePreview.ts / test / EnhancePanel.tsx / preview.tsx / store.ts:
  0 lỗi). Lỗi còn lại tại thời điểm đo thuộc file luồng khác đang sửa
  dở (Q5 `gopTrialDecode60Q5.test.ts` 3 lỗi lúc đầu, sau tự hết; Q2
  `cssClasses60Q2.test.ts` lỗi cú pháp dòng 134 lúc đo cuối) — không phải
  file Q1, không sửa hộ.
- vite build pass 25,5 s (232 modules). `apps/web/dist/` là build artifact,
  KHÔNG đưa vào batch stage.
