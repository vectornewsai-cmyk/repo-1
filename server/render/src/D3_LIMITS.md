# D3_LIMITS.md — Phase 9 D3: motion tracking cho clip TEXT và VIDEO

## Đã làm (24–25/10/2026, KHÔNG PUSH)

Mở rộng motion tracking (Phase 8 Q5, trước đây chỉ sticker) sang clip text
và clip video, dùng ĐÚNG biểu thức nội suy quỹ đạo của sticker
(`tracking.js`: tuyến tính giữa 2 điểm mẫu, kẹp ngoài khoảng
[điểm đầu, điểm cuối]; thời gian CỤC BỘ `t - clip.start`).

### Ngữ nghĩa bám (quan trọng, khác nhau theo loại clip)

- **Text (drawtext + PNG SR): TÂM dòng chữ** bám điểm quỹ đạo:
  `x = w*frac - text_w/2`, `y = h*frac - text_h/2`.
- **Video: TÂM khung hình (unit)** bám điểm quỹ đạo:
  `x = main_w*frac - overlay_w/2`, `y = main_h*frac - overlay_h/2`.
  Unit video không SR là full-frame nên overlay_w = main_w: khung hình
  DỊCH CHUYỂN để tâm bám điểm track (hiệu ứng pan theo vật thể). Muốn
  kiểu picture-in-picture bám vật thể thì kết hợp thêm keyframes scale
  (khi đó tâm hình bao đã thu nhỏ bám điểm track).
- **Track thắng vị trí** (x/y tĩnh, keyframes x/y) nhưng **không thắng**
  scale/rotation/opacity: các thứ đó vẫn áp dụng bình thường.
- **Thời gian quỹ đạo gắn với lúc clip xuất hiện** (`t - start`), KHÔNG
  gắn với thời gian nguồn của video. Hệ quả: trim mép trái clip video
  sẽ dời gốc thời gian của quỹ đạo theo (điểm track ở đầu clip mới sẽ
  là điểm t=0 của quỹ đạo, không phải điểm ứng với frame nguồn cũ).
  Đây là ngữ nghĩa kế thừa từ sticker (sticker không có thời gian nguồn)
  — chưa có cơ chế re-time quỹ đạo theo trim (việc tương lai, tương tự
  captionFollow của P6).

### File đã tạo/sửa

- Tạo: `server/render/src/test_d3_trackfollow.js` (test render thật),
  `server/render/src/D3_LIMITS.md` (file này).
- Sửa:
  - `packages/video-spec/src/index.ts`: thêm `track?: TrackAttachment`
    vào `VideoClip` và `TextClip`.
  - `packages/video-spec/src/tracking.ts`: chỉ sửa comment (sticker →
    sticker/text/video).
  - `server/render/src/validate.js`: validate track cho video/text
    (lỗi khi quỹ đạo sai); cảnh báo khi video dính transition hoặc
    text typewriter/karaoke (track bị bỏ qua ở nhánh đó); cảnh báo khi
    track gắn vào kind chưa hỗ trợ (image/audio).
  - `server/render/src/render.js`: video unit chưa merge dùng biểu thức
    track cho overlay x/y; text PNG SR dùng biểu thức track thay
    buildOverlayExprs; text drawtext dùng `w*frac - text_w/2`
    (giữ alpha từ animation). Tất cả đều qua overlay/drawtext đã quote
    nháy đơn nên biểu thức chứa dấu phẩy vẫn an toàn.
  - `apps/web/src/preview.tsx` (sửa tối thiểu, comment "Phase 9 D3"):
    text override `vis.cx/cy` bằng nội suy quỹ đạo; video dịch unit
    theo shift (cả nhánh mask, nhánh SR, nhánh thường + tô nền đen của
    unit để khớp render). Dùng sẵn `interpolateTrackPoints` của
    previewEngine (cùng luật với sticker).
  - `apps/web/src/components/sticker/TrackPanel.tsx`: cho phép gắn quỹ
    đạo cho clip text/video (trước đây chỉ sticker); copy đổi từ
    "sticker" sang "clip".
  - `apps/web/src/Inspector.tsx`: render `<TrackPanel />` cho clip
    text/video (không thêm key i18n mới vì panel tự có tiêu đề riêng).

### Kiểm chứng (số đo thật, xem test_d3_trackfollow.js)

- Render thật 640x360, quỹ đạo tuyến tính x 0.25 → 0.75, y = 0.5:
  - t = 1.0s: vạch video tâm **239.5** (kỳ vọng 240), tâm chữ
    **(239.0, 179.5)** (kỳ vọng (240, 180)).
  - t = 3.0s: vạch video tâm **399.5** (kỳ vọng 400), tâm chữ
    **(399.0, 179.5)** (kỳ vọng (400, 180)).
  - Sai số ≤ 1px ở mọi mẫu (phần còn lại là làm tròn x264/yuv420p).
- Biểu thức `buildAxisExpr` đánh giá đúng nội suy + kẹp tại 7 điểm
  (lt = -1, 0, 0.75, 1.5, 2.75, 4, 5; ngoài khoảng kẹp về điểm cuối,
  tức mất track thì đứng yên ở điểm tốt cuối — KHÔNG bịa chuyển động).
- Validator: text + track hợp lệ pass; track rỗng lỗi; typewriter +
  track và video + transition + track chỉ cảnh báo, vẫn render.
- Dry-run text SR + track: overlay chứa biểu thức track
  (`if(lt(` + `main_w`).
- Tổng: **test_d3_trackfollow 22/22 pass**.
- Hồi quy: `tsc --noEmit` 0 lỗi toàn app, `vite build` pass,
  tracking self-test pass, sticker self-test pass, test_r2 16/16,
  preview-engine 337 assertions pass.
- **Sửa chữa chéo (ngoài phạm vi D3, ghi rõ để khỏi nhầm):** lúc kiểm
  chứng, `vite build` fail với `"interpolateMaskAt" is not exported`
  — nguyên nhân là agent D4 (mask keyframes) đã thêm hàm mới vào
  `mask.ts` + dùng ở `MaskPanel.tsx` nhưng chưa đồng bộ mirror
  `mask.js` (từ 23/10), mà Rollup resolve `"./mask.js"` sang đúng
  mirror cũ đó (tsc thì resolve sang `.ts` nên vẫn xanh — bẫy đã biết:
  pipe output sang `tail` còn che cả exit code, D3 đã chạy build
  không pipe để xác minh). D3 đã port nguyên văn các hàm keyframes
  D4 (`sort/has/normalize/interpolate/maskGeometryAt` + validate
  keyframes) từ `mask.ts` sang `mask.js`, không đổi logic nào của D4;
  sau đó `vite build` pass và test maskKeyframes của D4 vẫn 14/14.
  Nếu D4 đồng bộ lại mirror theo cách của mình thì nội dung tương
  đương, không xung đột ý nghĩa.

## Chưa làm / giới hạn thật (không giấu)

1. **Mask bám track CHƯA làm** — đó là việc của agent khác (mask hiện
   áp trước overlay nên mask tĩnh sẽ đứng yên trong khi clip dịch theo
   track; kết hợp mask + track lúc này cho kết quả "clip chạy khỏi
   mask", đã ghi rõ để khỏi hiểu lầm là bug).
2. **Text typewriter và karaoke KHÔNG bám track ở render** (vẽ bằng ASS
   `subtitles`, không có biểu thức theo frame; làm được bằng `\move`
   từng đoạn nhưng ngoài phạm vi D3). Preview cũng giữ vị trí tĩnh cho
   2 loại này để khỏi lệch với render; validator cảnh báo.
3. **Video dính transition (unit đã merge) KHÔNG bám track ở render**
   (unit merge spanning 2 clip, không gắn được quỹ đạo của 1 clip).
   Preview không biết trạng thái merge nên vẫn hiện bám track ở đoạn
   chuyển cảnh — lệch đã biết, cùng họ với lệch opacity-merge đã ghi
   trong PREVIEW_LIMITS.md. Validator cảnh báo.
4. **Preview track-follow chưa qua click-test trên browser thật**:
   preview dùng đúng hàm nội suy đã chứng minh qua sticker + render
   pixel test, và `tsc`/`vite build` xanh, nhưng chưa có test CDP nào
   bấm TrackPanel cho text/video hay đo vị trí preview theo frame.
   Render mới là ground truth đã đo.
5. **Track không tự re-time khi trim/split/move clip**: quỹ đạo neo
   theo `clip.start` hiện tại. Split clip có track: 2 mảnh cùng giữ
   nguyên quỹ đạo (mảnh sau sẽ bắt đầu từ điểm t=0 của quỹ đạo, không
   phải điểm tiếp nối) — hành vi này kế thừa từ cách sticker lưu
   track, chưa được xử lý riêng.
6. **TrackPanel vẫn nạp trajectory JSON thủ công** (chạy track.py
   ngoài editor rồi nạp file) — không đổi luồng Q5; D3 chỉ mở rộng
   loại clip được gắn.
7. Quỹ đạo vẫn giới hạn `TRACK_MAX_POINTS = 240` điểm (giới hạn độ dài
   biểu thức overlay FFmpeg, kế thừa từ Q5).
8. Không đụng tới: tracker OpenCV (`server/tracking/track.py`),
   audio ducking/markers (lượt 3), và mọi file của agent đợt 4 khác
   ngoài phần tối thiểu nêu trên.
