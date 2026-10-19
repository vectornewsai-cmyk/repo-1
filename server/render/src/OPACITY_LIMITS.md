# OPACITY_LIMITS.md — Giới hạn trung thực của opacity video clip (R1-011)

> Kiểm chứng lần cuối: 2026-10-19, commit triển khai R1-011.
> Demo: `node demo_opacity.js` — 3 case pixel-check PASS (xem bên dưới).

## Cách hoạt động (đã kiểm chứng bằng MP4 thật)

- `VideoClip.opacity` 0..1 (mặc định 1 = đục hoàn toàn).
- Render: unit video → `format=rgba,colorchannelmixer=aa=<opacity>` → `setpts` → `overlay`
  lên timeline. Overlay dùng kênh alpha của foreground để composite (blend mode "normal").
- `opacity` ≈ 1 → **không thêm filter nào** (giữ nguyên pipeline cũ, không tốn hiệu năng).
- Validator cho phép 0..1; từ chối NaN, chuỗi, ngoài khoảng.

## Kết quả kiểm chứng pixel (demo_opacity.js)

Nền xanh (0,0,255) + clip đỏ (255,0,0) ở trên:

| opacity | pixel giữa frame | kỳ vọng | kết luận |
|---|---|---|---|
| 0.5 | (127,0,124) | (128,0,128) | ✅ blend đúng |
| 1 | (253,0,0) | (255,0,0) | ✅ đục hoàn toàn |
| 0 | (0,0,254) | (0,0,255) | ✅ trong suốt, thấy nền |

(Sai số ±8 do yuv420p + H.264 — trong dung sai cho phép.)

## Giới hạn (trung thực)

1. **Chỉ blend mode "normal"** — không có multiply/screen/overlay. Muốn blend mode
   khác phải thêm filter `blend=` riêng (chưa làm).
2. **Opacity + transition**: unit đã qua xfade merge sẽ dùng opacity của **clip đích**
   (clip "to") cho toàn bộ đoạn chuyển cảnh, kể cả phần đang là clip nguồn.
   Validator phát cảnh báo (warning, không phải lỗi) khi gặp combo này.
3. **Không keyframe opacity cho video clip** — `opacity` là giá trị tĩnh của clip.
   (Text clip có keyframe opacity riêng qua drawtext `alpha=` — không liên quan.)
4. **Chỉ video track** — image clip, sticker, text dùng cơ chế alpha riêng của chúng;
   `VideoClip.opacity` không áp cho các kind khác.
5. **Chroma key + opacity**: alpha của chroma đã bị `format=yuv420p` làm phẳng
   trong unit chain (nợ P0-05/R1-012, thuộc task khác) — opacity lúc đó chỉ nhân
   trên ảnh đã phẳng, không phục hồi được vùng đã key.
6. **opacity=0** vẫn render unit (tốn chút hiệu năng) thay vì bỏ qua hẳn —
   chấp nhận được vì đơn giản và đúng.
7. Preview web (Canvas 2D) chưa chắc đã vẽ opacity giống export — cần task
   parity riêng (P5). UI slider đã có từ trước, giờ validator/render đã khớp.
