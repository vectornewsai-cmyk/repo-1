# Phase 9 đợt 20 — R3: Preview rescale dưới ramp + validator biết curve-nested — LIMITS

Ngày: 2026-10-29. Luồng preview/validator của đợt 20.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG tạo file stage
paths-loop (parent gộp batch), KHÔNG sửa build-loop-log.md.

Đóng nợ đợt 19 G1 §3 + đợt 19 G2 §3 (transition T chưa rescale sang
τ(X)−τ(X−T), fade audio giữ nguyên thời gian con, attachment chưa nội
suy qua τ, bezier/ease-out/tốc độ biên chỉ bao bởi engine chung).

## 1. Việc đã làm

### 1a. Rescale thời lượng transition/fade nội bộ — flattenNested

Vấn đề gốc (đợt 19 G1 §3): `flattenNested` giữ nguyên thời lượng con
`T` trên clip lá đã phẳng, trong khi lá sống ở thời gian output.
Sửa trong `apps/web/src/lib/nestedPreview.ts`, áp dụng ĐỒNG NHẤT cho
cả đường ramp lẫn đường tốc độ hằng (lỗi tồn tại ở cả 2 đường, xem §3):

- **Fade biên (nested ctx fadeIn/fadeOut → opacity keyframes):**
  `T'` = `map(X) − map(X−T)` với `map` là map của tầng cha, `X` là biên
  (placeLo cho fadeIn, placeHi cho fadeOut). Ramp + map cha identity →
  đúng `τ(X−in) − τ(X−T−in)` của spec đợt 18 §4; tốc độ hằng → rút gọn
  đúng `T/speed`; map cha phi tuyến (ramp tổ tiên) → đúng thời lượng
  output của đoạn chồng lấn đó.
- **shiftIn gộp vào placement (sửa cùng lỗi, dạng vị trí):** trước đây
  `outerStart = childMap(cLo) − shiftIn` trừ T thời gian cha khỏi thời
  gian ngoài — sai khi map cha co/giãn (kể cả tốc độ hằng ≠ 1: trừ T
  thay vì T/speed). Nay childMap dựng từ `placeLo − shiftIn` nên mọi
  lá, nested con đệ quy và adjustment đều dịch đúng qua ánh xạ. Map
  identity ở tầng ngoài → đúng bằng hành vi cũ (hồi quy R3 17/17 giữ
  nguyên).
- **Transition nội bộ cặp phẳng (lá–lá trên track con):** cặp nguyên
  vẹn (kề nhau + cả 2 đầu nằm trọn trong cửa sổ) → viết lại duration
  mỗi phía theo duration của chính nó: `T' = childMap(X) − childMap(X−T)`
  với `X` = đầu clip B (mirror render §4, lệch cặp vẫn lộ ra ở validator
  phẳng thay vì bị giấu). Cặp bị cửa sổ phá vỡ (một đầu bị cắt, mất
  hẳn, hoặc không kề nhau) → strip field transition của cặp đó (render
  hard cut). Clone field trước khi sửa duration — preview không sửa
  spec gốc.
- **Phía lá phẳng của cặp biên:** `resolvePreviewBoundaries` nay trả
  thêm `stripOut` (đầu trái phẳng của cặp biên, mirror
  `resolveTrackBoundaries.stripOut` của render); flatten strip
  `transitionOut` của phía đó và strip `transitionIn` của lá phẳng bị
  `plainShift` dịch sớm. Trước đây preview giữ 2 field này khiến
  `transitionClipVisual` vẽ trùng với fade biên. Chỉ áp trong
  `flattenNested` (lá trong nested); tầng ngoài giữ nguyên hành vi cũ
  (xem §3).

### 1b. Fade audio dưới ramp + tốc độ hằng — flattenNested

`fadeIn' = max(0, fadeIn − cắtTráiOuter)`,
`fadeOut' = max(0, fadeOut − cắtPhảiOuter)` với cắt đo bằng thời gian
output qua childMap (mirror render đợt 18 §4): tốc độ hằng rút gọn đúng
`leftCut/speed` cũ; ramp dùng τ với ngoại suy tuyến tính theo tốc độ
biên ngoài `[0, C]` — phần cắt trái luôn nằm trước `in` (đo bằng
`speedAt(0)`), phần cắt phải luôn nằm sau `in + C` (đo bằng
`speedAt(D)`). Giữ nguyên `fadeInCurve`/`fadeOutCurve` (chỉ đổi duration,
đúng "giữ hình dạng fade"). Trước đây preview không rescale fade ở
đường nào (lá bị cửa sổ cắt vẫn giữ fade đủ) — sửa cả 2 đường.

### 1c. Attachment thời gian dưới ramp — GIỮ FAIL-FAST (có lý do)

KHÔNG nội suy `animations`/`track`/`karaoke`/`volumeKeyframes` qua τ.
Phân tích (đã kiểm chứng trên code preview thật, không đoán):

- Keyframe nội suy (`animations` opacity/x/y/scale/rotation,
  `volumeKeyframes`, `track` points) mang easing riêng; preview đánh
  giá bằng `interpolateKeyframes` (nội suy theo easing từng đoạn,
  `packages/video-spec/src/keyframes.ts`). Qua τ phi tuyến, đường cong
  thật là easing∘τ — KHÔNG biểu diễn được bằng keyframe đã remap thời
  gian giữ nguyên easing (ví dụ: easing linear + τ phi tuyến cho ra
  chính τ, không phải đoạn thẳng nối 2 đầu đã remap). Schema lá phẳng
  không có trường time-warp; chỉ resample dày mới xấp xỉ được, đó là
  xấp xỉ chứ không phải nội suy chính xác — vi phạm luật "không phẳng
  lệch" nếu claim là xong.
- Keyframe ngoài đoạn khả kiến còn cần đánh giá easing-aware tại biên
  cửa sổ để chèn keyframe biên — cùng vấn đề hợp thành ở trên, không
  có đáp án chính xác bằng remap thời gian.
- Render vẫn từ chối toàn bộ các trường hợp này (spec đợt 18 §5) nên
  preview chấp nhận sẽ lệch render theo hướng ngược lại (preview được
  mà render không được) — đó là quyết định sản phẩm, không lặng lẽ mở
  trong luồng parity này.
- Karaoke là trường hợp duy nhất remap được CHÍNH XÁC ở mức preview
  (từng từ đổi màu theo ngưỡng `localT >= word.start`, không nội suy
  giữa các từ) — nhưng render cũng từ chối karaoke dưới ramp nên vẫn
  giữ fail-fast cùng lý do trên; nếu parent muốn mở preview-ahead cho
  karaoke thì đó là quyết định riêng, cần làm ở đợt khác.

Hành vi cũ giữ nguyên: lá mang attachment thời gian dưới ramp vẫn
throw với message rõ (test fail-fast cũ giữ nguyên, không sửa).

### 1d. Case flatten riêng cho bezier / ease-out / tốc độ biên

Thêm vào `apps/web/src/lib/nestedRampPreview.test.ts` (13 case cũ giữ
nguyên, thêm 11 case → 24 test):

- bezier `[0,0,1,1]` đồng nhất linear: τ(3) = 2.3246 như linear 1→2
  (đồng nhất toán học y = x, đi qua nhánh bezier thật của engine).
- bezier CSS ease `[0.25,0.1,0.25,1]`: τ(1) = 0.8830, τ(4)−τ(1) = 1.7631
  — giá trị lấy từ đối chiếu trực tiếp render worker
  (`server/render/src/nested.js` `_mapChildOffset`, script tạm
  `/tmp/r3_bezier_crosscheck.ts`): lệch 0 trên 9 điểm + 1 interval.
- ease-out 1→2 giải tích: τ(3) = 2.0946, slice v cuối 1.7731.
- linear 0.25→4 (tốc độ biên): τ(3) = 2.2772, slice v 0.25→2.3849,
  lá phủ đủ C = 8.5 → duration 4 (tích v·c chạm biên nhưng trong khoảng
  nên không throw).
- (a): fadeIn biên dưới ramp 1s con → 0.7579s output + lá dịch đúng
  τ(1); fadeOut biên dưới ramp keyframes 0.8990→1.6569 + strip
  transitionIn phía B; cặp phẳng nội bộ dưới ramp 1s con → 0.7579s cả
  2 phía; cặp bị cửa sổ cắt → strip cả 2 phía; đường tốc độ hằng
  speed 2: fade biên + cặp phẳng 1 → 0.5, lá dịch sớm đúng 0.5 (không
  phải trừ 1 sau ánh xạ như code cũ).
- (b): fade audio dưới ramp (cắt trái/phải qua τ ngoại suy biên),
  fade audio đường tốc độ hằng (cắt trái 1 → 0.5).

### 1e. Validator biết curve-nested — packages/video-spec/src/nested.ts

- `NestedClip` thêm field `speedKeyframes?: SpeedCurve` (kèm doc ngữ
  nghĩa render đợt 18 §2); doc `nestedDuration()` ghi rõ chỉ đúng cho
  clip không curve.
- `validateNestedClip` (đệ quy mọi tầng): nested có curve thì
  - validate hình dạng curve theo đúng luật clip ramp thường
    (1–128 keyframe, t ∈ [0, D], v ∈ [0.25, 4], easing hợp lệ, bezier
    x1, x2 ∈ [0, 1]) — helper mới `validateNestedSpeedCurveShape`;
  - KHÔNG kiểm tra `(out − in)/speed` nữa; thay vào đó, nếu ghi trim
    đủ in/out hữu hạn và out > in thì kiểm tra
    `trim.out = trim.in + ∫curve` (sai số 1e-4; curve hằng: 1e-6 với
    `duration × v`, đúng preview normalize + render §1.3). Không có
    trim → không kiểm tra gì thêm (cửa sổ con kết thúc tại in + ∫
    theo định nghĩa).
  - Curve lỗi hình dạng → chỉ báo lỗi shape, không báo thêm duration
    (tránh nhiễu); `speed` hằng (nếu ghi) vẫn phải trong [0.25, 4]
    như luật cũ (render dùng curve nhưng speed vẫn phải hợp lệ).
- Clip thường (không curve) giữ nguyên kiểm tra cũ, không nới lỏng
  (test "thường lệch vẫn lỗi" + test cũ duration mismatch giữ nguyên).
- Mirror tay `packages/video-spec/src/nested.js` cập nhật tương ứng
  (quy ước DEVELOPER.md §4: không có bước build tự động cho video-spec;
  import runtime duy nhất là `./speedcurve.js`, module này không import
  gì nên không tạo vòng lặp). `nested.ts` import runtime từ
  `./speedcurve.js` (không phải từ `index.js`, đúng luật chống vòng
  lặp runtime của file này).
- Test validator mới trong `packages/video-spec/src/nested.test.ts`
  (10 test): curve hợp lệ, trim.out lệch ∫, không trim, curve hằng
  hợp lệ + lệch, shape lỗi (v = 5, không báo duration nhiễu), bezier
  [0,0,1,1] đồng nhất linear, bezier ease trim lệch, nested con mang
  curve (đệ quy), clip thường lệch vẫn lỗi.

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| `nestedRampPreview.test.ts` (mới) | **24/24 pass** (13 cũ + 11 mới) |
| `nestedPreview.test.ts` | 46/46 |
| `nestedPreviewR3.test.ts` | 17/17 |
| `nestedUnify.test.ts` | 12 proven (2 PENDING nợ cũ R6, không tính) |
| `previewEngine.test.ts` | 14/14 |
| `nestedDemo.test.ts` | 8/8 |
| `transitionPreview.test.ts` | 26/26 |
| `nestedStore.test.ts` (dùng validateNestedClip) | 11/11 |
| `nestedStore.store.test.ts` (esbuild bundle theo header) | 8/8 |
| `nested.test.ts` video-spec (tsc theo header file) | **59/59, tsc 0 lỗi** |
| Mirror tay `nested.js` (script `/tmp/r3_mirror_check.mjs`, 6 case) | pass |
| Crosscheck bezier preview vs render (`/tmp/r3_bezier_crosscheck.ts`) | lệch 0 |
| `tsc --noEmit` (apps/web) | **0 lỗi** (2 lỗi luồng khác ở đợt 19 nay đã hết — luồng đó tự sửa) |
| `vite build` (apps/web) | pass, 4.33s |

Lưu ý kiểm chứng: kỳ vọng fade audio ban đầu (fadeIn 2 − τ(2) = 0.3431)
từng sai — phần cắt trái nằm trước `in` nên đo bằng tốc độ biên
ngoại suy (2/1 = 2), không phải τ trong vùng cong. Đã sửa kỳ vọng
theo công thức render §4 và đối chiếu lại; code flatten không đổi
trong lần sửa đó. Tương tự, 1 kỳ vọng tay trong script mirror (duration
clip thường) từng sai số học — sửa script, không sửa code.

## 3. Giới hạn trung thực — những gì CHƯA xong / chưa sạch

- **(c) attachment thời gian dưới ramp vẫn fail-fast** (xem §1c):
  cần render hỗ trợ trước (hoặc quyết định preview-ahead riêng cho
  karaoke) rồi mới mở phía preview; resample dày chỉ là xấp xỉ, không
  được claim là nội suy chính xác.
- **Cặp biên ở TẦNG NGOÀI chưa strip:** `flattenForPreview` vẫn giữ
  `transitionOut` của lá phẳng đầu trái cặp biên và `transitionIn`
  của lá phẳng bị `plainShift` (chỉ strip trong `flattenNested` cho lá
  trong nested — đúng phạm vi "flattenNested" của brief). Cùng lỗi
  nhưng ở tầng ngoài; cần đợt riêng nếu muốn sửa (cẩn thận: strip ở
  tầng ngoài phải copy clip trước khi xóa field, hiện code tầng ngoài
  có nhánh giữ nguyên object gốc).
- **Hai tầng đều có curve vẫn bị từ chối** (throw, đúng render):
  nợ mở từ đợt 18, không thuộc brief này.
- **Lá reverse dưới ramp vẫn bị từ chối** (throw, đúng render).
- **Preview chưa có click-test browser cho nested ramp** (nợ cũ từ
  đợt 19 G1 §3, chỉ kiểm chứng ở mức flatten + crosscheck render).
- **`flattenNested` của video-spec (placement-only) chưa biết curve:**
  validator đã chấp nhận nested curve nhưng `flattenNested()` trong
  `nested.ts` vẫn ánh xạ tuyến tính theo `speed` (mặc định 1 khi chỉ
  có curve) — placement sai cho clip curve; sửa flatten spec là việc
  riêng, không thuộc brief validator này.
- **Store/UI chưa theo spec §2** (chế độ duration-cố-định /
  trim-cố-định khi patch curve): thuộc luồng store/UI, preview chỉ
  validate khớp ở normalize/flatten (throw khi lệch).
- `apps/web/dist/` đã được `vite build` viết lại trong lúc kiểm chứng
  — output build có sẵn từ trước, KHÔNG đưa vào batch stage (parent
  chỉ stage các file text ở §4).

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/lib/nestedPreview.ts`: rescale fade biên qua map cha +
  gộp shiftIn vào placement; cặp phẳng nội bộ (rescale khi nguyên vẹn,
  strip khi vỡ); `stripOut` từ `resolvePreviewBoundaries` + strip phía
  lá phẳng của cặp biên; fade audio rescale theo cắt output; ghi chú
  quyết định giữ fail-fast cho attachment (§1c).
- `apps/web/src/lib/nestedRampPreview.test.ts`: 11 case mới (bezier ×2,
  ease-out, tốc độ biên 0.25→4, fade biên ×2, cặp phẳng ×2, tốc độ hằng,
  fade audio ×2); 13 case cũ giữ nguyên, không xóa case nào.
- `packages/video-spec/src/nested.ts`: field `speedKeyframes` trên
  `NestedClip`, helper `validateNestedSpeedCurveShape`, nhánh curve
  trong `validateNestedRec` (trim.out = in + ∫curve), doc
  `nestedDuration()` + interface.
- `packages/video-spec/src/nested.js`: mirror tay tương ứng (helper +
  nhánh curve + import `./speedcurve.js` + ghi chú header).
- `packages/video-spec/src/nested.test.ts`: 10 test validator mới
  (const `LINEAR_1_2` annotate type để tsc sạch).
- `docs/PHASE9_ROUND20_R3_PREVIEW_RESCALE_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình):
- `apps/web/src/store.ts`, `apps/web/src/components/nested/nestUtils.ts`,
  `server/render/src/nested.js` (render worker), file i18n, test/harness
  của luồng khác, file stage trong `~/workspace/repo-1-push/paths-loop/`,
  `build-loop-log.md` (parent gộp/log).
- Không push, không tag/release, không ghi qua GitHub, không binary.
