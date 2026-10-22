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
3. **Keyframe opacity cho video clip — ĐÃ XONG (K1, Phase 6).** Trước K1 chỉ
   hỗ trợ opacity tĩnh; nay keyframes opacity render thật qua chuỗi
   `format=rgba → split → alphaextract → geq(lum × biểu thức nội suy theo T)
   → alphamerge → yuva420p` (xem `opacity.js:buildOpacityKeyframesChain`).
   Cơ chế này giữ alpha gốc (chroma key, video nguồn có alpha, letterbox SR),
   đã kiểm chứng pixel: đỏ trên nền xanh blend 1→0 đúng theo thời gian
   (`test_k1.js` A: t=0.2 (240,0,10), t=2.0 (125,0,126), t=3.8 (11,0,242)).
   Lý do không dùng `colorchannelmixer=aa=<biểu thức>`: biểu thức của nó chỉ
   tính 1 lần lúc khởi tạo, biến `t` không tồn tại trong ngữ cảnh đó
   (FFmpeg 8.1: "Undefined constant … in 't'"); và geq không có hàm `a(X,Y)`
   để đọc alpha trực tiếp nên phải đi qua alphaextract.
   - Cả opacity tĩnh (< 1) và keyframes opacity cùng set → keyframes thắng
     (tuyệt đối), opacity tĩnh bị bỏ qua, validator cảnh báo rõ (không nhân
     với nhau). Giá trị keyframe ngoài [0,1] bị validator chặn (lỗi, khớp
     `validateOpacity` của opacity tĩnh) — cả bản JS và mirror TS
     (`packages/video-spec/src/keyframes.ts`).
   - Opacity keyframes + transition: unit đã merge không áp được (timestamp
     stream gộp không còn khớp thời gian cục bộ từng clip) → validator cảnh
     báo, render rơi về opacity tĩnh của clip đích (giống quy tắc SR).
   (Text clip có keyframe opacity riêng qua drawtext `alpha=` — không liên quan;
   text clip đi qua PNG path (SR) cũng dùng chung chuỗi alphamerge này.)
4. **Chỉ video track** — image clip, sticker, text dùng cơ chế alpha riêng của chúng;
   `VideoClip.opacity` không áp cho các kind khác.
5. **Chroma key + opacity**: alpha của chroma đã bị `format=yuv420p` làm phẳng
   trong unit chain (nợ P0-05/R1-012, thuộc task khác) — opacity lúc đó chỉ nhân
   trên ảnh đã phẳng, không phục hồi được vùng đã key.
6. **opacity=0** vẫn render unit (tốn chút hiệu năng) thay vì bỏ qua hẳn —
   chấp nhận được vì đơn giản và đúng.
7. Preview web (Canvas 2D) chưa chắc đã vẽ opacity giống export — cần task
   parity riêng (P5). UI slider đã có từ trước, giờ validator/render đã khớp.
