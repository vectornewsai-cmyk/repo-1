# EFFECTS_LIMITS.md — Giới hạn trung thực của video effects (Phase 3c)

Tài liệu này liệt kê TRUNG THỰC những gì làm được và chưa làm được.
Cập nhật: 2026-10-19.

## Đã kiểm chứng bằng MP4 thật ✅

| Effect | Filter FFmpeg | Kiểm chứng |
|---|---|---|
| blur | `gblur=sigma=0.5..8` | MP4 3s, frame mờ rõ rệt |
| sharpen | `unsharp=5:5:0.2..2.0` | MP4 3s render OK |
| grayscale | `hue=s=1..0` | Frame intensity=1: đen trắng hoàn toàn |
| sepia | `colorchannelmixer` (nội suy ma trận) | Frame: tông nâu vàng rõ |
| vignette | `vignette=angle=PI/10..PI/2.5` | Frame: 4 góc tối, giữa sáng |
| noise | `noise=alls=5..50:allf=t` | MP4 3s (file lớn do nhiễu khó nén) |
| brightness | `eq=brightness=-0.35..+0.35` | 0.5 = giữ nguyên |

Chạy lại kiểm chứng bất cứ lúc nào: `cd server/render && node demo_effects.js`

## Chưa làm được ❌

1. **GLSL custom effects** (7 file trong `assets/effects/`: crt, glitch, glow,
   old-film, rgb-split, shockwave, zoom-blur): FFmpeg build này KHÔNG có
   filter `gltransition`, không chạy được shader GLSL. Các file đó chỉ là
   tài liệu tham khảo ý tưởng, KHÔNG được dùng trong render.
2. **Preview trên web chưa hiển thị effects**: `preview.tsx` vẽ bằng canvas 2D,
   chưa nối `clip.effects`. Chỉ thấy kết quả sau khi render MP4.
3. **Không có effect theo vùng** (chỉ làm mờ một phần khung hình): cần mask,
   chưa implement.
4. **Không có animation cho effect** (vd: mờ dần theo thời gian): intensity là
   hằng số cho cả clip. Muốn animate phải dùng keyframes (chưa hỗ trợ keyframe
   cho effects).
5. **noise làm file MP4 lớn**: nhiễu ngẫu nhiên khó nén (demo 3s = 9MB).
   Production nên giới hạn intensity hoặc dùng preset thấp hơn.

## Tương tác với tính năng khác

- **chroma key + effects**: effects áp SAU chroma trong chain. Blur sau khi key
  có thể làm nhòe viền alpha — dùng cẩn thận.
- **transition (xfade) + effects**: xfade nối 2 stream đã áp effects riêng —
  hoạt động bình thường (mỗi clip giữ effect của mình trong transition).
- **speed**: không ảnh hưởng effects (filter tĩnh theo frame).

## So với CapCut

CapCut có hàng trăm effect, nhiều cái dùng AI/GPU (thay nền trời, slow-zoom
thông minh...). 7 effect ở đây là filter cổ điển của FFmpeg — đủ dùng cho
nhu cầu cơ bản, nhưng chưa phải đẳng cấp "hiệu ứng AI" của CapCut.

## Q4 (Phase 8) — 9 effect mới, đã pixel-verify ✅

| Effect | Filter FFmpeg | Kiểm chứng (test_q4_effects.js + measure.py, 13/13) |
|---|---|---|
| glitch | `rgbashift` + `noise` | Biên tròn trắng có \|R-B\| = 119 (lệch kênh + nhiễu) |
| rgb-shift | `rgbashift` | Biên có \|R-B\| = 129, vùng phẳng std = 0 (sạch, khác glitch) |
| shake | `crop` cửa sổ sin/cos + `pad` khôi phục | Đúng 320x180, frame khác nguồn |
| pixelate | `geq` lấy mẫu từng khối KxK (đợt 149 — xem ghi chú dưới) | Đoạn màu hàng gradient: 212 → ~83 |
| mirror | `hflip` | Trái output xanh (0,0,254), phải output đỏ (253,0,0) |
| old-film | `noise` + `eq` nhạt màu + `vignette` | Vùng đỏ max-min kênh = 72, std nhiễu = 19.3 |
| invert | `lutrgb` nội suy val → 255-val | intensity=1: sai lệch max = 2 so với đảo tuyệt đối |
| edgedetect | `edgedetect=low:high` | Mean R = 2.2 (nền tối), max = 255 (biên sáng) |
| hue-rotate | `hue=h=(t-0.5)*180` | Vùng đỏ cũ (255,0,0) → (172,82,0) |

Chạy lại: `cd server/render && node test_q4_effects.js` (render 10 clip + đo PIL).

## Đợt 149 (T0) — pixelate đổi từ scale sang geq (BUGFIX, `npm test` từng FAIL)

**Lỗi:** `scale=iw/K:ih/K,scale=iw*K:ih*K` (neighbor) cắt ngọn iw/K rồi nhân
ngược nên khung hình ra sai kích thước: 640x360 @ K=13 → 637x351 (lẻ) →
libx264 (yuv420p) từ chối encode → demo_effects FAIL, 5 effect sau pixelate
(mirror/old-film/invert/edgedetect/hue-rotate) chưa từng được test. Với
K=6/11/12/14/15 kích thước ra chẵn nhưng sai (636x...) → vỡ xfade/mask
downstream vốn đòi đúng WxH. Chỉ K chia hết W,H mới đúng — parity đợt 17
chọn đúng k=8 (chia hết 1280x720) nên không lộ lỗi.

**Sửa:** `geq` lấy mẫu từng khối KxK tại đầu khối + floor(K/2) — đúng vị trí
lấy mẫu đợt 19 đã khóa cho scale-neighbor — nên kích thước ra = kích thước
vào với MỌI K (2..16) và MỌI W/H. Chroma lấy đúng vị trí luma `(bx+F)/2`
(trunc) để lưới khối chroma khớp lưới luma; biến thể chroma khối riêng
floor(K/2) đã đo tệ hơn hẳn trên ramp đối kháng (MAD 13,1 so với 3,8 ở K=13).
BẮT BUỘC kèm `alpha_expr`: geq thiếu nó sẽ ép alpha về 0 (đã đo thực:
clip alpha thành trong suốt hoàn toàn); trên yuv420p (không alpha) thì
alpha_expr được bỏ qua, không lỗi (đã đo thực).

**Kiểm chứng đợt 149:** `test_pixelate_render.js` mới — 20 case render thật
(5 size x 4 intensity, gồm 854x480/360x640/1920x1080) đều exit 0 + đúng kích
thước + frame pixel hoá thật; `demo_effects.js` chạy hết 16 effect (trước
đây dừng ở pixelate); `test_q4_effects.js` render qua pipeline render.js
thật 10/10. `npm test` đầy đủ pass (xem docs/PHASE9_ROUND149_T0_PIXELATE_LIMITS.md).

**Còn mở (cập nhật đợt 150):** test_v19_pixelate_probe.js ĐÃ VIẾT LẠI sang
cơ chế geq (dùng chuỗi filter THẬT từ `buildEffectFilter`, không hardcode) —
khóa mới: vị trí lấy mẫu floor(K/2) theo luma, kích thước ra == vào (36 case),
khối hằng, alpha không về 0; 34/34 assert đạt (xem
docs/PHASE9_ROUND150_T0_PIXELATE_LIMITS.md). **Đính chính số yuv444 đợt 149:**
LIMITS đợt 149 §5 ghi geq-yuv444 MAD 0,37–0,43 — đo lại độc lập bằng chuỗi
filter thật cho MAD 4,03–7,01 trên ramp; số 0,37–0,43 là của biến thể chroma
full-res (lấy mẫu X-mod(X,K)+F trên cả 3 kênh), KHÔNG phải chuỗi filter thật
(biểu thức chroma của bản chốt viết cho chroma nửa phân giải yuv420p — trên
yuv444p nó lấy 2 vị trí/khối). Đường pipeline thật là yuv420p nên không ảnh
hưởng sản phẩm; parity canvas-vs-FFmpeg cho geq nay khóa theo luma trên
yuv420p (yMAD 1,37–1,56 trên ramp, sàn roundtrip ~1,30–1,60). Hiệu năng geq
đo riêng đợt 150: ~4 Mpx/s đơn luồng — 640x360 ~16 fps, 1280x720 ~4,5 fps,
1920x1080 ~1,9 fps, 3840x2160 ~0,4 fps (chậm hơn scale cũ ~15–90 lần tùy
size); xem chi tiết trong LIMITS đợt 150 §4.

## Q4 — Không làm được / giới hạn

1. **posterize**: filter `posterize` KHÔNG có trong FFmpeg 8.1.2 của VM (Unknown
   filter) nên bỏ, thay bằng hue-rotate. Đừng thêm lại khi chưa kiểm tra filter.
2. **shake có viền đen 12px cố định**: `pad` không hiểu biến `t` nên chỉ cửa sổ
   crop chuyển động, pad khôi phục kích thước với offset cố định 12,12.
3. **mirror không có cường độ**: `hflip` nhị phân, intensity bị bỏ qua (ghi rõ
   trong EFFECT_META mô tả, không giả vờ nội suy).
4. **Preview web**: invert/hue-rotate/old-film có CSS xấp xỉ; glitch, rgb-shift,
   shake, pixelate, mirror, edgedetect preview bỏ qua (không có CSS tương đương)
   — xem previewEngine.ts `effectsVisual` nhánh skipped.
