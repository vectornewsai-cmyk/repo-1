# ChromaPanel — Hướng dẫn tích hợp

Panel xoá phông xanh (chroma key) tự đọc selection từ store.

## Tích hợp vào Inspector (1 dòng)

Trong `apps/web/src/Inspector.tsx`, thêm import:

```tsx
import { ChromaPanel } from "./components/chroma";
```

Và trong phần `{clip.kind === "video" && (...)}`, thêm:

```tsx
<div className="panel-head" style={{ marginTop: 12 }}>🟩 Xoá phông xanh</div>
<ChromaPanel />
```

## Tích hợp spec vào index.ts

Thêm vào `packages/video-spec/src/index.ts`:

```ts
export * from "./chroma";
```

Sau đó xóa block module augmentation ở cuối `chroma.ts` (dòng `import "./index"`
+ `declare module "./index"`) và đổi import trong `ChromaPanel.tsx` từ đường
dẫn tương đối sang `@repo-1/video-spec`.

## Tích hợp render vào render.js

Xem hướng dẫn chi tiết trong header của `server/render/src/chroma.js`.
Tóm tắt: trong bước chuẩn hoá clip, nếu `clip.chromaKey` tồn tại thì thay
`format=yuv420p` bằng `` `format=yuva420p,${buildChromaFilter(clip.chromaKey)}` ``
để giữ kênh alpha cho overlay.

## Tích hợp validate vào validate.js

Trong `validateClip`, nhánh `track.kind === "video"`, thêm:

```js
const { validateChroma } = require("./chroma");
if (clip.chromaKey !== undefined) {
  for (const m of validateChroma(clip.chromaKey)) err(where, m);
}
```
