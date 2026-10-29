# Phase 9 đợt 13 — Luồng C5: bezier 4 số + cắt keyframe thừa sau trim (LIMITS)

Ngày: 2026-10-27. Chạy từ cron vcut-build-loop (14:03 +07), luồng C5 trong
đợt lớn đợt 13. KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG sửa
file của luồng khác. Đóng nợ đợt 12 T5 đã ghi: easing bezier chưa có UI
sửa 4 số, keyframe t vượt duration sau trim chưa tự cắt.

## 1. Việc đã làm

### 1a. UI sửa 4 số bezier (SpeedPanel) — áp dụng thật, không chỉ lưu

Điểm keyframe nào có easing `bezier` (và không phải điểm cuối) nay hiện
thêm 4 ô nhập `x1, y1, x2, y2` ngay dưới select easing:

- Validate trước khi ghi: ô trống/chữ → warn `speed.bezierInvalid`,
  giữ giá trị cũ; `x1, x2` ngoài `[0, 1]` → warn `speed.bezierXRange`,
  giữ giá trị cũ; `y1, y2` chỉ cần là số hữu hạn (tự do, xem §2).
- Số hợp lệ làm tròn 2 chữ số thập phân rồi ghi thẳng vào keyframe qua
  `patchClip` (undo/redo hoạt động như mọi patch khác) nên preview
  (`rampSourceTimeAt`) và render (`planSpeedSegments`) đều đọc chung
  đúng mảng đó — không có bản sao riêng cho UI.
- Chuyển easing sang `bezier` mà keyframe chưa có mảng số thì ghi luôn
  mảng mặc định `DEFAULT_SPEED_BEZIER` = CSS ease `[0.25, 0.1, 0.25, 1]`
  (trùng fallback cũ của engine); chuyển đi rồi quay lại bezier thì giữ
  mảng cũ vì `updateKf` không xoá field `bezier` khi đổi easing khác.
- i18n: 5 key mới nhóm `speed` (`bezierHead`, `bezierHint`,
  `bezierXRange`, `bezierInvalid`, `trimCurveDropped`), đủ cả vi/en
  (`r6-i18n-check.cjs` PASS).

### 1b. Trim tự cắt/dịch speed keyframes (store.ts `trimClip`)

Hàm thuần mới `trimSpeedKeyframes(kfs, shift, newDuration)` trong
`packages/video-spec/src/speedcurve.ts` (+ mirror `.js`, xem §4), và
`trimClip` gọi nó ở cả 3 nhánh (trái / phải thường / phải ripple):

**Ngữ nghĩa đã chọn (đã kiểm tra code trim hiện tại, không đoán):**
keyframe `t` là thời gian OUTPUT tính từ đầu clip (ghi rõ trong
`speedcurve.ts`), còn `trimLeftTo`/`trimRightTo` trong `speed.ts` chỉ
dịch `start`/`duration`/`in`/`out` theo timeline — vì vậy trim chỉ dịch
gốc output, không rescale đường cong:

- Trim mép TRÁI: gốc output dịch đi `shift = newStart - oldStart`
  (dương = cắt đầu, âm = kéo dài sang trái) → mọi keyframe dịch
  `t' = t - shift`; điểm nào rơi trước 0 thì bị cắt. Mẫu này khớp
  `shiftKaraoke` (dịch từ theo shift, từ rớt khỏi đầu thì bỏ).
- Trim mép PHẢI: gốc không đổi (`shift = 0`), chỉ thu duration →
  điểm nào có `t' > newDuration` thì bị cắt. Mẫu này khớp `clampKaraoke`.
- Điểm nằm trong sai số EPS (1e-9) quanh biên thì kẹp về biên thay vì
  cắt oan do float; nếu kẹp làm 2 điểm trùng `t` thì điểm sau thắng
  theo `normalizeSpeedKeyframes` (đếm vào `dropped`).
- KHÔNG tự thêm điểm biên mới: sau trim phải, tốc độ ngoài điểm cuối
  được `speedAt` clamp về giá trị biên nên curve vẫn đúng; sau trim
  trái kéo dài, đoạn đầu mới cũng clamp về điểm đầu. Tránh tăng số
  điểm lặng lẽ sau mỗi lần trim.
- Hết điểm thì bỏ luôn field `speedKeyframes` (patch `undefined`, cùng
  mẫu nút "Tắt speed curve").

**Báo cho user (đã chọn toast, không log lặng):** mỗi lần `trimClip`
làm rớt ≥ 1 điểm thì hiện 1 toast
`speed.trimCurveDropped` ("Đã cắt {n} điểm speed curve vượt khỏi clip
sau khi trim — các điểm còn lại giữ nguyên."). Toast đặt SAU
`execCommand`, không trong `apply` (apply phải pure; kéo trim gọi
apply liên tục nên toast trong apply sẽ spam mỗi pointermove). Mỗi
điểm rớt chỉ báo đúng một lần; kéo trim qua nhiều điểm thì mỗi điểm
báo một toast khi nó vừa rớt.

## 2. Sửa hiểu lầm về bezier: y tự do, không phải tất cả trong [0, 1]

Comment cũ trong `speedcurve.ts` ghi "tất cả phải nằm trong [0, 1]" và
validator render (`server/render/src/validate.js`) cũng chặn cả 4 số
trong `[0, 1]` — cả hai đều SAI so với chuẩn cubic-bezier của CSS, vốn
chỉ ràng buộc `x1, x2 ∈ [0, 1]` còn `y1, y2` tự do (y ngoài [0, 1] tạo
overshoot). Công thức `cubicBezierY` vốn đã xử lý đúng y ngoài [0, 1]
nên không đổi công thức; chỉ sửa comment + validator thành: 4 số hữu
hạn, `x1, x2 ∈ [0, 1]`, `y1, y2` tự do. Nhờ vậy project có bezier
overshoot hợp lệ không còn bị validator đánh trượt dù engine đánh giá
đúng — trước đợt này UI cũng không tạo được bezier có y ngoài [0, 1]
nên mâu thuẫn này chưa từng lộ ra.

## 3. Kiểm chứng thật (không click-test — ngoài phạm vi luồng này)

| Kiểm chứng | Kết quả | Số đo thật |
|---|---|---|
| Test mới `apps/web/src/components/speed/speedcurveTrim.test.ts` | **18 pass, 0 fail** | xem dưới |
| `npx tsc --noEmit` (apps/web) | PASS, 0 lỗi | (file test mới được thêm vào exclude của tsconfig theo đúng quy ước mọi `*.test.ts` khác, vì chúng chạy bằng node type-stripping) |
| `npx vite build` | PASS | 7.40s |
| `r6-i18n-check.cjs` | PASS | vi/en đủ key |
| `server/render/test_p3.js` (hồi quy P3 sau khi sửa validator) | **73 pass, 0 fail, 0 skip** | gồm parity TS↔JS↔render |
| Render thật CLI với curve bezier overshoot `[0.25, 2, 0.75, -1]` 1→2 trên 4s | exit 0, output đúng 4.000s | validator chỉ warn thông tin nguồn tiêu thụ ∫speed = 6.000s, không lỗi |

Các case chính trong test mới (18 case):

- Bezier: CSS ease tại p=0.5 → y ≈ 0.8024 (giá trị CSS ease quen
  thuộc); overshoot `[0.25, 2, 0.75, -1]` tại p=0.25 → y ≈ 0.7235
  (vượt xa 0.25 — chứng tỏ y=2 được áp dụng thật, không bị kẹp);
  `speedAt` với đoạn bezier 1→3 tại t=1 → ≈ 2.447; đầu/cuối đoạn
  p=0/1 → 0/1 kể cả y ngoài [0, 1].
- Trim phải: cắt điểm t > duration mới, giữ điểm trong vùng; điểm
  đúng tại duration mới thì giữ (không cắt oan); cắt hết → rỗng.
- Trim trái: shift 1s trên clip 4s → điểm @0/@0.5 rớt, @2→@1, @4→@3,
  giữ nguyên v/easing/bezier của điểm còn lại; kéo dài (shift −1)
  chỉ dịch phải, không cắt.
- Trim không chạm curve → `changed=false`, mảng giữ nguyên.
- Validator: bezier y ngoài [0, 1] → ok; x1=1.5 → lỗi; thiếu mảng
  bezier → lỗi.
- Project cũ: easing bezier không kèm mảng → vẫn dùng đúng
  `DEFAULT_SPEED_BEZIER` (không đổi hành vi cũ).
- Parity TS↔JS: `trimSpeedKeyframes` bản `.ts` và mirror `.js` cho
  kết quả giống hệt trên 4 case (trái/phải/kéo dài/bezier).

## 4. Vì sao sửa cả 2 file speedcurve (.ts + .js)

`packages/video-spec/src/index.ts` re-export từ `./speedcurve.js`
(mirror ESM), không phải từ `.ts` — nên app web import
`trimSpeedKeyframes`/`DEFAULT_SPEED_BEZIER` từ `@repo-1/video-spec`
thực chất chạy code mirror `.js`. Đợt này thêm hàm + hằng vào CẢ hai
file với cùng logic, và test parity ở §3 khóa hai bản lại với nhau.
`server/render/src/speedramp.js` (mirror phía render) KHÔNG sửa vì
render không bao giờ trim — nó chỉ tiêu thụ curve cuối cùng; công
thức bezier của nó đã đúng với y ngoài [0, 1] từ trước.

## 5. Giới hạn trung thực — những gì CHƯA xong

- **Clip audio:** ĐÃ bao phủ, không phải giới hạn — `isSpeedable`
  nhận cả video và audio nên `trimClip` cắt/dịch curve cho audio
  bằng đúng hàm này (SpeedPanel đợt 12 T5 cũng đã dùng chung cho cả
  hai). Chưa có test render riêng cho audio ramp sau trim.
- **Clip lồng nhau (nested):** CHƯA làm — clip lá trong nested clip
  được trim bằng đường riêng của `nestUtils` (không qua `trimClip`
  generic), nên `speedKeyframes` của clip lá không được cắt/dịch khi
  trim từ ngoài. Nằm ngoài phạm vi luồng này (cấm đụng file luồng
  khác) — cần một luồng riêng nếu muốn bao phủ nested.
- **Split:** CHƯA làm — `splitAtPlayhead` không tách `speedKeyframes`
  theo điểm cắt (clip phải sau split giữ nguyên curve cũ, tính theo
  gốc output cũ nên sai). Đã ghi vào comment đầu SpeedPanel.
- **in/out dưới ramp:** `trimLeftTo`/`trimRightTo` tính `in`/`out`
  bằng tốc độ HẰNG (`sourceTimeAt`) kể cả khi clip có curve, nên
  `in`/`out` sau trim của clip có ramp có thể lệch so với tích phân
  đường cong. Keyframe `t` (theo thời gian output) thì đã đúng; render
  ramp dùng `in + ∫speed` và bỏ qua `out` (validator chỉ warn) nên
  hậu quả thực tế giới hạn ở `in` lệch — nhưng vẫn là nợ, cần sửa
  `trimLeftTo`/`trimRightTo` dùng tích phân ramp thay vì tốc độ hằng.
- **Đổi duration ngoài trimClip:** đổi tốc độ hằng ở SpeedPanel
  (`applySpeed` patch `duration`) hoặc `patchClip` trực tiếp không
  qua `trimClip` thì curve KHÔNG được cắt/dịch — curve vượt duration
  mới chỉ được preview/render clamp lặng lẽ như trước đợt này.
- **Toast và undo:** undo khôi phục curve gốc (snapshot của command)
  nhưng toast đã hiện thì không thu hồi — toast là thông báo thoáng
  qua, không phải trạng thái, nên chấp nhận được.
- **Không click-test UI mới:** luồng này cấm đụng click-test; 4 ô
  bezier và toast trim chỉ được kiểm chứng ở mức logic + build (ô
  nhập render theo cùng mẫu các control keyframe đã click-test ở
  đợt 12 T5). Luồng click-test sau nên bấm thật: nhập x1=1.5 → warn
  và giữ số cũ; nhập y1=2 → ghi và preview/render theo overshoot;
  trim phải qua điểm cuối → toast hiện đúng 1 lần với số điểm đúng.
- `dist/` được tái tạo bởi `vite build` để kiểm chứng — là build
  artifact, KHÔNG đưa vào batch stage.
