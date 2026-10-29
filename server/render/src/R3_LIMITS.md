# R3_LIMITS.md — Transition qua biên nested + opacity kế thừa (R3, Phase 9)

Đợt R3 (25/10) nối 2 gap trong `docs/NESTED_ROUND_LIMITS.md` mục 3:
transition qua biên nested clip và opacity đặt trên nested clip — ở CẢ
render worker (`server/render/src/nested.js`, điểm nối duy nhất trong
`render.js` là nhánh flatten trước validate, không sửa sâu render.js) và
preview (`apps/web/src/lib/nestedPreview.ts`, qua `buildPreviewSpec`).
Mọi claim dưới đây đều có test/số đo đi kèm; phần chưa làm được ghi rõ.

## Cơ chế (khớp nhau ở cả 2 phía)

Cặp biên là cặp (A, B) kề nhau trên một track mà ít nhất một đầu là clip
lồng nhau, định nghĩa bởi A.transitionOut và/hoặc B.transitionIn (cùng
duration, cùng type). Vì sau khi phẳng hai đầu không còn cùng track nên
KHÔNG dùng được xfade của render.js; thay vào đó dùng fade opacity:

- **B là clip lồng nhau:** mọi clip lá của B dịch sớm T giây (nội dung
  giữ nguyên, chỉ phát sớm — đúng ngữ nghĩa xfade "nội dung B bắt đầu
  sớm T giây") và clip lá ở biên (bắt đầu đúng đầu cửa sổ) nhận keyframes
  opacity 0→effOp trong T giây đầu (local time, easing linear), phủ lên
  clip A còn đang phát bên dưới → dissolve thật. Render: chuỗi keyframes
  opacity K1 (alphaextract→geq→alphamerge) + overlay; preview: renderFrame
  vẽ mọi clip active theo thứ tự track với globalAlpha = opacity.
- **B là clip phẳng:** B dịch sớm T giây và clip lá ở biên cuối của A
  nhận keyframes opacity effOp→0 trong T giây cuối, lộ dần B bên dưới
  (lá nằm trên vì track lá chèn sau track ngoài) → dissolve thật.
- **A lồng nhau, B lồng nhau:** chỉ B fade-in (lá của B nằm trên lá của
  A nên fade một phía đã đủ dissolve; fade cả hai phía sẽ làm tối giữa
  vì alpha nhân đôi: 0.5 trên 0.5 chỉ còn 0.25 sáng).
- **Opacity kế thừa:** opacity trên clip lồng nhau (0..1) nhân vào từng
  clip lá hình: opacity tĩnh nhân trực tiếp, keyframes opacity nhân từng
  giá trị v. Lồng nhiều cấp nhân dồn (0.5 × 0.5 = 0.25). Fade biên dùng
  effOp = opacity lá × opacity lồng nhau làm đầu/cuối ramp nên không
  nhân đôi. Clip audio bỏ qua (không có khái niệm opacity).

## Đã chứng minh thật

Render — `node src/test_nested_r3.js` từ `server/render/`: **43/43 check
pass** (8 nhóm unit flatten + 4 render thật + fail-fast CLI). Media test
tự tạo bằng FFmpeg lavfi (color đỏ/xanh, 320x240 @ 10fps):

- B1 fade-in phẳng→lồng nhau (đỏ 0–2s, nested xanh 2–4s, fade 1s): pixel
  trung tâm t=0.5 → (253, 0, 0) đỏ thuần; **t=1.5 → (127, 0, 124) blend
  thật** (không cắt cứng); t=2.5 → (0, 0, 252) xanh thuần.
- B2 opacity 0.5 trên nested (lá đỏ): **t=1 → (127, 0, 0) đúng 50%** (không
  đỏ thuần, không đen).
- B3 fade-out lồng nhau→phẳng: t=0.5 → (252, 0, 0); **t=1.5 → (125, 0, 126)
  blend thật**; t=2.5 → (0, 0, 254); duration ffprobe ≈ 3s (clip phẳng
  dịch sớm 1s).
- B4 wipeleft qua biên → CLI exit != 0, message nêu rõ chỉ hỗ trợ "fade".

Preview — `node --experimental-strip-types src/lib/nestedPreviewR3.test.ts`
từ `apps/web/`: **17/17 test pass**, gồm: t=1.5 có đúng 2 clip active
(clip dưới opacity 1, lá biên nội suy 0.5) → canvas vẽ ra blend; spec gốc
không bị sửa (clip phẳng sau build vẫn start cũ); test cũ
`nestedPreview.test.ts` vẫn 31/31. `tsc` apps/web: 0 lỗi (test R3 đã
thêm vào tsconfig exclude theo đúng quy ước của test cũ).

Hồi quy: `test_nested_render.js` vẫn 24/24; spec phẳng flatten ra deep-equal
(cặp phẳng không bị đụng).

## Fail fast (throw, không render sai lặng lẽ)

- Type qua biên khác "fade" (wipe/slide/...) → throw, nêu rõ chỉ hỗ trợ
  "fade" (render: `flattenSpecForRender` throw → render.js exit 1;
  preview: `flattenForPreview`/`buildPreviewSpec` throw — lưu ý preview
  gọi buildPreviewSpec trong vòng rAF không có try/catch nên project lỗi
  sẽ throw mỗi frame thay vì hiện cắt cứng sai; đó là chủ ý để không
  hiện preview sai lệch với bản render cũng bị từ chối).
- Clip lồng nhau vừa có transition qua biên ở cả hai đầu (in + out).
- Clip phẳng bị dịch sớm bởi cặp biên mà còn dính transition khác
  (làm đầu trái cặp biên/phẳng, hoặc đầu phải cặp phẳng) — validator
  phẳng yêu cầu kề nhau nên cặp khác vỡ.
- Clip phẳng là đầu trái cặp biên mà đã là đầu phải của cặp phẳng với
  clip kề trước — unit phẳng kết thúc sớm T_f nên cửa sổ fade luôn dính
  đoạn đen cuối (gap của xfade phẳng) → pop.
- Hai đầu cùng khai mà duration/type không khớp → throw (không đoán).
- Clip lá ở biên: có keyframes opacity sẵn, có transition trong project
  con, kind image/sticker (render + preview đều không áp opacity
  keyframes cho 2 kind này nên fade sẽ thành cắt cứng), bị cửa sổ cắt
  trái (fade-in sẽ lộ nội dung trước cửa sổ), hoặc ngắn hơn T.
- Opacity lồng nhau ngoài [0,1] hoặc không phải số → throw.
- Cặp biên mà clip kề trước tồn tại nhưng không kề (gap) → throw.

## Cắt nhẹ (strip + warning, không fail)

- Cặp biên mà nested là clip đầu track (không có clip kề trước) →
  warning + bỏ qua (khớp validator phẳng cho clip đầu track).
- Cặp biên trên track không phải video (vd audio) → warning + bỏ qua,
  không dịch, không fade (giữ hành vi cũ — field biến mất cùng clip
  lồng nhau, không throw để không vỡ project cũ chỉ có field thừa).
- Opacity trên nested clip mà không áp được cho lá nào (chỉ có clip
  audio) → warning (render); preview bỏ qua audio lặng lẽ theo cùng
  quy tắc (audio không mang opacity).
- Cặp transition trong project con bị cửa sổ phá vỡ vẫn strip + warning
  như trước (R3 chạy SAU bước strip này: lá còn transition sau strip
  mới tính là dính transition trong).

## Chưa hỗ trợ / chưa đo (trung thực)

- Chỉ type "fade" qua biên. Các type xfade khác (wipe, slide, dissolve,
  circle, ...) qua biên vẫn throw — muốn chúng phải có cơ chế nối khác
  (xfade thật xuyên track, không phải fade opacity).
- Chỉ clip lá video/text ở biên mới fade được. Clip lá image/sticker ở
  biên + transition qua biên → throw (thay vì cắt cứng). Clip lá
  video/text ở biên nhưng mang mask/SR/track/chromaKey: fade vẫn áp
  (cùng chuỗi alpha) nhưng CHƯA test tổ hợp này — không claim.
- Audio không crossfade qua biên: tiếng của 2 đầu vẫn cắt cứng như
  transition phẳng (audio của transition phẳng cũng vậy — không phải
  regression, nhưng khác CapCut).
- Clip phẳng bị dịch sớm làm tổng duration co lại T giây nếu nó là clip
  cuối (không còn gap đen cuối như xfade phẳng giữ D theo spec). Clip
  phẳng giữa timeline thì gap sau nó giữ nguyên như xfade phẳng.
- Preview và render dùng 2 hình dạng nested khác nhau (preview:
  `tracks` trực tiếp trên clip; render: `subSpec`/`nested`): R3 mirror
  logic nhưng KHÔNG thống nhất shape — việc thống nhất shape là của đợt
  khác, không claim đã xong.
- Keyframes fade inject luôn dùng easing "linear" (validator bắt buộc
  easing thuộc linear|ease-in|ease-out; keyframes không easing bị từ
  chối — đã gặp khi test, đã sửa bằng cách inject kèm easing).
- Hiệu năng flatten không đổi đáng kể (resolve cặp biên là quét tuyến
  tính theo track); chưa benchmark project lớn.
- UI chưa đặt được transition/opacity lên nested clip (N4 chưa có) —
  tính năng này hiện chỉ tới được qua project JSON import/sửa tay.
- `docs/NESTED_ROUND_LIMITS.md` mục 3 do parent tổng hợp — file này
  (R3_LIMITS.md) là nguồn chi tiết của luồng R3, parent cập nhật mục đó
  khi merge.
