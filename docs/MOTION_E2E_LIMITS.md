# M6 Phase 9 đợt 9 — E2E xuyên suốt motion + click-test browser thật

> Trả nợ click-test browser thật của đợt 8 (xem
> `docs/PHASE9_ROUND8_MOTION_LIMITS.md` §"Chưa làm được" mục 2).
> Mọi claim dưới đây đều có test/render/số đo đi kèm. Không push GitHub,
> không tag/release, không binary trong batch — mọi output render/test đều
> nằm trong thư mục tạm (`/tmp`), không ghi vào repo.

## Phạm vi luồng M6 (chỉ 3 file text, không sửa code sản phẩm)

- `server/render/src/test_motion_e2e.js` (cập nhật, không sửa logic cũ):
  thêm 1 check duration qua builder + mục `[preview-parity]` mới.
- `apps/web/scripts/m6-motion-clicktest.cjs` (mới): click-test MotionPanel
  trên Chromium headless qua CDP, theo mẫu R6/U6.
- `docs/MOTION_E2E_LIMITS.md` (file này).

Không đụng `motion.js`, `previewEngine.ts`, `MotionPanel.tsx`,
`motion.ts` hay bất kỳ file sản phẩm nào khác.

## 1. E2E xuyên suốt: spec có motion → render FFmpeg thật → kiểm tra

Chạy: `node server/render/src/test_motion_e2e.js` → **19/19 pass**
(trước đợt này: 11/11; thêm 1 check duration + 7 check parity).

- Nguồn testsrc2 320x180, 15fps, 2s → đúng 30 frame, duration 2.000s.
- CLI thuần: minterpolate fps=30 → 57 frame (60 − 3 frame biên bidir),
  max frame-diff 2.672 < bản lặp frame 4.923 (mượt hơn thật).
- tmix frames=5: độ sắc nét 4.809 → 4.229 (tỉ lệ 0.879, mờ đi thật).
- Qua builder S2 (spec `{ interpolation: "minterpolate", targetFps: 30,
  motionBlur: { frames: 5 } }`): filter đúng
  `minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,fps=30`
  + `,tmix=frames=5:weights=1 1 1 1 1` → render thật ra MP4:
  **60 frame, duration 2.000s** — nội suy tăng frame nhưng KHÔNG kéo
  dài/thu ngắn clip (check mới, dung sai ±0.15s).
- Thời gian render trên VM này (chỉ ghi số thật, không suy ra máy khác):
  plain 0.530s, minterpolate 3.294s, tmix 0.340s (nguồn 2s 320x180).

### 1.1. Parity spec ↔ render ↔ preview (mục mới, code thật)

Mục `[preview-parity]` biên dịch **code thật** `previewEngine.ts` +
`video-spec` bằng tsc (đúng mẫu `apps/web/scripts/test-preview-engine.sh`)
sang thư mục tạm rồi require `normalizeMotion` + `motionBadgeText` —
KHÔNG mirror lại logic bằng tay. Kết quả trên cùng một spec:

| Spec | Preview claim | Builder filter | validateMotion |
|---|---|---|---|
| interp 30fps + blur 5 | interp, blur, badge `NỘI SUY • BLUR≈` | minterpolate fps=30 + tmix frames=5 | 0 lỗi |
| rỗng (không motion) | tắt hết, badge `""` | `fps=30` thuần | 0 lỗi |
| chỉ blur frames=3 | blur, không interp, badge `BLUR≈` | `fps=30` + tmix frames=3 | 0 lỗi |
| `interpolation: "dup"` (S1 đã loại) | không claim nội suy | `fps=30` (không nội suy) | 1 lỗi |
| `none` + targetFps (S1 cấm) | không claim nội suy | `fps=30` (không nội suy) | 1 lỗi |

Khác biệt có chủ ý (đã ghi ở LIMITS đợt 8, nhắc lại để khỏi "sửa" nhầm):
preview khoan dung, KHÔNG validate — parity chỉ assert trên **claim
nội suy/blur**, còn lỗi validate thuộc tầng spec/render. Hai dòng cuối
chứng minh: preview không bao giờ claim nội suy cho spec sai, và
validator chặn đúng spec sai đó.

## 2. Click-test browser thật (CDP Chromium headless, mẫu R6/U6)

Chạy: vite dev trên :5173 + `node apps/web/scripts/m6-motion-clicktest.cjs`
→ **8/8 pass, 0 SKIP** (profile mới `/tmp/m6-cdprof`, project mẫu 3 clip:
2 video v1 + 1 text t1).

| Test | Thao tác thật | Kết quả đo được |
|---|---|---|
| M0 load sample | mở editor | 3 clip, viewport 1440x1200 |
| M0b welcome modal | click backdrop (20,20) | modal tự mở, đã đóng được |
| M1 trạng thái tắt | click clip video đầu | Section `🐌 Slow-mo / nội suy frame` hiện; interp=`none`, FPS đích disabled, blur chưa check, không có range, không có nút tắt |
| M2 bật nội suy | focus select nội suy + ArrowDown (phím thật) | interp `none` → `minterpolate`, FPS đích hết disable, tip "render sẽ chậm" hiện, app còn sống |
| M3 bật blur | click thật vào checkbox | `false` → `true`, range xuất hiện (value=3, 2..8) |
| M4 tăng frame gộp | focus range + ArrowRight (phím thật) | frame gộp 3 → 4 (đúng +1, không nhảy cóc); nhãn range `Số frame gộp: 4` |
| M5 tắt tất cả | click nút `Tắt tất cả slow-mo / motion blur` | về trạng thái tắt hoàn toàn, app còn sống |
| M6 clip chữ | click clip text | section Slow-mo **vắng** — đúng thiết kế (panel chỉ ở nhánh video), app còn sống |

### 2.1. Bug harness tìm ra trong lúc chạy (KHÔNG phải bug sản phẩm)

M3 fail ổn định ở 2 lần chạy đầu, trong khi click checkbox lẻ trong
debug lại pass. Chẩn đoán bằng số đo thật:

- Tọa độ checkbox từ truy vấn controls: y=500.8125; đọc lại ngay sau đó
  không cuộn: y=462.8125 — lệch đúng 38px.
- Nguyên nhân: sau khi M2 bật nội suy, nút `Tắt tất cả` xuất hiện nên
  truy vấn controls cuộn thêm nút đó **sau** checkbox, làm container
  `.inspector` (scrollTop 6743, cao 806px) xê dịch checkbox đi 38px,
  tọa độ checkbox đo trước đó thành cũ, click rơi lệch.
- Cách sửa (đã áp vào script): truy vấn controls chuyển sang **hai pha**
  — cuộn hết các element trước, rồi mới đo tọa độ tất cả sau cùng.
  Sau sửa: M3 pass, toàn bộ 8/8 pass, chạy lại lần nữa vẫn 8/8.
- Bài học cho harness sau: đừng bao giờ đo tọa độ xen kẽ với cuộn khi
  danh sách control có thể thay đổi giữa chừng (nút xuất hiện/biến mất
  theo state).

## 3. Hồi quy đã chạy (luồng M6 tự kiểm chứng, không ủy thác)

| Kiểm tra | Kết quả |
|---|---|
| `tsc --noEmit` (apps/web) | 0 lỗi |
| `vite build` (apps/web) | pass (10.59s; cảnh báo chunk > 500kB cũ, không phải lỗi) |
| `test-preview-engine.sh` | 337 assertions pass |
| `nestedPreview.test.ts` | 44 test pass |
| `nestedUnify.test.ts` | 12 PROVEN pass (2 PENDING cũ của đợt 7, không tính) |
| UI `motion.test.ts` | 18 passed, 0 failed |
| Spec `motion.test.ts` (packages/video-spec) | pass, 0 skipped/cancelled |
| `motion.js` self-test | OK |
| `test_motion_render.js` | 29 pass, 0 fail |
| `test_motion_ramp.js` | 17 pass, 0 fail |
| `test_motion_e2e.js` (mới) | 19 pass, 0 fail |
| `m6-motion-clicktest.cjs` (mới) | 8 pass, 0 SKIP |

## 4. Bug sản phẩm phát hiện: KHÔNG CÓ

Luồng M6 không phát hiện bug sản phẩm mới. M3 ban đầu là bug của
harness (xem §2.1), đã sửa trong script, không đụng code sản phẩm.

## 5. Giới hạn còn lại (trung thực — click-test này KHÔNG chứng minh)

1. **Click-test chỉ kiểm tra control/state, không kiểm tra frame thật:**
   bấm panel đổi được state motion, nhưng chưa render từ project đã
   bấm trên UI ra MP4 để đối chiếu (E2E §1 render từ spec viết tay, chưa
   nối từ state UI sau click). Nối 2 đầu này là việc đợt sau.
2. **Preview ≠ render (nợ cũ từ đợt 8, vẫn còn):** preview không nội suy
   frame mới (chỉ badge), blur preview chỉ là ghost 1 frame trước alpha
   0.35, không theo `frames`/`weights`. Click-test không nhìn được vệt
   blur thật trên canvas.
3. **Chưa kiểm tra:** undo/redo sau thao tác motion; cảnh báo UI khi
   transition + targetFps khác project fps (render fail-fast nhưng UI
   chưa cảnh báo — nợ đợt 8); chỉnh `weights` từng frame và chọn `miMode`
   (chưa có UI); footage thật, 1080p/4K, clip dài, ramp + motion +
   transition kết hợp; minterpolate rớt đuôi/đóng băng ~0.23s cuối clip.
4. **Sample dùng trong click-test là project mẫu** (clip video mẫu, chưa
   phải footage người dùng tải lên); thao tác kéo/thả, nhập số trực tiếp
   vào input (không qua select/range) chưa nằm trong phạm vi luồng này.
5. `apps/web/dist/` là output của `vite build` khi kiểm chứng — **không
   stage** (theo quy ước đợt 8: chỉ stage file text nguồn, dist và
   output kiểm chứng không vào batch).

## Không làm (đúng chủ trương)

- Không push GitHub, không tag/release, không binary trong batch.
- Không đụng cloud/collab, model đóng, nhạc có bản quyền.
- Batch chỉ stage 3 file text ở đầu file này.
