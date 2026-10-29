# Phase 9 đợt 21 — Đóng nợ đợt 20: nối hợp hai tầng vào preview/store, detector + UI tạo curve, rAF idle, footage H.264 — LIMITS TỔNG HỢP (parent)

Ngày: 2026-10-29. Đợt lớn, 6 luồng song song, KHÔNG push, KHÔNG tag/release,
KHÔNG binary, KHÔNG dist. Batch stage (không push) ở
`~/workspace/repo-1-push/paths-loop/phase9-round21-two-level-complete.txt`.

## 0. Chốt chặn + bối cảnh

- `round-in-progress.md` KHÔNG tồn tại → lượt chạy bình thường.
- Trước đợt: 16 batch chờ push (493 file, các đợt 5–20; đợt 1–4 đã push
  xong chiều 25/10).
- Chủ đề chọn từ nợ mở đợt 20 §3 (không trùng batch đã stage): preview
  chưa nối hợp hai tầng, store vẫn chặn hai tầng qua UI + trim chưa tính
  bằng τ, detector/wording G3 lỗi thời, UI chưa tạo curve từ số 0,
  rAF idle + MixerMeter chạy liên tục, footage thật H.264/1080p còn thiếu.

## 1. Việc đã làm theo luồng

### T1 — Preview nối hợp hai tầng (nestedPreview.ts)

- Chuỗi hợp `postLeaf` qua các tầng: mỗi tầng nested đệ quy tạo wrapper
  đổi đoạn lá sang timeline tầng mình rồi hợp qua `composeTwoLevelCurve`
  (lá không curve → tốc độ hằng của lá; tầng hằng ≠ 1 thì rescale curve).
  Lá mang curve riêng dưới nested ramp và nested con mang curve dưới
  nested cha mang curve nay đều hợp được thay vì throw; lá mang curve
  dưới nested tốc độ hằng nay được slice + đổi biến tuyến tính đúng hệt
  (trước đây giữ nguyên curve gốc — sai trục khi speed ≠ 1).
- Vẫn fail-fast: reverse, attachment thời gian, lá phi-media mang curve,
  curve lỗi, tốc độ hợp vượt [0.25, 4].
- Crosscheck preview-vs-render: linear×linear sourceAt(2)=3.0208,
  sourceAt(4)=9, speedAt(2)≈2.125 — đúng render đợt 20 R1; hai tầng
  duration 2.9282, speedAt(2)≈2.4375.

### T2 — Store nới guard hai tầng + trim bằng τ

- Helper chung mới trong nestUtils.ts (`checkTwoLevelOuterCurve` v.v.)
  dùng ở cả 3 đường vào: patchClip, patchNestedCurveFixedTrim,
  updateNestedDeepInnerClip. Cho qua chỉ khi cả hai curve hợp lệ riêng,
  không reverse, không attachment thời gian, chỉ lá video/audio mang
  curve, tốc độ hợp trong [0.25, 4] (lá trực tiếp lấy mẫu 257 điểm +
  knot map ngược qua τ; lá sâu kiểm tra biên tích keyframe). Lệnh bị
  chặn không đổi spec, không sinh entry undo.
- Nhánh nested của trimClip nay tính đích bằng τ: mép phải cap bằng
  outputDurationForSource, mép trái cap bằng trimIn / speedAt(curve, 0)
  theo đúng quy ước hàm thuần R2; curve không tính được thì rơi về cap
  cũ rồi để hàm thuần trả null → toast.
- Cập nhật test cũ có chủ đích (tiền lệ đợt 20 §2.1): nestedCurve19
  S4/S6 từ chặn → cho phép; R4 LEAF_CURVE hằng 1 → 1→3 để E1/V2/A2 vẫn
  khóa đường bị chặn; G2 C4 thành cặp vượt khoảng, thêm C6 cho phép.

### T3 — Detector phân biệt ramp hợp lệ + wording + reason i18n

- nestedRejection.ts viết lại: nested mang ramp HỢP LỆ (đúng luật render
  + bất biến out = in + ∫ trong 1e-4s) thì không bị từ chối nữa; vẫn từ
  chối đúng từng case với lý do riêng: reverse, curveEmpty, curveShape,
  curveRange, curveIntegral, curveWindow. API mới
  `classifyNestedSpeedRejection` + `nestedSpeedRejectionMessageForClip`.
- Wording `nested.speedRejected` (vi+en) không còn nói "render cấm
  speedKeyframes" chung chung; câu mới nêu rõ ramp hợp lệ vẫn được
  tách/trim, render chỉ cấm {reason}. Parity dict: vi-only [], en-only
  [], 787 key mỗi bên.
- Reason action giữ-trim sang key i18n (reasonKey + reason đã dịch theo
  locale); caller cũ chỉ đọc `reason` vẫn chạy; câu tiếng Việt giữ đúng
  từng ký tự bản hardcode cũ ở 3 nhánh (nhánh hai tầng nay thêm hậu tố
  chi tiết từ cổng T2 — xem §3).

### T4 — UI tạo curve mới cho nested từ số 0

- `NestedCurveCreateEditor` trong NestedClipPanel, hiện cho nested chưa
  có curve; preset: curve hằng 1×, đúng 1 keyframe (hợp lệ với mọi
  duration, tích phân = đúng duration, tốc độ hợp không vượt biên vì hệ
  số là 1). Tạo qua patchClip trong 1 bước undo, hiện preview trim.out
  trước khi tạo; sau khi tạo, block chế độ R4 hiện ngay không cần chọn
  lại clip. Lỗi không im lặng; tạo trùng không sinh undo rỗng.
- Luật chặn theo đúng luật T2 (không chặn oan cặp hai tầng hợp lệ).

### T5 — rAF preview ngủ khi idle + MixerMeter

- preview.tsx: cuối tick chỉ đặt rAF tiếp khi còn việc (đang phát /
  seek đang bay / frame chưa vẽ xong / spec-media-selection đổi); tỉnh
  lại qua useStore.subscribe, ResizeObserver và sự kiện resize. Điều
  kiện ngủ đủ 5 điều, trong đó seek lỗi thì KHÔNG ngủ để thử lại.
  MixerMeter: thêm prop isPlaying, khi pause chỉ vẽ 1 mẫu tĩnh rồi dừng
  hẳn.
- Đo thật trên VM (Xvfb 1920×1080, raster phần mềm — CẤM trích thành FPS
  máy user): sau sửa, idle cả panel đóng lẫn mở đều preview 0 tick/s,
  MixerMeter 0 tick/s, sleeping=true, draws 0/s; click-test 7/7 mỗi run,
  2/2 run (phát/dừng/scrub phím L/ArrowRight/resize viewport đều tỉnh
  đúng rồi ngủ lại, khôi phục đúng frame cũ).
- Bug giữa đường đã vá: bản đầu không ngủ do redrawFlag reset lastDrawn
  nhưng giữ lastRequested nên guard chặn request mới vĩnh viễn; sau vá
  idle ban đầu chỉ 6 tick rồi ngủ suốt 60s.

### T6 — Footage thật H.264 + parity

- 3 clip license sạch đã xác minh qua API sơ cấp (không tin tên file):
  Artemis I phóng đêm (NASA, public-domain-equivalent theo chính sách
  NASA, H.264 1080p), "Don't Talk to Strangers" 1950 (Internet Archive,
  public domain, H.264 480p), Earth from Orbit 2013 (NASA GSFC, H.264
  720p). Cổng kiểm tra chứng minh bằng trường hợp phủ định (IA
  BY-NC-ND → REJECT). Binary chỉ ở /tmp, stage chỉ script fetch.
- Parity: RGB24 dissolve/circleopen/fade đều KHỚP cả 2 cặp; native
  1080p dissolve KHỚP (MAD 0,0054 — lần đầu đo ở native 1080p trên
  footage thật); YUV420p crf14: cặp 2 đều KHỚP, cặp 1 dissolve XẤP XỈ
  2,3436 nhưng crf12 KHỚP 1,9930.
- Phát hiện mới (không đổi kết luận cũ): ngưỡng YUV crf ≤ 14 của đợt 20
  đúng trên test pattern và cặp 2 nhưng không chuyển sang cặp 1 (phim
  1950 hạt hơn — cần crf ≤ 12); sàn YUV crf0 trên footage thật là 0,65
  (ffmpeg thuần độc lập 0,6472), không phải 0,0000 như R6 — là tính chất
  pipeline xfade miền YUV khác blend RGB rồi chuyển, không phải bug.

## 2. Kiểm chứng gộp của parent (chạy lại độc lập)

- tsc 0 lỗi; vite build pass (4.44s, chỉ warning chunk cũ).
- Web thuần: nestedRampPreview 34/34, nestedPreview 46/46,
  nestedPreviewR3 17/17, twoLevelCurve 12/12, previewEngine 14/14,
  transitionPreview 26/26, nestedDemo 8/8, nestedUnify 12 PROVEN
  (2 PENDING nợ cũ).
- Store bundle: nestedCurve19 20/20, nestedCurve20R4 12/12,
  nestedCurve21T4 11/11, nestedGuard 9/9, nestedRejection21T3 31/31,
  nestedTimelineToast 16/16, nestedCurveG2 18/18,
  nestedRampSplitTrim20 18/18, nestUtils 28/28.
- Render: test_round20_two_level_render 42/42 (gồm MP4 thật).
- Script: bash -n fetch script + node --check script đo T6 và 3 script
  đo T5 đều pass. Parity i18n: 787/787, vi-only [], en-only [].
- Không chạy lại: đo headed T5 dài 60s (số của luồng, đã có 2 run),
  parity footage T6 đầy đủ (số của luồng, parent chỉ kiểm tra script).

### 2.1 Sửa xung đột / mâu thuẫn duy nhất của parent

- `NestedClipPanel.tsx` — `NestedCurveModeEditor` (R4) vẫn chặn tuyệt
  đối mọi hai tầng bằng `nestedSubtreeHasSpeedCurve`, mâu thuẫn với
  guard store T2 và block tạo mới T4 (cả hai đã cho cặp hợp lệ qua).
  Parent đã sửa: khi cây con có curve, panel gọi đúng
  `checkTwoLevelOuterCurve(clip, curve)` của T2; chỉ chặn khi check trả
  không ok, với toast key `nested.curveTwoLevelInvalid` + reason chi
  tiết. Đồng thời sửa comment lỗi thời về reason giữ-trim (T3 đã sang
  key i18n). Không sửa logic nào khác; tsc vẫn 0 sau sửa.
- Các file chung khác gộp sạch: store.ts (T2 guard + T3 reasonKey),
  i18n vi/en (T2 + T3 + T4, parity sạch), nestUtils.ts (chỉ T2),
  nestedPreview.ts (chỉ T1), preview.tsx/MixerMeter.tsx (chỉ T5).
  `apps/web/dist/` do vite build viết lại là build output, KHÔNG đưa
  vào batch.

## 3. Những gì CHƯA xong — nợ mở cho đợt sau (không mạo nhận)

- Toast store/panel chưa nối sang dạng clip-aware: store notify và panel
  vẫn gọi detector dạng fields-only nên toast với field curve nêu lý do
  chung (đúng, không nêu sai) chứ chưa pinpoint từng case; hàm
  `nestedSpeedRejectionMessageForClip` đã sẵn, cần 1 dòng mỗi chỗ ở
  store notify + panel để nối (T3 không tự sửa vì panel do T4 giữ).
- Reason nhánh hai tầng của action giữ-trim lẫn đuôi tiếng Việt do lý do
  chi tiết của cổng T2 hardcode — nợ i18n của T2.
- Kiểm tra tốc độ hợp của T2 chỉ là cổng UI: lấy mẫu có thể bỏ sót đỉnh
  vượt giữa hai mẫu với bezier; lá sâu chỉ kiểm tra biên tích keyframe
  (điều kiện cần, không đủ cho bezier). Render vẫn là chốt chặn cuối.
- Ba tầng 1→2 đều nhau không hợp được (tích cuối 8 > 4) — giới hạn định
  dạng speedKeyframes, không phải bug; muốn hợp sâu biên độ lớn cần dạng
  biểu diễn curve hợp riêng (nợ kiến trúc từ R1).
- Click-test browser cho nested ramp vẫn là nợ chung (T4 thử Playwright
  nhưng repo không có runner, đã dừng thay vì cài dependency); scrub
  chuột qua automation vẫn thất bại cả trước và sau sửa T5 (chỉ kiểm
  chứng scrub qua phím L/ArrowRight), nguyên nhân chưa truy nguyên.
- Chưa có clip dọc H.264 (dọc vẫn chỉ có webm/ogv của đợt 19); Openverse
  API video trả 403/empty từ VM nên T6 xác minh qua API sơ cấp NASA/IA.
- Chưa đo: GPU thật, màn hình thật, dpr > 1, fullscreen, timeline nặng,
  footage thật, project của user; tab ẩn rồi hiện lại trong lúc preview
  ngủ; native 1080p cho circleopen/fade; 4K; codec khác ngoài libx264.
- Attachment thời gian dưới ramp vẫn fail-fast cả render lẫn preview;
  transition cặp biên ở tầng ngoài trong flattenForPreview và
  flattenNested placement-only của video-spec chưa biết curve.
