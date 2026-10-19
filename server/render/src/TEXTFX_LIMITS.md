# TEXTFX_LIMITS.md — Giới hạn trung thực của text animations

Tài liệu này liệt kê TRUNG THỰC những gì làm được và KHÔNG làm được.
Cập nhật khi có thay đổi. Ngày: 2026-10-19.

## Làm được (đã kiểm chứng bằng MP4 thật)

| Animation | Cơ chế FFmpeg | Đã kiểm chứng |
|---|---|---|
| `none` | drawtext tĩnh | ✅ (có từ Phase 1) |
| `fadeUp` | drawtext `alpha` + `y` theo `t` | ✅ (có từ Phase 1, textfx.js mirror khớp công thức) |
| `fadeIn` | drawtext `alpha=min(1,(t-S)/0.8)` | ✅ demo_textfx.js, xem frame |
| `slideInLeft` | drawtext `x` từ `-text_w` về đích + alpha | ✅ demo_textfx.js, xem frame |
| `slideInRight` | drawtext `x` từ `w` về đích + alpha | ✅ demo_textfx.js, xem frame |
| `slideUp` | drawtext `y` từ `h` về đích + alpha | ✅ demo_textfx.js, xem frame |
| `bounce` | drawtext `y` rơi + nảy (công thức `140*(1-p)²` + `sin`) | ✅ demo_textfx.js, xem frame |
| `typewriter` | file ASS + filter `subtitles` (libass) | ✅ (có từ Phase 1) |

## KHÔNG làm được (ghi rõ để không ai giả vờ)

### 1. Scale/phóng to chữ (scaleUp, popIn...)
**Nguyên nhân:** `fontsize` của drawtext là tham số tĩnh — FFmpeg chỉ đánh giá
một lần khi khởi tạo filter, KHÔNG chấp nhận biểu thức theo `t`.
Đã thử: `fontsize='42*(1+0.5*min(1,t/0.5))'` → ffmpeg báo lỗi `Option not found`
(không phải expression-evaluated option).

**Cách làm được trong tương lai:** render chữ ra PNG riêng từng frame rồi dùng
`scale` + `overlay` — tốn kém, chưa implement. Hoặc dùng filter `zoompan`
trên vùng chữ đã crop — phức tạp, chưa thử.

### 2. Xoay chữ (rotation)
**Nguyên nhân:** drawtext không có tham số xoay theo `t`. Filter `rotate`
của FFmpeg xoay CẢ FRAME chứ không xoay riêng lớp chữ (trừ khi tách chữ ra
stream riêng rồi overlay — chưa implement).

### 3. Hiệu ứng từng ký tự (ngoài typewriter)
**Nguyên nhân:** drawtext vẽ cả chuỗi một lần, không cho điều khiển từng ký tự.
`typewriter` làm được vì dùng ASS (mỗi ký tự là một dialogue riêng).
Các hiệu ứng như "chữ rơi từng chữ một", "wave" cần ASS hoặc render từng ký tự
thành drawtext riêng — chưa implement.

### 4. Exit animation (hiệu ứng biến mất)
Chưa có. Tất cả animation hiện tại là entrance (lúc xuất hiện). Thêm exit
cần `enable` phức tạp hơn hoặc biểu thức theo `(E-t)` — để dành phase sau.

### 5. Bounce chỉ có 1 nhịp nảy
Công thức hiện tại cho đúng 1 nhịp nảy nhẹ rồi đứng yên (chủ ý thiết kế cho
nhìn "sạch"). Muốn nảy nhiều nhịp như CapCut cần tăng số chu kỳ sin —
dễ làm, chưa cần thiết.

## Lưu ý kỹ thuật

- Mọi biểu thức dùng `t` là **thời gian timeline** (giây), không phải thời gian
  của clip. `p = min(1,(t-S)/D)` với S = `clip.start`.
- `enable='between(t,S,E)'` của render.js đảm bảo biểu thức chỉ đánh giá khi
  clip đang hiện — ngoài khoảng này drawtext không vẽ gì.
- `text_w`/`text_h` trong biểu thức x/y là kích thước text do drawtext đo được
  tại thời điểm khởi tạo (phụ thuộc font + fontsize + nội dung).
- Nếu `clip.animations` (keyframes) được đặt, render.js ưu tiên keyframes hơn
  `style.animation` — hai cơ chế không cộng dồn.
