# SEEK_LIMITS.md — Giới hạn trung thực của seek chính xác (R1-062)

## Vấn đề đã giải quyết

Trước đây, khi pause/scrub, `preview.tsx` gán `el.currentTime = target` rồi vẽ
canvas **ngay lập tức**. Vì seek của `HTMLVideoElement` là bất đồng bộ, frame
hiển thị thường là frame CŨ (đã giải mã trước đó) — click vào timeline thấy
sai frame, audio lệch khỏi hình.

Giờ đây: pause tất cả media → set `currentTime` đã snap về frame → chờ sự kiện
`seeked` của từng element → chỉ vẽ frame khi lần seek mới nhất hoàn tất.

## Những gì đã làm

- `lib/seek.ts`:
  - `seekEpsilonFor(fps)` / `needsSeek()` — ngưỡng "đã đúng vị trí" = ±1 frame.
    Đã đúng vị trí thì không gán lại `currentTime` (tránh nhấp nháy/re-seek).
  - `seekElement()` — pause, snap target về frame (timebase R1-055), chờ
    `seeked` với timeout dự phòng 1200ms. Không bao giờ throw.
  - `seekAll()` — pause TẤT CẢ element trước (audio + video dừng cùng lúc),
    rồi seek song song bằng `Promise.all` → audio seek cùng lúc với video.
  - `Seeker` — debounce 80ms + latest-wins: kéo nhanh chỉ seek 1 lần khi thả
    tay; request cũ bị hủy và promise cũ resolve `{ cancelled: true }`
    (không bao giờ treo).
- `preview.tsx`:
  - Tách `collectActives()` khỏi `syncMedia()` để dùng chung cho seek.
  - Nhánh pause của `syncMedia()` không gán `currentTime` trực tiếp nữa.
  - Vòng loop: khi pause và playhead đổi → `Seeker.request()` → sau khi seek
    xong mới `renderFrame()`. Trong lúc chờ, canvas giữ frame tĩnh.
  - Khi bấm play: `seeker.cancel()` rồi đồng bộ như cũ.
  - AudioEngine (R1-063) không bị ảnh hưởng: `engine.update()` vẫn chạy mỗi
    frame để gain/VU meter theo kịp scrub.
- `media.ts`: thêm `MediaPool.eachMedia()` (hỗ trợ duyệt element).

## Giới hạn còn lại (trung thực)

1. **Trình duyệt seek tới keyframe gần nhất, không phải frame chính xác.**
   Với video keyframe thưa (ví dụ 1 keyframe/giây), frame hiển thị có thể lệch
   vài frame so với playhead — đây là giới hạn của HTMLVideoElement, không sửa
   được bằng JS. Test "±1 frame" chỉ đúng ở mức `currentTime`, không đảm bảo
   pixel của frame giải mã.
2. **Timeout 1200ms là heuristic.** File nặng/mạng chậm có thể cần lâu hơn —
   khi timeout, frame vẫn được vẽ (có thể là frame cũ) để UI không treo.
3. **`seeked` có thể không bao giờ bắn** nếu metadata chưa tải xong
   (`readyState === 0`): lúc đó gán `currentTime` có thể ném lỗi (đã catch),
   element giữ nguyên vị trí cũ cho tới khi metadata về.
4. **Trong lúc kéo nhanh, canvas hiển thị frame TĨNH** (frame cuối đã seek xong),
   không phải thumbnail của vị trí đang kéo — đây là chủ ý (tránh nhấp nháy
   frame sai), nhưng khác CapCut ở chỗ CapCut vẫn cập nhật hình khi scrub.
5. **Audio seek "cùng lúc" ở mức JS** (`Promise.all`), không đảm bảo đồng bộ
   mẫu (sample-accurate) ở mức phần cứng — hai element có thể lệch vài ms.
6. **Reverse playback**: khi pause/scrub, seek vẫn đúng (dùng `sourceTimeAt`);
   khi phát, trình duyệt không phát ngược được (giới hạn đã ghi trong
   SPEED limits, thuộc R1-062 gốc của master plan — ngoài phạm vi task này).
7. **Debounce 80ms**: click đơn vào timeline cũng chờ ~80ms mới seek — độ trễ
   nhỏ nhưng cảm nhận được trên máy yếu. Có thể giảm xuống nếu cần.
8. **Chưa test trên browser thật** (nợ chung của dự án): seek dùng `seeked`
   event thật của trình duyệt, mock trong test chỉ mô phỏng hành vi chuẩn.
