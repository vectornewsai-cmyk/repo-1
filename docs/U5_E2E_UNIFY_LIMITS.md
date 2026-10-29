# U5 — E2E + hồi quy cho đợt 7 VCut (thống nhất ngữ nghĩa nested/adjustment)

Luồng U5 chỉ tạo file test + docs của mình, KHÔNG sửa code sản phẩm, KHÔNG
push GitHub, KHÔNG release/tag, KHÔNG thêm binary. Mọi MP4 đo đạc chỉ nằm
trong thư mục tạm (`/tmp/vcut-u5-nested-adj-*`), không ghi vào repo.

## File của luồng U5 (3 file, duy nhất)

- `server/render/test_nested_adjustment_e2e.js` — E2E render FFmpeg thật
  qua CLI `render.js` (không dựng filter tay, không mock).
- `apps/web/src/lib/nestedUnify.test.ts` — test thuần logic preview, chạy
  bằng `node --experimental-strip-types` từ `apps/web`, không cần UI.
- `docs/U5_E2E_UNIFY_LIMITS.md` — chính file này.

## Cách đọc kết quả (quan trọng, đừng trích sai)

- **PROVEN**: assert trên hành vi đã đo được. Fail thì exit != 0.
- **PENDING**: hành vi thuộc ngữ nghĩa thống nhất CHƯA CÓ entry/API, chỉ in
  ra để luồng khác khớp sau — KHÔNG tính vào pass, KHÔNG ảnh hưởng exit
  code. **Exit 0 chỉ có nghĩa "phần đã chứng minh xanh", không có nghĩa
  "đợt 7 đã thống nhất xong".**

## Ma trận kiểm chứng

### A. Chuỗi UI -> spec chuẩn -> render (phía render, PROVEN)

| Case | Kết quả | Số đo thật |
|---|---|---|
| Layer cấp project + nested (nested 0-6s, leaf 0-6s, layer [2,4) brightness 60) | ✅ | t=1 mean 0.037, t=3 mean 76.844, t=5 mean 0.802 (ngưỡng giữ nguyên < 1.5, đổi > 20) |
| Thời gian layer = timeline NGOÀI sau remap (nested ở start=2, leaf local 0-4 -> ngoài 2-6, layer [3,5)) | ✅ | t=2.5 mean 0.487, t=4 mean 77.054, t=5.5 mean 0.778 |
| Layer trong subSpec sau remap (sub layer [1,3) trong nested 0-6s) | ✅ | t=2 mean 77.054 (đổi mạnh), t=5 mean 0.759 (giữ nguyên) |
| Flatten remap layer con: thứ tự, thời gian, scope | ✅ | layer con nối TRƯỚC layer ngoài; layer con [1,3) qua nested ở start=2 -> ngoài [3,5); scope thu hẹp về track lá phẳng [1]; layer con ngoài cửa sổ -> bỏ + warning nêu rõ |
| Layer cấp project có scope `tracks` (chỉ số spec phẳng) | ✅ | scope [0]: t=1.5 mean 78.070 (đổi), t=2.5 mean 0.832 (giữ); scope [1]: t=1.5 mean 0.583 (giữ), t=2.5 mean 79.189 (đổi) |
| Layer không scope áp mọi track (vắng scope = mọi track) | ✅ | 2 track nối tiếp, layer [1,3): t=1.5 mean 78.077, t=2.5 mean 79.202 |
| Nested opacity 0.5 + layer cấp project cùng áp | ✅ | opacity-vs-base t=1: 61.853; both-vs-op t=1: 0.156, t=3: 38.522; both-vs-base t=3: 93.913 — layer không ghi đè opacity |
| Layer video không chạm audio trong nested (tone 440Hz) | ✅ | mean_volume 2-4s: baseline -24.1 dB, layered -24.1 dB (lệch 0 dB) |
| Cổng fail fast: layer cắt giữa leaf trong nested mang opacity keyframes | ✅ | render thất bại, stderr nhắc adjustment |
| Hồi quy tương thích: nested không có layer | ✅ | render OK, duration 6s, frame t=3 khớp spec phẳng tương đương mean 0.000 |
| Validator scope: `track` (số ít) và `tracks` không phải mảng chỉ số thì từ chối; `tracks` mảng chỉ số hợp lệ thì chấp nhận | ✅ | xem E2E case A2 |
| Shape legacy nested (bí danh `nested` + in/out trực tiếp, không trim) | ✅ | flatten được, leaf start 0 duration 2 |

### B. Phía preview (PROVEN, sau khi U3 đẩy normalize giữa chừng)

| Case | Kết quả |
|---|---|
| Nested dạng chuẩn (`subSpec`) được preview nhận diện VÀ phẳng đúng (leaf nestedPath `["n1"]`) | ✅ |
| Preview đọc `trim` { in, out } khớp render (nested start 10, trim in 2, inner 3-7 -> ngoài 11, duration 4) | ✅ |
| `spec.adjustmentLayers` được `buildPreviewSpec` gộp vào clip (cắt 3 đoạn, đoạn giữa brightness 60) | ✅ |
| Adjustment trong nested được remap về timeline ngoài (layer [1,3) trong nested start 10 -> [11,13), nestedPath `["n1"]`, trackStack `[0,1]`) | ✅ |
| Luật scope chuẩn `scopeTracks`: vắng = mọi track; có danh sách = chỉ track trong danh sách ở đúng level; nestedPath phải là tiền tố; `trackIndex`/`trackStack` cũ chỉ còn là provenance (bị bỏ qua); scopeTracks sai (không phải mảng / chỉ số không nguyên) thì throw | ✅ |
| `applyAdjustmentPreview` + `buildPreviewSpec` theo scopeTracks (cả 2 thứ tự track đều cắt+gộp vì adjustment-track không mang scope) | ✅ |
| Adjustment không có thông tin track -> áp mọi clip (trùng với luật vắng scope = mọi track) | ✅ |
| Layer dạng danh sách spec (field `filters` mảng) KHÔNG được đọc khi nằm trên track adjustment (chỉ đọc `filter`/`effects` đơn) — đường track-clip legacy này khác đường layer chuẩn của U3 | ✅ (khóa hành vi hiện tại) |

### C. PENDING — chưa thống nhất, KHÔNG được claim

| Case | Bằng chứng hiện tại | Cần luồng khác làm |
|---|---|---|
| Đối chiếu liên phía: không gian chỉ số scope preview vs render | Preview scopeTracks là chỉ số theo LEVEL chứa layer; render `tracks` là chỉ số theo SPEC PHẲNG cuối. U5 chứng minh được từng phía riêng lẻ (preview §2, render A1/J) nhưng chưa có test nào chạy CÙNG project qua cả 2 đường để khẳng định scope của layer trong subSpec cho cùng một tập track lá | Một test liên phía (cùng project, đo cả preview-spec lẫn render) — không claim khớp nhau chỉ từ 2 test riêng lẻ |
| Ducking trỏ vào trong project con | Nợ R6, ngoài phạm vi file U5 | Không claim ở đây |
| Nested clip vừa có `opacity` vừa có `src` kèm `subSpec` | Nợ R6 (theo brief đợt 7, nested clip có `src` + `subSpec` là mơ hồ và render hiện throw), ngoài phạm vi file U5 | Không claim ở đây |

## Trạng thái thống nhất cuối đợt (đã đo, không còn là phân kỳ)

1. **Scope**: cả 2 phía đều có scope tường minh, vắng = mọi track —
   preview dùng `scopeTracks` (chỉ số theo level), render dùng `tracks`
   (chỉ số theo spec phẳng). Luật membership giống nhau (chỉ áp track
   trong danh sách); chỉ còn khác nhau không gian chỉ số (xem PENDING).
2. **Layer của subSpec**: cả 2 phía đều remap về timeline ngoài — preview
   remap adjustment track trong nested, render remap adjustmentLayers
   trong subSpec (giao cửa sổ, ánh xạ tuyến tính, scope thu hẹp về track
   lá). Layer con ngoài cửa sổ thì render bỏ + warning (không rơi lặng).
3. **Luật R4 cũ đã chết**: "track trên áp xuống" của preview R4 đã bị U3
   thay bằng scopeTracks trong lúc U5 chạy (xem mục chạy song song). Đừng
   trích lại luật R4 như ngữ nghĩa hiện tại nữa.

## Ghi chú chạy song song (trung thực, không sửa code luồng khác)

Trong lúc U5 chạy, luồng U3 đã đẩy nhiều đợt normalize vào
`apps/web/src/lib/nestedPreview.ts` (normalizeNestedClip,
convertCanonicalLayer, scopeTracks), và sau đó luồng U2 đã đẩy remap +
scope vào `server/render/src/nested.js`, `adjustment.js`, `render.js`.
Hệ quả trực tiếp lên file U5:

- Bản đầu của `nestedUnify.test.ts` viết §1.1/§1.2/§1.5 theo hành vi
  TRƯỚC đợt 7 (subSpec không nhận diện, trim bị bỏ, adjustmentLayers bị
  bỏ qua) nên fail khi U3 đẩy code mới — đó là code đích đổi giữa chừng,
  không phải lỗi của test U5. U5 đã probe lại bằng script độc lập (subSpec
  phẳng đúng, trim cho 11/4, adjustmentLayers gộp đoạn) rồi mới sửa §1
  thành assert theo hành vi mới đã kiểm chứng.
- Sau đó U3 lật tiếp luật scope (R4 -> scopeTracks) làm §2 cũ fail; U5
  đã đọc lại `adjustmentAppliesToClip` mới và sửa §2 theo luật scopeTracks
  đã kiểm chứng.
- Cuối đợt, U2 đẩy remap + scope phía render làm E2E case A1/D fail
  (bản đầu viết theo hành vi "subSpec layer bị bỏ lặng, scope chưa có");
  U5 đã đọc code U2 mới (remap giao cửa sổ + ánh xạ tuyến tính, scope
  thu hẹp về track lá, `tracks` theo spec phẳng) và sửa A/D, thêm case J
  (scope pixel) thành assert theo hành vi mới đã kiểm chứng.
- File test cuối xanh trên code hiện tại, nhưng nếu U2/U3 còn đổi tiếp
  thì các assert khóa hành vi này cần kiểm tra lại — đó là rủi ro cố hữu
  của chạy song song, không phải lỗi âm thầm.
- U5 KHÔNG sửa `nestedPreview.ts`, `render.js`, `nested.js`,
  `adjustment.js`, `packages/video-spec/*`, `components/nested/*`, hay
  `tsconfig.json`.

## Hồi quy đã chạy (số thật, từng suite)

| Suite | Kết quả |
|---|---|
| `server/render/test_nested_adjustment_e2e.js` (mới, U5) | 43 PROVEN pass, 0 fail, 1 PENDING (đối chiếu liên phía, in ra, không tính) |
| `apps/web/src/lib/nestedUnify.test.ts` (mới, U5) | 12 PROVEN pass, 0 fail, 2 PENDING (in ra, không tính: đối chiếu liên phía + nợ R6) |
| `server/render/src/test_nested_render.js` | 24/24 |
| `server/render/src/test_nested_r3.js` | 43/43 |
| `server/render/src/test_nested_e2e.js` (R6) | 28 pass, 0 fail |
| `server/render/test_adjustment_render.js` | 39 pass, 0 fail |
| `server/render/test_adjustment.js` | 46 pass, 0 fail |
| `apps/web/src/lib/nestedPreview.test.ts` | 31 pass |
| `apps/web/src/lib/nestedPreviewR3.test.ts` | 17 pass |
| `apps/web/src/lib/nestedDemo.test.ts` | 8 pass, 0 fail |
| `apps/web/src/components/nested/nestUtils.test.ts` | **Không chạy được bằng strip-types**: lỗi resolve module ở import time (`Cannot find module '.../packages/video-spec/src/effects'`), xảy ra trước mọi logic test; file gây lỗi không thuộc sở hữu U5 và U5 không sửa nó — cần chạy bằng đường bundler/vitest, không phải lỗi do U5 |
| `tsc --noEmit` (apps/web) | **3 lỗi, đều không phải do logic U5**: 2 lỗi ở `nestedPreview.ts` (code U3 đang sửa dở, TS2352) + 1 lỗi ở `nestedUnify.test.ts` (TS5097: import `.ts` cần `allowImportingTsExtensions` — mọi file `*.test.ts` khác đều nằm trong `exclude` của tsconfig, file U5 chưa có entry đó). U5 không sửa tsconfig theo luật sở hữu file; bước tích hợp của đợt: thêm `src/lib/nestedUnify.test.ts` vào `exclude` của `apps/web/tsconfig.json` (cùng mẫu 17 file test kia) rồi chạy lại tsc |

## Lưu ý về ngưỡng đo (để người chạy lại không hoảng)

- E2E dùng đúng preset/CRF mặc định của render.js (medium/20), giống
  `test_adjustment_render.js`. Lần chạy đầu dùng ultrafast + crf 28 cho
  thấy nhiễu sau đoạn layer lên mean ~1.77-1.78, vượt ngưỡng "giữ nguyên"
  < 1.5 một cách giả tạo — đó là nhiễu encoder, không phải lỗi layer.
  Đừng đổi ngưỡng mà không đổi kèm setting encode.
- Frame ngoài layer nhưng sau đoạn layer vẫn lệch nhẹ do dự đoán liên
  frame của x264 (đo thật: 0.78-0.80 với medium/20) — ngưỡng < 1.5 đã tính
  cả phần này, theo đúng cách đo của test adjustment cũ.
