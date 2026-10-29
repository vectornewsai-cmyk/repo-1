# Phase 9 đợt 19 — G1: Preview parity cho nested speedKeyframes — LIMITS

Ngày: 2026-10-29. Luồng preview của đợt 19.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG tạo file stage
paths-loop (parent gộp batch).

Đóng nợ đợt 18 (`PHASE9_ROUND18_NESTED_SPEED_LIMITS.md` §3):

> "Preview web chưa có parity: `previewEngine` vẫn ánh xạ nested
> theo đường cũ; preview của nested ramp sẽ lệch với render."

## 1. Việc đã làm

### 1a. Ngữ nghĩa (mirror render đợt 18, không tự định nghĩa lại)

- Duration của nested có curve là thời gian OUTPUT; cửa sổ con là
  `[in, in + C)` với `C = ∫₀ᴰ s(τ) dτ` (spec đợt 18 §2).
- Vị trí con tại thời gian output `t`: `u(t) = in + ∫₀ᵗ s`; ánh xạ
  ngược `τ(w)` là nghiệm của `∫₀^τ s = w`, chia đôi 80 vòng, ngoại
  suy tuyến tính theo tốc độ biên ngoài `[0, C]` (chỉ dùng cho phát
  hiện cắt/fade, không dùng cho đoạn khả kiến) — đúng
  `mapChildOffset` của `server/render/src/nested.js`.
- Curve hằng (mọi keyframe cùng `v`, kể cả bezier overshoot) gộp
  CHÍNH XÁC về tốc độ hằng `v`, đi đường tuyến tính cũ.
- `trim.out` của nested ramp phải khớp `in + ∫curve` (sai số 1e-4
  như render; curve hằng thì 1e-6 như đường tốc độ hằng).

### 1b. Triển khai (`apps/web/src/lib/nestedPreview.ts`)

- `TimeMap` tổng quát hoá từ affine `{a, b}` thành
  `{toOuter, outerDuration}`: map của tầng cha có thể phi tuyến
  (τ của ramp bao ngoài) nên không biểu diễn được bằng `(a, b)`
  nữa; `outerDuration` luôn tính bằng hiệu `toOuter` nên đúng cả
  khi map cha phi tuyến. Đường tuyến tính cũ rút gọn đúng về công
  thức cũ (hồi quy §2).
- `resolveNestedRampCurve`: validate + chuẩn hoá curve mirror đúng
  luật `validateNestedRamp` của render (1–128 keyframe,
  `t ∈ [0, D]`, `v ∈ [0.25, 4]`, easing hợp lệ, bezier
  `x1, x2 ∈ [0, 1]`); vắng curve → null; curve lỗi → throw.
- `nestedRampTauOffset`: τ như trên, dùng engine `integrateSpeed`
  / `speedAt` của `@repo-1/video-spec` (cùng engine render dùng,
  không viết lại công thức tích phân — tránh drift).
- `flattenNested` nhánh ramp:
  - Cửa sổ thấy được tính bằng `u(t)` thay vì `(t−placeLo)·speed`;
    `trimOut` và `in + C` cùng kẹp cửa sổ.
  - Lá media tốc độ hằng `c` thành clip ramp tổng hợp đúng spec
    đợt 18 §3: curve = `sliceSpeedKeyframes` của curve lồng nhau
    trên đoạn output của lá (đã có sẵn, bản H3 đúng hệt cho
    linear/bezier/ease), nhân mọi `v` với `c`; `in'` theo thời gian
    con, `out'` capped ở `out` gốc; field `speed` hằng bị xóa.
  - Lá text/image/sticker chỉ đổi start/duration qua τ (không có
    trục nguồn nên τ là đủ).
  - Adjustment trong nested (cả legacy trong tracks lẫn layer chuẩn
    trong subSpec) đổi start/duration qua τ.
  - Ramp trong nested tốc độ hằng: τ hợp thành với map tuyến tính
    của tầng cha (đã có test).
- Fail fast mirror render đợt 18 §5 (throw, không phẳng lệch):
  lá reverse / lá có curve riêng / lá mang attachment thời gian
  (`animations` keyframes, `track`, `karaoke`, `volumeKeyframes`)
  dưới ramp; reverse trên nested có curve; `trim.out` lệch tích
  phân; hai tầng đều có curve; tích `v·c` vượt `[0.25, 4]`; curve
  không hợp lệ; speed hằng ngoài `[0.25, 4]` dù bị curve lấn át
  (trường hợp này preview bỏ qua nested theo kiểu skipped như
  speed không hợp lệ trước đây, thay vì throw — xem §3).
- `splitClipByAdjustments`: đoạn của clip ramp (gồm lá ramp tổng
  hợp từ nested ramp) bị adjustment cắt thì `in` dời theo ∫curve
  và mang curve slice rebase về 0 — công thức speed hằng cũ tính
  sai nguồn cho mọi đoạn sau đoạn đầu. Clip không có curve giữ
  nguyên công thức cũ. (Sửa này cũng đúng cho clip ramp tầng ngoài
  bị adjustment cắt, vốn mắc cùng lỗi.)
- Header file cập nhật: từ đợt này `nestedPreview.ts` có import
  runtime duy nhất là engine speedcurve của `@repo-1/video-spec`
  (trước đây chỉ import type); test vẫn chạy bằng
  `node --experimental-strip-types` từ gốc repo như
  `previewEngine.test.ts`.

### 1c. Đường vẽ preview (không cần sửa thêm)

Lá ramp tổng hợp sau flatten đi qua đúng đường vẽ có sẵn:
`preview.tsx` tính vị trí nguồn bằng `rampSourceTimeAt`
(`previewEngine.ts`) — hàm này đã xử lý clip mang
`speedKeyframes` bằng ∫curve từ đầu lá, nên source tại thời điểm
phát khớp `u(t)` của render mà không cần thay đổi
`previewEngine.ts` hay `preview.tsx`.

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `apps/web/src/lib/nestedRampPreview.test.ts` | **13/13 pass** |
| — trong đó: τ trực tiếp, linear 1→2 (lá đơn + source qua `rampSourceTimeAt`), ease-in giải tích, nested có trim + cắt trái, hai lá slice, lá tốc độ hằng c=2, lá text, adjustment trong ramp, ramp trong nested tốc độ hằng, curve hằng gộp, `buildPreviewSpec` cắt đoạn ramp, 2 nhóm fail fast | pass |
| Đối chiếu trực tiếp với render worker (`server/render/src/nested.js` `_mapChildOffset` / `_mapChildInterval`, script tạm `/tmp/g1_render_crosscheck.mjs`) | khớp: τ(1)=0.89898, τ(3)=2.32456, τ(6)=4, interval(3,6)={2.32456, 1.67544}; ease τ(1)=0.98037, τ(4)=3.27093 — sai lệch với preview < 1e-3 (thực tế ~1e-4) |
| Hồi quy `nestedPreview.test.ts` | 46/46 |
| Hồi quy `nestedPreviewR3.test.ts` | 17/17 |
| Hồi quy `nestedUnify.test.ts` | 12 proven (2 PENDING nợ cũ R6, không tính) |
| Hồi quy `previewEngine.test.ts` | 14/14 |
| Hồi quy `nestedDemo.test.ts` | 8/8 |
| `vite build` (apps/web) | pass, 5.22s |
| `tsc` (apps/web) | **không còn lỗi ở file của luồng này**; còn 2 lỗi ở file của luồng khác đang chạy cùng đợt (xem §3) |

Lưu ý kiểm chứng: hai kỳ vọng tay ban đầu trong test (ease
duration, adjustment duration) từng sai vì nhầm τ(4) = 4 — thực tế
τ(4) ≠ 4, chỉ τ(C) = τ(∫) mới bằng duration. Đã sửa kỳ vọng theo
giá trị giải tích đúng và đối chiếu lại với render worker; code
flatten không đổi trong lần sửa đó.

## 3. Giới hạn trung thực — những gì CHƯA xong / chưa sạch

- **`tsc` toàn repo hiện còn 2 lỗi KHÔNG thuộc luồng này, luồng này
  KHÔNG sửa (luật không đụng file luồng khác):**
  `src/components/nested/nestedCurveG2.test.ts` (TS5097 — file test
  của luồng khác chưa vào exclude list của tsconfig) và
  `src/store.ts:1665` (TS2345 — code của luồng khác). Parent cần
  chờ các luồng đó sửa xong rồi chạy lại `tsc` toàn repo.
- **Hai tầng đều có curve vẫn bị từ chối** (throw, đúng render):
  muốn hỗ trợ cần hợp curve hai tầng — nợ mở từ đợt 18.
- **Lá có attachment thời gian / lá reverse dưới ramp vẫn bị từ
  chối** (throw, đúng render): cần nội suy keyframe qua τ
  (attachment) và curve đảo thời gian (reverse) — nợ mở từ đợt 18.
- **Transition trong project con dưới ramp:** shift nội bộ (dịch
  sớm theo thời gian con) được ánh xạ đúng qua τ, nhưng thời lượng
  fade/transition `T` (thời gian con) chưa đổi sang thời lượng
  output `τ(X) − τ(X−T)` như spec đợt 18 §4 — preview giữ nguyên
  `T` trên clip lá đã phẳng. (Hạn chế này cũng tồn tại ở đường tốc
  độ hằng cũ: keyframe opacity/transition không được rescale khi
  duration lá đổi — không phải hồi quy của đợt này.)
- **Fade audio dưới ramp:** `fadeIn`/`fadeOut` của lá audio giữ
  nguyên giá trị thời gian con (render rút ngắn theo phần cắt đo
  bằng τ, spec §4). Preview không có đường xử lý fade audio trong
  flatten nên chưa mirror phần này — giống đường tốc độ hằng cũ
  (cũng không rescale fade).
- **Phạm vi đo:** mapping kiểm chứng ở mức flatten + source qua
  `rampSourceTimeAt`, chưa quay video preview thật trên canvas
  (đường vẽ canvas đã có sẵn và dùng đúng hàm này, nhưng chưa có
  click-test browser cho nested ramp). Curve kiểm chứng: linear
  1→2 và ease-in 1→2; bezier/ease-out/tốc độ biên 0.25/4 chỉ được
  bao bởi engine chung `integrateSpeed`/`sliceSpeedKeyframes`
  (đã có test riêng của speedcurve), chưa có case flatten riêng.
- **Speed hằng ngoài `[0.25, 4]` trên nested có curve:** render
  fail fast, preview chỉ bỏ qua nested (skipped) — khác mức độ
  nghiêm ngặt nhưng không phẳng lệch; chọn skipped để khớp hành vi
  bỏ qua hiện có của flatten với speed không hợp lệ.
- **Store/UI chưa theo spec §2:** patch đổi curve của nested ở tầng
  store (chế độ trim-cố-định, báo khi `out` lệch) thuộc luồng
  store/UI — preview đợt này chỉ validate khớp ở normalize/flatten
  (throw khi lệch) chứ không tự sửa duration/trim.
- `apps/web/dist/` đã được `vite build` viết lại trong lúc kiểm
  chứng — đó là output build có sẵn từ trước, KHÔNG đưa vào batch
  stage (parent chỉ stage các file text ở §4).

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/lib/nestedPreview.ts`: TimeMap thành hàm ánh xạ;
  helper ramp (validate/chuẩn hoá, τ, map con, kiểm tra attachment
  lá); nhánh ramp trong `flattenNested` (cửa sổ `u(t)`, lá media
  thành clip ramp slice×c, adjustment qua τ, fail fast 2 tầng);
  normalize validate `trim.out` theo ∫curve + reverse+ramp;
  `splitClipByAdjustments` xử lý đoạn clip ramp theo ∫/slice.
- `apps/web/src/lib/nestedRampPreview.test.ts`: test mới (13 test).
- `apps/web/tsconfig.json`: thêm `nestedRampPreview.test.ts` vào
  exclude list (đúng quy ước: mọi file test đều được exclude).
- `docs/PHASE9_ROUND19_G1_NESTED_RAMP_PREVIEW_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình):
- `apps/web/src/store.ts`, `apps/web/src/components/nested/nestUtils.ts`,
  `server/render/src/nested.js` (render worker nestedWindow),
  `apps/web/src/Timeline.tsx`, file i18n, script benchmark/harness,
  mọi test/harness của luồng khác.
- File stage trong `~/workspace/repo-1-push/paths-loop/` và
  `build-loop-log.md` (parent gộp/log).
- Không push, không tag/release, không ghi qua GitHub, không binary.
