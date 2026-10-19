# Tích hợp Sticker — hướng dẫn cho agent chính

Sticker overlay đã làm xong ở 3 tầng (spec → render module → UI panel),
nhưng **chưa nối vào render.js / validate.js / index.ts / preview** theo phân công
(không sửa file của agent khác). Các bước tích hợp đều là cơ học:

## 1. video-spec — `packages/video-spec/src/index.ts`

```ts
export * from "./sticker";
// và thêm "sticker" vào union TrackKind:
// export type TrackKind = "video" | "audio" | "text" | "sticker";
```

Sau đó đổi import trong `apps/web/src/components/sticker/StickerPanel.tsx`:
từ đường dẫn tương đối `../../../../../packages/video-spec/src/sticker`
thành `@repo-1/video-spec`, và bỏ các cast `[STICKER-CAST]`.

## 2. Render worker — `server/render/src/render.js`

Import ở đầu file:
```js
const { buildStickerOverlay } = require("./sticker");
```

Trong `buildFilterGraph`, sau khi đặt các video unit lên timeline (có `base`
là label video cuối), thêm sticker tracks — đặt stickers SAU text để chúng
nằm trên cùng:

```js
let vcur2 = vcur; // sau text drawtext/subtitles
for (const track of spec.tracks.filter((t) => t.kind === "sticker")) {
  for (const clip of track.clips) {
    const idx = mediaIndex.get(absOf(clip.src));
    const { filter, x, y } = buildStickerOverlay(clip, W, H);
    const sk = lbl("stk"), sp = lbl("stkp"), nb = lbl("nb");
    fc.push(`[${idx}:v]${filter}[${sk}]`);
    fc.push(`[${sk}]setpts=PTS+${num(clip.start)}/TB[${sp}]`);
    fc.push(`${vcur2}[${sp}]overlay=${x}:${y}:eof_action=pass[${nb}]`);
    vcur2 = `[${nb}]`;
  }
}
// dùng vcur2 làm vout
```

Lưu ý: `mediaIndex`/`absOf` đã có sẵn — sticker PNG được đăng ký như media
thường qua vòng `register(clip.src)`.

## 3. Validator — `server/render/src/validate.js`

- Import: `const { validateSticker } = require("./sticker");`
- Trong `validateSpec`, cho phép `track.kind === "sticker"` (hiện tại chỉ
  chấp nhận video/audio/text) và gọi `validateSticker(clip)` cho từng clip.
- Trong `validateMedia`: sticker PNG là ảnh tĩnh có chủ đích — KHÔNG áp dụng
  quy tắc "Phase 1 chưa hỗ trợ ảnh tĩnh" cho track sticker; chỉ cần file tồn
  tại và là ảnh (kiểm tra codec PNG).

## 4. Store/UI — `apps/web/src/store.ts`, `Inspector.tsx`, `preview.tsx`

- `addTrack`: thêm `"sticker"` vào `labels` (vd: "Sticker").
- `Inspector.tsx`: thêm `<StickerPanel />` (panel tự xử lý cả 2 trạng thái
  chọn/không chọn sticker).
- `preview.tsx`: vẽ sticker clips lên canvas preview (dùng `stickerUrl()` cho
  thư viện mẫu, object URL cho upload) — hiện tại preview chưa hiển thị
  sticker (đã ghi rõ trong UI và STICKER_LIMITS.md).

## 5. Đã kiểm chứng

- `node src/sticker.js --self-test` — pass
- `node demo_sticker.js` — render MP4 thật 5s, ffprobe OK, **xem frame bằng
  mắt**: 3 sticker đúng vị trí/thời điểm, xoay + mờ đúng tham số.
