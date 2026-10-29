# Phase 9 round 15 — preview–render parity vòng 6: LIMITS tổng hợp (trung thực)

> Đợt lớn cron 02:03 28/10/2026, 6 luồng song song, KHÔNG push, KHÔNG release/tag.
> Chủ đề: đóng toàn bộ nợ mở đợt 14 (harness V11/V12/V14, grid, bars-fade,
> nested sâu, split curve + transition, patchClip, curveDropped, circle-soft,
> blinds/plus/checker, đo nặng/thật) + đo HD/4K/footage.
> File stage: `~/workspace/repo-1-push/paths-loop/phase9-round15-parity6.txt`
> (28 file text, NUL-delimited, không binary, không dist, không benchmarks/results).

## 1. Kết quả theo luồng (số đo thật, FFmpeg 8.1.2)

### T1 — harness V11/V12/V14: ĐÓNG, không còn FAIL/PENDING giả
- V11: dissolve 85,00 → MAD 0,00 KHỚP (mask ImageData + frand float32);
  circleopen 0,33 KHỚP; 24 case, FAIL: không có.
- V12: circleopen 84,67 → MAD 0,33 KHỚP (smoothstep + tâm cắt nguyên);
  32 case, FAIL: không có, PENDING: không có.
- V14: KHỚP 12 → 15, XẤP XỈ 2, LỆCH 0, PENDING 3 → 0
  (radial-gradient + dissolve-noise nay đo MAD thật).
- Chỉ sửa harness + tài liệu, không đụng code sản phẩm.

### T2 — grid + bars-fade: ĐÓNG ở tầng mô hình
- Grid: chữ L sai → ô vuông đúng (rect pixel nguyên, đúng cả khi s phân số).
  MAD 62–85 → 0,14–0,31, le8 100% ở 320×180 và 1280×720, 3 p.
- Bars-fade: kind mới `bars-fade` (dải = B thuần, nền = crossfade A/B).
  MAD 31–42 → 0,17–0,75, le8 100% ở cả 2 cỡ, 3 p.
- Test transitionPreview 26/26; harness V13 grid 3/3 KHỚP (parent chạy lại).
- Nợ: harness V11/V12/V14 chưa hiểu kind bars-fade (T1 xong trước khi kind
  ra đời) → V14 sẽ PENDING bars-fade cho tới đợt sau.

### T3 — nested sâu hơn 1 cấp: ĐÓNG (logic, chưa nối store)
- `composeNestedLeafWindow`: hợp trim/speed đệ quy qua 2–3 cấp, sâu tối đa 8,
  chặn vòng lặp, lá cắt hết → null; giữ song song helper 1 tầng cũ (tương
  thích test R5, đã khóa bằng test cả hai phía).
- `deepNestedLeafVisibleSpeedCurve` + `nestedSplitOffset` nối vào nestUtils.
- Test mới 16 + hồi quy 22/28/18/49/8/12 đều pass; parity .ts ↔ .js khớp.
- Nợ: chưa nối helper đệ quy vào store.ts (split/trim thật trên timeline);
  chưa có test render MP4 thật cho lá sâu đã trim/split.

### T4 — split curve + transition + patchClip: ĐÓNG, kèm 1 bug thật
- Bug thật: split sát mép vỡ validator khi transition dài hơn nửa mới →
  helper `clampSplitOuterTransitions` kẹp cả hai đầu cặp, nối vào cả hai
  đường split.
- Render MP4 thật nửa sau split theo ramp: 22/22 (gồm duration 2s + màu
  frame đầu/cuối đúng).
- patchClip đổi duration nay cắt curve về [0, newDur) bằng sliceSpeedKeyframes
  (kéo dài giữ nguyên; clip không curve không mọc curve).
- Test 14 + 12 (qua store thật) + hồi quy 22/18/28/26/73; tsc 0, vite build pass.
- Nợ: ease-in phải / ease-out trái khi cắt curve chỉ gần đúng trong chặn
  0.125×|Δv| (thừa hưởng từ slice, nợ R5); bezier suy biến fallback chưa có
  test riêng; comment "patchClip chưa cắt curve" trong SpeedPanel nay lỗi
  thời (panel thuộc luồng khác, chưa sửa).

### T5 — đo nặng/thật: mô hình ĐÚNG, đầu ra yuv420p là giới hạn
- Dissolve 1080p rgb: MATCHED cả 3 p (MAD ≤ 0,0073); nhưng e2e yuv420p sau
  xfade: MAD 47–71, le8 ~1–3% → TỤT HẠNG ở đầu ra thật. Đã chứng minh
  encoder vô tội (crf0/lossless khớp đúng e2e): tổn thất nằm ở bước
  444→420 sau xfade; pattern nhiễu từng pixel không sống qua chroma
  chia sẻ khối 2×2. Quyết định của parent: GIỮ badge matched + chú thích
  phạm vi "matched ở mức mô hình xfade rgb24".
- Circle 4K rgb: MATCHED mọi ô (MAD ≤ 0,494, le8 100%); e2e nguồn phẳng
  MATCHED; e2e nội dung chi tiết cực đoan tụt le8 94–96% (giới hạn chung
  của yuv420p — đối chứng: mandelbrot một mình qua yuv420p đã le8
  93,7–95,3%). Quyết định: GIỮ badge matched + chú thích phạm vi.
- Ghost 1080p: blend MATCHED (yuv MAD 0,0535, rgb 0,0057); render tmix thật
  1080p 28,6 ms/frame ≈ 34,9 fps (FFmpeg, chưa encode); blend Node per-pixel
  180 ms/frame KHÔNG phải FPS canvas trình duyệt (canvas dùng drawImage
  tăng tốc GPU) — FPS canvas thật vẫn là nợ chưa đo.
- Phát hiện phương pháp: xfade chỉ hỗ trợ 444/gray — FFmpeg tự nâng đầu
  vào yuv420p lên 444 trước xfade, nên cell "yuv" cũ phải đọc là "yuv-in";
  điều kiện đầu ra thật là e2e/x264. Nợ: dissolve 16-bit chưa đo; ghost
  chưa quét frames 2..8; footage thật (không phải lavfi) chưa đo.

### T6 — curveDropped + circle-soft + blinds/plus/checker: ĐÓNG
- curveDropped: nguyên nhân là store nuốt mất giá trị hàm pure đã trả →
  store nay trả `{ ok, curveDropped }`, NestedClipPanel hiện cảnh báo
  "n keyframe tốc độ đã bị cắt — dùng Undo để khôi phục" + key i18n vi/en.
- Circle-soft: kind `radial-soft` + tâm dịch +0,5 sang không gian tâm điểm
  (không dịch: MAD ~0,9; có dịch: MAD 0,178–0,213, le8 100% ở 192×108 và
  1280×720, 3 p — trùng số soft-aware đợt 14). Badge circle-soft lên matched.
- Blinds-h/plus/checker: MAD 0,000, le8 100% ở 192×108 và 1920×1080, 3 p
  (plus khác 2 type kia: biên `lte` đóng nên dùng ceil/floor+1, không phải
  dịch +0,5 thuần — test cũ ghim sai 50 thay vì 51 pixel đã sửa theo luật
  đúng). Badge 3 type này CHƯA nâng (số đo qua script /tmp, chưa qua
  harness V14) — để đợt sau quyết.
- Nợ: parity T6 là composite mô hình, chưa phải pixel canvas trình duyệt
  thật (click-test vẫn nợ mở chung); curveDropped mới chỉ phủ panel clip
  con, trim/split ở timeline chính và patchClip chưa báo rơi keyframe.

## 2. Kiểm chứng gộp của parent (chạy lại độc lập trên cây đã hợp nhất)
- `tsc --noEmit`: 0 lỗi (kể cả sau sửa chú thích badge của parent).
- `vite build`: pass.
- Web test: transitionPreview 26/26, nestedDeep 16/16, nestedSpeedcurve
  22/22, speedcurveTrim 18/18, splitPatch 14/14, nestUtils 28/28,
  nestedDemo 8/8.
- Harness chạy lại: V11 24 case FAIL 0; V12 32 case FAIL 0, PENDING 0;
  V14 KHỚP 15, XẤP XỈ 2, LỆCH 0, PENDING 0; T4 render 22/22; P3 73/73;
  V13 grid 3/3 KHỚP.
- Sửa duy nhất của parent: 2 chú thích phạm vi badge dissolve/circle trong
  `previewStatus.ts` theo đề xuất T5 (không đổi nhãn, không đổi logic).
- V15 HD script KHÔNG chạy lại ở bước gộp (đo 4K nặng) — số T5 là số do
  luồng đo, ghi rõ tại đây, không mạo nhận là parent đã chạy lại.
- Xung đột hợp nhất: không có — các luồng làm chung cây đĩa, T2/T6 cùng
  sửa transitionPreview.ts/test nhưng ở vùng khác nhau và test cuối 26/26
  đã chứa cả hai; store.ts trên đĩa chứa cả sửa T4 và T6, stage đúng bản đĩa.

## 3. Nợ còn lại (trung thực — cho đợt sau)
- Harness V11/V12/V14 chưa hiểu kind bars-fade mới (T2) → cần nối nhánh
  composite bars-fade vào harness, hoặc đánh dấu đã bị đo riêng thay thế.
- V13 chưa sửa (T1 ngoài phạm vi): nếu V13 dùng rasterizer riêng với mô
  hình circle cũ thì case circle HD của nó vẫn có thể FAIL/PENDING giả.
- Badge blinds-h/plus/checker chưa nâng (chờ harness V14 raster được các
  kind này); badge grid/bars-fade chưa quyết (badge gắn với canvas).
- Nối helper nested đệ quy (T3) vào store.ts cho split/trim thật; render MP4
  thật cho lá sâu đã trim/split; curveDropped cho timeline chính + patchClip.
- FPS canvas trình duyệt thật khi bật ghost; dissolve 16-bit; ghost quét
  frames 2..8; footage máy quay thật (lavfi chỉ là cận lành/cận xấu).
- Click-test browser thật vẫn là nợ mở chung của repo (parity T6 và nhiều
  số khác là composite mô hình, chưa phải pixel canvas trình duyệt).
- 3 harness nay chứa 3 bản copy của cùng logic radial/dissolve — sửa mô
  hình sau này phải sửa cả 3 nơi (hoặc tách module dùng chung ở đợt sau).
- `dist/` tái tạo bởi vite build là build artifact, không đưa vào batch stage.
- Log đo T5 (`benchmarks/results/v15-t5-*.log`) không đưa vào batch stage
  theo quy ước các đợt trước.
