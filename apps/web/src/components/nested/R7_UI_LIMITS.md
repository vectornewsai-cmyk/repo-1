# R7_UI_LIMITS.md — UI đợt 7: thống nhất ngữ nghĩa nested/adjustment (Phase 9 round 7, luồng U4)

Luồng U4 chỉ sở hữu UI: converter + panel + điểm nối store tối thiểu.
KHÔNG sửa `packages/video-spec/src/*`, `server/render/*`,
`lib/nestedPreview.ts`. Không push, không release/tag, không binary.

## 0. Đã làm (tóm tắt, số đo ở §6)

- `nestUtils.ts` (§R7 ở cuối file): converter legacy ↔ spec
  (`legacyLayerToSpec`, `specLayerToLegacy`), tạo/sửa/xoá layer chuẩn
  (`addSpecAdjustmentLayer`, `updateSpecAdjustmentLayer`,
  `deleteSpecAdjustmentLayer`), chuyển legacy sang chuẩn
  (`convertLegacyLayerToSpec`), danh sách hợp nhất
  (`listUnifiedAdjustmentLayers`), đặt/xoá opacity + transition qua biên
  trên nested clip (`setNestedClipBoundary`, `readNestedBoundary`).
  Các hàm legacy cũ (add/move/trim/update/delete kind:"adjustment") giữ
  nguyên để hàng FX và project cũ còn chạy — chúng không còn là đường
  tạo layer mới.
- `AdjustmentLayerPanel.tsx`: form tạo layer chỉ ghi vào
  `spec.adjustmentLayers`; danh sách tách 2 mục (chuẩn spec / legacy với
  badge "legacy" + nút "Chuyển sang chuẩn"); layer phức tạp vẫn sửa được
  thời gian, không sửa được filter.
- `NestedClipPanel.tsx`: nút "Transition & opacity" cho mỗi nested clip
  (đặt/xoá opacity + transition vào/ra); chuỗi hardcode "chữ" cho clip
  text rỗng đã thay bằng `i18nT("timeline.emptyLabel")` (xem §5).
- `store.ts`: 5 action mới qua `execCommand` (1 bước undo):
  `addSpecAdjustmentLayer`, `updateSpecAdjustmentLayer`,
  `deleteSpecAdjustmentLayer`, `convertLegacyLayerToSpec`,
  `setNestedClipBoundary`. Action cũ không đổi signature.
- `nested.css`: chỉ thêm class `.nested-legacy-badge`.
- `i18n/vi.json` + `en.json`: 29 key mới (xem §4).
- `Timeline.tsx`: KHÔNG SỬA (0 dòng) — cố tình: panel gọi thẳng store,
  đường FX legacy không đổi signature nên không cần điểm nối nào thêm;
  sửa Timeline lúc nhiều luồng round 7 cùng chạy chỉ thêm nguy cơ đụng
  file. Hệ quả ở §3.

## 1. Scope một track: CHƯA LÀM ĐƯỢC (nợ mở lớn nhất của R7)

Panel có chọn "Tất cả track" / "Một track" (kèm select track video),
nhưng scope một track hiện KHÔNG ghi được vào spec — đây là giới hạn
của spec, không phải của UI:

- `AdjustmentLayer` của video-spec v0.2.0 chỉ có
  `{ id, start, duration, filters }` — không có field scope.
  `adjustment.ts` nói rõ scoping theo track "là việc tương lai, không tự
  chế field khi render/preview chưa đọc nó", và
  `validateAdjustmentLayer` TỪ CHỐI key lạ. Ghi `tracks` lén vào layer
  sẽ làm project fail validate — nên U4 không làm vậy.
- Hành vi hiện tại (trung thực, không mạo nhận): chọn "Một track" thì
  panel hiện cảnh báo (`adjustment.scopeSingleBlocked`) và disable nút
  Thêm; hàm pure `addSpecAdjustmentLayer` /
  `legacyLayerToSpec` / `convertLegacyLayerToSpec` trả `{ error }` với
  message nêu rõ spec chưa có field scope. Không có trường hợp nào panel
  ghi layer "tất cả track" rồi báo là "một track".
- Code đã chuẩn bị sẵn cho ngày spec có field: type
  `SpecAdjustmentScope = "all" | { trackIndices: number[] }` (chỉ số vào
  `spec.tracks`, đúng dạng `tracks?: number[]` mà đợt 7 chốt). Khi luồng
  spec bổ sung field + validator + preview/render đọc nó, chỉ cần bỏ
  nhánh chặn trong `validateScopeForWrite` / `legacyLayerToSpec` là scope
  một track chạy — không phải sửa panel hay store.
- Ngữ nghĩa "tất cả track" hiện tại là ngữ nghĩa spec thật: layer áp
  cho mọi clip video giao nhau về thời gian (render nối filter tuần tự).
  Lưu ý: preview R4 còn hẹp hơn (layer chỉ áp cho clip có track thấp
  hơn trong cùng timeline) — xem §3.

## 2. Transition / opacity trên nested clip: làm được gì, chưa gì

ĐÃ LÀM (fail-fast ở tầng ghi, có test):
- Chỉ type `"fade"` được ghi. Chọn wipeleft/slideleft/dissolve trong
  panel (cố tình để sẵn để thấy fail-fast) rồi lưu → bị từ chối, không
  ghi gì, message nêu rõ chỉ hỗ trợ fade (khớp R3).
- Opacity phải trong 0..1; duration transition phải > 0 và < độ dài
  nested; không đặt cả transition vào và ra cùng lúc (R3 từ chối cặp
  in + out); host track phải là video và không khóa.
- Mỗi đầu transition BẮT BUỘC có clip kề chạm đúng biên trên cùng track
  (không gap). Nếu clip kề cũng khai transition phía đối diện thì phải
  khớp type + duration, ngược lại R3 sẽ throw khi phẳng.
- Xoá field bằng cách để trống (opacity) / chọn "— không đặt —".

CHƯA / CỐ TÌNH CHẶT HƠN R3 (đọc kỹ trước khi nới):
- Panel từ chối khi nested là clip đầu/cuối track (không có clip kề),
  trong khi R3 chỉ warning + bỏ qua. Đây là chủ đích: tránh "đặt xong
  mà không có tác dụng" lặng lẽ. Muốn nới thì bỏ nhánh yêu cầu clip kề
  trong `setNestedClipBoundary` — nhưng khi đó user sẽ thấy transition
  được lưu mà preview bỏ qua.
- Các ràng buộc ở tầng LÁ không kiểm tra được khi ghi (panel không phẳng
  subSpec): lá biên phải là video/text (image/sticker ở biên + transition
  → R3 throw), lá biên phải dài hơn duration fade, lá biên không có
  sẵn keyframes opacity, không dính transition trong project con, không
  bị cửa sổ cắt trái. Các trường hợp này preview/render vẫn throw đúng
  như R3 — panel không báo trước được, và cũng không được tự "sửa" lá
  để lách.
- Opacity trên nested chỉ chứa clip audio thì không đổi hình (audio
  không mang opacity — R3 warning, preview bỏ qua lặng lẽ).
- Audio không crossfade qua biên (tiếng vẫn cắt cứng như transition
  phẳng — giống R3, không phải regression của R7).
- Transition qua biên chỉ có tác dụng khi clip kề là clip video/nested
  trên cùng track video; đặt trên track audio/text/sticker bị panel từ
  chối luôn (R3 chỉ warning + bỏ qua ở track khác).

## 3. Hiển thị / nối preview / render: CHƯA XONG (luồng khác sở hữu)

- Layer chuẩn CHƯA vẽ trên hàng FX của Timeline: Timeline.tsx không sửa
  trong R7 (xem §0), hàng FX vẫn chỉ vẽ layer legacy. Layer chuẩn chỉ
  quản lý được từ AdjustmentLayerPanel cho tới khi luồng Timeline nối
  hàng FX đọc `spec.adjustmentLayers` (và quyết định selection/drag cho
  layer không có track host).
- Preview CHƯA đọc `spec.adjustmentLayers`: `buildPreviewSpec` /
  `flattenForPreview` hiện chỉ đọc layer dạng clip/track (duck-typed).
  Layer chuẩn tạo từ panel R7 do đó CHƯA đổi hình trong preview, dù nó
  là format chuẩn mà render nhắm tới. Luồng preview phải nối
  `spec.adjustmentLayers` vào flatten (kèm thứ tự track R4) thì layer
  chuẩn mới hiện.
- Render: `adjustment.ts` ghi rõ wiring render.js vẫn CHƯA làm (luồng R1
  sở hữu render.js) — bản export vẫn bỏ qua cả layer chuẩn lẫn legacy
  cho tới khi wiring xong. Đừng dùng panel R7 để khẳng định bản export.
- Ngược lại, layer legacy vẫn hiện trong preview như trước (đường
  duck-typed cũ) và vẫn kéo/trim được trên hàng FX — convert sang chuẩn
  sẽ làm layer đó "biến khỏi" preview/FX cho tới khi §3 được nối. Panel
  không cảnh báo điều này bằng popup; user cần biết trước khi convert
  hàng loạt. Đây là đánh đổi có chủ đích của việc thống nhất ngữ nghĩa
  trước, nối hiển thị sau — nếu đợt 7 muốn giữ preview, hãy nối preview
  trước khi khuyến khích convert.

## 4. i18n

- Key mới R7 (29 key, parity vi = en đã kiểm chứng bằng script đếm key
  ngày 26/10: 650/650 key, 0 key lệch): `adjustment.specNote`,
  `scopeLabel/scopeAll/scopeSingle/scopeSingleBlocked`, `specAddFail`,
  `specListTitle`, `legacyListTitle`, `legacyBadge`,
  `convertButton/convertOk/convertFail`, `complexFilter`,
  `specSaveOk/specSaveFail`, `trackSelectAria`, và toàn bộ
  `nestedBoundary.*` (button/title/note/opacity/opacityAria/transIn/
  transOut/transType/transDuration/transNone/save/saveOk/saveFail).
  Key cũ `adjustment.addFail/saveFail` giữ nguyên (đường legacy trong
  panel cũ không còn dùng addFail, nhưng không xoá để khỏi vỡ code khác
  tham chiếu key).
- Đối chiếu §4 của `NESTED_PREVIEW_LIMITS.md`: 3 key đề xuất
  `preview.nestedFlattened`, `preview.adjustmentActive`,
  `preview.effectSkippedInPreview` — kiểm tra vi.json + en.json ngày
  26/10 thì CHƯA key nào được merge vào file i18n (grep 0 kết quả), nên
  không có gì "lệch" để sửa. U4 không tự thêm 3 key này: chúng thuộc
  luồng preview, và tài liệu đó ghi rõ "parent merge sau". Khi luồng
  preview merge, đối chiếu lại tên key với §4 trước khi dùng.

## 5. Nợ R5 đã đóng trong file của U4

- Chuỗi hardcode `"chữ"` cho clip text không nội dung trong
  `NestedClipPanel.tsx` (InnerClipEditor) đã sửa thành
  `(clip.text || i18nT("timeline.emptyLabel"))` — cùng cách
  `Timeline.clipLabel` vẫn làm (vi "(trống)", en "(empty)"). Quét toàn
  bộ file của U4 (`nested/*.tsx`, `nested/*.ts`) ngày 26/10: chỉ còn
  đúng 1 chỗ đó, đã sửa xong, không còn literal "chữ" nào khác.

## 6. Kiểm chứng (số thật, ngày 26/10)

- `node apps/web/src/components/nested/nestUtils.test.ts`: **28/28**
  (17 test cũ N4/R5 + 11 test R7 mới: converter 3, add/update/delete/
  convert/unified 5, boundary 3). Trong lúc làm đã bắt được 1 lỗi setup
  test (2 lần add dùng idGen riêng nên trùng id "n1") — đã sửa test dùng
  chung idGen, không phải lỗi code.
- `npx tsc` (apps/web): **0 lỗi trong file của U4**, nhưng toàn repo
  vẫn còn **3 lỗi ngoài sở hữu của U4** nên `npm run build`
  (`tsc && vite build`) vẫn đỏ:
  `src/lib/nestedPreview.ts:509,510` (TS2352 cast EffectInput) và
  `src/lib/nestedUnify.test.ts:56` (TS5097 import `.ts` — file của luồng
  round 7 khác). U4 không sửa 2 file này.
- `npx vite build` (bỏ qua tsc): **pass** — 169 modules, 9.57s, ra
  `dist/` (dist chỉ là output kiểm chứng, KHÔNG nằm trong danh sách file
  đổi của U4 — đừng stage dist theo đợt này).
- Import runtime mới trong `nestUtils.ts` dùng đúng convention của
  video-spec: `.../effects.js` (bản mirror đã biên dịch, đã kiểm tra
  đồng bộ string-set với `effects.ts`). Thử `.ts` extension thì tsc lỗi
  TS5097, thử extensionless thì node test lỗi ERR_MODULE_NOT_FOUND —
  chỉ bản `.js` mới xanh cả 3 (node test + tsc + vite build).
- **CHƯA CLICK-TEST BROWSER THẬT**: subagent không có live browser.
  Các tương tác panel (radio scope, nút convert, editor boundary với
  type không phải fade, lưu/xoá layer chuẩn) mới chỉ đúng ở tầng logic
  thuần + tsc + vite build. Cần click-test thật từ main chat trước khi
  coi panel là xong về UX.

## 7. File đổi/thêm của U4 (đừng stage file khác theo đợt này)

- Sửa: `apps/web/src/components/nested/nestUtils.ts`
- Sửa: `apps/web/src/components/nested/nestUtils.test.ts`
- Sửa: `apps/web/src/components/nested/AdjustmentLayerPanel.tsx`
- Sửa: `apps/web/src/components/nested/NestedClipPanel.tsx`
- Sửa: `apps/web/src/components/nested/nested.css`
- Sửa: `apps/web/src/store.ts`
- Sửa: `apps/web/src/i18n/vi.json`
- Sửa: `apps/web/src/i18n/en.json`
- Thêm: `apps/web/src/components/nested/R7_UI_LIMITS.md` (file này)
- KHÔNG sửa: `apps/web/src/Timeline.tsx` (0 dòng, xem §0),
  `packages/video-spec/src/*`, `server/render/*`,
  `apps/web/src/lib/nestedPreview.ts`, mọi file `.github/workflows/*`.
