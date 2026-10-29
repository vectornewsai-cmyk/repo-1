# Phase 9 đợt 20 — Luồng R4: UI cho nested curve + i18n toast G2 — LIMITS

Ngày: 2026-10-29. Luồng R4 trong đợt lớn round 20.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop, KHÔNG sửa build-loop-log.md
(parent gộp batch — theo luật luồng).

Đóng nợ đợt 19 G2 §3: action `patchNestedCurveFixedTrim` đã có nhưng
chưa panel nào gọi; 3 câu toast G2 hardcode tiếng Việt.

## 1. Việc đã làm

### 1a. Vị trí panel: NestedClipPanel, KHÔNG phải SpeedPanel (sửa nhận định G2)

LIMITS G2 viết "SpeedPanel đặt curve qua patchClip, không loại trừ
nested clip" — ở tầng store thì đúng (patchClip không loại trừ
nested), nhưng ở tầng UI thì SAI: `SpeedPanel` tự return null với
nested (`isSpeedable` chỉ nhận video/audio) và `Inspector` chỉ mount
nó trong nhánh video/audio. Nested clip đang chọn không bao giờ thấy
editor curve ở SpeedPanel. Vì vậy block chế độ đặt ở panel liệt kê
nested clip mới là đường UI thật, đúng thứ tự ưu tiên của nhiệm vụ
(ưu tiên NestedClipPanel).

### 1b. Block chọn chế độ trong NestedClipPanel (NestedCurveModeEditor)

Mỗi item nested clip ĐÃ mang curve (duck-typed `speedKeyframes`
không rỗng) hiện thêm block, dưới dòng cảnh báo tách/trim:

- Hai lựa chọn rõ ràng, radio, mặc định giữ duration:
  - "Giữ duration, tính lại trim.out theo tích phân" (đúng patchClip
    hiện tại) — key `nested.curveModeFixedDuration`.
  - "Giữ trim, tính lại duration" (gọi action
    `patchNestedCurveFixedTrim` có sẵn từ G2) — key
    `nested.curveModeFixedTrim`.
- Hiển thị TRƯỚC khi áp (dòng hiện tại + dòng kỳ vọng, key
  `nested.curveModeCurrent` / `curveModePreviewDuration` /
  `curveModePreviewTrim`): giữ duration → trim.out mới; giữ trim →
  duration mới. Giá trị tính bằng đúng helper thuần mà action dùng
  (`nestedCurveExpectedOut` / `applyNestedCurveFixedTrim` từ
  `nestUtils.ts`), không tự tính lại tích phân ở panel nên không có
  hai bản lệch nhau. Đổi chế độ chỉ đổi preview, không tự áp.
- Nút "Áp curve theo chế độ đã chọn" (key `nested.curveModeApply`):
  giữ trim → `patchNestedCurveFixedTrim`; giữ duration →
  `patchClip` với curve. Cả hai đều 1 bước undo như mọi action panel.
- Xử lý lỗi KHÔNG im lặng (bài học curveDropped trước đợt 16):
  - Lỗi action giữ trim (`ok:false`) → toast error với đúng reason
    + dòng msg (test A2 khóa reason khác rỗng).
  - Xung đột hai tầng → kiểm tra trước bằng
    `nestedSubtreeHasSpeedCurve` rồi toast key `nested.curveTwoLevel`
    + msg (patchClip trả 0 cả khi bị từ chối lẫn khi thành công
    không rơi keyframe nên panel không phân biệt được bằng giá trị
    trả về — kiểm tra trước để khỏi báo "đã áp" sai).
  - Track khóa → kiểm tra trước rồi toast key `nested.lockedTrack`
    có sẵn + msg (patchClip trả 0 im lặng khi track khóa).
  - Đã khớp giá trị kỳ vọng (chênh ≤ 1e-9) → không gọi store (tránh
    entry undo không đổi gì), báo key `nested.curveModeAlreadyOk`.
- BẮT BUỘC copy curve khi áp giữ duration: `patchClip` có cổng
  no-change so sánh tham chiếu (`rec[k] !== prec[k]`) nên truyền
  đúng object curve của clip sẽ bị nuốt im lặng (return 0, không
  exec, trim.out không tính lại). Panel truyền bản copy nông
  (`{...curve, keyframes: map(...)}`); test C1 khóa hành vi này ở
  tầng store (cùng tham chiếu → trim.out lệch giữ nguyên 5; bản
  copy → trim.out thành 6).

### 1c. 3 toast G2 sang i18n vi+en (store.ts, chỉ đổi câu báo)

- `nested.curveTwoLevel` — xung đột hai tầng (patchClip fail-fast).
- `nested.curveIntegralMismatch` — lệch tích phân, biến `{name}`,
  `{actualOut}`, `{expectedOut}` (số làm tròn 3 chữ số như hàm `fmt`
  cũ nên câu tiếng Việt ra đúng từng ký tự, test V1 khóa).
- `nested.curveOverSource` — vượt nguồn, biến `{name}`,
  `{expectedOut}`, `{sourceDuration}`.
- Bản tiếng Anh dịch đủ nội dung cảnh báo (không rút gọn lý do):
  two-level merge chưa hỗ trợ / render từ chối / đuôi có thể không
  có hình. Test E1–E3 (lang en) khóa: có câu tiếng Anh, không rò
  key thô, không rò biến `{...}` chưa thay.
- Quét parity toàn bộ dict (mẫu G3): vi-only = [], en-only = [].
- 15 key mới đều thuộc `nested.*`: 3 key toast store + 12 key UI
  block chế độ (`curveModeHead/FixedDuration/FixedTrim/Note/
  Current/PreviewDuration/PreviewTrim/PreviewFail/Apply/ApplyOk/
  AlreadyOk/ApplyFail` — ApplyFail chỉ là fallback khi action trả
  reason rỗng, chưa từng xảy ra với action hiện tại).

### 1d. KHÔNG sửa wording key nested.speedRejected (theo nhiệm vụ §c)

Key `nested.speedRejected` của G3 giữ nguyên từng chữ, dù G2 §3 đã
ghi nó lỗi thời ("render cấm speedKeyframes" — thực tế chỉ reverse
là render cấm, curve là split/trim từ chối vì thiếu ánh xạ τ).
Parent cần đối chiếu lại wording này SAU KHI luồng split/trim đợt 20
xong (luồng đó đang thay đổi hành vi tách/trim, sửa wording trước
lúc đó có thể lệch với hành vi cuối).

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `store.nestedCurve20R4.test.ts` (esbuild bundle + node) | **12 pass, 0 fail** (P1–P3 preview thuần; E1–E3 toast en; V1–V2 toast vi giữ nguyên câu gốc; A1–A2 action giữ trim; C1a–C1b cổng no-change) |
| Hồi quy `store.nestedCurve19.test.ts` (bundle) | **8 pass, 0 fail** |
| Hồi quy `store.nestedTimelineToast.test.ts` (bundle) | **16 pass, 0 fail** |
| Quét parity i18n vi/en (script Python duyệt toàn bộ dict) | vi-only [], en-only [] |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (file test mới không cần thêm vào exclude — viết sạch kiểu như file guard/curve19) |
| `npx vite build` (apps/web) | **pass** (5.08s; chỉ warning chunk > 500kB có sẵn từ trước) |

## 3. Giới hạn trung thực — những gì CHƯA xong / lưu ý gộp đợt

- **Panel CHƯA click-test trên browser thật.** Repo không có DOM
  test runner (không vitest/jsdom/testing-library) nên radio/preview/
  nút áp của `NestedCurveModeEditor` chỉ được kiểm chứng gián tiếp
  qua test store + helper thuần mà panel gọi (đúng mẫu nợ G3 §3.3).
  Đừng mạo nhận phần UI này đã chạy thật trên DOM.
- **Tạo curve MỚI cho nested từ UI vẫn chưa có.** Block chỉ hiện
  khi nested clip ĐÃ mang curve (ví dụ từ project import hoặc đường
  khác); chưa có editor tạo curve lần đầu cho nested trong panel.
  Nhiệm vụ đợt này là "lựa chọn chế độ cho nested mang curve" nên
  phạm vi này đúng — nhưng user chưa có đường UI nào tạo curve cho
  nested từ số 0 (SpeedPanel vẫn không mount cho nested, xem §1a).
  Đây là nợ mở tiếp theo, không phải đã đóng.
- **Reason của action giữ trim vẫn hardcode tiếng Việt.** Các reason
  trả về của `patchNestedCurveFixedTrim` ("Track đang khóa.",
  "không phải nested", "hai tầng", "không tính được duration") là
  GIÁ TRỊ TRẢ VỀ, không phải toast store, nên đợt này giữ nguyên
  theo phạm vi nhiệm vụ (chỉ 3 toast patchClip sang key); test S6
  của G2 còn khóa substring "hai tầng" trong reason. Hệ quả: ở
  locale en, toast lỗi của nút áp giữ trim vẫn hiện tiếng Việt.
  Cần một đợt i18n riêng cho reason action (đổi cả test S6) nếu muốn
  sạch hẳn.
- **Nút áp giữ duration vẫn có một cửa sổ đua nhỏ:** panel kiểm tra
  track khóa + xung đột + đã khớp TRƯỚC khi gọi, nhưng clip bị xóa
  giữa lúc bấm và lúc exec thì `patchClip` vẫn trả 0 im lặng (panel
  sẽ báo "đã áp" sai). Trường hợp này cần xóa clip đúng khoảnh khắc
  bấm nút nên thực tế không đáng kể; không thêm state theo dõi cho
  nó trong đợt này.
- **Mode là state cục bộ của từng item panel** (mặc định giữ duration
  mỗi lần mount lại). Không lưu vào project — đúng vì chế độ chỉ là
  cách áp, không phải thuộc tính clip.
- **`dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage.**
- **Rủi ro gộp song song:** đợt 20 có nhiều luồng cùng sửa `store.ts`
  và `i18n/*.json`; các sửa của luồng này đều khớp exact-text tại
  thời điểm sửa (3 toast G2 + comment, key chèn sau
  `speedRejectedFixCurve`). Parent gộp cần kiểm tra lại 3 vị trí
  toast và key `nested.curve*` sau khi gộp, phòng luồng khác sửa
  cùng dòng.

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- Đổi: `apps/web/src/store.ts` (CHỈ: 3 toast G2 sang key i18n +
  cập nhật comment đã lỗi thời về hardcode; KHÔNG đổi logic tách/
  trim/undo, KHÔNG đổi reason của action giữ trim).
- Đổi: `apps/web/src/components/nested/NestedClipPanel.tsx` (thêm
  `NestedCurveModeEditor` + render trong mỗi item; chỉ thêm import
  helper thuần + type, không đổi logic panel cũ).
- Đổi: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`
  (CHỈ thêm 15 key `nested.curve*`; KHÔNG sửa key cũ, kể cả
  `nested.speedRejected`).
- Mới: `apps/web/src/store.nestedCurve20R4.test.ts` (test bundle,
  12 case).
- Mới: `docs/PHASE9_ROUND20_R4_NESTED_CURVE_UI_LIMITS.md` (file này).

KHÔNG ĐỔI (cố tình, theo phân công luồng):
- `nestUtils.ts`, `nestedPreview.ts`, server/render, validator,
  `SpeedPanel.tsx` (không mở SpeedPanel cho nested trong đợt này —
  đó là quyết định phạm vi, xem §1a/§3).
- Không push, không tag/release, không ghi qua GitHub, không stage
  paths-loop, không sửa build-loop-log.md.
