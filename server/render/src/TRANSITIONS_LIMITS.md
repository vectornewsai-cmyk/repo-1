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

## 🔌 CHƯA TÍCH HỢP (cần agent chính làm — tôi không được sửa file người khác)

Module `transitions.js` đã xong và test độc lập, nhưng render worker chính
**chưa dùng nó**:

- `server/render/src/render.js` (dòng dựng xfade): hiện hardcode
  `xfade=transition=fade`. Cần thay bằng `buildXfadeFilter(tr.type, T, offset)`.
  Patch gợi ý (1 dòng):
  ```js
  const { buildXfadeFilter } = require("./transitions");
  // ...
  fc.push(
    `${cur.label}${seg.label}` +
    buildXfadeFilter(tr.type, T, cur.duration - T) +
    `[${x}]`
  );
  ```
- `server/render/src/validate.js`: hiện chỉ chấp nhận
  `["fade", "none"]` ở `transitionIn/transitionOut` và logic ghép cặp
  transition chỉ nhận `type === "fade"`. Cần mở rộng theo catalog mới
  (dùng `isSupportedTransition()` từ `transitions.js`).
- `packages/video-spec/src/index.ts`: `Transition["type"]` vẫn là
  `"fade" | "none"` — nên import `TransitionType` từ `transitions.ts`
  (file mới, chưa được export qua package `exports` — cần thêm entry
  `"./transitions"` vào `packages/video-spec/package.json`).
- `apps/web`: `TransitionPanel` (mới, ở
  `apps/web/src/components/transitions/`) chưa được gắn vào `Inspector.tsx`
  (hiện dropdown chỉ có none/fade); `preview.tsx` cũng chỉ preview được
  fade bằng alpha — preview canvas cho các transition mới là việc riêng.

## Kiểm chứng đã làm

- `node demo_transitions.js --out-dir ./demo_out` → 3/3 video render thành công,
  ffprobe pass 9/9 checks (codec h264, 640x360, đúng duration).
- 11/11 frame giữa transition được xem bằng mắt: ranh giới/hướng chuyển động
  đúng với tên gọi (wipe: nửa-màn hình; dissolve: noise; circleopen: vòng tròn;
  radial: cánh quạt; fadeblack/white: chìm về đen/trắng).
- Unit test `transitions.js`: 12/12 pass (catalog, build filter, error cases).
- `tsc --strict` cho `packages/video-spec/src/transitions.ts`: PASS.
- `npm run build` (tsc + vite) cho `apps/web`: PASS.
