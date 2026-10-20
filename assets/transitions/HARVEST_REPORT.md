# Transition Harvest Report — 2026-10-19

## Kết quả

| Chỉ số | Trước | Sau |
|---|---|---|
| xfade transitions trong catalog | 28 | **58** (full coverage FFmpeg 8.1.2) |
| GLSL transitions (không dùng được) | 21 | 21 (không đổi) |
| File catalog machine-readable | không có | `catalog.json` |

## Phương pháp

Thay vì "săn" transitions từ GitHub (rủi ro license, chất lượng không đồng đều),
đã kiểm tra toàn bộ 58 xfade transitions có sẵn trong FFmpeg 8.1.2
(`ffmpeg -h filter=xfade`) và phát hiện VCut chỉ dùng 28/58.

30 transitions còn thiếu đã được:
1. Render thật MP4 (testsrc2 + smptebars, 320×240, 30fps) — 30/30 pass
2. Kiểm tra mid-frame không đen toàn frame (khác với `circlecrop`/`rectcrop`)
3. Thêm vào `server/render/src/transitions.js` (label + description tiếng Việt)
4. Mirror vào `packages/video-spec/src/transitions.ts`
5. Thêm option vào `TransitionPanel.tsx` + CSS preview animation

## Danh sách "cần custom implementation"

Các hiệu ứng KHÔNG làm được bằng xfade (cần shader custom / gltransition):

| Hiệu ứng | Nguồn tham khảo | Trạng thái |
|---|---|---|
| 21 GLSL transitions (`assets/transitions/*.glsl`) | gl-transitions (MIT) | ⛔ FFmpeg build hiện tại thiếu `gltransition` — không render được |
| CrossZoom, Cube, Doorway, BookFlip, Bounce, GlitchDisplace, TVStatic, FilmBurn, Swirl, Kaleidoscope, WindowBlinds, DirectionalWipe, Morph, DreamyZoom, CrossWarp | gl-transitions (MIT) | ⛔ như trên |

**Lựa chọn thay thế:** nếu cần hiệu ứng tương tự mà không có gltransition,
có thể implement bằng filter chain FFmpeg thuần (vd: FilmBurn ≈ noise + colortemperature;
TVStatic ≈ noise). Chưa làm — ghi nhận là future work.

## CSS transition libraries (đã đánh giá, không harvest)

Đã search GitHub nhưng không tìm được library CSS nào phù hợp để harvest trực tiếp
(Animate.css là animation cho element đơn, không phải transition giữa 2 video).
Thay vào đó đã tự viết 30 CSS preview animations trong
`apps/web/src/components/transitions/transitions.css` (tác phẩm gốc, MIT của repo).

## Files đã tạo/sửa

- `assets/transitions/catalog.json` (mới) — 58 transitions, machine-readable
- `assets/transitions/HARVEST_REPORT.md` (mới) — file này
- `assets/SOURCES.md` — thêm dòng catalog.json
- `server/render/src/transitions.js` — +30 entries
- `server/render/src/TRANSITIONS_LIMITS.md` — +section TransitionHarvest
- `packages/video-spec/src/transitions.ts` — +30 types + metadata
- `apps/web/src/components/transitions/TransitionPanel.tsx` — +30 options
- `apps/web/src/components/transitions/transitions.css` — +30 preview animations
