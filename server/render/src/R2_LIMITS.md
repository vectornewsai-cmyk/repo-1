# R2 (Phase 9) — Enhance ra UI + mask render nhanh: giới hạn & ghi chú trung thực

Ngày: 2026-10-24. Agent: R2. KHÔNG PUSH (theo lệnh — code chỉ nằm trên đĩa,
parent gom batch sau). Phạm vi cho phép: server/render/src (mask.js, enhance
pipeline, render.js phần mask/enhance), apps/web/src (EnhancePanel mới +
wiring tối thiểu vào Inspector), test/docs của R2. Không động vào preview.tsx.

## 1. Đã làm

### 1a. Enhance ra UI (EnhancePanel)
- Mới: `apps/web/src/components/enhance/EnhancePanel.tsx` (+ `index.ts`),
  nối vào nhánh video của `Inspector.tsx` (section `inspector.secEnhance`,
  đã thêm key vào `i18n/vi.json` + `i18n/en.json`).
- Điều khiển đúng spec `ClipEnhance` (Phase 7 P2, không đổi spec):
  khử răng cưa yadif (mode 0/1), chống rung vidstab (smoothing 1..100),
  khử nhiễu hqdn3d (strength 0..100%). Không đổi filter, không đổi validator
  — UI chỉ set `clip.enhance`, render worker làm phần còn lại.
- Panel ghi rõ: enhance chỉ có tác dụng khi render (preview chưa áp);
  chống rung không dùng chung được với speedKeyframes (validator chặn).

### 1b. Mask render nhanh bằng PNG pre-render
- Mới: `server/render/src/mask_png.py` — vẽ alpha mask 1 lần ra PNG
  grayscale W×H, toán học mirror chính xác công thức geq trong mask.js
  (cùng tọa độ pixel nguyên, cùng band feather, cùng invert). Dùng numpy
  khi có, fallback pure-python khi thiếu numpy (chậm hơn nhưng vẫn đúng).
- `mask.js` thêm: `maskKey()` (dedup: cùng mask + khung hình → 1 PNG),
  `buildMaskPngChain()` (format=rgba → split → alphaextract;
  movie=mask.png + format=gray + loop vô hạn; blend multiply nhân alpha
  nguồn với alpha mask; alphamerge), `buildMaskChainFor()` (có PNG → đường
  nhanh, không có → fallback geq cũ).
- `render.js` thêm: cờ `--mask-mode png|geq` (mặc định png); sinh PNG
  trước khi dựng graph (mỗi mask phân biệt 1 file tmp, dọn khi render
  thành công, giữ lại khi lỗi để debug — giống pattern PNG text SR);
  cả 3 site mask (video thường, video speed ramp, ảnh) đều dùng đường mới.
  Vẽ PNG thất bại (thiếu python3/Pillow) → clip đó fallback geq, không
  fail job. Bridge không cần đổi gì (không whitelist argv render).

## 2. Số đo thật (test_r2.js, 16/16 pass, VM 2 vCPU, không GPU)

| Đo | Kết quả |
|---|---|
| Mask 720p 5s, rect feather 0.2 — geq (cũ) | 3.74 fps (40.1s / 150 frame) |
| Mask 720p 5s, rect feather 0.2 — PNG (mới) | 34.07 fps (4.4s / 150 frame) |
| Speedup cùng spec | **9.1×** |
| Frame PNG vs geq (cùng frame giữa) | mean abs diff **0.339**/255, pct pixel lệch >8 là **0.704%**, max 74 |
| Mask + denoise 0.5, 720p 5s (PNG) | 17.61 fps |
| Denoise strength 1, nền phẳng + nhiễu | std 16.308 → **5.717** (−65%) |
| Stabilize (vidstab 2-pass) | render OK, đúng 2s, frame khác bản không stabilize (mean diff 21.281) |

- Về max diff 74: so sánh trên 2 file MP4 đã qua x264 (crf mặc định),
  nên max phản ánh nhiễu encode ở vài pixel biên, không phải sai hệ thống
  của mask — bằng chứng là mean chỉ 0.339 và 99.3% pixel lệch ≤ 8.
  Ngưỡng chấp nhận trong test: mean ≤ 3 và pctGt8 ≤ 1%.
- Về geq 3.74 fps vs số 0.97 fps của Q8: khác spec đo (Q8 đo ellipse
  feather 0.2 trên clip khác, lúc VM bận hơn; geq ellipse nặng hơn rect
  vì sqrt+pow mỗi pixel). Speedup 9.1× là so sánh cùng spec, cùng máy,
  cùng lúc — mới là con số có ý nghĩa. Đừng trích "mask nay 34 fps" mà
  không kèm điều kiện (rect, 720p, VM này); ellipse/1080p sẽ chậm hơn.

## 3. Cảnh báo mask + enhance trong UI (số thật, không đoán)
- EnhancePanel hiện cảnh báo khi clip có mask + (chống rung hoặc khử
  nhiễu) và dài ≥ 30s, với số đo: 720p mask + khử nhiễu ~17.6 fps
  (clip 60s ≈ 100s render), 1080p chậm thêm ~3× (tỉ lệ từ benchmark
  Phase 8: base 1080p 12.54 fps vs 720p 34.15 fps), chống rung cộng thêm
  1 pass phân tích toàn clip.
- Khử răng cưa (yadif) KHÔNG tính là "nặng" nên không trigger cảnh báo.
- Ngưỡng 30s là lựa chọn của R2 (clip 30s ở 17.6 fps ≈ 51s render — đủ
  lâu để đáng cảnh báo), không phải ngưỡng đo được từ CapCut hay chuẩn nào.

## 4. Giới hạn còn lại (đừng claim hơn)
- Preview KHÔNG áp enhance (chưa có đường preview cho yadif/vidstab/
  hqdn3d); user phải render thử đoạn ngắn để xem trước.
- EnhancePanel CHƯA click-test trên browser thật (chỉ tsc + vite build);
  logic patchClip theo đúng mẫu MaskPanel nên rủi ro thấp nhưng chưa
  được bấm thật.
- PNG mask là ảnh tĩnh theo khung hình output: mask không keyframe được
  (giống geq cũ — mask vốn là thuộc tính tĩnh của clip, không có
  keyframe theo thời gian).
- Dry-run vẫn để lại PNG mask tạm trong tmpdir (giống hành vi PNG text
  SR có sẵn); render thành công/thất bại thì dọn/giữ như mô tả ở §1b.
- Denoise đo trên nền phẳng + nhiễu tổng hợp, không phải footage thật;
  stabilize chỉ chứng minh pipeline chạy (frame thay đổi), không đo độ
  giảm rung định lượng (P2 đã kiểm chứng chất lượng vidstab trước đó).
- tsc toàn app lúc R2 kiểm tra còn 1 lỗi ở `src/lib/subtitles.test.ts`
  (TS5097, import `.ts`) — file của agent Phase 9 khác đang sửa dở,
  KHÔNG phải file R2, R2 không sửa để tránh xung đột. File R2 sạch tsc
  (grep output tsc cho enhance/Inspector/i18n = 0 lỗi).

## 5. File đã tạo/sửa (để parent gom batch — CHƯA PUSH)
- Tạo: `server/render/src/mask_png.py`, `server/render/src/test_r2.js`,
  `server/render/src/R2_LIMITS.md` (file này),
  `apps/web/src/components/enhance/EnhancePanel.tsx`,
  `apps/web/src/components/enhance/index.ts`.
- Sửa: `server/render/src/mask.js` (maskKey, buildMaskPngChain,
  buildMaskChainFor, self-test §8), `server/render/src/render.js`
  (--mask-mode, sinh PNG, 3 site mask, ctx.maskPng, dọn tmp),
  `apps/web/src/Inspector.tsx` (import + section Enhance),
  `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (key secEnhance).
- Kiểm chứng: test_r2.js 16/16, mask.js self-test pass, enhance.js
  self-test pass, test_p7_asset.js 7/7 (hồi quy render.js), vite build
  pass, tsc sạch cho file R2.
