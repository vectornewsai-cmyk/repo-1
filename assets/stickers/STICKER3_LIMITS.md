# STICKER3_LIMITS.md — Batch 3 sticker harvest (2026-10-19)

173 sticker mới từ 2 nguồn, nâng thư viện từ 30 → 203.

## Nguồn & license (đã đọc LICENSE gốc)

| Nguồn | License | Verify |
|-------|---------|--------|
| Twemoji (twitter/twemoji) — 96 PNG 72x72 | **CC-BY 4.0** (graphics) | README.md dòng 262-266: "Graphics licensed under CC-BY 4.0". Code MIT (không dùng code). |
| Noto Emoji (googlefonts/noto-emoji) — 77 PNG 128x128 | **Apache-2.0** (images) | README.md dòng 30-32: "Tools and most image resources are under the Apache license, version 2.0". Fonts OFL 1.1 (không dùng font). |

**Đã loại:** OpenMoji (CC-BY-SA 4.0 — SA không tương thích với repo MIT).

## Attribution
- Đủ 173 dòng trong `assets/SOURCES.md`.
- Twemoji yêu cầu attribution (CC-BY 4.0): đã ghi trong SOURCES.md + header `fetch_stickers.sh`. README "About" section của app nên nhắc thêm khi có màn hình About.

## Giới hạn trung thực

1. **PNG không push lên GitHub** (binary). Chạy `bash assets/stickers/fetch_stickers.sh` 1 lần sau khi clone — script tự verify SHA256 từng file.
2. **Twemoji chỉ 72x72** (palette PNG + tRNS transparency). Đủ dùng cho sticker overlay (scale mặc định 0.25), nhưng không sắc nét nếu phóng to full màn hình. Noto 128x128 nét hơn.
3. **Twemoji là palette mode**, không phải RGBA. FFmpeg (`format=yuva420p`) và browser xử lý đúng transparency. Đã test render overlay thật.
4. **STICKER_LIBRARY tham chiếu file chưa tồn tại** nếu user chưa chạy fetch script — giống pattern LUT (`fetch_large_assets.sh`). UI sẽ hiện ảnh vỡ cho đến khi chạy script. Không có fallback graceful.
5. **Nhãn tiếng Việt do người curate viết tay** — có thể chưa chuẩn 100% với tên Unicode chính thức, nhưng đủ rõ để tìm kiếm.
6. **Không có sticker animated** (APNG/GIF/WebP). Render worker chỉ hỗ trợ PNG tĩnh.
7. **Không có flag quốc gia** — chủ đích bỏ qua để tránh nhạy cảm chính trị.
8. **Không có ZWJ sequences** (gia đình, cặp đôi, màu da) — chỉ emoji đơn. Mở rộng sau nếu cần.
9. Twemoji đã ngừng phát triển tích cực (repo archive trạng thái "not maintained" từ 2023) — nhưng asset CC-BY 4.0 vẫn dùng được vĩnh viễn.
10. Noto Emoji repo đã restructure (2D/png/128) — URL trong script khớp cấu trúc hiện tại (verify 2026-10-19). Nếu Google đổi cấu trúc, script cần cập nhật.

## Test
`python3 assets/stickers/test_stickers3.py` — TẤT CẢ PASS:
- manifest 173 entries, license hợp lệ, không trùng tên
- fetch_stickers.sh syntax ok, 173 lệnh fetch, có SHA256 verify
- 173 PNG: tồn tại ở assets + public, mở được, có alpha, sha256 khớp
- SOURCES.md đủ 173 dòng, sticker.ts đủ 173 entries
