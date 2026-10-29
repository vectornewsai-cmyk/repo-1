# Phase 9 round 16 — preview–render parity vòng 7: LIMITS tổng hợp (trung thực)

> Đợt lớn cron 08:03 28/10/2026, 6 luồng song song, KHÔNG push, KHÔNG release/tag.
> Chủ đề: đóng toàn bộ nợ mở đợt 15 (harness bars-fade/V13, badge, nested
> đệ quy nối store, curveDropped timeline chính, ghost/dissolve đo sâu,
> effect residuals, module harness dùng chung, nguồn phi-lavfi).
> File stage: `~/workspace/repo-1-push/paths-loop/phase9-round16-parity7.txt`
> (34 file text, NUL-delimited, không binary, không dist, không scratch).

## 1. Kết quả theo luồng (số đo thật, FFmpeg 8.1.2)

### H1 — harness bars-fade + V13 + badge: ĐÓNG
- V11: 29 case, FAIL 0; V12: 37 case, FAIL 0, PENDING 0; V14: KHỚP 20
  (lúc H1 đo) — parent chạy lại cuối đợt: KHỚP 21 (xem §2 về lệch 20→21).
- V13 KHÔNG dùng rasterizer circle cũ như mô tả nhiệm vụ: nó thiếu hẳn
  nhánh radial-gradient (circleopen/circleclose rơi vào default → frame
  đen, MAD ~84). Đã sửa theo smoothstep + tâm floor(W/2), floor(H/2)
  đợt 14; HD 1920×1080 21 case FAIL 0.
- Badge blinds-h/plus/checker/grid/bars-fade đã nâng lên matched vì nay
  KHỚP qua harness, không còn chỉ qua script /tmp. V13 vẫn chưa hỗ trợ
  radial-soft và dissolve-noise (frame đen → LỆCH, không phải PENDING).

### H2 — nested đệ quy nối store + render thật: ĐÓNG, kèm 2 bug thật
- Bug thật: splitClipAt không có nhánh nested → trả null (bấm tách không
  có gì xảy ra); trimClip nested đi đường generic, phá bất biến
  duration = (trim.out − trim.in) / speed. Đã nối splitNestedClip /
  trimNestedClip / patchClip-duration vào store.ts.
- Test thuần 11 + test qua store thật 8 + render MP4 thật 13/13
  (64×64, nguồn màu phẳng, nửa phải sau split toàn xanh lá — nếu split
  không dời trim thì sẽ ra đỏ). Hồi quy nestedDeep 16, nestedSpeedcurve
  22, speedcurveTrim 18, nestUtils 28, splitPatch.store 12.
- Lưu ý: báo cáo giao của H2 bị cắt ngắn khi chuyển giao, nhưng file
  LIMITS H2 trên đĩa đầy đủ và parent đã đối chiếu trực tiếp (không
  mạo nhận từ báo cáo cắt ngắn).

### H3 — curveDropped + speedcurve: ĐÓNG, 1 nợ cũ hết hẳn
- patchClip nay trả về số keyframe bị cắt + toast kèm gợi ý Undo
  (key `speed.patchCurveDropped` vi/en). Trim timeline chính hóa ra đã
  báo rơi keyframe từ đợt 13 — chỉ bổ sung gợi ý Undo.
- Split chứng minh không mất keyframe (hợp 2 nửa phủ đủ mọi keyframe
  gốc) nên KHÔNG thêm cảnh báo — thêm sẽ là báo động giả.
- Ease-in phải / ease-out trái khi cắt curve: 0,244375 → 8,9e-16
  (nâng bậc bezier bậc 2 lên bậc 3, đổi cả mirror .js). Bezier suy biến
  có test riêng. Test mới speedcurveH3 11/11, render P3 73/73.

### H4 — ghost/dissolve đo sâu + FPS canvas: ĐÓNG trong phạm vi đã ghi
- Ghost quét frames 2..8: 60/60 cell MATCHED (720p/1080p × yuv/rgb ×
  weights đều/ramp + neo V15 tái tạo 0,0532 vs 0,0535).
- Dissolve 16-bit: MATCHED — xfade nội bộ chuyển sang gbrp16le, giữ
  nguyên tỉ lệ mẫu không chia hết cho 257; MAD16 0,53–0,80 ở 640×360,
  p=0,5. Đây là trả lời "xfade có giữ 16-bit không", không phải tính
  năng xuất 16-bit (product vẫn xuất yuv420p 8-bit).
- FPS canvas: CHỈ có số headless/SwiftShader (rAF trống 53–57fps;
  1080p không ghost 27–33fps; ghost f3 13,8–27,5fps; f8 7,0–9,5fps),
  tuyệt đối không trích thành "FPS trình duyệt". Bẫy đo đã ghi:
  thời gian gọi drawImage ≈ 0ms vì Chromium hoãn raster tới lúc present.

### H5 — effect residuals: CẢI THIỆN, KHÔNG nâng badge nào
- Edgedetect mới (blur 5×5 → Sobel → NMS 2 phía → hysteresis):
  step 72×45 MAD 3,856 → 0,315; tự nhiên 72×45 8,528 → 2,130
  (vẫn > 2 nên giữ approx — quyết định trung thực).
- Glitch: FFmpeg trunc (không làm tròn) phần thập phân của rgbashift;
  vùng trống là nhân biên (điền 0 lệch 810 byte → nhân biên 0 byte).
  Glitch MAD 22,26/18,58 → 12,67/12,32 (≈ sàn nhiễu độc lập ~13).
- Noise đổi sang Gauss (σ = strength/√3): kurtosis render ≈ 0, bác bỏ
  giả thuyết nhiễu đều và nhiễu mặt phẳng YUV của R6 bằng số.
- Test effectCanvas 14/14 + parity 14/14; V14 --only effect: KHỚP 8,
  XẤP XỈ 1, LỆCH 0, PENDING 0, STAT-APPROX 1, STRUCT-OK 1.

### H6 — module harness dùng chung + nguồn phi-lavfi: ĐÓNG 1 phần
- `harnessShared.js` mới: 5 hàm radial/dissolve dùng chung cho V11/V12/
  V14; kiểm chứng tương đương 41.577 so sánh, khác 0. `rasterizeTransitionPreview`
  cố tình chưa tách (H1 đang sửa trực tiếp 3 file harness lúc đó) — nợ
  đợt sau, và từ nay sửa radial/dissolve chỉ cần sửa 1 nơi cho 5 hàm này.
- Nguồn phi-lavfi 720p mức mô hình rgb24: photo-like tổng hợp KHỚP cả
  dissolve (0,0012) và circleopen (0,2817); clip1/clip2 trong repo (đã
  kiểm tra bằng mắt, cũng chỉ là test pattern) XẤP XỈ (1,24/1,59) nhiều
  khả năng do căn frame thời gian, không phải lỗi mô hình. Kết luận:
  nội dung phi-lavfi KHÔNG đổi hạng badge ở mức rgb24.
- Yuv420p e2e vẫn LỆCH nặng (50,6/49,3) như đợt 15 — phạm vi badge
  giữ nguyên "matched ở mức mô hình xfade rgb24".

## 2. Kiểm chứng gộp của parent (chạy lại độc lập trên cây đã hợp nhất)
- `tsc --noEmit`: 0 lỗi (lỗi TS5097 ở nestedStore.test.ts mà H1/H3 thấy
  giữa chừng đã hết sau khi H2 thêm 2 file test vào tsconfig exclude).
- `vite build`: pass (4,25s).
- Web test: transitionPreview 26/26, effectCanvas 14/14, parity 14/14,
  nestedStore 11/11, nestedDeep 16/16, nestedSpeedcurve 22/22,
  speedcurveTrim 18/18, speedcurveH3 11/11, splitPatch 14/14,
  nestUtils 28/28, nestedStore.store 8/8 (bundle esbuild),
  splitPatch.store 12/12 (bundle esbuild).
- Harness chạy lại: V11 29 FAIL 0; V12 37 FAIL 0 PENDING 0;
  V14 KHỚP 21, XẤP XỈ 1, LỆCH 0, PENDING 0; V13 42 case FAIL 0.
- Lệch số V14 20 (H1) → 21 (parent/H6): do H5 đổi tiêu chí kiểm tra
  glitch sang Gauss + nhân biên sau thời điểm H1 đo; không phải hồi
  quy, và case glitch V14 vốn không ổn định theo thời gian (đã từng
  lật STAT-LỆCH ↔ STRUCT-OK) — không nên dùng làm cổng chặn.
- Sửa duy nhất của parent: 1 comment lỗi thời trong SpeedPanel.tsx
  ("nested chưa nối vào store" — H2 đã nối, H3 chưa kịp cập nhật câu
  đó). Comment lịch sử trong nestUtils.ts giữ nguyên vì nó mô tả đúng
  trạng thái trước H2, không phải claim hiện tại.
- Dọn dẹp: parent đã xóa file tạm bỏ lại của H6 trong /tmp
  (/tmp/h6-photo-* ~66MB + /tmp/h6) sau khi H6 kết thúc — /tmp từ 15%
  về 2%. Bundle kiểm chứng của parent đặt ở /tmp, không vào repo.
  Scratch harness (repo-1-push/scratch16) đã dọn sau khi chạy xong.

## 3. Nợ còn lại (trung thực — cho đợt sau)
- `rasterizeTransitionPreview` vẫn còn 3 bản copy (dời nốt về module
  chung khi không còn luồng nào sửa trực tiếp harness).
- V13 chưa hỗ trợ radial-soft và dissolve-noise; bars-fade ở harness
  giả định cả 2 lớp full-frame, alpha=1.
- FPS canvas trên GPU thật + video thật + toàn bộ preview vẫn chưa đo;
  số headless/SwiftShader của H4 không được trích thành FPS trình duyệt.
- Footage máy quay thật vẫn chưa đo (repo không có); kết luận "không
  đổi hạng" chỉ đúng với nội dung tĩnh có chi tiết + nhiễu ở rgb24.
- Đổi speed nested qua patchClip chưa tính lại duration theo speed
  mới; sửa clip con sâu hơn 1 tầng qua store action chưa có; nested có
  speedKeyframes/reverse bị split/trim từ chối mà không có toast riêng;
  trim trái nested chưa chặn đè clip trước; hai nửa sau split giữ
  nguyên name.
- Render nested sâu mới đo ở 64×64, speed 1 ở tầng render; sâu 4–8 cấp
  qua store chưa có test riêng; dissolve 16-bit mới đo ở 640×360 p=0,5.
- Edgedetect pattern còn hơi tệ đi (2,04→2,52 ở 72×45); glitch/noise
  không thể khớp từng frame do nhiễu theo thời gian — badge giữ approx.
- Case glitch V14 không ổn định; cặp clip1/clip2 XẤP XỈ chưa truy
  nguyên tới cùng (nghi căn frame thời gian).
