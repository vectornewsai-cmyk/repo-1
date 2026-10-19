# EffectPanel — Video effects cho clip video

Panel tự đọc selection từ store. Tích hợp 1 dòng trong `Inspector.tsx`
(phần `clip.kind === "video"`):

```tsx
import { EffectPanel } from "./components/effects";
{clip.kind === "video" && (
  <>
    <div className="panel-head" style={{ marginTop: 12 }}>🎨 Hiệu ứng</div>
    <EffectPanel />
  </>
)}
```

## Hành vi

- 7 hiệu ứng: làm mờ, sắc nét, đen trắng, nâu cổ điển, tối góc, nhiễu hạt, sáng/tối.
- Mỗi hiệu ứng: toggle bật/tắt + slider cường độ 0..1.
- Lưu vào `clip.effects: VideoEffect[]` (theo thứ tự bật).
- Validate bằng `validateVideoEffects()` trước khi patch.

## Giới hạn

- Hiệu ứng chỉ hiện khi **render** (FFmpeg). Preview trên web chưa áp dụng
  (preview.tsx vẽ bằng canvas 2D, chưa nối effects).
- Xem `server/render/src/EFFECTS_LIMITS.md` để biết giới hạn render.
