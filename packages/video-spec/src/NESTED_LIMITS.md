# NESTED_LIMITS.md — Giới hạn của nested sequence / compound clip (Phase 9, luồng N1: SPEC)

> Tài liệu trung thực cho `nested.ts` (+ mirror `nested.js`). Đọc trước khi
> dùng NestedClip ở editor/preview/render. Mọi claim dưới đây đều có test
> hoặc số đo đi kèm; phần "chưa hỗ trợ" là chưa làm, không phải làm rồi.

## Đã làm (luồng N1, SPEC thuần — có test)

- Type `NestedClip` (kind `"nested"`) + mở rộng union `Clip` trong
  `index.ts`: `id`, `subSpec` (VideoSpec con), `start`/`duration` trên
  timeline ngoài, `trim` `{ in, out }`, `speed`, `name?`.
  - `start` = vị trí timeline ngoài (tức "timelineStart" trong yêu cầu);
    `duration` PHẢI bằng `nestedDuration()` = (trim.out − trim.in) / speed.
- Hàm thuần: `isNestedClip`, `nestedSourceDuration`,
  `nestedEffectiveSpeed`, `nestedEffectiveTrim`, `nestedDuration`,
  `validateNestedClip` (trả danh sách lỗi, không throw với input xấu),
  `flattenNested` (trả `FlatClip[]`: clip lá gốc + `absoluteStart`,
  `absoluteDuration`, `path`, `depth`).
- Test: `nested.test.ts` — **37/37 pass** (`tsc` sạch, `node --test`),
  mirror `nested.js` đã kiểm chứng chạy độc lập với cùng các case cốt lõi
  (duration, validate, flatten 2 tầng, vòng lặp, độ sâu).
- Backward compat: project cũ không có clip kind `"nested"` load bình
  thường — union mở rộng là additive-only, không đổi shape clip cũ
  (có test chứng minh: `isNestedClip` = false với mọi clip cũ, JSON
  round-trip giữ nguyên).

## Giới hạn cứng (đã implement + test)

- **Độ sâu tối đa `MAX_NESTED_DEPTH = 8`** (clip nested ngoài cùng = tầng 1).
  Vượt → `validateNestedClip()` trả lỗi, `flattenNested()` throw `Error`.
  Không có cơ chế "cắt bớt cho vừa" — fail fast, không lặng lẽ bỏ tầng.
- **Vòng lặp tham chiếu → lỗi/throw.** Phát hiện bằng identity của
  `subSpec` theo chuỗi tổ tiên (kể cả tự tham chiếu trực tiếp A chứa A
  và gián tiếp A → B → A). Dùng lại CÙNG `subSpec` object ở hai clip
  ANH EM là HỢP LỆ (đó chính là tính năng "dùng lại nhiều lần").
  - Lưu ý: vòng lặp chỉ tồn tại với object graph trong bộ nhớ. File JSON
    không biểu diễn được tham chiếu vòng nên project lưu đĩa không bao giờ
    có cycle; sau `JSON.parse`, reuse bằng identity sẽ thành reuse bằng
    nội dung (mỗi clip mang một bản copy của subSpec).
- **Clip lá bị trim ngoài cắt hết (giao rỗng) thì bị BỎ khỏi kết quả
  flatten** — đó là hành vi đúng, không phải lỗi, không throw.
- `validateNestedClip()` chỉ kiểm tra NÔNG clip lá (có `kind`, `start >= 0`,
  `duration > 0`); nó KHÔNG validate sâu từng kind lá (filter, effects,
  keyframes, mask, caption…) — việc đó thuộc về validator riêng của từng
  kind / render worker.

## Chưa hỗ trợ (SPEC xong, editor/preview/render CHƯA làm)

- **Preview, render worker, Timeline, Inspector CHƯA biết đọc kind
  `"nested"`.** Hiện tại nested clip chỉ tồn tại ở tầng spec + toán
  thuần. Hành vi của render worker khi gặp kind lạ CHƯA được kiểm chứng
  trong luồng này — luồng render phải quyết định (bỏ qua kèm cảnh báo
  hay mở phẳng rồi render) trước khi user dùng nested clip thật.
- **Transition qua biên nested clip: CHƯA hỗ trợ.** `NestedClip` không có
  `transitionIn`/`transitionOut`; nối hai nested clip bằng xfade chưa có
  ngữ nghĩa định sẵn.
- **Audio trong subSpec: flatten chỉ tính VỊ TRÍ, không xử lý tiếng.**
  Clip audio lá được mở phẳng kèm `absoluteStart`/`absoluteDuration`
  như clip hình, nhưng không có mix/downmix, không map lại `volume`,
  `fadeIn`/`fadeOut`, `audioEffects` theo trim ngoài. Audio leaf bị trim
  ngoài cắt dở vẫn giữ nguyên fade gốc — consumer phải tự xử lý.
- **`flattenNested()` KHÔNG viết lại nội dung clip lá (placement-only).**
  Entry trả về giữ nguyên tham chiếu clip gốc: `in`/`out`, keyframes,
  `speedKeyframes`, fade, volume đều KHÔNG được remap theo trim/tốc độ
  của các tầng ngoài. Muốn render từ bản phẳng, consumer phải tự map
  offset media (với clip video/audio: `in` mới = `in` cũ + độ lệch
  timeline × speed của lá). Đây là giới hạn lớn nhất của flatten hiện tại.
- **Tốc độ chỉ là hằng số.** Nested clip không có `speedKeyframes`
  (speed ramp cho cả subSpec) và không có `reverse`.
- **Không có opacity riêng cho compound clip.** Muốn mờ dần toàn bộ
  nested clip phải đặt opacity từng lá bên trong (hoặc đợi luồng sau thêm
  field + implement ở render).
- **fps/kích thước subSpec khác project ngoài: KHÔNG validate, hành vi
  render chưa định nghĩa.** `validateNestedClip()` chỉ kiểm tra
  `meta.width/height/fps > 0`, không so sánh với meta ngoài. SubSpec
  60fps đặt trong project 30fps sẽ cần resample ở tầng render (chưa làm).
- **Track chứa nested clip:** validator mức clip không cấm track nào,
  nhưng chỉ track video mới có ý nghĩa hiển thị. `flattenNested()` bỏ qua
  `muted`/`hidden` của track (nó là toán thời gian thuần) — render/preview
  phải tự áp dụng mute/hide khi tiêu thụ kết quả flatten.
- **Đặt tên:** `name` là optional; không có tên thì UI phải tự fallback
  (gợi ý: "Compound clip" hoặc id). Xem key i18n đề xuất bên dưới.

## Key i18n đề xuất (CHƯA thêm vào file i18n json — parent merge sau)

Luồng N1 KHÔNG được sửa i18n json theo phân công. Khi luồng UI làm tới
nested clip, cần các key sau (tên gợi ý, chưa tồn tại):

- `editor.nested.title` — "Compound clip" / "Sequence lồng nhau"
- `editor.nested.untitled` — tên fallback khi clip không có `name`
- `editor.nested.error.depthExceeded` — vượt độ sâu tối đa 8 tầng
- `editor.nested.error.cycleDetected` — vòng lặp tham chiếu subSpec
- `editor.nested.error.emptySubSpec` — subSpec rỗng
- `editor.nested.error.durationMismatch` — duration không khớp
  (trim.out − trim.in) / speed
- `editor.nested.error.trimOutOfRange` — trim.out vượt độ dài subSpec
- `editor.nested.error.unsupportedInRender` — render/preview chưa hỗ trợ
  nested clip (dùng tới khi render worker biết xử lý kind này thì bỏ key)

## Cách chạy test lại

```bash
cd packages/video-spec
npx tsc src/nested.ts src/nested.test.ts --outDir /tmp/nested-test \
  --module nodenext --target es2022 --moduleResolution nodenext --skipLibCheck
node --test /tmp/nested-test/nested.test.js
# Kỳ vọng: tsc exit 0, 37 pass / 0 fail.
```

## File của luồng N1 (tương đối từ repo root)

- `packages/video-spec/src/nested.ts` (mới)
- `packages/video-spec/src/nested.js` (mới, mirror theo DEVELOPER.md §4)
- `packages/video-spec/src/nested.test.ts` (mới)
- `packages/video-spec/src/index.ts` (sửa: thêm export nested + NestedClip vào union Clip)
- `packages/video-spec/src/index.js` (sửa: 1 dòng export mirror cho khớp index.ts)
- `packages/video-spec/src/NESTED_LIMITS.md` (mới, chính file này)

Không đụng tới: i18n json, Timeline.tsx, preview.tsx, render.js,
build-loop-log, paths-loop (theo phân công; parent merge paths sau).
