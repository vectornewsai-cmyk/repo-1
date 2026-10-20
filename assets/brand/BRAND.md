# VCut Studio — Brand kit

Tài sản thương hiệu gốc của dự án (tự thiết kế, **MIT** — không sao chép
trade dress của CapCut hay bất kỳ editor nào khác).

## Logo

- `logo.svg` — logo đầy đủ (biểu tượng + khoảng trống wordmark).
- `logo-mark.svg` — chỉ biểu tượng, dùng làm favicon / app icon.
- Motif: khung phim bo góc (gợi editor/timeline) + tam giác phát (play)
  có vạt cyan tạo hình chữ **V**.

Quy tắc dùng:
- Không kéo giãn méo, không đổi màu ngoài bảng màu dưới, không đặt trên
  nền có độ tương phản thấp (nền tối #0F0F14 hoặc nền sáng #F5F3FF đều ổn).
- Khoảng trống tối thiểu quanh logo = 1/4 chiều rộng biểu tượng.

## Bảng màu

| Tên | Hex | Vai trò |
|---|---|---|
| Violet chính | `#7C3AED` | Thương hiệu, nút chính, tiêu đề template |
| Cyan điểm nhấn | `#22D3EE` | Điểm nhấn, giá/CTA, vạt logo |
| Mực (Ink) | `#0F0F14` | Nền tối, chữ trên nền sáng |
| Giấy (Paper) | `#F5F3FF` | Nền sáng, chữ trên nền tối |
| Violet nhạt | `#E9D5FF` | Chữ phụ trên nền tối |
| Kem ấm | `#FFE9C7` | Điểm nhấn ấm (travel, lifestyle) |

Gradient thương hiệu: `#7C3AED → #22D3EE` (chéo 45°).

## Font chữ

- **Chính: Be Vietnam Pro** (Google Fonts, OFL-1.1) — hỗ trợ đầy đủ dấu
  tiếng Việt, đã có trong kho `assets/fonts/`.
- Dự phòng: `system-ui, Segoe UI, sans-serif`.
- Template dùng `fontFamily: "Be Vietnam Pro"` làm mặc định để chữ tiếng
  Việt luôn hiển thị đúng trên mọi máy.

## Giọng điệu UI

Tiếng Việt, thân thiện, trực tiếp. Tên sản phẩm: **VCut Studio**
(tên làm việc — có thể đổi trước khi phát hành chính thức).

## Template

10 template mẫu trong `assets/templates/` tuân thủ brand kit:
màu Violet/Cyan cho CTA và điểm nhấn, Be Vietnam Pro cho mọi text overlay.
Xem `assets/templates/README.md`.
