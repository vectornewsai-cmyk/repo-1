# Phase 9 đợt 15 — Luồng T4: split curve + transition, patchClip cắt curve (LIMITS)

Ngày: 2026-10-28 (lượt cron 02:03 +07). Luồng T4 trong đợt lớn round 15.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG đưa `dist/` vào batch.
KHÔNG tự tạo file stage paths-loop riêng (parent gộp batch — theo mẫu R5).
Đóng nợ đợt 14 R5/§3: "split curve + transition chưa có test riêng; chưa có
test render MP4 thật cho nửa clip sau split theo ramp; `patchClip` đổi
duration trực tiếp chưa cắt/dịch curve".

## 1. Việc đã làm

### 1a. Phát hiện khi viết test: split cũ vỡ validator khi nửa mới ngắn hơn transition ngoài
`splitClipAt` (đợt 14 R5) đã giữ đúng VỊ TRÍ transition: nửa trái giữ
transitionIn cũ, nửa phải giữ transitionOut cũ, biên trong về "none". Nhưng
nó không xử lý trường hợp nửa mới NGẮN HƠN transition ngoài — ví dụ clip 4s
có transitionIn 0.5s, tách ở 0.3s từ đầu → nửa trái 0.3s vẫn mang
transitionIn 0.5s. Khi đó project vỡ ở CẢ HAI cổng validator
(`server/render/src/validate.js`):
- cổng per-clip: transitionIn/Out duration không được vượt duration của
  chính clip đó;
- cổng ghép cặp phẳng: hai đầu cùng khai thì duration phải bằng nhau, và
  T = max(outT, inT) không được vượt duration của đầu nào.
Chỉ kẹp phía clip tách thì cặp vẫn lệch; chỉ kẹp phía clip kề thì clip tách
vẫn vi phạm cổng per-clip. Vì vậy đợt này kẹp CẢ HAI đầu của cặp về cùng
giới hạn = duration của nửa mới (xem 1b). Đây là sửa hành vi thật, không
chỉ thêm test — test S2a/S2b chứng minh trước sửa thì validator lỗi, sau
sửa thì pass (xem §2).

### 1b. Helper thuần mới `apps/web/src/lib/splitTransitions.ts`
- `clampSplitOuterTransitions(clips, leftId, rightId)`: kẹp 2 cặp ngoài
  (prev→left về left.duration, right→next về right.duration). Chỉ kẹp xuống,
  không tăng duration, không sửa type, không chạm biên trong, không chạm cặp
  nào khác trên track. Kề nhau khớp trong EPS 1e-6 (cùng EPS validator).
  Cặp một phía (chỉ một đầu khai) vẫn kẹp phía đã khai. Clip tách là clip
  đầu/cuối track vẫn kẹp transition của chính nó (cổng per-clip bắt cả khi
  validator chỉ warn trường hợp transitionIn ở clip đầu track).
- Hàm thuần, không import runtime (chỉ type cấu trúc) nên test chạy trực
  tiếp dưới Node type-stripping; store.ts dùng ĐÚNG hàm này (không mirror).
- Nối vào store.ts ở cả 2 đường tách: `splitAtPlayhead` (cặp left/right) và
  `splitClipAtTimes` (mảnh đầu/mảnh cuối; mảnh giữa vốn không mang transition
  ngoài). Kẹp chạy sau khi chèn cặp tách, trước caption follow; caption
  follow nhận [left, right] bản trước kẹp vì kẹp không đổi id/start/duration.

### 1c. Sửa `patchClip` trong store.ts (đóng nợ đợt 13 C5)
Trong `apply` của patchClip, sau `patchOne`, nếu patch đổi duration mà
KHÔNG tự đặt speedKeyframes, clip cũ có curve, không reverse (cả cũ lẫn
mới), và 0 < newDur < oldDur thì curve được cắt về [0, newDur) bằng
`sliceSpeedKeyframes` (chèn đúng điểm biên v = speedAt(newDur), không dùng
`trimSpeedKeyframes` vì nó chỉ rớt điểm vượt biên mà không chèn điểm biên,
làm sai nội suy đoạn cuối). Các trường hợp còn lại giữ nguyên hành vi cũ:
- Kéo dài (newDur > oldDur): giữ nguyên curve — ngoài keyframe cuối tốc độ
  clamp về giá trị biên nên đánh giá vẫn đúng, mọi keyframe cũ đều nằm
  trong [0, newDur] nên validator pass; không thêm điểm biên thừa.
- Patch tự đặt speedKeyframes: dùng curve của patch nguyên vẹn.
- Clip không có curve: không tự mọc curve (tương thích ngược project cũ).
- Clip reverse + curve: giữ đường cũ (validator cấm kết hợp này).
- Chỉ đổi start (không đổi duration): curve không đổi — curve gắn với
  thời gian OUTPUT của clip, không gắn vị trí timeline.
- Vẫn nằm trong cùng 1 entry undo của patchClip (không tách bước).

### 1d. Không đổi (giữ phần luồng khác)
Không sửa preview transition, harness, panel UI, helper nested sâu, render
pipeline, validator. Đặc biệt: comment "CÒN THIẾU: đổi duration qua
patchClip..." trong `SpeedPanel.tsx` nay đã LỖI THỜI nhưng KHÔNG sửa ở đây
(panel UI thuộc luồng khác) — parent cho một luồng UI cập nhật comment đó
(xem §3). Tương tự, `SpeedPanel.applySpeed` (đổi tốc độ hằng kèm duration)
trên clip có curve nay sẽ cắt curve theo duration mới — đó là hệ quả đúng
ngữ nghĩa "duration đổi thì curve đi theo", không phải bug mới, nhưng panel
vốn ghi "tốc độ hằng bị curve ghi đè" nên luồng UI có thể muốn chặn đường
này cho clip có curve (xem §3).

## 2. Kiểm chứng thật (FFmpeg 8.1.2, Node 24.22.1)

| Kiểm chứng | Lệnh | Kết quả |
|---|---|---|
| Test thuần helper + slice | `node apps/web/src/components/speed/splitPatch.test.ts` | **14 pass, 0 fail** |
| Test qua store thật (esbuild bundle) | bundle `--format=cjs` rồi `node /tmp/splitPatch.store.test.cjs` | **12 pass, 0 fail** (gồm 4 lần validateSpec pass) |
| Test render MP4 thật nửa sau split | `node server/render/src/test_round15_t4_split_ramp.js` | **22 pass, 0 fail** |
| Hồi quy R5 | `node apps/web/src/components/speed/nestedSpeedcurve.test.ts` | 22 pass, 0 fail |
| Hồi quy C5 | `node apps/web/src/components/speed/speedcurveTrim.test.ts` | 18 pass, 0 fail |
| Hồi quy nested | `node apps/web/src/components/nested/nestUtils.test.ts` | 28 pass, 0 fail |
| Hồi quy transition preview | `node apps/web/src/lib/transitionPreview.test.ts` | 26 pass, 0 fail |
| Hồi quy render P3 | `node server/render/test_p3.js` | 73 pass, 0 fail, 0 skip |
| `npx tsc --noEmit` (apps/web) | sau khi sửa cast `reverse` | **0 lỗi** |
| `npx vite build` | | pass (24.52s) |

Chi tiết các test mới:
- Test thuần (14): kẹp cả hai đầu cặp trái/phải; cặp một phía; clip đầu
  track; T == duration thì không kẹp; biên trong + cặp có gap không đụng;
  không mutate input; type "none" giữ nguyên; slice thu ngắn linear
  (điểm biên v = 1.625 tại 2.5s), rớt điểm vượt biên, bezier khớp 1e-4
  (de Casteljau), tính chất clamp khi kéo dài, parity TS ↔ mirror .js.
- Test qua store thật (12): S1 split curve + transition (đánh giá từng
  điểm, tích phân 2 nửa 2.5 + 3.5 = 6s đúng nguồn gốc, vị trí transition,
  validator pass); S2a tách 4.3 (cặp prev→left kẹp về 0.3, validator pass);
  S2b tách 7.7 (cặp right→next kẹp về 0.3, validator pass); S3 patchClip
  4 → 2.5 cắt curve kèm điểm biên; S4a–S4f hồi quy patchClip cũ
  (opacity / không curve / tự đặt curve / kéo dài / reverse+curve / chỉ
  dời start); S5 split tốc độ hằng (vị trí transition như cũ, validator
  pass). Store test bundle bằng esbuild vì store.ts không import được dưới
  Node trần (import không đuôi mở rộng) — bundle chứa đúng code store thật,
  không mock; bắt buộc `--format=cjs` vì validate.js dùng dynamic
  require("child_process") nên bundle ESM gãy runtime.
- Test render thật (22): nguồn đỏ 0–4s + xanh lá 4–8s (64×64). Nửa phải
  standalone (in 2.5, curve [{0,1.5},{2,2}] — số SUY BẰNG TAY từ curve gốc,
  không lấy từ code split nên không kiểm chứng vòng tròn): duration ≈ 2s,
  frame u=0.2 đỏ (src ≈ 2.81), frame u=1.8 xanh lá (src ≈ 5.61). Gốc (1 clip
  4s) vs tách (2 clip 2s + 2s): cả hai duration ≈ 4s; frame tại 0.5/1.5/2.5/
  3.5 cùng màu chủ đạo (đỏ/đỏ/đỏ/xanh lá) và mean RGB lệch ≤ 40/kênh.
  Lần chạy đầu rớt 3 case do ngưỡng test sai (màu tên "green" của FFmpeg
  là (0,128,0), không phải (0,255,0)) — đã sửa ngưỡng về G > 100, render
  vốn đã đúng; không phải bug sản phẩm.

## 3. Giới hạn trung thực — những gì CHƯA xong / lưu ý gộp đợt

- **Kẹp transition là thay đổi hành vi nhìn thấy được:** tách sát mép sẽ
  rút ngắn transition của clip kề (cả hai đầu cặp về cùng duration nửa mới).
  Lựa chọn này giữ project hợp lệ thay vì để validator lỗi; nếu muốn giữ
  nguyên duration transition thì phải từ chối tách — đó là quyết định UX,
  không phải lỗi kỹ thuật, parent/user có thể đổi hướng sau.
- **Cặp vốn đã lệch trước khi tách:** helper kẹp mỗi phía theo duration
  của chính nó nên cặp lệch sẵn vẫn lệch sau tách (không "sửa hộ" lỗi có
  sẵn). Project hợp lệ trước tách thì sau tách vẫn hợp lệ — đó là bất biến
  được test.
- **Ngưỡng gần đúng thừa hưởng từ slice:** patchClip thu ngắn curve
  ease-in (phía phải) / ease-out (phía trái) chỉ gần đúng trong chặn
  0.125 × |Δv| (đợt 14 R5); muốn đúng tuyệt đối cần kiểu easing đa thức
  bậc 2 — ngoài phạm vi đợt này. Bezier suy biến (đoạn con bề rộng/cao
  ≈ 0) vẫn fallback về bezier gốc, chưa có test riêng (nợ R5).
- **Reverse + speedKeyframes:** patchClip, split, trim đều giữ đường cũ
  (validator cấm) — không nhận hành vi mới ở đây.
- **Comment lỗi thời ở SpeedPanel:** `SpeedPanel.tsx` vẫn ghi patchClip
  chưa cắt curve — cần luồng UI cập nhật comment; đồng thời cân nhắc chặn
  `applySpeed` (tốc độ hằng) trên clip có curve vì nay nó cắt curve theo
  duration mới (hệ quả đúng ngữ nghĩa nhưng panel đang ghi tốc độ hằng bị
  curve ghi đè).
- **Ghi chú cho parent về tsc giữa đợt:** luồng T3 ghi nhận 4 lỗi tsc
  (trong đó có `store.ts:1214` TS2339 `reverse`) khi chạy tsc lúc file của
  luồng này đang sửa dở; cuối đợt này tsc đã 0 lỗi sau khi sửa cast và
  thêm 2 file test mới vào exclude của tsconfig theo đúng quy ước mọi
  `*.test.ts` khác. Ghi chú của T3 về 4 lỗi đó nay đã lỗi thời, đừng coi
  là nợ mở.
- **store.ts dùng chung với luồng T6:** cây làm việc hiện tại chứa cả sửa
  của T4 (patchClip/split/kẹp) và sửa của T6 (`updateNestedInnerClip` trả
  `{ ok, curveDropped }` — cũng là nợ R5 "curveDropped chưa tới panel" mà
  T6 đóng). Khi gộp batch, parent phải stage đúng bản store.ts TRÊN ĐĨA
  hiện tại (chứa cả hai), không stage từ snapshot riêng của từng luồng
  kẻo ghi đè mất sửa của luồng kia; sau gộp kiểm tra lại cả hai sửa còn
  mặt. Luồng này KHÔNG tự xác minh claim của T6, chỉ ghi nhận theo LIMITS
  của T6.
- **Chưa làm:** nested sâu hơn 1 cấp (phần T3); in/out của clip con trong
  nested (nợ R5, vẫn còn); không click-test UI (không đổi UI); không đo
  render trên footage thật/clip dài (nguồn test là màu phẳng tổng hợp);
  `dist/` do vite build tái tạo là build artifact, KHÔNG đưa vào batch.
- **Không push / không release / không tag** trong phiên này (luật cứng).
  File chạy tạm của test store (`/tmp/splitPatch.store.test.cjs`) và thư
  mục tạm của test render (`/tmp/vcut-t4split-*`) không thuộc batch stage.

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/lib/splitTransitions.ts` (MỚI): helper kẹp transition ngoài.
- `apps/web/src/store.ts` (SỬA): import `sliceSpeedKeyframes` +
  `clampSplitOuterTransitions`; patchClip cắt curve theo duration;
  splitAtPlayhead + splitClipAtTimes kẹp transition ngoài.
- `apps/web/src/components/speed/splitPatch.test.ts` (MỚI): 14 test thuần.
- `apps/web/src/components/speed/splitPatch.store.test.ts` (MỚI):
  12 test qua store thật (chạy qua esbuild bundle, xem §2).
- `server/render/src/test_round15_t4_split_ramp.js` (MỚI): 22 test render
  MP4 thật cho nửa sau split.
- `apps/web/tsconfig.json` (SỬA): thêm 2 file test mới vào exclude (quy ước
  chung cho `*.test.ts`).
- `docs/PHASE9_ROUND15_T4_SPLIT_PATCH_LIMITS.md` (MỚI): file này.
