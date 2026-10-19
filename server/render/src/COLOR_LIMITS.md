# COLOR_LIMITS.md — Giới hạn trung thực của color grading (R1-074/R1-075)

## Những gì ĐÃ làm được (đã kiểm chứng)

1. **Chỉnh màu thủ công 7 tham số** (`filter.color`): brightness, contrast,
   saturation, temperature, tint, highlights, shadows — mỗi param -100..100.
   Render thật qua FFmpeg `eq` + `colorbalance`, mỗi param đã kiểm chứng
   làm thay đổi pixel (test_color.js: 40/40 pass).
2. **20 LUT** (10 cartcut-* MIT + 10 vcut-* tự tạo bằng script
   `assets/filters/gen_vcut_luts.py`), render thật qua `lut3d`, mỗi LUT cho
   output pixel khác nhau (đã đo).
3. **Thứ tự render**: color adjust → LUT → effects (correction trước look).
   Preview mirror đúng thứ tự này qua CSS filter.
4. **Validate 3 lớp**: video-spec TS (`validateColorAdjust`), render worker
   (`validate.js` → từ chối giá trị ngoài -100..100), MCP (`validate.ts`
   passthrough + check range).
5. **UI**: 7 slider trong Inspector (panel "🎚️ Chỉnh màu thủ công"),
   double-click slider để reset, nút "↺ Đặt lại".

## Giới hạn còn lại (trung thực)

1. **Preview chỉ xấp xỉ**: temperature/tint/highlights/shadows không có CSS
   filter tương đương chính xác — preview dùng sepia/hue-rotate/brightness
   để "gợi ý" tông màu. Màu chính xác chỉ thấy sau khi render.
   (Xem thêm PREVIEW_LIMITS.md của Batch F.)
2. **Không có scope chuyên nghiệp**: chưa có waveform/vectorscope/histogram
   để căn màu chính xác như DaVinci/Premiere.
3. **Không keyframe cho color params**: chỉnh màu là tĩnh cho cả clip.
   (Keyframe audio volume đã có từ Batch F; color keyframes là việc tương lai.)
4. **Image clip chưa hỗ trợ filter/color**: `filter` (LUT + color) mới chỉ áp
   cho video clip. Image clip render qua chain riêng chưa có filter.
5. **Không import LUT custom (.cube) của user**: mới chỉ dùng 20 LUT trong
   catalog. Import file .cube ngoài (R1-075 ghi "LUT import") chưa làm —
   cần UI upload + validate file + lưu vào asset store.
6. **Không có LUT intensity/opacity**: LUT áp 100% hoặc không áp. Muốn blend
   LUT (vd 50%) phải tự tạo file .cube trung gian.
7. **colorbalance là xấp xỉ của "temperature" thật**: nhiệt độ màu chuẩn
   (Kelvin) cần chuyển đổi phức tạp qua ma trận white-balance; ở đây dùng
   shift R/B đơn giản trên midtones — đủ cho nhu cầu phổ thông, không phải
   chuẩn color-science.
8. **Chưa có preset color do user tự lưu** (chỉ có 20 LUT cố định + 7 slider).
9. **Chưa click-test browser thật** (nợ chung hạ tầng của dự án).
