# Phase 9 đợt 20 — Đóng nợ đợt 19: hợp curve hai tầng, split/trim ramp, preview rescale, UI curve, perf preview, đo crf/YUV — LIMITS TỔNG HỢP (parent)

Ngày: 2026-10-29. Đợt lớn, 6 luồng song song, KHÔNG push, KHÔNG tag/release,
KHÔNG binary, KHÔNG dist. Batch stage (không push) ở
`~/workspace/repo-1-push/paths-loop/phase9-round20-closing-debts19.txt`.

## 0. Bối cảnh: đợt 19 đã tồn tại nhưng chưa log/chưa stage

Đầu lượt, parent phát hiện đợt 19 đã làm xong trên đĩa tối 28/10 (6 luồng
G1–G6) nhưng chưa từng được log và chưa stage. Parent đã kiểm chứng độc lập
đợt 19 (tsc 0, vite build pass, nestedRampPreview 13/13, nestedCurveG2 17/17,
store.nestedCurve19 8/8, store.nestedTimelineToast 16/16, store.nestedGuard 9/9)
rồi stage riêng thành `phase9-round19-nested-speed-complete.txt` (32 file).
Đợt 20 dưới đây chỉ làm nợ mở của đợt 19, không làm trùng đợt 19.

## 1. Việc đã làm theo luồng

### R1 — Hợp curve hai tầng thật ở render (server/render/src/nested.js)
- Ngữ nghĩa đúng bằng tích phân: lá mang `s_i(x)` dưới nested có curve
  `s_o(T)` thì `src(t') = lá.in + ∫₀^{x(t')} s_i` với `x(t')` là ánh xạ outer,
  tốc độ hợp `c = s_o · s_i(x)` (quy tắc dây chuyền), dùng engine
  `speedramp.js` có sẵn. Mã hoá Hermite (x1=1/3, x2=2/3, chia ≤ 0.25s);
  trường hợp một tầng hằng thì đúng hệt bằng slice, không qua Hermite.
- Test render mới 42/42; case (a) linear×linear khớp tính tay < 1e-6
  (sourceAt(2)=3.0208333, speedAt(2)=2.125, sourceAt(4)=9); MP4 thật 4s khớp
  màu theo thời gian nguồn. Module web mới `twoLevelCurve.ts` mirror đúng
  toán render (test 12/12) — parent chưa nối vào preview (xem §3).
- Vẫn fail-fast: reverse, attachment thời gian dưới ramp, lá phi-media mang
  curve, curve lỗi, tốc độ hợp vượt [0.25, 4], > 128 keyframe.

### R2 — Split/trim nested có curve qua τ (nestUtils thuần)
- Split: điểm cắt con = `in + ∫₀^leftDur s`; curve mỗi nửa = slice trên đoạn
  output của nửa đó. Trim: tính lại duration/trim.out theo ∫ của curve đã
  cắt, giữ bất biến `trim.out = in + ∫` trong 1e-4s. Dùng slice thay vì
  `trimSpeedKeyframes` cũ (hàm cũ không chèn điểm biên nội suy, lệch 0.5s
  ở ví dụ ramp 1→2 về 2s). Curve hằng hồi quy đúng tuyến tính cũ.
- Test mới 18/18; hồi quy nestUtils 28, nestedCurveG2 17, nestedStore 11,
  nestedSpeedcurve 22, nestedDeep 16, nestedDeepSpeed 16 — 0 fail, không sửa
  file test cũ nào. Vẫn fail-fast: reverse, curve rỗng/không tính được,
  cửa sổ gốc lệch tích phân > 1e-4s, trim vượt nguồn, duration mới < 0.2s.

### R3 — Preview rescale dưới ramp + validator biết curve-nested
- `flattenNested`: fade biên rescale qua map tầng cha
  (`T' = map(X) − map(X−T)`; ramp ra đúng τ, tốc độ hằng rút gọn đúng
  `T/speed`); shiftIn gộp vào placement (code cũ trừ T thời gian cha khỏi
  thời gian ngoài — sai khi speed ≠ 1); cặp transition nội bộ viết lại
  duration theo childMap, cặp bị cửa sổ phá vỡ thì strip; phía lá phẳng của
  cặp biên được strip transition đã bị cơ chế biên tiêu thụ (trước đây vẽ
  trùng với fade biên). Fade audio cắt đo bằng thời gian output qua
  childMap. Thêm case flatten riêng: bezier ≡ linear, bezier CSS ease
  (crosscheck render lệch 0), ease-out (τ(3)=2.0946), linear 0.25→4
  (τ(3)=2.2772, C=8.5).
- Attachment thời gian GIỮ FAIL-FAST có lý do: keyframe nội suy mang easing
  riêng, đường cong thật là easing∘τ nên không biểu diễn được bằng keyframe
  remap thời gian; render cũng từ chối nên preview chấp nhận sẽ lệch ngược.
- Validator `validateNestedClip` (video-spec, cả mirror `nested.js` tay):
  nested có curve thì kiểm tra hình dạng curve + `trim.out = trim.in + ∫`
  (1e-4; curve hằng 1e-6 với `duration×v`), không còn áp bất biến tốc độ
  hằng. Clip thường giữ nguyên kiểm tra cũ.
- Kiểm chứng: nestedRampPreview 24/24 (13 cũ + 11 mới), video-spec
  nested.test 59/59, tsc 0, build pass.

### R4 — UI chế độ curve cho nested + i18n toast G2
- Phát hiện vị trí đúng: SpeedPanel tự return null với nested nên block chế
  độ đặt ở NestedClipPanel (`NestedCurveModeEditor`), hiện khi nested đã
  mang curve: radio giữ-duration (mặc định, đúng patchClip) vs giữ-trim
  (lần đầu có panel gọi action `patchNestedCurveFixedTrim` của G2), preview
  giá trị kỳ vọng bằng đúng helper thuần action dùng, áp 1 bước undo, lỗi
  không im lặng (kiểm tra xung đột hai tầng/track khóa trước vì patchClip
  trả 0 im lặng cho cả hai; đã khớp ≤ 1e-9 thì không gọi store để tránh
  entry undo rỗng). Bẫy bắt được: patchClip có cổng no-change so sánh
  tham chiếu nên panel bắt buộc truyền bản copy của curve (test C1 khóa).
- 3 toast G2 sang key i18n vi+en (giữ nguyên từng ký tự tiếng Việt, test V1
  khóa câu gốc); quét parity toàn bộ dict: vi-only [], en-only [].
- Test mới 12/12; hồi quy store.nestedCurve19 8/8, store.nestedTimelineToast
  16/16; tsc 0, build pass. KHÔNG sửa wording `nested.speedRejected` của
  G3 trong đợt này (xem §3).

### R5 — Profiling preview FPS: kết quả âm trung thực, 0 file sản phẩm đổi
- Baseline tái tạo bằng script G4: panel ~10.7 fps, draw thật ~13.3/s,
  rAF riêng ~14.3 Hz, trang trần đối chứng 58.2 Hz — khớp dải G4, không hồi
  quy. Profiling CDP: lúc phát `(idle)` 86–88%, `(program)` ~5%, drawImage
  native 2.4–5%, mọi hàm JS ≤ 0.5% self; lúc đứng yên idle 96.4%, longtask 0.
- Thí nghiệm cô lập: ẩn canvas khỏi paint → FPS không đổi; ẩn toàn bộ body
  lúc đứng yên → rAF 12 Hz lên ~50 Hz; chỉ preview-wrap hiện → ~58 Hz.
  Kết luận: nút thắt KHÔNG nằm trong code JS preview; trần FPS trên VM này
  là raster/present toàn cửa sổ 1920×1080 qua Xvfb phần mềm. Số này KHÔNG
  được trích thành FPS trên máy user (không GPU thật).
- Thử sửa duy nhất (guard `ctx.filter` chỉ gán khi đổi) không cải thiện FPS
  nên đã hoàn nguyên `preview.tsx` từng ký tự — file này vẫn đưa vào batch
  vì mtime đổi, nội dung đã xác minh không còn guard. Nợ chuyển đợt sau:
  vòng rAF chạy liên tục khi đứng yên + MixerMeter rAF chạy luôn (cần sửa
  cả MixerMeter.tsx, ngoài phạm vi luồng này) — cũng không hứa hẹn tăng FPS
  lúc phát trên VM này.

### R6 — Đo: quét crf mịn + YUV-domain crf0 + --yuv cho text/effect
- Ngưỡng KHỚP YUV cho dissolve đã khóa chính xác: **crf ≤ 14** (crf14
  MAD-YUV 1.8094 KHỚP; crf15 2.0462 XẤP XỈ — MAD quyết định tier dù vẫn
  ≥ 99%). Parent chạy lại script và tái tạo đúng từng số (tái tạo đợt 19
  lệch 0.0000). Miền RGB vẫn LỆCH mọi crf (57.78→58.21) — sàn subsample
  4:2:0 không đổi. YUV-domain crf0 = 0.0000 (khóa bằng phép đo độc lập thứ 2).
  Preset ở crf12 đều KHỚP: ultrafast 1.1663, medium 1.4079, slow 1.4103,
  veryfast 1.8753 — preset chỉ đổi dung lượng, không đổi tier.
- `--yuv` đã nối thật sang text/effect: V11 phần B text (4 case), V12 phần
  B text (4) + phần C effect (7), V14 phần E effect (9 case xác định),
  dùng helper dùng chung `harnessShared.ffmpegYuvCompare`. V14 noise/glitch
  cố tình KHÔNG nối (thống kê, nhiễu độc lập, so MAD vô nghĩa). Không đổi
  kết luận RGB nào (diff log mặc định = 0).
- CẢNH BÁO (ghi rõ trong LIMITS R6, parent nhắc lại): 2 case text
  tiltIn/skewIn lên tier YUV KHỚP trong khi RGB chỉ XẤP XỈ là số học
  (chữ trắng/nền đen cho U=V=0 nên MAD-YUV = MAD-Y/1.5) — cấm trích
  "text KHỚP ở miền YUV" mà không kèm chú thích này.

## 2. Kiểm chứng gộp của parent (chạy lại độc lập)
- tsc 0 lỗi; vite build pass (4.40s, chỉ warning chunk cũ).
- Web thuần: nestedRampPreview 24/24, twoLevelCurve 12/12, nestedCurveG2
  17/17, nestedRampSplitTrim20 18/18. Store bundle: nestedCurve19 8/8,
  nestedTimelineToast 16/16, nestedGuard 9/9, nestedCurve20R4 12/12.
- Render: test_round20_two_level_render 42/42; test_round18 sau khi parent
  cập nhật 2 assertion U6 (xem §2.1) đạt 68/68; nested_e2e 28/28,
  nested_render 24/24, nested_r3 43/43; video-spec nested.test 59/59.
- Harness: V11 29 case FAIL 0, V12 37 case FAIL 0, V14 KHỚP 21/XẤP XỈ 1/
  LỆCH 0 — cả chế độ mặc định lẫn --yuv. Script crf mịn chạy lại: exit 0,
  khớp từng số R6. node --check các script mới đều pass.

### 2.1 Sửa test cũ có chủ đích duy nhất của parent
- `server/render/src/test_round18_nested_speed_render.js`: 2 assertion U6
  ("lá có curve riêng dưới ramp", "hai tầng đều có curve") từng expect throw
  nay đổi thành expect hợp thành công theo ngữ nghĩa R1, với số tính tay
  cho đúng fixture đó: tốc độ hợp tại t'=2 là 2.4375 (= 1.5 × 1.625);
  case lá đơn: start 0, duration 4, in 0, out 8 (out' cap ở out gốc theo luật
  R1); case hai tầng: duration 2.9282, in 0, out 6. Không đổi assertion nào
  khác; test đợt 18 từ 66/68 lên 68/68. Đây là cập nhật theo hành vi đổi có
  chủ đích, không phải sửa test cho qua: cùng 2 case đã có test thành công
  độc lập ở test_round20 (42/42) và MP4 thật.

### 2.2 Xung đột file chung — kết quả gộp
- `tsconfig.json`: R1 thêm `twoLevelCurve.test.ts`, R2 thêm
  `nestedRampSplitTrim20.test.ts` vào exclude — cả hai đều có mặt, không
  ghi đè nhau. `store.ts`: chỉ R4 sửa (3 toast → i18n). `nestedPreview.ts`:
  chỉ R3 sửa. `nestUtils.ts`: chỉ R2 sửa. `nested.js` render: chỉ R1 sửa.
  `test_v11/v12/v14_parity.js`: chỉ R6 sửa. Không có xung đột nội dung nào
  phải can thiệp sâu; parent chỉ sửa 2 assertion test đợt 18 (§2.1).

## 3. Những gì CHƯA xong — nợ mở cho đợt sau (không mạo nhận)
- **Preview chưa nối hợp hai tầng:** `nestedPreview.ts` vẫn throw cho hai
  tầng (nestedRampPreview vẫn khóa "hai tầng ramp" fail-fast); module
  `twoLevelCurve.ts` mới chỉ là toán sẵn. Tới khi nối, render và preview
  lệch đúng ở case hai tầng. Tương tự, **store vẫn chặn tạo trạng thái hai
  tầng qua UI** (guard G2 ở patchClip/updateNestedDeepInnerClip) — tính năng
  hợp hiện chỉ tới được qua spec/flatten trực tiếp. Nới guard phải đi kèm
  cập nhật test G2 (store.nestedCurve19 khóa hành vi chặn hiện tại) nên
  không làm vội trong đợt này.
- **Store chưa nối trim nested ramp:** `store.ts` vẫn tính đích trim nested
  theo speed hằng nên có thể chặn/kẹp sai trước khi tới hàm thuần R2.
  Cần luồng sở hữu store tính đích bằng ánh xạ τ rồi mới gọi trimNestedClip.
- **Detector + câu báo G3 nay lỗi thời ở phần curve:** `nestedRejection.ts`
  vẫn liệt kê `speedKeyframes` là field khiến split/trim bị từ chối và key
  `nested.speedRejected` vẫn viết "render cấm speedKeyframes" — nay chỉ còn
  reverse bị từ chối ở tầng thuần (và các trường hợp curve không hợp lệ
  theo §R2). Cần follow-up phân biệt ramp hợp lệ (nay tách/trim được) với
  ramp không hợp lệ, thay vì sửa vội detector (sửa sai sẽ làm mất toast
  cho các trường hợp vẫn bị từ chối thật).
- **Attachment thời gian dưới ramp vẫn fail-fast cả render lẫn preview**
  (cần quyết định preview-ahead riêng cho karaoke, xem LIMITS R3 §1c);
  transition cặp biên ở tầng ngoài chưa strip (chỉ strip trong
  flattenNested); `flattenNested` placement-only của video-spec chưa biết
  curve; chưa có click-test browser cho nested ramp (nợ chung).
- **UI tạo curve mới cho nested từ số 0 vẫn chưa có:** block của R4 chỉ
  hiện khi clip đã mang curve. Reason của action giữ-trim vẫn hardcode
  tiếng Việt (giá trị trả về, không phải toast) — cần đợt i18n riêng nếu
  muốn sạch hẳn.
- **Preview FPS:** câu hỏi G4 đã có đáp án (trần là raster Xvfb, không phải
  JS), nhưng chưa đo trên GPU thật, màn hình thật, dpr > 1, fullscreen
  1080p, timeline nặng, footage thật hay project của user. Vòng rAF idle +
  MixerMeter rAF vẫn chạy liên tục — follow-up cần click-test seek/pause/
  scrub sau khi cho ngủ.
- **Đo:** V14 noise/glitch chưa có --yuv (cố tình, vì thống kê); codec khác
  ngoài libx264 chưa đo; footage máy quay thật H.264/1080p vẫn là nợ mở
  từ các đợt trước (đợt 19 G5 mới có webm/ogv).
- `apps/web/dist/` do vite build viết lại là build output, KHÔNG đưa vào
  batch. Binary đo chỉ ở /tmp.
