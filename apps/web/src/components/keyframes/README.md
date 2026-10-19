# KeyframePanel — panel chỉnh keyframe animation

Component độc lập, **không sửa bất kỳ file có sẵn nào**. Hiển thị cho clip
video/chữ đang được chọn: thêm / xoá / kéo keyframe trên lane, chọn easing,
xem giá trị nội suy trực tiếp tại playhead.

## Tích hợp (1 dòng, dành cho agent phụ trách Inspector)

Trong `apps/web/src/Inspector.tsx`, thêm vào cuối component `Inspector`
(trước nút "Xoá clip này" hoặc sau khối "⏱️ Thời gian"):

```tsx
import { KeyframePanel } from "./components/keyframes";
...
<KeyframePanel />
```

Panel tự đọc `selection`/`spec`/`playhead` từ Zustand store và tự ẩn hiện
phù hợp (không chọn clip / chọn clip audio → hiện ghi chú).

## Phụ thuộc

- `../../../../../packages/video-spec/src/keyframes` — đường dẫn tương đối nội bộ
  monorepo (package `@repo-1/video-spec` hiện chỉ export `"."` nên không import
  subpath được; khi `index.ts` export keyframes thì đổi sang `@repo-1/video-spec`).
- Import này kích hoạt **module augmentation** gắn trường `animations?` vào
  `VideoClip`/`TextClip` mà không cần sửa `index.ts`.
- `useStore.patchClip` có sẵn — keyframe lưu vào `clip.animations`, serialize
  cùng spec JSON khi export.

## Trạng thái render

Xem `server/render/src/KEYFRAMES_LIMITS.md` để biết thuộc tính nào render được
bằng FFmpeg (hiện tại: X/Y/độ mờ cho chữ, X/Y cho video).
