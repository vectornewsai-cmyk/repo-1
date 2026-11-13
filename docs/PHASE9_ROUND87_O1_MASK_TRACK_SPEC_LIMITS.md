# Phase 9 — Đợt 87 O1: Mask bám motion track — spec + hình học chung

**Luồng:** O1 (spec + hình học). **Ngày:** 11/11/2026 (lượt 12:35 +07).
**Phạm vi:** chỉ thêm helper hình học `maskGeometryAtTrack` + test + spec.
KHÔNG sửa render/preview/UI (việc O2/O3). KHÔNG push. KHÔNG release/tag.

## 1. Thiết kế đã chốt (parent, mọi luồng dùng chung)

- Tracked mask = **tâm mask (x, y) bám theo quỹ đạo `clip.track`**
  (tọa độ tương đối 0..1, thời gian clip-local, gốc 0 = `clip.start`);
  shape/size/feather/rotation giữ nguyên.
- **KHÔNG thêm field spec mới:** dùng `clip.track` đã có.
- Nội suy quỹ đạo dùng `interpolateTrack` của
  `packages/video-spec/src/tracking.ts` (tuyến tính giữa 2 điểm, kẹp
  ngoài khoảng).
- **Lưu ý tên hàm:** task ghi `interpolateTrackPoints` nhưng tên canonical
  trong video-spec là **`interpolateTrack`**; `interpolateTrackPoints` là
  tên mirror ở `apps/web/src/lib/previewEngine.ts:1755` (viết lại, cùng
  luật) và ở `server/render/src/mask.js` (bản CJS mới thêm đợt này).
  Cả ba cho cùng kết quả số (test chéo §5).

## 2. Hàm `maskGeometryAtTrack(mask, track, t)`

Chữ ký: `(mask: ClipMask, track: TrackAttachment | undefined | null, t: number) → ClipMask`.
`t` là giây, tương đối từ `clip.start` — cùng gốc thời gian với
`clip.track` và với mask keyframes (D4).

**Quy tắc (đã test, §5):**

| Trường hợp | x, y | w, h | shape/feather/invert | keyframes |
|---|---|---|---|---|
| Có track | = vị trí track tại `t` (nội suy/kẹp) | = `interpolateMaskAt` (keyframes thắng) | giữ nguyên | bị bỏ khỏi kết quả |
| Không track (`undefined`/`null`/rỗng) | = `maskGeometryAt(m, t)` (đồng nhất, không đổi hành vi cũ) | như `maskGeometryAt` | giữ nguyên | bị bỏ |
| Track 1 điểm | = điểm đó, hằng mọi `t` | theo keyframes | giữ nguyên | bị bỏ |

- Track thắng **cả x/y tĩnh lẫn x/y keyframe**; keyframes chỉ còn thắng w/h.
- `t` ngoài khoảng track → kẹp về điểm đầu/cuối (cùng luật
  `interpolateTrack`); `t` ngoài khoảng keyframes → hold w/h.
- Track rỗng (`points: []`) → fallback tĩnh (phòng thủ để render/preview
  không crash; `validateTrackAttachment` vẫn báo lỗi ở tầng validate).
- Shape chỉ `rect` | `ellipse` — **polygon không hỗ trợ**
  (`validateMask` từ chối shape lạ, không đổi).

**Ba implementation (mirror, cùng công thức + cùng thứ tự phép tính):**

| Bản | File | Ghi chú |
|---|---|---|
| TS canonical | `packages/video-spec/src/mask.ts` | Import `interpolateTrack` từ `./tracking.js`. Đây là nhà chính của helper TS — `apps/web/src/lib/` **không có** helper mask nào (chỉ có `maskKeyframes.test.ts` import từ video-spec) nên không tạo file lib mới, tránh trùng. |
| JS mirror ESM | `packages/video-spec/src/mask.js` | Bắt buộc theo mirror-check (export-set parity, §5). |
| CJS render | `server/render/src/mask.js` | Thêm `interpolateTrackPoints` (mirror `interpolateTrack`, vì render worker CJS không import được video-spec) + `maskGeometryAtTrack`, export cả hai. |

## 3. Validator — kết quả kiểm tra (KHÔNG sửa `validate.js`)

Đã đọc `server/render/src/validate.js:652-745` + video-spec
(`mask.ts`, `tracking.ts`, `index.ts` doc) + `apps/web` (`trackIgnoredReason`
của O5 ở `TrackPanel.tsx` chỉ mirror validator, không thêm luật mới).

**Không có cảnh báo sai nào về combo track+mask** — không có cảnh báo nào
nói "track bị bỏ qua" khi có mask, và cũng không có luật nào chặn/bỏ qua
combo này. Vì vậy **không sửa validator** (không biến warn thành error,
không thêm warn mới). Các cảnh báo hiện có vẫn đúng với combo mask+track:

| Combo | Hành vi validate hiện tại | Đúng? |
|---|---|---|
| video/image + mask + track | Không warn gì thêm (combo hợp lệ) | ✓ — O2/O3 nối render/preview |
| video + track + transition (+mask) | Warn "track bị bỏ qua ở unit đã merge" | ✓ — mask cũng không bám track ở đoạn merge (render bỏ track ở unit merge, `render.js:865`) |
| text + mask + track (không ASS) | Warn "mask chưa hỗ trợ cho clip text — mask sẽ bị bỏ qua"; track vẫn validate + chạy | ✓ — xem giới hạn text §4 |
| text + mask + track + typewriter/karaoke/parity | Warn mask bị bỏ qua + warn track bị bỏ qua (ASS) | ✓ — cả hai đều bị bỏ thật |
| image + mask + track | Warn "track chưa hỗ trợ cho clip image — track sẽ bị bỏ qua"; mask vẫn chạy | ✓ — xem giới hạn image §4 |
| sticker/audio + mask (+track) | Warn mask bị bỏ qua | ✓ — sticker không có mask pipeline |

## 4. Giới hạn (trung thực)

1. **Text mask KHÔNG hỗ trợ** (`validate.js:717`, mask chỉ render cho
   video/image; drawtext không qua pipeline alpha). Tracked mask trên
   text = mask bị bỏ qua hoàn toàn (chỉ warn, không lỗi); track vẫn
   dịch chữ (trừ nhánh ASS thì track cũng bị bỏ). O1 không làm text mask.
2. **Image: mask có, track không.** Clip image có mask+track thì mask
   chạy tĩnh, track bị bỏ qua (warn). Tracked mask trên image chưa chạy.
3. **Video dính transition:** track bị bỏ ở unit đã merge → mask cũng
   không bám track ở đoạn đó; render/preview (O2/O3) phải khớp hành vi này,
   không tự "bám" lại.
4. **Đường geq-track của O2/O3 (`buildMaskTrackGeqExpr`) dùng w/h TĨNH**
   (`normalizeMask`, không nội suy keyframes) — lệch với quy tắc
   "keyframes thắng w/h" của helper này khi mask có keyframes w/h.
   Đường PNG/video-mask (qua `maskGeometryAtTrack`) thì đúng quy tắc.
   O2/O3 cần quyết: chấp nhận lệch ở đường geq, hoặc bổ sung nội suy w/h.
5. **Preview hiện tại dịch cả unit đã mask theo `trackShift`**
   (`preview.tsx:1989-2006`: mask áp tĩnh rồi `drawImage` dịch cả unit).
   Kết quả cuối = tâm mask tĩnh + shift — chỉ bằng "tâm = vị trí track"
   khi tâm mask tĩnh ở giữa khung. O3 cần chuyển preview sang dùng
   `maskGeometryAtTrack` thay vì giữ hành vi dịch unit.
6. **`mask_anim.py` chưa mirror helper này** — mới mirror
   `interpolateMaskAt` (D4). Đường video-mask animation muốn đúng quy tắc
   keyframes w/h thì phải dùng `trackPointsToMaskKeyframes` của O2 (đã
   gọi `maskGeometryAtTrack` tại hợp các mốc thời gian) hoặc mirror thêm
   ở Python — việc của O2/đợt sau, O1 không đụng Python.
7. **Track `lost`/score thấp:** `interpolateTrack` không bỏ điểm
   (chỉ UI cảnh báo) — mask bám cả điểm score thấp, khớp render text/
   video hiện tại.
8. **Tọa độ ngoài [0,1]:** mask x/y cho phép ngoài [0,1] (lệch khỏi
   khung); track x/y bị validate chặn 0..1 nên tâm tracked mask luôn
   trong khung.

## 5. Test thật + số đo

Fixture chung cho cả 3 bản (cùng số, dùng lại ở self-test §11,
`maskTrack.test.ts`, probe mirror):
track 2 điểm `(0, 0.2, 0.3) → (2, 0.8, 0.7)`; mask rect có keyframes
`(0, x0.1 y0.9 w0.4 h0.4) → (2, x0.3 y0.7 w0.6 h0.8)` — x/y keyframe
cố tình KHÁC tâm track để phân biệt quy tắc.

| t | Kết quả `maskGeometryAtTrack` (x, y, w, h) | Kiểm tra |
|---|---|---|
| -1 | (0.2, 0.3, 0.4, 0.4) | kẹp điểm đầu track + hold keyframe |
| 0 | (0.2, 0.3, 0.4, 0.4) | đúng điểm mẫu |
| 1 | (0.5, 0.5, 0.5, 0.6) | track thắng x/y; keyframes thắng w/h (h = 0.6000000000000001 do float, so epsilon 1e-9) |
| 2 | (0.8, 0.7, 0.6, 0.8) | đúng điểm mẫu |
| 5 | (0.8, 0.7, 0.6, 0.8) | kẹp điểm cuối track + hold keyframe |
| 1, không track / rỗng / null | = `maskGeometryAt` → (0.5, 0.5, 0.5, 0.6) | đồng nhất, JSON bằng nhau |
| 1, track 1 điểm (0.25, 0.75) | (0.25, 0.75, 0.5, 0.6) | tâm hằng, w/h keyframe |
| 1, mask tĩnh ellipse (0.8, 0.6) + track | (0.5, 0.5, 0.8, 0.6) | tâm track, w/h tĩnh |

**Kết quả chạy (11/11/2026, lượt 12:35 +07):**

| Kiểm chứng | Kết quả |
|---|---|
| `node server/render/src/mask.js --self-test` | ✅ pass toàn bộ (gồm §10 O2, §10b O3 geq, §11 O1) |
| `node --experimental-strip-types apps/web/src/lib/maskTrack.test.ts` | ✅ **22 pass, 0 fail** (số tay tính + chéo 3 mirror JSON khớp tại t = -1, 0, 1, 2, 5, cả khi không track) |
| `node --experimental-strip-types apps/web/src/lib/maskKeyframes.test.ts` (hồi quy D4) | ✅ **14 pass, 0 fail** |
| `node packages/video-spec/scripts/check-video-spec-mirror.mjs` | ✅ **427 pass, 6 known, 0 fail** (433 probe; 5 probe mask TS↔JS mới + 6 probe render mới) |
| `npx tsc --noEmit` (apps/web) | ✅ **0 lỗi** ở lần chạy cuối (có 1 lỗi transient ở `TrackPanel.tsx:100` của O5 trong lúc O5 đang sửa dở — không phải file O1, O5 đã tự sửa xong, chạy lại tsc sạch) |

## 6. Xung đột file chung đã xử lý (song song với O2/O3/O5)

`server/render/src/mask.js` bị 3 luồng cùng sửa trong lúc O1 chạy:

1. **Duplicate `require` (SyntaxError):** file có 2 dòng giống hệt
   `const { validateTrackAttachment } = require("./tracking_validate");`
   → `node mask.js` crash parse. O1 đã xóa 1 dòng (chỉ dedupe, không
   đổi logic). Ghi nhận: đây là va chạm do sửa song song, không phải lỗi
   thiết kế.
2. **Duplicate `maskGeometryAtTrack`:** O2 định nghĩa tạm cùng chữ ký
   (ghi rõ "O2 định nghĩa tạm vì O1 chưa hạ cánh; lúc gộp parent dedupe").
   Bản tạm của O2: tâm = track, **w/h tĩnh, keyframes bị bỏ qua**, throw
   khi track rỗng — trái quy tắc parent chốt ("keyframes thắng w/h").
   Lúc O1 verify, bản tạm (định nghĩa sau) đã shadow bản O1 khiến §11
   fail (w/h = 1,1). **Đã dedupe: chỉ giữ MỘT bản duy nhất là bản O1**
   (O2 cũng đã tự cập nhật header section của mình thành "dùng helper O1,
   KHÔNG định nghĩa lại"). Bản tạm đã bị gỡ; `trackPointsToMaskKeyframes`
   của O2 vốn gọi `maskGeometryAtTrack` tại hợp các mốc thời gian và
   document đúng ngữ nghĩa O1 (w/h theo mask keyframes) nên nay chạy đúng
   với bản duy nhất này. Test §10 của O2 vẫn xanh vì fixture của họ
   không có keyframes.
3. **Lệch cosmetic TS vs CJS (đã biết, có từ D4):** TS trả
   `keyframes: undefined` (key có mặt), render CJS `delete` key.
   Comparator của mirror script so `Object.keys` nghiêm ngặt nên 6 probe
   render từng fail dù JSON giống hệt. Không đổi logic so sánh (theo
   luật của script) và không đổi quy ước `delete` của render (test O2
   assert key vắng mặt) — thay vào đó đăng ký **knownGap
   `mask-keyframes-undefined-vs-absent`** trong
   `check-video-spec-mirror.mjs`: chỉ chấp nhận khi JSON giống hệt nhau
   và tập key chỉ lệch đúng key `keyframes`; số lệch 1 bit cũng FAIL.
   Test chéo số thật nằm ở `maskTrack.test.ts` (§5, JSON khớp 3 mirror).

## 7. File đổi/thêm (đợt này, đã stage — KHÔNG push)

- `packages/video-spec/src/mask.ts` — thêm `maskGeometryAtTrack` (+ import
  `interpolateTrack`/`TrackAttachment` từ `./tracking.js`).
- `packages/video-spec/src/mask.js` — mirror ESM của hàm mới.
- `server/render/src/mask.js` — thêm `interpolateTrackPoints` +
  `maskGeometryAtTrack` + export + self-test §11; dedupe 2 va chạm §6
  (chỉ trong file chung này, không đụng hàm O2/O3: `buildMaskTrackGeq*`,
  `sampleTrackAt` đã bị O2 gỡ, `hasTrackedMask`,
  `trackPointsToMaskKeyframes`, `trackedMaskAnimKey` giữ nguyên).
- `packages/video-spec/scripts/check-video-spec-mirror.mjs` — 5 probe
  mask TS↔JS + nhóm probe mới `mask-track: mask.ts ↔ render mask.js`
  (6 probe, knownGap §6.3).
- `apps/web/src/lib/maskTrack.test.ts` — mới (22 test).
- `apps/web/tsconfig.json` — thêm `src/lib/maskTrack.test.ts` vào
  exclude (theo quy ước: mọi `*.test.ts` đều exclude khỏi `tsc`).
- `docs/PHASE9_ROUND87_O1_MASK_TRACK_SPEC_LIMITS.md` — file này.

Stage: `~/workspace/repo-1-push/paths-loop/phase9-round87-o1-mask-track-spec.txt`
(NUL-delimited, chỉ file text, không binary).

## 8. Nợ mở / bàn giao cho O2, O3 (không phải việc O1)

- O2 render: nối `maskGeometryAtTrack` vào `render.js` (hiện vẫn gọi
  `maskGeometryAt(mask, 0)` tĩnh ở 2 chỗ) + quyết lệch w/h keyframes ở
  đường geq-track (§4.4) + mirror Python nếu cần (§4.6).
- O3 preview: chuyển `maskedUnitSource`/vẽ mask sang
  `maskGeometryAtTrack`, bỏ hành vi dịch cả unit đã mask (§4.5).
- O5 UI: `TrackPanel.tsx` đã có `hasMask` + gợi ý mask-chưa-bám-track;
  sau khi O2/O3 nối xong thì cập nhật gợi ý đó (O1 không đụng UI).
- Không đụng TTS 39. Không đụng file workflow `.github`.
