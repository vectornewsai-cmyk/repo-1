# Phase 9 đợt 6 (R6) — E2E + DEMO + DOCS CHO NESTED/ADJUSTMENT HOÀN THIỆN

> Đợt 6 chỉ làm đúng phạm vi được giao: viết lại test E2E/demo để dùng
> flatten thật, render MP4 thật có audio lồng nhau, cập nhật docs demo
> và bảng LIMITS này. Không sửa render.js, không sửa spec, không sửa
> nested.js — mọi file đổi đều là test/demo/docs (xem §4). Mọi claim
> dưới đây đều có test/số đo đi kèm; phần chưa làm được ghi rõ.

## 1. Đã chứng minh thật ở đợt 6 (kiểm chứng độc lập của R6)

- Test web: `node apps/web/src/lib/nestedDemo.test.ts` → **8/8**.
  Nội dung: spec mẫu hợp lệ, shape sau chuyển đổi sang dạng N2 đúng
  từng field (outer start 1 / dur 4 / trim 0→4; sub-v leaf-a a.mp4
  0→2 in/out 0→2; inner start 2 / dur 2 / trim 0→2; lá trong b1/b2
  src b.mp4/c.mp4). Đây là test SHAPE, không phải test flatten.
- Test đầu-cuối: `node server/render/src/test_nested_e2e.js` →
  **28/28** (phần A 11 + phần B 8 + phần C 9).
  - Phần A — flatten thật + render thật (video 2 cấp): flatten bằng
    `flattenSpecForRender` từ `server/render/src/nested.js` cho ra
    leaf-a 1→3 (in 0→2), leaf-b1 3→4, leaf-b2 4→5; stats 2 nested /
    3 clip phẳng / 2 track mới / 0 warning; spec gốc không bị sửa.
    Render qua `render.js` → MP4 640×360, duration 5,000000s,
    328668 bytes.
  - Phần B — audio lồng nhau trong project con, render thật qua
    `render.js`: flatten cho au1 start 1 / dur 4 / in 0 / out 4;
    MP4 có audio stream AAC, duration 5,000000s; đo volumedetect:
    đoạn 0→0,9s (trước nested) mean **−91 dB** (câm),
    đoạn 2→4s (trong nested) mean **−24,1 dB** (tone sine 440Hz).
    Đây là lần đầu audio trong subSpec được đo bằng số thật, không
    chỉ test flatten.
  - Phần C — fail fast thật cho 9 field (xem §2): cả 9 đều throw từ
    `flattenSpecForRender` với thông báo chứa "chưa được hỗ trợ".
- Hồi quy không vỡ: test N2 `test_nested_render.js` vẫn **24/24**
  (MP4 nested 320×240, duration ≈ 6,5s). `nested.js` và `render.js`
  không bị R6 đụng tới nên kết quả này giữ nguyên.
- Đã xóa khỏi code: `flattenNestedDemo` + `FlatSegment` trong
  `sample-nested.ts` và mọi test dùng chúng. Trong repo không còn
  hàm flatten tự viết nào cho demo nữa (chỉ còn nhắc tên cũ trong
  chú thích giải thích việc xóa). Bảng phẳng 4 đoạn có cắt tại biên
  adjustment của đợt 5 đã bị bỏ cùng với chúng, vì nó là sản phẩm
  của flatten tự viết, không phải của code thật.

## 2. Bảng field trên nested clip — chỉ claim khi test thật chứng minh

| Field đặt trên nested clip | Trạng thái đợt 6 | Bằng chứng |
|----------------------------|------------------|------------|
| `start`, `duration`, `trim { in, out }`, `speed` (0.25–4), `subSpec` | ✅ Hỗ trợ (flatten + render thật) | E2E phần A/B; test N2 24/24 |
| Audio clip trong subSpec (kind audio, in/out) | ✅ Hỗ trợ (flatten + render + đo tiếng thật) | E2E phần B: AAC, −91 dB → −24,1 dB |
| Video clip trong subSpec (in/out, speed) | ✅ Hỗ trợ (flatten + render thật) | E2E phần A; test N2 (cắt trái, speed nhân) |
| `reverse` | ❌ Fail fast (throw, không render) | E2E phần C |
| `speedKeyframes` | ❌ Fail fast (throw, không render) | E2E phần C |
| `animations` | ❌ Fail fast (throw, không render) | E2E phần C |
| `mask` | ❌ Fail fast (throw, không render) | E2E phần C |
| `filter` | ❌ Fail fast (throw, không render) | E2E phần C |
| `effects` | ❌ Fail fast (throw, không render) | E2E phần C |
| `enhance` | ❌ Fail fast (throw, không render) | E2E phần C |
| `chromaKey` | ❌ Fail fast (throw, không render) | E2E phần C |
| `audioEffects` | ❌ Fail fast (throw, không render) | E2E phần C |
| `opacity` (trên nested clip) | ❌ Fail fast (throw — cũng nằm trong vòng fail fast của `nested.js`, nhưng đợt 6 KHÔNG đưa vào phần C vì danh sách giao chỉ có 9 field trên; đừng claim ngược) | Code `nested.js` (`nestedWindow`), chưa có test R6 |
| `src` (vừa có subSpec vừa có src) | ❌ Fail fast (throw, theo `nested.js`) | Code `nested.js`, chưa có test R6 |
| Transition qua biên nested clip | ❌ Chưa hỗ trợ (validator phẳng báo lỗi / preview cắt cứng) | Kế thừa từ LIMITS đợt 5, R6 không test lại |
| Ducking trỏ vào trong project con | ❌ Chưa hỗ trợ (voiceTrackId không remap) | Kế thừa từ LIMITS đợt 5, R6 không test lại |

Lưu ý đọc bảng: "fail fast" nghĩa là render DỪNG LẠI với lỗi rõ ràng,
không phải render sai lặng lẽ — đó là hành vi đúng theo thiết kế của
`nested.js`, nhưng tuyệt đối không được đọc thành "đã hỗ trợ".

## 3. Chưa làm được / chưa nối (trung thực, kế thừa đợt 5 + bổ sung R6)

1. **Adjustment layer vẫn chưa nối vào render.js thật** (nợ lớn nhất
   từ đợt 5, đợt 6 không làm vì ngoài phạm vi test/demo/docs).
   Hệ quả cụ thể ở đợt 6: demo đã BỎ HẲN phần render adjustment
   (kể cả bản dựng tay hue=s=0 của đợt 5) — adjustment trong demo
   bây giờ chỉ là dữ liệu minh họa trong `NESTED_DEMO_SPEC`, không
   vào spec N2, không được flatten, không được render. Ai muốn claim
   adjustment phải nối render.js trước (điểm nối trong header
   `adjustment.js`), rồi viết test render thật mới.
2. **Chưa kiểm tra pixel video nested** (frame 1.5s/3.5s/4.5s chưa đo
   màu tự động); chưa click-test UI thật cho compound/adjustment.
3. **Render.js không pad đuôi đen theo spec.duration**: MP4 đợt 6 dài
   5s, không phải 6s minh họa của spec mẫu cũ. Đừng claim 6s.
4. **TSC hiện không sạch, nhưng không phải do R6**: 2 lỗi ở file của
   luồng khác (`Timeline.tsx` fxDragRef thừa; `nestedPreview.ts`
   AdjustmentWindow thiếu nestedPath). Không có lỗi nào ở file R6
   đổi; R6 không sửa các file đó vì thuộc luồng khác / có thể đang
   được luồng song song sửa dở. Vite build chưa chạy lại ở đợt 6 vì
   cùng lý do (tsc đang đỏ ở file ngoài phạm vi) — parent kiểm chứng
   gộp cần chạy lại vite build sau khi các luồng khác hạ cánh.
5. Các nợ khác từ đợt 5 vẫn còn nguyên, R6 không đụng tới:
   adjustment chưa có type trong spec index (chưa export vì vấn đề
   mirror); clip giao một phần với layer vẫn chịu toàn bộ filter
   (chưa tách clip theo biên layer); preview ≠ render ở
   nested/adjustment (preview bỏ qua effect không vẽ được, chuỗi
   2 LUT thì layer trên thắng); key i18n đề xuất của N1/N4/N5 chưa
   merge (trừ `keyframe.kindNested`).

## 4. File đã đổi/thêm ở đợt 6 (chỉ test/demo/docs, KHÔNG push)

- Sửa: `apps/web/src/sample-nested.ts` — xóa `flattenNestedDemo` +
  `FlatSegment`, thêm `nestedDemoAsNestedSpec()` (chuyển đổi dữ liệu
  thuần sang shape N2, không tính flatten), cập nhật header giải
  thích việc xóa + duration render 5s + adjustment chỉ minh họa.
- Sửa: `apps/web/src/lib/nestedDemo.test.ts` — viết lại 8 test:
  bỏ mọi test flatten tự viết, chỉ test validate/shape/chuyển đổi.
- Viết lại: `server/render/src/test_nested_e2e.js` — 28 kiểm tra:
  flatten thật (nested.js) + render thật (render.js) + audio lồng
  nhau đo volumedetect + fail fast 9 field. Không còn tự dựng lệnh
  FFmpeg tay cho demo, không còn filter graph hue tự viết.
- Sửa: `docs/nested-adjustment-demo.md` — viết lại theo luồng mới
  (flatten thật, render qua render.js, MP4 5s, adjustment minh họa).
- Sửa: `docs/NESTED_DEMO_LIMITS.md` — viết lại: phần đã chứng minh
  ở đợt 6 kèm số đo, phần chưa chứng minh (adjustment, pixel, UI,
  tsc 2 lỗi ngoài phạm vi).
- Mới: `docs/NESTED_ROUND6_LIMITS.md` — chính file này.
- KHÔNG đổi: `server/render/src/nested.js`, `server/render/src/render.js`,
  `packages/video-spec/src/*` và mọi file spec/render khác.
- KHÔNG push GitHub, KHÔNG tag/release, KHÔNG binary trong đợt
  (MP4 test chỉ nằm trong thư mục tạm `/tmp/nested-e2e-*/`).
