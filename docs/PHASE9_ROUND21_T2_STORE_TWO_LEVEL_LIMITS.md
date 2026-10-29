# Phase 9 đợt 21 — Luồng T2: STORE nới guard hai tầng + trim nested ramp bằng τ — LIMITS

Ngày: 2026-10-29. Luồng T2 trong đợt lớn round 21.
Đóng nợ đợt 20 §3: store vẫn chặn tạo trạng thái hai tầng qua UI
(guard G2) và store vẫn tính đích trim nested theo speed hằng nên có
thể chặn/kẹp sai trước khi tới hàm thuần trimNestedClip của đợt 20 R2.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop, KHÔNG sửa build-loop-log.md
(parent gộp batch — theo luật luồng).
KHÔNG sửa `nestedPreview.ts`, `nestedRejection.ts`, panel UI,
`preview.tsx` (theo phân công luồng).

## 1. Việc đã làm

### 1a. Nới guard hai tầng theo đúng luật render R1 (đợt 20)

Render R1 đã hợp curve hai tầng thật nên guard G2 đợt 19 (chặn MỌI
trạng thái hai tầng) nay thành kiểm tra theo luật R1, implement chung
trong `nestUtils.ts` (file store-tương đương, vì guard của đường deep
nằm ở hàm thuần đó) và dùng ở cả ba đường vào của store:

- `patchClip` đặt curve lên nested clip: `checkTwoLevelOuterCurve`
  kiểm tra toàn bộ cây con.
- `patchNestedCurveFixedTrim` (giữ trim): cùng check đó trước exec.
- `updateNestedDeepInnerClip` đặt curve lên lá: `checkTwoLevelLeafCurve`
  kiểm tra chain tổ tiên (hàm thuần, vì store action chỉ delegate).

Một trạng thái chỉ được cho qua khi MỌI điều sau đúng (mirror
`validateNestedRamp` của render + `validateCurve` của
`twoLevelCurve.ts`):

- Mỗi curve hợp lệ riêng: keyframes không rỗng, ≤ 128, t trong
  [0, duration của chính tầng đó], v trong [0.25, 4], easing linear |
  ease-in | ease-out | bezier (bezier có x1, x2 trong [0, 1]).
- Không reverse ở tầng mang curve lẫn lá.
- Không attachment thời gian khác trên lá media dưới ramp:
  track.points, karaoke, animations keyframes, volumeKeyframes
  (mirror `hasNonCurveAttachments` của render).
- Chỉ lá video/audio mới được mang curve dưới ramp; lá text/sticker/
  image mang speedKeyframes duck-typed bị CHẶN (không có trục nguồn).
  Đây là điểm đổi so với G2: trước đây G2 chỉ "không tính" text vào
  xung đột (tức cho qua), nay đặt curve ngoài lên trên một cây có lá
  text mang curve sẽ bị chặn, đúng luật render R1 §1f.
- Tốc độ hợp trong [0.25, 4]: với lá TRỰC TIẾP của tầng ngoài, lấy mẫu
  đúng c(T) = s_o(T) · s_i(x(T)) tại 257 điểm đều + mọi knot ngoài +
  knot trong đã map ngược qua τ (bisection trên `sourcePosAt`, mirror
  `twoLevelTauOffset`/`mapChildOffset`); với lá sâu hơn hoặc nested
  trung gian mang curve, chỉ kiểm tra BIÊN TÍCH keyframe
  (min·min ≥ 0.25 và max·max ≤ 4). Xem giới hạn ở §3 về bezier.
- Lá nằm ngoài cửa sổ trim của tầng ngoài hoàn toàn được bỏ qua ở
  bước lấy mẫu (render drop lá đó, không fail); các kiểm tra hình
  dạng/reverse/attachment vẫn áp cho nó.

Lệnh bị chặn vẫn return 0 / `{ ok: false }` TRƯỚC exec nên không đổi
spec và không sinh entry undo (khóa bằng đo `undoDepth` trước/sau
trong test). Toast của `patchClip` nay qua key i18n mới
`nested.curveTwoLevelInvalid` (vi+en, kèm `{reason}` chi tiết);
key cũ `nested.curveTwoLevel` vẫn giữ nguyên cho panel dùng
(panel chưa sửa — xem §3). Reason của action trim-cố-định giữ
`reasonKey` cũ của T3 (`nested.fixedTrimTwoLevel`) và gắn thêm lý do
chi tiết của check để không nuốt thông tin.

Thắt chặt mới kèm theo (có chủ đích, đúng R1): `patchClip` đặt curve
lên nested clip đang reverse nay bị chặn (trước đây không có cổng
này ở đường patchClip); render vốn đã cấm reverse ở nested clip.

Chặn thừa curve hằng của G2 đã bỏ: tổ tiên/lá mang curve hằng được
cho qua như curve thường miễn là tốc độ hợp trong [0.25, 4], vì
render §1c xử lý hằng đúng hệt bằng slice.

### 1b. Store tính đích trim nested ramp bằng τ (đóng nợ R2 §3)

Nhánh nested của `trimClip` trong `store.ts` nay không còn dùng speed
hằng cho nested có curve:

- Mép phải: cap duration = `outputDurationForSource(curve,
  sourceDuration − trimIn)` — đảo tích phân, tức thời gian output cần
  để tiêu thụ hết nguồn còn lại. Khớp đúng hàm thuần R2 vì hàm thuần
  mở rộng mép phải bằng đoạn hằng vLast = speedAt(curve, D) và
  `speedAt` kẹp ngoài keyframe cuối về vLast, nên đảo tích phân trên
  curve gốc cho đúng duration mở rộng đó.
- Mép trái: giới hạn mở rộng = trimIn / v0 với v0 = speedAt(curve, 0),
  đúng quy ước đoạn hằng v0 mà hàm thuần R2 dùng cho mở rộng trái
  (newIn = in + v0·shift). Cắt đầu (shift > 0) thì newIn theo ∫ nên
  không cần cap riêng ngoài floor duration của hàm thuần.
- Curve không tính được (rỗng, `speedAt`/`outputDurationForSource`
  throw, cap không hữu hạn/dương) thì rơi về cap speed hằng cũ và hàm
  thuần trả null → toast từ chối như trước, không im lặng.
- Comment cũ "nested clip không mang speedKeyframes" ở nhánh trim đã
  sửa cho đúng trạng thái mới.

Số tính tay khóa trong test (ramp 1→2, s(t) = 1 + t/4, ∫₀ᵗ = t + t²/8):

- Trim phải mở rộng, nguồn 10, trim [0, 6): cap τ cho
  6 + 2·(D'−4) = 10 → D' = 6 (cap speed hằng cũ với speed ghi 1 sẽ cho
  10 — sai); kết quả duration 6, trim [0, 10).
- Trim trái mở rộng, trim [2, 8), start 2, speed hằng ghi 2, delta
  −1.5: cap v0 cho |shift| ≤ 2/1 = 2 → start 0.5, duration 5.5,
  trim [0.5, 8) (cap speed hằng cũ chỉ cho start về 1.0).
- Trim trái cắt đầu, trim [2, 8), delta +1: trim.in = 2 + ∫₀¹ = 3.125,
  duration 3, trim.out giữ 8.
- Trim phải kẹp nguồn, nguồn 8: cap τ cho 6 + 2·(D'−4) = 8 → D' = 5,
  trim.out 8.
- Trim phải trên nested curve mà trim gốc lệch tích phân
  (out 5 ≠ in + ∫ 6): hàm thuần null → spec không đổi + có toast.

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (lúc đang làm có 1 lỗi thoáng qua ở `nestedRejection.ts` do một luồng round-21 khác đang sửa file đó cùng lúc — luồng này KHÔNG đụng file đó; tới lúc kiểm chứng cuối, luồng kia đã sửa xong và tsc về 0) |
| `npx vite build` (apps/web) | **pass** (10.33s; chỉ warning chunk > 500kB có sẵn từ trước) |
| Test store mới/cập nhật `store.nestedCurve19.test.ts` (esbuild bundle) | **20 pass, 0 fail** (S1–S8, trong đó S4/S6 đổi chiều; S9–S15 mới; Tτ1–Tτ4 mới) |
| `store.nestedCurve20R4.test.ts` (bundle) | **12 pass, 0 fail** (E1/V2/A2 đã cập nhật fixture theo §2.1) |
| `store.nestedGuard.test.ts` (bundle) | **9 pass, 0 fail** |
| `store.nestedTimelineToast.test.ts` (bundle) | **16 pass, 0 fail** |
| `nestedCurveG2.test.ts` (node trực tiếp) | **18 pass, 0 fail** (17 cũ + C6 mới; C4 đã cập nhật theo §2.1) |
| `nestedRampSplitTrim20.test.ts` (node) | **18 pass, 0 fail** |
| `nestUtils.test.ts` (node) | **28 pass, 0 fail** |
| `twoLevelCurve.test.ts` (node) | **12 pass, 0 fail** |
| `nestedSpeedcurve` / `nestedDeep` / `nestedDeepSpeed` / `nestedStore` (node) | **22 / 16 / 16 / 11 pass, 0 fail** |
| `nestedStore.store` / `nestedDeepSpeed.store` / `splitPatch.store` (bundle) | **8 / 8 / 12 pass, 0 fail** |

Lệnh chạy test store (mẫu cũ): `node_modules/.bin/esbuild
apps/web/src/store.nestedCurve19.test.ts --bundle --platform=node
--format=cjs --outfile=/tmp/store.nestedCurve19.test.cjs
--log-level=warning && node /tmp/store.nestedCurve19.test.cjs`.
Test thuần chạy trực tiếp: `node
apps/web/src/components/nested/nestedCurveG2.test.ts`.

### 2.1 Cập nhật test cũ có chủ đích (không phải sửa test cho qua)

- `store.nestedCurve19.test.ts` S4: từ chặn thành CHO PHÉP — cặp
  ngoài 1→2 × trong hằng 1, tốc độ hợp [1, 2] ⊂ [0.25, 4], không
  reverse, không attachment. Sau patch: duration giữ 4, trim.out 6
  (= in + ∫₀⁴), curve được ghi, undoDepth +1 (dùng clip id n9 để
  mergeKey `patch:v1:n9` không gộp vào entry của S1–S3 — bài học đo
  undo: các patchClip cùng track/clip gộp chung 1 entry theo
  mergeKey nên đo +1 phải dùng id mới), toast chỉ còn cảnh báo vượt
  nguồn (nguồn con 4 < ∫ 6), không còn "hai tầng".
- `store.nestedCurve19.test.ts` S6: từ chặn thành CHO PHÉP — action
  trim-cố-định với cặp trên: ok, duration 2.92820323
  (= −4 + √48, vì D + D²/8 = 4), trim giữ [0, 4), undoDepth +1.
- `store.nestedCurve20R4.test.ts` LEAF_CURVE: từ hằng 1 thành 1→3 để
  E1/V2/A2 vẫn khóa đường BỊ CHẶN (tốc độ hợp lấy mẫu cuối
  1.732 × 3 = 5.196 > 4). E1 vẫn assert toast en nói
  "two curve levels" và không rò key; V2 vẫn assert "hai tầng"; A2
  vẫn assert ok:false + reason khác rỗng + spec không đổi. Các test
  còn lại của file này (P1–P3, E2/E3, V1, A1, C1a/C1b) không đổi.
- `nestedCurveG2.test.ts` C4: từ cặp 1→2 × 1→1.5 (nay hợp lệ) thành
  cặp 1→2 × 1→3.5 (tích biên keyframe 2 × 3.5 = 7 > 4) để vẫn khóa
  đường bị chặn; C6 mới khóa cặp 1→2 × 1→1.5 được cho qua.
  C1–C3, C5 (đếm subtree, text không tính) không đổi.

## 3. Giới hạn trung thực — những gì CHƯA xong / lưu ý gộp đợt

- **Panel vẫn chặn hai tầng:** `NestedClipPanel.tsx` (không thuộc
  luồng này) vẫn tự kiểm tra `nestedSubtreeHasSpeedCurve` và toast
  key cũ `nested.curveTwoLevel` trước khi gọi store — đường UI qua
  panel đó vẫn từ chối mọi cặp hai tầng kể cả cặp hợp lệ, trong khi
  store nay đã cho phép. Cần luồng panel gỡ pre-check đó (và chỉ
  dùng store làm chốt) thì tính năng mới tới được UI thật.
- **Preview vẫn từ chối hai tầng:** `nestedPreview.ts` vẫn throw cho
  hai tầng (đợt 20 §3) — store nay cho tạo trạng thái mà preview chưa
  vẽ được (module `twoLevelCurve.ts` vẫn chờ được nối). Tới khi nối,
  render và preview lệch đúng ở case hai tầng.
- **Detector + câu báo G3 vẫn lỗi thời ở phần curve:** luồng này
  KHÔNG sửa `nestedRejection.ts` (phân công) — detector vẫn liệt kê
  `speedKeyframes` là field khiến split/trim bị từ chối và key
  `nested.speedRejected` vẫn viết "render cấm speedKeyframes", trong
  khi split/trim ramp đã làm được từ đợt 20 R2. Nối tiếp ghi chú của
  G2/R2 cho luồng G3.
- **Kiểm tra tốc độ hợp chỉ là cổng UI, render mới là chốt cuối:**
  lấy mẫu 257 điểm + knot có thể bỏ sót đỉnh vượt giữa hai mẫu với
  curve bezier (y1/y2 tự do nên speedAt có thể vượt biên keyframe);
  lá sâu/nested trung gian chỉ kiểm tra biên tích keyframe (điều kiện
  cần, không đủ cho bezier). Store cho qua một cặp bezier lệch không
  có nghĩa render sẽ qua — render vẫn fail-fast ở bước mã hoá
  Hermite. Ngược lại, biên tích vượt thì chặn chắc chắn.
- **Wording base của fixedTrimTwoLevel (T3 sở hữu) nay hơi lệch:**
  câu gốc viết "hợp curve hai tầng chưa được hỗ trợ" — với cặp bị
  chặn vì vượt khoảng thì hợp hai tầng vốn ĐƯỢC hỗ trợ, chỉ cặp này
  vượt. Luồng này giữ nguyên key + gắn thêm lý do chi tiết vào reason
  để không phá khóa wording của T3; luồng i18n có thể viết lại câu
  gốc cho đúng khi dọn.
- **Deep check dùng hình học sau patch:** `checkTwoLevelLeafCurve`
  nhận start/duration từ patch (nếu có) để lấy mẫu đúng đoạn khả
  kiến mới; nếu patch đồng thời đổi cả speed hằng thì duration suy
  từ speed chưa được phản ánh vào bước lấy mẫu (chỉ dùng
  patch.duration ?? duration cũ) — trường hợp này hiếm (patch vừa
  thay curve vừa đổi speed) và biên tích keyframe vẫn chặn được cặp
  vượt thô.
- **Trim τ fallback:** khi curve không tính được hoặc cap τ ≤ 0
  (nguồn còn lại ≤ 0), store rơi về cap speed hằng cũ rồi để hàm
  thuần trả null → toast; đó là đường fail an toàn, không phải đích
  τ đúng.
- **Không đo ở tầng render:** tính đúng của tích phân/đảo tích phân
  được khóa bằng số suy tay trong test store + test thuần; MP4 cho
  hai tầng đã thuộc luồng render đợt 20 R1.
- **`dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage.**

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/store.ts`: import `checkTwoLevelOuterCurvePure`
  (thay `nestedSubtreeHasSpeedCurvePure`), guard patchClip nới theo
  R1 + toast key mới, action `patchNestedCurveFixedTrim` nới tương
  tự, nhánh trimClip nested tính đích τ cho curve (trái theo v0,
  phải theo `outputDurationForSource`), sửa comment nhánh trim.
- `apps/web/src/components/nested/nestUtils.ts`: helper T2 mới
  (`isValidTwoLevelRampCurve`, `clipHasTimeAttachment`,
  `checkTwoLevelOuterCurve`, `checkTwoLevelLeafCurve` + hàm lấy mẫu
  hợp/biên tích/τ ngược nội bộ), nới guard deep trong
  `updateNestedDeepInnerClip`, cập nhật comment header G2.
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`: thêm key
  `nested.curveTwoLevelInvalid` (vi/en, đủ cặp — key cũ giữ nguyên
  cho panel).
- `apps/web/src/store.nestedCurve19.test.ts`: S4/S6 đổi chiều, thêm
  S9–S15 (vẫn chặn đúng) + Tτ1–Tτ4 (trim τ), helper `nestedTopFull`,
  import type `NestedDeepPatch`.
- `apps/web/src/store.nestedCurve20R4.test.ts`: LEAF_CURVE 1→3 theo
  §2.1 (E1/V2/A2 vẫn khóa đường bị chặn).
- `apps/web/src/components/nested/nestedCurveG2.test.ts`: C4 đổi
  thành cặp vượt khoảng, thêm C6 cho phép.
- `docs/PHASE9_ROUND21_T2_STORE_TWO_LEVEL_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình, theo phân công luồng):
- `nestedPreview.ts`, `nestedRejection.ts`, panel UI, `preview.tsx`,
  render worker, validator video-spec, file test khác ngoài 3 file
  nêu ở §4 (chỉ cập nhật đúng các assertion khóa hành vi cũ theo
  §2.1).
- Không push, không tag/release, không ghi qua GitHub, không stage,
  không sửa build-loop-log.md.
