# D4_LIMITS.md — Mask keyframes theo thời gian (Phase 9 đợt 4, agent D4)

## Làm được gì

Mask trước đây là thuộc tính tĩnh. Nay `ClipMask.keyframes?: MaskKeyframe[]`
cho phép x/y/w/h thay đổi theo thời gian, nội suy TUYẾN TÍNH, giữ nguyên
(hold) ngoài đoạn keyframe. Thời gian t tính bằng giây, tương đối từ lúc
clip bắt đầu trên timeline (0 = clip.start) — khớp cả 3 nơi: render
(unit bắt đầu PTS 0), preview (localT = t - clip.start), UI MaskPanel.

- Spec: `packages/video-spec/src/mask.ts` — type `MaskKeyframe`, validate
  (t >= 0, x/y hữu hạn, w/h > 0; t vượt duration không lỗi, chỉ hold),
  normalize (sắp theo t, trùng t thì sau thắng), `interpolateMaskAt`,
  `maskGeometryAt`, `hasMaskKeyframes`.
- Render: `server/render/src/mask.js` (mirror JS) + `mask_anim.py` mới
  (vẽ N = round(duration×fps) frame PNG bằng đúng công thức geq của
  `mask_png.py`, encode ffv1 gray `.mkv`) + `render.js` (helper
  `maskChainForSite` dùng chung cho cả 3 site: video thường, video speed
  ramp, image). Đường animation dùng movie+blend+alphamerge như đường PNG
  tĩnh của R2 — KHÔNG dùng geq chậm. `trim=end_frame=N` chặn video mask
  dài hơn unit khỏi tràn sang clip kề; unit dài hơn do làm tròn thì blend
  repeat frame mask cuối (hold đúng).
- Preview: `preview.tsx` — hàm vẽ mask duy nhất (`maskedUnitSource`)
  nhận thêm `localT` và nội suy trước khi `applyMask`; video và image đều
  qua đường này. Không sửa `previewEngine.ts` (applyMask giữ nguyên).
- UI: `MaskPanel` — danh sách keyframe (t + x/y/w/h theo %), nút thêm
  keyframe tại playhead (lấy đúng tư thế nội suy hiện tại, trùng t thì ghi
  đè), xóa từng keyframe / xóa hết về mask tĩnh. Key i18n mới `mask.kf*`
  (vi/en, check R6 PASS).

## Kiểm chứng (số thật, không mock)

- `server/render/test_d4_mask_keyframes.js`: **13/13 pass** — render thật
  video + rect di chuyển (t=0.5 trái đỏ/phải đen, t=2.5 trái đen/phải đỏ),
  image + ellipse phóng to (điểm (260,90) t=0.5 đen, t=2.5 xanh), dry-run
  xác nhận filter dùng movie `.mkv` + `trim=end_frame`, KHÔNG geq,
  keyframes t âm bị validate chặn (render thoát lỗi).
- Nội suy 3 mirror cùng fixture (t=0 x=0.2, t=2 x=0.9 sau dedupe):
  `mask.js --self-test` §9 pass, `test_mask_anim.py` 16 check pass,
  `maskKeyframes.test.ts` **14/14 pass**.
- Hồi quy: `test_r2.js` 16/16 (mask tĩnh không vỡ), preview-engine 337
  assertions pass, `tsc --noEmit` 0 lỗi toàn app, `vite build` pass,
  i18n check R6 PASS, bridge/render/validate `node --check` OK.
- Video mask animation kiểm chứng trực tiếp: ffv1 gray 30fps, frame 0/30/59
  đúng vị trí mask trái → giữa → phải theo nội suy.

## Giới hạn trung thực

- **Chỉ nội suy tuyến tính.** Không easing (ease-in/out) cho mask — muốn
  mượt hơn phải thêm easing keyframe sau (giống speedKeyframes).
- **feather/invert giữ tĩnh** (theo brief). Muốn feather thay đổi theo
  thời gian phải mở rộng keyframe thêm 2 field + video mask đã hỗ trợ sẵn
  (feather là tham số của mask_anim.py, chỉ cần truyền theo frame).
- **Chưa click-test UI MaskPanel trên browser thật** (chỉ tsc + vite
  build). Logic patchClip/i18n đã đúng theo mẫu có sẵn, nhưng thao tác
  bấm nút thêm/xóa keyframe chưa được CDP kiểm chứng.
- **Phụ thuộc mirror ESM `packages/video-spec/src/mask.js`** (file của
  agent D3, không phải của D4): Rollup resolve `"./mask.js"` sang mirror
  này, KHÔNG sang `mask.ts`. Vite build từng fail với
  "interpolateMaskAt is not exported" cho đến khi D3 đồng bộ mirror xong
  (00:47 25/10, đã đối chiếu khớp semantics với mask.ts). **Khi stage
  batch D4, BẮT BUỘC stage kèm mirror này (hoặc batch của D3), nếu không
  code push lên sẽ vỡ vite build dù tsc vẫn pass.**
- Fallback khi vẽ video mask thất bại: PNG tĩnh tại t=0, rồi geq tĩnh
  tại t=0 — mask đứng yên thay vì fail job (đã code, chưa kích hoạt thử
  bằng cách phá ffmpeg vì đường chính đã chạy).
- `--mask-mode geq` + mask keyframes → geq tĩnh tại t=0 (geq không thể
  animation theo thời gian); đây là hành vi cố tình, có cảnh báo trong
  code, không phải bug.
- `mask_anim.py` dùng numpy khi có (nhanh); fallback pure-python đúng
  nhưng rất chậm ở khung lớn (720p × nhiều frame) — thực tế VM có numpy
  nên không thành vấn đề.
- Preview mask vẫn qua offscreen tối đa 640px như đường mask tĩnh cũ
  (feather co giãn theo tỉ lệ, viền cứng hơi mềm khi upscale) — xem
  LIMITS của preview mask, không phải hạn chế mới của D4.
- Keyframe vượt duration không bị chặn (chỉ hold) — cố tình, để UI không
  phải validate lại mỗi lần trim clip ngắn lại.
- Không đụng tới: mask cho text clip (vẫn chưa hỗ trợ như trước), mask
  keyframe theo quỹ đạo tracking (khác tính năng), easing, feather động.
