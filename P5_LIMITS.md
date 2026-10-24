# P5 (Phase 7) — Kho nội dung vòng 2: giới hạn & trạng thái trung thực

> Nguyên tắc: chỉ liệt kê là "hoạt động" những gì đã render ra MP4 thật
> và kiểm chứng bằng pixel/test. Mọi thứ khác ghi rõ là chưa làm được.

## ✅ HOẠT ĐỘNG (đã kiểm chứng)

### Templates: 10 → 30
- 20 template mới (`assets/templates/gen_templates2.py` → 20 file JSON +
  regen `apps/web/src/lib/templates.ts`): wedding-teaser, food-reel,
  gaming-highlight, breaking-news, quote-card, tutorial-vertical, unboxing,
  fitness-promo, lofi-visual, album-teaser, interview-cut, audiobook-promo,
  event-invite, real-estate-tour, recipe-card, travel-diary, birthday-card,
  sale-banner, documentary-title, outro-creator.
- Tất cả tự thiết kế gốc (không clone layout CapCut), chỉ dùng 9 category
  đã có (không thêm category mới).
- Test: `bash apps/web/scripts/test-templates.sh` — 10 assertions pass
  (validateSpec pass cho cả 30 template với giá trị mặc định, không còn
  marker, aspect đúng từng template).
- Render thật: 20/20 template vòng 2 render ra MP4 bằng render worker
  (xem kết quả chi tiết cuối file — script `test_p5_templates` tương đương
  với `/tmp/p5_render_templates.py` chạy ngày 2026-10-23; media thay thế
  là testsrc2/PNG/m sine tổng hợp, không phải media thật của user).

### Text preset: 56 → 76
- 20 preset CSS gốc (`vcut-fade-up`, `vcut-zoom-in`, `vcut-spin-in`,
  `vcut-flip-in`, `vcut-skew-in`, `vcut-drop-in`, `vcut-roll-in`,
  `vcut-slide-up`, `vcut-slide-down`, `vcut-jump-in`, `vcut-bounce-in`,
  `vcut-stretch-in`, `vcut-shake`, `vcut-bounce-soft`, `vcut-rotate-swing`,
  `vcut-blink`, `vcut-pulse-glow`, `vcut-wobble`, `vcut-float`,
  `vcut-heartbeat`). Keyframes tự viết, MIT.
- README + `_test_all.html` đã cập nhật (76 stylesheet, 76 card trong grid).
- Lưu ý đếm: trước vòng 2 thực tế là 30 animate-css + 26 vcut = 56
  (không phải 28+28 như ghi chú cũ); sau vòng 2 là 30 + 46 = 76.
- Port drawtext: chỉ một phần — ghi chú ✅/⚠️/❌ trong từng file.
  Các preset dùng rotate/skew/scaleX (spin-in, flip-in, skew-in, roll-in,
  stretch-in, rotate-swing, wobble) KHÔNG port được sang drawtext.

### LUT: 134 → 154
- 20 LUT gốc (`assets/filters/gen_vcut_luts4.py`, lưới Adobe .cube 17³,
  hàm màu thuần túy): monsoon-rain, saigon-night, hanoi-autumn,
  lantern-fest, rice-terrace, midnight-market, cherry-festival,
  glacier-blue, meadow-light, bamboo-green, lotus-pink, bubble-tea,
  honey-glow, chili-ember, typhoon-grey, ember-night, noir-smoke,
  silk-road, opal-dream, coral-dawn.
- Cả 4 mirror đã đồng bộ: `packages/video-spec/src/lut.ts` (IDS + META),
  `server/render/src/lut.js` (IDS), CSS approx trong `previewEngine.ts`
  và `LutPicker.tsx`.
- Test: `lut.js --self-test` pass (154 LUT + file .cube đầy đủ),
  `test_color.js` 40/40, `test-preview-engine.sh` 272 assertions pass.
- 3 LUT mới đã xuất hiện trong render template thật (honey-glow trong
  recipe-card, chili-ember trong sale-banner, monsoon-rain trong
  documentary-title) — tức filter `lut3d` đã chạy thật với file .cube mới.

### Sound: 983 → 1013
- 30 sound tổng hợp gốc (`assets/sounds/gen_vcut_sounds2.py`, numpy
  sin/vuông/noise → OGG Vorbis): riser +6, impact +7, transition +6,
  sweep +4, downer +3, stinger +4. Tất cả ffprobe đọc được, duration
  đúng thiết kế. `index.json` đã cập nhật (1013 entries, thêm category
  sweep/downer/stinger).
- Không sample từ nguồn nào — không cần đọc LICENSE ngoài.

### Transition: 58 → 67
- 9 transition custom expr (`xfade=transition=custom`): blinds-h, bars-v,
  checker, diamond, plus, grid, clock, circle-soft, bars-fade.
- Đã render thật bằng ffmpeg + kiểm chứng pixel
  (`server/render/test_p5_transitions.py`, 9/9 pass): frame giữa khác
  cả 2 frame gốc; blinds/bars có pattern xen kẽ đúng. Một transition
  (blinds-h) cũng chạy qua render worker thật (spec 2 clip → MP4,
  frame giữa có đúng dải mành).
- Đã cập nhật cả 4 mirror: `transitions.js` (kèm xử lý quote expr),
  `transitions.ts`, `TransitionPanel.tsx`, `assets/transitions/catalog.json`.
- CSS panel chỉ là minh họa (clip-path/steps), không phải hiệu ứng thật.

## ❌ CHƯA LÀM ĐƯỢC / GIỚI HẠN CÒN TỒN TẠI

1. **21 transition GLSL vẫn không dùng được** — FFmpeg thiếu filter
   `gltransition`. 9 transition custom expr chỉ bù được các hiệu ứng
   hình học đơn giản (mành, thanh, hình thoi, đồng hồ...), không thay
   thế được các hiệu ứng shader phức tạp (morph, kaleidoscope, swirl...).
2. **Render template dùng media tổng hợp** — testsrc2/PNG/sine, không
   phải footage/ảnh thật. Render chứng minh pipeline (track, LUT, text,
   transition, sticker, audio) chạy được, không chứng minh chất lượng
   thẩm mỹ của template với media thật.
3. **Text preset rotate/skew không port sang drawtext** — xem ghi chú
   từng file. Preview web hiển thị đúng, nhưng render MP4 sẽ bỏ qua
   phần rotate/skew (hoặc chỉ port được alpha/position).
4. **Sticker trong template dùng file PNG literal** (sparkle.png,
   heart.png, badge.png) — người dùng phải tự cung cấp file khi dùng
   template; render test đã tự tạo PNG màu đặc để chứng minh pipeline.
5. **Binary không push được qua connector** — .cube/.ogg/.png mới chỉ
   nằm trên đĩa (theo mẫu các batch trước, chỉ push script + manifest
   + code). File `assets/sounds/index.json` hiện ~660KB+ (vượt giới hạn
   arg của push_files) nên cũng cần push bằng cách khác hoặc tách nhỏ.
6. **Chưa kiểm chứng bằng browser thật** — panel transition mới và
   text preset mới chỉ kiểm chứng bằng tsc + vite build, chưa click-test
   trên browser (giới hạn chung của dự án từ trước).
7. **Tốc độ render trên VM chậm** — render 1080p trên VM 2vCPU khi
   chạy cùng các agent Phase 7 khác chỉ đạt ~2fps (so với benchmark
   8.6fps lúc máy rảnh). Thời gian render 20 template dài hơn dự kiến
   nhưng không ảnh hưởng kết quả.

## Kết quả render 20 template (2026-10-23, suite `test_p5_templates.py`)

Media thay thế tổng hợp (testsrc2 640x360 / PNG màu đặc / sine mp3),
render qua `server/render/src/render.js --media-dir`, kiểm tra: exit 0,
ffprobe duration = đúng durationSec, frame giữa không phải màu đặc.

| Template | Duration | Kết quả |
|---|---|---|
| wedding-teaser | 8.0s | PASS |
| food-reel | 12.0s | PASS |
| gaming-highlight | 10.0s | PASS |
| breaking-news | 6.0s | PASS |
| quote-card | 6.0s | PASS |
| tutorial-vertical | 12.0s | PASS |
| unboxing | 10.0s | PASS |
| fitness-promo | 8.0s | PASS |
| lofi-visual (có audio) | 12.0s | PASS |
| album-teaser | 8.0s | PASS |
| interview-cut | 12.0s | PASS |
| audiobook-promo | 8.0s | PASS |
| event-invite (có sticker) | 8.0s | PASS |
| real-estate-tour | 12.0s | PASS |
| recipe-card (LUT honey-glow) | 12.0s | PASS |
| travel-diary | 12.0s | PASS |
| birthday-card (có sticker) | 6.0s | PASS |
| sale-banner (LUT chili-ember) | 6.0s | PASS |
| documentary-title (LUT monsoon-rain) | 6.0s | PASS |
| outro-creator (có sticker) | 8.0s | PASS |

Tổng: **20/20 PASS**. Thời gian suite ~8 phút trên VM 2vCPU (chạy cùng
các agent Phase 7 khác).
