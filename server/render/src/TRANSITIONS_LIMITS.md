# TRANSITIONS — Giới hạn & trạng thái trung thực

> Nguyên tắc: chỉ liệt kê là "hoạt động" những gì đã render ra MP4 thật
> và được kiểm chứng bằng mắt (frame trích giữa transition).

## ✅ HOẠT ĐỘNG (đã kiểm chứng bằng video thật)

Tất cả dùng filter `xfade` có sẵn của FFmpeg 8.1.2 — không cần GPU, không cần
shader custom. Mỗi transition dưới đây đã render thật trong
`demo_transitions.js` (3 video: `demo_out/demo-wipes.mp4`,
`demo_out/demo-slides.mp4`, `demo_out/demo-fx.mp4`) và frame giữa transition
đã được xem bằng mắt, đúng hiệu ứng mong đợi.

| type | Hiệu ứng | Video demo |
|---|---|---|
| `fade` | Mờ dần (crossfade) | đã có từ Phase 1 |
| `fadeblack` | Mờ qua màn đen | demo-fx |
| `fadewhite` | Mờ qua màn trắng | demo-fx |
| `wipeleft` | Quét sang trái | demo-wipes |
| `wiperight` | Quét sang phải | demo-wipes |
| `wipeup` | Quét lên trên | demo-slides |
| `wipedown` | Quét xuống dưới | demo-wipes |
| `slideleft` | Trượt sang trái | demo-slides |
| `slideright` | Trượt sang phải | demo-slides |
| `dissolve` | Hòa tan (noise) | demo-fx |
| `circleopen` | Vòng tròn mở từ giữa | demo-fx |
| `radial` | Xoay tỏa tròn | demo-fx |
| `none` | Không hiệu ứng (cắt cứng) | — |

## ✅ P5 (Phase 7): 9 transition custom expr — render thật, kiểm chứng pixel

FFmpeg 8.1.2 chỉ có 58 transition xfade built-in (đã dùng hết). 9 transition
mới này dùng `xfade=transition=custom` + biểu thức theo pixel (X, Y, W, H,
A, B, P) — không cần shader, không cần gltransition. Mỗi expr đã render
thật bằng ffmpeg và kiểm chứng bằng pixel (`server/render/test_p5_transitions.py`,
9/9 pass): frame giữa transition khác cả 2 frame gốc, blinds/bars có pattern
xen kẽ đúng. Một transition (`blinds-h`) cũng đã chạy qua render worker thật
(spec 2 clip → MP4, frame giữa có đúng dải mành).

| type | Hiệu ứng |
|---|---|
| `blinds-h` | Mành ngang mở dần |
| `bars-v` | Thanh dọc mở dần |
| `checker` | Bàn cờ lan chéo |
| `diamond` | Hình thoi nở từ giữa |
| `plus` | Dấu cộng lan ra |
| `grid` | Lưới ô vuông nở dần |
| `clock` | Quét tròn như kim đồng hồ |
| `circle-soft` | Vòng tròn mở, viền mờ mềm |
| `bars-fade` | Thanh dọc trên nền crossfade |

Lưu ý kỹ thuật: expr chứa dấu phẩy nên `buildXfadeFilter` PHẢI bọc expr
trong `'...'` — nếu không parser filtergraph hiểu dấu phẩy là tách filter.

## ❌ CHƯA HỖ TRỢ (và lý do thật)

1. **21 transition GLSL trong `assets/transitions/`** (gl-transitions: cube,
   doorway, crosszoom, swirl, morph, kaleidoscope, glitchdisplace, filmburn,
   tvstatic, windowblinds, bookflip, bounce, crosswarp, dreamyzoom,
   directionalwipe, ...): cần filter `gltransition` (OpenGL) — **không có**
   trong build FFmpeg hiện tại (`ffmpeg -h filter=gltransition` → "Unknown
   filter"). Các file `.glsl` chỉ dùng làm tài liệu tham khảo ý tưởng, KHÔNG
   copy code. Muốn hỗ trợ thật phải build FFmpeg có OpenGL hoặc viết lại hiệu
   ứng bằng filter chain thuần — việc lớn, để phase sau.

2. **Các xfade còn lại của FFmpeg** (slideup, slidedown, smoothleft/right/up/down,
   diagtl/tr/bl/br, pixelize, hblur, ...): về mặt kỹ thuật chạy được (cùng cơ chế
   xfade), nhưng **chưa render thử nên KHÔNG đưa vào catalog** — đúng nguyên tắc
   "chưa test thì không khai báo".

## ✅ ĐÃ TÍCH HỢP (cập nhật 19/10/2026, commit `1844e2cc`)

Module `transitions.js` đã được nối vào render worker chính:

- `server/render/src/render.js`: `buildXfadeFilter(tr.type, T, offset)` được gọi
  tại dòng 264 (thay cho hardcode `xfade=transition=fade` cũ).
- `server/render/src/validate.js`: dùng `isSupportedTransition()` để chấp nhận
  cả 13 loại transition (không còn giới hạn `["fade", "none"]`).
- `packages/video-spec/src/index.ts`: export `transitions.ts` với đầy đủ 13 type.
- `apps/web`: `TransitionPanel` đã mount vào `Inspector.tsx`.
- Preview canvas: vẫn chỉ preview được `fade` bằng alpha (các transition mới
  chưa có preview riêng) — xem P0-08.

## ✅ TRANSITIONHARVEST (19/10/2026) — 30 transition xfade còn thiếu

FFmpeg 8.1.2 hỗ trợ 58 xfade transitions (0–57); VCut trước đây chỉ có 28.
Đã bổ sung toàn bộ 30 cái còn thiếu, mỗi cái render thật MP4 (testsrc2 +
smptebars, 320×240, 30fps) và kiểm tra mid-frame không bị đen toàn frame:

| Nhóm | Transitions mới |
|---|---|
| Khép | `vertclose`, `horzclose` |
| Chéo | `diagtr`, `diagbl`, `diagbr` |
| Lát cắt | `hlslice`, `hrslice`, `vuslice`, `vdslice` |
| Fade | `fadegrays`, `fadefast`, `fadeslow` |
| Quét góc | `wipetl`, `wipetr`, `wipebl`, `wipebr` |
| Biến dạng | `squeezeh`, `squeezev`, `zoomin` |
| Gió | `hlwind`, `hrwind`, `vuwind`, `vdwind` |
| Phủ | `coverleft`, `coverright`, `coverup`, `coverdown` |
| Hé lộ | `revealleft`, `revealright`, `revealup`, `revealdown` |

Tổng catalog hiện tại: **58 transitions** (không tính `none`).
`assets/transitions/catalog.json` là bản machine-readable đầy đủ.

## ✅ V3 (Phase 9 đợt 10): 14 transition custom expr mới — render thật, kiểm chứng pixel

Cùng cơ chế P5 (`xfade=transition=custom` + expr trên X, Y, W, H, A, B, P).
Mỗi expr đã render thật bằng FFmpeg 8.1.2 (2 màu phẳng đỏ/xanh, 320×240,
xfade 2s) và kiểm chứng bằng pixel trong `server/render/test_v10_transitions.py`
(**14/14 pass**): frame giữa (P=0.5) khác cả 2 frame gốc (dA và dB đều > 5,
thực tế 32–137), và probe điểm đúng pattern hình học của từng hiệu ứng.
Test đọc expr trực tiếp từ `transitions.js` (không hardcode bản sao) và chạy
thêm `buildXfadeFilter` qua node cho cả 14 type (quoting expr đúng).
Tổng catalog sau đợt: **81 transitions** (không tính `none`) = 58 xfade
built-in + 23 custom expr (9 P5 + 14 V3).

| type | Hiệu ứng | Pixel-check ở P=0.5 (dA / dB) |
|---|---|---|
| `diamondclose` | Hình thoi khép (ngược `diamond`) | 84.0 / 85.1 — tâm đỏ (A), góc xanh (B) |
| `squareopen` | Vuông mở từ giữa | 57.0 / 112.1 — tâm xanh, góc đỏ |
| `squareclose` | Vuông khép (ngược `squareopen`) | 112.0 / 57.1 — tâm đỏ, góc xanh |
| `checker-alt` | Bàn cờ xen kẽ (ô chẵn trước, ô lẻ sau) | 84.5 / 84.8 — ô (20,15) xanh, (60,15)/(20,45) đỏ |
| `blinds-diag` | Mành chéo | 86.2 / 84.4 — dọc hàng y=120 xen kẽ xanh/đỏ/xanh |
| `split-h` | Tách ngang (trên từ trái, dưới từ phải) | 84.2 / 84.8 — 4 góc đúng chiều |
| `split-v` | Tách dọc (trái từ trên, phải từ dưới) | 84.2 / 84.9 — 4 góc đúng chiều |
| `barn-h` | Cửa chuồng ngang (từ 2 mép trái-phải) | 84.0 / 85.1 — 2 mép xanh, tâm đỏ |
| `barn-v` | Cửa chuồng dọc (từ 2 mép trên-dưới) | 83.8 / 85.2 — 2 mép xanh, tâm đỏ |
| `rings` | Vòng tròn đồng tâm | 87.5 / 82.2 — tâm xanh, r=40 đỏ, r=60 xanh |
| `corners` | Bốn góc nở đồng thời | 69.2 / 99.9 — góc xanh, tâm và mép giữa đỏ |
| `star` | Sao 5 cánh (xấp xỉ, xem §xấp xỉ) | 136.6 / 32.5 — hướng cánh xanh, hướng thung lũng đỏ |
| `clock-ccw` | Đồng hồ ngược chiều (ngược `clock`) | 84.2 / 84.9 — nửa dưới xanh, nửa trên đỏ |
| `spiral` | Xoắn ốc (cánh xoắn theo bán kính) | 84.2 / 84.9 — tia phải: trong đỏ, ngoài xanh |

Mirror đã cập nhật khớp catalog: `apps/web/src/components/transitions/TransitionPanel.tsx`
(list), `apps/web/src/i18n/vi.json` + `en.json` (nhãn/mô tả 14 type),
`packages/video-spec/src/transitions.ts` (types + meta),
`assets/transitions/catalog.json` (total 67 → 81).
LƯU Ý: `packages/video-spec/src/transitions.js` là bản emit cũ đã lệch từ
trước đợt này (nó còn thiếu cả 9 entry P5) nên đợt này cố tình KHÔNG sửa
tay file đó — nguồn thật là `transitions.ts`, file `.js` cần regenerate
bằng tsc thay vì sửa tay.

### ⚠️ Chỉ xấp xỉ (không giấu)

- **`star` là sao xấp xỉ, không phải sao hình học chuẩn.** Bán kính ngưỡng
  được điều biến bằng `1 + 0.4*cos(5θ)` rồi chia cho 0.6 để ở P=1 vẫn phủ
  kín toàn khung (hệ số nhỏ nhất = 1.0 × Rmax) — nhờ vậy transition kết
  thúc sạch, nhưng cánh sao ở giữa transition dài hơn sao đều thật
  (điểm cánh vượt ra ngoài khung, thung lũng ở 0.5×Rmax). Probe đã chứng
  minh đúng cấu trúc 5 cánh (hướng cánh xanh, hướng thung lũng đỏ), nhưng
  đừng quảng cáo là "sao chuẩn".
- **`diamondclose` / `squareclose` / `clock-ccw` là bản ngược chiều của
  transition đã có**, không phải hiệu ứng cơ chế mới — vẫn tính là
  transition riêng vì render và pattern khác thật, nhưng không thổi phồng
  thành "cơ chế mới".
- **Preview CSS trong TransitionPanel cho 14 type mới là minh họa chung**
  (không có animation riêng từng hiệu ứng) — render thật mới là chuẩn,
  giống các custom P5 trước đây.

### ❌ Đã thử nhưng expr KHÔNG biểu diễn được nên bỏ (không giấu)

1. **Hình trái tim (heart) — thử rồi, bỏ.** Expr ẩn `(x²+y²−1)³−x²y³ ≤ 0`
   co theo P render được ở giữa transition (tâm xanh, bluefrac 0.23),
   nhưng ở cuối transition (P≈0.95) vùng B **biến mất** (bluefrac 0.00)
   thay vì phủ kín — hành vi sai, không sửa được bằng chuẩn hoá đơn giản
   trong khuôn khổ expr chọn pixel. Vì vậy không đưa vào catalog.
2. **Mọi hiệu ứng cần remap tọa độ — không thể, theo cấu trúc.**
   Expr custom của xfade chỉ được CHỌN hoặc TRỘN giá trị A/B tại cùng một
   pixel (X, Y) — không có biến nào để lấy mẫu A/B tại tọa độ khác.
   Do đó xoay, zoom/morph, xoắn (swirl), dịch chuyển pixel (glitch
   displace) và mọi hiệu ứng warp đều **không thể biểu diễn bằng
   custom-expr**, bất kể viết expr khéo đến đâu. Đây cũng là lý do 21
   transition GLSL vẫn ngoài tầm với nếu không có gltransition.
3. **Bản sao trùng lặp đã loại ngay từ thiết kế, không đưa vào test:**
   `blinds-v` (expr trùng hệt `bars-v` — cùng `mod(X,…)`), và một bản
   custom của `circleclose` (hành vi trùng built-in `circleclose` đã có).
   Thêm vào chỉ làm catalog phình mà không thêm hiệu ứng thật nào.
   Ngược lại, các bản ngược chiều (`diamondclose`, `squareclose`,
   `clock-ccw`, `barn-h`/`barn-v` so với `horzopen`/`vertopen`) ĐƯỢC giữ
   vì pattern render khác thật (đã probe điểm chứng minh).

## Kiểm chứng đã làm

- `node demo_transitions.js --out-dir ./demo_out` → 3/3 video render thành công,
  ffprobe pass 9/9 checks (codec h264, 640x360, đúng duration).
- 11/11 frame giữa transition được xem bằng mắt: ranh giới/hướng chuyển động
  đúng với tên gọi (wipe: nửa-màn hình; dissolve: noise; circleopen: vòng tròn;
  radial: cánh quạt; fadeblack/white: chìm về đen/trắng).
- Unit test `transitions.js`: 12/12 pass (catalog, build filter, error cases).
- `tsc --strict` cho `packages/video-spec/src/transitions.ts`: PASS.
- `npm run build` (tsc + vite) cho `apps/web`: PASS.
