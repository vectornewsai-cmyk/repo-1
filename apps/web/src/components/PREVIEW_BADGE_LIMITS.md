# PREVIEW_BADGE_LIMITS.md — V5 (đợt "preview khớp render")

Lớp badge trạng thái preview cho TransitionPanel và EffectPanel
(`components/transitions/previewStatus.ts`). Badge chỉ là NHÃN DỮ LIỆU suy ra
từ code preview/render hiện có — không phải preview thật, không thay đổi hành
vi preview hay render.

## Trạng thái đã gắn (trung thực theo code tại thời điểm viết)

### Transition — căn cứ preview.tsx ("preview chỉ mô phỏng fade")
- "preview khớp": `fade`, `none` (cắt cứng, không có gì để lệch).
- "preview xấp xỉ": 66 type còn lại trong panel — panel chỉ có minh họa CSS,
  timeline preview không mô phỏng xfade của chúng.
- Transition MỚI của luồng V3 (chưa có trong panel lúc viết file này): nếu
  được thêm vào panel sau, hàm `transitionPreviewStatus` mặc định trả "xấp xỉ"
  (trừ đúng `"fade"`). Khi luồng preview thật nối thêm type, phải cập nhật
  `TRANSITION_MATCHED` kèm test — không đổi nhãn trước khi code thật tồn tại.

### Effect — căn cứ previewEngine.ts `effectsVisual()`
- "preview khớp": grayscale, invert, hue-rotate (CSS cùng ngữ nghĩa với filter).
- "preview xấp xỉ": blur, sepia, vignette, brightness, old-film (công thức CSS
  chỉ gần đúng render: blur ≠ boxblur, sepia khác ma trận nội suy, brightness
  thiếu offset, vignette vẽ bằng gradient, old-film chỉ xấp xỉ phần màu).
- "chưa có preview": sharpen, noise, glitch, rgb-shift, shake, pixelate,
  mirror, edgedetect (nằm trong `skipped` của effectsVisual) và mọi type lạ.

## Đồng bộ catalog (đã kiểm chứng lúc viết)
- Panel web 68 type = render catalog `server/render/src/transitions.js`
  (68 type, so theo `type:` trong mảng TRANSITIONS) — KHÔNG có transition mới
  nào cần đồng bộ tên hiển thị tại thời điểm này. Nếu luồng V3 thêm type vào
  render mà chưa thêm vào panel + i18n `transition.opt.*`, badge của type đó
  sẽ không xuất hiện trong panel cho đến khi panel được đồng bộ (hàm map thì
  đã sẵn sàng trả "xấp xỉ" cho type mới).

## Giới hạn chưa làm / chưa kiểm chứng
1. **Chưa click-test browser thật**: badge mới chỉ kiểm chứng bằng test node
   (map trạng thái + i18n + sự hiện diện của span trong code) và tsc. Chưa mở
   editor trên browser để nhìn badge thật, chưa kiểm tra tràn layout trên card
   nhỏ (card 104px, badge 10px) hay dark/light theme.
2. **tsc toàn repo chưa xanh tuyệt đối**: 2 lỗi duy nhất nằm ở
   `apps/web/src/lib/effectCanvas.test.ts` (TS5097, file của luồng effect
   canvas khác, không thuộc phạm vi V5 và không được sửa ở đây). Các file V5
   không có lỗi tsc nào.
3. **Nhãn "khớp" cho effect chỉ đúng ở mức ngữ nghĩa CSS**: không đo pixel
   chênh lệch giữa preview canvas và MP4 render cho từng effect (blur CSS vs
   boxblur FFmpeg vẫn khác kernel dù cùng họ). Nếu đợt sau đo pixel và thấy
   lệch vượt ngưỡng, grayscale/invert/hue-rotate cũng nên hạ xuống "xấp xỉ".
4. **Badge không tự cập nhật khi preview thay đổi**: `previewStatus.ts` là
   mirror chỉ-đọc viết tay từ effectsVisual/preview.tsx. Ai sửa logic preview
   mà quên sửa mirror này sẽ làm badge nói dối — test V5 chỉ bắt được khi
   catalog đổi, không bắt được khi công thức preview đổi nhưng tên type giữ
   nguyên. Rủi ro này được ghi rõ trong comment đầu file.
5. **EffectPanel vẫn dùng EFFECT_META hardcode tiếng Việt** cho tên/mô tả
   effect (không thuộc phạm vi V5; badge thì đã có i18n vi/en đầy đủ).

## Kiểm chứng đã chạy (26/10)
- `node apps/web/scripts/v5-preview-badge.test.cjs` → PASS 125 assertions.
- `node apps/web/scripts/r6-i18n-check.cjs` → PASS (vi=684 key, en=684 key,
  parity tuyệt đối, key `previewBadge.*` được code dùng qua literal).
- `cd apps/web && npx tsc --noEmit` → chỉ 2 lỗi ở effectCanvas.test.ts của
  luồng khác (xem mục 2), 0 lỗi ở file V5.
