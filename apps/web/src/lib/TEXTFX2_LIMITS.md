# TEXTFX2_LIMITS.md — Giới hạn trung thực của 10 text animation mới (Batch G, R1-070)

Ngày: 2026-10-19. Bổ sung cho `server/render/src/TEXTFX_LIMITS.md` (không thay thế).

## 10 animation mới

| Animation | Loại | Cơ chế drawtext | Đã kiểm chứng |
|---|---|---|---|
| `slideInDown` | entrance | `y` từ `-text_h` về đích + alpha, 0.7s | ✅ MP4 thật |
| `popIn` | entrance | alpha nhanh 0.25s + y nảy nhẹ (GIẢ LẬP) | ✅ MP4 thật |
| `fadeOut` | exit | alpha 1→0 trong 0.8s cuối | ✅ MP4 thật |
| `fadeOutUp` | exit | y -= 30px + alpha 1→0 trong 0.8s cuối | ✅ MP4 thật |
| `slideOutRight` | exit | x → w + alpha 1→0 trong 0.7s cuối | ✅ MP4 thật |
| `slideOutDown` | exit | y → h + alpha 1→0 trong 0.7s cuối | ✅ MP4 thật |
| `wave` | loop | y = yt ± 12px sin, chu kỳ 1.2s | ✅ MP4 thật |
| `blink` | loop | alpha 1/0.15 nhấp nháy mỗi 1s | ✅ MP4 thật |
| `shake` | emphasis | x rung ±10px tắt dần trong 0.5s đầu | ✅ MP4 thật |
| `fadeInOut` | combo | alpha vào 0.5s + ra 0.5s cuối | ✅ MP4 thật |

## Giới hạn TRUNG THỰC (đọc trước khi dùng)

### 1. `popIn` KHÔNG scale thật
drawtext không đánh giá `fontsize` theo `t` (đã thử, FFmpeg báo lỗi —
xem TEXTFX_LIMITS.md §1). `popIn` ở đây chỉ là **alpha nhanh + y nảy nhẹ**,
không phải phóng to chữ. Tên gọi "popIn" dễ gây hiểu lầm — đã ghi rõ trong
UI description ("giả lập pop, không scale thật"). Nếu cần scale thật: render
chữ ra PNG từng frame rồi overlay (chưa implement).

### 2. `wave` là wave CẢ DÒNG, không từng ký tự
drawtext vẽ cả chuỗi một lần. Hiệu ứng "sóng từng chữ" như CapCut cần ASS
hoặc tách từng ký tự thành drawtext riêng (chưa implement). Đã ghi rõ trong
UI description.

### 3. Exit animations cần clip đủ dài
`fadeOut`/`fadeOutUp` cần ≥ 0.8s cuối, `slideOutRight`/`slideOutDown` cần
≥ 0.7s, `fadeInOut` cần ≥ 1.0s tổng. Nếu clip ngắn hơn, hiệu ứng outro sẽ
chiếm toàn bộ clip (không crash, nhưng trông "vội"). Validator không chặn —
đây là quyết định có chủ ý (giữ đơn giản), UI có thể warn sau.

### 4. Exit animations cần `clipEnd` — API break có chủ ý
`buildTextAnimExpr(anim, style, clipStart, clipEnd)`: 5 animation exit/combo
**throw** nếu thiếu `clipEnd` hợp lệ. `render.js` đã truyền `E`. Code cũ chỉ
truyền 3 tham số vẫn chạy cho 7 animation cũ (không throw).

### 5. `blink` dùng alpha 0.15 thay vì 0
Alpha = 0 hoàn toàn có thể khiến chữ "biến mất" đột ngột gây khó chịu khi
loop; 0.15 giữ chữ hơi hiện (quyết định thiết kế, ghi rõ ở đây).

### 6. Preview mirror đúng công thức nhưng không pixel-perfect
`previewEngine.ts` mirror công thức JS tương đương (không phải biểu thức
FFmpeg). Thứ tự áp dụng và thời lượng khớp; sai số làm tròn < 1px.

### 7. Chưa test trên Safari cũ
`ctx.filter` không có trên Safari < 18 — preview bỏ qua LUT/effects lặng lẽ
(nợ chung từ Batch F).

### 8. Text presets CSS chỉ dùng cho web
10 preset `vcut-*.css` là style cho element HTML (dùng trong editor/web).
Render worker (FFmpeg drawtext) KHÔNG đọc CSS — chữ xuất video dùng
`fontSize`/`color`/`backgroundColor` trong spec. Đây là giới hạn kiến trúc,
không phải bug.
