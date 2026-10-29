# NESTED_RENDER_LIMITS.md — Giới hạn của render nested sequence (Phase 9 N2)

Render worker làm phẳng clip lồng nhau thành spec phẳng rồi render bằng
pipeline FFmpeg hiện có — không có pipeline render đệ quy riêng. Mọi giới
hạn dưới đây đều là hành vi thật của `nested.js` + điểm nối trong `render.js`
(làm phẳng TRƯỚC `validateSpec`), đã kiểm chứng bằng
`test_nested_render.js` (24/24 check pass, xem cuối file).

## Cái gì ĐÃ hỗ trợ (đã test thật)

- Clip lồng nhau dạng `subSpec` (bí danh `nested` cũng nhận) chứa `tracks`
  theo đúng dạng video-spec; làm phẳng đệ quy nhiều cấp.
- Ánh xạ thời gian: clip lồng nhau chiếm `[S, S+D)` trên timeline ngoài và
  phát đoạn timeline con `[in, in + D*speed)`. Clip con giao với cửa sổ đó
  thành clip phẳng `start' = S + (vs-in)/speed`,
  `duration' = (ve-vs)/speed`; clip media được tính lại
  `in' = in_gốc + (vs-s)*speed_gốc`, `speed' = speed_gốc*speed`,
  `out' = in' + duration'*speed'` (capped ở `out` gốc). Clip text/sticker/
  image chỉ đổi `start`/`duration` (image không có trục nguồn).
- Mỗi track con thành MỘT track phẳng mới (`<nestedId>__<subTrackId>`,
  chèn ngay sau track chứa clip lồng nhau) — giữ lớp phủ và thứ tự
  composite; track ngoài được giữ lại kể cả khi rỗng sau khi bỏ clip lồng nhau.
- Track con kế thừa cờ của track ngoài: `hidden`/`muted` = OR hai phía,
  `volume` = tích hai phía (chỉ ảnh hưởng gain audio).
- Clip con nằm ngoài cửa sổ hoàn toàn thì bị bỏ (không render gì ở đó).
- Cùng một project con dùng ở nhiều clip lồng nhau: được phép (không phải
  vòng lặp); id clip đụng nhau được đổi tên `<nestedId>:<clipId>` và
  `captionOf.clipId` trong cùng đợt mở rộng được viết lại theo.
- Audio trong project con: clip audio con được làm phẳng như clip media
  (kể cả `in`/`speed`/fade rút ngắn theo phần bị cắt) và trộn bằng `amix`
  hiện có — đã test ở cấp flatten (fadeOut rút ngắn), chưa test render MP4
  có tiếng lồng nhau (xem "Chưa đo").
- Spec phẳng cũ: `hasNestedClips === false` nên không đi qua nhánh flatten —
  `flattenSpecForRender(spec_phẳng)` deep-equal chính spec đó (test A4),
  render phẳng và dry-run phẳng vẫn chạy như cũ (test B10).

## Cái gì CHƯA hỗ trợ — fail fast (throw, không render sai lặng lẽ)

Những trường hợp này `flattenSpecForRender` throw và `render.js` thoát mã 1
với message rõ ràng, thay vì render ra video sai:

- **Vòng lặp subSpec** (project con chứa chính nó theo object identity) và
  **vượt quá độ sâu `NESTED_MAX_DEPTH = 8`** (test A5/A6).
- **Field của clip lồng nhau ngoài `id/start/duration/in/speed` và 2 ngoại
  lệ R3**: `src`, `reverse`, `speedKeyframes`, `animations`, `track`,
  `mask`, `filter`, `effects`, `enhance`, `chromaKey`, `audioEffects`.
  Lý do: chúng không có ngữ nghĩa rõ ràng khi áp cho cả một nhóm clip.
  `out` nếu có phải bằng `in + duration*speed`, nếu không cũng throw.
  Ngoại lệ R3 (xem R3_LIMITS.md): `opacity` (0..1, nhân vào clip lá) và
  `transitionIn`/`transitionOut` type `"fade"` (nối qua biên bằng fade
  opacity; type khác vẫn throw).
- **Clip con bị cắt bên trái hoặc phát ở `speed != 1` mà mang "đồ gắn theo
  thời gian"**: keyframes `animations`, `track` (motion tracking),
  `speedKeyframes`, `karaoke`, `volumeKeyframes`. Thời gian của chúng tính
  từ đầu clip nên dịch/scale cần nội suy lại — chưa làm.
- **Clip media có `reverse` mà bị cửa sổ cắt** (trái hoặc phải): thứ tự đảo
  làm công thức `in'` sai. Clip reverse KHÔNG bị cắt thì giữ nguyên.
- **Transition qua biên clip lồng nhau — ĐÃ HỖ TRỢ từ R3 (chỉ type
  "fade")**: cặp biên (clip phẳng ngoài ↔ clip lồng nhau) được nối bằng
  fade opacity — đầu phải lồng nhau thì lá dịch sớm T giây + keyframes
  opacity 0→effOp, đầu phải phẳng thì clip phẳng dịch sớm T giây + lá
  đầu trái fade-out effOp→0 (xem R3_LIMITS.md, test `test_nested_r3.js`
  43/43 + pixel blend thật). Type khác "fade" vẫn throw; các tổ hợp gây
  gap/pop (lồng nhau 2 đầu, clip phẳng bị dịch còn dính cặp khác, clip
  phẳng đầu trái đã có transition phẳng) cũng throw thay vì render sai.

## Cái gì bị cắt nhẹ — strip + warning (không fail)

- **Cặp transition trong project con bị cửa sổ phá vỡ** (một đầu bị bỏ hoặc
  bị cắt): bỏ `transitionIn`/`transitionOut` của đầu còn lại, render hard
  cut, in warning `nested: transition ... bị cửa sổ clip lồng nhau phá vỡ`.
  Cặp còn nguyên vẹn thì giữ nguyên; khi `speed != 1`, thời gian transition
  được scale theo `1/speed` (test A7).
- **Cắt bên phải**: keyframe/điểm track/từ karaoke vượt quá duration mới bị
  bỏ + warning; field nào hết keyframe thì bị xóa (tránh validator báo
  keyframes rỗng). Fade audio rút ngắn theo phần bị cắt
  (`fadeIn' = max(0, fadeIn - cắt trái)`,
  `fadeOut' = max(0, fadeOut - cắt phải)`).
- **Clip con bị cắt nhưng không mang đồ gắn thời gian**: làm phẳng bình
  thường, không warning (cắt là hành vi bình thường của cửa sổ).

## Cái gì chưa đo / chưa chứng minh

- **Hiệu năng flatten**: flatten là xử lý JSON thuần, không đáng kể so với
  encode; chưa benchmark trên project lớn (hàng trăm clip lồng nhau) nên
  không claim con số. Render MP4 sau flatten chạy đúng tốc độ pipeline cũ
  (không có overhead riêng — flatten xong thì graph FFmpeg giống hệt project
  phẳng tương đương, chỉ khác tên track/label nội bộ).
- **Audio lồng nhau ra MP4 thật**: mới chỉ test flatten (số học `in`/`fade`),
  chưa render MP4 có track audio con để đo waveform/duration thực tế.
  `ducking.voiceTrackId` trỏ vào track con cũng KHÔNG được remap (id track
  mới khác id gốc) nên ducking không nhắm vào trong project con được.
- **Mask/effect áp cho toàn bộ sequence**: chưa hỗ trợ (throw, xem trên) —
  muốn hiệu ứng toàn sequence thì gắn effect cho từng clip con thay vì cho
  clip lồng nhau.
- **Preview/editor**: luồng này chỉ làm render worker. `nested.ts` ở
  video-spec thuộc luồng N1; nếu N1 đổi hình dạng clip lồng nhau (tên field
  khác `subSpec`/`nested`), worker này cần cập nhật `isNestedClip` cho khớp.
  Hiện tại worker tự nhận dạng bằng cấu trúc JSON, không import build TS.
- **Độ sâu 8** là giới hạn kỹ thuật chống đệ quy vô hạn, không phải giới hạn
  sản phẩm đã đo — project lồng nhau sâu hơn 8 cấp sẽ bị từ chối dù về lý
  thuyết vẫn làm phẳng được.

## Số đo render thật (máy VM, FFmpeg 8.1.2, ngày 25/10)

Test `test_nested_render.js` — project 2 cấp: ngoài `N [2, 7)` với `in=0.5`,
giữa `n1 [1, 5)`, trong `c1 [0, 2)` testsrc2 + `c2 [2, 4)` color xanh,
320x240 @ 10fps, encode libx264 ultrafast CRF 28:

- Làm phẳng: `c1 → start=2.5 duration=2`, `c2 → start=4.5 duration=2`,
  track mới `N__n1__in-v`, stats `{ nestedClips: 2, outputClips: 2,
  newTracks: 1 }`.
- Render lồng nhau: exit 0, MP4 tồn tại, **duration ffprobe = 6.5s đúng**,
  **320x240 @ 10fps**, 77.616 byte.
- Render phẳng tương đương viết tay: cùng duration 6.5s; dry-run spec
  phẳng exit 0, chứa `filter_complex`, không đi qua nhánh nested.
- Đo riêng một lần render lồng nhau tương đương (không tính tạo media):
  **0.49s wall cho 6.5s video (~13.3x realtime, 65 frame)** — con số này chỉ
  phản ánh pipeline cũ trên clip test nhỏ, không phải benchmark hiệu năng
  của riêng tính năng nested.
- Tổng test: **24/24 check pass** (8 unit flatten + 2 render thật + các
  check phụ), chạy bằng `node src/test_nested_render.js` từ `server/render/`.
  Test tự tạo media bằng FFmpeg lavfi trong thư mục tạm và dọn dẹp khi pass.
