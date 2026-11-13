# PHASE9_ROUND88_P6_MASK_WARN_REFACTOR_LIMITS.md — Sửa warn validator image+track+mask + refactor preview O4 sang helper O1

Đợt 88, luồng P6. Đóng nợ LIMITS gộp đợt 87 §4 mục 11 (warn validator
"track sẽ bị bỏ qua" chưa chính xác cho clip image có mask) và mục 13
(preview O4 là bản inline thứ 3, không dùng helper O1 `maskGeometryAtTrack`).
KHÔNG push. Không release/tag. Không đụng TTS 39, không đụng file workflow,
không đụng `render.js` đường chính (P1/P2 đang làm — P6 chỉ đọc).

## 1. (a) Validator warn — image + track + mask

### Câu warn cũ sai ở đâu

`validate.js` (nhánh `else if` cho kind không phải video/text/sticker) warn
chung cho mọi clip image có track:

> `track chưa hỗ trợ cho clip image — track sẽ bị bỏ qua (chỉ video/text/sticker bám quỹ đạo, xem D3_LIMITS.md)`

Với clip image **có mask**, câu này sai: render png/trackgeq đã đo ở đợt 87
O2 §4 — ảnh đứng yên (không có shift D3, overlay 0:0) nhưng **mask vẫn bám
theo track** (tâm mask image = điểm track tại t=0.5/2.0/3.5: 0.3875 / 0.5 /
0.6125, sai số < 0.0001; test O2 số 2 khóa lại ở §4 dưới). Track chỉ "bị bỏ
qua" ở vị trí của ảnh, không phải toàn bộ.

### Câu warn mới (chỉ khi image + track + mask)

> `track không dịch chuyển clip image (ảnh giữ vị trí tĩnh), nhưng mask vẫn bám theo track (xem D3_LIMITS.md)`

- Image có track nhưng **không mask**: giữ nguyên warn cũ
  (`TRACK_UNSUPPORTED_KIND`) — track thật sự không có tác dụng gì.
- Audio + track: giữ nguyên warn cũ (không liên quan mask).
- Video/text/sticker: không đổi (nhánh kia không đụng tới).

### Mã phân loại mới `TRACK_IMAGE_MASK`

Vì `validateCodes.js` khóa regex từng chữ (test `test_validate_codes.js`
khóa 3 chiều: classifier == fragment `validation.*` == template vi/en),
thêm mã mới thay vì sửa text trong mã cũ:

- `server/render/src/validateCodes.js`: thêm pattern `TRACK_IMAGE_MASK`
  (regex khớp đúng câu warn mới); tổng mã **108 → 109**.
- `apps/web/src/i18n/fragments/round63-r5.json` + `vi.json` + `en.json`:
  thêm template `validation.TRACK_IMAGE_MASK` (vi/en, vi ≠ en, chỉ có
  placeholder `{where}`); dict **2515 → 2516 key lá** (vi==en, cùng tập
  key — xem §4).
- `server/render/src/test_validate_codes.js`: đếm mã 108 → 109; thêm
  fixture image+track+mask và video+track+transition vào mục (c); assert
  rõ: câu warn mới đúng từng chữ, mã `TRACK_IMAGE_MASK`, không còn chuỗi
  "track sẽ bị bỏ qua" với combo này; image+track không mask vẫn
  `TRACK_UNSUPPORTED_KIND`.

### Phát hiện thêm trong lúc làm (a): regex `TRACK_TRANSITION` đã stale từ closing đợt 87 — ĐÃ SỬA

Closing đợt 87 đổi câu warn transition trong `validate.js` thành
"(chỉ phần dịch chuyển của unit; mask vẫn bám theo track, ...)" (theo O6 C6)
nhưng **không đồng bộ** `validateCodes.js` + template fragment/vi/en — 3 chỗ
vẫn giữ câu cũ "(keyframes cũng vậy, ...)". Hậu quả kiểm chứng được bằng
`classifyValidationMessage` trước khi sửa: warn transition thật rơi về mã
chung `VALIDATION_DETAIL`, mất mã `TRACK_TRANSITION` (UI hiện chi tiết thô
thay vì template đã dịch). Test không bắt được vì mục (c) không có fixture
video+track+transition nào.

P6 đã đồng bộ lại cả 4 chỗ (regex + template vi/en ở fragment + vi.json +
en.json) theo đúng chuỗi `validate.js` hiện tại, và thêm fixture
video+track+transitionOut vào mục (c) để khóa — từ nay lệch sẽ đỏ test
ngay. Không đổi số lượng key (chỉ sửa text). Đây là sửa ngoài phạm vi hẹp
của mục 11 nhưng cùng họ warn/cùng file/cùng cơ chế khóa 3 chiều; parent
có thể revert riêng phần này mà không ảnh hưởng mục 11 (2 thay đổi độc lập
trong cùng file).

### UI (TrackPanel / MaskPanel) — đã đọc, KHÔNG sửa

- `TrackPanel.tsx` chỉ render cho sticker/text/video (`stickerClip` null
  với image) và `trackIgnoredReason` chỉ biết 2 lý do (ASS / transition) —
  image không gắn được track qua UI, nên không có hint UI nào nói sai về
  image+track+mask. Không thêm key i18n UI nào.
- `MaskPanel.tsx:180` hiện `motionTrack.maskStillFollows` cho nhánh
  transition (đã đúng từ closing, O6 C6); `maskTrackUiState` trả `"none"`
  cho image (test O5 dòng 222 khóa) — MaskPanel không hiện hint track cho
  image. Không sửa.
- Key `motionTrack.maskStillFollows` đã có từ closing đợt 87, không thêm
  key UI mới. Key i18n duy nhất thêm đợt này là
  `validation.TRACK_IMAGE_MASK` (template hiển thị của mã validator).

## 2. (b) Refactor preview O4 sang helper O1 — KHÔNG đổi hành vi

`apps/web/src/preview.tsx` — `maskedUnitSource` bỏ bản inline thứ 3:

```ts
// Cũ (O4): baseMask = mask + interpolateMaskAt (keyframes) rồi ghi đè x/y
//   bằng interpolateTrackPoints (mirror của interpolateTrack).
// Mới (P6): const effMask = maskGeometryAtTrack(mask, track ?? null, localT);
```

Helper O1 (`packages/video-spec/src/mask.ts`, đã export qua
`@repo-1/video-spec` từ trước — `preview.tsx` vốn đã import
`interpolateMaskAt` từ đó) có cùng quy tắc: track thắng x/y, keyframes
thắng w/h, shape/feather/invert giữ nguyên. `interpolateTrackPoints`
(previewEngine) và `interpolateTrack` (video-spec) cùng công thức + cùng
thứ tự phép tính (cả hai sort points, tuyến tính, kẹp ngoài khoảng).
Import `interpolateMaskAt` khỏi `preview.tsx` (chỉ dùng ở chỗ đã gỡ;
`interpolateTrackPoints` vẫn dùng ở 2 chỗ khác nên giữ import).

**Khác biệt duy nhất so với bản inline** (đã khóa bằng test, xem §3):

1. `keyframes` bị bỏ khỏi kết quả (`maskGeometryAt` trả `keyframes:
   undefined`) trong khi inline giữ lại. **Không ảnh hưởng pixel:**
   `applyMask` → `maskAlphaAt` chỉ đọc shape/x/y/w/h/feather/invert,
   không đọc `keyframes`.
2. Track rỗng (`points: []`, spec không hợp lệ — validator báo lỗi):
   helper fallback về hình học tĩnh; inline cũ ép tâm `(0.5, 0.5)`.
   Helper khớp render (bản CJS `maskGeometryAtTrack` của O1/O2) và đúng
   hơn. Lệch chỉ lộ khi tâm mask tĩnh ≠ (0.5, 0.5).

Call site image (`preview.tsx`, dòng ~2196) **không đổi** — vẫn không truyền
track (nhiệm vụ (b) cấm đổi hành vi). Comment ở đó đã sửa cho đúng sự thật
(xem §5).

## 3. Kiểm chứng (số thật)

| Kiểm chứng | Kết quả |
|---|---|
| `test_validate_codes.js` (mới, gồm fixture image+track+mask + video+track+transition) | **1596 pass, 0 fail** (trước: 1572) |
| `classifyValidationMessage` trực tiếp: warn image+mask mới / warn transition closing | `TRACK_IMAGE_MASK` / `TRACK_TRANSITION` (trước sửa: transition → `VALIDATION_DETAIL`) |
| `maskTrackPreview87O4.test.ts` (12 check gốc + 25 parity mới, esbuild bundle) | **37/37 xanh** — sweep parity helper==inline cũ: 20 cặp mask×track × 10 mốc t, lệch max **0** (bit-identical) trên 7 trường applyMask đọc |
| `maskTrack.test.ts` (O1) | **22/22** |
| `maskKeyframes.test.ts` (D4) | **14/14** |
| `mask.js --self-test` | pass hết |
| `test_round87_o2_mask_track.js` (render thật, hồi quy validate.js) | **25/25 pass** |
| `maskTrackUi87O5.test.ts` (O5 UI) | **18/18 pass** |
| `previewEngine.test.ts` | **14 passed** |
| Dict i18n: vi==en==**2516** key lá, cùng tập key | `i18nOrphans60Q4` **16/16**, `i18nAudit59P7` **8/8**, `ProjectMenu.i18n55L1` **6/6**, `saveToast31` 15/15, `structuredNotes32` 12/12, `codecProbeUi75C6` 16/16, `i18nModals79G9` 9/9, `i18nModals80H7` 13/13, `i18nSweep81I9` 16/16, `codecProbeDebts76D8` 14/14, `errorDetail34Q4` 35/35, `reverseBadge46B6` 8/8, `reverseCompat44Z6` 10/10, `reversePlaybackI18n49E2` 3/3, `reverseToggleI18n48D4` 3/3, `i18nRound57N4` 14/14, `speedWarnTooShortDead63R10` 5/5 |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** |
| `npx vite build` (apps/web) | **pass** (33.61s) |
| Probe pixel preview sau refactor (CDP, harness O4, vite dev 5174, 2 lần chạy — số giống hệt nhau) | cx project **0.4007 / 0.5007 / 0.6007** @0.5/1.0/1.5s; cy 0.5014; count 21243/21246/21250; bbox rộng project @1.0s = 0.3974 |

### Parity pixel trước/sau refactor

| t (s) | Preview TRƯỚC (O4 ghi) | Preview SAU (P6 đo) | Render png (O4 ghi, code không đụng) | \|sau − render\| |
|---|---|---|---|---|
| 0.5 | 0.4006 | 0.4007 | 0.4004 | 0.0003 |
| 1.0 | 0.5007 | 0.5007 | 0.5004 | 0.0003 |
| 1.5 | 0.6007 | 0.6007 | 0.6004 | 0.0003 |

- Chênh trước→sau ≤ **0.0001** (1 bậc làm tròn 4 chữ số thập phân của cx
  canvas — nhiễu lượng tử, không phải lệch hành vi).
- Sau refactor vs render png: lệch ≤ **0.0003 < 0.0005** như O4 — giữ
  nguyên ngưỡng parity. Số render png lấy lại từ O4 LIMITS §1 (P6 không
  đụng `render.js`, không render lại; O2 test 25/25 chạy lại đã khóa render
  vẫn đúng).
- Lưu ý setup probe: port 5173 đã có vite dev của luồng khác (pid 9273)
  nên vite của P6 chạy ở **5174**; cả hai serve cùng repo nên không ảnh
  hưởng số đo. Fixture `white720-o4.mp4` tạo lại bằng ffmpeg rồi **xóa**
  sau khi đo (không stage binary).

## 4. Dict 2515 → 2516 — các file đã bump

Thêm 1 key `validation.TRACK_IMAGE_MASK` (fragment round63-r5 + vi/en.json)
nên toàn bộ test khóa số dict phải bump. Đã cập nhật **17 file** (9 file chỉ
assert/label + 8 file chuỗi thành phần), theo đúng mẫu parent làm ở closing
đợt 87 (nối tiếp chuỗi, không viết lại lịch sử):

- Assert/label: `i18nAudit59P7`, `codecProbeUi75C6`, `saveToast31`,
  `structuredNotes32`, `reverseBadge46B6`, `reverseCompat44Z6`,
  `reversePlaybackI18n49E2`, `reverseToggleI18n48D4`, `i18nRound57N4`.
- Chuỗi thành phần + assert: `ProjectMenu.i18n55L1`, `i18nOrphans60Q4`,
  `i18nModals79G9`, `speedWarnTooShortDead63R10` (comment),
  `errorDetail34Q4` (comment), `codecProbeDebts76D8` (comment),
  `i18nModals80H7`, `i18nSweep81I9`.

Hai check trong `i18nModals80H7` / `i18nSweep81I9` pin "dict 2463/2463" —
**đã stale từ đợt 84** (dict lên 2489 mà không ai bump; chúng đỏ sẵn ở
2515 trước P6, closing đợt 87 không chạy 2 test này). P6 bump cả hai về
2516 (cùng đợt thêm key) nên nay cả hai xanh trở lại (13/13, 16/16). Quét
toàn repo: không còn test nào pin số dict cũ khác (chỉ còn các mốc lịch sử
trong comment chuỗi thành phần, giữ nguyên là đúng).

## 5. Giới hạn / nợ mở (trung thực)

1. **Preview LỆCH render ở combo image+track+mask** (phát hiện khi đọc
   code cho (b), chưa sửa — ngoài phạm vi vì (b) cấm đổi hành vi):
   render png/trackgeq làm mask ảnh bám track (O2 §4 đã đo), nhưng call
   site image của `preview.tsx` không truyền track nên preview giữ mask
   tĩnh. Comment cũ của O4 ở đó ("render bỏ qua track cho ảnh") là SAI —
   P6 đã sửa comment cho đúng sự thật, không đổi code. Cần parent quyết:
   truyền `clip.track` cho call site image (khớp render, đổi hành vi
   preview) hay giữ lệch này. Đính chính thêm: câu "validator chỉ cho
   track ở clip video" trong O4 LIMITS §4 là SAI — "Chỉ dùng cho video
   clip" ở `video-spec/index.ts` nói về field `enhance`/`motion`, không
   phải `clip.track`; validator chấp nhận track trên image (chỉ warn,
   `ok=true`, 0 lỗi — kiểm chứng trực tiếp ở P6), nên combo này là hợp
   lệ, không phải spec lỗi. UI editor không gắn được track cho image
   (TrackPanel chỉ hiện cho sticker/text/video) nên combo tới được chủ
   yếu qua import/spec tay.
2. **Mode geq:** warn mới nói "mask vẫn bám theo track" — đúng ở mode
   mặc định png và trackgeq; ở `--mask-mode geq` mask image là tĩnh tại
   mask.x/y (không có shift D3 để cưỡi theo). Cùng tính chất gần đúng như
   warn transition của closing (cũng không phân biệt mode). Nếu parent
   muốn chính xác tuyệt đối theo mode thì warn phải dài hơn nhiều; P6
   giữ ngắn gọn, khớp phong cách warn transition.
3. **Không đụng:** TTS 39, file workflow, `render.js`, `mask.js`,
   `mask_anim.py`, `mask_png.py`, `TrackPanel`/`MaskPanel` (chỉ đọc).
   `apps/web/dist` (vite build) và `white720-o4.mp4` không stage.
4. Gap analysis: mục 11 + 13 ở §4 của `PHASE9_ROUND87_LIMITS.md` nay đã
   đóng — P6 không sửa file gap (tránh xung đột với luồng khác đang
   đọc/sửa); parent/closing cập nhật khi gộp.

## 6. File đổi (stage, KHÔNG push)

Batch: `~/workspace/repo-1-push/paths-loop/phase9-round88-p6-mask-warn-refactor.txt`
(NUL-delimited, 26 file text, không binary, không workflow):

- `server/render/src/validate.js` — nhánh warn image+mask mới.
- `server/render/src/validateCodes.js` — mã `TRACK_IMAGE_MASK` mới +
  đồng bộ regex `TRACK_TRANSITION`.
- `server/render/src/test_validate_codes.js` — đếm 108→109, 2 fixture mới
  + assert rõ cho 2 mã.
- `apps/web/src/i18n/fragments/round63-r5.json` — template
  `validation.TRACK_IMAGE_MASK` vi/en + sửa template `TRACK_TRANSITION`.
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` — như trên.
- 17 file test khóa số dict 2515→2516 (xem §4).
- `apps/web/src/preview.tsx` — `maskedUnitSource` dùng helper O1; sửa
  comment call site image cho đúng (không đổi hành vi).
- `apps/web/src/maskTrackPreview87O4.test.ts` — gọi helper thật + sweep
  parity §6 (37 check).
- `docs/PHASE9_ROUND88_P6_MASK_WARN_REFACTOR_LIMITS.md` — file này.

Log luồng:
`workspace/goals/capcut-clone-video-editor/hidden_files/round88-p6.md`.
Harness/probe: `apps/web/scripts/probe87o4-mask-track-preview.cdp.mjs`
(không đổi); số đo thô sau refactor tại `/tmp/round88-p6/probe-after.json`.
