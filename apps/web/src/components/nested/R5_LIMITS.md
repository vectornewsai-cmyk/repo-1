# R5_LIMITS.md — UI nested/adjustment: i18n + hoàn thiện tương tác (đợt nested, Phase 9)

> R5 đóng 2 mục còn tồn của đợt nested trước: mục 5 (UI chưa click-test,
> "xem bên trong" chỉ liệt kê, không nest lồng ở UI, layer không
> box-select/kéo/trim trên hàng FX) và mục 8 (key i18n chưa merge). Mọi
> claim dưới đây đều có test/số đo đi kèm; phần chưa làm được ghi rõ,
> không tô hồng.

## Đã làm (UI only, không đụng render/spec lõi, không push)

### 1. Merge i18n vi/en cho panel nested/adjustment (mục 8 cũ: ĐÃ ĐÓNG)
- Thêm 62 key mới, dùng hết trong code (kiểm chứng bằng script quét
  literal, xem dưới): `nested.*` (30 key: title, note, selected,
  needTwo, missingClip, lockedTrack, nestedOrLayer, namePlaceholder,
  nameAria, nestButton, nestOk, nestFail, listTitle, emptyList,
  selectOnTimeline, viewInside, hideInside, unnest, unnestOk, unnestFail,
  innerHead, innerCount, innerStart, innerDuration, innerText, innerSave,
  innerSaveOk, innerSaveFail), `adjustment.*` (24 key), `timeline.*`
  (8 key: nestedButton, nestedShort, adjustmentButton, adjustmentShort,
  fxGutter, fxTitle, fxMove, fxTrim).
- `NestedClipPanel.tsx`, `AdjustmentLayerPanel.tsx` đã chuyển toàn bộ
  chuỗi hiển thị sang `i18nT` + `useLang()` (đổi ngôn ngữ re-render
  panel); nút toolbar Nested/Adjustment, ô gutter FX và tooltip FX trên
  `Timeline.tsx` cũng đã qua i18n.
- Còn sót duy nhất 1 chuỗi Việt hardcode trong panel: fallback `"chữ"`
  cho clip text không có nội dung trong dòng liệt kê clip con (giữ nguyên
  hành vi cũ của N4, không phải chuỗi giao diện chính). Label/description
  của `EFFECT_META` là dữ liệu catalog của effects.ts, không thuộc đợt
  này.

### 2. Layer chọn/kéo/trim được trên hàng FX (mục 5 cũ: ĐÃ ĐÓNG ở tầng logic)
- `nestUtils.ts` thêm 3 hàm thuần: `moveAdjustmentLayer`,
  `trimAdjustmentLayer` (đích TUYỆT ĐỐI: mép trái = start mới, mép phải
  = end mới), `updateAdjustmentLayer` (đặt start+duration một lần cho
  panel). Chặn: track host khóa, start < 0, duration < 0.2s, đè layer
  khác. CỐ TÌNH không dùng `moveSelectionBy`/`trimClip` generic của
  store vì chúng chặn đè clip thường — mà layer được phép đè clip thường
  (đó là bản chất adjustment layer).
- `Timeline.tsx`: thân layer kéo dời (click thường chọn riêng, Shift
  thêm vào selection, Ctrl/Cmd bật/tắt), 2 tay kéo `.fx-handle` ở 2 mép
  để trim, mỗi lần kéo tính đích tuyệt đối từ snapshot lúc bắt đầu kéo
  nên pointermove lặp không cộng dồn (tránh bug cộng dồn từng gặp ở
  trim clip thường); lần kéo gộp thành 1 bước undo qua
  `beginHistoryGroup`/`endHistoryGroup` + `mergeKey` ở store action.
- Box-select: query mở rộng sang `.tl-adj-clip` nên kéo vùng qua hàng FX
  cũng chọn layer. FX KHÔNG dùng class `.tl-clip` để tránh style/hover
  của clip thường.
- Panel adjustment: mỗi layer trong danh sách sửa được start/duration
  qua `updateAdjustmentLayer` (1 bước undo).

### 3. "Xem bên trong" sửa được clip con ở mức tối thiểu (mục 5 cũ: ĐÃ ĐÓNG ở mức tối thiểu)
- `updateNestedInnerClip` (thuần, có test) + store action cùng tên (qua
  `execCommand`, 1 bước undo): sửa start/duration đặt trong compound
  clip và nội dung text (chỉ clip chữ) mà không cần rã ra.
- Ràng buộc đã test: start >= 0, duration >= 0.2, end <= duration của
  nested clip ngoài, không đè clip khác cùng track con, host track
  không khóa, sửa text trên clip không phải chữ → error.
- Ngữ nghĩa ghi rõ: chỉ đổi vị trí/độ dài ĐẶT trong compound clip,
  **in/out nguồn giữ nguyên** (khác với trim clip video thường vốn dịch
  in/out). Duration compound clip ngoài không đổi.

## Chưa làm được / chưa nối (trung thực)

1. **CHƯA click-test browser thật.** Toàn bộ tương tác mới (kéo/trim
   layer trên hàng FX, box-select qua FX, editor clip con, đổi ngôn ngữ
   của panel) mới chỉ qua tsc + vite build + test logic thuần. Subagent
   không có live browser; parent cần click-test thật trước khi coi là
   xong về mặt UX. Vì vậy "kéo/trim/box-select được" ở trên là khẳng
   định ở tầng logic + wiring (handler đã nối vào Timeline, store action
   đã nối vào pure function đã test), KHÔNG phải "đã thấy chạy bằng
   chuột thật".
2. **Không nest lồng nhau ở tầng UI — GIỮ NGUYÊN, ghi rõ là giới hạn
   có chủ đích.** Gộp clip đã là nested/adjustment vẫn bị từ chối ở cả
   `nestClips` lẫn panel (tránh đệ quy phức tạp); spec cho phép sâu tới
   8 tầng nhưng UI chưa khai thác. Đợt này không mở nest lồng vì chưa
   có thiết kế an toàn cho undo/selection đệ quy — không claim đã hỗ trợ.
3. **Rủi ro selection hỗn hợp (đã tồn tại từ N4, R5 không mở rộng thêm
   ngoài box-select):** layer đã chọn chung với clip thường rồi kéo clip
   thường bằng `moveSelectionBy` generic có thể xử lý layer như clip
   thường. R5 tránh bằng action riêng cho kéo layer, nhưng không sửa
   hành vi generic cho selection hỗn hợp (sửa đó thuộc store lõi, vượt
   phạm vi UI thread). Khi click-test cần kiểm tra trường hợp này.
4. **Chưa nối gì thêm về render/preview:** adjustment layer vẫn chưa
   nối vào render.js thật và chưa có type trong spec (mục 1–2 của
   NESTED_ROUND_LIMITS.md giữ nguyên); nested clip mang reverse/
   speedKeyframes/mask/... vẫn fail fast ở render. R5 chỉ làm UI + i18n.
5. **Test box-select/drag FX không có test DOM:** logic thuần đã test
   đủ, nhưng wiring DOM (class `.tl-adj-clip` trong query box-select,
   `fxDragRef` trong `onMove`) chỉ được kiểm chứng bằng đọc code + tsc
   + build, chưa có test chạy DOM thật.

## Test thật đã chạy

- `node apps/web/src/components/nested/nestUtils.test.ts`: **17/17 pass**
  (10 test cũ N4 + 7 test mới R5: move layer, move chặn, trim layer,
  update layer, sửa clip con vị trí/in-out, sửa text, sửa clip con chặn).
  Trong lúc viết test phát hiện 3 fail giả do setup test dùng 2 idGen
  riêng cấp trùng id "n1" cho 2 layer — đã sửa test dùng chung 1 idGen,
  không phải lỗi code (production dùng `uid("c")`).
- `node apps/web/scripts/r6-i18n-check.cjs`: **PASS** (vi=en=621 key,
  318 literal i18nT trong code, không thiếu/thừa key).
- Quét literal: **62/62 key mới** (nested/adjustment/timeline) đều xuất
  hiện trong code.
- `npx tsc --noEmit` (apps/web): **0 lỗi, exit 0** (lưu ý: lần chạy tsc
  đầu tiên trong đợt này thấy 2 lỗi ở `src/lib/nestedPreview.ts` — file
  của luồng khác, R5 không đụng; lần chạy sau lỗi đã biến mất do luồng
  đó sửa song song, và lần chạy cuối xác nhận 0 lỗi).
- `npx vite build`: **pass** (built in 26.76s; bundle 745.98 kB JS,
  cảnh báo chunk > 500 kB đã có sẵn từ trước, không phải do R5).

## File đổi/thêm (toàn file text, không binary, không push)

- `apps/web/src/i18n/vi.json` — thêm `nested.*`, `adjustment.*`,
  `timeline.nestedButton/nestedShort/adjustmentButton/adjustmentShort/
  fxGutter/fxTitle/fxMove/fxTrim`.
- `apps/web/src/i18n/en.json` — tương ứng, parity 621/621.
- `apps/web/src/components/nested/nestUtils.ts` — thêm
  `move/trim/updateAdjustmentLayer`, `updateNestedInnerClip`,
  `NestedInnerPatch`.
- `apps/web/src/components/nested/nestUtils.test.ts` — thêm 7 test R5.
- `apps/web/src/components/nested/NestedClipPanel.tsx` — i18n +
  `InnerClipEditor` (sửa clip con tối thiểu).
- `apps/web/src/components/nested/AdjustmentLayerPanel.tsx` — i18n +
  `LayerEditor` (sửa start/duration layer).
- `apps/web/src/components/nested/nested.css` — thêm `.fx-handle`
  (tay kéo 2 mép layer).
- `apps/web/src/Timeline.tsx` — `fxDragRef` + `beginFxBodyDrag`/
  `beginFxEdgeDrag`, xử lý FX trong `onMove`/`onUp`, box-select mở rộng
  sang `.tl-adj-clip`, toolbar/gutter/tooltip FX qua i18n.
- `apps/web/src/store.ts` — 4 action mới: `moveAdjustmentLayer`,
  `trimAdjustmentLayer`, `updateAdjustmentLayer`, `updateNestedInnerClip`.
- `apps/web/src/components/nested/R5_LIMITS.md` — file này (mới).
