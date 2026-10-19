# TIMEBASE_LIMITS.md — Giới hạn trung thực của frame-accurate timebase (R1-055)

## Đã làm
- Mọi thời gian trên timeline (playhead, move, trim, split, add) được snap về
  frame theo `meta.fps` (mặc định 30) qua `snapToFrame()`.
- Ruler timeline hiển thị timecode `HH:MM:SS:FF`; toolbar có readout timecode
  của playhead.
- Test: `src/timebase.test.ts` — 20 assertions (xem cách chạy ở cuối file này).

## Giới hạn còn lại (trung thực)

1. **Snap toggle chưa có UI**: master plan R1-056 yêu cầu nút bật/tắt snap.
   Hiện tại snap LUÔN BẬT, không tắt được. Muốn tắt phải sửa code.
2. **In/Out trong Inspector không snap**: 2 ô số "In (s)"/"Out (s)" cho nhập
   tay thời gian nguồn — đó là thời gian của file gốc (fps của file gốc),
   snap theo fps project là sai về mặt kỹ thuật nên cố tình không snap.
   Hạn chế: nhập tay 0.0333 vẫn lưu float thô.
3. **fps không nguyên (29.97, 23.976)**: `formatTimecode` dùng fps danh nghĩa
   `round(fps)` cho phần FF → timecode trôi nhẹ ở video rất dài. Không hỗ trợ
   drop-frame timecode (chuẩn broadcast). Với 30/60fps thì chính xác tuyệt đối.
4. **Render worker không snap lại**: render.js tin spec đã snap từ editor.
   Spec viết tay/MCP gửi float lẻ (ví dụ start=0.0333) vẫn render được —
   FFmpeg tự xử lý — nhưng frame biên có thể lệch ±1 frame so với preview.
   Chưa có bước "chuẩn hoá spec về frame" ở validate.js (cố tình: giữ validator
   nghiêm về báo lỗi thay vì tự sửa dữ liệu).
5. **Keyframe times không snap**: thời gian keyframe (giây, local-time) chưa
   qua snapToFrame — keyframe ở 0.0333s vẫn là float. Preview nội suy tuyến
   tính nên sai số không nhìn thấy được; render FFmpeg cũng nội suy.
6. **Preview scrub**: playhead đã snap nên `<video>.currentTime` luôn là bội
   số của frame — nhưng browser seek vốn không chính xác tới frame (codec),
   nên "frame-accurate" ở đây là ở mức model, không đảm bảo decode chính xác
   từng frame trên mọi trình duyệt.
7. **Không có "go to timecode"**: readout chỉ hiển thị, chưa cho nhập
   HH:MM:SS:FF để nhảy playhead.

## Cách chạy test
```bash
cd packages/video-spec
npx tsc src/timebase.ts src/timebase.test.ts --outDir /tmp/tb-test \
  --module nodenext --target es2022 --moduleResolution nodenext --skipLibCheck
node --test /tmp/tb-test/timebase.test.js
```
(Kỳ vọng: 20 pass, 0 fail.)
