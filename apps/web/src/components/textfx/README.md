# TextFX — Text Animations (Phase TextFX)

Mở rộng text animations từ 3 lên 8 hiệu ứng. Mọi hiệu ứng mới đã render MP4 thật
và kiểm chứng bằng mắt (xem `server/render/demo_textfx.js`).

## File đã tạo

| File | Nội dung |
|---|---|
| `packages/video-spec/src/textfx.ts` | `TEXT_ANIMATIONS` (8 giá trị), `TextAnimation`, `TEXT_ANIMATION_META` (tiếng Việt), `isTextAnimation()`, `isDrawtextAnimation()` |
| `server/render/src/textfx.js` | `buildTextAnimExpr(anim, style, clipStart)` → `{x, y, alpha}` cho drawtext; self-test 9 nhóm assertion |
| `server/render/demo_textfx.js` | Render 5 MP4 demo + tự verify ffprobe + trích frame |
| `server/render/src/TEXTFX_LIMITS.md` | Giới hạn trung thực |
| `apps/web/src/components/textfx/` | `TextAnimPicker.tsx` (grid chọn, controlled `{value, onChange}`), `textfx.css` (preview CSS), `index.ts` |

## Hiệu ứng mới (5 cái, đều render THẬT)

| Animation | Mô tả | Thời gian |
|---|---|---|
| `fadeIn` | Mờ dần vào (alpha 0→1) | 0.8s |
| `slideInLeft` | Trượt từ ngoài mép trái vào + mờ | 0.7s |
| `slideInRight` | Trượt từ ngoài mép phải vào + mờ | 0.7s |
| `slideUp` | Trượt từ dưới màn hình lên + mờ | 0.7s |
| `bounce` | Rơi từ trên xuống 140px, nảy 1 nhịp, đứng yên | 1.0s |

## Tích hợp (parent agent làm — 4 chỗ)

### 1. `packages/video-spec/src/index.ts`
```ts
// Thêm import (đầu file, cùng chỗ import Transition/ClipAnimations):
import type { TextAnimation } from "./textfx";
// Đổi TextStyle.animation:
animation?: TextAnimation;
```

### 2. `server/render/src/render.js`
```ts
// Thêm import:
const { buildTextAnimExpr, isTextFxAnimation } = require("./textfx");
// Trong vòng lặp text clips, thay toàn bộ nhánh fadeUp bằng:
if (clip.animations && (...)) {
  // ... (giữ nguyên nhánh keyframes)
} else if (isTextFxAnimation(clip.style.animation ?? "none")) {
  const te = buildTextAnimExpr(clip.style.animation ?? "none", st, S);
  fx = te.x; fy = te.y;
  extra += `:alpha='${te.alpha}'`;
}
// ("typewriter" vẫn `continue` xử lý riêng bằng ASS như cũ.)
```
Lưu ý: `buildTextAnimExpr("fadeUp", ...)` cho kết quả KHỚP công thức fadeUp hiện tại,
nên thay thế là an toàn (đã kiểm chứng công thức trong self-test).

### 3. `server/render/src/validate.js`
```js
// Thêm import:
const { isTextAnimation } = require("./textfx");
// Thay dòng kiểm tra animation:
if (!isTextAnimation(st.animation))
  err(where, `style.animation không hỗ trợ: ${JSON.stringify(st.animation)}`);
```

### 4. `apps/web/src/Inspector.tsx` (thay dropdown animation cũ)
```tsx
import { TextAnimPicker } from "./components/textfx";
// Thay <label className="field"><span>Hiệu ứng xuất hiện</span><select>...</select></label> bằng:
<TextAnimPicker
  value={clip.style.animation ?? "none"}
  onChange={(v) => st.patchTextStyle(track.id, clip.id, { animation: v })}
/>
```

### 5. (Khuyến nghị) `apps/web/src/preview.tsx`
Thêm preview canvas cho 5 animation mới trong `drawTextClip()` — logic mirror
công thức FFmpeg (dùng `elapsed = t - clip.start`). Ví dụ `slideInLeft`:
```ts
const p = clamp(elapsed / 0.7, 0, 1);
xOff = -(1 - p) * (box.x + box.w / 2); // từ ngoài mép trái
alpha = p;
```
(Không bắt buộc cho render đúng — chỉ ảnh hưởng preview trong editor.)

## Kiểm chứng đã chạy

- `node src/textfx.js --self-test` → 9/9 nhóm assertion pass
- `node demo_textfx.js` → 5/5 video pass ffprobe (h264 640x360, đúng 2.5s)
- Xem frame bằng mắt: 10/10 frame đúng — slideInLeft đang trượt nửa chừng ở mép trái,
  slideUp đang nhô từ dưới lên, bounce ở trên cao tại t=0.05s và đứng yên tại t=0.5s,
  fadeIn mờ một nửa tại t=0.25s, mọi video đứng yên đúng vị trí sau intro
- `npx tsc --strict --noEmit` cho textfx.ts → pass (chạy ở bước dưới)
