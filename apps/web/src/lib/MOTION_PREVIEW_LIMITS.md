# MOTION_PREVIEW_LIMITS.md — Giới hạn preview cho slow-mo / nội suy frame / motion blur (S4, Phase 9 đợt 8, gap E8)

## 0. Shape dùng: shape S1, không shape tạm

`VideoClip.motion` theo `packages/video-spec/src/motion.ts` (luồng S1):

```ts
motion?: {
  interpolation?: "none" | "minterpolate";  // vắng = "none"
  targetFps?: number;                      // 1..120, bắt buộc khi minterpolate
  miMode?: "mci" | "blend";                // vắng = "mci"
  motionBlur?: { frames?: number; weights?: number[] };  // tmix, độc lập với nội suy
}
```

Preview đọc đúng shape này qua `normalizeMotion` (duck-typed, khoan dung có
giới hạn — xem §4). Các shape tạm cũ trong repo (UI S5 ghi kèm field khi
`interpolation = "none"`, `miMode: "dup"`, nhánh ramp S3 dùng boolean/frames
tới 16) KHÔNG được preview tự "sửa" cho khớp: project sai spec thì tầng
spec/render báo lỗi, preview chỉ hiển thị theo những gì đọc được.

## 1. Preview nội suy ≠ render nội suy (trung thực, không claim ngược)

- Render (luồng S2) nội suy frame mới bằng FFmpeg `minterpolate` ra đúng
  `targetFps`, rồi resample về fps project nếu khác.
- Preview canvas KHÔNG chạy `minterpolate`: video element chỉ phát frame gốc
  ở fps project. Slow-mo trên preview vì vậy KHÔNG mượt như bản export —
  chuyển động nhanh vẫn giật từng frame gốc.
- Để user không lầm: clip đang xem có `interpolation = "minterpolate"` thì
  preview hiện badge **NỘI SUY** (giữa trên, cùng mẫu DOM-ref như badge
  PROXY/LUT, không re-render React mỗi frame). Badge có nghĩa là "bản render
  sẽ khác preview — mượt hơn", không phải "preview đang nội suy".
- Chỉ `"minterpolate"` mới hiện badge nội suy. `"none"`, vắng, hoặc giá trị
  lạ (kể cả `"dup"` của shape tạm cũ — S1 đã loại `"dup"` vì nó không nội
  suy frame nào) đều không hiện, để preview không claim nội suy sai.

## 2. Motion blur preview chỉ là ghosting, không phải tmix (M2 cập nhật)

- Render áp blur thật bằng FFmpeg `tmix`: gộp `frames` frame liên tiếp với
  trọng số `weights` (mặc định 3 frame đều nhau).
- Preview không trộn được nhiều frame nguồn trên canvas nên chỉ xấp xỉ bằng
  **trail ghost** (M2, Phase 9 đợt 9 — thay ghost 1 frame alpha cố định của
  đợt 8): với clip có `motionBlur`, preview giữ ring buffer tối đa
  `frames-1` frame nguồn trước đó (tối đa 7, ứng frames tối đa 8) và vẽ
  chúng chồng dưới frame hiện tại, cũ nhất trước, mới nhất sau.
  - **Số bóng = frames-1** (frame hiện tại vẽ riêng, đủ alpha, không phải
    bóng). Vài frame đầu sau khi bật blur: ring chưa đầy nên ít bóng hơn
    (từ frame thứ 2 mới có 1 bóng, đủ dần theo thời gian).
  - **Alpha mỗi bóng tỉ lệ với weights thật**: bóng cũ nhất → mới nhất
    tương ứng weights[0..frames-2] (weights[frames-1] là frame hiện tại,
    không vẽ thành bóng); alpha = 0.35 × weights[i] / max(weights[0..frames-2]),
    nên bóng mạnh nhất luôn = 0.35, các bóng khác yếu đi đúng tỉ lệ.
    Weights đều → mọi bóng đều 0.35; frames=2 → đúng 1 bóng 0.35 (giữ
    hành vi đợt 8). Đặc tả này do `resolveMotionBlurGhost` tính
    (test đơn vị trong previewEngine.test.ts), preview.tsx chỉ vẽ theo.
  - **Trail ≠ tmix, nói rõ 3 điểm**: (1) frame hiện tại vẽ đủ alpha chứ
    không nhân weights của nó, nên trail sáng hơn trung bình tmix;
    (2) tổng alpha các bóng không chuẩn hoá về 1; (3) bóng là frame nguồn
    cũ nguyên vẹn (không nội suy chuyển động như minterpolate).
- Hệ quả trung thực:
  - Vật đứng yên: frame trước ≈ frame hiện tại → gần như không thấy khác.
  - Vật chuyển động nhanh: thấy vệt mờ dài theo frames, đậm nhạt theo
    weights — nhưng vệt này KHÁC hình dạng/độ sáng so với tmix của render.
  - Frame đầu tiên sau khi bật blur / đổi clip: chưa có frame trước nên
    không có vệt (chỉ từ frame thứ 2 trở đi mới có ghost).
- Badge **BLUR≈** đi kèm khi clip có `motionBlur`: dấu `≈` nhắc rõ đây là
  xấp xỉ, không phải tmix thật.
- Công tắc tắt: đặt `MOTION_BLUR_PREVIEW_ENABLED = false` trong
  `previewEngine.ts` thì preview bỏ qua ghost hoàn toàn (badge vẫn hiện để
  báo render khác preview) nếu ghost gây giật trên máy yếu.

## 3. Ghost có trên mọi đường vẽ video (M2 — hết nợ đợt 8)

`drawVideoClip` có 4 đường vẽ, từ M2 cả 4 đều có ghost (đợt 8 chỉ có đường
thường):
- Đường vẽ thường (kể cả có track): bóng là `drawSrc` letterbox của frame
  trước, vẽ tại đúng vị trí đã dịch (offset/trackShift), sau lớp nền đen
  của track.
- Đường SR (scale/rotation): bóng là `drawSrc` frame trước, vẽ trong cùng
  transform translate → rotate → scale của frame hiện tại.
- Đường mask (không SR): bóng là **unit đã mask** của frame trước, vẽ tại
  đúng vị trí đã dịch (trackShift), kích thước W×H.
- Đường mask + SR: bóng là unit đã mask của frame trước, vẽ trong cùng
  transform SR của frame hiện tại.
- Điểm xấp xỉ còn lại của ghost mask/SR: bóng mang nội dung frame cũ
  (mask/transform của thời điểm bóng đó) nhưng được ĐẶT theo transform
  hiện tại — tức bóng không được tính lại mask keyframes / placement theo
  thời gian của chính nó, chỉ frame hiện tại mới đúng thời gian. Với mask
  tĩnh / SR thay đổi chậm thì sai lệch không đáng kể; mask keyframes đổi
  nhanh thì bóng hơi lệch hình so với render (render tmix trộn frame đã
  qua đúng mask/SR của từng thời điểm).
- Snapshot của mỗi đường là nội dung riêng (drawSrc letterbox vs unit đã
  mask W×H) nhưng chung 1 ring theo clip id: clip đổi đường vẽ giữa chừng
  (bật/tắt mask) thì 1–2 frame chuyển tiếp có thể trộn snapshot khác
  loại (vẽ co giãn theo đích, thoáng qua) rồi ring ổn định lại — không
  crash, không kẹt sai lâu dài.
- **Image/text clip không có ghost**: spec chỉ có field `motion` trên
  VideoClip (packages/video-spec/src/index.ts) — image clip và text clip
  không mang motionBlur nên drawImageClip/drawTextClip không đọc motion,
  kể cả đường SR của text (textSrPlacement). Đây là giới hạn theo spec,
  không phải thiếu sót đường vẽ: muốn blur cho ảnh/chữ thì spec phải thêm
  field motion cho 2 loại clip đó trước.

## 4. Đọc motion khoan dung nhưng không bịa

`normalizeMotion` không throw với motion thiếu/rác: về mặc định an toàn
(`interpolation = null`, `motionBlur = false`), clip vẫn preview bình
thường. `resolveMotionBlurGhost` cũng không throw: frames/weights lệch
chuẩn thì fallback (frames ngoài 2..8 → lấy weights.length nếu weights
dùng được, còn lại 3; weights dài khác frames → bỏ weights, chia đều;
weights chứa 0/âm/không hữu hạn → chia đều). Ngoại lệ khoan dung duy nhất
về dạng: `motionBlur` dạng boolean `true` hoặc số > 0 (shape tạm cũ của
nhánh ramp) vẫn tính là bật blur — nhưng chỉ về **1 bóng alpha 0.35**
(tương đương frames=2 weights đều), không bịa frames/weights từ số đó.
`targetFps` chỉ cần là số hữu hạn > 0 thì giữ để hiển thị; khoảng 1..120
là việc của tầng spec/render, preview không tự validate.

## 5. Motion không bị rơi khi làm phẳng nested

`buildPreviewSpec`/`flattenForPreview` (nestedPreview.ts, KHÔNG thuộc luồng
S4 nên không sửa): khi không có nested/adjustment thì trả đúng object spec
cũ; khi cắt clip theo adjustment thì copy bằng spread `{ ...clip }` nên
field `motion` đi kèm nguyên vẹn sang mọi đoạn. Test
`previewEngine.test.ts` kiểm chứng cả 2 đường (cắt adjustment 3 đoạn và lá
nested đã phẳng) đều giữ đủ `interpolation`/`targetFps`/`motionBlur`.
Clip không có motion thì `motion` về mặc định, mọi visual khác (opacity,
scale, rotation, filter) không đổi — xem test.

## 6. Nợ còn lại (không giấu)

- ~~Ghost chưa có cho đường mask và đường SR~~ — ĐÃ XONG ở M2 (xem §3).
- ~~Ghost dùng đúng 1 frame trước, không theo `frames`/`weights`~~ — ĐÃ
  XONG ở M2 (xem §2): số bóng = frames-1, alpha tỉ lệ weights.
- Chưa đo FPS thực tế khi bật ghost trên clip 1080p (chỉ suy luận: mỗi
  frame có motionBlur thêm tối đa 7 lần `drawImage` kích thước khung hình
  so với 1 lần của đợt 8; ring tái dùng canvas nên không cấp phát mới mỗi
  frame, nhưng chi phí vẽ tăng theo frames). Giới hạn bộ nhớ: tối đa 16
  clip × 7 snapshot × canvas khung hình (trường hợp xấu lý thuyết; thực
  tế chỉ clip đang hiển thị mới tạo snapshot).
- Vẽ canvas thật (preview.tsx) chưa có test tự động: test đơn vị chỉ bao
  được hàm thuần quyết định số bóng/alpha; việc ghost xuất hiện đúng 4
  đường vẽ, đúng transform, đúng thứ tự lớp chỉ kiểm chứng bằng đọc code
  + tsc + vite build (DOM/canvas không chạy được trong Node type-stripping).
  Muốn chứng minh bằng mắt cần click-test trên browser thật với clip có
  motionBlur + mask/SR — chưa làm trong đợt này.
- Trail preview sáng hơn tmix (frame hiện tại đủ alpha, tổng alpha bóng
  không chuẩn hoá về 1) và bóng mask/SR đặt theo transform hiện tại chứ
  không tính lại theo thời gian của bóng (xem §2, §3) — cố ý để nhìn rõ
  vệt, nhưng đừng dùng preview để đo độ mờ của bản render.
- Test Node type-stripping phụ thuộc `motion.js` mirror của video-spec
  (output tsc từ `motion.ts` của S1): trong lúc S4 đang làm thì mirror này
  chưa tồn tại nên test tạm fail ở khâu resolve `@repo-1/video-spec`
  (không phải lỗi code preview); ngay sau đó S1 compile xong mirror thì
  test chạy lại xanh 8/8. Đây là đặc thù chung của repo (mọi `.ts` trong
  video-spec đều có mirror `.js` cùng thư mục), không riêng luồng S4.
