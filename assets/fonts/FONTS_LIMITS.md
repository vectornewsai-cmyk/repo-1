# Font Library — Giới hạn trung thực

> 43 fonts từ Google Fonts, 100% SIL Open Font License 1.1, đã verify Vietnamese subset.

## Đã verify

1. **Vietnamese subset**: kiểm tra qua `fonts.google.com/metadata/fonts` — cả 43 fonts đều có `"vietnamese"` trong `subsets`.
2. **Glyph coverage thật**: tải `BeVietnamPro-Regular.ttf` từ google/fonts GitHub, check bằng fontTools — đủ 459 glyphs, không thiếu ký tự Việt nào (Ạ, Đ, Ơ, Ư, Ế...).
3. **License**: OFL-1.1 đọc trực tiếp từ name table của font (`This Font Software is licensed under the SIL Open Font License, Version 1.1`).
4. **Nguồn TTF đầy đủ**: google/fonts GitHub repo (`ofl/...`), KHÔNG dùng gstatic CSS API với old User-Agent (file đó bị subset latin-only, thiếu dấu Việt — đã phát hiện khi test).

## Giới hạn

1. **File binary không commit**: `fetch_fonts.sh` tải vào `assets/fonts/files/` (gitignored). Catalog + script được push, font tải sau khi clone.
2. **Variable fonts**: 22/43 fonts là variable font (`[wght]`) — 1 file duy nhất chứa mọi weight. FFmpeg drawtext dùng được (chọn default instance). Muốn weight cụ thể thì dùng file Bold riêng (8 fonts có).
3. **Bold**: chỉ 8 fonts có file Bold static riêng (Be Vietnam Pro, Kanit, Prompt, Barlow Condensed, Chakra Petch, Amatic SC, Space Mono, IBM Plex Mono). Các font khác dùng variable weight hoặc nút Bold của editor (synthetic bold).
4. **Italic**: không tải file Italic riêng — editor dùng nút Italic (synthetic oblique). Đủ cho 99% use case CapCut-style.
5. **Render**: FFmpeg drawtext cần fontconfig tìm thấy font — user chạy `fetch_fonts.sh` rồi copy vào `~/.fonts/` hoặc set `FONTCONFIG_PATH`.
6. **Preview web**: font picker trong Inspector dùng system font stack + font đã cài. Font web (WOFF2) load từ Google Fonts CDN khi online — offline thì fallback.
7. **Không có font Việt hoá đặc biệt**: đây là fonts quốc tế có hỗ trợ Việt, không phải font "Việt hoá" thủ công (như SVN-*, UTM-*). Các font SVN/UTM phần lớn không rõ license — KHÔNG đưa vào kho để tránh rủi ro bản quyền.
8. **Số lượng**: 43 fonts vs hàng trăm của CapCut. Đủ dùng, có thể mở rộng thêm bất cứ lúc nào bằng cùng pipeline.

## Thêm font mới

1. Kiểm tra Vietnamese subset: `fonts.google.com/metadata/fonts` → tìm `"vietnamese"` trong subsets.
2. Tìm TTF trong `github.com/google/fonts/tree/main/ofl/<tên>`.
3. Thêm vào `catalog.json` + `fetch_fonts.sh` + `SOURCES.md`.
4. KHÔNG dùng font không rõ license (SVN, UTM, VNI-*).
