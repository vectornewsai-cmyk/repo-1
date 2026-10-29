# Phase 9 đợt 21 — Luồng T4: UI tạo speed curve mới cho nested từ số 0 — LIMITS

Ngày: 2026-10-29. Luồng T4 trong đợt lớn round 21.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop, KHÔNG sửa build-loop-log.md
(parent gộp batch — theo luật luồng).

Đóng nợ đợt 20 R4 §3: block chế độ curve của R4 chỉ hiện khi nested
clip ĐÃ mang curve; nested chưa có curve thì user không tạo được
curve từ UI (SpeedPanel vẫn không mount cho nested, xem LIMITS R4
§1a). Luồng này thêm đúng đường tạo mới đó, vẫn ở NestedClipPanel.

## 1. Việc đã làm

### 1a. Preset đã chọn: curve hằng 1×, đúng 1 keyframe

`createNestedCurvePreset()` (module thuần mới
`components/nested/nestedCurveCreate.ts`, panel và test import chung
một nguồn nên không lệch nhau qua bản copy literal):

```ts
{ keyframes: [{ t: 0, v: 1, easing: "linear" }] }
```

Chọn 1→1 thay vì ramp 1→2 (hai phương án nhiệm vụ nêu), lý do:

- 1 keyframe duy nhất hợp lệ với MỌI duration: validator đợt 20 R3
  bắt keyframe t ∈ [0, duration]. Preset 2 keyframe cố định t = D
  của clip này sẽ lỗi t > duration ở clip ngắn hơn; preset hằng 1×
  không phụ thuộc duration (test C7 khóa ở duration lẻ 2.5s).
- Tích phân trên duration D đúng bằng D nên chế độ giữ-duration
  (patchClip, đường panel dùng) giữ nguyên trim khi nested đang ở
  tốc độ 1 — trường hợp thường gặp nhất — và không đổi duration.
- Tốc độ hợp không bao giờ vượt [0.25, 4] vì hệ số hằng là 1: nếu
  guard hai tầng sau này được nới (luật render đợt 20 R1 đã hợp được
  hai tầng), tốc độ hợp = tốc độ lá × 1 = tốc độ lá, không bị preset
  đẩy vượt ngưỡng. Ramp 1→2 thì ngược lại: vừa đổi trim/duration
  ngay khi tạo (gây ngạc nhiên), vừa có thể đẩy tốc độ hợp vượt 4
  khi lá đã nhanh, lại vừa có thể gây toast vượt nguồn.

### 1b. Block tạo mới trong NestedClipPanel (NestedCurveCreateEditor)

Mỗi item nested clip CHƯA có curve hiện thêm block, đặt ngay trước
block chế độ của R4:

- Mô tả preset + preview TRƯỚC khi tạo: trim.out kỳ vọng tính bằng
  đúng helper thuần store sẽ dùng (`nestedCurveExpectedOut` trên clip
  tạm gắn preset), không tự tính lại tích phân ở panel. Hai dạng:
  trim giữ nguyên (key `curveCreatePreviewSame`) hoặc trim.out cũ →
  mới (key `curveCreatePreviewChange`) — dạng thứ hai xảy ra khi
  nested đang ở tốc độ hằng khác 1 (xem §3, ngoại lệ trung thực).
- Nút "Tạo curve tốc độ hằng 1×" (key `curveCreateButton`): tạo qua
  `patchClip` với curve preset mới (chế độ giữ-duration mặc định),
  1 bước undo như mọi action panel. Clip chưa có curve nên cổng
  no-change của patchClip mở (undefined !== object mới) — không cần
  thủ thuật copy như nút áp giữ-duration của R4.
- Sau khi tạo thành công, spec đổi nên block tạo tự ẩn và block chế
  độ của R4 hiện ngay trong cùng item, không cần chọn lại clip: cả
  hai component đều mount sẵn cho mọi item và chỉ đổi nhánh
  null/nội dung theo clip có curve hay chưa.
- Lỗi KHÔNG im lặng (bài học curveDropped trước đợt 16 + bẫy R4 về
  patchClip trả 0 im lặng):
  - Luật chặn thuần `nestedCurveCreateBlock` kiểm tra TRƯỚC: đã có
    curve (phòng thủ cho render cũ/double-click — block đã ẩn khi có
    curve nhưng handler vẫn không gọi store), reverse, hai tầng VI
    PHẠM luật T2 (xem §1c — cặp hợp lệ không chặn), không tính được
    trim.out — mỗi lý do một toast + dòng msg riêng. Nhánh hai tầng
    toast key `nested.curveTwoLevelInvalid` của T2 kèm đúng lý do cụ
    thể của hàm check (không dùng câu chung cũ nữa).
  - Track khóa → kiểm tra trước rồi toast key `nested.lockedTrack`
    có sẵn (mẫu R4).
  - Kiểm tra LẠI sau khi gọi store: đọc lại clip từ store, chỉ khi
    thấy curve mới thì mới báo thành công; ngược lại toast
    `curveCreateFail` (bẫy cửa sổ đua "clip bị xóa đúng lúc bấm" mà
    R4 đã ghi — ở đường tạo mới này đã đóng bằng post-verify).

### 1c. Nested hai tầng hợp lệ KHÔNG bị UI chặn oan (luật T2)

CẬP NHẬT giữa đợt: bản đầu luồng này chặn tuyệt đối mọi hai tầng
theo guard đợt 19 G2. Trong lúc luồng này chạy, luồng đợt 21 T2 đã
nới guard store (patchClip/patchNestedCurveFixedTrim dùng
`checkTwoLevelOuterCurve`, key `curveTwoLevelInvalid`) — và chính
sự thay đổi đó làm test hồi quy R4/19 cũ fail (xem §2/§3). Luồng này
đã cập nhật đường tạo mới theo luật T2 thay vì giữ luật cũ, vì giữ
luật cũ sẽ chặn oan đúng trường hợp nhiệm vụ cấm:

- Luật chặn dùng đúng hàm guard store dùng
  (`checkTwoLevelOuterCurve` với preset), không tự bịa điều kiện
  riêng: cây con không có curve nào → luôn ok (một tầng); cặp hợp
  lệ theo R1 → ok; chỉ cặp vi phạm (reverse, attachment thời gian,
  lá phi-media, curve không hợp lệ, tốc độ hợp vượt [0.25, 4]) mới
  chặn, kèm đúng lý do của hàm check.
- Outer chứa nested con, không clip nào mang curve → tạo được
  (test C5 khóa: outer có curve, nested con vẫn không curve,
  validateNestedClip(outer) rỗng).
- Cặp hai tầng HỢP LỆ được tạo thật (test C4 khóa: lá hằng 1× ×
  preset hằng 1× → tốc độ hợp 1 → outer có curve, lá không đổi,
  validateNestedClip(outer) rỗng).
- Cặp VI PHẠM vẫn chặn đúng lý do (test C4b khóa: lá reverse →
  patchClip trả 0, spec không đổi, toast T2 nói reverse).
- Lá text/sticker/image mang speedKeyframes duck-typed cũng không
  tính là xung đột — cùng luật với guard store (chúng không có trục
  nguồn).

### 1d. 10 key i18n mới, vi+en (chỉ thêm key, không sửa key cũ)

`nested.curveCreateHead/Note/PreviewSame/PreviewChange/PreviewFail/
Button/Ok/AlreadyHas/Reverse/Fail` — chèn sau `curveModeApplyFail`
ở cả hai dict. Quét parity toàn bộ dict: vi-only [], en-only [].
Test E1 khóa ở lang en: đủ 10 key render được, không rò key thô,
không rò biến `{…}` chưa thay.

### 1e. KHÔNG sửa các file cấm

- `store.ts`: không đổi logic guard nào (chỉ gọi patchClip có sẵn).
- `nestedPreview.ts`, `nestedRejection.ts`: không đụng.
- `nestUtils.ts`: không đụng — preset + luật chặn nằm ở module thuần
  mới `nestedCurveCreate.ts` (chỉ import helper có sẵn từ nestUtils)
  để tránh xung đột với luồng song song khác cùng sửa nestUtils.
- Không sửa wording key `nested.speedRejected` (theo nhiệm vụ §c của
  R4, vẫn để parent đối chiếu sau khi luồng split/trim đợt 20 xong).

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `store.nestedCurve21T4.test.ts` (esbuild bundle + node) | **11 pass, 0 fail** (P1–P2 preset + luật chặn T2; C1 tạo từ 0 + validate rỗng; C2 undo 1 bước về 0 curve; C3 tạo trùng không sinh undo rỗng; C4 hai tầng HỢP LỆ được tạo; C4b hai tầng VI PHẠM bị chặn đúng lý do; C5 nested hai tầng không curve không bị chặn oan; C6 curve rỗng [] tính là chưa có; C7 duration lẻ 2.5s; E1 key en + key T2) |
| Hồi quy `store.nestedCurve20R4.test.ts` (bundle) | **12 pass, 0 fail** (chạy lại cuối đợt: T2 đã cập nhật test cũ theo luật mới — xem §3) |
| Hồi quy `store.nestedCurve19.test.ts` (bundle) | **20 pass, 0 fail** (chạy lại cuối đợt: T2 đã cập nhật/mở rộng test cũ theo luật mới — xem §3) |
| Quét parity i18n vi/en (script Python duyệt toàn bộ dict, flatten đúng prefix) | vi-only [], en-only [] (chạy lại sau các sửa của T2 — dict vẫn cân; key T2 `curveTwoLevelInvalid` có ở cả hai dict; 10 key `curveCreate*` của luồng này đủ cả hai dict) |
| `npx vite build` (apps/web) | **pass** (14.12s lần chạy cuối; chỉ warning chunk > 500kB có sẵn từ trước) |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (chạy lại cuối đợt: luồng T3 đã sửa xong lỗi `nestedRejection.ts:175` nêu ở bản nháp trước của LIMITS này — xem §3) |

## 3. Giới hạn trung thực — những gì CHƯA xong / lưu ý gộp đợt

- **Panel CHƯA click-test trên browser thật** (cùng mẫu nợ R4).
  Đã THỬ nhưng chưa chạy được, lý do cụ thể (không bịa kết quả):
  repo không cài runner Playwright (`@playwright/test` không có
  trong node_modules, không có binary `playwright` local) dù binary
  Chromium đã nằm trong cache (`~/.cache/ms-playwright/chromium-1248`).
  `npx playwright` kéo bản từ xa về thì lỗi nạp config TS
  (`ERR_MODULE_NOT_FOUND` ở bước load config, chưa tới bước chạy
  test nào). Cài thêm runner là thay đổi dependency, ngoài phạm vi
  luồng này và có nguy cơ xung đột với luồng song song — nên dừng ở
  đây, không cài. Đã viết thử spec tạm
  (`e2e/nestedCurveCreate.tmp.spec.ts`: thêm 2 text clip →
  Shift+click chọn cả hai → gộp nested → bấm nút tạo → assert block
  chế độ hiện + nút tạo biến mất) nhưng đã XÓA sau khi không chạy
  được, không đưa vào batch; các bước trong spec đó được ghi lại ở
  đây để luồng sau chạy lại khi runner đã sẵn. Phần UI đã khóa gián
  tiếp qua test store + helper thuần panel gọi (đúng mẫu R4): nút
  tạo, preview, toast lý do và việc block chế độ hiện ngay đều suy
  ra từ cùng một spec đổi, nhưng chưa có bằng chứng DOM thật — đừng
  mạo nhận đã click-test.
- **Tạo curve trên nested đang reverse vẫn bị chặn ở panel, dù
  patchClip không chặn:** patchClip (đường tạo mới dùng) không kiểm
  tra reverse cho nested curve, nên nếu panel không chặn trước thì
  tạo ra clip fail validator. Luồng này chặn ở panel
  (`curveCreateReverse`) thay vì sửa guard store (ngoài phạm vi).
  Nếu luồng khác sau này nới guard, cần đối chiếu lại nhánh này.
- **Nested tốc độ hằng khác 1 thì tạo curve hằng 1× VẪN đổi trim.out:**
  ví dụ nested speed 2, trim [0, 8) trên duration 4 → sau khi tạo,
  trim.out thành in + D = 4 (render bỏ qua speed hằng khi có curve,
  spec đợt 18 §1.5). Đây là ngữ nghĩa giữ-duration đúng, không phải
  bug — nhưng user cần thấy trước: panel hiện preview dạng
  "trim.out cũ → mới" và store toast info vượt nguồn nếu out mới
  vượt độ dài nguồn con. Không chọn preset "hằng theo speed hiện
  tại" để tránh trung tính giả: preset đó biến thiên theo từng clip,
  khó document/test và che đi việc render đã đổi trục tốc độ.
- **Cửa sổ gộp undo 800ms của patchClip (hành vi có sẵn, chung với
  nút áp R4):** CommandStack gộp các patchClip cùng clip trong 800ms
  thành 1 entry. Nghĩa là nếu user vừa patch cùng clip (ví dụ kéo
  slider Inspector) rồi bấm "Tạo curve" trong 800ms, 1 lần undo sẽ
  hoàn cả hai thao tác, không chỉ riêng việc tạo. Test C2 phải dùng
  clip id khác case trước mới đo được đúng +1 entry (lỗi đo ban đầu
  của chính test này đã lộ ra hành vi đó). Muốn tách tuyệt đối thì
  phải đổi patchClip sang action không mergeKey (ví dụ
  patchNestedCurveFixedTrim không có mergeKey) nhưng action đó đổi
  duration thay vì giữ duration — đánh đổi tệ hơn nên giữ patchClip
  và ghi rõ caveat này.
- **Guard hai tầng đã được nới giữa đợt bởi luồng T2 (đã xong, hồi
  quy xanh trở lại cuối đợt):** luồng T2 (đợt 21) đã thay chặn tuyệt
  đối bằng `checkTwoLevelOuterCurve` (store.ts + nestUtils.ts +
  nestedRejection.ts + i18n, sửa lúc ~07:14, sau khi luồng này kiểm
  chứng hồi quy lần đầu). Giữa đợt, test cũ khóa luật chặn tuyệt đối
  đã fail đúng chủ đích đó (R4: E1/V2/A2; đợt 19: S4/S6 — vì patchClip
  nay CHO QUA cặp hợp lệ thay vì trả 0). Đây là thay đổi hành vi có
  chủ đích của T2 (đúng hướng LIMITS đợt 20 §3: "nới guard phải đi
  kèm cập nhật test G2"), KHÔNG phải lỗi do file luồng này gây ra:
  luồng này không sửa store/nestUtils/nestedRejection, và test mới
  của luồng này đã cập nhật theo luật T2 (11/11). Cuối đợt, T2 đã tự
  cập nhật xong test cũ nên hồi quy chạy lại xanh (R4 12/12, đợt 19
  20/20 — file test đợt 19 nay có 20 case thay vì 8 case lúc đầu đợt,
  do T2 mở rộng). Parent gộp vẫn nên xác nhận T2 đã đóng hẳn trước
  khi chốt, vì các file đó còn thay đổi trong lúc luồng này chạy.
- **Block chế độ R4 (`NestedCurveModeEditor`, cùng file panel) nay
  lỗi thời ở nhánh chặn hai tầng:** nó vẫn kiểm tra
  `nestedSubtreeHasSpeedCurve` tuyệt đối trước khi áp, nên với cặp
  hai tầng hợp lệ mà đường tạo mới của luồng này vừa tạo được, bấm
  "Áp curve" ở block chế độ sẽ báo hai tầng sai (store thì cho qua).
  Sửa nó thành dùng `checkTwoLevelOuterCurve` như đường tạo mới là
  follow-up thuộc về T2/parent (cùng luật guard mới) — luồng này cố
  tình không sửa editor của R4 để tránh xung đột với T2 đang sửa cùng
  vùng luật này; parent cần đối chiếu khi gộp.
- **Lỗi tsc ở `nestedRejection.ts:175` giữa đợt đã được sửa xong
  cuối đợt:** cast easing `string` không gán được cho `SpeedEasing`
  thuộc về luồng đang sửa file đó (T3) — luồng này bị cấm sửa file
  đó nên chỉ ghi nhận; chạy lại tsc cuối đợt cho exit 0. Parent gộp
  vẫn nên chạy lại tsc sau gộp vì file đó còn thay đổi trong đợt.
- **Reason của action giữ-trim vẫn hardcode tiếng Việt** (nợ R4 §3,
  không thuộc luồng này): nút tạo dùng patchClip nên không chạm tới
  reason đó, nhưng block chế độ R4 hiện ngay sau khi tạo vẫn dùng
  đường đó khi user chọn chế độ giữ-trim.
- **`dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage.** Spec click-test tạm đã xóa, không đưa vào batch.
- **Rủi ro gộp song song:** đợt 21 có nhiều luồng cùng chạy; trong
  lúc luồng này làm việc, `nestedRejection.ts` đã bị một luồng khác
  sửa (dẫn tới lỗi tsc duy nhất nêu ở §2) và `i18n/*.json` cũng có
  thể được luồng khác sửa cùng vùng. Parent gộp cần kiểm tra lại 10
  key `nested.curveCreate*` và vị trí chèn sau `curveModeApplyFail`
  sau khi gộp, phòng key bị ghi đè hoặc trùng.

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- Mới: `apps/web/src/components/nested/nestedCurveCreate.ts` (preset
  hằng 1× + luật chặn thuần `nestedCurveCreateBlock`).
- Đổi: `apps/web/src/components/nested/NestedClipPanel.tsx` (thêm
  `NestedCurveCreateEditor` + render trước `NestedCurveModeEditor` +
  comment đợt 21 T4; không đổi logic panel cũ).
- Đổi: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`
  (CHỈ thêm 10 key `nested.curveCreate*`; KHÔNG sửa key cũ).
- Mới: `apps/web/src/store.nestedCurve21T4.test.ts` (test bundle,
  11 case: P1–P2, C1–C3, C4, C4b, C5–C7, E1).
- Mới: `docs/PHASE9_ROUND21_T4_NESTED_CURVE_CREATE_UI_LIMITS.md` (file này).

KHÔNG ĐỔI (cố tình, theo phân công luồng):
- `store.ts` (chỉ gọi patchClip có sẵn), `nestUtils.ts`,
  `nestedPreview.ts`, `nestedRejection.ts`, `SpeedPanel.tsx`.
- Không push, không tag/release, không ghi qua GitHub, không stage
  paths-loop, không sửa build-loop-log.md.
