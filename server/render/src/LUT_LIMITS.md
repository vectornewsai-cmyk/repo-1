# LUT — Giới hạn trung thực

Tài liệu này liệt kê TRUNG THỰC những gì làm được và chưa làm được với
bộ lọc màu LUT trong VCut Studio. Không phóng đại, không giấu giếm.

## Đã kiểm chứng hoạt động (MP4 thật + xem frame bằng mắt)

- 10/10 LUT trong catalog render được qua filter `lut3d` native của FFmpeg.
- Demo: `node demo_lut.js` — 3 video (teal-orange, mono-neutral, ocean) pass ffprobe,
  frame trích ra cho thấy màu thay đổi rõ rệt (mono-neutral → đen trắng hoàn toàn).
- Self-test: `node src/lut.js --self-test` — 6 nhóm assertion pass.

## Giới hạn

1. **LUT áp cho CẢ CLIP, không keyframe được cường độ.** Muốn chuyển dần từ
   không lọc sang có lọc thì hiện tại không làm được (filter `lut3d` không có
   tham số opacity/mix theo thời gian).

2. **Một clip chỉ dùng được 1 LUT.** Không stack nhiều LUT (kỹ thuật thì nối
   `lut3d,lut3d` được nhưng UI/spec hiện chỉ cho 1).

3. **LUT áp sau scale/pad** — tức là áp lên frame đã letterbox (kể cả viền đen).
   Với LUT màu thì viền đen vẫn đen nên không ảnh hưởng thực tế.

4. **File .cube phải tồn tại local.** 10 file trong `assets/filters/` (~132KB mỗi file)
   KHÔNG được push lên GitHub (vượt giới hạn push API) — user/dev phải chạy
   `bash assets/fetch_large_assets.sh` để tải về (có kiểm tra SHA256).
   Nếu thiếu file, render worker báo lỗi rõ ràng chứ không render bừa.

5. **Preview web chưa hiển thị LUT.** LutPicker dùng CSS filter gần đúng để
   "minh họa" (ghi rõ trong UI) — màu chính xác chỉ thấy khi render.

6. **LUT + transition (xfade):** LUT được áp trước khi xfade gộp clip, nên vùng
   transition sẽ blend 2 frame đã qua LUT — hành vi hợp lý, đã suy luận nhưng
   chưa test tổ hợp này bằng video thật.

7. **Không có LUT custom của user.** Chỉ 10 LUT có sẵn trong catalog. Upload
   file .cube riêng là tính năng tương lai.

## So sánh trung thực với CapCut

| Khía cạnh | VCut Studio | CapCut |
|---|---|---|
| Số filter màu | 10 (LUT .cube thật) | Hàng trăm (kể cả filter AI) |
| Điều chỉnh cường độ | Không | Có (slider 0-100%) |
| Keyframe cường độ | Không | Có |
| Filter AI (phong cảnh, chân dung...) | Không | Có (cloud) |
| Xem trước realtime | Minh họa CSS gần đúng | Realtime chính xác |

Điểm mạnh duy nhất của ta: LUT là file .cube chuẩn mở (MIT), user tự thêm
file vào `assets/filters/` + catalog là dùng được — không bị khóa hệ sinh thái.
