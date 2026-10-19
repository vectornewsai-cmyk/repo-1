# LutPicker — Hướng dẫn tích hợp

Component chọn bộ lọc màu LUT cho video clip. Self-contained, controlled.

## Cách gắn vào Inspector (1 bước)

Trong `Inspector.tsx`, ở phần `clip.kind === "video"`:

```tsx
import { LutPicker } from "./components/lut";
import type { LutId } from "@repo-1/video-spec";

// ... trong phần video:
<div className="panel-head" style={{ marginTop: 12 }}>🎨 Bộ lọc màu</div>
<LutPicker
  value={clip.filter?.lut}
  onChange={(lut: LutId | undefined) =>
    patch({ filter: lut ? { lut } : undefined })
  }
/>
```

## Cách gắn vào video-spec index.ts

`lut.ts` hiện dùng module augmentation để gắn `filter?` vào `VideoClip`.
Khi parent tích hợp chính thức, thêm vào `index.ts`:

```ts
export * from "./lut";
import type { VideoFilter } from "./lut";
// trong interface VideoClip:
filter?: VideoFilter;
```

rồi xóa block `declare module "./index"` ở cuối `lut.ts`.

## Cách gắn vào render.js

Trong chain video (sau `format=yuv420p`):

```js
const { buildLutFilter } = require("./lut");
// ...
const lutChain = clip.filter?.lut ? `,${buildLutFilter(clip.filter.lut, assetsDir)}` : "";
// nối vào cuối chain: `...format=yuv420p${lutChain}[${v}]`
```

`assetsDir` là thư mục `assets/` của dự án (chứa `filters/*.cube`).
Trong validate.js: `const { validateVideoFilter } = require("./lut");`
rồi gọi trong `validateClip` cho video.

## Giới hạn (xem thêm server/render/src/LUT_LIMITS.md)

- Preview trong picker chỉ là CSS filter gần đúng (đã ghi rõ "minh họa").
- LUT áp cho cả clip, không keyframe được cường độ.
- File .cube phải có local (chạy `assets/fetch_large_assets.sh`).
