# Phase 9 đợt 14 — Luồng R5: trim/split/in-out cho nested + speedcurve (LIMITS)

Ngày: 2026-10-27. Chạy từ cron vcut-build-loop (20:03 +07), luồng R5 trong
đợt lớn round 14 (chủ đề: preview–render parity vòng 5, đóng nợ đợt 13).
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG tạo file stage
paths-loop riêng (parent gộp batch). Đóng nợ đợt 13 C5 đã ghi: nested
chưa làm, split chưa tách curve, in/out dưới ramp còn dùng tốc độ hằng.

## 1. Việc đã làm

### 1a. Hàm thuần mới trong speedcurve (.ts + mirror .js, parity đã khóa)

- `sliceSpeedKeyframes(kfs, from, to)`: cắt đoạn [from, to) của đường
  cong và rebase về 0. Mọi keyframe kết quả đều nằm trong
  [0, visibleDuration] — bắt buộc vì validator render
  (`server/render/src/validate.js`) chặn mọi keyframe có t ngoài
  [0, duration], nên không thể giữ keyframe âm hay vượt duration để
  "giữ nguyên tham số đoạn" như một cách làm khác.
- `splitSpeedKeyframes(kfs, splitT, totalDuration)`: nửa trái =
  slice [0, splitT), nửa phải = slice [splitT, totalDuration).
- `visibleSpeedKeyframes(kfs, leafStart, leafDuration, winIn, winOut)`:
  curve khả kiến của clip lá dưới cửa sổ trim ngoài; lá bị cắt hết
  hoặc không có curve → null (giống flatten bỏ lá có giao rỗng).
- `rampTrimLeftIn(in0, curve, shift)` / `rampTrimRightOut(in0, curve,
  newDuration)`: in/out theo tích phân ramp (newIn = in + ∫speed trên
  [0, shift), newOut = in + ∫speed trên [0, newDuration)); mở rộng
  sang trái thì tốc độ clamp về keyframe đầu.
- `outputDurationForSource(curve, srcLen)`: đảo tích phân ramp bằng
  chia đôi (sourcePosAt đơn điệu tăng khi tốc độ >= 0) — dùng để chặn
  trim phải khỏi đọc quá cuối file nguồn.

### 1b. Độ đúng đắn của slice/split — nói rõ, không nhận vơ

- Linear: đúng hệt cả hai phía. Bezier: đúng hệt cả hai phía nhờ chia
  nhỏ cubic-bezier bằng thuật toán de Casteljau (`subdivideBezier`):
  đoạn con được chuẩn hoá lại về [0, 1] × [0, 1] nên engine đánh giá ra
  đúng giá trị gốc (sai số đo được ~1e-5 chỉ là ngưỡng solver của
  chính engine cubicBezierY, test dùng ngưỡng 1e-4 cho bezier).
- Ease-in: đúng hệt phía trái, gần đúng phía phải. Ease-out: đối
  xứng (đúng hệt phía phải, gần đúng phía trái). Sai số phía gần đúng
  tối đa 0.125 × |Δv| của đoạn (chứng minh bằng công thức, test khóa
  chặn 0.13 × |Δv|). Muốn đúng tuyệt đối cho hai trường hợp này cần
  thêm kiểu easing đa thức bậc 2 (xem §3).
- Trường hợp suy biến của subdivide (đoạn con có bề rộng x hoặc cao y
  ≈ 0, ví dụ bezier phẳng tại điểm cắt): trả null và slice giữ bezier
  gốc làm gần đúng — vẫn tốt hơn để trống mảng bezier (khi đó engine
  rơi về CSS ease mặc định, sai hẳn). Chưa có test riêng cho đường này
  (khó dựng bezier suy biến mà vẫn qua validator); ghi nhận ở §3.

### 1c. Nối vào store.ts (split + trim)

- `splitClipAt` (video + audio): clip có speedKeyframes và không
  reverse thì điểm cắt nguồn = in + ∫speed trên nửa trái, 2 nửa giữ
  duration output cũ và curve đã chia; `splitClipAtTimes` (SceneModal,
  BeatSyncModal) hưởng ké vì dùng chung hàm này.
- `trimClip` mép trái: in theo `rampTrimLeftIn` thay cho tốc độ hằng
  của `trimLeftTo`; giới hạn mở rộng sang trái = in / speedAt(0)
  (đoạn mở thêm tiêu thụ nguồn với tốc độ keyframe đầu).
- `trimClip` mép phải: out theo `rampTrimRightOut`; chặn thêm duration
  bằng `outputDurationForSource` để in + ∫speed không vượt cuối file
  nguồn (áp cho cả nhánh ripple lẫn không ripple vì patch tính chung).
  Lưu ý: snap floor 0.2s sau đó có thể đẩy duration vượt chặn tối đa
  1 frame khi file nguồn gần cạn — chấp nhận được, ghi ở §3.

### 1d. Nối vào nestUtils.ts (nested)

- `leafVisibleSpeedCurveForWindow(leaf, winIn, winOut)` và
  `nestedLeafVisibleSpeedCurve(nested, leaf)`: curve khả kiến của clip
  lá trực tiếp trong một nested clip, dùng trim hiệu dụng của nested
  clip. Đây là hàm TÍNH, không sửa subSpec: trim ngoài là cửa sổ, không
  phải edit phá huỷ clip con — thu hẹp cửa sổ rồi mở lại không mất
  keyframe. Tốc độ của nested clip ngoài chỉ co/giãn vị trí đặt lá,
  không đổi hình dạng đường cong theo thời gian output của lá nên
  không xuất hiện ở đây.
- `updateNestedInnerClip` (sửa clip con từ NestedClipPanel): patch đổi
  hình học kiểu trim thì dịch/cắt curve bằng `trimSpeedKeyframes`
  (shift = dịch mép trái, duration mới); patch kiểu dời thuần (cả hai
  mép dịch cùng một lượng, sai số 1e-9) thì giữ nguyên curve vì curve
  theo thời gian output của clip không đổi; hết điểm thì bỏ luôn field
  `speedKeyframes`. Kết quả trả thêm `curveDropped` (số điểm bị cắt).
  Panel hiện chưa hiển thị số này — xem §3.

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `apps/web/src/components/speed/nestedSpeedcurve.test.ts` | **22 pass, 0 fail** (split/slice/nested-window/ramp/in-out/inner-trim/parity) |
| Test đợt 13 C5 `speedcurveTrim.test.ts` (hồi quy) | **18 pass, 0 fail** |
| Test nested `nestUtils.test.ts` (hồi quy) | **28 pass, 0 fail** |
| `server/render/test_p3.js` (hồi quy P3 sau khi sửa store) | **73 pass, 0 fail, 0 skip** |
| `npx tsc --noEmit` (apps/web) | PASS, 0 lỗi (sau khi sửa: lần chạy đầu lộ 3 lỗi trong file test mới — 2 lỗi TS5097 do import đuôi `.ts` và 1 lỗi cast — đã sửa bằng cách thêm file test vào exclude của tsconfig theo đúng quy ước mọi `*.test.ts` khác + cast qua `unknown`; xem §4) |
| `npx vite build` | PASS (30.05s) |

Số đo thật đáng chú ý (đo bằng script, không đoán):
- Slice bezier overshoot `[0.25, 2, 0.75, -1]` sau khi chia de
  Casteljau: sai số đánh giá tối đa ~1.4e-5 (ngưỡng solver engine).
- Slice ease-out phía trái / ease-in phía phải: sai số tối đa đo được
  0.244 với Δv = 2, tức tỉ lệ 0.122 — trong chặn lý thuyết 0.125.
- Trước đợt này, split một clip có curve giữ nguyên curve cũ theo gốc
  output cũ nên nửa phải đánh giá sai hoàn toàn (không chỉ lệch nhỏ);
  sau đợt này nửa phải đúng như trên.

Hạn chế của kiểm chứng: store.ts không import được dưới Node trần
(import không đuôi mở rộng chỉ Vite mới phân giải) nên phần nối store
(splitClipAt, patch in/out của trimClip) chỉ được kiểm chứng bằng tsc
+ vite build, KHÔNG có test chạy qua store thật — cùng mẫu đợt 13 C5.
Phần thuần (hàm mới + updateNestedInnerClip) thì có test chạy thật.

## 3. Giới hạn trung thực — những gì CHƯA xong

- **Nested sâu hơn 1 cấp:** helper chỉ làm 1 tầng. Muốn hợp cửa sổ qua
  nhiều tầng thì áp dụng công thức của flatten: cửa sổ tầng ngoài
  [vLo, vHi) trong subSpec của tầng đó, giao với
  [child.start, child.end), rồi map sang subSpec của clip con bằng
  τ = child.trim.in + (t − child.start) × child.speed, giao tiếp với
  trim của clip con, lặp lại; cuối cùng gọi
  `leafVisibleSpeedCurveForWindow` với cửa sổ cuối cùng. Chưa cài đặt
  hàm đệ quy này, chưa có test cho nó.
- **Ease-in phía phải / ease-out phía trái:** gần đúng, chặn trên
  0.125 × |Δv| (xem §1b). Cần kiểu easing đa thức bậc 2 mới đúng tuyệt
  đối — ngoài phạm vi đợt này.
- **Subdivide suy biến:** bezier phẳng tại điểm cắt (đoạn con có bề
  rộng x hoặc cao y ≈ 0) thì fallback về bezier gốc (gần đúng), chưa
  có test riêng cho đường này.
- **Reverse + speedKeyframes:** vẫn giữ đường tốc độ hằng cũ ở cả
  split lẫn trim (validator cấm kết hợp này nên project hợp lệ không
  đi vào đường đó; project không hợp lệ vẫn bị validator chặn như cũ).
- **Đổi duration qua patchClip trực tiếp** (không qua trimClip, ví dụ
  SpeedPanel đổi tốc độ hằng): curve KHÔNG được cắt/dịch — nợ cũ từ
  đợt 13 C5, vẫn còn.
- **in/out của clip con trong nested:** `updateNestedInnerClip` vốn
  chỉ đổi start/duration mà không đổi in/out của clip con (nợ có sẵn,
  không phải do đợt này gây ra); curve thì đợt này đã cho đi theo
  duration mới, nhưng in/out của clip con vẫn lệch nếu ai đó dựa vào
  chúng — cần một đợt riêng nếu muốn sửa bất biến in/out ở tầng này.
- **Panel chưa báo số điểm curve bị cắt:** `updateNestedInnerClip`
  đã trả `curveDropped` nhưng store wrapper trả boolean nên số này
  chưa tới được NestedClipPanel; user sửa clip con làm rớt điểm curve
  sẽ không thấy thông báo (khác với trimClip ngoài timeline có toast).
- **Split clip có curve + transition:** splitClipAt vẫn zero transition
  qua điểm cắt như trước (hành vi cũ, không đổi); chưa có test riêng
  cho tổ hợp curve + transition qua điểm cắt.
- **Không có test render thật** cho clip đã split/trim theo ramp (chỉ
  test logic + validator range): render MP4 của nửa clip sau split
  theo ramp là việc của luồng render, không thuộc phạm vi luồng này.
- **Không click-test UI:** không có thay đổi UI trong đợt này nên
  không phát sinh nhu cầu click-test mới; hành vi store chỉ kiểm
  chứng ở mức tsc + build như đã nói ở §2.
- `dist/` được tái tạo bởi `vite build` để kiểm chứng — là build
  artifact, KHÔNG đưa vào batch stage.

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `packages/video-spec/src/speedcurve.ts` (+ mirror
  `packages/video-spec/src/speedcurve.js`): slice/split/visible/ramp/
  outputDurationForSource + subdivideBezier.
- `apps/web/src/store.ts`: splitClipAt theo ramp; trimClip in/out theo
  ramp + chặn cuối file theo ramp (cả 2 nhánh ripple/không ripple).
- `apps/web/src/components/nested/nestUtils.ts`: helper curve khả
  kiến + trim curve cho clip con + `curveDropped`.
- `apps/web/src/components/speed/SpeedPanel.tsx`: chỉ sửa comment nợ
  cũ cho khớp trạng thái mới (không đổi logic UI).
- `apps/web/src/components/speed/nestedSpeedcurve.test.ts`: test mới
  (22 case).
- `apps/web/tsconfig.json`: thêm file test mới vào exclude (đúng quy
  ước mọi `*.test.ts` khác — test chạy bằng node type-stripping, tsc
  không kiểm tra chúng).
- `docs/PHASE9_ROUND14_R5_NESTED_SPEEDCURVE_LIMITS.md`: file này.
