# Phase 9 đợt 15 — T6: panel curveDropped + circle-soft soft-aware + blinds/plus/checker (LIMITS)

Ngày: 2026-10-28, luồng T6 đợt 15. KHÔNG push, KHÔNG tag/release,
KHÔNG binary, KHÔNG dist. Chỉ sửa code path circle-soft, panel hiển
thị curveDropped, và code path blinds-h/plus/checker — KHÔNG sửa
grid/bars-fade (luồng T2), KHÔNG sửa harness (luồng T1). Các luồng
đợt 15 chạy song song trên cùng cây làm việc nên file test chung có
thêm test của T2 trong lúc T6 chạy (xem §5); parent gộp batch chịu
trách nhiệm kiểm tra xung đột cuối cùng.

## 0. Kết luận ngắn

1. **curveDropped đã hiển thị cho user (nợ LIMITS đợt 14 §3 đã đóng).**
   Trước đó hàm pure `updateNestedInnerClip` đã trả `curveDropped`
   nhưng store nuốt mất (chỉ trả boolean) nên panel không thấy gì.
   Nay store chuyển tiếp số này và `NestedClipPanel` hiển thị cảnh
   báo rõ trong dòng thông báo khi lưu clip con (kèm hướng khôi phục
   bằng Undo).
2. **circle-soft đã nối mô hình soft-aware vào preview** (kind mới
   `radial-soft`, hàm `radialSoftWeight`, mask canvas trong
   `preview.tsx` dùng chung đường mask alpha với `radial-gradient`).
   Tâm gradient dịch +0,5 sang không gian tâm điểm để khớp cách
   FFmpeg đánh giá tại chỉ số nguyên (xem §2).
3. **blinds-h/plus/checker đã sửa xong, đo FFmpeg cho MAD 0,000,
   le8 100% ở cả 192x108 và 1920x1080, cả 3 p** (xem §3). Đây là sửa
   chính xác theo luật expr nguyên, không phải xấp xỉ: blinds-h và
   checker dùng khoảng nửa mở (dịch +0,5 thuần), plus dùng biên lte
   đóng (công thức ceil/floor+1 như squareopen).

## 1. curveDropped lên panel

### Vấn đề gốc
- `nestUtils.updateNestedInnerClip` (đợt 14 R5) tính `curveDropped`
  = số keyframe tốc độ bị cắt khi patch trim/split clip con, nhưng
  `store.updateNestedInnerClip` chỉ trả `boolean`; `NestedClipPanel`
  (InnerClipEditor) chỉ biết thành/bại nên user không bao giờ thấy
  keyframe bị mất.
- Phạm vi hiển thị: chỉ trường hợp trim/split clip con trong
  compound clip qua panel này (patch đổi start/duration không đều
  hai mép). Dời thuần (hai mép dịch cùng lượng) không cắt curve
  nên `curveDropped = 0` và không có cảnh báo — đúng luật R5. Các
  thao tác trim/split khác (timeline chính, `patchClip`) không đi
  qua hàm này nên không thuộc phạm vi sửa này; `patchClip` đổi
  duration trực tiếp vẫn chưa cắt/dịch curve (nợ cũ từ đợt 13, xem
  §5).

### Cách sửa
- `apps/web/src/store.ts`: kiểu trả về của action thành
  `{ ok: boolean; curveDropped: number }`; lỗi → `{ ok: false,
  curveDropped: 0 }`, thành công → số từ hàm pure (`?? 0`).
  Caller duy nhất của action này là `NestedClipPanel` (đã grep toàn
  `apps/web/src`), nên đổi kiểu không vỡ caller khác.
- `apps/web/src/components/nested/NestedClipPanel.tsx`:
  `InnerClipEditor.save` đọc `res.curveDropped`; nếu > 0 thì thông
  báo = `innerSaveOk` + `innerCurveDropped` (số keyframe + hướng
  dùng Undo để khôi phục). Không phát minh panel mới: dùng đúng
  dòng thông báo chung (`msg`) mà panel đã có.
- `apps/web/src/i18n/vi.json`, `en.json`: thêm key
  `nested.innerCurveDropped` (vi: cảnh báo + hướng Undo; en tương
  đương).
- `apps/web/src/components/nested/nestUtils.ts`: cập nhật comment
  cũ ("panel hiện chưa hiển thị số này") thành đã hiển thị từ T6.

### Kiểm chứng
- Test pure đã có từ R5 vẫn xanh: `nestedSpeedcurve.test.ts`
  22/22 (trong đó 5 test assert `curveDropped` = 1/1/0/2/1 theo từng
  trường hợp trim/dời).
- Panel là component React, không có runner test tsx trong repo
  (các test chạy bằng Node trực tiếp trên module thuần) nên phần
  hiển thị chỉ kiểm chứng bằng `tsc` (0 lỗi trong các file T6) +
  `vite build` pass (xem §4) + đọc code: panel đọc đúng field
  `curveDropped` từ action mới. Click-test thật trên browser là nợ
  mở chung của repo (VM browser không tới được dev server), không
  claim đã click-test.
- Giới hạn: cảnh báo chỉ xuất hiện ngay sau lần lưu gây rơi
  keyframe; panel không lưu lịch sử cảnh báo qua các lần mở panel
  (msg reset theo component). Muốn xem lại thì phải Undo (1 bước
  undo của chính lần lưu đó) — đúng vì curve đã bị ghi đè.

## 2. circle-soft: mô hình soft-aware vào preview

### Mô hình
Expr render sau sửa đợt 14 R1 (catalog viết theo p-preview, hàm
`buildXfadeFilter` dịch P→(1-P) cho FFmpeg):
B weight = 1 − clip((r − p·R)/(0,15R), 0, 1), với R = hypot(W/2, H/2),
r đánh giá tại chỉ số nguyên so với tâm (W/2, H/2).
- Kind mới `radial-soft` trong `transitionPreview.ts`:
  `{ cx, cy, rMax, center: p, width: 0.15, inverted }`, hàm
  `radialSoftWeight(center, width, rho) = clamp((center+width-rho)
  / width, 0, 1)` (lớp B dùng w, lớp A dùng 1−w qua `inverted`).
- `preview.tsx`: `drawVideoClipWithTransition` rẽ nhánh
  `radial-soft` vào chung `drawVideoClipWithRadialMask` (mask alpha
  destination-in, 64 điểm dừng); sai số nội suy tuyến tính ≤
  0,15/64 ≈ 0,0024 trọng số, không đáng kể.
- **Tâm dịch +0,5 (điểm mấu chốt):** cx,cy của vùng là
  (W/2+0,5, H/2+0,5) trong không gian tâm điểm. Lý do: canvas/
  harness lấy mẫu gradient tại tâm pixel (x+0,5); khoảng cách từ
  tâm dịch tới tâm pixel bằng đúng khoảng cách FFmpeg tính tại
  chỉ số nguyên (|x−W/2|). Không dịch, viền mềm hẹp (0,15R) lệch
  0,5px và ở 192x108 cho MAD ~0,9, le8 ~90% (đo T6, xem bảng dưới)
  dù mô hình đúng; dịch thì về đúng số soft-aware của R1. rMax giữ
  nguyên hypot(W/2, H/2) theo expr.
- KHÁC circleopen/circleclose built-in: 2 type đó dùng tâm cắt
  nguyên floor(W/2) theo đo R4 (built-in FFmpeg khác custom expr);
  circle-soft là custom expr nên tâm gốc là W/2, không áp dụng
  quy tắc cắt nguyên vào đây.

### Số đo parity (FFmpeg 8.1.2, nguồn đỏ/xanh phẳng lavfi, DUR=0,4,
### offset=1, fps=30, frame đích 30+round(p·12); composite preview
### lấy mẫu tại tâm pixel; màu A/B tham chiếu lấy từ chính frame
### render: A=(254,0,0) góc, B=(0,0,255) tâm tại circle-soft
### 192x108 p=0,25; thang KHỚP V6: MAD ≤ 2 và le8 ≥ 99%)

| Type | Kích thước | p=0,25 MAD / le8 | p=0,5 MAD / le8 | p=0,75 MAD / le8 |
|---|---|---|---|---|
| circle-soft (chưa dịch tâm) | 192x108 | 0,841 / 90,427% | 0,964 / 88,937% | 0,838 / 90,365% |
| circle-soft (chưa dịch tâm) | 1280x720 | 0,207 / 100% | 0,240 / 100% | 0,200 / 100% |
| circle-soft (đã dịch tâm +0,5) | 192x108 | 0,181 / 100% | 0,212 / 100% | 0,178 / 100% |
| circle-soft (đã dịch tâm +0,5) | 1280x720 | 0,184 / 100% | 0,213 / 100% | 0,177 / 100% |

- Trước T6 (biên cứng): MAD 14,4/18,4/15,5 ở 192x108 (R1 §3.2).
  Sau T6 (mềm, chưa dịch tâm): MAD đã về < 1 ở khung nhỏ và
  0,20–0,24 ở 720p — tức đúng mục tiêu "về gần MAD 0,18–0,21 đã đo
  ở mô hình soft-aware" tại 720p; khung nhỏ còn XẤP XỈ vì le8
  < 99% (maxD = 15, toàn bộ lệch nằm trong viền mềm do lệch lấy
  mẫu 0,5px, không phải sai hình học).
- (Điền sau khi đo lại có dịch tâm — xem §2.1.)

### 2.1 Đo lại sau khi dịch tâm +0,5 — KHỚP cả 2 kích thước
Sau khi dịch tâm gradient +0,5 (xem §2), đo lại cùng thiết lập:
192x108 MAD 0,181/0,212/0,178, le8 100%, maxD = 4 ở cả 3 p;
1280x720 MAD 0,184/0,213/0,177, le8 100%, maxD = 4. Số 192x108
trùng tới 3 chữ số thập phân với số soft-aware lấy mẫu tại chỉ số
nguyên của R1 (0,181/0,212/0,178) — chứng tỏ dịch tâm đã triệt
tiêu hoàn toàn lệch lấy mẫu 0,5px, phần dư còn lại chỉ là sàn
làm tròn yuv (maxD = 4, gồm sàn 254-vs-255 và làm tròn blend).
Mục tiêu "về gần MAD 0,18–0,21" ĐẠT ở cả khung nhỏ lẫn 720p.

### Badge previewStatus — ĐÃ NÂNG
`circle-soft` đã thêm vào `TRANSITION_MATCHED` trong
`previewStatus.ts` kèm chú thích số đo §2.1 (theo tiền lệ
circleopen/dissolve: đổi nhãn sau khi có số đo, không trước).
Blinds-h/plus/checker KHÔNG nâng badge trong đợt này: dù MAD đo
được là 0,000, badge "matched" cho transition được định nghĩa qua
harness parity + canvas thật, còn số T6 là composite mô hình vs
render (chưa qua harness V14 của T1) — parent hoặc đợt sau quyết
định khi harness V14 đã raster được các kind này; không nâng vội.

## 3. blinds-h / plus / checker: lệch biên do quy ước lấy mẫu

### Chẩn đoán (xác nhận bằng đo, không phải phỏng đoán)
FFmpeg đánh giá expr custom tại CHỈ SỐ pixel nguyên (X, Y), còn
harness/canvas lấy mẫu tại TÂM pixel (x+0,5, y+0,5) — cùng họ quy
ước mà đợt 12 T2 đã sửa cho khối V3 bằng phép dịch +0,5. Khối P5
(blinds-h/plus/checker) chưa áp dụng nên lệch biên:
- blinds-h (R1): 192x108 lệch đúng 8 hàng (1 hàng/dải); 1920x1080
  p=0,5 MAD 1,425.
- plus (R1): 192x108 XẤP XỈ ở p=0,25/0,75, KHỚP ở p=0,5.
- checker (R1): 192x108 XẤP XỈ (H/8=13,5 không nguyên); 192x104 đã
  KHỚP.

### Sửa (phân biệt 2 loại biên — đây là chỗ dễ sửa sai)
- **blinds-h** (`lt(mod(Y,H/8),P*H/8)`, biên nửa mở): dịch mọi dải
  +0,5 theo y, giữ nguyên chiều cao p*bh. Tâm y+0,5 ∈ [a+0,5,
  b+0,5) ⟺ Y nguyên ∈ [a, b) nên khớp chính xác luật mod nguyên,
  kể cả khi H/8 không nguyên (số hàng/dải luân phiên theo mod).
- **checker** (`gt(P*4,mod(floor(X/(W/8))+floor(Y/(H/8)),4)`, biên
  nửa mở theo ô): dịch toàn bộ lưới +0,5 cả 2 trục. Tâm (x+0,5)
  thuộc ô dịch [i*cw+0,5, (i+1)*cw+0,5) ⟺ X nguyên thuộc ô
  [i*cw, (i+1)*cw) — khớp chính xác kể cả khi W/8 hay H/8 không
  nguyên.
- **plus** (`lte(min(|X-W/2|,|Y-H/2|),P*min(W,H)/2)`, biên ĐÓNG):
  dịch +0,5 thuần SAI ở đây — raster nửa mở [x, x+w) sẽ nuốt mất
  cột/hàng biên khi cx+t nguyên (bắt được bằng test đối chứng:
  192x108 p=0,5 lệch 191 pixel: mất cột X=123 và hàng Y=81).
  Công thức đúng như squareopen: tập nguyên [ceil(lo),
  floor(hi)] → rect nửa mở trong không gian tâm điểm
  [ceil(lo)+0,5, floor(hi)+1,5); 4 góc A theo cùng biên để phân
  hoạch kín và rời nhau.
- Comment quy ước V3 trong file đã cập nhật: 3 type P5 này nay
  dùng quy ước +0,5; các type cũ còn lại vẫn là nợ mở.
- Test cũ ghim sai số plus: dải dọc ở 100x100 p=0,5 từng assert
  rộng 50 — đúng theo luật lte phải là 51 pixel nguyên (X 25..75);
  đã sửa test theo luật đúng, không phải nới lỏng test.

### Số đo parity (cùng thiết lập §2, composite preview = luật
### harness: tâm pixel trong rect nửa mở)

| Type | 192x108 (p=0,25 / 0,5 / 0,75) | 1920x1080 (p=0,25 / 0,5 / 0,75) |
|---|---|---|
| blinds-h | MAD 0,000 / 0,000 / 0,000; le8 100% cả 3 p | MAD 0,000 / 0,000 / 0,000; le8 100% cả 3 p |
| plus | MAD 0,000 / 0,000 / 0,000; le8 100% cả 3 p | MAD 0,000 / 0,000 / 0,000; le8 100% cả 3 p |
| checker | MAD 0,000 / 0,000 / 0,000; le8 100% cả 3 p | MAD 0,000 / 0,000 / 0,000; le8 100% cả 3 p |

→ Sửa chính xác tuyệt đối trên nguồn phẳng tại 2 kích thước
(so với trước sửa: blinds-h 192x108 MAD ~12,7, plus tới 4,2,
checker tới 3,4; blinds-h HD p=0,5 MAD 1,425 → 0,000).
- KHÔNG hồi quy circleopen/close: test `transitionPreview`
  (circleopen/circleclose, radialGradientWeight, tâm cắt nguyên)
  vẫn xanh trong cùng lượt chạy 26/26; 2 type đó không đụng tới
  (không sửa code path của chúng, chỉ thêm kind mới bên cạnh).

## 4. Kiểm chứng đã chạy (số thật)

- `node apps/web/src/lib/transitionPreview.test.ts`: 26/26 pass
  (23 cũ + 2 test mới T6 + 1 test T2 chen vào trong lúc chạy —
  xem §5). 2 test T6: radial-soft + trọng số; đối chứng toàn
  khung blinds/plus/checker vs luật expr nguyên tại 192x108, 3 p.
- `node apps/web/src/components/speed/nestedSpeedcurve.test.ts`:
  22/22 pass (curveDropped pure không đổi hành vi).
- `npx tsc --noEmit` (apps/web): SẠCH, 0 lỗi ở lượt chạy cuối.
  (Giữa đợt từng có 4 lỗi thuộc file khác — 2 file
  `splitPatch*.test.ts` của luồng khác và `store.ts:1214`
  `clip.reverse` — nhưng các luồng đó đã sửa trong lúc T6 chạy;
  T6 không sửa các file đó và không nhận công sửa đó. Lượt tsc
  cuối sạch nên script `build` (`tsc && vite build`) không còn bị
  chặn bởi các lỗi này.)
- `npx vite build` (apps/web, riêng lẻ, không qua script `build`
  vì script đó chạy `tsc && vite build` và sẽ dừng ở 4 lỗi trên):
  pass, 33,58s. `dist/` tái tạo là build artifact, KHÔNG đưa vào
  batch stage.
- Parity FFmpeg: script tạm ở /tmp (không đưa vào repo, không sửa
  harness): 30 case (4 type × 3 p tại 192x108; circle-soft × 3 p
  tại 720p; 3 type × 3 p tại 1080p) — bảng §2/§3; đo lại circle-soft
  sau dịch tâm: 6 case (2 kích thước × 3 p) — bảng §2.1.

## 5. Nợ còn lại / giới hạn (trung thực)

- **Badge blinds-h/plus/checker chưa nâng:** dù MAD = 0,000, số
  này là composite mô hình vs render (script /tmp), chưa qua
  harness V14 của T1 — parent/đợt sau quyết khi harness đã raster
  được các kind này (xem §2.1 cuối).
- **Canvas thật chưa đo:** số parity trên là composite mô hình
  (lấy mẫu tâm pixel) vs render FFmpeg, chưa phải pixel canvas
  trình duyệt vẽ ra (canvas có thể làm tròn/antialias khác đôi
  chút ở biên gradient). Click-test browser vẫn là nợ mở chung.
- **curveDropped chỉ phủ panel clip con:** trim/split ở timeline
  chính và `patchClip` đổi duration trực tiếp chưa báo rơi
  keyframe (nợ cũ đợt 13). Panel cũng không lưu lịch sử cảnh báo
  (xem §1).
- **Phạm vi đo:** nguồn phẳng đỏ/xanh, chưa footage thật, chưa
  4K, chưa clip dài; blinds/plus/checker đo tới 1080p, circle-soft
  tới 720p (chưa 1080p — render 1080p cho circle-soft tốn thời gian
  hơn và không thêm thông tin vì lỗi lấy mẫu giảm theo kích thước,
  nhưng chưa đo thì không claim).
- **Cây làm việc dùng chung:** trong lúc T6 chạy, luồng T2 đã thêm
  test grid/bars-fade vào `transitionPreview.test.ts` và sửa các
  case grid/bars-fade; luồng khác thêm file `splitPatch*.test.ts`
  (từng gây 4 lỗi tsc giữa đợt, đã sửa xong trước khi T6 giao).
  T6 không đụng các code path đó; parent gộp batch vẫn nên chạy
  lại test/tsc sau khi mọi luồng xong.
- **`dist/` tái tạo bởi vite build** là artifact, không stage.

## 6. File đã đổi/thêm (đường dẫn tương đối repo)

KHÔNG push — parent gộp batch (luồng này không tự tạo file stage
paths-loop riêng):

- `apps/web/src/lib/transitionPreview.ts` (SỬA — kind `radial-soft`
  + `radialSoftWeight`; case `circle-soft` chuyển sang mô hình mềm
  với tâm dịch +0,5; case `blinds-h`/`checker` dịch +0,5; case
  `plus` chuyển sang công thức ceil/floor+1; cập nhật comment quy
  ước V3 + comment từng case)
- `apps/web/src/lib/transitionPreview.test.ts` (SỬA — 2 test mới
  T6; sửa 1 assertion cũ của plus từ 50 → 51 theo luật lte đúng)
- `apps/web/src/preview.tsx` (SỬA — import `radialSoftWeight`;
  nhánh `radial-soft` vào mask alpha chung; hàm mask chọn trọng số
  theo kind)
- `apps/web/src/store.ts` (SỬA — action `updateNestedInnerClip`
  trả `{ ok, curveDropped }` thay vì boolean)
- `apps/web/src/components/nested/NestedClipPanel.tsx` (SỬA —
  InnerClipEditor hiển thị cảnh báo `curveDropped`; cập nhật
  comment đầu file)
- `apps/web/src/components/nested/nestUtils.ts` (SỬA — chỉ comment:
  panel nay đã hiển thị curveDropped)
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (SỬA —
  thêm key `nested.innerCurveDropped`)
- `apps/web/src/components/transitions/previewStatus.ts` (SỬA —
  thêm `circle-soft` vào `TRANSITION_MATCHED` + chú thích số đo)
- `docs/PHASE9_ROUND15_T6_UI_CIRCLESOFT_LIMITS.md` (MỚI — chính
  file này)

KHÔNG đổi: `server/render/src/transitions.js`, mọi file harness
`server/render/src/test_*.js`, code path grid/bars-fade (T2),
workflow, binary.
