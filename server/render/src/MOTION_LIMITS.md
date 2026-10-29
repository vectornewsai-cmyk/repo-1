# MOTION_LIMITS.md — Phase 9 đợt 8 S2: slow-mo mượt / nội suy frame / motion blur

## Phạm vi (S2 — nhánh clip thường)

- Chỉ FFmpeg có sẵn (`minterpolate`, `tmix`). KHÔNG model đóng, KHÔNG RIFE,
  KHÔNG cloud. Chất lượng nội suy = mức của FFmpeg mci/aobmc/bidir, không
  ngang RIFE/CapCut AI slow-mo — đừng quảng cáo khác.
- S2 chỉ làm nhánh clip thường trong `render.js`. Nhánh speed-ramp
  (`speedKeyframes`) do luồng S3 phụ trách (`buildMotionPostChain` trong
  `speedramp.js`) — S2 không sửa nhánh đó, không sửa `speedramp.js`.
- Shape `clip.motion` trong đợt này là SHAPE TẠM (chờ luồng S1 chốt
  `packages/video-spec/src/motion.ts`):
  `{ interpolation?: 'none'|'minterpolate', targetFps?: number,
     miMode?: 'mci'|'blend', motionBlur?: { frames, weights? } }`.
  Xem header `motion.js`. Parent sẽ khớp lại khi S1 xong.

## Vị trí chain (đã chốt)

Nhánh thường: `... scale, pad, setsar=1, [fps | minterpolate,fps], [tmix],
format, color, LUT, effects, enhPost, plugin, adj ...`

- Interpolation THAY filter `fps=<projectFps>` (không giữ cả hai).
- `tmix` đi ngay sau bước fps/minterpolate, TRƯỚC `format` — blur là xử lý
  theo trục thời gian nên áp trên chuỗi frame thô, trước các xử lý pixel
  từng frame (color/LUT/effects).
- Khi chỉ có blur không interpolation: giữ `fps=<projectFps>` rồi thêm tmix
  ngay sau — cùng một vị trí, không trường hợp đặc biệt.

## Đuôi frame của minterpolate (phát hiện khi đo thật, FFmpeg 8.1.2)

- Minterpolate trần (bidir/aobmc/vsbmc, cả blend) RỚT ~1 khoảng frame input
  ở đuôi do cần frame lookahead: testsrc2 15fps + speed 0.5, target 30fps
  cho 113 frame thay vì 120 (thiếu 0.23s). Không vá = đuôi unit ngắn hơn
  slot timeline, lộ nền đen.
- Cách vá đã áp trong `buildMotionFpsFilter`: thêm `fps=<targetFps>` ngay
  sau minterpolate — fps này chỉ lấp đầy lưới CFR bằng frame cuối (các
  frame giữa đã nằm đúng lưới nên nội suy không bị hủy). Đo lại: đúng
  120 frame / 4s.
- Tác dụng phụ còn lại: ~0.23s cuối clip bị "đóng băng" frame cuối thay vì
  chuyển động tiếp. Chấp nhận được cho slow-mo (đuôi clip thường là
  frame tĩnh hoặc cắt bỏ), nhưng không nên quảng cáo là nội suy hoàn hảo
  tới frame cuối cùng.

## targetFps khác project fps

- Cho phép khi clip KHÔNG dính transition, nhưng output cuối vẫn bị
  `-r <projectFps>` chuẩn hóa nên lợi ích mượt chỉ còn một phần sau khi
  downsample (vd target 60 về project 30: một nửa frame nội suy bị bỏ).
- CẤM khi clip dính transition: xfade bắt buộc 2 input cùng fps — validator
  fail-fast thay vì render vỡ graph.

## Alpha

- `minterpolate`/`tmix` chạy được trên `yuva420p` (clip chromaKey / nguồn
  có alpha): test (d) trích frame PNG vẫn là RGBA. Lưu ý: minterpolate có
  thể convert pix_fmt nội bộ nhưng kênh alpha vẫn đi qua tới
  `format=yuva420p` cuối chain.
- Riêng encode H.264 không giữ alpha (giới hạn của codec, không phải của
  motion) — alpha chỉ có ý nghĩa khi clip còn được composite tiếp trong
  graph (overlay), giống hành vi chromaKey hiện có.

## Tương tác

- motion + `enhance.stabilize`: CHO PHÉP. vidstabtransform chạy ở enhPre
  (trước speed), minterpolate/tmix chạy sau scale/pad — hai tầng không
  chia sẻ state nên không có xung đột kỹ thuật. Chất lượng kết hợp
  (ổn định rồi nội suy) CHƯA được đo — không claim gì thêm.
- motion + `speedKeyframes` (ramp): validator S2 KHÔNG cấm — nhánh ramp là
  phạm vi S3, đã khớp shape (S3 import trực tiếp builder/validator này).
- motion + reverse / speed hằng: cho phép, không xung đột (reverse và
  speed chạy trước scale, motion chạy sau scale).
- motion trên clip không phải video (audio/text/image/sticker): validator
  fail-fast — các kind đó không qua nhánh clip thường nên motion sẽ rơi
  mất nếu không chặn.

## Fail-fast (validator)

- `targetFps` ngoài 1..120; `miMode`/`interpolation` ngoài enum.
- `motionBlur.frames` ngoài 2..8 (số nguyên); `weights` dài khác `frames`;
  `weights` chứa số không dương/không hữu hạn.
- `motion` trên clip không phải video; `targetFps != project fps` +
  transition. Tất cả đều là lỗi (không warn rồi render bừa).

## Lệch shape — ĐÃ KHỚP (parent đợt 8, ghi chú cũ đã gỡ)

- Shape chuẩn duy nhất là `packages/video-spec/src/motion.ts` của S1:
  `interpolation: 'none'|'minterpolate'`, `targetFps` 1..120,
  `miMode: 'mci'|'blend'`, `motionBlur: { frames 2..8, weights? }`.
- S3 đã chuyển sang import trực tiếp builder/validator của `motion.js`
  này — không còn shape tạm boolean, không còn 2 shape song song.
- Khác biệt có chủ ý còn lại giữa tầng spec (S1) và tầng render (S2),
  ghi rõ để đợt sau không "sửa" nhầm thành lỗi: (a) spec bắt
  `targetFps` khi `minterpolate`, render cho phép vắng và mặc định bằng
  project fps (nhánh ramp cần trường hợp vắng này); (b) spec resolve
  blur vắng frames thành 3 + weights đều, render yêu cầu `frames`
  explicit (UI S5 luôn ghi frames nên project từ UI không chạm vào
  trường hợp này); (c) render chặn thêm `targetFps != project fps` +
  transition (xfade cùng fps), spec không có luật này.

## Chưa làm / nợ

- Chưa đo tốc độ minterpolate mci trên clip dài/HD (chỉ đo đúng/sai frame
  ở 320×180) — slow-mo dài trên máy yếu có thể chậm, chưa có số.
- Chưa có UI/preview cho motion (luồng khác phụ trách); render worker
  chỉ nhận `clip.motion` từ spec.
- Chưa xử lý `targetFps` là số không nguyên (FFmpeg chấp nhận nhưng validator
  chỉ chặn ngoài 1..120 — số lẻ như 29.97 đi qua, chưa test).
- Chưa đo chất lượng kết hợp stabilize + interpolation. → ĐÃ ĐO ở đợt
  9 M4 (xem mục "Đợt 9 M4" cuối file): stabilize + interpolation HỖ TRỢ
  thật, jitter giảm xuyên qua interpolation; stabilize + motionBlur cũng
  HỖ TRỢ thật (đo bằng MAD).

---

## Phạm vi (S3 — nhánh speed-ramp, `speedKeyframes` + `motion`)

S3 chỉ sửa `server/render/src/speedramp.js` (hàm `buildMotionPostChain`,
nối vào `buildSpeedRampVideo`) và nhánh `isRamp` trong `render.js`.
Nhánh clip thường bên dưới thuộc S2, không đụng vào. `motion.js` thuộc
S2 — S3 chỉ import, không viết lại.

### ĐÃ KHỚP SHAPE VỚI S2 (mục "Lệch shape với S3" ở trên đã lỗi thời)

S3 ban đầu dùng shape tạm (boolean) khi `motion.js` chưa có, nhưng trước
khi đóng đợt S3 đã chuyển sang IMPORT TRỰC TIẾP `buildMotionFpsFilter` /
`buildMotionBlurChain` / `validateMotion` từ `motion.js` của S2. Hiện tại
chỉ còn ĐÚNG MỘT shape motion duy nhất (shape S2, xem header `motion.js`):
`{ interpolation?: 'none'|'minterpolate', targetFps?: number (1..120),
miMode?: 'mci'|'blend', motionBlur?: { frames 2..8, weights? } }`.
Mục lệch shape của S2 ở trên mô tả trạng thái cũ — S3 không sửa phần S2,
chỉ ghi chú tại đây rằng nó đã hết hiệu lực; S2/parent gỡ mục đó khi chạm
tới file lần sau. Nếu luồng S1 chốt `motion.ts` khác shape này thì S2 và
S3 phải sửa CÙNG nhau (cả hai cùng import/định nghĩa từ một chỗ).

### Ngữ nghĩa chốt cho ramp + motion

- Clip ramp được concat các đoạn thành stream ở nhịp stretch theo tốc độ
  đoạn, rồi minterpolate quyết CFR ở fps project. `minterpolate` chạy với
  CÙNG fps project (`fps=<projectFps>`, kèm `fps=<projectFps>` lấp đuôi
  theo vá của S2) — KHÔNG tăng fps, KHÔNG tăng số frame của ramp.
  Số frame vẫn = duration × fps (đo: 40 frame / 2s @ 20fps, xem dưới).
- `motionBlur` (`tmix`) áp SAU minterpolate khi cả hai cùng bật.
- Ramp + motion nhưng KHÔNG có đoạn nào speed < 1: interpolation vẫn
  chạy, không fail-fast vô lý, hiệu quả ~0 vì không có frame lặp để nội
  suy — chỉ tốn thời gian encode (đo: ramp 1x→2x + interpolation render
  OK, 40 frame / 2s).
- `targetFps` của ramp BẮT BUỘC bằng fps project hoặc bỏ trống; khác thì
  fail-fast ở `buildMotionPostChain` (điểm khác duy nhất so với nhánh
  thường — nhánh thường cho phép khác fps khi không dính transition).
  `miMode` ngoài `'mci'|'blend'`, `frames` ngoài 2..8, `weights` lệch
  đều throw qua `validateMotion` của S2.

### Vị trí chain (đo thật, không đoán — lệch khỏi ví dụ trong brief S3)

Brief S3 ví dụ "motion nối vào cuối postChain". Vị trí đó đã được ĐO và
BÁC BỎ: minterpolate áp sau khi stream đã CFR (sau fps từng đoạn + fps
sau concat) thì gần như passthrough (frame-diff y hệt bản không motion)
và làm ĐEN frame cuối (mean 0.0, đo ngày 26/10 trên testsrc2 và nguồn
mượt tự tạo). Vì vậy khi interpolation bật, `buildSpeedRampVideo`:
  - BỎ `fps=` từng đoạn và BỎ `fps=` sau concat;
  - minterpolate (+ tmix kèm theo, nếu có) đứng TRƯỚC các filter postChain
    khác (color/LUT/effects — khớp thứ tự S2: motion ngay sau fps, trước
    xử lý pixel);
  - mask vẫn áp sau cùng (caller áp sau khi hàm trả label).
- Khi CHỈ có motionBlur không interpolation: giữ nguyên cấu trúc cũ,
  tmix nằm cuối postChain (sau effects/plugin).

### Tương tác fail-fast / không chặn (ramp)

- Ramp + motion + `enhance.stabilize`: CHẶN (giữ nguyên — validator và
  nhánh isRamp đã chặn stabilize + ramp từ trước, trf detect không khớp
  đoạn ramp; motion không nới lỏng cổng này).
- Ramp + motion + `reverse`: CHẶN (validator đã chặn reverse +
  speedKeyframes; nhánh isRamp và `buildSpeedRampVideo` kiểm tra lại —
  reverse đảo hướng chuyển động nên nội suy sẽ sai hướng).
- Mask keyframes + minterpolate: KHÔNG CHẶN (đã kiểm tra, không vỡ):
  mask animation trim theo đúng duration × fps và áp SAU postChain;
  minterpolate cùng fps giữ nguyên số frame/CFR nên mask vẫn khớp từng
  frame. Chưa có test E2E mask-keyframes + motion — mới dừng ở lý luận
  theo thứ tự chain (xem nợ).
- Ramp + motion + transition (xfade): không chặn riêng ở S3 — unit ramp
  sau minterpolate vẫn CFR đúng fps project nên xfade nhận đúng định
  dạng; `targetFps != project fps` + transition đã bị validator S2 chặn.

### Số đo thật (test `test_motion_ramp.js`, 17/17 xanh)

Nguồn testsrc2 320×180, clip ramp 2s @ 20fps, keyframes 1 → 0.5 → 0.5
(đoạn slow-mo 0.5x), FFmpeg 8.1.2, preset veryfast, crf 28:

| Bản | frames | max frame-diff | std frame-diff | mean \|Laplacian\| | frame cuối |
|---|---|---|---|---|---|
| Ramp không motion | 40 | 4.551 | 1.092 | 9.394 | mean 123.1 |
| Ramp + interpolation (mci) | 40 | 3.705 | 0.732 | — | mean 123.9 (không đen) |
| Ramp + motionBlur { frames: 5 } | 40 | — | — | 7.711 | mean 123.1 |

- (a) Duration interp = 2.000s, frame count 40 = 2 × 20 (± 2) — đạt.
- (b) Độ mượt: maxDiff 3.705 < 4.551 VÀ stdDiff 0.732 < 1.092 — đạt
  (cả hai chỉ số đều nhỏ hơn, không chỉ một). Trên nguồn mượt tự tạo
  (blob mềm di chuyển, PIL): plain max 1.030 / std 0.196, interp mci
  max 0.860 / std 0.162, blend max 0.791 / std 0.158 — cũng đạt.
- (c) MotionBlur: độ sắc nét 7.711 < 9.394 — đạt (giảm ~18%).
- (d) Ramp không motion: duration 2.000s, 40 frame — hồi quy đạt.
- (e) Ramp 1x→2x + interpolation: render OK, 40 frame — đạt.
- (f) Fail-fast: targetFps 60 @ project 20 → throw; miMode 'dup' →
  throw; reverse + motion → throw (đơn vị và E2E).
- (g) Dry-run filtergraph nhánh ramp chứa `minterpolate=fps=20`.
- Alpha (kiểm tra riêng ngoài test suite): video RGBA (chữ nhật alpha
  128 trên nền trong suốt) qua minterpolate vẫn giữ kênh alpha
  (max 129 ≈ 128 gốc, nền 0) — khớp kết luận alpha của S2.

### Nợ S3 còn lại (cập nhật đợt 9 M4)

- Chưa có test E2E mask keyframes + motion (mới lý luận theo thứ tự
  chain) và chưa có test ramp + motion + transition (xfade) E2E. → ĐÃ CÓ
  ở đợt 9 M4: test `test_motion_combos_m4.js` 42/42 xanh, xem mục
  "Đợt 9 M4" cuối file — cả hai tổ hợp đều HỖ TRỢ thật, cộng thêm một
  fail-fast mới ở mức cặp transition (xem dưới).
- Chưa có UI/preview cho motion trên ramp (luồng khác phụ trách);
  render worker chỉ nhận `clip.motion` từ spec.
- Chưa đo tốc độ minterpolate mci trên clip ramp dài/HD — số trên chỉ ở
  320×180, clip 2s (render interp ~1–3s); clip dài trên máy yếu có thể
  chậm nhiều.
- S1 chưa chốt `motion.ts`: nếu shape đổi, S2 + S3 sửa cùng nhau (xem
  mục khớp shape ở trên).

---

## Đợt 9 M4 — tổ hợp motion ở render (test `test_motion_combos_m4.js`, 42/42 xanh)

Đo thật trên FFmpeg 8.1.2, khung 320×180 @ 30fps, preset veryfast, crf 28.
Nguồn: video rung P2 (`test_p2_gen_shaky.py`, tremor cao tần) cho stabilize,
màu đặc đỏ/xanh cho mask/transition. M4 chỉ sửa `validate.js` (fail-fast mức
cặp transition) + thêm test + LIMITS này — KHÔNG đụng `motion.js`,
`speedramp.js`, `render.js` (luồng M1 cùng chạm motion/speedramp).

### Kết luận từng tổ hợp

| Tổ hợp | Kết luận | Bằng chứng |
|---|---|---|
| stabilize + interpolation (nhánh thường) | HỖ TRỢ | 90 frame / 3s; redx 3.466 → 1.57 / 2.32 (2 lần chạy, ngưỡng 0.75); frame khác stab-only meanAbsDiff 10.2–13.7; dry-run: vidstabtransform trước minterpolate |
| stabilize + motionBlur frames=5 (nhánh thường) | HỖ TRỢ | 90 frame / 3s; MAD 3.131 → 1.061 (tỉ lệ 0.339); dry-run có vidstabtransform + tmix=frames=5 |
| mask-keyframes + interpolation targetFps=30 | HỖ TRỢ | 90 frame / 3s; mask đúng vị trí t=0.5 (trái đỏ) và t=2.5 (phải đỏ) |
| mask-keyframes + interpolation targetFps=60 @ project 30, KHÔNG transition | HỖ TRỢ | 90 frame / 3s sau `-r` cuối; mask đúng vị trí cả hai thời điểm — blend đồng bộ theo timestamp (mask frame lặp) + `-r` chuẩn hoá lại nên không cần fail-fast |
| mask-keyframes + motionBlur frames=3 | HỖ TRỢ | Mask đúng vị trí cả hai thời điểm (mask áp SAU tmix nên biên mask vẫn sắc) |
| mask-keyframes + ramp + interpolation | HỖ TRỢ | 90 frame / 3s; mask đúng vị trí cả hai thời điểm |
| ramp + motion + transition (fade 0.5s), 1 clip ramp hoặc cả 2 clip ramp | HỖ TRỢ | Output 120 frame / 4s = D khai báo (xem lưu ý D); t=0.5 đỏ thuần, t=1.75 pha (117,0,134), t=3.0 xanh thuần, t=3.75 đen (đuôi pad) |
| stabilize + ramp + motion | FAIL-FAST (đã có, hồi quy xanh) | Validator chặn stabilize + ramp (trf detect không khớp đoạn ramp); motion không nới lỏng cổng này |
| targetFps != project fps + transition, KỂ CẢ khi chỉ 1 clip trong cặp khai transition | FAIL-FAST (MỚI, mức cặp) | Xem "Bug bắt được" dưới đây |

### Bug bắt được và fail-fast mới (mức cặp transition)

Trước M4, kiểm tra `targetFps != project fps + transition` chỉ ở mức
per-clip (`validateClip` chỉ biết `transitionIn/transitionOut` của chính
clip đó). Lỗ hổng: cặp transition mà chỉ clip A khai `transitionOut` thì
clip B mang `targetFps=60` @ project 30 vẫn lọt validator, rồi render vỡ
xfade với lỗi khó hiểu `timebase (1/30) do not match (1/60)`, ffmpeg mã
234 (đo thật 26/10). Chiều ngược (chỉ B khai `transitionIn`, A mang
`targetFps` lệch) cũng lọt y hệt.

Sửa (M4, chỉ `validate.js`, vòng ghép cặp transition): khi ghi nhận một
cặp transition, kiểm tra CẢ HAI clip trong cặp — clip nào có
`interpolation='minterpolate'` và `targetFps` hữu hạn khác project fps
thì báo lỗi nêu rõ tên cả hai clip. Render.js với spec cặp xấu thoát mã 1
kèm thông báo `targetFps` (test E3/E4). Các control vẫn pass: cặp transition
+ `targetFps === project fps`; `targetFps != project fps` nhưng không
transition; ramp+motion (`targetFps` vắng) + transition.

### Lưu ý đo đạc (để đợt sau không "sửa" nhầm)

- Gradient tĩnh KHÔNG nhạy để đo tmix trên nguồn shaky: texture thô (ô cờ
  40px) nên gradient chỉ giảm 3–4% (3.366 → 3.259 / 3.187 → 3.055) dù tmix
  chạy thật — chỉ số đúng cho tmix là MAD (độ thay đổi frame liên tiếp),
  giảm từ ~2.1–3.1 xuống ~0.7–1.1 (tỉ lệ ~0.33).
- `redx` của tổ hợp stab+interp biến thiên giữa các lần chạy (1.57 và
  2.32, cùng interp-only 3.466) — test dùng ngưỡng 0.75 thay vì 0.7 của P2
  cho stabilize thuần, để khỏi flaky sát biên.
- Ngữ nghĩa D cho transition là hành vi CÓ SẴN (test_p3 E9 đã chốt), không
  phải do M4 đổi: project D = clip kết thúc muộn nhất theo khai báo (4s),
  unit merge dài 3.5s nên output pad 0.5s nền đen ở đuôi — test M4 kiểm
  chứng đúng ngữ nghĩa này (đuôi đen), không claim tổng duration 3.5s.
- Chưa đo: tốc độ các tổ hợp trên clip dài/HD; mask-keyframes +
  interpolation với `targetFps < project fps` (chỉ đo 60 > 30); stabilize
  + interpolation với `targetFps != project fps` (chỉ đo cùng fps 30).

---

## Phase 9 đợt 9 M1 — VÁ ĐUÔI ĐÓNG BĂNG (sửa nợ đợt 8 mục 1)

### Nguyên nhân đo thật (không đoán)

Minterpolate bidir cần frame lookahead nên rớt các output cuối mà cửa
sổ nội suy vượt quá frame input cuối. Vá đợt 8 (`fps` sau
minterpolate) chỉ lấp lưới CFR bằng cách lặp lại frame nội suy áp
chót — đo trên testsrc2 15fps + speed 0.5 → 30fps, slot 4s: 6 frame
đuôi có diff < 0.05 (diff cuối 0.094 → 0.01 → 0.011 → 0 → 0 → 0 → 0),
tức ~0.23s đóng băng, và frame đóng băng đó cách frame nguồn cuối
thật 5.096 (mean abs diff) — tức đuôi dừng sớm ở một frame SAI, không
phải frame cuối thật. Ở speed 0.25 còn tệ hơn: 12 frame đóng băng
(0.4s), frame cuối cách frame nguồn cuối 5.105.

### Cách sửa (chỉ dùng filter FFmpeg có sẵn)

`buildMotionTailFix` trong `motion.js` (dùng chung cả hai nhánh):
` tpad=stop_mode=clone:stop=4` TRƯỚC minterpolate +
`trim=end_frame=duration*targetFps,setpts=PTS-STARTPTS` SAU tmix.
Clone-pad cho minterpolate frame lookahead thật (bản sao frame nguồn
cuối — không bịa nội dung ngoài biên clip, không lấy frame ngoài
`out` của clip), trim cắt đúng slot và bỏ phần pad thừa. `fps` sau
minterpolate được GIỮ làm lưới an toàn. Hai mảnh đi cùng nhau và chỉ
bật khi caller truyền duration hợp lệ; thiếu duration thì giữ hành vi
đợt 8 (fps lấp đuôi) để không vỡ caller cũ. Thứ tự mới nhánh thường:
`setsar=1, tpad, minterpolate, fps, [tmix], trim, setpts, format, ...`;
nhánh ramp: tpad đứng đầu postChain motion, trim sau tmix nhưng trước
color/LUT/effects (mask vẫn áp sau cùng nên vẫn khớp từng frame).

### Số đo sau sửa (FFmpeg 8.1.2, testsrc2 320×180)

Nhánh thường, 15fps + speed 0.5 → 30fps, slot 4s:
- Đúng 120 frame; đuôi đóng băng (diff < 0.05) = 0 frame (trước: 6).
- Giữa chuỗi không đổi: mid mean diff 1.344 cả bản trước và sau vá
  (bằng đúng bản minterpolate trần 113 frame).
- Frame cuối cách frame nguồn cuối thật chỉ 1.305 (trước: 5.096).
- 3 frame cuối cùng có diff nhỏ 0.114 / 0.122 / 0.162 (giảm so với
  ~1.3 giữa chuỗi) — đây là vùng output nằm sau timestamp frame nguồn
  cuối, nơi không còn thông tin chuyển động tương lai; nội dung hội tụ
  về frame cuối thật chứ không đóng băng ở frame sai.
- Blend mode cũng cải thiện: đóng băng 7 → 3 frame, và 3 frame đó
  chính là frame cuối thật (blend giữa frame cuối và clone của nó).
- Tốc độ 0.25 (slot 8s, 240 frame): đóng băng 12 → 4 frame, frame cuối
  cách frame nguồn cuối 1.146 (trước: 5.105); 4 frame còn lại nằm đúng
  trong 1 khoảng frame input cuối (0.267s) — xem giới hạn dưới.
- Alpha: chuỗi tpad + minterpolate + tmix trên yuva420p vẫn cho frame
  RGBA (không vỡ kênh alpha).
- Không motion: graph không chứa tpad/trim (chuỗi cũ nguyên vẹn).

Nhánh ramp, clip 2s @ 20fps, keyframes 1 → 0.5 → 0.5:
- Đuôi trước M1 vốn chỉ còn 2 frame diff giảm nhẹ (0.123, 0.136),
  không phải lỗi 0.23s như nhánh thường; sau M1 đuôi hết hẳn vùng
  giảm: 40 frame, frozen_tail = 0, 3 diff cuối 3.567 / 3.008 / 4.454
  (diff cuối thành max mới, vẫn < plain 4.551 nên test mượt vẫn đạt).
- Số liệu mượt ramp sau M1 (đo lại trong test_motion_ramp):
  maxDiff 4.454 / stdDiff 0.661 (đợt 8: 3.705 / 0.732) — cả hai vẫn nhỏ
  hơn plain (4.551 / 1.092); max tăng vì diff đuôi nay là chuyển động
  thật thay vì vùng giảm nhẹ cũ. Đừng "sửa" số đợt 8 thành lỗi.

### Giới hạn còn lại (trung thực — không claim vá tuyệt đối)

1. Ở tốc độ rất chậm (0.25x), ~1 khoảng frame input cuối của slot
   (tối đa ~4 output frame ở 30fps) vẫn hội tụ về frame cuối: diff
   decay 0.198 → 0.083 → 0.043 → 0.054 → ~0. Đây KHÔNG còn là lỗi đóng
   băng ở frame sai (frame cuối nay là frame nguồn cuối thật, cách
   1.1), mà là hệ quả tất yếu: sau timestamp frame nguồn cuối không
   tồn tại frame tương lai để nội suy. Muốn diff đuôi giữ ~1.3 tới
   frame cuối cùng thì phải bịa chuyển động (đảo chiều/ping-pong hoặc
   ngoại suy) — M1 cố tình KHÔNG làm điều đó vì nội dung sẽ sai.
2. Pad stop=4 được chọn sau khi đo stop=1, 2, 4, 8 cho kết quả đuôi
   Y HỆT nhau ở speed 0.5; với nguồn fps rất thấp + speed rất chậm
   (khoảng frame input > ~0.5s) thì 4 clone vẫn đủ cho cửa sổ bidir
   (≤2 frame) nhưng vùng hội tụ cuối (giới hạn 1) sẽ dài theo đúng
   khoảng đó — chưa đo trường hợp này.
3. Chưa đo lại trên footage thật (người, chuyển động nhanh, cắt cảnh)
   và 1080p/4K — số trên chỉ ở testsrc2 320×180. Chưa đo kết hợp
   tpad + stabilize + interpolation (cho phép, chưa đo chất lượng).
4. Tiêu chí "đuôi không đóng băng quá 1 frame" của brief M1: đạt theo
   nghĩa frame đóng băng ở frame SAI (0 frame ở 0.5x và ramp; 0 frame
   sai ở 0.25x) — nhưng nếu đếm cả vùng hội tụ về frame cuối thật
   thì 0.25x còn ~4 frame diff < 0.05 và blend còn 3 frame diff = 0 ở
   đúng vùng sau timestamp frame cuối. Đừng báo cáo rút gọn thành
   "hết đóng băng hoàn toàn" mà không kèm chú thích này.

### Test sau sửa (chạy lại toàn bộ, không chỉ test mới)

- `node src/motion.js` self-test: OK (gồm assert cặp pre/tail M1 và
  fallback thiếu duration).
- `node src/test_motion_render.js`: 29/29 (đợt 8 là 22/22; +7 assert
  mới ở mục F: preFilter/tpad, tailFilter/trim 120, đủ 120 frame,
  frozen_tail = 0, mid mean 1.344, graph render.js chứa tpad + trim;
  1 assert cũ ở mục C cập nhật regex cho phép tpad giữa setsar và
  minterpolate — vẫn bắt minterpolate đúng vị trí thay fps).
- `node src/test_motion_ramp.js`: 17/17 (số mượt mới xem trên).
- `node src/test_motion_e2e.js`: 19 pass, 0 fail.
- `node src/test_k1.js` (hồi quy): 21/21.
