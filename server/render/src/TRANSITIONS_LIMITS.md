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

## Kiểm chứng đã làm

- `node demo_transitions.js --out-dir ./demo_out` → 3/3 video render thành công,
  ffprobe pass 9/9 checks (codec h264, 640x360, đúng duration).
- 11/11 frame giữa transition được xem bằng mắt: ranh giới/hướng chuyển động
  đúng với tên gọi (wipe: nửa-màn hình; dissolve: noise; circleopen: vòng tròn;
  radial: cánh quạt; fadeblack/white: chìm về đen/trắng).
- Unit test `transitions.js`: 12/12 pass (catalog, build filter, error cases).
- `tsc --strict` cho `packages/video-spec/src/transitions.ts`: PASS.
- `npm run build` (tsc + vite) cho `apps/web`: PASS.
