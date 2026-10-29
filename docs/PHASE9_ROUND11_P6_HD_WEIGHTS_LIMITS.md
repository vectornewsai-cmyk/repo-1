# Phase 9 đợt 11 P6 — Kiểm chứng HD/footage thật + weights 0 ở project cũ: LIMITS

> Ngày: 2026-10-27, lượt cron 02:03. Chủ đề: đóng 3 nợ đợt 9 —
> "tmix 4K, ramp+motion HD, chất lượng artifact nội suy" và "weights 0
> ở project cũ", cộng "đuôi trên footage quay thật và HD/clip dài thật".
> KHÔNG push — batch chỉ stage, chờ user push từ main chat. Không tag/release.

## 0. Footage: vẫn là TỔNG HỢP, không phải quay thật — nói thẳng

- Repo không có sẵn footage quay thật nào (`find assets/ benchmarks/` không
  thấy .mp4/.mkv/.mov). Mọi số dưới đây đều đo trên footage tổng hợp
  testsrc2 + vuông đỏ chuyển động (cùng công thức nguồn đợt 9 M5).
- Vì vậy nợ "đuôi trên footage quay thật và HD/clip dài thật" vẫn MỞ:
  P6 chỉ đóng được vế HD (4K/1080p tổng hợp) và vế đuôi đã đo ở 720p
  qua chỉ số tailfix (mục 3), không claim gì về footage quay thật.
- Mọi số đều là chạy 1 lần trên máy đo 2 vCPU / 7.7 GiB, CPU-only,
  FFmpeg 8.1.2. Đợt 9 M5 đã ghi dao động giữa 2 lần chạy ~18%; P6 gặp
  dao động lớn hơn ở ramp_only (2.8s lượt đầu → 4.8s lượt rerun), nên
  tỉ lệ (~17×) đáng tin hơn số tuyệt đối.

## 1. tmix ở 4K — gần như miễn phí (encode mới là cổ chai)

Nguồn 3840×2160, 25fps, 2s, preset veryfast, crf 23
(`benchmarks/motion/bench_motion_p6.sh`, JSONL `benchmarks/results/motion_p6.jsonl`):

| Cấu hình | Thời gian (s) | Frame | So với plain |
|---|---|---|---|
| plain (không filter) | 7.115 | 50 | 1.00× |
| tmix frames=3 | 6.787 | 50 | 0.95× |
| tmix frames=5 | 6.320 | 50 | 0.89× |
| tmix frames=8 | 6.179 | 50 | 0.87× |

- Đọc đúng: tmix 4K KHÔNG tốn thêm thời gian đo được — các số dưới plain
  nằm trong dao động chạy (encode libx264 chiếm áp đảo), KHÔNG được
  hiểu là "tmix làm encode nhanh hơn". Kết luận duy nhất: ở 4K, chi phí
  tmix chìm trong chi phí encode; frames=3/5/8 không phân biệt được.
- Đối chiếu đợt 9 M5: tmix 1080p cũng ≈ plain (8.965s vs 8.805s). Nhất
  quán: tmix rẻ ở mọi res, minterpolate mới là phần đắt (mục 2).

## 2. ramp+motion ở 1080p — motion đắt gấp ~17× so với ramp-only

Qua render.js THẬT (spec `speedKeyframes` 1→0.5 + motion minterpolate
targetFps 30 + tmix frames 3, project fps 30, nguồn 1920×1080 30fps 2s):

| Cấu hình | Thời gian (s) | Frame / duration |
|---|---|---|
| ramp-only | 4.753 | 60 / 2.000s |
| ramp+motion | 82.484 | 60 / 2.000s |

- Motion cộng thêm ~17.4× thời gian ramp-only (82.484 / 4.753). Output
  giữ đúng slot 2s/60 frame ở cả hai (ngữ nghĩa ramp của repo: output
  theo slot clip, khớp test_motion_ramp.js) — motion không làm lệch
  duration/frame count.
- Trung thực về sự cố lượt đầu: lượt bench đầu tiên ramp_motion FAIL
  sau 0.423s vì P6 đang sửa `validate.js` giữa lúc bench chạy (race do
  chính luồng này gây ra — import `normalizeLegacyMotion` chưa kịp vào
  file khi render chạy). Số trên là lượt rerun sau khi code đã ổn định,
  không phải số lượt đầu. Script bench không có lỗi; đừng đọc FAIL đó
  thành lỗi sản phẩm.
- Ngoại suy: KHÔNG ngoại suy clip dài từ mẫu 2s (đợt 9 M5 đã chứng minh
  ngoại suy tuyến tính lệch tới 2.12× ở plain 30s). Muốn số clip dài
  phải đo thật clip dài — vẫn là nợ mở.

## 3. Chất lượng artifact nội suy — PSNR/SSIM, và kết quả ngược trực giác

Phương pháp (`benchmarks/motion/measure_interp_quality.py`, JSON
`benchmarks/results/motion_p6_quality.json` — đọc kỹ vì chỉ số này dễ
bị đọc sai):
- Chân lý: testsrc2 + vuông đỏ ở fps cao, render trực tiếp bằng lavfi.
- Nguồn thấp: chân lý hạ fps bằng filter `fps=` (giữ đúng lưới thời
  gian). Tái tạo lên fps cao bằng 4 cách: dup (chỉ lặp frame — baseline),
  blend, mci (đúng chain render thật motion.js), mci+tailfix (thêm tpad
  clone + trim như vá đuôi đợt 9 M1).
- So sánh bằng filter `psnr`/`ssim` của FFmpeg (cùng res/fps/số frame).
  Hai cửa sổ: FULL (toàn clip) và TRIM (bỏ 0.5s cuối — vùng đuôi không
  phương pháp nào có thông tin tương lai, nên điểm đuôi phản ánh thiếu
  thông tin chứ không phải chất lượng nội suy giữa chuỗi).
- PSNR/SSIM là độ gần pixel với chân lý, KHÔNG phải đánh giá cảm quan:
  nội suy mượt về mắt vẫn có thể thua dup về PSNR khi motion estimation
  đoán sai vài pixel trên nền chi tiết cao.

### 3a. 360p: chân lý 60fps → thấp 15fps → tái tạo 60fps (2s)

| Cách | PSNR full (dB) | PSNR trim (dB) | SSIM full | SSIM trim | Thời gian tái tạo |
|---|---|---|---|---|---|
| dup | 27.23 | 27.38 | 0.9488 | 0.9480 | 0.95s |
| blend | 27.09 | 27.87 | 0.9352 | 0.9367 | 0.61s |
| mci | 27.00 | 27.79 | 0.9413 | 0.9438 | 17.22s |
| mci+tailfix | 27.57 | 27.79 | 0.9438 | 0.9438 | 15.30s |

- Ở 360p, nội suy KHÔNG thắng dup về PSNR/SSIM (mci 27.00 vs dup 27.23
  full; SSIM 0.9413 vs 0.9488). Nền testsrc2 360p quá nhiều chi tiết nhỏ
  so với kích thước khối motion estimation — đoán sai tốn nhiều hơn
  lợi. Đây là giới hạn của nội dung test, không phải bằng chứng "nội suy
  vô dụng": xem 720p ngay dưới, cùng phương pháp, kết quả đảo ngược.
- Tailfix chỉ tác dụng lên đuôi, đúng như thiết kế: PSNR full tăng
  +0.57dB (27.00 → 27.57) trong khi PSNR trim Y HỆT mci (27.79) và SSIM
  trim y hệt (0.9438) — phần giữa chuỗi không đổi một chút nào.

### 3b. 720p: chân lý 50fps → thấp 25fps → tái tạo 50fps (2s)

| Cách | PSNR full (dB) | PSNR trim (dB) | SSIM full | SSIM trim | Thời gian tái tạo |
|---|---|---|---|---|---|
| dup | 29.47 | 29.69 | 0.9719 | 0.9721 | 4.04s |
| blend | 31.43 | 32.37 | 0.9710 | 0.9720 | 3.82s |
| mci | 34.30 | 36.43 | 0.9839 | 0.9854 | 74.04s |
| mci+tailfix | 35.68 | 36.43 | 0.9850 | 0.9854 | 56.92s |

- Ở 720p, mci thắng rõ: +4.8dB so với dup (full), +6.7dB ở cửa sổ trim;
  SSIM 0.9839 vs 0.9719. Blend ở giữa (+2.0dB so với dup). Tức chất lượng
  nội suy phụ thuộc mạnh vào độ phân giải/nội dung — không được gom
  thành một câu "mci tốt hơn dup" hay ngược lại.
- Tailfix lại chỉ tác dụng lên đuôi: PSNR full +1.38dB (34.30 → 35.68),
  PSNR/SSIM trim Y HỆT mci (36.43 / 0.9854). Đây là bằng chứng độc lập
  thứ hai (sau đợt 9 M1) rằng vá đuôi không làm méo giữa chuỗi.
- Chi phí: mci 720p 2s tốn 74s (~37× realtime); tailfix không tốn thêm
  (56.9s — chênh lệch là dao động chạy, không phải tailfix rẻ hơn mci).

## 4. Weights 0 ở project cũ — ĐÃ SỬA (fallback ở cổng load, không nới validate)

Thiết kế (`packages/video-spec/src/motion.ts` → `migrateMotion`;
mirror JS `server/render/src/motion.js` → `normalizeLegacyMotion` —
hai hàm giữ cùng rule set, sửa một bên phải sửa cả hai):

- `validateMotion` KHÔNG ĐỔI (vẫn fail-fast, vẫn throw với weights toàn
  0). Migration là bước RIÊNG chạy ở cổng load, TRƯỚC khi validate:
  cổng render là nhánh motion trong `server/render/src/validate.js`
  (validateSpec — nơi render.js chặn spec hỏng trước khi render), và
  filter builder `buildMotionBlurChain` cũng normalize nội bộ để filter
  khớp dạng đã validate (nhánh ramp hưởng ké vì speedramp.js import
  trực tiếp hàm này).
- CHỈ biến đổi input mà hiện FAIL ít nhất một tầng (spec hoặc render);
  project mới hợp lệ được trả về NGUYÊN VẸN (cùng tham chiếu,
  migrated=false) — hành vi project mới không đổi một bit nào.
- Chỉ cứu 4 trường hợp weights/frames (ngoài ra giữ nguyên để validate
  vẫn bắt: frames ngoài [2, 8], weights không hữu hạn/dài ngoài [2, 8],
  key lạ, interpolation/miMode sai, kind khác video):
  1. weights chứa số <= 0 (toàn 0, lẫn 0, hoặc âm — lẫn 0/âm thì spec có
     thể pass nhưng render S2 bắt số dương nên vẫn fail) → weights đều.
  2. frames vắng mà weights có mặt (dài 2..8) → frames = weights.length
     (spec vốn cho phép, render S2 bắt frames nên fail — chỉ điền field
     mà resolveMotionBlur vốn đã suy ra).
  3. frames lệch weights.length (weights dài 2..8) → frames =
     weights.length (giữ nguyên weights, không cắt/xén weights).
  4. motionBlur rỗng {} → frames = 3 (đúng mặc định resolveMotionBlur).
- KHÔNG mutate input (trả object mới khi migrated=true).
- UI web không đụng tới: panel từ đợt 9 đã chặn weights < 1% cho dữ
  liệu mới nên không cần sửa UI. Đường load web (`projectRepo.ts` dùng
  `migrate()` theo schema version) chưa gọi `migrateMotion` — đó là
  việc hiển thị khi mở file, không chặn render vì cổng render đã cứu;
  ghi nhận là việc follow-up, không claim đã nối.

### Kiểm chứng (đều là test/render thật, không mock)

- Spec: `motion.test.ts` 26/26 (19 cũ + 7 mới E1–E7); mirror `.js` tái
  tạo bằng tsc và diff-identical với bản compile mới.
- Server: `motion.js` self-test OK (gồm assert migrate + chain).
- `test_motion_p6_legacy.js` (mới): 14/14 — validateSpec pass với 3 dạng
  project cũ (weights 0, thiếu frames, blur {}); validateMotion strict
  vẫn fail với input thô; chain ra tmix weights đều; render thật bằng
  render.js: clip cũ weights 0 (blur-only) và clip cũ weights 0 +
  minterpolate đều ra MP4 đúng 60 frame / 2s.
- Hồi quy: `test_motion_render.js` 31/31, `test_motion_ramp.js` 17/17,
  `test_motion_e2e.js` 19/19.
- Thay đổi có chủ ý trong `test_motion_render.js`: 2 case cũ ("weights
  lệch frames", "weights âm") rời khỏi nhóm badCases vì cổng load giờ
  migrate chúng theo đúng lệnh P6 — thay bằng assert kép: validateSpec
  pass (load gate) VÀ validateMotion thô vẫn fail (strict giữ nguyên).
  Đây là thay đổi hành vi có chủ ý, không phải hồi quy lặng lẽ.
- `test_motion_combos_m4.js`: 41/42 — 1 fail ở case A (stabilize +
  interp): ngưỡng jitter `rx2.std < rx0.std * 0.75` không đạt (3.183 vs
  ngưỡng 2.63; lần đo M4 pass 42/42). P6 KHÔNG gây ra fail này: case A
  dùng motion chỉ có interpolation, không có motionBlur — đường code P6
  trả về nguyên vẹn (identity) và chain filter byte-identical; dry-run
  graph trong cùng test vẫn pass. Ghi nhận là fail ngưỡng đo có sẵn
  (nghi do vidstab/jitter nhạy với lần chạy), không sửa ngưỡng trong
  đợt này vì ngoài phạm vi P6 và sửa ngưỡng có thể che lỗi stabilize
  thật. Parent nên cho chạy lại combos để xác nhận tính ổn định.

## 5. File đổi/thêm (tương đối từ repo root, đã stage — xem batch)

- `packages/video-spec/src/motion.ts` — thêm `migrateMotion`.
- `packages/video-spec/src/motion.js` — mirror tái tạo bằng tsc.
- `packages/video-spec/src/motion.test.ts` — thêm test E1–E7.
- `server/render/src/motion.js` — thêm `normalizeLegacyMotion`, nối
  vào `buildMotionBlurChain`, self-test mới.
- `server/render/src/validate.js` — nhánh motion validate dạng đã
  migrate (cổng load render).
- `server/render/src/test_motion_p6_legacy.js` — mới, test 14/14.
- `server/render/src/test_motion_render.js` — cập nhật 2 case theo
  hành vi load gate mới (ghi chú P6 trong file).
- `benchmarks/motion/bench_motion_p6.sh` — mới (tmix 4K + ramp 1080p).
- `benchmarks/motion/measure_interp_quality.py` — mới (PSNR/SSIM).
- `benchmarks/results/motion_p6.jsonl` — mới (số bench).
- `benchmarks/results/motion_p6_quality.json` — mới (số PSNR/SSIM).
- `docs/PHASE9_ROUND11_P6_HD_WEIGHTS_LIMITS.md` — file này.
- KHÔNG đụng: `effectCanvas.ts`, `previewStatus.ts`, `TextAnimPicker`,
  i18n (fallback weights không cần text mới — notes chỉ nằm trong
  code/test, không hiển thị UI).

## 6. Nợ còn lại (không claim ngược)

- Footage quay thật + clip dài thật + HD/clip dài cho đuôi: vẫn chưa đo
  (cần nguồn quay thật; P6 chỉ có tổng hợp).
- Ngoại suy clip dài từ mẫu 2s: không làm (đợt 9 đã chứng minh lệch tới
  2.12×) — muốn số clip dài phải đo thật clip dài.
- Web load path (`projectRepo.ts`) chưa gọi `migrateMotion` khi mở file
  (chỉ ảnh hưởng hiển thị, render đã được cổng validate.js cứu).
- Combos M4 41/42: ngưỡng jitter case A cần xác nhận lại (mục 4).
- 0.25x còn ~4 frame hội tụ về frame cuối thật, pad stop=4 chưa đo cho
  nguồn fps rất thấp + speed rất chậm, preview trail ≠ tmix, bóng
  mask/SR chưa tính lại theo thời gian — các nợ này từ đợt 9, P6 không
  đụng tới.
