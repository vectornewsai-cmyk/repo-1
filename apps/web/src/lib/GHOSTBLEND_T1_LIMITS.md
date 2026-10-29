# GHOSTBLEND_T1_LIMITS.md — Ngữ nghĩa ghost motion blur sau đợt 12 (luồng T1)

Đóng nợ đợt 11 (luồng P5 phát hiện bug sản phẩm thật): ghost motion blur
của đợt 8–9 bị frame hiện tại đục che kín nên không lộ pixel nào.

## 1. Ngữ nghĩa ĐÚNG (quyết định của đợt này)

Render áp motion blur thật bằng FFmpeg `tmix`: đầu ra = trung bình có
trọng số Σ wᵢ·Fᵢ của `frames` frame liên tiếp, w đã chuẩn hoá (tổng = 1),
w[0] = frame cũ nhất, w cuối = frame hiện tại.

Vì vậy preview muốn khớp nguyên lý tmix thì KHÔNG được vẽ ghost dưới
frame đục rồi vẽ frame hiện tại đủ alpha lên trên: với frame video đục,
phép source-over của frame hiện tại (alpha 1) cho hệ số ghost = 0 ở mọi
pixel frame hiện tại phủ — tức ghost không tồn tại trên màn hình, bất kể
vật chuyển động nhanh hay chậm, bất kể alpha trail là 0.35 hay bao nhiêu.
Đây là bug, không phải "vệt mờ nhạt": probe đo pixel vùng ghost trước
sửa = đúng frame không ghost (khác biệt = 0, xem §5).

Cách sửa (đợt 12): composite TẤT CẢ frame (ghost + hiện tại) vào 1 lớp
offscreen rồi vẽ lớp đó 1 lần lên canvas chính với opacity của clip.
Phép composite dùng source-over thuần với alpha chạy (running average,
xem `motionBlurBlendPlan` trong previewEngine.ts):
blendAlpha[0] = 1, blendAlpha[i] = wᵢ / (w₀ + … + wᵢ).
Chứng minh bằng quy nạp (ghi trong comment của hàm): sau bước i, lớp =
Σ_{j≤i} wⱼ·Fⱼ / Σ_{j≤i} wⱼ; bước cuối tổng = 1 nên lớp = Σ wᵢ·Fᵢ đúng
bằng tmix với frame đục. Frame hiện tại không còn "đè" ghost nữa — nó
là 1 số hạng trong trung bình, với đúng trọng số của nó.

Hệ quả: `ghostAlphas` (alpha trail 0.35 × weights/max) và hằng số
`MOTION_BLUR_GHOST_ALPHA` từ đợt 9 chỉ còn là mô tả trail cũ, KHÔNG
dùng để composite nữa. `resolveMotionBlurGhost` giữ nguyên (test cũ vẫn
xanh) để mô tả spec; đường vẽ đọc `weights` và gọi `motionBlurBlendPlan`.

## 2. Những gì đã đổi (chỉ mảng ghost)

- `apps/web/src/lib/previewEngine.ts`: thêm `MotionBlurBlendFrame` +
  `motionBlurBlendPlan(weights, ghostCount)` (thuần, không DOM, test
  được bằng Node). Ghi chú đợt 12 vào `MOTION_BLUR_GHOST_ALPHA` và field
  `ghostAlphas` (không đổi giá trị/hành vi của `resolveMotionBlurGhost`).
- `apps/web/src/preview.tsx`: xoá `drawMotionBlurGhosts` cũ, thêm
  `drawMotionBlurBlended` (lớp blend W×H tái dùng, vẽ đồng bộ) và sửa cả
  4 đường vẽ video (thường, thường có track, SR, mask, mask+SR) sang thử
  blend trước, thất bại (chưa có bóng) thì vẽ trực tiếp frame hiện tại.
  Snapshot sau khi vẽ vẫn là nội dung GỐC chưa blend (drawSrc/unit) —
  nếu lưu lớp blend thì frame sau sẽ blend trên nền đã mờ sẵn (mờ kép,
  sai weights).
- `apps/web/src/lib/ghostBlend.probe.test.ts` (mới): probe pixel, xem §5.
- `apps/web/tsconfig.json`: thêm probe vào `exclude` — đúng quy ước repo
  (mọi file test Node type-stripping đều exclude khỏi tsc, vd
  previewEngine.test.ts); probe vẫn chạy bằng Node, không nằm trong build.
- Không đụng: transitionPreview.ts, previewStatus.ts, projectRepo.ts,
  speed-curve UI, MOTION_PREVIEW_LIMITS.md (tài liệu đợt cũ giữ nguyên;
  file này là LIMITS riêng của luồng T1).

## 3. Chi tiết composite theo từng đường vẽ

- Lớp blend luôn W×H (kích thước khung project). Đường thường/SR vẽ
  snapshot letterbox dw×dh vào lớp tại đúng vị trí cũ; đường mask vẽ unit
  đã mask tại đúng vị trí/transform cũ. Vị trí/transform của bóng lấy theo
  frame hiện tại (giống đợt 9) — nội dung bóng vẫn là frame cũ.
- Filter: mỗi frame áp `cssFilter` riêng trên lớp (đường thường/SR);
  lớp vẽ lên canvas chính với filter = "" để filter không bị áp 2 lần.
  Đường mask không áp filter trên canvas chính (unit đã mang filter).
  Vignette giữ nguyên vị trí/tầng như trước: đường mask+SR và SR vẽ
  vignette trong transform SR với opacity clip (như cũ); đường mask và
  đường thường vẽ vignette sau khi restore (không nhân opacity, như cũ).
- Opacity clip: áp 1 lần khi vẽ lớp lên canvas chính (globalAlpha của
  caller), không áp từng frame trong lớp — nếu không opacity sẽ nhân
  nhiều lần qua các bước source-over.
- Cửa sổ thiếu bóng (vài frame đầu, ring chưa đầy): chỉ lấy các bóng
  MỚI NHẤT có snapshot + frame hiện tại, chuẩn hoá lại weights của cửa
  sổ đó về tổng 1 (tỉ lệ giữa các frame có mặt giữ nguyên, độ sáng
  không tối đi). Frame đầu tiên sau khi bật blur vẫn không có bóng
  (ring rỗng → vẽ trực tiếp, giống trước).
- Frame không ghost (không blur, hoặc preview tắt): không qua lớp blend,
  vẽ trực tiếp như cũ — pixel không đổi 100% (probe §5 đo plan 1 frame
  alpha 1; đường vẽ trực tiếp là code-path đã giữ nguyên).

## 4. Giới hạn còn lại (trung thực, không giấu)

- Ghost vẫn là xấp xỉ canvas, KHÔNG phải tmix thật của FFmpeg: snapshot
  là frame đã giải mã ở độ phân giải preview (không phải frame gốc độ
  phân giải render), bóng mask/SR đặt theo transform hiện tại chứ không
  tính lại mask keyframes/placement theo thời gian của chính bóng đó
  (kế thừa từ đợt 9, xem MOTION_PREVIEW_LIMITS.md §3).
- Công thức running-average đúng chính xác với frame đục (video đã
  letterbox/pad). Với unit đã mask có vùng trong suốt: tại pixel mà
  frame đầu (cũ nhất) trong suốt, kết quả là trung bình trên các frame
  phủ pixel đó — vẫn lộ ghost, vẫn đúng tỉ lệ weights giữa các frame
  phủ, nhưng không còn bằng đúng Σ wᵢ·Fᵢ trên toàn cửa sổ (vì frame đầu
  đóng góp 0 thay vì w₀·0-premultiplied). Đây là xấp xỉ có chủ ý của
  canvas, không claim bằng tmix tại vùng mask trong suốt.
- Filter CSS (brightness/contrast/saturate/…) áp từng frame rồi blend
  cho kết quả bằng blend rồi filter (các filter này là biến đổi
  affine/tuyến tính từng pixel và weights tổng = 1) — ngoại trừ filter
  phi tuyến nếu sau này thêm (lúc đó phải đo lại, không tự claim).
- Lớp blend dùng chung 1 canvas module-level, tái dùng mỗi lần vẽ. An
  toàn vì `drawVideoClip` vẽ đồng bộ (không await bên trong); nếu sau
  này đường vẽ thành bất đồng bộ thì phải tách lớp theo clip trước khi
  dùng.
- Chi phí: thêm tối đa 1 lần vẽ lớp W×H mỗi frame có blur (so với đợt 9
  là frames-1 lần vẽ ghost + 1 lần vẽ frame). Chưa đo FPS thực tế khi
  bật blend trên clip 1080p — giống nợ đo FPS của đợt 8, vẫn mở.

## 5. Probe đo pixel (số thật, đã chạy)

Probe: `apps/web/src/lib/ghostBlend.probe.test.ts` — chạy bằng
`node --experimental-strip-types` từ gốc repo, 10/10 xanh. Probe cài phép
source-over đúng công thức canvas và đo 2 chuỗi vẽ trên cùng phép đó
(xem header file để biết vì sao đo được mà không cần browser):

- BUG CŨ: frames [0, 120, 240], weights [0.5, 0.25, 0.25] → chuỗi cũ cho
  pixel = 240 = đúng frame không ghost, khác biệt = 0 (ghost không lộ).
- MỚI: cùng pixel → 90 = đúng tmix (0.5·0 + 0.25·120 + 0.25·240), khác
  frame không ghost 150 (> 0, ghost lộ ra).
- MỚI: đảo weights [0.1, 0.2, 0.7] → 160; [0.7, 0.2, 0.1] → 40 (đúng
  hướng weights, đúng giá trị tmix từng trường hợp).
- MỚI: RGB (255,0,0)/(0,255,0)/(0,0,255) với weights [0.5, 0.25, 0.25] →
  (127.5, 63.75, 63.75), không lệch kênh.
- MỚI: weights đều frames=4, frames [0, 80, 160, 240] → 120.
- MỚI: shape tạm cũ (motionBlur boolean true) → weights [0.5, 0.5],
  frames [0, 200] → 100.
- MỚI: thiếu bóng (frames=4 đều, mới 1 bóng = 160, hiện tại = 240) →
  chuẩn hoá [0.5, 0.5] → 200 (không tối đi).
- KHÔNG GHOST: plan 1 frame alpha 1 → pixel = 240 = frame hiện tại
  (không đổi).

## 6. Chưa chứng minh được

- Pixel canvas thật trên trình duyệt: probe đo toán composite + kế
  hoạch blend thật, không chạy canvas thật (môi trường này không có gói
  canvas cho Node và không có Chromium). Việc lớp blend hiển thị đúng 4
  đường vẽ, đúng transform, đúng thứ tự lớp trên browser thật vẫn cần
  click-test (clip có motionBlur + mask/SR, vật chuyển động nhanh) —
  chưa làm trong luồng này, cần parent/main-chat sắp xếp khi có browser.
- FPS thực tế khi bật blend ở 1080p (xem §4) — chưa đo.
- Vùng mask trong suốt: chỉ lập luận bằng công thức (§4), chưa có probe
  pixel cho trường hợp alpha từng phần (probe đo frame đục).
