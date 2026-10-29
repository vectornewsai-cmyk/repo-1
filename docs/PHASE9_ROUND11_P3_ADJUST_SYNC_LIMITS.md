# Phase 9 đợt 11, luồng P3 — Đồng bộ adjustment layer qua effectCanvas + regenerate mirror video-spec (LIMITS)

Ngày: 2026-10-27 (lượt cron vcut-build-loop 02:03 +07). KHÔNG push, KHÔNG
tag/release, KHÔNG binary. Không sửa `effectCanvas.ts` (file của luồng P2);
chỉ đọc nó và import `canvasEffectOps` trong test để chứng minh đường vẽ.

## 1. Kết luận xác minh: adjustment layer ĐÃ đi qua effectCanvas (không cần nối thêm)

Chuỗi vẽ đã kiểm chứng bằng cách đọc code (không phải suy đoán từ tên hàm):

1. `apps/web/src/lib/nestedPreview.ts` — `buildPreviewSpec` gộp effect
   của adjustment layer vào `clip.effects` qua `splitClipByAdjustments`
   (`copy.effects = merged.effects`): cả clip video tầng ngoài lẫn clip
   lá trong nested (gom vào track `__nested-video`).
2. `apps/web/src/preview.tsx` — frame nào cũng chạy
   `spec = buildPreviewSpec(store.spec)` rồi `renderFrame` duyệt mọi
   track kind `"video"` (gồm cả `__nested-video`); `drawVideoClip` đọc
   `clip.effects` qua `canvasEffectOps(clip.effects, localT)` →
   `effectCanvasSource` → `applyCanvasEffects` (effectCanvas.ts), đặt
   SAU chroma/LUT, TRƯỚC mask/SR/opacity.
3. `previewEngine.effectsVisual` (đợt 10, V2) đã không còn báo 8 type
   canvas là skipped; chỉ type lạ chưa biết mới vào `skipped`.
4. Badge UI đã đồng bộ từ đợt 10 (`previewStatus.ts`): 8 type canvas là
   `"approx"`, không phải `"none"` — luồng này không cần sửa badge.

Phạm vi này KHỚP render, nên không nối thêm đường vẽ cho image/text/
sticker: render chỉ áp adjustment cho clip video (nhánh video của
`server/render/src/render.js` nối `adjChain`; `image.js` ghi rõ image
clip chưa hỗ trợ LUT/effects, và nhánh image của render.js không có
`adjSuffix`). Preview image bỏ qua effect cũng vì cùng lý do đó — nối
effectCanvas cho image sẽ làm preview KHÁC render, không phải khớp hơn.

## 2. Đã đổi gì để đồng bộ danh sách skip

`apps/web/src/lib/nestedPreview.ts`:

- Thêm `PREVIEW_CANVAS_EFFECTS` (8 type: sharpen, noise, glitch,
  rgb-shift, shake, pixelate, mirror, edgedetect) với comment ghi rõ
  chuỗi vẽ ở §1.
- `PREVIEW_SKIPPED_EFFECTS` thành tập RỖNG (giữ export để code cũ không
  vỡ): hiện không còn type chuẩn nào của video-spec thật sự chưa có
  đường vẽ. Type lạ vẫn bị báo skip qua nhánh động, không cần liệt kê tĩnh.
- `SKIPPED_EFFECT_REASONS`: xóa 8 lý do cũ của đợt R4 ("không có CSS
  filter tương đương…") vì chúng đã SAI từ khi đợt 10 nối effectCanvas;
  giữ chúng lại chỉ gây hiểu lầm. `skippedEffectReason` cho type lạ vẫn
  trả lý do fallback "type chưa biết…".
- `applyAdjustmentPreview`: skip khi type nằm trong tập tĩnh rỗng HOẶC
  không thuộc cả 2 đường vẽ (CSS + canvas). Trước đây điều kiện
  `!PREVIEW_SUPPORTED_EFFECTS` đã nuốt cả 8 type canvas vào skipped.

`apps/web/src/lib/nestedPreview.test.ts` (test cũ assert hành vi R4 đã
lỗi thời nên PHẢI sửa, không phải test mới bịa thêm):

- Test chồng 2 layer: `skippedEffects` từ `["sharpen"]` → `[]`.
- Khối "8 effect chuẩn bị bỏ qua" → "8 effect canvas KHÔNG còn bị ghi
  skipped" (mỗi type: `skippedEffects []`, vẫn nằm trong `effects`).
- Test "effect bỏ qua vẫn nằm trong merged": đổi từ sharpen sang
  `hologram` (type lạ thật sự bị skip) vì sharpen không còn minh họa
  được tính chất đó.
- MỚI, test chứng minh đường vẽ (không cần DOM vì `canvasEffectOps`
  là hàm thuần; phần DOM chỉ nằm ở `effectCanvasSource` trong
  preview.tsx): adjustment layer mang mirror/sharpen → đoạn clip giữa
  sau `buildPreviewSpec` mang đúng 2 effect → `canvasEffectOps` trả
  đúng 2 op; đoạn ngoài layer không mang effect. Có cả biến thể clip
  lá trong nested (`__nested-video`).

## 3. Regenerate mirror `.js` của video-spec — cách làm và phạm vi

- Tìm script gen hiện có: KHÔNG CÓ (repo `scripts/` chỉ có
  release/install/start; các mirror `.js` là bản viết tay, xem header
  `nested.js`: "không có bước build tự động cho video-spec").
- Đã viết script mới `packages/video-spec/scripts/gen-transitions-mirror.mjs`
  (chạy từ repo root: `node packages/video-spec/scripts/gen-transitions-mirror.mjs`).
  Script parse `TRANSITION_TYPES` + `TRANSITION_META` từ `transitions.ts`
  (quét theo dòng nên giữ nguyên comment phân đoạn R1-073 /
  TransitionHarvest / P5 / V3), fail fast nếu meta thiếu type nào, và
  ghi đè `packages/video-spec/src/transitions.js`. Chạy 2 lần cho cùng
  một hash (idempotent).
- Kết quả: mirror từ 59 type → 82 type, khớp 100% với `.ts` (thêm 9 type
  P5 của Phase 7: blinds-h, bars-v, checker, diamond, plus, grid, clock,
  circle-soft, bars-fade; và 14 type V3 của đợt 10: diamondclose,
  squareopen/close, checker-alt, blinds-diag, split-h/v, barn-h/v, rings,
  corners, star, clock-ccw, spiral). Kiểm chứng bằng import thật cả 2
  file (Node strip-types): `TRANSITION_TYPES` deep-equal, `TRANSITION_META`
  deep-equal, `isTransitionType` đúng với 5 type mới mẫu và sai với type lạ.
- KHÔNG regenerate bừa toàn bộ mirror (đúng cảnh báo của đợt 10):
  `index.js`/`lut.js`/… là tập con viết tay theo thiết kế (vd `lut.js`
  164 dòng so với `lut.ts` 980 dòng), regenerate bằng tsc sẽ chạm ~22
  file và đổi ngữ nghĩa tập con đó. Đã đối chiếu nhanh headline:
  `EFFECT_TYPES` của effects.ts/js khớp 16/16; render worker
  (`server/render/src/transitions.js`) vốn đã có đủ 23 type mới nên chỉ
  mirror video-spec là lệch. Các mirror khác còn lệch hay không là nợ
  riêng, KHÔNG claim "đã regenerate toàn bộ video-spec" ở đợt này.

## 4. Kiểm chứng thật (chạy trong đợt này)

- `nestedPreview.test.ts`: 46/46 pass (gồm 2 test P3 mới + các test đã
  sửa ở §2).
- `nestedPreviewR3.test.ts`: 17 pass; `nestedUnify.test.ts`: 12 PROVEN
  pass (1 PENDING cũ của R6, không liên quan); `effectCanvas.test.ts`:
  13 pass; `previewEngine.test.ts`: 14 pass; badge
  `v5-preview-badge.test.cjs`: 139 assertions PASS.
- `tsc --noEmit` (apps/web): 0 lỗi. `vite build`: pass.
- Mirror: `node --check transitions.js` pass; parity script §3 pass;
  generator idempotent (cùng md5 sau 2 lần chạy).

## 5. Giới hạn còn lại — đừng claim quá

- `effectCanvasSource` trả null khi không có document/context → frame đó
  giữ đường vẽ cũ, effect bị bỏ qua ở frame đó (fallback đã có từ đợt 10,
  không phải do luồng này tạo ra). Test P3 chỉ chứng minh tới
  `canvasEffectOps` (tầng thuần), không chứng minh được tầng DOM/canvas
  thật trong Node.
- Canvas effects luôn chạy TRƯỚC CSS filter bất kể thứ tự trong
  `clip.effects` (EFFECT_CANVAS_LIMITS.md §3) — thứ tự áp của adjustment
  có canvas + CSS vẫn là xấp xỉ, không phải thứ tự mảng tuyệt đối.
- 8 type canvas chỉ "vẽ thật", không "khớp render": pixelate/sharpen/
  noise/glitch vẫn xấp xỉ (xem EFFECT_CANVAS_LIMITS.md; riêng pixelate,
  luồng P2 cùng đợt 11 đang đổi điểm lấy mẫu — file đó không thuộc
  luồng này, đừng lấy kết quả P2 ghi vào đây).
- Type lạ vẫn bị skip đúng (hologram test) — đồng bộ này không có nghĩa
  "mọi effect đều preview được".
- Các mirror `.js` khác của video-spec chưa được regenerate (xem §3);
  đừng dùng chúng làm căn cứ cho đến khi có đợt riêng đối chiếu từng module.
