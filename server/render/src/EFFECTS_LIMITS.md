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
