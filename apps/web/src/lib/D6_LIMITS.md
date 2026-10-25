# D6_LIMITS.md — Phase 9 đợt 4 (agent D6): hoàn thiện caption

> Tài liệu giới hạn trung thực của batch D6. Mọi con số đều từ test thật
> chạy trên VM ngày 2026-10-25, không phải ước lượng. KHÔNG PUSH — code chỉ
> nằm trên đĩa, chờ parent gom batch.

## 1. Đã làm thật

### 1.1 Xuất SRT/VTT cấp project
- Mới: `collectProjectCaptions()` trong `lib/subtitles.ts` — thu toàn bộ
  phụ đề của project (mọi track), khác với nút xuất cũ trong CaptionModal
  (chỉ segment đang review, R4).
- Quy tắc "câu nào là phụ đề": clip chữ có link `captionOf`, HOẶC nằm
  trên track có label bắt đầu bằng `"Phụ đề"` (track caption thường
  `"Phụ đề N"` và track dịch `"Phụ đề (EN)"`; caption nhập tay từ SRT/VTT
  không có link nhưng vẫn nằm trên track này nên vẫn được xuất).
  Title/chữ tự do trên track khác KHÔNG được xuất.
- UI: CaptionModal bước config thêm nút "⬇ SRT project" / "⬇ VTT
  project" + dòng ghi rõ số câu và tên track đã góp cue. Tên file lấy từ
  `spec.meta.name` (chỉ lược ký tự cấm của filesystem), fallback
  `"phu-de"`. Nút disable khi project chưa có phụ đề nào.

### 1.2 Duplicate mang caption theo (đảo ngược quyết định Phase 8 Q3)
- `duplicateClips()` trong `lib/clipboard.ts` nay: nhân bản clip nguồn thì
  mọi câu link tới nó cũng nhân bản — link tới id MỚI của bản sao nguồn,
  giữ nguyên đoạn media, dịch timeline đúng bằng độ dịch của bản sao
  nguồn (tính từ start GỐC trước mọi lần đẩy, nên đúng cả khi nhân bản
  nhiều nguồn cùng lúc: câu của nguồn thứ 2 dịch +20 trong khi câu của
  nguồn thứ 1 dịch +10). Karaoke giữ nguyên qua deep clone (clip-local +
  duration không đổi nên thời gian từ vẫn đúng).
- Câu nhân bản TRỰC TIẾP mà nguồn của nó cũng nhân bản cùng lúc → bị bỏ
  qua (bản đính kèm đã tạo đúng 1 câu; giữ cả 2 sẽ nhân đôi ở 2 vị trí
  khác nhau). Câu nhân bản trực tiếp mà nguồn KHÔNG nhân bản cùng → HỦY
  LINK thành chữ tự do (giống paste).
- `store.ts` KHÔNG cần sửa: `duplicateSelection` đã delegate cho
  `duplicateClips`, selection trả về gồm cả câu đính kèm (giống paste).
- 2 dòng tài liệu cũ nói "duplicate KHÔNG mang caption" trong
  `CLIPBOARD_LIMITS.md` và `CAPTIONFOLLOW_LIMITS.md` đã được cập nhật
  cho khỏi vênh với hành vi mới (chỉ sửa đúng 2 đoạn đó).

### 1.3 Karaoke chính xác dưới speed curve
- Mới trong `lib/captionFollow.ts`: `mapMediaTimeToOutputOffset()` (1 mốc
  media → offset output, dùng chung cho caption và karaoke nên 2 thứ
  không lệch) và `karaokeForLinkedSegment()` — mỗi biên từ đi qua đúng
  ánh xạ media → timeline (đảo tích phân `outputOffsetForMedia` khi có
  curve, `(media-in)/speed` khi tốc độ hằng xuôi, `(out-media)/speed`
  khi ngược), rồi trừ offset bắt đầu câu để ra clip-local.
- `linkSegmentsToClips` nay dùng mapping này thay cho tỉ lệ tuyến tính
  cũ của R4. Số đo phân biệt rõ: ramp linear 1→2, câu media [2,4] với
  từ [2,3]/[3,4] → karaoke **[0, 0.66] / [0.66, 1.27]**; tỉ lệ tuyến tính
  cũ cho [0, 0.64] / [0.64, 1.27] — sai 0.02s ở biên từ.
- Clip ngược: biên từ được min/max + sắp theo thời gian phát (từ media
  sau hát trước), nên cả preview lẫn ASS `\k` (đọc words theo thứ tự
  mảng) đều đúng. Đây là sửa thêm ngoài tỉ lệ cũ: code R4 cho clip
  ngược cũng sai thứ tự từ.
- `refollowCaptions` (caption bám theo khi nguồn trim/move): tốc độ hằng
  nay remap qua media (khôi phục thời gian media của biên từ rồi map lại
  qua hình học mới) thay vì rescale tuyến tính. Số đo: câu media [0,10]
  trim trái còn [2,10] thì từ media 5 phải về clip-local **3** (rescale
  cũ cho 4 — sai 1s). Có guard: nếu duration cũ không khớp (me-ms)/speed
  (tốc độ đã đổi, hoặc duration bị kẹp min 0.2) thì rơi về rescale cũ.

## 2. Giới hạn còn lại — đọc kỹ

1. **Refollow dưới speed curve vẫn xấp xỉ.** Lúc TẠO câu thì karaoke đã
   chính xác (mục 1.3), nhưng khi nguồn đã có curve bị trim/move/split
   sau đó, `refollowCaptions` vẫn dùng rescale tuyến tính vì hình học CŨ
   của curve không còn trong refollow (chỉ có hình học mới + clip cũ).
   Muốn chính xác tuyệt đối cần truyền cả clip nguồn cũ vào refollow
   (đổi nhiều call site trong store.ts) — để dành cho batch sau, không
   đoán. Đọc cùng R4_LIMITS.md §1.4: câu "karaoke dưới speed curve chỉ
   là xấp xỉ" nay chỉ còn đúng cho refollow, KHÔNG còn đúng cho lúc tạo.
2. **Refollow không phát hiện lật chiều reverse.** Guard ở mục 1.3 chỉ
   kiểm tra tốc độ không đổi; nếu user lật reverse của nguồn (hiếm, qua
   edit trực tiếp) thì remap tốc độ hằng có thể sai — fallback rescale
   cũng sai trường hợp này. Chưa có test cho lật reverse + karaoke.
3. **Duplicate: caption chung track với nguồn (trường hợp biên).**
   Caption tạo qua UI luôn nằm trên track chữ riêng, nhưng spec không cấm
   caption chung track với nguồn. Khi đó bước đẩy của duplicate sẽ đẩy
   cả câu gốc, và bản sao câu (đặt theo độ dịch nguồn) có thể chồng lên
   câu gốc đã bị đẩy. Không xử lý riêng — user kéo tay để sửa. Trường
   hợp thực tế (track riêng) không bị.
4. **Duplicate bỏ qua câu trên track khóa/ẩn** (không tạo clip user
   không thấy/không sửa được) — giống paste.
5. **Xuất project theo label track.** Track phụ đề bị user đổi tên khỏi
   tiền tố "Phụ đề" mà câu trong đó không có link thì sẽ bị bỏ qua.
   Caption có link thì luôn được xuất bất kể tên track.
6. **Xuất SRT/VTT mất karaoke** (định dạng không chứa word timestamps) —
   giống giới hạn R4; file xuất ra là chữ thường.
7. **Chưa click-test nút xuất project trên browser thật.** Logic
   `collectProjectCaptions` + round-trip đã test bằng Node; UI chỉ mới
   qua tsc (nút dùng chung `downloadText`/`formatSrt`/`formatVtt` đã có
   từ R4).
8. **vite build hiện FAIL do file của agent khác (không phải D6).**
   `MaskPanel.tsx` import `interpolateMaskAt` từ `@repo-1/video-spec`
   nhưng `export * from "./mask.js"` trúng file mirror
   `packages/video-spec/src/mask.js` (2026-10-23, KHÔNG có hàm này),
   trong khi `mask.ts` (sửa 00:37 25/10 bởi agent D4, test
   maskKeyframes 14/14 pass) thì có. D6 không đụng mask/index/MaskPanel
   nên không sửa — việc đồng bộ mirror thuộc về agent D4 hoặc lúc gộp
   batch. Bằng chứng D6 không gây ra: tsc toàn app 0 lỗi, mọi suite
   logic xanh (mục 3); lỗi rollup chỉ nêu MaskPanel + video-spec.

## 3. Kiểm chứng (2026-10-25)
- `lib/d6.test.ts` (MỚI): **11/11 pass** — project export + loại title,
  round-trip SRT/VTT, duplicate mang caption + karaoke, duplicate 2
  nguồn (shift +10/+20), không nhân đôi câu, duplicate câu lẻ hủy link,
  karaoke ramp 1→2 ([0,0.66]/[0.66,1.27]), tốc độ hằng + clip ngược,
  từ cắt dở ở biên câu, refollow trim trái (từ media 5 → local 3),
  refollow move trên ramp (karaoke giữ nguyên).
- Hồi quy: `captionFollow.test.ts` **22/22**, `clipboard.test.ts`
  **18/18**, `subtitles.test.ts` **14/14**, `r6-i18n-check.cjs` PASS,
  `maskKeyframes.test.ts` **14/14** (file của D4, chạy ké để xác nhận
  lỗi build không phải do logic mask).
- `npx tsc --noEmit` (apps/web): **0 lỗi** (sau khi thêm `d6.test.ts`
  vào tsconfig exclude theo mẫu các test Node khác, và sửa type param
  của `collectProjectCaptions` sang `Track[]`).
- `npx vite build`: **FAIL** — xem giới hạn 8 (file của agent D4).

## 4. File đã tạo/sửa (CHƯA PUSH)
- Mới: `apps/web/src/lib/d6.test.ts`, `apps/web/src/lib/D6_LIMITS.md`
  (file này).
- Sửa: `apps/web/src/lib/captionFollow.ts` (mapMediaTimeToOutputOffset,
  karaokeForLinkedSegment, remapKaraokeForRefollow, linkSegmentsToClips,
  refollowCaptions), `apps/web/src/lib/clipboard.ts` (duplicateClips +
  ghi chú đầu file), `apps/web/src/lib/subtitles.ts`
  (collectProjectCaptions + CAPTION_TRACK_LABEL_PREFIX),
  `apps/web/src/components/CaptionModal.tsx` (nút xuất SRT/VTT project
  ở bước config), `apps/web/tsconfig.json` (exclude d6.test.ts),
  `apps/web/src/lib/CLIPBOARD_LIMITS.md` + `CAPTIONFOLLOW_LIMITS.md`
  (mỗi file 1 đoạn về duplicate, cập nhật hành vi mới).
- Lưu ý cho parent: brief giao D6 sở hữu captions.ts, subtitles.ts,
  CaptionModal.tsx và nhánh duplicate trong store.ts — nhưng logic
  duplicate thật nằm ở `clipboard.ts` (duplicateClips) và mapping
  karaoke thật nằm ở `captionFollow.ts` (linkSegmentsToClips /
  refollowCaptions), nên D6 đã sửa 2 file đó (không sửa store.ts vì
  không cần). Cần kiểm tra xung đột với agent khác nếu họ cũng sở hữu
  2 file này.
- KHÔNG sửa: preview.tsx, render.js, store.ts, R4_LIMITS.md, mask.ts,
  video-spec index.ts, MaskPanel.tsx.
