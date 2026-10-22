# K6_LIMITS.md — Giới hạn trung thực của đợt kho nội dung Phase 6 (K6)

## Đã làm (đã kiểm chứng)

### 1. Sticker: 203 → 244 (+41 Fluent UI Emoji 3D, MIT)
- License verify 2 nguồn độc lập: GitHub API `microsoft/fluentui-emoji/license`
  → `spdx_id: MIT` + file LICENSE gốc "Copyright (c) Microsoft Corporation".
- Chỉ dùng biến thể 3D PNG (`assets/<Name>/3D/<name>_3d.png`); biến thể Color/Flat
  là SVG nên không dùng làm sticker (render worker overlay PNG).
- 41/41 PNG tải về, magic bytes PNG đã verify, SHA256 ghi trong
  `fetch_stickers2.sh` + `sticker-manifest.json` (214 entries).
- Đặt tên `fluent-<snake>.png` để tránh đụng `star.png`/`fire.png` đã có.
- Test: `test_stickers3.py` (cập nhật lên 214) PASS toàn bộ.

### 2. Font: 43 → 59 (+16 OFL, Vietnamese subset)
- Verify qua METADATA.pb gốc trên google/fonts: chỉ nhận font có dòng
  `subsets: "vietnamese"`. Sau đó kiểm tra glyph bằng fontTools: 16/16 font
  đủ 28/28 dấu tiếng Việt kiểm tra (ĂÂĐÊÔƠƯ + các dấu thanh mẫu).
- `fonts.ts` sinh lại bằng `assets/fonts/gen_fonts_ts.py` (không sửa tay) —
  script này cũng sinh lại các helper `FONT_CATEGORIES`/`fontsByCategory`/
  `fontStack` mà FontPicker.tsx đang import.
- Test: `test-fonts.sh` 7/7 PASS (59 fonts, phân bố 24/10/11/7/7).

### 3. LUT: 104 → 134 (+30 tự chế, gen_vcut_luts3.py)
- Tác phẩm gốc 100%, không copy từ nguồn nào. Lưới 17³, chuẩn Adobe .cube
  (4913 dòng/file, đã kiểm tra).
- Catalog cập nhật ở cả 3 nơi bắt buộc: `lut.ts` (LUT_IDS + LUT_META),
  `lut.js` mirror, `previewEngine.ts` (LUT_CSS) và `LutPicker.tsx` (CSS_APPROX).
  Test preview-engine bắt buộc mọi LUT id đều có CSS: 228/228 PASS.
- Render thật: spec có LUT `vcut-lagoon` cho frame khác bản đối chứng
  (mean abs diff 13.39 toàn khung, 15.33 ở góc).

### 4. Sound: 948 → 983 (+35 tổng hợp gốc, gen_vcut_sounds.py)
- Tổng hợp bằng numpy (sin/vuông/noise + lọc 1 cực + envelope), mã hoá OGG
  Vorbis bằng ffmpeg. Không sample từ nguồn nào → license MIT của repo.
- Lấp đúng gap "whoosh CC0" mà Batch I ghi nhận: 6 whoosh + 4 riser mới.
- 35/35 file ffprobe đọc được (Ogg Vorbis).
- Render thật: spec có audio `vcut-synth-whoosh-up.ogg` xuất ra MP4 có
  track AAC, 3.0s.

## Nguồn đã xét và TỪ CHỐI (ghi rõ lý do)

- **OpenMoji**: CC-BY-SA 4.0 — ShareAlike không tương thích MIT (đã từ chối từ Batch I).
- **Zapsplat / Mixkit / Uppbeat**: license custom riêng, yêu cầu attribution
  hoặc cấm phân phối lại trong thư viện — cùng lý do từ chối như Sonniss GDC
  ở Batch I. Không nhập.
- **Freesound**: license per-file, cần API key để lọc CC0 hàng loạt — không
  harvest hàng loạt được trong phạm vi K6.
- **Font không có subset "vietnamese"** (DM Sans, Sora, Outfit, PT Sans,
  Ubuntu, Jost, Noto Sans, PT Serif, Source Serif 4, Libre Baskerville, Domine,
  Caveat, Kalam, Satisfy, Fira Code, Ubuntu Mono, PT Mono, Righteous, Fredoka,
  Titan One, Luckiest Guy, Zilla Slab): METADATA.pb đã đọc trực tiếp, chỉ có
  latin/latin-ext — loại theo đúng quy tắc Batch I (tránh font TTF latin-only).
- **Emoji tay của Fluent** (thumbs up, waving hand...): thư mục/không tồn tại
  dưới tên CLDR thử nghiệm — bỏ qua, không đoán tên file.

## Giới hạn còn lại

- Binary (PNG/OGG/cube/TTF) KHÔNG push được qua push_files — chỉ push script
  + manifest + code, như mẫu Batch I. Người dùng chạy fetch script sau clone.
- Sticker Fluent là ảnh tĩnh 3D, không phải sticker động (K3 lo WebP/APNG).
- LUT mới chỉ có CSS xấp xỉ ở preview; màu chính xác chỉ thấy ở bản render.
- Sound tổng hợp là âm thanh điện tử (synth), không thay thế được recording
  thật (tiếng mưa, đám đông, nhạc cụ thật).
- `apps/web` tsc còn 1 lỗi tại `LutPicker.tsx` dòng import handler của K3
  (`onChange(id)` thiếu cast `as UserLutId`, mẫu đã có ở dòng 284) — file này
  K3 đang sửa trực tiếp lúc K6 báo cáo, nên K6 không đụng vào để tránh xung đột.
  Lỗi này KHÔNG do K6 gây ra (K6 chỉ thêm CSS_APPROX vào file đó).

## File tạo/sửa (KHÔNG push — parent push)

Tạo: `assets/stickers/fetch_stickers2.sh`, `assets/filters/gen_vcut_luts3.py`,
30 file `assets/filters/vcut-*.cube`, `assets/sounds/gen_vcut_sounds.py`,
35 file `assets/audio/vcut-synth-*.ogg`, `assets/fonts/gen_fonts_ts.py`,
`assets/K6_LIMITS.md`.
Sửa: `assets/stickers/sticker-manifest.json`, `packages/video-spec/src/sticker.ts`,
`packages/video-spec/src/lut.ts`, `server/render/src/lut.js`,
`apps/web/src/lib/previewEngine.ts`, `apps/web/src/components/lut/LutPicker.tsx`,
`apps/web/src/lib/fonts.ts`, `assets/fonts/catalog.json`,
`assets/fonts/fetch_fonts.sh`, `assets/fonts/gen_fonts_ts.py` (mới),
`assets/sounds/index.json`, `assets/SOURCES.md`,
`assets/stickers/test_stickers3.py`, `apps/web/scripts/fonts.test.cjs`,
`apps/web/scripts/preview-engine.test.cjs`, `apps/web/src/components/FontPicker.tsx`.
