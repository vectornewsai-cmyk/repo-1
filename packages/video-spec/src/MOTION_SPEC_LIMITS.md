# MOTION_SPEC_LIMITS.md — Giới hạn thật của spec motion (Phase 9 đợt 8, S1)

Spec thuần trong `motion.ts` + field `VideoClip.motion` trong `index.ts`.
CHƯA nối render/preview: `server/render/src/motion.js` của S2 chưa tồn tại,
`render.js`/`validate.js`/`preview` hiện BỎ QUA field `motion` (grep xác nhận
tại thời điểm S1). Mọi claim dưới đây chỉ ở tầng spec + validate + round-trip.

## 1. Kết quả kiểm chứng thật (S1, 26/10/2026)

- `npx tsc packages/video-spec/src/index.ts packages/video-spec/src/motion.test.ts
  --outDir /tmp/motion-spec-test --module nodenext --target es2022
  --moduleResolution nodenext --skipLibCheck` → **exit 0, 0 lỗi**
  (2 lỗi type ban đầu do Record-index `unknown` đã sửa bằng cast có chú thích).
- `node --test /tmp/motion-spec-test/motion.test.js` → **19 pass, 0 fail**:
  A1–A4 (hợp lệ + re-export qua index.js), B1–B9 (fail-fast throw),
  C1–C4 (resolveMotionBlur), D1–D2 (project cũ + round-trip).
- Mirror `motion.js` là output tsc thật (copy từ /tmp, không viết tay):
  smoke test qua `node -e` import trực tiếp — validate pass + throw đúng.

## 2. Giới hạn

- **Interpolation chỉ có tác dụng khi render.** Không áp cho audio/image/
  text/sticker clip — `validateMotion(motion, kind !== "video")` throw
  (lỗi, không phải cảnh báo-bỏ-qua như mask).
- **Chỉ là xấp xỉ FFmpeg** (`minterpolate`/`tmix`): không phải optical-flow
  model học sâu; vật chuyển động nhanh/phức tạp vẫn có thể bóng ma.
  Chưa đo fps/tốc độ render của minterpolate/tmix (đợt S1 chỉ làm spec).
- `miMode` chỉ `"mci" | "blend"` — `"dup"` bị loại (chỉ lặp frame, không
  nội suy). `targetFps` cho phép thập phân (vd 23.976), bắt buộc khi
  `interpolation = "minterpolate"`, không suy diễn từ fps project ở tầng spec.
- `motionBlur.frames` tối đa **8** (không phải 16 như shape tạm S3).
- `interpolation = "none"` (kể cả vắng) mà kèm `targetFps`/`miMode` là
  **lỗi** — field vô tác dụng không được nằm trong spec.
- Nhánh ramp (S3): `targetFps` phải bằng fps project hoặc bỏ trống — đây là
  rule của render branch, KHÔNG phải rule spec (clip thường targetFps khác
  fps project vẫn hợp lệ, render resample sau nội suy).

## 3. Việc S2 phải làm (validate.js + motion.js — S1 không sửa 2 file đó)

- Mirror đúng rule `validateMotion` vào `validate.js` (kiểu gom lỗi như
  `validateEnhance`/`validateMask`): nhánh video gọi validate khi
  `clip.motion` có mặt; kind khác có `motion` → err (không phải warn).
- Dựng chuỗi filter từ shape S1 (không dùng shape tạm S3 nữa — xem §4).

## 4. Nợ migrate shape tạm (không được để 2 shape cùng tồn tại lặng lẽ)

- **UI S5** (`apps/web/src/components/motion/motion.ts`): hiện ghi
  `targetFps`/`miMode` kèm cả khi `interpolation = "none"` (vd
  `withMotionBlur` tạo `{ interpolation: "none", targetFps: 30, miMode:
  "mci", motionBlur }`) → object đó FAIL spec S1. S5 phải strip
  `targetFps`/`miMode` khi lưu `interpolation = "none"` (chỉ giữ
  `motionBlur`; không còn gì thì gỡ cả `motion`). `"dup"` đã lưu phải map
  sang `"mci"`/`"blend"`. `targetFps` 24/30/60 và weights chia đều tổng = 1
  của S5 đọc được nguyên vẹn.
- **Nhánh ramp S3** (`server/render/src/speedramp.js buildMotionPostChain`):
  shape tạm `interpolation` boolean, `motionBlur` boolean|number, frames
  tới 16, `miMode` gồm `"dup"`. Khi S2 lên, S3 phải sửa sang shape S1;
  project ramp cũ có frames 9..16 sẽ FAIL spec — S2/S3 tự quyết migrate/
  clamp, S1 không nới spec lên 16.

## 5. Không thuộc phạm vi S1

Render thật (minterpolate/tmix), preview, panel UI, đo benchmark render,
migrate dữ liệu project cũ dùng shape tạm S3/S5 (chưa có tool migrate).
