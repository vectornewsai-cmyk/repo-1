# Q4 (Phase 8) — Kho nội dung vòng 3: giới hạn & ghi chú trung thực

Ngày: 2026-10-24. Agent: Q4. Phạm vi: templates, text preset, LUT, sound,
video effects. KHÔNG push (parent xử lý push).

## Tổng kết số lượng (trước → sau)

| Kho | Trước | Sau |
|---|---|---|
| Templates | 30 | 50 (+20) |
| Text presets | 76 | 96 (+20) |
| LUT | 154 | 174 (+20; 122 vcut id ↔ 122 file .cube, 0 orphan) |
| Sound | 1013 | 1043 (+30) |
| Video effects | 7 | 16 (+9) |
| Transition | 67 | 67 (không đổi) |
| Sticker | 244 | 244 (không đổi) |
| Font | 59 | 59 (không đổi) |

## 1. Templates 30 → 50

- Generator: `assets/templates/gen_templates3.py` (theo mẫu gen_templates2.py).
  20 file mới: podcast-studio, morning-news, concert-teaser, album-cover,
  cooking-show, travel-montage, gym-transformation, book-trailer,
  webinar-invite, charity-appeal, app-launch, fashion-lookbook, wedding-vows,
  graduation-celebration, podcast-highlight, desk-setup, outro-subscribe,
  intro-logo, family-slideshow, sale-countdown.
- Chỉ dùng 9 category có sẵn (social, ads, cinematic, music, podcast,
  broadcast, outro, slideshow, intro), tên animation có sẵn, transition có
  sẵn, LUT id có sẵn, sticker PNG literal có sẵn (heart/sparkle/badge/star).
- Tích hợp: `build_templates_ts.py` đã sửa header hardcode "catalog 30"
  thành số động; `templates.ts` regen = 50; `templates.test.cjs` sửa
  assertion 30 → 50.
- Kiểm chứng:
  - validateSpec (render.js) 50/50 pass (script `/tmp/q4_validate_templates.js`,
    chạy trực tiếp bằng Node, không qua tsc).
  - Render thật 20/20: xem mục "Kết quả render template" cuối file.
- Giới hạn:
  - `templates.test.cjs` (qua tsc) từng bị chặn vì `packages/video-spec/src/sticker.ts`
    đang được agent khác sửa dở (lỗi `track` bắt buộc, rồi
    `TrackAttachment | undefined`) — Q4 không sửa file đó để tránh đè việc.
    Cuối phiên Q4, agent đó đã sửa xong và test chạy XANH: 9 assertions
    PASS (gồm count 50 templates). Tương tự, `test-preview-engine.sh` chạy
    xanh: 337 assertions PASS (gồm kiểm tra 174 LUT đều có CSS mapping).
  - Render test dùng media tổng hợp (testsrc2/solid PNG/sine) — chứng minh
    pipeline + thời lượng, không chứng minh thẩm mỹ với media thật.
  - Template outro-subscribe chỉ có text (không placeholder video/ảnh/âm
    thanh) — render ra video nền đen + chữ, hợp lệ nhưng đơn điệu; nếu muốn
    đẹp hơn thì thêm placeholder nền video ở vòng sau.

## 2. Text presets +20 (76 → 96)

- 20 file `assets/text-presets/vcut-*.css` mới, keyframes gốc 100%:
  entrance 12 (fade-down, zoom-out, slide-left, slide-right, swirl-in,
  tilt-in, grow-in, flip-up, curtain-in, elastic-in, zoom-blur-in, skew-pop)
  + attention 8 (pulse-soft, sway, bob, flicker-soft, shimmer-text,
  spin-slow, tada-soft, jiggle).
- Cập nhật: `assets/text-presets/README.md` (76 → 96, Entrance 42 → 54,
  Attention 21 → 29 + 20 dòng bảng) và `_test_all.html` (96 card, link đủ
  20 file mới, card nằm trong grid — đã kiểm chứng count = 96).
- Kiểm chứng: brace balance toàn bộ 66 file vcut-*.css OK.
- Giới hạn: ghi chú port drawtext trong từng file (✅/⚠️/❌) — nhiều preset
  cần rotate/clip-path/skew nên render FFmpeg chỉ port được một phần; đây là
  giới hạn đã biết từ các vòng trước, không phải lỗi mới.

## 3. LUT +20 (154 → 174)

- Generator: `assets/filters/gen_vcut_luts5.py` (lưới 17³, hàm màu thuần túy,
  primitive giống gen_vcut_luts4.py). 20 LUT mới, xem `assets/SOURCES.md`
  mục "LUT tự chế đợt 5".
- Cập nhật đủ 4 mirror: `packages/video-spec/src/lut.ts` (IDS + META),
  `server/render/src/lut.js` (IDS + self-test 154 → 174),
  `apps/web/src/lib/previewEngine.ts` (LUT_CSS), `apps/web/src/components/lut/LutPicker.tsx`
  (CSS_APPROX). `apps/web/scripts/preview-engine.test.cjs` sửa 154 → 174.
- Kiểm chứng: `node server/render/src/lut.js --self-test` xanh
  (174 LUT + color adjust, file .cube đầy đủ); đối chiếu 122 vcut id ↔ 122
  file .cube, 0 thiếu, 0 orphan.
- SỰ CỐ ĐÃ SỬA (trung thực): Q4 ban đầu đặt tên 2 LUT mới là `vcut-matcha`
  và `vcut-coral-reef`, trùng với 2 LUT đã có từ vòng luts3 — gây lỗi trùng
  key TS1117 ở lut.ts và ghi đè 2 file .cube gốc. Đã khắc phục:
  - Đổi tên mới thành `vcut-iced-matcha` và `vcut-reef-glow` ở cả script,
    4 mirror và SOURCES.md; dedupe IDS/META.
  - Khôi phục đúng 2 file gốc bằng chính hàm + write_cube của
    gen_vcut_luts3.py (xác định, không đoán).
  - Sau sửa: self-test xanh, 122 ↔ 122 khớp 1:1.
  - Bài học: vòng sau phải grep tên mới trong registry trước khi đặt tên.
- Giới hạn: LUT preview trên web vẫn chỉ là CSS approx (giống mọi vòng).

## 4. Sound +30 (1013 → 1043)

- Generator: `assets/sounds/gen_vcut_sounds3.py` (numpy → WAV 16-bit 44.1kHz
  → OGG Vorbis `-q:a 4`). 30 file mới trong `assets/audio/vcut-synth-*.ogg`:
  riser 5, impact 5, transition 4, sweep 4, downer 4, stinger 4, whoosh 2,
  chime 2. Xem `assets/SOURCES.md` mục "Sound tổng hợp gốc vòng 3".
- Kiểm chứng: đủ 30/30 file mới, ffprobe xác nhận Vorbis + thời lượng đúng
  thiết kế (spot check 8 file).
- Manifest: `assets/sounds/index.json` cập nhật total 1013 → 1043 và sửa
  count vcut-synth 35 → 95 (12 kenney + 936 uisfx + 95 vcut = 1043 khớp).
  Lưu ý trung thực: vòng P5 đã để count vcut-synth là 35 dù thực tế đã có
  65 file (35 K6 + 30 P5); Q4 sửa thành 95 cho khớp thực tế (65 + 30 Q4).
  index.json là manifest tổng hợp theo nguồn, KHÔNG phải danh sách từng file.
- Giới hạn: không có kiểm chứng nghe chủ quan (không phát được audio qua
  tool); chỉ kiểm chứng kỹ thuật (codec, thời lượng, decode ffprobe).

## 5. Video effects +9 (7 → 16)

- Thêm vào `server/render/src/effects.js` (EFFECT_TYPES 7 → 16) +
  `packages/video-spec/src/effects.ts` (EFFECT_TYPES + EFFECT_META nhãn
  tiếng Việt) + CSS approx trong `previewEngine.ts` + comment 7 → 16 ở
  `EffectPanel.tsx` (panel đọc EFFECT_TYPES/EFFECT_META động nên không cần
  sửa logic). `validate.js` không cần sửa (đã require validateEffects từ
  effects.js).
- 9 effect mới: glitch (rgbashift + noise), rgb-shift (rgbashift),
  shake (crop dao động theo t + pad), pixelate (down/up-scale),
  mirror (hflip), old-film (noise + eq + vignette), invert (lutrgb nội suy
  theo intensity), edgedetect (edgedetect), hue-rotate (hue).
- Kiểm chứng: `server/render/test_q4_effects.js` + measure/gen Python —
  10/10 render + 13/13 pixel check pass (glitch |R-B| = 119; rgb-shift
  |R-B| = 129, vùng phẳng std 0.0; shake giữ 320x180 và khác nguồn;
  pixelate gradient row runs 212 → ~83; mirror trái (0,0,254)/phải
  (253,0,0); old-film saturation proxy 72 + noise std 19.3; invert-full
  sai số tối đa 2 so với đảo hoàn hảo; edgedetect mean R 2.2 / max 255;
  hue-rotate đỏ (255,0,0) → (172,82,0)). `node src/effects.js --self-test` pass.
- Giới hạn (ghi rõ, đừng claim hơn):
  - `posterize` BỊ LOẠI: filter `posterize` không tồn tại trong FFmpeg
    8.1.2 (Unknown filter) — hue-rotate thay vị trí thứ 9. Đừng thêm lại
    nếu chưa kiểm tra filter có sẵn.
  - shake có viền đen cố định 12px (pad không hiểu biến `t`, chỉ cửa sổ
    crop dao động).
  - mirror bỏ qua intensity (hflip là nhị phân).
  - glitch/rgb-shift/shake/pixelate/mirror/edgedetect không có CSS tương
    đương nên preview web bỏ qua (branch skipped) — preview ≠ render với
    6 effect này; invert/hue-rotate/old-film có CSS approx.
  - Hai bug test đã sửa trong lúc verify (ngưỡng pixelate quá chặt với
    nhiễu x264/yuv420p; hộp mẫu mirror chồng lên ô xanh) — bản thân effect
    đúng, chỉ test sai.

## 6. Nguồn ngoài

- Vòng này KHÔNG dùng nguồn ngoài nào: toàn bộ 20 template, 20 preset,
  20 LUT, 30 sound, 9 effect đều là tác phẩm gốc VCut Studio (MIT) hoặc
  filter FFmpeg có sẵn. Không có license mới cần đọc, không có nguồn nào bị
  loại trong vòng này (posterize bị loại vì lý do kỹ thuật, không phải
  license — xem mục 5).
- SOURCES.md đã cập nhật đủ 5 mục Q4 + sửa tổng LUT 154 → 174,
  tổng sound 1013 → 1043.

## 7. File thay đổi (Q4, chưa push)

- `assets/templates/gen_templates3.py` + 20 JSON mới + `build_templates_ts.py`
  (header động) + `apps/web/src/lib/templates.ts` (regen 50)
  + `apps/web/scripts/templates.test.cjs` (30 → 50).
- `assets/text-presets/vcut-*.css` (20 file mới) + README.md + _test_all.html.
- `assets/filters/gen_vcut_luts5.py` + 20 .cube mới (+ 2 .cube đổi tên) +
  lut.ts + lut.js + previewEngine.ts + LutPicker.tsx + preview-engine.test.cjs.
- `assets/sounds/gen_vcut_sounds3.py` + 30 .ogg mới (binary, theo mẫu cũ
  KHÔNG push) + `assets/sounds/index.json`.
- `server/render/src/effects.js` + `packages/video-spec/src/effects.ts` +
  `apps/web/src/lib/previewEngine.ts` (effect approx) +
  `apps/web/src/components/effects/EffectPanel.tsx` (comment) +
  `server/render/test_q4_effects*.{js,py}` + `server/render/test_q4_templates.py`.
- `assets/SOURCES.md` + file này (`Q4_LIMITS.md`).
- Lệnh chạy lại kiểm chứng (tất cả đã xanh cuối phiên Q4):
  - `cd server/render && node src/lut.js --self-test` ✅
  - `cd server/render && node src/effects.js --self-test && node test_q4_effects.js` ✅
  - `cd server/render && python3 test_q4_templates.py` ✅ 20/20 (chạy lại tuần tự
    sẽ mất ~10–20 phút; bản Q4 chạy 4 slice song song từ `~/workspace/q4_render/`)
  - `bash apps/web/scripts/test-templates.sh` ✅ 9 assertions
  - `bash apps/web/scripts/test-preview-engine.sh` ✅ 337 assertions
  - validateSpec 50/50 qua render.js (script tạm `/tmp/q4_validate_templates.js`
    đã mất cùng đợt dọn /tmp — logic: thay placeholder video→.mp4, image→.png,
    audio→.mp3, text→default rồi gọi validateSpec từ server/render/src/validate.js)

## Kết quả render template — 20/20 PASS (2026-10-24)

Chạy `server/render/test_q4_templates.py` chia 4 slice song song (media tổng
hợp testsrc2/PNG, workspace `~/workspace/q4_render/`, mỗi slice 5 mẫu):

- Slice 0 (5/5): podcast-studio 10.0s, morning-news 7.0s, concert-teaser
  8.0s, album-cover 6.0s, cooking-show 12.0s — đều đúng durationSec, mid-frame
  không solid.
- Slice 1 (5/5): travel-montage 12.0s, gym-transformation 8.0s, book-trailer
  7.0s, webinar-invite 6.0s, charity-appeal 7.0s.
- Slice 2 (5/5): app-launch 6.0s, fashion-lookbook 9.0s, wedding-vows 8.0s,
  graduation-celebration 6.0s, podcast-highlight 7.0s.
- Slice 3 (5/5): desk-setup 8.0s, outro-subscribe 5.5s (mẫu text-only, render
  được — nền đen + chữ), intro-logo 5.0s, family-slideshow 9.0s,
  sale-countdown 6.0s.
- Lưu ý: lần chạy đầu tiên (tuần tự, log /tmp) bị mất giữa chừng do /tmp bị
  dọn khi VM chuyển phiên; lần chạy lại dùng log + output trong workspace
  và chia 4 slice song song nên hoàn thành trong ~6 phút.
