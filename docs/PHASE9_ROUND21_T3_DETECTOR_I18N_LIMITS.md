# Phase 9 đợt 21 — Luồng T3: Detector phân biệt ramp hợp lệ + wording i18n + reason giữ-trim — LIMITS

Ngày: 2026-10-29. Luồng T3 trong đợt lớn round 21.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist, KHÔNG tự tạo
file stage paths-loop, KHÔNG sửa build-loop-log.md (parent gộp batch —
theo luật luồng). KHÔNG chạy lệnh GitHub nào.

Đóng nợ đợt 20 §3 (ghi chú của R2, nối tiếp ghi chú G2 đợt 19):
`nestedRejection.ts` vẫn liệt kê mọi `speedKeyframes` là field khiến
split/trim bị từ chối, và key `nested.speedRejected` vẫn viết "render
worker cấm speedKeyframes và reverse ở nested clip" — trong khi từ đợt
20 R2, split/trim nested mang ramp HỢP LỆ đã đi đường ánh xạ τ và thành
công. Ngoài ra reason của action giữ-trim (`patchNestedCurveFixedTrim`,
đợt 20 R4) vẫn hardcode tiếng Việt ở giá trị trả về nên ở locale en,
toast lỗi của nút áp giữ-trim vẫn hiện tiếng Việt.

## 1. Việc đã làm

### 1a. Detector phân biệt ramp hợp lệ / không hợp lệ (nestedRejection.ts)

`nestedSpeedRejectionFields` nay trả [] cho nested mang ramp HỢP LỆ
(khác detector đợt 19 G3, trước đây liệt kê mọi speedKeyframes).
Ramp hợp lệ được định nghĩa đúng bằng luật render, không bịa thêm:

- Object `{ keyframes: [...] }`, 1–128 keyframe (luật
  `validateNestedRamp` trong server/render/src/nested.js + validator
  đợt 20 R3).
- Mỗi keyframe: `t` hữu hạn trong [0, duration] (dung sai float 1e-9
  như EPS của render), `v` hữu hạn trong [0.25, 4], easing thuộc
  linear | ease-in | ease-out | bezier, bezier (nếu có) là
  [x1, y1, x2, y2] hữu hạn với x1, x2 trong [0, 1] (y tự do, như render).
- Tích phân `sourcePosAt(curve, duration)` tính được và hữu hạn
  (duration phải hữu hạn và > 0).
- Nếu ghi trim tường minh thì phải khớp bất biến render §1.3:
  |trim.out − (trim.in + ∫)| ≤ 1e-4, trim.in hữu hạn ≥ 0, trim.out
  hữu hạn > trim.in — mirror đúng `nestedCurveWindow` trong
  nestUtils (chỉ kiểm tra khi có trim; không ghi trim thì cửa sổ hiệu
  dụng là [in, in + ∫) nên luôn khớp theo cấu tạo).
- Không kiểm tra thêm: keyframe không cần sắp xếp (render chuẩn hoá
  sort + gộp trùng t), tốc độ đánh giá giữa đoạn bezier có overshoot
  cũng không xét (render chỉ kiểm tra v tại keyframe).

Vẫn bị từ chối đúng, với lý do riêng từng case
(`NestedCurveRejectionReason`, thứ tự kiểm tra cố định):
`curveEmpty` (mảng rỗng), `curveShape` (sai hình dạng: không phải
object, keyframes không phải mảng, quá 128 keyframe, keyframe không
phải object, t/easing/bezier không hợp lệ, v không hữu hạn),
`curveRange` (v hữu hạn nhưng ngoài [0.25, 4]), `curveIntegral`
(không tính được tích phân: duration không hợp lệ, sourcePosAt throw
hoặc trả về không hữu hạn), `curveWindow` (trim tường minh lệch tích
phân hoặc trim không hợp lệ). `reverse === true` vẫn luôn bị từ chối
(render cấm hoàn toàn, spec đợt 18 §1.4), có hay không có curve cũng
vậy; reverse + ramp hợp lệ chỉ liệt kê ["reverse"], reverse + ramp
lỗi liệt kê cả hai field. Clip thường mang curve lỗi và nested thiếu
subSpec vẫn không bị tính (cùng điều kiện isNestedClip như cũ).

API mới (giữ nguyên chữ ký cũ để caller cũ không vỡ):
- `classifyNestedSpeedRejection(clip)` → `{ fields, reverse,
  curveReason }` đầy đủ.
- `nestedSpeedRejectionFields(clip)` → như cũ, nay theo luật mới.
- `nestedSpeedRejectionMessage(i18nT, name, fields, curveReason?)`
  → tham số thứ 4 là tùy chọn; bỏ trống thì lý do curve nói chung
  (dạng cũ, xem §3).
- `nestedSpeedRejectionMessageForClip(i18nT, clip, name)` → phân loại
  từ clip thật nên nêu đúng lý do từng case; trả "" khi không bị từ
  chối (kể cả ramp hợp lệ).
- `nestedCurveRejectionReasonKey(reason)` → key i18n của từng lý do.

Vì store notify và panel đều gọi detector chung này nên hành vi toast /
cảnh báo tự sửa theo mà không cần sửa logic store/panel: ramp hợp lệ
hết toast oan và hết dòng cảnh báo; ramp lỗi vẫn toast với wording mới.

### 1b. Wording key nested.speedRejected (vi+en, các câu khác giữ nguyên)

Câu cũ (cả vi lẫn en) nói chung chung "render worker cấm
speedKeyframes và reverse ở nested clip" — nay đã sai vì ramp hợp lệ
được phép. Câu mới:

- vi: "Nested clip “{name}” mang {fields} nên lệnh tách/trim nó bị từ
  chối: ramp tốc độ hợp lệ vẫn được tách/trim — render chỉ cấm
  {reason}. {fix}"
- en: "Nested clip “{name}” carries {fields}, so splitting/trimming it
  is rejected: a valid speed ramp can still be split/trimmed — the
  render worker forbids only {reason}. {fix}"

Biến mới `{reason}` lấy từ các key reason (đủ vi/en):
`speedRejectedReasonReverse` (reverse, đảo timeline con chưa được hỗ
trợ), `speedRejectedReasonCurve` (lý do chung cho dạng fields-only:
curve không hợp lệ, liệt kê mọi nguyên nhân có thể), các key chi
tiết `...CurveEmpty` (curve rỗng), `...CurveShape` (sai hình dạng /
quá 128 keyframe), `...CurveRange` (tốc độ vượt ngoài [0.25, 4]),
`...CurveIntegral` (không tính được tích phân), `...CurveWindow`
(cửa sổ trim lệch khỏi tích phân curve), `...Both` (reverse và curve
không hợp lệ, dùng cho dạng fields-only khi cả hai field cùng có),
`...Join` (" và " / " and ", để nối lý do reverse với lý do curve
chi tiết ở dạng clip-aware). 3 key fix cũ giữ nguyên từng chữ.

Cách viết mới cố tình giữ lại cụm "render worker forbids" ở câu en và
từ "cấm" ở câu vi nên test G3 cũ I1 vẫn xanh mà không cần sửa test
cũ nào (xem §2).

### 1c. Reason action giữ-trim sang key i18n (store.ts, chỉ phần reason)

4 lần từ chối của `patchNestedCurveFixedTrim` nay trả kèm `reasonKey`
(key i18n `nested.fixedTrim*`, đủ vi/en) và `reason` là chuỗi đã dịch
theo ngôn ngữ hiện tại (`i18nT` tại thời điểm gọi, giống toast store):
- `fixedTrimLocked` — "Track đang khóa." / "The track is locked."
- `fixedTrimNotNested` — "Clip này không phải nested clip." /
  "This clip is not a nested clip."
- `fixedTrimTwoLevel` — "Bên trong nested clip đã có clip mang speed
  curve — hợp curve hai tầng chưa được hỗ trợ (spec đợt 18 §5)." /
  "A clip inside the nested clip already carries a speed curve —
  merging two curve levels is not supported yet (spec round 18 §5)."
- `fixedTrimUncomputable` — "Không tính được duration theo chế độ
  trim-cố-định (curve/trim không hợp lệ, nested đang reverse, hoặc
  duration tính ra dưới 0.2s)." / "Cannot compute the duration in
  keep-trim mode (invalid curve/trim, nested clip is reversed, or the
  computed duration is under 0.2s)."

Câu tiếng Việt giữ đúng từng ký tự bản hardcode cũ (test khóa, xem
§2); caller cũ chỉ đọc `reason` (string) vẫn chạy y nguyên, không cần
sửa panel — panel toast `res.reason` nay tự hiện đúng locale. Caller
mới muốn tự dịch lại thì dùng `reasonKey`. Interface action thêm
`reasonKey?: string` (tùy chọn, không vỡ caller cũ). Không đổi logic
từ chối nào khác của action, không đổi split/trim store, không đổi
nestedPreview, không đổi panel UI.

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `store.nestedRejection21T3.test.ts` (esbuild bundle + node) | **31 pass, 0 fail** (D1–D16 detector + câu báo; S1–S6 store split/trim; R1–R4 reason action) |
| Hồi quy `store.nestedTimelineToast.test.ts` (bundle) | **16 pass, 0 fail** (không sửa test cũ nào; I1 xanh nhờ wording mới giữ cụm "render worker forbids"/"cấm") |
| Quét parity toàn bộ dict (script Python duyệt vi.json/en.json) | **vi-only [], en-only []**, 787 key mỗi bên, 13 key mới đều đủ hai bên |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (đã sửa 1 lỗi cast easing: string → SpeedCurve trong lúc chạy) |
| `npx vite build` (apps/web) | **pass** (12.97s; chỉ warning chunk > 500kB có sẵn từ trước; lần chạy đầu gặp lỗi stream transient, chạy lại pass — ghi rõ để khỏi nhầm là lỗi code) |

Các số khóa trong test mới đều tính tay: ramp 1→2 trên D=4 có ∫=6
(trim [0,6) khớp); trim trái +1 cho in mới = ∫₀¹ = 1.125; trim phải
−1 cho out mới = ∫₀³ = 4.125; lá hằng 4 × ngoài 1→2 cho tốc độ hợp
tới 8 (vượt [0.25, 4]) nên cổng hai tầng từ chối (xem §4).

## 3. Giới hạn trung thực — những gì CHƯA xong / lưu ý gộp đợt

- **Toast store/panel vẫn dùng dạng fields-only nên lý do curve mới ở
  mức chung, chưa chi tiết từng case.** Store `notifyNestedSplitTrimRejection`
  và panel (effect liệt kê + dòng cảnh báo dưới clip) hiện gọi
  `nestedSpeedRejectionMessage(i18nT, name, fields)` — với field curve,
  toast nêu "curve không hợp lệ (rỗng, sai hình dạng, không tính được
  tích phân, lệch cửa sổ trim, hoặc tốc độ vượt ngoài [0.25, 4])": đúng
  (liệt kê dạng hoặc, không nêu sai nguyên nhân cụ thể nào) nhưng chưa
  pinpoint. Muốn toast nêu đúng lý do chi tiết (rỗng / sai hình / vượt
  biên / không tính được / lệch cửa sổ) thì nối dây 1 dòng mỗi chỗ
  sang `nestedSpeedRejectionMessageForClip(i18nT, clip, name)` — hàm đã
  có sẵn, test D8/D10/D12 khóa sẵn câu chi tiết. T3 KHÔNG tự sửa
  notify store hay panel vì ngoài phạm vi sở hữu (panel đang do luồng
  T4 giữ trong đợt 21, sửa cùng lúc dễ xung đột gộp); parent/T4 nối
  dây khi gộp. Test S6 khóa đúng hành vi hiện tại (toast lý do chung)
  để lần nối dây sau phát hiện được thay đổi.
- **Comment cũ trong panel và store nay lỗi thời ở phần curve.**
  Comment đợt 18 ở `NestedClipPanel.tsx` (~dòng 25: "nested clip mang
  speedKeyframes hoặc reverse sẽ bị split/trim từ chối vì render cấm
  cả hai") và comment cổng pre-field ở `store.ts`
  (`nestedSplitTrimGatePasses`) vẫn mô tả điều kiện cũ — phần reverse
  vẫn đúng, phần curve nay chỉ đúng khi curve không hợp lệ. T3 không
  sửa hai file đó ngoài reason action (theo phân công luồng); parent
  rà lại comment khi gộp. Logic thì đã đúng vì cả hai đều gọi detector
  chung mới.
- **Shape legacy {time, speed} KHÔNG được coi là hợp lệ.** Test cũ
  G3 dùng curve `{time, speed}` (không phải `{t, v}` chuẩn của
  SpeedCurve); detector mới xếp nó vào curveShape nên các case S1/T1/
  M1 của test G3 vẫn xanh với lý do "sai hình dạng" (trước đây xanh với
  lý do "mang speedKeyframes"). Nếu có đường sản xuất curve nào thật
  sự sinh shape {time, speed} thì nó đang bị từ chối ở cả tầng thuần
  lẫn render — cần luồng sở hữu producer đó chuẩn hoá về {t, v}, không
  phải detector nới lỏng (nới lỏng sẽ lệch render).
- **Detector không xét lá bên trong, hai tầng, attachment, opacity.**
  Chỉ xét hình dạng + tích phân + cửa sổ trim của chính nested clip
  ngoài cùng. Hai tầng là việc của cổng `checkTwoLevelOuterCurve`
  (xem §4), lá reverse/attachment là việc của render/patchClip — một
  nested mang ramp hợp lệ nhưng lá trong vi phạm render vẫn bị render
  từ chối sau đó, detector không hứa "render được".
- **Panel CHƯA click-test trên browser thật** (như mọi đợt: repo không
  có DOM test runner). Phần UI chỉ kiểm chứng bằng tsc + build.
- **`dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage.**

## 4. Tương tác với luồng T2 cùng đợt (ghi chú gộp quan trọng)

Trong lúc T3 chạy, luồng T2 (đợt 21) cũng sửa cùng hàm
`patchNestedCurveFixedTrim` trong `store.ts`: cổng hai tầng cũ ("lá
con có curve là từ chối") đổi thành `checkTwoLevelOuterCurvePure`
(chỉ từ chối cặp vi phạm luật render R1; cặp hợp lệ như lá hằng 1 ×
ngoài 1→2 được cho qua). T2 đã giữ nguyên phần reasonKey/i18nT của
T3 ở 3 nhánh còn lại, chỉ thay nhánh hai tầng (thêm hậu tố lý do chi
tiết của cổng kiểm tra vào sau reason). Hệ quả T3 đã thích ứng trong
test của mình, parent cần biết khi gộp:

- Case từ chối hai tầng của T3 nay dùng lá hằng 4 × ngoài 1→2 (hợp tới
  8 > 4) thay vì lá hằng 1 (nay là cặp hợp lệ, action trả ok:true).
  Reason vi của nhánh này nay BẮT ĐẦU BẰNG chuỗi hardcode cũ rồi gắn
  thêm lý do chi tiết — không còn bằng đúng từng ký tự. Ba nhánh còn
  lại (khóa / không phải nested / không tính được) vẫn bằng đúng từng
  ký tự, test R1/R2/R4 khóa.
- Case "không tính được" của T3 nay dùng trim hẹp 0.15s (duration tính
  ra ≈ 0.147s < 0.2s) thay vì curve rỗng — vì cổng T2 chặn curve ngoài
  không hợp lệ TRƯỚC nhánh uncomputable nên curve rỗng nay trả
  reasonKey fixedTrimTwoLevel, không tới được nhánh uncomputable.
- **Lý do chi tiết của cổng T2 vẫn hardcode tiếng Việt** trong
  nestUtils nên reason tiếng Anh của nhánh hai tầng hiện lẫn tiếng
  Việt ở đuôi (tiền tố tiếng Anh đúng, hậu tố tiếng Việt). Đó là nợ
  của T2 (i18n hoá lý do của `checkTwoLevelOuterCurve`), không thuộc
  phạm vi reason action của T3 và T3 không sửa nestUtils.
- **4 case test cũ fail do cổng T2, KHÔNG do T3** (T3 không đụng
  patchClip hay cổng hai tầng): `store.nestedCurve19` S4 (đã được T2
  đổi tên kỳ vọng thành "cho phép" nhưng vẫn fail ở undoDepth: spec
  đổi đúng trim.out 6 nhưng undoDepth không tăng — nghi đường patchClip
  cho qua không sinh entry undo, cần T2 kiểm tra); `store.nestedCurve20R4`
  E1/V2/A2 (đều kỳ vọng cặp lá hằng 1 bị từ chối/toast hai tầng, nay
  cặp đó được cho qua). T3 không sửa các test này vì thuộc phạm vi
  T2; parent chuyển cho T2 cập nhật + điều tra S4.
- T3 không sửa file test cũ nào: test G3 I1 xanh nguyên vẹn nhờ wording
  mới giữ cụm "render worker forbids"/"cấm".

## 5. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- Đổi: `apps/web/src/components/nested/nestedRejection.ts` (viết lại
  detector + thêm API clip-aware; giữ chữ ký cũ tương thích).
- Đổi: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`
  (viết lại `nested.speedRejected` + thêm 13 key: 9 key reason
  `speedRejectedReason*` + 4 key `fixedTrim*`; không sửa câu khác).
- Đổi: `apps/web/src/store.ts` (CHỈ: interface `patchNestedCurveFixedTrim`
  thêm `reasonKey?` + 4 giá trị trả về reason sang i18nT/key + comment
  của action; KHÔNG đổi logic tách/trim/undo, KHÔNG đổi nhánh hai
  tầng của T2).
- Mới: `apps/web/src/store.nestedRejection21T3.test.ts` (test bundle,
  31 case).
- Mới: `docs/PHASE9_ROUND21_T3_DETECTOR_I18N_LIMITS.md` (file này).

KHÔNG ĐỔI (cố tình, theo phân công luồng):
- `NestedClipPanel.tsx` (đang do T4 giữ), `nestedPreview.ts`,
  `nestUtils.ts`, server/render, validator, các test cũ (kể cả 4 case
  fail do T2 — xem §4).
- Không push, không tag/release, không ghi qua GitHub, không stage
  paths-loop, không sửa build-loop-log.md.
