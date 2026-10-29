# U2_LIMITS.md — Thống nhất ngữ nghĩa nested / adjustment (Phase 9 đợt 7, luồng U2)

Phạm vi: CHỈ phía render worker (`server/render/src/`). Mọi định nghĩa
dưới đây là **render-side** cho đến khi luồng spec/UI (U1) khớp ngược vào
`packages/video-spec` và UI — xem §7 (việc còn chờ parent khớp).

## 1. Chuẩn ngữ nghĩa (đợt 7)

- `VideoSpec.adjustmentLayers` cấp project là chuẩn duy nhất ở phía render.
  Thứ tự mảng = thứ tự áp: layer sau áp sau (ở ngoài cùng của chuỗi filter).
- Field tùy chọn `tracks?: number[]` trên mỗi layer:
  - Vắng field = áp mọi track video.
  - Có field = CHỈ áp clip thuộc track trong scope; clip ngoài scope giữ
    nguyên chuỗi pixel 100% và KHÔNG dính các cổng fail fast của layer đó
    (transition, speedKeyframes, animations, motion track, stabilize, mask
    keyframes — các cổng ở `render.js` chỉ xét đoạn đã tách theo scope).
  - `tracks: []` (rỗng) là LỖI (fail fast), không phải "không áp track nào":
    muốn áp mọi track thì bỏ field.
  - Phần tử phải là số nguyên >= 0, không trùng; vượt quá số track của
    spec đang xét là LỖI (validate.js kiểm tra với spec đầy đủ, nested.js
    kiểm tra với từng project con).
- **Chỉ số track tính theo spec ĐÃ FLATTEN** (thứ tự `spec.tracks` mà
  `render.js` dựng graph). Đây là điểm bắt buộc phải ghi rõ: flatten chèn
  track mới sau track chứa nested clip nên chỉ số của track gốc sau điểm
  chèn sẽ dịch chuyển. Bên trong flatten, scope được mang bằng **track id
  (lineage)** rồi mới đổi về chỉ số cuối ở `flattenSpecForRender` — nên
  project tác giả viết theo chỉ số track gốc vẫn đúng sau khi flatten
  (xem §3). Spec không có nested clip thì chỉ số flatten = chỉ số gốc,
  không có gì phải lo.

## 2. Legacy UI shape kind "adjustment" → project layer

Legacy shape (UI, `apps/web/src/components/nested/nestUtils.ts` — luồng U2
KHÔNG sửa file này): bản ghi `{ kind: "adjustment", id, start, duration,
filterType, intensity }` trong `track.clips`, hoặc biến thể có `filters`
sẵn, hoặc bọc trong `adjustment: { filters | filterType }`.

`normalizeLegacyAdjustmentLayers()` (trong `adjustment.js`, gọi từ `main()`
của `render.js` TRƯỚC flatten và TRƯỚC validate):

| Đầu vào legacy | Project layer sau normalize |
|---|---|
| `filterType` + `intensity` | `filters: [{ effects: [{ type: filterType, intensity }] }]` (intensity vắng thì bỏ qua để effects dùng mặc định) |
| `filters` sẵn có (trên clip hoặc trong `adjustment`) | dùng thẳng |
| `adjustment: { filterType, intensity }` | như dòng filterType |
| không có filters lẫn filterType | THROW (không đoán hiệu ứng) |
| `filterType` không trong EFFECT_TYPES | THROW ở normalize (qua `validateEffects`), không đợi FFmpeg báo lỗi khó hiểu |
| trùng id với project layer đã có / legacy khác | THROW |

- Scope của layer chuyển đổi: `tracks: [chỉ số track chứa legacy clip]`
  (theo đúng quyết định của parent cho đợt 7).
- Thứ tự: project layer đã có giữ nguyên trước, layer chuyển đổi nối sau
  (legacy áp sau = ở ngoài cùng so với project layer cùng thời gian).
- Legacy clip bị GỠ khỏi `track.clips` nên validate/flatten không còn thấy
  nó; spec không có legacy thì normalize không đổi gì.
- Normalize đệ quy vào `subSpec`/`nested` của clip lồng nhau (sâu tối đa 8
  cấp, khớp `NESTED_MAX_DEPTH`); legacy trong project con thành
  `adjustmentLayers` của project con đó rồi đi qua đường thu thập ở §3.
- CẢNH BÁO cho parent/U1 (§7): UI ghi "layer áp cho mọi clip bên dưới"
  còn normalize đợt 7 gán scope = đúng track chứa legacy clip. Hai ngữ
  nghĩa "bên dưới" (theo thứ tự xếp chồng) và "cùng track" chưa được đối
  chiếu — parent cần chốt trước khi UI dựa vào scope này.

## 3. Layer trong project con (subSpec) — thu thập khi flatten

Trước đợt 7, `flattenSpecForRender` chỉ lấy `flatSub.tracks` nên
`adjustmentLayers` của project con bị bỏ qua LẶNG LẼ. Từ đợt 7:

- **Thời gian:** giao cửa sổ nested rồi ánh xạ tuyến tính như clip:
  `start' = win.start + (vs - win.in) / win.speed`,
  `duration' = (ve - vs) / win.speed`, với `[vs, ve)` là giao của
  `[layer.start, layer.start + duration)` với cửa sổ
  `[win.in, win.in + win.duration * win.speed)`. Layer nằm ngoài cửa sổ
  hoàn toàn → bỏ + warning + `stats.droppedLayers` tăng (không render sai).
- **Scope:** layer không scope trong project con chỉ áp cho track lá sinh
  ra từ CHÍNH clip lồng nhau đó (không lan sang clip ngoài cùng thời gian
  — clip ngoài không nằm trong tập track lá của đợt mở rộng đó).
  Layer có scope `tracks` trong project con được dịch qua lineage:
  chỉ số → track id của project con → (khi mở rộng) track lá mới, trong đó
  lineage của một track bao gồm chính nó CỘNG mọi track lá sinh ra từ clip
  lồng nhau trên chính track đó. Nhờ vậy layer của level cha áp cho track
  đó sẽ áp cả clip phẳng lẫn nội dung nested trên cùng track (đã có test
  unit §C4 chứng minh).
- **Thứ tự áp: TRONG trước, NGOÀI sau.** Layer của project con sâu nhất
  nối trước, layer của level cha nối sau. Đã chứng minh bằng render thật
  (§5, test §G): nested (trong brightness, ngoài contrast) khớp từng pixel
  với project phẳng `[brightness, contrast]` và lệch 43.613 với phẳng đảo
  thứ tự `[contrast, brightness]`.
- **Field nội bộ:** trong lúc flatten, layer mang `_scopeTrackIds`
  (null = mọi track của level nó sinh ra, hoặc mảng track id). Field này
  bị lược bỏ trước khi `flattenSpecForRender` trả về; layer cuối cùng chỉ
  có `tracks` (chỉ số trong spec phẳng cuối) hoặc không có field tracks.
- **Giữ nguyên hành vi cũ:** spec phẳng không có layer và không có nested
  thì flatten ra chính nó (không chèn field `adjustmentLayers` rỗng);
  spec có layer nhưng không nested thì flatten giữ nguyên thứ tự và scope
  (chỉ số không đổi vì không có track mới chèn vào).

## 4. Fail fast (không render sai lặng lẽ)

Mới trong đợt 7 (ngoài các cổng R1 sẵn có):

- Trùng id layer giữa project con và ngoài (kể cả giữa hai project con) →
  throw `trùng id adjustment layer "..."` ở flatten; qua CLI thành exit 1.
- Scope `tracks` vượt quá số track của project con → throw ở flatten;
  vượt quá số track của spec đang validate → lỗi ở `validate.js`.
- Layer sai shape trong project con (qua `validateAdjustmentLayer`) →
  throw ở flatten, không đợi validate cấp ngoài.
- Legacy không chuyển đổi được (thiếu filter, filterType lạ, trùng id) →
  throw ở normalize, exit 1, message nhắc "legacy adjustment".

Kế thừa từ R1 (vẫn bắt sau khi flatten, vì layer thu thập đi qua đúng
đường đó): layer giao clip dính xfade; layer cắt giữa clip có
speedKeyframes / animations keyframes / motion track / stabilize / mask
keyframes. Lưu ý: các cổng này chỉ xét layer TRONG scope của clip (nhờ
`splitClipByLayers(clip, layers, trackIndex)`), nên layer scope track khác
không làm clip dính transition fail oan.

## 5. Số đo thật (test_nested_adjustment_unify.js, 55/55)

Render thật: MP4 320x240, fps 10, nguồn testsrc2, so frame bằng
mean abs diff / kênh / pixel (thang 0..255). "Giữ nguyên" = mean < 1.5
(chỉ nhiễu dự đoán liên frame của x264 — chuỗi filter đoạn ngoài layer
giữ nguyên 100%, xem ADJUSTMENT_LIMITS.md).

- Legacy UI layer (grayscale, [2,4)): t=1 mean 0.118, t=3 mean 105.281,
  t=5 mean 0.622.
- Layer trong subSpec (nested [2,6), layer con [1,3) → vùng ngoài [3,5)):
  t=2.5 mean 0.515, t=4 mean 77.079, t=5.5 mean 0.806.
- Scope: tracks=[1] → t=1 (track 0) 0.327, t=4 (track 1) 77.633;
  tracks=[0] → t=1 77.065, t=4 0.744.
- Thứ tự: nested (trong bright, ngoài contrast) vs phẳng [bright,contrast]
  t=2 mean 0.000; vs phẳng đảo [contrast,bright] mean 43.613.
- Fail fast qua CLI: trùng id (stderr nhắc "trùng id"), scope vượt range,
  legacy filterType lạ (stderr nhắc "legacy") — cả ba đều exit != 0.

Phát hiện phụ (ghi lại để khỏi test sai lần sau): cặp brightness +
grayscale GIAO HOÁN thật trong FFmpeg — `eq` brightness chỉ đụng luma Y,
`hue=s=0` chỉ đụng chroma — nên cả hai thứ tự cho mean = 0.000. Vì vậy
test thứ tự phải dùng cặp không giao hoán (brightness/contrast, cả hai
đụng Y, contrast scale quanh điểm giữa). Test §G đã sửa sang cặp này.

## 6. Giới hạn còn tồn tại (trung thực)

- Layer scope trỏ tới track video bị `hidden`: render bỏ qua track đó
  (không áp gì) nhưng `validate.js` vẫn tính track đó khi cảnh báo
  "không layer nào giao clip video" — cảnh báo có thể thiếu chính xác
  trong trường hợp này (không fail, chỉ cảnh báo).
- Layer trong project con áp cho clip lá mang fade transition qua biên
  (opacity keyframes) hoặc opacity kế thừa: cả hai đều áp (adjChain ở tầng
  clip, opacity ở tầng đặt timeline) — chưa có test render đo thứ tự
  tương tác này, chỉ có cổng fail fast khi layer CẮT GIỮA clip có
  animations keyframes (trong đó có fade biên).
- Layer scope tới track audio: vô tác dụng (adjustment chỉ áp video) —
  không báo lỗi, chỉ cảnh báo chung nếu không layer nào giao clip video.
- Spec TS (`packages/video-spec/src/adjustment.ts`) CHƯA có field
  `tracks` (luồng U2 bị cấm sửa `packages/video-spec/src/*`) — xem §7.
- Tương tác layer với ducking/audio: không có (adjustment là video-only).
- Normalize chỉ chạy ở entry `main()` của `render.js`. Ai gọi thẳng
  `validateSpec`/`flattenSpecForRender` với spec còn legacy clip sẽ vẫn
  gặp lỗi kind lạ — đó là hành vi cố ý: normalize là trách nhiệm của
  render entry, không phải của validator.

## 7. Việc còn chờ parent / luồng khác khớp (KHÔNG tự làm thêm)

1. Thêm `tracks?: number[]` vào type TS của adjustment layer
   (`packages/video-spec/src/adjustment.ts` + mirror) và khớp ngữ nghĩa
   "chỉ số theo spec đã flatten" với tài liệu spec — hiện tại chỉ phía
   render hiểu field này; project viết tay có `tracks` mà đi qua validate
   TS cũ sẽ bị coi là field lạ.
2. Chốt ngữ nghĩa UI "layer áp cho clip bên dưới" (theo thứ tự xếp chồng)
   so với normalize đợt 7 (scope = track chứa legacy clip) — xem §2.
   Tùy kết quả chốt, normalize có thể phải đổi thành scope = các track
   dưới host track, hoặc UI phải đổi cách lưu legacy clip.
3. Preview (`nestedPreview.ts`) chưa được luồng U2 sửa (ngoài phạm vi) —
   preview vẫn dùng shape cũ nên project có scope/subSpec layer có thể
   hiển thị khác render cho đến khi luồng preview khớp.
4. File workflow CI (`ci-security.yml`) vẫn chưa lên GitHub (403 quyền,
   nợ cũ từ đợt 6) — không liên quan đợt 7 nhưng repo vẫn không có CI
   chạy thật; không claim ngược lại.

## 8. Kiểm chứng đợt 7 (luồng U2, chạy lại toàn bộ)

- Mới: `server/render/test_nested_adjustment_unify.js` — 55/55.
- Hồi quy: `test_adjustment_render.js` 39/39, `test_adjustment.js` 46/46,
  `test_adjustment_spec.js` 21, `src/test_nested_render.js` 24/24,
  `src/test_nested_r3.js` 43/43, `src/test_nested_e2e.js` 28/28,
  `src/adjustment.js --self-test` OK (gồm assert scope + normalize mới).
- KHÔNG push GitHub, KHÔNG release/tag, KHÔNG binary (toàn bộ file đổi
  thêm đều là text).
