# Phase 9 đợt 16 — Luồng H3: curveDropped lên timeline chính + patchClip, bezier suy biến, ease-in/ease-out đúng hệt (LIMITS)

Ngày: 2026-10-28 (lượt cron 08:03 +07). Luồng H3 trong đợt lớn round 16.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop, KHÔNG sửa build-loop-log.md
(parent gộp batch — theo luật luồng). Chỉ sửa code trong `~/workspace/repo-1`.

Đóng nợ đợt 15 (xem docs/PHASE9_ROUND15_LIMITS.md §3 và
docs/PHASE9_ROUND15_T4_SPLIT_PATCH_LIMITS.md §3):
- curveDropped mới chỉ hiện ở NestedClipPanel; trim/split ở timeline
  chính và patchClip chưa báo rơi keyframe;
- ease-in phải / ease-out trái khi cắt curve chỉ gần đúng trong chặn
  0.125 × |Δv| (thừa hưởng từ slice);
- bezier suy biến fallback chưa có test riêng;
- comment "patchClip chưa cắt curve" trong SpeedPanel nay lỗi thời.

## 1. Việc đã làm

### 1a. curveDropped lên patchClip (mới) — trả về + toast kèm gợi ý Undo
- `store.ts` `patchClip` nay **trả về số keyframe bị cắt** (đổi kiểu
  action từ `void` sang `number`; mọi caller cũ bỏ qua giá trị trả về
  nên không vỡ) và **đẩy toast** `speed.patchCurveDropped` (mới, vi/en)
  với số lượng + gợi ý Undo, theo đúng mẫu NestedClipPanel đợt 15 T6.
- Lát cắt curve tính TRƯỚC `execCommand` (theo mẫu trimClip đợt 13 C5:
  apply dùng đúng lát cắt này, không tính lại) nên toast + giá trị trả
  về khớp đúng với curve đã ghi, và không báo lại khi undo/redo (apply
  không chạy lại). Early return (track khóa, không tìm thấy clip,
  không field nào đổi) trả về 0, không toast.
- Probe qua store thật (bundle esbuild, file tạm đã xóa sau khi chạy):
  patchClip duration 4 → 2.5 trên curve linear 1→2 trả về **1**,
  toast chứa số 1 + chữ "Undo", curve còn đúng 2 điểm; patch kéo dài
  trả về **0**.

### 1b. Timeline chính: trim đã báo từ đợt 13, nay thêm gợi ý Undo; split KHÔNG rơi keyframe nên KHÔNG thêm cảnh báo
- Kiểm tra lại: `trimClip` ở timeline chính ĐÃ báo rơi keyframe bằng
  toast `speed.trimCurveDropped` từ đợt 13 C5 (tiền đề "trim chưa báo"
  của đợt 15 chỉ đúng một nửa). Đợt này chỉ **bổ sung gợi ý Undo** vào
  đúng text toast đó (vi/en), không đổi cơ chế.
- `splitAtPlayhead` / `splitClipAtTimes` dùng `splitSpeedKeyframes`:
  test mới chứng minh **hợp 2 nửa phủ đủ mọi keyframe gốc** (keyframe
  đúng điểm cắt thuộc cả 2 nửa, còn lại thuộc đúng nửa chứa nó) nên
  split không làm mất keyframe nào — thêm cảnh báo ở đây sẽ là báo
  động giả. Kết luận này được ghi rõ, không mạo nhận đã "thêm cảnh
  báo split".
- Ngoại lệ đã biết, ngoài phạm vi (không sửa): clip reverse + curve
  vốn đã bị validator cấm; khi tách, nhánh tốc độ hằng giữ nguyên
  curve cũ qua spread nên 2 nửa mang curve vượt duration mới. Đây là
  hành vi cũ của input vốn đã không hợp lệ, không phải hồi quy của
  đợt này; nếu muốn sạch thì cần chặn tách reverse + curve riêng.

### 1c. Ease-in phải / ease-out trái khi cắt curve: nay ĐÚNG HỆT (không còn là nợ)
- Nguyên nhân chặn cũ: đa thức bậc 2 (p² / 2p−p²) không đóng dưới phép
  dời đoạn. Cách sửa: đoạn bậc 2 bị cắt được **nâng bậc lên bezier
  bậc 3** với x1 = 1/3, x2 = 2/3 (cho x(s) = s đúng hệt) và y1, y2 suy
  từ hệ số bậc 2 đã chuẩn hoá — xem `quadraticPortionBezier` trong
  `speedcurve.ts`. Engine `cubicBezierY` đánh giá ra đúng giá trị gốc.
- Đo trước/sau (cùng case test R5: curve [0,1] → [4,3], cắt tại 1.7,
  quét 201 điểm):
  - ease-in phía phải: **0.244375 → 8.9e-16** (chặn cũ 0.25);
  - ease-out phía trái: **0.244375 → 8.9e-16** (chặn cũ 0.25);
  - ease-in phía trái / ease-out phía phải: vẫn đúng hệt (~1e-16).
- Chỉ đổi nhãn easing khi đoạn thực sự gần đúng: ease-in ở đầu slice
  luôn đổi; ease-out ở đầu slice chỉ khi slice kết thúc trong cùng
  đoạn (kéo dài tới cuối đoạn thì ease-out vốn đã đúng hệt nên giữ
  easing cũ, tránh đổi nhãn thừa); ease-out ở cuối slice khi `to`
  nằm trong đoạn; đoạn phẳng (|Δv| ≈ 0) giữ easing cũ.
- Đổi cả **mirror `.js`** (`packages/video-spec/src/speedcurve.js`) —
  parity TS ↔ JS được test khóa lại (xem §2). Sửa lan tới comment
  trong `store.ts` (splitClipAt) và `nestUtils.ts`
  (leafVisibleSpeedCurveForWindow) vì 2 comment đó từng ghi "gần
  đúng với ease-out" nay đã lỗi thời.

### 1d. Bezier suy biến fallback: test riêng (đóng nợ R5)
- `subdivideBezier` trả null khi đoạn con có bề rộng x hoặc cao y
  ≈ 0 (ngưỡng 1e-12) và slice giữ bezier gốc làm gần đúng — hành vi
  này đã có từ đợt 14 R5 nhưng chưa có test riêng. Nay có 2 test:
  lát cắt hẹp 2e-12 trong đoạn bezier x(s) = s³ (đầu slice) và lát
  cắt [0.5, 2 + 1e-12) (cuối slice) đều giữ nguyên mảng bezier gốc,
  không crash, đánh giá hữu hạn.

### 1e. SpeedPanel: sửa comment lỗi thời
- Khối "CÒN THIẾU" nay ghi đúng trạng thái: patchClip đã cắt curve
  (T4) + báo rơi keyframe (H3); reverse + curve vẫn bị validator cấm;
  nested sâu đã có helper đệ quy (đợt 15 T3) nhưng chưa nối vào store
  cho split/trim thật. Ghi thêm lưu ý: `applySpeed` (tốc độ hằng)
  trên clip có curve nay cũng cắt curve theo duration mới qua
  patchClip — panel vẫn cho thao tác này và toast sẽ báo, chưa chặn
  cứng (quyết định UX để sau, theo gợi ý T4 §3).

## 2. Kiểm chứng thật (Node, FFmpeg không cần vì không đụng render)

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `speedcurveH3.test.ts` | **11 pass, 0 fail** (ease-in phải / ease-out trái đúng hệt, slice trong cùng đoạn, giữ nhãn thừa, đoạn phẳng, 2 fallback suy biến, split không rơi keyframe, dropped patchClip, parity TS↔JS) |
| `nestedSpeedcurve.test.ts` (2 test cũ nay khóa đúng hệt thay vì chặn 0.13) | 22 pass, 0 fail |
| `speedcurveTrim.test.ts` | 18 pass, 0 fail |
| `splitPatch.test.ts` (thuần, gồm parity TS↔JS) | 14 pass, 0 fail |
| `splitPatch.store.test.ts` qua esbuild bundle | 12 pass, 0 fail (S3 patchClip giữ nguyên hành vi cắt curve) |
| Probe patchClip qua store thật (tạm, đã xóa) | 2 pass, 0 fail (trả về 1 / toast Undo / kéo dài trả 0) |
| Hồi quy render P3 `server/render/test_p3.js` | 73 pass, 0 fail, 0 skip |
| `nestedDeep.test.ts` | 16 pass, 0 fail |
| `npx vite build` | pass (8.87s) |
| `npx tsc --noEmit` | **1 lỗi duy nhất, KHÔNG phải của luồng này** (xem §3) |

## 3. Giới hạn trung thực — những gì CHƯA xong / lưu ý gộp đợt

- **tsc chưa sạch do file của luồng khác:** lỗi duy nhất là
  `src/components/speed/nestedStore.test.ts(39,8)` TS5097 (import
  `../nested/nestUtils.ts` có đuôi `.ts` mà không bật
  `allowImportingTsExtensions`). File này thuộc luồng khác trong
  đợt 16 (đang làm dở, chưa có trong exclude của tsconfig như mọi
  `*.test.ts` khác). Luồng này KHÔNG sửa file đó (không revert thay
  đổi của người khác); luồng sở hữu cần thêm nó vào exclude hoặc
  sửa import. Mọi file của luồng H3 đều sạch tsc (không lỗi nào
  khác trong output).
- **Split reverse + curve:** như §1b — input vốn đã bị validator cấm,
  tách giữ nguyên curve cũ qua spread; chưa xử lý riêng.
- **Click-test UI chưa làm:** toast patchClip / trim và cảnh báo panel
  chỉ kiểm chứng bằng tsc + build + test store bundle (theo mẫu các
  đợt trước: repo không có runner test tsx, VM browser không tới
  được dev server). Panel SpeedPanel không đổi hành vi, chỉ đổi
  comment.
- **Nợ đã đóng hết trong phạm vi H3:** không còn nợ ease-in/ease-out
  gần đúng, không còn nợ bezier fallback thiếu test, không còn
  comment SpeedPanel lỗi thời, không còn thiếu cảnh báo patchClip.
  Nợ còn lại thuộc luồng khác: nối helper nested đệ quy vào store
  (T3), harness bars-fade (T2 đợt 15), badge blinds/plus/checker.
- **`dist/` tái tạo bởi vite build** là build artifact, KHÔNG đưa vào
  batch stage. File probe tạm `h3probe.test.ts` và output `/tmp`
  đã xóa sau khi chạy, không thuộc batch.
- **Cây làm việc dùng chung:** trong lúc H3 chạy, luồng H2 đã thêm
  block "Phase 9 đợt 16 H2" vào `patchClip` (trim.out theo duration
  nested clip). H3 giữ nguyên block đó và khai báo `patchRec` mà nó
  dùng chung (chỉ thay khối điều kiện T4 bằng `patchCurveSlice` đã
  tính sẵn); parent gộp batch vẫn nên chạy lại test store sau khi
  mọi luồng xong.

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `packages/video-spec/src/speedcurve.ts` (SỬA): helper
  `quadraticPortionBezier` + đổi ease-in/ease-out bị cắt sang bezier
  nâng bậc trong `sliceSpeedKeyframes`; cập nhật comment slice/split.
- `packages/video-spec/src/speedcurve.js` (SỬA): mirror y hệt
  (helper + logic + comment).
- `apps/web/src/store.ts` (SỬA): `patchClip` trả về số keyframe bị
  cắt + toast sau exec; cập nhật comment splitClipAt. Không đụng
  block H2, không đụng logic T4/T6 khác.
- `apps/web/src/components/speed/SpeedPanel.tsx` (SỬA): chỉ comment
  đầu file (trạng thái patchClip + lưu ý applySpeed trên clip có
  curve); không đổi hành vi panel.
- `apps/web/src/components/nested/nestUtils.ts` (SỬA): chỉ comment
  (ease-in/ease-out nay đúng hệt).
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (SỬA):
  thêm key `speed.patchCurveDropped` (số + gợi ý Undo); bổ sung gợi
  ý Undo vào `speed.trimCurveDropped` sẵn có.
- `apps/web/src/components/speed/speedcurveH3.test.ts` (MỚI):
  11 test (xem §2).
- `apps/web/src/components/speed/nestedSpeedcurve.test.ts` (SỬA):
  2 test ease-in/ease-out cũ nay khóa đúng hệt (1e-4) + cập nhật
  comment đầu file.
- `apps/web/tsconfig.json` (SỬA): thêm file test mới vào exclude
  (theo đúng quy ước mọi `*.test.ts` khác).
- `docs/PHASE9_ROUND16_H3_CURVEDROPPED_LIMITS.md` (MỚI): file này.

KHÔNG đổi: `server/render/`, harness, workflow, binary, file stage
paths-loop, build-loop-log.md. KHÔNG push / KHÔNG release / KHÔNG tag.
