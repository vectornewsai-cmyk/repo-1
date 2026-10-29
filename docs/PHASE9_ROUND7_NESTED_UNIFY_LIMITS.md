# Phase 9 đợt 7 (cron 02:03 26/10) — Thống nhất ngữ nghĩa nested/adjustment — LIMITS tổng hợp của parent

> Đợt này đóng các nợ lớn nhất của đợt 6 (docs/PHASE9_ROUND6_NESTED_WIRING_LIMITS.md):
> UI adjustment chưa tới render, 2 shape adjustment song song, layer trong
> subSpec bị flatten bỏ qua lặng lẽ, splitClipByLayers chưa có mirror TS,
> preview/render dùng 2 shape nested khác nhau, UI chưa đặt được
> transition/opacity lên nested clip, scope một track của U4 bị khóa.
> Mọi claim dưới đây đều có test/số đo đi kèm trong log vòng lặp.

## Ngữ nghĩa chuẩn đã chốt (áp dụng từ đợt này, đừng trích luật cũ)

1. **Shape chuẩn duy nhất:** `VideoSpec.adjustmentLayers` cấp project
   (`packages/video-spec/src/adjustment.ts`, U1). Field scope tùy chọn
   `tracks?: number[]` = chỉ số vào `spec.tracks` CẤP PROJECT (vắng/rỗng =
   áp mọi track, tương thích project cũ). Thứ tự mảng = thứ tự áp.
2. **UI shape legacy** (`kind: "adjustment"` trong `track.clips`) chỉ còn
   là đầu vào cũ: preview (U3) và render (U2) đều normalize nó ở entry
   thành layer chuẩn với `tracks=[chỉ số track host]`. Panel từ nay chỉ
   tạo layer chuẩn; convert legacy → spec giữ scope host-track (parent
   sửa store: trước đó store truyền `"all"`, đổi ngữ nghĩa lặng lẽ).
3. **Nested chuẩn:** nested clip mang `subSpec` (U1 `normalizeNestedClip`:
   shape cũ tracks trực tiếp → subSpec, fail fast khi mâu thuẫn).
4. **Luật scope qua flatten — đã đối chiếu chéo bằng script của parent
   (không chỉ tin báo cáo từng luồng):** project track0 = nested 2 lá,
   track1 = clip phẳng, layer cấp project `tracks=[1]` → sau flatten
   layer thành `tracks=[3]` (chỉ số phẳng của clip t1) và
   `splitClipByLayers` chỉ áp cho clip t1, không áp 2 lá nested. Vậy
   preview (xét trackStack[0] = chỉ số cấp project) và render (dịch qua
   lineage rồi xét chỉ số phẳng) cho cùng một tập track lá đối với layer
   cấp project. PENDING của U5 về "hai không gian chỉ số" được đóng cho
   layer cấp project; layer trong subSpec vẫn cần test liên phía riêng
   (xem § Chưa làm).
5. **Luật cũ đã chết, đừng trích lại:** R4 "track sau nằm trên clip",
   "layer chuẩn chưa tới render", "preview bỏ qua adjustmentLayers".

## Đã chứng minh thật (kiểm chứng gộp của parent, chạy lại toàn bộ)

- tsc apps/web: 0 lỗi (sau khi parent thêm `nestedUnify.test.ts` vào
  exclude của tsconfig — cùng mẫu 17 file test kia); vite build pass.
- i18n check R6: PASS (U4 thêm 29 key, parity vi=en).
- Spec: adjustment.test 25/25, nested.test 49/49 (U1).
- Render: unify test mới 55/55 (U2), E2E mới 43 PROVEN + 1 PENDING (U5).
- Preview: nestedPreview 44/44, nestedPreviewR3 17/17 (U3),
  nestedUnify 12 PROVEN (U5), preview-engine 337 (theo báo cáo U3).
- UI logic: nestUtils 28/28 (U4 + parent sửa scope, xem dưới).
- Hồi quy render cũ (U2/U5 chạy lại): adjustment render 39/39,
  adjustment 46/46, adjustment spec 21/21, nested render 24/24,
  nested R3 43/43, nested E2E cũ 28/28.
- Click-test browser thật (CDP Chromium headless, U6): 12/15 pass,
  3 SKIP (xem dưới). Trước đợt 7 là 8/15 — crash Inspector đã sửa nên
  U4b/U5/U6 giờ pass.

## Parent đã sửa trong lúc tích hợp (không phải báo cáo của luồng)

1. **Crash Inspector (bug thật do U6 tìm ra):** chọn nested clip làm
   trắng toàn app vì mục thời gian của Inspector render in/out cho mọi
   kind trừ text/sticker/image, mà NestedClip không có in/out nên
   `undefined.toFixed()` throw, không có error boundary. Sửa: loại
   `nested` khỏi hàng in/out (Inspector.tsx). Chạy lại harness: U4b
   (gộp nested), U5 (InnerClipEditor), U6 (transition/opacity) đều pass.
2. **Mở khóa scope một track của U4:** U4 viết panel trong lúc spec
   chưa có field `tracks` nên khóa nút Thêm khi chọn một track; U1
   song song đã thêm field này. Parent: `validateScopeForWrite` không
   còn chặn, `addSpecAdjustmentLayer`/`legacyLayerToSpec` ghi thật
   `tracks`, panel bỏ disable + cảnh báo, 2 test U4 cập nhật thành
   assert ghi được (nestUtils vẫn 28/28). Key i18n
   `adjustment.scopeSingleBlocked` còn trong vi/en.json nhưng không còn
   dùng — giữ lại cho tương thích, không xóa vội.
3. **Convert legacy giữ scope host-track:** store trước đó truyền
   `"all"` khi convert, đổi ngữ nghĩa từ "chỉ track host" sang "mọi
   track". Parent: store tính chỉ số track host và truyền
   `{ trackIndices: [hostIdx] }`.
4. **Form boundary revert sau khi lưu thất bại:** lưu transition thất
   bại nhưng form vẫn giữ draft, nhìn như đã lưu. Parent: lưu thất bại
   thì form quay về giá trị đã lưu thật (NestedClipPanel). Nhờ đó U6b
   pass. Lưu ý trung thực: trong chuỗi harness, lý do từ chối ở U6b là
   luật "không đặt cả hai đầu" (nested đã có transOut, thêm transIn bị
   chặn) — không phải "không có clip kề trái" như tên case ghi; luật
   kề trái chưa được chứng minh riêng bằng case này.
5. **tsconfig:** thêm `src/lib/nestedUnify.test.ts` vào exclude (lỗi
   TS5097 do import `.ts` — cùng mẫu các file test khác).

## Chưa làm được / chưa nối (trung thực)

1. **3 SKIP click-test (U2a/U2b/U2c):** kéo/trim/box-select trên hàng FX
   cho layer legacy — không chạy được vì panel mới không còn tạo layer
   legacy, project mẫu không có legacy. Cần project chứa legacy để chạy,
   hoặc quyết định bỏ hẳn đường FX legacy (khi đó xóa case khỏi harness
   thay vì để SKIP mãi).
2. **Layer chuẩn chưa vẽ trên hàng FX Timeline** (nợ R7 §3 còn nguyên):
   panel quản lý được nhưng Timeline không hiển thị layer chuẩn; U6
   xác nhận hàng FX vắng là đúng thiết kế hiện tại, không phải lỗi.
3. **Test liên phía scope cho layer trong subSpec:** parent mới đối
   chiếu layer cấp project (xem § Ngữ nghĩa chuẩn #4). Layer trong
   subSpec: từng phía đã chứng minh riêng (U2 remap + scope thu hẹp về
   track lá; U3 remap + scope theo track subSpec), chưa có test nào chạy
   cùng project qua cả preview lẫn render để khẳng định cùng tập track lá.
4. **Nợ R6 vẫn còn:** ducking trỏ vào trong project con; nested clip vừa
   có `opacity` vừa có `src` kèm `subSpec` (chưa có test riêng).
5. **Chỉ transition fade qua biên nested** (R3, không đổi ở đợt 7);
   wipe/slide/dissolve vẫn fail fast. Panel U4 cố tình hiển thị cả các
   loại đó để user thấy fail-fast.
6. **Key i18n đề xuất ở NESTED_PREVIEW_LIMITS §4** (`preview.nestedFlattened`,
   `preview.adjustmentActive`, `preview.effectSkippedInPreview`): U4 đối
   chiếu ngày 26/10 — vẫn chưa merge, không có gì lệch để sửa; thuộc
   luồng preview, chưa thêm ở đợt này.
7. **`packages/video-spec/src/index.js` (output cũ)** vẫn thiếu export
   adjustment (nợ từ R2, U1 xác nhận lại): consumer JS phải import trực
   tiếp `adjustment.js` cho tới khi file được regenerate từ `index.ts`.

## Không làm (đúng chủ trương)

- Không push GitHub, không tag/release, không binary trong batch.
- Không đụng cloud/collab, model đóng, nhạc có bản quyền.
- Batch chỉ stage file text; dist/ chỉ là output kiểm chứng, không stage.
