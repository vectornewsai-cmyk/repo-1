# Kho tài nguyên (assets)

Nơi tập hợp transition, effect, filter, LUT, font... dùng cho trình dựng.

## Chính sách giấy phép — BẮT BUỘC tuân thủ

1. **Chỉ nhận**: MIT, Apache-2.0, CC0, CC-BY (ghi nguồn đầy đủ).
2. **Tuyệt đối KHÔNG nhận**: tài nguyên của CapCut/ByteDance, tài nguyên "free for personal use",
   giấy phép mập mờ / không rõ nguồn gốc.
3. Mỗi tài nguyên phải có entry trong `SOURCES.md`: tên, nguồn URL, tác giả, giấy phép,
   ngày lấy về, file nào trong kho.
4. Giấy phép mập mờ → **loại, không tiếc**. Thà thiếu còn hơn dính kiện.

## Cấu trúc

```
assets/
├── transitions/     # file transition (GLSL, JSON preset...)
├── effects/         # hiệu ứng
├── filters/         # filter màu / LUT (.cube)
├── text-presets/    # preset chữ animation
├── audio/           # nhạc/effect âm thanh miễn phí bản quyền
└── SOURCES.md       # bảng attribution — KHÔNG được thiếu entry nào
```

## Quy ước đặt tên file

`<nguồn>-<tên-gốc>.<ext>` — ví dụ: `gl-transitions-fade.glsl`.
Không đổi tên làm mất dấu vết nguồn.
